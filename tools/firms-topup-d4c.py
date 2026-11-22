"""Apply the 21 Nov 2026 close-out round (FIRMS-NOTES-D4c) to imperial-stack/data/firms.json.
Usage: python3 -I tools/firms-topup-d4c.py imperial-stack/data/firms.json

Why this exists: firms-merged-21-nov-2026.json lives in the project (claude/data/firms/) and could not be copied into the sandbox as a file.
This script holds the changed rows of that file (holders of micron, samsung, tokyo_electron, asm_international, foxconn_hon_hai; sector rows
SR1, SR2, SR4; the five documents and coverage notes), transcribed in the merged file's own field order, and runs them through the very same
rules as tools/firms-data.py (alias, ring, holder type, country, curled quotes, attributed profit). When the merged file is at hand, a full
rebuild with tools/firms-data.py gives the same result and this script is no longer needed. Nothing is researched or estimated here.
It stops if a count differs from what the D4c notes report (240 holder rows, 49 firms, 4 sector rows)."""
import json, re, sys

path = sys.argv[1]
src = open('tools/firms-data.py', encoding='utf-8').read()
a, b = src.index('# ---- one node for a holder'), src.index('firms, fx = [], {}')
exec(src[a:b])          # ALIAS, RING, holder_type, country, curl, num, r1: one source of truth, no second copy of the rules

D = json.load(open(path, encoding='utf-8'))
firms = {f['id']: f for f in D['firms']}
BASIS = 'of shares outstanding, as printed'
HIST_MGR = 'asset manager (holds for clients)'

