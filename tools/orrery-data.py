"""Build imperial-stack/data/orrery.json for the orrery, the first view of the profit tab (OB1, 23 Nov 2026;
spec claude/specs/orrery-opener-spec-21-nov.md §4.5, answers §0).
Usage: python3 -I tools/orrery-data.py <raw dir> <orbit.json> <out.json>

<raw dir> holds OR2's raw files (claude/data/orrery/ in the project; OR2-NOTES.md says how they were read):
  OR2-raw-imf-NGDPD.txt, OR2-raw-imf-BCA.txt     line: ISO|latest_actual_year|v1995,...,v2026   (USD bn, IMF WEO Oct 2026)
  OR2-raw-bea-USDIA-income.txt                   line: ISO|BEA name(s)|v1995,...,v2025            (USD m, BEA tokens kept)
Only the rows of the orbit view's countries, the World (G001), the EU (G998) and the booking points are needed; extra rows are ignored.

Rules (the same as OR2-build.py, so the figures equal OR2-A3-derived.csv):
  share         NGDPD(country, year) / NGDPD(World G001, year) x 100
  bcaSum        sum of BCA(country, 1995..year); years with no value add nothing; blank until the first value (China starts in 1997)
  bcaSumPctGdp  bcaSum / NGDPD(country, year) x 100 (a stock over a flow; the method note says so)
  estFrom       the IMF's latest actual year + 1 (the NGDPD row); it drives the WIP marker on estimated years
  income        BEA, income on US direct investment abroad by host country (outward; Elias 22 Nov: outward drives the orrery),
                USD million; (D) and (*) are kept as strings; before 2006 net of withholding taxes, from 2006 gross (one break)
Series are arrays aligned to "years" (1995..2026); income has no value for 2026. The EU (O1-017) is not given a mass: its members
are drawn on their own (draft rule, named in the change note). The placements stay in data/orbit.json ("eras" points there).
The script stops if a count or an anchor does not match OR2-NOTES.md."""
import json, re, sys
raw, orbit, out = sys.argv[1], sys.argv[2], sys.argv[3]
Y = list(range(1995, 2027))
# O1 ids of the orbit view's countries -> ISO3 (from OR2-build.py, the O1 list)
ISO = {'O1-001': 'USA', 'O1-002': 'TWN', 'O1-003': 'JPN', 'O1-004': 'KOR', 'O1-005': 'SGP', 'O1-006': 'GBR', 'O1-007': 'ISR', 'O1-008': 'AUS',
       'O1-009': 'QAT', 'O1-010': 'ARE', 'O1-011': 'IND', 'O1-012': 'SWE', 'O1-013': 'PHL', 'O1-014': 'FIN', 'O1-015': 'NOR', 'O1-016': 'NLD',
       'O1-017': 'EU', 'O1-018': 'DEU', 'O1-019': 'GRC', 'O1-020': 'KAZ', 'O1-021': 'ARG', 'O1-022': 'CHL', 'O1-023': 'CRI', 'O1-024': 'SLV',
       'O1-025': 'PAN', 'O1-026': 'ITA', 'O1-027': 'PRY', 'O1-040': 'PER', 'O1-046': 'BRA', 'O1-049': 'CHN', 'O1-056': 'MYS', 'O1-060': 'RUS',
       'O1-062': 'SRB', 'O1-067': 'IDN', 'O1-068': 'MMR', 'O1-069': 'MOZ', 'O1-070': 'ZAF', 'O1-071': 'ZMB', 'O1-073': 'TZA', 'O1-078': 'COD',
       'O1-079': 'GIN', 'O1-080': 'BOL', 'O1-081': 'ZWE', 'O1-082': 'MLI', 'O1-083': 'GAB', 'O1-084': 'GHA', 'O1-085': 'MDG', 'O1-086': 'RWA',
       'O1-087': 'NGA', 'O1-088': 'NCL', 'O1-089': 'VNM', 'O1-090': 'THA', 'O1-091': 'MEX', 'O1-092': 'SAU', 'O1-093': 'EGY', 'O1-095': 'UGA',
       'O1-096': 'CAN', 'O1-097': 'FRA'}
# booking points (spec §3): small gold diamonds without mass; Singapore is also a body of its own
BOOK = {'IRL': 'Ireland', 'LUX': 'Luxembourg', 'BMU': 'Bermuda', 'UKC': 'UK Caribbean islands', 'SGP': 'Singapore'}
BOOK_NOTE = {'UKC': 'BEA aggregate: British Virgin Islands, Cayman Islands, Montserrat, Turks and Caicos'}

def rows(f, n):
    out = {}
    for ln in open(raw + '/' + f, encoding='utf8').read().splitlines():
        if not ln.strip(): continue
        p = ln.split('|'); assert len(p) == n, (f, ln[:40]); out[p[0]] = p[1:]
    return out
