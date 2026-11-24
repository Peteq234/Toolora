# Toolora

A complete, modern free-tools website built with React, Vite and Tailwind CSS. **88 tools in 10 suites**, all
fully functional and running in the browser, with SEO metadata, structured data, favicon,
robots.txt, sitemap.xml, reserved ad space and a deployment setup for Vercel.

Recent upgrade added ten developer- and design-focused tools, a Developer tools category,
locally saved recently used tools, `/` search shortcut, live category descriptions, route
transitions and expanded search matching — without changing the existing design language or
removing any earlier tool.

No backend, database or account system is required.

## Tools included

| # | Tool | URL |
|---|------|-----|
| 1 | Password generator (length, character sets, strength, copy) | `/tools/password-generator` |
| 2 | Username & nickname generator (keyword, style, separators, numbers) | `/tools/username-generator` |
| 3 | Random number generator (range, duplicates, presets, stats) | `/tools/random-number-generator` |
| 4 | Percentage calculator (3 modes with working shown) | `/tools/percentage-calculator` |
| 5 | Unit converter (length, weight, temperature, speed) | `/tools/unit-converter` |
| 6 | Stopwatch & timer (laps, presets, sound alert) | `/tools/stopwatch-timer` |
| 7 | Colour palette generator (harmonies, locks, HEX copy, CSS export) | `/tools/color-palette-generator` |
| 8 | QR code generator (size, error correction, colour, PNG download) | `/tools/qr-code-generator` |
| 9 | Word & character counter (counts, reading time, density) | `/tools/word-counter` |
| 10 | Text case converter (10 cases, undo, download) | `/tools/case-converter` |
| 11 | BMI calculator (metric/imperial with disclaimers) | `/tools/bmi-calculator` |
| 12 | Age calculator (calendar-accurate, next birthday) | `/tools/age-calculator` |
| 13 | Random choice picker (secure draw, remove winner) | `/tools/random-choice-picker` |
| 14 | Internet speed guide (no fabricated results; real calculator + links) | `/tools/internet-speed-guide` |
| 15 | PC bottleneck estimator (transparent heuristic + disclaimers) | `/tools/pc-bottleneck-calculator` |
| 16 | JSON formatter, validator and minifier (line/column errors) | `/tools/json-formatter-validator` |
| 17 | Base64 encoder & decoder (Unicode and URL-safe) | `/tools/base64-encoder-decoder` |
| 18 | URL encoder & decoder (whole URL or component, URL analysis) | `/tools/url-encoder-decoder` |
| 19 | Timestamp converter (seconds/milliseconds, UTC and local) | `/tools/timestamp-converter` |
| 20 | Text diff checker (line diff, statistics, split/unified) | `/tools/text-diff-checker` |
| 21 | Markdown editor & live preview (safe rendering, .md export) | `/tools/markdown-editor` |
| 22 | Image compressor (local canvas re-encoding, quality and size) | `/tools/image-compressor` |
| 23 | Colour contrast checker (WCAG AA/AAA, suggestions) | `/tools/color-contrast-checker` |
| 24 | CSS gradient generator (linear/radial, stops, CSS copy) | `/tools/css-gradient-generator` |
| 25 | Regex tester (flags, match highlighting, error hints) | `/tools/regex-tester` |

Other pages: `/` home, `/tools` all tools, `/favorites` saved tools, `/about`, `/contact`,
`/privacy`, `/terms`, and a 404 page.

## Expansion: 30 more tools (now 55)

**Family & growth**
- Parent Height Predictor — mid-parental method with formula and ±8.5 cm uncertainty
- Children's BMI Calculator — CDC 2000 BMI-for-age LMS reference, verified against all 434 published P85/P95 records (source URL and SHA-256 recorded in `src/data/cdcBmiData.ts`); never uses adult categories

**Everyday calculators & time**
- Percentage Increase/Decrease · Discount (extra discount + tax) · Average (mean/median/mode/SD)
- Grade Calculator (weighted grade + “what do I need on the final?”)
- Cooking Measurement Converter (US customary vs metric cups; exact BigInt rational arithmetic; oven temperatures)
- Date Difference (business days, holidays, inclusive option) · Time Duration (multi-entry timesheet, overnight shifts, breaks)
- Existing percentage, age and unit tools are preserved unchanged.

**Text**
- Remove Duplicate Lines · Sort Text Lines · Text Cleaner (HTML, invisible characters, regex replace)
- Lorem Ipsum Generator · Reading Time Calculator · Text Reverser

