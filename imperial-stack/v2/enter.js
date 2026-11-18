/* The Imperial Stack v2 · enter.js (profit tab patch, 18 Nov 2026; spec claude/specs/profit-tab-v4-17-nov.md §1 rows 1, 2 and 4, §3,
   and its addendum §1: “entry and exit screens are cinematic”)
   One entry screen for every tab but the Circuit, which keeps its own (“About this map”). The preview's template, restyled to the
   site: the whole window, a small centred masthead, the tab's title in the title face, the gold rule, three blocks with a clean line
   between them (“Where you are”, “What you are about to see”, “How to use it”), three buttons, nothing else. A second row of choices
   appears only after the button that needs it (the machinery's three levels after “Learn step by step”, the profit dollar's stations
   after “Jump to a station”); the machinery's tour is offered only after “Explore on my own”.
   It is shown once per browser, the first time a tab is entered at its door (the header, a door, Next, a plain link), never on a link
   to a place inside the tab. Esc or a click outside skips it; the ⓘ in the header (“About this map”) opens it again; “#replay” in the
   address shows all of them again.
   Motion: slow, one line at a time (veil, masthead, title, rule, the three blocks, the buttons); the first key or click shows the rest
   at once. Leaving, the text drifts toward the visitor and the veil lifts. Only opacity and transform move. Under reduced motion: a
   plain fade. Nothing here filters the tab behind (the globe's canvas must never sit under a CSS filter); the veil blurs its backdrop.
   Storage: isx-enter-<view> ('1' once seen). The check scripts' switches isx-tips-sim = 'off' and isx-enter = 'off' keep it away.
   Seam: ISX.enter { open(view, force), close(), on, tabs, copy() }. Bus event: enter { tab, act }. */
