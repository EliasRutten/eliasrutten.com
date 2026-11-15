/* Tiers build A (15 Nov 2026): checks on what the round changed (claude/specs/tiers.md §1, §1.1, §2, §3b, §4.3, §6).
   Usage: node tools/tiers-check.js [baseUrl]. Needs `python3 -m http.server 8731` at the repo root. Exits 1 on a failed check.
   1 the chapter order and where the seven decisions sit; the ledes the order needs
   2 the door card: three doors, named by what each route assumes, the guide gold, the ground-up door locked until the primer exists;
     the minutes computed from the text; one storage key (isx-way) and the “Last time” mark; one screen at 1280×760; phones
   3 the thesis: Elias Rutten's wording, no economist named, three term tips; the first-principles close points to the build-out
   4 expert mode: the key line (full view only), “Guide steps” (index, Esc, focus back), a step opened from it with the way back,
     “In the guide” in the dossiers of the full view
   5 term tips: the glossary entries, tips define and carry no figures; the tooltip is tied to its term, Esc hides it, it can be
     hovered, a tap toggles it, it never covers the term */
const { chromium } = require('playwright');
const base = process.argv.slice(2).find(a => /^https?:/.test(a)) || 'http://127.0.0.1:8731/imperial-stack/';
let pass = 0, fail = 0;
const ok = (c, t, x) => { if (c) pass++; else { fail++; console.log('FAIL  ' + t + (x !== undefined ? '  ' + (typeof x === 'string' ? x : JSON.stringify(x)).slice(0, 700) : '')); } };
const OFF = ['isx-tips-globe', 'isx-tips-sim', 'isx-tour', 'isx-first', 'isx-insights', 'isx-simtour'];
const wait = ms => new Promise(r => setTimeout(r, ms));
const ORDER = ['A data centre gets paid for', 'The allies’ savings come back', 'The consumer keeps it flowing', 'Oil squeezes the loop', 'Who buys the debt?', 'Bonds get yippy', 'Abroad: the dollar’s backstop', 'If it breaks'];
const NEWTIPS = ['deficit', 'debt', 'rate', 'surplus', 'treasuries', 'bond', 'yield', 'y10', 'spread', 'coupon', 'bp', 'auction', 'collateral', 'mmf', 'underwrite', 'rrp', 'tga', 'debtlimit', 'qt', 'qe', 'policyrate', 'srf', 'haircut', 'leverage', 'hedgefund', 'basis', 'dealer', 'pb', 'margin', 'vol', 'swapspread', 'clearing', 'termprem', 'hyperscalers', 'sp500', 'cover', 'reservecur', 'bw', 'petrodollar', 'inflow', 'swapline', 'fima', 'esf', 'fxint', 'carry', 'brent', 'pce', 'genius', 'hierdollar', 'hotmoney', 'geoecon', 'underclass', 'fip', 'twin', 'curve', 'imbalance', 'safepremium', 'grossnet', 'tpu'];

