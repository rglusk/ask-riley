import { runAgentLoop, type ChatEvent } from "@/lib/agent";

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
