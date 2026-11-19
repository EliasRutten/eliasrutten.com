/* The Imperial Stack v2 · insight.js
   Three small, optional things on the Circuit, none of which ever blocks the map:
   1. the first moment: on a first visit the globe opens with one flow lit and one line about it; the controls settle in after;
   2. insights: one short, dismissible observation when the reader reaches a key step, country or firm (each shown once);
   3. reading notes: where a country's figures need care (re-exports, custody, missing data), its label carries a diamond,
      its flows are drawn with a broken track, and its card lists the notes with their sources.
   Data: /imperial-stack/data/insights.json. Storage: isx-first.
   19 Nov 2026 (Elias: the pop-ups at steps, firms and countries “feel too random”): the pop-ups are gone. Later that day the
   first card went too (D.first stays null, so startFirst() never runs). The notes to read with care stay in the country card,
   the legend and on the globe; they no longer pop up. */
(function () {
  'use strict';
  var X = window.ISX; if (!X) return;
  var U = X.util, root = X.root, frame = X.$('frame');
  var D = { first: null, notes: {} }, box = null, cur = null, quietT = 0;
  var KEY = { first: 'isx-first' };

  /* ---------- the chip ---------- */
  function build() {
    if (box) return box;
    box = document.createElement('div');
    box.className = 'ins2'; box.id = 'isx-insight'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); box.hidden = true;
    box.innerHTML = '<span class="ik"></span><p class="it"></p><span class="is"></span><div class="ia"><button type="button" class="ig" hidden></button></div><button type="button" class="ix" aria-label="Dismiss">×</button>';
    frame.appendChild(box);
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('ig')) { var go = cur && cur.go; close(true); if (go) act(go); }
      else close(true);
    });
    box.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); close(true); } });
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
  function act(go) {
    if (go.step != null) { X.stopPlay(); if (X.sel.iso) X.select(null); X.setStep(go.step); }
    else if (go.firm) { var f = X.firmBySlug ? X.firmBySlug(X.slug(go.firm)) : null; if (f) X.select(f.iso, f); }
    else if (go.how === 'method') { var m = X.$('method'); if (m) U.crisp(m, 20); }
  }
  function show(it) {
    if (!it || X.intro || X.view !== 'map') return false;
    build();
    cur = it;
    box.classList.add('first');
    box.querySelector('.ik').textContent = it.k || '';
    box.querySelector('.it').textContent = it.t;
    box.querySelector('.is').textContent = it.src ? it.src : '';
    var g = box.querySelector('.ig'); g.hidden = !it.go; if (it.go) g.textContent = it.go.label;
    box.hidden = false; place(); void box.offsetWidth; box.classList.add('in');
    return true;
  }
  function close(byUser) {
    if (!box || !cur) return;
    var it = cur; cur = null;
    if (it.first) { endFirst(byUser); }
    var had = box.contains(document.activeElement);
    box.classList.remove('in');
    setTimeout(function () { if (!cur) box.hidden = true; }, X.reduce ? 0 : 320);
    if (had) { var z = (X.route && X.route.next('circuit')) || X.$('t-next'); if (z && z.getClientRects().length) z.focus({ preventScroll: true }); }
  }

  /* ---------- the first moment ---------- */
  var firstOn = false;
  function startFirst(now) {
    var f = D.first; if (!f || firstOn) return false;
    now = now === true;
    /* round 5b: on a first visit the Circuit's opening (v2/opening.js) plays first; the first line follows it, and the controls the
       opening has just settled are not hidden again */
    if (!now && X.opening && X.opening.wait('circuit', startFirst)) return false;
    /* first-visit welcome (18 Nov): while the welcome holds the bare map, the line waits; v2/welcome.js brings it in at the tour's
       third stop, or with everything else (startFirst(true): at once, nothing hidden, whatever the address and the old key say) */
    if (!now && root.classList.contains('wl-stage')) return false;
    if (!now && (U.stGet(KEY.first) === 'off' || X.deep)) return false;
    if (X.view !== 'map' || X.step !== 0 || X.intro) return false;
    firstOn = true;
    var still = X.reduce || now, after = now || !!(X.opening && X.opening.ran === 'circuit');
    if (!still && !after) root.classList.add('isx-quiet');
    X.highlight(function (fl) { return fl.to === 'NYC' && fl.from !== 'PLAT' && fl.from !== 'DC'; });
    var aim = function () { var g = X.globe; if (!g || !firstOn) return false; try { g.pointOfView({ lat: f.pov[0], lng: f.pov[1], altitude: f.pov[2] }, still ? 0 : 1600); } catch (e) { /* ignore */ } return true; };
    if (!aim()) { var n = 0, t = setInterval(function () { if (aim() || ++n > 20) clearInterval(t); }, 400); }
    var card = function () { if (firstOn) show({ first: true, k: f.k, t: f.t, src: f.src, go: f.go }); };
    if (now) card(); else setTimeout(card, still ? 0 : after ? 500 : 900);
    /* the controls settle in on the first touch or key, or after a few seconds on their own */
    var wake = function () { settle(); };
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, wake, { once: true, passive: true, capture: true }); });
    if (!after) quietT = setTimeout(settle, 4200);
    X.on('step', function () { if (firstOn && X.step !== 0) { if (cur && cur.first) close(false); else endFirst(false); } });
    X.on('view', function () { if (firstOn && X.view !== 'map') { if (cur && cur.first) close(false); else endFirst(false); } });
    X.on('select', function () { if (firstOn && X.sel.iso) { if (cur && cur.first) close(false); else endFirst(false); } });
    if (!now) setTimeout(function () { if (firstOn && cur && cur.first) close(false); }, 26000);
    return true;
  }
  function settle() { clearTimeout(quietT); if (!root.classList.contains('isx-quiet')) return; root.classList.remove('isx-quiet'); root.classList.add('isx-settle'); setTimeout(function () { root.classList.remove('isx-settle'); }, 1400); }
  function endFirst() {
    if (!firstOn) return; firstOn = false;
    settle(); U.stSet(KEY.first, 'off');
    X.highlight(null);
  }

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
    var r = document.createElement('div'); r.className = 'lr nu'; r.title = 'A broken track or a ◇ marks a figure to read with care. Open the country for the note.'; r.innerHTML = '<i class="arc care"></i><span>◇ Read with care</span>';
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
  X.load('insights').then(function (d) {
    D.first = null; D.notes = d.notes || {};
    if (X.view === 'map') { X.renderGlobe(false); X.recard(); X.emit('narr'); }
    loaded = true; if (wantNow) { wantNow = false; startFirst(true); } else startFirst();
  }).catch(function () { /* without the data the map simply shows no insights */ });
  /* first-visit welcome (18 Nov): the tour's third stop brings in the first line; if the data is not in yet, it comes when it is */
  var loaded = false, wantNow = false;
  X.insight = { first: function () { if (!loaded) { wantNow = true; return false; } return startFirst(true); }, get card() { return box && !box.hidden && box.classList.contains('in') ? box : null; }, get firstOn() { return firstOn; } };
})();
