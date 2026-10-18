# Tasks: JND Integrated Solutions Website

Stack: static site, HTML + Bootstrap 5.3.8 (CDN) + vanilla JavaScript. No backend, no build step.

## Workflow

Work one task at a time. Never build the whole site in one prompt.

```
TASK-001 → Implement → Test → Review → Mark complete → TASK-002
```

Definition of done for every task:
- Matches DESIGN.md (colors, type, buttons, cards)
- Works at 360px, 768px and 1280px widths
- Keyboard accessible, no console errors
- Works served as plain static files — no build step (target: GitHub Pages)
- Box checked below

---

## Service list (single source of truth)

Every place that lists services — header dropdown (TASK-006), footer (TASK-008),
services hub cards (TASK-017), related services and the previous/next pager
(TASK-031) — must use this exact list, order and filenames.

The first three are complete lists. The last two are deliberately partial, and
are fenced in the markup so that `tools/check-services.js` can tell a partial
list from a list that has lost an entry.

| # | Service | File |
|---|---|---|
| 1 | IT Support & Maintenance | `services/it-support-maintenance.html` |
| 2 | Network Infrastructure & Solutions | `services/network-infrastructure.html` |
| 3 | Server Management & Hosting | `services/server-management-hosting.html` |
| 4 | Cloud & Virtualization Solutions | `services/cloud-virtualization.html` |
| 5 | Cybersecurity & Network Security | `services/cybersecurity.html` |
| 6 | CCTV & Surveillance Solutions | `services/cctv-surveillance.html` |
| 7 | Web Development & Digital Solutions | `services/web-development.html` |
| 8 | IT Consultancy & Project Implementation | `services/it-consultancy.html` |
| 9 | Managed IT Services | `services/managed-it-services.html` |
| 10 | IT Equipment Supply & Installation | `services/equipment-supply-installation.html` |

Services hub: `services/index.html`. About: `about.html`. Contact: `contact.html`.

---

## Phase 1: Setup

- [x] TASK-001: Create folder structure (`/`, `/services/`, `/assets/css`, `/assets/js`, `/assets/img`)
- [x] TASK-002: Initialize Git repo and add `.gitignore`
- [x] TASK-003: Link Bootstrap 5.3.8 and Inter (Google Fonts + jsDelivr CDN, correct load order)
- [x] TASK-004: Create `assets/css/jnd.css` (brand tokens, type scale, gradients, button and card overrides)
- [x] TASK-005: Create base HTML template (meta tags, fonts, CDN links, skip link)

## Phase 2: Shared Layout

- [x] TASK-006: Build header with logo, nav and Services dropdown
- [x] TASK-007: Build mobile menu (hamburger toggle, focus handling, close on link click)
- [x] TASK-008: Build footer (company info, service links, contact, copyright year via JS)
- [x] TASK-009: Create shared button, card and section components (documented in DESIGN.md)
- [x] TASK-010: Share header and footer as duplicated static markup, not JS partials (see DESIGN.md) — canonical blocks marked in every page, drift guarded by `tools/check-shared.js`

## Phase 3: Home Page

- [x] TASK-011: Hero section with tagline and call-to-action buttons — composed from existing components only; the Modern gradient was redefined AA-safe (see DESIGN.md)
- [x] TASK-012: Services overview grid (10 services, linked to detail pages) — `.card.h-100` on a Surface band, inline Lucide icons, one aria-label per link
- [x] TASK-013: Why choose JND section (Reliable Support, Professional Service) — four `.col-lg-3` feature columns, no card chrome, no new CSS. Also fixed: the shared footer was sitting *before* `<main>` and rendering above the page content; `check-shared.js` now verifies landmark order
- [x] TASK-014: Call-to-action banner (Modern Gradient) — centred, `col-md-10 col-lg-8`, one button; the gradient's second and last appearance on the page
- [x] TASK-015: Scroll reveal animations (respect `prefers-reduced-motion`) — `assets/js/reveal.js` + a `<head>` hook gated on `.js-reveal`, with a 3s failsafe; behaviour covered by a stubbed-DOM test

## Phase 4: Services Hub

- [x] TASK-016: Create `services/index.html` with page header and breadcrumb — new "page header" component: a Surface band (never the gradient hero, which stays the front door), Breadcrumb mirroring the URL, `col-lg-8` H1. Needed no new CSS; `check-shared.js` now resolves relative links before comparing, so a page one level down is not flagged for writing `../assets/`
- [x] TASK-017: Service category cards linking to each sub-service page — the home grid inverted (White band, `.bg-surface` cards), sibling hrefs, `<h2 class="h3">` titles so the levels never skip under the page's `<h1>`, and no `[data-reveal]` on a filterable grid. Added `tools/check-services.js`, which checks every copy of the service list against the table in this file
- [x] TASK-018: Search/filter by keyword in JavaScript, with empty state — `assets/js/services-filter.js`. The control ships `hidden` and the script reveals it, so with JS broken there is no dead search box; `role="status"` carries the count, the empty state carries the message and a "Clear search" button. Behaviour covered by a stubbed-DOM test against the real markup
- [x] TASK-019: Add "Request a quote" strip at the bottom — the documented CTA band with the hub's own copy, above the footer. Reuse, not a second banner

