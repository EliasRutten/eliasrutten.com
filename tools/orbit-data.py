"""Build imperial-stack/data/orbit.json for the orbit view of the profit dollar (station 3, The order; 18 Nov 2026).
Usage: python3 -I tools/orbit-data.py <O1-countries.csv> <out.json>

The CSV is the project's claude/data/orbit/O1-countries.csv (or a working copy with the columns named in COLS). One row is one
country or regional group; the view is drawn from this file alone, so the list grows as the research grows: give a row a sector and
it becomes a body of its own.

Placement (spec profit-tab-v4 §4; addendum §2, Elias may override):
  system   an extraction row follows its extraction_zone_flag (overlap / China side / US side / unassigned); a signatory of both
           Pax Silica and WAICO sits in the overlap, and so do the rows named in OVERLAP (addendum §2.2); a Pax Silica signatory
           or participant is in the US system; a WAICO member in China's; a signatory of the AI statement, an EU member or a US
           treaty ally is in the US system, outside Pax Silica; a row on no list is a swing state, between the two.
  angle    one sector a row: the first entry of chain_sectors_draft (addendum §2.8); the others go to its card. A row without
           a sector is “role not collected” and is grouped with its like (by list and region); an EU member without a sector
           takes the EU's.
  radius   the tier follows the sector: tools and chips on the inner orbit (privileged producers); assembly, sites and energy on
           the middle one; minerals on the outer one; a role not collected at the edge. Markets and finance: inner for the old
           core, middle for the rest.
  WTO      one system: the old triad core (the EU and its members, Japan, the United Kingdom: WTO_CORE and the eu column) sits
           with the US at the centre; China is on the assembly orbit, from 2001 (WTO_AT).
The script stops if a count does not match the O1 notes."""
import csv, json, re, sys
src, out = sys.argv[1], sys.argv[2]
COLS = ['id', 'name', 'type', 'region', 'members_if_group', 'pax_silica', 'taiwan_participant', 'ai_opportunity', 'waico', 'brics', 'eu', 'us_security_treaty',
        'chain_sectors_draft', 'tier_draft', 'role_in_chain', 'role_source_status', 'extraction_minerals', 'usgs_share_of_world_mine_output',
        'mine_owner_or_financier_link', 'extraction_zone_flag', 'flags']
rows = [{k: (r.get(k) or '').strip() for k in COLS} for r in csv.DictReader(open(src, encoding='utf8'))]
SECTORS = ['Tools and chips', 'Assembly and sites', 'Energy', 'Minerals', 'Markets and finance', 'Role not collected']
SEC = {'tools': 0, 'chips': 0, 'design': 0, 'materials': 0, 'assembly': 1, 'sites': 1, 'logistics': 1, 'energy': 2, 'minerals': 3, 'markets': 4, 'finance': 4, 'regulation': 4, 'minerals(owner)': 4}
OVERLAP = ['Kazakhstan', 'Serbia', 'Malaysia']                      # addendum §2.2
WTO_CORE = ['Japan', 'United Kingdom']                              # with the EU and its members: the old triad core (spec §4)
WTO_AT = {'China': (1, 2, 'on the assembly orbit, from 2001')}      # sector, orbit, note (spec §4)
FIG = {'United States': '$1,010bn of US shares bought by foreigners, net, in the 12 months to August 2026 (US Treasury, TIC; checked in the E1 round)'}   # from the row's role_source
SHORT = {'United Arab Emirates': 'UAE', 'United Kingdom': 'UK', 'European Union': 'EU', 'New Caledonia (France)': 'New Caledonia', 'Turkiye': 'Türkiye'}

pax = lambda r: bool(r['pax_silica']) and not r['pax_silica'].startswith('not')
ai = lambda r: bool(r['ai_opportunity']) and not r['ai_opportunity'].startswith('not on')
wai = lambda r: bool(r['waico'])
treaty = lambda r: bool(r['us_security_treaty']) and not r['us_security_treaty'].startswith('no treaty') and r['us_security_treaty'] != 'see rows'
fails = []
def check(ok, what):
    if not ok: fails.append(what)
