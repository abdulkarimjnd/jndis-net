/* ==========================================================================
   JND Integrated Solutions — footer
   ==========================================================================
   Keeps the copyright year current without anyone having to remember to edit it
   every January.

   The markup carries a static fallback year, so with JavaScript disabled the
   line still reads correctly — it simply will not roll over on its own.

   Any element with data-current-year is updated, so the same script serves
   every page once the footer becomes a shared partial at TASK-010.
   ========================================================================== */

(function () {
  'use strict';

  var year = String(new Date().getFullYear());
  var nodes = document.querySelectorAll('[data-current-year]');

  for (var i = 0; i < nodes.length; i++) {
    nodes[i].textContent = year;
  }

})();
