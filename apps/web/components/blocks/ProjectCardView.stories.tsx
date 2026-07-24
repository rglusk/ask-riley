import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProjectCardView } from "./ProjectCardView";

const messagingCards = {
    title: "Messaging Cards platform",
    role: "Creator and tech lead",
    summary:
        "A composable cross-platform card platform (web, iOS, Android) — a server-driven UI system that became the default integration path for teams building in Messaging.",
    highlights: [
        "Adopted by many products across a dozen-plus partner teams",
        "Serves hundreds of thousands of cards per day",
        "Patent pending",
    ],
    metrics: [
        { value: "100Ks", label: "cards served daily" },
        { value: "dozens", label: "products and partner teams" },
    ],
};

const meta = {
    title: "Blocks/ProjectCard",
    component: ProjectCardView,
} satisfies Meta<typeof ProjectCardView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: messagingCards,
};

export const NoMetrics: Story = {
    args: { ...messagingCards, metrics: undefined },
};

export const NoHighlights: Story = {
    args: { ...messagingCards, highlights: [] },
};
