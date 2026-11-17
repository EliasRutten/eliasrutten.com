"""Build imperial-stack/data/profit.json for the profit dollar tab (profit tab build 1, 17 Nov 2026).
Usage: python3 -I tools/profit-data.py <folder with the project's data files> <out.json>

The folder holds copies of the project's checked files, under their project names:
  claude/data/profit-tab/  chartB-compact.csv, gap-compact.csv, cs-8-economies.csv, cs-us-by-list.csv, positions.csv,
                           D1-*.csv (claims), D2-hyperscalers-wide.csv, D2-ai-trade-weight.csv
  claude/data/S2a/         chartA_return_on_capital_pwt11.csv
Only the columns named below are read, so the full project files and slimmer working copies both work.
The script stops if a check fails: the checks of claude/data/profit-tab/check.py, and those the D1 and D2 notes name."""
import csv, json, statistics as st, sys

d, out = sys.argv[1], sys.argv[2]
rows = lambda f: list(csv.DictReader(open(d + '/' + f, encoding='utf8')))
num = lambda x: None if x in ('', None) else float(x)
fails = []
def check(ok, what):
    if not ok: fails.append(what)

# ---------- the profit equation (BEA national accounts, 4 Nov 2026) ----------
Bk = ['pat_bn', 'pat', 'npi', 'fed', 'sl', 'ct', 'hh', 'ca', 'div', 'disc']
Br = rows('chartB-compact.csv')
for r in Br:
    s = sum(float(r[k]) for k in ['npi', 'fed', 'sl', 'ct', 'hh', 'ca', 'div', 'disc'])
    check(abs(s - float(r['pat'])) <= 0.035, 'equation does not close in ' + r['period'])
check(len(Br) == 67 and Br[0]['period'] == '1960' and Br[-1]['period'] == '2026H1', 'equation rows')
def avg(k, a, b): return round(st.mean(float(r[k]) for r in Br if r['period'].isdigit() and a <= int(r['period']) <= b), 2)
for k, a, b, exp in [('fed', 1960, 1979, 2.96), ('fed', 1980, 1999, 3.80), ('fed', 2000, 2013, 4.48), ('fed', 2014, 2025, 6.33), ('npi', 1960, 1979, 7.96),
                     ('npi', 2014, 2025, 4.45), ('pat', 2014, 2025, 10.24), ('pat', 1960, 1979, 6.45), ('div', 2014, 2025, 6.83), ('hh', 2014, 2025, -5.37),
                     ('ca', 2014, 2025, -2.83), ('ca', 2000, 2013, -4.03), ('sl', 2014, 2025, 0.87)]:
    check(abs(avg(k, a, b) - exp) < 0.011, 'era average %s %d-%d = %s, expected %s' % (k, a, b, avg(k, a, b), exp))
B = [[r['period']] + [float(r[k]) for k in Bk] for r in Br]
gdp = {int(r['period']): float(r['pat_bn']) / float(r['pat']) * 100 for r in Br if r['period'].isdigit()}   # $bn, derived from the two stored columns

# ---------- profits of US-owned firms against profits earned in the US economy ----------
Gr = rows('gap-compact.csv')
for r in Gr:
    n, dm, net = float(r['national']), float(r['domestic']), float(r['net'])
    check(abs(n - dm - net) <= 0.15, 'national - domestic != net in ' + r['year'])
    check(abs(net / n * 100 - float(r['net_pct'])) <= 0.06, 'net share in ' + r['year'])
    if r['receipts']:
        rc, p = float(r['receipts']), float(r['payments'])
        check(abs(rc - p - net) <= 0.15, 'receipts - payments != net in ' + r['year'])
        check(abs(rc / n * 100 - float(r['receipts_pct'])) <= 0.06, 'receipts share in ' + r['year'])
check(len(Gr) == 66, 'gap rows')
G = [[int(r['year'])] + [num(r[k]) for k in ['national', 'domestic', 'net', 'net_pct', 'receipts', 'payments', 'receipts_pct']] for r in Gr]

# ---------- profit capture (Forbes Global 2000 against IMF GDP) ----------
CS = {}
for r in rows('cs-8-economies.csv'):
    check(abs(float(r['profit_share']) / float(r['gdp_share']) - float(r['ratio'])) <= 0.012, 'capture ratio ' + r['window'] + ' ' + r['country'])
    CS.setdefault(r['window'], []).append({'c': r['country'], 'f': int(r['firms']), 'ps': float(r['profit_share']), 'gs': float(r['gdp_share']), 'r': float(r['ratio'])})
