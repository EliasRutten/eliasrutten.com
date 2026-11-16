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
    const exp = [[1920, 1080, 'full'], [1440, 900, 'full'], [1280, 760, 'compact'], [1280, 800, 'compact'], [1024, 768, 'compact'], [768, 1024, 'bands'], [390, 844, 'bands']];
    for (const [w, h, m] of exp) {
      const p = await page('#arm', { w, h, touch: w <= 768 });
      const r = await p.evaluate(() => {
        const lay = ISX.armLay; let min = 99, at = '';
        if (lay !== 'bands') document.querySelectorAll('#isx-arm text').forEach(t => { if (!t.getClientRects().length || !t.textContent.trim()) return; const m = t.getScreenCTM(), fs = parseFloat(getComputedStyle(t).fontSize) * Math.hypot(m.a, m.b); if (fs < min) { min = fs; at = t.textContent; } });
        else document.querySelectorAll('#isx-abands .ach .cn, #isx-abands .ach .cc').forEach(t => { const fs = parseFloat(getComputedStyle(t).fontSize); if (fs < min) { min = fs; at = t.textContent; } });
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
    const sw = async dx => { await q.evaluate(d => { const el = document.getElementById('isx-abands'), r = el.getBoundingClientRect(), x = r.left + 200, y = r.top + 120, t = (cx) => new Touch({ identifier: 1, target: el, clientX: cx, clientY: y }); el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [t(x)], changedTouches: [t(x)] })); el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [t(x + d)] })); }, dx); await sleep(300); return q.evaluate(() => ISX.armRel); };
    const s1 = await sw(-120), s2 = await sw(-120), s3 = await sw(120);
    ok('5 · at 390 a swipe left is Next and a swipe right is Back', s1 === ORD[1] && s2 === ORD[2] && s3 === ORD[1], [s1, s2, s3]);
    await done(q);
  }

  /* ---------- 6. phone bands ---------- */
  if (want(6)) {
    const p = await page('#arm', { w: 390, h: 844, touch: true });
    const E = await p.evaluate(() => ISX.armEdges()), lay = id => /^(WH|FED|TREA|JUST|IC|PENT|DHS|STATE|COMM)$/.test(id) ? 'state' : /^(INV|SAVE|BANK|MERCH|ADV|USER|BIZ|MIL|TEL|FAB)$/.test(id) ? 'econ' : 'arm';
    const btw = (a, c) => E.filter(e => (lay(e.fb) === a && lay(e.tb) === c) || (lay(e.fb) === c && lay(e.tb) === a)).length;
    const want6 = { sa: btw('state', 'arm'), ae: btw('arm', 'econ'), se: btw('state', 'econ'), aa: btw('arm', 'arm') };
    const r = await p.evaluate(() => {
      const ch = [...document.querySelectorAll('#isx-abands .ach')], g = [...document.querySelectorAll('#isx-abands .agut .gl')].map(e => e.textContent);
      return { n: ch.length, minH: Math.min(...ch.map(e => e.getBoundingClientRect().height)), g, inside: document.querySelectorAll('#isx-abands .abh .bn')[1].textContent };
    });
    ok('6 · 33 chips, each at least 44 px tall', r.n === 33 && r.minH >= 44, r);
    ok(`6 · gutters say the computed crossings (${want6.sa}, ${want6.ae}, ${want6.se}; ${want6.aa} inside)`, r.g[0].startsWith(want6.sa + ' ') && r.g[1].startsWith(want6.ae + ' ') && r.g[1].includes(want6.se + ' state') && r.inside.includes(want6.aa + ' inside'), { r, want6 });
    ok('6 · on the base data: 48, 41, 6 and 40', want6.sa === 48 && want6.ae === 41 && want6.se === 6 && want6.aa === 40, want6);
    const open = () => p.evaluate(() => { const s = document.getElementById('isx-asheet'); return !s.hidden && s.classList.contains('on'); });
    await p.tap('#isx-abands [data-anode="CLOUD"]'); await sleep(450);
    ok('6 · a tap opens the dossier sheet', await open() && (await p.evaluate(() => document.getElementById('isx-ash-t').textContent)) === 'Hyperscale cloud');
    await p.tap('#isx-asheet .b4x'); await sleep(450);
    ok('6 · × closes it', !(await open()));
    await p.tap('#isx-abands [data-anode="CLOUD"]'); await sleep(450);
    ok('6 · a second tap on the selected tile clears and closes', !(await open()) && !(await p.evaluate(() => ISX.armSel)));
    await p.tap('#isx-abands [data-anode="PENT"]'); await sleep(450); await p.keyboard.press('Escape'); await sleep(450);
    ok('6 · Esc closes it', !(await open()));
    await done(p);
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
      ok(`7 · ${hash}: step-card titles 24 px`, r.titles.every(([, s]) => Math.abs(s - 24) < .2), r.titles);
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
        const skip = '.er-home, .rt-ctl *, .seg button, .strip3 *, .mswitch button, .tw-door, svg *, .rt-ms *, .rt-chain *, .rt-sl, .rt > *, .rt .dock6 *, .b3chip, .res, .sc3lnk, .shpop *, .pchip, .lv, .sn-why button, .pips *, .pdots *';
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
    ok('11 · at 390 the strip shows four tabs, none clipped', r.n === 4 && !r.clipped.length, r);
    await done(p);
  }

  await b.close();
  console.log(fails ? `\n${fails} check(s) failed` : '\nAll B4 checks pass');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
