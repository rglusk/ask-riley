import { runAgentLoop, type ChatEvent } from "@/lib/agent";
import { isRateLimited } from "@/lib/rate-limit";

// the agent loop is multi-turn (model → tool → model, streaming); on Vercel the
// default function window would cut slow turns off mid-stream
export const maxDuration = 60;

// the route: pure transport plumbing — open a stream, run the loop into it, close
export async function POST(req: Request) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(ip)) {
        return new Response("rate limit exceeded — try again in a few minutes", { status: 429 });
    }

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
