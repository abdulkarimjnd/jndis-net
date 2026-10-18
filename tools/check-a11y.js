#!/usr/bin/env node
/* ==========================================================================
   check-a11y.js — the accessibility pass, as far as a script can take it
   ==========================================================================
   TASK-037 asks for a pass over contrast, labels, focus states, alt text and
   landmarks. Some of that only a screen reader or a keyboard can test; the
   rest is a property of the markup and the stylesheet and is checked here:

     Markup, on every page
       1. <html lang> and a non-empty <title>.
       2. Exactly one <h1>, and headings that never skip a level going down.
       3. Every <img> has an alt attribute (empty is fine — that is how a
          decorative image is marked).
       4. Every form control has an accessible name: a <label for>, or an
          aria-label / aria-labelledby. Hidden buttons and hidden inputs are
          exempt, as the spec says.
       5. Every inline <svg> is either aria-hidden or carries a name, so an
          icon is not announced as an unlabelled graphic.
       6. Every link and button has discernible text (visible text, an
          aria-label, or the alt of an image inside it).
       7. Every aria-labelledby / aria-describedby / aria-controls points at an
          id that exists on the same page.
       8. No positive tabindex (it hijacks the tab order).
       9. A skip link whose target exists and can genuinely take focus.
      10. Landmarks: one <main>, and a header, footer and nav.
      11. No duplicate id, which would break label and aria references.

     Stylesheet
      12. A visible :focus-visible ring on links and buttons, and no rule that
          simply removes the outline.
      13. A prefers-reduced-motion block.

     Contrast
      14. The token pairs DESIGN.md depends on are recomputed from the values
          in jnd.css and asserted against the WCAG threshold. This is the part
          that catches a palette change quietly breaking a ratio that was
          measured once by hand.

   Usage:
       node tools/check-a11y.js

   Exit 0 = the machine-checkable half of the pass is clean.  Exit 1 = a problem.
   ========================================================================== */

'use strict';

var fs = require('fs');
var pages = require('./lib/pages.js');

var ROOT = pages.root;
var ALL_PAGES = pages.allPages();

var problems = 0;

function fail(where, message) {
  problems++;
  console.log('  ' + where);
  console.log('      ' + message);
}

/* ---------------------------------------------------------------- contrast --
   WCAG 2.x relative luminance and contrast ratio. Tokens are read from the
   stylesheet rather than copied, so the two cannot drift. */

