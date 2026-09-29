// Fetches exact scripture text from bible-api.com (public-domain translations).
// Worksheet text always comes from here or the saved store, never from the AI model,
// so kids copy the real words of the verse.

export const TRANSLATIONS = {
  kjv: 'King James Version',
  web: 'World English Bible',
};

export const DEFAULT_TRANSLATION = 'kjv';

export function normalizeTranslation(t) {
  const key = String(t || '').toLowerCase();
  return TRANSLATIONS[key] ? key : DEFAULT_TRANSLATION;
}

const API_BASE = process.env.BIBLE_API_BASE || 'https://bible-api.com';

export class PassageNotFoundError extends Error {}

const cleanText = (s) =>
  String(s)
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();

/**
 * Looks up one reference (e.g. "John 3:16-17") and returns
 * { reference, translation, verses: [{ chapter, verse, text }], text }.
 */
export async function fetchPassage(reference, translation = DEFAULT_TRANSLATION) {
  const url = `${API_BASE}/${encodeURIComponent(reference)}?translation=${translation}`;
  let res;
  try {
    res = await fetch(url, { headers: { accept: 'application/json' } });
  } catch (err) {
    throw new Error(`Could not reach the Bible text service: ${err.message}`);
  }
  if (res.status === 404) throw new PassageNotFoundError(`No passage found for "${reference}".`);
  if (res.status === 429) throw new Error('The Bible text service is busy. Please try again in a minute.');
  if (!res.ok) throw new Error(`Bible text service returned ${res.status}.`);

  const data = await res.json();
  if (!data.verses?.length) throw new PassageNotFoundError(`No passage found for "${reference}".`);

  const verses = data.verses.map((v) => ({
    chapter: v.chapter,
    verse: v.verse,
    text: cleanText(v.text),
  }));
  return {
    reference: data.reference || reference,
    translation,
    verses,
    text: verses.map((v) => v.text).join(' '),
  };
}
