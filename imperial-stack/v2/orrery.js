/* The Imperial Stack v2 · orrery.js (orrery OB1 and OB2, 23–24 Nov 2026; spec claude/specs/orrery-opener-spec-21-nov.md)
   The order as the profit tab's first view: one still picture of the world economy, 1995–2026, that a slider moves.
   · Story layer (view “orr”): the orrery, the slider with eleven events, the counters, one narration card, the streams (BEA direct-investment
     income by host country), the tear (tension e, spec §5) that pulls China out as a second sun, the ripple, the opening, the play button.
   · Deep layer (the views behind “For economists: the full statistics”): the orbit view as it was, the figures by year with the method note,
     the creditor/debtor rings, where profits are booked (BEA 2024, preliminary) and “German Hypocrisy”.
   The picture is a pure function of the (fractional) year: render(yf). Mass (share of world GDP) drives the size of a body; the summed
   current account only appears as counters and rings (spec §4.2), except in “German Hypocrisy”, where it is gravity on purpose.
   Data: data/orrery.json (tools/orrery-data.py from OR2) and data/orbit.json (placements). profit.js calls ISX.orrery(kit) once.
   OR7 (25 Nov 2026; handoff claude/handoffs/orrery-or7-build-25-nov.md): one claim for the first view, “one order in 1995, two poles by 2026”.
   · The old order as a thin named frame round the whole picture, with China's entries on it; China's own institutions as marks on the timeline
     and, once the two systems have parted, as named arcs round China (data: orrery.json “order”, every date read from its source on 25 Nov 2026).
   · Marks from the lists only from their dates: Pax Silica from 2025 (12 Dec 2025), WAICO from 2026 (16 Jul 2026).
   · Two steps after 2026, each one picture: “profit-and-production” (two small charts) and “clearing” (surpluses into one named point).
   · At rest, after the split: pulses run along the flow lines and China's system turns once in six minutes; the US system stands still.
     One loop in the registry (v2/perf.js), a “Pause motion” button, nothing under reduced motion. */
