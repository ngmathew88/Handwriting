const $ = (sel) => document.querySelector(sel);
const params = new URLSearchParams(location.search);

const worksheetUrl = (q, t) => `/worksheet?${new URLSearchParams(t ? { q, t } : { q })}`;

async function loadConfig() {
  const config = await fetch('/api/config').then((r) => r.json());
  document.querySelectorAll('[data-site-name]').forEach((el) => (el.textContent = config.site.name));
  $('[data-site-tagline]').textContent = config.site.tagline;
  document.title = `${config.site.name} · Bible verse handwriting pages for kids`;
  if (!config.ai) $('#q').placeholder = 'Type a verse, like John 3:16 or Psalm 23:1';

  const notices = Object.keys(config.translations).map((t) => config.copyright[t]).filter(Boolean);
  const publicDomain = Object.entries(config.translations)
    .filter(([t]) => !config.copyright[t])
    .map(([, name]) => name);
  $('[data-footer]').textContent = [
    ...notices,
    publicDomain.length ? `${publicDomain.join(' and ')}: public domain.` : '',
  ].join(' ');
}

async function loadSuggestions() {
  // Preview another season with ?date=2026-12-20
  const date = params.get('date');
  const data = await fetch(`/api/suggestions${date ? `?date=${encodeURIComponent(date)}` : ''}`).then((r) => r.json());

  $('[data-season-name]').textContent = data.season.name;
  const bubbles = $('[data-bubbles]');
  bubbles.replaceChildren(
    ...data.season.verses.map(({ ref, label }) => {
      const a = document.createElement('a');
      a.className = 'bubble';
      a.href = worksheetUrl(ref);
      a.innerHTML = '<span class="bubble-label"></span><span class="bubble-ref"></span>';
      a.querySelector('.bubble-label').textContent = label;
      a.querySelector('.bubble-ref').textContent = ref;
      return a;
    }),
  );

  if (data.popular.length) {
    $('[data-popular]').hidden = false;
    $('[data-popular-list]').replaceChildren(
      ...data.popular.map((w) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = worksheetUrl(w.reference, w.translation);
        a.textContent = `${w.reference}`;
        const small = document.createElement('small');
        small.textContent = ` ${w.title} · ${w.translation.toUpperCase()}`;
        a.append(small);
        li.append(a);
        return li;
      }),
    );
  }
}

loadConfig().catch(() => {});
loadSuggestions().catch(() => {});
