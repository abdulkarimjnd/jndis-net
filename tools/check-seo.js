#!/usr/bin/env node
/* ==========================================================================
   check-seo.js — the SEO basics, as far as a script can take them
   ==========================================================================
   TASK-038 asks for titles, meta descriptions, Open Graph and the two files a
   crawler looks for (sitemap.xml and robots.txt). None of that is visible on
   the rendered page, so nothing else in the toolchain would notice if it went
   missing: a page can look perfect and still be invisible in search, or show
   up as a bare blue link with no description because the head was never filled
   in. This script makes that failure loud.

     Per page
       1. A title, of a length that search engines actually show (15-70).
       2. A meta description, likewise (70-160).
       3. Titles and descriptions are unique across the site — two pages
          competing for the same words is a cost, not a duplicate to pass.
       4. A canonical URL, absolute against the live domain and derived from
          the page's own path so the two cannot disagree. 404.html is exempt:
          a 404 is not a destination and has nothing to name as its own.
       5. The Open Graph set: type, site name, locale, url (matching the
          canonical), title, description, and a 1200x630 share image with alt.
       6. The Twitter/X set: title, description and image.
       7. A favicon and a theme colour.

     The site
       8. sitemap.xml lists exactly the indexable pages — every page except the
          404 — with absolute https://jndis.net URLs.
       9. robots.txt allows crawling and points at the sitemap.

   What it cannot check: whether the words are any good, and whether a crawler
   ranks them. See docs/QUALITY.md for the part that is a human judgement.

   Usage:
       node tools/check-seo.js

   Exit 0 = the machine-checkable half of the SEO pass is clean.  Exit 1 = a problem.
   ========================================================================== */

'use strict';

var fs = require('fs');
var path = require('path');
var pages = require('./lib/pages.js');

var ROOT = pages.root;
var SITE = 'https://jndis.net';

/* Every page starts with the same tags; these are the lengths search engines
   are known to render before they cut the text off. */
var TITLE_MIN = 15;
var TITLE_MAX = 70;
var DESC_MIN = 70;
var DESC_MAX = 160;

var problems = 0;

function fail(where, message) {
  problems++;
  console.log('  ' + where);
  console.log('      ' + message);
}

/* The one address this page should be indexed at, from its own path: the home
   page is the root, everything else is its filename below the root. */
function canonicalFor(rel) {
  return rel === 'index.html' ? SITE + '/' : SITE + '/' + rel;
}

function attribute(html, pattern) {
  var match = pattern.exec(html);
  return match ? pages.decode(match[1]) : null;
}

var TITLE = /<title>([\s\S]*?)<\/title>/i;
var DESCRIPTION = /<meta\s+name="description"\s+content="([^"]*)"/i;
var CANONICAL = /<link\s+rel="canonical"\s+href="([^"]*)"/i;
var OG = function (property) {
  return new RegExp('<meta\\s+property="og:' + property + '"\\s+content="([^"]*)"', 'i');
};
var TWITTER = function (name) {
  return new RegExp('<meta\\s+name="twitter:' + name + '"\\s+content="([^"]*)"', 'i');
};

var ALL_PAGES = pages.allPages();
var INDEXABLE = ALL_PAGES.filter(function (file) {
  return pages.relative(file) !== '404.html';
});

console.log('Checking ' + ALL_PAGES.length + ' page(s) for SEO\n');

var seenTitles = {};
var seenDescriptions = {};

