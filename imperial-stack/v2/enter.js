/* The Imperial Stack v2 · enter.js (profit tab patch, 18 Nov 2026; spec claude/specs/profit-tab-v4-17-nov.md §1 rows 1, 2 and 4, §3,
   and its addendum §1: “entry and exit screens are cinematic”)
   One entry screen for every tab but the Circuit, which keeps its own (“About this map”). The preview's template, restyled to the
   site: the whole window, a small centred masthead, the tab's title in the title face, the gold rule, three blocks with a clean line
   between them (“Where you are”, “What you are about to see”, “How to use it”), three buttons, nothing else. A second row of choices
   appears only after the button that needs it (the machinery's three levels after “Learn step by step”, the profit dollar's stations
   after “Jump to a station”); the machinery's tour is offered only after “Explore on my own”.
   It is shown once per browser, the first time a tab is entered at its door (the header, a door, Next, a plain link), never on a link
   to a place inside the tab. Esc or a click outside skips it; “How this tab works” in the header opens it again, on every tab that
   has one, without touching the visitor's place in the tab; “#replay” in the address shows all of them again.
   Machinery entry round (19 Nov 2026): this is the machinery's only entry. Its levels come from the page's data (ISX.simWays), never
   from the page's markup, and start through ISX.simWay; each shows a Time and a Difficulty bar and no minutes, shown or spoken.
   “Explore on my own” is not a level: the full map, nothing pinned, no thesis (ISX.simFree). Expert is the full map with the thesis.
   Thesis view (23 Nov 2026): “Just the thesis” is a fourth way in, between the levels and the free map (ISX.simChain): the chain of
   complexes lit on the map, the state's part, the thesis. Not a lesson.
   Motion: slow, one line at a time (veil, masthead, title, rule, the three blocks, the buttons); the first key or click shows the rest
   at once. Leaving, the text drifts toward the visitor and the veil lifts. Only opacity and transform move. Under reduced motion: a
   plain fade. Nothing here filters the tab behind (the globe's canvas must never sit under a CSS filter); the veil blurs its backdrop.
   Storage: isx-enter-<view> ('1' once seen). The check scripts' switches isx-tips-sim = 'off' and isx-enter = 'off' keep it away.
   Seam: ISX.enter { open(view, force), close(), on, tabs, copy() }. Bus event: enter { tab, act }. */
