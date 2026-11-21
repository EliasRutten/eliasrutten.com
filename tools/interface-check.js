/* Interface-fixes checks (14 Nov 2026): “Full screen” as a labelled control in every tab, the three doors at the end of
   the ring, one motion curve for the two bars, the bubble and flow marks of the bottom bar, the ring's motion and when
   it stops, the tab name “The imperial machinery”, and the line about clicking an actor or a line.
   Usage: node tools/interface-check.js [baseUrl] [--only=<n,n>]   — needs `python3 -m http.server 8731` at the repo root.
   Exits 1 on a failed check. */
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const base = args.find(a => /^https?:/.test(a)) || 'http://127.0.0.1:8731/imperial-stack/';
const only = (args.find(a => /^--only=/.test(a)) || '').replace('--only=', '').split(',').filter(Boolean).map(Number);
const want = n => !only.length || only.includes(n);
let fails = 0;
const ok = (name, cond, extra) => { if (!cond) fails++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra !== undefined && !cond ? '  → ' + JSON.stringify(extra).slice(0, 900) : '')); };
const SIZES = [[1024, 768, false], [1280, 760, false], [1440, 900, false], [1920, 1080, false], [390, 844, true]];
const TABS = [['#circuit', 'Circuit'], ['#arm', 'Arm'], ['#simulator', 'Machinery'], ['#scenarios', 'Scenarios']];
const LINE = /^(Click|Tap) any actor or line for what it does and its sources\.$/;

