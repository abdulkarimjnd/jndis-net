#!/usr/bin/env node
/* ==========================================================================
   check-service-pages.js — the service detail page template
   ==========================================================================
   The ten service pages are one template with different words in it. That is
   the point of them: a visitor who has read one should be able to find the
   same things in the same places on the next, and a missing band or a band
   that lost its background is the kind of thing that is invisible in a diff
   and obvious on the page.

   This script checks the shape of every file in services/ except the hub
   itself, against the template:

     1. The file is one of the ten in docs/TASKS.md.
     2. The <title> leads with the canonical service name, and there is a
        meta description.
     3. Exactly one <h1>, and it is the canonical name.
     4. Headings never skip a level.
     5. The breadcrumb is Home / Services / this service, three items, and the
        last one is marked as the current page.
     6. Eight bands, in order, each with the background it is supposed to have
        and the heading its aria-labelledby points at.
     7. Every id is unique and every aria-labelledby resolves.
     8. The FAQ is a [data-faq] container of <details> items, each with an id,
        a question and an answer.
     9. Four numbered process steps, a what's-included list, three benefits.
    10. The closing band is the call to action, with a primary button that
        leads somewhere.
    11. The page loads the script that opens a FAQ answer from a link.

   The service NAMES, ORDER and FILENAMES are not checked here — that is
   tools/check-services.js, which holds every copy on every page against
   docs/TASKS.md. What is left for this script is the template.

   Usage:
       node tools/check-service-pages.js

   Exit 0 = every detail page matches the template.  Exit 1 = drift found.
   ========================================================================== */

'use strict';

var fs = require('fs');
var path = require('path');

var canonical = require('./lib/canonical-services.js');

var ROOT = canonical.root;
var SERVICES = canonical.read();
var DIRECTORY = path.join(ROOT, 'services');

/* --------------------------------------------------------------------------
   The template.
   -------------------------------------------------------------------------- */

/* The eight bands, in the order they appear. "backgrounds" is asserted as an
   exact set, not a subset, so a band cannot quietly gain or lose one and break
   the alternation that separates them. */
var BANDS = [
  { name: 'page header',      backgrounds: ['bg-surface'],    heading: null,               holds: 'the h1' },
  { name: 'overview',         backgrounds: [],                heading: 'overview-heading', holds: 'the overview' },
  { name: "what's included",  backgrounds: ['bg-surface'],    heading: 'included-heading', holds: "the what's-included list" },
  { name: 'how we work',      backgrounds: [],                heading: 'process-heading',  holds: 'the process steps' },
  { name: 'benefits',         backgrounds: ['bg-surface'],    heading: 'benefits-heading', holds: 'the benefits' },
  { name: 'faq',              backgrounds: [],                heading: 'faq-heading',      holds: 'the FAQ' },
  { name: 'related services', backgrounds: ['bg-surface'],    heading: 'related-heading',  holds: 'related services and the pager' },
  { name: 'call to action',   backgrounds: ['bg-grad-modern'], heading: 'cta-heading',     holds: 'the call to action' }
];

var BACKGROUNDS = ['bg-surface', 'bg-grad-modern', 'bg-grad-primary', 'bg-white'];

var PROCESS_STEPS = 4;
var BENEFITS = 3;
var LEAST_INCLUDED = 4;
var LEAST_FAQ = 3;

/* --------------------------------------------------------------------------
   Reading the pages.
   -------------------------------------------------------------------------- */
function detailPages() {
  var found = [];

  fs.readdirSync(DIRECTORY, { withFileTypes: true }).forEach(function (entry) {
    if (!entry.isFile()) return;
    if (entry.name === 'index.html') return;          /* the hub, not a detail page */
    if (entry.name.slice(-5).toLowerCase() !== '.html') return;
    found.push(path.join(DIRECTORY, entry.name));
  });

  return found.sort();
}

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

function classesOf(raw) {
  return raw ? raw.split(/\s+/).filter(Boolean) : [];
}

function countIn(html, pattern) {
  var found = html.match(pattern);
  return found ? found.length : 0;
}

/* Every <section> with the attributes this template actually varies, and where
   it ends. Sections do not nest here, so one runs until the next one starts. */