(async () => {
  const b = await chromium.launch();
  const mk = async (opt, init) => {
    init = init || {};
    const c = await b.newContext(Object.assign({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, opt));
    await c.addInitScript(([off, i]) => { try { if (sessionStorage.getItem('__tw')) return; sessionStorage.setItem('__tw', '1'); off.forEach(k => localStorage.setItem(k, 'off')); localStorage.setItem('isx-intro-off', '1'); localStorage.setItem('isx-sim-mode', i.mode || 'story'); if (i.way) localStorage.setItem('isx-way', i.way); else localStorage.removeItem('isx-way'); sessionStorage.setItem('isx-sim-pos', i.pos || '{"l":0,"b":-1}'); } catch (e) {} }, [OFF, init]);
    const p = await c.newPage(); p._errs = [];
    p.on('pageerror', e => p._errs.push(String(e.message).slice(0, 200)));
    await p.goto(base + '#simulator', { waitUntil: 'load' });
    await p.waitForFunction(() => window.ISX && ISX.booted && ISX.sim, null, { timeout: 90000 });
    await p.waitForTimeout(700);
    return p;
  };
  const js = (p, f, a) => p.evaluate(f, a);

  /* ---------- 1. the chapter order ---------- */
  let p = await mk();
  const ord = await js(p, () => { const L = ISX.sim.lines[0]; return { ch: [...document.querySelectorAll('#isx-sn-body .s2chl li b')].map(x => x.textContent), n: L.steps.length, first: L.steps[0].t, dec: ISX.sim.decisions.map(D => [D.k, D.at + 1]) }; });
  ok(ord.ch.join('|') === ORDER.join('|'), 'chapter order: build-out, savings, consumer, oil, who buys, bonds get yippy, backstop, if it breaks', ord.ch);
  ok(ord.n === 49 && ord.first === 'A lab needs compute', 'the guide still has 49 steps and opens on “A lab needs compute”', ord);
  ok(JSON.stringify(Object.fromEntries(ord.dec)) === JSON.stringify({ '0-1': 27, '0-3': 29, '0-4': 34, '0-6': 25, '9-4': 36, '5-3': 41, '6-1': 20 }), 'the seven decisions follow their steps: oil before 20, long yields before 25, funding before 27, repo before 29, leverage before 34, tariffs before 36, the yen before 41', ord.dec);
  const ledes = await js(p, async () => {
    const out = {}, go = async t => { document.querySelector(`#isx-s2bar [data-rt-t="${t}"]`).click(); await new Promise(r => setTimeout(r, 300)); return ((document.querySelector('#isx-sn-body .s2why') || {}).textContent || '') + ' ' + ((document.querySelector('#isx-sn-body .sn-why p') || {}).textContent || ''); };
    out.dc = await go('0:0'); out.who = await go('0:25'); out.yip = await go('0:33'); out.t25 = await go('0:24');
    document.querySelector(`#isx-s2bar [data-rt-t="0:23"]`).click(); await new Promise(r => setTimeout(r, 300)); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await new Promise(r => setTimeout(r, 300));
    out.q06 = (document.querySelector('#isx-sn-body .dq') || {}).textContent || ''; out.ph = ISX.sim.ph; return out;
  });
  ok(/The money that comes back to US markets meets a build-out that runs on credit\./.test(ledes.dc), 'chapter 1 opens with its lead line', ledes.dc);
  ok(/All of this runs on borrowed money, and the state borrows most of all\./.test(ledes.who), 'chapter 5 (who buys the debt) opens with its lead line', ledes.who);
  ok(/One rule sets how much those banks can carry\./.test(ledes.yip), 'the leverage rule, now in “Bonds get yippy”, follows from the dealer banks', ledes.yip);
  ok(ledes.ph === 'ask' && /the Treasury still has to sell its debt/.test(ledes.q06), 'the call “Long yields climb” no longer assumes the leveraged funds of chapter 6', ledes);
  ok(await js(p, async () => { document.querySelector(`#isx-s2bar [data-rt-t="${ISX.sim.lines.findIndex(L => L.pre)}:6"]`).click(); await new Promise(r => setTimeout(r, 250)); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await new Promise(r => setTimeout(r, 300)); return /starts where the money lands: a data centre that has to be paid for/.test(document.getElementById('isx-sn-body').textContent); }), 'first principles hand over to the build-out, not to the central banks');
  const raw = await js(p, async () => { const out = [], L = ISX.sim.lines, pre = L.findIndex(x => x.pre);
    for (const [l, n] of [[pre, L[pre].steps.length], [0, L[0].steps.length]]) for (let i = -1; i <= n; i++) { const t = document.querySelector(`#isx-s2bar [data-rt-t="${l}:${i}"]`); if (!t) continue; t.click(); await new Promise(r => setTimeout(r, 40)); const x = document.getElementById('isx-sn-body').textContent + document.getElementById('isx-s2bar').textContent; if (/\{\{|\}\}/.test(x)) out.push(l + ':' + i); }
    return out; });
  ok(!raw.length, 'no raw tip markup on any card or in the bar (first principles and the guide)', raw);
  ok(!p._errs.length, 'no page errors (order)', p._errs.join(' | '));
  await p.context().close();

  /* ---------- 2, 3. the door card and the thesis ---------- */
  p = await mk();
  const dc = await js(p, () => {
    const B = document.getElementById('isx-sn-body'), d = [...B.querySelectorAll('.tw-door')], g = B.querySelector('.tw-doors');
    return { ways: d.map(x => x.dataset.way), names: d.map(x => x.querySelector('b').textContent), lines: d.map(x => x.querySelector('.tw-a').textContent), m: d.map(x => x.querySelector('.tw-m').textContent.trim()),
      gold: d.map(x => x.classList.contains('gold')), off: d.map(x => x.getAttribute('aria-disabled')), desc: d.map(x => { const e = document.getElementById(x.getAttribute('aria-describedby')); return e ? e.textContent : ''; }),
      group: g && g.getAttribute('role') === 'group' && document.getElementById(g.getAttribute('aria-labelledby')).textContent, native: d.every(x => x.tagName === 'BUTTON'), old: !!B.querySelector('.s4go, .s5full, .s4skip'), last: B.querySelectorAll('.tw-last').length,
      fold: (B.querySelector('details.s2deep') || {}).textContent || '', mins: ISX.mins, th: B.querySelector('.s2thesis').textContent, tips: [...B.querySelectorAll('.s2thesis dfn.df')].map(x => x.dataset.d), click: !!B.querySelector('.ifx-click') };
  });
  ok(dc.ways.join() === 'ground,guide,map' && dc.names.join('|') === 'From the ground up|The guide|The full map', 'three doors: From the ground up, The guide, The full map', dc.names);
  ok(/^Assumes nothing\./.test(dc.lines[0]) && /^Assumes you know what a Treasury yield is\. First principles, 8 chapters, 7 calls\.$/.test(dc.lines[1]) && /^Assumes you know the plumbing\. The layout is part of the thesis/.test(dc.lines[2]) && /guide explains\.$/.test(dc.lines[2]), 'each door says what its route assumes; the full map says the layout is part of the thesis', dc.lines);
  ok(dc.gold.join() === 'false,true,false', 'the guide is the gold door', dc.gold);
  ok(dc.off[0] === 'true' && /coming soon/i.test(dc.m[0]) && dc.off[1] === null && dc.off[2] === null, 'the ground-up door is locked “coming soon” until the primer exists; the other two are live', dc);
  ok(dc.m[1] === 'about ' + dc.mins.guide + ' minutes' && new RegExp('About ' + dc.mins.main + ' minutes\\.').test(dc.fold) && dc.mins.guide > dc.mins.main && /every figure lit/.test(dc.m[2]), 'the minutes are computed from the text, on the door and in the fold', [dc.m, dc.mins]);
  ok(dc.native && dc.group === 'Three ways in' && dc.desc.every((t, i) => t.includes(dc.lines[i]) && t.includes(dc.m[i])) && !dc.old && dc.last === 0 && dc.click, 'native buttons in a group labelled “Three ways in”, each described by its line and its minutes; the old buttons and the skip link are gone; the click line stays', dc);
  ok(/Economic theory has come far in recognizing global trade imbalances/.test(dc.th) && /the instability is manufactured/.test(dc.th) && /That is the thesis of the author, Elias Rutten\./.test(dc.th) && /Follow the plumbing and you can see who holds the valves\./.test(dc.th) && !/Klein|Pettis|Gowan|Hudson/.test(dc.th), 'the thesis is Elias Rutten’s wording and names no economist', dc.th);
  ok(dc.tips.sort().join() === 'geoecon,hotmoney,imbalance', 'the thesis carries three term tips: global trade imbalances, hot money, geoeconomic', dc.tips);
  ok(!/this map’s reading|map’s reading|not an allegation/i.test(dc.th + dc.fold), 'no hedges on the opening card', dc.th);
  /* the guide's door; the storage key; “Last time” */
  await p.click('#isx-sn-body [data-way="guide"]'); await p.waitForTimeout(400);
  let st = await js(p, () => ({ way: localStorage.getItem('isx-way'), pre: ISX.sim.lines[ISX.sim.line].pre, beat: ISX.sim.beat, mode: ISX.sim.mode }));
  ok(st.way === 'guide' && st.pre && st.beat === 0 && st.mode === 'story', 'the guide’s door: first principles, reveal 1; isx-way = guide', st);
  await p.click('#isx-sn-body [data-way="ground"]').catch(() => {});
  await js(p, () => { sessionStorage.setItem('isx-sim-pos', '{"l":0,"b":-1}'); }); await p.reload(); await p.waitForFunction(() => window.ISX && ISX.booted && ISX.sim); await p.waitForTimeout(600);
  st = await js(p, () => ({ beat: ISX.sim.beat, mode: ISX.sim.mode, last: [...document.querySelectorAll('#isx-sn-body .tw-door')].filter(d => d.querySelector('.tw-last')).map(d => d.dataset.way), txt: (document.querySelector('#isx-sn-body .tw-last') || {}).textContent }));
  ok(st.mode === 'story' && st.beat === -1 && st.last.join() === 'guide' && st.txt === 'Last time', 'a returning visitor of the guide sees the door card again, the guide marked “Last time” in words', st);
  await js(p, () => document.querySelector('#isx-sn-body [data-way="ground"]').click()); await p.waitForTimeout(250);
  ok(await js(p, () => ISX.sim.beat === -1 && localStorage.getItem('isx-way') === 'guide'), 'the locked door does nothing');
  await p.focus('#isx-sn-body [data-way="map"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(600);
  st = await js(p, () => ({ way: localStorage.getItem('isx-way'), mode: ISX.sim.mode, f: document.activeElement && document.activeElement.className }));
  ok(st.way === 'map' && st.mode === 'full' && /rt-swb/.test(st.f), 'the full map’s door, by keyboard: the full view, focus in the bar; isx-way = map', st);
  await p.reload(); await p.waitForFunction(() => window.ISX && ISX.booted && ISX.sim); await p.waitForTimeout(600);
  ok(await js(p, () => ISX.sim.mode === 'full'), 'a returning visitor of the full map opens in the full map');
  await js(p, () => document.querySelector('#isx-s2bar .rt-nx.ret').click()); await p.waitForTimeout(500);
  ok(await js(p, () => ISX.sim.mode === 'story' && ISX.sim.beat === -1 && !!document.querySelector('#isx-sn-body .tw-door[data-way="map"] .tw-last')), '“Back to the guide · the opening card” leads to the door card, the full map marked');
  ok(!p._errs.length, 'no page errors (doors)', p._errs.join(' | '));
  await p.context().close();
  /* one screen at 1280×760; the phone */
  for (const [w, h] of [[1280, 760], [1440, 900]]) {
    p = await mk({ viewport: { width: w, height: h } });
    const r = await js(p, () => { const c = document.getElementById('isx-cock'), bar = document.getElementById('isx-s2bar').getBoundingClientRect(), card = document.getElementById('isx-snarr').getBoundingClientRect(), box = document.getElementById('isx-sn-in'), d = [...document.querySelectorAll('#isx-sn-body .tw-door')].map(x => x.getBoundingClientRect());
      return { card: card.top >= 0 && card.bottom <= bar.top + 1, inner: box.scrollHeight <= box.clientHeight + 1, page: scrollY === 0 && c.getBoundingClientRect().bottom <= innerHeight + 1, row: d.every(q => Math.abs(q.top - d[0].top) < 1 && Math.abs(q.height - d[0].height) < 1) }; });
    ok(Object.values(r).every(Boolean), `${w}×${h}: the door card is one screen without inner scroll, the doors one row of equal height`, r);
    await p.context().close();
  }
  p = await mk({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  let ph = await js(p, () => { const d = [...document.querySelectorAll('#isx-sn-body .tw-door')].map(x => x.getBoundingClientRect()), card = document.getElementById('isx-snarr').getBoundingClientRect();
    return { stacked: d.every((q, i) => !i || q.top >= d[i - 1].bottom - 1), side: document.documentElement.scrollWidth <= innerWidth + 1, card: card.left >= 0 && card.right <= innerWidth + 1, tall: d.every(q => q.height >= 44) }; });
  ok(Object.values(ph).every(Boolean), '390 px: the doors stack, each at least 44 px; the card stays inside the screen (the fix round’s 680 px ran off it)', ph);
  ok(!p._errs.length, 'no page errors (phone)', p._errs.join(' | '));
  await p.context().close();

  /* ---------- 4. expert mode ---------- */
  p = await mk({}, { mode: 'full' });
  let ex = await js(p, () => { const v = e => !!e && e.getClientRects().length > 0, k = document.getElementById('isx-tw-key'); return { key: v(k) && k.textContent, gsb: v(document.getElementById('isx-gsb')) && document.getElementById('isx-gsb').getAttribute('aria-controls') === 'isx-gsteps' }; });
  ok(/^Boxes are actors, lines are the relations between them, and the gauges on the wires carry the prices\./.test(ex.key) && /a gold tab means more inside\./.test(ex.key) && /The layout is part of the thesis/.test(ex.key), 'full view: the one-line key, with the layout as part of the thesis', ex);
  ok(ex.gsb, 'full view: “Guide steps” in the bar, a disclosure button for the index');
  await p.focus('#isx-gsb'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  ex = await js(p, () => { const g = document.getElementById('isx-gsteps'), sec = [...g.querySelectorAll(':scope > .tw-gsg > section')], pre = g.querySelector('.tw-gspre');
    return { open: !g.hidden, exp: document.getElementById('isx-gsb').getAttribute('aria-expanded'), ch: sec.map(s => s.querySelector('h4').textContent.replace(/^\d+/, '')), steps: g.querySelectorAll(':scope > .tw-gsg > section li:not(.dec)').length, dec: g.querySelectorAll(':scope > .tw-gsg > section li.dec').length, pre: pre && pre.querySelector('summary').textContent, preN: pre && pre.querySelectorAll('li').length, focus: g.contains(document.activeElement), label: g.getAttribute('role') === 'dialog' && document.getElementById(g.getAttribute('aria-labelledby')).textContent }; });
  ok(ex.open && ex.exp === 'true' && ex.focus && ex.label === 'Guide steps', 'Guide steps opens the index as a labelled dialog, focus inside', ex);
  ok(ex.ch.join('|') === ORDER.join('|') && ex.steps === 49 && ex.dec === 7, 'the index: eight chapters in the new order, 49 steps, 7 calls marked “Your call”', ex);
  ok(/^Before the guide: First principles \(7\)$/.test(ex.pre) && ex.preN === 7, 'the index: first principles folded on top', ex.pre);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok(await js(p, () => document.getElementById('isx-gsteps').hidden && document.activeElement && document.activeElement.id === 'isx-gsb' && ISX.sim.mode === 'full'), 'Esc closes the index and returns focus to its button; the full view stays');
  await js(p, () => document.getElementById('isx-gsb').click()); await p.waitForTimeout(250);
  await js(p, () => document.querySelector('#isx-gsteps [data-gs="0:30"]').click()); await p.waitForTimeout(600);
  ex = await js(p, () => ({ mode: ISX.sim.mode, beat: ISX.sim.beat, h3: document.querySelector('#isx-sn-body h3').textContent, ret: (document.querySelector('#isx-sn-body .tw-ret') || {}).textContent, focus: document.activeElement && document.activeElement.hasAttribute('data-twret') }));
  ok(ex.mode === 'story' && ex.beat === 30 && ex.h3 === 'The largest holder nobody counts' && /Back to the full map/.test(ex.ret) && ex.focus, 'a step opened from the index: the guide at that step, with “Back to the full map”', ex);
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(400);
  ok(await js(p, () => ISX.sim.beat === 31 && !!document.querySelector('#isx-sn-body .tw-ret')), 'the way back stays while the visitor walks on');
  await js(p, () => document.querySelector('#isx-sn-body [data-twret]').click()); await p.waitForTimeout(500);
  ok(await js(p, () => ISX.sim.mode === 'full' && ISX.sim.ret === null), '“Back to the full map” returns to the full view');
  await js(p, () => document.getElementById('isx-gsb').click()); await p.waitForTimeout(250);
  await js(p, () => document.querySelector('#isx-gsteps [data-gs^="d:0:"]').click()); await p.waitForTimeout(500);
  ok(await js(p, () => ISX.sim.ph === 'ask' && ISX.sim.dec === '6-1' && !!document.querySelector('#isx-sn-body .tw-ret')), 'a call opened from the index: the decision card, with the way back');
  await js(p, () => document.querySelector('#isx-sn-body [data-twret]').click()); await p.waitForTimeout(500);
  /* “In the guide” in the dossiers */
  ex = await js(p, async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), out = {};
    const n = document.querySelector('#isx-rmap .fn[data-n="TSY"]'); n.dispatchEvent(new MouseEvent('click', { bubbles: true })); await w(250);
    const r = document.querySelector('#isx-rside .tw-ing'); out.node = r && r.textContent; out.btns = r ? [...r.querySelectorAll('button')].map(b => b.dataset.gs) : [];
    const S = ISX.sim, first = S.lines[0].steps.findIndex(s => s.n.includes('TSY')); out.first = first;
    n.dispatchEvent(new MouseEvent('click', { bubbles: true })); await w(150);
    const i = S.lines[0].steps[2].e.find(e => !S.lines[0].steps[1].e.includes(e)); document.querySelector(`#isx-rmap .feh[data-e="${i}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })); await w(250);
    const q = document.querySelector('#isx-rside .tw-ing'); out.edge = q && q.textContent; return out; });
  ok(/^In the guideFirst lit at step \d+, /.test(ex.node || '') && ex.btns[0] === '0:' + ex.first && ex.btns.length >= 2, 'an actor’s dossier says where the guide first lights it, and later steps, as buttons', ex);
  ok(/First lit at step 3, Whose money/.test(ex.edge || ''), 'a relation’s dossier says the step that lights it', ex.edge);
  await js(p, () => document.querySelector('#isx-rside .tw-ing button').click()); await p.waitForTimeout(500);
  ok(await js(p, () => ISX.sim.mode === 'story' && ISX.sim.beat === 2 && !!document.querySelector('#isx-sn-body .tw-ret')), 'its button opens that step in the guide, with the way back');
  ok(await js(p, async () => { document.querySelector('#isx-rmap .fn[data-n="TSY"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); await new Promise(r => setTimeout(r, 250)); const v = !!document.querySelector('#isx-rside .tw-ing'), k = document.getElementById('isx-tw-key').getClientRects().length > 0; return !v && !k; }), 'in the guide the dossier has no “In the guide” row and the key line waits');
  ok(!p._errs.length, 'no page errors (expert)', p._errs.join(' | '));
  await p.context().close();
  p = await mk({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, { mode: 'full' });
  ex = await js(p, async () => { const v = e => !!e && e.getClientRects().length > 0, kb = document.querySelector('[data-twkey]'), k = document.getElementById('isx-tw-key'), out = { btn: v(kb), shut: !v(k) };
    kb.click(); await new Promise(r => setTimeout(r, 120)); out.open = v(k) && kb.getAttribute('aria-expanded') === 'true';
    document.querySelector('[data-s4more]').click(); await new Promise(r => setTimeout(r, 120)); const m = document.querySelector('#isx-b1more .tw-gsm'); out.menu = v(m); m.click(); await new Promise(r => setTimeout(r, 250));
    const g = document.getElementById('isx-gsteps'), r = g.getBoundingClientRect(); out.sheet = !g.hidden && r.left <= 1 && r.right >= innerWidth - 1; out.side = document.documentElement.scrollWidth <= innerWidth + 1; return out; });
  ok(Object.values(ex).every(Boolean), '390 px, full view: the key folds behind “Key”; Guide steps is in the ⋯ menu and opens as a sheet', ex);
  ok(!p._errs.length, 'no page errors (expert, phone)', p._errs.join(' | '));
  await p.context().close();

  /* ---------- 5. term tips ---------- */
  p = await mk();
  const D = await js(p, () => ISX.defs);
  const miss = NEWTIPS.filter(k => !D[k]), figs = NEWTIPS.filter(k => D[k] && /\$\d|\d{4}|\d+(\.\d+)?%/.test(D[k][1]) && !['rate', 'haircut', 'bp', 'bw', 'genius', 'cover'].includes(k));
  ok(!miss.length && NEWTIPS.length === 59, 'the glossary has the 53 tips of the spec and the copy round’s six', miss);
  ok(!figs.length, 'tips define and carry no figures (the worked examples and dates of a law excepted)', figs);
  ok(D.y10[1] === 'The yield on ten-year US government debt. Historically the benchmark price of long-term money: corporate bonds and mortgages are priced over it.' && /Elias Rutten’s term/.test(D.hierdollar[1]) && /Elias Rutten’s term/.test(D.underclass[1]), 'one wording per definition: the 10-year; Elias Rutten’s terms credited to him');
  ok(NEWTIPS.every(k => !/["']/.test(D[k][0] + D[k][1])), 'curled quotes only');
  const tp = async (sel, act) => js(p, async ([s, a]) => {
    const w = ms => new Promise(r => setTimeout(r, ms)), t = document.querySelector(s), tip = document.getElementById('isx-tip6');
    if (a === 'focus') { t.focus(); await w(80); }
    const r = t.getBoundingClientRect(), q = tip.getBoundingClientRect();
    return { shown: !tip.hidden, desc: t.getAttribute('aria-describedby'), role: tip.getAttribute('role'), head: (tip.querySelector('b') || {}).textContent, clear: q.bottom <= r.top + .5 || q.top >= r.bottom - .5 };
  }, [sel, act]);
  let t1 = await tp('#isx-sn-body .s2thesis dfn[data-d="hotmoney"]', 'focus');
  ok(t1.shown && t1.desc === 'isx-tip6' && t1.role === 'tooltip' && t1.head === 'Hot money' && t1.clear, 'a term by keyboard: its tip shows, tied to it (aria-describedby), above or below it, never over it', t1);
  await p.keyboard.press('Escape'); await p.waitForTimeout(80);
  t1 = await js(p, () => ({ hidden: document.getElementById('isx-tip6').hidden, desc: document.querySelector('#isx-sn-body .s2thesis dfn[data-d="hotmoney"]').getAttribute('aria-describedby'), mode: ISX.sim.mode, focus: document.activeElement && document.activeElement.dataset.d }));
  ok(t1.hidden && !t1.desc && t1.mode === 'story' && t1.focus === 'hotmoney', 'Esc hides the tip and does nothing else (the guide stays, focus stays on the term)', t1);
  const box = await p.locator('#isx-sn-body .s2thesis dfn[data-d="geoecon"]').boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.waitForTimeout(120);
  const tb = await js(p, () => document.getElementById('isx-tip6').getBoundingClientRect().toJSON());
  await p.mouse.move(box.x + box.width / 2, tb.y + tb.height / 2 > box.y ? box.y + box.height + 4 : box.y - 4, { steps: 3 }); await p.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2, { steps: 4 }); await p.waitForTimeout(400);
  ok(await js(p, () => !document.getElementById('isx-tip6').hidden && /Geoeconomic/.test(document.getElementById('isx-tip6').textContent)), 'the pointer can move onto the tip and it stays open (WCAG 1.4.13)');
  await p.mouse.move(5, 5, { steps: 3 }); await p.waitForTimeout(400);
  ok(await js(p, () => document.getElementById('isx-tip6').hidden), 'and it closes when the pointer leaves both');
  ok(!p._errs.length, 'no page errors (tips)', p._errs.join(' | '));
  await p.context().close();
  p = await mk({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const tap = async () => { const l = p.locator('#isx-sn-body .s2thesis dfn[data-d="imbalance"]'); await l.scrollIntoViewIfNeeded(); const q = await l.boundingBox(); await p.touchscreen.tap(q.x + q.width / 2, q.y + q.height / 2); await p.waitForTimeout(200); return js(p, () => !document.getElementById('isx-tip6').hidden && /Global imbalance/.test(document.getElementById('isx-tip6').textContent)); };
  ok(await tap(), '390 px: a tap on a term shows its tip');
  ok(!(await tap()), '390 px: a second tap hides it');
  await tap(); await p.touchscreen.tap(20, 300); await p.waitForTimeout(200);
  ok(await js(p, () => document.getElementById('isx-tip6').hidden), '390 px: a tap elsewhere hides it');
  ok(!p._errs.length, 'no page errors (tips, phone)', p._errs.join(' | '));
  await p.context().close();

  await b.close();
  console.log(`tiers-check: ${pass} pass, ${fail} fail`);
  process.exit(fail ? 1 : 0);
})();
