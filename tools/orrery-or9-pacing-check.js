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
   Round OR10 (27 Nov 2026; handoff claude/handoffs/story-mode-and-scroll-27-nov.md, prompt P2) updated it for the prologue that replaces the introduction:
   · A also holds the asks' answers to the reading rule; C follows the prologue (1991, the United States alone first) and answers its ask by picking China;
   · F (new) checks the asks and the skips: the film waits at an ask; “Let the film do it” does it; “Continue ›” skips a beat; the years handed over in chapter 3
     move without ending the film, stay inside the ask's span, and the film goes on when they reach 2007; a chapter picked by its chip never asks;
     “Skip the prologue” lands on chapter 1 told to its end; a returning visitor goes straight in.
   Usage: NODE_PATH=/opt/npm-tools/node_modules node tools/orrery-or9-pacing-check.js [baseUrl]   (python3 -m http.server 8731 at the repo root)
   ONLY=table|desktop|phone|cold|rm|take|asks runs one part (the chapter builds take about 4 minutes a size). */
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8731/imperial-stack/';
const CAP = 3, WPM = 200, ONLY = process.env.ONLY || '';
let fails = 0, n = 0; const want = k => !ONLY || ONLY.split(',').includes(k);
const ok = (name, cond, extra) => { n++; if (!cond) fails++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 1200) : '')); };
const words = s => s.split(/\s+/).filter(Boolean).length, readS = s => words(s) / WPM * 60;
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
    const all = [[T.IN.id, T.IN.b]].concat(T.CH.map(c => [c.id, c.b])), bad = [], chBad = [];
    (T.asks || []).forEach(a => { if (a.r && readS(a.r) > a.rh) bad.push(['ask ' + a.id, 'answer', a.r, +readS(a.r).toFixed(1), a.rh]); if (words(a.s) > 16) bad.push(['ask ' + a.id, 'the ask is long', a.s]); });
    ok('A · the prologue is the story’s opening: 1991 and the United States first, Russia and China last, and it asks for the visitor’s hand once (China)', T.IN.id === 'prologue' && /1991/.test(T.IN.b[0].s) && /United States/.test(T.IN.b[0].s) && /Russia and China/.test(T.IN.b[T.IN.b.length - 1].s) && (T.asks || []).some(a => a.id === 'pickCN'), T.IN.b.map(x => x.s));
    all.forEach(([id, B]) => { B.forEach((x, j) => { if (readS(x.s) > x.h) bad.push([id, j + 1, x.s, +readS(x.s).toFixed(1), x.h]); if (/\.\s.*\.\s.*\./.test(x.s)) bad.push([id, j + 1, 'more than two sentences']); }); const r = B.reduce((s, x) => s + readS(x.s), 0), hd = B.reduce((s, x) => s + x.h, 0); if (r > hd) chBad.push([id, r, hd]); });
    ok('A · every sentence on the stage takes less time to read (200 words a minute) than its beat holds, and none is more than two sentences', bad.length === 0, bad);
    ok('A · every chapter’s sentences take less time to read than the chapter holds', chBad.length === 0, chBad);
    const film = all.reduce((s, [id, B]) => s + B.reduce((t, x) => t + x.h, 0) + 1.8, 0) + (T.asks || []).reduce((s, a) => s + a.rh, 0);
    console.log('     the film’s beats hold ' + Math.round(film) + ' s in all (the prologue, ten chapters, their cards and the asks’ answers), plus the years’ glides and the visitor’s own time at the asks');
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
    await p.waitForFunction(() => { const w = ISX.profit.orrery.cur.SG.where(); return w.bt && w.bt.ch === -1 && w.bt.b === 0; }, null, { timeout: 8000, polling: 100 }).catch(() => {});
    const b0 = await S(p), k0 = await p.evaluate(() => ISX.profit.orrery.cur.view.k);
    ok('C · the prologue starts as the screen fades: its card, then 1991 and the United States alone, the camera close on it', b0.where.intro && b0.where.bt && b0.where.bt.ch === -1 && b0.where.fl.join() === 'us' && /^December 1991/.test(b0.bt) && k0 > 1.8, [b0.where, b0.bt, k0]);
    ok('C · the prologue’s first 3 s bring at most ' + CAP + ' new things (' + nw.length + ')', nw.length <= CAP, nw);
    const tools = await p.evaluate(() => ['.orr-fsel', '.orr-deep', '.orr-kyb', '#isx-pf-table', '.orr-jump'].map(s => { const e = document.querySelector('.orr-stage ' + s); return [s, !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden' && +getComputedStyle(e).opacity > .08]; }));
    ok('C · while the film plays the tools wait (the choice of flows, the door, “Key”, “View as table”, the two links)', smp[2].calm && tools.every(t => t[1] === false), tools);
    const order = []; const t0 = Date.now();
    while (Date.now() - t0 < 70000) { const w = await p.evaluate(() => ISX.profit.orrery.cur.SG.where()); const k = w.ask ? 'ask' : w.bt ? w.bt.ch + ':' + w.bt.b : '-'; if (order[order.length - 1] !== k) order.push(k); if (w.ask) break; await p.waitForTimeout(300); }
    ok('C · the prologue tells its six beats in order and then asks for the visitor’s hand (China)', order.join() === '-1:0,-1:1,-1:2,-1:3,-1:4,-1:5,ask' || order.slice(-7).join() === '-1:0,-1:1,-1:2,-1:3,-1:4,-1:5,ask', order);
    const lit = await p.evaluate(() => { const o = ISX.profit.orrery.cur, op = iso => { const q = o.list.find(x => x.iso === iso && !x.bk); return q ? +getComputedStyle(q.g).opacity : -1; }; return { cn: op('CHN'), ru: op('RUS'), jp: op('JPN'), mx: op('MEX') }; });
    ok('C · at the ask Russia and China are lit, the rest of the world dimmed (not removed)', lit.cn > .9 && lit.ru > .9 && lit.jp > .05 && lit.jp < .5 && lit.mx > .05 && lit.mx < .5, lit);
    await p.waitForTimeout(4000); const still = await p.evaluate(() => ISX.profit.orrery.cur.SG.where());
    ok('C · the film waits at the ask (4 s later it still asks, in the story’s words)', still.ask === 'pickCN' && /China to see where it stands/.test(still.say), still);
    const cq = await p.evaluate(() => { const q = ISX.profit.orrery.cur.list.find(x => x.iso === 'CHN'); const r = q.g.querySelector('.c').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await p.mouse.click(cq[0], cq[1]); await p.waitForTimeout(600);
    const ans = await p.evaluate(() => ({ w: ISX.profit.orrery.cur.SG.where(), card: (document.querySelector('.orr-info b') || {}).textContent || '' }));
    ok('C · picking China answers the ask: its card opens and the story says what the card holds', ans.w.run && ans.w.run.ph === 'reply' && ans.card === 'China' && /card holds its figures/.test(ans.w.say), ans);
    await p.waitForFunction(() => { const w = ISX.profit.orrery.cur.SG.where(); return w.bt && w.bt.ch === 0 && w.bt.b >= 0; }, null, { timeout: 30000, polling: 200 });
    const c1 = await S(p);
    ok('C · the prologue leads into chapter 1 by itself (the entry screen’s “Start at the beginning” starts the film)', c1.where.run && c1.where.run.film && !c1.where.intro && /Pause/.test(await p.evaluate(() => document.querySelector('.orr-play').textContent)), c1.where);
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

  /* F · OR10: the asks and the skips */
  if (want('asks')) {
    const W = p => p.evaluate(() => ISX.profit.orrery.cur.SG.where());
    const cont = p => p.evaluate(() => document.querySelector('.orr-cont').click());
    const p = await ctx(1440, 900, { cold: true });
    const btn = p.getByRole('button', { name: /start at the beginning/i }).first(); await btn.waitFor({ state: 'visible', timeout: 20000 }); await p.waitForTimeout(1200); await btn.click();
    await p.waitForFunction(() => { const w = ISX.profit.orrery.cur.SG.where(); return w.bt && w.bt.ch === -1 && w.bt.b === 0; }, null, { timeout: 10000, polling: 100 });
    const cl = await p.evaluate(() => { const b = document.querySelector('.orr-cont'); return [b.hidden, b.textContent]; });
    await cont(p); await p.waitForTimeout(250); const w1 = await W(p);
    ok('F · “Continue ›” is there at every beat and skips to the next one', !cl[0] && /Continue/.test(cl[1]) && w1.bt.ch === -1 && w1.bt.b === 1, [cl, w1.bt]);
    for (let i = 0; i < 4; i++) { await cont(p); await p.waitForTimeout(200); }
    const w5 = await W(p); await cont(p); await p.waitForTimeout(300); const wa = await W(p);
    ok('F · the last beat of the prologue, skipped, still asks: the ask is the interaction, not a beat', w5.bt.b === 5 && wa.ask === 'pickCN', [w5.bt, wa.ask]);
    const lt = await p.evaluate(() => document.querySelector('.orr-cont').textContent); await cont(p); await p.waitForTimeout(500);
    const wf = await W(p), card = await p.evaluate(() => (document.querySelector('.orr-info b') || {}).textContent || '');
    ok('F · at the ask, “Let the film do it ›” does it (China’s card opens) and the story answers', /Let the film do it/.test(lt) && wf.run && wf.run.ph === 'reply' && card === 'China', [lt, wf.run, card]);
    await p.waitForFunction(() => { const w = ISX.profit.orrery.cur.SG.where(); return w.bt && w.bt.ch === 0 && w.bt.b >= 0; }, null, { timeout: 15000, polling: 200 });
    const sel0 = await p.evaluate(() => ISX.profit.orrery.cur.st.sel);
    ok('F · chapter 1 starts clean: the card picked in the prologue has closed', !sel0, sel0);
    /* on to chapter 3 by Continue, in the same film: the years are handed over after its first beat */
    let wy = null; for (let i = 0; i < 40; i++) { wy = await W(p); if (wy.ask) break; await cont(p); await p.waitForTimeout(wy.bt && wy.bt.ch === 2 ? 2200 : 250); }
    const yr0 = await p.evaluate(() => ISX.profit.orrery.cur.st.yf);
    ok('F · in the film, chapter 3 hands the years over after its first sentence (“drag them to 2007”)', wy.ask === 'yearsCN' && wy.run.film && /drag them to 2007/.test(wy.say) && Math.round(yr0) === 2001, [wy, yr0]);
    await p.waitForTimeout(3000); const wst = await W(p);
    ok('F · the film waits while the years are the visitor’s', wst.ask === 'yearsCN' && wst.run && wst.run.film, wst);
    const tr = await p.evaluate(() => { const i = document.querySelector('.orr-tr input'); const r = i.getBoundingClientRect(); return [r.left, r.width, r.top + r.height / 2]; });
    const xAt = y => tr[0] + (y - 1995) / (2026 - 1995) * tr[1];
    await p.mouse.move(xAt(2001), tr[2]); await p.mouse.down(); for (let y = 2001.5; y <= 2016; y += .5) { await p.mouse.move(xAt(y), tr[2]); await p.waitForTimeout(25); }
    const mid = await p.evaluate(() => ({ y: ISX.profit.orrery.cur.st.yf, w: ISX.profit.orrery.cur.SG.where() }));
    ok('F · dragged past 2007, the years stay inside the ask’s span (2001 to 2007) and the film is not ended', Math.round(mid.y) <= 2007 && mid.w.run && mid.w.run.film && mid.w.ask === 'yearsCN', [mid.y, mid.w.run, mid.w.ask]);
    await p.mouse.up(); await p.waitForTimeout(900); const wd = await W(p);
    ok('F · at 2007 the story answers (China’s share, dated and sourced) and the film goes on', wd.run && wd.run.film && (wd.run.ph === 'reply' && /2001 to 2007.*IMF/.test(wd.say) || wd.bt.b >= 1), [wd.run, wd.say]);
    await p._c.close();
    /* a chapter by its chip never asks; Skip lands on chapter 1 told to its end; a returning visitor goes straight in */
    const q = await ctx(1440, 900, { cold: true });
    const b2 = q.getByRole('button', { name: /start at the beginning/i }).first(); await b2.waitFor({ state: 'visible', timeout: 20000 }); await q.waitForTimeout(1200); await b2.click();
    await q.waitForFunction(() => { const w = ISX.profit.orrery.cur.SG.where(); return w.bt && w.bt.ch === -1 && w.bt.b === 1; }, null, { timeout: 20000, polling: 100 });
    await q.keyboard.press('Escape'); await q.waitForTimeout(900);
    const sk = await q.evaluate(() => ({ w: ISX.profit.orrery.cur.SG.where(), bt: document.querySelector('.orr-nar .bt').textContent, k: ISX.profit.orrery.cur.view.k, skip: !!document.querySelector('.orr-skip') }));
    ok('F · Esc (or “Skip the prologue”) at any beat lands on chapter 1 told to its end, the camera back on the whole picture', !sk.w.intro && !sk.w.run && sk.w.bt && sk.w.bt.ch === 0 && /In 1995 the world economy/.test(sk.bt) && Math.abs(sk.k - 1) < .02 && !sk.skip, sk);
    await q.evaluate(() => document.querySelector('.orr-chp[data-ch="2"]').click());
    let asked = false; for (let i = 0; i < 70; i++) { const w = await W(q); if (w.ask) { asked = true; break; } if (!w.run) break; await q.waitForTimeout(300); }
    ok('F · chapter 3 picked by its chip is told without asking', !asked, asked);
    await q.goto('about:blank'); await q.goto(base + '#profit/order', { waitUntil: 'load' }); await q.waitForFunction(() => window.ISX && ISX.profit && ISX.profit.orrery && ISX.profit.orrery.cur && ISX.profit.orrery.cur.SG, null, { timeout: 60000 }); await q.waitForTimeout(3500);
    const rv = await q.evaluate(() => ({ w: ISX.profit.orrery.cur.SG.where(), entry: !!document.querySelector('.isx-enter, [data-enter-open]') && getComputedStyle(document.querySelector('.isx-enter, [data-enter-open]')).display !== 'none', bt: document.querySelector('.orr-nar .bt').textContent }));
    ok('F · a returning visitor goes straight in: no prologue, chapter 1 told to its end, with Play', !rv.w.intro && !rv.w.run && rv.w.bt && rv.w.bt.ch === 0 && /In 1995 the world economy/.test(rv.bt), rv);
    await q._c.close();
  }

  ok('no page or console errors', errs.length === 0, errs.slice(0, 5));
  await b.close();
  console.log('\n' + (n - fails) + ' of ' + n + ' passed' + (fails ? ', ' + fails + ' FAILED' : ''));
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('ERROR', e); process.exit(1); });
