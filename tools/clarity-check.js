/* Clarity build (17 Nov 2026): checks on what the round changed (claude/handoffs/clarity-build-17-nov.md).
   Usage: node tools/clarity-check.js [baseUrl] [--only=1,2]. Needs `python3 -m http.server 8731` at the repo root. Exits 1 on a failed check.
   1 the sequence: three acts, seven chapters, 43 steps; the four core decisions in act II and the first within twelve steps; the primer's
     new order; every play step in the core or in one episode, once (two repeats retired and named)
   2 the card: a question as heading and the step's name under it, no role label, every card of both routes fits at 1440 × 900;
     “New here” defines a term once a route, in the glossary's wording, two a card at most; the first card of an act says so
   3 this step in numbers: above the card where there is room, in it otherwise and on phones; every tile dated; sources listed;
     nothing on a decision, a chain or a crisis card; an indicator's tile only once the guide has reached the indicator;
     a chart has a text alternative, a table view and a label on every line
   4 colour on focus: grey at rest, the selected actor's lines in their colours; no legend under the map; the key opens and closes
   5 episodes: a door opens the episode and its last step returns to the step it came from; the fold opens in the card;
     the full view's tray runs the six episodes; the decision inside an episode works
   6 the bar and the camera: the act and the chapter in full on the line button; the zoom capped; the whole map on a wide screen
   7 type floor on the round's own elements; no page errors anywhere above
   8 the call screens. Call screen round (18 Nov 2026), replacing the clarity patch's pages: every call covers the whole window, the page
     under it inert and hidden; three steps (the problem, what you weigh, your call), spoken to the reader, none naming what happened;
     every figure dated and sourced (the bond-panel ones checked against the file); forces that say which option they pull toward;
     options that say what argues for them and where they move the pressure; choose, then “Make this call”; keys, Esc, Back and reload;
     it fits at 1440 × 900, 1280 × 720 and 1024 × 768 and scrolls on phones; the type is Saira Wide and Martian Mono. Also: the inflows
     reveal (clarity patch) and “Show hints again” */
const { chromium } = require('playwright');
const base = process.argv.slice(2).find(a => /^https?:/.test(a)) || 'http://127.0.0.1:8731/imperial-stack/';
const only = (process.argv.slice(2).find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean).map(Number);
const want = n => !only.length || only.includes(n);
let pass = 0, fail = 0;
const ok = (c, t, x) => { if (c) pass++; else { fail++; console.log('FAIL  ' + t + (x !== undefined ? '  ' + (typeof x === 'string' ? x : JSON.stringify(x)).slice(0, 600) : '')); } };
const OFF = ['isx-tips-globe', 'isx-tips-sim', 'isx-tour', 'isx-first', 'isx-insights', 'isx-simtour'];
const PRIMER = ['P8', 'P9', 'P2', 'P3', 'P4', 'P10', 'P11', 'P1', 'P5', 'P12', 'P7', 'P13'];
const RETIRED = ['2-0', '7-2'];   /* they repeat 1-3 and 4-2; kept in the page's data, not shown as cards */

