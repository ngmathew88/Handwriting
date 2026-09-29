// Font measurement + PDF rendering of worksheet layouts.

import PDFDocument from 'pdfkit';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const fontDir = path.join(path.dirname(require.resolve('@fontsource/andika/package.json')), 'files');

export const FONT_FILES = {
  regular: path.join(fontDir, 'andika-latin-400-normal.woff'),
  bold: path.join(fontDir, 'andika-latin-700-normal.woff'),
};

function registerFonts(doc) {
  doc.registerFont('regular', FONT_FILES.regular);
  doc.registerFont('bold', FONT_FILES.bold);
}

// A throwaway document used only for measuring text widths.
const measureDoc = new PDFDocument({ autoFirstPage: false });
registerFonts(measureDoc);

export function measure(text, size, weight = 'regular') {
  measureDoc.font(weight === 'bold' ? 'bold' : 'regular').fontSize(size);
  return measureDoc.widthOfString(text);
}

/** Renders a layout (from layoutWorksheet) and returns a PDF Buffer. */
export function renderPdf(layout, { title } = {}) {
  const doc = new PDFDocument({
    size: [layout.page.width, layout.page.height],
    margin: 0,
    autoFirstPage: false,
    info: { Title: title || 'Handwriting worksheet' },
  });
  registerFonts(doc);

  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

  for (const page of layout.pages) {
    doc.addPage({ size: [layout.page.width, layout.page.height], margin: 0 });
    for (const item of page.items) drawItem(doc, item);
  }
  doc.end();
  return done;
}

function drawItem(doc, item) {
  doc.save();
  if (item.t === 'line' || item.t === 'rect') {
    doc.lineWidth(item.width).strokeColor(item.color);
    if (item.dash) doc.dash(item.dash[0], { space: item.dash[1] });
    else doc.undash();
    if (item.t === 'line') doc.moveTo(item.x1, item.y1).lineTo(item.x2, item.y2).stroke();
    else doc.roundedRect(item.x, item.y, item.w, item.h, item.r || 0).stroke();
  } else if (item.t === 'text') {
    doc.font(item.weight === 'bold' ? 'bold' : 'regular').fontSize(item.size).fillColor(item.color);
    const width = doc.widthOfString(item.text);
    let x = item.x;
    if (item.anchor === 'middle') x -= width / 2;
    else if (item.anchor === 'end') x -= width;
    doc.text(item.text, x, item.y, { lineBreak: false, baseline: 'alphabetic' });
  }
  doc.restore();
}
