# Fonts (not committed)

Highbeams (TAY / Work by Taylor) is a licensed font. The EULA permits webfont
use (@font-face, unlimited sites) but forbids redistributing the font files —
so the .woff2 files live here locally and are gitignored, never pushed to the
public repo.

To set up on a new machine: copy from the licensed download
(`Highbeams_Standard/`) into this directory:

- `TAYHighBeamsRegular.woff2`
- `TAYHighBeams-Italic.woff2`

For deployment (Vercel), the files reach the build without entering git via
`scripts/fetch-fonts.mjs`, which runs as part of `pnpm build`. It no-ops when
the files are already present (local dev); otherwise it downloads them from
private storage using two environment variables:

- `FONTS_BASE_URL` — URL prefix where the two `.woff2` files are stored
  (e.g. a Vercel Blob store or private bucket). The script fetches
  `$FONTS_BASE_URL/<filename>`.
- `FONTS_AUTH_TOKEN` — optional; sent as `Authorization: Bearer <token>` if
  the storage requires auth. Unneeded for unguessable Blob URLs.

Set these in Vercel as server-side env vars (never `NEXT_PUBLIC_`). The URL is
only used at build time and never appears in served pages — the fonts are
bundled by `next/font/local` and served first-party from `/_next/static/`,
which is what the EULA's webfont grant covers.