function luminance(hex) {
  var value = hex.replace('#', '');
  if (value.length === 3) {
    value = value.split('').map(function (c) { return c + c; }).join('');
  }
  var channels = [0, 2, 4].map(function (i) {
    var c = parseInt(value.substr(i, 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a, b) {
  var la = luminance(a);
  var lb = luminance(b);
  var hi = Math.max(la, lb);
  var lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

function ratio(a, b) {
  return Math.round(contrast(a, b) * 100) / 100;
}

var css = fs.readFileSync(ROOT + '/assets/css/jnd.css', 'utf8');

/* Comments quote ratios and colour names; scanning them would be a disaster. */
var cssRules = css.replace(/\/\*[\s\S]*?\*\//g, '');

var tokens = {};
var tokenPattern = /--jnd-([a-z]+)\s*:\s*(#[0-9A-Fa-f]{3,6})/g;
var tokenMatch;

while ((tokenMatch = tokenPattern.exec(cssRules)) !== null) {
  tokens[tokenMatch[1]] = tokenMatch[2];
}

var WHITE = '#FFFFFF';

/* label, foreground, background, and what the ratio must be.
   `max` marks a pair that must stay BELOW a threshold — the ones DESIGN.md
   uses for emphasis only, never as a text background. */
var CONTRAST_RULES = [
  ['white on primary (buttons, hero text)',        WHITE,      'primary',   4.5, null],
  ['white on secondary (headings, skip link)',     WHITE,      'secondary', 4.5, null],
  ['white on midblue (gradient endpoint, worst case)', WHITE,   'midblue',   4.5, null],
  ['primary on white (links, body on cards)',      'primary',  WHITE,       4.5, null],
  ['primary on surface (links on alternate band)','primary',  'surface',   4.5, null],
  ['midblue on white (link hover)',                'midblue',  WHITE,       4.5, null],
  ['ink on white (body text)',                     'ink',      WHITE,       4.5, null],
  ['ink on surface (body on alternate band)',      'ink',      'surface',   4.5, null],
  ['secondary ring on white (focus indicator)',    'secondary', WHITE,      3.0, null],
  ['white ring on secondary (focus indicator)',    WHITE,      'secondary', 3.0, null],
  ['white on accent — must stay a NON-text colour', WHITE,     'accent',    null, 3.0],
  ['white on highlight — must stay a NON-text colour', WHITE,  'highlight', null, 3.0],
  ['highlight on primary — why it is not body text', 'highlight', 'primary', null, 4.5]
];

function token(name) {
  if (name.charAt(0) === '#') return name; /* a literal, e.g. white */
  if (!tokens[name]) {
    fail('assets/css/jnd.css', 'no --jnd-' + name + ' token to check contrast against');
    return '#000000';
  }
  return tokens[name];
}

/* Inline <svg>s, with whether each is hidden from assistive tech. A decorative
   icon is often marked on its wrapper (<div class="card-icon" aria-hidden="true">)
   rather than on the svg itself, so this walks the tags and remembers whether an
   ancestor is hidden rather than looking at the svg tag alone. Elements that
   cannot contain an icon are ignored, and `<svg>` is treated as a leaf, so its
   own <path>/<rect> children are not mistaken for markup. */
var CONTAINERS = ['html', 'body', 'div', 'section', 'span', 'main', 'header', 'footer',
  'nav', 'article', 'aside', 'form', 'label', 'p', 'li', 'ul', 'ol', 'a', 'button',
  'figure', 'figcaption', 'blockquote', 'details', 'summary', 'table', 'thead',
  'tbody', 'tr', 'td', 'th', 'caption', 'dl', 'dt', 'dd',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

function svgReports(html) {
  var tagPattern = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*?)(\/?)>/g;
  var stack = [];
  var found = [];
  var match;

  while ((match = tagPattern.exec(html)) !== null) {
    var closing = match[1] === '/';
    var name = match[2].toLowerCase();
    var attrs = match[3];
    var selfClosing = match[4] === '/';
    var ancestorHidden = stack.length ? stack[stack.length - 1].hidden : false;

    if (name === 'svg' && !closing) {
      found.push({
        hidden: ancestorHidden || /aria-hidden="true"/i.test(attrs),
        named: /aria-label="/i.test(attrs) || /aria-labelledby="/i.test(attrs) || /role="img"/i.test(attrs)
      });
      continue;
    }

    if (CONTAINERS.indexOf(name) === -1) continue;

    if (closing) {
      for (var i = stack.length - 1; i >= 0; i--) {
        if (stack[i].name === name) { stack.length = i; break; }
      }
    } else if (!selfClosing) {
      stack.push({ name: name, hidden: ancestorHidden || /aria-hidden="true"/i.test(attrs) });
    }
  }

  return found;
}

/* ---------------------------------------------------------------- the pages */

console.log('Checking ' + ALL_PAGES.length + ' page(s) for accessibility wiring\n');

var LANG = /<html\b[^>]*\blang="([^"]*)"/i;
var TITLE = /<title>([\s\S]*?)<\/title>/i;
var SKIP_LINK = /<a\b[^>]*class="[^"]*\bskip-link\b[^"]*"[^>]*href="([^"]*)"/i;

ALL_PAGES.forEach(function (file) {
  var page = pages.relative(file);
  var html = fs.readFileSync(file, 'utf8');
  var ids = pages.idsIn(html);

  /* 1. Language and title. */
  var lang = LANG.exec(html);
  if (!lang) fail(page, '<html> has no lang attribute, so a screen reader cannot pick a voice');
  else if (!/^en\b/i.test(lang[1])) fail(page, '<html lang="' + lang[1] + '"> — should be en');

  var title = TITLE.exec(html);
  if (!title || !title[1].trim()) fail(page, 'has no <title>');

  /* 2. Headings. */
  var headings = [];
  var headingPattern = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  var heading;
  while ((heading = headingPattern.exec(html)) !== null) {
    headings.push({ level: Number(heading[1]), text: pages.textOf(heading[2]) });
  }

  var h1Count = headings.filter(function (h) { return h.level === 1; }).length;
  if (h1Count !== 1) fail(page, 'has ' + h1Count + ' <h1> element(s); exactly one is required');

  var previous = 0;
  headings.forEach(function (h) {
    if (previous && h.level > previous + 1) {
      fail(page, 'headings jump from <h' + previous + '> to <h' + h.level + '> at "'
                 + h.text.slice(0, 40) + '" — a level is skipped');
    }
    previous = h.level;
  });

  /* 3. Images. */
  pages.openTags(html, 'img').forEach(function (img) {
    if (!('alt' in img.attrs)) {
      fail(page, 'an <img> (' + (img.attrs.src || 'no src') + ') has no alt attribute');
    }
  });

  /* 4. Form controls have names. */
  var labelsFor = {};
  pages.openTags(html, 'label').forEach(function (label) {
    if (label.attrs.for) labelsFor[label.attrs.for] = true;
  });

  ['input', 'select', 'textarea'].forEach(function (name) {
    pages.openTags(html, name).forEach(function (control) {
      var type = (control.attrs.type || '').toLowerCase();
      if (name === 'input' && ['hidden', 'submit', 'button', 'reset', 'image'].indexOf(type) !== -1) return;

      var named = (control.attrs.id && labelsFor[control.attrs.id])
        || control.attrs['aria-label']
        || control.attrs['aria-labelledby'];

      if (!named) {
        fail(page, 'a <' + name + '>' + (control.attrs.id ? ' (#' + control.attrs.id + ')' : '')
                   + ' has no <label for> and no aria-label');
      }
    });
  });

  /* 5. Inline SVGs are hidden or named. */
  svgReports(html).forEach(function (svg) {
    if (!svg.hidden && !svg.named) {
      fail(page, 'an inline <svg> is neither aria-hidden (on itself or a wrapper) nor given a name');
    }
  });

  /* 6. Links and buttons have discernible text. */
  pages.anchors(html, page).forEach(function (anchor) {
    if (!anchor.text) fail(page, 'a link has no discernible text (href="' + anchor.href + '")');
  });

  var buttonPattern = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  var button;
  while ((button = buttonPattern.exec(html)) !== null) {
    var label = /aria-label="([^"]*)"/i.exec(button[1]);
    if (!pages.textOf(button[2]) && !label) {
      fail(page, 'a <button> has no discernible text');
    }
  }

  /* 7. aria-* references resolve. */
  var ariaPattern = /aria-(labelledby|describedby|controls)="([^"]*)"/gi;
  var aria;
  while ((aria = ariaPattern.exec(html)) !== null) {
    aria[2].split(/\s+/).forEach(function (id) {
      if (!id) return;
      if (!ids[id]) {
        fail(page, 'aria-' + aria[1] + '="' + aria[2] + '" points at #' + id + ', which is not on the page');
      }
    });
  }

  /* 8. No positive tabindex. */
  var tabindexPattern = /tabindex="(-?\d+)"/gi;
  var tabindex;
  while ((tabindex = tabindexPattern.exec(html)) !== null) {
    if (Number(tabindex[1]) > 0) {
      fail(page, 'tabindex="' + tabindex[1] + '" — a positive tabindex hijacks the tab order');
    }
  }

  /* 9. The skip link and its target. */
  var skip = SKIP_LINK.exec(html);
  if (!skip) {
    fail(page, 'has no .skip-link');
  } else {
    var target = skip[1].replace(/^#/, '');
    if (!ids[target]) {
      fail(page, 'the skip link targets #' + target + ', which is not on the page');
    } else {
      var targetTag = new RegExp('<[a-z]+\\b[^>]*id="' + target + '"[^>]*>', 'i').exec(html);
      if (!targetTag || !/tabindex="-1"/.test(targetTag[0])) {
        fail(page, 'the skip-link target #' + target + ' has no tabindex="-1", so focus does not move to it');
      }
    }
  }

  /* 10. Landmarks. */
  [['main', 1], ['header', 1], ['footer', 1], ['nav', 1]].forEach(function (pair) {
    var count = pages.countIn(html, new RegExp('<' + pair[0] + '\\b', 'gi'));
    if (pair[0] === 'main' && count !== 1) {
      fail(page, 'has ' + count + ' <main> landmark(s); exactly one is required');
    } else if (count < pair[1]) {
      fail(page, 'has no <' + pair[0] + '> landmark');
    }
  });

  /* 11. Duplicate ids. */
  Object.keys(ids).forEach(function (id) {
    if (ids[id] > 1) {
      fail(page, 'id="' + id + '" appears ' + ids[id] + ' times; ids must be unique');
    }
  });
});

