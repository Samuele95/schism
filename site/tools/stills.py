"""Render one still per scene from the film (copy hidden), for the reduced-motion / no-WebGL sequence.
Usage: python3 -I stills.py <url> <outdir>"""
import sys, time, pathlib, io
from playwright.sync_api import sync_playwright
from PIL import Image
url, outdir = sys.argv[1:3]
out = pathlib.Path(outdir); out.mkdir(parents=True, exist_ok=True)
POINTS = {1: 2.5, 2: 19, 3: 31, 4: 40, 5: 52, 6: 68, 7: 87.5, 8: 94, 9: 116, 10: 144, 11: 150, 12: 161.2, 13: 182}
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True, args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 1280, 'height': 720}, device_scale_factor=1)
    pg.goto(url, wait_until='networkidle'); pg.wait_for_function('window.__film && window.__film.ready'); time.sleep(2)
    pg.add_style_tag(content='#scenes .scene > *:not(.title-block), .sound, .hint, #phases, #debug { visibility: hidden !important; }')
    for n, t in POINTS.items():
        pg.evaluate(f'window.__film.seek({t})')
        time.sleep(2.2)
        pg.evaluate("document.querySelectorAll('.title-block').forEach(e => e.style.visibility = 'hidden')")
        png = pg.screenshot()
        Image.open(io.BytesIO(png)).convert('RGB').save(out / f'S{n}.webp', 'WEBP', quality=82, method=6)
        print('S%d t=%.1f' % (n, t), flush=True)
    b.close()
