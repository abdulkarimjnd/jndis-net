/* ==========================================================================
   services-filter.js — keyword search for the services hub
   ==========================================================================
   Filters the service cards on services/index.html as the visitor types, and
   shows an empty state when nothing matches. DESIGN.md, "Service list".

   Progressive enhancement, the same stance as the reveal: the search control
   ships with the `hidden` attribute and this file is what removes it. If the
   script is blocked, fails, or the CDN it does not depend on is unreachable,
   the visitor sees no search box instead of a search box that cannot work —
   and the complete list of services either way.

   Matching is per word, all of which must be present, in any order: "cloud
   backup" finds the card that mentions both. The haystack is the card's own
   text plus its data-keywords, so synonyms the copy does not spell out
   ("wifi", "helpdesk") still find the right service.
   ========================================================================== */

(function () {
  'use strict';

  var filter = document.querySelector('[data-service-filter]');
  if (!filter) return;

  var input = filter.querySelector('[data-service-filter-input]');
  var status = filter.querySelector('[data-service-filter-status]');
  var items = document.querySelectorAll('[data-service-item]');
  var empty = document.querySelector('[data-service-empty]');
  var term = document.querySelector('[data-service-term]');
  var clear = document.querySelector('[data-service-clear]');

  /* Without an input or any cards there is nothing to wire up, and the control
     stays hidden rather than appearing half-working. */
  if (!input || !items.length) return;

  var total = items.length;

  /* Read each card once. Building the text up front keeps typing cheap: it
     flattens the card, its data-keywords, and everything nested inside it. */
  var searchable = Array.prototype.map.call(items, function (item) {
    var keywords = item.getAttribute('data-keywords') || '';
    return {
      element: item,
      text: (item.textContent + ' ' + keywords).toLowerCase()
    };
  });

  function apply() {
    var query = input.value.trim().toLowerCase();
    var terms = query ? query.split(/\s+/) : [];
    var shown = 0;

    searchable.forEach(function (entry) {
      var matches = terms.every(function (word) {
        return entry.text.indexOf(word) !== -1;
      });

      entry.element.hidden = !matches;
      if (matches) shown++;
    });

    if (empty) empty.hidden = shown !== 0;

    /* The snippet in the empty state comes from the visitor's own typing, so it
       is written with textContent — never as markup. */
    if (term) term.textContent = input.value.trim();

    if (status) {
      if (!terms.length) status.textContent = total + ' services';
      else if (!shown) status.textContent = 'No services match your search';
      else status.textContent = shown + ' of ' + total + ' services match';
    }
  }

  input.addEventListener('input', apply);

  if (clear) {
    clear.addEventListener('click', function () {
      input.value = '';
      apply();
      /* Send focus back to where the search happens: the visitor cleared it in
         order to search again, and the box they just emptied is off screen
         behind the cards. */
      input.focus();
    });
  }

  /* The control works, so it may appear. Done last: if anything above threw,
     the box stays hidden and the page is still a complete list. */
  filter.hidden = false;

  /* Settle the initial state. Mostly this just writes the count, but it also
     covers a browser restoring what the visitor typed after a back or forward
     navigation — the box would then show a query while the grid showed
     everything. */
  apply();
})();
