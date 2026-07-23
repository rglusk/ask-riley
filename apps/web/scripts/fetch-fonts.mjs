// Fetch licensed font files from private storage before build.
// The TAY EULA forbids redistributing the files, so they are gitignored and
// must reach CI builds via FONTS_BASE_URL (see ../fonts/README.md).
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const fontsDir = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "fonts",
);
const files = ["TAYHighBeamsRegular.woff2", "TAYHighBeams-Italic.woff2"];

const missing = files.filter((f) => !existsSync(path.join(fontsDir, f)));
if (missing.length === 0) {
    console.log("fetch-fonts: all font files present, skipping download");
    process.exit(0);
}

const baseUrl = process.env.FONTS_BASE_URL;
if (!baseUrl) {
    console.error(
        `fetch-fonts: missing ${missing.join(", ")} and FONTS_BASE_URL is not set.\n` +
            "Locally: copy the .woff2 files from the licensed download into apps/web/fonts/.\n" +
            "On Vercel: set FONTS_BASE_URL (and FONTS_AUTH_TOKEN if the storage requires it).",
    );
    process.exit(1);
}

const headers = process.env.FONTS_AUTH_TOKEN
    ? { Authorization: `Bearer ${process.env.FONTS_AUTH_TOKEN}` }
    : {};

await mkdir(fontsDir, { recursive: true });
for (const file of missing) {
    const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/${file}`, {
        headers,
    });
    if (!res.ok) {
        console.error(`fetch-fonts: ${res.status} ${res.statusText} for ${file}`);
        process.exit(1);
    }
    await writeFile(
        path.join(fontsDir, file),
        Buffer.from(await res.arrayBuffer()),
    );
    console.log(`fetch-fonts: downloaded ${file}`);
}
