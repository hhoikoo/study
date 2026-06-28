// Prev/next footer for article + sub-article pages. The "next" chain is the
// manifest read linearly (each study's articles by date asc, each article's
// children in manifest order, depth-first). The "prev" of a week's main page is
// asymmetric: it jumps to the PREVIOUS week's main page, not that week's last
// child. So:
//   week main: prev = previous week's main,        next = its own first child
//   child:     prev = previous child / week main,  next = next child / next week's main
// Navigation stays within one study; the first and last pages show one side.
(function () {
  // Every article/sub-article HTML loads assets/style.css with a relative prefix
  // (../../ for a week page, ../../../ for a child). That prefix is the path back
  // to the site root, where manifest.json lives, so derive it once from the link.
  function rootPrefix() {
    const link = document.querySelector('link[rel="stylesheet"][href*="assets/style.css"]');
    if (!link) return null;
    const href = link.getAttribute('href');
    const i = href.indexOf('assets/');
    return i >= 0 ? href.slice(0, i) : null;
  }

  function injectStyles() {
    if (document.getElementById('page-nav-style')) return;
    const css = `
.page-nav { display: flex; gap: 16px; margin: 48px 0 8px; padding-top: 24px; border-top: 1px solid var(--border); }
.page-nav a { flex: 1 1 0; max-width: 49%; display: flex; flex-direction: column; gap: 4px; padding: 12px 16px; border: 1px solid var(--border); border-radius: 8px; }
.page-nav a:hover { border-color: var(--link); background: var(--accent-bg); }
.page-nav .page-nav-next { margin-left: auto; text-align: right; align-items: flex-end; }
.page-nav .dir { font-size: 12px; color: var(--muted); }
.page-nav .ttl { color: var(--fg); font-weight: 600; font-size: 14px; line-height: 1.35; word-break: keep-all; overflow-wrap: anywhere; }
.page-nav a:hover .ttl { color: var(--link); }
@media (max-width: 560px) { .page-nav { flex-direction: column; } .page-nav a, .page-nav .page-nav-next { max-width: 100%; text-align: left; align-items: flex-start; } }`;
    const style = document.createElement('style');
    style.id = 'page-nav-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // Sorted main articles plus the flattened depth-first sequence. `ai` tags each
  // entry with its parent article index so a main page can find the prior main.
  function model(study) {
    const articles = (study.articles || []).slice().sort(function (a, b) {
      return String(a.date || '').localeCompare(String(b.date || ''));
    });
    const seq = [];
    articles.forEach(function (a, ai) {
      seq.push({ path: study.id + '/' + a.slug, title: a.title || a.slug, main: true, ai: ai });
      (a.children || []).forEach(function (c) {
        seq.push({ path: study.id + '/' + a.slug + '/' + c.slug, title: c.title || c.slug, main: false, ai: ai });
      });
    });
    return { articles: articles, seq: seq };
  }

  function mainEntry(study, a) {
    return { path: study.id + '/' + a.slug, title: a.title || a.slug };
  }

  function render(prefix, prev, next) {
    const main = document.querySelector('main.doc-wrap') || document.querySelector('main');
    if (!main) return;
    const nav = document.createElement('nav');
    nav.className = 'page-nav';
    nav.setAttribute('aria-label', 'article navigation');
    function link(entry, kind) {
      const a = document.createElement('a');
      a.className = kind === 'prev' ? 'page-nav-prev' : 'page-nav-next';
      a.href = prefix + entry.path + '/';
      const dir = document.createElement('span');
      dir.className = 'dir';
      dir.textContent = kind === 'prev' ? '← Previous' : 'Next →';
      const ttl = document.createElement('span');
      ttl.className = 'ttl';
      ttl.textContent = entry.title;
      a.appendChild(dir);
      a.appendChild(ttl);
      return a;
    }
    if (prev) nav.appendChild(link(prev, 'prev'));
    if (next) nav.appendChild(link(next, 'next'));
    if (nav.childNodes.length) main.appendChild(nav);
  }

  function build() {
    const prefix = rootPrefix();
    if (prefix === null) return;
    const segs = location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '').split('/').filter(Boolean);
    const depth = (prefix.match(/\.\.\//g) || []).length; // 2 for a week page, 3 for a child
    if (!depth || segs.length < depth) return;
    const fromRoot = segs.slice(segs.length - depth).join('/'); // e.g. aidcnw/week3-.../power-and-cooling
    const studyId = fromRoot.split('/')[0];
    fetch(prefix + 'manifest.json', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        const study = (data.studies || []).find(function (s) { return s.id === studyId; });
        if (!study) return;
        const m = model(study);
        const seq = m.seq;
        const i = seq.findIndex(function (e) { return e.path === fromRoot; });
        if (i < 0) return;
        const cur = seq[i];
        const next = i < seq.length - 1 ? seq[i + 1] : null;
        let prev;
        if (cur.main) {
          // A week's main page steps back to the previous week's main, not its last child.
          prev = cur.ai > 0 ? mainEntry(study, m.articles[cur.ai - 1]) : null;
        } else {
          prev = i > 0 ? seq[i - 1] : null;
        }
        injectStyles();
        render(prefix, prev, next);
      })
      .catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
