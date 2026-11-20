"""Build imperial-stack/data/firms.json, the firm web's data (profits and owners), from the merged file of the firm rounds.
Usage: python3 -I tools/firms-data.py <firms-merged-20-nov-2026.json> imperial-stack/data/ownership.json imperial-stack/data/firms.json
The merged file lives in the project (claude/data/firms/); a working copy is not kept in the repo.

Nothing is researched or estimated here. The script only
  1. converts each firm's attributable profit to US dollars at the rate the merged file states;
  2. multiplies it by each holder's printed stake where the merged file marks the row "attributed" (attributed profit*);
  3. adds up coverage per firm (% attributed, % passing through nominees, the rest dispersed or not disclosed);
  4. gives every row a short name, a home country to filter by and a holder type to colour by, by the rules below.
It stops if a count or a figure differs from what the merge round reported."""
import json, re, sys

src, own_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
M = json.load(open(src, encoding='utf-8'))
OWN = json.load(open(own_path, encoding='utf-8'))['firms']

# ---- the ring's order: the layers of spec 4b. A layer with no profiled firm is a sector row.
LAYERS = [('Models and platforms', 'Platforms'), ('Chip design and IP', 'Chip design'), ('Design software (EDA)', 'EDA'),
          ('Foundry and memory', 'Foundry · memory'), ('Tools and materials', 'Tools'), ('Packaging and assembly', 'Packaging'),
          ('Legacy chips', 'Legacy'), ('Capital and state vehicles', 'Capital'), ('Power, grid and data-centre construction', 'Power'),
          ('Critical raw materials', 'Materials')]
LIX = {l[0]: i for i, l in enumerate(LAYERS)}

# ---- short names on the ring; the card carries the full name
SHORT = {'alibaba': 'Alibaba', 'tencent': 'Tencent', 'amd': 'AMD', 'arm': 'Arm', 'softbank_group': 'SoftBank', 'huawei': 'Huawei',
         'hua_hong': 'Hua Hong', 'cxmt': 'CXMT', 'ymtc': 'YMTC', 'asm_international': 'ASM Intl', 'besi': 'Besi', 'naura': 'Naura',
         'amec': 'AMEC', 'zeiss_group': 'Zeiss', 'zeiss_smt': 'Zeiss SMT', 'foxconn_hon_hai': 'Foxconn', 'nxp': 'NXP',
         'wingtech': 'Wingtech', 'samsung': 'Samsung'}
# ---- the page's own record of the firm (data/ownership.json): its footprint on the globe, and its listing where the merged file has none
OLD = {'asml': 'ASML', 'asm_international': 'ASM Intl', 'besi': 'Besi', 'nexperia': 'Nexperia', 'nxp': 'NXP', 'tsmc': 'TSMC',
       'samsung': 'Samsung', 'sk_hynix': 'SK Hynix', 'nvidia': 'Nvidia', 'foxconn_hon_hai': 'Foxconn', 'tokyo_electron': 'Tokyo Electron',
       'applied_materials': 'Applied Materials', 'microsoft': 'Microsoft', 'amazon': 'Amazon', 'alphabet': 'Alphabet', 'meta': 'Meta', 'spacex': 'SpaceX'}
# ---- home country, for the filter. Where the firm operates from, not where it is incorporated (Cayman and Hong Kong shells of
#      Chinese groups count as China); the card prints the seat as the merged file has it. A star: not read in a filing.
HOME = {}
for c, ids in {'United States': 'microsoft alphabet amazon meta oracle openai coreweave nvidia amd broadcom micron intel globalfoundries applied_materials lam_research kla spacex',
               'China': 'alibaba tencent baidu bytedance huawei hisilicon cambricon smic hua_hong cxmt ymtc naura amec wingtech bigfund_i bigfund_ii bigfund_iii',
               'Taiwan': 'tsmc foxconn_hon_hai', 'South Korea': 'samsung sk_hynix', 'Japan': 'softbank_group tokyo_electron',
               'Netherlands': 'asml asm_international besi nxp nexperia', 'Germany': 'zeiss_group zeiss_smt', 'United Arab Emirates': 'mgx',
               'United Kingdom': 'arm'}.items():
    for i in ids.split(): HOME[i] = c
HOME_STAR = {'arm'}   # the merged file has "not read (D5 gap)"; the United Kingdom is general knowledge