num = lambda s: None if s.strip() == '' else float(s)
G = {k: (v[0], [num(x) for x in v[1].split(',')]) for k, v in rows('OR2-raw-imf-NGDPD.txt', 3).items()}
CA = {k: [num(x) for x in v[1].split(',')] for k, v in rows('OR2-raw-imf-BCA.txt', 3).items()}
INC = {k: (v[0], [x.strip() for x in v[1].split(',')]) for k, v in rows('OR2-raw-bea-USDIA-income.txt', 3).items()}
fails = []
def check(ok, what):
    print(('ok   ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
check(all(len(v[1]) == 32 for v in G.values()) and all(len(v) == 32 for v in CA.values()), 'IMF rows have 32 values (1995-2026)')
check(all(len(v[1]) == 31 for v in INC.values()), 'BEA rows have 31 values (1995-2025)')
W = G['G001'][1]
r = lambda x, d=3: None if x is None else round(x, d)

O = json.load(open(orbit, encoding='utf8'))
ids = [b['id'] for b in O['B'] if b['id'] in ISO]
check(len(ids) == len(ISO), 'every mapped O1 id is a body of the orbit view (%d of %d)' % (len(ids), len(ISO)))
bodies = {}
def body(iso, oid=None, name=None):
    b = {'id': oid, 'name': name}
    if iso in G and iso != 'G998':
        pcol, g = G[iso]; ca = CA.get(iso, [None] * 32)
        m = re.search(r'(\d{4})', pcol); b['estFrom'] = int(m.group(1)) + 1 if m else None
        b['gdp'] = [r(x) for x in g]
        b['share'] = [None if x is None else r(x / W[i] * 100, 4) for i, x in enumerate(g)]
        b['bca'] = [r(x) for x in ca]
        run, seen, s, sp = 0.0, False, [], []
        for i, x in enumerate(ca):
            if x is not None: run += x; seen = True
            s.append(r(run) if seen else None)
            sp.append(None if not seen or g[i] in (None, 0) else r(run / g[i] * 100, 2))
        b['bcaSum'], b['bcaSumPctGdp'] = s, sp
    else:
        b['note'] = 'No IMF row: not collected' if iso == 'NCL' else 'The EU is not given a mass: its members are drawn on their own' if iso == 'EU' else 'Booking point: no mass in the picture, because its GDP is not what it books'
    if iso in INC:
        b['income'] = [(int(x) if re.fullmatch(r'-?\d+', x) else x if x else None) for x in INC[iso][1]] + [None]
        b['beaName'] = INC[iso][0]
    if iso in BOOK: b['book'] = 1
    if iso in BOOK_NOTE: b['note'] = BOOK_NOTE[iso]
    bodies[iso] = b
for oid in ids: body(ISO[oid], oid, next(x['full'] for x in O['B'] if x['id'] == oid))
for iso, nm in BOOK.items():
    if iso not in bodies: body(iso, None, nm)
    else: bodies[iso]['book'] = 1

# anchors from OR2-NOTES.md (§2 and §3)
check(bodies['USA']['gdp'][-1] == 32642.373, 'USA GDP 2026 = 32,642.373bn')
for iso, v in {'DEU': 101.5, 'JPN': 98.5, 'NLD': 122.0, 'CHN': 29.5, 'USA': -52.2, 'GBR': -53.0}.items():
    got = bodies[iso]['bcaSumPctGdp'][Y.index(2025)]
    check(abs(got - v) < .06, '%s summed current account 2025 = %.2f%% of GDP (OR2: %.1f%%)' % (iso, got, v))
check(bodies['CHN']['bcaSum'][1] is None and bodies['CHN']['bcaSum'][2] is not None, 'China’s sum starts in 1997')
check([bodies['CAN']['income'][Y.index(y)] for y in (2009, 2020, 2025)] == [15145, 16391, 26773], 'BEA outward Canada 2009, 2020, 2025 = 15,145; 16,391; 26,773')
check(abs(bodies['USA']['share'][0] - 24.2985) < .01, 'US share of world GDP 1995 = 24.30% (IMF)')
check(bodies['DEU']['bcaSum'][Y.index(2019)] > bodies['CHN']['bcaSum'][Y.index(2019)], 'Germany’s summed surplus is larger than China’s in 2019 (spec §4.2)')
check(bodies['DEU']['bcaSumPctGdp'][Y.index(2025)] > 3 * bodies['CHN']['bcaSumPctGdp'][Y.index(2025)], 'Germany 2025 more than three times China, as % of GDP')

# the events (spec §6, Brexit added on Elias’s answer; dates as OR1b and OR2 read them; links only where a round opened the page)
EV = [('E1', 1995, '1995-01-01', 'WTO, TRIPS', 0, 'The WTO opens. Intellectual property is protected by treaty from day one.', 'WTO (opened in OR1b, 21 Nov 2026), link not stored', None),
      ('E2', 2001, '2001-12-11', 'China joins', .05, 'China joins the WTO, on the assembly orbit.', 'WTO (opened in OR1b), link not stored', None),
      ('E3', 2008, '2008-09-15', 'Lehman', .15, 'Lehman Brothers fails. The financial centre is rescued; the order holds.', 'SEC filing (secondary in OR1b); first G20 summit 15 Nov 2008 (opened), link not stored', None),
      ('E4', 2014, '2014-03-06', 'Crimea', .30, 'Russia takes Crimea. Washington answers with sanctions.', 'Executive Order 13660, Federal Register (opened in OR1b); annexation treaty 18 Mar 2014, link not stored', None),
      ('E5', 2016, '2016-06-23', 'Brexit', .38, 'Britain votes to leave the European Union. The old core starts to come apart.', 'Electoral Commission, report on the referendum of 23 June 2016 (read in OR2, 22 Nov 2026); exit day 31 Jan 2020, 11 p.m. (S.I. 2020/74)', 'https://www.electoralcommission.org.uk/research-reports-and-data/our-reports-and-data-past-elections-and-referendums/report-23-june-2016-referendum-uks-membership-european-union'),
      ('E6', 2017, '2017-08-18', 'Section 301', .45, 'Robert Lighthizer becomes Trade Representative and opens an investigation into China’s technology practices.', 'USTR: Lighthizer confirmed 11 May 2017; Section 301 investigation 18 Aug 2017 (opened in OR1b), link not stored', None),
      ('E7', 2018, '2018-07-06', 'Tariffs', None, 'The first tariffs on China.', 'Section 232, 23 Mar 2018; Section 301 tariffs 6 Jul 2018 (OR1b), link not stored', None),
      ('E8', 2019, '2019-12-11', 'Appellate Body stops', .60, 'The WTO’s Appellate Body can no longer hear appeals. Washington had blocked every new appointment since 2017.', 'WTO annual report (opened in OR1b), link not stored', None),
      ('E9', 2020, '2020-03-11', 'Covid', .65, 'A pandemic breaks the supply chains.', 'WHO, 11 Mar 2020 (opened in OR1b), link not stored', None),
      ('E10', 2022, '2022-02-26', 'Reserves frozen · chip controls', .80, 'Russia’s central bank reserves are frozen. In October, the first chip export controls on China.', 'Joint statement 26 Feb 2022 (secondary in OR1b; US prohibition 28 Feb); BIS rule 7 Oct 2022 (opened), link not stored', None),
      ('E11', 2025, '2025-12-12', 'Tariffs · Pax Silica', 1.0, 'Tariffs on the whole world, then Pax Silica: the silicon curtain.', 'Executive Order 14257, 2 Apr 2025 (opened in OR1b); State Department: Pax Silica inaugurated by the Declaration of 12 Dec 2025 (the US–Japan preamble the day before; OR2, 21 Nov 2026)', 'https://www.state.gov/releases/office-of-the-spokesperson/2025/12/under-secretary-helberg-will-kick-off-pax-silica-summit-with-landmark-declaration-signing')]
events = [dict(id=i, year=y, date=d, mark=m, step=s, line=l, src=src, url=u) for i, y, d, m, s, l, src, u in EV]
# tension e (spec §5): a step at each event year, linear in between; 2026 stays split
steps = {e['year']: e['step'] for e in events if e['step'] is not None}; steps[2026] = 1.0
ks = sorted(steps); tension = {}
for y in Y:
    a = max(k for k in ks if k <= y); b = min(k for k in ks if k >= y)
    tension[str(y)] = steps[a] if a == b else r(steps[a] + (steps[b] - steps[a]) * (y - a) / (b - a), 4)
check(tension['2016'] == .38 and tension['2019'] == .6 and tension['2025'] == 1.0 and tension['1995'] == 0, 'tension at 1995, 2016, 2019, 2025 = 0, 0.38, 0.60, 1.0 (spec §5)')

D = {'status': 'preliminary',
     'built': '23 Nov 2026 (OB1)',
     'vintage': {'gdp': 'IMF World Economic Outlook, October 2026 (database file WEOOct2026all.xlsx; read 21 Nov 2026 in OR2)',
                 'bca': 'IMF World Economic Outlook, October 2026 (current accounts; read 21 Nov 2026 in OR2)',
                 'income': 'BEA, US direct investment abroad: income without current-cost adjustment, by detailed country, 1995–2025 (files of 1 Jul 2020 to 27 Aug 2026; read 21 Nov 2026 in OR2); before 2006 net of withholding taxes, from 2006 gross'},
     'src': {'gdp': ['IMF World Economic Outlook, Oct 2026: GDP and current accounts, USD', 'https://data.imf.org/en/datasets/IMF.RES:WEO'],
             'income': ['BEA, income on US direct investment abroad by detailed country', 'https://www.bea.gov/international/di1usdbal']},
     'years': Y, 'world': [r(x) for x in W],
     'bodies': bodies, 'eras': {'from': 'data/orbit.json', 'wto': 'wsec, wring', 'ps': 'sec, ring, sys'},
     'events': events, 'tension': tension, 'hypocrisy': {'quotes': []}}
if fails: sys.exit('\n%d check(s) failed' % len(fails))
json.dump(D, open(out, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print('wrote', out, len(bodies), 'bodies')
