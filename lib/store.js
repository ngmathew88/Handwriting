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

export class WorksheetStore {
  constructor({ file, seed } = {}) {
    this.file = file;
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
    };
    if (query) this.data.aliases[`${squashQuery(query)}|${worksheet.translation}`] = key;
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
