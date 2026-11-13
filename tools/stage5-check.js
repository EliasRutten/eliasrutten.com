/* Stage 5 checks for the Simulator: nothing flickers, nothing is shown before the guide reaches it, the opening card
   offers the full map as a real choice, the key readings stay on screen below 1180 px, the full ladder shows less at once.
   Usage: node tools/stage5-check.js [baseUrl] [--audit]   — needs `python3 -m http.server 8731` at the repo root.
   --audit prints, for every step of first principles and of the guide, what the step has reached and what is on screen.
   Exits 1 on a failed check.

   Flicker. Every step of first principles and of the guide (37), a step back, chapter jumps, every move of the nine plays and
   the fourteen levers on and off are run with motion on, once with the pointer parked off the map and once resting on it.
   A MutationObserver records every class change on actors, relations, zones, readings, levers and plays; the computed
   opacity of each is sampled every frame. A step fails if an element gains and loses the same class within it, or if its
   opacity turns round (up then down, or down then up). The card's own text swap (.s2body out / in) is not in scope. */
const { chromium } = require('playwright');
const args = process.argv.slice(2), AUDIT = args.includes('--audit');
const base = args.find(a => /^https?:/.test(a)) || 'http://127.0.0.1:8731/imperial-stack/';
let fails = 0;
const ok = (name, cond, extra) => { if (!cond) fails++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra !== undefined && (!cond || AUDIT) ? '  → ' + JSON.stringify(extra).slice(0, 600) : '')); };

