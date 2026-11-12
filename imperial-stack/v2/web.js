/* The Imperial Stack v2 · web.js
   The ownership web: every mapped firm, its owners above the reporting threshold and the countries it builds in,
   drawn at once. Its job is density: how many lines meet in a few owners, and how far a firm's sites reach.
   The explanation stays with the focused view: pick a firm here and the card gives its owners and sites, and one
   button opens its footprint on the globe.
   Everything drawn comes from data/ownership.json; nothing is added. data/company-sheets.json holds the empty sheets
   the firm layer will fill later (overlaps, concentration by nationality, revenue, profit and capex) and the firms
   that are named but not yet mapped. Opened from the Firms tray. Esc or “Back to the globe” closes it. */
(function () {
  'use strict';
  var X = window.ISX; if (!X) return;
  var U = X.util, root = X.root, $ = X.$, frame = $('frame'); if (!frame) return;
  var NS = 'http://www.w3.org/2000/svg', OWN = null, SH = null, host = null, M = null, sel = null, lastFocus = null;
  var W = 1000, H = 720, CX = 500, CY = 362, RF = 212, RH = 150, RS = 296;
  var GROUPS = [['nl', 'Dutch cluster'], ['as', 'Asia'], ['us', 'United States'], ['out', 'Outside Pax Silica']];
  var CONTROL = { none: 'No controlling owner', controlled: 'Controlled within a group', state: 'State among the largest holders', founder: 'Controlled by its founder', led: 'Founder is the largest holder', disputed: 'Control disputed', unmapped: 'Owners not yet mapped' };
  var cname = function (iso) { return iso === 'USA' ? 'United States' : (X.data.CTY[iso] ? X.data.CTY[iso].name : iso); };
  var esc = U.esc, rad = function (d) { return d * Math.PI / 180; };
  var pt = function (r, a) { return [CX + r * Math.cos(rad(a)), CY + r * Math.sin(rad(a))]; };
  var groupOf = function (o) { var iso = o.seat.iso; return iso === 'NLD' ? 'nl' : iso === 'USA' ? 'us' : 'as'; };
  var plural = function (n, w, ws) { return n + ' ' + (n === 1 ? w : ws || w + 's'); };

  /* ---------- the model: firms on a ring, owners inside it, countries of operation outside ---------- */
  function model() {
    var firms = [], byName = {}, slot = 0;
    var out = ((SH && SH.firms) || []).filter(function (f) { return f.status === 'not yet mapped'; }).map(function (f) { return f.name; });
    GROUPS.forEach(function (g) {
      g.a0 = g.a1 = null;
      var list = g[0] === 'out' ? out : Object.keys(OWN.firms).filter(function (n) { return groupOf(OWN.firms[n]) === g[0]; });
      if (!list.length) return;
      slot += .8;
      var first = slot;
      list.forEach(function (n) { var f = { id: 'f:' + n, kind: 'firm', name: n, g: g[0], o: OWN.firms[n] || null, slot: slot, links: [] }; firms.push(f); byName[n] = f; slot += 1; });
      g.a0 = first; g.a1 = slot - 1;
    });
    var total = slot;
    firms.forEach(function (f) { f.a = -90 + (f.slot / total) * 360; f.p = pt(RF, f.a); });
    var arcs = GROUPS.filter(function (g) { return g.a0 != null; }).map(function (g) { return { k: g[0], t: g[1], a0: -90 + ((g.a0 - .35) / total) * 360, a1: -90 + ((g.a1 + .35) / total) * 360 }; });
    /* owners: one node per name; an owner that is itself a firm on the ring is drawn as a line between the two firms */
    var holders = {}, links = [], firmOf = function (n) { return byName[n] || byName[n.replace(/ Technology$/, '')] || null; };
    firms.forEach(function (f) {
      if (!f.o) return;
      (f.o.holders || []).forEach(function (h) {
        var src = firmOf(h.name), bad = f.o.control === 'disputed';
        if (src) { links.push({ kind: 'own', a: src, b: f, pct: h.pct, txt: h.txt, date: h.date, bad: bad }); src.links.push(f.id); f.links.push(src.id); return; }
        var hn = holders[h.name] || (holders[h.name] = { id: 'h:' + h.name, kind: 'holder', name: h.name, iso: h.iso, holds: [], links: [] });
        hn.holds.push({ f: f, pct: h.pct, txt: h.txt, date: h.date });
        links.push({ kind: 'own', a: hn, b: f, pct: h.pct, txt: h.txt, date: h.date, bad: bad }); hn.links.push(f.id); f.links.push(hn.id);
      });
    });
    var hl = Object.keys(holders).map(function (k) { return holders[k]; });
    var singles = {};
    hl.forEach(function (h) {
      if (h.holds.length > 1) { var sx = 0, sy = 0; h.holds.forEach(function (x) { sx += x.f.p[0] - CX; sy += x.f.p[1] - CY; }); h.p = [CX + sx / h.holds.length * .6, CY + sy / h.holds.length * .6]; }
      else { var f = h.holds[0].f; (singles[f.name] = singles[f.name] || []).push(h); }
    });
    Object.keys(singles).forEach(function (n) { var l = singles[n], f = byName[n]; l.forEach(function (h, j) { h.p = pt(RH - (j % 2) * 20, f.a + (j - (l.length - 1) / 2) * 8.5); }); });
    /* nudge owners apart so their marks do not sit on one another */
    for (var it = 0; it < 60; it++) for (var i = 0; i < hl.length; i++) for (var j = i + 1; j < hl.length; j++) {
      var a = hl[i], b = hl[j], dx = b.p[0] - a.p[0], dy = b.p[1] - a.p[1], d = Math.hypot(dx, dy) || .01, min = 30;
      if (d < min) { var k = (min - d) / d / 2; a.p = [a.p[0] - dx * k, a.p[1] - dy * k]; b.p = [b.p[0] + dx * k, b.p[1] + dy * k]; }
    }
    /* countries of operation: around the outside, in the order of the firms that build there */
    var cs = {};
    firms.forEach(function (f) { if (!f.o) return; (f.o.sites || []).forEach(function (s) { var c = cs[s.iso] || (cs[s.iso] = { id: 'c:' + s.iso, kind: 'country', iso: s.iso, name: cname(s.iso), firms: {}, links: [] }); c.firms[f.name] = (c.firms[f.name] || 0) + 1; }); });
    var cl = Object.keys(cs).map(function (k) { return cs[k]; });
    cl.forEach(function (c) { var sx = 0, sy = 0; Object.keys(c.firms).forEach(function (n) { var f = byName[n], w = c.firms[n]; sx += Math.cos(rad(f.a)) * w; sy += Math.sin(rad(f.a)) * w; }); c.m = Math.atan2(sy, sx) * 180 / Math.PI; });
    cl.sort(function (a, b) { return ((a.m + 450) % 360) - ((b.m + 450) % 360); });
    cl.forEach(function (c, i) { c.a = -90 + ((i + .5) / cl.length) * 360; c.p = pt(RS, c.a); Object.keys(c.firms).forEach(function (n) { var f = byName[n]; links.push({ kind: 'site', a: f, b: c, n: c.firms[n] }); f.links.push(c.id); c.links.push(f.id); }); });
    var nodes = {}; firms.concat(hl, cl).forEach(function (n) { nodes[n.id] = n; });
    return { firms: firms, holders: hl, countries: cl, links: links, nodes: nodes, arcs: arcs, mapped: firms.filter(function (f) { return !!f.o; }).length };
  }

  /* ---------- drawing ---------- */
  function svgEl(tag, at, parent) { var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); if (parent) parent.appendChild(e); return e; }
  function curve(a, b, pull) { var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, c = [mx + (CX - mx) * pull, my + (CY - my) * pull]; return 'M' + a[0].toFixed(1) + ',' + a[1].toFixed(1) + ' Q' + c[0].toFixed(1) + ',' + c[1].toFixed(1) + ' ' + b[0].toFixed(1) + ',' + b[1].toFixed(1); }
  function arcPath(r, a0, a1) { var p0 = pt(r, a0), p1 = pt(r, a1); return 'M' + p0[0].toFixed(1) + ',' + p0[1].toFixed(1) + ' A' + r + ',' + r + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + p1[0].toFixed(1) + ',' + p1[1].toFixed(1); }
  function label(g, p, a, r, text, cls) {
    var q = pt(r, a), c = Math.cos(rad(a)), anchor = Math.abs(c) < .28 ? 'middle' : c > 0 ? 'start' : 'end', s = Math.sin(rad(a));
    var t = svgEl('text', { x: q[0].toFixed(1), y: (q[1] + (anchor === 'middle' ? (s > 0 ? 9 : -2) : 3.5)).toFixed(1), 'text-anchor': anchor, 'class': cls }, g); t.textContent = text; return t;
  }
  function draw() {
    var svg = host.querySelector('svg'); svg.innerHTML = '';
    var gl = svgEl('g', { 'class': 'wl' }, svg), ga = svgEl('g', { 'class': 'wa' }, svg), gn = svgEl('g', { 'class': 'wn' }, svg);
    svgEl('circle', { cx: CX, cy: CY, r: RF, 'class': 'wring' }, ga);
    svgEl('circle', { cx: CX, cy: CY, r: RS, 'class': 'wring out' }, ga);
    M.arcs.forEach(function (A) {
      svgEl('path', { d: arcPath(RF + 13, A.a0, A.a1), 'class': 'warc g-' + A.k }, ga);
      var id = 'isx-warc-' + A.k, mid = (A.a0 + A.a1) / 2, flip = Math.sin(rad(mid)) > .2;
      svgEl('path', { id: id, d: flip ? 'M' + pt(RF + 29, A.a1).map(function (v) { return v.toFixed(1); }).join(',') + ' A' + (RF + 29) + ',' + (RF + 29) + ' 0 ' + (A.a1 - A.a0 > 180 ? 1 : 0) + ' 0 ' + pt(RF + 29, A.a0).map(function (v) { return v.toFixed(1); }).join(',') : arcPath(RF + 21, A.a0, A.a1), fill: 'none' }, ga);
      var t = svgEl('text', { 'class': 'warct g-' + A.k }, ga), tp = svgEl('textPath', { href: '#' + id, startOffset: '50%', 'text-anchor': 'middle' }, t); tp.textContent = A.t.toUpperCase();
    });
    M.links.forEach(function (L, i) {
      var p = svgEl('path', { d: curve(L.a.p, L.b.p, L.kind === 'site' ? -.06 : (L.a.kind === 'firm' ? .55 : .12)), 'class': 'wk ' + L.kind + (L.bad ? ' bad' : ''), 'data-a': L.a.id, 'data-b': L.b.id }, gl);
      p.style.strokeWidth = (L.kind === 'site' ? .5 + Math.min(4, L.n) * .32 : L.bad ? 2.2 : .9 + Math.sqrt(Math.min(100, L.pct || 1)) * .52).toFixed(2);
    });
    var node = function (n, cls, name) {
      var g = svgEl('g', { 'class': 'wnode ' + cls, 'data-id': n.id, role: 'button', tabindex: '0', 'aria-label': name }, gn); return g;
    };
    M.countries.forEach(function (c) {
      var nf = Object.keys(c.firms).length, g = node(c, 'country', c.name + ': ' + plural(nf, 'firm') + ' operate here');
      svgEl('rect', { x: (c.p[0] - 4.5).toFixed(1), y: (c.p[1] - 4.5).toFixed(1), width: 9, height: 9, rx: 2, 'class': 'wm' }, g);
      label(g, c.p, c.a, RS + 12, c.name, 'wt');
    });
    M.holders.forEach(function (h) {
      var shown = h.name.replace(/, founder$/, '').replace(/^Depositary receipts, New York$/, 'New York receipts').replace(/^National Development Fund, Executive Yuan$/, 'National Development Fund').replace(/^Government of Singapore \(GIC\)$/, 'GIC') + (h.holds.length > 1 ? ' · ' + h.holds.length : '');
      var g = node(h, 'holder' + (h.holds.length > 1 ? ' multi' : ''), shown + ': ' + (shown === h.name ? '' : h.name + ', ') + 'head office in ' + cname(h.iso) + ', holds ' + plural(h.holds.length, 'firm'));
      svgEl('circle', { cx: h.p[0].toFixed(1), cy: h.p[1].toFixed(1), r: (3.6 + Math.min(8, h.holds.length) * 1.15).toFixed(1), 'class': 'wm' }, g);
      var t = svgEl('text', { x: h.p[0].toFixed(1), y: (h.p[1] - 8 - Math.min(8, h.holds.length) * 1.15).toFixed(1), 'text-anchor': 'middle', 'class': 'wt' }, g);
      t.textContent = shown;
    });
    M.firms.forEach(function (f) {
      var g = node(f, 'firm g-' + f.g + (f.o ? '' : ' un') + (f.o && f.o.control === 'disputed' ? ' bad' : ''), f.name + (f.o ? ': ' + (CONTROL[f.o.control] || '') : ': not yet mapped'));
      svgEl('circle', { cx: f.p[0].toFixed(1), cy: f.p[1].toFixed(1), r: 8.5, 'class': 'wm' }, g);
      if (f.o) svgEl('circle', { cx: f.p[0].toFixed(1), cy: f.p[1].toFixed(1), r: 3, 'class': 'wd' }, g);
      label(g, f.p, f.a, RF + 42, f.name, 'wt');
    });
    mark();
  }
  function mark() {
    var svg = host.querySelector('svg'), n = sel && M.nodes[sel], near = {};
    if (n) { near[n.id] = 1; n.links.forEach(function (id) { near[id] = 1; }); }
    svg.classList.toggle('hl', !!n);
    [].forEach.call(svg.querySelectorAll('.wnode'), function (g) { g.classList.toggle('on', !!near[g.dataset.id]); g.classList.toggle('sel', g.dataset.id === sel); g.setAttribute('aria-pressed', String(g.dataset.id === sel)); });
    [].forEach.call(svg.querySelectorAll('.wk'), function (p) { p.classList.toggle('on', !!n && (p.dataset.a === sel || p.dataset.b === sel)); });
  }

  /* ---------- the card ---------- */
  function sheetsHTML() {
    if (!SH) return '';
    var un = SH.firms.filter(function (f) { return f.status === 'not yet mapped'; }).map(function (f) { return f.name; });
    return '<div class="wsh"><div class="wk3">Data sheets <span>structure ready, not yet filled</span></div>'
      + SH.sheets.map(function (s) { return '<div class="wsr" tabindex="0" data-tip="<b>' + esc(s.title) + '</b><p>' + esc(s.what) + '</p><p class=\'ts\'>Columns: ' + esc(s.columns.join(', ').replace(/_/g, ' ')) + '</p>"><b>' + esc(s.title) + '</b><span>' + s.columns.length + ' columns · ' + plural(s.rows.length, 'row') + '</span></div>'; }).join('')
      + (un.length ? '<p class="wnote">Named, not yet mapped: ' + esc(un.join(', ')) + '. They sit on the ring as empty marks.</p>' : '') + '</div>';
  }
  function card() {
    var c = host.querySelector('.wcard'), n = sel && M.nodes[sel], h = '';
    if (!n) {
      var multi = M.holders.filter(function (x) { return x.holds.length > 1; }).sort(function (a, b) { return b.holds.length - a.holds.length; });
      var seats = {}; M.holders.forEach(function (x) { seats[x.iso] = (seats[x.iso] || 0) + 1; });
      var sl = Object.keys(seats).sort(function (a, b) { return seats[b] - seats[a]; });
      h = '<div class="wk3">Firms · the ownership web</div><h3>Who owns the stack, at once</h3>'
        + '<p>' + M.mapped + ' firms, ' + plural(M.holders.length, 'owner') + ' above the reporting threshold and ' + plural(M.countries.length, 'country', 'countries') + ' of operation. Purple lines are stakes, thicker for larger ones; white lines run to where a firm builds.</p>'
        + '<div class="wfacts">' + multi.slice(0, 4).map(function (x) { return '<button type="button" class="wf" data-web="' + esc(x.id) + '"><b>' + x.holds.length + '</b><span>' + esc(x.name) + '</span></button>'; }).join('') + '</div>'
        + '<div class="wk3 sub">Owners shown, by head office</div><div class="wseat">' + sl.map(function (iso) { return '<span><b>' + seats[iso] + '</b>' + esc(cname(iso)) + '</span>'; }).join('') + '</div>'
        + '<p class="wnote">A head office is not where the money comes from: index-fund managers hold for savers worldwide. Pick any mark for its lines; pick a firm for its owners and sites.</p>'
        + sheetsHTML();
    } else if (n.kind === 'firm') {
      var o = n.o;
      if (!o) h = '<div class="wk3">Outside Pax Silica</div><h3>' + esc(n.name) + '</h3><p>Not yet mapped. The firm has a row in the data sheets and nothing in it: no owners, sites or figures have been researched.</p>';
      else {
        var by = {}; (o.sites || []).forEach(function (s) { by[s.iso] = (by[s.iso] || 0) + 1; });
        h = '<div class="wk3' + (o.control === 'disputed' ? ' bad' : '') + '">' + esc(CONTROL[o.control] || '') + '</div><h3>' + esc(n.name) + '</h3><p>' + esc(o.summary || '') + '</p>'
          + '<div class="wk3 sub">Owners above the threshold</div>' + ((o.holders || []).length ? '<ul class="wlist">' + o.holders.map(function (x) { return '<li><b>' + esc(x.name) + '</b><span>' + esc(x.txt || '') + ' · ' + esc(cname(x.iso)) + (x.date ? ' · ' + esc(x.date) : '') + '</span></li>'; }).join('') + '</ul>' : '<p class="wnote">Not yet mapped.</p>')
          + '<div class="wk3 sub">Operates in</div>' + (Object.keys(by).length ? '<div class="wseat">' + Object.keys(by).map(function (iso) { return '<span><b>' + by[iso] + '</b>' + esc(cname(iso)) + '</span>'; }).join('') + '</div>' : '<p class="wnote">Sites not yet mapped.</p>')
          + '<button type="button" class="wgo" data-web="globe">Open its footprint on the globe <span aria-hidden="true">→</span></button>';
      }
    } else if (n.kind === 'holder') {
      h = '<div class="wk3">Owner · head office in ' + esc(cname(n.iso)) + '</div><h3>' + esc(n.name) + '</h3><p>Holds ' + (n.holds.length === 1 ? 'one firm' : n.holds.length + ' firms') + ' of the ' + M.mapped + ' mapped, above the reporting threshold.</p>'
        + '<ul class="wlist">' + n.holds.map(function (x) { return '<li><button type="button" class="wlk" data-web="' + esc(x.f.id) + '">' + esc(x.f.name) + '</button><span>' + esc(x.txt || '') + (x.date ? ' · ' + esc(x.date) : '') + '</span></li>'; }).join('') + '</ul>';
    } else {
      h = '<div class="wk3">Country of operation</div><h3>' + esc(n.name) + '</h3><p>' + plural(Object.keys(n.firms).length, 'firm') + ' of the ' + M.mapped + ' mapped have sites here that the sources name. The lists of sites are not complete.</p>'
        + '<ul class="wlist">' + Object.keys(n.firms).map(function (f) { return '<li><button type="button" class="wlk" data-web="f:' + esc(f) + '">' + esc(f) + '</button><span>' + plural(n.firms[f], 'site') + '</span></li>'; }).join('') + '</ul>';
    }
    if (n) h += '<button type="button" class="wback" data-web="">Back to the whole web</button>';
    c.innerHTML = h + '<div class="wsrc">Ownership as of ' + esc(OWN.asof || '') + '. Sources: the firm cards on the globe.</div>';
    c.scrollTop = 0;
  }
  function pick(id) { sel = id && M.nodes[id] ? (sel === id ? null : id) : null; mark(); card(); }

  /* ---------- open and close ---------- */
  function ensure() {
    if (host) return;
    host = document.createElement('section'); host.className = 'web3'; host.id = 'isx-web3'; host.hidden = true; host.setAttribute('aria-label', 'The ownership web');
    host.innerHTML = '<aside class="wcard" aria-live="polite"></aside><div class="wstage"><svg viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="Firms on a ring, their owners inside it and the countries they operate in outside it"></svg>'
      + '<div class="wkey" aria-hidden="true"><span><i class="k-own"></i>Stake (thicker is larger)</span><span><i class="k-bad"></i>Control disputed</span><span><i class="k-site"></i>Operates in</span><span><i class="k-un"></i>Not yet mapped</span></div></div>'
      + '<button type="button" class="wclose" data-web="close"><span aria-hidden="true">←</span> Back to the globe</button>';
    frame.appendChild(host);
    host.addEventListener('click', function (e) {
      var t = e.target.closest('[data-web], .wnode'); if (!t) return;
      if (t.classList.contains('wnode')) { pick(t.dataset.id); return; }
      var k = t.dataset.web;
      if (k === 'close') close(true);
      else if (k === 'globe') { var n = M.nodes[sel], f = n && X.data.FIRMS.filter(function (x) { return x.name === n.name; })[0]; close(false); if (f) { X.stopPlay(); X.select(f.iso, f); } }
      else { sel = null; pick(k); var fb = host.querySelector('.wcard .wback, .wcard .wgo, .wcard button'); if (fb && e.detail === 0) fb.focus({ preventScroll: true }); }
    });
    host.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); if (sel) pick(null); else close(true); return; }
      var g = e.target.closest && e.target.closest('.wnode');
      if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(g.dataset.id); }
    });
  }
  function open() {
    if (X.view !== 'map') X.setView('map');
    ensure();
    lastFocus = document.activeElement;
    var go = function () {
      M = model(); sel = null; draw(); card();
      host.hidden = false; root.classList.add('web-on');
      try { if (X.globe) X.globe.pauseAnimation(); } catch (e) { /* ignore */ }
      var b = host.querySelector('.wclose'); if (b) b.focus({ preventScroll: true });
      X.emit('web', true);
    };
    var need = [];
    if (!OWN) need.push((X.own && X.own.data ? Promise.resolve(X.own.data) : X.load('ownership')).then(function (d) { OWN = d; }));
    if (!SH) need.push(X.load('company-sheets').then(function (d) { SH = d; }).catch(function () { SH = null; }));
    Promise.all(need).then(go).catch(function () { /* the tray keeps working without the web */ });
  }
  function close(refocus) {
    if (!host || host.hidden) return;
    host.hidden = true; root.classList.remove('web-on');
    try { if (X.globe && !document.hidden) X.globe.resumeAnimation(); } catch (e) { /* ignore */ }
    if (refocus) { var b = $('tp-firms') || lastFocus; if (b && b.focus) b.focus({ preventScroll: true }); }
    X.emit('web', false);
  }
  X.on('view', function () { close(false); });
  X.web = { open: open, close: close, get isOpen() { return !!host && !host.hidden; } };
})();
