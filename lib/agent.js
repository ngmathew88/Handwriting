// The AI worksheet agent.
//
// Given whatever a volunteer typed ("John 3:16", "the Lord's prayer",
// "love is patient", "psalm 23 and the golden rule"), Claude:
//   1. figures out which passage(s) are meant and looks up the exact text with
//      the `lookup_passage` tool (scripture text only ever comes from the tool),
//   2. calls `finish_worksheet` with a short kid-friendly title and a
//      "Think & Draw" prompt for the bottom of the page.

import Anthropic from '@anthropic-ai/sdk';
import { fetchPassage, PassageNotFoundError, TRANSLATIONS } from './bible.js';
import { normalizeQuery, parseReference, verseCount } from './references.js';

const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5-5';
const MAX_TURNS = 8;
const MAX_VERSES_PER_LOOKUP = 12;

export const agentAvailable = () =>
  Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

const SYSTEM_PROMPT = `You help children's ministry volunteers make handwriting practice worksheets that kids (ages 3-10) fill in during a church service.

The volunteer types a Bible reference, several references, or a description of a passage ("the Lord's prayer", "love is patient", "the verse about being fearfully and wonderfully made"). Your job:

1. Work out which passage(s) they mean. Use lookup_passage to get the exact text of each one. If a description could match several passages, pick the best-known one. Check the returned text actually matches what they described; if not, try another reference.
2. Keep each selection to what they asked for. For a description, choose the shortest well-known passage that captures it (usually 1-4 verses) since young children will be copying it by hand.
3. Call finish_worksheet with the references exactly as you looked them up (in the order the volunteer gave them), a warm title of 2-5 words for the top of the page, and a one-sentence "Think & Draw" prompt that invites a child to draw a picture about the verse.

Never write out scripture text yourself; the worksheet uses only the text returned by lookup_passage. If nothing the volunteer typed can be matched to a Bible passage, call finish_worksheet with an empty references list.`;

const TOOLS = [
  {
    name: 'lookup_passage',
    description:
      'Look up the exact text of one Bible passage. Use a standard reference such as "John 3:16", "Psalm 23:1-3" or "1 Corinthians 13:4-7". One passage per call; up to 12 verses.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        reference: { type: 'string', description: 'A single Bible reference, e.g. "Matthew 6:9-13".' },
      },
      required: ['reference'],
      additionalProperties: false,
    },
  },
  {
    name: 'finish_worksheet',
    description: 'Finish the worksheet once every passage has been looked up successfully.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        references: {
          type: 'array',
          items: { type: 'string' },
          description: 'The references to put on the worksheet, each exactly as passed to lookup_passage.',
        },
        title: { type: 'string', description: 'Kid-friendly page title, 2-5 words, e.g. "God Loves Me!"' },
        reflection_prompt: {
          type: 'string',
          description: 'One short sentence inviting a child to draw about the verse.',
        },
      },
      required: ['references', 'title', 'reflection_prompt'],
      additionalProperties: false,
    },
  },
];

let client;
const getClient = () => (client ??= new Anthropic());

/**
 * Runs the agent. `lookup(reference)` returns a passage (cached or fetched).
 * Resolves to { passages, title, reflection } or throws PassageNotFoundError.
 */
export async function runWorksheetAgent(
  query,
  translation,
  { lookup = (r) => fetchPassage(r, translation), client: anthropic = getClient() } = {},
) {
  const found = new Map(); // canonical reference -> passage
  const messages = [
    {
      role: 'user',
      content: `Translation: ${TRANSLATIONS[translation]}\nThe volunteer typed: ${JSON.stringify(query)}`,
    },
  ];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      tool_choice: { type: 'auto' },
      output_config: { effort: 'low' },
      // If a request is ever declined by a safety classifier, retry it on the
      // recommended fallback model instead of failing the page.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages,
    });

    if (response.stop_reason === 'refusal') {
      throw new Error('The AI helper could not make this worksheet. Try typing a Bible reference like "John 3:16".');
    }
    messages.push({ role: 'assistant', content: response.content });

    const toolUses = response.content.filter((b) => b.type === 'tool_use');
    if (!toolUses.length) break;

    const results = [];
    for (const call of toolUses) {
      if (call.name === 'finish_worksheet') {
        const { references = [], title = '', reflection_prompt = '' } = call.input || {};
        const passages = references
          .map((r) => found.get(canonical(r)))
          .filter(Boolean);
        if (!references.length) throw new PassageNotFoundError(`Couldn't find a Bible passage for "${query}".`);
        if (passages.length === references.length) {
          return { passages, title: title.trim(), reflection: reflection_prompt.trim() };
        }
        results.push(toolError(call.id, 'Every reference must be looked up successfully with lookup_passage first.'));
      } else if (call.name === 'lookup_passage') {
        results.push(await runLookup(call, lookup, found));
      } else {
        results.push(toolError(call.id, `Unknown tool ${call.name}.`));
      }
    }
    messages.push({ role: 'user', content: results });
  }

  throw new PassageNotFoundError(`Couldn't find a Bible passage for "${query}".`);
}

const canonical = (reference) => normalizeQuery(reference) || String(reference).trim();

async function runLookup(call, lookup, found) {
  const reference = String(call.input?.reference || '');
  const parsed = parseReference(reference);
  if (!parsed) return toolError(call.id, `"${reference}" is not a single Bible reference. Use a form like "John 3:16".`);
  if (verseCount(parsed) > MAX_VERSES_PER_LOOKUP) {
    return toolError(call.id, `That is too long for a kids' worksheet. Choose ${MAX_VERSES_PER_LOOKUP} verses or fewer.`);
  }
  try {
    const passage = await lookup(canonical(reference));
    found.set(canonical(reference), passage);
    return {
      type: 'tool_result',
      tool_use_id: call.id,
      content: JSON.stringify({ reference: passage.reference, text: passage.text }),
    };
  } catch (err) {
    return toolError(call.id, err.message);
  }
}

const toolError = (id, message) => ({ type: 'tool_result', tool_use_id: id, content: message, is_error: true });
