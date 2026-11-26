/* Check of round OR8 (26 Nov 2026): the order's stage (v2/stage8.js, stage8.css; handoff claude/handoffs/orrery-stage-or8-26-nov.md §7).
   The stage fills the screen between the header and the bar and needs no scroll; nothing of it lies under the bar; the ten chapters in order, by
   address, by keys and by the strip; titles follow the chapter; the narration, the chapter strip, the timeline and the key are in the stage, and in
   full screen; the flow layers draw only what the data round's file has for that year, every line has a name, and no surplus line ends at the
   United States; the figures on screen are the file's; reduced motion shows a still and cuts; “Pause motion” stops everything that moves.
   Usage: NODE_PATH=/opt/npm-tools/node_modules node tools/orrery-or8-check.js [baseUrl]   (python3 -m http.server 8731 at the repo root)
   Run it with orrery-or7-check, orrery-mobile-check, profit-check and arc-check when v2/orrery.js, stage8.js, their css or data/orrery.json change. */
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8731/imperial-stack/';
let fails = 0, n = 0;
const ok = (name, cond, extra) => { n++; if (!cond) fails++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 900) : '')); };
const TITLES = ['1995 · The WTO order', 'Why profit flows to the centre', '2001 · China joins on the assembly ring', '2008 · The dollar is sent out', '2013–2016 · China builds its own institutions', '2017–2024 · The squeeze', '2025 · Two poles', '2026 · WAICO, and the order as it stands', 'Profit gathers at the centre; production moves to China', 'China finances the system it competes with'];
const FIRST = [1995, 1996, 2001, 2008, 2013, 2017, 2025, 2026];
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
    await p.evaluate(() => { ISX.orrOpened = true; const k = document.querySelector('.orr-skip'); if (k) k.click(); }); await p.waitForTimeout(900);
    return p;
  };
  const year = (p, y) => p.evaluate(y => { const i = document.querySelector('.orr-sl input'); i.value = y; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); }, y).then(() => p.waitForTimeout(450));
  const data = p => p.evaluate(() => fetch('data/orrery.json').then(r => r.json()));
  const S = p => p.evaluate(() => { const o = ISX.profit.orrery.cur; return { ch: o.SG.idx(), yr: Math.round(o.st.yf), step: o.st.step || '', layer: o.st.layer, k: +o.view.k.toFixed(3), title: document.getElementById('isx-pf-title').textContent, nt: (document.querySelector('.orr-nar .nt') || {}).textContent, kick: document.querySelector('.orr-chs .nk').textContent, cur: [...document.querySelectorAll('.orr-chp[aria-current]')].map(b => +b.dataset.ch), hash: location.hash }; });
  /* the lines of the flow layer that are drawn, with where they start and end (in the picture's own coordinates) */
  /* each line says where it starts and ends (data-from, data-to); the check measures that its two ends are really there */
  const lines = p => p.evaluate(() => { const o = ISX.profit.orrery.cur, P = o.st.pool, at = (pt, k) => { if (k === 'pool') return !!P && Math.hypot(pt.x - P[0], pt.y - P[1]) < 18; const q = o.list.find(x => x.iso === k); return !!q && Math.hypot(pt.x - q.p[0], pt.y - q.p[1]) < q.r + 12; };
    return [...document.querySelectorAll('.orr-svg .orr-fx path.fl:not(.why)')].filter(e => getComputedStyle(e).display !== 'none' && e.getAttribute('d')).map(e => { const l = e.getTotalLength(), a = e.getPointAtLength(0), z = e.getPointAtLength(l), f = e.dataset.from, t = e.dataset.to;
      return { cls: e.getAttribute('class').replace('fl ', ''), from: at(a, f) ? (f === 'pool' ? 'POOL' : f) : '?' + f, to: at(z, t) ? (t === 'pool' ? 'POOL' : t) : '?' + t, dash: getComputedStyle(e).strokeDasharray !== 'none', w: +e.getAttribute('stroke-width') }; }); });
  const labels = p => p.evaluate(() => { const o = ISX.profit.orrery.cur, vis = t => !t.classList.contains('off') && getComputedStyle(t).visibility !== 'hidden' && getComputedStyle(t).display !== 'none'; const m = {}; o.list.forEach(q => { if (q.tx && vis(q.tx)) m[q.iso || q.id] = q.tx.textContent; }); return { bodies: m, free: [...document.querySelectorAll('.orr-svg .orr-fl')].filter(vis).map(t => t.textContent), cap: document.querySelector('.orr-fcap').textContent, note: (() => { const f = document.querySelector('.orr-stage > .orr-fn'); return f && !f.hidden ? f.textContent : ''; })() }; });
  const layer = (p, k) => p.evaluate(k => document.querySelector('.orr-fb.l-' + k).click(), k).then(() => p.waitForTimeout(350));
  const bnI = v => '$' + Math.round(Math.abs(v)).toLocaleString('en-US') + 'bn';

  /* A · the stage is the page: one screen, nothing under the bar, everything inside it */
  for (const [w, h, touch, name] of [[1440, 900, false, '1440 × 900'], [1024, 768, false, '1024 × 768'], [844, 390, true, '844 × 390 (a phone held sideways)']]) {
    const p = await open(w, h, touch, '');
    if (h < 560) { await p.evaluate(() => document.querySelector('.orr-stage').scrollIntoView()); await p.waitForTimeout(300); }
    const r = await p.evaluate(() => { const st = document.querySelector('.orr-stage').getBoundingClientRect(), bar = document.getElementById('isx-tabs').getBoundingClientRect(), o = ISX.profit.orrery.cur, B = o.box();
      const parts = ['.orr-hud', '.orr-rc', '.orr-nar', '.orr-chs .orr-nx.fw', '.orr-sl', '.orr-play', '.orr-deep', '.orr-kyb', '.orr-fsb', '#isx-pf-table'].map(s => { const e = document.querySelector('.orr-stage ' + s) || document.querySelector(s); if (!e) return [s, 'missing']; const q = e.getBoundingClientRect(); return [s, q.width > 0 && q.height > 0 && q.top >= st.top - 1 && q.bottom <= st.bottom + 1 && q.left >= st.left - 1 && q.right <= st.right + 1 && q.bottom <= bar.top + 1 && q.bottom <= innerHeight]; });
      const dock = document.querySelector('.orr-dock').getBoundingClientRect(), inner = [...document.querySelectorAll('.orr-nar .nz, .orr-chs')].map(e => e.scrollWidth - e.clientWidth);
      return { top: Math.round(st.top), bottom: Math.round(st.bottom), bar: Math.round(bar.top), vh: innerHeight, sy: Math.round(scrollY), parts, stg: document.getElementById('isx-pf').classList.contains('stg'), sx: document.documentElement.scrollWidth - innerWidth, under: ['.pf-chips', '.pf-bhead', '.pf-foot', '.pf-jump'].map(s => { const e = document.querySelector('#isx-pf ' + s); return e ? e.offsetParent !== null : false; }), boxAboveDock: B.oy + B.hl <= dock.top - st.top + 1, box: B, textTop: Math.round(document.querySelector('.pf-text').getBoundingClientRect().top), inner }; });
    ok('A · ' + name + ': the stage ends where the bar begins and fits the window (no scroll to see all of it)', r.stg && r.top >= -1 && r.bottom <= r.bar + 1 && r.bottom <= r.vh && (h < 560 || r.sy === 0), r);
    ok('A · ' + name + ': the HUD, the controls, the narrator, the chapter strip, the timeline, “View as table” and the door are inside the stage, none under the bar', r.parts.every(x => x[1] === true), r.parts);
    ok('A · ' + name + ': the picture’s box ends above the dock; the page’s own head, chips and foot have stepped aside; the explanation starts under the stage; no sideways scroll', r.boxAboveDock && r.under.every(v => v === false) && r.textTop >= r.bottom - 2 && r.sx <= 0, r);
    await p._c.close();
  }

  /* B · the chapters: in order, by the strip, by address, by keys; titles follow the chapter; one scheme of counting */
  {
    const p = await open(1440, 900, false, '');
    const chips = await p.evaluate(() => [...document.querySelectorAll('.orr-chs .orr-chp')].map(b => [b.textContent, b.getAttribute('aria-label'), b.dataset.step || '']));
    ok('B · ten chapters on the strip, numbered 1 to 10; 9 and 10 are the two steps', chips.length === 10 && chips.every((c, i) => c[0].startsWith(String(i + 1)) && c[1].startsWith('Chapter ' + (i + 1) + ' of 10: ')) && chips[8][2] === 'pp' && chips[9][2] === 'cl', chips);
    const seen = [];
    for (let i = 0; i < 10; i++) { await p.click('.orr-chp[data-ch="' + i + '"]'); await p.waitForTimeout(i > 7 ? 900 : 1500); seen.push(await S(p)); }
    ok('B · each chapter, from the strip: its first year, its title in the narrator and as the view’s title, “Chapter n of 10”', seen.every((s, i) => s.ch === i && s.cur.join() === String(i) && (i > 7 || s.yr === FIRST[i]) && s.title === TITLES[i] && s.nt.replace(/\.$/, '') === TITLES[i] && s.kick === 'Chapter ' + (i + 1) + ' of 10' + (i > 7 ? ' · after the story' : '')), seen.map(s => [s.ch, s.yr, s.title, s.kick]));
    ok('B · the steps keep their addresses: #profit/order/profit-and-production and #profit/order/clearing', seen[8].hash === '#profit/order/profit-and-production' && seen[9].hash === '#profit/order/clearing' && seen[3].hash === '#profit/order/2008', [seen[8].hash, seen[9].hash, seen[3].hash]);
    /* by year: every year belongs to one chapter (the chapter is a function of the year) */
    await p.click('.orr-chp[data-ch="0"]'); await p.waitForTimeout(1300); const by = [];
    for (const y of [1995, 1996, 2000, 2001, 2007, 2008, 2012, 2013, 2016, 2017, 2019, 2024, 2025, 2026]) { await year(p, y); const s = await S(p); by.push([y, s.ch, s.title]); }
    const want = { 1995: 0, 1996: 1, 2000: 1, 2001: 2, 2007: 2, 2008: 3, 2012: 3, 2013: 4, 2016: 4, 2017: 5, 2019: 5, 2024: 5, 2025: 6, 2026: 7 };
    ok('B · the chapter follows the year under the slider, and the title with it (2019 reads “The squeeze”, not “One system”)', by.every(x => x[1] === want[x[0]] && x[2] === TITLES[x[1]]), by);
    /* the keys: left and right on the dock move one chapter; the forward button says where it goes */
    await p.click('.orr-chp[data-ch="2"]'); await p.waitForTimeout(1500); await p.focus('.orr-chp[data-ch="2"]'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(1500); const k1 = await S(p);
    await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(400); await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(1500); const k2 = await S(p);
    const nav = await p.evaluate(() => [...document.querySelectorAll('.orr-chs .orr-nx')].map(b => [b.textContent, b.hidden]));
    ok('B · keys: → goes to the next chapter, ← ← two back; “Back” and “Next” name the chapters they go to', k1.ch === 3 && k2.ch === 1 && nav[0][0] === '← Back: The WTO order' && nav[1][0] === 'Next: 2001 · China joins on the assembly ring →', [k1.ch, k2.ch, nav]);
    await p.click('.orr-chs .orr-nx.fw'); await p.waitForTimeout(1500); const n1 = await S(p);
    await p.click('.orr-chp[data-ch="0"]'); await p.waitForTimeout(1500); const bkHidden = await p.evaluate(() => document.querySelector('.orr-chs .orr-nx.bk').hidden);
    ok('B · “Next” goes one chapter on; the first chapter has no “Back”', n1.ch === 2 && bkHidden === true, [n1.ch, bkHidden]);
    /* one way forward: the bar's own next is named for what it is */
    const bar = await p.evaluate(() => { const b = document.querySelector('#isx-tabs .rt-nx'); return [b.querySelector('small').textContent, b.querySelector('b').textContent, getComputedStyle(b).backgroundImage]; });
    ok('B · one way forward: the stage’s “Next” is the lit one; the bar’s reads “Next station · Profits” and is quiet', /Next station/i.test(bar[0]) && /Profits/i.test(bar[1]) && bar[2] === 'none', bar);
    const txt = await p.evaluate(() => document.querySelector('.orr-stage').textContent);
    ok('B · one scheme of counting on the stage: “Chapter n of 10”; no “1 of 8”, “All four cards” or “Step 1 of 2”', /Chapter 1 of 10/.test(txt) && !/1 of 8|All four cards|Step 1 of 2|Step 2 of 2/.test(txt), txt.slice(0, 200));
    await p._c.close();
    for (const [hash, ch] of [['2008', 3], ['2019', 5], ['profit-and-production', 8], ['clearing', 9]]) { const q = await open(1440, 900, false, hash), s = await S(q); ok('B · by address: #profit/order/' + hash + ' opens chapter ' + (ch + 1), s.ch === ch && s.title === TITLES[ch], s); await q._c.close(); }
  }

  /* C · the narration: in the stage, sentence by sentence from the file; Pax Silica said once, plainly; the estimate is a note, not a button */
  {
    const p = await open(1440, 900, false, ''), D = await data(p), F = D.flows, yi = y => y - 1995;
    const nar = async i => { await p.click('.orr-chp[data-ch="' + i + '"]'); await p.waitForTimeout(1500); return p.evaluate(() => ({ t: document.querySelector('.orr-nar .nz').textContent, e: document.querySelector('.orr-nar .ne').textContent, i: document.querySelector('.orr-nar .ni').textContent })); };
    const n1 = await nar(0), n2 = await nar(1), n3 = await nar(2), n4 = await nar(3), n5 = await nar(4), n6 = await nar(5), n7 = await nar(6), n8 = await nar(7);
    ok('C · chapter 1 names the order’s institutions with their years, as the file has them', D.order.old.every(x => n1.t.includes(String(x[1]))) && /IMF and the World Bank \(1944\), the GATT \(1948\), the Asian Development Bank \(1966\) and, from 1995, the WTO/.test(n1.t) && /world-systems idea/.test(n1.t) && /since 1980/.test(n1.i), n1);
    ok('C · chapter 2 says why profit flows to the centre: the rings as places in the chain; finance dominant, production determinant; the measured lines and the starred arrow', /Each ring is a place in that chain/.test(n2.t) && /finance is dominant, production is determinant/.test(n2.t) && /\(BEA\)/.test(n2.t) && /illustrative\*/.test(n2.t), n2.t);
    const c01 = F.pool.bal.CHN[yi(2001)], c07 = F.pool.bal.CHN[yi(2007)], e01 = F.cn.exp[yi(2001)].toFixed(1), e07 = F.cn.exp[yi(2007)].toFixed(1);
    ok('C · chapter 3: China’s surplus ' + bnI(c01) + ' (2001) to ' + bnI(c07) + ' (2007) and its export share ' + e01 + '% to ' + e07 + '%, from the file; the surplus goes into one pool, not to the United States', n3.t.includes('from ' + bnI(c01) + ' in 2001 to ' + bnI(c07) + ' in 2007 (IMF)') && n3.t.includes('from ' + e01 + '% to ' + e07 + '% (World Bank)') && bnI(c01) === '$17bn' && bnI(c07) === '$353bn' && e01 === '4.3' && e07 === '8.6' && /does not go to the United States directly/.test(n3.t) && /surpluses meet deficits in one pool/.test(n3.t) && /11 December 2001/.test(n3.t), n3.t);
    ok('C · chapter 4: $583.1bn of swap lines on 17 December 2008 and $3,077bn of Treasuries held abroad at the end of 2008, from the file; custody said', F.swap.peak['2008'][0] === 583.1 && F.swap.peak['2008'][1] === '17 Dec 2008' && n4.t.includes('$583.1bn is outstanding on 17 December 2008 (Fed, H.4.1)') && n4.t.includes(bnI(F.tic.world[yi(2008)]) + ' of US Treasuries') && bnI(F.tic.world[yi(2008)]) === '$3,077bn' && /by country of custody/.test(n4.t) && /15 September 2008/.test(n4.t), n4.t);
    ok('C · chapter 5 names China’s institutions at the years of the file; chapter 6 the squeeze’s events at theirs', D.order.own.filter(a => a.arc && a.year < 2020).every(a => n5.t.includes('(' + a.year + ')')) && /does not leave the old order/.test(n5.t) && /In 2017/.test(n6.t) && /December 2019/.test(n6.t) && /In 2022/.test(n6.t), [n5.t, n6.t]);
    ok('C · chapter 7 explains Pax Silica once, in plain words, with its date', /12 December 2025, Pax Silica: the silicon curtain/.test(n7.t) && /Pax Silica is the US-led coalition on AI and semiconductor supply chains/.test(n7.t) && /April 2025/.test(n7.t) && D.order.lists.paxDate === '12 Dec 2025', n7.t);
    const top = Object.entries(F.h1.out).sort((a, b) => b[1][1] - a[1][1])[0];
    ok('C · chapter 8: WAICO on 16 July 2026; the first half of 2026 from BEA (the largest: ' + top[0] + ', $' + (top[1][1] / 1000).toFixed(1) + 'bn), said as a half-year', /16 July 2026/.test(n8.t) && n8.t.includes('in the first half of 2026 US firms’ affiliates earned $' + (top[1][1] / 1000).toFixed(1) + 'bn in Ireland alone (BEA)') && top[0] === 'IRL' && /the State Department’s list, read on 21 Nov 2026, names 24 states and the European Union beside the United States, 26 parties in all/.test(n8.t), n8.t);   /* the State list as read on 21 Nov 2026 (OR2-C-pax-silica.csv): 25 names, the EU among them */
    const est = await p.evaluate(() => { const e = document.querySelector('.orr-hud em.est'); if (!e) return null; const cs = getComputedStyle(e); return [e.textContent, cs.borderTopWidth, cs.backgroundColor, cs.cursor, e.closest('button') === null]; });
    ok('C · 2026: “IMF estimate” is a dated note under its figure: no border, no fill, not a button', est && /2026: IMF estimate/.test(est[0]) && est[1] === '0px' && /rgba\(0, 0, 0, 0\)/.test(est[2]) && est[3] !== 'pointer' && est[4], est);
    await p._c.close();
  }

  /* D · the flows through the years: only what the file has; every line named; no surplus line into the United States */
  {
    const p = await open(1440, 900, false, ''), D = await data(p), F = D.flows, yi = y => y - 1995, node = iso => iso;
    /* the paper out */
    await layer(p, 'paper'); const bad = [], seenYears = [];
    for (const y of [1995, 1999, 2000, 2008, 2013, 2020, 2025, 2026]) {
      await year(p, y); const L = await lines(p), T = await labels(p), pap = L.filter(l => l.cls === 'pap'), swp = L.filter(l => l.cls === 'swp'); seenYears.push([y, pap.length, swp.length]);
      const rows = Object.entries(F.tic.hold).map(([iso, a]) => [iso, a[yi(y)]]).filter(x => x[1] != null).sort((a, b) => b[1] - a[1]), top = rows.slice(0, 5);
      if (y < 2000) { if (pap.length || !/No country figures exist before 2000/.test(T.cap)) bad.push([y, 'a paper line before 2000', pap.length, T.cap]); continue; }
      if (pap.length !== top.length || pap.some(l => l.from !== 'USA' || l.dash) || top.some(([iso]) => !pap.some(l => l.to === iso))) bad.push([y, 'lines', pap, top]);
      top.forEach(([iso, v]) => { if (!(T.bodies[iso] || '').includes(' · ' + bnI(v))) bad.push([y, 'name', iso, T.bodies[iso], bnI(v)]); });
      if (!T.cap.includes('All holders ' + bnI(F.tic.world[yi(y)])) || !/by country of custody, not ownership \(Treasury TIC\)/.test(T.cap) || !T.cap.includes(y === 2026 ? 'in September 2026' : 'at the end of ' + y)) bad.push([y, 'caption', T.cap]);
      const drew = (F.swap.drew[String(y)] || []).slice(0, 3), pk = F.swap.peak[String(y)];
      if (swp.length !== drew.length || swp.some(l => l.from !== 'USA' || !l.dash) || drew.some(iso => !swp.some(l => l.to === iso) || !/ · swap line$/.test(T.bodies[iso] || ''))) bad.push([y, 'swap', swp, drew, T.bodies]);
      if (pk && pk[0] >= 1 && !T.cap.includes('$' + pk[0].toFixed(1) + 'bn, ' + pk[1])) bad.push([y, 'swap caption', T.cap]);
    }
    ok('D · paper out: no line before 2000; from 2000 a solid line from the United States to each of the five largest holders on the picture, named with the file’s figure; the caption has the total, the date and “custody, not ownership”; dashed swap lines only to the (up to three) central banks on the picture that drew most that year', bad.length === 0, bad.slice(0, 4));
    ok('D · paper out: 2008 has swap lines (peak $583.1bn, 17 Dec 2008) and 2013 none worth a line beyond those that drew', seenYears.find(x => x[0] === 2008)[2] === 3 && seenYears.find(x => x[0] === 1995)[1] === 0 && seenYears.find(x => x[0] === 2026)[1] === 5, seenYears);
    /* clearing */
    await layer(p, 'clear'); const badC = [];
    for (const y of [1995, 1996, 1997, 2001, 2008, 2018, 2025, 2026]) {
      await year(p, y); const L = await lines(p), T = await labels(p), sur = L.filter(l => l.cls === 'sur'), def = L.filter(l => l.cls === 'def');
      if (y === 2026) { if (L.length || !/2026 figures are projections and are not shown/.test(T.cap)) badC.push([y, 'a line in 2026', L, T.cap]); continue; }
      const want = ['CHN', 'DEU', 'JPN'].filter(iso => F.pool.bal[iso][yi(y)] != null && F.pool.bal[iso][yi(y)] > 0);
      if (sur.length !== want.length || sur.some(l => l.to !== 'POOL' || l.dash) || want.some(iso => !sur.some(l => l.from === iso))) badC.push([y, 'surplus lines', sur, want]);
      if (L.some(l => l.cls === 'sur' && l.to === 'USA') || L.filter(l => l.to === 'USA').some(l => l.from !== 'POOL' || l.cls !== 'def')) badC.push([y, 'a surplus line into the United States', L]);
      if (def.length !== 1 || def[0].from !== 'POOL' || def[0].to !== 'USA') badC.push([y, 'deficit line', def]);
      want.forEach(iso => { if (!(T.bodies[iso] || '').includes(' · surplus ' + bnI(F.pool.bal[iso][yi(y)]))) badC.push([y, 'name', iso, T.bodies[iso]]); });
      if (!(T.bodies.USA || '').includes(' · deficit ' + bnI(F.pool.bal.USA[yi(y)])) || !T.free.includes('Multilateral clearing*') || !T.free.includes('all surpluses ' + bnI(F.pool.pos[yi(y)]) + ' · all deficits ' + bnI(F.pool.neg[yi(y)]))) badC.push([y, 'US or pool name', T.bodies.USA, T.free]);
      if (!/^\* No pair of countries settles alone: surpluses meet deficits in one pool, and the pool buys dollar assets\.$/.test(T.note)) badC.push([y, 'footnote', T.note]);
      if (!T.cap.includes(y + ', ' + F.pool.n[yi(y)] + ' economies (IMF)') || (F.pool.bal.CHN[yi(y)] == null && !T.cap.includes('China: no IMF figure for ' + y))) badC.push([y, 'caption', T.cap]);
    }
    ok('D · clearing: surpluses (China, Germany, Japan, where the IMF has a positive figure that year) run into the pool; one line runs from the pool into the United States; no surplus line ends at the United States; nothing in 2026; China has no line in 1995–96; every line named with the file’s figure; the asterisk line stands under the picture', badC.length === 0, badC.slice(0, 4));
    await year(p, 2025); const c25 = await labels(p);
    ok('D · clearing, 2025: China · surplus $724bn, US · deficit $1,177bn (the IMF’s figures of step 2)', /China · surplus \$724bn/.test(c25.bodies.CHN) && /US · deficit \$1,177bn/.test(c25.bodies.USA) && /goods exports: 14\.3%; of its manufacturing: 27\.4% \(World Bank\)/.test(c25.cap), [c25.bodies.CHN, c25.bodies.USA, c25.cap]);
    await year(p, 2003); const c03 = await labels(p);
    ok('D · China’s share of world manufacturing: “not collected before 2004” (no figure is drawn or estimated for 1995–2003)', /of its manufacturing: not collected before 2004/.test(c03.cap), c03.cap);
    /* earnings in */
    await layer(p, 'earn'); await year(p, 2010); const e10 = await labels(p), st10 = await p.evaluate(() => [...document.querySelectorAll('.orr-svg .orr-streams .st')].filter(e => e.style.opacity !== '0').length);
    await year(p, 2026); const e26 = await labels(p), st26 = await p.evaluate(() => { const o = ISX.profit.orrery.cur; return o.list.filter(q => q.st && q.st.style.opacity !== '0').map(q => q.iso); });
    const h1 = Object.keys(F.h1.out), top26 = Object.entries(F.h1.out).sort((a, b) => b[1][1] - a[1][1]).slice(0, 5);
    ok('D · earnings in: the grey lines run in every year (2010: ' + st10 + ' lines) and the five largest carry their figure when the visitor asks for the flows', st10 > 30 && Object.values(e10.bodies).filter(t => / · \$[\d.]+bn$/.test(t)).length === 5 && /in each economy in 2010 \(BEA\)/.test(e10.cap) && /Streams into China: not collected/.test(e10.cap), [st10, e10.cap]);
    ok('D · earnings in, 2026: only economies BEA has for the first half of 2026 are drawn; the caption says six months, not a year; the five largest carry the half-year’s figure', st26.length > 20 && st26.every(iso => h1.includes(iso)) && /first half of 2026: six months, there is no full 2026 yet \(BEA, 24 Sep 2026\)/.test(e26.cap) && top26.every(([iso, v]) => (e26.bodies[iso] || '').endsWith(' · $' + (v[1] / 1000).toFixed(1) + 'bn')), [st26.length, e26.cap, top26.map(x => e26.bodies[x[0]])]);
    /* the visitor's choice of flows stays while the years are scrubbed; a chapter chosen sets its own */
    await layer(p, 'paper'); await year(p, 2003); const pin1 = (await S(p)).layer; await year(p, 2015); const pin2 = (await S(p)).layer;
    await p.click('.orr-chp[data-ch="2"]'); await p.waitForTimeout(1500); const pin3 = (await S(p)).layer;
    const radio = await p.evaluate(() => [...document.querySelectorAll('.orr-fsel [role="radio"]')].map(b => [b.textContent, b.getAttribute('aria-checked')]));
    ok('D · “Flows”: three choices, one at a time; a choice stays while the years are scrubbed; a chapter sets its own (chapter 3: Clearing)', pin1 === 'paper' && pin2 === 'paper' && pin3 === 'clear' && radio.length === 3 && radio.filter(r => r[1] === 'true').length === 1 && radio.find(r => r[1] === 'true')[0] === 'Clearing', [pin1, pin2, pin3, radio]);
    /* chapter 2's illustrative arrow */
    await p.click('.orr-chp[data-ch="1"]'); await p.waitForTimeout(1600); const w = await p.evaluate(() => { const e = document.querySelector('.orr-svg .orr-fx .fl.why'), cs = getComputedStyle(e); return { on: cs.display !== 'none', dash: cs.strokeDasharray !== 'none', lab: [...document.querySelectorAll('.orr-svg .orr-fl.ill')].filter(t => getComputedStyle(t).display !== 'none').map(t => t.textContent), note: document.querySelector('.orr-stage > .orr-fn').textContent }; });
    ok('D · chapter 2: one illustrative arrow, dashed and starred, with its line under the picture (“it carries no figure”)', w.on && w.dash && w.lab.join() === 'Made on the outer rings,claimed at the core*' && /^\* Illustrative: the direction in which profit is claimed, ring by ring\. It carries no figure/.test(w.note), w);
    await p._c.close();
  }

  /* E · the film: Play runs the chapters; a title card passes; the camera glides and comes back; Pause holds */
  {
    const p = await open(1440, 900, false, '');
    await p.click('.orr-play'); await p.waitForTimeout(700); const f0 = await p.evaluate(() => ({ play: document.querySelector('.orr-play').textContent, pressed: document.querySelector('.orr-play').getAttribute('aria-pressed'), card: document.querySelector('.orr-tc').classList.contains('in'), cardTxt: document.querySelector('.orr-tc').textContent }));
    ok('E · Play starts the film at chapter 1 with its title card', /Pause/.test(f0.play) && f0.pressed === 'true' && f0.card && /Chapter 1 of 101995 · The WTO order/.test(f0.cardTxt), f0);
    await p.waitForFunction(() => ISX.profit.orrery.cur.SG.idx() === 1, null, { timeout: 20000 }); const s1 = await S(p);
    await p.waitForFunction(() => ISX.profit.orrery.cur.st.yf > 1997.2 && ISX.profit.orrery.cur.st.yf < 1999.8, null, { timeout: 12000 }); const mid = await p.evaluate(() => ISX.profit.orrery.cur.st.yf);
    ok('E · the film goes on to chapter 2 by itself, and the year moves between whole years (continuous time)', s1.ch === 1 && Math.abs(mid - Math.round(mid)) > .01, [s1.ch, mid]);
    await p.click('.orr-play'); await p.waitForTimeout(300); const y0 = await p.evaluate(() => ISX.profit.orrery.cur.st.yf); await p.waitForTimeout(900); const y1 = await p.evaluate(() => [ISX.profit.orrery.cur.st.yf, document.querySelector('.orr-play').textContent]);
    ok('E · “Pause” holds the film where it is', y0 === y1[0] && /Play/.test(y1[1]), [y0, y1]);
    await p.click('.orr-chp[data-ch="4"]'); await p.waitForTimeout(400); const camMid = (await S(p)).k; await p.waitForTimeout(1400); const camEnd = (await S(p)).k;
    await p.click('.orr-chp[data-ch="5"]'); await p.waitForTimeout(1500); const camBack = (await S(p)).k;
    ok('E · the camera glides to China for chapter 5 (in between on the way, then settled) and back to the whole picture for chapter 6', camMid > 1.001 && camMid < camEnd && Math.abs(camEnd - 1.16) < .01 && camBack === 1, [camMid, camEnd, camBack]);
    await p._c.close();
  }

  /* F · reduced motion: a still, cuts instead of glides; G · “Pause motion” stops everything that moves */
  {
    let p = await open(1440, 900, false, '2004', true);
    const r0 = await p.evaluate(() => ({ run: document.querySelector('.orr').classList.contains('run'), pulses: [...document.querySelectorAll('.orr-svg .pls, .orr-svg .fpu')].filter(x => getComputedStyle(x).display !== 'none').length, pm: document.querySelector('.orr-pm').hidden, card: getComputedStyle(document.querySelector('.orr-tc')).display }));
    await p.click('.orr-chp[data-ch="4"]'); await p.waitForTimeout(120); const k = (await S(p)).k, yr = (await S(p)).yr, card = await p.evaluate(() => document.querySelector('.orr-tc').classList.contains('in'));
    ok('F · reduced motion: no pulse, no running loop, no “Pause motion”, no title card', !r0.run && r0.pulses === 0 && r0.pm === true && r0.card === 'none' && !card, [r0, card]);
    ok('F · reduced motion: a chapter is a cut: the year and the camera are there at once', yr === 2013 && Math.abs(k - 1.16) < .01, [yr, k]);
    await p._c.close();
    p = await open(1440, 900, false, '2004');
    const mv = () => p.evaluate(() => ({ run: document.querySelector('.orr').classList.contains('run'), n: [...document.querySelectorAll('.orr-svg .pls, .orr-svg .fpu')].filter(x => getComputedStyle(x).display !== 'none' && getComputedStyle(x).animationPlayState === 'running').length, pm: [document.querySelector('.orr-pm').hidden, document.querySelector('.orr-pm').textContent], reg: ISXP.loops().includes('orrery') }));
    const m0 = await mv(); await p.click('.orr-pm'); await p.waitForTimeout(300); const m1 = await mv(); await p.click('.orr-pm'); await p.waitForTimeout(400); const m2 = await mv();
    ok('G · 2004: the pulses run on the flow lines (one loop, “orrery”, in the registry) and “Pause motion” is there', m0.run && m0.n >= 3 && m0.pm[0] === false && /Pause motion/.test(m0.pm[1]) && m0.reg, m0);
    ok('G · “Pause motion” stops every pulse; “Resume motion” starts them again', !m1.run && m1.n === 0 && /Resume motion/.test(m1.pm[1]) && m2.run && m2.n >= 3, [m1, m2]);
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(300); const h0 = await mv();
    ok('G · a hidden browser tab stops the motion', !h0.run, h0);
    await p._c.close();
  }

  /* H · full screen: the same stage, with the narration, the chapters, the timeline, the flows and the key */
  {
    const p = await open(1440, 900, false, '2008');
    await p.click('.orr-fsb'); await p.waitForTimeout(900);
    const f = await p.evaluate(() => { const fs = document.querySelector('.orr-fs'), q = s => fs.querySelector(s), vis = e => !!e && e.getBoundingClientRect().width > 0 && getComputedStyle(e).visibility !== 'hidden', st = q('.orr-stage').getBoundingClientRect(), inS = e => { const r = e.getBoundingClientRect(); return r.top >= st.top - 1 && r.bottom <= st.bottom + 1 && r.bottom <= innerHeight + 1; };
      return { stg: q('.orr').classList.contains('stg'), fill: [Math.round(st.width), Math.round(st.height), innerWidth, innerHeight], nar: vis(q('.orr-nar')) && inS(q('.orr-nar')), narTxt: q('.orr-nar .nz').textContent.slice(0, 60), chips: fs.querySelectorAll('.orr-chp').length, cur: (q('.orr-chp[aria-current]') || {}).textContent, tl: vis(q('.orr-sl input')) && inS(q('.orr-sl')), play: vis(q('.orr-play')), flows: fs.querySelectorAll('.orr-fb').length, keyBtn: vis(q('.orr-tbb.ky')), rim: q('.orr-rimt.a').textContent.slice(0, 20), door: vis(q('.orr-deep')), tb: [...fs.querySelectorAll('.orr-tb button')].map(b => b.textContent) }; });
    ok('H · full screen is the stage itself: it fills the window and holds the narrator, ten chapters, the timeline with Play, the flows and the door', f.stg && f.fill[0] === f.fill[2] && f.fill[1] === f.fill[3] && f.nar && /2008 · The dollar is sent out/.test(f.narTxt) && f.chips === 10 && /^4/.test(f.cur) && f.tl && f.play && f.flows === 3 && f.door && /THE WTO ORDER, 1995–/.test(f.rim), f);
    ok('H · full screen keeps its own controls: zoom out, zoom in, Reset, Pause motion, Key, Close', f.tb.join('|').replace(/❚❚ /, '') === '−|+|Reset|Pause motion|Key|Close' && f.keyBtn, f.tb);
    await p.evaluate(() => document.querySelector('.orr-fs .orr-tbb.ky').click()); await p.waitForTimeout(300);
    const key = await p.evaluate(() => { const k = document.querySelector('.orr-fs .orr-key'); return [k.hidden, [...k.querySelectorAll('.olg')].filter(e => e.offsetParent !== null).length]; });
    await p.evaluate(() => document.querySelector('.orr-fs .orr-chp[data-ch="8"]').click()); await p.waitForTimeout(900);
    const st = await p.evaluate(() => ({ step: document.querySelector('.orr-fs .orr').dataset.step, charts: document.querySelectorAll('.orr-fs .orr-ch').length }));
    await p.evaluate(() => document.querySelector('.orr-fs .orr-tbb.x').click()); await p.waitForTimeout(700);
    const back = await p.evaluate(() => ({ fs: !!document.querySelector('.orr-fs'), step: document.querySelector('.orr').dataset.step, hash: location.hash, focus: document.activeElement.className }));
    ok('H · in full screen “Key” opens the key on the picture, and the two steps are there too (they were on the page only); Close returns to the page at the same step', key[0] === false && key[1] >= 3 && st.step === 'pp' && st.charts === 2 && !back.fs && back.step === 'pp' && back.hash === '#profit/order/profit-and-production' && /orr-fsb/.test(back.focus), [key, st, back]);
    await p._c.close();
  }

  /* I · a phone: upright the narration is a sheet under the picture; sideways one slim bar; the timeline has its years; the key holds the flows */
  {
    let p = await open(390, 844, true, '2014'); await p.evaluate(() => document.querySelector('.orr-stage').scrollIntoView()); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const st = document.querySelector('.orr-stage').getBoundingClientRect(), nar = document.querySelector('.orr-nar').getBoundingClientRect(), o = ISX.profit.orrery.cur, B = o.box(), bar = document.getElementById('isx-tabs').getBoundingClientRect(), vis = t => !t.classList.contains('off') && getComputedStyle(t).visibility !== 'hidden' && getComputedStyle(t).display !== 'none';
      return { cls: o.wrap.className, narUnder: nar.top - st.top >= B.oy + B.hl - 2, fits: st.bottom <= bar.top + 1 && st.height <= innerHeight, yrs: [...document.querySelectorAll('.orr-yrs span')].filter(s => s.offsetParent !== null).map(s => s.textContent), nav: [...document.querySelectorAll('.orr-chs .orr-nx')].map(b => [b.textContent, Math.round(b.getBoundingClientRect().height)]), kick: document.querySelector('.orr-chs .nk').textContent, arcs: [...document.querySelectorAll('.orr-svg .orr-al')].filter(vis).map(t => t.textContent), rim: document.querySelector('.orr-rimt.a').textContent, sx: document.documentElement.scrollWidth - innerWidth, btn: ['.orr-fsb', '.orr-kyb', '#isx-pf-table'].map(s => Math.round(document.querySelector(s).getBoundingClientRect().height)) }; });
    ok('I · phone upright: the picture, then the narration as a sheet under it, all inside one screen above the bar; no sideways scroll', /\bport\b/.test(r.cls) && r.narUnder && r.fits && r.sx <= 0, r);
    ok('I · phone upright: the timeline has year labels (1995 … 2026); “Back” and “Next” are at least 40 px high and say “Chapter 5 of 10”', r.yrs.join() === '1995,2001,2008,2014,2020,2026' && r.nav.every(x => x[1] >= 40) && /^← Back$/.test(r.nav[0][0]) && /^Next: The squeeze →$/.test(r.nav[1][0]) && r.kick === 'Chapter 5 of 10' && r.btn.every(h => h >= 40), r);
    ok('I · phone upright, 2014: the rim carries the order’s name and China’s arcs carry theirs (the names that do not fit are in the key)', /THE WTO ORDER, 1995–/.test(r.rim) && ['SCO 2001', 'Swap lines 2008', 'BRICS 2009', 'Belt and Road 2013', 'NDB 2014'].every(t => r.arcs.includes(t)), [r.rim, r.arcs]);
    await p.evaluate(() => document.querySelector('.orr-kyb').click()); await p.waitForTimeout(300);
    const k = await p.evaluate(() => { const k = document.querySelector('#isx-orr-key-in'); return { open: !k.hidden, flows: k.querySelectorAll('.orr-fb').length, cap: (k.querySelector('.orr-fcap') || {}).textContent, rim: [...k.querySelectorAll('.olg')].map(e => e.textContent).find(t => /^The rim/.test(t)), rings: k.querySelectorAll('.orr-kr').length }; });
    ok('I · phone: the key opens on the picture and holds the flows, what the lines are, the rim’s institutions and the five rings', k.open && k.flows === 3 && /Grey lines: what US firms’ affiliates earned/.test(k.cap) && /IMF and World Bank 1944 · GATT 1948 · ADB 1966 · WTO 1995\. China inside it: IMF and World Bank seat 1980 · ADB 1986 · WTO 2001/.test(k.rim) && k.rings === 5, k);
    await p._c.close();
    p = await open(844, 390, true, '2008'); await p.evaluate(() => document.querySelector('.orr-stage').scrollIntoView()); await p.waitForTimeout(300);
    const l = await p.evaluate(() => { const nar = document.querySelector('.orr-nar'), r = nar.getBoundingClientRect(); return { cls: ISX.profit.orrery.cur.wrap.className, h: Math.round(r.height), read: (() => { const b = document.querySelector('.orr-nexp'); return [b.offsetParent !== null, b.textContent, b.getAttribute('aria-expanded')]; })(), title: nar.querySelector('.nt').textContent, yrs: [...document.querySelectorAll('.orr-yrs span')].filter(s => s.offsetParent !== null).length }; });
    await p.evaluate(() => document.querySelector('.orr-nexp').click()); await p.waitForTimeout(300);
    const l2 = await p.evaluate(() => { const nar = document.querySelector('.orr-nar'), st = document.querySelector('.orr-stage').getBoundingClientRect(), r = nar.getBoundingClientRect(); return { open: nar.classList.contains('open'), inStage: r.top >= st.top - 1 && r.bottom <= st.bottom + 1, txt: /Lehman Brothers fails on 15 September 2008/.test(nar.textContent) && getComputedStyle(nar.querySelector('.nz p.d')).whiteSpace !== 'nowrap', btn: document.querySelector('.orr-nexp').textContent }; });
    ok('I · phone sideways: the narrator is one slim bar with the chapter’s title; “Read” opens the whole narration inside the stage', /\bland\b/.test(l.cls) && l.h <= 44 && l.read[0] && l.read[1] === 'Read' && l.read[2] === 'false' && /2008 · The dollar is sent out/.test(l.title) && l.yrs === 6 && l2.open && l2.inStage && l2.txt && l2.btn === 'Close', [l, l2]);
    await p._c.close();
  }

  ok('no page or console errors', errs.length === 0, errs.slice(0, 5));
  await b.close();
  console.log('\n' + (n - fails) + ' of ' + n + ' passed' + (fails ? ', ' + fails + ' FAILED' : ''));
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('ERROR', e); process.exit(1); });
