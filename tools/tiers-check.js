/* Tiers builds A and B (15 Nov 2026): checks on what the rounds changed (claude/specs/tiers.md §1, §1.1, §2, §3, §3b, §4, §4.3, §6;
   claude/content/tiers-copy.md Parts A to H).
   Usage: node tools/tiers-check.js [baseUrl]. Needs `python3 -m http.server 8731` at the repo root. Exits 1 on a failed check.
   1 the chapter order and where the seven decisions sit; the ledes the order needs
   2 the door card: three doors, named by what each route assumes, the guide gold, the ground-up door locked until the primer exists;
     the minutes computed from the text; one storage key (isx-way) and the “Last time” mark; one screen at 1280×760; phones
   3 the thesis: Elias Rutten's wording, no economist named, three term tips; the first-principles close points to the build-out
   4 expert mode: the key line (full view only), “Guide steps” (index, Esc, focus back), a step opened from it with the way back,
     “In the guide” in the dossiers of the full view
   5 term tips: the glossary entries, tips define and carry no figures; the tooltip is tied to its term, Esc hides it, it can be
     hovered, a tap toggles it, it never covers the term
   6 build B: the primer (the hand-over, the way up, hidden text alternatives, the route in the bar, reading level, one screen);
     first principles; the three new steps and the trims; the thesis echoes and their rules (listed); the
     guide's close with the stored sterling figure; the Circuit's first line; the play runner keeps a play's order */
