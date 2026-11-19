/* The Imperial Stack v2 · hints.js (round 5b, 16 Nov 2026; entry spec §2)
   Hints at first use, in the Scott Bessent Simulator. Seven one-line hints, each beside the control it names, each shown once:
   one at a time and at most one per step. They replace the tour's automatic start (the tour stays on the entry and beside the title).
   A hint never takes the focus and never blocks the map; it ends when the visitor does what it says, moves on, or presses “Got it”.
   “Hide hints” ends them for good. Teal, because gold means something can be done.
   Storage: isx-hints (the ids already shown, comma-separated), isx-hints-off ('1': none are shown; the check scripts set it).
   The page tells this file what happened through the bus: sim (where the Simulator stands), simcard (a card is on screen),
   simpick (an actor or line was opened), simtray (a tray opened), tip (a term's definition opened), views (a deeper view).
   Round 6 (the Arm rethought, spec §7): the same box, storage and rules serve six hints in the Arm; the page tells this file
   where the Arm stands through the event arm (layout, drawing, relation, selection, sheet, and the visitor's act). */
(function () {
  'use strict';
  var X = window.ISX; if (!X) return;
  var U = X.util, root = X.root, $ = X.$, KEY = 'isx-hints', OFF = 'isx-hints-off';
  var seen = {}; (U.stGet(KEY) || '').split(',').forEach(function (k) { if (k) seen[k] = 1; });
  var box = null, cur = null, anchor = null, S = { mode: null, line: 0, beat: -1, ph: null }, A = {}, at = '', shownAt = '', timer = 0, kinds = null;
  var phone = function () { return window.innerWidth <= 760; };
  var vis = function (e) { return !!e && e.getClientRects().length > 0; };
  var q = function (s) { return root.querySelector(s); };
  var off = function () { return U.stGet(OFF) === '1' || U.stGet('isx-tips-sim') === 'off'; };   /* the second is the check scripts' switch for “not a first visit” */
  var kind = function () { if (!kinds) kinds = X.sim.lines.map(function (l) { return { main: l.main, pre: l.pre, gnd: l.gnd, n: l.steps.length }; }); return kinds[S.line] || { n: 0 }; };
  var inStep = function () { return S.mode === 'story' && S.beat >= 0 && S.beat < kind().n; };
  /* which tab's hints may show: the Simulator's guide ('fin') or the Arm's machine ('arm') */
  var tabNow = function () { return X.view === 'arm' && X.armMode !== 'rev' ? 'arm' : X.view === 'fin' && X.finMode === 'plumb' ? 'fin' : X.view === 'profit' ? 'profit' : null; };
  var hostOf = function (t) { return t === 'arm' ? $('scene-arm') : t === 'profit' ? $('scene-profit') : $('cock'); };
  var inView = function (e) { if (!vis(e)) return false; var r = e.getBoundingClientRect(); return r.bottom > 40 && r.top < window.innerHeight - 40; };
  var firstIn = function (sel) { return [].slice.call(root.querySelectorAll(sel)).filter(inView)[0] || null; };
  var reach = function () { return X.armLay === 'reach'; };

  /* in order of precedence: the one moment a hint belongs to comes first, then the ones any step can carry */
  var HINTS = [
    { id: 'call', side: 'card', line: function () { return 'No right answer, no score. Choose, then see what happened; the other path stays open.'; },
      when: function () { return S.mode === 'story' && S.ph === 'ask' ? q('#isx-sn-body .dc-opts') : null; } },
    { id: 'next', side: 'free', line: function () { return phone() || U.COARSE ? 'Swipe the card, or tap Next.' : 'Next, or → on your keyboard.'; },
      when: function () { return inStep() && !S.ph && X.route ? X.route.next('sim') : null; } },
    { id: 'term', side: 'card', line: function () { return 'Dotted words have a definition: hover, or tap.'; },
      when: function () { if (S.mode !== 'story') return null; var d = [].slice.call(root.querySelectorAll('#isx-sn-body dfn.df')).filter(function (e) { var c = e.closest('details'); return vis(e) && (!c || c.open); }); return d[0] || null; } },
    { id: 'map', side: 'node', line: function () { return (U.COARSE ? 'Tap' : 'Click') + ' anything lit on the map for what it does and its sources.'; },
      when: function () { if (S.mode !== 'story') return S.mode === 'full' ? q('#isx-rmap .fn:not(.dim)') : null; return inStep() ? q('#isx-rmap .fn.lit:not(.s4dim)') : null; } },
    { id: 'gauge', side: 'bottom', line: function () { return 'A new indicator: its figure, date and source. All of them sit under Indicators.'; },
      when: function () { if (!inStep() || !q('#isx-b1play .ipc.new')) return null; var b = $('b1ind'); return vis(b) ? b : q('#isx-b1play .ipc.new'); } },
    { id: 'door', side: 'node', line: function () { return 'A deeper view of this part. Close it to come back here.'; },
      when: function () { return inStep() ? [].slice.call(root.querySelectorAll('#isx-rmap .vdoor:not(.off)')).filter(vis)[0] || null : null; } },
    { id: 'fold', side: 'card', line: function () { return 'More on this step is folded under “The mechanism”.'; },
      when: function () { if (!inStep() || S.ph) return null; var s = q('#isx-sn-body details.s2deep:not([open]) > summary'); return s && vis(s) && /The mechanism/.test(s.textContent) ? s : null; } },
    /* the Arm (round 6) */
    /* machinery entry round (19 Nov 2026): the tab no longer has to fit the window; on a smaller screen, full screen gives it room */
    { id: 'arm-fs', tab: 'arm', side: 'top', line: function () { return 'On a smaller screen this tab reads best in full screen: the button at the bottom right.'; },
      when: function () { return !phone() && !document.fullscreenElement && (window.innerHeight < 860 || window.innerWidth < 1366) ? firstIn('#isx-fs') : null; } },
    { id: 'arm-view', tab: 'arm', side: 'below', line: function () { return phone() || q('#isx-aview [data-aview="machine"][hidden]') ? 'Two ways to read this: Reach follows the paths, Orbit shows the whole shape. Switch any time.' : 'Three ways to read this: Layers shows every firm, Reach follows the paths, Orbit shows the whole shape. Switch any time.'; },
      when: function () { return X.armRel !== 'control' && (reach() || seen['arm-pick']) ? firstIn('#isx-aview:not([hidden])') : null; } },   /* on the machine, after the pick: picking an actor matters first */
    { id: 'arm-pick', tab: 'arm', side: 'node', line: function () { var t = phone() || U.COARSE ? 'Tap' : 'Click'; return t + ' a state body to see whom it reaches, or a group ' + (!reach() ? 'at the bottom' : X.armView === 'orbit' ? 'on the rim' : 'on the right') + ' to see who reaches it.'; },
      when: function () { if (X.armSel || X.armRel === 'control') return null; return reach() ? firstIn('#isx-areach .rn.state:not(.dim)') : firstIn('#isx-arm .mnode.state:not(.dim)'); } },
    { id: 'arm-sheet', tab: 'arm', side: 'top', line: function () { return '“Every link” opens the panel to all its ties, with their sources.'; },
      when: function () { return reach() && X.armSel && !X.armTall ? firstIn('#isx-asheet.on [data-ash="tall"]') : null; } },
    { id: 'arm-switch', tab: 'arm', side: 'node', line: function () { return 'Each tile is a power Washington holds. Pulled means it has been used on a named target; Ready means it exists as a rule. ' + (phone() || U.COARSE ? 'Tap' : 'Click') + ' to read it.'; },
      when: function () { return X.armRel === 'control' ? firstIn('.aboard .asw-b') : null; } },
    { id: 'arm-door', tab: 'arm', side: 'card', line: function () { return 'Gold buttons open the case where this power was used.'; },
      when: function () { return firstIn('#isx-scene-arm .adoor, #isx-asheet.on .adoor'); } },
    { id: 'arm-else', tab: 'arm', side: 'card', line: function () { return 'The same thing in the Circuit and the Simulator.'; },
      when: function () { return firstIn('#isx-scene-arm button.aels, #isx-asheet.on button.aels'); } },
    /* the profit dollar (profit tab build 1): what a tile is, how to move the year, where the table is */
    { id: 'pf-tile', tab: 'profit', side: 'bottom', line: function () { return 'Each tile is one figure with its date. The tiles are the key to the chart under them.'; },
      when: function () { return firstIn('#isx-pf-tiles .pf-tile:last-child'); } },
    { id: 'pf-year', tab: 'profit', side: 'node', line: function () { return phone() || U.COARSE ? 'Drag the slider to move through the years, or tap an era.' : 'Move over the chart or drag the slider to change the year; an era gives its average.'; },
      when: function () { return firstIn('#isx-pf-scrub input'); } },
    { id: 'pf-table', tab: 'profit', side: 'node', line: function () { return 'Every chart has its numbers: “View as table”.'; },
      when: function () { return firstIn('#isx-pf-table'); } }
  ];
  HINTS.forEach(function (H) { H.tab = H.tab || 'fin'; });

  function quiet(t) {
    if (off() || !t || X.intro || (X.enter && X.enter.on) || document.hidden || (X.remind && X.remind.on) || (X.opening && X.opening.on) || (X.views && X.views.on)) return true;
    if (t === 'arm') return !$('scene-arm');
    if (t === 'profit') return !$('scene-profit') || !X.profit || !X.profit.state.ready;
    return !$('cock') || (X.simtour && X.simtour.on) || !!q('#isx-cock.dcall');   /* the entry says how the guide works; hints start on the first card. Call screen round: a call covers the window and says on its own screen that there is no right answer, so no hint sits behind it */
  }
  function build() {
    box = document.createElement('div');
    box.className = 'hn7'; box.id = 'isx-hint7'; box.hidden = true; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite');
    box.innerHTML = '<span class="hn-w" aria-hidden="true"></span><span class="hn-k">Hint</span><p class="hn-t"></p>'
      + '<span class="hn-a"><button type="button" class="hn-ok" data-hn="ok">Got it</button><button type="button" class="hn-off" data-hn="off">Hide hints</button></span>';
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-hn]'); if (!b) return;
      if (b.dataset.hn === 'off') U.stSet(OFF, '1');
      close(true);
    });
    box.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); } });
  }
  function mark(el) {
    root.querySelectorAll('.hn-on').forEach(function (e) { e.classList.remove('hn-on'); });
    if (el) el.classList.add('hn-on');
    [].slice.call(root.classList).forEach(function (c) { if (c.indexOf('hn-live-') === 0) root.classList.remove(c); });
    if (el && cur) root.classList.add('hn-live-' + cur.id);   /* round 6: a hint may stand in for a line it repeats */
  }
  function place() {
    if (!box || !cur || !anchor || !anchor.isConnected || !vis(anchor)) { close(false); return; }
    if (phone()) { box.style.left = box.style.top = ''; box.dataset.side = 'sheet'; return; }   /* phones: a sheet at the top of the screen, clear of the card and the bar at its foot */
    var host = hostOf(cur.tab), fr = host.getBoundingClientRect(), r = anchor.getBoundingClientRect(), w = box.offsetWidth, h = box.offsetHeight, g = 12, x, y, side = cur.side;
    var card = cur.tab === 'arm' ? $('acard') : cur.tab === 'profit' ? null : $('snarr'), cr = card && vis(card) ? card.getBoundingClientRect() : null;
    if (side === 'below') { side = 'bottom'; x = r.left; y = r.bottom + g; }
    if (side === 'card' && (!cr || cr.right + g + w > fr.right - 12)) side = 'top';
    if (side === 'free' && cr && cr.right + g + w <= fr.right - 12) { x = cr.right + g; y = cr.bottom - h; }   /* Next sits under the card: the hint stands beside the card's foot, and Next itself is outlined */
    else if (side === 'free') { side = 'top'; x = r.left + Math.min(r.width / 2 - w / 2, 24); y = r.top - g - h; }
    else if (side === 'card') { x = cr.right + g; y = r.top + r.height / 2 - h / 2; }
    else if (side === 'node') { side = r.top - fr.top > h + 90 ? 'top' : 'bottom'; x = r.left + r.width / 2 - w / 2; y = side === 'top' ? r.top - g - h : r.bottom + g; }
    else if (side === 'bottom') { if (x == null) { x = r.right - w; y = r.bottom + g; } }
    else { x = r.left + Math.min(r.width / 2 - w / 2, 24); y = r.top - g - h; }
    x = Math.max(fr.left + 12, Math.min(x, fr.right - w - 12)); y = Math.max(fr.top + 12, Math.min(y, fr.bottom - h - 12));
    box.style.left = Math.round(x - fr.left) + 'px'; box.style.top = Math.round(y - fr.top) + 'px'; box.dataset.side = side;
    var wd = box.querySelector('.hn-w');
    if (side === 'card') { wd.style.left = ''; wd.style.top = Math.round(Math.max(12, Math.min(h - 12, r.top + r.height / 2 - y))) + 'px'; }
    else { wd.style.top = ''; wd.style.left = Math.round(Math.max(14, Math.min(w - 14, r.left + r.width / 2 - x))) + 'px'; }
  }
  function show(H, el) {
    var host = hostOf(H.tab); if (!host) return;
    if (!box) build();
    if (box.parentNode !== host) host.appendChild(box);
    cur = H; anchor = el; shownAt = at;
    seen[H.id] = 1; U.stSet(KEY, Object.keys(seen).join(','));
    box.querySelector('.hn-t').textContent = H.line();
    box.dataset.id = H.id; box.hidden = false; box.classList.remove('in');
    mark(el); place();
    if (cur) requestAnimationFrame(function () { if (box && cur) box.classList.add('in'); });
  }
  function close(byUser) {
    clearTimeout(timer);
    if (!box || !cur) return;
    var had = box.contains(document.activeElement), anchorWas = anchor;
    cur = null; anchor = null; mark(null);
    box.classList.remove('in');
    var el = box; setTimeout(function () { if (!cur) el.hidden = true; }, X.reduce ? 0 : 220);
    if (had && byUser && el.dataset.id && (el.dataset.id.indexOf('arm-') === 0 || el.dataset.id.indexOf('pf-') === 0)) { if (anchorWas && anchorWas.isConnected && vis(anchorWas) && anchorWas.focus) anchorWas.focus({ preventScroll: true }); }
    else if (had && byUser) { var n = X.route && X.route.next('sim'); if (n && vis(n)) n.focus({ preventScroll: true }); }
  }
  /* a step may carry one hint: the first one due that has not been shown */
  function consider() {
    clearTimeout(timer);
    var t = tabNow();
    if (cur || quiet(t) || shownAt === at) return;
    for (var i = 0; i < HINTS.length; i++) {
      var H = HINTS[i]; if (seen[H.id] || H.tab !== t) continue;
      var el = H.when(); if (el && vis(el)) { show(H, el); return; }
    }
  }
  function later(ms) { clearTimeout(timer); timer = setTimeout(consider, X.reduce ? Math.min(ms, 200) : ms); }

  X.on('sim', function (d) {
    var now = d.mode + ':' + d.line + ':' + d.beat + ':' + (d.ph || '');
    S = d;
    if (now !== at) { at = now; if (cur) close(false); }
    if (d.mode !== 'story') later(1100);   /* the full map has no card: its one hint comes once the map has settled */
  });
  X.on('simcard', function () { later(1000); });   /* the card is drawn and the map has moved to the step */
  X.on('tip', function () { if (cur && cur.id === 'term') close(false); });
  X.on('simpick', function (d) { if (!cur || (d.n == null && d.e == null)) return; if (cur.id === 'map' || (cur.id === 'gauge' && d.n)) close(false); });
  X.on('simtray', function (t) { if (cur && (t === 'read' ? cur.id === 'gauge' : !!t)) close(false); });
  X.on('views', function (id) { if (cur && id) close(false); });
  X.on('view', function () { if (cur && cur.tab !== tabNow()) close(false); if (tabNow() === 'arm') { at = 'arm:' + X.armRel + ':' + (X.armSel || '') + ':' + X.armLay; later(1300); } if (tabNow() === 'profit') { at = 'profit:view'; later(1300); } });
  /* the profit dollar: a hint ends when the visitor does what it says; a new station or view may carry the next one */
  X.on('profit', function (d) {
    if (tabNow() !== 'profit') return;
    if (cur && cur.tab === 'profit' && ((cur.id === 'pf-year' && d.act === 'year') || (cur.id === 'pf-table' && d.act === 'table'))) close(false);
    if (d.act === 'year') return;
    var now = 'profit:' + d.st + ':' + d.view + ':' + (d.act === 'table' ? 't' : '');
    if (now !== at) { at = now; if (cur && cur.tab === 'profit') close(false); }
    later(1000);
  });
  /* the Arm: a hint ends when the visitor does what it says; a new state may carry the next one */
  var ENDS = { 'arm-view': 'view', 'arm-pick': 'pick', 'arm-sheet': 'sheet', 'arm-switch': 'tile', 'arm-door': 'door', 'arm-else': 'door' };
  X.on('arm', function (d) {
    A = d || {};
    if (cur && cur.tab === 'arm' && ENDS[cur.id] === A.act) close(false);
    var now = 'arm:' + A.rel + ':' + (A.sel || '') + ':' + A.lay + ':' + A.v + ':' + (A.sheet || '') + ':' + (A.tall ? 1 : 0);
    if (now !== at) { at = now; if (cur && cur.tab === 'arm') close(false); }
    later(900);
  });
  X.on('card', function () { if (tabNow() === 'arm' && !cur) later(1000); });
  window.addEventListener('scroll', function () { if (cur && cur.tab === 'arm' && phone()) return; if (!cur && (tabNow() === 'arm' || tabNow() === 'profit')) later(700); }, { passive: true });
  X.on('fin', function () { if (cur) close(false); at = ''; });
  root.addEventListener('toggle', function (e) { if (cur && cur.id === 'fold' && e.target.matches && e.target.matches('details.s2deep') && e.target.open) close(false); }, true);
  window.addEventListener('resize', function () { if (cur) place(); });

  /* the page drew the Simulator before this file loaded (a link straight to the tab, or a reload inside the guide): start from where it stands */
  if (tabNow() === 'arm') { at = 'arm:boot'; later(1600); }
  if (tabNow() === 'profit') { at = 'profit:boot'; later(1800); }
  if (X.view === 'fin' && X.finMode === 'plumb' && $('cock')) { var s0 = X.sim; S = { mode: s0.mode, line: s0.line, beat: s0.beat, ph: s0.ph }; at = S.mode + ':' + S.line + ':' + S.beat + ':' + (S.ph || ''); later(1600); }

  X.hints = {
    get on() { return cur ? cur.id : null; }, get seen() { return Object.keys(seen); }, ids: HINTS.map(function (H) { return H.id; }), tabs: HINTS.reduce(function (o, H) { o[H.id] = H.tab; return o; }, {}),
    lines: function () { var o = {}; HINTS.forEach(function (H) { o[H.id] = H.line(); }); return o; },
    close: function () { close(false); }, check: consider,
    reset: function () { seen = {}; U.stSet(KEY, null); U.stSet(OFF, null); shownAt = ''; },
    /* patch of 18 Nov: “Take the tour” on a tab's entry screen plays that tab's hints again, in order, as the visitor moves */
    replay: function (tab) { HINTS.forEach(function (H) { if ((H.tab || 'fin') === tab) delete seen[H.id]; }); U.stSet(KEY, Object.keys(seen).join(',') || null); U.stSet(OFF, null); shownAt = ''; later(900); }
  };
})();
