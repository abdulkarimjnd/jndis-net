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
| Accent | `#50B8E8` | Icon tiles, borders, decoration — **never text on white** |
| Highlight | `#62D5E8` | Badges and small decorative emphasis — never behind text |
| Mid Blue | `#2878B8` | Hover states, secondary links, text on white, light end of the Accent gradient |
| Background | `#FFFFFF` | Page background |
| Text | `#080B10` | Body text |
| Surface | `#F2F5F8` | Alternate sections, card backgrounds |

**Mid Blue was darkened from `#2E83C5` to `#2878B8`.** At `#2E83C5` it reaches only **4.06:1** on white, which failed AA for three things that depend on it: link hover, the `.text-midblue` utility, and the header's "Integrated Solutions" line — which is on every page. At `#2878B8` it clears AA on white at **4.70:1**, so one colour now serves as text, as hover colour, and as the light end of the Accent gradient.

### Gradients

- Primary: `#123B73 → #1455A0` (header, footer)
- Modern: `#123B73 → #1455A0 65% → #2878B8` (hero, CTA banners)
- Accent: `#1455A0 → #2878B8` (buttons, icon tiles)
- Highlight: `#2878B8 → #62D5E8` (badges — **never behind text**)

Use direction 135deg. Text on gradients is white. Do not place gradients behind long body text.

**Why Modern does not end in Highlight.** Highlight `#62D5E8` is far too light to carry white text: measured against it, white reaches only **1.72:1** where AA needs 4.5:1 — at the point in a hero where the text actually sits it is **2.34:1**. A band that holds text therefore has to stay in the dark range. Modern sweeps navy → Primary → Mid Blue instead, holding **5.67:1 or better** everywhere text can reach. Highlight stays for badges and small decorative emphasis, where it is not the background of a text block.

**Accent gradients end at Mid Blue `#2878B8`, not Accent `#50B8E8`, for the same reason.** The gradient behind a primary button runs underneath its own label, so its light end has to carry white text: at `#50B8E8` the far end of the label measured **2.55:1**. Capping it at `#2878B8` lifts the worst case inside the label to **4.94:1**. The same cap fixes the card icon tile, where the white glyph reached **2.93:1** against the 3:1 a meaningful graphic needs. Accent `#50B8E8` stays for borders and decoration, where it is not behind text.

**Headings inside a text-bearing band go white automatically.** The band sets `--bs-heading-color: #fff`, which every heading inside inherits. Putting `.text-white` on the band does *not* work — Bootstrap declares `color` directly on `h1`–`h6`, and a direct declaration always beats an inherited value. `.bg-grad-primary`, `.bg-grad-accent` and `.bg-grad-modern` all whiten headings; `.bg-grad-highlight` deliberately does not, because it is too light to carry white text at all.

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
  --jnd-midblue: #2878B8;
  --jnd-surface: #F2F5F8;
  --jnd-ink: #080B10;
  --jnd-border: #E3E8EE;

  /* Bootstrap variable overrides */
  --bs-body-font-family: 'Inter', system-ui, sans-serif;
  --bs-body-color: #080B10;
  --bs-body-bg: #FFFFFF;
  --bs-heading-color: #123B73;
  --bs-primary: #1455A0;
  --bs-primary-rgb: 20, 85, 160;
  --bs-link-color: #1455A0;
  --bs-link-hover-color: #2878B8;
  --bs-border-color: #E3E8EE;
  --bs-border-radius: 12px;
  --bs-border-radius-sm: 8px;
}

/* Container caps at 1200px, fluid below it */
@media (min-width: 1200px) {
  .container { max-width: 1200px; }
}

/* Type scale: mobile → desktop via clamp. Heading colour comes from
   --bs-heading-color on :root, not from a rule here. */
h1, .h1 { font-weight: 700; font-size: clamp(2.25rem, 5vw, 3.5rem); }   /* 36 → 56px */
h2, .h2 { font-weight: 600; font-size: clamp(1.75rem, 3.5vw, 2.5rem); } /* 28 → 40px */
h3, .h3 { font-weight: 600; font-size: clamp(1.25rem, 2vw, 1.5rem); }   /* 20 → 24px */
p { line-height: 1.6; }
small, .small { font-size: 14px; }

