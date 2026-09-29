// Parses and normalizes Bible references like "John 3:16", "1 cor 13:4-7",
// "Ps 23" or several at once: "John 3:16; Romans 5:8".

const BOOKS = [
  ['Genesis', 'gen', 'ge', 'gn'],
  ['Exodus', 'exod', 'exo', 'ex'],
  ['Leviticus', 'lev', 'le', 'lv'],
  ['Numbers', 'num', 'nu', 'nm', 'nb'],
  ['Deuteronomy', 'deut', 'deu', 'dt'],
  ['Joshua', 'josh', 'jos', 'jsh'],
  ['Judges', 'judg', 'jdg', 'jg', 'jdgs'],
  ['Ruth', 'rth', 'ru'],
  ['1 Samuel', '1 sam', '1 sa', '1sm', 'i samuel', 'first samuel'],
  ['2 Samuel', '2 sam', '2 sa', '2sm', 'ii samuel', 'second samuel'],
  ['1 Kings', '1 kgs', '1 ki', 'i kings', 'first kings'],
  ['2 Kings', '2 kgs', '2 ki', 'ii kings', 'second kings'],
  ['1 Chronicles', '1 chron', '1 chr', '1 ch', 'i chronicles', 'first chronicles'],
  ['2 Chronicles', '2 chron', '2 chr', '2 ch', 'ii chronicles', 'second chronicles'],
  ['Ezra', 'ezr'],
  ['Nehemiah', 'neh', 'ne'],
  ['Esther', 'esth', 'est', 'es'],
  ['Job', 'jb'],
  ['Psalms', 'psalm', 'ps', 'psa', 'pss', 'psm'],
  ['Proverbs', 'prov', 'pro', 'prv', 'pr'],
  ['Ecclesiastes', 'eccles', 'eccl', 'ecc', 'qoh'],
  ['Song of Solomon', 'song of songs', 'song', 'sos', 'canticles'],
  ['Isaiah', 'isa', 'is'],
  ['Jeremiah', 'jer', 'je', 'jr'],
  ['Lamentations', 'lam', 'la'],
  ['Ezekiel', 'ezek', 'eze', 'ezk'],
  ['Daniel', 'dan', 'da', 'dn'],
  ['Hosea', 'hos', 'ho'],
  ['Joel', 'jl'],
  ['Amos', 'am'],
  ['Obadiah', 'obad', 'ob'],
  ['Jonah', 'jon', 'jnh'],
  ['Micah', 'mic', 'mc'],
  ['Nahum', 'nah', 'na'],
  ['Habakkuk', 'hab', 'hb'],
  ['Zephaniah', 'zeph', 'zep', 'zp'],
  ['Haggai', 'hag', 'hg'],
  ['Zechariah', 'zech', 'zec', 'zc'],
  ['Malachi', 'mal', 'ml'],
  ['Matthew', 'matt', 'mat', 'mt'],
  ['Mark', 'mrk', 'mar', 'mk', 'mr'],
  ['Luke', 'luk', 'lk'],
  ['John', 'joh', 'jhn', 'jn'],
  ['Acts', 'act', 'ac'],
  ['Romans', 'rom', 'ro', 'rm'],
  ['1 Corinthians', '1 cor', '1 co', 'i corinthians', 'first corinthians'],
  ['2 Corinthians', '2 cor', '2 co', 'ii corinthians', 'second corinthians'],
  ['Galatians', 'gal', 'ga'],
  ['Ephesians', 'eph', 'ephes'],
  ['Philippians', 'phil', 'php', 'pp'],
  ['Colossians', 'col', 'co'],
  ['1 Thessalonians', '1 thess', '1 thes', '1 th', 'i thessalonians', 'first thessalonians'],
  ['2 Thessalonians', '2 thess', '2 thes', '2 th', 'ii thessalonians', 'second thessalonians'],
  ['1 Timothy', '1 tim', '1 ti', 'i timothy', 'first timothy'],
  ['2 Timothy', '2 tim', '2 ti', 'ii timothy', 'second timothy'],
  ['Titus', 'tit', 'ti'],
  ['Philemon', 'philem', 'phm', 'pm'],
  ['Hebrews', 'heb'],
  ['James', 'jas', 'jm'],
  ['1 Peter', '1 pet', '1 pe', '1 pt', 'i peter', 'first peter'],
  ['2 Peter', '2 pet', '2 pe', '2 pt', 'ii peter', 'second peter'],
  ['1 John', '1 jn', '1 jhn', '1 jo', 'i john', 'first john'],
  ['2 John', '2 jn', '2 jhn', 'ii john', 'second john'],
  ['3 John', '3 jn', '3 jhn', 'iii john', 'third john'],
  ['Jude', 'jud', 'jd'],
  ['Revelation', 'revelations', 'rev', 're', 'rv'],
];

