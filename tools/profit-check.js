/* Checks for profit tab build 1 (17 Nov 2026): the profit dollar as its own tab.
   Usage: node tools/profit-check.js [baseUrl]. Needs `python3 -m http.server 8731` at the repo root. Exits 1 on a failed check.
   1 the tab and its route · 2 every station and view draws one chart with a text alternative, a table and no page error ·
   3 the layout at five sizes (no sideways scroll; from 1200 px wide the board ends above the bar; on phones the statistics come first) ·
   4 links in and out, the locked doors, the ring's fourth door · 5 the name lines are gone and the credit line is there · 6 hints */
const { chromium } = require('playwright');
const base = process.argv.slice(2).find(a => /^https?:/.test(a)) || 'http://127.0.0.1:8731/imperial-stack/';
let fail = 0, n = 0;
const ok = (c, t) => { n++; if (!c) { fail++; console.log('FAIL  ' + t); } else if (process.env.V) console.log('ok    ' + t); };
(async () => {
  const b = await chromium.launch(), errs = [];
  const ctx = async (w, h, tips) => { const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 600, hasTouch: w < 600, reducedMotion: 'reduce' }); await c.addInitScript(t => { try { ['isx-first', 'isx-insights', 'isx-tour', 'isx-simtour'].forEach(k => localStorage.setItem(k, 'off')); localStorage.setItem('isx-open-circuit', '1'); localStorage.setItem('isx-open-sim', '1'); if (!t) localStorage.setItem('isx-tips-sim', 'off'); } catch (e) {} }, !!tips); return c; };
  const open = async (c, hash) => { const p = await c.newPage(); p.on('pageerror', e => errs.push(hash + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_|Failed to load/.test(m.text())) errs.push(hash + ' console: ' + m.text()); }); await p.goto(base + hash, { waitUntil: 'load' }); await p.waitForFunction(() => window.ISX && ISX.booted, null, { timeout: 60000 }); return p; };
  const ready = p => p.waitForFunction(() => ISX.profit && ISX.profit.state.ready, null, { timeout: 30000 });

  /* 1 · the tab and its route */
  let c = await ctx(1440, 900), p = await open(c, '#circuit');
  ok(await p.evaluate(() => [...document.querySelectorAll('#isx-strip .seg > button')].map(b => b.id).join()) === 'isx-v-map,isx-v-profit,isx-v-arm,isx-v-fin,isx-v-story,isx-v-crisis', 'the tab is second, after the Circuit');
  await p.click('#isx-v-profit'); await ready(p);
  ok(await p.evaluate(() => ISX.view === 'profit' && location.hash === '#profit' && !document.getElementById('isx-scene-profit').hidden && document.getElementById('isx-scene-map').hidden), 'the pill opens the tab at #profit');
  ok(await p.evaluate(() => ISX.profit.stations.map(s => s.id + ':' + s.views.length).join()) === 'profits:4,claims:5,regime:4,ai:4', 'four stations, 17 views');
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => ISX.profit.state.st === 'claims' && location.hash === '#profit/claims'), '→ steps to the next station and the link follows');
  await p.click('#isx-tabs [data-rt-t="2"]'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => ISX.profit.state.st === 'regime' && document.querySelector('#isx-tabs [aria-current="step"]').textContent.includes('The regime')), 'a station in the bar opens it');
  await p.goBack(); await p.waitForTimeout(300);
  ok(await p.evaluate(() => ISX.view === 'map'), 'Back leaves the tab (stations replace the entry)');
  await p.close();
  p = await open(c, '#profit/regime/pos'); await ready(p);
  ok(await p.evaluate(() => { const s = ISX.profit.state; return s.st === 'regime' && s.view === 'pos' && /Station 3 · The regime · Positions/.test(ISX.whereNow().where); }), 'a link opens its station and view; the mistake reference names them');

  /* 2 · every view */
  const all = await p.evaluate(() => ISX.profit.stations.flatMap((s, i) => s.views.map(v => [i, v])));
  for (const [i, v] of all) {
    const r = await p.evaluate(([i, v]) => { ISX.profit.go(i, v); const f = document.getElementById('isx-pf-fig'), s = f.querySelectorAll('svg'), R = {}; R.svg = s.length; R.aria = s[0] ? (s[0].getAttribute('aria-label') || '').length : 0; R.h3 = document.getElementById('isx-pf-title').textContent.length; R.nan = /NaN|undefined/.test(f.innerHTML + document.getElementById('isx-pf-tiles').textContent + document.getElementById('isx-pf-reading').textContent);
      document.getElementById('isx-pf-table').click(); const t = f.querySelectorAll('table'); R.rows = t.length ? t[0].querySelectorAll('tbody tr').length : 0; R.cap = t.length ? t[0].caption.textContent.length : 0; R.tnan = /NaN|undefined/.test(f.textContent); document.getElementById('isx-pf-table').click(); R.back = f.querySelectorAll('svg').length; return R; }, [i, v]);
    ok(r.svg === 1 && r.aria > 80 && r.h3 > 8 && !r.nan, 'view ' + v + ': one chart with a text alternative');
    ok(r.rows >= 3 && r.cap > 30 && !r.tnan && r.back === 1, 'view ' + v + ': a table view, and back');
  }
  ok(await p.evaluate(() => { ISX.profit.go(2, 'all'); const i = document.querySelector('#isx-pf-scrub input'); i.value = 2009; i.dispatchEvent(new Event('input', { bubbles: true })); return ISX.profit.state.year === 2009 && /^=?\s*8\.4%/.test(document.querySelector('#isx-pf-tiles .big .v').textContent) && /2009:/.test(document.getElementById('isx-pf-reading').textContent); }), 'the year slider moves the tiles and the reading (2009: 8.4%)');
  ok(await p.evaluate(() => { document.querySelector('[data-pe="3"]').click(); const t = [...document.querySelectorAll('#isx-pf-tiles .pf-tile .v')].map(e => e.textContent.trim()); return t[0] === '10.2%' && t[2] === '6.3' && t[1] === '4.5'; }), 'an era gives its average (2014–25: 10.2 = … 4.5 … 6.3)');
  ok(await p.evaluate(() => { ISX.profit.go(2, 'all'); return !!document.querySelector('#isx-pf-text dfn.df[data-d="bothways"]') && ISX.defs.bothways[1].includes('Autor, Dorn and Hanson'); }), 'the causation note is a term tip on “runs both ways”');
  await p.close(); await c.close();

  /* 3 · the layout */
  for (const [w, h] of [[1440, 900], [1366, 768], [1280, 760], [1024, 768], [390, 800]]) {
    c = await ctx(w, h); p = await open(c, '#profit/regime'); await ready(p); await p.waitForTimeout(300);
    for (const [i, v] of [[0, 'pic'], [2, 'all'], [2, 'ord'], [3, 'capex']]) {
      const r = await p.evaluate(([i, v]) => { ISX.profit.go(i, v); window.scrollTo(0, 0); const q = s => document.querySelector(s).getBoundingClientRect(), bd = q('#isx-pf-board'), bar = q('#isx-tabs'), tx = q('#isx-pf-text'), fg = q('#isx-pf-fig'), tl = q('#isx-pf-tiles'); return { sx: document.documentElement.scrollWidth - window.innerWidth, board: bd.bottom, bar: bar.top, barB: bar.bottom, text: tx.top, fig: fg.height, figTop: fg.top, tiles: tl.top, vh: window.innerHeight, bw: bd.width, sw: document.getElementById('isx-scene-profit').clientWidth }; }, [i, v]);
      ok(r.sx <= 0, w + ' ' + v + ': no sideways scroll');
      ok(r.barB <= r.vh + 1 && r.bar > r.vh - 130, w + ' ' + v + ': the bar stays at the foot of the screen');
      ok(r.text > r.board && r.bw > r.sw - 60, w + ' ' + v + ': the board takes the full width and the text sits under it');
      if (w > 1180 && h >= 760) ok(r.board <= r.bar + 2 && r.fig >= 250, w + ' ' + v + ': the board ends above the bar (chart ' + Math.round(r.fig) + ' px)');
      if (w <= 760) ok(r.fig >= 290 && (v !== 'all' || r.tiles < r.figTop), w + ' ' + v + ': statistics first, chart ' + Math.round(r.fig) + ' px');
    }
    await p.close(); await c.close();
  }

  /* 4 · links in and out */
  c = await ctx(1440, 900); p = await open(c, '#circuit');
  await p.evaluate(() => ISX.setRing(true)); await p.waitForTimeout(400);
  ok(await p.evaluate(() => [...document.querySelectorAll('.rgdoor')].map(a => a.dataset.door).join()) === 'profit,simulator,arm,scenarios', 'the ring has four doors, the profit dollar first');
  await p.click('.rgdoor[data-door="profit"]'); await ready(p);
  ok(await p.evaluate(() => ISX.view === 'profit'), 'the ring’s door opens the tab');
  ok(await p.evaluate(() => { ISX.profit.go(0); const a = document.querySelectorAll('#isx-pf-text .pf-door.lock'); ISX.profit.go(1); const b = document.querySelectorAll('#isx-pf-text .pf-door.lock'); ISX.profit.go(2); const d = document.querySelectorAll('#isx-pf-text .pf-door.lock'); return a.length === 1 && b.length === 1 && d.length === 1 && /coming soon/.test(d[0].textContent) && !d[0].matches('button, a'); }), 'three locked Atlas doors, none of them a control');
  ok(await p.evaluate(() => { ISX.profit.go(3); return [...document.querySelectorAll('#isx-pf-text [data-pgo]')].map(b => b.dataset.pgo).join(); }) === 'simulator,arm,scenarios', 'station 4 has three doors out');
  await p.click('#isx-pf-text [data-pgo="arm"]'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => ISX.view === 'arm'), 'a door out opens its tab');
  await p.evaluate(() => { ISX.setView('profit'); ISX.profit.go(3); }); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => ISX.view === 'fin'), 'Next after station 4 goes on to the imperial machinery');
  ok(await p.evaluate(() => { const s = document.documentElement.innerHTML; return (s.match(/go: \['profit\/(regime|ai)'/g) || []).length === 3; }), 'three cards of the machinery link into the tab');
  await p.close();
  p = await open(c, '#simulator'); await p.evaluate(() => { sessionStorage.setItem('isx-sim-pos', JSON.stringify({ l: 13, b: 9 })); }); await p.reload(); await p.waitForFunction(() => window.ISX && ISX.booted); await p.waitForTimeout(800);
  const lk = await p.evaluate(() => { const a = document.querySelector('#isx-cock .pf-in a, #isx-fin .pf-in a'); return a ? a.getAttribute('href') : null; });
  ok(lk === '#profit/regime', 'the primer’s “Deficits become profits” links to station 3 (' + lk + ')');
  if (lk) { await p.evaluate(() => { location.hash = '#profit/regime'; }); await ready(p); ok(await p.evaluate(() => ISX.view === 'profit' && ISX.profit.state.st === 'regime'), 'and the link opens it'); }

  /* 5 · the name lines */
  const src = await p.evaluate(async () => { const t = await (await fetch('/imperial-stack/index.html')).text(), v = await (await fetch('/imperial-stack/v2/views.js')).text(), f = await (await fetch('/imperial-stack/v2/profit.js')).text(); return { t, v, f }; });
  const bad = /Rutten’s reading|Rutten’s term|In Rutten’s|reading Elias Rutten shares|shared by Elias Rutten|after Elias Rutten|Whose reading: Elias|Reading · Elias/;
  ok(!bad.test(src.t.slice(src.t.indexOf('<script>', 100000))) && !bad.test(src.v) && !/Rutten/.test(src.f.replace(/\/\*[\s\S]*?\*\//g, '')), 'no reading carries Elias’s name (page, deeper views, the tab)');
  ok(/That is the thesis of the author, Elias Rutten\./.test(src.t) && (src.t.match(/Unless a named author is credited, the readings on this map are the author’s\./g) || []).length === 2, 'the thesis sentence stays; the credit line is in both About boxes');
  ok(/Elias Rutten, “The house always prints” \(18 Sep 2026\)/.test(src.t) && /Elias Rutten, “Why Oil Falls When Pipelines Burn” \(10 Nov 2026\)/.test(src.t), 'citations of his essays stay');
  await p.close(); await c.close();

  /* 6 · hints at first use */
  c = await ctx(1440, 900, true); p = await open(c, '#profit'); await ready(p); await p.waitForTimeout(2600);
  ok(await p.evaluate(() => ISX.hints.on) === 'pf-table', 'first visit: the table hint');
  await p.evaluate(() => ISX.profit.go(2)); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => ISX.hints.on) === 'pf-tile', 'a station with tiles: the tile hint');
  await p.evaluate(() => ISX.hints.close()); await p.evaluate(() => ISX.profit.go(2, 'sum')); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => ISX.hints.on) === 'pf-year', 'a view with the slider: the year hint');
  await p.evaluate(() => { const i = document.querySelector('#isx-pf-scrub input'); i.value = 2000; i.dispatchEvent(new Event('input', { bubbles: true })); }); await p.waitForTimeout(400);
  ok(await p.evaluate(() => ISX.hints.on) === null && await p.evaluate(() => ISX.hints.ids.filter(i => ISX.hints.tabs[i] === 'profit').length) === 3, 'it ends when the year is moved; three hints belong to the tab');
  await c.close();

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 4).join(' | ') : ''));
  console.log((fail ? fail + ' FAILED of ' : 'all passed: ') + n + ' checks');
  await b.close(); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
