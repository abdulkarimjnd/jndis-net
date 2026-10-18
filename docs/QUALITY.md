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
node tools/check-a11y.js          # TASK-037  (added below)
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
