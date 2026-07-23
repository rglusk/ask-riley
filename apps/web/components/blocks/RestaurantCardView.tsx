"use client";

import { useEffect, useRef, useState } from "react";
import type { RestaurantCard } from "@ask-riley/schema";
import { InkFrame } from "../InkFrame";

// A mask that keeps the whole card EXCEPT a scalloped diagonal bite out of the
// top-right corner — the wavy edge reads as teeth, and two detached holes are
// little crumb nibbles. White = kept, transparent = eaten (border and all).
// preserveAspectRatio="none" stretches it to the card; the scallops still read.
const BITE_MASK =
    `url("data:image/svg+xml,` +
    encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'>` +
        `<path fill='white' d='` +
        `M0 0 L60 0 ` +
        // scalloped diagonal cut from (60,0) to (100,46); every scoop dips INTO
        // the card and its endpoints sit on the diagonal, so no slivers detach
        `Q60.5 9.7 70 11.5 Q70.5 21.2 80 23 Q80.5 32.7 90 34.5 Q90.5 44.2 100 46 ` +
        `L100 100 L0 100 Z` +
        `'/></svg>`
    ) +
    `")`;

export function RestaurantCardView({
    name,
    cuisine,
    neighborhood,
    note,
    photo,
    url,
    tone = "var(--color-pastel-green)",
    rotate = 1.1,
    defaultBitten = false,
}: Omit<RestaurantCard, "type"> & { tone?: string; rotate?: number; defaultBitten?: boolean }) {
    // the bite reward: click out to the map, come back, and someone has
    // taken a bite out of the card (visibilitychange catches the return)
    const [bitten, setBitten] = useState(defaultBitten);
    const pending = useRef(false);

    useEffect(() => {
        const onReturn = () => {
            if (document.visibilityState === "visible" && pending.current) {
                pending.current = false;
                setBitten(true);
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
            radius="24px 14px 26px 18px"
            background={tone}
            shadow="4px 4px 0"
            rotate={rotate}
            className="w-full max-w-85"
            style={bitten ? { maskImage: BITE_MASK, maskSize: "100% 100%", WebkitMaskImage: BITE_MASK, WebkitMaskSize: "100% 100%" } : undefined}
        >
            <div className="flex flex-col gap-2.5 p-3.5">
                {photo && (
                    <div
                        className="w-full overflow-hidden rounded-lg border-2 border-ink"
                        style={{ aspectRatio: "16 / 10" }}
                    >
                        <img src={photo} alt={`${name}`} className="h-full w-full object-cover" />
                    </div>
                )}

                <div>
                    <h2 className="font-accent italic text-xl leading-snug">{name}</h2>
                    {(cuisine || neighborhood) && (
                        <p className="mt-0.5 text-xs opacity-70">
                            {[cuisine, neighborhood].filter(Boolean).join(" · ")}
                        </p>
                    )}
                </div>

                {note && <p className="m-0 text-[13.5px] leading-normal opacity-85">“{note}”</p>}

                {url && (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => (pending.current = true)}
                        className="mt-auto self-start pt-1"
                    >
                        <InkFrame radius="10px 12px 6px 8px" background="var(--color-card)" borderWidth={2} shadow={null}>
                            <span className="block px-3 py-1.5 text-[13px] font-semibold">
                                Find on the map ↗
                            </span>
                        </InkFrame>
                    </a>
                )}
            </div>

        </InkFrame>
    );
}
