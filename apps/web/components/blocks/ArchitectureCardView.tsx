import type { ArchitectureCard } from "@ask-riley/schema";
import { InkFrame } from "../InkFrame";

// The real architecture of this bot, held in code (not authored by the model).
// Full-width flow: your question travels right, cards stream back left.
const NODES = [
    { title: "You", sub: "browser · React", tone: "var(--color-bubble-user)" },
    { title: "/api/chat", sub: "agent loop · SSE stream", tone: "var(--color-pastel-peach)" },
    { title: "Claude", sub: "Anthropic API", tone: "var(--color-pastel-lavender)" },
    { title: "MCP server", sub: "Riley-knowledge tools", tone: "var(--color-pastel-green)" },
    { title: "knowledge.json", sub: "the facts", tone: "var(--color-pastel-butter)" },
];

export function ArchitectureCardView({ caption }: Omit<ArchitectureCard, "type">) {
    return (
        <InkFrame
            radius="18px 26px 20px 28px"
            background="var(--color-card)"
            shadow="5px 5px 0"
            rotate={-0.4}
            className="w-full"
        >
            <div className="flex flex-col gap-3 p-4 sm:p-5">
                <p className="m-0 text-[13px] leading-normal opacity-75">
                    {caption ?? "How this bot works — a tiny server-driven UI system, built by Riley:"}
                </p>

                {/* the flow: nodes left→right on desktop (centered as a group),
                    stacked on mobile */}
                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center">
                    {NODES.map((node, i) => (
                        <div key={node.title} className="flex items-center gap-2 sm:flex-col sm:gap-2">
                            <InkFrame
                                radius="11px 15px 10px 14px"
                                background={node.tone}
                                borderWidth={2}
                                shadow="2px 2px 0"
                                rotate={i % 2 === 0 ? -1 : 1}
                                className="flex-1 sm:w-full sm:flex-none"
                            >
                                <div className="px-3 py-2 text-center">
                                    <div className="font-accent italic text-[15px] leading-tight">{node.title}</div>
                                    <div className="text-[10.5px] uppercase tracking-wide opacity-65">{node.sub}</div>
                                </div>
                            </InkFrame>
                            {i < NODES.length - 1 && <Connector />}
                        </div>
                    ))}
                </div>

                {/* return path: the arrow drops out of knowledge.json (the last
                    node, right end) and points back at the streams-back text */}
                <div className="flex items-center justify-end gap-2 text-[11.5px] italic opacity-70 sm:pr-8">
                    <span className="text-right">…and the answer streams back as hand-drawn cards, composed by Claude.</span>
                    <ReturnArrow />
                </div>
            </div>
        </InkFrame>
    );
}

// a small ink connector arrow — points right on desktop, down on mobile
function Connector() {
    return (
        <svg
            aria-hidden
            viewBox="0 0 40 24"
            className="shrink-0 rotate-90 sm:rotate-0"
            style={{ width: 30, height: 18, filter: "url(#inkRough)" }}
        >
            <path d="M3 12 C14 9 24 15 33 12" fill="none" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M27 6 L35 12 L27 18" fill="none" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// hooks down out of knowledge.json, then curls left to point at the text
function ReturnArrow() {
    return (
        <svg
            aria-hidden
            viewBox="0 0 36 30"
            className="-mt-3 shrink-0"
            style={{ width: 30, height: 25, filter: "url(#inkRough)" }}
        >
            <path
                d="M28 2 C30.5 9, 29.5 15, 23 18.2 C18.5 20.3, 13 20.5 8 20.5"
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth="2.6"
                strokeLinecap="round"
            />
            <path
                d="M14.5 14.5 L6 20.5 L14.5 26.5"
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