C = [r for r in rows if r['type'] == 'country']
check(len(rows) == 103, 'rows = %d, expected 103' % len(rows))
check(sum(pax(r) for r in rows) == 26, 'Pax Silica signatories = %d, expected 26' % sum(pax(r) for r in rows))
check(sum(r['ai_opportunity'].startswith('June 2026') for r in rows) == 35, 'AI statement, June = %d, expected 35' % sum(r['ai_opportunity'].startswith('June 2026') for r in rows))
check(sum(r['ai_opportunity'].startswith('Sep 2026') for r in C) == 4, 'AI statement, September, named')
check(sum(r['waico'].startswith('founder') for r in rows) == 29, 'WAICO founders = %d, expected 29' % sum(r['waico'].startswith('founder') for r in rows))
check(sum(r['waico'].startswith('later member') for r in C) == 6, 'WAICO later members, named')
check(sum(r['brics'] == 'member' for r in rows) == 10 and sum(r['brics'] == 'partner' for r in rows) == 10 and sum(r['brics'].startswith('contested') for r in rows) == 1, 'BRICS members, partners, contested')
check(sum(bool(r['taiwan_participant']) for r in rows) == 1, 'Taiwan as participant')

EU = next(r for r in rows if r['name'] == 'European Union')
def sector(r):
    s = [x.strip() for x in r['chain_sectors_draft'].split(';') if x.strip()]
    if not s: return (SEC[EU['chain_sectors_draft'].split(';')[0]] if r['eu'] == 'member' else 3 if r['extraction_minerals'] else 5), []   # no sector: an EU member takes the EU's; a row with mine output is a mineral source
    key = lambda x: x if x in SEC else re.sub(r'\(.*\)', '', x)
    for x in s: check(key(x) in SEC, 'unknown sector “%s” in %s' % (x, r['name']))
    return SEC[key(s[0])], s[1:]
def system(r):
    z = r['extraction_zone_flag'].lower()
    if r['tier_draft'] == 'core' or z.startswith('core of the second'): return 'core'
    if z:
        if 'overlap' in z: return 'both'
        if z.startswith('china'): return 'cn'
        if z.startswith('unassigned'): return 'open'
        return 'us'
    if (pax(r) and wai(r)) or r['name'] in OVERLAP: return 'both'
    if pax(r) or r['taiwan_participant']: return 'us'
    if wai(r): return 'cn'
    if ai(r) or r['eu'] == 'member' or treaty(r) or r['us_security_treaty'] == 'see rows': return 'us'
    return 'swing'
def body(r, name=None, members=None, n=None):
    sec, more = sector(r); core = r['eu'] == 'member' or r['name'] in WTO_CORE or r['name'] == 'European Union'
    ring = [1, 2, 2, 3, (1 if core else 2), 4][sec]
    share = r['usgs_share_of_world_mine_output']
    b = {'id': r['id'], 'n': name or SHORT.get(r['name'], r['name']), 'full': r['name'], 'k': 'g' if (members or r['type'] != 'country') else 'c', 'sys': system(r), 'sec': sec, 'ring': ring,
         'wsec': sec, 'wring': 0 if core else ring, 'mem': {'p': r['pax_silica'] if pax(r) else '', 't': r['taiwan_participant'], 'a': r['ai_opportunity'] if ai(r) else '', 'w': r['waico'], 'b': r['brics'], 'e': r['eu'], 's': r['us_security_treaty'] if treaty(r) else ''},
         'role': r['role_in_chain'], 'st': r['role_source_status'], 'more': more, 'mins': r['extraction_minerals'], 'share': share, 'own': r['mine_owner_or_financier_link'], 'zone': r['extraction_zone_flag'], 'flags': r['flags']}
    if r['name'] in WTO_AT: b['wsec'], b['wring'], b['wnote'] = WTO_AT[r['name']]
    if r['name'] in FIG: b['fig'] = FIG[r['name']]
    elif share: b['fig'] = share.split(';')[0].strip() + ' of world mine output (USGS, Mineral Commodity Summaries 2026)'
    if members: b['members'] = members; b['m'] = n or len(members)
    elif r['members_if_group']: b['members'] = [x.strip() for x in r['members_if_group'].split(';')]; b['m'] = len(b['members'])
    return b
