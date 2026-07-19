import React from "react";
import type { Preview } from "@storybook/nextjs-vite";
import { quicksand, highbeams } from "../lib/fonts";
import { InkFilter } from "../components/InkFilter";
import "../app/globals.css";

const preview: Preview = {
    decorators: [
        (Story) => (
            <div className={`${quicksand.variable} ${highbeams.variable}`} style={{ fontFamily: "var(--font-body)" }}>
                <InkFilter />
                <Story />
            </div>
        ),
    ],
    parameters: {
        layout: "centered",
        backgrounds: {
            options: {
                paper: { name: "paper", value: "oklch(97% 0.012 85)" },
                card: { name: "card", value: "oklch(99% 0.006 85)" },
            },
        },
    },
    initialGlobals: {
        backgrounds: { value: "paper" },
    },
};

export default preview;