# ---- one node for a holder that appears under several printed names; every row keeps its name as printed
ALIAS = [(r'^BlackRock', 'BlackRock'), (r'Vanguard', 'Vanguard'), (r'^Capital (World|Research)', 'Capital Research'),
         (r'^FMR LLC', 'FMR (Fidelity)'), (r'^(JPMorgan Chase|JP Morgan Asset)', 'JPMorgan'),
         (r'^(Norges Bank|Government of Norway)', 'Norges Bank'), (r'^Mubadala', 'Mubadala'),
         (r'HKSCC', 'HKSCC Nominees'), (r'^(财政部|Ministry of Finance)', 'Ministry of Finance (China)'),
         (r'^(国开金融|China Development Bank Capital)', 'CDB Capital (国开金融)'),
         (r'^(上海国盛|Shanghai Guosheng)', 'Shanghai Guosheng (上海国盛)'), (r'^Elon Musk', 'Elon Musk'), (r'^Antonio J\. Gracias', 'Antonio J. Gracias'),
         (r'^Advance Data Services', 'Advance Data Services (Ma Huateng)'), (r'^GIC$', 'GIC')]
# ---- a holder that is itself a firm on the ring: marked, drawn as a line between the two firms, never looked through
RING = [(r'^SoftBank Group', 'softbank_group'), (r'^Google LLC', 'alphabet'), (r'^NVIDIA Corporation', 'nvidia'), (r'^Big Fund II \(', 'bigfund_ii'),
        (r'^Big Fund I \(', 'bigfund_i'), (r'^China IC Fund Phase II', 'bigfund_ii'), (r'^Applied Materials Inc', 'applied_materials'),
        (r'^ASML Holding', 'asml'), (r'^Wingtech Technology Co', 'wingtech'), (r'^Microsoft$', 'microsoft')]
# SMIC's "China Integrated Circuit Industry Investment Fund Co., Ltd. (Big Fund)" stays a holder of its own: the source does not state the phase.

def holder_type(t):
    """state | founder | firm | manager | employees | other | pass, from the type as the merged file words it."""
    s = t.lower()
    if 'pass-through' in s: return 'pass'
    if 'employee' in s: return 'employees'
    if 'aggregate' in s or '(group)' in s or 'type not stated' in s or s in ('investor', 'partnership (control not read)'): return 'other'
    if 'foundation' in s: return 'other'
    if 'not on state' in s or 'private fund' in s: return 'manager'
    if 'non-state' in s: return 'firm'
    if 'state' in s or 'sovereign' in s: return 'state'
    if 'individual' in s or 'founder' in s or 'insiders' in s or 'controlled by chen' in s: return 'founder'
    if 'asset manager' in s or 'index fund' in s or 'etf' in s or 'investment manager' in s or 'hedge fund' in s or 'fund' in s: return 'manager'
    return 'firm'

def country(c):
    """One name per country for the sums; the row keeps the wording of the source."""
    s = c.strip()
    if re.match(r'^(US|United States)\b', s): return 'United States'
    if re.match(r'^UK / US', s) or s in ('various', 'not printed', 'not stated in source'): return 'Not stated'
    if 'owner China' in s or s.startswith('China'): return 'China'
    return re.sub(r'\s*\(.*$', '', s)

def curl(v):
    """Curled quotation marks in every text the page prints (house style); web addresses are left alone."""
    if isinstance(v, dict): return {k: (x if k == 'doc' and isinstance(x, list) else curl(x)) for k, x in v.items()}
    if isinstance(v, list): return [curl(x) for x in v]
    if not isinstance(v, str) or v.startswith('http'): return v
    v = re.sub(r"(?<=\w)'(?=\w)", '’', v); v = re.sub(r'"([^"]*)"', r'“\1”', v); v = re.sub(r"'([^']*)'", r'‘\1’', v)
    return v.replace("'", '’').replace('"', '”')

num = lambda v: isinstance(v, (int, float)) and not isinstance(v, bool)
r1 = lambda v: round(v, 1) if abs(v) >= 10 else round(v, 3)

firms, fx = [], {}
for f in M['firms']:
    i, loc, rate = f['id'], f['net_income_local_m'], f['fx_rate']
    usd = (loc * rate if f['fx_direction'] == 'USD per local' else loc / rate) if num(loc) and num(rate) else None
    seat = f['seat_country']; g = '*general knowledge' in seat
    seat = re.sub(r'\s*\*general knowledge.*$', '', seat)
    old = OLD.get(i); o = OWN.get(old) if old else None
    lst = f['listing']
    if o and re.match(r'^(not |listed June 2026 \(venue not read\)|TWSE \(not read\))|\*general knowledge', lst): lst, lsrc = o['listing'], 'page'
    else: lsrc = ''
    if o and (seat.startswith('not ') or not f['seat_detail']): seatd = o['seat']['city']
    else: seatd = f['seat_detail']
    if seat.startswith('not '): seat = ''
    d = M['documents'].get(i)
    row = {'id': i, 'n': SHORT.get(i, re.sub(r'\s*\(.*$', '', f['firm'])), 'full': f['firm'], 'L': LIX[{'Tools and materials': 'Tools and materials'}.get(f['layer'], f['layer'])],
           'home': HOME[i], 'seat': seat, 'city': seatd, 'list': lst, 'fy': f['fiscal_year'], 'fye': f['fiscal_year_end'], 'ccy': f['currency'],
           'loc': loc, 'fx': rate if num(rate) else None, 'fxd': 'u' if f['fx_direction'] == 'USD per local' else 'l', 'fxb': f['fx_basis'],
           'usd': None if usd is None else r1(usd), 'def': f['definition'], 'fl': f['flags']}
    if f['starred'] == 'Y': row['x'] = 1
    if g or i in HOME_STAR: row['hx'] = 1
    if lsrc: row['lp'] = 1
    if old and o: row['old'] = old; row['sites'] = len(o.get('sites') or [])
    if d: row['doc'] = [d['doc'], d['url']]
    if M['coverage_notes'].get(i): row['note'] = M['coverage_notes'][i]
    firms.append(row); fx[i] = row
    row['_usd'] = usd

