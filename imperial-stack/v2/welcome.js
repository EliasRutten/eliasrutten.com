/* The Imperial Stack v2 · welcome.js (18 Nov 2026; spec claude/specs/first-visit-welcome-18-nov.md)
   The first visit to the Circuit. The page opens on the bare map (class wl-stage, set at boot): the globe, its arcs, the dark frame,
   the title and the link home; everything else is laid out but hidden and inert. The fly-in (v2/opening.js, without its title) plays,
   then the welcome card: the thesis, one line, “Show me around” and “Skip to the map”, and “Don’t show this again”.
   “Show me around” is the tour: six stops, each bringing in its part of the interface (a fade and a 6 px rise) with a tip card beside
   it; what has come in stays. “Skip to the map” and “Skip the tour” bring in all the rest at once and leave the visitor on step 00;
   the last stop’s “Start the loop” goes to step 01.
   When it shows: on a visit to the Circuit without a link into the map, until the visitor ticks “Don’t show this again” (isx-intro
   'off', which also turns off every tab’s entry screen) or has taken the tour once (isx-intro 'toured': Elias, 18 Nov, “make sure the
   tour stops if you have taken it once”; finishing it or leaving it with “Skip the tour” both count, “Skip to the map” on the welcome
   does not). A link into the map gets no welcome, only a one-line offer of the tour while the key is unset. “Tour” in the header runs
   the tour again from stop 1 on any tab; “Take the tour” under the globe runs it from stop 2. “#replay” clears the key.
   Keys: Enter or → next, ← back, Esc leaves (the welcome: Skip to the map; the tour: Skip the tour). Under 600 px the card and the
   tips are bottom sheets and a tap outside does nothing. Under reduced motion nothing fades or rises. With storage blocked the welcome
   shows every time and the checkbox simply closes it.
   Seam: ISX.welcome { state, at, start(stop), skip(), welcome(), stops, copy() }; ISX.tour (the old tour's seam) runs this tour.
   Bus event: welcome { act, at }. */
