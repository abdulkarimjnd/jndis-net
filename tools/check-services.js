#!/usr/bin/env node
/* ==========================================================================
   check-services.js — enforces the service list
   ==========================================================================
   docs/TASKS.md holds the one canonical service list: name, order and
   filename. It is copied by hand into the header dropdown, the footer, the
   home page grid and the services hub, and copy drifts.

   check-shared.js catches a page whose shared blocks differ from the others,
   but it compares pages with each other, so an edit applied everywhere — or
   made only inside the page-specific grids — passes it by. This script
   compares every one of those copies against the table itself.

   What it checks, on every page:
     1. Every link that points at a service page points at a real one.
     2. Its visible wording is the canonical name. Card links read
        "Learn more", so those are matched against the nearest heading above
        them, which is the card title.
     3. All ten services are somewhere on the page.
     4. Every LIST of services is the complete ten, in canonical order. A run
        of service links with no ordinary link between them is one list — the
        header dropdown, the footer column, a grid — and today every list on
        the site is a full one. A service missing from a list is as wrong as
        two swapped, so both are reported.

   Usage:
       node tools/check-services.js

   Exit 0 = every copy matches docs/TASKS.md.  Exit 1 = drift found.
   ========================================================================== */

'use strict';

var fs = require('fs');
var path = require('path');

var ROOT = path.resolve(__dirname, '..');
var SKIP_DIRS = ['node_modules', '.git', '.idea', '.vscode'];
var TASKS = path.join(ROOT, 'docs', 'TASKS.md');

/* --------------------------------------------------------------------------
   The canonical list, straight out of the table in docs/TASKS.md.
   -------------------------------------------------------------------------- */
