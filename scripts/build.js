#!/usr/bin/env node
/*
 * Build: minify src/osint-panel.js and produce
 *   dist/osint-panel.bookmarklet.txt  (paste into a bookmark URL field)
 *   dist/index.html                   (drag-to-install page, GitHub Pages ready)
 *
 * The minified code is URL-encoded once with encodeURIComponent. Browsers
 * percent-decode javascript: URLs before running them, so encoding is what
 * keeps characters like % and # intact.
 */
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const pkg = require(path.join(root, 'package.json'));

const escAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;');

(async () => {
  const source = fs.readFileSync(path.join(root, 'src', 'osint-panel.js'), 'utf8');
  const { code } = await minify(source, {
    ecma: 2020,
    compress: { passes: 2 },
    mangle: true,
    format: { comments: false, semicolons: true },
  });

  const bookmarklet = 'javascript:' + encodeURIComponent(code);

  // Safety check: decoding must give back exactly the minified code.
  if (decodeURIComponent(bookmarklet.slice('javascript:'.length)) !== code) {
    throw new Error('Encoding round-trip failed');
  }

  const test = 'javascript:' + encodeURIComponent("alert('Bookmarklets work on '+location.hostname)");

  const template = fs.readFileSync(path.join(root, 'scripts', 'install-template.html'), 'utf8');
  const html = template
    .replace(/{{VERSION}}/g, pkg.version)
    .replace('{{BOOKMARKLET}}', escAttr(bookmarklet))
    .replace('{{TEST}}', escAttr(test));

  fs.mkdirSync(dist, { recursive: true });
  fs.writeFileSync(path.join(dist, 'osint-panel.bookmarklet.txt'), bookmarklet + '\n');
  fs.writeFileSync(path.join(dist, 'osint-panel.min.js'), code + '\n');
  fs.writeFileSync(path.join(dist, 'index.html'), html);

  console.log(`Built v${pkg.version}: ${bookmarklet.length} chars -> dist/`);
})().catch((e) => { console.error(e); process.exit(1); });
