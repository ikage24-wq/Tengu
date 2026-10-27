#!/usr/bin/env python3
"""Builds the effect sprite strips in assets/fx/ and the list the game reads
(src/render/fx-sheets.js): Tengu's own effect art (tools/fx-art.js, drawn in the browser by
tools/draw-fx.cjs: the `cel*` strips), and the pixel effect packs the archer paths still use.

Usage: python3 tools/build-fx.py PACKS_DIR

PACKS_DIR holds the unzipped packs (licenses and sources in assets/fx/CREDITS.md):
  pvfx/      PVFX Foundry (Pixel VFX Studio, CC0): https://nerijs.itch.io/pvfx-foundry
             (its effects/<name>/grid/sprite-sheet.png: 96x96 cells, five columns, 20 fps)
  codemanu/  Free Pixel Effects Pack (CodeManu, CC0):
             https://opengameart.org/content/free-pixel-effects-pack
             (<n>_<name>_spritesheet.png: 100x100 cells in a square grid)

Each pack effect is cut into frames, blank frames dropped, optionally recoloured (a hue shift that
keeps each pixel's lightness, so the artist's shading survives), trimmed to the box all its frames
share, and laid out as one horizontal strip. Tengu's own art arrives drawn and matched to the
sprites, and is trimmed and laid out the same way. Needs Pillow, and Playwright for the drawing.
"""

import colorsys
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Pack effects (the archer paths). name: (pack, effect, options). `hue` recolours to that hue (0-360), `sat` scales saturation,
# `fps` overrides the pack's rate, `loop` marks a looping effect, `start` skips opening frames,
# `tpivot` / `cpivot` set the anchor in the trimmed frame / the pack's cell (a slash's anchor is the
# middle of its curve), `light` darkens (or brightens, above 1) (below 1) all but the whitest pixels, `clip` erases everything further left of the burst's middle than that many pixels.
FX = {
    # The Ranger's wind.
    'leafgust': ('pvfx', 'leaf-gust', {'hue': 118, 'sat': 1.05}),
    'windspin': ('codemanu', 'firespin', {'hue': 152, 'sat': 0.85, 'fps': 30, 'loop': True}),
    'windring': ('pvfx', 'splash-crown', {'hue': 150, 'sat': 1.1}),
    'windwisp': ('pvfx', 'magical-projectile', {'hue': 150}),
    'windslash': ('pvfx', 'crescent-slash', {'hue': 150, 'sat': 1.2}),
    'dust': ('pvfx', 'landing-dust', {}),
    'smoke': ('pvfx', 'smoke-puff', {}),
    # The Sniper's steel, frost and blasts.
    # A beam's cut-off burst, kept as a bolt's hit: the beam leading into it is erased (`clip`), or
    # it reads as a second bolt stuck in the monster.
    'boltburst': ('pvfx', 'beam-cutoff-burst', {'start': 4, 'clip': 14}),
    'boltspark': ('pvfx', 'electric-impact', {}),
    'charge': ('pvfx', 'focus-charge', {}),
    'shrapnel': ('pvfx', 'solar-shrapnel', {'hue': 205, 'sat': 0.8}),
    'frostnova': ('pvfx', 'frost-nova', {}),
    'freezing': ('codemanu', 'freezing', {'fps': 40}),
    'icestar': ('codemanu', 'nebula', {'fps': 40}),
    'explosion': ('pvfx', 'warm-explosion', {}),
    'sunburst': ('codemanu', 'sunburn', {'fps': 40}),
    'deadstar': ('codemanu', 'phantom', {'hue': 345, 'sat': 1.3, 'fps': 40}),
    'hitring': ('codemanu', 'weaponhit', {'fps': 40}),
    'breakring': ('pvfx', 'resonant-break', {}),
}



def pvfx_frames(base, effect):
    d = os.path.join(base, 'pvfx', 'effects', effect, 'grid')
    sheet = Image.open(os.path.join(d, 'sprite-sheet.png')).convert('RGBA')
    m = json.load(open(os.path.join(d, 'manifest.json')))
    frames = [sheet.crop((f['sheet']['x'], f['sheet']['y'], f['sheet']['x'] + 96, f['sheet']['y'] + 96)) for f in m['frames']]
    return frames, m.get('pivot', [48, 48]), 20


def codemanu_frames(base, effect):
    d = os.path.join(base, 'codemanu')
    name = next(f for f in os.listdir(d) if f.endswith(f'_{effect}_spritesheet.png'))
    sheet = Image.open(os.path.join(d, name)).convert('RGBA')
    cols = sheet.width // 100
    rows = sheet.height // 100
    frames = [sheet.crop((c * 100, r * 100, c * 100 + 100, r * 100 + 100)) for r in range(rows) for c in range(cols)]
    return frames, [50, 50], 60


