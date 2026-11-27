/* Check of round OR7 (25 Nov 2026): the order's first view. The old order as a frame, China's own institutions at and not before their dates,
   marks from Pax Silica and WAICO not before theirs, the two steps after the story (by address, by keys, by play), no surplus line into the
   United States, a still picture under reduced motion, “Pause motion”, and the memberships in a body's card.
   Usage: NODE_PATH=/opt/npm-tools/node_modules node tools/orrery-or7-check.js [baseUrl]   (python3 -m http.server 8731 at the repo root)
   Run it with profit-check, arc-check and orrery-mobile-check when `v2/orrery.js`, `orrery.css` or `data/orrery.json` changes.
   OR8 (26 Nov 2026): the story is a stage (v2/stage8.js). Expectations changed with the layout, each marked “OR8” below: the old order is the rim of the
   picture, not a strip and a frame; the key is on the picture (#isx-orr-key-in), open on a wide stage; what the lines are is said under “Flows”; the card
   under the timeline is the narrator (.orr-nar); the step control is the chapter strip (chapters 9 and 10); China's arcs show from their dates, round China
   where it stands; the pulses on the flow lines run in every year, so “Pause motion” shows in every year; a played film reaches the steps after chapter 8;
   titles follow the chapter. The stage's own checks are in tools/orrery-or8-check.js. */
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8731/imperial-stack/';
let fails = 0, n = 0;
const ok = (name, cond, extra) => { n++; if (!cond) fails++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 700) : '')); };
/* the dates as read from their sources on 25 Nov 2026 (imperial-stack-work, data/or7/OR7-institution-dates.csv) */
const OWN = [[2001, 'Shanghai Cooperation Organisation'], [2008, 'Swap lines'], [2009, 'BRICS'], [2013, 'Belt and Road'], [2014, 'New Development Bank'], [2015, 'Cross-border Interbank Payment System'], [2016, 'Asian Infrastructure Investment Bank'], [2024, 'BRICS, enlarged'], [2026, 'World Artificial Intelligence Cooperation Organization']];
const LAUNCH = ['AUS', 'GBR', 'ISR', 'JPN', 'KOR', 'SGP'];   /* with the United States (the centre): the seven of 12 Dec 2025 */
(async () => {
  const b = await chromium.launch(); const errs = [];
  const open = async (w, h, touch, hash, rm) => {
    const c = await b.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1, reducedMotion: rm ? 'reduce' : 'no-preference' });
    await c.addInitScript(() => { ['isx-tips-globe', 'isx-tour', 'isx-tips-sim', 'isx-first', 'isx-insights', 'isx-simtour'].forEach(k => localStorage.setItem(k, 'off')); localStorage.setItem('isx-intro-off', '1'); localStorage.setItem('isx-stack', 'open'); });
    const p = await c.newPage(); p._c = c;
    p.on('pageerror', e => errs.push('PAGE ' + String(e).slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/favicon/i.test(m.text())) errs.push('CON ' + m.text().slice(0, 200)); });
    await p.goto(base + '#profit/order' + (hash ? '/' + hash : ''), { waitUntil: 'load', timeout: 90000 });
    await p.waitForFunction(() => window.ISX && ISX.booted && ISX.profit && ISX.profit.state.ready, null, { timeout: 60000 });
    await p.waitForFunction(() => document.querySelector('.orr-svg .ob'), null, { timeout: 20000 });
    await p.evaluate(() => { ISX.orrOpened = true; const k = document.querySelector('.orr-skip'); if (k) k.click(); }); await p.waitForTimeout(700);
    return p;
  };
  const year = (p, y) => p.evaluate(y => { const i = document.querySelector('.orr-sl input'); i.value = y; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); }, y).then(() => p.waitForTimeout(450));
  const names = p => p.evaluate(() => [...document.querySelectorAll('.orr-svg text:not(.orr-rimt)')].filter(t => { const cs = getComputedStyle(t); return !t.classList.contains('off') && cs.visibility !== 'hidden' && +cs.opacity > .3 && t.textContent; }).map(t => { const r = t.getBoundingClientRect(); return { t: t.textContent, x0: r.left + 1, y0: r.top + 2, x1: r.right - 1, y1: r.bottom - 2 }; }));
  const overlaps = L => { const o = []; for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const a = L[i], c = L[j]; if (a.x0 < c.x1 && c.x0 < a.x1 && a.y0 < c.y1 && c.y0 < a.y1) o.push(a.t + ' × ' + c.t); } return o; };
  const marks = p => p.evaluate(() => { const o = ISX.profit.orrery.cur, R = {}; o.list.forEach(q => { const s = q.g.dataset.s; (R[s] = R[s] || []).push(q.iso || q.id); }); return R; });

  /* A · the frame and China's own institutions */
  {
    const p = await open(1440, 900, false, '');
    /* OR8: the old order is the rim of the picture (a path round every body), named on the rim itself; it was a frame at the stage's edge and a strip at its foot */
    const f = await p.evaluate(() => { const o = ISX.profit.orrery.cur, s = document.querySelector('.orr-rimg'), r = s.querySelector('.orr-rim'), B = o.box(), hid = e => getComputedStyle(e).visibility === 'hidden' || getComputedStyle(e).display === 'none';
      const out = o.list.filter(q => q.p && q.vis !== false && !r.isPointInFill(new DOMPoint(q.p[0], q.p[1]))).map(q => q.name), bb = r.getBBox();
      return { top: s.querySelector('.orr-rimt.a').textContent.replace(/\s+/g, ' '), bot: s.querySelector('.orr-rimt.b').textContent.replace(/\s+/g, ' '), a: s.querySelector('.orr-old').getAttribute('aria-label'), out, inBox: bb.x >= B.ox - 1 && bb.x + bb.width <= B.ox + B.wp + 1 && bb.y >= B.oy - 1 && bb.y + bb.height <= B.oy + B.hl + 1, shown: [hid(s.querySelector('.orr-rimt.a')), hid(s.querySelector('.orr-rimt.b'))], wtoOff: [...s.querySelectorAll('.orr-rimt.b tspan:not(.hd)')].map(hid) }; });
    ok('A · the old order is the rim of the picture: every body stands inside it, and it stands inside the picture’s box', f.out.length === 0 && f.inBox, f);
    ok('A · the rim is named on the picture: the WTO order, IMF and World Bank 1944, GATT 1948, ADB 1966, WTO 1995', /THE WTO ORDER, 1995–/.test(f.top) && /IMF AND WORLD BANK 1944/.test(f.top) && /GATT 1948/.test(f.top) && /ADB 1966/.test(f.top) && /WTO 1995/.test(f.top) && f.shown[0] === false && /^The WTO order, 1995–, the rim of the picture: the old order/.test(f.a), f);   /* OR8: the button's name starts with the words printed on the rim */
    ok('A · China inside it: IMF and World Bank seat 1980, ADB 1986; the WTO mark is not shown in 1995', /CHINA INSIDE IT/.test(f.bot) && /SEAT 1980/.test(f.bot) && /ADB 1986/.test(f.bot) && f.shown[1] === false && f.wtoOff.join() === 'false,false,true', f);
    const tk = await p.evaluate(() => ({ t: document.querySelector('.orr-tkey').textContent, ln: (() => { const e = document.querySelector('.orr-fcap'); return [e.offsetParent === null, e.textContent]; })(), key: (() => { const k = document.querySelector('#isx-orr-key-in'), b = document.querySelector('.orr-kyb'); const r = [k.hidden, b.getAttribute('aria-expanded')]; b.click(); r.push([...k.querySelectorAll('.olg')].filter(e => e.offsetParent !== null).map(e => e.textContent), k.hidden); b.click(); r.push(k.hidden); return r; })() }));   /* OR9: the key opens on demand */
    ok('A · the timeline says what its marks are; the lines into the US are named on the stage, under “Flows”; the marks’ key is on the picture behind “Key”, which opens and closes it (OR9: closed at first)', /Events/.test(tk.t) && /China’s own/.test(tk.t) && tk.ln[0] === false && /what US firms’ affiliates earned in each economy in 1995 \(BEA/.test(tk.ln[1]) && tk.key[0] === true && tk.key[1] === 'false' && tk.key[2].some(t => /An economy: its size is its share of world GDP/.test(t)) && tk.key[3] === false && tk.key[4] === true, tk);
    const wto = () => p.evaluate(() => { const e = document.querySelector('.orr-rimg .orr-rimt.b tspan:last-child'); return [getComputedStyle(e).visibility === 'hidden', e.textContent.trim()]; });
    await year(p, 2000); const w0 = (await wto())[0];
    await year(p, 2001); const w1 = await wto();
    ok('A · China’s WTO mark: absent in 2000, shown from 2001', w0 === true && w1[0] === false && /WTO 2001/.test(w1[1]), [w0, w1]);
    const ys = await p.evaluate(() => [...document.querySelectorAll('.orr-owd')].map(d => [+d.dataset.y, d.getAttribute('aria-label')]));
    ok('A · nine teal marks on the timeline, at the years read from the sources', ys.map(x => x[0]).join() === OWN.map(x => x[0]).join(), ys);
    let bad = [];
    for (const [y, nm] of OWN) {
      await year(p, y - 1); const a = await p.evaluate(y => ({ on: document.querySelector('.orr-owd[data-y="' + y + '"]').classList.contains('on'), card: document.querySelector('.orr-ins').textContent }), y);
      await year(p, y); const c = await p.evaluate(y => ({ on: document.querySelector('.orr-owd[data-y="' + y + '"]').classList.contains('on'), k: document.querySelector('.orr-ins .k').textContent, src: document.querySelector('.orr-ins small').textContent }), y);
      if (a.on || a.card.includes(nm) && nm !== 'BRICS' || !c.on || !c.k.includes(nm) || !c.k.includes(String(y)) || !/^Source: \S/.test(c.src)) bad.push([y, nm, a.on, c]);
    }
    ok('A · each institution: not lit and not in the card the year before, lit and named in the card (with its source) in its year', bad.length === 0, bad);
    await year(p, 1998); const fr = await p.evaluate(() => document.querySelector('.orr-ins').textContent);
    ok('A · before 2001 the card says where China stands in the old order', /The rim · China inside it/i.test(fr) && /since 1980/.test(fr), fr);
    /* arcs (OR8): from each institution's date, round China where it stands; one by one */
    const arcs = async () => p.evaluate(() => [...document.querySelectorAll('.orr-svg .oa')].filter(g => +getComputedStyle(g).opacity > .5).map(g => g.dataset.a));
    const labs = async () => p.evaluate(() => [...document.querySelectorAll('.orr-svg .orr-al:not(.off)')].map(t => t.textContent));
    await year(p, 2000); const a00 = await arcs(), l00 = await labs();
    await year(p, 2009); const a09 = await arcs(), l09 = await labs();
    await year(p, 2013); const a13 = await arcs(), l13 = await labs();   /* OR9: the arcs are chapter 5's idea (2013–2016): before it, none; from it, each from its date */
    await year(p, 2019); const a19 = await arcs(), l19 = await labs();
    await year(p, 2025); const a25 = await arcs(), l25 = await labs();
    await year(p, 2026); const a26 = await arcs(), l26 = await labs();
    ok('A · no arc before its date, and none before chapter 5 tells them: none in 2000 or 2009; four in 2013 (SCO 2001, Swap lines 2008, BRICS 2009, Belt and Road 2013), seven in 2019', a00.length === 0 && l00.length === 0 && a09.length === 0 && l09.length === 0 && a13.join() === 'sco,swap,bric,bri' && l13.join(' | ') === 'SCO 2001 | Swap lines 2008 | BRICS 2009 | Belt and Road 2013' && a19.join() === 'sco,swap,bric,bri,ndb,cips,aiib' && l19.length === 7, [a00, a09, a13, l13, a19, l19]);
    const ac = await p.evaluate(() => { const o = ISX.profit.orrery.cur, c = o.list.find(q => q.china).p, pa = document.querySelector('.orr-svg .oa[data-a="sco"] .ar'), e = pa.getPointAtLength(0); return Math.hypot(e.x - c[0], e.y - c[1]); });
    ok('A · 2019: the arcs stand round China where it is (not round a place it has not reached)', ac > 10 && ac < 70, ac);
    ok('A · 2025: seven named arcs round China (SCO 2001 … AIIB 2016), WAICO not among them', a25.join() === 'sco,swap,bric,bri,ndb,cips,aiib' && l25.join(' | ') === 'SCO 2001 | Swap lines 2008 | BRICS 2009 | Belt and Road 2013 | NDB 2014 | CIPS 2015 | AIIB 2016', [a25, l25]);
    ok('A · 2026: the eighth arc, WAICO 2026', a26.length === 8 && a26[7] === 'waico' && l26[7] === 'WAICO 2026', [a26, l26]);
    const hd = await p.evaluate(() => [...document.querySelectorAll('.orr-svg .orr-ahd:not(.off)')].map(t => t.textContent).join(' '));
    ok('A · the arcs carry their heading on the picture', hd === 'CHINA’S OWN INSTITUTIONS', hd);
    await year(p, 2014); const gl = await p.evaluate(() => { const o = ISX.profit.orrery.cur, c = o.list.find(q => q.china).p, s = document.querySelector('.orr-svg .orr-sun.c .co'); return Math.hypot(+s.getAttribute('cx') - c[0], +s.getAttribute('cy') - c[1]); });
    ok('A · 2014: China’s glow sits on China (one body, not two)', gl < 1, gl);
    await p.evaluate(() => document.querySelector('.orr-svg .oa[data-a="cips"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(200);
    ok('A · an arc, when clicked, puts its institution in the card', /2015 · Cross-border Interbank Payment System/.test(await p.evaluate(() => document.querySelector('.orr-ins .k').textContent)));
    for (const y of [2025, 2026]) { await year(p, y); const o = overlaps(await names(p)); ok('A · ' + y + ': no two names overlap on the picture', o.length === 0, o.slice(0, 6)); }
    await p._c.close();
  }

  /* B · marks from the lists only from their dates */
  {
    const p = await open(1440, 900, false, '');
    const key = () => p.evaluate(() => [...document.querySelectorAll('#isx-orr-key-in .olg')].map(e => e.textContent.trim()));   /* OR8: the key on the picture */
    const lane = () => p.evaluate(() => [...document.querySelectorAll('.orr-svg .orr-lt')].filter(t => +t.style.opacity > .5).map(t => t.textContent));
    const k95 = await key(); ok('B · 1995: the key names no list (no Pax Silica, no “both lists”)', !k95.some(t => /Pax Silica|both lists|neither list/i.test(t)), k95);
    await year(p, 2024); const m24 = await marks(p), k24 = await key();
    ok('B · 2024: no mark from a list on any body, none in the key', !m24.pax && !m24.usx && !m24.tw && !m24.both && !m24.sw && !m24.btw && !k24.some(t => /Pax Silica|both lists|neither list/i.test(t)), [Object.keys(m24), k24]);
    await year(p, 2025); const m25 = await marks(p), k25 = await key(), l25 = await lane();
    ok('B · 2025: Pax Silica marks on the six signatories of 12 Dec 2025 only (with the United States at the centre)', (m25.pax || []).slice().sort().join() === LAUNCH.join(), m25.pax);
    ok('B · 2025: nothing that depends on WAICO: no “both lists” mark, band or key entry; Taiwan not yet marked', !m25.both && !m25.sw && !m25.tw && (m25.btw || []).length > 10 && l25.join() === 'BETWEEN THE TWO SYSTEMS,BETWEEN THE TWO SYSTEMS' && !k25.some(t => /both lists|neither list|without signing/i.test(t)) && k25.includes('Pax Silica signatory'), [m25, l25, k25]);
    await year(p, 2026); const m26 = await marks(p), k26 = await key(), l26 = await lane();
    ok('B · 2026: the later signatories, Taiwan, and the two bands by list', (m26.pax || []).length > 20 && (m26.tw || []).join() === 'TWN' && (m26.both || []).length >= 10 && !m26.btw && l26.join() === 'ON BOTH LISTS,ON NEITHER LIST' && k26.some(t => /^On both lists/.test(t)) && k26.includes('Takes part without signing'), [m26, l26, k26]);
    const d = await p.evaluate(() => fetch('data/orrery.json').then(r => r.json()).then(j => j.order.lists));
    ok('B · the dates in the data: Pax Silica 12 Dec 2025, WAICO 16 Jul 2026', d.pax === 2025 && d.waico === 2026 && d.paxDate === '12 Dec 2025' && d.waicoDate === '16 Jul 2026', d);
    await p._c.close();
  }

  /* C · the two steps: by address, by keys, by play */
  {
    let p = await open(1440, 900, false, 'profit-and-production');
    let r = await p.evaluate(() => ({ step: document.querySelector('.orr').dataset.step, title: document.getElementById('isx-pf-title').textContent, cur: (e => e.textContent + (e.dataset.s || ''))(document.querySelector('.orr-stp[aria-current]')) + ' | ' + document.querySelector('.orr-chs .nk').textContent, yr: document.querySelector('.orr-yr').textContent, ch: [...document.querySelectorAll('.orr-stage .orr-ch')].map(c => ({ t: c.querySelector('.ct').textContent, lines: c.querySelectorAll('.ln').length, axes: c.querySelectorAll('.ax').length, vl: [...c.querySelectorAll('.vl')].map(v => v.textContent), src: c.querySelector('small').textContent, label: c.querySelector('svg').getAttribute('aria-label') })), keep: [...document.querySelectorAll('.orr-svg .ob.keep')].map(g => g.getAttribute('aria-label')), dim: +getComputedStyle(document.querySelector('.orr-svg .ob:not(.keep)')).opacity, card: document.querySelector('.orr-nar').textContent }));
    ok('C · #profit/order/profit-and-production opens step 1 at 2026: chapter 9 of 10, after the story', r.step === 'pp' && r.yr === '2026' && r.title === 'Profit gathers at the centre; production moves to China' && /^9Profit and production \| Chapter 9 of 10 · after the story$/.test(r.cur), r);
    ok('C · step 1: the United States and China lit, the rest dimmed', r.keep.sort().join() === 'China,US, United States' && r.dim < .3, [r.keep, r.dim]);
    ok('C · step 1: two separate charts, one line and one axis each (never two axes on one chart)', r.ch.length === 2 && r.ch.every(c => c.lines === 1 && c.axes === 1), r.ch);
    const cp = await p.evaluate(() => ({ ct: +getComputedStyle(document.querySelector('.orr-hud')).opacity, cap: (document.querySelector('.orr-sc') || {}).textContent, vn: document.getElementById('isx-pf-vn').textContent }));
    ok('C · step 1: the year’s counters step back; a caption and the kicker say “After the story · step 1 of 2”', cp.ct < .1 && /Two shares of the world’s total/.test(cp.cap) && /After the story · step 1 of 2/.test(cp.vn), cp);
    ok('C · step 1: one figure at each end: 32.1% (2011 list) and 42.2% (2026 list); 8.5% (2004) and 27.4% (2025)', r.ch[0].vl.join(' | ') === '32.1% · 2011 list | 42.2% · 2026 list' && r.ch[1].vl.join(' | ') === '8.5% · 2004 | 27.4% · 2025', r.ch.map(c => c.vl));
    ok('C · step 1: source and date under each chart; a text alternative on each', /Forbes Global 2000.*17 Nov 2026/.test(r.ch[0].src) && /World Bank.*11 Nov 2026/.test(r.ch[1].src) && r.ch.every(c => /%/.test(c.label)), r.ch.map(c => [c.src, c.label]));
    const dj = await p.evaluate(() => fetch('data/orrery.json').then(x => x.json()).then(j => j.steps));
    ok('C · the figures in the data: gaps stay gaps (no US value before 2011, no value for China in 2026)', dj.pp.years[0] === 2004 && dj.pp.us.slice(0, 7).every(v => v === null) && dj.pp.us[7] === 32.12 && dj.pp.cn[22] === null && dj.pp.cn[21] === 27.4 && dj.pp.us[22] === 42.21, dj.pp);
    ok('C · step 1: no two names overlap', overlaps(await names(p)).length === 0, overlaps(await names(p)).slice(0, 5));
    await p.click('#isx-pf-table'); await p.waitForTimeout(300);
    const tb = await p.evaluate(() => { const t = document.querySelector('#isx-pf-fig table'); return t ? [t.rows.length, t.rows[0].textContent, t.rows[t.rows.length - 1].textContent] : null; });
    ok('C · step 1: “View as table” gives the two series by year', tb && tb[0] === 24 && /US share of profits/.test(tb[1]) && /2026.*42\.21/.test(tb[2]), tb);
    await p._c.close();

    p = await open(1440, 900, false, 'clearing');
    r = await p.evaluate(() => ({ step: document.querySelector('.orr').dataset.step, title: document.getElementById('isx-pf-title').textContent, hash: location.hash, card: document.querySelector('.orr-nar').textContent, labs: [...document.querySelectorAll('.orr-svg .orr-fl')].map(t => t.textContent) }));
    ok('C · #profit/order/clearing opens step 2', r.step === 'cl' && r.title === 'China finances the system it competes with' && r.hash === '#profit/order/clearing', r);
    /* OR8: the picture's box is narrower than the old stage (the stage keeps a column on each side), so a line's name and its figure stand on two lines, as they did on a narrow stage */
    ok('C · step 2: every line is named, with its figure where one exists (IMF, 2025)', ['China’s surplus', '$724bn', 'Germany', '$228bn', 'Japan', '$217bn', 'finances the US deficit', '$1,177bn', '← Goods*', 'Dollars* →', 'Multilateral clearing*'].every(t => r.labs.includes(t)), r.labs);
    ok('C · step 2: the asterisk line stands on the picture; the source and the “not the whole pool” line are in the card', (await p.evaluate(() => (document.querySelector('.orr-stage .orr-fn') || {}).textContent)) === '* No pair of countries settles alone: surpluses meet deficits in one pool, and the pool buys dollar assets. Lines between the poles show a direction only.' && /IMF World Economic Outlook, October 2026.*2025/.test(r.card) && /not the whole pool/.test(r.card), r.card);
    /* D · no surplus line ends at the United States */
    const g = await p.evaluate(() => { const o = ISX.profit.orrery.cur, us = o.list.find(q => q.iso === 'USA').p, P = [o.L.cx, o.L.cy], end = pa => { const l = pa.getTotalLength(), e = pa.getPointAtLength(l), s = pa.getPointAtLength(0); return { from: pa.dataset.from, to: pa.dataset.to, dUS: Math.hypot(e.x - us[0], e.y - us[1]), dP: Math.hypot(e.x - P[0], e.y - P[1]), sP: Math.hypot(s.x - P[0], s.y - P[1]), dash: getComputedStyle(pa).strokeDasharray, marker: pa.getAttribute('marker-end') }; };
      return { sur: [...document.querySelectorAll('.orr-svg .orr-flows .fl.sur')].map(end), def: [...document.querySelectorAll('.orr-svg .orr-flows .fl.def')].map(end), ill: [...document.querySelectorAll('.orr-svg .orr-flows .fl.ill')].map(end), usP: Math.hypot(us[0] - P[0], us[1] - P[1]) }; });
    ok('D · three surplus lines (China, Germany, Japan), each ending at the clearing point, none at the United States', g.sur.length === 3 && g.sur.map(s => s.from).join() === 'CHN,DEU,JPN' && g.sur.every(s => s.to === 'clearing' && s.dP < 22 && s.dUS > 100), g.sur);
    ok('D · one line runs from the clearing point into the United States', g.def.length === 1 && g.def[0].from === 'clearing' && g.def[0].to === 'USA' && g.def[0].sP < 22 && g.def[0].dUS < 45, g.def);
    ok('D · measured lines are solid, the two illustrative ones dashed; every line has an arrowhead', g.sur.concat(g.def).every(s => s.dash === 'none' && /url\(/.test(s.marker)) && g.ill.length === 2 && g.ill.every(s => s.dash !== 'none' && /url\(/.test(s.marker)), [g.sur.map(s => s.dash), g.ill.map(s => s.dash)]);
    ok('D · step 2: no two names overlap', overlaps(await names(p)).length === 0, overlaps(await names(p)).slice(0, 5));
    ok('D · the figures in the data are the IMF’s 2025 values, not the 2026 estimates', JSON.stringify(dj.cl.into) === '[["CHN",724.4],["DEU",228.3],["JPN",216.6]]' && dj.cl.us === -1177.1 && dj.cl.year === 2025, dj.cl);
    /* keys: left and right on the step control; leaving 2026 leaves the step */
    await p.focus('.orr-stp[aria-current]'); await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(400);
    const k1 = await p.evaluate(() => [document.querySelector('.orr').dataset.step, location.hash, document.activeElement.textContent + (document.activeElement.dataset.s || '')]);   /* OR8: the chip's short title is drawn from data-s */
    await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(400); const k2 = await p.evaluate(() => [document.querySelector('.orr').dataset.step, location.hash, document.querySelectorAll('.orr-svg .orr-flows .fl, .orr-stage .orr-ch').length]);
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(250); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(400); const k3 = await p.evaluate(() => [document.querySelector('.orr').dataset.step, location.hash]);
    ok('C · keys: ← from step 2 to step 1 (focus follows), ← to the story at 2026, → → to step 2 again', k1[0] === 'pp' && k1[1] === '#profit/order/profit-and-production' && /^9Profit and production/.test(k1[2]) && k2[0] === '' && k2[1] === '#profit/order/2026' && k2[2] === 0 && k3[0] === 'cl' && k3[1] === '#profit/order/clearing', [k1, k2, k3]);
    await year(p, 2010); const lv = await p.evaluate(() => [document.querySelector('.orr').dataset.step, location.hash, document.getElementById('isx-pf-title').textContent, document.querySelectorAll('.orr-svg .orr-flows .fl').length, +getComputedStyle(document.querySelector('.orr-svg .ob[aria-label="Japan"]')).opacity]);
    ok('C · moving the year leaves the step: the story again, nothing dimmed; the title follows the chapter (OR8)', lv[0] === '' && lv[1] === '#profit/order/2010' && lv[2] === '2008 · The dollar is sent out' && lv[3] === 0 && lv[4] > .9, lv);
    await p.waitForTimeout(700);   /* the counters fade back in over .4 s */
    const bk = await p.evaluate(() => [document.getElementById('isx-pf-vn').textContent, +getComputedStyle(document.querySelector('.orr-hud')).opacity, !!document.querySelector('.orr-sc')]);
    ok('C · and the kicker and the counters are back', /^The story/.test(bk[0]) && bk[1] > .9 && !bk[2], bk);
    await p.click('.orr-stp[data-step="pp"]'); await p.waitForTimeout(400); const cs = await p.evaluate(() => [document.querySelector('.orr').dataset.step, document.querySelector('.orr-yr').textContent]);
    ok('C · a step chosen from an earlier year goes to 2026 first', cs.join() === 'pp,2026', cs);
    /* play: from 2026 it goes on to step 1, then step 2, then offers the door */
    /* OR8: Play is the film. From chapter 8 (2026) it reads the chapter, then goes on to step 1, then step 2 (9 s each), then offers “Replay” */
    await p.click('.orr-chp[data-ch="7"]'); await p.waitForTimeout(2400); await p.click('.orr-play'); await p.waitForTimeout(600);
    const p0 = await p.evaluate(() => [document.querySelector('.orr').dataset.step, document.querySelector('.orr-play').textContent]);
    await p.waitForFunction(() => document.querySelector('.orr').dataset.step === 'pp', null, { timeout: 30000 }); const t1 = Date.now();   /* OR9: chapters and steps are told in beats; each step holds about 17 s */
    const p1 = await p.evaluate(() => [document.querySelector('.orr').dataset.step, document.querySelector('.orr-play').textContent]);
    await p.waitForFunction(() => document.querySelector('.orr').dataset.step === 'cl', null, { timeout: 25000 }); const t2 = Date.now(), p2 = 'cl';
    await p.waitForFunction(() => /Replay/.test(document.querySelector('.orr-play').textContent), null, { timeout: 25000 }); const t3 = Date.now();
    const p3 = await p.evaluate(() => [document.querySelector('.orr').dataset.step, document.querySelector('.orr-play').textContent, [...document.querySelectorAll('.orr-nar .orr-nx')].map(b => b.textContent)]);
    ok('C · play: chapter 8 first, then step 1, then step 2 (each held more than 8 s), then “Replay” and the economists’ door as the next step', p0[0] === '' && /Pause/.test(p0[1]) && p1[0] === 'pp' && /Pause/.test(p1[1]) && p2 === 'cl' && t2 - t1 > 8000 && t3 - t2 > 8000 && p3[0] === 'cl' && /Replay/.test(p3[1]) && p3[2].some(t => /For economists: the full statistics/.test(t)), [p0, p1, p2, p3, t2 - t1, t3 - t2]);
    await p.click('.orr-nar .orr-nx.fw'); await p.waitForTimeout(500);
    ok('C · the door at the end opens the full statistics; “Back to the story” returns', await p.evaluate(() => ISX.profit.state.view === 'orb' && !!document.querySelector('.orr-back')));
    await p._c.close();
  }

  /* E · reduced motion: a still; F · motion at rest, the loop registry and “Pause motion” */
  {
    const pos = p => p.evaluate(() => { const o = ISX.profit.orrery.cur, g = iso => o.list.find(q => q.iso === iso).g.getAttribute('transform'); return { rus: g('RUS'), tza: g('TZA'), jpn: g('JPN'), deu: g('DEU'), run: o.wrap.classList.contains('run'), split: o.wrap.classList.contains('split'), pm: (() => { const b = document.querySelector('.orr-pm'); return b ? [b.hidden, b.textContent] : null; })(), pulses: [...document.querySelectorAll('.orr-svg .pls')].filter(x => getComputedStyle(x).display !== 'none' && getComputedStyle(x).animationPlayState === 'running').length }; });
    let p = await open(1440, 900, false, '2025', true); const a = await pos(p); await p.waitForTimeout(1500); const c = await pos(p);
    ok('E · reduced motion, 2025 (split): nothing moves, no pulse, no “Pause motion” button', a.split && !a.run && a.rus === c.rus && a.tza === c.tza && c.pulses === 0 && a.pm[0] === true, [a, c]);
    await p._c.close();
    p = await open(1440, 900, false, '2019'); await p.evaluate(() => document.querySelector('.orr-fb.l-earn').click()); await p.waitForTimeout(400); const b0 = await pos(p); await p.waitForTimeout(1200); const b1 = await pos(p);   /* OR9: 2019 tells no flow; the visitor picks “Earnings in” and the lines (and their pulses) are drawn */
    ok('F · before the split (2019) no body moves; with “Earnings in” picked the pulses run along the flow lines and “Pause motion” is there (OR9: lines are drawn when the story or the visitor names them)', !b0.split && b0.run && b0.rus === b1.rus && b0.jpn === b1.jpn && b0.pm[0] === false && /Pause motion/.test(b0.pm[1]) && b0.pulses >= 3 && b0.pulses <= 5, [b0, b1]);   /* OR8: pulses run on the named lines only (five; three on phones), for the frame time */
    await year(p, 2025); await p.waitForTimeout(400); const m0 = await pos(p); await p.waitForTimeout(2500); const m1 = await pos(p);
    ok('F · after the split: the loop “orrery” is registered and running', (await p.evaluate(() => ISXP.loops())).includes('orrery') && m0.run && m0.split, m0);
    ok('F · China’s system turns (Russia and Tanzania move); the US system stands still (Japan, Germany)', m0.rus !== m1.rus && m0.tza !== m1.tza && m0.jpn === m1.jpn && m0.deu === m1.deu, [m0, m1]);
    const mv = (s0, s1) => { const f = s => s.match(/-?[\d.]+/g).map(Number), x = f(s0), y = f(s1); return Math.hypot(x[0] - y[0], x[1] - y[1]); };
    ok('F · slowly: one turn in six minutes (Russia moves a few px in 2.5 s)', mv(m0.rus, m1.rus) > 2 && mv(m0.rus, m1.rus) < 20, mv(m0.rus, m1.rus));
    ok('F · pulses run along the named flow lines (2025, “Earnings in” picked; OR8: five, three on phones)', m1.pulses >= 3 && m1.pulses <= 5, m1.pulses);
    ok('F · “Pause motion” is visible while something moves', m1.pm[0] === false && /Pause motion/.test(m1.pm[1]), m1.pm);
    ok('F · names still do not overlap while it turns', overlaps(await names(p)).length === 0, overlaps(await names(p)).slice(0, 5));
    await p.click('.orr-pm'); await p.waitForTimeout(300); const z0 = await pos(p); await p.waitForTimeout(1500); const z1 = await pos(p);
    ok('F · “Pause motion” stops it: no run, positions fixed, pulses frozen; the button offers “Resume motion”', !z0.run && z0.rus === z1.rus && z1.pulses === 0 && /Resume motion/.test(z1.pm[1]), [z0, z1]);
    await p.click('.orr-pm'); await p.waitForTimeout(1500); const z2 = await pos(p);
    ok('F · “Resume motion” starts it again', z2.run && z2.rus !== z1.rus, z2);
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(300); const h0 = await pos(p); await p.waitForTimeout(1000); const h1 = await pos(p);
    ok('F · motion stops when the browser tab is hidden', !h0.run && h0.rus === h1.rus, [h0, h1]);
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(600);
    ok('F · and starts again when it is shown', (await pos(p)).run);
    await p.click('#isx-v-map'); await p.waitForTimeout(600);
    ok('F · motion stops when another tab of the page is opened', await p.evaluate(() => !document.querySelector('.orr.run')));
    await p._c.close();
  }

  /* G · a body's card: memberships as of the year, from the official lists */
  {
    const p = await open(1440, 900, false, '2026');
    const card = (lab, y) => p.evaluate(([lab, y]) => { const i = document.querySelector('.orr-sl input'); i.value = y; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); const g = document.querySelector('.orr-svg .ob[aria-label="' + lab + '"]'); g.dispatchEvent(new MouseEvent('click', { bubbles: true })); return [...document.querySelectorAll('.orr-info .rw')].map(r => r.textContent); }, [lab, y]);
    const c26 = (await card('China', 2026)).find(t => /^Member of/.test(t)), c00 = (await card('China', 2000)).find(t => /^Member of/.test(t));
    ok('G · China, 2026: SCO 2001, BRICS 2009, NDB 3 Jul 2015, AIIB 25 Dec 2015, WAICO founder', c26 === 'Member of, 2026SCO (since 2001) · BRICS (since the first summit, 2009) · NDB (founding member; agreement in force 3 Jul 2015) · AIIB (since 25 Dec 2015; operations began in 2016) · WAICO (founder, 16 Jul 2026)', c26);
    const co = (await card('China', 2026)).find(t => /^In the old order/.test(t)), co0 = (await card('China', 2000)).find(t => /^In the old order/.test(t));
    ok('G · China’s card agrees with the frame: IMF and World Bank seat since 1980, WTO since 2001 (not yet in 2000)', co === 'In the old order, 2026IMF and World Bank seat (since 1980) · ADB (since 1986) · WTO (since 2001)' && co0 === 'In the old order, 2000IMF and World Bank seat (since 1980) · ADB (since 1986)', [co, co0]);
    ok('G · China, 2000: only what it had joined by then', c00 === 'Member of, 2000none of SCO, BRICS, NDB, AIIB or WAICO yet', c00);
    const il = (await card('Israel', 2026)), de = (await card('Germany', 2026)).find(t => /^Member of/.test(t)), id = (await card('Indonesia', 2026)).find(t => /^Member of/.test(t));
    ok('G · Israel: AIIB since 15 Jan 2016; ADB “not collected”; IMF, World Bank and WTO “not collected”', il.some(t => t === 'Member of, 2026AIIB (since 15 Jan 2016) · ADB: not collected') && il.some(t => t === 'IMF, World Bank and WTO membershipnot collected'), il);
    ok('G · Germany in both: ADB since 1966 and AIIB since 25 Dec 2015; Indonesia: BRICS since January 2025, NDB prospective', de === 'Member of, 2026ADB (since 1966) · AIIB (since 25 Dec 2015; operations began in 2016)' && /BRICS \(since January 2025\) · WAICO \(founder, 16 Jul 2026\) · NDB: prospective member$/.test(id), [de, id]);
    await p._c.close();
  }

  /* H · a phone: the steps under the picture, names apart, the strip readable */
  {
    const p = await open(390, 844, true, 'profit-and-production');
    /* OR8: the card is the narrator's sheet under the picture; the rim carries the order's name; the chapters are reached by “Back” and “Next” (the ten chips need a wider stage) */
    const r = await p.evaluate(() => ({ inCard: document.querySelectorAll('.orr-nar .orr-ch').length, inStage: document.querySelectorAll('.orr-stage > .orr-pp .orr-ch').length, w: [...document.querySelectorAll('.orr-nar .orr-ch svg')].map(s => Math.round(s.getBoundingClientRect().width)), rim: [...document.querySelectorAll('.orr-rimg .orr-rimt')].filter(t => getComputedStyle(t).display !== 'none').map(t => t.textContent).join(' | '),   /* OR8: the words that show (upright, the order's name runs along the rim's foot) */ stp: [...document.querySelectorAll('.orr-chs .orr-nx')].filter(b => !b.hidden).map(b => Math.round(b.getBoundingClientRect().height)), sx: document.documentElement.scrollWidth - innerWidth }));
    ok('H · phone, step 1: the two charts stand under the picture, in the card, at full width', r.inCard === 2 && r.inStage === 0 && r.w.every(w => w > 260), r);
    const pl = await p.evaluate(() => [...document.querySelectorAll('.orr-svg .orr-fl')].filter(t => getComputedStyle(t).display !== 'none').map(t => t.textContent));   /* OR8: names that show (the stage keeps hidden words, such as the curtain's, for later chapters) */
    ok('H · phone, step 1: the picture carries the two end figures by their bodies', pl.join(' | ') === 'US firms: 42.2% of the profits | of the world’s 2,000 largest listed firms · 2026 list | China: 27.4% of the world’s | manufacturing value added · 2025' && overlaps(await names(p)).length === 0, [pl, overlaps(await names(p))]);
    ok('H · phone: the rim carries the order’s name; “Back” and “Next” are at least 40 px high; no sideways scroll', /THE WTO ORDER, 1995–/.test(r.rim) && r.stp.length === 2 && r.stp.every(h => h >= 40) && r.sx <= 0, r);
    await p.evaluate(() => document.querySelector('.orr-chs .orr-nx.fw').click()); await p.waitForTimeout(2600);
    const o = overlaps(await names(p)), l = await p.evaluate(() => [...document.querySelectorAll('.orr-svg .orr-fl')].filter(t => getComputedStyle(t).display !== 'none').map(t => { const b = t.getBoundingClientRect(), s = document.querySelector('.orr-svg').getBoundingClientRect(); return [t.textContent, b.left >= s.left - 1 && b.right <= s.right + 1]; }));
    ok('H · phone, step 2: every line’s name is inside the picture and no two overlap', o.length === 0 && l.length >= 10 && l.every(x => x[1]), [o, l]);
    await year(p, 2026); const k = await p.evaluate(() => [...document.querySelectorAll('#isx-orr-key-in .olg')].map(e => e.textContent.trim()).find(t => /China’s own institutions/.test(t)));
    ok('H · phone: the arcs are named in the key (inner to outer)', /SCO 2001 · Swap lines 2008 · BRICS 2009 · Belt and Road 2013 · NDB 2014 · CIPS 2015 · AIIB 2016 · WAICO 2026/.test(k || ''), k);
    await p._c.close();
  }
  { /* a phone held sideways: the picture is short, so the asterisk line stands in the card and nothing lies over the lines' names */
    const p = await open(844, 390, true, 'clearing');
    const r = await p.evaluate(() => ({ fn: [...document.querySelectorAll('.orr-stage .orr-fn')].some(e => e.offsetParent !== null), card: (document.querySelector('.orr-nar p.ast') || {}).textContent || '' }));
    ok('H · sideways, step 2: the asterisk line is in the card, not over the picture', !r.fn && /^\* No pair of countries settles alone/.test(r.card), r);
    const o = overlaps(await names(p)); ok('H · sideways, step 2: no two names on the picture overlap', o.length === 0, o);
    await p._c.close();
  }
  ok('no page or console errors', errs.length === 0, errs.slice(0, 5));
  await b.close();
  console.log('\n' + (n - fails) + ' of ' + n + ' passed' + (fails ? ', ' + fails + ' FAILED' : ''));
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('ERROR', e); process.exit(1); });
