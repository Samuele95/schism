"""Draws the README's banner and figures as SVG, in the site's palette and type, and renders them to PNG.

Usage (from the repository root):  python3 -I assets/src/figures.py
Needs Python Playwright with Chrome. Writes assets/*.png and assets/src/*.svg.
"""
import math, random, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets'
SRC = ROOT / 'assets' / 'src'
FONTS = ROOT / 'site' / 'public' / 'fonts'

GROUND = '#07070a'
BONE = '#e8e2d4'
DIM = 'rgba(232,226,212,0.55)'
FAINT = 'rgba(232,226,212,0.22)'
PHOS = '#59ff9c'
RED = '#e0402f'
REDL = '#ff5a43'
SERIF = "'EB Garamond', Georgia, serif"
MONO = "'JetBrains Mono', ui-monospace, monospace"


def frame(w, h, body, defs=''):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
<defs>
  <radialGradient id="vg" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#0d0d12"/><stop offset="1" stop-color="{GROUND}"/></radialGradient>
  <clipPath id="card"><rect width="{w}" height="{h}" rx="14"/></clipPath>
  {defs}
</defs>
<g clip-path="url(#card)">
<rect width="{w}" height="{h}" fill="url(#vg)"/>
{body}
</g>
<rect x="0.5" y="0.5" width="{w-1}" height="{h-1}" rx="14" fill="none" stroke="rgba(232,226,212,0.10)"/>
</svg>'''


def t(x, y, s, size=16, fill=BONE, family=SERIF, anchor='start', ls=0, style='', weight=400, opacity=1):
    st = f'font-family:{family};font-size:{size}px;letter-spacing:{ls}em;{style}'
    return f'<text x="{x:.1f}" y="{y:.1f}" fill="{fill}" text-anchor="{anchor}" font-weight="{weight}" opacity="{opacity}" style="{st}">{s}</text>'


def smallcaps(x, y, s, size=15, fill=RED, anchor='start', ls=0.22):
    return t(x, y, s, size, fill, SERIF, anchor, ls, 'font-variant:small-caps;')


# ---------------------------------------------------------------- the space: a disc and a plume
class Space:
    """A disc of ordinary answers in the plane, and a plume displaced along the axis, projected obliquely."""

    def __init__(self, cx, cy, scale, seed=7, n_disc=1500, n_plume=520, tilt=0.34, plume_h=5.4):
        r = random.Random(seed)
        g = r.gauss
        self.cx, self.cy, self.s, self.tilt = cx, cy, scale, tilt
        topics = [(math.cos(a) * rr, math.sin(a) * rr, 1.2 + r.random() * 1.8)
                  for a, rr in ((r.random() * 6.283, 2 + r.random() * 6.5) for _ in range(7))]
        self.disc, self.plume = [], []
        for _ in range(n_disc):
            if r.random() < 0.2:
                x, z = g(0, 6.5), g(0, 6.5)
            else:
                tx, tz, ts = topics[r.randrange(len(topics))]
                x, z = tx + g(0, ts), tz + g(0, ts)
            self.disc.append((x, g(0, 0.25), z, r.random()))
        for _ in range(n_plume):
            tx, tz, ts = topics[r.randrange(len(topics))]
            h = plume_h + g(0, 1.0)
            pinch = 0.45 + 0.35 * math.exp(-max(h - 4, 0) * 0.25)
            self.plume.append(((tx + g(0, ts)) * pinch, h, (tz + g(0, ts)) * pinch, r.random()))
        self.plume_h = plume_h

    def p(self, x, y, z):
        return self.cx + x * self.s, self.cy - y * self.s + z * self.s * self.tilt

    def dots(self, pts, color, alpha=0.75, rmin=0.5, rmax=1.5, collapse=0.0, y_offset=0.0):
        out = []
        for x, y, z, k in pts:
            yy = y * (1 - collapse) + y_offset
            px, py = self.p(x, yy, z)
            depth = 0.55 + 0.45 * (z + 9) / 18
            out.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{rmin + (rmax - rmin) * k:.2f}" fill="{color}" opacity="{alpha * max(min(depth, 1), 0.25):.2f}"/>')
        return '\n'.join(out)

    def ring(self, radius, color=BONE, opacity=0.5, ticks=True, gap=0, y=0.0, dash=None, width=1.0):
        rx, ry = radius * self.s, radius * self.s * self.tilt
        cx, cy = self.p(0, y, 0)
        parts = []
        if gap:
            a0 = math.radians(gap / 2)
            a1 = math.radians(360 - gap / 2)
            x0, y0 = cx + rx * math.cos(a0), cy + ry * math.sin(a0)
            x1, y1 = cx + rx * math.cos(a1), cy + ry * math.sin(a1)
            parts.append(f'<path d="M{x0:.1f},{y0:.1f} A{rx:.1f},{ry:.1f} 0 1,1 {x1:.1f},{y1:.1f}" fill="none" stroke="{color}" stroke-width="{width}" opacity="{opacity}"/>')
        else:
            da = f' stroke-dasharray="{dash}"' if dash else ''
            parts.append(f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" fill="none" stroke="{color}" stroke-width="{width}" opacity="{opacity}"{da}/>')
        if ticks:
            for d in range(0, 360, 10):
                if gap and (d < gap / 2 + 3 or d > 360 - gap / 2 - 3):
                    continue
                a = math.radians(d)
                ln = 0.06 if d % 30 == 0 else 0.03
                x0, y0 = cx + rx * math.cos(a), cy + ry * math.sin(a)
                x1, y1 = cx + rx * (1 - ln) * math.cos(a), cy + ry * (1 - ln) * math.sin(a)
                parts.append(f'<line x1="{x0:.1f}" y1="{y0:.1f}" x2="{x1:.1f}" y2="{y1:.1f}" stroke="{color}" stroke-width="0.8" opacity="{opacity * 0.8:.2f}"/>')
        return '\n'.join(parts)

    def axis(self, y0, y1, color=REDL, width=1.6, gap=0.0, glow=True):
        out = []
        segs = [(y0, -gap), (gap, y1)] if gap else [(y0, y1)]
        for a, b in segs:
            xa, ya = self.p(0, a, 0)
            xb, yb = self.p(0, b, 0)
            if glow:
                out.append(f'<line x1="{xa:.1f}" y1="{ya:.1f}" x2="{xb:.1f}" y2="{yb:.1f}" stroke="{color}" stroke-width="{width * 5}" opacity="0.10" stroke-linecap="round"/>')
            out.append(f'<line x1="{xa:.1f}" y1="{ya:.1f}" x2="{xb:.1f}" y2="{yb:.1f}" stroke="{color}" stroke-width="{width}" stroke-linecap="round"/>')
        return '\n'.join(out)

    def cross(self, x, y, z, color, size=6, opacity=0.9):
        px, py = self.p(x, y, z)
        return (f'<line x1="{px - size}" y1="{py}" x2="{px + size}" y2="{py}" stroke="{color}" stroke-width="1" opacity="{opacity}"/>'
                f'<line x1="{px}" y1="{py - size}" x2="{px}" y2="{py + size}" stroke="{color}" stroke-width="1" opacity="{opacity}"/>')


def glyph_rain(x0, x1, y0, y1, seed=3, cols=30, rows=16, fade_right=True):
    r = random.Random(seed)
    glyphs = list('0123456789.−[]()+=<>|:ᵀσχΔλμθΣρvWx') + ['th', 'in', 'er', '##']
    out = []
    for c in range(cols):
        x = x0 + (x1 - x0) * (c + r.random() * 0.4) / cols
        head = r.randrange(rows + 6)
        for k in range(rows):
            y = y0 + (y1 - y0) * k / rows
            behind = head - k
            lit = math.exp(-behind / 5) if 0 <= behind < 14 else 0.05
            fade = 1 - (c / cols) * 0.85 if fade_right else 1
            col = '#d8ffe6' if behind == 0 else PHOS
            out.append(t(x, y, r.choice(glyphs), 12, col, MONO, 'middle', 0, '', 400, round(max(lit, 0.06) * fade * 0.85, 2)))
    return '\n'.join(out)


# ---------------------------------------------------------------- banner
def banner():
    W, H = 1280, 420
    sp = Space(960, 250, 21, seed=11, n_disc=1900, n_plume=640)
    rain = glyph_rain(40, 600, 40, 400, seed=5, cols=34, rows=19)
    body = f'''
