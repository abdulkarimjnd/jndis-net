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

   A third block, the process band on the service detail pages, is shared by
   only those ten pages; check-shared.js knows which pages should carry it and
   fails both on a page that is missing it and on a page that has it when it
   should not.

   Per-page differences that are expected and ignored:
     - the active nav link:  class="active" and aria-current="page"
     - the copyright year inside data-current-year
     - relative link depth: pages one level down write ../assets/ and
       href="network-infrastructure.html" where a root page writes assets/ and
       href="services/network-infrastructure.html". Every href/src is resolved
       to a root-relative path before comparing, so the check is about where the
       links GO rather than how they are spelled.
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
  { name: 'footer', begin: 'BEGIN shared footer', end: 'END shared footer' },

  /* The process band is shared, but only by the ten service detail pages. The
     predicate says who is expected to carry it, in both directions: a detail
     page missing it fails, and any other page carrying it fails too, so a
     copy-paste cannot quietly spread it. */
  {
    name: 'process',
    begin: 'BEGIN shared process',
    end: 'END shared process',
    required: function (page) {
      return /^services\/[^/]+\.html$/.test(page) && page !== 'services/index.html';
    }
  }
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
    .replace(/<!--[\s\S]*?-->/g, '')              // comments
    .replace(/class="([^"]*)"/g, function (match, classes) {
      /* The active nav link is the one permitted per-page difference. Strip the
         `active` token wherever it appears rather than matching one exact class
         string, so the Services dropdown item can be the active one too. */
      var kept = classes.split(/\s+/).filter(function (name) {
        return name && name !== 'active';
      });
      return 'class="' + kept.join(' ') + '"';
    })
    .replace(/\s+aria-current="page"/g, '')       // and its aria flag
    .replace(/(data-current-year>)\d{4}(<)/g, '$1YEAR$2')   // copyright year
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Rewrite every relative href/src into a path from the site root.

   Pages live at different depths, so the same link is written differently:
   a root page says href="services/network-infrastructure.html", the hub says
   href="network-infrastructure.html", and assets/ is ../assets/ one level down.
   Those are the same destination written three ways. Resolving them first means
   the comparison is about where the links GO, not how they are spelled, so a
   block that has genuinely drifted is still caught while a correct depth
   adjustment is not flagged as drift. */
function resolveFromRoot(html, page) {
  var dir = path.dirname(path.relative(ROOT, page)).replace(/\\/g, '/');
  var prefix = dir === '.' ? '' : dir + '/';

  return html.replace(/\b(href|src)="([^"]*)"/g, function (match, attribute, url) {
    /* Leave anything already absolute, or not a path at all. */
    if (/^(#|https?:|mailto:|tel:|data:|\/)/i.test(url)) return match;
    return attribute + '="' + path.posix.normalize(prefix + url) + '"';
  });
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
  var checked = 0;

  pages.forEach(function (page) {
    var name = relative(page);

    var raw;
    try {
      raw = fs.readFileSync(page, 'utf8');
    } catch (err) {
      found.push('  ' + name + ': could not be read');
      return;
    }

    var snippet = extract(raw, block);

    /* Blocks that belong to only some pages, such as the process band, say who
       they are for. Anything else is expected everywhere. */
    if (block.required && !block.required(name)) {
      if (snippet !== null) {
        found.push('  ' + name + ': carries the ' + block.name +
                   ' block, which does not belong on this page');
      }
      return;
    }

    if (snippet === null) {
      found.push('  ' + name + ': missing "' + block.begin +
                 '" / "' + block.end + '" markers');
      return;
    }

    checked++;

    var value = normalise(resolveFromRoot(snippet, page));

    if (reference === null) {
      reference = value;
      referencePage = page;
      return;
    }

    var at = firstDifference(reference, value);
    if (at !== -1) {
      found.push('  ' + name + ': differs from ' + relative(referencePage) +
                 '\n      near: ...' + excerpt(value, at) + '...');
    }
  });

  if (found.length) {
    problems += found.length;
    driftProblems += found.length;
    console.log('  ' + block.name.toUpperCase() + '  DRIFT');
    found.forEach(function (line) { console.log(line); });
  } else {
    console.log('  ' + block.name.toUpperCase() + '  in sync across ' + checked + ' page(s)');
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
