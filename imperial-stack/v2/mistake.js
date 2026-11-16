/* The Imperial Stack v2 · mistake.js (round B4, 16 Nov 2026)
   “See a mistake?”: one panel, opened from the header pill (761 px and up), the phone row under the card and the support
   box below the map. It carries a reference to what the visitor is looking at, built when it opens (ISX.refNow), so the
   message on Substack can say exactly where. Substack's composer needs a sign-in and takes no pre-filled text, so the
   reference is copied first. No form, no tracking call: the message goes through Substack.
   The link in the reference always uses the site's address, never this page's (the test build runs on another host). */
(function () {
  'use strict';
  var X = window.ISX, root = document.getElementById('isx-root'); if (!X || !root) return;
  var $ = function (id) { return document.getElementById('isx-' + id); };
  var panel = $('mpanel'), ref = $('mp-ref'), copyB = $('mp-copy'), live = $('mp-live'); if (!panel) return;
  var SITE = 'https://eliasrutten.com/imperial-stack/#', opener = null, from = null, t0 = 0;

  X.refNow = function (src) {
    var w = X.whereNow ? X.whereNow(src || null) : { tab: '', where: '', slug: '' };
    return 'The Imperial Stack v.2.0 · ' + w.tab + '\nWhere: ' + w.where + '\nRef: ' + w.slug + '\nLink: ' + SITE + w.slug + '\nWhat I saw: ';
  };
  function openers() { return root.querySelectorAll('[data-mis]'); }
  function place() {
    if (window.innerWidth <= 760 || !opener || opener.id !== 'isx-mis') { panel.style.left = ''; panel.style.top = ''; panel.classList.toggle('dock', !!opener && opener.id !== 'isx-mis' && window.innerWidth > 760); return; }
    var fr = document.getElementById('isx-frame').getBoundingClientRect(), r = opener.getBoundingClientRect();
    panel.classList.remove('dock');
    panel.style.left = Math.max(12, Math.min(r.left - fr.left, fr.width - panel.offsetWidth - 12)) + 'px';
    panel.style.top = (r.bottom - fr.top + 8) + 'px';
  }
  function open(btn) {
    opener = btn; from = btn.getAttribute('data-mis-from') || null;
    ref.textContent = X.refNow(from);
    copyB.textContent = 'Copy reference';
    panel.classList.toggle('below', !!from);
    if (from) { var sec = document.getElementById('isx-support'); if (sec && panel.parentNode !== sec) sec.appendChild(panel); }
    else { var frm = document.getElementById('isx-frame'); if (panel.parentNode !== frm) frm.appendChild(panel); }
    panel.hidden = false; place(); t0 = Date.now();
    openers().forEach(function (b) { b.setAttribute('aria-expanded', String(b === btn)); });
    copyB.focus({ preventScroll: true });
  }
  function close(back) {
    if (panel.hidden) return;
    panel.hidden = true;
    openers().forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    if (back && opener && opener.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-mis]');
    if (b) { e.preventDefault(); if (!panel.hidden && opener === b) close(true); else open(b); return; }
    if (e.target.closest && e.target.closest('[data-mis-x]')) close(true);
  });
  copyB.addEventListener('click', function () {
    var txt = ref.textContent, done = function (ok) {
      copyB.textContent = ok ? 'Copied ✓' : 'Select it above';
      if (live) live.textContent = ok ? 'Reference copied' : 'Copying was refused: select the reference and copy it';
      if (!ok) { try { var rg = document.createRange(); rg.selectNodeContents(ref); var sl = getSelection(); sl.removeAllRanges(); sl.addRange(rg); ref.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
      setTimeout(function () { copyB.textContent = 'Copy reference'; if (live) live.textContent = ''; }, 2200);
    };
    var p = X.copyText ? X.copyText(txt) : Promise.resolve(false);
    Promise.resolve(p).then(function (ok) { done(!!ok); }, function () { done(false); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { e.preventDefault(); e.stopPropagation(); close(true); } }, true);
  document.addEventListener('pointerdown', function (e) { if (!panel.hidden && Date.now() - t0 > 60 && !e.target.closest('#isx-mpanel, [data-mis]')) close(false); });
  panel.addEventListener('focusout', function (e) { if (!panel.hidden && e.relatedTarget && !e.relatedTarget.closest('#isx-mpanel, [data-mis]')) close(false); });
  window.addEventListener('resize', function () { if (!panel.hidden) place(); });
  /* the view changes under an open panel: its reference follows */
  ['view', 'step', 'card', 'story'].forEach(function (k) { if (X.on) X.on(k, function () { if (!panel.hidden && !from) ref.textContent = X.refNow(null); }); });
})();
