import type { ProjectCard } from "@ask-riley/schema";
import { InkFrame } from "../InkFrame";

// hand-drawn pencil bullet, in the ink language (replaces the ✏️ emoji)
function InkPencil() {
    return (
        <svg
            aria-hidden
            viewBox="0 0 24 24"
            width={13}
            height={13}
            className="mt-[3px] shrink-0"
            // mirrored so the nib points at the text it annotates
            style={{ filter: "url(#inkRough)", transform: "scaleX(-1)" }}
        >
            <path
                d="M4.5 19.5 L6.5 13.8 L16.2 4.1 C17.3 3 19.1 3 20.2 4.1 C21.3 5.2 21.3 7 20.2 8.1 L10.5 17.8 Z"
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path d="M6.5 13.8 L10.5 17.8" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export function ProjectCardView({
    title,
    role,
    summary,
    highlights,
    metrics,
    rotate = -0.8,
}: Omit<ProjectCard, "type" | "projectId"> & { rotate?: number }) {
    return (
        <InkFrame radius="16px 22px 18px 24px" background="var(--color-card)" rotate={rotate} className="w-full max-w-105">
            <div className="flex flex-col gap-2 p-4.5">
                {role && (
                    <span className="text-[11.5px] uppercase tracking-wider opacity-65">{role}</span>
                )}
                <h2 className="font-accent italic text-xl leading-snug">{title}</h2>
                <p className="m-0 text-[13.5px] leading-relaxed opacity-80">{summary}</p>
                {highlights.length > 0 && (
                    <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[13px] opacity-85">
                        {highlights.map((h) => (
                            <li key={h} className="flex items-start gap-1.5">
                                <InkPencil />
                                {h}
                            </li>
                        ))}
                    </ul>
                )}
                {metrics && metrics.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-2">
                        {metrics.map((m) => (
                            <InkFrame
                                key={m.label}
                                radius="10px 14px 12px 8px"
                                background="var(--color-pastel-butter)"
                                borderWidth={2}
                                shadow={null}
                            >
                                <span className="block px-2.5 py-1 text-[12px]">
                                    <b>{m.value}</b> {m.label}
                                </span>
                            </InkFrame>
                        ))}
                    </div>
                )}
            </div>
        </InkFrame>
    );
}
