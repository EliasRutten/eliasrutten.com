/* Check of round OR9 (26 Nov 2026): the pacing of the order's stage (handoff claude/handoffs/orrery-stage-or8-review-26-nov.md §5; review claude/reviews/or8-pacing-review-26-nov.md).
   What it counts, the way a person meets the stage: the text blocks and the labelled marks (names on the picture) that are visible (a box in the window, opacity above
   0.08 through every ancestor, not hidden). Controls are counted apart. A chapter's title counts once, wherever it shows (the card, the narrator's heading and kicker,
   a step's own heading). Standing parts update in place and are counted as tools, not as new things: the counters, the flows' caption and choice, the key, the door
   and its links, the timeline's legend, the body card. A name keeps its identity when its figure changes (“Japan · surplus $212bn” is Japan); a line's figure on
   its own row belongs to the line; a chart counts once. Something already shown in an earlier chapter of the pass is not new when it comes back (the camera pulled back, a step dimmed it).
   It fails when:
   · a sentence on the stage takes longer to read (200 words a minute) than its beat holds, or a chapter's sentences longer than the chapter;
   · more than CAP new things appear in the first 3 s of a chapter (sampled at 0.5, 1.5 and 3 s after its chip is pressed), or of the introduction;
   · anything of a later chapter is on screen (China's arcs before chapter 5, the curtain and the bands' names before chapter 7, WAICO before chapter 8,
     the steps' charts before chapter 9, a later chapter's sentence; the flow lines of a chapter that names none);
   · the introduction starts behind the tab's entry screen, or does not start when the screen closes; the tools show while the film plays, or stay away
     once the visitor takes over (Pause); under reduced motion a chapter's beats are not shown in order as stills.
   Usage: NODE_PATH=/opt/npm-tools/node_modules node tools/orrery-or9-pacing-check.js [baseUrl]   (python3 -m http.server 8731 at the repo root)
   ONLY=table|desktop|phone|cold|rm|take runs one part (the chapter builds take about 4 minutes a size). */
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8731/imperial-stack/';
const CAP = 3, WPM = 200, ONLY = process.env.ONLY || '';
let fails = 0, n = 0; const want = k => !ONLY || ONLY.split(',').includes(k);
const ok = (name, cond, extra) => { n++; if (!cond) fails++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 1200) : '')); };
const readS = s => s.split(/\s+/).filter(Boolean).length / WPM * 60;
/* the in-page count (the same rules as the OR9 review's sampler) */
const SAMPLE = () => {
  const root = document.querySelector('.orr-fs .orr-stage') || document.querySelector('#isx-pf .orr-stage'); if (!root) return null;
  const opa = el => { let o = 1; for (let x = el; x && x.nodeType === 1; x = x.parentNode) { const cs = getComputedStyle(x); if (cs.display === 'none' || x.hidden) return 0; o *= +cs.opacity; if (o < .08) return 0; } return o; };
  const vis = el => { if (el.classList && el.classList.contains('off')) return false; const r = el.getBoundingClientRect(); if (!(r.width > .5 && r.height > .5 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight)) return false; if (getComputedStyle(el).visibility === 'hidden') return false; return opa(el) >= .08; };
  const own = el => [...el.childNodes].filter(x => x.nodeType === 3).map(x => x.textContent).join('').replace(/\s+/g, ' ').trim();
  const items = [], ctl = [], seen = new Set();
  const kind = el => el.closest('.orr-tc, .orr-sc') || el.matches('.nt') || el.closest('.nk') ? 'title' : el.closest('.orr-yr, .orr-c, .orr-info, .orr-fcap, .orr-fc1, .orr-fsel, .orr-hud .ku, .orr-tkey, .orr-side, .orr-jump, .orr-kin, .orr-key') ? 'standing' : 'item';
  root.querySelectorAll('*').forEach(el => { if (el.closest('svg')) return; const t = own(el); if (!t || !/[A-Za-z0-9]/.test(t) || !vis(el)) return; const ch = el.closest('.orr-ch');
    const key = ch ? 'chart:' + (ch.classList.contains('u') ? 'u' : 'c') : (el.className && typeof el.className === 'string' ? el.className.split(' ')[0] : el.tagName) + ':' + t.slice(0, 60);
    if (el.closest('button, a, input, [role=button], [role=radio]')) { ctl.push(key); return; } if (seen.has(key)) return; seen.add(key); items.push([key, kind(el)]); });
  root.querySelectorAll('svg text').forEach(el => { const t = el.textContent.replace(/\s+/g, ' ').trim(); if (!t || !vis(el)) return; const cls = el.getAttribute('class') || '', ch = el.closest('.orr-ch'); if (/\bfg\b/.test(cls) && !ch) return;
    const key = ch ? 'chart:' + (ch.classList.contains('u') ? 'u' : 'c') : 'mk.' + cls.split(' ')[0] + ':' + (/^ol\b/.test(cls) ? t.split(' · ')[0] : t).slice(0, 60); if (seen.has(key)) return; seen.add(key); items.push([key, 'item']); });
  const lines = [...root.querySelectorAll('svg path.fl, svg path.st')].filter(e => getComputedStyle(e).display !== 'none' && e.getAttribute('d') && opa(e) >= .08).length;
  const o = ISX.profit.orrery.cur, W = o && o.SG ? o.SG.where() : null;
  return { items, ctl, lines, ch: o && o.SG ? o.SG.idx() : null, where: W, bt: (document.querySelector('.orr-nar .bt') || {}).textContent || '', calm: !!(o && o.wrap.classList.contains('calm')), step: o ? o.st.step || '' : '' };
};
const newIn = (before, samples) => { const b = new Set(before.items.map(x => x[0])), out = new Set(); let title = false; samples.forEach(s => s.items.forEach(([k, kd]) => { if (b.has(k) || kd === 'standing') return; if (kd === 'title') title = true; else out.add(k); })); return [...out].concat(title ? ['(the chapter’s title)'] : []); };
/* what belongs to a later chapter: [first chapter it may show in (0-based), test on a sample] */
const LATER = [[4, s => s.items.some(([k]) => /^mk\.orr-a(l|hd):/.test(k)), 'China’s arcs'], [6, s => s.items.some(([k]) => /^mk\.orr-lt:|Silicon curtain/.test(k)), 'the curtain or the bands’ names'],
  [7, s => s.items.some(([k]) => /WAICO/.test(k)), 'WAICO'], [8, s => s.items.some(([k]) => /^ct:|^vl:|^mk\.vl:/.test(k)), 'the steps’ charts']];
