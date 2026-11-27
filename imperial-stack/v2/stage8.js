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
   Every figure comes from the file; a year without a row draws no line. Illustrative lines are dashed and starred.

   Round OR9 (26 Nov 2026; handoff claude/handoffs/orrery-stage-or8-review-26-nov.md; review claude/reviews/or8-pacing-review-26-nov.md): the pacing.
   OR8 showed everything at once (113 things on the first frame, the narration longer than its hold in nine chapters of ten). Now:
   · an introduction (three beats: the United States, the rings, China) opens the stage once a visit, after the tab's entry screen has gone;
   · each chapter is told in beats: one short sentence at a time, and the parts of the picture that sentence names appear with it
     (flags, below); nothing of a later chapter is on screen before it; every beat holds longer than its sentence takes to read;
   · the chapter's dated detail (OR8's sentences, the notices, the footnote) is in “Read” (a phone: “More ↓”), never on by default;
   · while the film plays, the tools wait (the choice of flows, the counters, the key, the door, “View as table”, the two links):
     they come back the moment the visitor takes over (pauses, picks a chapter, drags the years, presses Tab). Nothing is deleted;
   · names: the centres, the bodies the sentence is about and, once their ring has been named, the largest economies (faint);
     every other name on hover, on selection, with the visitor's own choice of flows, or with “Show every name” in the key. */
