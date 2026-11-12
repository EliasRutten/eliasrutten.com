/* Frame-time comparison under CPU throttling. Headless Chromium draws WebGL in software, so the
   absolute numbers are far below a real device; only the comparison between two builds means something.
   Usage: node tools/perf-check.js <baseUrl> [rate=4] */
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8731/imperial-stack/';
const rate = +(process.argv[3] || 4);
(async () => {
  const b = await chromium.launch();
  const run = async (name, hash, prep) => {
    const c = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await c.addInitScript(() => { try { ['isx-tips-globe', 'isx-tips-sim', 'isx-first', 'isx-insights', 'isx-intro', 'isx-tour'].forEach(k => localStorage.setItem(k, 'off')); localStorage.setItem('isx-sim-mode', 'full'); } catch (e) {} });
    const p = await c.newPage(); await p.goto(base + hash, { waitUntil: 'load' }); await p.waitForTimeout(7000);
    if (prep) await prep(p);
    const cdp = await c.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await p.waitForTimeout(1500);
    const r = await p.evaluate(() => new Promise(res => { const t = []; let last = performance.now(), t0 = last; const f = now => { t.push(now - last); last = now; if (now - t0 < 8000) requestAnimationFrame(f); else { t.sort((a, b) => a - b); const q = x => t[Math.min(t.length - 1, Math.floor(t.length * x))]; res({ frames: t.length, median: +q(.5).toFixed(1), p95: +q(.95).toFixed(1), over50: +(t.filter(x => x > 50).length / t.length * 100).toFixed(1), tier: (window.ISXP && ISXP.tier) || '-' }); } }; requestAnimationFrame(f); }));
    console.log(name.padEnd(34), JSON.stringify(r)); await c.close();
  };
  await run('circuit, overview', '#circuit');
  await run('circuit, step 02 (flows)', '#circuit', async p => { await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(3000); });
  await run('simulator, full view', '#simulator', async p => { await p.evaluate(() => { const e = document.getElementById('isx-scene-fin'); if (e) e.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(1500); });
  await run('arm', '#arm', async p => { await p.evaluate(() => { const e = document.getElementById('isx-scene-arm'); if (e) e.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(1500); });
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