## Phase 5: Sub-Service Detail Pages

Each page uses the same template, in this band order: page header (Surface) → overview (White) → what's included (Surface) → **how we work** (White, *shared*) → benefits (Surface) → FAQ (White) → related services and previous/next (Surface) → call to action (gradient). Full description in `docs/DESIGN.md`, "Service detail page".

- [x] TASK-020: Create detail page template and shared JS (FAQ accordion, breadcrumb) — `services/it-support-maintenance.html` is the reference page, and `tools/check-service-pages.js` holds the other nine to its shape (bands, order, backgrounds, headings, counts). The FAQ is **native `<details>`/`<summary>`, not Bootstrap's `.accordion`**: a collapse panel is hidden with `display: none`, so if the CDN bundle ever failed the answers would be unreachable, not merely unanimated. The shared JS is `assets/js/service-page.js`, which opens the answer a `#faq-…` link points at; the breadcrumb needs none. New CSS is `jnd.css` §12 (`.faq-*`, `.process-*`, `.service-pager-*`) — the what's-included list needed none. `tools/lib/canonical-services.js` now holds the one parser of the service table, shared by both service checks
- [x] TASK-021: IT Support & Maintenance — the reference page the other nine are copied from
- [x] TASK-022: Network Infrastructure & Solutions
- [x] TASK-023: Server Management & Hosting
- [x] TASK-024: Cloud & Virtualization Solutions
- [x] TASK-025: Cybersecurity & Network Security
- [x] TASK-026: CCTV & Surveillance Solutions
- [x] TASK-027: Web Development & Digital Solutions
- [x] TASK-028: IT Consultancy & Project Implementation
- [x] TASK-029: Managed IT Services
- [x] TASK-030: IT Equipment Supply & Installation
- [x] TASK-031: Add previous/next service navigation and related services on each page — three related services, always **in canonical order and never the page's own service**, and a two-link pager to the two neighbours in the canonical order, **wrapping at the ends** so IT Equipment leads back to IT Support and no page is a dead end. The direction is written out ("Previous service …") rather than left to an arrow. Both lists are deliberately partial, so they are fenced in the markup (`BEGIN related services`, `BEGIN service pager`) and `check-services.js` was taught to check each against what it is meant to be — the fence is what opts a list out of the "every list is the full ten" rule, so a service that quietly vanishes from the header, the footer or the hub grid is still caught. Built as part of TASK-021–030 rather than after them: the blocks are per-page content, and adding them in a second pass would have meant editing all ten files twice

## Phase 6: Supporting Pages

