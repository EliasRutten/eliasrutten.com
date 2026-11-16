/* Round 5b (16 Nov 2026): checks for the lever row, the hints at first use and the two first openings.
   Spec: claude/specs/guide-entry-16-nov.md §5, §2, §4.
   Usage: node tools/onboard-check.js [baseUrl] [--only=1,2,3,4]   (1 the lever row, 2 the hints, 3 the openings, 4 the Arm's hints, round 6)
   Start `python3 -m http.server 8731` at the repo root first. Run it alone: section 3 reads the clock. */
const { chromium } = require('playwright');
const base = (process.argv.slice(2).find(a => !a.startsWith('--')) || 'http://127.0.0.1:8731/imperial-stack/');
const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean).map(Number);
const want = n => !only.length || only.includes(n);
let pass = 0, fail = 0;
const ok = (name, cond, info) => { if (cond) { pass++; console.log('  ok   ' + name); } else { fail++; console.log('  FAIL ' + name + (info !== undefined ? ' :: ' + JSON.stringify(info).slice(0, 400) : '')); } };
const QUIET = { 'isx-tips-globe': 'off', 'isx-tour': 'off', 'isx-simtour': 'off', 'isx-first': 'off', 'isx-insights': 'off' };
const SEEN = { 'isx-open-circuit': '1', 'isx-open-sim': '1' };

