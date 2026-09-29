// Lays out a handwriting worksheet as a list of simple drawing instructions
// (text / line / rect, in PDF points on US Letter paper). The browser preview
// renders these as SVG and the PDF download renders them with PDFKit, so the
// printed page and the downloaded page always match.

import { SITE } from '../config/site.js';

export const PAGE = { width: 612, height: 792, margin: 42 };

export const SIZES = {
  large: { label: 'Large (ages 3–5)', fontSize: 40 },
  medium: { label: 'Medium (ages 5–7)', fontSize: 30 },
  small: { label: 'Small (ages 7+)', fontSize: 22 },
};
export const DEFAULT_SIZE = 'medium';

// Andika font metrics as a fraction of font size.
const ASCENT = 0.78;
const X_HEIGHT = 0.508;
const DESCENT = 0.36;

const COLORS = {
  ink: '#2b2f3a',
  muted: '#6b7280',
  trace: '#b9bcc4',
  guideTop: '#8fb0d6',
  guideMid: '#c3d3e6',
  guideBase: '#5f87b8',
  box: '#9aa5b1',
};

const FOOTER_Y = PAGE.height - 22;
const COPYRIGHT_SIZE = 6.5;
const COPYRIGHT_LEADING = 8.5;
const DRAW_BOX_HEIGHT = 190;

/** Greedy word wrap. `measure(text, size, weight)` returns width in points. */
export function wrapText(text, width, size, measure, weight = 'regular') {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (!line || measure(candidate, size, weight) <= width) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * @param worksheet { reference, translation, title, reflection, passages: [{ reference, text }] }
 * @param options   { size, practice (bool), drawBox (bool) }
 * @param measure   (text, size, weight) => width in points
 * @returns { pages: [{ items: [...] }], size, lineCount }
 */
export function layoutWorksheet(worksheet, options, measure) {
  const sizeKey = SIZES[options.size] ? options.size : DEFAULT_SIZE;
  const S = SIZES[sizeKey].fontSize;
  const practice = options.practice !== false;
  const drawBox = options.drawBox !== false;

  const left = PAGE.margin;
  const right = PAGE.width - PAGE.margin;
  const center = PAGE.width / 2;
  const textInset = 6;
  const rowHeight = (ASCENT + DESCENT) * S;
  const rowGap = 0.32 * S;
  const translationTag = worksheet.translation.toUpperCase();

  // Copyrighted translations (ESV) carry their notice at the foot of every page.
  const copyrightLines = worksheet.copyright
    ? wrapText(worksheet.copyright, right - left, COPYRIGHT_SIZE, measure)
    : [];
  const CONTENT_BOTTOM = PAGE.height - 44 - copyrightLines.length * COPYRIGHT_LEADING;

  const pages = [];
  let items;
  let y;

  const text = (x, baseline, str, size, extra = {}) =>
    items.push({ t: 'text', x, y: baseline, text: str, size, weight: 'regular', color: COLORS.ink, anchor: 'start', ...extra });
  const line = (x1, y1, x2, y2, extra = {}) =>
    items.push({ t: 'line', x1, y1, x2, y2, color: COLORS.ink, width: 1, ...extra });

  function newPage() {
    items = [];
    pages.push({ items });
    if (pages.length === 1) {
      text(left, 58, 'Name:', 14, { color: COLORS.muted });
      line(left + 46, 60, left + 290, 60, { color: COLORS.muted, width: 0.8 });
      text(right - 110, 58, 'Date:', 14, { color: COLORS.muted, anchor: 'end' });
      line(right - 104, 60, right, 60, { color: COLORS.muted, width: 0.8 });

      let titleSize = 26;
      while (titleSize > 16 && measure(worksheet.title, titleSize, 'bold') > right - left) titleSize -= 1;
      text(center, 106, worksheet.title, titleSize, { weight: 'bold', anchor: 'middle' });
      text(center, 130, `${worksheet.reference} (${translationTag})`, 15, { color: COLORS.muted, anchor: 'middle' });
      text(center, 152, 'Trace the gray letters, then write the words on your own!', 11, {
        color: COLORS.muted,
        anchor: 'middle',
      });
      y = 172;
    } else {
      text(left, 50, `${worksheet.reference} (${translationTag}) — continued`, 11, { color: COLORS.muted });
      y = 70;
    }
  }

  function guides(top) {
    const baseline = top + ASCENT * S;
    line(left, top, right, top, { color: COLORS.guideTop, width: 0.9 });
    line(left, baseline - X_HEIGHT * S, right, baseline - X_HEIGHT * S, {
      color: COLORS.guideMid,
      width: 0.9,
      dash: [5, 4],
    });
    line(left, baseline, right, baseline, { color: COLORS.guideBase, width: 1.3 });
    return baseline;
  }

  const ensureRoom = (h) => {
    if (y + h > CONTENT_BOTTOM) newPage();
  };

  newPage();

  const multiple = worksheet.passages.length > 1;
  let lineCount = 0;
  for (const passage of worksheet.passages) {
    const lines = wrapText(passage.text, right - left - textInset * 2, S, measure);
    lineCount += lines.length;

    if (multiple) {
      ensureRoom(26 + rowHeight);
      text(left, y + 14, passage.reference, 14, { weight: 'bold' });
      y += 26;
    }

    for (const str of lines) {
      const blockHeight = practice ? rowHeight * 2 + rowGap : rowHeight;
      ensureRoom(blockHeight);
      const baseline = guides(y);
      text(left + textInset, baseline, str, S, { color: COLORS.trace });
      y += rowHeight;
      if (practice) {
        y += rowGap * 0.6;
        guides(y);
        y += rowHeight;
      }
      y += rowGap;
    }
    y += multiple ? 8 : 0;
  }

  if (drawBox && worksheet.reflection) {
    ensureRoom(DRAW_BOX_HEIGHT);
    const boxTop = Math.max(y + 6, CONTENT_BOTTOM - DRAW_BOX_HEIGHT);
    const boxHeight = CONTENT_BOTTOM - boxTop;
    items.push({ t: 'rect', x: left, y: boxTop, w: right - left, h: boxHeight, r: 12, color: COLORS.box, width: 1.2, dash: [6, 4] });
    text(left + 14, boxTop + 22, 'Think & Draw', 13, { weight: 'bold' });
    const promptLines = wrapText(worksheet.reflection, right - left - 28, 12, measure);
    promptLines.slice(0, 3).forEach((l, i) => text(left + 14, boxTop + 40 + i * 15, l, 12, { color: COLORS.muted }));
  }

  pages.forEach((page, i) => {
    copyrightLines.forEach((str, n) =>
      page.items.push({
        t: 'text',
        x: left,
        y: FOOTER_Y - 12 - (copyrightLines.length - 1 - n) * COPYRIGHT_LEADING,
        text: str,
        size: COPYRIGHT_SIZE,
        weight: 'regular',
        color: COLORS.muted,
        anchor: 'start',
      }),
    );
    page.items.push(
      { t: 'text', x: left, y: FOOTER_Y, text: `${worksheet.reference} (${worksheet.translationName || translationTag})`, size: 8.5, weight: 'regular', color: COLORS.muted, anchor: 'start' },
      { t: 'text', x: right, y: FOOTER_Y, text: pages.length > 1 ? `${SITE.name} · page ${i + 1} of ${pages.length}` : SITE.name, size: 8.5, weight: 'regular', color: COLORS.muted, anchor: 'end' },
    );
  });

  return { pages, size: sizeKey, lineCount, page: PAGE };
}