own_body = lambda r: bool(r['chain_sectors_draft']) or bool(r['extraction_zone_flag']) or r['name'] in OVERLAP or r['type'] != 'country' or system(r) in ('swing', 'core')
B, groups = [], {}
REG = {'Africa': 'Africa', 'Central Asia': 'Central Asia', 'Southeast Asia': 'South and Southeast Asia', 'South Asia': 'South and Southeast Asia', 'Latin America': 'Latin America', 'Caribbean': 'Latin America'}
for r in rows:
    if own_body(r):
        b = body(r)
        if r['type'] != 'country':
            m = re.search(r'\((\d+)\)|(\d+) further|^.*?, (two) not named', r['name'])
            if r['name'].startswith('AI statement'): b['n'], b['m'] = 'AI statement: 15 not named', 15
            elif r['name'].startswith('WAICO later'): b['n'], b['m'] = 'WAICO: 2 not named', 2
            elif r['name'].startswith('EU states with no signature'): b['n'], b['m'] = 'EU: no signature', 15
            elif r['name'].startswith('Other NATO'): b['n'] = 'Other treaty allies'
        B.append(b)
    else:
        key = ('EU: AI statement only' if r['eu'] == 'member' else 'AI statement only') if system(r) == 'us' else 'WAICO: ' + REG.get(r['region'], 'Europe to the Gulf')
        groups.setdefault(key, []).append(r)
for key, rs in groups.items():
    b = body(rs[0], key, [SHORT.get(r['name'], r['name']) for r in rs]); b['id'] = 'G-' + re.sub(r'[^a-z]+', '-', key.lower()).strip('-')
    b['role'] = 'Role in the chain not collected yet.'; b['st'] = 'GAP'; b['flags'] = ''
    lists = {k: sorted({r[c] for r in rs if r[c]}) for k, c in [('a', 'ai_opportunity'), ('w', 'waico'), ('b', 'brics'), ('s', 'us_security_treaty')]}
    b['mem'].update({'a': '; '.join(lists['a']) if b['mem']['a'] else '', 'w': '; '.join(lists['w']), 'b': '', 's': ''})
    b['bm'] = [SHORT.get(r['name'], r['name']) + ' (' + r['brics'] + ')' for r in rs if r['brics']]
    B.append(b)
names = [b['n'] for b in B]; check(len(names) == len(set(names)), 'a body name is used twice')
check(sum(b['sys'] == 'core' for b in B) == 2, 'two centres')
for nm, sy in [('Taiwan', 'us'), ('Kazakhstan', 'both'), ('Serbia', 'both'), ('Malaysia', 'both'), ('DR Congo', 'both'), ('Indonesia', 'both'), ('Zambia', 'both'), ('Zimbabwe', 'cn'), ('Myanmar', 'cn'), ('Saudi Arabia', 'swing')]:
    check(any(b['n'] == nm and b['sys'] == sy for b in B), 'addendum §2: %s should be %s' % (nm, sy))
if fails: print('\n'.join('CHECK FAILED: ' + f for f in fails)); sys.exit(1)
D = {'meta': {'built': '18 Nov 2026', 'file': 'claude/data/orbit/O1-countries.csv (17 Nov 2026)', 'rows': len(rows)}, 'sectors': SECTORS,
     'counts': {'pax': 26, 'ai': 35, 'ai_sep': 19, 'waico': 29, 'waico_later': 8, 'brics': 10, 'brics_partner': 10}, 'B': B}
json.dump(D, open(out, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
from collections import Counter
print('orbit.json written: %d rows, %d bodies; by system %s; all checks passed' % (len(rows), len(B), dict(Counter(b['sys'] for b in B))))
print('groups:', {k: len(v) for k, v in groups.items()})
