/* Fix round (14 Nov 2026): checks on what the round changed.
   Usage: node tools/fix-check.js [baseUrl] [--f7=<F7-corporate-and-curve.csv>] [--ab=<A-bond-market.csv>]
   Needs `python3 -m http.server 8731` at the repo root. Exits 1 on a failed check.
   1 the figure, its date and its source show on the map and in the dossier of every element with a door, in the full view and
     when a chain borrows it (decision 0-1, other path, link 4); the door tab sits on the element, the door row under the figures
   2 no early reveal: on the opening card and in that chain, what the guide has not reached and the chain does not touch stays empty
   3 level 2's data equals the data round's files (F7 and A-bond-market) when their paths are given; otherwise the anchor values
     of F7-NOTES; the table view shows the same numbers as the data file
   4 the cursor and the table view work by keyboard; the charts have text alternatives
   5 the zoom is a motion, and a quick fade under reduced motion; focus returns to the element that opened the view
   6 the thesis on the guide's opening card */
const { chromium } = require('playwright');
const fs = require('fs');
const args = process.argv.slice(2), arg = k => (args.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const base = args.find(a => /^https?:/.test(a)) || 'http://127.0.0.1:8731/imperial-stack/';
let pass = 0, fail = 0;
const ok = (c, t, x) => { if (c) pass++; else { fail++; console.log('FAIL  ' + t + (x !== undefined ? '  ' + (typeof x === 'string' ? x : JSON.stringify(x)).slice(0, 700) : '')); } };
const OFF = ['isx-tips-globe', 'isx-tips-sim', 'isx-tour', 'isx-first', 'isx-insights', 'isx-simtour'];
const DOORS = { SAV: 'loop', Y10: 'bond', MOV: 'bond', BND: 'bond', TSY: 'desks', FED: 'desks' };

(async () => {
  const b = await chromium.launch();
  const mk = async (opt, init) => {
    const c = await b.newContext(Object.assign({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, opt));
    await c.addInitScript(([off, i]) => { try { off.forEach(k => localStorage.setItem(k, 'off')); localStorage.setItem('isx-intro-off', '1'); localStorage.setItem('isx-sim-mode', i.mode); if (i.pos) sessionStorage.setItem('isx-sim-pos', i.pos); } catch (e) {} }, [OFF, init]);
    const p = await c.newPage(); p._errs = [];
    p.on('pageerror', e => p._errs.push(String(e.message).slice(0, 200)));
    await p.goto(base + '#simulator', { waitUntil: 'load' });
    await p.waitForFunction(() => window.ISX && ISX.booted && ISX.views, null, { timeout: 90000 });
    await p.waitForTimeout(600);
    return p;
  };
  /* what an element with a door shows: on the map, and in its dossier */
  const DOSS = async (p, n) => p.evaluate(async k => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), I = [...document.querySelectorAll(`#isx-rmap .gn[data-n="${k}"], #isx-rmap .gt[data-n="${k}"]`)].flatMap(g => g.dataset.ind.split(' ')).map(id => ({ id }));
    const g = document.querySelector(`#isx-rmap .fn[data-n="${k}"]`), tab = document.querySelector(`#isx-rmap .vdoor[data-n="${k}"]`);
    const vals = I.map(x => { const v = document.querySelector(`#isx-rmap [data-gv="${x.id}"]`); return [x.id, v ? v.textContent : null]; });
    g.dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(150);
    const s = document.querySelector('#isx-rside'), tiles = s ? [...s.querySelectorAll('.dtile')] : [], door = s && s.querySelector('.cb-door.sm');
    const after = door ? !tiles.length || !!(tiles[tiles.length - 1].compareDocumentPosition(door) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
    const out = { vals, tab: !!tab && !tab.classList.contains('off') && tab.getAttribute('tabindex') === '0', open: !!s && !s.hidden,
      tiles: tiles.map(t => ({ v: (t.querySelector('b') || {}).textContent || '', date: /\b(19|20)\d\d\b|\bSep\b|\bOct\b|\bNov\b/.test(t.textContent), src: !!t.querySelector('.lsrc') && !/link not stored/.test(t.querySelector('.lsrc').textContent) })),
      ind: I.length, door: !!door && /Inside the machinery/.test(door.textContent), after };
    g.dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(80);
    return out;
  }, n);

  /* ---------- 1: full view ---------- */
  let p = await mk({}, { mode: 'full' });
  for (const n of Object.keys(DOORS)) {
    const d = await DOSS(p, n);
    ok(d.vals.every(([, v]) => /\d/.test(v || '')), n + ': its indicators show a figure on the map (full view)', d.vals);
    ok(d.tab, n + ': the door tab “More inside” is on the element (full view)');
    ok(d.open && d.door && d.after, n + ': the dossier opens with the door row under the figures', d);
    ok(d.tiles.length === d.ind && d.tiles.every(t => /\d|–/.test(t.v) && t.date && t.src), n + ': every indicator tile in the dossier has a figure, a date and a source', d.tiles);
  }
  /* the tab opens the view; the 10-year's dossier carries the slope */
  ok(await p.evaluate(async () => { document.querySelector('#isx-rmap .vdoor[data-n="MOV"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); await new Promise(r => setTimeout(r, 200)); const on = ISX.views.on; ISX.views.close(); return on === 'bond'; }), 'the door tab on MOVE opens the bond screen');
  ok(await p.evaluate(async () => { const g = document.querySelector('#isx-rmap .fn[data-n="Y10"]'); g.dispatchEvent(new MouseEvent('click', { bubbles: true })); await new Promise(r => setTimeout(r, 120)); const t = document.querySelector('#isx-rside .dslope'); const r = !!t && /10-year minus 2-year/.test(t.textContent) && /\+0\.39 points/.test(t.textContent) && /Oct 2026/.test(t.textContent) && /T10Y2Y/.test(t.textContent); g.dispatchEvent(new MouseEvent('click', { bubbles: true })); return r; }), 'the 10-year dossier shows the slope (10-year minus 2-year) with its date and source');
  ok(await p.evaluate(() => document.querySelector('#isx-rmap [data-gv="y10"]').textContent === '5.13%'), 'the 10-year gauge reads 5.13% (FRED, October 2026 average)');
  ok(!p._errs.length, 'no page errors (full view)', p._errs.join(' | '));
  await p.context().close();

  /* ---------- 1, 2: a chain borrows gauges before the guide reaches them ---------- */
  p = await mk({}, { mode: 'guide', pos: JSON.stringify({ l: 0, b: 9, ph: 'chain', c: 3 }) });
  const ch = await p.evaluate(() => ({ ph: ISX.sim.ph, c: ISX.sim.c, dec: ISX.sim.dec }));
  ok(ch.ph === 'chain' && ch.c === 3 && ch.dec === '0-1', 'the chain state loads (decision 0-1, link 4)', ch);
  for (const n of ['Y10', 'MOV', 'BND']) {
    const d = await DOSS(p, n);
    ok(d.vals.every(([, v]) => /\d/.test(v || '')), n + ': borrowed by the chain, its figure shows on the map', d.vals);
    ok(d.tab, n + ': borrowed by the chain, its door tab shows');
    ok(d.open && d.door && d.tiles.length === d.ind && d.tiles.every(t => /\d/.test(t.v) && t.date && t.src), n + ': borrowed by the chain, its dossier opens with figure, date, source and the door row', d);
  }
  const early = await p.evaluate(() => {
    const S = ISX.sim, E = new Set(S.lines[0].steps[25].e), tmp = new Set([...document.querySelectorAll('#isx-rmap .fn.tmp')].map(g => g.dataset.n));
    const out = [];
    const nOf = {}; document.querySelectorAll('#isx-rmap .gn, #isx-rmap .gt').forEach(g => g.dataset.ind.split(' ').forEach(id => { nOf[id] = g.dataset.n; }));
    S.indicators.forEach(I => { if (I.rel.some(i => E.has(i)) || tmp.has(nOf[I.id])) return; const v = document.querySelector(`#isx-rmap [data-gv="${I.id}"]`); if (v && v.textContent.trim() && !document.querySelector(`#isx-rmap .flare [data-gv="${I.id}"], #isx-rmap .flare[data-ind="${I.id}"]`)) out.push(I.id + '=' + v.textContent); });
    document.querySelectorAll('#isx-rmap .vdoor').forEach(t => { const n = t.dataset.n, g = document.querySelector(`#isx-rmap .fn[data-n="${n}"]`); if (g.classList.contains('s4dim') && !t.classList.contains('off')) out.push('tab ' + n); });
    return out;
  });
  ok(!early.length, 'no early reveal: in the chain, indicators neither reached nor touched stay empty, and no door tab sits on a dimmed element', early);
  await p.context().close();
  p = await mk({}, { mode: 'guide', pos: JSON.stringify({ l: 0, b: -1 }) });
  /* machinery entry round (19 Nov 2026): no opening card; a place stored at step −1 opens on the guide's first step, which shows its
     own one figure (consumer spending) and nothing else. The thesis is on Expert's panel on the full map. */
  let op = await p.evaluate(() => ({ beat: ISX.sim.beat, vals: [...document.querySelectorAll('#isx-rmap [data-gv]')].filter(v => v.textContent.trim()).map(v => v.dataset.gv), tabs: [...document.querySelectorAll('#isx-rmap .vdoor:not(.off)')].map(t => t.dataset.n) }));
  ok(op.beat === 0 && op.vals.join() === 'con' && !op.tabs.length, 'no early reveal: the guide’s first step shows only its own figure and no door tab', op);
  await p.evaluate(() => ISX.simWay('map')); await p.waitForTimeout(400);
  op.th = await p.evaluate(() => (document.querySelector('#isx-thx .thx-t') || {}).textContent || '');
  /* ---------- 6: the thesis ---------- */
  /* tiers build A (15 Nov 2026): the thesis in Elias Rutten's wording, no economist named */
  ok(/the instability is manufactured/.test(op.th) && /Elias Rutten/.test(op.th) && /weaponized system/.test(op.th) && /who holds the valves/.test(op.th) && !/Klein|Pettis|Gowan|Hudson/.test(op.th), 'Expert’s thesis panel carries the thesis in Elias Rutten’s wording, naming no economist', op.th);
  ok(!/does not assert|not a claim|no claim is made|map’s reading/i.test(op.th) && !/["']/.test(op.th), 'the thesis has no hedge line and no straight quotes', op.th);
  await p.context().close();

  /* ---------- 3, 4: level 2 ---------- */
  p = await mk({}, { mode: 'full' });
  await p.evaluate(() => ISX.views.open('bond', { level: 2 }));
  await p.waitForFunction(() => !!document.querySelector('#isx-vw .bx-sl'), null, { timeout: 10000 });
  const D = await p.evaluate(() => ISX.load('bond-panel'));
  const n = D.m.length;
  ok(n === 127 && D.m[0] === '2016-04' && D.m[n - 1] === '2026-10', 'level 2 covers April 2016 to October 2026, 127 months', [n, D.m[0], D.m[n - 1]]);
  const f7 = arg('f7'), ab = arg('ab');
  if (f7 && fs.existsSync(f7)) {
    const rows = fs.readFileSync(f7, 'utf8').trim().split('\n'), h = rows[0].split(','), bad = [];
    rows.slice(1).forEach(r => { const c = r.split(','), m = c[0], i = D.m.indexOf(m); if (i < 0) { bad.push(m + ' missing'); return; } ['baa', 'aaa', 'y3m', 'y2', 'y5', 'y10', 'y30'].forEach(k => { if (Math.abs(+c[h.indexOf(k)] - D[k][i]) > 1e-9) bad.push(m + ' ' + k); }); });
    ok(!bad.length && rows.length - 1 === n, 'level 2 equals F7 in every month and column', bad.slice(0, 10));
  } else {
    const A = { '2026-10': { baa: 6.59, aaa: 6.12, y10: 5.13, y2: 4.74, y3m: 4.23, y5: 4.93, y30: 5.47 }, '2016-08': { y10: 1.56 }, '2020-03': { baa: 4.29, y10: .87 }, '2023-05': { y3m: 5.31, y10: 3.57 } };
    const bad = []; Object.entries(A).forEach(([m, o]) => Object.entries(o).forEach(([k, v]) => { if (D[k][D.m.indexOf(m)] !== v) bad.push(m + ' ' + k); }));
    ok(!bad.length, 'level 2 matches the anchor values of F7-NOTES (pass --f7= for the full comparison)', bad);
  }
  if (ab && fs.existsSync(ab)) {
    const L = fs.readFileSync(ab, 'utf8').trim().split('\n').slice(1).map(r => r.split(',')).filter(c => c[0] === 'MOV' || c[0] === 'TP'), bad = [];
    D.m.forEach((m, i) => { const mv = L.find(c => c[0] === 'MOV' && c[1] === m), tp = L.find(c => c[0] === 'TP' && c[1] === m); if (!mv || +mv[2] !== D.move[i]) bad.push(m + ' MOVE'); if (!tp || Math.abs(+tp[2] - D.tp[i]) > .006) bad.push(m + ' TP'); });
    ok(!bad.length, 'level 2’s MOVE and term premium equal A-bond-market in every month', bad.slice(0, 10));
  } else ok(D.move[n - 1] === 101.8 && Math.max(...D.move) === 150.8, 'MOVE matches the anchor values of A-bond-market (pass --ab= for the full comparison)');
  ok(JSON.stringify(D.daily.map(x => [x.d, x.v])) === JSON.stringify([['12 Nov 2026', [4.32, 4.86, 4.95, 5.10, 5.43]], ['10 Nov 2025', [3.95, 3.58, 3.72, 4.13, 4.71]], ['5 Oct 2026', [4.22, 4.84, 5.06, 5.31, 5.66]]]), 'the daily curves equal F7-NOTES');
  /* the cursor, by keyboard */
  await p.focus('#isx-vw .bx-sl');
  const K = async key => { await p.keyboard.press(key); await p.waitForTimeout(40); return p.evaluate(() => { const s = document.querySelector('#isx-vw .bx-sl'), c = document.querySelector('#isx-vw .bx-cv'); return { now: +s.getAttribute('aria-valuenow'), txt: s.getAttribute('aria-valuetext'), cv: c && c.getAttribute('aria-label') }; }); };
  let k1 = await K('Home');
  ok(k1.now === 0 && /^Apr 2016 · 10-year 1\.81% · Baa 4\.79% · spread 2\.98 points · MOVE 67\.6/.test(k1.txt) && /April|Apr 2016/.test(k1.cv), 'Home: the cursor reads April 2016 aloud and the curve follows', k1);
  k1 = await K('ArrowRight'); ok(k1.now === 1 && /^May 2016/.test(k1.txt), 'Arrow right: one month on', k1);
  k1 = await K('End'); ok(k1.now === n && /^Latest, 12 Nov 2026/.test(k1.txt) && /12 Nov 2026/.test(k1.cv), 'End: the latest daily curve', k1);
  k1 = await K('PageDown'); ok(k1.now === n - 12, 'Page down: a year back', k1);
  await p.evaluate(() => document.querySelector('#isx-vw [data-bxj="2023-05"]').click()); await p.waitForTimeout(60);
  const inv = await p.evaluate(() => document.querySelector('#isx-vw .bx-cv').getAttribute('aria-label'));
  ok(/May 2023/.test(inv) && /inverted/.test(inv), 'Go to May 2023: the curve is drawn and described as inverted', inv);
  const alt = await p.evaluate(() => { const s = document.querySelector('#isx-vw .bx-sl'), d = document.getElementById(s.getAttribute('aria-describedby')); return d ? d.textContent : ''; });
  ok(/credit spread/.test(alt) && /peaked at 150\.8 in Oct 2022/.test(alt) && /5\.13%/.test(alt), 'the lanes have a text alternative that states their shape', alt);
  ok(await p.evaluate(() => /whole corporate market, not the AI borrowers/.test(document.querySelector('#isx-vw .bx-cap').textContent)), 'the caption says the Baa average is the whole corporate market, not the AI borrowers');
  ok(await p.evaluate(() => document.querySelectorAll('#isx-vw .bx-chip').length === 3 && [...document.querySelectorAll('#isx-vw .bx-chip')].every(c => c.querySelector('span').textContent && /\d/.test(c.querySelector('b').textContent))), 'one chip per indicator, each with its value');
  ok(await p.evaluate(() => { const c = document.querySelector('#isx-vw .bx-chip[data-lane="move"]'); c.click(); const t = document.querySelector('#isx-vw .bx-note').textContent; return c.getAttribute('aria-pressed') === 'true' && /MOVE/.test(t) && /calm lowers haircuts/.test(t) && !/Rutten/.test(t) && /Yahoo/.test(t); }), 'a chip shows its indicator’s label, date, source and the reading, without Elias’s name (profit tab build 1)');
  ok(await p.evaluate(() => !!document.querySelector('#isx-vw .vw-test') && document.querySelectorAll('#isx-vw .vw-test li').length === 3), 'the strip “The relation, tested” sits with the panel, three rows');
  /* the table view, by keyboard */
  await p.focus('#isx-vw .bx-tg'); await p.keyboard.press('Enter'); await p.waitForTimeout(80);
  const tb = await p.evaluate(D => { const t = document.querySelectorAll('#isx-vw .bx-tb table'); if (t.length !== 2) return { n: t.length }; const rows = [...t[1].tBodies[0].rows], first = rows[0].cells, last = rows[rows.length - 1].cells, i = D.m.length - 1;
    return { n: rows.length, focus: document.activeElement.classList.contains('bx-tg'), pressed: document.activeElement.getAttribute('aria-pressed'), reg: document.querySelector('#isx-vw .bx-tb').getAttribute('tabindex'),
      okFirst: first[0].textContent === 'Oct 2026' && +first[4].textContent === D.y10[i] && +first[6].textContent === D.baa[i] && +first[8].textContent === D.move[i], okLast: last[0].textContent === 'Apr 2016' && +last[1].textContent === D.y3m[0] }; }, D);
  ok(tb.n === n && tb.focus && tb.pressed === 'true' && tb.reg === '0' && tb.okFirst && tb.okLast, 'View as table: by keyboard; 127 rows equal to the data; the table can be scrolled by keyboard', tb);
  await p.keyboard.press('Enter'); await p.waitForTimeout(60);
  ok(await p.evaluate(() => !!document.querySelector('#isx-vw .bx-sl') && document.activeElement.classList.contains('bx-tg')), 'View as charts brings the charts back, focus kept');
  ok(await p.evaluate(() => [...document.querySelectorAll('#isx-vw .bx-ln .ln')].every(l => !!l.dataset.ln) && document.querySelectorAll('#isx-vw .bx-ln .el').length === 3), 'no meaning by colour alone: every line has a direct label');
  await p.evaluate(() => ISX.views.close());
  ok(!p._errs.length, 'no page errors (level 2)', p._errs.join(' | '));
  await p.context().close();

  /* ---------- 5: the motion ---------- */
  for (const rm of ['no-preference', 'reduce']) {
    p = await mk({ reducedMotion: rm }, { mode: 'full' });
    const m = await p.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms)), t = document.querySelector('#isx-rmap .vdoor[data-n="Y10"]');
      t.dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(20);
      const box = document.getElementById('isx-vw'), a = box.getAnimations()[0], kf = a ? a.effect.getKeyframes() : [], dur = a ? a.effect.getTiming().duration : 0;
      await wait(800);
      const zb = box.querySelector('.vw-zoom'); zb.click(); await wait(20);
      const b2 = box.querySelector('.vw-b').getAnimations()[0], dz = b2 ? b2.effect.getTiming().duration : 0, zk = b2 ? b2.effect.getKeyframes() : [];
      await wait(800); ISX.views.close(); await wait(20);
      const c = box.getAnimations()[0], dc = c ? c.effect.getTiming().duration : 0, ck = c ? c.effect.getKeyframes() : [];
      await wait(700);
      return { dur, clip: !!(kf[0] && kf[0].clipPath && /inset/.test(kf[0].clipPath)), dz, zclip: !!(zk[0] && zk[0].clipPath), dc, cclip: !!(ck[1] && ck[1].clipPath), hidden: box.hidden, focus: document.activeElement === t };
    });
    if (rm === 'reduce') ok(m.dur <= 150 && !m.clip && m.dz <= 150 && !m.zclip && m.dc <= 150 && !m.cclip && m.hidden && m.focus, 'reduced motion: a quick fade to open, zoom and close; focus returns to the tab', m);
    else ok(m.dur >= 500 && m.clip && m.dz >= 400 && m.zclip && m.dc >= 300 && m.cclip && m.hidden && m.focus, 'the view grows out of the gauge, level 2 grows out of the main figures, and it shrinks back on close; focus returns', m);
    ok(!p._errs.length, 'no page errors (motion, ' + rm + ')', p._errs.join(' | '));
    await p.context().close();
  }

  /* ---------- the phone: level 2 fits, the cursor takes a touch ---------- */
  p = await mk({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, { mode: 'full' });
  await p.evaluate(() => ISX.views.open('bond', { level: 2 })); await p.waitForFunction(() => !!document.querySelector('#isx-vw .bx-sl'));
  const ph = await p.evaluate(() => { const b = document.querySelector('#isx-vw .vw-b'), s = document.querySelector('#isx-vw .bx-sl svg'); return { side: b.scrollWidth <= b.clientWidth + 1, vb: s.getAttribute('viewBox') }; });
  ok(ph.side && /432/.test(ph.vb), 'phone: level 2 has no sideways scroll and uses the narrow lanes', ph);
  const sl = p.locator('#isx-vw .bx-sl'); await sl.scrollIntoViewIfNeeded(); const bb = await sl.boundingBox();
  await p.touchscreen.tap(bb.x + bb.width * .3, bb.y + bb.height * .4); await p.waitForTimeout(80);
  const tn = await p.evaluate(() => +document.querySelector('#isx-vw .bx-sl').getAttribute('aria-valuenow'));
  ok(tn > 10 && tn < 60, 'phone: a tap on the time axis moves the cursor there', tn);
  ok(!p._errs.length, 'no page errors (phone)', p._errs.join(' | '));
  await p.context().close();

  await b.close();
  console.log(`fix-check: ${pass} pass, ${fail} fail`);
  process.exit(fail ? 1 : 0);
})();
