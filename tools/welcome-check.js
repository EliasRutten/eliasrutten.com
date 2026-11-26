/* First-visit welcome (18 Nov 2026): checks for the bare map, the fly-in, the welcome card, the six stops of the tour, the key, the
   header's Tour, the deep link's offer, phones, reduced motion, no WebGL and blocked storage.
   Spec: claude/specs/first-visit-welcome-18-nov.md §8. Elias, 18 Nov: the tour stops once it has been taken (isx-intro 'toured').
   Usage: node tools/welcome-check.js [baseUrl] [--only=1,2,…]   (1 bare map and fly-in, 2 welcome, 3 the stops, 4 leaving and the key,
   5 Tour and deep links, 6 phones, 7 reduced motion, no WebGL, blocked storage). Start `python3 -m http.server 8731` at the repo root
   first. Run it alone. Exits 1 on a failed check. */
const { chromium } = require('playwright');
const base = (process.argv.slice(2).find(a => !a.startsWith('--')) || 'http://127.0.0.1:8731/imperial-stack/');
const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean).map(Number);
const want = n => !only.length || only.includes(n);
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) { pass++; console.log('  ok   ' + name); } else { fail++; console.log('  FAIL ' + name + (info !== undefined ? ' :: ' + JSON.stringify(info).slice(0, 500) : '')); } };
/* keep everything else on the page quiet; the welcome's own key stays unset */
const QUIET = { 'isx-simtour': 'off', 'isx-insights': 'off', 'isx-tips-globe': 'off' };
const PARTS = [['#isx-cmd', '#isx-tabs'], ['#isx-legbox', '#isx-zoom'], ['#isx-resbar'], ['#isx-strip', '.hud-top .seg'], ['#isx-tgl'], ['#isx-dock', '#isx-help', '#isx-mis']];
const PHONE_PARTS = [['#isx-cmd', '#isx-tabs'], ['#isx-zoom'], ['#isx-resbar'], ['.hud-top .seg'], ['#isx-tgl'], ['#isx-dock', '#isx-b4row', '#isx-help']];

