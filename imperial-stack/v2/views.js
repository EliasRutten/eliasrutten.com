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
  var box = null, cur = null, lvl = 1, from = null;
  var EP = 'https://eliasrutten.substack.com/p/';
  var SUB = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M2.5 1.5h11v1.6h-11zM2.5 4.4h11V6h-11zM2.5 7.3h11v7.2L8 11.4l-5.5 3.1z"/></svg>';

  /* ---------- small builders ---------- */
  function who(t) { return '<p class="vw-who"><span>Whose reading</span> ' + e(t) + '</p>'; }
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
      + who('The comparison is arithmetic on measured figures (≈26%*, an upper bound; the two windows differ). That the market route is the one that matters for the build-out, because it lifts valuations, which open the window for issuance and cheapen it, is Elias Rutten’s reading, shared with Adam Tooze.') + '</div>'
      + '<div class="vw-sav"><div class="vw-savh"><div class="pk">Allied savers · one level down</div><p>Defined by where the money comes from (the allies’ surpluses) and where it goes (US shares and bonds). TIC counts all foreign buyers, and part of what it records is US money booked in fund centres, so $1.88tn overstates what allied savers alone put in; the upper bound above still holds.</p></div>'
      + '<div class="vw-kids" role="group" aria-label="The five kinds of allied saver">' + KIDS.map(function (k, i) { return '<button type="button" class="vw-kid' + (i > 2 ? ' sm' : '') + '" data-kid="' + i + '" aria-expanded="false" aria-controls="isx-vw-kid"><b>' + e(k[0]) + '</b><span>' + e(k[1] === '–' ? '– · not found' : k[1]) + '</span></button>'; }).join('') + '</div><div class="vw-kidx" id="isx-vw-kid" aria-live="polite" hidden></div>'
      + '<div class="vw-pipes"><div class="vw-pipe thick"><i aria-hidden="true"></i><b>Into the markets</b><span>$1.88tn of US securities in the 12 months to August 2026 (TIC)</span></div><div class="vw-pipe thin"><i aria-hidden="true"></i><b>At issue</b><span>“–”: foreign buyers’ share of new AI bond issues is not measured on this page yet</span></div></div></div>'
      + '<ol class="vw-spine">' + st.map(function (s, i) { return '<li><div class="sn"><span>' + (i + 1) + '</span><b>' + e(s[0]) + '</b></div><div class="vw-figs">' + s[1] + '</div><div class="vw-meta"><span class="rl">' + e(s[3]) + '</span><span class="wr">' + e(s[2]) + '</span></div>'
        + (i === 1 ? reading('RD-M3', 'The amplifier', 'In the map’s reading, optimistic coverage by media and analysts lifts AI valuations (after Rutten). Not measured on this page yet.', 'The map’s reading, after Elias Rutten. It carries no line and no figure.') : '') + '</li>'; }).join('') + '</ol>'
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
  function curveSVG() {   /* three points of the curve from the data round's October averages; levels derived from the two spreads */
    var pts = [['3-month', 4.23], ['2-year', 4.74], ['10-year', 5.13]], x = [26, 96, 196], y = function (v) { return 74 - (v - 4) * 46; };
    return '<svg class="vw-curve" viewBox="0 0 230 92" role="img" aria-label="The Treasury curve, October 2026 averages: 3-month about 4.23 per cent, 2-year about 4.74 per cent, 10-year 5.13 per cent"><path d="M14 78.5h206" class="ax"/><polyline class="ln" points="' + pts.map(function (p, i) { return x[i] + ',' + y(p[1]).toFixed(1); }).join(' ') + '"/>'
      + pts.map(function (p, i) { return '<circle cx="' + x[i] + '" cy="' + y(p[1]).toFixed(1) + '" r="3"/><text x="' + x[i] + '" y="' + (y(p[1]) - 8).toFixed(1) + '" text-anchor="middle" class="v">' + p[1].toFixed(2) + '%' + (i < 2 ? '*' : '') + '</text><text x="' + x[i] + '" y="89" text-anchor="middle" class="k">' + p[0] + '</text>'; }).join('') + '</svg>';
  }
  function bondHTML() {
    if (lvl === 1) return '<div class="vw-tiles">'
      + fig('10-year yield · what the US government pays to borrow for ten years', '5.14%', 'October 2026 average; touched 5.33%', 'Fed H.15 via FRED; Cboe (19 Oct 2026), on the page')
      + fig('Bond volatility (MOVE) · expected swings in Treasury yields over a month', '≈100', 'Week to 16 Oct 2026 · 92nd–94th percentile', 'Cboe (19 Oct 2026), on the page') + '</div>'
      + '<div class="vw-halves">' + panel('pub', 'Public bonds', 'Treasuries', fig('Gross federal debt', '$40.25tn', 'Oct 2026', 'Circuit, step 08') + fig('Bills, share of marketable debt', '22.2%', 'Jul 2026', 'US Treasury financing estimates, via TrendForce (Aug 2026)') + fig('Deficit', '$1,992bn', 'Fiscal 2026', 'CBO (9 Nov 2026)'), 'TSY>PUB')
      + '<div class="vw-link" data-rel="BND>PUB"><div class="ll"><span>Same buyers, two borrowers.</span><em>Crowding out: Elias Rutten’s reading. The evidence is mixed.</em></div><p>AI bonds and Treasuries compete for the same long-term buyers; in Elias Rutten’s reading, the more the build-out borrows, the less room is left for the state’s own debt, which is why liquidity has to be injected. Measured so far: other non-financial borrowers’ net issuance has turned negative, while their spreads have not widened (PIMCO, September 2026).</p></div>'
      + panel('prv', 'Private bonds', 'The build-out', fig('Build-out bonds sold', F.bonds, '12 months to 8 Nov 2026', 'Company filings (the page’s list)') + fig('of which in other currencies', '≈$73bn*', '12 months to 8 Nov 2026', '*Summed from the filing rows; the data round counts ≈$88bn, with Alphabet’s and Meta’s euro deals of 2 and 4 November') + fig('AI borrowers’ share of non-financial dollar investment-grade supply', 'almost one quarter', '2026 to date', 'PIMCO with Bloomberg (23 Sep 2026)')) + '</div>'
      + '<div class="vw-test"><div class="pk">The relation, tested</div><ul>'
      + '<li class="for"><b>For it</b><p>Net issuance by non-AI non-financial issuers turned negative in 2025 and stayed negative in 2026.</p>' + src('PIMCO, on the ICE BofA dollar investment-grade index (31 Aug 2026). The chart’s numbers are not in its text: not collected.') + '</li>'
      + '<li class="ag"><b>Against it</b><p>Spreads of non-AI issuers have not widened, while the AI borrowers’ spreads have. Goldman Sachs reaches the same conclusion on spreads.</p>' + src('PIMCO (23 Sep 2026); Goldman Sachs via mezha.net (Aug 2026), a secondary source; the note itself: link not stored.') + '</li>'
      + '<li class="ag"><b>Against it, the Treasury channel</b><p>AI bond supply against Treasuries shows no clear sign in nominal yields, term premia or swap spreads.</p>' + src('PIMCO, “The Credit Market Lens: Hyperscalers Are Repricing, Not Displacing (So Far)” (Sep 2026).') + '</li></ul>'
      + '<p class="vw-x">PIMCO reads the fall in long-dated non-AI net issuance as companies timing maturity to Treasury yields, not as displacement; their gross issuance is still up on a year earlier. Elias Rutten’s reading is balance-sheet crowding out: the same limited capacity of dealers, insurers and pension funds holds both borrowers’ long bonds.</p></div>';
    return '<div class="vw-grid2">'
      + panel('y10', 'Level 2', '10-year yield and the curve', curveSVG() + fig('10-year minus 3-month', '0.90 points', 'October 2026 average', 'FRED T10Y3M (data round, 14 Nov 2026)') + fig('10-year minus 2-year', '0.39 points', 'October 2026 average', 'FRED T10Y2Y. *The 3-month and 2-year levels on the chart are derived from these spreads; the 30-year was not collected for the same period')
        + fig('Term premium (Kim–Wright)', '1.01 points', 'October 2026 average; 0.96 in September', 'Federal Reserve Board, via FRED THREEFYTP10. The New York Fed’s ACM series: not found')
        + reading('RD-M1', 'Held below the market’s own price', 'The map’s reading: without the operations of the two desks, long yields would be higher. Michael Howell calls it yield-curve control by stealth. Measured beside it: the 10-year still touched 5.33% in October 2026.', 'The map’s reading; Howell, shared by Elias Rutten.'))
      + panel('mov', 'Level 2', 'Bond volatility (MOVE)', '<p class="vw-x">How far traders expect Treasury yields to swing over the next month, in basis points a year; about 100 means swings of about 6 basis points a day.</p>' + fig('MOVE', '≈100', '99–102 in the week to 16 Oct 2026 · 92nd–94th percentile', 'Cboe (19 Oct 2026), on the page')
        + fig('The operation aimed at it: Treasury buybacks of long bonds', '$39.3bn', 'Seven operations of up to $6bn, 10 Sep to 4 Nov 2026', 'US Treasury operations as compiled by TFTC, a secondary source (data round); up to $70bn expected “for liquidity support” (Reuters, 4 Nov 2026)')
        + '<p class="vw-x">In Elias Rutten’s reading, low volatility, not the level of yields, is what the house controls: calm lowers haircuts and lets the same capital carry more bonds.</p><button type="button" class="vw-go" data-vw="desks" data-vr="house">The house always prints ›</button>')
      + panel('pub', 'Level 2', 'Public bonds: Treasuries', fig('Debt held by the public', '$32.82tn', '12 Nov 2026', 'Treasury Fiscal Data, Debt to the Penny; gross $40.61tn the same day (the page’s $40.25tn is October)') + fig('Bills, share of marketable debt', '22.96%', '31 Oct 2026 · 14.49% at the end of 2019', 'Monthly Statement of the Public Debt (data round); 22.2% in July, on the page')
        + fig('Net issuance, bills against coupons', '$834bn · $1,045bn', '2026 to 31 Oct', 'Computed from the Monthly Statement of the Public Debt: changes in the amounts outstanding, not gross auction sizes') + fig('Deficit · net interest', '$1,992bn · $1,142bn', 'Fiscal 2026', 'CBO (9 Nov 2026)'), 'TSY>PUB')
      + panel('prv', 'Level 2', 'Private bonds: the build-out', fig('Bonds sold by build-out firms', F.bonds, '12 months to 8 Nov 2026', 'Company filings (the page’s list)') + fig('Cover ratios on hyperscaler bonds', 'nearly 5× to under 2×', 'February to July 2026', 'Apollo, on the page') + fig('Bonds issued in 2026 trading at higher yields than at issue', '78 of 91', '28 Jul 2026', 'Reuters (29 Jul 2026), on the page')
        + fig('Loans behind data centres', '–', '', 'Morgan Stanley’s forecast of about $800bn of private credit to 2028 (Aug 2025) is on the page', 'Not measured: no source gives a total; the partial figures use different definitions and must not be added.')) + '</div>'
      + '<section class="vw-p ccy" data-rel="BND>CUR"><div class="pk">Level 2 · currencies of the alliance</div><h4>Borrowed abroad: ≈$88bn in six currencies, 12 months to 8 Nov 2026</h4>'
      + '<p class="vw-x">The build-out also borrows in the allies’ own currencies. In Elias Rutten’s reading this is a second place of crowding out: AI bonds take room in the euro, sterling, Swiss and Canadian markets that other borrowers there would use. The amounts are measured; the crowding out is his reading, and for these markets it is not measured here.</p>'
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
      + '<button type="button" class="vw-go play" data-vplay="10">Run the play “Coordinate with the Fed” ›<small>Speculative: its links are connections, not a recorded plan.</small></button>'
      + '<section class="vw-p ops"><div class="pk">The operations · each is a lever on the map, dated</div><ul class="vw-ops">' + OPS.map(function (o) { return '<li><button type="button" class="vw-lev" data-vlev="' + o[4] + '"><b>' + e(o[0]) + '</b><span>' + e(o[1]) + '</span></button><p>' + e(o[2]) + '</p>' + src(o[3]) + '</li>'; }).join('') + '</ul></section>'
      + '<div class="vw-rds">'
      + reading('RD-M1', 'Held below the market’s own price', 'The operations hold long yields and the cost of long-term borrowing below what the market alone would set. Michael Howell calls it yield-curve control by stealth. Measured beside it: the 10-year still touched 5.33% in October 2026.', 'The map’s reading; Howell, shared by Elias Rutten.')
      + reading('RD-M2', 'Oil below what supply and demand alone would give', 'Oil prices stay below what supply and demand alone would give, through algorithmic trading and the flow of headlines. Brent fell almost 6% on 9 November 2026, the day a Saudi pipeline fire was reported, and below $90 on 10 November.', 'Elias Rutten (“Why Oil Falls When Pipelines Burn”, 10 Nov 2026); the map’s reading.')
      + '</div>'
      + '<aside class="vw-rd house" data-rd="house" id="isx-vw-house"><div class="pk">Reading · Elias Rutten</div><h4>The house always prints</h4><p>In Elias Rutten’s reading, the money printer never stopped: the Treasury, the Fed and the banks split the work in four steps, so that none of them prints money alone. It is not cheap money, he argues: it is secret money printing.</p>'
      + '<ol class="vw-house">' + H.map(function (h, i) { return '<li><b>' + e(h) + '</b><span>' + e(HF[i]) + '</span></li>'; }).join('') + '</ol><p class="vw-x">Duration out, money in (Rutten).</p>' + who('The four steps and the conclusion are Elias Rutten’s (“The house always prints”, 18 Sep 2026); the operations and their figures are this page’s, measured.')
      + '<a class="vw-sub" href="' + EP + 'the-house-always-prints" target="_blank" rel="noopener">' + SUB + 'The house always prints<em>Paid</em></a></aside>'
      + '<p class="vw-foot">Readings marked “Rutten” are Elias Rutten’s, from “The house always prints” (18 Sep 2026) and “Why Oil Falls When Pipelines Burn” (10 Nov 2026).</p>';
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
      + (cur === 'bond' ? '<button type="button" class="vw-zoom" data-vlvl="' + (lvl === 1 ? 2 : 1) + '">' + (lvl === 1 ? 'Zoom in: curve, volatility, currencies' : 'Zoom out: the main figures') + '</button>' : '')
      + '<button type="button" class="vw-x1" data-vclose aria-label="Close this view">×</button></header><div class="vw-b" tabindex="-1">' + W.html() + '</div>';
    if (focusRel) { var t = box.querySelector('[data-rel="' + focusRel + '"], [data-rd="' + focusRel + '"]'); if (t) { t.classList.add('hl'); setTimeout(function () { t.scrollIntoView({ block: 'nearest', behavior: X.reduce ? 'auto' : 'smooth' }); }, 60); } }
  }
  function open(id, o) {
    o = o || {}; var host = $('cock'); if (!V[id] || !host) return false;
    if (!box || !host.contains(box)) { box = document.createElement('section'); box.className = 'vw'; box.id = 'isx-vw'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'false'); host.appendChild(box); wire(); }
    if (!cur) from = o.from || document.activeElement;
    cur = id;
    /* a relation that lives at level 2 opens level 2; the house card lives in the desks */
    lvl = id === 'bond' && (o.level === 2 || o.rel === 'BND>CUR') ? 2 : 1;
    box.hidden = false; draw(o.rel);
    host.classList.add('vw-on');
    requestAnimationFrame(function () { if (box) box.classList.add('in'); });
    var c = box.querySelector('.vw-x1'); if (c) c.focus({ preventScroll: true });
    if (X.emit) X.emit('views', id);
    return true;
  }
  function close() {
    if (!cur || !box) return;
    cur = null; box.classList.remove('in'); box.hidden = true; box.innerHTML = '';
    var host = $('cock'); if (host) host.classList.remove('vw-on');
    if (from && from.isConnected && from.focus) from.focus({ preventScroll: true });
    from = null; if (X.emit) X.emit('views', null);
  }
  function wire() {
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b || !box.contains(b)) return;
      var d = b.dataset; ev.stopPropagation();
      if (d.vclose != null) { close(); return; }
      if (d.vlvl) { lvl = +d.vlvl; draw(); var z = box.querySelector('.vw-zoom'); if (z) z.focus({ preventScroll: true }); box.querySelector('.vw-b').scrollTop = 0; return; }
      if (d.vw) { cur = d.vw; lvl = 1; draw(d.vr); var c = box.querySelector('.vw-x1'); if (c) c.focus({ preventScroll: true }); return; }
      if (d.kid != null) {
        var k = KIDS[+d.kid], out = box.querySelector('.vw-kidx'), was = b.getAttribute('aria-expanded') === 'true';
        box.querySelectorAll('.vw-kid').forEach(function (x) { x.setAttribute('aria-expanded', 'false'); });
        if (was) { out.hidden = true; out.innerHTML = ''; return; }
        b.setAttribute('aria-expanded', 'true'); out.hidden = false;
        out.innerHTML = '<h5>' + e(k[0]) + '</h5><p>' + e(k[2]) + '</p><p>' + e(k[3]) + '</p><div class="vw-fig' + (k[1] === '–' ? ' slot' : '') + '"><span class="fk">US holdings</span><p>' + e(k[4]) + '</p></div>' + who('measured, where a figure is given');
        return;
      }
      if (d.vplay != null && X.simPlay) { close(); X.simPlay(+d.vplay); return; }
      if (d.vlev != null && X.simLever) { close(); X.simLever(+d.vlev); return; }
    });
    box.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); close(); } });
  }
  X.views = { open: open, close: close, get on() { return cur; }, get level() { return lvl; }, ids: Object.keys(V) };
  X.on('view', function () { if (cur) close(); });
  X.on('fin', function () { if (cur) { cur = null; box = null; from = null; } });   /* the stage was rebuilt: the sheet went with it */
})();
