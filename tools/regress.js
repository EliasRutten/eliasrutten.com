/* Regression net for the Imperial Stack.
   Usage: node tools/regress.js <out.json> [baseUrl]
   Serves nothing itself: start `python3 -m http.server 8731` at the repo root first.
   Walks every tab and state under reduced motion (so text is settled), records a hash of the visible text
   per state plus element counts, and collects page errors. Compare two runs with tools/regress-diff.js. */
const { chromium } = require('playwright');
const crypto = require('crypto');
const fs = require('fs');
const out = process.argv[2] || 'regress.json';
const base = process.argv[3] || 'http://127.0.0.1:8731/imperial-stack/';
const sha = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);

(async () => {
  const b = await chromium.launch();
  const res = { states: {}, counts: {}, errors: [] };
  const ctxFor = async (w, h, mode, reduce = true) => {
    const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: reduce ? 'reduce' : 'no-preference' });
    await c.addInitScript(m => { try { localStorage.setItem('isx-tips-globe', 'off'); localStorage.setItem('isx-tour', 'off'); localStorage.setItem('isx-tips-sim', 'off'); localStorage.setItem('isx-intro-off', '1'); localStorage.setItem('isx-first', 'off'); localStorage.setItem('isx-insights', 'off'); if (m) localStorage.setItem('isx-sim-mode', m); } catch (e) {} }, mode);
    return c;
  };
  const open = async (c, hash, tag) => {
    const p = await c.newPage();
    p.on('pageerror', e => res.errors.push(tag + ': ' + String(e).slice(0, 300)));
    p.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_|Failed to load resource/.test(m.text())) res.errors.push(tag + ' console: ' + m.text().slice(0, 300)); });
    await p.goto(base + hash, { waitUntil: 'load', timeout: 90000 });
    await p.waitForFunction(() => !document.getElementById('isx-root').classList.contains('booting'), null, { timeout: 60000 });
    await p.waitForTimeout(1500);
    return p;
  };
  const text = (p, sel) => p.evaluate(s => s.split(',').map(q => { const e = document.querySelector(q.trim()); return e ? (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim() : '∅'; }).join(' ¦ '), sel);
  const snap = async (p, key, sel) => { const t = await text(p, sel); res.states[key] = { h: sha(t), n: t.length, head: t.slice(0, 90) }; };
  const count = (p, key, sel) => p.evaluate(s => document.querySelectorAll(s).length, sel).then(n => { res.counts[key] = n; });

  /* ---------- desktop, Circuit ---------- */
  let c = await ctxFor(1440, 900, 'full');
  let p = await open(c, '#circuit', 'circuit');
  const CSEL = '#isx-tournarr, #isx-narr, #isx-card, #isx-tabs, #isx-resbar, #isx-legend, #isx-mapnote';
  for (let i = 0; i <= 10; i++) { await snap(p, 'circuit/step' + i, CSEL); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(350); }
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(400); await snap(p, 'circuit/wrap', '#isx-tournarr');
  /* B1-2: after step 10 the loop closes in the ring (circuit/wrap is now the ring's card); one more → starts again at step 1, where the walk went on before */
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(500);
  /* country, by clicking a table row; firm, through the firms panel */
  await p.evaluate(() => { const r = [...document.querySelectorAll('#isx-c-table .cell[role="button"], #isx-c-table .catab .c')][0]; if (r) r.click(); });
  await p.waitForTimeout(400); await snap(p, 'circuit/country', '#isx-card, #isx-vchip');
  await p.evaluate(() => { const b = document.getElementById('isx-clear'); if (b && !b.hidden) b.click(); });
  await p.evaluate(() => { const f = document.querySelector('#isx-firmsbox > .fold6'); if (f && f.getAttribute('aria-expanded') === 'false') f.click(); });
  for (const reg of ['us', 'eu', 'as']) { await p.evaluate(r => { const t = document.getElementById('isx-ftab-' + r); if (t) t.click(); }, reg); await p.waitForTimeout(150); await snap(p, 'circuit/firms-' + reg, '#isx-firmlist'); await count(p, 'firms-' + reg, '#isx-firmlist .firm'); }
  await p.evaluate(() => { const f = document.querySelector('#isx-firmlist .firm'); if (f) f.click(); }); await p.waitForTimeout(400); await snap(p, 'circuit/firm', '#isx-card');
  await p.evaluate(() => { const b = document.getElementById('isx-clear'); if (b && !b.hidden) b.click(); });
  const nm = await p.evaluate(() => document.querySelectorAll('#isx-mapmodes button[data-mm], #isx-mapmodes .mmb').length);
  res.counts.mapmodes = nm;
  const mmSel = await p.evaluate(() => { const bs = [...document.querySelectorAll('#isx-mapmodes button')].filter(x => !x.classList.contains('mm-tog') && !x.classList.contains('lfull') && !x.hasAttribute('data-how') && !x.hasAttribute('data-ins')); return bs.length; });
  for (let i = 0; i < mmSel; i++) { await p.evaluate(k => { const bs = [...document.querySelectorAll('#isx-mapmodes button')].filter(x => !x.classList.contains('mm-tog') && !x.classList.contains('lfull') && !x.hasAttribute('data-how') && !x.hasAttribute('data-ins')); bs[k].click(); }, i); await p.waitForTimeout(250); await snap(p, 'circuit/mode' + i, '#isx-mapmodes'); }
  await p.evaluate(() => document.getElementById('isx-waico').click()); await p.waitForTimeout(200); await snap(p, 'circuit/waico', '#isx-legend');
  await snap(p, 'page/method', '#isx-method, #isx-support, footer');
  await p.close();

  /* ---------- Arm ---------- */
  p = await open(c, '#arm', 'arm');
  const nt = await p.evaluate(() => document.querySelectorAll('#isx-tabs .tb').length); res.counts.armtabs = nt;
  for (let i = 0; i < nt; i++) { await p.evaluate(k => document.querySelectorAll('#isx-tabs .tb')[k].click(), i); await p.waitForTimeout(250); await snap(p, 'arm/tab' + i, '#isx-narr, #isx-card, #isx-armlist'); }
  await count(p, 'arm-svg-nodes', '#isx-arm g');
  await p.close();
  p = await open(c, '#revenue', 'revenue'); await snap(p, 'arm/revenue', '#isx-narr, #isx-card, #isx-tabs'); await p.close();

  /* ---------- Simulator, full view ---------- */
  p = await open(c, '#simulator', 'sim-full');
  await count(p, 'sim-actors', '#isx-rmap .fn'); await count(p, 'sim-relations', '#isx-rmap .fe'); await count(p, 'sim-levers', '#isx-fin .lv'); await count(p, 'sim-tiles', '#isx-fin .tile'); await count(p, 'sim-plays', '#isx-fin .pchip');
  await snap(p, 'sim/full', '#isx-fin');
  const np = res.counts['sim-plays'];
  for (let i = 0; i < np; i++) { await p.evaluate(k => document.querySelectorAll('#isx-fin .pchip')[k].click(), i); await p.waitForTimeout(300); await snap(p, 'sim/play' + i, '#isx-fin .dossier, #isx-fin .pbar'); }
  await p.evaluate(() => { const x = document.querySelector('#isx-fin .pclr'); if (x) x.click(); });
  const nl = res.counts['sim-levers'];
  for (let i = 0; i < nl; i++) { await p.evaluate(k => document.querySelectorAll('#isx-fin .lv')[k].click(), i); await p.waitForTimeout(250); await snap(p, 'sim/lever' + i, '#isx-fin .dossier, #isx-fin .hud'); await p.evaluate(k => document.querySelectorAll('#isx-fin .lv')[k].click(), i); }
  await p.evaluate(() => { const n = document.querySelector('#isx-rmap .fn'); if (n) n.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await p.waitForTimeout(300); await snap(p, 'sim/node', '#isx-fin .dossier');
  await p.close();
  p = await open(c, '#capital-stack', 'sim-stack'); await snap(p, 'sim/stack', '#isx-fin, #isx-narr'); await p.close();
  await c.close();

  /* ---------- Simulator, story ---------- */
  c = await ctxFor(1440, 900, 'story');
  p = await open(c, '#simulator', 'sim-story');
  await snap(p, 'story/intro', '#isx-snarr');
  await p.evaluate(() => { const g = document.querySelector('#isx-sn-body [data-sg="start"]'); if (g) g.click(); }); await p.waitForTimeout(400);
  /* B1: a step keeps its key (story/00 is step 1) whatever comes between two steps. → never chooses: at a choice the walk
     records the card (story/ask-N), takes what happened on the card and goes on. */
  let steps = 0, last = '';
  for (let i = 0; i < 120; i++) {
    const st = await p.evaluate(() => { const e = document.querySelector('.sn-cnt'), o = document.querySelector('#isx-sn-body [data-fk="real"], #isx-sn-body [data-pick="real"]'), nx = document.querySelector('#isx-s2bar .rt-nx'); return { cnt: e ? e.textContent.replace(/\s+/g, '') : '', opt: !!o, hold: !!nx && nx.classList.contains('hold') }; });
    if (st.cnt && st.cnt !== last) { last = st.cnt; await snap(p, 'story/' + String(+st.cnt.split('/')[0] - 1).padStart(2, '0'), '#isx-snarr'); }
    else if (!st.cnt) await snap(p, 'story/ask-' + (last.split('/')[0] || '0'), '#isx-snarr');
    if (/^(\d+)\/\1$/.test(st.cnt)) { steps = +st.cnt.split('/')[0]; break; }
    if (st.hold && st.opt) await p.evaluate(() => document.querySelector('#isx-sn-body [data-fk="real"], #isx-sn-body [data-pick="real"]').click());
    else await p.keyboard.press('ArrowRight');
    await p.waitForTimeout(260);
  }
  res.counts['story-steps'] = steps;
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(400);
  await snap(p, 'story/end', '#isx-snarr, .scount');
  await p.close(); await c.close();

  /* ---------- Scenarios ---------- */
  c = await ctxFor(1440, 900, 'full');
  p = await open(c, '#scenarios', 'scenarios');
  const ns = await p.evaluate(() => document.querySelectorAll('#isx-spick button').length); res.counts.scenarios = ns;
  for (let i = 0; i < ns; i++) {
    await p.evaluate(k => document.querySelectorAll('#isx-spick button')[k].click(), i); await p.waitForTimeout(350);
    await snap(p, 'scen/' + String(i).padStart(2, '0'), '#isx-ssteps, #isx-shud, #isx-slay, #isx-card, #isx-narr');
    res.counts['scen-steps-' + i] = await p.evaluate(() => document.querySelectorAll('#isx-ssteps .sstep').length);
  }
  await p.close(); await c.close();

  /* ---------- phone, and a pass with motion on: errors and overflow only ---------- */
  for (const [w, h, tag, reduce] of [[390, 844, 'phone', true], [1440, 900, 'motion', false]]) {
    c = await ctxFor(w, h, 'story', reduce);
    for (const hash of ['#circuit', '#arm', '#simulator', '#scenarios']) {
      p = await open(c, hash, tag + hash);
      if (hash === '#circuit') for (let i = 0; i < 3; i++) { await p.evaluate(() => { const n = document.querySelector('#isx-tabs .rt-nx') || document.getElementById('isx-ms-next'); if (n && n.getClientRects().length) n.click(); else document.getElementById('isx-t-next').click(); }); await p.waitForTimeout(500); }
      res.counts[tag + hash + '-overflow'] = await p.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
      await p.close();
    }
    await c.close();
  }
  await b.close();
  fs.writeFileSync(out, JSON.stringify(res, null, 1));
  console.log('states', Object.keys(res.states).length, 'errors', res.errors.length, res.errors.slice(0, 5));
  console.log('counts', JSON.stringify(res.counts));
})().catch(e => { console.error('REGRESS FAILED', e); process.exit(1); });
