/* Accessibility check (axe-core, WCAG 2.0 and 2.1 A/AA) on the states v2 stage 1 adds or changes.
   Usage: AXE=/path/to/axe.min.js node tools/axe-check.js [baseUrl] */
const { chromium } = require('playwright');
const fs = require('fs');
const axeSrc = fs.readFileSync(process.env.AXE || require.resolve('axe-core/axe.min.js'), 'utf8');
const base = process.argv[2] || 'http://127.0.0.1:8731/imperial-stack/';
(async () => {
  const b = await chromium.launch(); let total = 0;
  let fromHit = false;
  const run = async (name, hash, ls, w, h, prep) => {
    if (process.env.ONLY && !new RegExp(process.env.ONLY).test(name)) return;
    if (process.env.FROM && !fromHit) { if (new RegExp(process.env.FROM).test(name)) fromHit = true; else return; }   /* FROM=<regex> resumes a run at the first state it matches */   /* ONLY=<regex> reruns a group of states */
    const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await c.addInitScript(o => { try { localStorage.setItem('isx-tips-globe', 'off'); localStorage.setItem('isx-tour', 'off'); localStorage.setItem('isx-tips-sim', 'off'); localStorage.setItem('isx-stack', 'open'); Object.keys(o).forEach(k => { if (k === '__pos') sessionStorage.setItem('isx-sim-pos', o[k]); else if (o[k] === null) localStorage.removeItem(k); else localStorage.setItem(k, o[k]); }); } catch (e) {} }, ls);
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
  /* clarity build (17 Nov 2026): 43 steps in three acts, so every position below was set again. Counting from 0: the step before the call on funding
     (0-1) is 9 and the step after it 10; “The Fed opens the tap” is 15; the step before the call on long yields (0-6) is 26; the Fed’s repo window is 28;
     the close is 43. The yen call is in the episode “The yen action” (line 18, before its second step); the oil shock is line 14. The primer’s screens:
     the pyramid 5, the eras 6, “Deficits become profits” 9, “Why the dollar needs the AI trade” 11. What follows is the older note, kept as history. */
  /* tiers build A (15 Nov 2026): positions moved with the chapter order (the step before decision 0-1 is 26, before 0-6 is 24, before the yen call 40; the backstop starts at 38).
     Tiers build B: the new step 30 moves what follows by one (the yen call after step 41, the backstop from 39, the close at 52); first principles close at 8 (guide build, 16 Nov: at 10) */
  const sim = (b, l) => ({ ...seen, 'isx-sim-mode': 'story', '__pos': JSON.stringify({ l: l || 0, b }) });
  await run('circuit: Firms tray open', '#circuit/04', seen, 1440, 900, click('#isx-tp-firms'));
  await run('circuit: Layers tray open', '#circuit/04', seen, 1440, 900, click('#isx-tp-layers'));
  await run('circuit: tour, first stop', '#circuit', seen, 1440, 900, async p => { await p.evaluate(() => ISX.tour.open(true)); await p.waitForTimeout(500); });
  await run('circuit: tour, last stop', '#circuit', seen, 1440, 900, async p => { await p.evaluate(() => { ISX.tour.open(true); for (let i = 0; i < 3; i++) document.querySelector('#isx-tour .tgo').click(); }); await p.waitForTimeout(500); });
  await run('phone: Firms tray open', '#circuit/04', seen, 390, 844, click('#isx-tp-firms'));
  await run('phone: tour', '#circuit', seen, 390, 844, async p => { await p.evaluate(() => ISX.tour.open(true)); await p.waitForTimeout(500); });
  await run('simulator, guide: opening card', '#simulator', sim(-1), 1440, 900);
  await run('simulator, guide: a step, “The mechanism” open', '#simulator', sim(2), 1440, 900, async p => { await p.evaluate(() => { document.querySelector('#isx-sn-body details.s2deep').open = true; }); await p.waitForTimeout(300); });
  await run('simulator, guide: the step before a decision', '#simulator', sim(9), 1440, 900);
  await run('simulator, guide: a new lever’s card, opened from the step', '#simulator', sim(10), 1440, 900, click('#isx-sn-body .sn-chip.lv2'));
  await run('simulator, guide: Readings open', '#simulator', sim(20), 1440, 900, click('#isx-b1ind'));
  await run('simulator, guide: picker open', '#simulator', sim(23), 1440, 900, click('#isx-sn-pickb'));
  await run('simulator, guide: an episode’s step', '#simulator', sim(2, 14), 1440, 900);
  await run('simulator, guide: the whole machine', '#simulator', sim(43), 1440, 900);
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
  await run('simulator, first principles: the close', '#simulator', sim(10, 12), 1440, 900);
  await run('simulator, guide: backstop, first step', '#simulator', sim(28), 1440, 900);
  await run('simulator, full view: the ladder open', '#simulator', { ...seen, 'isx-sim-mode': 'full' }, 1440, 900, click('#isx-b1ind'));
  await run('simulator, full view: a sector card', '#simulator', { ...seen, 'isx-sim-mode': 'full' }, 1440, 900, async p => { await p.evaluate(() => document.querySelector('#isx-rmap .fzk[data-sec="hh"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(400); });
  /* B3 (15 Nov 2026): Scenarios in three depths. The stepped card with “Read more”, “Layers used” and the picker are gone, and so
     are their four states; in their place: the gallery, the end of the entry, a step, a switch step, the drawer, the ledger
     (whole and filtered) and the close. The pages here run with motion on, so the entry is ended with a key. */
  const scIn = n => async p => { await p.evaluate(() => document.querySelector('#isx-b3-gal .b3cta').click()); await p.waitForTimeout(300); await p.keyboard.press('Shift'); await p.waitForTimeout(700); for (let i = 0; i < n; i++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(150); } await p.waitForTimeout(1900); };
  const scThen = (n, sel) => async p => { if (n != null) await scIn(n)(p); await p.evaluate(q => document.querySelector(q).click(), sel); await p.waitForTimeout(900); };
  await run('scenarios: the gallery', '#scenarios', seen, 1440, 900);
  await run('scenarios: the end of the entry, watched to step 1', '#scenarios', seen, 1440, 900, async p => { await p.evaluate(() => document.querySelector('#isx-b3-gal .b3cta').click()); await p.waitForTimeout(5400); });
  await run('scenarios: a step', '#scenarios', seen, 1440, 900, scIn(2));
  await run('scenarios: a switch step', '#scenarios', seen, 1440, 900, scIn(6));
  await run('scenarios: the drawer on a switch step', '#scenarios', seen, 1440, 900, scThen(6, '#isx-b3-card .b3more'));
  await run('scenarios: the ledger, from the gallery', '#scenarios', seen, 1440, 900, scThen(null, '#isx-b3-gal [data-b3="ledger"]'));
  await run('scenarios: the ledger filtered to US firms', '#scenarios', seen, 1440, 900, async p => { await scThen(null, '#isx-b3-gal [data-b3="ledger"]')(p); await p.evaluate(() => document.querySelector('#isx-b3-ledger [data-b3f="usfirm"]').click()); await p.waitForTimeout(500); });
  await run('scenarios: the ledger filtered by kind (Scenarios polish)', '#scenarios', seen, 1440, 900, async p => { await scThen(null, '#isx-b3-gal [data-b3="ledger"]')(p); await p.evaluate(() => document.querySelector('#isx-b3-ledger [data-b6c="finance"]').click()); await p.waitForTimeout(500); });
  await run('scenarios: the close', '#scenarios', seen, 1440, 900, scIn(8));
  await run('ownership web', '#circuit', seen, 1440, 900, async p => { await p.evaluate(() => ISX.web.open()); await p.waitForTimeout(900); });
  await run('ownership web: a firm', '#circuit', seen, 1440, 900, async p => { await p.evaluate(() => ISX.web.open()); await p.waitForSelector('#isx-web3 .wnode[data-id="f:TSMC"]', { state: 'attached', timeout: 20000 }); await p.waitForTimeout(300); await p.evaluate(() => document.querySelector('#isx-web3 .wnode[data-id="f:TSMC"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(300); });   /* waits for the web itself: on a slow machine 900 ms was not always enough */
  await run('phone: scenarios, the gallery', '#scenarios', seen, 390, 844);
  await run('phone: scenarios, a switch step', '#scenarios', seen, 390, 844, scIn(6));
  await run('phone: scenarios, the drawer', '#scenarios', seen, 390, 844, scThen(6, '#isx-b3-card .b3more'));
  await run('phone: scenarios, the ledger', '#scenarios', seen, 390, 844, scThen(null, '#isx-b3-gal [data-b3="ledger"]'));
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
  const ask = async p => { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(400); await p.evaluate(() => { const b = [...document.querySelectorAll('#isx-sn-body [data-dcp]')].pop(); if (b) b.click(); }); await p.waitForTimeout(400); };   /* clarity patch: to the call itself, past its setup pages */
  const chainTo = n => async p => { await ask(p); await p.evaluate(() => { document.querySelector('#isx-sn-body .dc-opt[data-dco="alt"]').click(); document.querySelector('#isx-sn-body .dc-go').click(); }); await p.waitForTimeout(700); for (let i = 0; i < n; i++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(350); } };
  await run('B1-4: a decision (the yen call), an option chosen', '#simulator', sim(0, 18), 1440, 900, async p => { await ask(p); await p.click('#isx-sn-body .dc-opt'); await p.waitForTimeout(300); });
  await run('B1-4: a decision card at 1280×760', '#simulator', sim(9), 1280, 760, ask);
  await run('B1-4: a chain link, “The mechanism” open', '#simulator', sim(0, 18), 1440, 900, async p => { await chainTo(1)(p); await p.evaluate(() => { document.querySelector('#isx-sn-body details.s2deep').open = true; }); await p.waitForTimeout(200); });
  await run('B1-4: a chain link with a relation that was not used', '#simulator', sim(26), 1440, 900, chainTo(0));
  await run('B1-4: a crisis card with its precedent and sources', '#simulator', sim(26), 1440, 900, chainTo(6));
  await run('B1-4: what happened, after the other path', '#simulator', sim(0, 18), 1440, 900, chainTo(6));
  await run('B1-4, phone: a decision card', '#simulator', sim(0, 18), 390, 844, ask);
  await run('B1-4, phone: a chain link and the strip', '#simulator', sim(0, 18), 390, 844, chainTo(1));
  await run('B1-4, phone: a crisis card', '#simulator', sim(9), 390, 844, chainTo(6));
  /* interface fixes: “Full screen” beside the zoom buttons and in the bar, the ring with its three doors, a line's card, the Arm's dock */
  await run('interface: the Circuit, “Full screen” beside zoom', '#circuit/03', seen, 1440, 900);
  await run('interface: the ring with the three doors', '#circuit/ring', seen, 1280, 760);
  await run('interface, phone: the ring’s card with the doors as rows', '#circuit/ring', seen, 390, 844);
  await run('interface: the Simulator’s bar with “Full screen”', '#simulator', sim(23), 1440, 900);
  await run('interface: a line’s card in the full view', '#simulator', full, 1440, 900, async p => { await p.evaluate(() => document.querySelector('#isx-rmap .feh[data-e="1"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(400); });
  await run('interface: a line’s card in the guide', '#simulator', sim(11), 1440, 900, async p => { await p.evaluate(() => { const S = ISX.sim, i = S.lines[S.line].steps[S.beat].e[0]; document.querySelector(`#isx-rmap .feh[data-e="${i}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await p.waitForTimeout(400); });
  await run('interface: Scenarios at 1024 × 768, a step (the strip beside the dock with “Full screen”)', '#scenarios', seen, 1024, 768, scIn(3));   /* B3: was the bar with “Full screen” in it */
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
  await run('content build: the yen crisis card, its history rail open', '#simulator', sim(0, 18), 1440, 900, async p => { await chainTo(5)(p); await p.evaluate(() => { const d = document.querySelector('#isx-sn-body .cb-rail'); if (d) d.open = true; }); await p.waitForTimeout(250); });
  await run('content build: the play “Coordinate with the Fed”', '#simulator', fullv, 1440, 900, async p => { await p.evaluate(() => ISX.simPlay(10)); await p.waitForTimeout(400); });
  await run('content build: the Simulator’s tour', '#simulator', sim(-1), 1440, 900, async p => { await p.evaluate(() => ISX.simtour.open(true)); await p.waitForTimeout(1200); });   /* guide build: from the entry the tour first opens the level's first card */
  await run('content build, phone: the Simulator’s tour', '#simulator', sim(-1), 390, 844, async p => { await p.evaluate(() => ISX.simtour.open(true)); await p.waitForTimeout(1200); });   /* guide build: from the entry the tour first opens the level's first card */
  await run('content build: the capital stack locked in the switch', '#simulator', { ...sim(-1), 'isx-stack': 'shut' }, 1440, 900);
  /* fix round: the bond screen's panel (cursor moved, a chip pressed, the table view), the door tab and a borrowed gauge's dossier, the thesis */
  await run('fix round: level 2, cursor at May 2023, the MOVE chip pressed', '#simulator', fullv, 1440, 900, async p => { await vw('bond', { level: 2 })(p); await p.evaluate(() => { document.querySelector('#isx-vw [data-bxj="2023-05"]').click(); document.querySelector('#isx-vw .bx-chip[data-lane="move"]').click(); }); await p.waitForTimeout(200); });
  await run('fix round: level 2 as a table', '#simulator', fullv, 1280, 760, async p => { await vw('bond', { level: 2 })(p); await p.click('#isx-vw .bx-tg'); await p.waitForTimeout(200); });
  await run('fix round, phone: level 2 as a table', '#simulator', fullv, 390, 844, async p => { await vw('bond', { level: 2 })(p); await p.click('#isx-vw .bx-tg'); await p.waitForTimeout(200); });
  await run('fix round: a chain borrows the 10-year; its dossier with figure and door row', '#simulator', sim(9), 1440, 900, async p => { await chainTo(3)(p); await p.evaluate(() => document.querySelector('#isx-rmap .fn[data-n="Y10"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(400); });
  await run('fix round: the opening card with the thesis at 1280×760', '#simulator', sim(-1), 1280, 760);
  /* tiers build A: the door card, a term's tip, the index of guide steps, a dossier with “In the guide”, a step opened from the index */
  await run('tiers: the door card with a term tip open', '#simulator', sim(-1), 1440, 900, async p => { await p.focus('#isx-sn-body .s2thesis dfn.df'); await p.waitForTimeout(150); });
  await run('tiers: the door card at 1280×760', '#simulator', sim(-1), 1280, 760);
  await run('tiers, phone: the door card', '#simulator', sim(-1), 390, 844);
  await run('tiers: the full map with Guide steps open', '#simulator', fullv, 1440, 900, async p => { await p.evaluate(() => document.getElementById('isx-gsb').click()); await p.waitForTimeout(250); });
  await run('tiers, phone: Guide steps as a sheet', '#simulator', fullv, 390, 844, async p => { await p.evaluate(() => { document.querySelector('[data-s4more]').click(); document.querySelector('#isx-b1more .tw-gsm').click(); }); await p.waitForTimeout(250); });
  await run('tiers: a dossier with “In the guide”', '#simulator', fullv, 1440, 900, async p => { await p.evaluate(() => document.querySelector('#isx-rmap .fn[data-n="TSY"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(300); });
  await run('tiers: a step opened from the index, with the way back', '#simulator', fullv, 1440, 900, async p => { await p.evaluate(() => { document.getElementById('isx-gsb').click(); document.querySelector('#isx-gsteps [data-gs="0:31"]').click(); }); await p.waitForTimeout(500); });
  /* tiers build B: the primer (a screen with a tip open, “Say more” open, the hand-over, a phone), the new step 30, the guide's close with its sources */
  await run('tiers B: a primer screen with a term tip open', '#simulator', sim(2, 13), 1440, 900, async p => { await p.focus('#isx-sn-body .s2p dfn.df'); await p.waitForTimeout(150); });
  await run('tiers B: a primer screen, “Say more” open', '#simulator', sim(6, 13), 1440, 900, async p => { await p.evaluate(() => { document.querySelector('#isx-sn-body details.s2deep').open = true; }); await p.waitForTimeout(300); });
  await run('tiers B: the primer’s hand-over', '#simulator', sim(12, 13), 1440, 900);
  await run('tiers B, phone: a primer screen', '#simulator', sim(0, 13), 390, 844);
  await run('tiers B: the new step “The Fed opens the tap”', '#simulator', sim(15), 1440, 900);
  await run('tiers B: the guide’s close, its sources open', '#simulator', sim(43), 1440, 900, async p => { await p.evaluate(() => { document.querySelector('#isx-sn-body details.s2deep').open = true; }); await p.waitForTimeout(300); });
  /* B4: the Arm in its three layouts, the sheets, the mistake panel */
  await run('B4: the Arm, full, Platforms selected', '#arm', seen, 1440, 900, async p => { await p.evaluate(() => ISX.setArmSel('PLAT')); await p.waitForTimeout(400); });
  await run('B4: the Arm, compact, a relation', '#arm', seen, 1280, 760, async p => { await p.evaluate(() => ISX.setArmRel('control')); await p.waitForTimeout(400); });
  await run('B4: the Arm, a relation with every link open in the card', '#arm', seen, 1440, 900, async p => { await p.evaluate(() => { ISX.setArmRel('rent'); document.querySelector('#isx-acard [data-acard="links"]').click(); }); await p.waitForTimeout(400); });
  await run('B4, tablet: the Arm in Reach (round 6)', '#arm', seen, 768, 1024);
  await run('B4: the relation picker sheet', '#arm', seen, 1440, 900, async p => { await p.evaluate(() => document.querySelector('#isx-tabs [data-ash="pick"]').click()); await p.waitForTimeout(500); });
  await run('B4, phone: the relation picker sheet', '#arm', seen, 390, 844, async p => { await p.evaluate(() => document.querySelector('#isx-tabs [data-ash="pick"]').click()); await p.waitForTimeout(500); });
  await run('B4: the Revenue map with its card', '#revenue', seen, 1440, 900);
  await run('B4: the mistake panel open', '#circuit/03', seen, 1440, 900, async p => { await p.evaluate(() => document.getElementById('isx-mis').click()); await p.waitForTimeout(300); });
  await run('B4, phone: the mistake panel open', '#arm', seen, 390, 844, async p => { await p.evaluate(() => document.querySelector('#isx-b4row [data-mis]').click()); await p.waitForTimeout(300); });
  /* guide build (16 Nov 2026): the entry (the full thesis, the reminder, a returning visitor), the primer's diagrams and their table views,
     the rewritten and the new reveals, the close with the reminder */
  await run('guide build: the entry, the full thesis open', '#simulator', sim(-1), 1280, 760, async p => { await p.evaluate(() => document.querySelector('#isx-sn-body [data-gefull]').click()); await p.waitForTimeout(250); });
  await run('guide build: the entry, the reminder open', '#simulator', sim(-1), 1440, 900, async p => { await p.evaluate(() => document.querySelector('#isx-sn-body [data-remind]').click()); await p.waitForTimeout(300); });
  await run('guide build, phone: the entry, the reminder open', '#simulator', sim(-1), 390, 844, async p => { await p.evaluate(() => document.querySelector('#isx-sn-body [data-remind]').click()); await p.waitForTimeout(300); });
  await run('guide build: the entry for a returning visitor (“Last time”)', '#simulator', { ...sim(-1), 'isx-way': 'ground' }, 1440, 900);
  await run('guide build, tablet: the entry', '#simulator', sim(-1), 1024, 768);
  await run('guide build: the pyramid (P10)', '#simulator', sim(5, 13), 1440, 900);
  await run('guide build: the pyramid as a table', '#simulator', sim(5, 13), 1280, 760, async p => { await p.evaluate(() => document.querySelector('#isx-sn-body .gd-tg').click()); await p.waitForTimeout(250); });
  await run('guide build: the eras (P11), “Say more” open', '#simulator', sim(6, 13), 1440, 900, async p => { await p.evaluate(() => { document.querySelector('#isx-sn-body details.s2deep').open = true; }); await p.waitForTimeout(300); });
  await run('guide build: the fifth band lit (P13), as a table', '#simulator', sim(11, 13), 1440, 900, async p => { await p.evaluate(() => document.querySelector('#isx-sn-body .gd-tg').click()); await p.waitForTimeout(250); });
  await run('guide build, phone: the eras (P11)', '#simulator', sim(6, 13), 390, 844);
  await run('guide build: “Deficits become profits” (P12), “Say more” open', '#simulator', sim(9, 13), 1440, 900, async p => { await p.evaluate(() => { document.querySelector('#isx-sn-body details.s2deep').open = true; }); await p.waitForTimeout(300); });
  await run('guide build: first principles R5, the mechanism open', '#simulator', sim(5, 12), 1440, 900, async p => { await p.evaluate(() => { document.querySelector('#isx-sn-body details.s2deep').open = true; }); await p.waitForTimeout(300); });
  await run('guide build: first principles R7, the mechanism open', '#simulator', sim(8, 12), 1440, 900, async p => { await p.evaluate(() => { document.querySelector('#isx-sn-body details.s2deep').open = true; }); await p.waitForTimeout(300); });
  await run('guide build: first principles R8', '#simulator', sim(9, 12), 1280, 760);
  await run('guide build: the guide’s close, the reminder open', '#simulator', sim(43), 1440, 900, async p => { await p.evaluate(() => document.querySelector('#isx-sn-body [data-remind]').click()); await p.waitForTimeout(300); });
  /* round 5b (16 Nov 2026): a hint shown, the lever row with two pulled, both first openings held at one moment.
     The hints and the openings stay away while isx-tips-sim is 'off' (every other state here), so these states take it off. */
  const first = { ...seen, 'isx-tips-sim': null, 'isx-simtour': 'off', 'isx-open-circuit': '1', 'isx-open-sim': '1' };
  const hint = id => async p => { await p.waitForFunction(k => ISX.hints && ISX.hints.on === k, id, { timeout: 15000 }); await p.waitForTimeout(400); };
  await run('round 5b: a hint shown (Next), first principles', '#simulator', { ...first, 'isx-sim-mode': 'story', '__pos': JSON.stringify({ l: 12, b: 0 }) }, 1440, 900, hint('next'));
  await run('round 5b: a hint beside the card (a dotted word)', '#simulator', { ...first, 'isx-hints': 'next', 'isx-sim-mode': 'story', '__pos': JSON.stringify({ l: 12, b: 2 }) }, 1440, 900, hint('term'));
  await run('round 5b: a decision with hints on (the call screen says it itself; no hint behind it)', '#simulator', { ...first, 'isx-sim-mode': 'story', '__pos': JSON.stringify({ l: 0, b: 9, ph: 'ask' }) }, 1280, 760, async p => { await p.waitForTimeout(1200); });
  await run('round 5b, phone: a hint shown', '#simulator', { ...first, 'isx-sim-mode': 'story', '__pos': JSON.stringify({ l: 13, b: 0 }) }, 390, 844, hint('next'));
  const two = async p => { await p.evaluate(() => { ISX.simLever(0); ISX.simLever(14); }); await p.waitForTimeout(500); };
  await run('round 5b: the lever row, two pulled', '#simulator', { ...seen, 'isx-sim-mode': 'full' }, 1440, 900, two);
  await run('round 5b: the lever row at 1280 × 760, two pulled', '#simulator', { ...seen, 'isx-sim-mode': 'full' }, 1280, 760, two);
  await run('round 5b, phone: the lever row, two pulled', '#simulator', { ...seen, 'isx-sim-mode': 'full' }, 390, 844, two);
  const held = (name, t) => async p => { if (name === 'sim') { await p.evaluate(() => { ISX.opening.end(); document.getElementById('isx-v-fin').click(); }); await p.waitForTimeout(300); } await p.evaluate(([n, t]) => { if (ISX.opening.on !== n) throw new Error('the opening is not playing: ' + n); ISX.opening.seek(t); }, [name, t]); await p.waitForTimeout(700); };
  const fresh = { 'isx-tips-sim': null, 'isx-insights': 'off' };
  await run('round 5b: the Circuit’s opening, the title (1.8 s)', '', fresh, 1440, 900, held('circuit', 1.8));
  await run('round 5b: the Circuit’s opening, the line and the ring (5.2 s)', '', fresh, 1440, 900, held('circuit', 5.2));
  await run('round 5b: the Simulator’s opening, the sweep (3.8 s)', '', fresh, 1440, 900, held('sim', 3.8));
  await run('round 5b, phone: the Circuit’s opening, the title (1.8 s)', '', fresh, 390, 844, held('circuit', 1.8));
  /* round 6 (16 Nov 2026): the Arm rethought: Reach and Orbit on phones, the sheet, the switchboard, “Elsewhere on the map”, a hint */
  const tap = id => async p => { await p.evaluate(k => document.querySelector(`#isx-areach [data-anode="${k}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })), id); await p.waitForTimeout(700); };
  await run('round 6, phone: Reach, the whole machine', '#arm', seen, 390, 844);
  await run('round 6, phone: Reach, a state body selected (the sheet peeks)', '#arm', seen, 390, 844, tap('COMM'));
  await run('round 6, phone: Reach, the sheet open (every link, Elsewhere, doors)', '#arm', seen, 390, 844, async p => { await tap('USER')(p); await p.evaluate(() => document.querySelector('#isx-asheet [data-ash="tall"]').click()); await p.waitForTimeout(600); });
  await run('round 6, phone: Reach, a sector with its firms', '#arm', seen, 390, 844, async p => { await tap('PLAT')(p); await p.evaluate(() => document.querySelector('#isx-asheet [data-ash="tall"]').click()); await p.waitForTimeout(600); });
  await run('round 6, phone: Orbit, the whole machine', '#arm/v=orbit', seen, 390, 844);
  await run('round 6, phone: Orbit, a selection', '#arm/v=orbit', seen, 390, 844, tap('COMM'));
  await run('round 6, phone: the switchboard, a tile open', '#arm/rel=control', seen, 390, 844, async p => { await p.evaluate(() => document.querySelector('[data-atile="COMM>FAB"]').click()); await p.waitForTimeout(400); });
  await run('round 6: the switchboard in the card', '#arm/rel=control', seen, 1440, 900, async p => { await p.evaluate(() => document.querySelector('#isx-acard [data-acard="links"]').click()); await p.waitForTimeout(500); });
  await run('round 6: the switchboard in the sheet (strip card)', '#arm/rel=control', seen, 1100, 800, async p => { await p.evaluate(() => document.querySelector('#isx-acard [data-acard="links"]').click()); await p.waitForTimeout(600); });
  await run('round 6: Elsewhere on the map (Commerce)', '#arm/node=comm', seen, 1440, 900);
  await run('round 6: a hint on the Arm (a gold door)', '#arm', { ...first, 'isx-hints': 'arm-pick' }, 1440, 900, async p => { await p.evaluate(() => ISX.setArmSel('COMM')); await hint('arm-door')(p); });
  await run('round 6, phone: a hint on the Arm (the toggle)', '#arm', first, 390, 844, hint('arm-view'));
  /* clarity build (17 Nov 2026): the question card with its numbers (chart, table, tiles, bars, sources), “New here”, an episode as a fold
     and as a run with its way back, the picker with acts and episodes, the key on demand, the map at rest in grey; phone and 1280 × 760 */
  const cl = b2 => ({ ...seen, 'isx-way': 'ground', 'isx-sim-mode': 'story', '__pos': JSON.stringify({ l: 0, b: b2 }) });
  await run('clarity: a step with its numbers above the card (a chart)', '#simulator', cl(21), 1440, 900, async p => { await p.waitForTimeout(500); });
  await run('clarity: the chart as a table', '#simulator', cl(21), 1440, 900, async p => { await p.waitForTimeout(500); await p.click('#isx-cl-nums [data-cl-tbl]'); await p.waitForTimeout(250); });
  await run('clarity: tiles, sources open', '#simulator', cl(9), 1440, 900, async p => { await p.click('#isx-cl-nums [data-cl-src]'); await p.waitForTimeout(250); });
  await run('clarity: bars, “New here”, an episode folded open', '#simulator', cl(14), 1440, 900, async p => { await p.evaluate(() => document.querySelector('#isx-sn-body details.cl-epi summary').click()); await p.waitForTimeout(300); });
  await run('clarity: an episode step with the way back', '#simulator', cl(27), 1440, 900, async p => { await p.click('#isx-sn-body .cl-ep'); await p.waitForTimeout(500); });
  await run('clarity: the picker (acts and episodes)', '#simulator', cl(27), 1440, 900, async p => { await p.click('#isx-sn-pickb'); await p.waitForTimeout(300); });
  await run('clarity: the key, open (full view)', '#simulator', fullv, 1440, 900, async p => { await p.click('[data-cl-key]'); await p.waitForTimeout(300); });
  await run('clarity: the full view at rest, lines in grey', '#simulator', fullv, 1280, 760);
  await run('clarity, phone: a step with its numbers in the card', '#simulator', cl(12), 390, 844);
  await run('clarity: 1280 × 760, tiles above the card', '#simulator', cl(9), 1280, 760);
  /* call screen round (18 Nov 2026): the calls as whole-window screens: each step of the first call, a force open, an option chosen,
     the calendar's line, an episode's call, 1024 and a short window, and phones */
  const dc = (l, b2, dp) => ({ ...seen, 'isx-way': 'guide', 'isx-sim-mode': 'story', '__pos': JSON.stringify({ l, b: b2, ph: 'ask', dp }) });
  await run('call: the first call, the problem', '#simulator', dc(0, 9, 0), 1440, 900);
  await run('call: the first call, what you weigh (bills and bonds)', '#simulator', dc(0, 9, 1), 1440, 900);
  await run('call: the first call, a force open', '#simulator', dc(0, 9, 1), 1440, 900, async p => { await p.click('#isx-sn-body .dc-var[data-dcv="3"]'); await p.waitForTimeout(300); });
  await run('call: the first call itself', '#simulator', dc(0, 9, 2), 1440, 900);
  await run('call: an option chosen, “Make this call”, the calendar’s line', '#simulator', dc(0, 14, 2), 1280, 720, async p => { await p.click('#isx-sn-body .dc-opt[data-dco="real"]'); await p.focus('#isx-sn-body .dc-sup [data-remind]'); await p.waitForTimeout(250); });
  await run('call: an episode’s call (oil), what you weigh', '#simulator', dc(14, 0, 1), 1280, 720, async p => { await p.click('#isx-sn-body .dc-var[data-dcv="0"]'); await p.waitForTimeout(300); });
  await run('call: 1024 × 768, the yen call', '#simulator', dc(18, 0, 2), 1024, 768);
  await run('call, phone: the first call itself, an option chosen', '#simulator', dc(0, 9, 2), 390, 844, async p => { await p.click('#isx-sn-body .dc-opt'); await p.waitForTimeout(300); });
  await run('call, phone: the problem', '#simulator', dc(0, 19, 0), 390, 844);
  await run('call: the entry with “Show hints again”', '#simulator', { ...seen, 'isx-sim-mode': 'story', 'isx-hints-off': '1', '__pos': JSON.stringify({ l: 0, b: -1 }) }, 1440, 900);
  /* profit tab build 1: the profit dollar's stations, views, a table, the text under the board, a hint, and the ring's four doors */
  const pf = (i, v, t) => async p => { await p.waitForFunction(() => ISX.profit && ISX.profit.state.ready, null, { timeout: 30000 }); await p.evaluate(([i, v, t]) => { ISX.profit.go(i, v); if (t) document.getElementById('isx-pf-table').click(); }, [i, v, t]); await p.waitForTimeout(350); };
  for (const [i, v] of [[0, 'pic'], [0, 'nat'], [0, 'own'], [0, 'roc'], [1, 'hold'], [1, 'flow'], [1, 'list'], [1, 'home'], [1, 'pay'], [2, 'all'], [2, 'sum'], [2, 'pos'], [2, 'ord'], [3, 'wt'], [3, 'capex'], [3, 'ni'], [3, 'why']])
    await run('profit: view ' + v, '#profit', seen, 1440, 900, pf(i, v));
  await run('profit: the ideal types as a table', '#profit', seen, 1440, 900, pf(2, 'ord', true));
  await run('profit: the equation as a table', '#profit', seen, 1280, 760, pf(2, 'all', true));
  await run('profit: the text under the board', '#profit/regime', seen, 1440, 900, async p => { await pf(2, 'all')(p); await p.click('[data-pf="read"]'); await p.waitForTimeout(500); });
  await run('profit: 1024 wide', '#profit/claims', seen, 1024, 768, pf(1, 'list'));
  await run('profit, phone: station 3', '#profit/regime', seen, 390, 844, pf(2, 'all'));
  await run('profit, phone: two orders', '#profit/regime/ord', seen, 390, 844, pf(2, 'ord'));
  await run('profit, phone: station 4, its doors', '#profit/ai', seen, 390, 844, async p => { await pf(3, 'wt')(p); await p.evaluate(() => document.querySelector('#isx-pf-text .pf-side').scrollIntoView()); await p.waitForTimeout(300); });
  await run('profit: a hint (the tiles)', '#profit/regime', { ...first, 'isx-hints': 'pf-table' }, 1440, 900, async p => { await p.waitForFunction(() => ISX.hints && ISX.hints.on === 'pf-tile', null, { timeout: 15000 }); });
  await run('profit: the ring with four doors', '#circuit/ring', seen, 1440, 900);
  await run('profit, phone: the ring with four doors', '#circuit/ring', seen, 390, 844);
  await run('profit: a link from the primer', '#simulator', { ...seen, __pos: JSON.stringify({ l: 13, b: 9 }) }, 1440, 900, async p => { await p.evaluate(() => { const d = document.querySelector('#isx-cock details.s2deep'); if (d) d.open = true; }); await p.waitForTimeout(300); });
  await b.close();
  console.log(total ? total + ' violation type(s) in all' : 'no violations');
  process.exit(total ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
