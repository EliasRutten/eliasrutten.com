/* Thesis view round (23 Nov 2026): checks on “Just the thesis”, the chain on the machinery's map (claude/specs/thesis-view-23-nov.md).
   Usage: node tools/thesis-check.js [baseUrl]. Needs `python3 -m http.server 8731` at the repo root. Exits 1 on a failed check.
   1 the ways in: the entry screen's button and the header's button open it; the three levels and “Explore on my own” are still there
   2 the data: five to seven complexes of existing actors, no actor in two; every lit line is a relation of the map; every state beat rests on existing crisis cards
   3 the beats: the map dims, complexes light in order (cumulative), only the named lines are lit; the state beats light the six state actors; the end lights it all
   4 the copy: one sentence per complex, per link and per state intervention; SMAIN.thesis word for word at the end; no figures in the new sentences
   5 play: Back and Next (panel, bar, ← →), the marks, a complex alone (chip and actor), replay, Esc, “Back to the full map”, “Take the guide”
   6 it is not a lesson: no trays, no Indicators button, no “More inside” tabs, no dossier, no guide card while it is open; all back after it
   7 phone width, keyboard focus, the live region, reduced motion (same content) */
const { chromium } = require('playwright');
const base = process.argv.slice(2).find(a => /^https?:|^file:/.test(a)) || 'http://127.0.0.1:8731/imperial-stack/';
let pass = 0, fail = 0;
const ok = (c, t, x) => { if (c) pass++; else { fail++; console.log('FAIL  ' + t + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 600) : '')); } };
(async () => {
  const b = await chromium.launch();
  const page = async o => {
    o = o || {};
    const c = await b.newContext({ viewport: { width: o.w || 1280, height: o.h || 800 }, isMobile: !!o.m, hasTouch: !!o.m, reducedMotion: o.motion ? 'no-preference' : 'reduce' });
    await c.addInitScript(ls => { try { if (sessionStorage.getItem('__tc')) return; sessionStorage.setItem('__tc', '1'); localStorage.setItem('isx-first', 'off'); localStorage.setItem('isx-insights', 'off'); localStorage.setItem('isx-intro', 'toured'); localStorage.setItem('isx-hints-off', '1'); Object.entries(ls).forEach(([k, v]) => localStorage.setItem(k, v)); } catch (e) { /* ignore */ } }, o.ls || {});
    const p = await c.newPage(); p._errs = []; p.on('pageerror', e => p._errs.push(String(e.message).slice(0, 200)));
    await p.goto(base + '#simulator', { waitUntil: 'load' }); await p.waitForFunction(() => window.ISX && ISX.booted, null, { timeout: 90000 }); await p.waitForTimeout(o.wait || 900);
    return p;
  };
  const done = async p => { ok(!p._errs.length, 'no page errors', p._errs); await p.context().close(); };
  const st = p => p.evaluate(() => { const q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)], vis = e => !!e && !e.hidden && e.getClientRects().length > 0;
    const C = ISX.chain; return { on: C.on, beat: C.beat, solo: C.solo, mode: ISX.sim.mode, lit: C.lit,
      domE: qa('#isx-rmap .fe.on').map(e => +e.dataset.e).sort((a, b) => a - b), domN: qa('#isx-rmap .fn.lit').map(g => g.dataset.n).sort(), dimN: qa('#isx-rmap .fn.dim').length, allN: qa('#isx-rmap .fn').length,
      panel: vis(q('#isx-tv')), k: q('#isx-tv .tv-k') ? q('#isx-tv .tv-k').textContent : '', t: q('#isx-tv .tv-t') ? q('#isx-tv .tv-t').textContent : '', txt: q('#isx-tv-cur') ? q('#isx-tv-cur').textContent : '',
      trays: qa('#isx-cock .s2tray').filter(vis).length, ind: vis(q('#isx-b1ind')), doors: qa('#isx-rmap .vdoor').filter(vis).length, dossier: vis(q('#isx-rside')), card: vis(q('#isx-snarr')), thx: vis(q('#isx-thx')),
      pressed: q('#isx-tv-b0') ? q('#isx-tv-b0').getAttribute('aria-pressed') : null, live: q('#isx-tv-cur') ? q('#isx-tv-cur').getAttribute('aria-live') : null }; });
  const same = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

  /* ---------- 1 ---------- */
  {
    const p = await page();
    ok(await p.evaluate(() => ISX.enter.on === 'fin'), 'the machinery opens on its entry screen');
    const acts = await p.evaluate(() => [...document.querySelectorAll('#isx-enter .en-acts .en-btn')].map(x => [x.dataset.en, x.textContent]));
    ok(acts.length === 4 && acts[0][0] === 'levels' && acts[1][0] === 'thesis' && /Just the thesis/.test(acts[1][1]) && acts[2][0] === 'free' && acts[3][0] === 'remind', 'the entry screen: the guide’s levels, “Just the thesis”, “Explore on my own”, the reminder', acts);
    await p.evaluate(() => document.querySelector('#isx-enter [data-en="levels"]').click()); await p.waitForTimeout(300);
    ok(await p.evaluate(() => document.querySelectorAll('#isx-enter .en-lv').length === 3), 'the three levels are still there');
    await p.evaluate(() => document.querySelector('#isx-enter [data-en="thesis"]').click()); await p.waitForTimeout(1200);
    let s = await st(p);
    ok(s.on && s.beat === 0 && s.mode === 'full' && s.panel && !s.thx, 'the entry screen’s button opens the thesis view on the full map, at its first beat', s);
    ok(await p.evaluate(() => !document.querySelector('.en-offer')), 'no offer of the tour after it');
    await p.evaluate(() => document.querySelector('#isx-tv [data-tvx]').click()); await p.waitForTimeout(600);
    s = await st(p); ok(!s.on && s.mode === 'full' && !s.panel && s.pressed === 'false', '“Back to the full map” leaves it', s);
    await p.evaluate(() => document.querySelector('#isx-tv-b0').click()); await p.waitForTimeout(600);
    s = await st(p); ok(s.on && s.beat === 0 && s.pressed === 'true', 'the header’s button opens it and shows as pressed', s);
    const hb = await p.evaluate(() => { const b = document.querySelector('#isx-tv-b0'); return { name: b.getAttribute('aria-label'), txt: b.textContent, h: b.getBoundingClientRect().height }; });
    ok(/Just the thesis/.test(hb.txt) && hb.name.indexOf('Just the thesis') === 0, 'its spoken name holds its drawn words', hb);
    await p.evaluate(() => document.querySelector('#isx-tv-b0').click()); await p.waitForTimeout(500);
    ok(!(await st(p)).on, 'the header’s button, pressed again, leaves it');
    await done(p);
  }

  /* ---------- 2, 4 ---------- */
  {
    const p = await page({ ls: { 'isx-enter-fin': '1' } });
    const D = await p.evaluate(() => { const C = ISX.chain, S = ISX.sim; return { C, actors: [...document.querySelectorAll('#isx-rmap .fn')].map(g => g.dataset.n), nrel: S.relations.length, crisis: Object.fromEntries(S.decisions.map(d => [d.k, d.crisis])) }; });
    const C = D.C, allC = C.complexes.flatMap(x => x.n);
    ok(C.complexes.length >= 5 && C.complexes.length <= 7, 'five to seven complexes', C.complexes.length);
    ok(allC.every(n => D.actors.includes(n)) && C.state.every(n => D.actors.includes(n)), 'every actor in a complex is an actor of the map');
    ok(new Set(allC.concat(C.state)).size === allC.length + C.state.length, 'no actor sits in two complexes, or in a complex and the state');
    ok(C.beats.every(B => B.e.concat(B.k).every(i => Number.isInteger(i) && i >= 0 && i < D.nrel)), 'every line a beat lights is a relation of the map');
    const sb = C.beats.filter(B => B.kind === 'state');
    ok(sb.length >= 1 && sb.every(B => B.dec.length && B.dec.every(k => D.crisis[k])), 'every state beat rests on existing crisis cards', sb.map(B => B.dec));
    ok(new Set(sb.flatMap(B => B.dec)).size === Object.keys(D.crisis).length, 'all seven calls’ crisis cards are used, each once', sb.flatMap(B => B.dec));
    ok(C.beats[C.beats.length - 1].kind === 'end' && C.beats.filter(B => B.kind === 'end').length === 1, 'it ends on the thesis');
    /* walk every beat: lighting and copy */
    await p.evaluate(() => ISX.simChain()); await p.waitForTimeout(500);
    const rel = await p.evaluate(() => ISX.sim.relations), texts = [];
    let chainE = [], chainN = [];
    for (let i = 0; i < C.n; i++) {
      if (i) { await p.evaluate(() => document.querySelector('#isx-tv [data-tvn="1"]').click()); await p.waitForTimeout(250); }
      const s = await st(p), B = C.beats[i]; texts.push(s.txt);
      ok(s.beat === i && same(s.domE, s.lit.e), `beat ${i + 1}: the lines drawn lit are the beat’s lines`, [s.domE, s.lit.e]);
      const ends = new Set(s.lit.e.flatMap(e => rel[e]));
      ok(same(s.domN, new Set([...s.lit.n, ...ends])), `beat ${i + 1}: the actors lit are the beat’s actors and the ends of its lines`, s.domN);
      ok(s.dimN > 0 && s.dimN + s.domN.length === s.allN, `beat ${i + 1}: the rest of the map is dimmed`, [s.dimN, s.domN.length, s.allN]);
      if (B.kind === 'chain') {
        chainE = chainE.concat(B.e); const cx = C.complexes.find(x => x.t === B.t); if (cx) chainN = chainN.concat(cx.n);
        ok(same(s.lit.e, new Set(chainE)) && chainN.every(n => s.domN.includes(n)), `beat ${i + 1}: the chain so far is lit, and only its main lines`, s.lit.e);
        ok(s.t === B.t && /The chain · \d of \d/.test(s.k), `beat ${i + 1}: the panel names “${B.t}”`, [s.k, s.t]);
      } else if (B.kind === 'state') {
        ok(C.state.every(n => s.domN.includes(n)) && same(s.lit.e, new Set(B.e.concat(B.k))), `beat ${i + 1}: the six state actors are lit, with their lines and the links they reach`, s.domN);
        const li = await p.evaluate(() => [...document.querySelectorAll('#isx-tv .tv-does li')].map(l => l.textContent));
        ok(li.length >= 2 && li.length <= 3 && /Without it/.test(s.txt) && B.dec.every(k => s.txt.includes(D.crisis[k])), `beat ${i + 1}: one sentence per intervention, “Without it”, and the crisis cards by name`, li);
      } else {
        const full = await p.evaluate(() => document.querySelector('#isx-tv .tv-th').textContent);
        ok(/^Economic theory has come far in recognizing global trade imbalances/.test(full) && /That is the thesis of the author, Elias Rutten\. The United States and China are both leading powers in this weaponized system\. Follow the plumbing and you can see who holds the valves\.$/.test(full), 'the end: SMAIN.thesis word for word', full.slice(0, 80));
        ok(/In plain words/.test(s.txt) && /That is why the dollar needs the AI trade/.test(s.txt), 'the end: the plain sentences beside it, and the guide’s closing line');
        ok(s.lit.n.length === allC.length + C.state.length && C.beats.every(X => X.e.concat(X.k).every(e => s.lit.e.includes(e))), 'the end: every complex, the state and every line of the view are lit');
        ok(await p.evaluate(() => !!document.querySelector('#isx-tv [data-tvn="r"]') && !document.querySelector('#isx-tv [data-tvn="1"]')), 'the end: “Play it again” in place of Next');
      }
    }
    ok(texts.filter((t, i) => i < C.n - 1).every(t => !/\d/.test(t.replace(/The (chain|state) · \d of \d/, ''))), 'no figure in any new sentence (the thesis view adds no number)', texts.filter(t => /\d/.test(t.replace(/The (chain|state) · \d of \d/, ''))).map(t => t.slice(0, 90)));
    ok(texts.every(t => !/in this map’s reading|hypothetical|arguably|perhaps/i.test(t)), 'no hedge in the copy');
    ok(texts.join(' ').indexOf('"') < 0 && texts.join(' ').indexOf("'") < 0, 'curled quotation marks only');
    await done(p);
  }

  /* ---------- 5, 6 ---------- */
  {
    const p = await page({ w: 1440, h: 900, ls: { 'isx-enter-fin': '1', 'isx-sim-mode': 'full', 'isx-way': 'map', 'isx-sim-thesis': '1' } });
    let s = await st(p); ok(s.thx && !s.on, 'before: Expert’s thesis panel on the full map');
    await p.focus('#isx-tv-b0'); await p.keyboard.press('Enter'); await p.waitForTimeout(600);
    s = await st(p);
    ok(s.on && !s.thx && s.trays === 0 && !s.ind && s.doors === 0 && !s.dossier && !s.card, 'open: no trays, no Indicators button, no “More inside” tabs, no dossier, no guide card, Expert’s panel aside', s);
    ok(await p.evaluate(() => document.activeElement && document.activeElement.matches('#isx-tv [data-tvn="1"]')), 'opened by keyboard: focus is on Next');
    ok(s.live === 'polite', 'the beat’s text is a polite live region');
    await p.keyboard.press('Enter'); await p.waitForTimeout(300); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    s = await st(p); ok(s.beat === 2 && await p.evaluate(() => document.activeElement.matches('#isx-tv [data-tvn="1"]')), 'Enter on Next steps forward and keeps the focus on Next', s.beat);
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300); s = await st(p); ok(s.beat === 3, '→ steps forward', s.beat);
    await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(300); s = await st(p); ok(s.beat === 2, '← steps back', s.beat);
    await p.evaluate(() => document.querySelector('#isx-s2bar .rt-nx').click()); await p.waitForTimeout(300); s = await st(p); ok(s.beat === 3, 'the bar’s Next steps forward', s.beat);
    await p.evaluate(() => document.querySelector('#isx-s2bar .rt-bk').click()); await p.waitForTimeout(300); s = await st(p); ok(s.beat === 2, 'the bar’s Back steps back', s.beat);
    const marks = await p.evaluate(() => [...document.querySelectorAll('#isx-s2bar [data-rt-t^="tv:"]:not(.rt-sl)')].length);
    ok(marks === 12, 'the bar carries a mark for each of the twelve beats', marks);
    await p.evaluate(() => document.querySelector('#isx-s2bar [data-rt-t="tv:8"]').click()); await p.waitForTimeout(300); s = await st(p); ok(s.beat === 8 && /The state · 2 of 4/.test(s.k), 'a mark jumps to its beat', [s.beat, s.k]);
    /* a complex alone */
    await p.evaluate(() => document.querySelector('#isx-tv [data-tvc="4"]').click()); await p.waitForTimeout(300); s = await st(p);
    ok(s.solo === 4 && same(s.domN, ['HYP', 'LAB', 'PCR', 'INS']) && /Lit alone/.test(s.k) && s.t === 'The AI build-out', 'a chip lights its complex alone, with its own inner lines', [s.domN, s.domE]);
    ok(await p.evaluate(() => document.querySelector('#isx-tv [data-tvc="4"].tv-ch').getAttribute('aria-pressed') === 'true'), 'the chip is pressed');
    await p.evaluate(() => document.querySelector('#isx-tv [data-tvc="4"].tv-ch').click()); await p.waitForTimeout(300); s = await st(p); ok(s.solo == null && s.beat === 8, 'again: back to the beat it was on', [s.solo, s.beat]);
    await p.evaluate(() => document.querySelector('#isx-rmap .fn[data-n="SAV"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(300); s = await st(p);
    ok(s.solo === 2 && same(s.domN, ['SAV', 'OFF']) && !s.dossier, 'an actor on the map lights its complex alone and opens no dossier', [s.solo, s.domN, s.dossier]);
    await p.evaluate(() => document.querySelector('#isx-rmap .fn[data-n="FED"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(300); s = await st(p);
    ok(s.solo === 6 && ['TSY', 'FED', 'REG', 'CGR', 'WH', 'ENG'].every(n => s.domN.includes(n)) && s.t === 'The state', 'a state actor lights the state alone, with all its lines', [s.solo, s.t]);
    await p.focus('#isx-tv [data-tvn="-1"]'); await p.keyboard.press('Escape'); await p.waitForTimeout(300); s = await st(p); ok(s.on && s.solo == null, 'Esc first drops the complex lit alone', s.solo);
    /* replay */
    await p.evaluate(() => document.querySelector('#isx-s2bar [data-rt-t="tv:11"]').click()); await p.waitForTimeout(300);
    await p.evaluate(() => document.querySelector('#isx-tv [data-tvn="r"]').click()); await p.waitForTimeout(300); s = await st(p); ok(s.beat === 0, '“Play it again” starts from the first beat', s.beat);
    await p.evaluate(() => document.querySelector('#isx-s2bar [data-rt-t="tv:11"]').click()); await p.waitForTimeout(300); await p.evaluate(() => document.querySelector('#isx-s2bar .rt-nx').click()); await p.waitForTimeout(300); s = await st(p); ok(s.beat === 0, 'the bar’s “Play it again” does the same', s.beat);
    /* leaving */
    await p.focus('#isx-tv [data-tvn="1"]'); await p.keyboard.press('Escape'); await p.waitForTimeout(600); s = await st(p);
    ok(!s.on && s.mode === 'full' && s.thx && s.ind && s.doors > 0 && s.trays >= 1, 'Esc leaves for the full map: Expert’s panel, the trays, the Indicators button and the “More inside” tabs are back', s);
    ok(await p.evaluate(() => document.activeElement && document.activeElement.id === 'isx-tv-b0'), 'and focus returns to the header’s button');
    ok(await p.evaluate(() => document.querySelectorAll('#isx-rmap .fn.dim').length === 0), 'the full map is fully lit again');
    await p.evaluate(() => document.querySelector('#isx-tv-b0').click()); await p.waitForTimeout(400);
    await p.evaluate(() => document.querySelector('#isx-tv [data-tvg]').click()); await p.waitForTimeout(700);
    ok(await p.evaluate(() => ISX.enter.on === 'fin' && document.querySelectorAll('#isx-enter .en-lv').length === 3 && !ISX.chain.on), '“Take the guide” opens the entry screen at its three levels');
    await p.evaluate(() => document.querySelector('#isx-enter [data-en-way="guide"]').click()); await p.waitForTimeout(900); s = await st(p);
    ok(s.mode === 'story' && !s.on && !s.panel && s.card, 'a level starts the guide; the thesis view is gone', s);
    await p.evaluate(() => ISX.simChain()); await p.waitForTimeout(500); await p.evaluate(() => ISX.simWay('map')); await p.waitForTimeout(500); s = await st(p); ok(!s.on && s.thx, 'Expert after it: the thesis panel, not the chain');
    await p.evaluate(() => ISX.simChain()); await p.waitForTimeout(500); await p.evaluate(() => ISX.simFree()); await p.waitForTimeout(500); s = await st(p); ok(!s.on && !s.thx && !s.panel, '“Explore on my own” after it: the bare full map');
    await p.evaluate(() => ISX.simChain()); await p.waitForTimeout(400); await p.reload(); await p.waitForFunction(() => window.ISX && ISX.booted); await p.waitForTimeout(800); s = await st(p); ok(!s.on && s.mode === 'full', 'nothing is stored: a reload opens the full map');
    await done(p);
  }

  /* ---------- 7 ---------- */
  {
    const p = await page({ w: 390, h: 844, m: true, ls: { 'isx-enter-fin': '1' } });
    await p.evaluate(() => ISX.simChain()); await p.waitForTimeout(700);
    for (const i of [0, 3, 8, 11]) {
      await p.evaluate(i => { const C = ISX.chain; for (let k = C.beat; k < i; k++) document.querySelector('#isx-tv [data-tvn="1"]').click(); }, i); await p.waitForTimeout(400);
      const r = await p.evaluate(() => { const t = document.querySelector('#isx-tv'), r = t.getBoundingClientRect(), svg = document.querySelector('#isx-rmap'), sr = svg.getBoundingClientRect(), stage = document.querySelector('#isx-stage').getBoundingClientRect();
        return { w: r.width, over: document.documentElement.scrollWidth > innerWidth + 1, under: r.top >= stage.bottom - 1, svgw: sr.width, small: [...t.querySelectorAll('button')].filter(b => b.getClientRects().length && b.getBoundingClientRect().height < 43.5).map(b => b.textContent.slice(0, 20)), wrap: [...t.querySelectorAll('p, li, h4, blockquote')].filter(e => e.scrollWidth > e.clientWidth + 1).length }; });
      ok(!r.over && r.under && r.svgw <= 390 && !r.wrap, `phone, beat ${i + 1}: the map fits the width, the panel sits under it, nothing overflows`, r);
      ok(!r.small.length, `phone, beat ${i + 1}: every button in the panel is at least 44 px high`, r.small);
    }
    ok(await p.evaluate(() => { const v = document.querySelector('#isx-rmap').getAttribute('viewBox').split(' ').map(Number); return v[2] > 1000; }), 'phone, the thesis: the whole map is in view');
    await done(p);
  }
  {
    /* motion allowed and motion reduced show the same content */
    const txt = async motion => { const p = await page({ motion, ls: { 'isx-enter-fin': '1' } }); await p.evaluate(() => ISX.simChain()); await p.waitForTimeout(1300); const out = [];
      const pos = () => p.evaluate(() => [...document.querySelectorAll('#isx-fpart circle')].map(c => c.getAttribute('cx') + ',' + c.getAttribute('cy')).join(';'));
      for (let i = 0; i < 12; i++) { if (i) { await p.evaluate(() => document.querySelector('#isx-tv [data-tvn="1"]').click()); await p.waitForTimeout(motion ? 1200 : 250); }
        const row = await p.evaluate(() => [document.querySelector('#isx-tv-cur').textContent, [...document.querySelectorAll('#isx-rmap .fn.lit')].map(g => g.dataset.n).sort().join(), [...document.querySelectorAll('#isx-rmap .fe.on')].length]);
        const a = await pos(); await p.waitForTimeout(160); row.push(a === await pos() ? 0 : 1); out.push(row); }
      await done(p); return out; };
    const A = await txt(true), B = await txt(false);
    ok(A.every((a, i) => a[0] === B[i][0] && a[1] === B[i][1] && a[2] === B[i][2]), 'reduced motion: the same text, actors and lines at every beat');
    ok(B.every(x => x[3] === 0), 'reduced motion: nothing moves along the lines (the marks stand still)', B.map(x => x[3]));
    ok(A.some(x => x[3] === 1), 'with motion allowed, the marks flow along the lit lines (the page’s own particles)', A.map(x => x[3]));
  }
  await b.close();
  console.log(`thesis-check: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
