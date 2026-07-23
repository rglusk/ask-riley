import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArchitectureCardView } from "./ArchitectureCardView";

const meta = {
    title: "Blocks/ArchitectureCard",
    component: ArchitectureCardView,
    parameters: { layout: "padded" },
} satisfies Meta<typeof ArchitectureCardView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };

export const WithCaption: Story = {
    args: { caption: "Ask me how I work — here's the whole pipeline:" },
};