(async () => {
  const b = await chromium.launch();
  const errs = [];
  const open = async (w, h, ls, ss, hash) => {
    const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    await c.addInitScript(o => { try { o.off.forEach(k => localStorage.setItem(k, 'off')); localStorage.setItem('isx-intro-off', '1'); for (const k in o.ls) localStorage.setItem(k, o.ls[k]); for (const k in o.ss) sessionStorage.setItem(k, o.ss[k]); } catch (e) {} }, { off: OFF, ls: ls || {}, ss: ss || {} });
    const p = await c.newPage();
    p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    p.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
    await p.goto(base + (hash || '#simulator'), { waitUntil: 'load', timeout: 90000 });
    await p.waitForFunction(() => !document.getElementById('isx-root').classList.contains('booting'), null, { timeout: 60000 });
    await p.waitForTimeout(1200);
    return p;
  };
  const at = (l, b2, extra) => ({ 'isx-sim-pos': JSON.stringify(Object.assign({ l, b: b2 }, extra || {})) });
  const go = async (p, l, b2) => { await p.evaluate(([l, b2]) => { const t = document.createElement('button'); t.dataset.sl = l; t.dataset.sb = b2; t.hidden = true; document.getElementById('isx-sn-body').appendChild(t); t.click(); }, [l, b2]); await p.waitForTimeout(220); };

  /* ---------- 1 the sequence ---------- */
  if (want(1)) {
    const p = await open(1440, 900, { 'isx-way': 'guide' }, at(0, 0));
    const S = await p.evaluate(() => ({ sim: ISX.sim, chs: ISX.chapters, acts: ISX.acts, primer: ISX.primerIds, eps: ISX.episodes, keys: ISX.playKeys }));
    const M = S.sim.lines.find(L => L.main), E = S.sim.lines.filter(L => L.ep);
    ok(M.steps.length === 43, '43 steps in the guide', M.steps.length);
    ok(S.chs.length === 7 && S.chs.map(C => C.act).join() === '0,1,1,1,1,2,2', 'seven chapters in three acts', S.chs.map(C => C.act + ':' + C.s));
    ok(S.acts.map(A => A[1]).join() === 'The loop,The chair,It breaks', 'the acts are the loop, the chair, it breaks', S.acts);
    const forks = M.steps.map((x, i) => x.fk ? [x.fk, i, S.chs[x.ch].act] : null).filter(Boolean);
    ok(forks.map(f => f[0]).join() === '0-1,0-7,0-4,0-6', 'the four core decisions, in order', forks);
    ok(forks.every(f => f[2] === 1), 'all four sit in act II', forks);
    ok(forks.length && forks[0][1] <= 11, 'the first decision comes within twelve steps', forks[0]);
    ok(E.length === 6 && E.map(L => L.ep).join() === 'oil,calm,door,issue,yen,pledge', 'six episodes', E.map(L => L.ep));
    const ef = E.flatMap(L => L.steps.map((x, i) => x.fk ? [L.ep, x.fk, i] : null).filter(Boolean));
    ok(ef.map(f => f[1]).sort().join() === '5-3,6-1,9-4', 'the three episode decisions', ef);
    ok(ef.every(f => f[2] > 0), 'no decision before an episode’s first step', ef);
    ok(S.primer.join() === PRIMER.join(), 'the primer’s new order', S.primer);
    const used = {}; M.steps.concat(...E.map(L => L.steps)).forEach(x => { used[x.k] = (used[x.k] || 0) + 1; });
    const missing = S.keys.filter(k => !used[k] && !RETIRED.includes(k)), twice = Object.keys(used).filter(k => used[k] > 1);
    ok(!missing.length, 'every play step is in the core or in an episode', missing);
    ok(!twice.length, 'no step is shown twice', twice);
    ok(M.steps.every(x => x.q && /\?$/.test(x.q)) && E.every(L => L.steps.every(x => x.q && /\?$/.test(x.q))), 'every step has its question', M.steps.concat(...E.map(L => L.steps)).filter(x => !x.q || !/\?$/.test(x.q)).map(x => x.k));
    ok(S.eps.every(X => M.steps.some(x => x.k === X.from)), 'every episode opens from a core step', S.eps.map(X => X.from));
    await p.context().close();
  }

  /* ---------- 2 the card ---------- */
  if (want(2)) {
    for (const way of ['ground', 'guide']) {
      const p = await open(1440, 900, { 'isx-way': way }, at(0, 0));
      const info = await p.evaluate(() => ({ n: ISX.sim.lines.find(L => L.main).steps.length, defs: ISX.defs, chs: ISX.chapters }));
      const seenNew = {}, bad = { q: [], role: [], scroll: [], twice: [], many: [], word: [], act: [] };
      let acts = 0;
      for (let i = 0; i < info.n; i++) {
        await go(p, 0, i);
        const c = await p.evaluate(() => { const bd = document.getElementById('isx-sn-body'), box = document.getElementById('isx-sn-in'); return { q: (bd.querySelector('h3.cl-q') || {}).textContent || '', a: (bd.querySelector('.cl-a') || {}).textContent || '', k: bd.querySelector('.s2k').innerText, nw: [...bd.querySelectorAll('.cl-new dl > div')].map(d => [d.querySelector('dt').textContent, d.querySelector('dd').textContent]), act: (bd.querySelector('.cl-act') || {}).textContent || '', fits: box.scrollHeight <= box.clientHeight + 1 }; });
        if (!/\?$/.test(c.q) || !c.a) bad.q.push(i + 1);
        if (/Problem|What was done|Consequence/i.test(c.k)) bad.role.push(i + 1);
        if (!c.fits) bad.scroll.push(i + 1);
        if (c.nw.length > 2) bad.many.push(i + 1);
        if (c.act) acts++;
        c.nw.forEach(([t, d]) => { if (seenNew[t]) bad.twice.push(t + '@' + (i + 1)); seenNew[t] = 1; if (!Object.values(info.defs).some(D => D[0] === t && D[1] === d)) bad.word.push(t); });
      }
      ok(!bad.q.length, way + ': every card is headed by a question, with the step’s name under it', bad.q);
      ok(!bad.role.length, way + ': no role label on the guide’s cards', bad.role);
      ok(!bad.scroll.length, way + ': every card fits at 1440 × 900 without scrolling', bad.scroll);
      ok(!bad.many.length, way + ': two new terms a card at most', bad.many);
      ok(!bad.twice.length, way + ': a term is defined once on the route', bad.twice);
      ok(!bad.word.length, way + ': “New here” uses the glossary’s wording', bad.word);
      ok(acts === 3, way + ': the first card of each act says so', acts);
      ok(way === 'ground' ? Object.keys(seenNew).length >= 15 : Object.keys(seenNew).length >= 8 && Object.keys(seenNew).length < 30, way + ': the number of terms spelled out', Object.keys(seenNew).length);
      await p.context().close();
    }
  }

  /* ---------- 3 this step in numbers ---------- */
  if (want(3)) {
    const p = await open(1440, 900, { 'isx-way': 'ground' }, at(0, 0));
    const info = await p.evaluate(() => ({ lines: ISX.sim.lines.map(L => ({ main: L.main, ep: L.ep, k: L.steps.map(x => x.k) })), keys: ISX.numKeys }));
    const bad = { none: [], date: [], src: [], where: [], gate: [] }; let ups = 0, total = 0, charts = 0;
    for (let l = 0; l < info.lines.length; l++) { const L = info.lines[l]; if (!(L.main || L.ep)) continue;
      for (let i = 0; i < L.k.length; i++) {
        await go(p, l, i);
        const r = await p.evaluate(() => { const N = ISX.stepNums(), el = document.getElementById('isx-cl-nums'); return { spec: !!N, ind: N ? N.tiles.filter(T => T.ind).map(T => T.ind) : [], el: !!el, where: ISX.clarity.where, tiles: el ? [...el.querySelectorAll('.cl-t')].map(t => [t.querySelector('b').textContent, !!(t.querySelector('em') || {}).textContent]) : [], bars: el ? el.querySelectorAll('.cl-b').length : 0, chart: el ? !!el.querySelector('.cl-ch') : false, src: el ? el.querySelectorAll('.cl-ns li').length : 0, reach: [...document.querySelectorAll('#isx-rmap .gn:not(.sock), #isx-rmap .gt:not(.gh)')].flatMap(g => (g.dataset.ind || '').split(' ')) }; });
        const has = info.keys.includes(L.k[i]);
        if (has && r.spec !== r.el) bad.none.push(L.k[i]);
        if (r.el) { total++; if (r.where === 'up') ups++; if (r.chart) charts++;
          if (r.tiles.some(t => !t[1])) bad.date.push(L.k[i]);
          if (!r.chart && !r.src) bad.src.push(L.k[i]);
          if (r.ind.some(id => !r.reach.includes(id))) bad.gate.push(L.k[i]); }
      } }
    ok(!bad.none.length, 'a step with numbers shows them', bad.none);
    ok(!bad.date.length, 'every tile carries its date', bad.date);
    ok(!bad.src.length, 'tiles and bars list their sources', bad.src);
    ok(!bad.gate.length, 'an indicator’s tile shows only once the map shows the indicator', bad.gate);
    ok(total >= 40 && ups / total > .8, 'the numbers sit above the card on most steps at 1440 × 900', ups + ' of ' + total);
    ok(charts >= 6, 'the charts', charts);
    /* a chart: text alternative, direct labels, table view */
    const mi = info.lines[0].k.indexOf('9-8'); await go(p, 0, mi); await p.waitForTimeout(500);
    const ch = await p.evaluate(() => { const el = document.getElementById('isx-cl-nums'), svg = el.querySelector('.cl-ch svg'); return { aria: svg ? svg.getAttribute('aria-label') : '', role: svg ? svg.getAttribute('role') : '', labels: svg ? [...svg.querySelectorAll('.lb')].map(t => t.textContent) : [], marks: svg ? [...svg.querySelectorAll('.mkl')].map(t => t.textContent) : [], lines: svg ? svg.querySelectorAll('.ln').length : 0, tb: !!el.querySelector('[data-cl-tbl]') }; });
    ok(ch.role === 'img' && /MOVE/.test(ch.aria) && /Mar 2020/.test(ch.aria) && /Apr 2025/.test(ch.aria) && /Oct 2026/.test(ch.aria), 'the MOVE chart says itself in words, with its three moments', ch.aria);
    ok(ch.lines === 1 && ch.labels.length === ch.lines && /MOVE/.test(ch.labels[0]), 'every line is labelled at its end', ch.labels);
    ok(ch.marks.join() === 'March 2020,April 2025', 'March 2020 and April 2025 are marked on the line (October 2026 is the line’s end)', ch.marks);
    await p.click('#isx-cl-nums [data-cl-tbl]'); await p.waitForTimeout(150);
    const tb = await p.evaluate(() => { const el = document.getElementById('isx-cl-nums'); return { rows: el.querySelectorAll('.cl-tb tbody tr').length, hid: el.querySelector('.cl-ch svg').hasAttribute('hidden') && !el.querySelector('.cl-ch svg').getClientRects().length, src: (el.querySelector('.cl-cs') || {}).textContent || '', pressed: el.querySelector('[data-cl-tbl]').getAttribute('aria-pressed') }; });
    ok(tb.rows >= 4 && tb.hid && tb.pressed === 'true' && /MOVE/.test(tb.src), 'the chart has a table view with its source', tb);
    /* nothing on a decision, a chain or a crisis card */
    const fi = info.lines[0].k.indexOf('0-1'); await go(p, 0, fi - 1); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300);
    for (let i = 0; i < 3; i++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300); }   /* clarity patch: past the call's setup pages */
    const a1 = await p.evaluate(() => [ISX.sim.ph, !!document.getElementById('isx-cl-nums')]);
    await p.click('#isx-sn-body .dc-opt[data-dco="alt"]'); await p.click('#isx-sn-body .dc-go'); await p.waitForTimeout(300);
    const a2 = await p.evaluate(() => [ISX.sim.ph, !!document.getElementById('isx-cl-nums')]);
    ok(a1[0] === 'ask' && !a1[1] && a2[0] === 'chain' && !a2[1], 'no numbers on a decision or a chain card', [a1, a2]);
    await p.context().close();
    /* phones: in the card; a short window: fewer tiles or in the card, never cut off */
    const ph = await open(390, 844, { 'isx-way': 'ground' }, at(0, 12));
    ok(await ph.evaluate(() => ISX.clarity.where === 'in' && !document.getElementById('isx-cl-nums').classList.contains('fold')), 'phones: the numbers are in the card, open');
    await ph.context().close();
    const sm = await open(1280, 760, { 'isx-way': 'ground' }, at(0, 9));
    const s1 = await sm.evaluate(() => { const el = document.getElementById('isx-cl-nums'), box = document.getElementById('isx-sn-in'), r = el.getBoundingClientRect(), top = document.querySelector('#isx-cock .s2top').getBoundingClientRect().bottom; return { where: ISX.clarity.where, shown: [...el.querySelectorAll('.cl-t')].filter(t => t.getClientRects().length).length, clear: r.top >= top, fits: box.scrollHeight <= box.clientHeight + 1 }; });
    ok(s1.where === 'up' && s1.shown <= 2 && s1.clear && s1.fits, '1280 × 760: one or two tiles above the card, clear of the top strip, the card not scrolling', s1);
    await sm.context().close();
  }

  /* ---------- 4 colour on focus, the key ---------- */
  if (want(4)) {
    const p = await open(1440, 900, { 'isx-sim-mode': 'full' });
    const rest = await p.evaluate(() => { const fe = [...document.querySelectorAll('#isx-rmap .fe')]; return { n: fe.length, on: fe.filter(x => x.classList.contains('on')).length, cols: [...new Set(fe.map(x => getComputedStyle(x).stroke))], mk: [...new Set(fe.map(x => getComputedStyle(x).markerEnd))], legend: !!document.querySelector('#isx-cock .s2key, #isx-cock .tw-key'), w: [...new Set(fe.map(x => getComputedStyle(x).strokeWidth))] }; });
    ok(rest.n === 75 && rest.on === 0 && rest.cols.length === 1 && rest.cols[0] === 'rgb(133, 151, 166)', 'at rest all 75 lines are one grey', rest.cols);
    ok(rest.mk.length === 1 && /isx-fa-rest/.test(rest.mk[0]), 'each keeps its arrow, in grey', rest.mk);
    ok(!rest.legend, 'no legend and no key paragraph under the map');
    await p.evaluate(() => document.querySelector('#isx-rmap .fn[data-n="TSY"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(400);
    const sel = await p.evaluate(() => { const fe = [...document.querySelectorAll('#isx-rmap .fe')], on = fe.filter(x => x.classList.contains('on')); return { on: on.length, own: on.every(x => getComputedStyle(x).stroke !== 'rgb(133, 151, 166)'), others: fe.filter(x => !x.classList.contains('on')).every(x => getComputedStyle(x).stroke === 'rgb(133, 151, 166)'), kinds: new Set(on.map(x => getComputedStyle(x).stroke)).size }; });
    ok(sel.on >= 10 && sel.own && sel.others && sel.kinds >= 3, 'a selected actor’s lines take their colours; the rest stay grey', sel);
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    await p.click('[data-cl-key]'); await p.waitForTimeout(200);
    const key = await p.evaluate(() => { const k = document.getElementById('isx-cl-key'); return { open: !k.hidden, kinds: k.querySelectorAll('.cl-kg')[0].querySelectorAll('.cl-kl').length, roles: k.querySelectorAll('.cl-kg')[1].querySelectorAll('.cl-kl').length, thesis: /part of the thesis/.test(k.textContent), exp: document.querySelector('[data-cl-key]').getAttribute('aria-expanded') }; });
    ok(key.open && key.kinds === 7 && key.roles === 4 && key.thesis && key.exp === 'true', 'the key opens: seven kinds of line, four roles, the layout as part of the thesis', key);
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => document.getElementById('isx-cl-key').hidden && ISX.sim.mode === 'full'), 'Esc closes the key and nothing else');
    await p.context().close();
    const g = await open(1440, 900, { 'isx-way': 'ground' }, at(0, 12));
    const gs = await g.evaluate(() => { const fe = [...document.querySelectorAll('#isx-rmap .fe:not(.gh)')], on = fe.filter(x => x.classList.contains('on')); return { on: on.length, col: on.every(x => getComputedStyle(x).stroke !== 'rgb(133, 151, 166)'), rest: fe.filter(x => !x.classList.contains('on')).every(x => getComputedStyle(x).stroke === 'rgb(133, 151, 166)') }; });
    ok(gs.on >= 1 && gs.col && gs.rest, 'in the guide the step in hand is in colour, what was reached before is grey', gs);
    await g.context().close();
    const ex = await open(1440, 900, {}, { 'isx-sim-pos': JSON.stringify({ l: 0, b: -1 }) });
    await ex.click('.ge-way[data-way="map"]'); await ex.waitForTimeout(500);
    ok(await ex.evaluate(() => ISX.sim.mode === 'full' && !document.getElementById('isx-cl-key').hidden), 'the Expert way in opens the key once');
    await ex.context().close();
  }

  /* ---------- 5 episodes ---------- */
  if (want(5)) {
    const p = await open(1440, 900, { 'isx-way': 'guide' }, at(0, 0));
    const M = await p.evaluate(() => ISX.sim.lines.find(L => L.main).steps.map(x => x.k));
    const from = M.indexOf('0-6'); await go(p, 0, from);
    ok(await p.evaluate(() => { const d = document.querySelector('#isx-sn-body .cl-ep[data-ep="oil"]'); return !!d && /The oil shock/.test(d.textContent) && /6 steps/.test(d.textContent); }), 'the oil shock is offered on “A calmer long end, mostly”');
    await p.click('#isx-sn-body .cl-ep[data-ep="oil"]'); await p.waitForTimeout(400);
    /* plain-language round (18 Nov): an episode opens on its whole-window entry screen, then → opens its first step */
    const e0 = await p.evaluate(() => ({ ep: ISX.sim.lines[ISX.sim.line].ep, beat: ISX.sim.beat, ret: (document.querySelector('#isx-sn-body .dc-ep [data-epback]') || {}).textContent || '', k: (document.querySelector('#isx-sn-body .dc-ep .dc-k') || {}).textContent || '', n: document.querySelectorAll('#isx-sn-body .dc-ep .dc-epst').length, dcall: document.getElementById('isx-cock').classList.contains('dcall') }));
    ok(e0.ep === 'oil' && e0.beat === -1 && e0.dcall && e0.n === 6 && new RegExp('step ' + (from + 1)).test(e0.ret) && /Episode/i.test(e0.k), 'it opens on its entry screen: six steps, and the way back to the step it came from', e0);
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(400);
    const e1 = await p.evaluate(() => ({ ep: ISX.sim.lines[ISX.sim.line].ep, beat: ISX.sim.beat, ret: (document.querySelector('#isx-sn-body [data-epback]') || {}).textContent || '', k: document.querySelector('#isx-sn-body .s2k').innerText, where: document.querySelector('#isx-sn-pickb').innerText.replace(/\s+/g, ' ') }));
    ok(e1.ep === 'oil' && e1.beat === 0 && new RegExp('step ' + (from + 1)).test(e1.ret) && /Episode/i.test(e1.k) && /EPISODE/i.test(e1.where), 'then → opens its first step, with the way back to the step it came from', e1);
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => ISX.sim.ph === 'ask' && ISX.sim.dec === '6-1'), 'the oil call sits inside the episode');
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300);   /* call screen round: past the problem and what you weigh */
    await p.click('#isx-sn-body .dc-opt[data-dco="real"]'); await p.click('#isx-sn-body .dc-go'); await p.waitForTimeout(300);
    for (let i = 0; i < 4; i++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(250); }
    const e2 = await p.evaluate(() => ({ beat: ISX.sim.beat, n: ISX.sim.lines[ISX.sim.line].steps.length, next: document.querySelector('#isx-s2bar').innerText.replace(/\s+/g, ' ').slice(0, 80) }));
    ok(e2.beat === e2.n - 1 && /Back to the guide/i.test(e2.next), 'on its last step, Next reads “Back to the guide”', e2);
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(400);
    const e3 = await p.evaluate(() => ({ line: ISX.sim.line, beat: ISX.sim.beat, seen: !!document.querySelector('#isx-sn-body .cl-ep.seen[data-ep="oil"]') }));
    ok(e3.line === 0 && e3.beat === from && e3.seen, 'and returns to the step it came from, the door marked as seen', e3);
    const fi = M.indexOf('0-2'); await go(p, 0, fi);
    const f1 = await p.evaluate(() => { const d = document.querySelector('#isx-sn-body details.cl-epi'); if (!d) return null; d.querySelector('summary').click(); return { open: d.open, t: d.textContent.slice(0, 200) }; });
    ok(f1 && f1.open && /Silicon Valley Bank/.test(f1.t) && /\$165bn/.test(f1.t), 'Silicon Valley Bank opens as a fold in the card', f1);
    await p.context().close();
    const f = await open(1440, 900, { 'isx-sim-mode': 'full' });
    const tr = await f.evaluate(() => [...document.querySelectorAll('#isx-cock .pchip')].map(c => c.textContent.trim()));
    ok(tr.length === 6 && tr.join() === 'Oil shock,Calm breaks,Revolving door,To market,Yen action,Tariff pledges', 'the full view’s tray runs the six episodes', tr);
    await f.evaluate(() => document.querySelectorAll('#isx-cock .pchip')[1].click()); await f.waitForTimeout(400);
    const r1 = await f.evaluate(() => ({ t: (document.querySelector('#isx-rside h4') || {}).textContent || '', on: document.querySelectorAll('#isx-rmap .fe.on').length, k: (document.querySelector('#isx-rside .pk') || {}).textContent || '' }));
    ok(/March 2020/.test(r1.t) && r1.on === 3 && /Episode/.test(r1.k), 'an episode runs on the full map, step by step', r1);
    await f.context().close();
  }

  /* ---------- 6 the bar, the camera ---------- */
  if (want(6)) {
    const p = await open(1440, 900, { 'isx-way': 'ground' }, at(0, 12));
    const br = await p.evaluate(() => { const l = document.querySelector('#isx-sn-pickb'), els = [...l.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim()); return { t: l.innerText.replace(/\s+/g, ' '), cut: els.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent), vb: document.getElementById('isx-rmap').getAttribute('viewBox').split(' ').map(Number), w: document.getElementById('isx-rmap').clientWidth }; });
    ok(/ACT II · THE CHAIR/i.test(br.t) && /WHO BUYS THE DEBT\?/i.test(br.t) && !br.cut.length, 'the line button names the act and the chapter, uncut', br);
    ok(br.w / br.vb[2] <= 1.06, 'the camera zooms to 1.05 at most', (br.w / br.vb[2]).toFixed(3));
    await p.context().close();
    const w = await open(1920, 1080, { 'isx-way': 'ground' }, at(0, 12));
    const vb = await w.evaluate(() => { const s = document.getElementById('isx-rmap'), v = s.getAttribute('viewBox').split(' ').map(Number), r = s.getBoundingClientRect(), k = r.width / v[2], card = document.getElementById('isx-snarr').getBoundingClientRect(); return { left: r.left + (0 - v[0]) * k, right: r.left + (1182 - v[0]) * k, card: card.right, w: innerWidth }; });
    ok(vb.left >= vb.card && vb.right <= vb.w, '1920 × 1080: the whole map sits beside the card', vb);
    await go(w, 0, 30); const vb2 = await w.evaluate(() => document.getElementById('isx-rmap').getAttribute('viewBox'));
    await go(w, 0, 31); const vb3 = await w.evaluate(() => document.getElementById('isx-rmap').getAttribute('viewBox'));
    ok(vb2 === vb3, 'and stays still from step to step', [vb2, vb3]);
    await w.context().close();
  }

  /* ---------- 7 type floor, errors ---------- */
  if (want(7)) {
    const p = await open(1440, 900, { 'isx-way': 'ground' }, at(0, 12));
    const small = await p.evaluate(() => [...document.querySelectorAll('#isx-cl-nums *, #isx-sn-body .cl-q, #isx-sn-body .cl-a, #isx-sn-body .cl-epi *, #isx-sn-body .cl-new *')].filter(e => e.children.length === 0 && e.textContent.trim() && e.getClientRects().length && parseFloat(getComputedStyle(e).fontSize) < 10.5).map(e => e.className + ':' + getComputedStyle(e).fontSize));
    ok(!small.length, 'nothing in the round’s own elements is under 10.5 px', small.slice(0, 6));
    await p.context().close();
  }

  /* ---------- 8 the call screens (clarity patch) ---------- */
  if (want(8)) {
    const BP = await (async () => { const q = await open(800, 600, {}, {}); const j = await q.evaluate(async () => (await fetch('data/bond-panel.json')).json()); await q.context().close(); return j; })();
    const p = await open(1440, 900, { 'isx-way': 'guide' }, at(0, 0));
    const I = await p.evaluate(() => ({ calls: ISX.calls, sim: ISX.sim, ess: ISX.essays }));
    const where = k => { for (const [l, L] of I.sim.lines.entries()) { if (!L.main && !L.ep) continue; const i = L.steps.findIndex(x => x.fk === k); if (i > 0) return [l, i - 1]; } return null; };
    const D = I.sim.decisions.map(x => x.k);
    /* call screen round (18 Nov 2026): three steps, spoken to the reader; the data first */
    ok(D.length === 7 && D.every(k => I.calls[k]), 'every one of the seven calls has its screen', D.filter(k => !I.calls[k]));
    const shape = D.filter(k => { const C = I.calls[k]; return !(C.ask && C.prob && C.prob.t && C.prob.p.length >= 2 && C.prob.fig && C.prob.src && C.vars.length >= 3 && C.vars.length <= 4 && C.vars.every(V => V.n && V.v && V.t && (V.pull === 'real' || V.pull === 'alt' || V.pull === null) && (!V.big || V.bk)) && C.od && C.od.real && C.od.alt && C.pr && C.pr.real.length >= 2 && C.pr.alt.length >= 2); });
    ok(!shape.length, 'every call has its problem (title, sentences, one figure, sources), three or four forces, the question, both options in the reader’s words and where each moves the pressure', shape);
    const both = D.filter(k => !(I.calls[k].vars.some(V => V.pull === 'real') && I.calls[k].vars.some(V => V.pull === 'alt')));
    ok(!both.length, 'on every call at least one force pulls toward each option', both);
    const bad = []; D.forEach(k => { const C = I.calls[k]; [...C.vars, C.prob.fig].forEach(V => (V.bp || []).forEach(([txt, ser, mo]) => { const i = BP.m.indexOf(mo), v = i < 0 ? null : BP[ser][i], n = +String(txt).replace(/[%≈$]/g, ''); if (v == null || Math.abs(n - v) > 0.006) bad.push([k, txt, ser, mo, v]); })); });
    ok(!bad.length, 'every monthly average a call shows matches data/bond-panel.json', bad);
    const undated = []; D.forEach(k => I.calls[k].vars.forEach(V => { if (V.big && !/\d{4}/.test(V.bk)) undated.push([k, V.n]); }));
    ok(!undated.length, 'every figure a force shows says its date', undated);
    ok(D.every(k => I.calls[k].ess.length >= 1 && I.calls[k].ess.every(e => I.ess[e])), 'every call names at least one Substack piece the page lists', D.map(k => k + ':' + I.calls[k].ess));
    const OUT = ['10 December', '25 November', '9 April', '172 million', '31 July', 'removed the $500bn cap', 'final rule', 'So did'];
    const told = []; D.forEach(k => { const C = I.calls[k], t = [C.prob.t, ...C.prob.p, C.prob.src, ...C.vars.map(V => [V.n, V.t, V.bk || '', V.s || ''].join(' '))].join(' '); OUT.forEach(o => { if (t.includes(o)) told.push([k, o]); }); });
    ok(!told.length, 'neither the problem nor the forces name what happened', told);
    const second = D.filter(k => !/\b(You|you|your)\b/.test(I.calls[k].prob.p.join(' ')) || /\b(I|my)\b/.test(I.calls[k].prob.p.join(' ') + I.calls[k].vars.map(V => V.t).join(' ')));
    ok(!second.length, 'every problem speaks to the reader (“you”), none in the first person', second);
    const c1 = I.calls['0-1'];
    ok(/“departed from norms regarding the issuance profile of Treasury debt”/.test(c1.prob.p.join(' ')) && c1.prob.sl.some(s => /manhattan\.institute/.test(s[1])) && c1.prob.sl.some(s => /hudsonbaycapital\.com/.test(s[1])), 'the first call keeps Bessent’s words, quoted and linked, and the paper', c1.prob.sl.map(s => s[1]));
    ok(c1.prim && c1.prim.a[0] === 'A bill' && c1.prim.b[0] === 'A note or bond' && c1.prim.a[1].length === 3 && c1.prim.b[1].length === 3, 'the first call explains bills against bonds before any force is pressed', c1.prim);
    /* walk the first call from step 10, with the keyboard */
    const [l1, b1] = where('0-1'); await go(p, l1, b1);
    const look = () => p.evaluate(() => { const c = document.getElementById('isx-cock'), sn = document.getElementById('isx-snarr').getBoundingClientRect(), i = document.getElementById('isx-sn-in'), b = document.getElementById('isx-sn-body'), tb = document.getElementById('isx-tabs'), bar = document.getElementById('isx-s2low');
      return { ph: ISX.sim.ph, dp: ISX.sim.dp, np: ISX.sim.np, dcall: c.classList.contains('dcall'), cover: sn.left <= 0 && sn.top <= 0 && sn.right >= innerWidth && sn.bottom >= innerHeight, lock: document.documentElement.classList.contains('isx-dclock'), held: !!tb && tb.inert && getComputedStyle(tb).visibility === 'hidden' && !!bar && bar.inert, stage: document.getElementById('isx-stage').inert, fits: i.scrollHeight <= i.clientHeight + 1,
        h: (b.querySelector('.dc-h') || {}).textContent, kick: (b.querySelector('.dc-k') || {}).textContent, cur: (b.querySelector('.dc-steps [aria-current="step"]') || {}).textContent, vars: b.querySelectorAll('.dc-var').length, opts: b.querySelectorAll('.dc-opt').length, det: (b.querySelector('.dc-det') || {}).textContent || '', go: (b.querySelector('.dc-go') || {}).textContent || '', wait: !!b.querySelector('.dc-wait'), cnt: (b.querySelector('.dc-cnt') || {}).textContent || '', pos: JSON.parse(sessionStorage.getItem('isx-sim-pos')), focus: document.activeElement && document.activeElement.closest('#isx-snarr') ? document.activeElement.className : 'outside' }; });
    const pages = [];
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(350); pages.push(await look());
    ok(pages[0].ph === 'ask' && pages[0].dp === 0 && pages[0].np === 3 && /The old buyers have stopped buying/.test(pages[0].h) && /January 2025/.test(pages[0].kick) && /The problem/.test(pages[0].cur) && !pages[0].opts && !pages[0].vars, 'Next from step 10 opens the call on the problem, dated January 2025, with no options yet', pages[0]);
    ok(pages[0].dcall && pages[0].cover && pages[0].lock && pages[0].held && pages[0].stage && pages[0].focus !== 'outside', 'the call covers the window: the page under it is out of reach and out of sight, the page does not scroll (the call may, a little: plain-language round), focus is on the screen', pages[0]);
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(350); pages.push(await look());
    ok(pages[1].dp === 1 && /Four forces pull on this call/i.test(pages[1].h) && pages[1].vars === 4 && /A bill/.test(pages[1].det) && /A note or bond/.test(pages[1].det) && /0 of 4/.test(pages[1].cnt), 'Next turns to what you weigh: four forces, bills against bonds explained, none weighed yet', pages[1]);
    await p.keyboard.press('1'); await p.waitForTimeout(250); pages.push(await look());
    ok(/Pulls toward B · Borrow cheaply now, and add near-money/.test(pages[2].det) && /4\.34%/.test(pages[2].det) && /Source:/.test(pages[2].det) && /1 of 4/.test(pages[2].cnt), 'a force says which option it pulls toward, with its dated figure and source', pages[2].det.slice(0, 300));
    for (const n of ['2', '3', '4']) { await p.keyboard.press(n); await p.waitForTimeout(120); }
    pages.push(await look());
    ok(/4 of 4/.test(pages[3].cnt) && (await p.evaluate(() => [...document.querySelectorAll('#isx-sn-body .dc-var .pk')].map(x => x.textContent).join(''))) === 'BBAA B', 'every force weighed is marked with the option it pulls toward, or A B where it cuts both ways (the cash behind the bills, plain-language round)', pages[3].cnt);
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(350); pages.push(await look());
    const opt = await p.evaluate(() => [...document.querySelectorAll('#isx-sn-body .dc-opt')].map(o => [o.querySelector('.key').textContent, o.querySelector('.ot b').textContent, [...o.querySelectorAll('.ol i')].map(i => i.textContent), [...o.querySelectorAll('.ol em')].map(e => e.textContent + (e.classList.contains('w') ? '+' : '')), (o.querySelector('.osub') || {}).textContent || '']));
    ok(pages[4].dp === 2 && /How do you fund the deficit\?/.test(pages[4].h) && pages[4].opts === 2 && pages[4].wait && !pages[4].go, 'then your call: the question, two options, nothing made yet', pages[4]);
    ok(opt[0][0] === 'A' && opt[0][1] === 'Lock in the rate, and let investors carry the debt' && opt[0][4] === 'Keep selling long bonds' && opt[0][2].includes('higher long-term rates') && opt[1][0] === 'B' && opt[1][1] === 'Borrow cheaply now, and add near-money' && opt[1][4] === 'Sell more bills' && opt[1][2].includes('near-money for money funds') && opt[1][3].includes('What each costs today+'), 'each option leads with what it means, the move itself under it, what argues for it (the forces you weighed marked) and what it sets in motion (plain-language round)', opt);
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => ISX.sim.ph === 'ask' && ISX.sim.dp === 2), 'Next on the call does not leave it');
    await p.keyboard.press('b'); await p.waitForTimeout(250); pages.push(await look());
    ok(pages[5].ph === 'ask' && /Make this call/.test(pages[5].go) && /B · Sell more bills/.test(pages[5].go) && (await p.evaluate(() => document.querySelector('#isx-sn-body .dc-opt[data-dco="real"]').getAttribute('aria-pressed'))) === 'true', 'choosing B marks it and offers “Make this call”, without making it', pages[5]);
    ok(pages.slice(0, 2).every((x, i) => x.pos.ph === 'ask' && x.pos.dp === i), 'the stored place carries the step', pages.map(x => x.pos));
    const call = await p.evaluate(() => { const b = document.getElementById('isx-sn-body'); return { cal: !!b.querySelector('.dc-sup [data-remind]'), tip: (b.querySelector('.dc-tip') || {}).textContent, bmc: (b.querySelector('.dc-sup a[href*="buymeacoffee"]') || {}).href, ss: (b.querySelector('.dc-sup a.dc-ss') || {}).href, fine: (b.querySelector('.dc-fine') || {}).textContent }; });
    ok(call.cal && call.tip === 'Want to come back later? Set a reminder.' && /buymeacoffee\.com/.test(call.bmc || '') && /substack\.com/.test(call.ss || '') && /No right answer, no score/.test(call.fine || ''), 'the support row and the fine print on the call', call);
    await p.hover('#isx-sn-body .dc-sup [data-remind]'); await p.waitForTimeout(250);
    ok(await p.evaluate(() => getComputedStyle(document.querySelector('#isx-sn-body .dc-tip')).visibility === 'visible'), 'hovering the calendar shows the line');
    await p.click('#isx-sn-body .dc-sup [data-remind]'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => !!(ISX.remind && ISX.remind.on)), 'the calendar opens the reminder panel');
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    await p.evaluate(() => { if (ISX.remind && ISX.remind.on) document.querySelector('.rm .rm-x') && document.querySelector('.rm .rm-x').click(); }); await p.waitForTimeout(200);
    /* the problem page: its essays; the type */
    await p.click('#isx-sn-body [data-dcp="0"]'); await p.waitForTimeout(300);
    const pg0 = await p.evaluate(() => { const b = document.getElementById('isx-sn-body'), ff = s => getComputedStyle(b.querySelector(s)).fontFamily; return { ess: [...b.querySelectorAll('.dc-ess a')].map(a => a.href), src: (b.querySelector('.dc-src') || {}).textContent || '', fig: [...b.querySelectorAll('.dc-row b')].map(x => x.textContent), h: ff('.dc-h'), lab: ff('.dc-lab'), brand: getComputedStyle(document.querySelector('.brand h1')).fontFamily }; });
    ok(pg0.ess.length === 2 && pg0.ess.every(u => /substack\.com\/p\//.test(u)) && /Sources:/.test(pg0.src) && pg0.fig.join() === '47%,30%', 'the problem: its figure, its sources and the Substack pieces', pg0);
    ok(/^"?Saira Wide/.test(pg0.h) && /^"?Saira Wide/.test(pg0.brand) && /^"?Martian Mono/.test(pg0.lab), 'type: Saira Wide for the logo and the call titles, Martian Mono for the labels', [pg0.h, pg0.brand, pg0.lab]);
    /* reload keeps the step; Back and Esc leave */
    const rl0 = await open(1440, 900, { 'isx-way': 'guide' }, {});
    await rl0.evaluate(([l, bb]) => { sessionStorage.setItem('isx-sim-pos', JSON.stringify({ l, b: bb })); }, [l1, b1]); await rl0.reload(); await rl0.waitForFunction(() => !document.getElementById('isx-root').classList.contains('booting')); await rl0.waitForTimeout(900);
    await rl0.keyboard.press('ArrowRight'); await rl0.waitForTimeout(300); await rl0.keyboard.press('ArrowRight'); await rl0.waitForTimeout(300);
    await rl0.reload(); await rl0.waitForFunction(() => !document.getElementById('isx-root').classList.contains('booting')); await rl0.waitForTimeout(1200);
    ok(await rl0.evaluate(() => ISX.sim.ph === 'ask' && ISX.sim.dp === 1), 'a reload returns to the same step of the call');
    await rl0.keyboard.press('Escape'); await rl0.waitForTimeout(400);
    const esc = await rl0.evaluate(() => [ISX.sim.ph, ISX.sim.beat, document.getElementById('isx-cock').classList.contains('dcall'), document.documentElement.classList.contains('isx-dclock'), document.querySelectorAll('[data-dcinert]').length, getComputedStyle(document.getElementById('isx-tabs')).visibility]);
    ok(esc[0] === null && esc[1] === b1 && !esc[2] && !esc[3] && !esc[4] && esc[5] === 'visible', 'Esc leaves the call for step 10, and gives the page back', esc);
    await rl0.keyboard.press('ArrowRight'); await rl0.waitForTimeout(300); await rl0.evaluate(() => { location.hash = '#circuit'; }); await rl0.waitForTimeout(700);
    const away = await rl0.evaluate(() => [ISX.sim.ph, document.getElementById('isx-cock').classList.contains('dcall'), document.documentElement.classList.contains('isx-dclock'), document.querySelectorAll('[data-dcinert]').length, getComputedStyle(document.getElementById('isx-tabs')).visibility]);
    await rl0.evaluate(() => { location.hash = '#simulator'; }); await rl0.waitForTimeout(700);
    const back = await rl0.evaluate(() => [ISX.sim.ph, document.getElementById('isx-cock').classList.contains('dcall'), document.documentElement.classList.contains('isx-dclock')]);
    ok(away[0] === 'ask' && !away[1] && !away[2] && !away[3] && away[4] === 'visible' && back[0] === 'ask' && back[1] && back[2], 'another tab gives the page back while the call waits; the Simulator takes the window again', [away, back]);
    await rl0.context().close();
    await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(300);
    const bk1 = await p.evaluate(() => [ISX.sim.ph, ISX.sim.beat, document.getElementById('isx-cock').classList.contains('dcall')]);
    ok(bk1[0] === null && bk1[1] === b1 && !bk1[2], 'Back from the problem returns to step 10 and the map', bk1);
    await p.evaluate(() => ISX.route.next('sim').click()); await p.waitForTimeout(300);
    await p.click('#isx-sn-body [data-dcp="2"]'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => ISX.sim.dp === 2), 'the steps row opens a step');
    await p.click('#isx-sn-body .dc-opt[data-dco="alt"]'); await p.waitForTimeout(150); await p.click('#isx-sn-body .dc-go'); await p.waitForTimeout(400);
    const ch = await p.evaluate(() => [ISX.sim.ph, ISX.sim.c, document.getElementById('isx-cock').classList.contains('dcall'), document.getElementById('isx-stage').inert, document.documentElement.classList.contains('isx-dclock')]);
    ok(ch[0] === 'chain' && ch[1] === 0 && !ch[2] && !ch[3] && !ch[4], 'making the other call goes back to the map for its chain reaction', ch);
    await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => ISX.sim.ph === 'ask' && ISX.sim.dp === 2 && document.querySelector('#isx-sn-body .dc-opt[data-dco="alt"]').getAttribute('aria-pressed') === 'true'), 'Back from the chain returns to the call, the choice still marked');
    await p.click('#isx-sn-body .dc-opt[data-dco="real"]'); await p.waitForTimeout(150); await p.click('#isx-sn-body .dc-go'); await p.waitForTimeout(400);
    const rl = await p.evaluate(() => [ISX.sim.ph, ISX.sim.beat, (document.querySelector('#isx-sn-body .dyou') || {}).textContent || '']);
    ok(rl[0] === null && rl[1] === b1 + 1 && /Bessent’s Treasury/.test(rl[2]), 'making what happened goes to the next step, which says what Bessent’s Treasury did', rl);
    await p.context().close();
    /* every step of every call fits, at three desktop sizes, with a force open and an option chosen; nothing under 10.5 px */
    for (const [w, h] of [[1440, 900], [1280, 720], [1024, 768]]) {
      const q = await open(w, h, { 'isx-way': 'guide' }, {}); const over = [];
      for (const k of D) { const [l, bb] = where(k); for (let dp = 0; dp < 3; dp++) {
        await q.evaluate(([l, bb, dp]) => sessionStorage.setItem('isx-sim-pos', JSON.stringify({ l, b: bb, ph: 'ask', dp })), [l, bb, dp]);
        await q.reload(); await q.waitForFunction(() => !document.getElementById('isx-root').classList.contains('booting')); await q.waitForTimeout(700);
        if (dp === 1) { await q.click('#isx-sn-body .dc-var[data-dcv="0"]'); await q.waitForTimeout(150); }
        if (dp === 2) { await q.click('#isx-sn-body .dc-opt'); await q.waitForTimeout(150); }
        const r = await q.evaluate(() => { const i = document.getElementById('isx-sn-in'); return { k: ISX.sim.dec, dp: ISX.sim.dp, s: i.scrollHeight - i.clientHeight, wide: document.documentElement.scrollWidth <= innerWidth, small: [...document.querySelectorAll('#isx-sn-body .dc *')].filter(e => e.children.length === 0 && e.textContent.trim() && e.getClientRects().length && parseFloat(getComputedStyle(e).fontSize) < 10.5).map(e => e.textContent.trim().slice(0, 20)) }; });
        if (r.k !== k || r.dp !== dp || r.s > 160 || !r.wide || r.small.length) over.push(r);   /* plain-language round (18 Nov): Elias allows a slight scroll; never more than 160 px */
      } }
      ok(!over.length, `${w} × ${h}: every step of every call fits the window or scrolls at most 160 px, nothing under 10.5 px`, over.slice(0, 4));
      await q.context().close();
    }
    const o = await open(1440, 900, { 'isx-way': 'guide' }, at(0, where('0-7')[1], { ph: 'ask' }));
    ok(await o.evaluate(() => ISX.sim.ph === 'ask' && ISX.sim.dec === '0-7' && ISX.sim.dp === ISX.sim.np - 1), 'a place stored before the patch (no step) opens on the call itself');
    await o.context().close();
    /* phones: the window scrolls; Make this call is reachable */
    const m = await open(390, 844, { 'isx-way': 'guide' }, at(0, b1, { ph: 'ask', dp: 2 }));
    await m.click('#isx-sn-body .dc-opt[data-dco="real"]'); await m.waitForTimeout(300);
    const mm = await m.evaluate(() => { const c = document.getElementById('isx-snarr'), st = document.querySelector('#isx-cock .s2stage'), g = document.querySelector('#isx-sn-body .dc-go').getBoundingClientRect(); return { pos: getComputedStyle(c).position, stage: getComputedStyle(st).display, wide: document.documentElement.scrollWidth <= innerWidth, opts: document.querySelectorAll('#isx-sn-body .dc-opt').length, go: g.bottom <= innerHeight && g.top >= 0, tall: g.height >= 44 }; });
    ok(mm.pos === 'fixed' && mm.stage === 'none' && mm.wide && mm.opts === 2 && mm.go && mm.tall, 'phones: the call is the whole screen and scrolls, the map out of the way, “Make this call” brought into view', mm);
    await m.context().close();
    /* the inflows reveal */
    const f = await open(1440, 900, { 'isx-way': 'guide' }, {});
    const rv = await f.evaluate(() => { const P = ISX.sim.lines.find(L => L.pre); return P.steps.map(x => x.t); });
    ok(rv.includes('Inflows feed finance') && !rv.includes('Lower yields, higher prices'), 'first principles: “Inflows feed finance” replaces “Lower yields, higher prices”', rv);
    const ri = await f.evaluate(() => ISX.sim.lines.findIndex(L => L.pre)), rj = rv.indexOf('Inflows feed finance');
    await go(f, ri, rj); await f.waitForTimeout(300);
    const rt = await f.evaluate(() => { const b = document.getElementById('isx-sn-body'); b.querySelectorAll('details').forEach(d => d.open = true); return b.textContent; });
    ok(/Pettis/.test(rt) && /financialised industrial policy/.test(rt) && /whether AI will do that/.test(rt) && !/5\.13%/.test(rt), 'it credits Pettis, keeps the term, asks whether AI will do that, and drops the October yield', rt.slice(0, 300));
    await f.context().close();
    /* “Show hints again” */
    const hn = await open(1440, 900, { 'isx-hints-off': '1', 'isx-sim-mode': 'story' }, at(0, -1));
    const hv = await hn.evaluate(() => { const b = document.querySelector('#isx-sn-body .ge [data-b1more="hints"]'); return !!b && !b.hidden && b.getClientRects().length > 0; });
    await hn.click('#isx-sn-body .ge [data-b1more="hints"]'); await hn.waitForTimeout(200);
    ok(hv && await hn.evaluate(() => localStorage.getItem('isx-hints-off') !== '1' && document.activeElement && document.activeElement.hasAttribute('data-simtour')), 'the entry offers “Show hints again” once hints are hidden, and it brings them back', hv);
    await hn.context().close();
    const hp = await open(390, 844, { 'isx-hints-off': '1', 'isx-sim-mode': 'story' }, at(0, 4));
    await hp.click('[data-s4more]'); await hp.waitForTimeout(200);
    const hpv = await hp.evaluate(() => { const b = document.querySelector('#isx-b1more [data-b1more="hints"]'); return !!b && !b.hidden && b.getClientRects().length > 0; });
    await hp.click('#isx-b1more [data-b1more="hints"]'); await hp.waitForTimeout(200);
    ok(hpv && await hp.evaluate(() => localStorage.getItem('isx-hints-off') !== '1'), 'on phones the More menu offers it too', hpv);
    await hp.context().close();
  }
  ok(!errs.length, 'no page errors', errs.slice(0, 4));
  console.log(`clarity-check: ${pass} passed, ${fail} failed`);
  await b.close();
  process.exit(fail ? 1 : 0);
})();
