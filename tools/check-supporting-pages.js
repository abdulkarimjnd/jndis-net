#!/usr/bin/env node
/* ==========================================================================
   check-supporting-pages.js — the about, contact and 404 pages
   ==========================================================================
   The three supporting pages (TASK-032 to TASK-035) are where the site stops
   talking about services and starts talking to the visitor. Unlike the service
   detail pages they are not one template, so tools/check-service-pages.js does
   not cover them and there is no second copy to compare them with. What can be
   checked mechanically is the wiring that is invisible in a diff and obvious
   only when it is already broken:

     1. Each page exists, has one <h1>, headings that never skip a level, a
        title and a meta description.
     2. Each opens on the page-header band with a breadcrumb (TASK-016).
     3. about.html offers the route onward to the contact page.
     4. contact.html is a real form: it carries novalidate, every required
        control has a label for it and an .invalid-feedback message, there is a
        submit button, a success state and an error state, the honeypot is
        present, and the page loads the script that drives them all.
     5. 404.html is spelled with root-absolute paths — it is served for a URL at
        any depth, so a relative asset would resolve somewhere that does not
        exist — and it offers a way back to the homepage, the services hub and
        the contact page.

   The service list and the shared header/footer are not checked here: that is
   tools/check-services.js and tools/check-shared.js, which already cover every
   page.

   Usage:
       node tools/check-supporting-pages.js

   Exit 0 = the three pages are wired up.  Exit 1 = something is missing.
   ========================================================================== */

'use strict';

var fs = require('fs');
var path = require('path');

var canonical = require('./lib/canonical-services.js');

var ROOT = canonical.root;

var PAGES = ['about.html', 'contact.html', '404.html'];

function read(page) {
  try {
    return fs.readFileSync(path.join(ROOT, page), 'utf8');
  } catch (err) {
    return null;
  }
}

var problems = 0;

function fail(page, message) {
  problems++;
  console.log('  ' + page);
  console.log('      ' + message);
}

function countIn(html, pattern) {
  var found = html.match(pattern);
  return found ? found.length : 0;
}

/* One <h1>, and headings that never skip a level as they go down the file.
   A heading that repeats a level or steps back up is fine — the footer has four
   <h2>s of its own after </main>. */
function checkHeadings(page, html) {
  var h1s = html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) || [];

  if (h1s.length !== 1) {
    fail(page, 'has ' + h1s.length + ' <h1> elements; there must be exactly one');
  }

  var pattern = /<h([1-6])\b[^>]*>/gi;
  var match = null;
  var previous = 0;

  while ((match = pattern.exec(html)) !== null) {
    var level = Number(match[1]);

    if (previous && level > previous + 1) {
      fail(page, 'an <h' + level + '> follows an <h' + previous + '>, skipping a level');
    }
    previous = level;
  }
}

function checkMeta(page, html) {
  var title = /<title>([\s\S]*?)<\/title>/i.exec(html);
  if (!title || title[1].trim().length < 5) {
    fail(page, 'has no useful <title>');
  }

  var description = /<meta\s+name="description"\s+content="([^"]*)"/i.exec(html);
  if (!description || description[1].trim().length < 50) {
    fail(page, 'the meta description is missing or too short to be useful');
  }
}

function checkPageHeader(page, html) {
  if (!/<section\b[^>]*class="section bg-surface"/.test(html)) {
    fail(page, 'does not open on the .section.bg-surface page-header band');
  }
  if (!/<nav\b[^>]*aria-label="Breadcrumb"/.test(html)) {
    fail(page, 'has no <nav aria-label="Breadcrumb">');
  }
}

/* --------------------------------------------------------------------------
   The contact form (TASK-033, TASK-034).
   -------------------------------------------------------------------------- */
