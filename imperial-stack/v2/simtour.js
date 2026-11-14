/* The Imperial Stack v2 · simtour.js (content build, 14 Nov 2026)
   The first-visit tour of the Scott Bessent Simulator, built the way the Circuit's tour is (v2/tour.js): a few notes, each beside the
   thing it names, never blocking the map. It replaces the old card “How to use the simulator”, and keeps its one line:
   “Click any actor or line for what it does and its sources.” It starts once, on the guide's opening card; Skip, Esc, × or the last
   button end it for good. The button “Tour” beside the title (and “Take the tour” in the ⋯ menu) starts it again.
   Storage: isx-simtour ('off' once seen). The old switch isx-tips-sim = 'off' also keeps it from starting by itself. */
(function () {
  'use strict';
  var X = window.ISX; if (!X) return;
  var U = X.util, root = X.root, $ = X.$, KEY = 'isx-simtour';
  var host = function () { return $('cock'); };   /* the note lives on the Simulator's own stage, which is rebuilt when the view changes */
  var box = null, at = 0, live = false;
  var phone = function () { return window.innerWidth <= 760; };
  var onCard = function () { var S = X.sim; return S.mode === 'story' && S.beat < 0 && !S.ph && !!root.querySelector('#isx-sn-body .s4go'); };

  function stops() {
    var tap = U.COARSE ? 'Tap' : 'Click', ph = phone();
    var all = [
      { t: '#isx-snarr', side: 'right', h: 'The guide', p: 'This card takes you through how the plumbing was built, one step at a time. At seven moments you sit in the chair and choose before you see what happened; either way, you can walk the other path.' },
      { t: '#isx-rmap', side: 'in', h: 'The map', p: tap + ' any actor or line for what it does and its sources. Boxes are actors, lines are the relations between them, and the gauges on the wires carry the prices. The guide lights each part as it gets there.' },
      { t: '#isx-s2bar', side: 'top', h: 'The route', p: ph ? 'Back and Next in this bar move through the guide; a swipe on the card does the same. Guide · Plays · Levers switches between the route, Washington’s moves one by one, and its tools.' : 'Back and Next sit at the left of this bar; each mark is a step, and a diamond is a decision. ← → on your keyboard work too. Guide · Plays · Levers switches between the route, Washington’s moves one by one, and its tools.' },
      { t: '#isx-b1ind', side: 'bottom', h: 'Indicators', p: 'Every figure is dated and sourced. This opens all of them by role: what Washington sets, the prices it passes through, the stress gauges and the outcomes.' },
      { t: '#isx-simtour-b', side: 'bottom', h: 'Inside the machinery', p: 'Six elements open a deeper view from their card: Allied savers, the 10-year, bond volatility, New bonds, the Treasury and the Fed. This button starts the tour again.' }
    ];
    /* a control that is not on screen here (the indicators on the opening card, the card in the full view) is left out, so the count is true */
    return all.filter(function (S) { var el = root.querySelector(S.t); return el && el.getClientRects().length; });
  }
  function build() {
    box = document.createElement('div');
    box.className = 'tour2 simtour'; box.id = 'isx-simtour'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'false'); box.setAttribute('aria-labelledby', 'isx-simtour-h');
    box.innerHTML = '<span class="tw" aria-hidden="true"></span><div class="tk2"><span>Tour · Scott Bessent Simulator</span><span class="tn"></span></div><div aria-live="polite"><h3 id="isx-simtour-h"></h3><p></p></div>'
      + '<div class="tf"><span class="td" aria-hidden="true"></span><button type="button" class="tq" data-a="skip">Skip</button><button type="button" class="tgo" data-a="next"></button></div>'
      + '<button type="button" class="tx" data-a="skip" aria-label="Close the tour">×</button>';
    host().appendChild(box);
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return;
      if (b.dataset.a === 'next') { if (at < stops().length - 1) { at++; render(true); } else { var go = onCard(); close(); if (go) { var s = root.querySelector('#isx-sn-body .s4go'); if (s) { s.click(); s = X.route && X.route.next('sim'); if (s) s.focus({ preventScroll: true }); } } } }
      else close();
    });
    box.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } });
  }
  function mark(S) {
    root.querySelectorAll('.tour-on').forEach(function (e) { e.classList.remove('tour-on'); });
    if (S && S.side !== 'in') { var e = root.querySelector(S.t); if (e && e.getClientRects().length) e.classList.add('tour-on'); }
  }
  function place(S) {
    var e = root.querySelector(S.t); if (!box || !e || !e.getClientRects().length) return false;
    if (phone()) { box.style.left = box.style.top = ''; box.dataset.side = 'sheet'; return true; }
    var fr = host().getBoundingClientRect(), r = e.getBoundingClientRect(), w = box.offsetWidth, h = box.offsetHeight, g = 16, x, y, side = S.side;
    if (side === 'right' && r.right + g + w > fr.right - 12) side = 'top';
    if (side === 'right') { x = r.right + g; y = r.top + Math.min(28, r.height / 2 - 20); }
    else if (side === 'top') { x = r.left + Math.min(r.width / 2 - w / 2, 150); y = r.top - g - h; }
    else if (side === 'in') { x = r.right - w - 34; y = r.top + r.height * .56 - h / 2; }   /* over the map's right side, clear of the card */
    else { x = r.right - w; y = r.bottom + g; }
    x = Math.max(fr.left + 12, Math.min(x, fr.right - w - 12)); y = Math.max(fr.top + 12, Math.min(y, fr.bottom - h - 12));
    box.style.left = Math.round(x - fr.left) + 'px'; box.style.top = Math.round(y - fr.top) + 'px'; box.dataset.side = side;
    var w2 = box.querySelector('.tw'); w2.hidden = side === 'in';
    if (side === 'right') { w2.style.left = ''; w2.style.top = Math.round(Math.max(18, Math.min(h - 18, r.top + Math.min(48, r.height / 2) - y))) + 'px'; }
    else { w2.style.top = ''; w2.style.left = Math.round(Math.max(22, Math.min(w - 22, r.left + r.width / 2 - x))) + 'px'; }
    return true;
  }
  function render(focus) {
    var T = stops(); if (!T.length) { close(); return; }
    at = Math.min(at, T.length - 1); var S = T[at], last = at === T.length - 1;
    box.querySelector('.tn').textContent = (at + 1) + ' / ' + T.length;
    box.querySelector('h3').textContent = S.h; box.querySelector('p').textContent = S.p;
    box.querySelector('.td').innerHTML = T.map(function (x, i) { return '<i class="' + (i === at ? 'cur' : i < at ? 'done' : '') + '"></i>'; }).join('');
    box.querySelector('.tgo').innerHTML = last ? (onCard() ? 'Start the guide <span aria-hidden="true">▸</span>' : 'Done') : 'Next <span aria-hidden="true">→</span>';
    box.querySelector('.tq').hidden = last;
    mark(S); place(S);
    if (focus) box.querySelector('.tgo').focus({ preventScroll: true });
  }
  function open(user) {
    if (X.view !== 'fin' || X.finMode !== 'plumb' || X.intro || !$('cock')) return false;
    if (X.views && X.views.on) X.views.close();
    var c = $('snarr'); if (c && c.classList.contains('folded')) { var f = $('s2fold'); if (f) f.click(); }
    if (!box || !box.isConnected) build();
    at = 0; live = true; box.hidden = false; render(!!user);
    requestAnimationFrame(function () { if (box) box.classList.add('in'); });
    return true;
  }
  function close() {
    if (!live) return;
    live = false; U.stSet(KEY, 'off'); mark(null);
    var had = box.contains(document.activeElement);
    box.classList.remove('in');
    var el = box; setTimeout(function () { if (!live) el.hidden = true; }, X.reduce ? 0 : 260);
    if (had) { var z = $('simtour-b'); if (z && z.getClientRects().length) z.focus({ preventScroll: true }); }
  }
  X.simtour = { open: open, close: close, get on() { return live; }, get at() { return at; }, get n() { return stops().length; } };
  window.addEventListener('resize', function () { if (live) render(false); });
  X.on('view', function () { if (live && X.view !== 'fin') close(); auto(); });
  X.on('fin', function () { if (live && (X.finMode !== 'plumb' || !box.isConnected)) { live = false; mark(null); } auto(); });
  root.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-simtour]'); if (b) { e.preventDefault(); var m = $('b1more'); if (m) m.hidden = true; open(true); } });

  /* first visit to the Simulator: once the stage has settled, and only on the guide's opening card */
  var pending = 0;
  function auto() {
    if (pending || live || U.stGet(KEY) === 'off' || U.stGet('isx-tips-sim') === 'off' || X.view !== 'fin' || X.finMode !== 'plumb') return;
    var tries = 0; pending = setInterval(function () {
      if (++tries > 40 || U.stGet(KEY) === 'off' || X.view !== 'fin' || X.finMode !== 'plumb') { clearInterval(pending); pending = 0; return; }
      if (root.classList.contains('booting') || X.intro || !$('cock') || tries < 3) return;
      clearInterval(pending); pending = 0;
      if (!onCard() || (X.views && X.views.on) || document.hidden) return;   /* already exploring: no tour today */
      open(false);
    }, 500);
  }
  auto();
})();