# (holder, pct_shares, pct_basis, pct_votes, as_of, holder_country, holder_type, status, mapped_firm, starred, flags, page)
ROWS = {
 'micron': [
  ('The Vanguard Group, Inc.', 8.4, BASIS, '', '2025-10-31', 'US', HIST_MGR, 'HIST', 'N', 'N', 'SUPERSEDED 21 Nov 2026: stale 13G/A (as of 2023-12-29) via the 2025 proxy; the Vanguard Group 13G read 21 Nov reports 0% after the realignment; successor row Vanguard Capital Management below. FY2026 proxy not filed (newest DEF 14A 2025-11-25)', '94-95'),
  ('BlackRock, Inc.', 7.6, BASIS, '', '2025-10-31', 'US', HIST_MGR, 'A', 'N', 'N', 'stale 13G/A (as of 2023-12-31); 2025 proxy. No newer BlackRock filing read. FY2026 proxy not filed (newest DEF 14A 2025-11-25)', '94-95'),
  ('Capital World Investors', 6.3, BASIS, '', '2025-10-31', 'US', HIST_MGR, 'HIST', 'N', 'N', 'SUPERSEDED 21 Nov 2026 by the 13G/A of 14 May 2026 (3.7%, row below); 13G 2025-08-13; division of Capital Research and Management; 2025 proxy', '94-95'),
  ('Vanguard Capital Management', 7.47, 'of shares outstanding, as printed in the 13G (84,297,629 / 1,127,734,051 = 7.475 checked)', '', '2026-04-30 (13G filing date; holding date not carried)', 'US', HIST_MGR, 'A', 'N', 'N', 'PRIMARY: SEC Schedule 13G primary_doc.xml, read 21 Nov 2026. Post-disaggregation entity: not one series with the Vanguard Group rows', '13G'),
  ('Capital World Investors', 3.7, 'of shares outstanding, as printed in the 13G/A (42,208,309 / 1,127,734,051 = 3.743 checked)', '', '2026-05-14 (13G/A filing date; holding date not carried)', 'US', HIST_MGR, 'A', 'N', 'N', 'PRIMARY: SEC Schedule 13G/A, read 21 Nov 2026. Below 5%; shown because it replaces the 6.3% row; division of Capital Research and Management', '13G/A'),
 ],
 'asm_international': [
  ('FMR LLC (Fidelity)', 4.96, BASIS, 4.61, '2026-04-07', 'US', HIST_MGR, 'A', 'N', 'N', 'Newer than the Annual Report table row below (FMR 5.0%, AFM 2025-12-02). AFM register list not opened; Annual Report largest-shareholders table read 21 Nov 2026', 'AFM id 191347'),
  ('Capital Research and Management Company', 0.0, BASIS, 2.88, '2025-03-10', 'US', HIST_MGR, 'STALE', 'N', 'Y', 'reads as a notification of a fall; not used as a current holder', 'AFM id 171408'),
  ('BlackRock, Inc.', 8.6, 'of shares outstanding, as printed (4,222,310 / 49,328,548 issued shares = 8.56 checked)', 9.9, '2023-10-19', 'US', HIST_MGR, 'A', 'N', 'Y', 'Annual Report 2025 largest-shareholders table (as per December 2025); AFM notification of 2023-10-19, over two years old; one-decimal percentage as printed', 'AR 2025, largest shareholders'),
  ('FMR LLC (Fidelity), Annual Report table row', 5.0, 'of shares outstanding, as printed (2,483,114 / 49,328,548 = 5.03 checked)', '', '2025-12-02', 'US', HIST_MGR, 'HIST', 'N', 'N', 'Superseded by the AFM row of 2026-04-07 (4.96%) above', 'AR 2025, largest shareholders'),
  ('Norges Bank', 4.9, 'of shares outstanding, as printed (2,397,015 / 49,328,548 = 4.86 checked)', '', '2023-10-12', 'Norway', 'sovereign wealth fund', 'A', 'N', 'Y', 'AFM notification of 2023-10-12, over two years old; below 5% but in the table', 'AR 2025, largest shareholders'),
  ('Tokyo Electron Ltd.', 4.7, 'of shares outstanding, as printed (2,299,000 / 49,328,548 = 4.66 checked)', '', '2025-11-03', 'Japan', 'corporation (mapped firm)', 'A', 'Y', 'N', 'MAPPED FIRM, NOT LOOKED THROUGH. AFM notification of 2025-11-03; below 5% but in the table', 'AR 2025, largest shareholders'),
  ('WCM (as printed; legal name not carried in the notes)', 3.0, 'of shares outstanding, as printed (1,481,350 / 49,328,548 = 3.00 checked)', '', '2025-12-19', 'not stated', 'asset manager (holds for clients; type inferred from name)', 'A', 'N', 'Y', 'AFM notification of 2025-12-19; below 5% but in the table; treasury shares 446,999 (0.9%) not a holder row', 'AR 2025, largest shareholders'),
 ],
 'samsung': [
  ('Samsung Life Insurance', 8.59, 'of issued common shares (5,919,637,922; checked 8.587)', '', '2025-12-31', 'South Korea', 'corporation (insurer; affiliate; not looked through)', 'A', 'N', 'N', '508,329,171 shares incl. special accounts (5% table). Components in the two DUP rows below. Simply Wall St shows 7.57% on total shares (different basis)', 'p. 247'),
  ('Samsung Life Insurance, common shares excl. special accounts', 8.51, 'of issued common shares (5,919,637,922; 503,904,843 shares, checked 8.512)', '', '2025-12-31', 'South Korea', 'corporation (insurer; affiliate; not looked through)', 'DUP', 'N', 'N', 'Related-party table; component of the 8.59% row above', 'p. 244'),
  ('Samsung Life Insurance, special accounts', 0.075, 'derived* from stated share counts (4,424,328 / 5,919,637,922)', '', '2025-12-31', 'South Korea', 'corporation (insurer; affiliate; not looked through)', 'DUP', 'N', 'N', 'Component of the 8.59% row above', 'p. 244'),
  ('National Pension Service', 7.77, 'of issued common shares (5,919,637,922; 460,135,840 shares, checked 7.773)', '', '2025-12-31', 'South Korea', 'state pension fund', 'A', 'N', 'N', '', 'p. 247'),
  ('BlackRock Fund Advisors', 5.07, 'of shares outstanding, as printed (300,391,061 / 5,919,637,922 = 5.074 checked)', '', '2019-01-28', 'US', HIST_MGR, 'A', 'N', 'Y', 'STALE: the report says it is based on the mass-holding report of 7 Feb 2019; the 20 Nov file read 28 Jan 2019 (holding date vs report date not separated). Status left A as in the 20 Nov file; Elias to decide whether it should be STALE', 'p. 247'),
  ('Samsung C&T', 5.05, 'of issued common shares (5,919,637,922; 298,818,100 shares, checked 5.048)', '', '2025-12-31', 'South Korea', 'corporation (affiliate; not looked through)', 'A', 'N', 'N', 'Affiliate, not looked through. Largest-shareholder and related-parties table now read (p. 244); see rows below', 'p. 247'),
  ('Samsung Fire & Marine Insurance', 1.49, 'of issued common shares (5,919,637,922; 88,058,948 shares, checked 1.488)', '', '2025-12-31', 'South Korea', 'corporation (insurer; affiliate; not looked through)', 'A', 'N', 'N', 'Related-party table', 'p. 244'),
  ('Jae-yong Lee', 1.65, 'of issued common shares (5,919,637,922; 97,414,196 shares, checked 1.646)', '', '2025-12-31', 'South Korea', 'individual (related party of the largest shareholder)', 'A', 'N', 'N', 'Related-party table', 'p. 244'),
  ('Ra-hee Hong', 1.49, 'of issued common shares (5,919,637,922; 87,978,700 shares, checked 1.486)', '', '2025-12-31', 'South Korea', 'individual (related party of the largest shareholder)', 'A', 'N', 'N', 'Related-party table', 'p. 244'),
  ('Seo-hyun Lee', 0.77, 'of issued common shares (5,919,637,922; 45,574,190 shares, checked 0.770)', '', '2025-12-31', 'South Korea', 'individual (related party of the largest shareholder)', 'A', 'N', 'N', 'Related-party table', 'p. 244'),
  ('Boo-jin Lee', 0.71, 'of issued common shares (5,919,637,922; 41,745,681 shares, checked 0.705)', '', '2025-12-31', 'South Korea', 'individual (related party of the largest shareholder)', 'A', 'N', 'N', 'Related-party table', 'p. 244'),
  ('Largest shareholder and related parties, together', 19.84, 'of issued common shares (5,919,637,922; 1,174,366,888 shares, checked 19.838)', '', '2025-12-31', 'South Korea', 'aggregate (related-party table total)', 'AGG', 'N', 'N', 'Includes the Samsung Life, Samsung C&T, Samsung Fire & Marine and family rows above plus two foundations (Samsung Welfare 0.076%, Samsung Culture 0.032%, not separate rows); the group holds 0.10% of the preferred shares as printed. Not added', 'p. 244'),
 ],
 'tokyo_electron': [
  ('日本マスタートラスト信託銀行株式会社 (The Master Trust Bank of Japan, trust account)', 24.43, 'of shares outstanding excluding treasury, as printed', '', '2026-03-31', 'Japan', 'trust bank / nominee (pass-through)', 'PT', 'N', 'N', 'Yuho FY2026 (S100YEOO), 大株主の状況, rank 1; 111,481 thousand shares; read via the irbank XBRL text block', 'Yuho 大株主の状況'),
  ('株式会社日本カストディ銀行 (The Custody Bank of Japan, trust account)', 10.13, 'of shares outstanding excluding treasury, as printed', '', '2026-03-31', 'Japan', 'trust bank / nominee (pass-through)', 'PT', 'N', 'N', 'Rank 2; 46,224 thousand shares', 'Yuho 大株主の状況'),
  ('株式会社TBSホールディングス (TBS Holdings)', 3.31, 'of shares outstanding excluding treasury, as printed', '', '2026-03-31', 'Japan', 'corporation (listed)', 'A', 'N', 'N', 'Rank 3; 15,112 thousand shares', 'Yuho 大株主の状況'),
  ('THE CHASE MANHATTAN BANK, N. A. LONDON SECS LENDING OMNIBUS ACCOUNT', 3.26, 'of shares outstanding excluding treasury, as printed', '', '2026-03-31', 'UK / US (not stated)', 'securities-lending omnibus account (pass-through)', 'PT', 'N', 'N', 'Rank 4; 14,891 thousand shares; standing proxy Mizuho Bank', 'Yuho 大株主の状況'),
  ('STATE STREET BANK AND TRUST COMPANY 505001', 2.53, 'of shares outstanding excluding treasury, as printed', '', '2026-03-31', 'US (not stated)', 'custodian account (pass-through)', 'PT', 'N', 'N', 'Rank 5; 11,569 thousand shares; standing proxy Mizuho Bank', 'Yuho 大株主の状況'),
  ('HSBC HONG KONG-TREASURY SERVICES A/C ASIAN EQUITIES DERIVATIVES', 1.62, 'of shares outstanding excluding treasury, as printed', '', '2026-03-31', 'Hong Kong', 'derivatives hedging account (pass-through)', 'PT', 'N', 'N', 'Rank 6; 7,408 thousand shares; standing proxy Hongkong and Shanghai Banking Corporation', 'Yuho 大株主の状況'),
  ('GOVERNMENT OF NORWAY', 1.47, 'of shares outstanding excluding treasury, as printed', '', '2026-03-31', 'Norway', 'sovereign wealth fund', 'A', 'N', 'N', 'Rank 7; 6,738 thousand shares; standing proxy Citibank N.A.', 'Yuho 大株主の状況'),
  ('JP MORGAN CHASE BANK 385781', 1.45, 'of shares outstanding excluding treasury, as printed', '', '2026-03-31', 'US (not stated)', 'custodian account (pass-through)', 'PT', 'N', 'N', 'Rank 8; 6,644 thousand shares', 'Yuho 大株主の状況'),
  ('BNYM AS AGT/CLTS NON TREATY JASDEC', 1.4, 'of shares outstanding excluding treasury, as printed', '', '2026-03-31', 'US (not stated)', 'custodian account (pass-through)', 'PT', 'N', 'N', 'Rank 9; 6,418 thousand shares; standing proxy MUFG Bank', 'Yuho 大株主の状況'),
  ('JP MORGAN CHASE BANK 385642', 1.24, 'of shares outstanding excluding treasury, as printed', '', '2026-03-31', 'US (not stated)', 'custodian account (pass-through)', 'PT', 'N', 'N', 'Rank 10; 5,678 thousand shares. Table total printed 232,167 thousand = 50.89%; the ten printed rows sum to 232,163 and 50.84 (rounding in the transcription, not reconciled)', 'Yuho 大株主の状況'),
  ('BlackRock Japan Co., Ltd. and 12 others (large-holding report)', 8.37, 'large-holding report, as printed in the Yuho footnote (39,473 thousand shares)', '', '2026-02-27', 'various', 'asset managers (group; holds for clients)', 'AGG', 'N', 'Y', 'Not in the table: TEL could not confirm the holding at 2026-03-31. Report filed 2026-03-04. Replaces the Simply Wall St BlackRock 8.85% snippet', 'Yuho 大株主の状況, footnote'),
  ('Sumitomo Mitsui Trust Asset Management Co., Ltd. and 1 other (large-holding report)', 7.55, 'large-holding report, as printed in the Yuho footnote (35,593 thousand shares)', '', '2025-09-15', 'Japan', 'asset managers (group; holds for clients)', 'AGG', 'N', 'Y', 'Not in the table; report filed 2025-09-19', 'Yuho 大株主の状況, footnote'),
  ('Mitsubishi UFJ Trust and Banking Corp. and 2 others (large-holding report)', 4.82, 'large-holding report, as printed in the Yuho footnote (22,746 thousand shares)', '', '2024-09-09', 'Japan', 'trust bank group (holds for clients)', 'STALE', 'N', 'Y', 'Not in the table; report filed 2024-09-17', 'Yuho 大株主の状況, footnote'),
  ('Capital Research and Management Company and 2 others (large-holding report)', 4.33, 'large-holding report, as printed in the Yuho footnote (6,813 thousand shares, pre-split count)', '', '2022-11-15', 'US', 'asset managers (group; holds for clients)', 'STALE', 'N', 'Y', 'Not in the table; report filed 2022-11-22; before the 3-for-1 split of 1 Apr 2023', 'Yuho 大株主の状況, footnote'),
 ],
 'foxconn_hon_hai': [
  ('Tai-Ming (Terry) Gou', 12.5, BASIS, '', '2026-03-16', 'Taiwan', 'individual founder', 'A', 'N', 'Y', 'SECONDARY: 1,739,698,518 shares per Liberty Times after a gift of 3 Mar 2026; the 12.5% is the aggregator’s. Primary list of 2024-04-02 (rows below) prints 1,742,198,518 = 12.56%. The April 2026 list was not reached', ''),
  ('Gou, Tai-Ming (Terry Gou), 2024 list', 12.56, BASIS, '', '2024-04-02', 'Taiwan', 'individual founder', 'HIST', 'N', 'N', 'PRIMARY but two years old: Hon Hai website, (6) List of Major Shareholders. 1,742,198,518 shares', 'IV (6)'),
  ('New Labor Pension Fund', 2.06, BASIS, '', '2024-04-02', 'Taiwan', 'state pension fund', 'HIST', 'N', 'N', 'PRIMARY, 2024 list; 285,247,272 shares', 'IV (6)'),
  ('Citibank Hosting Government of Singapore Investment Account', 1.88, BASIS, '', '2024-04-02', 'Singapore', 'custody account for a sovereign wealth fund', 'HIST', 'N', 'N', 'PRIMARY, 2024 list; 260,084,483 shares', 'IV (6)'),
  ('LGT Bank AG', 1.19, BASIS, '', '2024-04-02', 'Liechtenstein (not printed)', 'bank (holds for clients)', 'HIST', 'N', 'N', 'PRIMARY, 2024 list; 164,775,294 shares', 'IV (6)'),
  ('JPMorgan Chase Bank Hosting Vanguard STAR Developed Markets Index Fund', 1.18, BASIS, '', '2024-04-02', 'US', 'index fund custody account (holds for clients)', 'HIST', 'N', 'N', 'PRIMARY, 2024 list; 163,786,135 shares', 'IV (6)'),
  ('JPMorgan Chase Hosting Vanguard Developing Markets Index Fund', 1.15, BASIS, '', '2024-04-02', 'US', 'index fund custody account (holds for clients)', 'HIST', 'N', 'N', 'PRIMARY, 2024 list; 159,660,761 shares', 'IV (6)'),
  ('Citibank Hosting Norges Bank Investment Account', 1.13, BASIS, '', '2024-04-02', 'Norway', 'custody account for a sovereign wealth fund', 'HIST', 'N', 'N', 'PRIMARY, 2024 list; 155,952,951 shares', 'IV (6)'),
  ('Citibank Hosting Hon Hai Precision Industry Co., Ltd. Depositary Receipts Account', 0.91, BASIS, '', '2024-04-02', 'US', 'depositary account (pass-through)', 'HIST', 'N', 'N', 'PRIMARY, 2024 list; 126,629,295 shares', 'IV (6)'),
  ('Standard Chartered Bank’s iShares Emerging Markets ETF Investment Account', 0.81, BASIS, '', '2024-04-02', 'US', 'ETF custody account (holds for clients)', 'HIST', 'N', 'N', 'PRIMARY, 2024 list; 112,240,928 shares (printed without separators)', 'IV (6)'),
  ('HSBC (Taiwan) in custody for Morgan Stanley International Limited investment account', 0.67, BASIS, '', '2024-04-02', 'UK (not printed)', 'custody account (pass-through)', 'HIST', 'N', 'N', 'PRIMARY, 2024 list; 92,832,156 shares (printed without separators)', 'IV (6)'),
 ],
}
DOCS = {
 'micron': ['DEF 14A (2025 proxy for Nov 2025 meeting); Schedules 13G and 13G/A of Apr and May 2026 (Vanguard Capital Management, Capital World Investors). FY2026 proxy not filed', 'https://www.sec.gov/Archives/edgar/data/723125/000072312525000038/mu-20251125.htm'],
 'asm_international': ['Annual Report 2025, largest shareholders (as per December 2025; otcmarkets copy); AFM register of substantial holdings', 'https://www.afm.nl/en/sector/registers/meldingenregisters/substantiele-deelnemingen/details?id=191347'],
 'samsung': ['2025 Business Report VII: largest shareholder and related parties (p. 244) and 5% or more voting shares (p. 247)', 'https://images.samsung.com/is/content/samsung/assets/global/ir/docs/2025_4Q_Interim_Report.pdf'],
 'tokyo_electron': ['Yuho FY2026 (EDINET S100YEOO), 大株主の状況 as of 2026-03-31, read via the irbank XBRL text block', 'https://irbank.net/E02652/notes/MajorShareholdersTextBlock?f=S100YEOO'],
 'foxconn_hon_hai': ['Hon Hai website, (6) List of Major Shareholders as of 2024-04-02 (primary, old); Liberty Times 2026-03-16 and Simply Wall St (secondary)', 'https://image.honhai.com/financy_by_year/IV_1716864989._Company_Shares_and_Fund_Raising'],
}
NOTES = {
 'asm_international': 'Annual Report 2025 largest-shareholders table (as per December 2025) read: BlackRock 8.6, FMR 5.0, Norges Bank 4.9, Tokyo Electron 4.7, WCM 3.0, on 49,328,548 issued shares; treasury 446,999 (0.9%). The rows carry AFM notification dates from 2023 to 2025, so it is not a single-date snapshot.',
 'samsung': 'Largest shareholder and related parties together 19.84% (1,174,366,888 of 5,919,637,922 issued common shares, AGG row). Related-party table p. 244, 5% table p. 247.',
 'tokyo_electron': 'Top ten of the Yuho table as of 2026-03-31 (printed total 50.89%); trust banks and custodian accounts are pass-through. Large-holding reports in the footnote are shown as AGG or STALE rows and are not in the table.',
 'foxconn_hon_hai': 'No 2026 primary list reached. The only primary list read is the Hon Hai website list of 2024-04-02 (HIST rows); the 2026 Gou row is secondary.',
}
SECTORS = {
 'SR1': {'fig': 'Synopsys total revenue, fiscal year 2025', 'v': 7054, 'unit': 'USD m', 'date': 'FY2025 (year to 2025-10-31)', 'src': 'Synopsys Form 8-K, Exhibit 99.1 (results release) of 10 Dec 2025',
         'fl': 'Includes Ansys from July 2025 (USD 756.6m); FY2026 results (year to Oct 2026) not out; Cadence not profiled, so no second EDA figure'},
 'SR2': {'fig': 'ASE Technology Holding consolidated net revenues, FY2025', 'v': 645388, 'unit': 'NT$ m', 'date': 'FY2025 (year to 2025-12-31)', 'src': 'ASE results release of 5 Feb 2026 (Form 6-K, unaudited), read via a StockTitan copy of the PRNewswire release',
         'fl': 'Whole group, not advanced packaging alone: ATM segment 389,228 and EMS 259,079 in the release; net income attributable to the parent 40,658; unaudited; release states no LEAP (advanced packaging) revenue; Amkor not profiled'},
 'SR4': {'fig': 'China’s share of world primary low-purity gallium production', 'v': 99, 'unit': '% of world production (2025e)', 'date': '2025e', 'src': 'USGS Mineral Commodity Summaries 2026, gallium',
         'fl': 'Estimate by USGS. Second datum kept: China’s share of world rare-earth mine output 69.2% (2025e; 71.1% in 2024), my arithmetic from USGS tonnages (270/390 kt), a mine-output quota figure, not processing. Germanium and high-purity quartz: NOT FOUND'},
}

