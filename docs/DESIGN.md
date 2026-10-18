# Design System: JND Integrated Solutions

DESIGN.md = how the site should look and feel. Every page and component follows this file.

## Style

Modern, clean, professional. Trustworthy and technical without feeling cold. Generous white space, blue-led palette, subtle gradients used for emphasis only.

## Typography

- Font: **Inter** (fallback: system-ui, sans-serif)
- Weights: 400 body, 500 labels, 600 headings, 700 hero
- Scale (mobile → desktop):
  - H1: 36px → 56px
  - H2: 28px → 40px
  - H3: 20px → 24px
  - Body: 16px, line-height 1.6
  - Small: 14px
- Headings use Secondary (`#123B73`); body uses Text (`#080B10`)

## Colors

| Role | Hex | Use |
|---|---|---|
| Primary | `#1455A0` | Buttons, links, key UI |
| Secondary | `#123B73` | Headings, header, footer, dark sections |
| Accent | `#50B8E8` | Icons, highlights, hover accents |
| Highlight | `#62D5E8` | Small emphasis, badges, gradient ends |
| Mid Blue | `#2E83C5` | Hover states, secondary links |
| Background | `#FFFFFF` | Page background |
| Text | `#080B10` | Body text |
| Surface | `#F2F5F8` | Alternate sections, card backgrounds |

### Gradients

- Primary: `#123B73 → #1455A0` (header, footer)
- Accent: `#1455A0 → #50B8E8` (primary CTAs, feature cards)
- Highlight: `#2E83C5 → #62D5E8` (badges, small accents)
- Modern: `#123B73 → #62D5E8` (hero, CTA banners)

Use direction 135deg. Text on gradients is white. Do not place gradients behind long body text.

### Bootstrap theme

**Bootstrap 5.3.8 via jsDelivr CDN, plus one local stylesheet (`assets/css/jnd.css`) holding the brand tokens and component overrides. There is no build step — no npm, no compiler, no `package.json`.** Edit a file, push, done.

Load order matters — Bootstrap first, `jnd.css` last so overrides win:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="assets/css/jnd.css" rel="stylesheet">
...
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" defer></script>
```

`assets/css/jnd.css` — tokens, container, type scale and gradient utilities:

```css
:root {
  /* JND palette */
  --jnd-primary: #1455A0;
  --jnd-secondary: #123B73;
  --jnd-accent: #50B8E8;
  --jnd-highlight: #62D5E8;
  --jnd-midblue: #2E83C5;
  --jnd-surface: #F2F5F8;
  --jnd-ink: #080B10;
  --jnd-border: #E3E8EE;

  /* Bootstrap variable overrides */
  --bs-body-font-family: 'Inter', system-ui, sans-serif;
  --bs-body-color: #080B10;
  --bs-body-bg: #FFFFFF;
  --bs-primary: #1455A0;
  --bs-primary-rgb: 20, 85, 160;
  --bs-link-color: #1455A0;
  --bs-link-hover-color: #2E83C5;
  --bs-border-color: #E3E8EE;
  --bs-border-radius: 12px;
  --bs-border-radius-sm: 8px;
}

/* Container caps at 1200px, fluid below it */
@media (min-width: 1200px) {
  .container { max-width: 1200px; }
}

/* Type scale: mobile → desktop via clamp */
h1, .h1, h2, .h2, h3, .h3 { color: var(--jnd-secondary); }
h1, .h1 { font-weight: 700; font-size: clamp(2.25rem, 5vw, 3.5rem); }   /* 36 → 56px */
h2, .h2 { font-weight: 600; font-size: clamp(1.75rem, 3.5vw, 2.5rem); } /* 28 → 40px */
h3, .h3 { font-weight: 600; font-size: clamp(1.25rem, 2vw, 1.5rem); }   /* 20 → 24px */
p { line-height: 1.6; }
small, .small { font-size: 14px; }

