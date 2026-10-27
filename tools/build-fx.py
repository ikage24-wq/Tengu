#!/usr/bin/env python3
"""Builds the effect sprite strips in assets/fx/ from downloaded effect packs, and the list the game
reads (src/render/fx-sheets.js). HD packs (smooth painted and rendered effect art) are what new
effects use; the pixel packs remain only for effects not yet redone.

Usage: python3 tools/build-fx.py PACKS_DIR

PACKS_DIR holds the unzipped packs (licenses and sources in assets/fx/CREDITS.md):
  pvfx/      PVFX Foundry (Pixel VFX Studio, CC0): https://nerijs.itch.io/pvfx-foundry
             (its effects/<name>/grid/sprite-sheet.png: 96x96 cells, five columns, 20 fps)
  codemanu/  Free Pixel Effects Pack (CodeManu, CC0):
             https://opengameart.org/content/free-pixel-effects-pack
             (<n>_<name>_spritesheet.png: 100x100 cells in a square grid)
HD packs:
  brackeys/  Brackeys VFX Bundle (CC0; Kenney's particle textures, Thomas Iche's flipbooks):
             https://brackeysgames.itch.io/brackeys-vfx-bundle (unzipped brackeys_vfx_bundle/)
  sinestesia/ Sinestesia's hit, blood and explosion animations (CC0), from OpenGameArt:
             blood-hit-1..3.png  https://opengameart.org/node/81933 (0_16, 1_128, 2_75.png)
             hit-1-yellow.png    https://opengameart.org/node/80085 ("hit - yellow.png")
             hit-2-yellow.png    https://opengameart.org/node/84746 (Hit-Yellow.png)
             explosions2/        https://opengameart.org/node/74923 (the zip's 1-4.png)
  cethiel/   Weapon Slash - Effect (Cethiel, CC0): https://opengameart.org/content/weapon-slash-effect

Each effect is cut into frames, blank frames dropped, optionally recoloured (a hue shift that
keeps each pixel's lightness, so the artist's shading survives; a white texture is coloured with
`tint`, deep at its thin edges and white where it's dense), trimmed to the box all its frames
share, and laid out as one horizontal strip. HD effects are scaled so their longest side is
`size` strip pixels (one strip pixel is one screen pixel at scale 1) and marked `hd`, so the game
draws them smoothed. Needs Pillow.
"""

