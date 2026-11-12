/* The Imperial Stack v2 · insight.js
   Three small, optional things on the Circuit, none of which ever blocks the map:
   1. the first moment: on a first visit the globe opens with one flow lit and one line about it; the controls settle in after;
   2. insights: one short, dismissible observation when the reader reaches a key step, country or firm (each shown once);
   3. reading notes: where a country's figures need care (re-exports, custody, missing data), its label carries a diamond,
      its flows are drawn with a broken track, and its card lists the notes with their sources.
   Data: /imperial-stack/data/insights.json. Storage: isx-first, isx-insights (off), isx-ins-seen. */
(function () {
  'use strict';
  var X = window.ISX; if (!X) return;
  var U = X.util, root = X.root, frame = X.$('frame');
  var D = { first: null, insights: [], notes: {} }, box = null, cur = null, hideT = 0, lastAt = 0, quietT = 0;
  var KEY = { first: 'isx-first', off: 'isx-insights', seen: 'isx-ins-seen' };
  var seen = {}; try { (U.stGet(KEY.seen) || '').split(',').forEach(function (k) { if (k) seen[k] = 1; }); } catch (e) { /* ignore */ }
  var isOff = function () { return U.stGet(KEY.off) === 'off'; };
  var markSeen = function (id) { seen[id] = 1; U.stSet(KEY.seen, Object.keys(seen).join(',')); };

  /* ---------- the chip ---------- */
  function build() {
    if (box) return box;
    box = document.createElement('div');
    box.className = 'ins2'; box.id = 'isx-insight'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); box.hidden = true;
    box.innerHTML = '<span class="ik"></span><p class="it"></p><span class="is"></span><div class="ia"><button type="button" class="ig" hidden></button><button type="button" class="io">Turn insights off</button></div><button type="button" class="ix" aria-label="Dismiss">×</button>';
    frame.appendChild(box);
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('ig')) { var go = cur && cur.go; close(true); if (go) act(go); }
      else if (b.classList.contains('io')) { U.stSet(KEY.off, 'off'); close(true); syncToggle(); }
      else close(true);
    });
    box.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); close(true); } });
    /* reading time is suspended while the pointer or the focus is on it */
    box.addEventListener('pointerenter', function () { clearTimeout(hideT); });
    box.addEventListener('pointerleave', function () { if (cur && !cur.first) arm(4000); });
    box.addEventListener('focusin', function () { clearTimeout(hideT); });
    return box;
  }
  /* desktop: beside the floating card, clear of the step bar; phones: a sheet at the foot of the screen (CSS) */
  function place() {
    if (!box || window.innerWidth <= 760) { if (box) { box.style.removeProperty('--ix'); box.style.removeProperty('--iy'); } return; }
    var fr = frame.getBoundingClientRect(), cmd = X.$('cmd'), tabs = X.$('tabs');
    var cr = cmd && cmd.getClientRects().length ? cmd.getBoundingClientRect() : null, tr = tabs && tabs.getClientRects().length ? tabs.getBoundingClientRect() : null;
    var left = cr ? cr.right - fr.left + 18 : 24, bottom = tr ? fr.bottom - tr.top + 14 : 96;
    var w = box.offsetWidth || 430; if (left + w > fr.width - 70) left = Math.max(16, fr.width - w - 70);
    box.style.setProperty('--ix', Math.round(left) + 'px'); box.style.setProperty('--iy', Math.round(bottom) + 'px');
  }
  window.addEventListener('resize', function () { if (cur) place(); });
  function arm(ms) { clearTimeout(hideT); hideT = setTimeout(function () { close(false); }, ms); }
  function act(go) {
    if (go.step != null) { X.stopPlay(); if (X.sel.iso) X.select(null); X.setStep(go.step); }
    else if (go.firm) { var f = X.firmBySlug ? X.firmBySlug(X.slug(go.firm)) : null; if (f) X.select(f.iso, f); }
    else if (go.how === 'method') { var m = X.$('method'); if (m) U.crisp(m, 20); }
  }
  function show(it) {
    if (!it || (isOff() && !it.first) || X.intro || X.view !== 'map') return false;
    build();
    cur = it; lastAt = Date.now();
    box.classList.toggle('first', !!it.first); box.classList.toggle('care', !!it.care);
    box.querySelector('.ik').textContent = it.k || (it.care ? 'Read with care' : 'Insight');
    box.querySelector('.it').textContent = it.t;
    box.querySelector('.is').textContent = it.src ? it.src : '';
    var g = box.querySelector('.ig'); g.hidden = !it.go; if (it.go) g.textContent = it.go.label;
    box.querySelector('.io').hidden = !!it.first;
    box.hidden = false; place(); void box.offsetWidth; box.classList.add('in');
    if (!it.first) arm(7000 + it.t.length * 45);
    return true;
  }
  function close(byUser) {
    if (!box || !cur) return;
    var it = cur; cur = null; clearTimeout(hideT);
    if (it.first) { endFirst(byUser); }
    if (it.id) markSeen(it.id);
    var had = box.contains(document.activeElement);
    box.classList.remove('in');
    setTimeout(function () { if (!cur) box.hidden = true; }, X.reduce ? 0 : 320);
    if (had) { var z = X.$('t-next'); if (z && z.getClientRects().length) z.focus({ preventScroll: true }); }
  }

  /* ---------- the first moment ---------- */
  var firstOn = false;
  function startFirst() {
    var f = D.first; if (!f || firstOn) return;
    if (U.stGet(KEY.first) === 'off' || X.deep || X.view !== 'map' || X.step !== 0 || X.intro) return;
    firstOn = true;
    var still = X.reduce;
    if (!still) root.classList.add('isx-quiet');
    X.highlight(function (fl) { return fl.to === 'NYC' && fl.from !== 'PLAT' && fl.from !== 'DC'; });
    var aim = function () { var g = X.globe; if (!g || !firstOn) return false; try { g.pointOfView({ lat: f.pov[0], lng: f.pov[1], altitude: f.pov[2] }, still ? 0 : 1600); } catch (e) { /* ignore */ } return true; };
    if (!aim()) { var n = 0, t = setInterval(function () { if (aim() || ++n > 20) clearInterval(t); }, 400); }
    setTimeout(function () { if (firstOn) show({ first: true, k: f.k, t: f.t, src: f.src, go: f.go }); }, still ? 0 : 900);
    /* the controls settle in on the first touch or key, or after a few seconds on their own */
    var wake = function () { settle(); };
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, wake, { once: true, passive: true, capture: true }); });
    quietT = setTimeout(settle, 4200);
    X.on('step', function () { if (firstOn && X.step !== 0) { if (cur && cur.first) close(false); else endFirst(false); } });
    X.on('view', function () { if (firstOn && X.view !== 'map') { if (cur && cur.first) close(false); else endFirst(false); } });
    X.on('select', function () { if (firstOn && X.sel.iso) { if (cur && cur.first) close(false); else endFirst(false); } });
    setTimeout(function () { if (firstOn && cur && cur.first) close(false); }, 26000);
  }
  function settle() { clearTimeout(quietT); if (!root.classList.contains('isx-quiet')) return; root.classList.remove('isx-quiet'); root.classList.add('isx-settle'); setTimeout(function () { root.classList.remove('isx-settle'); }, 1400); }
  function endFirst() {
    if (!firstOn) return; firstOn = false;
    settle(); U.stSet(KEY.first, 'off');
    X.highlight(null);
  }

  /* ---------- insights on events ---------- */
  function fire(key) {
    if (isOff() || firstOn || cur || X.intro) return;
    if (Date.now() - lastAt < 14000) return;
    for (var i = 0; i < D.insights.length; i++) {
      var it = D.insights[i];
      if (it.on === key && !seen[it.id]) { (function (it, at) { setTimeout(function () { if (!cur && !firstOn && here() === at) { it._at = at; show(it); } }, 1100); })(it, here()); return; }
    }
  }
  /* an insight belongs to the place it was shown: stepping or selecting something else puts it away (unread, it comes back another time) */
  function here() { var sel = X.sel; return X.step + '|' + (sel.firm ? sel.firm.name : sel.iso || ''); }
  function leave() { if (cur && !cur.first && cur._at && cur._at !== here()) { var it = cur, quick = Date.now() - lastAt < 2500; close(false); if (quick && it.id) { delete seen[it.id]; U.stSet(KEY.seen, Object.keys(seen).join(',')); } } }
  X.on('step', leave); X.on('select', leave);
  X.on('step', function (s) { var st = X.steps[s]; if (st) fire('step:' + st.key); });
  X.on('select', function (sel) { if (sel.firm) { if (X.own && X.own.has(sel.firm)) fire('firm'); } else if (sel.iso) fire('select:' + sel.iso); });
  X.on('view', function () { if (cur && X.view !== 'map') close(false); });

  /* ---------- reading notes ---------- */
  function notesFor(iso, stepKey) { return (D.notes[iso] || []).filter(function (n) { return !stepKey || !n.steps || n.steps.indexOf(stepKey) >= 0; }); }
  X.notesFor = notesFor;
  /* on the globe: a diamond on the label, a broken track on the flows the note is about */
  X.globeLayer(function (G) {
    if (G.rev || !G.step || X.sel.firm) return;
    var key = G.step.key, care = {};
    Object.keys(D.notes).forEach(function (iso) { if (notesFor(iso, key).some(function (n) { return n.mark !== false; })) care[iso] = 1; });
    if (!Object.keys(care).length) return;
    G.arcs.forEach(function (a) { if (a.track && (care[a.from] || care[a.to])) { a.dl = .016; a.dg = .011; a.care = 1; } });
    var CT = X.data.CTY, names = {}; Object.keys(care).forEach(function (iso) { if (CT[iso]) names[CT[iso].name] = iso; });
    G.html.forEach(function (h) { var el = h.el; if (!el || !el.firstChild) return; var t = el.firstChild.nodeValue; if (t && names[t]) { el.classList.add('nu'); el.dataset.nu = names[t]; } });
  });
  /* in the legend on the map: one row that explains the mark, only on steps that carry it */
  X.on('narr', function () {
    var L = X.$('leg6'); if (!L) return;
    var st = X.steps[X.step], any = st && Object.keys(D.notes).some(function (iso) { return notesFor(iso, st.key).some(function (n) { return n.mark !== false; }); });
    var old = L.querySelector('.lr.nu'); if (old) old.remove();
    if (!any || X.sel.firm) return;
    var r = document.createElement('div'); r.className = 'lr nu'; r.innerHTML = '<i class="arc care"></i><span>◇ Broken track: read with care (open the country)</span>';
    var lw = L.querySelector('.lw'); L.insertBefore(r, lw || null);
  });
  /* in the country card: the notes, with sources */
  X.on('card', function () {
    var sel = X.sel, host = X.$('c-note'); if (!host) return;
    var old = host.parentNode.querySelector('.care2'); if (old) old.remove();
    if (!sel.iso || sel.firm) return;
    var N = notesFor(sel.iso); if (!N.length) return;
    var st = X.steps[X.step], here = st ? st.key : '';
    /* the notes that bear on this step are shown; the others wait behind one line */
    var now = N.filter(function (n) { return n.steps && n.steps.indexOf(here) >= 0; }), rest = N.filter(function (n) { return now.indexOf(n) < 0; });
    var li = function (n) { return '<li><b>' + U.esc(n.h) + '.</b> ' + U.esc(n.t) + ' <span class="cs">' + (n.u ? '<a href="' + U.esc(n.u) + '" target="_blank" rel="noopener">' + U.esc(n.src) + '</a>' : U.esc(n.src || '')) + '</span></li>'; };
    var nm = X.data.CTY[sel.iso].name, d = document.createElement('div'); d.className = 'care2';
    d.innerHTML = '<h4><i aria-hidden="true">◇</i> Read with care' + (now.length ? ' · this step' : '') + '</h4>' + (now.length ? '<ul>' + now.map(li).join('') + '</ul>' : '')
      + (rest.length ? '<details' + (now.length ? '' : ' class="solo"') + '><summary>' + (now.length ? rest.length + ' more on ' + U.esc(nm) + '’s figures' : rest.length + (rest.length > 1 ? ' notes' : ' note') + ' on ' + U.esc(nm) + '’s figures') + '</summary><ul>' + rest.map(li).join('') + '</ul></details>' : '');
    host.parentNode.insertBefore(d, host.nextSibling);
  });
  /* a country with a note for this step: the note is also the insight, once */
  X.on('select', function (sel) {
    if (!sel.iso || sel.firm || isOff() || cur || firstOn) return;
    var st = X.steps[X.step], N = notesFor(sel.iso, st ? st.key : null); if (!N.length) return;
    var n = N[0], id = 'note:' + sel.iso + ':' + (n.id || n.h); if (seen[id]) return;
    var at = here(); setTimeout(function () { if (!cur && here() === at) show({ id: id, _at: at, care: true, k: 'Read with care · ' + X.data.CTY[sel.iso].name, t: n.s || n.t, src: n.src }); }, 900);
  });

  /* ---------- the switch: beside “How to use the globe” (in the map-mode panel on desktop, under the globe on phones) ---------- */
  function syncToggle() {
    var off = isOff();
    root.querySelectorAll('[data-ins="toggle"]').forEach(function (t) { t.hidden = false; t.setAttribute('aria-pressed', String(!off)); t.textContent = off ? 'Insights are off' : 'Insights are on'; t.title = off ? 'Show short observations at key steps, countries and firms' : 'Stop showing short observations'; });
  }
  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-ins="toggle"]'); if (!t) return;
    var off = isOff(); U.stSet(KEY.off, off ? null : 'off'); if (!off && cur) close(true); syncToggle();
  });
  var mm = X.$('mapmodes'); if (mm) new MutationObserver(syncToggle).observe(mm, { childList: true });
  syncToggle();

  X.load('insights').then(function (d) {
    D.first = d.first || null; D.insights = d.insights || []; D.notes = d.notes || {};
    if (X.view === 'map') { X.renderGlobe(false); X.recard(); X.emit('narr'); }
    startFirst();
  }).catch(function () { /* without the data the map simply shows no insights */ });
})();