function sectionsIn(html) {
  var pattern = /<section\b([^>]*)>/gi;
  var mainEnd = html.indexOf('</main>');
  var sections = [];
  var match;

  while ((match = pattern.exec(html)) !== null) {
    var classAttribute = /\bclass="([^"]*)"/i.exec(match[1]);
    var labelAttribute = /\baria-labelledby="([^"]*)"/i.exec(match[1]);

    sections.push({
      at: match.index,
      to: html.length,
      classes: classesOf(classAttribute ? classAttribute[1] : ''),
      labelledby: labelAttribute ? labelAttribute[1] : null
    });
  }

  sections.forEach(function (section, position) {
    var next = position + 1 < sections.length ? sections[position + 1].at : mainEnd;
    section.to = next === -1 ? html.length : next;
  });

  return sections;
}

function idsIn(html) {
  var pattern = /\bid="([^"]*)"/gi;
  var ids = {};
  var match;

  while ((match = pattern.exec(html)) !== null) {
    ids[match[1]] = (ids[match[1]] || 0) + 1;
  }

  return ids;
}

/* --------------------------------------------------------------------------
   Checks.
   -------------------------------------------------------------------------- */
var pages = detailPages();

if (!pages.length) {
  console.error('No service detail pages found in services/ — nothing to check.');
  process.exit(1);
}

console.log('Checking ' + pages.length + ' service detail page(s)');
console.log('Template: ' + BANDS.length + ' bands, ' + PROCESS_STEPS +
            ' process steps, ' + BENEFITS + ' benefits\n');

var problems = 0;

function fail(where, message) {
  problems++;
  console.log('  ' + where);
  console.log('      ' + message);
}

