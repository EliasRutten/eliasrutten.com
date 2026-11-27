/* Machinery entry round (19 Nov 2026): checks on what the round changed (claude/handoffs/machinery-entry-and-thesis-19-nov.md §F).
   Usage: node tools/entry-check.js [baseUrl]. Needs `python3 -m http.server 8731` at the repo root. Exits 1 on a failed check.
   1 the machinery has one entry: after skipping or closing its entry screen, and after a level, no old entry card anywhere
   2 the levels: no minutes shown or spoken; a Time and a Difficulty bar each; three levels plus a separate “Explore on my own”
   3 Explore on my own shows no thesis panel; Expert does, with SMAIN.thesis and the chapters
   4 “How this tab works”: on the four tabs with an entry screen, at 1280×800 and 390×844; it opens the screen and keeps the place
   5 the Substack button: the thesis first, never “Essay” on its own; its panel lists the thesis and up to three related pieces
   6 the elite network: Layers · Reach · Orbit at desktop width, Reach · Orbit on phones; remembered; in the link; the selection carries
   7 the data update (workbook v1.5): bills 23.0%, mortgage 7.11%, Fed bills $580.7bn */
const { chromium } = require('playwright');
const base = process.argv.slice(2).find(a => /^https?:/.test(a)) || 'http://127.0.0.1:8731/imperial-stack/';
let pass = 0, fail = 0;
const ok = (c, t, x) => { if (c) pass++; else { fail++; console.log('FAIL  ' + t + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 500) : '')); } };
(async () => {
  const b = await chromium.launch();
  const page = async (hash, o) => {
    o = o || {};
    const c = await b.newContext({ viewport: { width: o.w || 1280, height: o.h || 800 }, isMobile: !!o.m, hasTouch: !!o.m, reducedMotion: 'reduce' });
    await c.addInitScript(ls => { try { if (sessionStorage.getItem('__ec')) return; sessionStorage.setItem('__ec', '1'); localStorage.setItem('isx-first', 'off'); localStorage.setItem('isx-insights', 'off'); localStorage.setItem('isx-intro', 'toured'); Object.entries(ls).forEach(([k, v]) => localStorage.setItem(k, v)); } catch (e) { /* ignore */ } }, o.ls || {});
    const p = await c.newPage(); p._errs = []; p.on('pageerror', e => p._errs.push(String(e.message).slice(0, 200)));
    await p.goto(base + hash, { waitUntil: 'load' }); await p.waitForFunction(() => window.ISX && ISX.booted, null, { timeout: 90000 }); await p.waitForTimeout(o.wait || 900);
    return p;
  };
  const done = async p => { ok(!p._errs.length, 'no page errors', p._errs); await p.context().close(); };
  const noCard = p => p.evaluate(() => !document.querySelector('#isx-gentry, .ge-way, .ge-card, #isx-cock.s4open'));

  /* ---------- 1 ---------- */
  for (const [w, h, m] of [[1280, 800], [390, 844, true]]) {
    let p = await page('#simulator', { w, h, m });
    ok(await p.evaluate(() => ISX.enter.on === 'fin'), `${w}: the machinery opens on its entry screen at its door`);
    await p.keyboard.press('Escape'); await p.waitForTimeout(500);
    ok(await noCard(p) && await p.evaluate(() => ISX.sim.mode === 'story' && ISX.sim.beat === 0), `${w}: skipped with Esc: the guide’s first step, no old entry card anywhere`);
    await p.evaluate(() => ISX.enter.open('fin', true)); await p.waitForTimeout(300); await p.evaluate(() => document.querySelector('#isx-enter [data-en="skip"]').click()); await p.waitForTimeout(500);
    ok(await noCard(p), `${w}: closed with Skip: no old entry card`);
    await p.reload(); await p.waitForFunction(() => window.ISX && ISX.booted); await p.waitForTimeout(800);
    ok(await p.evaluate(() => !ISX.enter.on) && await noCard(p), `${w}: already seen: no screen and no old card`);
    for (const k of ['ground', 'guide', 'map']) { await p.evaluate(k => ISX.simWay(k), k); await p.waitForTimeout(300); ok(await noCard(p), `${w}: after ${k}: no old entry card`); }
    await p.evaluate(() => { ISX.simWay('guide'); sessionStorage.setItem('isx-sim-pos', '{"l":0,"b":0}'); }); await p.reload(); await p.waitForFunction(() => window.ISX && ISX.booted && ISX.sim); await p.waitForTimeout(700);
    await p.evaluate(() => ISX.route && document.querySelector('#isx-s2bar .rt-bk') && document.querySelector('#isx-s2bar .rt-bk').click()); await p.waitForTimeout(400);
    ok(await p.evaluate(() => ISX.sim.lines[ISX.sim.line].pre && ISX.sim.beat === ISX.sim.lines[ISX.sim.line].steps.length) && await noCard(p), `${w}: Back from the guide’s first step lands on the close of first principles, not on an entry card`);
    await done(p);
  }

  /* ---------- 2, 3 ---------- */
  {
    const p = await page('#simulator');
    await p.evaluate(() => document.querySelector('#isx-enter [data-en="levels"]').click()); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const d = [...document.querySelectorAll('#isx-enter .en-lv')]; return { n: d.length, txt: d.map(x => x.textContent), aria: d.map(x => x.getAttribute('aria-label') || ''), bars: d.map(x => !!x.querySelector('.en-tb i') && x.querySelectorAll('.en-db i').length === 3), acts: [...document.querySelectorAll('#isx-enter .en-acts .en-btn')].map(x => x.textContent) }; });
    ok(r.n === 3 && r.txt.concat(r.aria).every(t => !/minutes?\b|\d+\s*min/i.test(t)), 'no “minutes” and no digits-plus-“min” in the level choices or their names', r.txt);
    ok(r.bars.every(Boolean), 'each level has a Time bar and a three-step Difficulty bar', r.bars);
    /* thesis view (23 Nov 2026): “Just the thesis” is a fourth button, between the levels and the free map (tools/thesis-check.js covers it) */
    ok(r.acts.length === 4 && /Learn step by step/.test(r.acts[0]) && /three levels/.test(r.acts[0]) && /Just the thesis/.test(r.acts[1]) && /Explore on my own/.test(r.acts[2]) && /no guide, no thesis/.test(r.acts[2]), 'three levels of the guide, “Just the thesis”, and a separate “Explore on my own”, told apart in their one-line descriptions', r.acts);
    await p.evaluate(() => document.querySelector('#isx-enter [data-en="free"]').click()); await p.waitForTimeout(900);
    ok(await p.evaluate(() => ISX.sim.mode === 'full' && !ISX.simThesis && document.getElementById('isx-thx').hidden), 'Explore on my own: the full map with no thesis panel');
    await p.evaluate(() => { ISX.enter.open('fin', true, 'levels'); }); await p.waitForTimeout(300); await p.evaluate(() => document.querySelector('#isx-enter [data-en-way="map"]').click()); await p.waitForTimeout(900);
    const t = await p.evaluate(() => { const x = document.getElementById('isx-thx'); return { on: ISX.simThesis, mode: ISX.sim.mode, txt: x.querySelector('.thx-t').textContent, ch: [...x.querySelectorAll('.thx-ch span')].map(s => s.textContent), go: x.querySelectorAll('[data-gs]').length }; });
    ok(t.on && t.mode === 'full' && /That is the thesis of the author, Elias Rutten\./.test(t.txt) && t.ch.length === 7 && t.go === 7, 'Expert: the full map with the thesis panel: SMAIN.thesis, seven chapters, each with its step', t);
    await p.evaluate(() => document.querySelector('#isx-thx [data-gs]').click()); await p.waitForTimeout(600);
    ok(await p.evaluate(() => ISX.sim.mode === 'story' && ISX.sim.line === 0 && ISX.sim.beat === 0 && ISX.sim.ret === 'full'), 'a chapter’s step opens the guide there, with the way back to the full map');
    await done(p);
  }

  /* ---------- 4 ---------- */
  for (const [w, h, m] of [[1280, 800], [390, 844, true]]) {
    for (const [hash, tab] of [['#circuit', null], ['#profit', 'profit'], ['#elite-network', 'arm'], ['#simulator', 'fin'], ['#imperial-arm', 'story']]) {
      const p = await page(hash, { w, h, m, ls: { 'isx-enter': 'off' } });
      const r = await p.evaluate(() => { document.getElementById('isx-helpb').click(); const b = document.getElementById('isx-tabx'), a = document.getElementById('isx-about'); const v = e => !!e && !e.hidden && e.getClientRects().length > 0 && e.getBoundingClientRect().right <= innerWidth + 1; return { tabx: v(b), about: v(a), name: b && b.getAttribute('aria-label') }; });
      if (!tab) { ok(!r.tabx && r.about, `${w}: the Circuit keeps “About this map” and has no tab explainer`, r); await done(p); continue; }
      ok(r.tabx && !r.about && /^How (this tab|it) works$/.test(r.name), `${w} ${hash}: “How this tab works” is in the header, inside the window`, r);
      const before = await p.evaluate(() => JSON.stringify([ISX.view, ISX.sim && ISX.sim.beat, ISX.sim && ISX.sim.mode, ISX.armRel, location.hash]));
      await p.evaluate(() => document.getElementById('isx-tabx').click()); await p.waitForTimeout(500);
      ok(await p.evaluate(t => ISX.enter.on === t, tab), `${w} ${hash}: it opens the tab’s entry screen`);
      await p.keyboard.press('Escape'); await p.waitForTimeout(500);
      ok(await p.evaluate(() => JSON.stringify([ISX.view, ISX.sim && ISX.sim.beat, ISX.sim && ISX.sim.mode, ISX.armRel, location.hash])) === before, `${w} ${hash}: reopening it never resets the place in the tab`);
      await done(p);
    }
  }

  /* ---------- 5 ---------- */
  for (const [w, h, m, id] of [[1440, 900, false, 'isx-dk-es'], [390, 844, true, 'isx-b4es']]) {
    for (const hash of ['#circuit', '#simulator', '#elite-network', '#profit', '#imperial-arm']) {
      const p = await page(hash, { w, h, m, ls: { 'isx-enter': 'off' } });
      const r = await p.evaluate(id => { const b = document.getElementById(id); return { tag: b.tagName, txt: b.textContent.replace(/\s+/g, ' ').trim(), name: b.getAttribute('aria-label') || '' }; }, id);
      ok(/Read the preliminary thesis/.test(r.txt) && !/(^|[^\w])Essay([^\w]|$)/.test(r.txt + ' ' + r.name) && /Related piece/.test(r.txt), `${w} ${hash}: the Substack button leads with the thesis (“Read the preliminary thesis”) and never says “Essay” on its own`, r);
      await p.evaluate(id => document.getElementById(id).click(), id); await p.waitForTimeout(400);
      const pp = await p.evaluate(() => { const x = document.getElementById('isx-espop'); return { on: x.classList.contains('on'), th: (x.querySelector('.es-th') || {}).href, rel: [...x.querySelectorAll('.es-rel')].map(a => a.textContent.replace(/\s+/g, ' ').trim()), dated: [...x.querySelectorAll('.es-rel small')].every(s => /\b20\d\d\b/.test(s.textContent)) }; });
      ok(pp.on && /substack\.com\/subscribe$/.test(pp.th || '') && pp.rel.length >= 2 && pp.rel.length <= 3 && pp.dated, `${w} ${hash}: its panel: the thesis (subscribe), then two or three dated related pieces`, pp);
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      ok(await p.evaluate(() => !document.getElementById('isx-espop').classList.contains('on')), `${w} ${hash}: Esc closes the panel`);
      await done(p);
    }
  }
  {
    const p = await page('#simulator', { ls: { 'isx-enter': 'off', 'isx-way': 'guide', 'isx-sim-mode': 'story' } });
    const pre = await p.evaluate(() => ISX.sim.lines.findIndex(l => l.pre));
    const r = await p.evaluate(async pl => { const out = {}; for (const [l, b] of [[pl, 1], [0, 2], [0, 10]]) { document.querySelector(`#isx-s2bar [data-rt-t="${l}:${b}"]`) && document.querySelector(`#isx-s2bar [data-rt-t="${l}:${b}"]`).click(); await new Promise(r => setTimeout(r, 300)); out[l + ':' + b] = document.getElementById('isx-dk-es').dataset.k; } return out; }, pre);
    ok(Object.values(r).every(k => !!k), 'the related piece still follows the place (essayKey kept)', r);
    await done(p);
  }

  /* ---------- 6 ---------- */
  for (const [w, h, m] of [[1280, 800], [1920, 1080], [390, 844, true]]) {
    const p = await page('#elite-network', { w, h, m, ls: { 'isx-enter': 'off' } });
    const sw = () => p.evaluate(() => [...document.querySelectorAll('#isx-aview button')].filter(x => !x.hidden && x.getClientRects().length).map(x => x.textContent + (x.getAttribute('aria-pressed') === 'true' ? '*' : '')));
    let s = await sw();
    ok(m ? s.join() === 'Reach*,Orbit' : s.join() === 'Layers*,Reach,Orbit', `${w}: the switch reads ${m ? 'Reach · Orbit' : 'Layers · Reach · Orbit'}, the default pressed`, s);
    for (const v of (m ? ['orbit', 'reach'] : ['reach', 'orbit', 'machine'])) {
      await p.evaluate(v => document.querySelector(`#isx-aview [data-aview="${v}"]`).click(), v); await p.waitForTimeout(500);
      const r = await p.evaluate(() => ({ lay: ISX.armLay, v: ISX.armView, svg: (document.querySelector('#isx-areach svg.arsvg') || {}).className && document.querySelector('#isx-areach svg.arsvg').className.baseVal, hash: location.hash, side: document.documentElement.scrollWidth <= innerWidth + 1, card: (() => { const c = document.getElementById('isx-acard'), a = document.getElementById('isx-areach'); if (!c || !a) return null; const cr = c.getBoundingClientRect(), ar = a.getBoundingClientRect(); return { beside: cr.right <= ar.left + 1, below: cr.top >= ar.bottom - 1 }; })() }));
      if (v === 'machine') ok(r.lay !== 'reach' && r.v === 'machine' && !/\/v=/.test(r.hash), `${w}: Layers draws the full machine; no view in the link`, r);
      else ok(r.lay === 'reach' && r.svg && r.svg.includes(v) && r.side && (v === 'orbit' ? /\/v=orbit/.test(r.hash) : m ? !/\/v=/.test(r.hash) : /\/v=reach/.test(r.hash)) && (m || r.card.beside), `${w}: ${v} is drawn${m ? '' : ', the card beside it'}; the link holds it`, r);
    }
    if (!m) {
      await p.evaluate(() => { document.querySelector('#isx-aview [data-aview="reach"]').click(); }); await p.waitForTimeout(300);
      await p.evaluate(() => ISX.setArmSel('IC')); await p.waitForTimeout(300);
      ok(await p.evaluate(() => !document.getElementById('isx-asheet').classList.contains('on') && /Intelligence community/.test(document.getElementById('isx-acard').textContent)), `${w}: in Reach the selection lives in the card beside the drawing, not a sheet`);
      await p.evaluate(() => document.querySelector('#isx-aview [data-aview="orbit"]').click()); await p.waitForTimeout(300);
      ok(await p.evaluate(() => ISX.armSel === 'IC'), `${w}: the selection carries across views`);
      await p.evaluate(() => document.querySelector('#isx-aview [data-aview="machine"]').click()); await p.waitForTimeout(300);
      ok(await p.evaluate(() => ISX.armSel === 'IC' && ISX.armLay !== 'reach'), `${w}: and back onto the machine`);
      await p.evaluate(() => ISX.setArmSel(null));
    }
    await p.evaluate(() => document.querySelector('#isx-aview [data-aview="orbit"]').click()); await p.reload(); await p.waitForFunction(() => window.ISX && ISX.booted); await p.waitForTimeout(800);
    ok(await p.evaluate(() => ISX.armView === 'orbit' && ISX.armLay === 'reach'), `${w}: the choice is remembered (isx-arm-view)`);
    await p.evaluate(() => ISX.setArmRel('control')); await p.waitForTimeout(400);
    ok(await p.evaluate(() => document.getElementById('isx-aview').hidden), `${w}: the Control relation’s switchboard keeps its own drawing; the switch steps aside`);
    await p.evaluate(() => ISX.setArmRel('all')); await p.waitForTimeout(300);
    ok(await p.evaluate(() => !document.getElementById('isx-aview').hidden && ISX.armView === 'orbit'), `${w}: after it, the switch and the choice are back`);
    await done(p);
  }
  {
    const p = await page('#elite-network/v=orbit', { w: 1280, h: 800, ls: { 'isx-enter': 'off' } });
    ok(await p.evaluate(() => ISX.armView === 'orbit' && ISX.armLay === 'reach'), 'a link with /v=orbit opens Orbit at desktop width');
    await done(p);
    const q = await page('#elite-network', { w: 1280, h: 720, ls: { 'isx-enter': 'off', 'isx-arm-view': 'machine' } });
    const r = await q.evaluate(() => ({ lay: ISX.armLay, tall: document.getElementById('isx-root').classList.contains('arm-tall'), h: document.getElementById('isx-scene-arm').offsetHeight, bar: (b => b ? b.getBoundingClientRect().bottom <= innerHeight + 1 : false)(document.querySelector('#isx-root .tabs-bottom.rt-host')) }));
    ok(r.lay === 'full' && r.tall && r.h > 720 && r.bar, '1280×720: the machine at full size, taller than the window; the page scrolls and the bar stays in view', r);
    await done(q);
  }

  /* ---------- 7 ---------- */
  {
    const p = await page('#simulator', { ls: { 'isx-enter': 'off' } });
    const t = await p.evaluate(() => document.documentElement.innerHTML);
    ok(/bills 23\.0%/.test(t) && /30-yr 7\.11%/.test(t) && /\$580\.7bn/.test(t) && !/\$571bn/.test(t) && !/30-yr 7\.24%/.test(t) && /\$39\.3bn at par/.test(t), 'the data update: bills 23.0% (31 Oct), mortgage 7.11% (12 Nov), Fed bills $580.7bn (11 Nov), buyback results', null);
    await done(p);
  }
  console.log(`entry-check: ${pass} passed, ${fail} failed`);
  await b.close(); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
