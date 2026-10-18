/* ==========================================================================
   JND Integrated Solutions — navigation behaviour
   ==========================================================================
   Complements Bootstrap's Collapse, which already handles the hamburger toggle,
   the slide animation and keeping aria-expanded in sync. This file adds the
   three things Bootstrap does not do for a navbar:

     1. close the panel after a link is followed, while collapsed
     2. Escape closes the panel and hands focus back to the hamburger
     3. never leave focus stranded inside a panel that has just closed

   Focus is deliberately NOT moved into the panel when it opens. A navbar
   collapse is a disclosure pattern, not a dialog: focus belongs on the toggle,
   which is already where the user pressed Enter or Space. Moving focus into the
   panel would also skip the first link for anyone using a screen reader.
   ========================================================================== */

(function () {
  'use strict';

  var menu = document.getElementById('primaryNav');
  var toggle = document.querySelector('.navbar-toggler');

  // Bootstrap drives the collapse; without it there is no mobile menu to manage.
  if (!menu || !toggle || !window.bootstrap) return;

  var DESKTOP_QUERY = '(min-width: 992px)'; // must match .navbar-expand-lg
  var mq = window.matchMedia(DESKTOP_QUERY);

  // toggle:false — constructing a Collapse would otherwise flip the panel open
  var collapse = bootstrap.Collapse.getOrCreateInstance(menu, { toggle: false });

  function isDesktop() {
    return mq.matches;
  }

  function isOpen() {
    return menu.classList.contains('show');
  }

  function closeMenu(forceFocus) {
    if (!isOpen()) return;

    // Checked BEFORE hiding: once the panel is display:none the browser moves
    // focus to <body>, so testing afterwards would always come back false.
    var hadFocus = menu.contains(document.activeElement);

    collapse.hide();

    // Never send focus to a toggle that desktop CSS has hidden
    if ((hadFocus || forceFocus) && !isDesktop()) toggle.focus();
  }

  /* 1. Following a link while collapsed closes the panel behind you.
        The Services toggle is skipped — it opens a submenu, it does not navigate. */
  menu.addEventListener('click', function (event) {
    var link = event.target.closest('a[href]');
    if (!link || link.hasAttribute('data-bs-toggle')) return;
    if (isDesktop()) return; // panel is permanently visible at this width

    closeMenu(false);
  });

  /* 2. Escape closes the panel and returns focus to the hamburger.
        An open submenu consumes the first Escape — Bootstrap closes that one
        itself, so the user is never thrown two levels out at once. */
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || isDesktop() || !isOpen()) return;
    if (menu.querySelector('.dropdown-menu.show')) return;

    closeMenu(true);
  });

  /* 3. Crossing into desktop drops the open state, so returning to a narrow
        viewport shows a closed, predictable menu rather than one left ajar. */
  mq.addEventListener('change', function (event) {
    if (event.matches) closeMenu(false);
  });

})();
