# MCP Primer — for ask-riley

> Working notes for Riley while building `@ask-riley/mcp`. Like PLAN.md, delete or move before
> the repo goes public (or keep it — "here's how I learned this" is a fine look).

## The one-paragraph version

MCP (Model Context Protocol) is a standard way for an AI model's host application to discover
and use external capabilities. A **server** (your code) exposes capabilities; a **client**
(inside a host like Claude, the Inspector, or your own web app) connects to it, asks "what can
you do?", and calls what it needs. The wire format is JSON-RPC 2.0 over a **transport**
(stdio locally, Streamable HTTP remotely). That's it — the rest is vocabulary.

## The three capability types

| Type | Controlled by | Mental model | ask-riley use |
|---|---|---|---|
| **Tools** | the model | Functions the LLM decides to call | `search_experience`, `get_project`, `get_contact` |
| **Resources** | the application | Documents/data the host can attach as context | maybe: resume text, `knowledge.json` itself |
| **Prompts** | the user | Reusable prompt templates the user picks | maybe: "interview Riley about X" starter |

Start with tools only. Tools are 90% of real-world MCP, and they're the part with the agent-loop
payoff. Add a resource or a prompt later as a stretch exercise — good to know all three exist so
you can say why you chose tools.

## Lifecycle (what you'll see in the Inspector)

1. `initialize` — client sends its protocol version + capabilities; server replies with its own
   (name, version, "I have tools"). This is the handshake.
2. `notifications/initialized` — client confirms. Session is live.
3. `tools/list` — client asks what tools exist. Server returns each tool's name, description,
   and **JSON Schema for its inputs**. This schema is what the LLM reads to decide how to call.
4. `tools/call` — name + arguments in, result content back.

Insight worth internalizing: **descriptions are the API.** The model chooses tools based purely
on the name/description/schema text. Writing them is prompt engineering, not documentation.

## The SDK shape (TypeScript)

Packages: `@modelcontextprotocol/sdk` (server + client + transports) and `zod` (schemas).

```ts
// server.ts — the transport-agnostic heart
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function createServer() {
  const server = new McpServer({ name: "ask-riley", version: "0.1.0" });

  server.registerTool(
    "get_contact",
    {
      title: "Get contact info",
      description: "Riley Glusker's contact details: email, LinkedIn, location.",
      inputSchema: {},            // zod fields go here for tools with inputs
    },
    async () => ({
      content: [{ type: "text", text: JSON.stringify({ /* ... */ }) }],
    })
  );

  return server;
}
```

```ts
// stdio.ts — entry point #1
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

const transport = new StdioServerTransport();
await createServer().connect(transport);
```

Notes:
- Input schemas are zod fields (e.g. `{ query: z.string().describe("free-text search over
  Riley's work history") }`). `.describe()` text is read by the model — write it carefully.
- Tool results are a `content` array (text/image/etc.). Text containing JSON is normal and fine.
- **stdio rule: never `console.log` in server code** — stdout *is* the protocol channel; a stray
  log corrupts the JSON-RPC stream. Use `console.error` (stderr) for debugging.
- `server.ts` exports a factory and runs nothing at import time — that's what lets stdio.ts and
  the future Next route handler share it.

## Transports

- **stdio**: client spawns your process, speaks JSON-RPC over stdin/stdout. Zero network. This is
  local-dev mode and what the Inspector/Claude Desktop use for local servers.
- **Streamable HTTP**: client POSTs messages to one endpoint (`/mcp`); responses are JSON or an
  SSE stream on the same request. This is remote mode — the Next route handler, the public
  connector URL. (Older docs mention a separate "SSE transport" — deprecated, ignore it.)

Same `createServer()`, different wiring. That symmetry is the architecture story.

## Milestones

1. **Hello server**: `get_contact` hardcoded → connect from Inspector over stdio → watch the
   handshake and call it. (Inspector transport: STDIO; command: `node`; args: path to built
   stdio.js — or `tsx src/stdio.ts` to skip a build step during dev.)
2. **Real data**: tools read `knowledge.json`; add `search_experience(query)` + `get_project(id)`.
   Test tool-description quality: does the Inspector's LLM… no — does *Claude*, once connected,
   pick the right tool for "what did Riley ship at Airbnb?"
3. **Connect to a real host**: register the stdio server in Claude Code/Desktop config; ask
   questions; watch tool calls happen from a real model.
4. **Go remote**: Next route handler + Streamable HTTP + deploy → add as connector by URL.

## Reading list

- Concepts: https://modelcontextprotocol.io (architecture, tools, transports pages)
- SDK: https://github.com/modelcontextprotocol/typescript-sdk (README examples)
- Spec (skim lifecycle): https://modelcontextprotocol.io/specification
