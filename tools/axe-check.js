/* Accessibility check (axe-core, WCAG 2.0 and 2.1 A/AA) on the states v2 stage 1 adds or changes.
   Usage: AXE=/path/to/axe.min.js node tools/axe-check.js [baseUrl] */
const { chromium } = require('playwright');
const fs = require('fs');
const axeSrc = fs.readFileSync(process.env.AXE || require.resolve('axe-core/axe.min.js'), 'utf8');
const base = process.argv[2] || 'http://127.0.0.1:8731/imperial-stack/';
(async () => {
  const b = await chromium.launch(); let total = 0;
  const run = async (name, hash, ls, w, h, prep) => {
    const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await c.addInitScript(o => { try { localStorage.setItem('isx-tips-globe', 'off'); localStorage.setItem('isx-tips-sim', 'off'); Object.keys(o).forEach(k => localStorage.setItem(k, o[k])); } catch (e) {} }, ls);
    const p = await c.newPage(); await p.goto(base + hash, { waitUntil: 'load' });
    await p.waitForFunction(() => window.ISX && ISX.booted && ISX.globe && ISX.own && ISX.own.data, null, { timeout: 60000 });
    await p.waitForTimeout(2500); if (prep) await prep(p);
    await p.evaluate(axeSrc);
    const r = await p.evaluate(async () => { const r = await axe.run(document.getElementById('isx-root'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }); return r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, ex: v.nodes.slice(0, 3).map(n => n.target.join(' ') + ' :: ' + (n.failureSummary || '').replace(/\s+/g, ' ').slice(0, 150)) })); });
    total += r.length; console.log(name + ': ' + r.length + ' violation(s)'); r.forEach(v => console.log('   ', v.id, v.impact, 'x' + v.n, JSON.stringify(v.ex).slice(0, 600)));
    await c.close();
  };
  const seen = { 'isx-first': 'off', 'isx-insights': 'off' };
  await run('circuit step 04 (reading notes on the map)', '#circuit/04', seen, 1440, 900);
  await run('country card with reading notes', '#circuit/04/c=chn', seen, 1440, 900, async p => { await p.evaluate(() => { const d = document.querySelector('.care2 details'); if (d) d.open = true; }); });
  await run('footprint: Besi', '#circuit/03/firm=besi', seen, 1440, 900);
  await run('footprint: Nexperia (disputed)', '#circuit/04/firm=nexperia', seen, 1440, 900);
  await run('footprint: Alphabet (founders)', '#circuit/02/firm=alphabet', seen, 1440, 900);
  await run('insight shown', '#circuit', { 'isx-first': 'off' }, 1440, 900, async p => { await p.evaluate(() => ISX.setStep(6)); await p.waitForTimeout(2200); });
  await run('first moment', '', {}, 1440, 900);
  await run('phone: footprint', '#circuit/03/firm=besi', seen, 390, 844);
  await run('phone: first moment', '', {}, 390, 844);
  await run('simulator, full view (unchanged layout, new loop)', '#simulator', { ...seen, 'isx-sim-mode': 'full' }, 1440, 900);
  await b.close();
  console.log(total ? total + ' violation type(s) in all' : 'no violations');
  process.exit(total ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
