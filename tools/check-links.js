#!/usr/bin/env node
/* ==========================================================================
   check-links.js — every link on the site goes somewhere real
   ==========================================================================
   TASK-041 asks to fix broken links and run a link check. A static site has no
   server to log 404s, and this one carries fifteen hand-written pages with the
   same header and footer copied into each, so a rename in one place and a
   missed reference in another is the likeliest way the site breaks. The
   browser stays silent about it until a visitor hits the dead link.

   This script walks every page, collects every internal reference — <a href>,
   <link href>, <script src> and <img src> — and checks each one against the
   files on disk:

     1. The target file exists, resolved from the page's own depth (a page in
        services/ writes ../assets/, the 404 writes /assets/; both are the same
        file, and tools/lib/pages.js already knows that).
     2. A link to a directory resolves to its index.html.
     3. A #fragment points at an id that is actually on the target page, so a
        link to a section someone renamed does not scroll to nowhere.
     4. No empty href and no href="#" placeholder — the two ways a link that
        looks done is not.
     5. No target="_blank" without rel="noopener"/"noreferrer", which hands the
        opened page control of ours through window.opener.
     6. mailto: and tel: links carry something after the scheme.

   External http(s) links are listed but not fetched: this runs offline, with
   no server and no network, and a check that quietly needed the network would
   be the one that never runs. They are re-checked in docs/QUALITY.md's
   pre-launch list.

   Usage:
       node tools/check-links.js

   Exit 0 = every internal link resolves.  Exit 1 = at least one does not.
   ========================================================================== */

'use strict';

var fs = require('fs');
var path = require('path');
var pages = require('./lib/pages.js');

var ROOT = pages.root;

var problems = 0;

function fail(where, message) {
  problems++;
  console.log('  ' + where);
  console.log('      ' + message);
}

var EXTERNAL = /^(https?:|\/\/|mailto:|tel:|data:|javascript:)/i;

var ALL_PAGES = pages.allPages();
var idsByFile = {};
var external = {};
var checked = 0;

function idsOf(rel) {
  if (!idsByFile[rel]) {
    var full = path.join(ROOT, rel);
    idsByFile[rel] = fs.existsSync(full) ? pages.idsIn(fs.readFileSync(full, 'utf8')) : {};
  }
  return idsByFile[rel];
}

/* The file a URL points at, from the root. A bare directory means its
   index.html, which is how GitHub Pages serves it. */
function targetFile(url) {
  var clean = url.split('?')[0];
  if (clean === '' || clean.charAt(clean.length - 1) === '/') return clean + 'index.html';
  return clean;
}

function checkUrl(page, url, what) {
  if (EXTERNAL.test(url)) {
    if (/^(mailto:|tel:)/i.test(url) && !/^(mailto:|tel:)[^?]+/.test(url)) {
      fail(page, 'a ' + what + ' is ' + url + ', with nothing after the scheme');
    }
    if (/^https?:/i.test(url)) external[url] = true;
    return;
  }

  checked++;

  /* A #fragment, on this page or another. */
  var hash = url.indexOf('#');
  var fragment = hash === -1 ? null : url.slice(hash + 1);
  var target = targetFile(hash === -1 ? url : url.slice(0, hash));

  var resolved;
  if (hash === 0) {
    resolved = pages.relative(page); /* "#main" -> this page */
  } else {
    resolved = pages.resolve(page, target);
  }

  var full = path.join(ROOT, resolved);
  if (!fs.existsSync(full)) {
    fail(page, 'a ' + what + ' points at "' + url + '", which resolves to '
               + resolved + ' — no such file');
    return;
  }

  if (fragment && /\.html$/.test(resolved)) {
    if (!idsOf(resolved)[fragment]) {
      fail(page, 'a ' + what + ' points at "' + url + '", but #' + fragment
                 + ' is not an id on ' + resolved);
    }
  }
}

console.log('Checking links on ' + ALL_PAGES.length + ' page(s)\n');

ALL_PAGES.forEach(function (file) {
  var page = pages.relative(file);
  var html = fs.readFileSync(file, 'utf8');

  /* Anchors, with the placeholder forms singled out. */
  pages.anchors(html, page).forEach(function (anchor) {
    if (anchor.href === null) {
      fail(page, 'has an <a> with no href');
      return;
    }
    if (anchor.href === '' || anchor.href === '#') {
      fail(page, 'has an href="' + anchor.href + '", which goes nowhere');
      return;
    }
    checkUrl(page, anchor.href, 'link');
  });

  /* A new tab must not hand over window.opener. */
  var blank = /<a\b[^>]*\btarget="_blank"[^>]*>/gi;
  var tag;
  while ((tag = blank.exec(html)) !== null) {
    if (!/\brel="[^"]*(noopener|noreferrer)/i.test(tag[0])) {
      fail(page, 'opens a new tab without rel="noopener": ' + tag[0].replace(/\s+/g, ' ').trim());
    }
  }

  /* Stylesheets, icons, scripts and images. */
  [['link', 'href'], ['script', 'src'], ['img', 'src']].forEach(function (pair) {
    pages.openTags(html, pair[0]).forEach(function (element) {
      var url = element.attrs[pair[1]];
      if (url) checkUrl(page, url, pair[0]);
    });
  });
});

/* ---------------------------------------------------------------- the report */

var externalList = Object.keys(external);

console.log('\nChecked ' + checked + ' internal reference(s).');
console.log('External links (not fetched offline): ' + externalList.length);
externalList.forEach(function (url) {
  console.log('  ' + url);
});

console.log('');

if (problems) {
  console.log('FAILED — ' + problems + ' broken internal link(s) or placeholder(s).');
  process.exit(1);
}

console.log('OK — every internal link resolves to a file, and every #fragment to an id.');
