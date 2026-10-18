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

   It also checks where the blocks SIT. Identical text in the wrong place is
   still broken: a footer duplicated before <main> is drift-free and renders
   the footer above the page content.

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
var driftProblems = 0;
var layoutProblems = 0;

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
    driftProblems += found.length;
    console.log('  ' + block.name.toUpperCase() + '  DRIFT');
    found.forEach(function (line) { console.log(line); });
  } else {
    console.log('  ' + block.name.toUpperCase() + '  in sync across ' + pages.length + ' page(s)');
  }
});

console.log('');

/* --------------------------------------------------------------------------
   Placement, not just content.

   The two blocks can be byte-identical and still sit in the wrong place. The
   footer was originally duplicated before <main>: valid, drift-free markup
   that renders the footer above the page content on every page. Comparing
   text alone cannot see that, so check the landmark order too.
   -------------------------------------------------------------------------- */
var PLACEMENT = [
  { label: '<header> before <main>', first: '<header', second: '<main' },
  { label: '</main> before <footer>', first: '</main>', second: '<footer' }
];

console.log('Landmark placement');

PLACEMENT.forEach(function (rule) {
  var wrong = [];

  pages.forEach(function (page) {
    var raw;
    try {
      raw = fs.readFileSync(page, 'utf8');
    } catch (err) {
      return;
    }

    var first = raw.indexOf(rule.first);
    var second = raw.indexOf(rule.second);

    if (first === -1 || second === -1) {
      wrong.push('  ' + relative(page) + ': expected both "' + rule.first +
                 '" and "' + rule.second + '"');
    } else if (first > second) {
      wrong.push('  ' + relative(page) + ': "' + rule.second +
                 '" appears before "' + rule.first + '"');
    }
  });

  if (wrong.length) {
    problems += wrong.length;
    layoutProblems += wrong.length;
    console.log('  ' + rule.label + '  WRONG PLACEMENT');
    wrong.forEach(function (line) { console.log(line); });
  } else {
    console.log('  ' + rule.label + '  ok');
  }
});

/* --------------------------------------------------------------------------
   Reveal wiring.

   The <head> is copied into each page by hand, like the header and the footer,
   so it can drift the same way. A page that marks up [data-reveal] but never
   loads the hook or the script loses the effect silently — not a broken page,
   which someone would notice, but a feature that quietly stops working.

   The script path is matched as a substring so that both assets/js/reveal.js
   and ../assets/js/reveal.js (pages one level down) count.
   -------------------------------------------------------------------------- */
console.log('');
console.log('Reveal wiring');

var REVEAL_SCRIPT = 'assets/js/reveal.js';
var HOOK = "classList.add('js-reveal')";
var revealProblems = 0;

pages.forEach(function (page) {
  var raw;
  try {
    raw = fs.readFileSync(page, 'utf8');
  } catch (err) {
    return;
  }

  var uses = raw.indexOf('data-reveal') !== -1;
  var hooked = raw.indexOf(HOOK) !== -1;
  var loaded = raw.indexOf(REVEAL_SCRIPT) !== -1;
  var issues = [];

  if (uses && !hooked) {
    issues.push('marks up [data-reveal] but the <head> hook is missing, so it');
    issues.push('      would never be hidden or animated');
  }
  if (uses && !loaded) {
    issues.push('marks up [data-reveal] but never loads ' + REVEAL_SCRIPT);
  }
  if (hooked && !loaded) {
    issues.push('arms the reveal hook but never loads ' + REVEAL_SCRIPT + ', so the');
    issues.push('      failsafe falls back to showing everything after 3s');
  }

  if (issues.length) {
    revealProblems++;
    console.log('  ' + relative(page));
    issues.forEach(function (line) { console.log('      ' + line); });
  }
});

if (revealProblems) {
  problems += revealProblems;
} else {
  console.log('  every page that uses [data-reveal] loads the hook and the script');
}

console.log('');

if (problems) {
  console.log('FAILED — ' + problems + ' problem(s).');
  if (driftProblems) {
    console.log('');
    console.log('Content drift: copy the canonical block from the page quoted as the');
    console.log('reference into the ones that differ.');
  }
  if (layoutProblems) {
    console.log('');
    console.log('Placement: the header block belongs right after <body>, the footer block');
    console.log('right before </body> — that is, after </main>. A footer before <main>');
    console.log('renders above the page content. See DESIGN.md, "Shared markup".');
  }
  process.exit(1);
}

console.log('OK — every page carries the same header and footer, in the right place.');
