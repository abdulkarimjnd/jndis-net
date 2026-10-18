#!/usr/bin/env node
/* ==========================================================================
   check-performance.js — the speed decisions that live in the markup
   ==========================================================================
   TASK-039 asks for image optimisation, lazy loading and a Lighthouse score of
   90+. The score itself is a number a real browser produces against a real
   network; what this script can do is hold the decisions that make that number
   reachable, so a later edit does not quietly undo them:

     Assets
       1. Bootstrap arrives from the CDN already minified and version-pinned.
       2. The typeface is requested once, with display=swap and a preconnect, so
          text is never invisible while a slow font downloads.
       3. The only third-party script a page loads is that Bootstrap bundle.
          No analytics snippet, no icon script, nothing else to wait for.
       4. No @import in the stylesheet and no inline <style> block, either of
          which serialises a second round-trip before first paint.

     Images
       5. Every <img> declares width and height, so nothing reflows as it loads.
       6. Every <img> decodes asynchronously, off the main thread.
       7. Below-the-fold images are lazy; the above-the-fold wordmark is not
          (lazy-loading the thing you see first delays the thing you see first).
       8. Raster images stay within a size budget.

     Budgets
       9. Every local file, and the local weight of every page, stays under a
          ceiling. These are deliberately generous — the site is 60KB of HTML
          and one stylesheet — so they fire on an accident, not on growth.

   The Lighthouse run itself is a human step, recorded in docs/QUALITY.md.

   Usage:
       node tools/check-performance.js

   Exit 0 = the page-weight decisions are in place.  Exit 1 = a regression.
   ========================================================================== */

'use strict';

var fs = require('fs');
var path = require('path');
var pages = require('./lib/pages.js');

var ROOT = pages.root;

var MAX_HTML = 60 * 1024;        /* one page of HTML */
var MAX_LOCAL_PAGE = 140 * 1024; /* its HTML plus every local asset it pulls */
var MAX_LOCAL_FILE = 100 * 1024; /* any single stylesheet or script */
var MAX_RASTER = 200 * 1024;     /* any single raster image */

var problems = 0;

function fail(where, message) {
  problems++;
  console.log('  ' + where);
  console.log('      ' + message);
}

function bytes(rel) {
  return fs.statSync(path.join(ROOT, rel)).size;
}

function kb(value) {
  return Math.round(value / 1024) + 'KB';
}

/* Everything a page pulls from this repository: stylesheets, scripts and
   images, in the spelling the page uses, resolved to a path from the root. */
