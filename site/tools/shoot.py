"""Wide-check capture: open the built site, seek the film to given timeline points, screenshot each.
Usage: python3 -I shoot.py <url> <outdir> <label> <w>x<h> t1,t2,...  [wait_s]"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

url, outdir, label, size, ts = sys.argv[1:6]
wait = float(sys.argv[6]) if len(sys.argv) > 6 else 1.6
w, h = map(int, size.split('x'))
out = pathlib.Path(outdir); out.mkdir(parents=True, exist_ok=True)
errors, logs = [], []
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True, args=[
        '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'])
    ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1,
                        is_mobile=w < 700, has_touch=w < 700)
    pg = ctx.new_page()
    pg.on('console', lambda m: (errors if m.type == 'error' else logs).append(f'{m.type}: {m.text}'))
    pg.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))
    pg.goto(url, wait_until='networkidle')
    pg.wait_for_function('window.__film && window.__film.ready', timeout=60000)
    time.sleep(2.0)
    gl = pg.evaluate("""() => { const c = document.createElement('canvas'); const g = c.getContext('webgl2') || c.getContext('webgl');
        if (!g) return 'none'; const d = g.getExtension('WEBGL_debug_renderer_info'); return d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'webgl'; }""")
    shots = []
    for t in [float(x) for x in ts.split(',')]:
        pg.evaluate(f'window.__film.seek({t})')
        time.sleep(wait)
        f = out / f'{label}-t{t:05.1f}.png'
        pg.screenshot(path=str(f))
        shots.append({'t': t, 'actual_t': round(pg.evaluate('window.__film.t'), 2), 'file': f.name})
    b.close()
print(json.dumps({'renderer': gl, 'shots': shots, 'errors': errors, 'logs': logs[:20]}, indent=1))
