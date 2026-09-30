const $ = (sel) => document.querySelector(sel);
const SVG_NS = 'http://www.w3.org/2000/svg';

const params = new URLSearchParams(location.search);
const state = {
  q: params.get('q') || '',
  t: params.get('t') || '',
  size: params.get('size') || '',
  practice: params.get('practice') !== '0',
  draw: params.get('draw') !== '0',
};

const status = $('[data-status]');
const preview = $('[data-preview]');
const printBtn = $('[data-print]');
const download = $('[data-download]');

function queryString(extra = {}) {
  const p = new URLSearchParams({ q: state.q });
  if (state.t) p.set('t', state.t);
  if (state.size) p.set('size', state.size);
  if (!state.practice) p.set('practice', '0');
  if (!state.draw) p.set('draw', '0');
  for (const [k, v] of Object.entries(extra)) p.set(k, v);
  return p.toString();
}

function showStatus(message, { error = false, busy = false } = {}) {
  status.hidden = false;
  status.classList.toggle('error', error);
  status.querySelector('.spinner').hidden = !busy;
  status.querySelector('p').textContent = message;
}

function renderPage(page, layout) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${layout.page.width} ${layout.page.height}`);
  svg.setAttribute('class', 'sheet');
  svg.setAttribute('role', 'img');

  const bg = document.createElementNS(SVG_NS, 'rect');
  Object.entries({ width: layout.page.width, height: layout.page.height, fill: '#fff' }).forEach(([k, v]) => bg.setAttribute(k, v));
  svg.append(bg);

  for (const item of page.items) {
    let el;
    if (item.t === 'line') {
      el = document.createElementNS(SVG_NS, 'line');
      Object.entries({ x1: item.x1, y1: item.y1, x2: item.x2, y2: item.y2 }).forEach(([k, v]) => el.setAttribute(k, v));
    } else if (item.t === 'rect') {
      el = document.createElementNS(SVG_NS, 'rect');
      Object.entries({ x: item.x, y: item.y, width: item.w, height: item.h, rx: item.r || 0, fill: 'none' }).forEach(([k, v]) => el.setAttribute(k, v));
    } else {
      el = document.createElementNS(SVG_NS, 'text');
      el.setAttribute('x', item.x);
      el.setAttribute('y', item.y);
      el.setAttribute('font-size', item.size);
      el.setAttribute('fill', item.color);
      el.setAttribute('text-anchor', item.anchor);
      el.setAttribute('class', item.weight === 'bold' ? 'ws-bold' : 'ws-regular');
      el.textContent = item.text;
      svg.append(el);
      continue;
    }
    el.setAttribute('stroke', item.color);
    el.setAttribute('stroke-width', item.width);
    if (item.dash) el.setAttribute('stroke-dasharray', item.dash.join(' '));
    svg.append(el);
  }
  return svg;
}

// API.Bible's Fair Use Management System: tell the publisher each time their
// text is shown. Their script (URL sent by the server) records the view.
const fumsScripts = new Map();
function loadScript(src) {
  const url = /^(https?:)?\/\//.test(src) ? src : `https://${src}`;
  if (!fumsScripts.has(url)) {
    fumsScripts.set(url, new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = url;
      el.async = true;
      el.onload = resolve;
      el.onerror = reject;
      document.head.append(el);
    }));
  }
  return fumsScripts.get(url);
}
async function reportFums(list = []) {
  for (const { id, script } of list) {
    try {
      if (script) await loadScript(script);
      window._BAPI?.t?.(id);
    } catch {
      // Reporting must never break the worksheet.
    }
  }
}

let requestId = 0;
async function load() {
  if (!state.q) {
    location.href = '/';
    return;
  }
  const id = ++requestId;
  $('#q').value = state.q;
  printBtn.disabled = true;
  download.setAttribute('aria-disabled', 'true');
  preview.querySelectorAll('.sheet').forEach((s) => s.classList.add('stale'));
  showStatus('Making your worksheet…', { busy: true });

  let data;
  try {
    const res = await fetch(`/api/worksheet?${queryString()}`);
    data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  } catch (err) {
    if (id !== requestId) return;
    preview.querySelectorAll('.sheet').forEach((s) => s.remove());
    showStatus(err.message, { error: true });
    return;
  }
  if (id !== requestId) return;

  await document.fonts.load('30px "Andika Worksheet"').catch(() => {});
  status.hidden = true;
  preview.querySelectorAll('.sheet').forEach((s) => s.remove());
  preview.append(...data.layout.pages.map((p) => renderPage(p, data.layout)));

  document.title = `${data.title} · ${data.reference}`;
  $('[data-opt="t"]').value = data.translation;
  $('[data-opt="size"]').value = data.layout.size;
  printBtn.disabled = false;
  download.href = `/api/worksheet.pdf?${queryString()}`;
  download.removeAttribute('aria-disabled');

  reportFums(data.fums);

  // Keep the URL shareable with the current options.
  history.replaceState(null, '', `/worksheet?${queryString()}`);
}

async function init() {
  const config = await fetch('/api/config').then((r) => r.json());
  document.querySelectorAll('[data-site-name]').forEach((el) => (el.textContent = config.site.name));

  const sizeSel = $('[data-opt="size"]');
  sizeSel.append(...Object.entries(config.sizes).map(([k, label]) => new Option(label, k)));
  sizeSel.value = state.size || config.defaultSize;
  const tSel = $('[data-opt="t"]');
  tSel.append(...Object.entries(config.translations).map(([k, name]) => new Option(`${name} (${k.toUpperCase()})`, k)));
  if (state.t) tSel.value = state.t;
  $('[data-opt="practice"]').checked = state.practice;
  $('[data-opt="draw"]').checked = state.draw;

  sizeSel.addEventListener('change', () => { state.size = sizeSel.value; load(); });
  tSel.addEventListener('change', () => { state.t = tSel.value; load(); });
  $('[data-opt="practice"]').addEventListener('change', (e) => { state.practice = e.target.checked; load(); });
  $('[data-opt="draw"]').addEventListener('change', (e) => { state.draw = e.target.checked; load(); });
  printBtn.addEventListener('click', () => window.print());

  // Carry the chosen Bible over to a new search.
  $('[data-search]').addEventListener('submit', (e) => {
    e.preventDefault();
    state.q = $('#q').value.trim();
    if (state.q) load();
  });

  load();
}

init().catch(() => showStatus('Could not load the page. Please refresh.', { error: true }));
