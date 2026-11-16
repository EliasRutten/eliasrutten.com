/* Scenarios polish (16 Nov 2026): checks for v2/b6.css and the polish in v2/scenes.js.
   Usage: node tools/b6-check.js [baseUrl]   — needs `python3 -m http.server 8731` at the repo root.
   1. “Full screen” is visible, unobstructed and inside the stage's top right group in the gallery and at every step and the
      close of every case, at 1280×720, 1366×768, 1440×900 and 1920×1080; on a 390 px phone it stays in the dock
   2. the date at the top of the stage says the step's date (the case's span at the close), on one line, clear of the corner
      buttons, and no node of the case sits under it; on a phone the card's kicker shows it instead
   3. one red: LINK.control and KIND.choke are #d0506a, and no scene element is painted in the old #ff3b5c
   4. every switch has a kind of coercion from CAT; the ledger's kind filter leaves exactly its own switches, combined with the
      holder filter; the drawer names the kind
   5. the entry: the map is transparent while the title card plays and back at full opacity once the case has landed */
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8731/imperial-stack/';
let fails = 0; const ok = (name, pass, info) => { console.log((pass ? 'PASS ' : 'FAIL ') + name + (pass || info === undefined ? '' : '  → ' + JSON.stringify(info))); if (!pass) fails++; };
const init = () => { try { ['isx-tips-globe', 'isx-tips-sim', 'isx-first', 'isx-insights', 'isx-intro', 'isx-tour', 'isx-simtour'].forEach(k => localStorage.setItem(k, 'off')); localStorage.setItem('isx-intro-off', '1'); } catch (e) {} };
(async () => {
  const b = await chromium.launch();
  const open = async (w, h, reduce = true) => {
    const c = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: reduce ? 'reduce' : 'no-preference', isMobile: w < 700, hasTouch: w < 700 });
    await c.addInitScript(init); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(base + '#scenarios', { waitUntil: 'load' }); await p.waitForFunction(() => window.ISX && ISX.booted && ISX.scenes, null, { timeout: 60000 });
    await p.waitForTimeout(800); await p.evaluate(() => document.getElementById('isx-sc3').scrollIntoView({ block: 'start' })); await p.waitForTimeout(300);
    return { p, c, errs };
  };
  const fsProbe = p => p.evaluate(() => {
    const f = document.getElementById('isx-fs'), r = f.getBoundingClientRect(), st = document.getElementById('isx-sc3').getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2), cs = getComputedStyle(f);
    return { group: f.parentNode.id || f.parentNode.className, shown: !f.hidden && cs.display !== 'none' && cs.visibility === 'visible' && r.width > 60, mine: !!hit && (hit === f || f.contains(hit)), top: r.top - st.top, right: st.right - r.right };
  });
  const DS = d => { const s = String(d).split(',')[0]; return s.length > 22 ? s.slice(0, 21) + '…' : s; };
  /* 1, 2 on four desktop sizes */
  for (const [w, h] of [[1280, 720], [1366, 768], [1440, 900], [1920, 1080]]) {
    const { p, c, errs } = await open(w, h); const bad = { fs: [], date: [], under: [] };
    let q = await fsProbe(p); if (!(q.shown && q.mine && q.group === 'b3nav' && q.top < 140 && q.right < 40)) bad.fs.push('gallery ' + JSON.stringify(q));
    const N = await p.evaluate(() => ISX.sc.STORIES.length);
    for (let i = 0; i < N; i++) {
      const S = await p.evaluate(i => { const c = ISX.sc.STORIES[i]; return { id: c.id, when: c.when, dates: c.steps.map(s => s.date) }; }, i);
      for (let n = 0; n <= S.dates.length; n++) {
        await p.evaluate(([i, n]) => ISX.sc.pick(i, { step: n, jump: true }), [i, n]); await p.waitForTimeout(60);
        q = await fsProbe(p); if (!(q.shown && q.mine && q.group === 'isx-b3-deep' && q.top < 140)) bad.fs.push(S.id + ' ' + n + ' ' + JSON.stringify(q));
        const d = await p.evaluate(() => {
          const e = document.getElementById('isx-b6-date'), bb = e.querySelector('b'), r = e.getBoundingClientRect(), br = bb.getBoundingClientRect();
          const boxes = ['.b3back', '#isx-b3-deep'].map(s => document.querySelector('#isx-sc3 ' + s).getBoundingClientRect());
          const clear = boxes.every(o => r.right <= o.left - 4 || r.left >= o.right + 4 || r.bottom <= o.top || r.top >= o.bottom);
          const nodes = [...document.querySelectorAll('#isx-b3-world .nd.on .nb')].map(x => x.getBoundingClientRect()).filter(o => o.width && o.left < r.right && o.right > r.left && o.top < r.bottom && o.bottom > r.top).length;
          return { t: bb.textContent, vis: getComputedStyle(e).display !== 'none' && br.height > 10 && br.height < 40, clip: bb.scrollWidth > bb.clientWidth + 1, clear, nodes };
        });
        const want = n >= S.dates.length ? S.when : DS(S.dates[n]);
        if (d.t !== want || !d.vis || d.clip || !d.clear) bad.date.push(S.id + ' ' + n + ' ' + JSON.stringify(d) + ' want ' + want);
        if (d.nodes) bad.under.push(S.id + ' ' + n);
      }
    }
    ok(`fs ${w}×${h}: “Full screen” shows, takes its own clicks, in the top right group of the gallery and of every step and close`, !bad.fs.length, bad.fs.slice(0, 6));
    ok(`date ${w}×${h}: the top of the stage says the step's date (the span at the close), on one line, clear of the corner buttons`, !bad.date.length, bad.date.slice(0, 6));
    ok(`date ${w}×${h}: no node sits under the date`, !bad.under.length, bad.under.slice(0, 8));
    ok(`${w}×${h}: no page errors`, !errs.length, errs.slice(0, 3));
    await c.close();
  }
  /* phone */
  { const { p, c } = await open(390, 844); let q = await fsProbe(p); const g = q.group;
    await p.evaluate(() => ISX.sc.pick(8, { step: 3, jump: true })); await p.waitForTimeout(200);
    const d = await p.evaluate(() => ({ top: getComputedStyle(document.getElementById('isx-b6-date')).display, kick: (document.querySelector('#isx-b3-card .b6cd') || {}).offsetWidth || 0 }));
    q = await fsProbe(p);
    ok('phone 390×844: “Full screen” stays in the dock; the date shows in the card, not at the top', g === 'isx-dock' && q.group === 'isx-dock' && d.top === 'none' && d.kick > 20, { g, q, d });
    await c.close(); }
  /* 3, 4 */
  { const { p, c, errs } = await open(1440, 900);
    const r = await p.evaluate(() => ({ link: ISX.sc.LINK.control.c, choke: ISX.sc.KIND.choke.c }));
    ok('red: LINK.control and KIND.choke are #d0506a', r.link === '#d0506a' && r.choke === '#d0506a', r);
    const old = await p.evaluate(async () => { const out = []; for (const [i, n] of [[8, 0], [0, 5], [6, 3]]) { ISX.sc.pick(i, { step: n, jump: true }); await new Promise(r => setTimeout(r, 120)); document.querySelectorAll('#isx-sc3 *').forEach(e => { const cs = getComputedStyle(e); const s = [cs.color, cs.fill, cs.stroke, cs.borderTopColor, cs.backgroundColor, cs.boxShadow, cs.backgroundImage].join(' '); if (/255, 59, 92/.test(s)) out.push(i + ':' + n + ' ' + (e.id || e.getAttribute('class'))); }); } return [...new Set(out)]; });
    ok('red: no element of the stage painted in the old #ff3b5c (gallery, a case, a switch step)', !old.length, old.slice(0, 8));
    const sw = await p.evaluate(() => ISX.scenes.sw);
    const cats = Object.keys(sw.CAT || {}), noCat = sw.SW.filter(w => !cats.includes(w.cat)).map(w => w.id);
    ok(`kinds: ${cats.length} kinds; every one of the ${sw.SW.length} switches has one`, cats.length >= 2 && !noCat.length, noCat);
    await p.evaluate(() => ISX.sc.set(-1)); await p.waitForTimeout(200);
    await p.click('#isx-b3-gal [data-b3="ledger"]'); await p.waitForTimeout(400);
    const bad = [];
    for (const k of cats) {
      await p.click(`#isx-b3-ledger [data-b6c="${k}"]`); await p.waitForTimeout(40);
      const got = await p.evaluate(() => [...document.querySelectorAll('#isx-b3-ledger .b3lc:not([hidden])')].map(b => b.dataset.sw).sort().join());
      const want = sw.SW.filter(w => w.cat === k).map(w => w.id).sort().join(); if (got !== want) bad.push(k);
      const chip = await p.evaluate(k => +document.querySelector(`#isx-b3-ledger [data-b6c="${k}"] b`).textContent, k); if (chip !== sw.SW.filter(w => w.cat === k).length) bad.push(k + ' count');
    }
    await p.click('#isx-b3-ledger [data-b3f="usstate"]'); await p.click('#isx-b3-ledger [data-b6c="tech"]'); await p.waitForTimeout(40);
    const both = await p.evaluate(() => document.querySelectorAll('#isx-b3-ledger .b3lc:not([hidden])').length);
    const wantBoth = sw.SW.filter(w => w.cat === 'tech' && w.type === 'state' && w.origin === 'US').length; if (both !== wantBoth) bad.push('both ' + both + ' want ' + wantBoth);
    ok('ledger: each kind leaves exactly its own switches and its chip counts them; the two filters combine', !bad.length, bad);
    await p.click('#isx-b3-ledger .b3lc:not([hidden])'); await p.waitForTimeout(500);
    await p.evaluate(() => document.querySelector('#isx-b3-deep [data-b3="read"]').click()); await p.waitForTimeout(300);
    const kind = await p.evaluate(() => (document.querySelector('#isx-b3-drawer [data-f="cat"]') || {}).textContent || '');
    ok('drawer: a switch step names its kind', kind === sw.CAT.tech.n, kind);
    ok('1440×900: no page errors', !errs.length, errs.slice(0, 3));
    await c.close(); }
  /* 5 */
  { const { p, c } = await open(1440, 900, false);
    await p.evaluate(() => document.querySelector('#isx-sc3 .b3cta').click()); await p.waitForTimeout(1600);
    const mid = await p.evaluate(() => ({ mode: document.getElementById('isx-sc3').dataset.mode, op: +getComputedStyle(document.getElementById('isx-b3-map')).opacity }));
    await p.waitForTimeout(4200);
    const end = await p.evaluate(() => ({ mode: document.getElementById('isx-sc3').dataset.mode, op: +getComputedStyle(document.getElementById('isx-b3-map')).opacity }));
    ok('entry: the map is out while the title card plays and back once the case has landed', mid.mode === 'entering' && mid.op < .05 && end.mode === 'scene' && end.op > .95, { mid, end });
    await c.close(); }
  await b.close();
  console.log(fails ? `\n${fails} check(s) failed` : '\nall Scenarios polish checks pass'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
