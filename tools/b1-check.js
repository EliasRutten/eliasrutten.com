/* B1 checks: the one bar, Back and Next in one place, the lit marker, decisions and their chain reactions, actor plates
   without figures, the 19 indicators and their first steps, the Circuit's ring, and one screen without vertical scroll.
   Usage: node tools/b1-check.js [baseUrl] [--only=<n,n>]   — needs `python3 -m http.server 8731` at the repo root.
   Exits 1 on a failed check. The ten sections follow claude/handoffs/B1.md §4. */
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const base = args.find(a => /^https?:/.test(a)) || 'http://127.0.0.1:8731/imperial-stack/';
const only = (args.find(a => /^--only=/.test(a)) || '').replace('--only=', '').split(',').filter(Boolean).map(Number);
const want = n => !only.length || only.includes(n);
let fails = 0;
const ok = (name, cond, extra) => { if (!cond) fails++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra !== undefined && !cond ? '  → ' + JSON.stringify(extra).slice(0, 700) : '')); };

/* the first step of every indicator, first principles and guide (spec S1 §4.6) */
const FIRST = { ffr: [null, 5], res: [null, 3], bills: [7, 2], y10: [null, 5], mtg: [4, 22], yen: [null, 26], dxy: [null, 26], brent: [null, 28], move: [null, 5], off: [2, 1], teth: [7, 2], capex: [null, 7], bnd: [null, 9], ai: [6, 15], shr: [null, 16], con: [1, 18], save: [4, 23], pce: [null, 30], diesel: [null, 30] };
const SIZES = [[1440, 900, false], [1280, 760, false], [1024, 768, false], [390, 844, true]];

