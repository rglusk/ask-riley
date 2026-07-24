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

const PEEK = 10; // px of each buried card left visible below the one above
const MAX_PEEKS = 3; // deeper cards align with the third — the pile reads "several" without growing forever
const SWAP_MS = 280;

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
        <div className="relative" style={{ paddingBottom: peeks * PEEK }}>
            {order.map((blockIdx, depth) => {
                const isTop = depth === 0;
                // while the top card flies out, everyone below rises one slot
                const slot = Math.min(leaving && !isTop ? depth - 1 : depth, MAX_PEEKS);
                return (
                    <div
                        key={blockIdx}
                        aria-hidden={!isTop || undefined}
                        style={{
                            position: isTop ? "relative" : "absolute",
                            top: isTop ? undefined : 0,
                            left: 0,
                            right: 0,
                            zIndex: order.length - depth,
                            transform:
                                isTop && leaving
                                    ? "translateX(58%) rotate(5deg)"
                                    : `translateY(${slot * PEEK}px) scale(${1 - slot * 0.012}) rotate(${slot === 0 ? 0 : slot % 2 ? -0.7 : 0.5}deg)`,
                            transformOrigin: "50% 100%",
                            opacity: isTop && leaving ? 0 : 1,
                            transition: `transform ${SWAP_MS}ms ease, opacity ${SWAP_MS}ms ease`,
                            pointerEvents: isTop ? undefined : "none",
                        }}
                    >
                        <BlockRenderer block={blocks[blockIdx]} index={baseIndex + blockIdx} />
                    </div>
                );
            })}

            {order.length > 1 && (
                <button
                    type="button"
                    onClick={next}
                    aria-label={`Next card (${order.length} in this stack)`}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    style={{ zIndex: order.length + 1 }}
                >
                    <InkFrame radius="999px" background="var(--color-paper)" borderWidth={2} shadow="2px 2px 0">
                        <span className="flex h-9 w-9 items-center justify-center">
                            {/* hand-drawn right arrow */}
                            <svg viewBox="0 0 24 24" width={17} height={17} aria-hidden style={{ filter: "url(#inkRough)" }}>
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
            )}
        </div>
    );
}
