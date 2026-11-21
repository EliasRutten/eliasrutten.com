"""Build the multi-file artifact folder from the site (the trial of W2, 21 Nov 2026; the single-file build stays in tools/artifact-build.py).
Usage: python3 tools/artifact-files.py <repo_root> <out_dir>
Writes <out_dir>/index.html, v2/*.css, v2/*.js, data/*.json, vendor/earth-night.jpg, assets/globe-1000.webp: the site's own files, so a later
round republishes only the files it changed (publish_files, mode patch, or edit_version with path). What differs from the site:
  - every /imperial-stack/ path is relative (v2/..., data/..., vendor/...), because an artifact is not served at /imperial-stack/
  - the globe library (1.65 MB, third party, minified) is NOT shipped: the page loads cdn.jsdelivr.net/npm/globe.gl@2.41.4, an allowed script host,
    with an integrity hash. The build stops unless the vendored file's sha256 equals the published release's (SHA256_RELEASE below,
    checked on 21 Nov 2026 against `npm pack globe.gl@2.41.4` dist/globe.gl.min.js: byte for byte the same file)
  - the same four artifact-only changes as tools/artifact-build.py: window.ISX_ART, no link home, the About box links by its full address,
    the 'show the first visit again' button, and no favicons
The data stays in data/*.json (the page's own fetch), not inlined: a data round then changes one small file."""
import base64, hashlib, os, re, shutil, sys
root, out = sys.argv[1], sys.argv[2]
site = os.path.join(root, 'imperial-stack')
SHA256_RELEASE = '983fefdaad2a6d51d84f63b906acb728c32875dc396d33e78fc7c2ff210ed054'   # globe.gl@2.41.4 dist/globe.gl.min.js
CDN = 'https://cdn.jsdelivr.net/npm/globe.gl@2.41.4/dist/globe.gl.min.js'
s = open(os.path.join(site, 'index.html'), encoding='utf-8').read()

lib = open(os.path.join(site, 'vendor', 'globe.gl-2.41.4.min.js'), 'rb').read()
assert hashlib.sha256(lib).hexdigest() == SHA256_RELEASE, 'the vendored globe library is not the published 2.41.4 release: do not load it from the CDN'
sri = 'sha384-' + base64.b64encode(hashlib.sha384(lib).digest()).decode()

def rep(old, new):
    global s
    n = s.count(old); assert n == 1, f'expected 1 match, found {n}: {old[:80]!r}'
    s = s.replace(old, new)

# 1. the library: from the CDN, pinned by its hash, with the same two handlers the site has
tag = re.search(r'<script async src="/imperial-stack/vendor/globe\.gl-2\.41\.4\.min\.js"( onload="[^"]*" onerror="[^"]*")></script>', s)
assert tag, 'globe script tag not found'
s = s.replace(tag.group(0), '<script>window.ISX_ART=true;</script>\n<script async src="' + CDN + '" integrity="' + sri + '" crossorigin="anonymous"' + tag.group(1) + '></script>')
s = re.sub(r'<link rel="preload" href="/imperial-stack/vendor/[^"]*" as="script">\n', '', s)
# 2. the texture, the fallback picture, the data and the v2 files: relative paths
rep('const TEX = "/imperial-stack/vendor/earth-night.jpg";', 'const TEX = "vendor/earth-night.jpg";')
rep('src="/assets/img/globe-1000.webp"', 'src="assets/globe-1000.webp"')
rep("fetch('/imperial-stack/data/' + name + '.json')", "fetch('data/' + name + '.json')")
s = re.sub(r'(<link rel="stylesheet" href=")/imperial-stack/(v2/[^"]+\.css">)', r'\1\2', s)
s = re.sub(r'(<script(?: defer)? src=")/imperial-stack/(v2/[^"]+\.js">)', r'\1\2', s)
# 3. the site's favicons: the artifact has its own icon
s = re.sub(r'<link rel="(?:icon|apple-touch-icon)" href="/[^"]+"[^>]*>\n', '', s)
# 4. links to the site (as in artifact-build.py)
rep('<a class="er-home" href="/">← Elias Rutten</a><span class="er-ps"> · Pax Silica · </span>', '<span class="er-ps">Pax Silica · </span>')
rep('<a class="b b2" href="/">More work by Elias Rutten</a>', '<a class="b b2" href="https://eliasrutten.com/" target="_blank" rel="noopener">More work by Elias Rutten</a>')
# 5. artifact only: a way to see the first visit again (as in artifact-build.py)
ART_BTN = ('<style>#isx-art-replay{position:fixed;left:10px;bottom:10px;z-index:40;font:600 11px/1 system-ui,sans-serif;'
           'color:#cfe3f2;background:rgba(11,19,28,.92);border:1px solid rgba(160,200,230,.35);border-radius:999px;padding:8px 12px;'
           'cursor:pointer}#isx-art-replay:hover,#isx-art-replay:focus-visible{background:#16293a;outline:2px solid #7fc4f0}'
           '.wl-stage:not(.wl-in) #isx-art-replay{display:none}</style>'
           '<button id="isx-art-replay" type="button" aria-label="Show the first visit again: clear the saved tour and reload">↻ Show the first visit again</button>'
           '<script>document.getElementById("isx-art-replay").addEventListener("click",function(){'
           'try{["isx-intro","isx-tour"].forEach(function(k){localStorage.removeItem(k)})}catch(e){}'
           'try{location.reload()}catch(e){location.href=location.href}});</script>\n')
i = s.rfind('</html>'); assert i > 0, 'page end not found'
s = s[:i] + ART_BTN + s[i:]

left = sorted(set(re.findall(r'(?:src|href)="(/[^"]+)"', s)))
print('local references left:', left)
assert not left, 'a local file is still referenced by absolute path'
assert not re.search(r'''(?:TEX\s*=|fetch\()\s*['"]/imperial-stack/|(?:src|href)=["']/imperial-stack/''', s), 'an absolute site path is left in the page code'   # comments may still name the site paths

shutil.rmtree(out, ignore_errors=True)
for d in ('v2', 'data', 'vendor', 'assets'): os.makedirs(os.path.join(out, d))
open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(s)
for d, ext in (('v2', ('.css', '.js')), ('data', ('.json',))):
    for f in sorted(os.listdir(os.path.join(site, d))):
        if f.endswith(ext): shutil.copy(os.path.join(site, d, f), os.path.join(out, d, f))
shutil.copy(os.path.join(site, 'vendor', 'earth-night.jpg'), os.path.join(out, 'vendor', 'earth-night.jpg'))
shutil.copy(os.path.join(root, 'assets', 'img', 'globe-1000.webp'), os.path.join(out, 'assets', 'globe-1000.webp'))
tot = 0
for dp, _, fs in os.walk(out):
    for f in fs: tot += os.path.getsize(os.path.join(dp, f))
print('wrote', out, tot, 'bytes; index.html', len(s.encode('utf-8')), 'bytes; integrity', sri)