(function () {
  'use strict';
  const X = window.ISX; if (!X) return;
  X.orrery = function (K) {
    const { V, S, R, h, el, esc, phone, OZ } = K;
    let OD = null, OB = null, busy = false;
    const reduce = () => !!X.reduce;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
    const f1 = v => (Math.round(v * 10) / 10).toFixed(1), tn = v => (v < 0 ? '−' : '+') + '$' + (Math.abs(v) / 1000).toFixed(2) + 'tn';
    const need = cb => {
      if (OD && OB) return true;
      if (!busy) { busy = true; Promise.all([X.load('orrery'), K.orbit()]).then(r => { OD = r[0]; OB = r[1]; busy = false; if (X.view === 'profit' && ['orr', 'rng', 'hyp', 'fig', 'pft'].includes(K.vw())) K.board(true); }).catch(() => { busy = false; K.reading('', 'The orrery could not be loaded. Reload the page to try again.'); }); }
      K.reading('', 'Loading the orrery.'); return false;
    };
    const YS = () => OD.years;
    const yi = y => clamp(Math.round(y) - 1995, 0, 31);
    const at = (a, yf) => { if (!a) return null; const i = clamp(Math.floor(yf) - 1995, 0, 31), j = Math.min(31, i + 1), t = yf - Math.floor(yf), p = a[i], q = a[j]; if (p == null) return null; return q == null ? p : lerp(p, q, t); };
    const EVS = () => OD.events;
    /* tension e at a fractional year: through the event steps, linear between them (spec §5) */
    const tension = yf => { const E = EVS(); let prev = E[0], nxt = null; for (const e of E) { if (e.year <= yf) prev = e; else { nxt = e; break; } } return nxt ? prev.step + (nxt.step - prev.step) * (yf - prev.year) / (nxt.year - prev.year) : prev.step; };
    const evAt = y => { let r = null; for (const e of EVS()) if (e.year <= y) r = e; return r; };
    const BYISO = () => { const m = {}; Object.keys(OD.bodies).forEach(id => { m[OD.bodies[id].iso] = id; }); return m; };
    const nameOf = b => b.full || b.n;
    const ORD = () => OD.order, OWN = () => OD.order.own, ARCS = () => OD.order.own.filter(a => a.arc);
    const ownAt = y => { let r = null; for (const a of OWN()) if (a.year <= y) r = a; return r; };
    const yearIn = s => { const m = /(20\d\d)/.exec(s || ''); return m ? +m[1] : null; };
    const bn = v => '$' + Math.round(Math.abs(v)).toLocaleString('en-US') + 'bn';
    /* the two steps after the story (OR7): each has its own address, #profit/order/<slug> */
    const STEPS = { pp: { n: 1, short: 'Profit and production', title: 'Profit gathers at the centre; production moves to China' },
      cl: { n: 2, short: 'Clearing', title: 'China finances the system it competes with' } };
    const ROT = Math.PI * 2 / 360;   /* China's system at rest: one turn in six minutes */

    /* ---------- the geometry ---------- */
    const TILT = [.25, .7];   /* the ring plane's tilt, ring height over ring width: the drag's range (desktop) */
    function layout(W, H, ph, tilt) {
      tilt = ph ? .9 : clamp(tilt == null ? .4 : tilt, TILT[0], TILT[1]);
      /* a steeper tilt makes the rings taller: shrink them together so the outer ring stays inside the stage */
      const fit = ph ? 1 : Math.min(1, (H / 2 - 16) / (.31 * W * tilt)), rk = [.07, .13, .19, .25, .31].map(v => v * W * fit);
      const L = { W, H, ph, tilt, fit, cx: W / 2, cy: H / 2, rx: rk, ry: rk.map(v => v * tilt), v: ph ? [0, 1] : [1, 0], f: ph ? H * .12 : W * .095 };
      L.s = ph ? .7 : .8; L.U = ph ? [W / 2, H * .27] : [W * .27, H / 2]; L.Cn = ph ? [W / 2, H * .74] : [W * .73, H / 2];
      L.band = { both: ph ? [H * .505, W * .12, W * .88] : [H * .1, W * .34, W * .66], swing: ph ? [H * .965, W * .1, W * .9] : [H * .92, W * .12, W * .88] };
      return L;
    }
    const polar = (ring, sec, k, n) => { const a = (sec * 60 + 8 + (n > 1 ? k * (44 / (n - 1)) : 22)) * Math.PI / 180 - Math.PI / 2; return [Math.cos(a), Math.sin(a)]; };
    function prepBodies() {
      const bi = BYISO(), list = [], grp = {};
      OB.B.forEach(b => {
        const id = b.id, d = OD.bodies[id]; if (!d && b.sys !== 'core') return; if (b.k === 'g' && !d) return;
        const o = { id, b, d: d || null, iso: d ? d.iso : null, name: nameOf(b), core: b.sys === 'core', china: b.full === 'China', py: yearIn(b.mem && b.mem.p), ty: yearIn(b.mem && b.mem.t) };
        list.push(o);
      });
      /* booking points: Ireland (a body only through BEA and the IMF), Luxembourg, Bermuda, UK Caribbean, Switzerland */
      Object.keys(OD.booking).forEach(iso => { const q = OD.booking[iso]; if (bi[iso]) return; list.push({ id: 'BK-' + iso, b: { id: 'BK-' + iso, n: q.name, full: q.name, sys: 'us', k: 'c', wring: 1, ring: 1, wsec: 4, sec: 4, mem: {}, role: 'A booking point: US firms’ affiliates book income here' }, d: q, iso, name: q.name, bk: true }); });
      list.forEach(o => { const key = o.b.wring + ':' + o.b.wsec; (grp[key] = grp[key] || []).push(o); const k2 = o.b.ring + ':' + o.b.sec; (grp[k2 + 's'] = grp[k2 + 's'] || []).push(o); });
      list.forEach(o => { const a = grp[o.b.wring + ':' + o.b.wsec]; o.wi = a.indexOf(o); o.wn = a.length; const c = grp[o.b.ring + ':' + o.b.sec + 's']; o.si = c.indexOf(o); o.sn = c.length; });
      /* bands: the overlap and the neither-list */
      ['both', 'swing', 'open'].forEach(s => { const a = list.filter(o => o.b.sys === s && !o.core); a.forEach((o, i) => { o.bi = i; o.bn = a.length; }); });
      return list;
    }
    /* where a body stands at tension e (u is the last stretch, 0.85 to 1) */
    function place(o, L, yf, e) {
      const b = o.b, u = ease((e - .85) / .15), f = L.f * clamp(e / .85, 0, 1), vx = L.v[0], vy = L.v[1], C0 = [L.cx, L.cy], Uc = [C0[0] - vx * f, C0[1] - vy * f], Cc = [C0[0] + vx * f, C0[1] + vy * f];
      let pw;
      if (o.core && !o.china) pw = Uc.slice();
      else {
        let ring = b.wring; if (o.china && yf < 2001) ring = 4;
        const t = polar(ring, b.wsec, o.wi, o.wn), ax = L.rx[ring] + f * Math.abs(vx), ay = L.ry[ring] + f * Math.abs(vy);
        pw = [C0[0] + t[0] * ax, C0[1] + t[1] * ay];
        if (o.china) { const k = ease(clamp((e - .02) / .55, 0, 1)); pw = [lerp(pw[0], Cc[0], yf >= 2001 ? k : 0), lerp(pw[1], Cc[1], yf >= 2001 ? k : 0)]; }
      }
      if (b.k === 'c' && b.n === 'UK') { const st = yf < 2016 ? 0 : yf < 2025 ? Math.min(1, (yf - 2016) / 4) : 1 - u; pw[0] -= 7 * st * (L.ph ? .6 : 1); pw[1] -= 3 * st; }
      if (u <= 0) return pw;
      let ps;
      const sys = b.sys;
      if (sys === 'core') ps = (o.china ? L.Cn : L.U).slice();
      else if (sys === 'us' || sys === 'cn') { const c = sys === 'us' ? L.U : L.Cn, t0 = polar(b.ring, b.sec, o.si, o.sn), ro = sys === 'cn' && L.rot ? L.rot : 0, t = ro ? [t0[0] * Math.cos(ro) - t0[1] * Math.sin(ro), t0[0] * Math.sin(ro) + t0[1] * Math.cos(ro)] : t0; ps = [c[0] + t[0] * L.rx[b.ring] * L.s, c[1] + t[1] * L.ry[b.ring] * L.s * (L.ph ? 1 : 1.25)]; }
      else if (sys === 'both' || sys === 'swing') { const B = L.band[sys], rows = !L.ph ? 2 : 1, col = Math.ceil(o.bn / rows), r = o.bi % rows, c = Math.floor(o.bi / rows); ps = [lerp(B[1], B[2], col > 1 ? c / (col - 1) : .5), B[0] + (rows > 1 ? (r ? 22 : -4) : 0) + (L.ph && sys === 'swing' ? (o.bi % 2) * 20 - 22 : 0)]; }
      else { ps = [L.cx + ((o.bi % 5) - 2) * L.W * .06, L.cy + (L.ph ? -40 : -L.H * .27) + Math.floor(o.bi / 5) * 20]; }
      return [lerp(pw[0], ps[0], u), lerp(pw[1], ps[1], u)];
    }

    /* ---------- the picture ---------- */
    const WARM = '#E9C77F', COOL = '#8FD3CF', GREY = '#7d8d9b', GOLD = '#D9A441';
    function Orrery(host, o) {   /* o: { mode: 'story' | 'rings' | 'hyp', year } */
      const full = !!o.full, ph = full ? o.W < o.H : phone(), W = full ? o.W : Math.max(300, host.clientWidth || 800), mode = o.mode, hyp = mode === 'hyp', story = mode === 'story';
      const FH = story ? (W >= 1000 ? 26 : W >= 560 ? 44 : 84) : 0;   /* OR7: the old order's strip at the foot of the stage; the picture is laid out above it (HL) */
      const H = full ? o.H : (ph ? 600 : clamp(Math.round(W * .38), 330, 480)) + (W >= 1000 ? 0 : FH), HL = H - FH;
      const compact = full ? Math.min(W, H) < 560 : ph;   /* a phone: names only for the big bodies, the rings and bands in a key */
      const L = layout(W, HL, ph, OZ.tilt != null ? OZ.tilt : (full ? .5 : .4)), list = prepBodies(), gid = o.mode + (full ? 'f' : '');
      const maxY = hyp ? 2025 : 2026, LP = ORD().lists.pax, LW = ORD().lists.waico, canStep = story && !full, ppIn = compact || W < 900;   /* ppIn: step 1's charts stand in the card, not on the picture */
      const Vw = { k: o.view ? o.view.k : 1, x: o.view ? o.view.x : 0, y: o.view ? o.view.y : 0 };   /* the zoom and pan of the full-screen view */
      const Sx = x => Vw.x + Vw.k * x, Sy = y => Vw.y + Vw.k * y;
      const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'orr-svg', role: 'group', 'aria-label': hyp ? 'The orrery with gravity switched to the current account summed since 1995, as a share of that year’s GDP. Germany becomes a sun.' : 'The world economy as an orrery, 1995 to 2026: the United States at the centre of one system, China pulled out as a second centre; size is the share of world GDP.' });
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet'); if (full) { svg.style.width = W + 'px'; svg.style.height = H + 'px'; }
      svg.setAttribute('aria-description', 'Drag to tilt the rings, or press Shift and the up or down arrow.' + (full ? ' Pinch to zoom, drag to pan; the plus, minus and arrow keys do the same.' : ''));
      const defs = el('defs'); [['u', '#FFF4DA', '#F3D28C'], ['c', '#E9FFFD', '#8FD3CF']].forEach(([id, a, b]) => { const g = el('radialGradient', { id: 'orr-g' + id + gid }); g.append(el('stop', { offset: '0', 'stop-color': a, 'stop-opacity': 1 }), el('stop', { offset: '.35', 'stop-color': b, 'stop-opacity': .55 }), el('stop', { offset: '1', 'stop-color': b, 'stop-opacity': 0 })); defs.append(g); });
      svg.append(defs);
      const gStars = el('g', { class: 'orr-stars' }); let sd = 7; const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
      for (let i = 0; i < 140; i++) gStars.append(el('circle', { cx: (rnd() * W).toFixed(1), cy: (rnd() * H).toFixed(1), r: (.4 + rnd() * .8).toFixed(2), opacity: (.08 + rnd() * .27).toFixed(2) }));
      const gLane = el('g', { class: 'orr-lane' }), lane = ph ? el('rect', { x: 0, y: HL * .5 - 12, width: W, height: 24 }) : el('rect', { x: W / 2 - 12, y: 8, width: 24, height: HL - 16 });
      gLane.append(lane, ph ? el('line', { x1: 8, x2: W - 8, y1: HL * .5, y2: HL * .5, class: 'dot' }) : el('line', { x1: W / 2, x2: W / 2, y1: 8, y2: HL - 8, class: 'dot' }));
      const gT = el('g', { class: 'orr-lbl', 'aria-hidden': 'true' });   /* every name: unscaled, so zooming moves the words but never grows them */
      const laneT = compact ? [] : [['on both lists', ph ? [W / 2, HL * .5 - 18] : [W / 2, 22]], ['on neither list', ph ? [W / 2, HL - 6] : [W / 2, HL - 6]]].map(([t, p]) => { const n = el('text', { 'text-anchor': 'middle', class: 'orr-lt' }, t.toUpperCase()); n.__p = p; gT.append(n); return n; });
      const gRings = el('g', { class: 'orr-rings' }), RN = ['THE CORE', 'TOOLS, CHIPS AND FINANCE', 'THE ASSEMBLY LINE', 'ENERGY AND MINERALS', 'ROLE NOT COLLECTED'];
      const ringE = [], pairU = [], pairC = [], ringT = [];
      for (let k = 0; k < 5; k++) { const a = el('ellipse', { class: 'rg' }), b = el('ellipse', { class: 'rg pu' }), c = el('ellipse', { class: 'rg pc' }); [a, b, c].forEach(n => { if (k === 4) n.setAttribute('stroke-dasharray', '3 5'); }); ringE.push(a); pairU.push(b); pairC.push(c); gRings.append(a, b, c); const t = el('text', { class: 'orr-rl', 'text-anchor': 'start' }, RN[k]); ringT.push(t); if (!compact) gT.append(t); }
      const gStream = el('g', { class: 'orr-streams' }), gSun = el('g', { class: 'orr-suns' }), gB = el('g', { class: 'orr-bodies' }), gR = el('g', { class: 'orr-ripple' });
      const sunU = el('g', { class: 'orr-sun u' }), sunC = el('g', { class: 'orr-sun c' });
      [[sunU, 'u'], [sunC, 'c']].forEach(([g, k]) => { g.append(el('circle', { class: 'gl', fill: `url(#orr-g${k}${gid})` }), el('circle', { class: 'co', fill: k === 'u' ? '#FFF4DA' : '#E9FFFD' })); gSun.append(g); });
      const ripple = el('ellipse', { class: 'rip', opacity: 0 }); gR.append(ripple);
      const bod = list.map(q => {
        const g = el('g', { class: 'ob', 'data-b': q.id, 'data-r': q.b.wring, role: 'button', tabindex: 0, 'aria-label': q.name }), c = el('circle', { class: 'c', r: 4 }), c2 = el('circle', { class: 'c2', r: 4 }), rg = el('circle', { class: 'cr', r: 5, fill: 'none' }), dm = el('rect', { class: 'dm', width: 9, height: 9, x: -4.5, y: -4.5, transform: 'rotate(45)' });
        const vt = q.core ? (q.china ? 'China' : 'US') : q.b.n, hit = el('circle', { r: 12, fill: 'transparent' }), tx = el('text', { class: 'ol', 'data-b': q.id }, vt); gT.append(tx); if (q.name !== vt && q.name.indexOf(vt) !== 0) g.setAttribute('aria-label', vt + ', ' + q.name);
        g.append(rg, c, c2, dm, hit); gB.append(g); q.g = g; q.c = c; q.rg = rg; q.dm = dm; q.tx = tx; q.c2 = c2; q.hit = hit; q.vt = vt; return q;
      });
      const sPaths = list.filter(q => q.d && q.d.inc).map((q, i) => { const p = el('path', { class: 'st', fill: 'none', pathLength: 1 }), pu = el('path', { class: 'pls', fill: 'none', pathLength: 1 }); pu.style.animationDelay = (-(i * .61) % 4).toFixed(2) + 's'; gStream.append(p, pu); q.st = p; q.pu = pu; return q; });
      /* OR7: China's own institutions as arcs round China (named on the picture, in the key on a phone); the lines of the clearing step; the old order's frame */
      const gArc = el('g', { class: 'orr-arcs' }), gFlow = el('g', { class: 'orr-flows' }), flowT = [];
      const arcs = story ? ARCS().map((a, i) => { const g = el('g', { class: 'oa', 'data-a': a.id, role: 'button', tabindex: -1, 'aria-label': a.full + ', ' + a.year + ': one of China’s own institutions' }), pa = el('path', { class: 'ar', fill: 'none' }), hp = el('path', { class: 'ah', fill: 'none' }), t = el('text', { class: 'orr-al off', 'data-a': a.id }, a.n + ' ' + a.year); g.append(hp, pa); gArc.append(g); if (!compact) gT.append(t); return { a, i, g, p: pa, hp, t, on: false, end: [0, 0] }; }) : [];
      const arcH = story ? el('text', { class: 'orr-ahd off', 'text-anchor': 'middle' }, 'CHINA’S OWN INSTITUTIONS') : null; if (arcH) gT.append(arcH);
      ['w', 'g', 'c'].forEach(k => { const m = el('marker', { id: 'orr-m' + k + gid, viewBox: '0 0 10 10', refX: 8.5, refY: 5, markerWidth: 9, markerHeight: 9, orient: 'auto-start-reverse', markerUnits: 'userSpaceOnUse' }); m.append(el('path', { d: 'M1 1.5L9 5L1 8.5z', class: 'mk' + k })); defs.append(m); });
      const frameR = story ? el('rect', { class: 'orr-frame', x: 3.5, y: 3.5, width: W - 7, height: H - 7, rx: 12, fill: 'none' }) : null;
      const gV = el('g', { class: 'orr-view' }); gV.append(gLane, gRings, gStream, gArc, gFlow, gSun, gB, gR); svg.append(gStars, gV, gT); if (frameR) svg.append(frameR);
      const wrap = h('div', 'orr' + (hyp ? ' hyp' : '') + (mode === 'rings' ? ' rng' : '')); wrap.dataset.mode = mode;
      const top = h('div', 'orr-top'), counters = h('div', 'orr-ct'); counters.setAttribute('aria-hidden', 'true');
      const cy = h('div', 'orr-yr'), evl = h('div', 'orr-evl'), c1 = h('div', 'orr-c'), c2 = h('div', 'orr-c'), c3 = h('div', 'orr-c');
      counters.append(cy, c1, c2, c3); if (full) counters.insertBefore(evl, c1);
      const c4 = story && !compact ? h('div', 'orr-c ln') : null; if (c4) { c4.innerHTML = '<span><i></i>Lines into the US</span><b>What US firms’ affiliates earned there (BEA)</b>'; counters.append(c4); }
      const info = h('aside', 'orr-info'); info.setAttribute('aria-live', 'polite'); info.tabIndex = 0;
      const stage = h('div', 'orr-stage'); stage.append(svg, counters);
      let cnW = null, strip = null;
      if (story) {
        strip = h('div', 'orr-old'); strip.style.height = (FH - 8) + 'px'; strip.setAttribute('role', 'group'); strip.setAttribute('aria-label', 'The frame round the picture is the old order. ' + ORD().frame.line);
        const grp = (cls, k, items, tick) => { const g = h('span', 'og ' + cls); g.append(h('b', '', k)); items.forEach(([n, y]) => { const s = h('span', 'oi'); if (tick) s.append(h('i', 'tk')); s.append(n + ' ', h('em', '', String(y))); g.append(s); if (tick && n === 'WTO') cnW = s; }); return g; };
        const old = []; ORD().old.forEach(([n, y]) => { const l = old[old.length - 1]; if (l && l[1] === y) l[0] += ' and ' + n; else old.push([n, y]); });
        strip.append(grp('a', 'The old order', old, false), grp('b', 'China inside it', ORD().cn, true)); stage.append(strip);
      }
      /* “Pause motion” (WCAG 2.2.2): shown only while something can move, that is after the split and without reduced motion */
      const pm = story ? h('button', full ? 'orr-tbb pm' : 'orr-pm') : null;
      const pmSync = () => { if (!pm) return; pm.hidden = !(st.split && !reduce()); pm.textContent = X.orrPaused ? '▶ Resume motion' : '❚❚ Pause motion'; };
      const rc = full ? null : h('div', 'orr-rc'); if (rc) stage.append(rc);
      if (pm) { pm.type = 'button'; pm.hidden = true; pm.title = 'Stops the slow turn of China’s system and the pulses on the lines'; pm.addEventListener('click', () => { X.orrPaused = !X.orrPaused; pmSync(); loopSync(); }); }
      /* the Full screen button: on a phone it says so; on a desktop it is an expand icon, its words shown on hover and focus */
      let fsb = null;
      if (!full) { fsb = h('button', 'orr-fsb'); fsb.type = 'button'; fsb.setAttribute('aria-label', 'Full screen'); fsb.title = 'Full screen';
        fsb.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg><span class="t">Full screen</span>';
        rc.append(fsb); }
      /* the full-screen chrome: zoom, reset, key, close; the key; the hint; the card of the body tapped */
      let tbar = null, keyP = null, keyB = null, btm = null, hintEl = null;
      if (!full && story && !compact) {   /* OR7: on a wide screen the marks' key opens on the picture itself */
        keyB = h('button', 'orr-kyb', 'Key'); keyB.type = 'button'; keyB.setAttribute('aria-expanded', 'false'); keyB.setAttribute('aria-controls', 'isx-orr-key-in'); keyB.addEventListener('click', () => { keyP.hidden = !keyP.hidden; keyB.setAttribute('aria-expanded', String(!keyP.hidden)); X.orrKeyIn = !keyP.hidden; });
        keyP = h('div', 'orr-kin pf-lg'); keyP.id = 'isx-orr-key-in'; keyP.hidden = !X.orrKeyIn; keyB.setAttribute('aria-expanded', String(!!X.orrKeyIn)); keyP.setAttribute('role', 'group'); keyP.setAttribute('aria-label', 'The key'); marksKey(keyP, 'orr', 0, false); rc.append(keyB); stage.append(keyP); }
      if (rc && pm) rc.append(pm);
      if (full) {
        tbar = h('div', 'orr-tb'); tbar.setAttribute('role', 'toolbar'); tbar.setAttribute('aria-label', 'The orrery’s controls');
        const mk = (cls, txt, label, fn) => { const b = h('button', 'orr-tbb ' + cls, txt); b.type = 'button'; if (label) b.setAttribute('aria-label', label); b.addEventListener('click', fn); tbar.append(b); return b; };
        mk('z', '−', 'Zoom out', () => zoomBy(1 / 1.5)); mk('z', '+', 'Zoom in', () => zoomBy(1.5)); mk('rs', 'Reset', null, () => resetView());
        if (pm) tbar.append(pm); keyB = mk('ky', 'Key', null, () => keyShow(keyP.hidden)); keyB.setAttribute('aria-expanded', 'false'); keyB.setAttribute('aria-controls', 'isx-orr-key');
        mk('x', 'Close', null, () => o.onClose && o.onClose());
        keyP = h('div', 'orr-key pf-lg'); keyP.id = 'isx-orr-key'; keyP.hidden = true; keyP.setAttribute('role', 'group'); keyP.setAttribute('aria-label', 'The key');
        btm = h('div', 'orr-btm'); hintEl = h('p', 'orr-hint'); hintEl.setAttribute('role', 'status'); hintEl.hidden = true; btm.append(hintEl);
        stage.append(tbar, keyP, btm);
      }
      const slider = h('div', 'orr-sl'), play = h('button', 'orr-play', '▶ Play'); play.type = 'button'; play.setAttribute('aria-pressed', 'false'); play.setAttribute('aria-label', 'Play the years, 1995 to 2026');
      const track = h('div', 'orr-tr'), inp = h('input'); inp.type = 'range'; inp.min = 1995; inp.max = maxY; inp.step = .05; inp.value = o.year; inp.setAttribute('aria-label', 'Year');
      const dots = h('div', 'orr-ev'); if (!hyp) EVS().forEach(e => { const d = h('button', 'orr-evd'); d.type = 'button'; d.style.left = ((e.year - 1995) / (maxY - 1995) * 100) + '%'; d.dataset.y = e.year; d.setAttribute('aria-label', e.year + ': ' + e.label); d.append(h('i', '', String(e.year))); dots.append(d); });
      const ownD = h('div', 'orr-own'), ownB = [];
      if (story) { OWN().forEach((a, i) => { const d = h('button', 'orr-owd r' + (i % 2)); d.type = 'button'; d.style.left = ((a.year - 1995) / (maxY - 1995) * 100) + '%'; d.dataset.y = a.year; d.dataset.a = a.id; d.title = a.full + ', ' + a.year; d.setAttribute('aria-label', a.year + ': ' + (a.full.indexOf(a.n) >= 0 ? a.full : a.n + ', ' + a.full) + ', one of China’s own institutions');   /* the name on screen is part of the accessible name */ d.append(h('i', '', a.n)); ownD.append(d); ownB.push(d); }); track.classList.add('has-own'); }
      track.append(dots, inp); if (story) track.append(ownD);
      if (story && !full) { const pc = h('div', 'orr-pc'), tk = h('div', 'orr-tkey'); tk.innerHTML = '<span><i class="e"></i>Events</span><span><i class="o"></i>China’s own</span>'; tk.setAttribute('role', 'group'); tk.setAttribute('aria-label', 'On the timeline: gold dots are events, teal diamonds are China’s own institutions'); pc.append(play, tk); slider.append(pc, track); } else slider.append(play, track);
      let steps = null;
      if (canStep) { steps = h('nav', 'orr-steps'); steps.setAttribute('aria-label', 'The story, then two steps. Left and right arrows move between them.'); play.setAttribute('aria-label', 'Play the years, 1995 to 2026, then the two steps');
        [['', 'The story', '1995–2026'], ['pp', 'Step 1', STEPS.pp.short], ['cl', 'Step 2', STEPS.cl.short]].forEach(([k, a, b], i) => { if (i) { const s = h('span', 'sep', '›'); s.setAttribute('aria-hidden', 'true'); steps.append(s); } const bt = h('button', 'orr-stp'); bt.type = 'button'; bt.dataset.step = k; bt.append(h('small', '', a), h('b', '', b)); steps.append(bt); }); }
      const narr = h('div', 'orr-card'), deepb = h('button', 'orr-deep'); deepb.type = 'button'; deepb.dataset.pv = hyp ? 'orr' : 'orb';
      wrap.append(stage, slider); if (steps) wrap.append(steps); if (!hyp && mode === 'story' && !full) wrap.append(narr);
      if (full) btm.append(info); else wrap.append(info);
      host.append(wrap);
      const st = { yf: o.year, e: 0, sel: o.sel || null, band: null, noclick: false, raf: 0, playing: false, drag: false, lastInt: Math.round(o.year), opening: false, step: null, split: false, rot: X.orrRot || 0, era: -1, ins: null, nk: '', flows: null, pp: null };
      const moons = list.filter(q => q.b.sys === 'cn' && !q.core), isoB = iso => list.find(q => q.iso === iso && !q.bk);
      /* mass */
      const share = (q, yf) => q.d ? at(q.d.share, yf) : null, kS = 28 / Math.sqrt(26) * (W / 1380) * (ph ? 1.25 : 1), kH = 28 / Math.sqrt(103) * (W / 1380) * (ph ? 1.25 : 1);
      function render(yf) {
        if (st.step && Math.round(yf) < maxY) leaveStep(); st.yf = yf; L.rot = st.rot; const yr0 = Math.round(yf), e = hyp ? 0 : tension(yf), u = ease((e - .85) / .15), f = L.f * clamp(e / .85, 0, 1), vx = L.v[0], vy = L.v[1];
        L.e = e; const Uc = u > 0 ? [lerp(L.cx - vx * f, L.U[0], u), lerp(L.cy - vy * f, L.U[1], u)] : [L.cx - vx * f, L.cy - vy * f], Cc = u > 0 ? [lerp(L.cx + vx * f, L.Cn[0], u), lerp(L.cy + vy * f, L.Cn[1], u)] : [L.cx + vx * f, L.cy + vy * f];
        for (let k = 0; k < 5; k++) {
          const ax = L.rx[k] + f * Math.abs(vx), ay = L.ry[k] + f * Math.abs(vy), sx = L.rx[k] * L.s, sy = L.ry[k] * L.s * (ph ? 1 : 1.25);
          ringE[k].setAttribute('cx', L.cx); ringE[k].setAttribute('cy', L.cy); ringE[k].setAttribute('rx', ax); ringE[k].setAttribute('ry', ay); ringE[k].style.opacity = u > 0 ? 1 - u : 1;
          const pr = L.rx[k] * (1 - .2 * u) , pry = L.ry[k] * (1 - .2 * u) * (ph ? 1 : 1), ax2 = lerp(L.rx[k], sx, u), ay2 = lerp(L.ry[k] , sy, u);
          [[pairU[k], Uc], [pairC[k], Cc]].forEach(([n, c]) => { n.setAttribute('cx', c[0]); n.setAttribute('cy', c[1]); n.setAttribute('rx', ax2); n.setAttribute('ry', ay2); n.style.opacity = u; });
          if (!compact) { ringT[k].setAttribute('x', Sx(Uc[0] - L.rx[k] * .72 * (u > 0 ? L.s : 1)).toFixed(1)); ringT[k].setAttribute('y', Sy(Uc[1] + L.ry[k] * 1.02 + 10).toFixed(1)); ringT[k].style.opacity = hyp ? 0 : 1; }
        }
        gLane.style.opacity = hyp ? 0 : ease((e - .88) / .12); laneT.forEach(t => { t.style.opacity = ease((e - .93) / .07); t.setAttribute('x', Sx(t.__p[0]).toFixed(1)); t.setAttribute('y', Sy(t.__p[1]).toFixed(1)); });
        /* OR7: nothing from the lists before its date. Before 2025 a body shows its tier and its system only; in 2025 Pax Silica's first signatures; from 2026 WAICO, so “both lists” */
        const era = yr0 < LP ? 0 : yr0 < LW ? 1 : 2; if (era !== st.era) { st.era = era; laneT.forEach((t, i) => { t.textContent = era < 2 ? 'BETWEEN THE TWO SYSTEMS' : i ? 'ON NEITHER LIST' : 'ON BOTH LISTS'; }); syncMarks(era); }
        const sU = hyp ? (share({ d: OD.bodies[BYISO().USA] }, yf) || 24) : (at(OD.bodies[BYISO().USA].share, yf) || 24), sC = hyp ? 0 : (at(OD.bodies[BYISO().CHN].share, yf) || 2);
        const rU = hyp ? 11 : kS * Math.sqrt(sU), rC = kS * Math.sqrt(sC);
        const rsc = 1 / Math.sqrt(Vw.k);   /* bodies grow with the zoom by its square root, so a crowd spreads out as you zoom in */
        placeSun(sunU, Uc, rU * 2.6 * rsc, rU * rsc); const chQ = list.find(q => q.china); placeSun(sunC, hyp || !chQ ? Cc : place(chQ, L, yf, e), rC * 2.6 * rsc, rC * rsc); sunC.style.opacity = hyp ? 0 : clamp(e * 3 + (yf >= 2001 ? .35 : 0), 0, 1);
        let usP = Uc;
        list.forEach(q => {
          const p = place(q, L, yf, e), sh = hyp ? null : share(q, yf), sp = hyp && q.d ? at(q.d.sumpct, yf) : null;
          q.p = p; q.g.setAttribute('transform', `translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})`);
          let r = 3.2, mark = 'norm';
          if (q.core) { r = q.china ? rC : rU; if (hyp) r = 11; } else if (q.bk) { r = 4.4; mark = 'bk'; } else if (hyp) { if (sp == null) { mark = 'nodata'; } else { r = Math.max(3.2, kH * Math.sqrt(Math.abs(sp))); if (sp < 0) mark = 'neg'; } } else if (sh == null) mark = 'nodata'; else r = Math.max(3.2, kS * Math.sqrt(sh));
          if (hyp && q.core) mark = 'core'; if (!hyp && q.core) mark = 'core';
          q.r = r; q.mark = mark; q.mass = q.core ? 1e3 : hyp ? (sp == null ? null : Math.abs(sp)) : sh; [q.c, q.c2].forEach(n => n.setAttribute('r', (r * rsc).toFixed(2))); q.hit.setAttribute('r', ((compact ? 16 : 12) / Vw.k).toFixed(2));
          q.g.dataset.m = mark; q.g.dataset.s = q.core ? (q.china ? 'cn' : 'core') : u > .9 ? (q.b.sys === 'cn' ? 'cn' : q.b.sys === 'both' || q.b.sys === 'swing' || q.b.sys === 'open' ? (era < 2 ? 'btw' : q.b.sys === 'both' ? 'both' : 'sw') : era < 1 ? 'us' : q.py && q.py <= yr0 ? 'pax' : q.ty && q.ty <= yr0 ? 'tw' : 'usx') : 'us';
          q.g.dataset.z = u > .9 && q.b.zone && q.b.sys !== 'core' ? '1' : '';
          if (q.b.k === 'g') q.g.dataset.m = 'grp';
          q.tx.dataset.m = q.g.dataset.m; q.tx.dataset.s = q.g.dataset.s;
          /* creditor / debtor rings (deep layer) */
          if (mode === 'rings' && q.d && q.d.sum) { const v = at(q.d.sum, yf); if (v != null) { const t = clamp(.5 + Math.sqrt(Math.abs(v)) * .06, .6, 7); q.rg.setAttribute('r', (v > 0 ? r + 2 + t / 2 : Math.max(1.2, r - t / 2)).toFixed(2)); q.rg.setAttribute('stroke-width', t.toFixed(2)); q.rg.dataset.k = v > 0 ? 'cr' : 'db'; } else q.rg.dataset.k = ''; } else q.rg.dataset.k = '';
          q.vis = !(q.b.k === 'g' && !q.d);
        });
        /* the streams: BEA income by host country, drawn inward to the US sun */
        sPaths.forEach(q => { const v = at(q.d.inc, yf), p = q.p; if (!v || v <= 0 || (q.b.sys === 'cn' && u > .5) || q.core) { q.st.style.opacity = 0; q.pu.style.display = 'none'; return; } const w = clamp(.5 + Math.sqrt(v / 1000) * .38, .5, 6), mx = (p[0] + usP[0]) / 2, my = (p[1] + usP[1]) / 2 + (L.ph ? 0 : 10);
          q.st.setAttribute('d', `M${p[0].toFixed(1)} ${p[1].toFixed(1)}Q${mx.toFixed(1)} ${(my + (p[1] < usP[1] ? 12 : -12)).toFixed(1)} ${usP[0].toFixed(1)} ${usP[1].toFixed(1)}`); q.st.setAttribute('stroke-width', w.toFixed(2)); q.st.style.opacity = ''; q.st.dataset.on = '1';
          if (story && e >= .985) { const len = Math.max(20, Math.hypot(p[0] - usP[0], p[1] - usP[1]) * 1.03); q.pu.setAttribute('d', q.st.getAttribute('d')); q.pu.setAttribute('stroke-width', Math.max(1.2, w).toFixed(2)); q.pu.style.strokeDasharray = (7 / len).toFixed(4) + ' ' + (93 / len).toFixed(4); q.pu.style.setProperty('--per', (-100 / len).toFixed(4)); q.pu.style.display = ''; } else q.pu.style.display = 'none'; });
        /* OR7: China's own institutions as arcs round China, once the two systems have parted (u > 0); each ends at its name */
        if (story) {
          /* each arc starts just past the top and runs down one side of China to its name: by turns right and left, so the names stand in two short columns that no arc crosses */
          const R0 = compact ? Math.max(rC * .9 + 5, 13) : Math.max(rC * .9 + 10, 30), stp = compact ? 3.2 : 8, T0 = .22;
          arcs.forEach(A => { const on = u > 0 && yr0 >= A.a.year, r = R0 + A.i * stp, rt = A.i % 2 === 0, yo = compact ? r * .3 : 15 + Math.floor(A.i / 2) * 13.5, be = Math.asin(Math.min(.98, yo / r)), a0 = -Math.PI / 2 + (rt ? -T0 : T0), a1 = rt ? -be : -Math.PI + be, pt = a => [Cc[0] + r * Math.cos(a), Cc[1] + r * Math.sin(a)], s0 = pt(a0), s1 = pt(a1), d = `M${s0[0].toFixed(1)} ${s0[1].toFixed(1)}A${r.toFixed(1)} ${r.toFixed(1)} 0 0 ${rt ? 1 : 0} ${s1[0].toFixed(1)} ${s1[1].toFixed(1)}`;
            A.p.setAttribute('d', d); A.hp.setAttribute('d', d); A.g.style.opacity = on ? u.toFixed(3) : 0; A.g.style.pointerEvents = on && u > .9 ? '' : 'none'; A.g.setAttribute('tabindex', on && u > .9 ? 0 : -1); A.on = on && u > .6; A.end = s1; A.rt = rt; });
          st.ah = [Cc[0], Cc[1] + Math.max(14, rC * .72) + 22];
          ownB.forEach(d => d.classList.toggle('on', +d.dataset.y <= yr0)); if (cnW) cnW.classList.toggle('off', yr0 < ORD().cn[2][1]);
          if (st.py !== yr0) { st.py = yr0; st.ins = null; }
        }
        if (c4) c4.hidden = !sPaths.some(q => q.st.style.opacity !== '0');
        const split = story && e >= .985; if (split !== st.split) { st.split = split; wrap.classList.toggle('split', split); pmSync(); loopSync(); }
        /* counters */
        const U = OD.bodies[BYISO().USA], CN = OD.bodies[BYISO().CHN], yr = Math.round(yf);
        cy.textContent = String(yr);
        if (hyp) { const g = OD.bodies[BYISO().DEU]; c1.innerHTML = '<span>Germany, summed since 1995</span><b>' + f1(at(g.sumpct, yf)) + '% of GDP</b>'; c2.innerHTML = '<span>China (from 1997)</span><b>' + (at(CN.sumpct, yf) == null ? 'not collected' : f1(at(CN.sumpct, yf)) + '% of GDP') + '</b>'; c3.innerHTML = '<span>United States</span><b>' + f1(at(U.sumpct, yf)) + '% of GDP</b>'; }
        else {
          c1.innerHTML = '<span>US share of world GDP</span><b>' + f1(at(U.share, yf)) + '%</b>'; c2.innerHTML = '<span>China’s share</span><b>' + f1(at(CN.share, yf)) + '%</b>';
          const cu = at(U.sum, yf), cc = at(CN.sum, yf); c3.innerHTML = '<span>Current account summed since 1995</span><b>US ' + tn(cu) + ' · China ' + (cc == null ? 'from 1997' : tn(cc)) + '</b>' + (yr === 2026 ? '<em class="wipp">IMF estimate</em>' : '');
        }
        if (story) narrate(yr);
        inp.setAttribute('aria-valuetext', spoken(yr)); if (!st.drag && document.activeElement !== inp) inp.value = yf; else if (!st.drag) inp.value = yf;
        if (st.sel) infoFor(st.sel);
        if (full) { const ev = hyp ? null : evAt(yr), ins = story ? ownAt(yr) : null; evl.textContent = ev ? ev.year + ' · ' + ev.label : ''; if (ins) evl.append(h('span', 'own', 'China’s own · ' + ins.year + ' · ' + ins.n)); }
        OZ[hyp ? 'hy' : 'y'] = yr; syncKey(); drawStep(); placeLabels(); if (canStep && cur && cur.wrap === wrap) R.title.textContent = V.orr.title();
      }
      /* ---------- the names: only the big ones on a phone, and never two on top of each other ---------- */
      const LBL_MIN = hyp ? 55 : 2.5;   /* a phone names a body above this mass: 2.5% of world GDP (hyp: 55% of GDP summed) */
      const measure = q => { if (!q.tw) { let w = 0; try { w = q.tx.getComputedTextLength(); } catch (x) { w = 0; } q.tw = w > 0 ? w : 0; } return q.tw || q.vt.length * 5.6; };
      const hit = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
      /* what lies over the picture and is read as text: the counters and the buttons; a name never sits under them (rechecked every 0.3 s) */
      function obstacles() {
        const t = performance.now(); if (st.ob && t - st.obT < 300) return st.ob; const r = svg.getBoundingClientRect(), z = W / (r.width || W), out = [];
        const add = n => { if (!n || !n.isConnected) return; const b = n.getBoundingClientRect(); if (b.width && b.height) out.push([(b.left - r.left) * z - 4, (b.top - r.top) * z - 3, (b.right - r.left) * z + 4, (b.bottom - r.top) * z + 3]); };
        if (!st.step) counters.querySelectorAll(':scope > div').forEach(add); add(fsb); add(strip); if (pm && !pm.hidden) add(pm); if (!full && keyB) { add(keyB); if (!keyP.hidden) add(keyP); } if (st.cap) add(st.cap); if (st.fn) add(st.fn); if (st.pp) st.pp.querySelectorAll('.orr-ch').forEach(add); if (tbar) tbar.querySelectorAll('button').forEach(add);
        st.ob = out; st.obT = t; return out;
      }
      function placeLabels() {
        const sel = st.sel ? list.find(x => x.id === st.sel) : null, k = Vw.k, near = new Set(), placed = obstacles().slice();
        list.forEach(q => { if (!q.p || q.vis === false || (st.step && !q.g.classList.contains('keep'))) return; const rr = q.r * Math.sqrt(k) * (q.core ? .72 : 1); if (rr >= 6) { const x = Sx(q.p[0]), y = Sy(q.p[1]); placed.push([x - rr + 1, y - rr + 1, x + rr - 1, y + rr - 1]); } });   /* OR7: a name never sits on a large body */
        if (sel && sel.p) list.forEach(q => { if (q !== sel && q.p) { const d = Math.hypot(Sx(q.p[0]) - Sx(sel.p[0]), Sy(q.p[1]) - Sy(sel.p[1])); if (d <= 90) near.add([d, q]); } });
        const nb = new Set([...near].sort((a, b) => a[0] - b[0]).slice(0, 4).map(a => a[1]));
        /* OR7: the names of China's arcs and of the step's lines are placed first; body names give way to them */
        arcs.forEach(A => { if (!A.t.isConnected) return; const vis = A.on && !st.opening; A.t.classList.toggle('off', !vis); if (!vis) return; if (!A.tw) { try { A.tw = A.t.getComputedTextLength(); } catch (x) { A.tw = 0; } } const w = A.tw || A.t.textContent.length * 5.6, x = Sx(A.end[0]) + (A.rt ? 6 : -6), y = Sy(A.end[1]) + 3.5; A.t.setAttribute('x', x.toFixed(1)); A.t.setAttribute('y', y.toFixed(1)); A.t.setAttribute('text-anchor', A.rt ? 'start' : 'end'); placed.push(A.rt ? [x - 2, y - 9, x + w + 2, y + 3] : [x - w - 2, y - 9, x + 2, y + 3]); });
        if (arcH) { const vis = !!(arcs.length && arcs[0].on && !st.opening && st.ah); arcH.classList.toggle('off', !vis); if (vis) { const x = Sx(st.ah[0]), y = Sy(st.ah[1]); arcH.setAttribute('x', x.toFixed(1)); arcH.setAttribute('y', y.toFixed(1)); placed.push([x - 96, y - 10, x + 96, y + 4]); } }
        if (st.flabs) st.flabs.forEach(r => placed.push(r));
        /* the words that stay on the picture (desktop): ring names and the lane's, nudged apart */
        ringT.concat(laneT).forEach(t => { if (!t.isConnected || t.style.opacity === '0') return; const x = +t.getAttribute('x'), y0 = +t.getAttribute('y'), w = t.classList.contains('orr-lt') ? Math.max(120, t.textContent.length * 8.2) : (t.textContent.length * 7.4), anc = t.getAttribute('text-anchor') === 'middle' ? -w / 2 : 0; let y = y0, r = [x + anc, y - 10, x + anc + w, y + 3];
          for (let n = 0; n < 6 && placed.some(p => hit(p, r)); n++) { y += 5; r = [x + anc, y - 10, x + anc + w, y + 3]; } if (y !== y0) t.setAttribute('y', y.toFixed(1)); placed.push(r); });
        const cand = list.map(q => { let pr = -1; if (!q.p) return null;
          if (q === sel) pr = 4e9; else if (q.core) pr = 3e9; else if (nb.has(q)) pr = 2e9 + (q.mass || 0);
          else if (!compact) pr = 1e9 + (q.mass || 0); else if (q.mass != null && q.mass >= LBL_MIN / (k * k)) pr = 1e9 + q.mass;
          return pr < 0 ? null : [pr, q]; }).filter(Boolean).sort((a, b) => b[0] - a[0]);
        const on = new Set();
        cand.forEach(([pr, q]) => {
          const cx = Sx(q.p[0]), cy = Sy(q.p[1]), rr = q.r * Math.sqrt(k), w = measure(q), hh = 12, g = 4;
          const opts = [[cx + rr + g, cy, 'start'], [cx - rr - g, cy, 'end'], [cx, cy - rr - 9, 'middle'], [cx, cy + rr + 10, 'middle'], [cx + rr * .7 + g, cy - rr - 6, 'start'], [cx + rr * .7 + g, cy + rr + 8, 'start'], [cx - rr * .7 - g, cy - rr - 6, 'end'], [cx - rr * .7 - g, cy + rr + 8, 'end']];
          let pick_ = null; const ord = q.lo != null && q.b.sys === 'cn' ? [opts[q.lo]].concat(opts.filter((_, i) => i !== q.lo)) : opts;   /* a moon's name keeps its side while it fits there */
          for (const op of ord) { const [x, y, an] = op, x0 = an === 'start' ? x : an === 'end' ? x - w : x - w / 2, r = [x0 - 1, y - hh / 2, x0 + w + 1, y + hh / 2 + 1];
            if (r[0] < 2 || r[2] > W - 2 || r[1] < 2 || r[3] > HL - 2) continue; if (placed.some(p => hit(p, r))) continue; pick_ = [x, y, an, r]; q.lo = opts.indexOf(op); break; }
          if (!pick_ && pr >= 3e9) { const [x, y, an] = opts[0], x0 = an === 'start' ? x : an === 'end' ? x - w : x - w / 2; pick_ = [x, y, an, [x0 - 1, y - hh / 2, x0 + w + 1, y + hh / 2 + 1]]; }   /* the body tapped is never dropped: the others yield, the smaller first */
          if (!pick_) return; placed.push(pick_[3]); on.add(q);
          q.tx.setAttribute('x', pick_[0].toFixed(1)); q.tx.setAttribute('y', (pick_[1] + 4).toFixed(1)); q.tx.setAttribute('text-anchor', pick_[2]);
        });
        list.forEach(q => { q.tx.classList.toggle('off', !on.has(q)); q.tx.classList.toggle('sel', q === sel); });
      }
      function applyView() {
        Vw.k = clamp(Vw.k, 1, 5); Vw.x = clamp(Vw.x, W - W * Vw.k, 0); Vw.y = clamp(Vw.y, H - H * Vw.k, 0);
        gV.setAttribute('transform', 'translate(' + Vw.x.toFixed(2) + ' ' + Vw.y.toFixed(2) + ') scale(' + Vw.k.toFixed(4) + ')'); render(st.yf);
      }
      function zoomBy(f, c) { c = c || [W / 2, H / 2]; const k0 = Vw.k, k = clamp(k0 * f, 1, 5), wx = (c[0] - Vw.x) / k0, wy = (c[1] - Vw.y) / k0; Vw.k = k; Vw.x = c[0] - k * wx; Vw.y = c[1] - k * wy; applyView(); }
      function resetView() { Vw.k = 1; Vw.x = 0; Vw.y = 0; if (full) { OZ.tilt = null; Object.assign(L, layout(W, HL, ph, .5), { e: L.e }); } applyView(); }
      function setTilt(t) { t = clamp(t, TILT[0], TILT[1]); if (L.ph || Math.abs(t - L.tilt) < .0005) return; OZ.tilt = t; Object.assign(L, layout(W, HL, ph, t), { e: L.e }); render(st.yf); }
      /* the key: the rings and bands, named off the picture */
      function syncKey() {
        const box = full ? keyP : (compact ? K.R.lg : null); if (!box) return; const on = L.e >= .9; if (st.band === on && box === st.bandBox) return; st.band = on; st.bandBox = box;
        box.querySelectorAll('[data-band]').forEach(n => { n.hidden = !on; });
      }
      function keyShow(v) { keyP.hidden = !v; keyB.setAttribute('aria-expanded', String(v)); X.orrKey = v; }
      function hl(k, on) { ringE.forEach((r, i) => r.classList.toggle('hl', on && i === k)); pairU.concat(pairC).forEach((r, i) => r.classList.toggle('hl', on && i % 5 === k)); }
      function placeSun(g, p, rg, rc) { const a = g.querySelector('.gl'), b = g.querySelector('.co'); [a, b].forEach(n => { n.setAttribute('cx', p[0]); n.setAttribute('cy', p[1]); }); a.setAttribute('r', Math.max(10, rg)); b.setAttribute('r', Math.max(3, rc * .72)); }
      const spoken = yr => { const U = OD.bodies[BYISO().USA], CN = OD.bodies[BYISO().CHN], ev = evAt(yr);
        return hyp ? 'Year ' + yr + '. Germany, ' + f1(at(OD.bodies[BYISO().DEU].sumpct, yr)) + '% of GDP summed since 1995. China, ' + (at(CN.sumpct, yr) == null ? 'not collected' : f1(at(CN.sumpct, yr)) + '%') + '.'
          : 'Year ' + yr + '. China, ' + f1(at(CN.share, yr)) + '% of world GDP.' + (ev && ev.year === yr ? ' Event: ' + ev.line : ''); };
      function infoFor(id) {
        const q = list.find(x => x.id === id); info.textContent = ''; info.dataset.idle = q ? '' : '1'; if (!q) { info.append(h('p', 'oh', (ph ? 'Tap' : 'Move over or select') + ' a body for its share, its summed current account and what US firms’ affiliates earned there.')); return; }
        const yr = Math.round(st.yf), d = q.d, b = q.b; st.sel = id;
        info.append(h('span', 'k', q.bk ? 'Booking point' : (q.core ? 'Centre' : (b.wring === 1 ? 'Tools, chips and finance' : OB.sectors[b.wsec] || ''))), h('b', '', q.name));
        const rows = [];
        if (d && d.share && !q.bk) rows.push(['Share of world GDP, ' + yr, at(d.share, yr) == null ? 'not collected' : f1(at(d.share, yr)) + '%' + (d.estFrom && yr >= d.estFrom ? ' (IMF estimate)' : '')]);
        if (d && d.sum) rows.push(['Current account summed since 1995', at(d.sum, yr) == null ? 'not collected' : tn(at(d.sum, yr)) + (at(d.sumpct, yr) != null ? ' · ' + f1(at(d.sumpct, yr)) + '% of that year’s GDP' : '')]);
        if (d && d.inc) rows.push(['Income of US affiliates there, ' + yr, at(d.inc, yr) == null ? 'not collected' : '$' + (Math.round(at(d.inc, yr)) / 1000).toFixed(1) + 'bn (BEA' + (yr < 2006 ? ', net of withholding taxes' : '') + ')']);
        if (q.china) rows.push(['Streams into China', 'not collected']);
        const M = !hyp && OD.members && q.iso ? OD.members[q.iso] : null;   /* OR7: official lists read 25 Nov 2026; shown as of the slider's year */
        if (M) { const f = m => m[0] + ' (' + (/^first/.test(m[2]) ? 'since the ' + m[2] : /^(partner|founder|founding)/.test(m[2]) ? m[2] : 'since ' + m[2]) + ')', now = M.filter(m => m[1] != null && m[1] <= yr && !(q.china && m[0] === 'ADB')).map(f), nc = M.filter(m => m[1] == null && (m[2] === 'not collected' || yr >= 2026)).map(m => m[0] + ': ' + m[2]);
          rows.push(['Member of, ' + yr, now.concat(nc).join(' · ') || (q.china ? 'none of SCO, BRICS, NDB, AIIB or WAICO yet' : 'none of ADB, AIIB, NDB, SCO or BRICS')], q.china ? ['In the old order, ' + yr, ORD().cn.filter(x => x[1] <= yr).map(x => x[0] + ' (since ' + x[1] + ')').join(' · ')] : ['IMF, World Bank and WTO membership', 'not collected']); }
        rows.forEach(r => { const p = h('p', 'rw'); p.append(h('span', '', r[0]), h('b', '', r[1])); info.append(p); });
        if (b.role && !q.bk) info.append(h('p', 'ro', b.role));
        if (q.iso === 'DEU' || q.iso === 'NLD') { const a = h('button', 'lk', q.iso === 'DEU' ? 'German hypocrisy →' : 'The Netherlands declines to comment. →'); a.type = 'button'; a.dataset.pv = 'hyp'; info.append(a); }
      }
      /* ---------- OR7: the card under the timeline: the event, and what China builds; in a step, the step ---------- */
      function narrate(yr) {
        const key = yr + '|' + (st.step || '') + '|' + (st.ins || ''); if (key === st.nk) return; st.nk = key; narr.textContent = ''; narr.dataset.step = st.step || '';
        const nav = (bk, nx) => { const n = h('div', 'orr-nav'); [bk, nx].forEach((x, i) => { if (!x) return; const b = h('button', 'orr-nx' + (i ? ' fw' : '')); b.type = 'button'; if (x[2]) b.dataset.pv = x[2]; else b.dataset.gs = x[0] || ''; b.textContent = (i ? 'Next: ' : '← Back: ') + x[1] + (i ? ' →' : ''); n.append(b); }); return n; };
        if (st.step) {
          const S = STEPS[st.step], a = h('div', 'orr-ev1 stp'); a.append(h('span', 'k', 'After the story · step ' + S.n + ' of 2'), h('p', '', S.title + '.'));
          if (st.step === 'pp') { const D = OD.steps.pp, fl = v => { const i = v.findIndex(x => x != null); let j = v.length - 1; while (v[j] == null) j--; return [D.years[i], v[i], D.years[j], v[j]]; }, u = fl(D.us), c = fl(D.cn);
            const mx = D.cn.reduce((r, v, i) => v != null && v > r[1] ? [D.years[i], v] : r, [0, 0]);
            a.append(h('p', 'd', 'In the ' + u[2] + ' Forbes list, US firms took ' + f1(u[3]) + '% of the profits of the world’s 2,000 largest listed firms, up from ' + f1(u[1]) + '% in the ' + u[0] + ' list. China made ' + f1(c[3]) + '% of the world’s manufacturing value added in ' + c[2] + ', up from ' + f1(c[1]) + '% in ' + c[0] + '; its highest share was ' + f1(mx[1]) + '%, in ' + mx[0] + '.'));
            if (ppIn && st.pp) a.append(st.pp);
            if (!ppIn) a.append(h('small', '', 'Sources: ' + D.usSrc + ' ' + D.cnSrc)); a.append(nav(['', 'The story, 2026'], ['cl', 'China finances the system it competes with'])); }
          else { const C = OD.steps.cl, nm = iso => (isoB(iso) || { name: iso }).name, o = C.into.slice(1).map(x => nm(x[0]) + ' ' + bn(x[1]));
            a.append(h('p', 'd', 'In ' + C.year + ' China ran a surplus of ' + bn(C.into[0][1]) + ' with the world, ' + o.join(' and ') + '; the United States ran a deficit of ' + bn(C.us) + '. These are the three largest surpluses among the economies on the picture, not the whole pool.'), ...(ph || W >= 1000 ? [] : [h('p', 'ast', '* No pair of countries settles alone: surpluses meet deficits in one pool, and the pool buys dollar assets. Lines between the poles show a direction only.')]),
              h('small', '', 'Source: ' + C.src), nav(['pp', 'Profit and production'], ['', 'For economists: the full statistics', 'orb'])); }
          narr.append(a); return; }
        const ev = evAt(yr), a = h('div', 'orr-ev1'); a.append(h('span', 'k', ev ? ev.year + ' · ' + ev.label : String(yr)), h('p', '', ev ? ev.line : ''), h('small', '', ev ? 'Source: ' + ev.src : ''));
        if (yr >= LW) a.append(h('span', 'k k2', '2026 · Pax Silica grows'), h('p', 'x', 'More governments sign through the year: the list stood at 25 signatories beside the United States on 25 Nov 2026 (State Department).'));
        const lk = h('button', 'lk', 'All four cards →'); lk.type = 'button'; lk.dataset.pv = 'orb'; a.append(lk);
        const ins = (st.ins && OWN().find(x => x.id === st.ins)) || ownAt(yr), b = h('div', 'orr-ins');
        b.append(h('span', 'k t', ins ? 'China builds its own · ' + ins.year + ' · ' + (compact && ins.full.length > 34 ? ins.n : ins.full) : 'The frame · the old order'), h('p', '', ins ? ins.line : ORD().frame.line), h('small', '', 'Source: ' + (ins ? ins.src : ORD().frame.src)));
        narr.append(a, b); if (canStep && yr >= maxY) narr.append(nav(null, ['pp', 'Profit gathers at the centre; production moves to China']));
      }
      /* ---------- OR7: the two steps after 2026 ---------- */
      function stepUI() { if (!steps) return; steps.querySelectorAll('.orr-stp').forEach(b => { if ((b.dataset.step || '') === (st.step || '')) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); }); }
      function stepClear() { gFlow.textContent = ''; flowT.forEach(n => n.remove()); flowT.length = 0; st.flows = null; st.flabs = null; st.ppL = null; if (st.pp) { st.pp.remove(); st.pp = null; } if (st.cap) { st.cap.remove(); st.cap = null; } if (st.fn) { st.fn.remove(); st.fn = null; } if (st.vn0 != null) R.vn.textContent = st.vn0; list.forEach(q => { q.g.classList.remove('keep'); q.tx.classList.remove('keep'); }); }
      function leaveStep() { stepClear(); st.step = null; OZ.step = null; wrap.dataset.step = ''; st.nk = ''; stepUI(); st.ob = null; if (canStep) R.title.textContent = V.orr.title(); }
      function setStep(s, quiet) {
        if (!canStep) return; s = s || null;
        if (s && Math.round(st.yf) < maxY) { cancelAnimationFrame(st.raf); st.raf = 0; render(maxY); st.lastInt = maxY; }
        if (s === st.step) { stepUI(); return; }
        stepClear(); st.step = s; OZ.step = s; wrap.dataset.step = s || ''; st.nk = ''; st.ob = null;
        if (s) { const keep = ['USA', 'CHN'].concat(s === 'cl' ? OD.steps.cl.into.map(x => x[0]) : []); list.forEach(q => { const k = !q.bk && keep.includes(q.iso); q.g.classList.toggle('keep', k); q.tx.classList.toggle('keep', k && q.core); }); }
        if (s) { if (st.vn0 == null) st.vn0 = R.vn.textContent; R.vn.textContent = 'After the story · step ' + STEPS[s].n + ' of 2';   /* in a step the counters step back; a caption says what the picture's figures are and of which year */
          st.cap = h('div', 'orr-sc'); st.cap.append(h('b', '', s === 'pp' ? 'Two shares of the world’s total' : 'Current accounts in ' + OD.steps.cl.year + ', $bn (IMF)')); stage.append(st.cap);
          if (s === 'cl' && (ph || W >= 1000)) { st.fn = h('p', 'orr-fn', '* No pair of countries settles alone: surpluses meet deficits in one pool, and the pool buys dollar assets. Lines between the poles show a direction only.'); st.fn.style.bottom = (FH + 6) + 'px'; stage.append(st.fn); } }
        if (s === 'pp') buildPP(); else if (s === 'cl') buildCL();
        narrate(Math.round(st.yf)); stepUI(); drawStep(); placeLabels(); R.title.textContent = V.orr.title(); deepb.classList.toggle('next', st.yf >= 2025);
        if (!quiet) { X.emit('profit', { st: 'order', view: K.vw(), act: 'step' }); K.sync && K.sync(); }
      }
      /* step 1: two small charts on the same years, never one chart with two axes; gaps stay gaps */
      function chart(key, plotH) {
        const D = OD.steps.pp, ys = D.years, vs = D[key], us = key === 'us', cw = 300, m = { l: 8, r: 8, t: 16, b: 15 }, chh = plotH + m.t + m.b, ymax = Math.max.apply(null, vs.filter(v => v != null)) * 1.12, y0 = ys[0], y1 = ys[ys.length - 1];
        const Xs = y => m.l + (y - y0) / (y1 - y0) * (cw - m.l - m.r), Ys = v => m.t + (1 - v / ymax) * plotH, unit = us ? ' list' : '';
        const pts = ys.map((y, i) => vs[i] == null ? null : [Xs(y), Ys(vs[i]), y, vs[i]]), have = pts.filter(Boolean), a = have[0], b = have[have.length - 1], top = have.reduce((r, q) => q[3] > r[3] ? q : r, a);
        const title = us ? 'US share of the profits of the world’s 2,000 largest listed firms' : 'China’s share of world manufacturing value added';
        const box = h('div', 'orr-ch ' + (us ? 'u' : 'c')), sv = el('svg', { viewBox: `0 0 ${cw} ${chh}`, class: 'cs', role: 'img', 'aria-label': title + ': ' + f1(a[3]) + '% in ' + a[2] + (us ? ' (the list of that year)' : '') + ', ' + f1(b[3]) + '% in ' + b[2] + '; the highest value is ' + f1(top[3]) + '% in ' + top[2] + '. ' + (us ? 'Lists before 2011 not collected.' : 'No value for 2026.') });
        sv.append(el('line', { class: 'ax', x1: m.l, x2: cw - m.r, y1: Ys(0), y2: Ys(0) }));
        [y0, y1].forEach((y, i) => sv.append(el('text', { class: 'ay', x: i ? cw - m.r : m.l, y: chh - 3, 'text-anchor': i ? 'end' : 'start' }, String(y))));
        let d = '', pen = false; pts.forEach(q => { if (!q) { pen = false; return; } d += (pen ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); pen = true; });
        sv.append(el('path', { class: 'ln', d, fill: 'none' }));
        [a, b].forEach((q, i) => { const nb = have[i ? have.length - 2 : 1], below = nb[3] > q[3] && Ys(0) - q[1] >= 19;   /* the label sits on the side the line does not come from, and clear of the axis */
          sv.append(el('circle', { class: 'dt', cx: q[0].toFixed(1), cy: q[1].toFixed(1), r: 4 }), el('text', { class: 'vl', x: q[0].toFixed(1), y: (q[1] + (below ? 17 : -9)).toFixed(1), 'text-anchor': i ? 'end' : 'start' }, f1(q[3]) + '% · ' + q[2] + unit)); });
        /* the hover layer: the value of the year under the pointer */
        const hx = el('line', { class: 'hx', y1: m.t - 4, y2: Ys(0) }), hd = el('circle', { class: 'hd', r: 4 }), ht = el('text', { class: 'ht', y: 10 }); [hx, hd, ht].forEach(n => { n.style.display = 'none'; sv.append(n); });
        sv.addEventListener('pointermove', ev => { const r = sv.getBoundingClientRect(), x = (ev.clientX - r.left) / (r.width || cw) * cw; let q = have[0]; have.forEach(z => { if (Math.abs(z[0] - x) < Math.abs(q[0] - x)) q = z; });
          hx.setAttribute('x1', q[0]); hx.setAttribute('x2', q[0]); hd.setAttribute('cx', q[0]); hd.setAttribute('cy', q[1]); ht.textContent = q[2] + unit + ' · ' + f1(q[3]) + '%'; const right = q[0] > cw / 2; ht.setAttribute('x', right ? q[0] - 6 : q[0] + 6); ht.setAttribute('text-anchor', right ? 'end' : 'start'); [hx, hd, ht].forEach(n => { n.style.display = ''; }); });
        sv.addEventListener('pointerleave', () => [hx, hd, ht].forEach(n => { n.style.display = 'none'; }));
        box.append(h('div', 'ct', title), sv, h('small', '', us ? D.usSrc : D.cnSrc)); return box;
      }
      function buildPP() { const avail = HL - L.cy - Math.max(34, isoB('USA').r * 1.25 + 12) - 6, plotH = ppIn ? 84 : clamp(Math.round(avail - 96), 44, 92); st.pp = h('div', 'orr-pp' + (ppIn ? ' in' : '')); st.pp.append(chart('us', plotH), chart('cn', plotH)); if (!ppIn) { stage.append(st.pp); return; }
        /* a narrow stage: the charts stand in the card under the picture, and the picture carries the two end figures by their bodies */
        const D = OD.steps.pp, last = v => { let j = v.length - 1; while (v[j] == null) j--; return [D.years[j], v[j]]; }, u = last(D.us), c = last(D.cn);
        st.ppL = [['USA', 'US firms: ' + f1(u[1]) + '% of the profits', 'of the world’s 2,000 largest listed firms · ' + u[0] + ' list'], ['CHN', 'China: ' + f1(c[1]) + '% of the world’s', 'manufacturing value added · ' + c[0]]].map(([iso, a, b]) => { const tx = el('text', { class: 'orr-fl' }, a), t2 = el('text', { class: 'orr-fl fg sur' }, b); gT.append(tx, t2); flowT.push(tx, t2); return { iso, t: tx, t2 }; }); }
      /* step 2: surpluses run into one named point, never into the United States; one line runs from it into the United States; goods and dollars between the poles are dashed and illustrative */
      function buildCL() {
        const C = OD.steps.cl, two = L.ph || W < 900;   /* a narrow stage: the name and the figure on two lines */
        const mk = (cls, label, fig, from, to, v) => { const pa = el('path', { class: 'fl ' + cls, fill: 'none', 'data-from': from, 'data-to': to }), pu = v == null ? null : el('path', { class: 'fpu', fill: 'none', pathLength: 1 }), tx = el('text', { class: 'orr-fl ' + cls }, fig && !two ? label + ' · ' + fig : label), t2 = fig && two ? el('text', { class: 'orr-fl fg ' + cls }, fig) : null; gFlow.append(pa); if (pu) gFlow.append(pu); gT.append(tx); flowT.push(tx); if (t2) { gT.append(t2); flowT.push(t2); } return { p: pa, pu, t: tx, t2, from, to, v, cls }; };
        st.flows = C.into.map(([iso, v], i) => mk('sur', i ? (isoB(iso) || { name: iso }).name : 'China’s surplus', bn(v), iso, 'clearing', v));
        st.flows.push(mk('def', 'finances the US deficit', bn(C.us), 'clearing', 'USA', Math.abs(C.us)), mk('ill g', L.ph ? '↑ Goods*' : '← Goods*', null, 'CHN', 'USA', null), mk('ill dl', L.ph ? 'Dollars* ↓' : 'Dollars* →', null, 'USA', 'CHN', null));
        const g = el('g', { class: 'fp' }); g.append(el('circle', { class: 'o', r: 9 }), el('circle', { class: 'i', r: 3.2 })); gFlow.append(g); st.pt = g; st.ptT = el('text', { class: 'orr-fl pt' }, 'Multilateral clearing*'); gT.append(st.ptT); flowT.push(st.ptT);
      }
      function drawStep() {
        if (st.step === 'pp' && st.pp && !ppIn) { const pw = Math.min(300, Math.round(W * .36)), gap = Math.max(34, isoB('USA').r * 1.25 + 12); [['.u', isoB('USA').p], ['.c', isoB('CHN').p]].forEach(([s, c]) => { const n = st.pp.querySelector(s); n.style.width = pw + 'px'; n.style.left = clamp(c[0] - pw / 2, 8, W - pw - 8).toFixed(0) + 'px'; n.style.top = (c[1] + gap).toFixed(0) + 'px'; }); }
        if (st.step === 'pp' && st.ppL) { const fl = []; st.ppL.forEach(F => { const q = isoB(F.iso), sx = clamp(Sx(q.p[0]), 150, W - 150), sy = Sy(q.p[1]) + q.r * .8 + 24; let w = 0; try { w = Math.max(F.t.getComputedTextLength(), F.t2.getComputedTextLength()); } catch (x) { w = 0; } w = w || 250; [F.t, F.t2].forEach((n, i) => { n.setAttribute('x', sx.toFixed(1)); n.setAttribute('y', (sy + i * 16).toFixed(1)); n.setAttribute('text-anchor', 'middle'); }); fl.push([sx - w / 2 - 3, sy - 10, sx + w / 2 + 3, sy + 20]); }); st.flabs = fl; }
        if (st.step !== 'cl' || !st.flows) return;
        const P = [L.cx, L.cy], v = L.ph, nrm = v ? [1, 0] : [0, 1], flabs = [], pos = k => k === 'clearing' ? P : isoB(k).p, rad = k => k === 'clearing' ? 12 : isoB(k).r * (isoB(k).core ? .74 : 1) + 4;
        const tl = F => { if (!F.tw) { try { F.tw = Math.max(F.t.getComputedTextLength(), F.t2 ? F.t2.getComputedTextLength() : 0); } catch (x) { F.tw = 0; } } return F.tw || F.t.textContent.length * 5.8; };
        /* a name at (x, y): where a figure stands under it, y is the first of the two lines */
        const lab = (F, x, y, an) => { const sx = Sx(x), sy = Sy(y), w = tl(F), x0 = an === 'start' ? sx : an === 'end' ? sx - w : sx - w / 2; [F.t, F.t2].forEach((n, i) => { if (!n) return; n.setAttribute('x', sx.toFixed(1)); n.setAttribute('y', (sy + i * 16).toFixed(1)); n.setAttribute('text-anchor', an); }); flabs.push([x0 - 3, sy - 10, x0 + w + 3, sy + 4 + (F.t2 ? 16 : 0)]); };
        const up = F => F.t2 ? 16 : 0;
        const dP = k => Math.hypot(pos(k)[0] - P[0], pos(k)[1] - P[1]), others = st.flows.filter(F => F.cls === 'sur' && F.from !== 'CHN').sort((a, b) => dP(a.from) - dP(b.from));
        const off = others.reduce((s, F) => s + (v ? pos(F.from)[0] - P[0] : pos(F.from)[1] - P[1]), 0), side = off > 0 ? 1 : -1;   /* the side of the axis the surplus economies stand on */
        st.flows.forEach(F => {
          const A0 = pos(F.from), B0 = pos(F.to), dd = Math.hypot(B0[0] - A0[0], B0[1] - A0[1]) || 1, ux = (B0[0] - A0[0]) / dd, uy = (B0[1] - A0[1]) / dd, ra = rad(F.from), rb = rad(F.to) + 3, A = [A0[0] + ux * ra, A0[1] + uy * ra], B = [B0[0] - ux * rb, B0[1] - uy * rb], M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
          let d, len = dd, bow = 0;
          if (F.cls.indexOf('ill') === 0) bow = (F.cls === 'ill g' ? (v ? -.72 * W : .5 * HL) : (v ? .72 * W : .78 * HL));
          else if (F.cls === 'sur' && F.from !== 'CHN') bow = side * (.1 + .22 * others.indexOf(F)) * (v ? W : HL);
          if (bow) { const Cp = [M[0] + nrm[0] * bow, M[1] + nrm[1] * bow], Ap = [M[0] + nrm[0] * bow / 2, M[1] + nrm[1] * bow / 2]; d = `M${A[0].toFixed(1)} ${A[1].toFixed(1)}Q${Cp[0].toFixed(1)} ${Cp[1].toFixed(1)} ${B[0].toFixed(1)} ${B[1].toFixed(1)}`; len = dd * 1.2 + Math.abs(bow) * .5;
            if (F.cls.indexOf('ill') === 0) { if (v) lab(F, Ap[0] + (bow < 0 ? 7 : -7), Ap[1] + 24, bow < 0 ? 'start' : 'end'); else lab(F, Ap[0], Ap[1] + 15, 'middle'); }
            else if (v) lab(F, Ap[0] + (bow > 0 ? 7 : -7), Ap[1] + (others.indexOf(F) ? -24 : 8), bow > 0 ? 'start' : 'end'); else lab(F, Ap[0], Ap[1] + (bow < 0 ? -7 - up(F) : 15), 'middle'); }
          else { d = `M${A[0].toFixed(1)} ${A[1].toFixed(1)}L${B[0].toFixed(1)} ${B[1].toFixed(1)}`; flabs.push([Math.min(Sx(A0[0]), Sx(B0[0])) - 5, Math.min(Sy(A0[1]), Sy(B0[1])) - 5, Math.max(Sx(A0[0]), Sx(B0[0])) + 5, Math.max(Sy(A0[1]), Sy(B0[1])) + 5]);
            if (v) { if (F.cls === 'def') lab(F, M[0] - side * 10, M[1] - 2, side > 0 ? 'end' : 'start'); else lab(F, M[0] + 10, M[1] - 2, 'start'); }
            else if (F.cls === 'def' && F.t2) lab(F, M[0], M[1] + 17, 'middle'); else if (F.t2) lab(F, A[0] + (ux < 0 ? -8 : 8), M[1] - 21, ux < 0 ? 'end' : 'start'); else lab(F, M[0], M[1] - 8, 'middle'); }
          F.p.setAttribute('d', d); const w = F.v == null ? 1.4 : clamp(1.4 + Math.sqrt(F.v) / 9, 1.6, 5.6); F.p.setAttribute('stroke-width', w.toFixed(2)); F.p.setAttribute('marker-end', 'url(#orr-m' + (F.cls === 'def' ? 'g' : F.v == null ? 'c' : 'w') + gid + ')');
          if (F.pu) { F.pu.setAttribute('d', d); F.pu.setAttribute('stroke-width', w.toFixed(2)); F.pu.style.strokeDasharray = (9 / len).toFixed(4) + ' ' + (51 / len).toFixed(4); F.pu.style.setProperty('--per', (-60 / len).toFixed(4)); }
        });
        st.pt.setAttribute('transform', `translate(${P[0].toFixed(1)} ${P[1].toFixed(1)})`);
        const PT = { t: st.ptT }; if (v) lab(PT, P[0] + 15, P[1] - 9, 'start'); else lab(PT, P[0], P[1] - 17, 'middle');
        st.flabs = flabs;
      }
      /* the marks' key follows the lists' dates as the picture does */
      function syncMarks(era) { [full ? keyP : (story || compact ? R.lg : null), !full ? keyP : null].forEach(box => { if (!box) return; const mkk = box.querySelector('.orr-mk'); if (mkk && story) fillMarks(mkk, 'orr', era, compact); box.querySelectorAll('[data-band]').forEach(n => { n.lastChild.textContent = era < 2 ? 'Between the two systems' : n.dataset.band === '1' ? 'On both lists' : 'On neither list'; }); }); }
      const motion = { wants: () => story && st.split && !st.opening && !reduce(),
        step(dt, n) { st.rot = (st.rot + dt * ROT) % (Math.PI * 2); X.orrRot = st.rot; L.rot = st.rot; moons.forEach(q => { const c = place(q, L, st.yf, L.e); q.p = c; q.g.setAttribute('transform', `translate(${c[0].toFixed(2)} ${c[1].toFixed(2)})`); }); if (n % 6 === 0) placeLabels(); } };
      /* the interaction */
      const pick = id => { st.sel = id; list.forEach(q => q.g.classList.toggle('sel', q.id === id)); infoFor(id); placeLabels(); };
      const unpick = () => { if (!st.sel) return; st.sel = null; list.forEach(q => q.g.classList.remove('sel')); infoFor(null); placeLabels(); };
      const idOf = ev => { const g = ev.target.closest && ev.target.closest('[data-b]'); return g ? g.dataset.b : null; };
      svg.addEventListener('pointerover', ev => { const id = idOf(ev); if (id && ev.pointerType === 'mouse' && id !== st.sel) pick(id); });
      svg.addEventListener('click', ev => { const id = idOf(ev); if (id) pick(id); else if (compact) { unpick(); if (full && !keyP.hidden) keyShow(false); } });
      svg.addEventListener('click', ev => { if (st.noclick) { ev.stopPropagation(); ev.preventDefault(); } }, true);
      svg.addEventListener('focusin', ev => { const id = idOf(ev); if (id && id !== st.sel) pick(id); });
      svg.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { const id = idOf(ev); if (id) { ev.preventDefault(); pick(id); } } });
      const cross = (a, b) => { const lo = Math.min(a, b), hi = Math.max(a, b); if (story && !reduce() && OWN().some(x => x.year > lo && x.year <= hi)) c_pulse(); return EVS().some(e => e.year > lo && e.year <= hi) && !hyp && !reduce() && e_ripple(); };
      /* a teal ring round China when one of its own institutions arrives: a state change, played once */
      const ripC = el('circle', { class: 'ripc', opacity: 0, fill: 'none' }); gR.append(ripC);
      const c_pulse = () => { const c = isoB('CHN'); if (!c || !c.p) return; ripC.setAttribute('cx', c.p[0].toFixed(1)); ripC.setAttribute('cy', c.p[1].toFixed(1)); ripC.setAttribute('r', (Math.max(8, c.r) + 9).toFixed(1)); ripC.classList.remove('go'); void ripC.getBoundingClientRect(); ripC.classList.add('go'); };
      const e_ripple = () => { const e = st.e, f = L.f * clamp(L.e / .85, 0, 1); ripple.setAttribute('cx', L.cx); ripple.setAttribute('cy', L.cy); ripple.setAttribute('rx', L.rx[4] + f * Math.abs(L.v[0]) + 14); ripple.setAttribute('ry', L.ry[4] + f * Math.abs(L.v[1]) + 14); ripple.classList.remove('go'); void ripple.getBoundingClientRect(); ripple.classList.add('go'); return true; };
      const stop = () => { cancelAnimationFrame(st.raf); st.raf = 0; if (st.playing) { st.playing = false; play.textContent = '▶ Play'; play.setAttribute('aria-pressed', 'false'); } };
      const live = () => wrap.isConnected && X.view === 'profit' && !document.hidden;
      function go(y, ms) {   /* to a year, over ms (instantly under reduced motion) */
        y = clamp(y, 1995, maxY); const a = st.yf, t0 = performance.now(); cancelAnimationFrame(st.raf);
        if (reduce() || !ms || Math.abs(y - a) < .01) { const l = st.lastInt; render(y); cross(l, Math.round(y)); st.lastInt = Math.round(y); done(); return; }
        const step = now => { if (!wrap.isConnected) return; const t = clamp((now - t0) / ms, 0, 1), v = lerp(a, y, ease(t)), l = st.lastInt; render(v); if (Math.round(v) !== l) { cross(l, Math.round(v)); st.lastInt = Math.round(v); } if (t < 1) st.raf = requestAnimationFrame(step); else done(); };
        st.raf = requestAnimationFrame(step);
      }
      const done = () => { st.raf = 0; X.emit('profit', { st: 'order', view: K.vw(), act: 'year' }); K.sync && K.sync(); };
      inp.addEventListener('pointerdown', () => { stop(); st.drag = true; });
      inp.addEventListener('input', () => { stop(); const l = st.lastInt; render(+inp.value); if (Math.round(+inp.value) !== l) { cross(l, Math.round(+inp.value)); st.lastInt = Math.round(+inp.value); } });
      const release = () => { if (!st.drag) return; st.drag = false; go(Math.round(+inp.value), 220); };
      inp.addEventListener('pointerup', release); inp.addEventListener('change', () => { if (st.drag) release(); else if (!st.raf) go(Math.round(+inp.value), 0); });
      inp.addEventListener('keydown', ev => {
        const y = Math.round(st.yf), E = EVS();
        let t = null;
        if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') t = y - 1; else if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') t = y + 1;
        else if (ev.key === 'PageDown' && !hyp) { const p = E.filter(e => e.year < y); t = p.length ? p[p.length - 1].year : 1995; }
        else if (ev.key === 'PageUp' && !hyp) { const n = E.find(e => e.year > y); t = n ? n.year : maxY; }
        else if (ev.key === 'Home') t = 1995; else if (ev.key === 'End') t = maxY;
        if (t != null) { ev.preventDefault(); stop(); go(t, 450); }
      });
      dots.addEventListener('click', ev => { const b = ev.target.closest('[data-y]'); if (b) { stop(); go(+b.dataset.y, 600); } });
      ownD.addEventListener('click', ev => { const b = ev.target.closest('[data-y]'); if (b) { stop(); go(+b.dataset.y, 600); } });
      if (steps) {
        const ORDR = [null, 'pp', 'cl'];
        steps.addEventListener('click', ev => { const b = ev.target.closest('[data-step]'); if (b) { stop(); setStep(b.dataset.step || null); } });
        steps.addEventListener('keydown', ev => { const dlt = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : 0; if (!dlt) return; ev.preventDefault(); const i = ORDR.indexOf(st.step), j = clamp(i + dlt, 0, 2); if (j === i) return; stop(); setStep(ORDR[j]); steps.querySelectorAll('.orr-stp')[j].focus({ preventScroll: true }); });
        narr.addEventListener('click', ev => { const b = ev.target.closest('[data-gs]'); if (b) { stop(); setStep(b.dataset.gs || null); const c = steps.querySelector('[aria-current]'); if (c) c.focus({ preventScroll: true }); } });
      }
      /* an arc, or its name: the card says what that institution is */
      const arcPick = id => { if (!id || st.step) return; st.ins = id; narrate(Math.round(st.yf)); };
      svg.addEventListener('click', ev => { const g = ev.target.closest && ev.target.closest('[data-a]'); if (g) arcPick(g.dataset.a); });
      gArc.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { const g = ev.target.closest('[data-a]'); if (g) { ev.preventDefault(); arcPick(g.dataset.a); } } });
      play.addEventListener('click', () => {
        if (st.playing) { stop(); return; }
        if (st.yf >= maxY - .01 && (!canStep || st.step === 'cl')) { render(1995); st.lastInt = 1995; }
        const STOPS = hyp ? [] : [...new Set(EVS().map(e => e.year).concat(story ? OWN().map(a => a.year) : []))].sort((a, b) => a - b), isEv = y => EVS().some(e => e.year === y);
        const fin = () => { st.playing = false; play.textContent = '↺ Replay'; play.setAttribute('aria-pressed', 'false'); st.raf = 0; };
        st.playing = true; play.textContent = '❚❚ Pause'; play.setAttribute('aria-pressed', 'true'); let last = performance.now(), hold = 0, skip = null;
        const speed = 31 / 20;   /* 1995 to 2026 in about 20 s, 1.5 s at each event */
        const frame = now => {
          if (!st.playing || !live()) { if (!live() && st.playing) stop(); return; }
          const dt = Math.min(.1, (now - last) / 1000); last = now;
          if (hold > 0) { hold -= dt; st.raf = requestAnimationFrame(frame); return; }
          if (canStep && st.yf >= maxY - .01) {   /* OR7: after the years, the two steps, each held long enough to read */
            if (st.step === 'cl') { fin(); return; } setStep(st.step === 'pp' ? 'cl' : 'pp'); hold = 9; st.raf = requestAnimationFrame(frame); return; }
          const a = st.yf, b = Math.min(maxY, a + (reduce() ? 1 : speed * dt)), E = STOPS.find(y => y > a + .0001 && y <= b + .0001), l = st.lastInt;
          const to = E != null ? E : b; render(to); if (Math.round(to) !== l) { cross(l, Math.round(to)); st.lastInt = Math.round(to); }
          hold = E != null ? (isEv(E) ? 1.5 : 1.1) : reduce() ? .6 : 0; if (to >= maxY) { if (!canStep) { fin(); return; } hold = 2.4; }
          st.raf = requestAnimationFrame(frame);
        };
        st.raf = requestAnimationFrame(frame);
      });
      /* the picture by hand: a mouse drag tilts the rings (0.25 to 0.7); in full screen a finger drags the picture and two fingers pinch it,
         and a mouse drag pans once it is zoomed (Shift tilts). Nothing runs on its own: each move draws once, and nothing moves when it stops. */
      const ptr = new Map(); let gst = null;
      const pt = ev => { const r = svg.getBoundingClientRect(), z = W / (r.width || W); return [(ev.clientX - r.left) * z, (ev.clientY - r.top) * z]; };
      const mid = () => { const [a, b] = [...ptr.values()]; return { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }; };
      const move = ev => {
        if (!ptr.has(ev.pointerId) || !gst) return; ptr.set(ev.pointerId, pt(ev));
        if (gst.pinch) { if (ptr.size < 2) return; const c = mid(), k = clamp(gst.k0 * c.d / gst.d0, 1, 5), wx = (gst.m0[0] - gst.v0.x) / gst.k0, wy = (gst.m0[1] - gst.v0.y) / gst.k0; Vw.k = k; Vw.x = c.m[0] - k * wx; Vw.y = c.m[1] - k * wy; gst.moved = true; applyView(); return; }
        if (ev.pointerId !== gst.id) return; const p = ptr.get(ev.pointerId), dx = p[0] - gst.p0[0], dy = p[1] - gst.p0[1];
        if (!gst.moved && Math.hypot(dx, dy) < 5) return; gst.moved = true;
        if (full && (gst.type !== 'mouse' || (Vw.k > 1 && !gst.shift))) { Vw.x = gst.v0.x + dx; Vw.y = gst.v0.y + dy; applyView(); }
        else if (gst.type !== 'touch' && !L.ph) setTilt(gst.t0 + dy * .0018);
      };
      const up = ev => {
        if (!ptr.has(ev.pointerId)) return; ptr.delete(ev.pointerId);
        if (ptr.size === 1 && gst) { const [id, p] = [...ptr.entries()][0]; gst = { id, p0: p, t0: L.tilt, v0: { x: Vw.x, y: Vw.y }, moved: true, type: 'touch', shift: false }; return; }
        if (ptr.size) return;
        if (gst && gst.moved) { st.noclick = true; setTimeout(() => { st.noclick = false; }, 60); }
        gst = null; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      };
      svg.addEventListener('dragstart', ev => ev.preventDefault());
      svg.addEventListener('pointerdown', ev => {
        if (ev.pointerType === 'mouse' && ev.button !== 0) return; if (!full && (ev.pointerType !== 'mouse' || L.ph)) return;   /* on the page, only a mouse tilts; a finger scrolls the page */
        if (!ptr.size) { window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up); }
        ptr.set(ev.pointerId, pt(ev));
        if (ptr.size === 1) gst = { id: ev.pointerId, p0: pt(ev), t0: L.tilt, v0: { x: Vw.x, y: Vw.y }, moved: false, type: ev.pointerType, shift: ev.shiftKey };
        else if (ptr.size === 2) { const c = mid(); gst = { pinch: true, d0: c.d, k0: Vw.k, m0: c.m, v0: { x: Vw.x, y: Vw.y }, moved: true }; }
      });
      /* by keyboard: Shift + up or down tilts; in full screen + and − zoom, the arrows pan, 0 resets */
      wrap.addEventListener('keydown', ev => {
        if (!svg.contains(ev.target) || ev.ctrlKey || ev.metaKey || ev.altKey) return; const k = ev.key; let used = true;
        if (ev.shiftKey && (k === 'ArrowUp' || k === 'ArrowDown')) setTilt(L.tilt + (k === 'ArrowDown' ? .05 : -.05));
        else if (!full) used = false;
        else if (k === '+' || k === '=') zoomBy(1.5); else if (k === '-' || k === '_') zoomBy(1 / 1.5); else if (k === '0') resetView();
        else if (k === 'ArrowLeft') { Vw.x += 40; applyView(); } else if (k === 'ArrowRight') { Vw.x -= 40; applyView(); } else if (k === 'ArrowUp') { Vw.y += 40; applyView(); } else if (k === 'ArrowDown') { Vw.y -= 40; applyView(); }
        else used = false;
        if (used) ev.preventDefault();
      });
      if (fsb) fsb.addEventListener('click', () => openFull(mode, fsb, api));
      if (full) { keyShow(X.orrKey === undefined ? compact : X.orrKey);   /* a phone's first full screen opens the key once; after that it stays as the visitor left it */ if (!hyp) ringKey(keyP, true, hl, mode === 'rings'); marksKey(keyP, mode === 'rings' ? 'rng' : mode === 'story' ? 'orr' : mode, 0, compact); }
      /* the opening (spec §7): once per visit; Skip or Esc */
      function opening() {
        if (mode !== 'story' || X.orrOpened || full) return false; X.orrOpened = true;
        if (reduce()) { wrap.classList.add('fadein'); setTimeout(() => wrap.classList.remove('fadein'), 400); return false; }
        const caps = ['the core', 'tools, chips and finance', 'the assembly line', 'energy and minerals', 'role not collected'], cap = h('div', 'orr-cap'); cap.setAttribute('aria-hidden', 'true'); stage.append(cap);
        const skipb = h('button', 'orr-skip', 'Skip the opening'); skipb.type = 'button'; stage.append(skipb); wrap.classList.add('opening'); st.opening = true; const T = [];
        const ringsOn = n => { ringE.forEach((r, k) => r.classList.toggle('on', k < n)); bod.forEach(q => { const v = q.b.wring < n && (q.b.wring !== 0 || n > 0); q.g.classList.toggle('on', v); q.tx.classList.toggle('on', v); }); };
        const fin = () => { T.forEach(clearTimeout); wrap.classList.remove('opening'); wrap.classList.add('opened'); cap.remove(); skipb.remove(); ringsOn(9); ringE.forEach(r => r.classList.remove('on')); bod.forEach(q => { q.g.classList.remove('on'); q.tx.classList.remove('on'); }); st.opening = false; document.removeEventListener('keydown', esc); };
        const esc = ev => { if (ev.key === 'Escape') fin(); }; document.addEventListener('keydown', esc); skipb.addEventListener('click', fin);
        wrap.classList.add('s0'); ringsOn(0); sunU.style.opacity = 0;
        const at_ = (ms, f) => T.push(setTimeout(() => { if (st.opening && wrap.isConnected) f(); }, ms));
        at_(60, () => { sunU.style.opacity = ''; wrap.classList.add('s1'); });
        for (let k = 0; k < 5; k++) at_(700 + k * 900, () => { ringsOn(k + 1); cap.textContent = caps[k]; cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in'); });
        at_(700 + 5 * 900, () => { cap.classList.remove('in'); wrap.classList.add('s2'); });
        at_(700 + 5 * 900 + 1000, fin);
        return true;
      }
      /* an opening hides the names with the bodies; they come with them */
      render(o.year); st.lastInt = Math.round(o.year); applyView(); if (st.sel) pick(st.sel); else infoFor(null);
      if (canStep) { stepUI(); if (OZ.step && STEPS[OZ.step] && o.year >= maxY) setStep(OZ.step, true); else OZ.step = null; }
      document.fonts && document.fonts.ready && document.fonts.ready.then(() => { if (wrap.isConnected) { list.forEach(q => { q.tw = 0; }); placeLabels(); } });
      if (mode === 'story' && !full) { const dp = h('div', 'orr-foot'); deepb.append(h('b', '', 'For economists: the full statistics'), h('span', 'wipp', 'WIP'), h('small', '', 'The figures behind every year, the two orders side by side, and the method.')); deepb.classList.toggle('next', o.year >= 2025); dp.append(deepb); wrap.append(dp); }
      const api = { render, go, stop, opening, st, wrap, deep: deepb, slider, svg, list, L, fsb, hl, setStep, motion, pm, steps, arcs, syncMarks, setTilt, zoomBy, resetView, view: Vw, keyShow, refreshKey: () => { st.band = null; syncKey(); }, hint: hintEl, key: keyP, tb: tbar, W, H, compact };
      return api;
    }

    /* ---------- the key: what the marks, rings and bands are (on a phone the rings and bands are named here, not on the picture) ---------- */
    const RNAMES = ['The core', 'Tools, chips and finance', 'The assembly line', 'Energy and minerals', 'Role not collected'];
    /* OR7: the story's key by era, as the marks appear: before Pax Silica (2025), between Pax Silica and WAICO, from WAICO (2026) */
    const M0 = [['c', 'An economy: its size is its share of world GDP'], ['c nd', 'Dashed outline: no GDP figure for that year'], ['bk', 'A booking point (no mass)'], ['sl', 'Line into the US: what US firms’ affiliates earned there (BEA)']];
    const MARKS_ORR = [M0,
      [['c pax', 'Pax Silica signatory'], ['c usx', 'US system, outside Pax Silica'], ['c cnk', 'China’s system'], ['c sw', 'Between the two systems'], ['z', 'Extraction zone, in either system'], M0[1], M0[2], M0[3]],
      [['c pax', 'Pax Silica signatory'], ['c tw', 'Takes part without signing'], ['c usx', 'US system, outside Pax Silica'], ['c cnk', 'China’s system'], ['c both', 'On both lists: a US list and one of China’s'], ['c sw', 'On neither list'], ['z', 'Extraction zone, in either system'], M0[1], M0[2], M0[3]]];
    const MARKS = {
      rng: [['c rcr', 'Creditor: outer ring'], ['c rdb', 'Debtor: inner notch']],
      hyp: [['c rcr', 'Creditor: a body sized by its summed surplus'], ['c neg', 'Debtor: a dim hole']] };
    function ringKey(box, btn, hl, bands) {
      RNAMES.forEach((t, k) => { const s = h(btn ? 'button' : 'span', 'olg orr-kr'); if (btn) s.type = 'button'; s.dataset.ring = k;
        const sv = el('svg', { class: 'ri', width: 26, height: 14, viewBox: '0 0 26 14', 'aria-hidden': 'true', focusable: 'false' }), e = el('ellipse', { cx: 13, cy: 7, rx: 4 + k * 2.2, ry: 2 + k * .95 }); if (k === 4) e.setAttribute('stroke-dasharray', '2 2.5');
        sv.append(e); s.append(sv, t); box.append(s);
        if (btn && hl) { s.addEventListener('mouseenter', () => hl(k, true)); s.addEventListener('mouseleave', () => hl(k, false)); s.addEventListener('focus', () => hl(k, true)); s.addEventListener('blur', () => hl(k, false)); } });
      if (bands) ['On both lists', 'On neither list'].forEach((t, i) => { const s = h('span', 'olg orr-kr band'); s.dataset.band = String(i + 1); s.hidden = true; s.append(h('i', 'ln'), t); box.append(s); });   /* the lane's two sides, where the marks do not already say it */
    }
    const fillMarks = (m, mode, era, compact) => { m.textContent = ''; (mode === 'orr' ? MARKS_ORR[clamp(era || 0, 0, 2)] : (MARKS[mode] || [])).forEach(([c, t]) => { const s = h('span', 'olg'); s.append(h('i', c), t); m.append(s); });
      if (mode === 'orr' && compact && era >= 1) { const s = h('span', 'olg own'); s.append(h('i', 'arc'), 'China’s own institutions, the arcs from the inside out: ' + ARCS().map(a => a.n + ' ' + a.year).join(' · ')); m.append(s); } };
    const marksKey = (box, mode, era, compact) => { const m = h('span', 'orr-mk'); fillMarks(m, mode, era, compact); box.append(m); };

    /* ---------- full screen (spec: mobile round, 24 Nov 2026) ----------
       An overlay in the page's root, as the lines' full screen on a phone is: the Fullscreen API where it exists, a fixed overlay where it does not (iPhone Safari).
       It asks for landscape (screen.orientation.lock); when that is refused it says so in one line and lays the picture out for the window as it is. In it the
       landscape layout is used whenever the window is wider than tall. */
    let FS = null;
    const BAR = 60;   /* the year slider's height, in css as well */
    const handheld = () => { try { return matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 700; } catch (x) { return false; } };
    function fsBuild(snap) {
      const f = FS; if (!f) return; const old = f.o;
      if (old) { old.stop(); old.wrap.remove(); }
      const W = Math.round(f.body.clientWidth), H = Math.round(f.body.clientHeight) - BAR;
      const prevW = old ? old.W : W, yk = f.mode === 'hyp' ? 'hy' : 'y', v = snap ? snap.view : null;
      const o = Orrery(f.body, { mode: f.mode, year: OZ[yk], full: true, W, H, sel: snap ? snap.sel : null, view: v ? { k: v.k, x: v.x * W / prevW, y: v.y * W / prevW } : null, onClose: closeFull });
      f.o = o; f.W = W; f.H = H + BAR; loopSync(); f.ov.classList.toggle('portrait', W < H); f.ov.classList.toggle('compact', o.compact);
      const hint = o.hint; if (hint) { const need = W < H && handheld(); hint.hidden = !need; if (need) hint.textContent = 'Turn your phone sideways to see the whole picture.'; }
      o.refreshKey();
    }
    function openFull(mode, from, inl) {
      if (FS || !need()) return; const root = X.root; if (!root) return;
      if (inl && inl.stop) inl.stop();
      const ov = h('div', 'orr-fs'); ov.id = 'isx-orr-fs'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'The orrery, full screen');
      const body = h('div', 'orr-fs-body'); ov.append(body); root.appendChild(ov);
      FS = { ov, body, mode, from, inl, o: null, own: false, t: 0 };
      document.documentElement.classList.add('isx-pzlock'); const wr = root.querySelector(':scope > .wrap'); if (wr) wr.inert = true;
      /* the page's own full screen may already hold the root: then ours stays an overlay inside it */
      const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement || null;
      FS.had = !!fsEl();
      fsBuild(null);
      FS.kd = ev => { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); closeFull(); } };
      FS.rs = () => { clearTimeout(FS && FS.t); if (!FS) return; FS.t = setTimeout(() => { if (!FS) return; const W = FS.body.clientWidth, H = FS.body.clientHeight; if (Math.abs(W - FS.W) > 2 || Math.abs(H - FS.H) > 2) { const o = FS.o; fsBuild({ sel: o.st.sel, view: { k: o.view.k, x: o.view.x, y: o.view.y } }); } }, 120); };
      FS.fc = () => { if (!FS) return; if (fsEl() === ov) FS.own = true; else if (FS.own) closeFull(); else FS.rs(); };
      document.addEventListener('keydown', FS.kd, true); window.addEventListener('resize', FS.rs); window.addEventListener('orientationchange', FS.rs); document.addEventListener('fullscreenchange', FS.fc); document.addEventListener('webkitfullscreenchange', FS.fc);
      const focus = () => { const b = FS && FS.o && FS.o.tb && FS.o.tb.querySelector('.x'); if (b) b.focus({ preventScroll: true }); }; focus();
      const lock = () => { if (!handheld() || !FS) return; try { const r = screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'); if (r && r.catch) r.catch(() => { }); } catch (x) { } };
      const rq = ov.requestFullscreen || ov.webkitRequestFullscreen;
      if (rq && !FS.had) { try { const r = rq.call(ov); if (r && r.then) r.then(lock, lock); else lock(); } catch (x) { lock(); } } else lock();
    }
    function closeFull() {
      if (!FS) return; const f = FS; FS = null; clearTimeout(f.t);
      document.removeEventListener('keydown', f.kd, true); window.removeEventListener('resize', f.rs); window.removeEventListener('orientationchange', f.rs); document.removeEventListener('fullscreenchange', f.fc); document.removeEventListener('webkitfullscreenchange', f.fc);
      if (f.o) f.o.stop();
      try { const el_ = document.fullscreenElement || document.webkitFullscreenElement; if (el_ === f.ov) { const r = (document.exitFullscreen || document.webkitExitFullscreen).call(document); if (r && r.catch) r.catch(() => { }); } } catch (x) { }
      try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (x) { }
      if (f.ov.parentNode) f.ov.parentNode.removeChild(f.ov);
      document.documentElement.classList.remove('isx-pzlock'); const wr = X.root && X.root.querySelector(':scope > .wrap'); if (wr) wr.inert = false; loopSync();
      const yk = f.mode === 'hyp' ? 'hy' : 'y', i = cur && cur.wrap && cur.wrap.isConnected ? cur : f.inl; if (i && i.wrap && i.wrap.isConnected) { i.render(OZ[yk]); i.st.lastInt = Math.round(OZ[yk]); }
      const b = f.from; if (b && b.isConnected) b.focus({ preventScroll: true });
    }
    X.on && X.on('view', v => { if (v !== 'profit') closeFull(); });

    /* ---------- motion at rest (OR7): pulses along the flow lines (css) and the slow turn of China's system (one rAF), after the split only.
       One loop in the registry: it stops when the tab or the page is hidden, off screen, paused by the visitor, or under reduced motion. ---------- */
    const PF = window.ISXP; let mraf = 0, mlast = 0, mtick = 0;
    const insts = () => [cur, FS && FS.o].filter(o => o && o.wrap && o.wrap.isConnected && o.motion);
    const mwant = () => X.view === 'profit' && !X.orrPaused && !reduce() && insts().some(o => o.motion.wants());
    function mframe(now) { mraf = 0; const I = insts().filter(o => o.motion.wants()); if (!I.length || X.orrPaused || document.hidden) { mstop(); return; } const dt = mlast ? Math.min(.1, (now - mlast) / 1000) : 0; mlast = now; mtick++; I.forEach(o => o.motion.step(dt, mtick)); mraf = requestAnimationFrame(mframe); }
    function mstart() { insts().forEach(o => o.wrap.classList.toggle('run', o.motion.wants())); if (!mraf) { mlast = 0; mraf = requestAnimationFrame(mframe); } }
    function mstop() { if (mraf) cancelAnimationFrame(mraf); mraf = 0; [cur, FS && FS.o].forEach(o => { if (o && o.wrap) o.wrap.classList.remove('run'); }); }
    function loopSync() { if (PF && PF.sync) PF.sync(); else if (mwant()) mstart(); else mstop(); }
    if (PF && PF.loop) PF.loop({ name: 'orrery', el: K.host, want: mwant, start: mstart, stop: mstop });
    X.on && X.on('view', () => loopSync()); X.on && X.on('motion', () => loopSync());
    /* ---------- the views ---------- */
    const back = () => { const b = h('button', 'pf-chip orr-back', '← Back to the story, ' + OZ.y); b.type = 'button'; b.dataset.pv = 'orr'; K.R.chips.append(b, h('span', 'gap')); };
    const DEEP = ['fig', 'rng', 'pft', 'hyp'];
    let cur = null;
    const mount = mode => { const fig = R.fig; fig.classList.add('orr-fig'); const o = Orrery(fig, { mode, year: mode === 'hyp' ? OZ.hy : OZ.y }); cur = o; loopSync(); return o; };
    const WIPN = 'WIP';
    V.orr = {
      title: () => OZ.step && STEPS[OZ.step] && K.vw() === 'orr' ? STEPS[OZ.step].title : cur && cur.L && cur.L.e >= .9 ? 'Two systems, and a curtain between them' : 'One system around the United States', unit: 'Size: share of world GDP · Position: tier and role · Schematic', tall: true,
      draw() {
        if (!need()) return; const o = mount('story'); K.reading('', '');
        if (OZ.y >= 2025) o.deep.classList.add('next');
        const first = !X.orrOpened && OZ.y === 1995; if (first) o.opening();
        o.render(OZ.y); R.title.textContent = V.orr.title();
        R.lg.textContent = ''; marksKey(R.lg, 'orr', o.st.era, o.compact); R.lg.append(h('span', 'olg none', 'Streams into China: not collected'));
        if (o.compact) { ringKey(R.lg, false, null, false); o.refreshKey(); }   /* on a phone the rings and bands are named here, not on the picture */
        const oo = o.render; o.render = v => { oo(v); R.title.textContent = V.orr.title(); };
      },
      table: () => { if (!OD) return { cap: 'The orrery is loading.', head: ['Body'], rows: [['…']] }; const yr = OZ.y, ids = Object.keys(OD.bodies);
        if (OZ.step === 'pp' && K.vw() === 'orr') { const D = OD.steps.pp; return { cap: 'Step 1 of 2 after the story. US firms’ share of the profits of the world’s 2,000 largest listed firms (' + D.usSrc + ') and China’s share of world manufacturing value added (' + D.cnSrc + '). An empty cell is a year without a value.', head: ['Year', 'US share of profits, % (Forbes list of that year)', 'China’s share of world manufacturing value added, %'], rows: D.years.map((y, i) => [y, D.us[i], D.cn[i]]) }; }
        if (OZ.step === 'cl' && K.vw() === 'orr') { const C = OD.steps.cl, nm = iso => nameOf(OB.B.find(x => OD.bodies[x.id] && OD.bodies[x.id].iso === iso)); return { cap: 'Step 2 of 2 after the story. Current accounts in ' + C.year + ', $bn (' + C.src + '). No pair of countries settles alone: surpluses meet deficits in one pool. The lines for goods and dollars between the poles are illustrative and carry no figure.', head: ['Line on the picture', 'Current account, ' + C.year + ', $bn'], rows: C.into.map(x => [nm(x[0]) + ': surplus, into multilateral clearing', x[1]]).concat([['United States: deficit, financed from multilateral clearing', C.us], ['Goods, from China to the United States (illustrative)', 'no figure'], ['Dollars, from the United States to China (illustrative)', 'no figure']]) }; }
        return { cap: 'The orrery at ' + yr + ': share of world GDP (IMF WEO Oct 2026), current account summed since 1995 and as a share of that year’s GDP, income of US affiliates there (BEA). Source and vintage: see “The figures by year”.', head: ['Economy', 'Share of world GDP, %', 'Current account summed, $bn', '% of GDP', 'US affiliates’ income, $m'],
          rows: ids.map(id => { const d = OD.bodies[id], b = OB.B.find(x => x.id === id), i = yi(yr); return [nameOf(b), d.share ? d.share[i] : null, d.sum ? d.sum[i] : null, d.sumpct ? d.sumpct[i] : null, d.inc ? d.inc[i] : null]; }) }; } };
    V.rng = { title: 'Creditors and debtors: the current account summed since 1995', unit: 'Outer ring: creditor · Inner notch: debtor · Thickness ∝ √|sum|', tall: true, chips: back,
      draw() { if (!need()) return; const o = mount('rings'); o.render(OZ.y); K.reading('', 'Germany and Japan built claims inside the US system; the United States and the United Kingdom are the debtors. A stock built from flows: valuation and price effects are not corrected (IMF WP/99/115).');
        R.lg.textContent = ''; marksKey(R.lg, 'rng'); if (o.compact) { ringKey(R.lg, false, null, true); o.refreshKey(); } }, table: V.orr.table };
    V.fig = { title: () => 'The figures behind the orrery, ' + OZ.y, unit: 'IMF WEO Oct 2026 · BEA · preliminary', chips() { back(); const yrs = [1995, 2000, 2005, 2010, 2015, 2019, 2022, 2024, 2025, 2026]; yrs.forEach(y => { const b = h('button', 'pf-chip', String(y)); b.type = 'button'; b.dataset.oy = y; b.setAttribute('aria-pressed', String(OZ.y === y)); R.chips.append(b); }); },
      draw() { if (!need()) return; const T = V.orr.table(); K.reading('', ''); K.table(T);
        const m = h('div', 'orr-method'); m.setAttribute('role', 'group'); m.setAttribute('aria-label', 'The method note and the caveats of every series: sources, the stock over a flow, the 2006 break in the BEA income, and the dispute over China’s surplus'); m.append(h('span', 'wipp', 'WIP'), h('p', 'wn', 'Preliminary: the series are being checked; the 2026 values are IMF estimates.'));
        ['Sources. GDP and current accounts: IMF World Economic Outlook, October 2026 (13 Oct 2026), the database file; shares are the economy’s GDP over the IMF’s world GDP. The World Bank’s GDP differs by up to 2.5% for the six largest economies; OR2’s comparison is in the work repository. Cuba and New Caledonia have no IMF row.',
          'A stock over a flow. The current account summed from 1995, divided by one year’s GDP, adds current-dollar flows over many years: valuation and price effects are not corrected (IMF WP/99/115). China’s sum starts in 1997 (no value for 1995–96). The world’s current accounts do not sum to zero (the IMF’s discrepancy).',
          'Income of US affiliates (BEA, direct investment income without current-cost adjustment, outward, by host country). Net of withholding taxes before 2006 and gross from 2006: one break, not adjusted. Before 2009 BEA publishes 44 countries only. Income attributed to a host country is not where it was earned: the Dutch and Irish special-purpose entities, for one.',
          'China’s side. No official source publishes Chinese outward-FDI income by host country, so its streams say “not collected”. The size of China’s surplus is disputed: the Fed’s FEDS Notes (22 Sep 2026) put the 2025 understatement at about 0.6 point of GDP, Setser (CFR) at about $1tn, and VoxChina argues the gap is explained by adjustments. No figure on the page is changed for it.',
          'The order’s institutions (25 Nov 2026). Every date on the frame, on the timeline’s teal marks and on China’s arcs was read from the institution’s own site or an official statement on 25 Nov 2026; the sources are named in the card of each. CIPS is the exception: the People’s Bank’s own notice was not read, the date comes from two reports of the day. China is an original member of the IMF (27 Dec 1945); 1980 is the year the People’s Republic took the seat. ' + OD.order.membersNote + ' The dates in a body’s card are the lists’ own: the first members of the New Development Bank and of the AIIB are dated 3 Jul 2015 and 25 Dec 2015, while the timeline and the arcs carry the year the NDB’s agreement was signed (2014) and the year the AIIB began operations (2016). WAICO memberships come from the orbit view’s file (read 17 Nov 2026), China’s own signature re-read on 25 Nov. Marks from Pax Silica show from ' + OD.order.lists.paxDate + ' and marks that depend on WAICO from ' + OD.order.lists.waicoDate + ': before 2025 a body shows its tier and its system only.',
          'Groups and the EU get no mass: their members are drawn on their own. Ireland, Luxembourg, Bermuda, the UK’s Caribbean islands and Switzerland are booking points: they appear through BEA income, not GDP.'].forEach(t => m.append(h('p', '', t))); R.fig.append(m); },
      table: V.orr.table };
    V.pft = { title: 'Where US firms’ foreign affiliates book their profit, 2024', unit: 'Profit booked by US firms’ foreign affiliates, 2024 · BEA · preliminary', chips: back,
      draw() { if (!need()) return; const P = OD.profit2024, seven = P.filter(p => !/World/.test(p.line)), wd = P.find(p => /World/.test(p.line)), sumNi = seven.reduce((s, p) => s + p.ni, 0), sumSa = seven.reduce((s, p) => s + p.sales, 0);
        K.tiles([{ v: f1(sumNi / wd.ni * 100) + '%', k: 'of the world’s net income of US affiliates is booked in seven places', c: '#D9A441', big: 1 }, { v: f1(sumSa / wd.sales * 100) + '%', k: 'of their sales are made there' }], 1);
        const W = R.fig.clientWidth, ph = phone(), fh = h('div', 'orr-pft'); fh.setAttribute('role', 'img'); fh.setAttribute('aria-label', 'Bars: for each of seven jurisdictions and for all other countries, the share of the world’s net income of US affiliates and the share of their sales, 2024. ' + seven.map(p => p.line + ': ' + p.shNi + '% of net income, ' + p.shSales + '% of sales').join('; ') + '.');
        const rows = seven.map(p => [p.line.replace('United Kingdom Islands, Caribbean', 'UK Caribbean'), p.shNi, p.shSales, p.margin]).concat([['All other countries', +(100 - sumNi / wd.ni * 100).toFixed(1), +(100 - sumSa / wd.sales * 100).toFixed(1), null]]);
        rows.forEach(r => { const row = h('div', 'pr'), nm = h('span', 'n', r[0]), b1 = h('div', 'bar a'), b2 = h('div', 'bar b'); b1.style.width = Math.max(.4, r[1]) + '%'; b2.style.width = Math.max(.4, r[2]) + '%'; b1.append(h('i', '', r[1] + '% of net income')); b2.append(h('i', '', r[2] + '% of sales')); const bars = h('div', 'bars'); bars.append(b1, b2); row.append(nm, bars); fh.append(row); });
        R.fig.append(fh); R.fig.append(h('p', 'orr-cav', 'Booked in the affiliate’s country, not necessarily earned there; BEA does not say which part is pass-through. Net income of majority-owned foreign affiliates of US multinationals, preliminary (BEA, 20 Nov 2026).'));
        const w = h('span', 'wipp', 'WIP'); R.fig.append(w);
        K.legend([['#D9A441', 'Share of net income', 1], ['#7d8d9b', 'Share of sales', 1]]); },
      table: () => OD ? { cap: 'Net income and sales of majority-owned foreign affiliates of US multinationals in seven jurisdictions, 2024 (BEA, Activities of U.S. Multinational Enterprises, 20 Nov 2026; preliminary). Eleven further candidates were read in the data round (net income $66.4bn, 4.7% of the world’s) and are kept out of the headline: a judgement, not BEA’s.', head: ['Place', 'Sales, $m', 'Net income, $m', 'Margin, %', 'Share of world net income, %', 'Share of world sales, %'], rows: OD.profit2024.map(p => [p.line, p.sales, p.ni, p.margin, p.shNi, p.shSales]) } : { cap: 'Loading.', head: ['Place'], rows: [['…']] } };
    V.hyp = { title: 'If surpluses were gravity', unit: 'Size: current account summed since 1995, % of that year’s GDP · IMF WEO Oct 2026', tall: true, chips() { back(); const w = h('span', 'wipp', 'WIP'); R.chips.append(w); },
      draw() { if (!need()) return; const o = mount('hyp'); o.render(OZ.hy); const U = OD.bodies[BYISO().DEU], CN = OD.bodies[BYISO().CHN], g = U.sumpct[30], c = CN.sumpct[30], nl = OD.bodies[BYISO().NLD].sumpct[30];
        const box = h('div', 'orr-hyp'); box.append(h('p', 'orr-line', 'Germany’s surplus since 1995 adds up to more than a year of its own output (' + f1(g) + '% of GDP, 2025). China’s, to less than a third (' + f1(c) + '%).'));
        box.append(h('p', 'orr-aside', 'The Netherlands declines to comment. (' + f1(nl) + '% of GDP, 2025; part real, part special-purpose entities: see the method note.)'));
        const q = OD.hypocrisy.quotes; const qb = h('div', 'orr-q'); qb.append(h('span', 'wipp', 'WIP'));
        if (!q.length) qb.append(h('p', '', 'Quotes pending (OR1c)')); else q.forEach(x => { const f = h('figure'); f.append(h('blockquote', '', '“' + x.text + '”')); if (x.orig) { const o = h('p', 'orr-qo', '“' + x.orig + '”'); o.lang = x.lang || 'de'; f.append(o); } const c = h('figcaption', '', x.who + ', ' + x.role + ', ' + x.date + '. ' + x.src + (x.orig ? ' (translation ours)' : '') + '. '); if (x.url) { const a = h('a', '', 'Source'); a.href = x.url; a.target = '_blank'; a.rel = 'noopener'; c.append(a); } f.append(c); qb.append(f); });
        box.append(qb, h('p', 'orr-nt', 'The target is the people who made and defend the policy, not Germans. The United States and the United Kingdom are the dim holes (' + f1(OD.bodies[BYISO().USA].sumpct[30]) + '%, ' + f1(OD.bodies[BYISO().GBR].sumpct[30]) + '%). A stock over a flow; the Dutch and Swiss figures are inflated by special-purpose entities and merchanting (OR1a).')); R.fig.append(box);
        R.lg.textContent = ''; marksKey(R.lg, 'hyp'); },
      table: V.orr.table };
    /* the deep layer's old views keep their chips; each gets a way back to the story */
    ['orb', 'ord', 'pos'].forEach(id => { const v = V[id]; if (!v || v.__b) return; const c0 = v.chips; v.__b = 1; v.chips = function () { back(); if (c0) c0.call(this); }; });
    /* the year chips of the figures view */
    K.host.addEventListener('click', ev => { const b = ev.target.closest('[data-oy]'); if (!b) return; OZ.y = +b.dataset.oy; K.board(true); K.emit('year'); });
    return { stop: () => cur && cur.stop(), get cur() { return cur; }, tension: yf => OD ? tension(yf) : 0, ready: () => !!OD };
  };
})();
