// Saves every worksheet that gets made so the same verse can be pulled back up
// instantly next time (and so we don't re-query the Bible service or the AI).
//
// Storage is a single JSON file (data/store.json) on top of the built-in seed
// worksheets. Swap this module for a database later without touching the rest
// of the app.

import fs from 'node:fs';
import path from 'node:path';

const squashQuery = (q) => String(q || '').toLowerCase().replace(/[^a-z0-9:]+/g, ' ').trim();

export const worksheetKey = (reference, translation) => `${reference.toLowerCase()}|${translation}`;

// Copyrighted versions limit how much of their text an app may keep. The ESV API
// terms allow storing at most 500 verses; the API.Bible versions get the same
// cautious limit. Past it, the least recently used worksheets are dropped (and
// simply re-fetched if someone asks again).
export const DEFAULT_VERSE_LIMITS = { esv: 500, niv: 500, nasb: 500, nkjv: 500 };

const lastUsed = (w) => [w.lastRequestedAt || '', w.createdAt || ''].sort().at(-1);
// Most recently used first; `useSeq` breaks ties between same-millisecond saves.
const byRecency = ([, a], [, b]) => lastUsed(b).localeCompare(lastUsed(a)) || (b.useSeq || 0) - (a.useSeq || 0);

export class WorksheetStore {
  constructor({ file, seed, verseLimits = DEFAULT_VERSE_LIMITS } = {}) {
    this.file = file;
    this.verseLimits = verseLimits;
    this.data = { worksheets: {}, aliases: {}, passages: {} };
    this.writeTimer = null;

    if (file && fs.existsSync(file)) this.merge(JSON.parse(fs.readFileSync(file, 'utf8')));
    if (seed) {
      // Seed content always wins (so edits to config/seed-verses.js take
      // effect), but keep the saved request counts.
      for (const [k, w] of Object.entries(seed.worksheets || {})) {
        const saved = this.data.worksheets[k];
        this.data.worksheets[k] = { ...w, requests: saved?.requests || 0, lastRequestedAt: saved?.lastRequestedAt };
      }
      Object.assign(this.data.passages, seed.passages || {});
      this.data.aliases = { ...seed.aliases, ...this.data.aliases };
    }
    this.useSeq = Math.max(0, ...Object.values(this.data.worksheets).map((w) => w.useSeq || 0));
    this.enforceVerseLimits();
  }

  /** Keeps each limited translation's stored text within its verse limit. */
  enforceVerseLimits() {
    for (const [translation, limit] of Object.entries(this.verseLimits)) {
      const worksheets = Object.entries(this.data.worksheets)
        .filter(([, w]) => w.translation === translation)
        .sort(byRecency);

      const kept = new Map(); // passage key -> verse count
      for (const [key, w] of worksheets) {
        const passages = new Map(w.passages.map((p) => [worksheetKey(p.reference, translation), p.verses?.length || 1]));
        const extra = [...passages].filter(([k]) => !kept.has(k)).reduce((n, [, c]) => n + c, 0);
        const total = [...kept.values()].reduce((n, c) => n + c, 0);
        if (total + extra <= limit) {
          passages.forEach((count, k) => kept.set(k, count));
        } else {
          delete this.data.worksheets[key];
          for (const [alias, target] of Object.entries(this.data.aliases)) {
            if (target === key) delete this.data.aliases[alias];
          }
        }
      }
      for (const [key, p] of Object.entries(this.data.passages)) {
        if (p.translation === translation && !kept.has(key)) delete this.data.passages[key];
      }
    }
  }

  merge(other) {
    for (const k of Object.keys(this.data)) Object.assign(this.data[k], other[k] || {});
  }

  /** Cached text for a single passage, e.g. "John 3:16" in KJV. */
  getPassage(reference, translation) {
    return this.data.passages[worksheetKey(reference, translation)] || null;
  }

  savePassage(passage) {
    this.data.passages[worksheetKey(passage.reference, passage.translation)] = passage;
    this.scheduleWrite();
    return passage;
  }

  /** Finds a saved worksheet by its canonical reference. */
  get(reference, translation) {
    return this.data.worksheets[worksheetKey(reference, translation)] || null;
  }

  /** Finds a saved worksheet by a free-text query someone typed before ("the lord's prayer"). */
  getByAlias(query, translation) {
    const key = this.data.aliases[`${squashQuery(query)}|${translation}`];
    return key ? this.data.worksheets[key] || null : null;
  }

  save(worksheet, { query } = {}) {
    const key = worksheetKey(worksheet.reference, worksheet.translation);
    const existing = this.data.worksheets[key];
    const now = new Date().toISOString();
    this.data.worksheets[key] = {
      ...existing,
      ...worksheet,
      createdAt: existing?.createdAt || now,
      requests: existing?.requests || 0,
      useSeq: ++this.useSeq,
    };
    if (query) this.data.aliases[`${squashQuery(query)}|${worksheet.translation}`] = key;
    this.enforceVerseLimits();
    this.scheduleWrite();
    return this.data.worksheets[key];
  }

  /** Records that someone asked for this worksheet (powers the "popular" list). */
  touch(worksheet, { query } = {}) {
    const key = worksheetKey(worksheet.reference, worksheet.translation);
    const entry = this.data.worksheets[key];
    if (!entry) return;
    entry.requests = (entry.requests || 0) + 1;
    entry.lastRequestedAt = new Date().toISOString();
    entry.useSeq = ++this.useSeq;
    if (query) this.data.aliases[`${squashQuery(query)}|${worksheet.translation}`] = key;
    this.scheduleWrite();
  }

  popular(limit = 8) {
    return Object.values(this.data.worksheets)
      .filter((w) => w.requests > 0)
      .sort((a, b) => b.requests - a.requests || (b.lastRequestedAt || '').localeCompare(a.lastRequestedAt || ''))
      .slice(0, limit)
      .map(({ reference, translation, title, requests }) => ({ reference, translation, title, requests }));
  }

  scheduleWrite() {
    if (!this.file || this.writeTimer) return;
    this.writeTimer = setTimeout(() => {
      this.writeTimer = null;
      this.flush();
    }, 250);
    this.writeTimer.unref?.();
  }

  flush() {
    if (!this.file) return;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
    fs.renameSync(tmp, this.file);
  }
}
