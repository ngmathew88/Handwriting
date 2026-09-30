// Fetches exact scripture text. Worksheet text always comes from here or the
// saved store, never from the AI model, so kids copy the real words of the verse.
//
// Which versions exist and where their text comes from: config/translations.js

import { TRANSLATION_CONFIG } from '../config/translations.js';
import { parseReference } from './references.js';

/** Display names for every configured version, e.g. { niv: 'New International Version' }. */
export const TRANSLATIONS = Object.fromEntries(Object.entries(TRANSLATION_CONFIG).map(([k, v]) => [k, v.name]));

// Copyright notices, updated with the publisher's exact wording whenever an API
// response includes it.
export const COPYRIGHT = Object.fromEntries(
  Object.entries(TRANSLATION_CONFIG).filter(([, v]) => v.copyright).map(([k, v]) => [k, v.copyright]),
);

export function rememberCopyright(translation, text) {
  const clean = cleanText(text || '');
  if (clean && TRANSLATION_CONFIG[translation]) COPYRIGHT[translation] = clean;
}

const PROVIDER_KEYS = {
  esv: () => process.env.ESV_API_KEY || '',
  apibible: () => process.env.API_BIBLE_KEY || '',
  bibleapi: () => 'public',
};
const hasKey = (t) => Boolean(PROVIDER_KEYS[TRANSLATION_CONFIG[t].provider]());

/** Versions that can be used right now, in menu order. */
export function availableTranslations() {
  const ready = Object.keys(TRANSLATION_CONFIG).filter((t) => !TRANSLATION_CONFIG[t].fallback && hasKey(t));
  const list = ready.length ? ready : Object.keys(TRANSLATION_CONFIG).filter((t) => TRANSLATION_CONFIG[t].fallback);
  return Object.fromEntries(list.map((t) => [t, TRANSLATIONS[t]]));
}

/** First available version, unless DEFAULT_TRANSLATION picks another. */
export function defaultTranslation() {
  const available = availableTranslations();
  const preferred = String(process.env.DEFAULT_TRANSLATION || '').toLowerCase();
  return available[preferred] ? preferred : Object.keys(available)[0];
}

export function normalizeTranslation(t) {
  const key = String(t || '').toLowerCase();
  return availableTranslations()[key] ? key : defaultTranslation();
}

export class PassageNotFoundError extends Error {}

