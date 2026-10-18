#!/usr/bin/env node
/* ==========================================================================
   check-responsive.js — the things that make the layout work at any width
   ==========================================================================
   TASK-036 asks for a responsive review at 360, 768, 1024 and 1280px. Half of
   that is a human looking at four viewports; the other half is a handful of
   decisions that are either in the markup or not, and that no screenshot would
   tell you were missing until someone opened the site on a small phone. Those
   are what this script checks, so the manual pass is about how it looks rather
   than whether the fluid layout is even possible:

     1. Every page declares the viewport, and none of them caps the zoom
        (maximum-scale / user-scalable=no is the one thing that breaks pinch
        zoom, which is an accessibility failure, not a layout preference).
     2. Every image carries width and height, so the browser knows its
        intrinsic size and the layout does not jump as it loads.
     3. No inline style fixes a width or turns off wrapping — the two ways a
        single element can force a horizontal scrollbar on a narrow screen.
     4. Every .section band holds its .container, which is what supplies the
        side padding the fluid grid needs.
     5. No <table> is left without a scroll wrapper.
     6. In jnd.css, fixed pixel widths are confined to the small components
        that need them (the 48px icon tile and the 44px process numeral); a
        layout element fixed in pixels cannot shrink below its content.

   The four-width review itself, and what was seen at each width, is recorded
   in docs/QUALITY.md.

   Usage:
       node tools/check-responsive.js

   Exit 0 = the fluid layout's moving parts are in place.  Exit 1 = a problem.
   ========================================================================== */

'use strict';

var fs = require('fs');
var pages = require('./lib/pages.js');

var ROOT = pages.root;
var ALL_PAGES = pages.allPages();

/* Fixed pixel widths that are deliberately, uncomfortably small and square —
   the icon tile and the process numeral. Anything else fixed in px in the
   stylesheet would be a layout element that cannot shrink. */
var FIXED_WIDTHS = ['44px', '48px'];

var problems = 0;

function fail(where, message) {
  problems++;
  console.log('  ' + where);
  console.log('      ' + message);
}

console.log('Checking ' + ALL_PAGES.length + ' page(s) for responsive wiring\n');

var VIEWPORT = /<meta\s+name="viewport"\s+content="([^"]*)"/i;

ALL_PAGES.forEach(function (file) {
  var page = pages.relative(file);
  var html = fs.readFileSync(file, 'utf8');

  /* 1. The viewport. */
  var viewport = VIEWPORT.exec(html);

  if (!viewport) {
    fail(page, 'has no <meta name="viewport">, so mobile browsers assume a ' +
               'desktop width and the whole page is zoomed out');
  } else {
    var content = viewport[1].replace(/\s+/g, '');
    if (content.indexOf('width=device-width') === -1) {
      fail(page, 'the viewport is "' + viewport[1] + '"; it should start ' +
                 'width=device-width');
    }
    if (/user-scalable=no|maximum-scale=1(\.0)?\b/i.test(content)) {
      fail(page, 'the viewport disables pinch zoom, which no page should do');
    }
  }

  /* 2. Images know their size. */
  pages.openTags(html, 'img').forEach(function (img) {
    if (!img.attrs.width || !img.attrs.height) {
      fail(page, 'an <img> (' + (img.attrs.src || 'no src') + ') has no width ' +
                 'and height, so the layout shifts as it loads');
    }
  });

  /* 3. Nothing inline breaks the flow. */
  var inlineStyles = html.match(/style="([^"]*)"/gi) || [];
  inlineStyles.forEach(function (style) {
    if (/\b(width|min-width)\s*:\s*[^;]*\d+px/i.test(style)) {
      fail(page, 'an inline style fixes a width: ' + style);
    }
    if (/white-space\s*:\s*nowrap/i.test(style)) {
      fail(page, 'an inline style disables wrapping: ' + style);
    }
  });

  /* 4. Every band holds its container. */
  var missing = 0;

  html.split(/<section\b/).slice(1).forEach(function (chunk) {
    if (!/class="container\b/.test(chunk.split('</section>')[0])) missing++;
  });
  html.split(/<footer\b/).slice(1).forEach(function (chunk) {
    if (!/class="container\b/.test(chunk.split('</footer>')[0])) missing++;
  });

  if (missing) {
    fail(page, missing + ' .section band(s) with no .container inside, so they ' +
                        'get no side padding on a narrow screen');
  }

  /* 5. Tables scroll rather than overflow. */
  var tables = pages.countIn(html, /<table\b/gi);
  if (tables) {
    var wrapped = pages.countIn(html, /class="[^"]*table-responsive[^"]*"/gi);
    if (wrapped < tables) {
      fail(page, 'has ' + tables + ' <table>(s) and ' + wrapped +
                 ' .table-responsive wrapper(s); a table without one overflows ' +
                 'at 360px');
    }
  }
});

/* 6. The stylesheet's own fixed widths. */
console.log('\nStylesheet\n');

var css = fs.readFileSync(ROOT + '/assets/css/jnd.css', 'utf8');

/* Comments talk about the very things being checked for (the dropdown note
   explains why white-space is reset to normal), so they must not be scanned. */
var cssRules = css.replace(/\/\*[\s\S]*?\*\//g, '');

var widthPattern = /(^|[;{\s])width\s*:\s*([^;{}]+)/gi;
var match;

while ((match = widthPattern.exec(cssRules)) !== null) {
  var value = match[2].trim();

  /* Percentages, rem, vw, auto and clamp() all flex. A plain px value does not
     unless it is one of the two small fixed components. */
  if (/px$/.test(value) && FIXED_WIDTHS.indexOf(value) === -1) {
    fail('assets/css/jnd.css', 'sets width: ' + value + ' — a fixed pixel width ' +
         'on a layout element cannot shrink on a narrow screen');
  }
}

if (/overflow-x\s*:\s*hidden/i.test(cssRules)) {
  fail('assets/css/jnd.css', 'hides horizontal overflow instead of fixing it; a ' +
       'hide-on-overflow rule masks a layout that is too wide');
}

if (/white-space\s*:\s*nowrap/i.test(cssRules)) {
  fail('assets/css/jnd.css', 'sets white-space: nowrap, which can push a long ' +
       'line past the viewport');
}

if (!problems) {
  console.log('  no fixed layout widths outside the two small components');
}

console.log('');

if (problems) {
  console.log('FAILED — ' + problems + ' problem(s).');
  process.exit(1);
}

console.log('OK — the layout is wired to be fluid. Now look at it at 360, 768,');
console.log('1024 and 1280px and record what you saw in docs/QUALITY.md.');