ST = {v: k for k, v in M['rules']['status'].items()}
holders, cov = [], {i: [0.0, 0.0, 0] for i in fx}
for h in M['holders']:
    i, p, st = h['firm_id'], h['pct_shares'], h['status']
    f = fx[i]; name = h['holder']
    key = next((a for rx, a in ALIAS if re.search(rx, name)), name)
    ring = next((a for rx, a in RING if re.search(rx, name)), None) if h['mapped_firm'] == 'Y' else None
    assert not (h['mapped_firm'] == 'Y' and ring is None and not re.search(r'Big Fund\)', name)), 'mapped holder without a ring firm: ' + name
    att = f['_usd'] * p / 100 if st == 'A' and num(p) and f['_usd'] is not None else None
    cov[i][2] += 1
    if st == 'A' and num(p): cov[i][0] += p
    if st == 'PT' and num(p): cov[i][1] += p
    row = {'f': i, 'n': name, 'k': key, 'p': round(p, 3) if num(p) else None, 'b': h['pct_basis'], 'd': h['as_of'], 'c': country(h['holder_country']),
           't': holder_type(h['holder_type']), 'tr': h['holder_type'], 's': st}
    if row['c'] != h['holder_country']: row['cr'] = h['holder_country']
    if h['pct_votes'] not in ('', None): row['v'] = h['pct_votes']
    if 'holds for clients' in h['holder_type']: row['hc'] = 1
    if ring: row['m'] = ring
    if h['starred'] == 'Y': row['x'] = 1
    if h['flags']: row['fl'] = h['flags']
    if h['page']: row['pg'] = h['page']
    if att is not None: row['a'] = r1(att)
    holders.append(row)
for f in firms:
    a, pt, n = cov[f['id']]
    assert a <= 100.001, f['id'] + ': more than 100% attributed'
    f['cov'] = [round(a, 2), round(pt, 2), n]; del f['_usd']

sectors = [{'id': s['row_id'], 'L': LIX[s['layer']], 'n': s['row'], 'role': s['role'], 'named': s['named'], 'fig': s['figure'], 'v': s['value'] if num(s['value']) else None,
            'unit': s['unit'], 'date': s['date'], 'src': s['source'], 'fl': s['flags']} for s in M['sector_rows']]

# ---- checks against what the merge round reported
assert len(firms) == 49 and len(holders) == 204 and len(sectors) == 4, (len(firms), len(holders), len(sectors))
want = {'tsmc': 55120, 'samsung': 31139, 'softbank_group': 33171, 'zeiss_group': 640, 'coreweave': -1167, 'spacex': -4937}
for k, v in want.items(): assert abs(fx[k]['usd'] - v) < 1, (k, fx[k]['usd'], v)
assert fx['arm']['cov'][0] == 86 and next(h for h in holders if h['f'] == 'arm')['m'] == 'softbank_group'
assert all(h['f'] in fx and (not h.get('m') or h['m'] in fx) for h in holders)
assert sum(1 for h in holders if h['s'] == 'A') == 159
pos = sum(f['usd'] for f in firms if f['usd'] and f['usd'] > 0); att = sum(h['a'] for h in holders if h.get('a') and h['a'] > 0 and fx[h['f']]['usd'] > 0)

firms, holders, sectors = curl(firms), curl(holders), curl(sectors)
out = {'asof': '20 Nov 2026', 'layers': [{'n': a, 's': b} for a, b in LAYERS], 'firms': firms, 'holders': holders, 'sectors': sectors,
       'flagged': len(M['conflicts']), 'sum': {'profit': round(pos), 'attributed': round(att)}}
json.dump(out, open(out_path, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('firms', len(firms), 'holders', len(holders), 'nodes', len({h['k'] for h in holders if not h.get('m')}), 'sector rows', len(sectors),
      '| profits of the firms in profit, USD m:', round(pos), '| attributed*:', round(att), '(%.1f%%)' % (att / pos * 100))
