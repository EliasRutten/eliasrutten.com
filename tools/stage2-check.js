/* Stage 2 behaviour checks: the Circuit's trays and legend, the first-visit tour, and the Simulator on the stage grammar.
   Usage: node tools/stage2-check.js [baseUrl]   — needs `python3 -m http.server 8731` at the repo root. Exits 1 on a failed check. */
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8731/imperial-stack/';
let fails = 0;
const ok = (name, cond, extra) => { if (!cond) fails++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 260) : '')); };
(async () => {
  const b = await chromium.launch();
  const page = async (hash, ls = {}, opts = {}) => {
    const c = await b.newContext({ viewport: { width: opts.w || 1440, height: opts.h || 900 }, deviceScaleFactor: 1, reducedMotion: opts.reduce === false ? 'no-preference' : 'reduce', hasTouch: !!opts.touch, isMobile: !!opts.touch });
    const set = Object.assign({ 'isx-tips-globe': 'off', 'isx-tips-sim': 'off', 'isx-first': 'off', 'isx-insights': 'off', 'isx-tour': 'off' }, ls);
    await c.addInitScript(([o, ss]) => { try { if (!sessionStorage.getItem('__seeded')) { Object.keys(o).forEach(k => { if (o[k] === null) localStorage.removeItem(k); else localStorage.setItem(k, o[k]); }); Object.keys(ss).forEach(k => sessionStorage.setItem(k, ss[k])); sessionStorage.setItem('__seeded', '1'); } } catch (e) {} }, [set, opts.ss || {}]);
    const p = await c.newPage(); p._errs = []; p.on('pageerror', e => p._errs.push(String(e).slice(0, 200)));
    await p.goto(base + hash, { waitUntil: 'load' });
    await p.waitForFunction(() => window.ISX && ISX.booted, null, { timeout: 60000 });
    await p.waitForTimeout(opts.wait || 1500);
    return p;
  };
  const vis = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return !!(e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden'); }, sel);

  /* ---------- 1. the Circuit: trays, legend, card ---------- */
  let p = await page('#circuit/04');
  await p.waitForFunction(() => ISX.own && ISX.own.data, null, { timeout: 30000 });
  ok('circuit: two pills in the header, toggles and map modes off the stage', await p.evaluate(() => !!document.querySelector('#isx-tgl #isx-tp-firms') && !!document.querySelector('#isx-tgl #isx-tp-layers') && !!document.querySelector('#isx-tray-layers #isx-mapmodes') && !!document.querySelector('#isx-tray-layers #isx-waico')));
  ok('circuit: trays are closed at first', !(await vis(p, '#isx-tray-firms')) && !(await vis(p, '#isx-tray-layers')));
  await p.click('#isx-tp-firms'); await p.waitForTimeout(250);
  ok('firms tray: opens from the pill and lists every mapped firm', await p.evaluate(() => document.querySelectorAll('#isx-tray-firms .t2f').length === Object.keys(ISX.own.data.firms).length && document.getElementById('isx-tp-firms').getAttribute('aria-expanded') === 'true'), await p.evaluate(() => document.querySelectorAll('#isx-tray-firms .t2f').length));
  await p.click('#isx-tray-firms .t2f[data-firm="Besi"]'); await p.waitForTimeout(500);
  ok('firms tray: one click opens the footprint and closes the tray', await p.evaluate(() => ISX.sel.firm && ISX.sel.firm.name === 'Besi' && document.getElementById('isx-root').classList.contains('own-on') && document.getElementById('isx-tray-firms').hidden));
  ok('firms tray: the pill names the open footprint', await p.evaluate(() => /Besi/.test(document.getElementById('isx-tp-firms').textContent)));
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(400);
  ok('firms tray: stepping on brings the step back', await p.evaluate(() => !ISX.sel.firm && ISX.step === 5));
  await p.click('#isx-tp-layers'); await p.waitForTimeout(250);
  ok('layers tray: map modes, the two toggles, the insights switch and the tour', await p.evaluate(() => { const t = document.getElementById('isx-tray-layers'); return !t.hidden && t.querySelectorAll('.mm').length === 4 && !!t.querySelector('#isx-min') && !!t.querySelector('[data-ins="toggle"]') && !!t.querySelector('[data-tips="globe"]'); }));
  await p.evaluate(() => document.querySelectorAll('#isx-tray-layers .mm')[1].click()); await p.waitForTimeout(250);
  ok('layers tray: a map mode still switches', await p.evaluate(() => document.querySelectorAll('#isx-tray-layers .mm')[1].getAttribute('aria-pressed') === 'true'));
  await p.evaluate(() => document.querySelectorAll('#isx-tray-layers .mm')[0].click());
  await p.click('#isx-waico'); await p.waitForTimeout(200);
  ok('layers tray: the WAICO switch still works (on by default, a click turns it off)', await p.evaluate(() => document.getElementById('isx-waico').getAttribute('aria-checked') === 'false'));
  await p.click('#isx-waico'); await p.waitForTimeout(150);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok('layers tray: Esc closes it and returns focus to the pill', await p.evaluate(() => document.getElementById('isx-tray-layers').hidden && document.activeElement && document.activeElement.id === 'isx-tp-layers'));
  ok('legend: a box of its own on the stage, outside the tray', await p.evaluate(() => { const l = document.querySelector('#isx-legbox #isx-leg6'); return !!l && l.getClientRects().length > 0 && l.querySelectorAll('.lr').length > 0; }));
  await p.click('#isx-legtog'); await p.waitForTimeout(150);
  ok('legend: folds, and the fold is remembered', await p.evaluate(() => document.getElementById('isx-legbox').classList.contains('shut') && localStorage.getItem('isx-leg') === 'shut'));
  await p.click('#isx-legtog');
  ok('card: one progress display only, Back and Next beside each other', await p.evaluate(() => { const pp = document.getElementById('isx-t-pips'), a = document.getElementById('isx-t-prev').getBoundingClientRect(), n = document.getElementById('isx-t-next').getBoundingClientRect(); return getComputedStyle(pp).display === 'none' && Math.abs(a.top - n.top) < 2 && a.width < 70 && n.width > 250; }));
  ok('stage: nothing covers the right half of the globe but the legend and zoom', await p.evaluate(() => { const fr = document.getElementById('isx-frame').getBoundingClientRect(); const els = document.elementsFromPoint(fr.left + fr.width * .78, fr.top + fr.height * .42); return !els.some(e => e.closest && e.closest('.mapmodes, .tray2, .resbar')); }));
  ok('no page errors (circuit)', p._errs.length === 0, p._errs); await p.context().close();

  /* ---------- 2. the tour ---------- */
  p = await page('', { 'isx-tour': null }, { wait: 3600 });
  ok('tour: starts by itself on a first visit', await p.evaluate(() => ISX.tour.on && document.querySelector('#isx-tour.in') && /1 \/ 4/.test(document.querySelector('#isx-tour .tn').textContent)));
  ok('tour: does not take focus and blocks nothing', await p.evaluate(() => !document.getElementById('isx-tour').contains(document.activeElement) && document.getElementById('isx-tour').getAttribute('aria-modal') === 'false'));
  ok('tour: stop 1 marks the card', await p.evaluate(() => document.getElementById('isx-tournarr').classList.contains('tour-on')));
  const seen = [];
  for (let i = 0; i < 3; i++) { seen.push(await p.evaluate(() => document.querySelector('#isx-tour h3').textContent)); await p.click('#isx-tour .tgo'); await p.waitForTimeout(250); }
  seen.push(await p.evaluate(() => document.querySelector('#isx-tour h3').textContent));
  ok('tour: four stops: the loop, the steps, the firms, the controls', seen.length === 4 && new Set(seen).size === 4, seen);
  ok('tour: stop 3 marked the Firms pill, stop 4 the Layers pill', await p.evaluate(() => document.getElementById('isx-tp-layers').classList.contains('tour-on') && !document.getElementById('isx-tp-firms').classList.contains('tour-on')));
  await p.click('#isx-tour .tgo'); await p.waitForTimeout(500);
  ok('tour: the last button starts the loop and ends the tour for good', await p.evaluate(() => ISX.step === 1 && !ISX.tour.on && localStorage.getItem('isx-tour') === 'off' && !document.querySelector('.tour-on')));
  await p.reload({ waitUntil: 'load' }); await p.waitForFunction(() => window.ISX && ISX.booted); await p.waitForTimeout(3600);
  ok('tour: does not come back on the next visit', await p.evaluate(() => !ISX.tour.on));
  await p.click('#isx-tp-layers'); await p.waitForTimeout(200); await p.click('#isx-tray-layers [data-tips="globe"]'); await p.waitForTimeout(400);
  ok('tour: “Take the tour” in Layers brings it back, with focus', await p.evaluate(() => ISX.tour.on && document.getElementById('isx-tray-layers').hidden && document.getElementById('isx-tour').contains(document.activeElement)));
  await p.keyboard.press('Escape'); await p.waitForTimeout(350);
  ok('tour: Esc ends it', await p.evaluate(() => !ISX.tour.on));
  ok('no page errors (tour)', p._errs.length === 0, p._errs); await p.context().close();
  p = await page('#circuit/07', { 'isx-tour': null }, { wait: 3500 });
  ok('tour: not shown on a link to a step', await p.evaluate(() => !ISX.tour.on)); await p.context().close();
  p = await page('', { 'isx-tour': null, 'isx-first': null }, { wait: 1800, reduce: false });
  ok('tour: waits while the first moment shows its line', await p.evaluate(() => !ISX.tour.on && !!document.querySelector('#isx-insight.in.first')));
  await p.waitForFunction(() => ISX.tour.on, null, { timeout: 15000 }).catch(() => {});
  ok('tour: follows the first moment, and the line gives way', await p.evaluate(() => ISX.tour.on && !document.querySelector('#isx-insight.in.first') && localStorage.getItem('isx-first') === 'off'));
  await p.context().close();
  p = await page('', { 'isx-tour': null }, { wait: 300 });
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(3600);
  ok('tour: a reader who has already set off is left alone', await p.evaluate(() => !ISX.tour.on && localStorage.getItem('isx-tour') !== 'off')); await p.context().close();

  /* ---------- 3. the Simulator: guide ---------- */
  p = await page('#simulator', { 'isx-sim-mode': 'story' });
  const geo = await p.evaluate(() => { const c = document.getElementById('isx-cock').getBoundingClientRect(), s = document.getElementById('isx-rmap').getBoundingClientRect(), f = document.getElementById('isx-frame').getBoundingClientRect(); return { cock: [c.width, c.height], svg: [s.width, s.height], frame: [f.width, f.height], vh: innerHeight }; });
  ok('simulator: one full-bleed stage, no longer than the window', Math.abs(geo.svg[0] - geo.cock[0]) < 3 && Math.abs(geo.svg[1] - geo.cock[1]) < 3 && geo.frame[1] <= geo.vh, geo);
  ok('simulator: card, bar and seven chapters; trays closed', await p.evaluate(() => !!document.querySelector('#isx-cock .s2card #isx-sn-body') && document.querySelectorAll('#isx-s2bar .s2ch').length === 7 && document.getElementById('isx-s2tray-lev').hidden && document.getElementById('isx-s2tray-play').hidden));
  ok('simulator: the long lists moved under the stage', await p.evaluate(() => document.querySelectorAll('#isx-finmore details.fd').length === 3 && !document.querySelector('#isx-fin details.fd')));
  await p.click('#isx-sn-body [data-sg="start"]'); await p.waitForTimeout(300);
  let worst = 0, n = 0, deepOk = true;
  for (let i = 0; i < 60; i++) {
    const r = await p.evaluate(() => { const t = (document.querySelector('#isx-sn-body .s2p') || {}).textContent || ''; const s = t.split(/[.!?]\s+(?=[A-Z“‘$])/).length; return { s, deep: !!document.querySelector('#isx-sn-body .s2deep'), cnt: document.querySelector('.sn-cnt').textContent.replace(/\s+/g, '') }; });
    worst = Math.max(worst, r.s); n++; if (!r.deep) deepOk = false;
    if (/^(\d+)\/\1$/.test(r.cnt)) break;
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(120);
  }
  ok('guide: all 37 steps are reachable with →', n === 37, n);
  ok('guide: every reveal is at most two sentences, with the rest behind “Go deeper”', worst <= 2 && deepOk, { worst, deepOk });
  ok('guide: the bar follows the story (last chapter current)', await p.evaluate(() => document.querySelectorAll('#isx-s2bar .s2ch')[6].classList.contains('cur')));
  await p.evaluate(() => document.querySelectorAll('#isx-s2bar .s2ch')[2].click()); await p.waitForTimeout(300);
  ok('guide: a chapter in the bar jumps to its first step', await p.evaluate(() => document.querySelectorAll('#isx-s2bar .s2ch')[2].classList.contains('cur') && /^13\/37$/.test(document.querySelector('.sn-cnt').textContent.replace(/\s+/g, ''))));
  await p.click('#isx-s2bar [data-tray="lev"]'); await p.waitForTimeout(200);
  ok('guide: the Levers tray opens above the bar with the levers reached so far', await p.evaluate(() => { const t = document.getElementById('isx-s2tray-lev'); const shown = [...t.querySelectorAll('.lv')].filter(x => x.getClientRects().length).length; return !t.hidden && shown > 0 && shown < 14 && document.querySelector('#isx-s2bar [data-tray="lev"]').getAttribute('aria-expanded') === 'true'; }));
  await p.evaluate(() => [...document.querySelectorAll('#isx-s2tray-lev .lv')].filter(x => x.getClientRects().length)[0].click()); await p.waitForTimeout(300);
  ok('guide: a lever opens its dossier in the card', await p.evaluate(() => { const d = document.querySelector('#isx-sn-det .dossier'); return !!d && !d.hidden && /Lever pulled/.test(d.textContent) && getComputedStyle(document.getElementById('isx-sn-body')).display === 'none'; }));
  await p.evaluate(() => document.getElementById('isx-cock').focus && document.querySelector('#isx-s2bar [data-tray="lev"]').focus());
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok('guide: Esc closes the tray first', await p.evaluate(() => document.getElementById('isx-s2tray-lev').hidden));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok('guide: then the dossier', await p.evaluate(() => document.querySelector('#isx-rside').hidden && getComputedStyle(document.getElementById('isx-sn-body')).display !== 'none'));
  await p.click('#isx-s2bar [data-tray="read"]'); await p.waitForTimeout(200);
  ok('guide: Readings shows every reading reached so far', await p.evaluate(() => { const c = document.getElementById('isx-cock'); const shown = [...c.querySelectorAll('.tile')].filter(x => x.getClientRects().length).length; return c.classList.contains('rd-open') && shown === c.querySelectorAll('.tile:not(.gh)').length && shown > 0; }));
  await p.click('#isx-s2bar [data-tray="read"]');
  await p.click('#isx-sn-pickb'); await p.waitForTimeout(200);
  ok('guide: the picker lists first principles, the guide and nine mechanisms', await p.evaluate(() => !document.getElementById('isx-s2tray-pick').hidden && document.querySelectorAll('#isx-sn-pick .pk-l').length === 11));
  await p.evaluate(() => document.querySelectorAll('#isx-sn-pick .pk-l')[3].click()); await p.waitForTimeout(300);
  ok('guide: a mechanism opens with its steps in the bar', await p.evaluate(() => document.getElementById('isx-s2tray-pick').hidden && document.querySelectorAll('#isx-s2bar .s2chs.mech .s2ch').length === 4 && /Mechanism/.test(document.querySelector('#isx-sn-body .s2k').textContent)));
  await p.evaluate(() => document.querySelector('#isx-sn-body .sn-q2').click()); await p.waitForTimeout(300);
  await p.click('#isx-sn-body [data-sg="start"]'); await p.waitForTimeout(250);
  ok('guide: a choice at the first key moment', await p.evaluate(() => document.querySelectorAll('#isx-sn-body .sn-opt').length === 2));
  await p.click('#isx-sn-body .sn-opt.alt'); await p.waitForTimeout(300);
  ok('guide: the other outcome is a reveal too, and leads back', await p.evaluate(() => /Other outcome/.test(document.querySelector('#isx-sn-body .s2k').textContent) && document.querySelector('#isx-sn-body .s2p').textContent.split(/[.!?]\s+(?=[A-Z“‘$])/).length <= 2 && /Back to what happened/.test(document.getElementById('isx-sn-nav').textContent)));
  await p.click('#isx-s2fold'); await p.waitForTimeout(250);
  ok('card: folds to its title', await p.evaluate(() => document.getElementById('isx-snarr').classList.contains('folded') && getComputedStyle(document.querySelector('#isx-sn-body .s2p')).display === 'none'));
  ok('no page errors (guide)', p._errs.length === 0, p._errs); await p.context().close();

  /* ---------- 4. the Simulator: full view, parity ---------- */
  p = await page('#simulator', { 'isx-sim-mode': 'full' });
  const par = await p.evaluate(() => { const c = document.getElementById('isx-cock'), v = s => [...c.querySelectorAll(s)].filter(x => x.getClientRects().length && !x.classList.contains('gh')).length; return { actors: v('#isx-rmap .fn'), relations: c.querySelectorAll('#isx-rmap .fe:not(.gh)').length, levers: v('.lv'), plays: v('.pchip'), card: v('.s2card'), bar: v('.s2bar') }; });
  ok('full view: every actor, relation, lever and play is on the stage; no card, no chapter bar', par.actors === 34 && par.relations === 59 && par.levers === 14 && par.plays === 9 && par.card === 0 && par.bar === 0, par);
  await p.click('.s2rdb'); await p.waitForTimeout(200);
  ok('full view: Readings opens all 17', await p.evaluate(() => [...document.querySelectorAll('#isx-cock .tile')].filter(x => x.getClientRects().length).length) === 17);
  await p.click('.s2rdb');
  await p.evaluate(() => document.querySelector('#isx-rmap .fn[data-n="TSY"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(300);
  ok('full view: an actor opens a floating dossier, and its reading shows', await p.evaluate(() => { const d = document.querySelector('#isx-cock > .dossier'); return !!d && !d.hidden && /US Treasury/i.test(d.textContent) && [...document.querySelectorAll('#isx-cock .tile')].some(x => x.getClientRects().length); }));
  await p.evaluate(() => document.querySelector('#isx-cock .dossier .dx').click());
  await p.evaluate(() => document.querySelectorAll('#isx-cock .pchip')[0].click()); await p.waitForTimeout(300);
  ok('full view: a play runs in the dossier', await p.evaluate(() => /Play ·/.test(document.querySelector('#isx-cock > .dossier').textContent) && !!document.getElementById('isx-pn')));
  await p.evaluate(() => document.querySelector('.sn-asstory').click()); await p.waitForTimeout(400);
  ok('full view: “Follow this play in the guide” opens it as a mechanism', await p.evaluate(() => document.getElementById('isx-cock').classList.contains('st') && /Mechanism/.test(document.querySelector('#isx-sn-body .s2k').textContent)));
  await p.evaluate(() => document.querySelector('.smode [data-sm="full"]').click()); await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('.fsw [data-fm="stack"]').click()); await p.waitForTimeout(500);
  ok('the capital stack still opens, with the bottom tabs and the sales list', await p.evaluate(() => !!document.getElementById('isx-tower') && !!document.querySelector('#isx-fin #isx-issue') && document.getElementById('isx-finmore').innerHTML === '' && document.getElementById('isx-tabs').getClientRects().length > 0));
  await p.evaluate(() => document.querySelector('.fsw [data-fm="plumb"]').click()); await p.waitForTimeout(500);
  ok('and back to the plumbing', await p.evaluate(() => !!document.querySelector('#isx-cock.s2') && document.querySelectorAll('#isx-finmore details.fd').length === 3));
  ok('no page errors (full view)', p._errs.length === 0, p._errs); await p.context().close();

  /* ---------- 5. sizes ---------- */
  for (const [w, h, tag] of [[1280, 760, 'laptop'], [900, 700, 'small'], [390, 844, 'phone']]) {
    p = await page('#simulator', { 'isx-sim-mode': 'story' }, { w, h, touch: w < 600, ss: { 'isx-sim-pos': '{"l":0,"b":7}' } });
    const r = await p.evaluate(() => { const c = document.getElementById('isx-snarr').getBoundingClientRect(), bar = document.getElementById('isx-s2bar').getBoundingClientRect(); return { over: Math.max(0, document.documentElement.scrollWidth - innerWidth), cardW: Math.round(c.width), barOver: Math.round(Math.max(0, bar.right - innerWidth)), cardOverBar: innerWidth > 760 ? Math.round(Math.max(0, c.bottom - bar.top)) : 0 }; });
    ok(tag + ' (' + w + '×' + h + '): no sideways scroll, the card clear of the bar', r.over === 0 && r.barOver === 0 && r.cardOverBar === 0 && r.cardW > 250, r);
    await p.context().close();
  }
  p = await page('#circuit/04', {}, { w: 390, h: 844, touch: true });
  await p.click('#isx-tp-firms'); await p.waitForTimeout(250);
  ok('phone: the Firms tray is a sheet inside the screen', await p.evaluate(() => { const r = document.getElementById('isx-tray-firms').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight + 1 && document.documentElement.scrollWidth <= innerWidth; }));
  ok('no page errors (phone)', p._errs.length === 0, p._errs); await p.context().close();

  await b.close();
  console.log(fails ? fails + ' FAILED' : 'all passed');
  process.exit(fails ? 1 : 0);
})();
