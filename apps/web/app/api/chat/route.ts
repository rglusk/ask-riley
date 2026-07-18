import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "@ask-riley/mcp";


// wire client to server, in memory
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

const mcpServer = createMcpServer();
await mcpServer.connect(serverTransport);

const mcpClient = new Client({
    name: "chat-loop",
    version: "0.1.0",
});
await mcpClient.connect(clientTransport);

const { tools: mcpTools } = await mcpClient.listTools();

const tools: Anthropic.Tool[] = mcpTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
}))

console.log("Tools discovered:", tools.map((tool) => tool.name).join(", "));

const anthropic = new Anthropic();

// events we send to the browser
type ChatEvent =
    | { type: "delta"; text: string }
    | { type: "status"; tool: string; input: unknown }
    | { type: "done"; messages: Anthropic.MessageParam[] }
    | { type: "error"; message: string };

// the agent loop: same logic as before streaming, but progress goes out
// through send() instead of console.log, and it streams each model turn
async function runAgentLoop(
    messages: Anthropic.MessageParam[],
    send: (event: ChatEvent) => void,
) {
    const MAX_TURNS = 10;

    for (let turn = 0; turn < MAX_TURNS; turn++) {
        const modelStream = anthropic.messages.stream({
            model: "claude-sonnet-5",
            max_tokens: 1000,
            tools,
            messages,
        });

        for await (const event of modelStream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                send({ type: "delta", text: event.delta.text });
            }
        }

        const resp = await modelStream.finalMessage();

        messages.push({ role: "assistant", content: resp.content });

        if (resp.stop_reason !== "tool_use") {
            send({ type: "done", messages });
            return;
        }

        const results: Anthropic.ToolResultBlockParam[] = [];

        for (const block of resp.content) {
            if (block.type !== "tool_use") continue;

            send({ type: "status", tool: block.name, input: block.input });

            const result = await mcpClient.callTool({
                name: block.name,
                arguments: block.input as Record<string, unknown>,
            })

            results.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: JSON.stringify(result.content),
            })
        }

        messages.push({ role: "user", content: results });
    }

    // hit MAX_TURNS without the model finishing — bail rather than burn tokens forever
    messages.push({
        role: "assistant",
        content: [{
            type: "text",
            text: "Sorry — I got lost gathering information and had to stop. Please try asking again, maybe more specifically.",
        }],
    });
    send({ type: "done", messages });
}

// the route: pure transport plumbing — open a stream, run the loop into it, close
export async function POST(req: Request) {
    const { messages } = await req.json();

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (event: ChatEvent) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            };

            try {
                await runAgentLoop(messages, send);
            } catch (err) {
                send({ type: "error", message: err instanceof Error ? err.message : "unknown error" });
            }
            controller.close();
        },
    });

    return new Response(stream, {
        headers: {
            "content-type": "text/event-stream",
            "cache-control": "no-cache",
        },
    });
}
