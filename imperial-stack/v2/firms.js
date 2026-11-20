/* The Imperial Stack v2 · firms.js
   The firm web with profits and owners (the “Firms profitability view”): every firm of the AI supply chain on one ring,
   by layer; inside the ring, the holders its filings name. A firm's mark is sized by its latest full-year profit (a loss
   is an outline); a line's width is the profit attributed* to that holder; a holder's colour is its type.
   Dense on purpose, calm on demand: pick any mark, filter by layer, country or holder, or switch “Calm” on.
   attributed profit* = profit attributable to shareholders × the holder's printed stake, one level only: arithmetic on
   two dated figures, never an estimate of an undisclosed stake. Everything drawn comes from data/firms.json
   (tools/firms-data.py); the footprints stay with data/ownership.json and the globe.
   Opened from the Firms tray, the profit dollar's doors, a firm's card on the globe and #circuit/firms. */
(function () {
  'use strict';
  var X = window.ISX; if (!X) return;
  var U = X.util, root = X.root, $ = X.$, frame = $('frame'); if (!frame) return;
  var NS = 'http://www.w3.org/2000/svg', esc = U.esc, D = null, OWN = null, host = null, M = null, lastFocus = null, from = null;
  var S = { sel: null, calm: false, by: 'type', table: false, how: false, f: { L: '', fc: '', ht: '', hc: '' } };
  var W = 800, H = 800, CX = 400, CY = 400, RF = 262, RIM = 381;
  var TYPES = [['manager', 'Asset managers and funds'], ['founder', 'Founders, families and insiders'], ['state', 'States and state funds'],
    ['firm', 'Other firms and banks'], ['employees', 'Employees'], ['other', 'Foundations and unnamed groups'], ['pass', 'Nominees and depositaries']];
  var TNAME = {}; TYPES.forEach(function (t) { TNAME[t[0]] = t[1]; });
  var WHY = { PT: 'passes through to holders the filing does not name', DUP: 'the same shares as another row', CLS: 'a share of one class only',
    STALE: 'stale or zero holding', CONF: 'conflicts with the primary filing', AGG: 'a group, no named holder', HIST: 'superseded', NA: 'no percentage published' };
  var rad = function (d) { return d * Math.PI / 180; }, pt = function (r, a) { return [CX + r * Math.cos(rad(a)), CY + r * Math.sin(rad(a))]; };
  var plural = function (n, w, ws) { return n + ' ' + (n === 1 ? w : ws || w + 's'); };
  var fx = function (v) { return v.toFixed(1); };
  /* $m to words: $133.7bn, $905m; a loss reads “−$4.9bn” */
  function money(v) { if (v == null) return 'not published'; var a = Math.abs(v), s = a >= 1000 ? '$' + (a / 1000).toFixed(a >= 100000 ? 0 : 1) + 'bn' : '$' + (a >= 10 ? Math.round(a) : a.toFixed(1)) + 'm'; return (v < 0 ? '−' : '') + s; }
  var pc = function (p) { return p == null ? 'no percentage' : (p >= 10 ? p.toFixed(1) : p.toFixed(2)).replace(/\.?0+$/, '') + '%'; };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var day = function (d) { var m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(d || ''); return m ? (m[3] ? +m[3] + ' ' : '') + MON[+m[2] - 1] + ' ' + m[1] : d; };
  var stop = function (t) { return /[.!?)]$/.test(t) ? t : t + '.'; };
  var rOf = function (usd) { return usd == null ? 5 : 4 + 1.38 * Math.sqrt(Math.abs(usd) / 1000); };

  /* ---------- the model: firms and sector rows on the ring by layer, holders inside it ---------- */
  function model() {
    var firms = D.firms.map(function (f) { return { id: 'f:' + f.id, kind: 'firm', d: f, r: rOf(f.usd), links: [], rows: [], owns: [] }; }), byId = {};
    firms.forEach(function (f) { byId[f.d.id] = f; });
    var secs = D.sectors.map(function (s) { return { id: 's:' + s.id, kind: 'sector', d: s, r: 5, links: [] }; });
    var groups = D.layers.map(function (L, i) {
      return { i: i, L: L, items: firms.filter(function (f) { return f.d.L === i; }).sort(function (a, b) { return (b.d.usd == null ? -1e9 : b.d.usd) - (a.d.usd == null ? -1e9 : a.d.usd); }).concat(secs.filter(function (s) { return s.d.L === i; })) };
    }).filter(function (g) { return g.items.length; });
    var GAP = 15, total = 0;
    groups.forEach(function (g) { g.items.forEach(function (n) { n.w = n.kind === 'firm' ? Math.max(19, n.r * 2 + 6) : 44; total += n.w; }); total += GAP; });
    var k = 360 / total, a = -90 + GAP * k / 2;
    groups.forEach(function (g) { g.a0 = a; g.items.forEach(function (n) { n.a = a + n.w * k / 2; n.p = pt(RF, n.a); n.g = g.i; a += n.w * k; }); g.a1 = a; a += GAP * k; });
    /* holders: one node per holder; a holder that is itself a firm on the ring is a line between the two firms */
    var hs = {}, links = [], pair = {};
    D.holders.forEach(function (h) {
      var f = byId[h.f], n;
      if (h.m) { n = byId[h.m]; n.owns.push({ f: f, h: h }); }
      else { n = hs[h.k] || (hs[h.k] = { id: 'h:' + h.k, kind: 'holder', name: h.k, rows: [], links: [], att: 0, t: h.t, c: h.c }); n.rows.push({ f: f, h: h }); if (h.a) n.att += h.a; if (h.s === 'A' && n.s !== 'A') { n.t = h.t; n.c = h.c; n.s = 'A'; } if (h.hc) n.hc = 1; }
      f.rows.push({ h: h, node: n });
      var key = n.id + '>' + f.id, L = pair[key];
      if (!L) { L = pair[key] = { kind: h.m ? 'ff' : 'own', a: n, b: f, rows: [], att: null, t: h.m ? 'firm' : h.t, c: h.m ? n.d.home : h.c }; links.push(L); n.links.push(f.id); f.links.push(n.id); }
      L.rows.push(h); if (h.a != null) { L.att = (L.att || 0) + h.a; L.t = h.m ? 'firm' : h.t; L.c = h.m ? n.d.home : h.c; }
      if (h.s === 'A') L.ok = 1;
    });
    var hl = Object.keys(hs).map(function (q) { return hs[q]; }), singles = {};
    hl.forEach(function (h) {
      h.r = Math.min(12, 2.6 + .9 * Math.sqrt(Math.abs(h.att) / 1000)); h.n = h.links.length;
      if (h.n > 1) { var sx = 0, sy = 0; h.links.forEach(function (id) { var f = byId[id.slice(2)]; sx += f.p[0] - CX; sy += f.p[1] - CY; }); h.p = [CX + sx / h.n * .5, CY + sy / h.n * .5]; }
      else (singles[h.links[0]] = singles[h.links[0]] || []).push(h);
    });
    /* a firm's own holders: a comb of marks pointing inward from it, the largest stake nearest the firm */
    Object.keys(singles).forEach(function (id) {
      var f = byId[id.slice(2)], l = singles[id].sort(function (x, y) { return (y.rows[0].h.p || 0) - (x.rows[0].h.p || 0); }), n = l.length, cols = n > 3 ? Math.ceil(n / 4) : n;
      l.forEach(function (h, j) { var col = j % cols, row = Math.floor(j / cols); h.home = pt(RF - f.r - 19 - row * 13, f.a + (col - (cols - 1) / 2) * (n > 3 ? 2.5 : 3.4)); h.p = h.home.slice(); });
    });
    for (var it = 0; it < 50; it++) for (var i = 0; i < hl.length; i++) for (var j = i + 1; j < hl.length; j++) {
      var A = hl[i], B = hl[j], dx = B.p[0] - A.p[0], dy = B.p[1] - A.p[1], d = Math.hypot(dx, dy) || .01, min = A.r + B.r + (A.n > 1 || B.n > 1 ? 9 : 3);
      if (d < min) { var q = (min - d) / d / 2, wa = A.n > 1 ? 1 : .35, wb = B.n > 1 ? 1 : .35; A.p = [A.p[0] - dx * q * wa, A.p[1] - dy * q * wa]; B.p = [B.p[0] + dx * q * wb, B.p[1] + dy * q * wb]; }
    }
    /* the names that are always drawn (a holder of three firms or more) must not sit on one another */
    var lab = hl.filter(function (h) { return h.n > 2; });
    for (it = 0; it < 30; it++) for (i = 0; i < lab.length; i++) for (j = i + 1; j < lab.length; j++) {
      var P = lab[i], Q = lab[j], wx = (P.name.length + Q.name.length + 8) * 2.9, ddx = Math.abs(Q.p[0] - P.p[0]), ddy = Q.p[1] - P.p[1], need = 15 + P.r + Q.r;
      if (ddx < wx && Math.abs(ddy) < need) { var push = (need - Math.abs(ddy)) / 2 * (ddy < 0 ? -1 : 1); P.p[1] -= push; Q.p[1] += push; }
    }
    var nodes = {}; firms.concat(hl, secs).forEach(function (n) { nodes[n.id] = n; });
    return { firms: firms, holders: hl, secs: secs, groups: groups, links: links, nodes: nodes, byId: byId };
  }

  /* ---------- the filters and the sums ---------- */
  var firmOK = function (f) { return (S.f.L === '' || String(f.d.L) === S.f.L) && (!S.f.fc || f.d.home === S.f.fc); };
  var holdOK = function (L) { return (!S.f.ht || L.t === S.f.ht) && (!S.f.hc || L.c === S.f.hc); };
  var anyF = function () { return !!(S.f.L !== '' || S.f.fc || S.f.ht || S.f.hc); };
  function sums() {
    var base = M.firms.filter(function (f) { return firmOK(f) && f.d.usd > 0; }), P = 0, att = 0, by = {}, ok = {};
    base.forEach(function (f) { P += f.d.usd; ok[f.d.id] = 1; });
    D.holders.forEach(function (h) { if (!ok[h.f] || !(h.a > 0)) return; var k = S.by === 'type' ? (h.m ? 'firm' : h.t) : (h.m ? M.byId[h.m].d.home : h.c); by[k] = (by[k] || 0) + h.a; att += h.a; });
    var rows = Object.keys(by).map(function (k) { return { k: k, v: by[k] }; }).sort(function (a, b) { return b.v - a.v; });
    var loss = M.firms.filter(function (f) { return firmOK(f) && f.d.usd < 0; }), none = M.firms.filter(function (f) { return firmOK(f) && f.d.usd == null; });
    return { n: base.length, P: P, att: att, rows: rows, loss: loss, none: none };
  }

  /* ---------- drawing ---------- */
  function el(tag, at, parent, text) { var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; }
  function curve(a, b, pull) { var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, c = [mx + (CX - mx) * pull, my + (CY - my) * pull]; return 'M' + fx(a[0]) + ',' + fx(a[1]) + ' Q' + fx(c[0]) + ',' + fx(c[1]) + ' ' + fx(b[0]) + ',' + fx(b[1]); }
  function arc(r, a0, a1, back) { var p0 = pt(r, back ? a1 : a0), p1 = pt(r, back ? a0 : a1); return 'M' + fx(p0[0]) + ',' + fx(p0[1]) + ' A' + r + ',' + r + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' ' + (back ? 0 : 1) + ' ' + fx(p1[0]) + ',' + fx(p1[1]); }
  function firmLabel(f) {
    var d = f.d, c = d.cov;
    return d.n + ': ' + (d.usd == null ? 'profit ' + (typeof d.loc === 'string' ? d.loc : 'not published') : (d.usd < 0 ? 'loss of ' + money(-d.usd) : 'profit ' + money(d.usd)) + ', ' + d.fy) + '; ' + (c[2] ? fx(c[0]) + '% attributed to named holders' : 'no holder table found');
  }
  function draw() {
    var svg = host.querySelector('svg'); svg.innerHTML = '';
    var gl = el('g', { 'class': 'fl' }, svg), ga = el('g', { 'class': 'fa' }, svg), gn = el('g', { 'class': 'fn' }, svg);
    M.groups.forEach(function (g) {
      el('path', { d: arc(RF, g.a0 + .4, g.a1 - .4), 'class': 'farc' }, ga);
      el('path', { d: arc(RIM, g.a0 + .4, g.a1 - .4), 'class': 'frim' }, ga);
      var mid = (g.a0 + g.a1) / 2, flip = Math.sin(rad(mid)) > .15, id = 'isx-fw-arc-' + g.i, len = (g.a1 - g.a0) / 360 * 2 * Math.PI * RIM;
      el('path', { id: id, d: arc(flip ? RIM + 14 : RIM + 6, g.a0, g.a1, flip), fill: 'none' }, ga);
      var name = g.L.n.length * 6.4 < len - 6 ? g.L.n : g.L.s, t = el('text', { 'class': 'farct' }, ga);
      el('textPath', { href: '#' + id, startOffset: '50%', 'text-anchor': 'middle' }, t, name.toUpperCase());
    });
    M.links.forEach(function (L) {
      var w = L.att == null ? .7 : Math.min(4.4, .55 + .62 * Math.sqrt(Math.abs(L.att) / 1000));
      var p = el('path', { d: curve(L.a.p, L.b.p, L.kind === 'ff' ? .5 : L.a.n > 1 ? .08 : 0), 'class': 'fk t-' + L.t + (L.att == null ? ' na' : L.att < 0 ? ' neg' : ''), 'data-a': L.a.id, 'data-b': L.b.id }, gl);
      p.style.strokeWidth = w.toFixed(2); L.el = p;
    });
    var node = function (n, cls, name, tab) { n.el = el('g', { 'class': 'fnode ' + cls, 'data-id': n.id, role: 'button', tabindex: tab ? '0' : '-1', 'aria-label': name }, gn); return n.el; };
    M.holders.forEach(function (h) {
      var shown = h.name + (h.n > 1 ? ' · ' + h.n : ''), g = node(h, 'holder t-' + h.t + (h.n > 2 ? ' multi' : h.n === 1 ? ' one' : '') + (h.att < 0 ? ' neg' : ''), shown + ': ' + TNAME[h.t].toLowerCase() + ', ' + h.c + '; ' + (h.n > 1 ? 'holds ' + h.n + ' firms' : 'holds ' + h.rows[0].f.d.n) + (h.att ? ', attributed profit ' + money(h.att) : ''), false);
      el('circle', { cx: fx(h.p[0]), cy: fx(h.p[1]), r: fx(h.r), 'class': 'fm' }, g);
      el('text', { x: fx(h.p[0]), y: fx(h.p[1] - h.r - 4), 'text-anchor': 'middle', 'class': 'ft' }, g, shown);
    });
    var radial = function (g, n, text, cls) {
      var q = pt(RF + n.r + 6, n.a), flip = Math.cos(rad(n.a)) < 0;
      el('text', { transform: 'translate(' + fx(q[0]) + ',' + fx(q[1]) + ') rotate(' + fx(flip ? n.a + 180 : n.a) + ')', 'text-anchor': flip ? 'end' : 'start', dy: '.34em', 'class': cls }, g, text);
    };
    M.secs.forEach(function (s) {
      var shown = s.d.n.replace(/^Power, grid and data-centre construction$/, 'Power, grid, data centres').replace(/^Design software \(EDA\)$/, 'Design software');
      var g = node(s, 'sector', shown + ': ' + (shown === s.d.n ? '' : s.d.n + ', ') + 'sector row, no firm profiled yet', true);
      el('rect', { x: fx(s.p[0] - 5), y: fx(s.p[1] - 5), width: 10, height: 10, rx: 2.5, 'class': 'fm', transform: 'rotate(' + fx(s.a) + ' ' + fx(s.p[0]) + ' ' + fx(s.p[1]) + ')' }, g);
      radial(g, s, shown, 'ft');
    });
    M.firms.forEach(function (f) {
      var d = f.d, g = node(f, 'firm' + (d.usd == null ? ' none' : d.usd < 0 ? ' loss' : '') + (d.x ? ' star' : ''), firmLabel(f), true);
      el('circle', { cx: fx(f.p[0]), cy: fx(f.p[1]), r: fx(f.r), 'class': 'fm' }, g);
      radial(g, f, d.n, 'ft');
    });
    mark();
  }
  function mark() {
    var svg = host.querySelector('svg'), n = S.sel && M.nodes[S.sel], near = {}, flt = anyF(), live = {};
    if (n) { near[n.id] = 1; n.links.forEach(function (id) { near[id] = 1; }); }
    M.links.forEach(function (L) {
      var ok = firmOK(L.b) && holdOK(L), on = !!n && (L.a.id === S.sel || L.b.id === S.sel);
      if (ok) { live[L.a.id] = 1; live[L.b.id] = 1; }
      L.el.classList.toggle('on', on); L.el.classList.toggle('off', flt && !ok);
    });
    var holderF = !!(S.f.ht || S.f.hc);
    Object.keys(M.nodes).forEach(function (id) {
      var x = M.nodes[id], off = flt && (x.kind === 'holder' ? !live[id] : x.kind === 'sector' ? !(S.f.L === '' || String(x.d.L) === S.f.L) || !!S.f.fc || holderF : !firmOK(x) || (holderF && !live[id]));
      x.el.classList.toggle('on', !!near[id]); x.el.classList.toggle('sel', id === S.sel); x.el.classList.toggle('off', off);
      x.el.setAttribute('aria-pressed', String(id === S.sel));
    });
    svg.classList.toggle('hl', !!n); svg.classList.toggle('calm', S.calm); svg.classList.toggle('flt', flt);
  }

  /* ---------- the card: the sums at rest; a firm, a holder or a sector row when one is picked ---------- */
  var METHOD = ['Attributed profit* = a firm’s latest full-year net income attributable to its shareholders × the holder’s stake, as a share of all shares outstanding, as last disclosed. US dollars at the fiscal year’s average rate.',
    'One level only: a holder that is itself a firm on the ring is marked and not looked through, so nothing is counted twice.',
    'An asset manager holds for clients: the profit is attributed to the manager, marked, never to the savers behind it.',
    'Nominees and depositary banks are not owners: shown, never attributed. Attribution follows the stake, not the votes; a share of one class only is shown and not attributed.',
    'It is a claim on earnings, not dividends received, and never an estimate of an undisclosed stake: what no filing names stays “dispersed or not disclosed”.'];
  var star = '<abbr class="fst" title="Derived: profit × stake. See “How we count”.">*</abbr>';
  function restHTML() {
    var Z = sums(), T = Z.P || 1, rest = Math.max(0, Z.P - Z.att), fl = S.by === 'type' ? S.f.ht : S.f.hc;
    var bar = function (k, name, v, cls, key) {
      var w = Math.max(.6, v / T * 100).toFixed(1), in1 = '<b>' + esc(name) + '</b><i><u style="width:' + w + '%"></u></i><span>' + money(v) + ' · ' + (v / T * 100).toFixed(1) + '%</span>';
      return key ? '<button type="button" class="fbar ' + cls + (fl === key ? ' on' : '') + '" data-fwb="' + esc(key) + '" aria-pressed="' + (fl === key) + '">' + in1 + '</button>' : '<div class="fbar ' + cls + '">' + in1 + '</div>';
    };
    var scope = (S.f.L !== '' ? D.layers[+S.f.L].n.toLowerCase() + ' · ' : '') + (S.f.fc ? S.f.fc + ' · ' : '');
    return '<div class="wk3">Firms · profits and owners</div><h3>Whose profits are they?</h3>'
      + '<p>' + (scope ? '<span class="fscope">' + esc(scope.replace(/ · $/, '')) + '</span> ' : '') + plural(Z.n, 'firm') + ' booked <b>' + money(Z.P) + '</b> in their latest full year. <b>' + (Z.att / T * 100).toFixed(1) + '%</b> of it can be attributed' + star + ' to a holder a filing names.</p>'
      + '<div class="fseg" role="group" aria-label="Sum the attributed profit by"><button type="button" data-fwby="type" aria-pressed="' + (S.by === 'type') + '">By holder type</button><button type="button" data-fwby="country" aria-pressed="' + (S.by === 'country') + '">By holder’s country</button></div>'
      + '<div class="fbars">' + Z.rows.map(function (r) { return bar(r.k, S.by === 'type' ? TNAME[r.k] : r.k, r.v, S.by === 'type' ? 't-' + r.k : 'cty', r.k); }).join('')
      + bar('', 'Dispersed or not disclosed', rest, 'rest', '') + '</div>'
      + '<p class="wnote">A mark’s size is the firm’s profit; a line’s width, the profit attributed' + star + ' to that holder. ' + (S.by === 'country' ? 'A head office is not where the money comes from: an asset manager holds for savers worldwide. ' : '') + 'Pick a bar, a firm or a holder.</p>'
      + (Z.loss.length || Z.none.length ? '<p class="wnote">Outside the sum: ' + (Z.loss.length ? 'losses (' + esc(Z.loss.map(function (f) { return f.d.n + ' ' + money(f.d.usd); }).join(', ') + ')') : '') + (Z.loss.length && Z.none.length ? '; ' : '') + (Z.none.length ? 'no profit published or found (' + esc(Z.none.map(function (f) { return f.d.n; }).join(', ')) + ')' : '') + '.</p>' : '')
      + '<button type="button" class="fhowb" data-fw="how" aria-expanded="' + S.how + '">How we count <span aria-hidden="true">' + (S.how ? '−' : '+') + '</span></button>'
      + (S.how ? '<ul class="fhow">' + METHOD.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '<li>' + D.flagged + ' figures are starred or in conflict between sources; each firm’s card says which. Holder types and countries are the filings’ own wording, grouped.</li></ul>' : '');
  }
  function rowHTML(x, firmSide) {
    var h = x.h, tgt = firmSide ? x.f : x.node, nm = firmSide ? tgt.d.n : h.n, bits = [];
    if (!firmSide) bits.push(esc(h.tr) + ' · ' + esc(h.cr || h.c));
    else if (h.n !== x.name) bits.push('as ' + esc(h.n));
    if (h.d) bits.push('as of ' + esc(day(h.d)));
    if (h.v != null) bits.push('votes: ' + esc(String(h.v)) + (typeof h.v === 'number' ? '%' : ''));
    if (h.m) bits.push('a firm on the ring: marked, not looked through');
    if (h.s !== 'A') bits.push('<em>not attributed: ' + WHY[h.s] + '</em>');
    else if (!/^of shares outstanding/.test(h.b)) bits.push(esc(h.b));
    return '<li' + (h.s !== 'A' ? ' class="na"' : '') + '><button type="button" class="wlk" data-fw="' + esc(tgt.id) + '">' + esc(nm) + (h.x ? '*' : '') + '</button><span class="fv">' + pc(h.p) + (h.a != null ? ' · ' + money(h.a) + star : '') + '</span><span>' + bits.join(' · ') + '</span>'
      + (h.fl && h.x ? '<small>* ' + esc(h.fl) + '</small>' : '') + '</li>';
  }
  function firmHTML(n) {
    var d = n.d, c = d.cov, o = d.old && OWN && OWN.firms[d.old], conv = '';
    if (d.usd != null && d.ccy && d.ccy !== 'USD' && d.fx) conv = d.ccy + ' ' + Number(d.loc).toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'm at ' + d.fx + (d.fxd === 'u' ? ' USD per ' + d.ccy : ' per USD') + ' (' + d.fxb + '). ';
    var seat = [d.city, d.seat || d.home].filter(Boolean).join(', ') + (d.hx ? '*' : ''), list = /^not /.test(d.list) ? 'not recorded' : d.list.replace(/\s*\*general knowledge.*$/, '');
    var by = {}; if (o) (o.sites || []).forEach(function (s) { by[s.iso] = 1; });
    return '<div class="wk3">' + esc(D.layers[d.L].n) + ' · ' + esc(d.home) + '</div><h3>' + esc(d.full) + '</h3>'
      + '<div class="ftiles"><div><small>' + (d.usd < 0 ? 'Loss' : 'Profit') + ' · ' + esc(d.fy || 'latest year') + '</small><b>' + (d.usd == null ? esc(typeof d.loc === 'string' ? d.loc : 'not published') : money(Math.abs(d.usd))) + (d.x ? '*' : '') + '</b></div>'
      + '<div><small>Attributed' + star + ' to named holders</small><b>' + (c[2] ? fx(c[0]) + '%' : '–') + '</b></div></div>'
      + '<p class="wnote">' + esc(conv) + esc(stop(d.def)) + (d.fye ? ' Year to ' + esc(day(d.fye)) + '.' : '') + '</p>'
      + '<div class="wk3 sub">Where it is booked and listed</div><p class="fline"><b>Seat</b> ' + esc(seat || 'not recorded') + '</p><p class="fline"><b>Listed</b> ' + esc(list) + '</p>'
      + '<div class="wk3 sub">Whose it is</div>'
      + (n.rows.length ? '<ul class="wlist fown">' + n.rows.slice().sort(function (a, b) { return (b.h.s === 'A') - (a.h.s === 'A') || (b.h.p || 0) - (a.h.p || 0); }).map(function (x) { return rowHTML(x, false); }).join('') + '</ul>'
        + '<p class="wnote">' + fx(c[0]) + '% attributed' + (c[1] ? '; ' + fx(c[1]) + '% passes through nominees or depositaries' : '') + '; ' + fx(100 - c[0]) + '% dispersed or not disclosed.' + (d.note ? ' ' + esc(d.note) : '') + '</p>'
        : '<p class="wnote">No holder table found.' + (d.note ? ' ' + esc(d.note) : '') + '</p>')
      + (n.owns.length ? '<div class="wk3 sub">Holds, on the ring</div><ul class="wlist fown">' + n.owns.map(function (x) { return rowHTML({ h: x.h, f: x.f, name: x.h.n }, true); }).join('') + '</ul>' : '')
      + '<div class="wk3 sub">Where it is earned</div>' + (o ? '<p class="fline">' + plural(d.sites, 'site') + ' mapped in ' + plural(Object.keys(by).length, 'country', 'countries') + '.</p><button type="button" class="wgo" data-fw="globe">Open its footprint on the globe <span aria-hidden="true">→</span></button>' : '<p class="wnote">Sites not mapped.</p>')
      + (d.fl ? '<p class="wnote">' + (d.x ? '* ' : 'Note: ') + esc(stop(d.fl)) + '</p>' : '')
      + (d.doc ? '<p class="wsrc">Holders: ' + (/^https?:/.test(d.doc[1]) ? '<a href="' + esc(d.doc[1]) + '" target="_blank" rel="noopener">' + esc(d.doc[0]) + '</a>' : esc(d.doc[0])) + '</p>' : '');
  }
  function holderHTML(n) {
    var rows = n.rows.slice().sort(function (a, b) { return (b.h.a || 0) - (a.h.a || 0) || (b.h.p || 0) - (a.h.p || 0); });
    return '<div class="wk3 t-' + n.t + '">Owner · ' + esc(TNAME[n.t]) + '</div><h3>' + esc(n.name) + '</h3>'
      + '<div class="ftiles"><div><small>Attributed profit' + star + '</small><b>' + (n.att ? money(n.att) : '–') + '</b></div><div><small>Firms on the ring</small><b>' + n.n + '</b></div></div>'
      + '<p class="fline"><b>Country</b> ' + esc(/[(;]/.test(rows[0].h.cr || '') ? rows[0].h.cr : n.c) + '</p>'
      + (n.hc ? '<p class="wnote">Holds for clients: the stake belongs to the savers behind the manager. It is attributed to the manager, marked, and not looked through.</p>' : '')
      + (n.t === 'pass' ? '<p class="wnote">A nominee or depositary is not an owner: the shares pass through to holders the filing does not name. Nothing is attributed.</p>' : '')
      + '<ul class="wlist fown">' + rows.map(function (x) { return rowHTML({ h: x.h, f: x.f, name: n.name }, true); }).join('') + '</ul>';
  }
  function sectorHTML(n) {
    var d = n.d;
    return '<div class="wk3">Sector row · no firm profiled yet</div><h3>' + esc(d.n) + '</h3><p>' + esc(d.role) + '.</p>'
      + (/^none/.test(d.named) ? '' : '<p class="fline"><b>Named</b> ' + esc(d.named.replace(/ named, not profiled$/, '')) + '</p>')
      + (d.v != null ? '<div class="ftiles one"><div><small>' + esc(d.fig) + ' · ' + esc(day(d.date)) + '</small><b>' + d.v + '*</b><small>' + esc(d.unit) + '</small></div></div><p class="wnote">* ' + esc(d.fl) + '</p><p class="wsrc">Source: ' + esc(d.src) + '</p>'
        : '<p class="wnote">No dated figure collected.</p>');
  }
  function card() {
    var c = host.querySelector('.wcard'), n = S.sel && M.nodes[S.sel];
    c.innerHTML = (n ? (n.kind === 'firm' ? firmHTML(n) : n.kind === 'holder' ? holderHTML(n) : sectorHTML(n)) + '<button type="button" class="wback" data-fw="">Back to the whole web</button>' : restHTML())
      + '<div class="wsrc">Profits and holders as filed, merged ' + esc(D.asof) + '. Each firm’s card names its filing.</div>';
    c.scrollTop = 0;
  }
  function tableHTML() {
    var fs = M.firms.filter(firmOK), hs = M.holders.filter(function (h) { return h.rows.some(function (x) { return firmOK(x.f) && (!S.f.ht || x.h.t === S.f.ht) && (!S.f.hc || x.h.c === S.f.hc); }); }).sort(function (a, b) { return b.att - a.att || b.n - a.n; });
    return '<table><caption>Firms, by layer: profit and what can be attributed* to named holders</caption><thead><tr><th scope="col">Firm</th><th scope="col">Layer</th><th scope="col">Home</th><th scope="col">Year</th><th scope="col" class="num">Profit, $m</th><th scope="col" class="num">Attributed*</th><th scope="col">Largest named holder</th></tr></thead><tbody>'
      + fs.map(function (f) { var d = f.d, top = f.rows.filter(function (x) { return x.h.s === 'A'; }).sort(function (a, b) { return (b.h.p || 0) - (a.h.p || 0); })[0];
        return '<tr><th scope="row"><button type="button" class="wlk" data-fw="' + esc(f.id) + '">' + esc(d.n) + '</button></th><td>' + esc(D.layers[d.L].s) + '</td><td>' + esc(d.home) + '</td><td>' + esc(d.fy || '–') + '</td><td class="num">' + (d.usd == null ? esc(typeof d.loc === 'string' ? d.loc : '–') : Math.round(d.usd).toLocaleString('en-US').replace('-', '−') + (d.x ? '*' : '')) + '</td><td class="num">' + (d.cov[2] ? fx(d.cov[0]) + '%' : '–') + '</td><td>' + (top ? esc(top.h.n) + ' · ' + pc(top.h.p) : '–') + '</td></tr>'; }).join('')
      + '</tbody></table><table><caption>Holders: attributed profit* across the firms shown</caption><thead><tr><th scope="col">Holder</th><th scope="col">Type</th><th scope="col">Country</th><th scope="col" class="num">Firms</th><th scope="col" class="num">Attributed*, $m</th></tr></thead><tbody>'
      + hs.map(function (h) { return '<tr><th scope="row"><button type="button" class="wlk" data-fw="' + esc(h.id) + '">' + esc(h.name) + '</button></th><td>' + esc(TNAME[h.t]) + '</td><td>' + esc(h.c) + '</td><td class="num">' + h.n + '</td><td class="num">' + (h.att ? Math.round(h.att).toLocaleString('en-US').replace('-', '−') : '–') + '</td></tr>'; }).join('')
      + '</tbody></table><p class="wnote">* Derived or starred: attributed profit is profit × stake; a starred profit is flagged on the firm’s card.</p>';
  }
  function bar() {
    var uniq = function (l) { return l.filter(function (v, i) { return v && l.indexOf(v) === i; }).sort(); };
    var opt = function (v, t, cur) { return '<option value="' + esc(v) + '"' + (String(cur) === String(v) ? ' selected' : '') + '>' + esc(t) + '</option>'; };
    var sel = function (k, lab, all, opts) { return '<label class="fsel' + (S.f[k] !== '' ? ' set' : '') + '"><select data-fwf="' + k + '" aria-label="' + lab + '">' + opt('', all, S.f[k]) + opts.map(function (o) { return opt(o[0], o[1], S.f[k]); }).join('') + '</select></label>'; };
    host.querySelector('.fwbar').innerHTML = sel('L', 'Layer', 'All layers', M.groups.map(function (g) { return [g.i, g.L.n]; }))
      + sel('fc', 'Firm’s country', 'Firms from: all', uniq(D.firms.map(function (f) { return f.home; })).map(function (c) { return [c, 'Firms from: ' + c]; }))
      + sel('ht', 'Holder type', 'All holder types', TYPES.map(function (t) { return [t[0], t[1]]; }))
      + sel('hc', 'Holder’s country', 'Holders from: all', uniq(D.holders.map(function (h) { return h.c; })).map(function (c) { return [c, 'Holders from: ' + c]; }))
      + (anyF() ? '<button type="button" class="fbtn" data-fw="reset">Clear</button>' : '')
      + '<span class="fgap"></span><button type="button" class="fbtn fcalm" data-fw="calm" role="switch" aria-checked="' + S.calm + '"><i aria-hidden="true"></i>Calm</button>'
      + '<button type="button" class="fbtn" data-fw="table" aria-pressed="' + S.table + '">' + (S.table ? 'View as web' : 'View as table') + '</button>';
  }
  function refresh(keepCard) { bar(); var st = host.querySelector('.wstage'); st.classList.toggle('tab', S.table); host.querySelector('.fwtab').innerHTML = S.table ? tableHTML() : ''; mark(); if (!keepCard) card(); X.emit('firms', { sel: S.sel, by: S.by, table: S.table }); }
  function pick(id) { S.sel = id && M.nodes[id] ? (S.sel === id ? null : id) : null; mark(); card(); X.emit('firms', { sel: S.sel, by: S.by, table: S.table }); }

  /* ---------- open and close ---------- */
  function ensure() {
    if (host) return;
    host = document.createElement('section'); host.className = 'web3 fw'; host.id = 'isx-fw'; host.hidden = true; host.setAttribute('aria-label', 'The firm web: profits and owners');
    host.innerHTML = '<aside class="wcard" aria-live="polite"></aside><div class="wstage"><div class="fwbar" role="group" aria-label="Filter the web"></div>'
      + '<div class="fwpan"><svg viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="The firms of the AI supply chain on a ring, by layer; inside it, the holders their filings name. A mark’s size is the firm’s latest full-year profit; a line’s width, the profit attributed to that holder. “View as table” gives the same figures as text."></svg></div>'
      + '<div class="fwtab" tabindex="0" role="region" aria-label="The firm web as tables"></div>'
      + '<div class="wkey" aria-hidden="true">' + TYPES.slice(0, 5).map(function (t) { return '<span><i class="t-' + t[0] + '"></i>' + t[1] + '</span>'; }).join('') + '<span><i class="k-loss"></i>Loss</span><span><i class="k-na"></i>Not attributed</span><span><i class="k-sec"></i>Sector row</span></div></div>'
      + '<button type="button" class="wclose" data-fw="close"><span aria-hidden="true">←</span> <span class="wct">Back to the globe</span></button>';
    frame.appendChild(host);
    host.addEventListener('click', function (e) {
      var t = e.target.closest('[data-fw], [data-fwby], [data-fwb], .fnode'); if (!t) return;
      if (t.classList.contains('fnode')) { pick(t.dataset.id); return; }
      if (t.dataset.fwby) { S.by = t.dataset.fwby; card(); host.querySelector('[data-fwby="' + S.by + '"]').focus({ preventScroll: true }); X.emit('firms', { sel: S.sel, by: S.by, table: S.table }); return; }
      if (t.dataset.fwb != null) { var k = S.by === 'type' ? 'ht' : 'hc', v = t.dataset.fwb; S.f[k] = S.f[k] === v ? '' : v; refresh(); var b = host.querySelector('[data-fwb="' + v.replace(/"/g, '\\"') + '"]'); if (b && e.detail === 0) b.focus({ preventScroll: true }); return; }
      var k2 = t.dataset.fw;
      if (k2 === 'close') close(true);
      else if (k2 === 'calm') { S.calm = !S.calm; refresh(true); host.querySelector('.fcalm').focus({ preventScroll: true }); }
      else if (k2 === 'table') { S.table = !S.table; refresh(true); host.querySelector('[data-fw="table"]').focus({ preventScroll: true }); }
      else if (k2 === 'reset') { S.f = { L: '', fc: '', ht: '', hc: '' }; refresh(); host.querySelector('.fwbar select').focus({ preventScroll: true }); }
      else if (k2 === 'how') { S.how = !S.how; card(); host.querySelector('.fhowb').focus({ preventScroll: true }); }
      else if (k2 === 'globe') { var n = M.nodes[S.sel], f = n && n.d.old && X.data.FIRMS.filter(function (x) { return x.name === n.d.old; })[0]; from = null; close(false); if (f) { X.stopPlay(); X.select(f.iso, f); } }
      else { S.sel = null; pick(k2); var fb = host.querySelector('.wcard .wback, .wcard button'); if (fb && e.detail === 0) fb.focus({ preventScroll: true }); }
    });
    host.addEventListener('change', function (e) { var s = e.target.closest('[data-fwf]'); if (!s) return; var k = s.dataset.fwf; S.f[k] = s.value; refresh(); var again = host.querySelector('[data-fwf="' + k + '"]'); if (again) again.focus({ preventScroll: true }); });
    /* Esc also works when focus has fallen back to the page (a card that was redrawn) */
    document.addEventListener('keydown', function (e) { if (host.hidden || e.key !== 'Escape' || e.defaultPrevented || host.contains(e.target) || /^(SELECT|INPUT|TEXTAREA)$/.test(e.target.tagName || '')) return; e.preventDefault(); if (S.sel) pick(null); else close(true); });
    host.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { if (e.target.tagName === 'SELECT') return; e.preventDefault(); if (S.sel) pick(null); else close(true); return; }
      var g = e.target.closest && e.target.closest('.fnode');
      if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(g.dataset.id); }
    });
  }
  function open(o) {
    o = o || {};
    if (X.view !== 'map') X.setView('map');
    if (X.web && X.web.isOpen) X.web.close(false);
    ensure();
    lastFocus = document.activeElement; from = o.from || null;
    var go = function () {
      if (!M) M = model();
      S.sel = null; S.table = false; S.by = o.by === 'country' ? 'country' : o.by === 'type' ? 'type' : S.by;
      if (!host.querySelector('svg').firstChild) draw();
      if (o.firm && M.byId[o.firm]) S.sel = 'f:' + o.firm;
      host.querySelector('.wct').textContent = from === 'profit' ? 'Back to the profit dollar' : 'Back to the globe';
      host.hidden = false; root.classList.add('web-on', 'fw-on'); refresh();
      var stg = host.querySelector('.fwpan'); if (stg.scrollWidth > stg.clientWidth + 4) stg.scrollLeft = (stg.scrollWidth - stg.clientWidth) / 2;   /* phones: the picture pans; start at its middle */
      try { if (X.globe) X.globe.pauseAnimation(); } catch (e) { /* ignore */ }
      var b = host.querySelector('.wclose'); if (b) b.focus({ preventScroll: true });
      X.emit('firms', { sel: S.sel, by: S.by, table: false, open: true }); if (X.routeSync) X.routeSync();
    };
    var need = [];
    if (!D) need.push(X.load('firms').then(function (d) { D = d; }));
    if (!OWN) need.push((X.own && X.own.data ? Promise.resolve(X.own.data) : X.load('ownership')).then(function (d) { OWN = d; }).catch(function () { OWN = null; }));
    return Promise.all(need).then(go).catch(function () { /* the tray and the doors keep working without the web */ });
  }
  function close(refocus) {
    if (!host || host.hidden) return;
    host.hidden = true; root.classList.remove('web-on', 'fw-on');
    try { if (X.globe && !document.hidden) X.globe.resumeAnimation(); } catch (e) { /* ignore */ }
    var back = from; from = null;
    X.emit('firms', { open: false });
    if (refocus && back === 'profit') { X.setView('profit'); return; }
    if (refocus) { var b = $('tp-firms') || lastFocus; if (b && b.focus) b.focus({ preventScroll: true }); }
    if (X.routeSync) X.routeSync();
  }
  X.on('view', function () { from = null; close(false); });
  X.on('web', function (on) { if (on) { from = null; close(false); } });
  /* the page's record of a firm, for the door on its card on the globe */
  var OLDID = { 'ASML': 'asml', 'ASM Intl': 'asm_international', 'Besi': 'besi', 'Nexperia': 'nexperia', 'NXP': 'nxp', 'TSMC': 'tsmc', 'Samsung': 'samsung', 'SK Hynix': 'sk_hynix', 'Nvidia': 'nvidia', 'Foxconn': 'foxconn_hon_hai', 'Tokyo Electron': 'tokyo_electron', 'Applied Materials': 'applied_materials', 'Microsoft': 'microsoft', 'Amazon': 'amazon', 'Alphabet': 'alphabet', 'Meta': 'meta', 'SpaceX': 'spacex', 'Huawei': 'huawei', 'SMIC': 'smic', 'Wingtech': 'wingtech' };
  X.firms = { open: open, close: close, idOf: function (name) { return OLDID[name] || null; }, pick: function (id) { if (M && host && !host.hidden) { S.sel = null; pick(id); } },
    get isOpen() { return !!host && !host.hidden; }, get state() { return { open: !!host && !host.hidden, sel: S.sel, by: S.by, calm: S.calm, table: S.table, f: Object.assign({}, S.f), firms: M ? M.firms.length : 0, holders: M ? M.holders.length : 0, links: M ? M.links.length : 0, sectors: M ? M.secs.length : 0, sum: D ? D.sum : null }; },
    set: function (k, v) { if (!M) return; if (k in S.f) S.f[k] = String(v == null ? '' : v); else if (k === 'calm' || k === 'table') S[k] = !!v; else if (k === 'by') S.by = v === 'country' ? 'country' : 'type'; refresh(); } };
  /* a link that arrives at #circuit/firms: state.js runs before this file, so the first address is read here */
  var m0 = /^#\/?circuit\/firms(?:=(\w+))?/.exec(window.__isxHash0 || ''); if (m0) open({ by: m0[1] || 'type' });
})();