# ---- holders: the five firms' old rows go, the new rows take the place of the first old row (the order of the merged file)
new, seen = [], set()
for h in D['holders']:
    f = h['f']
    if f in ROWS:
        if f not in seen:
            seen.add(f)
            fr = firms[f]; rate = fr['fx']
            usd = (fr['loc'] * rate if fr['fxd'] == 'u' else fr['loc'] / rate)
            for (name, p, basis, votes, asof, ctry, typ, st, mapped, star, flags, page) in ROWS[f]:
                key = next((al for rx, al in ALIAS if re.search(rx, name)), name)
                ring = next((al for rx, al in RING if re.search(rx, name)), None) if mapped == 'Y' else None
                assert not (mapped == 'Y' and ring is None), 'mapped holder without a ring firm: ' + name
                att = usd * p / 100 if st == 'A' and num(p) else None
                row = {'f': f, 'n': name, 'k': key, 'p': round(p, 3) if num(p) else None, 'b': basis, 'd': asof, 'c': country(ctry), 't': holder_type(typ), 'tr': typ, 's': st}
                if row['c'] != ctry: row['cr'] = ctry
                if votes not in ('', None): row['v'] = votes
                if 'holds for clients' in typ: row['hc'] = 1
                if ring: row['m'] = ring
                if star == 'Y': row['x'] = 1
                if flags: row['fl'] = flags
                if page: row['pg'] = page
                if att is not None: row['a'] = r1(att)
                new.append(curl(row))
        continue
    new.append(h)