(async () => {
  const b = await chromium.launch(), errors = [];
  const page = async (hash, o = {}) => {
    const c = await b.newContext({ viewport: { width: o.w || 1440, height: o.h || 900 }, deviceScaleFactor: 1, reducedMotion: o.rm ? 'reduce' : 'no-preference', hasTouch: !!o.touch, isMobile: !!o.touch });
    await c.addInitScript(([ls, block, nogl]) => {
      if (block) { try { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } }); } catch (e) {} }
      if (nogl) { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; }
      if (block) return;
      try { if (sessionStorage.getItem('wl-check-set')) return; sessionStorage.setItem('wl-check-set', '1'); for (const k in ls) { if (ls[k] === null) localStorage.removeItem(k); else localStorage.setItem(k, ls[k]); } } catch (e) {}
    }, [Object.assign({}, QUIET, o.ls || {}), !!o.block, !!o.nogl]);
    const p = await c.newPage();
    p.on('pageerror', e => errors.push(hash + ': ' + String(e).slice(0, 200)));
    await p.goto(base + hash, { waitUntil: 'load' });
    await p.waitForFunction(() => window.ISX && ISX.booted, null, { timeout: 60000 });
    if (o.wait !== 0) await p.waitForTimeout(o.wait == null ? 300 : o.wait);
    return p;
  };
  const done = p => p.context().close();
  const welcomeUp = p => p.waitForFunction(() => !!document.querySelector('#isx-wl') && !(ISX.opening && ISX.opening.on), null, { timeout: 30000 });
  const settle = p => p.waitForFunction(() => !document.querySelector('#isx-frame .wl-pop, #isx-frame .wl-fade'), null, { timeout: 8000 }).catch(() => {}).then(() => p.waitForTimeout(150));
  /* what shows: visible, not held back by the stage, not inert */
  const vis = (p, sels) => p.evaluate(S => S.map(s => { const e = document.querySelector(s); if (!e) return [s, 'missing']; const c = getComputedStyle(e); let n = e, inert = false; while (n) { if (n.inert) { inert = true; break; } n = n.parentElement; } return [s, e.getClientRects().length > 0 && c.visibility === 'visible' && +c.opacity > .5 && !inert]; }), sels);
  const allOn = r => r.every(x => x[1] === true), allOff = r => r.every(x => x[1] === false);
  const next = p => p.click('#isx-wltip [data-wt="next"]');

  /* ---------- 1. the bare map and the fly-in ---------- */
  if (want(1)) {
    console.log('1 · the bare map and the fly-in');
    let p = await page('', { wait: 0 });
    let r = await p.evaluate(() => ({ stage: document.getElementById('isx-root').classList.contains('wl-stage'), on: ISX.opening.on, text: document.querySelectorAll('.op-ttl, .op-skip').length, mode: window.__isxWelcome }));
    ok('a first visit opens on the bare map, and the fly-in plays without its title or Skip', r.stage && r.on === 'circuit' && r.text === 0 && r.mode === 'stage', r);
    const ALL = PARTS.flat().filter(s => s !== '#isx-insight');
    r = await vis(p, ALL); ok('every part of the interface is held back: hidden and inert', allOff(r), r.filter(x => x[1] !== false));
    r = await vis(p, ['.hud-top .brand h1', '.hud-top .er-home', '#isx-globe']); ok('the title, “← Elias Rutten” and the globe stay', allOn(r), r);
    r = await p.evaluate(() => { const fr = document.getElementById('isx-frame').getBoundingClientRect(); return document.elementsFromPoint(fr.left + 200, fr.top + 200).some(e => e.closest && e.closest('#isx-resbar')); });
    ok('nothing held back takes a press', !r, r);
    await p.mouse.click(700, 450); const t0 = Date.now();
    await welcomeUp(p);
    ok('a press during the fly-in goes straight to the welcome', Date.now() - t0 < 2500, Date.now() - t0);
    await done(p);
    p = await page('#circuit', { wait: 0 }); await welcomeUp(p);
    ok('#circuit counts as the Circuit’s front door: the welcome too', await p.evaluate(() => !!document.querySelector('#isx-wl')));
    await done(p);
  }

  /* ---------- 2. the welcome card ---------- */
  if (want(2)) {
    console.log('2 · the welcome card');
    const p = await page('', { wait: 0 }); await welcomeUp(p); await p.waitForTimeout(900);
    const r = await p.evaluate(() => { const c = document.getElementById('isx-wl'), g = document.getElementById('isx-globe').getBoundingClientRect(), cr = c.getBoundingClientRect();
      return { k: c.querySelector('.wl-k').textContent.replace(/\s+/g, ' '), h: c.querySelector('h2').textContent, l: c.querySelector('.wl-l').textContent, go: c.querySelector('.wl-go').textContent.trim(), skip: c.querySelector('.wl-skip').textContent, box: !!c.querySelector('input[data-wl-off]'), role: c.getAttribute('role'), lab: c.getAttribute('aria-labelledby'), focus: document.activeElement === c,
        dx: Math.abs(cr.left + cr.width / 2 - (g.left + g.width / 2)), stage: document.getElementById('isx-root').classList.contains('wl-stage'), blur: getComputedStyle(c).backdropFilter }; });
    ok('kicker “The Imperial Stack · 01 of 05”', /The Imperial Stack\s*·\s*01 of 05/i.test(r.k), r.k);
    ok('the thesis and the one line, as in the spec', /^This is how America finances its imperial stack – and how the imperial stack keeps the dollar afloat\.\*?$/.test(r.h) && /^Follow the money on one globe/.test(r.l), [r.h, r.l]);
    ok('“Show me around →”, “Skip to the map”, “Don’t show this again”', /^Show me around/.test(r.go) && r.skip === 'Skip to the map' && r.box, r);
    ok('a dialog labelled by its thesis, with focus; centred on the globe, glass behind it; the map still bare', r.role === 'dialog' && r.lab === 'isx-wl-h' && r.focus && r.dx < 4 && /blur/.test(r.blur) && r.stage, r);
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(200);
    ok('→ does not step the map behind the card', await p.evaluate(() => ISX.step === 0 && !!document.querySelector('#isx-wl')));
    await p.keyboard.press('Escape'); await settle(p);
    const v = await vis(p, PARTS.flat());
    ok('Esc is “Skip to the map”: everything comes in together, on step 00', allOn(v) && await p.evaluate(() => ISX.step === 0 && !document.querySelector('#isx-wl') && !document.getElementById('isx-root').classList.contains('wl-stage')), v.filter(x => x[1] !== true));
    ok('skipping the welcome does not count as taking the tour: the key stays unset', await p.evaluate(() => localStorage.getItem('isx-intro') === null));
    await p.reload({ waitUntil: 'load' }); await p.waitForFunction(() => ISX.booted); await welcomeUp(p);
    ok('…so the next visit opens on the welcome again', await p.evaluate(() => !!document.querySelector('#isx-wl')));
    await done(p);
  }

  /* ---------- 3. the six stops ---------- */
  if (want(3)) {
    console.log('3 · the six stops');
    const p = await page('', { wait: 0 }); await welcomeUp(p);
    await p.click('#isx-wl .wl-go'); await settle(p);
    const heads = [];
    for (let i = 0; i < 6; i++) {
      if (i) { await next(p); await settle(p); }
      const on = await vis(p, PARTS.slice(0, i + 1).flat()), off = i < 5 ? await vis(p, PARTS.slice(i + 1).flat()) : [];
      const t = await p.evaluate(() => { const t = document.getElementById('isx-wltip'); return { n: t.querySelector('.wl-n').textContent, h: t.querySelector('h3').textContent, focus: t.contains(document.activeElement) || document.activeElement === t, live: t.querySelector('[aria-live="polite"]').textContent, nx: t.querySelector('[data-wt="next"]').textContent.trim(), bk: !t.querySelector('[data-wt="back"]').hidden, side: t.dataset.side, mark: [...document.querySelectorAll('.wl-on')].map(e => e.id || e.className.split(' ')[0]) }; });
      heads.push(t.h);
      ok(`stop ${i + 1}: “${t.h}” – its parts in, the rest still held back, “${i + 1} of 6”`, allOn(on) && allOff(off) && t.n === `${i + 1} of 6`, { on: on.filter(x => x[1] !== true), off: off.filter(x => x[1] !== false), t });
      ok(`stop ${i + 1}: focus on the tip, its text announced, Back ${i ? 'shown' : 'hidden'}, marks ${t.mark.join(', ')}`, t.focus && t.live.startsWith(t.h) && t.bk === !!i && t.mark.length > 0 && (i < 5 ? /^Next/.test(t.nx) : /^Start the loop/.test(t.nx)), t);
      if (i === 2) { await p.click('#isx-wltip [data-wt="back"]'); await settle(p);
        const bk = await p.evaluate(() => [document.querySelector('#isx-wltip .wl-n').textContent, getComputedStyle(document.getElementById('isx-resbar')).visibility]);
        ok('Back returns to stop 2 and keeps what has come in', bk[0] === '2 of 6' && bk[1] === 'visible', bk);
        await p.keyboard.press('ArrowRight'); await settle(p);
        ok('→ is Next', await p.evaluate(() => document.querySelector('#isx-wltip .wl-n').textContent === '3 of 6' && ISX.step === 0));
      }
    }
    ok('six different tips, in the spec’s order', heads.join('|') === 'Follow the money, one step at a time.|The globe is live.|The machine’s vital signs.|Six views of the same machine.|Look beneath the flows.|Take it with you.', heads);
    const r = await p.evaluate(() => { const t = document.getElementById('isx-wltip'), tr = t.getBoundingClientRect(), fr = document.getElementById('isx-frame').getBoundingClientRect(); return { box: !!t.querySelector('input[data-wl-off]'), skip: t.querySelector('[data-wt="skip"]').hidden, inside: tr.left >= fr.left && tr.right <= fr.right && tr.top >= fr.top && tr.bottom <= fr.bottom }; });
    ok('the last stop carries “Don’t show this again”; the tip stays inside the frame', r.box && r.skip && r.inside, r);
    await next(p); await settle(p);
    const e = await p.evaluate(() => ({ step: ISX.step, on: ISX.tour.on, key: localStorage.getItem('isx-intro'), stage: document.getElementById('isx-root').classList.contains('wl-stage'), tip: document.getElementById('isx-wltip').hidden }));
    ok('“Start the loop” goes to step 01, ends the tour, and the tour counts as taken (isx-intro “toured”)', e.step === 1 && !e.on && e.key === 'toured' && !e.stage && e.tip, e);
    ok('everything is in', allOn(await vis(p, PARTS.flat().filter(s => s !== '#isx-insight'))));
    await p.reload({ waitUntil: 'load' }); await p.waitForFunction(() => ISX.booted); await p.waitForTimeout(2500);
    ok('the next visit: no welcome, no fly-in, no tour (Elias: it stops once taken)', await p.evaluate(() => !document.querySelector('#isx-wl') && !ISX.opening.on && !ISX.tour.on && !document.getElementById('isx-root').classList.contains('wl-stage')));
    await done(p);
  }

  /* ---------- 4. leaving the tour, and the key ---------- */
  if (want(4)) {
    console.log('4 · leaving, and the key');
    let p = await page('', { wait: 0 }); await welcomeUp(p);
    await p.click('#isx-wl .wl-go'); await settle(p); await next(p); await settle(p); await next(p); await settle(p);
    await p.click('#isx-wltip [data-wt="skip"]'); await settle(p);
    let v = await vis(p, PARTS.flat());
    let r = await p.evaluate(() => ({ step: ISX.step, on: ISX.tour.on, key: localStorage.getItem('isx-intro') }));
    ok('“Skip the tour” at stop 3 brings in the rest together, on step 00; the tour counts as taken', allOn(v) && r.step === 0 && !r.on && r.key === 'toured', [r, v.filter(x => x[1] !== true)]);
    await done(p);
    p = await page('', { wait: 0 }); await welcomeUp(p);
    await p.click('#isx-wl .wl-go'); await settle(p); await p.keyboard.press('Escape'); await settle(p);
    ok('Esc in the tour is “Skip the tour”', await p.evaluate(() => !ISX.tour.on && ISX.step === 0 && localStorage.getItem('isx-intro') === 'toured'));
    await done(p);
    p = await page('', { wait: 0 }); await welcomeUp(p);
    await p.click('#isx-wl input[data-wl-off]');
    ok('ticking the box on the welcome writes isx-intro “off”', await p.evaluate(() => localStorage.getItem('isx-intro') === 'off'));
    await p.click('#isx-wl input[data-wl-off]');
    ok('unticking it gives the key back', await p.evaluate(() => localStorage.getItem('isx-intro') === null));
    await p.click('#isx-wl input[data-wl-off]'); await p.click('#isx-wl .wl-skip'); await settle(p);
    await p.reload({ waitUntil: 'load' }); await p.waitForFunction(() => ISX.booted); await p.waitForTimeout(1500);
    ok('ticked: the next visit has no welcome', await p.evaluate(() => !document.querySelector('#isx-wl') && !document.getElementById('isx-root').classList.contains('wl-stage')));
    await p.evaluate(() => document.getElementById('isx-v-profit').click()); await p.waitForTimeout(800);
    ok('one tick turns off the tabs’ entry screens too', await p.evaluate(() => !document.getElementById('isx-enter')));
    await done(p);
    p = await page('', { wait: 0 }); await welcomeUp(p);
    await p.click('#isx-wl .wl-go'); for (let i = 0; i < 5; i++) { await settle(p); await next(p); } await settle(p);
    await p.click('#isx-wltip input[data-wl-off]');
    ok('the last stop’s box writes the same key', await p.evaluate(() => localStorage.getItem('isx-intro') === 'off'));
    await next(p); await settle(p);
    ok('…and finishing the tour keeps “off” (the stronger choice)', await p.evaluate(() => localStorage.getItem('isx-intro') === 'off' && ISX.step === 1));
    await done(p);
    p = await page('#profit', { ls: { 'isx-enter': null } }); await p.waitForFunction(() => !!document.getElementById('isx-enter'), null, { timeout: 10000 }).catch(() => {});
    r = await p.evaluate(() => { const i = document.querySelector('#isx-enter input[data-en-off]'); return { box: !!i, k: document.querySelector('#isx-enter .en-k').textContent.replace(/\s+/g, ' ') }; });
    ok('a tab’s entry screen carries the box, numbered “03 of 05” (the order is third since T1, 26 Nov)', r.box && /03 of 05/.test(r.k), r);
    await p.waitForTimeout(5000);   /* the screen's slow arrival: a first press shows the rest at once, and moves what is under the pointer */
    await p.click('#isx-enter input[data-en-off]');
    ok('its box writes the same key', await p.evaluate(() => localStorage.getItem('isx-intro') === 'off' && !!document.getElementById('isx-enter')));
    await p.goto('about:blank'); await p.goto(base, { waitUntil: 'load' }); await p.waitForFunction(() => ISX.booted); await p.waitForTimeout(1200);
    ok('…which keeps the Circuit’s welcome away as well', await p.evaluate(() => !document.querySelector('#isx-wl')));
    await p.goto('about:blank'); await p.goto(base + '#replay', { waitUntil: 'load' }); await p.waitForFunction(() => ISX.booted);
    ok('“#replay” clears the key: the welcome is back', await p.evaluate(() => localStorage.getItem('isx-intro') === null && window.__isxWelcome === 'stage'));
    await done(p);
    p = await page('', { ls: { 'isx-tour': 'off' }, wait: 800 });
    ok('the old key folds in once: the old Circuit tour taken counts as this one taken', await p.evaluate(() => localStorage.getItem('isx-intro') === 'toured' && !document.querySelector('#isx-wl')));
    await done(p);
  }

  /* ---------- 5. Tour in the header, and deep links ---------- */
  if (want(5)) {
    console.log('5 · Tour, and deep links');
    let p = await page('#profit', { ls: { 'isx-intro': 'toured', 'isx-enter': 'off' }, wait: 1200 });
    await p.click('#isx-helpb'); await p.waitForTimeout(200);   /* 20 Nov 2026: the Tour sits in the “?” menu */
    let r = await p.evaluate(() => { const t = document.getElementById('isx-tourb'); return { vis: t.getClientRects().length > 0, lab: t.getAttribute('aria-label'), next: t.previousElementSibling && t.previousElementSibling.id, ban: !!document.getElementById('isx-wlban') }; });
    ok('“Tour” in the header’s “?” menu, under “How this tab works” (20 Nov 2026), on every tab; no offer once the tour is taken', r.vis && /^Take the 1-minute tour/.test(r.lab) && r.next === 'isx-tabx' && !r.ban, r);
    await p.click('#isx-tourb'); await p.waitForFunction(() => ISX.tour.on, null, { timeout: 8000 }).catch(() => {}); await settle(p);
    r = await p.evaluate(() => ({ v: ISX.view, at: ISX.welcome.at, stage: document.getElementById('isx-root').classList.contains('wl-stage'), wl: !!document.querySelector('#isx-wl') }));
    ok('from another tab it switches to the Circuit and runs the tour from stop 1 (no welcome), on the bare map again', r.v === 'map' && r.at === 1 && r.stage && !r.wl, r);
    await p.keyboard.press('Escape'); await settle(p); await done(p);
    p = await page('#profit', { ls: { 'isx-enter': 'off' }, wait: 1500 });
    r = await p.evaluate(() => { const b = document.getElementById('isx-wlban'), h = document.querySelector('.hud-top').getBoundingClientRect(); return b ? { t: b.textContent.replace(/\s+/g, ' ').trim(), below: b.getBoundingClientRect().top >= h.bottom, stage: document.getElementById('isx-root').classList.contains('wl-stage'), wl: !!document.querySelector('#isx-wl') } : null; });
    ok('a deep link: no welcome, nothing held back; one line under the header “New here? Take the 1-minute tour ×”', r && /New here\?\s*Take the 1-minute tour\s*×/.test(r.t) && r.below && !r.stage && !r.wl, r);
    await p.click('#isx-wlban .wl-bx');
    ok('× hides it for this visit', await p.evaluate(() => !document.getElementById('isx-wlban') && localStorage.getItem('isx-intro') === null));
    await p.reload({ waitUntil: 'load' }); await p.waitForFunction(() => ISX.booted); await p.waitForTimeout(1500);
    ok('…and it is back on the next', await p.evaluate(() => !!document.getElementById('isx-wlban')));
    await p.click('#isx-wlban .wl-bgo'); await p.waitForFunction(() => ISX.tour.on, null, { timeout: 8000 }).catch(() => {}); await settle(p);
    ok('its link runs the tour on the Circuit from stop 1', await p.evaluate(() => ISX.view === 'map' && ISX.welcome.at === 1 && !document.getElementById('isx-wlban')));
    await p.evaluate(() => document.getElementById('isx-v-arm').click()); await p.waitForTimeout(600);
    ok('leaving the Circuit mid-tour ends it and brings everything back', await p.evaluate(() => !ISX.tour.on && !document.getElementById('isx-root').classList.contains('wl-stage')));
    await done(p);
    p = await page('#circuit/07', { wait: 1500 });
    ok('#circuit/07: the step, no welcome, the offer', await p.evaluate(() => ISX.step === 7 && !document.querySelector('#isx-wl') && !!document.getElementById('isx-wlban')));
    await done(p);
    p = await page('', { ls: { 'isx-intro': 'toured' }, wait: 1200 });
    await p.evaluate(() => document.querySelector('#isx-hint [data-tips="globe"], #isx-tray-layers [data-tips="globe"], [data-tips="globe"]').click()); await p.waitForTimeout(600);
    ok('“Take the tour” under the globe runs it from stop 2', await p.evaluate(() => ISX.tour.on && ISX.welcome.at === 2));
    await done(p);
  }

  /* ---------- 6. phones ---------- */
  if (want(6)) {
    console.log('6 · phones (390 × 844)');
    const p = await page('', { w: 390, h: 844, touch: true, wait: 0 }); await welcomeUp(p); await p.waitForFunction(() => !document.getElementById('isx-wl').getAnimations().length, null, { timeout: 8000 }).catch(() => {});
    let r = await p.evaluate(() => { const c = document.getElementById('isx-wl').getBoundingClientRect(); return { bottom: Math.round(innerHeight - c.bottom), w: Math.round(c.width), h: c.height / innerHeight, side: document.documentElement.scrollWidth - innerWidth }; });
    ok('the welcome is a bottom sheet, no taller than 55% of the screen, no sideways scroll', Math.abs(r.bottom) <= 1 && r.w === 390 && r.h <= .56 && r.side <= 0, r);
    await p.mouse.click(195, 120); await p.waitForTimeout(400);
    ok('a tap outside the sheet does nothing', await p.evaluate(() => !!document.querySelector('#isx-wl') && !ISX.tour.on));
    await p.click('#isx-wl .wl-go'); await settle(p); await p.waitForTimeout(700);
    r = await p.evaluate(() => { const t = document.getElementById('isx-wltip').getBoundingClientRect(), c = document.getElementById('isx-cmd').getBoundingClientRect(); return { sheet: document.getElementById('isx-wltip').dataset.side, bottom: Math.round(innerHeight - t.bottom), h: t.height / innerHeight, cardTop: Math.round(c.top), cardAbove: c.top >= 0 && c.top < t.top }; });
    ok('stop 1: the tip is a sheet, the story card scrolled into view above it', r.sheet === 'sheet' && Math.abs(r.bottom) <= 1 && r.h <= .56 && r.cardAbove, r);
    const heads = [];
    for (let i = 0; i < 6; i++) {
      if (i) { await next(p); await settle(p); await p.waitForTimeout(500); }
      const on = await vis(p, PHONE_PARTS[i]);
      const t = await p.evaluate(() => { const t = document.getElementById('isx-wltip'), tr = t.getBoundingClientRect(); return { h: t.querySelector('h3').textContent, p: t.querySelector('p').textContent, inView: tr.top >= 0 && tr.bottom <= innerHeight + 1 }; });
      heads.push(t.h);
      ok(`phone stop ${i + 1}: its parts in, the tip on screen`, allOn(on) && t.inView, { on, t });
      if (i === 2) ok('phone stop 3: the tiles’ strip, “Swipe for more”', /Swipe for more\.$/.test(t.p), t.p);
    }
    ok('phone: the same six stops', heads.length === 6 && new Set(heads).size === 6, heads);
    await next(p); await settle(p);
    ok('phone: “Start the loop” goes to step 01', await p.evaluate(() => ISX.step === 1 && !ISX.tour.on));
    await done(p);
  }

  /* ---------- 7. reduced motion, no WebGL, blocked storage ---------- */
  if (want(7)) {
    console.log('7 · reduced motion, no WebGL, blocked storage');
    let p = await page('', { rm: true, wait: 400 });
    let r = await p.evaluate(() => ({ on: ISX.opening.on, opc: document.getElementById('isx-root').classList.contains('op-c'), wl: !!document.querySelector('#isx-wl'), anim: getComputedStyle(document.getElementById('isx-wl')).animationName }));
    ok('reduced motion: no fly-in; the welcome is there at once, still', !r.on && !r.opc && r.wl && r.anim === 'none', r);
    await p.click('#isx-wl .wl-go'); await p.waitForTimeout(80);
    r = await p.evaluate(() => ({ pop: document.querySelectorAll('.wl-pop, .wl-fade').length, vis: getComputedStyle(document.getElementById('isx-cmd')).visibility, tip: getComputedStyle(document.getElementById('isx-wltip')).transitionDuration }));
    ok('reduced motion: each stop comes in at once', r.pop === 0 && r.vis === 'visible' && /^0s/.test(r.tip), r);
    await p.keyboard.press('Enter'); await p.waitForTimeout(80);
    ok('Enter is Next', await p.evaluate(() => ISX.welcome.at === 2));
    await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(80);
    ok('← is Back', await p.evaluate(() => ISX.welcome.at === 1));
    await done(p);
    p = await page('', { nogl: true, wait: 400 }); await welcomeUp(p);
    await p.click('#isx-wl .wl-go'); await next(p); await settle(p);
    r = await p.evaluate(() => ({ nogl: document.getElementById('isx-root').classList.contains('no-gl'), p: document.querySelector('#isx-wltip p').textContent, at: ISX.welcome.at }));
    ok('no WebGL: the welcome and the tips work; stop 2 drops “drag to turn it”', r.nogl && r.at === 2 && !/drag|swipe/i.test(r.p) && /^Click a country/.test(r.p), r);
    await done(p);
    p = await page('', { block: true, wait: 0 }); await welcomeUp(p);
    ok('storage blocked: the welcome shows', await p.evaluate(() => !!document.querySelector('#isx-wl')));
    await p.click('#isx-wl input[data-wl-off]'); await settle(p);
    ok('storage blocked: the box simply closes it', await p.evaluate(() => !document.querySelector('#isx-wl') && !document.getElementById('isx-root').classList.contains('wl-stage')));
    await done(p);
  }

  if (errors.length) { fail++; console.log('  FAIL page errors :: ' + JSON.stringify(errors).slice(0, 600)); }
  console.log(`\n${pass} pass, ${fail} fail`);
  await b.close();
  process.exit(fail ? 1 : 0);
})();
