import type { ContactCard } from "@ask-riley/schema";
import { InkFrame } from "../InkFrame";

export function ContactCardView({
    email,
    linkedIn,
    location,
    reason,
    rotate = -0.5,
}: Omit<ContactCard, "type"> & { rotate?: number }) {
    const rows = [
        { label: "Email", value: email, href: `mailto:${email}` },
        linkedIn && { label: "LinkedIn", value: linkedIn, href: `https://${linkedIn.replace(/^https?:\/\//, "")}` },
        location && { label: "Location", value: location },
    ].filter(Boolean) as { label: string; value: string; href?: string }[];

    return (
        <InkFrame radius="18px 24px 20px 26px" background="var(--color-card)" rotate={rotate} className="w-full max-w-80">
            <div className="flex flex-col gap-3 p-4.5">
                {reason && <p className="m-0 text-[13px] italic opacity-70">{reason}</p>}
                {rows.map((row) => (
                    <div key={row.label} className="flex flex-col">
                        <span className="text-[11.5px] uppercase tracking-wider opacity-65">{row.label}</span>
                        {row.href ? (
                            <a href={row.href} className="text-[15px] font-semibold hover:underline">
                                {row.value}
                            </a>
                        ) : (
                            <span className="text-[15px] font-semibold">{row.value}</span>
                        )}
                    </div>
                ))}
            </div>
        </InkFrame>
    );
}