ALL_PAGES.forEach(function (file) {
  var rel = pages.relative(file);
  var html = fs.readFileSync(file, 'utf8');
  var is404 = rel === '404.html';

  /* 1. Title. */
  var title = attribute(html, TITLE);
  if (!title) {
    fail(rel, 'has no <title>');
  } else {
    if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
      fail(rel, 'the title is ' + title.length + ' characters; keep it between '
                 + TITLE_MIN + ' and ' + TITLE_MAX + ' so search results show it whole');
    }
    if (seenTitles[title]) fail(rel, 'the title is the same as ' + seenTitles[title]);
    else seenTitles[title] = rel;
  }

  /* 2. Description. */
  var description = attribute(html, DESCRIPTION);
  if (!description) {
    fail(rel, 'has no meta description, so search results invent their own');
  } else {
    if (description.length < DESC_MIN) {
      fail(rel, 'the meta description is only ' + description.length + ' characters; ' +
                 'aim for at least ' + DESC_MIN);
    }
    if (description.length > DESC_MAX) {
      fail(rel, 'the meta description is ' + description.length + ' characters; search ' +
                 'engines cut it off past ' + DESC_MAX);
    }
    if (seenDescriptions[description]) {
      fail(rel, 'the meta description is the same as ' + seenDescriptions[description]);
    } else {
      seenDescriptions[description] = rel;
    }
  }

  /* 3. Canonical, everything except the 404. */
  var canonical = attribute(html, CANONICAL);
  if (is404) {
    if (canonical) {
      fail(rel, 'is a 404 and must not carry a canonical URL (there is no address to claim)');
    }
  } else if (!canonical) {
    fail(rel, 'has no <link rel="canonical">, so a crawler is left to guess the address');
  } else {
    var expected = canonicalFor(rel);
    if (canonical !== expected) {
      fail(rel, 'the canonical URL is "' + canonical + '"; from the file\'s own path it '
                 + 'should be "' + expected + '"');
    }
  }

  /* 4. Open Graph. */
  var ogUrl = attribute(html, OG('url'));
  if (is404) {
    if (ogUrl) fail(rel, 'is a 404 and should carry no og:url for the same reason as canonical');
  } else if (!ogUrl) {
    fail(rel, 'has no og:url');
  } else if (ogUrl !== canonicalFor(rel)) {
    fail(rel, 'og:url ("' + ogUrl + '") does not match the canonical URL');
  }

  if (attribute(html, OG('type')) !== 'website') fail(rel, 'og:type should be "website"');
  if (!attribute(html, OG('site_name'))) fail(rel, 'has no og:site_name');
  if (!attribute(html, OG('locale'))) fail(rel, 'has no og:locale');
  if (!attribute(html, OG('title'))) fail(rel, 'has no og:title');
  if (!attribute(html, OG('description'))) fail(rel, 'has no og:description');

  var image = attribute(html, OG('image'));
  if (!image) {
    fail(rel, 'has no og:image, so a shared link shows no card');
  } else if (!/^https:\/\//.test(image)) {
    fail(rel, 'og:image ("' + image + '") must be an absolute https URL for a scraper to fetch it');
  } else if (!fs.existsSync(path.join(ROOT, image.replace(SITE + '/', '')))) {
    fail(rel, 'og:image points at "' + image + '", which is not in the repository');
  }
  if (attribute(html, OG('image:width')) !== '1200'
      || attribute(html, OG('image:height')) !== '630') {
    fail(rel, 'og:image should declare width 1200 and height 630');
  }
  if (!attribute(html, OG('image:alt'))) fail(rel, 'has no og:image:alt');

  /* 5. Twitter / X. */
  ['title', 'description', 'image'].forEach(function (tag) {
    if (!attribute(html, TWITTER(tag))) fail(rel, 'has no twitter:' + tag);
  });

  /* 6. Favicon and theme colour. */
  if (!/<link\b[^>]*rel="icon"/i.test(html)) fail(rel, 'has no favicon link');
  if (!/<meta\s+name="theme-color"/i.test(html)) fail(rel, 'has no theme-color, so a phone tab is untinted');
});

/* ---------------------------------------------------------------- the files */

console.log('\nSitemap and robots.txt\n');

var sitemapPath = path.join(ROOT, 'sitemap.xml');
var robotsPath = path.join(ROOT, 'robots.txt');

if (!fs.existsSync(sitemapPath)) {
  fail('sitemap.xml', 'does not exist, so a crawler has no list to work from');
} else {
  var sitemap = fs.readFileSync(sitemapPath, 'utf8');
  var listed = (sitemap.match(/<loc>([^<]+)<\/loc>/g) || []).map(function (loc) {
    return loc.replace(/<\/?loc>/g, '').trim();
  });

  var expected = INDEXABLE.map(function (file) {
    return canonicalFor(pages.relative(file));
  }).sort();

  var listedSorted = listed.slice().sort();

  expected.forEach(function (url) {
    if (listedSorted.indexOf(url) === -1) fail('sitemap.xml', 'does not list ' + url);
  });
  listed.forEach(function (url) {
    if (expected.indexOf(url) === -1) {
      fail('sitemap.xml', 'lists ' + url + ', which is not an indexable page');
    }
    if (!/^https:\/\//.test(url)) fail('sitemap.xml', 'lists a URL that is not absolute https: ' + url);
  });
  if (listed.length !== expected.length) {
    fail('sitemap.xml', 'lists ' + listed.length + ' URL(s); there are ' + expected.length
                        + ' indexable page(s)');
  }
  if (listed.indexOf(SITE + '/404.html') !== -1) {
    fail('sitemap.xml', 'lists the 404 page, which is not a destination');
  }
}

if (!fs.existsSync(robotsPath)) {
  fail('robots.txt', 'does not exist');
} else {
  var robots = fs.readFileSync(robotsPath, 'utf8');
  if (!/^Sitemap:\s*https:\/\/jndis\.net\/sitemap\.xml\s*$/m.test(robots)) {
    fail('robots.txt', 'does not point at https://jndis.net/sitemap.xml');
  }
  if (/^Disallow:\s*\/\s*$/m.test(robots) && !/^Allow:\s*\/\s*$/m.test(robots)) {
    fail('robots.txt', 'disallows the whole site');
  }
}

console.log('');

if (problems) {
  console.log('FAILED — ' + problems + ' problem(s).');
  console.log('');
  console.log('The head every page should carry is described in docs/QUALITY.md and');
  console.log('docs/DESIGN.md. Fix the tag, or change the rule in this file and every');
  console.log('page together.');
  process.exit(1);
}

console.log('OK — titles, descriptions, Open Graph, sitemap and robots are in place.');
