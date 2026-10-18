# QUALITY.md — the Phase 7 passes

Phase 7 (TASK-036…042 in `docs/TASKS.md`) is the quality-and-launch phase, and
its tasks are two different kinds of thing. This file keeps them apart honestly:

- **What a script can prove** lives in `tools/check-*.js` and runs alongside the
  structural checks. It is repeatable and it fails the build.
- **What only a person looking at the rendered page can judge** is recorded
  here: how it was done, what was seen, and on which engine.

Where something still needs a human on a real device before launch, this file
says so rather than implying it was signed off. Those items are collected in
`docs/DEPLOY.md`'s pre-launch list.

## Running the automated half

```
node tools/check-responsive.js    # TASK-036
node tools/check-a11y.js          # TASK-037
node tools/check-seo.js           # TASK-038
node tools/check-performance.js   # TASK-039
node tools/check-links.js         # TASK-041
```

Each exits non-zero on a problem and prints the page and the reason. They read
the pages from disk, so they run with no server, no browser and no dependency.

---

## TASK-036 — Responsive review (360, 768, 1024, 1280)

### Automated

`tools/check-responsive.js` checks the decisions that are either in the markup
or not, and that a screenshot would not reveal until someone opened the site on
a small phone:

1. Every page declares `width=device-width, initial-scale=1`, and none of them
   caps the zoom (`maximum-scale` / `user-scalable=no`), which breaks pinch zoom.
2. Every `<img>` carries `width` and `height`, so the browser knows its
   intrinsic size and the layout does not jump as it loads.
3. No inline style fixes a width or turns off wrapping — the two ways a single
   element forces a horizontal scrollbar on a narrow screen.
4. Every `.section` band holds its `.container`, which is what supplies the side
   padding the fluid grid needs.
5. No `<table>` is left without a `.table-responsive` wrapper.
6. In `jnd.css`, fixed pixel widths are confined to the two small components
   that need them (the 48px icon tile, the 44px process numeral); no layout
   element is pinned in pixels, and nothing hides horizontal overflow.

All pass.

### Reviewed

The pages were served over a local static server (so an extensionless URL and
the 404 behave as they do on the host), rendered in **headless Firefox ESR 140**
— a real Gecko engine, not a simulation — at **360, 768, 1024 and 1280px wide
and full page height**. The scroll-reveal was switched off for the captures with
a capture-time CSS override, so a screenshot could not catch an element mid-fade
and read as a layout fault.

Every page was rendered. The six layouts below cover the rest, because the pages
are assembled from the same components and the same column classes:

| Template | 360 | 768 | 1024 | 1280 |
| --- | --- | --- | --- | --- |
| Home (`index.html`) | everything one column; 10 service cards stacked | service cards two-up; "why JND" two-up | service cards three-up; nav expanded | as 1024 — the container caps at 1200px |
| Services hub (`services/index.html`) | search full width, cards stacked | cards two-up | cards three-up, search on its own row | as 1024 |
| Service detail (e.g. `services/it-support-maintenance.html`) | one column; check list, process and related all stacked | check list two-up; process two-up; related two-up | check list two-up; benefits three-up; related three-up | as 1024 |
| About (`about.html`) | one column; check list stacked | check list two-up; principles two-up | check list two-up; principles four-up | as 1024 |
| Contact (`contact.html`) | form, then details card, then next-steps stacked | form full width, details below, next-steps two-up | form 8 / details 4; next-steps three-up | as 1024 |
| 404 (`404.html`) | one column; three buttons stacked full width | buttons in a row | as 768 | as 768 |

Findings:

- **No horizontal overflow at any width.** Nothing is clipped at the right edge
  and no horizontal scrollbar appears; long headings and body copy wrap.
- **The nav collapse is correct.** The bar is expanded at 1024 and 1280 and
  collapses to the hamburger at 768 and 360, which is the intended
  `navbar-expand-lg` breakpoint.
- **The 1024 and 1280 layouts are deliberately near-identical**, because the
  container is capped at 1200px; the extra room past 1200px becomes margin.
- **Nothing needed a CSS change.** TASK-036 found no defect, which is the
  useful result: the fluid layout was built correctly the first time, and the
  checker above now holds it that way.