(async () => {
  const b = await chromium.launch(), errors = [];
  const page = async (hash, o = {}) => {
    const c = await b.newContext({ viewport: { width: o.w || 1440, height: o.h || 900 }, deviceScaleFactor: 1, reducedMotion: o.rm ? 'reduce' : 'no-preference', hasTouch: !!o.touch });
    await c.addInitScript(([ls, pos]) => { try { if (sessionStorage.getItem('isx-check-set')) return; sessionStorage.setItem('isx-check-set', '1'); for (const k in ls) localStorage.setItem(k, ls[k]); if (pos) sessionStorage.setItem('isx-sim-pos', pos); } catch (e) {} }, [o.ls || {}, o.pos ? JSON.stringify(o.pos) : null]);
    const p = await c.newPage();
    p.on('pageerror', e => errors.push(hash + ': ' + String(e).slice(0, 200)));
    await p.goto(base + hash, { waitUntil: 'load' });
    await p.waitForFunction(() => window.ISX && ISX.booted, null, { timeout: 60000 });
    await p.waitForTimeout(o.wait == null ? 2200 : o.wait);
    return p;
  };
  const done = p => p.context().close();

  /* ---------- 1. the lever row ---------- */
  if (want(1)) {
    console.log('1 · the lever row');
    const SPEC = [['US Treasury', ['Bills', 'Buybacks', 'Swap lines', 'Oil waiver', 'Yen action']], ['Federal Reserve', ['Fed bills', 'Rate hike', 'Repo']], ['Regulators', ['Bank rule', 'Clearing']], ['Congress', ['Stablecoins', 'Tax cuts']], ['White House', ['Tariffs', 'Pledges', 'Oil stocks', 'Escorts', 'Headlines']]];
    let p = await page('#simulator', { ls: { ...QUIET, ...SEEN, 'isx-hints-off': '1', 'isx-sim-mode': 'full' } });
    await p.evaluate(() => document.querySelector('[data-s4tab="levers"]').click()); await p.waitForTimeout(500);
    let r = await p.evaluate(() => { const bar = document.getElementById('isx-levbar'), tray = document.getElementById('isx-s2tray-lev');
      return { groups: [...bar.querySelectorAll('.lvg')].map(g => [g.querySelector('.lvh').textContent, [...g.querySelectorAll('.lv')].map(b => b.textContent.trim())]), h: Math.round(tray.getBoundingClientRect().height), sw: document.getElementById('isx-lvsc').scrollWidth, cw: document.getElementById('isx-lvsc').clientWidth, relIn: bar.querySelector('.lv-rel').getBoundingClientRect().right <= tray.getBoundingClientRect().right,
        chips: [...new Set([...bar.querySelectorAll('.lv')].map(b => Math.round(b.getBoundingClientRect().height)))], stops: [...bar.querySelectorAll('.lv, .lv-rel')].filter(b => b.tabIndex === 0).length, role: bar.getAttribute('role'),
        rel: bar.querySelector('.lv-rel').disabled, hold: ISX.lhold.map(H => H.n), type: Math.min(...[...bar.querySelectorAll('.lv b, .lvh')].map(e => parseFloat(getComputedStyle(e).fontSize))), keyOver: (() => { const k = document.querySelector('#isx-s2low .tw-keyw'); const low = Math.max(...[...document.querySelectorAll('#isx-rmap .fn')].map(g => g.getBoundingClientRect().bottom)); return k ? Math.round(low - k.getBoundingClientRect().top) : null; })() }; });
    ok('five groups named by who pulls, 17 levers in the spec’s order', JSON.stringify(r.groups) === JSON.stringify(SPEC), r.groups);
    ok('each holder is an actor on the map (TSY, FED, REG, CGR, WH)', r.hold.join() === 'TSY,FED,REG,CGR,WH', r.hold);
    ok('one row of about 66 px, pills 30 px, nothing under 10.5 px', Math.abs(r.h - 66) <= 2 && r.chips.join() === '30' && r.type >= 10.5, [r.h, r.chips, r.type]);
    ok('1440 px: the row fits without scrolling, Release at its end', r.sw <= r.cw && r.relIn, [r.sw, r.cw, r.relIn]);
    ok('the row is a toolbar with one stop in the tab order; Release is off while nothing is pulled', r.role === 'toolbar' && r.stops === 1 && r.rel, [r.role, r.stops, r.rel]);
    ok('the key line under the stage no longer lies over the map (entry spec §6)', r.keyOver != null && r.keyOver <= 2, r.keyOver);
    await p.focus('#isx-levbar .lv[data-l="0"]'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
    r = await p.evaluate(() => ({ at: document.activeElement.dataset.l, stops: [...document.querySelectorAll('#isx-levbar .lv, #isx-levbar .lv-rel')].filter(b => b.tabIndex === 0).length, hov: [...document.querySelectorAll('#isx-rmap .fn.lvhv')].map(g => g.dataset.n) }));
    ok('← → move between the levers (Bills → Buybacks → Swap lines), still one tab stop', r.at === '11' && r.stops === 1, r);
    ok('a focused group outlines its holder on the map', r.hov.join() === 'TSY', r.hov);
    await p.keyboard.press('End'); r = await p.evaluate(() => document.activeElement.dataset.l); ok('End jumps to the last lever (Release is off, so it is passed over)', r === '15', r);
    await p.evaluate(() => { document.querySelector('#isx-levbar .lv[data-l="0"]').click(); document.querySelector('#isx-levbar .lv[data-l="14"]').click(); }); await p.waitForTimeout(1100);
    r = await p.evaluate(() => { const d = document.getElementById('isx-rside'); return { on: ISX.levers, out: [...document.querySelectorAll('#isx-rmap .fn.lvo')].map(g => g.dataset.n).sort(), rings: [...document.querySelectorAll('#isx-rmap .lvring text')].map(t => t.textContent), rel: document.getElementById('isx-lvrel').textContent, relOff: document.getElementById('isx-lvrel').disabled,
      k: d.querySelector('.pk').textContent, foot: d.querySelector('.lvfoot').textContent.replace(/\s+/g, ' '), lvc: d.classList.contains('lvc'), dots: [...document.querySelectorAll('#isx-levbar .lv.on .lvd')].map(e => getComputedStyle(e).backgroundColor) }; });
    ok('two pulled: both holders keep a gold outline with the number pulled', r.out.join() === 'FED,TSY' && r.rings.join() === '1,1', r);
    ok('the row’s Release shows the count; the status dots are gold', /^Release 2 pulled levers: release them all$/.test(r.rel) && !r.relOff && r.dots.every(c => c === 'rgb(255, 181, 71)'), [r.rel, r.dots]);
    ok('the lever’s card: kicker “Lever · Federal Reserve”, Release and “2 of 17 pulled” in its foot', r.lvc && r.k === 'Lever · Federal Reserve' && /Release\s*2 of 17 pulled/.test(r.foot), [r.k, r.foot]);
    await p.evaluate(() => document.querySelector('#isx-rside [data-lvrel]').click()); await p.waitForTimeout(300);
    r = await p.evaluate(() => ({ on: ISX.levers, k: (document.querySelector('#isx-rside .pk') || {}).textContent })); ok('the card’s Release lets go of that lever only; the card turns to the one still pulled', r.on.join() === '0' && r.k === 'Lever · US Treasury', r);
    await p.evaluate(() => document.getElementById('isx-lvrel').click()); await p.waitForTimeout(300);
    r = await p.evaluate(() => ({ on: ISX.levers.length, out: document.querySelectorAll('#isx-rmap .fn.lvo, #isx-rmap .lvring').length, side: document.getElementById('isx-rside').hidden })); ok('the row’s Release lets go of everything', r.on === 0 && r.out === 0 && r.side, r);
    await done(p);
    for (const [w, h] of [[1280, 760], [1024, 768]]) {
      p = await page('#simulator', { w, h, ls: { ...QUIET, ...SEEN, 'isx-hints-off': '1', 'isx-sim-mode': 'full' } });
      await p.evaluate(() => { document.querySelector('[data-s4tab="levers"]').click(); }); await p.waitForTimeout(500);
      r = await p.evaluate(() => { const bar = document.getElementById('isx-lvsc'), rel = document.getElementById('isx-lvrel').getBoundingClientRect(); return { scroll: bar.scrollWidth > bar.clientWidth, fade: bar.classList.contains('more-r'), rel: rel.width > 0 && rel.right <= innerWidth, page: document.documentElement.scrollWidth - innerWidth, h: Math.round(document.getElementById('isx-s2tray-lev').getBoundingClientRect().height) }; });
      ok(`${w} px: the levers scroll sideways with a fade at the edge, Release stays in view; the page itself does not`, r.scroll && r.fade && r.rel && r.page <= 0 && Math.abs(r.h - 66) <= 2, r);
      await done(p);
    }
    p = await page('#simulator', { w: 390, h: 844, touch: true, ls: { ...QUIET, ...SEEN, 'isx-hints-off': '1', 'isx-sim-mode': 'full' } });
    await p.evaluate(() => { document.querySelector('[data-s4tab="levers"]').click(); }); await p.waitForTimeout(500);
    r = await p.evaluate(() => ({ n: [...document.querySelectorAll('#isx-levbar .lv')].filter(b => b.getClientRects().length).length, page: document.documentElement.scrollWidth - innerWidth, min: Math.min(...[...document.querySelectorAll('#isx-levbar .lv')].map(b => b.getBoundingClientRect().height)) }));
    ok('phone: all 17 levers on show, wrapped by group, 36 px tall, no sideways scroll', r.n === 17 && r.page <= 0 && r.min >= 36, r);
    await done(p);
    /* the guide: a holder the guide has not reached is never outlined (stage 5) */
    p = await page('#simulator', { ls: { ...QUIET, ...SEEN, 'isx-hints-off': '1', 'isx-sim-mode': 'story' }, pos: { l: 0, b: 3 } });
    r = await p.evaluate(() => { const S = ISX.sim, reached = new Set(S.lines[0].steps[3].n); const before = ISX.lhold.filter(H => !reached.has(H.n)).map(H => H.n);
      const lv = document.querySelector('#isx-cock .lv[data-l="10"]'); lv.click(); const out = [...document.querySelectorAll('#isx-rmap .fn.lvo')].map(g => g.dataset.n); lv.click(); return { before, out }; });
    ok('guide, step 4: a pulled lever whose holder the guide has not reached outlines nothing', !r.before.includes('WH') || r.out.length === 0, r);
    await done(p);
  }

  /* ---------- 2. the hints ---------- */
  if (want(2)) {
    console.log('2 · the hints at first use');
    const LINES = { call: 'No right answer, no score. Choose, then see what happened; the other path stays open.', next: 'Next, or → on your keyboard.', term: 'Dotted words have a definition: hover, or tap.', map: 'Click anything lit on the map for what it does and its sources.',
      gauge: 'A new indicator: its figure, date and source. All of them sit under Indicators.', door: 'A deeper view of this part. Close it to come back here.', fold: 'More on this step is folded under “The mechanism”.' };
    const hintOf = p => p.evaluate(() => { const b = document.getElementById('isx-hint7'); return { on: ISX.hints.on, shown: !!b && !b.hidden && b.classList.contains('in'), text: b ? b.querySelector('.hn-t').textContent : '', role: b ? b.getAttribute('role') : '', focusIn: !!b && b.contains(document.activeElement), marks: document.querySelectorAll('.hn-on').length }; });
    let p = await page('#simulator', { ls: { ...QUIET, ...SEEN, 'isx-sim-mode': 'story' } });
    let r = await p.evaluate(() => ({ ids: ISX.hints.ids.filter(k => ISX.hints.tabs[k] === 'fin').sort(), lines: ISX.hints.lines(), on: ISX.hints.on, entry: document.getElementById('isx-cock').classList.contains('s4open') }));
    ok('seven hints, with the spec’s lines word for word', r.ids.join() === Object.keys(LINES).sort().join() && Object.keys(LINES).every(k => r.lines[k] === LINES[k]), r.lines);
    ok('none on the entry (it says how the guide works itself)', r.entry && !r.on, r);
    await p.evaluate(() => document.querySelector('#isx-gentry [data-way="guide"]').click());
    await p.waitForFunction(() => ISX.hints.on, null, { timeout: 8000 }).catch(() => {}); await p.waitForTimeout(400);
    r = await hintOf(p);
    ok('the first card carries “Next”: a status note that takes no focus, with its control outlined', r.on === 'next' && r.shown && r.role === 'status' && !r.focusIn && r.marks === 1 && r.text === LINES.next, r);
    const seenIds = ['next'], perStep = [];
    for (let i = 0; i < 9; i++) {
      await p.keyboard.press('ArrowRight'); await p.waitForTimeout(250);
      const gone = await p.evaluate(() => ISX.hints.on); if (i === 0) ok('it ends when the step changes', !gone, gone);
      await p.waitForTimeout(2300); const h = await p.evaluate(() => ISX.hints.on); perStep.push(h); if (h) seenIds.push(h);
    }
    ok('one hint per step at most, none twice', new Set(seenIds).size === seenIds.length, seenIds);
    ok('term, map, gauge, door and fold each came up on the way through first principles', ['term', 'map', 'gauge', 'door', 'fold'].every(k => seenIds.includes(k)), seenIds);
    r = await p.evaluate(() => (localStorage.getItem('isx-hints') || '').split(',').sort()); ok('what was shown is stored (isx-hints)', seenIds.every(k => r.includes(k)), r);
    await done(p);
    /* each hint ends when the visitor does what it says */
    p = await page('#simulator', { ls: { ...QUIET, ...SEEN, 'isx-hints': 'next', 'isx-sim-mode': 'story' }, pos: { l: 12, b: 2 } });
    await p.waitForFunction(() => ISX.hints.on === 'term', null, { timeout: 8000 }).catch(() => {});
    r = await hintOf(p); ok('a dotted word: the hint stands beside the card', r.on === 'term' && r.shown, r);
    await p.hover('#isx-sn-body dfn.df'); await p.waitForTimeout(500); ok('opening the definition ends it', !(await p.evaluate(() => ISX.hints.on)));
    await done(p);
    p = await page('#simulator', { ls: { ...QUIET, ...SEEN, 'isx-hints': 'next,term', 'isx-sim-mode': 'story' }, pos: { l: 12, b: 1 } });
    await p.waitForFunction(() => ISX.hints.on === 'map', null, { timeout: 8000 }).catch(() => {});
    r = await p.evaluate(() => { const on = ISX.hints.on; const g = document.querySelector('#isx-rmap .fn.hn-on'); if (g) g.dispatchEvent(new MouseEvent('click', { bubbles: true })); return { on, picked: !!g }; }); await p.waitForTimeout(300);
    ok('the map: picking the outlined actor ends it', r.on === 'map' && r.picked && !(await p.evaluate(() => ISX.hints.on)), r);
    await done(p);
    p = await page('#simulator', { ls: { ...QUIET, ...SEEN, 'isx-sim-mode': 'story' }, pos: { l: 0, b: 25, ph: 'ask' } });
    await p.waitForFunction(() => ISX.hints.on === 'call', null, { timeout: 8000 }).catch(() => {});
    r = await hintOf(p); ok('a decision carries “No right answer, no score…” before anything else', r.on === 'call' && r.text === LINES.call, r);
    await p.evaluate(() => document.querySelector('#isx-sn-body .sn-opt').click()); await p.waitForTimeout(300); ok('choosing ends it', (await p.evaluate(() => ISX.hints.on)) !== 'call');
    await done(p);
    p = await page('#simulator', { ls: { ...QUIET, ...SEEN, 'isx-sim-mode': 'story' }, pos: { l: 12, b: 0 } });
    await p.waitForFunction(() => ISX.hints.on, null, { timeout: 8000 }).catch(() => {}); await p.waitForTimeout(300);
    await p.evaluate(() => document.querySelector('#isx-hint7 [data-hn="off"]').click()); await p.waitForTimeout(300);
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(2600);
    r = await p.evaluate(() => ({ on: ISX.hints.on, off: localStorage.getItem('isx-hints-off') })); ok('“Hide hints” ends them for good (isx-hints-off)', !r.on && r.off === '1', r);
    await done(p);
    p = await page('#simulator', { ls: { ...QUIET, ...SEEN, 'isx-tips-sim': 'off', 'isx-sim-mode': 'story' }, pos: { l: 12, b: 0 }, wait: 4200 });
    ok('the check scripts’ switch (isx-tips-sim off) keeps the hints away', !(await p.evaluate(() => ISX.hints.on)));
    await done(p);
    p = await page('#simulator', { ls: { ...QUIET, ...SEEN, 'isx-sim-mode': 'full' }, wait: 4200 });
    r = await hintOf(p); ok('the full map carries the map’s hint, and only that', r.on === 'map' && r.shown, r);
    await done(p);
    p = await page('#simulator', { rm: true, ls: { ...QUIET, ...SEEN, 'isx-sim-mode': 'story' }, pos: { l: 12, b: 0 }, wait: 2500 });
    r = await p.evaluate(() => { const b = document.getElementById('isx-hint7'), m = document.querySelector('.hn-on'); return { on: ISX.hints.on, tr: b ? getComputedStyle(b).transitionDuration : '', an: m ? getComputedStyle(m).animationName : '' }; });
    ok('reduced motion: the hint is there, nothing pulses or slides', r.on === 'next' && /^0s/.test(r.tr) && r.an === 'none', r);
    await done(p);
    p = await page('#simulator', { w: 390, h: 844, touch: true, ls: { ...QUIET, ...SEEN, 'isx-sim-mode': 'story' }, pos: { l: 13, b: 0 }, wait: 3800 });
    r = await p.evaluate(() => { const b = document.getElementById('isx-hint7'), c = document.getElementById('isx-snarr'); const x = b.getBoundingClientRect(), y = c.getBoundingClientRect(); return { on: ISX.hints.on, text: b.querySelector('.hn-t').textContent, side: b.dataset.side, clear: x.bottom <= y.top || x.top >= y.bottom, w: Math.round(x.width) }; });
    ok('phone: “Swipe the card, or tap Next.” as a sheet clear of the card', r.on === 'next' && r.text === 'Swipe the card, or tap Next.' && r.side === 'sheet' && r.clear, r);
    await done(p);
  }

  /* ---------- 4. the Arm's hints (round 6, arm spec §7): the same box, storage and rules ---------- */
  if (want(4)) {
    console.log('4 · the Arm’s hints');
    const on = p => p.evaluate(() => ISX.hints.on), wait = (p, id) => p.waitForFunction(i => ISX.hints.on === i, id, { timeout: 9000 }).catch(() => {});
    const AL = { 'arm-view': 'Two ways to read this: Reach follows the paths, Orbit shows the whole shape. Switch any time.', 'arm-door': 'Gold buttons open the case where this power was used.', 'arm-else': 'The same thing in the Circuit and the Simulator.' };
    /* a phone: the toggle first, then the pick, then the sheet */
    let p = await page('#arm', { w: 390, h: 844, touch: true, ls: { ...QUIET, ...SEEN } });
    let r = await p.evaluate(() => ({ ids: ISX.hints.ids.filter(k => ISX.hints.tabs[k] === 'arm'), lines: ISX.hints.lines() }));
    ok('six Arm hints; three lines word for word from the spec', r.ids.length === 6 && Object.keys(AL).every(k => r.lines[k] === AL[k]), r);
    await wait(p, 'arm-view');
    r = await p.evaluate(() => { const b = document.getElementById('isx-hint7'); return { on: ISX.hints.on, side: b.dataset.side, role: b.getAttribute('role'), focus: b.contains(document.activeElement), mark: !!document.querySelector('#isx-aview.hn-on') }; });
    ok('phone: “Two ways to read this” first, as a sheet, outlining the toggle; it takes no focus', r.on === 'arm-view' && r.side === 'sheet' && r.role === 'status' && !r.focus && r.mark, r);
    await p.tap('#isx-aview [data-aview="orbit"]'); await p.waitForTimeout(300);
    ok('using the toggle ends it', (await on(p)) !== 'arm-view');
    await wait(p, 'arm-pick'); r = await p.evaluate(() => ({ on: ISX.hints.on, text: document.querySelector('#isx-hint7 .hn-t').textContent }));
    ok('then the pick, worded for Orbit (“a group on the rim”)', r.on === 'arm-pick' && /on the rim/.test(r.text), r);
    await p.tap('#isx-areach [data-anode="COMM"] .hit'); await p.waitForTimeout(300);
    ok('a selection ends it', (await on(p)) !== 'arm-pick');
    await wait(p, 'arm-sheet');
    ok('the first selection on a phone: the hint names “Every link”', (await on(p)) === 'arm-sheet');
    await p.tap('#isx-asheet [data-ash="tall"]'); await p.waitForTimeout(300);
    ok('opening “Every link” ends it', (await on(p)) !== 'arm-sheet');
    await done(p);
    /* desktop: the pick, then the door and “Elsewhere on the map” */
    p = await page('#arm', { ls: { ...QUIET, ...SEEN } });
    await wait(p, 'arm-pick');
    r = await p.evaluate(() => ({ on: ISX.hints.on, text: document.querySelector('#isx-hint7 .hn-t').textContent, line: getComputedStyle(document.getElementById('isx-ahint')).visibility }));
    ok('desktop: “Click a state body … a group at the bottom …”, and the line under the machine steps aside', r.on === 'arm-pick' && /^Click a state body/.test(r.text) && /at the bottom/.test(r.text) && r.line === 'hidden', r);
    await p.evaluate(() => document.querySelector('#isx-arm [data-a="COMM"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(200);
    await wait(p, 'arm-door'); r = await p.evaluate(() => ({ on: ISX.hints.on, mark: !!document.querySelector('.adoor.hn-on') }));
    ok('a gold door on screen carries its hint', r.on === 'arm-door' && r.mark, r);
    await p.evaluate(() => document.querySelector('#isx-hint7 [data-hn="ok"]').click()); await p.waitForTimeout(300);
    ok('“Got it” ends it', !(await on(p)));
    await p.evaluate(() => ISX.setArmSel('TREA')); await wait(p, 'arm-else');
    ok('the next state carries “Elsewhere on the map”', (await on(p)) === 'arm-else');
    await p.evaluate(() => ISX.setArmRel('control')); await p.waitForTimeout(400);
    await p.evaluate(() => document.querySelector('#isx-acard [data-acard="links"]').click()); await wait(p, 'arm-switch');
    ok('Control with the switchboard open: the switch hint', (await on(p)) === 'arm-switch');
    await p.evaluate(() => document.querySelector('.aboard [data-atile]').click()); await p.waitForTimeout(300);
    ok('opening a tile ends it', (await on(p)) !== 'arm-switch');
    r = await p.evaluate(() => (localStorage.getItem('isx-hints') || '').split(','));
    ok('each shown once and stored (isx-hints)', ['arm-pick', 'arm-door', 'arm-else', 'arm-switch'].every(k => r.includes(k)), r);
    await done(p);
    p = await page('#arm', { ls: { ...QUIET, ...SEEN, 'isx-hints-off': '1' } });
    ok('“Hide hints” (isx-hints-off) keeps the Arm’s away too', !(await on(p)));
    await done(p);
  }

  /* ---------- 3. the first openings ---------- */
  if (want(3)) {
    console.log('3 · the first openings');
    const PROPS = ['opacity', 'transform', 'translate', 'scale', 'strokeDashoffset'];
    const props = p => p.evaluate(P => { const bad = new Set(); document.getAnimations().forEach(a => { const el = a.effect && a.effect.target; if (!el || !(el.closest('.op-ttl, .op-svg, .op-dark, .op-clip, .op-cnt, .op-skip, #isx-op-g, #isx-gentry, #isx-stage') || el.matches('.resbar, .cmd6, .tabs-bottom, .legbox2, .zoom6, .mapmodes, .hint, .mapnote, .vchip, .mstep, .dock6, .b4row'))) return;
      a.effect.getKeyframes().forEach(k => Object.keys(k).forEach(n => { if (!['offset', 'easing', 'composite', 'computedOffset'].includes(n) && !P.includes(n)) bad.add(n); })); }); return [...bad]; }, PROPS);
    let p = await page('', { ls: { 'isx-tour': 'off', 'isx-simtour': 'off', 'isx-insights': 'off' }, wait: 0 });
    const t0 = Date.now();
    let r = await p.evaluate(() => ({ on: ISX.opening.on, opc: document.getElementById('isx-root').classList.contains('op-c'), inst: ['.resbar', '.cmd6', '.tabs-bottom'].map(s => +getComputedStyle(document.querySelector('#isx-frame ' + s)).opacity), head: +getComputedStyle(document.querySelector('#isx-frame .hud-top')).opacity, loops: ISXP.loops() }));
    ok('a first visit without a link opens on the Circuit’s opening; the header stays, the instruments wait', r.on === 'circuit' && r.opc && r.inst.every(v => v === 0) && r.head === 1, r);
    ok('it is a one-shot in the loop registry (“opening”)', r.loops.includes('opening'), r.loops);
    await p.waitForTimeout(1500);
    r = await p.evaluate(() => { const t = document.querySelector('.op-ttl'); return { k: t.querySelector('.op-k').textContent, l1: t.querySelector('.op-l1').textContent, l2: t.querySelector('.op-l2').textContent, hid: t.getAttribute('aria-hidden'), canvasFx: (c => c ? [getComputedStyle(c).filter, getComputedStyle(c).clipPath, getComputedStyle(c).maskImage] : null)(document.querySelector('#isx-globe canvas')) }; });
    ok('the title: “The dollar loop” / “The world’s savings” / “come home”', r.k === 'The dollar loop' && r.l1 === 'The world’s savings' && r.l2 === 'come home' && r.hid === 'true', r);
    ok('nothing filters, clips or masks the globe’s canvas', r.canvasFx && r.canvasFx.every(v => v === 'none'), r.canvasFx);
    await p.waitForFunction(() => !ISX.opening.on || ISX.opening.t > 4.9, null, { timeout: 30000 });
    r = await p.evaluate(() => ({ lines: document.querySelectorAll('.op-svg .op-loop path').length, ring: document.querySelectorAll('.op-svg .op-ring').length, pulse: document.querySelectorAll('.op-svg .op-pulse').length, spin: ISX.globe ? ISX.globe.controls().autoRotate : null }));
    ok('the loop is drawn from the map’s own flows, with the closing ring and one ring at Wall Street; the globe holds still under it', r.lines >= 3 && r.ring === 1 && r.pulse === 1 && r.spin === false, r);
    r = await props(p); ok('only opacity, transform and stroke-dashoffset are animated', !r.length, r);
    await p.waitForFunction(() => !ISX.opening.on, null, { timeout: 30000 }); const took = (Date.now() - t0) / 1000;
    ok('it runs about 6.6 s', took > 5.6 && took < 9.5, took);   /* the page booted a moment before the clock here started; headless frames are slow */
    await p.waitForTimeout(1600);
    r = await p.evaluate(() => ({ left: document.querySelectorAll('.op-ttl, .op-svg, .op-dark, .op-gl, .op-skip').length, cls: document.getElementById('isx-root').className, inst: ['.resbar', '.cmd6', '.tabs-bottom', '.legbox2'].map(s => +getComputedStyle(document.querySelector('#isx-frame ' + s)).opacity), seen: localStorage.getItem('isx-open-circuit'), first: !!document.querySelector('#isx-insight.in.first'), quiet: document.getElementById('isx-root').classList.contains('isx-quiet'), scale: getComputedStyle(document.querySelector('.globebox')).scale + getComputedStyle(document.querySelector('.globebox')).transform }));
    ok('after it: nothing of it is left, the instruments are in, and it is stored (isx-open-circuit)', r.left === 0 && !/\bop-/.test(r.cls) && r.inst.every(v => v === 1) && r.seen === '1' && r.scale === 'nonenone', r);
    ok('the first line follows it, and does not hide the instruments again', r.first && !r.quiet, r);
    /* the Simulator's, on the first entry into its tab */
    await p.evaluate(() => document.getElementById('isx-v-fin').click()); const t1 = Date.now();
    r = await p.evaluate(() => ({ on: ISX.opening.on, card: +getComputedStyle(document.querySelector('#isx-gentry .ge-card')).opacity, veil: getComputedStyle(document.getElementById('isx-stage'), '::after').opacity, hint: ISX.hints.on }));
    ok('the first entry into the Simulator opens on its opening: the title alone, the entry’s card and veil held back', r.on === 'sim' && r.card === 0 && +r.veil === 0 && !r.hint, r);
    await p.waitForFunction(() => !ISX.opening.on || ISX.opening.t > 4.0, null, { timeout: 30000 });
    r = await p.evaluate(() => ({ cnt: document.querySelector('.op-cnt').textContent.replace(/\s+/g, ' '), money: document.querySelectorAll('#isx-op-g path').length, clipFx: getComputedStyle(document.querySelector('#isx-stage')).clipPath + getComputedStyle(document.querySelector('#isx-rmap')).maskImage }));
    ok('the count names 37 actors and gauges, 75 relations, 17 levers; the gold line follows two of the map’s own relations', /actors and gauges·\d+ relations·\d+ levers/.test(r.cnt.replace(/ ?· ?/g, '·')) && r.money === 2 && r.clipFx === 'nonenone', r);
    r = await props(p); ok('only opacity, transform and stroke-dashoffset are animated', !r.length, r);
    await p.waitForFunction(() => !ISX.opening.on, null, { timeout: 30000 }); const took2 = (Date.now() - t1) / 1000; await p.waitForTimeout(400);
    r = await p.evaluate(() => ({ left: document.querySelectorAll('.op-clip, .op-cnt, .op-skip, #isx-op-g').length, ops: document.getElementById('isx-cock').classList.contains('op-s'), card: +getComputedStyle(document.querySelector('#isx-gentry .ge-card')).opacity, veil: +getComputedStyle(document.getElementById('isx-stage'), '::after').opacity, head: getComputedStyle(document.querySelector('#isx-gentry .ge-head')).translate, seen: localStorage.getItem('isx-open-sim'), cnt: document.querySelectorAll('#isx-rmap .fn').length + '/' + document.querySelectorAll('#isx-rmap .fe').length }));
    ok('it runs about 6.5 s and ends on the entry as it always is', took2 > 5.8 && took2 < 8.5 && r.left === 0 && !r.ops && r.card === 1 && r.veil === 1 && (r.head === 'none' || r.head === '0px') && r.seen === '1', [took2, r]);
    await done(p);
    /* when they do not play */
    p = await page('', { ls: { ...QUIET, 'isx-first': 'on' }, wait: 600 }); await p.keyboard.press('Escape'); const ts = Date.now(); await p.waitForFunction(() => !ISX.opening.on, null, { timeout: 5000 }).catch(() => {});
    ok('any key skips: the rest resolves in about a quarter of a second', Date.now() - ts < 900 && !(await p.evaluate(() => ISX.opening.on)), Date.now() - ts);
    await p.goto('about:blank'); await p.goto(base, { waitUntil: 'load' }); await p.waitForFunction(() => window.ISX && ISX.booted);
    r = await p.evaluate(() => ({ on: ISX.opening.on, opc: document.getElementById('isx-root').classList.contains('op-c') })); ok('a second visit: it does not play again', !r.on && !r.opc, r);
    await p.goto('about:blank'); await p.goto(base + '#replay', { waitUntil: 'load' }); await p.waitForFunction(() => window.ISX && ISX.booted);
    r = await p.evaluate(() => ({ on: ISX.opening.on, hash: location.hash, deep: ISX.deep })); ok('“#replay” plays it again and leaves no link state behind', r.on === 'circuit' && !r.deep, r);
    await done(p);
    p = await page('#circuit', { ls: { 'isx-tour': 'off', 'isx-insights': 'off' }, wait: 300 }); r = await p.evaluate(() => ({ on: ISX.opening.on, opc: document.getElementById('isx-root').classList.contains('op-c') })); ok('a link into the map (#circuit): no opening', !r.on && !r.opc, r);
    await p.evaluate(() => document.getElementById('isx-v-fin').click()); r = await p.evaluate(() => ISX.opening.on); ok('…but the first click on the Simulator’s tab still plays its opening', r === 'sim', r);
    await done(p);
    p = await page('#simulator', { ls: { 'isx-simtour': 'off' }, wait: 300 }); ok('a link straight to the Simulator: no opening', !(await p.evaluate(() => ISX.opening.on)));
    await done(p);
    p = await page('', { ls: { ...QUIET, 'isx-way': 'guide' }, wait: 300 }); await p.evaluate(() => document.getElementById('isx-v-fin').click()); ok('a visitor who has chosen a level before: the Simulator’s does not play', !(await p.evaluate(() => ISX.opening.on)));
    await done(p);
    p = await page('', { rm: true, ls: { 'isx-tour': 'off', 'isx-insights': 'off' }, wait: 300 });
    r = await p.evaluate(() => ({ on: ISX.opening.on, opc: document.getElementById('isx-root').classList.contains('op-c') })); await p.evaluate(() => document.getElementById('isx-v-fin').click());
    ok('reduced motion: neither plays; the page is simply there', !r.on && !r.opc && !(await p.evaluate(() => ISX.opening.on)), r);
    await done(p);
    p = await page('', { ls: { 'isx-tips-sim': 'off', 'isx-tour': 'off', 'isx-insights': 'off' }, wait: 300 });
    r = await p.evaluate(() => ({ on: ISX.opening.on, opc: document.getElementById('isx-root').classList.contains('op-c') })); await p.evaluate(() => document.getElementById('isx-v-fin').click());
    ok('the check scripts’ switch (isx-tips-sim off) keeps both away', !r.on && !r.opc && !(await p.evaluate(() => ISX.opening.on)), r);
    await done(p);
    p = await page('', { w: 390, h: 844, touch: true, ls: { 'isx-tour': 'off', 'isx-simtour': 'off', 'isx-insights': 'off' }, wait: 1200 });
    r = await p.evaluate(() => { const t = document.querySelector('.op-ttl .op-l1').getBoundingClientRect(); return { on: ISX.opening.on, inView: t.left >= 0 && t.right <= innerWidth, page: document.documentElement.scrollWidth - innerWidth }; });
    ok('phone: the Circuit’s opening plays, its title inside the screen, no sideways scroll', r.on === 'circuit' && r.inView && r.page <= 0, r);
    await p.evaluate(() => { ISX.opening.end(); document.getElementById('isx-v-fin').click(); }); const tp = Date.now(); await p.waitForFunction(() => !ISX.opening.on, null, { timeout: 15000 });
    ok('phone: the Simulator’s is the title and the entry only, under 3 s', Date.now() - tp < 3400, Date.now() - tp);
    await done(p);
  }
  if (errors.length) { fail++; console.log('  FAIL page errors :: ' + JSON.stringify(errors).slice(0, 600)); }
  console.log(`\n${pass} pass, ${fail} fail`);
  await b.close(); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
