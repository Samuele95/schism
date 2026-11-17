"""Render the whole film to video deterministically (the film's own clock advances 1/fps per frame),
and save one still per scene, copy included. Usage: python3 -I walkthrough.py <url> <outdir> <w>x<h> [fps] [seconds]"""
import sys, time, pathlib, subprocess, shutil, bisect
from playwright.sync_api import sync_playwright
url, outdir, size = sys.argv[1:4]
fps = int(sys.argv[4]) if len(sys.argv) > 4 else 24
secs = float(sys.argv[5]) if len(sys.argv) > 5 else 96
w, h = map(int, size.split('x'))
out = pathlib.Path(outdir); out.mkdir(parents=True, exist_ok=True)
frames = out / 'frames'; shutil.rmtree(frames, ignore_errors=True); frames.mkdir()
END = 184
MID = {1: 2.5, 2: 15, 3: 30, 4: 40, 5: 51, 6: 66, 7: 82, 8: 94, 9: 115, 10: 140, 11: 150, 12: 163, 13: 180}
def weight(t):   # pacing: slower into and through the cut, a little slower over the held cut
    if 96 <= t < 100.2: return 1.5
    if 100.2 <= t < 102.5: return 3.0
    if 102.5 <= t < 131: return 1.05
    if 159.5 <= t < 161.5: return 2.0
    return 1.0
ts = [i / 10 for i in range(END * 10 + 1)]
cum = [0.0]
for i in range(1, len(ts)): cum.append(cum[-1] + weight(ts[i - 1]) * 0.1)
def t_at(u):
    x = u * cum[-1]; j = bisect.bisect_left(cum, x)
    if j <= 0: return 0.0
    if j >= len(cum): return float(END)
    return ts[j - 1] + (x - cum[j - 1]) / (cum[j] - cum[j - 1]) * 0.1
n = int(secs * fps); lead, tail = int(1.5 * fps), int(3 * fps)
done = set()
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True, args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1)
    pg.goto(url, wait_until='networkidle'); pg.wait_for_function('window.__film && window.__film.ready'); time.sleep(1.5)
    pg.add_style_tag(content='.hint { visibility: hidden !important; }')
    t0 = time.time()
    for i in range(n):
        t = t_at(min(max((i - lead) / (n - lead - tail), 0), 1))
        pg.evaluate(f'window.__film.step({t:.4f}, {1 / fps:.5f})')
        f = frames / f'{i:05d}.jpg'
        pg.screenshot(path=str(f), type='jpeg', quality=90)
        for s, m in MID.items():
            if s not in done and t >= m:
                shutil.copy(f, out / f'S{s:02d}.jpg'); done.add(s)
        if i % 200 == 0: print(f'frame {i}/{n} t={t:.1f} {time.time() - t0:.0f}s', flush=True)
    b.close()
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', str(frames / '%05d.jpg'),
                '-vf', 'scale=960:-2,hqdn3d=1.5:1.5:3:3', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26',
                '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(out / 'film.mp4')], check=True)
shutil.rmtree(frames)
print('done', out / 'film.mp4')