function checkContactForm(page, html) {
  var form = /<form\b([^>]*)>([\s\S]*?)<\/form>/i.exec(html);

  if (!form) {
    fail(page, 'has no <form>');
    return;
  }

  var attributes = form[1];

  if (!/\bnovalidate\b/.test(attributes)) {
    fail(page, 'the form does not carry novalidate, so the browser\'s own ' +
               'messages would appear beside ours (DESIGN.md, "UX Requirements")');
  }
  if (!/\baction="[^"]+"/.test(attributes)) {
    fail(page, 'the form has no action, so it cannot be sent anywhere');
  }
  if (!/\bmethod="post"/i.test(attributes)) {
    fail(page, 'the form is not a method="post"');
  }
  if (!/data-contact-form/.test(attributes)) {
    fail(page, 'the form has no [data-contact-form] hook for its script');
  }

  var body = form[2];
  var required = (body.match(/<(?:input|textarea|select)\b[^>]*\brequired\b[^>]*>/gi) || []);

  if (!required.length) {
    fail(page, 'the form marks nothing as required');
  }

  required.forEach(function (tag) {
    var id = /\bid="([^"]+)"/i.exec(tag);
    if (!id) {
      fail(page, 'a required control has no id, so no label can point at it');
      return;
    }
    var label = new RegExp('<label\\b[^>]*\\bfor="' + id[1] + '"', 'i');
    if (!label.test(body)) {
      fail(page, 'the required control "' + id[1] + '" has no <label for="' + id[1] + '">');
    }
  });

  var feedback = countIn(body, /\bclass="invalid-feedback"/gi);
  if (feedback !== required.length) {
    fail(page, 'the form has ' + feedback + ' .invalid-feedback message(s) for ' +
               required.length + ' required control(s); each needs its own');
  }

  if (!/<button\b[^>]*type="submit"/i.test(body)) {
    fail(page, 'the form has no submit button');
  }
  if (!/data-contact-submit/i.test(body)) {
    fail(page, 'the submit button has no [data-contact-submit] hook, so the ' +
               'loading state cannot reach it');
  }
  if (!/name="_gotcha"/i.test(body)) {
    fail(page, 'the form has no _gotcha honeypot field');
  }

  if (!/data-contact-success/.test(html)) {
    fail(page, 'has no success state ([data-contact-success])');
  }
  if (!/data-contact-error/.test(html)) {
    fail(page, 'has no error state ([data-contact-error])');
  }
  if (html.indexOf('assets/js/contact-form.js') === -1) {
    fail(page, 'never loads assets/js/contact-form.js');
  }
}

/* --------------------------------------------------------------------------
   The 404 (TASK-035).
   -------------------------------------------------------------------------- */
function checkNotFound(page, html) {
  if (html.indexOf('href="/assets/css/jnd.css"') === -1) {
    fail(page, 'does not load the stylesheet from a root-absolute path; a ' +
               'relative one breaks for a URL below the site root');
  }

  ['/index.html', '/services/index.html', '/contact.html'].forEach(function (target) {
    if (html.indexOf('href="' + target + '"') === -1) {
      fail(page, 'offers no link to ' + target);
    }
  });
}

/* --------------------------------------------------------------------------
   Run.
   -------------------------------------------------------------------------- */
console.log('Checking ' + PAGES.length + ' supporting page(s)\n');

PAGES.forEach(function (page) {
  var html = read(page);

  if (html === null) {
    fail(page, 'does not exist');
    return;
  }

  checkHeadings(page, html);
  checkMeta(page, html);
  checkPageHeader(page, html);

  if (page === 'contact.html') checkContactForm(page, html);
  if (page === '404.html') checkNotFound(page, html);
});

/* about.html is the one page with a clear next step, to the contact page. */
var about = read('about.html');
if (about !== null && about.indexOf('href="contact.html"') === -1) {
  fail('about.html', 'offers no route onward to contact.html');
}

console.log('');

if (problems) {
  console.log('FAILED — ' + problems + ' problem(s).');
  console.log('');
  console.log('The three pages and the contact form are described in');
  console.log('docs/DESIGN.md. Fix the wiring, or change the design and every copy');
  console.log('together.');
  process.exit(1);
}

console.log('OK — the supporting pages are wired up.');
