/* The Imperial Stack v2 · wip.js (20 Nov 2026)
   “Work in progress”: the amber pill beside the version in the header opens a short note (small mistakes and bugs may remain,
   the thesis holds) with a way to report one through “See a mistake?”. Click or Enter opens it; Esc, a click outside or the
   pill again closes it. */
(function () {
  'use strict';
  /* the reusable marker (21 Nov 2026, design principles thread 11): a small amber pill “WIP” and one plain line on what is missing.
     pill() goes on the control that opens an unfinished view (inside the control, so its spoken name contains “WIP”); note(missing)
     goes inside the view. The caller shows it only while the data says status: preliminary. */
  if (window.ISX) window.ISX.wip = {
    pill: function () { return '<span class="wipm"><i aria-hidden="true"></i>WIP</span>'; },
    note: function (missing) { return '<p class="wipl"><span class="wipm"><i aria-hidden="true"></i>WIP</span> Preliminary: ' + window.ISX.util.esc(missing) + '.</p>'; }
  };
  var root = document.getElementById('isx-root'), btn = document.getElementById('isx-wip'), frame = document.getElementById('isx-frame');
  if (!root || !btn || !frame) return;
  var note = document.createElement('div');
  note.id = 'isx-wipnote'; note.className = 'wipn'; note.hidden = true;
  note.setAttribute('role', 'dialog'); note.setAttribute('aria-modal', 'false'); note.setAttribute('aria-labelledby', 'isx-wipnote-h');
  note.innerHTML = '<p class="wipn-h" id="isx-wipnote-h"><i aria-hidden="true"></i>Work in progress</p>'
    + '<p>The Imperial Stack is still being built. Small mistakes and bugs may still be there, but the general thesis holds.</p>'
    + '<button type="button" class="wipn-go">Spotted one? Tell me <span aria-hidden="true">→</span></button>';
  frame.appendChild(note);
  var t0 = 0;
  function place() {
    if (window.innerWidth <= 600) { note.style.left = note.style.top = ''; return; }
    var fr = frame.getBoundingClientRect(), r = btn.getBoundingClientRect();
    note.style.left = Math.max(12, Math.min(r.left - fr.left, fr.width - note.offsetWidth - 12)) + 'px';
    note.style.top = (r.bottom - fr.top + 8) + 'px';
  }
  function open() { note.hidden = false; place(); btn.setAttribute('aria-expanded', 'true'); t0 = Date.now(); note.querySelector('button').focus({ preventScroll: true }); }
  function close(back) { if (note.hidden) return; note.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (back) btn.focus({ preventScroll: true }); }
  btn.addEventListener('click', function (e) { e.preventDefault(); if (note.hidden) open(); else close(true); });
  note.querySelector('.wipn-go').addEventListener('click', function () {
    close(false);
    var m = [].filter.call(root.querySelectorAll('[data-mis]'), function (b) { return b.getClientRects().length > 0; })[0];
    if (m) setTimeout(function () { m.click(); }, 0);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !note.hidden) { e.preventDefault(); e.stopPropagation(); close(true); } }, true);
  document.addEventListener('pointerdown', function (e) { if (!note.hidden && Date.now() - t0 > 60 && !e.target.closest('#isx-wipnote, #isx-wip')) close(false); });
  window.addEventListener('resize', function () { if (!note.hidden) place(); });
})();
