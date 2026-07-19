# Fonts (not committed)

Highbeams (TAY / Work by Taylor) is a licensed font. The EULA permits webfont
use (@font-face, unlimited sites) but forbids redistributing the font files —
so the .woff2 files live here locally and are gitignored, never pushed to the
public repo.

To set up on a new machine: copy from the licensed download
(`Highbeams_Standard/`) into this directory:

- `TAYHighBeamsRegular.woff2`
- `TAYHighBeams-Italic.woff2`

For deployment (Vercel), the files must reach the build without entering git —
e.g. a prebuild step that pulls them from private storage. Decide at deploy time.
