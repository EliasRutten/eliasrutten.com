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
   7 type floor on the round's own elements; no page errors anywhere above */
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
        const c = await p.evaluate(() => { const bd = document.getElementById('isx-sn-body'), box = document.getElementById('isx-sn-in'); return { q: (bd.querySelector('h3.cl-q') || {}).textContent || '', a: (bd.querySelector('.cl-a') || {}).textContent || '', k: bd.querySelector('.s2k').innerText, nw: [...bd.querySelectorAll('.cl-new > div')].map(d => [d.querySelector('dt').textContent, d.querySelector('dd').textContent]), act: (bd.querySelector('.cl-act') || {}).textContent || '', fits: box.scrollHeight <= box.clientHeight + 1 }; });
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
    const a1 = await p.evaluate(() => [ISX.sim.ph, !!document.getElementById('isx-cl-nums')]);
    await p.click('.dopt[data-fk="alt"]'); await p.waitForTimeout(300);
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
    const e1 = await p.evaluate(() => ({ ep: ISX.sim.lines[ISX.sim.line].ep, beat: ISX.sim.beat, ret: (document.querySelector('#isx-sn-body [data-epback]') || {}).textContent || '', k: document.querySelector('#isx-sn-body .s2k').innerText, where: document.querySelector('#isx-sn-pickb').innerText.replace(/\s+/g, ' ') }));
    ok(e1.ep === 'oil' && e1.beat === 0 && new RegExp('step ' + (from + 1)).test(e1.ret) && /Episode/i.test(e1.k) && /EPISODE/i.test(e1.where), 'it opens at its first step, with the way back to the step it came from', e1);
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => ISX.sim.ph === 'ask' && ISX.sim.dec === '6-1'), 'the oil call sits inside the episode');
    await p.click('.dopt[data-fk="real"]'); await p.waitForTimeout(300);
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
  ok(!errs.length, 'no page errors', errs.slice(0, 4));
  console.log(`clarity-check: ${pass} passed, ${fail} failed`);
  await b.close();
  process.exit(fail ? 1 : 0);
})();
