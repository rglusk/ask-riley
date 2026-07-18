import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import knowledge from "../data/knowledge.json" with { type: "json" };
import { z } from "zod";

// stdout is reserved for MCP protocol messages, so timing goes to stderr.
function withTiming<Args extends unknown[], Result>(
    name: string,
    handler: (...args: Args) => Promise<Result>
) {
    return async (...args: Args) => {
        const start = performance.now();
        try {
            return await handler(...args);
        } finally {
            const durationMs = performance.now() - start;
            console.error(`[timing] ${name} ${durationMs.toFixed(1)}ms`);
        }
    };
}

export function createMcpServer() {
    const server = new McpServer({
        name: "ask-riley",
        version: "0.1.0"
    });

    server.registerTool(
        "get-contact",
        {
            title: "Get Riley's contact info",
            description: "Riley Glusker's contact information: email, LinkedIn, location. Use only when asked how to reach, hire, or meet Riley.",
            inputSchema: {},
        },
        withTiming("get-contact", async () => ({
            content: [{ type: "text", text: JSON.stringify(knowledge.contact, null, 2) }],
        }))
    );

    server.registerTool(
        "get-overview",
        {
            title: "Get a full overview of Riley",
            description: "Single-call summary of Riley: headline, bio, current role, a condensed list of all projects, leadership highlights, and skills. Use this FIRST for broad questions like 'tell me about Riley' instead of calling get-contact, get-project, and search-experience separately. Follow up with get-project for depth on one specific project.",
            inputSchema: {},
        },
        withTiming("get-overview", async () => {
            const overview = {
                profile: knowledge.profile,
                currentRole: knowledge.experience[0],
                projects: knowledge.projects.map(({ id, name, role, description }) => ({ id, name, role, description })),
                leadership: knowledge.leadership,
                skills: knowledge.skills,
            };
            return {
                content: [{ type: "text", text: JSON.stringify(overview, null, 2) }],
            };
        })
    );

    server.registerTool(
        "get-project",
        {
            title: "Get info about a past project",
            description: "Full details of ONE specific project, including metrics and highlights not included in get-overview. Use only for follow-up depth when a particular project is being discussed — do not call this for every project to answer broad questions about Riley (use get-overview for that).",
            inputSchema: z.object({
                id: z.enum(knowledge.projects.map((p) => p.id), {}).describe("Which project to fetch"),
            }),
        },
        withTiming("get-project", async ({ id }: { id: string }) => {
            const project = knowledge.projects.find((p) => p.id === id);
            if (!project) {
                throw new Error(`Project with ID ${id} not found`);
            }
            return {
                content: [{ type: "text", text: JSON.stringify(project, null, 2) }]
            };
        })
    );

    server.registerTool(
        "search-experience",
        {
            title: "Search Riley's experience",
            description: "Keyword search over Riley's projects. Use when asked about a specific topic or technology (e.g. 'streaming', 'AI') to find which projects match. For general 'tell me about Riley' questions, use get-overview instead of searching.",
            inputSchema: z.object({
                keywords: z.string().describe("Keywords to search for in Riley's experience")
            })
        },
        withTiming("search-experience", async ({ keywords }: { keywords: string }) => {
            keywords = keywords.toLowerCase();
            const results = knowledge.projects.filter((proj) =>
                proj.description.toLowerCase().includes(keywords) || proj.name.toLowerCase().includes(keywords)
            );
            return {
                content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
            };
        })
    )

    return server;
}
