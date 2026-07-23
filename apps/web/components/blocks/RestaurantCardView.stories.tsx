import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RestaurantCardView } from "./RestaurantCardView";

const lavash = {
    name: "Lavash",
    cuisine: "Persian",
    neighborhood: "Inner Sunset",
    photo: "/restaurants/lavash.jpg",
    url: "https://maps.google.com/?q=Lavash+San+Francisco",
};

const meta = {
    title: "Blocks/RestaurantCard",
    component: RestaurantCardView,
} satisfies Meta<typeof RestaurantCardView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: lavash,
};

export const Bitten: Story = {
    args: { ...lavash, defaultBitten: true },
};

export const NoPhoto: Story = {
    args: { ...lavash, photo: undefined },
};

export const WithNote: Story = {
    args: { ...lavash, note: "PLACEHOLDER — Riley's real note goes here." },
};