**Images & PDFs** (all local, no uploads)
- Image Resizer · Image Cropper · Image Format Converter · Image to Base64
- PDF Merge · PDF Split · PDF Page Extractor — powered by `pdf-lib`, lazy-loaded with a loading state
- The existing Image Compressor remains available.

**Developer & internet**
- HTML Formatter (+ minify) · XML Formatter & Validator · SQL Formatter · conservative JavaScript Minifier
- Wi-Fi QR Code Generator · HTTP Status Code Lookup · User Agent Parser
- IP Address Lookup — offline IPv4/IPv6 classification, plus optional consented geolocation via ipapi.co

Not included by design: **URL shortener**. Real shortening needs a persistent backend, abuse
controls and a domain; a client-only imitation would produce fake links.



## Real-world usefulness expansion (88 tools, 10 suites)

**PDF Workspace (9 tools):** compress (rasterising rebuild with quality/scale and before/after size), PDF → JPG/PNG,
images → PDF (multi-file, page size, margins), page organizer (drag reorder, rotate, delete, export),
metadata viewer, PDF → text (text-layer extraction). Existing merge/split/extractor preserved.
Powered by PDF.js + pdf-lib, both local. Worker served from `/pdf.worker.min.mjs`.

**Image Studio (10 tools):** existing five plus bulk processor (resize/compress/convert, per-file
results, failed/skipped reasons, ZIP via fflate), dimensions checker, EXIF metadata viewer,
favicon generator (16/32/48/180/512 PNG + HTML snippet), social preset resizer.

**File Converter (7 tools):** CSV ↔ JSON, JSON ↔ XML, CSV viewer/editor, column sorter, duplicate-row
remover, XLSX preview (SheetJS, lazy, read-only) and file-size converter. RFC-4180-style CSV parser
with quoting, multiline fields and line-level warnings.

**Calculator Hub (17 tools):** added loan/mortgage with amortisation, VAT (user-entered rates), tip and
bill splitter, fuel cost, electricity cost, time-zone converter and working-days calculator.

**Security & Generators (8 tools):** existing password/username/random tools plus passphrase (bundled
word list, entropy shown), UUID v4 bulk, secure token (hex/Base64/URL-safe, entropy shown) and random
team generator. All use crypto.getRandomValues / randomUUID.

**Student & Productivity (4 tools):** Pomodoro study timer, exam countdown, flashcard deck and checklist,
with localStorage persistence where relevant. A Markdown editor already existed, so no duplicate was added.

**Platform features:** drag-and-drop launcher (detects format, suggests operations, never processes or
uploads without opening a tool yourself), PWA manifest with real 192/512/maskable icons and a service
worker that caches the app shell (offline fallback), install button, and an EN/PL switcher for the site
shell, navigation and suite directory.

### Honest limits of this expansion

- **PDF compression rasterises pages.** Text becomes an image; selectable text and accessibility are lost.
  Encrypted PDFs are refused. PDF OCR is not implemented — image-only scans are reported as having no text layer.
- **XLSX preview is read-only** and does not recalculate formulas or render charts/macros. It runs SheetJS
  lazily with a 12 MB / 12-sheet / 2,000-row cap. The installed `xlsx@0.18.5` carries published audit
  advisories; for a production deployment consider the maintained SheetJS build or a server-side parser.
- **Polish translation covers the shell only** (navigation, suite directory, language switcher, selected
  footer labels). Tool bodies, FAQs, error messages and SEO metadata remain English. A complete bilingual
  content layer would be a separate, larger piece of work.
- **Offline:** the app shell and already-cached tools work offline, and all local file tools remain usable.
  Admin, feedback, anonymous analytics and the optional IP geolocation require network.
- **Bundle size:** the single-file build inlines PDF.js and SheetJS, producing a 2.63 MB HTML file
  (~828 KB gzip), so dynamic imports do not reduce the initial payload. Splitting the build (removing
  `viteSingleFile`) is the next performance step.
- **Admin** remains the existing Supabase implementation. It is not end-to-end verified without credentials.

### Tests performed (this round)

- `npx tsc --noEmit`: 0 errors. `npm run build`: success.
- Real Chromium run #1: PDF metadata, PDF → text, PDF → images, page organizer rotate/delete/export,
  PDF compressor, images → PDF download, bulk image processing, dimensions, favicon, social resizer,
  CSV→JSON quoted fields, JSON→CSV nested flattening, CSV dedupe, CSV editor, JSON→XML, file sizes,
  loan/VAT/tip, time zones, passphrase, UUID, token, teams, Pomodoro, flashcards, checklist persistence,
  exam countdown, workspace tab counts, PWA manifest/service worker/PDF worker, existing password/JSON
  regressions, and mobile overflow. Two test assertions were wrong (textarea values are not in innerText,
  CSS-uppercased labels) and one real bug was found and fixed: bulk result object URLs were revoked on
  every progress update, breaking Save and ZIP download.
