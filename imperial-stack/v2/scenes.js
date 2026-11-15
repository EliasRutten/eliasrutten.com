/* The Imperial Stack v2 · scenes.js (round B3, 15 Nov 2026)
   Scenarios in three depths.
     gallery  the door: one case fills the stage on its own map, with a rail of the fourteen cases
     scene    the case, one step at a time, drawn on that map where the page puts each node (B3-2)
     depth    the drawer and the ledger of all 24 switches (B3-4)
   The page script keeps the state (which case, which step) and its setters; this file draws. It reads the cases, maps and
   icons through ISX.sc and never changes them. */
(function () {
  'use strict';
  var X = window.ISX; if (!X || !X.sc) return;
  var D = X.sc, esc = X.util.esc, STORIES = D.STORIES, SMAPS = D.SMAPS, SORDER = D.SORDER;
  var st = document.getElementById('isx-sc3'), mapw = document.getElementById('isx-b3-map'), gal = document.getElementById('isx-b3-gal');
  if (!st || !mapw || !gal) return;
  var ORD = D.order();                                   /* the cases in the order of the rail */
  var S = { mode: 'gallery', shown: -1, sw: null, swErr: false };
  var still = function () { return !!X.reduce; };
  var phone = function () { return window.innerWidth <= 760; };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var nChoke = function (c) { return c.steps.filter(function (s) { return s.choke; }).length; };
  var sentences = function (t, n) { return String(t).split(/(?<=[.!?])\s+(?=[A-Z“‘$])/).slice(0, n).join(' '); };
  var CH_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg>';
  var CH_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 5.5L16 12l-6.5 6.5"/></svg>';
  var ARR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';

  /* ---------- the map: one per case, the backdrop of the gallery; the thumbnails crop the same paths ---------- */
  function mapSVG(c, thumb) {
    var M = SMAPS[c.map], t = M.tagAt, o;
    o = '<svg viewBox="' + (thumb ? (t[0] - 300) + ' ' + (t[1] - 200) + ' 600 400' : '0 0 1000 580') + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">';
    /* the map data stops at the edge of its sheet (-20 to 1020 by -20 to 600): a soft mask fades it out there, so no cut edge shows */
    if (!thumb) o += '<defs><pattern id="isx-b3-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v6" stroke="rgba(255,138,92,.45)" stroke-width="1.4"/></pattern>'
      + '<filter id="isx-b3-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22"/></filter>'
      + '<mask id="isx-b3-fade" maskUnits="userSpaceOnUse" x="-30" y="-30" width="1060" height="640"><rect x="46" y="46" width="908" height="488" fill="#fff" filter="url(#isx-b3-soft)"/></mask></defs>'
      + '<g mask="url(#isx-b3-fade)">' + (M.grat ? '<path d="' + M.grat + '" class="sgrat"/>' : '');
    M.paths.forEach(function (p) { o += '<path class="sland ' + p.cls + '" d="' + p.d + '"/>'; if (!thumb && p.cls.indexOf('occ') >= 0) o += '<path class="socc" d="' + p.d + '"/>'; });
    if (!thumb) {
      var L = M.lines || {}, pl = function (a) { return a.map(function (p) { return p.join(','); }).join(' '); };
      if (L.front) o += '<polyline class="sfront" points="' + pl(L.front) + '"/>';
      if (L.flight) o += '<polyline class="sflight" points="' + pl(L.flight) + '"/>';
      if (L.buk) o += '<polyline class="sbuk" points="' + pl(L.buk) + '"/>';
      if (L.transfer) o += '<polyline class="sroute" points="' + pl(L.transfer) + '"/>';
      if (L.route) o += '<polyline class="sroute" points="' + pl(L.route) + '"/>';
      (M.labels || []).forEach(function (l) { var p = M.places[l[1]]; if (!p) return; o += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.2" class="sdotp"/><text x="' + Math.min(985, p[0] + 6) + '" y="' + (p[1] - 6) + '" class="splace" text-anchor="' + (p[0] > 900 ? 'end' : 'start') + '">' + esc(l[0]) + '</text>'; });
      o += '<text x="' + t[0] + '" y="' + t[1] + '" class="stag" text-anchor="middle">' + esc(M.tag) + '</text></g>';
    }
    return o + '</svg>';
  }
  /* the stage's own box: every position is worked out against it, never against the window */
  function box() { return { W: st.clientWidth || 1, H: st.clientHeight || 1 }; }
  function mapAt(Pt, A, z) {   /* put map point Pt at stage point A, at zoom z */
    var b = box(), s0 = Math.max(b.W / 1000, b.H / 580);
    var F = [(b.W - 1000 * s0) / 2 + Pt[0] * s0, (b.H - 580 * s0) / 2 + Pt[1] * s0];
    st.style.setProperty('--b3x', (A[0] - z * F[0]).toFixed(2)); st.style.setProperty('--b3y', (A[1] - z * F[1]).toFixed(2)); st.style.setProperty('--b3z', z.toFixed(4));
  }
  function galPose() {
    var b = box(), c = STORIES[S.shown < 0 ? D.idx : S.shown], ph = phone();
    mapAt(SMAPS[c.map].tagAt, ph ? [b.W * .5, b.H * .3] : [b.W * .66, b.H * .44], ph ? 1.0 : 1.2);
  }
  /* the header lies over the stage on wide screens: the corner controls start below it */
  function topFit() {
    var hd = X.root.querySelector('.hud-top'), r = st.getBoundingClientRect(), t = 12;
    if (hd && getComputedStyle(hd).position === 'absolute') t = Math.max(12, Math.round(hd.getBoundingClientRect().bottom - r.top) + 12);
    st.style.setProperty('--b3top', t + 'px');
  }

  /* ---------- gallery ---------- */
  function heroTitle(c) { var i = c.h.indexOf(': '); return i > 0 ? [c.h.slice(0, i), c.h.slice(i + 2)] : [c.t, c.h]; }
  function galInit() {
    var rail = '';
    SORDER.forEach(function (g) {
      rail += '<span class="b3gl" aria-hidden="true">' + esc(g[0]) + '</span>';
      g[1].forEach(function (id) {
        var i = STORIES.findIndex(function (x) { return x.id === id; }); if (i < 0) return;
        var c = STORIES[i], k = nChoke(c);
        rail += '<button type="button" class="b3chip" data-b3c="' + i + '">' + mapSVG(c, true) + (k ? '<span class="b3sw" aria-hidden="true">' + '●'.repeat(Math.min(k, 4)) + '</span>' : '') + '<span class="b3ct"><b>' + esc(c.t) + '</b><small>' + esc(c.when) + '</small></span><i class="b3ok" aria-hidden="true">✓</i></button>';
      });
    });
    gal.innerHTML = '<div class="b3hero"><div class="b3kick"></div><h2></h2><div class="b3sub"></div><p class="b3sum"></p><div class="b3row"><button type="button" class="b3cta" data-b3="enter">Follow the chain ' + ARR + '</button><div class="b3pills"></div></div></div>'
      + '<div class="b3nav" role="group" aria-label="Choose a case"><button type="button" class="b3nb" data-b3="prev" aria-label="Previous case">' + CH_L + '</button><span class="b3cnt" aria-live="polite"></span><button type="button" class="b3nb" data-b3="next" aria-label="Next case">' + CH_R + '</button><button type="button" class="b3lnk" data-b3="ledger" hidden>All switches</button></div>'
      + '<div class="b3rail" role="group" aria-label="The fourteen cases">' + rail + '</div>';
  }
  function fillHero(i) {
    var c = STORIES[i], tt = heroTitle(c), k = nChoke(c), seen = D.seen();
    var nl = new Set(c.steps.map(function (s) { return c.nodes[s.n].lay; })).size;
    gal.querySelector('.b3kick').innerHTML = '<i></i>' + esc(D.group(c.id)) + ' · ' + esc(c.when);
    gal.querySelector('h2').textContent = tt[0];
    gal.querySelector('.b3sub').textContent = tt[1];
    gal.querySelector('.b3sum').textContent = sentences(c.sum, 2);
    gal.querySelector('.b3pills').innerHTML = '<span>' + c.steps.length + ' steps</span><span>' + (k ? k + (k === 1 ? ' switch' : ' switches') : 'no switch thrown') + '</span><span>' + nl + ' of ' + D.SLAY.length + ' layers</span>';
    gal.querySelector('.b3cnt').textContent = pad(ORD.indexOf(i) + 1) + ' / ' + pad(ORD.length);
    var rail = gal.querySelector('.b3rail');
    gal.querySelectorAll('.b3chip').forEach(function (b) {
      var j = +b.dataset.b3c, on = j === i, x = STORIES[j], sn = seen.indexOf(x.id) >= 0;
      b.setAttribute('aria-current', String(on)); b.classList.toggle('seen', sn);
      b.setAttribute('aria-label', x.t + ', ' + x.when + (sn ? ', followed' : ''));
      /* scroll the rail itself, never scrollIntoView: that would scroll the page */
      if (on) rail.scrollTo({ left: b.offsetLeft - (rail.clientWidth - b.offsetWidth) / 2, behavior: still() ? 'auto' : 'smooth' });
    });
  }
  var swapT = 0;
  function showCase(i, instant) {
    clearTimeout(swapT);
    var paint = function () { fillHero(i); mapw.innerHTML = mapSVG(STORIES[i]); S.shown = i; galPose(); };
    if (instant || still() || S.shown < 0) { gal.classList.remove('sw'); mapw.classList.remove('swap'); paint(); return; }
    gal.classList.add('sw'); mapw.classList.add('swap');
    swapT = setTimeout(function () { paint(); void gal.offsetWidth; gal.classList.remove('sw'); mapw.classList.remove('swap'); }, 230);
  }
  function step(d) { var k = ORD.indexOf(D.idx); D.pick(ORD[(k + d + ORD.length) % ORD.length]); }

  /* ---------- the page tells us where it stands ---------- */
  function sync(o) {
    o = o || {};
    if (X.view !== 'story') return;
    topFit();
    if (D.step < 0) { st.dataset.mode = 'gallery'; S.mode = 'gallery'; if (X.route) X.route.release(); showCase(D.idx, o.instant || S.shown === D.idx); }
    else { st.dataset.mode = 'old'; S.mode = 'scene'; }
  }

  /* ---------- events ---------- */
  gal.addEventListener('click', function (e) {
    var c = e.target.closest('[data-b3c]'); if (c) { D.pick(+c.dataset.b3c); return; }
    var t = e.target.closest('[data-b3]'); if (!t) return;
    if (t.dataset.b3 === 'enter') D.set(0);
    else if (t.dataset.b3 === 'prev') step(-1);
    else if (t.dataset.b3 === 'next') step(1);
  });
  document.addEventListener('keydown', function (e) {
    if (X.view !== 'story' || S.mode !== 'gallery' || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && t.closest && t.closest('input, textarea, select, [role="dialog"], .shpop')) return;
    var r = st.getBoundingClientRect(); if (r.bottom < 80 || r.top > window.innerHeight - 80) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'Enter' && !(t && t.closest && t.closest('button, a, summary'))) { e.preventDefault(); D.set(0); }
  });
  if (X.route && X.route.swipe) X.route.swipe(gal, 'scenarios', '.b3rail');
  var rz = 0;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (X.view !== 'story') return; topFit(); if (S.mode === 'gallery') galPose(); }, 150); });

  galInit();
  X.scenes = { sync: sync, get mode() { return S.mode; } };
  if (X.view === 'story') sync({ instant: true });
})();
