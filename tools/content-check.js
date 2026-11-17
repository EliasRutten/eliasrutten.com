/* Content build: checks on what the round added (14 Nov 2026).
   Usage: node tools/content-check.js [baseUrl]   — needs `python3 -m http.server 8731` at the repo root. Exits 1 on a failed check.
   1 counts · 2 every relation id resolves · 3 nothing shown before its step · 4 every figure has a date and a source ·
   5 every flare direction matches its gauge · 6 the doors open and close by keyboard and by touch · 7 the tour runs (from the entry's pill) and restarts ·
   8 the locks · 9 (tiers build B) the copy round's three rules: a term is defined where each route first uses it, each primer screen and
   reveal stands alone, no “map’s reading” hedges or intent disclaimers. */
const { chromium } = require('playwright');
const base = process.argv.slice(2).find(a => /^https?:/.test(a)) || 'http://127.0.0.1:8731/imperial-stack/';
let pass = 0, fail = 0;
const ok = (c, t, x) => { if (c) pass++; else { fail++; console.log('FAIL  ' + t + (x ? '  ' + x : '')); } };
const OFF = ['isx-tips-globe', 'isx-tour', 'isx-first', 'isx-insights', 'isx-simtour'];

(async () => {
  const b = await chromium.launch();
  const mk = async (opt, mode, tourOn) => {
    const c = await b.newContext(Object.assign({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, opt));
    await c.addInitScript(([m, off, t]) => { try { off.filter(k => !(t && k === 'isx-simtour')).forEach(k => localStorage.setItem(k, 'off')); localStorage.setItem('isx-intro-off', '1'); if (m) localStorage.setItem('isx-sim-mode', m); } catch (e) {} }, [mode, OFF, tourOn]);
    const p = await c.newPage(); p._errs = [];
    p.on('pageerror', e => p._errs.push(String(e.message).slice(0, 200))); p.on('console', m => { if (m.type() === 'error') p._errs.push(m.text().slice(0, 200)); });
    await p.goto(base + '#simulator', { waitUntil: 'load' });
    await p.waitForFunction(() => window.ISX && ISX.booted && ISX.views && ISX.simtour, null, { timeout: 90000 });
    await p.waitForTimeout(500);
    return p;
  };

  /* ---------- 1, 2: counts, and every relation id resolves ---------- */
  let p = await mk({}, 'full');
  const C = await p.evaluate(() => { const S = ISX.sim, g = new Set(S.gauges), nodes = [...document.querySelectorAll('#isx-rmap .fn')].map(e => e.dataset.n);
    return { actors: nodes.filter(n => !g.has(n)).length, gauges: g.size, relations: S.relations.length, levers: document.querySelectorAll('#isx-cock .lv').length, indicators: S.indicators.length,
      plays: document.querySelectorAll('#isx-cock .pchip').length, steps: S.lines[0].steps.length, pre: S.lines.find(L => L.pre).steps.length, gnd: S.lines.find(L => L.gnd).steps.length, decisions: S.decisions.length, links: S.decisions.reduce((a, d) => a + d.chain.length, 0),
      crises: S.decisions.filter(d => d.crisis).length, views: ISX.views.ids.length, badRel: S.decisions.flatMap(d => d.chain.flatMap(c => [...c.e, ...c.off])).filter(i => !(i >= 0 && i < S.relations.length)).length,
      badNode: S.relations.filter(r => !nodes.includes(r[0]) || !nodes.includes(r[1])).length, badInd: S.decisions.flatMap(d => d.chain.flatMap(c => Object.keys(c.fl))).filter(id => !S.indicators.some(I => I.id === id)).length,
      lines: S.lines.length, emptyChain: S.decisions.flatMap(d => d.chain).filter(c => !c.e.length && !c.off.length).length }; });
  console.log('counts  ' + JSON.stringify(C));
  const EXP = { actors: 29, gauges: 8, relations: 75, levers: 17, indicators: 24, plays: 6, steps: 43, pre: 10, gnd: 12, decisions: 7, links: 37, crises: 7, views: 3 };
  Object.keys(EXP).forEach(k => ok(C[k] === EXP[k], 'count ' + k, C[k] + ' (expected ' + EXP[k] + ')'));
  ok(!C.badRel && !C.badNode && !C.badInd && !C.emptyChain, 'every relation, actor and indicator id in a chain resolves', JSON.stringify([C.badRel, C.badNode, C.badInd, C.emptyChain]));
  ok(!p._errs.some(e => /unknown relation/.test(e)), 'no “unknown relation” in the console', p._errs.join(' | '));
  ok(!p._errs.length, 'no page errors (full view)', p._errs.join(' | '));

  /* ---------- 4: every figure has a date and a source ---------- */
  const figs = await p.evaluate(async () => {
    const out = { ind: [], vw: [], rel: 0, relNo: 0 };
    document.querySelector('#isx-b1ind').click(); await new Promise(r => setTimeout(r, 250));
    document.querySelectorAll('#isx-b1led .lr.ind').forEach(li => { const t = li.querySelector('.b1tip'), n = li.querySelector('.ln').textContent, v = li.querySelector('.lrb b').textContent.trim();
      const s = t && t.querySelector('.src'), d = t && t.querySelector('p em');
      if (!s || /link not stored|Source: $/.test(s.textContent) || s.textContent.trim().length < 12) out.ind.push(n + ': no source'); if (v !== '–' && !d) out.ind.push(n + ': no date'); });
    document.querySelector('#isx-b1ind').click();
    for (const [id, o] of [['loop', {}], ['bond', {}], ['bond', { level: 2 }], ['desks', {}]]) { ISX.views.open(id, o); await new Promise(r => setTimeout(r, 120));
      document.querySelectorAll('#isx-vw .vw-fig').forEach(f => { const k = f.querySelector('.fk').textContent.slice(0, 50), slot = f.classList.contains('slot');
        if (slot) { if (!f.querySelector('p')) out.vw.push(id + ' · ' + k + ': empty slot without a reason'); return; }
        if (!f.querySelector('.lsrc')) out.vw.push(id + ' · ' + k + ': no source'); if (!f.querySelector('em')) out.vw.push(id + ' · ' + k + ': no date'); });
      document.querySelectorAll('#isx-vw .vw-rd').forEach(r => { if (!r.querySelector('.vw-who')) out.vw.push(id + ' · reading without whose reading'); }); }
    ISX.views.close();
    return out; });
  ok(!figs.ind.length, 'every indicator has a source, and a date where it has a value', figs.ind.join('; '));
  ok(!figs.vw.length, 'every figure in the three views has a date and a source; every empty slot says why; every reading says whose it is', figs.vw.join('; '));
  /* the new relations carry their source and whose reading on their card */
  const rels = await p.evaluate(async () => { const S = ISX.sim, bad = []; for (const k of ['SAV>SPX', 'TSY>HFD', 'BNK>HFD', 'MMF>FED', 'WH>MKM', 'DUA>STB', 'YEN>SAV', 'YEN>HFD']) { const i = S.relations.findIndex(r => r.join('>') === k);
      if (i < 0) { bad.push(k + ' missing'); continue; } const h = document.querySelector(`#isx-rmap .feh[data-e="${i}"]`); h.dispatchEvent(new MouseEvent('click', { bubbles: true })); await new Promise(r => setTimeout(r, 60));
      const s = document.querySelector('#isx-rside'); if (!s || s.hidden || !s.querySelector('.cb-who') || !/Source: \S/.test(s.textContent)) bad.push(k + ': no source or reading on its card'); }
    const dx = document.querySelector('#isx-dx'); if (dx) dx.click(); return bad; });
  ok(!rels.length, 'the new relations show a source and whose reading on their card', rels.join('; '));

  /* ---------- 6a: doors, by keyboard ---------- */
  for (const [n, v] of [['SAV', 'loop'], ['Y10', 'bond'], ['MOV', 'bond'], ['BND', 'bond'], ['TSY', 'desks'], ['FED', 'desks']]) {
    await p.evaluate(k => { const g = document.querySelector(`#isx-rmap .fn[data-n="${k}"]`); g.focus(); }, n);
    await p.keyboard.press('Enter'); await p.waitForTimeout(120);
    const has = await p.evaluate(() => { const d = document.querySelector('#isx-rside .cb-door'); if (d) d.focus(); return d ? d.textContent : ''; });
    ok(/Inside the machinery/.test(has), 'door button in the dossier of ' + n, has);
    await p.keyboard.press('Enter'); await p.waitForTimeout(150);
    const st = await p.evaluate(() => ({ on: ISX.views.on, focus: document.activeElement && document.activeElement.className, dlg: (document.querySelector('#isx-vw') || {}).getAttribute ? document.querySelector('#isx-vw').getAttribute('role') : '' }));
    ok(st.on === v && /vw-x1/.test(st.focus || '') && st.dlg === 'dialog', n + ' opens “' + v + '” by keyboard, focus on Close', JSON.stringify(st));
    if (v === 'bond' && n === 'Y10') { await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Enter'); await p.waitForTimeout(120); ok(await p.evaluate(() => ISX.views.level === 2 && !!document.querySelector('#isx-vw .vw-ccy')), 'Zoom in opens level 2 with the currency row');
      const rows = await p.evaluate(() => [...document.querySelectorAll('#isx-vw .vw-ccy .cr')].map(r => [r.children[0].textContent.trim(), r.children[2].querySelector('b').textContent.trim()]));
      ok(rows.length === 7 && rows[0][0] === 'US dollar' && rows[1][0] === 'Euro' && rows[6][0] === 'Japanese yen', 'seven currencies, ordered by amount', JSON.stringify(rows.map(r => r[0])));
      ok(rows.filter(r => r[1] === '–').length === 5 && /%/.test(rows[0][1]) && /%/.test(rows[1][1]), 'weights shown for the dollar and the euro, “–” for five', JSON.stringify(rows.map(r => r[1]))); }
    await p.keyboard.press('Escape'); await p.waitForTimeout(120);
    const cl = await p.evaluate(() => ({ on: ISX.views.on, back: !!document.activeElement && document.activeElement.classList.contains('cb-door') }));
    ok(!cl.on && cl.back, n + ': Esc closes the view and returns the focus to the door', JSON.stringify(cl));
  }
  /* the play that lives in a view, and the lever cards' link to the house reading */
  await p.evaluate(() => ISX.views.open('desks')); await p.click('#isx-vw [data-vplay]'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => !ISX.views.on && /The revolving door/.test(document.querySelector('#isx-rside').textContent) && /Speculative: the links below are connections, not a recorded plan\./.test(document.querySelector('#isx-rside').textContent)), 'the episode “The revolving door” runs from the view, with its caution first (clarity build: the play “Coordinate with the Fed” is that episode)');
  await p.evaluate(() => ISX.simLever(0)); await p.waitForTimeout(200);
  ok(await p.evaluate(() => { const d = document.querySelector('#isx-rside .cb-door'); if (!d) return false; d.click(); return ISX.views.on === 'desks' && !!document.querySelector('#isx-vw-house.hl'); }), 'a lever card opens “The house always prints”');
  await p.evaluate(() => ISX.views.close());
  await p.context().close();

  /* ---------- 6b: doors, by touch ---------- */
  p = await mk({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, 'full');
  for (const [n, v] of [['SAV', 'loop'], ['BND', 'bond'], ['FED', 'desks']]) {
    await p.evaluate(k => document.querySelector(`#isx-rmap .fn[data-n="${k}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })), n); await p.waitForTimeout(150);
    const d = p.locator('#isx-rside .cb-door'); await d.scrollIntoViewIfNeeded(); await d.tap(); await p.waitForTimeout(200);
    ok(await p.evaluate(() => ISX.views.on) === v, n + ' opens “' + v + '” by touch');
    const fit = await p.evaluate(() => { const b = document.querySelector('#isx-vw .vw-b'); return b.scrollWidth <= b.clientWidth + 1; }); ok(fit, v + ' has no sideways scroll on a phone');
    await p.locator('#isx-vw .vw-x1').tap(); await p.waitForTimeout(150);
    ok(!(await p.evaluate(() => ISX.views.on)), v + ' closes by touch');
  }
  ok(!p._errs.length, 'no page errors (phone)', p._errs.join(' | '));
  await p.context().close();

  /* ---------- 3, 5: the guide, walked: nothing before its step; flares match their gauges ---------- */
  p = await mk({}, 'story');
  const walk = await p.evaluate(async () => {
    const S0 = ISX.sim, M = S0.lines[0], out = { early: [], fl: [], states: 0, seen: [] }, wait = ms => new Promise(r => setTimeout(r, ms));
    const dn = ['capex', 'shr', 'ai', 'con', 'off', 'save'], up = ['y10', 'mtg', 'haircut', 'brent', 'pce', 'diesel'];
    const links = (S, h) => {
      if (S.ph === 'chain') { const D = S.decisions.find(d => d.k === S.dec), C = D.chain[S.c]; out.seen.push(D.k + ':' + S.c);
        Object.entries(C.fl).forEach(([id, a]) => { if (a !== '▲' && a !== '▼') out.fl.push(h + ': ' + id + ' has no direction'); if (dn.includes(id) && a !== '▼') out.fl.push(h + ': ' + id + ' should press down'); if (up.includes(id) && a !== '▲') out.fl.push(h + ': ' + id + ' should press up'); });
        if (D.k === '5-3') { const want = S.c === 0 ? '▲' : S.c <= 2 ? '▼' : null, g2 = document.querySelector('#isx-rmap .gn[data-n="YEN"]'), lab = g2.getAttribute('aria-label') || '', arr = g2.querySelector('.garr').textContent;
          if (want && C.fl.yen !== want) out.fl.push(h + ': yen should be ' + want); if (C.fl.yen && arr !== C.fl.yen) out.fl.push(h + ': the yen gauge shows ' + arr);
          if (C.fl.yen && !lab.includes(C.fl.yen === '▲' ? 'a weaker yen' : 'a stronger yen')) out.fl.push(h + ': the yen’s label does not say which way: ' + lab); }
        const chips = [...document.querySelectorAll('#isx-sn-body .dfl b')].map(e => e.textContent); if (chips.length !== Object.keys(C.fl).length) out.fl.push(h + ': pressure chips ' + chips.length + ' of ' + Object.keys(C.fl).length);
        const nt = document.querySelector('#isx-sn-body .cb-nt'); if (nt && /map’s reading/.test(nt.textContent)) out.fl.push(h + ': a “map’s reading” note'); }   /* tiers build B: a link's note credits an author or a measurement, or is gone (copy Part H) */
      if (S.ph === 'ask' && S.dec === '5-3') { const g2 = document.querySelector('#isx-rmap .gn[data-n="YEN"]'); if (g2.querySelector('[data-gv="yen"]').textContent !== '?' || g2.querySelector('.garr').textContent !== '▲') out.fl.push('the yen decision: the gauge should read “?” with ▲'); }
      if (S.ph === 'crisis' && S.dec === '5-3') out.rail = document.querySelectorAll('#isx-sn-body .cb-rail li').length + ':' + !!document.querySelector('#isx-sn-body .cb-shows');
    };
    for (let g = 0; g < 400; g++) {
      const S = ISX.sim, L = S.lines[S.line], h = (document.querySelector('#isx-sn-body h3') || {}).textContent || ''; out.states++;
      if (S.line === 0 && S.beat >= 0 && S.beat < L.steps.length && !S.ph) {
        const reached = new Set(L.steps[S.beat].e), shown = [...document.querySelectorAll('#isx-rmap .fe:not(.gh)')].map(e => +e.dataset.e).filter(i => !reached.has(i));
        if (shown.length) out.early.push('step ' + (S.beat + 1) + ': relations ' + shown.join(','));
        S.indicators.forEach(I => { const ok = I.at && I.at.main != null ? S.beat + 1 >= I.at.main : I.rel.some(i => reached.has(i)), el = document.querySelector(`#isx-rmap [data-gv="${I.id}"]`);
          if (!ok && el && el.textContent.trim()) out.early.push('step ' + (S.beat + 1) + ': ' + I.k + ' shows ' + el.textContent.trim()); });
        const nodes = new Set(L.steps[S.beat].n); document.querySelectorAll('#isx-rmap .fn:not(.s4dim)').forEach(e => { if (!nodes.has(e.dataset.n)) out.early.push('step ' + (S.beat + 1) + ': actor ' + e.dataset.n); });
      }
      links(S, h);
      if (S.line === 0 && S.beat >= L.steps.length) break;
      if (S.ph === 'ask' && document.querySelector('#isx-sn-body .sn-opt[data-fk="alt"]')) document.querySelector('#isx-sn-body .sn-opt[data-fk="alt"]').click(); else ISX.route.next('sim').click();   /* clarity patch: on a call's setup page Next turns the page */
      await wait(40);
    }
    /* clarity build: three of the seven decisions sit in episodes; each episode is walked from its first step to its return to the guide */
    for (const E of S0.lines.filter(x => x.ep)) { const t = document.createElement('button'); t.dataset.ep = E.ep; t.hidden = true; document.getElementById('isx-sn-body').appendChild(t); t.click(); await wait(120);
      if (ISX.sim.beat < 0) { ISX.route.next('sim').click(); await wait(60); }
      for (let g = 0; g < 60; g++) { const S = ISX.sim; if (!S.lines[S.line].ep) break; out.states++; links(S, (document.querySelector('#isx-sn-body h3') || {}).textContent || '');
        if (S.ph === 'ask' && document.querySelector('#isx-sn-body .sn-opt[data-fk="alt"]')) document.querySelector('#isx-sn-body .sn-opt[data-fk="alt"]').click(); else ISX.route.next('sim').click();   /* clarity patch: on a call's setup page Next turns the page */ await wait(40); } }
    return out; });
  ok(!walk.early.length, 'nothing is shown before its step (' + walk.states + ' states walked)', walk.early.slice(0, 6).join('; '));
  ok(walk.seen.length === 37, 'all 37 chain links were walked (22 in the guide, 15 in its episodes)', String(walk.seen.length));
  ok(!walk.fl.length, 'every flare direction matches its gauge; no link carries a “map’s reading” note', walk.fl.slice(0, 6).join('; '));
  ok(walk.rail === '7:true', 'the yen card has its history rail (7 rows) and “What it shows”', walk.rail);
  ok(!p._errs.length, 'no page errors (guide)', p._errs.join(' | '));
  await p.context().close();

  /* ---------- 9: the copy round's three rules (claude/content/tiers-copy.md, section 0), tiers build B ---------- */
  {
    const fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..', 'imperial-stack');
    /* rule 3: no “map’s reading” hedges and no intent disclaimers anywhere in the page's text or data; credit stays where it is due */
    const HEDGE = /map’s (structural )?reading|map's reading|page’s reading|not an allegation|what any person intended|No claim is made about/;
    const files = ['index.html', ...fs.readdirSync(path.join(ROOT, 'v2')).filter(f => /\.js$/.test(f)).map(f => 'v2/' + f), ...fs.readdirSync(path.join(ROOT, 'data')).filter(f => /\.json$/.test(f)).map(f => 'data/' + f)];
    const hedges = files.flatMap(f => fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n').map((l, i) => HEDGE.test(l) ? f + ':' + (i + 1) : null).filter(Boolean));
    ok(!hedges.length, 'rule 3: no “map’s reading” hedges and no intent disclaimers in the page, its scripts or its data', hedges.join(', '));
    /* rules 1 and 2, walked route by route */
    const PLAIN = { deficit: /\bdeficits?\b/i, debt: /\bdebt\b/i, rate: /\binterest rates?\b/i, treasuries: /\bTreasuries\b/, bond: /\bbonds?\b/i, yield: /\byields?\b/i, surplus: /\bsurplus(es)?\b/i };
    const q = await mk({}, 'story');
    const R9 = await q.evaluate(async ([plainSrc]) => {
      const w = ms => new Promise(r => setTimeout(r, ms)), L = ISX.sim.lines, gi = L.findIndex(x => x.gnd), pi = L.findIndex(x => x.pre);
      const TW = ISX.tipw.map(([k, s, f]) => [k, new RegExp(s, f)]), PL = plainSrc.map(([k, s, f]) => [k, new RegExp(s, f)]);
      const card = () => { const B = document.getElementById('isx-sn-body'), vis = [...B.querySelectorAll('.s2why, .s2p, .dctx > p, .thesis-echo')], fold = [...B.querySelectorAll('.s2d > p')];
        const keys = el => new Set(el.flatMap(e => [...e.querySelectorAll('dfn.df')].map(d => d.dataset.d)));
        return { h: (B.querySelector('h3') || {}).textContent || '', vis: vis.map(e => e.textContent).join(' '), fold: fold.map(e => e.textContent).join(' '), kv: keys(vis), kf: keys(fold) }; };
      const walk = async (start) => { const out = []; document.getElementById('isx-sn-pickb').click(); await w(80); document.querySelector(`#isx-sn-pick [data-sl="${start}"]`).click(); await w(120);
        for (let g = 0; g < 400; g++) { const S = ISX.sim, Ln = S.lines[S.line]; if (S.beat >= 0 && S.beat < Ln.steps.length || S.ph) out.push(Object.assign(card(), { at: (Ln.gnd ? 'basics ' : Ln.pre ? 'first principles ' : 'step ') + (S.beat + 1) + (S.ph ? ' ' + S.ph + (S.ph === 'chain' ? ' ' + (S.c + 1) : '') : ''), line: S.line }));
          if (S.line === 0 && S.beat >= Ln.steps.length) break;
          if (S.ph === 'ask' && document.querySelector('#isx-sn-body .sn-opt[data-fk="alt"]')) document.querySelector('#isx-sn-body .sn-opt[data-fk="alt"]').click(); else ISX.route.next('sim').click();   /* clarity patch: on a call's setup page Next turns the page */ await w(35); }
        return out; };
      const ALT = { deficit: ['ca'] };   /* clarity build: the primer now starts from the deficit with the world, whose tip is the current account's */
      const first = (cards, list, fold) => list.map(([k, re]) => { const i = cards.findIndex(c => re.test(c.vis) || (fold && re.test(c.fold))); if (i < 0) return null; const c = cards[i];
        const has = K => K.has(k) || (ALT[k] || []).some(a => K.has(a)); return (re.test(c.vis) ? has(c.kv) : has(c.kf)) ? null : k + ' first used at ' + c.at + ' (“' + c.h + '”) without its tip'; }).filter(Boolean);
      localStorage.setItem('isx-way', 'ground'); const ground = await walk(gi); localStorage.setItem('isx-way', 'guide'); const guide = await walk(pi);
      const BACK = /\b(as above|see above|as before|the (previous|last|next) (screen|card|reveal)|the (screen|card|reveal) before|as we saw|as you saw)\b/i;
      return { n: [ground.length, guide.length], g1: first(ground, TW, false), g2: first(guide, TW, false), plain: first(ground.filter(c => c.line === gi || c.line === pi), PL, true),
        back: ground.filter(c => c.line === gi || c.line === pi).filter(c => BACK.test(c.vis)).map(c => c.at) };
    }, [Object.entries(PLAIN).map(([k, re]) => [k, re.source, re.flags])]);
    console.log('rule 1: cards walked, ground route ' + R9.n[0] + ', guide route ' + R9.n[1]);
    ok(!R9.g1.length && !R9.g2.length, 'rule 1: every technical term carries its tip where each route first uses it (the ground route and the guide’s)', [...R9.g1, ...R9.g2].join('; '));
    ok(!R9.plain.length, 'rule 1: deficit, debt, interest rate, Treasuries, bond, yield and surplus are defined where the ground route first uses them (the primer)', R9.plain.join('; '));
    ok(!R9.back.length, 'rule 2: each primer screen and first-principles reveal stands alone (no “as above”, no pointer to the card before)', R9.back.join('; '));
    ok(!q._errs.length, 'no page errors (rules)', q._errs.join(' | '));
    await q.context().close();
  }

  /* ---------- 7: the tour ---------- */
  p = await mk({}, 'story', true);
  /* guide build (16 Nov 2026, entry spec §2): the tour no longer starts by itself; the entry's “Tour” pill opens the first card of the level and runs it there */
  await p.waitForTimeout(3500);
  ok(await p.evaluate(() => !ISX.simtour.on && ISX.sim.beat === -1 && !!document.querySelector('#isx-gentry .ge-foot [data-simtour]')), 'the tour does not start by itself on a first visit; the entry carries its “Tour” pill');
  await p.click('#isx-gentry .ge-foot [data-simtour]'); await p.waitForFunction(() => ISX.simtour.on, null, { timeout: 5000 }).catch(() => {});
  ok(await p.evaluate(() => ISX.simtour.on && ISX.sim.beat === 0 && ISX.sim.lines[ISX.sim.line].pre), 'the entry’s “Tour” opens the first card of the suggested level and starts the tour there');
  const txt = []; for (let i = 0; i < 8; i++) { const t = await p.evaluate(() => { const x = document.getElementById('isx-simtour'); return x && !x.hidden && ISX.simtour.on ? x.querySelector('h3').textContent + ' | ' + x.querySelector('p').textContent : null; }); if (!t) break; txt.push(t); await p.click('#isx-simtour .tgo'); await p.waitForTimeout(200); }
  ok(txt.length >= 4 && txt.some(t => t.includes('Click any actor or line for what it does and its sources.')), 'the tour runs to its end and keeps the line about clicking', txt.length + ' notes');
  ok(await p.evaluate(() => !ISX.simtour.on && localStorage.getItem('isx-simtour') === 'off' && ISX.sim.beat === 0), 'its last button ends it on that first card, and the tour is marked as seen');
  await p.click('#isx-simtour-b'); await p.waitForTimeout(200); ok(await p.evaluate(() => ISX.simtour.on), 'the “Tour” button starts it again');
  await p.keyboard.press('Escape'); await p.waitForTimeout(150); ok(!(await p.evaluate(() => ISX.simtour.on)), 'Esc ends the tour');
  ok(!(await p.evaluate(() => !!document.getElementById('isx-stips'))), 'the old card “How to use the simulator” is gone');

  /* ---------- 8: the locks, and the Arm's door ---------- */
  const lk = await p.evaluate(async () => { const soon = [...document.querySelectorAll('.st-fin button, .fsw button')].filter(e => /capital stack/i.test(e.textContent)); ISX.setFin('stack'); location.hash = '#capital-stack'; await new Promise(r => setTimeout(r, 300));
    return { soon: soon.length && soon.every(e => /coming soon/i.test(e.textContent) && e.getAttribute('aria-disabled') === 'true'), mode: ISX.finMode, tower: !!document.getElementById('isx-tower') }; });
  ok(lk.soon && lk.mode === 'plumb' && !lk.tower, 'the capital stack is locked “coming soon” in both switches, by link and by script', JSON.stringify(lk));
  await p.goto(base + '#circuit/ring', { waitUntil: 'load' }); await p.waitForFunction(() => window.ISX && ISX.booted, null, { timeout: 90000 }); await p.waitForTimeout(700);
  const arm = await p.evaluate(() => { const d = document.querySelector('.rgdoor[data-door="arm"] span'); return d ? d.textContent : document.documentElement.innerHTML.includes('See the internal structure of dominant American capital') ? 'in page' : ''; });
  ok(/See the internal structure of dominant American capital|in page/.test(arm) && !(await p.evaluate(() => document.documentElement.innerHTML.includes('internal organisational structure'))), 'the Arm’s door reads “See the internal structure of dominant American capital”', arm);
  await p.context().close();

  console.log(`\n${pass} pass, ${fail} fail`);
  await b.close(); process.exit(fail ? 1 : 0);
})();
