/* Checks for the firm web (20 Nov 2026; round 2 of 21 Nov 2026: the ownership web folded in, chips, compare, ten views, WIP marker, movement): v2/firms.js, data/firms.json.
   Usage: node tools/firms-check.js [base]. base is the page's address: http://127.0.0.1:8731/imperial-stack/ (the default; needs
   `python3 -m http.server 8731` at the repo root) or the single-file build, e.g. file:///tmp/art.html (tools/artifact-build.py).
   Exits 1 on a failed check.
   1 the tile in the Firms tray · 2 what is drawn · 3 the sums · 4 a firm, a holder, a sector row · 5 by country, filters, calm, the table ·
   6 the profit dollar's doors · 7 the link and the guide's line · 8 a firm's card on the globe · 9 the phone and other sizes ·
   11 the ten views · 12 every combination has an address · 13 the WIP marker · 14 movement · 10 no page errors */
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
  let r = await p.evaluate(() => { const T = document.getElementById('isx-tray-firms'), t = T.querySelectorAll('.t2web'); return { soon: /coming soon/i.test(T.textContent), n: t.length, btn: t[0] && t[0].tagName === 'BUTTON', txt: t[0] ? t[0].textContent : '' }; });
  ok(!r.soon && r.n === 1 && r.btn && /Profits, owners and sites/.test(r.txt) && /the firm web: 49 firms/.test(r.txt), 'the Firms tray has one entry for the web, a button; nothing says “coming soon”', r);
  await p.click('#isx-tray-firms .t2fw'); await up(p); await p.waitForTimeout(300);
  r = await p.evaluate(() => ({ s: ISX.firms.state, hash: location.hash, tray: ISX.tray.which, old: !!document.getElementById('isx-web3'), focus: document.activeElement.className, on: document.getElementById('isx-root').classList.contains('web-on') }));
  ok(r.s.open && r.hash === '#circuit/firms' && !r.tray && !r.old && r.on && /wclose/.test(r.focus), 'the tile opens the firm web at #circuit/firms; focus lands on its way back; the older web is not built beside it', r);

  /* 2 · what is drawn */
  ok(r.s.firms === 49 && r.s.holders === 156 && r.s.sectors === 4 && r.s.links === 233 && r.s.countries === 14 && r.s.sites === 42, '49 firms, 156 holders, 4 sector rows and 233 lines, as in the merged file of 21 Nov; 14 countries and 42 site lines from the ownership web', r.s);
  r = await p.evaluate(() => { const S = document.querySelector('#isx-fw svg'), q = s => S.querySelectorAll(s), rr = id => +S.querySelector('[data-id="f:' + id + '"] .fm').getAttribute('r');
    const bad = [...q('.fnode')].filter(g => { const t = g.querySelector('text'); return !t || !g.getAttribute('aria-label').startsWith(t.textContent.replace(/…$/, '')) && !/Design software|Power, grid/.test(t.textContent); }).length;
    const sites = {}; [...q('.fnode.firm')].forEach(g => { const m = /; (\d+) sites? mapped$/.exec(g.getAttribute('aria-label')); if (m) sites[g.querySelector('text').textContent] = +m[1]; });
    return { firm: q('.fnode.firm:not(.out)').length, hold: q('.fnode.holder:not(.out)').length, standin: q('.fnode.holder.proxy.out').length, sec: q('.fnode.sector:not(.out)').length, k: q('.fk:not(.site)').length, site: q('.fk.site:not(.out)').length, cty: q('.fnode.country:not(.out)').length, loss: [...q('.fnode.firm.loss')].map(g => g.dataset.id).sort().join(), none: q('.fnode.firm.none').length, alt: S.getAttribute('aria-label').length, role: S.getAttribute('role'), bad, order: rr('microsoft') > rr('tsmc') && rr('tsmc') > rr('asml') && rr('asml') > rr('besi'), tab: q('.fnode[tabindex="0"]').length, arcs: q('.farct').length, nan: /NaN|undefined/.test(S.outerHTML), sites, key: document.querySelector('#isx-fw .wkey').textContent }; });
  ok(r.firm === 49 && r.hold === 156 && r.standin === 10 && r.sec === 4 && r.k === 233 && r.site === 42 && r.cty === 14 && !r.nan, 'every mark and line is in the picture (the ten stand-ins for ring firms wait out of sight)', r);
  ok(r.loss === 'f:coreweave,f:intel,f:spacex,f:wingtech' && r.none === 8, 'four losses are outlines; eight firms without a published profit are empty marks', r);
  ok(r.order, 'a firm’s mark grows with its profit (Microsoft > TSMC > ASML > Besi)');
  ok(r.alt > 150 && r.role === 'group' && r.bad === 0 && r.tab === 49 + 4 + 14 && r.arcs === 10, 'a text alternative on the picture; every mark’s spoken name starts with the words drawn on it; ten layers named', r);
  const SITES = { TSMC: 12, ASML: 9, NXP: 9, 'SK hynix': 6, Besi: 6, Samsung: 5, Nexperia: 5, Foxconn: 3, Microsoft: 2, Alphabet: 1, Amazon: 1, Meta: 1, 'ASM Intl': 1, SpaceX: 1 };
  ok(JSON.stringify(Object.entries(r.sites).sort()) === JSON.stringify(Object.entries(SITES).sort()), 'the merge: the 14 firms with mapped sites carry them (TSMC 12, ASML 9, NXP 9, SK hynix 6, Besi 6, Samsung 5, Nexperia 5, Foxconn 3, Microsoft 2, five with one)', r.sites);
  ok(/Control disputed/.test(r.key) && /Operates in/.test(r.key), 'the key carries the ownership web’s two entries: control disputed, operates in');

  /* 3 · the sums */
  r = await p.evaluate(() => { const c = document.querySelector('#isx-fw .wcard'), bars = [...c.querySelectorAll('.fbar')].map(b => b.textContent); return { h: c.querySelector('h3').textContent, p: c.querySelector('p').textContent, bars, sum: ISX.firms.state.sum, views: [...c.querySelectorAll('.fvs .fv1')].map(b => b.textContent) }; });
  ok(/37 firms booked \$921bn/.test(r.p) && /20\.7%/.test(r.p) && r.sum.profit === 921042 && r.sum.attributed === 190427, 'at rest: 37 firms in profit, $921bn, 20.7% attributed*', r.p);
  ok(r.bars.length === 7 && /^Asset managers and funds/.test(r.bars[0]) && /Dispersed or not disclosed.*79\.3%/.test(r.bars[6]), 'six holder types and “dispersed or not disclosed” as its own bar (79.3%)', r.bars);
  ok(r.bars.some(b => /^States and state funds\$14\.0bn · 1\.5%/.test(b)) && r.bars.some(b => /^Other firms and banks\$19\.1bn · 2\.1%/.test(b)), 'a ring firm that holds another is counted by its own type: the Big Funds’ stakes are the state’s ($14.0bn, 1.5%)', r.bars);
  ok(r.views.length === 10 && /^1The claim flows to New York$/.test(r.views[0]) && /^10Balance-sheet engineers.*WIP$/.test(r.views[9]), 'the card at rest lists the ten views; the tenth carries the WIP marker', r.views);
  r = await p.evaluate(() => { const pct = [...document.querySelectorAll('#isx-fw .fbar span')].map(s => parseFloat(s.textContent.split('·')[1])); return Math.round(pct.reduce((a, b) => a + b, 0) * 10) / 10; });
  ok(Math.abs(r - 100) <= .3, 'the bars add up to the whole', r);
  await p.click('#isx-fw [data-fw="more"]'); await p.waitForTimeout(150);
  r = await p.evaluate(() => { const m = document.querySelector('#isx-fw .fmore'); return m ? { t: m.textContent, facts: [...m.querySelectorAll('.wf')].map(b => b.textContent), sheets: m.querySelectorAll('.wsr').length, seats: m.querySelectorAll('.wseat span').length } : null; });
  ok(r && /49 firms, 156 owners named in filings and 14 countries of operation/.test(r.t) && r.facts[0] === '21BlackRock' && r.facts.length === 4 && r.sheets === 3 && r.seats >= 10 && /Owners shown, by head office/.test(r.t) && /Data sheets/.test(r.t) && /Huawei, SMIC, Wingtech/.test(r.t), '“The web in numbers” holds what the ownership web’s card had at rest: the counts, the four owners with most firms, head offices, the three empty sheets', r && r.facts);
  await p.click('#isx-fw [data-fw="more"]');

  /* 4 · a firm, a holder, a sector row, a country */
  await p.click('#isx-fw .fnode[data-id="f:tsmc"] .fm'); await p.waitForTimeout(200);
  r = await p.evaluate(() => { const c = document.querySelector('#isx-fw .wcard'); return { h: c.querySelector('h3').textContent, tiles: [...c.querySelectorAll('.ftiles b')].map(b => b.textContent), rows: c.querySelectorAll('.fown li').length, na: c.querySelectorAll('.fown li.na').length, txt: c.textContent, hl: document.querySelector('#isx-fw svg').classList.contains('hl'), on: document.querySelectorAll('#isx-fw .fk.on:not(.site)').length, son: document.querySelectorAll('#isx-fw .fk.site.on').length, pressed: document.querySelector('#isx-fw .fnode[data-id="f:tsmc"]').getAttribute('aria-pressed'), seat: [...c.querySelectorAll('.wseat button')].map(b => b.textContent), old: c.querySelectorAll('.fold2 li').length }; });
  ok(r.h === 'TSMC' && r.tiles[0] === '$55.1bn' && r.tiles[1] === '10.3%' && r.rows === 4 && r.na === 1 && r.hl && r.on === 4 && r.pressed === 'true', 'TSMC: $55.1bn, 10.3% attributed, four holders of which the depositary is not attributed', r.tiles);
  ok(/31\.1663 per USD/.test(r.txt) && /Hsinchu/.test(r.txt) && /TWSE 2330/.test(r.txt) && /31 Dec 2025/.test(r.txt) && /passes through/.test(r.txt) && !/'/.test(r.txt), 'its card: the rate, the seat, the listing, the year, and curled quotation marks');
  ok(r.son === 5 && r.seat.join() === '6Taiwan,2United States,1Japan,2China,1Germany' && /12 sites mapped in 5 countries/.test(r.txt) && /State among the largest holders/.test(r.txt) && /Pax Silica · Asia/.test(r.txt) && r.old === 4 && /Owners above the threshold, as on the globe’s card · 11 Nov 2026/.test(r.txt), 'and what the ownership web gave it: its control, summary and bloc, its sites by country with five lines on the picture, the owners of the globe’s card', r.seat);
  await p.click('#isx-fw .fown .wlk'); await p.waitForTimeout(200);
  r = await p.evaluate(() => ({ sel: ISX.firms.state.sel, h: document.querySelector('#isx-fw .wcard h3').textContent }));
  ok(/^h:/.test(r.sel) && /National Development Fund/.test(r.h), 'a holder in the list opens the holder', r);
  await p.evaluate(() => ISX.firms.pick('h:BlackRock')); await p.waitForTimeout(150);
  r = await p.evaluate(() => { const c = document.querySelector('#isx-fw .wcard'); return { tiles: [...c.querySelectorAll('.ftiles b')].map(b => b.textContent), rows: c.querySelectorAll('.fown li').length, txt: c.textContent }; });
  ok(r.tiles[1] === '21' && /^\$4\d\.\dbn$/.test(r.tiles[0]) && r.rows === 21 && /Holds for clients/.test(r.txt), 'BlackRock: one mark for 21 firms, its attributed profit*, “holds for clients”', r.tiles);
  await p.evaluate(() => ISX.firms.pick('f:arm')); await p.waitForTimeout(150);
  r = await p.evaluate(() => document.querySelector('#isx-fw .wcard').textContent);
  ok(/SoftBank Group Corp/.test(r) && /86%/.test(r) && /marked, not looked through/.test(r), 'Arm: SoftBank, a firm on the ring, is marked and not looked through');
  await p.evaluate(() => ISX.firms.pick('f:nexperia')); await p.waitForTimeout(150);
  r = await p.evaluate(() => ({ t: document.querySelector('#isx-fw .wcard').textContent, bad: document.querySelectorAll('#isx-fw .fk.bad').length, cls: document.querySelector('#isx-fw .fline.bad') ? 1 : 0 }));
  ok(/Control disputed/.test(r.t) && r.bad === 1 && r.cls === 1 && /a Dutch court handed almost all its votes to an administrator/.test(r.t), 'Nexperia keeps the ownership web’s “control disputed”: on its card and as a dashed line from Wingtech', r.bad);
  await p.evaluate(() => ISX.firms.pick('s:SR3')); await p.waitForTimeout(150);
  r = await p.evaluate(() => document.querySelector('#isx-fw .wcard').textContent);
  ok(/Sector row/.test(r) && /84\.95\*/.test(r) && /Aug 2026/.test(r) && /Census/.test(r), 'a sector row: its one figure, dated, sourced and starred');
  await p.click('#isx-fw .fnode[data-id="c:TWN"] .fm'); await p.waitForTimeout(150);
  r = await p.evaluate(() => { const c = document.querySelector('#isx-fw .wcard'); return { t: c.textContent, rows: [...c.querySelectorAll('.fown li')].map(l => l.textContent), on: document.querySelectorAll('#isx-fw .fk.site.on').length }; });
  ok(/Country of operation/.test(r.t) && /Taiwan/.test(r.t) && r.rows.join('|') === 'TSMC6 sites|ASML3 sites|NXP1 site' && r.on === 3 && /The lists of sites are not complete/.test(r.t), 'a country of operation: Taiwan, three firms and their sites', r.rows);
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => ISX.firms.state.sel === null && ISX.firms.isOpen), 'Esc first lets go of the mark');

  /* 5 · by country, the chips, compare, calm, the table */
  await p.click('#isx-fw [data-fwby="country"]'); await p.waitForTimeout(150);
  r = await p.evaluate(() => ({ bars: [...document.querySelectorAll('#isx-fw button.fbar b')].map(b => b.textContent), hash: location.hash, pressed: document.querySelector('#isx-fw [data-fwby="country"]').getAttribute('aria-pressed') }));
  ok(r.bars[0] === 'United States' && r.bars.includes('China') && r.pressed === 'true' && r.hash === '#circuit/firms=country', 'by holder’s country: the United States first, and the address says so', r.bars);
  await p.click('#isx-fw button.fbar'); await p.waitForTimeout(200);
  r = await p.evaluate(() => ({ f: ISX.firms.state.f, chip: document.querySelector('#isx-fw [data-fwp="hc"]').textContent, off: document.querySelectorAll('#isx-fw .fnode.off').length, on: document.querySelector('#isx-fw button.fbar').getAttribute('aria-pressed'), clear: !!document.querySelector('#isx-fw [data-fw="reset"]'), hash: location.hash }));
  ok(r.f.hc.join() === 'United States' && /1 picked/.test(r.chip) && r.off > 40 && r.on === 'true' && r.clear && r.hash === '#circuit/firms=country;hc=united-states', 'a bar filters the web to that country’s holders; the chip counts it and the address follows', r);
  await p.click('#isx-fw [data-fwp="hc"]'); await p.waitForTimeout(150);
  r = await p.evaluate(() => { const P = document.getElementById('isx-fw-pan'); return P ? { opts: P.querySelectorAll('.fopt').length, on: [...P.querySelectorAll('.fopt[aria-pressed="true"]')].map(b => b.textContent), exp: document.querySelector('#isx-fw [data-fwp="hc"]').getAttribute('aria-expanded') } : null; });
  ok(r && r.opts === 15 && r.on.join() === 'United States' && r.exp === 'true', 'the chip opens a panel of values; the one in force is pressed', r);
  await p.click('#isx-fw-pan .fopt[data-v="Norway"]'); await p.click('#isx-fw-pan .fopt[data-v="Singapore"]'); await p.waitForTimeout(150);
  r = await p.evaluate(() => ({ hc: ISX.firms.state.f.hc.join(), lit: ISX.firms.state.lit, focus: document.activeElement.textContent, pan: !!document.getElementById('isx-fw-pan') }));
  ok(r.hc === 'United States,Norway,Singapore' && r.pan && r.focus === 'Singapore' && r.lit > 60, 'several values at once: three countries of holders, the panel stays open and keeps the focus', r);
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => !document.getElementById('isx-fw-pan') && ISX.firms.isOpen && document.activeElement.dataset.fwp === 'hc'), 'Esc closes the panel first, back on its chip');
  await p.click('#isx-fw [data-fw="reset"]'); await p.waitForTimeout(150);
  await p.evaluate(() => ISX.firms.set('L', ['3'])); await p.waitForTimeout(200);
  r = await p.evaluate(() => ({ p: document.querySelector('#isx-fw .wcard p').textContent, out: document.querySelectorAll('#isx-fw .fnode.firm.out').length, s: ISX.firms.state, hidden: document.querySelectorAll('#isx-fw .fnode.firm.out[aria-hidden="true"][tabindex="-1"]').length }));
  ok(/9 firms booked/.test(r.p) && /foundry and memory/i.test(r.p) && r.out === 39 && r.hidden === 39 && r.s.inFirms === 10 && r.s.k > 1.2, 'a layer narrows the web to its firms (Foundry and memory: nine in profit, ten on the ring, drawn larger); the others leave the picture and the tab order', { p: r.p, out: r.out, k: r.s.k });
  r = await p.evaluate(() => { const g = id => document.querySelector('#isx-fw .fnode[data-id="' + id + '"]'); return { smic: g('h:China Integrated Circuit Industry Investment Fund Co., Ltd. (Big Fund)') ? 1 : 0, px: !g('p:bigfund_ii').classList.contains('out'), pxn: g('p:bigfund_ii').getAttribute('aria-label') }; });
  ok(r.px && /^Big Fund II/.test(r.pxn) && /a firm on the ring/.test(r.pxn), 'a ring firm outside the view that holds a firm in it comes along as a holder mark (Big Fund II for SMIC and YMTC)', r);
  await p.evaluate(() => ISX.firms.set('L', [])); await p.waitForTimeout(150);
  await p.click('#isx-fw [data-fw="cmp"]'); await p.waitForTimeout(200);
  r = await p.evaluate(() => { const P = document.getElementById('isx-fw-pan'); return { s: ISX.firms.state, rows: P ? P.querySelectorAll('.fprow').length : 0, sw: document.querySelector('#isx-fw .fcmp').getAttribute('aria-checked'), card: document.querySelector('#isx-fw .wcard').textContent }; });
  ok(r.s.cmp && !r.s.split && r.rows === 2 && r.sw === 'true' && r.s.pan === 'fc' && /Pick what goes in each group/.test(r.card), '“Compare two groups”: the switch is on, the panel opens with a row for A and one for B, and the card says what to do', { pan: r.s.pan, rows: r.rows });
  await p.click('#isx-fw-pan .fopt[data-g="f"][data-v="Netherlands"]'); await p.click('#isx-fw-pan .fopt[data-g="g"][data-v="Japan"]'); await p.click('#isx-fw-pan .fopt[data-g="g"][data-v="Taiwan"]'); await p.waitForTimeout(200);
  r = await p.evaluate(() => { const fr = id => { const m = /translate\(([-\d.]+)/.exec(document.querySelector('#isx-fw .fnode[data-id="f:' + id + '"]').getAttribute('transform')); return +m[1]; }; return { s: ISX.firms.state, x: [fr('asml'), fr('tsmc'), fr('tokyo_electron')], tags: [...document.querySelectorAll('#isx-fw .ftag')].map(t => t.textContent), grp: [...document.querySelectorAll('#isx-fw .fgrp .wk3')].map(t => t.textContent), hash: location.hash, cty: document.querySelectorAll('#isx-fw svg.split').length }; });
  ok(r.s.split && r.s.inFirms === 9 && r.x[0] < 400 && r.x[1] > 520 && r.x[2] > 520 && r.tags.length === 2 && /^A · Netherlands · 5 firms$/.test(r.tags[0]) && /^B · Japan, Taiwan · 4 firms$/.test(r.tags[1]) && r.grp.length === 2 && r.cty === 1, 'two groups are two halves of the ring: the Dutch firms left, the Japanese and Taiwanese right, each half named, each with its own sums', { x: r.x, tags: r.tags });
  ok(r.hash === '#circuit/firms=country;fc=netherlands;vs;fc2=japan,taiwan', 'and the comparison has an address', r.hash);
  await p.click('#isx-fw [data-fw="reset"]'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => { const s = ISX.firms.state; return !s.cmp && !s.split && s.inFirms === 49 && location.hash === '#circuit/firms=country' && !document.querySelector('#isx-fw [data-fw="reset"]'); }), '“Clear” brings the whole ring back');
  await p.click('#isx-fw [data-fwby="type"]');
  await p.click('#isx-fw [data-fw="calm"]'); await p.waitForTimeout(200);
  r = await p.evaluate(() => { const vis = s => [...document.querySelectorAll('#isx-fw ' + s)].filter(e => getComputedStyle(e).display !== 'none' && getComputedStyle(e).opacity !== '0').length; const a = [vis('.fk'), vis('.fnode.holder'), vis('.fnode.firm'), vis('.fnode.country')]; ISX.firms.pick('f:nvidia'); return { a, b: [vis('.fk'), vis('.fnode.holder')], sw: document.querySelector('#isx-fw .fcalm').getAttribute('aria-checked') }; });
  ok(r.sw === 'true' && r.a[0] === 0 && r.a[1] === 0 && r.a[2] === 49 && r.a[3] === 0 && r.b[0] === 4 && r.b[1] === 3, 'calm: the firms alone; with a firm picked, only its own lines and holders', r);
  await p.click('#isx-fw [data-fw="calm"]'); await p.evaluate(() => ISX.firms.pick(null));
  await p.click('#isx-fw [data-fw="table"]'); await p.waitForTimeout(200);
  r = await p.evaluate(() => { const t = document.querySelectorAll('#isx-fw .fwtab table'); return { n: t.length, rows: [...t].map(x => x.querySelectorAll('tbody tr').length), cap: t[2] ? t[2].caption.textContent : '', svg: getComputedStyle(document.querySelector('#isx-fw .fwpan')).display, btn: document.querySelector('#isx-fw [data-fw="table"]').textContent, nan: /NaN|undefined/.test(document.querySelector('#isx-fw .fwtab').textContent), tw: [...(t[2] ? t[2].querySelectorAll('tbody tr') : [])].map(x => x.textContent)[0] }; });
  ok(r.n === 3 && r.rows.join() === '49,156,14' && /Where it is earned/.test(r.cap) && r.svg === 'none' && r.btn === 'View as web' && !r.nan && /^United States/.test(r.tw), 'the table view: 49 firms, 156 holders and the 14 countries of operation as text, and the way back', r);
  await p.click('#isx-fw [data-fw="table"]'); await p.waitForTimeout(150);
  await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  r = await p.evaluate(() => ({ open: ISX.firms.isOpen, hash: location.hash, focus: document.activeElement.id, on: document.getElementById('isx-root').classList.contains('web-on') }));
  ok(!r.open && r.hash === '#circuit' && r.focus === 'isx-tp-firms' && !r.on, 'Esc closes it: back on the globe, the address follows, focus returns to “Firms”', r);
  await p.evaluate(() => ISX.web.open()); await up(p); await p.waitForTimeout(300);
  ok(await p.evaluate(() => ISX.firms.isOpen && ISX.firms.state.view === 'earned' && !document.getElementById('isx-web3') && location.hash === '#circuit/firms=v=earned'), 'the ownership web’s own seam (its old tile and door) opens the same view, on “where it is earned”');
  await p.close();

  /* 6 · the profit dollar's doors */
  p = await open(c, '#profit'); await p.waitForFunction(() => ISX.profit && ISX.profit.state.ready, null, { timeout: 30000 });
  r = await p.evaluate(() => { ISX.profit.go(0); const T = document.getElementById('isx-pf-text'); return { lock: T.querySelectorAll('.pf-door.lock').length, fw: [...T.querySelectorAll('button.pf-door[data-pfw]')].map(b => b.dataset.pfw + ':' + b.querySelector('b').textContent), web: T.querySelectorAll('.pf-door[data-pweb]').length }; });
  ok(r.lock === 0 && r.fw.join() === 'type:Who owns the profits,country:Who owns which firm' && r.web === 1, 'station 1: both doors to the firm web are open; the ownership web’s door stays', r);
  await p.click('#isx-pf-text button.pf-door[data-pweb]'); await up(p); await p.waitForTimeout(300);
  r = await p.evaluate(() => ({ view: ISX.view, v: ISX.firms.state.view, n: ISX.firms.state.inFirms, back: document.querySelector('#isx-fw .wclose').textContent.trim() }));
  ok(r.view === 'map' && r.v === 'earned' && r.n === 14 && /Back to the profit dollar/.test(r.back), 'the ownership web’s door (“Where it is earned”) opens the firm web on its 14 sited firms, and leads back to the profit dollar', r);
  await p.click('#isx-fw .wclose'); await p.waitForTimeout(500); await p.evaluate(() => ISX.profit.go(0));
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
    ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 0 && document.querySelectorAll('#isx-fw .fwtab tbody tr').length === 219), w + ' px: the table view fits');
    await p.evaluate(() => ISX.firms.set('table', false));
    if (w < 600) {   /* the phone: the views one tap away, what a view says above the picture, 44 px targets in the panels */
      await p.click('#isx-fw .fvw'); await p.waitForTimeout(150);
      r = await p.evaluate(() => { const P = document.getElementById('isx-fw-pan'); return P ? { n: P.querySelectorAll('.fv1').length, small: [...P.querySelectorAll('button')].filter(e => e.getBoundingClientRect().height < 43.5).length } : null; });
      ok(r && r.n === 10 && r.small === 0, 'phone: “Ten views” opens the list above the picture, 44 px targets', r);
      await p.click('#isx-fw-pan [data-fwv="systems"]'); await p.waitForTimeout(250);
      r = await p.evaluate(() => { const c = document.querySelector('#isx-fw .fcap'), s = document.querySelector('#isx-fw svg').getBoundingClientRect(); return { cap: c.hidden ? '' : c.textContent, above: c.getBoundingClientRect().bottom <= s.top + 1, side: document.documentElement.scrollWidth - innerWidth, split: ISX.firms.state.split, hidden: c.getAttribute('aria-hidden') }; });
      ok(/Two systems of ownership/.test(r.cap) && /US firms \(\$677bn/.test(r.cap) && r.above && r.side <= 0 && r.split && r.hidden === 'true', 'phone: the view’s name and reading line sit above the picture (the card below carries them for a screen reader)', r);
      await p.click('#isx-fw [data-fwp="fc"]'); await p.waitForTimeout(150);
      r = await p.evaluate(() => [...document.querySelectorAll('#isx-fw-pan button')].filter(e => e.getBoundingClientRect().height < 43.5).length);
      ok(r === 0, 'phone: the values in a filter’s panel are 44 px targets', r);
    }
    await c.close();
  }

  /* 11 · the ten views: each fills the controls, each shows what its reading line says (figures worked out here from the data file) */
  c = await ctx(1440, 900); p = await open(c, '#circuit/firms'); await up(p);
  const D = await p.evaluate(() => ISX.load('firms')), F = {}; D.firms.forEach(f => { F[f.id] = f; });
  const money = v => { const a = Math.abs(v), s = a >= 1000 ? '$' + (a / 1000).toFixed(a >= 100000 ? 0 : 1) + 'bn' : '$' + (a >= 10 ? Math.round(a) : a.toFixed(1)) + 'm'; return (v < 0 ? '−' : '') + s; };
  const view = async id => { await p.evaluate(v => ISX.firms.view(v), id); await p.waitForTimeout(200); return p.evaluate(() => { const c = document.querySelector('#isx-fw .wcard'), S = document.querySelector('#isx-fw svg'); return { s: ISX.firms.state, hash: location.hash, k: c.querySelector('.wk3').textContent, h: c.querySelector('h3').textContent, read: (c.querySelector('.fread') || {}).textContent, txt: c.textContent, list: c.querySelectorAll('.fvl li').length, chips: [...document.querySelectorAll('#isx-fw .fwbar .fchip:not(.fvw)')].map(b => b.textContent), litT: [...new Set([...S.querySelectorAll('.fk:not(.site):not(.off):not(.out)')].map(e => (/t-(\w+)/.exec(e.getAttribute('class')) || [])[1]))].sort().join(), firms: [...S.querySelectorAll('.fnode.firm:not(.out)')].map(g => g.dataset.id.slice(2)), cmp: document.querySelector('#isx-fw .fcmp').getAttribute('aria-checked'), cls: S.getAttribute('class') }; }); };
  const titles = ['The claim flows to New York', 'Two systems of ownership', 'The state as shareholder', 'The chokepoints', 'Firms holding firms', 'Stake against votes', 'Who carries the losses', 'What no one discloses', 'Where it is earned, booked and owned', 'Balance-sheet engineers'];
  const ids = ['claim', 'systems', 'state', 'chokepoints', 'ring', 'votes', 'losses', 'undisclosed', 'earned', 'debt'], V = {};
  for (let i = 0; i < ids.length; i++) { V[ids[i]] = r = await view(ids[i]); ok(r.s.view === ids[i] && r.h === titles[i] && r.k.startsWith('View ' + (i + 1) + ' of 10') && r.read && r.read.length > 40 && new RegExp('v=' + ids[i] + '$').test(r.hash), 'view ' + (i + 1) + ', “' + titles[i] + '”: one click, its name, its number, one reading line, its address', { h: r.h, k: r.k, hash: r.hash }); }
  { const by = {}; D.holders.forEach(h => { if (F[h.f].home !== 'United States' && h.c === 'United States' && h.a > 0) by[h.f] = (by[h.f] || 0) + h.a; }); const top = Object.keys(by).sort((a, b) => by[b] - by[a]).filter(k => by[k] >= 100).slice(0, 5), tot = Object.values(by).reduce((a, b) => a + b, 0), want = top.map(k => F[k].n + ' ' + money(by[k])).join(', ');
    r = V.claim; ok(r.read.includes(want) && r.read.includes('Together ' + money(Math.round(tot)) + '.') && want.startsWith('SK hynix $2.6bn, Samsung $1.6bn, ASML $1.3bn') && r.s.f.fc.length === 8 && !r.s.f.fc.includes('United States') && r.s.f.hc.join() === 'United States' && /8 picked/.test(r.chips[1]) && /1 picked/.test(r.chips[3]) && r.s.by === 'country' && r.s.inFirms === 32 && r.litT !== '' && r.list === Object.keys(by).length, '1: the firms outside the United States with their US holders lit; the line gives SK hynix $2.6bn, Samsung $1.6bn, ASML $1.3bn and the total, as the data has them; the two chips are filled', r.read); }
  { const one = home => { let P = 0; const t = {}; D.firms.forEach(f => { if (f.home === home && f.usd > 0) P += f.usd; }); D.holders.forEach(h => { if (F[h.f].home === home && F[h.f].usd > 0 && h.a > 0) t[h.t] = (t[h.t] || 0) + h.a; }); return { P, t }; }, us = one('United States'), cn = one('China'), pc = (x, k) => (x.t[k] / x.P * 100).toFixed(1) + '%';
    r = V.systems; ok(r.read.includes('US firms (' + money(us.P) + ' of profit): managers ' + pc(us, 'manager') + ', founders ' + pc(us, 'founder') + ', state ' + pc(us, 'state')) && r.read.includes('Chinese firms (' + money(cn.P) + ' of profit): employees ' + pc(cn, 'employees') + ', other firms ' + pc(cn, 'firm') + ', founders ' + pc(cn, 'founder') + ', state ' + pc(cn, 'state') + ', managers ' + pc(cn, 'manager'))
      && /managers 12\.0%, founders 6\.1%, state 0\.1%/.test(r.read) && /employees 13\.6%, other firms 10\.4%, founders 7\.5%, state 3\.4%, managers 0\.3%/.test(r.read) && r.s.cmp && r.s.split && r.cmp === 'true' && r.s.f.fc.join() === 'United States' && r.s.g.fc.join() === 'China' && r.s.inFirms === 34, '2: US firms against Chinese firms by holder type, with the figures of the 21 Nov data (12.0, 6.1, 0.1 against 13.6, 10.4, 7.5, 3.4, 0.3; the spec’s 12.5 was the 20 Nov file’s); it uses “compare two groups”', r.read); }
  r = V.state; ok(r.litT === 'state' && /^31 state holders hold stakes in 20 firms/.test(r.read) && /One level only, so state ownership through state-owned firms is understated\./.test(r.txt) && r.s.f.ht.join() === 'state' && ['National Pension Service', 'Norges Bank', 'GIC'].every(n => r.txt.includes(n)), '3: every lit line is a state holder’s; the method note is on the view', r.read);
  await view('state');
  r = await p.evaluate(() => ['p:bigfund_i', 'p:bigfund_ii', 'h:Ministry of Finance (China)', 'h:U.S. government (Department of Commerce)', 'h:National Development Fund, Executive Yuan', 'h:Norges Bank', 'h:GIC', 'h:Mubadala', 'h:G42'].map(id => { const L = [...document.querySelectorAll('#isx-fw .fnode')].find(g => g.dataset.id === id), f = id.slice(0, 2) === 'p:' ? document.querySelector('#isx-fw .fnode[data-id="f:' + id.slice(2) + '"]') : null; return (L && !L.classList.contains('off') && !L.classList.contains('out')) || (f && !f.classList.contains('off') && !f.classList.contains('out')) ? 1 : 0; }).join(''));
  ok(r === '111111111', '3: the Big Funds, the Ministry of Finance, the US government in Intel, Taiwan’s fund, Norges Bank, GIC, Mubadala and G42 are all lit', r);
  r = V.chokepoints; ok(r.firms.sort().join() === 'applied_materials,asm_international,asml,besi,kla,lam_research,tokyo_electron,zeiss_group,zeiss_smt' && /^9 firms of the tools layer\. The 8 with a published profit booked \$38\.5bn/.test(r.read) && r.s.k > 1.5, '4: the tools layer’s eight named firms and Zeiss, the parent of Zeiss SMT (Naura and AMEC are not in it)', r.firms);
  r = V.ring; ok(r.s.lit === 13 && r.list === 13 && /^13 stakes run between firms on the ring/.test(r.read) && /Stakes, not supply contracts\.$/.test(r.read) && ['Microsoft', 'Nvidia', 'SoftBank', 'Alphabet', 'ASML', 'Wingtech', 'Big Fund'].every(n => r.txt.includes(n)), '5: only the 13 stakes between ring firms; “stakes, not supply contracts”', r.read);
  r = V.votes; ok(r.firms.sort().join() === 'alphabet,arm,asm_international,baidu,besi,coreweave,meta,nexperia,spacex' && r.read.includes('Mark Zuckerberg, 13.4% of Meta’s shares and 60.6% of its votes') && /l-votes/.test(r.cls) && /pale band the votes/.test(r.txt), '6: the nine firms with votes data; the widest gap is Zuckerberg’s at Meta, 13.4% of the shares and 60.6% of the votes', r.read);
  { const L = D.firms.filter(f => f.usd < 0), tot = L.reduce((a, f) => a + f.usd, 0); r = V.losses; ok(r.firms.sort().join() === 'coreweave,intel,spacex,wingtech' && r.read.includes('4 firms booked losses of ' + money(-tot) + ' together') && r.read.includes('SpaceX −$4.9bn') && r.list === 4 && r.txt.includes('Elon Musk'), '7: CoreWeave, Intel, SpaceX and Wingtech, their losses and who holds them', r.read); }
  r = V.undisclosed; ok(r.s.inFirms === 37 && /^Of the \$921bn booked by 37 firms in profit, 79\.3% is dispersed or not disclosed\. Least named: Alibaba \(98\.5%\), Tokyo Electron \(95\.2%\), TSMC \(89\.7%\); fully named: (Zeiss, Huawei|Huawei, Zeiss)\./.test(r.read) && r.list === 37, '8: the 37 firms in profit, 79.3% not named, Alibaba first', r.read);
  await view('undisclosed');
  r = await p.evaluate(() => { const ang = id => { const m = /translate\(([-\d.]+),([-\d.]+)/.exec(document.querySelector('#isx-fw .fnode[data-id="f:' + id + '"]').getAttribute('transform')); return (Math.atan2(+m[2] - 464, +m[1] - 460) * 180 / Math.PI + 450) % 360; }; return [ang('alibaba'), ang('tokyo_electron'), ang('tsmc'), ang('microsoft'), ang('huawei')]; });
  ok(r[0] < r[1] && r[1] < r[2] && r[2] < r[3] && r[3] < r[4], '8: the ring is sorted by the share no filing names, clockwise from the top', r.map(a => Math.round(a)));
  r = V.earned; ok(r.s.inFirms === 14 && /^14 firms have 62 mapped sites in 14 countries/.test(r.read) && /Booked\s*WIP Preliminary: where the profits are booked is still being gathered\./.test(r.txt) && /l-earned/.test(r.cls) && r.s.by === 'country' && /Earned · sites by country/.test(r.txt) && /Owned · named holders/.test(r.txt), '9: the 14 sited firms with the three geographies; “booked” is empty and carries the WIP marker and its line', r.read);
  await view('earned');
  ok(await p.evaluate(() => !!document.querySelector('#isx-fw .fbook') && /WHERE IT IS BOOKED · WIP/.test(document.querySelector('#isx-fw .fbookt').textContent) && document.querySelectorAll('#isx-fw .fnode.country:not(.out)').length === 14), '9: on the picture “booked” is an empty, labelled ring between the firms and the 14 countries');
  await view('debt');
  ok(await p.evaluate(() => { const S = document.querySelector('#isx-fw svg'); return !S.classList.contains('flt') && S.querySelectorAll('.fnode.sector:not(.out)').length === 4 && S.querySelectorAll('.fk.off').length === 0; }), '10: the picture stays as it is at rest (the four sector rows, nothing lit or dimmed)');
  r = V.debt; ok(r.s.inFirms === 49 && /WIP/.test(r.k) && /WIP Preliminary: the debt figures are still being gathered\./.test(r.txt) && r.read.length > 60 && await p.evaluate(() => !document.querySelector('#isx-fw .wcard .fbars')), '10: a placeholder: its name, one line of what it will show, the WIP marker and “Preliminary: the debt figures are still being gathered”; no figures', r.txt.slice(0, 220));
  /* a view is a start: change a filter and it is your own; a lens stays while it is on */
  await view('state'); await p.evaluate(() => ISX.firms.set('fc', ['China'])); await p.waitForTimeout(150);
  r = await p.evaluate(() => ({ s: ISX.firms.state, hash: location.hash, k: document.querySelector('#isx-fw .wcard .wk3').textContent, back: !!document.querySelector('#isx-fw .wcard [data-fw="views"]') }));
  ok(r.s.view === '' && r.s.f.ht.join() === 'state' && r.s.f.fc.join() === 'China' && r.hash === '#circuit/firms=fc=china;ht=state' && /^Firms/.test(r.k) && r.back, 'a view fills the controls and a visitor changes them: “The state as shareholder” plus “China” is their own view, with its own address', r.hash);
  await view('losses'); await p.evaluate(() => ISX.firms.set('fc', ['United States'])); await p.waitForTimeout(150);
  r = await p.evaluate(() => ({ s: ISX.firms.state, hash: location.hash, read: document.querySelector('#isx-fw .fread').textContent }));
  ok(r.s.view === 'losses' && r.s.inFirms === 3 && r.hash === '#circuit/firms=v=losses;fc=united-states' && /^3 firms booked losses/.test(r.read), 'a filter on top of “Who carries the losses” keeps the view, and its line counts again', r.read);
  await p.click('#isx-fw .wcard [data-fw="views"]'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => { const s = ISX.firms.state; return s.view === '' && s.inFirms === 49 && document.querySelectorAll('#isx-fw .wcard .fvs .fv1').length === 10 && document.activeElement.classList.contains('fv1'); }), '“All ten views” leads back to the list, with the whole ring');
  await p.close();

  /* 12 · every combination has an address: write it, open it in a fresh page, the same state comes back */
  p = await open(c, '#circuit/firms'); await up(p);
  for (const h of ['#circuit/firms=country;L=foundry-memory,tools;ht=founder,state', '#circuit/firms=fc=netherlands,united-states;hc=norway;vs;L2=chip-design;ht2=manager', '#circuit/firms=type;v=earned;fc=netherlands', '#circuit/firms=v=votes;hc=united-states', '#circuit/firms=country;fc=united-states;vs;fc2=china;ht2=state', '#circuit/firms=v=claim', '#circuit/firms=country']) {
    /* one page, loaded afresh for each address (about:blank in between, so the address is read at boot) */
    const fresh = async hash => { await p.goto('about:blank'); await p.goto(base + hash, { waitUntil: 'domcontentloaded', timeout: 90000 }); await p.waitForFunction(() => window.ISX && ISX.booted && ISX.firms, null, { timeout: 90000 }); await up(p); await p.waitForTimeout(300); return p.evaluate(() => ({ hash: location.hash, s: ISX.firms.state })); };
    r = await fresh(h); const r2 = await fresh(r.hash), pickS = s => JSON.stringify([s.by, s.view, s.lens, s.cmp, s.split, s.f, s.g, s.inFirms, s.lit]);
    ok(r.hash === h && r2.hash === h && pickS(r.s) === pickS(r2.s) && r.s.inFirms > 0, 'round trip: ' + h, { got: r.hash, firms: r.s.inFirms, lit: r.s.lit });
  }
  await p.evaluate(() => ISX.firms.view(''));
  await p.evaluate(() => { location.hash = '#circuit/firms=v=chokepoints'; }); await p.waitForTimeout(400);
  ok(await p.evaluate(() => ISX.firms.state.view === 'chokepoints' && ISX.firms.state.inFirms === 9), 'an address that changes while the web is open changes the view');
  await p.evaluate(() => { location.hash = '#circuit/firms=fc=atlantis;zz=1;v=nothing'; }); await p.waitForTimeout(400);
  ok(await p.evaluate(() => ISX.firms.isOpen && ISX.firms.state.view === '' && ISX.firms.state.inFirms === 49), 'an address with values that do not exist opens the whole web');

  /* 13 · the WIP marker: one component, driven by the data, spoken with its visible word */
  r = await p.evaluate(() => { const hb = document.getElementById('isx-wip'), b = document.querySelector('#isx-fw .fv1[data-fwv="debt"]'), m = b.querySelector('.wipm'), hs = getComputedStyle(hb), ms = getComputedStyle(m); return { api: typeof ISX.wip.pill === 'function' && typeof ISX.wip.note === 'function', head: hb.getAttribute('aria-label'), btn: b.textContent, col: [hs.color, ms.color, hs.borderTopColor, ms.borderTopColor], fs: ms.fontSize, parts: ISX.firms.state.parts }; });
  ok(r.api && /WIP/.test(r.head) && /work in progress/i.test(r.head) && /Balance-sheet engineers.*WIP$/.test(r.btn) && r.col[0] === r.col[1] && r.col[2] === r.col[3] && parseFloat(r.fs) >= 10.5 && r.parts.debt.status === 'preliminary' && r.parts.booked.status === 'preliminary', 'the marker is the header pill’s amber, in the control that opens the view (so its spoken name contains “WIP”); the header pill’s spoken name now contains “WIP” too; the data says status: preliminary', r);
  r = await p.evaluate(() => { ISX.firms.state.parts.debt.status = 'final'; ISX.firms.view('debt'); const a = /WIP/.test(document.querySelector('#isx-fw .wcard').textContent); ISX.firms.view(''); const b = /WIP/.test(document.querySelector('#isx-fw .fv1[data-fwv="debt"]').textContent); ISX.firms.state.parts.debt.status = 'preliminary'; ISX.firms.view(''); return [a, b, /WIP/.test(document.querySelector('#isx-fw .fv1[data-fwv="debt"]').textContent)]; });
  ok(!r[0] && !r[1] && r[2], 'the marker follows the data: without status: preliminary it is not drawn, on the control or in the view', r);
  await p.close(); await c.close();

  /* 14 · movement: only on a change of state, then rest; calm and reduced motion swap at once */
  { const cm = await b.newContext({ viewport: { width: 1440, height: 900 } });
    await cm.addInitScript(() => { try { ['isx-first', 'isx-insights', 'isx-tour', 'isx-simtour', 'isx-tips-sim', 'isx-enter'].forEach(k => localStorage.setItem(k, 'off')); localStorage.setItem('isx-intro', '1'); localStorage.setItem('isx-hints-off', '1'); } catch (e) { /* ignore */ } });
    p = await open(cm, '#circuit/firms'); await up(p); await p.waitForTimeout(500);
    const at = id => p.evaluate(i => document.querySelector('#isx-fw .fnode[data-id="' + i + '"]').getAttribute('transform'), id);
    const busy = () => p.evaluate(() => ({ dots: document.querySelectorAll('#isx-fw .fd circle').length, run: document.querySelectorAll('#isx-fw .ftick.run').length, anim: document.querySelector('#isx-fw svg').getAnimations({ subtree: true }).filter(a => a.playState === 'running').length }));
    const loops0 = await p.evaluate(() => ISXP.loops().join());
    r = await busy(); ok(r.dots === 0 && r.run === 0 && r.anim === 0, 'at rest nothing moves', r);
    /* sampled inside the page, frame by frame, so a slow machine cannot hide the motion */
    const a0 = await at('f:microsoft'), seen = await p.evaluate(() => new Promise(res => { const g = document.querySelector('#isx-fw .fnode[data-id="f:microsoft"]'), out = [], t0 = performance.now(); ISX.firms.view('systems'); const f = () => { const v = g.getAttribute('transform'); if (out[out.length - 1] !== v) out.push(v); if (performance.now() - t0 < 1300) requestAnimationFrame(f); else res(out); }; requestAnimationFrame(f); }));
    const a2 = await at('f:microsoft'); await p.waitForTimeout(300); const a3 = await at('f:microsoft');
    ok(seen.length >= 4 && seen[0] === a0 && seen[seen.length - 1] === a2 && a0 !== a2 && a2 === a3, 'a change of view moves the marks there (the ring splits into two halves) and then rests', { frames: seen.length, from: a0, to: a2 });
    await p.evaluate(() => ISX.firms.view('')); await p.waitForTimeout(1000);
    ok(await at('f:microsoft') === a0, 'leaving the view closes the ring again: every mark is back where it was');
    await p.evaluate(() => ISX.firms.pick('h:BlackRock')); await p.waitForTimeout(350); r = await busy(); const t1 = await p.evaluate(() => { const t = document.querySelector('#isx-fw .ftiles .ftick'); return [t.textContent, t.dataset.t]; });
    await p.waitForTimeout(1500); const r2 = await busy(), t2 = await p.evaluate(() => { const t = document.querySelector('#isx-fw .ftiles .ftick'); return [t.textContent, t.dataset.t || null]; });
    ok(r.dots > 10 && r.dots <= 72 && r.run === 1 && t1[0] === t2[0] && t1[1] !== t1[0] && r2.dots === 0 && r2.run === 0 && t2[1] === null, 'picking a holder sends a few dots along its lines once, the figure runs up as they arrive, then rest (the text a screen reader hears is the final figure throughout)', { during: r, t1, after: r2 });
    await p.evaluate(() => { ISX.firms.pick(null); document.querySelector('#isx-fw .fv1[data-fwv="claim"]').click(); }); await p.waitForTimeout(420); r = await busy(); const s1 = await p.evaluate(() => { const t = document.querySelector('#isx-fw .fread .ftick'); return [t.textContent, t.dataset.t]; });
    await p.waitForTimeout(3200); const s2 = await p.evaluate(() => { const t = document.querySelector('#isx-fw .fread .ftick'); return [t.textContent, t.dataset.t || null]; }), r3 = await busy();
    ok(r.anim > 0 && r.run === 1 && s1[0] === '$6.4bn' && s1[1] !== '$6.4bn' && s2[1] === null && r3.anim === 0 && r3.run === 0, 'view 1 is a sweep: the lines to US holders draw in one after another and end on the running total', { s1, s2, anim: r.anim });
    await p.evaluate(() => ISX.firms.view('')); await p.waitForTimeout(900);
    await p.click('#isx-fw [data-fw="calm"]'); const c0 = await at('f:microsoft'); await p.evaluate(() => ISX.firms.view('systems')); const c1 = await at('f:microsoft'); await p.waitForTimeout(600); const c2 = await at('f:microsoft');
    await p.evaluate(() => ISX.firms.pick('h:BlackRock')); await p.waitForTimeout(200); r = await busy();
    ok(c0 !== c1 && c1 === c2 && c1 === a2 && r.dots === 0 && r.run === 0 && r.anim === 0, 'with “Calm” on, a change is an instant swap and nothing flows', { c1, c2, r });
    ok(await p.evaluate(() => ISXP.loops().join()) === loops0, 'no loop was added: nothing here runs on its own');
    await p.close(); await cm.close();
    c = await ctx(1440, 900); p = await open(c, '#circuit/firms'); await up(p);
    const m0 = await at('f:microsoft'); await p.evaluate(() => ISX.firms.view('systems')); const m1 = await at('f:microsoft'); await p.evaluate(() => ISX.firms.pick('h:BlackRock')); await p.waitForTimeout(150); r = await busy();
    ok(m0 !== m1 && m1 === a2 && r.dots === 0 && r.run === 0 && r.anim === 0, 'under reduced motion every change is an instant swap, to the same picture', r);
    await p.close(); await c.close(); }

  /* 10 · errors */
  ok(errs.length === 0, 'no page errors', errs);
  await b.close();
  console.log(`${n - fail} of ${n} checks pass`); process.exit(fail ? 1 : 0);
})();
