/* The Imperial Stack v2 · clarity.js (clarity build, 17 Nov 2026)
   Two small systems for the Scott Bessent Simulator's guide.

   1. This step in numbers. The page says what the step in hand is about, as numbers (ISX.stepNums(): tiles, bars or one chart; null
      where no number is relevant, and on every decision, chain and crisis card). This file draws them above the guide's card, where the
      column was empty; when there is no room there (a short window, a tall card, an open “The mechanism”) and on phones, the same numbers
      sit inside the card. Nothing is shown before its step: an indicator's tile follows the indicator's own gate. Every figure carries
      its date; its source is one click away (“Sources”), in the table view of a chart, and in the tile's accessible name.
      A chart draws a stored monthly series (data/bond-panel.json, the bond screen's own file): one or two lines, each labelled at its
      end, the moments the step names marked on it, a table view and a text alternative. The colours are the bond screen's, checked with
      the dataviz validator against the stage. Nothing moves with the mouse; nothing animates.

   2. The key, on demand. The map's lines are grey at rest and take their colour in focus, so the key no longer sits under the map:
      one control, “Key”, opens it (what a box, a line and a gauge are; the seven line colours; the four indicator roles). */
(function () {
  'use strict';
  var X = window.ISX; if (!X) return;
  var U = X.util, root = X.root, $ = X.$, esc = U.esc;
  var COL = { y10: '#b88a2e', baa: '#4b8fd0', move: '#d0703f' };   /* as in v2/views.js (the bond screen) */
  var SER = {
    move: { lines: [['move', 'MOVE', COL.move]], unit: '', dp: 0, name: 'Bond volatility: the MOVE index', what: 'How far Treasury yields are expected to swing, priced from options. Monthly average of daily closes.' },
    y10: { lines: [['y10', '10-year', COL.y10]], unit: '%', dp: 2, name: 'The 10-year Treasury yield', what: 'Monthly average of daily values, in per cent.' },
    y10baa: { lines: [['baa', 'Company bonds (Baa)', COL.baa], ['y10', '10-year Treasury', COL.y10]], unit: '%', dp: 2, name: 'What companies pay over the Treasury', what: 'Moody’s Baa corporate bond yield and the 10-year Treasury yield, monthly averages, in per cent. The gap between the lines is the spread.' }
  };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var mlab = function (m) { return MON[+m.slice(5) - 1] + ' ' + m.slice(0, 4); };
  var keyAt = 0, BP = null, bpAsked = false, el = null, cur = null, tblOn = false, srcOn = false, foldOn = false;
  var phone = function () { return U.PHONE ? U.PHONE() : window.innerWidth <= 760; };
  var fmt = function (v, S) { return v.toFixed(S.dp) + S.unit; };

  /* ---------- drawing ---------- */
  function tileHTML(T) {
    var fill = T.f != null ? '<i class="cl-tf" aria-hidden="true"><i style="width:' + Math.round(T.f * 100) + '%"></i></i>' : '';
    return '<div class="cl-t" role="group" aria-label="' + esc(T.v + ' ' + T.k + (T.d ? ', ' + T.d : '') + '. Source: ' + T.s) + '"><b>' + esc(T.v) + '</b>' + fill + '<span>' + esc(T.k) + (T.band ? ' <small>' + esc(T.band) + '</small>' : '') + '</span>' + (T.d ? '<em>' + esc(T.d) + '</em>' : '') + '</div>';
  }
  function barsHTML(B) {
    var max = Math.max.apply(null, B.r.map(function (r) { return r[1]; })) || 1;
    return '<div class="cl-bars" role="group" aria-label="' + esc(B.k + (B.d ? ', ' + B.d : '') + ': ' + B.r.map(function (r) { return r[0] + ' ' + r[2]; }).join('; ') + '. Source: ' + B.s) + '"><div class="cl-bk"><span>' + esc(B.k) + '</span>' + (B.d ? '<em>' + esc(B.d) + '</em>' : '') + '</div>'
      + B.r.map(function (r) { return '<div class="cl-b"><span>' + esc(r[0]) + '</span><i aria-hidden="true"><i style="width:' + Math.max(1.5, r[1] / max * 100).toFixed(1) + '%"></i></i><b>' + esc(r[2]) + '</b></div>'; }).join('')
      + (B.n ? '<p class="cl-bn">' + esc(B.n) + '</p>' : '') + '</div>';
  }
  /* a chart of one stored series (or two): what is needed to draw it, to list it as a table and to say it in words */
  function chartData(C) {
    var S = SER[C.id]; if (!S || !BP || !BP.m) return null;
    var i0 = Math.max(0, BP.m.indexOf(C.from)), ms = BP.m.slice(i0), n = ms.length;
    var lines = S.lines.map(function (L) { return { id: L[0], label: L[1], col: L[2], v: (BP[L[0]] || []).slice(i0) }; });
    var all = [].concat.apply([], lines.map(function (L) { return L.v; })), lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
    var marks = (C.marks || []).map(function (M) { var i = ms.indexOf(M[0]); return i < 0 ? null : { i: i, m: M[0], label: M[1] || mlab(M[0]), quiet: !M[1] }; }).filter(Boolean);
    return { S: S, ms: ms, n: n, lines: lines, lo: lo, hi: hi, marks: marks, src: lines.map(function (L) { return (BP.meta && BP.meta.src && BP.meta.src[L.id]) || L.id; }).join('; ') + '. Read ' + ((BP.meta && BP.meta.read) || '') + '.' };
  }
  function chartHTML(C) {
    var D = chartData(C);
    if (!D) return '<div class="cl-ch wait" aria-hidden="true"></div>';
    var S = D.S, W = 372, H = 138, L = 30, R = D.lines.length > 1 ? 112 : 58, T = 22, B = 18, pw = W - L - R, ph = H - T - B;
    var span = D.hi - D.lo || 1, lo = D.lo - span * .08, hi = D.hi + span * .1; if (S.unit === '%' && lo < 0) lo = Math.min(0, D.lo);
    var x = function (i) { return L + (D.n > 1 ? i / (D.n - 1) : 0) * pw; }, y = function (v) { return T + (1 - (v - lo) / (hi - lo)) * ph; };
    var step = Math.pow(10, Math.floor(Math.log10((hi - lo) / 2))), k = (hi - lo) / step; step *= k > 6 ? 2.5 : k > 3 ? 1 : .5;
    var g = '', t0 = Math.ceil(lo / step) * step;
    for (var v = t0; v <= hi; v += step) g += '<line class="g" x1="' + L + '" x2="' + (L + pw) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/><text class="ax" x="' + (L - 5) + '" y="' + (y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + (step < 1 ? v.toFixed(1) : Math.round(v)) + '</text>';
    var years = D.n / 12, every = years > 7 ? 2 : 1;
    D.ms.forEach(function (m, i) { if (m.slice(5) === '01' && (+m.slice(0, 4)) % every === 0) g += '<text class="ax" x="' + x(i).toFixed(1) + '" y="' + (H - 4) + '" text-anchor="middle">' + m.slice(0, 4) + '</text><line class="tk" x1="' + x(i).toFixed(1) + '" x2="' + x(i).toFixed(1) + '" y1="' + (T + ph) + '" y2="' + (T + ph + 3) + '"/>'; });
    var body = '', ends = D.lines.map(function (Ln) { return { Ln: Ln, y: y(Ln.v[D.n - 1]) }; }).sort(function (a, b) { return a.y - b.y; });
    for (var j = 1; j < ends.length; j++) if (ends[j].y - ends[j - 1].y < 13) ends[j].y = ends[j - 1].y + 13;   /* end labels never collide */
    D.lines.forEach(function (Ln) { body += '<path class="ln" d="' + Ln.v.map(function (val, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(val).toFixed(1); }).join('') + '" stroke="' + Ln.col + '"/><circle class="dot" cx="' + x(D.n - 1).toFixed(1) + '" cy="' + y(Ln.v[D.n - 1]).toFixed(1) + '" r="2.6" fill="' + Ln.col + '"/>'; });
    ends.forEach(function (E) { body += '<text class="lb" x="' + (L + pw + 7) + '" y="' + (E.y + 3.5).toFixed(1) + '" fill="' + E.Ln.col + '">' + esc(E.Ln.label) + ' <tspan class="lv">' + fmt(E.Ln.v[D.n - 1], S) + '</tspan></text>'; });
    body += '<text class="ax" x="' + (L + pw + 7) + '" y="' + (ends[ends.length - 1].y + 16).toFixed(1) + '">' + mlab(D.ms[D.n - 1]) + '</text>';   /* the date of the values at the lines' ends */
    var mk = '', lastX = -99, row = 0, main = D.lines[D.lines.length - 1];
    D.marks.forEach(function (M) {
      var mx = x(M.i), my = y(main.v[M.i]); if (M.quiet || M.i === D.n - 1) return;   /* the last month is labelled at the line's end */
      row = mx - lastX < 62 ? (row + 1) % 2 : 0; lastX = mx;
      var end = mx > L + pw - 40, anchor = end ? 'end' : mx < L + 34 ? 'start' : 'middle';
      mk += '<line class="mk" x1="' + mx.toFixed(1) + '" x2="' + mx.toFixed(1) + '" y1="' + (T - 9 + row * 10) + '" y2="' + my.toFixed(1) + '"/><circle class="mkd" cx="' + mx.toFixed(1) + '" cy="' + my.toFixed(1) + '" r="2.4"/><text class="mkl" x="' + (end ? mx + 2 : mx).toFixed(1) + '" y="' + (T - 12 + row * 10) + '" text-anchor="' + anchor + '">' + esc(M.label) + '</text>';
    });
    var said = S.name + ', ' + mlab(D.ms[0]) + ' to ' + mlab(D.ms[D.n - 1]) + '. ' + D.lines.map(function (Ln) { return Ln.label + ': ' + D.marks.map(function (M) { return fmt(Ln.v[M.i], S) + ' in ' + mlab(M.m); }).concat(D.marks.some(function (M) { return M.i === D.n - 1; }) ? [] : [fmt(Ln.v[D.n - 1], S) + ' in ' + mlab(D.ms[D.n - 1])]).join(', '); }).join('. ') + '. ' + S.what;
    var rows = D.marks.slice(); if (!rows.some(function (M) { return M.i === D.n - 1; })) rows.push({ i: D.n - 1, m: D.ms[D.n - 1] }); if (!rows.some(function (M) { return M.i === 0; })) rows.unshift({ i: 0, m: D.ms[0] });
    var tbl = '<table><caption>' + esc(S.name) + '. ' + esc(S.what) + '</caption><thead><tr><th scope="col">Month</th>' + D.lines.map(function (Ln) { return '<th scope="col">' + esc(Ln.label) + '</th>'; }).join('') + '</tr></thead><tbody>'
      + rows.map(function (M) { return '<tr><th scope="row">' + mlab(M.m) + '</th>' + D.lines.map(function (Ln) { return '<td>' + fmt(Ln.v[M.i], S) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table><p class="cl-cs">Source: ' + esc(D.src) + ' Every month is in the bond screen’s table (the gold tab on the 10-year).</p>';
    return '<div class="cl-ch" data-ch="' + esc(C.id) + '"><div class="cl-bk"><span>' + esc(S.name) + '</span><button type="button" class="cl-lnk" data-cl-tbl aria-pressed="' + tblOn + '">' + (tblOn ? 'View as chart' : 'View as table') + '</button></div>'
      + '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(said) + '"' + (tblOn ? ' hidden' : '') + '>' + g + body + mk + '</svg><div class="cl-tb"' + (tblOn ? '' : ' hidden') + '>' + tbl + '</div></div>';
  }
  function html(N) {
    var srcs = [];
    N.tiles.forEach(function (T) { srcs.push([T.v + ' ' + T.k, T.s + (T.m ? ' ' + T.m : '')]); });
    if (N.bars) srcs.push([N.bars.k, N.bars.s]);
    var cap = N.bars || N.chart ? (N.chart ? 0 : 2) : 3, tiles = N.tiles.slice(0, cap);
    return '<div class="cl-nh"><span>This step in numbers</span>' + (srcs.length ? '<button type="button" class="cl-lnk" data-cl-src aria-expanded="' + srcOn + '" aria-controls="isx-cl-src">Sources</button>' : '') + '</div>'
      + (N.chart ? chartHTML(N.chart) : '') + (N.bars ? barsHTML(N.bars) : '')
      + (tiles.length ? '<div class="cl-nt n' + tiles.length + '">' + tiles.map(tileHTML).join('') + '</div>' : '')
      + (srcs.length ? '<ol class="cl-ns" id="isx-cl-src"' + (srcOn ? '' : ' hidden') + '>' + srcs.map(function (s) { return '<li><b>' + esc(s[0]) + '</b> ' + esc(s[1]) + '</li>'; }).join('') + '</ol>' : '');
  }

  /* ---------- placing: above the card where there is room, else in it ---------- */
  function place() {
    var card = $('snarr'), body = $('sn-body'), box = $('sn-in'), cock = $('cock'); if (!el || !card || !body || !cock) return;
    card.classList.remove('cl-has'); card.style.removeProperty('--cl-nh');
    /* in the card: open on a phone (the page scrolls there); on a desk it is one row that opens, so a full card stays short */
    var inCard = function () { el.className = 'cl-nums in' + (phone() ? '' : ' fold' + (foldOn ? ' open' : '')); var hb = el.querySelector('.cl-nh'); if (hb) { if (phone()) { hb.removeAttribute('role'); hb.removeAttribute('tabindex'); hb.removeAttribute('aria-expanded'); } else { hb.setAttribute('role', 'button'); hb.setAttribute('tabindex', '0'); hb.setAttribute('aria-expanded', String(foldOn)); } } var deep = body.querySelector('.s2deep'); if (deep) body.insertBefore(el, deep); else body.appendChild(el); };
    if (phone() || card.classList.contains('folded')) { inCard(); return; }
    el.className = 'cl-nums up'; card.insertBefore(el, card.firstChild);
    var h = el.offsetHeight + 12; card.style.setProperty('--cl-nh', h + 'px'); card.classList.add('cl-has');
    var top = cock.getBoundingClientRect().top + (parseFloat(getComputedStyle(cock).getPropertyValue('--it')) || 150) - 6;
    if (el.getBoundingClientRect().top < top || (box && box.scrollHeight > box.clientHeight + 1)) { card.classList.remove('cl-has'); card.style.removeProperty('--cl-nh'); inCard(); }
  }
  function draw() {
    var N = X.stepNums ? X.stepNums() : null, card = $('snarr');
    if (el && el.parentNode) el.parentNode.removeChild(el);
    if (card) { card.classList.remove('cl-has'); card.style.removeProperty('--cl-nh'); }
    if (!N || !card) { el = null; cur = null; return; }
    if (!cur || cur.key !== N.key) { tblOn = false; srcOn = false; foldOn = false; }
    cur = N;
    if (N.chart && !BP && !bpAsked && X.load) { bpAsked = true; X.load('bond-panel').then(function (d) { BP = d; if (cur && cur.chart) draw(); }).catch(function () { BP = false; if (cur && cur.chart) draw(); }); }
    if (N.chart && BP === false) { N = { key: N.key, tiles: N.tiles, bars: N.bars, chart: null }; if (!N.tiles.length && !N.bars) { el = null; return; } }
    el = document.createElement('div'); el.id = 'isx-cl-nums'; el.setAttribute('role', 'group'); el.setAttribute('aria-label', 'This step in numbers'); el.innerHTML = html(N);
    place();
    X.emit('nums', { key: N.key, where: el.classList.contains('up') ? 'up' : 'in' });
  }
  var rt = 0, later = function () { clearTimeout(rt); rt = setTimeout(function () { if (el) place(); if (X.sim && X.view === 'fin') X.emit('nums-placed'); }, 60); };
  X.on('simcard', draw);
  X.on('sim', function (S) { if (!S || S.mode !== 'story') { if (el && el.parentNode) el.parentNode.removeChild(el); var c = $('snarr'); if (c) { c.classList.remove('cl-has'); c.style.removeProperty('--cl-nh'); } el = null; cur = null; } });
  window.addEventListener('resize', later);
  root.addEventListener('toggle', function (e) { if (e.target && e.target.closest && e.target.closest('#isx-sn-body') && !e.target.closest('#isx-cl-nums')) later(); }, true);
  root.addEventListener('click', function (e) {
    var hd = e.target.closest ? e.target.closest('.cl-nums.fold .cl-nh') : null;
    if (hd && el && el.contains(hd) && !e.target.closest('[data-cl-src]')) { foldOn = !foldOn; el.classList.toggle('open', foldOn); hd.setAttribute('aria-expanded', String(foldOn)); return; }
    var t = e.target.closest ? e.target.closest('[data-cl-tbl], [data-cl-src], #isx-s2fold') : null; if (!t) return;
    if (t.id === 'isx-s2fold') { later(); return; }
    if (!el || !el.contains(t)) return;
    e.stopPropagation();
    if (t.hasAttribute('data-cl-tbl')) tblOn = !tblOn; else srcOn = !srcOn;
    var up = el.classList.contains('up'); el.innerHTML = html(cur); if (up) place();
    var f = el.querySelector(t.hasAttribute('data-cl-tbl') ? '[data-cl-tbl]' : '[data-cl-src]'); if (f) f.focus({ preventScroll: true });
  });

  /* ---------- the key, on demand ---------- */
  root.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-cl-key]') : null, pop = $('cl-key');
    if (!pop) return;
    if (b) { var on = pop.hidden; pop.hidden = !on; b.setAttribute('aria-expanded', String(on)); if (on) { var x = pop.querySelector('.dx'); if (x && e.detail === 0) x.focus({ preventScroll: true }); } return; }
    if (!pop.hidden && Date.now() - keyAt > 250 && (e.target.closest('[data-cl-keyx]') || !e.target.closest('#isx-cl-key'))) { pop.hidden = true; var kb = root.querySelector('[data-cl-key]'); if (kb) { kb.setAttribute('aria-expanded', 'false'); if (e.target.closest('[data-cl-keyx]')) kb.focus({ preventScroll: true }); } }
  });
  root.addEventListener('keydown', function (e) { var hd = e.target.closest ? e.target.closest('.cl-nums.fold .cl-nh') : null; if (hd && e.target === hd && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); hd.click(); } });
  root.addEventListener('keydown', function (e) { var pop = $('cl-key'); if (e.key === 'Escape' && pop && !pop.hidden) { e.preventDefault(); e.stopPropagation(); pop.hidden = true; var kb = root.querySelector('[data-cl-key]'); if (kb) { kb.setAttribute('aria-expanded', 'false'); kb.focus({ preventScroll: true }); } } }, true);

  /* the click that opened the key from elsewhere (the Expert way in) must not also close it: keyAt */
  X.on('key', function (on) { var pop = $('cl-key'), kb = root.querySelector('[data-cl-key]'); if (!pop) return; pop.hidden = !on; keyAt = on ? Date.now() : 0; if (kb) kb.setAttribute('aria-expanded', String(!!on)); });
  X.clarity = { draw: draw, get where() { return el ? (el.classList.contains('up') ? 'up' : 'in') : null; }, get data() { return cur; } };
  if ($('sn-body') && $('sn-body').childElementCount) draw();
})();
