/* ==========================================================================
   contact-form.js — the contact form's validation and states
   ==========================================================================
   The form itself is plain HTML and posts to a static form service (Formspree)
   natively, so it works with JavaScript switched off. This file adds the three
   things a static form cannot do on its own, and nothing else:

     1. Client-side validation in Bootstrap's own style —
        .was-validated / .invalid-feedback — with the form carrying `novalidate`
        so the browser's speech-bubble messages never appear and every visitor
        sees the same wording (DESIGN.md, "UX Requirements").
     2. A loading state: the submit button is disabled and its label swaps for
        a spinner while the message is in flight.
     3. Success and error states, announced through role="status" / role="alert".

   The endpoint and the fallback inbox are placeholders until TASK-042 supplies
   the real ones. Until then:

     - if the action still holds the placeholder token, the service cannot be
       used, and the form falls back to a mailto: link built from the fields;
     - if the fallback inbox is a placeholder too, neither route can work, and
       the visitor is told plainly and pointed at the footer's contact details.

   That is deliberate: a form that silently swallows messages is worse than one
   that says it is not ready. See docs/DESIGN.md, "Contact form".
   ========================================================================== */

(function () {
  'use strict';

  var form = document.querySelector('[data-contact-form]');
  if (!form) return;

  /* The token the placeholder endpoint and inbox both carry. Anything still
     containing it is treated as not configured. */
  var PLACEHOLDER = 'REPLACE_WITH_';

  var endpoint = (form.getAttribute('action') || '').trim();
  var inbox = (form.getAttribute('data-contact-email') || '').trim();

  var configured = endpoint !== '' && endpoint.indexOf(PLACEHOLDER) === -1;
  var inboxReady = inbox !== '' && inbox.indexOf(PLACEHOLDER) === -1;

  var submit = form.querySelector('[data-contact-submit]');
  var spinner = form.querySelector('[data-contact-spinner]');
  var submitLabel = form.querySelector('[data-contact-submit-label]');

  var success = document.querySelector('[data-contact-success]');
  var successMessage = document.querySelector('[data-contact-success-message]');
  var failure = document.querySelector('[data-contact-error]');
  var failureMessage = document.querySelector('[data-contact-error-message]');

  /* The panel markup is the no-JavaScript wording; anything the script says has
     to be able to return to it, so a fallback it is. */
  var DEFAULT_SUCCESS = successMessage
    ? successMessage.textContent.trim()
    : 'Thank you — we have your message and will reply to the email address you gave us.';

  function hideAlerts() {
    if (success) success.hidden = true;
    if (failure) failure.hidden = true;
  }

  function setBusy(busy) {
    if (submit) submit.disabled = busy;
    if (spinner) spinner.hidden = !busy;
    if (submitLabel) submitLabel.textContent = busy ? 'Sending…' : 'Send message';
  }

  /* Writing into the panel's message node is what makes the live region
     announce: the panel exists from first paint, only its content changes.
     Focusing the panel puts the keyboard where the sighted visitor's eye is. */
  function show(panel, messageNode, text) {
    hideAlerts();
    if (messageNode) messageNode.textContent = text;
    if (!panel) return;

    panel.hidden = false;
    if (panel.focus) panel.focus();
  }

  function showSuccess(text) { show(success, successMessage, text || DEFAULT_SUCCESS); }

  function showError(text) {
    show(failure, failureMessage, text ||
      'Please try again in a moment, or use the contact details in the footer.');
  }

  /* The mailto: fallback, composed from whatever the visitor typed. */
  var LABELS = {
    name: 'Name',
    company: 'Company',
    email: 'Email',
    phone: 'Phone',
    topic: 'About'
  };

  function composeMailto() {
    var data = new FormData(form);
    var name = String(data.get('name') || '').trim();
    var subject = 'Website enquiry' + (name ? ' from ' + name : '');
    var lines = [];

    Object.keys(LABELS).forEach(function (key) {
      var value = String(data.get(key) || '').trim();
      if (value) lines.push(LABELS[key] + ': ' + value);
    });

    var message = String(data.get('message') || '').trim();
    if (message) {
      lines.push('');
      lines.push(message);
    }

    return 'mailto:' + inbox +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(lines.join('\r\n'));
  }

  form.addEventListener('submit', function (event) {
    /* Always ours from here: the checks below decide whether anything is sent,
       and the states decide what the visitor is told. */
    event.preventDefault();
    hideAlerts();

    /* 1. Validation. .was-validated is what reveals Bootstrap's
       .invalid-feedback for each :invalid control. Focus the first offender so
       the error is where the visitor is looking, not off screen above them. */
    if (!form.checkValidity()) {
      form.classList.add('was-validated');

      var firstInvalid = form.querySelector(':invalid');
      if (firstInvalid && firstInvalid.focus) firstInvalid.focus();
      return;
    }

    form.classList.add('was-validated');
    setBusy(true);

    /* 2. No working endpoint yet: the mailto: fallback, or an honest refusal. */
    if (!configured) {
      setBusy(false);

      if (inboxReady) {
        window.location.href = composeMailto();
        showSuccess(
          'Your email app should be opening with the message ready to send. ' +
          'Press send there and it is with us.'
        );
      } else {
        showError(
          'This form is not connected yet, and we do not have an inbox to fall ' +
          'back to. Please use the contact details in the footer.'
        );
      }
      return;
    }

    /* 3. The happy path. A browser without fetch falls back to the native
       POST, which is exactly what a no-JavaScript visitor gets. */
    if (typeof window.fetch !== 'function') {
      form.submit();
      return;
    }

    window.fetch(endpoint, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('The form service answered ' + response.status);
      }

      form.reset();
      form.classList.remove('was-validated');
      setBusy(false);
      showSuccess();
    }).catch(function () {
      setBusy(false);
      showError(
        'Please try again in a moment, or use the contact details in the footer. ' +
        'If it keeps failing, tell us and we will look at it.'
      );
    });
  });

})();
