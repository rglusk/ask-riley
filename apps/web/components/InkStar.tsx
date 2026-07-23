// hand-drawn four-point sparkle star, ink-colored, wobbled by the inkRough filter
export function InkStar({
    size = 20,
    rotate = 0,
    filled = false,
    className = "",
}: {
    size?: number;
    rotate?: number;
    filled?: boolean;
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            aria-hidden
            className={className}
            style={{
                filter: "url(#inkRough)",
                transform: rotate ? `rotate(${rotate}deg)` : undefined,
            }}
        >
            <path
                d="M50 8 C55 34, 64 44, 92 50 C64 56, 55 66, 50 92 C45 66, 36 56, 8 50 C36 44, 45 34, 50 8 Z"
                stroke="var(--color-ink)"
                strokeWidth="7"
                strokeLinejoin="round"
                fill={filled ? "var(--color-ink)" : "none"}
            />
        </svg>
    );
}
