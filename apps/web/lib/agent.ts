import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "@ask-riley/mcp";
import { Block, ChatResponse } from "@ask-riley/schema";
import { parse as parsePartial, Allow } from "partial-json";
import { systemPrompt } from "./system-prompt";

const anthropic = new Anthropic();

// MCP client + tool list, built once per process on first use. Lazy rather than
// top-level await so this module imports cleanly from anywhere (route, scripts).
let contextPromise: Promise<{ mcpClient: Client; tools: Anthropic.Tool[] }> | null = null;

function getAgentContext() {
    contextPromise ??= (async () => {
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
        }));

        console.log("Tools discovered:", tools.map((tool) => tool.name).join(", "));

        return { mcpClient, tools };
    })();

    return contextPromise;
}

// events the loop emits — consumed by the route (as SSE) and by the eval
// harness (recorded in an array). The loop never knows which.
export type ChatEvent =
    | { type: "meta"; state: ChatResponse["state"]; intent: string | null }  // envelope head, parsed early
    | { type: "text"; delta: string }        // prose characters from text blocks (never JSON syntax)
    | { type: "block"; block: Block }        // a completed non-text block, ready to render
    | { type: "status"; tool: string; input: unknown }
    | { type: "done"; response: ChatResponse; messages: Anthropic.MessageParam[] }
    | { type: "error"; message: string };

function fallbackEnvelope(raw: string): ChatResponse {
    console.error("model output failed envelope validation — falling back to raw text");
    return {
        state: "answered",
        intent: null,
        blocks: [{ type: "text", markdown: raw }],
    };
}

// the agent loop: streams each model turn, executes tool calls against the
// MCP server, and reports progress through send()
export async function runAgentLoop(
    messages: Anthropic.MessageParam[],
    send: (event: ChatEvent) => void,
) {
    const { mcpClient, tools } = await getAgentContext();
    const MAX_TURNS = 10;

    for (let turn = 0; turn < MAX_TURNS; turn++) {
        const modelStream = anthropic.messages.stream({
            model: "claude-sonnet-5",
            max_tokens: 4000, // envelopes with several cards easily exceed 1000 — truncation = invalid JSON
            system: systemPrompt,
            tools,
            messages,
        });

        // incremental envelope streaming: parse the model's JSON as it arrives and
        // translate it into semantic events — meta early, prose as text deltas,
        // completed cards as block events. The client never sees JSON syntax.
        let jsonBuffer = "";
        let sentMeta = false;
        let sentTextChars = 0;
        const sentBlockIdx = new Set<number>();

        const concatText = (env: { blocks?: unknown[] }): string =>
            (Array.isArray(env.blocks) ? env.blocks : [])
                .filter((b): b is { type: "text"; markdown?: string } =>
                    typeof b === "object" && b !== null && (b as { type?: unknown }).type === "text")
                .map((b) => b.markdown ?? "")
                .join("\n\n");

        const streamEnvelope = (chunk: string) => {
            jsonBuffer += chunk;
            if (!jsonBuffer.trimStart().startsWith("{")) return; // not an envelope (prose turn)

            let partial: unknown;
            try {
                partial = parsePartial(jsonBuffer, Allow.ALL);
            } catch {
                return; // mid-token; wait for more
            }
            const env = partial as { state?: unknown; intent?: unknown; blocks?: unknown[] };

            if (!sentMeta && typeof env.state === "string") {
                sentMeta = true;
                send({
                    type: "meta",
                    state: env.state as ChatResponse["state"],
                    intent: typeof env.intent === "string" ? env.intent : null,
                });
            }

            // every block except the last is fully parsed; emit completed card blocks
            const blocks = Array.isArray(env.blocks) ? env.blocks : [];
            for (let i = 0; i < blocks.length - 1; i++) {
                if (sentBlockIdx.has(i)) continue;
                sentBlockIdx.add(i);
                const parsed = Block.safeParse(blocks[i]);
                if (parsed.success && parsed.data.type !== "text") {
                    send({ type: "block", block: parsed.data });
                }
            }

            // text blocks stream as they grow (their markdown only ever appends)
            const text = concatText(env);
            if (text.length > sentTextChars) {
                send({ type: "text", delta: text.slice(sentTextChars) });
                sentTextChars = text.length;
            }
        };

        for await (const event of modelStream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                streamEnvelope(event.delta.text);
            }
        }

        const resp = await modelStream.finalMessage();

        messages.push({ role: "assistant", content: resp.content });

        if (resp.stop_reason === "max_tokens") {
            console.error("response truncated at max_tokens — envelope will likely fail validation");
        }

        if (resp.stop_reason !== "tool_use") {
            // 1. extract the raw text the model emitted
            const raw = resp.content
                .filter((b) => b.type === "text")
                .map((b) => b.text)
                .join("");

            // 2. stage one: is it JSON?  (throws → hence try/catch)
            // 3. stage two: is it OUR JSON?  (safeParse → never throws, returns a verdict)
            let response: ChatResponse;
            try {
                const parsed = ChatResponse.safeParse(JSON.parse(raw));
                response = parsed.success ? parsed.data : fallbackEnvelope(raw);
            } catch {
                response = fallbackEnvelope(raw);   // wasn't even JSON
            }

            // finalize streaming against the validated envelope: flush any text
            // tail and any blocks the incremental parser hadn't completed
            const finalText = response.blocks
                .filter((b) => b.type === "text")
                .map((b) => b.markdown)
                .join("\n\n");
            if (finalText.length > sentTextChars) {
                send({ type: "text", delta: finalText.slice(sentTextChars) });
            }
            response.blocks.forEach((block, i) => {
                if (block.type !== "text" && !sentBlockIdx.has(i)) {
                    send({ type: "block", block });
                }
            });

            send({ type: "done", response, messages });
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
    const apology = "Sorry — I got lost gathering information and had to stop. Please try asking again, maybe more specifically.";
    messages.push({
        role: "assistant",
        content: [{ type: "text", text: apology }],
    });
    send({
        type: "done",
        response: {
            state: "answered",
            intent: null,
            blocks: [{ type: "text", markdown: apology }],
        },
        messages,
    });
}
