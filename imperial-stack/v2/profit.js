/* The Imperial Stack v2 · profit.js (profit tab build 1, 17 Nov 2026; the arc: profit tab patch, 18 Nov 2026)
   The order (until 26 Nov 2026 “the profit dollar”): its own tab, third in the bar after the Circuit and the machinery, under the title “Why dollar assets need to be the most profitable*”.
   Told as an arc of six stations whose titles carry the argument (spec claude/specs/profit-tab-v4-17-nov.md and its addendum, which wins):
   1 Profits · 2 Technology · 3 The system (the order's story; it was “The order” until 26 Nov, the tab itself now has that name) · 4 The regime · 5 The AI trade · 6 the finale. Layout (Elias, 17 Nov): the statistics and the
   chart take the full width at the top, the text sits under them, on every screen size; the page may scroll, and buttons lead to the
   explanation and the methodology. One chart a board, one key a chart, a table view and a text alternative for every picture.
   The views of a station are switched with dots under the chart (arrows, swipe on phones); the view's name stands above the chart.
   A view that is not a station's main screen carries one short closable note, “Why you are seeing this”.
   Data: data/profit.json, built and checked by tools/profit-data.py (key E: the Treasury's TIC transactions by holder, E1).
   Colours: the set checked with the dataviz validator on #0a131d.
   The page owns the tab switch and the bar's host; this file draws the scene and hands the bar its model (ISX.route).
   Seam: ISX.profit { show, bar, where, detail, apply, go, state, footnote, title, notes }. Bus event: profit { st, view, act }. */