def cel_frames():
    # Tengu's own effect art (tools/fx-art.js), drawn by tools/draw-fx.cjs in the browser.
    import subprocess
    import tempfile
    tmp = tempfile.mkdtemp()
    subprocess.run(['node', os.path.join(ROOT, 'tools', 'draw-fx.cjs'), tmp], check=True)
    meta = json.load(open(os.path.join(tmp, 'meta.json')))
    frames = {n: [Image.open(os.path.join(tmp, n, f'{i}.png')).convert('RGBA') for i in range(m['n'])] for n, m in meta.items()}
    return frames, meta


def recolour(img, hue, sat, light=1):
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
            r2, g2, b2 = colorsys.hls_to_rgb(hue / 360, min(1, l * light) if l < 0.97 else l, min(1, s * sat))
            px[x, y] = (round(r2 * 255), round(g2 * 255), round(b2 * 255), a)
    return img


def build(base):
    out_dir = os.path.join(ROOT, 'assets', 'fx')
    os.makedirs(out_dir, exist_ok=True)
    sheets = {}
    entries = [(n, p, e, o) for n, (p, e, o) in FX.items()]
    cel, cel_meta = cel_frames()
    entries += [('cel' + n, 'cel', n, {'fps': m['fps'], 'loop': m['loop']}) for n, m in cel_meta.items()]
    for name, pack, effect, o in entries:
        if pack == 'cel':
            frames = cel[effect]
            m = cel_meta[effect]
            pivot, fps = [m['px'], m['py']], m['fps']
            if m['swing']:
                o = dict(o, swing_rad=m['swing'])
        else:
            frames, pivot, fps = {'pvfx': pvfx_frames, 'codemanu': codemanu_frames}[pack](base, effect)
        frames = frames[o.get('start', 0):]
        if 'clip' in o:
            # Measured from the burst's own middle (its last frame, the ring alone), and the
            # effect is anchored there instead.
            b = [f for f in frames if f.getbbox()][-1].getbbox()
            cx, cy = (b[0] + b[2]) // 2, (b[1] + b[3]) // 2
            for f in frames:
                f.paste((0, 0, 0, 0), (0, 0, max(0, cx - o['clip']), f.height))
            pivot = [cx, cy]
        frames = [f for f in frames if f.getbbox()]
        if 'hue' in o:
            frames = [recolour(f, o['hue'], o.get('sat', 1), o.get('light', 1)) for f in frames]
        boxes = [f.getbbox() for f in frames]
        x0 = min(b[0] for b in boxes)
        y0 = min(b[1] for b in boxes)
        x1 = max(b[2] for b in boxes)
        y1 = max(b[3] for b in boxes)
        w, h = x1 - x0, y1 - y0
        strip = Image.new('RGBA', (w * len(frames), h), (0, 0, 0, 0))
        for i, f in enumerate(frames):
            strip.paste(f.crop((x0, y0, x1, y1)), (i * w, 0))
        strip.save(os.path.join(out_dir, f'{name}.png'), optimize=True)
        px, py = o.get('tpivot', (pivot[0] - x0, pivot[1] - y0))
        if 'cpivot' in o:
            px, py = o['cpivot'][0] - x0, o['cpivot'][1] - y0
        sheets[name] = {'w': w, 'h': h, 'n': len(frames), 'fps': o.get('fps', fps), 'px': round(px), 'py': round(py), 'loop': bool(o.get('loop')),
                       'swing': [round(o['swing_rad'][0], 3), o['swing_rad'][1], o['swing_rad'][2]] if 'swing_rad' in o else None}
        print(f'{name:10s} {len(frames):3d} frames {w}x{h}')
    lines = ['// Generated by tools/build-fx.py: the effect sprite strips in assets/fx/ (Tengu\'s own effect',
             '// art, `cel*`, and pixel effect packs; see assets/fx/CREDITS.md). Each strip is `n` frames of',
             '// w x h laid side by side, played at `fps`; (px, py) is the point in a frame that sits on the',
             '// effect\'s position. A swipe\'s r, mid and turn are its radius, the angle of its sweep\'s',
             '// middle and which way it sweeps (1 clockwise), so it can be laid along a blade\'s swing.',
             '', 'export const FX_SHEETS = {']
    for name, s in sheets.items():
        extra = ''
        if s.get('swing'):
            extra += f", r: {s['swing'][2]}, mid: {s['swing'][0]}, turn: {s['swing'][1]}"
        lines.append(f"  {name}: {{ w: {s['w']}, h: {s['h']}, n: {s['n']}, fps: {s['fps']}, px: {s['px']}, py: {s['py']}, loop: {str(s['loop']).lower()}{extra} }},")
    lines.append('};')
    open(os.path.join(ROOT, 'src', 'render', 'fx-sheets.js'), 'w').write('\n'.join(lines) + '\n')


if __name__ == '__main__':
    build(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'packs'))
