#!/usr/bin/env node
/* ==========================================================================
   check-shared.js — guards the duplicated header and footer
   ==========================================================================
   TASK-010 decided NOT to load the header and footer with JavaScript partials.
   Navigation belongs in the HTML: it must be indexable and it must survive
   JavaScript being unavailable. The cost of that decision is duplication, and
   duplication silently drifts.

   This script reads every .html file, extracts the block between

       <!-- BEGIN shared header --> ... <!-- END shared header -->

   (and the equivalent footer pair), neutralises the parts that are legitimately
   per-page, and fails if any page differs from the first one found.

   Per-page differences that are expected and ignored:
     - the active nav link:  class="active" and aria-current="page"
     - the copyright year inside data-current-year
     - HTML comments, line endings, and runs of whitespace

   Usage:
       node tools/check-shared.js

   Exit 0 = every page matches.  Exit 1 = drift found.
   ========================================================================== */

'use strict';

var fs = require('fs');
var path = require('path');

var ROOT = path.resolve(__dirname, '..');
var SKIP_DIRS = ['node_modules', '.git', '.idea', '.vscode'];

var BLOCKS = [
  { name: 'header', begin: 'BEGIN shared header', end: 'END shared header' },
  { name: 'footer', begin: 'BEGIN shared footer', end: 'END shared footer' }
];

function findPages(dir, found) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
    if (SKIP_DIRS.indexOf(entry.name) !== -1) return;

    var full = path.join(dir, entry.name);
    if (entry.isDirectory()) findPages(full, found);
    else if (entry.name.slice(-5).toLowerCase() === '.html') found.push(full);
  });
  return found;
}

/* Neutralise everything that is allowed to differ between pages. */
function normalise(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')                          // comments
    .replace(/class="nav-link active"/g, 'class="nav-link"')  // active nav link
    .replace(/\s+aria-current="page"/g, '')                   // its aria flag
    .replace(/(data-current-year>)\d{4}(<)/g, '$1YEAR$2')     // copyright year
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

function extract(html, block) {
  var beginAt = html.indexOf(block.begin);
  if (beginAt === -1) return null;

  var contentStart = html.indexOf('-->', beginAt);
  if (contentStart === -1) return null;

  var endAt = html.indexOf(block.end, contentStart);
  if (endAt === -1) return null;

  var contentEnd = html.lastIndexOf('<!--', endAt);
  if (contentEnd === -1) return null;

  return html.slice(contentStart + 3, contentEnd);
}

function relative(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

function firstDifference(a, b) {
  var shortest = Math.min(a.length, b.length);
  for (var i = 0; i < shortest; i++) {
    if (a.charAt(i) !== b.charAt(i)) return i;
  }
  return a.length === b.length ? -1 : shortest;
}

function excerpt(text, at) {
  return text.slice(Math.max(0, at - 45), at + 55).replace(/\s+/g, ' ');
}

var pages = findPages(ROOT, []).sort();

if (pages.length === 0) {
  console.error('No .html files found — nothing to check.');
  process.exit(1);
}

console.log('Checking ' + pages.length + ' page(s) for shared-markup drift\n');

var problems = 0;

BLOCKS.forEach(function (block) {
  var reference = null;
  var referencePage = null;
  var found = [];

  pages.forEach(function (page) {
    var raw;
    try {
      raw = fs.readFileSync(page, 'utf8');
    } catch (err) {
      found.push('  ' + relative(page) + ': could not be read');
      return;
    }

    var snippet = extract(raw, block);
    if (snippet === null) {
      found.push('  ' + relative(page) + ': missing "' + block.begin +
                 '" / "' + block.end + '" markers');
      return;
    }

    var value = normalise(snippet);

    if (reference === null) {
      reference = value;
      referencePage = page;
      return;
    }

    var at = firstDifference(reference, value);
    if (at !== -1) {
      found.push('  ' + relative(page) + ': differs from ' + relative(referencePage) +
                 '\n      near: ...' + excerpt(value, at) + '...');
    }
  });

  if (found.length) {
    problems += found.length;
    console.log('  ' + block.name.toUpperCase() + '  DRIFT');
    found.forEach(function (line) { console.log(line); });
  } else {
    console.log('  ' + block.name.toUpperCase() + '  in sync across ' + pages.length + ' page(s)');
  }
});

console.log('');

if (problems) {
  console.log('FAILED — ' + problems + ' problem(s). Copy the canonical block from the');
  console.log('page quoted as the reference into the ones that differ.');
  process.exit(1);
}

console.log('OK — every page carries the same header and footer.');
