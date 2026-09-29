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
  (ages 3–5 / 5–7 / 7+) and the Bible (ESV, KJV or WEB), then **Print** or
  **Download PDF**.
- **Saved worksheets**: every worksheet is saved, so the next person who asks for
  the same verse (or types the same description) gets it instantly. The home
  page lists the most-requested ones.

## Run it

```bash
npm install
export ESV_API_KEY=...                # optional, turns on the ESV (and makes it the default)
export ANTHROPIC_API_KEY=sk-ant-...   # optional, turns on the AI helper
npm start                            # http://localhost:3000
npm test
```

On Windows (Command Prompt) use `set ESV_API_KEY=...` instead of `export`.

Without an API key everything still works for typed references and the
built-in famous passages. The AI helper is only needed for free-text requests.

### ESV

Get a free key at <https://api.esv.org> (create an account, then an
application). With `ESV_API_KEY` set, the ESV appears in the Bible menu and is
the default (set `DEFAULT_TRANSLATION=kjv` to change that). To follow the ESV
API terms, the site:

- shows Crossway's copyright notice on every worksheet page and in the site footer,
- keeps at most 500 ESV verses saved, dropping the least recently used
  worksheets past that (they are simply re-fetched if someone asks again).

Check the current terms on api.esv.org, especially if the site is used
commercially or by a large audience.

## Putting it online (Render)

`render.yaml` sets everything up on [Render](https://render.com):

1. In Render, choose **New + → Blueprint**, connect GitHub, and pick this repository.
2. Paste your `ESV_API_KEY` (and `ANTHROPIC_API_KEY`, if using the AI helper) when asked.
3. After it deploys, open the service's **Settings → Custom Domains** and add the
   DNS records Render shows you at your domain registrar.

Saved worksheets are kept on a small persistent disk (`DATA_DIR=/var/data`).
Every push to the deployed branch redeploys the site automatically.

## How it works

| Piece | File |
|---|---|
| Web server and API (`/api/worksheet`, `/api/worksheet.pdf`, `/api/suggestions`) | `server.js` |
| AI agent: Claude finds the passage with a `lookup_passage` tool, then writes a kid-friendly title and drawing prompt | `lib/agent.js` |
| Scripture text: ESV from [api.esv.org](https://api.esv.org), KJV / WEB from [bible-api.com](https://bible-api.com) | `lib/bible.js` |
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
