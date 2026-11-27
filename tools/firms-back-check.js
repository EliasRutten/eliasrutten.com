/* Checks for the firm web's way back (FW-back, 27 Nov 2026): the “← Back” button in the bar (v2/firms.js, v2/firms.css) and the browser's Back and Forward.
   Usage: node tools/firms-back-check.js [base]. base is the page's address: http://127.0.0.1:8731/imperial-stack/ (the default; needs
   `python3 -m http.server 8731` at the repo root) or the single-file build, e.g. file:///tmp/art.html (tools/artifact-build.py; the browser's own history is
   then the file's, and the checks that use it still hold). Exits 1 on a failed check.
   1 the button: first in the bar, labelled, dim and inert when there is nothing to undo · 2 each change is one step (a view, a filter, the compare switch, a type or
   country sum, Clear, a pick) and Back undoes them one at a time, in order, to the start · 3 focus stays on the button · 4 the browser's Back and Forward walk
   the same steps, and the two never disagree (the button, then the browser, then the button) · 5 the browser's Back from the first step closes the web onto the
   Circuit · 6 a page that cannot write history (a sandboxed frame): the button works alone · 7 sizes: one row at 1280, the button 44 px high on a phone, no
   overflow at 390 · 8 reduced motion · 9 no page errors */
const { chromium } = require('playwright');
const base = process.argv.slice(2).find(a => /^(https?|file):/.test(a)) || 'http://127.0.0.1:8731/imperial-stack/';
let fail = 0, n = 0;
const ok = (c, t, x) => { n++; if (!c) { fail++; console.log('FAIL  ' + t + (x !== undefined ? '  ' + JSON.stringify(x) : '')); } else if (process.env.V) console.log('ok    ' + t); };
(async () => {
  const b = await chromium.launch(), errs = [];
  const ctx = async (w, h, o) => { const c = await b.newContext(Object.assign({ viewport: { width: w, height: h }, isMobile: w < 600, hasTouch: w < 600, reducedMotion: 'reduce' }, o || {})); await c.addInitScript(() => { try { ['isx-first', 'isx-insights', 'isx-tour', 'isx-simtour', 'isx-tips-sim', 'isx-enter'].forEach(k => localStorage.setItem(k, 'off')); localStorage.setItem('isx-intro', '1'); localStorage.setItem('isx-hints-off', '1'); } catch (e) { /* ignore */ } }); return c; };
  const open = async (c, hash) => { const p = await c.newPage(); p.on('pageerror', e => errs.push(hash + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_|Failed to load/.test(m.text())) errs.push(hash + ' console: ' + m.text().slice(0, 200)); }); await p.goto(base + hash, { waitUntil: 'domcontentloaded', timeout: 90000 }); await p.waitForFunction(() => window.ISX && ISX.booted && ISX.firms, null, { timeout: 90000 }); await p.waitForTimeout(500); return p; };
  const up = p => p.waitForFunction(() => ISX.firms.isOpen && ISX.firms.state.firms > 0, null, { timeout: 30000 });
  const st = p => p.evaluate(() => ({ a: ISX.firms.addr, steps: ISX.firms.state.steps, sel: ISX.firms.state.sel, view: ISX.firms.state.view, cmp: ISX.firms.state.cmp, hash: location.hash, open: ISX.firms.isOpen, dis: (document.querySelector('#isx-fw .fback') || { getAttribute: () => null }).getAttribute('aria-disabled'), foc: document.activeElement && document.activeElement.className }));
  const settle = p => p.waitForTimeout(700);
  const view = async (p, id) => {   /* on a desktop the ten views are on the card at rest; on a phone they are in the “Ten views” panel */
    if (await p.locator('#isx-fw .fvw').isVisible()) { await p.click('#isx-fw [data-fwp="views"]'); await p.waitForTimeout(120); await p.click('#isx-fw .fpan [data-fwv="' + id + '"]'); }
    else { if (!(await p.locator('#isx-fw .wcard [data-fwv="' + id + '"]').count())) { await p.click('#isx-fw .wcard [data-fw="views"]'); await p.waitForTimeout(150); } await p.click('#isx-fw .wcard [data-fwv="' + id + '"]'); }
    await settle(p);
  };
  const chip = async (p, k, v) => { await p.click('#isx-fw [data-fwp="' + k + '"]'); await p.waitForTimeout(120); await p.click('#isx-fw .fopt[data-fwo="' + k + '"][data-v="' + v + '"]'); await p.click('#isx-fw [data-fw="pan"]'); await settle(p); };

  /* 1 · the button, and the steps */
  let c = await ctx(1440, 900), p = await open(c, '#circuit');
  await p.click('#isx-tp-firms'); await p.waitForTimeout(300); await p.click('#isx-tray-firms .t2fw'); await up(p); await settle(p);
  const hist0 = await p.evaluate(() => history.length);
  let r = await p.evaluate(() => { const bar = document.querySelector('#isx-fw .fwbar'), b = bar.firstElementChild; return { cls: b.className, txt: b.textContent, name: b.getAttribute('aria-label'), tag: b.tagName, dis: b.getAttribute('aria-disabled'), op: getComputedStyle(b).opacity, h: Math.round(b.getBoundingClientRect().height) }; });
  ok(/fback/.test(r.cls) && r.tag === 'BUTTON' && /←\s*Back/.test(r.txt) && /^Back/.test(r.name) && r.name.indexOf('Back') >= 0, 'the first thing in the bar is a button labelled “← Back”, its spoken name starts with the same word', r);
  ok(r.dis === 'true' && +r.op < .6, 'with nothing to undo it is dim and says so (aria-disabled), and keeps its place', r);
  let s = await st(p);
  ok(s.steps === 0 && s.hash === '#circuit/firms', 'a freshly opened web has no step to undo', s);
  await p.click('#isx-fw .fback', { force: true }); await settle(p); s = await st(p);
  ok(s.open && s.hash === '#circuit/firms' && s.steps === 0, 'pressing it while dim does nothing', s);
  ok(await p.evaluate(() => history.length) === hist0, 'and writes no history');

  const seq = [await st(p)];
  await view(p, 'state'); seq.push(await st(p));
  await chip(p, 'fc', 'China'); seq.push(await st(p));
  await p.click('#isx-fw [data-fw="cmp"]'); await settle(p); seq.push(await st(p));
  await p.click('#isx-fw [data-fwp="fc"]'); await p.waitForTimeout(120); await p.click('#isx-fw .fopt[data-fwo="fc"][data-g="g"][data-v="Japan"]'); await p.click('#isx-fw [data-fw="pan"]'); await settle(p); seq.push(await st(p));
  await p.click('#isx-fw [data-fw="reset"]'); await settle(p); seq.push(await st(p));
  const addrs = seq.map(x => x.a);
  ok(seq.slice(1).every((x, i) => x.steps === i + 1 || (i === 3 && x.steps >= 3)), 'every change is a step: a view, a filter, the compare switch, a second group, Clear', seq.map(x => [x.steps, x.a]));
  ok(addrs[1] === 'v=state' && /fc=china/.test(addrs[2]) && /vs/.test(addrs[3]) && addrs[5] === '', 'the addresses are the ones the firm web already writes (view, filter, compare, clear)', addrs);
  ok(seq[5].dis === 'false', 'the button is live once there is something to undo', seq[5]);
  const top = seq.length - 1, walked = [];
  for (let i = top; i > 0; i--) { await p.click('#isx-fw .fback', { force: true }); await settle(p); walked.push(await st(p)); }
  ok(JSON.stringify(walked.map(x => x.a)) === JSON.stringify(addrs.slice(0, top).reverse()), 'Back undoes them one at a time, in the order they were made, down to the start', { walked: walked.map(x => x.a), want: addrs.slice(0, top).reverse() });
  s = walked[walked.length - 1];
  ok(s.a === '' && s.steps === 0 && s.dis === 'true' && s.hash === '#circuit/firms', 'at the start the button is dim again and the address is the web at rest', s);
  ok(/fback/.test(s.foc), 'focus stays on the button through every step', s.foc);

  /* a pick is a step too (Esc and the card's own button still work) */
  await p.click('#isx-fw .fnode[data-id="f:asml"]').catch(async () => { await p.evaluate(() => ISX.firms.pick('f:asml')); }); await settle(p);
  s = await st(p); ok(s.sel === 'f:asml' && s.steps === 1, 'picking a firm is one step', s);
  await p.click('#isx-fw .fback', { force: true }); await settle(p); s = await st(p);
  ok(s.sel === null && s.steps === 0, 'Back closes the card first', s);

  /* 2 · the browser's Back and Forward walk the same steps */
  await view(p, 'chokepoints'); await chip(p, 'ht', 'state'); const A = await st(p);
  ok(A.steps === 2 && /L=tools/.test(A.a) && /ht=state/.test(A.a), 'two more steps (a view, then a filter that makes it the person’s own)', A);
  await p.goBack(); await settle(p); s = await st(p);
  ok(s.open && s.a === 'v=chokepoints' && s.steps === 1, 'the browser’s Back undoes the last one, the web stays open', s);
  await p.click('#isx-fw .fback', { force: true }); await settle(p); s = await st(p);
  ok(s.open && s.a === '' && s.steps === 0, 'then the button takes the one before, from the same stack', s);
  await p.goForward(); await settle(p); s = await st(p);
  ok(s.open && s.a === 'v=chokepoints' && s.steps === 1, 'the browser’s Forward goes on from there', s);
  await p.goForward(); await settle(p); s = await st(p);
  ok(s.a === A.a && s.steps === 2, 'and again, to where it was', s);
  await p.click('#isx-fw .fback', { force: true }); await settle(p); await p.click('#isx-fw .fback', { force: true }); await settle(p); s = await st(p);
  ok(s.a === '' && s.steps === 0 && s.hash === '#circuit/firms', 'the button twice in a row lands on the start with no step left over', s);
  await p.click('#isx-fw .fback', { force: true }); await p.click('#isx-fw .fback', { force: true }); await settle(p); s = await st(p);
  ok(s.a === '' && s.open, 'pressed again at the start, and again at once, it stays put', s);

  /* 3 · the browser's Back from the first step closes the web onto the Circuit */
  await p.goBack(); await settle(p); s = await st(p);
  ok(!s.open && /^#circuit(\/|$)/.test(s.hash) && !/firms/.test(s.hash), 'the browser’s Back from the first step closes the web and lands on the Circuit', s);
  await p.goForward(); await settle(p); s = await st(p);
  ok(s.open, 'Forward opens it again', s);
  const view2 = await p.evaluate(() => ISX.view);
  ok(view2 === 'map', 'on the Circuit tab', view2);

  /* a link into a view: the first step is that view, and the browser's Back leaves the page's own history */
  await p.close();
  p = await open(c, '#circuit/firms=v=state;ht=state'); await up(p); await settle(p); s = await st(p);
  ok(s.open && s.steps === 0 && s.dis === 'true' && /v=state/.test(s.a), 'a link opens its view with nothing to undo; the button waits', s);
  await chip(p, 'fc', 'China'); s = await st(p); ok(s.steps === 1, 'one change, one step', s);
  await p.click('#isx-fw .fback', { force: true }); await settle(p); s = await st(p);
  ok(s.steps === 0 && /v=state/.test(s.a) && !/fc=/.test(s.a), 'Back returns to the linked view', s);
  await p.close(); await c.close();

  /* 4 · a page that cannot write history (a sandboxed frame): the button works alone */
  c = await ctx(1440, 900); await c.addInitScript(() => { const t = () => { throw new Error('SecurityError'); }; history.pushState = t; history.replaceState = t; });
  p = await open(c, '#circuit'); await p.evaluate(() => ISX.firms.open()); await up(p); await settle(p);
  await view(p, 'state'); await chip(p, 'fc', 'China'); s = await st(p);
  ok(s.steps === 2 && s.dis === 'false', 'without history the steps still count', s);
  await p.click('#isx-fw .fback', { force: true }); await settle(p); await p.waitForTimeout(600); s = await st(p);
  ok(s.a === 'v=state' && s.steps === 1, 'Back undoes the filter', s);
  await p.click('#isx-fw .fback', { force: true }); await settle(p); await p.waitForTimeout(600); s = await st(p);
  ok(s.a === '' && s.steps === 0 && s.dis === 'true', 'and the view', s);
  await p.close(); await c.close();

  /* 5 · sizes: one row where it fits, two where it must, never run off the bar; the panel opens under the bar */
  const fit = p => p.evaluate(() => { const bar = document.querySelector('#isx-fw .fwbar'), kids = [...bar.children].filter(e => e.offsetParent && !e.classList.contains('fgap')), tops = [...new Set(kids.map(e => Math.round(e.getBoundingClientRect().top)))], b = bar.querySelector('.fback').getBoundingClientRect(), br = bar.getBoundingClientRect(); return { rows: tops.length, left: Math.round(b.left - br.left), h: Math.round(b.height), w: Math.round(b.width), clip: kids.some(e => e.getBoundingClientRect().right > br.right + 1) || bar.scrollWidth > bar.clientWidth + 1 || br.right > innerWidth, svgTop: Math.round(document.querySelector('#isx-fw svg').getBoundingClientRect().top - br.bottom) }; });
  for (const [w, h, rows, shape] of [[1440, 900, 1, 'rest'], [1440, 900, 2, 'view'], [1366, 800, 1, 'rest'], [1280, 800, 2, 'rest'], [1280, 800, 2, 'view'], [1100, 800, 2, 'view'], [1024, 768, 2, 'view']]) {
    c = await ctx(w, h); p = await open(c, '#circuit/firms'); await up(p); await settle(p);
    if (shape === 'view') { await view(p, 'state'); await chip(p, 'hc', 'South Korea'); await chip(p, 'fc', 'China'); }
    r = await fit(p);
    ok(r.rows <= rows && r.left <= 2 && r.h >= 30 && !r.clip && r.svgTop >= 0, w + ' px, ' + shape + ': the bar is ' + (rows > 1 ? 'one or two rows' : 'one row') + ', the button is first, nothing runs off the bar or the screen, the picture starts below it', r);
    await p.click('#isx-fw [data-fwp="ht"]'); await p.waitForTimeout(200);
    r = await p.evaluate(() => { const pn = document.querySelector('#isx-fw .fpan').getBoundingClientRect(), bar = document.querySelector('#isx-fw .fwbar').getBoundingClientRect(); return { gap: Math.round(pn.top - bar.bottom) }; });
    ok(r.gap >= 0 && r.gap <= 14, w + ' px, ' + shape + ': a filter’s panel opens just under the bar', r);
    await p.close(); await c.close();
  }
  c = await ctx(390, 844); p = await open(c, '#circuit/firms'); await up(p); await settle(p);
  r = await p.evaluate(() => { const bar = document.querySelector('#isx-fw .fwbar'), b = bar.querySelector('.fback').getBoundingClientRect(), v = bar.querySelector('.fvw').getBoundingClientRect(); return { h: Math.round(b.height), w: Math.round(b.width), row: Math.round(b.top) === Math.round(v.top), over: document.documentElement.scrollWidth > innerWidth + 1, right: Math.round(v.right) <= innerWidth }; });
  ok(r.h === 44 && r.w > 100 && r.row && !r.over && r.right, 'phone: the button is 44 px high, shares the first row with “Ten views”, nothing overflows', r);
  await view(p, 'state');
  await p.tap('#isx-fw .fback', { force: true }); await settle(p); s = await st(p);
  ok(s.a === '' && s.steps === 0, 'phone: a tap on it undoes the view', s);
  await p.close(); await c.close();

  /* 6 · motion on: the same steps */
  c = await ctx(1440, 900, { reducedMotion: 'no-preference' }); p = await open(c, '#circuit/firms'); await up(p); await settle(p);
  await view(p, 'systems'); await p.waitForTimeout(600); await p.click('#isx-fw .fback', { force: true }); await p.waitForTimeout(1400); s = await st(p);
  ok(s.a === '' && s.steps === 0 && !s.cmp, 'with motion on, Back takes the comparison apart again', s);
  await p.close(); await c.close();

  ok(errs.length === 0, 'no page or console errors', errs);
  await b.close();
  console.log(n - fail + ' of ' + n + ' checks pass');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('CRASH ' + e.message); process.exit(1); });
