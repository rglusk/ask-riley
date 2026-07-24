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
const LIFT = 64; // px the top card rises before tucking under the stack

export function CardStack({ blocks, baseIndex }: { blocks: Block[]; baseIndex: number }) {
    // order[0] is the top card; advancing tucks it to the bottom
    const [order, setOrder] = useState(() => blocks.map((_, i) => i));
    const [leaving, setLeaving] = useState(false);

    // cards can keep arriving while a response streams — slide them under
    if (order.length < blocks.length) {
        setOrder([...order, ...blocks.map((_, i) => i).slice(order.length)]);
    }

    function next() {
        if (leaving || order.length < 2) return;
        setLeaving(true);
        // the fly-out runs first; the reorder then lets the old top slide back
        // in underneath the pile (that slide IS the "swap cards" animation)
        setTimeout(() => {
            setOrder((o) => [...o.slice(1), o[0]]);
            setLeaving(false);
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
                // while the top card flies out, everyone below rises one slot
                const slot = Math.min(leaving && !isTop ? depth - 1 : depth, MAX_PEEKS);
                return (
                    <div
                        key={blockIdx}
                        aria-hidden={!isTop || undefined}
                        style={{
                            gridArea: "1 / 1",
                            alignSelf: "end",
                            zIndex: order.length - depth,
                            // flip: the top card lifts up off the pile, then (after the
                            // reorder drops its zIndex) slides back down underneath it
                            transform:
                                isTop && leaving
                                    ? `translateY(-${LIFT}px) rotate(-2.5deg)`
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
                    <button
                        type="button"
                        onClick={next}
                        aria-label={`Flip to next card (${order.length} in this stack)`}
                        className="absolute top-1/2 -translate-y-1/2 cursor-pointer"
                        style={{ left: "calc(100% + 16px)", zIndex: order.length + 1 }}
                    >
                        <InkFrame radius="999px" background="var(--color-paper)" borderWidth={2} shadow="2px 2px 0">
                            <span className="flex h-9 w-9 items-center justify-center">
                                {/* hand-drawn flip symbol tracing the card's motion:
                                    up, over to the right, arcing back down */}
                                <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden style={{ filter: "url(#inkRough)" }}>
                                    <path
                                        d="M5.5 17.5 C5.5 9.5, 8.5 5, 12 5 C15.7 5, 18.7 8.7, 18.7 15 M18.7 15 L16 12.4 M18.7 15 L21.4 12.4"
                                        stroke="var(--color-ink)"
                                        strokeWidth="2.4"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </span>
                        </InkFrame>
                    </button>

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
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