/* ------------------------------------------------------------ the stylesheet */

console.log('\nStylesheet and contrast\n');

if (!/a:focus-visible/.test(cssRules) || !/\.btn:focus-visible/.test(cssRules)) {
  fail('assets/css/jnd.css', 'links and buttons need a :focus-visible ring, or keyboard focus is invisible');
}

if (/outline\s*:\s*(none|0)\b/i.test(cssRules)) {
  fail('assets/css/jnd.css', 'removes the outline somewhere; a focus indicator must be replaced, not deleted');
}

if (!/prefers-reduced-motion/.test(cssRules)) {
  fail('assets/css/jnd.css', 'has no prefers-reduced-motion block');
}

var maxLabelWidth = Math.max.apply(null, CONTRAST_RULES.map(function (r) { return r[0].length; }));

CONTRAST_RULES.forEach(function (rule) {
  var fg = token(rule[1]);
  var bg = token(rule[2]);
  var value = ratio(fg, bg);
  var status;

  if (rule[3] !== null && value < rule[3]) {
    status = 'FAIL (needs ' + rule[3] + ':1)';
    fail('assets/css/jnd.css', rule[0] + ' measures ' + value + ':1, below ' + rule[3] + ':1');
  } else if (rule[4] !== null && value >= rule[4]) {
    status = 'FAIL (must stay under ' + rule[4] + ':1)';
    fail('assets/css/jnd.css', rule[0] + ' measures ' + value + ':1, at or above the '
       + rule[4] + ':1 ceiling it is meant to stay below');
  } else {
    status = 'ok';
  }

  var pad = rule[0] + ' '.repeat(maxLabelWidth - rule[0].length);
  console.log('  ' + pad + '  ' + fg + ' on ' + bg + '  ' + String(value).padStart(6) + ':1  ' + status);
});

console.log('');

if (problems) {
  console.log('FAILED — ' + problems + ' problem(s).');
  process.exit(1);
}

console.log('OK — the machine-checkable half of the accessibility pass is clean.');
console.log('Still to do by hand (screen reader, keyboard only, zoom to 200%): see');
console.log('docs/QUALITY.md.');
