/* Stage 3 behaviour checks: the control strip, the Circuit's air and map modes, the Simulator's first principles,
   ladder and sectors, the backstop's order, Scenarios on the stage, the ownership web, and the no-scroll sizes.
   Usage: node tools/stage3-check.js [baseUrl]   — needs `python3 -m http.server 8731` at the repo root. Exits 1 on a failed check. */
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8731/imperial-stack/';
let fails = 0;
const ok = (name, cond, extra) => { if (!cond) fails++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 300) : '')); };
(async () => {
  const b = await chromium.launch();
  const page = async (hash, ls = {}, opts = {}) => {
    const c = await b.newContext({ viewport: { width: opts.w || 1440, height: opts.h || 900 }, deviceScaleFactor: 1, reducedMotion: opts.reduce === false ? 'no-preference' : 'reduce', hasTouch: !!opts.touch, isMobile: !!opts.touch });
    const set = Object.assign({ 'isx-tips-globe': 'off', 'isx-tips-sim': 'off', 'isx-stack': 'open', 'isx-first': 'off', 'isx-insights': 'off', 'isx-tour': 'off' }, ls);
    await c.addInitScript(o => { try { if (!sessionStorage.getItem('__seeded')) { Object.keys(o).forEach(k => { if (o[k] === null) localStorage.removeItem(k); else localStorage.setItem(k, o[k]); }); sessionStorage.setItem('__seeded', '1'); } } catch (e) {} }, set);
    const p = await c.newPage(); p._errs = []; p.on('pageerror', e => p._errs.push(String(e).slice(0, 200)));
    await p.goto(base + hash, { waitUntil: 'load' });
    await p.waitForFunction(() => window.ISX && ISX.booted, null, { timeout: 60000 });
    await p.waitForTimeout(opts.wait || 1500);
    return p;
  };
  const sent = t => t.split(/[.!?]\s+(?=[A-Z“‘$])/).length;

  /* ---------- 1. the strip and the Circuit ---------- */
  let p = await page('#circuit');
  ok('strip: one bar holds the tabs and the Circuit’s pills', await p.evaluate(() => { const s = document.getElementById('isx-strip'); return !!s && s.querySelectorAll('.seg button').length === 5 && !!s.querySelector('#isx-tp-firms') && !!s.querySelector('#isx-tp-layers') && s.getBoundingClientRect().height <= 50; }));
  ok('strip: the marker sits under the open tab', await p.evaluate(() => { const i = document.querySelector('.st-ind').getBoundingClientRect(), t = document.getElementById('isx-v-map').getBoundingClientRect(); return Math.abs(i.left - t.left) < 2 && Math.abs(i.width - t.width) < 2; }));
  await p.click('#isx-v-arm'); await p.waitForTimeout(500);
  ok('strip: it follows a tab change, and the Arm’s switch is in the bar', await p.evaluate(() => { const i = document.querySelector('.st-ind').getBoundingClientRect(), t = document.getElementById('isx-v-arm').getBoundingClientRect(), m = document.getElementById('isx-mswitch'); return Math.abs(i.left - t.left) < 2 && !!m.closest('#isx-strip') && !m.hidden && document.getElementById('isx-strip').dataset.v === 'arm'; }));
  await p.click('#isx-v-fin'); await p.waitForTimeout(700);
  ok('strip: the Simulator’s two views are in the bar and switch', await p.evaluate(() => { const f = document.getElementById('isx-st-fin'); return !f.hidden && f.querySelector('[data-stfin="plumb"]').getAttribute('aria-pressed') === 'true'; }));
  await p.click('#isx-st-fin [data-stfin="stack"]'); await p.waitForTimeout(600);
  ok('strip: The capital stack opens from the bar', await p.evaluate(() => ISX.finMode === 'stack' && !!document.getElementById('isx-tower') && document.querySelector('#isx-st-fin [data-stfin="stack"]').getAttribute('aria-pressed') === 'true'));
  await p.click('#isx-st-fin [data-stfin="plumb"]'); await p.waitForTimeout(600);
  await p.click('#isx-v-map'); await p.waitForTimeout(700);
  ok('circuit: WAICO is on at first view, and the legend on the stage names both blocs', await p.evaluate(() => document.getElementById('isx-waico').getAttribute('aria-checked') === 'true' && /WAICO/.test(document.getElementById('isx-leg6').textContent) && /Pax Silica/.test(document.getElementById('isx-leg6').textContent)));
  ok('circuit: readings on the left edge, legend and zoom on the right edge, the middle free', await p.evaluate(() => {
    const fr = document.getElementById('isx-frame').getBoundingClientRect(), r = document.getElementById('isx-resbar').getBoundingClientRect(), e = document.getElementById('isx-edge').getBoundingClientRect();
    const mid = document.elementsFromPoint(fr.left + fr.width * .6, fr.top + fr.height * .45).some(x => x.closest && x.closest('.resbar, .edge3, .cmd6, .tray2'));
    return r.right < fr.left + fr.width * .4 && e.left > fr.left + fr.width * .7 && Math.abs(fr.right - e.right - 18) < 4 && !mid && document.querySelectorAll('#isx-resbar .res').length === 6;
  }));
  await p.click('#isx-tp-layers'); await p.waitForTimeout(250);
  await p.evaluate(() => document.querySelectorAll('#isx-tray-layers .mm')[2].click()); await p.waitForTimeout(300);
  ok('map mode: hardware exports has two measures and says how many economies have a figure', await p.evaluate(() => { const m = document.getElementById('isx-mapmodes'); return m.querySelectorAll('.mmsub3 button').length === 2 && /16 economies have a figure/.test(m.textContent) && /not zero/.test(m.textContent); }));
  await p.evaluate(() => document.querySelector('#isx-mapmodes [data-aim="abs"]').click()); await p.waitForTimeout(300);
  ok('map mode: the dollar measure switches the scale; the legend names the neutral state', await p.evaluate(() => /\$470bn/.test(document.getElementById('isx-mapmodes').textContent) && /No figure collected/.test(document.getElementById('isx-leg6').textContent)));
  await p.evaluate(() => document.querySelectorAll('#isx-tray-layers .mm')[0].click()); await p.keyboard.press('Escape');
  ok('no page errors (strip, circuit)', p._errs.length === 0, p._errs); await p.context().close();

  /* ---------- 2. the Simulator: first principles, ladder, sectors, backstop ---------- */
  p = await page('#simulator', { 'isx-sim-mode': 'story' });
  ok('guide: the opening offers first principles and the plumbing (tiers build A: the guide door, beside the full map)', await p.evaluate(() => { const b = document.getElementById('isx-sn-body'); return /First principles/.test(b.querySelector('[data-way="guide"]').textContent) && !!b.querySelector('[data-way="map"]') && /52 steps/.test(b.textContent); }));
  await p.click('#isx-sn-body [data-way="guide"]'); await p.waitForTimeout(350);
  let n = 0, worst = 0, deepOk = true, kinds = [];
  for (let i = 0; i < 20; i++) {
    const r = await p.evaluate(() => ({ s: (document.querySelector('#isx-sn-body .s2p') || {}).textContent || '', deep: document.querySelectorAll('#isx-sn-body .s2deep .s2d > p').length, cnt: document.querySelector('.sn-cnt').textContent.replace(/\s+/g, ''), k: document.querySelector('#isx-sn-body .s2k').textContent, lit: document.querySelectorAll('#isx-rmap .fn:not(.gh)').length }));
    n++; worst = Math.max(worst, sent(r.s)); if (r.deep < 1 || r.lit < 2) deepOk = false; kinds.push((/^(Identity|Mechanism|History|Consequence|Amplifier)/.exec(r.k.trim()) || [''])[0]);
    if (/^(\d+)\/\1$/.test(r.cnt)) break;
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(150);
  }
  ok('first principles: eight reveals (tiers build B: R4 and R6 split, R7 removed), each at most two sentences, with depth and actors lit', n === 8 && worst <= 2 && deepOk, { n, worst, deepOk });
  ok('first principles: identity first, then mechanism, the accounting of the US side, history, consequence', kinds.join(' ') === 'Identity Mechanism Mechanism Identity Mechanism History Consequence Consequence', kinds);
  /* B1: first principles is the first segment of the guide's one route */
  ok('first principles: the first segment of the route, eight marks, the one in hand', await p.evaluate(() => { const s = document.querySelectorAll('#isx-s2bar .rt-s')[0]; return s.querySelectorAll('.rt-m').length === 8 && s.classList.contains('cur') && /First principles/i.test(s.textContent) && /Guide/.test(document.getElementById('isx-sn-pickb').textContent); }));
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(350);
  ok('first principles: the close hands over to the guide', await p.evaluate(() => /Now the plumbing/.test(document.getElementById('isx-sn-body').textContent) && !!document.querySelector('#isx-sn-body .sn-go[data-sl="0"][data-sb="0"]')));
  await p.click('#isx-sn-body .sn-go'); await p.waitForTimeout(350);
  ok('guide: it starts at step 1 of 52', await p.evaluate(() => /^01\/52$/.test(document.querySelector('.sn-cnt').textContent.replace(/\s+/g, '')) && /A lab needs compute/i.test(document.querySelector('#isx-sn-body h3').textContent)));
  /* the backstop chapter: window, swaps, yen, pledges, with a historical lead-in */
  await p.evaluate(() => document.querySelectorAll('#isx-s2bar .rt-s')[7].querySelector('.rt-sl').click()); await p.waitForTimeout(350);
  const bk = [];
  /* B1-4: the yen decision is its own card between “Swaps for friends” and the joint action; the walk takes what happened */
  for (let i = 0; i < 5; i++) { bk.push(await p.evaluate(() => ({ h: document.querySelector('#isx-sn-body h3').textContent, why: (document.querySelector('#isx-sn-body .s2why') || {}).textContent || '', s: document.querySelector('#isx-sn-body .s2p').textContent, fork: /your call/i.test(document.querySelector('#isx-s2bar .rt-nx').textContent) }))); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(250); if (await p.evaluate(() => !!document.querySelector('#isx-sn-body .dopts'))) { await p.click('#isx-sn-body [data-fk="real"]'); await p.waitForTimeout(250); } }
  ok('backstop: the Fed’s window, swaps, Tokyo’s trilemma, the yen, then the pledges', /repo window/i.test(bk[0].h) && /Swaps/i.test(bk[1].h) && /trilemma/i.test(bk[2].h) && /yen/i.test(bk[3].h) && /Tariffs/i.test(bk[4].h), bk.map(x => x.h));
  ok('backstop: opens with a historical lead-in, still two sentences on the card', /1970s/.test(bk[0].why) && sent(bk[0].why) + sent(bk[0].s) <= 2 && bk[2].fork, { why: bk[0].why.slice(0, 60), s: sent(bk[0].s), fork: bk[2].fork });
  await p.click('#isx-sn-pickb'); await p.waitForTimeout(200);
  ok('picker: the basics and first principles first, then the guide, then mechanisms on three rungs', await p.evaluate(() => { const k = document.getElementById('isx-sn-pick'), f = k.querySelectorAll('.pk-l'); return /The basics/.test(f[0].textContent) && /First principles/.test(f[1].textContent) && k.querySelectorAll('.pk-t').length === 3 && k.querySelectorAll('.pk-t .pk-l').length === 11; }));
  await p.keyboard.press('Escape');
  /* B1-3: the ladder's three rungs became the role ledger's four roles */
  await p.evaluate(() => document.getElementById('isx-b1ind').click()); await p.waitForTimeout(250);
  ok('ledger (guide): four roles, 24 rows; the source layer waits for the guide; the dated link is in by the backstop', await p.evaluate(() => { const l = document.getElementById('isx-b1led'); return !l.hidden && l.querySelectorAll('.lcol').length === 4 && l.querySelectorAll('.lr.ind').length === 24 && !l.querySelector('.lsrc3') && !!l.querySelector('.lwait') && /16 September/.test(l.querySelector('.lfoot').textContent); })); /* tiers A: the backstop is step 43 now, past the step that dates the link */
  ok('no page errors (guide)', p._errs.length === 0, p._errs); await p.context().close();

  p = await page('#simulator', { 'isx-sim-mode': 'full' });
  await p.evaluate(() => document.getElementById('isx-b1ind').click()); await p.waitForTimeout(300);
  const lad = await p.evaluate(() => { const l = document.getElementById('isx-b1led'); return { rows: [...l.querySelectorAll('.lr.ind')].filter(e => e.getClientRects().length > 0).length, per: [...l.querySelectorAll('.lcol')].map(h => h.querySelectorAll('.lr.ind').length), slots: l.querySelectorAll('.lr.slot').length, haircuts: [...l.querySelectorAll('.lcol[data-role="stress"] .lr.slot')].some(x => /Basis-trade haircuts/.test(x.textContent) && /not yet measured/.test(x.textContent)), figs: l.querySelectorAll('.lr.fig').length, src: !!l.querySelector('.lsrcd .lsrc3'), link: /Settings move the conduits/.test(l.querySelector('.lfoot').textContent) && /16 September 2026/.test(l.querySelector('.lfoot').textContent), sectors: l.querySelectorAll('.secb3').length, fit: l.scrollHeight <= l.clientHeight + 1, inside: l.getBoundingClientRect().bottom <= innerHeight }; });
  ok('ledger: all 24 indicators in four roles (3 settings, 8 conduits, 3 stress gauges, 10 outcomes), empty slots for what is not measured', lad.rows === 24 && lad.per.join() === '3,8,3,10' && lad.slots === 6 && !lad.haircuts && lad.figs === 8, lad);
  ok('ledger: the source layer, five sectors and the link between the roles are still there (one click away)', lad.src && lad.link && lad.sectors === 5, lad);
  ok('ledger: fits the window at 1440×900 without scrolling', lad.fit && lad.inside, lad);
  await p.evaluate(() => document.querySelector('#isx-b1led .lr.fig [data-slv="3"]').click()); await p.waitForTimeout(300);
  ok('ledger: a figure from a lever opens that lever', await p.evaluate(() => /Free up the big banks/i.test((document.getElementById('isx-rside') || {}).textContent || '')));
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  ok('map: actors are plates with a name only; prices and rates are gauge nodes; the other indicators hang as tags', await p.evaluate(() => { const pl = [...document.querySelectorAll('#isx-rmap .fn.pl')], S = ISX.sim; return pl.length === 29 && pl.every(g => g.textContent.trim() === g.querySelector('.fnt').textContent.trim() && !g.querySelector('.fns')) && document.querySelectorAll('#isx-rmap .fn.gn').length === 8 && document.querySelectorAll('#isx-rmap .gt').length === 15 && S.gauges.join() === 'Y10,MOV,YEN,OIL,MTG,INF,FUEL,SVR'; }));
  ok('sectors: five zones carry a lock and are buttons', await p.evaluate(() => document.querySelectorAll('#isx-rmap .fzk[role="button"]').length === 5));
  await p.evaluate(() => document.querySelector('#isx-rmap .fzk[data-sec="gov"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(250);
  ok('sectors: a sector opens a locked “Coming soon” card', await p.evaluate(() => { const c = document.getElementById('isx-sec3'); return !!c && /Coming soon/i.test(c.textContent) && /Government/.test(c.querySelector('h3').textContent) && c.querySelectorAll('.s5 button').length === 5; }));
  await p.click('#isx-sec3 .s5 button[data-sec="row"]'); await p.waitForTimeout(200);
  ok('sectors: the card moves between the five', await p.evaluate(() => /Rest of the world/.test(document.querySelector('#isx-sec3 h3').textContent)));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok('sectors: Esc closes the card', await p.evaluate(() => !document.getElementById('isx-sec3')));
  ok('parity: 37 nodes (29 actors, 8 gauge nodes), 75 relations, 17 levers, 11 plays, 24 indicators', await p.evaluate(() => document.querySelectorAll('#isx-rmap .fn').length === 37 && document.querySelectorAll('#isx-rmap .fe').length === 75 && document.querySelectorAll('#isx-cock .lv').length === 17 && document.querySelectorAll('#isx-cock .pchip').length === 11 && ISX.sim.indicators.length === 24));
  ok('no page errors (full view)', p._errs.length === 0, p._errs); await p.context().close();

  /* ---------- 3. Scenarios ---------- */
  /* B3 (15 Nov 2026): Scenarios in three depths. The stepped card of stage 3 is now the scene's card; the picker, the chain
     strip under the map, “Layers used” and “Read more” are retired (their selectors are gone from this check). The gallery,
     the scene and its depth are checked in full by tools/b3-check.js; here: the stage still fits the window, the sentence
     still links to the Simulator, a case is still walked with ← →, closes with what you can now see, and is remembered. */
  p = await page('#scenarios');
  ok('scenarios: one stage no longer than the window; the gallery with the sentence, the case and the rail of fourteen', await p.evaluate(() => { const f = document.getElementById('isx-frame').getBoundingClientRect(), l = document.getElementById('isx-sc-lede'); return f.height <= innerHeight && /exercise of power/.test(l.textContent) && /financial flows/.test(l.textContent) && l.getClientRects().length > 0 && document.querySelector('#isx-b3-gal .b3hero h2').textContent === 'Ukraine' && document.querySelectorAll('#isx-b3-gal .b3chip').length === 14 && document.getElementById('isx-sc-bar').hidden; }));
  ok('gallery: fourteen cases in five groups, each with its own map, name and years', await p.evaluate(() => { const g = document.getElementById('isx-b3-gal'); return g.querySelectorAll('.b3gl').length === 5 && [...g.querySelectorAll('.b3chip')].every(c => c.querySelector('svg path') && c.querySelector('.b3ct b').textContent.length > 2 && /\d{4}/.test(c.querySelector('.b3ct small').textContent)); }));
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(400);
  ok('gallery: → shows the next case', await p.evaluate(() => /Maven/i.test(document.querySelector('#isx-b3-gal .b3hero h2').textContent) && ISX.sc.step === -1));
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(400);
  await p.click('#isx-b3-gal .b3cta'); await p.waitForTimeout(300); await p.keyboard.press('Shift'); await p.waitForTimeout(600);   /* any key ends the entry */
  ok('scenarios: the case plays on its map beside the card, not under it', await p.evaluate(() => { const c = document.getElementById('isx-b3-card').getBoundingClientRect(), n = [...document.querySelectorAll('#isx-b3-world .nd.on .bd')].map(e => e.getBoundingClientRect()); return ISX.scenes.mode === 'scene' && n.length >= 1 && n.every(r => r.left >= c.right); }));
  let steps = 0, sw = 0, more = true;
  for (let i = 0; i < 12; i++) {
    const r = await p.evaluate(() => { const c = document.querySelector('#isx-b3-card .b3cap'); return c ? { s: c.textContent, more: !!document.querySelector('#isx-b3-card .b3more') } : null; });
    if (!r) break; steps++; sw = Math.max(sw, r.s.split(/[.!?]\s+(?=[A-Z“‘$])/).length); more = more && r.more;
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(250);
  }
  ok('scenarios: ← → step through the eight steps; two sentences at most on the card, the full text and source one click away', steps === 8 && sw <= 2 && more, { steps, sw, more });
  ok('scenarios: the case closes with what you can now see, and is remembered', await p.evaluate(() => { const e = document.querySelector('#isx-b3-card .b3see'); return !!e && /What you can now see/i.test(document.getElementById('isx-b3-card').textContent) && /layers/.test(e.textContent) && /switches/.test(e.textContent) && JSON.parse(localStorage.getItem('isx-scen-seen')).length === 1; }));
  await p.click('#isx-b3-card [data-b3="nextcase"]'); await p.waitForTimeout(500);
  ok('scenarios: “Next” opens the next case in the gallery, and the case just followed carries its mark', await p.evaluate(() => /Maven/i.test(document.querySelector('#isx-b3-gal .b3hero h2').textContent) && ISX.sc.step === -1 && ISX.scenes.mode === 'gallery' && document.querySelectorAll('#isx-b3-gal .b3chip.seen').length === 1));
  await p.click('#isx-sc-tofin'); await p.waitForTimeout(600);
  ok('scenarios: the sentence links to the Simulator', await p.evaluate(() => ISX.view === 'fin'));
  ok('no page errors (scenarios)', p._errs.length === 0, p._errs); await p.context().close();

  /* ---------- 4. the ownership web ---------- */
  p = await page('#circuit');
  await p.waitForFunction(() => ISX.own && ISX.own.data, null, { timeout: 30000 });
  await p.click('#isx-tp-firms'); await p.waitForTimeout(250);
  await p.click('#isx-tray-firms .t2web'); await p.waitForTimeout(700);
  const web = await p.evaluate(() => { const w = document.getElementById('isx-web3'); return { open: !!w && !w.hidden, firms: w.querySelectorAll('.wnode.firm').length, un: w.querySelectorAll('.wnode.firm.un').length, holders: w.querySelectorAll('.wnode.holder').length, links: w.querySelectorAll('.wk.own').length, sites: w.querySelectorAll('.wk.site').length, sheets: w.querySelectorAll('.wsr').length, rows: /0 rows/.test(w.querySelector('.wsh').textContent) }; });
  const want = await p.evaluate(() => { const d = ISX.own.data; let l = 0; Object.values(d.firms).forEach(f => { l += (f.holders || []).length; }); return l; });
  ok('web: 17 mapped firms and 3 not yet mapped on the ring, every stake drawn', web.open && web.firms === 20 && web.un === 3 && web.links === want && web.sites > 20, { web, want });
  ok('web: three empty data sheets are listed', web.sheets === 3 && web.rows, web);
  await p.evaluate(() => document.querySelector('#isx-web3 .wnode[data-id="f:ASML"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(250);
  ok('web: a firm opens the focused card with owners and sites', await p.evaluate(() => { const c = document.querySelector('#isx-web3 .wcard'); return /ASML/.test(c.querySelector('h3').textContent) && /BlackRock/.test(c.textContent) && /Operates in/i.test(c.textContent) && !!c.querySelector('.wgo'); }));
  await p.click('#isx-web3 .wgo'); await p.waitForTimeout(700);
  ok('web: “Open its footprint” closes the web and selects the firm on the globe', await p.evaluate(() => document.getElementById('isx-web3').hidden && ISX.sel.firm && ISX.sel.firm.name === 'ASML'));
  ok('no page errors (web)', p._errs.length === 0, p._errs); await p.context().close();

  /* ---------- 5. sizes: nothing runs off the frame; the main stage fits the window ---------- */
  for (const [w, h] of [[1280, 760], [1366, 768], [1920, 1080], [1024, 760]]) {
    p = await page('#circuit', { 'isx-sim-mode': 'full' }, { w, h });
    const r = [];
    for (const v of ['map', 'fin', 'story']) {
      await p.evaluate(k => ISX.setView(k), v); await p.waitForTimeout(450);
      r.push(await p.evaluate(() => { const f = document.getElementById('isx-frame').getBoundingClientRect(), s = document.getElementById('isx-strip').getBoundingClientRect(); return { fit: f.height <= innerHeight, strip: s.right <= f.right + 1 && s.left >= f.left - 1, ox: document.documentElement.scrollWidth <= innerWidth }; }));
    }
    ok(`size ${w}×${h}: Circuit, Simulator and Scenarios fit the window; the strip stays inside the frame`, r.every(x => x.fit && x.strip && x.ox), r);
    await p.context().close();
  }
  p = await page('#scenarios', {}, { w: 390, h: 844, touch: true });
  ok('phone: the Scenarios gallery without sideways scroll, its buttons large enough to tap', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelector('#isx-b3-gal .b3cta').getBoundingClientRect().height >= 44 && [...document.querySelectorAll('#isx-b3-gal .b3nb')].every(b => b.getBoundingClientRect().height >= 40)));
  await p.tap('#isx-b3-gal .b3cta'); await p.waitForTimeout(300); await p.keyboard.press('Shift'); await p.waitForTimeout(700);
  ok('phone: in a case the strip sits at the foot of the stage, inside the screen, with Back and Next', await p.evaluate(() => { const b = document.querySelector('#isx-sc-bar .rt').getBoundingClientRect(); return document.documentElement.scrollWidth <= innerWidth + 1 && b.bottom <= innerHeight + 1 && b.left >= 0 && b.right <= innerWidth && document.querySelectorAll('#isx-sc-bar .rt-bk, #isx-sc-bar .rt-nx').length === 2; }));
  await p.evaluate(() => ISX.setView('map')); await p.waitForTimeout(500);
  ok('phone: the tab row fits', await p.evaluate(() => { const s = document.querySelector('#isx-strip .seg').getBoundingClientRect(); return s.right <= innerWidth + 1 && document.documentElement.scrollWidth <= innerWidth + 1; }));
  ok('no page errors (phone)', p._errs.length === 0, p._errs); await p.context().close();

  await b.close();
  console.log(fails ? `\n${fails} check(s) failed` : '\nall stage 3 checks pass');
  process.exit(fails ? 1 : 0);
})();
