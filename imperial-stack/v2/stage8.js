/* The Imperial Stack v2 · stage8.js (round OR8, 26 Nov 2026; handoff claude/handoffs/orrery-stage-or8-26-nov.md)
   The order's stage: the orrery's story as one narrated full screen, the way the Circuit and the machinery fill theirs.
   orrery.js draws the picture (bodies, rings, streams, China's arcs, the two steps) and calls X.orrStage(C) once per story instance,
   on the page and in full screen alike. This file adds what round OR8 asked for:
   · the stage's layout: a HUD (year, counters, which flows are shown and what they are), the narrator above the timeline, the chapter
     strip, the key on the picture, the card of the body picked, the door “For economists: the full statistics”;
   · ten chapters, a pure function of the year (1 to 8) or of the step (9 and 10): each has a title card, one to three sentences,
     one flow layer and a place the camera glides to; a film that plays them, and that a visitor can pause, scrub or steer;
   · the WTO order as the rim of the picture itself, named on the rim, with China's entries on it (it was a strip at the foot);
   · the flows through the years, from the data round's series (orrery.json “flows”, built by imperial-stack-work scripts/OR8-stage-build.py):
     “earn”  what US firms' affiliates earned in each economy (BEA; the grey lines that were there, now with the five largest named);
     “paper” US Treasuries held abroad by country of custody (Treasury TIC, 2000–2025 and Sep 2026) and the Fed's swap lines;
     “clear” current-account surpluses into one pool and the US deficit out of it (IMF, 1995–2025). No surplus line ends at the United States.
   Every figure comes from the file; a year without a row draws no line. Illustrative lines are dashed and starred. */
