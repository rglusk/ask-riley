"use client";

import { useEffect, useState } from "react";
import type { IntroCard } from "@ask-riley/schema";
import { InkFrame } from "../InkFrame";
import { InkStar } from "../InkStar";

export function IntroCardView({
    name,
    headline,
    tagline,
    images,
    stats,
}: Omit<IntroCard, "type">) {
    return (
        <InkFrame
            radius="20px 26px 22px 28px"
            background="var(--color-pastel-lavender)"
            shadow="5px 5px 0"
            rotate={-1}
            className="w-full max-w-95"
        >
            {/* foil sparkles in the corners */}
            <InkStar size={18} rotate={-14} filled className="pointer-events-none absolute right-3 top-3" />
            <InkStar size={13} rotate={16} className="pointer-events-none absolute right-8 top-6" />

            <div className="flex flex-col gap-2.5 p-3.5">
                {/* photos side by side, short letterbox height */}
                <div className="flex gap-2">
                    {images.map((p, n) => (
                        <div key={n} className="h-32 flex-1 overflow-hidden rounded-xl border-2 border-ink">
                            <img
                                src={p.src}
                                alt={p.alt}
                                className="h-full w-full object-cover"
                                style={{ objectPosition: "50% 32%" }}
                            />
                        </div>
                    ))}
                </div>

                <div>
                    <h2 className="font-accent italic text-xl leading-tight">{name}</h2>
                    <p className="mt-0.5 text-[12px] font-semibold uppercase tracking-wide opacity-70">{headline}</p>
                </div>

                {/* trading-card stats: each drawn its own bespoke way */}
                {stats && stats.length > 0 && (
                    <div className="flex flex-col gap-2 pt-0.5">
                        {stats.map((s) => (
                            <div key={s.label} className="flex items-center gap-2.5">
                                <span className="w-30 shrink-0 text-[10.5px] font-semibold uppercase leading-tight tracking-wide opacity-70">
                                    {s.label}
                                </span>
                                <div className="flex flex-1 items-center">
                                    <StatViz {...s} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </InkFrame>
    );
}

type Stat = NonNullable<IntroCard["stats"]>[number];

// dispatch each stat to its bespoke drawing
function StatViz(stat: Stat) {
    switch (stat.viz) {
        case "line":
            return <LineStat value={stat.value} />;
        case "since":
            return <SinceStat sinceDate={stat.sinceDate} />;
        case "sweaters":
            return <SweaterStat count={stat.value} />;
        case "trophy":
            return <TrophyStat count={stat.value} />;
        default:
            return <MeterStat value={stat.value} />;
    }
}

// upward line graph ending near the top — reads as "trending to 99%"
function LineStat({ value }: { value: number }) {
    return (
        <div className="flex flex-1 items-center gap-2">
            <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-6 flex-1" style={{ filter: "url(#inkRough)" }}>
                <polyline
                    points="2,27 20,23 34,25 50,15 66,12 82,6 98,3"
                    fill="none"
                    stroke="var(--color-ink)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            <span className="font-accent italic text-lg leading-none">{value}%</span>
        </div>
    );
}

// live tenure counter, computed from a start date so it's always current
function SinceStat({ sinceDate }: { sinceDate?: string }) {
    const [years, setYears] = useState(() => yearsSince(sinceDate));
    useEffect(() => {
        const id = setInterval(() => setYears(yearsSince(sinceDate)), 1000);
        return () => clearInterval(id);
    }, [sinceDate]);
    return <span className="font-accent italic text-lg leading-none">{years.toFixed(2)} yrs</span>;
}
function yearsSince(iso?: string) {
    if (!iso) return 0;
    return (Date.now() - Date.parse(iso)) / (365.25 * 24 * 3600 * 1000);
}

// N little black-outline sweaters with a strand of yarn trailing off the last
function SweaterStat({ count }: { count: number }) {
    return (
        <div className="flex flex-wrap items-center gap-1">
            {Array.from({ length: count }).map((_, i) => (
                <SweaterIcon key={i} />
            ))}
            <svg viewBox="0 0 40 24" className="h-4 w-8" style={{ filter: "url(#inkRough)" }}>
                <path d="M1 12 C7 5 13 19 19 12 C24 6 29 18 34 12" fill="none" stroke="var(--color-ink)" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="36" cy="12" r="3" fill="none" stroke="var(--color-ink)" strokeWidth="1.6" />
            </svg>
        </div>
    );
}
function SweaterIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" style={{ filter: "url(#inkRough)" }}>
            <path
                d="M8 5 L3 10 L5.5 13 L8 11 L8 21 L16 21 L16 11 L18.5 13 L21 10 L16 5 C14.5 8 9.5 8 8 5 Z"
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// N black-outline trophies
function TrophyStat({ count }: { count: number }) {
    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: count }).map((_, i) => (
                <TrophyIcon key={i} />
            ))}
        </div>
    );
}
function TrophyIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-5.5 w-5.5" style={{ filter: "url(#inkRough)" }}>
            <path
                d="M7 4 L17 4 L16.5 11 C16.5 15 7.5 15 7.5 11 Z M7 5 C3 5 3 10 7.5 10.5 M17 5 C21 5 21 10 16.5 10.5 M12 14.5 L12 18 M8.5 19.5 L15.5 19.5"
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// fallback: a proportional ink meter bar
function MeterStat({ value }: { value: number }) {
    return (
        <div className="flex flex-1 items-center gap-2.5">
            <div className="relative h-3 flex-1 overflow-hidden rounded-full border-2 border-ink" style={{ filter: "url(#inkRough)" }}>
                <div className="absolute inset-y-0 left-0 bg-ink/85" style={{ width: `${Math.min(100, value)}%` }} />
            </div>
            <span className="font-accent italic text-sm leading-none opacity-80">{value}</span>
        </div>
    );
}
