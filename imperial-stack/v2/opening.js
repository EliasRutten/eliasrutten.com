/* The Imperial Stack v2 · opening.js (round 5b, 16 Nov 2026; entry spec §4)
   The Circuit's first opening, once per browser, on a first visit that arrives without a link into the map. (The Simulator's, which
   animated the machinery's old in-page entry card, went with that card on 19 Nov 2026: the tab's entry screen is v2/enter.js.) Restrained on purpose: the title first, one gold line as the only moving mark, the
   machine after; slow ease-outs, nothing bursts, bounces, glows or shakes, no sound, nothing tied to the pointer.
   Any key, click or tap skips (the rest resolves in a quarter of a second); under reduced motion neither plays.
   Cost: only opacity and transform are animated (and stroke-dashoffset on small SVG lines). Nothing filters, masks or clips the globe's
   canvas; the globe's push-in is one transform on its box. Each opening is one timeline: Web Animations for what moves, and a few
   small steps on the same clock (a count, a marker on a line), so a frame can be shown at any time (ISX.opening.seek, for the
   frame strips and the checks). The registry (v2/perf.js) owns it as a one-shot loop, “opening”: it starts only while the stage
   is in view and ends at once if the browser tab is hidden.
   Storage: isx-open-circuit ('1' once played). “#replay” in the address plays it again. The check scripts' switch
   isx-tips-sim = 'off' keeps it away. */
