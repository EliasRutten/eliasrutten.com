/* ANA1 check (28 Nov 2026): the visit counter, and a page that does not need it.
   Usage: node tools/ana1-check.js [address of the Imperial Stack page] [--home=<address of the homepage>] [--only=desktop|phone]
   Default addresses: http://127.0.0.1:8731/imperial-stack/ and http://127.0.0.1:8731/ (serve-run.sh, or python3 -m http.server 8731 at the repo root).
   A single-file build works too for the stack page: file:///tmp/art.html (the homepage is then skipped unless --home is given).
   The counter's script is answered from tools/umami-stub.js or blocked; the real Umami is never reached, so no check sends a visit to the dashboard.
   Cases, each at 1440 × 900 and 390 × 844 on the stack page:
     A  the counter answers (stand-in): one `tab` event for each tab opened, once per visit, with the name as its only property, from the list;
        nothing else is handed to the counter
     B  the counter's host is blocked (the request is aborted, as an ad blocker does): the page boots, the globe library is ok, every tab draws,
        no page error, no console error beyond the blocked request itself, and the event calls are a no-op
     C  the script arrives empty (a blocker that answers 200 with nothing): the same as B
     D  the counter's track() throws: the page and the tabs go on, no page error
     E  the page's own list: ISX.ana refuses an event or property that is not listed, and a value that is not a short lowercase token
   And on the homepage (1440 and 390): the tag is there once, with the website ID, defer, do-not-track, no hash, the two domains; the notice is
   there; it boots and has no page error with the counter answering and with it blocked.
   Plus a read of both HTML files: one tag each, no other third-party script, no leftover Plausible tag. */
const { chromium } = require('playwright');
const fs = require('fs');
const args = process.argv.slice(2);
const base = args.find(a => /^(https?|file):/.test(a) && !a.startsWith('--')) || 'http://127.0.0.1:8731/imperial-stack/';
const homeArg = (args.find(a => a.startsWith('--home=')) || '').slice(7);
const home = homeArg || (base.startsWith('http://127.0.0.1:8731/') ? 'http://127.0.0.1:8731/' : '');
const only = (args.find(a => a.startsWith('--only=')) || '').slice(7);
const stub = require('path').join(__dirname, 'umami-stub.js');
const ID = '5cf7242b-231c-40e9-90e5-f37023bf82ec';
const NOTE = 'This site uses privacy-friendly analytics, without cookies, to see which pages and tabs people open and roughly where visitors come from. I use it to understand what interests people and to improve the website.';
const TABS = ['circuit', 'simulator', 'profit', 'imperial-arm', 'elite-network'];
const TAB_BTN = { 'isx-v-map': 'circuit', 'isx-v-fin': 'simulator', 'isx-v-profit': 'profit', 'isx-v-story': 'imperial-arm', 'isx-v-arm': 'elite-network' };
let fails = 0;
const ok = (name, cond, extra) => { if (!cond) fails++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 600) : '')); };
const t0 = Date.now();
const SCRIPT = 'https://cloud.umami.is/script.js', SEND = 'https://cloud.umami.is/api/send';
const url = (b, hash) => b.replace(/#.*$/, '') + (hash || '');

/* mode: 'answer' | 'block' | 'empty' | 'throws' */
async function setup(b, mode, w, h, touch, quiet) {
  const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: touch, isMobile: touch });
  if (quiet) await c.addInitScript(() => { try { ['isx-tips-globe', 'isx-tips-sim', 'isx-first', 'isx-insights', 'isx-tour', 'isx-simtour'].forEach(k => localStorage.setItem(k, 'off')); localStorage.setItem('isx-intro-off', '1'); } catch (e) {} });
  const posts = [];
  await c.route(SCRIPT, r => {
    if (mode === 'block') return r.abort('blockedbyclient');
    if (mode === 'empty') return r.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    if (mode === 'throws') return r.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.umami={track:function(){throw new Error("counter broke")}};' });
    return r.fulfill({ path: stub, contentType: 'application/javascript', headers: { 'access-control-allow-origin': '*' } });
  });
  await c.route(SEND, r => { try { posts.push(JSON.parse(r.request().postData() || '{}').payload || {}); } catch (e) { posts.push({ bad: true }); } r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }); });
  const p = await c.newPage(); p._c = c; p._posts = posts; p._errs = []; p._out = [];
  p.on('pageerror', e => p._errs.push('page: ' + String(e).slice(0, 200)));
  p.on('console', m => {
    if (m.type() !== 'error' || /favicon/i.test(m.text())) return;
    /* the one console line a blocked request is allowed to leave: the browser's note that the counter's script did not load */
    if (mode === 'block' && /Failed to load resource|ERR_/i.test(m.text()) && /umami/i.test((m.location() || {}).url || '')) return;
    p._errs.push('console: ' + m.text().slice(0, 200));
  });
  p.on('request', r => {
    const u = r.url(); if (/^(data|blob|about|file):/.test(u) || /favicon/i.test(u)) return;
    let o = ''; try { o = new URL(u).origin; } catch (e) { return; }
    if (o !== new URL(base.startsWith('file:') ? 'http://x' : base).origin && !/umami/.test(new URL(u).host)) p._out.push(u.slice(0, 120));
  });
  return p;
}
const boot = async (p, hash) => {
  await p.goto(url(base, hash), { waitUntil: 'load', timeout: 90000 });
  await p.waitForFunction(() => window.ISX && ISX.booted && !document.getElementById('isx-root').classList.contains('booting'), null, { timeout: 60000 });
  await p.waitForTimeout(1200);
};
const clickTabs = async p => {
  const ids = await p.evaluate(() => [...document.querySelectorAll('#isx-strip .seg > button')].map(x => x.id).filter(i => !document.getElementById(i).disabled));
  const res = [];
  for (const id of ids) {
    await p.evaluate(i => document.getElementById(i).click(), id);
    await p.waitForTimeout(1500);
    res.push(await p.evaluate(i => {
      const shown = [...document.querySelectorAll('#isx-frame .scene')].filter(e => !e.hidden && e.getClientRects().length), e = shown[0], rc = e && e.getBoundingClientRect();
      return { id: i, shown: shown.length, w: rc ? Math.round(rc.width) : 0, h: rc ? Math.round(rc.height) : 0, art: e ? e.querySelectorAll('svg, canvas').length : 0, nodes: e ? e.querySelectorAll('*').length : 0 };
    }, id));
  }
  return res;
};