- Real Chromium run #2 (21/21 passed): existing password, QR, unit converter and word counter; Polish
  switch and persistence; admin honest unconfigured state; admin API exposes no data on a static host;
  manifest icons; service worker and PDF worker served; XLSX sheet preview; dimensions; image metadata;
  CSV sorter; fuel and electricity calculations; working days; PDF text extraction value; PDF page image;
  bulk processing with a real ZIP download; and six mobile pages with no horizontal overflow.
- Screenshot capture hit a Playwright timeout at the end of run #2; this was a capture issue, not an app error.
- **Not verified:** live PDF previews on Safari/iOS, very large PDFs/XLSX near memory limits, live Supabase
  login and writes, and a full offline session on a device.

## Tool consolidation — mapping

All existing tool URLs (`/tools/<slug>`) are preserved; suite pages are additional
canonical landing pages (`/toolkits/<slug>`). No redirects were needed and no functionality moved.

| Suite | Page | Tools inside | Dedicated pages |
|---|---|---|---|
| Calculator Hub | `/toolkits/calculator-hub` | Percentage, Percentage change, Discount, Average, Grade, Age, Date difference, Time duration, Unit converter, Cooking converter | 10 unchanged |
| Text Studio | `/toolkits/text-studio` | Word counter, Case converter, Text cleaner, Duplicate lines, Line sorter, Reverser, Lorem ipsum, Reading time, Text diff | 9 unchanged |
| Image Studio | `/toolkits/image-studio` | Image compressor, Resizer, Cropper, Format converter, Image to Base64 | 5 unchanged |
| Developer Toolkit | `/toolkits/developer-toolkit` | JSON, HTML, XML, SQL formatters, JS minifier, Base64, URL encoder, Timestamp, Regex, User agent, HTTP status, CSS gradient, Contrast checker | 13 unchanged |
| PDF Toolkit | `/toolkits/pdf-toolkit` | PDF merge, split, page extractor | 3 unchanged |
| QR Toolkit | `/toolkits/qr-toolkit` | QR code generator, Wi-Fi QR generator | 2 unchanged |
| Family & Growth | `/toolkits/family-growth` | Parent height predictor, Children's BMI — deliberately separate tools | 2 unchanged |

Standalone tools (no suite, all preserved): Password generator, Username generator, Random number
generator, Random choice picker, Adult BMI calculator, Stopwatch & Timer, Color palette generator,
Markdown editor, Internet speed guide, PC bottleneck calculator, IP address lookup.

Suite pages provide overviews and tabbed access to each tool. An active tab canonicalises to the
tool's own `/tools/<slug>` page; the overview canonicalises to `/toolkits/<slug>`. This avoids
duplicate-indexing the same tool under two URLs.

## Admin management additions

Migration `0002_admin_management.sql` adds editable tool names, public descriptions, category
overrides, visibility and feedback workflow status. The dashboard now supports:

- Overview: total / enabled / disabled / hidden tools, event totals, top tools, category distribution, recent activity.
- Tools Manager: rename, edit public description, change category, enable/disable, hide from listings, suite membership, full category CRUD.
- Analytics: aggregate tool opens over time, most-used tools and popular categories.
- Feedback: new / reviewing / resolved workflow plus deletion.
- SEO: page title, meta description and public tool description per tool.
- Announcements: create, edit, activate/deactivate, delete.
- Settings: site name and indexing preference.

## Private admin panel (real authentication)

`/admin/login` uses **Supabase Auth (email + password)**. Authorization is enforced on the
server by `api/admin/[...path].ts` (valid token **and** active membership in `admin_users`) and
independently by Postgres Row Level Security. The service-role key exists only in server
environment variables. The admin SDK is lazy-loaded on `/admin` only.

Dashboard: Overview · Tools manager (enable/disable) · Analytics (real first-party events) ·
Feedback · SEO overrides · Announcements · Settings, with sign-out and session handling.

**Setup:** follow [`docs/ADMIN_SETUP.md`](docs/ADMIN_SETUP.md). Required: run
`supabase/migrations/0001_admin_schema.sql`, add your user UUID to `admin_users`, and set the
variables listed in `.env.example`. Until then, `/admin` explicitly says the backend is not
configured — it does not fake a login or invent statistics.

