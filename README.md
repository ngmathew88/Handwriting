# Little Scribes

Turn any Bible verse into a printable handwriting worksheet so kids can trace
and write God's Word during a church service.

- **Search bar + Go.** Type a reference (`John 3:16`, `ps 23:1-3`, `1 cor 13:4-7`),
  several references (`John 3:16; Romans 5:8`) or, with the AI helper on, a
  description (`the Lord's prayer`, `the verse about being fearfully made`).
- **Five seasonal suggestion bubbles** that change with the church calendar:
  Advent, Christmas, Lent, Holy Week, Good Friday, Easter, Pentecost,
  Mother's Day, Father's Day, Back to School, Thanksgiving, and everyday favorites.
- **Worksheet page**: gray letters to trace on handwriting lines, blank practice
  lines, a name/date line, and a "Think & Draw" box. Choose the letter size
  (ages 3–5 / 5–7 / 7+) and the Bible (ESV, NIV, NASB or NKJV), then **Print** or
  **Download PDF**.
- **Saved worksheets**: every worksheet is saved, so the next person who asks for
  the same verse (or types the same description) gets it instantly. The home
  page lists the most-requested ones.

## Run it

```bash
npm install
export ESV_API_KEY=...                # turns on the ESV (the default version)
export API_BIBLE_KEY=...              # turns on NIV, NASB and NKJV (via API.Bible)
export ANTHROPIC_API_KEY=sk-ant-...   # optional, turns on the AI helper
npm start                            # http://localhost:3000
npm test
```

On Windows (Command Prompt) use `set ESV_API_KEY=...` instead of `export`.

With no Bible keys at all, the site falls back to the public-domain KJV so it
still runs locally. The AI helper is only needed for free-text requests.

### Bible versions

The versions in the menu, their API.Bible IDs and fallback copyright notices
live in `config/translations.js`. A version only appears when its key is set.

### ESV

Get a free key at <https://api.esv.org> (create an account, then an
application). With `ESV_API_KEY` set, the ESV appears in the Bible menu and is
the default (set `DEFAULT_TRANSLATION=niv`, for example, to change that).

To follow the publishers' terms, the site:

- shows each version's copyright notice on every worksheet page and in the site
  footer (using the exact wording API.Bible returns),
- reports each view of API.Bible text through its Fair Use Management System
  (FUMS): in the browser for on-screen pages, from the server for PDF downloads,
- keeps at most 500 verses saved per copyrighted version, dropping the least
  recently used worksheets past that (they are simply re-fetched if asked again).

Check the current terms on api.esv.org and api.bible, especially if the site is
used commercially or by a large audience. If API.Bible changes its address, set
`API_BIBLE_BASE` (default: `https://rest.api.bible/v1`, then
`https://api.scripture.api.bible/v1`).

## Putting it online (Render)

`render.yaml` sets everything up on [Render](https://render.com):

1. In Render, choose **New + → Blueprint**, connect GitHub, and pick this repository.
2. Paste your `ESV_API_KEY`, `API_BIBLE_KEY` (and `ANTHROPIC_API_KEY`, if using the AI helper) when asked.
3. After it deploys, open the service's **Settings → Custom Domains** and add the
   DNS records Render shows you at your domain registrar.

Saved worksheets are kept on a small persistent disk (`DATA_DIR=/var/data`).
Every push to the deployed branch redeploys the site automatically.

## How it works

| Piece | File |
|---|---|
| Web server and API (`/api/worksheet`, `/api/worksheet.pdf`, `/api/suggestions`) | `server.js` |
| AI agent: Claude finds the passage with a `lookup_passage` tool, then writes a kid-friendly title and drawing prompt | `lib/agent.js` |
| Scripture text: ESV from [api.esv.org](https://api.esv.org), NIV / NASB / NKJV from [API.Bible](https://api.bible) | `lib/bible.js`, `config/translations.js` |
| Saved worksheets (JSON file at `data/store.json`) | `lib/store.js` |
| Page layout shared by the on-screen preview and the PDF | `lib/layout.js`, `lib/pdf.js` |
| Reference parsing (book abbreviations, ranges, multiple verses) | `lib/references.js` |

The AI never writes scripture itself. The worksheet only uses text returned by
the Bible lookup, so kids always copy the real words.

## Customizing

- **Seasonal bubbles**: edit `config/seasons.js`. Preview a date with
  `/?date=2026-12-20`.
- **Pre-made verses** (instant, work offline): `config/seed-verses.js`.
- **Site name and tagline**: `config/site.js`.
- **AI model**: set `CLAUDE_MODEL` (default `claude-opus-5-5`).

Handwriting font: [Andika](https://software.sil.org/andika/) by SIL (Open Font
License), a font designed for early readers.
