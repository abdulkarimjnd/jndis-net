/* ==========================================================================
   reveal.js — fade-up scroll reveal
   ==========================================================================
   Mark an element with data-reveal and it fades up 16px the first time it
   enters the viewport, then is left alone. DESIGN.md, "Motion".

   The hiding is gated on .js-reveal, a class a small inline script in <head>
   puts on <html>:

     - It is set in <head> so it is in place before the first paint. Setting it
       from here would let the page paint normally and then hide itself, which
       is a visible flash.
     - It is a class on <html> rather than a hidden state baked into the markup
       so that with JavaScript unavailable nothing is ever hidden.

   This file only ever reveals. It never hides anything the head script had not
   already hidden, and it does nothing at all that a no-JavaScript visitor
   would not get.
   ========================================================================== */

(function () {
  'use strict';

  var doc = document.documentElement;

  /* Stand the <head> failsafe down. Only called once we know we are either
     going to run properly or have already shown everything. */
  function disarm() {
    if (window.__jndRevealFailsafe) {
      window.clearTimeout(window.__jndRevealFailsafe);
      window.__jndRevealFailsafe = null;
    }
  }

  /* Show the page and stop managing it: exactly the no-JavaScript result. */
  function showEverything() {
    disarm();
    doc.classList.remove('js-reveal');
  }

  var items = document.querySelectorAll('[data-reveal]');

  /* Nothing marked up on this page (or we could not reach it): drop the class
     regardless, so the page is never left hidden by a rule with no owner. */
  if (!items.length) {
    showEverything();
    return;
  }

  /* Reduced motion, or a browser without IntersectionObserver: skip the effect
     entirely rather than reveal everything at once. */
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!('IntersectionObserver' in window) || (reduced && reduced.matches)) {
    showEverything();
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;

      entry.target.classList.add('is-visible');

      /* Once, then never again — DESIGN.md. Unobserving also stops the
         observer accumulating elements it has already finished with. */
      observer.unobserve(entry.target);
    });
  }, {
    /* Trip slightly before the element's top edge reaches the bottom of the
       viewport, so the 16px of movement has settled by the time it is properly
       in view rather than still sliding as the user reads it. */
    rootMargin: '0px 0px -10% 0px',
    threshold: 0
  });

  items.forEach(function (item) { observer.observe(item); });

  /* Insurance for keyboard users. Tabbing to a link inside an element that has
     not revealed yet would otherwise land focus on something still invisible.
     The browser scrolls it into view, but that is not guaranteed to beat the
     300ms transition, so reveal it up front as well. */
  document.addEventListener('focusin', function (event) {
    var item = event.target.closest ? event.target.closest('[data-reveal]') : null;
    if (!item || item.classList.contains('is-visible')) return;

    item.classList.add('is-visible');
    observer.unobserve(item);
  });

  /* Disarm the <head> failsafe only now, once the observer is genuinely
     running. Anything that threw earlier in this file leaves the timer armed,
     so the content still appears rather than staying hidden with its safety
     net already removed. */
  disarm();
})();
