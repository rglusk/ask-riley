"use client";

import { useState } from "react";
import type Anthropic from "@anthropic-ai/sdk";
import { ChatResponse } from "@ask-riley/schema";
import { EnvelopeView } from "@/components/blocks/EnvelopeView";
import { InkFrame } from "@/components/InkFrame";

// mirror of the server's ChatEvent — worth centralizing in packages/schema later
type ChatEvent =
    | { type: "delta"; text: string }
    | { type: "status"; tool: string; input: unknown }
    | { type: "done"; response: ChatResponse; messages: Anthropic.MessageParam[] }
    | { type: "error"; message: string };

const SEED_CHIPS = [
    "What movies does Riley love?",
    "What has Riley built?",
    "How do I reach her?",
];

function parseEnvelope(msg: Anthropic.MessageParam): ChatResponse | null {
    if (msg.role !== "assistant" || typeof msg.content === "string") return null;
    const raw = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    if (!raw) return null;
    try {
        const parsed = ChatResponse.safeParse(JSON.parse(raw));
        return parsed.success ? parsed.data : null;
    } catch {
        return null;
    }
}

export default function Home() {
    // canonical state: only ever set from the server's `done` event
    const [messages, setMessages] = useState<Anthropic.MessageParam[]>([]);

    // provisional state: exists only while a response is in flight
    const [statusLine, setStatusLine] = useState("");

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // core send logic, callable from anywhere that has a question:
    // the form (via send) or a clicked suggestion chip (directly)
    async function sendQuestion(question: string) {
        if (!question.trim() || loading) return;

        const next: Anthropic.MessageParam[] = [
            ...messages,
            { role: "user", content: question },
        ];
        setMessages(next);
        setInput("");
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ messages: next }),
            });
            if (!res.ok || !res.body) {
                throw new Error(`request failed (${res.status})`);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                let i;
                while ((i = buffer.indexOf("\n\n")) >= 0) {
                    const chunk = buffer.slice(0, i);
                    buffer = buffer.slice(i + 2);
                    if (!chunk.startsWith("data: ")) continue;

                    let event: ChatEvent;
                    try {
                        event = JSON.parse(chunk.slice(6));
                    } catch {
                        continue; // malformed frame — skip it, don't kill the stream
                    }

                    if (event.type === "status") {
                        setStatusLine(`checking ${event.tool.replace(/^get-/, "").replace(/-/g, " ")}…`);
                    } else if (event.type === "done") {
                        setMessages(event.messages);
                        return;
                    } else if (event.type === "error") {
                        throw new Error(event.message);
                    }
                    // delta events are JSON syntax fragments in the envelope era —
                    // ignored until the progressive block-streaming upgrade
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "something went wrong");
        } finally {
            // provisional state never outlives the request
            setStatusLine("");
            setLoading(false);
        }
    }

    function send(e: React.FormEvent) {
        e.preventDefault();
        sendQuestion(input);
    }

    return (
        <div className="min-h-screen">
            <main className="relative z-10 mx-auto max-w-3xl px-5 pb-24 pt-10">
                <section className="mb-7 text-center" style={{ animation: "fadeUp 0.6s ease both" }}>
                    <h1
                        className="font-accent italic"
                        style={{
                            fontSize: "clamp(40px, 6.5vw, 58px)",
                            margin: "0 0 6px",
                            transform: "rotate(-1deg)",
                        }}
                    >
                        Hi, I&apos;m Riley.
                    </h1>
                    <p className="mx-auto mb-1 max-w-lg text-[17px] leading-normal text-ink-soft">
                        Ask me about the movies I love, my work, or how to reach me — I&apos;m a
                        little bit of a chatbot about it.
                    </p>
                </section>

                <InkFrame radius="18px 26px 20px 30px" background="var(--color-card)" shadow="5px 5px 0">
                    <div className="flex max-h-160 flex-col gap-7 overflow-y-auto px-5 py-6">
                        {messages.length === 0 && (
                            <div className="flex flex-wrap justify-center gap-2 py-8">
                                {SEED_CHIPS.map((chip) => (
                                    <button key={chip} onClick={() => sendQuestion(chip)} className="cursor-pointer">
                                        <InkFrame radius="10px 14px 12px 16px" background="var(--color-paper)" borderWidth={2} shadow={null}>
                                            <span className="block px-3.5 py-1.5 text-[13px] font-medium">{chip}</span>
                                        </InkFrame>
                                    </button>
                                ))}
                            </div>
                        )}

                        {messages.map((msg, i) => {
                            // user turns: blue bubble, right tail, slight tilt
                            if (typeof msg.content === "string") {
                                return (
                                    <div key={i} className="flex justify-end" style={{ animation: "fadeUp 0.4s ease both" }}>
                                        <InkFrame
                                            radius="20px 16px 4px 18px"
                                            background="var(--color-bubble-user)"
                                            borderWidth={2}
                                            shadow={null}
                                            rotate={0.6}
                                            className="max-w-[78%]"
                                        >
                                            <div className="px-4 py-3 text-[15px] leading-snug">{msg.content}</div>
                                            <div
                                                aria-hidden
                                                style={{
                                                    position: "absolute",
                                                    right: 14,
                                                    bottom: -9,
                                                    width: 14,
                                                    height: 14,
                                                    background: "var(--color-bubble-user)",
                                                    borderRight: "2px solid var(--color-ink)",
                                                    borderBottom: "2px solid var(--color-ink)",
                                                    borderBottomRightRadius: 3,
                                                    transform: "rotate(45deg)",
                                                }}
                                            />
                                        </InkFrame>
                                    </div>
                                );
                            }

                            // assistant turns with a valid envelope → block rendering
                            const envelope = parseEnvelope(msg);
                            if (envelope) {
                                return (
                                    <div key={i} style={{ animation: "fadeUp 0.4s ease both" }}>
                                        <EnvelopeView response={envelope} onSuggestion={sendQuestion} />
                                    </div>
                                );
                            }

                            // everything else: tool turns and tool-call preambles (hidden),
                            // legacy/fallback prose (shown)
                            if (msg.content.some((block) => block.type === "tool_use")) return null;
                            const textBlocks = msg.content.filter((block) => block.type === "text");
                            if (textBlocks.length === 0) return null;
                            return (
                                <div key={i} className="text-[15px] opacity-80">
                                    {textBlocks.map((block, j) => (
                                        <span key={j}>{block.text}</span>
                                    ))}
                                </div>
                            );
                        })}

                        {loading && (
                            <div className="text-[13.5px] italic opacity-50">
                                {statusLine || "thinking…"}
                            </div>
                        )}

                        {error && <div className="text-[13.5px] text-red-700">error: {error}</div>}
                    </div>

                    <form onSubmit={send} className="flex gap-2.5 px-5 pb-5">
                        <InkFrame radius="14px" background="var(--color-card)" borderWidth={2} shadow={null} className="flex-1">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me anything…"
                                className="font-accent italic w-full bg-transparent px-4 py-3 text-[15px] outline-none"
                            />
                        </InkFrame>
                        <button disabled={loading} className="cursor-pointer disabled:opacity-50">
                            <InkFrame radius="12px 16px 14px 18px" background="var(--color-send)" borderWidth={2} shadow="3px 3px 0">
                                <span className="font-accent italic block px-5 py-3 text-lg">Send</span>
                            </InkFrame>
                        </button>
                    </form>
                </InkFrame>

                <footer className="mt-9 text-center text-[12.5px] opacity-50">
                    made by Riley · 2026
                </footer>
            </main>
        </div>
    );
}
