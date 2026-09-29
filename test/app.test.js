import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runWorksheetAgent } from '../lib/agent.js';
import { layoutWorksheet } from '../lib/layout.js';
import { measure, renderPdf } from '../lib/pdf.js';
import { normalizeQuery, parseReferenceList } from '../lib/references.js';
import { calendarDates, currentSeason, easterSunday } from '../lib/seasons.js';
import { WorksheetStore } from '../lib/store.js';
import { buildSeed, createWorksheetService, WorksheetRequestError } from '../lib/worksheets.js';

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

test('normalizes common ways of typing a reference', () => {
  assert.equal(normalizeQuery('john 3:16'), 'John 3:16');
  assert.equal(normalizeQuery('Jn 3 16'), 'John 3:16');
  assert.equal(normalizeQuery('1 cor 13:4-7'), '1 Corinthians 13:4-7');
  assert.equal(normalizeQuery('I John 4:19'), '1 John 4:19');
  assert.equal(normalizeQuery('ps 23'), 'Psalm 23');
  assert.equal(normalizeQuery('Psalms 119:105'), 'Psalm 119:105');
  assert.equal(normalizeQuery('gal 5:22–23'), 'Galatians 5:22-23');
  assert.equal(normalizeQuery('John 3:16; rom 5:8'), 'John 3:16; Romans 5:8');
  assert.equal(normalizeQuery('John 3:16, Romans 5:8'), 'John 3:16; Romans 5:8');
  assert.equal(normalizeQuery('Song of Solomon 2:4'), 'Song of Solomon 2:4');
  assert.equal(normalizeQuery('love is patient'), null);
  assert.equal(normalizeQuery('John 3:18-16'), null);
  assert.equal(parseReferenceList('the lords prayer'), null);
});

test('computes Easter and church-calendar dates', () => {
  assert.equal(ymd(easterSunday(2026)), '2026-04-05');
  assert.equal(ymd(easterSunday(2027)), '2027-03-28');
  assert.equal(ymd(easterSunday(2024)), '2024-03-31');
  const d = calendarDates(2026);
  assert.equal(ymd(d.goodFriday), '2026-04-03');
  assert.equal(ymd(d.ashWednesday), '2026-02-18');
  assert.equal(ymd(d.adventStart), '2026-11-29');
  assert.equal(ymd(d.thanksgiving), '2026-11-26');
});

test('picks seasonal suggestions by date', () => {
  const season = (s) => currentSeason(new Date(s + 'T12:00:00')).id;
  assert.equal(season('2026-04-03'), 'good-friday');
  assert.equal(season('2026-03-29'), 'holy-week');
  assert.equal(season('2026-04-05'), 'easter');
  assert.equal(season('2026-03-01'), 'lent');
  assert.equal(season('2026-12-01'), 'advent');
  assert.equal(season('2026-12-25'), 'christmas');
  assert.equal(season('2027-01-03'), 'christmas');
  assert.equal(season('2026-11-20'), 'thanksgiving');
  assert.equal(season('2026-05-24'), 'pentecost');
  assert.equal(season('2026-10-14'), 'everyday');
  for (const date of ['2026-04-03', '2026-12-25', '2026-10-14']) {
    assert.equal(currentSeason(new Date(date)).verses.length, 5);
  }
});

test('every seasonal suggestion has a pre-made worksheet', () => {
  const store = new WorksheetStore({ seed: buildSeed() });
  const dates = ['2026-01-02', '2026-02-20', '2026-03-30', '2026-04-03', '2026-04-10', '2026-05-10',
    '2026-05-20', '2026-06-21', '2026-08-20', '2026-10-10', '2026-11-25', '2026-12-10'];
  for (const date of dates) {
    for (const v of currentSeason(new Date(date + 'T12:00:00')).verses) {
      assert.ok(store.get(normalizeQuery(v.ref), 'kjv'), `missing seed for ${v.ref}`);
    }
  }
});

test('saves worksheets and serves them again without refetching', async () => {
  let fetches = 0;
  const fetch = async (reference, translation) => {
    fetches++;
    return { reference, translation, verses: [{ verse: 1, text: 'In the beginning God created the heaven and the earth.' }], text: 'In the beginning God created the heaven and the earth.' };
  };
  const store = new WorksheetStore({ seed: buildSeed() });
  const service = createWorksheetService(store, { fetch, useAgent: () => false });

  const first = await service.resolve('gen 1:1', 'kjv');
  assert.equal(first.reference, 'Genesis 1:1');
  const again = await service.resolve('Genesis 1:1', 'kjv');
  assert.equal(again.reference, 'Genesis 1:1');
  assert.equal(fetches, 1);
  assert.equal(store.popular()[0].reference, 'Genesis 1:1');
  assert.equal(store.popular()[0].requests, 2);

  // Seeded suggestions never hit the network.
  await service.resolve('John 3:16', 'kjv');
  assert.equal(fetches, 1);

  // Well-known descriptions work even without the AI helper.
  assert.equal((await service.resolve('Love is patient', 'kjv')).reference, '1 Corinthians 13:4-7');
  await assert.rejects(service.resolve('that verse about sparrows', 'kjv'), WorksheetRequestError);
  await assert.rejects(service.resolve('Psalm 119', 'kjv'), WorksheetRequestError);
});