import colorsys
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Pixel effects, kept only until the archer paths are redone in HD (the player wants smooth HD
# effects, not pixel ones). name: (pack, effect, options). `hue` recolours to that hue (0-360), `sat` scales saturation,
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

# HD effects: (pack, file, options). `grid` [cols, rows] cuts a flipbook (`n` frames of it),
# `files` is a folder of numbered frames, otherwise the file is one texture the game animates by
# moving, turning, growing and fading it. `size` is the longest side in strip pixels, `step` keeps every so many frames, `tint`
# colours a white texture, `lum` turns a black-backed (additive) image into one with alpha, `lift` turns dark smoke pale, `add`
# marks it for additive drawing (light that brightens what's under it): only white, steel and cold
# colours, since added onto the game's light pastel maps red turns pink and gold turns white.
STEEL, GOLD, RED, BLOOD, EMBER = '#5fa8ff', '#ffb52e', '#ff3b2e', '#c4001f', '#ff7a1a'
HD = {
    # Blade cuts: Cethiel's glowing thrusts and cut marks (6 frames each) in steel blue and red.
    'hdthrust': ('cethiel', 'Alternative 2/4', {'files': True, 'size': 150, 'add': True}),
    'hdthrustred': ('cethiel', 'Alternative 3/4', {'files': True, 'size': 150, 'hue': 356, 'sat': 1.2}),
    'hdcut': ('cethiel', 'Alternative 2/5', {'files': True, 'size': 130, 'add': True}),
    # Hits: Sinestesia's hit flashes and blood bursts.
    'hdhit': ('sinestesia', 'hit-2-yellow.png', {'grid': [4, 4], 'size': 200, 'fps': 40}),
    'hdhitsteel': ('sinestesia', 'hit-2-yellow.png', {'grid': [4, 4], 'size': 200, 'fps': 40, 'hue': 212, 'sat': 0.8}),
    'hdbloodstar': ('sinestesia', 'blood-hit-1.png', {'grid': [4, 4], 'size': 190, 'fps': 36}),
    'hdblood': ('sinestesia', 'blood-hit-2.png', {'grid': [4, 4], 'size': 190, 'fps': 30}),
    'hdbloodx': ('sinestesia', 'blood-hit-3.png', {'grid': [4, 4], 'size': 190, 'fps': 36}),
    'hdholyhit': ('sinestesia', 'hit-1-yellow.png', {'grid': [4, 4], 'size': 180, 'fps': 40, 'light': 1.15}),
    # Fire, smoke and blasts: rendered flipbooks.
    'hdexplode': ('sinestesia', 'explosions2/1.png', {'step': 2, 'grid': [8, 8], 'size': 220, 'fps': 50}),
    'hddust': ('brackeys', 'flipbooks/explosion_smoke_01_8x8.tga', {'lift': [236, 226, 246], 'grid': [5, 5], 'size': 170, 'fps': 40}),
    'hdflame': ('brackeys', 'flipbooks/flame_01_16x4.tga', {'grid': [16, 4], 'size': 110, 'fps': 40, 'loop': True}),
    'hdfire': ('brackeys', 'flipbooks/fire_01_8x8.tga', {'step': 2, 'grid': [8, 8], 'size': 150, 'fps': 40, 'lum': True}),
    'hdsmoke': ('brackeys', 'flipbooks/wispy_smoke_01_8x8.tga', {'lift': [236, 230, 248], 'step': 2, 'grid': [8, 8], 'size': 160, 'fps': 40}),
    # Textures the game animates (Kenney's particles via the Brackeys bundle).
    'hdflare': ('brackeys', 'particles/alpha/spotlight_05_a.png', {'size': 160, 'tint': '#fff3c0', 'add': True}),
    'hdflaregold': ('brackeys', 'particles/alpha/spotlight_05_a.png', {'size': 160, 'tint': GOLD}),
    'hdflarered': ('brackeys', 'particles/alpha/spotlight_05_a.png', {'size': 160, 'tint': RED}),
    'hdflaresteel': ('brackeys', 'particles/alpha/spotlight_05_a.png', {'size': 160, 'tint': STEEL, 'add': True}),
    'hdstar': ('brackeys', 'particles/alpha/star_08_a.png', {'size': 140, 'tint': '#fff6d0', 'add': True}),
    'hdrays': ('brackeys', 'particles/alpha/effect_02_a.png', {'size': 220, 'tint': '#ffffff', 'add': True}),
    'hdraysgold': ('brackeys', 'particles/alpha/effect_02_a.png', {'size': 220, 'tint': GOLD}),
    'hdraysred': ('brackeys', 'particles/alpha/effect_02_a.png', {'size': 220, 'tint': RED}),
    'hdrayssteel': ('brackeys', 'particles/alpha/effect_03_a.png', {'size': 220, 'tint': STEEL, 'add': True}),
    'hdring': ('brackeys', 'particles/alpha/circle_02_a.png', {'size': 200, 'tint': STEEL, 'add': True}),
    'hdringgold': ('brackeys', 'particles/alpha/circle_02_a.png', {'size': 200, 'tint': GOLD}),
    'hdringred': ('brackeys', 'particles/alpha/circle_02_a.png', {'size': 200, 'tint': RED}),
    'hdringarcane': ('brackeys', 'particles/alpha/circle_02_a.png', {'size': 200, 'tint': '#b05cff', 'add': True}),
    'hdringice': ('brackeys', 'particles/alpha/circle_02_a.png', {'size': 200, 'tint': '#3fd2ff', 'add': True}),
    'hdringfire': ('brackeys', 'particles/alpha/circle_02_a.png', {'size': 200, 'tint': EMBER}),
    'hdringpoison': ('brackeys', 'particles/alpha/circle_02_a.png', {'size': 200, 'tint': '#5fe03a'}),
    'hdringwind': ('brackeys', 'particles/alpha/circle_02_a.png', {'size': 200, 'tint': '#22d68a', 'add': True}),
    'hdringshadow': ('brackeys', 'particles/alpha/circle_02_a.png', {'size': 200, 'tint': '#7a3cff', 'add': True}),
    'hdbeam': ('brackeys', 'particles/alpha/trace_07_a.png', {'size': 220, 'tint': GOLD}),
    'hdbeamred': ('brackeys', 'particles/alpha/trace_07_a.png', {'size': 220, 'tint': RED}),
    'hdstreak': ('brackeys', 'particles/alpha/trace_01_a.png', {'size': 200, 'tint': STEEL, 'add': True}),
    'hdsigil': ('brackeys', 'particles/alpha/magic_03_a.png', {'size': 180, 'tint': GOLD}),
    'hdcircle': ('brackeys', 'particles/alpha/magic_02_a.png', {'size': 220, 'tint': GOLD}),
    'hdtwirl': ('brackeys', 'particles/alpha/twirl_02_a.png', {'size': 200, 'tint': STEEL, 'add': True}),
    'hdtwirlred': ('brackeys', 'particles/alpha/twirl_02_a.png', {'size': 200, 'tint': RED}),
    'hdvortex': ('brackeys', 'particles/alpha/twirl_04_a.png', {'size': 220, 'tint': BLOOD}),
    'hdmoon': ('brackeys', 'particles/alpha/circle_05_a.png', {'size': 200, 'tint': BLOOD}),
    'hdslasharc': ('brackeys', 'particles/alpha/slash_01_a.png', {'size': 200, 'cpivot': [100, 102], 'tint': '#2f86ff'}),
    'hdslashcore': ('brackeys', 'particles/alpha/slash_01_a.png', {'size': 200, 'cpivot': [100, 102], 'tint': '#ffffff', 'add': True}),
    'hdslasharcgold': ('brackeys', 'particles/alpha/slash_01_a.png', {'size': 200, 'cpivot': [100, 102], 'tint': GOLD}),
    'hdslasharcred': ('brackeys', 'particles/alpha/slash_01_a.png', {'size': 200, 'cpivot': [100, 102], 'tint': RED}),
    'hddirt': ('brackeys', 'particles/alpha/dirt_02_a.png', {'size': 160, 'tint': '#8a6a52'}),
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


def hd_frames(base, path, o):
    full = os.path.join(base, path)
    if o.get('files'):
        frames = [Image.open(os.path.join(full, f)).convert('RGBA') for f in sorted(os.listdir(full)) if f.endswith('.png')]
    else:
        sheet = Image.open(full)
        if o.get('lum'):
            # A black-backed image meant for additive drawing: its brightness becomes its alpha.
            rgb = sheet.convert('RGB')
            px = rgb.load()
            out = Image.new('RGBA', rgb.size)
            po = out.load()
            for y in range(rgb.height):
                for x in range(rgb.width):
                    r, g, b = px[x, y]
                    m = max(r, g, b)
                    po[x, y] = (min(255, r * 255 // m), min(255, g * 255 // m), min(255, b * 255 // m), m) if m else (0, 0, 0, 0)
            sheet = out
        sheet = sheet.convert('RGBA')
        if 'grid' in o:
            cols, rows = o['grid']
            cw, ch = sheet.width // cols, sheet.height // rows
            frames = [sheet.crop((c * cw, r * ch, c * cw + cw, r * ch + ch)) for r in range(rows) for c in range(cols)]
        else:
            frames = [sheet]
    w, h = frames[0].size
    k = o['size'] / max(w, h)
    frames = [f.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS) for f in frames]
    return frames, [frames[0].width / 2, frames[0].height / 2], 30


def tint(img, colour):
    # A white texture coloured like light: the colour where it's thin, white where it's dense.
    r0, g0, b0 = (int(colour[i:i + 2], 16) for i in (1, 3, 5))
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            d = (a / 255) * (max(r, g, b) / 255)
            k = max(0, d - 0.55) / 0.45
            k = k * k
            px[x, y] = (round(r0 + (255 - r0) * k), round(g0 + (255 - g0) * k), round(b0 + (255 - b0) * k), min(255, round(a * 1.15)))
    return img


def lift(img, top):
    # Dark smoke turned pale: its shading kept, but between a soft mid tone and `top`.
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a:
                l = (r + g + b) / 765
                px[x, y] = tuple(round(c * (0.62 + 0.38 * l)) for c in top) + (a,)
    return img


def recolour_light(img, light):
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a:
                px[x, y] = (min(255, round(r * light)), min(255, round(g * light)), min(255, round(b * light)), a)
    return img


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
    entries = [(n, p, e, o, False) for n, (p, e, o) in FX.items()] + [(n, p, e, o, True) for n, (p, e, o) in HD.items()]
    for name, pack, effect, o, hd in entries:
        if hd:
            frames, pivot, fps = hd_frames(os.path.join(base, pack), effect, o)
        else:
            frames, pivot, fps = {'pvfx': pvfx_frames, 'codemanu': codemanu_frames}[pack](base, effect)
        frames = frames[o.get('start', 0)::o.get('step', 1)]
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
        elif 'lift' in o:
            frames = [lift(f, o['lift']) for f in frames]
        elif 'light' in o and hd:
            frames = [recolour_light(f, o['light']) for f in frames]
        if 'tint' in o:
            frames = [tint(f, o['tint']) for f in frames]
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
        sheets[name] = {'w': w, 'h': h, 'n': len(frames), 'fps': o.get('fps', fps), 'px': round(px), 'py': round(py), 'loop': bool(o.get('loop')), 'hd': hd, 'add': bool(o.get('add'))}
        print(f'{name:10s} {len(frames):3d} frames {w}x{h}')
    lines = ['// Generated by tools/build-fx.py: the effect sprite strips in assets/fx/ (effect art from',
             '// effect packs; see assets/fx/CREDITS.md). Each strip is `n` frames of w x h laid side by',
             '// side, played at `fps`; (px, py) is the point in a frame that sits on the effect\'s position',
             '// (the pack\'s pivot). `hd` strips are smooth HD art, drawn smoothed; `add` ones are light,',
             '// drawn additively.', '', 'export const FX_SHEETS = {']
    for name, s in sheets.items():
        extra = (', hd: true' if s['hd'] else '') + (', add: true' if s['add'] else '')
        lines.append(f"  {name}: {{ w: {s['w']}, h: {s['h']}, n: {s['n']}, fps: {s['fps']}, px: {s['px']}, py: {s['py']}, loop: {str(s['loop']).lower()}{extra} }},")
    lines.append('};')
    open(os.path.join(ROOT, 'src', 'render', 'fx-sheets.js'), 'w').write('\n'.join(lines) + '\n')


if __name__ == '__main__':
    build(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'packs'))
