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
services hub cards (TASK-017), related services (TASK-031) — must use this exact
list, order and filenames.

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
- [ ] TASK-014: Call-to-action banner (Modern Gradient)
- [ ] TASK-015: Scroll reveal animations (respect `prefers-reduced-motion`)

## Phase 4: Services Hub

- [ ] TASK-016: Create `services/index.html` with page header and breadcrumb
- [ ] TASK-017: Service category cards linking to each sub-service page
- [ ] TASK-018: Search/filter by keyword in JavaScript, with empty state
- [ ] TASK-019: Add "Request a quote" strip at the bottom

## Phase 5: Sub-Service Detail Pages

Each page uses the same template: hero, overview, what's included, benefits, process, FAQ, CTA, related services.

- [ ] TASK-020: Create detail page template and shared JS (FAQ accordion, breadcrumb)
- [ ] TASK-021: IT Support & Maintenance
- [ ] TASK-022: Network Infrastructure & Solutions
- [ ] TASK-023: Server Management & Hosting
- [ ] TASK-024: Cloud & Virtualization Solutions
- [ ] TASK-025: Cybersecurity & Network Security
- [ ] TASK-026: CCTV & Surveillance Solutions
- [ ] TASK-027: Web Development & Digital Solutions
- [ ] TASK-028: IT Consultancy & Project Implementation
- [ ] TASK-029: Managed IT Services
- [ ] TASK-030: IT Equipment Supply & Installation
- [ ] TASK-031: Add previous/next service navigation and related services on each page

## Phase 6: Supporting Pages

- [ ] TASK-032: About page
- [ ] TASK-033: Contact page with form (client-side validation, success and error states)
- [ ] TASK-034: Connect form to a static form service (e.g. Formspree) or `mailto` fallback
- [ ] TASK-035: Custom 404 page

## Phase 7: Quality and Launch

- [ ] TASK-036: Responsive review on all pages (360, 768, 1024, 1280)
- [ ] TASK-037: Accessibility pass (contrast, labels, focus states, alt text, landmarks)
- [ ] TASK-038: SEO basics (titles, meta descriptions, Open Graph, `sitemap.xml`, `robots.txt`)
- [ ] TASK-039: Performance pass (image optimization, lazy loading, Lighthouse 90+; Bootstrap CSS/JS is already minified via CDN)
- [ ] TASK-040: Cross-browser check (Chrome, Firefox, Safari, Edge, mobile)
- [ ] TASK-041: Fix broken links and run link check
- [ ] TASK-042: Deploy (Netlify, Vercel, GitHub Pages or cPanel) and connect domain
