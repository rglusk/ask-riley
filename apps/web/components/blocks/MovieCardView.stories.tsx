import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MovieCardView } from "./MovieCardView";

// NOTE: takes below are placeholder fixture text — Riley supplies the real
// one-liners here and in knowledge.json (they must be her actual opinions).
const oddity = {
    title: "Oddity",
    year: 2024,
    director: "Damian McCarthy",
    take: "That wooden man is going to live rent-free in my head forever — a masterclass in dread built from a single cursed prop.",
    vibe: "folk dread",
    poster: "/posters/oddity.jpg",
    url: "https://www.imdb.com/title/tt26470109/",
};

const obsession = {
    title: "Obsession",
    year: 2025,
    director: "Curry Barker",
    take: "Be careful what you wish for, dial it to eleven, and trap it in a car with you.",
    vibe: "psychological",
    poster: "/posters/obsession.jpg",
    url: "https://www.imdb.com/title/tt37287335/",
};

const exhuma = {
    title: "Exhuma",
    year: 2024,
    director: "Jang Jae-hyun",
    take: "Korean folk horror that treats grave-digging with the gravity it deserves — and then goes somewhere you will not predict.",
    vibe: "folk horror",
    poster: "/posters/exhuma.jpg",
    url: "https://www.imdb.com/title/tt27802490/",
};

const meta = {
    title: "Blocks/MovieCard",
    component: MovieCardView,
} satisfies Meta<typeof MovieCardView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: oddity,
};

export const NoPoster: Story = {
    args: { ...oddity, poster: undefined },
};

export const NoYearNoDirector: Story = {
    args: { ...obsession, year: undefined, director: undefined },
};

export const NoVibe: Story = {
    args: { ...exhuma, vibe: undefined },
};

export const Minimal: Story = {
    args: { title: "Exhuma", take: "Just see it." },
};

// knowledge.json takes are currently null — this is what production cards
// actually look like until Riley writes hers
export const NoTake: Story = {
    args: { ...oddity, take: undefined },
};

export const LongTake: Story = {
    args: {
        ...oddity,
        take: "A one-location, one-cursed-object movie that understands the oldest rule of horror: the scariest thing in any room is the thing you have decided not to look at directly, and the second scariest is the certainty that it moved while you were not looking, which this film weaponizes for ninety straight minutes without mercy.",
    },
};

export const ThreeInARow: Story = {
    args: oddity, // unused by render; satisfies the required-props story type
    render: () => (
        <div className="flex flex-wrap gap-4">
            <MovieCardView {...oddity} />
            <MovieCardView {...obsession} />
            <MovieCardView {...exhuma} />
        </div>
    ),
};
