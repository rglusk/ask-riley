import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// The social unfurl card (iMessage, Slack, Twitter, …). Rendered on demand,
// so it can pull the portrait off disk and the brand type off Google Fonts.
export const runtime = "nodejs";
export const alt = "ask riley — the interactive portfolio of Riley Glusker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// brand tokens, mirrored from globals.css (oklch → hex)
const PAPER = "#f7f3ea";
const CARD = "#fdfcf8";
const INK = "#1c1b1a";
const INK_SOFT = "#5f5a52";
const PEACH = "#f1caba";

// the site's hand-drawn waving hand (InkHand), inlined. Satori can't run the
// ink-rough filter, so this is the plain path — cream palm, ink outline.
const HAND =
    "data:image/svg+xml;base64," +
    Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><path d="M40 112 C36 94, 30 86, 25 68 C23 60, 31 56, 35 63 L42 78 C39 58, 37 45, 39 31 C40 23, 48 23, 49 31 L52 55 C52 38, 52 27, 54 17 C55 9, 63 9, 64 17 L65 52 C66 36, 67 27, 69 19 C71 11, 78 12, 78 20 L78 56 C79 46, 81 39, 84 33 C87 26, 93 29, 92 36 C90 52, 88 70, 83 86 C79 100, 72 107, 68 112 Z" fill="${CARD}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M100 38 C108 48, 108 62, 100 72" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/><path d="M108 30 C119 44, 119 66, 108 80" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/></svg>`,
    ).toString("base64");

// Google Fonts serves TTF (Satori-friendly) when the request carries no
// woff2-capable UA. Best-effort: on any failure we fall back to Satori's
// default face rather than break the card.
async function loadFont(weight: number): Promise<ArrayBuffer | null> {
    try {
        const css = await fetch(
            `https://fonts.googleapis.com/css2?family=Quicksand:wght@${weight}`,
        ).then((r) => r.text());
        const url = css.match(/src:\s*url\((https:[^)]+\.ttf)\)/i)?.[1];
        if (!url) return null;
        return await fetch(url).then((r) => r.arrayBuffer());
    } catch {
        return null;
    }
}

export default async function OpengraphImage() {
    const [portrait, bold, medium] = await Promise.all([
        readFile(join(process.cwd(), "public/photos/riley-head.png"))
            .then((b) => `data:image/png;base64,${b.toString("base64")}`)
            .catch(() => null),
        loadFont(700),
        loadFont(500),
    ]);

    const fonts = [
        bold && { name: "Quicksand", data: bold, weight: 700 as const, style: "normal" as const },
        medium && { name: "Quicksand", data: medium, weight: 500 as const, style: "normal" as const },
    ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 700 | 500; style: "normal" }[];

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    padding: 44,
                    background: PAPER,
                    fontFamily: "Quicksand",
                }}
            >
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 56,
                        padding: "56px 64px",
                        background: CARD,
                        border: `4px solid ${INK}`,
                        borderRadius: 40,
                        boxShadow: `10px 10px 0 ${INK}`,
                    }}
                >
                    {/* left: the pitch */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        <div
                            style={{
                                display: "flex",
                                fontSize: 26,
                                fontWeight: 700,
                                letterSpacing: 6,
                                color: INK_SOFT,
                            }}
                        >
                            ASK RILEY
                        </div>
                        <div
                            style={{
                                display: "flex",
                                fontSize: 88,
                                fontWeight: 700,
                                color: INK,
                                marginTop: 14,
                                lineHeight: 1.05,
                            }}
                        >
                            Hi, I&apos;m Riley.
                        </div>
                        <div
                            style={{
                                display: "flex",
                                fontSize: 32,
                                fontWeight: 500,
                                color: INK_SOFT,
                                marginTop: 24,
                                maxWidth: 560,
                                lineHeight: 1.35,
                            }}
                        >
                            The movies I love, my work, and how to reach me — one chatty little
                            portfolio.
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                marginTop: 40,
                                padding: "12px 24px",
                                alignSelf: "flex-start",
                                background: PEACH,
                                border: `3px solid ${INK}`,
                                borderRadius: 16,
                                fontSize: 28,
                                fontWeight: 700,
                                color: INK,
                            }}
                        >
                            rileyglusker.com
                        </div>
                    </div>

                    {/* right: the portrait, with the waving hand tucked at its shoulder */}
                    <div style={{ display: "flex", position: "relative" }}>
                        <img src={HAND} width={104} height={104} style={{ position: "absolute", bottom: -30, left: -46 }} />
                        <div
                            style={{
                                display: "flex",
                                width: 300,
                                height: 300,
                                alignItems: "flex-end",
                                justifyContent: "center",
                                background: PEACH,
                                border: `4px solid ${INK}`,
                                borderRadius: 40,
                                overflow: "hidden",
                            }}
                        >
                            {portrait && (
                                <img src={portrait} width={276} height={276} style={{ objectFit: "contain" }} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        ),
        { ...size, fonts: fonts.length ? fonts : undefined },
    );
}