test('agent looks up passages with its tool and never supplies scripture text itself', async () => {
  const calls = [];
  const responses = [
    { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 't1', name: 'lookup_passage', input: { reference: '1 Cor 13:4' } }] },
    { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 't2', name: 'finish_worksheet', input: { references: ['1 Corinthians 13:4'], title: 'Love Is Kind', reflection_prompt: 'Draw a kind act.' } }] },
  ];
  const client = { beta: { messages: { create: async (req) => { calls.push(req); return responses[calls.length - 1]; } } } };
  const lookup = async (reference) => ({ reference, translation: 'kjv', verses: [], text: 'Charity suffereth long, and is kind;' });

  const result = await runWorksheetAgent('love is patient', 'kjv', { lookup, client });
  assert.equal(result.title, 'Love Is Kind');
  assert.equal(result.passages[0].reference, '1 Corinthians 13:4');
  assert.equal(result.passages[0].text, 'Charity suffereth long, and is kind;');
  assert.equal(calls[0].model, 'claude-opus-5-5');
  assert.equal(calls[1].messages[2].content[0].tool_use_id, 't1');
});

test('lays out pages and renders a PDF', async () => {
  const seed = buildSeed().worksheets['john 3:16|kjv'];
  const layout = layoutWorksheet(seed, { size: 'large' }, measure);
  assert.ok(layout.pages.length >= 1);
  const texts = layout.pages.flatMap((p) => p.items.filter((i) => i.t === 'text' && i.color === '#b9bcc4').map((i) => i.text));
  assert.equal(texts.join(' '), seed.passages[0].text);
  const pdf = await renderPdf(layout);
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
});

test('fetches ESV text with the API key and splits it into verses', async () => {
  const { fetchPassage, normalizeTranslation, splitEsvVerses } = await import('../lib/bible.js');
  const realFetch = globalThis.fetch;
  const prevKey = process.env.ESV_API_KEY;
  let seen;
  globalThis.fetch = async (url, init) => {
    seen = { url: new URL(url), init };
    return new Response(JSON.stringify({
      canonical: 'John 3:16–17',
      passages: ['[16] For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life. [17] For God did not send his Son into the world to condemn the world, but in order that the world might be saved through him.\n\n'],
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  try {
    delete process.env.ESV_API_KEY;
    assert.equal(normalizeTranslation('esv'), 'kjv'); // ESV is off without a key
    process.env.ESV_API_KEY = 'test-key';
    assert.equal(normalizeTranslation(''), 'esv'); // and the default once it's set up

    const passage = await fetchPassage('John 3:16-17', 'esv');
    assert.equal(seen.url.pathname, '/v3/passage/text/');
    assert.equal(seen.url.searchParams.get('q'), 'John 3:16-17');
    assert.equal(seen.url.searchParams.get('include-headings'), 'false');
    assert.equal(seen.init.headers.Authorization, 'Token test-key');
    assert.deepEqual(passage.verses.map((v) => v.verse), [16, 17]);
    assert.ok(passage.text.startsWith('For God so loved the world'));
    assert.ok(!passage.text.includes('['));
  } finally {
    globalThis.fetch = realFetch;
    if (prevKey === undefined) delete process.env.ESV_API_KEY;
    else process.env.ESV_API_KEY = prevKey;
  }
  assert.deepEqual(splitEsvVerses('no numbers here'), [{ verse: null, text: 'no numbers here' }]);
});

test('keeps at most the allowed number of ESV verses saved', () => {
  const store = new WorksheetStore({ verseLimits: { esv: 5 } });
  const make = (ref, n) => ({
    reference: ref,
    translation: 'esv',
    title: ref,
    passages: [{ reference: ref, translation: 'esv', verses: Array.from({ length: n }, (_, i) => ({ verse: i + 1, text: 'x' })), text: 'x' }],
  });
  for (const w of [make('Psalm 1:1-3', 3), make('Psalm 2:1-2', 2)]) {
    store.savePassage(w.passages[0]);
    store.save(w, { query: w.reference });
  }
  assert.ok(store.get('Psalm 1:1-3', 'esv') && store.get('Psalm 2:1-2', 'esv'));

  const newest = make('Psalm 3:1-2', 2);
  store.savePassage(newest.passages[0]);
  store.save(newest);
  assert.ok(store.get('Psalm 3:1-2', 'esv'));
  assert.ok(store.get('Psalm 2:1-2', 'esv'));
  assert.equal(store.get('Psalm 1:1-3', 'esv'), null); // oldest dropped
  assert.equal(store.getPassage('Psalm 1:1-3', 'esv'), null);
  assert.equal(store.getByAlias('Psalm 1:1-3', 'esv'), null);
});

test('prints the ESV copyright notice on every page', () => {
  const layout = layoutWorksheet(
    {
      reference: 'John 3:16', translation: 'esv', title: 'Test', reflection: 'Draw.',
      copyright: 'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway.',
      passages: [{ reference: 'John 3:16', text: 'word '.repeat(200) }],
    },
    { size: 'large' },
    measure,
  );
  assert.ok(layout.pages.length > 1);
  for (const page of layout.pages) {
    assert.ok(page.items.some((i) => i.t === 'text' && i.text.includes('Crossway')));
  }
});