/* guide build (16 Nov 2026): sections 2 and 3 check the entry (three levels, bars, the thesis in plain words and in full, the reminder
   hint); section 6 the primer's twelve screens in the new order with their diagrams and stored figures, route A's hand-over, and first
   principles' ten reveals (R5 rewritten, R7 and R8 new). */
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
  const ord = await js(p, () => { const L = ISX.sim.lines[0]; return { n: L.steps.length, first: L.steps[0].t, dec: ISX.sim.decisions.map(D => [D.k, D.at + 1]) }; });
  /* guide build (16 Nov 2026): the entry has no chapter list; the chapter order is checked on the index of guide steps (section 4) */
  ok(ord.n === 52 && ord.first === 'A lab needs compute', 'the guide has 52 steps (49 and three new) and opens on “A lab needs compute”', ord);
  ok(JSON.stringify(Object.fromEntries(ord.dec)) === JSON.stringify({ '0-1': 27, '0-7': 30, '0-4': 35, '0-6': 25, '9-4': 37, '5-3': 42, '6-1': 20 }), 'the seven decisions follow their steps: oil before 20, long yields before 25, funding before 27, the repo backstop (key 0-7) before 30, leverage before 35, tariffs before 37, the yen before 42', ord.dec);
  const ledes = await js(p, async () => {
    const out = {}, go = async t => { document.querySelector(`#isx-s2bar [data-rt-t="${t}"]`).click(); await new Promise(r => setTimeout(r, 300)); return ((document.querySelector('#isx-sn-body .s2why') || {}).textContent || '') + ' ' + ((document.querySelector('#isx-sn-body .sn-why p') || {}).textContent || ''); };
    out.dc = await go('0:0'); out.who = await go('0:25'); out.yip = await go('0:34'); out.t25 = await go('0:24');
    document.querySelector(`#isx-s2bar [data-rt-t="0:23"]`).click(); await new Promise(r => setTimeout(r, 300)); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await new Promise(r => setTimeout(r, 300));
    out.q06 = (document.querySelector('#isx-sn-body .dq') || {}).textContent || ''; out.ph = ISX.sim.ph; return out;
  });
  ok(/The money that comes back to US markets meets a build-out that runs on credit\./.test(ledes.dc), 'chapter 1 opens with its lead line', ledes.dc);
  ok(/All of this runs on borrowed money, and the state borrows most of all\./.test(ledes.who), 'chapter 5 (who buys the debt) opens with its lead line', ledes.who);
  ok(/One rule sets how much those banks can carry\./.test(ledes.yip), 'the leverage rule, now in “Bonds get yippy”, follows from the dealer banks', ledes.yip);
  ok(ledes.ph === 'ask' && /the Treasury still has to sell its debt/.test(ledes.q06), 'the call “Long yields climb” no longer assumes the leveraged funds of chapter 6', ledes);
  ok(await js(p, async () => { const pl = ISX.sim.lines.findIndex(L => L.pre); document.querySelector(`#isx-s2bar [data-rt-t="${pl}:${ISX.sim.lines[pl].steps.length - 1}"]`).click(); await new Promise(r => setTimeout(r, 250)); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await new Promise(r => setTimeout(r, 300)); return /starts where the money lands: a data centre that has to be paid for/.test(document.getElementById('isx-sn-body').textContent); }), 'first principles hand over to the build-out, not to the central banks');
  const raw = await js(p, async () => { const out = [], L = ISX.sim.lines, pre = L.findIndex(x => x.pre), gnd = L.findIndex(x => x.gnd); localStorage.setItem('isx-way', 'ground');
    document.getElementById('isx-sn-pickb').click(); await new Promise(r => setTimeout(r, 80)); document.querySelector(`#isx-sn-pick [data-sl="${gnd}"]`).click(); await new Promise(r => setTimeout(r, 80));
    for (const [l, n] of [[gnd, L[gnd].steps.length], [pre, L[pre].steps.length], [0, L[0].steps.length]]) {
      for (let i = -1; i <= n; i++) { const t = document.querySelector(`#isx-s2bar [data-rt-t="${l}:${i}"]`); if (!t) continue; t.click(); await new Promise(r => setTimeout(r, 40)); const x = document.getElementById('isx-sn-body').textContent + document.getElementById('isx-s2bar').textContent; if (/\{\{|\}\}/.test(x)) out.push(l + ':' + i); } }
    localStorage.removeItem('isx-way'); return out; });
  ok(!raw.length, 'no raw tip markup on any card or in the bar (the basics, first principles and the guide)', raw);
  ok(!p._errs.length, 'no page errors (order)', p._errs.join(' | '));
  await p.context().close();

  /* ---------- 2, 3. the entry (guide build, 16 Nov 2026: spec guide-entry-16-nov §1, words from guide spine §2) and the thesis ---------- */
  p = await mk();
  const dc = await js(p, async () => {
    const B = document.getElementById('isx-sn-body'), E = B.querySelector('#isx-gentry'), d = [...E.querySelectorAll('.ge-way')], g = E.querySelector('.ge-wg');
    const out = { ways: d.map(x => x.dataset.way), names: d.map(x => x.querySelector('b').textContent), lines: d.map(x => x.querySelector('.ge-wa').textContent), aria: d.map(x => x.textContent.replace(/\s+/g, ' ').trim()), noLabel: d.every(x => !x.hasAttribute('aria-label')),
      sug: d.map(x => x.classList.contains('sug')), tags: d.map(x => (x.querySelector('.ge-tag') || {}).textContent || ''), bars: d.map(x => { const t = x.querySelector('.ge-tb i'); return [t ? parseFloat(t.style.width) : null, x.querySelectorAll('.ge-db i.on').length, x.querySelector('.ge-bars').getAttribute('aria-hidden')]; }),
      group: g && g.getAttribute('role') === 'group' && document.getElementById(g.getAttribute('aria-labelledby')).textContent, native: d.every(x => x.tagName === 'BUTTON'), old: !!B.querySelector('.s4go, .s5full, .s4skip, .tw-door, .s2chl'),
      title: E.querySelector('h3').textContent, kicker: E.querySelector('.ge-k').textContent, promise: E.querySelector('.ge-pr').textContent, plain: E.querySelector('.ge-thx p').textContent, plainTips: [...E.querySelectorAll('.ge-thx dfn.df')].map(x => x.dataset.d),
      shows: [...E.querySelectorAll('.ge-shows li')].map(x => x.textContent), how: [...E.querySelectorAll('.ge-how li')].map(x => x.textContent), minsText: (() => { const c = E.cloneNode(true); c.querySelectorAll('.vh').forEach(x => x.remove()); return /\d+\s*min/i.test(c.textContent); })(), mins: ISX.mins, full0: E.querySelector('#isx-ge-full').hidden,
      rem: E.querySelector('.ge-rem span').textContent, remB: !!E.querySelector('.ge-rem [data-remind]'), tour: !!E.querySelector('.ge-foot [data-simtour]'), inert: document.getElementById('isx-stage').inert,
      ttl: getComputedStyle(document.querySelector('#isx-cock .s2ttl')).visibility, segs: getComputedStyle(document.querySelector('#isx-s2bar .rt-segs')).visibility, S: { n: ISX.sim.lines[0].steps.length, nodes: document.querySelectorAll('#isx-rmap .fn').length, rel: ISX.sim.relations.length, ind: ISX.sim.indicators.filter(I => !I.slot).length, dec: ISX.sim.decisions.length } };
    const fb = E.querySelector('[data-gefull]'); fb.click(); await new Promise(r => setTimeout(r, 80));
    out.full1 = !E.querySelector('#isx-ge-full').hidden && fb.getAttribute('aria-expanded') === 'true'; out.th = E.querySelector('#isx-ge-full').textContent; out.tips = [...E.querySelectorAll('#isx-ge-full dfn.df')].map(x => x.dataset.d);
    fb.click(); await new Promise(r => setTimeout(r, 80)); out.full2 = E.querySelector('#isx-ge-full').hidden && fb.getAttribute('aria-expanded') === 'false';
    return out;
  });
  ok(dc.ways.join() === 'ground,guide,map' && dc.names.join('|') === 'Foundations|Fluent|Expert', 'three levels: Foundations, Fluent, Expert (the keys of the three doors stay: ground, guide, map)', dc.names);
  ok(dc.lines.join('|') === 'I know the US has a debt problem, but not why.|I know how the dollar system works.|I know the cogs. Show me the thesis on the map.', 'each level has one first-person line for whom it is', dc.lines);
  ok(dc.title === 'The imperial machinery' && dc.kicker === 'Scott Bessent Simulator' && dc.promise === 'Why does the dollar need the AI trade? By the end you will know, and you will know who keeps it going.', 'the entry’s title is “The imperial machinery”, with the promise under it (Elias’s choice, 16 Nov)', [dc.title, dc.promise]);
  ok(/^Most economists treat the world’s trade imbalances, and the hot money that follows them, as a fault to be fixed\. Elias Rutten’s thesis is that the instability is made on purpose and used as a weapon, by the United States and by China\.$/.test(dc.plain) && dc.plainTips.join() === 'hotmoney', 'the thesis in plain words first, with “hot money” as a term tip', dc.plain);
  ok(dc.shows.length === 3 && dc.shows[0].includes(dc.S.nodes + ' actors and gauges, ' + dc.S.rel + ' relations and ' + dc.S.ind + ' dated indicators') && /17 levers, and seven points where you take the decision yourself/.test(dc.shows[1]) && /Seven chain reactions toward a crisis, each anchored in a real precedent/.test(dc.shows[2]) && dc.S.dec === 7, 'what this part shows: the cogs, how Washington works it, where it could break; the figures are computed', dc.shows);
  ok(dc.sug.join() === 'false,true,false' && dc.tags.join('|') === '|Suggested|', 'Fluent is the suggested level (gold outline, “Suggested”) on a first visit', [dc.sug, dc.tags]);
  ok(dc.bars[0][0] === Math.min(100, Math.round(dc.mins.ground / 60 * 100)) && dc.bars[1][0] === Math.round(dc.mins.guide / 60 * 100) && dc.bars[2][0] === null && dc.bars.map(x => x[1]).join() === '1,2,3' && dc.bars.every(x => x[2] === 'true') && dc.mins.ground > dc.mins.guide, 'time and difficulty are bars: time is the route’s computed minutes over 60, Expert is “your pace”; difficulty 1, 2, 3', [dc.bars, dc.mins]);
  ok(!dc.minsText && dc.noLabel && dc.aria[0].includes('About ' + dc.mins.ground + ' minutes') && dc.aria[1].includes('About ' + dc.mins.guide + ' minutes') && /^Foundations/.test(dc.aria[0]) && /^Fluent Suggested → I know how the dollar system works\. First principles, then the guide\./.test(dc.aria[1]) && /Assumes you know what a Treasury yield is\./.test(dc.aria[1]) && /^Expert/.test(dc.aria[2]) && /At your own pace/.test(dc.aria[2]), 'minutes live only in each level’s accessible name: the visible words first, then a hidden line with the route, the minutes and what it assumes (no aria-label over visible text)', dc.aria);
  ok(dc.mins.ground >= 45 && dc.mins.gnd >= 12 && dc.mins.ground - dc.mins.guide >= 8, 'guide spine §6.1: the ground route counts the primer’s folds, so the two routes differ honestly in length', dc.mins);
  ok(dc.native && dc.group === 'Choose your way in' && !dc.old, 'native buttons in a group labelled “Choose your way in”; the old door card, its buttons and its chapter list are gone', dc);
  ok(dc.how.length === 4 && /Dotted words carry a definition: hover or tap\./.test(dc.how[0]) && /Seven calls are yours/.test(dc.how[1]) && /A gold tab opens a deeper view\./.test(dc.how[2]) && /arrow keys|Swipe the card/.test(dc.how[3]), '“How the guide works” is one row of four: dotted words, the calls, the gold tab, Next and Back', dc.how);
  ok(dc.rem === 'Understanding the mechanics takes time. If you can’t finish today, set a reminder.' && dc.remB && dc.tour, 'the foot: the reminder hint with its pill, and the tour', dc.rem);
  ok(dc.inert === true && dc.ttl === 'hidden' && dc.segs === 'hidden', 'while the entry is open the map behind it is out of reach, and the Simulator’s title row and the bar’s route are hidden', [dc.inert, dc.ttl, dc.segs]);
  ok(dc.full0 && dc.full1 && dc.full2, '“Full thesis” opens and closes the full wording (aria-expanded follows)', [dc.full0, dc.full1, dc.full2]);
  ok(/Economic theory has come far in recognizing global trade imbalances/.test(dc.th) && /the instability is manufactured/.test(dc.th) && /That is the thesis of the author, Elias Rutten\./.test(dc.th) && /Follow the plumbing and you can see who holds the valves\./.test(dc.th) && !/Klein|Pettis|Gowan|Hudson/.test(dc.th), 'the full thesis is Elias Rutten’s wording and names no economist', dc.th);
  ok(dc.tips.sort().join() === 'geoecon,hotmoney,imbalance', 'the full thesis carries three term tips: global trade imbalances, hot money, geoeconomic', dc.tips);
  ok(!/this map’s reading|map’s reading|not an allegation/i.test(dc.th + dc.plain), 'no hedges on the entry', dc.th);
  /* the guide's door; the storage key; “Last time” */
  await p.click('#isx-sn-body [data-way="guide"]'); await p.waitForTimeout(400);
  let st = await js(p, () => ({ way: localStorage.getItem('isx-way'), pre: ISX.sim.lines[ISX.sim.line].pre, beat: ISX.sim.beat, mode: ISX.sim.mode }));
  ok(st.way === 'guide' && st.pre && st.beat === 0 && st.mode === 'story', 'Fluent: first principles, reveal 1; isx-way = guide', st);
  await p.click('#isx-sn-body [data-way="ground"]').catch(() => {});
  await js(p, () => { sessionStorage.setItem('isx-sim-pos', '{"l":0,"b":-1}'); }); await p.reload(); await p.waitForFunction(() => window.ISX && ISX.booted && ISX.sim); await p.waitForTimeout(600);
  st = await js(p, () => ({ beat: ISX.sim.beat, mode: ISX.sim.mode, last: [...document.querySelectorAll('#isx-sn-body .ge-way')].filter(d => d.querySelector('.ge-tag.last')).map(d => d.dataset.way), txt: (document.querySelector('#isx-sn-body .ge-tag.last') || {}).textContent, sugTag: [...document.querySelectorAll('#isx-sn-body .ge-tag:not(.last)')].length, aria: document.querySelector('#isx-sn-body .ge-way[data-way="guide"]').textContent }));
  ok(st.mode === 'story' && st.beat === -1 && st.last.join() === 'guide' && st.txt === 'Last time' && st.sugTag === 0 && /^Fluent\s+Last time/.test(st.aria), 'a returning visitor of the guide sees the entry again, Fluent marked “Last time” in words (and in its accessible name) in place of “Suggested”', st);
  await js(p, () => document.querySelector('#isx-sn-body [data-way="ground"]').click()); await p.waitForTimeout(400);
  st = await js(p, () => ({ way: localStorage.getItem('isx-way'), gnd: ISX.sim.lines[ISX.sim.line].gnd, beat: ISX.sim.beat, h3: document.querySelector('#isx-sn-body h3').textContent }));
  ok(st.way === 'ground' && st.gnd && st.beat === 0 && st.h3 === 'The US spends more than it collects', 'Foundations opens the primer at screen 1; isx-way = ground', st);
  await js(p, () => { sessionStorage.setItem('isx-sim-pos', '{"l":0,"b":-1}'); }); await p.reload(); await p.waitForFunction(() => window.ISX && ISX.booted && ISX.sim); await p.waitForTimeout(600);
  ok(await js(p, () => ISX.sim.beat === -1 && [...document.querySelectorAll('#isx-sn-body .ge-way')].filter(d => d.querySelector('.ge-tag.last')).map(d => d.dataset.way).join() === 'ground'), 'a returning visitor of the primer sees the entry again, Foundations marked');
  ok(await js(p, async () => { ISX.route.next('sim').click(); await new Promise(r => setTimeout(r, 300)); const r = ISX.sim.lines[ISX.sim.line].gnd && ISX.sim.beat === 0; document.querySelector('#isx-ways-b').click(); await new Promise(r => setTimeout(r, 300)); return r && ISX.sim.beat === -1; }), 'for a visitor of the primer the bar’s gold button starts Foundations, and “Three ways in” leads back to the entry');
  await p.focus('#isx-sn-body [data-way="map"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(600);
  st = await js(p, () => ({ way: localStorage.getItem('isx-way'), mode: ISX.sim.mode, f: document.activeElement && document.activeElement.className }));
  ok(st.way === 'map' && st.mode === 'full' && /rt-swb/.test(st.f), 'the full map’s door, by keyboard: the full view, focus in the bar; isx-way = map', st);
  await p.reload(); await p.waitForFunction(() => window.ISX && ISX.booted && ISX.sim); await p.waitForTimeout(600);
  ok(await js(p, () => ISX.sim.mode === 'full'), 'a returning visitor of the full map opens in the full map');
  await js(p, () => document.querySelector('#isx-s2bar .rt-nx.ret').click()); await p.waitForTimeout(500);
  ok(await js(p, () => ISX.sim.mode === 'story' && ISX.sim.beat === -1 && !!document.querySelector('#isx-sn-body .ge-way[data-way="map"] .ge-tag.last')), '“Back to the guide · the opening card” leads to the entry, Expert marked');
  ok(!p._errs.length, 'no page errors (doors)', p._errs.join(' | '));
  await p.context().close();
  /* one screen at 1280×760; the phone */
  for (const [w, h] of [[1280, 760], [1440, 900]]) {
    p = await mk({ viewport: { width: w, height: h } });
    const r = await js(p, () => { const c = document.getElementById('isx-cock'), bar = document.getElementById('isx-s2bar').getBoundingClientRect(), card = document.getElementById('isx-snarr').getBoundingClientRect(), box = document.getElementById('isx-sn-in'), d = [...document.querySelectorAll('#isx-sn-body .ge-way')].map(x => x.getBoundingClientRect()), ge = document.getElementById('isx-gentry').getBoundingClientRect();
      return { card: ge.top >= card.top - 1 && ge.bottom <= bar.top + 1 && ge.top >= document.getElementById('isx-strip').getBoundingClientRect().bottom - 1, inner: box.scrollHeight <= box.clientHeight + 1, page: scrollY === 0 && c.getBoundingClientRect().bottom <= innerHeight + 1, row: d.every(q => Math.abs(q.top - d[0].top) < 1 && Math.abs(q.height - d[0].height) < 1) }; });
    ok(Object.values(r).every(Boolean), `${w}×${h}: the entry is one screen without inner scroll, clear of the header strip and the bar, the levels one row of equal height`, r);
    await p.context().close();
  }
  p = await mk({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  let ph = await js(p, () => { const d = [...document.querySelectorAll('#isx-sn-body .ge-way')].map(x => x.getBoundingClientRect()), card = document.getElementById('isx-snarr').getBoundingClientRect(), th = document.querySelector('#isx-gentry .ge-th').getBoundingClientRect();
    return { stacked: d.every((q, i) => !i || q.top >= d[i - 1].bottom - 1), first: d[0].top < innerHeight && d[0].bottom <= innerHeight, order: th.top >= d[2].bottom - 1, side: document.documentElement.scrollWidth <= innerWidth + 1, card: card.left >= 0 && card.right <= innerWidth + 1, tall: d.every(q => q.height >= 44) }; });
  ok(Object.values(ph).every(Boolean), '390 px: the levels stack, each at least 44 px, the first above the fold and all three before the thesis; the entry stays inside the screen', ph);
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
  ok(ex.ch.join('|') === ORDER.join('|') && ex.steps === 52 && ex.dec === 7, 'the index: eight chapters in the new order, 52 steps, 7 calls marked “Your call”', ex);
  ok(/^Before the guide: The basics \(12\) · First principles \(10\)$/.test(ex.pre) && ex.preN === 22, 'the index: the basics and first principles folded on top', ex.pre);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok(await js(p, () => document.getElementById('isx-gsteps').hidden && document.activeElement && document.activeElement.id === 'isx-gsb' && ISX.sim.mode === 'full'), 'Esc closes the index and returns focus to its button; the full view stays');
  await js(p, () => document.getElementById('isx-gsb').click()); await p.waitForTimeout(250);
  await js(p, () => document.querySelector('#isx-gsteps [data-gs="0:31"]').click()); await p.waitForTimeout(600);
  ex = await js(p, () => ({ mode: ISX.sim.mode, beat: ISX.sim.beat, h3: document.querySelector('#isx-sn-body h3').textContent, ret: (document.querySelector('#isx-sn-body .tw-ret') || {}).textContent, focus: document.activeElement && document.activeElement.hasAttribute('data-twret') }));
  ok(ex.mode === 'story' && ex.beat === 31 && ex.h3 === 'The largest holder nobody counts' && /Back to the full map/.test(ex.ret) && ex.focus, 'a step opened from the index: the guide at that step, with “Back to the full map”', ex);
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(400);
  ok(await js(p, () => ISX.sim.beat === 32 && !!document.querySelector('#isx-sn-body .tw-ret')), 'the way back stays while the visitor walks on');
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
  await p.click('#isx-sn-body [data-gefull]'); await p.waitForTimeout(120);
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
  await js(p, () => document.querySelector('#isx-sn-body [data-gefull]').click()); await p.waitForTimeout(120);
  const tap = async () => { const l = p.locator('#isx-sn-body .s2thesis dfn[data-d="imbalance"]'); await l.scrollIntoViewIfNeeded(); const q = await l.boundingBox(); await p.touchscreen.tap(q.x + q.width / 2, q.y + q.height / 2); await p.waitForTimeout(200); return js(p, () => !document.getElementById('isx-tip6').hidden && /Global imbalance/.test(document.getElementById('isx-tip6').textContent)); };
  ok(await tap(), '390 px: a tap on a term shows its tip');
  ok(!(await tap()), '390 px: a second tap hides it');
  await tap(); await p.touchscreen.tap(20, 300); await p.waitForTimeout(200);
  ok(await js(p, () => document.getElementById('isx-tip6').hidden), '390 px: a tap elsewhere hides it');
  ok(!p._errs.length, 'no page errors (tips, phone)', p._errs.join(' | '));
  await p.context().close();

  /* ---------- 6. build B ---------- */
  const fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..', 'imperial-stack');
  /* guide build (16 Nov 2026, guide spine §3.1): twelve screens in the new order; P6 (“The twin deficit”) retired; P9 to P13 new */
  const PRIMER = ['The US spends more than it collects', 'The US adjusts by producing claims', 'A pyramid of IOUs', 'Which claims, when', 'It borrows by selling IOUs', 'The yield is the price of borrowing', 'The 10-year prices everything else', 'Who lends to Washington', 'Deficits become profits', 'Why it matters now', 'Why the dollar needs the AI trade', 'How to read the map'];
  const PIDS = ['P1', 'P9', 'P10', 'P11', 'P2', 'P3', 'P4', 'P5', 'P12', 'P7', 'P13', 'P8'];
  const REVEALS = ['Every deficit is someone’s surplus', 'The surplus economies spend less than they earn', 'The claims are taken in dollars', 'The US spends more than it earns', 'Jobs or debt', 'Built over half a century', 'Money into assets', 'Lower yields, higher prices', 'Deficits become profits', 'Why the dollar needs the AI trade'];
  /* a rough Flesch–Kincaid grade: syllables by vowel groups, a silent final e dropped */
  const syl = w => { w = w.toLowerCase().replace(/[^a-z]/g, ''); if (!w) return 0; if (w.length <= 3) return 1; w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, ''); const m = w.match(/[aeiouy]{1,2}/g); return Math.max(1, m ? m.length : 1); };
  const fk = t => { const s = t.split(/(?<=[.!?])\s+(?=[A-Z“$0-9])/).filter(x => /\w/.test(x)), w = t.split(/\s+/).filter(x => /\w/.test(x)); const sy = w.reduce((a, x) => a + syl(x), 0); return { wps: w.length / s.length, grade: .39 * w.length / s.length + 11.8 * sy / w.length - 15.59 }; };
  p = await mk({}, { way: 'ground' });
  const G = await js(p, async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), L = ISX.sim.lines, gi = L.findIndex(x => x.gnd), pi = L.findIndex(x => x.pre), out = { gi, pi, n: L[gi].steps.length, s: [] };
    document.querySelector('#isx-sn-body [data-way="ground"]').click(); await w(300);
    out.seg = document.querySelectorAll('#isx-s2bar .rt-segs > .rt-s').length;
    out.route = document.getElementById('isx-s2bar').textContent;
    for (let i = 0; i < out.n; i++) {
      const B = document.getElementById('isx-sn-body'), d = B.querySelector('details.s2deep');
      out.s.push({ line: ISX.sim.line, beat: ISX.sim.beat, k: B.querySelector('.s2k').textContent.replace(/\s+/g, ' ').trim(), h3: B.querySelector('h3').textContent, x: B.querySelector('.s2p').textContent, vh: (B.querySelector('.vh') || {}).textContent || '',
        map: (B.querySelector('.gnd-map') || {}).textContent || '', know: !!B.querySelector(`.gnd-know [data-sl="${pi}"][data-sb="0"]`), fold: d ? d.querySelector('summary').textContent : '', more: d ? [...d.querySelectorAll('.s2d > p, .s2d dd')].map(e => e.textContent).join(' ') : '',
        src: (B.querySelector('.s2d .lsrc') || {}).textContent || '', terms: [...B.querySelectorAll('.gnd-terms dt')].map(x => x.textContent), tips: [...new Set([...B.querySelectorAll('dfn.df')].map(x => x.dataset.d))], echo: [...B.querySelectorAll('.thesis-echo')].map(x => x.textContent), dg: (B.querySelector('.gd') || { dataset: {} }).dataset.gd || '', dgHid: B.querySelector('.gd-pic') ? B.querySelector('.gd-pic').getAttribute('aria-hidden') : null, tblCap: (B.querySelector('.gd-tbl caption') || {}).textContent || '', tblRows: B.querySelectorAll('.gd-tbl tbody tr').length, tg: (B.querySelector('.gd-tg') || {}).textContent || '', xl: (B.querySelector('.gs-xl a') || {}).href || '', soon: (B.querySelector('.gs-soon') || {}).textContent || '', lks: [...B.querySelectorAll('.gs-lks a')].map(a => a.href), sub: B.querySelectorAll('.dss').length,
        lit: ISX.sim.lines[gi].steps[i].e.length + ISX.sim.lines[gi].steps[i].n.length });
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await w(260);
    }
    const H = document.getElementById('isx-sn-body'); out.hand = { h3: H.querySelector('h3').textContent, x: H.querySelector('.s2p').textContent, go: (H.querySelector('.sn-go[data-sl="0"][data-sb="0"]') || {}).textContent || '', skip: (H.querySelector(`.sn-q2[data-sl="${pi}"][data-sb="0"]`) || {}).textContent || '' };
    out.ids = ISX.primerIds;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await w(300);
    out.after = [ISX.sim.line, ISX.sim.beat]; return out;
  });
  ok(G.n === 12 && G.s.map(x => x.h3).join('|') === PRIMER.join('|') && G.ids.join() === PIDS.join(), 'the primer: twelve screens in the new order (guide spine §3.1); ids stay with their cards; P6 is retired', [G.s.map(x => x.h3), G.ids]);
  ok(G.s.every((x, i) => x.k === `The basics${i + 1} of 12`), 'each screen’s kicker: “The basics · k of 12”', G.s.map(x => x.k));
  ok(G.s.every(x => x.x.split(/(?<=[.!?])\s+(?=[A-Z“$])/).length <= 2), 'each screen shows at most two sentences; the rest is behind “Say more”', G.s.filter(x => x.x.split(/(?<=[.!?])\s+(?=[A-Z“$])/).length > 2).map(x => x.h3));
  ok(G.s.every(x => /(^On the map: |[.:] On the map[ ,:])/.test(x.vh) && x.vh.length > 30) && /^A pyramid of eight tiers/.test(G.s[2].vh) && /^A timeline in five bands, each ending in a crisis/.test(G.s[3].vh) && /^The timeline’s fifth band is lit/.test(G.s[10].vh), 'each screen has its hidden text alternative; the three with a diagram describe the diagram first', G.s.map(x => x.vh));
  ok(/5\.13%/.test(G.s[5].vh) && /7\.24%/.test(G.s[6].vh), 'the figures in the text alternatives come from the indicators (5.13%, 7.24%)', [G.s[5].vh, G.s[6].vh]);
  ok(G.s.every(x => /^On the map/.test(x.map) && x.know && x.fold === 'Say more'), 'each screen: what is lit, the quiet “I know this: go to the guide”, and “Say more”', G.s.map(x => [x.map.slice(0, 30), x.know, x.fold]));
  ok(G.s.every(x => /^Source: /.test(x.src)) && G.s.every((x, i) => i === 4 || i === 11 || /\d{4}/.test(x.src)), 'every screen with a figure names its source and date', G.s.map(x => x.src));
  ok(G.s.slice(0, 11).every(x => x.lit > 0), 'screens 1 to 11 light real parts of the map', G.s.map(x => x.lit));
  ok(G.s.every(x => x.tips.every(k => x.terms.includes(D[k][0]))) && G.s[0].terms.join('|') === 'Deficit|Federal debt|Rollover|Interest rate|Twin deficit', 'each screen lists the terms it defines, with the glossary’s own wording', G.s.map(x => x.terms));
  ok(G.s.map(x => x.echo.length).join() === '0,0,0,0,0,0,0,0,0,1,1,0' && /not an accident: it is made, and it is used on purpose/.test(G.s[9].echo[0]) && G.s[10].echo[0] === 'Elias Rutten calls the arrangement “a new superstructure that sustains the dollar system and US hegemony”.', '“Why it matters now” keeps its thesis line; “Why the dollar needs the AI trade” carries Elias Rutten’s words, verbatim (theory log, 5 Nov)', G.s.map(x => x.echo));
  /* the diagrams on P10, P11 and P13: a picture hidden from assistive technology, a table view with a caption, the toggle */
  ok(G.s.map(x => x.dg).join() === ',,pyr,eras,,,,,,,eras5,' && [2, 3, 10].every(i => G.s[i].dgHid === 'true' && G.s[i].tblCap.length > 30 && G.s[i].tg === 'View as table') && G.s[2].tblRows === 8 && G.s[3].tblRows === 5 && G.s[10].tblRows === 5, 'the diagrams: a pyramid of eight tiers (P10), the eras in four bands and an open fifth (P11), the fifth band lit (P13); each has a table view', G.s.map(x => [x.dg, x.tblRows]));
  ok(/^https:\/\/x\.com\/adam_tooze\/status\/2095856985652568305$/.test(G.s[3].xl) && /Firms profitability view · coming soon\.$/.test(G.s[8].soon) && G.s[8].lks.length === 3 && G.s[9].lks.length === 1 && G.s.every(x => x.sub === 0), 'P11 links the exchange on X; P12 names the parked profit view as “coming soon” (no link); sources are plain links, never the orange essay button', [G.s[3].xl, G.s[8].soon, G.s[8].lks]);
  ok(/\$1\.18tn in 2025/.test(G.s[1].x) && /about \$970bn to \$5\.2tn by mid-2008\*/.test(G.s[3].more) && /about \$2\.5tn\* of private ones in 2001 to 2007/.test(G.s[3].more) && /^Source: .*\* Dollar assets held by foreign governments.*not yet checked against a primary series/.test(G.s[3].src) && /6\.3% of GDP to US profits, more than firms’ own net investment did \(4\.4%\)/.test(G.s[8].x) && /0\.38% on average, and the 10-year Treasury 5\.13%/.test(G.s[2].more), 'the new figures are on their screens; the two starred figures keep their star and say why in the source line', [G.s[3].src]);
  ok(G.hand.h3 === 'The ground is laid.' && /^You know why the world holds American claims, why the state issues most of them, and why the AI trade now carries them\./.test(G.hand.x) && /^Start the guide/.test(G.hand.go) && G.hand.skip === 'First principles: the same ground, as mechanism', 'the hand-over card (route A): the guide as the main button, first principles offered as the quiet second', G.hand);
  ok(G.after[0] === 0 && G.after[1] === 0, 'Next from the hand-over leads to the guide, step 1 (route A: first principles are offered, not imposed)', G.after);
  ok(G.seg === 10 && !/First principles/.test(G.route), 'on the ground route the bar shows the primer, the eight chapters and the close; first principles appear only while the visitor is in them', [G.seg, G.route.slice(0, 120)]);
  ok(/The basics/.test(G.route), 'the bar shows the primer as the first segment of the ground-up route', G.route.slice(0, 200));
  const lv = G.s.map(x => fk((x.x + ' ' + x.more).replace(/\s+/g, ' ')));
  console.log('      primer reading level (words a sentence, grade): ' + lv.map(r => r.wps.toFixed(1) + '/' + r.grade.toFixed(1)).join(' · '));
  const avg = lv.reduce((a, r) => a + r.wps, 0) / lv.length;
  ok(lv.every(r => r.grade <= 7) && avg <= 15, 'the primer reads at grade 7 or lower on every screen, at most 15 words a sentence on average (spec §6; rough syllable count)', { avg, lv });
  ok(!p._errs.length, 'no page errors (primer)', p._errs.join(' | '));
  await p.context().close();
  /* the way up, and the primer at 1280×760 */
  p = await mk({ viewport: { width: 1280, height: 760 } }, { way: 'ground', pos: '{"l":13,"b":4}' });
  const fit = await js(p, async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = [];
    for (let i = 0; i < 12; i++) { document.querySelector(`#isx-s2bar [data-rt-t="13:${i}"]`).click(); await w(250); const c = document.getElementById('isx-cock'), bar = document.getElementById('isx-s2bar').getBoundingClientRect(), card = document.getElementById('isx-snarr').getBoundingClientRect(), box = document.getElementById('isx-sn-in');
      out.push(card.top >= 0 && card.bottom <= bar.top + 1 && box.scrollHeight <= box.clientHeight + 1 && scrollY === 0 && c.getBoundingClientRect().bottom <= innerHeight + 1); }
    document.querySelector('#isx-sn-body .gnd-know button').click(); await w(300); return { fit: out, up: [ISX.sim.lines[ISX.sim.line].pre, ISX.sim.beat] }; });
  ok(fit.fit.every(Boolean), '1280×760: every primer screen fits one screen, card above the bar, no inner scroll', fit.fit);
  ok(fit.up[0] && fit.up[1] === 0, '“I know this: go to the guide” moves up to first principles, reveal 1', fit.up);
  await p.context().close();

  /* first principles, the new steps, the trims, the echoes, the close */
  p = await mk({}, { way: 'guide' });
  const C = await js(p, async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), L = ISX.sim.lines, pi = L.findIndex(x => x.pre), out = { pre: L[pi].steps.map(s => s.t), main: L[0].steps.map(s => s.t), cards: [] };
    const grab = (l, i, kind) => { const B = document.getElementById('isx-sn-body'); return { l, i, kind, h3: (B.querySelector('h3') || {}).textContent || '', x: [...B.querySelectorAll('.s2p')].map(e => e.textContent).join(' '), nt: [...B.querySelectorAll('.sn-note')].map(e => e.textContent).join(' '), echo: [...B.querySelectorAll('.thesis-echo')].map(e => e.textContent), ch: (ISX.sim.line === 0 && ISX.sim.beat >= 0 && ISX.sim.beat < L[0].steps.length) ? null : null }; };
    for (const l of [pi, 0]) { const n = L[l].steps.length;
      for (let i = 0; i <= n; i++) { const t = document.querySelector(`#isx-s2bar [data-rt-t="${l}:${i}"]`); if (!t) continue;
        const dk = document.querySelector(`#isx-s2bar [data-rt-t="d:${l}:${i - 1}"]`);
        if (dk) { dk.click(); await w(60); out.cards.push(grab(l, i, 'ask')); document.querySelector('#isx-sn-body [data-fk="alt"]').click(); await w(60);
          for (let c = 0; c < 9; c++) { out.cards.push(grab(l, i, ISX.sim.ph)); if (ISX.sim.ph === 'crisis') break; document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await w(60); } }
        document.querySelector(`#isx-s2bar [data-rt-t="${l}:${i}"]`).click(); await w(80); out.cards.push(grab(l, i, i === n ? 'end' : 'step')); } }
    out.chOf = L[0].steps.map((s, i) => { const b = document.querySelector(`#isx-s2bar [data-rt-t="0:${i}"]`); return b ? [...document.querySelectorAll('#isx-s2bar .rt-segs > .rt-s')].findIndex(sg => sg.contains(b)) : -1; });
    return out; });
  ok(C.pre.join('|') === REVEALS.join('|'), 'first principles: ten reveals (guide spine §4: “Deficits become profits” and “Why the dollar needs the AI trade” appended)', C.pre);
  const card = (l, t) => C.cards.find(c => c.kind === 'step' && c.l === l && c.h3 === t) || {};
  ok(/Most accounts treat the global imbalance as a flaw to be fixed\. The map’s thesis is that it is also a tool: made on purpose, and used\./.test(card(12, REVEALS[2]).echo.join(' ')), 'R3 carries the line on the map’s thesis', card(12, REVEALS[2]).echo);
  ok(/^Each era produced different claims for the world to hold: dollars tied to gold until 1971, oil money recycled through banks after 1974, mortgages before 2008, then the government’s own debt\./.test(card(12, REVEALS[5]).x.trim()) && /Since about 2014 the claims have come back less as central-bank reserves/.test(card(12, REVEALS[5]).x) && !/since the early 1970s|ended in the early 1970s the US has run/i.test(card(12, REVEALS[5]).x) && !card(12, REVEALS[5]).nt, 'R5 rewritten: the eras in the primer’s words, the 2014 shift, no misdated deficits; its note moved to R8', card(12, REVEALS[5]));
  ok(/Elias Rutten’s thesis: the dollar system is moving “from a state-centric, public-reserve hegemony to an asset-driven, private-capital network”\./.test(card(12, REVEALS[9]).nt) && card(12, REVEALS[9]).echo.length === 1 && /So the AI trade has become the main way the dollar system absorbs the world’s savings\./.test(card(12, REVEALS[9]).x), 'R8: the AI trade as the way the dollar system absorbs the world’s savings; Elias Rutten’s abstract in its note', card(12, REVEALS[9]));
  ok(/^Profits equal what firms invest plus what the government borrows, minus what households and the rest of the world save, plus dividends\./.test(card(12, REVEALS[8]).x.trim()) && /6\.3% of GDP a year to US profits, against 4\.5% from net private investment/.test(card(12, REVEALS[8]).x) && /This is accounting: it holds by definition and says nothing about which term moves first\./.test(card(12, REVEALS[8]).nt), 'R7: the profit equation as accounting, marked as accounting', card(12, REVEALS[8]));
  ok(/This is accounting: the two amounts are the same by definition\./.test(card(12, REVEALS[3]).nt), 'R4a marks the accounting as accounting', card(12, REVEALS[3]).nt);
  const at = t => C.main.indexOf(t) + 1;
  ok(at('The Fed opens the tap') === 30 && at('As statecraft, it adds up') === 45 && at('Dollars without a bank') === 46 && at('Dollars for the underclass') === 47 && at('Does it add up?') === 44, 'the three new steps sit at 30, 45 and 47; “Dollars without a bank” at 46', [at('The Fed opens the tap'), at('As statecraft, it adds up'), at('Dollars without a bank'), at('Dollars for the underclass')]);
  const S = t => card(0, t).x || '';
  ok(/On 10 December 2025 the Fed removed the \$500bn cap on its standing repo/.test(S('The Fed opens the tap')) && !/\$830bn/.test(S('The cushion runs out')) && /That is capital flows used as a weapon\./.test(S('As statecraft, it adds up')) && /foreign monetary underclass/.test(S('Dollars for the underclass')) && /“Hierarchical dollarisation” and “foreign monetary underclass” are Elias Rutten’s terms\./.test(card(0, 'Dollars for the underclass').nt), 'the new cards carry their own text; Elias Rutten’s terms are on a card, credited to him', [S('The Fed opens the tap'), S('As statecraft, it adds up'), S('Dollars for the underclass')]);
  ok(/that would be about a quarter of what they put into US securities\.$/.test(S('Back to Wall Street').trim()) && /^The richest tenth do more than 45% of consumer spending/.test(S('The top tenth does the spending').trim()) && /Households buy goods, not chips/.test(S('Spending becomes imports')) && /in the 12 months to 8 November 2026/.test(S('Shares fund capex too')) && /^A spike in bond volatility forces leveraged buyers out, as in March 2020\.$/.test(S('Volatility').trim()) && /long yields kept climbing into October\./.test(S('A calmer long end, mostly')), 'the trims: the cards read as the copy round wrote them (steps 9, 12, 13, 15, 25 and 51)', ['Back to Wall Street', 'Shares fund capex too', 'Volatility'].map(S));
  const ech = C.cards.filter(c => c.echo.length);
  console.log('      thesis echoes:\n' + ech.map(c => `        ${c.l === 0 ? 'step ' + (c.i + 1) : c.l === 12 ? 'first principles ' + (c.i + 1) : c.l + ':' + c.i} · ${c.h3} · ${c.echo.join(' ')}`).join('\n'));
  ok(ech.every(c => c.kind === 'step' || c.kind === 'end'), 'no echo on a decision, chain or crisis card', ech.filter(c => c.kind !== 'step' && c.kind !== 'end').map(c => c.h3));
  const mainE = ech.filter(c => c.l === 0 && c.kind === 'step').map(c => c.i), chOf = i => C.chOf[i];
  ok(mainE.every((i, k) => !k || i - mainE[k - 1] > 1), 'never on two cards in a row', mainE);
  ok(new Set(mainE.map(chOf)).size === mainE.length && mainE.every(i => chOf(i) >= 4), 'at most one echo per chapter, none in the first three chapters', mainE.map(i => [i + 1, chOf(i)]));
  const end = C.cards.find(c => c.kind === 'end' && c.l === 0) || {};
  ok(/A price manipulated, buyers captured, rules shaped, dollars rationed: those are the valves, and you have seen who holds them\./.test(end.echo.join(' ')) && /Malaysia’s and Singapore’s gross AI-hardware exports about 37% and 35%/.test(end.x) && /took 47% of sterling corporate bond issuance in 2026 to early September/.test(end.x), 'the guide’s close pays off the thesis, with the bought-in economies and the sterling share', end);
  const endFold = await js(p, async () => { document.querySelector(`#isx-s2bar [data-rt-t="0:${ISX.sim.lines[0].steps.length}"]`).click(); await new Promise(r => setTimeout(r, 200)); return (document.querySelector('#isx-sn-body details.s2deep') || {}).textContent || ''; });
  ok(/Sterling: Bank of England Financial Policy Committee record, 25 Sep 2026/.test(endFold) && /Gross exports include imported parts/.test(endFold), 'the close’s figures carry their sources and the gross-exports caveat', endFold.slice(0, 200));
  ok(!p._errs.length, 'no page errors (first principles and the guide)', p._errs.join(' | '));
  await p.context().close();
  /* the play runner keeps a play's own order: in the full view, play 0's fifth move is the Fed opening the tap */
  p = await mk({}, { mode: 'full' });
  const pr = await js(p, async () => { ISX.simPlay(0); await new Promise(r => setTimeout(r, 300)); const t = []; for (let i = 0; i < 8; i++) { t.push((document.querySelector('#isx-rside h4') || {}).textContent || ''); const n = document.getElementById('isx-pn'); if (!n || i === 7) break; n.click(); await new Promise(r => setTimeout(r, 120)); } return t; });
  ok(pr[4] === '5. The Fed opens the tap' && pr[3] === '4. The cushion runs out' && pr.length === 8, 'the full view’s play runner follows the play’s order: the tap after the cushion', pr);
  ok(!p._errs.length, 'no page errors (plays)', p._errs.join(' | '));
  await p.context().close();
  /* the Circuit's first line (copy Part G) */
  const ins = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'insights.json'), 'utf8'));
  ok(ins.first.t === 'The world’s dollars used to go into US government debt. In the year to August 2026 foreign investors put $1.01tn into US shares, while foreign central banks sold $164bn of Treasuries.' && ins.first.src === '12 months to August 2026 · US Treasury' && ins.first.go.label === 'Follow the dollar', 'the Circuit’s first line says why the pair of figures matters; same figures, source and button', ins.first);

  await b.close();
  console.log(`tiers-check: ${pass} pass, ${fail} fail`);
  process.exit(fail ? 1 : 0);
})();