pages.forEach(function (page) {
  var name = path.basename(page);
  var where = 'services/' + name;
  var html = fs.readFileSync(page, 'utf8');

  /* 1. Which service is this page about? */
  var own = -1;
  SERVICES.forEach(function (service, index) {
    if (service.file === where) own = index;
  });

  if (own === -1) {
    fail(where, 'is not one of the ten services in docs/TASKS.md');
    return;
  }

  var service = SERVICES[own];

  /* 2. Title and description. */
  var title = /<title>([\s\S]*?)<\/title>/i.exec(html);
  if (!title) {
    fail(where, 'has no <title>');
  } else if (textOf(title[1]).indexOf(service.name) !== 0) {
    fail(where, 'the title starts "' + textOf(title[1]).slice(0, 40) +
                '"; it should lead with the canonical name "' + service.name + '"');
  }

  var description = /<meta\s+name="description"\s+content="([^"]*)"/i.exec(html);
  if (!description || description[1].trim().length < 50) {
    fail(where, 'the meta description is missing or too short to be useful');
  }

  /* 3. One <h1>, and it is the service. */
  var h1s = html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) || [];

  if (h1s.length !== 1) {
    fail(where, 'has ' + h1s.length + ' <h1> elements; there must be exactly one');
  } else if (textOf(h1s[0]) !== service.name) {
    fail(where, 'the <h1> reads "' + textOf(h1s[0]) +
                '"; the canonical name is "' + service.name + '"');
  }

  /* 4. Headings never skip a level. */
  var headingPattern = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  var heading = null;
  var previous = 0;

  while ((heading = headingPattern.exec(html)) !== null) {
    var level = Number(heading[1]);

    if (previous && level > previous + 1) {
      fail(where, 'an <h' + level + '> ("' + textOf(heading[2]).slice(0, 40) +
                  '") follows an <h' + previous + '>, skipping a level');
    }
    previous = level;
  }

  /* 5. The breadcrumb. */
  var breadcrumb = /<nav\b[^>]*aria-label="Breadcrumb"[^>]*>([\s\S]*?)<\/nav>/i.exec(html);

  if (!breadcrumb) {
    fail(where, 'has no <nav aria-label="Breadcrumb">');
  } else {
    var crumbs = [];
    var itemPattern = /<li\b([^>]*)>([\s\S]*?)<\/li>/gi;
    var item;

    while ((item = itemPattern.exec(breadcrumb[1])) !== null) {
      crumbs.push({
        classes: classesOf((/\bclass="([^"]*)"/i.exec(item[1]) || [])[1] || ''),
        attributes: item[1],
        text: textOf(item[2]),
        html: item[2]
      });
    }

    var wanted = ['Home', 'Services', service.name];

    if (crumbs.length !== wanted.length) {
      fail(where, 'the breadcrumb has ' + crumbs.length + ' items; this template has three');
    } else {
      crumbs.forEach(function (crumb, position) {
        if (crumb.text !== wanted[position]) {
          fail(where, 'breadcrumb item ' + (position + 1) + ' reads "' + crumb.text +
                      '"; it should read "' + wanted[position] + '"');
        }
        if (crumb.classes.indexOf('breadcrumb-item') === -1) {
          fail(where, 'breadcrumb item ' + (position + 1) + ' is not a .breadcrumb-item');
        }
      });

      var last = crumbs[crumbs.length - 1];

      if (last.classes.indexOf('active') === -1 || !/aria-current="page"/.test(last.attributes)) {
        fail(where, 'the breadcrumb does not mark the last item as the current page');
      }

      if (!/href="\.\.\/index\.html"/.test(crumbs[0].html)) {
        fail(where, 'the breadcrumb\'s Home does not link to ../index.html');
      }
      if (!/href="index\.html"/.test(crumbs[1].html)) {
        fail(where, 'the breadcrumb\'s Services does not link to the hub');
      }
    }
  }

  /* 6. The bands. */
  var sections = sectionsIn(html);

  if (sections.length !== BANDS.length) {
    fail(where, 'has ' + sections.length + ' bands; the template has ' + BANDS.length +
                ' (' + BANDS.map(function (band) { return band.name; }).join(', ') + ')');
  }

  BANDS.forEach(function (band, position) {
    var section = sections[position];
    if (!section) return;

    var backgrounds = section.classes.filter(function (className) {
      return BACKGROUNDS.indexOf(className) !== -1;
    });

    if (backgrounds.join(' ') !== band.backgrounds.join(' ')) {
      fail(where, 'band ' + (position + 1) + ' (' + band.name + ') has ' +
                  (backgrounds.length ? 'the background "' + backgrounds.join(' ') + '"'
                                      : 'no background class') +
                  '; it should have ' + (band.backgrounds.length
                    ? '"' + band.backgrounds.join(' ') + '"' : 'none'));
    }

    if (band.heading === null) {
      if (section.labelledby !== null) {
        fail(where, 'band ' + (position + 1) + ' (' + band.name + ') has an ' +
                    'aria-labelledby; it is labelled by its h1 instead');
      }
      if (!/<h1\b/i.test(html.slice(section.at, section.to))) {
        fail(where, 'band 1 (page header) does not carry ' + band.holds);
      }
      return;
    }

    if (section.labelledby !== band.heading) {
      fail(where, 'band ' + (position + 1) + ' (' + band.name + ') is labelled by "' +
                  (section.labelledby || 'nothing') + '"; the template uses "' +
                  band.heading + '"');
      return;
    }

    if (!(new RegExp('<h2\\b[^>]*\\bid="' + band.heading + '"').test(html))) {
      fail(where, 'band ' + (position + 1) + ' (' + band.name + ') has no <h2 id="' +
                  band.heading + '">');
    }
  });

  /* 7. Ids, and the attributes that point at them. */
  var ids = idsIn(html);

  Object.keys(ids).forEach(function (id) {
    if (ids[id] > 1) fail(where, 'the id "' + id + '" is used ' + ids[id] + ' times');
  });

  var referencePattern = /\baria-(?:labelledby|describedby)="([^"]*)"/gi;
  var reference;

  while ((reference = referencePattern.exec(html)) !== null) {
    reference[1].split(/\s+/).filter(Boolean).forEach(function (id) {
      if (!ids[id]) {
        fail(where, 'aria-labelledby/describedby points at "' + id + '", which is not on the page');
      }
    });
  }

  /* 8. The FAQ. */
  var faqBand = sections[5];
  if (faqBand) {
    var faq = html.slice(faqBand.at, faqBand.to);
    var items = countIn(faq, /<details\b/gi);

    if (!/data-faq/.test(faq)) {
      fail(where, 'the FAQ has no [data-faq] container, so a link cannot open an answer');
    }
    if (items < LEAST_FAQ) {
      fail(where, 'the FAQ has ' + items + ' questions; the template asks at least ' + LEAST_FAQ);
    }
    if (countIn(faq, /\bclass="faq-item"/gi) !== items) {
      fail(where, 'the FAQ has ' + countIn(faq, /\bclass="faq-item"/gi) +
                  ' .faq-item(s) for ' + items + ' <details>');
    }
    if (countIn(faq, /<summary\b/gi) !== items) {
      fail(where, 'the FAQ has ' + countIn(faq, /<summary\b/gi) +
                  ' <summary> element(s) for ' + items + ' <details>');
    }
    if (countIn(faq, /\bclass="faq-answer"/gi) !== items) {
      fail(where, 'the FAQ has ' + countIn(faq, /\bclass="faq-answer"/gi) +
                  ' answer(s) for ' + items + ' <details>');
    }

    var details = faq.match(/<details\b[^>]*>/gi) || [];
    details.forEach(function (tag) {
      if (!/\bid="/.test(tag)) {
        fail(where, 'a FAQ question has no id, so nothing can link to its answer');
      }
    });
  }

  /* 9. The three content lists. */
  var includedBand = sections[2];
  if (includedBand) {
    var included = html.slice(includedBand.at, includedBand.to);
    var entries = countIn(included, /<li\b/gi);
    var ticks = countIn(included, /flex-shrink-0/gi);

    if (entries < LEAST_INCLUDED) {
      fail(where, "the what's-included list has " + entries + ' entries; the template shows at least ' + LEAST_INCLUDED);
    }
    if (ticks !== entries) {
      fail(where, "the what's-included list has " + ticks + ' tick icon(s) for ' + entries + ' entries');
    }
  }

  var processBand = sections[3];
  if (processBand) {
    var process = html.slice(processBand.at, processBand.to);

    if (countIn(process, /\bclass="process-step\b/gi) !== PROCESS_STEPS) {
      fail(where, 'the process list has ' + countIn(process, /\bclass="process-step\b/gi) +
                  ' steps; the template has ' + PROCESS_STEPS);
    }
    if (countIn(process, /\bclass="process-number"/gi) !== PROCESS_STEPS) {
      fail(where, 'the process list has ' + countIn(process, /\bclass="process-number"/gi) +
                  ' numerals for ' + PROCESS_STEPS + ' steps');
    }
    if (countIn(process, /<h3\b/gi) !== PROCESS_STEPS) {
      fail(where, 'the process list has ' + countIn(process, /<h3\b/gi) +
                  ' step headings; the template has ' + PROCESS_STEPS);
    }
  }

  var benefitsBand = sections[4];
  if (benefitsBand) {
    var benefits = html.slice(benefitsBand.at, benefitsBand.to);

    if (countIn(benefits, /\bcol-lg-4\b/gi) !== BENEFITS) {
      fail(where, 'the benefits band has ' + countIn(benefits, /\bcol-lg-4\b/gi) +
                  ' columns; the template has ' + BENEFITS);
    }
    if (countIn(benefits, /<h3\b/gi) !== BENEFITS) {
      fail(where, 'the benefits band has ' + countIn(benefits, /<h3\b/gi) +
                  ' headings; the template has ' + BENEFITS);
    }
  }

  /* 10. The closing call to action. */
  var ctaBand = sections[7];
  if (ctaBand) {
    var cta = html.slice(ctaBand.at, ctaBand.to);

    if (!/class="btn btn-primary"/.test(cta)) {
      fail(where, 'the call to action has no primary button');
    }
    if (!/href="\.\.\/contact\.html"/.test(cta)) {
      fail(where, 'the call to action does not lead to ../contact.html');
    }
  }

  /* 11. The pager, and the script that opens a FAQ answer from a link. */
  var relatedBand = sections[6];
  if (relatedBand) {
    var related = html.slice(relatedBand.at, relatedBand.to);
    var pager = /<nav\b[^>]*aria-label="Service pagination"[^>]*>([\s\S]*?)<\/nav>/i.exec(related);

    if (!pager) {
      fail(where, 'has no <nav aria-label="Service pagination">');
    } else {
      if (!/rel="prev"/.test(pager[1])) fail(where, 'the pager has no rel="prev" link');
      if (!/rel="next"/.test(pager[1])) fail(where, 'the pager has no rel="next" link');
    }
  }

  if (html.indexOf('src="../assets/js/service-page.js"') === -1) {
    fail(where, 'does not load ../assets/js/service-page.js');
  }
});

console.log('');

if (problems) {
  console.log('FAILED — ' + problems + ' problem(s).');
  console.log('');
  console.log('The template is described in docs/DESIGN.md, "Service detail page".');
  console.log('Copy an existing page and change the words, or change the template in');
  console.log('docs/DESIGN.md and every page together.');
  process.exit(1);
}

console.log('OK — every service detail page matches the template.');
