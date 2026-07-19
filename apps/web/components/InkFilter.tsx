// The one SVG in the whole design system: a turbulence filter that warps clean
// CSS borders into hand-drawn ink wobble. Mounted once (layout + Storybook);
// referenced everywhere via filter: url(#inkRough) on InkFrame's backdrop layer.
export function InkFilter() {
    return (
        <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} aria-hidden>
            <filter id="inkRough">
                <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.015 0.02"
                    numOctaves={2}
                    seed={7}
                    result="noise"
                />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale={3.2} />
            </filter>
        </svg>
    );
}
