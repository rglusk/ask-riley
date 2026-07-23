import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { IntroCardView } from "./IntroCardView";

const base = {
    name: "Riley Glusker",
    headline: "Staff Frontend Engineer at Airbnb (Messaging)",
    tagline: "I build streaming interfaces and server-driven UI at Airbnb — and I watch pretty much every horror movie that comes out.",
    images: [
        { src: "/photos/riley-garden-wide.jpg", alt: "Riley in a garden with a palace behind her" },
        { src: "/photos/riley-cafe.jpg", alt: "Riley at a café with a glass of wine" },
    ],
    stats: [
        { label: "Horror Movie Completionism", value: 99, viz: "line" as const },
        { label: "Years in the Industry", value: 12, viz: "since" as const, sinceDate: "2014-06-01" },
        { label: "Unfinished Sweaters", value: 7, viz: "sweaters" as const },
        { label: "Pub Quiz Titles", value: 1, viz: "trophy" as const },
    ],
};

const meta = {
    title: "Blocks/IntroCard",
    component: IntroCardView,
} satisfies Meta<typeof IntroCardView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: base };

export const MultiPhoto: Story = {
    args: {
        ...base,
        images: [
            { src: "/photos/riley-garden-wide.jpg", alt: "Riley in a garden with a palace behind her" },
            { src: "/photos/riley.jpg", alt: "Riley in a garden, close up" },
        ],
    },
};

export const NoStats: Story = { args: { ...base, stats: undefined } };
