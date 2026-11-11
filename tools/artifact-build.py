"""Build the single-file artifact from the site page.
Usage: python3 tools/artifact-build.py <repo_root> <out_html>
Reads imperial-stack/index.html and inlines everything it loads from the site: the globe.gl library, the earth texture
and the fallback picture (as data URIs), and the v2 files (stylesheet, scripts and data). Drops the preload link and the
site's favicons. Stops with an error if any local file is still referenced, so site and artifact stay one source."""
import base64, json, os, re, sys
root, out = sys.argv[1], sys.argv[2]
site = os.path.join(root, 'imperial-stack')
s = open(os.path.join(site, 'index.html'), encoding='utf-8').read()
read = lambda *p: open(os.path.join(site, *p), encoding='utf-8').read()
lib = read('vendor', 'globe.gl-2.41.4.min.js')
tex = open(os.path.join(site, 'vendor', 'earth-night.jpg'), 'rb').read()
assert '</script' not in lib.lower(), 'library contains </script'

def rep(old, new):
    global s
    n = s.count(old); assert n == 1, f'expected 1 match, found {n}: {old[:80]!r}'
    s = s.replace(old, new)

# 1. the library: an inline script in place of the async tag; then the same load event the site listens for
tag = re.search(r'<script async src="/imperial-stack/vendor/globe\.gl-2\.41\.4\.min\.js"[^>]*></script>', s)
assert tag, 'globe script tag not found'
s = s.replace(tag.group(0), '<script>' + lib + '\n</script>\n<script>window.__isxGlib="ok";window.dispatchEvent(new Event("isx-glib"));</script>')
# 2. the texture as a data URI
rep('const TEX = "/imperial-stack/vendor/earth-night.jpg";',
    'const TEX = "data:image/jpeg;base64,' + base64.b64encode(tex).decode() + '";')
# 3. the preload hint points at a file the artifact does not have
s = re.sub(r'<link rel="preload" href="/imperial-stack/vendor/[^"]*" as="script">\n', '', s)
# 4. the no-WebGL fallback picture as a data URI
img = open(os.path.join(root, 'assets', 'img', 'globe-1000.webp'), 'rb').read()
rep('src="/assets/img/globe-1000.webp"', 'src="data:image/webp;base64,' + base64.b64encode(img).decode() + '"')
# 5. the site's favicons and touch icon: the artifact has its own icon
s = re.sub(r'<link rel="(?:icon|apple-touch-icon)" href="/[^"]+"[^>]*>\n', '', s)
# 6. v2: the stylesheet, the scripts and the data files, inline and in the same order
for m in re.findall(r'<link rel="stylesheet" href="/imperial-stack/(v2/[^"]+\.css)">', s):
    rep(f'<link rel="stylesheet" href="/imperial-stack/{m}">', '<style>\n' + read(*m.split('/')) + '</style>')
data = ''
for f in sorted(os.listdir(os.path.join(site, 'data'))):
    if f.endswith('.json'):
        txt = json.dumps(json.loads(read('data', f)), ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
        data += f'<script type="application/json" id="isx-data-{f[:-5]}">{txt}</script>\n'
first = True
for m in re.findall(r'<script(?: defer)? src="/imperial-stack/(v2/[^"]+\.js)"></script>', s):
    js = read(*m.split('/')); assert '</script' not in js.lower(), m + ' contains </script'
    tagtxt = re.search(r'<script(?: defer)? src="/imperial-stack/' + re.escape(m) + r'"></script>', s).group(0)
    pre = data if (first and 'defer' in tagtxt) else ''
    if pre: first = False
    rep(tagtxt, pre + '<script>\n' + js + '</script>')
assert not first, 'data files were not placed'

# checks: no remaining code or attribute reference to a file outside the page (comments and absolute URLs aside)
left = sorted(set(re.findall(r'(?:src|href)="(/[^"]+)"', s)))
left = [x for x in left if x != '/']   # the link back to the home page stays a link
print('local references left:', left)
assert not left, 'local file still referenced'
assert not re.search(r'(?:TEX|src)\s*=\s*"/imperial-stack/vendor/', s), 'vendor path still referenced in code'
open(out, 'w', encoding='utf-8').write(s)
print('wrote', out, len(s.encode('utf-8')), 'bytes')
