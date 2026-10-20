# OSINT Panel — bookmarklet

One click on any web page opens a panel that extracts investigative selectors (emails, tracking IDs, social accounts), records a capture line (URL, UTC timestamp, SHA-256 of the DOM), and offers pivot links for the current domain.

It runs entirely in your browser. Nothing is sent anywhere until you click a pivot link.

![status](https://img.shields.io/badge/version-1.0.0-238636) ![license](https://img.shields.io/badge/license-MIT-blue)

## Install

**Recommended: drag to install.**
Open the install page (`https://<your-user>.github.io/osint-panel-bookmarklet/`, or `dist/index.html` locally), show your bookmarks bar (`Ctrl/Cmd+Shift+B`) and drag the green **OSINT Panel** button onto it.

GitHub strips `javascript:` links from READMEs, which is why installation goes through that page.

**Manual.** Create a bookmark and paste the whole content of [`dist/osint-panel.bookmarklet.txt`](dist/osint-panel.bookmarklet.txt) into its URL field. Don't paste it into the address bar: browsers strip the `javascript:` prefix there.

## What it extracts and why it matters

| Section | What is pulled | Investigative value |
|---|---|---|
| **Capture** | Full URL, ISO 8601 UTC timestamp, SHA-256 of the rendered DOM | Contemporaneous record of what was seen and when, for your notes |
| **Emails** | Strings shaped like `user@domain.tld` in the rendered HTML (asset names like `logo@2x.png` are filtered out) | Contacts and administrative addresses to pivot on (breach data, registrant searches, account enumeration) |
| **Tracking IDs** | Google Analytics `UA-` / `G-`, Tag Manager `GTM-`, Google Ads `AW-`, AdSense `pub-` | Sites sharing the same ID are often run by the same operator. This is the strongest site-to-site link the panel surfaces |
| **Social** | Links to Facebook, Instagram, X/Twitter, LinkedIn, TikTok, YouTube, GitHub, VK, Telegram | The accounts the site officially links to, ready for username and identity pivots |

It reads the *rendered* DOM, so it also catches content injected by JavaScript after page load, which "View source" can miss.

## Pivots

| Pivot | What it shows |
|---|---|
| **crt.sh** | Certificate Transparency logs for `%.domain`: subdomains (staging, admin, mail…) and certificate issuance dates |
| **Wayback** | Every archived URL under the domain: earlier versions, removed pages, past contact details |
| **urlscan** | Previous scans: hosting IPs, ASN, screenshots, outgoing requests, related domains |
| **VirusTotal** | Reputation, passive DNS history, related URLs and files |
| **BuiltWith relationships** | Other sites sharing the same tracking IDs, which turns the Tracking IDs section into a list of linked sites |

## OPSEC notes

- **Local by design.** Extraction runs in the page. The bookmarklet makes no network request of its own.
- **Pivots leak the target.** Clicking a pivot tells that third-party service which domain you are investigating. Use an attributable or non-attributable environment as your case requires.
- **No referrer.** Pivot links open with `noopener noreferrer`, so the destination is not told which target page you came from.
- **Hostile-page safe.** All page content is displayed with `textContent`, never `innerHTML`, so a malicious page cannot inject script into the panel.
- **The page can see it.** The panel is a DOM element inside the target page. A site's own scripts could in theory detect it while it is open. Close it with `[x]` when you are done.

## Evidential caveat

The SHA-256 is computed over the **rendered DOM** (`document.documentElement.outerHTML`), not the raw HTTP response. It is useful as a contemporaneous marker in your notes. It is **not** a substitute for a forensic web capture tool when you need evidence for court. The hash is only available on HTTPS pages (the browser's `crypto.subtle` requires a secure context); on HTTP pages the panel shows `n/a (needs HTTPS)` and everything else still works.

## Limitations

- Bookmarklets do not run on the new tab page, `chrome://` and `about:` pages, extension stores, or built-in PDF viewers.
- Email and ID extraction is regex-based: expect occasional false positives and obfuscated addresses (`name [at] domain`) to be missed.
- Only links present in the page are listed under Social. Accounts mentioned as plain text are not.

## Development

```bash
npm install
npm run build   # src/osint-panel.js -> dist/
npm test        # builds, then runs the jsdom test suite
```

| Path | Role |
|---|---|
| `src/osint-panel.js` | Readable, commented source. Edit this |
| `scripts/build.js` | Minifies with Terser, URL-encodes, writes `dist/` |
| `scripts/install-template.html` | Template for the drag-to-install page |
| `dist/` | Built bookmarklet, minified JS and install page (committed so users can install without building) |
| `test/` | Tests that decode the bookmarklet exactly as a browser would, then run it on a fixture page |

### Why the build URL-encodes

Browsers percent-decode a `javascript:` URL before running it. A literal `%` in the code (for example the `%.` wildcard sent to crt.sh) is read as a broken escape sequence and the bookmarklet silently does nothing. The build encodes the minified code once with `encodeURIComponent`, and checks that decoding gives back the exact code.

### Publishing the install page

The workflow in `.github/workflows/pages.yml` builds, tests and deploys `dist/` to GitHub Pages on every push to `main`. Enable it once: **Settings → Pages → Source: GitHub Actions**.

## Contributors

- [C3n7ral051nt4g3ncy](https://github.com/C3n7ral051nt4g3ncy), author
- [Claude](https://claude.ai) (Anthropic), code assistance
- [Les Blaireaux des Légendes](https://github.com/Les-Blaireaux-des-Legendes) (BDL), testing and feedback

## Author

C3n7ral051nt4g3ncy · [GitHub](https://github.com/C3n7ral051nt4g3ncy) · [X @OSINT_Tactical](https://x.com/OSINT_Tactical) · [LinkedIn](https://www.linkedin.com/in/centralosintagency)

## Licence

MIT. See [LICENSE](LICENSE).
