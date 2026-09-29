import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from './config/site.js';
import { agentAvailable } from './lib/agent.js';
import { availableTranslations, COPYRIGHT, defaultTranslation, normalizeTranslation, PassageNotFoundError, TRANSLATIONS } from './lib/bible.js';
import { DEFAULT_SIZE, layoutWorksheet, SIZES } from './lib/layout.js';
import { FONT_FILES, measure, renderPdf } from './lib/pdf.js';
import { currentSeason, parseDateParam } from './lib/seasons.js';
import { WorksheetStore } from './lib/store.js';
import { buildSeed, createWorksheetService, WorksheetRequestError } from './lib/worksheets.js';

const root = path.dirname(fileURLToPath(import.meta.url));

export function createApp({ store = new WorksheetStore({ file: path.join(root, 'data', 'store.json'), seed: buildSeed() }), service } = {}) {
  const worksheets = service || createWorksheetService(store);
  const app = express();

  app.disable('x-powered-by');
  app.use(express.static(path.join(root, 'public'), { extensions: ['html'] }));
  app.get('/fonts/:weight.woff', (req, res) => {
    const file = FONT_FILES[req.params.weight];
    if (!file) return res.sendStatus(404);
    res.set('Cache-Control', 'public, max-age=604800').sendFile(file);
  });

  app.get('/api/config', (req, res) => {
    res.json({
      site: SITE,
      translations: availableTranslations(),
      defaultTranslation: defaultTranslation(),
      copyright: COPYRIGHT,
      sizes: Object.fromEntries(Object.entries(SIZES).map(([k, v]) => [k, v.label])),
      defaultSize: DEFAULT_SIZE,
      ai: agentAvailable(),
    });
  });

  app.get('/api/suggestions', (req, res) => {
    const date = parseDateParam(req.query.date) || new Date();
    res.json({ season: currentSeason(date), popular: store.popular(8) });
  });

  const options = (q) => ({
    size: SIZES[q.size] ? q.size : DEFAULT_SIZE,
    practice: q.practice !== '0',
    drawBox: q.draw !== '0',
  });

  const withWorksheet = (handler) => async (req, res) => {
    try {
      const worksheet = await worksheets.resolve(req.query.q, normalizeTranslation(req.query.t));
      const full = {
        ...worksheet,
        translationName: TRANSLATIONS[worksheet.translation],
        copyright: COPYRIGHT[worksheet.translation],
      };
      await handler(req, res, full, layoutWorksheet(full, options(req.query), measure));
    } catch (err) {
      const status = err instanceof WorksheetRequestError || err instanceof PassageNotFoundError ? 400 : 502;
      if (status === 502) console.error(err);
      res.status(status).json({ error: err.message || 'Something went wrong making that worksheet.' });
    }
  };

  app.get(
    '/api/worksheet',
    withWorksheet((req, res, worksheet, layout) => {
      const { reference, translation, translationName, title, reflection, passages } = worksheet;
      res.json({ reference, translation, translationName, title, reflection, passages, layout });
    }),
  );

  app.get(
    '/api/worksheet.pdf',
    withWorksheet(async (req, res, worksheet, layout) => {
      const pdf = await renderPdf(layout, { title: `${worksheet.title} — ${worksheet.reference}` });
      const filename = `${worksheet.reference.replace(/[^a-z0-9]+/gi, '-')}-${worksheet.translation}-worksheet.pdf`;
      res
        .type('application/pdf')
        .set('Content-Disposition', `${req.query.inline ? 'inline' : 'attachment'}; filename="${filename}"`)
        .send(pdf);
    }),
  );

  return { app, store };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { app, store } = createApp();
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`${SITE.name} running at http://localhost:${port}`);
    if (!agentAvailable()) {
      console.log('ANTHROPIC_API_KEY not set: the AI helper is off, so only Bible references (e.g. "John 3:16") will work.');
    }
  });
  const shutdown = () => {
    store.flush();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