<rect width="{W}" height="{H}" fill="url(#vg)"/>
<g>{rain}</g>
<rect width="{W}" height="{H}" fill="url(#fadeL)"/>
{sp.ring(10.6, BONE, 0.38, ticks=True, gap=7, width=1)}
{sp.dots(sp.disc, BONE, 0.62)}
{sp.dots(sp.plume, REDL, 0.68)}
{sp.axis(-4.6, sp.plume_h + 3.6, gap=0.55)}
{sp.cross(0, 0, 0, BONE, 5, 0.8)}
{sp.cross(0, sp.plume_h, 0, REDL, 5, 0.9)}
{t(*sp.p(0.55, 0.15, 0), 'μ good', 11, DIM, MONO)}
{t(*sp.p(0.55, sp.plume_h + 0.15, 0), 'μ bad', 11, RED, MONO)}
{t(96, 186, 'S C H I S M', 76, BONE, SERIF, 'start', 0.02)}
{t(100, 226, 'σχίσμα — a cleft, a division', 22, DIM, SERIF, 'start', 0.04, 'font-style:italic;')}
<line x1="100" y1="262" x2="160" y2="262" stroke="{RED}" stroke-width="1.2"/>
{t(100, 298, 'Decide what your model stops doing, or starts.', 25, BONE)}
{t(100, 330, 'Prove the rest held.', 25, DIM, SERIF, 'start', 0, 'font-style:italic;')}
{t(100, 380, 'an agent skill for model-behaviour engineering  ·  weights or prompts  ·  MIT', 12, DIM, MONO, 'start', 0.04)}
'''
    defs = f'''<linearGradient id="fadeL" x1="0" x2="1"><stop offset="0" stop-color="{GROUND}" stop-opacity="0.35"/>
      <stop offset="0.06" stop-color="{GROUND}" stop-opacity="0.88"/><stop offset="0.44" stop-color="{GROUND}" stop-opacity="0.93"/><stop offset="0.6" stop-color="{GROUND}" stop-opacity="0"/></linearGradient>'''
    return frame(W, H, body, defs)


# ---------------------------------------------------------------- the five phases
def phases():
    W, H = 1280, 400
    cw = W / 5
    parts = [smallcaps(40, 46, 'the operation', 16, DIM, 'start', 0.3),
             f'<line x1="{cw * 0.5}" y1="214" x2="{cw * 4.5}" y2="214" stroke="{FAINT}" stroke-width="1" stroke-dasharray="2 6"/>']
    names = ['Frame', 'Map', 'Floor', 'Tournament', 'Seal']
    caps = [['name it — with it, without it', 'seal the vault before any cut'],
            ['locate where it lives', 'or call the operation off'],
            ['the standard procedure, in full', 'its best result sets the mark'],
            ['sever one direction', 'four examiners, one judge'],
            ['the vault, opened once', 'set against the floor']]
    for i in range(5):
        cx = cw * i + cw / 2
        cy = 214
        parts.append(f'<circle cx="{cx}" cy="{cy}" r="74" fill="{GROUND}" stroke="{FAINT}"/>')
        parts.append(t(cx, 104, ['I', 'II', 'III', 'IV', 'V'][i], 22, RED, SERIF, 'middle', 0.1))
        parts.append(t(cx, 326, names[i], 24, BONE, SERIF, 'middle'))
        parts.append(t(cx, 352, caps[i][0], 11.5, DIM, MONO, 'middle'))
        parts.append(t(cx, 370, caps[i][1], 11.5, DIM, MONO, 'middle'))
        parts.append(icon(i, cx, cy))
    return frame(W, H, '\n'.join(parts))


def icon(i, cx, cy):
    s = []
    if i == 0:   # the Samian letter, and the sealed sample
        s.append(f'<path d="M{cx},{cy + 8} L{cx},{cy + 46} M{cx},{cy + 8} L{cx - 30},{cy - 34} M{cx},{cy + 8} L{cx + 30},{cy - 34}" stroke="{BONE}" stroke-width="1.6" fill="none" stroke-linecap="round"/>')
        s.append(f'<circle cx="{cx + 36}" cy="{cy + 30}" r="11" fill="{RED}" opacity="0.9"/><circle cx="{cx + 36}" cy="{cy + 30}" r="7" fill="none" stroke="#ffc4b6" stroke-width="0.8" opacity="0.7"/>')
        s.append(t(cx - 30, cy - 40, 'with', 10, RED, MONO, 'middle'))
        s.append(t(cx + 30, cy - 40, 'without', 10, DIM, MONO, 'middle'))
    elif i == 1:  # armillary and the found axis
        for k, (rx, ry, rot) in enumerate([(52, 18, 0), (50, 20, 60), (48, 19, -60)]):
            s.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" transform="rotate({rot} {cx} {cy})" fill="none" stroke="{BONE}" stroke-width="1" opacity="{0.55 if k == 0 else 0.3}"/>')
        s.append(f'<line x1="{cx - 8}" y1="{cy + 48}" x2="{cx + 8}" y2="{cy - 48}" stroke="{REDL}" stroke-width="1.6"/>')
        s.append(f'<line x1="{cx - 22}" y1="{cy + 30}" x2="{cx + 30}" y2="{cy - 40}" stroke="{PHOS}" stroke-width="0.8" opacity="0.6"/>')
    elif i == 2:  # dashed ring through an untouched plume
        r = random.Random(4)
        for _ in range(60):
            s.append(f'<circle cx="{cx + r.gauss(0, 14):.1f}" cy="{cy - 14 + r.gauss(0, 9):.1f}" r="1.2" fill="{REDL}" opacity="0.7"/>')
        for _ in range(90):
            s.append(f'<circle cx="{cx + r.gauss(0, 24):.1f}" cy="{cy + 26 + r.gauss(0, 3.5):.1f}" r="1.1" fill="{BONE}" opacity="0.6"/>')
        s.append(f'<ellipse cx="{cx}" cy="{cy - 4}" rx="40" ry="10" fill="none" stroke="{BONE}" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.85"/>')
        s.append(f'<line x1="{cx}" y1="{cy - 50}" x2="{cx}" y2="{cy + 46}" stroke="{REDL}" stroke-width="1.4"/>')
    elif i == 3:  # the severed axis, the blade, four examiners
        s.append(f'<line x1="{cx}" y1="{cy - 52}" x2="{cx}" y2="{cy - 5}" stroke="{REDL}" stroke-width="1.6"/>')
        s.append(f'<line x1="{cx}" y1="{cy + 5}" x2="{cx}" y2="{cy + 46}" stroke="{REDL}" stroke-width="1.6"/>')
        s.append(f'<ellipse cx="{cx}" cy="{cy}" rx="58" ry="14" fill="none" stroke="#ffe3d6" stroke-width="1.6"/>')
        for k, (dx, dy) in enumerate([(-40, -24), (40, -24), (-40, 26), (40, 26)]):
            x, y = cx + dx, cy + dy
            s.append(f'<line x1="{x - 5}" y1="{y}" x2="{x + 5}" y2="{y}" stroke="{PHOS}"/><line x1="{x}" y1="{y - 5}" x2="{x}" y2="{y + 5}" stroke="{PHOS}"/>')
            s.append(f'<line x1="{x}" y1="{y}" x2="{cx}" y2="{cy}" stroke="{PHOS}" stroke-width="0.5" opacity="0.4"/>')
            s.append(t(x + (10 if dx > 0 else -10), y + 4, f'T{k + 1}', 9, PHOS, MONO, 'start' if dx > 0 else 'end'))
    else:        # the seal, broken once
        s.append(f'<circle cx="{cx}" cy="{cy - 6}" r="30" fill="{RED}" opacity="0.92"/>')
        s.append(f'<circle cx="{cx}" cy="{cy - 6}" r="22" fill="none" stroke="#ffc4b6" stroke-width="0.9" opacity="0.7"/>')
        s.append(f'<path d="M{cx - 4},{cy - 37} L{cx + 3},{cy - 18} L{cx - 5},{cy - 6} L{cx + 6},{cy + 8} L{cx},{cy + 25}" stroke="{GROUND}" stroke-width="2.4" fill="none"/>')
        s.append(t(cx, cy + 52, '[ · , · ]', 12, PHOS, MONO, 'middle'))
    return '\n'.join(s)


# ---------------------------------------------------------------- the cut, in geometry
def cut():
    W, H = 1280, 470
    a = Space(330, 285, 19, seed=11, n_disc=1300, n_plume=460)
    b = Space(950, 285, 19, seed=11, n_disc=1300, n_plume=460)
    body = f'''
{smallcaps(40, 46, 'the cut, in geometry', 16, DIM, 'start', 0.3)}
{t(W - 40, 46, 'directional ablation — the simplest of the edits', 12, DIM, MONO, 'end')}
{a.ring(10.6, BONE, 0.22, ticks=False)}
{a.dots(a.disc, BONE, 0.55)}
{a.dots(a.plume, REDL, 0.65)}
{a.axis(-3.8, a.plume_h + 3.2)}
{a.cross(0, 0, 0, BONE, 5)}{a.cross(0, a.plume_h, 0, REDL, 5)}
{t(*a.p(1.0, -0.45, 0), 'μ good', 11, DIM, MONO)}
{t(*a.p(1.0, a.plume_h - 0.45, 0), 'μ bad', 11, RED, MONO)}
{t(*a.p(0.45, a.plume_h + 3.0, 0), 'r̂ = normalize(μ bad − μ good)', 11, RED, MONO)}
{b.ring(10.6, BONE, 0.45, ticks=True, gap=7)}
{b.dots(b.plume, BONE, 0.16, 0.5, 1.2)}
{b.dots(b.disc, BONE, 0.55)}
{b.dots(b.plume, BONE, 0.62, collapse=1.0)}
{t(*b.p(1.2, b.plume_h + 1.6, 0), 'the original, kept beside the edit', 11, DIM, MONO)}
<g transform="translate(640 210)">
  <line x1="-46" y1="0" x2="40" y2="0" stroke="{BONE}" stroke-width="1"/>
  <path d="M40,-5 L48,0 L40,5" fill="none" stroke="{BONE}" stroke-width="1"/>
  {t(0, -24, "x′ = x − (r̂ · x) r̂", 17, BONE, MONO, 'middle')}
