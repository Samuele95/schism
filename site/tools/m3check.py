"""M3 wide check extras: internal links, claim and source traces, fallbacks, reading room renders.
Usage: python3 -I m3check.py <dist_dir> <brief.md> <package_dir> <url> <outdir>"""
import sys, re, pathlib, json, time
from playwright.sync_api import sync_playwright
dist, brief, pkg, url, outdir = sys.argv[1:6]
dist = pathlib.Path(dist); out = pathlib.Path(outdir); out.mkdir(parents=True, exist_ok=True)
claims = set(re.findall(r'^\| (C-\d+) \|', open(brief).read(), re.M))
res = {'broken_links': [], 'bad_claims': [], 'bad_sources': [], 'pages': 0, 'claim_elements': 0, 'source_pages': 0}
for f in sorted(dist.rglob('*.html')):
    html = f.read_text(); res['pages'] += 1
    for ref in re.findall(r'(?:href|src)="([^"]+)"', html):
        if ref.startswith(('http', 'mailto:', 'data:', '#', '/src/')): continue
        target = (f.parent / ref.split('#')[0]).resolve()
        if not target.exists(): res['broken_links'].append(f'{f.relative_to(dist)} -> {ref}')
    for m in re.findall(r'data-claim="([^"]+)"', html):
        res['claim_elements'] += 1
        for c in m.split():
            if c not in claims: res['bad_claims'].append(f'{f.relative_to(dist)}: {c}')
    for m in re.findall(r'data-source="([^"]+)"', html):
        res['source_pages'] += 1
        if not (pathlib.Path(pkg) / m).exists(): res['bad_sources'].append(m)
errors = []
with sync_playwright() as p:
    args = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
    b = p.chromium.launch(channel='chrome', headless=True, args=args)
    def shot(ctx_kw, path, name, full=False, wait=2.0):
        ctx = b.new_context(**ctx_kw); pg = ctx.new_page()
        pg.on('console', lambda m: m.type == 'error' and errors.append(f'{name}: {m.text}'))
        pg.on('pageerror', lambda e: errors.append(f'{name}: {e}'))
        pg.goto(url + path, wait_until='networkidle'); time.sleep(wait)
        info = pg.evaluate("({film: document.documentElement.classList.contains('film'), stills: [...document.images].filter(i => i.complete && i.naturalWidth > 0).length, h: document.body.scrollHeight})")
        pg.screenshot(path=str(out / f'{name}.png'), full_page=full)
        ctx.close(); return info
    res['reduced_motion'] = shot({'viewport': {'width': 1280, 'height': 800}, 'reduced_motion': 'reduce'}, '', 'fallback-reduced', full=False, wait=3)
    rd = b.new_context(viewport={'width': 1280, 'height': 800}, reduced_motion='reduce'); pg = rd.new_page()
    pg.goto(url, wait_until='networkidle'); pg.evaluate('window.scrollTo(0, document.body.scrollHeight)'); time.sleep(2)
    pg.evaluate('document.querySelectorAll("img").forEach(i => i.loading = "eager")'); time.sleep(2)
    res['reduced_motion']['stills_loaded_after_scroll'] = pg.evaluate("[...document.images].filter(i => i.complete && i.naturalWidth > 0).length")
    pg.screenshot(path=str(out / 'fallback-reduced-full.png'), full_page=True); rd.close()
    for name, path, vp in [('read-index', 'read/index.html', (1280, 900)), ('read-ara', 'read/cards/ara.html', (1280, 900)),
                           ('read-smith-phone', 'read/roles/smith.html', (390, 844)), ('read-glossary-phone', 'read/glossary.html', (390, 844))]:
        res[name] = shot({'viewport': {'width': vp[0], 'height': vp[1]}, 'is_mobile': vp[0] < 700}, path, name)
    b.close()
    b2 = p.chromium.launch(channel='chrome', headless=True, args=['--disable-3d-apis', '--disable-webgl', '--disable-gpu'])
    ctx = b2.new_context(viewport={'width': 1280, 'height': 800}); pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(f'nowebgl: {e}'))
    pg.goto(url, wait_until='networkidle'); time.sleep(2)
    res['no_webgl'] = pg.evaluate("({film: document.documentElement.classList.contains('film'), scenes: document.querySelectorAll('.scene').length, copyVisible: getComputedStyle(document.querySelector('#s9 .line')).visibility})")
    pg.screenshot(path=str(out / 'fallback-nowebgl.png')); b2.close()
res['console_errors'] = errors
print(json.dumps(res, indent=1))
