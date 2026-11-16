/* B3 checks: Scenarios in three depths (gallery, scene, depth).
   Usage: node tools/b3-check.js [baseUrl] [--only=<n,n>]   — needs `python3 -m http.server 8731` at the repo root.
   Exits 1 on a failed check. Sections 1 to 10 follow claude/handoffs/B3.md §4; 11 and 12 are the round's own
   (the switch list failing to load; the counts). A node's position is worked out here from STORIES and SMAPS by the page's
   rule (its own position, or its place with its offset, clamped to 80–920 by 118–505), not read from the module. */
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const base = args.find(a => /^https?:/.test(a)) || 'http://127.0.0.1:8731/imperial-stack/';
const only = (args.find(a => /^--only=/.test(a)) || '').replace('--only=', '').split(',').filter(Boolean).map(Number);
const want = n => !only.length || only.includes(n);
let fails = 0;
const ok = (name, cond, extra) => { if (!cond) fails++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra !== undefined && !cond ? '  → ' + JSON.stringify(extra).slice(0, 900) : '')); };
const SIZES = [[1440, 900], [1280, 720]];

/* runs in the page: what the scene shows at the step in hand */
const probe = () => {
  const st = document.getElementById('isx-sc3'), R = st.getBoundingClientRect(), cs = getComputedStyle(st), S = ISX.sc.STORIES[ISX.sc.idx], M = ISX.sc.SMAPS[S.map], n = ISX.sc.step, N = S.steps.length;
  const x = +cs.getPropertyValue('--b3x'), y = +cs.getPropertyValue('--b3y'), z = +cs.getPropertyValue('--b3z'), W = st.clientWidth, H = st.clientHeight, s0 = Math.max(W / 1000, H / 580);
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const pos = k => { const nd = S.nodes[k]; if (nd.off && nd.at && M.places[nd.at]) { const p = M.places[nd.at]; return [cl(p[0] + nd.off[0], 80, 920), cl(p[1] + nd.off[1], 118, 505)]; } return nd.pos || (nd.at && M.places[nd.at]) || M.tagAt; };
  const proj = p => [R.left + st.clientLeft + x + z * ((W - 1000 * s0) / 2 + p[0] * s0), R.top + st.clientTop + y + z * ((H - 580 * s0) / 2 + p[1] * s0)];
  const world = document.getElementById('isx-b3-world'), cardEl = document.getElementById('isx-b3-card'), card = cardEl.getBoundingClientRect(), bar = document.getElementById('isx-sc-bar');
  const shown = e => { const c = getComputedStyle(e); return c.visibility !== 'hidden' && +c.opacity > .01; };
  const o = { id: S.id, n, N, off: [], outside: [], under: [], early: [], missing: [], tab: [] };
  const want = new Set(); S.steps.forEach((s, j) => { want.add(s.n); (s.frm || []).forEach(k => want.add(k)); });
  const got = new Set();
  world.querySelectorAll('.nd').forEach(g => {
    const k = g.dataset.n, b = g.querySelector('.bd').getBoundingClientRect(), c = [b.left + b.width / 2, b.top + b.height / 2], e = proj(pos(k)), d = Math.max(Math.abs(c[0] - e[0]), Math.abs(c[1] - e[1]));
    got.add(k);
    if (d > 1) o.off.push(k + ':' + d.toFixed(1));
    if (b.left < R.left || b.right > R.right || b.top < R.top || b.bottom > R.bottom || b.bottom > innerHeight || b.right > innerWidth) o.outside.push(k);
    if (b.left < card.right && b.right > card.left && b.top < card.bottom && b.bottom > card.top) o.under.push(k);
  });
  o.nodes = [...want].every(k => got.has(k)) && got.size === want.size;
  world.querySelectorAll('[data-s]').forEach(e => { const s = +e.dataset.s, v = shown(e); if (s > n && v) o.early.push(e.getAttribute('class') + '@' + (s + 1)); if (s <= n && !v && !e.classList.contains('glow')) o.missing.push(e.getAttribute('class') + '@' + (s + 1)); });
  /* what Tab can reach inside the stage: nothing in the scene itself, and of the strip only the step in hand */
  st.querySelectorAll('button, a[href], [tabindex]').forEach(e => { if (e.tabIndex < 0 || e.closest('[inert]') || !e.getClientRects().length || getComputedStyle(e).visibility === 'hidden') return; if (world.contains(e)) o.tab.push('scene'); if (e.classList.contains('rt-sp') && +e.dataset.rtT > n) o.tab.push('strip step ' + (+e.dataset.rtT + 1)); });
  o.same = getComputedStyle(document.getElementById('isx-b3-map')).transform === getComputedStyle(world).transform;
  const tex = document.getElementById('isx-b3-tex'), w = ISX.scenes.sw ? ISX.scenes.sw.SW.find(q => q.case === S.id && q.step === n + 1) : null;
  o.tex = tex.dataset.t; o.texBg = getComputedStyle(tex).backgroundImage !== 'none' || getComputedStyle(tex, '::before').backgroundImage !== 'none';   /* Scenarios polish: the pattern is drawn on ::before */ o.instr = w ? w.instr : null; o.choke = n < N && !!S.steps[n].choke; o.link = n < N ? S.steps[n].link || 'data' : 'end';
  o.title = (cardEl.querySelector('h2') || {}).textContent; o.wantTitle = n < N ? S.steps[n].title : null; o.cap = (cardEl.querySelector('.b3cap') || {}).textContent || '';
  o.tgOn = world.querySelectorAll('.tg.on').length; o.tgAll = world.querySelectorAll('.tg').length;
  o.bk = (r => [r.left, r.top, r.width, r.height].map(v => Math.round(v * 10) / 10))(bar.querySelector('.rt-bk').getBoundingClientRect()); o.nx = (r => [r.left, r.top, r.width, r.height].map(v => Math.round(v * 10) / 10))(bar.querySelector('.rt-nx').getBoundingClientRect());
  /* one screen: the frame no taller than the window, the page not scrolled, the card whole and inside the stage, nothing scrolling inside it */
  const f = document.getElementById('isx-frame').getBoundingClientRect(), br = bar.getBoundingClientRect();
  o.fit = f.height <= innerHeight + .5 && scrollY === 0 && card.top >= R.top && card.bottom <= br.top + 1 && cardEl.scrollHeight <= cardEl.clientHeight + 1 && br.bottom <= R.bottom + .5 && document.documentElement.scrollWidth <= innerWidth;
  o.fitWhy = [Math.round(f.height), innerHeight, scrollY, Math.round(card.top), Math.round(card.bottom), Math.round(br.top), cardEl.scrollHeight, cardEl.clientHeight];
  o.other = /other outcome/i.test(st.textContent) || !!st.querySelector('[data-b3="flip"], .flip, [data-flip]');
  return o;
};

