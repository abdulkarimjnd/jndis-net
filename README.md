# jndis-net

Website for **JND Integrated Solutions** — a static site built with HTML, Bootstrap 5 (via CDN) and vanilla JavaScript.

There is no build step and no dependencies. Edit a file, push, done.

## Previewing

Just open `index.html` in a browser — no server needed. If you would rather serve the folder over HTTP:

```
npx serve .
```

## Structure

```
index.html                Home page                          (built)
assets/css/jnd.css        Brand layer — loads after Bootstrap, overrides it
assets/js/nav.js          Mobile menu behaviour
assets/js/footer.js       Copyright year
assets/js/reveal.js       Fade-up scroll reveal (honours prefers-reduced-motion)
assets/js/services-filter.js  Keyword search on the services hub
assets/js/service-page.js     Opens the FAQ answer a link points at
assets/js/contact-form.js     Contact-form validation and states
assets/img/               Images and favicon
tools/check-shared.js     Header/footer/process copies have not drifted apart
tools/check-services.js   Every copy of the service list matches docs/TASKS.md
tools/check-service-pages.js  Every detail page matches the template
tools/check-supporting-pages.js  About, contact and 404 are wired up
tools/lib/                The one parser of the service table in docs/TASKS.md
docs/                     DESIGN.md and TASKS.md

services/index.html       Services hub — page header, filterable grid  (built)
services/*.html           The 10 sub-service pages                      (built)
about.html                About page                                    (built)
contact.html              Contact page, with the form                   (built)
404.html                  Not found page                                (built)
```

## Checks

```
node tools/check-shared.js
node tools/check-services.js
node tools/check-service-pages.js
node tools/check-supporting-pages.js
```

Every page carries its own copy of the header and footer — static markup rather than JavaScript partials, so navigation is indexable and survives JavaScript being unavailable. The four-step process band is duplicated the same way on the ten service pages. `check-shared.js` verifies the copies have not drifted apart, that the landmarks are in the right order (`<footer>` after `</main>`), and that any page using `[data-reveal]` also loads the reveal hook and script. It compares pages with each other, and it resolves relative links to a path from the site root first, so a page one level down is not flagged for writing `../assets/` — and the 404 page is not flagged for writing `/assets/`, which it must, being served for a URL at any depth. The process block belongs to the detail pages only, and the script fails in both directions — a detail page that has lost it, and any other page that has picked it up.

`check-services.js` covers what that cannot: it reads the canonical service list out of `docs/TASKS.md` and checks every copy of it on every page — name, order and filename, in the header dropdown, the footer, both grids and the About page's what-we-do list. A service renamed, reordered or dropped in one place fails it even when the pages agree with each other. The two deliberately partial lists on a detail page — the three related services and the previous/next pager — are fenced in the markup and checked against what they are meant to be.

`check-service-pages.js` checks the shape rather than the words: the ten service detail pages are one template, and it asserts the eight bands in order, each one's background, the heading its `aria-labelledby` points at, one `<h1>`, headings that never skip a level, the breadcrumb, the FAQ wiring and the step/benefit/entry counts.

`check-supporting-pages.js` covers the three pages that are not a template: it asserts about, contact and 404 each keep one `<h1>`, headings in order, a title, a meta description and the page header band; that the contact form keeps its wiring — `novalidate`, an action, a label and an `.invalid-feedback` for every required control, the submit hook, the honeypot and both states; and that the 404 keeps its root-absolute stylesheet and its three routes back.

See `docs/DESIGN.md`.

## Documentation

- **`docs/DESIGN.md`** — the design system: colours, typography, layout, components. Every page follows it. New components get documented there before reuse.
- **`docs/TASKS.md`** — the build plan: 42 tasks in 7 phases, worked one at a time.

## Hosting

Target is GitHub Pages, served from `main`. Because everything is plain static files with no build, the repository output *is* the site.