</g>
{t(330, 432, 'Answers with the behaviour sit off the disc, along one direction.', 16, BONE, SERIF, 'middle')}
{t(950, 432, 'Remove that component. The plume falls; the disc does not move.', 16, BONE, SERIF, 'middle')}
'''
    return frame(W, H, body)


# ---------------------------------------------------------------- the tournament's walls
def box(x, y, w, h, title, sub=None, color=BONE, sub2=None):
    s = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="3" fill="{GROUND}" stroke="{color}" stroke-width="1" opacity="0.95"/>',
         t(x + w / 2, y + 30, title, 19, color, SERIF, 'middle')]
    if sub:
        s.append(t(x + w / 2, y + 52, sub, 11, DIM, MONO, 'middle'))
    if sub2:
        s.append(t(x + w / 2, y + 68, sub2, 11, DIM, MONO, 'middle'))
    return '\n'.join(s)


def arrow(x1, y1, x2, y2, color=BONE, label=None, lx=None, ly=None, width=1, dash=None, opacity=0.8):
    ang = math.atan2(y2 - y1, x2 - x1)
    ax, ay = x2 - 8 * math.cos(ang - 0.45), y2 - 8 * math.sin(ang - 0.45)
    bx, by = x2 - 8 * math.cos(ang + 0.45), y2 - 8 * math.sin(ang + 0.45)
    da = f' stroke-dasharray="{dash}"' if dash else ''
    s = [f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{width}" opacity="{opacity}"{da}/>',
         f'<path d="M{ax:.1f},{ay:.1f} L{x2},{y2} L{bx:.1f},{by:.1f}" fill="none" stroke="{color}" stroke-width="{width}" opacity="{opacity}"/>']
    if label:
        s.append(t(lx if lx is not None else (x1 + x2) / 2, ly if ly is not None else (y1 + y2) / 2 - 8, label, 11, color if color != BONE else DIM, MONO, 'middle'))
    return '\n'.join(s)


def tournament():
    W, H = 1280, 560
    tx = 640
    testers = [('T1 · behaviour', 'is it gone?'), ('T2 · preservation', 'did the rest move?'),
               ('T3 · capability', 'can it still do the work?'), ('T4 · Goodhart', 'was it gamed?')]
    p = [smallcaps(40, 46, 'the tournament', 16, DIM, 'start', 0.3),
         t(W - 40, 46, 'Alchemist runs it  ·  a prompt compiler, P ↦ Q, writes every prompt in it', 12, DIM, MONO, 'end'),
         box(48, 200, 220, 96, 'The hand that cuts', 'Smith · operator compiler', BONE, 'one candidate per call'),
         box(340, 200, 190, 96, 'Bench', 'apply · run dev · reset', BONE, 'decides nothing'),
         arrow(268, 248, 338, 248, BONE, 'candidate')]
    ys = [92, 182, 272, 362]
    for i, (name, q) in enumerate(testers):
        y = ys[i]
        col = PHOS
        p.append(f'<rect x="{tx}" y="{y}" width="230" height="72" rx="3" fill="{GROUND}" stroke="{col}" stroke-width="1" opacity="0.9"/>')
        p.append(t(tx + 115, y + 30, name, 16, col, MONO, 'middle'))
        p.append(t(tx + 115, y + 52, q, 13, DIM, SERIF, 'middle', 0, 'font-style:italic;'))
        p.append(arrow(530, 248, tx - 2, y + 36, BONE, None, width=1.6 if i == 3 else 0.8, opacity=0.9 if i == 3 else 0.55))
        if i < 3:   # the walls between examiners
            p.append(f'<line x1="{tx - 6}" y1="{y + 81}" x2="{tx + 236}" y2="{y + 81}" stroke="{BONE}" stroke-width="2.2" opacity="0.35"/>')
            p.append(f'<line x1="{tx - 6}" y1="{y + 86}" x2="{tx + 236}" y2="{y + 86}" stroke="{BONE}" stroke-width="0.6" opacity="0.35"/>')
    p.append(t(tx + 115, 452, 'kept apart: each sees only its own slice', 11, DIM, MONO, 'middle'))
    p.append(t(tx + 115, 468, 'T4 alone sees the whole bundle', 11, DIM, MONO, 'middle'))
    p.append(box(990, 200, 240, 96, 'The judge', 'Arbiter', BONE, 'every verdict · the whole history'))
    for y in ys:
        p.append(arrow(tx + 232, y + 36, 988, 248, PHOS, None, width=0.8, opacity=0.6))
    p.append(t(930, 104, 'verdicts', 11, PHOS, MONO, 'middle'))
    # one fix, back to the hand that cuts, under everything
    p.append(f'<path d="M1110,298 L1110,516 L158,516 L158,300" fill="none" stroke="{BONE}" stroke-width="1.2" opacity="0.85"/>')
    p.append(f'<path d="M153,308 L158,298 L163,308" fill="none" stroke="{BONE}" stroke-width="1.2"/>')
    p.append(t(634, 506, 'one fix — the only thing the hand that cuts ever receives', 13, BONE, SERIF, 'middle', 0, 'font-style:italic;'))
    # the wall the verdicts never cross
    p.append(t(158, 146, 'never sees a verdict', 13, RED, MONO, 'middle'))
    p.append(t(158, 166, 'a compiler that sees which test failed', 11, DIM, MONO, 'middle'))
    p.append(t(158, 182, 'learns to satisfy the test', 11, DIM, MONO, 'middle'))
    return frame(W, H, '\n'.join(p))


# ---------------------------------------------------------------- two branches
def branches():
    W, H = 1280, 450
    r = random.Random(9)
    p = [smallcaps(40, 46, 'two branches', 16, DIM, 'start', 0.3)]
    # the veil
    for k in range(26):
        x = 612 + k * 2.2 + r.random() * 0.8
        p.append(f'<line x1="{x:.1f}" y1="{80 + r.random() * 40:.1f}" x2="{x:.1f}" y2="{350 + r.random() * 40:.1f}" stroke="{BONE}" stroke-width="0.5" opacity="{0.06 + r.random() * 0.14:.2f}"/>')
    p.append(t(640, 76, 'the veil', 11, DIM, MONO, 'middle'))
    # left: open weights — the matrix and its adapter beside it
    mx, my = 120, 120
    for row in range(9):
        for col in range(7):
            v = r.gauss(0, 0.04)
            txt = (f'{v:.2f}').replace('-0.00', '0.00').replace('-', '−')
            p.append(t(mx + 30 + col * 37, my + row * 21, txt, 10.5, PHOS, MONO, 'end', 0, '', 400, round(0.35 + r.random() * 0.5, 2)))
    p.append(f'<path d="M{mx - 10},{my - 18} L{mx - 16},{my - 18} L{mx - 16},{my + 182} L{mx - 10},{my + 182}" fill="none" stroke="{PHOS}" stroke-width="1.2"/>')
    p.append(f'<path d="M{mx + 276},{my - 18} L{mx + 282},{my - 18} L{mx + 282},{my + 182} L{mx + 276},{my + 182}" fill="none" stroke="{PHOS}" stroke-width="1.2"/>')
    p.append(t(mx + 133, my + 214, 'W — never overwritten', 13, DIM, MONO, 'middle'))
    p.append(t(mx + 318, my + 88, '+', 22, BONE, SERIF, 'middle'))
    p.append(f'<rect x="{mx + 340}" y="{my + 34}" width="84" height="96" rx="2" fill="none" stroke="{RED}" stroke-width="1.2"/>')
    p.append(t(mx + 382, my + 80, 'B·A', 18, RED, MONO, 'middle'))
    p.append(t(mx + 382, my + 104, 'adapter', 11, DIM, MONO, 'middle'))
    p.append(t(mx + 382, my + 152, 'beside it,', 11, DIM, MONO, 'middle'))
    p.append(t(mx + 382, my + 166, 'reversible', 11, DIM, MONO, 'middle'))
    p.append(t(320, 390, 'Open weights', 24, BONE, SERIF, 'middle'))
    p.append(t(320, 414, 'edit the matrices · measure first-token KL on neutral prompts', 11.5, DIM, MONO, 'middle'))
    # right: closed model — operator in, answers out, measured as geometry
    p.append(f'<rect x="770" y="150" width="120" height="120" rx="3" fill="#0b0b0f" stroke="{FAINT}"/>')
    p.append(t(830, 216, 'model', 15, DIM, SERIF, 'middle', 0, 'font-style:italic;'))
    p.append(t(830, 236, 'untouched', 11, DIM, MONO, 'middle'))
    for i, line in enumerate(['system prompt', 'prefix', 'suffix']):
        p.append(t(686, 132 + i * 18, line, 11, RED, MONO, 'start'))
    p.append(arrow(744, 164, 768, 184, RED, None, width=1))
    p.append(arrow(892, 210, 960, 210, BONE, 'answers', 926, 200))
    cx, cy = 1078, 210
    for _ in range(260):
        a, rr = r.random() * 6.283, abs(r.gauss(0, 34))
        p.append(f'<circle cx="{cx + math.cos(a) * rr * 1.4:.1f}" cy="{cy + math.sin(a) * rr * 0.8:.1f}" r="1.1" fill="{BONE}" opacity="{0.25 + r.random() * 0.5:.2f}"/>')
    for _ in range(90):
        a, rr = r.random() * 6.283, abs(r.gauss(0, 20))
        p.append(f'<circle cx="{cx + 34 + math.cos(a) * rr * 1.3:.1f}" cy="{cy - 30 + math.sin(a) * rr * 0.8:.1f}" r="1.1" fill="{REDL}" opacity="{0.3 + r.random() * 0.5:.2f}"/>')
    p.append(t(cx, 300, 'embeddings of its answers', 11, DIM, MONO, 'middle'))
    p.append(t(960, 390, 'Closed models', 24, BONE, SERIF, 'middle'))
    p.append(t(960, 414, '“this model, with this operator” — never a changed model', 11.5, DIM, MONO, 'middle'))
    return frame(W, H, '\n'.join(p))


FIGURES = {'banner': banner, 'phases': phases, 'cut': cut, 'tournament': tournament, 'branches': branches}


def page(svg):
    ff = lambda name: (FONTS / name).as_uri()
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face {{ font-family: "EB Garamond"; font-style: normal; src: url({ff('eb-garamond-latin-400-normal.woff2')}); unicode-range: U+0000-02FF, U+2000-206F, U+2190-22FF; }}
@font-face {{ font-family: "EB Garamond"; font-style: normal; src: url({ff('eb-garamond-greek-400-normal.woff2')}); unicode-range: U+0370-03FF; }}
@font-face {{ font-family: "EB Garamond"; font-style: italic; src: url({ff('eb-garamond-latin-400-italic.woff2')}); unicode-range: U+0000-02FF, U+2000-206F; }}
@font-face {{ font-family: "EB Garamond"; font-style: italic; src: url({ff('eb-garamond-greek-400-italic.woff2')}); unicode-range: U+0370-03FF; }}
@font-face {{ font-family: "JetBrains Mono"; src: url({ff('jetbrains-mono-latin-400-normal.woff2')}); unicode-range: U+0000-02FF, U+2000-206F, U+2190-22FF; }}
@font-face {{ font-family: "JetBrains Mono"; src: url({ff('jetbrains-mono-greek-400-normal.woff2')}); unicode-range: U+0370-03FF; }}
html, body {{ margin: 0; background: transparent; }} svg {{ display: block; }}
</style></head><body>{svg}</body></html>'''


def main(names):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b = p.chromium.launch(channel='chrome', headless=True)
        pg = b.new_page(viewport={'width': 1280, 'height': 600}, device_scale_factor=2)
        for name in names:
            svg = FIGURES[name]()
            (SRC / f'{name}.svg').write_text(svg)
            html = SRC / f'_{name}.html'
            html.write_text(page(svg))
            pg.goto(html.as_uri())
            pg.evaluate('document.fonts.ready')
            pg.wait_for_timeout(300)
            pg.locator('svg').screenshot(path=str(OUT / f'{name}.png'), omit_background=True)
            html.unlink()
            print('wrote', name)
        b.close()


if __name__ == '__main__':
    main(sys.argv[1:] or list(FIGURES))
