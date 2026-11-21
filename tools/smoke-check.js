/* Smoke test of a build: the quick check every round runs before it publishes the artifact (claude/START-HERE.md). It asks one thing:
   would a person who opens this build see a working page? It is not a regression check; the check for the part a round changed does that.
   Usage: node tools/smoke-check.js [address] [--allow=host,host] [--only=desktop|phone] [--shots=<dir>]
   address: the page's address. Default http://127.0.0.1:8731/imperial-stack/ (needs `python3 -m http.server 8731` at the repo root),
            or a build: file:///tmp/art.html (the single-file build from tools/artifact-build.py), or the artifact's own address.
   --allow  hosts the page may load from besides its own (the multi-file artifact loads the globe library from a CDN, for example).
   --serve  <url>=<file>: answer that address from a local file (where the CDN cannot be reached, as in the build sandbox; the file must be the
            same release the page pins by hash, so the integrity check still runs). Repeatable.
   Runs at 1440 × 900 and at 390 × 844 (touch). For each size:
     1 the page boots: ISX.booted, the globe library says window.__isxGlib === 'ok', no page error, no console error
     2 no network request leaves the page's own address (or --allow); no request fails
     3 every tab in the strip draws: one scene shows, it has size, and it holds drawn content (counted, never typed)
     4 the profit dollar's orbit has bodies (ISX.profit.state.orbit > 0)
     5 the firm web opens (#circuit/firms: ISX.firms.isOpen, firms drawn)
     6 a first visit gets an entry screen: the Circuit's welcome on the bare map, and a tab's entry screen on #profit
   Reduced motion is off on purpose: a build that only boots under reduced motion is not a working build.
   Prints PASS and FAIL lines like the other checks; exits 1 on a failure. Aim: under 5 minutes. */
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const base = args.find(a => /^(https?|file):/.test(a)) || 'http://127.0.0.1:8731/imperial-stack/';
const opt = k => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : ''; };
const allow = opt('allow').split(',').filter(Boolean);
const only = opt('only');
const serve = args.filter(x => x.startsWith('--serve=')).map(x => x.slice(8).split(/=(.+)/).slice(0, 2));
const shots = opt('shots');
const isFile = base.startsWith('file:');
const origin = isFile ? '' : new URL(base).origin;
let fails = 0;
const ok = (name, cond, extra) => { if (!cond) fails++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 700) : '')); };
const t0 = Date.now();
/* the page's own address, with its hash when the build is the artifact (a hash only; never a path) */
const url = hash => base.replace(/#.*$/, '') + hash;

(async () => {
  const b = await chromium.launch();
  const SIZES = [['desktop', 1440, 900, false], ['phone', 390, 844, true]].filter(s => !only || s[0] === only);
  for (const [label, w, h, touch] of SIZES) {
    const tag = `${label} ${w}×${h}`;
    const errs = [], outside = [], failed = [];
    /* a fresh context per page; nothing is seeded unless `quiet` says so (the first-visit tests want an empty store) */
    const open = async (hash, quiet, wait) => {
      const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: touch, isMobile: touch });
      if (quiet) await c.addInitScript(() => { try { ['isx-tips-globe', 'isx-tips-sim', 'isx-first', 'isx-insights', 'isx-tour', 'isx-simtour'].forEach(k => localStorage.setItem(k, 'off')); localStorage.setItem('isx-intro-off', '1'); } catch (e) {} });
      for (const [u, f] of serve) await c.route(u, r => r.fulfill({ path: f, contentType: 'application/javascript', headers: { 'access-control-allow-origin': '*' } }));
      const p = await c.newPage(); p._c = c;
      p.on('pageerror', e => errs.push(hash + ' · ' + String(e).slice(0, 200)));
      p.on('console', m => { if (m.type() === 'error' && !/favicon/i.test(m.text())) errs.push(hash + ' · console: ' + m.text().slice(0, 200)); });
      p.on('request', r => {
        const u = r.url();
        if (/^(data|blob|about|file):/.test(u)) return;
        let o = ''; try { o = new URL(u).origin; } catch (e) { return; }
        if (o === origin || allow.includes(new URL(u).host)) return;
        if (/favicon/i.test(u)) return;
        outside.push(u.slice(0, 120));
      });
      p.on('requestfailed', r => { const u = r.url(); if (!/^(data|blob):/.test(u) && !/favicon/i.test(u)) failed.push(u.slice(0, 120) + ' ' + (r.failure() && r.failure().errorText)); });
      await p.goto(url(hash), { waitUntil: 'load', timeout: 90000 });
      if (wait !== false) {
        await p.waitForFunction(() => window.ISX && ISX.booted && !document.getElementById('isx-root').classList.contains('booting'), null, { timeout: 60000 });
        await p.waitForTimeout(wait || 1200);
      }
      return p;
    };
    const close = p => p._c.close();

    /* 1 + 2 + 3: boot, then every tab */
    let p;
    try { p = await open('#circuit', true); } catch (e) { ok(`1 · ${tag}: the page boots`, false, String(e).slice(0, 300)); continue; }
    const boot = await p.evaluate(() => ({ booted: !!ISX.booted, glib: window.__isxGlib, view: ISX.view, root: !!document.getElementById('isx-root') }));
    ok(`1 · ${tag}: the page boots`, boot.booted && boot.root, boot);
    ok(`1 · ${tag}: the globe library loaded (window.__isxGlib is ok)`, boot.glib === 'ok', boot);
    const tabs = await p.evaluate(() => [...document.querySelectorAll('#isx-strip .seg > button')].map(x => x.id));
    ok(`3 · ${tag}: the strip has its tabs`, tabs.length >= 6, tabs);
    for (const id of tabs) {
      await p.evaluate(i => document.getElementById(i).click(), id);
      await p.waitForFunction(i => document.getElementById(i).getAttribute('aria-selected') === 'true' || document.getElementById(i).classList.contains('on') || document.getElementById(i).getAttribute('aria-current'), id, { timeout: 8000 }).catch(() => {});
      await p.waitForTimeout(1500);
      const r = await p.evaluate(() => {
        const shown = [...document.querySelectorAll('#isx-frame .scene')].filter(e => !e.hidden && e.getClientRects().length);
        const e = shown[0], rc = e && e.getBoundingClientRect();
        return { shown: shown.map(x => x.id), w: rc ? Math.round(rc.width) : 0, h: rc ? Math.round(rc.height) : 0, nodes: e ? e.querySelectorAll('*').length : 0, art: e ? e.querySelectorAll('svg, canvas').length : 0, view: ISX.view };
      });
      ok(`3 · ${tag}: ${id.replace('isx-v-', '')} draws (one scene, with size and content)`, r.shown.length === 1 && r.w >= 200 && r.h >= 200 && r.nodes >= 40 && r.art >= 1, r);
      if (shots && id) { try { await p.screenshot({ path: `${shots}/smoke-${label}-${id.replace('isx-v-', '')}.png` }); } catch (e) { /* the folder may be missing */ } }
    }
    await close(p);

    /* 4: the profit dollar's orbit */
    p = await open('#profit', true);
    const orb = await p.evaluate(() => { const st = ISX.profit.stations; const i = st.findIndex(s => s.views.includes('orb')); return { i, ready: ISX.profit.state.ready }; });
    ok(`4 · ${tag}: the profit dollar has an orbit view`, orb.i >= 0, orb);
    if (orb.i >= 0) {
      await p.evaluate(i => ISX.profit.go(i, 'orb'), orb.i);
      const got = await p.waitForFunction(() => ISX.profit.state.orbit > 0, null, { timeout: 30000 }).then(() => true).catch(() => false);
      const n = await p.evaluate(() => ISX.profit.state.orbit);
      ok(`4 · ${tag}: the orbit has bodies`, got && n > 0, { bodies: n });
    }
    await close(p);

    /* 5: the firm web */
    p = await open('#circuit/firms', true, false);
    const fw = await p.waitForFunction(() => window.ISX && ISX.firms && ISX.firms.isOpen && ISX.firms.state.firms > 0, null, { timeout: 45000 }).then(() => true).catch(() => false);
    const fr = await p.evaluate(() => ({ open: !!(ISX.firms && ISX.firms.isOpen), firms: ISX.firms ? ISX.firms.state.firms : 0, svg: !!document.querySelector('#isx-fw svg'), nodes: document.querySelectorAll('#isx-fw svg .fnode').length }));
    ok(`5 · ${tag}: the firm web opens and draws`, fw && fr.open && fr.firms > 0 && fr.svg && fr.nodes > 0, fr);
    await close(p);

    /* 6: first visits (an empty store) */
    p = await open('', false, false);
    await p.waitForFunction(() => window.ISX && ISX.booted, null, { timeout: 60000 });
    const wl = await p.evaluate(() => document.getElementById('isx-root').classList.contains('wl-stage'));
    await p.mouse.click(Math.round(w / 2), Math.round(h / 2));   /* a press during the fly-in goes straight to the welcome */
    const w1 = await p.waitForFunction(() => !!document.querySelector('#isx-wl'), null, { timeout: 30000 }).then(() => true).catch(() => false);
    ok(`6 · ${tag}: a first visit to the bare page gets the welcome`, wl && w1, { stage: wl, welcome: w1 });
    await close(p);
    p = await open('#profit', false, false);
    await p.waitForFunction(() => window.ISX && ISX.booted, null, { timeout: 60000 });
    const en = await p.waitForFunction(() => !!document.getElementById('isx-enter'), null, { timeout: 15000 }).then(() => true).catch(() => false);
    ok(`6 · ${tag}: a first visit to a tab (#profit) gets that tab's entry screen`, en);
    await close(p);

    /* 2: over every page above */
    ok(`2 · ${tag}: nothing was requested from outside the page's own address${allow.length ? ' (allowed: ' + allow.join(', ') + ')' : ''}`, !outside.length, [...new Set(outside)].slice(0, 6));
    ok(`2 · ${tag}: no request failed`, !failed.length, [...new Set(failed)].slice(0, 6));
    ok(`1 · ${tag}: no page error and no console error on any page`, !errs.length, [...new Set(errs)].slice(0, 6));
  }
  await b.close();
  console.log(`${fails ? 'SMOKE FAILED' : 'SMOKE OK'} · ${Math.round((Date.now() - t0) / 1000)} s · ${base}`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FAIL smoke-check crashed  → ' + String(e).slice(0, 400)); process.exit(1); });
