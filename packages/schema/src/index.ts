import { z } from "zod";

// ---------------------------------------------------------------------------
// Block vocabulary — the SDUI contract. The client renders these types and
// knows nothing about Riley's domain; the model composes them per response.
// .describe() strings are read by the model: they are API docs AND prompt.
// ---------------------------------------------------------------------------

export const TextBlock = z.object({
    type: z.literal("text"),
    markdown: z.string().describe("Prose in markdown. Keep paragraphs short."),
});

export const ProjectCard = z.object({
    type: z.literal("project_card"),
    projectId: z.string().describe("The project's id from the knowledge base, e.g. 'messaging-cards'"),
    title: z.string(),
    role: z.string().optional().describe("Riley's role on the project"),
    summary: z.string().describe("1-2 sentence plain-language summary"),
    highlights: z.array(z.string()).max(4).describe("Up to 4 punchy bullet points"),
    metrics: z.array(z.object({
        value: z.string().describe("Magnitude, e.g. '100Ks', 'double-digit %'"),
        label: z.string(),
    })).max(3).optional(),
});

export const MovieCard = z.object({
    type: z.literal("movie_card"),
    title: z.string(),
    year: z.number().int().optional(),
    director: z.string().optional(),
    take: z.string().optional().describe("Riley's take on the film, verbatim from the knowledge base — omit when absent, NEVER invented"),
    vibe: z.string().optional().describe("Short vibe tag, e.g. 'elevated dread', 'so bad it's great'"),
    poster: z.string().optional().describe("Poster image path from the knowledge base — never invented"),
    url: z.string().optional().describe("Link to the film (e.g. IMDb), from the knowledge base only"),
});

export const RestaurantCard = z.object({
    type: z.literal("restaurant_card"),
    name: z.string(),
    cuisine: z.string().optional(),
    neighborhood: z.string().optional(),
    note: z.string().optional().describe("Why Riley recommends it, verbatim from the knowledge base — omit when absent, NEVER invented"),
    photo: z.string().optional().describe("Photo path from the knowledge base — never invented"),
    url: z.string().optional().describe("Map/website link from the knowledge base only"),
});

export const LinkCard = z.object({
    type: z.literal("link_card"),
    url: z.string().describe("URL from the knowledge base — never invented or guessed"),
    title: z.string(),
    note: z.string().optional().describe("Why Riley found this interesting"),
});

export const IntroCard = z.object({
    type: z.literal("intro_card"),
    name: z.string(),
    headline: z.string().describe("e.g. 'Staff Frontend Engineer at Airbnb (Messaging)'"),
    tagline: z.string().optional().describe("One warm, human sentence about Riley"),
    images: z.array(z.object({
        src: z.string().describe("Image path from the knowledge base — never invented"),
        alt: z.string().describe("Alt text describing the photo"),
    })).min(1).max(6).describe("Carousel of photos of Riley"),
    stats: z.array(z.object({
        label: z.string().describe("Playful stat name from the knowledge base, e.g. 'Pub Quiz ATK'"),
        value: z.number().min(0).max(999),
        viz: z.enum(["meter", "line", "since", "sweaters", "trophy"]).optional()
            .describe("How to draw the stat; defaults to a meter bar"),
        sinceDate: z.string().optional().describe("ISO date for viz 'since' — value counts up live from here"),
    })).max(6).optional().describe("Trading-card style stats, verbatim from the knowledge base"),
});

export const ArchitectureCard = z.object({
    type: z.literal("architecture_card"),
    // full-width diagram of how this very bot works. The renderer holds the real
    // architecture — the model only chooses to show it, never authors it.
    caption: z.string().optional().describe("Optional one-line framing above the diagram"),
});

export const ContactCard = z.object({
    type: z.literal("contact_card"),
    email: z.string(),
    linkedIn: z.string().optional(),
    location: z.string().optional(),
    reason: z.string().optional().describe("Why this card is shown, e.g. 'The specifics live on Riley's resume — email her'"),
});

export const Block = z.discriminatedUnion("type", [
    TextBlock,
    ProjectCard,
    MovieCard,
    RestaurantCard,
    LinkCard,
    IntroCard,
    ArchitectureCard,
    ContactCard,
]);

// ---------------------------------------------------------------------------
// Response envelope — every model response is exactly this shape.
// ---------------------------------------------------------------------------

export const ChatResponse = z.object({
    state: z.enum(["answered", "no_data", "no_understanding"]).describe(
        "answered: question understood and answered (incl. polite refusals of off-topic asks). " +
        "no_data: understood, but the fact is not in the knowledge base — say so, never guess. " +
        "no_understanding: could not parse what was asked — ask to rephrase, never bluff."
    ),
    intent: z.string().nullable().describe(
        "Short human-readable label of what was understood, e.g. 'AI product work'. Null exactly when state is no_understanding."
    ),
    blocks: z.array(Block).min(1),
    suggestions: z.array(z.string()).max(3).optional().describe(
        "Up to 3 short follow-up questions the visitor might ask next"
    ),
});

// JSON Schema rendering of the contract, for injection into the system prompt —
// the prompt's format spec is generated from this file, never hand-written.
export function chatResponseJsonSchema(): string {
    return JSON.stringify(z.toJSONSchema(ChatResponse), null, 2);
}

// ---------------------------------------------------------------------------
// Inferred TS types — one schema, both artifacts.
// ---------------------------------------------------------------------------

export type TextBlock = z.infer<typeof TextBlock>;
export type ProjectCard = z.infer<typeof ProjectCard>;
export type MovieCard = z.infer<typeof MovieCard>;
export type RestaurantCard = z.infer<typeof RestaurantCard>;
export type LinkCard = z.infer<typeof LinkCard>;
export type IntroCard = z.infer<typeof IntroCard>;
export type ArchitectureCard = z.infer<typeof ArchitectureCard>;
export type ContactCard = z.infer<typeof ContactCard>;
export type Block = z.infer<typeof Block>;
export type ChatResponse = z.infer<typeof ChatResponse>;
