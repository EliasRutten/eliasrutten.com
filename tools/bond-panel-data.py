"""Build imperial-stack/data/bond-panel.json from the data round's files (F7 and A-bond-market, read 14 Nov 2026).
Usage: python3 bond-panel.py F7.csv A-bond-market.csv out.json"""
import csv, json, sys
f7, ab, out = sys.argv[1:4]
rows = list(csv.DictReader(open(f7)))
months = [r['month'] for r in rows]
assert months[0] == '2016-04' and months[-1] == '2026-10' and len(months) == 127
A = {}
for r in csv.DictReader(open(ab)):
    A.setdefault(r['id'], {})[r['date']] = float(r['value'])
num = lambda k: [round(float(r[k]), 2) for r in rows]
D = {'meta': {'read': '14 Nov 2026', 'from': months[0], 'to': months[-1], 'rule': 'monthly average of daily values',
       'src': {'y3m': 'FRED DGS3MO (3-month Treasury, constant maturity, Fed H.15)', 'y2': 'FRED DGS2', 'y5': 'FRED DGS5', 'y10': 'FRED DGS10', 'y30': 'FRED DGS30',
               'baa': 'FRED BAA (Moody’s seasoned Baa corporate bond yield)', 'aaa': 'FRED AAA (Moody’s seasoned Aaa corporate bond yield)',
               'move': 'ICE BofA MOVE Index, daily closes (Yahoo Finance ^MOVE); monthly average of daily closes',
               'tp': 'Federal Reserve Board, Kim–Wright 10-year term premium (FRED THREEFYTP10)'}},
     'm': months}
for k in ['y3m', 'y2', 'y5', 'y10', 'y30', 'baa', 'aaa']: D[k] = num(k)
D['move'] = [A['MOV'][m] for m in months]
D['tp'] = [round(A['TP'][m], 2) for m in months]
# checks against the project's own series (F7-NOTES): the 10-year equals Y10 in A-bond-market wherever both exist
bad = [m for i, m in enumerate(months) if m in A['Y10'] and abs(A['Y10'][m] - D['y10'][i]) > 0.005]
print('10-year months differing from A-bond-market:', bad)
D['daily'] = [  # F7-NOTES, latest daily curve (FRED daily constant maturity)
  {'k': 'latest', 'd': '12 Nov 2026', 'v': [4.32, 4.86, 4.95, 5.10, 5.43], 'x': 'latest value in FRED'},
  {'k': 'year', 'd': '10 Nov 2025', 'v': [3.95, 3.58, 3.72, 4.13, 4.71], 'x': 'a year before'},
  {'k': 'peak', 'd': '5 Oct 2026', 'v': [4.22, 4.84, 5.06, 5.31, 5.66], 'x': 'the highest 10-year close of 2026'}]
json.dump(D, open(out, 'w'), ensure_ascii=False, separators=(',', ':'))
print('months', len(months), 'MOVE Oct 2026', D['move'][-1], 'max MOVE', max(D['move']), months[D['move'].index(max(D['move']))])
