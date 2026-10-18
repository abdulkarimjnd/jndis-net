# DEPLOY.md — hosting, the domain, and what must be true before launch

This is the deploy runbook for **TASK-042**: where the site is hosted, how the
domain is connected, and the short list of things that still need a person with
real credentials or a real device. It is deliberately separate from
`docs/QUALITY.md` (which is about the code) because most of what is left is not
code.

## What the site is

Plain static files — HTML, one stylesheet, a few small scripts, an SVG favicon
and one PNG share card. There is **no build step and no dependencies**, so the
repository *is* the deployed artefact: whatever is on `main` is what a browser
downloads. `README.md` says the same thing at the top.

## Where it is hosted

**GitHub Pages**, served from the `main` branch at the repository root, behind
the custom domain **https://jndis.net**.

Three files exist in the repository because of that choice:

| File | Why it is there |
|---|---|
| `CNAME` | Holds `jndis.net`. GitHub Pages reads it to know which domain to answer for; without it the custom domain has to be re-entered in the UI on every deploy. |
| `.nojekyll` | Tells GitHub Pages not to run the files through Jekyll. There is no Jekyll site here, and skipping it means the files are published exactly as committed. |
| `404.html` | GitHub Pages serves this automatically for any URL it cannot match, at any depth. Every path inside it is root-absolute for that reason. |

`sitemap.xml` and `robots.txt` (TASK-038) also live at the root, where a crawler
expects them.

## One-time setup

These steps need an account with push access to the GitHub repository. They are
done once, not per release.

1. **Push `main`.** GitHub Pages builds from a branch, so the first thing is a
   pushed commit. The checks in `README.md` all run from disk and need nothing
   from this step.
2. **Turn Pages on.** Repository → *Settings* → *Pages* → *Build and
   deployment* → Source: **Deploy from a branch** → Branch: **`main`** → Folder:
   **`/ (root)`** → *Save*.
3. **Confirm the custom domain.** On the same screen, *Custom domain* should
   read `jndis.net` (it will have been pre-filled from `CNAME`). Leave *Enforce
   HTTPS* off until the certificate is issued, then turn it on.
4. **Point DNS at GitHub.** At the domain registrar, for the apex `jndis.net`:

   | Type | Name | Value |
   |---|---|---|
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |

   and, so `www.jndis.net` redirects to the apex, a CNAME:

   | Type | Name | Value |
   |---|---|---|
   | CNAME | `www` | `<github-user>.github.io` |

   The four A records are GitHub Pages' published addresses. If they ever change,
   this table changes with them.
5. **Wait for the certificate, then enforce HTTPS.** DNS can take from minutes
   to a day to propagate. Once GitHub shows *DNS check successful* and offers
   *Enforce HTTPS*, turn it on; visitors to `http://` are then redirected.

## Every release after that

```
git push origin main
```

That is the whole deploy. There is nothing to compile, upload or purge. A push
to `main` is live within a minute or two.

## Pre-launch checklist

The site is built and checked, but it must not go out with these still open.
They are gathered here so they cannot be forgotten; each is also flagged at the
point in the code where it lives.

- [ ] **Real contact details.** The footer shows three placeholders —
      *Phone number to be added*, *Email address to be added*, *Street address,
      City, Country* — marked with `.site-placeholder`. They appear in the shared
      footer on all fifteen pages, so replace the block once in a page, then copy
      it to the others exactly (the copies must not drift; `tools/check-shared.js`
      will tell you if they do). The same details are owed on `contact.html`.
- [ ] **A working contact form.** `contact.html` posts to
      `https://formspree.io/f/REPLACE_WITH_FORM_ID` and falls back to
      `REPLACE_WITH_EMAIL`. Until both are real, the form tells the visitor it is
      not connected rather than swallowing a message — but it still needs
      connecting before launch. Create the Formspree form (or an equivalent),
      put its id in the `action`, and put the real inbox in
      `data-contact-email`. `node tools/check-supporting-pages.js` checks the
      wiring, not the values.
- [ ] **A touch pass on a real phone.** Tap targets, the Services dropdown on a
      small screen, and iOS Safari's viewport chrome. This cannot be done from a
      headless browser; it is the open item from `docs/QUALITY.md` TASK-036.
- [ ] **A real-browser pass.** Chrome, Safari, Edge and a phone, opened against
      the deployed URL, looking for anything the Gecko render in TASK-036/040
      could not show. See `docs/QUALITY.md` TASK-040.
- [ ] **A Lighthouse run against the deployed site**, looking for 90+ on
      Performance, Accessibility, Best Practices and SEO. TASK-039's checker
      holds the page-weight decisions that make the score reachable; the score
      itself needs the live URL.
- [ ] **The nine checks, green.** `README.md` lists them. They run offline.
- [ ] **A submitted sitemap.** Add `https://jndis.net/sitemap.xml` to Google
      Search Console (and Bing Webmaster Tools). Optional, but it is the fastest
      way to learn that the domain is resolving.

## After the first deploy

- Open `https://jndis.net/`, `/about.html`, `/contact.html`, `/services/` and one
  service page. They should all load over HTTPS with the padlock.
- Open a URL that does not exist, e.g. `https://jndis.net/no-such-page`, and
  confirm the 404 page renders **with its stylesheet** — that is the check that
  the root-absolute paths in `404.html` are doing their job.
- Submit the contact form. With the placeholders still in place it should say it
  is not connected; once real values are in, it should report success and the
  message should arrive.
- View the page source of a shared link (or paste the URL into a link-preview
  tool) and confirm the Open Graph title, description and 1200x630 card appear.

## Rollback

Because the deploy is the branch, rolling back is `git revert` (or
`git push --force` a known-good commit) and pushing. GitHub Pages republishes
within a minute or two.

## Why no Netlify/Vercel config

TASK-042 offers a choice of host. GitHub Pages is the one that matches the
repository as it already stands — `CNAME` was committed back in TASK-001 — and
it needs no build command, no publish directory and no account beyond the one
that owns the repository. If the site ever moves to Netlify or cPanel, nothing
in the pages has to change: it is static files with relative links, and the only
host-specific file is `CNAME`, which that host would replace with its own
configuration.
