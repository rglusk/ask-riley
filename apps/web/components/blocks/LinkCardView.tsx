import type { LinkCard } from "@ask-riley/schema";
import { InkFrame } from "../InkFrame";

export function LinkCardView({
    url,
    title,
    note,
    rotate = -1,
}: Omit<LinkCard, "type"> & { rotate?: number }) {
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full max-w-95">
            <InkFrame radius="16px 22px 18px 24px" background="var(--color-card)" shadow="4px 4px 0" rotate={rotate}>
                <div className="flex flex-col gap-2 p-4.5">
                    <span className="text-[11.5px] uppercase tracking-wider opacity-55">
                        {new URL(url).hostname.replace(/^www\./, "")} ↗
                    </span>
                    <h2 className="font-accent italic m-0 text-xl leading-snug">{title}</h2>
                    {note && <p className="m-0 text-[13.5px] leading-relaxed opacity-80">{note}</p>}
                </div>
            </InkFrame>
        </a>
    );
}