(async () => {
  const b = await chromium.launch(); const errs = [];
  const ctx = async (w, h, { cold = false, rm = false } = {}) => {
    const touch = w < 700 || h < 500, c = await b.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1, reducedMotion: rm ? 'reduce' : 'no-preference' });
    if (!cold) await c.addInitScript(() => { ['isx-tips-globe', 'isx-tour', 'isx-tips-sim', 'isx-first', 'isx-insights', 'isx-simtour'].forEach(k => localStorage.setItem(k, 'off')); localStorage.setItem('isx-intro-off', '1'); localStorage.setItem('isx-stack', 'open'); });
    const p = await c.newPage(); p._c = c;
    p.on('pageerror', e => errs.push('PAGE ' + String(e).slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/favicon/i.test(m.text())) errs.push('CON ' + m.text().slice(0, 200)); });
    await p.goto(base + '#profit/order', { waitUntil: 'load', timeout: 90000 });
    await p.waitForFunction(() => window.ISX && ISX.booted && ISX.profit && ISX.profit.orrery && ISX.profit.orrery.cur && ISX.profit.orrery.cur.SG, null, { timeout: 60000 });
    return p;
  };
  const S = p => p.evaluate(SAMPLE);
  const idle = p => p.waitForFunction(() => !ISX.profit.orrery.cur.SG.where().run, null, { timeout: 60000, polling: 200 });

  /* A · the beats: every sentence holds longer than it takes to read */
  if (want('table')) {
    const p = await ctx(1440, 900); const T = await p.evaluate(() => ISX.profit.orrery.cur.SG.beats());
    const all = [['intro', T.IN.b]].concat(T.CH.map(c => [c.id, c.b])), bad = [], chBad = [];
    all.forEach(([id, B]) => { B.forEach((x, j) => { if (readS(x.s) > x.h) bad.push([id, j + 1, x.s, +readS(x.s).toFixed(1), x.h]); if (/\.\s.*\.\s.*\./.test(x.s)) bad.push([id, j + 1, 'more than two sentences']); }); const r = B.reduce((s, x) => s + readS(x.s), 0), hd = B.reduce((s, x) => s + x.h, 0); if (r > hd) chBad.push([id, r, hd]); });
    ok('A · every sentence on the stage takes less time to read (200 words a minute) than its beat holds, and none is more than two sentences', bad.length === 0, bad);
    ok('A · every chapter’s sentences take less time to read than the chapter holds', chBad.length === 0, chBad);
    const film = all.reduce((s, [id, B]) => s + B.reduce((t, x) => t + x.h, 0) + (id === 'intro' ? 0 : 1.8), 0);
    console.log('     the film’s beats hold ' + Math.round(film) + ' s in all (introduction, ten chapters with their cards), plus the years’ glides');
    console.log('     beats: ' + all.map(([id, B]) => id + ' ' + B.length).join(' · '));
    await p._c.close();
  }

  /* B · each chapter by its chip: the first 3 s bring at most CAP new things; nothing of a later chapter; the build ends calm */
  for (const [w, h, name] of [[1440, 900, 'desktop'], [390, 844, 'phone']]) {
    if (!want(name)) continue;
    const p = await ctx(w, h); if (h > w) { await p.evaluate(() => document.querySelector('.orr-stage').scrollIntoView()); }
    await p.waitForTimeout(800);
    const go = async i => { await p.evaluate(i => document.querySelector('.orr-chp[data-ch="' + i + '"]').click(), i); };
    await go(9); await idle(p); await p.waitForTimeout(500);   /* start from the end, so that chapter 1 is told from nothing */
    const rows = [], over = [], later = [], flows = [];
    let prev = null;   /* everything seen so far in the pass (starting from chapter 10, so that chapter 1 is told from nothing) */
    for (let i = 0; i < 10; i++) {
      const now0 = await S(p), before = { items: (prev ? prev.items : []).concat(now0.items) }; await go(i); const smp = [];
      for (const t of [500, 1500, 3000]) { await p.waitForTimeout(t - (smp.length ? [500, 1500, 3000][smp.length - 1] : 0)); smp.push(await S(p)); }
      await idle(p); await p.waitForTimeout(400); const end = await S(p);
      const nw = newIn(before, smp); prev = { items: (i ? prev.items : []).concat(...smp.map(x => x.items), end.items) }; rows.push([i + 1, nw.length, smp[0].items.length, smp[2].items.length, end.items.length, end.ctl.length, end.lines]);
      if (nw.length > CAP) over.push([i + 1, nw]);
      [...smp, end].forEach(s => LATER.forEach(([from, test, what]) => { if (i < from && test(s)) later.push([i + 1, what]); }));
      if ([0, 4, 5, 6].includes(i) && end.lines > 0) flows.push([i + 1, end.lines]);   /* chapters whose sentences name no flow */
    }
    console.log('     ' + name + ': chapter | new in first 3 s | text and names at 0.5 s / 3 s / end of build | controls at the end | lines drawn');
    rows.forEach(r => console.log('       ' + r[0] + ' | ' + r[1] + ' | ' + r[2] + ' / ' + r[3] + ' / ' + r[4] + ' | ' + r[5] + ' | ' + r[6]));
    ok('B · ' + name + ': no chapter brings more than ' + CAP + ' new things in its first 3 s (its title counts once)', over.length === 0, over);
    ok('B · ' + name + ': nothing of a later chapter is on screen in any chapter’s build (arcs from chapter 5; curtain and bands from 7; WAICO from 8; the steps’ charts from 9)', later.length === 0, later);
    ok('B · ' + name + ': a chapter whose sentences name no flow draws no flow line (chapters 1, 5, 6, 7)', flows.length === 0, flows);
    await p._c.close();
  }

  /* C · a cold first visit: the entry screen first, then the introduction, one thing at a time, with the tools waiting */
  if (want('cold')) {
    const p = await ctx(1440, 900, { cold: true });
    const btn = p.getByRole('button', { name: /start at the beginning/i }).first(); await btn.waitFor({ state: 'visible', timeout: 20000 }); await p.waitForTimeout(1500);
    const under = await S(p);
    ok('C · under the entry screen the stage waits: the introduction has not started and nothing is drawn but the sky', under.where.intro && !under.where.run && under.where.fl.length === 0 && under.items.filter(([k, kd]) => k.startsWith('mk.')).length === 0, under.where);
    const before = await S(p); await btn.click(); const smp = [];
    for (const t of [500, 1500, 3000]) { await p.waitForTimeout(t - (smp.length ? [500, 1500, 3000][smp.length - 1] : 0)); smp.push(await S(p)); }
    const nw = newIn(before, smp);
    ok('C · the introduction starts as the screen fades, at its first beat (the United States, alone)', smp[2].where.intro && smp[2].where.bt && smp[2].where.bt.ch === -1 && smp[2].where.fl.join() === 'us' && /At the centre, the United States/.test(smp[2].bt), smp[2].where);
    ok('C · the introduction’s first 3 s bring at most ' + CAP + ' new things (' + nw.length + ')', nw.length <= CAP, nw);
    const tools = await p.evaluate(() => ['.orr-fsel', '.orr-deep', '.orr-kyb', '#isx-pf-table', '.orr-jump'].map(s => { const e = document.querySelector('.orr-stage ' + s); return [s, !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden' && +getComputedStyle(e).opacity > .08]; }));
    ok('C · while the film plays the tools wait (the choice of flows, the door, “Key”, “View as table”, the two links)', smp[2].calm && tools.every(t => t[1] === false), tools);
    await p.waitForFunction(() => { const w = ISX.profit.orrery.cur.SG.where(); return w.bt && w.bt.ch === 0 && w.bt.b >= 0; }, null, { timeout: 30000, polling: 200 });
    const c1 = await S(p);
    ok('C · the introduction leads into chapter 1 by itself (the entry screen’s “Start at the beginning” starts the film)', c1.where.run && c1.where.run.film && !c1.where.intro && /Pause/.test(await p.evaluate(() => document.querySelector('.orr-play').textContent)), c1.where);
    await p._c.close();
  }

  /* D · reduced motion: a chapter's beats as stills, in order; no card, no glide */
  if (want('rm')) {
    const p = await ctx(1440, 900, { rm: true }); await p.waitForTimeout(600);
    await p.evaluate(() => document.querySelector('.orr-chp[data-ch="1"]').click()); const seq = []; const t0 = Date.now();
    while (Date.now() - t0 < 26000) { const s = await p.evaluate(() => [document.querySelector('.orr-nar .bt').textContent, document.querySelector('.orr-tc').classList.contains('in'), ISX.profit.orrery.cur.SG.where().fl.length]); if (!seq.length || seq[seq.length - 1][0] !== s[0]) seq.push(s); if (!(await p.evaluate(() => ISX.profit.orrery.cur.SG.where().run))) break; await p.waitForTimeout(250); }
    const B = (await p.evaluate(() => ISX.profit.orrery.cur.SG.beats())).CH[1].b.map(x => x.s), got = seq.map(x => x[0]).filter(Boolean);
    ok('D · reduced motion: chapter 2’s four beats show one after the other, as stills, with no title card; told to its end, the chapter keeps its sentences together', got.slice(0, 4).join('|') === B.join('|') && (got.length === 4 || got[4] === B.join(' ')) && seq.every(x => !x[1]), [got, B]);
    await p._c.close();
  }

  /* E · the visitor takes over: Pause brings the tools back; the narration's detail is one press away */
  if (want('take')) {
    const p = await ctx(1440, 900); await p.waitForTimeout(600);
    await p.click('.orr-play'); await p.waitForTimeout(2500); const c0 = await S(p);
    await p.click('.orr-play'); await p.waitForTimeout(700); const c1 = await S(p);
    const tools = await p.evaluate(() => ['.orr-fsel', '.orr-deep', '.orr-kyb', '#isx-pf-table'].map(s => { const e = document.querySelector('.orr-stage ' + s); return [s, !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden' && +getComputedStyle(e).opacity > .5]; }));
    ok('E · the film is calm while it plays, and Pause brings every tool back', c0.calm && !c1.calm && tools.every(t => t[1]), [c0.calm, c1.calm, tools]);
    await p.click('.orr-nexp'); await p.waitForTimeout(400);
    const rd = await p.evaluate(() => { const n = document.querySelector('.orr-nar'); return { open: n.classList.contains('open'), d: (n.querySelector('.full .d') || {}).textContent || '', vis: getComputedStyle(n.querySelector('.full')).display !== 'none' }; });
    ok('E · “Read” opens the chapter in full, with OR8’s dated sentences', rd.open && rd.vis && /In 1995 the world economy is one order around the United States/.test(rd.d), rd);
    await p._c.close();
  }

  ok('no page or console errors', errs.length === 0, errs.slice(0, 5));
  await b.close();
  console.log('\n' + (n - fails) + ' of ' + n + ' passed' + (fails ? ', ' + fails + ' FAILED' : ''));
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('ERROR', e); process.exit(1); });