function readCanonical() {
  var markdown;
  try {
    markdown = fs.readFileSync(TASKS, 'utf8');
  } catch (err) {
    console.error('Could not read docs/TASKS.md — ' + err.message);
    process.exit(1);
  }

  var heading = '## Service list (single source of truth)';
  var at = markdown.indexOf(heading);
  if (at === -1) {
    console.error('Could not find "' + heading + '" in docs/TASKS.md.');
    process.exit(1);
  }

  /* Stop at the horizontal rule that closes the section, so a later table
     cannot be mistaken for this one. */
  var section = markdown.slice(at + heading.length).split('\n---')[0];

  var row = /^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*`([^`]+)`\s*\|\s*$/gm;
  var services = [];
  var match;

  while ((match = row.exec(section)) !== null) {
    services.push({
      name: match[2],                       // "IT Support & Maintenance"
      file: match[3].replace(/^\.\//, '')   // "services/it-support-maintenance.html"
    });
  }

  if (!services.length) {
    console.error('The service table in docs/TASKS.md parsed as empty.');
    process.exit(1);
  }

  return services;
}

var SERVICES = readCanonical();

function indexOfFile(url) {
  for (var i = 0; i < SERVICES.length; i++) {
    if (SERVICES[i].file === url) return i;
  }
  return -1;
}

/* --------------------------------------------------------------------------
   Reading the pages.
   -------------------------------------------------------------------------- */
function findPages(dir, found) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
    if (SKIP_DIRS.indexOf(entry.name) !== -1) return;

    var full = path.join(dir, entry.name);
    if (entry.isDirectory()) findPages(full, found);
    else if (entry.name.slice(-5).toLowerCase() === '.html') found.push(full);
  });
  return found;
}

function relative(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

/* The four entities the copy actually uses. &amp; is the one that matters:
   every second service name contains "&". */
function decode(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&rarr;/g, '\u2192')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ldquo;/g, '\u201c')
    .replace(/&rdquo;/g, '\u201d')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'");
}

function textOf(html) {
  return decode(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/* Every relative href resolved to a path from the site root, so a page one
   level down ("../index.html") and a root page ("index.html") are compared by
   where they point rather than how they are spelled. Same rule as
   check-shared.js: pages in services/ write "network-infrastructure.html"
   where the root wrote "services/network-infrastructure.html". */
function resolverFor(page) {
  var dir = path.dirname(path.relative(ROOT, page)).replace(/\\/g, '/');
  var prefix = dir === '.' ? '' : dir + '/';

  return function (url) {
    if (/^(#|https?:|mailto:|tel:|data:|\/)/i.test(url)) return url;
    return path.posix.normalize(prefix + url);
  };
}

/* Every <a> in the document, in order, with its resolved href, its visible
   text, and where it sits. */
function anchorsIn(html, page) {
  var resolve = resolverFor(page);
  var pattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  var anchors = [];
  var match;

  while ((match = pattern.exec(html)) !== null) {
    var href = /\bhref="([^"]*)"/i.exec(match[1]);
    anchors.push({
      at: match.index,
      url: href ? resolve(href[1]) : '',
      text: textOf(match[2])
    });
  }

  return anchors;
}

/* The card's title, for the "Learn more" links that do not carry the service
   name themselves. */
function headingsIn(html) {
  var pattern = /<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi;
  var headings = [];
  var match;

  while ((match = pattern.exec(html)) !== null) {
    headings.push({ at: match.index, text: textOf(match[1]) });
  }

  return headings;
}

function nearestHeadingBefore(headings, at) {
  var best = null;
  headings.forEach(function (heading) {
    if (heading.at < at && (!best || heading.at > best.at)) best = heading;
  });
  return best ? best.text : null;
}

/* --------------------------------------------------------------------------
   Checks.
   -------------------------------------------------------------------------- */
var pages = findPages(ROOT, []).sort();

if (!pages.length) {
  console.error('No .html files found — nothing to check.');
  process.exit(1);
}

console.log('Canonical list: ' + SERVICES.length + ' services, from docs/TASKS.md');
console.log('Checking ' + pages.length + ' page(s)\n');

var problems = 0;

function report(page, message) {
  problems++;
  console.log('  ' + relative(page));
  console.log('      ' + message);
}

/* A link that made it into the page pointing at the right file.

   Each is tagged with the run it belongs to. A run is a set of service links
   with no ordinary link between them, which is what a list looks like: the
   header dropdown, the footer column, one grid. Order only means anything
   inside a run — the page as a whole is three runs of ten, not one run of
   thirty, so comparing every link to the one before it across run boundaries
   would fail on a page that is entirely correct. */
function serviceLinksOf(html, page) {
  var anchors = anchorsIn(html, page);
  var headings = headingsIn(html);
  var links = [];
  var run = 0;

  anchors.forEach(function (anchor) {
    var index = indexOfFile(anchor.url);

    if (index === -1) {
      /* An ordinary link ends the current run. */
      if (links.length) run++;
      return;
    }

    var label = anchor.text;

    /* A card link says "Learn more", not the service name; its title is the
       heading it sits under. Anything else must be the name itself. */
    var generic = /^Learn more/i.test(label) || label === '';

    links.push({
      run: run,
      index: index,
      expected: SERVICES[index].name,
      label: generic ? nearestHeadingBefore(headings, anchor.at) : label,
      generic: generic
    });
  });

  return links;
}

function runsOf(links) {
  var runs = [];
  links.forEach(function (link) {
    if (!runs.length || runs[runs.length - 1].run !== link.run) runs.push({ run: link.run, links: [] });
    runs[runs.length - 1].links.push(link);
  });
  return runs;
}

pages.forEach(function (page) {
  var html = fs.readFileSync(page, 'utf8');
  var links = serviceLinksOf(html, page);

  if (!links.length) {
    report(page, 'lists no services at all — every page carries the header and footer');
    return;
  }

  /* 2. Wording. */
  links.forEach(function (link) {
    if (link.label === null) {
      report(page, 'a link to ' + SERVICES[link.index].file +
                  ' is labelled "' + (link.generic ? 'Learn more' : link.label) +
                  '" with no heading above it to say which service it is');
    } else if (link.label !== link.expected) {
      report(page, 'a link to ' + SERVICES[link.index].file + ' is labelled "' +
                  link.label + '"; the canonical name is "' + link.expected + '"');
    }
  });

  /* 3. Presence. */
  var seen = {};
  links.forEach(function (link) { seen[link.index] = true; });

  SERVICES.forEach(function (service, index) {
    if (!seen[index]) report(page, 'does not list "' + service.name + '" (' + service.file + ')');
  });

  /* 4. Each run of service links is a list, and every list on the site today
     is meant to be the complete ten in order — the dropdown, the footer, the
     two grids. A list missing an entry is as wrong as one with two entries
     swapped, so both are compared against the canonical sequence.

     When TASK-031 adds "related services", those are deliberately partial
     lists. They will need a marker to opt out, and this check to allow a
     shorter run inside it; until then, a short run is a fault. */
  var expected = SERVICES.map(function (ignore, index) { return index; }).join(',');

  runsOf(links).forEach(function (group) {
    var indices = group.links.map(function (link) { return link.index; });

    if (indices.join(',') === expected) return;

    var sorted = indices.slice().sort(function (a, b) { return a - b; });
    var sameSet = sorted.join(',') === expected;

    if (sameSet) {
      report(page, 'a list of services is out of order — ' +
                  indices.map(function (i) { return i + 1; }).join(', ') +
                  ' where the canonical order is 1, 2, 3, 4, 5, 6, 7, 8, 9, 10');
    } else {
      var absent = SERVICES.filter(function (ignore, index) {
        return indices.indexOf(index) === -1;
      }).map(function (service) { return service.name; });

      report(page, 'a list of services is incomplete — got ' +
                  (indices.length ? indices.map(function (i) { return i + 1; }).join(', ') : 'nothing') +
                  ', missing ' + absent.join(', ') +
                  (indices.length !== sorted.length ? ' (and one repeated)' : ''));
    }
  });
});

console.log('');

if (problems) {
  console.log('FAILED — ' + problems + ' problem(s).');
  console.log('');
  console.log('docs/TASKS.md, "Service list (single source of truth)", is the one');
  console.log('place service names, order and filenames are decided. Correct every');
  console.log('copy to match it, or change it there and then match every copy.');
  process.exit(1);
}

console.log('OK — every copy of the service list matches docs/TASKS.md.');