(async () => {
  const b = await chromium.launch();
  const page = async (hash, opts = {}) => {
    const c = await b.newContext({ viewport: { width: opts.w || 1440, height: opts.h || 900 }, deviceScaleFactor: 1, reducedMotion: opts.motion ? 'no-preference' : 'reduce', hasTouch: !!opts.touch, isMobile: !!opts.touch });
    const set = Object.assign({ 'isx-tips-globe': 'off', 'isx-tips-sim': 'off', 'isx-first': 'off', 'isx-insights': 'off', 'isx-tour': 'off', 'isx-sim-mode': 'story' }, opts.ls || {}), pos = opts.pos || null;
    await c.addInitScript(o => { try { if (!sessionStorage.getItem('__seeded')) { Object.keys(o.set).forEach(k => localStorage.setItem(k, o.set[k])); if (o.pos) sessionStorage.setItem('isx-sim-pos', o.pos); sessionStorage.setItem('__seeded', '1'); } } catch (e) {} }, { set, pos });
    const p = await c.newPage(); p._errs = []; p.on('pageerror', e => p._errs.push(String(e).slice(0, 200)));
    await p.goto(base + hash, { waitUntil: 'load' });
    await p.waitForFunction(() => window.ISX && ISX.booted, null, { timeout: 60000 });
    await p.waitForTimeout(opts.wait || 1500);
    return p;
  };
  const js = (p, f, a) => p.evaluate(f, a);
  const click = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); return !!e; }, sel);
  const right = async (p, ms = 220) => { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(ms); };
  const left = async (p, ms = 220) => { await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(ms); };
  /* where the guide is, and where Back, Next and the lit marker are */
  const state = p => js(p, () => {
    const S = ISX.sim, bar = document.getElementById('isx-s2bar'), r = e => { const q = e.getBoundingClientRect(); return [q.left, q.top, q.width, q.height].map(v => Math.round(v * 10) / 10); };
    const here = bar.querySelector('.rt-here'), cur = bar.querySelector('.rt-segs [aria-current="step"]'), vis = e => !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden' && +getComputedStyle(e).opacity > 0;
    const mid = e => { const q = e.getBoundingClientRect(); return q.left + q.width / 2; };
    const vals = {}; document.querySelectorAll('#isx-rmap [data-gv]').forEach(x => { vals[x.dataset.gv] = x.textContent.trim(); });
    return { line: S.line, beat: S.beat, ph: S.ph, c: S.c, pre: S.lines[S.line].pre, main: S.lines[S.line].main, n: S.lines[S.line].steps.length, bk: r(bar.querySelector('.rt-bk')), nx: r(bar.querySelector('.rt-nx')), nxt: bar.querySelector('.rt-nx').textContent.replace(/\s+/g, ' ').trim(),
      here: vis(here) && cur ? Math.round((mid(here) - mid(cur)) * 10) / 10 : null, hereT: here ? getComputedStyle(here).transitionDuration : '', cur: !!cur, vals, h3: (document.querySelector('#isx-sn-body h3') || {}).textContent || '' };
  });
  /* the whole guide: 7 reveals, 37 steps, and at each decision the card, the other path link by link, the crisis card */
  const walk = async (p, each) => {
    const out = []; const take = async tag => { const s = await state(p); s.tag = tag; out.push(s); if (each) await each(s); return s; };
    await click(p, '#isx-sn-body .s4go'); await p.waitForTimeout(350);
    for (let i = 0; i < 7; i++) { await take('reveal ' + (i + 1)); await right(p); }
    await click(p, '#isx-sn-body .sn-go'); await p.waitForTimeout(350);
    for (let guard = 0; guard < 120; guard++) {
      const s = await take('step'); s.tag = 'step ' + (s.beat + 1);
      if (s.beat >= s.n - 1) break;
      await right(p);
      let t = await state(p);
      if (t.ph === 'ask') {
        await take('decision after step ' + (s.beat + 1));
        await click(p, '#isx-sn-body [data-fk="alt"]'); await p.waitForTimeout(260);
        for (let k = 0; k < 8; k++) { t = await take('chain'); t.tag = t.ph === 'crisis' ? 'crisis after step ' + (s.beat + 1) : 'link ' + (t.c + 1) + ' after step ' + (s.beat + 1); if (t.ph === 'crisis') break; await right(p); }
        await right(p, 300);
      }
    }
    return out;
  };

  /* ================= 1. one bar in each tab ================= */
  if (want(1)) {
    for (const [hash, host, name] of [['#circuit', 'isx-tabs', 'Circuit'], ['#simulator', 'isx-s2bar', 'Simulator'], ['#scenarios', 'isx-sc-bar', 'Scenarios']]) {
      const p = await page(hash);
      const r = await js(p, id => { const h = document.getElementById(id), v = e => !!e && e.getClientRects().length > 0, x = e => e.getBoundingClientRect().left, d = document.getElementById('isx-dock');
        const bars = [...document.querySelectorAll('.rt-host .rt')].filter(v), bk = h.querySelector('.rt-bk'), nx = h.querySelector('.rt-nx'), rt = h.querySelector('.rt-route');
        return { bars: bars.length, mine: h.querySelectorAll('.rt').length, parts: [bk, nx, rt, d].every(v), order: v(bk) && v(nx) && v(rt) && v(d) && x(bk) < x(nx) && x(nx) < x(rt) && x(rt) < x(d), inBar: h.contains(d), docks: document.querySelectorAll('#isx-dock').length,
          links: [d.querySelector('a.dk-th') && d.querySelector('a.dk-th').href, d.querySelector('a.dk-bmc') && d.querySelector('a.dk-bmc').href], ids: ['isx-share', 'isx-sharepop', 'isx-fs'].map(i => document.querySelectorAll('#' + i).length === 1 && d.contains(document.getElementById(i))) }; }, host);
      ok(`bar (${name}): one bar on screen, in this tab’s own host`, r.bars === 1 && r.mine === 1, r);
      ok(`bar (${name}): Back, Next, the route and the dock, in that order, in one bar`, r.parts && r.order && r.inBar, r);
      ok(`bar (${name}): the dock is the page’s own (one #isx-dock, its links and ids unchanged)`, r.docks === 1 && r.links[0] === 'https://eliasrutten.substack.com/subscribe' && r.links[1] === 'https://www.buymeacoffee.com/ruttenelias' && r.ids.every(Boolean), r);
      ok(`bar (${name}): no page errors`, p._errs.length === 0, p._errs); await p.context().close();
    }
  }

  /* ================= 2, 3, 8. Back and Next stay put; the lit marker follows; indicators arrive at their step ================= */
  if (want(2) || want(3) || want(8)) {
    for (const [w, h, touch] of SIZES) {
      const p = await page('#simulator', { w, h, touch });
      const first = { pre: {}, main: {} };
      const rows = await walk(p, s => { if (s.ph) return; const k = s.pre ? 'pre' : s.main ? 'main' : null; if (!k) return; Object.keys(s.vals).forEach(id => { if (s.vals[id] && s.vals[id] !== '?' && first[k][id] == null) first[k][id] = s.beat + 1; }); });
      const n = { reveals: rows.filter(r => /^reveal/.test(r.tag)).length, steps: rows.filter(r => /^step/.test(r.tag)).length, asks: rows.filter(r => /^decision/.test(r.tag)).length, links: rows.filter(r => /^link/.test(r.tag)).length, crises: rows.filter(r => /^crisis/.test(r.tag)).length };
      ok(`walk (${w} px): 7 reveals, 37 steps, 3 decision cards, 10 chain links and 3 crisis cards`, n.reveals === 7 && n.steps === 37 && n.asks === 3 && n.links === 10 && n.crises === 3, n);
      if (want(2)) {
        const far = (a, c) => a.some((v, i) => Math.abs(v - c[i]) > 1), moved = rows.filter(r => far(r.bk, rows[0].bk) || far(r.nx, rows[0].nx)).map(r => [r.tag, r.bk.join(), r.nx.join()]);
        ok(`Back and Next (${w} px): the same box, within 1 px, on all ${rows.length} cards (Back ${rows[0].bk.join(', ')}; Next ${rows[0].nx.join(', ')})`, moved.length === 0, { first: [rows[0].bk, rows[0].nx], moved: moved.slice(0, 5) });
        ok(`Next (${w} px): held on every decision card; “Next in the chain” on a link; “Back to What happened” on a crisis card`, rows.every(r => /^decision/.test(r.tag) ? /^Your call ?Choose/i.test(r.nxt) : /^link/.test(r.tag) ? /^(Next in the chain|Chain ?Next)/i.test(r.nxt) : /^crisis/.test(r.tag) ? /^Back to/i.test(r.nxt) : true), rows.filter(r => /decision|link|crisis/.test(r.tag)).map(r => r.nxt).slice(0, 6));
      }
      if (want(3)) {
        const seen = rows.filter(r => r.here != null), off = seen.filter(r => Math.abs(r.here) > 2).map(r => [r.tag, r.here]);
        ok(`lit marker (${w} px): under the current mark, within 2 px, on ${seen.length} of ${rows.length} cards`, seen.length === rows.length && off.length === 0 && rows.every(r => r.cur), { seen: seen.length, off: off.slice(0, 6), noCur: rows.filter(r => !r.cur).map(r => r.tag).slice(0, 4) });
        ok(`lit marker (${w} px): cuts under reduced motion`, rows.every(r => r.hereT.split(',').every(t => parseFloat(t) === 0)), rows[0].hereT);
      }
      if (want(8) && w === 1440) {
        const S = await js(p, () => ISX.sim.indicators.map(I => ({ id: I.id, role: I.role, first: I.first })));
        const roles = ['set', 'conduit', 'stress', 'outcome'].map(r => S.filter(I => I.role === r).length);
        ok('indicators: 19, in four roles: 3 settings, 5 conduits, 1 stress gauge, 10 outcomes', S.length === 19 && roles.join() === '3,5,1,10', roles);
        const bad = S.filter(I => { const e = FIRST[I.id]; return !e || (I.first.pre || null) !== e[0] || (I.first.main || null) !== e[1]; }).map(I => [I.id, I.first]);
        ok('indicators: the first step of each, as the page computes it, is the one in the spec (§4.6)', bad.length === 0, bad);
        const shown = Object.keys(FIRST).filter(id => (first.pre[id] || null) !== FIRST[id][0] || (first.main[id] || null) !== FIRST[id][1]).map(id => [id, first.pre[id] || null, first.main[id] || null, FIRST[id]]);
        ok('indicators: on the map, each value first appears at that step, in first principles and in the guide', shown.length === 0, shown);
      }
      ok(`walk (${w} px): no page errors`, p._errs.length === 0, p._errs); await p.context().close();
    }
    if (want(3)) {
      const p = await page('#simulator', { motion: true, pos: '{"l":0,"b":9}' });
      ok('lit marker: slides (a transition on its transform) when motion is allowed', await js(p, () => { const s = getComputedStyle(document.querySelector('#isx-s2bar .rt-here')); return /transform/.test(s.transitionProperty) && s.transitionDuration.split(',').some(t => parseFloat(t) > 0); }));
      await p.context().close();
    }
  }

  /* ================= 4. → never chooses; swipes; ← returns to the decision ================= */
  if (want(4)) {
    const p = await page('#simulator', { pos: '{"l":0,"b":0}' });
    await right(p, 300);
    const a = await state(p); await right(p, 300); await right(p, 300);
    const c = await state(p), foc = await js(p, () => { const e = document.activeElement; return !!e && e.classList.contains('sn-opt') && e === document.querySelector('#isx-sn-body .sn-opt'); });
    ok('decision: → on a decision card does not leave it; it moves focus to option A', a.ph === 'ask' && c.ph === 'ask' && c.beat === 0 && foc, { a: a.ph, c: c.ph, foc });
    await click(p, '#isx-s2bar .rt-nx'); await p.waitForTimeout(250);
    ok('decision: the held Next does the same (it is not a dead button)', (await state(p)).ph === 'ask' && await js(p, () => document.querySelector('#isx-s2bar .rt-nx').getAttribute('aria-disabled') === 'true'));
    await left(p, 300);
    const back = await state(p);
    ok('decision: ← on a decision card goes back to the step before it', back.ph === null && back.beat === 0, back);
    await right(p, 300); await click(p, '#isx-sn-body [data-fk="real"]'); await p.waitForTimeout(300);
    const real = await state(p); await left(p, 300); const again = await state(p);
    ok('decision: ← from the step after a decision returns to the decision card, with the earlier call marked', real.beat === 1 && real.ph === null && again.ph === 'ask' && again.beat === 0 && await js(p, () => { const o = document.querySelector('#isx-sn-body .sn-opt.was'); return !!o && o.dataset.fk === 'real' && /your earlier call/.test(o.textContent); }), { real: [real.beat, real.ph], again: [again.beat, again.ph] });
    ok('decision: no page errors', p._errs.length === 0, p._errs); await p.context().close();
    /* a phone: a swipe is Next or Back on a step, and never a choice on a decision card */
    const q = await page('#simulator', { w: 390, h: 844, touch: true, pos: '{"l":0,"b":9}' });
    const swipe = (sel, dx) => js(q, ([s, d]) => { const el = document.querySelector(s), r = el.getBoundingClientRect(), y = Math.min(innerHeight - 140, Math.max(r.top + 30, 80)), x0 = d < 0 ? r.right - 40 : r.left + 40;
      const T = x => new Touch({ identifier: 1, target: el, clientX: x, clientY: y, pageX: x, pageY: y + scrollY });
      el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [T(x0)], targetTouches: [T(x0)], changedTouches: [T(x0)] }));
      el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], targetTouches: [], changedTouches: [T(x0 + d)] })); }, [sel, dx]);
    await js(q, () => document.getElementById('isx-snarr').scrollIntoView({ block: 'center' }));
    await swipe('#isx-snarr', -120); await q.waitForTimeout(300); const s1 = await state(q);
    await swipe('#isx-snarr', 120); await q.waitForTimeout(300); const s2 = await state(q);
    ok('swipe (390 px, touch): left on the card is Next, right is Back', s1.beat === 10 && s2.beat === 9, [s1.beat, s2.beat]);
    await swipe('#isx-b1play', -120); await q.waitForTimeout(300);
    ok('swipe: the in-play strip scrolls sideways and does not step', (await state(q)).beat === 9);
    await js(q, () => { const m = document.querySelector('#isx-s2bar .rt-nx'); m.focus(); }); for (let i = 0; i < 40 && (await state(q)).beat < 24; i++) { if ((await state(q)).ph === 'ask') { await click(q, '#isx-sn-body [data-fk="real"]'); await q.waitForTimeout(200); } else await right(q, 160); }
    await right(q, 350); await js(q, () => document.getElementById('isx-snarr').scrollIntoView({ block: 'center' }));
    const d0 = await state(q); await swipe('#isx-snarr', -120); await q.waitForTimeout(300); const d1 = await state(q);
    ok('swipe: on a decision card a swipe does not choose and does not leave', d0.ph === 'ask' && d1.ph === 'ask' && d1.beat === 24, [d0.ph, d1.ph, d1.beat]);
    await swipe('#isx-snarr', 120); await q.waitForTimeout(300); const d2 = await state(q);
    ok('swipe: right on a decision card goes back to the step before', d2.ph === null && d2.beat === 24, [d2.ph, d2.beat]);
    ok('swipe: no page errors', q._errs.length === 0, q._errs); await q.context().close();
  }

  /* ================= 5, 6. decisions keep their outcome to themselves; chains keep the measured values ================= */
  if (want(5) || want(6)) {
    const p = await page('#simulator', { pos: '{"l":0,"b":0}' });
    const DEC = await js(p, () => ISX.sim.decisions.map(D => Object.assign({}, D, { step: ISX.sim.lines[0].steps[D.at].t })));
    ok('decisions: three, before steps 2, 5 and 26; 10 chain links in all', DEC.length === 3 && DEC.map(D => D.at + 1).join() === '2,5,26' && DEC.reduce((a, D) => a + D.chain.length, 0) === 10, DEC.map(D => [D.at + 1, D.chain.length]));
    for (const D of DEC) {
      const tag = 'decision before step ' + (D.at + 1);
      await js(p, t => document.querySelector(`#isx-s2bar [data-rt-t="${t}"]`).click(), '0:' + (D.at - 1)); await p.waitForTimeout(350);
      const before = await state(p);
      await right(p, 350);
      if (want(5)) {
        const card = await js(p, D => { const b = document.getElementById('isx-sn-body'), t = b.textContent, opts = b.querySelector('.dopts'), lock = b.querySelector('.dlock');
          const leak = [D.step, D.crisis, 'So did Washington', 'Washington '].concat(D.chain.map(C => C.t)).filter(x => t.includes(x));
          if (lock) { lock.click(); lock.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); }
          return { h3: b.querySelector('h3').textContent, n: b.querySelectorAll('.sn-opt').length, letters: [...b.querySelectorAll('.sn-opt .dl')].map(x => x.textContent).join(''), order: [...b.querySelectorAll('.sn-opt')].map(x => x.dataset.fk).join(), labels: /What happened|Other outcome|Other path/.test(opts.textContent), kick: /What happened|Other/.test(b.querySelector('.s2k').textContent), leak, group: opts.getAttribute('role') === 'group' && opts.getAttribute('aria-label') === 'Your call',
            mech: !!b.querySelector('details.s2deep, .s2d'), lock: !!lock && lock.getAttribute('aria-disabled') === 'true' && /after you choose/.test(lock.textContent), ctx: !!b.querySelector('.dctx') && b.querySelector('.dctx p').textContent.length > 20, more: (b.querySelector('.dmore') || { getAttribute: () => null }).getAttribute('aria-expanded'), nx: document.querySelector('#isx-s2bar .rt-nx').textContent, ch: document.querySelectorAll('#isx-rmap .fe.ch, #isx-rmap .fe.off, #isx-rmap .gn.flare, #isx-rmap .gt.flare, #isx-rmap .gn.bor').length }; }, D);
        ok(`${tag}: “You’re at Treasury.”, two options A and B in the spec’s order (${D.ord.join(', ')}), in a group labelled “Your call”`, /You’re at Treasury\./.test(card.h3) && card.n === 2 && card.letters === 'AB' && card.order === D.ord.join() && card.group, card);
        ok(`${tag}: neither option is labelled, and neither outcome is on the card, in the bar’s Next or on the map`, !card.labels && !card.kick && card.leak.length === 0 && !card.nx.includes(D.step) && card.ch === 0, card);
        ok(`${tag}: “The mechanism” is locked (“after you choose”) and cannot open; the situation is on the card, with more behind one click`, !card.mech && card.lock && card.ctx && card.more === 'false', card);
        await click(p, '#isx-sn-body .dmore'); await p.waitForTimeout(150);
        ok(`${tag}: “More context” opens in the card and still names no outcome`, await js(p, D => { const b = document.getElementById('isx-sn-body'), m = document.getElementById('isx-dctx'); return b.querySelector('.dmore').getAttribute('aria-expanded') === 'true' && !m.hidden && m.textContent.length > 20 && ![D.step, D.crisis].concat(D.chain.map(C => C.t)).some(x => b.textContent.includes(x)); }, D));
        await click(p, '#isx-sn-body .dmore');
      }
      if (want(6)) {
        const sus = await state(p);
        ok(`${tag}: no value changes on the decision card (its subject shows “?” at most)`, Object.keys(before.vals).every(id => sus.vals[id] === before.vals[id] || (D.sus.includes(id) && sus.vals[id] === '?')), sus.vals);
        await click(p, '#isx-sn-body [data-fk="alt"]'); await p.waitForTimeout(350);
        const bad = []; let links = 0, crisis = null;
        for (let i = 0; i < 8; i++) {
          const s = await state(p), m = await js(p, () => ({ ch: [...document.querySelectorAll('#isx-rmap .fe.ch')].map(x => +x.dataset.e).sort((a, b) => a - b), off: [...document.querySelectorAll('#isx-rmap .fe.off')].map(x => +x.dataset.e).sort((a, b) => a - b), x: document.querySelectorAll('#isx-rmap .fx:not(.gh)').length,
            fl: Object.fromEntries([...document.querySelectorAll('#isx-rmap .gn, #isx-rmap .gt')].flatMap(g => g.dataset.ind.split(' ').map(id => [id, { arrow: g.querySelector('.garr').textContent, flare: g.classList.contains('flare'), bor: g.classList.contains('bor') }]))), pill: (document.getElementById('isx-sn-pill') || {}).textContent || '' }));
          const upto = s.ph === 'crisis' ? D.chain.length : s.c + 1, exp = D.chain.slice(0, upto), E = [...new Set(exp.flatMap(C => C.e))].sort((a, b) => a - b), O = [...new Set(exp.flatMap(C => C.off))].sort((a, b) => a - b), FL = Object.assign({}, ...exp.map(C => C.fl));
          if (m.ch.join() !== E.join() || m.off.join() !== O.join() || m.x !== O.length) bad.push([s.ph, s.c, 'relations', m.ch, m.off, m.x]);
          Object.keys(s.vals).forEach(id => { const was = before.vals[id]; if (was ? s.vals[id] !== was : s.vals[id] !== '') bad.push([s.ph, s.c, id, 'value', was, s.vals[id]]); });   /* reached: the measured value; not reached: none */
          Object.keys(FL).forEach(id => { const g = m.fl[id]; if (!g) return; if (!g.arrow) bad.push([s.ph, s.c, id, 'no arrow']); if (before.vals[id] ? !g.flare : !g.bor) bad.push([s.ph, s.c, id, before.vals[id] ? 'not flared' : 'not borrowed']); });
          if (s.ph === 'crisis') { crisis = s; break; }
          if (!s.h3.includes(D.chain[s.c].t)) bad.push([s.c, 'title', s.h3]);
          links++; await right(p, 320);
        }
        ok(`${tag}: its chain (${D.chain.length} links) walks to the crisis card “${D.crisis}”; each link draws its own relations, the ones not used with a cross`, links === D.chain.length && !!crisis && crisis.h3.includes(D.crisis) && !bad.some(x => x[2] === 'relations' || x[1] === 'title'), { links, bad: bad.slice(0, 4) });
        ok(`${tag}: in the chain, gauges under pressure keep their measured value and gain an arrow; borrowed gauges show no value`, bad.filter(x => x[2] !== 'relations' && x[1] !== 'title').length === 0, bad.slice(0, 6));
        ok(`${tag}: the crisis card carries a precedent with its source, and whose reading it is`, await js(p, () => { const b = document.getElementById('isx-sn-body'); return b.querySelectorAll('.dprec').length >= 1 && [...b.querySelectorAll('.dprec')].every(x => x.querySelector('.lsrc') && x.querySelector('.lsrc').textContent.length > 10) && !!b.querySelector('.dwho') && !b.querySelector('details.s2deep') && [...b.querySelectorAll('.lsrc a, .dss')].every(a => /^https:\/\//.test(a.href)); }));
        await click(p, '#isx-sn-body [data-dgo="real"]'); await p.waitForTimeout(350);
        const real = await state(p);
        ok(`${tag}: “Back to what happened” lands on step ${D.at + 1}, “${D.step}”, marked “What happened”`, real.ph === null && real.beat === D.at && real.h3.includes(D.step) && await js(p, () => /What happened/.test(document.querySelector('#isx-sn-body .s2k').textContent) && /You chose/.test((document.querySelector('#isx-sn-body .dyou') || {}).textContent || '')), [real.beat, real.ph, real.h3]);
        ok(`${tag}: nothing of the chain is left on the map`, await js(p, () => document.querySelectorAll('#isx-rmap .fe.ch, #isx-rmap .fe.off, #isx-rmap .fx:not(.gh), #isx-rmap .flare, #isx-rmap .bor, #isx-rmap .sus').length === 0));
      }
    }
    ok('decisions: no page errors', p._errs.length === 0, p._errs); await p.context().close();
  }

  /* ================= 7. actors carry no figures ================= */
  if (want(7)) {
    const p = await page('#simulator', { ls: { 'isx-sim-mode': 'full' } });
    const r = await js(p, () => { const pl = [...document.querySelectorAll('#isx-rmap .fn:not(.gn)')]; return { n: pl.length, more: pl.filter(g => g.textContent.trim() !== g.querySelector('.fnt').textContent.trim()).map(g => g.textContent.trim()), digits: pl.map(g => g.textContent.trim()).filter(t => /\d/.test(t)) }; });
    /* one actor has a number in its name: the top tenth of households, “Top 10%” */
    ok('actors: 26 plates, each its name and nothing else; no digit on any plate (“Top 10%” is a name)', r.n === 26 && r.more.length === 0 && r.digits.join() === 'Top 10%', r);
    await p.context().close();
  }

  /* ================= 9. the ring ================= */
  if (want(9)) {
    const p = await page('#circuit/ring', { wait: 2500 });
    const st = await js(p, () => [...document.querySelectorAll('#isx-ring .rg-st')].map(g => ({ input: g.classList.contains('in'), step: +g.dataset.rs, t: g.querySelector('.rg-t').textContent, v: g.querySelector('.rg-v').textContent, o: +getComputedStyle(g).opacity, anim: getComputedStyle(g).animationName })));
    ok('ring: 7 stations and 2 inputs', st.length === 9 && st.filter(s => s.input).length === 2, st.map(s => s.t));
    ok('ring: under reduced motion every station is lit at once', st.length > 0 && st.every(s => s.o > .95), st.map(s => s.o));
    const miss = [];
    for (const s of st) {
      if (!/\d/.test(s.v)) continue;
      await js(p, n => ISX.setStep ? ISX.setStep(n) : (location.hash = '#circuit/' + String(n).padStart(2, '0')), s.step); await p.waitForTimeout(450);
      const found = await js(p, v => { const fig = v.replace(/^≈/, ''), open = e => { e.querySelectorAll('details').forEach(d => { d.open = true; }); return e.textContent; }; const card = document.getElementById('isx-tournarr'), t = open(card) + ' ' + [...document.querySelectorAll('#isx-root .dblk, #isx-resbar')].map(e => e.textContent).join(' ');   /* the card, and its own “Go deeper” text */ return t.replace(/\s+/g, ' ').includes(fig); }, s.v);
      if (!found) miss.push([s.t, s.v, s.step]);
    }
    ok('ring: each figure is the one on its step’s card', miss.length === 0, miss);
    ok('ring: no page errors', p._errs.length === 0, p._errs); await p.context().close();
    /* opened the way a visitor opens it: Next from step 10 */
    const q = await page('#circuit/10', { motion: true, wait: 2500 });
    await q.keyboard.press('ArrowRight'); await q.waitForFunction(() => document.querySelectorAll('#isx-ring .rg-st:not(.in)').length === 7, null, { timeout: 20000 }); await q.waitForTimeout(400);
    const early = await js(q, () => [...document.querySelectorAll('#isx-ring .rg-st:not(.in)')].map(g => +(+getComputedStyle(g).opacity).toFixed(2)));
    await q.waitForTimeout(7000);
    const late = await js(q, () => [...document.querySelectorAll('#isx-ring .rg-st:not(.in)')].map(g => +getComputedStyle(g).opacity));
    ok('ring: with motion the stations light one after another, then all hold lit', early.length === 7 && early[early.length - 1] < .9 && late.every(o => o > .95), { early, late });
    await q.context().close();
  }

  /* ================= 10. one screen, no vertical scroll ================= */
  if (want(10)) {
    for (const [w, h] of [[1440, 900], [1280, 760]]) {
      const fit = (p, what) => js(p, () => { const c = document.getElementById('isx-cock'), bar = document.getElementById('isx-s2bar').getBoundingClientRect(), card = document.getElementById('isx-snarr').getBoundingClientRect(), box = document.getElementById('isx-sn-in'), led = document.getElementById('isx-b1led');
        const r = { stage: c.getBoundingClientRect().bottom <= innerHeight + 1 && c.scrollHeight <= c.clientHeight + 1, bar: bar.bottom <= innerHeight + 1, card: card.top >= 0 && card.bottom <= bar.top + 1, inner: box.scrollHeight <= box.clientHeight + 1, page: scrollY === 0 };
        if (led && !led.hidden) { const l = led.getBoundingClientRect(); r.led = l.top >= 0 && l.bottom <= bar.top + 1 && led.scrollHeight <= led.clientHeight + 1; }
        return r; });
      const all = r => Object.values(r).every(Boolean);
      const p = await page('#simulator', { w, h, pos: '{"l":0,"b":21}' });
      let r = await fit(p); ok(`one screen (${w}×${h}): a step`, all(r), r);
      await click(p, '#isx-b1ind'); await p.waitForTimeout(350);
      r = await fit(p); ok(`one screen (${w}×${h}): the ledger open`, all(r) && r.led === true, r);
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      for (const at of await js(p, () => ISX.sim.decisions.map(D => D.at))) {
        await js(p, t => document.querySelector(`#isx-s2bar [data-rt-t="${t}"]`).click(), 'd:0:' + (at - 1)); await p.waitForTimeout(450);
        r = await fit(p); ok(`one screen (${w}×${h}): the decision before step ${at + 1}`, all(r), r);
        await click(p, '#isx-sn-body [data-fk="alt"]'); await p.waitForTimeout(450);
        for (let i = 0; i < 8; i++) { const s = await state(p); r = await fit(p); ok(`one screen (${w}×${h}): ${s.ph === 'crisis' ? 'the crisis card' : 'chain link ' + (s.c + 1)} before step ${at + 1}`, all(r), r); if (s.ph === 'crisis') break; await right(p, 420); }
      }
      ok(`one screen (${w}×${h}): no page errors`, p._errs.length === 0, p._errs); await p.context().close();
      const q = await page('#circuit/ring', { w, h, wait: 2500 });
      r = await js(q, () => { const v = e => !!e && e.getClientRects().length > 0, bar = document.getElementById('isx-tabs').getBoundingClientRect(), ring = document.getElementById('isx-ring'), st = [...document.querySelectorAll('#isx-ring .rg-st')].map(g => g.getBoundingClientRect());
        return { ring: v(ring) && st.length === 9, bar: bar.bottom <= innerHeight + 1, inside: st.every(q => q.top >= 0 && q.bottom <= bar.top + 1 && q.left >= 0 && q.right <= innerWidth), page: scrollY === 0, frame: document.getElementById('isx-scene-map').getBoundingClientRect().bottom <= innerHeight + 1 }; });
      ok(`one screen (${w}×${h}): the Circuit’s ring, every station above the bar`, Object.values(r).every(Boolean), r);
      await q.context().close();
    }
  }

  await b.close();
  console.log(fails ? `\n${fails} check(s) failed` : '\nall B1 checks pass');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