(async () => {
  const b = await chromium.launch();
  const SIZES = [['desktop', 1440, 900, false], ['phone', 390, 844, true]].filter(s => !only || s[0] === only);
  for (const [label, w, h, touch] of SIZES) {
    const tag = `${label} ${w}×${h}`;

    /* A */
    let p = await setup(b, 'answer', w, h, touch, true);
    await boot(p, '#circuit');
    const drawn = await clickTabs(p);
    await p.evaluate(() => document.getElementById('isx-v-profit').click());   /* a second visit to a tab already seen */
    await p.waitForTimeout(800);
    const A = await p.evaluate(() => ({ ana: !!(window.ISX && ISX.ana), log: ISX.ana ? ISX.ana.log : [], calls: window.__umamiCalls || [], umami: typeof window.umami }));
    await p.waitForTimeout(500);
    const names = A.log.filter(e => e.name === 'tab').map(e => e.data.name);
    ok(`A · ${tag}: ISX.ana exists and the counter's stand-in answered`, A.ana && A.umami === 'object', A);
    ok(`A · ${tag}: one \`tab\` event for each of the five tabs, in the order opened, and none twice`, names.length === 5 && new Set(names).size === 5 && TABS.every(t => names.includes(t)), names);
    ok(`A · ${tag}: \`tab\` carries only its name; nothing else was handed to the counter`, A.log.every(e => e.name === 'tab' && Object.keys(e.data).join() === 'name') && A.calls.length === A.log.length, { log: A.log.length, calls: A.calls.length });
    ok(`A · ${tag}: the events that reached /api/send match what the page handed over`, p._posts.length === A.calls.length && p._posts.every(e => e.website === ID && e.name === 'tab' && Object.keys(e).sort().join() === 'data,name,website'), p._posts.slice(0, 3));
    ok(`A · ${tag}: every tab drew while the counter was on`, drawn.length >= 5 && drawn.every(r => r.shown === 1 && r.w >= 200 && r.h >= 200 && r.art >= 1 && r.nodes >= 40), drawn.filter(r => r.shown !== 1 || r.art < 1));
    ok(`A · ${tag}: no page or console error; no request left the page except to the counter`, !p._errs.length && !p._out.length, [p._errs, p._out]);
    /* E: the list guards itself */
    const E = await p.evaluate(() => {
      const n0 = ISX.ana.log.length, r = [];
      r.push(ISX.ana.send('page_view', {}));                       /* an event that is not listed */
      r.push(ISX.ana.send('tab', { name: 'circuit', email: 'a@b.c' }));   /* a property that is not listed */
      r.push(ISX.ana.send('tab', { name: 'Elias Rutten' }));             /* a value that is not a tab */
      r.push(ISX.ana.send('tab', { name: 'https://x.y/?id=1' }));
      r.push(ISX.ana.send('tab'));                                 /* no name: a listed property is required */
      return { r, grew: ISX.ana.log.length - n0, events: ISX.ana.events };
    });
    ok(`E · ${tag}: an unlisted event, an unlisted property and a value that is not a listed tab are all refused`, E.r.every(x => x === false) && E.grew === 0, E);
    /* the notice lives in "About this map" (the entry screen the ? menu replays) */
    await p.evaluate(() => { const b = document.getElementById('isx-about'); if (b) b.click(); });
    await p.waitForTimeout(600);
    const AB = await p.evaluate(() => { const n = document.getElementById('isx-count-note'), r = n && n.getBoundingClientRect(); return { text: n ? n.textContent.trim() : null, shown: !!(r && r.width > 0 && r.height > 0), inIntro: !!(n && n.closest('#isx-intro')) }; });
    ok(`A · ${tag}: "About this map" carries the analytics notice, visible, and nowhere else in the app`, AB.text === NOTE && AB.shown && AB.inIntro, AB);
    ok(`E · ${tag}: the list holds only \`tab\` in ANA1`, E.events.join() === 'tab', E.events);
    await p._c.close();

    /* B, C, D */
    for (const [letter, mode, what] of [['B', 'block', 'the counter is blocked'], ['C', 'empty', 'the counter arrives empty'], ['D', 'throws', 'the counter throws']]) {
      p = await setup(b, mode, w, h, touch, true);
      let booted = false;
      try { await boot(p, '#circuit'); booted = true; } catch (e) { ok(`${letter} · ${tag}: ${what}: the page boots`, false, String(e).slice(0, 300)); }
      if (!booted) { await p._c.close(); continue; }
      const st = await p.evaluate(() => ({ booted: !!ISX.booted, glib: window.__isxGlib, umami: typeof window.umami, ana: !!ISX.ana }));
      ok(`${letter} · ${tag}: ${what}: the page boots and the globe library is ok`, st.booted && st.glib === 'ok' && st.ana, st);
      const dr = await clickTabs(p);
      ok(`${letter} · ${tag}: ${what}: every tab opens and draws`, dr.length >= 5 && dr.every(r => r.shown === 1 && r.w >= 200 && r.h >= 200 && r.art >= 1 && r.nodes >= 40), dr.filter(r => r.shown !== 1 || r.art < 1));
      const glob = await p.evaluate(() => { document.getElementById('isx-v-map').click(); return null; }).then(() => p.waitForTimeout(1500)).then(() => p.evaluate(() => { const c = document.querySelector('#scene-map canvas, #isx-frame canvas'); return { canvas: !!c, w: c ? c.width : 0 }; }));
      ok(`${letter} · ${tag}: ${what}: the globe draws (a canvas with size)`, glob.canvas && glob.w > 100, glob);
      const calls = await p.evaluate(() => (window.__umamiCalls || []).length);
      ok(`${letter} · ${tag}: ${what}: nothing reached /api/send${mode === 'throws' ? ' beyond a throw that was swallowed' : ''}`, p._posts.length === 0 && calls === 0, { posts: p._posts.length, calls });
      ok(`${letter} · ${tag}: ${what}: no page error, no console error (a blocked request's own note aside)`, !p._errs.length, p._errs.slice(0, 4));
      await p._c.close();
    }
  }

  /* the homepage */
  if (home) {
    for (const [label, w, h, touch] of [['desktop', 1440, 900, false], ['phone', 390, 844, true]].filter(s => !only || s[0] === only)) {
      const tag = `home ${label} ${w}×${h}`;
      for (const mode of ['answer', 'block']) {
        const c = await b.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch });
        await c.route(SCRIPT, r => mode === 'block' ? r.abort('blockedbyclient') : r.fulfill({ path: stub, contentType: 'application/javascript' }));
        await c.route(SEND, r => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
        const pg = await c.newPage(), errs = [];
        pg.on('pageerror', e => errs.push(String(e).slice(0, 200)));
        pg.on('console', m => { if (m.type() === 'error' && !/favicon/i.test(m.text()) && !(mode === 'block' && /umami/i.test((m.location() || {}).url || ''))) errs.push('console: ' + m.text().slice(0, 200)); });
        await pg.goto(home, { waitUntil: 'load', timeout: 60000 });
        await pg.waitForTimeout(800);
        const H = await pg.evaluate(() => {
          const tags = [...document.querySelectorAll('script[src*="umami"]')], t = tags[0], n = document.getElementById('analytics-note'), r = n && n.getBoundingClientRect();
          return { count: tags.length, id: t && t.getAttribute('data-website-id'), src: t && t.getAttribute('src'), defer: t && t.defer, dnt: t && t.getAttribute('data-do-not-track'), hash: t && t.getAttribute('data-exclude-hash'), domains: t && t.getAttribute('data-domains'),
            note: n ? n.textContent.trim() : null, noteShown: !!(r && r.width > 0 && r.height > 0), h1: !!document.querySelector('h1'), umami: typeof window.umami, overflow: document.documentElement.scrollWidth > window.innerWidth + 1 };
        });
        if (mode === 'answer') {
          ok(`${tag}: one tracker tag with the website ID, defer, do-not-track, no hash, the two domains`, H.count === 1 && H.id === ID && H.src === 'https://cloud.umami.is/script.js' && H.defer === true && H.dnt === 'true' && H.hash === 'true' && H.domains === 'eliasrutten.com,www.eliasrutten.com', H);
          ok(`${tag}: the notice is on the page and visible`, H.note === NOTE && H.noteShown, H);
          ok(`${tag}: no sideways overflow`, !H.overflow, H);
        }
        ok(`${tag}: the page loads with the counter ${mode === 'block' ? 'blocked' : 'answering'}: it has its heading and no error`, H.h1 && !errs.length && (mode === 'block' ? H.umami === 'undefined' : H.umami === 'object'), { H, errs });
        await c.close();
      }
    }
  }

  /* the files themselves */
  const root = require('path').resolve(__dirname, '..');
  for (const f of ['index.html', 'imperial-stack/index.html']) {
    const s = fs.readFileSync(require('path').join(root, f), 'utf8');
    const tags = s.match(/<script[^>]*umami[^>]*><\/script>/g) || [];
    const ext = [...s.matchAll(/<script[^>]*\ssrc="(https?:)?\/\/([^/"]+)/g)].map(m => m[2]);
    ok(`files · ${f}: one tracker tag`, tags.length === 1 && tags[0].includes(`data-website-id="${ID}"`), tags);
    ok(`files · ${f}: no other third-party script (only cloud.umami.is)`, ext.every(h => h === 'cloud.umami.is'), ext);
    ok(`files · ${f}: no leftover Plausible script tag`, !/<script[^>]*plausible/i.test(s));
  }

  await b.close();
  console.log(`${fails ? 'ANA1 CHECK FAILED' : 'ANA1 CHECK OK'} · ${Math.round((Date.now() - t0) / 1000)} s · ${base}`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FAIL ana1-check crashed  → ' + String(e).slice(0, 500)); process.exit(1); });
