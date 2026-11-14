/* The ring's travelling marker on its own (interface fixes, 14 Nov 2026). tools/perf-check.js measures the ring with the
   globe turning behind it, and in headless Chromium the globe is drawn in software, so it swamps everything else. Here the
   globe's loop is paused: CPU throttled 4x, 2x pixels, ?tier=high; frame times with the marker travelling and with it stopped.
   Usage: node tools/perf-ring.js [baseUrl] */
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await c.addInitScript(() => { try { ['isx-tips-globe', 'isx-tips-sim', 'isx-first', 'isx-insights', 'isx-intro', 'isx-tour'].forEach(k => localStorage.setItem(k, 'off')); } catch (e) {} });
  const p = await c.newPage(); await p.goto((process.argv[2] || "http://127.0.0.1:8731/imperial-stack/") + "?tier=high#circuit/10", { waitUntil: 'load' }); await p.waitForTimeout(7000);
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(9000);
  const cdp = await c.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const meas = () => p.evaluate(() => new Promise(res => { const t = []; let last = performance.now(), t0 = last; const f = now => { t.push(now - last); last = now; if (now - t0 < 8000) requestAnimationFrame(f); else { t.sort((a, b) => a - b); const q = x => t[Math.min(t.length - 1, Math.floor(t.length * x))]; res({ frames: t.length, median: +q(.5).toFixed(1), p95: +q(.95).toFixed(1), over50: +(t.filter(x => x > 50).length / t.length * 100).toFixed(1) }); } }; requestAnimationFrame(f); }));
  await p.evaluate(() => { ISX.globe.pauseAnimation(); }); await p.waitForTimeout(1000);
  const cls = await p.evaluate(() => document.getElementById('isx-ring').className);
  console.log('globe paused, marker ' + (/\bfl\b/.test(cls) ? 'travelling' : 'absent (' + cls + ')'), JSON.stringify(await meas()));
  await p.evaluate(() => document.getElementById('isx-ring').classList.remove('fl')); await p.waitForTimeout(500);
  console.log('globe paused, marker stopped  ', JSON.stringify(await meas()));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
