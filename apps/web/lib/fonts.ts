import localFont from "next/font/local";
import { Quicksand } from "next/font/google";

// design system type roles, per the "Light Pastel / ink hand-drawn" design:
//   accent — Highbeams Italic: the hand-lettered moments (h1, card titles, input, send)
//   body   — Quicksand: chat text, everything else

export const quicksand = Quicksand({
    weight: ["500", "600", "700"],
    subsets: ["latin"],
    variable: "--font-body",
});

export const highbeams = localFont({
    src: [
        { path: "../fonts/TAYHighBeamsRegular.woff2", style: "normal" },
        { path: "../fonts/TAYHighBeams-Italic.woff2", style: "italic" },
    ],
    variable: "--font-accent",
});
