/* The Imperial Stack v2 · opening.js (round 5b, 16 Nov 2026; entry spec §4)
   Two first openings, each once per browser: the Circuit's, on a first visit that arrives without a link into the map, and the
   Simulator's, on the first entry into its tab. Restrained on purpose: the title first, one gold line as the only moving mark, the
   machine after; slow ease-outs, nothing bursts, bounces, glows or shakes, no sound, nothing tied to the pointer.
   Any key, click or tap skips (the rest resolves in a quarter of a second); under reduced motion neither plays.
   Cost: only opacity and transform are animated (and stroke-dashoffset on small SVG lines). Nothing filters, masks or clips the globe's
   canvas; the globe's push-in is one transform on its box. Each opening is one timeline: Web Animations for what moves, and a few
   small steps on the same clock (a count, a marker on a line), so a frame can be shown at any time (ISX.opening.seek, for the
   frame strips and the checks). The registry (v2/perf.js) owns it as a one-shot loop, “opening”: it starts only while the stage
   is in view and ends at once if the browser tab is hidden.
   Storage: isx-open-circuit, isx-open-sim ('1' once played). “#replay” in the address plays both again. The check scripts' switch
   isx-tips-sim = 'off' keeps both away. */
(function () {
  'use strict';
  var X = window.ISX; if (!X) return;
  var U = X.util, root = X.root, $ = X.$, P = X.perf, NS = 'http://www.w3.org/2000/svg';
  var KEY = { circuit: 'isx-open-circuit', sim: 'isx-open-sim' }, EASE = 'cubic-bezier(.22,.61,.36,1)';
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
      self.run(Math.min(self.dur, self.t + Math.max(0, now - last) / 1000 * self.rate)); last = now;
      if (self.t >= self.dur) { self.end(); return; }
      self.raf = requestAnimationFrame(f);
    })(last);
  };
  /* the rest in a quarter of a second */
  TL.prototype.skip = function () {
    if (this.done) return; if (!this.begun) { this.end(); return; }
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

  /* ================= the Circuit: “The world's savings come home”, 6.6 s ================= */
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
    /* the dark the title stands in: a plain cover laid over the globe (the canvas itself is never touched) */
    var dark = mk('i', 'op-dark'), gl = mk('div', 'op-gl'), ttl = mk('div', 'op-ttl', '<span class="op-k">The dollar loop</span><i class="op-hr"></i><span class="op-l1">The world’s savings</span><span class="op-l2">come home</span>'), skip = mk('button', 'op-skip', 'Skip <span>›</span>');
    skip.type = 'button'; skip.tabIndex = -1;
    var gh = $('globe'); gh.appendChild(dark); gh.appendChild(gl); scene.appendChild(ttl); scene.appendChild(skip);   /* inside the globe's own box, so the line stays on the globe wherever the layout puts it */
    var sr0 = scene.getBoundingClientRect(), gr0 = $('globe').getBoundingClientRect();   /* the title stands on the globe's own centre */
    ttl.style.left = Math.round(gr0.left - sr0.left) + 'px'; ttl.style.top = Math.round(gr0.top - sr0.top) + 'px'; ttl.style.width = Math.round(gr0.width) + 'px'; ttl.style.height = Math.round(gr0.height) + 'px';
    tl.undo.push(function () { [dark, gl, ttl, skip].forEach(function (e) { e.remove(); }); });
    var rise = function (y) { return [{ opacity: 0, translate: '0 ' + (y || 8) + 'px' }, { opacity: 1, translate: '0 0' }]; };
    tl.a(ttl.querySelector('.op-k'), rise(), .4, .9);
    tl.a(ttl.querySelector('.op-hr'), [{ opacity: 0, scale: '0 1' }, { opacity: .8, scale: '1 1' }], .7, .8);
    tl.a(ttl.querySelector('.op-l1'), rise(), .9, .9);
    tl.a(ttl.querySelector('.op-l2'), rise(), 1.4, .9);
    tl.a(ttl, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 -6px' }], 2.5, .6, { easing: 'ease-in' });
    tl.a(skip, [{ opacity: 0 }, { opacity: 1 }], .5, .4); tl.a(skip, [{ opacity: 1 }, { opacity: 0 }], 5.3, .3, { fill: 'forwards' });
    /* dawn, with a slow push-in: the cover lifts while the camera comes in by a tenth (below). The globe's box is never scaled: the
       page sizes the canvas from that box, and would size it wrong */
    tl.a(dark, [{ opacity: 1 }, { opacity: 0 }], 3.1, 2.5, { easing: 'cubic-bezier(.3,.2,.3,1)' });
    /* the instruments settle, 150 ms apart: figures, card, legend and controls, the step bar */
    var settle = [['.resbar', '.vchip'], ['.cmd6', '.mstep'], ['.legbox2', '.zoom6', '.mapmodes', '.hint', '.mapnote'], ['.tabs-bottom', '.dock6', '.b4row']];
    var all = settle.reduce(function (a, b) { return a.concat(b); }, []).join(', ');
    settle.forEach(function (grp, i) { grp.forEach(function (sel) { root.querySelectorAll('#isx-frame ' + sel).forEach(function (el) { if (el.parentElement && el.parentElement.closest(all)) return;   /* one that sits inside another settles with it */
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
    tl.tick(function (t) {   /* the globe may still be loading under the title: try until it is there */
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

  /* ================= the Simulator: “The imperial machinery”, 6.5 s ================= */
  function sim() {
    var cock = $('cock'), stage = $('stage'), entry = $('gentry'), svg = $('rmap'); if (!cock || !stage || !entry || !svg || !cock.classList.contains('s4open')) return false;
    var head = entry.querySelector('.ge-head'), kick = entry.querySelector('.ge-k'), title = entry.querySelector('.ge-t'), hr = entry.querySelector('.ge-hr'), prom = entry.querySelector('.ge-pr'), card = entry.querySelector('.ge-card'), foot = entry.querySelector('.ge-foot');
    if (!head || !title || !card) return false;
    var rise0 = function (y) { return [{ opacity: 0, translate: '0 ' + (y || 8) + 'px' }, { opacity: 1, translate: '0 0' }]; };
    if (window.innerWidth <= 760) {   /* phones: the map is a small strip under the entry, so the opening is the title, then the entry: 2.6 s */
      var ts = new TL('sim', 2.6); ts.stage = cock;
      ts.a(kick, rise0(), .3, .7); ts.a(title, rise0(10), .45, .9); ts.a(hr, [{ opacity: 0, scale: '0 1' }, { opacity: .8, scale: '1 1' }], .9, .7);
      ts.a(prom, rise0(6), 1.7, .5); ts.a(card, rise0(8), 1.85, .5); if (foot) ts.a(foot, [{ opacity: 0 }, { opacity: 1 }], 2.0, .4);
      start(ts); return true;
    }
    var tl = new TL('sim', 6.5); tl.stage = cock;
    cock.classList.add('op-s'); tl.undo.push(function () { cock.classList.remove('op-s'); });
    var clip = mk('div', 'op-clip', '<i class="op-cov"></i>'), cov = clip.firstChild, cnt = mk('p', 'op-cnt'), skip = mk('button', 'op-skip', 'Skip <span>›</span>'); skip.type = 'button'; skip.tabIndex = -1;
    stage.appendChild(clip); cock.appendChild(cnt); cock.appendChild(skip);
    /* the header stays: where the site's header lies over the stage, the cover starts under it */
    var hud = root.querySelector('#isx-frame .hud-top'), hb = hud && hud.getClientRects().length ? hud.getBoundingClientRect() : null, st0 = stage.getBoundingClientRect();
    if (hb && hb.bottom > st0.top && hb.top < st0.top + 200) clip.style.top = Math.round(hb.bottom - st0.top + 8) + 'px';
    tl.undo.push(function () { [clip, cnt, skip].forEach(function (e) { e.remove(); }); });
    var rise = function (y) { return [{ opacity: 0, translate: '0 ' + (y || 8) + 'px' }, { opacity: 1, translate: '0 0' }]; };
    /* the title alone on the dark stage, then up to its place in the entry */
    var sr = stage.getBoundingClientRect(), hrc = head.getBoundingClientRect(), dy = Math.round(sr.top + sr.height * .44 - (hrc.top + hrc.height * .38));
    tl.a(kick, rise(), .4, .8); tl.a(title, rise(10), .6, 1.0); tl.a(hr, [{ opacity: 0, scale: '0 1' }, { opacity: .8, scale: '1 1' }], 1.1, .8);
    tl.a(head, [{ translate: '0 ' + dy + 'px', scale: '1.14' }, { translate: '0 0', scale: '1' }], 2.4, 1.1, { easing: 'cubic-bezier(.4,0,.2,1)' });
    tl.a(prom, [{ opacity: 0 }, { opacity: 0 }], 0, 5.9); tl.a(prom, rise(6), 5.9, .5, { composite: 'replace', fill: 'forwards' });
    /* one gold edge crosses the stage and the machine stands behind it: a cover moved aside, never a mask */
    tl.a(cov, [{ translate: '0 0' }, { translate: 'calc(100% + 200px) 0' }], 2.7, 2.6, { easing: 'cubic-bezier(.45,.05,.3,1)' });
    tl.a(stage, [{ opacity: 0 }, { opacity: 0 }], 0, 5.9, { pseudoElement: '::after' }); tl.a(stage, [{ opacity: 0 }, { opacity: 1 }], 5.9, .55, { pseudoElement: '::after', composite: 'replace', fill: 'forwards' });
    /* a quiet count under it */
    var N = [svg.querySelectorAll('.fn').length, svg.querySelectorAll('.fe').length, cock.querySelectorAll('.lv').length], lab = [' actors and gauges', ' relations', ' levers'];
    cnt.innerHTML = N.map(function (n, i) { return '<span><b>0</b>' + lab[i] + '</span>'; }).join('<i>·</i>');
    var nums = cnt.querySelectorAll('b'), shown = [-1, -1, -1];
    tl.a(cnt, [{ opacity: 0 }, { opacity: 1 }], 2.9, .6); tl.a(cnt, [{ opacity: 1 }, { opacity: 0 }], 5.6, .4, { composite: 'replace', fill: 'forwards' });
    tl.tick(function (t) { var k = Math.max(0, Math.min(1, (t - 2.9) / 2.2)), e = 1 - Math.pow(1 - k, 3); N.forEach(function (n, i) { var v = Math.round(n * e); if (v !== shown[i]) { shown[i] = v; nums[i].textContent = v; } }); });
    /* one gold line through the money path, on the map's own relations: the Treasury to the dealer banks, the Treasury to the 10-year */
    var rel = X.sim.relations, idx = function (a, b) { for (var i = 0; i < rel.length; i++) if (rel[i][0] === a && rel[i][1] === b) return i; return -1; };
    var g = sv('g', { id: 'isx-op-g', 'class': 'op-money', 'aria-hidden': 'true' }), legs = [];
    [['TSY', 'BNK', 4.5, .75], ['TSY', 'Y10', 5.15, .85]].forEach(function (L) {
      var src = svg.querySelector('.fe[data-e="' + idx(L[0], L[1]) + '"]'); if (!src) return;
      var p = sv('path', { d: src.getAttribute('d'), pathLength: 100 }); p.style.strokeDasharray = '100'; g.appendChild(p);
      var len = src.getTotalLength(), pts = []; for (var i = 0; i <= 40; i++) { var q = src.getPointAtLength(len * i / 40); pts.push([q.x, q.y]); }
      tl.a(p, [{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], L[2], L[3], { easing: 'cubic-bezier(.4,.1,.3,1)' });
      legs.push({ t0: L[2], d: L[3], pts: pts });
    });
    if (legs.length) {
      var dotc = sv('circle', { r: 3.4, 'class': 'op-dot' }), fp = svg.querySelector('#isx-fpart'); g.appendChild(dotc);
      if (fp) fp.parentNode.insertBefore(g, fp.nextSibling); else svg.appendChild(g);   /* under the actors' boxes, where the map's own lines run */
      tl.undo.push(function () { g.remove(); });
      var ez = function (k) { return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }, lastK = '';
      tl.tick(function (t) {
        var L = null; for (var i = 0; i < legs.length; i++) if (t >= legs[i].t0) L = legs[i];
        var on = !!L && t <= legs[legs.length - 1].t0 + legs[legs.length - 1].d + .05, k = L ? Math.max(0, Math.min(1, (t - L.t0) / L.d)) : 0, f = ez(k) * 40, i0 = Math.min(39, Math.floor(f)), u = f - i0;
        var key = on ? (L.pts[i0][0] + (L.pts[i0 + 1][0] - L.pts[i0][0]) * u).toFixed(1) + ',' + (L.pts[i0][1] + (L.pts[i0 + 1][1] - L.pts[i0][1]) * u).toFixed(1) : 'off';
        if (key === lastK) return; lastK = key;
        if (!on) { dotc.setAttribute('opacity', '0'); return; }
        var xy = key.split(','); dotc.setAttribute('opacity', '1'); dotc.setAttribute('cx', xy[0]); dotc.setAttribute('cy', xy[1]);
      });
      tl.a(g, [{ opacity: 1 }, { opacity: 0 }], 6.0, .45, { easing: 'ease-in' });
    }
    /* the entry settles over the map: the promise first (above), then the card and its foot */
    tl.a(card, [{ opacity: 0 }, { opacity: 0 }], 0, 6.0); tl.a(card, rise(8), 6.0, .5, { composite: 'replace', fill: 'forwards' });
    if (foot) { tl.a(foot, [{ opacity: 0 }, { opacity: 0 }], 0, 6.1); tl.a(foot, [{ opacity: 0 }, { opacity: 1 }], 6.1, .4, { composite: 'replace', fill: 'forwards' }); }
    tl.a(skip, [{ opacity: 0 }, { opacity: 1 }], .5, .4); tl.a(skip, [{ opacity: 1 }, { opacity: 0 }], 5.6, .3, { composite: 'replace', fill: 'forwards' });
    start(tl); return true;
  }

  /* ---------- when ---------- */
  var seenIt = function (k) { return U.stGet(KEY[k]) === '1'; };
  if (root.classList.contains('op-c')) {   /* the page decided at boot that this is a first visit to the Circuit */
    if (X.reduce || X.view !== 'map' || !circuit()) root.classList.remove('op-c');
  }
  X.on('view', function (v) {
    if (live && live.name === 'circuit' && v !== 'map') live.end();
    if (live && live.name === 'sim' && v !== 'fin') live.end();
    if (v !== 'fin' || live || !X.booted || X.reduce || testOff() || X.finMode !== 'plumb') return;
    if (!replay && (seenIt('sim') || U.stGet('isx-way'))) return;   /* a visitor who has chosen a level before has been here before */
    if (replay && seenIt('sim')) return;
    sim();
  });
  X.on('fin', function () { if (live && live.name === 'sim' && !$('gentry')) live.end(); });

  /* “#replay” typed into the address of a page that is already open changes only the hash: load the page again so it plays */
  window.addEventListener('hashchange', function () { if (location.hash === '#replay') location.reload(); });

  X.opening = {
    get on() { return live ? live.name : null; }, get ran() { return ran; }, get t() { return live ? live.t : null; },
    /* come back when the named opening has ended: true if it is playing, or about to */
    wait: function (name, fn) { if (live && live.name === name && !live.done) { queue.push([name, fn]); return true; } return false; },
    skip: function () { if (live) live.skip(); }, end: function () { if (live) live.end(); },
    seek: function (t) { if (live) live.seek(t); return live ? live.t : null; },
    /* for review and checks: play one again from here (the Simulator's needs its entry open) */
    play: function (name) { if (live) live.end(); return name === 'sim' ? sim() : (X.view === 'map' ? (root.classList.add('op-c'), circuit()) : false); }
  };
})();