const squash = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const BOOK_LOOKUP = new Map();
for (const [name, ...aliases] of BOOKS) {
  for (const alias of [name, ...aliases]) BOOK_LOOKUP.set(squash(alias), name);
}

// Psalms reads better singular when a single psalm is cited ("Psalm 23:1").
function displayBook(book, chapter, chapterEnd) {
  if (book === 'Psalms' && (!chapterEnd || chapterEnd === chapter)) return 'Psalm';
  return book;
}

const REF_PATTERN =
  /^\s*((?:[1-3]|i{1,3}|first|second|third)?\s*[a-z][a-z .]*?)\.?\s*(\d{1,3})(?:(?:\s*[:.]\s*|\s+)(\d{1,3}))?(?:\s*[-–—]\s*(\d{1,3})(?:\s*[:.]\s*(\d{1,3}))?)?\s*$/i;

/** Parses one reference. Returns null when the text isn't a recognizable reference. */
export function parseReference(input) {
  const m = REF_PATTERN.exec(String(input || '').replace(/\s+/g, ' '));
  if (!m) return null;
  const book = BOOK_LOOKUP.get(squash(m[1]));
  if (!book) return null;

  const chapter = Number(m[2]);
  let verseStart = m[3] ? Number(m[3]) : null;
  let chapterEnd = chapter;
  let verseEnd = verseStart;

  if (m[4] && m[5]) {
    // "John 3:16-4:2"
    chapterEnd = Number(m[4]);
    verseEnd = Number(m[5]);
  } else if (m[4]) {
    if (verseStart === null) chapterEnd = Number(m[4]); // "Psalm 1-2"
    else verseEnd = Number(m[4]); // "John 3:16-18"
  }

  if (chapter < 1 || chapterEnd < chapter) return null;
  if (verseStart !== null && chapterEnd === chapter && verseEnd < verseStart) return null;
  if (verseStart === 0) verseStart = 1;

  return { book, chapter, verseStart, chapterEnd, verseEnd };
}

/** Canonical display string for a parsed reference, e.g. "1 Corinthians 13:4-7". */
export function formatReference(ref) {
  const book = displayBook(ref.book, ref.chapter, ref.chapterEnd);
  if (ref.verseStart === null) {
    return ref.chapterEnd !== ref.chapter
      ? `${book} ${ref.chapter}-${ref.chapterEnd}`
      : `${book} ${ref.chapter}`;
  }
  let out = `${book} ${ref.chapter}:${ref.verseStart}`;
  if (ref.chapterEnd !== ref.chapter) out += `-${ref.chapterEnd}:${ref.verseEnd}`;
  else if (ref.verseEnd !== ref.verseStart) out += `-${ref.verseEnd}`;
  return out;
}

/**
 * Parses a user's query into one or more references. Selections can be
 * separated by ";", "&", "+", " and ", or commas between full references.
 * Returns null if any piece isn't a recognizable reference.
 */
export function parseReferenceList(input) {
  const text = String(input || '').trim();
  if (!text) return null;
  const pieces = text
    .split(/\s*(?:;|&|\+|\band\b|,(?=\s*(?:[1-3]\s*)?[a-z]))\s*/i)
    .filter(Boolean);
  const refs = [];
  for (const piece of pieces) {
    const ref = parseReference(piece);
    if (!ref) return null;
    refs.push(ref);
  }
  return refs.length ? refs : null;
}

/** Normalizes a free-form query into a canonical reference string, or null. */
export function normalizeQuery(input) {
  const refs = parseReferenceList(input);
  return refs ? refs.map(formatReference).join('; ') : null;
}

/** Counts the verses a parsed reference spans (approximate for cross-chapter ranges). */
export function verseCount(ref) {
  if (ref.verseStart === null) return 30 * (ref.chapterEnd - ref.chapter + 1);
  if (ref.chapterEnd !== ref.chapter) return 30;
  return ref.verseEnd - ref.verseStart + 1;
}