(async () => {
  const b = await chromium.launch();
  const page = async (hash, opts = {}) => {
    const c = await b.newContext({ viewport: { width: opts.w || 1440, height: opts.h || 900 }, deviceScaleFactor: 1, reducedMotion: opts.motion ? 'no-preference' : 'reduce', hasTouch: !!opts.touch, isMobile: !!opts.touch });
    const set = Object.assign({ 'isx-tips-globe': 'off', 'isx-tips-sim': 'off', 'isx-stack': 'open', 'isx-first': 'off', 'isx-insights': 'off', 'isx-tour': 'off', 'isx-sim-mode': 'story' }, opts.ls || {}), pos = opts.pos || null;
    await c.addInitScript(o => { try { if (!sessionStorage.getItem('__seeded')) { Object.keys(o.set).forEach(k => localStorage.setItem(k, o.set[k])); if (o.pos) sessionStorage.setItem('isx-sim-pos', o.pos); sessionStorage.setItem('__seeded', '1'); } } catch (e) {} }, { set, pos });
    const p = await c.newPage(); p._errs = []; p.on('pageerror', e => p._errs.push(String(e).slice(0, 200)));
    await p.goto(base + (opts.q || '') + hash, { waitUntil: 'load' });
    await p.waitForFunction(() => window.ISX && ISX.booted, null, { timeout: 60000 });
    await p.waitForTimeout(opts.wait || 1500);
    return p;
  };
  const js = (p, f, a) => p.evaluate(f, a);
  /* where the button is, what it says and what stands beside it */
  const fsInfo = p => js(p, () => {
    const all = document.querySelectorAll('#isx-fs'), f = all[0], v = e => !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden' && +getComputedStyle(e).opacity > .5;
    const r = f.getBoundingClientRect(), lab = f.querySelector('.fsl'), lr = lab.getBoundingClientRect(), zoom = document.getElementById('isx-zoom'), plus = zoom.querySelector('[data-z="in"]'), pr = plus.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const tabs = document.getElementById('isx-tabs'), tr = tabs.getBoundingClientRect(), tb = tabs && !tabs.classList.contains('rt-host') && tabs.getClientRects().length ? [...tabs.querySelectorAll('.tb')].map(t => { const q = t.getBoundingClientRect(); return { left: Math.max(q.left, tr.left), right: Math.min(q.right, tr.right), top: q.top, bottom: q.bottom }; }).filter(q => q.right > q.left) : [];   /* the row scrolls: only the part of a tab inside the row counts */
    return { n: all.length, vis: v(f) && v(lab), text: lab.textContent.trim(), labW: Math.round(lr.width), labH: Math.round(lr.height), aria: f.getAttribute('aria-label'), fontPx: parseFloat(getComputedStyle(lab).fontSize),
      inZoom: zoom.contains(f), inBar: !!f.closest('.rt'), inDock: !!f.closest('#isx-dock'), inScene: !!f.closest('#isx-sc3 .b3nav, #isx-sc3 .b3deep'), zoomVis: v(zoom) && v(plus), sameRow: Math.abs((r.top + r.height / 2) - (pr.top + pr.height / 2)) < 2, gap: Math.round(pr.left - r.right),
      onTop: !!hit && f.contains(hit), inView: r.left >= 0 && r.right <= innerWidth + 1 && r.width > 0, box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
      clearOfTabs: tb.every(t => t.right <= r.left + 1 || t.left >= r.right - 1 || t.bottom <= r.top || t.top >= r.bottom), dockLabel: document.getElementById('isx-dock').getAttribute('aria-label'), zoomLabel: zoom.getAttribute('aria-label') };
  });

  /* ================= 1. “Full screen”: visible and labelled in all four tabs, at five sizes ================= */
  if (want(1)) {
    for (const [w, h, touch] of SIZES) {
      for (const [hash, name] of TABS) {
        const p = await page(hash, { w, h, touch });
        if (touch) await js(p, () => { const f = document.getElementById('isx-fs'); f.scrollIntoView({ block: 'center' }); });
        await p.waitForTimeout(200);
        const r = await fsInfo(p), tag = `full screen (${name}, ${w}×${h})`;
        ok(`${tag}: one button, on screen, with the visible label “Full screen” as its name`, r.n === 1 && r.vis && r.text === 'Full screen' && r.labW > 40 && r.labH >= 8 && r.fontPx >= 9 && r.aria === null && r.inView && r.onTop, r);
        if (name === 'Circuit') ok(`${tag}: beside the zoom buttons, on their row, directly before +`, r.inZoom && r.zoomVis && r.sameRow && r.gap >= 0 && r.gap <= 12 && /full screen/i.test(r.zoomLabel) && !/full screen/i.test(r.dockLabel), r);
        else if (name === 'Arm') ok(`${tag}: in the dock, clear of the Arm’s tabs`, r.inDock && !r.inZoom && r.clearOfTabs && /full screen/i.test(r.dockLabel), r);
        /* B3: the Scenarios gallery has no bar and a case plays with the strip skin, so the dock (with “Full screen”) keeps its own corner there, as in the Arm */
        /* Scenarios polish (16 Nov): on a wide screen it stands in the stage's top right group (beside “All switches”); on a phone it keeps the dock */
        else if (name === 'Scenarios') ok(`${tag}: ` + (w <= 760 ? 'in the dock, under the stage on a phone' : 'in the stage’s top right group, beside “All switches”'), w <= 760 ? r.inDock && !r.inZoom && !r.inBar && /full screen/i.test(r.dockLabel) : r.inScene && !r.inDock && !r.inZoom && !/full screen/i.test(r.dockLabel), r);
        else ok(`${tag}: ` + (touch ? 'in the dock under the stage' : 'the last segment of the bar'), r.inDock && !r.inZoom && (touch || r.inBar) && /full screen/i.test(r.dockLabel), r);
        ok(`${tag}: no page errors`, p._errs.length === 0, p._errs);
        await p.context().close();
      }
    }
    /* the ring covers the globe: no zoom there, so the button is in the bar; back on a step it returns to the zoom buttons */
    const p = await page('#circuit/ring', { wait: 2000 });
    let r = await fsInfo(p);
    ok('full screen (the ring): in the bar, labelled, while the zoom buttons are hidden', r.vis && r.inBar && !r.inZoom && !r.zoomVis && r.text === 'Full screen' && r.onTop, r);
    await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(500);
    r = await fsInfo(p);
    ok('full screen (back on step 10): beside the zoom buttons again', r.vis && r.inZoom && r.sameRow, r);
    const bub = await js(p, () => { const h = document.querySelector('#isx-tabs .rt-here').getBoundingClientRect(), m = document.querySelector('#isx-tabs .rt-segs .c').getBoundingClientRect(); return { dx: Math.abs((h.left + h.width / 2) - (m.left + m.width / 2)), o: +getComputedStyle(document.querySelector('#isx-tabs .rt-here')).opacity }; });
    ok('full screen: the bar’s bubble is still on the step in hand after the button moved', bub.dx < 3 && bub.o > .9, bub);
    await p.context().close();
    /* it works: desktop and phone (Chromium; iPhones have no full-screen API for pages, where the button is not shown) */
    for (const [w, h, touch, hash] of [[1440, 900, false, '#circuit'], [1440, 900, false, '#simulator'], [390, 844, true, '#circuit'], [390, 844, true, '#scenarios']]) {
      const q = await page(hash, { w, h, touch });
      const can = await js(q, () => !!(document.fullscreenEnabled || document.webkitFullscreenEnabled));
      await js(q, () => document.getElementById('isx-fs').scrollIntoView({ block: 'center' })); await q.waitForTimeout(200);
      if (touch) await q.tap('#isx-fs'); else await q.click('#isx-fs');
      await q.waitForTimeout(700);
      const on = await js(q, () => ({ el: (document.fullscreenElement || document.webkitFullscreenElement || {}).id || null, cls: document.getElementById('isx-root').classList.contains('fs'), text: document.querySelector('#isx-fs .fsl').textContent, vis: document.getElementById('isx-fs').getClientRects().length > 0 }));
      await js(q, () => document.getElementById('isx-fs').scrollIntoView({ block: 'center' })); await q.waitForTimeout(200);
      if (touch) await q.tap('#isx-fs'); else await q.click('#isx-fs');
      await q.waitForTimeout(700);
      const off = await js(q, () => ({ el: (document.fullscreenElement || document.webkitFullscreenElement || {}).id || null, cls: document.getElementById('isx-root').classList.contains('fs'), text: document.querySelector('#isx-fs .fsl').textContent }));
      ok(`full screen works (${hash}, ${w}×${h}${touch ? ', touch' : ''}): on, “Exit full screen”, and off again`, can && on.el === 'isx-root' && on.cls && on.text === 'Exit full screen' && on.vis && off.el === null && !off.cls && off.text === 'Full screen', { can, on, off });
      await q.context().close();
    }
  }

  /* ================= 2. three doors at the end of the ring ================= */
  if (want(2)) {
    const DOORS = [['#profit', 'The profit dollar', 'Whose profits the world’s savings buy', 'profit'], ['#simulator', 'The imperial machinery', 'Follow the money in the Scott Bessent Simulator', 'fin'], ['#elite-network', 'The elite network', 'See the internal structure of dominant American capital', 'arm'], ['#imperial-arm', 'The imperial arm', 'Scenarios: how Washington leverages the stack internationally', 'story']];
    for (const [w, h, touch] of [[1440, 900, false], [1280, 760, false], [1024, 768, false], [390, 844, true]]) {
      const p = await page('#circuit/ring', { w, h, touch, wait: 2200 });
      const r = await js(p, () => { const d = [...document.querySelectorAll('#isx-tournarr a.rgdoor')], bar = document.getElementById('isx-tabs').getBoundingClientRect(), card = document.getElementById('isx-tournarr').getBoundingClientRect(), rb = document.getElementById('isx-resbar'), rbr = rb && rb.getClientRects().length && getComputedStyle(rb).visibility !== 'hidden' ? rb.getBoundingClientRect() : null;
        return { doors: d.map(a => { const q = a.getBoundingClientRect(), s = getComputedStyle(a); return { href: a.getAttribute('href'), t: a.querySelector('b').textContent, s: a.querySelector('span').textContent, w: Math.round(q.width), h: Math.round(q.height), x: Math.round(q.left), y: Math.round(q.top), bw: s.borderTopWidth, fs: getComputedStyle(a.querySelector('b')).fontSize, fw: getComputedStyle(a.querySelector('b')).fontWeight, vis: a.getClientRects().length > 0 }; }),
          old: document.querySelectorAll('#isx-tournarr .rggo, #isx-tournarr [data-ring="sim"]').length, again: !!document.querySelector('#isx-tournarr [data-ring="again"]'), phone: innerWidth <= 760,
          fit: innerWidth <= 760 || (card.top >= 0 && card.bottom <= bar.top + 1 && scrollY === 0 && (!rbr || card.top >= rbr.bottom - 1 || card.left >= rbr.right)), cardTop: Math.round(card.top), rb: rbr && Math.round(rbr.bottom) }; });
      const d = r.doors, tag = `doors (${w}×${h})`;
      ok(`${tag}: four doors, in order, with their titles and subtitles; the single Simulator button is gone (profit tab build 1: the profit dollar is the first door)`, d.length === 4 && d.every((x, i) => x.href === DOORS[i][0] && x.t === DOORS[i][1] && x.s === DOORS[i][2] && x.vis) && r.old === 0 && r.again, r);
      ok(`${tag}: equal weight: the same size, border and type for all four`, d.length === 4 && d.every(x => Math.abs(x.w - d[0].w) <= 1 && Math.abs(x.h - d[0].h) <= 1 && x.bw === d[0].bw && x.fs === d[0].fs && x.fw === d[0].fw), d);
      ok(`${tag}: the card with the doors fits its place (above the bar, clear of the key numbers)`, r.fit, r);
      await p.context().close();
      for (const [href, , , view] of DOORS) {
        const q = await page('#circuit/ring', { w, h, touch, wait: 2000, ls: { 'isx-sim-mode': 'full' } });
        await js(q, hf => document.querySelector(`#isx-tournarr a.rgdoor[href="${hf}"]`).click(), href); await q.waitForTimeout(900);
        const s = await js(q, () => ({ view: ISX.view, hash: location.hash, ring: ISX.ring, mode: ISX.sim.mode, fin: ISX.finMode, arm: ISX.armMode }));
        ok(`${tag}: the door ${href} opens its tab`, s.view === view && s.hash.indexOf(href) === 0 && !s.ring && (view !== 'fin' || (s.mode === 'story' && s.fin === 'plumb')) && (view !== 'arm' || s.arm === 'machine') && q._errs.length === 0, { s, errs: q._errs });
        await q.context().close();
      }
    }
    /* a door is a real link: opened by its address alone, it lands in the same tab */
    for (const [href, , , view] of DOORS) { const q = await page(href); const v = await js(q, () => ISX.view); ok(`doors: the address ${href} opens the same tab`, v === view, v); await q.context().close(); }
  }

  /* ================= 3. one motion curve: the top strip's bubble and the bottom bar's ================= */
  if (want(3)) {
    const curve = s => /cubic-bezier\(0?\.2, 0?\.8, 0?\.2, 1\)/.test(s);
    /* B3: Scenarios left this loop. Its bar is hidden in the gallery and wears the strip skin in a case: the step in hand grows and
       glows in place, with no sliding bubble and no flow marks (tools/b3-check.js checks the strip; the bubble's absence is checked below). */
    for (const [hash, host, name] of [['#circuit/03', 'isx-tabs', 'Circuit'], ['#simulator', 'isx-s2bar', 'Machinery']]) {
      const p = await page(hash, { motion: true, pos: '{"l":0,"b":4}' });
      if (name === 'Scenarios') { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(700); }
      const t = await js(p, id => { const tr = e => { const s = getComputedStyle(e), props = s.transitionProperty.split(',').map(x => x.trim()), i = props.indexOf('transform'), pick = v => { const a = v.match(/cubic-bezier\([^)]*\)|[^,]+/g).map(x => x.trim()); return a[i % a.length]; }; return { dur: pick(s.transitionDuration), fn: pick(s.transitionTimingFunction), i }; };
        const top = document.querySelector('#isx-strip .st-ind'), bot = document.querySelector('#' + id + ' .rt-here'), bs = getComputedStyle(bot), ts = getComputedStyle(top);
        return { top: tr(top), bot: tr(bot), botRadius: parseFloat(bs.borderTopLeftRadius), botH: parseFloat(bs.height), botShadow: bs.boxShadow !== 'none', topShadow: ts.boxShadow !== 'none', o: +bs.opacity }; }, host);
      ok(`motion (${name}): the bottom bar’s bubble and the top strip’s slide with the same time and curve (0.4 s, cubic-bezier(.2, .8, .2, 1))`, t.top.i >= 0 && t.bot.i >= 0 && t.top.dur === t.bot.dur && t.top.dur === '0.4s' && t.top.fn === t.bot.fn && curve(t.bot.fn), t);
      ok(`motion (${name}): the bottom bar’s marker is a lit bubble, as the top strip’s`, t.botRadius >= 7 && t.botH >= 12 && t.botShadow && t.topShadow && t.o > .9, t);
      /* the bubble follows the step, and the flow marks run forward only */
      const pos = () => js(p, id => { const h = document.querySelector('#' + id + ' .rt-here').getBoundingClientRect(), m = document.querySelector('#' + id + ' .rt-segs .c'), r = m.getBoundingClientRect(); return { hx: h.left + h.width / 2, mx: r.left + r.width / 2, flow: document.querySelectorAll('#' + id + ' .rt-flow i').length }; }, host);
      await p.waitForFunction(id => document.querySelectorAll('#' + id + ' .rt-flow i').length === 0, host, { timeout: 8000 }).catch(() => {});   /* a deep link's own first move has finished */
      await p.keyboard.press('ArrowRight');
      const during = await js(p, id => new Promise(res => { let max = 0, t0 = performance.now(); (function f() { max = Math.max(max, document.querySelectorAll('#' + id + ' .rt-flow i').length); if (performance.now() - t0 < 350) requestAnimationFrame(f); else res(max); })(); }), host);
      await p.waitForTimeout(1300);
      const a = await pos();
      ok(`motion (${name}): on Next the bubble arrives on the new step; three flow marks ran and are gone`, Math.abs(a.hx - a.mx) < 3 && during === 3 && a.flow === 0, { a, during });
      await p.keyboard.press('ArrowLeft');
      const back = await js(p, id => new Promise(res => { let max = 0, t0 = performance.now(); (function f() { max = Math.max(max, document.querySelectorAll('#' + id + ' .rt-flow i').length); if (performance.now() - t0 < 350) requestAnimationFrame(f); else res(max); })(); }), host);
      await p.waitForTimeout(900);
      const c = await pos();
      ok(`motion (${name}): on Back the bubble returns and no flow marks run (money does not travel backwards)`, Math.abs(c.hx - c.mx) < 3 && back === 0, { c, back });
      /* nothing moves on its own: no running animation in the bar once it has settled */
      const idle = await js(p, id => document.getAnimations().filter(x => x.effect && x.effect.target && x.effect.target.closest && x.effect.target.closest('#' + id) && x.playState === 'running').length, host);
      ok(`motion (${name}): the bar is still between steps`, idle === 0, idle);
      await p.context().close();
      const q = await page(hash, { pos: '{"l":0,"b":4}' });
      if (name === 'Scenarios') { await q.keyboard.press('ArrowRight'); await q.waitForTimeout(400); }
      await q.keyboard.press('ArrowRight');
      const rm = await js(q, id => new Promise(res => { let max = 0, t0 = performance.now(); (function f() { max = Math.max(max, document.querySelectorAll('#' + id + ' .rt-flow i').length); if (performance.now() - t0 < 300) requestAnimationFrame(f); else res({ max, dur: getComputedStyle(document.querySelector('#' + id + ' .rt-here')).transitionDuration }); })(); }), host);
      ok(`motion (${name}): under reduced motion the bubble cuts and no flow marks are made`, rm.max === 0 && /^0s(, 0s)*$/.test(rm.dur), rm);
      await q.context().close();
    }
    {
      const s = await page('#scenarios', { motion: true });
      await s.click('#isx-b3-gal .b3cta'); await s.waitForTimeout(300); await s.keyboard.press('Shift'); await s.waitForTimeout(700); await s.keyboard.press('ArrowRight'); await s.waitForTimeout(900);
      const st = await js(s, () => { const h = document.getElementById('isx-sc-bar'), c = h.querySelector('.rt-sp.c'), cs = c ? getComputedStyle(c) : null; return { strip: !!h.querySelector('.rt.sk-strip'), here: getComputedStyle(h.querySelector('.rt-here')).display, flow: h.querySelectorAll('.rt-flow i').length, cur: !!c && c.getAttribute('aria-current') === 'step', grown: !!cs && /matrix\(1\.2/.test(cs.transform), glow: !!cs && cs.boxShadow !== 'none', step: ISX.sc.step }; });
      ok('motion (Scenarios): in a case the strip lights the step in hand in place (grown, with a glow); no sliding bubble, no flow marks', st.strip && st.here === 'none' && st.flow === 0 && st.cur && st.grown && st.glow && st.step === 1, st);
      await s.context().close();
    }
    /* the cards of the three tabs arrive on the same curve */
    const p = await page('#circuit/03', { motion: true });
    const cards = await js(p, () => { const pick = sel => { const e = document.querySelector(sel); return e ? getComputedStyle(e).animationTimingFunction : null; }; return { circuit: pick('#isx-tournarr.in > *') }; });
    ok('motion: the Circuit’s card arrives on the same curve', curve(cards.circuit || ''), cards);
    await p.context().close();
  }

  /* ================= 4. the ring: depth, the arc that draws round, the travelling marker and when it stops ================= */
  if (want(4)) {
    const ringState = p => js(p, () => { const h = document.getElementById('isx-ring'), q = s => [...h.querySelectorAll(s)]; return { cls: h.className, arcs: q('.rg-arc').map(a => +(+parseFloat(getComputedStyle(a).strokeDashoffset)).toFixed(2)), st: q('.rg-st:not(.in)').map(g => +(+getComputedStyle(g).opacity).toFixed(2)), heads: q('.rg-ah:not(.in)').map(a => +(+getComputedStyle(a).opacity).toFixed(2)),
      running: document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('#isx-ring') && a.playState === 'running' && a.animationName === 'isx-rgfl').length, flow: q('.rg-fl').length, filters: q('[filter]').length + q('*').filter(e => getComputedStyle(e).filter !== 'none').length,
      globe: +getComputedStyle(document.querySelector('#isx-root .globebox')).opacity, grads: h.querySelectorAll('linearGradient[id^="isx-rgg"]').length, lamps: q('.rg-lp').length, halos: q('.rg-gl').length, track: q('.rg-track').length, loops: ISX.perf.loops ? ISX.perf.loops() : [] }; });
    /* reduced motion: all lit at once, nothing moves */
    let p = await page('#circuit/ring', { wait: 2500 });
    let r = await ringState(p);
    ok('ring: the map is dimmed to 0.2 (0.3 before)', Math.abs(r.globe - .2) < .011, r.globe);
    ok('ring: depth: a halo and a lamp on each of the nine boxes, a gradient on each of the seven arcs, one hairline track', r.halos === 9 && r.lamps === 9 && r.grads === 7 && r.track === 1 && r.filters === 0, r);
    ok('ring: under reduced motion every arc is drawn, every station and arrowhead lit, and the marker does not travel', r.arcs.length === 7 && r.arcs.every(a => a === 0) && r.st.every(o => o > .95) && r.heads.every(o => o > .95) && r.running === 0 && !/\bfl\b/.test(r.cls), r);
    ok('ring: the marker is a registered loop', r.loops.includes('ring'), r.loops);
    await p.context().close();
    /* with motion, on a device above the low tier: the arc draws round station by station, then the marker travels */
    p = await page('#circuit/10', { motion: true, q: '?tier=high', wait: 2500 });
    await p.keyboard.press('ArrowRight'); await p.waitForFunction(() => document.querySelectorAll('#isx-ring .rg-arc').length === 7, null, { timeout: 20000 }); await p.waitForTimeout(900);
    const early = await ringState(p);
    ok('ring (motion): the arc draws round: the first arcs are drawn before the last, the last stations are still dark, the marker waits', early.arcs[0] < .5 && early.arcs[6] > .9 && early.st[early.st.length - 1] < .9 && early.running === 0 && !/\bfl\b/.test(early.cls), early);
    await p.waitForTimeout(6500);
    const late = await ringState(p);
    ok('ring (motion): then every arc is drawn and every station lit, and the marker travels (18 dashes: two per arrow)', late.arcs.every(a => a === 0) && late.st.every(o => o > .95) && late.heads.every(o => o > .95) && /\bfl\b/.test(late.cls) && late.running === 18 && late.flow === 18, late);
    /* the tab is hidden: the registry stops the marker; shown again, it resumes */
    await js(p, () => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(300);
    const hid = await ringState(p);
    await js(p, () => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(300);
    const shown = await ringState(p);
    ok('ring (motion): the marker stops when the browser tab is hidden and resumes when it is shown', !/\bfl\b/.test(hid.cls) && hid.running === 0 && /\bfl\b/.test(shown.cls) && shown.running === 18, { hid: hid.cls, shown: shown.cls });
    /* the reader switches reduced motion on while the ring is open */
    await p.emulateMedia({ reducedMotion: 'reduce' }); await p.waitForFunction(() => !document.getElementById('isx-ring').classList.contains('fl'), null, { timeout: 8000 }).catch(() => {}); await p.waitForTimeout(300);
    const rm = await ringState(p);
    ok('ring (motion): switching reduced motion on stops the marker; the arrows stay lit', !/\bfl\b/.test(rm.cls) && rm.running === 0 && rm.arcs.every(a => a === 0) && rm.heads.every(o => o > .95), rm);
    await p.emulateMedia({ reducedMotion: 'no-preference' }); await p.waitForTimeout(300);
    /* leaving the ring, or the tab, stops it */
    await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(500);
    const left = await js(p, () => ({ ring: ISX.ring, cls: document.getElementById('isx-ring').className, hidden: document.getElementById('isx-ring').hidden }));
    ok('ring (motion): Back leaves the ring and nothing keeps running', !left.ring && left.hidden && !/\bfl\b/.test(left.cls), left);
    ok('ring (motion): no page errors', p._errs.length === 0, p._errs);
    await p.context().close();
    /* a weak device (low tier): the lit arrows stay still */
    p = await page('#circuit/10', { motion: true, q: '?tier=low', wait: 2500 });
    await p.keyboard.press('ArrowRight'); await p.waitForFunction(() => document.querySelectorAll('#isx-ring .rg-arc').length === 7, null, { timeout: 20000 }); await p.waitForTimeout(7500);
    const low = await ringState(p);
    ok('ring (low tier): the arrows light and stay still: no travelling marker', low.arcs.every(a => a === 0) && low.heads.every(o => o > .95) && /\blit\b/.test(low.cls) && !/\bfl\b/.test(low.cls) && low.running === 0, low);
    await p.context().close();
  }

  /* ================= 5. the tab “The imperial machinery”, the interactive “Scott Bessent Simulator” ================= */
  if (want(5)) {
    let p = await page('#simulator', { w: 1920, h: 1080 });
    let r = await js(p, () => { const t = s => { const e = document.querySelector(s); return e ? (e.innerText || e.textContent).replace(/\s+/g, ' ').trim() : null; }, vis = e => e.getClientRects().length > 0;
      return { tab: t('#isx-v-fin'), tabLg: document.querySelector('#isx-v-fin .lg').textContent, tabSm: document.querySelector('#isx-v-fin .sm').textContent, h2: t('#isx-cock .s2top h2'), kicker: t('#isx-cock .s2top .fk'), cock: document.getElementById('isx-cock').getAttribute('aria-label'),
        strip: [...document.querySelectorAll('#isx-st-fin button')].filter(vis).map(b => b.innerText.trim()), stripName: document.querySelector('#isx-st-fin [data-stfin="plumb"]').getAttribute('aria-label'),
        frame: document.getElementById('isx-frame').getAttribute('aria-label'), narr: t('#isx-n-title'),
        plumbingAsName: [...document.querySelectorAll('#isx-strip, #isx-cock .s2top, #isx-n-title')].some(e => /plumbing/i.test(e.textContent)) }; });
    ok('names: the tab is “The imperial machinery” (short: “Machinery”)', /^(the imperial machinery|machinery)$/i.test(r.tab) /* 21 Nov 2026: the tab bar falls back to the short label when the long one would overflow (help menu round, 20 Nov); the two names are in the markup either way */ && r.tabLg === 'The imperial machinery' && r.tabSm === 'Machinery', r);
    ok('names: the interactive is “Scott Bessent Simulator” (heading, the switch in the strip, the stage’s label, the text under the stage)', /^scott bessent simulator$/i.test(r.h2) && /^scott bessent simulator · data as of/i.test(r.kicker) /* B4: the stage kicker names the interactive and its date (S4 §3, rule 8) */ && /^(scott bessent )?simulator$/i.test(r.strip[0]) /* 21 Nov 2026: the strip's button reads “Simulator”; its accessible name (checked next) is the full name */ && r.stripName === 'Scott Bessent Simulator' && /Scott Bessent Simulator/.test(r.cock) && /^the imperial machinery/i.test(r.cock) && /^scott bessent simulator$/i.test(r.narr), r);
    ok('names: “plumbing” is no longer a tab or view name (the guide keeps its chapter title)', !r.plumbingAsName && /imperial machinery/.test(r.frame), r);
    /* the share name */
    await js(p, () => document.getElementById('isx-share').click()); await p.waitForTimeout(400);
    const sh = await js(p, () => document.getElementById('isx-sh-name').textContent);
    ok('names: the share name starts “The imperial machinery · Scott Bessent Simulator”', sh.indexOf('The imperial machinery · Scott Bessent Simulator') === 0, sh);
    await p.context().close();
    p = await page('#capital-stack');
    r = await js(p, () => ({ kicker: document.querySelector('#isx-fin .finhead .fk').textContent, tabs: [...document.querySelectorAll('#isx-tabs .tb .t')].map(e => e.textContent) }));
    ok('names: the capital stack sits under “The imperial machinery”; its plain tabs name the Simulator', /^The imperial machinery · /.test(r.kicker) && r.tabs[0] === 'Scott Bessent Simulator', r);
    await js(p, () => document.getElementById('isx-share').click()); await p.waitForTimeout(300);
    ok('names: the capital stack’s share name', (await js(p, () => document.getElementById('isx-sh-name').textContent)).indexOf('The imperial machinery · capital stack') === 0);
    await p.context().close();
    for (const [w, h, touch] of [[1440, 900, false], [390, 844, true]]) {
      p = await page('#simulator', { w, h, touch });
      r = await js(p, () => { const vis = e => e.getClientRects().length > 0; return { tab: document.querySelector('#isx-v-fin').innerText.trim(), sw: [...document.querySelectorAll('#isx-cock .fsw button b, #isx-st-fin button')].filter(vis).map(b => b.innerText.trim()), ov: document.documentElement.scrollWidth > innerWidth + 1 }; });
      ok(`names (${w}×${h}): the tab reads “Machinery”, the view “Simulator” or its full name; nothing overflows`, /^machinery$/i.test(r.tab) && r.sw.length > 0 && r.sw.every(t => /^(scott bessent )?simulator$|^the capital stack$/i.test(t)) && !r.ov, r);
      await p.context().close();
    }
    /* About: the introduction names the tab */
    p = await page('#circuit');
    await js(p, () => document.getElementById('isx-about').click()); await p.waitForTimeout(900);
    const about = await js(p, () => { const e = document.querySelector('.intro6 .in-ways'); return e ? e.textContent : ''; });
    ok('names: the About text lists “the imperial Machinery (with the Scott Bessent Simulator)”', /the imperial Machinery \(with the Scott Bessent Simulator\)/.test(about), about.slice(0, 300));
    await p.context().close();
  }

  /* ================= 6. the tutorial line, and what it promises ================= */
  if (want(6)) {
    /* machinery entry round (19 Nov 2026): the old in-page entry and its row “How the guide works” are gone. The tab's entry screen says
       how to use it, and the guide's own hints carry the dotted-words line on the first card that has one */
    let p = await page('#simulator', { pos: '{"l":0,"b":-1}' });
    let r = await js(p, async () => { ISX.enter.open('fin', true); await new Promise(q => setTimeout(q, 150)); const e = document.getElementById('isx-enter'), h = [...e.querySelectorAll('.en-b section')].find(x => /How to use it/.test(x.textContent)); const out = { vis: !!h && h.getClientRects().length > 0, line: h ? h.textContent : '', beat: ISX.sim.beat }; ISX.enter.close(); return out; });
    ok('tutorial: the machinery’s entry screen says how to use it; the guide stands at its first step (no step −1)', r.vis && /three levels of\s+difficulty/.test(r.line) && r.beat === 0, r);
    r = await js(p, () => ISX.hints && ISX.hints.lines ? ISX.hints.lines() : {});
    ok('tutorial: the guide’s hints keep the dotted-words line', JSON.stringify(r).includes('Dotted words have a definition'), r);
    await p.context().close();
    p = await page('#simulator', { ls: { 'isx-sim-mode': 'full' } });
    /* “How to use the simulator” has had no button on the page since the Simulator moved onto the stage; the card is opened here the way its button did */
    await js(p, () => { const h = document.createElement('button'); h.setAttribute('data-tips', 'sim'); h.hidden = true; document.getElementById('isx-cock').appendChild(h); h.click(); h.remove(); }); await p.waitForTimeout(500);
    /* content build: the card “How to use the simulator” is gone; the same control now starts the Simulator's tour, which keeps the line */
    r = await js(p, async () => { const x = document.getElementById('isx-simtour'), out = { on: !!(window.ISX && ISX.simtour && ISX.simtour.on), card: !!document.getElementById('isx-stips'), texts: [] };
      for (let i = 0; i < 8 && ISX.simtour.on; i++) { out.texts.push(x.querySelector('p').textContent); if (i < 7 && /Next/.test(x.querySelector('.tgo').textContent)) x.querySelector('.tgo').click(); else break; await new Promise(q => setTimeout(q, 80)); }
      ISX.simtour.close(); return out; });
    ok('tutorial: the old tips control starts the tour, and one of its notes is the line; the tips card is gone', r.on && !r.card && r.texts.some(t => /^(Click|Tap) any actor or line for what it does and its sources\./.test(t)), r);
    /* the promise holds: an actor opens a card, and so does a line */
    await js(p, () => document.querySelector('#isx-rmap .fn[data-n="TSY"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(400);
    const actor = await js(p, () => { const d = document.querySelector('#isx-cock .dossier:not([hidden])'); return d ? { h: d.querySelector('h4').textContent, p: d.querySelector('p').textContent.length, src: d.querySelectorAll('.lsrc').length } : null; });
    ok('tutorial: clicking an actor opens its card (what it does; sources on its figures)', !!actor && actor.h.length > 0 && actor.p > 20 && actor.src >= 1, actor);
    await js(p, () => document.querySelector('#isx-rmap .feh[data-e="1"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(400);
    const line = await js(p, () => { const d = document.querySelector('#isx-cock .dossier:not([hidden])'); return d ? { k: d.querySelector('.pk').textContent.trim(), h: d.querySelector('h4').textContent, p: d.querySelector('p').textContent, src: [...d.querySelectorAll('.lsrc')].map(e => e.textContent), go: d.querySelectorAll('.go').length, lit: document.querySelectorAll('#isx-rmap .fe.on').length } : null; });
    ok('tutorial: clicking a line opens its card: the two actors, what passes between them, a source line that never invents a link', !!line && /^Relation · /.test(line.k) && / → /.test(line.h) && line.p.length > 5 && line.go === 2 && line.src.length >= 1 && line.lit === 1, line);
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    ok('tutorial: Esc closes the line’s card', await js(p, () => !document.querySelector('#isx-cock .dossier:not([hidden])')));
    /* a line with a gauge on it shows the gauge with its source */
    const g = await js(p, () => { const S = ISX.sim, i = S.relations.findIndex(e => S.gauges.includes(e[0]) || S.gauges.includes(e[1])); document.querySelector(`#isx-rmap .feh[data-e="${i}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })); const d = document.querySelector('#isx-cock .dossier:not([hidden])'); return d ? { tiles: d.querySelectorAll('.dtile').length, src: [...d.querySelectorAll('.dtile .lsrc')].map(e => e.textContent.length) } : null; });
    ok('tutorial: a line with a gauge on it shows that gauge, dated and sourced', !!g && g.tiles >= 1 && g.src.every(n => n > 3), g);
    ok('tutorial: no page errors', p._errs.length === 0, p._errs);
    await p.context().close();
    /* in the guide a line opens only once the guide has reached it */
    p = await page('#simulator', { pos: '{"l":0,"b":0}' });
    const gate = await js(p, () => { const S = ISX.sim, reached = new Set(S.lines[S.line].steps[S.beat].e), not = S.relations.findIndex((e, i) => !reached.has(i)), yes = [...reached][0];
      const open = i => { document.querySelector(`#isx-rmap .feh[data-e="${i}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })); const d = document.querySelector('#isx-cock .dossier:not([hidden])'); const r = !!d; document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return r; };
      return { early: open(not), reached: open(yes) }; });
    ok('tutorial: in the guide a line that is not reached yet does not open; a reached one does', gate.early === false && gate.reached === true, gate);
    await p.context().close();
  }

  await b.close();
  console.log(fails ? `\n${fails} check(s) failed` : '\nall interface checks pass');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