- [x] TASK-032: About page — opens on the Page header band, then **Who we are** (prose), **What we do** (the canonical service list as the check-list component, so `check-services.js` holds this copy to `docs/TASKS.md` like the dropdown and footer), **How we work with you** (the feature list) and the page-foot CTA. No new CSS
- [x] TASK-033: Contact page with form (client-side validation, success and error states) — Page header, then **Send us a message** (a `novalidate` form validated in Bootstrap's `.was-validated` / `.invalid-feedback` style by `assets/js/contact-form.js`, with a disabled/spinner loading state, a `role="status"` success panel and a `role="alert"` error panel) beside a details card, then **What happens next**. Adds no CSS — and the temporary `.site-placeholder` underline now uses `currentColor` so it reads on this page's light card as well as the dark footer
- [x] TASK-034: Connect form to a static form service (e.g. Formspree) or `mailto` fallback — the form is a native `method="post"` to a Formspree `action`, so it submits with JavaScript off; `contact-form.js` enhances it to a `fetch` POST with the three states, and falls back to a `mailto:` built from the fields when the endpoint is still a placeholder. The endpoint (`REPLACE_WITH_FORM_ID`) and fallback inbox (`REPLACE_WITH_EMAIL`) are placeholders until TASK-042, and the script says so rather than swallowing a message
- [x] TASK-035: Custom 404 page — Home / Page not found, a short apology and three routes back (homepage, services hub, contact). Every path on it is **root-absolute**, because a 404 is served for a URL at any depth and a relative asset would resolve against a directory that does not exist; `check-shared.js` and `check-services.js` were taught to resolve a leading slash to the same site-root path as the relative spelling, and a new `tools/check-supporting-pages.js` guards all three pages (headings, meta, page header, the form's wiring, and the 404's paths)

## Phase 7: Quality and Launch

- [x] TASK-036: Responsive review on all pages (360, 768, 1024, 1280) — `tools/check-responsive.js` holds the fluid layout's moving parts (the viewport and that no page caps the zoom, width/height on every image, no inline fixed width or `nowrap`, a `.container` in every band, no unwrapped table, and fixed pixel widths confined to the 48px icon tile and the 44px process numeral). The four widths were then rendered (headless Firefox ESR 140, full page height, reveal off) for all six templates — 1/2/3 column grids, the nav collapsing below 992px, the contact form going 8/4 — with no overflow and no CSS change needed. The matrix and findings are in `docs/QUALITY.md`
- [x] TASK-037: Accessibility pass (contrast, labels, focus states, alt text, landmarks) — `tools/check-a11y.js` runs fourteen checks: language and title, one `<h1>` and ordered headings, `alt` on every image, an accessible name on every control, a hidden-or-named inline `<svg>` (including an `aria-hidden` wrapper, which is how the cards mark theirs), text on every link and button, resolving `aria-*` references, no positive `tabindex`, a skip link whose target carries `tabindex="-1"`, the landmarks, and unique ids — plus the `:focus-visible` ring, the reduced-motion block, and the contrast ratios **recomputed from the `--jnd-*` tokens** rather than trusted (including the two that must stay *below* AA so they are never used for text). The screen-reader and keyboard-only review is a pre-launch checklist item in `docs/DEPLOY.md`; `docs/QUALITY.md` records the measured ratios and the manual list
- [x] TASK-038: SEO basics (titles, meta descriptions, Open Graph, `sitemap.xml`, `robots.txt`) — `tools/check-seo.js` holds every page to a title of 15–70 characters and a description of 70–160, both **unique across the site**; a canonical URL absolute against `https://jndis.net` and **derived from the page's own path** so the tag and the file cannot disagree (`404.html` is exempt — a 404 is not a destination, so it has no address to claim); the full Open Graph set with a 1200×630 image and alt; the Twitter/X set; a favicon and `theme-color` — then reads `sitemap.xml` and `robots.txt` and asserts the sitemap lists exactly the indexable pages and robots points at it. Added the canonical, `og:url` and `summary_large_image` card to every page, `sitemap.xml`, `robots.txt`, and the share card `assets/img/og-image.svg` with its 1200×630 PNG render (quantised 101KB→33KB with no visible band in the gradient); trimmed two descriptions below the ceiling. Submitting the sitemap to Search Console is on the pre-launch list
- [x] TASK-039: Performance pass (image optimization, lazy loading, Lighthouse 90+; Bootstrap CSS/JS is already minified via CDN) — `tools/check-performance.js` holds the decisions that make a good score reachable rather than the score: Bootstrap minified and pinned from the CDN as the **only** third-party script, the typeface requested once with `display=swap` and a preconnect, no `@import` and no inline `<style>`, `width`/`height` and `decoding="async"` on every image, the below-the-fold footer wordmark `loading="lazy"` while the above-the-fold one is not, and a budget on every file and every page's local weight (measured 16–35KB of HTML, 47–67KB per page). There is nothing to optimise down from — no photographs, only the 786-byte SVG wordmark and a share card no page view fetches. The Lighthouse run itself needs the live URL and is on the pre-launch list
- [x] TASK-040: Cross-browser check (Chrome, Firefox, Safari, Edge, mobile) — a review rather than a script. The site leans only on long-universal features (flexbox/grid, custom properties, `clamp()`, `IntersectionObserver`, `fetch`), with no-JavaScript and degraded paths throughout: the FAQ is native `<details>`, the contact form posts natively, and the reveal has a failsafe. **Gecko was exercised** — headless Firefox ESR 140 rendered all six templates at 360/768/1024/1280 in TASK-036 — but the harness has no Chromium or WebKit, so Chrome, Edge, Safari and mobile are **not** claimed as tested; the real-browser and touch passes are on the pre-launch list in `docs/DEPLOY.md`
- [x] TASK-041: Fix broken links and run link check — `tools/check-links.js` collects every internal reference on every page (734 of them) and checks the file exists at the page's own depth, that a directory link resolves to its `index.html`, that every `#fragment` names an id on the target page, that there is no empty or `href="#"` link, that no `target="_blank"` is missing `rel="noopener"`, and that `mailto:`/`tel:` carry something after the scheme. **All 734 resolve, so no link needed fixing.** The 19 distinct external links are listed, not fetched — the check runs offline; they are re-clicked from the live site at launch
- [x] TASK-042: Deploy (Netlify, Vercel, GitHub Pages or cPanel) and connect domain — **GitHub Pages from `main`, behind `https://jndis.net`**, which is what the repository already pointed at (`CNAME` was committed in TASK-001). Added `.nojekyll` so the files are served exactly as committed, and `docs/DEPLOY.md` — the runbook for turning Pages on, the four apex A records and the `www` CNAME, enforcing HTTPS, the one-line per-release step, verification and rollback. The repository half is done; enabling Pages, the DNS change and HTTPS need credentials, and the real contact details and Formspree id are kept as marked placeholders on purpose, so nothing fake ships by accident. **No deploy was run and nothing was pushed** — publishing is a human decision; the launch-day checklist is in `docs/DEPLOY.md`