(function () {
  'use strict';
  const X = window.ISX; if (!X) return;
  /* OR9: how the tab's entry screen was closed this visit (“Start at the beginning” is 'go': the film runs on after the introduction) */
  if (X.on) X.on('enter', d => { if (d && d.tab === 'profit' && d.act && d.act !== 'open') X.orrEnterAct = d.act; });
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
    /* OR9: the beats. s: the sentence on the stage; on: what appears with it; at: what appears later in the beat, [seconds, flag…];
       y: the year the beat moves to (eased, about 0.85 s a year); h: how long it holds, in seconds (never less than the sentence takes to read at 200 words a minute, plus a second to look).
       Flags that stay once given (they are the picture's grammar): us, r0–r4 (the rings and their bodies), cn, rim, rimI, rimF, rn0–rn4 (a ring's name, and the largest economies on it),
       aYYYY (China's arcs up to that year), curt, lane. Flags of one chapter only: hl0–hl4 (a ring lit), arrow, fx, def, swap, tic, ppU, ppC, clS, clD, clI, rimL. */
    const IN = { id: 'intro', k: 'Introduction', t: 'How to read the picture', s: 'Introduction', cam: 'all',
      b: [{ s: 'At the centre, the United States.', on: ['us'], h: 3.8 },
        { s: 'Around it, the world economy in rings: the nearer the centre, the higher the place in the chain.', on: ['r0'], at: [[.7, 'r1'], [1.4, 'r2'], [2.1, 'r3'], [2.8, 'r4']], h: 7 },
        { s: 'China starts at the edge. It joins the chain in 2001.', on: ['cn'], h: 5 }] };
    const CH = [
      { id: 'wto', quiet: true, y0: 1995, y1: 1995, k: '1995', t: 'The WTO order', s: 'The WTO order', layer: 'earn', cam: 'all',
        b: [{ s: 'In 1995 the world economy is one order around the United States.', on: ['rim'], h: 5 },
          { s: 'Its institutions are the rim of the picture, from the IMF in 1944 to the WTO in 1995.', on: ['rimI'], h: 6.2 },
          { s: 'China is already inside it: in the IMF and the World Bank since 1980.', on: ['rimF'], h: 5.4 }],
        p: () => ['In 1995 the world economy is one order around the United States: one ladder for the whole world.',
          'Its institutions are the rim of the picture: the IMF and the World Bank (1944), the GATT (1948), the Asian Development Bank (1966) and, from 1995, the WTO.',
          'The order entrenches the world-systems idea: every economy has a place in one chain of production.'] },
      { id: 'why', y0: 1996, y1: 2000, k: '', t: 'Why profit flows to the centre', s: 'Why the centre', layer: 'earn', cam: 'sys',
        b: [{ s: 'At the edge: energy and minerals, then the assembly line.', on: ['rn3', 'hl3'], at: [[1.6, 'rn2', 'hl2'], [2.6, 'nm3'], [3.2, 'rn4'], [3.8, 'nm2']], h: 5.2 },
          { s: 'Nearer the centre: tools, chips and finance. At the core: ownership, design and the dollar.', on: ['rn1', 'hl1'], at: [[1.2, 'nm1'], [2.2, 'rn0', 'hl0'], [3.2, 'nm0']], y: 1997, h: 6.4 },
          { s: 'The mass is made on the outer rings; the profit goes to whoever owns, finances and designs it.', on: ['arrow'], y: 1998, h: 6.2 },
          { s: 'The grey lines measure that claim: what US firms’ affiliates earn in each economy.', on: ['fx'], y: 2000, h: 6.8 }],
        p: () => ['Each ring is a place in that chain. Energy and minerals at the edge; then the assembly line; then tools, chips and the financial centres; at the core, ownership, finance, design and the dollar.',
          'The mass is made on the outer rings, but the profit is claimed by whoever owns, finances and designs: finance is dominant, production is determinant.',
          'The grey lines are that claim, measured: what US firms’ affiliates earned in each economy (BEA). The dashed arrow is illustrative*.'] },
      { id: 'joins', y0: 2001, y1: 2007, k: '2001', t: 'China joins on the assembly ring', s: 'China joins', layer: 'clear', cam: 'cn',
        b: [{ s: 'In December 2001 China joins the WTO, on the assembly ring.', h: 4.8 },
          { s: 'As it grows, its surplus runs into one pool with the world’s other surpluses.', on: ['fx'], y: 2007, h: 8 },
          { s: 'The pool, not China, finances the US deficit: it buys dollar assets.', on: ['def'], h: 5.6 }],
        p: () => ['On 11 December 2001 China joins the WTO, on the assembly ring.',
          'It grows out of the flows: its surplus with the world rises from ' + bnI(cnBal(2001)) + ' in 2001 to ' + bnI(cnBal(2007)) + ' in 2007 (IMF), and its share of the world’s goods exports from ' + pc1(val(F.cn.exp, 2001)) + ' to ' + pc1(val(F.cn.exp, 2007)) + ' (World Bank).',
          'The surplus does not go to the United States directly. No pair of countries settles alone: surpluses meet deficits in one pool, and the pool buys dollar assets.'] },
      { id: 'paper', y0: 2008, y1: 2012, k: '2008', t: 'The dollar is sent out', s: 'The dollar is sent out', layer: 'paper', cam: 'all',
        b: [{ s: 'In September 2008 Lehman Brothers fails. The financial centre is rescued.', h: 5 },
          { s: 'The Federal Reserve sends dollars to other central banks through swap lines.', on: ['swap'], h: 5.4 },
          { s: 'And the paper goes out: the world holds more and more US Treasuries.', on: ['tic'], y: 2012, h: 7.4 }],
        p: () => ['Lehman Brothers fails on 15 September 2008. The financial centre is rescued; the order holds.',
          'The Federal Reserve sends dollars to other central banks through swap lines: $' + F.swap.peak['2008'][0].toFixed(1) + 'bn is outstanding on 17 December 2008 (Fed, H.4.1). The same month the People’s Bank of China signs a currency swap of its own, with the Bank of Korea.',
          'And the paper goes out: at the end of 2008 foreigners hold ' + bnI(val(F.tic.world, 2008)) + ' of US Treasuries, counted by country of custody (Treasury TIC).'] },
      { id: 'own', quiet: true, y0: 2013, y1: 2016, k: '2013–2016', t: 'China builds its own institutions', s: 'China builds its own', layer: 'earn', cam: 'cn',
        b: [{ s: 'China already has circles of its own: the SCO, swap lines and BRICS.', on: ['a2001'], at: [[1.4, 'a2008'], [2.8, 'a2009']], h: 5.6 },
          { s: 'From 2013 it builds more: the Belt and Road, two banks and a payment system.', on: ['a2016'], y: 2016, h: 7.2 },
          { s: 'It does not leave the old order: the rim still holds both.', on: ['rimL'], h: 5.2 }],
        p: () => ['China builds institutions of its own: the Belt and Road (2013), the New Development Bank (2014), the payment system CIPS (2015), the Asian Infrastructure Investment Bank (2016).',
          'They join the Shanghai Cooperation Organisation (2001), its swap lines (2008) and BRICS (2009): the arcs round China.',
          'It does not leave the old order: it keeps its seat at the IMF and the World Bank and its place in the WTO. The rim still holds both.'] },
      { id: 'squeeze', quiet: true, y0: 2017, y1: 2024, k: '2017–2024', t: 'The squeeze', s: 'The squeeze', layer: 'earn', cam: 'all',
        b: [{ s: 'Washington turns on the order it built.', h: 3.8 },
          { s: 'From December 2019 the WTO can no longer hear appeals.', y: 2019, h: 5.2 },
          { s: 'In 2022 Russia’s reserves are frozen and chip controls hit China: the one system is pulled apart.', y: 2024, h: 8.4 }],
        p: () => ['Washington turns on the order it built. In 2017 its Trade Representative opens an investigation into China’s technology practices.',
          'From December 2019 the WTO’s Appellate Body can no longer hear appeals: Washington had blocked every new appointment since 2017.',
          'In 2022 Russia’s central bank reserves are frozen, and the first chip export controls on China follow in October. The one system is pulled apart.'] },
      { id: 'poles', quiet: true, y0: 2025, y1: 2025, k: '2025', t: 'Two poles', s: 'Two poles', layer: 'earn', cam: 'all',
        b: [{ s: 'In 2025 come tariffs on the whole world.', h: 4.2 },
          { s: 'Then Pax Silica: a US-led coalition on chips and AI, behind a silicon curtain.', on: ['curt'], h: 5.8 },
          { s: 'One order has become two poles. Some economies stand between them.', on: ['lane'], h: 5.4 }],
        p: () => ['In April 2025 come tariffs on the whole world; on 12 December 2025, Pax Silica: the silicon curtain.',
          'Pax Silica is the US-led coalition on AI and semiconductor supply chains: a new way to entrench value and supply chains around the United States, and to decide who may hold the tools.',
          'One order has become two poles. The economies that stand between the two systems are named on the band between them.'] },
      { id: 'now', y0: 2026, y1: 2026, k: '2026', t: 'WAICO, and the order as it stands', s: '2026', layer: 'earn', cam: 'all',
        b: [{ s: 'On 16 July 2026, in Shanghai, twenty-nine countries sign the agreement that founds WAICO.', on: ['a2026'], h: 6.2 },
          { s: 'Some economies are on both lists; some are on neither.', on: ['lists'], h: 4.6 },
          { s: 'And profit still flows to the centre.', on: ['fx'], h: 5.4 }],
        p: () => { const t = h1Top(); return ['On 16 July 2026 twenty-nine countries sign the agreement that founds the World Artificial Intelligence Cooperation Organization, in Shanghai: China’s list beside Washington’s.',
          'Pax Silica grows through the year: the State Department’s list, read on 21 Nov 2026, names 24 states and the European Union beside the United States, 26 parties in all.',
          'Profit still flows to the centre: in the first half of 2026 US firms’ affiliates earned ' + bn1(t[1]) + ' in ' + (/^(Netherlands|United Kingdom)$/.test(nameOf(t[0])) ? 'the ' : '') + nameOf(t[0]) + ' alone (BEA).']; } },
      { id: 'pp', step: 'pp', k: 'After the story', t: STEPS.pp.title, s: STEPS.pp.short, layer: null, cam: 'all',
        b: [{ s: 'US firms’ share of the profits of the world’s largest listed firms has risen.', on: ['ppU'], at: [[1.6, 'ppUw']], h: 5.6 },
          { s: 'China’s share of the world’s manufacturing has risen too.', on: ['ppC'], at: [[1.4, 'ppCw']], h: 4.6 },
          { s: 'One gathers at the centre; the other moves to China.', h: 4.6 }] },
      { id: 'cl', step: 'cl', k: 'After the story', t: STEPS.cl.title, s: STEPS.cl.short, layer: null, cam: 'all',
        b: [{ s: 'China’s surplus runs into the same pool as the other surpluses.', on: ['clP'], at: [[1.6, 'clS'], [2.8, 'clS2']], h: 5.4 },
          { s: 'The pool finances the US deficit.', on: ['clD'], h: 4.2 },
          { s: 'Goods go one way, dollars the other: China finances the system it competes with.', on: ['clI'], h: 6.2 }] }];
    const NCH = CH.length, byYear = y => { for (let i = 7; i >= 0; i--) if (y >= CH[i].y0) return i; return 0; };
    /* OR9: which flags stay once given, and the flags in force at a place in the story (chapter i, beat b, t seconds into it; the intro is chapter −1) */
    const STICKY = /^(us|r[0-4]|cn|rim|rimI|rimF|rn[0-4]|nm[0-4]|a\d{4}|curt|lane|lists)$/;
    const beatsOf = i => i < 0 ? IN.b : CH[i].b;
    const flagsAt = (i, b, t) => {
      const F = [], add = (B, tt, sticky) => { (B.on || []).forEach(f => { if (!sticky || STICKY.test(f)) F.push(f); }); (B.at || []).forEach(a => { if (tt >= a[0]) a.slice(1).forEach(f => { if (!sticky || STICKY.test(f)) F.push(f); }); }); };
      const upTo = B => B.forEach((x, j) => { if (j < b) add(x, 1e9, false); else if (j === b) add(x, t, false); });
      if (i < 0) { upTo(IN.b); return F; }
      IN.b.forEach(x => add(x, 1e9, true)); for (let c = 0; c < i; c++) CH[c].b.forEach(x => add(x, 1e9, true));
      upTo(CH[i].b); return F; };
    const words = s => s.split(/\s+/).filter(Boolean).length;
    const idx = () => st.step === 'pp' ? 8 : st.step === 'cl' ? 9 : byYear(Math.round(st.yf));
    const chTitle = i => (CH[i].k && !CH[i].step ? CH[i].k + ' · ' : '') + CH[i].t;
    st.layer = 'earn'; st.pin = false; st.ch = -1; st.cam = 'all';
    st.bt = null; st.fl = new Set(); st.intro = false; st.allNames = !!X.orrAllNames;   /* OR9: where the story stands (chapter, beat, seconds into it) and the flags in force */

    /* ---------- the stage's parts ---------- */
    const hud = h('div', 'orr-hud'), dock = h('div', 'orr-dock'), side = h('div', 'orr-side'), tcard = h('div', 'orr-tc'); tcard.setAttribute('aria-hidden', 'true');
    /* which flows are on the picture: three choices, one at a time; the chapter picks one unless the visitor has */
    const LAYERS = [['earn', 'Earnings in'], ['paper', 'Paper out'], ['clear', 'Clearing']];
    const fsel = h('div', 'orr-fsel'); fsel.setAttribute('role', 'radiogroup'); fsel.setAttribute('aria-label', 'Flows on the picture');
    fsel.append(h('span', 'fk', 'Flows'));
    const fbtn = LAYERS.map(([k, t]) => { const b = h('button', 'orr-fb l-' + k); b.type = 'button'; b.setAttribute('role', 'radio'); b.dataset.layer = k; b.append(h('i'), t); fsel.append(b); return b; });
    const fcap = h('p', 'orr-fcap'); fcap.setAttribute('aria-live', 'polite');
    const fnote = h('p', 'orr-fn'); fnote.hidden = true;
    /* phones: one short line that says what the lines on the picture measure (the full caption is in the key) */
    const fc1 = h('p', 'orr-fc1'); fc1.hidden = true;
    /* a phone held upright: the narration's sheet says when there is more to read */
    const moreB = h('button', 'orr-more', 'More ↓'); moreB.type = 'button'; moreB.hidden = true; moreB.setAttribute('aria-label', 'Read more of this chapter');
    /* the narrator: the chapter's narration, and beside it what the timeline marks at this year */
    const nar = h('section', 'orr-nar'); nar.setAttribute('aria-label', 'The narration');
    const nb = h('div', 'nb'), nz = h('div', 'nz'), nn = h('div', 'nn'), ne = h('div', 'ne'), ni = h('div', 'ni orr-ins'); nn.append(ne, ni); nb.append(nz, nn);
    /* OR9: the chapter's title, the one sentence on the stage now (read aloud as it changes), and the chapter in full for “Read” */
    const nt = h('h3', 'nt'), bt = h('p', 'bt'), fullT = h('div', 'full'); bt.setAttribute('aria-live', 'polite'); nz.append(nt, bt, fullT);
    /* OR9: “Read” (a phone: “More ↓”) opens the chapter in full: its sentences, OR8's dated detail, the footnote and the year's notices */
    const nxT = o => compact && ph ? (o ? 'Less ↑' : 'More ↓') : (o ? 'Close' : 'Read');
    const nx = h('button', 'orr-nexp'); nx.type = 'button'; nx.setAttribute('aria-expanded', 'false'); nx.textContent = nxT(false); nx.title = 'This chapter in full, with its figures and sources';   /* its name is its words (axe: label-content-name-mismatch) */
    const openNar = o => { nar.classList.toggle('open', o); if (o) { nb.tabIndex = 0; nb.setAttribute('role', 'group'); nb.setAttribute('aria-label', 'The chapter in full'); } else if (nb.getAttribute('aria-label') === 'The chapter in full') { nb.removeAttribute('tabindex'); nb.removeAttribute('role'); nb.removeAttribute('aria-label'); }   /* open, the sheet scrolls: it takes the focus (axe: scrollable-region-focusable) */ nx.setAttribute('aria-expanded', String(o)); nx.textContent = nxT(o); if (o) takeOver(); requestAnimationFrame(() => { more(); st.ob = null; }); };
    nx.addEventListener('click', () => openNar(!nar.classList.contains('open')));
    /* the chapter strip, the narrator's head: where you are, ten chapters, back, and the one way forward */
    const kick = h('span', 'k nk'), chs = h('nav', 'orr-chs'); chs.setAttribute('aria-label', 'Chapters: eight of the story, then two steps. Left and right arrows move between them.');
    const bk = h('button', 'orr-nx bk'), fw = h('button', 'orr-nx fw'); bk.type = 'button'; fw.type = 'button';
    const chl = h('div', 'chl'); chl.setAttribute('role', 'list');
    const chb = CH.map((c, i) => { const li = h('span'); li.setAttribute('role', 'listitem'); const b = h('button', 'orr-chp' + (c.step ? ' orr-stp' : '')); b.type = 'button'; b.dataset.ch = i; if (c.step) b.dataset.step = c.step; b.append(h('small', '', String(i + 1))); b.dataset.s = c.s;   /* the short title beside the number of the chapter you are in is drawn from this (css), so the button's own text is its number and its name for a screen reader is the label */ b.setAttribute('aria-label', 'Chapter ' + (i + 1) + ' of ' + NCH + ': ' + chTitle(i)); b.title = chTitle(i); li.append(b); chl.append(li); return b; });
    const cnt = h('span', 'orr-cnt'); cnt.setAttribute('aria-hidden', 'true');
    chs.append(kick, chl, cnt, bk, fw); nar.append(chs, nb, nx);
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
    stage.append(hud, C.info, side, fnote, tcard, dock); if (compact) (ph ? stage : hud).append(fc1);
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
      /* OR9: the picture names the bodies the story is about; this shows every name, as OR8 did */
      const an = h('button', 'orr-alln'); an.type = 'button'; an.setAttribute('aria-pressed', String(st.allNames)); an.textContent = 'Show every name';
      an.addEventListener('click', () => { st.allNames = !st.allNames; X.orrAllNames = st.allNames; an.setAttribute('aria-pressed', String(st.allNames)); C.render(st.yf); }); box.append(an);
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
    /* the picture fades at its box's edges only while the camera has moved in (then bodies reach past the box); at rest the mask is off,
       since a mask over a moving picture makes the browser repaint all of it every frame */
    let boxMask = '', maskOn = null;
    function maskSync() { const on = !!boxMask && (Vw.k > 1.01 || Math.abs(Vw.x) > .5 || Math.abs(Vw.y) > .5); if (on === maskOn) return; maskOn = on; const m = on ? boxMask : '';
      svg.style.webkitMaskImage = m; svg.style.maskImage = m; svg.style.webkitMaskComposite = on ? 'source-in' : ''; svg.style.maskComposite = on ? 'intersect' : ''; }
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
      const mid = !wide && !land && !ph, ox = wide ? COL : mid ? MIDL : land ? LANDL : 0, oxr = wide ? COL : 0, oy = full ? (ph ? 100 : compact ? 44 : 58) : wide ? top + 4 : ph ? 46 : Math.max(top, ht, rcb) + 2, hl = Math.max(120, H - oy - dh - (compact ? (ph ? 20 : 4) : mid ? 36 : 22));   /* a large stage keeps a strip under the picture for the footnote of a starred line */
      stage.style.setProperty('--boxw', (W - ox - oxr - 16) + 'px'); stage.style.setProperty('--boxc', (ox + (W - ox - oxr) / 2) + 'px');
      const m = 'linear-gradient(to right, transparent ' + Math.max(0, ox - 26) + 'px, #000 ' + (ox + 6) + 'px, #000 ' + (W - oxr - 6) + 'px, transparent ' + Math.min(W, W - oxr + 26) + 'px), linear-gradient(to bottom, transparent ' + Math.max(0, oy - 12) + 'px, #000 ' + (oy + 4) + 'px, #000 ' + (oy + hl) + 'px, transparent ' + (oy + hl + 22) + 'px)';
      boxMask = m; maskOn = null; maskSync();
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
    /* the button is the rim's line; its printed words stand beside it, hidden from screen readers (the button's name says them), and take the same click */
    gRim.append(rimP); const gW = el('g', { class: 'orr-rimw', 'aria-hidden': 'true' }); gW.append(tTop, tBot, tFoot);
    const gR = el('g', { class: 'orr-rimg' }); gR.append(gRim, gW); gT.parentNode.insertBefore(gR, gT);
    /* the printed words repeat the name, so a screen reader hears the name once; it starts with the words on the rim, so speech input finds it */
    gRim.setAttribute('aria-label', 'The WTO order, 1995–, the rim of the picture: the old order. ' + ORD.frame.line);   /* it starts with the words printed on the rim, so speech input finds it */
    const pickFrame = () => { if (st.step) return; st.ins = 'frame'; C.narrate(Math.round(st.yf)); };
    gRim.addEventListener('click', pickFrame); gW.addEventListener('click', pickFrame); gRim.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pickFrame(); } });
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
      const cw = compact ? 7.1 : 7.9, longW = (NAME.length + 5 + INST.length) * cw, mode = lt > longW + 30 ? 'long' : 'short', inst = mode === 'long' && st.fl.has('rimI'), mk = mode + (inst ? 'i' : '');   /* OR9: the institutions join the order's name when the sentence names them */
      if (mk !== rimMode) { rimMode = mk; tpTop.textContent = ''; tpTop.append(el('tspan', { class: 'hd' }, NAME)); if (inst) tpTop.append(el('tspan', { class: 'in' }, '  ·  ' + INST)); tTop.classList.remove('rf'); void tTop.getBoundingClientRect(); tTop.classList.add('rf'); }
      const botW = (15 + cnS.reduce((s, t) => s + t.textContent.length, 0)) * cw, showB = lb > botW + 24 && st.fl.has('rimF'); tBot.style.display = showB ? '' : 'none'; st.rimShort = mode === 'short' || lb <= botW + 24;
      cnS[2].style.visibility = g.yr0 < ORD.cn[2][1] ? 'hidden' : '';
      const PB = C.pbox(); tTop.style.display = cy - b - 14 < PB.oy - 12 ? 'none' : ''; if (cy + b + 16 > PB.oy + PB.hl + (compact ? 2 : 6)) tBot.style.display = 'none';
      /* the words stand outside the rim: no name inside it can meet them. When the camera has moved in, bodies reach the frame: then the words are kept clear */
      const foot = compact && H > W;   /* a phone held upright, whichever way the picture is laid out */ tFoot.style.display = foot && cy + b + 16 <= PB.oy + PB.hl + 4 ? '' : 'none'; if (foot) { tTop.style.display = 'none'; tBot.style.display = 'none'; if (st.layer === 'clear' && !st.step && u < .5) tFoot.style.display = 'none'; }   /* the pool and its name stand on the rim's foot: the order's name steps aside while they are drawn */
      if (compact && !L.ph && st.layer === 'clear' && !st.step && u < .5) tBot.style.display = 'none';
      tpBot.setAttribute('startOffset', wide && st.layer === 'clear' && !st.step && u < .5 ? '38%' : '50%');   /* a larger stage: the lower line slides left of the pool, which stands on the rim at its lower right */   /* a phone held sideways: the pool stands on the rim's lower edge, so its lower line steps aside while the pool is drawn */   /* the clearing pool and its name stand at the lower right: the order's name moves to the lower left */
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
    /* OR9: the largest earnings lines of the year, worked out once a frame (the picture draws its streams before the stage draws its layer) */
    let topK = '', topV = [];
    const earnTop = () => { const k = st.yf.toFixed(3); if (k !== topK) { topK = k; topV = C.list.filter(q => !q.core && q.vis !== false && q.p).map(q => [inc(q, st.yf), q]).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0]).slice(0, NTOP); } return topV; };
    /* which bodies carry a grey line now: every one when the visitor has picked “Earnings in”; else the largest, once the beat names the lines; and the body picked */
    const streamOn = q => st.step ? false : st.layer !== 'earn' ? false : st.pin || q.id === st.sel || (st.fl.has('fx') && earnTop().some(x => x[1] === q));
    /* a body's name: 'lit' (the centres once introduced), 'faint' (the largest economies once their ring is named), 'all' (every name), 'off' */
    const MAIN = 2.5;   /* % of world GDP: the phone's rule for a name that always shows */
    /* OR9: the economies named as context are a fixed set, the ones whose share reaches 2.5% in some year from 1995 to 2026 (eleven with the two centres), so no name appears or goes as the years move */
    const big = q => { if (q.__big === undefined) { const a = q.d && q.d.share ? q.d.share.filter(v => v != null) : []; q.__big = a.length ? Math.max.apply(null, a) >= MAIN : false; } return q.__big; };
    const nameMode = q => {
      if (q.core) return st.fl.has(q.china ? 'cn' : 'us') ? 'lit' : 'off';
      if (!st.fl.has('r' + clamp(q.b.wring, 0, 4))) return 'off';
      if ((st.allNames || st.pin) && !compact) return 'all';
      if (compact && (st.allNames || st.pin)) return null;   /* a phone keeps its own rule: the big bodies, more as you zoom */
      return !q.bk && big(q) && st.fl.has('nm' + clamp(q.b.wring, 0, 4)) ? 'faint' : 'off'; };   /* a ring's economies are named a moment after the ring */
    /* China's arcs: each from its date, and only once the story has come to it */
    const arcOk = a => st.step ? true : [...st.fl].some(f => /^a\d{4}$/.test(f) && +f.slice(1) >= a.year);
    let capKey = '';
    function drawFx(g) {
      const yr = g.yr0, lay = st.step ? null : st.layer, sfx = new Map(), US = isoB('USA'), CN = isoB('CHN');
      fxP.forEach(o => { o.used = false; }); fxT.forEach(t => { t.__u = false; });
      wrap.dataset.layer = lay || ''; let note = '', cap = '', P = null;
      const fxOn = k => st.pin || st.fl.has(k);   /* OR9: a layer's lines are drawn when the beat names them, or when the visitor has picked the layer */
      if (lay === 'earn') {
        const top = earnTop(), on = fxOn('fx');
        if (on) top.forEach(([v, q]) => sfx.set(q.id, ' · ' + bn1(v)));
        st.puTop = new Set(top.map(([, q]) => q.id));   /* only the largest lines carry a pulse: the flow reads as moving, and the picture is not repainted for dozens of them every frame */
        cap = (half(st.yf) ? 'Grey lines: what US firms’ affiliates earned in each economy in the first half of 2026: six months, there is no full 2026 yet (BEA, 24 Sep 2026).'
          : 'Grey lines: what US firms’ affiliates earned in each economy in ' + yr + ' (BEA' + (yr < 2006 ? ', net of withholding taxes' : '') + ').') + (st.pin ? ' The largest carry their figure.' : on ? ' The ' + top.length + ' largest are drawn, with their figures; pick “Earnings in” for every line.' : ' Pick “Earnings in” to draw them.') + ' Streams into China: not collected.';
      } else if (lay === 'paper') {
        const all = val(F.tic.world, yr), rows = Object.keys(F.tic.hold).map(iso => [val(F.tic.hold[iso], yr), node(iso)]).filter(x => x[0] != null && x[1] && x[1].p).sort((a, b) => b[0] - a[0]).slice(0, NTOP);
        const when = yr >= 2026 ? 'in ' + F.tic.last.replace('Sep', 'September') : 'at the end of ' + yr;
        let named = 0; if (!fxOn('tic')) rows.length = 0;
        rows.forEach(([v, q], i) => { named += v; draw1(line('p' + q.iso), US.p, q.p, rad(US), rad(q), clamp(1 + Math.sqrt(v) / 8, 1.2, 6.5), 'pap', (i % 2 ? -1 : 1) * 10, 'p', 'USA', q.iso); sfx.set(q.id, ' · ' + bnI(v)); });
        const sw = F.swap.peak[String(yr)], dr = (fxOn('swap') ? F.swap.drew[String(yr)] || [] : []).slice(0, compact ? 2 : 3).map(node).filter(q => q && q.p);   /* the central banks on the picture that drew most that year: three have room for their names */
        dr.forEach(q => { draw1(line('s' + q.iso), US.p, q.p, rad(US), rad(q), 1.3, 'swp', -22, null, 'USA', q.iso); sfx.set(q.id, (sfx.get(q.id) || '') + ' · swap line'); });
        cap = all == null ? 'Gold lines: US Treasuries held abroad, by country of custody (Treasury TIC). No country figures exist before 2000: no line is drawn for ' + yr + '.'
          : 'Gold lines: US Treasuries held abroad ' + when + ', by country of custody, not ownership (Treasury TIC). All holders ' + bnI(all) + '; the ' + rows.length + ' named ' + bnI(named) + '.';
        if (sw && sw[0] >= 1) cap += ' Dashed: the Fed’s dollar swap lines. Highest level of ' + yr + ': $' + sw[0].toFixed(1) + 'bn, ' + sw[1] + ' (H.4.1).';
      } else if (lay === 'clear') {
        const pos = val(pool.pos, yr), neg = val(pool.neg, yr), nE = val(pool.n, yr);
        if (pos != null && !fxOn('fx')) cap = 'White lines: current-account surpluses run into one pool; gold: what the pool finances (IMF, ' + yr + '). Pick “Clearing” to draw them.';
        else if (pos != null) {
          /* the pool stands on the rim of the order while the order is one; between the poles once they have parted */
          const t = clamp((g.e - .55) / .4, 0, 1), k = t * t * (3 - 2 * t), P0 = rimPt(L.ph ? Math.PI * .28 : Math.PI * .2); P = [lerp(P0[0], L.cx, k), lerp(P0[1], L.cy, k)];
          const wv = v => clamp(1.4 + Math.sqrt(v) / 9, 1.6, 5.6);
          [['CHN', 'China'], ['DEU', 'Germany'], ['JPN', 'Japan']].forEach(([iso, nm], i) => { const v = val(pool.bal[iso], yr), q = isoB(iso); if (v == null || v <= 0 || !q || !q.p) return; draw1(line('c' + iso), q.p, P, rad(q), 13, wv(v), 'sur', i ? (i === 1 ? 16 : -16) : 0, 'w', iso, 'pool'); sfx.set(q.id, ' · surplus ' + bnI(v)); });
          const us = val(pool.bal.USA, yr); if (us != null && us < 0 && fxOn('def')) { draw1(line('cUSA'), P, US.p, 13, rad(US) + 3, wv(-us), 'def', 0, 'g', 'pool', 'USA'); sfx.set(US.id, ' · deficit ' + bnI(us)); }
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
          cap = 'White lines: current-account surpluses run into one pool; gold: what the pool finances. ' + yr + ', ' + nE + ' economies (IMF). The two totals differ: as measured, the world’s current accounts do not add up to zero.' + (cb == null ? ' China: no IMF figure for ' + yr + '.' : '')
            + (ex != null ? ' China’s share of the world’s goods exports: ' + pc1(ex) + (mn != null ? '; of its manufacturing: ' + pc1(mn) : '; of its manufacturing: not collected before 2004') + ' (World Bank).' : '');
        } else cap = 'The clearing pool is drawn to 2025. The IMF’s 2026 figures are projections and are not shown.';
      }
      poolG.style.display = P ? '' : 'none'; st.pool = P; if (!P) st.poolLab = null;
      fxP.forEach(o => { if (!o.used) { o.p.style.display = 'none'; o.pu.style.display = 'none'; } }); fxT.forEach(t => { t.style.display = t.__u ? '' : 'none'; });
      /* chapter 2: the direction in which profit is claimed, ring by ring: dashed and starred, it carries no figure */
      const whyOn = !st.step && st.ch === 1 && lay === 'earn' && g.u < .05 && st.fl.has('arrow');
      if (whyOn) {   /* straight down from the top of the energy ring to the core: the one line through the rings where no sector puts a body */
        const fy = g.f * Math.abs(L.v[1]), x = g.Uc[0], y0 = L.cy - (L.ry[3] + fy) + 2, y1 = g.Uc[1] - US.r * .74 - 8;
        why.setAttribute('d', `M${x.toFixed(1)} ${y0.toFixed(1)}L${x.toFixed(1)} ${y1.toFixed(1)}`); const t = word('why', 'ill'), ty = L.cy - (L.ry[3] + L.ry[4]) / 2 - fy + 4;
        /* the claim in two lines on the picture itself, beside the arrow: where the mass is made, and where the profit is claimed */
        if (t.__two !== true) { t.textContent = ''; t.append(el('tspan', {}, 'Made on the outer rings,'), el('tspan', { dy: 14 }, 'claimed at the core*')); t.__two = true; }
        const lft = compact && H > W, tx = Sx(x) + (lft ? -9 : 9);   /* a phone upright: left of the arrow, clear of the buttons at the upper right */
        t.setAttribute('x', tx.toFixed(1)); t.setAttribute('y', Sy(ty).toFixed(1)); t.setAttribute('text-anchor', lft ? 'end' : 'start'); [...t.children].forEach(n => n.setAttribute('x', tx.toFixed(1))); t.style.display = '';
        st.whyLab = lft ? [Sx(x) - 172, Sy(ty) - 12, Sx(x) + 6, Sy(ty) + 20] : [Sx(x) - 6, Sy(ty) - 12, Sx(x) + 172, Sy(ty) + 20];
        note = '* Illustrative: the direction in which profit is claimed, ring by ring. It carries no figure; the grey lines do.'; }
      else st.whyLab = null;
      why.style.display = whyOn ? '' : 'none';
      st.sfx = sfx;
      if (st.step === 'cl' && st.fl.has('clS')) note = '* No pair of countries settles alone: surpluses meet deficits in one pool, and the pool buys dollar assets. Lines between the poles show a direction only.';   /* OR9: with the first line into the pool */   /* step 2's own starred lines */
      if (note !== fnote.textContent) { fnote.textContent = note; st.nk = ''; } fnote.hidden = !note || compact; st.note = note;
      if (compact) { const tx = st.step ? '' : lay === 'earn' ? 'Grey lines: US firms’ affiliates’ income there, ' + (half(st.yf) ? 'first half of 2026' : yr) + ' (BEA)'
          : lay === 'paper' ? (yr < 2000 ? 'Gold lines: US Treasuries held abroad; none by country before 2000' : 'Gold lines: US Treasuries held there, ' + (yr >= 2026 ? 'Sep 2026' : 'end ' + yr) + ' (TIC)')
          : lay === 'clear' ? (yr <= 2025 ? 'Surpluses into one pool; gold: what it finances (IMF, ' + yr + ')' : 'The clearing pool is drawn to 2025 (IMF)') : '';   /* one line on a phone; the full caption is in the key */
        if (fc1.textContent !== tx) fc1.textContent = tx; fc1.hidden = !tx; }
      /* after the split, the dark lane between the two systems carries its name */
      if (!st.step && g.e >= .9 && st.fl.has('curt')) { const PB = C.pbox(), t = word('curt', 'ctn'); t.textContent = 'Silicon curtain';
        if (!L.ph) { const x = Sx(L.cx), y = Sy(PB.oy + PB.hl * (compact ? .7 : .5));   /* phones: below the names of China's arcs */ t.setAttribute('x', x.toFixed(1)); t.setAttribute('y', (y + 4).toFixed(1)); t.setAttribute('text-anchor', 'middle'); t.setAttribute('transform', 'rotate(-90 ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')'); st.curtLab = [x - 8, y - 64, x + 8, y + 64]; }
        else { const x = Sx(PB.ox) + 12, y = Sy(PB.oy + PB.hl * .5) + 4; t.removeAttribute('transform'); t.setAttribute('x', x.toFixed(1)); t.setAttribute('y', y.toFixed(1)); t.setAttribute('text-anchor', 'start'); st.curtLab = [x - 4, y - 10, x + 124, y + 4]; }
        t.style.opacity = clamp((g.e - .9) / .1, 0, 1).toFixed(2); t.style.display = ''; } else st.curtLab = null;
      /* OR9: the band's two names (“on both lists”, “on neither list”) come with chapter 8's sentence about them; till then it is the band between the two systems */
      gT.querySelectorAll('.orr-lt').forEach((t, i) => { const tx = yr >= LW && st.fl.has('lists') ? (i ? 'ON NEITHER LIST' : 'ON BOTH LISTS') : 'BETWEEN THE TWO SYSTEMS'; if (t.textContent !== tx) t.textContent = tx; });
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
    const CARD = 1.8;   /* seconds a chapter's card holds before its first beat */
    function card(i, ms) {
      clearTimeout(tcT); tcard.classList.remove('in'); stage.classList.remove('tc'); if (reduce()) return;
      tcard.textContent = ''; tcard.append(h('span', 'k', 'Chapter ' + (i + 1) + ' of ' + NCH), h('b', '', chTitle(i)));   /* OR9: the tab's line moved from this card to chapter 1's “Read” */
      void tcard.offsetWidth; tcard.style.setProperty('--tcd', (ms || 2200) + 'ms'); tcard.classList.add('in'); stage.classList.add('tc'); tcT = setTimeout(() => { tcard.classList.remove('in'); stage.classList.remove('tc'); }, ms || 2200);
    }

    /* ---------- OR9: the flags in force, and what they light ---------- */
    const FLAGS = ['us', 'r0', 'r1', 'r2', 'r3', 'r4', 'cn', 'rim', 'rimI', 'rimF', 'rn0', 'rn1', 'rn2', 'rn3', 'rn4', 'curt', 'lane', 'lists', 'arrow', 'fx', 'def', 'swap', 'tic', 'ppU', 'ppC', 'ppUw', 'ppCw', 'clP', 'clS', 'clS2', 'clD', 'clI', 'rimL'];
    C.list.forEach(q => { if (q.core) q.g.classList.add('ctr', q.china ? 'cn' : 'us'); });
    svg.querySelectorAll('.orr-rings ellipse').forEach((e, j) => { e.dataset.k = String(Math.floor(j / 3)); });
    gT.querySelectorAll('.orr-rl').forEach((t, j) => { t.dataset.k = String(j); });
    let btKey = '';
    function sayLine() {   /* the sentence on the stage: the beat's; a chapter reached by the years (no beat running) shows its sentences together */
      const B = st.bt; let s = '';
      if (B && B.b >= 0) { const L = beatsOf(B.ch); if (L[B.b]) s = B.t >= 1e9 ? L.map(x => x.s).join(' ') : L[B.b].s; }
      if (s === btKey) return; btKey = s; bt.classList.remove('in'); void bt.offsetWidth; bt.textContent = s; bt.classList.toggle('all', !!B && B.t >= 1e9); if (s) bt.classList.add('in'); requestAnimationFrame(more);
    }
    function setBeat(i, b, t, quiet) {
      const chg = !st.bt || st.bt.ch !== i; st.bt = { ch: i, b, t };
      const F = new Set(flagsAt(i, b, t)), was = [...st.fl].sort().join(), now = [...F].sort().join(); st.fl = F;
      FLAGS.forEach(f => wrap.classList.toggle('b-' + f, F.has(f)));
      const B = b >= 0 ? beatsOf(i)[b] : null; let hk = -1;   /* the ring the sentence names, lit */
      if (B) { (B.on || []).forEach(f => { if (/^hl\d$/.test(f)) hk = +f[2]; }); (B.at || []).forEach(a => { if (t >= a[0]) a.slice(1).forEach(f => { if (/^hl\d$/.test(f)) hk = +f[2]; }); }); }
      if (hk !== st.hk) { st.hk = hk; C.hl(hk, hk >= 0); }
      if (chg) { st.nk = ''; narr(Math.round(st.yf)); } sayLine();
      if (was !== now) { capKey = ''; st.ob = null; if (!quiet) C.render(st.yf); }
    }
    /* while the film plays the tools wait; they come back the moment the visitor takes over (or reaches for them with the keyboard) */
    function calmSync() { wrap.classList.toggle('calm', (st.intro || (!!run && run.film)) && !st.reach); }
    function takeOver() { if (run && run.film) pause(); st.reach = true; calmSync(); }
    stage.addEventListener('focusin', ev => { if (ev.target.matches && ev.target.matches(':focus-visible') && !ev.target.closest('.orr-svg')) { st.reach = true; calmSync(); } });

    /* ---------- chapters: by the film, by the strip, by the keys, or by the year under the slider ---------- */
    function chSync() {
      const i = idx(); let moved = false;
      if (i !== st.ch) { moved = true; st.ch = i; wrap.dataset.ch = CH[i].id;
        chb.forEach((b, j) => { if (j === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); b.classList.toggle('done', j < i); });
        cnt.textContent = 'Chapter ' + (i + 1) + ' / ' + NCH;   /* a phone held sideways: named, so that it is not read as the bar's count of stations */
        if (!st.pin && CH[i].layer) st.layer = CH[i].layer;
        st.ins = null; st.nk = ''; }
      /* OR9: a chapter reached by the years, with no beat running, stands as told to its end; the picture is drawn again with its flags */
      if (!run && !st.intro && (!st.bt || st.bt.ch !== i)) { setBeat(i, CH[i].b.length - 1, 1e9, true); requestAnimationFrame(() => { if (wrap.isConnected) C.render(st.yf); }); }
      return moved;
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
    /* go to a chapter (a chip, Back, Next, a key): it is told beat by beat, then rests; the film is not started */
    function go(i, how) {
      i = clamp(i, 0, NCH - 1); filmStop(); st.chT = i; st.chAt = performance.now();   /* the chapter being glided to: the next press counts from it */
      st.reach = true; startRun(how === 'film', i, -1);
    }
    chl.addEventListener('click', ev => { const b = ev.target.closest('[data-ch]'); if (b) go(+b.dataset.ch, 'user'); });
    bk.addEventListener('click', () => go(st.ch - 1, 'user'));
    fw.addEventListener('click', ev => { if (st.ch < NCH - 1) { ev.stopPropagation(); go(st.ch + 1, 'user'); } else filmStop(); });
    const keyNav = ev => { if (ev.target.closest('input, .orr-fsel, .orr-svg')) return; const d = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : ev.key === 'Home' ? -99 : ev.key === 'End' ? 99 : 0; if (!d || ev.ctrlKey || ev.metaKey || ev.altKey) return; const from = st.chT != null && performance.now() - st.chAt < 1500 ? st.chT : st.ch, j = clamp(from + d, 0, NCH - 1);   /* Home and End: the first and the last chapter */
      if (j === from) { if (ev.target.closest('.orr-chs')) { ev.preventDefault(); ev.stopPropagation(); } return; }   /* at the ends the row keeps the key: it never leaves the station from under the visitor's focus */
      ev.preventDefault(); go(j, 'user'); if (ev.target.closest('.orr-chs')) (ev.target.closest('.orr-nx') || chb[j]).focus({ preventScroll: true }); };
    dock.addEventListener('keydown', keyNav);

    /* ---------- OR9: the runner. It tells one chapter beat by beat (a visitor's pick), or the whole film (Play): the introduction, eight chapters, the two steps ---------- */
    let run = null;
    function tween(y, d) { run.tw = { a: st.yf, b: y, t: 0, d: reduce() ? 0 : d }; }
    function chapterIn(i) {   /* a chapter opens: its card, nothing of it yet on the picture; the year glides to its first year; the camera to what it is about */
      const c = CH[i]; run.i = i; run.b = -1; run.t = 0; run.ph = 'card'; st.pin = false;
      if (c.step) C.setStep(c.step); else { if (st.step) C.setStep(null); if (c.layer) st.layer = c.layer; }
      setBeat(i, -1, 0); card(i, CARD * 1000);
      if (!c.step && Math.abs(st.yf - c.y0) > .01) tween(c.y0, run.film ? 1.1 : .8);
      if (st.cam !== 'user') st.cam = c.cam; camTo(c.step ? 'all' : c.cam, 850, c.y1);
    }
    function beatIn(i, b, t) { run.i = i; run.b = b; run.t = t; run.ph = 'beat'; const B = beatsOf(i)[b]; setBeat(i, b, t); if (B.y != null && Math.abs(B.y - st.yf) > .01) tween(B.y, Math.max(.7, Math.abs(B.y - st.yf) * .85)); }
    function startRun(film, i, b, t) {
      C.stopYear(); if (run) cancelAnimationFrame(run.raf);
      run = { film, i, b, t: t || 0, raf: 0, last: performance.now(), tw: null, ph: 'beat' };
      if (film) { st.playing = true; C.play.textContent = '❚❚ Pause'; C.play.setAttribute('aria-pressed', 'true'); if (st.cam === 'user') st.cam = 'all'; }
      if (b < 0 && i >= 0) chapterIn(i); else beatIn(i, Math.max(0, b), t || 0);
      calmSync(); run.raf = requestAnimationFrame(tick);
    }
    function tick(now) {
      if (!run) return; if (!C.live() || !wrap.isConnected) { pause(); return; }
      if (run.i < 0 && !run.film && X.orrEnterAct === 'go') { run.film = true; st.playing = true; C.play.textContent = '❚❚ Pause'; C.play.setAttribute('aria-pressed', 'true'); }   /* the entry screen's “Start at the beginning” arrives just after the introduction starts */
      const dt = Math.min(.1, (now - run.last) / 1000); run.last = now; const rm = reduce();
      if (run.tw) { const T = run.tw; T.t += dt; const q = T.d ? clamp(T.t / T.d, 0, 1) : 1; C.stepTo(lerp(T.a, T.b, rm ? 1 : q * q * (3 - 2 * q))); if (q >= 1) { run.tw = null; C.settle(); } }
      const t0 = run.t; run.t += dt;
      if (run.ph === 'card') { if (run.t >= (rm ? .6 : CARD) && !run.tw) beatIn(run.i, 0, 0); }
      else { const B = beatsOf(run.i)[run.b]; st.bt.t = run.t;
        if ((B.at || []).some(a => a[0] > t0 && a[0] <= run.t)) setBeat(run.i, run.b, run.t);   /* a part the sentence names a moment later */
        if (run.t >= B.h && !run.tw && !next()) return; }
      run.raf = requestAnimationFrame(tick);
    }
    function next() {   /* the beat has been read: the next beat, the next chapter (the film), or rest */
      if (run.b + 1 < beatsOf(run.i).length) { beatIn(run.i, run.b + 1, 0); return true; }
      if (run.i < 0) { endIntro(); chapterIn(0); calmSync(); return true; }   /* the introduction leads into chapter 1, in the film or on its own */
      st.bt.done = true;
      if (run.film && run.i < NCH - 1) { chapterIn(run.i + 1); return true; }
      st.bt.t = 1e9; sayLine();   /* told to its end, the chapter rests with its sentences together: the reason stays on the stage */
      const f = run.film; cancelAnimationFrame(run.raf); run = null; C.hl(-1, false); st.hk = -1;
      if (f) { st.playing = false; C.play.textContent = st.ch === NCH - 1 ? '↺ Replay' : '▶ Play'; C.play.setAttribute('aria-pressed', 'false'); }
      calmSync(); return false;
    }
    /* Pause keeps the picture as it is, mid-beat; navigation (the years, a chip, a key, full screen) ends the run and the chapter stands as told to its end */
    function pause() { if (!run) return; cancelAnimationFrame(run.raf); const f = run.film; run = null; if (f || st.playing) { st.playing = false; C.play.textContent = '▶ Play'; C.play.setAttribute('aria-pressed', 'false'); } calmSync(); }
    function filmStop() { const had = !!run || st.intro; pause(); if (st.intro) endIntro(); if (had) { st.bt = null; C.hl(-1, false); st.hk = -1; requestAnimationFrame(() => { if (wrap.isConnected && !run) C.render(st.yf); }); } }
    function playToggle() {
      if (run && run.film) { pause(); return; }
      const B = st.bt;
      if (run) { const r = run; pause(); startRun(true, r.i, r.ph === 'card' ? -1 : r.b, r.t); return; }   /* a chapter being told becomes the film from where it is */
      if (B && !B.done && B.t < 1e9 && (B.b >= 0 || B.ch < 0)) { if (B.ch < 0) st.intro = true; startRun(true, B.ch, B.b, B.t); return; }   /* paused mid-beat: on from there */
      if (B && B.done && B.ch === NCH - 1) { C.setStep(null); C.stepTo(1995); st.bt = null; chSync(); camTo('all', 0); intro(true); return; }   /* the end: again, from the introduction */
      if (B && B.done) { startRun(true, st.ch + 1, -1); return; }   /* a chapter told to its end: the film goes on with the next */
      startRun(true, st.ch, -1);   /* a chapter reached by the years: told from its start */
    }

    /* ---------- OR9: the introduction, once a visit, after the tab's entry screen has gone ---------- */
    let skipB = null;
    const esc = ev => { if (ev.key === 'Escape' && st.intro) { ev.preventDefault(); skipIntro(); } };
    function endIntro() { st.intro = false; wrap.classList.remove('intro'); if (skipB) { skipB.remove(); skipB = null; } document.removeEventListener('keydown', esc); }
    function skipIntro() { filmStop(); st.reach = true; calmSync(); }
    function intro(replay) {
      if (st.step) C.setStep(null); st.intro = true; wrap.classList.add('intro'); setBeat(-1, -1, 0);
      if (!skipB) { skipB = h('button', 'orr-skip', 'Skip the introduction'); skipB.type = 'button'; skipB.addEventListener('click', skipIntro); stage.append(skipB); document.addEventListener('keydown', esc); }
      const film = replay || X.orrEnterAct === 'go';   /* “Start at the beginning” on the entry screen: the film runs on after the introduction */
      startRun(film, -1, 0, 0);
    }
    /* the orrery asks for the introduction on its first drawing at 1995 (orrery.js opening()). It is wanted once a visit, when the tab's entry screen
       is due (a first visit as the site counts it); while that screen covers the tab, or is about to open, the stage stands empty and waits.
       A visitor who has met the tab before, or switched the entry screens off, finds chapter 1 told to its end, with Play. */
    function opening() {
      if (full || X.orrOpened) return false;
      const U = X.util, K_ = () => (X.enter && X.enter.key) || 'isx-enter-', seen = () => !!U && U.stGet(K_() + 'profit') === '1';
      /* whether this visit wants the introduction; null while the entry screen's script has not run yet (the single-file build draws the stage first) */
      const decide = () => { const E = X.enter; if (X.orrIntroWant !== undefined) return X.orrIntroWant; if (!E) return null;
        const off = !U || U.stGet('isx-tips-sim') === 'off' || U.stGet('isx-enter') === 'off' || U.stGet('isx-intro') === 'off';
        X.orrIntroWant = E.on === 'profit' || (!off && !seen() && (E.tabs || []).indexOf('profit') >= 0); return X.orrIntroWant; };
      if (decide() === false) return false;
      st.intro = true; wrap.classList.add('intro'); setBeat(-1, -1, 0, true); calmSync();
      const t0 = performance.now();
      const poll = () => {
        if (!wrap.isConnected || !st.intro || X.orrOpened || st.bt && st.bt.ch >= 0) return;
        const w = decide();
        if (w === null && performance.now() - t0 < 3000) { setTimeout(poll, 100); return; }
        if (!w) { st.intro = false; wrap.classList.remove('intro'); st.bt = null; calmSync(); C.render(st.yf); return; }   /* not wanted after all: chapter 1 as told to its end */
        if (X.enter && X.enter.on) { X.orrEntrySeen = true; setTimeout(poll, 250); return; }   /* the screen is up */
        if (!X.orrEntrySeen && !seen() && performance.now() - t0 < 4000) { setTimeout(poll, 250); return; }   /* the screen is still to come */
        if (X.view !== 'profit' || document.hidden) { setTimeout(poll, 500); return; }
        X.orrOpened = true; intro(false); };
      setTimeout(poll, X.orrEntrySeen ? (reduce() ? 0 : 450) : 100);   /* after the screen has gone: start as it fades */
      return true;
    }

    /* ---------- the narrator ---------- */
    /* where a sheet scrolls (a phone's narrator, a middle-sized stage's notices), a soft lower edge says there is more */
    const more = () => { [nb, nn, C.keyP].forEach(n => n && n.classList.toggle('more', n.scrollHeight - n.scrollTop - n.clientHeight > 6));
      const ov = nz.scrollHeight > nz.clientHeight + 2 && getComputedStyle(nz).overflowY !== 'visible'; if (ov && nz.tabIndex !== 0) { nz.tabIndex = 0; nz.setAttribute('role', 'group'); nz.setAttribute('aria-label', 'The narration'); } else if (!ov && nz.tabIndex === 0) { nz.removeAttribute('tabindex'); nz.removeAttribute('role'); nz.removeAttribute('aria-label'); }   /* a narration that runs over scrolls, and then takes the focus (axe) */ moreB.hidden = !(compact && ph && nar.classList.contains('open') && nb.classList.contains('more')); };
    nar.append(moreB); moreB.addEventListener('click', () => nb.scrollBy({ top: Math.round(nb.clientHeight * .8), behavior: reduce() ? 'auto' : 'smooth' }));
    [nb, nn, C.keyP].forEach(n => n && n.addEventListener('scroll', more, { passive: true })); if (C.keyB) C.keyB.addEventListener('click', () => requestAnimationFrame(more));
    const scr = ph && compact ? nb : (!wide && !compact ? nn : null); if (scr) { scr.tabIndex = 0; scr.setAttribute('role', 'group'); scr.setAttribute('aria-label', scr === nb ? 'The narration, in full' : 'This year’s notices'); }
    if (C.keyP) C.keyP.tabIndex = 0;
    function notice(box, k, cls, line, src, extra) { box.textContent = ''; box.append(h('span', 'k ' + cls, k), h('p', '', line), h('small', '', 'Source: ' + src)); if (extra) extra.forEach(e => box.append(e)); }
    function narr(yr) {
      chSync(); const I = st.intro && st.bt && st.bt.ch < 0, i = st.ch, c = I ? IN : CH[i], key = (I ? 'in' : i) + '|' + yr + '|' + (st.ins || ''); if (key === st.nk) return; st.nk = key;
      const who = I ? 'in' : String(i); if (st.nch !== who) { st.nch = who; nb.scrollTop = 0; nn.scrollTop = 0; } requestAnimationFrame(more);
      /* a body's or an arc's card asked for: the narrator opens on its notice */
      if (st.ins && st.ins !== st.insShown && !nar.classList.contains('open')) openNar(true); st.insShown = st.ins;
      nar.dataset.step = c.step || ''; fullT.textContent = ''; navSync();
      kick.textContent = I ? 'Introduction' : 'Chapter ' + (i + 1) + ' of ' + NCH + (c.step && !(compact && ph) ? ' · after the story' : '');   /* a phone held upright: the row keeps room for Back and Next */
      nt.textContent = I ? IN.t : chTitle(i) + (c.step ? '.' : '');
      fullT.append(h('p', 'sum', c.b.map(x => x.s).join(' ')));
      if (I) { ne.textContent = ''; ni.textContent = ''; return; }
      if (c.step) {
        const S = C.stepCopy(c.step); fullT.append(h('p', 'd', S.body)); if (S.ast) fullT.append(h('p', 'ast', S.ast)); ne.textContent = ''; ni.textContent = '';
        if (S.charts) { if (compact) nz.insertBefore(S.charts, fullT); else ne.append(S.charts); }   /* a phone: the two charts are the step's picture, under its sentence; a middle-sized stage: beside the narration, where a year's notices stand */
        fullT.append(h('small', '', S.src)); return;
      }
      if (i === 0 && R.q && R.q.textContent) fullT.append(h('p', 'epi', R.q.textContent));
      fullT.append(h('p', 'd', c.p().join(' '))); if (st.note) fullT.append(h('p', 'ast', st.note));   /* OR8's dated sentences and the footnote: the detail, read when asked */
      const ev = C.evAt(yr), blocks = [];
      if (yr >= LW) { ne.textContent = ''; notice(ne, '2026 · Pax Silica grows', 'e now', 'More governments sign through the year.', 'State Department, Pax Silica page, list read 21 Nov 2026'); }   /* 2025's own notice, Pax Silica, is the chapter before */
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
      if (st.poolLab) out.push(st.poolLab); if (st.whyLab) out.push(st.whyLab); if (st.curtLab) out.push(st.curtLab); if (st.rimLabs) st.rimLabs.forEach(r => out.push(r));
    }

    function draw(g) { chSync(); maskSync(); drawRim(g); drawFx(g); }
    function onSel(q) { wrap.classList.toggle('has-sel', !!q); if (q && !C.info.contains(ix)) C.info.append(ix); }
    function onStep() { chSync(); navSync(); capKey = ''; C.render(st.yf); }   /* the picture is drawn again so that its layer, its starred line and its names are the step's (or the chapter's) own */
    wrap.dataset.layer = st.layer;
    return { box, draw, narr, obstacles, inc, half, playToggle, filmStop, go, chTitle: () => chTitle(st.ch < 0 ? idx() : st.ch), idx, onSel, onStep, fillKey, camTo, dock, chs, nar, hud, wide, land, CH, setLayer, card,
      IN, streamOn, nameMode, arcOk, opening, beats: () => ({ IN, CH: CH.map(c => ({ id: c.id, b: c.b })) }), where: () => ({ bt: st.bt, run: run ? { film: run.film, i: run.i, b: run.b, ph: run.ph } : null, intro: st.intro, fl: [...st.fl] }), skip: skipIntro,
      userView: () => { st.cam = 'user'; cancelAnimationFrame(camRaf); }, resetCam: () => { st.cam = CH[st.ch < 0 ? 0 : st.ch].cam; } };
  };
})();