(function () {
  'use strict';
  var X = window.ISX; if (!X) return;
  var U = X.util, root = X.root, $ = X.$, frame = $('frame'), esc = U.esc, KEY = 'isx-intro';
  var mode = window.__isxWelcome || null;                 /* 'stage' | 'banner' | null, decided at boot */
  var sheet = function () { return window.innerWidth < 600; };
  var canStore = (function () { try { localStorage.setItem('isx-wl-t', '1'); localStorage.removeItem('isx-wl-t'); return true; } catch (e) { return false; } })();
  var state = mode === 'stage' ? 'bare' : 'off', at = -1, card = null, tip = null, ban = null, live = null, back = null, prevKey = null;

  /* ---------- the parts of the interface, in the order the tour brings them in ---------- */
  var PARTS = [
    ['#isx-cmd', '#isx-tabs', '#isx-mstep'],
    ['#isx-legbox', '#isx-zoom', '#isx-mapmodes', '#isx-hint', '#isx-mapnote', '#isx-rkick'],
    ['#isx-resbar', '#isx-vchip'],
    ['#isx-strip', '.hud-top .seg'],
    ['#isx-tgl', '#isx-strip .st-div'],
    ['#isx-dock', '#isx-b4row', '.hud-top .er-ps', '.hud-top .kl', '#isx-help', '#isx-about', '#isx-tourb', '#isx-mis']
  ];
  var ALL = PARTS.reduce(function (a, b) { return a.concat(b); }, []);
  var els = function (sels) { var out = []; sels.forEach(function (q) { root.querySelectorAll(q).forEach(function (e) { out.push(e); }); }); return out; };
  var shown = function (e) { return !!e && e.getClientRects().length > 0; };

  /* ---------- the copy (drafts for Elias) ---------- */
  var WL = {
    k: 'The Imperial Stack', n: '01',
    h: 'This is how America finances its imperial stack – and how the imperial stack keeps the dollar afloat.',
    l: 'Follow the money on one globe: from the rents US platforms collect abroad, through the chips and the factories, back into US shares and bonds.',
    go: 'Show me around', skip: 'Skip to the map', off: 'Don’t show this again',
    fn: 'Work in progress: small mistakes and bugs may still be there, but the general thesis holds.'
  };
  function stops() {
    var co = U.COARSE, gl = !root.classList.contains('no-gl'), ph = sheet(), mis = [].some.call(root.querySelectorAll('[data-mis]'), shown);
    return [
      { at: ['#isx-cmd'], side: 'right', h: 'Follow the money, one step at a time.', p: 'This card tells the story; the bar below is the route. Press <em>Next</em>' + (co ? '' : ', or →,') + ' to move the money one step. Ten steps, five acts.' },
      { at: ['#isx-legbox', '#isx-zoom', '#isx-globe'], side: 'left', h: 'The globe is live.', p: (gl ? (co ? 'Swipe to turn it, tap a country for its figures.' : 'Drag to turn it, click a country for its figures.') : (co ? 'Tap a country for its figures.' : 'Click a country for its figures.')) + ' Each colour is a flow; the thicker the arc, the more money it carries.' },
      { at: ['#isx-resbar', '#isx-vchip'], side: 'right', h: 'The machine’s vital signs.', p: 'Six dated figures that move with the markets: Big Tech spending, the US deficit, who buys US shares and bonds. Select one for the source.' + (ph ? ' Swipe for more.' : '') },
      { at: ['.hud-top .seg'], side: 'bottom', h: 'Six views of the same machine.', p: 'The Circuit shows the money moving; Profits shows what it buys; Network, Machinery and Arm show who runs it and how it is enforced. Crisis is coming.' },
      { at: ['#isx-tgl'], side: 'bottom', h: 'Look beneath the flows.', p: '<em>Firms</em> shows who owns what; <em>Layers</em> adds the blocs, the surpluses and the holdings of US shares to the map.' },
      { at: ['#isx-b4row', '#isx-dock'], side: 'top', h: 'Take it with you.', p: '<em>Share</em> copies a link to exactly this view. The thesis behind the map is coming soon on Substack; related pieces are there now.' + (mis ? ' Spot an error? <em>Mistake?</em> goes straight to me.' : '') + ' The <em>?</em>, top left, runs this again.', last: true }
    ];
  }

  /* ---------- bringing parts in, holding them back ---------- */
  function hide(e) { e.classList.remove('wl-in', 'wl-pop', 'wl-fade', 'wl-on'); if (!e.inert) { e.inert = true; e.dataset.wli = '1'; } }
  function show(e, how) {
    if (e.classList.contains('wl-in')) return;
    if (e.dataset.wli) { e.inert = false; delete e.dataset.wli; }
    e.classList.add('wl-in');
    if (how && !X.reduce) { e.classList.add(how); var c = function () { e.classList.remove(how); e.removeEventListener('animationend', c); }; e.addEventListener('animationend', c); setTimeout(c, 700); }
  }
  function stage() {   /* the bare map: everything but the globe and the title held back */
    if (document.activeElement && els(ALL).some(function (e) { return e.contains(document.activeElement); })) document.activeElement.blur();
    root.classList.add('wl-stage'); els(ALL).forEach(hide);
  }
  stage.on = function () { return root.classList.contains('wl-stage'); };
  function bring(i, how) {   /* the parts of stop i (0-based) */
    els(PARTS[i]).forEach(function (e) { show(e, how); });
  }
  function unstage(how) {   /* everything at once, then the class goes */
    if (!stage.on()) return;
    PARTS.forEach(function (p) { els(p).forEach(function (e) { show(e, how); }); });
    root.classList.remove('wl-stage');
    els(ALL).forEach(function (e) { if (e.dataset.wli) { e.inert = false; delete e.dataset.wli; } });
    setTimeout(function () { if (!stage.on()) els(ALL).forEach(function (e) { if (e) e.classList.remove('wl-in'); }); }, 800);
  }

  /* ---------- storage ---------- */
  var key = function () { return U.stGet(KEY); };
  function tick(on) {
    if (!canStore) { leaveAll(); return; }                 /* storage blocked: the box simply closes it */
    if (on) { if (key() !== 'off') prevKey = key(); U.stSet(KEY, 'off'); } else U.stSet(KEY, prevKey);
    syncTicks(); X.emit('intro', key());
  }
  function syncTicks() { root.querySelectorAll('[data-wl-off]').forEach(function (i) { i.checked = key() === 'off'; }); }
  function toured() { if (key() !== 'off') U.stSet(KEY, 'toured'); if (ban) dropBan(); }
  var offBox = function () { return '<label class="wl-off"><input type="checkbox" data-wl-off' + (key() === 'off' ? ' checked' : '') + '> <span>' + esc(WL.off) + '</span></label>'; };

  /* ---------- the welcome card ---------- */
  function welcome() {
    if (card || X.view !== 'map') return false;
    if (!stage.on()) stage();
    if (X.tray && X.tray.close) X.tray.close();
    state = 'welcome'; back = null;
    card = document.createElement('div'); card.className = 'wl-card'; card.id = 'isx-wl'; card.tabIndex = -1;
    card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'false'); card.setAttribute('aria-labelledby', 'isx-wl-h'); card.setAttribute('aria-describedby', 'isx-wl-l');
    card.innerHTML = '<p class="wl-k"><i class="dia" aria-hidden="true"></i><span>' + esc(WL.k) + '</span><span aria-hidden="true">·</span><span>' + WL.n + ' <em>of 05</em></span></p>'
      + '<h2 id="isx-wl-h">' + esc(WL.h) + '<span class="wl-ast" aria-hidden="true">*</span></h2><i class="wl-rule" aria-hidden="true"></i><p class="wl-l" id="isx-wl-l">' + esc(WL.l) + '</p>'
      + '<div class="wl-acts"><button type="button" class="wl-go" data-wl="go">' + esc(WL.go) + ' <span aria-hidden="true">→</span></button><button type="button" class="wl-skip" data-wl="skip">' + esc(WL.skip) + '</button></div>'
      + '<p class="wl-fn"><b aria-hidden="true">*</b>' + esc(WL.fn) + '</p>'
      + offBox();
    frame.appendChild(card); placeCard();
    card.addEventListener('click', function (e) { var b = e.target.closest('[data-wl]'); if (!b) return; if (b.dataset.wl === 'go') { closeCard(); start(1, true); } else leaveAll(); });
    card.focus({ preventScroll: true });
    X.emit('welcome', { act: 'open', at: 0 });
    return true;
  }
  function placeCard() {   /* on the globe's own centre (a bottom sheet on phones: CSS) */
    if (!card || sheet()) { if (card) card.style.left = card.style.top = ''; return; }
    var g = $('globe'), fr = frame.getBoundingClientRect(), r = g && shown(g) ? g.getBoundingClientRect() : fr;
    var cx = r.left + r.width / 2 - fr.left, cy = r.top + r.height / 2 - fr.top, w = card.offsetWidth / 2 + 16, h = card.offsetHeight / 2 + 16;
    card.style.left = Math.round(Math.max(w, Math.min(fr.width - w, cx))) + 'px'; card.style.top = Math.round(Math.max(h + 70, Math.min(fr.height - h, cy))) + 'px';
  }
  function closeCard() { if (!card) return; var c = card; card = null; c.classList.add('wl-out'); c.inert = true; setTimeout(function () { c.remove(); }, X.reduce ? 0 : 340); }
  /* “Skip to the map”: everything at once, step 00 */
  function leaveAll() {
    closeCard(); endTip(false);
    state = 'done'; at = -1;
    unstage('wl-fade');
    X.emit('welcome', { act: 'skip', at: 0 });
    focusMap();
  }
  function focusMap() { setTimeout(function () { var z = (X.route && X.route.next && X.route.next('circuit')) || $('t-next'); if (z && shown(z)) { try { z.focus({ preventScroll: true }); } catch (e) { /* ignore */ } } }, X.reduce ? 0 : 60); }

  /* ---------- the tour ---------- */
  function buildTip() {
    tip = document.createElement('div'); tip.className = 'wl-tip coach6'; tip.id = 'isx-wltip'; tip.tabIndex = -1; tip.hidden = true;
    tip.setAttribute('role', 'dialog'); tip.setAttribute('aria-modal', 'false'); tip.setAttribute('aria-labelledby', 'isx-wltip-h');
    tip.innerHTML = '<span class="wl-pt" aria-hidden="true"></span><div class="ck"><span>The tour</span></div><h3 id="isx-wltip-h"></h3><p></p><div class="wl-x"></div>'
      + '<div class="cfoot"><span class="wl-n"></span><div class="cacts"><button type="button" class="cq" data-wt="skip">Skip the tour</button><button type="button" class="cq" data-wt="back">Back</button><button type="button" class="cgo" data-wt="next"></button></div></div>'
      + '<div class="wl-live" aria-live="polite"></div>';
    frame.appendChild(tip);
    tip.addEventListener('click', function (e) { var b = e.target.closest('[data-wt]'); if (!b) return; var a = b.dataset.wt; if (a === 'next') next(); else if (a === 'back') go(at - 1); else skipTour(); });
  }
  /* stop is 1-based (1 to 7); fresh = the bare map first (a replay starts from it as well) */
  function start(stop, fromWelcome) {
    stop = Math.max(1, Math.min(7, +stop || 1));
    if (X.view !== 'map') { X.setView('map'); setTimeout(function () { start(stop, fromWelcome); }, 260); return true; }
    if (card) closeCard();
    if (X.opening && X.opening.on) X.opening.end();
    if (X.enter && X.enter.on) X.enter.close();
    if (X.tray && X.tray.close) X.tray.close();
    if (X.sel.iso) X.select(null);
    X.stopPlay(); if (X.step !== 0) X.setStep(0);
    var c = $('tournarr'); if (c && c.classList.contains('folded')) { var f = $('t-fold'); if (f) f.click(); }
    if (!fromWelcome) { back = document.activeElement && document.activeElement !== document.body ? document.activeElement : null; stage(); }
    if (ban) dropBan();
    if (!tip) buildTip();
    state = 'tour';
    for (var i = 0; i < stop - 1; i++) bring(i, null);
    at = -1; go(stop - 1);
    return true;
  }
  function go(i) {
    var T = stops(); if (i < 0 || i >= T.length || state !== 'tour') return;
    var fwd = i > at; at = i;
    /* phones: the step's one fact is a sheet of its own; past its stop it gives way, so it does not cover what comes next */
    for (var j = 0; j <= i; j++) bring(j, j === i && fwd ? 'wl-pop' : null);
    render(true);
    X.emit('welcome', { act: 'stop', at: i + 1 });
  }
  /* what the tip points at: the first of its parts that is on screen at this size and has come in (the globe always has) */
  function target(S) {
    for (var i = 0; i < S.at.length; i++) { var e = root.querySelector(S.at[i]); if (!shown(e)) continue; if (S.at[i] === '#isx-globe' || !stage.on() || e.classList.contains('wl-in')) return e; }
    return null;
  }
  function render(focus) {
    var T = stops(), S = T[at]; if (!tip || !S) return;
    tip.querySelector('h3').textContent = S.h; tip.querySelector('p').innerHTML = S.p;
    tip.querySelector('.wl-n').textContent = (at + 1) + ' of ' + T.length;
    tip.querySelector('.wl-x').innerHTML = S.last ? offBox() : '';
    tip.querySelector('[data-wt="next"]').innerHTML = S.last ? 'Start the loop <span aria-hidden="true">→</span>' : 'Next <span aria-hidden="true">→</span>';
    tip.querySelector('[data-wt="back"]').hidden = at === 0;
    tip.querySelector('[data-wt="skip"]').hidden = !!S.last;
    tip.querySelector('.wl-live').textContent = S.h + ' ' + tip.querySelector('p').textContent;
    root.querySelectorAll('.wl-on').forEach(function (e) { e.classList.remove('wl-on'); });
    var tgt = target(S); live = tgt;
    if (tgt && tgt.id !== 'isx-globe') tgt.classList.add('wl-on');
    if (at === 0) { var bar = $('tabs'); if (shown(bar)) bar.classList.add('wl-on'); }
    if (at === 6) els(['#isx-help', '#isx-mis']).forEach(function (e) { if (shown(e)) e.classList.add('wl-on'); });
    tip.hidden = false;
    /* the parts take their place first (the card may have grown): then the tip is placed beside them */
    var place1 = function () { if (!tip || stops()[at] !== undefined && at < 0) return; var t2 = target(S); place(S, t2); };
    place1(); requestAnimationFrame(function () { place1(); requestAnimationFrame(function () { if (tip) tip.classList.add('in'); }); });
    setTimeout(place1, 340);
    if (focus) tip.focus({ preventScroll: true });
  }
  function place(S, e) {
    if (!tip || tip.hidden) return;
    if (sheet()) {   /* a bottom sheet: bring what it names into view above it */
      tip.dataset.side = 'sheet'; tip.style.left = tip.style.top = '';
      root.classList.add('wl-lift'); root.style.setProperty('--wl-sheet', Math.round(tip.getBoundingClientRect().height) + 'px');
      var r0 = e && e.id !== 'isx-globe' ? e.getBoundingClientRect() : null;
      if (at === 0) { var cm = $('cmd'), tb = $('tabs'); if (shown(cm) && shown(tb)) { var a = cm.getBoundingClientRect(), b = tb.getBoundingClientRect(); r0 = { top: Math.min(a.top, b.top), bottom: Math.max(a.bottom, b.bottom) }; } }
      if (r0) {
        var room = window.innerHeight - tip.getBoundingClientRect().height - 16, dy = 0;
        if (r0.bottom > room) dy = r0.bottom - room; if (r0.top + -dy < 8) dy = r0.top - 8;
        if (Math.abs(dy) > 2) window.scrollBy({ top: dy, behavior: X.reduce ? 'auto' : 'smooth' });
      }
      return;
    }
    var fr = frame.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight, g = 16, x, y, side = S.side;
    if (!e) { tip.dataset.side = 'free'; tip.style.left = Math.round((fr.width - w) / 2) + 'px'; tip.style.top = Math.round(fr.height * .32) + 'px'; return; }
    var r = e.getBoundingClientRect();
    if (e.id === 'isx-globe') r = { left: r.left + r.width * .3, right: r.right - r.width * .3, top: r.top + r.height * .3, bottom: r.bottom - r.height * .3, width: r.width * .4, height: r.height * .4 };
    var fits = {
      right: r.right + g + w <= fr.right - 12, left: r.left - g - w >= fr.left + 12,
      top: r.top - g - h >= fr.top + 12, bottom: r.bottom + g + h <= fr.bottom - 12
    };
    var order = { right: ['right', 'top', 'bottom', 'left'], left: ['left', 'top', 'bottom', 'right'], top: ['top', 'right', 'left', 'bottom'], bottom: ['bottom', 'right', 'left', 'top'] }[side];
    for (var i = 0; i < order.length; i++) if (fits[order[i]]) { side = order[i]; break; }
    if (side === 'right') { x = r.right + g; y = r.top + Math.min(24, r.height / 2 - 24); }
    else if (side === 'left') { x = r.left - g - w; y = r.top + Math.min(24, r.height / 2 - 24); }
    else if (side === 'top') { x = r.left + r.width / 2 - w / 2; y = r.top - g - h; }
    else { x = r.left + r.width / 2 - w / 2; y = r.bottom + g; }
    if (S.at[0] === '#isx-tgl' && side === 'bottom') x = r.right - w;           /* the toolbar's right end: the tip hangs under it */
    x = Math.max(fr.left + 12, Math.min(x, fr.right - w - 12)); y = Math.max(fr.top + 12, Math.min(y, fr.bottom - h - 12));
    tip.style.left = Math.round(x - fr.left) + 'px'; tip.style.top = Math.round(y - fr.top) + 'px'; tip.dataset.side = side;
    var pt = tip.querySelector('.wl-pt');
    if (side === 'right' || side === 'left') { pt.style.left = ''; pt.style.top = Math.round(Math.max(18, Math.min(h - 18, r.top + Math.min(40, r.height / 2) - y))) + 'px'; }
    else { pt.style.top = ''; pt.style.left = Math.round(Math.max(22, Math.min(w - 22, r.left + r.width / 2 - x))) + 'px'; }
  }
  function next() {
    var T = stops();
    if (at < T.length - 1) { go(at + 1); return; }
    /* “Start the loop”: the tour is taken */
    toured(); endTip(true); state = 'done'; at = -1; unstage(null);
    X.emit('welcome', { act: 'done', at: 7 });
    X.stopPlay(); if (X.sel.iso) X.select(null); X.setStep(1);
    focusMap();
  }
  function skipTour() {
    if (state !== 'tour') return;
    var was = at + 1; toured(); endTip(true); state = 'done'; at = -1; unstage('wl-fade');
    X.emit('welcome', { act: 'skip', at: was });
    var f = back && back.isConnected && shown(back) ? back : null; back = null;
    if (f) { try { f.focus({ preventScroll: true }); } catch (e) { /* ignore */ } } else focusMap();
  }
  function endTip(anim) {
    root.classList.remove('wl-lift'); root.style.removeProperty('--wl-sheet');
    root.querySelectorAll('.wl-on').forEach(function (e) { e.classList.remove('wl-on'); });
    if (!tip || tip.hidden) return;
    var t = tip; t.classList.remove('in');
    setTimeout(function () { if (state !== 'tour') t.hidden = true; }, anim && !X.reduce ? 260 : 0);
  }

  /* ---------- the deep link's offer ---------- */
  function offer() {
    if (ban || key() || U.stGet('isx-tips-sim') === 'off') return;
    ban = document.createElement('div'); ban.className = 'wl-ban'; ban.id = 'isx-wlban'; ban.setAttribute('role', 'region'); ban.setAttribute('aria-label', 'New here?');
    ban.innerHTML = '<span>New here?</span><button type="button" class="wl-bgo" data-wb="go">Take the 1-minute tour</button><button type="button" class="wl-bx" data-wb="x" aria-label="Hide this offer">×</button>';
    frame.appendChild(ban); placeBan();
    ban.addEventListener('click', function (e) { var b = e.target.closest('[data-wb]'); if (!b) return; var go1 = b.dataset.wb === 'go'; dropBan(); if (go1) start(1); });
  }
  /* under the header, at the right end of the tab bar (the left holds each tab's own kicker line); centred on phones */
  function placeBan() {
    if (!ban) return;
    var h = frame.querySelector('.hud-top'), st = $('strip') || h, fr = frame.getBoundingClientRect(), hb = h ? h.getBoundingClientRect() : null, sb = st && shown(st) ? st.getBoundingClientRect() : null;
    ban.style.top = Math.round((hb ? hb.bottom - fr.top : 70) + 10) + 'px';
    if (sheet() || !sb) { ban.style.left = ''; ban.style.transform = ''; return; }
    ban.style.transform = 'none'; ban.style.left = Math.round(Math.max(12, sb.right - fr.left - ban.offsetWidth)) + 'px';
  }
  function dropBan() { if (ban) { ban.remove(); ban = null; } }

  /* ---------- keys ---------- */
  window.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key, onCtl = e.target && e.target.closest && e.target.closest('button, a[href], input, label, select, textarea');
    if (card && state === 'welcome') {
      if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); leaveAll(); }
      else if (k === 'ArrowRight' || k === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); }   /* the map does not step behind the card */
      else if (k === 'Enter' && !onCtl) { e.preventDefault(); e.stopPropagation(); closeCard(); start(1, true); }
      return;
    }
    if (state !== 'tour' || !tip || tip.hidden) return;
    if (X.enter && X.enter.on) return;
    if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); skipTour(); }
    else if (k === 'ArrowRight' && !(onCtl && onCtl.matches('input, select, textarea'))) { e.preventDefault(); e.stopPropagation(); next(); }
    else if (k === 'ArrowLeft' && !(onCtl && onCtl.matches('input, select, textarea'))) { e.preventDefault(); e.stopPropagation(); go(at - 1); }
    else if (k === 'Enter' && !onCtl) { e.preventDefault(); e.stopPropagation(); next(); }
  }, true);
  root.addEventListener('change', function (e) { if (e.target.matches && e.target.matches('[data-wl-off]')) tick(e.target.checked); });
  root.addEventListener('click', function (e) { var b = e.target.closest('[data-wl-tour]'); if (!b) return; e.preventDefault(); start(1); });
  window.addEventListener('resize', function () { placeCard(); placeBan(); if (state === 'tour' && at >= 0) render(false); });
  X.on('view', function (v) {
    if (v === 'map') return;
    if (state === 'tour') { endTip(false); state = 'done'; at = -1; }
    if (card) { closeCard(); state = 'done'; }
    unstage(null);
  });
  X.on('narr', function () { if (state === 'tour') setTimeout(function () { if (state === 'tour') render(false); }, 60); });

  /* ---------- when ---------- */
  function begin() {
    if (state !== 'bare') return;
    if (X.view !== 'map') { unstage(null); state = 'off'; return; }
    welcome();
  }
  if (mode === 'stage') {
    els(ALL).forEach(hide);   /* inert from the start: focus never lands on what is not there */
    var go1 = function () { if (!(X.opening && X.opening.wait('circuit', begin))) begin(); };
    /* the fly-in plays first; a press during it jumps to its end, and the card follows */
    if (root.classList.contains('op-c') && !(X.opening && X.opening.on)) setTimeout(go1, 60); else go1();
  } else if (mode === 'banner') {
    setTimeout(offer, 900);
  }

  /* the seam; ISX.tour is the old Circuit tour's: “Take the tour” under the globe runs this one from stop 2 */
  X.welcome = {
    get state() { return state; }, get at() { return at + 1; }, get staged() { return stage.on(); },
    start: start, skip: function () { if (state === 'tour') skipTour(); else if (card) leaveAll(); }, welcome: welcome, offer: offer,
    get stops() { return stops().map(function (S) { return { h: S.h, p: S.p.replace(/<[^>]+>/g, ''), at: S.at.slice() }; }); },
    parts: PARTS.map(function (p) { return p.slice(); }),
    copy: function () { return { welcome: Object.assign({}, WL), stops: this.stops }; }
  };
  X.tour = {
    open: function (user) { return start(user === false ? 1 : 2); }, close: function () { skipTour(); },
    get on() { return state === 'tour'; }, get at() { return at; }
  };
})();
