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
  (ages 3–5 / 5–7 / 7+) and the Bible (KJV or WEB), then **Print** or
  **Download PDF**.
- **Saved worksheets**: every worksheet is saved, so the next person who asks for
  the same verse (or types the same description) gets it instantly. The home
  page lists the most-requested ones.

## Run it

```bash
npm install
export ANTHROPIC_API_KEY=sk-ant-...   # optional, turns on the AI helper
npm start                            # http://localhost:3000
npm test
```

Without an API key everything still works for typed references and the
built-in famous passages. The AI helper is only needed for free-text requests.

## How it works

| Piece | File |
|---|---|
| Web server and API (`/api/worksheet`, `/api/worksheet.pdf`, `/api/suggestions`) | `server.js` |
| AI agent: Claude finds the passage with a `lookup_passage` tool, then writes a kid-friendly title and drawing prompt | `lib/agent.js` |
| Scripture text from [bible-api.com](https://bible-api.com) (public-domain KJV / WEB) | `lib/bible.js` |
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