assert seen == set(ROWS), seen
D['holders'] = new

# ---- firms: documents, coverage notes, coverage sums
for f, d in DOCS.items(): firms[f]['doc'] = d
for f, n in NOTES.items(): firms[f]['note'] = curl(n)
cov = {i: [0.0, 0.0, 0] for i in firms}
for h in new:
    c = cov[h['f']]; c[2] += 1
    if h['s'] == 'A' and num(h['p']): c[0] += h['p']
    if h['s'] == 'PT' and num(h['p']): c[1] += h['p']
for i, f in firms.items():
    assert cov[i][0] <= 100.001, i + ': more than 100% attributed'
    f['cov'] = [round(cov[i][0], 2), round(cov[i][1], 2), cov[i][2]]

# ---- sector rows
for s in D['sectors']:
    if s['id'] in SECTORS: s.update(curl(SECTORS[s['id']]))

pos = sum(f['usd'] for f in D['firms'] if f['usd'] and f['usd'] > 0)
att = sum(h['a'] for h in new if h.get('a') and h['a'] > 0 and firms[h['f']]['usd'] > 0)
D['sum'] = {'profit': round(pos), 'attributed': round(att)}
D['asof'] = '21 Nov 2026'

# ---- checks against what the D4c notes report
assert len(D['firms']) == 49 and len(new) == 240 and len(D['sectors']) == 4, (len(D['firms']), len(new), len(D['sectors']))
assert [len(ROWS[k]) for k in ('micron', 'samsung', 'tokyo_electron', 'asm_international', 'foxconn_hon_hai')] == [5, 12, 14, 7, 11]
assert abs(sum(r[1] for r in ROWS['samsung'] if r[7] == 'A') - (8.59 + 7.77 + 5.07 + 5.05 + 1.49 + 1.65 + 1.49 + 0.77 + 0.71)) < 1e-9
assert abs(sum(r[1] for r in ROWS['tokyo_electron'][:10]) - 50.84) < 0.005          # the ten printed rows: 50.84 (the table prints 50.89)
assert all(h['f'] in firms and (not h.get('m') or h['m'] in firms) for h in new)
json.dump(D, open(path, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('firms', len(D['firms']), 'holder rows', len(new), 'A rows', sum(1 for h in new if h['s'] == 'A'), 'nodes', len({h['k'] for h in new if not h.get('m')}),
      '| profits of the firms in profit, USD m:', round(pos), '| attributed*:', round(att), '(%.1f%%)' % (att / pos * 100))