/* in the page: the recorder */
const RECORDER = () => {
  const cock = document.getElementById('isx-cock'), SCOPE = '#isx-rmap .fn, #isx-rmap .fe, #isx-rmap .feh, #isx-rmap .fzg, .s4ri, .tile, .lv, .pchip';
  const key = el => { const d = el.dataset || {}, c = el.classList; return c.contains('fn') ? 'actor ' + d.n : c.contains('fe') ? 'relation ' + d.e : c.contains('feh') ? 'relation-hit ' + d.e : c.contains('fzg') ? 'zone ' + d.z : c.contains('s4ri') ? 'rail ' + d.rk : c.contains('tile') ? 'strip ' + d.rk : c.contains('lv') ? 'lever ' + d.l : c.contains('pchip') ? 'play ' + d.p : '?'; };
  const P = window.__s5 = { log: [], op: new Map(), on: false, t0: 0 };
  new MutationObserver(ms => {
    if (!P.on) return; const t = Math.round(performance.now() - P.t0), per = new Map();
    ms.forEach(m => { if (!m.target.matches || !m.target.matches(SCOPE)) return; let a = per.get(m.target); if (!a) per.set(m.target, a = []); a.push(m.oldValue || ''); });
    per.forEach((olds, el) => { olds.push(el.getAttribute('class') || ''); for (let i = 0; i < olds.length - 1; i++) { const o = new Set(olds[i].split(/\s+/).filter(Boolean)), n = new Set(olds[i + 1].split(/\s+/).filter(Boolean)); [...n].filter(c => !o.has(c)).forEach(c => P.log.push([key(el), c, '+', t])); [...o].filter(c => !n.has(c)).forEach(c => P.log.push([key(el), c, '-', t])); } });
  }).observe(cock, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
  const samp = () => {
    if (P.on) { const t = Math.round(performance.now() - P.t0); cock.querySelectorAll('#isx-rmap .fn, #isx-rmap .fe, #isx-rmap .fzg, .s4ri, .tile').forEach(el => { if (!el.ownerSVGElement && !el.getClientRects().length) return; const o = +getComputedStyle(el).opacity, k = key(el); let a = P.op.get(k); if (!a) P.op.set(k, a = []); if (!a.length || Math.abs(a[a.length - 1][1] - o) > .004) a.push([t, +o.toFixed(3)]); }); }
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
  fns.forEach(g => {
    const n = g.dataset.n, t = g.querySelector('.fnt').textContent; if (!N || N.has(n) || g.classList.contains('tmp')) return;
    if (!g.classList.contains('s4dim')) leaks.push('actor ' + n + ' is not dimmed');
    if (g.classList.contains('lit') || g.classList.contains('sel')) leaks.push('actor ' + n + ' is lit');
    const s = g.querySelector('.fns'); if (s && getComputedStyle(s).display !== 'none' && +getComputedStyle(s).opacity > .02) leaks.push('actor ' + n + ' shows its value line: ' + s.textContent);
    if (g.getAttribute('aria-label') !== t + ': later in the guide') leaks.push('actor ' + n + ' is read out: ' + g.getAttribute('aria-label'));
    if (g.getAttribute('tabindex') !== '-1') leaks.push('actor ' + n + ' can be tabbed to');
  });
  if (E) fes.forEach(p => { const i = +p.dataset.e; if (!E.has(i) && +getComputedStyle(p).opacity > .02) leaks.push('relation ' + i + ' (' + S.relations[i].join('→') + ') is visible'); });
  const rd = [...cock.querySelectorAll('.s4ri, .tile')].filter(shown); let vals = 0, dots = 0;
  rd.forEach(el => {
    const R = S.readings[+el.dataset.rk], tile = el.classList.contains('tile'), v = el.querySelector(tile ? '.tv' : 'b').textContent.trim(), where = (tile ? 'strip' : 'rail') + ' “' + R.k + '”';
    if (N && !N.has(R.node)) {
      dots++;
      if (/\d/.test(v) || v !== '·') leaks.push(where + ' shows a value: ' + v);
      if (/\d/.test((el.innerText || '').replace(R.k, '').replace(R.k.toUpperCase(), ''))) leaks.push(where + ' shows a figure: ' + el.innerText);
      if (el.dataset.tip !== '<b>' + R.k.replace(/&/g, '&amp;') + '</b><p>Later in the guide.</p>') leaks.push(where + ' has a tooltip with its note');
      if (el.classList.contains('hot') || el.classList.contains('on')) leaks.push(where + ' is lit');
      if (el.getAttribute('aria-disabled') !== 'true') leaks.push(where + ' is not marked as unavailable');
    } else { vals++; if (!/\d/.test(v)) leaks.push(where + ' has been reached but shows no value'); }
  });
  return { line: S.line, beat: S.beat, title: S.beat >= 0 && !done ? L.steps[S.beat].t : S.beat < 0 ? '(opening card)' : '(closing card)', reached: cum ? [cum.n.length, cum.e.length, cum.l.length] : 'all',
    onMap: [fns.filter(g => !g.classList.contains('s4dim')).length, fes.filter(p => +getComputedStyle(p).opacity > .02).length], valueLines: fns.filter(g => { const s = g.querySelector('.fns'); return s && getComputedStyle(s).display !== 'none' && +getComputedStyle(s).opacity > .02; }).length,
    readings: [vals, dots], leaks };
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
    for (let i = 2; i <= 37; i++) await step('guide step ' + i, key('ArrowRight'), 2100);
    ok(`flicker (${tag}): stepped through all 37`, (await where(p)).beat === 36);
    await step('guide: closing card', key('ArrowRight'), 2300);
    await step('guide: one step back', key('ArrowLeft'), 2100);
    await step('guide: jump to chapter 3', () => click(p, '#isx-s2bar .s2ch', 2), 2400);
    await step('guide: jump to chapter 6', () => click(p, '#isx-s2bar .s2ch', 5), 2400);
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
    ok('hover: in the guide, moving the pointer over an actor changes nothing on the map or in the readings', g.changes === 0, g);
    await click(p, '[data-s4tab="plays"]'); await p.waitForTimeout(1600);
    const box2 = await js(p, () => { const r = document.querySelector('#isx-rmap .fn[data-n="TSY"]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await p.mouse.move(box2[0] - 40, box2[1]); await p.mouse.move(box2[0], box2[1], { steps: 4 }); await p.waitForTimeout(300);
    ok('hover: in the full view, moving onto an actor lights its relations', await js(p, () => document.querySelector('#isx-rmap .fn[data-n="TSY"]').classList.contains('lit') && document.querySelectorAll('#isx-rmap .fe.on').length > 0));
    await p.mouse.move(5, 5, { steps: 3 }); await p.waitForTimeout(300);
    ok('hover: and moving off releases them', await js(p, () => document.querySelectorAll('#isx-rmap .fe.on, #isx-rmap .fn.lit').length === 0));
    await p.context().close();
  }
  { /* stepping faster than the entrances run ends in the same state as arriving there directly */
    const snap = () => [...document.querySelectorAll('#isx-rmap .fn, #isx-rmap .fe, #isx-rmap .fzg, .s4ri, .lv')].map(e => [...e.classList].sort().join('.') + '|' + (e.classList.contains('fe') ? (e.getAttribute('style') || '').replace(/\s/g, '') + '|' + (e.getAttribute('marker-end') ? 'm' : '') : '') + '|' + (e.classList.contains('s4ri') ? e.querySelector('b').textContent : '')).join('\n');
    const p = await page({}, { motion: true, pos: '{"l":0,"b":0}' });
    for (let i = 0; i < 20; i++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(140); }
    await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(120); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(3200);
    const at = await where(p), fast = await js(p, snap); await p.context().close();
    const q = await page({}, { motion: true, pos: JSON.stringify({ l: 0, b: at.beat }) }); const direct = await js(q, snap); await q.context().close();
    const fa = fast.split('\n'), da = direct.split('\n'), diff = fa.map((x, i) => x === da[i] ? null : [x, da[i]]).filter(Boolean);
    ok('fast stepping (20 steps, 140 ms apart, one back and forth): settles in the same state as opening step ' + (at.beat + 1) + ' directly', at.beat === 20 && diff.length === 0, { beat: at.beat, diff: diff.slice(0, 4) });
  }

  /* ================= 2. nothing is shown before the guide reaches it ================= */
  for (const [w, h] of [[1440, 900], [1024, 768]]) {
    const p = await page({}, { w, h }), rows = [], leaks = [];
    const take = async () => { const a = await js(p, AUDITOR); rows.push(a); a.leaks.forEach(x => leaks.push((a.line ? 'first principles ' : 'step ') + (a.beat + 1) + ': ' + x)); return a; };
    await take();
    await click(p, '#isx-sn-body .s4go'); await p.waitForTimeout(350);
    for (let i = 0; i < 7; i++) { await take(); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300); }
    await click(p, '#isx-sn-body .sn-go'); await p.waitForTimeout(350);
    let seenSteps = 0;
    for (let i = 0; i < 37; i++) { const a = await take(); if (a.line === 0 && a.beat === i) seenSteps++; await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300); }
    const end = await take();
    ok(`no early reveal (${w} px): opening card, 7 reveals of first principles and all 37 steps audited`, rows.length === 46 && seenSteps === 37, { rows: rows.length, seenSteps });
    ok(`no early reveal (${w} px): no actor lit, value line, relation, reading value, colour or tooltip before its step`, leaks.length === 0, leaks.slice(0, 10));
    ok(`no early reveal (${w} px): the opening card shows 34 dimmed names, no relation, no reading value`, rows[0].onMap.join() === '0,0' && rows[0].valueLines === 0 && rows[0].readings[0] === 0 && rows[0].readings[1] >= 5, rows[0]);
    ok(`no early reveal (${w} px): at the end of the guide everything is shown (34 actors, 59 relations)`, end.onMap.join() === '34,59' && end.readings[1] === 0, end);
    if (AUDIT && w === 1440) { console.log('\n  step | title | reached: actors, relations, levers | on the map: actors, relations | value lines | readings: with value, as a dot'); rows.forEach(a => console.log('  ' + [(a.line ? 'FP ' : '') + (a.beat + 1), a.title, JSON.stringify(a.reached), a.onMap.join(', '), a.valueLines, a.readings.join(', ')].join(' | '))); console.log(''); }
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
        const r = [...document.querySelectorAll('.s4ri')].find(x => !cum.has(S.readings[+x.dataset.rk].node)); r.click(); await wait(80); const c = side();
        return { a, k, c };
      });
      ok('no early reveal: an actor or a reading the guide has not reached cannot be opened (click, Enter, rail)', !dead.a && !dead.k && !dead.c, dead);
      await click(q, '.s4lad'); await q.waitForTimeout(300);
      const lad = await js(q, () => { const S = ISX.sim, cum = new Set(S.lines[0].steps[11].n), l = document.getElementById('isx-s5lad'), later = [...l.querySelectorAll('.s5later')]; return { open: !l.hidden, later: later.length, should: S.readings.filter(r => !cum.has(r.node)).length, digits: later.filter(x => /\d/.test(x.querySelector('.s5v').textContent) || !/Later in the guide/.test(x.textContent)).length, details: later.filter(x => x.querySelector('.s5d, button')).length, how: !!l.querySelector('.s5how'), slots: [...l.querySelectorAll('.s5wait')].length }; });
      ok('no early reveal: the full ladder, opened at step 12, keeps unreached rows to a name and “Later in the guide”', lad.open && lad.later === lad.should && lad.later > 0 && lad.digits === 0 && lad.details === 0 && !lad.how, lad);
      /* an other outcome borrows actors from later in the guide: they are named, not valued */
      await q.keyboard.press('Escape');
      const fork = await js(q, async () => {
        const S = ISX.sim, wait = ms => new Promise(r => setTimeout(r, ms)), i = S.lines[0].steps.findIndex((s, j) => j > 11 && false);
        for (let k = 0; k < 30; k++) { const o = [...document.querySelectorAll('#isx-sn-body [data-fk]')].find(x => x.dataset.fk !== 'real'); if (o) { o.click(); await wait(250); break; } document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await wait(120); }
        const T = ISX.sim; if (!T.alt) return { alt: null };
        const cum = new Set(T.lines[0].steps[T.beat].n), tmp = [...document.querySelectorAll('#isx-rmap .fn.tmp')];
        return { alt: T.alt, tmp: tmp.length, valued: tmp.filter(g => +getComputedStyle(g.querySelector('.fns')).opacity > .02).length, rail: [...document.querySelectorAll('.s4ri')].filter(x => !cum.has(T.readings[+x.dataset.rk].node) && (x.querySelector('b').textContent !== '·' || x.classList.contains('hot'))).length };
      });
      ok('no early reveal: in an other outcome, borrowed actors show a name only and their readings stay hidden', !!fork.alt && fork.valued === 0 && fork.rail === 0, fork);
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
    const full = await js(p, () => { const c = document.getElementById('isx-cock'), back = c.querySelector('.s4back'); return { mode: ISX.sim.mode, actors: c.querySelectorAll('#isx-rmap .fn:not(.s4dim)').length, back: !!back && back.getClientRects().length > 0 && /Back to the guide/.test(back.textContent), focus: document.activeElement && document.activeElement.className }; });
    ok('opening card: “Explore the full map” opens the full view (34 actors lit), focus lands in the bar, “Back to the guide” is there', full.mode === 'full' && full.actors === 34 && full.back && /s4tab/.test(full.focus), full);
    await click(p, '.s4back'); await p.waitForTimeout(600);
    ok('back to the guide: one click, and the opening card is back', await js(p, () => ISX.sim.mode === 'story' && ISX.sim.beat === -1 && !!document.querySelector('#isx-sn-body .s4go')));
    await click(p, '#isx-sn-body .s4skip'); await p.waitForTimeout(300);
    for (let i = 0; i < 11; i++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(160); }
    await click(p, '[data-s4tab="plays"]'); await p.waitForTimeout(500); await click(p, '#isx-cock .pchip', 2); await p.waitForTimeout(300); await click(p, '#isx-pn'); await p.waitForTimeout(300);
    const lab = await js(p, () => document.querySelector('.s4back').textContent.replace(/\s+/g, ' ').trim());
    await click(p, '[data-s4tab="levers"]'); await p.waitForTimeout(400); await click(p, '#isx-s2tray-lev .lv', 3); await p.waitForTimeout(300);
    await click(p, '.s4back'); await p.waitForTimeout(600);
    const res = await js(p, () => ({ mode: ISX.sim.mode, beat: ISX.sim.beat, cnt: (document.querySelector('.sn-cnt') || {}).textContent, lit: document.querySelectorAll('#isx-rmap .fe.on').length, sel: document.querySelectorAll('.lv.on, .pchip.on').length }));
    ok('back to the guide: after a play and a lever, the guide picks up at the step it was left on (12 of 37), and the bar said so', res.mode === 'story' && res.beat === 11 && /^12\s*\/\s*37$/.test((res.cnt || '').trim()) && /step 12 of 37/.test(lab) && res.sel === 0, { res, lab });
    ok('no page errors (opening card)', p._errs.length === 0, p._errs); await p.context().close();
  }

  /* ================= 4. the readings: rail from 1180 px, strip of key readings below ================= */
  {
    const p = await page({}, { pos: '{"l":0,"b":9}' });
    const big = await js(p, () => ({ rail: [...document.querySelectorAll('.s4ri')].filter(e => e.getClientRects().length).length, strip: [...document.querySelectorAll('.s5strip .tile')].filter(e => e.getClientRects().length).length, counts: [document.querySelectorAll('.s4ri').length, document.querySelectorAll('#isx-cock .tile').length] }));
    ok('1440 px: the rail carries all 17 readings; the strip stays away', big.rail === 17 && big.strip === 0 && big.counts.join() === '17,17', big); await p.context().close();
  }
  for (const [w, h, touch] of [[1024, 768, false], [768, 1024, false], [390, 844, true]]) {
    const strip = () => { const s = document.querySelector('.s5strip'), sr = s.getBoundingClientRect(), tiles = [...s.querySelectorAll('.tile')].filter(e => e.getClientRects().length), keys = tiles.filter(e => e.classList.contains('s5key')), S = ISX.sim;
      const first = tiles.slice().sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left)[0], hit = [...document.querySelectorAll('#isx-rmap .fn.lit, #isx-rmap .fn.hg')].filter(g => { const r = g.getBoundingClientRect(); return r.top < sr.bottom - 1 && r.bottom > sr.top + 1 && r.left < sr.right && r.right > sr.left; }).length;
      return { shown: tiles.length, keys: keys.length, names: keys.map(e => S.readings[+e.dataset.rk].k), dots: keys.filter(e => e.querySelector('.tv').textContent === '·').length, hot: tiles.filter(e => e.classList.contains('hot')).length, firstHot: !!first && (first.classList.contains('hot') || !tiles.some(e => e.classList.contains('hot'))), h: Math.round(sr.height), inView: sr.top >= 0 && sr.left >= 0 && sr.left < innerWidth && keys[0].getBoundingClientRect().left < innerWidth, rail: [...document.querySelectorAll('.s4ri')].filter(e => e.getClientRects().length).length, hit, lad: [...document.querySelectorAll('.s2rdb')].filter(e => e.getClientRects().length).length, scrollY: (c => c.getBoundingClientRect().bottom > innerHeight + 1 || c.scrollHeight > c.clientHeight + 1)(document.getElementById('isx-cock')) };
    };
    let p = await page({}, { w, h, touch });
    const o = await js(p, strip);
    ok(`${w} px, opening card: the five key readings are on screen, each a name and a dot; no rail`, o.keys === 5 && o.shown === 5 && o.dots === 5 && o.rail === 0 && o.h <= 44 && o.names.join('|') === 'Fed funds target|Bills share of debt|10-year yield|Bond volatility|Big Tech capex 2026', o);
    await p.context().close(); p = await page({}, { w, h, touch, pos: '{"l":0,"b":9}' });
    const g = await js(p, strip);
    ok(`${w} px, step 10: key readings stay (those reached with their value), the reading in play comes first, the strip is one slim row`, g.keys === 5 && g.hot >= 1 && g.firstHot && g.dots === 0 && g.h <= 44 && g.inView && g.lad === 1, g);
    ok(`${w} px, step 10: the strip covers none of the actors in play`, g.hit === 0, g);
    if (w > 760) ok(`${w} px: the view does not scroll vertically`, !g.scrollY, g);
    await click(p, '[data-s4tab="plays"]'); await p.waitForTimeout(700);
    const f = await js(p, strip);
    ok(`${w} px, full view: the five key readings with their values`, f.keys === 5 && f.dots === 0 && f.h <= 44 && f.lad === 1, f);
    await click(p, '.s2rdb'); await p.waitForTimeout(300);
    ok(`${w} px: the button at the end of the strip opens the full ladder with 17 rows`, await js(p, () => { const l = document.getElementById('isx-s5lad'); return !l.hidden && l.getClientRects().length > 0 && l.querySelectorAll('.s5row').length === 17; }));
    ok(`no page errors (${w} px)`, p._errs.length === 0, p._errs); await p.context().close();
  }

  /* ================= 5. the full ladder ================= */
  {
    const p = await page({ 'isx-sim-mode': 'full' });
    await click(p, '.s4lad'); await p.waitForTimeout(350);
    const L = await js(p, () => { const l = document.getElementById('isx-s5lad'), v = e => e.getClientRects().length > 0 && (!e.checkVisibility || e.checkVisibility()), rows = [...l.querySelectorAll('.s5row')], bar = document.getElementById('isx-s2bar').getBoundingClientRect(), r = l.getBoundingClientRect();
      return { open: !l.hidden, rows: rows.length, per: [...l.querySelectorAll('.s5g')].map(g => g.querySelectorAll('.s5row').length), rungs: [...l.querySelectorAll('.s5g h4 b')].map(e => e.textContent), three: rows.filter(x => x.querySelector('.s5n').textContent && /\d/.test(x.querySelector('.s5v').textContent) && x.querySelector('.s5m').textContent.length > 12).length, oneLine: rows.filter(x => x.querySelector('.s5m').getBoundingClientRect().height < 20).length,
        detailsShown: [...l.querySelectorAll('.s5d')].filter(v).length, srcShown: [...l.querySelectorAll('.lsrc')].filter(v).length, slotsShown: [...l.querySelectorAll('.slot3, .fig3')].filter(v).length, slots: l.querySelectorAll('.slot3').length, figs: l.querySelectorAll('.fig3').length, sectors: l.querySelectorAll('.secb3').length, arrows: [l.querySelectorAll('.larr3 .dn').length, l.querySelectorAll('.larr3 .up').length], source: !!l.querySelector('.lsrc3'),
        fit: l.scrollHeight <= l.clientHeight + 1, aboveBar: r.bottom <= bar.top + 1, inside: r.bottom <= innerHeight }; });
    ok('ladder: all 17 readings, grouped Upstream / Intermediate / Downstream (4, 4, 9)', L.open && L.rows === 17 && L.per.join() === '4,4,9' && L.rungs.join() === 'Upstream,Intermediate,Downstream', L);
    ok('ladder: each row shows a name, a value and one line of meaning; notes, sources, slots and figures are closed', L.three === 17 && L.oneLine === 17 && L.detailsShown === 0 && L.srcShown === 0 && L.slotsShown === 0, L);
    ok('ladder: nothing was dropped: 6 slots not yet measured, the figures from elsewhere, the source layer, 5 sectors, arrows both ways', L.slots === 6 && L.figs >= 6 && L.sectors === 5 && L.arrows.join() === '3,3' && L.source, L);
    ok('ladder: fits 1440×900 without scrolling, clear of the bar', L.fit && L.aboveBar && L.inside, L);
    await click(p, '#isx-s5lad .s5rb', 4); await p.waitForTimeout(150);
    const d1 = await js(p, () => { const l = document.getElementById('isx-s5lad'), b = l.querySelectorAll('.s5rb')[4], d = document.getElementById(b.getAttribute('aria-controls')); return { exp: b.getAttribute('aria-expanded'), shown: !d.hidden, src: /Source: \S/.test(d.textContent), find: !!d.querySelector('.s5find'), text: d.textContent.length }; });
    await click(p, '#isx-s5lad .s5rb', 9); await p.waitForTimeout(150);
    const d2 = await js(p, () => [...document.querySelectorAll('#isx-s5lad .s5rb[aria-expanded="true"]')].length);
    ok('ladder: a click on a row opens its note, source and the way to its actor; one row open at a time', d1.exp === 'true' && d1.shown && d1.src && d1.find && d1.text > 60 && d2 === 1, { d1, d2 });
    await js(p, () => document.querySelector('#isx-s5lad .s5rb[aria-expanded="true"]').parentNode.querySelector('.s5find').click()); await p.waitForTimeout(350);
    ok('ladder: “Find … on the map” closes the ladder and selects the actor', await js(p, () => document.getElementById('isx-s5lad').hidden && !!document.querySelector('#isx-rmap .fn.sel') && !document.getElementById('isx-rside').hidden));
    await p.keyboard.press('Escape'); await click(p, '.s4lad'); await p.waitForTimeout(250); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    ok('ladder: Esc closes it', await js(p, () => document.getElementById('isx-s5lad').hidden && !document.getElementById('isx-cock').classList.contains('rd-open')));
    ok('no page errors (ladder)', p._errs.length === 0, p._errs); await p.context().close();
    const q = await page({ 'isx-sim-mode': 'full' }, { w: 1280, h: 760 }); await click(q, '.s4lad'); await q.waitForTimeout(350);
    ok('ladder: at 1280×760 it stays inside the window and clear of the bar', await js(q, () => { const r = document.getElementById('isx-s5lad').getBoundingClientRect(), bar = document.getElementById('isx-s2bar').getBoundingClientRect(); const c = document.getElementById('isx-cock'); return r.bottom <= bar.top + 1 && r.top >= 0 && c.getBoundingClientRect().bottom <= innerHeight + 1; })); await q.context().close();
  }

  /* ================= 6. counts ================= */
  {
    const p = await page({ 'isx-sim-mode': 'full' });
    const n = await js(p, () => { const S = ISX.sim, c = document.getElementById('isx-cock'); return [c.querySelectorAll('#isx-rmap .fn').length, c.querySelectorAll('#isx-rmap .fe').length, c.querySelectorAll('.lv').length, S.readings.length, c.querySelectorAll('.pchip').length, S.lines.find(l => l.main).steps.length]; });
    ok('counts: 34 actors, 59 relations, 14 levers, 17 readings, 9 plays, 37 guide steps', n.join() === '34,59,14,17,9,37', n); await p.context().close();
  }

  await b.close();
  console.log(fails ? `\n${fails} check(s) failed` : '\nall stage 5 checks pass');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
