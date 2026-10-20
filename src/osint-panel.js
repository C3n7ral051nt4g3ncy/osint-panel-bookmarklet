/*
 * OSINT Panel — bookmarklet
 * Extracts investigative selectors from the page you are viewing and
 * offers pivot links for the current domain. Runs locally in your browser:
 * no network request is made until you click a pivot.
 *
 * This is the readable source. Do not paste it into a bookmark directly:
 * run `npm run build` to produce the encoded bookmarklet in dist/.
 */
(async () => {
  const PANEL_ID = 'osint-panel-bm';
  const host = location.hostname.replace(/^www\./, '');
  const src = document.documentElement.outerHTML;

  const uniq = (arr) => [...new Set(arr)];
  const grab = (re) => uniq(src.match(re) || []);

  // --- Capture record --------------------------------------------------
  // SHA-256 of the rendered DOM. crypto.subtle only exists in secure
  // contexts (HTTPS), so fall back gracefully on HTTP pages.
  let sha = 'n/a (needs HTTPS)';
  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(src));
    sha = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (e) { /* insecure context */ }

  // --- Extraction ------------------------------------------------------
  const sections = {
    'Capture': [location.href, new Date().toISOString(), 'SHA-256 (DOM): ' + sha],

    // Exclude retina asset names such as logo@2x.png
    'Emails': grab(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g)
      .filter((e) => !/\.(png|jpe?g|gif|svg|webp)$/i.test(e)),

    // Google Analytics (UA-/G-), Tag Manager, Google Ads, AdSense publisher
    'Tracking IDs': grab(/\b(UA-\d{4,10}-\d{1,4}|G-[A-Z0-9]{8,12}|GTM-[A-Z0-9]{4,9}|AW-\d{6,12}|pub-\d{10,20})\b/g),

    'Social': uniq([...document.links].map((a) => a.href).filter((u) =>
      /^https?:\/\/(www\.)?((facebook|instagram|twitter|x|linkedin|tiktok|youtube|github|vk)\.com|t\.me)\//i.test(u))),
  };

  // --- Pivots for the current domain -----------------------------------
  const pivots = {
    'crt.sh': 'https://crt.sh/?q=' + encodeURIComponent('%.' + host),
    'Wayback': 'https://web.archive.org/web/*/' + host + '/*',
    'urlscan': 'https://urlscan.io/search/#domain:' + host,
    'VirusTotal': 'https://www.virustotal.com/gui/domain/' + host,
    'BuiltWith rel.': 'https://builtwith.com/relationships/' + host,
  };

  // --- Panel -----------------------------------------------------------
  const box = Object.assign(document.createElement('div'), { id: PANEL_ID });
  box.style.cssText = [
    'position:fixed', 'top:10px', 'right:10px', 'z-index:2147483647',
    'width:440px', 'max-height:85vh', 'overflow:auto', 'text-align:left',
    'background:#0d1117', 'color:#c9d1d9', 'font:12px/1.5 monospace',
    'padding:12px', 'border:1px solid #30363d', 'border-radius:8px',
    'word-break:break-all',
  ].join(';');

  // textContent only: page content is untrusted and must never be parsed as HTML.
  // noopener noreferrer: pivot targets are not told which page you came from.
  const add = (tag, text, href) => {
    const el = document.createElement(href ? 'a' : tag);
    el.textContent = text;
    if (href) {
      el.href = href;
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
      el.style.cssText = 'color:#58a6ff;margin-right:10px';
    }
    box.append(el);
    return el;
  };

  const close = add('div', '[x] close');
  close.style.cursor = 'pointer';
  close.onclick = () => box.remove();

  for (const [title, items] of Object.entries(sections)) {
    add('h4', title + ' (' + items.length + ')');
    items.forEach((item) => add('div', item));
  }

  add('h4', 'Pivots');
  for (const [name, url] of Object.entries(pivots)) add('a', name, url);

  // Remove any previous panel right before inserting, so a double click
  // (two runs racing past the await above) never stacks two panels.
  document.getElementById(PANEL_ID)?.remove();
  document.body.append(box);
})();