/* Surface + gradient utilities */
.bg-surface        { background-color: var(--jnd-surface); }
.bg-grad-primary   { background-image: linear-gradient(135deg, #123B73, #1455A0); }
.bg-grad-accent    { background-image: linear-gradient(135deg, #1455A0, #50B8E8); }
.bg-grad-highlight { background-image: linear-gradient(135deg, #2E83C5, #62D5E8); }
.bg-grad-modern    { background-image: linear-gradient(135deg, #123B73, #62D5E8); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Use the semantic `.bg-grad-*` utilities rather than Bootstrap's `.bg-primary` for brand fills.

## Layout

- Max content width: 1200px, centered
- Side padding: 16px mobile, 24px tablet, 32px desktop
- Section spacing: 64px mobile, 96px desktop
- Grid: 1 column mobile, 2 tablet, 3 desktop for service cards (`.col-12 .col-md-6 .col-lg-4`)
- Breakpoints: Bootstrap defaults (`sm` ≥576, `md` ≥768, `lg` ≥992, `xl` ≥1200, `xxl` ≥1400)
- Alternate section backgrounds between White and Surface

## Buttons

All buttons: 8px radius, 12px 24px padding, 600 weight, min height 44px, visible focus ring (`#50B8E8`, 2px offset).

- **Primary**: Accent gradient background, white text. Hover: Primary solid with slight lift.
- **Secondary**: White background, 2px Primary border, Primary text. Hover: Surface background.
- **Ghost / on dark**: Transparent, white border and text. Hover: white background, Secondary text.
- **Destructive** (forms only): `#C62828` background, white text.
- Disabled: 50% opacity, no hover effect.

Built on Bootstrap `.btn`, restyled in `jnd.css`:

```css
.btn { border-radius: 8px; padding: 12px 24px; font-weight: 600; min-height: 44px; transition: all .2s ease-out; }
.btn:focus-visible { outline: 2px solid #50B8E8; outline-offset: 2px; box-shadow: none; }
.btn-primary { background-image: linear-gradient(135deg, #1455A0, #50B8E8); border: 0; }
.btn-primary:hover { background-image: none; background-color: #1455A0; transform: translateY(-1px); }
.btn-outline-primary { border-width: 2px; }
.btn-outline-primary:hover { background-color: #F2F5F8; color: #1455A0; }
.btn-danger { --bs-btn-bg: #C62828; --bs-btn-border-color: #C62828; }
.btn:disabled, .btn.disabled { opacity: .5; }
```

Class mapping:

| Variant | Bootstrap class |
|---|---|
| Primary | `.btn.btn-primary` (accent gradient, overridden) |
| Secondary | `.btn.btn-outline-primary` |
| Ghost / on dark | `.btn.btn-outline-light` |
| Destructive | `.btn.btn-danger` |

## Cards

- Border radius: **12px**
- Background: White on Surface sections; Surface on White sections
- Border: 1px `#E3E8EE`
- Shadow: soft (`0 2px 8px rgba(18,59,115,0.08)`); on hover `0 8px 24px rgba(18,59,115,0.14)` with 2px upward lift
- Padding: 24px
- Service cards: icon in a 48px rounded square (Accent gradient), title, 2-line description, "Learn more →" link

Built on Bootstrap `.card` / `.card-body` inside `.row` + `.col-*` grids, restyled in `jnd.css`:

```css
.card {
  border: 1px solid var(--jnd-border);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(18,59,115,0.08);
  transition: box-shadow .2s ease-out, transform .2s ease-out;
}
.card:hover { box-shadow: 0 8px 24px rgba(18,59,115,0.14); transform: translateY(-2px); }
.card-body { padding: 24px; }
.card-icon { width: 48px; height: 48px; border-radius: 12px; display: grid; place-items: center; background-image: linear-gradient(135deg, #1455A0, #50B8E8); color: #fff; }
```

On Surface sections cards are White; on White sections cards are Surface (`bg-body` / `.bg-surface`).

## Header and Footer

- Header: sticky, white with subtle bottom shadow, logo left, nav right, "Get a Quote" Primary button
- Services nav item opens a dropdown listing all 10 sub-services
- Mobile: hamburger menu, full-width slide-down panel
- Footer: Primary gradient background, white text, 4 columns desktop (about, services, company, contact), stacked on mobile

Built on Bootstrap components — no custom JS required for any of this:

- Header: `.navbar.navbar-expand-lg.sticky-top.bg-white` with a `shadow-sm`
- Services nav item: `.nav-item.dropdown` + `.dropdown-toggle` / `.dropdown-menu`
- Mobile: `.navbar-toggler` + `.collapse.navbar-collapse` (full-width panel)
- Footer: `.bg-grad-primary.text-white`, 4 columns via `row` / `col-12 col-md-6 col-lg-3`

## Icons and Imagery

- Icon set: **Lucide** (default), Heroicons or Bootstrap Icons — outline, 1.5px stroke, one set only for the whole site
- Deliver by CDN, no download step:
  - Lucide: `https://unpkg.com/lucide@1.59.0/dist/umd/lucide.js` + `lucide.createIcons()` on load
  - Bootstrap Icons (alternative): `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.2/font/bootstrap-icons.min.css`
- Photos: real office, server room and network hardware shots; rounded 12px, lazy loaded, always with alt text
- Avoid generic stock clichés; prefer simple abstract network/diagram illustrations in brand colors

## Motion

- Duration 150-300ms, ease-out
- Scroll reveal: fade up 16px, once per element
- Must respect `prefers-reduced-motion` (disable all non-essential animation)
- Scroll reveal via one shared `IntersectionObserver` in `assets/js/reveal.js`; do not re-animate Bootstrap's own dropdown/collapse transitions

## UX Requirements

- Fully responsive from 360px up, no horizontal scroll
- Loading states (form submit spinner, button disabled while sending)
- Empty states (service search with no results: message and "clear filter" action)
- Error states (inline form errors, form failure banner, custom 404 page)
- Accessible forms: visible labels, `aria-describedby` for errors, clear focus order
- Use Bootstrap validation (`.was-validated`, `.invalid-feedback`) driven by our own JS; keep `novalidate` on the form so messages are consistent across browsers
- Color contrast WCAG AA minimum (white on Primary and Secondary passes; avoid white text on Highlight alone)
- Skip-to-content link, semantic landmarks, keyboard navigable dropdown and menu
- Touch targets at least 44x44px

## Consistency Rules

1. Same card radius, shadow and padding on every page
2. Same button styles everywhere; no one-off buttons
3. One H1 per page, headings in order
4. All spacing from the Bootstrap spacing scale (4px steps)
5. New components get documented here before reuse
