// hand-drawn waving hand: open palm, four fingers + thumb, with the classic
// two cartoon motion arcs. Meant to appear on hover next to the portrait.
export function InkHand({ size = 56, className = "" }: { size?: number; className?: string }) {
    return (
        <svg
            viewBox="0 0 120 120"
            width={size}
            height={size}
            fill="none"
            aria-hidden
            className={className}
            style={{ filter: "url(#inkRough)" }}
        >
            {/* palm + fingers + thumb */}
            <path
                d="M40 112 C36 94, 30 86, 25 68 C23 60, 31 56, 35 63 L42 78 C39 58, 37 45, 39 31 C40 23, 48 23, 49 31 L52 55 C52 38, 52 27, 54 17 C55 9, 63 9, 64 17 L65 52 C66 36, 67 27, 69 19 C71 11, 78 12, 78 20 L78 56 C79 46, 81 39, 84 33 C87 26, 93 29, 92 36 C90 52, 88 70, 83 86 C79 100, 72 107, 68 112 Z"
                stroke="var(--color-ink)"
                strokeWidth="5"
                strokeLinejoin="round"
                fill="var(--color-paper)"
            />
            {/* motion arcs */}
            <path d="M100 38 C108 48, 108 62, 100 72" stroke="var(--color-ink)" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M108 30 C119 44, 119 66, 108 80" stroke="var(--color-ink)" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
    );
}
