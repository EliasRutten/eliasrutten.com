/* Checks for the profit tab patch of 18 Nov 2026 (the entry screens, the renames, the profit dollar as an arc) and for the orbit view.
   Usage: node tools/arc-check.js [baseUrl] [--only=1,2]   — needs `python3 -m http.server 8731` at the repo root. Exits 1 on a failed check.
   1 the renames and the addresses · 2 the entry screens · 3 the arc: stations, views, dots, notes · 4 Bought each year and One year
   · 5 the finale · 6 phones · 7 the orbit view (stage 2). */
const { chromium } = require('playwright');
const args = process.argv.slice(2), base = args.find(a => /^(https?|file):/.test(a)) || 'http://127.0.0.1:8731/imperial-stack/';
const ONLY = (args.find(a => /^--only=/.test(a)) || '').slice(7).split(',').filter(Boolean).map(Number), want = n => !ONLY.length || ONLY.includes(n);
let n = 0, fail = 0;
const ok = (c, t, x) => { n++; if (!c) { fail++; console.log('FAIL  ' + t + (x !== undefined ? '  → ' + JSON.stringify(x).slice(0, 400) : '')); } else if (process.env.V) console.log('ok    ' + t); };
(async () => {
  const b = await chromium.launch();
  const open = async (hash, o) => {
    o = o || {}; const c = await b.newContext({ viewport: { width: o.w || 1440, height: o.h || 900 }, hasTouch: !!o.phone, isMobile: !!o.phone, reducedMotion: o.motion ? 'no-preference' : 'reduce' }); const p = await c.newPage(); p._errs = [];
    p.on('pageerror', e => p._errs.push(String(e)));
    await p.addInitScript(first => { try { localStorage.setItem('isx-first', 'off'); localStorage.setItem('isx-intro-seen', '1'); if (first) { ['isx-open-circuit', 'isx-open-sim'].forEach(k => localStorage.setItem(k, '1')); localStorage.setItem('isx-hints-off', '1'); localStorage.setItem('isx-tour', 'off'); localStorage.setItem('isx-simtour', 'off'); } else localStorage.setItem('isx-tips-sim', 'off'); } catch (e) { /* ignore */ } }, !!o.first);
    await p.goto(base + (hash || ''), { waitUntil: 'load' });
    await p.waitForFunction(() => window.ISX && ISX.booted, null, { timeout: 90000 });
    if (/^#profit/.test(hash || '')) await p.waitForFunction(() => ISX.profit && ISX.profit.state.ready, null, { timeout: 30000 });
    await p.waitForTimeout(400); return p;
  };
  const done = async p => { ok(!p._errs.length, 'no page errors', p._errs.slice(0, 3)); await p.context().close(); };

  if (want(1)) {
    let p = await open('');
    const pills = await p.evaluate(() => ['map', 'profit', 'arm', 'fin', 'story'].map(k => document.querySelector('#isx-v-' + k + ' .lg').textContent));
    ok(JSON.stringify(pills) === JSON.stringify(['The circuit', 'The profit dollar', 'The elite network', 'The imperial machinery', 'The imperial arm']), 'the five tabs are named: circuit, profit dollar, elite network, imperial machinery, imperial arm', pills);
    await p.click('#isx-v-arm'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => location.hash) === '#elite-network', 'the elite network writes #elite-network');
    await p.click('#isx-v-story'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => location.hash.indexOf('#imperial-arm') === 0), 'the imperial arm writes #imperial-arm');
    ok(!(await p.evaluate(() => /Imperial arm tab|the Arm, the Machinery|>Scenarios<\/span><span class="sm">/.test(document.getElementById('isx-root').innerHTML))), 'no old tab name is left in the page');
    await done(p);
    for (const [old, view, neu] of [['#arm', 'arm', '#elite-network'], ['#arm/rel=control', 'arm', '#elite-network/rel=control'], ['#scenarios', 'story', '#imperial-arm'], ['#Scenarios', 'story', '#imperial-arm'], ['#network', 'arm', '#elite-network']]) {
      p = await open(old); const r = await p.evaluate(() => ({ v: ISX.view, h: location.hash }));
      ok(r.v === view && r.h === neu, 'the old address ' + old + ' opens the same tab and becomes ' + neu, r); await p.context().close();
    }
    p = await open('#circuit'); await p.evaluate(() => { location.hash = '#scenarios'; }); await p.waitForTimeout(500);
    let r = await p.evaluate(() => ({ v: ISX.view, h: location.hash })); ok(r.v === 'story' && r.h === '#imperial-arm', 'an old address typed while the page is open is rewritten too', r);
    await p.evaluate(() => { location.hash = '#circuit/ring'; }); await p.waitForTimeout(900);
    const doors = await p.evaluate(() => [...document.querySelectorAll('.rgdoor')].map(a => a.getAttribute('href') + '|' + a.querySelector('b').textContent));
    ok(doors.join(',') === '#profit|The profit dollar,#simulator|The imperial machinery,#elite-network|The elite network,#imperial-arm|The imperial arm', 'the ring has four doors with the new names and addresses', doors);
    await done(p);
  }

  if (want(2)) {
    const COPY = { profit: ['The profit dollar', 'Why dollar assets need to be the most profitable'], arm: ['The elite network', 'Where Washington’s reach is organised: officials, firms and owners'], fin: ['The imperial machinery', 'How Washington keeps the circuit turning'], story: ['The imperial arm', 'Scenarios: how the arm is used'] };
    let p = await open('', { first: 1 });
    ok(!(await p.evaluate(() => ISX.enter.on)), 'the Circuit has no new entry screen (it keeps “About this map”)');
    for (const v of ['profit', 'arm', 'fin', 'story']) {
      await p.click('#isx-v-' + v); await p.waitForTimeout(700);
      const r = await p.evaluate(() => { const e = document.getElementById('isx-enter'); if (!e) return null; const w = document.querySelector('#isx-root > .wrap'); return { tab: e.dataset.tab, k: e.querySelector('.en-k').textContent, h: e.querySelector('.en-h').childNodes[0].textContent, blocks: [...e.querySelectorAll('.en-b h3')].map(x => x.textContent), btns: e.querySelectorAll('.en-acts .en-btn').length, inert: w.inert, modal: e.getAttribute('aria-modal'), more: e.querySelector('#isx-en-more').hidden, cover: e.getBoundingClientRect().width >= innerWidth && e.getBoundingClientRect().height >= innerHeight, focus: e.contains(document.activeElement) }; });
      ok(r && r.tab === v && r.k.indexOf(COPY[v][0]) >= 0 && r.h === COPY[v][1], 'entering “' + COPY[v][0] + '” for the first time shows its entry screen, with its title', r);
      ok(r && r.blocks.length === 3 && r.blocks[0] === 'Where you are' && r.blocks[1] === 'What you are about to see' && /^How to (use|read) it$/.test(r.blocks[2]) && r.btns === 3 && r.more, v + ': three blocks, three buttons, no second row yet', r);
      ok(r && r.cover && r.inert && r.modal === 'true' && r.focus, v + ': the screen covers the window, holds the focus, and the page behind is out of reach', r);
      await p.keyboard.press('Escape'); await p.waitForTimeout(900);
      const after = await p.evaluate(v => ({ on: ISX.enter.on, el: !!document.getElementById('isx-enter'), inert: document.querySelector('#isx-root > .wrap').inert, seen: localStorage.getItem('isx-enter-' + v), view: ISX.view }), v);
      ok(!after.on && !after.el && !after.inert && after.seen === '1' && after.view === v, v + ': Esc skips it; the tab is there and the screen is remembered as seen', after);
    }
    await p.click('#isx-v-map'); await p.click('#isx-v-profit'); await p.waitForTimeout(600);
    ok(!(await p.evaluate(() => ISX.enter.on)), 'a second entry into the tab does not show the screen again');
    await p.click('#isx-helpb'); await p.click('#isx-tabx'); await p.waitForTimeout(400);   /* machinery entry round (19 Nov 2026): a labelled button in place of the ⓘ on the four tabs */
    ok(await p.evaluate(() => ISX.enter.on === 'profit' && !ISX.intro), '“How this tab works” in the header opens the tab’s entry screen again');
    /* the profit dollar: the footnote, the stations, the reminder */
    await p.click('#isx-enter .en-star'); let r = await p.evaluate(() => { const nn = document.getElementById('isx-en-note'); return { open: !nn.hidden, t: nn.textContent }; });
    ok(r.open && /Only a very large economy can play this role/.test(r.t) && ['Strange', 'Cohen', 'Kindleberger', 'Eichengreen', 'Helleiner'].every(x => r.t.indexOf(x) >= 0), 'the asterisk opens the footnote with its five references', r);
    await p.click('#isx-enter [data-en="stops"]'); r = await p.evaluate(() => [...document.querySelectorAll('#isx-en-more .en-ch b')].map(x => x.textContent));
    ok(r.length === 6 && /Profits/.test(r[0]) && /Technology/.test(r[1]) && /The order/.test(r[2]) && /The regime/.test(r[3]) && /The AI trade/.test(r[4]), '“Jump to a station” shows the six stations', r);
    await p.click('#isx-enter [data-en-stop="3"]'); await p.waitForTimeout(900);
    r = await p.evaluate(() => ({ on: ISX.enter.on, st: ISX.profit.state.st, view: ISX.profit.state.view })); ok(!r.on && r.st === 'regime' && r.view === 'all', 'choosing a station closes the screen and opens it: the regime, on the stacked chart', r);
    await p.click('#isx-helpb'); await p.click('#isx-tabx'); await p.waitForTimeout(300); await p.click('#isx-enter [data-en="remind"]'); await p.waitForTimeout(300);
    r = await p.evaluate(() => { const m = document.getElementById('isx-remind'); return { on: ISX.remind.on, inside: !!m && document.getElementById('isx-enter').contains(m), link: decodeURIComponent(ISX.remind.link || ''), sum: m && m.querySelector('.rm-sum').textContent }; });
    ok(r.on && r.inside && /the profit dollar/.test(r.link) && /#profit/.test(r.link) && /The profit dollar/.test(r.sum), '“Remind me later” opens the reminder on the screen, for this tab', r);
    await p.keyboard.press('Escape'); await p.waitForTimeout(200); ok(await p.evaluate(() => !ISX.remind.on && ISX.enter.on === 'profit'), 'Esc closes the reminder first, the screen stays');
    await p.click('#isx-enter [data-en="go"]'); await p.waitForTimeout(900);
    r = await p.evaluate(() => ({ on: ISX.enter.on, st: ISX.profit.state.st })); ok(!r.on && r.st === 'profits', '“Start at the first station” opens station 1', r);
    await done(p);
    /* the machinery: levels only after “Learn step by step”; the tour only after “Explore on my own” */
    p = await open('#simulator', { first: 1 }); await p.waitForTimeout(600);
    r = await p.evaluate(() => ({ on: ISX.enter.on, ge: !document.querySelector('#isx-gentry'), more: document.querySelector('#isx-en-more') && document.querySelector('#isx-en-more').hidden, txt: document.querySelector('#isx-enter .en-b').textContent, sub: (document.querySelector('#isx-enter .en-sub') || {}).href }));
    ok(r.on === 'fin' && r.ge && r.more && /manufactured, and used as a weapon/.test(r.txt) && /paid pieces on the Substack/.test(r.txt) && /substack\.com/.test(r.sub || ''), 'the machinery’s screen carries the approved text and the line on the paid pieces, with the Substack link', r);
    /* machinery entry round (19 Nov 2026): the levels come from data, with a Time and a Difficulty bar and no minutes (changed on purpose) */
    await p.click('#isx-enter [data-en="levels"]'); r = await p.evaluate(() => [...document.querySelectorAll('#isx-en-more .en-ch')].map(x => x.dataset.enWay + ':' + (x.querySelector('.en-tb i') ? 'bar' : '') + ':' + (/\d+\s*min|minutes/i.test(x.textContent) ? 'mins' : '')));
    ok(r.join() === 'ground:bar:,guide:bar:,map:bar:', 'the three levels appear only after “Learn step by step”, with Time and Difficulty bars and no minutes', r);
    await p.click('#isx-en-more [data-en-way="guide"]'); await p.waitForTimeout(1200);
    r = await p.evaluate(() => ({ on: ISX.enter.on, way: localStorage.getItem('isx-way'), mode: ISX.sim.mode, ge: !!document.querySelector('#isx-gentry'), pre: ISX.sim.lines[ISX.sim.line].pre && ISX.sim.beat === 0 })); ok(!r.on && r.way === 'guide' && r.mode === 'story' && !r.ge && r.pre, 'a level closes the screen and starts the guide at that level', r);
    await done(p);
    p = await open('#simulator', { first: 1 }); await p.waitForTimeout(600); await p.click('#isx-enter [data-en="free"]'); await p.waitForTimeout(1200);
    r = await p.evaluate(() => ({ on: ISX.enter.on, mode: ISX.sim.mode, offer: !!document.querySelector('.en-offer'), th: ISX.simThesis })); ok(!r.on && r.mode === 'full' && r.offer && !r.th, '“Explore on my own” opens the full view without the thesis and offers the tour in the corner', r);
    await p.click('.en-offer [data-eo="tour"]'); await p.waitForTimeout(500); ok(await p.evaluate(() => ISX.simtour.on && !document.querySelector('.en-offer')), 'the offer starts the tour of the screen');
    await done(p);
    /* a link to a place inside a tab never shows the screen; reduced motion and a click outside */
    p = await open('#profit/regime/sum', { first: 1 }); ok(!(await p.evaluate(() => ISX.enter.on)), 'a link to a place inside the tab does not show the entry screen'); await done(p);
    p = await open('#imperial-arm', { first: 1 }); await p.waitForTimeout(600); await p.mouse.click(8, 8); await p.waitForTimeout(600);
    ok(!(await p.evaluate(() => ISX.enter.on)), 'a click outside the column skips the screen'); await done(p);
    p = await open('#elite-network', { first: 1 }); await p.waitForTimeout(600); await p.click('#isx-enter [data-en="tour"]'); await p.waitForTimeout(2600);
    r = await p.evaluate(() => ({ on: ISX.enter.on, off: localStorage.getItem('isx-hints-off'), hint: ISX.hints.on })); ok(!r.on && r.off === null && /^arm-/.test(r.hint || ''), 'the elite network’s “Take the tour” plays its hints again', r);
    await done(p);
    p = await open('#imperial-arm', { first: 1 }); await p.waitForTimeout(600); await p.click('#isx-enter [data-en="lever"]'); await p.waitForTimeout(900);
    ok(await p.evaluate(() => !ISX.enter.on && document.getElementById('isx-b3-ledger').classList.contains('on')), '“Follow one lever” opens the list of all switches'); await done(p);
  }

  if (want(3)) {
    const p = await open('#profit');
    let r = await p.evaluate(() => ({ st: ISX.profit.stations.map(s => s.id + ':' + s.views.join(',')), tt: document.querySelector('.pf-ttl').childNodes[0].textContent, k: document.getElementById('isx-pf-k').textContent, q: document.getElementById('isx-pf-q').textContent, bar: [...document.querySelectorAll('#isx-tabs .rt [data-rt-target], #isx-tabs .rt .rt-mark')].length }));
    ok(r.st.join(' | ') === 'profits:pic,hold,flow,own,list | technology:tri,nat,roc | order:ord,pos | regime:all,sum,why,home,pay | ai:wt,capex,ni | finale:' || /^profits:pic,hold,flow,own,list \| technology:tri,nat,roc \| order:orb,ord,pos \| regime:all,sum,why,home,pay \| ai:wt,capex,ni \| finale:$/.test(r.st.join(' | ')), 'six stations hold every view of build 1 (17) and the new ones', r.st);
    ok(r.tt === 'Why dollar assets need to be the most profitable' && /Station 1 of 6/.test(r.k) && r.q === 'Savers want profitable equity. That is why they buy US stocks.', 'the tab’s title, the station count and station 1’s title', r);
    await p.click('.pf-star'); r = await p.evaluate(() => ({ open: !document.getElementById('isx-pf-fn').hidden, t: document.getElementById('isx-pf-fn').textContent, ex: document.querySelector('.pf-star').getAttribute('aria-expanded') }));
    ok(r.open && r.ex === 'true' && /Sterling and British Policy/.test(r.t) && /The Geography of Money/.test(r.t) && /International Money/.test(r.t) && /Exorbitant Privilege/.test(r.t) && /The Status Quo Crisis/.test(r.t) && /link not stored/.test(r.t) && /checked 18 Nov 2026/.test(r.t), 'the asterisk opens the footnote under the title', r); await p.click('.pf-star');
    const TITLES = ['Savers want profitable equity. That is why they buy US stocks.', 'The highest technological sophistication is the surest way to secure profits: through economics, coercion and code.', null, 'Deficits realise the profits, and the inflow needs the deficits.', 'The AI trade is what now keeps the claim worth buying.', 'What if AI doesn’t deliver?'];
    const ST = await p.evaluate(() => ISX.profit.stations);
    for (let i = 0; i < ST.length; i++) {
      await p.evaluate(i => ISX.profit.go(i), i); await p.waitForTimeout(150);
      const q = await p.evaluate(() => document.getElementById('isx-pf-q').textContent); if (TITLES[i]) ok(q === TITLES[i], 'station ' + (i + 1) + ' carries its title', q);
      for (let j = 0; j < ST[i].views.length; j++) {
        const v = ST[i].views[j]; await p.evaluate(v => { const d = document.querySelector('.pf-dot[data-pv="' + v + '"]'); if (d) d.click(); }, v); await p.waitForTimeout(120);
        const s = await p.evaluate(() => { const f = document.getElementById('isx-pf-fig'), sv = f.querySelector('svg[role="img"]'), tri = f.querySelector('.pf-tri, .pf-orb'), nt = document.getElementById('isx-pf-note'), dots = [...document.querySelectorAll('.pf-dot')];
          return { view: ISX.profit.state.view, alt: sv ? (sv.getAttribute('aria-label') || '').length : tri ? (tri.getAttribute('aria-label') || '').length : 0, vn: document.getElementById('isx-pf-vn').textContent, title: document.getElementById('isx-pf-title').textContent, note: !nt.hidden, noteT: nt.querySelector('span').textContent, dots: dots.length, cur: dots.filter(d => d.getAttribute('aria-current') === 'true').length, chips: [...document.querySelectorAll('#isx-pf-chips [data-pv]')].length, hash: location.hash }; });
        ok(s.view === v && s.alt > 60 && s.title.length > 8, ST[i].id + '/' + v + ': the view draws, with a text alternative', s);
        ok(s.dots === ST[i].views.length && s.cur === 1 && s.chips === 0 && s.vn.indexOf((j + 1) + ' of ' + ST[i].views.length) > 0, ST[i].id + '/' + v + ': dots are the switch (no pills) and the view’s name stands above the chart', s);
        ok(j === 0 ? !s.note : s.note && s.noteT.length > 40, ST[i].id + '/' + v + (j ? ': a secondary view carries its note' : ': the main screen carries no note'), s);
        await p.click('#isx-pf-table'); const t = await p.evaluate(() => ({ rows: document.querySelectorAll('#isx-pf-fig table tbody tr').length, cap: (document.querySelector('#isx-pf-fig caption') || {}).textContent })); ok(t.rows >= 3 && t.cap && t.cap.length > 30, ST[i].id + '/' + v + ': the table view has its rows and a caption', t); await p.click('#isx-pf-table');
      }
    }
    /* the arrows, the keys of the link, the note's close and “?” */
    await p.evaluate(() => ISX.profit.go(0, 'pic')); await p.waitForTimeout(150);
    r = await p.evaluate(() => ({ pv: document.querySelector('.pf-arr.pv').disabled, nx: document.querySelector('.pf-arr.nx').textContent })); ok(r.pv && /Held abroad/.test(r.nx), 'the arrows name the view they lead to; no earlier view on the first', r);
    await p.click('.pf-arr.nx'); await p.waitForTimeout(150); r = await p.evaluate(() => ({ v: ISX.profit.state.view, h: location.hash })); ok(r.v === 'hold' && r.h === '#profit/profits/hold', 'the next arrow moves one view on and the link follows', r);
    await p.click('#isx-pf-note .x'); r = await p.evaluate(() => ({ hid: document.getElementById('isx-pf-note').hidden, q: !document.getElementById('isx-pf-whyq').hidden })); ok(r.hid && r.q, 'the note closes and leaves a “?”', r);
    await p.click('.pf-arr.nx'); await p.waitForTimeout(150); ok(await p.evaluate(() => document.getElementById('isx-pf-note').hidden && !document.getElementById('isx-pf-whyq').hidden), 'a closed note stays closed on the next view');
    await p.click('#isx-pf-whyq'); ok(await p.evaluate(() => !document.getElementById('isx-pf-note').hidden && /Who buys matters/.test(document.getElementById('isx-pf-note').textContent)), 'the “?” opens the note again');
    for (const [old, st, v] of [['#profit/claims', 'profits', 'hold'], ['#profit/claims/flow', 'profits', 'flow'], ['#profit/claims/pay', 'regime', 'pay'], ['#profit/regime/pos', 'order', 'pos'], ['#profit/ai/why', 'regime', 'why'], ['#profit/profits/nat', 'technology', 'nat'], ['#profit/regime', 'regime', 'all'], ['#profit/ai', 'ai', 'wt']]) {
      await p.evaluate(h => { location.hash = h; }, old); await p.waitForTimeout(250); r = await p.evaluate(() => ISX.profit.state); ok(r.st === st && r.view === v, 'a link from before the arc still lands: ' + old + ' → ' + st + '/' + v, { st: r.st, view: r.view });
    }
    /* the board ends above the bar on a wide screen (two views are taller on purpose) */
    for (const [st, v] of [[0, 'pic'], [0, 'hold'], [1, 'tri'], [3, 'all'], [3, 'why'], [4, 'wt']]) { await p.evaluate(([st, v]) => { ISX.profit.go(st, v); scrollTo(0, 0); }, [st, v]); await p.waitForTimeout(200); r = await p.evaluate(() => Math.round(document.getElementById('isx-tabs').getBoundingClientRect().top - document.getElementById('isx-pf-board').getBoundingClientRect().bottom)); ok(r >= 0 && r < 60, 'at 1440 × 900 the board of ' + v + ' ends above the bar', r); }
    await done(p);
  }

  if (want(4)) {
    const p = await open('#profit/profits/flow');
    let r = await p.evaluate(async () => { const d = await ISX.load('profit'), E = d.E, f = document.getElementById('isx-pf-fig'); return { y: E.y.length, keys: Object.keys(E.v).length, oe25: E.v.oe[25], ot25: E.v.ot[25], pe25: E.v.pe[25], p26: E.p26.oe, tiles: [...document.querySelectorAll('#isx-pf-tiles .pf-tile .v')].map(x => x.textContent), unit: document.getElementById('isx-pf-unit').textContent, read: document.getElementById('isx-pf-reading').textContent, cols: f.querySelectorAll('svg g.col').length, lg: [...document.querySelectorAll('#isx-pf-lg span')].map(x => x.textContent), txt: f.querySelector('svg').textContent }; });
    ok(r.y === 26 && r.keys === 10 && r.oe25 === 56 && r.ot25 === -28.3 && r.pe25 === 685.6 && r.p26 === 89, 'the data file holds E1: 26 years, 10 series, the checked values', r);
    ok(/TIC/.test(r.unit) && r.cols === 52 && r.lg.join('|') === 'Treasury bonds & notes|Agency bonds|Corporate bonds|Shares' && /Official holders/.test(r.txt) && /Private holders/.test(r.txt), 'Bought each year: two panels, 26 columns each, four instruments, from the Treasury’s TIC', { unit: r.unit, cols: r.cols, lg: r.lg });
    ok(r.tiles[0] === '−$28bn' && r.tiles[1] === '$56bn' && r.tiles[2] === '$686bn' && /10 of the 11 years/.test(r.read) && /\$89bn of shares in January to August 2026/.test(r.read) && !/2026/.test(r.txt), 'the tiles and the reading line give the checked figures; 2026 (eight months) is named, not drawn as a year', { tiles: r.tiles, read: r.read });
    await p.click('#isx-pf-table'); r = await p.evaluate(() => ({ head: [...document.querySelectorAll('#isx-pf-fig thead th')].map(x => x.textContent), first: [...document.querySelectorAll('#isx-pf-fig tbody tr')][0].textContent, cap: document.querySelector('#isx-pf-fig caption').textContent, rows: document.querySelectorAll('#isx-pf-fig tbody tr').length }));
    ok(r.rows === 27 && r.head.length === 11 && /bills \(change in holdings\)/.test(r.head[9]) && /eight months/.test(r.first) && /never added/.test(r.cap) && /not reconciled/.test(r.cap), 'the table has every year, the eight months of 2026 and the bills under their own name', r);
    /* One year */
    await p.evaluate(() => ISX.profit.go(3, 'sum')); await p.waitForTimeout(250);
    r = await p.evaluate(() => { const f = document.getElementById('isx-pf-fig'), a = f.querySelector('svg.oy-b').getBoundingClientRect(), l = f.querySelector('svg.oy-l').getBoundingClientRect(); return { bridge: Math.round(a.height), lines: Math.round(l.height), w: Math.round(l.width / f.getBoundingClientRect().width * 100), order: a.top < l.top, terms: [...f.querySelectorAll('.pf-terms button')].map(x => x.dataset.pt + ':' + x.getAttribute('aria-pressed')), paths: f.querySelectorAll('svg.oy-l polyline').length, read: document.getElementById('isx-pf-reading').textContent }; });
    ok(r.order && r.lines >= 300 && r.lines > r.bridge * 1.6 && r.w === 100, 'One year: the bridge on top, the lines below as the main chart, full width and at least 300 px high', r);
    ok(r.terms.join(',') === 'npi:true,fed:true,div:true,rest:false,hh:true,ca:true' && r.paths === 7, 'every term is a switch; profits stay on top', r);
    await p.click('.pf-terms [data-pt="rest"]'); await p.click('.pf-terms [data-pt="div"]'); r = await p.evaluate(() => ({ paths: document.querySelectorAll('#isx-pf-fig svg.oy-l polyline').length, t: ISX.profit.state.terms })); ok(r.paths === 7 && r.t.rest && !r.t.div, 'switching a term adds or removes its line', r);
    const box = await p.evaluate(() => { const b = document.querySelector('#isx-pf-fig svg.oy-l').getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; });
    await p.mouse.move(box[0] + box[2] * .3, box[1] + box[3] * .5); await p.waitForTimeout(200);
    r = await p.evaluate(() => ({ y: ISX.profit.state.year, read: document.getElementById('isx-pf-reading').textContent, sl: document.querySelector('#isx-pf-scrub input').value })); ok(r.y > 1970 && r.y < 1990 && r.read.indexOf(String(r.y)) === 0 && +r.sl === r.y, 'moving over the lines moves the year: the bridge, the reading line and the slider follow', r);
    await done(p);
  }

  if (want(5)) {
    const p = await open('#profit/finale');
    let r = await p.evaluate(() => { const f = document.getElementById('isx-pf-fin'), c = f.querySelector('.pf-crisis'); return { q: document.getElementById('isx-pf-q').textContent, board: document.getElementById('isx-pf-board').hidden, text: document.getElementById('isx-pf-text').hidden, lines: f.querySelectorAll('.pf-fl p').length, crisis: c && c.textContent, tag: c && c.tagName, role: c && c.getAttribute('role'), btn: !!f.querySelector('.pf-crisis button, button.pf-crisis'), doors: [...f.querySelectorAll('.pf-door.go')].map(d => d.dataset.pgo + '|' + d.querySelector('b').textContent), ess: (f.querySelector('.pf-ess') || {}).href, bar: document.querySelector('#isx-tabs').textContent }; });
    ok(r.q === 'What if AI doesn’t deliver?' && r.board && r.text && r.lines === 4, 'the finale is one screen: its title, four lines, no chart', r);
    ok(/Crisis simulator/.test(r.crisis) && /coming soon/.test(r.crisis) && r.tag === 'DIV' && r.role === 'group' && !r.btn, 'the crisis simulator is locked: named “coming soon”, not a control', r);
    ok(r.doors.join(',') === 'simulator|The imperial machinery,elite-network|The elite network,imperial-arm|The imperial arm' && /when-the-bubble-pops/.test(r.ess || ''), 'the doors lead to the imperial machinery, the elite network and the imperial arm; the essay is linked', r);
    await p.click('#isx-pf-fin .pf-door[data-pgo="imperial-arm"]'); await p.waitForTimeout(400); ok(await p.evaluate(() => ISX.view === 'story'), 'a door opens its tab');
    await p.evaluate(() => { location.hash = '#profit/finale'; }); await p.waitForTimeout(400);
    await p.evaluate(() => { const n = ISX.route.next('profit'); if (n) n.click(); }); await p.waitForTimeout(400); ok(await p.evaluate(() => ISX.view === 'fin'), 'Next after the finale goes on to the imperial machinery');
    await done(p);
  }

  if (want(6)) {
    const p = await open('#profit/regime/sum', { w: 390, h: 844, phone: 1 });
    let r = await p.evaluate(() => ({ zb: !!document.querySelector('.pf-zoomb'), ov: document.documentElement.scrollWidth <= innerWidth + 1, at: getComputedStyle(document.querySelector('.pf-arr .at')).display }));
    ok(r.zb && r.ov && r.at === 'none', 'phone, One year: the full-screen button is there, the page does not scroll sideways, the arrows carry no words', r);
    await p.click('.pf-zoomb'); await p.waitForTimeout(300);
    r = await p.evaluate(() => { const z = document.getElementById('isx-pf-zoom'), sc = z.querySelector('.pz-sc'); return { on: ISX.profit.state.zoom, cover: z.getBoundingClientRect().height >= innerHeight - 1, wide: sc.scrollWidth > innerWidth * 2, end: sc.scrollLeft > 0, inert: document.querySelector('#isx-root > .wrap').inert, focus: z.contains(document.activeElement), y: z.querySelector('.pz-y').textContent }; });
    ok(r.on && r.cover && r.wide && r.end && r.inert && r.focus && /2025/.test(r.y), 'the lines open full screen: wider than the phone, scrolled to the latest year, the page behind out of reach', r);
    const w0 = await p.evaluate(() => document.querySelector('#isx-pf-zoom .pz-sc').scrollWidth); await p.click('#isx-pf-zoom [data-pz="in"]'); const w1 = await p.evaluate(() => document.querySelector('#isx-pf-zoom .pz-sc').scrollWidth); await p.click('#isx-pf-zoom [data-pz="out"]'); await p.click('#isx-pf-zoom [data-pz="out"]'); const w2 = await p.evaluate(() => document.querySelector('#isx-pf-zoom .pz-sc').scrollWidth);
    ok(w1 > w0 * 1.3 && w2 < w0, 'plus and minus zoom the chart', [w0, w1, w2]);
    await p.evaluate(() => { const sc = document.querySelector('#isx-pf-zoom .pz-sc'); sc.scrollLeft = 0; }); await p.tap('#isx-pf-zoom svg', { position: { x: 120, y: 200 } }); await p.waitForTimeout(200);
    r = await p.evaluate(() => ({ y: ISX.profit.state.year, t: document.querySelector('#isx-pf-zoom .pz-y').textContent })); ok(r.y < 1985 && r.t.indexOf(String(r.y)) === 0, 'a tap on a year selects it', r);
    await p.click('#isx-pf-zoom [data-pz="x"]'); await p.waitForTimeout(200); r = await p.evaluate(() => ({ z: !!document.getElementById('isx-pf-zoom'), inert: document.querySelector('#isx-root > .wrap').inert, read: document.getElementById('isx-pf-reading').textContent, y: ISX.profit.state.year })); ok(!r.z && !r.inert && r.read.indexOf(String(r.y)) === 0, 'Close returns to the page, on the year that was chosen', r);
    /* swipe the views; every station fits the phone */
    await p.evaluate(() => { ISX.profit.go(0, 'pic'); });
    await p.evaluate(() => { const f = document.getElementById('isx-pf-fig'), b = f.getBoundingClientRect(), mk = (x) => new Touch({ identifier: 1, target: f, clientX: x, clientY: b.top + 80 }); f.dispatchEvent(new TouchEvent('touchstart', { touches: [mk(300)], changedTouches: [mk(300)], bubbles: true })); f.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [mk(120)], bubbles: true })); }); await p.waitForTimeout(200);
    r = await p.evaluate(() => ISX.profit.state); ok(r.st === 'profits' && r.view === 'hold', 'a swipe on the chart moves to the next view, not to the next station', { st: r.st, view: r.view });
    const ST = await p.evaluate(() => ISX.profit.stations);
    for (let i = 0; i < ST.length; i++) for (const v of (ST[i].views.length ? ST[i].views : [null])) { await p.evaluate(([i, v]) => ISX.profit.go(i, v), [i, v]); await p.waitForTimeout(120); r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth })); ok(r.sw <= r.iw + 1, 'phone: ' + ST[i].id + '/' + (v || 'the finale') + ' does not scroll sideways', r); }
    await done(p);
    const q = await open('#profit', { w: 390, h: 844, phone: 1, first: 1 }); await q.waitForTimeout(600);
    r = await q.evaluate(() => { const e = document.getElementById('isx-enter'); return e ? { sw: e.querySelector('.en-in').scrollWidth <= innerWidth + 1, btn: Math.round(e.querySelector('.en-btn').getBoundingClientRect().height), skip: !!e.querySelector('.en-skip') } : null; });
    ok(r && r.sw && r.btn >= 44 && r.skip, 'phone: the entry screen fits, its buttons are at least 44 px high, and it has a Skip', r);
    await q.tap('#isx-enter .en-skip'); await q.waitForTimeout(900); ok(!(await q.evaluate(() => ISX.enter.on)), 'phone: Skip leaves the screen'); await done(q);
  }

  if (want(7)) {
    const p = await open('#profit/order');
    await p.waitForFunction(() => ISX.profit.state.orbit > 0, null, { timeout: 20000 }); await p.waitForTimeout(300);
    const q = () => p.evaluate(() => { const f = document.getElementById('isx-pf-fig'), sv = f.querySelector('svg.pf-orbs'), bodies = [...f.querySelectorAll('[data-ob]')], pos = g => { const r = g.querySelector('.c').getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)]; }, by = n => bodies.find(g => { const l = g.getAttribute('aria-label'); return l === n || l.endsWith(', ' + n); }), fr = f.getBoundingClientRect();
      return { st: ISX.profit.state, q: document.getElementById('isx-pf-q').textContent, sub: document.getElementById('isx-pf-sub').textContent, title: document.getElementById('isx-pf-title').textContent, n: bodies.length, shown: bodies.filter(g => !g.classList.contains('off')).length, cls: sv.getAttribute('class'), alt: (f.querySelector('.pf-orb').getAttribute('aria-label') || '').length, cards: [...f.querySelectorAll('.pf-orbc b')].map(x => x.textContent), us: pos(by('United States')), cn: pos(by('China')), jp: pos(by('Japan')), kz: pos(by('Kazakhstan')), drc: pos(by('DR Congo')), tw: by('Taiwan').getAttribute('class'), kzc: by('Kazakhstan').getAttribute('class'), sa: by('Saudi Arabia').getAttribute('class'), zw: by('Zimbabwe').getAttribute('class'), mid: fr.left + fr.width / 2, w: fr.width, inside: bodies.filter(g => !g.classList.contains('off')).every(g => { const r = g.querySelector('.c').getBoundingClientRect(); return r.left >= fr.left - 2 && r.right <= fr.right + 2 && r.top >= fr.top - 2 && r.bottom <= fr.bottom + 2; }), press: [...document.querySelectorAll('[data-po]')].map(x => x.dataset.po + ':' + x.getAttribute('aria-pressed')).join() }; });
    let w = await q(); const data = await p.evaluate(async () => { const d = await ISX.load('orbit'); return { rows: d.meta.rows, n: d.B.length, pax: d.B.filter(b => b.mem.p).length + 0, both: d.B.filter(b => b.sys === 'both').map(b => b.n).sort().join(), cnz: d.B.filter(b => b.sys === 'cn' && b.zone).map(b => b.n).sort().join(), gulf: d.B.filter(b => ['UAE', 'Qatar', 'Saudi Arabia'].includes(b.n)).map(b => b.n + ':' + [b.sec].concat(b.more).join('+')).join() }; });
    ok(data.rows === 103 && data.n === 72 && w.n === 72, 'the view is drawn from the country file: 103 rows, 72 bodies, every one on the picture', { data, n: w.n });
    ok(w.st.view === 'orb' && w.st.ord === 'wto' && w.q === 'To secure the profits, first a global empire: one ladder for the whole world.' && /The WTO order, 1995/.test(w.sub) && /wto/.test(w.cls) && w.press === 'wto:true,ps:false', 'the station opens on the orbits, in the WTO order, under the arc’s first title', { q: w.q, sub: w.sub, press: w.press });
    ok(Math.abs(w.us[0] - w.mid) < 12 && Math.hypot(w.jp[0] - w.us[0], w.jp[1] - w.us[1]) < Math.hypot(w.kz[0] - w.us[0], w.kz[1] - w.us[1]) && w.inside && w.alt > 300 && w.cards.join('|') === 'Who is let in|How rents are protected|The old core|The promise', 'WTO order: one system, the US at its centre, the old core nearest, every body inside the picture, four cards on top', { us: w.us, jp: w.jp, kz: w.kz, cards: w.cards, inside: w.inside });
    await p.click('[data-po="ps"]'); await p.waitForTimeout(1400); let s2 = await q();
    ok(s2.st.ord === 'ps' && s2.q === 'Then China climbed the ladder. Now: Pax Silica and the silicon curtain.' && /2025/.test(s2.sub) && s2.title === 'Two systems and the overlap between them' && s2.cards[3] === 'The other bloc' && /#profit\/order\/pax$/.test(await p.evaluate(() => location.hash)), 'the toggle changes the state: the arc’s second title, the cards, the link', { q: s2.q, cards: s2.cards });
    ok(s2.us[0] < s2.kz[0] && s2.kz[0] < s2.cn[0] && s2.us[0] < s2.drc[0] && s2.drc[0] < s2.cn[0] && s2.cn[0] - s2.us[0] > s2.w * .4 && s2.inside && (s2.us[0] !== w.us[0] || s2.jp[0] !== w.jp[0]), 'Pax Silica: two systems; the bodies moved; Kazakhstan and the DR Congo sit in the overlap between the centres; nothing leaves the picture', { us: s2.us, cn: s2.cn, kz: s2.kz, drc: s2.drc, inside: s2.inside });
    ok(/\btw\b/.test(s2.tw) && /s-us/.test(s2.tw) && /s-both/.test(s2.kzc) && /s-swing/.test(s2.sa) && /hatch/.test(s2.sa) && /s-cn/.test(s2.zw) && /zone/.test(s2.zw), 'placements of the addendum: Taiwan inside as a participant (dashed), Kazakhstan in the overlap, Saudi Arabia contested (hatched), Zimbabwe an extraction zone in China’s system', { tw: s2.tw, kz: s2.kzc, sa: s2.sa, zw: s2.zw });
    ok(data.both === 'Brazil,DR Congo,Guinea,Indonesia,Kazakhstan,Malaysia,Mozambique,Peru,Serbia,South Africa,Zambia' && /Myanmar/.test(data.cnz) && /Zimbabwe/.test(data.cnz) && /UAE:2\+finance/.test(data.gulf) && /Qatar:2\+finance/.test(data.gulf), 'the overlap holds the bodies on both lists and the zones with both capitals; the Gulf states are one body each, with a second role', data);
    await p.evaluate(() => { const g = [...document.querySelectorAll('[data-ob]')].find(x => x.getAttribute('aria-label') === 'DR Congo'); g.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await p.waitForTimeout(200);
    let r = await p.evaluate(() => document.querySelector('.pf-orbi').textContent); ok(/DR Congo/i.test(r) && /overlap/i.test(r) && /cobalt 74\.2%/i.test(r) && /USGS/.test(r) && /CMOC/.test(r) && /Glencore/.test(r) && /flagged until a filing is read/.test(r), 'a body’s card: its place, its role, one dated figure; the DR Congo names both owners, flagged', r.slice(0, 300));
    r = await p.evaluate(() => { const g = [...document.querySelectorAll('[data-ob]')], l = x => x.getAttribute('aria-label'); return { bad: g.filter(x => l(x).toLowerCase().indexOf(x.querySelector('text').textContent.toLowerCase()) < 0).map(l), uk: l(g.find(x => x.querySelector('text').textContent === 'UK')), grp: l(g.find(x => x.querySelector('text').textContent === 'AI statement only')), info: document.querySelector('.pf-orbi').tabIndex }; });
    ok(!r.bad.length && r.uk === 'UK, United Kingdom' && r.grp === 'AI statement only (6)' && r.info === 0, 'every body’s spoken name holds the name drawn beside it; a group is named as the group; the card can take the keyboard', JSON.stringify(r).slice(0, 300));
    await p.click('[data-pl="brics"]'); await p.waitForTimeout(200); r = await p.evaluate(() => ({ lit: [...document.querySelectorAll('[data-ob]:not(.dim):not(.off)')].length, read: document.getElementById('isx-pf-reading').textContent, on: document.querySelector('[data-pl="brics"]').getAttribute('aria-pressed') }));
    ok(r.on === 'true' && r.lit > 12 && r.lit < 30 && /10 members and 10 partners/.test(r.read) && /contested/.test(r.read), 'a layer lights its members and says its count (BRICS)', r); await p.click('[data-pl="brics"]');
    await p.click('[data-pf="flows"]'); await p.waitForTimeout(500); r = await p.evaluate(() => { const sv = document.querySelector('svg.pf-orbs'), g = sv.querySelector('.os.ps'); return { on: sv.classList.contains('flows'), n: g.querySelectorAll('.fl').length, cols: [...g.querySelectorAll('.fl')].map(l => getComputedStyle(l).stroke), txt: [...document.querySelectorAll('#isx-pf-lg .ofl')].map(t => t.textContent).join(' | ') }; });
    ok(r.on && r.n === 4 && r.cols.includes('rgb(255, 93, 143)') && r.cols.includes('rgb(255, 181, 71)') && r.cols.includes('rgb(68, 215, 236)') && r.cols.includes('rgb(183, 243, 107)') && /Rents flow to the centre/.test(r.txt) && /surplus returns as purchases of US shares and bonds/.test(r.txt), '“Show the flows”: rents, the recycled surplus, hardware and ores, in the Circuit’s colours and words', r);
    await p.click('#isx-pf-table'); r = await p.evaluate(() => ({ rows: document.querySelectorAll('#isx-pf-fig tbody tr').length, cap: document.querySelector('#isx-pf-fig caption').textContent })); ok(r.rows === 72 && /O1-countries/.test(r.cap) && /draft placements/.test(r.cap), 'the table lists the 72 bodies and says the placements are a draft', r); await p.click('#isx-pf-table');
    await done(p);
    const ph = await open('#profit/order/pax', { w: 390, h: 844, phone: 1 }); await ph.waitForFunction(() => ISX.profit.state.orbit > 0); await ph.waitForTimeout(400);
    r = await ph.evaluate(() => ({ sys: !document.querySelector('.pf-orbsys').hidden, cn: document.querySelector('[data-ob].s-core.wa').classList.contains('off'), ov: [...document.querySelectorAll('[data-ob].s-both:not(.off)')].length, sw: document.documentElement.scrollWidth <= innerWidth + 1, z: document.querySelectorAll('.pf-orbz button').length }));
    ok(r.sys && r.cn && r.ov === 11 && r.sw && r.z === 2, 'phone: one system at a time with a switch; the overlap listed under it; zoom buttons; no sideways scroll', r);
    await ph.click('[data-ps="cn"]'); await ph.waitForTimeout(300); r = await ph.evaluate(() => ({ cn: !document.querySelector('[data-ob].s-core.wa').classList.contains('off'), us: document.querySelector('[data-ob].s-core:not(.wa)').classList.contains('off'), ov: [...document.querySelectorAll('[data-ob].s-both:not(.off)')].length })); ok(r.cn && r.us && r.ov === 11, 'phone: the switch shows China’s system; the overlap stays', r);
    await ph.click('.pf-orbz [data-pzk="+"]'); await ph.waitForTimeout(300); r = await ph.evaluate(() => { const sc = document.querySelector('.pf-orbsc'); return sc.scrollWidth > sc.clientWidth * 1.3; }); ok(r, 'phone: the zoom button enlarges the picture inside its frame');
    await ph.evaluate(() => { const g = [...document.querySelectorAll('[data-ob]')].find(x => x.getAttribute('aria-label') === 'Kazakhstan'); g.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await ph.waitForTimeout(200);
    ok(/Kazakhstan/i.test(await ph.evaluate(() => document.querySelector('.pf-orbi').textContent)), 'phone: a tap on a body opens its card');
    await done(ph);
  }
  await b.close();
  console.log(fail ? fail + ' of ' + n + ' checks FAILED' : 'all ' + n + ' arc checks pass');
  process.exit(fail ? 1 : 0);
})();
