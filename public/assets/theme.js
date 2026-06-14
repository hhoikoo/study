(function () {
  const KEY = 'theme';
  const root = document.documentElement;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const MD = {
    light: 'https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown-light.css',
    dark: 'https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown-dark.css'
  };
  const SUN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const MOON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>';

  function effective() {
    const t = root.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    return mq.matches ? 'dark' : 'light';
  }

  // The article body renders inside zero-md's shadow DOM, so its theme needs a
  // stylesheet injected there; the page CSS variables do not reach it.
  function injectMdTheme() {
    const zm = document.querySelector('zero-md');
    if (!zm || !zm.shadowRoot) return;
    let link = zm.shadowRoot.getElementById('md-theme');
    if (!link) {
      link = document.createElement('link');
      link.id = 'md-theme';
      link.rel = 'stylesheet';
      zm.shadowRoot.appendChild(link);
    }
    const href = MD[effective()];
    if (link.getAttribute('href') !== href) link.setAttribute('href', href);
  }

  let btn;
  function updateBtn() {
    if (!btn) return;
    const dark = effective() === 'dark';
    btn.innerHTML = dark ? SUN : MOON;
    const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
  }

  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem(KEY, t); } catch (e) {}
    updateBtn();
    injectMdTheme();
  }

  function build() {
    btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle theme');
    btn.addEventListener('click', function () { setTheme(effective() === 'dark' ? 'light' : 'dark'); });
    document.body.appendChild(btn);
    updateBtn();

    const zm = document.querySelector('zero-md');
    if (zm) {
      zm.addEventListener('zero-md-rendered', injectMdTheme);
      injectMdTheme();
    }
    // Follow the system only while the user has not made an explicit choice.
    mq.addEventListener('change', function () {
      if (!root.getAttribute('data-theme')) { updateBtn(); injectMdTheme(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
