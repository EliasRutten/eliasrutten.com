/* The Imperial Stack v2 · route.js (round B1)
   One bar for the three tabs that are walked step by step: the Circuit, the Simulator's guide and Scenarios.
   Left to right: Back · Next · what you follow · the route · the tab's own controls · the dock. One connected,
   rounded bar in the grammar of the top strip (v2/strip.js): segments parted by hairlines, never by gaps.
   The route: acts or chapters as segments in their own colour, steps as marks, decisions as diamonds, and one lit
   marker that slides under the step in hand (it cuts under reduced motion and on first paint).
   Back and Next are the same two elements for as long as a bar lives, so they never move and never lose focus.
   The dock (thesis, support, share, full screen) is the page's own element, moved into the bar and back out again;
   it is never rebuilt, so its ids, links and the share popover keep working.
   This file also owns the one ← → handler and the swipe on phones. It knows nothing about the tabs: each tab
   hands it a model from the function that already drew its bar, and listens with ISXR.on().
   Loaded before the page script (like perf.js); the page publishes it as ISX.route. */
(function () {
  'use strict';
  var root = document.getElementById('isx-root'); if (!root) return;
  var subs = [], live = [], dock = null, dockHome = null, dockAfter = null;
  var AL = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg>';
  var AR = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 5.5L16 12l-6.5 6.5"/></svg>';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var phone = function () { return window.innerWidth <= 760; };
  var still = function () { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  var emit = function (ev) { subs.slice().forEach(function (fn) { try { fn(ev); } catch (e) { if (window.console) console.error(e); } }); };

  /* ---------- the dock: in the bar on wide screens, in its own place on phones and in tabs without a bar ---------- */
  function adopt(bar) {
    dock = dock || document.getElementById('isx-dock'); if (!dock) return;
    if (!dockHome) { dockHome = dock.parentNode; dockAfter = dock.nextSibling; }
    if (dock.parentNode !== bar) bar.appendChild(dock);
  }
  function release() {
    if (dock && dockHome && dock.parentNode !== dockHome) dockHome.insertBefore(dock, dockAfter && dockAfter.parentNode === dockHome ? dockAfter : null);
  }

  /* ---------- marks ---------- */
  var SC = { cur: 'c', done: 'd', seen: 'seen', alt: 'alt' };
  function mark(m, lab) {
    var st = String(m.state || '').split(' ').map(function (s) { return SC[s] || s; }).join(' '), cur = /(^| )c( |$)/.test(st);
    var go = m.target != null, tag = go ? 'button' : 'span';
    var a = (go ? ' type="button" data-rt="go" data-rt-t="' + esc(m.target) + '" tabindex="' + (cur ? 0 : -1) + '"' : '')
      + (m.id ? ' id="' + esc(m.id) + '"' : '') + (m.colour ? ' style="' + (m.kind === 'fork' ? '--fk' : '--sc') + ':' + esc(m.colour) + '"' : '')
      + (m.title ? (lab && m.kind !== 'icon' ? '' : ' aria-label="' + esc(m.title) + '"') + ' data-tip="<b>' + esc(esc(m.title)) + '</b>' + (m.sub ? '<p>' + esc(esc(m.sub)) + '</p>' : '') + '"' : '')
      + (cur ? ' aria-current="step"' : '');
    if (m.kind === 'icon') return '<' + tag + ' class="rt-st rt-ic ' + st + '"' + a + '><small aria-hidden="true">&nbsp;</small><b aria-hidden="true">' + esc(m.icon || '▶') + '</b></' + tag + '>';
    if (lab && (m.kind === 'step' || !m.kind)) return '<' + tag + ' class="rt-st ' + st + '"' + a + '><small>' + esc(m.n || '') + '</small><b>' + esc(m.t || '') + '</b></' + tag + '>';
    var k = m.kind === 'fork' ? 'rt-f' : m.kind === 'link' ? 'rt-l' : m.kind === 'crisis' ? 'rt-x' : m.kind === 'end' ? 'rt-m rt-e' : 'rt-m';
    return '<' + tag + ' class="' + k + ' ' + st + '"' + a + '></' + tag + '>';
  }
  function seg(s, i) {
    var n = s.marks.length, w = s.grow != null ? s.grow : n + (s.current ? 6 : 2);
    var txt = s.short ? '<span class="lg">' + esc(s.label) + '</span><span class="sm" aria-hidden="true">' + esc(s.short) + '</span>' : esc(s.label);
    var lab = s.target != null
      ? '<button type="button" class="rt-sl" data-rt="go" data-rt-t="' + esc(s.target) + '"' + (s.title ? ' data-tip="<b>' + esc(esc(s.title)) + '</b>' + (s.sub ? '<p>' + esc(esc(s.sub)) + '</p>' : '') + '"' : '') + '>' + txt + '</button>'
      : '<span class="rt-sl">' + txt + '</span>';
    return '<div class="rt-s' + (s.current ? ' cur' : '') + (s.lab ? ' lab' : '') + (s.wide ? ' wide' : '') + (s.cls ? ' ' + s.cls : '') + '" style="--sc:' + esc(s.colour || '#ffd27a') + ';--w:' + w + '">' + lab
      + '<div class="rt-ms">' + s.marks.map(function (m) { return mark(m, s.lab); }).join('') + '</div></div>';
  }

  /* ---------- one bar ---------- */
  function build(host) {
    var R = { host: host, model: null, first: true, lineAttrs: [], ctl: null, mode: null };
    host.innerHTML = '';
    host.classList.add('rt-host');
    var bar = R.bar = document.createElement('div'); bar.className = 'rt';
    bar.innerHTML = '<button type="button" class="rt-bk" data-rt="back">' + AL + '</button>'
      + '<button type="button" class="rt-nx" data-rt="next"><span><small></small><b></b></span>' + AR + '</button>'
      + '<button type="button" class="rt-line" hidden><small></small><b></b></button>'
      + '<div class="rt-route"><div class="rt-segs"></div><i class="rt-here" aria-hidden="true"></i></div>'
      + '<div class="rt-ctl" hidden></div>';
    host.appendChild(bar);
    R.bk = bar.querySelector('.rt-bk'); R.nx = bar.querySelector('.rt-nx'); R.line = bar.querySelector('.rt-line');
    R.route = bar.querySelector('.rt-route'); R.segs = bar.querySelector('.rt-segs'); R.here = bar.querySelector('.rt-here'); R.ctlEl = bar.querySelector('.rt-ctl');
    bar.addEventListener('click', function (e) {
      var t = e.target.closest('[data-rt]'); if (!t || !bar.contains(t) || !R.model) return;
      var k = t.dataset.rt, id = R.model.id;
      if (k === 'go') { emit({ id: id, target: t.dataset.rtT, how: 'click' }); return; }
      if (t.getAttribute('aria-disabled') === 'true' && !t.classList.contains('hold')) return;
      emit({ id: id, nav: k, how: 'click', held: t.classList.contains('hold') });
    });
    host._rt = R; live.push(R);
    return R;
  }
  function render(host, M) {
    if (!host) return;
    var R = host._rt && host._rt.bar && host._rt.bar.parentNode === host ? host._rt : build(host), ph = phone(), cp = !ph && window.innerWidth <= 1000, mode = ph ? 'ph' : cp ? 'cp' : 'w', bar = R.bar;
    R.model = M;
    bar.classList.toggle('ph', ph); bar.classList.toggle('cp', cp); bar.dataset.id = M.id;
    host.setAttribute('aria-label', M.label || 'Steps');
    /* Back */
    var bk = M.back || {}, bOn = bk.enabled !== false;
    R.bk.setAttribute('aria-label', bk.label || 'Back'); R.bk.setAttribute('aria-disabled', String(!bOn)); R.bk.classList.toggle('off', !bOn);
    /* Next */
    var nx = M.next || {}, kind = nx.kind || 'go', nOn = nx.enabled !== false && kind !== 'hold';
    R.nx.className = 'rt-nx' + (kind === 'hold' ? ' hold' : kind === 'branch' ? ' br' : kind === 'return' ? ' ret' : '') + (nx.enabled === false ? ' off' : '');
    R.nx.querySelector('small').textContent = ph && nx.pkicker != null ? nx.pkicker : nx.kicker || 'Next';
    R.nx.querySelector('b').textContent = ph && nx.ptitle != null ? nx.ptitle : nx.title || '';
    /* no aria-label: the button's name is the text it shows (kicker and destination) */
    R.nx.setAttribute('aria-disabled', String(!nOn));
    /* what you follow */
    var ln = M.line;
    R.lineAttrs.forEach(function (k) { R.line.removeAttribute(k); }); R.lineAttrs = [];
    R.line.hidden = !ln;
    if (ln) {
      R.line.querySelector('small').textContent = ln.kicker || ''; R.line.querySelector('b').textContent = ln.title || '';
      Object.keys(ln.attrs || {}).forEach(function (k) { R.line.setAttribute(k, ln.attrs[k]); R.lineAttrs.push(k); });
    }
    /* the route */
    var ae = document.activeElement, keep = ae && R.segs.contains(ae) ? ae.getAttribute('data-rt-t') : null, h;
    if (M.note) h = '<p class="rt-note">' + esc(M.note) + '</p>';
    else if (ph || cp) {
      var P = M.ph || (function () { var c = (M.segs || []).filter(function (s) { return s.current; })[0] || (M.segs || [])[0] || { label: '', marks: [] }; return { label: c.label, colour: c.colour, marks: c.marks, count: M.count }; })();
      h = '<div class="rt-s cur" style="--sc:' + esc(P.colour || '#ffd27a') + '"><span class="rt-pl"><b>' + esc(P.label || '') + '</b><em>' + esc(P.count || '') + '</em></span><div class="rt-ms">' + (P.marks || []).map(function (m) { return mark(m, false); }).join('') + '</div></div>';
    } else h = (M.segs || []).map(seg).join('');
    R.segs.innerHTML = h;
    R.route.classList.toggle('noted', !!M.note);
    if (keep != null) { var f = R.segs.querySelector('[data-rt-t="' + keep.replace(/"/g, '') + '"]'); if (f) f.focus({ preventScroll: true }); }
    /* the tab's own controls: rewritten only when they change, so a pressed switch keeps the focus */
    var c = M.controls || '';
    if (c !== R.ctl) { if (R.line.parentNode === R.ctlEl) bar.insertBefore(R.line, R.route); R.ctl = c; R.ctlEl.innerHTML = c; }
    /* on a phone what you follow sits in the row above the bar, with the tab's controls */
    if (ph && ln) { if (R.line.parentNode !== R.ctlEl) R.ctlEl.insertBefore(R.line, R.ctlEl.firstChild); } else if (R.line.parentNode !== bar) bar.insertBefore(R.line, R.route);
    R.ctlEl.hidden = !(c || (ph && ln));
    /* the dock */
    if (!ph && M.dock !== false) adopt(bar); else release();
    place(R, R.first || R.mode !== mode); R.first = false; R.mode = mode;
  }
  /* the lit marker: under the mark in hand */
  function place(R, cut) {
    if (!R) { live.forEach(function (x) { if (x.host.isConnected && x.model) place(x, cut); }); return; }
    var here = R.here, m = R.segs.querySelector('.c');
    if (!m || !m.getClientRects().length) { here.style.opacity = '0'; return; }
    var rr = R.route.getBoundingClientRect(), mr = m.getBoundingClientRect(), wide = m.classList.contains('rt-st');
    var x = mr.left - rr.left + (wide ? 6 : -2), w = mr.width + (wide ? -12 : 4);
    if (cut || still()) here.classList.add('cut');
    here.style.opacity = '1';
    here.style.width = Math.max(6, w).toFixed(1) + 'px';
    here.style.transform = 'translateX(' + x.toFixed(1) + 'px)';
    if (cut || still()) { void here.offsetWidth; if (!still()) here.classList.remove('cut'); }
  }
  /* a tab without a bar (the Arm, the capital stack) hands the host back */
  function drop(host) {
    if (!host || !host._rt) return;
    if (dock && host._rt.bar.contains(dock)) release();
    live = live.filter(function (x) { return x !== host._rt; });
    host._rt = null; host.classList.remove('rt-host');
  }
  function current() {
    for (var i = 0; i < live.length; i++) { var R = live[i]; if (R.model && R.host.isConnected && R.bar.parentNode === R.host && R.host.getClientRects().length) return R; }
    return null;
  }

  /* ---------- ← → : one handler for the three tabs ---------- */
  document.addEventListener('keydown', function (ev) {
    if (ev.defaultPrevented || ev.ctrlKey || ev.metaKey || ev.altKey || ev.shiftKey || (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft')) return;
    var t = ev.target;
    if (t && t.closest && t.closest('input, textarea, select, [contenteditable="true"], .mapscroll, [role="dialog"], .s2tray, .sc3tray, .shpop, .tour2, .b1sheet')) return;
    var R = current(); if (!R || R.model.keys === false) return;
    var st = R.model.stage || R.host, r = st.getBoundingClientRect();
    if (r.bottom < 80 || r.top > window.innerHeight - 80) return;
    ev.preventDefault();
    emit({ id: R.model.id, nav: ev.key === 'ArrowRight' ? 'next' : 'back', how: 'key' });
  });

  /* ---------- swipe (touch, phones): left is Next, right is Back ---------- */
  function swipe(el, id, not) {
    if (!el || el._rtsw) return; el._rtsw = true;
    var x0 = 0, y0 = 0, on = false;
    el.addEventListener('touchstart', function (e) {
      on = phone() && e.touches.length === 1 && !(e.target.closest && e.target.closest('.rt, .b1play, input, textarea, select, [data-noswipe]' + (not ? ', ' + not : '')));
      if (on) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }
    }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (!on) return; on = false;
      var c = e.changedTouches[0], dx = c.clientX - x0, dy = c.clientY - y0;
      if (Math.abs(dx) < 48 || Math.abs(dy) >= .58 * Math.abs(dx)) return;
      emit({ id: id, nav: dx < 0 ? 'next' : 'back', how: 'swipe' });
    }, { passive: true });
    el.addEventListener('touchcancel', function () { on = false; }, { passive: true });
  }

  var rt = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rt); rt = setTimeout(function () {
      live.forEach(function (R) { if (!R.host.isConnected || !R.model || !R.host.getClientRects().length) return; var m = phone() ? 'ph' : window.innerWidth <= 1000 ? 'cp' : 'w'; if (R.mode !== m) render(R.host, R.model); else place(R, true); });
    }, 90);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { place(null, true); });
  root.classList.add('rt-on');
  window.ISXR = {
    render: render, place: function (cut) { place(null, cut === true); }, on: function (fn) { subs.push(fn); },
    drop: drop, release: release, swipe: swipe, phone: phone,
    next: function (id) { var R = current(); return R && (!id || R.model.id === id) ? R.nx : null; },
    get current() { var R = current(); return R ? R.model.id : null; }
  };
})();
