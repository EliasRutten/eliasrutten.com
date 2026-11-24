/* The Imperial Stack v2 · orrery.js (orrery OB1 and OB2, 23–24 Nov 2026; spec claude/specs/orrery-opener-spec-21-nov.md)
   The order as the profit tab's first view: one still picture of the world economy, 1995–2026, that a slider moves.
   · Story layer (view “orr”): the orrery, the slider with eleven events, the counters, one narration card, the streams (BEA direct-investment
     income by host country), the tear (tension e, spec §5) that pulls China out as a second sun, the ripple, the opening, the play button.
   · Deep layer (the views behind “For economists: the full statistics”): the orbit view as it was, the figures by year with the method note,
     the creditor/debtor rings, where profits are booked (BEA 2024, preliminary) and “German Hypocrisy”.
   The picture is a pure function of the (fractional) year: render(yf). Mass (share of world GDP) drives the size of a body; the summed
   current account only appears as counters and rings (spec §4.2), except in “German Hypocrisy”, where it is gravity on purpose.
   Data: data/orrery.json (tools/orrery-data.py from OR2) and data/orbit.json (placements). profit.js calls ISX.orrery(kit) once. */
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

    /* ---------- the geometry ---------- */
    function layout(W, H, ph) {
      const rk = [.07, .13, .19, .25, .31].map(v => v * W), tilt = ph ? .9 : .4;
      const L = { W, H, ph, cx: W / 2, cy: H / 2, rx: rk, ry: rk.map(v => v * tilt), v: ph ? [0, 1] : [1, 0], f: ph ? H * .12 : W * .095 };
      L.s = ph ? .7 : .8; L.U = ph ? [W / 2, H * .27] : [W * .27, H / 2]; L.Cn = ph ? [W / 2, H * .74] : [W * .73, H / 2];
      L.band = { both: ph ? [H * .505, W * .12, W * .88] : [H * .1, W * .34, W * .66], swing: ph ? [H * .965, W * .1, W * .9] : [H * .92, W * .12, W * .88] };
      return L;
    }
    const polar = (ring, sec, k, n) => { const a = (sec * 60 + 8 + (n > 1 ? k * (44 / (n - 1)) : 22)) * Math.PI / 180 - Math.PI / 2; return [Math.cos(a), Math.sin(a)]; };
    function prepBodies() {
      const bi = BYISO(), list = [], grp = {};
      OB.B.forEach(b => {
        const id = b.id, d = OD.bodies[id]; if (!d && b.sys !== 'core') return; if (b.k === 'g' && !d) return;
        const o = { id, b, d: d || null, iso: d ? d.iso : null, name: nameOf(b), core: b.sys === 'core', china: b.full === 'China' };
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
      else if (sys === 'us' || sys === 'cn') { const c = sys === 'us' ? L.U : L.Cn, t = polar(b.ring, b.sec, o.si, o.sn); ps = [c[0] + t[0] * L.rx[b.ring] * L.s, c[1] + t[1] * L.ry[b.ring] * L.s * (L.ph ? 1 : 1.25)]; }
      else if (sys === 'both' || sys === 'swing') { const B = L.band[sys], rows = sys === 'swing' && !L.ph ? 2 : 1, col = Math.ceil(o.bn / rows), r = o.bi % rows, c = Math.floor(o.bi / rows); ps = [lerp(B[1], B[2], col > 1 ? c / (col - 1) : .5), B[0] + (rows > 1 ? (r ? 22 : -4) : 0) + (L.ph && sys === 'swing' ? (o.bi % 2) * 20 - 22 : 0)]; }
      else { ps = [L.cx + ((o.bi % 5) - 2) * L.W * .06, L.cy + (L.ph ? -40 : -L.H * .27) + Math.floor(o.bi / 5) * 20]; }
      return [lerp(pw[0], ps[0], u), lerp(pw[1], ps[1], u)];
    }

    /* ---------- the picture ---------- */
    const WARM = '#E9C77F', COOL = '#8FD3CF', GREY = '#7d8d9b', GOLD = '#D9A441';
    function Orrery(host, o) {   /* o: { mode: 'story' | 'rings' | 'hyp', year } */
      const ph = phone(), W = Math.max(300, host.clientWidth || 800), H = ph ? 600 : clamp(Math.round(W * .38), 330, 480), L = layout(W, H, ph), list = prepBodies();
      const mode = o.mode, hyp = mode === 'hyp', maxY = hyp ? 2025 : 2026;
      const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'orr-svg', role: 'group', 'aria-label': hyp ? 'The orrery with gravity switched to the current account summed since 1995, as a share of that year’s GDP. Germany becomes a sun.' : 'The world economy as an orrery, 1995 to 2026: the United States at the centre of one system, China pulled out as a second centre; size is the share of world GDP.' });
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      const defs = el('defs'); [['u', '#FFF4DA', '#F3D28C'], ['c', '#E9FFFD', '#8FD3CF']].forEach(([id, a, b]) => { const g = el('radialGradient', { id: 'orr-g' + id + o.mode }); g.append(el('stop', { offset: '0', 'stop-color': a, 'stop-opacity': 1 }), el('stop', { offset: '.35', 'stop-color': b, 'stop-opacity': .55 }), el('stop', { offset: '1', 'stop-color': b, 'stop-opacity': 0 })); defs.append(g); });
      svg.append(defs);
      const gStars = el('g', { class: 'orr-stars' }); let sd = 7; const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
      for (let i = 0; i < 140; i++) gStars.append(el('circle', { cx: (rnd() * W).toFixed(1), cy: (rnd() * H).toFixed(1), r: (.4 + rnd() * .8).toFixed(2), opacity: (.08 + rnd() * .27).toFixed(2) }));
      const gLane = el('g', { class: 'orr-lane' }), lane = ph ? el('rect', { x: 0, y: H * .5 - 12, width: W, height: 24 }) : el('rect', { x: W / 2 - 12, y: 8, width: 24, height: H - 16 });
      gLane.append(lane, ph ? el('line', { x1: 8, x2: W - 8, y1: H * .5, y2: H * .5, class: 'dot' }) : el('line', { x1: W / 2, x2: W / 2, y1: 8, y2: H - 8, class: 'dot' }));
      const laneT = [['on both lists', ph ? [W / 2, H * .5 - 18] : [W / 2, 22]], ['on neither list', ph ? [W / 2, H - 6] : [W / 2, H - 6]]].map(([t, p]) => el('text', { x: p[0], y: p[1], 'text-anchor': 'middle', class: 'orr-lt' }, t.toUpperCase()));
      gLane.append(...laneT);
      const gRings = el('g', { class: 'orr-rings' }), RN = ['THE CORE', 'TOOLS, CHIPS AND FINANCE', 'THE ASSEMBLY LINE', 'ENERGY AND MINERALS', 'ROLE NOT COLLECTED'];
      const ringE = [], pairU = [], pairC = [], ringT = [];
      for (let k = 0; k < 5; k++) { const a = el('ellipse', { class: 'rg' }), b = el('ellipse', { class: 'rg pu' }), c = el('ellipse', { class: 'rg pc' }); [a, b, c].forEach(n => { if (k === 4) n.setAttribute('stroke-dasharray', '3 5'); }); ringE.push(a); pairU.push(b); pairC.push(c); gRings.append(a, b, c); const t = el('text', { class: 'orr-rl', 'text-anchor': 'start' }, RN[k]); ringT.push(t); if (!ph) gRings.append(t); }
      const gStream = el('g', { class: 'orr-streams' }), gSun = el('g', { class: 'orr-suns' }), gB = el('g', { class: 'orr-bodies' }), gR = el('g', { class: 'orr-ripple' });
      const sunU = el('g', { class: 'orr-sun u' }), sunC = el('g', { class: 'orr-sun c' });
      [[sunU, 'u'], [sunC, 'c']].forEach(([g, k]) => { g.append(el('circle', { class: 'gl', fill: `url(#orr-g${k}${o.mode})` }), el('circle', { class: 'co', fill: k === 'u' ? '#FFF4DA' : '#E9FFFD' })); gSun.append(g); });
      const ripple = el('ellipse', { class: 'rip', opacity: 0 }); gR.append(ripple);
      const bod = list.map(q => {
        const g = el('g', { class: 'ob', 'data-b': q.id, 'data-r': q.b.wring, role: 'button', tabindex: 0, 'aria-label': q.name }), c = el('circle', { class: 'c', r: 4 }), c2 = el('circle', { class: 'c2', r: 4 }), rg = el('circle', { class: 'cr', r: 5, fill: 'none' }), dm = el('rect', { class: 'dm', width: 9, height: 9, x: -4.5, y: -4.5, transform: 'rotate(45)' });
        const vt = q.core ? (q.china ? 'China' : 'US') : q.b.n, hit = el('circle', { r: 12, fill: 'transparent' }), tx = el('text', { class: 'ol', y: 4 }, vt); if (q.name !== vt && q.name.indexOf(vt) !== 0) g.setAttribute('aria-label', vt + ', ' + q.name);
        g.append(rg, c, c2, dm, hit, tx); gB.append(g); q.g = g; q.c = c; q.rg = rg; q.dm = dm; q.tx = tx; q.c2 = c2; return q;
      });
      const sPaths = list.filter(q => q.d && q.d.inc).map(q => { const p = el('path', { class: 'st', fill: 'none', pathLength: 1 }); gStream.append(p); q.st = p; return q; });
      svg.append(gStars, gLane, gRings, gStream, gSun, gB, gR);
      const wrap = h('div', 'orr' + (hyp ? ' hyp' : '') + (mode === 'rings' ? ' rng' : '')); wrap.dataset.mode = mode;
      const top = h('div', 'orr-top'), counters = h('div', 'orr-ct'); counters.setAttribute('aria-hidden', 'true');
      const cy = h('div', 'orr-yr'), c1 = h('div', 'orr-c'), c2 = h('div', 'orr-c'), c3 = h('div', 'orr-c');
      counters.append(cy, c1, c2, c3);
      const info = h('aside', 'orr-info'); info.setAttribute('aria-live', 'polite'); info.tabIndex = 0;
      const stage = h('div', 'orr-stage'); stage.append(svg, counters);
      const slider = h('div', 'orr-sl'), play = h('button', 'orr-play', '▶ Play'); play.type = 'button'; play.setAttribute('aria-pressed', 'false'); play.setAttribute('aria-label', 'Play the years, 1995 to 2026');
      const track = h('div', 'orr-tr'), inp = h('input'); inp.type = 'range'; inp.min = 1995; inp.max = maxY; inp.step = .05; inp.value = o.year; inp.setAttribute('aria-label', 'Year');
      const dots = h('div', 'orr-ev'); if (!hyp) EVS().forEach(e => { const d = h('button', 'orr-evd'); d.type = 'button'; d.style.left = ((e.year - 1995) / (maxY - 1995) * 100) + '%'; d.dataset.y = e.year; d.setAttribute('aria-label', e.year + ': ' + e.label); d.append(h('i', '', String(e.year))); dots.append(d); });
      track.append(dots, inp); slider.append(play, track);
      const narr = h('div', 'orr-card'), deepb = h('button', 'orr-deep'); deepb.type = 'button'; deepb.dataset.pv = hyp ? 'orr' : 'orb';
      wrap.append(stage, slider); if (!hyp && mode === 'story') wrap.append(narr);
      wrap.append(info);
      host.append(wrap);
      const st = { yf: o.year, e: 0, sel: null, raf: 0, playing: false, drag: false, lastInt: Math.round(o.year), opening: false };
      /* mass */
      const share = (q, yf) => q.d ? at(q.d.share, yf) : null, kS = 28 / Math.sqrt(26) * (W / 1380) * (ph ? 1.25 : 1), kH = 28 / Math.sqrt(103) * (W / 1380) * (ph ? 1.25 : 1);
      function render(yf) {
        st.yf = yf; const e = hyp ? 0 : tension(yf), u = ease((e - .85) / .15), f = L.f * clamp(e / .85, 0, 1), vx = L.v[0], vy = L.v[1];
        L.e = e; const Uc = u > 0 ? [lerp(L.cx - vx * f, L.U[0], u), lerp(L.cy - vy * f, L.U[1], u)] : [L.cx - vx * f, L.cy - vy * f], Cc = u > 0 ? [lerp(L.cx + vx * f, L.Cn[0], u), lerp(L.cy + vy * f, L.Cn[1], u)] : [L.cx + vx * f, L.cy + vy * f];
        for (let k = 0; k < 5; k++) {
          const ax = L.rx[k] + f * Math.abs(vx), ay = L.ry[k] + f * Math.abs(vy), sx = L.rx[k] * L.s, sy = L.ry[k] * L.s * (ph ? 1 : 1.25);
          ringE[k].setAttribute('cx', L.cx); ringE[k].setAttribute('cy', L.cy); ringE[k].setAttribute('rx', ax); ringE[k].setAttribute('ry', ay); ringE[k].style.opacity = u > 0 ? 1 - u : 1;
          const pr = L.rx[k] * (1 - .2 * u) , pry = L.ry[k] * (1 - .2 * u) * (ph ? 1 : 1), ax2 = lerp(L.rx[k], sx, u), ay2 = lerp(L.ry[k] , sy, u);
          [[pairU[k], Uc], [pairC[k], Cc]].forEach(([n, c]) => { n.setAttribute('cx', c[0]); n.setAttribute('cy', c[1]); n.setAttribute('rx', ax2); n.setAttribute('ry', ay2); n.style.opacity = u; });
          if (!ph) { ringT[k].setAttribute('x', Uc[0] - L.rx[k] * .72 * (u > 0 ? L.s : 1)); ringT[k].setAttribute('y', Uc[1] + L.ry[k] * 1.02 + 10); ringT[k].style.opacity = hyp ? 0 : 1; }
        }
        gLane.style.opacity = hyp ? 0 : ease((e - .88) / .12); laneT.forEach(t => { t.style.opacity = ease((e - .93) / .07); });
        const sU = hyp ? (share({ d: OD.bodies[BYISO().USA] }, yf) || 24) : (at(OD.bodies[BYISO().USA].share, yf) || 24), sC = hyp ? 0 : (at(OD.bodies[BYISO().CHN].share, yf) || 2);
        const rU = hyp ? 11 : kS * Math.sqrt(sU), rC = kS * Math.sqrt(sC);
        placeSun(sunU, Uc, rU * 2.6, rU); placeSun(sunC, Cc, rC * 2.6, rC); sunC.style.opacity = hyp ? 0 : clamp(e * 3 + (yf >= 2001 ? .35 : 0), 0, 1);
        let usP = Uc;
        list.forEach(q => {
          const p = place(q, L, yf, e), sh = hyp ? null : share(q, yf), sp = hyp && q.d ? at(q.d.sumpct, yf) : null;
          q.p = p; q.g.setAttribute('transform', `translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})`);
          let r = 3.2, mark = 'norm';
          if (q.core) { r = q.china ? rC : rU; if (hyp) r = 11; } else if (q.bk) { r = 4.4; mark = 'bk'; } else if (hyp) { if (sp == null) { mark = 'nodata'; } else { r = Math.max(3.2, kH * Math.sqrt(Math.abs(sp))); if (sp < 0) mark = 'neg'; } } else if (sh == null) mark = 'nodata'; else r = Math.max(3.2, kS * Math.sqrt(sh));
          if (hyp && q.core) mark = 'core'; if (!hyp && q.core) mark = 'core';
          q.r = r; q.mark = mark; [q.c, q.c2].forEach(n => n.setAttribute('r', r.toFixed(2)));
          q.tx.setAttribute('x', (r + 5).toFixed(1)); q.tx.setAttribute('text-anchor', 'start');
          q.g.dataset.m = mark; q.g.dataset.s = q.core ? (q.china ? 'cn' : 'core') : u > .9 ? (q.b.sys === 'cn' ? 'cn' : q.b.sys === 'both' ? 'both' : q.b.sys === 'swing' || q.b.sys === 'open' ? 'sw' : q.b.mem && q.b.mem.p ? 'pax' : q.b.mem && q.b.mem.t ? 'tw' : 'usx') : 'us';
          q.g.dataset.z = u > .9 && q.b.zone && q.b.sys !== 'core' ? '1' : '';
          if (q.b.k === 'g') q.g.dataset.m = 'grp';
          /* creditor / debtor rings (deep layer) */
          if (mode === 'rings' && q.d && q.d.sum) { const v = at(q.d.sum, yf); if (v != null) { const t = clamp(.5 + Math.sqrt(Math.abs(v)) * .06, .6, 7); q.rg.setAttribute('r', (v > 0 ? r + 2 + t / 2 : Math.max(1.2, r - t / 2)).toFixed(2)); q.rg.setAttribute('stroke-width', t.toFixed(2)); q.rg.dataset.k = v > 0 ? 'cr' : 'db'; } else q.rg.dataset.k = ''; } else q.rg.dataset.k = '';
          q.vis = !(q.b.k === 'g' && !q.d);
        });
        /* the streams: BEA income by host country, drawn inward to the US sun */
        sPaths.forEach(q => { const v = at(q.d.inc, yf), p = q.p; if (!v || v <= 0 || (q.b.sys === 'cn' && u > .5) || q.core) { q.st.style.opacity = 0; return; } const w = clamp(.5 + Math.sqrt(v / 1000) * .38, .5, 6), mx = (p[0] + usP[0]) / 2, my = (p[1] + usP[1]) / 2 + (L.ph ? 0 : 10);
          q.st.setAttribute('d', `M${p[0].toFixed(1)} ${p[1].toFixed(1)}Q${mx.toFixed(1)} ${(my + (p[1] < usP[1] ? 12 : -12)).toFixed(1)} ${usP[0].toFixed(1)} ${usP[1].toFixed(1)}`); q.st.setAttribute('stroke-width', w.toFixed(2)); q.st.style.opacity = ''; q.st.dataset.on = '1'; });
        /* counters */
        const U = OD.bodies[BYISO().USA], CN = OD.bodies[BYISO().CHN], yr = Math.round(yf);
        cy.textContent = String(yr);
        if (hyp) { const g = OD.bodies[BYISO().DEU]; c1.innerHTML = '<span>Germany, summed since 1995</span><b>' + f1(at(g.sumpct, yf)) + '% of GDP</b>'; c2.innerHTML = '<span>China (from 1997)</span><b>' + (at(CN.sumpct, yf) == null ? 'not collected' : f1(at(CN.sumpct, yf)) + '% of GDP') + '</b>'; c3.innerHTML = '<span>United States</span><b>' + f1(at(U.sumpct, yf)) + '% of GDP</b>'; }
        else {
          c1.innerHTML = '<span>US share of world GDP</span><b>' + f1(at(U.share, yf)) + '%</b>'; c2.innerHTML = '<span>China’s share</span><b>' + f1(at(CN.share, yf)) + '%</b>';
          const cu = at(U.sum, yf), cc = at(CN.sum, yf); c3.innerHTML = '<span>Current account summed since 1995</span><b>US ' + tn(cu) + ' · China ' + (cc == null ? 'from 1997' : tn(cc)) + '</b>' + (yr === 2026 ? '<em class="wipp">IMF estimate</em>' : '');
        }
        if (!hyp && mode === 'story') { const ev = evAt(yr); narr.innerHTML = ''; narr.append(h('span', 'k', ev ? ev.year + ' · ' + ev.label : String(yr)), h('p', '', ev ? ev.line : ''), h('small', '', ev ? 'Source: ' + ev.src : ''));
          const a = h('button', 'lk', 'All four cards →'); a.type = 'button'; a.dataset.pv = 'orb'; narr.append(a); }
        inp.setAttribute('aria-valuetext', spoken(yr)); if (!st.drag && document.activeElement !== inp) inp.value = yf; else if (!st.drag) inp.value = yf;
        if (st.sel) infoFor(st.sel);
        OZ[hyp ? 'hy' : 'y'] = yr; if (!hyp && mode === 'story') { }
      }
      function placeSun(g, p, rg, rc) { const a = g.querySelector('.gl'), b = g.querySelector('.co'); [a, b].forEach(n => { n.setAttribute('cx', p[0]); n.setAttribute('cy', p[1]); }); a.setAttribute('r', Math.max(10, rg)); b.setAttribute('r', Math.max(3, rc * .72)); }
      const spoken = yr => { const U = OD.bodies[BYISO().USA], CN = OD.bodies[BYISO().CHN], ev = evAt(yr);
        return hyp ? 'Year ' + yr + '. Germany, ' + f1(at(OD.bodies[BYISO().DEU].sumpct, yr)) + '% of GDP summed since 1995. China, ' + (at(CN.sumpct, yr) == null ? 'not collected' : f1(at(CN.sumpct, yr)) + '%') + '.'
          : 'Year ' + yr + '. China, ' + f1(at(CN.share, yr)) + '% of world GDP.' + (ev && ev.year === yr ? ' Event: ' + ev.line : ''); };
      function infoFor(id) {
        const q = list.find(x => x.id === id); info.textContent = ''; if (!q) { info.append(h('p', 'oh', (ph ? 'Tap' : 'Move over or select') + ' a body for its share, its summed current account and what US firms’ affiliates earned there.')); return; }
        const yr = Math.round(st.yf), d = q.d, b = q.b; st.sel = id;
        info.append(h('span', 'k', q.bk ? 'Booking point' : (q.core ? 'Centre' : (b.wring === 1 ? 'Tools, chips and finance' : OB.sectors[b.wsec] || ''))), h('b', '', q.name));
        const rows = [];
        if (d && d.share && !q.bk) rows.push(['Share of world GDP, ' + yr, at(d.share, yr) == null ? 'not collected' : f1(at(d.share, yr)) + '%' + (d.estFrom && yr >= d.estFrom ? ' (IMF estimate)' : '')]);
        if (d && d.sum) rows.push(['Current account summed since 1995', at(d.sum, yr) == null ? 'not collected' : tn(at(d.sum, yr)) + (at(d.sumpct, yr) != null ? ' · ' + f1(at(d.sumpct, yr)) + '% of that year’s GDP' : '')]);
        if (d && d.inc) rows.push(['Income of US affiliates there, ' + yr, at(d.inc, yr) == null ? 'not collected' : '$' + (Math.round(at(d.inc, yr)) / 1000).toFixed(1) + 'bn (BEA' + (yr < 2006 ? ', net of withholding taxes' : '') + ')']);
        if (q.china) rows.push(['Streams into China', 'not collected']);
        rows.forEach(r => { const p = h('p', 'rw'); p.append(h('span', '', r[0]), h('b', '', r[1])); info.append(p); });
        if (b.role && !q.bk) info.append(h('p', 'ro', b.role));
        if (q.iso === 'DEU' || q.iso === 'NLD') { const a = h('button', 'lk', q.iso === 'DEU' ? 'German hypocrisy →' : 'The Netherlands declines to comment. →'); a.type = 'button'; a.dataset.pv = 'hyp'; info.append(a); }
      }
      /* the interaction */
      const pick = id => { st.sel = id; list.forEach(q => q.g.classList.toggle('sel', q.id === id)); infoFor(id); };
      const idOf = ev => { const g = ev.target.closest && ev.target.closest('[data-b]'); return g ? g.dataset.b : null; };
      svg.addEventListener('pointerover', ev => { const id = idOf(ev); if (id && ev.pointerType === 'mouse' && id !== st.sel) pick(id); });
      svg.addEventListener('click', ev => { const id = idOf(ev); if (id) pick(id); });
      svg.addEventListener('focusin', ev => { const id = idOf(ev); if (id && id !== st.sel) pick(id); });
      svg.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { const id = idOf(ev); if (id) { ev.preventDefault(); pick(id); } } });
      const cross = (a, b) => { const lo = Math.min(a, b), hi = Math.max(a, b); return EVS().some(e => e.year > lo && e.year <= hi) && !hyp && !reduce() && e_ripple(); };
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
      play.addEventListener('click', () => {
        if (st.playing) { stop(); return; }
        if (st.yf >= maxY - .01) { render(1995); st.lastInt = 1995; }
        st.playing = true; play.textContent = '❚❚ Pause'; play.setAttribute('aria-pressed', 'true'); let last = performance.now(), hold = 0, skip = null;
        const speed = 31 / 20;   /* 1995 to 2026 in about 20 s, 1.5 s at each event */
        const frame = now => {
          if (!st.playing || !live()) { if (!live() && st.playing) stop(); return; }
          const dt = Math.min(.1, (now - last) / 1000); last = now;
          if (hold > 0) { hold -= dt; st.raf = requestAnimationFrame(frame); return; }
          const a = st.yf, b = Math.min(maxY, a + (reduce() ? 1 : speed * dt)), E = EVS().find(e => e.year > a + .0001 && e.year <= b + .0001 && !hyp), l = st.lastInt;
          const to = E ? E.year : b; render(to); if (Math.round(to) !== l) { cross(l, Math.round(to)); st.lastInt = Math.round(to); }
          hold = E ? 1.5 : reduce() ? .6 : 0; if (to >= maxY) { st.playing = false; play.textContent = '↺ Replay'; play.setAttribute('aria-pressed', 'false'); st.raf = 0; return; }
          st.raf = requestAnimationFrame(frame);
        };
        st.raf = requestAnimationFrame(frame);
      });
      /* the opening (spec §7): once per visit; Skip or Esc */
      function opening() {
        if (mode !== 'story' || X.orrOpened) return false; X.orrOpened = true;
        if (reduce()) { wrap.classList.add('fadein'); setTimeout(() => wrap.classList.remove('fadein'), 400); return false; }
        const caps = ['the core', 'tools, chips and finance', 'the assembly line', 'energy and minerals', 'role not collected'], cap = h('div', 'orr-cap'); cap.setAttribute('aria-hidden', 'true'); stage.append(cap);
        const skipb = h('button', 'orr-skip', 'Skip'); skipb.type = 'button'; stage.append(skipb); wrap.classList.add('opening'); st.opening = true; const T = [];
        const ringsOn = n => { ringE.forEach((r, k) => r.classList.toggle('on', k < n)); bod.forEach(q => q.g.classList.toggle('on', q.b.wring < n && (q.b.wring !== 0 || n > 0))); };
        const fin = () => { T.forEach(clearTimeout); wrap.classList.remove('opening'); wrap.classList.add('opened'); cap.remove(); skipb.remove(); ringsOn(9); ringE.forEach(r => r.classList.remove('on')); bod.forEach(q => q.g.classList.remove('on')); st.opening = false; document.removeEventListener('keydown', esc); };
        const esc = ev => { if (ev.key === 'Escape') fin(); }; document.addEventListener('keydown', esc); skipb.addEventListener('click', fin);
        wrap.classList.add('s0'); ringsOn(0); sunU.style.opacity = 0;
        const at_ = (ms, f) => T.push(setTimeout(() => { if (st.opening && wrap.isConnected) f(); }, ms));
        at_(60, () => { sunU.style.opacity = ''; wrap.classList.add('s1'); });
        for (let k = 0; k < 5; k++) at_(700 + k * 900, () => { ringsOn(k + 1); cap.textContent = caps[k]; cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in'); });
        at_(700 + 5 * 900, () => { cap.classList.remove('in'); wrap.classList.add('s2'); });
        at_(700 + 5 * 900 + 1000, fin);
        return true;
      }
      render(o.year); st.lastInt = Math.round(o.year); infoFor(null);
      if (mode === 'story') { const dp = h('div', 'orr-foot'); deepb.append(h('b', '', 'For economists: the full statistics'), h('span', 'wipp', 'WIP'), h('small', '', 'The figures behind every year, the two orders side by side, and the method.')); deepb.classList.toggle('next', o.year >= 2025); dp.append(deepb); wrap.append(dp); }
      return { render, go, stop, opening, st, wrap, deep: deepb, slider, svg, list, L };
    }

    /* ---------- the views ---------- */
    const back = () => { const b = h('button', 'pf-chip orr-back', '← Back to the story, ' + OZ.y); b.type = 'button'; b.dataset.pv = 'orr'; K.R.chips.append(b, h('span', 'gap')); };
    const DEEP = ['fig', 'rng', 'pft', 'hyp'];
    let cur = null;
    const mount = mode => { const fig = R.fig; fig.classList.add('orr-fig'); const o = Orrery(fig, { mode, year: mode === 'hyp' ? OZ.hy : OZ.y }); cur = o; return o; };
    const WIPN = 'WIP';
    V.orr = {
      title: () => cur && cur.L && cur.L.e >= .9 ? 'Two systems, and a curtain between them' : 'One system around the United States', unit: 'Size: share of world GDP · Position: tier and role · Schematic', tall: true,
      draw() {
        if (!need()) return; const o = mount('story'); K.reading('', '');
        if (OZ.y >= 2025) o.deep.classList.add('next');
        const first = !X.orrOpened && OZ.y === 1995; if (first) o.opening();
        o.render(OZ.y); R.title.textContent = V.orr.title();
        R.lg.textContent = ''; [['c pax', 'Pax Silica signatory'], ['c tw', 'Takes part without signing'], ['c usx', 'US system, outside Pax Silica'], ['c both', 'On both lists'], ['c sw', 'On neither list'], ['z', 'Extraction zone'], ['bk', 'A booking point (no mass)']].forEach(([c, t]) => { const s = h('span', 'olg'), i = h('i', c); s.append(i, t); R.lg.append(s); });
        R.lg.append(h('span', 'olg none', 'Streams into China: not collected'));
        const oo = o.render; o.render = v => { oo(v); R.title.textContent = V.orr.title(); };
      },
      table: () => { if (!OD) return { cap: 'The orrery is loading.', head: ['Body'], rows: [['…']] }; const yr = OZ.y, ids = Object.keys(OD.bodies);
        return { cap: 'The orrery at ' + yr + ': share of world GDP (IMF WEO Oct 2026), current account summed since 1995 and as a share of that year’s GDP, income of US affiliates there (BEA). Source and vintage: see “The figures by year”.', head: ['Economy', 'Share of world GDP, %', 'Current account summed, $bn', '% of GDP', 'US affiliates’ income, $m'],
          rows: ids.map(id => { const d = OD.bodies[id], b = OB.B.find(x => x.id === id), i = yi(yr); return [nameOf(b), d.share ? d.share[i] : null, d.sum ? d.sum[i] : null, d.sumpct ? d.sumpct[i] : null, d.inc ? d.inc[i] : null]; }) }; } };
    V.rng = { title: 'Creditors and debtors: the current account summed since 1995', unit: 'Outer ring: creditor · Inner notch: debtor · Thickness ∝ √|sum|', tall: true, chips: back,
      draw() { if (!need()) return; const o = mount('rings'); o.render(OZ.y); K.reading('', 'Germany and Japan built claims inside the US system; the United States and the United Kingdom are the debtors. A stock built from flows: valuation and price effects are not corrected (IMF WP/99/115).');
        R.lg.textContent = ''; [['c rcr', 'Creditor: outer ring'], ['c rdb', 'Debtor: inner notch']].forEach(([c, t]) => { const s = h('span', 'olg'), i = h('i', c); s.append(i, t); R.lg.append(s); }); }, table: V.orr.table };
    V.fig = { title: () => 'The figures behind the orrery, ' + OZ.y, unit: 'IMF WEO Oct 2026 · BEA · preliminary', chips() { back(); const yrs = [1995, 2000, 2005, 2010, 2015, 2019, 2022, 2024, 2025, 2026]; yrs.forEach(y => { const b = h('button', 'pf-chip', String(y)); b.type = 'button'; b.dataset.oy = y; b.setAttribute('aria-pressed', String(OZ.y === y)); R.chips.append(b); }); },
      draw() { if (!need()) return; const T = V.orr.table(); K.reading('', ''); K.table(T);
        const m = h('div', 'orr-method'); m.setAttribute('role', 'group'); m.setAttribute('aria-label', 'The method note and the caveats of every series: sources, the stock over a flow, the 2006 break in the BEA income, and the dispute over China’s surplus'); m.append(h('span', 'wipp', 'WIP'), h('p', 'wn', 'Preliminary: the series are being checked; the 2026 values are IMF estimates.'));
        ['Sources. GDP and current accounts: IMF World Economic Outlook, October 2026 (13 Oct 2026), the database file; shares are the economy’s GDP over the IMF’s world GDP. The World Bank’s GDP differs by up to 2.5% for the six largest economies; OR2’s comparison is in the work repository. Cuba and New Caledonia have no IMF row.',
          'A stock over a flow. The current account summed from 1995, divided by one year’s GDP, adds current-dollar flows over many years: valuation and price effects are not corrected (IMF WP/99/115). China’s sum starts in 1997 (no value for 1995–96). The world’s current accounts do not sum to zero (the IMF’s discrepancy).',
          'Income of US affiliates (BEA, direct investment income without current-cost adjustment, outward, by host country). Net of withholding taxes before 2006 and gross from 2006: one break, not adjusted. Before 2009 BEA publishes 44 countries only. Income attributed to a host country is not where it was earned: the Dutch and Irish special-purpose entities, for one.',
          'China’s side. No official source publishes Chinese outward-FDI income by host country, so its streams say “not collected”. The size of China’s surplus is disputed: the Fed’s FEDS Notes (22 Sep 2026) put the 2025 understatement at about 0.6 point of GDP, Setser (CFR) at about $1tn, and VoxChina argues the gap is explained by adjustments. No figure on the page is changed for it.',
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
        R.lg.textContent = ''; [['c rcr', 'Creditor: a body sized by its summed surplus'], ['c neg', 'Debtor: a dim hole']].forEach(([c, t]) => { const s = h('span', 'olg'), i = h('i', c); s.append(i, t); R.lg.append(s); }); },
      table: V.orr.table };
    /* the deep layer's old views keep their chips; each gets a way back to the story */
    ['orb', 'ord', 'pos'].forEach(id => { const v = V[id]; if (!v || v.__b) return; const c0 = v.chips; v.__b = 1; v.chips = function () { back(); if (c0) c0.call(this); }; });
    /* the year chips of the figures view */
    K.host.addEventListener('click', ev => { const b = ev.target.closest('[data-oy]'); if (!b) return; OZ.y = +b.dataset.oy; K.board(true); K.emit('year'); });
    return { stop: () => cur && cur.stop(), get cur() { return cur; }, tension: yf => OD ? tension(yf) : 0, ready: () => !!OD };
  };
})();
