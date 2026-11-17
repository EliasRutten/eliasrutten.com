#!/usr/bin/env python3
"""Type round (18 Nov 2026): the title face and the label face, inlined as woff2 in imperial-stack/index.html.
Title: Saira, width 125 (the family's "Expanded"), as two static faces named 'Saira Wide': weight 400 is drawn at 520, 600 at 620,
so every rule that already says font-weight 400 gets the slightly heavier stroke. Labels: Martian Mono at width 75 (its narrowest),
weight kept variable, with size-adjust 90%: its advance is then 0.54 em, the same as Share Tech Mono's, so no label changes width.
Sources: npm @fontsource-variable/saira and @fontsource-variable/martian-mono (latin subsets), both SIL Open Font License.
Usage: python3 -I tools/type-fonts.py <node_modules/@fontsource-variable> imperial-stack/index.html"""
import base64, io, re, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

src, page = sys.argv[1], sys.argv[2]
def inst(path, axes):
    f = instancer.instantiateVariableFont(TTFont(path), axes); f.flavor = 'woff2'; b = io.BytesIO(); f.save(b); return base64.b64encode(b.getvalue()).decode()
saira = src + '/saira/files/saira-latin-wdth-normal.woff2'
mart = src + '/martian-mono/files/martian-mono-latin-standard-normal.woff2'
faces = (f"@font-face {{ font-family: 'Saira Wide'; font-weight: 400; font-style: normal; font-display: swap; src: url(data:font/woff2;base64,{inst(saira, {'wdth': 125, 'wght': 520})}) format('woff2'); }}\n"
         f"@font-face {{ font-family: 'Saira Wide'; font-weight: 600; font-style: normal; font-display: swap; src: url(data:font/woff2;base64,{inst(saira, {'wdth': 125, 'wght': 620})}) format('woff2'); }}")
mono = f"@font-face {{ font-family: 'Martian Mono'; font-weight: 100 800; font-style: normal; font-display: swap; size-adjust: 90%; src: url(data:font/woff2;base64,{inst(mart, {'wdth': 75})}) format('woff2'); }}"
s = open(page, encoding='utf-8').read()
s, n1 = re.subn(r"@font-face \{ font-family: 'Michroma';[^}]*\}", lambda m: faces, s, count=1)
s, n2 = re.subn(r"@font-face \{ font-family: 'Share Tech Mono';[^}]*\}", lambda m: mono, s, count=1)
s = s.replace('--title: "Michroma", "Saira", sans-serif;', '--title: "Saira Wide", "Saira", sans-serif;')
s = s.replace('--mono: "Share Tech Mono", ui-monospace,', '--mono: "Martian Mono", ui-monospace,')
s = s.replace('"Share Tech Mono", ui-monospace, monospace', '"Martian Mono", ui-monospace, monospace')
assert n1 == 1 and n2 == 1, (n1, n2)
assert 'Michroma' not in s and 'Share Tech Mono' not in s
open(page, 'w', encoding='utf-8').write(s)
print('ok', len(s))
