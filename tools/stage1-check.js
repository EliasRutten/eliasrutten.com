/* Stage 1 behaviour checks for the v2 systems (seam, link state, first moment, insights, reading notes, footprints, loops).
   Usage: node tools/stage1-check.js [baseUrl]   — needs `python3 -m http.server 8731` at the repo root. Exits 1 on a failed check. */
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8731/imperial-stack/';
let fails = 0;
const ok = (name, cond, extra) => { if (!cond) fails++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 260) : '')); };
(async () => {
  const b = await chromium.launch();
  const page = async (hash, ls = {}, opts = {}) => {
    const c = await b.newContext({ viewport: { width: opts.w || 1440, height: opts.h || 900 }, deviceScaleFactor: 1, reducedMotion: opts.reduce ? 'reduce' : 'no-preference' });
    await c.addInitScript(o => { try { localStorage.setItem('isx-tips-globe', 'off'); localStorage.setItem('isx-tour', 'off'); localStorage.setItem('isx-tips-sim', 'off'); Object.keys(o).forEach(k => localStorage.setItem(k, o[k])); } catch (e) {} }, ls);
    const p = await c.newPage(); p._errs = []; p.on('pageerror', e => p._errs.push(String(e).slice(0, 200)));
    await p.goto(base + hash, { waitUntil: 'load' });
    await p.waitForFunction(() => window.ISX && ISX.booted && ISX.globe && ISX.own && ISX.own.data, null, { timeout: 60000 });
    await p.waitForTimeout(opts.wait || 1500);
    return p;
  };
  const cls = (p, c) => p.evaluate(k => document.getElementById('isx-root').classList.contains(k), c);

  /* 1. first moment */
  let p = await page('', {}, { wait: 500 });
  ok('first moment: the entry screen does not open', !(await p.evaluate(() => !!document.querySelector('.intro6'))));
  ok('first moment: controls are quiet at first', await cls(p, 'isx-quiet'));
  await p.waitForTimeout(1500);
  ok('first moment: one line is shown', await p.evaluate(() => !!document.querySelector('#isx-insight.in.first')), await p.evaluate(() => (document.querySelector('#isx-insight .it') || {}).textContent));
  await p.waitForTimeout(3600);
  ok('first moment: controls settle in on their own', !(await cls(p, 'isx-quiet')));
  await p.click('#isx-insight .ig'); await p.waitForTimeout(900);
  ok('first moment: “Follow the dollar” opens step 01', await p.evaluate(() => ISX.step === 1 && location.hash === '#circuit/01'), await p.evaluate(() => location.hash));
  ok('first moment: remembered as seen', await p.evaluate(() => localStorage.getItem('isx-first') === 'off'));
  await p.click('#isx-about'); await p.waitForTimeout(600);
  ok('“About this map” still opens the entry text', await p.evaluate(() => !!document.querySelector('.intro6')));
  ok('no page errors (first moment)', p._errs.length === 0, p._errs); await p.context().close();

  /* 2. a first touch settles the controls at once; a deep link shows no first moment */
  p = await page('', {}, { wait: 300 }); await p.mouse.click(700, 500); await p.waitForTimeout(200);
  ok('first moment: a touch settles the controls', !(await cls(p, 'isx-quiet'))); await p.context().close();
  p = await page('#circuit/07', {}, { wait: 2500 });
  ok('deep link: no first moment, step restored', await p.evaluate(() => ISX.step === 7 && !document.querySelector('#isx-insight.in.first')), await p.evaluate(() => location.hash)); await p.context().close();

  /* 3. link state and sharing */
  p = await page('#circuit', { 'isx-first': 'off', 'isx-insights': 'off' });
  for (let i = 0; i < 4; i++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(250); }
  ok('link follows the step', await p.evaluate(() => location.hash === '#circuit/04'), await p.evaluate(() => location.hash));
  await p.evaluate(() => ISX.select('CHN')); await p.waitForTimeout(500);
  ok('link follows the country', await p.evaluate(() => location.hash === '#circuit/04/c=chn'));
  await p.evaluate(() => document.getElementById('isx-share').click()); await p.waitForTimeout(400);
  ok('share sheet names the view and carries the full link', await p.evaluate(() => /step 04/.test(document.querySelector('.shpop .shn').textContent) && /#circuit\/04\/c=chn$/.test(document.querySelector('.shpop .shu').textContent)), await p.evaluate(() => document.querySelector('.shpop .shn').textContent + ' | ' + document.querySelector('.shpop .shu').textContent));
  ok('reading notes: the country card lists them', await p.evaluate(() => document.querySelectorAll('#isx-card .care2 li').length >= 3), await p.evaluate(() => document.querySelectorAll('#isx-card .care2 li').length));
  await p.evaluate(() => ISX.select(null)); await p.waitForTimeout(700);
  ok('reading notes: a diamond on the labels, a broken track on the flows', await p.evaluate(() => document.querySelectorAll('.glab.nu').length >= 1 && ISX.globe.arcsData().some(a => a.care)), await p.evaluate(() => [...document.querySelectorAll('.glab.nu')].map(e => e.dataset.nu)));
  await p.goto(base + '#simulator'); await p.waitForTimeout(800);
  ok('old tab links still work', await p.evaluate(() => ISX.view === 'fin' && location.hash === '#simulator'));
  ok('no page errors (links)', p._errs.length === 0, p._errs); await p.context().close();

  /* 4. footprint */
  p = await page('#circuit/03', { 'isx-first': 'off', 'isx-insights': 'off' });
  await p.evaluate(() => { const f = document.querySelector('#isx-firmsbox > .fold6'); if (f.getAttribute('aria-expanded') === 'false') f.click(); document.getElementById('isx-ftab-eu').click(); }); await p.waitForTimeout(300);
  ok('firms panel: mapped firms carry a dot', await p.evaluate(() => document.querySelectorAll('#isx-firmlist .firm.mapped').length >= 5), await p.evaluate(() => [...document.querySelectorAll('#isx-firmlist .firm.mapped')].map(e => e.dataset.name)));
  await p.evaluate(() => document.querySelector('#isx-firmlist .firm[data-name="Besi"]').click()); await p.waitForTimeout(2600);
  ok('footprint: seat, sites and owner on the globe', await p.evaluate(() => document.querySelectorAll('.glab.own.seat').length === 1 && document.querySelectorAll('.glab.own.site').length === 6 && document.querySelectorAll('.glab.own.holder').length === 1));
  ok('footprint: the floating card is the firm', await p.evaluate(() => document.getElementById('isx-t-h').textContent === 'BE Semiconductor Industries N.V.' && document.getElementById('isx-t-v').textContent === '20%'), await p.evaluate(() => document.getElementById('isx-t-v').textContent));
  ok('footprint: the card under the map lists owners, sites, sources', await p.evaluate(() => document.querySelectorAll('#isx-c-firm .ownd dt').length >= 5 && document.querySelectorAll('#isx-c-firm .ownl.srcs a').length >= 1));
  ok('footprint: the seat stays well inside the picture', await p.evaluate(() => { const v = ISX.globe.pointOfView(), o = ISX.own.data.firms.Besi.seat.ll, R = Math.PI / 180; const d = Math.acos(Math.sin(v.lat * R) * Math.sin(o[0] * R) + Math.cos(v.lat * R) * Math.cos(o[0] * R) * Math.cos((v.lng - o[1]) * R)) / R; return d < 46 && v.altitude >= 1.45 && v.altitude <= 2.71; }));
  await p.click('#isx-t-x .ownc[data-iso="MYS"]'); await p.waitForTimeout(1900);
  ok('footprint: a country in the card turns the globe to the sites there', await p.evaluate(() => { const v = ISX.globe.pointOfView(); return Math.abs(v.lat - 3.07) < 2 && Math.abs(v.lng - 101.5) < 2 && v.altitude < 1.75; }), await p.evaluate(() => JSON.stringify(ISX.globe.pointOfView())));
  ok('footprint: link holds the firm', await p.evaluate(() => location.hash === '#circuit/03/firm=besi'), await p.evaluate(() => location.hash));
  await p.evaluate(() => document.querySelector('#isx-c-firm [data-own="firm"]').click()); await p.waitForTimeout(1500);
  ok('footprint: an owner that is itself mapped opens from the card', await p.evaluate(() => ISX.sel.firm && ISX.sel.firm.name === 'Applied Materials'));
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(900);
  ok('footprint: stepping on brings the step back', await p.evaluate(() => !ISX.sel.firm && ISX.step === 4 && !document.querySelector('.glab.own') && !document.getElementById('isx-root').classList.contains('own-on')));
  await p.evaluate(() => { const f = ISX.data.FIRMS.find(x => x.name === 'Palantir'); ISX.select(f.iso, f); }); await p.waitForTimeout(600);
  ok('a firm that is not mapped says so', await p.evaluate(() => /not yet mapped/.test((document.querySelector('#isx-c-firm .ownno') || {}).textContent || '')));
  ok('no page errors (footprint)', p._errs.length === 0, p._errs); await p.context().close();

  /* 5. insights: shown once, leave with their step, can be switched off */
  p = await page('#circuit', { 'isx-first': 'off' });
  await p.evaluate(() => ISX.setStep(6)); await p.waitForTimeout(1900);
  ok('insight: shown at a key step', await p.evaluate(() => !!document.querySelector('#isx-insight.in.care')), await p.evaluate(() => (document.querySelector('#isx-insight .it') || {}).textContent));
  ok('insight: does not take focus and is a status message', await p.evaluate(() => !document.getElementById('isx-insight').contains(document.activeElement) && document.getElementById('isx-insight').getAttribute('role') === 'status'));
  await p.evaluate(() => ISX.setStep(5)); await p.waitForTimeout(700);
  ok('insight: leaves when the reader steps on', await p.evaluate(() => !document.querySelector('#isx-insight.in')));
  await p.evaluate(() => document.querySelector('[data-ins="toggle"]').click()); await p.waitForTimeout(200);
  await p.evaluate(() => ISX.setStep(7)); await p.waitForTimeout(1900);
  ok('insight: switched off stays off', await p.evaluate(() => !document.querySelector('#isx-insight.in') && localStorage.getItem('isx-insights') === 'off'));
  ok('no page errors (insights)', p._errs.length === 0, p._errs); await p.context().close();

  /* 6. loops and reduced motion */
  p = await page('#simulator', { 'isx-first': 'off', 'isx-sim-mode': 'full' });
  ok('loops: three registered', await p.evaluate(() => ISXP.loops().join(',') === 'globe,arm,sim'), await p.evaluate(() => ISXP.loops()));
  const moving = async () => { const a = await p.evaluate(() => [...document.querySelectorAll('#isx-fpart circle')].slice(0, 3).map(c => c.getAttribute('cx'))); await p.waitForTimeout(400); const b2 = await p.evaluate(() => [...document.querySelectorAll('#isx-fpart circle')].slice(0, 3).map(c => c.getAttribute('cx'))); return a.join() !== b2.join(); };
  await p.evaluate(() => document.getElementById('isx-scene-fin').scrollIntoView()); await p.waitForTimeout(600);
  ok('loops: simulator particles move while on screen', await moving());
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(900);
  ok('loops: simulator particles pause when scrolled out of view', !(await moving()));
  await p.evaluate(() => document.getElementById('isx-scene-fin').scrollIntoView()); await p.waitForTimeout(900);
  ok('loops: and resume', await moving());
  await p.goto(base + '#arm'); await p.waitForTimeout(600);
  await p.evaluate(() => document.getElementById('isx-scene-arm').scrollIntoView({ block: 'center' })); await p.waitForTimeout(1200);
  const armSnap = () => p.evaluate(() => { const c = document.getElementById('isx-cv-arm'); return c ? c.toDataURL() : ''; });
  const a1 = await armSnap(); await p.waitForTimeout(500); const a2 = await armSnap();
  ok('loops: the Arm’s particles move while its tab is open', a1 && a1 !== a2);
  await p.goto(base + '#capital-stack'); await p.waitForTimeout(1200);
  const coins = async () => { const q = () => p.evaluate(() => [...document.querySelectorAll('#isx-dpart circle')].slice(0, 3).map(c => c.getAttribute('cx'))); const a = await q(); await p.waitForTimeout(400); const b2 = await q(); return a.length > 0 && a.join() !== b2.join(); };
  await p.evaluate(() => { const e = document.getElementById('isx-anat'); if (e) e.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(700);
  ok('loops: the capital stack’s deal diagram moves too', await coins());
  await p.goto(base + '#simulator'); await p.waitForTimeout(900);
  await p.emulateMedia({ reducedMotion: 'reduce' }); await p.waitForTimeout(900);
  ok('reduced motion, switched on while open: particles stop', !(await moving()) && await p.evaluate(() => ISX.reduce === true));
  ok('reduced motion: still particles sit on their paths, not in a corner', await p.evaluate(() => { const c = [...document.querySelectorAll('#isx-fpart circle')]; return c.length > 0 && c.every(x => +x.getAttribute('cx') > 5 && +x.getAttribute('cy') > 5); }));
  await p.evaluate(() => document.querySelector('#isx-fin .lv').click()); await p.waitForTimeout(400);
  ok('reduced motion: and stay placed after a lever is pulled', await p.evaluate(() => { const c = [...document.querySelectorAll('#isx-fpart circle')]; return c.length > 0 && c.every(x => +x.getAttribute('cx') > 5 && +x.getAttribute('cy') > 5); }));
  await p.goto(base + '#circuit/04'); await p.waitForTimeout(1500);
  ok('reduced motion: no rings, no moving streams on the globe', await p.evaluate(() => ISX.globe.ringsData().length === 0 && ISX.globe.arcsData().every(a => !a.time)));
  ok('no page errors (loops)', p._errs.length === 0, p._errs); await p.context().close();

  /* 7. phone */
  p = await page('#circuit/03/firm=besi', { 'isx-first': 'off', 'isx-insights': 'off' }, { w: 390, h: 844, wait: 2500 });
  ok('phone: no sideways scroll with a footprint', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  ok('phone: the viewing chip is one line', await p.evaluate(() => document.getElementById('isx-vchip').getBoundingClientRect().height < 60), await p.evaluate(() => Math.round(document.getElementById('isx-vchip').getBoundingClientRect().height)));
  await p.context().close();
  await b.close();
  console.log(fails ? fails + ' check(s) failed' : 'all checks passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CHECK CRASHED', e); process.exit(1); });
