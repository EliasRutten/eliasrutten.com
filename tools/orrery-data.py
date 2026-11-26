#!/usr/bin/env python3
"""Builds imperial-stack/data/orrery.json (the orrery: OB1 and OB2) from OR2's CSVs and the D6 subset.
Usage: python3 -I tools/orrery-data.py <folder with the CSVs: the work repository's data/orrery/> [out.json]
Rules: a series is an array aligned to `years` (1995..2026); blank stays null (never zero); values are rounded to 3 decimals (GDP, USD bn),
share to 4, % of GDP to 2. Bodies are the orbit view's (data/orbit.json) single economies that have an IMF row; groups get no mass.
Stops on a count mismatch or if an anchor from OR2's notes is off (US GDP 2026, 2025 summed current account % of GDP)."""
import csv, json, sys, os
src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else 'imperial-stack/data/orrery.json'
YEARS = list(range(1995, 2027)); IX = {y: i for i, y in enumerate(YEARS)}
def rows(f):
    with open(os.path.join(src, f), newline='', encoding='utf-8') as fh: return list(csv.DictReader(fh))
orbit = json.load(open('imperial-stack/data/orbit.json'))
A1, A3, B = rows('OR2-A1-imf-weo-oct2026.csv'), rows('OR2-A3-derived.csv'), rows('OR2-B-bea-di-income.csv')
iso_of = {}
for r in A1: iso_of[r['country_id']] = r['iso3']
S = {}   # (series, id) -> array
def put(series, cid, y, v, nd):
    if v in ('', None) or not (1995 <= int(y) <= 2026): return
    S.setdefault((series, cid), [None] * 32)[IX[int(y)]] = round(float(v), nd)
for r in A1:
    if r['country_id'] == 'ADD': r['country_id'] = 'ADD:' + r['iso3']
for r in A3:
    if r['country_id'] == 'ADD': r['country_id'] = 'ADD:' + r['iso3']
for r in A1:
    if r['series'] == 'NGDPD': put('gdp', r['country_id'], r['year'], r['value'], 3)
    if r['series'] == 'BCA': put('bca', r['country_id'], r['year'], r['value'], 3)
    if r['series'] == 'BCA_NGDPD': put('bcap', r['country_id'], r['year'], r['value'], 2)
for r in A3:
    if r['series'] == 'share_of_world_gdp': put('share', r['country_id'], r['year'], r['value'], 4)
    elif r['series'] == 'cumulative_current_account_from_1995': put('sum', r['country_id'], r['year'], r['value'], 1)
    elif r['series'] == 'cumulative_current_account_from_1995_pct_of_gdp': put('sumpct', r['country_id'], r['year'], r['value'], 2)
series_names = sorted({r['series'] for r in A3}); 
pct_name = [s for s in series_names if 'pct' in s or 'percent' in s or '%' in s]
if not any(k[0] == 'sumpct' for k in S): raise SystemExit('A3 % of GDP series not found; A3 series are: ' + ', '.join(series_names))
for r in B:
    if r['series'] == 'USDIA_income_outward': put('inc', r['country_id'] if r['country_id'] != 'ADD' else 'ADD:' + r['iso3'], r['year'], r['value'], 0)
ids = {b['id'] for b in orbit['B']}
add = {r['country_id']: r for r in B if r['country_id'].startswith('ADD') or r['country_id'] not in ids}
bodies = {}
for b in orbit['B']:
    cid = b['id']; iso = iso_of.get(cid)
    if not iso: continue
    o = {'iso': iso}
    for k in ('gdp', 'share', 'sum', 'sumpct', 'inc'):
        a = S.get((k, cid))
        if a: o[k] = a
    bodies[cid] = o
# booking points that are not orbit bodies (BEA income only): ADD rows
extra = {}
for r in B:
    if r['series'] == 'USDIA_income_outward' and r['country_id'].startswith('ADD') and r['iso3'] not in extra:
        e = extra.setdefault(r['iso3'], {'name': r['country'].replace(' (BEA aggregate)', ''), 'iso': r['iso3']})
        for k in ('gdp', 'share', 'sum', 'sumpct', 'inc'):
            if S.get((k, 'ADD:' + r['iso3'])): e[k] = S[(k, 'ADD:' + r['iso3'])]
