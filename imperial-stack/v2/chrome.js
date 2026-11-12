/* The Imperial Stack v2 · chrome.js
   The Circuit's chrome, opened up. Everything that is not the map, the card or the step bar moves into two trays that
   open from the header: “Firms” (the mapped footprints, one click from the globe) and “Layers” (what the colours show,
   China's bloc, insights, the tour). The legend becomes a small box of its own that folds. Nothing is removed:
   the controls are the page's own elements, moved, so their behaviour and state stay where they were.
   Storage: isx-leg (the legend, 'shut' when folded). */
(function () {
  'use strict';
  var X = window.ISX; if (!X) return;
  var U = X.util, root = X.root, $ = X.$, frame = $('frame'), tgl = $('tgl'), mm = $('mapmodes'), scene = $('scene-map');
  if (!frame || !tgl || !mm || !scene) return;
  root.classList.add('air');

  /* ---------- the two pills, where the header toggles were ---------- */
  var LAYERS_IC = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>';
  var pills = document.createElement('div');
  pills.className = 'trays2'; pills.id = 'isx-trays'; pills.setAttribute('role', 'group'); pills.setAttribute('aria-label', 'Firms and map layers');
  pills.innerHTML = '<button type="button" class="tp tp-firms" id="isx-tp-firms" data-tray="firms" aria-expanded="false" aria-controls="isx-tray-firms"><i aria-hidden="true"></i><span>Firms</span><small>who owns what</small></button>'
    + '<button type="button" class="tp tp-layers" id="isx-tp-layers" data-tray="layers" aria-expanded="false" aria-controls="isx-tray-layers">' + LAYERS_IC + '<span>Layers</span></button>';
  var tray = function (id, label) { var d = document.createElement('div'); d.className = 'tray2'; d.id = 'isx-tray-' + id; d.hidden = true; d.setAttribute('role', 'group'); d.setAttribute('aria-label', label); frame.appendChild(d); return d; };
  var TF = tray('firms', 'Firms with a mapped footprint'), TL = tray('layers', 'Map layers and help');

  /* layers: the map modes (with the insights switch and the hint), then the two toggles from the header */
  var waico = $('waico'), min = $('min');
  TL.innerHTML = '<div class="t2h"><b>Layers</b><button type="button" class="t2x" data-tray="close" aria-label="Close">×</button></div><div class="t2b" id="isx-tl-modes"></div><div class="t2s" id="isx-tl-tog"><div class="t2k">Also on the map</div></div>';
  TL.querySelector('#isx-tl-modes').appendChild(mm);
  var tog = TL.querySelector('#isx-tl-tog'); if (waico) tog.appendChild(waico); if (min) tog.appendChild(min);
  tgl.appendChild(pills);

  /* firms: the mapped ones, grouped by where they sit */
  var GROUPS = [['nl', 'Dutch cluster'], ['as', 'Asia'], ['us', 'United States']];
  function groupOf(o) { var iso = o.seat.iso; return iso === 'NLD' ? 'nl' : iso === 'USA' ? 'us' : 'as'; }
  function fillFirms() {
    var OWN = X.own && X.own.data, F = X.data.FIRMS;
    if (!OWN) { TF.innerHTML = '<div class="t2h"><b>Firms</b><button type="button" class="t2x" data-tray="close" aria-label="Close">×</button></div><p class="t2p">Loading the footprints.</p>'; return false; }
    var names = Object.keys(OWN.firms), sel = X.sel.firm ? X.sel.firm.name : '';
    var chip = function (n) {
      var f = F.filter(function (x) { return x.name === n; })[0]; if (!f) return '';
      var o = OWN.firms[n], fl = X.data.FLAG[f.cc];
      return '<button type="button" class="t2f' + (n === sel ? ' on' : '') + '" data-firm="' + U.esc(n) + '" title="' + U.esc(o.summary || '') + '">' + (fl ? '<img src="' + fl + '" alt="">' : '') + '<b>' + U.esc(n) + '</b><small>' + U.esc(o.seat.city.replace(/,.*$/, '')) + '</small></button>';
    };
    TF.innerHTML = '<div class="t2h"><b>Firms</b><span>' + names.length + ' footprints</span><button type="button" class="t2x" data-tray="close" aria-label="Close">×</button></div>'
      + '<p class="t2p">Pick a firm to see who owns it and where it builds, on the globe.</p>'
      + GROUPS.map(function (g) { var l = names.filter(function (n) { return groupOf(OWN.firms[n]) === g[0]; }); return l.length ? '<div class="t2g"><div class="t2k">' + g[1] + '</div><div class="t2fs">' + l.map(chip).join('') + '</div></div>' : ''; }).join('')
      + '<div class="t2key"><span><i class="ownk seat"></i>Seat</span><span><i class="ownk site r-fab"></i>Sites</span><span><i class="ownk holder"></i>Owners</span></div>'
      + '<button type="button" class="t2all" data-tray="allfirms">All ' + F.length + ' firms in the stack <span aria-hidden="true">↓</span></button>';
    return true;
  }

  /* ---------- open and close ---------- */
  var open = null;
  function setOpen(id, focus) {
    if (open === id) id = null;
    open = id;
    [['firms', TF], ['layers', TL]].forEach(function (p) {
      var on = p[0] === id, b = $('tp-' + p[0]);
      p[1].hidden = !on; b.setAttribute('aria-expanded', String(on));
    });
    root.classList.toggle('tray-open', !!id);
    if (id === 'firms') fillFirms();
    if (id && focus) { var t = (id === 'firms' ? TF : TL).querySelector('.t2f.on, .t2f, .mm[aria-pressed="true"], button:not(.t2x)'); if (t) t.focus({ preventScroll: true }); }
    X.emit('tray', id);
  }
  X.tray = { open: function (id) { if (open !== id) setOpen(id); }, close: function () { if (open) setOpen(null); }, get which() { return open; } };
  pills.addEventListener('click', function (e) { var b = e.target.closest('[data-tray]'); if (b) setOpen(b.dataset.tray, e.detail === 0); });
  [TF, TL].forEach(function (T) {
    T.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.tray === 'close') { var was = open; setOpen(null); $('tp-' + was).focus({ preventScroll: true }); }
      else if (b.dataset.firm) {
        var f = X.data.FIRMS.filter(function (x) { return x.name === b.dataset.firm; })[0];
        if (f) { X.stopPlay(); X.select(f.iso, f); setOpen(null); var c = $('tournarr'); if (c) c.classList.remove('folded'); }
      }
      else if (b.dataset.tray === 'allfirms') { setOpen(null); var box = $('firmsbox'), fold = box && box.querySelector(':scope > .fold6'); if (fold && fold.getAttribute('aria-expanded') === 'false') fold.click(); if (box) U.crisp(box, 16); }
      else if (b.hasAttribute('data-tips')) setOpen(null);   /* the tour opens: the tray steps aside */
    });
    T.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); var was = open; setOpen(null); if (was) $('tp-' + was).focus({ preventScroll: true }); } });
  });
  document.addEventListener('pointerdown', function (e) { if (open && !e.target.closest('.tray2, .trays2, .tour2')) setOpen(null); }, true);
  X.on('view', function () { if (open) setOpen(null); });
  X.on('select', function () { if (open === 'firms') fillFirms(); syncPill(); });
  /* the pill says which footprint is open */
  function syncPill() {
    var f = X.sel.firm, on = !!(f && X.own && X.own.has(f)), b = $('tp-firms');
    b.classList.toggle('on', on); b.querySelector('small').textContent = on ? f.name : 'who owns what';
  }

  /* ---------- the legend: a box of its own, low on the right, that folds ---------- */
  var lb = document.createElement('div'); lb.className = 'legbox2'; lb.id = 'isx-legbox';
  lb.innerHTML = '<button type="button" class="lgt" id="isx-legtog" aria-expanded="true" aria-controls="isx-leg6"><span>Legend</span><i aria-hidden="true"></i></button>';
  scene.appendChild(lb);
  var shut = U.stGet('isx-leg') === 'shut';
  function legSync() { lb.classList.toggle('shut', shut); $('legtog').setAttribute('aria-expanded', String(!shut)); }
  $('legtog').addEventListener('click', function () { shut = !shut; U.stSet('isx-leg', shut ? 'shut' : null); legSync(); });
  function legHome() { var L = $('leg6'); if (L && L.parentNode !== lb) lb.appendChild(L); lb.hidden = !L || X.view !== 'map'; }
  X.on('narr', legHome); X.on('view', legHome);
  legSync(); legHome();

  /* ---------- the card: one row of actions ---------- */
  var how = root.querySelector('#isx-tournarr .tmeta .howc'), nav = root.querySelector('#isx-tournarr .tnav');
  if (how && nav) nav.appendChild(how);

  if (X.own && !X.own.data) X.load('ownership').then(function () { setTimeout(function () { if (open === 'firms') fillFirms(); }, 60); }).catch(function () { /* the tray says so */ });
  syncPill();
})();