function localAssets(html, page) {
  var found = {};
  var pattern = /<(?:link|script|img)\b[^>]*\b(?:href|src)="([^"]+)"/gi;
  var match;

  while ((match = pattern.exec(html)) !== null) {
    var url = match[1];
    if (/^(https?:|\/\/|#|data:)/i.test(url)) continue;
    found[pages.resolve(page, url)] = true;
  }

  return Object.keys(found);
}

var ALL_PAGES = pages.allPages();

console.log('Checking ' + ALL_PAGES.length + ' page(s) for page weight\n');

ALL_PAGES.forEach(function (file) {
  var rel = pages.relative(file);
  var html = fs.readFileSync(file, 'utf8');
  var htmlSize = Buffer.byteLength(html);

  /* 1. Bootstrap is minified and pinned. */
  var bootstrapCss = /<link\b[^>]*href="([^"]*bootstrap[^"]*\.css[^"]*)"/i.exec(html);
  if (!bootstrapCss) {
    fail(rel, 'loads no Bootstrap stylesheet');
  } else if (!/\.min\.css/.test(bootstrapCss[1]) || !/bootstrap@5\.3\.8/.test(bootstrapCss[1])) {
    fail(rel, 'Bootstrap CSS is not the pinned minified build: ' + bootstrapCss[1]);
  }

  var bootstrapJs = /<script\b[^>]*src="([^"]*bootstrap[^"]*\.js[^"]*)"/i.exec(html);
  if (!bootstrapJs) {
    fail(rel, 'loads no Bootstrap script');
  } else if (!/\.min\.js/.test(bootstrapJs[1]) || !/bootstrap@5\.3\.8/.test(bootstrapJs[1])) {
    fail(rel, 'Bootstrap JS is not the pinned minified build: ' + bootstrapJs[1]);
  }

  /* 2. The typeface: one request, swap, and a preconnect to the font host. */
  var fontLink = /<link\b[^>]*href="([^"]*fonts\.googleapis\.com\/css2[^"]*)"/i.exec(html);
  if (!fontLink) {
    fail(rel, 'does not load the brand typeface');
  } else if (!/display=swap/.test(fontLink[1])) {
    fail(rel, 'the webfont is not loaded with display=swap, so text is invisible until it arrives');
  }
  if (!/rel="preconnect"[^>]*href="https:\/\/fonts\.gstatic\.com"/i.test(html)) {
    fail(rel, 'does not preconnect to the font host, so the font waits for the stylesheet');
  }

  /* 3. No third-party script other than the Bootstrap bundle. */
  var scriptSrc = /<script\b[^>]*src="([^"]+)"/gi;
  var script;
  while ((script = scriptSrc.exec(html)) !== null) {
    if (/^(https?:)?\/\//.test(script[1]) && !/cdn\.jsdelivr\.net\/npm\/bootstrap@5\.3\.8/.test(script[1])) {
      fail(rel, 'loads a third-party script that is not the Bootstrap bundle: ' + script[1]);
    }
  }

  /* 4. No @import and no inline <style>. */
  if (/<style\b/i.test(html)) fail(rel, 'has an inline <style> block, which blocks the first paint');
  if (/@import/i.test(fs.readFileSync(path.join(ROOT, 'assets/css/jnd.css'), 'utf8'))) {
    fail('assets/css/jnd.css', 'uses @import, which serialises a second stylesheet request');
  }

  /* 5-7. Images. */
  var imgs = pages.openTags(html, 'img');
  imgs.forEach(function (img, index) {
    var src = img.attrs.src || 'no src';

    if (!img.attrs.width || !img.attrs.height) {
      fail(rel, 'an <img> (' + src + ') lacks width/height, so the layout reflows as it loads');
    }
    if (img.attrs.decoding !== 'async') {
      fail(rel, 'an <img> (' + src + ') does not decode="async"');
    }

    var isFirst = index === 0;
    if (isFirst && img.attrs.loading === 'lazy') {
      fail(rel, 'the above-the-fold image (' + src + ') is lazy; it should load at once');
    }
    if (!isFirst && img.attrs.loading !== 'lazy') {
      fail(rel, 'a below-the-fold image (' + src + ') is not loading="lazy"');
    }
  });

  /* 8-9. Budgets. */
  if (htmlSize > MAX_HTML) {
    fail(rel, 'the HTML is ' + kb(htmlSize) + '; the budget is ' + kb(MAX_HTML));
  }

  var localTotal = htmlSize;
  localAssets(html, rel).forEach(function (asset) {
    var full = path.join(ROOT, asset);
    if (!fs.existsSync(full)) return; /* a broken path is check-links.js's job */
    var size = fs.statSync(full).size;
    if (/\.(js|css)$/.test(asset) && size > MAX_LOCAL_FILE) {
      fail(asset, 'is ' + kb(size) + '; the budget is ' + kb(MAX_LOCAL_FILE));
    }
    if (/\.(png|jpe?g|gif|webp|avif)$/.test(asset) && size > MAX_RASTER) {
      fail(asset, 'is ' + kb(size) + '; images should stay under ' + kb(MAX_RASTER));
    }
    localTotal += size;
  });

  if (localTotal > MAX_LOCAL_PAGE) {
    fail(rel, 'pulls ' + kb(localTotal) + ' of local assets; the budget is ' + kb(MAX_LOCAL_PAGE));
  }

  console.log('  ' + rel.padEnd(46) + ' ' + kb(htmlSize).padStart(5)
              + ' HTML, ' + kb(localTotal).padStart(5) + ' total');
});

console.log('');

if (problems) {
  console.log('FAILED — ' + problems + ' problem(s).');
  process.exit(1);
}

console.log('OK — assets are minified, deferred, lazy where they should be, and within budget.');
console.log('Run Lighthouse against the deployed site and record 90+ in docs/QUALITY.md.');
