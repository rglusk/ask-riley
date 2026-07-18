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

const question = process.argv[2] ?? "What's Riley's most impressive project?";
const messages: Anthropic.MessageParam[] = [{
    role: "user", content: question
}];

while (true) {
    const resp = await anthropic.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 1000,
        tools,
        messages,
    });

    messages.push({ role: "assistant", content: resp.content });

    if (resp.stop_reason !== "tool_use") {
        for (const block of resp.content) {
            if (block.type === "text") console.log(`\nA: ${block.text}`);
        }
        break;
    }

    const results: Anthropic.ToolResultBlockParam[] = [];

    for (const block of resp.content) {
        if (block.type !== "tool_use") continue;

        console.log(`  → ${block.name}(${JSON.stringify(block.input)})`);

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

