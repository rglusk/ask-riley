"use client";

import { useState } from "react";
import type { Block } from "@ask-riley/schema";
import { BlockRenderer } from "./BlockRenderer";
import { InkFrame } from "../InkFrame";

// Runs of 2+ consecutive cards of the SAME type render as a literal stack —
// the ones underneath peek out below the top card. Mixed types stay as
// separate items in the vertical flow (deliberate; may rethink later).
export function groupCardBlocks(blocks: Block[]): { start: number; blocks: Block[] }[] {
    const groups: { start: number; blocks: Block[] }[] = [];
    blocks.forEach((block, i) => {
        const last = groups[groups.length - 1];
        if (last && last.blocks[0].type === block.type) last.blocks.push(block);
        else groups.push({ start: i, blocks: [block] });
    });
    return groups;
}

const PEEK = 18; // px of each buried card left visible below the one above — enough to read every card in the fan
const MAX_PEEKS = 5; // deeper cards align with the fifth so a huge pile can't grow a giant tail
const SWAP_MS = 320;
const LIFT = "58%"; // of the card's own height — it visibly clears the pile before tucking under

export function CardStack({ blocks, baseIndex }: { blocks: Block[]; baseIndex: number }) {
    // order[0] is the top card; advancing tucks it to the bottom
    const [order, setOrder] = useState(() => blocks.map((_, i) => i));
    // "next": top card lifts out, then tucks under. "prev": the exact reverse —
    // the bottom card rises from behind the pile, then settles on top.
    const [phase, setPhase] = useState<null | "next" | "prev">(null);

    // cards can keep arriving while a response streams — slide them under
    if (order.length < blocks.length) {
        setOrder([...order, ...blocks.map((_, i) => i).slice(order.length)]);
    }

    function flip(dir: "next" | "prev") {
        if (phase || order.length < 2) return;
        setPhase(dir);
        // the lift runs first; the reorder swaps zIndex so the lifted card
        // slides back down on the other side of the pile
        setTimeout(() => {
            setOrder((o) => (dir === "next" ? [...o.slice(1), o[0]] : [o[o.length - 1], ...o.slice(0, -1)]));
            setPhase(null);
        }, SWAP_MS);
    }

    const peeks = Math.min(order.length - 1, MAX_PEEKS);

    return (
        // w-fit shrink-wraps to the card so the flip button can hug its edge.
        // grid: every card shares one cell, so the TALLEST card fixes the
        // container height — flipping between different-height cards never
        // shifts the dots, the button, or anything below the stack. Cards
        // anchor to the shared bottom edge, so the peek fan stays even too.
        <div className="relative grid w-fit">
            {order.map((blockIdx, depth) => {
                const isTop = depth === 0;
                const isBottom = depth === order.length - 1;
                // the lifted card: next lifts the top out, prev lifts the bottom
                // out from behind (its low zIndex keeps it behind the pile on the
                // way up; the reorder then flips which side it comes down on)
                const lifted = (phase === "next" && isTop) || (phase === "prev" && isBottom);
                // everyone else pre-shifts one slot toward their post-reorder spot,
                // so the reorder itself lands with no jump
                const shifted = phase === "next" ? depth - 1 : phase === "prev" ? depth + 1 : depth;
                const slot = Math.min(Math.max(shifted, 0), MAX_PEEKS);
                return (
                    <div
                        key={blockIdx}
                        aria-hidden={!isTop || undefined}
                        style={{
                            gridArea: "1 / 1",
                            alignSelf: "end",
                            zIndex: order.length - depth,
                            transform: lifted
                                ? `translateY(-${LIFT}) rotate(${phase === "next" ? -2.5 : 2.5}deg)`
                                : `translateY(${slot * PEEK}px) scale(${1 - slot * 0.012}) rotate(${slot === 0 ? 0 : slot % 2 ? -0.7 : 0.5}deg)`,
                            transformOrigin: "50% 100%",
                            transition: `transform ${SWAP_MS}ms ease, opacity ${SWAP_MS}ms ease`,
                            pointerEvents: isTop ? undefined : "none",
                        }}
                    >
                        <BlockRenderer block={blocks[blockIdx]} index={baseIndex + blockIdx} />
                    </div>
                );
            })}

            {order.length > 1 && (
                <>
                    {/* prev/next — the universally recognizable carousel controls */}
                    <div
                        className="absolute top-1/2 flex -translate-y-1/2 flex-col gap-2"
                        style={{
                            left: "calc(100% + 16px)",
                            zIndex: order.length + 1,
                            // mounts mid-stream when the second card lands — ease it in
                            animation: "fadeUp 0.35s ease both",
                        }}
                    >
                        {(["prev", "next"] as const).map((dir) => (
                            <button
                                key={dir}
                                type="button"
                                onClick={() => flip(dir)}
                                aria-label={`${dir === "prev" ? "Previous" : "Next"} card (${order.length} in this stack)`}
                                className="cursor-pointer"
                            >
                                <InkFrame radius="999px" background="var(--color-paper)" borderWidth={2} shadow="2px 2px 0">
                                    <span className="flex h-9 w-9 items-center justify-center">
                                        {/* hand-drawn left/right arrow */}
                                        <svg
                                            viewBox="0 0 24 24"
                                            width={17}
                                            height={17}
                                            aria-hidden
                                            style={{
                                                filter: "url(#inkRough)",
                                                transform: dir === "prev" ? "scaleX(-1)" : undefined,
                                            }}
                                        >
                                            <path
                                                d="M4.5 12 H18 M13 6.5 C15 9, 16.5 10.5, 19.5 12 C16.5 13.5, 15 15, 13 17.5"
                                                stroke="var(--color-ink)"
                                                strokeWidth="2.6"
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </span>
                                </InkFrame>
                            </button>
                        ))}
                    </div>

                    {/* carousel dots: hollow, with the current card's filled */}
                    <div
                        className="relative flex justify-center gap-2"
                        style={{ marginTop: peeks * PEEK + 22, zIndex: order.length + 1 }}
                        aria-hidden
                    >
                        {blocks.map((_, i) => (
                            <span
                                key={i}
                                className="h-2 w-2 rounded-full border-2 border-ink"
                                style={{
                                    background: i === order[0] ? "var(--color-ink)" : "transparent",
                                    transition: "background 0.2s ease",
                                    // each dot eases in as its card streams into the pile;
                                    // existing dots keep their identity and don't replay
                                    animation: "fadeUp 0.3s ease both",
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
