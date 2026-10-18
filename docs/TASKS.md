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

## Phase 1: Setup

- [x] TASK-001: Create folder structure (`/`, `/services/`, `/assets/css`, `/assets/js`, `/assets/img`)
- [x] TASK-002: Initialize Git repo and add `.gitignore`
- [ ] TASK-003: Link Bootstrap 5.3.8 and Inter (Google Fonts + jsDelivr CDN, correct load order)
- [ ] TASK-004: Create `assets/css/jnd.css` (brand tokens, type scale, gradients, button and card overrides)
- [ ] TASK-005: Create base HTML template (meta tags, fonts, CDN links, skip link)

## Phase 2: Shared Layout

- [ ] TASK-006: Build header with logo, nav and Services dropdown
- [ ] TASK-007: Build mobile menu (hamburger toggle, focus handling, close on link click)
- [ ] TASK-008: Build footer (company info, service links, contact, copyright year via JS)
- [ ] TASK-009: Create shared button, card and section components (documented in DESIGN.md)
- [ ] TASK-010: Load header and footer via JS partials so they are edited in one place (needs a web server — works on GitHub Pages, not `file://`)

## Phase 3: Home Page

- [ ] TASK-011: Hero section with tagline and call-to-action buttons
- [ ] TASK-012: Services overview grid (10 services, linked to detail pages)
- [ ] TASK-013: Why choose JND section (Reliable Support, Professional Service)
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