function cleanText(s) {
  return String(s)
    .replace(/¶/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

async function request(url, init) {
  try {
    return await fetch(url, init);
  } catch (err) {
    throw new Error(`Could not reach the Bible text service: ${err.message}`);
  }
}

/** Splits text like "[16] For God so loved… [17] For God did not…" into verses. */
export function splitNumberedVerses(text) {
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

const joinVerses = (verses) => verses.map((v) => v.text).join(' ');

/**
 * Looks up one reference (e.g. "John 3:16-17") and returns
 * { reference, translation, verses: [{ verse, text }], text, copyright?, fums? }.
 */
export async function fetchPassage(reference, translation = defaultTranslation()) {
  const config = TRANSLATION_CONFIG[translation];
  if (!config) throw new Error(`Unknown Bible version "${translation}".`);
  if (config.provider === 'esv') return fetchEsv(reference);
  if (config.provider === 'apibible') return fetchApiBible(reference, translation, config);
  return fetchBibleApi(reference, translation);
}

// ── bible-api.com (public domain) ───────────────────────────────────────────

async function fetchBibleApi(reference, translation) {
  const base = process.env.BIBLE_API_BASE || 'https://bible-api.com';
  const res = await request(`${base}/${encodeURIComponent(reference)}?translation=${translation}`, {
    headers: { accept: 'application/json' },
  });
  if (res.status === 404) throw new PassageNotFoundError(`No passage found for "${reference}".`);
  if (res.status === 429) throw new Error('The Bible text service is busy. Please try again in a minute.');
  if (!res.ok) throw new Error(`Bible text service returned ${res.status}.`);

  const data = await res.json();
  if (!data.verses?.length) throw new PassageNotFoundError(`No passage found for "${reference}".`);
  const verses = data.verses.map((v) => ({ verse: v.verse, text: cleanText(v.text) }));
  return { reference, translation, verses, text: joinVerses(verses) };
}

// ── api.esv.org ─────────────────────────────────────────────────────────────

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

async function fetchEsv(reference) {
  const key = PROVIDER_KEYS.esv();
  if (!key) throw new Error('The ESV needs an API key. Set ESV_API_KEY and restart the site.');
  const base = process.env.ESV_API_BASE || 'https://api.esv.org';
  const params = new URLSearchParams({ q: reference, ...ESV_OPTIONS });
  const res = await request(`${base}/v3/passage/text/?${params}`, {
    headers: { Authorization: `Token ${key}`, accept: 'application/json' },
  });
  if (res.status === 401 || res.status === 403) throw new Error('The ESV API key was not accepted. Check ESV_API_KEY.');
  if (res.status === 429) throw new Error('The ESV service is busy. Please try again in a minute.');
  if (!res.ok) throw new Error(`ESV service returned ${res.status}.`);

  const data = await res.json();
  const verses = (data.passages || []).flatMap(splitNumberedVerses);
  if (!verses.length) throw new PassageNotFoundError(`No passage found for "${reference}".`);
  return { reference, translation: 'esv', verses, text: joinVerses(verses) };
}

// ── API.Bible (NIV, NASB, NKJV, …) ─────────────────────────────────────────

// API.Bible names books with USFM codes ("JHN.3.16").
const USFM = {
  Genesis: 'GEN', Exodus: 'EXO', Leviticus: 'LEV', Numbers: 'NUM', Deuteronomy: 'DEU', Joshua: 'JOS',
  Judges: 'JDG', Ruth: 'RUT', '1 Samuel': '1SA', '2 Samuel': '2SA', '1 Kings': '1KI', '2 Kings': '2KI',
  '1 Chronicles': '1CH', '2 Chronicles': '2CH', Ezra: 'EZR', Nehemiah: 'NEH', Esther: 'EST', Job: 'JOB',
  Psalms: 'PSA', Proverbs: 'PRO', Ecclesiastes: 'ECC', 'Song of Solomon': 'SNG', Isaiah: 'ISA',
  Jeremiah: 'JER', Lamentations: 'LAM', Ezekiel: 'EZK', Daniel: 'DAN', Hosea: 'HOS', Joel: 'JOL',
  Amos: 'AMO', Obadiah: 'OBA', Jonah: 'JON', Micah: 'MIC', Nahum: 'NAM', Habakkuk: 'HAB',
  Zephaniah: 'ZEP', Haggai: 'HAG', Zechariah: 'ZEC', Malachi: 'MAL', Matthew: 'MAT', Mark: 'MRK',
  Luke: 'LUK', John: 'JHN', Acts: 'ACT', Romans: 'ROM', '1 Corinthians': '1CO', '2 Corinthians': '2CO',
  Galatians: 'GAL', Ephesians: 'EPH', Philippians: 'PHP', Colossians: 'COL', '1 Thessalonians': '1TH',
  '2 Thessalonians': '2TH', '1 Timothy': '1TI', '2 Timothy': '2TI', Titus: 'TIT', Philemon: 'PHM',
  Hebrews: 'HEB', James: 'JAS', '1 Peter': '1PE', '2 Peter': '2PE', '1 John': '1JN', '2 John': '2JN',
  '3 John': '3JN', Jude: 'JUD', Revelation: 'REV',
};

/** "John 3:16-18" -> "JHN.3.16-JHN.3.18" */
export function toPassageId(reference) {
  const ref = parseReference(reference);
  if (!ref) return null;
  const b = USFM[ref.book];
  if (ref.verseStart === null) {
    return ref.chapterEnd !== ref.chapter ? `${b}.${ref.chapter}-${b}.${ref.chapterEnd}` : `${b}.${ref.chapter}`;
  }
  const start = `${b}.${ref.chapter}.${ref.verseStart}`;
  const end = `${b}.${ref.chapterEnd}.${ref.verseEnd}`;
  return start === end ? start : `${start}-${end}`;
}

const API_BIBLE_OPTIONS = {
  'content-type': 'text',
  'include-notes': 'false',
  'include-titles': 'false',
  'include-chapter-numbers': 'false',
  'include-verse-numbers': 'true',
  'include-verse-spans': 'false',
};

// API.Bible's address. Set API_BIBLE_BASE to override; otherwise try the
// current host, then the older one.
const apiBibleBases = () =>
  process.env.API_BIBLE_BASE
    ? [process.env.API_BIBLE_BASE]
    : ['https://rest.api.bible/v1', 'https://api.scripture.api.bible/v1'];

async function fetchApiBible(reference, translation, config) {
  const key = PROVIDER_KEYS.apibible();
  if (!key) throw new Error('This Bible version needs an API.Bible key. Set API_BIBLE_KEY and restart the site.');
  const passageId = toPassageId(reference);
  if (!passageId) throw new PassageNotFoundError(`"${reference}" is not a Bible reference.`);

  const path = `/bibles/${config.bibleId}/passages/${encodeURIComponent(passageId)}?${new URLSearchParams(API_BIBLE_OPTIONS)}`;
  let res;
  let lastError;
  for (const base of apiBibleBases()) {
    try {
      res = await request(`${base}${path}`, { headers: { 'api-key': key, accept: 'application/json' } });
      if ((res.headers.get('content-type') || '').includes('json')) break;
      lastError = new Error(`Bible text service at ${base} returned ${res.status}.`);
      res = null;
    } catch (err) {
      lastError = err;
    }
  }
  if (!res) throw lastError;

  if (res.status === 401) throw new Error('The API.Bible key was not accepted. Check API_BIBLE_KEY.');
  if (res.status === 403) throw new Error(`Your API.Bible key doesn't have access to the ${config.name}.`);
  if (res.status === 404 || res.status === 400) throw new PassageNotFoundError(`No passage found for "${reference}".`);
  if (res.status === 429) throw new Error('The Bible text service is busy. Please try again in a minute.');
  if (!res.ok) throw new Error(`Bible text service returned ${res.status}.`);

  const { data, meta } = await res.json();
  const verses = splitNumberedVerses(data?.content || '');
  if (!verses.length) throw new PassageNotFoundError(`No passage found for "${reference}".`);
  rememberCopyright(translation, data.copyright);

  return {
    reference,
    translation,
    verses,
    text: joinVerses(verses),
    copyright: data.copyright ? cleanText(data.copyright) : undefined,
    // API.Bible's Fair Use Management System: report each time this text is shown.
    fums: meta?.fumsId
      ? { id: meta.fumsId, script: meta.fumsJsInclude || null, pixel: fumsPixelUrl(meta.fumsNoScript) }
      : undefined,
  };
}

function fumsPixelUrl(noScript) {
  const m = /src=["']([^"']+)["']/i.exec(noScript || '');
  return m ? m[1] : null;
}

/** Reports that API.Bible text was shown where no browser script can run (PDF downloads). */
export function reportFumsViews(passages) {
  for (const p of passages) {
    const url = p.fums?.pixel;
    if (!url) continue;
    fetch(url.startsWith('//') ? `https:${url}` : url).catch(() => {});
  }
}