Security properties:
- No passwords, service-role keys or secrets in frontend code or git (`.gitignore` covers env files).
- Unauthenticated/invalid sessions receive 401; non-admin accounts receive 403.
- `/api/public/*` accepts only aggregate events and feedback; no IP/UA storage, small in-memory rate limits.
- `robots.txt` disallows `/admin` and `/api`; Vercel adds `X-Robots-Tag: noindex`.
- Admin routes are not linked from the public header or footer.

## Verification performed

- `npx tsc --noEmit` and `npm run build` pass (55 tools, 7 suites, 68 sitemap URLs).
- Real Chromium suite: 37/38 timed checks passed before a test-harness selector timeout; the one
  reported failure was a case-sensitive test assertion against CSS-uppercased output, not an app error.
  A focused re-test confirmed image resizing (local canvas output) and PDF merge (2 + 3 pages → a real
  5-page PDF) with zero console/page errors.
- CDC pediatric maths: 434/434 official P85/P95 values reproduced within tolerance and the data
  file checksum matches the downloaded source CSV.
- Server API tests (bundled handlers, mocked runtime): no token → **401**, tampered token → **401**
  with no crash, delete route without token → **401**; without configuration every admin endpoint
  returns **503** with no data. Public config returns safe defaults; feedback refuses to pretend.
- Existing password generator, unit converter, word counter and QR generator re-tested.

**Tool-suite verification (latest change):** 61/61 real-browser checks passed with zero runtime
errors. Covered: all seven suite pages, tab counts, inline tool rendering (discount, average,
JSON, PDF, image, Wi-Fi QR), tab switching and URL state, canonical URLs for tabs vs suite overview,
directory function search (“duplicate”), palette function search, direct legacy `/tools/<slug>` URLs,
password tool regression, children's BMI, PDF extractor, honest unconfigured admin state, and
mobile overflow at 390 px for suites, developer tabs and `/admin/login`. Screenshots were inspected
for the directory, a suite overview, an inline calculator tab and the mobile text suite.

**Server authorization tests:** with environment variables explicitly injected before module load,
all seven admin routes were re-tested against the bundled handler: missing token → 401 on GET/PATCH/
POST/DELETE, forged bearer token → 401 invalid session, unknown route without token → 401. No data
was returned in any rejection.

**Not end-to-end verified:** a live Supabase sign-in and real dashboard writes, because no Supabase
project credentials exist in this environment. Run migrations `0001` and `0002`, add your user to
`admin_users`, configure the variables in `.env.example`, deploy, then verify sign-in, logout and
persistence in your own project.

## Upgrade highlights

- **Developer tools category** with seven utilities; Design & web gained three more.
- **Recently used tools** (`toolora:recent:v1`, max six) shown on the home and tools pages.
- **Search** matches names, categories, descriptions and keywords, ranks recents/favorites first,
  and opens with `⌘K`/`Ctrl+K` or `/`. Empty results suggest useful queries.
- **Favorites** work exactly as before and now include the new tools.
- **Keyboard shortcuts:** `⌘/Ctrl+Enter` formats JSON, `⌘/Ctrl+S` downloads Markdown,
  `⌘/Ctrl+K` or `/` opens search, `esc` closes it.
- **Every new tool is local-first.** No uploads, paid APIs, keys or backend. The image compressor
  uses canvas in memory; regex uses the native JavaScript engine; Markdown escapes raw HTML and
  blocks unsafe link protocols.

## Open it as one file, no server

`npm run build` produces **`dist/index.html`** — a complete, self-contained website with all CSS,
JavaScript and icons inlined. You can double-click it and use every tool offline. Links switch to
`#/tools/...` hash routes in that mode, because browsers do not allow history changes on `file://`.
The same build is what you upload to a host.

## How to make it public (step by step)

The project is a static Vite build, so it can be published free. The fastest route is Netlify
Drop — no account setup, no build configuration:

1. Run `npm install` and then `npm run build` on your computer.
2. Open <https://app.netlify.com/drop> in a browser.
3. Drag the generated **`dist`** folder onto the page.
4. Netlify returns a public address such as `https://your-site-name.netlify.app` and it is live
   for anyone in the world. You can claim the site (free account) to keep it and rename it.

Alternative free hosts:

- **Vercel** — push the folder to GitHub, import the repo at <https://vercel.com/new>, keep the
  detected Vite settings (`npm run build`, output `dist`) and press Deploy. Use the CLI
  `vercel --prod` for the same result. `vercel.json` is already included.
- **Cloudflare Pages** — connect the repository, build command `npm run build`, output
  directory `dist`.
