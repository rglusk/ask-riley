"use client";

import { useEffect, useRef, useState } from "react";
import type Anthropic from "@anthropic-ai/sdk";
import { ChatResponse, type Block } from "@ask-riley/schema";
import { EnvelopeView } from "@/components/blocks/EnvelopeView";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import type { ChatEvent } from "@/lib/agent";
import ReactMarkdown from "react-markdown";
import { InkFrame } from "@/components/InkFrame";
import { InkArrow } from "@/components/InkArrow";
import { InkStar } from "@/components/InkStar";
import { InkHand } from "@/components/InkHand";

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
    const [pMeta, setPMeta] = useState<{ state: ChatResponse["state"]; intent: string | null } | null>(null);
    const [pBlocks, setPBlocks] = useState<Block[]>([]);
    const [pText, setPText] = useState("");

    // chunk queue: network deltas land in a ref (no render), a jittered timer
    // drains a few characters per tick into rendered state — bursty transport,
    // smooth typewriter. Riley's WebSocket pattern, reborn over SSE.
    const queueRef = useRef("");
    const drainingRef = useRef(false);

    // `done` parks its payload here: the canonical swap waits until the
    // typewriter finishes draining, so the stream is never blotted over
    const pendingDoneRef = useRef<Anthropic.MessageParam[] | null>(null);
    function finalizeDone() {
        const payload = pendingDoneRef.current;
        if (!payload) return;
        pendingDoneRef.current = null;
        suppressScrollRef.current = true; // no yank on the canonical swap
        setMessages(payload);
        resetProvisional();
        setStatusLine("");
        setLoading(false);
    }

    function pumpQueue() {
        if (drainingRef.current) return;
        drainingRef.current = true;
        const tick = () => {
            const q = queueRef.current;
            if (!q.length) {
                drainingRef.current = false;
                finalizeDone(); // stream ended while we were still typing? swap now
                return;
            }
            // drain faster when the backlog is deep so we never lag the stream badly
            const n = q.length > 220 ? 10 : 1 + Math.floor(Math.random() * 3);
            queueRef.current = q.slice(n);
            setPText((prev) => prev + q.slice(0, n));
            setTimeout(tick, 24 + Math.random() * 56);
        };
        tick();
    }
    function resetProvisional() {
        queueRef.current = "";
        drainingRef.current = false;
        setPMeta(null);
        setPBlocks([]);
        setPText("");
    }

    const [input, setInput] = useState("");

    // hide the portrait blob if the photo is missing — onError alone misses
    // failures that happen before hydration, so also check on mount
    const [portraitOk, setPortraitOk] = useState(true);
    const portraitRef = useRef<HTMLImageElement>(null);
    useEffect(() => {
        const img = portraitRef.current;
        if (img && img.complete && img.naturalWidth === 0) setPortraitOk(false);
    }, []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // keep the newest message in view while streaming — but on `done` (the
    // canonical swap) never yank the reader; if the swap left content below
    // the viewport, offer a "more below" chip instead
    const scrollRef = useRef<HTMLDivElement>(null);
    const suppressScrollRef = useRef(false);
    const [showMoreChip, setShowMoreChip] = useState(false);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        if (suppressScrollRef.current) {
            suppressScrollRef.current = false;
            const overflow = el.scrollHeight - el.scrollTop - el.clientHeight;
            if (overflow > 60) setShowMoreChip(true);
            return;
        }
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, [messages, pText, pBlocks, statusLine, loading]);

    // rows that have already rendered must not replay their entrance animation —
    // otherwise a large re-render (the done swap) fades the whole thread from
    // blank, which reads as a white blink
    const animatedCountRef = useRef(0);
    useEffect(() => {
        animatedCountRef.current = messages.length;
    }, [messages]);

    function scrollToBottom() {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        setShowMoreChip(false);
    }

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
                        resetProvisional(); // a tool turn follows; discard any stray preamble
                    } else if (event.type === "meta") {
                        setStatusLine("");
                        setPMeta({ state: event.state, intent: event.intent });
                    } else if (event.type === "text") {
                        queueRef.current += event.delta;
                        pumpQueue();
                    } else if (event.type === "block") {
                        setPBlocks((prev) => [...prev, event.block]);
                    } else if (event.type === "done") {
                        pendingDoneRef.current = event.messages;
                        // queue already drained? swap right away; otherwise the pump will
                        if (!drainingRef.current && queueRef.current.length === 0) {
                            finalizeDone();
                        }
                        return;
                    } else if (event.type === "error") {
                        throw new Error(event.message);
                    }
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "something went wrong");
        } finally {
            // provisional state never outlives the request — but if a done payload
            // is parked behind a draining queue, the pump finalizes instead of us
            if (!pendingDoneRef.current) {
                setStatusLine("");
                resetProvisional();
                setLoading(false);
            }
        }
    }

    function send(e: React.FormEvent) {
        e.preventDefault();
        sendQuestion(input);
    }

    return (
        // h-dvh + flex column: hero and form take what they need, the chat
        // frame flexes to fill whatever viewport height remains
        <div className="flex h-dvh flex-col">
            <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-5 pb-4 pt-4">
                <section
                    className="mb-5 shrink-0 text-center"
                    style={{ animation: "fadeUp 0.6s ease both" }}
                >
                    <div className="flex items-center justify-center gap-6">
                        <h1
                            className="font-accent italic"
                            style={{
                                fontSize: "clamp(40px, 6.5vw, 58px)",
                                margin: 0,
                                transform: "rotate(-1deg)",
                            }}
                        >
                            Hi, I&apos;m Riley.
                        </h1>
                        {/* arrow: tail starts at the "y", head points at the portrait */}
                        {portraitOk && (
                            <InkArrow className="-ml-2 mt-6 shrink-0" width={76} flip rotate={-8} />
                        )}
                        {/* portrait: floating head cutout, hand-drawn stars around it;
                            tilts on hover like a nod */}
                        {portraitOk && (
                            <span className="group relative inline-block shrink-0">
                                <InkStar size={22} rotate={-12} className="pointer-events-none absolute -left-4 top-0" />
                                <InkStar size={14} rotate={20} filled className="pointer-events-none absolute -top-3 right-6" />
                                <InkStar size={26} rotate={8} className="pointer-events-none absolute -right-5 top-5" />
                                {/* waving hand: appears when the head is hovered */}
                                <span
                                    className="pointer-events-none absolute -right-12 bottom-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                                    style={{ animation: "handWave 0.8s ease-in-out infinite", transformOrigin: "30% 95%" }}
                                >
                                    <InkHand size={54} />
                                </span>
                                <img
                                    ref={portraitRef}
                                    src="/photos/riley-head.png"
                                    alt="Riley, smiling"
                                    onError={() => setPortraitOk(false)}
                                    className="cursor-pointer transition-transform duration-300 ease-out hover:rotate-6"
                                    style={{
                                        width: "clamp(84px, 11vw, 118px)",
                                        height: "auto",
                                        transformOrigin: "50% 85%",
                                        // hard hand-cut bottom edge (wavy), matching the ink style
                                        maskImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='M0 0 H100 V85 C90 91 80 83 68 89 C56 95 46 87 34 92 C24 96 12 89 0 94 Z'/></svg>")`,
                                        maskSize: "100% 100%",
                                    }}
                                />
                            </span>
                        )}
                    </div>
                    <p className="mx-auto mb-1 mt-1.5 max-w-lg text-[17px] leading-normal text-ink-soft">
                        Ask me about the movies I love, my work, or how to reach me — I&apos;m a
                        little bit of a chatbot about it.
                    </p>
                </section>

                <InkFrame
                    radius="18px 26px 20px 30px"
                    background="var(--color-card)"
                    shadow="5px 5px 0"
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div
                        ref={scrollRef}
                        onScroll={() => {
                            const el = scrollRef.current;
                            if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
                                setShowMoreChip(false);
                            }
                        }}
                        className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-5 py-6"
                    >
                        {messages.length === 0 && (
                            <div className="justify-end">
                                <div className="flex flex-wrap justify-center gap-2">
                                    {SEED_CHIPS.map((chip) => (
                                        <button key={chip} onClick={() => sendQuestion(chip)} className="cursor-pointer">
                                            <InkFrame radius="10px 14px 12px 16px" background="var(--color-paper)" borderWidth={2} shadow={null}>
                                                <span className="block px-3.5 py-1.5 text-[13px] font-medium">{chip}</span>
                                            </InkFrame>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => {
                            // user turns: blue bubble, right tail, slight tilt
                            const entrance =
                                i >= animatedCountRef.current
                                    ? { animation: "fadeUp 0.4s ease both" }
                                    : undefined;

                            if (typeof msg.content === "string") {
                                return (
                                    <div key={i} className="flex justify-end" style={entrance}>
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
                                    <div key={i} style={entrance}>
                                        <EnvelopeView response={envelope} onSuggestion={sendQuestion} />
                                    </div>
                                );
                            }

                            // everything else: tool turns and tool-call preambles (hidden),
                            // legacy/fallback prose (shown)
                            if (msg.content.some((block) => block.type === "tool_use")) return null;
                            const textBlocks = msg.content.filter((block) => block.type === "text");
                            if (textBlocks.length === 0) return null;
                            // degraded/legacy prose still gets a proper speech bubble
                            return (
                                <div key={i} className="flex" style={entrance}>
                                    <InkFrame
                                        radius="16px 20px 18px 4px"
                                        background="var(--color-card)"
                                        borderWidth={2}
                                        shadow={null}
                                        rotate={-0.6}
                                        className="max-w-[82%]"
                                    >
                                        <div className="px-4 py-3 text-[15px] leading-normal">
                                            {textBlocks.map((block, j) => (
                                                <span key={j}>{block.text}</span>
                                            ))}
                                        </div>
                                    </InkFrame>
                                </div>
                            );
                        })}

                        {/* in-flight response: streams in as a provisional envelope,
                            replaced by the canonical one when `done` arrives */}
                        {loading && (pMeta || pText || pBlocks.length > 0) && (
                            <div className="flex flex-col gap-3">
                                {pMeta?.intent && (
                                    <span className="w-fit text-[11px] uppercase tracking-wider opacity-45">
                                        {pMeta.intent}
                                    </span>
                                )}
                                {pText && (
                                    <div className="flex">
                                        <InkFrame
                                            radius="16px 20px 18px 4px"
                                            background="var(--color-card)"
                                            borderWidth={2}
                                            shadow={null}
                                            rotate={-0.6}
                                            className="max-w-[82%]"
                                        >
                                            <div className="space-y-2 px-4 py-3 text-[15px] leading-normal [&_p]:m-0 [&_strong]:font-bold [&_p:last-of-type]:inline">
                                                {/* markdown re-parses on every drain tick: **bold** styles
                                                    the moment its closing marks arrive, mid-stream */}
                                                <ReactMarkdown>{pText}</ReactMarkdown>
                                                <span
                                                    aria-hidden
                                                    className="ml-0.5 inline-block h-[1em] w-[7px] translate-y-[2px] bg-ink"
                                                    style={{ animation: "caretBlink 0.9s steps(1) infinite" }}
                                                />
                                            </div>
                                        </InkFrame>
                                    </div>
                                )}
                                {pBlocks.length > 0 && (
                                    <div className="mt-2 flex flex-col gap-4">
                                        {pBlocks.map((block, i) => (
                                            <div key={i} style={{ animation: "fadeUp 0.4s ease both" }}>
                                                <BlockRenderer block={block} index={i} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* thinking state: nothing has streamed yet */}
                        {loading && !pText && pBlocks.length === 0 && (
                            <div className="flex items-center gap-1.5 text-[13.5px] italic opacity-60">
                                {statusLine || "thinking"}
                                {[0, 1, 2].map((i) => (
                                    <span
                                        key={i}
                                        className="inline-block h-1 w-1 rounded-full bg-ink"
                                        style={{ animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
                                    />
                                ))}
                            </div>
                        )}

                        {error && <div className="text-[13.5px] text-red-700">error: {error}</div>}
                    </div>

                    {showMoreChip && (
                        <button
                            onClick={scrollToBottom}
                            className="absolute bottom-24 left-1/2 z-10 -translate-x-1/2 cursor-pointer"
                            style={{ animation: "fadeUp 0.3s ease both" }}
                        >
                            <InkFrame radius="12px 16px 10px 14px" background="var(--color-paper)" borderWidth={2} shadow="2px 2px 0">
                                <span className="block px-3.5 py-1.5 text-xs font-medium">↓ more below</span>
                            </InkFrame>
                        </button>
                    )}

                    <form onSubmit={send} className="flex shrink-0 gap-2.5 px-5 pb-5">
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

                <footer className="mt-3 shrink-0 text-center text-[12.5px] opacity-50">
                    made by Riley · 2026
                </footer>
            </main>
        </div>
    );
}