USr = rows('cs-us-by-list.csv')
for r in USr: check(abs(float(r['profit_share']) / float(r['gdp_share']) - float(r['ratio'])) <= 0.012, 'US ratio, list ' + r['list'])
US = [[int(r['list']), float(r['profit_share']), float(r['gdp_share']), float(r['ratio'])] for r in USr]
check([u[0] for u in US] == list(range(2011, 2027)), 'US lists 2011-2026')
P = [[r['iso'], float(r['ca_pct_gdp_avg_2018_2025']), float(r['ca_bn_2025']), float(r['profit_share_pct_lists_2019_2026']), float(r['gdp_share_pct_lists_2019_2026']),
      float(r['capture_ratio_lists_2019_2026']), r['group_draft']] for r in rows('positions.csv')]
for p in P: check(abs(p[3] / p[4] - p[5]) <= 0.012, 'position ratio ' + p[0])

# ---------- return on capital (Penn World Table 11.0) ----------
A = {'y': list(range(1980, 2024))}
for r in rows('chartA_return_on_capital_pwt11.csv'): A.setdefault(r['iso'], []).append(float(r['real_return_on_capital_pct']))
for k in A: check(len(A[k]) == 44, 'PWT rows ' + k)

# ---------- claims (Fed Z.1 and DFA via FRED, World Bank, S&P DJI; read 17 Nov 2026) ----------
def series(f, scale):
    y, v, last = [], [], None
    for r in rows(f):
        if r['year'].isdigit(): y.append(int(r['year'])); v.append(round(float(r['value']) / scale, 3 if scale >= 1e6 else 1))
        else: last = [r['year'], round(float(r['value']) / scale, 3 if scale >= 1e6 else 1)]
    return y, v, last
ey, ev, el = series('D1-foreign-holdings-us-shares.csv', 1e6)          # $tn, end of year; last = Q2 2026
ty, tv, tl = series('D1-foreign-holdings-us-treasuries.csv', 1e6)
check(ey == ty == list(range(2000, 2026)) and el[0] == '2026Q2' and tl[0] == '2026Q2', 'holdings years')
check(abs(el[1] - 22.211) < 0.001 and abs(tl[1] - 9.269) < 0.001, 'holdings, Q2 2026')
fy, fe, fel = series('D1-net-foreign-purchases-us-shares.csv', 1e3)    # $bn a year; last = first half of 2026 at an annual rate
_, ft, ftl = series('D1-net-foreign-purchases-us-treasuries.csv', 1e3)
check(fy == list(range(2000, 2026)) and fel[0] == '2026H2', 'flow years')
Tr = rows('D1-top-decile-share-household-shares.csv')
for r in Tr: check(abs(float(r['top1']) + float(r['p90_99']) - float(r['value'])) <= 0.11, 'top decile sum ' + r['year'])
T = {'y': [int(r['year']) for r in Tr if r['year'].isdigit()], 'top10': [float(r['value']) for r in Tr if r['year'].isdigit()], 'top1': [float(r['top1']) for r in Tr if r['year'].isdigit()],
     'last': ['Q2 2026', float(Tr[-1]['value']), float(Tr[-1]['top1'])]}
Sr = rows('D1-sp500-dividends-buybacks.csv')
Sy = [r for r in Sr if r['year'].isdigit() and r['dividends_usd_bn'] and r['buybacks_usd_bn'] and int(r['year']) >= 2008 and r['basis'] in ('sum of four quarters', 'annual row')]
check([int(r['year']) for r in Sy] == list(range(2008, 2025)), 'S&P payout years 2008-2024')
s14 = [r for r in Sy if r['year'] == '2014'][0]
check(abs(float(s14['dividends_usd_bn']) - 350.4) < 0.05 and abs(float(s14['buybacks_usd_bn']) - 553.3) < 0.05, 'S&P 2014 against the press release')
ttm = [r for r in Sr if r['year'].startswith('12 months')][0]
S = {'y': [int(r['year']) for r in Sy], 'div': [round(float(r['dividends_usd_bn']), 1) for r in Sy], 'buy': [round(float(r['buybacks_usd_bn']), 1) for r in Sy],
     'ttm': ['12 months to Sep 2025', round(float(ttm['dividends_usd_bn']), 1), round(float(ttm['buybacks_usd_bn']), 1)]}
