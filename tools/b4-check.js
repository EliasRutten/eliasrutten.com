/* B4 checks: the Arm on phones and tablets, one look across tabs, the three required elements.
   Usage: node tools/b4-check.js [baseUrl] [--only=<n,n>]   — needs `python3 -m http.server 8731` at the repo root.
   Exits 1 on a failed check. Sections 1 to 11 follow claude/handoffs/B4.md §4. Every count is computed here from the
   page's own edges (ISX.armEdges), never typed. */
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const base = args.find(a => /^https?:/.test(a)) || 'http://127.0.0.1:8731/imperial-stack/';
const only = (args.find(a => /^--only=/.test(a)) || '').replace('--only=', '').split(',').filter(Boolean).map(Number);
const want = n => !only.length || only.includes(n);
let fails = 0;
const ok = (name, cond, extra) => { if (!cond) fails++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra !== undefined && !cond ? '  → ' + JSON.stringify(extra).slice(0, 900) : '')); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.launch();
  const page = async (hash, o = {}) => {
    const c = await b.newContext({ viewport: { width: o.w || 1440, height: o.h || 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce', hasTouch: !!o.touch, isMobile: !!o.touch });
    await c.addInitScript(way => { try { ['isx-tips-globe', 'isx-tips-sim', 'isx-first', 'isx-insights', 'isx-tour', 'isx-simtour'].forEach(k => localStorage.setItem(k, 'off')); localStorage.setItem('isx-intro-off', '1'); if (way) localStorage.setItem('isx-way', way); if (way === 'map') localStorage.setItem('isx-sim-mode', 'full'); } catch (e) {} }, o.way || null);
    const p = await c.newPage(); p._errs = []; p.on('pageerror', e => p._errs.push(String(e).slice(0, 200)));
    await p.goto(base + hash, { waitUntil: 'load' });
    await p.waitForFunction(() => window.ISX && ISX.booted && !document.getElementById('isx-root').classList.contains('booting'), null, { timeout: 60000 });
    await sleep(900);
    if (o.prep) { await p.evaluate(o.prep); await sleep(700); }
    p._c = c; return p;
  };
  const done = async p => { await p._c.close(); };
  /* the boxes tied to a node, from the edges (the spec's linked()) */
  const linkedOf = (E, id, rel) => { const s = new Set(); E.forEach(e => { if (rel !== 'all' && e.type !== rel) return; if (e.fb === id) s.add(e.tb); if (e.tb === id) s.add(e.fb); }); s.delete(id); return s; };

  /* ---------- 1. the layout rule ---------- */
  if (want(1)) {
    const exp = [[1920, 1080, 'full'], [1440, 900, 'full'], [1280, 760, 'compact'], [1280, 800, 'compact'], [1024, 768, 'compact'], [768, 1024, 'reach'], [390, 844, 'reach']];
    for (const [w, h, m] of exp) {
      const p = await page('#arm', { w, h, touch: w <= 768 });
      const r = await p.evaluate(() => {
        const lay = ISX.armLay; let min = 99, at = '';
        document.querySelectorAll(lay !== 'reach' ? '#isx-arm text' : '#isx-areach svg .rn text').forEach(t => { if (!t.getClientRects().length || !t.textContent.trim()) return; const m = t.getScreenCTM(), fs = parseFloat(getComputedStyle(t).fontSize) * Math.hypot(m.a, m.b); if (fs < min) { min = fs; at = t.textContent; } });
        return { lay, min: Math.round(min * 100) / 100, at };
      });
      ok(`1 · ${w}×${h}: the Arm is ${m}`, r.lay === m, r);
      ok(`1 · ${w}×${h}: smallest text in the Arm stage ≥ 11 px`, r.min >= 11 - 1e-6, r);
      await done(p);
    }
  }

  /* ---------- 2. no overlap in the bar; the stage fits the window ---------- */
  if (want(2)) {
    const widths = []; for (let w = 1200; w <= 1920; w += 40) widths.push(w); widths.push(1024);
    for (const [hash, way] of [['#arm', null], ['#revenue', null], ['#circuit/03', null], ['#simulator', 'guide']]) {
      const p = await page(hash, { way });
      const bad = [];
      for (const w of widths) {
        await p.setViewportSize({ width: w, height: w >= 1280 ? 800 : 768 }); await sleep(420);
        const r = await p.evaluate(() => {
          const bar = [...document.querySelectorAll('.rt-host .rt')].find(e => e.getClientRects().length && !e.classList.contains('sk-strip')); if (!bar) return { none: true };
          const R = bar.getBoundingClientRect(), parts = [...bar.children].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden');
          const dock = bar.querySelector('.dock6'); if (dock) parts.push(...[...dock.children].filter(e => e.getClientRects().length && !e.classList.contains('shpop') && !e.classList.contains('dl')));
          const bx = parts.filter(e => e !== dock).map(e => ({ n: e.className.split(' ')[0] || e.tagName, r: e.getBoundingClientRect() }));
          const ov = []; for (let i = 0; i < bx.length; i++) for (let j = i + 1; j < bx.length; j++) { const a = bx[i].r, c = bx[j].r; if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1 && !(bx[i].n === 'dock6' || bx[j].n === 'dock6')) ov.push(bx[i].n + '×' + bx[j].n); }
          const out = bx.filter(x => x.r.left < R.left - 1 || x.r.right > R.right + 1).map(x => x.n);
          const f = document.getElementById('isx-frame').getBoundingClientRect();
          return { ov, out, fit: f.bottom <= innerHeight + .5 || innerHeight < 768 };
        });
        if (r.none) continue;
        if (r.ov.length || r.out.length || !r.fit) bad.push({ w, ...r });
      }
      ok(`2 · ${hash}: from 1200 to 1920 px (step 40) and at 1024 no bar segment overlaps another or leaves the bar; the frame fits the window`, !bad.length, bad);
      await done(p);
    }
  }

  /* ---------- 3. hover is quiet ---------- */
  if (want(3)) {
    const p = await page('#arm');
    const ids = await p.evaluate(() => [...document.querySelectorAll('#isx-arm [data-a]')].slice(0, 60).filter((e, i) => i % 3 === 0).slice(0, 20).map(e => e.dataset.a));
    await p.evaluate(() => { window.__mut = 0; new MutationObserver(l => { window.__mut += l.length; }).observe(document.getElementById('isx-arm'), { attributes: true, subtree: true, attributeFilter: ['class', 'opacity', 'style', 'stroke-width'] }); });
    for (const id of ids) { const el = await p.$(`#isx-arm [data-a="${id}"]`); const bb = await el.boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + Math.min(bb.height / 2, 9), { steps: 3 }); await sleep(60); }
    const r = await p.evaluate(() => ({ mut: window.__mut, tip: !document.getElementById('isx-atip').hidden }));
    ok('3 · moving the pointer across 20 Arm nodes changes no class, style or opacity in the machine', r.mut === 0, r);
    ok('3 · and the tooltip shows', r.tip, r);
    await done(p);
  }

  /* ---------- 4. select ---------- */
  if (want(4)) {
    const p = await page('#arm');
    const E = await p.evaluate(() => ISX.armEdges());
    const lit = [...linkedOf(E, 'PLAT', 'all')].sort();
    const n = E.filter(e => e.fb === 'PLAT' || e.tb === 'PLAT').length;
    const read = () => p.evaluate(() => {
      const box = id => { const h = document.querySelector(`#isx-arm [data-a="${id}"]`); return h.classList.contains('shead') ? h.parentNode : h; };
      const ids = [...document.querySelectorAll('#isx-arm .mnode[data-a], #isx-arm .shead[data-a]')].map(e => e.dataset.a);
      return { sel: ISX.armSel, lit: ids.filter(id => box(id).classList.contains('lit')).sort(), dim: ids.filter(id => box(id).classList.contains('dim')).sort(), selc: ids.filter(id => box(id).classList.contains('sel')), all: ids, card: document.getElementById('isx-acard').innerText };
    });
    await p.click('#isx-arm .shead[data-a="PLAT"]', { position: { x: 30, y: 10 } }); await sleep(300);
    let r = await read();
    ok('4 · clicking Platforms selects it', r.sel === 'PLAT' && r.selc.join() === 'PLAT', r.selc);
    ok('4 · it lights exactly the boxes tied to it (computed from the edges)', r.lit.join() === lit.join(), { got: r.lit, want: lit });
    ok('4 · and dims all the rest', r.dim.join() === r.all.filter(id => id !== 'PLAT' && !lit.includes(id)).sort().join(), r.dim);
    ok(`4 · the card shows ${n} links (22 on the base data)`, r.card.includes('\n' + n + '\n') && n === 22, { n, card: r.card.slice(0, 160) });
    await p.keyboard.press('Escape'); await sleep(250); r = await read();
    ok('4 · Esc clears', !r.sel && !r.lit.length && !r.dim.length, r);
    await p.focus('#isx-arm .shead[data-a="PLAT"]'); await p.keyboard.press('Enter'); await sleep(250); r = await read();
    ok('4 · the same by keyboard (focus, Enter)', r.sel === 'PLAT' && r.lit.join() === lit.join(), r.lit);
    await p.keyboard.press('Escape'); await sleep(200);
    ok('4 · no page errors', !p._errs.length, p._errs);
    await done(p);
  }

  /* ---------- 5. relations ---------- */
  if (want(5)) {
    const p = await page('#arm');
    const E = await p.evaluate(() => ISX.armEdges()), ORD = await p.evaluate(() => ISX.armOrder);
    const bad = [];
    for (const k of ORD) {
      await p.click(`#isx-tabs [data-rt-t="${k}"]`); await sleep(250);
      const r = await p.evaluate(() => {
        const box = id => { const h = document.querySelector(`#isx-arm [data-a="${id}"]`); return h.classList.contains('shead') ? h.parentNode : h; };
        const ids = [...document.querySelectorAll('#isx-arm .mnode[data-a], #isx-arm .shead[data-a]')].map(e => e.dataset.a);
        const f = document.querySelector('#isx-acard .b4fig b');
        return { rel: ISX.armRel, fig: f ? +f.textContent : null, dim: ids.filter(id => box(id).classList.contains('dim')).sort(), ids };
      });
      const cnt = k === 'all' ? E.length : E.filter(e => e.type === k).length;
      const none = r.ids.filter(id => k !== 'all' && !E.some(e => e.type === k && (e.fb === id || e.tb === id))).sort();
      if (r.rel !== k || r.fig !== cnt || r.dim.join() !== none.join()) bad.push({ k, rel: r.rel, fig: r.fig, cnt, dim: r.dim, none });
    }
    ok('5 · each of the 13 marks shows its count in the card and dims exactly the boxes with no link of that kind', !bad.length && ORD.length === 13, bad);
    await p.evaluate(() => ISX.setArmRel('all')); await sleep(200);
    await p.mouse.click(5, 300);
    const seq = []; for (let i = 0; i < 3; i++) { await p.keyboard.press('ArrowRight'); await sleep(200); seq.push(await p.evaluate(() => ISX.armRel)); }
    await p.keyboard.press('ArrowLeft'); await sleep(200); seq.push(await p.evaluate(() => ISX.armRel));
    ok('5 · ← → step through the marks', seq.join() === [ORD[1], ORD[2], ORD[3], ORD[2]].join(), seq);
    await done(p);
    const q = await page('#arm', { w: 390, h: 844, touch: true });
    const sw = async dx => { await q.evaluate(d => { const el = document.getElementById('isx-areach'), r = el.getBoundingClientRect(), x = r.left + 200, y = r.top + 120, t = (cx) => new Touch({ identifier: 1, target: el, clientX: cx, clientY: y }); el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [t(x)], changedTouches: [t(x)] })); el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [t(x + d)] })); }, dx); await sleep(300); return q.evaluate(() => ISX.armRel); };
    const s1 = await sw(-120), s2 = await sw(-120), s3 = await sw(120);
    ok('5 · at 390 a swipe left is Next and a swipe right is Back', s1 === ORD[1] && s2 === ORD[2] && s3 === ORD[1], [s1, s2, s3]);
    await done(q);
  }

  /* ---------- 6. phones and tablets in portrait: Reach and Orbit (round 6, spec §2, §6) ---------- */
  if (want(6)) {
    const p = await page('#arm', { w: 390, h: 844, touch: true });
    await p.evaluate(() => localStorage.removeItem('isx-arm-view'));
    const E = await p.evaluate(() => ISX.armEdges()), lay = id => /^(WH|FED|TREA|JUST|IC|PENT|DHS|STATE|COMM)$/.test(id) ? 'state' : /^(INV|SAVE|BANK|MERCH|ADV|USER|BIZ|MIL|TEL|FAB)$/.test(id) ? 'econ' : 'arm';
    const btw = (a, c) => E.filter(e => (lay(e.fb) === a && lay(e.tb) === c) || (lay(e.fb) === c && lay(e.tb) === a)).length;
    const want6 = { sa: btw('state', 'arm'), ae: btw('arm', 'econ'), se: btw('state', 'econ'), aa: btw('arm', 'arm') };
    ok('6 · on the base data: 48, 41, 6 and 40 links between the layers', want6.sa === 48 && want6.ae === 41 && want6.se === 6 && want6.aa === 40, want6);
    /* the reach of a node, computed here from the edges: own links, then the far layer through the sectors */
    const reachOf = id => { const L = lay(id), far = L === 'state' ? 'econ' : 'state', own = E.filter(e => e.fb === id || e.tb === id), mids = new Set(), R = new Set();
      own.forEach(e => { const o = e.fb === id ? e.tb : e.fb; if (lay(o) === 'arm') mids.add(o); else if (lay(o) === far) R.add(o); });
      E.forEach(e => { if (mids.has(e.fb) && lay(e.tb) === far) R.add(e.tb); if (mids.has(e.tb) && lay(e.fb) === far) R.add(e.fb); }); R.delete(id); return { own: own.length, reach: R.size }; };
    const cm = reachOf('COMM'), us = reachOf('USER');
    ok('6 · Commerce: 8 own links and reaches 8 of 10 groups (computed from the edges)', cm.own === 8 && cm.reach === 8, cm);
    ok('6 · Users: 12 links and reached by 8 of 9 state bodies (computed from the edges)', us.own === 12 && us.reach === 8, us);
    let r = await p.evaluate(() => {
      const n = [...document.querySelectorAll('#isx-areach [data-anode]')], cls = k => n.filter(e => e.classList.contains(k)).length;
      const hit = n.map(e => { const h = e.querySelector('.hit').getBoundingClientRect(); return Math.min(h.width, h.height); });
      return { view: ISX.armView, st: cls('state'), arm: cls('arm'), ec: cls('econ'), order: n.map(e => e.classList[1]).join(','), minHit: Math.min(...hit), tg: !document.getElementById('isx-aview').hidden, lines: document.querySelectorAll('#isx-areach .rl').length };
    });
    ok('6 · Reach is the default: 9 state bodies, 14 sectors, 10 groups; tab order state → arm → economy', r.view === 'reach' && r.st === 9 && r.arm === 14 && r.ec === 10 && /^(state,){9}(arm,){14}(econ,?){10}$/.test(r.order), r);
    ok('6 · every node has a tap area of at least 30 px; the toggle shows', r.minHit >= 30 && r.tg, r);
    const fig = () => p.evaluate(() => [...document.querySelectorAll('#isx-asheet .arfig b')].map(b => b.textContent));
    const open = () => p.evaluate(() => { const s = document.getElementById('isx-asheet'); return !s.hidden && s.classList.contains('on') ? (s.classList.contains('tall') ? 'tall' : s.classList.contains('peek') ? 'peek' : 'on') : ''; });
    await p.tap('#isx-areach [data-anode="COMM"] .hit'); await sleep(500);
    ok('6 · a tap selects and the sheet peeks with the two figures (8 · 8 of 10)', (await open()) === 'peek' && (await fig()).join() === '8,8 of 10', [await open(), await fig()]);
    const hp = await p.evaluate(() => Math.round(document.getElementById('isx-asheet').getBoundingClientRect().height));
    ok('6 · the peek is 136 px', Math.abs(hp - 136) <= 2, hp);
    await p.tap('#isx-asheet [data-ash="tall"]'); await sleep(500);
    const ht = await p.evaluate(() => [Math.round(document.getElementById('isx-asheet').getBoundingClientRect().height), innerHeight, document.querySelectorAll('#isx-asheet .lk').length, !!document.querySelector('#isx-asheet .aelse')]);
    ok('6 · “Every link” opens it to 64%, with every link and “Elsewhere on the map”', (await open()) === 'tall' && Math.abs(ht[0] - .64 * ht[1]) <= 3 && ht[2] === 8 && ht[3], ht);
    await p.tap('#isx-aview [data-aview="orbit"]'); await sleep(600);
    r = await p.evaluate(() => ({ view: ISX.armView, st: localStorage.getItem('isx-arm-view'), sel: ISX.armSel, osel: !!document.querySelector('#isx-areach svg.orbit [data-anode="COMM"].sel'), hash: location.hash, sheet: document.getElementById('isx-asheet').classList.contains('on'), labs: [...document.querySelectorAll('#isx-areach .olab')].map(t => t.textContent) }));
    ok('6 · the toggle switches to Orbit, stores it and keeps the selection and the sheet', r.view === 'orbit' && r.st === 'orbit' && r.sel === 'COMM' && r.osel && r.sheet && /\/v=orbit$/.test(r.hash), r);
    ok('6 · Orbit names the selection and what it is tied to (at most 14)', r.labs.includes('Commerce') && r.labs.length >= 5 && r.labs.length <= 14, r.labs);
    const ov = await p.evaluate(() => { const b = [...document.querySelectorAll('#isx-areach .olab, #isx-areach svg.orbit .rn.econ text')].map(t => t.getBoundingClientRect()); let n = 0; for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) { const a = b[i], c = b[j]; if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) n++; } return n; });
    ok('6 · no two names overlap in Orbit', ov === 0, ov);
    await p.tap('#isx-asheet .b4x'); await sleep(500);
    ok('6 · × closes the sheet and clears the selection', !(await open()) && !(await p.evaluate(() => ISX.armSel)));
    await p.tap('#isx-areach [data-anode="USER"] .hit'); await sleep(500);
    ok('6 · Users in Orbit: 12 links, reached by 8 of 9', (await fig()).join() === '12,8 of 9', await fig());
    await p.tap('#isx-areach [data-anode="USER"] .hit'); await sleep(500);
    ok('6 · a second tap clears and closes', !(await open()) && !(await p.evaluate(() => ISX.armSel)));
    await p.tap('#isx-areach [data-anode="PENT"] .hit'); await sleep(450); await p.keyboard.press('Escape'); await sleep(450);
    ok('6 · Esc closes it', !(await open()));
    await p.evaluate(() => ISX.setArmView('reach')); await sleep(300);
    /* the switchboard */
    await p.evaluate(() => ISX.setArmRel('control')); await sleep(500);
    const ctl = E.filter(e => e.type === 'control').length, B = await p.evaluate(() => ISX.armBoard()), pl = await p.evaluate(() => ISX.armPlayed());
    r = await p.evaluate(() => ({ tiles: document.querySelectorAll('#isx-areach .aboard .asw').length, doors: document.querySelectorAll('#isx-areach .aboard .adoor').length, pulled: document.querySelectorAll('#isx-areach .aboard .asw.on').length, head: document.querySelector('#isx-areach .abh2').textContent, tg: document.getElementById('isx-aview').hidden }));
    ok(`6 · Control on a phone: the switchboard fills the stage, ${ctl} tiles, ${B.played} doors, the toggle hidden`, r.tiles === ctl && ctl === 19 && r.doors === 13 && B.played === 13 && r.tg, r);
    ok('6 · 12 pulled, 7 ready, and the header says so', r.pulled === 12 && B.ready.length === 7 && r.head === 'Who can switch off what. 19 control links: 12 pulled against a named party, 7 ready. 13 are played in Scenarios.', r);
    const cases = new Set(pl.flatMap(x => x.cases));
    ok('6 · 31 links are played in Scenarios and every one of the 14 cases has at least one', pl.length === 31 && cases.size === 14, { n: pl.length, cases: [...cases] });
    await p.tap('#isx-areach [data-atile="COMM>FAB"]'); await sleep(300);
    r = await p.evaluate(() => { const t = document.querySelector('#isx-areach [data-atile="COMM>FAB"]'); return { ex: t.getAttribute('aria-expanded'), x: !t.parentNode.querySelector('.asw-x').hidden }; });
    ok('6 · a tile opens to its full row', r.ex === 'true' && r.x, r);
    ok('6 · no page errors', !p._errs.length, p._errs);
    await done(p);
    /* the switchboard on desktop, and a door */
    const d = await page('#arm/rel=control');
    await d.click('#isx-acard [data-acard="links"]'); await sleep(400);
    r = await d.evaluate(() => ({ tiles: document.querySelectorAll('#isx-acard .aboard .asw').length, cols: getComputedStyle(document.querySelector('#isx-acard .abgrid')).gridTemplateColumns.split(' ').length, marks: document.querySelectorAll('#isx-arm .aswm g').length }));
    ok('6 · desktop: the card\'s switchboard has 19 tiles in two columns; 13 switch marks on the machine', r.tiles === 19 && r.cols === 2 && r.marks === 13, r);
    await d.click('#isx-acard [data-scen="huawei"]'); await sleep(900);
    r = await d.evaluate(() => ({ v: ISX.view, where: ISX.whereNow().slug }));
    ok('6 · a gold door opens the case in Scenarios', r.v === 'story' && r.where === 'scenarios/huawei', r);
    await d.goBack(); await sleep(900);
    ok('6 · Back returns to the Arm as it was', await d.evaluate(() => ISX.view === 'arm' && ISX.armRel === 'control'));
    await d.evaluate(() => ISX.setArmSel('COMM')); await sleep(300);
    r = await d.evaluate(() => [...document.querySelectorAll('#isx-acard .aelse .aels small')].map(e => e.textContent));
    ok('6 · Commerce: “Elsewhere on the map” has a Circuit, a Simulator and a Scenarios row', r.join() === 'Circuit,Simulator,Scenarios', r);
    ok('6 · no page errors on desktop', !d._errs.length, d._errs);
    await done(d);
  }

  /* ---------- 7. the type scale ---------- */
  if (want(7)) {
    const states = [['#circuit/03', null], ['#arm', null], ['#revenue', null], ['#simulator', 'guide', "sessionStorage.setItem('isx-sim-pos','{\"l\":0,\"b\":5}')"], ['#scenarios', null]];
    for (const [hash, way, pre] of states) {
      const p = await page(hash, { way });
      if (pre) { await p.evaluate(pre); await p.reload(); await p.waitForFunction(() => window.ISX && ISX.booted); await sleep(1200); }
      const r = await p.evaluate(() => {
        const vis = e => { const r = e.getBoundingClientRect(); if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight) return false; for (let x = e; x && x !== document.body; x = x.parentElement) { const s = getComputedStyle(x); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < .05) return false; } return true; };
        const small = [];
        document.querySelectorAll('#isx-frame *').forEach(e => {
          if (e instanceof SVGElement && e.closest('#isx-rmap, .b3sc, .b3map, svg[aria-hidden="true"]')) return;   /* the Simulator's and Scenarios' maps: labels drawn to the map's own scale */
          const t = [...e.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).length; if (!t || !vis(e)) return;
          let fs = parseFloat(getComputedStyle(e).fontSize); if (e instanceof SVGElement) { const m = e.getScreenCTM(); if (m) fs *= Math.hypot(m.a, m.b); }
          const route = !!e.closest('.rt-ms, .rt-sl, .rt-pl, .rt-chain, .b3gl'), soon = !!e.closest('.soon, .wip') && /soon/i.test(e.textContent);
          if (fs < 10.45 && !soon && !(route && fs >= 9.95)) small.push(e.tagName + '.' + [...e.classList].join('.') + ' ' + fs.toFixed(1) + ' “' + e.textContent.trim().slice(0, 24) + '”');
        });
        const titles = [...document.querySelectorAll('.b4t, .cmd6 .tournarr h3, .s2 .s2body h3')].filter(vis).map(e => [e.className || e.tagName, parseFloat(getComputedStyle(e).fontSize)]);
        const kick = [...document.querySelectorAll('.b4k, .b4kick, .cmd6 .tournarr .tk')].filter(vis).map(e => { const c = getComputedStyle(e); return [parseFloat(c.fontSize), Math.round(parseFloat(c.letterSpacing) / parseFloat(c.fontSize) * 100) / 100]; });
        return { small: [...new Set(small)], titles, kick };
      });
      ok(`7 · ${hash}: no visible text under 10.5 px (the “soon” badge and route labels at 10 px excepted)`, !r.small.length, r.small);
      ok(`7 · ${hash}: step-card titles 24 px (clarity build: a guide step is headed by its question, in sentence case at 19.5 px)`, r.titles.every(([c, s]) => /cl-q/.test(c) ? Math.abs(s - 19.5) < .2 : Math.abs(s - 24) < .2), r.titles);
      ok(`7 · ${hash}: kickers 10.5 px at .14em`, r.kick.every(([s, l]) => Math.abs(s - 10.5) < .1 && Math.abs(l - .14) < .015), r.kick);
      await done(p);
    }
  }

  /* ---------- 8. heights ---------- */
  if (want(8)) {
    const states = [['#circuit/03', null], ['#arm', null], ['#revenue', null], ['#simulator', 'guide'], ['#simulator', 'map'], ['#scenarios', null]];
    for (const [hash, way] of states) {
      const p = await page(hash, { way });
      const r = await p.evaluate(() => {
        const vis = e => { const r = e.getBoundingClientRect(); if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight) return false; for (let x = e; x && x !== document.body; x = x.parentElement) { const s = getComputedStyle(x); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < .05) return false; } return true; };
        /* exceptions (the handoff's and this round's): strip tabs (38), the Simulator's opening door cards, map nodes, the route's
           marks and step names, the bar's own segments (the bar is checked at 56), Scenarios' rail thumbnails, the key-figure
           tiles, inline text links, tray chips of the Simulator's full map */
        const skip = '.er-home, .rt-ctl *, .seg button, .strip3 *, .mswitch button, .tw-door, .ge-way, svg *, .rt-ms *, .rt-chain *, .rt-sl, .rt > *, .rt .dock6 *, .b3chip, .res, .sc3lnk, .shpop *, .pchip, .lv, .sn-why button, .pips *, .pdots *';
        const bad = [];
        document.querySelectorAll('#isx-frame button, #isx-frame summary, #isx-frame a[href]').forEach(e => {
          if (!vis(e) || e.matches(skip) || e.closest('svg') || getComputedStyle(e).display === 'inline') return;
          const h = e.getBoundingClientRect().height; if (![24, 36, 44, 56].some(v => Math.abs(v - h) <= 1)) bad.push((e.id ? '#' + e.id : e.tagName + '.' + [...e.classList].join('.')) + ' ' + h.toFixed(1));
        });
        const bars = [...document.querySelectorAll('.rt-host .rt:not(.sk-strip)')].filter(vis).map(e => e.getBoundingClientRect().height);
        return { bad: [...new Set(bad)], bars };
      });
      ok(`8 · ${hash}${way ? ' (' + way + ')' : ''}: every button, link-button and summary is 24, 36, 44 or 56 px tall`, !r.bad.length, r.bad);
      ok(`8 · ${hash}${way ? ' (' + way + ')' : ''}: the bar is 56 px`, r.bars.every(h => Math.abs(h - 56) <= 1), r.bars);
      await done(p);
    }
  }

  /* ---------- 9. “The mechanism” ---------- */
  if (want(9)) {
    const found = [];
    for (const [hash, way] of [['#circuit/03', null], ['#arm', null], ['#simulator', 'guide'], ['#scenarios', null]]) {
      const p = await page(hash, { way });
      const t = await p.evaluate(() => document.body.innerText + ' ' + [...document.querySelectorAll('*')].flatMap(e => [...e.attributes].map(a => a.value)).join(' ') + ' ' + [...document.scripts].map(s => s.src ? '' : s.textContent).join(' '));
      if (/Go deeper|Read more/.test(t)) found.push(hash);
      await done(p);
    }
    ok('9 · the strings “Go deeper” and “Read more” appear nowhere in the page', !found.length, found);
    const p = await page('#arm', { prep: "ISX.setArmRel('control')" });
    await p.click('#isx-acard details.b4mech > summary'); await sleep(200);
    const k = await p.evaluate(() => sessionStorage.getItem('isx-mech'));
    await p.evaluate(() => { location.hash = '#circuit/03'; }); await sleep(1500);
    const c = await p.evaluate(() => document.getElementById('isx-t-mech').open);
    await p.click('#isx-t-mech > summary'); await sleep(200);
    const k2 = await p.evaluate(() => sessionStorage.getItem('isx-mech'));
    ok('9 · one key, isx-mech: opened in the Arm, it opens in the Circuit; shut there, it is shut for all', k === 'open' && c === true && k2 === 'shut', { k, c, k2 });
    await done(p);
  }

  /* ---------- 10. the three elements ---------- */
  if (want(10)) {
    const views = [['#circuit/03', null, 'circuit/03'], ['#arm', null, 'arm'], ['#revenue', null, 'revenue'], ['#simulator', 'guide', 'simulator/guide'], ['#simulator', 'map', 'simulator/full'], ['#capital-stack', 'guide', 'simulator'], ['#scenarios', null, 'scenarios/']];
    for (const [w, h] of [[1440, 900], [1024, 768], [390, 844]]) {
      const bad = [];
      for (const [hash, way, slug] of views) {
        const p = await page(hash, { w, h, way, touch: w < 761 });
        const r = await p.evaluate(() => {
          const vis = e => !!e && !!e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && (() => { for (let x = e; x && x !== document.body; x = x.parentElement) if (getComputedStyle(x).display === 'none') return false; return true; })();
          const ph = innerWidth <= 760, es = ph ? document.getElementById('isx-b4es') : document.getElementById('isx-dk-es');
          const titles = Object.values(ISX.essays), hit = es && titles.find(t => t[1] === es.getAttribute('href'));
          const cup = [...document.querySelectorAll(ph ? '#isx-b4row a' : '#isx-dock a, .rt .dock6 a')].find(a => a.href === 'https://www.buymeacoffee.com/ruttenelias');
          const mis = ph ? document.querySelector('#isx-b4row [data-mis]') : document.getElementById('isx-mis');
          return { es: vis(es), inEssays: !!hit, named: !!hit && ((es.getAttribute('aria-label') || '') + es.textContent).includes(hit[0]), cup: vis(cup), mis: vis(mis) };
        });
        const m = await p.evaluate(() => { const b = innerWidth <= 760 ? document.querySelector('#isx-b4row [data-mis]') : document.getElementById('isx-mis'); b.scrollIntoView({ block: 'center' }); b.click(); });
        await sleep(250);
        const q = await p.evaluate(() => { const pn = document.getElementById('isx-mpanel'), ref = document.getElementById('isx-mp-ref').textContent, link = (ref.match(/Link: (\S+)/) || [])[1] || '', slug = (ref.match(/Ref: (\S+)/) || [])[1] || ''; return { open: !pn.hidden, ref, link, slug, sub: pn.querySelector('.b4go').href }; });
        const why = [];
        if (!r.es) why.push('no essay link'); if (!r.inEssays) why.push('essay not in ESSAYS'); if (!r.named) why.push('label does not name it');
        if (!r.cup) why.push('no Buy Me a Coffee link'); if (!r.mis) why.push('no “See a mistake?”');
        if (!q.open) why.push('panel did not open'); if (!q.slug.startsWith(slug)) why.push('slug ' + q.slug); if (!q.link.startsWith('https://eliasrutten.com/imperial-stack/#') || !q.link.endsWith(q.slug)) why.push('link ' + q.link);
        if (q.sub !== 'https://substack.com/@eliasrutten') why.push('Open Substack ' + q.sub);
        if (p._errs.length) why.push('errors ' + p._errs.join(' | '));
        if (why.length) bad.push(hash + (way ? '(' + way + ')' : '') + ': ' + why.join(', '));
        await done(p);
      }
      ok(`10 · ${w}×${h}: essay, coffee and “See a mistake?” on Circuit, Arm, Revenue map, Simulator (guide and full), Capital stack and Scenarios; the panel's reference holds the slug and the site's link`, !bad.length, bad);
    }
  }

  /* ---------- 11. the phone strip ---------- */
  if (want(11)) {
    const p = await page('#arm', { w: 390, h: 844, touch: true });
    const r = await p.evaluate(() => { const s = document.querySelector('.seg'), R = s.getBoundingClientRect(); const t = [...s.querySelectorAll('button')].filter(b => b.getClientRects().length && getComputedStyle(b).display !== 'none'); return { n: t.length, clipped: t.filter(b => { const r = b.getBoundingClientRect(); return r.left < R.left - .5 || r.right > R.right + .5 || r.right > innerWidth; }).map(b => b.textContent.trim()) }; });
    ok('11 · at 390 the strip shows five tabs, none clipped (profit tab build 1 added the profit dollar)', r.n === 5 && !r.clipped.length, r);
    await done(p);
  }

  await b.close();
  console.log(fails ? `\n${fails} check(s) failed` : '\nAll B4 checks pass');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