(function () {
  'use strict';
  const X = window.ISX; if (!X) return;
  /* the site's one motion curve, cubic-bezier(.2,.8,.2,1), as a function of time */
  const curve = t => { if (t <= 0) return 0; if (t >= 1) return 1; let a = 0, b = 1, u = t; for (let i = 0; i < 16; i++) { u = (a + b) / 2; const x = 3 * u * (1 - u) * (1 - u) * .2 + 3 * u * u * (1 - u) * .2 + u * u * u; if (x < t) a = u; else b = u; } return 3 * u * (1 - u) * (1 - u) * .8 + 3 * u * u * (1 - u) + u * u * u; };
  const COL = 252;   /* the side columns of a wide stage, in css as well */
  const LANDL = 132;   /* a phone held sideways: the year and the two shares keep the left edge to themselves */
  const MIDL = 226;   /* a middle-sized stage keeps one column, on the left, for its counters and the choice of flows */

  X.orrStage = function (C) {
    const { h, el, OD, st, L, Vw, Sx, Sy, W, H, full, ph, compact, wrap, stage, svg, gV, gT, isoB, at, f1, bn, clamp, lerp, reduce, R, STEPS, maxY } = C;
    const F = OD.flows, ORD = OD.order, EVS = OD.events, OWN = ORD.own, LW = ORD.lists.waico;
    const wide = !compact && W >= 1180 && H >= 740, land = compact && !ph;   /* land: a phone held sideways */
    wrap.classList.add('stg', wide ? 'wide' : land ? 'land' : ph ? 'port' : 'mid'); if (full) wrap.classList.add('fs');
    const yix = y => clamp(Math.round(y) - 1995, 0, 31), val = (a, y) => a ? a[yix(y)] : null;
    const bnI = v => '$' + Math.round(Math.abs(v)).toLocaleString('en-US') + 'bn', bn1 = v => '$' + (Math.abs(v) / 1000).toFixed(1) + 'bn';   /* bn1: from US$ million */
    const pc1 = v => v.toFixed(1) + '%';
    const nameOf = iso => { const q = isoB(iso) || C.list.find(x => x.iso === iso); return q ? q.name : iso; };

    /* ---------- the chapters ---------- */
    const pool = F.pool, cnBal = y => val(pool.bal.CHN, y), h1Top = () => { let r = null; Object.keys(F.h1.out).forEach(iso => { const v = F.h1.out[iso][1]; if (!r || v > r[1]) r = [iso, v]; }); return r; };
    const CH = [
      { id: 'wto', quiet: true, y0: 1995, y1: 1995, k: '1995', t: 'The WTO order', s: 'The WTO order', layer: 'earn', cam: 'all',
        p: () => ['In 1995 the world economy is one order around the United States: one ladder for the whole world.',
          'Its institutions are the rim of the picture: the IMF and the World Bank (1944), the GATT (1948), the Asian Development Bank (1966) and, from 1995, the WTO.',
          'The order entrenches the world-systems idea: every economy has a place in one chain of production.'] },
      { id: 'why', y0: 1996, y1: 2000, k: '', t: 'Why profit flows to the centre', s: 'Why the centre', layer: 'earn', cam: 'sys',
        p: () => ['Each ring is a place in that chain. Energy and minerals at the edge; then the assembly line; then tools, chips and the financial centres; at the core, ownership, finance, design and the dollar.',
          'The mass is made on the outer rings, but the profit is claimed by whoever owns, finances and designs: finance is dominant, production is determinant.',
          'The grey lines are that claim, measured: what US firms’ affiliates earned in each economy (BEA). The dashed arrow is illustrative*.'] },
      { id: 'joins', y0: 2001, y1: 2007, k: '2001', t: 'China joins on the assembly ring', s: 'China joins', layer: 'clear', cam: 'cn',
        p: () => ['On 11 December 2001 China joins the WTO, on the assembly ring.',
          'It grows out of the flows: its surplus with the world rises from ' + bnI(cnBal(2001)) + ' in 2001 to ' + bnI(cnBal(2007)) + ' in 2007 (IMF), and its share of the world’s goods exports from ' + pc1(val(F.cn.exp, 2001)) + ' to ' + pc1(val(F.cn.exp, 2007)) + ' (World Bank).',
          'The surplus does not go to the United States directly. No pair of countries settles alone: surpluses meet deficits in one pool, and the pool buys dollar assets.'] },
      { id: 'paper', y0: 2008, y1: 2012, k: '2008', t: 'The dollar is sent out', s: 'The dollar is sent out', layer: 'paper', cam: 'all',
        p: () => ['Lehman Brothers fails on 15 September 2008. The financial centre is rescued; the order holds.',
          'The Federal Reserve sends dollars to other central banks through swap lines: $' + F.swap.peak['2008'][0].toFixed(1) + 'bn is outstanding on 17 December 2008 (Fed, H.4.1). The same month the People’s Bank of China signs a currency swap of its own, with the Bank of Korea.',
          'And the paper goes out: at the end of 2008 foreigners hold ' + bnI(val(F.tic.world, 2008)) + ' of US Treasuries, counted by country of custody (Treasury TIC).'] },
      { id: 'own', quiet: true, y0: 2013, y1: 2016, k: '2013–2016', t: 'China builds its own institutions', s: 'China builds its own', layer: 'earn', cam: 'cn',
        p: () => ['China builds institutions of its own: the Belt and Road (2013), the New Development Bank (2014), the payment system CIPS (2015), the Asian Infrastructure Investment Bank (2016).',
          'They join the Shanghai Cooperation Organisation (2001), its swap lines (2008) and BRICS (2009): the arcs round China.',
          'It does not leave the old order: it keeps its seat at the IMF and the World Bank and its place in the WTO. The rim still holds both.'] },
      { id: 'squeeze', quiet: true, y0: 2017, y1: 2024, k: '2017–2024', t: 'The squeeze', s: 'The squeeze', layer: 'earn', cam: 'all',
        p: () => ['Washington turns on the order it built. In 2017 its Trade Representative opens an investigation into China’s technology practices.',
          'From December 2019 the WTO’s Appellate Body can no longer hear appeals: Washington had blocked every new appointment since 2017.',
          'In 2022 Russia’s central bank reserves are frozen, and the first chip export controls on China follow in October. The one system is pulled apart.'] },
      { id: 'poles', quiet: true, y0: 2025, y1: 2025, k: '2025', t: 'Two poles', s: 'Two poles', layer: 'earn', cam: 'all',
        p: () => ['In April 2025 come tariffs on the whole world; on 12 December 2025, Pax Silica: the silicon curtain.',
          'Pax Silica is the US-led coalition on AI and semiconductor supply chains: a new way to entrench value and supply chains around the United States, and to decide who may hold the tools.',
          'One order has become two poles. The economies that stand between the two systems are named on the band between them.'] },
      { id: 'now', y0: 2026, y1: 2026, k: '2026', t: 'WAICO, and the order as it stands', s: '2026', layer: 'earn', cam: 'all',
        p: () => { const t = h1Top(); return ['On 16 July 2026 twenty-nine countries sign the agreement that founds the World Artificial Intelligence Cooperation Organization, in Shanghai: China’s list beside Washington’s.',
          'Pax Silica grows through the year: 25 signatories beside the United States on 25 Nov 2026 (State Department).',
          'Profit still flows to the centre: in the first half of 2026 US firms’ affiliates earned ' + bn1(t[1]) + ' in ' + (/^(Netherlands|United Kingdom)$/.test(nameOf(t[0])) ? 'the ' : '') + nameOf(t[0]) + ' alone (BEA).']; } },
      { id: 'pp', step: 'pp', k: 'After the story', t: STEPS.pp.title, s: STEPS.pp.short, layer: null, cam: 'all' },
      { id: 'cl', step: 'cl', k: 'After the story', t: STEPS.cl.title, s: STEPS.cl.short, layer: null, cam: 'all' }];
    const NCH = CH.length, byYear = y => { for (let i = 7; i >= 0; i--) if (y >= CH[i].y0) return i; return 0; };
    const idx = () => st.step === 'pp' ? 8 : st.step === 'cl' ? 9 : byYear(Math.round(st.yf));
    const chTitle = i => (CH[i].k && !CH[i].step ? CH[i].k + ' · ' : '') + CH[i].t;
    st.layer = 'earn'; st.pin = false; st.ch = -1; st.cam = 'all';

    /* ---------- the stage's parts ---------- */
    const hud = h('div', 'orr-hud'), dock = h('div', 'orr-dock'), side = h('div', 'orr-side'), tcard = h('div', 'orr-tc'); tcard.setAttribute('aria-hidden', 'true');
    /* which flows are on the picture: three choices, one at a time; the chapter picks one unless the visitor has */
    const LAYERS = [['earn', 'Earnings in'], ['paper', 'Paper out'], ['clear', 'Clearing']];
    const fsel = h('div', 'orr-fsel'); fsel.setAttribute('role', 'radiogroup'); fsel.setAttribute('aria-label', 'Flows on the picture');
    fsel.append(h('span', 'fk', 'Flows'));
    const fbtn = LAYERS.map(([k, t]) => { const b = h('button', 'orr-fb l-' + k); b.type = 'button'; b.setAttribute('role', 'radio'); b.dataset.layer = k; b.append(h('i'), t); fsel.append(b); return b; });
    const fcap = h('p', 'orr-fcap'); fcap.setAttribute('aria-live', 'polite');
    const fnote = h('p', 'orr-fn'); fnote.hidden = true;
    /* the narrator: the chapter's narration, and beside it what the timeline marks at this year */
    const nar = h('section', 'orr-nar'); nar.setAttribute('aria-label', 'The narration');
    const nb = h('div', 'nb'), nz = h('div', 'nz'), nn = h('div', 'nn'), ne = h('div', 'ne'), ni = h('div', 'ni orr-ins'); nz.setAttribute('aria-live', 'polite'); nn.append(ne, ni); nb.append(nz, nn);
    const nx = h('button', 'orr-nexp'); nx.type = 'button'; nx.setAttribute('aria-expanded', 'false'); nx.textContent = 'Read';
    nx.addEventListener('click', () => { const o = !nar.classList.contains('open'); nar.classList.toggle('open', o); nx.setAttribute('aria-expanded', String(o)); nx.textContent = o ? 'Close' : 'Read'; });
    /* the chapter strip, the narrator's head: where you are, ten chapters, back, and the one way forward */
    const kick = h('span', 'k nk'), chs = h('nav', 'orr-chs'); chs.setAttribute('aria-label', 'Chapters: eight of the story, then two steps. Left and right arrows move between them.');
    const bk = h('button', 'orr-nx bk'), fw = h('button', 'orr-nx fw'); bk.type = 'button'; fw.type = 'button';
    const chl = h('div', 'chl'); chl.setAttribute('role', 'list');
    const chb = CH.map((c, i) => { const li = h('span'); li.setAttribute('role', 'listitem'); const b = h('button', 'orr-chp' + (c.step ? ' orr-stp' : '')); b.type = 'button'; b.dataset.ch = i; if (c.step) b.dataset.step = c.step; b.append(h('small', '', String(i + 1))); b.dataset.s = c.s;   /* the short title beside the number of the chapter you are in is drawn from this (css), so the button's own text is its number and its name for a screen reader is the label */ b.setAttribute('aria-label', 'Chapter ' + (i + 1) + ' of ' + NCH + ': ' + chTitle(i)); b.title = chTitle(i); li.append(b); chl.append(li); return b; });
    const cnt = h('span', 'orr-cnt'); cnt.setAttribute('aria-hidden', 'true');
    chs.append(kick, chl, cnt, bk, fw); nar.append(chs, nb); if (land) nar.append(nx);
    /* the timeline row */
    const tkey = h('div', 'orr-tkey'); tkey.innerHTML = '<span><i class="e"></i>Events</span><span><i class="o"></i>China’s own</span>'; tkey.setAttribute('role', 'group'); tkey.setAttribute('aria-label', 'On the timeline: gold dots are events, teal diamonds are China’s own institutions');
    const pc = h('div', 'orr-pc'); pc.append(C.play, tkey);
    const yrs = h('div', 'orr-yrs'); yrs.setAttribute('aria-hidden', 'true'); [1995, 2001, 2008, 2014, 2020, 2026].forEach(y => { const s = h('span', '', String(y)); s.style.left = ((y - 1995) / (maxY - 1995) * 100) + '%'; yrs.append(s); });
    C.track.append(yrs); C.slider.append(pc, C.track);
    dock.append(nar, C.slider);
    /* the HUD */
    hud.append(C.counters); if (!compact) hud.append(fsel, fcap);   /* a phone chooses its flows in the key, where the lines are explained */
    /* the door and, on the page, the two jumps into the text under the stage */
    side.append(C.deepb);
    if (!full) { const j = h('div', 'orr-jump'); [['read', 'The explanation'], ['how', 'How we count']].forEach(([k, t]) => { const b = h('button', 'lk2'); b.type = 'button'; b.dataset.pf = k; if (k === 'how') b.setAttribute('data-how', ''); b.append(t + ' ', h('span', '', '↓')); j.append(b); }); side.append(j); }
    /* the card of the body picked gets a way to put it down */
    const ix = h('button', 'orr-ix', '×'); ix.type = 'button'; ix.setAttribute('aria-label', 'Close this card'); ix.addEventListener('click', () => C.unpick());
    stage.append(hud, C.info, side, fnote, tcard, dock);
    /* a wide stage's right column: the key (or the card of the body picked), then the door; they share the column and never overlap */
    const col = wide ? h('div', 'orr-col') : null;
    if (col) { stage.append(col); if (C.keyP) col.append(C.keyP); col.append(C.info, side); } else if (ph) dock.append(side); else C.slider.append(side);

    /* ---------- the key on the picture ---------- */
    function fillKey(box) {
      box.textContent = ''; if (compact) box.append(fsel, fcap);
      box.append(h('p', 'ku', 'Size: share of world GDP · Position: tier and role · Schematic'));
      C.marksKey(box, 'orr', st.era < 0 ? 0 : st.era, compact);
      const add = (cls, t) => { const s = h('span', 'olg'); s.append(h('i', cls), t); box.append(s); };
      /* a phone's rim has room for the order's name only: its institutions are named here. On a larger stage the rim and the arcs carry their own names */
      if (compact) { add('rim', 'The rim: the WTO order, the old order: ' + oldTxt() + '. China inside it: ' + ORD.cn.map(x => x[0] + ' ' + x[1]).join(' · ')); }
      if (compact || (!wide && C.pbox().hl < 250)) C.ringKey(box, full, C.hl, false);   /* where the picture has no room for the rings' names after the split, the key has them */
      box.append(h('p', 'kh', (ph || compact ? 'Tap' : 'Move over or select') + ' a body for its share, its summed current account and what US firms’ affiliates earned there.'));
      if (!wide && !compact) { const k = h('p', 'kf'); box.append(k); box.__cap = k; }
    }
    const oldTxt = () => { const o = []; ORD.old.forEach(([n, y]) => { const l = o[o.length - 1]; if (l && l[1] === y) l[0] += ' and ' + n; else o.push([n, y]); }); return o.map(x => x[0] + ' ' + x[1]).join(' · '); };
    if (C.keyP) fillKey(C.keyP);

    /* ---------- the box the picture is laid out in ---------- */
    /* the timeline's own words never run into each other: a year that has no room keeps its dot (and its name for a screen reader and on hover);
       the names of China's institutions take the first of three rows that is free */
    function fitTrack() {
      if (compact) return; const tr = C.track; if (!tr) return;
      const ev = [...tr.querySelectorAll('.orr-evd')], FIRST = new Set(CH.filter(c => !c.step).map(c => c.y0)), shown = [];
      const span = d => { const i = d.querySelector('i'); i.style.visibility = ''; const r = i.getBoundingClientRect(); return [r.left, r.right]; };
      ev.forEach(d => { if (!d.title) d.title = d.getAttribute('aria-label'); });
      ev.slice().sort((a, b) => (FIRST.has(+b.dataset.y) ? 1 : 0) - (FIRST.has(+a.dataset.y) ? 1 : 0) || +a.dataset.y - +b.dataset.y).forEach(d => { const [l, r] = span(d); if (shown.some(q => l < q[1] + 5 && q[0] < r + 5)) d.querySelector('i').style.visibility = 'hidden'; else shown.push([l, r]); });
      const rows = [[], [], []]; let deep = 0;
      [...tr.querySelectorAll('.orr-owd')].forEach(d => { const i = d.querySelector('i'); d.classList.remove('r0', 'r1', 'r2'); d.classList.add('r0'); const r = i.getBoundingClientRect(); let k = rows.findIndex(R => !R.some(q => r.left < q[1] + 6 && q[0] < r.right + 6)); if (k < 0) k = 2; rows[k].push([r.left, r.right]); d.classList.remove('r0'); d.classList.add('r' + k); deep = Math.max(deep, k); });
      tr.classList.toggle('own3', deep === 2);
    }
    function box() {
      fitTrack();
      const sr = stage.getBoundingClientRect(); let top = 0;
      if (!full) { const ht = document.querySelector('#isx-root .hud-top'); if (ht && getComputedStyle(ht).position === 'absolute') top = Math.max(0, Math.round(ht.getBoundingClientRect().bottom - sr.top) + 2); }
      stage.style.setProperty('--top', top + 'px');
      let ht = top; const pt = !full && R.top; if (pt && getComputedStyle(pt).position === 'absolute') pt.style.top = (Math.round(sr.top - pt.offsetParent.getBoundingClientRect().top) + top + 6) + 'px'; else if (pt) pt.style.top = '';
      if (pt && getComputedStyle(pt).position === 'absolute') ht = Math.max(top, Math.round(pt.getBoundingClientRect().bottom - sr.top) + 2);   /* the tab's title line stands above the HUD */
      stage.style.setProperty('--hudtop', ht + 'px');
      const dh = Math.round(dock.getBoundingClientRect().height) + (ph ? 4 : 10);
      stage.style.setProperty('--dock', dh + 'px');
      /* a wide stage has its columns; elsewhere the picture starts under the tab's title line (a phone upright: under its row of buttons) */
      const rcb = !full && !wide && (!compact || land) && C.rc ? Math.round(C.rc.getBoundingClientRect().bottom - sr.top) + 4 : 0;   /* a middle-sized stage: the picture and the rim's words start under the row of buttons */
      const mid = !wide && !land && !ph, ox = wide ? COL : mid ? MIDL : land ? LANDL : 0, oxr = wide ? COL : 0, oy = full ? (ph ? 100 : compact ? 44 : 58) : wide ? top + 4 : ph ? 46 : Math.max(top, ht, rcb) + 2, hl = Math.max(120, H - oy - dh - (compact ? 4 : 22));   /* a large stage keeps a strip under the picture for the footnote of a starred line */
      stage.style.setProperty('--boxw', (W - ox - oxr - 16) + 'px'); stage.style.setProperty('--boxc', (ox + (W - ox - oxr) / 2) + 'px');
      const m = 'linear-gradient(to right, transparent ' + Math.max(0, ox - 26) + 'px, #000 ' + (ox + 6) + 'px, #000 ' + (W - oxr - 6) + 'px, transparent ' + Math.min(W, W - oxr + 26) + 'px), linear-gradient(to bottom, transparent ' + Math.max(0, oy - 12) + 'px, #000 ' + (oy + 4) + 'px, #000 ' + (oy + hl) + 'px, transparent ' + (oy + hl + 22) + 'px)';
      svg.style.webkitMaskImage = m; svg.style.maskImage = m; svg.style.webkitMaskComposite = 'source-in'; svg.style.maskComposite = 'intersect';
      return { ox, oy, wp: W - ox - oxr, hl, dock: dh, top };
    }

    /* ---------- the rim: the WTO order, named on the picture ---------- */
    const rimP = el('path', { class: 'orr-rim', fill: 'none' }), gRim = el('g', { class: 'orr-old', role: 'button', tabindex: 0 });
    const rid = 'orr-rt' + C.gid, ridb = 'orr-rb' + C.gid, ptop = el('path', { id: rid, fill: 'none' }), pbot = el('path', { id: ridb, fill: 'none' }); C.defs.append(ptop, pbot);
    const NAME = 'THE WTO ORDER, 1995–', INST = oldTxt().toUpperCase();
    const mkT = (pid, cls) => { const t = el('text', { class: 'orr-rimt ' + cls, dy: cls === 'a' ? -5 : 12.5 }), tp = el('textPath', { href: '#' + pid, startOffset: '50%', 'text-anchor': 'middle' }); t.append(tp); return [t, tp]; };
    const [tTop, tpTop] = mkT(rid, 'a'), [tBot, tpBot] = mkT(ridb, 'b');
    const cnS = ORD.cn.map(x => el('tspan', {}, ' ◆ ' + x[0].toUpperCase() + ' ' + x[1])); tpBot.append(el('tspan', { class: 'hd' }, 'CHINA INSIDE IT'), ...cnS);
    /* a phone held upright: the top of the rim lies between the counters and the buttons, so the order's name runs along its foot */
    const [tFoot, tpFoot] = mkT(ridb, 'b n'); tpFoot.append(el('tspan', { class: 'hd' }, NAME)); tFoot.style.display = 'none';
    gRim.append(rimP, tTop, tBot, tFoot); const gR = el('g', { class: 'orr-rimg' }); gR.append(gRim); gT.parentNode.insertBefore(gR, gT);
    gRim.setAttribute('aria-label', 'The rim of the picture is the WTO order, the old order. ' + ORD.frame.line);
    const pickFrame = () => { if (st.step) return; st.ins = 'frame'; C.narrate(Math.round(st.yf)); };
    gRim.addEventListener('click', pickFrame); gRim.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pickFrame(); } });
    let rimMode = '', rimG = null;
    const sup = (a, b, n, t) => { const c = Math.cos(t), s = Math.sin(t); return [a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)]; };
    const OXb = () => C.pbox().ox, OYb = () => C.pbox().oy;
    function drawRim(g) {
      const u = g.u, f = g.f, vx = Math.abs(L.v[0]), vy = Math.abs(L.v[1]);
      const a0 = Math.min(L.W / 2 - 6, L.rx[4] * (L.ph ? 1 : 1.2) + f * vx + (compact ? 11 : 16)), b0 = Math.min(L.H / 2 - 15, L.ry[4] * (L.ph ? 1.06 : 1) + f * vy + (compact ? 9 : 16)), a1 = L.W / 2 - 5, b1 = L.H / 2 - 15;
      /* the rim is the edge of the picture: when the camera moves in, it stays as the frame of the box and keeps its words */
      const a = Math.min(lerp(a0, a1, u) * Vw.k, a1), b = Math.min(lerp(b0, b1, u) * Vw.k, b1), n = 2 + 3.2 * u, cx = clamp(Sx(L.cx), OXb() + a + 5, OXb() + L.W - a - 5), cy = clamp(Sy(L.cy), OYb() + b + 15, OYb() + L.H - b - 15);
      rimG = { a: lerp(a0, a1, u), b: lerp(b0, b1, u), n };
      const N = 96, P = []; for (let i = 0; i <= N; i++) { const p = sup(a, b, n, i / N * Math.PI * 2); P.push([cx + p[0], cy + p[1]]); }
      rimP.setAttribute('d', 'M' + P.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z');
      /* the two arcs the words run on, left to right: over the top, and along the foot */
      const arc = (t0, t1) => { const M = 40, Q = []; let len = 0; for (let i = 0; i <= M; i++) { const p = sup(a, b, n, lerp(t0, t1, i / M)); Q.push([cx + p[0], cy + p[1]]); if (i) len += Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1]); } return [Q, len]; };
      const sp = .1, [Qt, lt] = arc(Math.PI * (1 + sp), Math.PI * (2 - sp)), [Qb, lb] = arc(Math.PI * (1 - sp), Math.PI * sp);
      ptop.setAttribute('d', 'M' + Qt.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L')); pbot.setAttribute('d', 'M' + Qb.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L'));
      /* the names that fit: the order's own name first, then its institutions; what does not fit is in the key */
      const cw = compact ? 7.1 : 7.9, longW = (NAME.length + 5 + INST.length) * cw, mode = lt > longW + 30 ? 'long' : 'short';
      if (mode !== rimMode) { rimMode = mode; tpTop.textContent = ''; tpTop.append(el('tspan', { class: 'hd' }, NAME)); if (mode === 'long') tpTop.append(el('tspan', {}, '  ·  ' + INST)); }
      const botW = (15 + cnS.reduce((s, t) => s + t.textContent.length, 0)) * cw, showB = lb > botW + 24; tBot.style.display = showB ? '' : 'none'; st.rimShort = mode === 'short' || !showB;
      cnS[2].style.visibility = g.yr0 < ORD.cn[2][1] ? 'hidden' : '';
      const PB = C.pbox(); tTop.style.display = cy - b - 14 < PB.oy - 12 ? 'none' : ''; if (cy + b + 16 > PB.oy + PB.hl + (compact ? 2 : 6)) tBot.style.display = 'none';
      /* the words stand outside the rim: no name inside it can meet them. When the camera has moved in, bodies reach the frame: then the words are kept clear */
      const foot = compact && L.ph && !full; tFoot.style.display = foot && cy + b + 16 <= PB.oy + PB.hl + 4 ? '' : 'none'; if (foot) { tTop.style.display = 'none'; tBot.style.display = 'none'; tpFoot.setAttribute('startOffset', st.layer === 'clear' && !st.step && u < .5 ? '24%' : '50%'); }   /* the clearing pool and its name stand at the lower right: the order's name moves to the lower left */
      st.rimLabs = []; st.rimY = [cy - b, cy + b];
      if (Vw.k > 1.01) { const along = (Q, len, tw, up) => { let acc = 0; for (let i = 1; i < Q.length; i++) { acc += Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1]); if (acc > (len - tw) / 2 - 6 && acc < (len + tw) / 2 + 6) st.rimLabs.push(up ? [Q[i][0] - 12, Q[i][1] - 17, Q[i][0] + 12, Q[i][1] + 1] : [Q[i][0] - 12, Q[i][1] + 1, Q[i][0] + 12, Q[i][1] + 17]); } };
        if (tTop.style.display !== 'none') along(Qt, lt, mode === 'long' ? longW : NAME.length * cw, true); if (tBot.style.display !== 'none') along(Qb, lb, botW, false); }
    }
    const rimPt = t => { const p = sup(rimG.a, rimG.b, rimG.n, t); return [L.cx + p[0], L.cy + p[1]]; };

    /* ---------- the flow layers ---------- */
    const gFx = el('g', { class: 'orr-fx' }); gV.insertBefore(gFx, C.gSun);
    const fxP = new Map(), fxT = new Map();   /* lines by id; free-standing names by id */
    const line = id => { let o = fxP.get(id); if (!o) { o = { p: el('path', { class: 'fl', fill: 'none' }), pu: el('path', { class: 'fpu', fill: 'none', pathLength: 1 }) }; gFx.append(o.p, o.pu); fxP.set(id, o); } o.used = true; return o; };
    const word = (id, cls) => { let t = fxT.get(id); if (!t) { t = el('text', { class: 'orr-fl ' + cls }); gT.append(t); fxT.set(id, t); } t.__u = true; return t; };
    const why = el('path', { class: 'fl ill why', fill: 'none', 'marker-end': 'url(#orr-mc' + C.gid + ')' }); gFx.append(why);
    const poolG = el('g', { class: 'fp' }); poolG.append(el('circle', { class: 'o', r: 9 }), el('circle', { class: 'i', r: 3.2 })); gFx.append(poolG);
    const rad = q => q.r * (q.core ? .74 : 1) + 4, node = iso => C.list.find(q => q.iso === iso && q.vis !== false) || null;   /* an economy on the picture, a booking point included */
    /* a line from a to b that stops at the edges of both bodies, lightly bowed; returns its length */
    function draw1(o, A0, B0, ra, rb, w, cls, bow, mk, from, to) {
      o.p.dataset.from = from; o.p.dataset.to = to;
      const dd = Math.hypot(B0[0] - A0[0], B0[1] - A0[1]) || 1, ux = (B0[0] - A0[0]) / dd, uy = (B0[1] - A0[1]) / dd, A = [A0[0] + ux * ra, A0[1] + uy * ra], B = [B0[0] - ux * rb, B0[1] - uy * rb];
      const M = [(A[0] + B[0]) / 2 - uy * bow, (A[1] + B[1]) / 2 + ux * bow], d = `M${A[0].toFixed(1)} ${A[1].toFixed(1)}Q${M[0].toFixed(1)} ${M[1].toFixed(1)} ${B[0].toFixed(1)} ${B[1].toFixed(1)}`, len = dd * 1.03;
      o.p.setAttribute('d', d); o.p.setAttribute('class', 'fl ' + cls); o.p.setAttribute('stroke-width', w.toFixed(2)); o.p.style.display = '';
      if (mk) o.p.setAttribute('marker-end', 'url(#orr-m' + mk + C.gid + ')'); else o.p.removeAttribute('marker-end');
      o.pu.setAttribute('d', d); o.pu.setAttribute('class', 'fpu ' + cls); o.pu.setAttribute('stroke-width', Math.max(1.2, w).toFixed(2)); o.pu.style.strokeDasharray = (9 / len).toFixed(4) + ' ' + (51 / len).toFixed(4); o.pu.style.setProperty('--per', (-60 / len).toFixed(4)); o.pu.style.display = '';
      return [(A[0] + B[0]) / 2 - uy * bow / 2, (A[1] + B[1]) / 2 + ux * bow / 2];
    }
    /* what US firms' affiliates earned in an economy: the year's figure to 2025; in 2026 the first half (BEA has no full year yet) */
    const half = yf => Math.round(yf) >= 2026;
    const inc = (q, yf) => { if (!q.d) return null; if (half(yf)) { const v = F.h1.out[q.iso]; return v ? v[1] : null; } return q.d.inc ? at(q.d.inc, yf) : null; };
    const NTOP = compact ? 3 : 5;
    let capKey = '';
    function drawFx(g) {
      const yr = g.yr0, lay = st.step ? null : st.layer, sfx = new Map(), US = isoB('USA'), CN = isoB('CHN');
      fxP.forEach(o => { o.used = false; }); fxT.forEach(t => { t.__u = false; });
      wrap.dataset.layer = lay || ''; let note = '', cap = '', P = null;
      if (lay === 'earn') {
        const top = C.list.filter(q => !q.core && q.vis !== false && q.p).map(q => [inc(q, st.yf), q]).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0]).slice(0, NTOP);
        if (!CH[st.ch < 0 ? 0 : st.ch].quiet || st.pin) top.forEach(([v, q]) => sfx.set(q.id, ' · ' + bn1(v)));
        cap = (half(st.yf) ? 'Grey lines: what US firms’ affiliates earned in each economy in the first half of 2026: six months, there is no full 2026 yet (BEA, 24 Sep 2026).'
          : 'Grey lines: what US firms’ affiliates earned in each economy in ' + yr + ' (BEA' + (yr < 2006 ? ', net of withholding taxes' : '') + ').') + (CH[st.ch < 0 ? 0 : st.ch].quiet && !st.pin ? '' : ' The largest carry their figure.') + ' Streams into China: not collected.';
      } else if (lay === 'paper') {
        const all = val(F.tic.world, yr), rows = Object.keys(F.tic.hold).map(iso => [val(F.tic.hold[iso], yr), node(iso)]).filter(x => x[0] != null && x[1] && x[1].p).sort((a, b) => b[0] - a[0]).slice(0, NTOP);
        const when = yr >= 2026 ? 'in ' + F.tic.last.replace('Sep', 'September') : 'at the end of ' + yr;
        let named = 0;
        rows.forEach(([v, q], i) => { named += v; draw1(line('p' + q.iso), US.p, q.p, rad(US), rad(q), clamp(1 + Math.sqrt(v) / 8, 1.2, 6.5), 'pap', (i % 2 ? -1 : 1) * 10, 'p', 'USA', q.iso); sfx.set(q.id, ' · ' + bnI(v)); });
        const sw = F.swap.peak[String(yr)], dr = (F.swap.drew[String(yr)] || []).slice(0, compact ? 2 : 3).map(node).filter(q => q && q.p);   /* the central banks on the picture that drew most that year: three have room for their names */
        dr.forEach(q => { draw1(line('s' + q.iso), US.p, q.p, rad(US), rad(q), 1.3, 'swp', -22, null, 'USA', q.iso); sfx.set(q.id, (sfx.get(q.id) || '') + ' · swap line'); });
        cap = all == null ? 'Gold lines: US Treasuries held abroad, by country of custody (Treasury TIC). No country figures exist before 2000: no line is drawn for ' + yr + '.'
          : 'Gold lines: US Treasuries held abroad ' + when + ', by country of custody, not ownership (Treasury TIC). All holders ' + bnI(all) + '; the ' + rows.length + ' named ' + bnI(named) + '.';
        if (sw && sw[0] >= 1) cap += ' Dashed: the Fed’s dollar swap lines. Highest level of ' + yr + ': $' + sw[0].toFixed(1) + 'bn, ' + sw[1] + ' (H.4.1).';
      } else if (lay === 'clear') {
        const pos = val(pool.pos, yr), neg = val(pool.neg, yr), nE = val(pool.n, yr);
        if (pos != null) {
          /* the pool stands on the rim of the order while the order is one; between the poles once they have parted */
          const t = clamp((g.e - .55) / .4, 0, 1), k = t * t * (3 - 2 * t), P0 = rimPt(L.ph ? Math.PI * .28 : Math.PI * .2); P = [lerp(P0[0], L.cx, k), lerp(P0[1], L.cy, k)];
          const wv = v => clamp(1.4 + Math.sqrt(v) / 9, 1.6, 5.6);
          [['CHN', 'China'], ['DEU', 'Germany'], ['JPN', 'Japan']].forEach(([iso, nm], i) => { const v = val(pool.bal[iso], yr), q = isoB(iso); if (v == null || v <= 0 || !q || !q.p) return; draw1(line('c' + iso), q.p, P, rad(q), 13, wv(v), 'sur', i ? (i === 1 ? 16 : -16) : 0, 'w', iso, 'pool'); sfx.set(q.id, ' · surplus ' + bnI(v)); });
          const us = val(pool.bal.USA, yr); if (us != null && us < 0) { draw1(line('cUSA'), P, US.p, 13, rad(US) + 3, wv(-us), 'def', 0, 'g', 'pool', 'USA'); sfx.set(US.id, ' · deficit ' + bnI(us)); }
          poolG.setAttribute('transform', `translate(${P[0].toFixed(1)} ${P[1].toFixed(1)})`);
          const up = P[1] > L.cy + 4, t1 = word('pool', 'pt'), t2 = word('pool2', 'fg sur'); t1.textContent = 'Multilateral clearing*'; t2.textContent = 'all surpluses ' + bnI(pos) + ' · all deficits ' + bnI(neg);
          const B = C.pbox(), hw = compact ? 118 : 138, sx = clamp(Sx(P[0]), B.ox + hw + 4, B.ox + B.wp - hw - 4), sy = Sy(P[1]), room = sy + 46 < B.oy + B.hl, dn = up && room;
          /* no room under the pool (a low box): its name stands beside it, on three short lines, clear of the lines that run into it */
          const px = Sx(P[0]), side = up && !dn && !L.ph && px + 20 + 148 < B.ox + B.wp - 4;
          if (side) { const t3 = word('pool3', 'fg sur'); t2.textContent = 'all surpluses ' + bnI(pos); t3.textContent = 'all deficits ' + bnI(neg);
            [t1, t2, t3].forEach((t, j) => { t.setAttribute('x', (px + 20).toFixed(1)); t.setAttribute('text-anchor', 'start'); t.setAttribute('y', (sy - 11 + j * 15).toFixed(1)); });
            st.poolLab = [px + 14, sy - 24, px + 20 + 150, sy + 25]; }
          else { [t1, t2].forEach((t, j) => { t.setAttribute('x', sx.toFixed(1)); t.setAttribute('text-anchor', 'middle'); t.setAttribute('y', (sy + (dn ? 27 + j * 15 : -32 + j * 15)).toFixed(1)); });
            st.poolLab = [sx - hw, sy + (dn ? 15 : -44), sx + hw, sy + (dn ? 47 : -12)]; }
          note = '* No pair of countries settles alone: surpluses meet deficits in one pool, and the pool buys dollar assets.';
          const ex = val(F.cn.exp, yr), mn = val(F.cn.man, yr), cb = val(pool.bal.CHN, yr);
          cap = 'White lines: current-account surpluses run into one pool; gold: what the pool finances. ' + yr + ', ' + nE + ' economies (IMF).' + (cb == null ? ' China: no IMF figure for ' + yr + '.' : '')
            + (ex != null ? ' China’s share of the world’s goods exports: ' + pc1(ex) + (mn != null ? '; of its manufacturing: ' + pc1(mn) : '; of its manufacturing: not collected before 2004') + ' (World Bank).' : '');
        } else cap = 'The clearing pool is drawn to 2025. The IMF’s 2026 figures are projections and are not shown.';
      }
      poolG.style.display = P ? '' : 'none'; st.pool = P; if (!P) st.poolLab = null;
      fxP.forEach(o => { if (!o.used) { o.p.style.display = 'none'; o.pu.style.display = 'none'; } }); fxT.forEach(t => { t.style.display = t.__u ? '' : 'none'; });
      /* chapter 2: the direction in which profit is claimed, ring by ring: dashed and starred, it carries no figure */
      const whyOn = !st.step && st.ch === 1 && lay === 'earn' && g.u < .05;
      if (whyOn) {   /* straight down from the top of the energy ring to the core: the one line through the rings where no sector puts a body */
        const fy = g.f * Math.abs(L.v[1]), x = g.Uc[0], y0 = L.cy - (L.ry[3] + fy) + 2, y1 = g.Uc[1] - US.r * .74 - 8;
        why.setAttribute('d', `M${x.toFixed(1)} ${y0.toFixed(1)}L${x.toFixed(1)} ${y1.toFixed(1)}`); const t = word('why', 'ill'); t.textContent = 'Profit is claimed inward*'; const ty = L.cy - (L.ry[3] + L.ry[4]) / 2 - fy + 4;
        t.setAttribute('x', (Sx(x) + 9).toFixed(1)); t.setAttribute('y', Sy(ty).toFixed(1)); t.setAttribute('text-anchor', 'start'); t.style.display = '';
        st.whyLab = [Sx(x) - 6, Sy(ty) - 12, Sx(x) + 170, Sy(ty) + 6];
        note = '* Illustrative: the direction in which profit is claimed, ring by ring. It carries no figure; the grey lines do.'; }
      else st.whyLab = null;
      why.style.display = whyOn ? '' : 'none';
      st.sfx = sfx;
      if (st.step === 'cl') note = '* No pair of countries settles alone: surpluses meet deficits in one pool, and the pool buys dollar assets. Lines between the poles show a direction only.';   /* step 2's own starred lines */
      if (note !== fnote.textContent) { fnote.textContent = note; st.nk = ''; } fnote.hidden = !note || compact; st.note = note;
      const key = (lay || '') + '|' + yr + '|' + cap.length + '|' + st.ch; if (key !== capKey) { capKey = key; fcap.textContent = cap; fbtn.forEach(b => b.setAttribute('aria-checked', String(b.dataset.layer === lay))); if (C.keyP && C.keyP.__cap) C.keyP.__cap.textContent = cap; }
    }
    function setLayer(k, pin) { if (st.step) return; st.layer = k; st.pin = !!pin; capKey = ''; C.render(st.yf); }
    fsel.addEventListener('click', ev => { const b = ev.target.closest('[data-layer]'); if (b) setLayer(b.dataset.layer, true); });
    fsel.addEventListener('keydown', ev => { const d = ev.key === 'ArrowRight' || ev.key === 'ArrowDown' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowUp' ? -1 : 0; if (!d) return; ev.preventDefault(); ev.stopPropagation(); const i = clamp(LAYERS.findIndex(l => l[0] === st.layer) + d, 0, 2); setLayer(LAYERS[i][0], true); fbtn[i].focus({ preventScroll: true }); });

    /* ---------- the camera: it glides to what the chapter is about, then stays put ---------- */
    let camRaf = 0;
    function camTarget(mode, yEnd) {
      if (mode === 'all' || !mode) return { k: 1, x: 0, y: 0 };
      const k = mode === 'sys' ? (compact ? 1.2 : 1.1) : (compact ? 1.32 : 1.16), cn = C.posAt('CHN', yEnd), us = C.posAt('USA', yEnd);
      const p = mode === 'sys' ? [L.cx, L.cy] : [cn[0] * .65 + us[0] * .35, cn[1] * .65 + us[1] * .35];   /* China, with the centre it stands in still in view */
      const fx = L.cx, fy = L.cy;   /* what is looked at comes to the middle of the picture's box */
      return { k, x: clamp(fx - k * p[0], W - W * k, 0), y: clamp(fy - k * p[1], H - H * k, 0) };
    }
    function camTo(mode, ms, yEnd) {
      if (st.cam === 'user') return; const tg = camTarget(mode, yEnd == null ? st.yf : yEnd); cancelAnimationFrame(camRaf); camRaf = 0;
      if (Math.abs(tg.k - Vw.k) < .002 && Math.abs(tg.x - Vw.x) < .5 && Math.abs(tg.y - Vw.y) < .5) return;
      if (reduce() || !ms) { Vw.k = tg.k; Vw.x = tg.x; Vw.y = tg.y; C.applyView(); return; }
      const a = { k: Vw.k, x: Vw.x, y: Vw.y }, t0 = performance.now();
      const f = now => { if (!wrap.isConnected) return; const t = clamp((now - t0) / ms, 0, 1), q = curve(t); Vw.k = lerp(a.k, tg.k, q); Vw.x = lerp(a.x, tg.x, q); Vw.y = lerp(a.y, tg.y, q); C.applyView(); camRaf = t < 1 ? requestAnimationFrame(f) : 0; };
      camRaf = requestAnimationFrame(f);
    }

    /* ---------- the title card ---------- */
    let tcT = 0;
    function card(i, ms) {
      clearTimeout(tcT); tcard.classList.remove('in'); if (reduce() || st.opening) return;
      tcard.textContent = ''; tcard.append(h('span', 'k', 'Chapter ' + (i + 1) + ' of ' + NCH), h('b', '', chTitle(i))); if (i === 0 && R.q && R.q.textContent) tcard.append(h('p', '', R.q.textContent));
      void tcard.offsetWidth; tcard.classList.add('in'); stage.classList.add('tc'); tcT = setTimeout(() => { tcard.classList.remove('in'); stage.classList.remove('tc'); }, ms || 2200);
    }

    /* ---------- chapters: by the film, by the strip, by the keys, or by the year under the slider ---------- */
    function chSync() {
      const i = idx(); if (i === st.ch) return false; st.ch = i; wrap.dataset.ch = CH[i].id;
      chb.forEach((b, j) => { if (j === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); b.classList.toggle('done', j < i); });
      cnt.textContent = 'Chapter ' + (i + 1) + ' / ' + NCH;   /* a phone held sideways: named, so that it is not read as the bar's count of stations */
      if (!st.pin && CH[i].layer) st.layer = CH[i].layer;
      st.ins = null; st.nk = ''; return true;
    }
    function navSync() {
      const i = st.ch, p = i > 0 ? CH[i - 1] : null, n = i < NCH - 1 ? CH[i + 1] : null;
      bk.hidden = !p; if (p) { bk.textContent = compact ? '← Back' : '← Back: ' + (i === 8 ? 'The story, 2026' : p.s); bk.title = 'Chapter ' + i + ' of ' + NCH + ': ' + chTitle(i - 1); }   /* the button's words are its name; where it goes, in full, is its description */
      fw.textContent = 'Next: ' + (n ? (compact ? n.s : n.step ? n.t : chTitle(i + 1)) : (compact ? 'The full statistics' : 'For economists: the full statistics')) + ' →';
      fw.title = n ? 'Chapter ' + (i + 2) + ' of ' + NCH + ': ' + chTitle(i + 1) : 'For economists: the full statistics';
      if (n) { delete fw.dataset.pv; fw.removeAttribute('data-pv'); } else fw.dataset.pv = 'orb';
      /* the ten chapters are never squeezed: where the row is too narrow, “Back” and then “Next” take their short forms (their full names stay in the labels read aloud) */
      const cut = () => chs.scrollWidth > chs.clientWidth + 1 || (p && bk.scrollWidth > bk.clientWidth + 1) || fw.scrollWidth > fw.clientWidth + 1;
      chs.classList.remove('tight');
      if (!compact && cut()) { if (p) bk.textContent = '← Back'; if (cut()) fw.textContent = 'Next: ' + (n ? n.s : 'The full statistics') + ' →'; if (cut()) chs.classList.add('tight'); }   /* last: the chip of the chapter you are in shows its number only (its title is the heading right under it) */
    }
    /* go to a chapter: the year glides to its first year (a step opens), the camera follows, the title card passes */
    function go(i, how) {
      i = clamp(i, 0, NCH - 1); const c = CH[i]; if (how !== 'film') filmStop();
      st.pin = false; st.cam = st.cam === 'user' ? 'user' : c.cam;
      if (c.step) { C.setStep(c.step); camTo('all', 800); if (how !== 'film') card(i, 1800); return; }
      if (st.step) C.setStep(null);
      if (how !== 'film') { card(i, 1800); C.go(c.y0, reduce() ? 0 : 800); }
      camTo(c.cam, 850, c.y1);
    }
    chl.addEventListener('click', ev => { const b = ev.target.closest('[data-ch]'); if (b) go(+b.dataset.ch, 'user'); });
    bk.addEventListener('click', () => go(st.ch - 1, 'user'));
    fw.addEventListener('click', ev => { if (st.ch < NCH - 1) { ev.stopPropagation(); go(st.ch + 1, 'user'); } else filmStop(); });
    const keyNav = ev => { if (ev.target.closest('input, .orr-fsel, .orr-svg')) return; const d = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : 0; if (!d || ev.ctrlKey || ev.metaKey || ev.altKey) return; const j = clamp(st.ch + d, 0, NCH - 1); if (j === st.ch) return; ev.preventDefault(); go(j, 'user'); if (ev.target.closest('.orr-chs')) (ev.target.closest('.orr-nx') || chb[j]).focus({ preventScroll: true }); };
    dock.addEventListener('keydown', keyNav);

    /* ---------- the film: Play runs the chapters; the year eases between its stops ---------- */
    let film = null;
    const stops = [...new Set(EVS.map(e => e.year).concat(OWN.map(a => a.year)))].sort((a, b) => a - b);
    const words = i => CH[i].step ? 60 : CH[i].p().join(' ').split(/\s+/).length;
    function filmStop() { if (!film) return; cancelAnimationFrame(film.raf); film = null; if (st.playing) { st.playing = false; C.play.textContent = '▶ Play'; C.play.setAttribute('aria-pressed', 'false'); } C.hl(-1, false); }
    function filmFin() { cancelAnimationFrame(film.raf); film = null; st.playing = false; C.play.textContent = '↺ Replay'; C.play.setAttribute('aria-pressed', 'false'); }
    function playToggle() {
      if (film) { filmStop(); return; }
      C.stopYear();
      if (st.ch === NCH - 1) { C.setStep(null); C.stepTo(1995); chSync(); camTo('all', 0); }
      st.playing = true; C.play.textContent = '❚❚ Pause'; C.play.setAttribute('aria-pressed', 'true'); if (st.cam === 'user') st.cam = 'all';
      const rm = reduce(), fresh = Math.abs(st.yf - CH[st.ch].y0) < .01 && !st.step;
      film = { raf: 0, last: performance.now(), wait: 0, tw: null, spent: 0, phase: fresh ? 'card' : 'run' };
      if (fresh) { card(st.ch, 2200); camTo(CH[st.ch].cam, 850, CH[st.ch].y1); film.wait = rm ? .2 : 2.2; } else if (st.step) { film.phase = 'dwell'; film.wait = 4; }
      const frame = now => {
        if (!film) return; if (!C.live()) { filmStop(); return; }
        const dt = Math.min(.1, (now - film.last) / 1000); film.last = now; film.spent += dt; const c = CH[st.ch];
        if (film.tw) { const T = film.tw; T.t += dt; const q = clamp(T.t / T.d, 0, 1); C.stepTo(lerp(T.a, T.b, rm ? 1 : q * q * (3 - 2 * q))); if (q >= 1 || rm) { film.tw = null; film.wait = T.hold; } }
        else if (film.wait > 0) film.wait -= dt;
        else if (c.step) { if (st.ch === NCH - 1) { filmFin(); return; } go(st.ch + 1, 'film'); film.wait = 9; }
        else if (film.phase === 'card') { film.phase = 'run'; film.spent = 0; if (c.id === 'why' && !rm) ringBeats(); }
        else if (film.phase === 'run') {
          const y = st.yf; if (y >= c.y1 - .001) { film.phase = 'dwell'; film.wait = clamp(words(st.ch) / 3.4 - film.spent, 2.2, 8); }
          else { const nxt = stops.find(s => s > y + .001 && s <= c.y1), to = nxt != null ? nxt : c.y1; film.tw = { a: y, b: to, t: 0, d: Math.max(.7, (to - y) * .85), hold: nxt != null ? 1.5 : .2 }; }
        } else {   /* the chapter has been read: on to the next */
          const n = st.ch + 1; film.phase = 'card'; film.spent = 0;
          if (CH[n].step) { go(n, 'film'); film.wait = 9; }
          else { card(n, 2200); camTo(CH[n].cam, 850, CH[n].y1); st.pin = false; film.tw = { a: st.yf, b: CH[n].y0, t: 0, d: rm ? .01 : 1.1, hold: rm ? 1.2 : 1.3 }; }
        }
        film.raf = requestAnimationFrame(frame);
      };
      film.raf = requestAnimationFrame(frame);
    }
    /* chapter 2, when played: each ring is lit as it is named, from the edge to the core */
    function ringBeats() { [3, 2, 1, 0].forEach((k, j) => setTimeout(() => { if (film && st.ch === 1) C.hl(k, true); }, 300 + j * 1100)); setTimeout(() => C.hl(-1, false), 300 + 4 * 1100); }

    /* ---------- the narrator ---------- */
    /* where a sheet scrolls (a phone's narrator, a middle-sized stage's notices), a soft lower edge says there is more */
    const more = () => [nb, nn].forEach(n => n.classList.toggle('more', n.scrollHeight - n.scrollTop - n.clientHeight > 6));
    nb.addEventListener('scroll', more, { passive: true }); nn.addEventListener('scroll', more, { passive: true });
    const scr = ph && compact ? nb : (!wide && !compact ? nn : null); if (scr) { scr.tabIndex = 0; scr.setAttribute('role', 'group'); scr.setAttribute('aria-label', scr === nb ? 'The narration, in full' : 'This year’s notices'); }
    if (C.keyP) C.keyP.tabIndex = 0;
    function notice(box, k, cls, line, src, extra) { box.textContent = ''; box.append(h('span', 'k ' + cls, k), h('p', '', line), h('small', '', 'Source: ' + src)); if (extra) extra.forEach(e => box.append(e)); }
    function narr(yr) {
      chSync(); const i = st.ch, c = CH[i], key = i + '|' + yr + '|' + (st.ins || ''); if (key === st.nk) return; st.nk = key;
      if (st.nch !== i) { st.nch = i; nb.scrollTop = 0; nn.scrollTop = 0; } requestAnimationFrame(more);
      nar.dataset.step = c.step || ''; nz.textContent = ''; navSync();
      kick.textContent = 'Chapter ' + (i + 1) + ' of ' + NCH + (c.step ? ' · after the story' : ''); nz.append(h('h3', 'nt', chTitle(i) + (c.step ? '.' : '')));
      if (c.step) {
        const S = C.stepCopy(c.step); nz.append(h('p', 'd', S.body)); if (S.ast) nz.append(h('p', 'ast', S.ast)); ne.textContent = ''; ni.textContent = '';
        if (S.charts) (compact ? nz : ne).append(S.charts);   /* a middle-sized stage: the two charts stand beside the narration, where a year's notices stand in the story */
        nz.append(h('small', '', S.src)); return;
      }
      nz.append(h('p', 'd', c.p().join(' '))); if (compact && st.note) nz.append(h('p', 'ast', st.note));   /* a phone has no room for the footnote under the picture: it stands under the narration */
      const ev = C.evAt(yr), blocks = [];
      if (yr >= LW) { ne.textContent = ''; ne.append(h('span', 'k e now', '2026 · Pax Silica grows'), h('p', 'x', 'More governments sign through the year: the list stood at 25 signatories beside the United States on 25 Nov 2026 (State Department).')); }   /* 2025's own notice, Pax Silica, is the chapter before */
      else if (ev) notice(ne, ev.year + ' · ' + ev.label, 'e' + (ev.year === yr ? ' now' : ''), ev.line, ev.src, blocks); else ne.textContent = '';
      const ins = st.ins === 'frame' ? null : (st.ins && OWN.find(x => x.id === st.ins)) || C.ownAt(yr);
      if (ins) notice(ni, 'China builds its own · ' + ins.year + ' · ' + (compact && ins.full.length > 34 ? ins.n : ins.full), 't' + (ins.year === yr ? ' now' : ''), ins.line, ins.src);
      else if (st.ins === 'frame') notice(ni, 'The rim · the old order', 't', ORD.frame.line.replace(/^The frame is the old order/, 'The rim is the old order'), ORD.frame.src);
      else notice(ni, 'The rim · China inside it', 't', (/China is already inside it.*$/.exec(ORD.frame.line) || [ORD.frame.line])[0], ORD.frame.src);   /* before China's first institution of its own: where it stands in the old order */
    }

    /* ---------- what a name on the picture must keep clear of ---------- */
    function obstacles(add, out) {
      add(hud); add(fnote.hidden ? null : fnote); if (wide) { add(side); } if (!tcard.classList.contains('in')) { /* the card passes */ }
      if (C.info.dataset.idle !== '1' || wide) add(C.info);
      if (st.poolLab) out.push(st.poolLab); if (st.whyLab) out.push(st.whyLab); if (st.rimLabs) st.rimLabs.forEach(r => out.push(r));
    }

    function draw(g) { chSync(); drawRim(g); drawFx(g); }
    function onSel(q) { wrap.classList.toggle('has-sel', !!q); if (q && !C.info.contains(ix)) C.info.append(ix); }
    function onStep() { chSync(); navSync(); capKey = ''; C.render(st.yf); }   /* the picture is drawn again so that its layer, its starred line and its names are the step's (or the chapter's) own */
    wrap.dataset.layer = st.layer;
    return { box, draw, narr, obstacles, inc, half, playToggle, filmStop, go, chTitle: () => chTitle(st.ch < 0 ? idx() : st.ch), idx, onSel, onStep, fillKey, camTo, dock, chs, nar, hud, wide, land, CH, setLayer, card,
      userView: () => { st.cam = 'user'; cancelAnimationFrame(camRaf); }, resetCam: () => { st.cam = CH[st.ch < 0 ? 0 : st.ch].cam; } };
  };
})();