(function () {
  'use strict';
  var X = window.ISX; if (!X) return;
  var U = X.util, root = X.root, $ = X.$, esc = U.esc, KEY = 'isx-enter-', SUB = 'https://eliasrutten.substack.com';
  var off = function () { return U.stGet('isx-tips-sim') === 'off' || U.stGet('isx-enter') === 'off'; };
  var SSL = '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" class="ssl"><path fill="currentColor" d="M3 3h18v2.6H3zm0 4.9h18v2.6H3zm0 4.9h18V21l-9-5-9 5z"/></svg>';

  /* ---------- the copy: one entry a tab (drafts for Elias; the machinery's is the preview's, approved 17 Nov) ---------- */
  var T = {
    profit: { n: '02', hue: '#d78bff', k: 'The profit dollar', h: 'Why dollar assets need to be the most profitable', star: true, site: '#profit', mins: 20,
      b: [['Where you are', 'The world economy needs one asset deep and liquid enough to settle its trade and hold its savings. Only a very large economy can supply it, and to keep the world buying, its assets have to pay. The Circuit showed the money moving; this tab shows what it buys.'],
        ['What you are about to see', 'Six stations. Each has a title that carries the argument and one chart to check it: the profits, the technology that secures them, the order built around them, the deficits that realise them, the AI trade they now rest on, and what happens if it fails.'],
        ['How to read it', 'Charts first, text below. The dots under a chart lead to more views of the same point; every number has its table, its date and its source.']],
      acts: [['go', 'Start at the first station'], ['stops', 'Jump to a station'], ['remind', 'Remind me later']] },
    arm: { n: '03', hue: '#44d7ec', k: 'The elite network', h: 'Where Washington’s reach is organised: officials, firms and owners', site: '#elite-network', mins: 20,
      b: [['Where you are', 'The Circuit showed the loop and the machinery how its prices are steered. The elite network shows the reach: which agencies and laws press on which countries and firms, and where US firms earn abroad.'],
        ['What you are about to see', 'A map of pressure points. Each agency is a lever; each line is a law, a licence or a sanction landing somewhere. Open one to see what it does and when it was last used.'],
        ['How to use it', 'Start with one agency and follow its lines, or take the short tour first.']],
      acts: [['tour', 'Take the tour'], ['go', 'Explore on my own'], ['remind', 'Remind me later']] },
    fin: { n: '04', hue: '#ffd27a', k: 'The imperial machinery', h: 'How Washington keeps the circuit turning', site: '#simulator', mins: 45,
      b: [['Where you are', 'You came in through the Circuit, which showed the loop: the world’s savings flowing into US assets while the US buys more than it sells. Economics has come far in recognising these imbalances and the hot money around them as distorting and destabilising. What it misses is that the instability is manufactured, and used as a weapon for geoeconomic ends.'],
        ['What you are about to see', 'A schematic of the imperial machinery that manages this system and makes its cogs turn: the desks in Washington, the levers they pull and the prices those levers move. The real state apparatus is more complex than this schematic, so we made a guide that takes you through it step by step.'],
        ['How to use it', 'We want this to be a learning tool for anyone interested, so the guide has three levels of difficulty. You can also play with the machinery on your own instead of learning by steps. Understanding the mechanics takes time: if you want to come back to it, set a reminder. For more depth, {{sub|paid pieces on the Substack}} take one part of the machinery at a time.']],
      acts: [['levels', 'Learn step by step'], ['free', 'Explore on my own'], ['remind', 'Remind me later']] },
    story: { n: '05', hue: '#e4ebf1', k: 'The imperial arm', h: 'Scenarios: how the arm is used', site: '#imperial-arm', mins: 20,
      b: [['Where you are', 'The machinery showed how prices are steered; the elite network who steers them. This is the arm in use: the moments Washington reached into another country’s economy, and what it took.'],
        ['What you are about to see', 'Cases, each told as a chain from decision to consequence, with the levers they used.'],
        ['How to use it', 'Pick a case, or follow one lever across all of them.']],
      acts: [['go', 'Pick a case'], ['lever', 'Follow one lever'], ['remind', 'Remind me later']] }
  };
  var txt = function (t) { return esc(t).replace(/\{\{sub\|([^}]+)\}\}/g, function (m, x) { return '<a class="en-sub" href="' + SUB + '" target="_blank" rel="noopener">' + SSL + x + '</a>'; }); };

  var el = null, live = null, wrap = root.querySelector(':scope > .wrap') || root.firstElementChild, back = null, offer = null, offerT = 0, outT = 0;
  var at = function () { return live; };

  /* ---------- the second row: what a button opens ---------- */
  function levels() {
    var ws = [].slice.call(root.querySelectorAll('#isx-gentry .ge-way'));
    return ws.map(function (w) {
      var b = w.querySelector('.ge-wt b'), a = w.querySelector('.ge-wa'), m = /About (\d+) minutes/.exec(w.textContent || '');
      return '<button type="button" class="en-ch" data-en-way="' + esc(w.dataset.way) + '"><b>' + esc(b ? b.textContent : w.dataset.way) + '</b><span>' + esc(a ? a.textContent : '') + '</span><small>' + (m ? 'About ' + m[1] + ' minutes' : 'At your own pace') + '</small></button>';
    }).join('');
  }
  function stops() {
    var S = X.profit && X.profit.stations ? X.profit.stations : [];
    return S.map(function (s, i) { return '<button type="button" class="en-ch" data-en-stop="' + i + '"><b>' + ('0' + (i + 1)) + ' · ' + esc(s.t) + '</b><span>' + esc(s.q) + '</span></button>'; }).join('');
  }

  /* ---------- the screen ---------- */
  function html(v) {
    var c = T[v], i = 0, r = function () { return ' class="en-r" style="--i:' + (i++) + '"'; };
    var star = c.star ? '<button type="button" class="en-star" data-en="note" aria-expanded="false" aria-controls="isx-en-note" aria-label="Footnote: why only a very large economy can play this role">*</button>' : '';
    var h = '<div class="en-veil" aria-hidden="true"></div><div class="en-in"><div class="en-col" style="--eh:' + c.hue + '">'
      + '<p' + r().replace('en-r', 'en-r en-k') + '><i class="dia" aria-hidden="true"></i><span>' + c.n + ' <em>of 05</em></span><span class="sep" aria-hidden="true">·</span><span>' + esc(c.k) + '</span></p>'
      + '<h2' + r().replace('en-r', 'en-r en-h') + ' id="isx-en-h">' + esc(c.h) + star + '</h2>'
      + '<i' + r().replace('en-r', 'en-r en-rule') + ' aria-hidden="true"></i>'
      + (c.star ? '<div class="en-note" id="isx-en-note" hidden></div>' : '')
      + '<div class="en-b">' + c.b.map(function (b) { return '<section' + r() + '><h3>' + esc(b[0]) + '</h3><p>' + txt(b[1]) + '</p></section>'; }).join('') + '</div>'
      + '<div' + r().replace('en-r', 'en-r en-acts') + '>' + c.acts.map(function (a, j) { return '<button type="button" class="en-btn' + (j ? '' : ' pri') + '" data-en="' + a[0] + '"' + (a[0] === 'remind' ? ' data-remind="enter"' : '') + (a[0] === 'levels' || a[0] === 'stops' ? ' aria-expanded="false" aria-controls="isx-en-more"' : '') + '>' + esc(a[1]) + (j ? '' : ' <span aria-hidden="true">→</span>') + '</button>'; }).join('') + '</div>'
      + '<div class="en-more" id="isx-en-more" hidden></div>'
      + '<p' + r().replace('en-r', 'en-r en-fine') + '><button type="button" class="en-skip" data-en="skip">Skip</button><span>Esc works too. The <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/></svg> at the top left opens this again.</span></p>'
      + '</div></div>';
    return h;
  }
  function hold(on) {
    if (wrap) wrap.inert = !!on;
    document.documentElement.classList.toggle('isx-enlock', !!on);
    root.classList.toggle('en-on', !!on);
  }
  function open(v, force) {
    if (!T[v] || live === v) return false;
    if (!force && (off() || U.stGet(KEY + v) === '1')) return false;
    if (live) drop();
    clearTimeout(outT); if (offer) dropOffer();
    back = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
    el = document.createElement('div'); el.className = 'en' + (X.reduce ? ' en-all' : ''); el.id = 'isx-enter'; el.dataset.tab = v;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'isx-en-h'); el.tabIndex = -1;
    el.innerHTML = html(v); root.appendChild(el); live = v; hold(true);
    U.stSet(KEY + v, '1');
    el.addEventListener('click', onClick); el.addEventListener('keydown', onKey);
    /* the first press shows the rest at once; a press outside the column leaves */
    el.addEventListener('pointerdown', function () { if (el) el.classList.add('en-all'); }, true);
    el.focus({ preventScroll: true });
    X.emit('enter', { tab: v, act: 'open' });
    return true;
  }
  function drop() { if (!el) return; var e = el; el = null; live = null; if (e.parentNode) e.parentNode.removeChild(e); hold(false); }
  /* the screen falls away: the text drifts toward the visitor, the veil lifts, the tab is there */
  function close(act, then) {
    if (!el) return; var e = el, v = live; el = null; live = null;
    if (X.remind && X.remind.on) X.remind.close();
    e.classList.add('en-out'); e.inert = true; hold(false);
    outT = setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, X.reduce ? 200 : 760);
    if (then) { try { then(); } catch (err) { /* the tab is still there */ } }
    var f = back && back.isConnected && back.getClientRects().length ? back : $('v-' + v); back = null;
    if (!then && f) { try { f.focus({ preventScroll: true }); } catch (err) { /* ignore */ } }
    X.emit('enter', { tab: v, act: act || 'skip' });
  }
  function more(kind, btn) {
    var m = el.querySelector('#isx-en-more'), was = !m.hidden && m.dataset.kind === kind;
    [].forEach.call(el.querySelectorAll('.en-btn[aria-expanded]'), function (b) { b.setAttribute('aria-expanded', 'false'); });
    if (was) { m.hidden = true; return; }
    var inner = kind === 'levels' ? levels() : stops();
    if (!inner) return false;
    m.dataset.kind = kind; m.innerHTML = '<div class="en-chs" role="group" aria-label="' + (kind === 'levels' ? 'Choose your level' : 'The six stations') + '">' + inner + '</div>'; m.hidden = false; btn.setAttribute('aria-expanded', 'true');
    var f = m.querySelector('button'); if (f) f.focus({ preventScroll: true });
    m.scrollIntoView({ block: 'nearest' });
    return true;
  }
  function note(btn) {
    var n = el.querySelector('#isx-en-note'); if (!n) return;
    if (!n.innerHTML) n.innerHTML = X.profit && X.profit.footnote ? X.profit.footnote() : '';
    n.hidden = !n.hidden; btn.setAttribute('aria-expanded', String(!n.hidden));
  }
  function way(k) { var b = root.querySelector('#isx-gentry .ge-way[data-way="' + k + '"]'); if (b) b.click(); }
  function onClick(e) {
    if (!el) return;
    var t = e.target, b = t.closest('[data-en], [data-en-way], [data-en-stop]');
    if (!b) { if (!t.closest('.en-col') && !t.closest('#isx-remind')) close('skip'); return; }
    var v = live, d = b.dataset;
    if (d.enWay) { close('level', function () { way(d.enWay); }); return; }
    if (d.enStop != null) { close('stop', function () { if (X.profit) X.profit.go(+d.enStop); }); return; }
    if (d.en === 'skip') { close('skip'); return; }
    if (d.en === 'note') { note(b); return; }
    if (d.en === 'remind') return;                       /* v2/remind.js opens its panel on [data-remind] and asks remindCtx what to say */
    if (d.en === 'levels') { if (more('levels', b) === false) close('go'); return; }   /* the guide is already under way: nothing to choose */
    if (d.en === 'stops') { if (more('stops', b) === false) close('go'); return; }
    if (d.en === 'free') { close('free', function () { way('map'); tourOffer(); }); return; }
    if (d.en === 'tour') { close('tour', function () { if (X.hints && X.hints.replay) X.hints.replay(v); }); return; }
    if (d.en === 'lever') { close('lever', function () { var l = root.querySelector('#isx-scene-story [data-b3="ledger"]'); if (l) l.click(); }); return; }
    close('go', v === 'profit' ? function () { if (X.profit) X.profit.go(0); } : null);
  }
  function onKey(e) {
    if (!el) return;
    if (e.key === 'Escape') { if (X.remind && X.remind.on) return; e.preventDefault(); e.stopPropagation(); close('skip'); return; }
    if (e.key !== 'Tab' && e.key !== 'Shift') el.classList.add('en-all');
    if (e.key === 'Tab') {   /* focus stays in the screen */
      var fs = [].slice.call(el.querySelectorAll('button, a[href], input')).filter(function (x) { return x.getClientRects().length; }); if (!fs.length) return;
      var a = fs[0], z = fs[fs.length - 1];
      if (e.shiftKey && (document.activeElement === a || document.activeElement === el)) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  }
  /* the machinery, after “Explore on my own”: a quiet offer in the corner, gone by itself */
  function dropOffer() { clearTimeout(offerT); if (offer && offer.parentNode) offer.parentNode.removeChild(offer); offer = null; }
  function tourOffer() {
    if (!X.simtour) return; dropOffer();
    offer = document.createElement('div'); offer.className = 'en-offer'; offer.setAttribute('role', 'status');
    offer.innerHTML = '<span>New here?</span><button type="button" data-eo="tour">A 40-second tour of the screen</button><button type="button" class="x" data-eo="x" aria-label="No, thanks">×</button>';
    offer.addEventListener('click', function (e) { var b = e.target.closest('[data-eo]'); if (!b) return; var t = b.dataset.eo === 'tour'; dropOffer(); if (t) X.simtour.open(true); });
    root.appendChild(offer); offerT = setTimeout(dropOffer, 14000);
  }

  /* ---------- when: the first time a tab is entered at its door ---------- */
  function atDoor(v) {
    if (v === 'fin') return X.finMode === 'plumb' && !!root.querySelector('#isx-gentry');   /* the machinery still stands on its own entry: nothing was started */
    if (v === 'arm' && X.armMode === 'rev') return false;
    var d = ''; try { d = X.hashDetail ? X.hashDetail() || '' : ''; } catch (e) { /* ignore */ }
    return !d;
  }
  var pend = 0;
  function consider() {
    clearTimeout(pend);
    pend = setTimeout(function () {
      var v = X.view;
      if (live && live !== v) drop();
      if (!T[v] || live || off() || U.stGet(KEY + v) === '1') return;
      if (root.classList.contains('op-on') || X.intro) return;        /* a first opening or the map's own introduction is playing: after it */
      if (!atDoor(v)) return;
      open(v);
    }, 140);
  }
  X.on('view', function (v) { if (offer && v !== 'fin') dropOffer(); consider(); });
  X.on('opening', consider);
  if (window.__isxReplay) Object.keys(T).forEach(function (k) { U.stSet(KEY + k, null); });

  /* the ⓘ in the header: on a tab with an entry screen it opens that screen; on the Circuit it stays the map's introduction */
  var ab = $('about');
  if (ab) ab.addEventListener('click', function (e) { if (!T[X.view]) return; e.stopImmediatePropagation(); e.preventDefault(); open(X.view, true); }, true);

  /* what the reminder says when it is set from an entry screen (v2/remind.js asks) */
  X.remindCtx = function (k) {
    if (k !== 'enter' || !live) return null;
    if (live === 'fin') return { host: el };             /* the machinery keeps the reminder's own words (level, place in the guide) */
    var c = T[live];
    return { host: el, name: c.k, title: 'The Imperial Stack: ' + c.k.replace(/^The /, 'the '), mins: c.mins, url: 'https://eliasrutten.com/imperial-stack/' + c.site,
      details: 'The Imperial Stack, ' + c.k.replace(/^The /, 'the ') + '. https://eliasrutten.com/imperial-stack/' + c.site, note: 'The event holds the link to this tab.' };
  };

  X.enter = { open: open, close: function () { close('skip'); }, get on() { return at(); }, tabs: Object.keys(T), key: KEY,
    copy: function () { var o = {}; Object.keys(T).forEach(function (k) { o[k] = { k: T[k].k, h: T[k].h, b: T[k].b.map(function (b) { return b.slice(); }), acts: T[k].acts.map(function (a) { return a[1]; }) }; }); return o; } };

  if (document.readyState === 'complete') consider(); else window.addEventListener('load', consider);
})();
