/* Stage 5 checks for the Simulator: nothing flickers, nothing is shown before the guide reaches it, the opening card
   offers the full map as a real choice, the indicators sit on the map at every width (B1-3: gauge nodes and tags; an in-play strip on phones), the role ledger
   shows one line per indicator.
   Usage: node tools/stage5-check.js [baseUrl] [--audit]   — needs `python3 -m http.server 8731` at the repo root.
   --audit prints, for every step of first principles and of the guide, what the step has reached and what is on screen.
   Exits 1 on a failed check.

   Flicker. Every step of first principles and of the guide (37), a step back, chapter jumps, every move of the nine plays and
   the fourteen levers on and off are run with motion on, once with the pointer parked off the map and once resting on it.
   A MutationObserver records every class change on actors, gauge nodes, tags, relations, zones, levers and plays; the computed
   opacity of each is sampled every frame. A step fails if an element gains and loses the same class within it, or if its
   opacity turns round (up then down, or down then up). The card's own text swap (.s2body out / in) is not in scope. */
const { chromium } = require('playwright');
const args = process.argv.slice(2), AUDIT = args.includes('--audit');
const base = args.find(a => /^https?:/.test(a)) || 'http://127.0.0.1:8731/imperial-stack/';
let fails = 0;
const ok = (name, cond, extra) => { if (!cond) fails++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra !== undefined && (!cond || AUDIT) ? '  → ' + JSON.stringify(extra).slice(0, 600) : '')); };

