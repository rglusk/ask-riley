import type { ProjectCard } from "@ask-riley/schema";
import { InkFrame } from "../InkFrame";

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
                    <span className="text-[11.5px] uppercase tracking-wider opacity-55">{role}</span>
                )}
                <h3 className="font-accent italic text-xl leading-snug">{title}</h3>
                <p className="m-0 text-[13.5px] leading-relaxed opacity-80">{summary}</p>
                {highlights.length > 0 && (
                    <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[13px] opacity-85">
                        {highlights.map((h) => (
                            <li key={h}>✏️ {h}</li>
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