/* Surface + gradient utilities */
.bg-surface        { background-color: var(--jnd-surface); }
.bg-grad-primary   { background-image: linear-gradient(135deg, #123B73, #1455A0); }
.bg-grad-accent    { background-image: linear-gradient(135deg, #1455A0, #2878B8); }
.bg-grad-highlight { background-image: linear-gradient(135deg, #2878B8, #62D5E8); }
.bg-grad-modern    { background-image: linear-gradient(135deg, #123B73 0%, #1455A0 65%, #2878B8 100%); }

/* Bands that carry text whiten their headings via the inherited token */
.bg-grad-primary,
.bg-grad-accent,
.bg-grad-modern    { --bs-heading-color: #fff; }

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
- Side padding: 16px each side (`--bs-gutter-x: 2rem` on `.container` and `.row`). Above the 1200px cap, centering margins provide the extra breathing room.
- Section spacing: 64px mobile, 96px desktop, via `.section` (`padding-block`). Put a `.container` inside the section, never the reverse
- Grid: 1 column mobile, 2 tablet, 3 desktop for service cards (`.col-12 .col-md-6 .col-lg-4`)
- Breakpoints: Bootstrap defaults (`sm` ≥576, `md` ≥768, `lg` ≥992, `xl` ≥1200, `xxl` ≥1400)
- Alternate section backgrounds between White and Surface — `.section` plus `.bg-surface`

## Buttons

All buttons: 8px radius, 12px 24px padding, 600 weight, min height 44px, and the shared two-tone focus ring (see UX Requirements).

- **Primary**: Primary-to-Mid-Blue gradient background, white text. Hover: Primary solid with slight lift. On a brand-gradient band it also takes a white border — see the note below.
- **Secondary**: White background, 2px Primary border, Primary text. Hover: Surface background.
- **Ghost / on dark**: Transparent, white border and text. Hover: white background, Secondary text.
- **Destructive** (forms only): `#C62828` background, white text.
- Disabled: 50% opacity, no hover effect.

Built on Bootstrap `.btn`, restyled in `jnd.css` §5. Variants are themed through Bootstrap's `--bs-btn-*` variables rather than `!important` overrides:

- `.btn` sets `--bs-btn-border-width: 2px` and `--bs-btn-disabled-opacity: .5`, so borderless and bordered variants render at identical height and dim consistently
- `.btn-primary` keeps its gradient in `background-image` and removes it on hover, letting the solid Primary `background-color` show through
- `.btn-outline-primary` overrides Bootstrap's fill-on-hover so it goes white → Surface with Primary text
- `.btn-danger` sets the full hover/active ramp, otherwise it falls back to Bootstrap's stock red on interaction
- Focus rings come from one shared `a:focus-visible, .btn:focus-visible` rule

Class mapping:

| Variant | Bootstrap class |
|---|---|
| Primary | `.btn.btn-primary` (accent gradient, overridden) |
| Secondary | `.btn.btn-outline-primary` |
| Ghost / on dark | `.btn.btn-outline-light` |
| Destructive | `.btn.btn-danger` |

**The primary button takes a white border on a brand-gradient band.** Its fill is painted from the same two blues as the outer part of `.bg-grad-modern`, running the same way, so on the hero and the CTA banner its edge measures as little as **1.59:1** against the band it sits on. The label stays readable at 5.88:1 — it is the *shape* that disappears. WCAG 1.4.11 asks **3:1** of a UI component's boundary. White clears 7.98:1 against the band and 7.40:1 against the button, so `jnd.css` §5 adds the border to the gradient bands. Nothing else about the button changes, and the rule is scoped there because that is the only place the button's colours can coincide with its background.

## Cards

- Border radius: **12px**
- Background: White on Surface sections; Surface on White sections
- Border: 1px `#E3E8EE`
- Shadow: soft (`0 2px 8px rgba(18,59,115,0.08)`); on hover `0 8px 24px rgba(18,59,115,0.14)` with 2px upward lift
- Padding: 24px
- Service cards: icon in a 48px rounded square (Accent gradient), title, 2-line description, "Learn more →" link

Restyled in `jnd.css` §6: 12px radius, 1px border, brand-tinted shadow that deepens with a 2px hover lift, and 24px `.card-body` padding.

**Cards in a grid need `.h-100`,** otherwise each card sizes to its own content and a row looks ragged. `mt-auto` on the link pins "Learn more →" to the bottom.

```html
<div class="row g-4">
  <div class="col-12 col-md-6 col-lg-4">
    <div class="card h-100">
      <div class="card-body d-flex flex-column">
        <div class="card-icon mb-3" aria-hidden="true">
          <svg class="icon" width="24" height="24" viewBox="0 0 24 24"><path d="…"/></svg>
        </div>
        <h3 class="mb-2">Service name</h3>
        <p class="mb-3">Two lines of description.</p>
        <a class="card-link mt-auto" href="services/….html"
           aria-label="Learn more about Service name">Learn more &rarr;</a>
      </div>
    </div>
  </div>
</div>
```

**Every card link needs an `aria-label`.** "Learn more" repeats once per card, so a screen reader listing the page's links announces the same phrase ten times with nothing to tell them apart. The label begins with the visible wording, so Label-in-Name (WCAG 2.5.3) still holds.

Card body copy is short by design — roughly two lines at `col-lg-4`. The grid is `.row.g-4` with `col-12 / col-md-6 / col-lg-4`, so it is one column at 360px, two at 768px and three at 1280px.

On Surface sections cards are White by default; on White sections add `.bg-surface` to the card to invert them.

## Feature list

Icon-and-text columns, used for the "Why choose" band. **No card chrome, deliberately** — placed straight after the services grid, cards would read as a second set of services.

```html
<div class="row g-4">
  <div class="col-12 col-md-6 col-lg-3">
    <svg class="icon text-primary d-block mb-3" width="32" height="32" viewBox="0 0 24 24" aria-hidden="true"><path d="…"/></svg>
    <h3 class="mb-2">Feature name</h3>
    <p class="mb-0">Two or three lines of description.</p>
  </div>
</div>
```

- **Adds no new CSS.** It is `.section`, `.container`, the Bootstrap grid, `.icon` from `jnd.css` §10, and `.text-primary` for the icon colour.
- The icon is **32px**, larger than the 24px inside `.card-icon`, because it stands alone rather than sitting in a tile.
- Icon colour is **Primary `#1455A0`, not Accent.** Accent `#50B8E8` reaches only 2.24:1 on white, so an accent icon would be almost invisible.
- **`d-block` on the `<svg>` matters.** Without it the icon sits on a text baseline and leaves a stray gap above the heading.
- **Four items at `col-lg-3`**, so the row divides evenly. Three would leave an empty column at desktop.

## Hero

The home page hero is **one band built from existing components — no hero-specific CSS**:

```html
<section class="section bg-grad-modern text-white">
  <div class="container">
    <div class="row">
      <div class="col-12 col-lg-8">
        <h1 class="mb-3">…</h1>
        <p class="lead mb-4">…</p>
        <div class="d-flex flex-wrap gap-3">
          <a class="btn btn-primary" href="contact.html">Get a Quote</a>
          <a class="btn btn-outline-light" href="services/index.html">Explore Our Services</a>
        </div>
      </div>
    </div>
  </div>
</section>
```

- `.section` supplies 64px / 96px of vertical rhythm, `.container` the width and padding.
- Text is capped at `col-lg-8` — 800px inside the 1200px container — so the headline holds at two lines and the lead stays readable.
- The buttons wrap because of `flex-wrap` + `gap-3`, so they stack at 360px with no extra CSS.
- `.text-white` is there for the paragraph; the `<h1>` whitens itself through the band's `--bs-heading-color`.
- The hero is one of only **two** places the brand gradient appears (the other is the CTA banner, TASK-014). It is not repeated on every band.

## Call to action

The closing band on the home page — the second half of that pair:

```html
<section class="section bg-grad-modern text-white">
  <div class="container">
    <div class="row justify-content-center text-center">
      <div class="col-12 col-md-10 col-lg-8" data-reveal>
        <h2 class="mb-3">…</h2>
        <p class="lead mb-4">…</p>
        <a class="btn btn-primary" href="contact.html">Get a Quote</a>
      </div>
    </div>
  </div>
</section>
```

- **Centred, where the hero is left aligned.** Repeating the hero's `col-lg-8` block at the foot of the page made the bottom look like the top again.
- **`justify-content-center` centres the column; `text-center` centres the text inside it.** Centring alone would leave the text block left-aligned within a centred column.
- **`col-md-10`** keeps the lead to a readable line length once it is centred.
- **One button, not the hero's two.** The visitor has just scrolled past all ten services, so a second "explore our services" link sends them back over ground they have already covered; the footer directly below carries the secondary paths anyway.
- Adds no CSS.

## Header and Footer

- Header: sticky, white with subtle bottom shadow, logo left, nav right, "Get a Quote" Primary button
- Services nav item opens a dropdown listing all 10 sub-services
- Mobile: hamburger menu, full-width slide-down panel
- Footer: Primary gradient background, white text, 4 columns desktop (about, services, company, contact), stacked on mobile

Built on Bootstrap components — no custom JS required for any of this:

- Header: `<header class="site-header sticky-top">` wrapping `.navbar.navbar-expand-lg` inside `<nav aria-label="Main">`. Within `.navbar`, all colours come from Bootstrap's `--bs-navbar-*` variables (see `jnd.css` §7)
- Services nav item: `.nav-item.dropdown` + `.dropdown-toggle` / `.dropdown-menu`
- Mobile: `.navbar-toggler` + `.collapse.navbar-collapse` (full-width panel)
- Footer: `.bg-grad-primary.text-white`, 4 columns via `row` / `col-12 col-md-6 col-lg-3`

Header classes defined in `jnd.css` §7:

| Class | Purpose |
|---|---|
| `.site-header` | White background + brand-tinted bottom shadow (`rgba(18,59,115,.08)`) instead of Bootstrap's grey `.shadow-sm` |
| `.site-brand-name` | Wordmark "JND" — 1.25rem (H3), 700, Secondary |
| `.site-brand-tagline` | Wordmark "Integrated Solutions" — .875rem (Small), 500, Mid Blue |
| `.nav-cta` | The "Get a Quote" item; `margin-left: 1rem` at ≥992px only, so it isn't indented when the menu stacks |

Two deliberate header decisions:

1. The Services toggle is an `<a href="services/index.html">`, not a `<button>`. If the CDN JavaScript ever fails, the click still navigates to the services hub rather than silently doing nothing.
2. Because JavaScript suppresses that navigation when it *is* working, the dropdown ends with a divider and an **"All services →"** item — the keyboard route to the hub page.
3. **Focus stays on the hamburger when the panel opens.** A navbar collapse is a disclosure pattern, not a dialog. See `assets/js/nav.js` — it closes the panel on link click, closes it on Escape (returning focus to the toggle), and drops the open state when the viewport crosses into desktop. Bootstrap handles the toggling itself; `nav.js` only adds those three behaviours.

### Footer

`.site-footer` in `jnd.css` §8, sitting on `.bg-grad-primary.text-white`. Same service list, order and filenames as the header dropdown.

| Class | Purpose |
|---|---|
| `.site-footer` | Section padding — 64px mobile, 96px desktop |
| `.site-footer-title` | Column heading (`<h2>`) — .875rem, 600, uppercase, letter-spacing .05em, white |
| `.site-footer-meta` | Bottom bar text at 85% white |
| `.site-placeholder` | **TEMPORARY** — italic with a dashed underline, flags contact details not yet supplied. Delete at TASK-042 |

Contrast decisions, all measured rather than assumed:

- **Column titles are white, not Highlight.** `#62D5E8` reaches only **4.30:1** against the lighter end of the Primary gradient — below AA's 4.5:1 at this text size. White measures **7.40:1** there (11.06:1 at the darker end), so hierarchy comes from size, weight and uppercase instead of colour.
- **Links and meta text use 85% white (5.86:1)**, not Bootstrap's `.text-white-50` which manages only **3.08:1** and would fail AA.
- **Footer links must be inverted explicitly.** Bootstrap's `--bs-link-color` (`#1455A0`) is nearly invisible against this gradient.

Column headings are real `<h2>` elements, not styled paragraphs, so screen reader users can navigate the footer by heading.

## Shared markup (header and footer)

The header and footer are **duplicated into every page as static markup**, deliberately *not* injected by JavaScript.

Rationale:

- Navigation belongs in the HTML. That is how search engines index it directly, and it keeps working when JavaScript is blocked, fails, or a CDN is unreachable.
- JavaScript partials would also break `file://` preview (browsers block `fetch` there) and cause layout shift as the header appeared after first paint.

The cost is duplication, so both blocks are fenced in every page:

```html
<!-- BEGIN shared header -->   ...   <!-- END shared header -->
<!-- BEGIN shared footer -->   ...   <!-- END shared footer -->
```

**The only permitted per-page difference is the active nav link** — `class="active"` plus `aria-current="page"`. Everything else inside a fence must stay byte-identical.

**Order matters, and the two fences do not travel together.** The header block goes right after `<body>`; the footer block goes right before `</body>`, i.e. *after* `</main>`:

```html
<body>
  <!-- BEGIN shared header --> … <!-- END shared header -->

  <main id="main" tabindex="-1"> … </main>

  <!-- BEGIN shared footer --> … <!-- END shared footer -->
</body>
```

A footer placed before `<main>` is valid, drift-free, and renders the footer **above the page content** — which is what it did until TASK-013, because the two fences had been kept together for convenience. `check-shared.js` therefore verifies landmark order as well as text; identical bytes cannot catch a misplacement.

**When the nav or footer changes:** edit it in one page, then run

```
node tools/check-shared.js
```

Exit 0 means every page matches; exit 1 lists the drifted pages and quotes where they diverge. It ignores the permitted differences (active link, copyright year), so a failure is always a real one.

## Icons and Imagery

- Icon set: **Lucide** (https://lucide.dev, ISC licence) — outline, 1.5px stroke, one set only for the whole site
- **Inlined into the markup, not loaded from a CDN.** Each icon is an `<svg class="icon" viewBox="0 0 24 24">` carrying only its path data:
  - No third-party script, so nothing fails at runtime and no tile sits empty while an icon font or sprite loads.
  - Roughly 3KB of HTML for the home page's ten icons — smaller than the CDN script it replaces, and one less origin to trust.
  - `.icon` in `jnd.css` §10 holds the presentation (`fill: none`, `stroke: currentColor`, 1.5px, round caps), so each icon is a single line of markup.
  - Decorative icons get `aria-hidden="true"` on their wrapper; the adjacent text carries the meaning.
  - To add one: copy the path data from `https://lucide.dev` and set the size with `width`/`height`.
- Photos: real office, server room and network hardware shots; rounded 12px, lazy loaded, always with alt text
- Avoid generic stock clichés; prefer simple abstract network/diagram illustrations in brand colors

## Motion

- Duration 150-300ms, ease-out
- Scroll reveal: fade up 16px, once per element, 300ms
- Must respect `prefers-reduced-motion` (disable all non-essential animation)
- Scroll reveal via one shared `IntersectionObserver` in `assets/js/reveal.js`; do not re-animate Bootstrap's own dropdown/collapse transitions

### How the reveal is wired

Mark a wrapper with `data-reveal`. `reveal.js` adds `.is-visible` the first time that element intersects the viewport, then unobserves it.

- **`data-reveal` goes on the `.col` wrapper, never on a `.card`.** A card already uses `transform` for its hover lift; putting the reveal transform on the same element would race with it.
- **The hidden state is gated on `.js-reveal` on `<html>`**, set by a small inline script in `<head>`. With JavaScript unavailable the class is never set, so nothing is ever hidden. A reveal that fails to run must degrade to a visible page, never a blank one.
- **That script runs before first paint.** Setting the class from `reveal.js` instead would let the page paint normally and then hide itself, which flashes.
- **It arms a 3s failsafe timer** that removes the class. If `reveal.js` 404s, throws, or is blocked, the animation is lost and the content is not.
- **Reduced motion removes the effect entirely** rather than cutting it short: `reveal.js` drops the class and shows everything at once. `jnd.css` §11 also asserts `opacity: 1` under reduced motion as a second guard.
- **`focusin` reveals immediately**, so tabbing to a link inside an unrevealed block never places focus on something invisible.

## UX Requirements

- Fully responsive from 360px up, no horizontal scroll
- Loading states (form submit spinner, button disabled while sending)
- Empty states (service search with no results: message and "clear filter" action)
- Error states (inline form errors, form failure banner, custom 404 page)
- Accessible forms: visible labels, `aria-describedby` for errors, clear focus order
- Use Bootstrap validation (`.was-validated`, `.invalid-feedback`) driven by our own JS; keep `novalidate` on the form so messages are consistent across browsers
- Color contrast WCAG AA minimum, measured rather than assumed. White clears AA on Primary (**7.40:1**), Secondary (**11.06:1**) and the Modern band (**5.67:1** at the lightest point text reaches). White on Highlight (**1.72:1**) and white on Accent (**2.24:1**) never do, so neither is ever a text background.
- The focus indicator is **two-tone**: a 2px navy outline with a 2px white ring filling the offset gap. A single Accent ring measured 2.24:1 on white and 2.05:1 on Surface — both below the 3:1 WCAG 1.4.11 asks of a focus indicator. The navy outline carries light bands; the white ring carries the dark hero and footer bands.
- **Non-text contrast is measured too, not just text.** The primary button's boundary came out at **1.59:1** against the gradient bands, because the button and the band are painted from the same two blues; on a brand-gradient band it now carries a white border (7.98:1 against the band). WCAG 1.4.11 wants 3:1 for UI component boundaries.
- Skip-to-content link, semantic landmarks, keyboard navigable dropdown and menu
- Skip link is `.skip-link` in `jnd.css` §7: off-screen until focused, then pinned to the top-left in Secondary with white text. It targets `#main`, which carries `tabindex="-1"` so focus genuinely moves rather than only scrolling
- Touch targets at least 44x44px

## Consistency Rules

1. Same card radius, shadow and padding on every page
2. Same button styles everywhere; no one-off buttons
3. One H1 per page, headings in order
4. All spacing from the Bootstrap spacing scale (4px steps)
5. New components get documented here before reuse

## Component index

Every shared component, where it is styled, and the class to reach for. If something is needed that is not listed here, it gets designed and documented first — then reused.

| Component | Class | Styles |
|---|---|---|
| Section band | `.section` | `jnd.css` §3 |
| Section, alternate background | `.section.bg-surface` | `jnd.css` §3, §4 |
| Container | `.container` | `jnd.css` §3 |
| Button — primary | `.btn.btn-primary` | `jnd.css` §5 |
| Button — secondary | `.btn.btn-outline-primary` | `jnd.css` §5 |
| Button — ghost on dark | `.btn.btn-outline-light` | `jnd.css` §5 |
| Button — destructive | `.btn.btn-danger` | `jnd.css` §5 |
| Card | `.card` + `.card-body` | `jnd.css` §6 |
| Card icon tile | `.card-icon` | `jnd.css` §6 |
| Card "Learn more" link | `.card-link` | `jnd.css` §6 |
| Inline icon | `.icon` | `jnd.css` §10 |
| Icon, 32px feature list | `.icon.text-primary.d-block` | `jnd.css` §10 |
| Service card grid | `.row.g-4` of `.card.h-100` | `jnd.css` §6 |
| Hero band | `.section.bg-grad-modern.text-white` | `jnd.css` §3, §4 |
| Call to action band | `.section.bg-grad-modern.text-white`, centred | `jnd.css` §3, §4 |
| Scroll reveal wrapper | `[data-reveal]` | `jnd.css` §11 |
| Header | `header.site-header` | `jnd.css` §7 |
| Footer | `footer.site-footer` | `jnd.css` §8 |
| Skip link | `.skip-link` | `jnd.css` §9 |
| Placeholder text — **temporary** | `.site-placeholder` | `jnd.css` §8 |

Colour and gradient helpers, all in `jnd.css` §4: `.bg-grad-primary`, `.bg-grad-accent`, `.bg-grad-highlight`, `.bg-grad-modern`, `.bg-surface`, `.text-midblue`. There is deliberately **no** `.text-accent` — Accent cannot carry text on white.

Behavioural JavaScript, in `assets/js/`: `nav.js` (mobile menu), `footer.js` (copyright year).
