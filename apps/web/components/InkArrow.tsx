// hand-drawn swirly arrow — squiggle, loop, hatched head. Points left by
// default; flip renders it pointing right. Inline SVG so it stays crisp,
// ink-colored, and warps with the design language.
export function InkArrow({
    className = "",
    width = 84,
    flip = false,
    rotate = 0,
}: {
    className?: string;
    width?: number;
    flip?: boolean;
    rotate?: number;
}) {
    return (
        <svg
            viewBox="0 0 120 78"
            width={width}
            fill="none"
            aria-hidden
            className={className}
            style={{
                filter: "url(#inkRough)",
                transform: `${flip ? "scaleX(-1) " : ""}${rotate ? `rotate(${rotate}deg)` : ""}` || undefined,
            }}
        >
            {/* tail: wave in from the right, loop, then run at the head */}
            <path
                d="M114 10 C96 2, 84 10, 88 22 C92 34, 106 36, 100 48 C93 61, 70 62, 60 50 C50 38, 62 28, 72 34 C80 39, 76 52, 60 56 C46 59, 32 54, 24 46"
                stroke="var(--color-ink)"
                strokeWidth="5"
                strokeLinecap="round"
            />
            {/* head: open triangle with hatching */}
            <path
                d="M27 34 L8 44 L28 56 C24 49, 24 41, 27 34 Z"
                stroke="var(--color-ink)"
                strokeWidth="4"
                strokeLinejoin="round"
            />
            <path d="M24 40 L14 45 M25 45 L16 48 M26 50 L19 51" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}