- **GitHub Pages** — works for the home page, but this app uses client-side routes such as
  `/tools/word-counter`; static hosts that ignore rewrites need the included redirects or a hash
  router. Netlify, Vercel and Cloudflare Pages handle the routes correctly out of the box.

Custom domain (optional): buy a domain (for example at Cloudflare or Namecheap), then add it in
your host's dashboard → Domains. After pointing the DNS records the host shows you, the site is
reachable at your own address. Then update `SITE_URL` in `src/lib/seo.ts`, plus `index.html`,
`public/robots.txt` and `public/sitemap.xml`, and redeploy.

Note: this repository is the source code, not a hosted site. Publishing requires one of the steps
above. Nothing is public until you upload the built `dist` folder or connect the repository to a
host.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
```

Create a production build and preview it:

```bash
npm run build
npm run preview    # http://localhost:4173
```

## Deploy to Vercel (free tier)

**Option A — dashboard**

1. Push this folder to a GitHub, GitLab or Bitbucket repository.
2. Go to <https://vercel.com/new> and import the repository.
3. Vercel detects Vite automatically. Confirm:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
4. Click **Deploy**.

**Option B — CLI**

```bash
npm i -g vercel
vercel           # preview deployment
vercel --prod    # production deployment
```

`vercel.json` rewrites the client-side routes to `index.html`, so deep links such as
`/tools/word-counter` work on direct loads. `public/_redirects` provides the same fallback for
Netlify, and `public/404.html` handles static hosts that serve a 404 page instead.

### After deploying

1. Set your real domain in `SITE_URL` (`src/lib/seo.ts`), `index.html`, `public/robots.txt` and
   `public/sitemap.xml`.
2. Replace `hello@toolora.com` in `src/pages/Company.tsx` and the legal pages with your address.
3. Submit `https://your-domain.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
   The sitemap currently lists 104 URLs: home, all tools, 10 suites, 88 tool pages and four company/legal pages.

## Project structure

```
index.html                 Base HTML, fonts, default metadata, organisation schema
vercel.json                SPA rewrites for Vercel
public/                    favicon, manifest, robots.txt, sitemap.xml, og image, 404 fallback
src/
  App.tsx                  Providers + route switch
  index.css                Design tokens, base styles, range sliders, motion
  lib/
    router.tsx             Small history-API router (Link, useLocation, useNavigate)
    seo.ts                 Per-page title, description, canonical, OG, JSON-LD
    tools.ts               Tool registry: SEO copy, how-to steps, FAQs
    favorites.tsx          localStorage-backed favorites context
    recent.tsx             localStorage-backed recently used tools
    utils.ts               Secure randomness, formatting, clipboard, downloads
  components/              Layout, tool browser, recents strip, UI primitives, icons, logo
  tools/                   The 25 interactive tools
    DevEncoding.tsx        JSON, Base64, URL and timestamp tools
    DevText.tsx            Text diff, Markdown editor and regex tester
    VisualTools.tsx        Image compressor, contrast checker and gradient generator
  pages/                   Home, browse, favorites, tool page, company, legal
```

## Privacy and ads

- Tool inputs are processed in the browser; there is no backend endpoint receiving them.
- Favorites are stored in `localStorage` under `toolora:favorites:v1`.
- **No advertisements are shown.** The `AdSlot` component renders a clearly labelled reserved
  space. When (and if) you are approved for an ad network, add the script and replace the slot
  contents. Keep ads labelled and out of the tools' working areas.
- Structured data is included for the site, tools (`SoftwareApplication`), FAQs, breadcrumbs and
  collection/about/legal pages.

## Notes

- Runtime dependencies beyond React: `qrcode`, `pdf-lib` (PDF tools), `pdfjs-dist` (page rendering), `fflate` (ZIP), `xlsx` (spreadsheet preview),
  `@supabase/supabase-js` (dynamic import only on `/admin`; also used by server APIs)
  and `ws` (WebSocket transport so Supabase Auth works in Node 20 serverless functions).
  The admin SDK is bundled (not fetched from a CDN) and excluded from the public tool routes.
  The other tools use browser APIs only.
- Public bundle: 1.40 MB single file (458 KB gzip) containing all 55 tools plus the lazily invoked
  PDF engine. The admin SDK is not in the public initial path.
- Validated with a production build, a 91-check real-browser suite (desktop + mobile, clipboard,
  downloads, canvas, persistence) and a DOM interaction suite covering the new tools and existing
  regressions.
- Fonts load from Google Fonts; self-host them if you want zero third-party requests.
- The site is not legal or medical advice. Review the Privacy Policy and Terms pages with a
  professional before publishing if you need jurisdiction-specific compliance.
