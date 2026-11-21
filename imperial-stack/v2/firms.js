/* The Imperial Stack v2 · firms.js
   The firm web: every firm of the AI supply chain on one ring, by layer. Inside the ring, the holders its filings name;
   outside it, the countries where the mapped firms have sites (“where it is earned”). A firm's mark is sized by its latest
   full-year profit (a loss is an outline); a line's width is the profit attributed* to that holder; a holder's colour is its type.
   Round 2 (21 Nov 2026): the older ownership web (v2/web.js) is folded in here, with its sites, control labels, summaries and
   data sheets; the four filters are chips with several values each; “compare two groups” draws two filter sets as two halves
   of the ring; ten selected views fill those controls; a change of view moves the marks instead of swapping the picture.
   attributed profit* = profit attributable to shareholders × the holder's printed stake, one level only: arithmetic on
   two dated figures, never an estimate of an undisclosed stake. Profits and holders come from data/firms.json
   (tools/firms-data.py); sites, control and summaries from data/ownership.json; the empty sheets from data/company-sheets.json.
   Opened from the Firms tray, the profit dollar's doors, a firm's card on the globe and #circuit/firms=… (see addr()). */
(function () {
  'use strict';
  var X = window.ISX; if (!X) return;
  var U = X.util, root = X.root, $ = X.$, frame = $('frame'); if (!frame) return;
  var NS = 'http://www.w3.org/2000/svg', esc = U.esc, D = null, OWN = null, SH = null, host = null, M = null, LAY = null, lastFocus = null, from = null;
  var KEYS = ['L', 'fc', 'ht', 'hc'], KNAME = { L: 'Layer', fc: 'Firm’s country', ht: 'Holder type', hc: 'Holder’s country' };
  var blank = function () { return { L: [], fc: [], ht: [], hc: [] }; };
  var S = { sel: null, calm: false, by: 'type', table: false, how: false, more: false, view: '', lens: '', cmp: false, pan: '', f: blank(), g: blank() };
  var VX = -70, VW = 1060, VH = 928, CX = 460, CY = 464, RF = 262, RIM = 400, RB = 423, RC = 441, DX = 62, GAP = 15;
  var TYPES = [['manager', 'Asset managers and funds'], ['founder', 'Founders, families and insiders'], ['state', 'States and state funds'],
    ['firm', 'Other firms and banks'], ['employees', 'Employees'], ['other', 'Foundations and unnamed groups'], ['pass', 'Nominees and depositaries']];
  var TNAME = {}; TYPES.forEach(function (t) { TNAME[t[0]] = t[1]; });
  var TSHORT = { manager: 'managers', founder: 'founders', state: 'state', firm: 'other firms', employees: 'employees', other: 'foundations and unnamed groups', pass: 'nominees' };
  var WHY = { PT: 'passes through to holders the filing does not name', DUP: 'the same shares as another row', CLS: 'a share of one class only',
    STALE: 'stale or zero holding', CONF: 'conflicts with the primary filing', AGG: 'a group, no named holder', HIST: 'superseded', NA: 'no percentage published' };
  /* from the older ownership web: how a firm is controlled, as data/ownership.json records it */
  var CONTROL = { none: 'No controlling owner', controlled: 'Controlled within a group', state: 'State among the largest holders', founder: 'Controlled by its founder', led: 'Founder is the largest holder', disputed: 'Control disputed', unmapped: 'Owners not yet mapped' };
  var rad = function (d) { return d * Math.PI / 180; };
  var plural = function (n, w, ws) { return n + ' ' + (n === 1 ? w : ws || w + 's'); };
  var fx = function (v) { return v.toFixed(1); };
  /* $m to words: $133.7bn, $905m; a loss reads “−$4.9bn” */
  function money(v) { if (v == null) return 'not published'; var a = Math.abs(v), s = a >= 1000 ? '$' + (a / 1000).toFixed(a >= 100000 ? 0 : 1) + 'bn' : '$' + (a >= 10 ? Math.round(a) : a.toFixed(1)) + 'm'; return (v < 0 ? '−' : '') + s; }
  var pc = function (p) { return p == null ? 'no percentage' : (p >= 10 ? p.toFixed(1) : p.toFixed(2)).replace(/\.?0+$/, '') + '%'; };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var day = function (d) { var m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(d || ''); return m ? (m[3] ? +m[3] + ' ' : '') + MON[+m[2] - 1] + ' ' + m[1] : d; };
  var stop = function (t) { return /[.!?)]$/.test(t) ? t : t + '.'; };
  var rOf = function (usd) { return usd == null ? 5 : 4 + 1.38 * Math.sqrt(Math.abs(usd) / 1000); };
  var num = function (v) { var m = v == null ? null : /(\d+(?:\.\d+)?)/.exec(String(v)); return m ? +m[1] : null; };   /* “27.4 (total voting)” → 27.4; words alone → null */
  var cname = function (iso) { return iso === 'USA' ? 'United States' : (X.data.CTY[iso] ? X.data.CTY[iso].name : iso); };
  var still = function () { return !!(X.reduce || S.calm); };   /* reduced motion and the calm switch: every change is an instant swap */
  var wip = function (part) { var p = D && D.parts && D.parts[part]; return p && p.status === 'preliminary' ? p : null; };   /* the marker follows the data (design principles, thread 11) */
  var pill = function () { return X.wip ? X.wip.pill() : '<span class="wipm"><i aria-hidden="true"></i>WIP</span>'; };
  var wipNote = function (p) { return X.wip ? X.wip.note(p.missing) : '<p class="wipl">' + pill() + ' Preliminary: ' + esc(p.missing) + '.</p>'; };

  /* ---------- the model: firms and sector rows on the ring, holders inside it, countries of operation outside ---------- */
  function model() {
    var firms = D.firms.map(function (f) { return { id: 'f:' + f.id, kind: 'firm', d: f, r0: rOf(f.usd), links: [], rows: [], owns: [], sites: {} }; }), byId = {};
    firms.forEach(function (f) { byId[f.d.id] = f; f.o = f.d.old && OWN ? OWN.firms[f.d.old] || null : null; f.und = f.d.usd > 0 ? 100 - f.d.cov[0] : null; });
    var secs = D.sectors.map(function (s) { return { id: 's:' + s.id, kind: 'sector', d: s, r0: 5, links: [] }; });
    /* holders: one node per holder. A holder that is itself a firm on the ring is a line between the two firms; when that
       firm is not in the view, its stand-in (a holder mark with the firm's name) carries the line. Its type is the filing's own. */
    var hs = {}, links = [], pair = {}, prox = {};
    D.holders.forEach(function (h) {
      var f = byId[h.f], n, px = null;
      if (h.m) { n = byId[h.m]; n.owns.push({ f: f, h: h }); n.ring = f.ring = 1; px = prox[h.m] || (prox[h.m] = { id: 'p:' + h.m, kind: 'holder', proxy: n, name: n.d.n, rows: [], links: [], att: 0, t: h.t, c: h.c }); px.rows.push({ f: f, h: h }); if (h.a) px.att += h.a; }
      else { n = hs[h.k] || (hs[h.k] = { id: 'h:' + h.k, kind: 'holder', name: h.k, rows: [], links: [], att: 0, t: h.t, c: h.c }); n.rows.push({ f: f, h: h }); if (h.a) n.att += h.a; if (h.s === 'A' && n.s !== 'A') { n.t = h.t; n.c = h.c; n.s = 'A'; } if (h.hc) n.hc = 1; }
      f.rows.push({ h: h, node: n });
      if (h.v != null) f.votes = 1;
      var key = n.id + '>' + f.id, L = pair[key];
      if (!L) { L = pair[key] = { kind: h.m ? 'ff' : 'own', a: n, px: px, b: f, rows: [], att: null, t: h.t, c: h.c, p: null }; links.push(L); n.links.push(f.id); f.links.push(n.id); if (px) px.links.push(f.id); }
      L.rows.push(h); if (h.a != null) { L.att = (L.att || 0) + h.a; L.t = h.t; L.c = h.c; }
      if (h.s === 'A' && h.p != null) L.p = Math.max(L.p || 0, h.p);
      if (h.v != null) { L.votes = 1; if (num(h.v) != null) L.v = Math.max(L.v || 0, num(h.v)); }
      if (h.s === 'A') L.ok = 1;
    });
    links.forEach(function (L) { L.w0 = L.att == null ? .7 : Math.min(4.4, .55 + .62 * Math.sqrt(Math.abs(L.att) / 1000)); L.bad = L.kind === 'ff' && L.b.o && L.b.o.control === 'disputed'; });
    var hl = Object.keys(hs).map(function (q) { return hs[q]; }), pl = Object.keys(prox).map(function (q) { return prox[q]; });
    hl.concat(pl).forEach(function (h) { h.r0 = Math.min(12, 2.6 + .9 * Math.sqrt(Math.abs(h.att) / 1000)); h.n = h.links.length; });
    /* where it is earned: the sites of the mapped firms, by country (data/ownership.json) */
    var cs = {}, sites = [];
    firms.forEach(function (f) { if (!f.o) return; (f.o.sites || []).forEach(function (s) { var c = cs[s.iso] || (cs[s.iso] = { id: 'c:' + s.iso, kind: 'country', iso: s.iso, name: cname(s.iso), firms: {}, links: [], r0: 4.5 }); c.firms[f.id] = (c.firms[f.id] || 0) + 1; f.sites[s.iso] = (f.sites[s.iso] || 0) + 1; }); });
    var cl = Object.keys(cs).map(function (k) { return cs[k]; });
    cl.forEach(function (c) { Object.keys(c.firms).forEach(function (id) { var f = byId[id.slice(2)]; sites.push({ kind: 'site', a: f, b: c, n: c.firms[id] }); f.links.push(c.id); c.links.push(f.id); }); });
    var nodes = {}; firms.concat(hl, pl, secs, cl).forEach(function (n) { nodes[n.id] = n; });
    var uniq = function (l) { return l.filter(function (v, i) { return v && l.indexOf(v) === i; }).sort(); };
    var homes = uniq(D.firms.map(function (f) { return f.home; })), lay = D.layers.map(function (L, i) { return i; }).filter(function (i) { return firms.some(function (f) { return f.d.L === i; }) || secs.some(function (s) { return s.d.L === i; }); });
    return { firms: firms, holders: hl, prox: pl, secs: secs, countries: cl, links: links, sites: sites, nodes: nodes, byId: byId, sited: firms.filter(function (f) { return f.d.sites > 0; }),
      opts: { L: lay.map(function (i) { return [String(i), D.layers[i].n]; }), fc: homes.map(function (c) { return [c, c]; }), ht: TYPES.map(function (t) { return [t[0], t[1]]; }), hc: uniq(D.holders.map(function (h) { return h.c; })).map(function (c) { return [c, c]; }) },
      nonUS: homes.filter(function (c) { return c !== 'United States'; }) };
  }

  /* ---------- the ten views: each fills the controls (the filters, the compare switch) or switches a lens on ---------- */
  var PRE = [
    { id: 'claim', t: 'The claim flows to New York', by: 'country', fill: function () { return { f: { fc: M.nonUS.slice(), hc: ['United States'] } }; } },
    { id: 'systems', t: 'Two systems of ownership', by: 'type', fill: function () { return { cmp: true, f: { fc: ['United States'] }, g: { fc: ['China'] } }; } },
    { id: 'state', t: 'The state as shareholder', by: 'type', fill: function () { return { f: { ht: ['state'] } }; } },
    { id: 'chokepoints', t: 'The chokepoints', fill: function () { return { f: { L: ['4'], fc: ['Germany', 'Japan', 'Netherlands', 'United States'] } }; } },
    { id: 'ring', t: 'Firms holding firms', lens: 1 }, { id: 'votes', t: 'Stake against votes', lens: 1 }, { id: 'losses', t: 'Who carries the losses', lens: 1 },
    { id: 'undisclosed', t: 'What no one discloses', lens: 1 }, { id: 'earned', t: 'Where it is earned, booked and owned', lens: 1, by: 'country' },
    { id: 'debt', t: 'Balance-sheet engineers', lens: 1, part: 'debt' }];
  var PBY = {}; PRE.forEach(function (P, i) { P.i = i; PBY[P.id] = P; });
  function fillOf(P) { var x = P && P.fill ? P.fill() : {}, o = { cmp: !!x.cmp, f: blank(), g: blank() }; KEYS.forEach(function (k) { if (x.f && x.f[k]) o.f[k] = x.f[k].slice(); if (x.g && x.g[k]) o.g[k] = x.g[k].slice(); }); return o; }
  var same = function (a, b) { return a.slice().sort().join('|') === b.slice().sort().join('|'); };
  function setView(id) {
    var P = PBY[id]; S.f = blank(); S.g = blank(); S.cmp = false; S.lens = ''; S.view = ''; S.pan = '';
    if (!P) return;
    var x = fillOf(P); S.f = x.f; S.g = x.g; S.cmp = x.cmp; S.lens = P.lens ? P.id : ''; S.view = P.id; if (P.by) S.by = P.by;
  }
  /* a view made of filters stays the view only while the filters are its own; a lens stays while it is on */
  function keepView() { var P = PBY[S.view]; if (!P) { S.view = ''; return; } if (P.lens) return; var x = fillOf(P); if (S.cmp !== x.cmp || KEYS.some(function (k) { return !same(S.f[k], x.f[k]) || !same(S.g[k], x.g[k]); })) S.view = ''; }

  /* ---------- who is in the picture ---------- */
  var inF = function (f, F) { return (!F.L.length || F.L.indexOf(String(f.d.L)) >= 0) && (!F.fc.length || F.fc.indexOf(f.d.home) >= 0); };
  var hasFF = function (F) { return !!(F.L.length || F.fc.length); }, hasHF = function (F) { return !!(F.ht.length || F.hc.length); };
  var linkF = function (L, F) { return (!F.ht.length || F.ht.indexOf(L.t) >= 0) && (!F.hc.length || F.hc.indexOf(L.c) >= 0); };
  var lensFirm = function (f) { var l = S.lens; return l === 'losses' ? f.d.usd < 0 : l === 'votes' ? !!f.votes : l === 'ring' ? !!f.ring : l === 'undisclosed' ? f.d.usd > 0 : l === 'earned' ? f.d.sites > 0 : true; };
  var lensLink = function (L) { return S.lens === 'ring' ? L.kind === 'ff' : S.lens === 'votes' ? !!L.votes : true; };
  var anyF = function () { return !!(S.lens || S.cmp || KEYS.some(function (k) { return S.f[k].length; })); };
  /* a firm's place: 0 on the whole ring, −1 the left half (group A), 1 the right half (group B), null out of the view */
  function sides() {
    var a = hasFF(S.f), b = hasFF(S.g), split = S.cmp && (a || b);
    M.firms.forEach(function (f) {
      if (!lensFirm(f)) f.side = null;
      else if (!S.cmp) f.side = inF(f, S.f) ? 0 : null;
      else if (!split) f.side = 0;
      else { var A = a ? inF(f, S.f) : !inF(f, S.g), B = b ? inF(f, S.g) : !inF(f, S.f); f.side = A ? -1 : B ? 1 : null; }
    });
    return split;
  }
  function linkOn(L) {
    var f = L.b; if (f.side == null || !lensLink(L)) return false;
    if (!S.cmp) return linkF(L, S.f);
    if (f.side === 0) return linkF(L, S.f) || linkF(L, S.g);
    return linkF(L, f.side === 1 ? S.g : S.f);
  }
  var src = function (L) { return L.px && L.a.side == null ? L.px : L.a; };   /* the mark a line starts from */
  function sums(pred) {
    var base = M.firms.filter(function (f) { return pred(f) && f.d.usd > 0; }), P = 0, att = 0, by = {}, ok = {};
    base.forEach(function (f) { P += f.d.usd; ok[f.d.id] = 1; });
    D.holders.forEach(function (h) { if (!ok[h.f] || !(h.a > 0)) return; var k = S.by === 'type' ? h.t : h.c; by[k] = (by[k] || 0) + h.a; att += h.a; });
    var rows = Object.keys(by).map(function (k) { return { k: k, v: by[k] }; }).sort(function (a, b) { return b.v - a.v; });
    var loss = M.firms.filter(function (f) { return pred(f) && f.d.usd < 0; }), none = M.firms.filter(function (f) { return pred(f) && f.d.usd == null; });
    return { n: base.length, P: P, att: att, rows: rows, by: by, loss: loss, none: none };
  }
  var inView = function (f) { return f.side != null; };

  /* ---------- the layout: where every mark goes for the view in force ---------- */
  function layout() {
    var split = sides(), ins = M.firms.filter(inView), whole = ins.length === M.firms.length && !split && S.lens !== 'undisclosed';
    var out = { split: split, arcs: [], k: 1, tags: [] };
    var secOK = function (s) { return !split && !S.lens && !S.f.fc.length && !S.cmp && (!S.f.L.length || S.f.L.indexOf(String(s.d.L)) >= 0); };
    M.secs.forEach(function (s) { s.side = secOK(s) ? 0 : null; });
    var groupsOf = function (side) {
      var fs = ins.filter(function (f) { return f.side === side; });
      if (S.lens === 'undisclosed') return fs.length ? [{ L: { n: 'Share no filing names: largest first', s: 'Not named: largest first' }, items: fs.sort(function (a, b) { return b.und - a.und; }) }] : [];
      return D.layers.map(function (L, i) { return { L: L, items: fs.filter(function (f) { return f.d.L === i; }).sort(function (a, b) { return (b.d.usd == null ? -1e9 : b.d.usd) - (a.d.usd == null ? -1e9 : a.d.usd); }).concat(side === 0 ? M.secs.filter(function (s) { return s.side === 0 && s.d.L === i; }) : []) }; }).filter(function (g) { return g.items.length; });
    };
    var wOf = function (n, k) { return n.kind === 'firm' ? Math.max(19, n.r0 * k * 2 + 6) : 44; };
    var halves = split ? [[-1, 164], [1, 164]] : [[0, 360]], K = [];
    halves.forEach(function (h) { var G = groupsOf(h[0]), need = 0; G.forEach(function (g) { g.items.forEach(function (n) { need += wOf(n, 1); }); need += GAP; }); h.G = G; K.push(need ? .85 * (h[1] / 360 * 2 * Math.PI * RF) / need : 9); });
    var k = out.k = whole ? 1 : Math.max(1, Math.min(ins.length <= 6 ? 2.4 : 1.7, Math.min.apply(null, K)));   /* fewer firms, larger marks: the same scale for every mark and line in the view */
    halves.forEach(function (h) {
      var side = h[0], span = h[1], G = h.G, total = 0, off = side * DX, dir = side === -1 ? -1 : 1;
      G.forEach(function (g) { g.items.forEach(function (n) { n.w = wOf(n, k); total += n.w; }); total += GAP; });
      var u = span / (total || 1), a = (side === 0 ? -90 : -90 + dir * 8) + dir * GAP * u / 2;
      G.forEach(function (g) {
        var a0 = a;
        g.items.forEach(function (n) { var an = a + dir * n.w * u / 2; n.z = { x: CX + off + RF * Math.cos(rad(an)), y: CY + RF * Math.sin(rad(an)), a: an, r: n.r0 * (n.kind === 'firm' ? k : 1), ox: off, on: 1 }; a += dir * n.w * u; });
        out.arcs.push({ L: g.L, a0: Math.min(a0, a), a1: Math.max(a0, a), off: off }); a += dir * GAP * u;
      });
      if (side) out.tags.push({ side: side, n: ins.filter(function (f) { return f.side === side; }).length });
    });
    M.firms.concat(M.secs).forEach(function (n) { if (n.side == null) n.z = { x: n.q ? n.q.x : CX, y: n.q ? n.q.y : CY, a: n.q ? n.q.a : 0, r: n.q ? n.q.r : n.r0, ox: n.q ? n.q.ox : 0, on: 0 }; });
    /* holders: a holder of several firms sits between them; a firm's own holders are a comb pointing inward from it */
    var hl = M.holders.concat(M.prox), vis = [], singles = {};
    hl.forEach(function (h) {
      var fs = h.links.map(function (id) { return M.nodes[id]; }).filter(inView);
      if (h.proxy && h.proxy.side != null) fs = [];
      if (!fs.length) { h.z = { x: h.q ? h.q.x : CX, y: h.q ? h.q.y : CY, a: 0, r: h.q ? h.q.r : h.r0, ox: 0, on: 0 }; return; }
      h.vn = fs.length; h.z = { a: 0, r: h.r0 * k, ox: 0, on: 1 }; vis.push(h);
      if (fs.length > 1) { var sx = 0, sy = 0, so = 0; fs.forEach(function (f) { sx += f.z.x; sy += f.z.y; so += f.z.ox; }); var cx = CX + so / fs.length; h.z.x = cx + (sx / fs.length - cx) * .5; h.z.y = CY + (sy / fs.length - CY) * .5; h.z.ox = so / fs.length; }
      else (singles[fs[0].id] = singles[fs[0].id] || []).push(h);
    });
    Object.keys(singles).forEach(function (id) {
      var f = M.nodes[id], l = singles[id].sort(function (x, y) { return (y.rows[0].h.p || 0) - (x.rows[0].h.p || 0); }), n = l.length, cols = n > 3 ? Math.ceil(n / 4) : n;
      l.forEach(function (h, j) { var col = j % cols, row = Math.floor(j / cols), rr = RF - f.z.r - 19 * k - row * 13 * k, an = f.z.a + (col - (cols - 1) / 2) * (n > 3 ? 2.5 : 3.4) * k; h.z.x = CX + f.z.ox + rr * Math.cos(rad(an)); h.z.y = CY + rr * Math.sin(rad(an)); h.z.ox = f.z.ox; });
    });
    for (var it = 0; it < 50; it++) for (var i = 0; i < vis.length; i++) for (var j = i + 1; j < vis.length; j++) {
      var A = vis[i], B = vis[j], dx = B.z.x - A.z.x, dy = B.z.y - A.z.y, d = Math.hypot(dx, dy) || .01, min = A.z.r + B.z.r + (A.vn > 1 || B.vn > 1 ? 9 : 3);
      if (d < min) { var q = (min - d) / d / 2, wa = A.vn > 1 ? 1 : .35, wb = B.vn > 1 ? 1 : .35; A.z.x -= dx * q * wa; A.z.y -= dy * q * wa; B.z.x += dx * q * wb; B.z.y += dy * q * wb; }
    }
    /* the names that are always drawn must not sit on one another: holders of three firms or more, or all of them when few are left */
    out.few = vis.length <= 30;
    var lab = vis.filter(function (h) { return out.few || h.n > 2; });
    for (it = 0; it < 30; it++) for (i = 0; i < lab.length; i++) for (j = i + 1; j < lab.length; j++) {
      var P = lab[i], Q = lab[j], wx = (P.name.length + Q.name.length + 8) * 2.9, ddx = Math.abs(Q.z.x - P.z.x), ddy = Q.z.y - P.z.y, need2 = 15 + P.z.r + Q.z.r;
      if (ddx < wx && Math.abs(ddy) < need2) { var push = (need2 - Math.abs(ddy)) / 2 * (ddy < 0 ? -1 : 1); P.z.y -= push; Q.z.y += push; }
    }
    /* countries of operation, outside the rim, near the firms that build there (not drawn while the ring is split) */
    var cl = M.countries.filter(function (c) { c.vn = 0; var sx = 0, sy = 0; Object.keys(c.firms).forEach(function (id) { var f = M.nodes[id]; if (f.side == null) return; c.vn++; sx += Math.cos(rad(f.z.a)) * c.firms[id]; sy += Math.sin(rad(f.z.a)) * c.firms[id]; }); c.m = Math.atan2(sy, sx) * 180 / Math.PI; return c.vn && !split; });
    cl.sort(function (a, b) { return ((a.m + 450) % 360) - ((b.m + 450) % 360); });
    var sep = Math.min(15, 360 / (cl.length || 1));
    for (i = 1; i < cl.length; i++) while (cl[i].m < cl[i - 1].m) cl[i].m += 360;   /* unwrapped, so a gap is a plain difference */
    for (it = 0; it < 200; it++) for (i = 0; i < cl.length - 1; i++) { var gap = cl[i + 1].m - cl[i].m; if (gap < sep) { cl[i].m -= (sep - gap) / 2; cl[i + 1].m += (sep - gap) / 2; } }
    M.countries.forEach(function (c) { var on = cl.indexOf(c) >= 0; c.side = on ? 0 : null; c.z = on ? { x: CX + RC * Math.cos(rad(c.m)), y: CY + RC * Math.sin(rad(c.m)), a: c.m, r: 4.5, ox: 0, on: 1 } : { x: c.q ? c.q.x : CX, y: c.q ? c.q.y : CY, a: c.q ? c.q.a : 0, r: 4.5, ox: 0, on: 0 }; });
    return out;
  }

  /* ---------- drawing: every mark is made once; a change of view moves it ---------- */
  function el(tag, at, parent, text) { var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; }
  function curve(a, b, pull, cx) { var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, c = [mx + (cx - mx) * pull, my + (CY - my) * pull]; return 'M' + fx(a[0]) + ',' + fx(a[1]) + ' Q' + fx(c[0]) + ',' + fx(c[1]) + ' ' + fx(b[0]) + ',' + fx(b[1]); }
  function arc(r, a0, a1, back, cx) { var p = function (a) { return [cx + r * Math.cos(rad(a)), CY + r * Math.sin(rad(a))]; }, p0 = p(back ? a1 : a0), p1 = p(back ? a0 : a1); return 'M' + fx(p0[0]) + ',' + fx(p0[1]) + ' A' + r + ',' + r + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' ' + (back ? 0 : 1) + ' ' + fx(p1[0]) + ',' + fx(p1[1]); }
  function firmLabel(f) {
    var d = f.d, c = d.cov;
    return d.n + ': ' + (d.usd == null ? 'profit ' + (typeof d.loc === 'string' ? d.loc : 'not published') : (d.usd < 0 ? 'loss of ' + money(-d.usd) : 'profit ' + money(d.usd)) + ', ' + d.fy) + '; ' + (c[2] ? fx(c[0]) + '% attributed to named holders' : 'no holder table found') + (d.sites ? '; ' + plural(d.sites, 'site') + ' mapped' : '');
  }
  function draw() {
    var svg = host.querySelector('svg'); svg.innerHTML = '';
    var gl = el('g', { 'class': 'fl' }, svg); el('g', { 'class': 'fa' }, svg); var gn = el('g', { 'class': 'fn' }, svg); el('g', { 'class': 'fd', 'aria-hidden': 'true' }, svg);
    M.sites.forEach(function (L) { L.el = el('path', { 'class': 'fk site' }, gl); L.el.style.strokeWidth = (.5 + Math.min(4, L.n) * .32).toFixed(2); });
    M.links.forEach(function (L) {
      if (L.v != null) L.halo = el('path', { 'class': 'fkh t-' + L.t }, gl);
      L.el = el('path', { 'class': 'fk t-' + L.t + (L.bad ? ' bad' : L.att == null ? ' na' : L.att < 0 ? ' neg' : '') }, gl);
    });
    var node = function (n, cls, name) { n.el = el('g', { 'class': 'fnode ' + cls, 'data-id': n.id, role: 'button', 'aria-label': name }, gn); return n.el; };
    M.countries.forEach(function (c) {
      var nf = Object.keys(c.firms).length, g = node(c, 'country', c.name + ': ' + plural(nf, 'firm') + ' with mapped sites here');
      el('rect', { x: -4.5, y: -4.5, width: 9, height: 9, rx: 2, 'class': 'fm' }, g); c.tx = el('text', { 'class': 'ft' }, g, c.name);
    });
    M.holders.concat(M.prox).forEach(function (h) {
      var shown = h.name + (h.n > 1 ? ' · ' + h.n : ''), g = node(h, 'holder t-' + h.t + (h.n > 2 ? ' multi' : h.n === 1 ? ' one' : '') + (h.att < 0 ? ' neg' : '') + (h.proxy ? ' proxy' : ''), shown + ': ' + (h.proxy ? 'a firm on the ring, ' : '') + TNAME[h.t].toLowerCase() + ', ' + h.c + '; ' + (h.n > 1 ? 'holds ' + h.n + ' firms' : 'holds ' + h.rows[0].f.d.n) + (h.att ? ', attributed profit ' + money(h.att) : ''));
      h.mk = el('circle', { 'class': 'fm' }, g); h.tx = el('text', { 'text-anchor': 'middle', 'class': 'ft' }, g, shown);
    });
    M.secs.forEach(function (s) {
      var shown = s.d.n.replace(/^Power, grid and data-centre construction$/, 'Power, grid, data centres').replace(/^Design software \(EDA\)$/, 'Design software');
      var g = node(s, 'sector', shown + ': ' + (shown === s.d.n ? '' : s.d.n + ', ') + 'sector row, no firm profiled yet');
      s.mk = el('rect', { x: -5, y: -5, width: 10, height: 10, rx: 2.5, 'class': 'fm' }, g); s.tx = el('text', { dy: '.34em', 'class': 'ft' }, g, shown);
    });
    M.firms.forEach(function (f) {
      var d = f.d, g = node(f, 'firm' + (d.usd == null ? ' none' : d.usd < 0 ? ' loss' : '') + (d.x ? ' star' : ''), firmLabel(f));
      if (f.und != null) f.gu = el('circle', { 'class': 'fu', pathLength: 100, transform: 'rotate(-90)' }, g);
      f.mk = el('circle', { 'class': 'fm' }, g); f.tx = el('text', { dy: '.34em', 'class': 'ft' }, g, d.n);
      if (f.gu) f.gu.style.strokeDasharray = fx(f.und) + ' 100';
    });
  }
  /* the layer arcs and names follow the layout; they are redrawn (and fade in) rather than moved */
  function arcs(anim) {
    var ga = host.querySelector('svg .fa'); ga.innerHTML = ''; ga.classList.remove('in');
    LAY.arcs.forEach(function (g, i) {
      var cx = CX + g.off; if (g.a1 - g.a0 < 1.2) return;
      el('path', { d: arc(RF, g.a0 + .4, g.a1 - .4, false, cx), 'class': 'farc' }, ga);
      el('path', { d: arc(RIM, g.a0 + .4, g.a1 - .4, false, cx), 'class': 'frim' }, ga);
      var mid = ((g.a0 + g.a1) / 2 % 360 + 360) % 360, flip = mid > 8 && mid < 172, id = 'isx-fw-arc-' + i, len = (g.a1 - g.a0) / 360 * 2 * Math.PI * RIM;
      var name = g.L.n.length * 7 < len - 6 ? g.L.n : g.L.s.length * 7 < len - 2 ? g.L.s : ''; if (!name) return;
      el('path', { id: id, d: arc(flip ? RIM + 15 : RIM + 6, g.a0, g.a1, flip, cx), fill: 'none' }, ga);
      el('textPath', { href: '#' + id, startOffset: '50%', 'text-anchor': 'middle' }, el('text', { 'class': 'farct' }, ga), name.toUpperCase());
    });
    LAY.tags.forEach(function (t) { var F = t.side < 0 ? S.f : S.g; el('text', { x: CX + t.side * 16, y: 24, 'text-anchor': t.side < 0 ? 'end' : 'start', 'class': 'ftag' }, ga, (t.side < 0 ? 'A · ' : 'B · ') + (scopeOf(F) || 'all other firms') + ' · ' + plural(t.n, 'firm')); });
    if (S.lens === 'earned' && wip('booked')) {   /* preset 9: “booked” is an empty, labelled ring until the data lands */
      var as = M.countries.filter(function (c) { return c.z.on; }).map(function (c) { return ((c.z.a % 360) + 360) % 360; }).sort(function (a, b) { return a - b; }), best = [0, 90];   /* its label goes where the countries leave the widest gap */
      as.forEach(function (a, i) { var b = i + 1 < as.length ? as[i + 1] : as[0] + 360; if (b - a > best[0]) best = [b - a, (a + b) / 2]; });
      var bm = best[1] % 360, bf = bm > 0 && bm < 180;
      el('circle', { cx: CX, cy: CY, r: RB, 'class': 'fbook' }, ga); el('path', { id: 'isx-fw-book', d: arc(RB, bm - 24, bm + 24, bf, CX), fill: 'none' }, ga);
      el('textPath', { href: '#isx-fw-book', startOffset: '50%', 'text-anchor': 'middle' }, el('text', { 'class': 'fbookt', dy: '.34em' }, ga), 'WHERE IT IS BOOKED · WIP');
    }
    if (anim) { void ga.getBoundingClientRect(); ga.classList.add('in'); }
  }
  /* one frame: every mark at its place between where it was (q) and where it goes (z) */
  function put(u) {
    var id, n, c, t, p = {};
    for (id in M.nodes) {
      n = M.nodes[id]; c = n.q; t = n.z; var x = c.x + (t.x - c.x) * u, y = c.y + (t.y - c.y) * u, r = c.r + (t.r - c.r) * u, a = c.a + (t.a - c.a) * u, ox = c.ox + (t.ox - c.ox) * u;
      n.p = [x, y]; n.pr = r; n.pa = a; n.po = ox; n.el.setAttribute('transform', 'translate(' + fx(x) + ',' + fx(y) + ')');
      if (n.kind === 'holder') { n.mk.setAttribute('r', fx(r)); n.tx.setAttribute('y', fx(-r - 4)); }
      else if (n.kind === 'country') { var cs = Math.cos(rad(a)), sn = Math.sin(rad(a)), mid = Math.abs(cs) < .3; n.tx.setAttribute('text-anchor', mid ? 'middle' : cs > 0 ? 'start' : 'end'); n.tx.setAttribute('x', mid ? 0 : cs > 0 ? 10 : -10); n.tx.setAttribute('y', mid ? (sn > 0 ? 18 : -10) : 3.5); }
      else {
        var flip = Math.cos(rad(a)) < 0;
        if (n.kind === 'firm') { n.mk.setAttribute('r', fx(r)); if (n.gu) n.gu.setAttribute('r', fx(r + 3.6)); } else n.mk.setAttribute('transform', 'rotate(' + fx(a) + ')');
        n.tx.setAttribute('transform', 'rotate(' + fx(flip ? a + 180 : a) + ')'); n.tx.setAttribute('x', fx((flip ? -1 : 1) * (r + 6))); n.tx.setAttribute('text-anchor', flip ? 'end' : 'start');
      }
    }
    M.links.forEach(function (L) { var s = src(L), d = curve(s.p, L.b.p, L.kind === 'ff' ? (s === L.px ? .12 : .5) : s.vn > 1 ? .08 : 0, CX + (s.po + L.b.po) / 2); L.el.setAttribute('d', d); if (L.halo) L.halo.setAttribute('d', d); });
    M.sites.forEach(function (L) { L.el.setAttribute('d', curve(L.a.p, L.b.p, -.06, CX)); });
  }
  var EASE = (function (x1, y1, x2, y2) {   /* the page's one curve, cubic-bezier(.2,.8,.2,1), for what is moved by script */
    var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    return function (x) { var t = x, i; for (i = 0; i < 6; i++) t -= (((ax * t + bx) * t + cx) * t - x) / ((3 * ax * t + 2 * bx) * t + cx || 1e-6); t = Math.max(0, Math.min(1, t)); return ((ay * t + by) * t + cy) * t; };
  })(.2, .8, .2, 1);
  var runs = [];
  function run(ms, step, done) { var t0 = null, id = 0, dead = false, f = function (ts) { if (dead) return; if (t0 == null) t0 = ts; var u = Math.min(1, (ts - t0) / ms); step(u); if (u < 1) id = requestAnimationFrame(f); else if (done) done(); }; id = requestAnimationFrame(f); var stopIt = function () { dead = true; cancelAnimationFrame(id); }; runs.push(stopIt); return stopIt; }
  function halt() { runs.forEach(function (f) { f(); }); runs = []; if (!host) return; var gd = host.querySelector('svg .fd'); if (gd) gd.innerHTML = ''; [].forEach.call(host.querySelectorAll('.ftick.run'), function (t) { ticking(t, null); }); }
  /* a line that enters the view is drawn outward from the firm, once */
  function drawIn(L, delay, ms) {
    if (!L.el.animate || L.att == null || L.att < 0 || L.bad) return;
    L.el.setAttribute('pathLength', 1);
    var an = L.el.animate([{ strokeDasharray: '1 1', strokeDashoffset: -1 }, { strokeDasharray: '1 1', strokeDashoffset: 0 }], { duration: ms || 420, delay: delay || 0, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
    an.onfinish = an.oncancel = function () { L.el.removeAttribute('pathLength'); };
  }
  /* apply the view in force: lay out, set what is lit, move there (or swap, when still) */
  function relay(anim, sweep) {
    halt(); anim = anim && !still();
    var was = {}; M.links.forEach(function (L, i) { was[i] = L.shown; });
    LAY = layout();
    for (var id in M.nodes) { var n = M.nodes[id]; if (!n.q) n.q = n.z; else if (n.p) n.q = { x: n.p[0], y: n.p[1], r: n.pr, a: n.pa, ox: n.po }; while (n.z.a - n.q.a > 180) n.z.a -= 360; while (n.z.a - n.q.a < -180) n.z.a += 360; }
    var svg = host.querySelector('svg'), votes = S.lens === 'votes';
    M.links.forEach(function (L) { L.vis = L.b.side != null; L.lit = linkOn(L); L.shown = L.vis && (L.lit || !anyF()); var w = (votes && L.p != null ? .6 + 1.1 * Math.sqrt(L.p) : L.w0 * LAY.k); L.el.style.strokeWidth = w.toFixed(2); if (L.halo) L.halo.style.strokeWidth = (.6 + 1.1 * Math.sqrt(L.v)).toFixed(2); });
    M.sites.forEach(function (L) { L.vis = L.a.side != null && L.b.side != null; });
    svg.classList.toggle('split', !!LAY.split); svg.classList.toggle('few', !!LAY.few);
    ['votes', 'undisclosed', 'earned', 'losses', 'ring', 'debt'].forEach(function (l) { svg.classList.toggle('l-' + l, S.lens === l); });
    arcs(anim); mark();
    var end = function () { for (var id2 in M.nodes) M.nodes[id2].q = M.nodes[id2].z; put(1); };
    if (!anim) { end(); return; }
    put(0);
    run(440, function (u) { put(EASE(u)); }, end);
    var fresh = M.links.filter(function (L, i) { return L.shown && L.lit && anyF() && (sweep || !was[i]); });
    if (sweep) {   /* preset 1: the lines draw in one after another, largest first, and the total runs up with them */
      fresh.sort(function (a, b) { return (b.att || 0) - (a.att || 0); });
      var step = Math.min(110, 1500 / (fresh.length || 1)), tot = 0, acc = fresh.map(function (L) { tot += Math.max(0, L.att || 0); return tot; }), all = 300 + fresh.length * step + 380, tk = null;
      fresh.forEach(function (L, i) { drawIn(L, 300 + i * step, 380); });
      run(all, function (u) { tk = tk || host.querySelector('.wcard .ftick'); var i = Math.min(fresh.length - 1, Math.floor((u * all - 300) / step)); ticking(tk, money(i < 0 ? 0 : acc[i])); }, function () { ticking(tk, null); });
    } else fresh.forEach(function (L) { drawIn(L, 120, 420); });
  }
  function mark() {
    var svg = host.querySelector('svg'), n = S.sel && M.nodes[S.sel], near = {}, flt = anyF(), live = {}, hf = flt && (S.lens === 'ring' || S.lens === 'votes' || hasHF(S.f) || (S.cmp && hasHF(S.g)));
    if (n) { near[n.id] = 1; n.links.forEach(function (id) { near[id] = 1; }); if (n.kind === 'firm' && M.nodes['p:' + n.d.id]) near['p:' + n.d.id] = 1; if (n.proxy) near[n.proxy.id] = 1; }
    M.links.forEach(function (L) {
      var s = src(L), on = !!n && (L.a.id === S.sel || L.b.id === S.sel || (L.px && L.px.id === S.sel));
      if (L.vis && L.lit) { live[s.id] = 1; live[L.b.id] = 1; }
      L.el.classList.toggle('on', on); L.el.classList.toggle('off', flt && L.vis && !L.lit); L.el.classList.toggle('out', !L.vis);
      if (L.halo) L.halo.classList.toggle('out', !L.vis || !L.lit);
    });
    M.sites.forEach(function (L) { L.el.classList.toggle('on', !!n && (L.a.id === S.sel || L.b.id === S.sel)); L.el.classList.toggle('out', !L.vis); });
    Object.keys(M.nodes).forEach(function (id) {
      var x = M.nodes[id], out = !x.z.on, off = !out && hf && (x.kind === 'sector' || ((x.kind === 'holder' || x.kind === 'firm') && !live[id]));
      x.el.classList.toggle('on', !!near[id]); x.el.classList.toggle('sel', id === S.sel); x.el.classList.toggle('off', off); x.el.classList.toggle('out', out);
      x.el.setAttribute('aria-pressed', String(id === S.sel)); x.el.setAttribute('tabindex', out || x.kind === 'holder' ? '-1' : '0');
      if (out) x.el.setAttribute('aria-hidden', 'true'); else x.el.removeAttribute('aria-hidden');
    });
    svg.classList.toggle('hl', !!n); svg.classList.toggle('calm', S.calm); svg.classList.toggle('flt', flt); svg.classList.toggle('hf', !!hf);
  }
  /* the claim flows: a few small dots run once along a picked mark's lines, from the firm to the owner, and the figure runs up */
  function flow() {
    var n = S.sel && M.nodes[S.sel]; if (!n || still() || S.table) return;
    var gd = host.querySelector('svg .fd'), ls = M.links.filter(function (L) { return L.vis && L.att > 0 && (L.a.id === n.id || L.b.id === n.id || (L.px && L.px.id === n.id)); }).sort(function (a, b) { return b.att - a.att; }).slice(0, 24);
    var dots = []; ls.forEach(function (L, i) { var len = L.el.getTotalLength(), k = L.att > 1000 ? 3 : L.att > 100 ? 2 : 1; for (var j = 0; j < k; j++) dots.push({ L: L, len: len, d: Math.min(.25, i * .012) + j * .13, e: el('circle', { r: fx(1.6 + .5 * LAY.k), 'class': 'fdot t-' + L.t }, gd) }); });
    var tk = host.querySelector('.wcard .ftick'), v = tk ? +tk.dataset.v : 0, fmt = tk && tk.dataset.f === 'pc' ? function (x) { return fx(x) + '%'; } : money;
    if (!dots.length) return;
    ticking(tk, fmt(0));
    run(1200, function (u) {
      dots.forEach(function (o) { var q = Math.max(0, Math.min(1, (u - o.d) / .62)), e = EASE(q), p = o.L.el.getPointAtLength(o.len * (1 - e)); o.e.setAttribute('cx', fx(p.x)); o.e.setAttribute('cy', fx(p.y)); o.e.style.opacity = q <= 0 || q >= 1 ? 0 : 1; });
      ticking(tk, fmt(v * EASE(Math.max(0, Math.min(1, (u - .3) / .7)))));
    }, function () { gd.innerHTML = ''; ticking(tk, null); });
  }

  /* ---------- the card ---------- */
  var METHOD = ['Attributed profit* = a firm’s latest full-year net income attributable to its shareholders × the holder’s stake, as a share of all shares outstanding, as last disclosed. US dollars at the fiscal year’s average rate.',
    'One level only: a holder that is itself a firm on the ring is marked and not looked through, so nothing is counted twice.',
    'An asset manager holds for clients: the profit is attributed to the manager, marked, never to the savers behind it.',
    'Nominees and depositary banks are not owners: shown, never attributed. Attribution follows the stake, not the votes; a share of one class only is shown and not attributed.',
    'It is a claim on earnings, not dividends received, and never an estimate of an undisclosed stake: what no filing names stays “dispersed or not disclosed”.'];
  var star = '<abbr class="fst" title="Derived: profit × stake. See “How we count”.">*</abbr>';
  var tick = function (v, f) { return '<span class="ftick" data-v="' + v + '"' + (f ? ' data-f="' + f + '"' : '') + '>' + (f === 'pc' ? fx(v) + '%' : money(v)) + '</span>'; };   /* the text is always the final figure; while it runs, the running figure is drawn over it (data-t), so a screen reader hears it once */
  var ticking = function (tk, t) { if (!tk) return; if (t == null) { tk.classList.remove('run'); tk.removeAttribute('data-t'); } else { tk.classList.add('run'); tk.setAttribute('data-t', t); } };
  var scopeOf = function (F) { return F.L.map(function (i) { return D.layers[+i].n.toLowerCase(); }).concat(F.fc.length > 4 && same(F.fc, M.nonUS) ? ['outside the United States'] : F.fc).join(', '); };
  var lk = function (id, name) { return '<button type="button" class="wlk" data-fw="' + esc(id) + '">' + esc(name) + '</button>'; };
  function barsHTML(Z, click) {
    var T = Z.P || 1, rest = Math.max(0, Z.P - Z.att), k = S.by === 'type' ? 'ht' : 'hc';
    var bar = function (name, v, cls, key) {
      var w = Math.max(.6, v / T * 100).toFixed(1), in1 = '<b>' + esc(name) + '</b><i><u style="width:' + w + '%"></u></i><span>' + money(v) + ' · ' + (v / T * 100).toFixed(1) + '%</span>', on = key && S.f[k].indexOf(key) >= 0;
      return key && click ? '<button type="button" class="fbar ' + cls + (on ? ' on' : '') + '" data-fwb="' + esc(key) + '" aria-pressed="' + on + '">' + in1 + '</button>' : '<div class="fbar ' + cls + '">' + in1 + '</div>';
    };
    return '<div class="fbars">' + Z.rows.map(function (r) { return bar(S.by === 'type' ? TNAME[r.k] : r.k, r.v, S.by === 'type' ? 't-' + r.k : 'cty', r.k); }).join('') + bar('Dispersed or not disclosed', rest, 'rest', '') + '</div>';
  }
  var segHTML = function () { return '<div class="fseg" role="group" aria-label="Sum the attributed profit by"><button type="button" data-fwby="type" aria-pressed="' + (S.by === 'type') + '">By holder type</button><button type="button" data-fwby="country" aria-pressed="' + (S.by === 'country') + '">By holder’s country</button></div>'; };
  var sumLine = function (Z, scope) { return '<p>' + (scope ? '<span class="fscope">' + esc(scope) + '</span> ' : '') + plural(Z.n, 'firm') + ' booked <b>' + money(Z.P) + '</b> in their latest full year. <b>' + (Z.att / (Z.P || 1) * 100).toFixed(1) + '%</b> of it can be attributed' + star + ' to a holder a filing names.</p>'; };
  var outside = function (Z) { return Z.loss.length || Z.none.length ? '<p class="wnote">Outside the sum: ' + (Z.loss.length ? 'losses (' + esc(Z.loss.map(function (f) { return f.d.n + ' ' + money(f.d.usd); }).join(', ') + ')') : '') + (Z.loss.length && Z.none.length ? '; ' : '') + (Z.none.length ? 'no profit published or found (' + esc(Z.none.map(function (f) { return f.d.n; }).join(', ')) + ')' : '') + '.</p>' : ''; };
  var howHTML = function () {
    return '<button type="button" class="fhowb" data-fw="how" aria-expanded="' + S.how + '">How we count <span aria-hidden="true">' + (S.how ? '−' : '+') + '</span></button>'
      + (S.how ? '<ul class="fhow">' + METHOD.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '<li>' + D.flagged + ' figures are starred or in conflict between sources; each firm’s card says which. Holder types and countries are the filings’ own wording, grouped.</li></ul>' : '');
  };
  var viewList = function () { return '<ol class="fvs">' + PRE.map(function (P) { return '<li><button type="button" class="fv1' + (S.view === P.id ? ' on' : '') + '" data-fwv="' + P.id + '"><span aria-hidden="true">' + (P.i + 1) + '</span><b>' + esc(P.t) + '</b>' + (P.part && wip(P.part) ? pill() : '') + '</button></li>'; }).join('') + '</ol>'; };
  var viewsHTML = function () {
    return '<div class="wk3 sub">Ten views</div>' + viewList() + '<p class="wnote">A view fills the filters above the picture. Change them to build your own.</p>';
  };
  /* the older ownership web's card at rest: its counts, the owners that hold the most firms, head offices, the empty sheets */
  function moreHTML() {
    var multi = M.holders.filter(function (x) { return x.n > 1; }).sort(function (a, b) { return b.n - a.n; }), seats = {};
    M.holders.forEach(function (x) { seats[x.c] = (seats[x.c] || 0) + 1; });
    var sl = Object.keys(seats).sort(function (a, b) { return seats[b] - seats[a]; }), un = SH ? SH.firms.filter(function (f) { return f.status === 'not yet mapped'; }).map(function (f) { return f.name; }) : [];
    return '<p>' + M.firms.length + ' firms, ' + plural(M.holders.length, 'owner') + ' named in filings and ' + plural(M.countries.length, 'country', 'countries') + ' of operation. Coloured lines are stakes, thicker for a larger attributed profit' + star + '; white lines run to where a firm builds.</p>'
      + '<div class="wfacts">' + multi.slice(0, 4).map(function (x) { return '<button type="button" class="wf" data-fw="' + esc(x.id) + '"><b>' + x.n + '</b><span>' + esc(x.name) + '</span></button>'; }).join('') + '</div>'
      + '<div class="wk3 sub">Owners shown, by head office</div><div class="wseat">' + sl.map(function (c) { return '<span><b>' + seats[c] + '</b>' + esc(c) + '</span>'; }).join('') + '</div>'
      + '<p class="wnote">A head office is not where the money comes from: index-fund managers hold for savers worldwide. Pick any mark for its lines; pick a firm for its owners and sites.</p>'
      + (SH ? '<div class="wsh"><div class="wk3">Data sheets <span>structure ready, not yet filled</span></div>'
        + SH.sheets.map(function (s) { return '<div class="wsr" tabindex="0" data-tip="<b>' + esc(s.title) + '</b><p>' + esc(s.what) + '</p><p class=\'ts\'>Columns: ' + esc(s.columns.join(', ').replace(/_/g, ' ')) + '</p>"><b>' + esc(s.title) + '</b><span>' + s.columns.length + ' columns · ' + plural(s.rows.length, 'row') + '</span></div>'; }).join('')
        + (un.length ? '<p class="wnote">Named in the sheets as not yet mapped: ' + esc(un.join(', ')) + '. Their owners are on the ring now; their sites are not mapped.</p>' : '') + '</div>' : '');
  }
  function restHTML() {
    var Z = sums(inView), own = anyF();
    return '<div class="wk3">Firms · profits, owners and sites</div><h3>Whose profits are they?</h3>' + sumLine(Z, scopeOf(S.f))
      + (own ? '<button type="button" class="wback" data-fw="views">All ten views</button>' : viewsHTML())
      + segHTML() + barsHTML(Z, true)
      + '<p class="wnote">A mark’s size is the firm’s profit; a line’s width, the profit attributed' + star + ' to that holder. White lines run to where a firm builds. ' + (S.by === 'country' ? 'A head office is not where the money comes from: an asset manager holds for savers worldwide. ' : '') + 'Pick a bar, a firm or a holder.</p>'
      + outside(Z) + howHTML()
      + '<button type="button" class="fhowb" data-fw="more" aria-expanded="' + S.more + '">The web in numbers <span aria-hidden="true">' + (S.more ? '−' : '+') + '</span></button>' + (S.more ? '<div class="fmore">' + moreHTML() + '</div>' : '');
  }
  function cmpHTML(names) {
    var blk = function (side, F, lab) { var Z = sums(function (f) { return LAY.split ? f.side === side : f.side != null; }); return '<div class="fgrp"><div class="wk3 sub">' + esc(lab) + '</div>' + sumLine(Z, '') + barsHTML(Z, false) + '</div>'; };
    return blk(-1, S.f, names ? names[0] : 'Group A · ' + (scopeOf(S.f) || (hasFF(S.g) ? 'all other firms' : 'all firms'))) + blk(1, S.g, names ? names[1] : 'Group B · ' + (scopeOf(S.g) || (hasFF(S.f) ? 'all other firms' : 'all firms')));
  }
  /* what each view says, worked out from the data in the view (so a top-up of the data changes the sentence with the picture) */
  var READ = {
    claim: function () {
      var by = {}, tot = 0; M.links.forEach(function (L) { if (L.vis && L.lit && L.att > 0) { by[L.b.id] = (by[L.b.id] || 0) + L.att; tot += L.att; } });
      var rows = Object.keys(by).sort(function (a, b) { return by[b] - by[a]; }), top = rows.filter(function (id) { return by[id] >= 100; }).slice(0, 5);
      return { p: 'US holders’ attributed profit' + star + ' in firms outside the United States: ' + top.map(function (id) { return esc(M.nodes[id].d.n) + ' ' + money(by[id]); }).join(', ') + '. Together ' + tick(Math.round(tot)) + '.',
        list: rows.map(function (id) { return '<li>' + lk(id, M.nodes[id].d.n) + '<span class="fv">' + money(by[id]) + star + '</span></li>'; }) };
    },
    systems: function () {
      var one = function (side, name) { var Z = sums(function (f) { return f.side === side; }); return name + ' (' + money(Z.P) + ' of profit): ' + Z.rows.filter(function (r) { return r.v / (Z.P || 1) >= .0005; }).map(function (r) { return (S.by === 'type' ? TSHORT[r.k] : r.k) + ' ' + (r.v / Z.P * 100).toFixed(1) + '%'; }).join(', ') + '.'; };
      return { p: one(-1, 'US firms') + ' ' + one(1, 'Chinese firms'), html: segHTML() + cmpHTML(['A · US firms', 'B · Chinese firms']), nobars: 1 };
    },
    state: function () {
      var hs = {}, fs = {}, tot = 0; M.links.forEach(function (L) { if (L.vis && L.lit) { var s = src(L); hs[s.id] = (hs[s.id] || 0) + Math.max(0, L.att || 0); fs[L.b.id] = 1; tot += Math.max(0, L.att || 0); } });
      var rows = Object.keys(hs).sort(function (a, b) { return hs[b] - hs[a]; });
      return { p: plural(rows.length, 'state holder') + ' hold stakes in ' + plural(Object.keys(fs).length, 'firm') + ' on the ring; ' + money(tot) + ' of the firms’ profits is attributed' + star + ' to them.', note: 'One level only, so state ownership through state-owned firms is understated.',
        list: rows.slice(0, 8).map(function (id) { var h = M.nodes[id]; return '<li>' + lk(id, h.name) + '<span class="fv">' + (hs[id] ? money(hs[id]) + star : '–') + '</span><span>' + esc(h.c) + ' · ' + plural(h.rows.length, 'stake') + '</span></li>'; }) };
    },
    chokepoints: function () {
      var Z = sums(inView), fs = M.firms.filter(inView).sort(function (a, b) { return (b.d.usd || 0) - (a.d.usd || 0); });
      return { p: plural(fs.length, 'firm') + ' of the tools layer. ' + (Z.n === fs.length ? 'They' : 'The ' + Z.n + ' with a published profit') + ' booked ' + money(Z.P) + '; ' + (Z.att / (Z.P || 1) * 100).toFixed(1) + '% of it is attributed' + star + ' to holders a filing names.',
        list: fs.map(function (f) { var top = f.rows.filter(function (x) { return x.h.s === 'A'; }).sort(function (a, b) { return (b.h.p || 0) - (a.h.p || 0); })[0]; return '<li>' + lk(f.id, f.d.n) + '<span class="fv">' + (f.d.usd == null ? '–' : money(f.d.usd)) + '</span><span>' + (top ? 'largest named holder: ' + esc(top.h.n) + ' · ' + pc(top.h.p) : 'no attributed holder') + '</span></li>'; }) };
    },
    ring: function () {
      var ls = M.links.filter(function (L) { return L.vis && L.lit; }).sort(function (a, b) { return (b.rows[0].p || 0) - (a.rows[0].p || 0); });
      return { p: plural(ls.length, 'stake') + ' run between firms on the ring, the largest ' + ls.slice(0, 3).map(function (L) { return esc(L.a.d.n) + ' in ' + esc(L.b.d.n) + ' (' + pc(L.rows[0].p) + ')'; }).join(', ') + '. Stakes, not supply contracts.',
        list: ls.map(function (L) { var h = L.rows[0]; return '<li' + (h.s !== 'A' ? ' class="na"' : '') + '>' + lk(L.a.id, L.a.d.n) + '<span class="fv">' + pc(h.p) + (h.a != null ? ' · ' + money(h.a) + star : '') + '</span><span>in ' + lk(L.b.id, L.b.d.n) + (h.s !== 'A' ? ' · <em>not attributed: ' + WHY[h.s] + '</em>' : '') + '</span></li>'; }) };
    },
    votes: function () {
      var rows = []; M.links.forEach(function (L) { if (L.vis && L.lit) L.rows.forEach(function (h) { if (h.v != null && h.s !== 'HIST') rows.push({ L: L, h: h, gap: num(h.v) != null && h.p != null ? num(h.v) - h.p : -1e3 }); }); });
      rows.sort(function (a, b) { return b.gap - a.gap; }); var t = rows[0], fs = {}; rows.forEach(function (r) { fs[r.L.b.id] = 1; });
      return { p: 'In ' + plural(Object.keys(fs).length, 'firm') + ' a filing prints votes beside the stake.' + (t && t.gap > 0 ? ' The widest gap: ' + esc(t.h.n) + ', ' + pc(t.h.p) + ' of ' + esc(t.L.b.d.n) + '’s shares and ' + pc(num(t.h.v)) + ' of its votes.' : ''), note: 'Here a line’s core is the stake and its pale band the votes.',
        list: rows.map(function (r) { var v = num(r.h.v), words = typeof r.h.v === 'string' && !/^\d+(\.\d+)?$/.test(r.h.v); return '<li>' + lk(src(r.L).id, r.h.n) + '<span class="fv">' + pc(r.h.p) + ' → ' + (v != null ? pc(v) : 'in words') + '</span><span>stake → votes · ' + lk(r.L.b.id, r.L.b.d.n) + (words ? ' · as printed: ' + esc(r.h.v) : '') + '</span></li>'; }) };
    },
    losses: function () {
      var fs = M.firms.filter(inView).sort(function (a, b) { return a.d.usd - b.d.usd; }), tot = 0, att = 0; fs.forEach(function (f) { tot += f.d.usd; f.rows.forEach(function (x) { if (x.h.a < 0) att += x.h.a; }); });
      return { p: plural(fs.length, 'firm') + ' booked losses of ' + money(-tot) + ' together (' + fs.map(function (f) { return esc(f.d.n) + ' ' + money(f.d.usd); }).join(', ') + '). ' + (att / (tot || 1) * 100).toFixed(1) + '% of it is attributed' + star + ' to holders a filing names.', nobars: 1,
        list: fs.map(function (f) { var top = f.rows.filter(function (x) { return x.h.a < 0; }).sort(function (a, b) { return a.h.a - b.h.a; }).slice(0, 3); return '<li>' + lk(f.id, f.d.n) + '<span class="fv">' + money(f.d.usd) + '</span><span>' + (top.length ? top.map(function (x) { return esc(x.h.k) + ' ' + money(x.h.a) + '*'; }).join(' · ') : 'no attributed holder') + '</span></li>'; }) };
    },
    undisclosed: function () {
      var Z = sums(inView), fs = M.firms.filter(inView).sort(function (a, b) { return b.und - a.und; }), full = fs.filter(function (f) { return f.und < .05; });
      return { p: 'Of the ' + money(Z.P) + ' booked by ' + plural(Z.n, 'firm') + ' in profit, ' + ((Z.P - Z.att) / (Z.P || 1) * 100).toFixed(1) + '% is dispersed or not disclosed. Least named: ' + fs.slice(0, 3).map(function (f) { return esc(f.d.n) + ' (' + fx(f.und) + '%)'; }).join(', ') + (full.length ? '; fully named: ' + full.map(function (f) { return esc(f.d.n); }).join(', ') : '') + '.', note: 'The ring is sorted by the share no filing names; the pale arc round a mark is that share.',
        list: fs.map(function (f) { return '<li>' + lk(f.id, f.d.n) + '<span class="fv">' + fx(f.und) + '% · ' + money(f.d.usd * f.und / 100) + '</span></li>'; }) };
    },
    earned: function () {
      var fs = M.firms.filter(inView), n = 0, cs = {}; fs.forEach(function (f) { Object.keys(f.sites).forEach(function (iso) { cs[iso] = (cs[iso] || 0) + f.sites[iso]; n += f.sites[iso]; }); });
      var cl = Object.keys(cs).sort(function (a, b) { return cs[b] - cs[a]; }), Z = sums(inView), B = wip('booked');
      return { p: plural(fs.length, 'firm') + ' have ' + plural(n, 'mapped site') + ' in ' + plural(cl.length, 'country', 'countries') + '; the holders their filings name sit in ' + Z.rows.length + '. Where the profits are booked is not collected yet.', nobars: 1,
        html: '<div class="wk3 sub">Earned · sites by country</div><div class="wseat">' + cl.map(function (iso) { return '<button type="button" data-fw="c:' + iso + '"><b>' + cs[iso] + '</b>' + esc(cname(iso)) + '</button>'; }).join('') + '</div><p class="wnote">The lists of sites are not complete.</p>'
          + '<div class="wk3 sub">Booked</div>' + (B ? wipNote(B) : '<p class="wnote">Not collected.</p>')
          + '<div class="wk3 sub">Owned · named holders</div>' + segHTML() + barsHTML(Z, true) };
    },
    debt: function () {
      var B = wip('debt');
      return { p: 'What is tied to each firm without sitting on its balance sheet: the vehicles, what they financed and who lent to them.', nobars: 1, html: B ? wipNote(B) : '' };
    }
  };
  function viewHTML(P) {
    var R = READ[P.id](), Z = sums(inView);
    return '<div class="wk3">View ' + (P.i + 1) + ' of ' + PRE.length + (P.part && wip(P.part) ? ' ' + pill() : '') + '</div><h3>' + esc(P.t) + '</h3><p class="fread">' + R.p + '</p>'
      + (R.note ? '<p class="wnote">' + esc(R.note) + '</p>' : '')
      + (R.list && R.list.length ? '<ul class="wlist fown fvl">' + R.list.join('') + '</ul>' : '') + (R.html || '')
      + (R.nobars ? '' : segHTML() + barsHTML(Z, true) + outside(Z))
      + (P.id === 'debt' ? '' : '<p class="wnote">The filters above the picture are set to this view. Change them to build your own.</p>')
      + '<button type="button" class="wback" data-fw="views">All ten views</button>' + (P.id === 'debt' ? '' : howHTML());
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
    var d = n.d, c = d.cov, o = n.o, conv = '', sh = SH && d.old ? SH.firms.filter(function (f) { return f.name === d.old; })[0] : null;
    if (d.usd != null && d.ccy && d.ccy !== 'USD' && d.fx) conv = d.ccy + ' ' + Number(d.loc).toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'm at ' + d.fx + (d.fxd === 'u' ? ' USD per ' + d.ccy : ' per USD') + ' (' + d.fxb + '). ';
    var seat = [d.city, d.seat || d.home].filter(Boolean).join(', ') + (d.hx ? '*' : ''), list = /^not /.test(d.list) ? 'not recorded' : d.list.replace(/\s*\*general knowledge.*$/, '');
    var by = Object.keys(n.sites);
    return '<div class="wk3">' + esc(D.layers[d.L].n) + ' · ' + esc(d.home) + '</div><h3>' + esc(d.full) + '</h3>'
      + '<div class="ftiles"><div><small>' + (d.usd < 0 ? 'Loss' : 'Profit') + ' · ' + esc(d.fy || 'latest year') + '</small><b>' + (d.usd == null ? esc(typeof d.loc === 'string' ? d.loc : 'not published') : money(Math.abs(d.usd))) + (d.x ? '*' : '') + '</b></div>'
      + '<div><small>Attributed' + star + ' to named holders</small><b>' + (c[2] ? tick(c[0], 'pc') : '–') + '</b></div></div>'
      + '<p class="wnote">' + esc(conv) + esc(stop(d.def)) + (d.fye ? ' Year to ' + esc(day(d.fye)) + '.' : '') + '</p>'
      + (o ? '<p class="fline' + (o.control === 'disputed' ? ' bad' : '') + '"><b>Control</b> ' + esc(CONTROL[o.control] || '') + '</p>' + (o.summary ? '<p class="fsum">' + esc(o.summary) + '</p>' : '') : '')
      + (sh ? '<p class="fline"><b>Bloc</b> ' + esc(sh.bloc.charAt(0).toUpperCase() + sh.bloc.slice(1)) + (sh.group !== sh.bloc && !/^Outside/.test(sh.group) ? ' · ' + esc(sh.group) : '') + '</p>' : '')
      + '<div class="wk3 sub">Where it is booked and listed</div><p class="fline"><b>Seat</b> ' + esc(seat || 'not recorded') + '</p><p class="fline"><b>Listed</b> ' + esc(list) + '</p>'
      + '<div class="wk3 sub">Whose it is</div>'
      + (n.rows.length ? '<ul class="wlist fown">' + n.rows.slice().sort(function (a, b) { return (b.h.s === 'A') - (a.h.s === 'A') || (b.h.p || 0) - (a.h.p || 0); }).map(function (x) { return rowHTML(x, false); }).join('') + '</ul>'
        + '<p class="wnote">' + fx(c[0]) + '% attributed' + (c[1] ? '; ' + fx(c[1]) + '% passes through nominees or depositaries' : '') + '; ' + fx(100 - c[0]) + '% dispersed or not disclosed.' + (d.note ? ' ' + esc(d.note) : '') + '</p>'
        : '<p class="wnote">No holder table found.' + (d.note ? ' ' + esc(d.note) : '') + '</p>')
      + (n.owns.length ? '<div class="wk3 sub">Holds, on the ring</div><ul class="wlist fown">' + n.owns.map(function (x) { return rowHTML({ h: x.h, f: x.f, name: x.h.n }, true); }).join('') + '</ul>' : '')
      + '<div class="wk3 sub">Where it is earned</div>' + (o ? (by.length ? '<p class="fline">' + plural(d.sites, 'site') + ' mapped in ' + plural(by.length, 'country', 'countries') + '.</p><div class="wseat">' + by.map(function (iso) { return '<button type="button" data-fw="c:' + iso + '"><b>' + n.sites[iso] + '</b>' + esc(cname(iso)) + '</button>'; }).join('') + '</div>' : '<p class="wnote">Sites not yet mapped.</p>')
        + '<button type="button" class="wgo" data-fw="globe">Open its footprint on the globe <span aria-hidden="true">→</span></button>' : '<p class="wnote">Sites not mapped.</p>')
      + (o && (o.holders || []).length ? '<details class="fold2"><summary>Owners above the threshold, as on the globe’s card · ' + esc(OWN.asof || '') + '</summary><ul class="wlist">' + o.holders.map(function (x) { return '<li><b>' + esc(x.name) + '</b><span>' + esc(x.txt || '') + ' · ' + esc(cname(x.iso)) + (x.date ? ' · ' + esc(x.date) : '') + '</span></li>'; }).join('') + '</ul></details>' : '')
      + (d.fl ? '<p class="wnote">' + (d.x ? '* ' : 'Note: ') + esc(stop(d.fl)) + '</p>' : '')
      + (d.doc ? '<p class="wsrc">Holders: ' + (/^https?:/.test(d.doc[1]) ? '<a href="' + esc(d.doc[1]) + '" target="_blank" rel="noopener">' + esc(d.doc[0]) + '</a>' : esc(d.doc[0])) + '</p>' : '');
  }
  function holderHTML(n) {
    var rows = n.rows.slice().sort(function (a, b) { return (b.h.a || 0) - (a.h.a || 0) || (b.h.p || 0) - (a.h.p || 0); });
    return '<div class="wk3 t-' + n.t + '">Owner · ' + esc(TNAME[n.t]) + '</div><h3>' + esc(n.name) + '</h3>'
      + '<div class="ftiles"><div><small>Attributed profit' + star + '</small><b>' + (n.att ? tick(Math.round(n.att)) : '–') + '</b></div><div><small>Firms on the ring</small><b>' + n.n + '</b></div></div>'
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
  /* from the older ownership web: a country of operation */
  function countryHTML(n) {
    var ids = Object.keys(n.firms).sort(function (a, b) { return n.firms[b] - n.firms[a]; });
    return '<div class="wk3">Country of operation</div><h3>' + esc(n.name) + '</h3><p>' + plural(ids.length, 'firm') + ' of the ' + M.sited.length + ' with mapped sites have sites here that the sources name. The lists of sites are not complete.</p>'
      + '<ul class="wlist fown">' + ids.map(function (id) { return '<li>' + lk(id, M.nodes[id].d.n) + '<span class="fv">' + plural(n.firms[id], 'site') + '</span></li>'; }).join('') + '</ul>';
  }
  function card() {
    var c = host.querySelector('.wcard'), n = S.sel && M.nodes[S.sel], P = PBY[S.view];
    if (n && n.proxy) n = n.proxy;
    c.innerHTML = (n ? (n.kind === 'firm' ? firmHTML(n) : n.kind === 'holder' ? holderHTML(n) : n.kind === 'country' ? countryHTML(n) : sectorHTML(n)) + '<button type="button" class="wback" data-fw="">' + (P ? 'Back to the view' : 'Back to the whole web') + '</button>'
      : P ? viewHTML(P) : S.cmp ? '<div class="wk3">Firms · two groups</div><h3>Whose profits are they?</h3>' + (hasFF(S.f) || hasFF(S.g) || hasHF(S.f) || hasHF(S.g) ? '' : '<p class="wnote">Pick what goes in each group: open a filter above the picture and choose for A and for B.</p>') + segHTML() + cmpHTML() + '<button type="button" class="wback" data-fw="views">All ten views</button>' + howHTML() : restHTML())
      + '<div class="wsrc">Profits and holders as filed, merged ' + esc(D.asof) + '. Each firm’s card names its filing.' + (OWN ? ' Sites and control as of ' + esc(OWN.asof || '') + ': the firm cards on the globe.' : '') + '</div>';
    c.scrollTop = 0;
  }
  function tableHTML() {
    var fs = M.firms.filter(inView), hs = M.holders.filter(function (h) { return h.rows.some(function (x) { return x.f.side != null && linkF({ t: x.h.t, c: x.h.c }, x.f.side === 1 ? S.g : S.f); }); }).sort(function (a, b) { return b.att - a.att || b.n - a.n; });
    var cs = M.countries.filter(function (c) { return Object.keys(c.firms).some(function (id) { return M.nodes[id].side != null; }); }).sort(function (a, b) { return Object.keys(b.firms).length - Object.keys(a.firms).length || (a.name < b.name ? -1 : 1); });
    var nm = function (v) { return Math.round(v).toLocaleString('en-US').replace('-', '−'); };
    return '<table><caption>Firms, by layer: profit and what can be attributed* to named holders</caption><thead><tr><th scope="col">Firm</th><th scope="col">Layer</th><th scope="col">Home</th><th scope="col">Year</th><th scope="col" class="num">Profit, $m</th><th scope="col" class="num">Attributed*</th><th scope="col">Largest named holder</th><th scope="col" class="num">Sites</th></tr></thead><tbody>'
      + fs.map(function (f) { var d = f.d, top = f.rows.filter(function (x) { return x.h.s === 'A'; }).sort(function (a, b) { return (b.h.p || 0) - (a.h.p || 0); })[0];
        return '<tr><th scope="row">' + lk(f.id, d.n) + '</th><td>' + esc(D.layers[d.L].s) + '</td><td>' + esc(d.home) + '</td><td>' + esc(d.fy || '–') + '</td><td class="num">' + (d.usd == null ? esc(typeof d.loc === 'string' ? d.loc : '–') : nm(d.usd) + (d.x ? '*' : '')) + '</td><td class="num">' + (d.cov[2] ? fx(d.cov[0]) + '%' : '–') + '</td><td>' + (top ? esc(top.h.n) + ' · ' + pc(top.h.p) : '–') + '</td><td class="num">' + (d.sites ? d.sites : '–') + '</td></tr>'; }).join('')
      + '</tbody></table><table><caption>Holders: attributed profit* across the firms shown</caption><thead><tr><th scope="col">Holder</th><th scope="col">Type</th><th scope="col">Country</th><th scope="col" class="num">Firms</th><th scope="col" class="num">Attributed*, $m</th></tr></thead><tbody>'
      + hs.map(function (h) { return '<tr><th scope="row">' + lk(h.id, h.name) + '</th><td>' + esc(TNAME[h.t]) + '</td><td>' + esc(h.c) + '</td><td class="num">' + h.n + '</td><td class="num">' + (h.att ? nm(h.att) : '–') + '</td></tr>'; }).join('')
      + '</tbody></table><table><caption>Where it is earned: mapped sites by country, for the firms shown</caption><thead><tr><th scope="col">Country</th><th scope="col" class="num">Firms</th><th scope="col">Firms and their sites</th></tr></thead><tbody>'
      + cs.map(function (c) { var ids = Object.keys(c.firms).filter(function (id) { return M.nodes[id].side != null; }); return '<tr><th scope="row">' + lk(c.id, c.name) + '</th><td class="num">' + ids.length + '</td><td>' + ids.map(function (id) { return esc(M.nodes[id].d.n) + ' ' + c.firms[id]; }).join(' · ') + '</td></tr>'; }).join('')
      + '</tbody></table><p class="wnote">* Derived or starred: attributed profit is profit × stake; a starred profit is flagged on the firm’s card. The lists of sites are not complete.</p>';
  }

  /* ---------- the controls: four filter chips, each with a panel of values; compare; calm; the table ---------- */
  function bar() {
    var chip = function (k) { var n = S.f[k].length + (S.cmp ? S.g[k].length : 0); return '<button type="button" class="fchip' + (n ? ' set' : '') + '" data-fwp="' + k + '" aria-expanded="' + (S.pan === k) + '" aria-controls="isx-fw-pan"><span>' + KNAME[k] + '</span>' + (n ? '<b>' + n + '<span class="fvh"> picked</span></b>' : '') + '<i aria-hidden="true"></i></button>'; };
    host.querySelector('.fwbar').innerHTML = '<button type="button" class="fchip fvw" data-fwp="views" aria-expanded="' + (S.pan === 'views') + '" aria-controls="isx-fw-pan"><span>Ten views</span><i aria-hidden="true"></i></button>' + KEYS.map(chip).join('')
      + '<button type="button" class="fbtn fsw fcmp" data-fw="cmp" role="switch" aria-checked="' + S.cmp + '"><i aria-hidden="true"></i><span>Compare two groups</span></button>'
      + (anyF() ? '<button type="button" class="fbtn" data-fw="reset">Clear</button>' : '')
      + '<span class="fgap"></span><button type="button" class="fbtn fsw fcalm" data-fw="calm" role="switch" aria-checked="' + S.calm + '"><i aria-hidden="true"></i><span>Calm</span></button>'
      + '<button type="button" class="fbtn" data-fw="table" aria-pressed="' + S.table + '">' + (S.table ? 'View as web' : 'View as table') + '</button>';
    var k = S.pan, pw = host.querySelector('.fpanw');
    if (!k) { pw.innerHTML = ''; pw.hidden = true; return; }
    var row = function (F, g, lab) { return '<div class="fprow" role="group" aria-label="' + esc(lab) + '">' + (S.cmp ? '<span class="fpk" aria-hidden="true">' + (g === 'f' ? 'A' : 'B') + '</span>' : '') + M.opts[k].map(function (o) { return '<button type="button" class="fopt" data-fwo="' + k + '" data-g="' + g + '" data-v="' + esc(o[0]) + '" aria-pressed="' + (F[k].indexOf(o[0]) >= 0) + '">' + esc(o[1]) + '</button>'; }).join('') + '</div>'; };
    pw.hidden = false;
    if (k === 'views') { pw.innerHTML = '<div class="fpan" id="isx-fw-pan" role="group" aria-label="Ten views"><div class="fph"><b>Ten views</b><span>each fills the filters</span><button type="button" class="fpx" data-fw="pan">Done</button></div>' + viewList() + '</div>'; return; }
    pw.innerHTML = '<div class="fpan" id="isx-fw-pan" role="group" aria-label="' + KNAME[k] + ': pick one or more"><div class="fph"><b>' + KNAME[k] + '</b><span>pick one or more' + (S.cmp ? ', for each group' : '') + '</span><button type="button" class="fpx" data-fw="pan">Done</button></div>'
      + row(S.f, 'f', S.cmp ? KNAME[k] + ', group A' : KNAME[k]) + (S.cmp ? row(S.g, 'g', KNAME[k] + ', group B') : '') + '</div>';
  }
  var foc = function (sel) { var e = host.querySelector(sel); if (e) e.focus({ preventScroll: true }); };
  var say = function () { X.emit('firms', { sel: S.sel, by: S.by, table: S.table, view: S.view }); if (X.routeSync) X.routeSync(); };
  /* something about the view changed: lay out again, redraw the controls and the card */
  function refresh(anim, sweep) {
    keepView(); bar(); var st = host.querySelector('.wstage'); st.classList.toggle('tab', S.table); host.querySelector('.fwtab').innerHTML = S.table ? tableHTML() : '';
    relay(anim, sweep);
    if (S.sel && M.nodes[S.sel] && M.nodes[S.sel].kind !== 'firm' && !M.nodes[S.sel].z.on) { S.sel = null; mark(); }   /* a holder or country that left the view is let go */
    card(); cap(); say();
  }
  function cap() { var P = PBY[S.view], c = host.querySelector('.fcap'); c.hidden = !P; c.innerHTML = P ? '<small>View ' + (P.i + 1) + ' of ' + PRE.length + '</small><b>' + esc(P.t) + '</b><span>' + READ[P.id]().p.replace(/<[^>]+>/g, '') + '</span>' : ''; }
  function pick(id) { S.sel = id && M.nodes[id] ? (S.sel === id ? null : id) : null; halt(); put(1); mark(); card(); flow(); say(); }
  function toggle(F, k, v) { var i = F[k].indexOf(v); if (i >= 0) F[k].splice(i, 1); else F[k].push(v); }

  /* ---------- the address: #circuit/firms=country;v=state;fc=china,japan;vs;fc2=united-states ---------- */
  var enc = function (k, v) { return k === 'L' ? X.slug(D.layers[+v].s) : k === 'ht' ? v : X.slug(v); };
  function addr() {
    if (!M) return '';
    var t = [], P = PBY[S.view], x = fillOf(P), vals = function (F, k) { return F[k].map(function (v) { return enc(k, v); }).sort().join(','); };
    if (S.by === 'country') { if (!(P && P.by === 'country')) t.push('country'); } else if (P && P.by === 'country') t.push('type');
    if (P) t.push('v=' + P.id);
    KEYS.forEach(function (k) { if (!same(S.f[k], x.f[k])) t.push(k + '=' + vals(S.f, k)); });
    if (S.cmp !== x.cmp) t.push(S.cmp ? 'vs' : 'vs=0');
    if (S.cmp) KEYS.forEach(function (k) { if (!same(S.g[k], x.g[k])) t.push(k + '2=' + vals(S.g, k)); });
    return t.join(';');
  }
  function read(str) {
    var toks = String(str || '').split(';').filter(Boolean), v = toks.filter(function (t) { return /^v=/.test(t); })[0];
    setView(v ? v.slice(2) : ''); S.by = v && PBY[v.slice(2)] && PBY[v.slice(2)].by || 'type'; S.sel = null;
    toks.forEach(function (t) {
      var m;
      if (t === 'country' || t === 'type') S.by = t;
      else if (t === 'vs') S.cmp = true; else if (t === 'vs=0') S.cmp = false;
      else if ((m = /^(L|fc|ht|hc)(2?)=(.*)$/.exec(t))) { var want = m[3].split(',').filter(Boolean); (m[2] ? S.g : S.f)[m[1]] = M.opts[m[1]].filter(function (o) { return want.indexOf(enc(m[1], o[0])) >= 0; }).map(function (o) { return o[0]; }); }
    });
    keepView();
  }

  /* ---------- open and close ---------- */
  function ensure() {
    if (host) return;
    host = document.createElement('section'); host.className = 'web3 fw'; host.id = 'isx-fw'; host.hidden = true; host.setAttribute('aria-label', 'The firm web: profits, owners and sites');
    host.innerHTML = '<aside class="wcard" aria-live="polite"></aside><div class="wstage"><div class="fwbar" role="group" aria-label="Filter the web"></div><div class="fpanw" hidden></div><div class="fcap" aria-hidden="true" hidden></div>'
      + '<div class="fwpan"><svg viewBox="' + VX + ' 0 ' + VW + ' ' + VH + '" preserveAspectRatio="xMaxYMid meet" role="group" aria-label="The firms of the AI supply chain on a ring, by layer; inside it, the holders their filings name; outside it, the countries where the mapped firms have sites. A mark’s size is the firm’s latest full-year profit; a line’s width, the profit attributed to that holder. “View as table” gives the same figures as text."></svg></div>'
      + '<div class="fwtab" tabindex="0" role="region" aria-label="The firm web as tables"></div>'
      + '<div class="wkey" aria-hidden="true">' + TYPES.slice(0, 5).map(function (t) { return '<span><i class="t-' + t[0] + '"></i>' + t[1] + '</span>'; }).join('') + '<span><i class="k-loss"></i>Loss</span><span><i class="k-na"></i>Not attributed</span><span><i class="k-bad"></i>Control disputed</span><span><i class="k-site"></i>Operates in</span><span><i class="k-sec"></i>Sector row</span></div></div>'
      + '<button type="button" class="wclose" data-fw="close"><span aria-hidden="true">←</span> <span class="wct">Back to the globe</span></button>';
    frame.appendChild(host);
    host.addEventListener('click', function (e) {
      var t = e.target.closest('[data-fw], [data-fwby], [data-fwb], [data-fwp], [data-fwo], [data-fwv], .fnode'), kb = e.detail === 0; if (!t) return;
      if (t.classList.contains('fnode')) { pick(t.dataset.id); return; }
      if (t.dataset.fwby) { S.by = t.dataset.fwby; card(); foc('[data-fwby="' + S.by + '"]'); say(); return; }
      if (t.dataset.fwb != null) { var v = t.dataset.fwb; toggle(S.f, S.by === 'type' ? 'ht' : 'hc', v); refresh(true); if (kb) foc('[data-fwb="' + v.replace(/"/g, '\\"') + '"]'); return; }
      if (t.dataset.fwp) { S.pan = S.pan === t.dataset.fwp ? '' : t.dataset.fwp; bar(); if (S.pan && kb) foc('.fpan .fopt, .fpan .fv1'); else foc('[data-fwp="' + t.dataset.fwp + '"]'); return; }
      if (t.dataset.fwo) { toggle(t.dataset.g === 'g' ? S.g : S.f, t.dataset.fwo, t.dataset.v); var q = '.fopt[data-fwo="' + t.dataset.fwo + '"][data-g="' + t.dataset.g + '"][data-v="' + t.dataset.v.replace(/"/g, '\\"') + '"]'; S.sel = null; refresh(true); foc(q); return; }
      if (t.dataset.fwv) { var inPan = !!t.closest('.fpan'); setView(t.dataset.fwv); S.sel = null; refresh(true, t.dataset.fwv === 'claim'); foc(inPan ? '.fvw' : '.wcard .wback'); return; }
      var k2 = t.dataset.fw;
      if (S.pan && k2 !== 'pan') { S.pan = ''; bar(); }   /* any other control closes an open panel */
      if (k2 === 'close') close(true);
      else if (k2 === 'calm') { S.calm = !S.calm; bar(); mark(); if (S.calm) { halt(); put(1); } foc('.fcalm'); }
      else if (k2 === 'table') { S.table = !S.table; refresh(false); foc('[data-fw="table"]'); }
      else if (k2 === 'cmp') { S.cmp = !S.cmp; if (!S.cmp) S.g = blank(); else if (!hasFF(S.f) && !hasFF(S.g)) S.pan = 'fc'; S.sel = null; refresh(true); foc('.fcmp'); }
      else if (k2 === 'pan') { var was = S.pan; S.pan = ''; bar(); foc('[data-fwp="' + was + '"]'); }
      else if (k2 === 'reset' || k2 === 'views') { setView(''); S.sel = null; refresh(true); foc(k2 === 'views' ? '.wcard .fv1' : '.fwbar .fchip'); }
      else if (k2 === 'how' || k2 === 'more') { S[k2] = !S[k2]; card(); foc('.fhowb[data-fw="' + k2 + '"]'); }
      else if (k2 === 'globe') { var n = M.nodes[S.sel], f = n && n.d.old && X.data.FIRMS.filter(function (x) { return x.name === n.d.old; })[0]; from = null; close(false); if (f) { X.stopPlay(); X.select(f.iso, f); } }
      else { S.sel = null; pick(k2); var fb = host.querySelector('.wcard .wback, .wcard button'); if (fb && kb) fb.focus({ preventScroll: true }); }
    });
    var esc2 = function () { if (S.pan) { var was = S.pan; S.pan = ''; bar(); foc('[data-fwp="' + was + '"]'); } else if (S.sel) pick(null); else close(true); };
    /* Esc also works when focus has fallen back to the page (a card that was redrawn) */
    document.addEventListener('keydown', function (e) { if (host.hidden || e.key !== 'Escape' || e.defaultPrevented || host.contains(e.target) || /^(SELECT|INPUT|TEXTAREA)$/.test(e.target.tagName || '')) return; e.preventDefault(); esc2(); });
    host.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); esc2(); return; }
      var g = e.target.closest && e.target.closest('.fnode');
      if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(g.dataset.id); }
    });
    document.addEventListener('pointerdown', function (e) { if (host.hidden || !S.pan || e.target.closest('.fpan, .fwbar')) return; S.pan = ''; bar(); }, true);   /* a press outside closes the panel; the row's own buttons do it in their click, so the button pressed is not redrawn under the finger */
  }
  function open(o) {
    o = o || {};
    if (X.view !== 'map') X.setView('map');
    ensure();
    lastFocus = document.activeElement; from = o.from || null;
    var go = function () {
      if (!M) M = model();
      S.sel = null; S.table = false; S.pan = '';
      if (o.addr != null) read(o.addr); else { if (o.view || o.by || o.firm) setView(o.view || ''); if (o.by) S.by = o.by === 'country' ? 'country' : 'type'; }   /* a door opens its own view; the tray's tile opens the web as it was left */
      if (!host.querySelector('svg .fn')) draw();
      if (o.firm && M.byId[o.firm]) S.sel = 'f:' + o.firm;
      host.querySelector('.wct').textContent = from === 'profit' ? 'Back to the profit dollar' : 'Back to the globe';
      host.hidden = false; root.classList.add('web-on', 'fw-on'); refresh(false);
      var stg = host.querySelector('.fwpan'); if (stg.scrollWidth > stg.clientWidth + 4) stg.scrollLeft = (stg.scrollWidth - stg.clientWidth) / 2;   /* phones: the picture pans; start at its middle */
      try { if (X.globe) X.globe.pauseAnimation(); } catch (e) { /* ignore */ }
      var b = host.querySelector('.wclose'); if (b) b.focus({ preventScroll: true });
      X.emit('firms', { sel: S.sel, by: S.by, table: false, open: true, view: S.view }); X.emit('web', true); if (X.routeSync) X.routeSync();
    };
    var need = [];
    if (!D) need.push(X.load('firms').then(function (d) { D = d; }));
    if (!OWN) need.push((X.own && X.own.data ? Promise.resolve(X.own.data) : X.load('ownership')).then(function (d) { OWN = d; }).catch(function () { OWN = null; }));
    if (!SH) need.push(X.load('company-sheets').then(function (d) { SH = d; }).catch(function () { SH = null; }));
    return Promise.all(need).then(go).catch(function () { /* the tray and the doors keep working without the web */ });
  }
  function close(refocus) {
    if (!host || host.hidden) return;
    halt(); host.hidden = true; root.classList.remove('web-on', 'fw-on');
    try { if (X.globe && !document.hidden) X.globe.resumeAnimation(); } catch (e) { /* ignore */ }
    var back = from; from = null;
    X.emit('firms', { open: false }); X.emit('web', false);
    if (refocus && back === 'profit') { X.setView('profit'); return; }
    if (refocus) { var b = $('tp-firms') || lastFocus; if (b && b.focus) b.focus({ preventScroll: true }); }
    if (X.routeSync) X.routeSync();
  }
  X.on('view', function () { from = null; close(false); });
  X.on('motion', function () { if (host && !host.hidden && still()) { halt(); put(1); } });
  /* the page's record of a firm, for the door on its card on the globe */
  var OLDID = { 'ASML': 'asml', 'ASM Intl': 'asm_international', 'Besi': 'besi', 'Nexperia': 'nexperia', 'NXP': 'nxp', 'TSMC': 'tsmc', 'Samsung': 'samsung', 'SK Hynix': 'sk_hynix', 'Nvidia': 'nvidia', 'Foxconn': 'foxconn_hon_hai', 'Tokyo Electron': 'tokyo_electron', 'Applied Materials': 'applied_materials', 'Microsoft': 'microsoft', 'Amazon': 'amazon', 'Alphabet': 'alphabet', 'Meta': 'meta', 'SpaceX': 'spacex', 'Huawei': 'huawei', 'SMIC': 'smic', 'Wingtech': 'wingtech' };
  var isOpen = function () { return !!host && !host.hidden; };
  X.firms = { open: open, close: close, idOf: function (name) { return OLDID[name] || null; }, pick: function (id) { if (M && isOpen()) { S.sel = null; pick(id); } },
    get isOpen() { return isOpen(); }, get addr() { return addr(); }, views: PRE.map(function (P) { return { id: P.id, t: P.t }; }),
    /* the address inside the tab, applied: opens the web if it is shut, changes the view if it differs */
    go: function (str) { if (!isOpen()) return open({ addr: str }); if (str !== addr()) { read(str); refresh(true); } },
    view: function (id) { if (M && isOpen()) { setView(id); S.sel = null; refresh(true, id === 'claim'); } },
    get state() { var vis = function (l) { return l.filter(function (n) { return n.z && n.z.on; }).length; };
      return { open: isOpen(), sel: S.sel, by: S.by, calm: S.calm, table: S.table, view: S.view, lens: S.lens, cmp: S.cmp, split: !!(LAY && LAY.split), pan: S.pan, f: JSON.parse(JSON.stringify(S.f)), g: JSON.parse(JSON.stringify(S.g)),
        firms: M ? M.firms.length : 0, holders: M ? M.holders.length : 0, links: M ? M.links.length : 0, sectors: M ? M.secs.length : 0, countries: M ? M.countries.length : 0, sites: M ? M.sites.length : 0,
        inFirms: M ? vis(M.firms) : 0, inHolders: M ? vis(M.holders.concat(M.prox)) : 0, lit: M ? M.links.filter(function (L) { return L.vis && L.lit; }).length : 0, k: LAY ? LAY.k : 1, sum: D ? D.sum : null, parts: D ? D.parts || null : null }; },
    set: function (k, v) { if (!M) return; if (k in S.f) S.f[k] = (v == null || v === '' ? [] : [].concat(v)).map(String); else if (k === 'calm' || k === 'table' || k === 'cmp') S[k] = !!v; else if (k === 'by') S.by = v === 'country' ? 'country' : 'type'; refresh(false); } };
  /* the older ownership web's seam: its tile and its door now open the same view, on “where it is earned” */
  X.web = { open: function (o) { return open(Object.assign({ view: 'earned' }, o || {})); }, close: close, get isOpen() { return false; } };
  /* a link that arrives at #circuit/firms: state.js runs before this file, so the first address is read here */
  var m0 = /^#\/?circuit\/firms(?:=([^\/]*))?/.exec(window.__isxHash0 || ''); if (m0) { var a0 = m0[1] || ''; try { a0 = decodeURIComponent(a0); } catch (e) { /* as written */ } open({ addr: a0 }); }
})();
