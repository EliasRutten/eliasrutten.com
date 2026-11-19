/* Frame-time comparison under CPU throttling. Headless Chromium draws WebGL in software, so the
   absolute numbers are far below a real device; only the comparison between two builds means something.
   Usage: node tools/perf-check.js <baseUrl> [rate=4]
   Interface fixes (14 Nov 2026): two states for the Circuit's ring, once it has lit: on the device's own tier (in headless
   Chromium that is the low tier, where the lit arrows stay still) and with ?tier=high (the marker travels the loop).
   Scenarios polish (16 Nov 2026): the Scenarios entry (the iris, the title card and the landing), measured from the click on
   “Follow the chain” for 4.5 s, on the device's own tier and with ?tier=high; and a case's first step, settled, on tier high. ONLY=<regex> runs the states whose name matches. */
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8731/imperial-stack/';
const rate = +(process.argv[3] || 4);
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
(async () => {
  const b = await chromium.launch();
  const run = async (name, hash, prep, q, act, ms, vp) => {
    if (ONLY && !ONLY.test(name)) return;
    const c = await b.newContext(vp ? { viewport: vp, deviceScaleFactor: 3, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await c.addInitScript(() => { try { ['isx-tips-globe', 'isx-tips-sim', 'isx-first', 'isx-insights', 'isx-intro', 'isx-tour'].forEach(k => localStorage.setItem(k, 'off')); localStorage.setItem('isx-sim-mode', 'full'); } catch (e) {} });
    const p = await c.newPage(); await p.goto(base + (q || '') + hash, { waitUntil: 'load' }); await p.waitForTimeout(7000);
    if (prep) await prep(p);
    const cdp = await c.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await p.waitForTimeout(1500);
    const r = await p.evaluate(([act, ms]) => new Promise(res => { const t = []; let last = performance.now(), t0 = last; if (act) (new Function(act))(); const f = now => { t.push(now - last); last = now; if (now - t0 < ms) requestAnimationFrame(f); else { t.sort((a, b) => a - b); const q = x => t[Math.min(t.length - 1, Math.floor(t.length * x))]; res({ frames: t.length, median: +q(.5).toFixed(1), p95: +q(.95).toFixed(1), over50: +(t.filter(x => x > 50).length / t.length * 100).toFixed(1), tier: (window.ISXP && ISXP.tier) || '-' }); } }; requestAnimationFrame(f); }), [act || '', ms || 8000]);
    console.log(name.padEnd(34), JSON.stringify(r)); await c.close();
  };
  await run('circuit, overview', '#circuit');
  await run('circuit, step 02 (flows)', '#circuit', async p => { await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(3000); });
  const ring = async p => { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(9000); };   /* Next from step 10 opens the ring; wait until it has lit */
  await run('circuit, the ring (own tier)', '#circuit/10', ring);
  await run('circuit, the ring (tier high)', '#circuit/10', ring, '?tier=high');
  await run('simulator, full view', '#simulator', async p => { await p.evaluate(() => { const e = document.getElementById('isx-scene-fin'); if (e) e.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(1500); });
  /* round 6 (16 Nov 2026): the Arm on a phone (390 × 844), measured for 3 s from a tap on Commerce (the selection and the sheet) and
     from the switch to the other drawing; the baseline (bands) has the same tap on its Commerce chip. */
  const ph = { width: 390, height: 844 }, tapC = "const g = document.querySelector('#isx-areach [data-anode=\"COMM\"], #isx-abands [data-anode=\"COMM\"]'); g.dispatchEvent(new MouseEvent('click', { bubbles: true }))";
  await run('arm, phone, a tap on Commerce', '#arm', null, '', tapC, 3000, ph);
  await run('arm, phone, Reach to Orbit', '#arm', null, '', "const b = document.querySelector('#isx-aview [data-aview=\"orbit\"]'); if (b) b.click()", 3000, ph);
  await run('arm, phone, Orbit, a tap on Commerce', '#arm/v=orbit', null, '', tapC, 3000, ph);
  await run('arm', '#arm', async p => { await p.evaluate(() => { const e = document.getElementById('isx-scene-arm'); if (e) e.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(1500); });
  const sc = async p => { await p.evaluate(() => { const e = document.getElementById('isx-sc3'); if (e) e.scrollIntoView({ block: 'start' }); }); await p.waitForTimeout(1500); };
  const enter = "document.querySelector('#isx-sc3 .b3cta').click()";
  await run('scenarios, entry (own tier)', '#scenarios', sc, '', enter, 4500);
  await run('scenarios, entry (tier high)', '#scenarios', sc, '?tier=high', enter, 4500);
  const inCase = async p => { await sc(p); await p.evaluate(() => document.querySelector('#isx-sc3 .b3cta').click()); await p.waitForTimeout(7000); };
  await run('scenarios, a case (tier high)', '#scenarios', inCase, '?tier=high');
  /* round 5b (16 Nov 2026): the two first openings, each measured from its first frame for 7 s, on the device's own tier and with
     ?tier=high; beside them the same stage at rest, so the opening's own cost can be read off (the globe draws in software here). */
  await run('circuit, overview at rest (tier high)', '#circuit', null, '?tier=high', null, 7000);
  await run('circuit, first opening (own tier)', '#circuit', null, '', "ISX.opening.play('circuit')", 7000);
  await run('circuit, first opening (tier high)', '#circuit', null, '?tier=high', "ISX.opening.play('circuit')", 7000);
  const entry = async p => { await p.evaluate(() => { const e = document.getElementById('isx-scene-fin'); if (e) e.scrollIntoView({ block: 'center' }); const w = document.querySelector('#isx-cock [data-b1more="ways"]'); if (w) w.click(); }); await p.waitForTimeout(1500); };
  await run('simulator, the entry at rest', '#simulator', entry, '', null, 7000);
  await run('simulator, its entry screen (own tier; 19 Nov 2026: the Simulator’s own opening went with the old card)', '#simulator', entry, '', "ISX.enter.open('fin', true)", 7000);
  await run('simulator, its entry screen (tier high)', '#simulator', entry, '?tier=high', "ISX.enter.open('fin', true)", 7000);
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
