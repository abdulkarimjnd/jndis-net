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
assets/img/               Images and favicon
tools/                    Maintenance scripts
docs/                     DESIGN.md and TASKS.md

services/                 Services hub + the 10 sub-service pages   — to come
about.html                About page                                — to come
contact.html              Contact page                              — to come
404.html                  Not found page                            — to come
```

## Checks

```
node tools/check-shared.js
```

Every page carries its own copy of the header and footer — static markup rather than JavaScript partials, so navigation is indexable and survives JavaScript being unavailable. That script verifies the copies have not drifted apart, that the landmarks are in the right order (`<footer>` after `</main>`), and that any page using `[data-reveal]` also loads the reveal hook and script. See `docs/DESIGN.md`.

## Documentation

- **`docs/DESIGN.md`** — the design system: colours, typography, layout, components. Every page follows it. New components get documented there before reuse.
- **`docs/TASKS.md`** — the build plan: 42 tasks in 7 phases, worked one at a time.

## Hosting

Target is GitHub Pages, served from `main`. Because everything is plain static files with no build, the repository output *is* the site.
