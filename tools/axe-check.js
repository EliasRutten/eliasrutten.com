/* Accessibility check (axe-core, WCAG 2.0 and 2.1 A/AA) on the states v2 stage 1 adds or changes.
   Usage: AXE=/path/to/axe.min.js node tools/axe-check.js [baseUrl] */
const { chromium } = require('playwright');
const fs = require('fs');
const axeSrc = fs.readFileSync(process.env.AXE || require.resolve('axe-core/axe.min.js'), 'utf8');
const base = process.argv[2] || 'http://127.0.0.1:8731/imperial-stack/';
(async () => {
  const b = await chromium.launch(); let total = 0;
  const run = async (name, hash, ls, w, h, prep) => {
    if (process.env.ONLY && !new RegExp(process.env.ONLY).test(name)) return;   /* ONLY=<regex> reruns a group of states */
    const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await c.addInitScript(o => { try { localStorage.setItem('isx-tips-globe', 'off'); localStorage.setItem('isx-tour', 'off'); localStorage.setItem('isx-tips-sim', 'off'); localStorage.setItem('isx-stack', 'open'); Object.keys(o).forEach(k => { if (k === '__pos') sessionStorage.setItem('isx-sim-pos', o[k]); else localStorage.setItem(k, o[k]); }); } catch (e) {} }, ls);
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
  /* stage 2: the Circuit's trays and tour, and the Simulator on the stage */
  const click = sel => async p => { await p.evaluate(q => document.querySelector(q).click(), sel); await p.waitForTimeout(500); };
  /* tiers build A (15 Nov 2026): positions moved with the chapter order (the step before decision 0-1 is 26, before 0-6 is 24, before the yen call 40; the backstop starts at 38) */
  const sim = (b, l) => ({ ...seen, 'isx-sim-mode': 'story', '__pos': JSON.stringify({ l: l || 0, b }) });
  await run('circuit: Firms tray open', '#circuit/04', seen, 1440, 900, click('#isx-tp-firms'));
  await run('circuit: Layers tray open', '#circuit/04', seen, 1440, 900, click('#isx-tp-layers'));
  await run('circuit: tour, first stop', '#circuit', seen, 1440, 900, async p => { await p.evaluate(() => ISX.tour.open(true)); await p.waitForTimeout(500); });
  await run('circuit: tour, last stop', '#circuit', seen, 1440, 900, async p => { await p.evaluate(() => { ISX.tour.open(true); for (let i = 0; i < 3; i++) document.querySelector('#isx-tour .tgo').click(); }); await p.waitForTimeout(500); });
  await run('phone: Firms tray open', '#circuit/04', seen, 390, 844, click('#isx-tp-firms'));
  await run('phone: tour', '#circuit', seen, 390, 844, async p => { await p.evaluate(() => ISX.tour.open(true)); await p.waitForTimeout(500); });
  await run('simulator, guide: opening card', '#simulator', sim(-1), 1440, 900);
  await run('simulator, guide: a step, “The mechanism” open', '#simulator', sim(2), 1440, 900, async p => { await p.evaluate(() => { document.querySelector('#isx-sn-body details.s2deep').open = true; }); await p.waitForTimeout(300); });
  await run('simulator, guide: the step before a decision', '#simulator', sim(25), 1440, 900);
  await run('simulator, guide: a new lever’s card, opened from the step', '#simulator', sim(26), 1440, 900, click('#isx-sn-body .sn-chip.lv2'));
  await run('simulator, guide: Readings open', '#simulator', sim(20), 1440, 900, click('#isx-b1ind'));
  await run('simulator, guide: picker open', '#simulator', sim(23), 1440, 900, click('#isx-sn-pickb'));
  await run('simulator, guide: a mechanism', '#simulator', sim(2, 7), 1440, 900);
  await run('simulator, guide: the whole machine', '#simulator', sim(49), 1440, 900);
  await run('simulator, full view', '#simulator', { ...seen, 'isx-sim-mode': 'full' }, 1440, 900);
  await run('simulator, full view: Readings open and an actor’s dossier', '#simulator', { ...seen, 'isx-sim-mode': 'full' }, 1440, 900, async p => { await p.evaluate(() => { document.getElementById('isx-b1ind').click(); document.querySelector('#isx-rmap .fn[data-n="TSY"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await p.waitForTimeout(500); });
  await run('simulator, full view: a play', '#simulator', { ...seen, 'isx-sim-mode': 'full' }, 1280, 760, click('#isx-cock .pchip'));
  await run('phone: simulator, guide', '#simulator', sim(2), 390, 844);
  await run('phone: simulator, full view', '#simulator', { ...seen, 'isx-sim-mode': 'full' }, 390, 844);
  /* stage 3: the strip, map modes, first principles, the ladder, sectors, Scenarios on the stage, the ownership web */
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await run('circuit: hardware map mode, dollar measure', '#circuit', seen, 1440, 900, async p => { await p.evaluate(() => { document.querySelector('#isx-tp-layers').click(); document.querySelectorAll('#isx-tray-layers .mm')[2].click(); }); await p.waitForTimeout(300); await p.evaluate(() => document.querySelector('#isx-mapmodes [data-aim="abs"]').click()); await p.waitForTimeout(400); });
  await run('circuit at 1024 (strip on its own row)', '#circuit/07', seen, 1024, 760);
  await run('arm (switch in the strip)', '#arm', seen, 1440, 900);
  await run('simulator, first principles: opening', '#simulator', sim(-1, 12), 1440, 900);
  await run('simulator, first principles: a reveal, “The mechanism” open', '#simulator', sim(6, 12), 1440, 900, async p => { await p.evaluate(() => { document.querySelector('#isx-sn-body details.s2deep').open = true; }); await p.waitForTimeout(300); });
  await run('simulator, first principles: the close', '#simulator', sim(7, 12), 1440, 900);
  await run('simulator, guide: backstop, first step', '#simulator', sim(37), 1440, 900);
  await run('simulator, full view: the ladder open', '#simulator', { ...seen, 'isx-sim-mode': 'full' }, 1440, 900, click('#isx-b1ind'));
  await run('simulator, full view: a sector card', '#simulator', { ...seen, 'isx-sim-mode': 'full' }, 1440, 900, async p => { await p.evaluate(() => document.querySelector('#isx-rmap .fzk[data-sec="hh"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(400); });
  await run('scenarios: opening', '#scenarios', seen, 1440, 900);
  await run('scenarios: a chokepoint step, “Read more” and layers open', '#scenarios', seen, 1440, 900, async p => { for (let i = 0; i < 6; i++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(120); } await p.evaluate(() => { document.querySelector('#isx-ssteps .sstep:not([hidden]) .scmore').open = true; document.querySelector('#isx-sc-bar [data-sc="lay"]').click(); }); await p.waitForTimeout(300); });
  await run('scenarios: the close', '#scenarios', seen, 1440, 900, async p => { for (let i = 0; i < 9; i++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(120); } });
  await run('scenarios: picker open', '#scenarios', seen, 1440, 900, click('#isx-sc-pick'));
  await run('ownership web', '#circuit', seen, 1440, 900, async p => { await p.evaluate(() => ISX.web.open()); await p.waitForTimeout(900); });
  await run('ownership web: a firm', '#circuit', seen, 1440, 900, async p => { await p.evaluate(() => ISX.web.open()); await p.waitForSelector('#isx-web3 .wnode[data-id="f:TSMC"]', { state: 'attached', timeout: 20000 }); await p.waitForTimeout(300); await p.evaluate(() => document.querySelector('#isx-web3 .wnode[data-id="f:TSMC"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(300); });   /* waits for the web itself: on a slow machine 900 ms was not always enough */
  await run('phone: scenarios, a step', '#scenarios', seen, 390, 844, async p => { await p.evaluate(() => document.querySelector('#isx-sc-bar .rt-nx').click()); await p.waitForTimeout(300); });
  await run('phone: scenarios, picker', '#scenarios', seen, 390, 844, click('#isx-sc-pick'));
  await run('phone: ownership web', '#circuit', seen, 390, 844, async p => { await p.evaluate(() => ISX.web.open()); await p.waitForTimeout(900); });
  await run('phone: the ledger', '#simulator', { ...seen, 'isx-sim-mode': 'full' }, 390, 844, click('#isx-b1ind'));
  /* stage 5: readings as names until the guide reaches them, the strip of key readings below 1180 px, the full ladder as a list */
  const full = { ...seen, 'isx-sim-mode': 'full' };
  await run('stage 5, guide: step 10, rail part reached', '#simulator', sim(9), 1440, 900);
  await run('stage 5, guide: the ladder at step 10, a row open', '#simulator', sim(9), 1440, 900, async p => { await p.evaluate(() => document.getElementById('isx-b1ind').click()); await p.waitForTimeout(300); await p.evaluate(() => document.querySelector('#isx-b1led button.lrb[data-led]').click()); await p.waitForTimeout(200); });
  await run('stage 5, full view: the ladder with a row and everything behind a click open', '#simulator', full, 1440, 900, async p => { await p.evaluate(() => document.getElementById('isx-b1ind').click()); await p.waitForTimeout(300); await p.evaluate(() => { document.querySelectorAll('#isx-b1led details').forEach(d => { d.open = true; }); document.querySelectorAll('#isx-b1led button.lrb[data-led]')[5].click(); }); await p.waitForTimeout(200); });
  await run('stage 5, full view: an actor’s dossier beside the rail', '#simulator', full, 1440, 900, async p => { await p.evaluate(() => document.querySelector('#isx-rmap .fn[data-n="FED"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(400); });
  await run('stage 5 at 1024: the opening card under the strip', '#simulator', sim(-1), 1024, 768);
  await run('stage 5 at 1024: step 10 and the strip', '#simulator', sim(9), 1024, 768);
  await run('stage 5 at 1024: an actor selected in the guide', '#simulator', sim(11), 1024, 768, async p => { await p.evaluate(() => document.querySelector('#isx-rmap .fn[data-n="TSY"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(400); });
  await run('stage 5 at 768: full view, a lever pulled', '#simulator', full, 768, 1024, async p => { await p.evaluate(() => document.querySelector('[data-s4tab="levers"]').click()); await p.waitForTimeout(400); await p.evaluate(() => document.querySelector('#isx-s2tray-lev .lv').click()); await p.waitForTimeout(400); });
  await run('stage 5 at 768: the ledger', '#simulator', sim(9), 768, 1024, click('#isx-b1ind'));
  await run('stage 5, phone: the opening card', '#simulator', sim(-1), 390, 844);
  await run('stage 5, phone: step 10 with the strip', '#simulator', sim(9), 390, 844);
  await run('stage 5, phone: the ladder in the guide, a row open', '#simulator', sim(9), 390, 844, async p => { await p.evaluate(() => document.getElementById('isx-b1ind').click()); await p.waitForTimeout(300); await p.evaluate(() => document.querySelector('#isx-b1led button.lrb[data-led]').click()); await p.waitForTimeout(200); });
  /* B1: the bar in three tabs, the Circuit's closing ring */
  await run('B1: the Circuit’s ring', '#circuit/ring', seen, 1440, 900);
  await run('B1: the ring as a list at 1024', '#circuit/ring', seen, 1024, 768);
  await run('B1, phone: the ring as a list under the card', '#circuit/ring', seen, 390, 844);
  await run('B1, phone: the Circuit’s bar', '#circuit/05', seen, 390, 844);
  await run('B1 at 900: the Simulator’s bar in one row', '#simulator', sim(21), 900, 700);
  await run('B1-3: a gauge selected in the guide (its dossier)', '#simulator', sim(21), 1440, 900, async p => { await p.evaluate(() => document.querySelector('#isx-rmap .fn.gn[data-n="Y10"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(400); });
  await run('B1-3: the ledger in the guide, a row open', '#simulator', sim(21), 1280, 760, async p => { await p.evaluate(() => document.getElementById('isx-b1ind').click()); await p.waitForTimeout(300); await p.evaluate(() => document.querySelector('#isx-b1led button.lrb[data-led]').click()); await p.waitForTimeout(200); });
  await run('B1-3, phone: the in-play strip and the map', '#simulator', sim(22), 390, 844);
  await run('B1-3, phone: the ledger sheet, a role tab', '#simulator', sim(22), 390, 844, async p => { await p.evaluate(() => document.querySelector('#isx-b1play .ipc.all').click()); await p.waitForTimeout(300); await p.evaluate(() => document.querySelector('#isx-b1led [data-ltab="outcome"]').click()); await p.waitForTimeout(200); });
  await run('B1-3, phone: the “more” menu', '#simulator', sim(22), 390, 844, click('#isx-s2bar .rt-more'));
  /* B1-4: decisions, chain reactions, crisis cards */
  const ask = async p => { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(400); };
  const chainTo = n => async p => { await ask(p); await p.evaluate(() => document.querySelector('#isx-sn-body [data-fk="alt"]').click()); await p.waitForTimeout(400); for (let i = 0; i < n; i++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(350); } };
  await run('B1-4: a decision card (the yen), “More context” open', '#simulator', sim(39), 1440, 900, async p => { await ask(p); await p.click('#isx-sn-body .dmore'); await p.waitForTimeout(200); });
  await run('B1-4: a decision card at 1280×760', '#simulator', sim(25), 1280, 760, ask);
  await run('B1-4: a chain link, “The mechanism” open', '#simulator', sim(39), 1440, 900, async p => { await chainTo(1)(p); await p.evaluate(() => { document.querySelector('#isx-sn-body details.s2deep').open = true; }); await p.waitForTimeout(200); });
  await run('B1-4: a chain link with a relation that was not used', '#simulator', sim(23), 1440, 900, chainTo(0));
  await run('B1-4: a crisis card with its precedent and sources', '#simulator', sim(23), 1440, 900, chainTo(6));
  await run('B1-4: what happened, after the other path', '#simulator', sim(39), 1440, 900, chainTo(6));
  await run('B1-4, phone: a decision card', '#simulator', sim(39), 390, 844, ask);
  await run('B1-4, phone: a chain link and the strip', '#simulator', sim(39), 390, 844, chainTo(1));
  await run('B1-4, phone: a crisis card', '#simulator', sim(25), 390, 844, chainTo(6));
  /* interface fixes: “Full screen” beside the zoom buttons and in the bar, the ring with its three doors, a line's card, the Arm's dock */
  await run('interface: the Circuit, “Full screen” beside zoom', '#circuit/03', seen, 1440, 900);
  await run('interface: the ring with the three doors', '#circuit/ring', seen, 1280, 760);
  await run('interface, phone: the ring’s card with the doors as rows', '#circuit/ring', seen, 390, 844);
  await run('interface: the Simulator’s bar with “Full screen”', '#simulator', sim(23), 1440, 900);
  await run('interface: a line’s card in the full view', '#simulator', full, 1440, 900, async p => { await p.evaluate(() => document.querySelector('#isx-rmap .feh[data-e="1"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(400); });
  await run('interface: a line’s card in the guide', '#simulator', sim(11), 1440, 900, async p => { await p.evaluate(() => { const S = ISX.sim, i = S.lines[S.line].steps[S.beat].e[0]; document.querySelector(`#isx-rmap .feh[data-e="${i}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await p.waitForTimeout(400); });
  await run('interface: Scenarios, the bar with “Full screen”', '#scenarios', seen, 1024, 768);
  await run('interface: the Arm, the dock with “Full screen”', '#arm', seen, 1280, 760);
  await run('interface, phone: the Arm’s dock', '#arm', seen, 390, 844);
  /* content build: the three deeper views, a door, the yen card's history rail, the tour, the locked switch */
  const fullv = { ...seen, 'isx-sim-mode': 'full' }, vw = (id, o) => async p => { await p.evaluate(([i, q]) => ISX.views.open(i, q), [id, o || {}]); await p.waitForTimeout(450); };
  await run('content build: the money loop, a saver opened', '#simulator', fullv, 1440, 900, async p => { await vw('loop')(p); await p.click('#isx-vw .vw-kid'); await p.waitForTimeout(200); });
  await run('content build: the bond screen, level 1', '#simulator', fullv, 1440, 900, vw('bond'));
  await run('content build: the bond screen, level 2 with the currency row', '#simulator', fullv, 1280, 760, vw('bond', { level: 2 }));
  await run('content build: the two desks', '#simulator', fullv, 1440, 900, vw('desks'));
  await run('content build, phone: the bond screen, level 2', '#simulator', fullv, 390, 844, vw('bond', { level: 2 }));
  await run('content build, phone: the money loop', '#simulator', fullv, 390, 844, vw('loop'));
  await run('content build: a dossier with its door', '#simulator', fullv, 1440, 900, async p => { await p.evaluate(() => document.querySelector('#isx-rmap .fn[data-n="SAV"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(400); });
  await run('content build: the yen crisis card, its history rail open', '#simulator', sim(39), 1440, 900, async p => { await chainTo(5)(p); await p.evaluate(() => { const d = document.querySelector('#isx-sn-body .cb-rail'); if (d) d.open = true; }); await p.waitForTimeout(250); });
  await run('content build: the play “Coordinate with the Fed”', '#simulator', fullv, 1440, 900, async p => { await p.evaluate(() => ISX.simPlay(10)); await p.waitForTimeout(400); });
  await run('content build: the Simulator’s tour', '#simulator', sim(-1), 1440, 900, async p => { await p.evaluate(() => ISX.simtour.open(true)); await p.waitForTimeout(400); });
  await run('content build, phone: the Simulator’s tour', '#simulator', sim(-1), 390, 844, async p => { await p.evaluate(() => ISX.simtour.open(true)); await p.waitForTimeout(400); });
  await run('content build: the capital stack locked in the switch', '#simulator', { ...sim(-1), 'isx-stack': 'shut' }, 1440, 900);
  /* fix round: the bond screen's panel (cursor moved, a chip pressed, the table view), the door tab and a borrowed gauge's dossier, the thesis */
  await run('fix round: level 2, cursor at May 2023, the MOVE chip pressed', '#simulator', fullv, 1440, 900, async p => { await vw('bond', { level: 2 })(p); await p.evaluate(() => { document.querySelector('#isx-vw [data-bxj="2023-05"]').click(); document.querySelector('#isx-vw .bx-chip[data-lane="move"]').click(); }); await p.waitForTimeout(200); });
  await run('fix round: level 2 as a table', '#simulator', fullv, 1280, 760, async p => { await vw('bond', { level: 2 })(p); await p.click('#isx-vw .bx-tg'); await p.waitForTimeout(200); });
  await run('fix round, phone: level 2 as a table', '#simulator', fullv, 390, 844, async p => { await vw('bond', { level: 2 })(p); await p.click('#isx-vw .bx-tg'); await p.waitForTimeout(200); });
  await run('fix round: a chain borrows the 10-year; its dossier with figure and door row', '#simulator', sim(25), 1440, 900, async p => { await chainTo(3)(p); await p.evaluate(() => document.querySelector('#isx-rmap .fn[data-n="Y10"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(400); });
  await run('fix round: the opening card with the thesis at 1280×760', '#simulator', sim(-1), 1280, 760);
  /* tiers build A: the door card, a term's tip, the index of guide steps, a dossier with “In the guide”, a step opened from the index */
  await run('tiers: the door card with a term tip open', '#simulator', sim(-1), 1440, 900, async p => { await p.focus('#isx-sn-body .s2thesis dfn.df'); await p.waitForTimeout(150); });
  await run('tiers: the door card at 1280×760', '#simulator', sim(-1), 1280, 760);
  await run('tiers, phone: the door card', '#simulator', sim(-1), 390, 844);
  await run('tiers: the full map with Guide steps open', '#simulator', fullv, 1440, 900, async p => { await p.evaluate(() => document.getElementById('isx-gsb').click()); await p.waitForTimeout(250); });
  await run('tiers, phone: Guide steps as a sheet', '#simulator', fullv, 390, 844, async p => { await p.evaluate(() => { document.querySelector('[data-s4more]').click(); document.querySelector('#isx-b1more .tw-gsm').click(); }); await p.waitForTimeout(250); });
  await run('tiers: a dossier with “In the guide”', '#simulator', fullv, 1440, 900, async p => { await p.evaluate(() => document.querySelector('#isx-rmap .fn[data-n="TSY"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(300); });
  await run('tiers: a step opened from the index, with the way back', '#simulator', fullv, 1440, 900, async p => { await p.evaluate(() => { document.getElementById('isx-gsb').click(); document.querySelector('#isx-gsteps [data-gs="0:30"]').click(); }); await p.waitForTimeout(500); });
  await b.close();
  console.log(total ? total + ' violation type(s) in all' : 'no violations');
  process.exit(total ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