(async () => {
  const b = await chromium.launch();
  const page = async (hash, opts = {}) => {
    const c = await b.newContext({ viewport: { width: opts.w || 1440, height: opts.h || 900 }, deviceScaleFactor: 1, reducedMotion: opts.motion ? 'no-preference' : 'reduce', hasTouch: !!opts.touch, isMobile: !!opts.touch });
    await c.addInitScript(() => { try { ['isx-tips-globe', 'isx-tips-sim', 'isx-first', 'isx-insights', 'isx-tour', 'isx-simtour'].forEach(k => localStorage.setItem(k, 'off')); localStorage.setItem('isx-intro-off', '1'); } catch (e) {} });
    if (opts.block) await c.route('**/data/switches.json', r => r.abort());
    const p = await c.newPage(); p._errs = []; p.on('pageerror', e => p._errs.push(String(e).slice(0, 200)));
    p.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_|Failed to load resource/.test(m.text())) p._errs.push('console: ' + m.text().slice(0, 200)); });
    await p.goto(base + hash, { waitUntil: 'load' });
    await p.waitForFunction(o => window.ISX && ISX.booted && ISX.scenes && (o || ISX.scenes.sw || ISX.scenes.swErr), !!opts.block, { timeout: 60000 });
    await p.waitForTimeout(opts.wait || 900);
    return p;
  };
  const js = (p, f, a) => p.evaluate(f, a);
  const hero = p => js(p, () => document.querySelector('#isx-b3-gal .b3hero h2').textContent);
  const info = p => js(p, () => ({ ord: ISX.sc.order(), ids: ISX.sc.STORIES.map(s => s.id), names: ISX.sc.STORIES.map(s => { const i = s.h.indexOf(': '); return i > 0 ? s.h.slice(0, i) : s.t; }), steps: ISX.sc.STORIES.map(s => s.steps.length), choke: ISX.sc.STORIES.map(s => s.steps.filter(x => x.choke).length) }));
  const enter = async (p, i, step) => { await js(p, ([i, step]) => ISX.sc.pick(i, step == null ? undefined : { step }), [i, step]); await p.waitForTimeout(120); if (step == null) { await js(p, () => document.querySelector('#isx-b3-gal .b3cta').click()); await p.waitForTimeout(120); } };

  /* ================= 1. the gallery ================= */
  if (want(1)) {
    const p = await page('#scenarios'), I = await info(p), seen = { next: new Set(), prev: new Set(), key: new Set(), rail: [] };
    for (let k = 0; k < 14; k++) { seen.next.add(await hero(p)); await p.click('#isx-b3-gal [data-b3="next"]'); await p.waitForTimeout(60); }
    const round = await hero(p);
    for (let k = 0; k < 14; k++) { await p.click('#isx-b3-gal [data-b3="prev"]'); await p.waitForTimeout(60); seen.prev.add(await hero(p)); }
    for (let k = 0; k < 14; k++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(60); seen.key.add(await hero(p)); }
    for (let i = 0; i < 14; i++) { await p.click(`#isx-b3-gal .b3chip[data-b3c="${i}"]`); await p.waitForTimeout(60); seen.rail.push([await hero(p), await js(p, i => document.querySelector(`#isx-b3-gal .b3chip[data-b3c="${i}"]`).getAttribute('aria-current'), i)]); }
    const g = await js(p, () => ({ sy: scrollY, top: document.scrollingElement.scrollTop, mode: ISX.scenes.mode, bar: document.getElementById('isx-sc-bar').hidden, map: document.querySelectorAll('#isx-b3-map svg path.sland').length, pills: [...document.querySelectorAll('#isx-b3-gal .b3pills span')].map(e => e.textContent) }));
    ok('gallery: Prev · Next show each of the 14 cases and come round', seen.next.size === 14 && seen.prev.size === 14 && round === [...seen.next][0], { n: seen.next.size, p: seen.prev.size, round });
    ok('gallery: ← → show each of the 14 cases', seen.key.size === 14, seen.key.size);
    ok('gallery: every thumbnail in the rail shows its case and is marked as the one in hand', seen.rail.every((r, i) => r[0] === I.names[i] && r[1] === 'true'), seen.rail.filter((r, i) => r[0] !== I.names[i]));
    ok('gallery: the page never scrolls (scrollY stays 0); the bar is hidden; the case’s own map is the backdrop', g.sy === 0 && g.top === 0 && g.bar && g.mode === 'gallery' && g.map > 0 && g.pills.length === 3, g);
    await p.context().close();
    /* with motion on the rail scrolls smoothly inside itself; the page still does not move. And on a phone. */
    for (const [w, h, touch] of [[1280, 720, false], [390, 844, true]]) {
      const q = await page('#scenarios', { w, h, touch, motion: true });
      await js(q, () => { const c = document.querySelectorAll('#isx-b3-gal .b3chip'); c[c.length - 1].click(); }); await q.waitForTimeout(1300);
      const r = await js(q, () => ({ sy: scrollY, rail: document.querySelector('#isx-b3-gal .b3rail').scrollLeft, ox: document.documentElement.scrollWidth - innerWidth, h: document.querySelector('#isx-b3-gal .b3hero h2').textContent }));
      ok(`gallery ${w}×${h}: picking the last thumbnail scrolls the rail, not the page`, r.sy === 0 && r.rail > 50 && r.ox <= 0 && r.h === 'Huawei', r);
      ok(`gallery ${w}×${h}: no page errors`, q._errs.length === 0, q._errs); await q.context().close();
    }
  }

  /* ================= 2. the entry ================= */
  if (want(2)) {
    const p = await page('#scenarios', { motion: true });
    const fp = () => js(p, () => { const st = document.getElementById('isx-sc3'), cs = getComputedStyle(st); return JSON.stringify({ mode: st.dataset.mode, m: ISX.scenes.mode, busy: ISX.scenes.busy, step: ISX.sc.step, x: Math.round(+cs.getPropertyValue('--b3x')), y: Math.round(+cs.getPropertyValue('--b3y')), z: (+cs.getPropertyValue('--b3z')).toFixed(3), card: document.querySelector('#isx-b3-card h2').textContent, veil: document.getElementById('isx-b3-veil').className, tc: document.getElementById('isx-b3-tc').className, gal: document.getElementById('isx-b3-gal').className, hud: getComputedStyle(document.getElementById('isx-b3-hud')).opacity, on: document.querySelectorAll('#isx-b3-world .on').length, bar: !document.getElementById('isx-sc-bar').hidden, tex: document.getElementById('isx-b3-tex').dataset.t, wm: document.getElementById('isx-b3-wm').textContent, cut: st.dataset.cut || '' }); });
    const run = async (skipAt, how) => { await p.click('#isx-b3-gal .b3cta'); let mid = null; if (skipAt != null) { await p.waitForTimeout(skipAt); mid = await js(p, () => ({ m: ISX.scenes.mode, busy: ISX.scenes.busy, on: [...document.querySelectorAll('#isx-b3-world [data-s]')].filter(e => { const c = getComputedStyle(e); return c.visibility !== 'hidden' && +c.opacity > .01; }).length, hud: getComputedStyle(document.getElementById('isx-b3-hud')).visibility, sc: getComputedStyle(document.querySelector('#isx-sc3 .b3sc')).opacity })); if (how === 'key') await p.keyboard.press('Shift'); else await p.mouse.click(720, 300); await p.waitForTimeout(1500); } else await p.waitForTimeout(5200); const f = await fp(); await p.keyboard.press('Escape'); await p.waitForTimeout(1400); return [f, mid]; };
    const [full] = await run(null), [s03, m03] = await run(300, 'click'), [s15, m15] = await run(1500, 'key');
    ok('entry: the same end state watched to the end, skipped at 0.3 s (a click) and skipped at 1.5 s (a key)', full === s03 && full === s15 && /"m":"scene"/.test(full) && /"busy":false/.test(full) && /"step":0/.test(full), { full, s03, s15 });
    ok('entry: while it plays nothing of the scene is visible and the scene’s controls are out of reach', [m03, m15].every(m => m.m === 'entering' && m.busy && m.on === 0 && m.hud === 'hidden' && +m.sc < .05), { m03, m15 });
    ok('entry: no page errors', p._errs.length === 0, p._errs); await p.context().close();
    const q = await page('#scenarios');
    const rm = await js(q, () => { document.querySelector('#isx-b3-gal .b3cta').click(); return { m: ISX.scenes.mode, busy: ISX.scenes.busy, veil: document.getElementById('isx-b3-veil').className, tc: document.getElementById('isx-b3-tc').className, step: ISX.sc.step, card: document.querySelector('#isx-b3-card h2').textContent }; });
    ok('entry under reduced motion: skipped (no iris, no title card); the scene stands at step 1 at once', rm.m === 'scene' && !rm.busy && rm.veil === 'b3veil' && rm.tc === 'b3tc' && rm.step === 0 && rm.card.length > 3, rm);
    await q.context().close();
  }

  /* ================= 3, 4, 5, 6, 9, 10: every case, every step, at two sizes ================= */
  if ([3, 4, 5, 6, 9, 10].some(want)) {
    for (const [w, h] of SIZES) {
      const p = await page('#scenarios', { w, h }), I = await info(p), bad = { off: [], outside: [], under: [], early: [], missing: [], tab: [], same: [], tex: [], title: [], fit: [], box: [], other: [], nodes: [], back: [], gal: [] };
      let toggles = 0, sw = 0, states = 0;
      for (const i of I.ord) {
        const id = I.ids[i];
        await enter(p, i); let first = null;
        for (let n = 0; n <= I.steps[i]; n++) {
          const o = await js(p, probe); states++;
          const tag = id + ' ' + (n + 1);
          if (o.n !== n) bad.title.push(tag + ' is at step ' + (o.n + 1));
          if (o.off.length) bad.off.push(tag + ' ' + o.off.join(',')); if (o.outside.length) bad.outside.push(tag + ' ' + o.outside.join(',')); if (o.under.length) bad.under.push(tag + ' ' + o.under.join(','));
          if (o.early.length) bad.early.push(tag + ' ' + o.early.slice(0, 3).join(' | ')); if (o.missing.length) bad.missing.push(tag + ' ' + o.missing.slice(0, 3).join(' | ')); if (o.tab.length) bad.tab.push(tag + ' ' + o.tab.join(','));
          if (!o.same) bad.same.push(tag); if (!o.nodes) bad.nodes.push(tag);
          if (n < I.steps[i]) { if (o.instr ? o.tex !== o.instr || !o.texBg : o.choke ? o.tex !== 'control' : o.tex !== o.link || !o.texBg) bad.tex.push(tag + ' ' + o.tex + ' for ' + (o.instr || o.link)); if (o.title !== o.wantTitle || !o.cap || o.cap.length > 125) bad.title.push(tag + ' “' + o.title + '” ' + o.cap.length); } else if (o.tex !== 'end') bad.tex.push(tag + ' close: ' + o.tex);
          if (!o.fit) bad.fit.push(tag + ' ' + o.fitWhy.join('/'));
          if (o.other) bad.other.push(tag);
          if (!first) first = o; else if (o.bk.some((v, k) => Math.abs(v - first.bk[k]) > 1) || o.nx.some((v, k) => Math.abs(v - first.nx[k]) > 1)) bad.box.push(tag + ' ' + o.bk.join(',') + ' | ' + o.nx.join(','));
          if (n === I.steps[i]) { toggles += o.tgOn; if (o.tgOn !== I.choke[i] || o.tgAll !== I.choke[i]) bad.nodes.push(tag + ' toggles ' + o.tgOn + '/' + o.tgAll + ' for ' + I.choke[i] + ' chokepoints'); sw += await js(p, id => ISX.scenes.sw.SW.filter(q => q.case === id).length, id); }
          if (n < I.steps[i]) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(70); }
        }
        /* one step back: what the step after brought is hidden again */
        await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(90); const bk = await js(p, probe); if (bk.early.length || bk.n !== I.steps[i] - 1) bad.back.push(id + ' ' + bk.early.slice(0, 2).join(' | '));
        await p.keyboard.press('ArrowRight'); await p.waitForTimeout(60);
        /* Next at the close: the next case's gallery view */
        await p.keyboard.press('ArrowRight'); await p.waitForTimeout(140);
        const g = await js(p, () => { const st = document.getElementById('isx-sc3'), R = st.getBoundingClientRect(), hr = document.querySelector('#isx-b3-gal .b3hero').getBoundingClientRect(), rl = document.querySelector('#isx-b3-gal .b3rail').getBoundingClientRect(), f = document.getElementById('isx-frame').getBoundingClientRect(), top = parseFloat(getComputedStyle(st).getPropertyValue('--b3top')); return { m: ISX.scenes.mode, step: ISX.sc.step, idx: ISX.sc.idx, fit: f.height <= innerHeight + .5 && scrollY === 0 && hr.top >= R.top + top - 14 && hr.bottom <= rl.top + 12 && rl.bottom <= R.bottom + .5, why: [Math.round(hr.top - R.top), top, Math.round(hr.bottom), Math.round(rl.top)], other: /other outcome/i.test(st.textContent) }; });
        if (g.m !== 'gallery' || g.step !== -1 || g.idx !== I.ord[(I.ord.indexOf(i) + 1) % 14]) bad.gal.push(id + ' → ' + JSON.stringify(g));
        if (!g.fit) bad.fit.push(id + ' gallery of the next case ' + g.why.join('/')); if (g.other) bad.other.push(id + ' gallery');
      }
      const T = `${w}×${h}`;
      if (want(3)) { ok(`play ${T}: all 14 cases from step 1 to the close and on to the next case’s gallery, without errors (${states} states)`, p._errs.length === 0 && !bad.gal.length && !bad.title.length, { errs: p._errs, gal: bad.gal, title: bad.title });
        ok(`play ${T}: a toggle for every chokepoint step, as many as the switch list holds: 24`, toggles === 24 && sw === 24 && !bad.nodes.length, { toggles, sw, nodes: bad.nodes }); }
      if (want(4)) { ok(`reveal ${T}: at step n nothing of a later step is visible, and what has been reached is`, !bad.early.length && !bad.missing.length, { early: bad.early.slice(0, 6), missing: bad.missing.slice(0, 6) });
        ok(`reveal ${T}: Tab reaches nothing in the scene, and of the strip’s steps none that lie ahead`, !bad.tab.length, bad.tab.slice(0, 6));
        ok(`reveal ${T}: one step back hides again what the step after had brought`, !bad.back.length, bad.back); }
      if (want(5)) { ok(`place ${T}: every node sits at the projection of its STORIES position under the transform in hand (±1 px)`, !bad.off.length, bad.off.slice(0, 8));
        ok(`place ${T}: the map and the overlay carry the same transform at every step`, !bad.same.length, bad.same.slice(0, 6));
        ok(`place ${T}: every node of the case is inside the stage and outside the card at every step`, !bad.outside.length && !bad.under.length, { outside: bad.outside.slice(0, 8), under: bad.under.slice(0, 8) });
        ok(`place ${T}: the texture is the one for the step: the switch’s instrument, or the kind of link`, !bad.tex.length, bad.tex.slice(0, 8)); }
      if (want(6)) ok(`${T}: no “Other outcome” and no flip control anywhere in Scenarios`, !bad.other.length, bad.other.slice(0, 6));
      if (want(9)) ok(`one screen ${T}: gallery, every step, every switch step and the close of all 14 cases fit; the page does not scroll, the card does not scroll inside itself`, !bad.fit.length, bad.fit.slice(0, 8));
      if (want(10)) ok(`strip ${T}: Back and Next keep the same box (±1 px) through every step and the close of every case`, !bad.box.length, bad.box.slice(0, 6));
      await p.context().close();
    }
    /* with motion on: the map and the nodes move as one during a step's glide; no class is added and then removed within a step;
       hover lights nothing */
    if (want(4) || want(5)) {
      const p = await page('#scenarios', { motion: true }); await enter(p, 0); await p.waitForTimeout(250); await p.keyboard.press('Shift'); await p.waitForTimeout(900);
      for (let k = 0; k < 4; k++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(350); }
      await p.waitForTimeout(1700);
      await js(p, () => { window.__mut = {}; window.__mo = new MutationObserver(ms => ms.forEach(m => { const e = m.target; if (!e.__k) e.__k = (window.__kn = (window.__kn || 0) + 1) + ':' + e.tagName + '.' + (e.id || e.getAttribute('data-n') || e.getAttribute('data-s') || ''); const k = e.__k; (window.__mut[k] = window.__mut[k] || [m.oldValue || '']).push(e.getAttribute('class') || ''); })); window.__mo.observe(document.getElementById('isx-sc3'), { attributes: true, attributeFilter: ['class'], attributeOldValue: true, subtree: true }); });
      await p.keyboard.press('ArrowRight');   /* step 6: the first switch */
      const mids = []; for (const t of [200, 300, 400]) { await p.waitForTimeout(t); mids.push(await js(p, () => [getComputedStyle(document.getElementById('isx-b3-map')).transform, getComputedStyle(document.getElementById('isx-b3-world')).transform])); }
      await p.waitForTimeout(2300);
      const mut = await js(p, () => { window.__mo.disconnect(); const bad = []; Object.keys(window.__mut).forEach(k => { const seq = window.__mut[k].map(c => c.split(/\s+/).filter(Boolean).sort().join(' ')); for (let a = 0; a < seq.length; a++) for (let b = a + 2; b < seq.length; b++) if (seq[a] === seq[b] && seq[a + 1] !== seq[a]) bad.push(k + ': ' + seq.join(' → ')); }); return { bad: [...new Set(bad)], n: Object.keys(window.__mut).length }; });
      const live = await js(p, () => ({ step: ISX.sc.step, st: [...document.querySelectorAll('#isx-b3-world .tg.on')].map(t => t.dataset.st + getComputedStyle(t.querySelector('.kn')).transform), anims: document.getAnimations().filter(a => a.effect && a.effect.target && document.getElementById('isx-sc3').contains(a.effect.target) && !(a instanceof CSSTransition) && !(a instanceof CSSAnimation)).length }));
      ok('motion: the map and the overlay move as one while a step glides', mids.every(m => m[0] === m[1]) && new Set(mids.map(m => m[0])).size > 1, mids.map(m => m[0] === m[1]));
      ok('motion: arriving at a switch, no class is added and then removed within the step (the moment plays as Web Animations)', mut.bad.length === 0 && mut.n > 0, mut);
      ok('motion: after the switch moment the toggle stands off', live.step === 5 && live.st.length === 1 && /^off/.test(live.st[0]) && /-10/.test(live.st[0]), live);
      const hov = await js(p, () => { const b = document.querySelector('#isx-b3-world .nd.on .bd').getBoundingClientRect(); const e = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return { inScene: !!e && document.getElementById('isx-b3-world').contains(e), pe: getComputedStyle(document.querySelector('#isx-sc3 .b3sc')).pointerEvents }; });
      ok('hover lights nothing: the scene takes no pointer', !hov.inScene && hov.pe === 'none', hov);
      await p.context().close();
    }
  }

  /* ================= 7. the drawer of every switch step ================= */
  if (want(7)) {
    const p = await page('#scenarios'), I = await info(p), bad = []; let n = 0;
    const SW = await js(p, () => ISX.scenes.sw.SW.map(w => ({ id: w.id, c: w.case, s: w.step, instr: ISX.scenes.sw.INSTR[w.instr], holder: w.holder, cut: w.cut })));
    for (const w of SW) {
      await enter(p, I.ids.indexOf(w.c), w.s - 1); await p.waitForTimeout(80);
      await js(p, () => document.querySelector('#isx-b3-card .b3more').click()); await p.waitForTimeout(60);
      const d = await js(p, () => { const D = document.getElementById('isx-b3-drawer'), t = f => (D.querySelector(`[data-f="${f}"]`) || {}).textContent || ''; return { open: D.classList.contains('on') && !D.inert, sheet: ISX.scenes.sheet, dt: [...D.querySelectorAll('.b3dl dt')].map(e => e.textContent), instr: t('instr'), holder: t('holder'), cut: t('cut'), src: (D.querySelector('.b3src') || {}).textContent || '', h2: D.querySelector('h2').textContent, focus: D.contains(document.activeElement), lay: !!D.querySelector('.b3lay b'), list: D.querySelectorAll('.b3sl button').length, other: /other outcome|map’s reading/i.test(D.textContent) }; });
      n++;
      if (!(d.open && d.sheet === 'drawer' && ['Instrument', 'Held by', 'What it cuts'].every(k => d.dt.includes(k)) && d.instr === w.instr && d.holder.includes(w.holder) && d.cut === w.cut && d.focus && d.lay && /link not stored/.test(d.src) && !d.other)) bad.push(w.id + ' ' + JSON.stringify(d).slice(0, 260));
      await p.keyboard.press('Escape'); await p.waitForTimeout(50);
      const c = await js(p, () => ({ sheet: ISX.scenes.sheet, inert: document.getElementById('isx-b3-drawer').inert, m: ISX.scenes.mode, focus: (document.activeElement.className || '') }));
      if (c.sheet || !c.inert || c.m !== 'scene' || !/b3more/.test(c.focus)) bad.push(w.id + ' close ' + JSON.stringify(c));
      await p.keyboard.press('Escape'); await p.waitForTimeout(60);
    }
    ok('drawer: on each of the 24 switch steps it lists Instrument, Held by and What it cuts as switches.json has them; Esc closes it and the focus returns', n === 24 && !bad.length, bad.slice(0, 4));
    /* a plain step and the close */
    await enter(p, 0); await js(p, () => document.querySelector('#isx-b3-hud [data-b3="read"]').click()); await p.waitForTimeout(60);
    const pl = await js(p, () => { const D = document.getElementById('isx-b3-drawer'); return { sw: !!D.querySelector('.b3dl'), text: D.textContent.includes(ISX.sc.STORIES[0].steps[0].text), src: /Source: .*link not stored/.test(D.querySelector('.b3src').textContent), hs: [...D.querySelectorAll('h2, h3')].map(e => e.tagName + ':' + e.textContent) }; });
    await js(p, () => document.querySelector('#isx-b3-drawer [data-b3go="7"]').click()); await p.waitForTimeout(80);
    const jump = await js(p, () => ({ step: ISX.sc.step, h2: document.querySelector('#isx-b3-drawer h2').textContent, sw: !!document.querySelector('#isx-b3-drawer .b3dl') }));
    ok('drawer: a plain step has its full text and source and no switch block; a step picked in its list is shown at once', !pl.sw && pl.text && pl.src && pl.hs[0].startsWith('H2') && jump.step === 7 && jump.sw && jump.h2 === 'The switch works both ways', { pl, jump });
    ok('drawer: no page errors', p._errs.length === 0, p._errs); await p.context().close();
  }

  /* ================= 8. the ledger ================= */
  if (want(8)) {
    const p = await page('#scenarios'), I = await info(p), bad = [];
    await p.click('#isx-b3-gal [data-b3="ledger"]'); await p.waitForTimeout(100);
    const L = await js(p, () => { const SW = ISX.scenes.sw.SW, c = { all: SW.length, usstate: SW.filter(w => w.type === 'state' && w.origin === 'US').length, usfirm: SW.filter(w => w.type === 'private' && w.origin === 'US').length, other: SW.filter(w => w.origin === 'other').length, joint: SW.filter(w => w.type === 'joint' || w.origin === 'mixed').length };
      const el = document.getElementById('isx-b3-ledger'); return { want: c, chips: Object.fromEntries([...el.querySelectorAll('[data-b3f]')].map(b => [b.dataset.b3f, +b.querySelector('b').textContent])), cards: [...el.querySelectorAll('.b3lc')].map(b => b.dataset.sw + '@' + b.dataset.b3j), h2: el.querySelector('h2').textContent, open: el.classList.contains('on') && !el.inert, focus: el.contains(document.activeElement), sy: scrollY, under: document.querySelector('#isx-root .hud-top').inert }; });
    ok('ledger: “All 24 switches”, 24 cards, and the filter counts are those worked out from the switch list (24 · 12 · 4 · 5 · 3)', L.open && L.h2 === 'All 24 switches' && L.cards.length === 24 && JSON.stringify(L.chips) === JSON.stringify(L.want) && L.want.usstate + L.want.usfirm + L.want.other + L.want.joint === 24 && L.focus && L.sy === 0 && L.under, L);
    for (const f of ['usstate', 'usfirm', 'other', 'joint']) { await p.click(`#isx-b3-ledger [data-b3f="${f}"]`); await p.waitForTimeout(40); const n = await js(p, () => document.querySelectorAll('#isx-b3-ledger .b3lc:not(:disabled)').length); if (n !== L.want[f]) bad.push('filter ' + f + ' leaves ' + n); }
    await p.click('#isx-b3-ledger [data-b3f="all"]'); await p.waitForTimeout(40);
    for (const c of L.cards) {
      const [sw, at] = c.split('@'), [ci, si] = at.split(':').map(Number);
      await js(p, sw => document.querySelector(`#isx-b3-ledger .b3lc[data-sw="${sw}"]`).click(), sw); await p.waitForTimeout(110);
      const r = await js(p, () => ({ m: ISX.scenes.mode, idx: ISX.sc.idx, step: ISX.sc.step, sheet: ISX.scenes.sheet, chip: (document.querySelector('#isx-b3-card .b3chk') || {}).textContent, tex: document.getElementById('isx-b3-tex').dataset.t }));
      const w = await js(p, sw => { const w = ISX.scenes.sw.SW.find(x => x.id === sw); return { c: w.case, s: w.step, instr: w.instr }; }, sw);
      if (r.m !== 'scene' || r.sheet || r.idx !== ci || r.step !== si || I.ids[ci] !== w.c || si !== w.s - 1 || !r.chip || r.tex !== w.instr) bad.push(sw + ' → ' + JSON.stringify(r));
      await js(p, () => document.querySelector('#isx-b3-hud [data-b3="ledger"]').click()); await p.waitForTimeout(60);   /* the ledger opens from the scene too */
    }
    ok('ledger: each filter leaves its own cards; every card enters its case at its step, on the switch', !bad.length, bad.slice(0, 5));
    await p.keyboard.press('Escape'); await p.waitForTimeout(80);
    ok('ledger: Esc closes it; no page errors', await js(p, () => !ISX.scenes.sheet && document.getElementById('isx-b3-ledger').inert && !document.querySelector('#isx-root .hud-top').inert) && p._errs.length === 0, p._errs);
    await p.context().close();
    const q = await page('#scenarios', { motion: true });
    await q.click('#isx-b3-gal [data-b3="ledger"]'); await q.waitForTimeout(700); await q.click('#isx-b3-ledger .b3lc[data-sw="ukr-2"]'); await q.waitForTimeout(500);
    const mid = await js(q, () => ({ m: ISX.scenes.mode, busy: ISX.scenes.busy, step: ISX.sc.step })); await q.keyboard.press('Shift'); await q.waitForTimeout(900);
    const end = await js(q, () => ({ m: ISX.scenes.mode, step: ISX.sc.step, h2: document.querySelector('#isx-b3-card h2').textContent }));
    ok('ledger with motion on: a card plays the entry and lands on its switch’s step', mid.m === 'entering' && mid.busy && mid.step === 6 && end.m === 'scene' && end.step === 6 && end.h2 === 'Washington switches off', { mid, end });
    await q.context().close();
  }

  /* ================= 9 (the rest): the drawer and the ledger on one screen ================= */
  if (want(9)) {
    for (const [w, h] of SIZES) {
      const p = await page('#scenarios', { w, h }); await enter(p, 0, 6); await p.waitForTimeout(100);
      const fit = () => js(p, () => { const st = document.getElementById('isx-sc3').getBoundingClientRect(), f = document.getElementById('isx-frame').getBoundingClientRect(), s = document.querySelector('#isx-sc3 .b3sheet.on').getBoundingClientRect(); return { ok: f.height <= innerHeight + .5 && scrollY === 0 && s.top >= st.top - .5 && s.bottom <= st.bottom + .5 && s.left >= st.left - .5 && s.right <= st.right + .5 && document.documentElement.scrollWidth <= innerWidth, s: [s.top, s.bottom, st.top, st.bottom].map(Math.round) }; });
      await js(p, () => document.querySelector('#isx-b3-card .b3more').click()); await p.waitForTimeout(80); const d = await fit(); await p.keyboard.press('Escape');
      await js(p, () => document.querySelector('#isx-b3-hud [data-b3="ledger"]').click()); await p.waitForTimeout(80); const l = await fit();
      await js(p, () => { const e = document.getElementById('isx-b3-ledger'); e.scrollTop = 9999; }); const sy = await js(p, () => scrollY);
      ok(`one screen ${w}×${h}: the drawer and the ledger stay inside the stage and scroll inside themselves`, d.ok && l.ok && sy === 0, { d, l, sy });
      await p.context().close();
    }
    const q = await page('#scenarios', { w: 390, h: 844, touch: true }), I = await info(q), badp = [];
    for (const i of [0, 5, 6]) { await enter(q, i); for (let n = 0; n <= I.steps[i]; n++) { const r = await js(q, () => { const b = document.querySelector('#isx-sc-bar .rt').getBoundingClientRect(), c = document.getElementById('isx-b3-card').getBoundingClientRect(), cu = document.querySelector('#isx-sc-bar .rt-sp.c'), rr = document.querySelector('#isx-sc-bar .rt-route').getBoundingClientRect(), cr = cu ? cu.getBoundingClientRect() : null; return { ok: b.bottom <= innerHeight + 1 && b.left >= 0 && b.right <= innerWidth + .5 && c.bottom <= b.top + 1 && document.documentElement.scrollWidth <= innerWidth && (!cr || (cr.left >= rr.left - 1 && cr.right <= rr.right + 1)), v: [Math.round(b.bottom), innerHeight, Math.round(b.right), Math.round(c.bottom), Math.round(b.top)] }; }); if (!r.ok) badp.push(I.ids[i] + ' ' + (n + 1) + ' ' + r.v.join('/')); if (n < I.steps[i]) { await q.keyboard.press('ArrowRight'); await q.waitForTimeout(70); } } await q.keyboard.press('Escape'); await q.waitForTimeout(80); }
    ok('phone 390×844: the strip stays at the foot of the stage inside the screen, the step in hand in view, the card above it, no sideways scroll', !badp.length && q._errs.length === 0, { badp: badp.slice(0, 5), errs: q._errs });
    await q.context().close();
  }

  /* ================= 11. the switch list does not load ================= */
  if (want(11)) {
    const p = await page('#scenarios', { block: true });
    const g = await js(p, () => ({ err: ISX.scenes.swErr, h: document.querySelector('#isx-b3-gal .b3hero h2').textContent, chips: document.querySelectorAll('#isx-b3-gal .b3chip').length }));
    await enter(p, 0); for (let k = 0; k < 6; k++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(60); }
    const s = await js(p, () => ({ step: ISX.sc.step, h2: document.querySelector('#isx-b3-card h2').textContent, cap: document.querySelector('#isx-b3-card .b3cap').textContent.length, who: !!document.querySelector('#isx-b3-card .b3who'), chip: (document.querySelector('#isx-b3-card .b3chk') || {}).textContent, tg: document.querySelectorAll('#isx-b3-world .tg.on').length }));
    await js(p, () => document.querySelector('#isx-b3-hud [data-b3="ledger"]').click()); await p.waitForTimeout(80);
    const l = await js(p, () => document.getElementById('isx-b3-ledger').textContent);
    ok('without the switch list: the gallery and the scene still work (no holders), and the ledger says “The switch list could not load.”', g.err && g.h === 'Ukraine' && g.chips === 14 && s.step === 6 && s.h2 === 'Washington switches off' && s.cap > 20 && !s.who && s.chip === 'Switch' && s.tg === 2 && /The switch list could not load\./.test(l) && p._errs.length === 0, { g, s, l: l.slice(0, 80), errs: p._errs });
    await p.context().close();
  }

  /* ================= 12. counts ================= */
  if (want(12)) {
    const p = await page('#scenarios');
    const c = await js(p, () => { const S = ISX.sc.STORIES, d = ISX.scenes.sw; return { cases: S.length, steps: S.reduce((a, s) => a + s.steps.length, 0), choke: S.reduce((a, s) => a + s.steps.filter(x => x.choke).length, 0), sw: d.SW.length, match: d.SW.every(w => { const s = S.find(x => x.id === w.case); return s && s.steps[w.step - 1] && s.steps[w.step - 1].choke; }), caps: S.every(s => { const a = (d.cap && d.cap[s.id]) || (d.pic[s.id] && d.pic[s.id].cap); return a && a.length === s.steps.length && a.every(t => t.length > 10 && t.length <= 125 && !/—|"/.test(t)); }), cap110: S.filter(s => d.cap && d.cap[s.id]).every(s => d.cap[s.id].every(t => t.length <= 110)), short: d.SW.every(w => w.short && w.short.length <= 30), alt: !!(d.pic.ukr && d.pic.ukr.alt), note: '_note' in d }; });
    ok('counts: 14 scenarios, 99 steps, 24 chokepoints = 24 switches, each on a chokepoint step', c.cases === 14 && c.steps === 99 && c.choke === 24 && c.sw === 24 && c.match, c);
    ok('data: a one-line caption for every step (the 91 new ones at most 110 characters), a short holder name on every switch, no other outcomes in the file', c.caps && c.cap110 && c.short && !c.alt && !c.note, c);
    await p.context().close();
  }

  await b.close();
  console.log(fails ? `\n${fails} check(s) failed` : '\nall B3 checks pass');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
