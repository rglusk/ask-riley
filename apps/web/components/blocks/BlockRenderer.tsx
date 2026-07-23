import type { Block } from "@ask-riley/schema";
import ReactMarkdown from "react-markdown";
import { MovieCardView } from "./MovieCardView";
import { ProjectCardView } from "./ProjectCardView";
import { ContactCardView } from "./ContactCardView";
import { RestaurantCardView } from "./RestaurantCardView";
import { LinkCardView } from "./LinkCardView";
import { IntroCardView } from "./IntroCardView";
import { ArchitectureCardView } from "./ArchitectureCardView";

// pastel rotation for card runs — index comes from the block's position
const TONES = [
    "var(--color-pastel-lavender)",
    "var(--color-pastel-peach)",
    "var(--color-pastel-green)",
    "var(--color-pastel-butter)",
];

export function BlockRenderer({ block, index = 0 }: { block: Block; index?: number }) {
    switch (block.type) {
        case "text":
            return (
                <div className="space-y-2 text-[15px] leading-normal [&_p]:m-0 [&_strong]:font-bold">
                    <ReactMarkdown>{block.markdown}</ReactMarkdown>
                </div>
            );
        case "movie_card": {
            const { type, ...props } = block;
            return (
                <MovieCardView
                    {...props}
                    tone={TONES[index % TONES.length]}
                    rotate={index % 2 === 0 ? -1.2 : 1}
                />
            );
        }
        case "project_card": {
            const { type, projectId, ...props } = block;
            return <ProjectCardView {...props} rotate={index % 2 === 0 ? -0.8 : 0.7} />;
        }
        case "restaurant_card": {
            const { type, ...props } = block;
            return (
                <RestaurantCardView
                    {...props}
                    tone={TONES[index % TONES.length]}
                    rotate={index % 2 === 0 ? 1.1 : -0.9}
                />
            );
        }
        case "link_card": {
            const { type, ...props } = block;
            return <LinkCardView {...props} rotate={index % 2 === 0 ? -1 : 0.9} />;
        }
        case "intro_card": {
            const { type, ...props } = block;
            return <IntroCardView {...props} />;
        }
        case "architecture_card": {
            const { type, ...props } = block;
            return <ArchitectureCardView {...props} />;
        }
        case "contact_card": {
            const { type, ...props } = block;
            return <ContactCardView {...props} />;
        }
        default:
            // tolerant client: unbuilt/unknown block types render as labeled
            // placeholders instead of crashing (SDUI version-skew policy)
            return <PlaceholderBlock block={block} />;
    }
}

function PlaceholderBlock({ block }: { block: Block }) {
    return (
        <div className="rounded-lg border-2 border-dashed border-ink/40 p-3 text-xs opacity-60">
            <b>{block.type}</b> — renderer not built yet
        </div>
    );
}
