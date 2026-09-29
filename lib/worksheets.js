// Turns what someone typed into a saved worksheet:
//   1. Already made before?  -> return the saved copy (fast, no API calls).
//   2. AI helper configured? -> let the agent find the passage + write a title.
//   3. Otherwise             -> parse the reference ourselves and fetch the text.

import { SEASONS } from '../config/seasons.js';
import { FAMOUS_PASSAGES, SEED_TRANSLATION, SEED_VERSES } from '../config/seed-verses.js';
import { agentAvailable, runWorksheetAgent } from './agent.js';
import { fetchPassage, normalizeTranslation, PassageNotFoundError } from './bible.js';
import { normalizeQuery, parseReferenceList, verseCount, formatReference } from './references.js';
import { worksheetKey } from './store.js';

const MAX_VERSES = 20;
const DEFAULT_TITLE = 'Write God’s Word';
const DEFAULT_REFLECTION = 'Draw a picture of what this verse tells you about God.';

export class WorksheetRequestError extends Error {}

/** Builds the seed data for WorksheetStore from config/seed-verses.js. */
export function buildSeed() {
  const worksheets = {};
  const passages = {};
  for (const [reference, [title, reflection, verses]] of Object.entries(SEED_VERSES)) {
    const ref = normalizeQuery(reference);
    const passage = {
      reference: ref,
      translation: SEED_TRANSLATION,
      verses: verses.map(([verse, text]) => ({ verse, text })),
      text: verses.map(([, text]) => text).join(' '),
    };
    passages[worksheetKey(ref, SEED_TRANSLATION)] = passage;
    worksheets[worksheetKey(ref, SEED_TRANSLATION)] = {
      reference: ref,
      translation: SEED_TRANSLATION,
      title,
      reflection,
      passages: [passage],
      source: 'seed',
    };
  }
  return { worksheets, passages, aliases: {} };
}

/** A passage's display title from the seasonal suggestion labels, if it has one. */
function suggestionLabel(reference) {
  for (const season of SEASONS) {
    const hit = season.verses.find((v) => normalizeQuery(v.ref) === reference);
    if (hit) return hit.label;
  }
  return null;
}

export function createWorksheetService(store, { fetch = fetchPassage, agent = runWorksheetAgent, useAgent = agentAvailable } = {}) {
  async function lookupPassage(reference, translation) {
    const cached = store.getPassage(reference, translation);
    if (cached) return cached;
    const passage = await fetch(reference, translation);
    return store.savePassage({ ...passage, reference });
  }

  async function resolve(rawQuery, rawTranslation) {
    const query = String(rawQuery || '').trim().slice(0, 300);
    if (!query) throw new WorksheetRequestError('Type a Bible verse to get started, like "John 3:16".');
    const translation = normalizeTranslation(rawTranslation);

    // 1. Saved before?
    const famous = FAMOUS_PASSAGES[query.toLowerCase().replace(/[’]/g, "'").replace(/[.!?]+$/, '')];
    const canonical = normalizeQuery(query) || (famous && normalizeQuery(famous));
    const saved = (canonical && store.get(canonical, translation)) || store.getByAlias(query, translation);
    if (saved) {
      store.touch(saved, { query });
      return saved;
    }

    const refs = canonical ? parseReferenceList(canonical) : null;
    if (refs && refs.reduce((n, r) => n + verseCount(r), 0) > MAX_VERSES) {
      throw new WorksheetRequestError(
        `That's a lot of writing for little hands! Please choose ${MAX_VERSES} verses or fewer.`,
      );
    }

    // 2. AI agent.
    let result;
    if (useAgent()) {
      result = await agent(canonical || query, translation, { lookup: (ref) => lookupPassage(ref, translation) });
    } else if (refs) {
      // 3. No AI configured: look the references up directly.
      const passages = [];
      for (const ref of refs) passages.push(await lookupPassage(formatReference(ref), translation));
      // Reuse the hand-written title and drawing prompt from a pre-made worksheet
      // for the same verse (e.g. an ESV request for a suggested verse).
      const twin = passages.length === 1 ? store.get(passages[0].reference, SEED_TRANSLATION) : null;
      result = {
        passages,
        title: twin?.title || (passages.length === 1 && suggestionLabel(passages[0].reference)) || DEFAULT_TITLE,
        reflection: twin?.reflection || DEFAULT_REFLECTION,
      };
    } else {
      throw new WorksheetRequestError(
        `We couldn't find a verse for "${query}". Try a reference like "John 3:16" or "Psalm 23:1-3".`,
      );
    }

    const worksheet = store.save(
      {
        reference: result.passages.map((p) => p.reference).join('; '),
        translation,
        title: result.title || DEFAULT_TITLE,
        reflection: result.reflection || DEFAULT_REFLECTION,
        passages: result.passages,
        source: useAgent() ? 'ai' : 'direct',
      },
      { query },
    );
    store.touch(worksheet, { query });
    return worksheet;
  }

  return { resolve, lookupPassage };
}

