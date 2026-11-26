/* Check of the orrery's mobile round (24 Nov 2026): Full screen on every view, names on a phone, the key, never two names on top of each other,
   pinch and pan with Reset, the tilt on a desktop, keyboard and reduced motion.
   Usage: NODE_PATH=/opt/npm-tools/node_modules node tools/orrery-mobile-check.js [baseUrl]
   Not part of the 21-check suite until Elias says so; run it with profit-check and arc-check when `v2/orrery.js` or `orrery.css` changes. */
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8731/imperial-stack/';
let fails = 0, n = 0;
const ok = (name, cond, extra) => { n++; if (!cond) fails++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 600) : '')); };
(async () => {
  const b = await chromium.launch(); const errs = [];
  const open = async (w, h, touch, view, rm) => {
    const c = await b.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1, reducedMotion: rm ? 'reduce' : 'no-preference' });
    await c.addInitScript(() => { ['isx-tips-globe', 'isx-tour', 'isx-tips-sim', 'isx-first', 'isx-insights', 'isx-simtour'].forEach(k => localStorage.setItem(k, 'off')); localStorage.setItem('isx-intro-off', '1'); localStorage.setItem('isx-stack', 'open'); });
    const p = await c.newPage(); p._c = c;
    p.on('pageerror', e => errs.push('PAGE ' + String(e).slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/favicon/i.test(m.text())) errs.push('CON ' + m.text().slice(0, 200)); });
    await p.goto(base + '#profit', { waitUntil: 'load', timeout: 90000 });
    await p.waitForFunction(() => window.ISX && ISX.booted && ISX.profit && ISX.profit.state.ready, null, { timeout: 60000 });
    await p.evaluate(v => { ISX.orrOpened = true; ISX.profit.go(0, v); }, view); await p.waitForFunction(() => document.querySelector('.orr-svg .ob'), null, { timeout: 20000 }); await p.waitForTimeout(500);
    return p;
  };
  const year = (p, y) => p.evaluate(y => { const i = document.querySelector((document.querySelector('.orr-fs') ? '.orr-fs ' : '') + '.orr-sl input'); i.value = y; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); }, y).then(() => p.waitForTimeout(700));
  /* the visible names of the picture, in page pixels */
  const names = p => p.evaluate(() => { const sc = document.querySelector('.orr-fs') ? '.orr-fs ' : ''; return [...document.querySelectorAll(sc + '.orr-svg text:not(.orr-rimt)')].filter(t => {   /* OR8: the rim's words run on a curve (their box is not where they are); orrery-or7-check and orrery-or8-check look at the rim */ const cs = getComputedStyle(t); return !t.classList.contains('off') && cs.visibility !== 'hidden' && +cs.opacity > .05 && t.textContent; }).map(t => { const r = t.getBoundingClientRect(); return { t: t.textContent, ring: t.classList.contains('orr-rl') || t.classList.contains('orr-lt'), x0: r.left + 1, y0: r.top + 2, x1: r.right - 1, y1: r.bottom - 2, fs: getComputedStyle(t).fontSize }; }); });
  const overlaps = L => { const o = []; for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const a = L[i], c = L[j]; if (a.x0 < c.x1 && c.x0 < a.x1 && a.y0 < c.y1 && c.y0 < a.y1) o.push(a.t + ' × ' + c.t); } return o; };

  /* A · a Full screen button on every view, at both sizes; the desktop one is an icon */
  for (const [w, h, touch] of [[1440, 900, false], [390, 844, true]]) for (const v of ['orr', 'rng', 'hyp']) {
    const p = await open(w, h, touch, v);
    const r = await p.evaluate(() => { const f = document.querySelector('.orr-fsb'), t = f && f.querySelector('.t'), cs = t && getComputedStyle(t), bb = f && f.getBoundingClientRect(); return { has: !!f, label: f && f.getAttribute('aria-label'), tag: f && f.tagName, textW: t && t.getBoundingClientRect().width, h: bb && bb.height, w: bb && bb.width }; });
    ok(`A · ${w}px, view ${v}: a Full screen button, named “Full screen”`, r.has && r.label === 'Full screen' && r.tag === 'BUTTON', r);
    ok(`A · ${w}px, view ${v}: ${w > 700 ? 'an icon (the words shown on hover)' : 'the words “Full screen” shown'}; at least 40 px`, (w > 700 ? r.textW <= 2 : r.textW > 20) && r.h >= 40 && r.w >= 40, r);
    await p._c.close();
  }

  /* B · a phone: names only above the mass threshold; the rings and bands in the key, not on the picture */
  {
    const p = await open(390, 844, true, 'orr'); await year(p, 2019);
    const r = await p.evaluate(() => ({ ringTexts: document.querySelectorAll('.orr-svg .orr-rl, .orr-svg .orr-lt').length, key: [...document.querySelectorAll('#isx-pf-lg .orr-kr, .pf-lg .orr-kr')].map(e => e.textContent), on: [...document.querySelectorAll('.orr-svg .ol:not(.off)')].map(t => t.textContent), total: document.querySelectorAll('.orr-svg .ol').length }));
    ok('B · phone: no ring or band names drawn on the picture', r.ringTexts === 0, r);
    ok('B · phone: the five ring names are in the key', ['The core', 'Tools, chips and finance', 'The assembly line', 'Energy and minerals', 'Role not collected'].every(x => r.key.includes(x)), r.key);
    ok('B · phone: few names (the big bodies and the two suns), not all', r.on.length >= 3 && r.on.length <= 14 && r.on.length < r.total / 3, { on: r.on, total: r.total });
    const small = await p.evaluate(() => { const o = ISX.profit.orrery.cur; const q = o.list.filter(x => !x.core && x.mass != null && x.mass < 1.2 && x.mass > 0).sort((a, b) => a.mass - b.mass)[0]; return q ? q.id : null; });
    ok('B · phone: a small body to tap exists', !!small, small);
    await p.evaluate(id => document.querySelector('.orr-svg .ob[data-b="' + id + '"]').dispatchEvent(new MouseEvent('click', { bubbles: true })), small); await p.waitForTimeout(250);
    const t = await p.evaluate(id => { const o = ISX.profit.orrery.cur, q = o.list.find(x => x.id === id); return { selOn: !q.tx.classList.contains('off'), on: document.querySelectorAll('.orr-svg .ol:not(.off)').length }; }, small);
    ok('B · phone: the tapped small body gets its name; at most four neighbours join', t.selOn && t.on <= r.on.length + 5, { t, before: r.on.length });
    ok('B · phone: no two names overlap (tapped)', overlaps(await names(p)).length === 0, overlaps(await names(p)));
    await p._c.close();
  }

  /* C · never two names on top of each other: desktop, phone, and full screen, at several years and tilts */
  {
    const p = await open(1440, 900, false, 'orr'); let bad = [];
    for (const y of [1995, 2008, 2019, 2025]) { await year(p, y); const o = overlaps(await names(p)); if (o.length) bad.push(y + ': ' + o.slice(0, 4).join('; ')); }
    for (const t of [.25, .7]) { await p.evaluate(t => ISX.profit.orrery.cur.setTilt(t), t); await p.waitForTimeout(100); const o = overlaps(await names(p)); if (o.length) bad.push('tilt ' + t + ': ' + o.slice(0, 4).join('; ')); }
    ok('C · desktop: no two names overlap (1995, 2008, 2019, 2025; tilt 0.25 and 0.7)', bad.length === 0, bad); await p._c.close();
    const q = await open(390, 844, true, 'orr'); bad = [];
    for (const y of [1995, 2019, 2025]) { await year(q, y); const o = overlaps(await names(q)); if (o.length) bad.push(y + ': ' + o.slice(0, 4).join('; ')); }
    ok('C · phone: no two names overlap (1995, 2019, 2025)', bad.length === 0, bad); await q._c.close();
  }

  /* D · full screen on a phone held sideways: the landscape layout at the window's size; rings, names and slider fit */
  {
    const p = await open(844, 390, true, 'orr'); await year(p, 2019); await p.click('.orr-fsb'); await p.waitForTimeout(900);
    const r = await p.evaluate(() => { const ov = document.querySelector('.orr-fs'), o = ISX.profit.orrery.cur, sl = ov.querySelector('.orr-sl').getBoundingClientRect(), st = ov.querySelector('.orr-stage').getBoundingClientRect(), vb = ov.querySelector('.orr-svg').getAttribute('viewBox').split(' ').map(Number);
      return { role: ov.getAttribute('role'), modal: ov.getAttribute('aria-modal'), label: ov.getAttribute('aria-label'), inert: document.querySelector('#isx-root > .wrap').inert, cls: ov.className, vb, sl: [sl.left, sl.top, sl.right, sl.bottom].map(Math.round), st: [st.left, st.top, st.right, st.bottom].map(Math.round), win: [innerWidth, innerHeight], focus: document.activeElement.textContent, native: !!document.fullscreenElement }; });
    ok('D · full screen: a modal dialog with a name, the page behind it inert, Close focused', r.role === 'dialog' && r.modal === 'true' && !!r.label && r.inert && r.focus === 'Close', r);
    /* OR8: in the story's full screen the timeline is inside the stage (with the narrator above it), so the picture's svg is the whole window */
    ok('D · full screen: the stage fills the window (844 × 390) and the year slider stands inside it, at its foot', r.vb[2] === 844 && r.vb[3] === 390 && r.sl[3] <= 390 && r.sl[0] >= 0 && r.sl[2] <= 844 && r.sl[1] >= 280, r);
    ok('D · full screen: the landscape layout (L.ph false), compact names', r.cls.includes('compact') && !r.cls.includes('portrait') && r.vb[2] > r.vb[3], r);
    const fit = [];
    for (const y of [1995, 2008, 2014, 2019, 2022, 2025]) { await year(p, y); fit.push(...await p.evaluate(y => { const st = document.querySelector('.orr-fs .orr-stage').getBoundingClientRect(); return [...document.querySelectorAll('.orr-fs .orr-svg .rg')].filter(e => +getComputedStyle(e).opacity > .05).map(e => e.getBoundingClientRect()).filter(r => r.left < st.left - 2 || r.right > st.right + 2 || r.top < st.top - 2 || r.bottom > st.bottom + 2).map(r => y + ': ' + [r.left, r.top, r.right, r.bottom].map(Math.round).join(',')); }, y)); }
    ok('D · full screen: every ring stays inside the picture, 1995 to 2025', fit.length === 0, fit.slice(0, 5));
    await year(p, 2019); const nm = await names(p); const L = await p.evaluate(() => { const o = document.querySelector('.orr-fs .orr-stage').getBoundingClientRect(); return [o.left, o.top, o.right, o.bottom]; });
    ok('D · full screen: no two names overlap; every name inside the picture', overlaps(nm).length === 0 && nm.every(x => x.x0 >= L[0] - 2 && x.x1 <= L[2] + 2 && x.y0 >= L[1] - 3 && x.y1 <= L[3] + 3), { o: overlaps(nm), out: nm.filter(x => x.x0 < L[0] - 2 || x.x1 > L[2] + 2).map(x => x.t) });
    /* the key: opened on the first full screen of a phone, with the rings by name; Key toggles; a tap on a ring name lights that ring */
    const k = await p.evaluate(() => ({ open: !document.querySelector('.orr-key').hidden, exp: document.querySelector('.orr-tbb.ky').getAttribute('aria-expanded'), rings: [...document.querySelectorAll('.orr-key .orr-kr')].map(e => e.textContent) }));
    ok('D · full screen: the key is open the first time and names the five rings', k.open && k.exp === 'true' && k.rings.length === 5, k);
    await p.hover('.orr-key .orr-kr[data-ring="2"]'); const hl = await p.evaluate(() => document.querySelectorAll('.orr-fs .rg.hl').length);
    ok('D · full screen: a ring name in the key lights its ring', hl >= 1, hl);
    /* pinch, drag, reset */
    await p.click('.orr-tbb.ky'); const cdp = await p.context().newCDPSession(p), touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((q, i) => ({ x: q[0], y: q[1], id: i })) });
    const tf = () => p.evaluate(() => document.querySelector('.orr-fs .orr-view').getAttribute('transform'));
    await touch('touchStart', [[300, 200], [380, 200]]); for (let i = 1; i <= 6; i++) await touch('touchMove', [[300 - i * 14, 200], [380 + i * 14, 200]]); await touch('touchEnd', []); await p.waitForTimeout(200);
    const t1 = await tf(); ok('D · pinch zooms the picture', /scale\((?!1\.0000)/.test(t1), t1);
    const fs1 = (await names(p)).map(x => x.fs); ok('D · zoomed, the names keep their size (10.5 px)', fs1.length > 0 && fs1.every(f => f === '10.5px'), fs1.slice(0, 3));
    await touch('touchStart', [[300, 200]]); for (let i = 1; i <= 5; i++) await touch('touchMove', [[300 - i * 15, 200 - i * 6]]); await touch('touchEnd', []); await p.waitForTimeout(200);
    const t2 = await tf(); ok('D · a one-finger drag pans', t2 !== t1, [t1, t2]);
    await p.click('.orr-tbb.z:nth-child(2)'); await p.waitForTimeout(100); const t3 = await tf(); ok('D · the + button zooms in', t3 !== t2, [t2, t3]);
    await p.click('.orr-tbb.rs'); await p.waitForTimeout(100); ok('D · Reset returns to the whole picture', /translate\(0\.00 0\.00\) scale\(1\.0000\)/.test(await tf()), await tf());
    /* a year change in full screen is the year on the page when it closes */
    await year(p, 2008); await p.click('.orr-tbb.x'); await p.waitForTimeout(400);
    const c = await p.evaluate(() => ({ fs: !!document.querySelector('.orr-fs'), native: !!document.fullscreenElement, inert: document.querySelector('#isx-root > .wrap').inert, lock: document.documentElement.classList.contains('isx-pzlock'), yr: document.querySelector('.orr-yr').textContent, focus: document.activeElement.className }));
    ok('D · Close: the overlay is gone, the page live again, the same year, focus back on Full screen', !c.fs && !c.native && !c.inert && !c.lock && c.yr === '2008' && c.focus === 'orr-fsb', c);
    await p._c.close();
  }

  /* E · a phone held upright: the hint, then the landscape layout when the window turns */
  {
    const p = await open(390, 844, true, 'orr'); await p.click('.orr-fsb'); await p.waitForTimeout(800);
    const r = await p.evaluate(() => ({ hint: document.querySelector('.orr-hint').hidden ? '' : document.querySelector('.orr-hint').textContent, cls: document.querySelector('.orr-fs').className, vb: document.querySelector('.orr-fs .orr-svg').getAttribute('viewBox') }));
    ok('E · upright: one line asks the visitor to turn the phone', r.hint.length > 10 && r.hint.length < 70 && r.cls.includes('portrait'), r);
    await year(p, 2014); await (await p.context().newCDPSession(p)).send('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 1, mobile: true }); await p.waitForTimeout(900);
    const s = await p.evaluate(() => ({ hint: document.querySelector('.orr-hint').hidden, cls: document.querySelector('.orr-fs').className, vb: document.querySelector('.orr-fs .orr-svg').getAttribute('viewBox'), yr: document.querySelector('.orr-fs .orr-yr').textContent }));
    ok('E · turned: the hint goes, the landscape layout fills the new window, the year is kept', s.hint && !s.cls.includes('portrait') && s.vb === '0 0 844 390' && s.yr === '2014', s);   /* OR8: the story's stage is the whole window (its timeline is inside it) */
    await p.keyboard.press('Escape'); await p.waitForTimeout(300); ok('E · Escape closes', !(await p.evaluate(() => !!document.querySelector('.orr-fs')))); await p._c.close();
  }

  /* F · a desktop: a drag tilts the rings between 0.25 and 0.7, and nothing moves when it stops; the keyboard does the same */
  {
    const p = await open(1440, 900, false, 'orr'); const bx = await p.locator('.orr-svg').boundingBox(); const T = () => p.evaluate(() => +ISX.profit.orrery.cur.L.tilt.toFixed(3));
    const t0 = await T();
    await p.mouse.move(bx.x + 300, bx.y + 80); await p.mouse.down(); await p.mouse.move(bx.x + 300, bx.y + 420, { steps: 10 }); await p.mouse.up(); const hi = await T();
    await p.mouse.move(bx.x + 300, bx.y + 420); await p.mouse.down(); await p.mouse.move(bx.x + 300, bx.y + 10, { steps: 10 }); await p.mouse.up(); const lo = await T();
    ok('F · desktop: a drag down tilts to at most 0.7, a drag up to at least 0.25', t0 >= .32 && t0 <= .66 && hi <= .7 && hi > .6 && lo >= .25 && lo < .3, { t0, hi, lo });   /* OR8: the stage's rings start as round as its box allows (0.32 to 0.66), not at 0.4 */
    const idle = await p.evaluate(() => new Promise(res => { const o = ISX.profit.orrery.cur; const a = o.L.tilt, f0 = o.st.raf; setTimeout(() => res({ same: o.L.tilt === a, raf: o.st.raf, f0 }), 500); }));
    ok('F · desktop: idle after a drag, no motion runs (no animation frame pending)', idle.same && idle.raf === 0, idle);
    await p.focus('.orr-svg .ob'); await p.keyboard.press('Shift+ArrowDown'); const k1 = await T(); await p.keyboard.press('Shift+ArrowUp'); await p.keyboard.press('Shift+ArrowUp'); const k2 = await T();
    ok('F · desktop: Shift + ↓ and Shift + ↑ tilt from the keyboard', k1 > lo && k2 < k1, { lo, k1, k2 });
    ok('F · desktop: the tilt keeps the rings inside the picture', await p.evaluate(() => { const st = document.querySelector('.orr-stage').getBoundingClientRect(); return [...document.querySelectorAll('.orr-svg .rg')].filter(e => +getComputedStyle(e).opacity > .05).every(e => { const r = e.getBoundingClientRect(); return r.top >= st.top - 2 && r.bottom <= st.bottom + 2; }); }));
    await p.evaluate(() => ISX.profit.orrery.cur.setTilt(.7)); await p.waitForTimeout(100);
    ok('F · desktop: at the steepest tilt the rings still fit', await p.evaluate(() => { const st = document.querySelector('.orr-stage').getBoundingClientRect(); return [...document.querySelectorAll('.orr-svg .rg')].filter(e => +getComputedStyle(e).opacity > .05).every(e => { const r = e.getBoundingClientRect(); return r.top >= st.top - 2 && r.bottom <= st.bottom + 2; }); }));
    await p.focus('.orr-fsb'); await p.keyboard.press('Enter'); await p.waitForTimeout(500);
    ok('F · desktop: Full screen opens from the keyboard (Enter), Close is focused', await p.evaluate(() => !!document.querySelector('.orr-fs') && document.activeElement.textContent === 'Close'));
    await p.focus('.orr-fs .orr-svg .ob'); await p.keyboard.press('+'); await p.waitForTimeout(100); ok('F · full screen: + on a body zooms in; 0 resets', /scale\((?!1\.0000)/.test(await p.evaluate(() => document.querySelector('.orr-fs .orr-view').getAttribute('transform'))));
    await p.keyboard.press('0'); await p.waitForTimeout(100); ok('F · full screen: 0 resets', /scale\(1\.0000\)/.test(await p.evaluate(() => document.querySelector('.orr-fs .orr-view').getAttribute('transform'))));
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    ok('F · desktop: Escape closes and focus returns to the button', await p.evaluate(() => !document.querySelector('.orr-fs') && document.activeElement.className === 'orr-fsb')); await p._c.close();
  }

  /* G · reduced motion: nothing animates in the orrery or its full screen, and both still work */
  {
    const p = await open(844, 390, true, 'orr', true); await p.click('.orr-fsb'); await p.waitForTimeout(500);
    const r = await p.evaluate(() => { const bad = [...document.querySelectorAll('.orr-fs *, .orr *')].filter(e => { const cs = getComputedStyle(e); return (cs.animationName !== 'none' && parseFloat(cs.animationDuration) > 0) || parseFloat(cs.transitionDuration) > 0; }).length; return { bad, fs: !!document.querySelector('.orr-fs') }; });
    ok('G · reduced motion: Full screen opens, and no animation or transition runs in it', r.fs && r.bad === 0, r); await p._c.close();
  }
  ok('no page or console errors', errs.length === 0, errs.slice(0, 5));
  console.log(`\n${n - fails}/${n} passed`); await b.close(); process.exit(fails ? 1 : 0);
})();