Mr = rows('D1-us-share-world-stock-market-value.csv')
for r in Mr: check(abs(float(r['us_bn']) / float(r['world_bn']) * 100 - float(r['value'])) <= 0.01, 'market-value share ' + r['year'])
gs = {u[0] - 1: u[2] for u in US}   # the list of year Y is set against GDP of Y-1, so this is the US share of world GDP in 2010 to 2025
M = {'y': [int(r['year']) for r in Mr], 'mv': [round(float(r['value']), 1) for r in Mr], 'gdp': [gs.get(int(r['year'])) for r in Mr]}

# ---------- the AI trade (10-Ks; Amundi WP 190; Bianco Research) ----------
Xr = rows('D2-hyperscalers-wide.csv')
F5 = ['AMZN', 'GOOGL', 'MSFT', 'META', 'ORCL']
X = {'y': [], 'capex': {k: [] for k in F5}, 'ni': {k: [] for k in F5}, 'sumCapex': [], 'sumNi': [], 'gdpPct': [], 'fy26': {}}
for r in Xr:
    y = int(r['fiscal_year_label']); have = [k for k in F5 if r[k + '_capex_usd_m']]
    check(abs(sum(float(r[k + '_capex_usd_m']) for k in have) - float(r['DERIVED_sum_capex_usd_m'])) < 0.5, 'capital spending sum ' + str(y))
    check(abs(sum(float(r[k + '_net_income_usd_m']) for k in have) - float(r['DERIVED_sum_net_income_usd_m'])) < 0.5, 'net income sum ' + str(y))
    if len(have) == 5:
        X['y'].append(y)
        for k in F5: X['capex'][k].append(round(float(r[k + '_capex_usd_m']) / 1e3, 1)); X['ni'][k].append(round(float(r[k + '_net_income_usd_m']) / 1e3, 1))
        X['sumCapex'].append(round(float(r['DERIVED_sum_capex_usd_m']) / 1e3, 1)); X['sumNi'].append(round(float(r['DERIVED_sum_net_income_usd_m']) / 1e3, 1))
        X['gdpPct'].append(round(float(r['DERIVED_sum_capex_usd_m']) / 1e3 / gdp[y] * 100, 2))   # derived*: fiscal years against calendar-year GDP
    else:
        X['fy26'] = {k: [round(float(r[k + '_capex_usd_m']) / 1e3, 1), round(float(r[k + '_net_income_usd_m']) / 1e3, 1)] for k in have}
check(X['y'] == list(range(2019, 2026)) and sorted(X['fy26']) == ['MSFT', 'ORCL'], 'hyperscaler years')
X['npi'] = [float(r['npi']) for r in Br if r['period'].isdigit() and 2019 <= int(r['period']) <= 2025]
Wr = rows('D2-ai-trade-weight.csv')
W = {'amundi': [[r['date'], float(r['value'])] for r in Wr if r['id'].startswith('AIW-AMUNDI-2')], 'peak': [[r['date'], float(r['value'])] for r in Wr if 'PEAK' in r['id']][0],
     'basket41': [[r['date'], float(r['value'])] for r in Wr if 'BIANCO' in r['id']][0]}
check(len(W['amundi']) == 7 and W['basket41'][1] == 48.68, 'AI-trade weights')

if fails:
    print('\n'.join('CHECK FAILED: ' + f for f in fails)); sys.exit(1)

D = {'meta': {'built': '17 Nov 2026',
              'checks': 'the equation closes in all 67 rows; national - domestic = net = receipts - payments in all 66 years; every ratio = profit share / GDP share; sums and shares recomputed'},
     'B': B, 'G': G, 'CS': CS, 'US': US, 'P': P, 'A': A,
     'H': {'y': ey, 'eq': ev, 'tr': tv, 'last': ['Q2 2026', el[1], tl[1]]},
     'F': {'y': fy, 'eq': fe, 'tr': ft, 'h1': ['First half of 2026, annual rate', fel[1], ftl[1]]},
     'T': T, 'S': S, 'M': M, 'X': X, 'W': W}
json.dump(D, open(out, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print('profit.json written;', 'equation rows', len(B), '· gap rows', len(G), '· lists', len(US), '· positions', len(P), '· all checks passed')
print('2025: capital spending of five firms', X['sumCapex'][-1], '$bn =', X['gdpPct'][-1], '% of GDP*; US share of world market value', M['mv'][-1], 'against GDP share', M['gdp'][-1])
