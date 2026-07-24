import type { ChatResponse } from "@ask-riley/schema";
import { BlockRenderer } from "./BlockRenderer";
import { CardStack, groupCardBlocks } from "./CardStack";
import { InkFrame } from "../InkFrame";

// trust states tint the assistant bubble itself: honest states look different,
// but everything stays in the hand-drawn language
const stateBackground: Record<ChatResponse["state"], string> = {
    answered: "var(--color-card)",
    no_data: "var(--color-pastel-butter)",
    no_understanding: "var(--color-bubble-user)",
};

export function EnvelopeView({
    response,
    onSuggestion,
    showSuggestions = true,
}: {
    response: ChatResponse;
    onSuggestion: (question: string) => void;
    showSuggestions?: boolean;
}) {
    const textBlocks = response.blocks.filter((b) => b.type === "text");
    const cardBlocks = response.blocks.filter((b) => b.type !== "text");

    return (
        <div className="flex flex-col gap-4">
            {response.intent && (
                <span className="w-fit text-[11px] uppercase tracking-wider opacity-65">
                    {response.intent}
                </span>
            )}

            {/* assistant speech bubble: text blocks, left tail, slight tilt */}
            {textBlocks.length > 0 && (
                <div className="flex">
                    <InkFrame
                        radius="16px 20px 18px 4px"
                        background={stateBackground[response.state]}
                        borderWidth={2}
                        shadow={null}
                        rotate={-0.6}
                        className="max-w-[82%]"
                    >
                        <div className="px-4 py-3">
                            <span className="sr-only">Riley said: </span>
                            {textBlocks.map((block, i) => (
                                <BlockRenderer key={i} block={block} index={i} />
                            ))}
                        </div>
                        <div
                            aria-hidden
                            style={{
                                position: "absolute",
                                left: 14,
                                bottom: -9,
                                width: 14,
                                height: 14,
                                background: stateBackground[response.state],
                                borderLeft: "2px solid var(--color-ink)",
                                borderBottom: "2px solid var(--color-ink)",
                                borderBottomLeftRadius: 3,
                                transform: "rotate(-45deg)",
                            }}
                        />
                    </InkFrame>
                </div>
            )}

            {/* cards below the bubble: same-type runs pile into a CardStack,
                mixed types sit separately in the vertical flow */}
            {cardBlocks.length > 0 && (
                <div className="mt-3 flex flex-col gap-5">
                    {groupCardBlocks(cardBlocks).map((group) =>
                        group.blocks.length > 1 ? (
                            <CardStack key={group.start} blocks={group.blocks} baseIndex={group.start} />
                        ) : (
                            <BlockRenderer key={group.start} block={group.blocks[0]} index={group.start} />
                        ),
                    )}
                </div>
            )}

            {/* pills only survive while this is the newest turn: once one is
                clicked (or anything is sent), the round is over and they go */}
            {showSuggestions && response.suggestions && response.suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2.5">
                    {response.suggestions.map((suggestion) => (
                        <button key={suggestion} type="button" onClick={() => onSuggestion(suggestion)} className="cursor-pointer">
                            <InkFrame
                                radius="10px 14px 12px 16px"
                                background="var(--color-card)"
                                borderWidth={2}
                                shadow={null}
                            >
                                <span className="block px-3.5 py-1.5 text-[13px] font-medium">
                                    {suggestion}
                                </span>
                            </InkFrame>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
