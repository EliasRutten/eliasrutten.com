/* The Imperial Stack v2 · tour.js
   A short first-visit tour of the Circuit: four notes, each beside the thing it names (the card, the step bar, the
   firms, the controls). It never blocks the map: no overlay, the page stays usable, and stepping or clicking anything
   leaves the tour where it is. It starts once, after the first moment has settled and only if the reader has not
   started on their own; Skip, Esc, × or the last button end it for good. “Take the tour” (Layers, and under the globe
   on a phone) brings it back. Storage: isx-tour ('off' once seen). */
(function () {
  'use strict';
  var X = window.ISX; if (!X) return;
  var U = X.util, root = X.root, $ = X.$, frame = $('frame'), KEY = 'isx-tour';
  var box = null, at = 0, byUser = false, live = false, t0 = Date.now();
  var phone = function () { return window.innerWidth <= 760; };

  function stops() {
    var coarse = U.COARSE, ph = phone();
    return [
      { t: '#isx-tournarr', side: 'right', h: 'The dollar loop', p: 'This card follows a dollar round the loop, one step at a time. “Go deeper” opens the full text and its sources.' },
      { t: ph ? '#isx-mstep' : '#isx-tabs', side: 'top', h: 'Ten steps', p: ph ? 'The arrows take you through the ten steps, from rents to the loop closing.' : 'Move with Next, with this bar, or with ← → on your keyboard. Play runs the loop for you.' },
      { t: '#isx-tp-firms', side: 'bottom', h: 'Firms', p: 'Seventeen firms have a footprint: who owns them and where they build. Open one from here.' },
      { t: '#isx-tp-layers', also: ph ? [] : ['#isx-zoom', '#isx-legbox'], side: 'bottom', h: 'The globe', p: (coarse ? 'Swipe to turn it, tap a country for its figures.' : 'Drag to turn it, click a country for its figures.') + ' Layers sets what the colours show' + (ph ? '.' : '; zoom and the legend sit bottom right.') }
    ];
  }

  function build() {
    box = document.createElement('div');
    box.className = 'tour2'; box.id = 'isx-tour'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'false'); box.setAttribute('aria-labelledby', 'isx-tour-h');
    box.innerHTML = '<span class="tw" aria-hidden="true"></span><div class="tk2"><span>Tour</span><span class="tn"></span></div><div aria-live="polite"><h3 id="isx-tour-h"></h3><p></p></div>'
      + '<div class="tf"><span class="td" aria-hidden="true"></span><button type="button" class="tq" data-a="skip">Skip</button><button type="button" class="tgo" data-a="next"></button></div>'
      + '<button type="button" class="tx" data-a="skip" aria-label="Close the tour">×</button>';
    frame.appendChild(box);
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return;
      if (b.dataset.a === 'next') { if (at < stops().length - 1) { at++; render(true); } else { var go = X.step === 0 && !X.sel.iso; close(); if (go) { X.stopPlay(); X.setStep(1); } } }
      else close();
    });
    box.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); close(); } });
  }
  function mark(S) {
    root.querySelectorAll('.tour-on').forEach(function (e) { e.classList.remove('tour-on'); });
    if (!S) return;
    [S.t].concat(S.also || []).forEach(function (q) { var e = root.querySelector(q); if (e && e.getClientRects().length) e.classList.add('tour-on'); });
  }
  function place(S) {
    var e = root.querySelector(S.t); if (!box || !e || !e.getClientRects().length) return false;
    if (phone()) {
      box.style.left = box.style.top = ''; box.dataset.side = 'sheet';
      requestAnimationFrame(function () {   /* bring the control into view above the sheet */
        if (!box) return;
        var r = e.getBoundingClientRect(), room = window.innerHeight - box.getBoundingClientRect().height - 28, dy = 0;
        if (r.bottom > room) dy = r.bottom - room; else if (r.top < 12) dy = r.top - 12;
        if (Math.abs(dy) > 2) window.scrollBy({ top: dy, behavior: X.reduce ? 'auto' : 'smooth' });
      });
      return true;
    }
    var fr = frame.getBoundingClientRect(), r = e.getBoundingClientRect(), w = box.offsetWidth, h = box.offsetHeight, g = 16, x, y, side = S.side;
    if (side === 'right' && r.right + g + w > fr.right - 12) side = 'top';
    if (side === 'right') { x = r.right + g; y = r.top + Math.min(28, r.height / 2 - 20); }
    else if (side === 'top') { x = r.left + Math.min(r.width / 2 - w / 2, 150); y = r.top - g - h; }
    else { x = r.right - w; y = r.bottom + g; }
    x = Math.max(fr.left + 12, Math.min(x, fr.right - w - 12)); y = Math.max(fr.top + 12, Math.min(y, fr.bottom - h - 12));
    box.style.left = Math.round(x - fr.left) + 'px'; box.style.top = Math.round(y - fr.top) + 'px'; box.dataset.side = side;
    /* the small pointer aims at the middle of the control, as far as the note reaches */
    var w2 = box.querySelector('.tw');
    if (side === 'right') { w2.style.left = ''; w2.style.top = Math.round(Math.max(18, Math.min(h - 18, r.top + Math.min(48, r.height / 2) - y))) + 'px'; }
    else { w2.style.top = ''; w2.style.left = Math.round(Math.max(22, Math.min(w - 22, r.left + r.width / 2 - x))) + 'px'; }
    return true;
  }
  function render(focus) {
    var T = stops(), S = T[at], last = at === T.length - 1;
    /* a control that is not on screen at this size is passed over */
    var e = root.querySelector(S.t);
    if (!e || !e.getClientRects().length) { if (!last) { at++; render(focus); } else close(); return; }
    box.querySelector('.tn').textContent = (at + 1) + ' / ' + T.length;
    box.querySelector('h3').textContent = S.h; box.querySelector('p').textContent = S.p;
    box.querySelector('.td').innerHTML = T.map(function (x, i) { return '<i class="' + (i === at ? 'cur' : i < at ? 'done' : '') + '"></i>'; }).join('');
    box.querySelector('.tgo').innerHTML = last ? (X.step === 0 && !X.sel.iso ? 'Start the loop <span aria-hidden="true">▸</span>' : 'Done') : 'Next <span aria-hidden="true">→</span>';
    box.querySelector('.tq').hidden = last;
    mark(S); place(S);
    if (focus) box.querySelector('.tgo').focus({ preventScroll: true });
  }
  function open(user) {
    if (X.view !== 'map' || X.intro) return false;
    if (X.tray) X.tray.close();
    var c = $('tournarr'); if (c && c.classList.contains('folded')) { var f = $('t-fold'); if (f) f.click(); }
    /* the first moment's line gives way: the tour is the next thing to read */
    var ix = root.querySelector('#isx-insight.in .ix'); if (ix) ix.click();
    if (!box) build();
    at = 0; byUser = !!user; live = true;
    box.hidden = false; render(byUser);
    requestAnimationFrame(function () { if (box) box.classList.add('in'); });
    return true;
  }
  function close() {
    if (!live) return;
    live = false; U.stSet(KEY, 'off'); mark(null);
    var had = box.contains(document.activeElement);
    box.classList.remove('in');
    var el = box; setTimeout(function () { if (!live) el.hidden = true; }, X.reduce ? 0 : 260);
    if (had) { var z = $('t-next'); if (z && z.getClientRects().length) z.focus({ preventScroll: true }); else { var p = $('tp-layers'); if (p) p.focus({ preventScroll: true }); } }
  }
  X.tour = { open: open, close: close, get on() { return live; }, get at() { return at; } };
  window.addEventListener('resize', function () { if (live) render(false); });
  X.on('view', function () { if (live && X.view !== 'map') close(); });
  X.on('narr', function () { if (live) setTimeout(function () { if (live) render(false); }, 60); });   /* the card changed height: stay beside it */

  /* ---------- first visit: once the first look has settled, and only if the reader has not set off already ---------- */
  function auto() {
    if (U.stGet(KEY) === 'off' || X.deep || live) return;
    var tries = 0, ready = 0, tick = setInterval(function () {
      if (++tries > 60 || U.stGet(KEY) === 'off') { clearInterval(tick); return; }
      if (root.classList.contains('booting') || root.classList.contains('isx-quiet') || root.classList.contains('isx-settle') || X.intro) return;
      if (!ready) ready = Date.now();
      if (Date.now() - ready < 1500) return;   /* a moment to look at the map first */
      if (Date.now() - t0 < 6500 && root.querySelector('#isx-insight.in.first')) return;   /* the opening line gets its reading time */
      clearInterval(tick);
      if (X.view !== 'map' || X.step !== 0 || X.sel.iso || (X.tray && X.tray.which) || document.hidden) return;   /* already exploring: no tour today */
      open(false);
    }, 500);
  }
  auto();
})();
