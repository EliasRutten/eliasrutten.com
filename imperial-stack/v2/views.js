/* The Imperial Stack v2 · views.js (content build, 14 Nov 2026)
   “Inside the machinery”: three deeper views that open from elements of the Simulator's map. The map itself does not change.
     loop   the money loop: five stations, the allied savers one level down, the direct route against the market route
     bond   the bond screen, in two levels: the main figures named (public bonds, private bonds, the relation between them),
            then the curve, bond volatility, both halves in detail and the currencies of the alliance
     desks  the two desks: the Treasury and the Fed in one box with a dotted line, their dated operations, the readings
   A view is a sheet of dark glass over the stage, above the bottom bar. A door is a button in a dossier (Allied savers; the
   10-year, MOVE and New bonds; US Treasury and Federal Reserve); a chain link or a play step whose relation exists only inside
   a view opens it too. Esc or × closes it and returns the focus to the button that opened it. Every figure is dated and
   sourced; “–” is an empty slot with its reason, never an estimate; a sentence that gives a direction of causation says whose
   reading it is. Readings RD-M1 to RD-M4 are cards here, not guide steps. */
(function () {
  'use strict';
  var X = window.ISX; if (!X) return;
  var U = X.util, root = X.root, $ = X.$, e = U.esc, F = X.fig || { shares: '≈$199bn', bonds: '≈$282bn' };
  var box = null, cur = null, lvl = 1, from = null, fromO = null;
  var EP = 'https://eliasrutten.substack.com/p/';
  var SUB = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M2.5 1.5h11v1.6h-11zM2.5 4.4h11V6h-11zM2.5 7.3h11v7.2L8 11.4l-5.5 3.1z"/></svg>';

  /* ---------- small builders ---------- */
  function who(t) { return t ? '<p class="vw-who"><span>Whose reading</span> ' + e(t) + '</p>' : ''; }   /* profit tab build 1: Elias's readings carry no name, so the line can be empty */
  function src(t) { return '<div class="lsrc">' + e(t) + '</div>'; }
  /* a figure: name, value (or “–”), date, source; why = the reason a slot is empty */
  function fig(k, v, d, s, why) {
    return '<div class="vw-fig' + (v === '–' ? ' slot' : '') + '"><span class="fk">' + e(k) + '</span><b>' + e(v) + '</b>' + (d ? '<em>' + e(d) + '</em>' : '') + (why ? '<p>' + e(why) + '</p>' : '') + (s ? src(s) : '') + '</div>';
  }
  function panel(cls, kick, title, inner, rel) { return '<section class="vw-p ' + cls + '"' + (rel ? ' data-rel="' + rel + '"' : '') + '><div class="pk">' + e(kick) + '</div><h4>' + e(title) + '</h4>' + inner + '</section>'; }
  function reading(id, title, text, w, extra) { return '<aside class="vw-rd" data-rd="' + id + '"><div class="pk">Reading · not a measured outcome</div><h4>' + e(title) + '</h4><p>' + text + '</p>' + (extra || '') + who(w) + '</aside>'; }

  /* ---------- (a) the money loop ---------- */
  var KIDS = [
    ['Pension funds', 'partly measured', 'Workers’ retirement savings, managed by public and occupational funds such as Japan’s GPIF, Korea’s NPS and the Dutch ABP and PFZW. Their size makes them the largest regular buyers.',
      'Long liabilities make them buyers of long assets in every market they can reach; Dutch pension funds sold €30bn of US securities in 2025 (DNB, March 2026).',
      'NPS: $155.08bn of US-listed shares on 30 June 2026 (SEC Form 13F, via Asiae; a secondary source). GPIF: ¥81.1tn of foreign shares and ¥78.8tn of foreign bonds on 30 June 2026, 49.9%* of its assets (GPIF, 7 Aug 2026; *computed); its US holdings alone were not found. ABP and PFZW: not collected.'],
    ['Sovereign wealth funds', 'partly measured', 'State funds that invest a country’s surplus abroad, such as Norway’s oil fund (GPFG) and Singapore’s GIC.',
      'Their mandate is to hold foreign assets, so their size grows with the surplus that feeds them. Gulf sovereign funds are left out of “allied” here: no source on this page calls them allied.',
      'Norway’s fund: NOK 22,683bn on 30 June 2026. US shares are 52.9% of its shares, about NOK 8,653bn*, and 54.2% of its bonds are in dollars (NBIM, half-year report 2026; *derived from a rounded share). GIC: not collected.'],
    ['Household portfolios', 'partly measured', 'Households in the allied economies, through funds and insurers or directly, as in Japan’s tax-free NISA accounts.',
      'Much of this money is booked through fund domiciles (Ireland, Luxembourg), so the official statistics show the fund’s country, not the household’s.',
      'Japan: households held 5.8% of ¥2,519tn of financial assets in foreign-currency assets at the end of June 2026 (Bank of Japan flow of funds, via Business Insider Japan, 21 Oct 2026; a secondary source). Their US holdings alone: “–”, not measured.'],
    ['Life insurers and annuities', '–', 'Insurers selling long-dated savings products, many of them Japanese and European.',
      'They match long liabilities with long bonds, including the build-out’s bonds and private credit.',
      '“–”: allied life insurers’ US bond holdings were not found in the data round of 14 November 2026.'],
    ['Money-market and mutual funds', '–', 'Pooled funds booked abroad that hold US bills, bonds and shares.',
      'They move fastest of the five when rates or the dollar move.',
      '“–”: US securities held by funds domiciled in Ireland and Luxembourg were not found in the data round of 14 November 2026. 27% of foreign-held US shares sit in fund domiciles (Circuit, step 07).']
  ];
  function loopHTML() {
    var st = [
      ['Savers put money into US markets', fig('US securities bought by foreigners', '$1.88tn', '12 months to Aug 2026', 'TIC, as in Circuit step 07') + fig('of it shares', '$1.01tn', '12 months to Aug 2026', 'TIC'), 'measured', 'SAV>SPX · SAV>Y10'],
      ['AI shares and bonds absorb it', fig('S&P 500 market value in 41 AI-related stocks', '49%', 'Oct 2026', 'JPMorgan, on the page') + fig('AI borrowers’ share of non-financial dollar investment-grade bond supply', 'almost one quarter', '2026 to date', 'PIMCO with Bloomberg (23 Sep 2026)'), 'measured', 'HYP>SPX · Y10>BND'],
      ['The hyperscalers tap the liquidity', fig('New shares sold by build-out firms', F.shares, '12 months to 8 Nov 2026', 'Company filings (the page’s list)') + fig('New bonds sold by build-out firms', F.bonds, '12 months to 8 Nov 2026', 'Company filings (the page’s list)'), 'measured', 'SPX>ISS · ISS>HYP · BND>HYP'],
      ['Dollars flow abroad: orders and consumption', fig('Capex guidance 2026 (Amazon, Alphabet, Microsoft, Meta)', '$730bn', '2026', 'Company guidance, on the page') + fig('Computer imports, annual rate', '$601bn*', 'Q2 2026', 'BEA; *source under review') + fig('Top tenth’s share of consumer spending', 'more than 45%', '2026', 'Moody’s spending data, on the page') + fig('Share of their spending that goes on imports', '–', '', '', 'Not measured on this page.'), 'measured', 'HYP>CHP · TOP>CON · CON>EXP'],
      ['The surpluses come back to savers', fig('US current-account deficit', '−$1.18tn', '2025', 'BEA / IMF, Circuit step 06') + '<p class="vw-x">The dollars the rest of the world earns net from the US in a year. Export surpluses become private savings (a line that exists in this view only), beside the official route that is shrinking: foreign official holders sold $164bn of Treasuries in the year to August 2026, and official buyers put $165bn into US shares instead (Circuit, step 07).</p>', 'accounting', 'CHP>SAV · EXP>SAV · EXP>OFF']
    ];
    return '<div class="vw-reveal"><p>Allied savers do not fund the hyperscalers directly; they buy US shares and bonds in the market, and the firms raise money from that market. Even if foreign buyers had taken every new share and bond the build-out sold in a year (≈$480bn), that would be about a quarter of what they put into US securities ($1.88tn).</p>'
      + who('The comparison is arithmetic on measured figures (≈26%*, an upper bound; the two windows differ). The market route is the one that matters for the build-out, because it lifts valuations, which open the window for issuance and cheapen it. Adam Tooze reads it the same way.') + '</div>'
      + '<div class="vw-sav"><div class="vw-savh"><div class="pk">Allied savers · one level down</div><p>Defined by where the money comes from (the allies’ surpluses) and where it goes (US shares and bonds). TIC counts all foreign buyers, and part of what it records is US money booked in fund centres, so $1.88tn overstates what allied savers alone put in; the upper bound above still holds.</p></div>'
      + '<div class="vw-kids" role="group" aria-label="The five kinds of allied saver">' + KIDS.map(function (k, i) { return '<button type="button" class="vw-kid' + (i > 2 ? ' sm' : '') + '" data-kid="' + i + '" aria-expanded="false" aria-controls="isx-vw-kid"><b>' + e(k[0]) + '</b><span>' + e(k[1] === '–' ? '– · not found' : k[1]) + '</span></button>'; }).join('') + '</div><div class="vw-kidx" id="isx-vw-kid" aria-live="polite" hidden></div>'
      + '<div class="vw-pipes"><div class="vw-pipe thick"><i aria-hidden="true"></i><b>Into the markets</b><span>$1.88tn of US securities in the 12 months to August 2026 (TIC)</span></div><div class="vw-pipe thin"><i aria-hidden="true"></i><b>At issue</b><span>“–”: foreign buyers’ share of new AI bond issues is not measured on this page yet</span></div></div></div>'
      + '<ol class="vw-spine">' + st.map(function (s, i) { return '<li><div class="sn"><span>' + (i + 1) + '</span><b>' + e(s[0]) + '</b></div><div class="vw-figs">' + s[1] + '</div><div class="vw-meta"><span class="rl">' + e(s[3]) + '</span><span class="wr">' + e(s[2]) + '</span></div>'
        + (i === 1 ? reading('RD-M3', 'The amplifier', 'Optimistic coverage by media and analysts lifts AI valuations. Not measured on this page yet.', 'Not measured. It carries no line and no figure.') : '') + '</li>'; }).join('') + '</ol>'
      + '<p class="vw-foot">Each figure keeps its own period and measure. They are not meant to add up.</p>';
  }

  /* ---------- (b) the bond screen ---------- */
  var CCY = [   /* currency, amount in USD bn, local amount, weight, note. Order: the amount (decision 6); amounts from the data round F5, weights from F5b (14 Nov 2026) */
    ['US dollar', '$222bn', '', '30.2%', 'Medium confidence; 32.1% with the five firms taken out of the baseline (range 30.2% to 34.7%). Baseline: non-financial dollar investment-grade issuance, $735.8bn a year, 2021 to 2025 (ING Credit Research with Dealogic, 12 Jan 2026). The five firms only: Amazon, Alphabet, Meta, Oracle, Microsoft. The page’s own filing list (' + F.bonds + ', a wider set of firms) does not yet hold Microsoft’s $25bn (29 Oct 2026) or Meta’s $15bn (3 Nov 2026).'],
    ['Euro', '$43.7bn', '€38.5bn', '10.8%', 'An upper bound, low to medium confidence: the baseline (BIS, $405.9bn a year, 2021 to 2025) counts international issues only and leaves out euro bonds sold at home. Amazon, Alphabet (two deals) and Meta.'],
    ['Canadian dollar', '$16.0bn', 'C$22.5bn', '–', 'No weight: Statistics Canada publishes net issuance only, so no five-year baseline of gross issuance was found. Amazon (June 2026) and Alphabet (May 2026).'],
    ['Pound sterling', '$13.1bn', '£9.8bn', '–', 'No weight: the Bank of England series exists, but its values could not be retrieved in the data round. Alphabet (February 2026) and Amazon (September 2026).'],
    ['Swiss franc', '$7.6bn', 'CHF 5.9bn', '–', 'No weight: only totals for all issuers were found, none for non-financial firms. Amazon (May 2026) and Alphabet (February 2026).'],
    ['Australian dollar', '$3.9bn', 'A$5.5bn', '–', 'No weight: the Reserve Bank of Australia publishes the series as charts, without a data table. Alphabet (19 August 2026).'],
    ['Japanese yen', '$3.6bn', '¥576.5bn', '–', 'No weight: the closest series (JSDA, public straight corporate bonds, ¥14.7tn a year) includes financial firms, so it does not measure what the weight is meant to. Alphabet (15 May 2026).']
  ];
  /* ---------- fix round (14 Nov 2026): the bond screen's second level is one panel with pictures ----------
     Left, the Treasury curve; right, three lanes on one time axis (April 2016 to October 2026): the 10-year and the corporate
     yield with the credit spread shaded between them, bond volatility, and the five technology firms' bond deals. A cursor on
     the time axis (drag, or the arrow keys) redraws the curve for that month. Data: data/bond-panel.json, built from the data
     round's F7 (FRED) and A-bond-market (MOVE) files; deals: the page's filing list (ISX.deals). */
  var BP = null, bx = { i: -1, lane: 'y10', table: false };
  if (X.load) X.load('bond-panel').then(function (d) { BP = d; if (cur === 'bond' && lvl === 2 && box) draw(); }).catch(function () { BP = false; });
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var COL = { y10: '#b88a2e', baa: '#4b8fd0', move: '#d0703f', deal: '#c94f7c' };   /* checked with the dataviz validator against #0a1119 */
  var MAT = [['3M', '3-month', .25], ['2Y', '2-year', 2], ['5Y', '5-year', 5], ['10Y', '10-year', 10], ['30Y', '30-year', 30]];
  function mLab(m) { return MON[+m.slice(5, 7) - 1] + ' ' + m.slice(0, 4); }
  function f2(v) { return (+v).toFixed(2); }
  function N() { return BP.m.length; }   /* slot N is “latest”: the daily curve of 12 November 2026 */
  function deals() { return (X.deals || []); }
  function dealsAt(i) { var m = i < N() ? BP.m[i] : '2026-11'; return deals().filter(function (d) { return d.d === m; }); }
  function curveAt(i) {
    if (i >= N()) { var L = BP.daily[0]; return { v: L.v, lab: L.d, kind: 'daily close, ' + L.x }; }
    return { v: [BP.y3m[i], BP.y2[i], BP.y5[i], BP.y10[i], BP.y30[i]], lab: mLab(BP.m[i]), kind: 'monthly average' };
  }
  function shape(v) {
    var d = v[3] - v[0], d2 = v[3] - v[1];
    return d < 0 ? 'inverted: the 10-year ' + f2(-d) + ' points below the 3-month' : d2 < 0 ? 'humped: the 10-year below the 2-year, above the 3-month' : 'upward-sloping: the 10-year ' + f2(d) + ' points above the 3-month';
  }
  function curveSVG(i) {
    var W = 300, H = 250, x0 = 30, x1 = 270, y0 = 16, y1 = 214, top = 7;
    var X1 = function (t) { return x0 + (Math.sqrt(t) - .5) / (Math.sqrt(30) - .5) * (x1 - x0); }, Y = function (v) { return y1 - v / top * (y1 - y0); };
    var c = curveAt(i), latest = i >= N(), cmp = latest ? [BP.daily[1], BP.daily[2]] : [BP.daily[0]];
    var pl = function (v) { return MAT.map(function (q, k) { return X1(q[2]).toFixed(1) + ',' + Y(v[k]).toFixed(1); }).join(' '); };
    var g = '';
    for (var t = 0; t <= 6; t += 2) g += '<line class="gr" x1="' + x0 + '" x2="' + x1 + '" y1="' + Y(t).toFixed(1) + '" y2="' + Y(t).toFixed(1) + '"/><text class="ak" x="' + (x0 - 6) + '" y="' + (Y(t) + 3).toFixed(1) + '" text-anchor="end">' + t + '%</text>';
    g += MAT.map(function (q) { return '<text class="ak" x="' + X1(q[2]).toFixed(1) + '" y="' + (y1 + 16) + '" text-anchor="middle">' + q[0] + '</text>'; }).join('');
    var cm = cmp.map(function (D, k) { var ly = Y(D.v[4]) + (cmp.length > 1 ? (k ? -3 : 9) : (D.v[4] > c.v[4] ? -3 : 11)); return '<polyline class="cmp c' + k + '" points="' + pl(D.v) + '"/><text class="cl" x="' + (x1 + 8) + '" y="' + ly.toFixed(1) + '">' + e(D.d) + '</text>'; }).join('');
    var mn = '<polyline class="main" points="' + pl(c.v) + '"/>' + MAT.map(function (q, k) { var yy = Y(c.v[k]); return '<circle cx="' + X1(q[2]).toFixed(1) + '" cy="' + yy.toFixed(1) + '" r="3.2"/><text class="cv" x="' + (X1(q[2]) + (k === 4 ? -6 : k ? 0 : 4)).toFixed(1) + '" y="' + (yy - 9).toFixed(1) + '" text-anchor="' + (k === 4 ? 'end' : k ? 'middle' : 'start') + '">' + f2(c.v[k]) + '</text>'; }).join('');
    var lab = 'The Treasury curve, ' + c.lab + ' (' + c.kind + '): ' + MAT.map(function (q, k) { return q[1] + ' ' + f2(c.v[k]) + '%'; }).join(', ') + '. It is ' + shape(c.v) + '. Quiet lines for comparison: ' + cmp.map(function (D) { return D.d + ' (' + D.x + ')'; }).join(' and ') + '.';
    return '<svg class="bx-cv" viewBox="0 0 ' + (W + 50) + ' ' + H + '" role="img" aria-label="' + e(lab) + '">' + g + cm + mn + '</svg>';
  }
  /* the lanes: drawn once per opening; the cursor moves by attribute */
  var LGW = { x0: 40, x1: 690, W: 760, l1: [16, 126], l2: [152, 206], l3: [230, 262], ax: 280 }, LGN = { x0: 30, x1: 346, W: 432, l1: [18, 126], l2: [152, 206], l3: [230, 262], ax: 282 }, LG = LGW;   /* narrow: a phone */
  function lx(i) { var n = N() + 1; return LG.x0 + (i + .5) / n * (LG.x1 - LG.x0); }
  function ly1(v) { return LG.l1[1] - v / 7 * (LG.l1[1] - LG.l1[0]); }
  function ly2(v) { return LG.l2[1] - (v - 30) / 130 * (LG.l2[1] - LG.l2[0]); }
  function path(arr, fy) { return arr.map(function (v, i) { return (i ? 'L' : 'M') + lx(i).toFixed(1) + ',' + fy(v).toFixed(1); }).join(''); }
  function lanesSVG() {
    var n = N(), h = '', last = n - 1, gr = function (y) { return '<line class="gr" x1="' + LG.x0 + '" x2="' + LG.x1 + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>'; };
    h += '<text class="lt" x="' + LG.x0 + '" y="' + (LG.l1[0] - 5) + '">Treasury 10-year and corporate Baa · % a year</text>';
    [0, 2, 4, 6].forEach(function (t) { h += gr(ly1(t)) + '<text class="ak" x="' + (LG.x0 - 6) + '" y="' + (ly1(t) + 3).toFixed(1) + '" text-anchor="end">' + t + '</text>'; });
    var sp = 'M' + BP.baa.map(function (v, i) { return lx(i).toFixed(1) + ',' + ly1(v).toFixed(1); }).join('L') + 'L' + BP.y10.map(function (v, i) { return lx(i).toFixed(1) + ',' + ly1(v).toFixed(1); }).reverse().join('L') + 'Z';
    h += '<path class="spr" d="' + sp + '"/>';
    var w = 0, wi = 0; for (var k = 0; k < 60; k++) { var d = BP.baa[k] - BP.y10[k]; if (d > w) { w = d; wi = k; } }
    h += '<text class="sl" x="' + lx(wi).toFixed(1) + '" y="' + ly1((BP.baa[wi] + BP.y10[wi]) / 2 - .1).toFixed(1) + '" text-anchor="middle">credit spread</text>';
    h += '<path class="ln y10" data-ln="y10" d="' + path(BP.y10, ly1) + '"/><path class="ln baa" data-ln="baa" d="' + path(BP.baa, ly1) + '"/>';
    h += '<text class="el" data-ln="baa" x="' + (lx(n) + 4).toFixed(1) + '" y="' + (ly1(BP.baa[last]) + 3).toFixed(1) + '">Baa ' + f2(BP.baa[last]) + '</text>';
    h += '<text class="el" data-ln="y10" x="' + (lx(n) + 4).toFixed(1) + '" y="' + (ly1(BP.y10[last]) + 10).toFixed(1) + '">10-yr ' + f2(BP.y10[last]) + '</text>';
    h += '<text class="lt" x="' + LG.x0 + '" y="' + (LG.l2[0] - 5) + '">Bond volatility (MOVE) · index points</text>';
    [50, 100, 150].forEach(function (t) { h += gr(ly2(t)) + '<text class="ak" x="' + (LG.x0 - 6) + '" y="' + (ly2(t) + 3).toFixed(1) + '" text-anchor="end">' + t + '</text>'; });
    h += '<path class="ln move" data-ln="move" d="' + path(BP.move, ly2) + '"/><text class="el" data-ln="move" x="' + (lx(n) + 4).toFixed(1) + '" y="' + (ly2(BP.move[last]) + 3).toFixed(1) + '">MOVE ' + BP.move[last] + '</text>';
    h += '<text class="lt" x="' + LG.x0 + '" y="' + (LG.l3[0] - 9) + '">Bond sales by five tech firms · $bn, by month</text>' + gr(LG.l3[1]);
    var by = {}; deals().forEach(function (d) { by[d.d] = (by[d.d] || 0) + d.a; });
    Object.keys(by).forEach(function (m) { var i = m === '2026-11' ? n : BP.m.indexOf(m); if (i < 0) return; var hh = Math.max(2, by[m] / 60 * (LG.l3[1] - LG.l3[0])); h += '<rect class="dl" x="' + (lx(i) - 2).toFixed(1) + '" y="' + (LG.l3[1] - hh).toFixed(1) + '" width="4" height="' + hh.toFixed(1) + '" rx="1.5"/>'; });
    h += '<text class="ak" x="' + (LG.x0 - 6) + '" y="' + (LG.l3[1] + 3) + '" text-anchor="end">0</text><text class="ak" x="' + (LG.x0 - 6) + '" y="' + (LG.l3[1] - 31) + '" text-anchor="end">60</text>';
    for (var yr = 2017; yr <= 2026; yr++) { var ix = BP.m.indexOf(yr + '-01'); h += '<line class="tk" x1="' + lx(ix).toFixed(1) + '" x2="' + lx(ix).toFixed(1) + '" y1="' + LG.l3[1] + '" y2="' + (LG.l3[1] + 4) + '"/><text class="ak" x="' + lx(ix).toFixed(1) + '" y="' + LG.ax + '" text-anchor="middle">' + yr + '</text>'; }
    h += '<g class="cur"><line class="cl1" x1="0" x2="0" y1="' + (LG.l1[0] - 2) + '" y2="' + (LG.l3[1] + 2) + '"/><circle class="cd y10" r="3.4"/><circle class="cd baa" r="3.4"/><circle class="cd move" r="3.4"/><rect class="ch" x="-7" y="' + (LG.l3[1] + 5) + '" width="14" height="8" rx="3"/></g>';
    return '<svg class="bx-ln" viewBox="0 0 ' + LG.W + ' 286" aria-hidden="true">' + h + '</svg>';
  }
  function lanesAlt() {
    var n = N(), mx = function (a) { var m = Math.max.apply(null, a); return [m, BP.m[a.indexOf(m)]]; }, mnv = function (a) { var m = Math.min.apply(null, a); return [m, BP.m[a.indexOf(m)]]; };
    var sp = BP.baa.map(function (b, i) { return +(b - BP.y10[i]).toFixed(2); }), spx = mx(sp), spn = mnv(sp), ylo = mnv(BP.y10), mv = mx(BP.move), ds = deals().map(function (d) { return d.d; }).sort();
    return 'Monthly averages, ' + mLab(BP.m[0]) + ' to ' + mLab(BP.m[n - 1]) + '. The 10-year Treasury yield went from ' + f2(BP.y10[0]) + '% to ' + f2(BP.y10[n - 1]) + '%, with a low of ' + f2(ylo[0]) + '% in ' + mLab(ylo[1]) + '. Moody’s Baa corporate yield went from ' + f2(BP.baa[0]) + '% to ' + f2(BP.baa[n - 1]) + '%. The credit spread between them was widest at ' + f2(spx[0]) + ' points in ' + mLab(spx[1]) + ' and narrowest at ' + f2(spn[0]) + ' in ' + mLab(spn[1]) + '; it was ' + f2(sp[n - 1]) + ' in ' + mLab(BP.m[n - 1]) + '. Bond volatility (MOVE) peaked at ' + mv[0] + ' in ' + mLab(mv[1]) + ' and stood at ' + BP.move[n - 1] + '. ' + ds.length + ' bond deals by the five technology firms in the page’s list, from ' + (ds.length ? mLab(ds[0]) : '–') + ' on.';
  }
  var LANES = {
    y10: ['10-year Treasury', 'What the US government pays to borrow for ten years', 'Fed H.15 via FRED DGS10, monthly average of daily values (read 14 Nov 2026)', 'The benchmark price of long-term money: corporate bonds and mortgages are priced over it.', 'Practice, measured: new bonds are sold at a spread over Treasury yields.'],
    baa: ['Corporate yield (Moody’s Baa)', 'What companies rated Baa, the lowest investment grade, pay on their seasoned bonds', 'FRED BAA, Moody’s seasoned Baa corporate bond yield, monthly (read 14 Nov 2026)', 'The shaded gap over the 10-year is the credit spread: what lenders ask on top for lending to companies instead of the state. This is the whole corporate market, not the AI borrowers.', 'Measured; the spread is computed here (Baa minus 10-year).'],
    move: ['Bond volatility (MOVE)', 'How far traders expect Treasury yields to swing over the next month, in basis points a year; about 100 means swings of about 6 basis points a day', 'ICE BofA MOVE Index, daily closes via Yahoo Finance (^MOVE), monthly average (read 14 Nov 2026)', 'Low volatility, not the level of yields, is what the house controls: calm lowers haircuts and lets the same capital carry more bonds.', '']
  };
  function laneVal(k, i) { if (i >= N()) { if (k === 'y10') return f2(BP.daily[0].v[3]) + '%'; i = N() - 1; } var v = BP[k][i]; return k === 'move' ? String(v) : f2(v) + '%'; }
  function chipsHTML() {
    return '<div class="bx-chips" role="group" aria-label="The three indicators in the panel">' + Object.keys(LANES).map(function (k) { return '<button type="button" class="bx-chip" data-lane="' + k + '" aria-pressed="' + (bx.lane === k) + '"><i style="background:' + COL[k] + '" aria-hidden="true"></i><span>' + e(LANES[k][0]) + '</span><b data-cv="' + k + '"></b></button>'; }).join('') + '</div>'
      + '<div class="bx-note"></div>';
  }
  function noteHTML() {
    var L = LANES[bx.lane], i = bx.i, lab = i >= N() ? (bx.lane === 'y10' ? BP.daily[0].d + ', daily close' : mLab(BP.m[N() - 1]) + ' average, the latest month') : mLab(BP.m[i]) + ' average';
    return '<p><b>' + e(L[0]) + '</b> · ' + e(L[1]) + '. <span class="bv">' + e(laneVal(bx.lane, i)) + '</span> <em>' + e(lab) + '</em></p><p class="rd">' + e(L[3]) + ' <span>' + e(L[4]) + '</span></p>' + src(L[2]);
  }
  function readout(i) {
    var n = N(), ds = dealsAt(i), c = curveAt(i);
    var dt = ds.length ? ' · Deals: ' + ds.map(function (d) { return d.who + ' $' + (+d.a).toFixed(1) + 'bn' + (d.q ? '*' : ''); }).join(', ') : '';
    if (i >= n) return 'Latest, ' + c.lab + ' (daily closes): curve ' + MAT.map(function (q, k) { return q[0] + ' ' + f2(c.v[k]); }).join(', ') + ' · the monthly lanes end in October 2026' + dt;
    return mLab(BP.m[i]) + ' · 10-year ' + f2(BP.y10[i]) + '% · Baa ' + f2(BP.baa[i]) + '% · spread ' + f2(BP.baa[i] - BP.y10[i]) + ' points · MOVE ' + BP.move[i] + ' · curve ' + shape(c.v).split(':')[0] + dt;
  }
  function jumpsHTML() {
    var J = [['2020-03', 'Mar 2020'], ['2022-10', 'Oct 2022'], ['2023-05', 'May 2023'], ['2026-10', 'Oct 2026'], ['latest', '12 Nov 2026']];
    return '<div class="bx-jump" role="group" aria-label="Go to a month"><span>Go to</span>' + J.map(function (j) { return '<button type="button" data-bxj="' + j[0] + '">' + j[1] + '</button>'; }).join('') + '</div>';
  }
  function tableHTML() {
    var n = N(), r = '';
    for (var i = n - 1; i >= 0; i--) { var ds = dealsAt(i); r += '<tr><th scope="row">' + mLab(BP.m[i]) + '</th><td>' + [BP.y3m[i], BP.y2[i], BP.y5[i], BP.y10[i], BP.y30[i], BP.baa[i]].map(f2).join('</td><td>') + '</td><td>' + f2(BP.baa[i] - BP.y10[i]) + '</td><td>' + BP.move[i] + '</td><td>' + (ds.length ? ds.map(function (d) { return d.who + ' ' + (+d.a).toFixed(1) + (d.q ? '*' : ''); }).join('; ') : '') + '</td></tr>'; }
    var dl = BP.daily.map(function (D) { return '<tr><th scope="row">' + e(D.d) + '</th><td>' + D.v.map(f2).join('</td><td>') + '</td><td>' + e(D.x) + '</td></tr>'; }).join('');
    var nov = dealsAt(n);
    return '<div class="bx-tb" tabindex="0" role="region" aria-label="The panel as a table">'
      + '<table><caption>Daily curves (FRED, constant maturity, % a year)</caption><thead><tr><th scope="col">Day</th><th scope="col">3M</th><th scope="col">2Y</th><th scope="col">5Y</th><th scope="col">10Y</th><th scope="col">30Y</th><th scope="col">What it is</th></tr></thead><tbody>' + dl + '</tbody></table>'
      + '<table><caption>Monthly averages, newest first (% a year; spread in points; MOVE in index points; deals in $bn)' + (nov.length ? '. November 2026 deals: ' + nov.map(function (d) { return d.who + ' ' + (+d.a).toFixed(1); }).join('; ') : '') + '</caption><thead><tr><th scope="col">Month</th><th scope="col">3M</th><th scope="col">2Y</th><th scope="col">5Y</th><th scope="col">10Y</th><th scope="col">30Y</th><th scope="col">Baa</th><th scope="col">Spread</th><th scope="col">MOVE</th><th scope="col">Bond deals</th></tr></thead><tbody>' + r + '</tbody></table></div>';
  }
  function panelHTML() {
    if (BP === null) return '<section class="vw-p bx" data-rel="Y10~BAA"><p class="vw-x">Loading the series.</p></section>';
    if (BP === false) return '<section class="vw-p bx"><p class="vw-x">The series could not be loaded.</p></section>';
    if (bx.i < 0 || bx.i > N()) bx.i = N();
    LG = box && box.clientWidth && box.clientWidth < 640 ? LGN : LGW;
    return '<section class="vw-p bx" data-rel="Y10~BAA"><div class="bx-h"><div><div class="pk">Level 2 · one market, three readings</div><h4>Treasuries, corporate credit and volatility</h4></div>'
      + '<button type="button" class="bx-tg" data-bxt aria-pressed="' + bx.table + '">' + (bx.table ? 'View as charts' : 'View as table') + '</button></div>'
      + chipsHTML()
      + (bx.table ? tableHTML() : '<div class="bx-g"><figure class="bx-l"><figcaption class="lt2">The Treasury curve <span data-cvlab></span></figcaption><div class="bx-cvh"></div></figure>'
        + '<figure class="bx-r"><div class="bx-sl" role="slider" tabindex="0" aria-label="Month on the time axis; the curve on the left follows it" aria-valuemin="0" aria-valuemax="' + N() + '" aria-describedby="isx-bx-alt">' + lanesSVG() + '</div>'
        + '<p class="sr" id="isx-bx-alt">' + e(lanesAlt()) + '</p><p class="bx-ro"></p>' + jumpsHTML() + '</figure></div>')
      + '<p class="vw-x bx-cap">The corporate yield is Moody’s average of seasoned Baa-rated bonds: the whole corporate market, not the AI borrowers, whose own bond yields are not collected here. Monthly averages flatten spikes (March 2020 and March 2023 were sharper day to day). The curve’s points are constant-maturity yields, the 3-month too; the same bill quoted on a discount basis reads lower (4.12% against 4.30% on 10 November 2026). Deals: the page’s filing list to ' + e(X.dealsCut || '8 Nov 2026') + ', the five firms only; Alphabet reports its sales as period totals with no single date, so they are not on the axis, and Microsoft’s $25bn (29 Oct 2026) and Meta’s $15bn (3 Nov 2026) are not in the list yet. *Date or amount from press reports.</p>'
      + src('FRED (St. Louis Fed): DGS3MO, DGS2, DGS5, DGS10, DGS30 (Fed H.15) and BAA (Moody’s), monthly averages of daily values, and the daily curves of 12 Nov 2026, 10 Nov 2025 and 5 Oct 2026; ICE BofA MOVE Index (Yahoo Finance ^MOVE), monthly average of daily closes; all read 14 Nov 2026 (data round F7 and block A). Deals: company filings, as listed under “Shares and bonds sold”.') + '</section>';
  }
  function bxSet(i) {
    if (!BP || !box) return; var n = N(); bx.i = Math.max(0, Math.min(n, i));
    var cvh = box.querySelector('.bx-cvh'); if (cvh) cvh.innerHTML = curveSVG(bx.i);
    var cl = box.querySelector('[data-cvlab]'); if (cl) { var c = curveAt(bx.i); cl.textContent = '· ' + c.lab + ', ' + c.kind.split(',')[0]; }
    var g = box.querySelector('.bx-ln .cur'); if (g) {
      g.setAttribute('transform', 'translate(' + lx(bx.i).toFixed(1) + ',0)');
      [['y10', ly1], ['baa', ly1], ['move', ly2]].forEach(function (q) { var d = g.querySelector('.cd.' + q[0]); if (bx.i < n) { d.setAttribute('cy', q[1](BP[q[0]][bx.i]).toFixed(1)); d.style.display = ''; } else d.style.display = 'none'; });
    }
    var ro = readout(bx.i), r = box.querySelector('.bx-ro'); if (r) r.textContent = ro;
    var sl = box.querySelector('.bx-sl'); if (sl) { sl.setAttribute('aria-valuenow', String(bx.i)); sl.setAttribute('aria-valuetext', ro); }
    box.querySelectorAll('[data-cv]').forEach(function (b) { b.textContent = laneVal(b.dataset.cv, bx.i); });
    var nt = box.querySelector('.bx-note'); if (nt) nt.innerHTML = noteHTML();
  }
  function bxLane(k) {
    bx.lane = k; if (!box) return;
    box.querySelectorAll('.bx-chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lane === k)); });
    var svg = box.querySelector('.bx-ln'); if (svg) svg.setAttribute('data-hl', k);
    var nt = box.querySelector('.bx-note'); if (nt) nt.innerHTML = noteHTML();
  }
  function bxWire() {
    if (!BP || !box || !box.querySelector('.bx')) return;
    bxSet(bx.i); bxLane(bx.lane);
    var sl = box.querySelector('.bx-sl'); if (!sl) return;
    var svg = sl.querySelector('svg'), drag = false;
    var at = function (ev) { var r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * LG.W; return Math.round((x - LG.x0) / (LG.x1 - LG.x0) * (N() + 1) - .5); };
    sl.addEventListener('pointerdown', function (ev) { drag = true; try { sl.setPointerCapture(ev.pointerId); } catch (x) { /* ignore */ } bxSet(at(ev)); });
    sl.addEventListener('pointermove', function (ev) { if (drag) bxSet(at(ev)); });
    sl.addEventListener('pointerup', function () { drag = false; }); sl.addEventListener('pointercancel', function () { drag = false; });
    sl.addEventListener('keydown', function (ev) {
      var k = ev.key, d = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -12, PageUp: 12 }[k];
      if (d) { ev.preventDefault(); bxSet(bx.i + d); } else if (k === 'Home') { ev.preventDefault(); bxSet(0); } else if (k === 'End') { ev.preventDefault(); bxSet(N()); }
    });
  }
  function bondHTML() {
    if (lvl === 1) return '<div class="vw-tiles">'
      + fig('10-year yield · what the US government pays to borrow for ten years', '5.13%', 'October 2026 average; touched 5.33% intraday', 'Fed H.15 via FRED DGS10; Cboe (19 Oct 2026) for the intraday high')
      + fig('Bond volatility (MOVE) · expected swings in Treasury yields over a month', '≈100', 'Week to 16 Oct 2026 · 92nd–94th percentile', 'Cboe (19 Oct 2026), on the page') + '</div>'
      + '<div class="vw-halves">' + panel('pub', 'Public bonds', 'Treasuries', fig('Gross federal debt', '$40.25tn', 'Oct 2026', 'Circuit, step 08') + fig('Bills, share of marketable debt', '22.2%', 'Jul 2026', 'US Treasury financing estimates, via TrendForce (Aug 2026)') + fig('Deficit', '$1,992bn', 'Fiscal 2026', 'CBO (9 Nov 2026)'), 'TSY>PUB')
      + '<div class="vw-link" data-rel="BND>PUB"><div class="ll"><span>Same buyers, two borrowers.</span><em>Crowding out. The evidence is mixed: level 2 shows both sides.</em></div><p>AI bonds and Treasuries compete for the same long-term buyers; the more the build-out borrows, the less room is left for the state’s own debt, which is why liquidity has to be injected. Measured so far: other non-financial borrowers’ net issuance has turned negative, while their spreads have not widened (PIMCO, September 2026).</p></div>'
      + panel('prv', 'Private bonds', 'The build-out', fig('Build-out bonds sold', F.bonds, '12 months to 8 Nov 2026', 'Company filings (the page’s list)') + fig('of which in other currencies', '≈$73bn*', '12 months to 8 Nov 2026', '*Summed from the filing rows; the data round counts ≈$88bn, with Alphabet’s and Meta’s euro deals of 2 and 4 November') + fig('AI borrowers’ share of non-financial dollar investment-grade supply', 'almost one quarter', '2026 to date', 'PIMCO with Bloomberg (23 Sep 2026)')) + '</div>'
      ;
    return panelHTML()
      + '<div class="vw-test"><div class="pk">The relation, tested</div><ul>'
      + '<li class="for"><b>For it</b><p>Net issuance by non-AI non-financial issuers turned negative in 2025 and stayed negative in 2026.</p>' + src('PIMCO, on the ICE BofA dollar investment-grade index (31 Aug 2026). The chart’s numbers are not in its text: not collected.') + '</li>'
      + '<li class="ag"><b>Against it</b><p>Spreads of non-AI issuers have not widened, while the AI borrowers’ spreads have. Goldman Sachs reaches the same conclusion on spreads.</p>' + src('PIMCO (23 Sep 2026); Goldman Sachs via mezha.net (Aug 2026), a secondary source; the note itself: link not stored.') + '</li>'
      + '<li class="ag"><b>Against it, the Treasury channel</b><p>AI bond supply against Treasuries shows no clear sign in nominal yields, term premia or swap spreads.</p>' + src('PIMCO, “The Credit Market Lens: Hyperscalers Are Repricing, Not Displacing (So Far)” (Sep 2026).') + '</li></ul>'
      + '<p class="vw-x">PIMCO reads the fall in long-dated non-AI net issuance as companies timing maturity to Treasury yields, not as displacement; their gross issuance is still up on a year earlier. Against that stands balance-sheet crowding out: the same limited capacity of dealers, insurers and pension funds holds both borrowers’ long bonds.</p></div>'
      + '<details class="vw-more"><summary>More figures: the curve’s spreads and term premium, the operation aimed at volatility, both halves in detail</summary><div class="vw-grid2">'
      + panel('y10', 'Level 2', 'Beside the curve', fig('10-year minus 3-month', '0.90 points', 'October 2026 average', 'FRED T10Y3M (data round, 14 Nov 2026)') + fig('10-year minus 2-year', '0.39 points', 'October 2026 average', 'FRED T10Y2Y (data round, 14 Nov 2026)')
        + fig('Term premium (Kim–Wright)', '1.01 points', 'October 2026 average; 0.96 in September', 'Federal Reserve Board, via FRED THREEFYTP10. The New York Fed’s ACM series: not found')
        + reading('RD-M1', 'Held below the market’s own price', 'Without the operations of the two desks, long yields would be higher: Michael Howell calls it yield-curve control by stealth. Measured beside it: the 10-year still touched 5.33% intraday in October 2026.', 'Michael Howell.'))
      + panel('mov', 'Level 2', 'Aimed at volatility', fig('MOVE', '≈100', '99–102 in the week to 16 Oct 2026 · 92nd–94th percentile', 'Cboe (19 Oct 2026), on the page')
        + fig('The operation aimed at it: Treasury buybacks of long bonds', '$39.3bn', 'Seven operations of up to $6bn, 10 Sep to 4 Nov 2026', 'US Treasury operations as compiled by TFTC, a secondary source (data round); up to $70bn expected “for liquidity support” (Reuters, 4 Nov 2026)')
        + '<button type="button" class="vw-go" data-vw="desks" data-vr="house">The house always prints ›</button>')
      + panel('pub', 'Level 2', 'Public bonds: Treasuries', fig('Debt held by the public', '$32.82tn', '12 Nov 2026', 'Treasury Fiscal Data, Debt to the Penny; gross $40.61tn the same day (the page’s $40.25tn is October)') + fig('Bills, share of marketable debt', '22.96%', '31 Oct 2026 · 14.49% at the end of 2019', 'Monthly Statement of the Public Debt (data round); 22.2% in July, on the page')
        + fig('Net issuance, bills against coupons', '$834bn · $1,045bn', '2026 to 31 Oct', 'Computed from the Monthly Statement of the Public Debt: changes in the amounts outstanding, not gross auction sizes') + fig('Deficit · net interest', '$1,992bn · $1,142bn', 'Fiscal 2026', 'CBO (9 Nov 2026)'), 'TSY>PUB')
      + panel('prv', 'Level 2', 'Private bonds: the build-out', fig('Bonds sold by build-out firms', F.bonds, '12 months to 8 Nov 2026', 'Company filings (the page’s list)') + fig('Cover ratios on hyperscaler bonds', 'nearly 5× to under 2×', 'February to July 2026', 'Apollo, on the page') + fig('Bonds issued in 2026 trading at higher yields than at issue', '78 of 91', '28 Jul 2026', 'Reuters (29 Jul 2026), on the page')
        + fig('Loans behind data centres', '–', '', 'Morgan Stanley’s forecast of about $800bn of private credit to 2028 (Aug 2025) is on the page', 'Not measured: no source gives a total; the partial figures use different definitions and must not be added.')) + '</div></details>'
      + '<section class="vw-p ccy" data-rel="BND>CUR"><div class="pk">Level 2 · currencies of the alliance</div><h4>Borrowed abroad: ≈$88bn in six currencies, 12 months to 8 Nov 2026</h4>'
      + '<p class="vw-x">The build-out also borrows in the allies’ own currencies. This is a second place of crowding out: AI bonds take room in the euro, sterling, Swiss and Canadian markets that other borrowers there would use. The amounts are measured; the crowding out in these markets is not measured here.</p>'
      + '<div class="vw-ccy" role="table" aria-label="Big tech bond issuance by currency"><div class="ch" role="row"><span role="columnheader">Currency</span><span role="columnheader">(a) Amount</span><span role="columnheader">(b) Weight in its market</span></div>'
      + CCY.map(function (c) { return '<div class="cr" role="row"><span role="cell"><b>' + e(c[0]) + '</b></span><span role="cell"><b>' + e(c[1]) + '</b>' + (c[2] ? '<em>' + e(c[2]) + '</em>' : '') + '</span><span role="cell" class="' + (c[3] === '–' ? 'slot' : '') + '"><b>' + e(c[3]) + '</b><em>' + e(c[4]) + '</em></span></div>'; }).join('') + '</div>'
      + '<p class="vw-x">(a) The big tech firms’ bond issuance in the currency, 9 November 2025 to 8 November 2026, at deal-day dollar values; it sets the order. (b) The same issuance as a percentage of a normal year of non-financial corporate bond issuance in that currency (the average of 2021 to 2025). It shows how heavily the tech issuance weighs on that market, not proof that other borrowers are squeezed. Whether the proceeds are swapped back into dollars: “–”, not stated in the filings on this page.</p>'
      + src('Company filings (SEC pricing term sheets) and press reports of the deals (Reuters, IFR, Bloomberg, counsel), as collected in the data rounds F5 and F5b (14 Nov 2026); ING Credit Research with Dealogic, “US Dollar Credit Supply” (12 Jan 2026), for the dollar baseline; BIS debt securities statistics for the euro baseline. Per-deal links: not stored on this page.') + '</section>';
  }

  /* ---------- (c) the two desks ---------- */
  var OPS = [
    ['Fund the deficit with bills', 'Treasury', 'Bills 22.2% of marketable debt (Jul 2026); net bill issuance $906bn in the 12 months to June 2026', 'US Treasury financing estimates, via TrendForce (Aug 2026); CME Group (6 Aug 2026)', 0],
    ['Buy back long bonds', 'Treasury', 'Up to $6bn per operation from 9 Sep 2026, three times the standard $2bn; up to $70bn expected “for liquidity support” (4 Nov 2026)', 'Reuters (20 Aug and 4 Nov 2026)', 1],
    ['The Fed buys bills', 'Fed', 'About $40bn in the first month, from 12 Dec 2025; $25bn from April, $10bn from May, paused from August 2026; bill holdings $571bn (28 Oct 2026)', 'New York Fed (10 Dec 2025); Fed H.4.1 (29 Oct 2026)', 2],
    ['Uncap the repo backstop', 'Fed', 'The $500bn cap removed on 11 Dec 2025', 'New York Fed (10 Dec 2025)', 14],
    ['Free up the big banks', 'Regulators', 'Tier 1 requirements at the bank subsidiaries down $219bn (28%); final rule 25 Nov 2025, in force 1 Apr 2026', 'Federal Reserve, FDIC, OCC; statement by Governor Barr (25 Nov 2025)', 3]
  ];
  function desksHTML() {
    var H = ['The Treasury funds the deficit with bills', 'The Treasury buys back long bonds', 'The Fed buys the bills', 'The banks hold the rest, with lower capital requirements'];
    var HF = ['Bills 22.2% of marketable debt (Jul 2026)', 'Up to $6bn per operation from 9 Sep 2026', 'Reserve management purchases from 12 Dec 2025; bill holdings $571bn (28 Oct 2026)', '$219bn lower requirements at the bank subsidiaries, in force 1 Apr 2026'];
    return '<div class="vw-desks" data-rel="TSY~FED"><div class="dk tsy"><div class="pk">Desk one</div><h4>US Treasury</h4><p>Decides what debt to sell: bills or bonds, and which bonds to buy back.</p></div>'
      + '<div class="dline"><span class="pk">Coordination: contested.</span><span>Central-bank independence is the question.</span></div>'
      + '<div class="dk fed"><div class="pk">Desk two</div><h4>Federal Reserve</h4><p>Sets the policy rate, buys bills to keep reserves ample, and stands behind repo.</p>' + fig('Fed balance sheet', '$6.76tn', '11 Nov 2026', 'Fed H.4.1 via FRED (data round)') + '</div></div>'
      + '<button type="button" class="vw-go play" data-vplay="door">Run the episode “The revolving door” ›<small>Speculative: its links are connections, not a recorded plan.</small></button>'
      + '<section class="vw-p ops"><div class="pk">The operations · each is a lever on the map, dated</div><ul class="vw-ops">' + OPS.map(function (o) { return '<li><button type="button" class="vw-lev" data-vlev="' + o[4] + '"><b>' + e(o[0]) + '</b><span>' + e(o[1]) + '</span></button><p>' + e(o[2]) + '</p>' + src(o[3]) + '</li>'; }).join('') + '</ul></section>'
      + '<div class="vw-rds">'
      + reading('RD-M1', 'Held below the market’s own price', 'The operations hold long yields and the cost of long-term borrowing below what the market alone would set. Michael Howell calls it yield-curve control by stealth. Measured beside it: the 10-year still touched 5.33% intraday in October 2026.', 'Michael Howell.')
      + reading('RD-M2', 'Oil below what supply and demand alone would give', 'Oil prices stay below what supply and demand alone would give, through algorithmic trading and the flow of headlines. Brent fell almost 6% on 9 November 2026, the day a Saudi pipeline fire was reported, and below $90 on 10 November.', 'Elias Rutten (“Why Oil Falls When Pipelines Burn”, 10 Nov 2026).')
      + '</div>'
      + '<aside class="vw-rd house" data-rd="house" id="isx-vw-house"><div class="pk">Reading</div><h4>The house always prints</h4><p>The money printer never stopped: the Treasury, the Fed and the banks split the work in four steps, so that none of them prints money alone. It is not cheap money: it is secret money printing.</p>'
      + '<ol class="vw-house">' + H.map(function (h, i) { return '<li><b>' + e(h) + '</b><span>' + e(HF[i]) + '</span></li>'; }).join('') + '</ol><p class="vw-x">Duration out, money in.</p>' + who('The four steps and the conclusion: Elias Rutten, “The house always prints” (18 Sep 2026); the operations and their figures are this page’s, measured.')
      + '<a class="vw-sub" href="' + EP + 'the-house-always-prints" target="_blank" rel="noopener">' + SUB + 'The house always prints<em>Paid</em></a></aside>'
      + '<p class="vw-foot">The readings on this screen follow Elias Rutten’s essays “The house always prints” (18 Sep 2026) and “Why Oil Falls When Pipelines Burn” (10 Nov 2026).</p>';
  }

  var V = {
    loop: { t: 'The money loop', s: 'How the allies’ savings reach the build-out, and come back', html: loopHTML },
    bond: { t: 'The bond screen', s: 'Public bonds, private bonds, and the relation between them', html: bondHTML },
    desks: { t: 'The two desks', s: 'The Treasury and the Fed, their operations, and the readings', html: desksHTML }
  };

  /* ---------- the sheet ---------- */
  function draw(focusRel) {
    var W = V[cur];
    box.setAttribute('aria-label', 'Inside the machinery: ' + W.t);
    box.dataset.v = cur; box.dataset.l = String(lvl);
    box.innerHTML = '<header class="vw-h"><div><div class="pk">Inside the machinery' + (cur === 'bond' ? ' · level ' + lvl + ' of 2' : '') + '</div><h3 id="isx-vw-t">' + e(W.t) + '</h3><p>' + e(W.s) + '</p></div>'
      + (cur === 'bond' ? '<button type="button" class="vw-zoom" data-vlvl="' + (lvl === 1 ? 2 : 1) + '">' + (lvl === 1 ? 'Zoom in: yields, credit and volatility' : 'Zoom out: the main figures') + '</button>' : '')
      + '<button type="button" class="vw-x1" data-vclose aria-label="Close this view">×</button></header><div class="vw-b" tabindex="0" role="group" aria-labelledby="isx-vw-t">' + W.html() + '</div>';
    if (cur === 'bond' && lvl === 2) bxWire();
    if (focusRel) { var t = box.querySelector('[data-rel="' + focusRel + '"], [data-rd="' + focusRel + '"]'); if (t) { t.classList.add('hl'); setTimeout(function () { t.scrollIntoView({ block: 'nearest', behavior: X.reduce ? 'auto' : 'smooth' }); }, 60); } }
  }
  /* fix round, stage 3: the zoom is a motion. A view grows out of the element that opened it (a gauge or plate on the map,
     or the door that was pressed) and shrinks back into it when it closes: one continuous space. Level 1 to level 2 grows out
     of the main figures; level 2 to level 1 settles back. Reduced motion: a quick fade instead. */
  var anim = null, MO = 'cubic-bezier(.2, .8, .2, 1)';
  function ease() { try { var v = getComputedStyle(root).getPropertyValue('--mo').trim(); return v || MO; } catch (x) { return MO; } }
  function originRect(o) {
    var el = null;
    if (o && o.origin) { el = root.querySelector('#isx-rmap .fn[data-n="' + o.origin + '"]'); if (el && el.classList.contains('s4dim')) el = null; }
    if (!el && o && o.from && o.from.isConnected) el = o.from;
    var r = el && el.getBoundingClientRect(); return r && r.width > 2 && r.height > 2 ? r : null;
  }
  function inset(r, b) { return 'inset(' + Math.max(0, r.top - b.top).toFixed(1) + 'px ' + Math.max(0, b.right - r.right).toFixed(1) + 'px ' + Math.max(0, b.bottom - r.bottom).toFixed(1) + 'px ' + Math.max(0, r.left - b.left).toFixed(1) + 'px round 14px)'; }
  function grow(el, r, back, done) {
    if (anim) { try { anim.cancel(); } catch (x) { /* ignore */ } anim = null; }
    if (!el.animate) { if (done) done(); return; }
    var fr;
    if (X.reduce || !r) fr = [{ opacity: back ? 1 : 0 }, { opacity: back ? 0 : 1 }];
    else { var b = el.getBoundingClientRect(), a = inset(r, b), z = 'inset(0px 0px 0px 0px round 18px)'; fr = back ? [{ clipPath: z, opacity: 1 }, { clipPath: a, opacity: .35 }] : [{ clipPath: a, opacity: .35 }, { clipPath: z, opacity: 1 }]; }
    /* a zoom has to be seen: slower to start than the house curve (--mo), which is for small moves */
    anim = el.animate(fr, { duration: X.reduce || !r ? 140 : (back ? 420 : 640), easing: X.reduce || !r ? 'linear' : back ? 'cubic-bezier(.55, 0, .45, 1)' : 'cubic-bezier(.5, 0, .15, 1)', fill: 'both' });
    el.dataset.mo = back ? 'out' : 'in';
    anim.onfinish = function () { anim = null; delete el.dataset.mo; if (done) done(); try { el.getAnimations().forEach(function (a) { a.cancel(); }); } catch (x) { /* ignore */ } };
  }
  function levelMotion(to, r0) {
    var b = box && box.querySelector('.vw-b'); if (!b || !b.animate) return;
    if (X.reduce) { b.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140 }); return; }
    var bb = b.getBoundingClientRect();
    if (to === 2 && r0) b.animate([{ clipPath: inset(r0, bb), opacity: .4 }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', opacity: 1 }], { duration: 560, easing: 'cubic-bezier(.5, 0, .15, 1)' });
    else b.animate([{ transform: 'scale(1.035)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: ease() });
  }
  function open(id, o) {
    o = o || {}; var host = $('cock'); if (!V[id] || !host) return false;
    if (!box || !host.contains(box)) { box = document.createElement('section'); box.className = 'vw'; box.id = 'isx-vw'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'false'); host.appendChild(box); wire(); }
    var was = !!cur;
    if (!cur) { from = o.from || document.activeElement; fromO = o; }
    cur = id;
    /* a relation that lives at level 2 opens level 2; the house card lives in the desks */
    lvl = id === 'bond' && (o.level === 2 || o.rel === 'BND>CUR') ? 2 : 1;
    box.hidden = false; draw(o.rel);
    host.classList.add('vw-on');
    box.classList.add('in');
    if (!was) grow(box, originRect(o), false);
    var c = box.querySelector('.vw-x1'); if (c) c.focus({ preventScroll: true });
    if (X.emit) X.emit('views', id);
    return true;
  }
  function close() {
    if (!cur || !box) return;
    cur = null; var b = box, r = originRect(fromO);
    var fin = function () { if (cur) return; b.classList.remove('in'); b.hidden = true; b.innerHTML = ''; };
    grow(b, r, true, fin);
    var host = $('cock'); if (host) host.classList.remove('vw-on');
    if (from && from.isConnected && from.focus) from.focus({ preventScroll: true });
    from = null; fromO = null; if (X.emit) X.emit('views', null);
  }
  function wire() {
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b || !box.contains(b)) return;
      var d = b.dataset; ev.stopPropagation();
      if (d.vclose != null) { close(); return; }
      if (d.lane) { bxLane(d.lane); return; }
      if (d.bxt != null) { bx.table = !bx.table; draw(); var tg = box.querySelector('.bx-tg'); if (tg) tg.focus({ preventScroll: true }); return; }
      if (d.bxj) { bxSet(d.bxj === 'latest' ? N() : BP.m.indexOf(d.bxj)); return; }
      if (d.vlvl) { var t1 = box.querySelector('.vw-tiles'), r0 = t1 && t1.getBoundingClientRect(); lvl = +d.vlvl; draw(); levelMotion(lvl, r0); var z = box.querySelector('.vw-zoom'); if (z) z.focus({ preventScroll: true }); box.querySelector('.vw-b').scrollTop = 0; return; }
      if (d.vw) { cur = d.vw; lvl = 1; draw(d.vr); var c = box.querySelector('.vw-x1'); if (c) c.focus({ preventScroll: true }); return; }
      if (d.kid != null) {
        var k = KIDS[+d.kid], out = box.querySelector('.vw-kidx'), was = b.getAttribute('aria-expanded') === 'true';
        box.querySelectorAll('.vw-kid').forEach(function (x) { x.setAttribute('aria-expanded', 'false'); });
        if (was) { out.hidden = true; out.innerHTML = ''; return; }
        b.setAttribute('aria-expanded', 'true'); out.hidden = false;
        out.innerHTML = '<h5>' + e(k[0]) + '</h5><p>' + e(k[2]) + '</p><p>' + e(k[3]) + '</p><div class="vw-fig' + (k[1] === '–' ? ' slot' : '') + '"><span class="fk">US holdings</span><p>' + e(k[4]) + '</p></div>' + who('measured, where a figure is given');
        return;
      }
      if (d.vplay != null && X.simPlay) { close(); X.simPlay(isNaN(+d.vplay) ? d.vplay : +d.vplay); return; }
      if (d.vlev != null && X.simLever) { close(); X.simLever(+d.vlev); return; }
    });
    box.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); close(); } });
  }
  X.views = { open: open, close: close, get on() { return cur; }, get level() { return lvl; }, ids: Object.keys(V) };
  X.on('view', function () { if (cur) close(); });
  X.on('fin', function () { if (cur) { cur = null; box = null; from = null; fromO = null; } if (anim) { try { anim.cancel(); } catch (x) { /* ignore */ } anim = null; } });   /* the stage was rebuilt: the sheet went with it */
})();
