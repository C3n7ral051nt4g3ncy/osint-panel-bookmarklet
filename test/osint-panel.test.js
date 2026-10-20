// Run with: npm test  (requires `npm run build` first; `npm test` does it for you)
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const dist = path.join(__dirname, '..', 'dist');
const bookmarklet = fs.readFileSync(path.join(dist, 'osint-panel.bookmarklet.txt'), 'utf8').trim();

// Simulate what the browser does: strip "javascript:", percent-decode, run.
const code = decodeURIComponent(bookmarklet.slice('javascript:'.length));

const FIXTURE = `<!doctype html><html><body>
  <p>Contact: contact@acme.example / press@acme.example</p>
  <img src="logo@2x.png">
  <a href="https://github.com/acme-org">GitHub</a>
  <a href="https://t.me/acmechannel">Telegram</a>
  <a href="https://example.org/other">Other</a>
  <script>gtag('config','G-ABCD1234EF'); var p='ca-pub-1234567890123456';</script>
</body></html>`;

function run(url) {
  const dom = new JSDOM(FIXTURE, { url, runScripts: 'outside-only' });
  const w = dom.window;
  w.TextEncoder = TextEncoder;
  w.Uint8Array = Uint8Array;
  if (url.startsWith('https:')) Object.defineProperty(w, 'crypto', { value: globalThis.crypto });
  w.eval(code);
  return new Promise((resolve) => setTimeout(() => resolve(w.document.getElementById('osint-panel-bm')), 200));
}

test('bookmarklet is a single line', () => {
  assert.ok(bookmarklet.startsWith('javascript:'));
  assert.ok(!bookmarklet.includes('\n'));
});

test('extracts selectors and builds pivots (HTTPS)', async () => {
  const panel = await run('https://www.acme.example/page');
  assert.ok(panel, 'panel rendered');
  const text = panel.textContent;
  assert.match(text, /contact@acme\.example/);
  assert.match(text, /press@acme\.example/);
  assert.doesNotMatch(text, /logo@2x\.png/);
  assert.match(text, /G-ABCD1234EF/);
  assert.match(text, /pub-1234567890123456/);
  assert.match(text, /github\.com\/acme-org/);
  assert.match(text, /t\.me\/acmechannel/);
  assert.doesNotMatch(text, /example\.org\/other/);
  assert.match(text, /SHA-256 \(DOM\): [0-9a-f]{64}/);

  const links = [...panel.querySelectorAll('a')].map((a) => a.href);
  assert.deepStrictEqual(links, [
    'https://crt.sh/?q=%25.acme.example',
    'https://web.archive.org/web/*/acme.example/*',
    'https://urlscan.io/search/#domain:acme.example',
    'https://www.virustotal.com/gui/domain/acme.example',
    'https://builtwith.com/relationships/acme.example',
  ]);
  for (const a of panel.querySelectorAll('a')) assert.strictEqual(a.rel, 'noopener noreferrer');
});

test('still renders on HTTP pages without crypto.subtle', async () => {
  const panel = await run('http://acme.example/');
  assert.ok(panel);
  assert.match(panel.textContent, /n\/a \(needs HTTPS\)/);
});

test('second click replaces the panel instead of stacking', async () => {
  const dom = new JSDOM(FIXTURE, { url: 'https://acme.example/', runScripts: 'outside-only' });
  const w = dom.window;
  w.TextEncoder = TextEncoder; w.Uint8Array = Uint8Array;
  Object.defineProperty(w, 'crypto', { value: globalThis.crypto });
  w.eval(code); w.eval(code);
  await new Promise((r) => setTimeout(r, 200));
  assert.strictEqual(w.document.querySelectorAll('#osint-panel-bm').length, 1);
});