/* in the page: the recorder */
const RECORDER = () => {
  const cock = document.getElementById('isx-cock'), SCOPE = '#isx-rmap .fn, #isx-rmap .gt, #isx-rmap .fe, #isx-rmap .feh, #isx-rmap .fzg, .lv, .pchip';
  const key = el => { const d = el.dataset || {}, c = el.classList; return c.contains('fn') ? 'actor ' + d.n : c.contains('fe') ? 'relation ' + d.e : c.contains('feh') ? 'relation-hit ' + d.e : c.contains('fzg') ? 'zone ' + d.z : c.contains('gt') ? 'tag ' + d.ind : c.contains('lv') ? 'lever ' + d.l : c.contains('pchip') ? 'play ' + d.p : '?'; };
  const P = window.__s5 = { log: [], op: new Map(), on: false, t0: 0 };
  new MutationObserver(ms => {
    if (!P.on) return; const t = Math.round(performance.now() - P.t0), per = new Map();
    ms.forEach(m => { if (!m.target.matches || !m.target.matches(SCOPE)) return; let a = per.get(m.target); if (!a) per.set(m.target, a = []); a.push(m.oldValue || ''); });
    per.forEach((olds, el) => { olds.push(el.getAttribute('class') || ''); for (let i = 0; i < olds.length - 1; i++) { const o = new Set(olds[i].split(/\s+/).filter(Boolean)), n = new Set(olds[i + 1].split(/\s+/).filter(Boolean)); [...n].filter(c => !o.has(c)).forEach(c => P.log.push([key(el), c, '+', t])); [...o].filter(c => !n.has(c)).forEach(c => P.log.push([key(el), c, '-', t])); } });
  }).observe(cock, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
  const samp = () => {
    if (P.on) { const t = Math.round(performance.now() - P.t0); cock.querySelectorAll('#isx-rmap .fn, #isx-rmap .gt, #isx-rmap .fe, #isx-rmap .fzg').forEach(el => { if (!el.ownerSVGElement && !el.getClientRects().length) return; const o = +getComputedStyle(el).opacity, k = key(el); let a = P.op.get(k); if (!a) P.op.set(k, a = []); if (!a.length || Math.abs(a[a.length - 1][1] - o) > .004) a.push([t, +o.toFixed(3)]); }); }
    requestAnimationFrame(samp);
  };
  requestAnimationFrame(samp);
  P.start = () => { P.log = []; P.op = new Map(); P.t0 = performance.now(); P.on = true; };
  P.stop = () => {
    P.on = false; const by = {};
    P.log.forEach(([k, c, s, t]) => { (by[k + ' .' + c] = by[k + ' .' + c] || []).push(s + t); });
    const cls = Object.entries(by).filter(([, ev]) => ev.some(e => e[0] === '+') && ev.some(e => e[0] === '-')).map(([k, ev]) => k + ' ' + ev.join(' '));
    const ops = [];
    P.op.forEach((a, k) => { if (a.length < 3) return; const path = [a[0][1]]; let dir = 0; for (let i = 1; i < a.length; i++) { const s = Math.sign(a[i][1] - a[i - 1][1]); if (s && s !== dir) { if (dir) path.push(a[i - 1][1]); dir = s; } } path.push(a[a.length - 1][1]); if (path.length > 2 && Math.min(...path.slice(1).map((v, i) => Math.abs(v - path[i]))) > .05) ops.push(k + ' ' + path.join('→')); });
    return { cls, ops, changes: P.log.length };
  };
};
/* in the page: what is on screen against what the guide has reached */
const AUDITOR = () => {
  const S = ISX.sim, L = S.lines[S.line], cock = document.getElementById('isx-cock'), story = S.mode === 'story';
  const done = S.beat >= L.steps.length, cum = !story || (done && L.main) ? null : S.beat < 0 ? { n: [], e: [], l: [] } : L.steps[Math.min(S.beat, L.steps.length - 1)];
  const N = cum ? new Set(cum.n) : null, E = cum ? new Set(cum.e) : null, leaks = [], shown = e => e.getClientRects().length > 0;
  const fns = [...cock.querySelectorAll('#isx-rmap .fn')], fes = [...cock.querySelectorAll('#isx-rmap .fe')];
  /* B1-3. An indicator is reached at the first step whose relations touch it, or at the step its data names (spec S1 §4.6) */
  const inds = S.indicators, IX = Object.fromEntries(inds.map(I => [I.id, I]));
  const reached = I => !cum || (L.main && I.at && I.at.main != null ? S.beat + 1 >= I.at.main : I.rel.some(i => E.has(i)));
  const txt = (g, sel) => [...g.querySelectorAll(sel)].map(x => x.textContent.trim()).join('');
  let vals = 0, onMap = 0;
  fns.forEach(g => {
    const n = g.dataset.n, gz = g.classList.contains('gn'), lab = g.getAttribute('aria-label') || '';
    if (!gz && g.textContent.trim() !== g.querySelector('.fnt').textContent.trim()) leaks.push('actor ' + n + ' carries more than its name: ' + g.textContent.trim());
    if (gz) g.dataset.ind.split(' ').forEach((id, k) => {
      const I = IX[id], v = txt(g, `[data-gv="${id}"]`), where = 'gauge “' + I.k + '”';
      if (reached(I)) { vals++; if (!/\d/.test(v)) leaks.push(where + ' has been reached but shows no value'); else onMap++; if (!k && g.classList.contains('sock')) leaks.push(where + ' has been reached but is still a socket'); return; }
      if (v) leaks.push(where + ' shows a value: ' + v);
      if (txt(g, `[data-gl="${id}"], [data-gt="${id}"]`)) leaks.push(where + ' shows its line or trend');
      const f = g.querySelector(`[data-gf="${id}"]`); if (f && +f.getAttribute('width') > 0) leaks.push(where + ' shows its fill');
      if (k) return;
      if (!g.classList.contains('sock') && !g.classList.contains('bor') && !g.classList.contains('sus')) leaks.push(where + ' is not a socket');
      if (g.classList.contains('play') || g.classList.contains('new')) leaks.push(where + ' is lit');
      if (g.dataset.tip) leaks.push(where + ' has a breakdown');
      const nd = g.querySelector('.gneedle'); if (nd && (Math.abs(nd.getAttribute('x2') - nd.getAttribute('x1')) > .2 || Math.abs(nd.getAttribute('y2') - nd.getAttribute('y1')) > .2)) leaks.push(where + ' shows its needle');
      if (!/: later in the guide$/.test(lab)) leaks.push(where + ' is read out: ' + lab);
    });
    if (!N || N.has(n) || g.classList.contains('tmp')) return;
    if (!g.classList.contains('s4dim')) leaks.push('actor ' + n + ' is not dimmed');
    if (g.classList.contains('lit') || g.classList.contains('sel')) leaks.push('actor ' + n + ' is lit');
    if (gz ? !/: later in the guide$/.test(lab) : lab !== g.querySelector('.fnt').textContent + ': later in the guide') leaks.push('actor ' + n + ' is read out: ' + lab);
    if (g.getAttribute('tabindex') !== '-1') leaks.push('actor ' + n + ' can be tabbed to');
  });
  if (E) fes.forEach(p => { const i = +p.dataset.e; if (!E.has(i) && +getComputedStyle(p).opacity > .02) leaks.push('relation ' + i + ' (' + S.relations[i].join('→') + ') is visible'); });
  cock.querySelectorAll('#isx-rmap .gt').forEach(g => {
    const I = IX[g.dataset.ind], v = txt(g, '[data-gv]'), where = 'tag “' + I.k + '”', drawn = getComputedStyle(g).display !== 'none';
    if (reached(I)) { vals++; if (!/\d/.test(v)) leaks.push(where + ' has been reached but shows no value'); else if (!drawn) leaks.push(where + ' has been reached but is not drawn'); else onMap++; return; }
    if (v) leaks.push(where + ' shows a value: ' + v);
    if (drawn && !g.classList.contains('bor')) leaks.push(where + ' is drawn');
    if (g.classList.contains('play') || g.classList.contains('new')) leaks.push(where + ' is lit');
    if (g.dataset.tip) leaks.push(where + ' has a breakdown');
    if (g.getAttribute('tabindex') !== '-1') leaks.push(where + ' can be tabbed to');
    if (g.getAttribute('aria-label') !== I.k + ': later in the guide') leaks.push(where + ' is read out: ' + g.getAttribute('aria-label'));
  });
  /* the Indicators button and, on phones, the in-play strip */
  const nR = inds.filter(reached).length, btn = cock.querySelector('#isx-b1ind b'), all = cock.querySelector('#isx-b1play .ipc.all'), chips = [...cock.querySelectorAll('#isx-b1play .ipc:not(.all)')].filter(shown);
  if (btn && btn.textContent !== nR + ' / ' + inds.length) leaks.push('the Indicators button counts ' + btn.textContent + '; the guide has reached ' + nR);
  if (all && shown(all) && !new RegExp(!nR ? '0 of ' + inds.length : nR < inds.length ? 'All ' + nR + ' of ' + inds.length : 'All ' + inds.length + ' indicators').test(all.textContent)) leaks.push('the strip counts “' + all.textContent.trim() + '”; the guide has reached ' + nR);
  chips.forEach(c => { const I = IX[c.dataset.ipc], v = c.querySelector('b').textContent; if (!reached(I) && (/\d/.test(v) || !c.classList.contains('fl'))) leaks.push('strip chip “' + I.k + '” is shown before its step: ' + v); if (reached(I) && !/\d/.test(v)) leaks.push('strip chip “' + I.k + '” has no value'); });
  return { line: S.line, beat: S.beat, title: S.beat >= 0 && !done ? L.steps[S.beat].t : S.beat < 0 ? '(opening card)' : '(closing card)', reached: cum ? [cum.n.length, cum.e.length, cum.l.length] : 'all',
    onMap: [fns.filter(g => !g.classList.contains('s4dim')).length, fes.filter(p => +getComputedStyle(p).opacity > .02).length], valueLines: onMap,
    indicators: [vals, inds.length - nR], chips: chips.length, leaks };
};

(async () => {
  const b = await chromium.launch();
  const page = async (ls = {}, opts = {}) => {
    const c = await b.newContext({ viewport: { width: opts.w || 1440, height: opts.h || 900 }, deviceScaleFactor: 1, reducedMotion: opts.motion ? 'no-preference' : 'reduce', hasTouch: !!opts.touch, isMobile: !!opts.touch });
    const set = Object.assign({ 'isx-tips-globe': 'off', 'isx-tips-sim': 'off', 'isx-first': 'off', 'isx-insights': 'off', 'isx-tour': 'off', 'isx-sim-mode': 'story' }, ls), pos = opts.pos || null;
    await c.addInitScript(o => { try { if (!sessionStorage.getItem('__seeded')) { Object.keys(o.set).forEach(k => localStorage.setItem(k, o.set[k])); if (o.pos) sessionStorage.setItem('isx-sim-pos', o.pos); sessionStorage.setItem('__seeded', '1'); } } catch (e) {} }, { set, pos });
    const p = await c.newPage(); p._errs = []; p.on('pageerror', e => p._errs.push(String(e).slice(0, 200)));
    await p.goto(base + '#simulator', { waitUntil: 'load' });
    await p.waitForFunction(() => window.ISX && ISX.booted && document.getElementById('isx-cock'), null, { timeout: 60000 });
    await p.waitForTimeout(opts.wait || 1500);
    return p;
  };
  const js = (p, f, a) => p.evaluate(f, a);
  const click = (p, sel, n = 0) => p.evaluate(([s, i]) => { const e = document.querySelectorAll(s)[i]; if (e) e.click(); return !!e; }, [sel, n]);
  const where = p => p.evaluate(() => { const S = ISX.sim; return { mode: S.mode, line: S.line, beat: S.beat, steps: S.lines[S.line].steps.length }; });
  /* B1: → never chooses. One move forward: take what happened where the card asks for a choice, otherwise press → */
  const fwd = async p => { const picked = await p.evaluate(() => { const o = document.querySelector('#isx-sn-body [data-fk="real"], #isx-sn-body [data-pick="real"]'); if (o) { o.click(); return true; } return false; }); if (!picked) await p.keyboard.press('ArrowRight'); };

  /* ================= 1. flicker ================= */
  for (const rest of [false, true]) {
    const p = await page({}, { motion: true }), tag = rest ? 'pointer resting on the map' : 'pointer off the map';
    await js(p, RECORDER);
    if (rest) { await p.mouse.move(755, 475); await p.mouse.move(760, 480); }
    const bad = [], total = { steps: 0, changes: 0 };
    const step = async (name, act, wait) => {
      await js(p, () => __s5.start()); await act(); await p.waitForTimeout(wait);
      const r = await js(p, () => __s5.stop()); total.steps++; total.changes += r.changes;
      if (r.cls.length || r.ops.length) bad.push({ step: name, classes: r.cls.slice(0, 6), opacity: r.ops.slice(0, 6), more: Math.max(0, r.cls.length + r.ops.length - 12) });
    };
    const key = k => () => p.keyboard.press(k);
    await step('opening card → first principles', () => click(p, '#isx-sn-body .s4go'), 2100);
    for (let i = 2; i <= 7; i++) await step('first principles ' + i, key('ArrowRight'), 2100);
    await step('first principles: closing card', key('ArrowRight'), 2100);
    await step('→ guide, step 1', () => click(p, '#isx-sn-body .sn-go'), 2100);
    ok(`flicker (${tag}): the guide is at step 1 of 37`, await js(p, () => { const S = ISX.sim; return S.lines[S.line].main && S.beat === 0 && S.lines[S.line].steps.length === 37; }));
    for (let i = 2; i <= 37; i++) { for (let k = 0; k < 4 && (await where(p)).beat < i - 1; k++) await step('guide step ' + i + (k ? ' (move ' + (k + 1) + ')' : ''), () => fwd(p), 2100); }
    ok(`flicker (${tag}): stepped through all 37`, (await where(p)).beat === 36);
    await step('guide: closing card', key('ArrowRight'), 2300);
    await step('guide: one step back', key('ArrowLeft'), 2100);
    await step('guide: jump to chapter 3', () => click(p, '#isx-s2bar .rt-s .rt-sl', 3), 2400);
    await step('guide: jump to chapter 6', () => click(p, '#isx-s2bar .rt-s .rt-sl', 6), 2400);
    await step('guide: select an actor', () => js(p, () => document.querySelector('#isx-rmap .fn:not(.s4dim)').dispatchEvent(new MouseEvent('click', { bubbles: true }))), 1200);
    await step('guide: release it', key('Escape'), 1200);
    await step('→ Plays', () => click(p, '[data-s4tab="plays"]'), 2400);
    let moves = 0;
    for (let i = 0; i < 9; i++) {
      await step('play ' + (i + 1) + ': start', () => click(p, '#isx-cock .pchip', i), 1100); moves++;
      for (let s = 0; s < 14; s++) { const more = await js(p, () => { const n = document.getElementById('isx-pn'); return !!n && !/Finish/.test(n.textContent); }); if (!more) break; await step('play ' + (i + 1) + ': move ' + (s + 2), () => click(p, '#isx-pn'), 1000); moves++; }
      await step('play ' + (i + 1) + ': finish', () => click(p, '#isx-pn'), 1100);
    }
    await step('→ Levers', () => click(p, '[data-s4tab="levers"]'), 2000);
    for (let i = 0; i < 14; i++) { await step('lever ' + (i + 1) + ' pulled', () => click(p, `#isx-s2tray-lev .lv[data-l="${i}"]`), 900); await step('lever ' + (i + 1) + ' released', () => click(p, `#isx-s2tray-lev .lv[data-l="${i}"]`), 900); }
    await step('→ back to the guide', () => click(p, '[data-s4tab="guide"]'), 2400);
    ok(`flicker (${tag}): ${total.steps} steps (7 first principles, 37 guide, ${moves} play moves, 14 levers on and off), no class gained and lost within a step, no opacity that turns round`, bad.length === 0 && total.changes > 500, bad.length ? bad.slice(0, 8) : total);
    ok(`flicker (${tag}): no page errors`, p._errs.length === 0, p._errs);
    await p.context().close();
  }
  { /* hovering: nothing in the guide; in the full view only when the pointer itself moves */
    const p = await page({}, { motion: true, pos: '{"l":0,"b":9}' }); await js(p, RECORDER);
    const box = await js(p, () => { const r = document.querySelector('#isx-rmap .fn.lit').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await js(p, () => __s5.start()); await p.mouse.move(box[0] - 30, box[1] - 30); await p.mouse.move(box[0], box[1], { steps: 4 }); await p.waitForTimeout(500);
    const g = await js(p, () => __s5.stop());
    ok('hover: in the guide, moving the pointer over an actor changes nothing on the map or on the indicators', g.changes === 0, g);
    await click(p, '[data-s4tab="plays"]'); await p.waitForTimeout(1600);
    const box2 = await js(p, () => { const r = document.querySelector('#isx-rmap .fn[data-n="TSY"]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await p.mouse.move(box2[0] - 40, box2[1]); await p.mouse.move(box2[0], box2[1], { steps: 4 }); await p.waitForTimeout(300);
    ok('hover: in the full view, moving onto an actor lights its relations', await js(p, () => document.querySelector('#isx-rmap .fn[data-n="TSY"]').classList.contains('lit') && document.querySelectorAll('#isx-rmap .fe.on').length > 0));
    await p.mouse.move(5, 5, { steps: 3 }); await p.waitForTimeout(300);
    ok('hover: and moving off releases them', await js(p, () => document.querySelectorAll('#isx-rmap .fe.on, #isx-rmap .fn.lit').length === 0));
    await p.context().close();
  }
  { /* stepping faster than the entrances run ends in the same state as arriving there directly */
    const snap = () => [...document.querySelectorAll('#isx-rmap .fn, #isx-rmap .gt, #isx-rmap .fe, #isx-rmap .fzg, .lv')].map(e => [...e.classList].sort().join('.') + '|' + (e.classList.contains('fe') ? (e.getAttribute('style') || '').replace(/\s/g, '') + '|' + (e.getAttribute('marker-end') ? 'm' : '') : '') + '|' + (e.matches('.gn, .gt') ? [...e.querySelectorAll('[data-gv]')].map(x => x.textContent).join('/') : '')).join('\n');
    const p = await page({}, { motion: true, pos: '{"l":0,"b":0}' });
    for (let i = 0; i < 40 && (await where(p)).beat < 20; i++) { await fwd(p); await p.waitForTimeout(140); }
    await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(120); await fwd(p); await p.waitForTimeout(160); if ((await where(p)).beat < 20) await fwd(p); await p.waitForTimeout(3200);
    const at = await where(p), fast = await js(p, snap); await p.context().close();
    const q = await page({}, { motion: true, pos: JSON.stringify({ l: 0, b: at.beat }) }); const direct = await js(q, snap); await q.context().close();
    const fa = fast.split('\n'), da = direct.split('\n'), diff = fa.map((x, i) => x === da[i] ? null : [x, da[i]]).filter(Boolean);
    ok('fast stepping (20 steps, 140 ms apart, one back and forth): settles in the same state as opening step ' + (at.beat + 1) + ' directly', at.beat === 20 && diff.length === 0, { beat: at.beat, diff: diff.slice(0, 4) });
  }

  /* ================= 2. nothing is shown before the guide reaches it ================= */
  for (const [w, h, touch] of [[1440, 900, false], [1024, 768, false], [390, 844, true]]) {
    const p = await page({}, { w, h, touch }), rows = [], leaks = [];
    const take = async () => { const a = await js(p, AUDITOR); rows.push(a); a.leaks.forEach(x => leaks.push((a.line ? 'first principles ' : 'step ') + (a.beat + 1) + ': ' + x)); return a; };
    await take();
    await click(p, '#isx-sn-body .s4go'); await p.waitForTimeout(350);
    for (let i = 0; i < 7; i++) { await take(); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300); }
    await click(p, '#isx-sn-body .sn-go'); await p.waitForTimeout(350);
    let seenSteps = 0;
    for (let i = 0; i < 37; i++) { const a = await take(); if (a.line === 0 && a.beat === i) seenSteps++; for (let k = 0; k < 4 && (await where(p)).beat === i; k++) { await fwd(p); await p.waitForTimeout(300); } }
    await p.waitForTimeout(350);   /* the last relations fade in over a quarter of a second */
    const end = await take();
    ok(`no early reveal (${w} px): opening card, 7 reveals of first principles and all 37 steps audited`, rows.length === 46 && seenSteps === 37, { rows: rows.length, seenSteps });
    ok(`no early reveal (${w} px): no actor lit, relation, gauge value, tag, breakdown or strip chip before its step`, leaks.length === 0, leaks.slice(0, 10));
    ok(`no early reveal (${w} px): the opening card shows 34 dimmed names (8 of them sockets), no relation, no tag, no value`, rows[0].onMap.join() === '0,0' && rows[0].valueLines === 0 && rows[0].indicators.join() === '0,19', rows[0]);
    ok(`no early reveal (${w} px): at the end of the guide everything is shown (34 nodes, 59 relations, 19 indicators with their values)`, end.onMap.join() === '34,59' && end.indicators.join() === '19,0' && end.valueLines === 19, end);
    if (w <= 760) ok(`no early reveal (${w} px): the in-play strip carried chips on the way (${Math.max(...rows.map(a => a.chips))} at most), only for indicators the guide had reached`, rows.some(a => a.chips > 0) && rows[0].chips === 0, rows.map(a => a.chips).join(''));
    if (AUDIT && w === 1440) { console.log('\n  step | title | reached: actors, relations, levers | on the map: nodes, relations | values on the map | indicators: reached, later'); rows.forEach(a => console.log('  ' + [(a.line ? 'FP ' : '') + (a.beat + 1), a.title, JSON.stringify(a.reached), a.onMap.join(', '), a.valueLines, a.indicators.join(', ')].join(' | '))); console.log(''); }
    if (w === 1440) {
      /* acting on the map must not get ahead of the guide either: at step 12, select every actor reached so far */
      await p.context().close(); const q = await page({}, { w, h, pos: '{"l":0,"b":11}' });
      const sel = await js(q, async () => {
        const S = ISX.sim, cum = S.lines[0].steps[11], E = new Set(cum.e), out = [], wait = ms => new Promise(r => setTimeout(r, ms));
        for (const n of cum.n) {
          document.querySelector(`#isx-rmap .fn[data-n="${n}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(60);
          const vis = [...document.querySelectorAll('#isx-rmap .fe')].filter(p => !E.has(+p.dataset.e) && +getComputedStyle(p).opacity > .02).length;
          const listed = document.querySelectorAll('#isx-rside .nrel li').length, should = cum.e.filter(i => S.relations[i].includes(n)).length;
          const lit = [...document.querySelectorAll('#isx-rmap .fn.lit')].filter(g => !cum.n.includes(g.dataset.n)).length;
          if (vis || lit || listed !== should) out.push({ n, vis, lit, listed, should });
          document.querySelector(`#isx-rmap .fn[data-n="${n}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(40);
        }
        return out;
      });
      ok('no early reveal: selecting an actor at step 12 lights and lists only relations the guide has reached', sel.length === 0, sel);
      const dead = await js(q, async () => {
        const S = ISX.sim, cum = new Set(S.lines[0].steps[11].n), wait = ms => new Promise(r => setTimeout(r, ms)), side = () => { const s = document.getElementById('isx-rside'); return !!s && !s.hidden; };
        const g = [...document.querySelectorAll('#isx-rmap .fn')].find(x => !cum.has(x.dataset.n)); g.dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(80); const a = side();
        g.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await wait(80); const k = side();
        const sk = document.querySelector('#isx-rmap .fn.gn.sock'); sk.dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(80); const c = side();
        sk.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await wait(80); const c2 = side();
        const E = new Set(S.lines[0].steps[11].e), late = S.indicators.filter(I => I.tag && !I.rel.some(i => E.has(i))).map(I => document.querySelector(`#isx-rmap .gt[data-ind="${I.id}"]`));
        return { a, k, c, c2, tags: late.length, tagsOut: late.filter(x => getComputedStyle(x).display === 'none' && x.getAttribute('tabindex') === '-1').length };
      });
      ok('no early reveal: an actor or a gauge the guide has not reached cannot be opened (click, Enter); tags not yet reached are not drawn and not in the tab order', !dead.a && !dead.k && !dead.c && !dead.c2 && dead.tags > 0 && dead.tags === dead.tagsOut, dead);
      const dos = await js(q, async () => {
        const S = ISX.sim, cum = S.lines[0].steps[11], E = new Set(cum.e), out = [], wait = ms => new Promise(r => setTimeout(r, ms));
        for (const n of cum.n) {
          const g = document.querySelector(`#isx-rmap .fn[data-n="${n}"]`); g.dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(60);
          const got = document.querySelectorAll('#isx-rside .dtile, #isx-cock > .dossier .dtile').length, should = S.indicators.filter(I => I.node === n && I.rel.some(i => E.has(i))).length;
          if (got !== should) out.push({ n, got, should });
          g.dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(40);
        }
        return out;
      });
      ok('no early reveal: an actor’s dossier at step 12 carries only the indicators the guide has reached', dos.length === 0, dos);
      await click(q, '#isx-b1ind'); await q.waitForTimeout(300);
      const lad = await js(q, () => { const S = ISX.sim, E = new Set(S.lines[0].steps[11].e), l = document.getElementById('isx-b1led'), later = [...l.querySelectorAll('.lr.ind.later')]; return { open: !l.hidden, later: later.length, should: S.indicators.filter(I => !I.rel.some(i => E.has(i))).length, digits: later.filter(x => x.querySelector('b').textContent !== '·' || !/Later in the guide/.test(x.textContent) || /\d/.test(x.textContent.replace(x.querySelector('.ln').textContent, ''))).length, details: later.filter(x => x.querySelector('.ld, button')).length, how: !!l.querySelector('.lsrc3'), tips: [...l.querySelectorAll('.lr.ind:not(.later) .b1tip li.later')].length, figsLater: l.querySelectorAll('.lr.later:not(.ind)').length }; });
      ok('no early reveal: the role ledger, opened at step 12, keeps unreached rows to a name and “Later in the guide”; the source layer waits', lad.open && lad.later === lad.should && lad.later > 0 && lad.digits === 0 && lad.details === 0 && !lad.how, lad);
      /* an other outcome borrows actors from later in the guide: they are named, not valued */
      await q.keyboard.press('Escape');
      const fork = await js(q, async () => {
        const S = ISX.sim, wait = ms => new Promise(r => setTimeout(r, ms)), i = S.lines[0].steps.findIndex((s, j) => j > 11 && false);
        for (let k = 0; k < 30; k++) { const o = [...document.querySelectorAll('#isx-sn-body [data-fk]')].find(x => x.dataset.fk !== 'real'); if (o) { o.click(); await wait(250); break; } document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await wait(120); }
        const T = ISX.sim; if (!T.alt) return { alt: null };
        const cum = new Set(T.lines[0].steps[T.beat].n), tmp = [...document.querySelectorAll('#isx-rmap .fn.tmp')];
        const E = new Set(T.lines[0].steps[T.beat].e), late = T.indicators.filter(I => !I.rel.some(i => E.has(i)));
        return { alt: T.alt, tmp: tmp.length, valued: tmp.filter(g => g.textContent.trim() !== (g.querySelector('.fnt') || { textContent: g.textContent.trim() }).textContent.trim() && [...g.querySelectorAll('[data-gv], [data-gl], [data-gt]')].some(x => x.textContent.trim())).length, rail: late.filter(I => [...document.querySelectorAll(`#isx-rmap [data-gv="${I.id}"]`)].some(x => x.textContent.trim())).length };
      });
      ok('no early reveal: in an other outcome, borrowed actors and gauges show a name only and their indicators stay hidden', !!fork.alt && fork.valued === 0 && fork.rail === 0, fork);
      ok('no page errors (reveal)', q._errs.length === 0, q._errs); await q.context().close();
    } else { ok(`no page errors (reveal, ${w} px)`, p._errs.length === 0, p._errs); await p.context().close(); }
  }

  /* ================= 3. the opening card and the way back ================= */
  {
    const p = await page();
    const card = await js(p, () => { const r = s => { const e = document.querySelector('#isx-sn-body ' + s); return e ? e.getBoundingClientRect() : null; }, a = r('.s4go'), f = r('.s5full'), k = document.querySelector('#isx-sn-body .s4skip'), fs = getComputedStyle(document.querySelector('#isx-sn-body .s5full'));
      return { both: !!a && !!f, sameRow: !!a && !!f && Math.abs(a.top - f.top) < 1 && Math.abs(a.height - f.height) < 1, fullAfter: !!a && !!f && f.left > a.right, w: f && Math.round(f.width), h: f && Math.round(f.height), text: document.querySelector('#isx-sn-body .s5full b').textContent, border: fs.borderTopWidth, gold: getComputedStyle(document.querySelector('#isx-sn-body .s4go')).backgroundImage !== 'none', fullPlain: fs.backgroundImage === 'none', skip: !!k && /Skip to the plumbing/.test(k.textContent) && getComputedStyle(k).borderTopWidth === '0px', links: document.querySelectorAll('#isx-sn-body .s4start .s2lnk').length, own: /Explore on my own/.test(document.getElementById('isx-sn-body').textContent) }; });
    ok('opening card: “Start the guide” and “Explore the full map” are two buttons side by side, the same height', card.both && card.sameRow && card.fullAfter && card.w >= 200 && card.h >= 56 && card.text === 'Explore the full map', card);
    ok('opening card: the guide is the gold one, the full map is outlined; “Skip to the plumbing” is the one quiet link', card.gold && card.fullPlain && card.border === '1px' && card.skip && card.links === 1 && !card.own, card);
    await p.focus('#isx-sn-body .s5full'); await p.keyboard.press('Enter'); await p.waitForTimeout(700);
    const full = await js(p, () => { const c = document.getElementById('isx-cock'), back = c.querySelector('#isx-s2bar .rt-nx.ret'); return { mode: ISX.sim.mode, actors: c.querySelectorAll('#isx-rmap .fn:not(.s4dim)').length, back: !!back && back.getClientRects().length > 0 && /Back to the guide/.test(back.textContent), focus: document.activeElement && document.activeElement.className }; });
    ok('opening card: “Explore the full map” opens the full view (34 actors lit), focus lands in the bar, “Back to the guide” is there', full.mode === 'full' && full.actors === 34 && full.back && /rt-swb/.test(full.focus), full);
    await click(p, '#isx-s2bar .rt-nx.ret'); await p.waitForTimeout(600);
    ok('back to the guide: one click, and the opening card is back', await js(p, () => ISX.sim.mode === 'story' && ISX.sim.beat === -1 && !!document.querySelector('#isx-sn-body .s4go')));
    await click(p, '#isx-sn-body .s4skip'); await p.waitForTimeout(300);
    for (let i = 0; i < 30 && (await where(p)).beat < 11; i++) { await fwd(p); await p.waitForTimeout(160); }
    await click(p, '[data-s4tab="plays"]'); await p.waitForTimeout(500); await click(p, '#isx-cock .pchip', 2); await p.waitForTimeout(300); await click(p, '#isx-pn'); await p.waitForTimeout(300);
    const lab = await js(p, () => document.querySelector('#isx-s2bar .rt-nx.ret').textContent.replace(/\s+/g, ' ').trim());
    await click(p, '[data-s4tab="levers"]'); await p.waitForTimeout(400); await click(p, '#isx-s2tray-lev .lv', 3); await p.waitForTimeout(300);
    await click(p, '#isx-s2bar .rt-nx.ret'); await p.waitForTimeout(600);
    const res = await js(p, () => ({ mode: ISX.sim.mode, beat: ISX.sim.beat, cnt: (document.querySelector('.sn-cnt') || {}).textContent, lit: document.querySelectorAll('#isx-rmap .fe.on').length, sel: document.querySelectorAll('.lv.on, .pchip.on').length }));
    ok('back to the guide: after a play and a lever, the guide picks up at the step it was left on (12 of 37), and the bar said so', res.mode === 'story' && res.beat === 11 && /^12\s*\/\s*37$/.test((res.cnt || '').trim()) && /step 12 of 37/.test(lab) && res.sel === 0, { res, lab });
    ok('no page errors (opening card)', p._errs.length === 0, p._errs); await p.context().close();
  }

  /* ================= 4. the indicators: on the map at every width; an in-play strip on phones ================= */
  const onMap = () => { const v = e => e.getClientRects().length > 0, c = document.getElementById('isx-cock'), b = c.querySelector('#isx-b1ind'), led = document.getElementById('isx-b1led'), sr = document.getElementById('isx-b1play'), bar = document.getElementById('isx-s2bar').getBoundingClientRect(), br = b.getBoundingClientRect(), card = document.getElementById('isx-snarr');
    const hits = (a, r) => !!r && a.left < r.right && a.right > r.left && a.top < r.bottom && a.bottom > r.top, cr = card && v(card) ? card.getBoundingClientRect() : null;
    return { live: c.querySelectorAll('#isx-rmap .fn.gn:not(.sock)').length, sockets: c.querySelectorAll('#isx-rmap .fn.gn.sock').length, tags: [...c.querySelectorAll('#isx-rmap .gt')].filter(v).length, btn: b.querySelector('b').textContent, btnShown: v(b), btnClear: !v(b) || (br.right <= innerWidth && br.top >= 0 && br.bottom <= bar.top && !hits(br, cr)), strip: v(sr), old: c.querySelectorAll('.s4ri, .tile, .s5strip, #isx-s5lad, .s2rdb, .s4lad').length, led: !led.hidden && v(led), rows: led.querySelectorAll('.lr.ind').length, scrollY: (c => c.getBoundingClientRect().bottom > innerHeight + 1 || c.scrollHeight > c.clientHeight + 1)(c) }; };
  for (const [w, h] of [[1440, 900], [1280, 760], [1024, 768], [768, 1024]]) {
    let p = await page({}, { w, h });
    const o = await js(p, onMap);
    ok(`${w} px, opening card: 8 sockets, no tag, no value; the Indicators button counts “0 / 19” and waits behind the opening card; no rail, no strip`, o.live === 0 && o.sockets === 8 && o.tags === 0 && o.btn === '0 / 19' && !o.btnShown && !o.strip && o.old === 0, o);
    await p.context().close(); p = await page({}, { w, h, pos: '{"l":0,"b":9}' });
    const g = await js(p, onMap);
    ok(`${w} px, step 10: 2 gauge nodes carry their value, 7 tags hang under their actors, the button reads “9 / 19” and is clear of the card and the bar`, g.live === 2 && g.sockets === 6 && g.tags === 7 && g.btn === '9 / 19' && g.btnShown && g.btnClear && !g.strip, g);
    ok(`${w} px: the view does not scroll vertically`, !g.scrollY, g);
    await click(p, '[data-s4tab="plays"]'); await p.waitForTimeout(700);
    const f = await js(p, onMap);
    ok(`${w} px, full view: all 8 gauge nodes and 10 tags with their values; “19 / 19”`, f.live === 8 && f.tags === 10 && f.btn === '19 / 19' && f.btnClear, f);
    await click(p, '#isx-b1ind'); await p.waitForTimeout(300);
    const l = await js(p, onMap);
    ok(`${w} px: the Indicators button opens the role ledger with 19 rows`, l.led && l.rows === 19 && await js(p, () => { const r = document.getElementById('isx-b1led').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1; }), l);
    ok(`no page errors (${w} px)`, p._errs.length === 0, p._errs); await p.context().close();
  }
  { /* phones: the strip under the map carries only what the step moves, then the way to all of them */
    const strip = () => { const v = e => e.getClientRects().length > 0, s = document.getElementById('isx-b1play'), sr = s.getBoundingClientRect(), S = ISX.sim, chips = [...s.querySelectorAll('.ipc:not(.all)')], all = s.querySelector('.ipc.all'), map = document.getElementById('isx-rmap').getBoundingClientRect(), bar = document.getElementById('isx-s2bar').getBoundingClientRect();
      return { shown: v(s), chips: chips.map(c => [c.dataset.ipc, c.querySelector('b').textContent, c.querySelector('em').textContent]), all: all.textContent.trim(), h: Math.round(sr.height), below: sr.top >= map.bottom - 1, wide: s.scrollWidth > s.clientWidth, pageWide: document.scrollingElement.scrollWidth > innerWidth + 1, btn: v(document.getElementById('isx-b1ind')), mapVals: [...document.querySelectorAll('#isx-rmap [data-gv]')].filter(x => x.textContent.trim()).length, barFixed: getComputedStyle(document.getElementById('isx-s2bar')).position, barBottom: Math.round(innerHeight - bar.bottom) }; };
    let p = await page({}, { w: 390, h: 844, touch: true });
    const o = await js(p, strip);
    ok('390 px, opening card: the strip holds only the way to the indicators (“0 of 19”); no chip, no value on the map', o.shown && o.chips.length === 0 && /0 of 19/.test(o.all) && o.mapVals === 0 && !o.btn, o);
    await p.context().close(); p = await page({}, { w: 390, h: 844, touch: true, pos: '{"l":0,"b":9}' });
    const g = await js(p, strip), play10 = await js(p, () => { const S = ISX.sim, L = S.lines[0], now = new Set(L.steps[9].e), prev = new Set(L.steps[8].e), fresh = [...now].filter(i => !prev.has(i)); return S.indicators.filter(I => I.rel.some(i => fresh.includes(i))).map(I => I.id); });
    ok('390 px, step 10: one chip per indicator the step moves (name, value, role), then “All 9 of 19”; one row under the map; the page does not scroll sideways', g.chips.length > 0 && g.chips.every(c => /\d/.test(c[1]) && /setting|conduit|stress gauge|outcome|first moved here/.test(c[2])) && /All 9 of 19/.test(g.all) && g.h <= 66 && g.below && !g.pageWide, g);
    ok('390 px, step 10: the chips are the indicators in play, no fixed set', g.chips.map(c => c[0]).sort().join() === (await js(p, () => [...document.querySelectorAll('#isx-rmap .gn.play, #isx-rmap .gt.play')].flatMap(x => x.dataset.ind.split(' ')).sort().join())), { chips: g.chips, play10 });
    await p.context().close(); p = await page({}, { w: 390, h: 844, touch: true, pos: '{"l":0,"b":29}' });
    const t = await js(p, strip);
    ok('390 px, step 30: inflation and diesel arrive as “first moved here”', ['pce', 'diesel'].every(id => t.chips.some(c => c[0] === id && c[2] === 'first moved here')) && /All 19 indicators|All 19 of 19/.test(t.all), t);
    await js(p, () => document.querySelector('#isx-b1play .ipc.all').click()); await p.waitForTimeout(350);
    const sh = await js(p, () => { const l = document.getElementById('isx-b1led'), v = e => e.getClientRects().length > 0, r = l.getBoundingClientRect(); return { open: !l.hidden, tabs: [...l.querySelectorAll('.ltabs [data-ltab]')].filter(v).length, cols: [...l.querySelectorAll('.lcol')].filter(v).length, rows: l.querySelectorAll('.lr.ind').length, full: r.left <= 1 && r.right >= innerWidth - 1 && r.height > innerHeight * .7 }; });
    ok('390 px: “All … ›” opens the ledger as a sheet: the four roles as tabs, one role at a time, 19 rows in all', sh.open && sh.tabs === 4 && sh.cols === 1 && sh.rows === 19 && sh.full, sh);
    await js(p, () => document.querySelector('#isx-b1led [data-ltab="conduit"]').click()); await p.waitForTimeout(150);
    ok('390 px: a role tab switches the column', await js(p, () => { const v = e => e.getClientRects().length > 0, c = [...document.querySelectorAll('#isx-b1led .lcol')].filter(v); return c.length === 1 && c[0].dataset.role === 'conduit' && c[0].querySelectorAll('.lr.ind').length === 5; }));
    ok('no page errors (390 px)', p._errs.length === 0, p._errs); await p.context().close();
  }

  /* ================= 5. the role ledger ================= */
  {
    const p = await page({ 'isx-sim-mode': 'full' });
    await click(p, '#isx-b1ind'); await p.waitForTimeout(350);
    const L = await js(p, () => { const l = document.getElementById('isx-b1led'), v = e => !!e && e.getClientRects().length > 0 && (!e.checkVisibility || e.checkVisibility()), rows = [...l.querySelectorAll('.lr.ind')], bar = document.getElementById('isx-s2bar').getBoundingClientRect(), r = l.getBoundingClientRect();
      return { open: !l.hidden, rows: rows.length, per: [...l.querySelectorAll('.lcol')].map(g => g.querySelectorAll('.lr.ind').length), roles: [...l.querySelectorAll('.lcol h4 b')].map(e => e.textContent), three: rows.filter(x => x.querySelector('.ln').textContent.length > 2 && /\d/.test(x.querySelector('.lrb > b').textContent) && /^(step|first principles) \d+/.test(x.querySelector('.lrb > em').textContent)).length, detailsShown: [...l.querySelectorAll('.ld')].filter(v).length, srcShown: v(l.querySelector('.lsrc3')), slots: l.querySelectorAll('.lr.slot').length, slotDigits: [...l.querySelectorAll('.lr.slot')].filter(x => !/not yet measured/.test(x.textContent) || /\d/.test(x.textContent)).length, figs: l.querySelectorAll('.lr.fig').length, sectors: l.querySelectorAll('.secb3').length, link: /Settings move the conduits; conduits carry them to the outcomes; stress gauges say when a conduit can snap; outcomes feed back into the settings: inflation moved the policy rate on 16 September 2026\./.test(l.querySelector('.lfoot').textContent), source: !!l.querySelector('.lsrcd .lsrc3'), fit: l.scrollHeight <= l.clientHeight + 1, aboveBar: r.bottom <= bar.top + 1, inside: r.top >= 0 && r.left >= 0 && r.right <= innerWidth };
    });
    ok('ledger: all 19 indicators in four roles: Settings, Conduits, Stress gauges, Outcomes · balances (3, 5, 1, 10)', L.open && L.rows === 19 && L.per.join() === '3,5,1,10' && L.roles.join() === 'Settings,Conduits,Stress gauges,Outcomes · balances', L);
    ok('ledger: each row shows a name, a value and its first step; breakdowns and the source layer are closed', L.three === 19 && L.detailsShown === 0 && !L.srcShown, L);
    ok('ledger: nothing was dropped: 7 slots not yet measured (never a number), 4 figures from elsewhere, the source layer, 5 sectors, the link between the roles', L.slots === 7 && L.slotDigits === 0 && L.figs === 4 && L.sectors === 5 && L.link && L.source, L);
    ok('ledger: fits 1440×900 without scrolling, clear of the bar', L.fit && L.aboveBar && L.inside, L);
    await click(p, '#isx-b1led .lrb[data-led]', 4); await p.waitForTimeout(150);
    const d1 = await js(p, () => { const l = document.getElementById('isx-b1led'), b = l.querySelectorAll('.lrb[data-led]')[4], d = document.getElementById(b.getAttribute('aria-controls')); return { exp: b.getAttribute('aria-expanded'), shown: !d.hidden, src: /Source: /.test(d.textContent), moved: /Moved by|Moves/.test(d.textContent), find: !!d.querySelector('.lfind'), text: d.textContent.length }; });
    await click(p, '#isx-b1led .lrb[data-led]', 9); await p.waitForTimeout(150);
    const d2 = await js(p, () => [...document.querySelectorAll('#isx-b1led .lrb[aria-expanded="true"]')].length);
    ok('ledger: a click on a row opens its breakdown (what moves it, what it moves, the source) and the way to it on the map; one row open at a time', d1.exp === 'true' && d1.shown && d1.src && d1.moved && d1.find && d1.text > 60 && d2 === 1, { d1, d2 });
    await js(p, () => document.querySelector('#isx-b1led .lrb[aria-expanded="true"]').parentNode.querySelector('.lfind').click()); await p.waitForTimeout(350);
    ok('ledger: “Find it on the map” closes the ledger and selects the node', await js(p, () => document.getElementById('isx-b1led').hidden && !!document.querySelector('#isx-rmap .fn.sel') && !document.getElementById('isx-rside').hidden));
    await p.keyboard.press('Escape'); await click(p, '#isx-b1ind'); await p.waitForTimeout(250); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    ok('ledger: Esc closes it', await js(p, () => document.getElementById('isx-b1led').hidden && !document.getElementById('isx-cock').classList.contains('led-open')));
    ok('no page errors (ledger)', p._errs.length === 0, p._errs); await p.context().close();
    const q = await page({ 'isx-sim-mode': 'full' }, { w: 1280, h: 760 }); await click(q, '#isx-b1ind'); await q.waitForTimeout(350);
    ok('ledger: at 1280×760 it fits without scrolling, inside the window and clear of the bar', await js(q, () => { const l = document.getElementById('isx-b1led'), r = l.getBoundingClientRect(), bar = document.getElementById('isx-s2bar').getBoundingClientRect(); return r.top >= 0 && r.left >= 0 && r.right <= innerWidth && r.bottom <= bar.top + 1 && l.scrollHeight <= l.clientHeight + 1; }));
    await q.context().close();
  }

  /* ================= 6. counts ================= */
  {
    const p = await page({ 'isx-sim-mode': 'full' });
    const n = await js(p, () => { const S = ISX.sim, c = document.getElementById('isx-cock'); return [c.querySelectorAll('#isx-rmap .fn').length, c.querySelectorAll('#isx-rmap .fe').length, c.querySelectorAll('.lv').length, S.indicators.length, c.querySelectorAll('.pchip').length, S.lines.find(l => l.main).steps.length, c.querySelectorAll('#isx-rmap .fn.pl').length, c.querySelectorAll('#isx-rmap .fn.gn').length, c.querySelectorAll('#isx-rmap .gt').length]; });
    ok('counts: 26 actors + 8 gauge nodes (34 nodes), 59 relations, 14 levers, 19 indicators (10 of them tags), 9 plays, 37 guide steps', n.join() === '34,59,14,19,9,37,26,8,10', n); await p.context().close();
  }

  await b.close();
  console.log(fails ? `\n${fails} check(s) failed` : '\nall stage 5 checks pass');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
