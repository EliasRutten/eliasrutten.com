/* The Imperial Stack v2 · strip.js
   One control strip across the top. The four tabs become connected segments of one rounded bar; what belongs to the
   open tab sits in the same bar, after a hairline: Firms and Layers on the Circuit, Machine and Revenue map on the Arm,
   The plumbing and The capital stack in the Simulator. A lit marker slides under the open tab (it cuts under reduced
   motion). Colour follows the page's language: gold for what is in focus and for dollars, cyan for structure,
   white for rules, purple for ownership.
   Nothing is rebuilt: the tab buttons, the pills and the Arm switch are the page's own elements, moved into the bar,
   so their behaviour, their ids and the checks that use them stay as they were. */
(function () {
  'use strict';
  var X = window.ISX; if (!X) return;
  var root = X.root, $ = X.$, hud = root.querySelector('.hud-top'), seg = hud && hud.querySelector('.seg'), tgl = $('tgl'), msw = $('mswitch');
  if (!hud || !seg) return;

  var HUE = { map: '#ffb547', arm: '#44d7ec', fin: '#ffd27a', story: '#e4ebf1', chain: '#e4ebf1' };
  var strip = document.createElement('div');
  strip.className = 'strip3'; strip.id = 'isx-strip';
  hud.insertBefore(strip, seg);
  strip.appendChild(seg);
  var ind = document.createElement('i'); ind.className = 'st-ind'; ind.setAttribute('aria-hidden', 'true'); seg.insertBefore(ind, seg.firstChild);
  var div = document.createElement('span'); div.className = 'st-div'; div.setAttribute('aria-hidden', 'true'); strip.appendChild(div);
  var ctx = document.createElement('div'); ctx.className = 'st-ctx'; ctx.id = 'isx-st-ctx'; strip.appendChild(ctx);
  if (tgl) ctx.appendChild(tgl);
  if (msw) ctx.appendChild(msw);

  /* the Simulator's two views, in the bar (the switch on the stage stays for phones and for the capital stack's own header) */
  var fin = document.createElement('div');
  fin.className = 'st-fin'; fin.id = 'isx-st-fin'; fin.hidden = true; fin.setAttribute('role', 'group'); fin.setAttribute('aria-label', 'Simulator view');
  fin.innerHTML = '<button type="button" data-stfin="plumb" aria-pressed="true">The plumbing</button><button type="button" data-stfin="stack" aria-pressed="false">The capital stack</button>';
  ctx.appendChild(fin);
  fin.addEventListener('click', function (e) { var b = e.target.closest('[data-stfin]'); if (b && X.setFin) X.setFin(b.dataset.stfin); });

  function place(cut) {
    var b = seg.querySelector('button[aria-pressed="true"]');
    if (!b || !b.getClientRects().length) { ind.style.opacity = '0'; return; }
    var s = seg.getBoundingClientRect(), r = b.getBoundingClientRect();
    if (cut) ind.classList.add('cut');
    ind.style.opacity = '1';
    ind.style.transform = 'translateX(' + (r.left - s.left).toFixed(1) + 'px)';
    ind.style.width = r.width.toFixed(1) + 'px';
    if (cut) { void ind.offsetWidth; ind.classList.remove('cut'); }
  }
  function sync(cut) {
    var v = X.view;
    strip.style.setProperty('--vh', HUE[v] || HUE.map);
    strip.dataset.v = v;
    fin.hidden = v !== 'fin';
    [].forEach.call(fin.querySelectorAll('[data-stfin]'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.stfin === X.finMode)); });
    var has = (v === 'map' && tgl && !tgl.hidden) || (v === 'arm' && msw && !msw.hidden) || v === 'fin';
    strip.classList.toggle('no-ctx', !has);
    place(cut === true);
  }
  X.on('view', function () { sync(false); });
  X.on('fin', function () { sync(false); });
  var rt = 0;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { place(true); }, 80); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { place(true); });
  /* ---------- the Circuit's right edge: zoom above the legend, both on the frame's margin ---------- */
  var scene = $('scene-map'), zoom = $('zoom'), leg = $('legbox');
  if (scene && zoom && leg) {
    var edge = document.createElement('div'); edge.className = 'edge3'; edge.id = 'isx-edge';
    scene.appendChild(edge); edge.appendChild(zoom); edge.appendChild(leg);
    root.classList.add('edge-on');
  }
  root.classList.add('strip-on');
  sync(true);
  setTimeout(function () { place(true); }, 400);
  X.strip = { sync: sync };
})();