(function () {
  'use strict';
  const X = window.ISX; if (!X) return;
  const U = X.util, root = X.root, $ = X.$, esc = U.esc, host = $('pf'), scene = $('scene-profit');
  if (!host || !scene) return;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, at, text) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (tag === 'text' && at && at.fill) e.style.fill = at.fill; if (text != null) e.textContent = text; return e; };
  const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const f1 = x => (Math.round(Math.abs(x) * 10) / 10).toFixed(1), f2 = x => x.toFixed(2), sg = x => (x < 0 ? '−' : '+') + f1(x);
  const bn = x => '$' + Math.round(x).toLocaleString('en-US') + 'bn', tn = x => '$' + x.toFixed(1) + 'tn';
  const C = { gold: '#c4861c', teal: '#19a88f', blue: '#4a8be6', purple: '#a672e0', red: '#e2574c', grey: '#6b7d8c', ink: '#e4ebf1', ink2: '#9aabba', lab: '#ffb547', bg: '#0a131d',
    npi: '#19a88f', fed: '#c4861c', div: '#a672e0', hh: '#4a8be6', ca: '#e2574c', rest: '#6b7d8c', pat: '#e4ebf1' };
  const tips = t => esc(t).replace(/\{\{(\w+)\|([^}]+)\}\}/g, (m, k, x) => X.defs[k] ? `<dfn class="df" data-d="${k}" tabindex="0">${x}</dfn>` : x);
  const LOCK = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const phone = () => scene.clientWidth < 760;

  const SRC = {
    bea: ['BEA, national accounts (NIPA flat files, 4 Nov 2026)', 'https://apps.bea.gov/national/Release/TXT/NipaDataA.txt'],
    forbes: ['Forbes Global 2000, lists of 2011 to 2026', 'https://www.forbes.com/lists/global2000/'],
    imfg: ['IMF World Economic Outlook, Oct 2026 (GDP in dollars)', 'https://www.imf.org/external/datamapper/NGDPD@WEO'],
    imfc: ['IMF World Economic Outlook, Oct 2026 (current accounts)', 'https://www.imf.org/external/datamapper/BCA@WEO'],
    schwartz: ['H. M. Schwartz, “American hegemony: intellectual property rights, dollar centrality, and infrastructural power”, Review of International Political Economy 26(3), 2019', 'https://doi.org/10.1080/09692290.2019.1597754'],
    pwt: ['Penn World Table 11.0 (7 Oct 2025)', 'https://www.rug.nl/ggdc/productivity/pwt/pwt-releases/pwt110'],
    z1e: ['Federal Reserve, Z.1: US shares held by the rest of the world (via FRED, read 17 Nov 2026)', 'https://fred.stlouisfed.org/series/ROWCESQ027S'],
    z1t: ['Federal Reserve, Z.1: Treasuries held by the rest of the world', 'https://fred.stlouisfed.org/series/ROWTSEQ027S'],
    z1f: ['Federal Reserve, Z.1: net purchases of US shares', 'https://fred.stlouisfed.org/series/ROWCEAQ027S'],
    z1g: ['and of Treasuries', 'https://fred.stlouisfed.org/series/ROWTSAQ027S'],
    dfa: ['Federal Reserve, Distributional Financial Accounts (top 1% of household-held shares; the next 9% is added)', 'https://fred.stlouisfed.org/series/WFRBST01122'],
    wb: ['World Bank, market capitalisation of listed domestic companies (from the World Federation of Exchanges; updated 11 Nov 2026)', 'https://api.worldbank.org/v2/country/USA/indicator/CM.MKT.LCAP.CD?format=json'],
    wfe: ['World Federation of Exchanges, 2025 market data', 'https://www.world-exchanges.org/news/articles/new-wfe-data-public-markets-post-strong-growth-2025-despite-geopolitical-instability'],
    sp: ['S&P Dow Jones Indices, S&P 500 buybacks workbook', 'https://www.spglobal.com/spdji/en/documents/additional-material/sp-500-buyback.xlsx'],
    bbp: ['L. Baccaro, M. Blyth and J. Pontusson (eds), Diminishing Returns (Oxford University Press, 2022), link not stored', null],
    fritz: ['B. Fritz, L. F. de Paula and D. M. Prates, “Global currency hierarchy and national policy space”, 2018', 'https://doi.org/10.4337/ejeep.2018.02.11'],
    tooze: ['A. Tooze, Chartbook 457 (8 Jul 2026)', 'https://adamtooze.substack.com/p/chartbook-457-the-metamorphoses-of'],
    amundi: ['Amundi Investment Institute, Working Paper 190 (Apr 2026), table 3', 'https://research-center.amundi.com/files/nuxeo/dl/efcffe56-9ee0-4d27-b6c1-92ebe826994d?inline='],
    bianco: ['Bianco Research (11 Oct 2026), on J.P. Morgan’s list of 41 stocks', 'https://x.com/biancoresearch/status/2109359717793607996'],
    k1: ['Amazon, annual report 2025', 'https://www.sec.gov/Archives/edgar/data/1018724/000101872426000004/amzn-20251231.htm'],
    k2: ['Alphabet, 2025', 'https://www.sec.gov/Archives/edgar/data/1652044/000165204426000018/goog-20251231.htm'],
    k3: ['Microsoft, fiscal 2026', 'https://www.sec.gov/Archives/edgar/data/789019/000119312526323660/msft-20260630.htm'],
    k4: ['Meta, 2025', 'https://www.sec.gov/Archives/edgar/data/1326801/000162828026003942/meta-20251231.htm'],
    k5: ['Oracle, fiscal 2026', 'https://s23.q4cdn.com/440135859/files/doc_downloads/2026/09/10K_Bookmarked.pdf'],
    tic: ['US Treasury, TIC monthly reports on cross-border portfolio flows, history table (file of 13 Oct 2026, read 17 Nov 2026)', 'https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/npr_history.html'],
    gowan: ['P. Gowan, The Global Gamble: Washington’s Faustian Bid for World Dominance (Verso, 1999), link not stored', null],
    beaip: ['BEA, US receipts for the use of intellectual property, 2025 (as on the Circuit, step 01), link not stored', null],
    o1p: ['Pax Silica signatories and the Joint Statement on AI Opportunity: US State Department lists, as compiled in the Pax Silica explainer (as of 23 Oct 2026)', 'https://mariuscomper.uk/pax-silica/en/'],
    o1w: ['WAICO founders and later members: SESEC annex (7 Aug 2026), Xinhua (17 Jul 2026), PRC Ministry of Foreign Affairs (4 Aug 2026), links not stored', null],
    usgs: ['USGS, Mineral Commodity Summaries 2026 (shares of world mine output)', 'https://pubs.usgs.gov/periodicals/mcs2026/'],
    wright: ['Division of labour inside Pax Silica: interview with Jake Wright, 20 Oct 2026 (30:50, 32:24), link not stored', null],
    asml: ['ASML, sales by region, 2024 and 2025 (as on the Circuit, step 03), link not stored', null]
  };
  /* ---------- the arc (patch of 18 Nov 2026; spec profit-tab-v4 and its addendum §1): six stations whose titles carry the argument ----------
     1 Profits · 2 Technology · 3 The system (the order's story; it was “The order” until 26 Nov, the tab itself now has that name) · 4 The regime · 5 The AI trade · 6 the finale. The first view of a station is its main screen:
     the title explains it, so it carries no note. Every other view carries one short note above its chart (NOTE). */
  const TITLE = 'Why dollar assets need to be the most profitable';
  const WHY = 'Profits are booked in the firm, and capital flows to where the firm is listed. That decides how liquid the market is and how much investment can be raised by selling shares and bonds.';
  const ST = [
    { id: 'order', t: 'The system', f: '26 signatories of Pax Silica · 23 Oct 2026', q: 'To secure the profits, first a global empire: one ladder for the whole world.', sub: 'The WTO order, 1995–.',
      qv: { orr: 'To secure its profits, a capitalist order needs a centre: one ladder for the whole world.' }, subv: { orr: '1995–2026 · drag through the years' },
      q2: 'Then China climbed the ladder. Now: Pax Silica and the silicon curtain.', sub2: '2025–.',
      views: [['orr', 'The story'], ['orb', 'The orbits'], ['ord', 'Two orders, one picture'], ['pos', 'Positions'], ['fig', 'The figures by year'], ['rng', 'Creditors and debtors'], ['pft', 'Where profits are booked'], ['hyp', 'German Hypocrisy']],
      x: 'Under the WTO order, from 1995, the TRIPS agreement protects the hub’s rents everywhere and assembly moves to the cheapest place. Under Pax Silica, from 2025, export controls and licences add a second fence, which decides who may hold the tools at all, and chains are re-routed to its 26 signatories.',
      rd: 'The old order worked like a ladder that kept the rich at the top; Pax Silica entrenches the value and supply chains around the US.',
      nt: 'Ideal types, drawn schematically: no economy matches one exactly, and reality is a process, not a model to be measured.',
      more: ['The reading of the WTO order as a global empire follows Peter Gowan (The Global Gamble, 1999) and Herman Mark Schwartz (2019). Finance is the same in both orders: savings flow in as claims, demand flows out as imports.',
        'The orbits combine the tiers of world-systems analysis (Immanuel Wallerstein) with polarity: a hierarchy inside each system, and two systems side by side. Membership of Pax Silica is a privilege, not a requirement for exploitation: access to the full stack in return for alignment, with the rank inside following the division of labour. “Silicon curtain” is Jake Wright’s term.',
        'Beneath the institutions lies the material base. The outer orbit holds the extraction zones: mineral sources that function as extractive neocolonies whether or not they sit at the table. A zone sits in the overlap when capital linked to both centres is present, as in the DR Congo, Indonesia and Zambia; it sits in China’s system when the owners are Chinese only.',
        'The positions are measured: the IMF’s current accounts (average of 2018 to 2025) against the Forbes lists of 2019 to 2026. The hub sits alone, with the largest deficit and the largest share of profits; the deficit at the hub is not the deficit in the periphery.',
        'The consumption-led and export-led growth models come from the growth-model literature (Baccaro, Blyth and Pontusson, 2022). They are two sides of a single process, and beneath them sits a hierarchy: a hub, export-led spokes around it, and a periphery of commodity exporters and developing economies.'],
      src: ['gowan', 'schwartz', 'o1p', 'o1w', 'usgs', 'wright', 'imfc', 'forbes', 'bbp', 'fritz'],
      doors: [{ lock: 1, t: 'The same sum, from the surplus side', s: 'China, Germany, Japan and Korea' }, { pv: 'hyp', t: 'German Hypocrisy', s: 'The orrery with surpluses as gravity' }] },
    { id: 'profits', lead: 'This is what the order pays its centre.', t: 'Profits', f: '42% of the largest firms’ profits · 2026', q: 'Savers want profitable equity. That is why they buy US stocks.',
      views: [['pic', 'In one picture'], ['hold', 'Held abroad'], ['flow', 'Bought each year'], ['own', 'By owner'], ['list', 'The listing premium']],
      x: 'A profit belongs to the firm that books it, wherever it was earned, and the firm belongs to the market where it is listed. In the 2026 Forbes list, US firms took 42.2% of the profits of the world’s 2,000 largest listed firms, with 26.1% of world GDP. Foreign investors held $22.2tn of US shares in mid-2026, against $9.3tn of Treasuries.',
      rd: 'The US is the imperial organiser of capital accumulation globally: the profits stay with the firm listed in the US wherever they are earned, and that claim is what foreign investors buy.',
      nt: 'Holdings move with prices as well as purchases: in 2025 they rose by $3.2tn, while net purchases were $0.65tn (Federal Reserve, Z.1). “Bought each year” uses the Treasury’s own count of transactions, which differs from the Federal Reserve’s; the two are never drawn on one chart.',
      more: ['Shares passed Treasuries again in 2017: what the world now buys is a claim on profits, not a loan to the US government. Even official holders, central banks and state funds, now buy the claim: they sold Treasury bonds and notes in most years since 2015 and bought $56.0bn of US shares in 2025.',
        'The national accounts measure the same thing by owner: profits earned in the US economy, less what foreign owners take out of it, plus what US owners receive from abroad. In 2025 US owners received $1,064bn from abroad, 26.4% of the profits of US-owned firms; net of what foreign owners took out of the US, 12.7%. Two measures, never added: Forbes counts firms by headquarters, the national accounts by owner.',
        'The listing premium, measured: US-listed firms were 48.8% of the world’s stock-market value at the end of 2025, with 26.1% of world GDP. On the World Federation of Exchanges’ own world total for 2025 the share is about 45%. Equity raised on exchanges by year is not collected yet, so the premium is shown for market value only.'],
      src: ['forbes', 'imfg', 'bea', 'z1e', 'z1t', 'tic', 'wb', 'wfe'],
      doors: [{ fw: 'type', t: 'Who owns the profits', s: 'The firm web on the map, with each firm’s profits and owners' }, { fw: 'country', t: 'Who owns which firm', s: 'The firm web on the map, by the holders’ countries' }, { web: 1, t: 'Where it is earned', s: 'The firm web on the map: 14 firms and the countries they build in' }] },
    { id: 'technology', t: 'Technology', f: 'Profit capture 1.62 · 2026 list', q: 'The highest technological sophistication is the surest way to secure profits: through economics, coercion and code.',
      views: [['tri', 'Three ways'], ['nat', 'By nationality'], ['roc', 'Return on capital']],
      x: 'Profits this large have to be secured. The surest way is to hold the most sophisticated technology, and to hold it three ways at once: through economics, the markets and the finance that fund it; through coercion, the export controls, sanctions and tariffs that keep rivals from it; and through code, the patents, chips, platforms and standards everyone else has to use.',
      rd: 'Whoever holds the capital, and controls the technology through which it moves, writes the rules of the interaction.',
      nt: 'The three ways are a scheme, not a measurement: each column names its instruments and carries one dated figure that is measured elsewhere on this map.',
      more: ['Generally speaking, the financial sector is dominant while the productive sector is determinant. Access to US consumers, capital markets, the clearing system and the platforms is the price of admission, and it can be withdrawn.',
        'The measure is Herman Mark Schwartz’s {{capture|profit capture}}: who gets the profits, and in what proportion, across firms by nationality. He found 1.45 for US firms over 2005 to 2017. The update here starts in 2011, because the Forbes archive before that year is incomplete.',
        'A list of year Y is set against world GDP of the year before, at market exchange rates. A weak yen lifts Japan’s ratio; a single year swings with one-off profits and losses, so the pooled windows are the steadier measure.',
        'The return on capital is the territorial comparison: what capital earns inside each economy, housing included. The US return has held near 8% for three decades. It cannot show what US firms book abroad, which is why profit capture leads.'],
      src: ['schwartz', 'forbes', 'imfg', 'pwt', 'wb', 'beaip', 'asml'], doors: [] },
    { id: 'regime', t: 'The regime', f: 'Federal deficit 6.3% of GDP · 2025', q: 'Deficits realise the profits, and the inflow needs the deficits.',
      views: [['all', 'Every year since 1960'], ['sum', 'One year'], ['why', 'Why the deficit cannot shrink'], ['home', 'Who holds them at home'], ['pay', 'The payout']],
      x: 'In the accounts the line runs one way: since 2014 the federal deficit has supplied 6.3% of GDP a year to US profits. In the regime it {{bothways|runs both ways}}: the profits draw the world’s savings in, and the state borrows to hold up demand and jobs at home.',
      rd: 'This is a political-economic regime, not a one-way cause: the deficits that look like weakness are what realise the profits.',
      nt: 'Only the {{profiteq|profit equation}} is accounting: it holds by definition and says nothing about which term moves first.',
      more: ['The loop, step by step. US profits make US shares worth holding, so the world’s savings come in. By accounting, money that comes in is the other side of the deficit with the world: the US buys more than it sells. That gap takes demand and jobs out of the US economy, and federal borrowing puts them back. Federal borrowing then turns up as profits again.',
        'Why the deficit cannot shrink. Household saving and the deficit with the world take profit out every year, so something must put it back: investment or government borrowing. Net private investment has supplied about 4.5% of GDP a year since 2014, against 8% in 1960 to 1979, so federal borrowing carries the rest. That is the capital vacuum the inflow regime needs: deficits and thin household saving offset the leak abroad, and the profits they produce keep claims on US firms worth buying.',
        'At home the claim is concentrated: the richest tenth of US households held 88.1% of household-held shares in mid-2026, the top 1% alone 50.9%.',
        'The payout: the firms of the S&P 500 paid $629.6bn in dividends and bought back $942.5bn of their own shares in 2024. In the national accounts, dividends were 7.0% of GDP in 2025.'],
      src: ['bea', 'dfa', 'sp'], doors: [] },
    { id: 'ai', t: 'The AI trade', f: '49% of the S&P 500 · Oct 2026', q: 'The AI trade is what now keeps the claim worth buying.',
      views: [['wt', 'Weight in the market'], ['capex', 'Capital spending'], ['ni', 'Spending against profits']],
      x: 'The claim is worth buying while the profits behind it are expected to grow, and the AI build-out is where the market now expects them. In October 2026, 41 AI-related stocks made up 49% of the S&P 500’s value.',
      rd: 'The {{aitrade|AI trade}} has become the main way the dollar system absorbs the world’s savings: the system is moving from a state-centric, public-reserve hegemony to an asset-driven, private-capital network.',
      nt: 'The weight by year is Amundi’s narrower basket of AI-linked stocks; the 49% is the 41-stock basket in October 2026. The two are not joined.',
      more: ['Five firms (Amazon, Alphabet, Microsoft, Meta and Oracle) spent $378.7bn on property and equipment in their 2025 fiscal years, up from $71.1bn in 2019. That is 1.2% of GDP*, against 4.35% for the net private investment of the whole economy: gross spending against a net term, fiscal years against a calendar year, so a scale and not a share.',
        'Their profits were $384.6bn in the same years: capital spending has caught up with net income. Microsoft and Oracle have closed fiscal 2026, with $115.9bn and $55.7bn of capital spending.',
        'In the sum from “The regime”, the build-out is the one large private term that is rising.'],
      src: ['bea', 'k1', 'k2', 'k3', 'k4', 'k5', 'amundi', 'bianco', 'tooze'], doors: [] },
    { id: 'finale', t: 'If it fails', f: 'Crisis simulator · coming soon', q: 'What if AI doesn’t deliver?', fin: 1, views: [],
      lines: ['The claim is worth buying while the profits behind it are expected to grow.',
        'In October 2026, 41 AI-related stocks made up 49% of the S&P 500’s value, and five firms spent as much on the build-out as they earned.',
        'If the build-out stops paying, the one large private term that is rising falls away. By the profit equation, what investment no longer supplies has to come from federal borrowing, or profits fall.',
        'And the claim the world holds, $22.2tn of US shares, is priced on those profits.'],
      x: '', rd: '', nt: '', more: [], src: [],
      doors: [{ go: 'simulator', c: '#ffd27a', t: 'The imperial machinery', s: 'How Washington keeps the loop running' }, { go: 'elite-network', c: '#44d7ec', t: 'The elite network', s: 'The firms behind the trade' }, { go: 'imperial-arm', c: '#e4ebf1', t: 'The imperial arm', s: 'The power in use' }] }
  ];
  /* why you are seeing this: one short note above the chart of every view that is not a station's main screen (drafts for Elias) */
  const NOTE = {
    orb: 'The order as it was drawn before the story: one system under the WTO order, two under Pax Silica, with the body cards, the layers and the flows. The story’s picture is the same order, moving with the years.',
    fig: 'The figures behind every year of the orrery: each economy’s share of world GDP, its current account summed since 1995 and what US firms’ affiliates earned there, with source, vintage and caveats.',
    rng: 'Mass drives the tear in the story; the summed current account is shown here instead: a creditor wears an outer ring, a debtor an inner notch.',
    pft: 'Where the profit is booked is not where the order earns it: seven places book more than half of the net income of US firms’ foreign affiliates on under a third of their sales.',
    hyp: 'The joke view: the same orrery with the current account summed since 1995, as a share of that year’s GDP, as gravity.',
    hold: 'The stock, not the flow: what foreigners already own. Shares overtook Treasuries in 2017, so the claim the world holds is now mostly a claim on profits.',
    flow: 'Who buys matters as much as how much. A central bank buying Treasuries lends to the US state; an investor buying shares buys a claim on US firms’ profits. The mix shows which of the two the system now runs on.',
    own: 'The national accounts count profits by owner, not by headquarters: a second measure of the same thing, kept apart from the Forbes lists.',
    list: 'A listing in the US is worth more than the economy’s weight. This is the premium the market pays for it.',
    nat: 'Profit capture sets each country’s share of the largest firms’ profits against its share of world GDP. Above 1, its firms book more than the economy’s weight.',
    roc: 'The contrast. Inside the territory, capital in the US earns an ordinary return: the outsized profits are booked by firms across borders, not earned by the territory.',
    ord: 'The two orders as fences on one value chain: the first protects the rents everywhere, the second decides who may hold the tools at all.',
    pos: 'The same order, measured: each economy’s balance with the world against its firms’ share of profits. The hub sits alone.',
    sum: 'This is the profit equation for one year: the bars that add to profits and the ones that take from them. The lines below show each term since 1960, so you can see which one does the work when. The moments mark turning points; pick one to set it against the five years before.',
    why: 'Two eras side by side. Something has to put back what household saving and the deficit with the world take out; the chart shows what did it then and what does it now.',
    home: 'Who collects at home: the claim on profits is held by few households, so the payout lands at the top.',
    pay: 'What the profits become: dividends and buybacks, paid to those who hold the shares.',
    capex: 'The build-out in dollars: what five firms spend on data centres, chips and power each year.',
    ni: 'Spending against what the firms earn. Once the two lines meet, the build-out needs outside money.'
  };
  /* 24 Nov 2026 (Elias): the moments replace the four fixed eras (1960–79, 1980–99, 2000–13, 2014–25), which looked as if they carried the
     argument. They are markers to notice shifts: each is a span of years, and picking one sets its average against the five years before.
     [first year, last year, chip and chart label, full name] */
  const ERAS = [[1973, 1974, 'Oil shock', 'The oil shock and the petrodollar'], [1979, 1982, 'Neoliberal turn', 'The Volcker shock and the neoliberal turn'], [1997, 1998, 'Asian crisis', 'The Asian financial crisis: states begin to self-insure in Treasuries'], [2001, 2001, 'China in the WTO', 'China joins the WTO'], [2008, 2014, '2008–14', 'The financial crisis, to the end of QE'], [2020, 2021, 'Covid', 'The covid stimulus']];
  const span = (a, b) => a === b ? String(a) : a + '–' + String(b).slice(2);
  const eraOf = e => ERAS.find(x => x[0] === e[0] && x[1] === e[1]);
  const TERMS = [['npi', 'Net private investment'], ['fed', 'Federal net borrowing'], ['div', 'Dividends'], ['rest', 'State and local, other'], ['hh', 'Household saving'], ['ca', 'Deficit with the world']];
  const NAME = { USA: 'United States', 'CHN+HKG': 'China with Hong Kong', CHN: 'China', JPN: 'Japan', DEU: 'Germany', GBR: 'United Kingdom', FRA: 'France', KOR: 'South Korea', IND: 'India', TWN: 'Taiwan', CHE: 'Switzerland', SAU: 'Saudi Arabia', NLD: 'Netherlands' };
  const SHORT = { 'United Kingdom': 'UK', 'South Korea': 'Korea', 'United States': 'US', 'China with Hong Kong': 'China with HK', 'Saudi Arabia': 'Saudi', Netherlands: 'NL', Switzerland: 'Swiss' };
  const WIN = [['2011-2018', 'Lists 2011–2018', '2011–18'], ['2019-2026', 'Lists 2019–2026', '2019–26'], ['2011-2026', 'All lists, 2011–2026', 'All lists'], ['2026', 'The 2026 list', '2026 list']];
  const FIRM = [['AMZN', 'Amazon', C.gold], ['GOOGL', 'Alphabet', C.blue], ['MSFT', 'Microsoft', C.teal], ['META', 'Meta', C.purple], ['ORCL', 'Oracle', C.red]];

  /* ---------- state ---------- */
  const S = { st: 0, view: ST.map(s => (s.views[0] || [null])[0]), year: 2025, era: null, win: '2011-2026', table: false, ord: 'wto', terms: { npi: true, fed: true, div: true, rest: false, hh: true, ca: true }, whyOff: U.stGet('isx-pf-why') === 'off', lay: null, flows: false, sys: 'us', oz: 1 };
  const OZ = { y: 1995, hy: 2025, step: null };   /* step (OR7): one of the two steps after the story, 'pp' or 'cl' */
  let D = null, B = null, G = null, built = false, R = {}, lastW = 0;
  const cur = () => ST[S.st], vw = () => S.view[S.st];
  const emit = act => { X.emit('profit', { st: cur().id, view: vw(), act: act || null }); };

  function prep(d) {
    D = d;
    B = d.B.map(r => ({ p: r[0], y: r[0] === '2026H1' ? 2026 : +r[0], prov: r[0] === '2026H1', bn: r[1], pat: r[2], npi: r[3], fed: r[4], sl: r[5], ct: r[6], hh: r[7], ca: r[8], div: r[9], disc: r[10] }));
    B.forEach(r => { r.rest = Math.round((r.sl + r.ct + r.disc) * 100) / 100; });
    G = d.G.map(r => ({ y: r[0], nat: r[1], dom: r[2], net: r[3], netp: r[4], rec: r[5], pay: r[6], recp: r[7] }));
  }
  const avg = (k, a, b) => { const rs = B.filter(r => !r.prov && r.y >= a && r.y <= b); return rs.reduce((s, r) => s + r[k], 0) / rs.length; };
  function yr() { if (S.era) { const [a, b] = S.era, m = eraOf(S.era), o = { era: true, label: span(a, b), name: m ? m[3] : '', a, b }; ['pat', 'npi', 'fed', 'div', 'hh', 'ca', 'rest'].forEach(k => { o[k] = avg(k, a, b); o[k + '0'] = avg(k, a - 5, a - 1); }); return o; } return B.find(r => r.y === S.year); }
  const termLabel = (k, v) => k === 'fed' && v < 0 ? 'Federal surplus' : k === 'ca' && v > 0 ? 'Surplus with the world' : TERMS.find(t => t[0] === k)[1];

  /* ---------- the scene's frame, built once ---------- */
  function build() {
    host.innerHTML = '<div class="pf-top"><p class="pf-tt"><span class="pf-ttk">The order</span><span class="pf-ttl">' + esc(TITLE) + '<button type="button" class="pf-star" data-pf="fn" aria-expanded="false" aria-controls="isx-pf-fn" aria-label="Footnote: why only a very large economy can play this role">*</button></span><span class="pf-k" id="isx-pf-k"></span></p><div class="pf-fn" id="isx-pf-fn" hidden></div></div>'
      + '<div class="pf-head" id="isx-pf-head"><div class="pf-hk"><p class="pf-lead" id="isx-pf-lead" hidden></p><h2 class="pf-q" id="isx-pf-q"></h2><p class="pf-sub" id="isx-pf-sub" hidden></p></div>'
      + '<div class="pf-jump"><button type="button" data-pf="read">The explanation <span aria-hidden="true">↓</span></button><button type="button" data-how data-pf="how">How we count <span aria-hidden="true">↓</span></button></div></div>'
      + '<section class="pf-board" id="isx-pf-board" aria-label="Chart"><div class="pf-chips" id="isx-pf-chips"></div>'
      + '<div class="pf-bhead"><div class="pf-bh"><span class="pf-vn" id="isx-pf-vn"></span><h3 id="isx-pf-title"></h3></div><span class="pf-br"><span class="pf-unit" id="isx-pf-unit"></span><button type="button" class="pf-whyq" id="isx-pf-whyq" data-pf="whyq" aria-label="Why you are seeing this" hidden>?</button></span></div>'
      + '<div class="pf-note" id="isx-pf-note" hidden><b>Why you are seeing this</b><span></span><button type="button" class="x" data-pf="whyx" aria-label="Close this note">×</button></div>'
      + '<div class="pf-tiles" id="isx-pf-tiles"></div><p class="pf-reading" id="isx-pf-reading" aria-live="polite"></p>'
      + '<figure class="pf-fig" id="isx-pf-fig" data-noswipe></figure>'
      + '<div class="pf-foot"><div class="pf-scrub" id="isx-pf-scrub"></div><div class="pf-lg" id="isx-pf-lg"></div><nav class="pf-dots" id="isx-pf-dots" aria-label="Views of this station"></nav><button type="button" class="pf-tbtn" data-pf="table" id="isx-pf-table" aria-pressed="false">View as table</button></div>'
      + '<div class="pf-tip" id="isx-pf-tip" hidden></div></section>'
      + '<section class="pf-fin" id="isx-pf-fin" aria-labelledby="isx-pf-q" hidden></section>'
      + '<div class="pf-text" id="isx-pf-text" tabindex="-1"></div>';
    ['k', 'q', 'lead', 'sub', 'head', 'fn', 'board', 'chips', 'vn', 'whyq', 'note', 'title', 'unit', 'tiles', 'reading', 'fig', 'dots', 'scrub', 'lg', 'table', 'tip', 'fin', 'text'].forEach(k => { R[k] = document.getElementById('isx-pf-' + k); });
    R.top = host.querySelector('.pf-top');
    host.addEventListener('click', e => {
      const b = e.target.closest('[data-pf], [data-pv], [data-pvn], [data-pe], [data-pw], [data-pt], [data-po], [data-pl], [data-ps], [data-pzk], [data-pgo], [data-pweb], [data-pfw]'); if (!b) return;
      const d = b.dataset;
      if (d.pv) { setV(d.pv); }
      else if (d.pvn) { stepV(+d.pvn); }
      else if (d.pe != null) { const e2 = ERAS[+d.pe].slice(0, 2); S.era = S.era && S.era[0] === e2[0] ? null : e2; board(); emit('year'); }
      else if (d.pw) { S.win = d.pw; S.table = false; board(); }
      else if (d.pt) { S.terms[d.pt] = !S.terms[d.pt]; board(true); const again = R.fig.querySelector('[data-pt="' + d.pt + '"]'); if (again) again.focus({ preventScroll: true }); emit('term'); }
      else if (d.po) {   /* the order's two states: the title changes and the bodies move to their new places */
        if (S.ord === d.po) return; S.ord = d.po; text(); R.title.textContent = V.orb.title();
        if (vw() === 'orb' && !S.table && V.orb.L && !phone()) orbPlace(V.orb.L); else { board(true); const again = host.querySelector('[data-po="' + d.po + '"]'); if (again) again.focus({ preventScroll: true }); }
        sync(); emit('order'); }
      else if (d.pl) { S.lay = S.lay === d.pl ? null : d.pl; board(true); const again = R.chips.querySelector('[data-pl="' + d.pl + '"]'); if (again) again.focus({ preventScroll: true }); emit('layer'); }
      else if (d.ps) { S.sys = d.ps; board(true); const again = host.querySelector('[data-ps="' + d.ps + '"]'); if (again) again.focus({ preventScroll: true }); }
      else if (d.pzk) { S.oz = Math.max(1, Math.min(3, S.oz * (d.pzk === '+' ? 1.5 : 1 / 1.5))); board(true); const again = host.querySelector('[data-pzk="' + d.pzk + '"]'); if (again) again.focus({ preventScroll: true }); }
      else if (d.pf === 'flows') { S.flows = !S.flows; board(true); const again = R.chips.querySelector('[data-pf="flows"]'); if (again) again.focus({ preventScroll: true }); emit('flows'); }
      else if (d.pf === 'table') { S.table = !S.table; board(); bar(); emit('table'); if (S.table && cur().id === 'order') R.table.focus({ preventScroll: true }); }
      else if (d.pf === 'fn') { foot(b); }
      else if (d.pf === 'whyx') { S.whyOff = true; U.stSet('isx-pf-why', 'off'); board(true); R.whyq.focus({ preventScroll: true }); }
      else if (d.pf === 'whyq') { S.whyOff = false; U.stSet('isx-pf-why', null); board(true); const x = R.note.querySelector('.x'); if (x) x.focus({ preventScroll: true }); }
      else if (d.pf === 'zoom') { zoomOpen(b); }
      else if (d.pf === 'read') { R.text.scrollIntoView({ behavior: X.reduce ? 'auto' : 'smooth', block: 'start' }); R.text.focus({ preventScroll: true }); }
      else if (d.pf === 'how') { const m = $('method'), f = m && m.classList.contains('shut') ? m.querySelector(':scope > .fold6') : null; if (f) f.click(); }
      else if (d.pgo) { X.setView(d.pgo === 'simulator' ? 'fin' : d.pgo === 'imperial-arm' ? 'story' : d.pgo === 'elite-network' ? 'arm' : d.pgo); $('frame').scrollIntoView({ block: 'start' }); }
      else if (d.pfw) { X.setView('map'); $('frame').scrollIntoView({ block: 'start' }); setTimeout(() => { if (X.firms) X.firms.open({ by: d.pfw, from: 'profit' }); }, 60); }
      else if (d.pweb != null) { X.setView('map'); $('frame').scrollIntoView({ block: 'start' }); setTimeout(() => { if (X.web) X.web.open({ from: 'profit' }); }, 60); }   /* round 2: the ownership web's door opens the firm web on “where it is earned” */
    });
    /* the views are swiped on phones (the chart is marked data-noswipe, so the bar's own swipe between stations leaves it alone) */
    let sx = 0, sy = 0, st = 0;
    R.fig.addEventListener('touchstart', e => { st = e.touches.length === 1 && phone() && !e.target.closest('.pf-tw, .pf-terms, input, .orr-dock, .orr-hud, .orr-kin, .orr-info') ? 1 : 0; if (st) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; } }, { passive: true });
    R.fig.addEventListener('touchend', e => { if (!st) return; st = 0; const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.6) stepV(dx < 0 ? 1 : -1); }, { passive: true });
    let rt = 0;
    if (window.ResizeObserver) new ResizeObserver(() => { if (X.view !== 'profit' || !D || cur().fin) return; const w = R.fig.clientWidth; if (Math.abs(w - lastW) < 2) return; clearTimeout(rt); rt = setTimeout(() => board(true), 90); }).observe(R.fig);
    built = true;
  }
  function setV(id) { if (!cur().views.some(v => v[0] === id) || id === vw()) return; S.view[S.st] = id; S.table = false; if (cur().qv) text(); board(); if (cur().id === 'order') bar(); sync(); emit('view'); const d = R.dots.querySelector('[aria-current="true"]'); if (d && R.dots.contains(document.activeElement)) d.focus({ preventScroll: true }); }
  function stepV(d) { const vs = cur().views, i = vs.findIndex(v => v[0] === vw()), j = i + d; if (j < 0 || j >= vs.length) return; setV(vs[j][0]); }

  /* ---------- the title's footnote (the same text opens from the entry screen). The five references were checked on 18 Nov 2026 against
     library and publisher records: author, title, publisher and year. Links are the ones found in that check (the Susan Strange archive, Cornell
     University Press, Routledge's reprint of Kindleberger, Oxford's catalogue entry on RePEc); none was found for Helleiner ---------- */
  const FN = { lead: 'Only a very large economy can play this role. An international currency needs assets that exist in great quantity and can be bought and sold in size at any moment, so that everyone can use them at once as a medium of exchange and a store of value; the largest market is the most useful one, which entrenches it.',
    refs: [['On the hierarchy of currencies', [['Susan Strange', 'Sterling and British Policy', 'Oxford University Press, 1971', 'https://susanstrange.org/archive/sterling_and_british_policy_a_political_study_of_an_international_currency_in_decline'], ['Benjamin J. Cohen', 'The Geography of Money', 'Cornell University Press, 1998', 'https://www.cornellpress.cornell.edu/book/9780801435133/the-geography-of-money/']]],
      ['On deep markets and the privilege', [['Charles P. Kindleberger', 'International Money', 'George Allen & Unwin, 1981', 'https://www.routledge.com/International-Money-A-Collection-of-Essays/Kindlerberger/p/book/9780415852265'], ['Barry Eichengreen', 'Exorbitant Privilege', 'Oxford University Press, 2011', 'https://econpapers.repec.org/RePEc:oxp:obooks:9780199596713']]],
      ['On the state behind it', [['Eric Helleiner', 'The Status Quo Crisis', 'Oxford University Press, 2014', null]]]] };
  const footnote = () => '<p><b>*</b> ' + esc(FN.lead) + '</p><p>' + FN.refs.map(g => esc(g[0]) + ': ' + g[1].map(r => esc(r[0]) + ', ' + (r[3] ? '<a href="' + esc(r[3]) + '" target="_blank" rel="noopener"><i>' + esc(r[1]) + '</i></a>' : '<i>' + esc(r[1]) + '</i>') + ' (' + esc(r[2]) + (r[3] ? '' : '; link not stored') + ')').join('; ')).join('. ') + '. References checked 18 Nov 2026.</p>';
  function foot(b) { if (!R.fn.innerHTML) R.fn.innerHTML = footnote(); R.fn.hidden = !R.fn.hidden; b.setAttribute('aria-expanded', String(!R.fn.hidden)); if (D && !cur().fin) board(true); }

  /* ---------- the text under the board ---------- */
  function text() {
    const s = cur(), two = s.q2 && S.ord === 'ps' && vw() !== 'orr';
    R.k.innerHTML = 'Station ' + (S.st + 1) + ' of ' + ST.length + ' <i>·</i> <b>' + esc(s.f) + '</b>';
    const qv = s.qv && s.qv[vw()], sv = s.subv && s.subv[vw()];
    R.q.textContent = qv || (two ? s.q2 : s.q); R.q.classList.toggle('long', R.q.textContent.length > 84);
    R.lead.hidden = !s.lead; R.lead.textContent = s.lead || '';
    const sub = sv || (two ? s.sub2 : s.sub); R.sub.hidden = !sub; R.sub.textContent = sub || '';
    host.dataset.st = s.id; host.classList.toggle('fin', !!s.fin); stageMode();
    R.board.hidden = !!s.fin; R.text.hidden = !!s.fin; R.fin.hidden = !s.fin; host.querySelector('.pf-jump').hidden = !!s.fin;
    if (s.fin) { finale(); return; }
    const src = s.src.map(k => SRC[k]).map(x => x[1] ? `<a href="${esc(x[1])}" target="_blank" rel="noopener">${esc(x[0])}</a>` : esc(x[0])).join('. ') + '.';
    R.text.innerHTML = `<article class="pf-claim"><div class="pf-ck">${esc(s.t)} · the claim</div><p class="pf-x">${tips(s.x)}</p><p class="pf-rd">${tips(s.rd)}</p><p class="pf-why"><b>Why it matters</b>${esc(WHY)}</p><p class="pf-nt">${tips(s.nt)}</p></article>`
      + `<article class="pf-mech"><div class="pf-ck">The mechanism</div>${s.more.map(t => `<p>${tips(t)}</p>`).join('')}</article>`
      + `<article class="pf-side">${s.doors.length ? `<div class="pf-ck">Go deeper</div><div class="pf-doors">${s.doors.map(door).join('')}</div>` : ''}<div class="pf-ck">Sources</div><p class="pf-src">${src}</p></article>`;
  }
  const door = d => d.pv ? `<button type="button" class="pf-door" data-pv="${d.pv}"><span class="dl"><b>${esc(d.t)}</b><i aria-hidden="true">›</i></span><small>${esc(d.s)}</small></button>` : d.lock ? `<div class="pf-door lock" role="group" aria-label="${esc(d.t)}: coming soon"><span class="dl">${LOCK}<b>${esc(d.t)}</b><em>coming soon</em></span><small>${esc(d.s)}</small></div>`
    : d.fw ? `<button type="button" class="pf-door" data-pfw="${d.fw}"><span class="dl"><b>${esc(d.t)}</b><i aria-hidden="true">›</i></span><small>${esc(d.s)}</small></button>`   /* firm web build (20 Nov 2026): the two Atlas doors of station 1 are open */
    : d.web ? `<button type="button" class="pf-door" data-pweb><span class="dl"><b>${esc(d.t)}</b><i aria-hidden="true">›</i></span><small>${esc(d.s)}</small></button>`
    : `<button type="button" class="pf-door go" data-pgo="${d.go}" style="--dc:${d.c}"><span class="dl"><b>${esc(d.t)}</b><i aria-hidden="true">›</i></span><small>${esc(d.s)}</small></button>`;
  /* the finale: one screen, no chart. The title, four plain lines that arrive one at a time, the locked crisis simulator, the doors out */
  function finale() {
    const s = cur(), E = X.essays && X.essays.bubble, SSL = '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" class="ssl"><path fill="currentColor" d="M3 3h18v2.6H3zm0 4.9h18v2.6H3zm0 4.9h18V21l-9-5-9 5z"/></svg>';
    R.fin.className = 'pf-fin' + (X.reduce ? ' all' : ''); let i = 0; const r = () => ' style="--i:' + (i++) + '"';
    R.fin.innerHTML = '<div class="pf-fl">' + s.lines.map(t => '<p class="fr"' + r() + '>' + esc(t) + '</p>').join('') + '</div>'
      + '<div class="pf-fx fr"' + r() + '><div class="pf-crisis" role="group" aria-label="Crisis simulator: coming soon">' + LOCK + '<b>Crisis simulator</b><em>coming soon</em><small>What happens when the AI bubble pops</small></div>'
      + (E ? '<a class="pf-ess" href="' + esc(E[1]) + '" target="_blank" rel="noopener">' + SSL + '<span>' + esc(E[0]) + '</span><small>Related piece · ' + esc(E[2]) + '</small></a>' : '') + '</div>'
      + '<div class="pf-fd fr"' + r() + '><div class="pf-ck">Where next</div><div class="pf-doors">' + s.doors.map(door).join('') + '</div></div>';
  }

  /* ---------- board helpers ---------- */
  const tipShow = (rows, x, y) => { const t = R.tip, b = R.board.getBoundingClientRect(); t.textContent = ''; rows.forEach((r, i) => { if (!i) t.append(h('b', '', r)); else { const d = h('div'); d.append(h('span', '', r[0]), h('span', '', r[1])); t.append(d); } }); t.hidden = false; const w = t.offsetWidth, hh = t.offsetHeight; t.style.left = Math.max(6, Math.min(b.width - w - 6, x - b.left + 14)) + 'px'; t.style.top = Math.max(6, Math.min(b.height - hh - 6, y - b.top - hh - 10)) + 'px'; };
  const tipHide = () => { if (R.tip) R.tip.hidden = true; };
  const hover = (node, rows) => { const f = ev => { const b = node.getBoundingClientRect(); tipShow(rows, ev && ev.clientX ? ev.clientX : b.left + b.width / 2, ev && ev.clientY ? ev.clientY : b.top); }; node.addEventListener('pointermove', f); node.addEventListener('pointerleave', tipHide); node.addEventListener('focus', () => f()); node.addEventListener('blur', tipHide); };
  function tiles(list, eq) {
    R.tiles.className = 'pf-tiles' + (eq ? ' eq' : ''); R.tiles.textContent = '';
    list.forEach(t => { const d = h('div', 'pf-tile' + (t.big ? ' big' : '') + (t.empty ? ' empty' : '')); if (t.op) d.append(h('span', 'op', t.op)); const v = h('div', 'v'); if (t.c) { const s = h('span', 'sw' + (t.line ? ' ln' : '')); s.style.background = t.c; v.append(s); } v.append(t.v); d.append(v, h('div', 'k', t.k)); if (t.d) d.append(h('div', 'd', t.d)); R.tiles.append(d); });
  }
  function legend(items) { R.lg.textContent = ''; (items || []).forEach(([c, t, kind]) => { const s = h('span'), i = h('i', kind === 2 ? 'ol' : kind === 3 ? 'dm' : kind ? 'bx' : ''); if (kind !== 2) i.style.background = c; s.append(i, t); R.lg.append(s); }); }
  function reading(b, t) { R.reading.textContent = ''; if (b) R.reading.append(h('b', '', b)); R.reading.append(t || ''); }
  function table(t) {
    const w = h('div', 'pf-tw'); w.tabIndex = 0; w.setAttribute('role', 'region'); w.setAttribute('aria-label', 'Table view');
    (Array.isArray(t) ? t : [t]).forEach(T => {
      const tb = h('table', T.wrap ? 'wrap' : ''); tb.append(h('caption', '', T.cap));
      const tr = h('tr'); T.head.forEach(x => { const th = h('th', '', x); th.scope = 'col'; tr.append(th); }); const th = h('thead'); th.append(tr); tb.append(th);
      const body = h('tbody'); T.rows.forEach(r => { const row = h('tr'); r.forEach((v, i) => { const c = h(i ? 'td' : 'th', '', v == null ? 'not collected' : String(v)); if (!i) c.scope = 'row'; row.append(c); }); body.append(row); }); tb.append(body); w.append(tb);
    });
    R.fig.append(w);
  }
  const svgOf = (W, H, aria) => el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': aria });
  /* a chart of lines over years: grid, the lines, a dot and a direct label at each end, a crosshair with the year's values */
  function lines(o) {
    const fig = R.fig, W = fig.clientWidth, H = fig.clientHeight, ph = phone(), m = { l: 36, r: ph ? 50 : (o.rpad || 190), t: 16, b: 22 }, pw = W - m.l - m.r, phh = H - m.t - m.b;
    const Xs = v => m.l + (v - o.x0) / (o.x1 - o.x0) * pw, Y = v => m.t + (o.y1 - v) / (o.y1 - o.y0) * phh, svg = svgOf(W, H, o.aria);
    o.yt.forEach(v => svg.append(el('line', { x1: m.l, x2: m.l + pw, y1: Y(v), y2: Y(v), stroke: v === (o.base == null ? o.y0 : o.base) ? '#3a4d5e' : '#17222d', 'stroke-width': 1 }), el('text', { x: m.l - 6, y: Y(v) + 3.5, 'text-anchor': 'end' }, (o.yf || String)(v))));
    (ph && o.xtp ? o.xtp : o.xt).forEach(v => svg.append(el('text', { x: Xs(v), y: H - 5, 'text-anchor': 'middle' }, String(v))));
    if (o.under) o.under(svg, Xs, Y, m, pw, phh);
    const ends = [];
    o.series.forEach(s => {
      const pts = s.pts.filter(p => p[1] != null);
      svg.append(el('polyline', { points: pts.map(p => Xs(p[0]) + ',' + Y(p[1])).join(' '), fill: 'none', stroke: s.c, 'stroke-width': s.w || 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: s.o || 1 }));
      const e = pts[pts.length - 1];
      svg.append(el('circle', { cx: Xs(e[0]), cy: Y(e[1]), r: s.w > 2 ? 4.5 : 3.5, fill: s.c, stroke: C.bg, 'stroke-width': 2 }));
      ends.push({ y: Y(e[1]), x: Xs(e[0]), s, v: e[1] });
    });
    ends.sort((a, b) => a.y - b.y); for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
    for (let i = ends.length - 1; i > 0; i--) { const over = ends[i].y - (m.t + phh + 4); if (over > 0) { ends[i].y -= over; if (ends[i].y - ends[i - 1].y < 14) ends[i - 1].y = ends[i].y - 14; } }
    ends.forEach(e => { const vt = (o.vf || f1)(e.v); svg.append(el('text', { x: e.x + 9, y: e.y + 5, class: 'lv' }, vt)); if (!ph) svg.append(el('text', { x: e.x + 15 + vt.length * 7.6, y: e.y + 4, class: 'lb', fill: e.s.hi ? C.ink : C.ink2 }, e.s.name)); });
    (o.marks || []).forEach(k => { svg.append(el('circle', { cx: Xs(k.x), cy: Y(k.y), r: 4, fill: k.c, stroke: C.bg, 'stroke-width': 2 })); if (k.t) svg.append(el('text', { x: Xs(k.x) + (k.dx || 0), y: Y(k.y) + (k.dy == null ? -10 : k.dy), 'text-anchor': k.a || 'middle', class: 'lb', fill: C.ink }, ph && k.tp != null ? k.tp : k.t)); });
    if (o.over) o.over(svg, Xs, Y, m, pw, phh);
    if (o.tip) {
      const ch = el('line', { y1: m.t, y2: m.t + phh, stroke: C.lab, 'stroke-width': 1, opacity: 0 }); svg.append(ch);
      const hit = el('rect', { x: m.l, y: 0, width: pw, height: H, fill: 'transparent', style: 'cursor:crosshair' });
      const mv = ev => { const b = svg.getBoundingClientRect(), x = Math.max(o.x0, Math.min(o.x1, Math.round(o.x0 + ((ev.clientX - b.left) * (W / b.width) - m.l) / pw * (o.x1 - o.x0)))); const rows = o.tip(x); if (!rows) return; ch.setAttribute('x1', Xs(x)); ch.setAttribute('x2', Xs(x)); ch.setAttribute('opacity', .7); tipShow(rows, ev.clientX, ev.clientY); };
      hit.addEventListener('pointermove', mv); hit.addEventListener('pointerdown', mv); hit.addEventListener('pointerleave', () => { ch.setAttribute('opacity', 0); tipHide(); });
      svg.append(hit);
    }
    fig.append(svg);
  }
  /* columns over years, stacked or side by side */
  function cols(o) {
    const fig = R.fig, W = fig.clientWidth, H = fig.clientHeight, ph = phone(), m = { l: 40, r: ph ? 8 : (o.rpad || 20), t: 18, b: 22 }, pw = W - m.l - m.r, phh = H - m.t - m.b, n = o.cats.length;
    const slot = pw / n, Y = v => m.t + (o.y1 - v) / (o.y1 - o.y0) * phh, svg = svgOf(W, H, o.aria), k = o.series.length;
    const bw = o.stack ? Math.min(o.bw || 46, slot * .62) : Math.min(20, slot * .8 / k);
    o.yt.forEach(v => svg.append(el('line', { x1: m.l, x2: m.l + pw, y1: Y(v), y2: Y(v), stroke: v === 0 ? '#5d6f7e' : '#17222d', 'stroke-width': 1 }), el('text', { x: m.l - 6, y: Y(v) + 3.5, 'text-anchor': 'end' }, (o.yf || String)(v))));
    o.cats.forEach((c, i) => {
      const cx = m.l + slot * i + slot / 2, every = ph ? (o.everyP || 4) : (o.every || 1);
      if (i % every === 0 || i === n - 1) svg.append(el('text', { x: cx, y: H - 5, 'text-anchor': 'middle' }, String(c)));
      const g = el('g', { class: 'col', opacity: o.dim && o.dim(i) ? .55 : 1 }); let up = 0, dn = 0;
      o.series.forEach((s, j) => {
        const v = s.vals[i]; if (v == null) return;
        let x, y0, y1;
        if (o.stack) { x = cx - bw / 2; if (v >= 0) { y0 = Y(up); y1 = Y(up + v); up += v; } else { y0 = Y(dn); y1 = Y(dn + v); dn += v; } }
        else { x = cx - bw * k / 2 + bw * j; y0 = Y(0); y1 = Y(v); }
        const top = Math.min(y0, y1), hh = Math.abs(y1 - y0);
        g.append(el('rect', { x: x + (o.stack ? 0 : .5), y: top + (o.stack && hh > 3 ? 1 : 0), width: bw - (o.stack ? 0 : 1), height: Math.max(.8, hh - (o.stack && hh > 3 ? 1 : 0)), rx: Math.min(2, bw / 4), fill: s.c }));
      });
      if (o.total && !ph) g.append(el('text', { x: cx, y: Y(up) - 6, 'text-anchor': 'middle', class: 'lb', fill: C.ink }, o.total(i)));
      svg.append(g);
      if (o.tip) { const hit = el('rect', { x: cx - slot / 2, y: m.t, width: slot, height: phh, fill: 'transparent', tabindex: 0, role: 'img', 'aria-label': o.tip(i).map((r, q) => q ? r.join(' ') : r).join('; ') }); hover(hit, o.tip(i)); svg.append(hit); }
    });
    if (o.over) o.over(svg, i => m.l + slot * i + slot / 2, Y, m, pw, phh);
    fig.append(svg);
  }
  /* pairs of horizontal bars under a group title, with one large figure beside each group; compact: the title at the left, two thin bars, named by the legend */
  function pairs(o) {
    const fig = R.fig, W = fig.clientWidth, H = fig.clientHeight, ph = phone(), lw = ph ? 0 : (o.lw || 250), m = { l: lw + 10, r: ph ? 58 : (o.compact ? 70 : 150) }, pw = W - m.l - m.r, Xs = v => m.l + v / o.max * pw;
    const n = o.groups.length, per = o.groups[0].rows.length, svg = svgOf(W, H, o.aria);
    if (o.compact) {
      const hd = ph ? 18 : 0, gh = (H - 8) / n, bh = Math.max(9, Math.min(20, (gh - hd - 14) / per - 2));
      for (let v = 0; v <= o.max; v += o.step || 2) svg.append(el('line', { x1: Xs(v), x2: Xs(v), y1: 4, y2: H - 4, stroke: v ? '#17222d' : '#3a4d5e', 'stroke-width': 1 }));
      o.groups.forEach((g, gi) => {
        const y = 4 + gi * gh + (gh - hd - per * (bh + 2)) / 2;
        if (ph) svg.append(el('text', { x: m.l, y: y + 11, class: 'lb', fill: g.hi ? C.ink : C.ink2 }, g.title)); else svg.append(el('text', { x: m.l - 12, y: y + per * (bh + 2) / 2 + 4, 'text-anchor': 'end', class: 'lb', fill: g.hi ? C.ink : C.ink2 }, g.title));
        g.rows.forEach((r, j) => { const yy = y + hd + j * (bh + 2); svg.append(el('rect', { x: m.l, y: yy, width: Math.max(2, Xs(r.v) - m.l), height: bh, rx: 3, fill: r.c }), el('text', { x: Xs(r.v) + 7, y: yy + bh / 2 + 5, class: 'lv' }, (o.vf || (v => v.toFixed(1) + '%'))(r.v, r))); });
      });
      fig.append(svg); return;
    }
    const gap = ph ? 24 : 12, bh = ph ? 22 : Math.max(18, Math.min(44, (H - 30 - n * 30) / (n * per) - gap)), gh = per * (bh + gap) + (ph ? 46 : 34), y0 = Math.max(12, (H - n * gh) / 2 + 6);
    o.groups.forEach((g, gi) => {
      const y = y0 + gi * gh;
      svg.append(el('text', { x: ph ? m.l : m.l - 12, y, 'text-anchor': ph ? 'start' : 'end' }, g.title.toUpperCase()));
      g.rows.forEach((r, j) => {
        const yy = y + 14 + j * (bh + gap) + (ph ? 16 : 0);
        if (ph) svg.append(el('text', { x: m.l, y: yy - 6, class: 'lb' }, r.label)); else svg.append(el('text', { x: m.l - 12, y: yy + bh / 2 + 4, 'text-anchor': 'end', class: 'lb', fill: r.hi ? C.ink : C.ink2 }, r.label));
        svg.append(el('rect', { x: m.l, y: yy, width: Math.max(2, Xs(r.v) - m.l), height: bh, rx: 4, fill: r.c }), el('text', { x: Xs(r.v) + 8, y: yy + bh / 2 + 6, class: 'lv' }, (o.vf || (v => v.toFixed(1) + '%'))(r.v)));
      });
      if (g.big) { const yc = y + 14 + (per * (bh + gap) - gap) / 2 + (ph ? 16 : 0); if (ph) svg.append(el('text', { x: m.l, y: y + 14 + per * (bh + gap) + 26, class: 'lb', fill: C.lab }, g.big + ' ' + g.sub)); else svg.append(el('text', { x: W - 12, y: yc + 6, 'text-anchor': 'end', class: 'big' }, g.big), el('text', { x: W - 12, y: yc + 24, 'text-anchor': 'end' }, g.sub)); }
    });
    fig.append(svg);
  }

  /* ---------- profits and profit capture (stations 1 and 2) ---------- */
  const V = {};
  /* ---------- station 2 · Technology: the rule of three (a scheme, drawn in words; each way carries one figure measured elsewhere on the map) ---------- */
  const TRI = [['Economics', 'Markets and finance', ['The deepest stock and bond markets', 'The listing: capital flows to where the firm is listed', 'Dollar funding and clearing'], C.gold,
      () => [D.M.mv[D.M.mv.length - 1].toFixed(1) + '%', 'of the world’s stock-market value is listed in the US, with ' + D.M.gdp[D.M.gdp.length - 1].toFixed(1) + '% of world GDP', 'End of ' + D.M.y[D.M.y.length - 1] + ' · World Bank, IMF']],
    ['Coercion', 'Export controls, sanctions and tariffs', ['Export controls and licences on chips and tools', 'Sanctions through the dollar’s clearing system', 'Tariffs that sort who supplies whom'], C.red,
      () => ['36% → 33%', 'China’s share of ASML’s sales, as export controls sort the toolmakers into the American sphere', '2024 to 2025 · ASML (Circuit, step 03)']],
    ['Code', 'Patents, chips, platforms and standards', ['Intellectual property, protected by treaty', 'The chips and the tools that make them', 'Platforms and the standards others must use'], C.purple,
      () => ['$195bn', 'US receipts for the use of intellectual property; most foreign revenue is booked by subsidiaries abroad', '2025 · BEA (Circuit, step 01)']]];
  V.tri = { title: 'Three ways to hold the technology', unit: 'A scheme · figures as measured elsewhere on this map', draw() {
    const us = D.CS['2026'].find(r => r.c === 'USA');
    reading('Read across: ', 'each way names its instruments and carries one dated figure. Together they secure the profits below.');
    const w = h('div', 'pf-tri'); w.setAttribute('role', 'group'); w.setAttribute('aria-label', 'Three ways the profits are secured: economics, coercion and code');
    TRI.forEach(([nm, what, list, c, fg], i) => { const s = h('section'), F = fg(); s.style.setProperty('--tc', c);
      const ul = h('ul'); list.forEach(t => ul.append(h('li', '', t)));
      const f = h('div', 'fg'); f.append(h('b', '', F[0]), h('span', '', F[1]), h('small', '', F[2]));
      s.append(h('span', 'n', '0' + (i + 1)), h('h4', '', nm), h('p', 'w', what), ul, f); w.append(s); });
    const out = h('p', 'out'); out.append(h('i', ''), h('b', '', us.r.toFixed(2)), h('span', '', `Profit capture: US firms book ${f1(us.ps)}% of the profits of the world’s 2,000 largest listed firms on ${f1(us.gs)}% of world GDP (Forbes list of 2026).`)); w.append(out);
    R.fig.append(w);
  }, table: () => ({ wrap: 1, cap: 'Three ways to hold the technology whose profits the firms book. A scheme: the instruments are named, not measured; each way carries one dated figure measured elsewhere on this map.', head: ['Way', 'What it covers', 'Instruments', 'One figure', 'Date and source'],
    rows: TRI.map(([nm, what, list, c, fg]) => { const F = fg(); return [nm, what, list.join('; '), F[0] + ' ' + F[1], F[2]]; }) }) };
  V.pic = { title: 'The US economy and its firms’ profits', unit: 'Forbes Global 2000 · IMF', draw() {
    const a = D.CS['2026'].find(r => r.c === 'USA'), b = D.CS['2011-2026'].find(r => r.c === 'USA');
    reading('Read it this way: ', 'a profit Apple earns in Europe or TSMC earns in Arizona counts where the firm is listed, not where the sale was made.');
    legend([[C.grey, 'US share of world GDP', 1], [C.gold, 'US firms’ share of the largest firms’ profits', 1]]);
    pairs({ max: 50, aria: `US share of world GDP against US firms’ share of the profits of the world’s 2,000 largest listed firms. The 2026 list: ${a.gs.toFixed(1)}% against ${a.ps.toFixed(1)}%, ${f2(a.r)} times. All lists from 2011 to 2026: ${b.gs.toFixed(1)}% against ${b.ps.toFixed(1)}%, ${f2(b.r)} times.`,
      groups: [['The 2026 list', a], ['All lists, 2011 to 2026', b]].map(([t, r]) => ({ title: t, big: f2(r.r) + '×', sub: 'its GDP weight', rows: [{ label: 'US share of world GDP', v: r.gs, c: C.grey }, { label: 'US firms’ share of the largest firms’ profits', v: r.ps, c: C.gold, hi: 1 }] })) });
  }, table: () => natTable() };
  function natTable() {
    const rows = []; WIN.forEach(([k, name]) => D.CS[k].forEach(r => rows.push([NAME[r.c], name, f2(r.ps), f2(r.gs), f2(r.r), r.f])));
    D.US.forEach(r => rows.push(['United States', 'The ' + r[0] + ' list', f2(r[1]), f2(r[2]), f2(r[3]), '']));
    return { cap: 'Share of the profits of the Forbes Global 2000 and of world GDP, by headquarters country (net profits; a list of year Y against GDP of Y−1, IMF, market exchange rates).', head: ['Country', 'Lists', 'Share of profits, %', 'Share of world GDP, %', 'Ratio', 'Firms a list'], rows };
  }
  V.nat = { title: 'Who captures the profits of the world’s largest firms', unit: 'Share of profits ÷ share of world GDP', tall: 1, chips() { chipRow('Lists', WIN.map(w => [w[0], w[2]]), 'pw', S.win); }, draw() {
    reading('United States: ', 'between 1.41 and 1.80 in every list since 2011.'); legend([[C.gold, 'United States', 1], [C.grey, 'Seven other economies', 1]]);
    const fig = R.fig, W = fig.clientWidth, H = fig.clientHeight, ph = phone(), rows = [...D.CS[S.win]].sort((a, b) => b.r - a.r), wl = WIN.find(w => w[0] === S.win)[1];
    const strip = H >= 320, stripH = strip ? Math.min(112, Math.max(86, H * .27)) : 0, m = { l: ph ? 106 : 190, r: 46, t: 30, b: 4 }, pw = W - m.l - m.r, bh = H - m.t - m.b - stripH, rh = bh / rows.length, th = Math.min(20, rh - 8), Xs = v => m.l + v / 2.3 * pw;
    const svg = svgOf(W, H, `Bars for eight economies: each one’s share of the profits of the Forbes Global 2000, divided by its share of world GDP. ${wl}. ${rows.map(r => NAME[r.c] + ' ' + f2(r.r)).join(', ')}. A value of 1 means profits in line with the economy’s weight. Below, the United States in every list from 2011 to 2026: lowest 1.41 in the 2018 list, highest 1.80 in the 2014 list, 1.62 in the 2026 list.`);
    [0, .5, 1, 1.5, 2].forEach(v => { svg.append(el('line', { x1: Xs(v), x2: Xs(v), y1: m.t - 4, y2: m.t + bh, stroke: v === 1 ? '#5d6f7e' : '#17222d', 'stroke-width': 1 })); if (v !== 1 && !(ph && v !== 0 && v !== 2)) svg.append(el('text', { x: Xs(v), y: m.t - 9, 'text-anchor': 'middle' }, v.toFixed(1))); });
    svg.append(el('text', { x: Xs(1), y: m.t - 9, 'text-anchor': 'middle', fill: C.ink2 }, ph ? '1.0' : '1.0 = GDP weight'));
    rows.forEach((r, i) => {
      const y = m.t + rh * i + (rh - th) / 2, x1 = Xs(r.r), us = r.c === 'USA';
      svg.append(el('text', { x: m.l - 10, y: y + th / 2 + 4, 'text-anchor': 'end', class: 'lb', fill: us ? C.ink : C.ink2 }, ph ? SHORT[NAME[r.c]] || NAME[r.c] : NAME[r.c]));
      const p = el('rect', { class: 'barh', tabindex: 0, role: 'img', 'aria-label': `${NAME[r.c]}: ratio ${f2(r.r)}; ${r.ps.toFixed(1)}% of the list’s profits, ${r.gs.toFixed(1)}% of world GDP, ${r.f} firms a list`, x: m.l, y, width: Math.max(2, x1 - m.l), height: th, rx: 3, fill: us ? C.gold : C.grey });
      hover(p, [NAME[r.c] + ' · ' + wl.toLowerCase(), ['Share of the list’s profits', r.ps.toFixed(1) + '%'], ['Share of world GDP', r.gs.toFixed(1) + '%'], ['Ratio', f2(r.r)], ['Firms a list', String(r.f)]]);
      svg.append(p, el('text', { x: x1 + 7, y: y + th / 2 + 5, class: 'lv' }, f2(r.r)));
    });
    if (strip) {
      const sy = m.t + bh + 30, sh = stripH - 56, Us = D.US, sx = i => m.l + pw * i / (Us.length - 1), syv = v => sy + sh - (v - 1.3) / .6 * sh;
      svg.append(el('text', { x: m.l - 10, y: sy + sh / 2 - 3, 'text-anchor': 'end', class: 'lb' }, ph ? 'US,' : 'United States,'), el('text', { x: m.l - 10, y: sy + sh / 2 + 12, 'text-anchor': 'end', class: 'lb' }, 'every list'));
      svg.append(el('polyline', { points: Us.map((r, i) => sx(i) + ',' + syv(r[3])).join(' '), fill: 'none', stroke: C.gold, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      Us.forEach((r, i) => { const lo = r[0] === 2018, hi = r[0] === 2014, end = i === Us.length - 1, st = i === 0; if (!(lo || hi || end || (st && !ph))) return; svg.append(el('circle', { cx: sx(i), cy: syv(r[3]), r: 4, fill: C.gold, stroke: C.bg, 'stroke-width': 2 }), el('text', { x: sx(i) + (end ? 8 : 0), y: syv(r[3]) + (lo ? (ph ? -9 : 17) : end ? 4 : -9), 'text-anchor': end || st ? 'start' : 'middle', class: 'lb', fill: C.ink }, f2(r[3])), el('text', { x: sx(i), y: sy + sh + 20, 'text-anchor': end ? 'end' : st ? 'start' : 'middle' }, String(r[0]))); });
    }
    fig.append(svg);
  }, table: () => natTable() };
  V.own = { title: 'What US owners earn abroad', unit: '% of the profits of US-owned firms', draw() {
    const last = G[G.length - 1], p08 = G.find(r => r.y === 2008);
    reading('2025: ', `profits of US-owned firms ${bn(last.nat)}; earned in the US economy ${bn(last.dom)}; net from abroad ${bn(last.net)}.`);
    legend(phone() ? [[C.teal, 'Received from abroad (from 1998)'], [C.blue, 'Net of what foreign owners take out']] : []);
    lines({ x0: 1960, x1: 2025, y0: 0, y1: 45, yt: [0, 10, 20, 30, 40], xt: [1960, 1970, 1980, 1990, 2000, 2010, 2020], xtp: [1960, 1980, 2000, 2020], rpad: 218, vf: v => v.toFixed(1) + '%',
      aria: 'Two lines, as a share of the profits of US-owned firms. Net profits from the rest of the world, 1960 to 2025: 5.7% in 1960, a peak of 29.0% in 2008, 12.7% in 2025. Receipts from the rest of the world, 1998 to 2025: 17.6% in 1998, a peak of 42.6% in 2008, 26.4% in 2025. The table view holds every value.',
      series: [{ name: 'net of foreign owners’ take', c: C.blue, pts: G.map(r => [r.y, r.netp]) }, { name: 'received from abroad', c: C.teal, pts: G.map(r => [r.y, r.recp]), hi: 1 }],
      marks: [{ x: 2008, y: p08.recp, c: C.teal, t: '2008 · ' + p08.recp.toFixed(1) + '%' }, { x: 2008, y: p08.netp, c: C.blue, t: p08.netp.toFixed(1) + '%' }],
      tip: y => { const r = G.find(g => g.y === y); const rows = [String(y), ['Profits of US-owned firms', bn(r.nat)], ['Earned in the US economy', bn(r.dom)]]; if (r.rec != null) rows.push(['Received from abroad', bn(r.rec) + ' · ' + r.recp.toFixed(1) + '%'], ['Paid to foreign owners', bn(r.pay)]); rows.push(['Net from abroad', bn(r.net) + ' · ' + r.netp.toFixed(1) + '%']); return rows; } });
  }, table: () => ({ cap: 'Corporate profits with inventory valuation and capital consumption adjustments, before tax, $bn (BEA national accounts, 4 Nov 2026). Receipts and payments are published from 1998.', head: ['Year', 'Profits of US-owned firms', 'Earned in the US economy', 'Received from abroad', 'Paid to foreign owners', 'Net from abroad', 'Net, % of the first column', 'Receipts, % of the first column'], rows: [...G].reverse().map(r => [r.y, r.nat, r.dom, r.rec == null ? 'not published' : r.rec, r.pay == null ? 'not published' : r.pay, r.net, r.netp, r.recp == null ? 'not published' : r.recp]) }) };
  const ROC = [['GBR', C.grey], ['NLD', C.grey], ['USA', C.gold], ['CHN', C.red], ['KOR', C.grey], ['TWN', C.grey], ['DEU', C.grey], ['JPN', C.grey]];
  V.roc = { title: 'What capital earns inside each economy', unit: 'Real return on the capital stock, % · Penn World Table 11.0', draw() {
    const A = D.A, n = A.y.length - 1;
    reading('The territorial comparison: ', `the US return was ${A.USA[n].toFixed(1)}% in 2023 and has held near 8% since the 1980s; China’s fell from 13.5% in 1995 to ${A.CHN[n].toFixed(1)}%.`);
    legend(phone() ? [[C.gold, 'United States'], [C.red, 'China'], [C.grey, 'Six allies: UK, Netherlands, Korea, Taiwan, Germany, Japan (top to bottom, 2023)']] : []);
    lines({ x0: 1980, x1: 2023, y0: 0, y1: 22, yt: [0, 5, 10, 15, 20], xt: [1980, 1990, 2000, 2010, 2020], rpad: 150, vf: v => v.toFixed(1),
      aria: 'Eight lines, 1980 to 2023: the real return on the capital stock of each economy, in %. In 2023: ' + ROC.map(([k]) => NAME[k] + ' ' + A[k][n].toFixed(1)).join(', ') + '. South Korea was above 17% in the 1980s; China peaked at 13.5% in 1995.',
      series: ROC.map(([k, c]) => ({ name: NAME[k], c, w: k === 'USA' ? 2.6 : c === C.grey ? 1.5 : 2, o: c === C.grey ? .8 : 1, hi: c !== C.grey, pts: A.y.map((y, i) => [y, A[k][i]]) })),
      tip: y => [String(y)].concat(ROC.map(([k]) => [NAME[k], A[k][y - 1980].toFixed(1) + '%'])) });
  }, table: () => ({ cap: 'Real internal rate of return on the capital stock, % (Penn World Table 11.0). Whole economies, housing and unincorporated business included; profits earned abroad are not in it.', head: ['Year'].concat(ROC.map(([k]) => NAME[k])), rows: D.A.y.map((y, i) => [y].concat(ROC.map(([k]) => f2(D.A[k][i])))).reverse() }) };

  /* ---------- the claims (now views of stations 1 and 4) ---------- */
  V.hold = { title: 'US shares and US Treasuries held abroad', unit: '$tn, end of year · Federal Reserve, Z.1', draw() {
    const Hd = D.H, n = Hd.y.length - 1;
    tiles([{ v: tn(Hd.last[1]), k: 'US shares held abroad', d: 'mid-2026', c: C.gold, line: 1 }, { v: tn(Hd.last[2]), k: 'US Treasuries held abroad', d: 'mid-2026', c: C.blue, line: 1 }, { v: (Hd.last[1] / Hd.last[2]).toFixed(1) + '×', k: 'shares for every dollar of Treasuries', d: '2000: ' + (Hd.eq[0] / Hd.tr[0]).toFixed(1) + '×' }]);
    reading('Three phases: ', 'shares led until 2007, Treasuries from 2008 to 2016, shares again since 2017.'); legend(phone() ? [[C.gold, 'US shares'], [C.blue, 'US Treasuries']] : []);
    lines({ x0: 2000, x1: 2026.5, y0: 0, y1: 24, yt: [0, 5, 10, 15, 20], xt: [2000, 2005, 2010, 2015, 2020, 2025], xtp: [2000, 2010, 2020], rpad: 150, vf: tn,
      aria: `Two lines, 2000 to mid-2026, in trillions of dollars. US shares held by foreigners: ${tn(Hd.eq[0])} in 2000, ${tn(Hd.eq[n])} at the end of 2025, ${tn(Hd.last[1])} in mid-2026. US Treasuries held by foreigners: ${tn(Hd.tr[0])} in 2000, ${tn(Hd.tr[n])} at the end of 2025, ${tn(Hd.last[2])} in mid-2026.`,
      series: [{ name: 'US Treasuries', c: C.blue, pts: Hd.y.map((y, i) => [y, Hd.tr[i]]).concat([[2026.5, Hd.last[2]]]) }, { name: 'US shares', c: C.gold, w: 2.6, hi: 1, pts: Hd.y.map((y, i) => [y, Hd.eq[i]]).concat([[2026.5, Hd.last[1]]]) }],
      tip: x => { const i = Math.min(n, Math.max(0, Math.round(x) - 2000)), l = x > 2025.6; return [l ? 'Mid-2026' : 'End of ' + Hd.y[i], ['US shares', tn(l ? Hd.last[1] : Hd.eq[i])], ['US Treasuries', tn(l ? Hd.last[2] : Hd.tr[i])]]; } });
  }, table: () => ({ cap: 'US shares and US Treasury securities held by the rest of the world, $tn, end of year (Federal Reserve, Z.1, vintage of 17 Nov 2026). Shares: equities issued by US corporations, at market value; fund shares are not included.', head: ['Year', 'US shares', 'US Treasuries'], rows: [['Mid-2026', D.H.last[1].toFixed(3), D.H.last[2].toFixed(3)]].concat(D.H.y.map((y, i) => [y, D.H.eq[i].toFixed(3), D.H.tr[i].toFixed(3)]).reverse()) }) };
  /* E1 (18 Nov): who bought and what, from the Treasury's TIC transactions. Two panels on one scale: official holders above, private
     holders below, each a stack by instrument. Bills are left out of the chart (they are a change in holdings, not transactions) and sit
     in the table under their own name; 2026 is eight months, so it is named in the reading line and the table and not drawn as a year. */
  const EK = [['t', 'Treasury bonds & notes', C.blue], ['a', 'Agency bonds', C.teal], ['c', 'Corporate bonds', C.purple], ['e', 'Shares', C.gold]];
  const bs = x => (x < 0 ? '−$' : '$') + Math.abs(Math.round(x)).toLocaleString('en-US') + 'bn';
  V.flow = { title: 'What foreigners bought each year: who bought, and what', unit: 'Net purchases, $bn a year · US Treasury, TIC', draw() {
    const E = D.E, y = E.y, n = y.length, v = E.v, ph = phone(), i = n - 1, tot = (hd, j) => EK.reduce((s, k) => s + v[hd + k[0]][j], 0);
    const sold = y.filter((yy, j) => yy >= 2015 && v.ot[j] < 0).length, soldSum = y.reduce((s, yy, j) => s + (yy >= 2015 ? v.ot[j] : 0), 0);
    tiles([{ v: bs(v.ot[i]), k: 'Treasury bonds & notes, official holders', d: '2025', c: C.blue }, { v: bs(v.oe[i]), k: 'shares, official holders', d: '2025', c: C.gold },
      { v: bs(v.pe[i]), k: 'shares, private holders', d: '2025', c: C.gold }, { v: bs(tot('o', i) + tot('p', i)), k: 'all long-term US securities', d: '2025, both holders' }]);
    reading('Official holders are leaving Treasuries for shares: ', `they sold Treasury bonds and notes, net, in ${sold} of the 11 years from 2015 to 2025 (${bs(soldSum)} in all) and bought ${bs(E.p26.oe)} of shares in ${E.part}, after ${bs(v.oe[i])} in 2025.`);
    legend(EK.map(k => [k[2], k[1], 1]));
    const fig = R.fig, W = fig.clientWidth, H = fig.clientHeight, m = { l: 46, r: ph ? 6 : 14, t: 22, b: 20 }, gap = 34, pw = W - m.l - m.r, slot = pw / n, bw = Math.max(3, Math.min(24, slot * .64));
    const ext = hd => { let hi = 0, lo = 0; y.forEach((_, j) => { let u = 0, d = 0; EK.forEach(k => { const x = v[hd + k[0]][j]; if (x >= 0) u += x; else d += x; }); hi = Math.max(hi, u); lo = Math.min(lo, d); }); return [Math.floor(lo / 100) * 100, Math.ceil(hi / 100) * 100]; };
    const eo = ext('o'), ep = ext('p'), kk = (H - m.t - m.b - gap) / ((eo[1] - eo[0]) + (ep[1] - ep[0]));
    const svg = svgOf(W, H, `Two panels of stacked columns, one column a year from 2000 to 2025, in billions of dollars, on one scale. Above, foreign official holders: net sellers of Treasury bonds and notes in ${sold} of the 11 years from 2015 to 2025, with the largest sales in 2016 (${bs(v.ot[16])}) and 2019 (${bs(v.ot[19])}); net buyers of US shares in 2023 (${bs(v.oe[23])}), 2024 (${bs(v.oe[24])}) and 2025 (${bs(v.oe[25])}). Below, private foreign holders: in 2025 they bought ${bs(v.pe[i])} of shares, ${bs(v.pt[i])} of Treasury bonds and notes, ${bs(v.pc[i])} of corporate bonds and ${bs(v.pa[i])} of agency bonds.`);
    [['o', 'Official holders', 'central banks and state funds', eo, m.t], ['p', 'Private holders', 'funds, banks and households', ep, m.t + (eo[1] - eo[0]) * kk + gap]].forEach(([hd, name, who, e, top]) => {
      const Y = x => top + (e[1] - x) * kk, step = hd === 'o' ? 200 : 400;
      for (let t = Math.ceil(e[0] / step) * step; t <= e[1]; t += step) svg.append(el('line', { x1: m.l, x2: m.l + pw, y1: Y(t), y2: Y(t), stroke: t === 0 ? '#5d6f7e' : '#17222d', 'stroke-width': 1 }), el('text', { x: m.l - 6, y: Y(t) + 3.5, 'text-anchor': 'end' }, (t < 0 ? '−' : '') + Math.abs(t)));
      svg.append(el('text', { x: m.l, y: top - 8, class: 'lb', fill: C.ink }, name), el('text', { x: m.l + name.length * 7.1 + 10, y: top - 8, class: 'lb' }, ph ? '' : who));
      y.forEach((yy, j) => {
        const cx = m.l + slot * j + slot / 2, g = el('g', { class: 'col' }); let up = 0, dn = 0;
        EK.forEach(k => { const x = v[hd + k[0]][j]; let y0, y1; if (x >= 0) { y0 = Y(up); y1 = Y(up + x); up += x; } else { y0 = Y(dn); y1 = Y(dn + x); dn += x; } const hh = Math.abs(y1 - y0); g.append(el('rect', { x: cx - bw / 2, y: Math.min(y0, y1) + (hh > 3 ? .5 : 0), width: bw, height: Math.max(.8, hh - (hh > 3 ? 1 : 0)), rx: Math.min(2, bw / 4), fill: k[2] })); });
        svg.append(g);
        const rows = [yy + ' · ' + name.toLowerCase()].concat(EK.map(k => [k[1], bs(v[hd + k[0]][j])]));
        const hit = el('rect', { x: cx - slot / 2, y: top, width: slot, height: (e[1] - e[0]) * kk, fill: 'transparent', tabindex: 0, role: 'img', 'aria-label': rows.map((r, q) => q ? r.join(' ') : r).join('; ') }); hover(hit, rows); svg.append(hit);
      });
    });
    y.forEach((yy, j) => { if (yy % (ph ? 10 : 5) === 0 || j === n - 1) svg.append(el('text', { x: m.l + slot * j + slot / 2, y: H - 4, 'text-anchor': 'middle' }, String(yy))); });
    fig.append(svg);
  }, table: () => { const E = D.E, v = E.v, K = ['ot', 'oa', 'oc', 'oe', 'pt', 'pa', 'pc', 'pe', 'ob', 'pb'], f = x => x.toFixed(1).replace('-', '−');
    return { cap: `Net purchases of US securities by foreigners, $bn (US Treasury, TIC monthly reports, history table of ${E.stamp}; a year is the sum of twelve months, not seasonally adjusted; reported transactions, without price changes and before Treasury’s stock-swap adjustment). The 2026 row is ${E.part}, eight months, not a year. Treasury bills are a different kind of series, the change in reported holdings, and are never added to the others here. The Federal Reserve’s own count (Z.1), used for “Held abroad”, gives $646.7bn of shares for 2025 where this table gives ${bs(v.oe[25] + v.pe[25]).slice(1)}: two measures, not reconciled.`,
      head: ['Year', 'Official: Treasury bonds & notes', 'Official: agency bonds', 'Official: corporate bonds', 'Official: shares', 'Private: Treasury bonds & notes', 'Private: agency bonds', 'Private: corporate bonds', 'Private: shares', 'Official: bills (change in holdings)', 'Private: bills (change in holdings)'],
      rows: [[E.part + ' (eight months)'].concat(K.map(k => f(E.p26[k])))].concat(E.y.map((yy, j) => [yy].concat(K.map(k => f(v[k][j])))).reverse()) }; } };
  V.list = { title: 'The listing premium', unit: 'US share of the world total, % · World Bank, IMF', draw() {
    const M = D.M, n = M.y.length - 1;
    tiles([{ v: M.mv[n].toFixed(1) + '%', k: 'of the world’s stock-market value', d: 'end of 2025', c: C.gold, line: 1 }, { v: M.gdp[n].toFixed(1) + '%', k: 'of world GDP', d: '2025', c: C.grey, line: 1 }, { v: (M.mv[n] / M.gdp[n]).toFixed(2) + '×', k: 'market value against GDP weight', d: '2010: ' + (M.mv[10] / M.gdp[10]).toFixed(2) + '×' }, { v: '—', k: 'of equity raised on exchanges', d: 'not collected', empty: 1 }]);
    reading('What the listing buys: ', 'a market worth far more than the economy’s weight, where shares can be sold and investment raised.'); legend(phone() ? [[C.gold, 'Share of world stock-market value'], [C.grey, 'Share of world GDP (from 2010)']] : []);
    lines({ x0: 2000, x1: 2025, y0: 0, y1: 60, yt: [0, 20, 40, 60], xt: [2000, 2005, 2010, 2015, 2020, 2025], xtp: [2000, 2010, 2020], rpad: 232, vf: v => v.toFixed(1) + '%',
      aria: `Two lines. The US share of the world’s stock-market value, 2000 to 2025: ${M.mv[0]}% in 2000, ${M.mv[10]}% in 2010, ${M.mv[n]}% in 2025. The US share of world GDP, 2010 to 2025: ${M.gdp[10]}% in 2010, ${M.gdp[n]}% in 2025.`,
      series: [{ name: 'of world GDP (from 2010)', c: C.grey, pts: M.y.map((y, i) => [y, M.gdp[i]]) }, { name: 'of world stock-market value', c: C.gold, w: 2.6, hi: 1, pts: M.y.map((y, i) => [y, M.mv[i]]) }],
      tip: y => { const i = y - 2000; return [String(y), ['Stock-market value', M.mv[i].toFixed(1) + '%'], ['World GDP', M.gdp[i] == null ? 'not collected' : M.gdp[i].toFixed(1) + '%']]; } });
  }, table: () => ({ cap: 'The US share of the market value of listed domestic companies worldwide (World Bank, from the World Federation of Exchanges; the world total changes construction in 2019) and of world GDP (IMF, market exchange rates). Equity raised on exchanges: not collected.', head: ['Year', 'Share of world stock-market value, %', 'Share of world GDP, %'], rows: D.M.y.map((y, i) => [y, D.M.mv[i].toFixed(1), D.M.gdp[i] == null ? null : f2(D.M.gdp[i])]).reverse() }) };
  V.home = { title: 'Who holds US shares at home', unit: '% of household-held shares, by wealth · Federal Reserve', draw() {
    const T = D.T, n = T.y.length - 1;
    reading('Concentrated: ', `the richest tenth held ${T.top10[0].toFixed(1)}% in 2000 and ${T.last[1].toFixed(1)}% in mid-2026.`); legend(phone() ? [[C.gold, 'Richest tenth'], [C.purple, 'Top 1%']] : []);
    lines({ x0: 2000, x1: 2026.5, y0: 0, y1: 100, yt: [0, 25, 50, 75, 100], xt: [2000, 2005, 2010, 2015, 2020, 2025], xtp: [2000, 2010, 2020], rpad: 146, vf: v => v.toFixed(1) + '%',
      aria: `Two lines, 2000 to mid-2026: the share of household-held US shares owned by the richest tenth of households (${T.top10[0]}% in 2000, ${T.last[1]}% in mid-2026) and by the top 1% (${T.top1[0]}% in 2000, ${T.last[2]}% in mid-2026).`,
      series: [{ name: 'top 1%', c: C.purple, pts: T.y.map((y, i) => [y, T.top1[i]]).concat([[2026.5, T.last[2]]]) }, { name: 'richest tenth', c: C.gold, w: 2.6, hi: 1, pts: T.y.map((y, i) => [y, T.top10[i]]).concat([[2026.5, T.last[1]]]) }],
      tip: x => { const i = Math.min(n, Math.max(0, Math.round(x) - 2000)), l = x > 2025.6; return [l ? 'Mid-2026' : 'End of ' + T.y[i], ['Richest tenth', (l ? T.last[1] : T.top10[i]).toFixed(1) + '%'], ['Top 1%', (l ? T.last[2] : T.top1[i]).toFixed(1) + '%']]; } });
  }, table: () => ({ cap: 'Share of corporate equities and mutual fund shares held by households, by wealth group, end of year (Federal Reserve, Distributional Financial Accounts). The richest tenth is the top 1% plus the next 9%, added here.', head: ['Year', 'Richest tenth, %', 'Top 1%, %'], rows: [['Mid-2026', D.T.last[1].toFixed(1), D.T.last[2].toFixed(1)]].concat(D.T.y.map((y, i) => [y, D.T.top10[i].toFixed(1), D.T.top1[i].toFixed(1)]).reverse()) }) };
  V.pay = { title: 'What the largest firms pay out', unit: 'S&P 500, $bn a year · S&P Dow Jones Indices', draw() {
    const P = D.S, n = P.y.length - 1;
    reading('2024: ', `${bn(P.div[n])} in dividends and ${bn(P.buy[n])} in buybacks. The 12 months to September 2025: ${bn(P.ttm[1])} and ${bn(P.ttm[2])} (preliminary).`);
    legend([[C.purple, 'Dividends', 1], [C.teal, 'Buybacks', 1]]);
    cols({ stack: 1, cats: P.y, series: [{ c: C.purple, vals: P.div }, { c: C.teal, vals: P.buy }], y0: 0, y1: 1800, yt: [0, 500, 1000, 1500], yf: v => String(v), everyP: 4, total: i => (i % 2 === 0 || i === n) ? '$' + Math.round(P.div[i] + P.buy[i]).toLocaleString('en-US') : '',
      aria: `Stacked columns, 2008 to 2024: dividends and share buybacks of the firms of the S&P 500, in billions of dollars. 2009: ${Math.round(P.div[1])} and ${Math.round(P.buy[1])}. 2024: ${Math.round(P.div[n])} and ${Math.round(P.buy[n])}.`,
      tip: i => [String(P.y[i]), ['Dividends', bn(P.div[i])], ['Buybacks', bn(P.buy[i])], ['Together', bn(P.div[i] + P.buy[i])]] });
  }, table: () => ({ cap: 'Dividends and share buybacks of the firms of the S&P 500, $bn (S&P Dow Jones Indices; 2008 to 2012 are sums of four quarters). Before 2008 and the full year 2025: not collected.', head: ['Year', 'Dividends', 'Buybacks', 'Together'], rows: [[D.S.ttm[0] + ', preliminary', D.S.ttm[1], D.S.ttm[2], (D.S.ttm[1] + D.S.ttm[2]).toFixed(1)]].concat(D.S.y.map((y, i) => [y, D.S.div[i], D.S.buy[i], (D.S.div[i] + D.S.buy[i]).toFixed(1)]).reverse()) }) };

  /* ---------- the regime and the order (stations 4 and 3) ---------- */
  const MOMENT = { 2000: r => `The federal budget was in surplus (${f1(r.fed)}% of GDP); net private investment carried profits.`, 2009: r => `Net private investment fell to ${f1(r.npi)}% of GDP; federal borrowing, ${f1(r.fed)}%, held profits up.`, 2020: r => `Federal borrowing reached ${f1(r.fed)}% of GDP; households saved ${f1(-r.hh)}%.`, 2025: r => `The federal deficit supplied ${f1(r.fed)} points, more than net private investment (${f1(r.npi)}).` };
  const dpt = v => (v < 0 ? '−' : '+') + Math.abs(v).toFixed(1);
  function eqReading() { const r = yr(); let t = `profits after tax ${f1(r.pat)}% of GDP. `; if (r.era) t += `Against ${r.a - 5}–${String(r.a - 1).slice(2)}: net private investment ${dpt(r.npi - r.npi0)} points, federal net borrowing ${dpt(r.fed - r.fed0)}, profits ${dpt(r.pat - r.pat0)}.`; else if (r.prov) t += 'Third-quarter profits are published on 25 Nov 2026.'; else if (MOMENT[r.y]) t += MOMENT[r.y](r); else t += phone() ? 'Drag the year, or pick a moment.' : 'Move over the chart, drag the year, or pick a moment.'; reading(r.era ? r.name + ', ' + r.label + ', average a year: ' : r.prov ? 'First half of 2026, provisional: ' : r.p + ': ', t); }
  function eqTiles() { const r = yr(); tiles([{ big: 1, op: '=', v: f1(r.pat) + '%', k: 'Profits after tax = the sum', d: r.era ? 'average, ' + r.label : r.prov ? 'first half of 2026, provisional' : r.p + ' · ' + bn(r.bn) }].concat(TERMS.map(([k]) => ({ op: r[k] < 0 ? '−' : '+', v: f1(r[k]), k: termLabel(k, r[k]), c: C[k] }))), true); }
  const eraChips = () => { R.chips.append(h('span', 'gap'), h('span', 'cl', 'Moments')); ERAS.forEach((e, i) => { const b = h('button', 'pf-chip', e[2]); b.type = 'button'; b.dataset.pe = i; b.title = e[3] + ', ' + span(e[0], e[1]); b.setAttribute('aria-label', e[3] + ', ' + span(e[0], e[1]) + ': its average against the five years before'); b.setAttribute('aria-pressed', String(!!S.era && S.era[0] === e[0])); R.chips.append(b); }); };
  /* the moments on a chart: a thin line at each, a faint band over a span, a short label on two rows; the picked one lit. x(y) gives a year's
     centre, w the width of one year. No labels on phones: the chips carry them. */
  const marks = (svg, x, w, top, hh) => { const ph = phone(); ERAS.forEach(([a, b, k], j) => { const on = !!S.era && S.era[0] === a, xa = x(a) - w / 2, xb = x(b) + w / 2;
    if (on) svg.append(el('rect', { x: xa, y: top, width: xb - xa, height: hh, fill: '#ffffff', opacity: .07 }));
    else if (b > a) svg.append(el('rect', { x: xa, y: top, width: xb - xa, height: hh, fill: '#ffffff', opacity: .022 }));
    svg.append(el('line', { x1: xa, x2: xa, y1: top, y2: top + hh, stroke: on ? C.ink : C.ink2, 'stroke-width': 1, 'stroke-dasharray': on ? null : '2 3', opacity: on ? .9 : .5 }));
    if (!ph) svg.append(el('text', { x: xa + 4, y: top + ([0, 1, 0, 1, 0, 0][j] ? 24 : 11), class: 'lb', fill: on ? C.ink : C.ink2, stroke: C.bg, 'stroke-width': 3, 'paint-order': 'stroke' }, k)); }); };
  const eqTable = () => ({ cap: 'What US profits after tax are made of, % of GDP (BEA national accounts, national basis; 4 Nov 2026). The first half of 2026 is provisional.', head: ['Year', 'Profits after tax', 'Net private investment', 'Federal net borrowing', 'Dividends', 'Household saving', 'Balance with the world', 'State and local borrowing', 'Government capital transfers', 'Discrepancy', 'Profits, $bn'], rows: [...B].reverse().map(r => [r.prov ? '2026, first half' : r.p, f2(r.pat), f2(r.npi), f2(r.fed), f2(r.div), f2(r.hh), f2(r.ca), f2(r.sl), f2(r.ct), f2(r.disc), r.bn.toLocaleString('en-US', { minimumFractionDigits: 1 })]) });
  const pickYear = (svg, W, x0, slot) => ev => { const bb = svg.getBoundingClientRect(), i = Math.max(0, Math.min(B.length - 1, Math.floor(((ev.clientX - bb.left) * (W / bb.width) - x0) / slot))); if (S.era || B[i].y !== S.year) { S.era = null; S.year = B[i].y; board(true); emit('year'); } };
  V.all = { title: 'Where US profits come from, every year since 1960', unit: '% of GDP · United States', scrub: 1, chips: eraChips, draw() {
    eqTiles(); eqReading();
    const fig = R.fig, W = fig.clientWidth, H = fig.clientHeight, ph = phone(), m = { l: ph ? 26 : 34, r: ph ? 8 : 150, t: 22, b: 20 }, pw = W - m.l - m.r, phh = H - m.t - m.b;
    const y0 = -16, y1 = 27, Y = v => m.t + (y1 - v) / (y1 - y0) * phh, slot = pw / B.length, Xs = i => m.l + slot * i + slot / 2, bw = Math.max(2, Math.min(14, slot - (slot > 6 ? 2 : 1.4)));
    const svg = svgOf(W, H, 'Stacked columns, one a year from 1960 to the first half of 2026, as a share of GDP. Above the zero line, what adds to US profits: net private investment, federal net borrowing, dividends. Below it, what takes from profits: household saving and the deficit with the world. The white line is profits after tax, the sum of all the bars. In 1960 to 1979 net private investment averaged 8.0% of GDP and federal borrowing 3.0%; in 2014 to 2025, 4.5% and 6.3%. Profits rose from 6.5% to 10.2% of GDP.');
    svg.append(el('rect', { x: m.l, y: Y(0), width: pw, height: Y(y0) - Y(0), fill: C.red, opacity: .045 }));
    for (let v = -15; v <= 25; v += 5) svg.append(el('line', { x1: m.l, x2: m.l + pw, y1: Y(v), y2: Y(v), stroke: v === 0 ? C.ink2 : '#17222d', 'stroke-width': v === 0 ? 1.4 : 1 }), el('text', { x: m.l - 6, y: Y(v) + 3.5, 'text-anchor': 'end' }, String(Math.abs(v))));
    svg.append(el('text', { x: m.l + 6, y: Y(25) + 4, class: 'lb', fill: C.ink }, '↑ Adds to profits, % of GDP'), el('text', { x: m.l + 6, y: Y(-15) + 4, class: 'lb', fill: C.ink }, '↓ Takes from profits, % of GDP'));
    B.forEach((r, i) => { if (!r.prov && r.y % 10 === 0 && !(ph && r.y % 20 !== 0)) svg.append(el('text', { x: Xs(i), y: H - 4, 'text-anchor': 'middle' }, String(r.y))); });
    marks(svg, y => Xs(y - 1960), slot, m.t, phh);
    const sel = i => S.era ? (B[i].y >= S.era[0] && B[i].y <= S.era[1] && !B[i].prov) : B[i].y === S.year;
    B.forEach((r, i) => {
      const g = el('g', { class: 'col', opacity: (sel(i) ? 1 : (S.era ? .3 : .55)) * (r.prov ? .6 : 1) }), pos = [], neg = []; let a = 0;
      if (r.npi > 0) pos.push(['npi', r.npi]); if (r.fed > 0) pos.push(['fed', r.fed]); pos.push(['div', r.div]); if (r.ca > 0) pos.push(['ca', r.ca]); if (r.rest > 0) pos.push(['rest', r.rest]);
      if (r.fed < 0) neg.push(['fed', r.fed]); neg.push(['hh', r.hh]); if (r.ca < 0) neg.push(['ca', r.ca]); if (r.rest < 0) neg.push(['rest', r.rest]);
      const bar = (k, ya, hh) => g.append(el('rect', { x: Xs(i) - bw / 2, y: ya + (hh > 3 ? 1 : 0), width: bw, height: Math.max(.6, hh - (hh > 3 ? 2 : 0)), rx: Math.min(1.5, bw / 3), fill: C[k] }));
      pos.forEach(([k, v]) => { bar(k, Y(a + v), Y(a) - Y(a + v)); a += v; }); a = 0; neg.forEach(([k, v]) => { bar(k, Y(a), Y(a + v) - Y(a)); a += v; });
      svg.append(g);
    });
    const pts = B.map((r, i) => Xs(i) + ',' + Y(r.pat)).join(' ');
    svg.append(el('polyline', { points: pts, fill: 'none', stroke: C.bg, 'stroke-width': 6, 'stroke-linejoin': 'round' }), el('polyline', { points: pts, fill: 'none', stroke: C.pat, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }));
    if (!S.era) { const i = B.findIndex(r => r.y === S.year), r = B[i]; svg.append(el('line', { x1: Xs(i), x2: Xs(i), y1: m.t - 6, y2: m.t + phh, stroke: C.lab, 'stroke-width': 1, opacity: .7 }), el('circle', { cx: Xs(i), cy: Y(r.pat), r: 4.5, fill: C.pat, stroke: C.bg, 'stroke-width': 2 }), el('text', { x: Math.min(Math.max(Xs(i), m.l + 30), m.l + pw - 30), y: m.t - 8, 'text-anchor': 'middle', class: 'lb', fill: C.lab }, r.prov ? 'H1 2026' : String(r.y))); }
    if (!ph) { const lr = B[B.length - 1], x = m.l + pw + 10; svg.append(el('line', { x1: x, x2: x + 12, y1: Y(lr.pat), y2: Y(lr.pat), stroke: C.pat, 'stroke-width': 2.4 }), el('text', { x: x + 18, y: Y(lr.pat) - 2, class: 'lb', fill: C.ink }, 'Profits after tax'), el('text', { x: x + 18, y: Y(lr.pat) + 12, class: 'lb' }, 'the sum of the bars')); }
    const hit = el('rect', { x: m.l, y: 0, width: pw, height: H, fill: 'transparent', style: 'cursor:crosshair' }), pick = pickYear(svg, W, m.l, slot);
    hit.addEventListener('pointermove', ev => { if (ev.pointerType === 'mouse' && !S.era) pick(ev); }); hit.addEventListener('pointerdown', pick);
    svg.append(hit); fig.append(svg);
  }, table: eqTable };
  /* One year (patch of 18 Nov, as in the preview): the bridge on top, then every term of the sum as its own line since 1960, the main
     chart: full width, each term switchable, profits on top. The year moves both. On phones a tap opens the lines full screen. */
  const LT = [['npi', 'Net private investment'], ['fed', 'Federal net borrowing'], ['div', 'Dividends'], ['rest', 'State and local, other'], ['hh', 'Household saving', 1], ['ca', 'Balance with the world', 1]];
  let BEXT = null;
  const bext = () => { if (BEXT) return BEXT; let lo = 0, hi = 0; B.forEach(r => { let run = 0; TERMS.forEach(([k]) => { run += r[k]; lo = Math.min(lo, run); hi = Math.max(hi, run); }); }); return (BEXT = [Math.floor(lo) - 1, Math.ceil(hi) + 2]); };
  /* the lines: shared by the board and the full-screen view */
  function termLines(svg, W, H, o) {
    const ph = phone(), m = { l: 34, r: o.zoom || ph ? 12 : 128, t: 18, b: 22 }, Bf = B.filter(r => !r.prov), n = Bf.length, pw = W - m.l - m.r, phh = H - m.t - m.b, lo = -14, hi = 16;
    const Xs = i => m.l + pw * i / (n - 1), Y = v => m.t + (hi - v) / (hi - lo) * phh;
    for (let t = -10; t <= 15; t += 5) svg.append(el('line', { x1: m.l, x2: m.l + pw, y1: Y(t), y2: Y(t), stroke: t === 0 ? C.ink2 : '#17222d', 'stroke-width': t === 0 ? 1.4 : 1 }), el('text', { x: m.l - 6, y: Y(t) + 3.5, 'text-anchor': 'end' }, String(Math.abs(t))));
    svg.append(el('text', { x: m.l + 6, y: Y(lo) - 6, class: 'lb' }, 'below the line: takes from profits, % of GDP'));
    const every = W > 1500 ? 5 : W > 760 ? 10 : 20; Bf.forEach((r, i) => { if (r.y % every === 0) svg.append(el('text', { x: Xs(i), y: H - 5, 'text-anchor': 'middle' }, String(r.y))); });
    const path = k => Bf.map((r, i) => Xs(i).toFixed(1) + ',' + Y(r[k]).toFixed(1)).join(' ');
    LT.forEach(([k]) => { if (S.terms[k]) svg.append(el('polyline', { points: path(k), fill: 'none', stroke: C[k], 'stroke-width': 2, 'stroke-linejoin': 'round', opacity: .92 })); });
    svg.append(el('polyline', { points: path('pat'), fill: 'none', stroke: C.bg, 'stroke-width': 7, 'stroke-linejoin': 'round' }), el('polyline', { points: path('pat'), fill: 'none', stroke: C.pat, 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    marks(svg, y => Xs(y - 1960), pw / (n - 1), m.t, phh);   /* after the lines, so the labels stay readable */
    if (!o.zoom && !ph) { const lr = Bf[n - 1]; svg.append(el('text', { x: Xs(n - 1) + 10, y: Y(lr.pat) - 1, class: 'lb', fill: C.ink }, 'Profits after tax'), el('text', { x: Xs(n - 1) + 10, y: Y(lr.pat) + 13, class: 'lb' }, 'the sum')); }
    if (!S.era) { const i = Math.min(n - 1, Math.max(0, S.year - 1960)), r = Bf[i]; svg.append(el('line', { x1: Xs(i), x2: Xs(i), y1: m.t, y2: m.t + phh, stroke: C.lab, 'stroke-width': 1, opacity: .8 }));
      LT.forEach(([k]) => { if (S.terms[k]) svg.append(el('circle', { cx: Xs(i), cy: Y(r[k]), r: 3.5, fill: C[k], stroke: C.bg, 'stroke-width': 1.5 })); }); svg.append(el('circle', { cx: Xs(i), cy: Y(r.pat), r: 4.5, fill: C.pat, stroke: C.bg, 'stroke-width': 2 }));
      svg.append(el('text', { x: Math.min(Math.max(Xs(i), m.l + 24), m.l + pw - 24), y: m.t + phh + 0, 'text-anchor': 'middle', class: 'lb', fill: C.lab, dy: -4 }, S.year === 2026 ? '2025' : String(r.y))); }
    return { pick: ev => { const bb = svg.getBoundingClientRect(), i = Math.max(0, Math.min(n - 1, Math.round(((ev.clientX - bb.left) * (W / bb.width) - m.l) / pw * (n - 1)))); return Bf[i].y; } };
  }
  V.sum = { title: 'Where US profits come from, one year at a time', unit: '% of GDP · United States', scrub: 1, chips: eraChips, draw() {
    eqReading();
    const fig = R.fig, W = fig.clientWidth, H = fig.clientHeight, ph = phone(), r = yr(), wrap = h('div', 'pf-oy'), hb = Math.round(Math.max(118, Math.min(190, H * .3)));
    /* the bridge: what adds, what takes, and the sum */
    const [lo, hi] = bext(), items = TERMS.map(([k]) => [k, r[k]]), n = items.length + 1, mb = { l: 8, r: 8, t: 22, b: ph ? 30 : 34 }, bw = (W - mb.l - mb.r) / n, Y = v => mb.t + (hb - mb.t - mb.b) * (hi - v) / (hi - lo);
    const s1 = svgOf(W, hb, `The profit equation for ${r.era ? r.label + ', average' : r.prov ? 'the first half of 2026' : r.p}, as a share of GDP: net private investment ${f1(r.npi)}, federal net borrowing ${r.fed < 0 ? 'minus ' : ''}${f1(r.fed)}, dividends ${f1(r.div)}, state and local borrowing, transfers and discrepancy ${r.rest < 0 ? 'minus ' : ''}${f1(r.rest)}, household saving minus ${f1(-r.hh)}, the balance with the world ${r.ca < 0 ? 'minus ' : ''}${f1(r.ca)}; profits after tax ${f1(r.pat)}.`);
    s1.setAttribute('class', 'oy-b'); s1.style.height = hb + 'px';
    const defs = el('defs'), pat = el('pattern', { id: 'isx-pf-hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }); pat.append(el('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: C.bg, 'stroke-width': 2, opacity: .55 })); defs.append(pat); s1.append(defs);
    s1.append(el('line', { x1: mb.l, x2: W - mb.r, y1: Y(0), y2: Y(0), stroke: '#5d6f7e', 'stroke-width': 1 }));
    let run = 0;
    items.concat([['pat', r.pat]]).forEach(([k, v], i) => {
      const tot = k === 'pat', a = tot ? 0 : run, b = tot ? v : run + v, x0 = mb.l + i * bw + bw * .16, w = Math.min(bw * .68, 150), xc = mb.l + i * bw + bw / 2, x = xc - w / 2, top = Y(Math.max(a, b)), hh = Math.max(1.5, Math.abs(Y(a) - Y(b)));
      s1.append(el('rect', { x, y: top, width: w, height: hh, rx: 3, fill: tot ? C.pat : C[k] }));
      if (!tot && v < 0) s1.append(el('rect', { x: x + 1, y: top + 1, width: Math.max(0, w - 2), height: Math.max(0, hh - 2), rx: 2, fill: 'url(#isx-pf-hatch)' }));
      s1.append(el('text', { x: xc, y: top - 6, 'text-anchor': 'middle', class: 'lv' }, tot ? '= ' + f1(v) + '%' : (v < 0 ? '−' : '+') + f1(v)));
      const nm = tot ? (ph ? 'Profits' : 'Profits after tax') : ph ? { npi: 'Invest.', fed: 'Federal', div: 'Divid.', rest: 'Other', hh: 'Saving', ca: 'World' }[k] : termLabel(k, v);
      s1.append(el('text', { x: xc, y: hb - mb.b + 16, 'text-anchor': 'middle', class: 'lb', fill: tot ? C.ink : C.ink2 }, nm));
      if (!tot && v < 0 && !ph) s1.append(el('text', { x: xc, y: hb - mb.b + 30, 'text-anchor': 'middle' }, 'takes from profits'));
      if (!tot) { run = b; if (i < items.length) s1.append(el('line', { x1: x + w, x2: x + bw, y1: Y(b), y2: Y(b), stroke: '#5d6f7e', 'stroke-width': 1, 'stroke-dasharray': '2 2' })); }
    });
    /* the terms: each a switch, and the key to the lines */
    const tr = h('div', 'pf-terms'); tr.setAttribute('role', 'group'); tr.setAttribute('aria-label', 'Lines shown');
    const pb = h('span', 'pt on'); const pi = h('i'); pi.style.background = C.pat; pb.append(pi, 'Profits after tax, the sum'); tr.append(pb);
    LT.forEach(([k, nm, takes]) => { const b = h('button', 'pt'); b.type = 'button'; b.dataset.pt = k; b.setAttribute('aria-pressed', String(!!S.terms[k])); const i = h('i'); i.style.background = C[k]; b.append(i, nm + (takes ? ' (takes)' : '')); tr.append(b); });
    wrap.append(s1, tr); fig.append(wrap);
    const zb = ph ? h('button', 'pf-zoomb', 'Open full screen ⤢') : null; if (zb) { zb.type = 'button'; zb.dataset.pf = 'zoom'; wrap.append(zb); }
    const hl = Math.max(170, H - hb - tr.offsetHeight - (zb ? zb.offsetHeight + 8 : 0) - 14);
    const s2 = svgOf(W, hl, 'Every term of the profit equation as a line, one point a year from 1960 to 2025, as a share of GDP; the white line on top is profits after tax, the sum. Net private investment falls from about 8% of GDP in the 1960s and 1970s to about 4.5% since 2014; federal net borrowing rises from about 3% to 6.3%, with peaks of 10.2% in 2009 and 14.4% in 2020; household saving and the deficit with the world lie below the line. Profits rise from 6.5% to 10.2% of GDP.');
    s2.setAttribute('class', 'oy-l'); s2.style.height = hl + 'px';
    const L = termLines(s2, W, hl, {}), hit = el('rect', { x: 0, y: 0, width: W, height: hl, fill: 'transparent', style: 'cursor:crosshair' });
    const pick = ev => { const yv = L.pick(ev); if (S.era || yv !== S.year) { S.era = null; S.year = yv; board(true); emit('year'); } };
    hit.addEventListener('pointermove', ev => { if (ev.pointerType === 'mouse' && !S.era) pick(ev); });
    hit.addEventListener('pointerdown', ev => { if (ph && ev.pointerType !== 'mouse') return; pick(ev); });
    hit.addEventListener('click', ev => { if (ph) zoomOpen(zb); });
    s2.append(hit);
    if (zb) wrap.insertBefore(s2, zb); else wrap.append(s2);
  }, table: eqTable };
  /* the lines, full screen (phones): scroll along the years, zoom, tap a year */
  let Z = null;
  function zoomDraw() {
    if (!Z) return; const sc = Z.el.querySelector('.pz-sc'), svg = Z.el.querySelector('svg'), W = Math.round(window.innerWidth * Z.k), H = Math.max(240, sc.clientHeight - 6);
    svg.textContent = ''; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.style.width = W + 'px'; svg.style.height = H + 'px';
    const L = termLines(svg, W, H, { zoom: 1 }), hit = el('rect', { x: 0, y: 0, width: W, height: H, fill: 'transparent' });
    hit.addEventListener('click', ev => { S.era = null; S.year = L.pick(ev); zoomDraw(); }); svg.append(hit);
    const r = yr(); Z.el.querySelector('.pz-y').textContent = (r.prov ? 'First half of 2026' : r.p) + ' · profits ' + f1(r.pat) + '% of GDP';
  }
  function zoomOpen(from) {
    if (Z) return;
    const e = h('div', 'pf-zoom'); e.id = 'isx-pf-zoom'; e.setAttribute('role', 'dialog'); e.setAttribute('aria-modal', 'true'); e.setAttribute('aria-label', 'Every term since 1960, full screen');
    e.innerHTML = '<div class="pz-bar"><div class="pz-t"><b>Every term since 1960 · % of GDP</b><span class="pz-y" aria-live="polite"></span></div><button type="button" data-pz="out" aria-label="Zoom out">−</button><button type="button" data-pz="in" aria-label="Zoom in">+</button><button type="button" data-pz="x">Close</button></div><div class="pz-sc" tabindex="0" role="region" aria-label="The chart: scroll sideways along the years"><svg role="img" aria-label="Every term of the profit equation as a line, 1960 to 2025, as a share of GDP. Tap a year to select it."></svg></div>';
    root.appendChild(e); Z = { el: e, k: 2.4, from: from || null }; document.documentElement.classList.add('isx-pzlock');
    e.addEventListener('click', ev => { const b = ev.target.closest('[data-pz]'); if (!b) return; if (b.dataset.pz === 'x') { zoomClose(); return; } const sc = e.querySelector('.pz-sc'), c = (sc.scrollLeft + sc.clientWidth / 2) / sc.scrollWidth; Z.k = Math.max(1, Math.min(6, Z.k * (b.dataset.pz === 'in' ? 1.4 : 1 / 1.4))); zoomDraw(); sc.scrollLeft = c * sc.scrollWidth - sc.clientWidth / 2; });
    e.addEventListener('keydown', ev => { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); zoomClose(); } });
    zoomDraw(); const sc = e.querySelector('.pz-sc'); sc.scrollLeft = sc.scrollWidth;
    const wrap = root.querySelector(':scope > .wrap'); if (wrap) wrap.inert = true;
    e.querySelector('[data-pz="x"]').focus({ preventScroll: true });
  }
  function zoomClose() {
    if (!Z) return; const z = Z; Z = null; if (z.el.parentNode) z.el.parentNode.removeChild(z.el); document.documentElement.classList.remove('isx-pzlock');
    const wrap = root.querySelector(':scope > .wrap'); if (wrap) wrap.inert = false;
    if (X.view === 'profit' && D && !cur().fin) board(true);
    const f = host.querySelector('.pf-zoomb') || z.from; if (f && f.isConnected) f.focus({ preventScroll: true });
  }

  /* ---------- station 3 · The order: the orbit view (stage 2, 18 Nov 2026; spec profit-tab-v4 §4, addendum §1 and §2) ----------
     World-systems tiers as orbits, polarity as two systems. One toggle, two states: the WTO order (one system, the old core with the US
     at the centre, China on the assembly orbit) and Pax Silica (two systems; the US alone at its centre; the bodies on both lists in
     the overlap between them). Radius is the tier, angle the role in the chain. Drawn from data/orbit.json (tools/orbit-data.py, from
     claude/data/orbit/O1-countries.csv), so the list grows with the research. The bodies keep their elements and move between the
     states. Flow colours and words are the Circuit's: rents (pink), goods (cyan) and ores (green), the surplus recycled (amber). */
  let O = null, OSEL = null;
  const OC = { pax: '#ffb547', cn: '#e2574c', mute: '#8fa3b6', rent: '#ff5d8f', goods: '#44d7ec', mat: '#b7f36b', dollar: '#ffb547' };
  const OST = { wto: ['The WTO order', '1995–', 'One ladder, everyone inside: ', 'the old core sits with the US at the centre, China joins on the assembly orbit in 2001, and the rents are protected by treaty.'],
    ps: ['Pax Silica', '2025–', 'A curtain and a smaller inside: ', 'the US stands alone at its centre and the old core becomes its privileged producers; China’s system holds the WAICO members; the bodies on both lists sit in the overlap.'] };
  const OCARD = { wto: [['Who is let in', 'Everyone, in ranks. China joins in 2001 and becomes the assembly floor.'], ['How rents are protected', 'By treaty: TRIPS, ratified by parliaments, enforced through dispute settlement.'], ['The old core', 'Japan, the United Kingdom and the EU sit beside the US at the centre.'], ['The promise', 'Rich countries move up the value chain; the rest make the cheap goods.']],
    ps: [['Who is let in', 'Signatories only. Inside is a privilege: access to the full stack, in return for alignment.'], ['How rents are protected', 'By leverage: export controls and licences set in Washington, outside the text.'], ['The old core', 'Now privileged producers: subservient but benefited, around a US that stands alone.'], ['The other bloc', 'China’s system: the members of WAICO. Kazakhstan has signed both.']] };
  const OLAY = [['pax', 'Pax Silica', b => !!b.mem.p || !!b.mem.t, O => O.counts.pax + ' signatories by 23 Oct 2026, the EU among them; Taiwan takes part without signing.'],
    ['ai', 'AI statement', b => !!b.mem.a, O => 'Joint Statement on AI Opportunity: ' + O.counts.ai + ' signatories on 25 Jun 2026 and ' + O.counts.ai_sep + ' more in September, of which 15 are not named in the sources read. Pax Silica lies inside it.'],
    ['waico', 'WAICO', b => !!b.mem.w, O => O.counts.waico + ' founders on 16 Jul 2026 and ' + O.counts.waico_later + ' later members, two of them not named in the sources read.'],
    ['brics', 'BRICS', b => !!b.mem.b || !!(b.bm && b.bm.length), O => O.counts.brics + ' members and ' + O.counts.brics_partner + ' partners; Saudi Arabia was invited in 2023 and is shown as contested.'],
    ['eu', 'EU', b => !!b.mem.e || b.full === 'European Union', () => 'The EU signed Pax Silica as one institution on 23 Jun 2026; its members sit on different orbits.'],
    ['treaty', 'US security treaties', b => !!b.mem.s, () => 'NATO, the Rio Treaty and the bilateral treaties with Japan, South Korea, the Philippines, Australia and Thailand.']];
  const OSO = [0, 4, 1, 2, 3, 5];   /* the sectors, clockwise from the top */
  /* the spoken name of a body holds the name drawn beside it (UK, United Kingdom); a group made of several rows is named as the group */
  const oName = b => { const lab = b.sys === 'core' ? (b.full === 'China' ? 'China' : 'US') : b.n, name = b.k === 'g' && b.members ? b.n : b.full, cnt = b.m ? ' (' + b.m + ')' : ''; return (name.toLowerCase().indexOf(lab.toLowerCase()) < 0 ? lab + ', ' + name : name) + cnt; };
  const oSys = b => b.sys === 'core' ? (b.full === 'China' ? 'cn' : 'us') : b.sys;
  function orbLayout(W, H, ph) {
    const top = ph ? 8 : 78, sysH = ph ? Math.min(300, H - top) : H - top, cy = top + sysH / 2, Ry = sysH / 2 - (ph ? 16 : 22),   /* phones: the system on top, the overlap listed under it */ F = [.3, .47, .65, .83, 1], P = {}, ell = [], secs = [];
    const spread = (list, cx, cyy, rx, ry, a0, a1, fRing) => {   /* bodies of one sector on their orbits, between two angles */
      const by = {}; list.forEach(b => { (by[fRing(b)] = by[fRing(b)] || []).push(b); });
      Object.keys(by).forEach(k => { const g = by[k], n = g.length, f = F[k], st = n > 9 ? 3 : n > 4 ? 2 : 1;
        g.forEach((b, i) => { const a = a0 + (a1 - a0) * (i + .5) / n, off = st === 3 ? [-.085, 0, .085][i % 3] : st === 2 ? [-.05, .05][i % 2] : 0, rad = a * Math.PI / 180;
          P[b.id + (fRing === wr ? 'w' : 'p')] = { x: cx + rx * (f + off) * Math.sin(rad), y: cyy - ry * (f + off) * Math.cos(rad), side: Math.sin(rad) >= 0 ? 1 : -1, a }; }); });
    };
    const wr = b => b.wring, pr = b => b.ring;
    const system = (state, list, cx, rx, ry, lo, hi, fRing, fSec, label) => {   /* one solar system: sectors share the free arc by their weight */
      const cnt = OSO.map(s => list.filter(b => fSec(b) === s).length), tot = cnt.reduce((a, c) => a + (c ? Math.max(c, 2.2) : 0), 0); let a = lo;
      OSO.forEach((s, i) => { if (!cnt[i]) return; const span = (hi - lo) * Math.max(cnt[i], 2.2) / tot; spread(list.filter(b => fSec(b) === s), cx, cy, rx, ry, a + span * .06, a + span * .94, fRing);
        const m = (a + span / 2) * Math.PI / 180; secs.push({ state, t: O.sectors[s], x: cx + rx * 1.13 * Math.sin(m), y: cy - ry * 1.13 * Math.cos(m) + 3, side: Math.sin(m) >= 0 ? 1 : -1, a0: a, cx, rx, ry }); a += span; });
      [1, 2, 3, 4].forEach(k => ell.push({ state, cx, cy, rx: rx * F[k], ry: ry * F[k], k })); if (label) ell.push({ state, cx, cy, label });
    };
    const B = O.B, us = B.find(b => b.sys === 'core' && b.full !== 'China'), cn = B.find(b => b.full === 'China');
    /* the WTO order: one system */
    const RXw = Math.min(W / 2 - (ph ? 34 : 170), Ry * 3);
    system('wto', B.filter(b => b !== us), W / 2, RXw, Ry, 0, 360, wr, b => b.wsec);
    P[us.id + 'w'] = { x: W / 2, y: cy, side: 1, c: 1 };
    /* Pax Silica: two systems and the overlap between them */
    const one = ph, urx = one ? W / 2 - 34 : Math.min((W - 620) * .29, Ry * 2.4), crx = one ? W / 2 - 34 : Math.min((W - 620) * .21, Ry * 1.8), mid = one ? W / 2 : 140 + 2 * urx + 170, ucx = one ? W / 2 : 140 + urx, ccx = one ? W / 2 : mid + 170 + crx;   /* room for the names: 140 px at each end, 150 px on each side of the overlap */
    system('ps', B.filter(b => b.sys === 'us'), ucx, urx, Ry, one ? 0 : 128, one ? 360 : 412, pr, b => b.sec, 'us');   /* the side that faces the other system stays free */
    system('ps', B.filter(b => b.sys === 'cn'), ccx, crx, Ry, one ? 0 : -52, one ? 360 : 232, pr, b => b.sec, 'cn');
    P[us.id + 'p'] = { x: ucx, y: cy, side: 1, c: 1 }; P[cn.id + 'p'] = { x: ccx, y: cy, side: 1, c: 1 };
    const both = B.filter(b => b.sys === 'both').sort((a, b) => a.sec - b.sec), rest = B.filter(b => b.sys === 'swing' || b.sys === 'open').sort((a, b) => (a.sys > b.sys ? -1 : a.sys < b.sys ? 1 : a.sec - b.sec));
    const col = (list, y0, y1) => { const rows = Math.ceil(list.length / 2), dy = Math.min(22, (y1 - y0) / Math.max(1, rows)); list.forEach((b, i) => { const r = Math.floor(i / 2), sd = i % 2 ? 1 : -1; P[b.id + 'p'] = ph ? { x: (i % 2 ? W * .53 : W * .04) + 8, y: y0 + dy * (r + .5), side: 1, mid: 1 } : { x: mid + sd * 20, y: y0 + dy * (r + .5), side: sd, mid: 1 }; }); return y0 + dy * rows; };
    const m0 = ph ? top + sysH + 34 : top + 22, m1 = ph ? H - 6 : H - 22, split = m0 + (m1 - m0) * both.length / Math.max(1, both.length + rest.length + 2);
    col(both, m0, split); col(rest, split + (m1 - m0) * 2 / (both.length + rest.length + 2), m1);
    return { P, ell, secs, cy, top, mid, split, m0, m1, us, cn, ucx, ccx };
  }
  function orbInfo(b) {
    const box = R.fig.querySelector('.pf-orbi'); if (!box) return; box.textContent = '';
    if (!b) { box.append(h('p', 'oh', (phone() ? 'Tap' : 'Move over or select') + ' a body for its role, its memberships and one dated figure.')); return; }
    const ps = S.ord === 'ps', where = b.sys === 'core' ? 'Centre of ' + (b.full === 'China' ? (ps ? 'the second system' : 'no system yet: on the assembly orbit, from 2001') : 'the system') : !ps ? 'Inside the one system' : { us: b.mem.p ? 'US system · inside Pax Silica' : b.mem.t ? 'US system · takes part in Pax Silica without signing' : 'US system · outside Pax Silica', cn: 'China’s system', both: 'In the overlap of both systems', swing: 'On neither list', open: 'Between the systems · ownership not researched' }[b.sys];
    box.append(h('span', 'k', where + ' · ' + (b.sys === 'core' ? 'IP and finance' : O.sectors[ps ? b.sec : b.wsec]))); box.append(h('b', '', b.k === 'g' && b.m ? b.n + ' (' + b.m + ')' : b.full));
    if (b.role) box.append(h('p', '', b.role + (/^GAP/.test(b.st) && !/not collected/.test(b.role) ? ' (no dated source collected yet)' : '') + (b.more && b.more.length ? ' Also: ' + b.more.join(', ') + '.' : '')));
    if (!ps && b.wnote) box.append(h('p', '', 'In the WTO order: ' + b.wnote + '.'));
    if (b.fig) box.append(h('p', 'fg', b.fig.replace(/^./, c => c.toUpperCase()) + '.'));
    if (b.own && !/^not researched$|^mixed, not collected$/.test(b.own)) box.append(h('p', '', 'Mines: ' + b.own + '.' + (b.flags ? ' ' + b.flags.replace(/^./, c => c.toUpperCase()) + '.' : '')));
    const mem = [b.mem.p ? 'Pax Silica, ' + b.mem.p : '', b.mem.t ? 'Pax Silica participant, not a signatory (27 Jan 2026)' : '', b.mem.a ? 'AI statement, ' + b.mem.a.replace(/\s*\(.*$/, '') : '', b.mem.w ? 'WAICO, ' + b.mem.w.replace(/\s*\(.*$/, '') : '', b.mem.b ? 'BRICS, ' + b.mem.b.replace(/\s*\(.*$/, '') : '', b.mem.e ? 'EU member' : '', b.mem.s ? b.mem.s.split(',')[0].replace(/\s*\(.*$/, '') : ''].filter(Boolean);
    box.append(h('p', 'ml', mem.length ? mem.join(' · ') : 'On none of the lists read.'));
    if (b.members) box.append(h('p', 'ml', b.members.join(', ') + '.'));
    if (b.full === 'Germany' || b.n === 'Germany') { const a = h('button', 'pf-quiet', 'German hypocrisy →'); a.type = 'button'; a.dataset.pv = 'hyp'; box.append(a); }   /* OB2: Germany’s card links to the joke view */
  }
  function orbPlace(L, instant) {
    const svg = R.fig.querySelector('svg.pf-orbs'); if (!svg) return; const ps = S.ord === 'ps', ph = phone(), lay = OLAY.find(l => l[0] === S.lay);
    svg.classList.toggle('ps', ps); svg.classList.toggle('wto', !ps); svg.classList.toggle('flows', !!S.flows); svg.classList.toggle('now', !!instant);
    O.B.forEach(b => { const g = svg.querySelector('[data-ob="' + b.id + '"]'), p = L.P[b.id + (ps ? 'p' : 'w')]; if (!g) return;
      const hide = !p || (ps && ph && !p.mid && oSys(b) !== S.sys && b.sys !== 'core') || (ps && ph && b.sys === 'core' && oSys(b) !== S.sys);
      g.style.transform = p ? 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px)' : ''; g.classList.toggle('off', !!hide); g.classList.toggle('dim', !!lay && !lay[2](b)); g.classList.toggle('sel', OSEL === b.id);
      const t = g.querySelector('text'); if (t && p) { const r = p.c ? 0 : 9; t.setAttribute('x', p.c ? 0 : p.side * r); t.setAttribute('text-anchor', p.c ? 'middle' : p.side > 0 ? 'start' : 'end'); t.setAttribute('y', p.c ? 4 : 3.5); t.classList.toggle('quiet', ph && !p.mid && !p.c && (ps ? b.ring : b.wring) > 2 && OSEL !== b.id); }
      if (hide) g.setAttribute('aria-hidden', 'true'); else g.removeAttribute('aria-hidden'); g.setAttribute('tabindex', hide ? -1 : 0); });
    /* names: a name that would run into one already placed stays quiet until its body is selected (the centres, the overlap and the signatories come first) */
    { const rank = b => b.sys === 'core' ? 0 : OSEL === b.id ? 1 : (L.P[b.id + 'p'] || {}).mid && ps ? 2 : b.mem.p || b.mem.t ? 3 : b.k === 'c' && !/^GAP/.test(b.st) ? 4 : b.k === 'c' ? 5 : 6, put = [], hits = r => put.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]);
      O.B.forEach(b => { const p = L.P[b.id + (ps ? 'p' : 'w')]; if (p) put.push(p.c ? [p.x - 20, p.y - 20, p.x + 20, p.y + 20] : [p.x - 6, p.y - 6, p.x + 6, p.y + 6]); });
      L.secs.filter(q => q.state === S.ord).forEach(q => { const w = q.t.length * 7.4; put.push(q.side > 0 ? [q.x, q.y - 9, q.x + w, q.y + 4] : [q.x - w, q.y - 9, q.x, q.y + 4]); });
      O.B.slice().sort((a, b) => rank(a) - rank(b)).forEach(b => { const p = L.P[b.id + (ps ? 'p' : 'w')], t = svg.querySelector('[data-ob="' + b.id + '"] text'); if (!p || !t || p.c) return;
        const w = t.textContent.length * 6 + 6, box = sd => { const x0 = sd > 0 ? p.x + 8 : p.x - 8 - w; return [x0, p.y - 6.5, x0 + w, p.y + 6.5]; };
        let sd = p.side, hit = (ph && !p.mid && (ps ? b.ring : b.wring) > 2) || hits(box(sd)); if (hit && !p.mid && !(ph && (ps ? b.ring : b.wring) > 2) && !hits(box(-sd))) { sd = -sd; hit = false; }
        t.setAttribute('x', sd * 9); t.setAttribute('text-anchor', sd > 0 ? 'start' : 'end');
        t.classList.toggle('quiet', hit && OSEL !== b.id); if (!hit || OSEL === b.id) put.push(box(sd)); }); }
    const st = R.fig.querySelector('.pf-orbc'); if (st) st.innerHTML = OCARD[S.ord].map(c => '<div><b>' + esc(c[0]) + '</b>' + esc(c[1]) + '</div>').join('');
    reading(lay ? lay[1] + ': ' : OST[S.ord][2], lay ? lay[3](O) : OST[S.ord][3]);
    host.querySelectorAll('[data-po]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.po === S.ord)));
    const scw = R.fig.querySelector('.pf-orbsc'); if (scw) scw.style.maxHeight = ph && !ps ? Math.round(322 * S.oz) + 'px' : '';
    const sw = R.fig.querySelector('.pf-orbsys'); if (sw) { sw.hidden = !(ps && ph); sw.querySelectorAll('[data-ps]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ps === S.sys))); }
    orbInfo(OSEL ? O.B.find(b => b.id === OSEL) : null);
  }
  V.orb = { title: () => S.ord === 'ps' ? 'Two systems and the overlap between them' : 'One system: everyone inside, in ranks', unit: 'Orbit: tier · Angle: role in the chain · Schematic', chips() {
      const seg = h('div', 'pf-orbt'); seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'The order'); ['wto', 'ps'].forEach(o => { const b = h('button', '', OST[o][0] + ' · ' + OST[o][1]); b.type = 'button'; b.dataset.po = o; b.setAttribute('aria-pressed', String(S.ord === o)); seg.append(b); }); R.chips.append(seg, h('span', 'gap'));
      R.chips.append(h('span', 'cl', 'Layers')); OLAY.forEach(([k, t]) => { const b = h('button', 'pf-chip', t); b.type = 'button'; b.dataset.pl = k; b.setAttribute('aria-pressed', String(S.lay === k)); R.chips.append(b); });
      R.chips.append(h('span', 'gap')); const f = h('button', 'pf-chip', 'Show the flows'); f.type = 'button'; f.dataset.pf = 'flows'; f.setAttribute('aria-pressed', String(!!S.flows)); R.chips.append(f); },
    draw() {
      if (!O) { reading('', 'Loading the orbits.'); if (!V.orb.busy) { V.orb.busy = 1; X.load('orbit').then(d => { O = d; if (X.view === 'profit' && vw() === 'orb') board(true); }).catch(() => reading('', 'The orbits could not be loaded. Reload the page to try again.')); } return; }
      const fig = R.fig, ph = phone(), W = fig.clientWidth, H = ph ? 640 : Math.max(360, fig.clientHeight - 72), k = ph ? S.oz : 1, L = orbLayout(W * k, H * k, ph), n = O.B.length;
      const wrap = h('div', 'pf-orb'); wrap.setAttribute('role', 'group'); wrap.setAttribute('aria-label', `The order as orbits, in two states. The WTO order, from 1995: one system with the United States at the centre and the old core, Japan, the United Kingdom and the European Union, beside it; China on the assembly orbit from 2001; every other economy on an orbit by its role in the chain: tools and chips innermost, then assembly, sites and energy, then minerals, and at the edge the economies whose role is not collected. Pax Silica, from 2025: two systems. The United States alone at the centre of its own, with ${O.counts.pax} signatories and Taiwan as a participant; China at the centre of the second, with the members of WAICO; ${O.B.filter(b => b.sys === 'both').map(b => b.n).join(', ')} in the overlap; ${O.B.filter(b => b.sys === 'swing' && b.k === 'c').map(b => b.n).join(', ')} on neither list. ${n} bodies in all; the table view lists each.`);
      const sysw = h('div', 'pf-orbsys'); sysw.setAttribute('role', 'group'); sysw.setAttribute('aria-label', 'Which system'); [['us', 'US system'], ['cn', 'China’s system']].forEach(([s, t]) => { const b = h('button', '', t); b.type = 'button'; b.dataset.ps = s; sysw.append(b); });
      const strip = h('div', 'pf-orbc'), info = h('aside', 'pf-orbi'); info.setAttribute('aria-live', 'polite'); info.setAttribute('aria-label', 'The selected body'); info.tabIndex = 0;
      if (ph) { strip.tabIndex = 0; strip.setAttribute('role', 'group'); strip.setAttribute('aria-label', 'What defines this order'); }
      const sc = h('div', 'pf-orbsc'), svg = el('svg', { viewBox: `0 0 ${Math.round(W * k)} ${Math.round(H * k)}`, class: 'pf-orbs', 'aria-hidden': 'false' }); svg.style.width = Math.round(W * k) + 'px'; svg.style.height = Math.round(H * k) + 'px';
      const defs = el('defs'); [['rent', OC.rent], ['goods', OC.goods], ['mat', OC.mat], ['dollar', OC.dollar]].forEach(([id, c]) => { const m = el('marker', { id: 'isx-orb-' + id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }); m.append(el('path', { d: 'M1 1L9 5L1 9', fill: 'none', stroke: c, 'stroke-width': 1.6 })); defs.append(m); }); svg.append(defs);
      ['wto', 'ps'].forEach(state => { const g = el('g', { class: 'os ' + state });
        L.ell.filter(e => e.state === state && e.k).forEach(e => g.append(el('ellipse', { cx: e.cx, cy: e.cy, rx: e.rx, ry: e.ry, fill: 'none', stroke: e.k === 4 ? '#22313f' : '#1c2a37', 'stroke-width': 1, 'stroke-dasharray': e.k === 4 ? '3 5' : '' })));
        L.secs.filter(s => s.state === state).forEach(s => { const r0 = s.a0 * Math.PI / 180; g.append(el('line', { x1: s.cx + s.rx * .26 * Math.sin(r0), y1: L.cy - s.ry * .26 * Math.cos(r0), x2: s.cx + s.rx * Math.sin(r0), y2: L.cy - s.ry * Math.cos(r0), stroke: '#16222e', 'stroke-width': 1 })); if (!ph) g.append(el('text', { x: s.x, y: s.y, 'text-anchor': s.side > 0 ? 'start' : 'end', class: 'rk' }, s.t.toUpperCase())); });
        /* the three flows of the centre's system: grey at rest, in the Circuit's colours when shown */
        const cx = state === 'wto' ? W * k / 2 : L.ucx, sx = L.secs.filter(s => s.state === state && s.cx === cx), at = (t, f) => { const s = sx.find(q => q.t === O.sectors[t]); if (!s) return null; const i = sx.indexOf(s), a1 = i + 1 < sx.length ? sx[i + 1].a0 : s.a0 + 40, m = ((s.a0 + a1) / 2) * Math.PI / 180; return [cx + s.rx * f * Math.sin(m), L.cy - s.ry * f * Math.cos(m), m]; };
        [['rent', 4, .5, 'Rents flow to the centre: IP charges, profits booked there, dividends'], ['dollar', 0, .3, 'The surplus returns as purchases of US shares and bonds'], ['goods', 1, .52, 'Hardware from the assembly orbit'], ['mat', 3, .74, 'Ores from the outer orbit, at low value']].forEach(([id, sec, f, t]) => { const p = at(sec, f); if (!p) return; const q = [cx + 34 * Math.sin(p[2]), L.cy - 20 * Math.cos(p[2])];
          g.append(el('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], class: 'fl', stroke: OC[id], 'marker-end': 'url(#isx-orb-' + id + ')' }), el('title', {}, t)); });
        if (state === 'ps' && !ph) { g.append(el('line', { x1: L.mid, x2: L.mid, y1: L.top + 4, y2: H * k - 18, class: 'curtain' }), el('text', { x: L.mid, y: H * k - 6, 'text-anchor': 'middle', class: 'cur-t' }, 'SILICON CURTAIN'), el('text', { x: L.mid, y: L.split + 12, 'text-anchor': 'middle', class: 'rk' }, 'ON NEITHER LIST'), el('text', { x: L.mid, y: L.m0 - 2, 'text-anchor': 'middle', class: 'rk' }, 'IN THE OVERLAP')); }
        if (state === 'ps' && ph) g.append(el('text', { x: 8, y: L.m0 - 8, class: 'rk' }, 'IN THE OVERLAP OF BOTH SYSTEMS'), el('text', { x: 8, y: L.split + 16, class: 'rk' }, 'ON NEITHER LIST'));
        svg.append(g); });
      O.B.forEach(b => { const g = el('g', { class: 'ob s-' + b.sys + (b.k === 'g' ? ' grp' : '') + (b.mem.p ? ' pax' : b.mem.t ? ' tw' : '') + (b.mem.w ? ' wa' : '') + (b.zone && b.sys !== 'core' ? ' zone' : '') + (/^contested/.test(b.mem.b) ? ' hatch' : ''), 'data-ob': b.id, role: 'button', tabindex: 0, 'aria-label': oName(b) });
        if (b.sys === 'core') g.append(el('circle', { r: b.full === 'China' ? 13 : 17, class: 'c' })); else if (b.zone) g.append(el('rect', { x: -4.6, y: -4.6, width: 9.2, height: 9.2, transform: 'rotate(45)', class: 'c' })); else g.append(el('circle', { r: b.k === 'g' ? 6.5 : 4.6, class: 'c' }));
        if (b.k === 'g') g.append(el('circle', { r: 2, class: 'gd' }));
        g.append(el('circle', { r: 13, fill: 'transparent' }), el('text', { class: b.sys === 'core' ? 'cl' : 'ol' }, b.sys === 'core' ? (b.full === 'China' ? 'China' : 'US') : b.n)); svg.append(g); });
      const pick = (id, pin) => { OSEL = id; orbPlace(L, true); }, of = ev => { const g = ev.target.closest && ev.target.closest('[data-ob]'); return g ? g.dataset.ob : null; };
      svg.addEventListener('pointerover', ev => { const id = of(ev); if (id && ev.pointerType === 'mouse' && id !== OSEL) pick(id); });
      svg.addEventListener('click', ev => { const id = of(ev); if (id) pick(id); });
      svg.addEventListener('focusin', ev => { const id = of(ev); if (id && id !== OSEL) pick(id); });
      svg.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { const id = of(ev); if (id) { ev.preventDefault(); pick(id); } } });
      sc.append(svg); wrap.append(sysw, strip, sc, info);
      if (ph) { const z = h('div', 'pf-orbz'); [['-', 'Zoom out', '−'], ['+', 'Zoom in', '+']].forEach(([d, a, t]) => { const b = h('button', '', t); b.type = 'button'; b.dataset.pzk = d; b.setAttribute('aria-label', a); z.append(b); }); wrap.append(z); }
      fig.append(wrap); V.orb.L = L; orbPlace(L, true);
      R.lg.textContent = ''; if (S.flows) [['rent', 'Rents flow to the centre: IP charges ($195bn of US receipts in 2025, BEA), profits booked there, dividends'], ['dollar', 'The surplus returns as purchases of US shares and bonds'], ['goods', 'Hardware from the assembly orbit'], ['mat', 'Ores from the outer orbit, at low value']].forEach(([id, t]) => { const sp = h('span', 'ofl'), i = h('i'); i.style.background = OC[id]; sp.append(i, t); R.lg.append(sp); });
      [['c pax', 'Pax Silica signatory'], ['c tw', 'Takes part without signing'], ['c usx', 'US system, outside Pax Silica'], ['c wa', 'WAICO member'], ['c both', 'On both lists'], ['c sw', 'On neither list'], ['z', 'Extraction zone'], ['g', 'A group']].forEach(([c, t]) => { const s = h('span', 'olg'), i = h('i', c); s.append(i, t); R.lg.append(s); });
    },
    table: () => O ? { cap: 'The bodies of the orbit view, from the project’s country file (claude/data/orbit/O1-countries.csv, 17 Nov 2026; 103 rows, grouped where no role in the chain is collected). Sector and orbit are draft placements. Mine output: share of the world total, USGS Mineral Commodity Summaries 2026.', wrap: 1, head: ['Body', 'Under Pax Silica', 'Role in the chain', 'Orbit', 'Lists', 'Mine output', 'What it does'],
      rows: O.B.map(b => [b.full && b.k === 'c' ? b.full : b.n + (b.m ? ' (' + b.m + ')' : ''), { core: 'Centre', us: b.mem.p ? 'US system, signatory' : b.mem.t ? 'US system, participant' : 'US system, outside Pax Silica', cn: 'China’s system', both: 'Overlap', swing: 'On neither list', open: 'Between the systems, ownership not researched' }[b.sys], b.sys === 'core' ? 'IP and finance' : O.sectors[b.sec], b.sys === 'core' ? 'Centre' : ['', 'Inner', 'Middle', 'Outer', 'Edge'][b.ring], [b.mem.p && 'Pax Silica', b.mem.t && 'Pax Silica participant', b.mem.a && 'AI statement', b.mem.w && 'WAICO', b.mem.b && 'BRICS ' + b.mem.b.replace(/\s*\(.*$/, ''), b.mem.e && 'EU', b.mem.s && 'US treaty'].filter(Boolean).join(', ') || 'none', b.share || 'not collected', b.role || 'not collected']) } : { cap: 'The orbits are loading.', head: ['Body'], rows: [['…'], ['…'], ['…']] } };

  const GC = { hub: C.gold, export: C.teal, centre: C.blue, mixed: C.teal };
  const OFF = { USA: [0, -1, 'middle'], CHN: [0, 1, 'middle'], JPN: [-1, -1, 'end'], KOR: [1, 0, 'start'], DEU: [0, 1, 'middle'], GBR: [-1, 0, 'end'], FRA: [0, 1, 'middle'], TWN: [-1, 0, 'end'], CHE: [1, 0, 'start'], SAU: [-1, 0, 'end'], NLD: [0, -1, 'middle'] };
  const GN = { hub: 'Hub', export: 'Export-led spoke', centre: 'Financial or booking centre', mixed: 'Both: export-led and booking centre', other: 'Not placed' };
  V.pos = { title: 'Where the data place them', unit: 'Current account × profit capture · IMF, Forbes', draw() {
    const PS = D.P.map(r => ({ iso: r[0], ca: r[1], ca25: r[2], ps: r[3], gs: r[4], r: r[5], g: r[6] }));
    reading('The hub sits alone: ', 'the largest deficit, the largest share of profits, and a capture ratio of 1.55. Surplus economies with one giant firm score higher ratios on far smaller shares.');
    legend([[GC.hub, 'Hub', 1], [GC.export, 'Export-led', 1], [GC.centre, 'Centres', 1], ['', 'Not placed', 2], [C.blue, 'Blue ring: both (Netherlands)', 3]]);
    const fig = R.fig, W = fig.clientWidth, H = fig.clientHeight, ph = phone(), m = { l: 38, r: ph ? 14 : 24, t: 20, b: 36 }, pw = W - m.l - m.r, phh = H - m.t - m.b;
    const Xs = v => m.l + (v + 5) / 21 * pw, Y = v => m.t + (3 - v) / 3 * phh, Rr = s => Math.sqrt(s) * (ph ? 4.2 : Math.min(7.2, Math.max(5, H / 70)));
    const svg = svgOf(W, H, 'Bubbles for eleven economies. Across: the current-account balance, average of 2018 to 2025, % of GDP, deficit to the left. Up: the share of the largest listed firms’ profits divided by the share of world GDP, Forbes lists 2019 to 2026. Bubble size: the share of profits. ' + PS.map(p => `${NAME[p.iso]}: balance ${p.ca.toFixed(1)}%, ratio ${f2(p.r)}, ${p.ps.toFixed(1)}% of profits`).join('; ') + '.');
    for (let v = -5; v <= 15; v += 5) svg.append(el('line', { x1: Xs(v), x2: Xs(v), y1: m.t, y2: m.t + phh, stroke: v === 0 ? '#5d6f7e' : '#17222d', 'stroke-width': 1 }), el('text', { x: Xs(v), y: H - 20, 'text-anchor': 'middle' }, (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) + (v === 15 && !ph ? '% of GDP' : '')));
    for (let v = 0; v <= 3; v += 1) svg.append(el('line', { x1: m.l, x2: m.l + pw, y1: Y(v), y2: Y(v), stroke: v === 1 ? '#5d6f7e' : '#17222d', 'stroke-width': 1 }), el('text', { x: m.l - 6, y: Y(v) + 3.5, 'text-anchor': 'end' }, v.toFixed(1)));
    svg.append(el('text', { x: Xs(0) - 6, y: H - 5, 'text-anchor': 'end' }, '← deficit with the world'), el('text', { x: Xs(0) + 6, y: H - 5 }, 'surplus →'), el('text', { x: m.l + pw, y: Y(1) + 15, 'text-anchor': 'end' }, ph ? '' : '1.0 = profits in line with GDP weight'), el('text', { x: m.l + 4, y: m.t + 10 }, 'Profit capture ↑'));
    [...PS].sort((a, b) => b.ps - a.ps).forEach(p => {
      const x = Xs(p.ca), y = Y(p.r), r = Rr(p.ps), col = GC[p.g];
      const c = el('circle', { cx: x, cy: y, r: p.g === 'mixed' ? r + 1.5 : r, fill: col || 'transparent', 'fill-opacity': col ? .85 : 0, stroke: p.g === 'mixed' ? C.blue : col ? C.bg : C.ink2, 'stroke-width': p.g === 'mixed' ? 3 : col ? 2 : 1.5, tabindex: 0, role: 'img', 'aria-label': `${NAME[p.iso]}: current-account balance ${p.ca.toFixed(1)}% of GDP; ${p.ps.toFixed(1)}% of the lists’ profits with ${p.gs.toFixed(1)}% of world GDP; ratio ${f2(p.r)}` });
      hover(c, [NAME[p.iso], ['Current account, % of GDP', (p.ca > 0 ? '+' : '−') + f1(p.ca) + ' (avg 2018–25)'], ['Share of the lists’ profits', p.ps.toFixed(1) + '%'], ['Share of world GDP', p.gs.toFixed(1) + '%'], ['Ratio', f2(p.r)], ['Current account 2025', (p.ca25 < 0 ? '−$' : '$') + Math.round(Math.abs(p.ca25)).toLocaleString('en-US') + 'bn']]);
      const [ox, oy, anc] = OFF[p.iso], nm = ph ? SHORT[NAME[p.iso]] || NAME[p.iso] : NAME[p.iso];
      svg.append(c, el('text', { x: x + ox * (r + 6), y: y + (oy ? oy * (r + (oy > 0 ? 14 : 6)) : 4), 'text-anchor': anc, class: 'lb', fill: p.iso === 'USA' ? C.ink : C.ink2 }, nm));
    });
    fig.append(svg);
  }, table: () => ({ cap: 'Positions of eleven economies. Current account: IMF, Oct 2026, % of GDP, average of 2018 to 2025 (China without Hong Kong). Profits: Forbes Global 2000, lists 2019 to 2026 pooled (China with Hong Kong), against IMF GDP of the year before each list.', head: ['Economy', 'Current account, % of GDP (avg 2018–25)', 'Current account 2025, $bn', 'Share of the lists’ profits, %', 'Share of world GDP, %', 'Ratio', 'Position'], rows: [...D.P].sort((a, b) => a[1] - b[1]).map(p => [NAME[p[0]], f2(p[1]), p[2].toFixed(1), f2(p[3]), f2(p[4]), f2(p[5]), GN[p[6]]]) }) };
  /* two orders, one picture: the hub and its spokes, with the rings of the value chain and the two fences drawn on it as layers */
  const RINGS = ['Intellectual property and design', 'Critical tools and components', 'Fabrication and assembly', 'Raw materials and commodity exports', 'The periphery'];
  const ORD = [['Netherlands', 2, -40, 'mixed', -60], ['Japan', 2, -12, 'export', -25], ['South Korea', 2, 16, 'export', 25], ['Germany', 2, 196, 'export', 205], ['Taiwan', 3, 34, 'export', 50], ['China', 3, 164, 'cut', 160], ['Saudi Arabia', 4, 222, 'raw', 232]];
  const CEN = [['United Kingdom', 135, 140, 'UK'], ['Switzerland', 105, 110, 'CH'], ['Ireland', 75, 70, 'IE'], ['Singapore', 45, 40, 'SG']];
  V.ord = { title: 'A hub and its spokes, under two orders', unit: 'Schematic · ideal types', draw() {
    reading('Read it from the centre out: ', phone() ? 'rings 1 to 5 are places in the value chain: design, tools, fabrication, raw materials, the periphery. Teal lines: savings in, as claims. Gold lines: demand out, as imports. Gold fence: the WTO order. Red fence: Pax Silica. Blue marks are the centres: the United Kingdom, Switzerland, Ireland, Singapore.' : 'rings are places in the value chain. Gold fence: the WTO order. Red fence: Pax Silica.');
    legend([[C.gold, 'Hub', 1], [C.teal, 'Export-led spoke', 1], [C.blue, 'Financial or booking centre', 3], ['', 'Commodity exporter', 2]]);
    const fig = R.fig, W = fig.clientWidth, H = fig.clientHeight, ph = phone(), cx = W / 2, cy = H / 2 + 4, rx = W / 2 - (ph ? 6 : 150), ry = H / 2 - 14, f = ph ? [0, .17, .56, .76, .9, 1] : [0, .22, .54, .74, .9, 1];
    const P = (deg, k) => [cx + Math.cos(deg * Math.PI / 180) * rx * k, cy + Math.sin(deg * Math.PI / 180) * ry * k], mid = i => (f[i - 1] + f[i]) / 2;
    const svg = svgOf(W, H, 'Schematic, not measured. The United States at the centre as the hub. Around it five rings, by place in the value chain: intellectual property and design; critical tools and components (the Netherlands, Japan, South Korea, Germany); fabrication and assembly (Taiwan, China); raw materials and commodity exports (Saudi Arabia); and the periphery, commodity exporters and developing economies, without names. Financial and booking centres (the United Kingdom, Switzerland, Ireland, Singapore, and the Netherlands as both) sit on the paths the claims take. Savings flow in as claims on US firms; demand flows out as US imports. Two fences are drawn on it: the TRIPS agreement of 1995, which protects the hub’s rents everywhere, and the export controls and licences of Pax Silica, from 2025, which decide who may hold the tools; China’s line to the inner rings is cut or licensed. The table view gives the four ideal types and what changes between the two orders.');
    const defs = el('defs'); [['t', C.teal], ['g', C.gold]].forEach(([id, c]) => { const mk = el('marker', { id: 'isx-pf-ah' + id, viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 6, markerHeight: 6, orient: 'auto' }); mk.append(el('path', { d: 'M0,0 L8,4 L0,8 z', fill: c })); defs.append(mk); }); svg.append(defs);
    for (let i = 5; i >= 1; i--) svg.append(el('ellipse', { cx, cy, rx: rx * f[i], ry: ry * f[i], fill: i % 2 ? 'rgba(255,255,255,.018)' : 'rgba(255,255,255,0)', stroke: i === 5 ? '#3a4d5e' : '#22303d', 'stroke-width': 1, 'stroke-dasharray': i === 5 ? '5 5' : '' }));
    RINGS.forEach((t, i) => { const [x, y] = P(-90, i ? mid(i + 1) : .1); if (i) svg.append(el('text', { x, y: y + 4, 'text-anchor': 'middle', class: ph ? '' : 'rk' }, ph ? String(i + 1) : (i + 1) + ' · ' + (i === 4 ? 'THE PERIPHERY: COMMODITY EXPORTERS AND DEVELOPING ECONOMIES' : t.toUpperCase()))); });
    if (!ph) { svg.append(el('text', { x: W - 8, y: 22, 'text-anchor': 'end', class: 'lb', fill: C.lab }, 'The WTO order, from 1995'), el('text', { x: W - 8, y: 38, 'text-anchor': 'end', class: 'lb' }, 'TRIPS: the hub’s rents'), el('text', { x: W - 8, y: 53, 'text-anchor': 'end', class: 'lb' }, 'protected everywhere'), el('text', { x: 8, y: H - 44, class: 'lb', fill: '#f08a80' }, 'Pax Silica, from 2025'), el('text', { x: 8, y: H - 28, class: 'lb' }, 'export controls and licences:'), el('text', { x: 8, y: H - 13, class: 'lb' }, 'who may hold the tools'), el('text', { x: 8, y: 22, class: 'lb', fill: C.ink }, 'Finance, the same in both'), el('line', { x1: 8, x2: 52, y1: 36, y2: 36, stroke: C.teal, 'stroke-width': 1.6, 'marker-end': 'url(#isx-pf-aht)' }), el('text', { x: 60, y: 40, class: 'lb' }, 'savings in, as claims'), el('line', { x1: 8, x2: 52, y1: 54, y2: 54, stroke: C.gold, 'stroke-width': 1.6, 'marker-end': 'url(#isx-pf-ahg)' }), el('text', { x: 60, y: 58, class: 'lb' }, 'demand out, as imports')); }
    svg.append(el('ellipse', { cx, cy, rx: rx * f[1] + 7, ry: ry * f[1] + 7, fill: 'none', stroke: C.gold, 'stroke-width': 1.6, 'stroke-dasharray': '2 5' }));   /* the first fence: TRIPS round the hub's rents */
    const arc = (k, a0, a1) => { const p = []; for (let a = a0; a <= a1; a += 4) p.push(P(a, k).join(',')); return 'M' + p.join(' L'); };
    svg.append(el('path', { d: arc(f[2] + .012, 138, 188), fill: 'none', stroke: C.red, 'stroke-width': 2.4, 'stroke-linecap': 'round' }));   /* the second fence, on China's side of the tools ring */
    ORD.forEach(([nm, ring, a0, g, ap]) => {
      const a = ph ? ap : a0;
      const k = mid(ring), [x, y] = P(a, k), [x1, y1] = P(a, f[1] + .05), [x2, y2] = P(a, k - .045), cut = g === 'cut', raw = g === 'raw', off = 3.2;
      const nx = -(y2 - y1), ny = x2 - x1, d = Math.hypot(nx, ny) || 1, ux = nx / d * off, uy = ny / d * off;
      if (cut) { const [bx, by] = P(a, f[2] - .03), [cx2, cy2] = P(a, f[2] + .05); svg.append(el('line', { x1: x2, y1: y2, x2: cx2, y2: cy2, stroke: C.teal, 'stroke-width': 1.5, opacity: .8 }), el('line', { x1: bx, y1: by, x2: x1, y2: y1, stroke: C.red, 'stroke-width': 1.5, 'stroke-dasharray': '3 4' })); }
      else svg.append(el('line', { x1: x2 + ux, y1: y2 + uy, x2: x1 + ux, y2: y1 + uy, stroke: C.teal, 'stroke-width': 1.5, opacity: .85, 'marker-end': 'url(#isx-pf-aht)' }), el('line', { x1: x1 - ux, y1: y1 - uy, x2: x2 - ux, y2: y2 - uy, stroke: C.gold, 'stroke-width': 1.5, opacity: .85, 'marker-end': 'url(#isx-pf-ahg)' }));
      svg.append(el('circle', { cx: x, cy: y, r: g === 'mixed' ? 7.5 : 6, fill: raw ? 'transparent' : C.teal, stroke: g === 'mixed' ? C.blue : raw ? C.ink2 : C.bg, 'stroke-width': g === 'mixed' ? 3 : raw ? 1.5 : 2 }));
      const right = Math.cos(a * Math.PI / 180) >= 0, lab = ph ? SHORT[nm] || nm : nm;
      svg.append(el('text', { x: x + (right ? 12 : -12), y: y + 4, 'text-anchor': right ? 'start' : 'end', class: 'lb', fill: C.ink }, lab + (cut && !ph ? ' · cut or licensed' : '')));
    });
    CEN.forEach(([nm, a0, ap, code]) => { const a = ph ? ap : a0, [x, y] = P(a, f[1] + (f[2] - f[1]) * (ph ? .5 : .42)); svg.append(el('rect', { x: x - 5, y: y - 5, width: 10, height: 10, rx: 2, fill: C.blue, stroke: C.bg, 'stroke-width': 1.5, transform: `rotate(45 ${x} ${y})` }), el('text', { x, y: y + 21, 'text-anchor': 'middle', class: 'lb' }, ph ? code : nm)); });
    const hr = Math.min(rx, ry) * f[1] * (ph ? 1.05 : .92);
    svg.append(el('ellipse', { cx, cy, rx: rx * f[1], ry: ry * f[1], fill: 'rgba(196,134,28,.16)', stroke: C.gold, 'stroke-width': 1.6 }), el('text', { x: cx, y: cy - (ph ? 1 : 7), 'text-anchor': 'middle', class: ph || hr < 34 ? 'lb' : 'lv', fill: C.ink }, ph ? 'US' : 'United States'), el('text', { x: cx, y: cy + (ph ? 14 : 9), 'text-anchor': 'middle', class: 'lb' }, 'the hub'));
    if (!ph) svg.append(el('text', { x: cx, y: cy + 23, 'text-anchor': 'middle', class: 'rk' }, '1 · IP AND DESIGN'));
    if (ph) { const [px, py] = P(90, mid(5)); svg.append(el('text', { x: px, y: py + 4, 'text-anchor': 'middle', class: 'lb' }, 'Periphery')); }
    fig.append(svg);
  }, table: () => [{ wrap: 1, cap: 'Ideal types, drawn schematically: no economy matches one exactly, and reality is a process, not a model to be measured. The consumption-led and export-led types follow the growth-model literature (Baccaro, Blyth and Pontusson, 2022).', head: ['Position', 'Examples', 'Demand comes from', 'External balance', 'Leading sector', 'Profit capture (Forbes)', 'Consent rests on'], rows: [
      ['The hub', 'United States', 'Consumption, carried by asset prices, credit and the federal deficit', 'Deficit, paid in its own money', 'Finance and the platform and chip firms', 'The largest share of the world’s listed profits (1.55 times its GDP weight, lists 2019–2026)', 'Asset prices and episodic fiscal support'],
      ['Export-led spokes', 'China, Germany, Japan, South Korea, Taiwan', 'Exports and investment; wages and consumption held back', 'Surplus; the savings are recycled into claims on the hub', 'Productive capital and its allied bureaucracies', 'Varies: Taiwan 2.42, South Korea 1.23, China 0.95, Germany 0.56', 'Employment stability and industrial policy'],
      ['Financial and booking centres', 'United Kingdom, Switzerland, Ireland, Singapore; the Netherlands is both export-led and a booking centre', 'Intermediation, custody and the booking of profits', 'Either sign; claims pass through them', 'Banks, custodians, holding companies', 'High for small economies with one or two giant firms (Switzerland 2.72)', 'Not set out here'],
      ['The periphery: commodity exporters and developing economies', 'No names yet', 'Imports paid for in foreign currency', 'Deficit by constraint, not by privilege; they pay the currency premium', 'Not set out here', 'Few or no firms in the profit lists', 'Not set out here']] },
    { wrap: 1, cap: 'Two orders: what changes on the same picture.', head: ['', 'The WTO order, from 1995', 'Pax Silica, from 2025'], rows: [
      ['Intellectual property', 'The TRIPS agreement (1995) protects the hub’s rents everywhere', 'Export controls and licences add a second fence: they decide who may hold the tools at all'],
      ['Value chains', 'Assembly moves out to the cheapest place; China’s fabrication ring is wide open', 'Chains are re-routed to the 26 signatories (October 2026); China’s links to the inner rings are cut or licensed'],
      ['Finance', 'Savings flow in as claims; demand flows out as imports', 'The same']] }] };

  /* ---------- the AI trade (station 5) and “Why the deficit cannot shrink” (station 4) ---------- */
  V.wt = { title: 'The AI trade’s weight in the S&P 500', unit: '% of the index’s value · Amundi; Bianco Research', draw() {
    const A = D.W.amundi, pk = D.W.peak, b = D.W.basket41, tx = d => +d.slice(0, 4) + (+d.slice(5, 7) - 1) / 12 + (+d.slice(8, 10) || 15) / 365;
    tiles([{ v: '49%', k: 'of the S&P 500: 41 AI-related stocks', d: 'October 2026', c: C.gold }, { v: A[A.length - 1][1].toFixed(1) + '%', k: 'Amundi’s basket of AI-linked stocks', d: '31 Mar 2026', c: C.teal, line: 1 }, { v: A[0][1].toFixed(1) + '%', k: 'the same basket', d: 'end of 2020', c: C.teal, line: 1 }]);
    reading('Two baskets, not one line: ', `the yearly series is Amundi’s (10.6% at the end of 2022, a peak of ${pk[1]}% in September 2025); the gold mark is the 41-stock basket.`); legend(phone() ? [[C.teal, 'Amundi’s basket, by year'], [C.gold, '41-stock basket, Oct 2026', 1]] : []);
    lines({ x0: 2020.5, x1: 2027, y0: 0, y1: 55, yt: [0, 10, 20, 30, 40, 50], xt: [2021, 2022, 2023, 2024, 2025, 2026], rpad: 60, vf: v => v.toFixed(1) + '%',
      aria: 'A line of Amundi’s basket of AI-linked stocks as a share of the S&P 500’s value, at the end of each year: ' + A.map(r => r[0].slice(0, 4) + (r[0].slice(5, 7) === '03' ? ' (March)' : '') + ' ' + r[1] + '%').join(', ') + `; its peak was ${pk[1]}% on 30 September 2025. A separate mark, not joined to the line: 41 AI-related stocks at 49% of the index in October 2026.`,
      series: [{ name: '', c: C.teal, w: 2.6, hi: 1, pts: A.map(r => [tx(r[0]), r[1]]) }],
      marks: A.slice(0, -1).map(r => ({ x: tx(r[0]), y: r[1], c: C.teal })).concat([{ x: tx(pk[0]), y: pk[1], c: C.teal, t: 'peak · ' + pk[1] + '%', tp: pk[1] + '%' }]),
      over: (svg, Xs, Y) => { const x = Xs(2026.79), y = Y(b[1]), ph = phone(); svg.append(el('rect', { x: x - 6, y: y - 6, width: 12, height: 12, rx: 2, fill: C.gold, stroke: C.bg, 'stroke-width': 2, transform: `rotate(45 ${x} ${y})` }), el('text', { x: x - 12, y: y - 12, 'text-anchor': 'end', class: 'lv' }, '49%'), el('text', { x: x - 12, y: y + 5, 'text-anchor': 'end', class: 'lb', fill: C.ink }, ph ? '41 stocks, Oct 2026' : '41 AI-related stocks · October 2026'), el('text', { x: Xs(tx(A[2][0])), y: Y(A[2][1]) + 20, 'text-anchor': 'middle', class: 'lb' }, ph ? 'Amundi' : 'Amundi’s basket, end of year')); } });
  }, table: () => ({ cap: 'The AI trade’s weight in the S&P 500, % of the index’s market value. Amundi’s basket: 32 to 52 stocks chosen each month by their link to the AI theme (Working Paper 190, table 3). The 41-stock basket: J.P. Morgan’s list as counted by Bianco Research (48.68%, 11 Oct 2026); press reports give 49%. Different baskets: not one series.', head: ['Date', 'Basket', 'Weight, %'], rows: [['Oct 2026', '41 AI-related stocks', '48.68']].concat([...D.W.amundi].reverse().map(r => [r[0], 'Amundi', r[1].toFixed(1)]), [[D.W.peak[0] + ' (peak)', 'Amundi', D.W.peak[1].toFixed(1)]]) }) };
  V.capex = { title: 'What five firms spend on the build-out', unit: 'Capital spending, $bn, fiscal years · annual reports', draw() {
    const Xd = D.X, n = Xd.y.length - 1;
    tiles([{ v: bn(Xd.sumCapex[n]), k: 'five firms, fiscal 2025', d: '2019: ' + bn(Xd.sumCapex[0]) }, { v: Xd.gdpPct[n].toFixed(1) + '%*', k: 'of GDP', d: '2019: ' + Xd.gdpPct[0].toFixed(1) + '%*' }, { v: Xd.npi[n].toFixed(2) + '%', k: 'net private investment, whole economy', d: '2025, % of GDP' }, { v: bn(Xd.fy26.MSFT[0]) + ' · ' + bn(Xd.fy26.ORCL[0]), k: 'Microsoft · Oracle, fiscal 2026', d: 'years to June and May 2026' }]);
    reading('A scale, not a share: ', 'gross spending by five firms against a net term for the whole economy. * Derived: fiscal years against calendar-year GDP.');
    legend(FIRM.map(f => [f[2], f[1], 1]));
    cols({ stack: 1, cats: Xd.y, series: FIRM.map(f => ({ c: f[2], vals: Xd.capex[f[0]] })), y0: 0, y1: 420, yt: [0, 100, 200, 300, 400], yf: v => String(v), everyP: 1, bw: 84, total: i => bn(Xd.sumCapex[i]),
      aria: 'Stacked columns, fiscal years 2019 to 2025: purchases of property and equipment by Amazon, Alphabet, Microsoft, Meta and Oracle, in billions of dollars. Totals: ' + Xd.y.map((y, i) => y + ' ' + Math.round(Xd.sumCapex[i])).join(', ') + '.',
      tip: i => ['Fiscal ' + Xd.y[i]].concat(FIRM.map(f => [f[1], bn(Xd.capex[f[0]][i])]), [['Five firms', bn(Xd.sumCapex[i])], ['Share of GDP*', Xd.gdpPct[i].toFixed(2) + '%']]) });
  }, table: () => ({ cap: 'Purchases of property and equipment, $bn, by fiscal year (annual reports; gross, without finance leases; Microsoft’s year ends in June, Oracle’s in May). Share of GDP*: derived, against calendar-year GDP. Fiscal 2026 is closed for Microsoft ($115.9bn) and Oracle ($55.7bn) only.', head: ['Fiscal year'].concat(FIRM.map(f => f[1]), ['Five firms', 'Share of GDP*, %', 'Net private investment, % of GDP']), rows: D.X.y.map((y, i) => [y].concat(FIRM.map(f => D.X.capex[f[0]][i]), [D.X.sumCapex[i], f2(D.X.gdpPct[i]), f2(D.X.npi[i])])).reverse() }) };
  V.ni = { title: 'Capital spending has caught up with profits', unit: 'Five firms, $bn, fiscal years · annual reports', draw() {
    const Xd = D.X, n = Xd.y.length - 1;
    reading('2025: ', `${bn(Xd.sumCapex[n])} of capital spending against ${bn(Xd.sumNi[n])} of net income. In 2021 the five firms earned ${bn(Xd.sumNi[2])} and spent ${bn(Xd.sumCapex[2])}.`); legend(phone() ? [[C.gold, 'Net income'], [C.teal, 'Capital spending']] : []);
    lines({ x0: 2019, x1: 2025, y0: 0, y1: 420, yt: [0, 100, 200, 300, 400], xt: Xd.y, xtp: [2019, 2021, 2023, 2025], rpad: 200, vf: bn,
      aria: 'Two lines, fiscal years 2019 to 2025, for Amazon, Alphabet, Microsoft, Meta and Oracle together, in billions of dollars. Net income: ' + Xd.y.map((y, i) => y + ' ' + Math.round(Xd.sumNi[i])).join(', ') + '. Capital spending: ' + Xd.y.map((y, i) => y + ' ' + Math.round(Xd.sumCapex[i])).join(', ') + '.',
      series: [{ name: 'capital spending', c: C.teal, w: 2.6, hi: 1, pts: Xd.y.map((y, i) => [y, Xd.sumCapex[i]]) }, { name: 'net income', c: C.gold, w: 2.6, hi: 1, pts: Xd.y.map((y, i) => [y, Xd.sumNi[i]]) }],
      tip: y => { const i = y - 2019; return ['Fiscal ' + y, ['Net income', bn(Xd.sumNi[i])], ['Capital spending', bn(Xd.sumCapex[i])]].concat(FIRM.map(f => [f[1], bn(Xd.ni[f[0]][i]).replace('$-', '−$') + ' · ' + bn(Xd.capex[f[0]][i])])); } });
  }, table: () => ({ cap: 'Net income and capital spending, $bn, by fiscal year (annual reports). Each firm: net income · capital spending.', head: ['Fiscal year', 'Net income, five firms', 'Capital spending, five firms'].concat(FIRM.map(f => f[1])), rows: D.X.y.map((y, i) => [y, D.X.sumNi[i], D.X.sumCapex[i]].concat(FIRM.map(f => D.X.ni[f[0]][i] + ' · ' + D.X.capex[f[0]][i]))).reverse() }) };
  const WHYT = [['npi', 'Net private investment'], ['fed', 'Federal net borrowing'], ['div', 'Dividends'], ['hh', 'Household saving (takes from profits)'], ['ca', 'Balance with the world (takes from profits)'], ['pat', 'Profits after tax']];
  V.why = { title: 'What carried profits then, and what carries them now', unit: '% of GDP, average a year · United States', draw() {
    const a = k => avg(k, 1960, 1979), b = k => avg(k, 2014, 2025);
    reading('Read the sum backwards: ', `net private investment fell from ${f1(a('npi'))}% to ${f1(b('npi'))}% of GDP and the leak abroad opened, so federal borrowing went from ${f1(a('fed'))}% to ${f1(b('fed'))}%.`);
    legend([[C.grey, '1960–79', 1], [C.gold, '2014–25', 1]]);
    pairs({ compact: 1, max: 12, lw: 300, vf: (v, r) => (r.neg ? '−' : r.eq ? '= ' : '+') + f1(v), aria: 'Pairs of bars: the average of 1960 to 1979 against the average of 2014 to 2025, % of GDP. ' + WHYT.map(([k, t]) => `${t}: ${f1(a(k))} then, ${f1(b(k))} now`).join('; ') + '. Household saving and the balance with the world take from profits; their bars show the size of what they take, and the balance with the world was a small surplus in 1960 to 1979.',
      groups: WHYT.map(([k, t]) => ({ title: t, hi: k === 'pat', rows: [{ v: Math.abs(a(k)), c: C.grey, neg: a(k) < 0, eq: k === 'pat' }, { v: Math.abs(b(k)), c: k === 'pat' ? C.ink : C.gold, neg: b(k) < 0, eq: k === 'pat' }] })) });
  }, table: () => ({ cap: 'The profit equation in two eras, % of GDP, average a year (BEA national accounts). A minus sign means the term takes from profits.', head: ['Term', '1960–79', '2014–25'], rows: [['pat', 'Profits after tax'], ['npi', 'Net private investment'], ['fed', 'Federal net borrowing'], ['div', 'Dividends'], ['hh', 'Household saving'], ['ca', 'Balance with the world'], ['rest', 'State and local, other']].map(([k, t]) => [t, avg(k, 1960, 1979).toFixed(2), avg(k, 2014, 2025).toFixed(2)]) }) };

  /* ---------- the board ---------- */
  function chipRow(label, opts, key, on) { if (R.chips.childNodes.length) R.chips.append(h('span', 'gap')); R.chips.append(h('span', 'cl', label)); opts.forEach(([k, t]) => { const b = h('button', 'pf-chip', t); b.type = 'button'; b.dataset[key] = k; b.setAttribute('aria-pressed', String(on === k)); R.chips.append(b); }); }
  /* the view switch (v4, decision 6): dots under the chart with arrows that name the view they lead to; the view's name above the chart */
  function dots() {
    const vs = cur().views, i = vs.findIndex(v => v[0] === vw()), nav = R.dots; nav.textContent = ''; nav.hidden = vs.length < 2; if (vs.length < 2) return;
    const arr = (d, j) => { const b = h('button', 'pf-arr ' + (d < 0 ? 'pv' : 'nx')); b.type = 'button'; b.dataset.pvn = d; b.disabled = j < 0 || j >= vs.length; b.setAttribute('aria-label', b.disabled ? (d < 0 ? 'No earlier view' : 'No further view') : (d < 0 ? 'Previous view: ' : 'Next view: ') + vs[j][1]); const t = h('span', 'at', b.disabled ? '' : vs[j][1]), a = h('i', '', d < 0 ? '‹' : '›'); a.setAttribute('aria-hidden', 'true'); if (d < 0) b.append(a, t); else b.append(t, a); return b; };
    const row = h('div', 'pf-dr'); row.setAttribute('role', 'group'); row.setAttribute('aria-label', 'Choose a view');
    vs.forEach(([k, t], j) => { const b = h('button', 'pf-dot'); b.type = 'button'; b.dataset.pv = k; b.title = t; b.setAttribute('aria-label', (j + 1) + ' of ' + vs.length + ': ' + t); b.setAttribute('aria-current', String(j === i)); row.append(b); });
    nav.append(arr(-1, i - 1), row, arr(1, i + 1));
  }
  function note() {
    const s = cur(), t = vw() === s.views[0][0] ? null : NOTE[vw()];
    R.note.hidden = !t || S.whyOff; R.whyq.hidden = !t || !S.whyOff;
    if (t) R.note.querySelector('span').textContent = t;
  }
  /* the board ends above the bar on a wide screen: what the head, the title line, a note, the chips and the dots add is taken from the chart */
  function fit() {
    const chips = R.chips.childNodes.length ? R.chips.offsetHeight + 8 : 0, nt = R.note.hidden ? 0 : R.note.offsetHeight + 8;
    R.board.style.setProperty('--pfx', Math.round(R.top.offsetHeight + 12 + R.head.offsetHeight - 51 + chips + nt - 38) + 'px');   /* build 1 had a head of 51 px and a row of view chips of 38 px */
  }
  /* OR8: the order's story is a stage: it fills the screen between the header and the bar, and the page's own head, chips and foot step aside
     (their parts are on the stage: v2/stage8.js). Every other view, and the story's table, keeps the page layout. */
  const isStage = () => cur().id === 'order' && vw() === 'orr' && !S.table && !cur().fin;
  function stageMode() { const on = isStage(); host.classList.toggle('stg', on); if (X.root) X.root.classList.toggle('orr-stg', on); if (!on) R.fig.style.height = '';
    tableHome(); }
  /* “View as table” is one button: the stage borrows it for its own row, and it comes home before the figure is cleared */
  function tableHome() { const ft = host.querySelector('.pf-foot'); if (ft && R.table && R.table.parentNode !== ft) ft.append(R.table); }
  function board(keep) {
    if (!D) return;
    const s = cur(); if (s.fin) { if (!keep) emit(); return; }
    const v = V[vw()], fig = R.fig, vi = s.views.findIndex(q => q[0] === vw());
    stageMode();
    tipHide(); fig.textContent = ''; R.chips.textContent = ''; R.tiles.textContent = ''; R.tiles.className = 'pf-tiles'; reading('', ''); legend([]);
    fig.dataset.lens = vw(); fig.classList.toggle('tall', !!v.tall); fig.classList.toggle('orr-fig', ['orr', 'fig', 'rng', 'pft', 'hyp'].includes(vw())); R.board.dataset.st = s.id; R.board.dataset.lens = vw();
    if (v.chips) v.chips();
    R.vn.textContent = s.views.length > 1 ? s.views[vi][1] + ' · ' + (vi + 1) + ' of ' + s.views.length : s.views[vi][1];
    R.title.textContent = typeof v.title === 'function' ? v.title() : v.title; R.unit.textContent = v.unit; R.table.setAttribute('aria-pressed', String(S.table));
    dots(); note();
    if (!v.scrub) R.scrub.textContent = '';
    else {
      let inp = R.scrub.querySelector('input');
      if (!inp) { inp = h('input'); inp.type = 'range'; inp.min = 1960; inp.max = 2026; inp.step = 1; inp.setAttribute('aria-label', 'Year'); inp.addEventListener('input', () => { S.era = null; S.year = +inp.value; board(true); emit('year'); }); R.scrub.append(h('span', '', '1960'), inp, h('span', '', '2026 H1')); }
      if (document.activeElement !== inp || S.era) inp.value = S.era ? S.era[1] : S.year;
      inp.setAttribute('aria-valuetext', S.era ? 'average of ' + S.era[0] + ' to ' + S.era[1] : S.year === 2026 ? 'first half of 2026, provisional' : String(S.year));
    }
    R.board.classList.toggle('has-tiles', false);
    /* the tiles and the reading line are set by the view before it measures the chart's box: draw twice when they change its height */
    fit();
    if (S.table) { v.draw(); tableHome(); fig.textContent = ''; legend([]); table(v.table()); } else v.draw();
    const had = R.board.classList.contains('has-tiles'), has = R.tiles.childNodes.length > 0;
    R.board.classList.toggle('has-tiles', has); R.board.classList.toggle('has-lg', R.lg.childNodes.length > 0 || !!v.scrub);
    if (has !== had && !S.table) { tableHome(); fig.textContent = ''; v.draw(); }
    lastW = fig.clientWidth;
    if (!keep) emit();
  }

  /* ---------- the bar, the link, the reference ---------- */
  function bar() {
    const RT = X.route, hostB = $('tabs'); if (!RT || !hostB) return;
    const last = S.st === ST.length - 1;
    RT.render(hostB, { id: 'profit', label: 'The order: six stations', stage: scene, count: (S.st + 1) + ' / ' + ST.length,
      back: { enabled: S.st > 0, label: S.st > 0 ? 'Back: ' + ST[S.st - 1].t : 'Back' },
      next: last ? { kicker: 'Go on', title: 'The imperial arm', ptitle: 'Arm' } : { kicker: isStage() ? 'Next station' : 'Next', title: ST[S.st + 1].t, ptitle: ST[S.st + 1].t.replace(/^The /, '') },   /* OR8: on the stage the way forward is the stage's own “Next”; the bar's is named for what it is, the next station */
      segs: [{ label: 'The order', short: 'The order', colour: '#d78bff', current: true, lab: true, wide: true, grow: 9, marks: ST.map((s, i) => ({ kind: 'step', n: '0' + (i + 1), t: s.t, state: i === S.st ? 'cur' : i < S.st ? 'done' : '', target: String(i), title: s.t + ' · ' + s.q, sub: s.f })) }] });
  }
  function sync() { if (X.view !== 'profit') return; X.routeSync(); }
  function go(i, view, quiet) {
    i = Math.max(0, Math.min(ST.length - 1, i));
    const moved = i !== S.st; S.st = i; S.table = false;
    if (view && ST[i].views.some(v => v[0] === view)) S.view[i] = view;
    if (!built || !D) return;
    text(); board(); bar(); if (!quiet) sync();
    if (moved && !quiet) { const top = $('frame').getBoundingClientRect().top; if (top < -40) $('frame').scrollIntoView({ block: 'start' }); }
    X.emit('narr');
  }
  X.route && X.route.on(ev => {
    if (ev.id !== 'profit' || X.view !== 'profit') return;
    if (ev.target != null) go(+ev.target);
    else if (ev.nav === 'next') { if (S.st === ST.length - 1) { X.setView('story'); $('frame').scrollIntoView({ block: 'start' }); } else go(S.st + 1); }
    else if (S.st > 0) go(S.st - 1);
  });
  function show() {
    if (!built) build();
    if (!D) { if (show.busy) return; show.busy = true; host.classList.add('loading'); X.load('profit').then(d => { prep(d); host.classList.remove('loading'); if (X.view === 'profit') { text(); board(); bar(); } }).catch(() => { R.reading.textContent = 'The figures could not be loaded. Reload the page to try again.'; }); text(); bar(); return; }
    text(); board(); bar();
  }
  const first = i => (ST[i].views[0] || [null])[0];
  const detail = () => cur().id === 'order' && vw() === 'orr' ? (OZ.step === 'pp' ? '/order/profit-and-production' : OZ.step === 'cl' ? '/order/clearing' : OZ.y !== 1995 ? '/order/' + OZ.y : '') : cur().id === 'order' && vw() === 'hyp' ? '/order/german-hypocrisy' : cur().id === 'order' && vw() === 'orb' ? '/order/' + (S.ord === 'ps' ? 'pax' : 'wto') : S.st === 0 && vw() === first(0) ? '' : '/' + cur().id + (vw() && vw() !== first(S.st) ? '/' + vw() : cur().q2 && S.ord === 'ps' ? '/pax' : '');   /* #profit/order/pax: the orbit view in its second state */
  /* the link: #profit/<station>/<view>. A link made before the arc still lands: “claims” is now part of “profits”, and a view that
     moved to another station is found there */
  function apply(hash) {
    const p = String(hash || '').replace(/^#\/?/, '').split('/'), id = (p[1] || '').toLowerCase(); let view = (p[2] || '').toLowerCase(), i = ST.findIndex(s => s.id === id);
    const home = v => ST.findIndex(s => s.views.some(q => q[0] === v));
    if (i < 0 && id === 'claims') { if (!view) view = 'hold'; i = home(view); }
    if (id === 'order' && (view === 'pax' || view === 'wto')) { S.ord = view === 'pax' ? 'ps' : 'wto'; view = 'orb'; } else if (id === 'order' && !view) S.ord = 'wto';
    if (id === 'order') OZ.step = null;
    if (id === 'order' && (view === 'profit-and-production' || view === 'clearing')) { OZ.step = view === 'clearing' ? 'cl' : 'pp'; OZ.y = 2026; view = 'orr'; }   /* OR7: the two steps after the story have their own address */
    else if (id === 'order' && /^(199[5-9]|20[0-2]\d)$/.test(view) && +view <= 2026) { OZ.y = +view; view = 'orr'; } else if (id === 'order' && view === 'german-hypocrisy') view = 'hyp';
    if (i >= 0 && view && !ST[i].views.some(q => q[0] === view)) { const j = home(view); if (j >= 0) i = j; else view = ''; }
    if (i < 0) return; go(i, view || first(i), true);
  }
  const orbitP = () => O ? Promise.resolve(O) : X.load('orbit').then(d => (O = d));
  const ORR = X.orrery ? X.orrery({ V, S, R, h, el, esc, phone, OZ, board: board, vw, reading, legend, tiles, table, emit, sync, host, orbit: orbitP, setV }) : null;
  X.profit = { show, bar, go, detail, apply, footnote, title: TITLE, orrery: ORR,
    where: () => ({ where: 'Station ' + (S.st + 1) + ' · ' + cur().t + (cur().fin ? '' : ' · ' + cur().views.find(v => v[0] === vw())[1] + (S.table ? ' · table' : '')) }),
    get state() { return { st: cur().id, view: vw(), year: S.year, era: S.era ? S.era.slice() : null, table: S.table, win: S.win, ord: S.ord, layer: S.lay, flows: S.flows, sys: S.sys, orbit: O ? O.B.length : 0, terms: Object.assign({}, S.terms), zoom: !!Z, ready: !!D }; },
    stations: ST.map(s => ({ id: s.id, t: s.t, q: s.q, f: s.f, views: s.views.map(v => v[0]) })), notes: Object.assign({}, NOTE),
    copy: () => ST.map(s => ({ id: s.id, q: s.q, q2: s.q2 || null, x: s.x, rd: s.rd, nt: s.nt, more: s.more.slice(), lines: (s.lines || []).slice() })), why: WHY };
  /* the link: #profit/<station>/<view> */
  const hd = X.hashDetail, ad = X.applyDetail;
  X.hashDetail = function () { return X.view === 'profit' ? detail() : hd ? hd() : ''; };
  X.applyDetail = function (hh) { if (X.view === 'profit') { apply(hh); return; } if (ad) ad(hh); };
  const vn = X.viewName; X.viewName = function () { return X.view === 'profit' ? 'the order, ' + cur().t.toLowerCase() : vn ? vn() : ''; };
  X.on('view', v => { if (v !== 'profit') { tipHide(); if (Z) zoomClose(); } });
  /* the page chose this tab before the file loaded (a link straight to it) */
  if (X.view === 'profit') { const h0 = window.__isxHash0 || location.hash; if (/^#\/?profit[^/]*\/./.test(h0)) apply(h0); show(); }
})();
