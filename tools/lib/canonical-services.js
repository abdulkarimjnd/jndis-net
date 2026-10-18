#!/usr/bin/env node
/* ==========================================================================
   canonical-services.js — the service list, read from docs/TASKS.md
   ==========================================================================
   docs/TASKS.md holds the one canonical service list: name, order and
   filename. Two checkers need it (check-services.js compares every copy of the
   list against it, check-service-pages.js checks that a detail page's own
   heading and breadcrumb agree with it), so it is parsed in one place.

   The list lives in the table under this heading:

       ## Service list (single source of truth)

   Usage:
       var canonical = require('./lib/canonical-services.js');
       var SERVICES = canonical.read();   // [{ name: '…', file: 'services/…' }]
       var ROOT = canonical.root;         // the repository root

   read() reports to stderr and exits 1 if the table is missing or empty: with
   no list there is nothing for either checker to be right about, and quietly
   comparing against an empty list would report success.
   ========================================================================== */

'use strict';

var fs = require('fs');
var path = require('path');

var ROOT = path.resolve(__dirname, '..', '..');
var TASKS = path.join(ROOT, 'docs', 'TASKS.md');
var HEADING = '## Service list (single source of truth)';

function read() {
  var markdown;

  try {
    markdown = fs.readFileSync(TASKS, 'utf8');
  } catch (err) {
    console.error('Could not read docs/TASKS.md — ' + err.message);
    process.exit(1);
  }

  var at = markdown.indexOf(HEADING);
  if (at === -1) {
    console.error('Could not find "' + HEADING + '" in docs/TASKS.md.');
    process.exit(1);
  }

  /* Stop at the horizontal rule that closes the section, so a later table
     cannot be mistaken for this one. */
  var section = markdown.slice(at + HEADING.length).split('\n---')[0];

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

module.exports = { root: ROOT, read: read };