(function () {
  'use strict';
  var X = window.ISX; if (!X) return;
  var U = X.util, root = X.root, $ = X.$, P = X.perf, NS = 'http://www.w3.org/2000/svg';
  var KEY = { circuit: 'isx-open-circuit' }, EASE = 'cubic-bezier(.22,.61,.36,1)';
  var live = null, pending = null, ran = null, queue = [], replay = !!window.__isxReplay;
  var mk = function (tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; e.setAttribute('aria-hidden', 'true'); return e; };
  var sv = function (tag, at) { var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); return e; };
  var testOff = function () { return U.stGet('isx-tips-sim') === 'off'; };

  /* ---------- one timeline ---------- */
  function TL(name, dur) { this.name = name; this.dur = dur; this.anims = []; this.steps = []; this.ticks = []; this.undo = []; this.t = 0; this.rate = 1; this.begun = false; this.done = false; this.held = false; }
  TL.prototype.a = function (el, kf, at, d, o) {
    if (!el || !el.animate) return null;
    var an = el.animate(kf, Object.assign({ delay: at * 1000, duration: d * 1000, easing: EASE, fill: 'both' }, o || {}));
    an.pause(); an.currentTime = this.t * 1000;   /* every animation sits on the timeline's own clock, whenever it was made */
    if (this.begun && !this.held) { an.updatePlaybackRate(this.rate); an.play(); }
    this.anims.push(an); return an;
  };
  TL.prototype.at = function (t, fn) { this.steps.push({ t: t, fn: fn, hit: false }); };
  TL.prototype.tick = function (fn) { this.ticks.push(fn); };
  TL.prototype.run = function (t) {
    this.t = t;
    for (var i = 0; i < this.steps.length; i++) { var s = this.steps[i]; if (!s.hit && t >= s.t) { s.hit = true; try { s.fn(t); } catch (e) { /* a step never breaks the opening */ } } }
    for (var j = 0; j < this.ticks.length; j++) { try { this.ticks[j](t); } catch (e) { /* ignore */ } }
  };
  TL.prototype.begin = function () {
    if (this.begun || this.done) return; this.begun = true;
    var self = this, last = performance.now();
    this.anims.forEach(function (an) { an.play(); });
    (function f(now) {
      if (self.done || self.held) return;
      var nt = Math.min(self.dur, self.t + Math.max(0, now - last) / 1000 * self.rate);
      /* a gate holds the clock (and everything on it) at one moment until it opens: the Circuit's waits there for the globe */
      if (self.gate && self.rate === 1 && self.gate(nt)) {
        if (!self.gated) { self.gated = true; var ms = self.t * 1000; self.anims.forEach(function (an) { try { an.pause(); an.currentTime = ms; } catch (e) { /* ignore */ } }); }
        self.run(self.t); last = now; self.raf = requestAnimationFrame(f); return;   /* its ticks still run, at the held moment */
      }
      if (self.gated) { self.gated = false; self.anims.forEach(function (an) { try { an.play(); } catch (e) { /* ignore */ } }); }
      self.run(nt); last = now;
      if (self.t >= self.dur) { self.end(); return; }
      self.raf = requestAnimationFrame(f);
    })(last);
  };
  /* the rest in a quarter of a second */
  TL.prototype.skip = function () {
    if (this.done) return; if (!this.begun) { this.end(); return; }
    if (this.gated) { this.gated = false; this.anims.forEach(function (an) { try { an.play(); } catch (e) { /* ignore */ } }); }
    var left = this.dur - this.t; if (left <= .25) return;
    this.rate = left / .25; var r = this.rate; this.anims.forEach(function (an) { try { an.updatePlaybackRate(r); } catch (e) { /* ignore */ } });
  };
  /* hold the timeline at one moment (frame strips, checks) */
  TL.prototype.seek = function (t) {
    this.begun = true; this.held = true; cancelAnimationFrame(this.raf);
    this.run(Math.max(0, Math.min(this.dur, t)));
    var ms = this.t * 1000; this.anims.forEach(function (an) { try { an.pause(); an.currentTime = ms; } catch (e) { /* ignore */ } });
  };
  TL.prototype.end = function () {
    if (this.done) return; this.done = true; cancelAnimationFrame(this.raf);
    this.run(this.dur);
    this.anims.forEach(function (an) { try { an.cancel(); } catch (e) { /* ignore */ } });
    this.undo.forEach(function (fn) { try { fn(); } catch (e) { /* ignore */ } });
    finish(this);
  };

  /* ---------- skipping: any key, click or tap ---------- */
  var swallowUntil = 0;
  function onKey(e) { if (!live || live.held) return; if (e.key === 'Tab' || e.metaKey || e.ctrlKey || e.altKey) return; e.preventDefault(); e.stopPropagation(); live.skip(); }
  function onDown(e) { if (!live || live.held) return; swallowUntil = performance.now() + 600; live.skip(); }
  function onClick(e) { if (performance.now() < swallowUntil) { swallowUntil = 0; e.preventDefault(); e.stopPropagation(); } }   /* the press that skipped does not also press what was under it */
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('pointerdown', onDown, true);
  window.addEventListener('click', onClick, true);

  function start(tl) {
    live = tl; pending = null; root.classList.add('op-on');
    P.sync();   /* the registry starts it if the stage is in view and the browser tab is showing */
  }
  function finish(tl) {
    if (live === tl) live = null;
    ran = tl.name; U.stSet(KEY[tl.name], '1');
    root.classList.remove('op-on', 'op-c');
    var q = queue; queue = [];
    q.forEach(function (w) { if (w[0] === tl.name) { try { w[1](); } catch (e) { /* ignore */ } } else queue.push(w); });
    X.emit('opening', null);
  }
  P.loop({ name: 'opening', el: function () { return live ? live.stage : null; }, want: function () { return !!live && !live.held; },
    start: function () { if (live && !live.begun) live.begin(); },
    stop: function () { if (live && live.begun && !live.held && !live.done && (document.hidden || X.reduce)) live.end(); } });

  /* ================= the Circuit: “The world's savings come home”, 6.6 s on its clock, 5 s seen ================= */
  var rad = Math.PI / 180;
  var vec = function (lat, lng) { var a = lat * rad, b = lng * rad; return [Math.cos(a) * Math.cos(b), Math.cos(a) * Math.sin(b), Math.sin(a)]; };
  var dot = function (a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; };
  /* a flow's line as the globe draws it: a cubic curve through space from one end to the other, lifted at a quarter and three
     quarters of the way by one and a half times the arc's height (the globe library's own construction), then put on the screen */
  function arcPts(g, a, b, n) {
    var va = vec(a[0], a[1]), vb = vec(b[0], b[1]), om = Math.acos(Math.max(-1, Math.min(1, dot(va, vb)))), A = om / 2 * .3, s = Math.sin(om), out = [];
    var on = function (t, r) { var k1 = om < 1e-6 ? 1 - t : Math.sin((1 - t) * om) / s, k2 = om < 1e-6 ? t : Math.sin(t * om) / s; return [(va[0] * k1 + vb[0] * k2) * r, (va[1] * k1 + vb[1] * k2) * r, (va[2] * k1 + vb[2] * k2) * r]; };
    var p1 = on(.25, 1 + 1.5 * A), p2 = on(.75, 1 + 1.5 * A);
    for (var i = 0; i <= n; i++) {
      var t = i / n, u = 1 - t, w0 = u * u * u, w1 = 3 * u * u * t, w2 = 3 * u * t * t, w3 = t * t * t;
      var v = [0, 1, 2].map(function (j) { return va[j] * w0 + p1[j] * w1 + p2[j] * w2 + vb[j] * w3; }), m = Math.hypot(v[0], v[1], v[2]) || 1;
      var c = g.getScreenCoords(Math.asin(v[2] / m) / rad, Math.atan2(v[1], v[0]) / rad, m - 1);
      out.push([c.x, c.y]);
    }
    return out;
  }
  /* the loop, from the map's own flows, in the order of the ten steps: dollars out to the makers (02), hardware back (05), the
     surplus home to Wall Street (07), and Wall Street on to the platforms (10). Only flows whose two ends face the visitor. */
  function loopPaths(g, pov) {
    var LL = X.data.LL, cam = vec(pov.lat, pov.lng), lim = 1 / (1 + pov.altitude) + .03;
    var see = function (k) { return LL[k] && dot(vec(LL[k][0], LL[k][1]), cam) > lim; };
    var top = function (key, n) { return X.flows(key).filter(function (f) { return see(f.from) && see(f.to); }).sort(function (a, b) { return b.k - a.k; }).slice(0, n); };
    var seq = top('capex', 2).concat(top('asm', 2), top('recycle', 3), X.flows('all').filter(function (f) { return f.from === 'NYC' && f.to === 'PLAT' && see('NYC') && see('PLAT'); }));
    var seen = {}, out = [];
    seq.forEach(function (f) { var k = f.from + '>' + f.to; if (seen[k]) return; seen[k] = 1; out.push(arcPts(g, LL[f.from], LL[f.to], 30)); });
    return out;
  }
  function circuit() {
    var gb = root.querySelector('#isx-scene-map .globebox'), scene = $('scene-map'); if (!gb || !scene) return false;
    var tl = new TL('circuit', 6.6); tl.stage = scene;
    /* first-visit welcome (18 Nov): the motion stays, its title and its Skip button are gone (a click, a tap or any key still jumps to
       the end, and the welcome card follows). The timeline keeps its clock but starts 1.6 s in, where the title used to give way, when
       the line is laid; while the globe is still loading, the clock holds at 2.6 s (3 s at most), so the line is laid on its arcs. */
    tl.t = 1.6;
    /* the dark: a plain cover laid over the globe (the canvas itself is never touched) */
    var dark = mk('i', 'op-dark'), gl = mk('div', 'op-gl');
    var gh = $('globe'); gh.appendChild(dark); gh.appendChild(gl);   /* inside the globe's own box, so the line stays on the globe wherever the layout puts it */
    tl.undo.push(function () { [dark, gl].forEach(function (e) { e.remove(); }); });
    /* dawn, with a slow push-in: the cover lifts while the camera comes in by a tenth (below). The globe's box is never scaled: the
       page sizes the canvas from that box, and would size it wrong */
    tl.a(dark, [{ opacity: 1 }, { opacity: 0 }], 3.1, 2.5, { easing: 'cubic-bezier(.3,.2,.3,1)' });
    /* the instruments settle, 150 ms apart: figures, card, legend and controls, the step bar */
    var settle = [['.resbar', '.vchip'], ['.cmd6', '.mstep'], ['.legbox2', '.zoom6', '.mapmodes', '.hint', '.mapnote'], ['.tabs-bottom', '.dock6', '.b4row']];
    var all = settle.reduce(function (a, b) { return a.concat(b); }, []).join(', ');
    if (!root.classList.contains('wl-stage')) settle.forEach(function (grp, i) { grp.forEach(function (sel) { root.querySelectorAll('#isx-frame ' + sel).forEach(function (el) { if (el.parentElement && el.parentElement.closest(all)) return;   /* one that sits inside another settles with it */
      tl.a(el, [{ opacity: 0 }, { opacity: 1 }], 5.4 + i * .15, .75); }); }); });
    /* the line: drawn in the dark, on the place the globe's own arcs take once the dawn has come */
    var built = false, tries = 0, pov = null, aimedAt = 0, aimedTicks = 0, lineSvg = null, lastA = null;
    /* first hold the globe still on the step's own view; the camera takes its place when the globe next draws, so the line is
       measured a few frames later, never in the same breath */
    function aim() { var g = X.globe; if (!g || !gb.classList.contains('gl-ready')) return false; try { g.controls().autoRotate = false; pov = X.stepPov(); g.pointOfView(pov, 0); } catch (e) { return false; } aimedAt = performance.now(); aimedTicks = 0; return true; }
    function build() {
      var g = X.globe; if (built || !g || !pov) return false;
      var box = $('globe').getBoundingClientRect(), w = box.width, h = box.height; if (!w || !h) return false;
      var svg = sv('svg', { 'class': 'op-svg', viewBox: '0 0 ' + w + ' ' + h, width: w, height: h }); gl.appendChild(svg); lineSvg = svg;
      var paths = []; try { paths = loopPaths(g, pov); } catch (e) { paths = []; }
      var lens = paths.map(function (p) { var L = 0; for (var i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; }), sum = lens.reduce(function (a, b) { return a + b; }, 0) || 1;
      var t0 = 2.9, span = 2.3, at = t0, grp = sv('g', { 'class': 'op-loop' }); svg.appendChild(grp);
      paths.forEach(function (p, i) {
        var d = Math.max(.42, span * lens[i] / sum + .18), el = sv('path', { d: 'M' + p.map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('L'), pathLength: 100 });
        el.style.strokeDasharray = '100'; grp.appendChild(el);
        tl.a(el, [{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], Math.min(at, t0 + span - d), d);
        at += span * lens[i] / sum;
      });
      tl.a(grp, [{ opacity: 1 }, { opacity: 0 }], 5.5, .9, { easing: 'ease-in-out' });
      /* the closing ring round the globe, one marker on it, and one soft ring at Wall Street as the loop lands */
      var th = Math.acos(1 / (1 + pov.altitude)) / rad, c0 = null, c1 = null;
      try { c0 = g.getScreenCoords(pov.lat, pov.lng, -1); } catch (e) { c0 = null; }   /* the globe's own centre on the screen: the camera may sit off the box's centre */
      var cx = c0 && isFinite(c0.x) ? c0.x : w / 2, cy = c0 && isFinite(c0.y) ? c0.y : h / 2;
      svg.style.transformOrigin = cx.toFixed(1) + 'px ' + cy.toFixed(1) + 'px';
      try { c1 = g.getScreenCoords(pov.lat + th > 88 ? pov.lat - th : pov.lat + th, pov.lng, 0); } catch (e) { c1 = null; }
      var R = c1 ? Math.hypot(c1.x - cx, c1.y - cy) : 0;
      if (R > 40) {
        var rr = R + 14, ring = sv('circle', { 'class': 'op-ring', cx: cx, cy: cy, r: rr, pathLength: 100, transform: 'rotate(-90 ' + cx + ' ' + cy + ')' }), mkg = sv('g', { 'class': 'op-mk' }), dotc = sv('circle', { cx: cx, cy: cy - rr, r: 3 });
        ring.style.strokeDasharray = '100'; mkg.style.transformOrigin = cx + 'px ' + cy + 'px'; mkg.appendChild(dotc); svg.appendChild(ring); svg.appendChild(mkg);
        tl.a(ring, [{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], 4.7, 1.3, { easing: 'cubic-bezier(.4,.1,.3,1)' });
        tl.a(mkg, [{ transform: 'rotate(0deg)', opacity: 1 }, { transform: 'rotate(360deg)', opacity: 1 }], 4.7, 1.3, { easing: 'cubic-bezier(.4,.1,.3,1)' });
        tl.a(mkg, [{ opacity: 0 }, { opacity: 1 }], 4.7, .2, { composite: 'replace', fill: 'backwards' });
        tl.a(ring, [{ opacity: .9 }, { opacity: 0 }], 6.0, .55, { easing: 'ease-in' }); tl.a(mkg, [{ opacity: 1 }, { opacity: 0 }], 6.0, .4, { easing: 'ease-in', fill: 'forwards' });
      }
      var ny = X.data.LL.NYC, nc = null; try { nc = ny ? g.getScreenCoords(ny[0], ny[1], .02) : null; } catch (e) { nc = null; }
      if (nc && isFinite(nc.x)) {
        var pulse = sv('circle', { 'class': 'op-pulse', cx: nc.x, cy: nc.y, r: 26 }); pulse.style.transformOrigin = nc.x + 'px ' + nc.y + 'px'; svg.appendChild(pulse);
        tl.a(pulse, [{ opacity: 0, transform: 'scale(.2)' }, { opacity: .7, transform: 'scale(.45)', offset: .25 }, { opacity: 0, transform: 'scale(1)' }], 5.1, 1.0, { easing: 'ease-out' });
      }
      built = true; return true;
    }
    aim();
    var gateT = 0; tl.gate = function (t) { if (t < 2.6 || built) return false; if (!gateT) gateT = performance.now(); return performance.now() - gateT < 3000; };
    tl.tick(function (t) {   /* the globe may still be loading under the dark: try until it is there */
      if (built || t < 2.2 || t >= 4.4 || tries++ > 400) return;
      if (!aimedAt || t < 2.3) { aim(); return; }
      if (++aimedTicks >= 3 && performance.now() - aimedAt > 120) build();
    });
    /* the push-in: the camera starts a tenth further out and comes in as the cover lifts; the line, measured on the view it ends on,
       is scaled about the globe's centre by the same amount (one transform), so it stays on the arcs while the globe grows */
    var app = function (a) { return Math.tan(Math.asin(1 / (1 + a))); };
    tl.tick(function (t) {
      if (!built || !pov) return;
      var k = Math.max(0, Math.min(1, (t - 3.1) / 2.5)), a = (1 + pov.altitude) * (1 + .1 * Math.pow(1 - k, 3)) - 1;
      if (a === lastA) return; lastA = a;
      try { X.globe.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: a }, 0); } catch (e) { /* ignore */ }
      if (lineSvg) lineSvg.style.transform = 'scale(' + (app(a) / app(pov.altitude)).toFixed(4) + ')';
    });
    tl.undo.push(function () { if (X.view === 'map') X.renderGlobe(true); });   /* the step's own view, and its slow turn, come back */
    start(tl); return true;
  }

  /* ---------- when ---------- */
  var seenIt = function (k) { return U.stGet(KEY[k]) === '1'; };
  if (root.classList.contains('op-c')) {   /* the page decided at boot that this is a first visit to the Circuit */
    if (X.reduce || X.view !== 'map' || !circuit()) root.classList.remove('op-c');
  }
  X.on('view', function (v) { if (live && live.name === 'circuit' && v !== 'map') live.end(); });

  /* “#replay” typed into the address of a page that is already open changes only the hash: load the page again so it plays */
  window.addEventListener('hashchange', function () { if (location.hash === '#replay') location.reload(); });

  X.opening = {
    get on() { return live ? live.name : null; }, get ran() { return ran; }, get t() { return live ? live.t : null; },
    /* come back when the named opening has ended: true if it is playing, or about to */
    wait: function (name, fn) { if (live && live.name === name && !live.done) { queue.push([name, fn]); return true; } return false; },
    skip: function () { if (live) live.skip(); }, end: function () { if (live) live.end(); },
    seek: function (t) { if (live) live.seek(t); return live ? live.t : null; },
    /* for review and checks: play the Circuit's again from here */
    play: function (name) { if (live) live.end(); return name === 'circuit' && X.view === 'map' ? (root.classList.add('op-c'), circuit()) : false; }
  };
})();