brx = {r['series']: r for r in rows('OR2-C-brexit.csv')}
d6 = rows('D6-low-tax-subset-2024.csv')
# anchors (OR2 notes §3)
us = [k for k, v in iso_of.items() if v == 'USA'][0]; de = [k for k, v in iso_of.items() if v == 'DEU'][0]
assert abs(S[('gdp', us)][IX[2026]] - 32642.373) < 0.01, 'US GDP 2026'
assert abs(S[('sumpct', de)][IX[2025]] - 101.5) < 0.1, 'Germany 2025 summed CA % of GDP'
cn = [k for k, v in iso_of.items() if v == 'CHN'][0]; assert abs(S[('sumpct', cn)][IX[2025]] - 29.5) < 0.1 and S[('sumpct', cn)][IX[1996]] is None
EV = [  # spec §6 (dates checked in OR1b; the Brexit referendum 23 Jun 2016 and exit day 31 Jan 2020 read in OR2 part C). Lines are drafts.
 (1995, '1995-01-01', 0.00, 'The WTO opens', 'The WTO opens. Intellectual property is protected by treaty from day one.', 'WTO, 1 Jan 1995'),
 (2001, '2001-12-11', 0.05, 'China joins', 'China joins the WTO, on the assembly orbit.', 'WTO, 11 Dec 2001'),
 (2008, '2008-09-15', 0.15, 'Lehman', 'Lehman Brothers fails. The financial centre is rescued; the order holds.', 'SEC filing, 15 Sep 2008 (secondary)'),
 (2014, '2014-03-06', 0.30, 'Crimea', 'Russia takes Crimea. Washington answers with sanctions.', 'Executive Order 13660, 6 Mar 2014 (Federal Register)'),
 (2016, brx['brexit_referendum_date']['value'], 0.38, 'Brexit', 'Britain votes to leave the European Union. The old core starts to come apart.', 'Electoral Commission, referendum of 23 Jun 2016; exit day 31 Jan 2020 (S.I. 2020/74)'),
 (2017, '2017-08-18', 0.45, 'Section 301', 'Robert Lighthizer becomes Trade Representative and opens an investigation into China’s technology practices.', 'USTR, 18 Aug 2017'),
 (2019, '2019-12-11', 0.60, 'Appellate Body', 'The WTO’s Appellate Body can no longer hear appeals. Washington had blocked every new appointment since 2017.', 'WTO annual report, 11 Dec 2019'),
 (2020, '2020-03-11', 0.65, 'Covid', 'A pandemic breaks the supply chains.', 'WHO, 11 Mar 2020'),
 (2022, '2022-02-26', 0.80, 'Reserves frozen', 'Russia’s central bank reserves are frozen. In October, the first chip export controls on China.', 'Joint statement 26 Feb 2022 (secondary); BIS rule 7 Oct 2022'),
 (2025, '2025-12-12', 1.00, 'Pax Silica', 'Tariffs on the whole world, then Pax Silica: the silicon curtain.', 'EO 14257, 2 Apr 2025; Pax Silica launched 12 Dec 2025 (State Department)')]
steps = {e[0]: e[2] for e in EV}; tension = {}; last = 0.0; nxt = [e for e in EV]
for i, y in enumerate(YEARS):
    # steps take effect in their year; the tension between events moves linearly with the year
    prev = max([e for e in EV if e[0] <= y], key=lambda e: e[0]); later = [e for e in EV if e[0] > y]
    if later:
        n = later[0]; t = prev[2] + (n[2] - prev[2]) * (y - prev[0]) / (n[0] - prev[0])
    else: t = prev[2]
    tension[str(y)] = round(t, 3)
data = {'status': 'preliminary',
 'vintage': {'gdp': 'IMF World Economic Outlook, October 2026 (13 Oct 2026); read 21 Nov 2026', 'bca': 'IMF WEO Oct 2026, BCA', 'income': 'BEA, direct investment income without current-cost adjustment, outward, by detailed country; files dated 1 Jul 2020 to 27 Aug 2026; read 21 Nov 2026; net of withholding taxes before 2006, gross from 2006', 'profit2024': 'BEA, Activities of U.S. Multinational Enterprises 2024 (preliminary, 20 Nov 2026)'},
 'years': YEARS, 'estFrom': {k: S and None for k in ()},
 'bodies': bodies, 'booking': extra,
 'events': [{'id': 'E%02d' % (i + 1), 'year': e[0], 'date': e[1], 'step': e[2], 'label': e[3], 'line': e[4], 'src': e[5]} for i, e in enumerate(EV)],
 'tension': tension,
 'profit2024': [{'line': r['line'], 'sales': int(r['sales_usd_m']), 'ni': int(r['net_income_usd_m']), 'margin': float(r['net_income_to_sales_pct']), 'shNi': float(r['share_of_world_net_income_pct']), 'shSales': float(r['share_of_world_sales_pct'])} for r in d6],
 'hypocrisy': json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'orrery-hypocrisy.json'), encoding='utf-8'))}
# estimate flags: the IMF's own "estimate_from_year" per row
est = {}
for r in A1:
    if r['series'] == 'NGDPD' and r['estimate_from_year']: est[r['country_id']] = int(r['estimate_from_year'])
for cid, o in bodies.items():
    if cid in est: o['estFrom'] = est[cid]
bodies = data['bodies']
del data['estFrom']
json.dump(data, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('bodies', len(bodies), 'booking points', len(extra), 'bytes', os.path.getsize(out))
