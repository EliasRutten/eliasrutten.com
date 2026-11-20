/* Checks for the firm web with profits and owners (20 Nov 2026): v2/firms.js, data/firms.json.
   Usage: node tools/firms-check.js [base]. base is the page's address: http://127.0.0.1:8731/imperial-stack/ (the default; needs
   `python3 -m http.server 8731` at the repo root) or the single-file build, e.g. file:///tmp/art.html (tools/artifact-build.py).
   Exits 1 on a failed check.
   1 the tile in the Firms tray · 2 what is drawn · 3 the sums · 4 a firm, a holder, a sector row · 5 by country, filters, calm, the table ·
   6 the profit dollar's two doors · 7 the link and the guide's line · 8 a firm's card on the globe · 9 the phone · 10 no page errors */
const { chromium } = require('playwright');
const base = process.argv.slice(2).find(a => /^(https?|file):/.test(a)) || 'http://127.0.0.1:8731/imperial-stack/';
let fail = 0, n = 0;
const ok = (c, t, x) => { n++; if (!c) { fail++; console.log('FAIL  ' + t + (x !== undefined ? '  ' + JSON.stringify(x) : '')); } else if (process.env.V) console.log('ok    ' + t); };
(async () => {
  const b = await chromium.launch(), errs = [];
  const ctx = async (w, h) => { const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 600, hasTouch: w < 600, reducedMotion: 'reduce' }); await c.addInitScript(() => { try { ['isx-first', 'isx-insights', 'isx-tour', 'isx-simtour', 'isx-tips-sim', 'isx-enter'].forEach(k => localStorage.setItem(k, 'off')); localStorage.setItem('isx-intro', '1'); localStorage.setItem('isx-hints-off', '1'); } catch (e) { /* ignore */ } }); return c; };
  const open = async (c, hash) => { const p = await c.newPage(); p.on('pageerror', e => errs.push(hash + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_|Failed to load/.test(m.text())) errs.push(hash + ' console: ' + m.text().slice(0, 200)); }); await p.goto(base + hash, { waitUntil: 'domcontentloaded', timeout: 90000 }); await p.waitForFunction(() => window.ISX && ISX.booted && ISX.firms, null, { timeout: 90000 }); await p.waitForTimeout(500); return p; };
  const up = p => p.waitForFunction(() => ISX.firms.isOpen && ISX.firms.state.firms > 0, null, { timeout: 30000 });

  /* 1 · the tile */
  let c = await ctx(1440, 900), p = await open(c, '#circuit');
  await p.click('#isx-tp-firms'); await p.waitForTimeout(300);
  let r = await p.evaluate(() => { const T = document.getElementById('isx-tray-firms'), t = T.querySelector('.t2fw'); return { soon: /coming soon/i.test(T.textContent), btn: !!t && t.tagName === 'BUTTON', txt: t ? t.textContent : '', first: T.querySelector('.t2web').dataset.tray }; });
  ok(!r.soon && r.btn && /Profits and owners/.test(r.txt) && /Firms profitability view/.test(r.txt) && r.first === 'web', 'the Firms tray: the “Firms profitability view” tile is a button, nothing says “coming soon”, the ownership web keeps its place', r);
  await p.click('#isx-tray-firms .t2fw'); await up(p); await p.waitForTimeout(300);
  r = await p.evaluate(() => ({ s: ISX.firms.state, hash: location.hash, tray: ISX.tray.which, web: ISX.web.isOpen, focus: document.activeElement.className, on: document.getElementById('isx-root').classList.contains('web-on') }));
  ok(r.s.open && r.hash === '#circuit/firms' && !r.tray && !r.web && r.on && /wclose/.test(r.focus), 'the tile opens the firm web at #circuit/firms; focus lands on its way back', r);

  /* 2 · what is drawn */
  ok(r.s.firms === 49 && r.s.holders === 130 && r.s.sectors === 4 && r.s.links === 201, '49 firms, 130 holders, 4 sector rows and 201 lines, as in the merged file', r.s);
  r = await p.evaluate(() => { const S = document.querySelector('#isx-fw svg'), q = s => S.querySelectorAll(s), rr = id => +S.querySelector('[data-id="f:' + id + '"] .fm').getAttribute('r');
    const bad = [...q('.fnode')].filter(g => { const t = g.querySelector('text'); return !t || !g.getAttribute('aria-label').startsWith(t.textContent.replace(/…$/, '')) && !/Design software|Power, grid/.test(t.textContent); }).length;
    return { firm: q('.fnode.firm').length, hold: q('.fnode.holder').length, sec: q('.fnode.sector').length, k: q('.fk').length, loss: [...q('.fnode.firm.loss')].map(g => g.dataset.id).sort().join(), none: q('.fnode.firm.none').length, alt: S.getAttribute('aria-label').length, role: S.getAttribute('role'), bad, order: rr('microsoft') > rr('tsmc') && rr('tsmc') > rr('asml') && rr('asml') > rr('besi'), tab: q('.fnode.firm[tabindex="0"]').length, arcs: q('.farct').length, nan: /NaN|undefined/.test(S.outerHTML) }; });
  ok(r.firm === 49 && r.hold === 130 && r.sec === 4 && r.k === 201 && !r.nan, 'every mark and line is in the picture', r);
  ok(r.loss === 'f:coreweave,f:intel,f:spacex,f:wingtech' && r.none === 8, 'four losses are outlines; eight firms without a published profit are empty marks', r);
  ok(r.order, 'a firm’s mark grows with its profit (Microsoft > TSMC > ASML > Besi)');
  ok(r.alt > 150 && r.role === 'group' && r.bad === 0 && r.tab === 49 && r.arcs === 10, 'a text alternative on the picture; every mark’s spoken name starts with the words drawn on it; ten layers named', r);

  /* 3 · the sums */
  r = await p.evaluate(() => { const c = document.querySelector('#isx-fw .wcard'), bars = [...c.querySelectorAll('.fbar')].map(b => b.textContent); return { h: c.querySelector('h3').textContent, p: c.querySelector('p').textContent, bars, sum: ISX.firms.state.sum }; });
  ok(/37 firms booked \$921bn/.test(r.p) && /20\.8%/.test(r.p) && r.sum.profit === 921042 && r.sum.attributed === 191854, 'at rest: 37 firms in profit, $921bn, 20.8% attributed*', r.p);
  ok(r.bars.length === 7 && /^Asset managers and funds/.test(r.bars[0]) && /Dispersed or not disclosed.*79\.2%/.test(r.bars[6]), 'six holder types and “dispersed or not disclosed” as its own bar (79.2%)', r.bars);
  r = await p.evaluate(() => { const pct = [...document.querySelectorAll('#isx-fw .fbar span')].map(s => parseFloat(s.textContent.split('·')[1])); return Math.round(pct.reduce((a, b) => a + b, 0) * 10) / 10; });
  ok(Math.abs(r - 100) <= .3, 'the bars add up to the whole', r);

  /* 4 · a firm, a holder, a sector row */
  await p.click('#isx-fw .fnode[data-id="f:tsmc"] .fm'); await p.waitForTimeout(200);
  r = await p.evaluate(() => { const c = document.querySelector('#isx-fw .wcard'); return { h: c.querySelector('h3').textContent, tiles: [...c.querySelectorAll('.ftiles b')].map(b => b.textContent), rows: c.querySelectorAll('.fown li').length, na: c.querySelectorAll('.fown li.na').length, txt: c.textContent, hl: document.querySelector('#isx-fw svg').classList.contains('hl'), on: document.querySelectorAll('#isx-fw .fk.on').length, pressed: document.querySelector('#isx-fw .fnode[data-id="f:tsmc"]').getAttribute('aria-pressed') }; });
  ok(r.h === 'TSMC' && r.tiles[0] === '$55.1bn' && r.tiles[1] === '10.3%' && r.rows === 4 && r.na === 1 && r.hl && r.on === 4 && r.pressed === 'true', 'TSMC: $55.1bn, 10.3% attributed, four holders of which the depositary is not attributed', r.tiles);
  ok(/31\.1663 per USD/.test(r.txt) && /Hsinchu/.test(r.txt) && /TWSE 2330/.test(r.txt) && /31 Dec 2025/.test(r.txt) && /passes through/.test(r.txt) && !/'/.test(r.txt), 'its card: the rate, the seat, the listing, the year, and curled quotation marks');
  await p.click('#isx-fw .fown .wlk'); await p.waitForTimeout(200);
  r = await p.evaluate(() => ({ sel: ISX.firms.state.sel, h: document.querySelector('#isx-fw .wcard h3').textContent }));
  ok(/^h:/.test(r.sel) && /National Development Fund/.test(r.h), 'a holder in the list opens the holder', r);
  await p.evaluate(() => ISX.firms.pick('h:BlackRock')); await p.waitForTimeout(150);
  r = await p.evaluate(() => { const c = document.querySelector('#isx-fw .wcard'); return { tiles: [...c.querySelectorAll('.ftiles b')].map(b => b.textContent), rows: c.querySelectorAll('.fown li').length, txt: c.textContent }; });
  ok(r.tiles[1] === '20' && /^\$4\d\.\dbn$/.test(r.tiles[0]) && r.rows === 20 && /Holds for clients/.test(r.txt), 'BlackRock: one mark for 20 firms, its attributed profit*, “holds for clients”', r.tiles);
  await p.evaluate(() => ISX.firms.pick('f:arm')); await p.waitForTimeout(150);
  r = await p.evaluate(() => document.querySelector('#isx-fw .wcard').textContent);
  ok(/SoftBank Group Corp/.test(r) && /86%/.test(r) && /marked, not looked through/.test(r), 'Arm: SoftBank, a firm on the ring, is marked and not looked through');
  await p.evaluate(() => ISX.firms.pick('s:SR3')); await p.waitForTimeout(150);
  r = await p.evaluate(() => document.querySelector('#isx-fw .wcard').textContent);
  ok(/Sector row/.test(r) && /84\.95\*/.test(r) && /Aug 2026/.test(r) && /Census/.test(r), 'a sector row: its one figure, dated, sourced and starred');
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => ISX.firms.state.sel === null && ISX.firms.isOpen), 'Esc first lets go of the mark');

  /* 5 · by country, filters, calm, the table */
  await p.click('#isx-fw [data-fwby="country"]'); await p.waitForTimeout(150);
  r = await p.evaluate(() => ({ bars: [...document.querySelectorAll('#isx-fw button.fbar b')].map(b => b.textContent), hash: location.hash, pressed: document.querySelector('#isx-fw [data-fwby="country"]').getAttribute('aria-pressed') }));
  ok(r.bars[0] === 'United States' && r.bars.includes('China') && r.pressed === 'true', 'by holder’s country: the United States first', r.bars);
  await p.click('#isx-fw button.fbar'); await p.waitForTimeout(200);
  r = await p.evaluate(() => ({ f: ISX.firms.state.f, sel: document.querySelector('#isx-fw [data-fwf="hc"]').value, off: document.querySelectorAll('#isx-fw .fnode.off').length, on: document.querySelector('#isx-fw button.fbar').getAttribute('aria-pressed'), clear: !!document.querySelector('#isx-fw [data-fw="reset"]') }));
  ok(r.f.hc === 'United States' && r.sel === 'United States' && r.off > 40 && r.on === 'true' && r.clear, 'a bar filters the web to that country’s holders, and the filter row follows', r);
  await p.click('#isx-fw [data-fw="reset"]'); await p.waitForTimeout(150);
  await p.selectOption('#isx-fw [data-fwf="L"]', '3'); await p.waitForTimeout(200);
  r = await p.evaluate(() => ({ p: document.querySelector('#isx-fw .wcard p').textContent, off: document.querySelectorAll('#isx-fw .fnode.firm.off').length }));
  ok(/9 firms booked/.test(r.p) && /foundry and memory/i.test(r.p) && r.off === 39, 'a layer narrows the sums to its firms (Foundry and memory: nine in profit, ten on the ring)', r);
  await p.click('#isx-fw [data-fw="reset"]'); await p.waitForTimeout(150);
  await p.click('#isx-fw [data-fw="calm"]'); await p.waitForTimeout(200);
  r = await p.evaluate(() => { const vis = s => [...document.querySelectorAll('#isx-fw ' + s)].filter(e => getComputedStyle(e).display !== 'none').length; const a = [vis('.fk'), vis('.fnode.holder'), vis('.fnode.firm')]; ISX.firms.pick('f:nvidia'); return { a, b: [vis('.fk'), vis('.fnode.holder')], sw: document.querySelector('#isx-fw .fcalm').getAttribute('aria-checked') }; });
  ok(r.sw === 'true' && r.a[0] === 0 && r.a[1] === 0 && r.a[2] === 49 && r.b[0] === 4 && r.b[1] === 3, 'calm: the firms alone; with a firm picked, only its own lines and holders', r);
  await p.click('#isx-fw [data-fw="calm"]'); await p.evaluate(() => ISX.firms.pick(null));
  await p.click('#isx-fw [data-fw="table"]'); await p.waitForTimeout(200);
  r = await p.evaluate(() => { const t = document.querySelectorAll('#isx-fw .fwtab table'); return { n: t.length, rows: t[0] ? t[0].querySelectorAll('tbody tr').length : 0, rows2: t[1] ? t[1].querySelectorAll('tbody tr').length : 0, cap: t[0] ? t[0].caption.textContent : '', svg: getComputedStyle(document.querySelector('#isx-fw .fwpan')).display, btn: document.querySelector('#isx-fw [data-fw="table"]').textContent, nan: /NaN|undefined/.test(document.querySelector('#isx-fw .fwtab').textContent) }; });
  ok(r.n === 2 && r.rows === 49 && r.rows2 === 130 && r.cap.length > 30 && r.svg === 'none' && r.btn === 'View as web' && !r.nan, 'the table view: 49 firms and 130 holders as text, and the way back', r);
  await p.click('#isx-fw [data-fw="table"]'); await p.waitForTimeout(150);
  await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  r = await p.evaluate(() => ({ open: ISX.firms.isOpen, hash: location.hash, focus: document.activeElement.id, on: document.getElementById('isx-root').classList.contains('web-on') }));
  ok(!r.open && r.hash === '#circuit' && r.focus === 'isx-tp-firms' && !r.on, 'Esc closes it: back on the globe, the address follows, focus returns to “Firms”', r);
  await p.evaluate(() => ISX.web.open()); await p.waitForTimeout(700);
  ok(await p.evaluate(() => ISX.web.isOpen && !ISX.firms.isOpen && document.querySelectorAll('#isx-web3 .wnode.firm').length >= 17), 'the ownership web still opens, with its 17 mapped firms');
  await p.close();

  /* 6 · the profit dollar's two doors */
  p = await open(c, '#profit'); await p.waitForFunction(() => ISX.profit && ISX.profit.state.ready, null, { timeout: 30000 });
  r = await p.evaluate(() => { ISX.profit.go(0); const T = document.getElementById('isx-pf-text'); return { lock: T.querySelectorAll('.pf-door.lock').length, fw: [...T.querySelectorAll('button.pf-door[data-pfw]')].map(b => b.dataset.pfw + ':' + b.querySelector('b').textContent), web: T.querySelectorAll('.pf-door[data-pweb]').length }; });
  ok(r.lock === 0 && r.fw.join() === 'type:Who owns the profits,country:Who owns which firm' && r.web === 1, 'station 1: both doors to the firm web are open; the ownership web’s door stays', r);
  await p.click('#isx-pf-text button.pf-door[data-pfw="type"]'); await up(p); await p.waitForTimeout(300);
  r = await p.evaluate(() => ({ view: ISX.view, by: ISX.firms.state.by, back: document.querySelector('#isx-fw .wclose').textContent.trim() }));
  ok(r.view === 'map' && r.by === 'type' && /Back to the profit dollar/.test(r.back), '“Who owns the profits” opens the firm web, and its way back names the profit dollar', r);
  await p.click('#isx-fw .wclose'); await p.waitForTimeout(500);
  ok(await p.evaluate(() => ISX.view === 'profit' && !ISX.firms.isOpen), 'back to the profit dollar');
  await p.evaluate(() => ISX.profit.go(0)); await p.click('#isx-pf-text button.pf-door[data-pfw="country"]'); await up(p); await p.waitForTimeout(300);
  ok(await p.evaluate(() => ISX.firms.state.by === 'country' && location.hash === '#circuit/firms=country' && document.querySelector('#isx-fw button.fbar b').textContent === 'United States'), '“Who owns which firm” opens it by the holders’ countries');
  await p.close();

  /* 7 · the link and the guide's line */
  p = await open(c, '#circuit/firms=country'); await up(p);
  ok(await p.evaluate(() => ISX.firms.state.by === 'country' && ISX.view === 'map'), 'a link to #circuit/firms=country opens the web by country');
  await p.evaluate(() => { location.hash = '#circuit'; }); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !ISX.firms.isOpen), 'the address without /firms closes it');
  await p.evaluate(() => { location.hash = '#circuit/firms'; }); await up(p);
  r = await p.evaluate(() => { const src = [...document.scripts].map(s => s.textContent).join(''); return { old: /Firms profitability view, coming soon/.test(src), go: /go: \['circuit\/firms', 'Who owns the profits: the firm web'\]/.test(src), how: /The firm web: profits and owners/.test(src), name: ISX.viewName() }; });
  ok(!r.old && r.go && r.how && r.name === 'the firm web', 'the guide’s line no longer says “coming soon”: it links to the firm web; “How we count” has its row', r);
  await p.close();

  { /* the guide's step “Dollars for the underclass” (old play line 6, step 9): its quiet link opens the firm web */
    const cg = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await cg.addInitScript(() => { try { ['isx-first', 'isx-insights', 'isx-tour', 'isx-simtour', 'isx-tips-sim', 'isx-enter'].forEach(k => localStorage.setItem(k, 'off')); localStorage.setItem('isx-intro', '1'); localStorage.setItem('isx-hints-off', '1'); localStorage.setItem('isx-way', 'guide'); if (!sessionStorage.getItem('isx-sim-pos')) sessionStorage.setItem('isx-sim-pos', '{"l":6,"b":8}'); } catch (e) { /* ignore */ } });
    p = await open(cg, '#simulator'); await p.waitForTimeout(900);
    r = await p.evaluate(() => { const a = document.querySelector('#isx-snarr a[href="#circuit/firms"]'), c = document.getElementById('isx-snarr'); const R = { a: a ? a.textContent.trim() : null, t: (c.querySelector('h3') || {}).textContent, soon: /coming soon/.test(c.textContent) }; if (a) a.click(); return R; });
    if (r.a) await up(p);
    ok(r.t === 'Dollars for the underclass' && /^Who owns the profits: the firm web/.test(r.a || '') && !r.soon && await p.evaluate(() => ISX.view === 'map' && ISX.firms.isOpen), 'the guide’s quiet link on “Dollars for the underclass” opens the firm web', r);
    await p.close(); await cg.close();
  }

  /* 8 · a firm's card on the globe */
  p = await open(c, '#circuit/05/firm=asml'); await p.waitForFunction(() => ISX.sel.firm && document.querySelector('[data-own="fweb"]'), null, { timeout: 30000 }).catch(() => {});
  r = await p.evaluate(() => { const b = document.querySelector('[data-own="fweb"]'); if (b) b.click(); return !!b; });
  if (r) await up(p);
  ok(r && await p.evaluate(() => ISX.firms.state.sel === 'f:asml' && document.querySelector('#isx-fw .wcard h3').textContent === 'ASML'), 'a firm’s card on the globe has a door to its profit and owners');
  r = await p.evaluate(() => { const b = document.querySelector('#isx-fw [data-fw="globe"]'); if (b) b.click(); return !!b; }); await p.waitForTimeout(500);
  ok(r && await p.evaluate(() => !ISX.firms.isOpen && ISX.sel.firm && ISX.sel.firm.name === 'ASML'), 'and the web’s card leads back to its footprint on the globe');
  await p.close(); await c.close();

  /* 9 · other sizes */
  for (const [w, h] of [[1280, 760], [1024, 768], [390, 844]]) {
    c = await ctx(w, h); p = await open(c, '#circuit/firms'); await up(p); await p.waitForTimeout(300);
    r = await p.evaluate(() => { const d = document.documentElement, s = document.querySelector('#isx-fw svg').getBoundingClientRect(), bar = document.querySelector('#isx-fw .fwbar').getBoundingClientRect(), card = document.querySelector('#isx-fw .wcard').getBoundingClientRect(), fr = document.getElementById('isx-frame').getBoundingClientRect(); return { side: d.scrollWidth - innerWidth, sw: Math.round(s.width), sh: Math.round(s.height), barH: Math.round(bar.height), over: card.right > s.left + 4 && innerWidth > 760, inFrame: innerWidth <= 760 || (s.bottom <= fr.bottom + 2 && s.top >= bar.bottom - 2), small: [...document.querySelectorAll('#isx-fw button, #isx-fw select')].filter(e => { const r = e.getBoundingClientRect(); return innerWidth <= 760 && r.height > 0 && r.height < 43.5 && !e.closest('.fown, .fwtab'); }).length }; });
    ok(r.side <= 0 && !r.over && r.inFrame && r.sh >= (w > 760 ? 520 : 700) && r.small === 0, w + ' px: no sideways scroll, the picture clear of the card and inside the stage' + (w <= 760 ? ', it pans in its own box, touch targets of 44 px' : ''), r);
    ok(w < 1100 || r.barH <= 44, w + ' px: the filter row is one row (two below 1100 px)', r.barH);
    await p.evaluate(() => ISX.firms.set('table', true)); await p.waitForTimeout(150);
    ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 0 && document.querySelectorAll('#isx-fw .fwtab tbody tr').length === 179), w + ' px: the table view fits');
    await c.close();
  }

  /* 10 · errors */
  ok(errs.length === 0, 'no page errors', errs);
  await b.close();
  console.log(`${n - fail} of ${n} checks pass`); process.exit(fail ? 1 : 0);
})();