(function () {
  'use strict';
  var X = window.ISX; if (!X) return;
  var U = X.util, root = X.root, $ = X.$, esc = U.esc, KEY = 'isx-enter-', SUB = 'https://eliasrutten.substack.com';
  /* first-visit welcome (18 Nov): one key for every intro screen, isx-intro = 'off' once “Don’t show this again” is ticked here, on the
     Circuit's welcome or at the tour's last stop */
  var off = function () { return U.stGet('isx-tips-sim') === 'off' || U.stGet('isx-enter') === 'off' || U.stGet('isx-intro') === 'off'; };
  var intro0 = null;
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
      acts: [['levels', 'Learn step by step', 'The guide, at one of three levels'], ['thesis', 'Just the thesis', 'The chain on the map: nothing to learn'], ['free', 'Explore on my own', 'The full map: no guide, no thesis'], ['remind', 'Remind me later']] },
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
    var W = X.simWays ? X.simWays() : [];
    var lvl = ['', 'easiest', 'middle', 'hardest'];
    return W.map(function (w) {
      var tag = w.last ? '<small class="en-tag last">Last time</small>' : w.sug ? '<small class="en-tag">Suggested</small>' : '';
      var t = Math.max(12, Math.round(w.len * 100));
      return '<button type="button" class="en-ch en-lv' + (w.sug ? ' sug' : '') + '" data-en-way="' + esc(w.k) + '"><b>' + esc(w.t) + tag + '</b><span>' + esc(w.a) + '</span>'
        + '<span class="en-say">' + esc(w.say) + '</span>'
        + '<span class="en-bars" aria-hidden="true"><span class="en-bl">Time</span><span class="en-tb"><i style="width:' + t + '%"></i></span><span class="en-bl">Difficulty</span><span class="en-db">' + [1, 2, 3].map(function (j) { return '<i' + (j <= w.lv ? ' class="on"' : '') + '></i>'; }).join('') + '</span></span></button>';
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
      + '<div' + r().replace('en-r', 'en-r en-acts') + '>' + c.acts.map(function (a, j) { return '<button type="button" class="en-btn' + (j ? '' : ' pri') + '" data-en="' + a[0] + '"' + (a[0] === 'remind' ? ' data-remind="enter"' : '') + (a[0] === 'levels' || a[0] === 'stops' ? ' aria-expanded="false" aria-controls="isx-en-more"' : '') + '>' + (a[2] ? '<span class="en-bt">' : '') + esc(a[1]) + (j ? '' : ' <span aria-hidden="true">→</span>') + (a[2] ? '</span><small>' + esc(a[2]) + '</small>' : '') + '</button>'; }).join('') + '</div>'
      + '<div class="en-more" id="isx-en-more" hidden></div>'
      + '<p' + r().replace('en-r', 'en-r en-fine') + '><button type="button" class="en-skip" data-en="skip">Skip</button><span>Esc works too. The ? at the top left opens this again.</span><label class="en-off"><input type="checkbox" data-en-off' + (U.stGet('isx-intro') === 'off' ? ' checked' : '') + '> <span>Don’t show this again</span></label></p>'
      + '</div></div>';
    return h;
  }
  function hold(on) {
    if (wrap) wrap.inert = !!on;
    document.documentElement.classList.toggle('isx-enlock', !!on);
    root.classList.toggle('en-on', !!on);
  }
  function open(v, force, expand) {
    if (!T[v] || live === v) return false;
    if (!force && (off() || U.stGet(KEY + v) === '1')) return false;
    if (live) drop();
    clearTimeout(outT); [].forEach.call(root.querySelectorAll('#isx-enter.en-out'), function (o) { o.remove(); });   /* a screen still leaving goes at once: one #isx-enter at a time */
    if (offer) dropOffer();
    back = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
    el = document.createElement('div'); el.className = 'en' + (X.reduce ? ' en-all' : ''); el.id = 'isx-enter'; el.dataset.tab = v;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'isx-en-h'); el.tabIndex = -1;
    el.innerHTML = html(v); root.appendChild(el); live = v; hold(true);
    U.stSet(KEY + v, '1');
    el.addEventListener('click', onClick); el.addEventListener('keydown', onKey);
    intro0 = U.stGet('isx-intro') === 'off' ? null : U.stGet('isx-intro');
    el.addEventListener('change', function (e) { if (!e.target.matches('[data-en-off]')) return; U.stSet('isx-intro', e.target.checked ? 'off' : intro0); X.emit('intro', U.stGet('isx-intro')); });
    /* the first press shows the rest at once; a press outside the column leaves */
    el.addEventListener('pointerdown', function () { if (el) el.classList.add('en-all'); }, true);
    el.focus({ preventScroll: true });
    if (expand) { var eb = el.querySelector('.en-btn[data-en="' + expand + '"]'); el.classList.add('en-all'); if (eb) more(expand, eb); }
    syncTabx();
    X.emit('enter', { tab: v, act: 'open' });
    return true;
  }
  function drop() { if (!el) return; var e = el; el = null; live = null; if (e.parentNode) e.parentNode.removeChild(e); hold(false); syncTabx(); }
  /* the screen falls away: the text drifts toward the visitor, the veil lifts, the tab is there */
  function close(act, then) {
    if (!el) return; var e = el, v = live; el = null; live = null;
    if (X.remind && X.remind.on) X.remind.close();
    e.classList.add('en-out'); e.inert = true; hold(false); syncTabx();
    outT = setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, X.reduce ? 200 : 760);
    if (then) { try { then(); } catch (err) { /* the tab is still there */ } }
    var f = back && back.isConnected && back.getClientRects().length && !back.hidden ? back : $('v-' + v); back = null;
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
  function onClick(e) {
    if (!el) return;
    var t = e.target, b = t.closest('[data-en], [data-en-way], [data-en-stop]');
    if (!b) { if (!t.closest('.en-col') && !t.closest('#isx-remind')) close('skip'); return; }
    var v = live, d = b.dataset;
    var kb = e.detail === 0;
    if (d.enWay) { close('level', function () { if (X.simWay) X.simWay(d.enWay, kb); }); return; }
    if (d.enStop != null) { close('stop', function () { if (X.profit) X.profit.go(+d.enStop); }); return; }
    if (d.en === 'skip') { close('skip'); return; }
    if (d.en === 'note') { note(b); return; }
    if (d.en === 'remind') return;                       /* v2/remind.js opens its panel on [data-remind] and asks remindCtx what to say */
    if (d.en === 'levels') { if (more('levels', b) === false) close('go'); return; }   /* the guide is already under way: nothing to choose */
    if (d.en === 'stops') { if (more('stops', b) === false) close('go'); return; }
    if (d.en === 'thesis') { close('thesis', function () { if (X.simChain) X.simChain(kb); }); return; }   /* 23 Nov 2026: the thesis view, the chain on the map (not a level, not the free map) */
    if (d.en === 'free') { close('free', function () { if (X.simFree) X.simFree(kb); tourOffer(); }); return; }
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
    if (v === 'fin') return X.finMode === 'plumb' && !!X.simFresh;   /* nothing was started in the machinery: no level chosen, the guide at its first step */
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

  /* machinery entry round (19 Nov 2026): a labelled button in the header, “How this tab works”, in the same place on every tab that has an
     entry screen (Profits, Network, Machinery, Arm), at every width. It reopens the screen over the tab and changes nothing behind it.
     On the Circuit the place keeps “About this map” (the map's introduction) and Tour. */
  var ab = $('about'), tx = null;
  if (ab && ab.parentNode) {
    tx = document.createElement('button'); tx.type = 'button'; tx.className = 'aboutk en-tabx'; tx.id = 'isx-tabx'; tx.hidden = true; tx.setAttribute('aria-haspopup', 'dialog');
    tx.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/></svg><span class="lg">How this tab works</span><span class="sm" aria-hidden="true">How it works</span>';
    ab.parentNode.insertBefore(tx, ab.nextSibling);
    tx.addEventListener('click', function () { if (T[X.view]) open(X.view, true); });
  }
  function syncTabx() {
    var c = T[X.view];
    if (tx) { tx.hidden = !c; tx.setAttribute('aria-label', 'How this tab works'); tx.setAttribute('aria-expanded', String(!!live)); if (c) tx.title = 'The introduction to ' + c.k.replace(/^The /, 'the '); }   /* the spoken name is the drawn one */
    if (ab) ab.hidden = !!c;
  }
  X.on('view', syncTabx); syncTabx(); window.addEventListener('resize', syncTabx);

  /* help menu (20 Nov 2026): “About this map” / “How this tab works” and the Tour no longer sit as separate pills in the header – they pushed
     the tab bar (Crisis · coming soon, the Simulator) off the right edge. One “?” opens a small menu with them; the buttons keep their ids
     and handlers, they only move into the menu. The menu closes before an item's own handler runs, so focus comes back to the “?”. */
  var tb = $('tourb'), hw = null, hb = null, hm = null;
  if (ab && ab.parentNode) {
    hw = document.createElement('span'); hw.className = 'hlp'; hw.id = 'isx-help';
    hw.innerHTML = '<button type="button" class="hlpb" id="isx-helpb" aria-haspopup="menu" aria-expanded="false" aria-controls="isx-helpm" aria-label="Help: how this works and the tour" title="Help">'
      + '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6M12 17.2v.01"/></svg></button>'
      + '<div class="hlpm" id="isx-helpm" role="menu" aria-label="Help" hidden></div>';
    ab.parentNode.insertBefore(hw, ab);
    hb = hw.firstChild; hm = hw.lastChild;
    [ab, tx, tb].forEach(function (b) { if (b) { b.setAttribute('role', 'menuitem'); b.tabIndex = -1; hm.appendChild(b); } });
    if (tb) { var tl = tb.querySelector('span'); if (tl) tl.textContent = 'Take the 1-minute tour'; tb.setAttribute('aria-label', 'Take the 1-minute tour of the map'); }
    var items = function () { return [].slice.call(hm.querySelectorAll('[role="menuitem"]')).filter(function (b) { return !b.hidden; }); };
    var hset = function (on, focusFirst) {
      hm.hidden = !on; hb.setAttribute('aria-expanded', String(on)); hw.classList.toggle('on', on); root.classList.toggle('hlp-open', on);
      if (on && focusFirst) { var f = items()[0]; if (f) f.focus(); }
    };
    hb.addEventListener('click', function () { hset(hm.hidden, false); });
    hb.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || ((e.key === 'Enter' || e.key === ' ') && hm.hidden)) { e.preventDefault(); hset(true, true); } });
    hm.addEventListener('click', function (e) { if (e.target.closest('[role="menuitem"]')) { hset(false); hb.focus({ preventScroll: true }); } }, true);
    hm.addEventListener('keydown', function (e) {
      var L = items(), i = L.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); hset(false); hb.focus(); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); var n = L[(i + (e.key === 'ArrowDown' ? 1 : -1) + L.length) % L.length]; if (n) n.focus(); }
      else if (e.key === 'Tab') hset(false);
    });
    document.addEventListener('pointerdown', function (e) { if (!hm.hidden && !hw.contains(e.target)) hset(false); }, true);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !hm.hidden) { hset(false); } });
    X.on('view', function () { if (!hm.hidden) hset(false); });
  }

  /* the tab bar fits its frame (20 Nov 2026): the long labels (“The imperial machinery”, “Crisis simulation”) switch on by window width,
     but the frame stops growing at about 1600 px, so on wide screens the bar ran past its edge and cut off the coming-soon tabs. When the
     bar would overflow, the short labels take over (st-short), then tighter padding (st-tight). Measured against the header, which does not
     change size with the labels, so the check cannot loop. */
  var strip = $('strip'), hud = strip && strip.closest('.hud-top'), fitT = 0;
  function fitStrip() {
    if (!strip) return;
    root.classList.remove('st-short', 'st-tight');
    if (!strip.getClientRects().length || U.PHONE()) return;
    var over = function () { return strip.scrollWidth > strip.clientWidth + 1; };
    if (over()) { root.classList.add('st-short'); if (over()) root.classList.add('st-tight'); }
  }
  var fitSoon = function () { clearTimeout(fitT); fitT = setTimeout(fitStrip, 60); };
  if (strip) {
    if (window.ResizeObserver && hud) new ResizeObserver(fitSoon).observe(hud); else window.addEventListener('resize', fitSoon);
    X.on('view', function () { fitSoon(); setTimeout(fitStrip, 400); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitSoon);
    window.addEventListener('load', fitSoon); fitStrip();
  }

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
