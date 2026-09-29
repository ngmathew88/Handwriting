// Fetches exact scripture text. Worksheet text always comes from here or the
// saved store, never from the AI model, so kids copy the real words of the verse.
//
//   ESV      -> api.esv.org (needs a free API key in ESV_API_KEY)
//   KJV, WEB -> bible-api.com (public domain, no key)

export const TRANSLATIONS = {
  esv: 'English Standard Version',
  kjv: 'King James Version',
  web: 'World English Bible',
};

// Shown on worksheets and the site. The ESV API terms require this notice.
export const COPYRIGHT = {
  esv: 'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.',
};

const esvKey = () => process.env.ESV_API_KEY || '';

/** Translations that can be used right now (ESV only when a key is configured). */
export function availableTranslations() {
  return Object.fromEntries(Object.entries(TRANSLATIONS).filter(([k]) => k !== 'esv' || esvKey()));
}

/** ESV when it's set up, otherwise KJV. Override with DEFAULT_TRANSLATION=kjv|web|esv. */
export function defaultTranslation() {
  const available = availableTranslations();
  const preferred = String(process.env.DEFAULT_TRANSLATION || '').toLowerCase();
  if (available[preferred]) return preferred;
  return available.esv ? 'esv' : 'kjv';
}

export function normalizeTranslation(t) {
  const key = String(t || '').toLowerCase();
  return availableTranslations()[key] ? key : defaultTranslation();
}

const BIBLE_API_BASE = process.env.BIBLE_API_BASE || 'https://bible-api.com';
const ESV_API_BASE = process.env.ESV_API_BASE || 'https://api.esv.org';

export class PassageNotFoundError extends Error {}

const cleanText = (s) =>
  String(s)
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();

async function request(url, init) {
  try {
    return await fetch(url, init);
  } catch (err) {
    throw new Error(`Could not reach the Bible text service: ${err.message}`);
  }
}

/**
 * Looks up one reference (e.g. "John 3:16-17") and returns
 * { reference, translation, verses: [{ verse, text }], text }.
 */
export async function fetchPassage(reference, translation = defaultTranslation()) {
  return translation === 'esv' ? fetchEsv(reference) : fetchBibleApi(reference, translation);
}

async function fetchBibleApi(reference, translation) {
  const url = `${BIBLE_API_BASE}/${encodeURIComponent(reference)}?translation=${translation}`;
  const res = await request(url, { headers: { accept: 'application/json' } });
  if (res.status === 404) throw new PassageNotFoundError(`No passage found for "${reference}".`);
  if (res.status === 429) throw new Error('The Bible text service is busy. Please try again in a minute.');
  if (!res.ok) throw new Error(`Bible text service returned ${res.status}.`);

  const data = await res.json();
  if (!data.verses?.length) throw new PassageNotFoundError(`No passage found for "${reference}".`);

  const verses = data.verses.map((v) => ({ verse: v.verse, text: cleanText(v.text) }));
  return { reference, translation, verses, text: verses.map((v) => v.text).join(' ') };
}

// Plain-text endpoint (https://api.esv.org/docs/passage-text/): just the words,
// with verse numbers like "[16]" kept so we can split the text into verses.
const ESV_OPTIONS = {
  'include-passage-references': 'false',
  'include-verse-numbers': 'true',
  'include-first-verse-numbers': 'true',
  'include-footnotes': 'false',
  'include-footnote-body': 'false',
  'include-headings': 'false',
  'include-short-copyright': 'false',
  'include-copyright': 'false',
  'include-passage-horizontal-lines': 'false',
  'include-heading-horizontal-lines': 'false',
  'include-selahs': 'true',
  'indent-paragraphs': '0',
  'indent-poetry': 'false',
};

/** Splits ESV text like "[16] For God so loved… [17] For God did not…" into verses. */
export function splitEsvVerses(text) {
  const parts = String(text).split(/\[(\d+)\]/);
  const verses = [];
  const lead = cleanText(parts[0]);
  if (lead) verses.push({ verse: null, text: lead });
  for (let i = 1; i < parts.length; i += 2) {
    const verseText = cleanText(parts[i + 1] || '');
    if (verseText) verses.push({ verse: Number(parts[i]), text: verseText });
  }
  return verses;
}

async function fetchEsv(reference) {
  if (!esvKey()) throw new Error('The ESV needs an API key. Set ESV_API_KEY and restart the site.');
  const params = new URLSearchParams({ q: reference, ...ESV_OPTIONS });
  const res = await request(`${ESV_API_BASE}/v3/passage/text/?${params}`, {
    headers: { Authorization: `Token ${esvKey()}`, accept: 'application/json' },
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error('The ESV API key was not accepted. Check ESV_API_KEY.');
  }
  if (res.status === 429) throw new Error('The ESV service is busy. Please try again in a minute.');
  if (!res.ok) throw new Error(`ESV service returned ${res.status}.`);

  const data = await res.json();
  const verses = (data.passages || []).flatMap(splitEsvVerses);
  if (!verses.length) throw new PassageNotFoundError(`No passage found for "${reference}".`);
  return { reference, translation: 'esv', verses, text: verses.map((v) => v.text).join(' ') };
}
