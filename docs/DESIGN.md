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

### Tailwind config

```js
theme: {
  extend: {
    colors: {
      primary: '#1455A0',
      secondary: '#123B73',
      accent: '#50B8E8',
      highlight: '#62D5E8',
      midblue: '#2E83C5',
      surface: '#F2F5F8',
      ink: '#080B10',
    },
    backgroundImage: {
      'grad-primary': 'linear-gradient(135deg, #123B73, #1455A0)',
      'grad-accent': 'linear-gradient(135deg, #1455A0, #50B8E8)',
      'grad-highlight': 'linear-gradient(135deg, #2E83C5, #62D5E8)',
      'grad-modern': 'linear-gradient(135deg, #123B73, #62D5E8)',
    },
    fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
  },
}
```

## Layout

- Max content width: 1200px, centered
- Side padding: 16px mobile, 24px tablet, 32px desktop
- Section spacing: 64px mobile, 96px desktop
- Grid: 1 column mobile, 2 tablet, 3 desktop for service cards
- Breakpoints: Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280)
- Alternate section backgrounds between White and Surface

## Buttons

All buttons: 8px radius, 12px 24px padding, 600 weight, min height 44px, visible focus ring (`#50B8E8`, 2px offset).

- **Primary**: Accent gradient background, white text. Hover: Primary solid with slight lift.
- **Secondary**: White background, 2px Primary border, Primary text. Hover: Surface background.
- **Ghost / on dark**: Transparent, white border and text. Hover: white background, Secondary text.
- **Destructive** (forms only): `#C62828` background, white text.
- Disabled: 50% opacity, no hover effect.

## Cards

- Border radius: **12px**
- Background: White on Surface sections; Surface on White sections
- Border: 1px `#E3E8EE`
- Shadow: soft (`0 2px 8px rgba(18,59,115,0.08)`); on hover `0 8px 24px rgba(18,59,115,0.14)` with 2px upward lift
- Padding: 24px
- Service cards: icon in a 48px rounded square (Accent gradient), title, 2-line description, "Learn more →" link

## Header and Footer

- Header: sticky, white with subtle bottom shadow, logo left, nav right, "Get a Quote" Primary button
- Services nav item opens a dropdown listing all 10 sub-services
- Mobile: hamburger menu, full-width slide-down panel
- Footer: Primary gradient background, white text, 4 columns desktop (about, services, company, contact), stacked on mobile

## Icons and Imagery

- Icon set: Lucide or Heroicons (outline, 1.5px stroke), one set only
- Photos: real office, server room and network hardware shots; rounded 12px, lazy loaded, always with alt text
- Avoid generic stock clichés; prefer simple abstract network/diagram illustrations in brand colors

## Motion

- Duration 150-300ms, ease-out
- Scroll reveal: fade up 16px, once per element
- Must respect `prefers-reduced-motion` (disable all non-essential animation)

## UX Requirements

- Fully responsive from 360px up, no horizontal scroll
- Loading states (form submit spinner, button disabled while sending)
- Empty states (service search with no results: message and "clear filter" action)
- Error states (inline form errors, form failure banner, custom 404 page)
- Accessible forms: visible labels, `aria-describedby` for errors, clear focus order
- Color contrast WCAG AA minimum (white on Primary and Secondary passes; avoid white text on Highlight alone)
- Skip-to-content link, semantic landmarks, keyboard navigable dropdown and menu
- Touch targets at least 44x44px

## Consistency Rules

1. Same card radius, shadow and padding on every page
2. Same button styles everywhere; no one-off buttons
3. One H1 per page, headings in order
4. All spacing from the Tailwind scale (4px steps)
5. New components get documented here before reuse
