/* ==========================================================================
   service-page.js — service detail pages
   ==========================================================================
   The one thing a <details> FAQ cannot do by itself: open the answer a link
   pointed at.

   A link to .../services/cybersecurity.html#faq-password-manager scrolls to the
   right part of the page but leaves the answer shut, so the visitor arrives at
   a closed question and has to work out which one was meant. Browsers disagree
   about this — some expand the <details> an anchor targets, most do not — so
   this opens the matching item and moves focus to its question, which also puts
   the keyboard and screen-reader position where the browser just scrolled to.

   Nothing else on these pages needs JavaScript: the breadcrumb is plain links,
   and the FAQ opens and closes on its own. If this file never loads, a deep
   link simply lands on a closed question.
   ========================================================================== */

(function () {
  'use strict';

  var faq = document.querySelector('[data-faq]');
  if (!faq) return;

  var items = faq.querySelectorAll('details[id]');
  if (!items.length) return;

  function openFromHash() {
    var id = window.location.hash.slice(1);
    if (!id) return;

    /* A hand-typed or truncated hash is not ours to correct, but it must not
       throw: decodeURIComponent('%') raises a URIError. */
    try {
      id = decodeURIComponent(id);
    } catch (error) {
      return;
    }

    for (var i = 0; i < items.length; i++) {
      if (items[i].id !== id) continue;

      items[i].open = true;

      var question = items[i].querySelector('summary');
      if (question && question.focus) {
        /* The browser has already scrolled; take the focus there too, without
           scrolling again. */
        question.focus({ preventScroll: true });
      }
      return;
    }
  }

  openFromHash();
  window.addEventListener('hashchange', openFromHash);
})();