**Still open before launch:** a touch pass on a real device (tap targets, the
dropdown on a phone, iOS Safari's viewport chrome). It cannot be done from a
headless browser and is on the pre-launch list in `docs/DEPLOY.md`.

---

## TASK-037 — Accessibility pass

### Automated (`tools/check-a11y.js`)

Fourteen checks, split between the markup and the stylesheet:

**Markup, on every page**

1. `<html lang>` is set to `en`, and there is a non-empty `<title>`.
2. Exactly one `<h1>`, and headings never skip a level going down.
3. Every `<img>` has an `alt` attribute — empty is fine, that is how a
   decorative image is marked.
4. Every form control has an accessible name (a `<label for>`, or an
   `aria-label` / `aria-labelledby`); hidden inputs and submit buttons are
   exempt, as the spec says.
5. Every inline `<svg>` is either `aria-hidden` — on itself **or on a
   wrapper**, which is how the service cards mark theirs — or given a name, so
   an icon is never announced as an unnamed graphic.
6. Every link and button has discernible text (visible text, an `aria-label`,
   or the `alt` of an image inside it).
7. Every `aria-labelledby` / `aria-describedby` / `aria-controls` points at an
   id that exists on the same page.
8. No positive `tabindex`, which would hijack the tab order.
9. A skip link whose target exists and carries `tabindex="-1"`, so focus
   genuinely moves rather than only scrolling.
10. Landmarks: one `<main>`, plus a `header`, `footer` and `nav`.
11. No duplicate id, which would break label and aria references.

**Stylesheet**

12. A `:focus-visible` ring on links and buttons, and no rule that deletes the
    outline instead of replacing it.
13. A `prefers-reduced-motion` block.

**Contrast**

14. The token pairs `DESIGN.md` depends on are **recomputed** from the
    `--jnd-*` values in `jnd.css` and asserted against the WCAG threshold, so a
    palette change cannot quietly break a ratio that was measured by hand once.
    Three of them are *ceilings* rather than floors: Accent and Highlight must
    stay below the AA floor, because that is exactly why neither is ever used as
    a text background.

| Pair | Measured | Needs |
| --- | --- | --- |
| White on Primary | 7.40:1 | ≥ 4.5 |
| White on Secondary | 11.06:1 | ≥ 4.5 |
| White on Mid Blue (gradient endpoint, worst case) | 4.70:1 | ≥ 4.5 |
| Primary on White | 7.40:1 | ≥ 4.5 |
| Primary on Surface | 6.77:1 | ≥ 4.5 |
| Mid Blue on White (link hover) | 4.70:1 | ≥ 4.5 |
| Ink on White | 19.71:1 | ≥ 4.5 |
| Ink on Surface | 18.01:1 | ≥ 4.5 |
| Secondary focus ring on White | 11.06:1 | ≥ 3.0 |
| White focus ring on Secondary | 11.06:1 | ≥ 3.0 |
| White on Accent | 2.24:1 | < 3.0 (stays non-text) |
| White on Highlight | 1.72:1 | < 3.0 (stays non-text) |
| Highlight on Primary | 4.30:1 | < 4.5 (why it is not body text) |

One deliberate difference from the prose in `DESIGN.md`: it quotes **5.67:1**
for white on the Modern band. That figure is the gradient sampled where the text
actually sits; against the band's lightest endpoint (`#2878B8`, at 100%) the
ratio is **4.70:1**. Both clear AA, and the checker holds the worse of the two —
the endpoint — so the band cannot drift lighter without failing.

### Still to do by hand

These need a person and cannot be proved from the files. They are on the
pre-launch list in `docs/DEPLOY.md`:

- **Keyboard only:** tab through every page — the skip link first, the dropdown
  opened and closed by keyboard, the FAQ `<summary>` toggled by Enter/Space, and
  the contact form validated and submitted without a mouse. Confirm focus is
  always visible and never lands on something invisible.
- **Screen reader** (e.g. NVDA or VoiceOver): landmarks and heading navigation,
  every form label announced, the success panel (`role="status"`) announced when
  it appears, the error panel (`role="alert"`) interrupting, and the honeypot
  staying silent.
- **Zoom to 200%** and a text-only zoom: no clipping, no horizontal scroll.
- **Colour is never the only signal** — the error state carries text, not just
  a red border.

---

## TASK-038 — SEO basics (titles, meta descriptions, Open Graph, sitemap, robots)

### Automated

`tools/check-seo.js` holds every page to the same head:

1. A title of 15–70 characters, and a meta description of 70–160 — the lengths
   search engines render before they cut the text off.
2. Titles and descriptions **unique across the site**, so two pages are not
   competing for the same words.
3. A canonical URL, absolute against `https://jndis.net` and **derived from the
   page's own path**, so the tag and the file cannot disagree. `404.html` is
   exempt: a 404 is not a destination and has nothing to name as its own.
4. The Open Graph set — `type`, `site_name`, `locale`, `url` (matching the
   canonical), `title`, `description`, and a 1200x630 `og:image` with
   dimensions and alt text.
5. The Twitter/X set — title, description and image.
6. A favicon and a `theme-color`.

It then reads `sitemap.xml` and asserts it lists **exactly** the indexable pages
(every page except the 404) with absolute URLs, and reads `robots.txt` to assert
it allows crawling and points at the sitemap.

### Written

- **Every page** gained a `<link rel="canonical">` and an `og:url` (the 404,
  deliberately, gained neither), plus the share image and the
  `summary_large_image` Twitter card.
- **`sitemap.xml`** — fifteen entries, home as `https://jndis.net/`, service
  pages at priority 0.8, the 404 absent.
- **`robots.txt`** — allows everything, points at the sitemap.
- **`assets/img/og-image.svg`** is the share card's source and
  **`assets/img/og-image.png`** the 1200x630 render the pages reference. It was
  rendered and looked at: navy-to-blue gradient, the wordmark, the tagline and a
  small network motif. The PNG is a 256-colour quantisation, which took it from
  101KB to 33KB without a visible band in the gradient.
- Two descriptions (`services/index.html`, `contact.html`) were trimmed below
  160 characters to fit the ceiling.

### Reviewed

Whether the *words* are good is a human judgement; the titles name the page and
the brand, the descriptions say what the page offers, and all fifteen were read
back before being accepted.

**Still open before launch:** submit `https://jndis.net/sitemap.xml` to Google
Search Console. Optional, and on the pre-launch list.

---

## TASK-039 — Performance pass (image optimisation, lazy loading, Lighthouse 90+)

### Automated

`tools/check-performance.js` holds the decisions that make a good score
reachable rather than the score itself:

- Bootstrap arrives from the CDN **minified and pinned** (`bootstrap@5.3.8`);
  the only third-party script a page loads is that bundle — no analytics
  snippet, no icon script.
- The typeface is requested once with `display=swap` and a preconnect to the
  font host, so text is never invisible while a slow font downloads.
- No `@import` in the stylesheet and no inline `<style>` block, either of which
  would serialise a second round-trip before first paint.
- Every `<img>` declares `width`/`height` and `decoding="async"`; the
  below-the-fold footer wordmark is `loading="lazy"` while the above-the-fold
  header wordmark is not (lazy-loading what you see first delays what you see
  first).
- Every local file and every page's local weight is under a budget.

The measured weights:

| Page | HTML | Local total |
|---|---|---|
| `index.html` | 30KB | 60KB |
| service detail page (each) | 34–35KB | 66–67KB |
| `services/index.html` | 29KB | 63KB |
| `about.html` | 24KB | 54KB |
| `contact.html` | 26KB | 63KB |
| `404.html` | 16KB | 47KB |

Budgets are 60KB of HTML per page, 140KB of local assets per page, 100KB per
stylesheet or script, and 200KB per raster image. They are deliberately
generous relative to what is here, so they fire on an accident — a stray script,
a pasted screenshot — and not on ordinary growth.

### Reviewed

- **There is nothing to optimise down from.** The site carries no photographs:
  the only `<img>` is the 786-byte SVG wordmark, repeated in header and footer.
  The one raster file, the 33KB share card, is fetched by link-preview scrapers,
  never by a page view.
- **The heavy work is CSS and fonts, and it is already off the critical path**:
  one stylesheet, four deferred scripts, and the two CDN files the design calls
  for.
- Icons are **inlined SVG with no icon-font or sprite request** (DESIGN.md,
  "Icons and Imagery"), which is why the HTML is a few kilobytes larger and the
  page one origin smaller.

**Still open before launch:** a Lighthouse run against the deployed URL, for 90+
across Performance, Accessibility, Best Practices and SEO. It needs the live
site, so it is on the pre-launch list in `docs/DEPLOY.md`.

---

## TASK-040 — Cross-browser check (Chrome, Firefox, Safari, Edge, mobile)

This one is a review, not a script; `docs/QUALITY.md` records what was exercised
and, honestly, what was not.

### What the site relies on

Deliberately ordinary, evergreen-browser features:

- **Layout** — flexbox, CSS grid (Bootstrap's row/columns), custom properties,
  `clamp()` for fluid type, `min-height`. All supported by every browser in the
  target set for years.
- **Behaviour** — an `IntersectionObserver` scroll reveal with a 3s
  content-visibility failsafe, `fetch` with a native form-POST fallback, and the
  mobile menu on Bootstrap's own bundle.
- **No-JavaScript and degraded paths** — the FAQ is native
  `<details>`/`<summary>`, so answers stay reachable without Bootstrap's
  collapse; the contact form posts natively; the search control ships `hidden`
  and is revealed by its script, so there is no dead box if the script fails.
  These exist for robustness, and they are also the reason the site behaves the
  same when a browser blocks something.

### What was run

- **Gecko — headless Firefox ESR 140.** All six templates rendered at 360, 768,
  1024 and 1280px, full page height, reveal off (TASK-036). No horizontal
  overflow, the nav collapsed at the intended breakpoint, the grids went 1/2/3
  columns, and the contact form went 8/4. This is a real engine, not a
  simulation.

### What was not run

The harness has no Chromium or WebKit, so **Chrome, Edge, Safari and mobile
browsers were not exercised**. The page renders identically because the features
above are all long-universal, but "identical by reasoning" is not "seen", and
this file does not pretend otherwise.

**Still open before launch (pre-launch list in `docs/DEPLOY.md`):** open the
deployed site in Chrome, Edge, Safari and a phone; check the dropdown, the
reveal, the services filter and the contact form in each; and do the touch pass
that TASK-036 could not do headlessly.

---

## TASK-041 — Fix broken links and run a link check

### Automated

`tools/check-links.js` collects every internal reference on every page — 734 of
them across fifteen pages — and checks each against the files on disk:

1. The target **file exists**, resolved from the page's own depth (`../assets/`
   one level down and `/assets/` on the 404 are the same file).
2. A link to a **directory** resolves to its `index.html`, which is how GitHub
   Pages serves it.
3. A **`#fragment`** points at an id that is genuinely on the target page, so a
   renamed section cannot leave a link scrolling to nowhere.
4. No **empty `href`** and no **`href="#"`** placeholder — the two ways a link
   that looks finished is not.
5. No `target="_blank"` without `rel="noopener"`/`noreferrer`.
6. `mailto:` and `tel:` links carry something after the scheme.

All 734 resolve. **No broken links were found, so none needed fixing** — the
useful result, and the same shape of result as TASK-036.

Nineteen distinct external links are listed rather than fetched, because this
runs offline. That includes the two CDNs, Google Fonts and the canonical URLs of
this site itself; they are re-checked against the live site at launch.

### Reviewed

The one thing the script cannot see is a link that resolves but goes to the
wrong *place*. The links were read alongside their text while TASK-032–035 were
built, and `check-services.js` already holds every service link to the name it
should carry.

**Still open before launch:** click the external links from the deployed site
once, and run an online crawler over `https://jndis.net` after the first deploy.

---

## TASK-042 — Deploy and connect the domain

### What is in the repository

The site is deploy-ready and hosted on **GitHub Pages** from `main`, behind
**https://jndis.net**:

- **`CNAME`** holds `jndis.net` (committed as far back as TASK-001).
- **`.nojekyll`** keeps GitHub Pages from running the files through Jekyll.
- **`404.html`** is what GitHub Pages serves automatically for any unmatched
  URL, at any depth.
- **`sitemap.xml`** and **`robots.txt`** sit at the root where crawlers look.
- **`docs/DEPLOY.md`** is the runbook: one-time setup, DNS records, HTTPS, the
  per-release step, verification and rollback.

### Done vs open

The repository half is done: the files above exist, the pages are host-agnostic
static files with relative links, and `docs/DEPLOY.md` records the exact DNS
records and settings. The parts that need credentials or a live domain are
**open** and listed as pre-launch items in `docs/DEPLOY.md`:

- Enabling Pages, entering the custom domain, adding the four apex A records and
  the `www` CNAME, and enforcing HTTPS.
- Supplying the **real contact details** and a **working contact form** — kept
  as clearly-marked placeholders on purpose, so nothing fake ships by accident.
- The touch and real-browser passes, the Lighthouse run and the sitemap
  submission carried over from TASK-036–041.

**Deliberately not done here:** no deploy was run and nothing was pushed. The
checkout is one commit ahead of `origin/main`; publishing is a human decision.

---

## Still open before launch (all of it, in one place)

Every item below is also on the checklist in **`docs/DEPLOY.md`**, which is the
file to work from on launch day:

1. Real contact details in the shared footer (and on the contact page).
2. A real Formspree id and fallback inbox for the contact form.
3. A touch pass on a real phone; a real-browser pass in Chrome, Edge, Safari and
   mobile.
4. A Lighthouse run against the deployed URL.
5. A screen-reader pass and a keyboard-only pass; a 200%-zoom reflow check.
6. Submit the sitemap; click the external links from the live site.

The five checkers listed at the top of this file are green and run without a
server, a browser or a network. What remains needs a person and, in most cases,
the live domain.

