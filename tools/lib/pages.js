#!/usr/bin/env node
/* ==========================================================================
   pages.js — shared reading helpers for the check scripts
   ==========================================================================
   Four of the checkers need the same small things: the list of pages, a path
   relative to the site root, HTML entity decoding, and a way to resolve a link
   to where it goes rather than how it is spelled. They live here so the new
   checkers cannot disagree with each other about any of it.

   check-shared.js, check-services.js and check-service-pages.js were written
   before this file and carry their own copies; they are left alone so that a
   change here cannot alter what they already check.

   Usage:
       var pages = require('./lib/pages.js');
       pages.allPages();            // absolute paths, sorted
       pages.relative(file);        // 'services/index.html'
       pages.textOf('<p>a &amp; b</p>');  // 'a & b'
       pages.resolve('services/x.html', 'network-infrastructure.html');
   ========================================================================== */

'use strict';

var fs = require('fs');
var path = require('path');

var canonical = require('./canonical-services.js');

var ROOT = canonical.root;
var SKIP_DIRS = ['node_modules', '.git', '.idea', '.vscode'];

function findPages(dir, found) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
    if (SKIP_DIRS.indexOf(entry.name) !== -1) return;

    var full = path.join(dir, entry.name);
    if (entry.isDirectory()) findPages(full, found);
    else if (entry.name.slice(-5).toLowerCase() === '.html') found.push(full);
  });
  return found;
}

function allPages() {
  return findPages(ROOT, []).sort();
}

function relative(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

/* The entities the site's copy actually uses. */
function decode(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&rarr;/g, '\u2192')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&ldquo;/g, '\u201c')
    .replace(/&rdquo;/g, '\u201d')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'");
}

function textOf(html) {
  return decode(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/* Where a link goes, from the site root. Pages sit at different depths, so the
   same destination is written differently on each; the comparison is about the
   destination. A leading slash is a site-root path too (404.html has to spell
   its links that way), so it normalises to the same thing. */
function resolve(page, url) {
  if (/^(#|https?:|mailto:|tel:|data:)/i.test(url)) return url;
  if (url.indexOf('//') === 0) return url;

  if (url.charAt(0) === '/') return path.posix.normalize(url.replace(/^\/+/, ''));

  var dir = path.dirname(relative(page));
  var prefix = dir === '.' ? '' : dir + '/';
  return path.posix.normalize(prefix + url);
}

/* Every <a>, in document order, with its resolved destination and the text a
   screen reader would read (visible text, or an aria-label, or the alt of an
   image inside it). */
function anchors(html, page) {
  var pattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  var found = [];
  var match;

  while ((match = pattern.exec(html)) !== null) {
    var attributes = match[1];
    var href = /\bhref="([^"]*)"/i.exec(attributes);
    var label = /\baria-label="([^"]*)"/i.exec(attributes);
    var alt = /<img\b[^>]*\balt="([^"]*)"/i.exec(match[2]);

    found.push({
      at: match.index,
      raw: attributes,
      href: href ? href[1] : null,
      url: href ? resolve(page, href[1]) : null,
      text: textOf(match[2]) || (label ? decode(label[1]) : '') || (alt ? alt[1] : ''),
      ariaLabel: label ? decode(label[1]) : null
    });
  }

  return found;
}

/* Every opening tag of a given name, with its attributes as a map. */
function openTags(html, name) {
  var pattern = new RegExp('<' + name + '\\b([^>]*)>', 'gi');
  var found = [];
  var match;

  while ((match = pattern.exec(html)) !== null) {
    var attrs = {};
    var attributePattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"([^"]*)"/g;
    var attribute;

    while ((attribute = attributePattern.exec(match[1])) !== null) {
      attrs[attribute[1].toLowerCase()] = attribute[2];
    }

    found.push({ at: match.index, raw: match[0], attributes: match[1], attrs: attrs });
  }

  return found;
}

function idsIn(html) {
  var ids = {};
  var match;
  var pattern = /\bid="([^"]*)"/gi;

  while ((match = pattern.exec(html)) !== null) {
    ids[match[1]] = (ids[match[1]] || 0) + 1;
  }

  return ids;
}

function countIn(html, pattern) {
  var found = html.match(pattern);
  return found ? found.length : 0;
}

module.exports = {
  root: ROOT,
  allPages: allPages,
  relative: relative,
  decode: decode,
  textOf: textOf,
  resolve: resolve,
  anchors: anchors,
  openTags: openTags,
  idsIn: idsIn,
  countIn: countIn
};
