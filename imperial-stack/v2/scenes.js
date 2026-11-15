/* The Imperial Stack v2 · scenes.js (round B3, 15 Nov 2026)
   Scenarios in three depths.
     gallery  the door: one case fills the stage on its own map, with a rail of the fourteen cases
     scene    the case, one step at a time: every node sits on the map where the page puts it (STORIES: pos, or its place
              and offset), the map and the nodes move as one, and each step changes the scene
     depth    the drawer (full text, source, the switch in plain terms) and the ledger of all 24 switches
   The page script keeps the state (which case, which step) and its setters; this file draws. It reads the cases, maps and
   icons through ISX.sc and never changes them. Holders, instruments and the one-line captions come from data/switches.json.
   Rules kept here: nothing of a later step is visible before its step; no class is added and then removed within a step
   (what plays once, plays as a Web Animation); hover lights nothing; what loops is registered with the loop registry;
   under reduced motion the scene cuts from state to state. */
(function () {
  'use strict';
  var X = window.ISX; if (!X || !X.sc) return;
  var D = X.sc, esc = X.util.esc, RT = X.route, PF = window.ISXP || null;
  var STORIES = D.STORIES, SMAPS = D.SMAPS, SORDER = D.SORDER, ICON = D.ICON, KIND = D.KIND, LINK = D.LINK, SLAY = D.SLAY;
  var id = function (k) { return document.getElementById('isx-' + k); };
  var st = id('sc3'), mapw = id('b3-map'), gal = id('b3-gal'), world = id('b3-world'), hud = id('b3-hud'), card = id('b3-card'), bar = id('sc-bar'), tc = id('b3-tc'), veil = id('b3-veil'), lede = id('sc-lede');
  if (!st || !mapw || !gal || !world || !hud || !card || !bar) return;
  var ORD = D.order();                                   /* the cases in the order of the rail */
  var S = { mode: 'gallery', shown: -1, built: -1, cur: -2, G: null, busy: false, skip: false, sleepers: [], sw: null, swErr: false, by: {}, run: false, sheet: null };
  var still = function () { return !!X.reduce; };
  var phone = function () { return window.innerWidth <= 760; };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var nChoke = function (c) { return c.steps.filter(function (s) { return s.choke; }).length; };
  var sentences = function (t, n) { return String(t).split(/(?<=[.!?])\s+(?=[A-Z“‘$])/).slice(0, n).join(' '); };
  var list = function (a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; };
  var lower1 = function (t) { return t.charAt(0).toLowerCase() + t.slice(1); };
  var kc = function (k) { return (KIND[k] || KIND.foreign).c; }, lc = function (k) { return (LINK[k] || LINK.data).c; };
  var RED = LINK.control.c, GOLD = '#ffd27a';
  var CH_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg>';
  var CH_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 5.5L16 12l-6.5 6.5"/></svg>';
  var ARR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';

  /* ---------- the switch list (data/switches.json): holders, instruments, captions ---------- */
  var HT = { state: 'State', 'private': 'Private', joint: 'Private and state' }, OR = { US: 'US', other: 'not US', mixed: 'US and others' };
  function swOf(c, i) { return S.by[c.id + ':' + (i + 1)] || null; }
  function hname(w) { return w.short || w.holder.split(/[:,]| with /)[0]; }
  function hcol(w) { return w.origin === 'US' ? (w.type === 'state' ? KIND.usstate.c : KIND.usfirm.c) : KIND.foreign.c; }
  function hmix(w) { return w.origin === 'mixed' ? [w.type === 'state' ? KIND.usstate.c : KIND.usfirm.c, KIND.foreign.c] : null; }
  /* the holder's glyph: the shape is the type (square a state, diamond a firm), the colour the origin, the fill whether it was thrown */
  function glyph(w, s, filled) {
    var mix = hmix(w), c = hcol(w), h = s / 2, b, cid = 'isx-b3g-' + w.id + '-' + s;
    if (mix) b = '<defs><clipPath id="' + cid + '"><rect x="1" y="1" width="' + (s - 2) + '" height="' + (s - 2) + '"/></clipPath></defs><g clip-path="url(#' + cid + ')"><path d="M0 0H' + s + 'L0 ' + s + 'Z" fill="' + (filled ? mix[0] : 'none') + '"/><path d="M' + s + ' 0V' + s + 'H0Z" fill="' + (filled ? mix[1] : 'none') + '"/></g><rect x="1" y="1" width="' + (s - 2) + '" height="' + (s - 2) + '" fill="none" stroke="' + mix[0] + '" stroke-width="1.4"/>';
    else if (w.type === 'state') b = '<rect x="1.5" y="1.5" width="' + (s - 3) + '" height="' + (s - 3) + '" fill="' + (filled ? c : 'none') + '" stroke="' + c + '" stroke-width="1.5"/>';
    else b = '<path d="M' + h + ' .8L' + (s - .8) + ' ' + h + 'L' + h + ' ' + (s - .8) + 'L.8 ' + h + 'Z" fill="' + (filled ? c : 'none') + '" stroke="' + c + '" stroke-width="1.5"/>';
    return '<svg class="b3gly" viewBox="0 0 ' + s + ' ' + s + '" width="' + s + '" height="' + s + '" aria-hidden="true" focusable="false">' + b + '</svg>';
  }
  function capFor(c, i) {
    var d = S.sw, a = d && ((d.cap && d.cap[c.id]) || (d.pic && d.pic[c.id] && d.pic[c.id].cap));
    return a && a[i] ? a[i] : null;
  }

  /* ---------- the map: one per case, the backdrop of the gallery and of the scene; the thumbnails crop the same paths ---------- */
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
  function mapAt(Pt, A, z) {   /* put map point Pt at stage point A, at zoom z: the map and the overlay read the same three numbers */
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
    st.style.setProperty('--b3top', t + 'px'); S.top = t;
  }
  /* a change that must not glide (first paint, a resize, a skipped entry, reduced motion): transitions off for one frame */
  function uncut() { requestAnimationFrame(function () { requestAnimationFrame(function () { if (!S.busy) delete st.dataset.cut; }); }); }
  function cut(fn) { st.dataset.cut = '1'; fn(); void st.offsetWidth; uncut(); }

  /* ---------- gallery ---------- */
  function heroTitle(c) { var i = c.h.indexOf(': '); return i > 0 ? [c.h.slice(0, i), c.h.slice(i + 2)] : [c.t, c.h]; }
  function galInit() {
    var rail = '';
    SORDER.forEach(function (g) {
      rail += '<span class="b3gl" aria-hidden="true">' + esc(g[0]) + '</span>';
      g[1].forEach(function (k) {
        var i = STORIES.findIndex(function (x) { return x.id === k; }); if (i < 0) return;
        var c = STORIES[i], n = nChoke(c);
        rail += '<button type="button" class="b3chip" data-b3c="' + i + '">' + mapSVG(c, true) + (n ? '<span class="b3sw" aria-hidden="true">' + '●'.repeat(Math.min(n, 4)) + '</span>' : '') + '<span class="b3ct"><b>' + esc(c.t) + '</b> <small>' + esc(c.when) + '</small><span class="b3vh"></span></span><i class="b3ok" aria-hidden="true">✓</i></button>';
      });
    });
    gal.innerHTML = '<div class="b3hero"><div class="b3kick"></div><h2></h2><div class="b3sub"></div><p class="b3sum"></p><div class="b3row"><button type="button" class="b3cta" data-b3="enter">Follow the chain ' + ARR + '</button><div class="b3pills"></div></div></div>'
      + '<div class="b3nav" role="group" aria-label="Choose a case"><button type="button" class="b3nb" data-b3="prev" aria-label="Previous case">' + CH_L + '</button><span class="b3cnt" aria-live="polite"></span><button type="button" class="b3nb" data-b3="next" aria-label="Next case">' + CH_R + '</button><button type="button" class="b3lnk" data-b3="ledger" hidden>All switches</button></div>'
      + '<div class="b3rail" role="group" aria-label="The fourteen cases">' + rail + '</div>';
  }
  function fillHero(i) {
    var c = STORIES[i], tt = heroTitle(c), k = nChoke(c), seen = D.seen();
    gal.querySelector('.b3kick').innerHTML = '<i></i>' + esc(D.group(c.id)) + ' · ' + esc(c.when);
    gal.querySelector('h2').textContent = tt[0];
    gal.querySelector('.b3sub').textContent = tt[1];
    gal.querySelector('.b3sum').textContent = sentences(c.sum, 2);
    gal.querySelector('.b3pills').innerHTML = '<span>' + c.steps.length + ' steps</span><span>' + (k ? k + (k === 1 ? ' switch' : ' switches') : 'no switch thrown') + '</span><span>' + D.layers(c).length + ' of ' + SLAY.length + ' layers</span>';
    gal.querySelector('.b3cnt').textContent = pad(ORD.indexOf(i) + 1) + ' / ' + pad(ORD.length);
    var rail = gal.querySelector('.b3rail');
    gal.querySelectorAll('.b3chip').forEach(function (b) {
      var j = +b.dataset.b3c, on = j === i, x = STORIES[j], sn = seen.indexOf(x.id) >= 0;
      b.setAttribute('aria-current', String(on)); b.classList.toggle('seen', sn);
      b.querySelector('.b3vh').textContent = sn ? ', followed' : '';   /* the button's name is the text it shows; the tick is said in words */
      /* scroll the rail itself, never scrollIntoView: that would scroll the page */
      if (on) rail.scrollTo({ left: b.offsetLeft - (rail.clientWidth - b.offsetWidth) / 2, behavior: still() || st.dataset.cut ? 'auto' : 'smooth' });
    });
  }
  var swapT = 0;
  function showCase(i, instant) {
    clearTimeout(swapT);
    var paint = function () { fillHero(i); if (S.shown !== i || !mapw.firstChild) mapw.innerHTML = mapSVG(STORIES[i]); S.shown = i; if (S.mode === 'gallery') galPose(); };
    if (instant || still() || S.shown < 0) { gal.classList.remove('sw'); mapw.classList.remove('swap'); paint(); return; }
    gal.classList.add('sw'); mapw.classList.add('swap');
    swapT = setTimeout(function () { paint(); void gal.offsetWidth; gal.classList.remove('sw'); mapw.classList.remove('swap'); }, 230);
  }
  function caseStep(d) { var k = ORD.indexOf(D.idx); D.pick(ORD[(k + d + ORD.length) % ORD.length]); }

  /* ---------- the scene: geometry ---------- */
  function wrap(t, n) { var w = String(t).split(' '), l = [], cur = ''; w.forEach(function (x) { if ((cur + ' ' + x).trim().length > n && cur) { l.push(cur); cur = x; } else cur = (cur + ' ' + x).trim(); }); if (cur) l.push(cur); return l.slice(0, 2); }
  function dshort(d) { var s = String(d).split(',')[0]; return s.length > 22 ? s.slice(0, 21) + '…' : s; }
  /* where the page puts a node: its own position, or its place with its offset (clamped as the stage of the round before did) */
  function nodePos(c, k) {
    var n = c.nodes[k], M = SMAPS[c.map];
    if (n.off && n.at && M.places[n.at]) { var p = M.places[n.at]; return [clamp(p[0] + n.off[0], 80, 920), clamp(p[1] + n.off[1], 118, 505)]; }
    return n.pos || (n.at && M.places[n.at]) || M.tagAt;
  }
  function geom(c) {
    var b = box(), W = b.W, H = b.H, P = phone(), s0 = Math.max(W / 1000, H / 580);
    var ids = []; c.steps.forEach(function (s) { [s.n].concat(s.frm || []).forEach(function (k) { if (ids.indexOf(k) < 0) ids.push(k); }); });
    var pts = ids.map(function (k) { return nodePos(c, k); }), all = pts.slice();
    if (c.inset) all.push([c.inset.x, c.inset.y], [c.inset.x + c.inset.w, c.inset.y + c.inset.h]);
    var xs = all.map(function (p) { return p[0]; }), ys = all.map(function (p) { return p[1]; });
    var x0 = Math.min.apply(0, xs) - 50, x1 = Math.max.apply(0, xs) + 50, y0 = Math.min.apply(0, ys) - 60, y1 = Math.max.apply(0, ys) + 60;
    var cw = P ? 0 : Math.min(440, window.innerWidth * .38);
    var R = P ? { x0: 20, x1: W - 20, y0: (S.top || 12) + 108, y1: H * .5 } : { x0: Math.max(cw + 60, W * .35), x1: W - 40, y0: (S.top || 96) + 54, y1: H - 120 };
    var z = clamp(Math.min((R.x1 - R.x0) / ((x1 - x0) * s0), (R.y1 - R.y0) / ((y1 - y0) * s0)), P ? .5 : .55, 2.2);
    return { c: c, W: W, H: H, P: P, s0: s0, z: z, ids: ids, pts: pts, P0: [(x0 + x1) / 2, (y0 + y1) / 2], A: [(R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2], R: R, cw: cw, k: 1 / (s0 * z), r: Math.round((P ? 20 : 27) * clamp(s0 * z / 1.05, .72, 1)) };
  }
  function toScreen(p, pose) { var G = S.G; return [G.A[0] + pose.z * G.s0 * (p[0] - pose.P[0]), G.A[1] + pose.z * G.s0 * (p[1] - pose.P[1])]; }
  /* the view for a step: the whole case, leaning 12% towards the node in hand and 6% closer. On a phone the case does not fit,
     so there the view follows the step (75% of the way, 25% closer). On wide screens the lean is held back where it would
     push a node off the stage or under the card. */
  function poseFor(n) {
    var G = S.G, N = G.c.steps.length, pose;
    if (n >= N || n < 0) pose = { P: G.P0.slice(), z: G.z };
    else { var p = nodePos(G.c, G.c.steps[n].n), f = G.P ? .75 : .12; pose = { P: [G.P0[0] + (p[0] - G.P0[0]) * f, G.P0[1] + (p[1] - G.P0[1]) * f], z: G.z * (G.P ? 1.25 : 1.06) }; }
    if (!G.P) {
      var r = G.r + 4, lim = { x0: G.cw + 20 + r + 10, x1: G.W - r - 10, y0: (S.top || 96) + r + 6, y1: G.H - 76 - r - 30 };
      for (var pass = 0; pass < 2; pass++) {
        var sc = G.pts.map(function (q) { return toScreen(q, pose); });
        var a = Math.min.apply(0, sc.map(function (q) { return q[0]; })), b = Math.max.apply(0, sc.map(function (q) { return q[0]; })), t = Math.min.apply(0, sc.map(function (q) { return q[1]; })), u = Math.max.apply(0, sc.map(function (q) { return q[1]; }));
        var fit = Math.min(1, (lim.x1 - lim.x0) / Math.max(1, b - a), (lim.y1 - lim.y0) / Math.max(1, u - t));
        if (fit < 1 && !pass) { pose.z *= fit; continue; }
        var dx = a < lim.x0 ? lim.x0 - a : b > lim.x1 ? lim.x1 - b : 0, dy = t < lim.y0 ? lim.y0 - t : u > lim.y1 ? lim.y1 - u : 0;
        pose.P = [pose.P[0] - dx / (pose.z * G.s0), pose.P[1] - dy / (pose.z * G.s0)]; break;
      }
    }
    return pose;
  }

  /* ---------- the scene: drawing ---------- */
  var iconG = function (name, s, c) { return '<g transform="translate(' + (-s / 2) + ',' + (-s / 2) + ') scale(' + (s / 24) + ')" fill="none" stroke="' + c + '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + (ICON[name] || ICON.target) + '</g>'; };
  /* Labels moved to clear a collision (the nodes stay where the page puts them): b below (the default), t above, l left, r right. */
  var LBL = { ukr: { tgt: 'l' }, border: { kmar: 't' }, kenya: { cantor: 'r', user: 'l', tsy: 't' }, nexperia: { mofcom: 't', wing: 'l', busan: 't', hague: 'l' }, huawei: { tsmc: 't', smic: 'l', hw: 'l' },
    russia: { mir: 'l', swift: 'l' }, nayara: { court: 'l' }, maven: { por: 'r' }, ice: { apps: 'r' }, garantex: { grx: 'l' } };
  function labelHTML(n, r, lp, chk) {
    var lines = wrap(n.label, 16), sub = n.sub ? (n.sub.length > 28 ? n.sub.slice(0, 27) + '…' : n.sub) : '', tot = lines.length * 14 + (sub ? 13 : 0), x = 0, y0, an = 'middle';
    if (lp === 't') y0 = -r - (chk ? 46 : 10) - tot + 11;
    else if (lp === 'l' || lp === 'r') { x = (lp === 'r' ? 1 : -1) * (r + 10); y0 = -tot / 2 + 11; an = lp === 'r' ? 'start' : 'end'; }
    else y0 = r + 17;
    return '<g class="nt" data-lp="' + lp + '"' + (an !== 'middle' ? ' style="text-anchor:' + an + '"' : '') + '>' + lines.map(function (t, q) { return '<text class="nl" x="' + x + '" y="' + (y0 + q * 14) + '">' + esc(t) + '</text>'; }).join('')
      + (sub ? '<text class="ns" x="' + x + '" y="' + (y0 + lines.length * 14 + 2) + '">' + esc(sub) + '</text>' : '') + '</g>';
  }
  function buildScene(i) {
    var c = STORIES[i], G = S.G = geom(c), k = G.k, r = G.r, M = SMAPS[c.map], f1 = function (v) { return v.toFixed(1); };
    var first = {}; c.steps.forEach(function (s, j) { (s.frm || []).forEach(function (f) { if (first[f] == null) first[f] = j; }); if (first[s.n] == null) first[s.n] = j; });
    var o = '<svg viewBox="0 0 1000 580" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">';
    if (c.inset) { var I = c.inset; o += '<g class="b3inset"><rect x="' + I.x + '" y="' + I.y + '" width="' + I.w + '" height="' + I.h + '" rx="10" vector-effect="non-scaling-stroke"/><g transform="translate(' + (I.x + 12) + ',' + (I.y + 18) + ') scale(' + k + ')"><text>' + esc(I.label.toUpperCase()) + '</text></g></g>'; }
    /* links: curves from where a step comes from to its node, bowed upwards */
    S.paths = {};
    c.steps.forEach(function (stp, j) {
      if (!stp.frm) return; var col = stp.choke ? RED : lc(stp.link);
      stp.frm.forEach(function (fk, m) {
        if (fk === stp.n) return;
        var a = nodePos(c, fk), b = nodePos(c, stp.n), dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, u = [dx / d, dy / d];
        var s0 = [a[0] + u[0] * (r + 8) * k, a[1] + u[1] * (r + 8) * k], e = [b[0] - u[0] * (r + 12) * k, b[1] - u[1] * (r + 12) * k];
        var nn = [dy / d, -dx / d]; if (nn[1] > 0) nn = [-nn[0], -nn[1]];
        var bend = .16 + m * .1, mid = [(s0[0] + e[0]) / 2 + nn[0] * d * bend, (s0[1] + e[1]) / 2 + nn[1] * d * bend];
        var path = 'M' + f1(s0[0]) + ',' + f1(s0[1]) + ' Q' + f1(mid[0]) + ',' + f1(mid[1]) + ' ' + f1(e[0]) + ',' + f1(e[1]);
        var tg = [e[0] - mid[0], e[1] - mid[1]], tl = Math.hypot(tg[0], tg[1]) || 1, tu = [tg[0] / tl, tg[1] / tl], pn = [-tu[1], tu[0]];
        var ah = 'M' + (e[0] + tu[0] * 3 * k) + ',' + (e[1] + tu[1] * 3 * k) + ' L' + (e[0] - tu[0] * 8 * k + pn[0] * 6 * k) + ',' + (e[1] - tu[1] * 8 * k + pn[1] * 6 * k) + ' L' + (e[0] - tu[0] * 8 * k - pn[0] * 6 * k) + ',' + (e[1] - tu[1] * 8 * k - pn[1] * 6 * k) + 'Z';
        var ve = 'vector-effect="non-scaling-stroke"';
        o += '<path class="fl glow" data-s="' + j + '" pathLength="1" d="' + path + '" stroke="' + col + '" ' + ve + '/>'
          + '<path class="fl' + (stp.choke ? ' chokel' : '') + '" data-s="' + j + '" pathLength="1" d="' + path + '" stroke="' + col + '" ' + ve + '/>'
          + '<path class="ah" data-s="' + j + '" d="' + ah + '" fill="' + col + '"/>';
        if (stp.choke) { var bm = [(s0[0] + 2 * mid[0] + e[0]) / 4, (s0[1] + 2 * mid[1] + e[1]) / 4]; o += '<g transform="translate(' + f1(bm[0]) + ',' + f1(bm[1]) + ') scale(' + k + ')"><g class="brk" data-s="' + j + '"><circle r="11"/><path d="M-4.5,-4.5L4.5,4.5M4.5,-4.5L-4.5,4.5" stroke="' + RED + '" stroke-width="2.2" stroke-linecap="round"/></g></g>'; }
        else (S.paths[j] = S.paths[j] || []).push([path, col]);
      });
    });
    o += '<g class="b3pts"></g>';
    /* nodes, each with a dotted lead to its place where the page names one */
    Object.keys(first).forEach(function (key) {
      var n = c.nodes[key], pos = nodePos(c, key), col = kc(n.kind), pl = n.at && M.places[n.at], lp = (S.lbl || LBL[c.id] || {})[key] || 'b';
      var lead = pl && Math.hypot(pl[0] - pos[0], pl[1] - pos[1]) > 6 ? '<line class="ld" x1="' + pl[0] + '" y1="' + pl[1] + '" x2="' + pos[0] + '" y2="' + pos[1] + '" vector-effect="non-scaling-stroke"/><circle class="ldot" cx="' + pl[0] + '" cy="' + pl[1] + '" r="' + (3.2 * k) + '"/>' : '';
      o += '<g class="nd" data-s="' + first[key] + '" data-n="' + key + '" style="--nc:' + col + '">' + lead + '<g transform="translate(' + pos[0] + ',' + pos[1] + ') scale(' + k + ')"><g class="nb"><circle class="ring" r="' + r + '"/><circle class="bd" r="' + r + '"/>' + iconG(n.icon, r * 1.08, col) + '</g>' + labelHTML(n, r, lp, c.steps.some(function (x) { return x.choke && x.n === key; })) + '</g></g>';
    });
    /* switches: one toggle above the node for each chokepoint step; two on one node sit side by side */
    var perNode = {}; c.steps.forEach(function (stp, j) { if (stp.choke) (perNode[stp.n] = perNode[stp.n] || []).push(j); });
    c.steps.forEach(function (stp, j) {
      if (!stp.choke) return; var pos = nodePos(c, stp.n), grp = perNode[stp.n], q = grp.indexOf(j), dx = (q - (grp.length - 1) / 2) * 46;
      o += '<g transform="translate(' + pos[0] + ',' + pos[1] + ') scale(' + k + ')"><g class="tg" data-s="' + j + '" data-st="live" transform="translate(' + dx + ',0)"><rect class="tr" x="-19" y="' + (-r - 35) + '" width="38" height="18" rx="9"/><circle class="kn" cx="0" cy="' + (-r - 26) + '" r="6.5"/></g><circle class="shock" data-k="' + j + '" r="' + r + '"/></g>';
    });
    world.innerHTML = o + '</svg>';
    S.built = i; S.first = first; S.cur = -2;
  }
  /* the lit marks that run along the link in hand: made when the step arrives, removed when it is left or the loop stops */
  function parts(arriving) {
    var g = world.querySelector('.b3pts'); if (!g) return;
    var P = S.run && S.mode === 'scene' && S.paths ? S.paths[S.cur] : null, k = S.G ? S.G.k : 1, o = '';
    var n = PF && PF.tier === 'low' ? 1 : PF && PF.tier === 'mid' ? 2 : 3;
    if (P) P.forEach(function (pc) { for (var x = 0; x < n; x++) o += '<g class="pt"><circle r="' + (7 * k) + '" fill="' + pc[1] + '" opacity=".25"/><circle r="' + (2.6 * k) + '" fill="#fff"/><animateMotion dur="2.2s" begin="' + (x * 2.2 / n).toFixed(2) + 's" repeatCount="indefinite" path="' + pc[0] + '"/></g>'; });
    g.innerHTML = o;
    if (o && arriving && g.animate) g.animate([{ opacity: 0 }, { opacity: 0, offset: .72 }, { opacity: 1 }], { duration: 1800, easing: 'ease' });
  }
  function swState(c, j) {   /* how a toggle stands once its step is reached */
    var w = swOf(c, j), s = w ? w.status : 'thrown';
    return s === 'threatened' ? 'warn' : s === 'standing' ? 'live' : 'off';
  }
  function setStep(n, o) {
    o = o || {};
    var G = S.G, c = G.c, N = c.steps.length; n = clamp(n, 0, N);
    var prev = S.cur; S.cur = n;
    var stp = n < N ? c.steps[n] : null, curNode = stp ? stp.n : null, w = stp ? swOf(c, n) : null, arriving = !o.instant && n !== prev && !still();
    world.querySelectorAll('[data-s]').forEach(function (e) { e.classList.toggle('on', n >= +e.dataset.s); });
    world.querySelectorAll('.nd').forEach(function (e) {
      var key = e.dataset.n, isCur = key === curNode;
      e.classList.toggle('cur', isCur); e.classList.toggle('past', !isCur && n >= +e.dataset.s && n < N);
      e.classList.toggle('chk', c.steps.some(function (x, j) { return x.n === key && x.choke && n >= j; }));
    });
    world.querySelectorAll('.fl').forEach(function (e) { var cu = +e.dataset.s === n; e.classList.toggle('cur', cu); e.classList.toggle('past', !cu && n < N); });
    world.querySelectorAll('.tg').forEach(function (t) { var j = +t.dataset.s, v = n >= j ? swState(c, j) : 'live'; if (t.dataset.st !== v) t.dataset.st = v; });
    var pose = poseFor(n), go = function () { mapAt(pose.P, G.A, pose.z); };
    if (o.instant || still()) cut(go); else go();
    var col = n >= N ? GOLD : stp.choke ? RED : lc(stp.link);
    st.style.setProperty('--b3gc', col);
    var gp = curNode ? toScreen(nodePos(c, curNode), pose) : G.A;
    st.style.setProperty('--b3gx', gp[0].toFixed(1) + 'px'); st.style.setProperty('--b3gy', gp[1].toFixed(1) + 'px');
    scenery(c, n, stp, w, col, arriving && n > prev);
    parts(arriving);
    drawCard(arriving || !!o.fresh); drawStrip();
    if (S.sheet === 'drawer') drawDrawer();
  }
  /* The living background: every step changes the scene behind the nodes. The light takes the colour of the link in hand
     (red on a switch, gold at the close; a fainter glow in the holder's colour on a switch); a texture, masked to a circle
     round the node, says what kind of step it is (the kind of link, or the switch's instrument); the step's date stands in
     outline behind everything. Arriving at a switch plays the one loud moment of the scene, as Web Animations: a flash at
     the node, a shockwave ring, and the toggle, live for a second and a half, flips off. A threatened switch keeps its
     toggle live with a dashed outline, in amber and without flash or ring; a standing one has no moment at all. */
  var tex = id('b3-tex'), wm = id('b3-wm'), redv = id('b3-redv'), flash = id('b3-flash'), OUT = 'cubic-bezier(.16, 1, .3, 1)';
  function texFor(stp, w) { return !stp ? 'end' : w ? w.instr : stp.choke ? 'control' : (LINK[stp.link] ? stp.link : 'data'); }
  function scenery(c, n, stp, w, col, fwd) {
    var N = c.steps.length, stt = w ? w.status : stp && stp.choke ? 'thrown' : '', tone = !stp || !stp.choke ? '' : stt === 'threatened' ? 'warn' : stt === 'standing' ? '' : 'red';
    var t = texFor(stp, w); if (tex && tex.dataset.t !== t) tex.dataset.t = t;
    st.style.setProperty('--b3tc', col); st.style.setProperty('--b3hc', w ? hcol(w) : 'transparent');
    if (redv && redv.dataset.tone !== tone) redv.dataset.tone = tone;
    if (wm) {
      var wt = n >= N ? c.t : dshort(stp.date);
      if (wm.textContent !== wt) { wm.textContent = wt; if (!still() && wm.animate && S.mode === 'scene') wm.animate([{ opacity: 0, transform: 'translate(60px, -50%)' }, { opacity: 1, transform: 'translate(0, -50%)' }], { duration: 1400, easing: OUT }); }
      if (wm.dataset.tone !== tone) wm.dataset.tone = tone;
    }
    if (!fwd || still() || tone !== 'red') return;
    if (flash && flash.animate) flash.animate([{ opacity: 0 }, { opacity: 1, offset: .12 }, { opacity: 0 }], { duration: 1000, easing: 'ease-out' });
    var sh = world.querySelector('.shock[data-k="' + n + '"]'), tg = world.querySelector('.tg[data-s="' + n + '"]');
    if (sh && sh.animate) sh.animate([{ transform: 'scale(.2)', opacity: .9 }, { transform: 'scale(7)', opacity: 0 }], { duration: 1400, delay: 500, easing: OUT });
    if (tg && tg.animate) {
      var o = { duration: 550, delay: 1500, easing: OUT, fill: 'backwards' };
      tg.querySelector('.kn').animate([{ transform: 'translateX(10px)', fill: '#44d7ec' }, { transform: 'translateX(-10px)', fill: '#ff3b5c' }], o);
      tg.querySelector('.tr').animate([{ fill: 'rgba(68, 215, 236, .12)', stroke: '#44d7ec' }, { fill: 'rgba(255, 59, 92, .22)', stroke: '#ff3b5c' }], o);
    }
  }

  /* ---------- depth: the drawer and the ledger ---------- */
  var drawer = id('b3-drawer'), ledger = id('b3-ledger'), opener = null, XB = '<button type="button" class="b3x" data-b3="close" aria-label="Close">✕</button>';
  function srcHTML(stp) {
    return '<p class="b3src">' + (stp.src ? (stp.ev === 'cap' ? 'Capability documented elsewhere · ' : 'Source: ') + esc(stp.src) + ' <span>· link not stored</span>' : 'Source: not stored') + '</p>';
  }
  function drawDrawer() {
    var c = S.G.c, N = c.steps.length, s = S.cur, w = s < N ? swOf(c, s) : null, h = XB;
    var lst = '<h3>This case</h3><ul class="b3sl">' + c.steps.map(function (x, j) { return '<li><button type="button" data-b3go="' + j + '"' + (j === s ? ' aria-current="step"' : '') + '><small>' + pad(j + 1) + '</small><span>' + esc(x.title) + (x.choke ? '<em>Switch</em>' : '') + '</span></button></li>'; }).join('') + '</ul>';
    if (s >= N) {
      h += '<div class="b3kk" style="--kc:' + GOLD + '"><i></i>' + esc(D.group(c.id)) + ' · ' + esc(c.when) + '</div><h2>' + esc(c.h) + '</h2><h3>The case</h3><p>' + esc(c.sum) + '</p>' + lst
        + '<h3>Sources</h3><ol class="b3srcs">' + c.steps.map(function (x) { return '<li>' + (x.src ? (x.ev === 'cap' ? 'Capability documented elsewhere · ' : '') + esc(x.src) : 'not stored') + '</li>'; }).join('') + '</ol><p class="b3src"><span>Links are not stored.</span></p>';
    } else {
      var stp = c.steps[s], lay = (SLAY.filter(function (l) { return l[0] === c.nodes[stp.n].lay; })[0] || ['', ''])[1];
      h += '<div class="b3kk" style="--kc:' + (stp.choke ? RED : lc(stp.link)) + '"><i></i>' + pad(s + 1) + ' / ' + pad(N) + ' · ' + esc(stp.date) + '</div><h2>' + esc(stp.title) + '</h2>'
        + (lay ? '<p class="b3lay">Layer of the stack <b>' + esc(lay) + '</b></p>' : '') + '<h3>The step</h3><p>' + esc(stp.text) + '</p>' + srcHTML(stp);
      if (w) h += '<h3>The switch in plain terms</h3><dl class="b3dl"><dt>Instrument</dt><dd data-f="instr">' + esc(S.sw.INSTR[w.instr] || w.instr) + '</dd><dt>Held by</dt><dd data-f="holder">' + glyph(w, 12, w.status === 'thrown') + ' ' + esc(w.holder) + '<small>' + HT[w.type] + ' · ' + OR[w.origin] + '</small></dd>'
        + (w.via ? '<dt>Through</dt><dd>' + esc(w.via) + '</dd>' : '') + '<dt>What it cuts</dt><dd data-f="cut">' + esc(w.cut) + '</dd><dt>Target</dt><dd>' + esc(w.target) + '</dd><dt>How long</dt><dd>' + esc(w.span) + '</dd>'
        + (w.restored ? '<dt>Restored</dt><dd>' + esc(w.restored) + '</dd>' : '') + '<dt>Their way out</dt><dd' + (w.exit ? '' : ' class="none"') + '>' + (w.exit ? esc(w.exit) : 'Not on the page') + '</dd></dl>';
      else if (stp.choke) h += '<p class="b3src">' + (S.swErr ? 'The switch list could not load.' : 'The switch list is loading.') + '</p>';
      h += lst;
    }
    drawer.innerHTML = h;
  }
  var FCH = [['all', 'All'], ['usstate', 'US state'], ['usfirm', 'US firms'], ['other', 'Others'], ['joint', 'Joint']];
  function fpass(w, f) { return f === 'all' || (f === 'usstate' && w.type === 'state' && w.origin === 'US') || (f === 'usfirm' && w.type === 'private' && w.origin === 'US') || (f === 'other' && w.origin === 'other') || (f === 'joint' && (w.type === 'joint' || w.origin === 'mixed')); }
  function drawLedger() {
    if (!S.sw) { ledger.innerHTML = XB + '<h2>All switches</h2><p class="b3lead">' + (S.swErr ? 'The switch list could not load.' : 'The switch list is loading.') + '</p>'; return; }
    var f = S.filt || 'all', ci = function (k) { return STORIES.findIndex(function (x) { return x.id === k; }); };
    var rows = S.sw.SW.filter(function (w) { return ci(w['case']) >= 0; }).sort(function (a, b) { return ORD.indexOf(ci(a['case'])) - ORD.indexOf(ci(b['case'])) || a.step - b.step; });
    ledger.innerHTML = XB + '<h2>All ' + rows.length + ' switches</h2><p class="b3lead">Every chokepoint in the ' + STORIES.length + ' cases, with who holds it. Pick one to be thrown into the case at that step.</p>'
      + '<div class="b3fch" role="group" aria-label="Held by">' + FCH.map(function (k) { return '<button type="button" data-b3f="' + k[0] + '" aria-pressed="' + (f === k[0]) + '">' + k[1] + ' <b>' + rows.filter(function (w) { return fpass(w, k[0]); }).length + '</b></button>'; }).join('') + '</div>'
      + '<div class="b3lg">' + rows.map(function (w) {
        var i = ci(w['case']), c = STORIES[i], stp = c.steps[w.step - 1], on = fpass(w, f);
        return '<button type="button" class="b3lc" data-b3j="' + i + ':' + (w.step - 1) + '" data-sw="' + w.id + '"' + (on ? '' : ' disabled') + '><span class="a">' + glyph(w, 14, w.status === 'thrown') + esc(hname(w)) + '</span><span class="b">' + esc(w.cut) + '</span><span class="c">' + esc(c.t) + ' · ' + esc(dshort(stp ? stp.date : w.date)) + '</span></button>';
      }).join('') + '</div>';
  }
  /* the ledger covers the whole frame: what lies under it (the site's header, the dock) is out of reach while it is open */
  function under(off) { [X.root.querySelector('.hud-top'), id('dock')].forEach(function (e) { if (e) e.inert = off; }); }
  function openSheet(which, from) {
    if (S.busy || (which === 'drawer' && S.mode !== 'scene')) return;
    if (S.sheet) closeSheets(true);
    S.sheet = which; opener = from || document.activeElement;
    var el = which === 'drawer' ? drawer : ledger; if (which === 'drawer') drawDrawer(); else drawLedger();
    el.inert = false; el.classList.add('on'); st.dataset.sheet = which; hud.inert = true; gal.inert = true; under(which === 'ledger');
    var f = el.querySelector('.b3x'); if (f) f.focus({ preventScroll: true });
  }
  function closeSheets(quiet) {
    if (!S.sheet) return;
    [drawer, ledger].forEach(function (e) { e.classList.remove('on'); e.inert = true; }); delete st.dataset.sheet; S.sheet = null;
    hud.inert = S.mode !== 'scene'; gal.inert = S.mode !== 'gallery'; under(false);
    if (!quiet) { var to = opener && opener.isConnected ? opener : S.mode === 'scene' ? card.querySelector('.b3more') || hud.querySelector('.b3deep button') : gal.querySelector('.b3lnk'); if (to) to.focus({ preventScroll: true }); }
    opener = null;
  }

  /* ---------- the card ---------- */
  function seeHTML(c) {
    var used = D.layers(c).map(lower1), ck = [], cl = S.sw && S.sw.pic && S.sw.pic[c.id] && S.sw.pic[c.id].close;
    c.steps.forEach(function (x, j) { if (x.choke) { var w = swOf(c, j); ck.push('“' + x.title + '”' + (w ? ' (held by ' + hname(w) + ')' : '')); } });
    return '<p>This chain runs through ' + used.length + ' of the stack’s ' + SLAY.length + ' layers: ' + esc(list(used)) + '.</p><p>'
      + (cl && cl.text ? esc(cl.text) : ck.length ? 'It has ' + (ck.length === 1 ? 'one switch' : ck.length + ' switches') + ': ' + esc(list(ck)) + '.' : 'No link in this chain was cut: every step ran as built.') + '</p>';
  }
  function drawCard(animate) {
    var c = S.G.c, N = c.steps.length, s = S.cur, inn = card.querySelector('.b3in'), h, tone = '';
    if (s >= N) {
      var nx = STORIES[ORD[(ORD.indexOf(S.built) + 1) % ORD.length]], cl = S.sw && S.sw.pic && S.sw.pic[c.id] && S.sw.pic[c.id].close;
      h = '<div class="b3kk"><i></i>What you can now see<span>' + esc(c.t) + '</span></div><h2>' + esc(cl && cl.title ? cl.title : c.t) + '</h2><div class="b3see">' + seeHTML(c) + '</div>'
        + '<div class="b3acts"><button type="button" class="b3btn pri" data-b3="nextcase">Next: ' + esc(nx.t) + '</button><button type="button" class="b3btn" data-b3="replay">Replay</button><button type="button" class="b3btn" data-b3="leave">All cases</button></div>';
      card.style.setProperty('--kc', GOLD);
    } else {
      var stp = c.steps[s], w = swOf(c, s), stt = w ? w.status : stp.choke ? 'thrown' : '', cap = capFor(c, s);
      var chip = !stp.choke ? '' : '<span class="b3chk' + (stt === 'threatened' ? ' warn' : stt === 'standing' ? ' idle' : '') + '">' + (stt === 'threatened' ? 'Threatened' : stt === 'standing' ? 'Can be thrown any day' : 'Switch') + '</span>';
      tone = !stp.choke ? '' : stt === 'threatened' ? 'warn' : stt === 'standing' ? '' : 'chk';
      h = '<div class="b3kk"><i></i>' + chip + '<em>' + esc(dshort(stp.date)) + '</em><span>' + pad(s + 1) + ' / ' + pad(N) + '</span></div><h2>' + esc(stp.title) + '</h2><p class="b3cap">' + esc(cap || stp.text) + '</p>';
      if (w) h += '<div class="b3who">' + glyph(w, 16, stt === 'thrown') + '<div><small>Held by</small><b>' + esc(hname(w)) + '</b><span class="t">' + HT[w.type] + ' · ' + OR[w.origin] + '</span></div></div>';
      h += moreHTML(!!w);
      card.style.setProperty('--kc', stp.choke ? (stt === 'threatened' ? '#ffb547' : RED) : lc(stp.link));
    }
    if (card.dataset.tone !== tone) card.dataset.tone = tone;
    inn.innerHTML = h;
    if (animate && !still() && inn.animate) [].forEach.call(inn.children, function (e, q) { e.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 620, delay: q * 70, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'backwards' }); });
  }
  function moreHTML(sw) { return '<button type="button" class="b3more" data-b3="read">' + (sw ? 'The switch in plain terms' : 'Full text and sources') + ' ' + ARR + '</button>'; }

  /* ---------- the strip: the shared bar (v2/route.js) in its scene skin ---------- */
  function drawStrip() {
    if (!RT) return;
    var c = S.G.c, N = c.steps.length, s = S.cur;
    RT.render(bar, { id: 'scenarios', skin: 'strip', label: 'Scenario: steps', stage: st, dock: false,
      back: { enabled: true, label: s > 0 ? 'Back: ' + c.steps[Math.min(s, N) - 1].title : 'Back to all cases' },
      next: { kind: 'go', enabled: true, kicker: s >= N ? 'Done' : 'Next', title: s >= N ? 'Next case' : 'Next' },
      steps: c.steps.map(function (x, j) { var n = c.nodes[x.n]; return { icon: ICON[n.icon] || ICON.target, colour: x.choke ? RED : kc(n.kind), state: j === s ? 'cur' : j < s || s >= N ? 'done' : '', target: String(j), cut: !!x.choke, title: 'Step ' + (j + 1) + ': ' + x.title + (x.choke ? ' · switch' : '') }; }) });
    /* on a narrow screen the steps scroll inside the strip: keep the step in hand in the middle (the strip's own scroll, never the page's) */
    var rr = bar.querySelector('.rt-route'), cu = rr && rr.querySelector('.rt-sp.c');
    if (rr && rr.scrollWidth > rr.clientWidth + 1) rr.scrollLeft = cu ? cu.offsetLeft - (rr.clientWidth - cu.offsetWidth) / 2 : s >= N ? rr.scrollWidth : 0;
    fitStrip();
  }
  /* the strip sits in the middle; where the dock in its corner would touch it, it moves left by what is needed */
  function fitStrip() {
    bar.style.setProperty('--b3sx', '0px');
    var dock = id('dock'); if (!dock || phone() || !dock.getClientRects().length || getComputedStyle(dock).position !== 'absolute') return;
    var a = bar.getBoundingClientRect(), d = dock.getBoundingClientRect();
    if (d.top < a.bottom && d.bottom > a.top && a.right > d.left - 14) bar.style.setProperty('--b3sx', Math.ceil(a.right - d.left + 14) + 'px');
  }
  function hideStrip() { if (RT) RT.render(bar, { id: 'scenarios', hidden: true, dock: false }); }

  /* ---------- entering and leaving a case ---------- */
  var sleep = function (ms) { return new Promise(function (r) { if (S.skip || still()) return r(); var t = setTimeout(r, ms); S.sleepers.push(function () { clearTimeout(t); r(); }); }); };
  function doSkip() { if (!S.busy) return; S.skip = true; st.dataset.cut = '1'; S.sleepers.splice(0).forEach(function (f) { f(); }); }
  function setMode(m) {
    S.mode = m; st.dataset.mode = m;
    X.root.classList.toggle('b3-in', m === 'scene'); X.root.classList.toggle('b3-ent', m === 'entering');
    gal.inert = m !== 'gallery'; hud.inert = m !== 'scene'; if (lede) lede.inert = m !== 'gallery';
    if (PF) PF.sync();
  }
  function land(n) {   /* the end state of an entry, however it was reached */
    gal.classList.add('gone'); setMode('scene');
    S.cur = -2; setStep(n, { fresh: true, instant: S.skip || still() });
    var ae = document.activeElement;
    if (!ae || ae === document.body || gal.contains(ae) || (lede && lede.contains(ae))) { var nx = RT && RT.next('scenarios'); if (nx) nx.focus({ preventScroll: true }); }
  }
  function enter(i, n) {
    S.busy = true; S.skip = false; var c = STORIES[i];
    if (S.shown !== i) showCase(i, true);
    buildScene(i); card.querySelector('.b3in').innerHTML = '';
    var settle = function () { veil.classList.remove('on'); tc.className = 'b3tc'; st.style.setProperty('--b3iris', '120%'); S.busy = false; if (st.dataset.cut) uncut(); };
    if (still()) { gal.classList.add('out'); land(n); settle(); return Promise.resolve(); }
    setMode('entering'); gal.classList.add('out');
    var p = poseFor(n); mapAt(p.P, S.G.A, p.z);                 /* the map glides to the case's framing while the title card plays */
    veil.classList.add('on'); st.style.setProperty('--b3iris', '120%'); void veil.offsetWidth; st.style.setProperty('--b3iris', '30%');
    return sleep(650).then(function () {
      tc.querySelector('.k').textContent = D.group(c.id) + ' · ' + c.when; tc.querySelector('.h').textContent = c.t; tc.querySelector('.s').textContent = heroTitle(c)[1];
      tc.className = 'b3tc'; void tc.offsetWidth; tc.classList.add('show');
      return sleep(2000);
    }).then(function () {
      tc.classList.remove('show'); tc.classList.add('hide'); st.style.setProperty('--b3iris', '130%');
      return sleep(550);
    }).then(function () {
      land(D.step < 0 ? 0 : D.step);
      return sleep(900);
    }).then(settle);
  }
  var leaveT = 0;
  function leave(instant) {
    var had = hud.contains(document.activeElement);
    clearTimeout(leaveT); hideStrip(); closeSheets();
    var go = function () { setMode('gallery'); gal.classList.remove('gone'); void gal.offsetWidth; gal.classList.remove('out'); galPose(); };
    if (instant || still()) cut(go); else go();
    leaveT = setTimeout(function () { if (S.mode === 'gallery') { world.innerHTML = ''; S.built = -1; S.cur = -2; } }, instant || still() ? 0 : 1000);
    if (had) { var b = gal.querySelector('.b3cta'); if (b) b.focus({ preventScroll: true }); }
  }

  /* ---------- the page tells us where it stands ---------- */
  function sync(o) {
    o = o || {};
    if (X.view !== 'story') return;
    topFit();
    var i = D.idx, n = D.step;
    if (S.busy) doSkip();
    if (n < 0) {
      if (S.mode !== 'gallery') { leave(!!o.instant); showCase(i, true); }
      else { if (st.dataset.mode !== 'gallery') setMode('gallery'); hideStrip(); showCase(i, o.instant || S.shown === i); }
      return;
    }
    if (o.jump && S.mode !== 'gallery') leave(true);
    if (S.mode === 'gallery') { enter(i, n); return; }
    if (S.built !== i) { showCase(i, true); buildScene(i); setStep(n, { instant: true, fresh: true }); return; }
    setStep(n, o);
  }

  /* ---------- events ---------- */
  st.addEventListener('click', function (e) { if (S.busy) { e.preventDefault(); e.stopPropagation(); doSkip(); } }, true);
  st.addEventListener('click', function (e) {
    if (e.target.closest('#isx-sc-tofin')) { X.setView('fin'); return; }   /* the sentence above the gallery links to the Simulator */
    var c = e.target.closest('[data-b3c]'); if (c) { D.pick(+c.dataset.b3c); return; }
    var t = e.target.closest('[data-b3]'); if (!t) return;
    var a = t.dataset.b3;
    if (a === 'enter' || a === 'replay') D.set(0);
    else if (a === 'prev') caseStep(-1);
    else if (a === 'next') caseStep(1);
    else if (a === 'leave') D.set(-1);
    else if (a === 'nextcase') D.nav(1);
    else act(a, t);
  });
  function act(a, t) {
    if (a === 'read') openSheet('drawer', t);
    else if (a === 'ledger') openSheet('ledger', t);
    else if (a === 'close') closeSheets();
  }
  st.addEventListener('click', function (e) {
    if (S.sheet === 'drawer' && e.target === st) { closeSheets(); return; }   /* a click on the dark sheet beside the drawer closes it */
    var g = e.target.closest('[data-b3go]'); if (g) { D.set(+g.dataset.b3go); var f = drawer.querySelector('[aria-current="step"]'); if (f) f.focus({ preventScroll: true }); return; }
    var fl = e.target.closest('[data-b3f]'); if (fl) { S.filt = fl.dataset.b3f; drawLedger(); var b = ledger.querySelector('[data-b3f="' + S.filt + '"]'); if (b) b.focus({ preventScroll: true }); return; }
    var j = e.target.closest('[data-b3j]'); if (j) { var q = j.dataset.b3j.split(':'); closeSheets(true); D.pick(+q[0], { step: +q[1], jump: true }); }
  });
  document.addEventListener('keydown', function (e) {
    if (X.view !== 'story' || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (S.busy) { doSkip(); return; }
    var t = e.target, inField = t && t.closest && t.closest('input, textarea, select, [role="dialog"], .shpop'), onCtl = t && t.closest && t.closest('button, a, summary');
    if (inField) return;
    var r = st.getBoundingClientRect(); if (r.bottom < 80 || r.top > window.innerHeight - 80) return;
    if (keySheet(e)) return;
    if (S.mode === 'gallery') {
      if (e.key === 'ArrowRight') { e.preventDefault(); caseStep(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); caseStep(-1); }
      else if (e.key === 'Enter' && !onCtl) { e.preventDefault(); D.set(0); }
    } else if (S.mode === 'scene') {
      if (e.key === ' ' && !onCtl) { e.preventDefault(); D.nav(1); }
      else if (e.key === 'Escape') { e.preventDefault(); D.set(-1); }
    }
  });
  function keySheet(e) { if (!S.sheet) return false; if (e.key === 'Escape') { e.preventDefault(); closeSheets(); } return true; }
  var rz = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rz); rz = setTimeout(function () {
      if (X.view !== 'story') return;
      if (S.busy) doSkip();
      topFit();
      if (S.mode === 'scene' && S.built >= 0) { var n = S.cur; buildScene(S.built); setStep(n, { instant: true }); }
      else if (S.mode === 'gallery') cut(galPose);
    }, 150);
  });
  X.on('view', function (v) { if (v !== 'story') { if (S.busy) doSkip(); if (PF) PF.sync(); } });
  X.on('motion', function () { if (X.view === 'story' && S.mode === 'scene') parts(false); });
  /* the loop registry decides when the scene's loops may run (the marks on the link, the pulse, the drifting textures) */
  if (PF && PF.loop) PF.loop({ name: 'scenes', el: st, want: function () { return X.view === 'story' && S.mode === 'scene'; },
    start: function () { if (S.run) return; S.run = true; st.classList.add('run'); parts(false); }, stop: function () { if (!S.run) return; S.run = false; st.classList.remove('run'); parts(false); } });

  galInit(); setMode('gallery');
  id('b3-deep').innerHTML = '<button type="button" data-b3="read">Read</button><button type="button" data-b3="ledger">All switches</button>';
  gal.querySelector('.b3lnk').hidden = false;
  X.load('switches').then(function (d) {
    S.sw = d; (d.SW || []).forEach(function (w) { S.by[w['case'] + ':' + w.step] = w; });
    if (X.view === 'story' && S.mode === 'scene' && S.built >= 0) { drawCard(false); if (S.sheet === 'drawer') drawDrawer(); }
    if (S.sheet === 'ledger') drawLedger();
  }).catch(function () { S.swErr = true; if (S.sheet === 'ledger') drawLedger(); });
  X.scenes = { sync: sync, build: function (i, lbl) { S.lbl = lbl || null; buildScene(i); S.lbl = null; }, skip: doSkip, get mode() { return S.mode; }, get busy() { return S.busy || !!S.sheet; }, get sheet() { return S.sheet; }, get geom() { return S.G; }, pose: function (n) { return S.G ? poseFor(n == null ? S.cur : n) : null; }, pos: function (k) { return S.G ? nodePos(S.G.c, k) : null; }, get sw() { return S.sw; }, get swErr() { return S.swErr; } };
  if (X.view === 'story') sync({ instant: true });
})();
