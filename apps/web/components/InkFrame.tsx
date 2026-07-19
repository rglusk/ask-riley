import type { CSSProperties, ReactNode } from "react";

// The core hand-drawn primitive: content stays crisp while a backdrop layer
// (inset -2px, z-index -1) carries background + border + offset shadow and gets
// warped by the inkRough turbulence filter. Asymmetric radii + slight rotation
// do the "sketched" part before the filter even runs.
export function InkFrame({
    radius = "18px 26px 20px 30px",
    background = "var(--color-card)",
    borderWidth = 2.5,
    shadow = "4px 4px 0",
    rotate = 0,
    className = "",
    style,
    children,
}: {
    radius?: string;
    background?: string;
    borderWidth?: number;
    /** offset-shadow shorthand ("4px 4px 0"), or null for no shadow */
    shadow?: string | null;
    rotate?: number;
    className?: string;
    style?: CSSProperties;
    children: ReactNode;
}) {
    return (
        <div
            className={`relative isolate ${className}`}
            style={{ borderRadius: radius, transform: rotate ? `rotate(${rotate}deg)` : undefined, ...style }}
        >
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: -2,
                    zIndex: -1,
                    borderRadius: radius,
                    background,
                    border: `${borderWidth}px solid var(--color-ink)`,
                    boxShadow: shadow ? `${shadow} oklch(18% 0 0 / 0.85)` : undefined,
                    filter: "url(#inkRough)",
                }}
            />
            {children}
        </div>
    );
}
