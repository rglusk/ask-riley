"use client";

import { useEffect, useRef, useState } from "react";
import type { MovieCard } from "@ask-riley/schema";
import { InkFrame } from "../InkFrame";

export type MovieCardProps = Omit<MovieCard, "type"> & {
    /** pastel background; BlockRenderer cycles these per card */
    tone?: string;
    rotate?: number;
};

export function MovieCardView({
    title,
    year,
    director,
    take,
    vibe,
    poster,
    url,
    tone = "var(--color-pastel-lavender)",
    rotate = -1.2,
}: MovieCardProps) {
    // the drip reward: click out to the link, come back to the tab, and the
    // card has dripped (visibilitychange catches the return)
    const [dripped, setDripped] = useState(false);
    const pending = useRef(false);

    useEffect(() => {
        const onReturn = () => {
            if (document.visibilityState === "visible" && pending.current) {
                pending.current = false;
                setDripped(true);
            }
        };
        document.addEventListener("visibilitychange", onReturn);
        window.addEventListener("focus", onReturn);
        return () => {
            document.removeEventListener("visibilitychange", onReturn);
            window.removeEventListener("focus", onReturn);
        };
    }, []);

    return (
        <InkFrame
            radius="14px 24px 18px 26px"
            background={tone}
            shadow="4px 4px 0"
            rotate={rotate}
            className="w-full max-w-85"
        >
            <div className="flex flex-row gap-2.5 p-3.5">
                {poster && (
                    <div
                        className="w-25 max-w-full overflow-hidden rounded-lg border-2 border-ink"
                        style={{ aspectRatio: "2 / 3" }}
                    >
                        <img src={poster} alt={`${title} poster`} className="h-full w-full object-cover" />
                    </div>
                )}
                <div className="flex flex-1 flex-col gap-1.5">
                    <div>
                        <h2 className="font-accent italic text-xl leading-tight">{title}</h2>
                        {(year || director) && (
                            <p className="mt-0.5 text-xs opacity-70">
                                {[year, director && `dir. ${director}`].filter(Boolean).join(" · ")}
                            </p>
                        )}
                    </div>

                    {vibe && (
                        <span className="w-fit text-[11px] font-semibold uppercase tracking-wide opacity-70">
                            {vibe}
                        </span>
                    )}

                    {take && <p className="m-0 text-[13.5px] leading-normal opacity-85">“{take}”</p>}

                    {url && (
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`View ${title} on IMDb (opens in a new tab)`}
                            onClick={() => (pending.current = true)}
                            className="mt-auto self-start pt-2"
                        >
                            <InkFrame
                                radius="12px 8px 10px 6px"
                                background="var(--color-card)"
                                borderWidth={2}
                                shadow={null}
                            >
                                <span className="block px-3 py-1.5 text-[13px] font-semibold">
                                    View on IMDb ↗
                                </span>
                            </InkFrame>
                        </a>
                    )}
                </div>
            </div>

            {dripped && (
                <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-px h-8.5">
                    {[
                        { left: "18%", w: 16, h: 26, r: 10, delay: "0s" },
                        { left: "46%", w: 22, h: 34, r: 12, delay: "0.05s" },
                        { left: "72%", w: 14, h: 20, r: 8, delay: "0.1s" },
                    ].map((d, i) => (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                left: d.left,
                                bottom: 0,
                                width: d.w,
                                height: d.h,
                                background: tone,
                                borderRadius: `0 0 ${d.r}px ${d.r}px`,
                                animation: `dripFall 0.5s ease both ${d.delay}`,
                            }}
                        />
                    ))}
                </div>
            )}
        </InkFrame>
    );
}
