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
             explosions2/        https://opengameart.org/node/74923 (the zip's 1-4.png)
  cethiel/   Weapon Slash - Effect (Cethiel, CC0): https://opengameart.org/content/weapon-slash-effect
  jellyfish-fx/ Sprite Effects parts 1-2 (jellyfish0, CC0): https://opengameart.org/content/sprite-effects-part-1
             and -part-2, unzipped together (vfx1..vfx7/ and 21/, frame folders of numbered PNGs).
  inguz-impacts/ 2DFX Impact Spritesheets (Inguz Media, CC BY 4.0):
             https://opengameart.org/content/2dfx-impact-spritesheets (impact04_0.png, 8x8 atlas)
  rajakutai-hitspark/ Slash (Raja_Kutai, CC0): https://opengameart.org/content/slash-0 (256_0.png)
  kutejnikov-auras/ Auras (Pavel Kutejnikov, CC0): https://opengameart.org/content/auras
  gameicons/ game-icons.net (CC BY 3.0, see assets/fx/CREDITS.md): the SVG archive
             https://game-icons.net/archives/svg/zip/ffffff/transparent/game-icons.net.svg.zip
             unzipped as gameicons/ (icons/ffffff/transparent/1x1/<author>/<name>.svg). Its shapes
             (slashes, emblems, bursts) are rendered (tools/svg-to-png.cjs, needs Playwright) and
             turned into glowing effect art: a white-hot core, the colour, a deep rim and a soft
             glow, with frames that break up into sparkles.

Each effect is cut into frames, blank frames dropped, optionally recoloured (a hue shift that
keeps each pixel's lightness, so the artist's shading survives; a white texture is coloured with
`tint`, deep at its thin edges and white where it's dense), trimmed to the box all its frames
share, and laid out as one horizontal strip. HD effects are scaled so their longest side is
`size` strip pixels (one strip pixel is one screen pixel at scale 1) and marked `hd`, so the game
draws them smoothed. Needs Pillow.
"""

import colorsys
import math
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
# colours a white texture (`white` caps how white its dense parts burn), `lum` turns a black-backed (additive) image into one with alpha, `lift` turns dark smoke pale, `add`
# marks it for additive drawing (light that brightens what's under it): only white, steel and cold
# colours, since added onto the game's light pastel maps red turns pink and gold turns white.
STEEL, GOLD, RED, BLOOD, EMBER = '#5fa8ff', '#ffb52e', '#ff3b2e', '#c4001f', '#ff7a1a'
HD = {
    # jellyfish0's painted effects (CC0), the warriors' main art. A swipe's `swing` is [the angle
    # of its sweep's middle (degrees, 90 = straight down), which way it sweeps (1 clockwise on
    # screen, -1 counter), its radius as a share of the frame]; the game turns and mirrors it to
    # follow each blade's own swing.
    'jslash': ('jellyfish-fx', 'vfx6/50/frames_50h', {'files': True, 'size': 260, 'fps': 50, 'swing': [90, -1, 353 / 1024]}),
    'jslashgold': ('jellyfish-fx', 'vfx6/50/frames_50f', {'files': True, 'size': 260, 'fps': 50, 'swing': [95, 1, 380 / 1024]}),
    'jslashred': ('jellyfish-fx', 'vfx6/50/frames_50e', {'files': True, 'size': 300, 'fps': 50, 'hue': 356, 'sat': 1.5, 'swing': [60, -1, 263 / 1024]}),
    'jspin': ('jellyfish-fx', 'vfx6/50/frames_50g', {'files': True, 'size': 260, 'fps': 40}),
    'jspinred': ('jellyfish-fx', 'vfx6/50/frames_50g', {'files': True, 'size': 260, 'fps': 40, 'hue': 356, 'sat': 1.4, 'light': 0.85}),
    'jclaw': ('jellyfish-fx', 'vfx6/50/frames_50i', {'files': True, 'size': 220, 'fps': 40, 'hue': 356, 'sat': 1.5, 'light': 0.9}),
    'jholy': ('jellyfish-fx', 'vfx2/29/frames_29', {'files': True, 'size': 200, 'fps': 20}),
    'jpillar': ('jellyfish-fx', 'vfx1/3/frames_3', {'files': True, 'size': 300, 'fps': 20, 'tint': '#ffc93a'}),
    'jpillarsteel': ('jellyfish-fx', 'vfx1/3/frames_3', {'files': True, 'size': 300, 'fps': 20, 'tint': '#4aa8ff'}),
    'jpillarred': ('jellyfish-fx', 'vfx1/3/frames_3', {'files': True, 'size': 300, 'fps': 20, 'tint': '#ff3048'}),
    'jcircle': ('jellyfish-fx', 'vfx5/40/frames_40a', {'files': True, 'size': 260, 'fps': 12, 'loop': True}),
    'jorb': ('jellyfish-fx', 'vfx7/62fr/frames_62fr', {'files': True, 'size': 200, 'fps': 24, 'hue': 44, 'sat': 1.3, 'light': 1.15, 'loop': True}),
    # Hits: Raja_Kutai's anime star burst (CC0) for crits, Inguz Media's rendered impacts (CC BY).
    'jcrit': ('rajakutai-hitspark', '256_0.png', {'start': 26, 'grid': [8, 8], 'size': 200, 'fps': 60}),
    'jhit': ('inguz-impacts', 'impact07_0.png', {'grid': [8, 8], 'step': 2, 'size': 220, 'fps': 40}),
    'jhitcyan': ('inguz-impacts', 'impact04_0.png', {'grid': [8, 8], 'step': 2, 'size': 220, 'fps': 40}),
    # Kutejnikov's looping ring of fire (CC0), the Berserker's rage at his feet.
    'jfirering': ('kutejnikov-auras', '001/001_fire', {'files': True, 'step': 2, 'size': 220, 'fps': 30, 'loop': True}),
    # Thrusts: Cethiel's glowing thrusts (6 frames each) in steel blue and red.
    'hdthrust': ('cethiel', 'Alternative 2/4', {'files': True, 'size': 150, 'add': True}),
    'hdthrustred': ('cethiel', 'Alternative 3/4', {'files': True, 'size': 150, 'hue': 356, 'sat': 1.2}),
    # Sinestesia's blood bursts.
    'hdbloodstar': ('sinestesia', 'blood-hit-1.png', {'grid': [4, 4], 'size': 190, 'fps': 36}),
    'hdblood': ('sinestesia', 'blood-hit-2.png', {'grid': [4, 4], 'size': 190, 'fps': 30}),
    'hdholyhit': ('sinestesia', 'hit-1-yellow.png', {'grid': [4, 4], 'size': 180, 'fps': 40, 'light': 1.15}),
    # Fire, smoke and blasts: rendered flipbooks.
    'hdexplode': ('sinestesia', 'explosions2/1.png', {'step': 2, 'grid': [8, 8], 'size': 220, 'fps': 50}),
    'hddust': ('brackeys', 'flipbooks/explosion_smoke_01_8x8.tga', {'lift': [236, 226, 246], 'grid': [5, 5], 'size': 170, 'fps': 40}),
    'hdflame': ('brackeys', 'flipbooks/flame_01_16x4.tga', {'grid': [16, 4], 'size': 110, 'fps': 40, 'loop': True}),
    'hdfire': ('brackeys', 'flipbooks/fire_01_8x8.tga', {'step': 2, 'grid': [8, 8], 'size': 150, 'fps': 40, 'lum': True}),
    # Textures the game animates (Kenney's particles via the Brackeys bundle).
    'hdflare': ('brackeys', 'particles/alpha/spotlight_05_a.png', {'size': 160, 'tint': '#fff3c0', 'add': True}),
    'hdflaregold': ('brackeys', 'particles/alpha/spotlight_05_a.png', {'size': 160, 'tint': GOLD}),
    'hdflarered': ('brackeys', 'particles/alpha/spotlight_05_a.png', {'size': 160, 'tint': RED}),
    'hdflaresteel': ('brackeys', 'particles/alpha/spotlight_05_a.png', {'size': 160, 'tint': STEEL, 'add': True}),
    'hdrays': ('brackeys', 'particles/alpha/effect_02_a.png', {'size': 220, 'tint': '#ffffff', 'add': True}),
    'hdraysgold': ('brackeys', 'particles/alpha/effect_02_a.png', {'size': 220, 'tint': GOLD}),
    'hdraysred': ('brackeys', 'particles/alpha/effect_02_a.png', {'size': 220, 'tint': RED}),
    'hdrayssteel': ('brackeys', 'particles/alpha/effect_03_a.png', {'size': 220, 'tint': STEEL, 'add': True}),
    'hdring': ('brackeys', 'particles/alpha/circle_02_a.png', {'size': 200, 'tint': STEEL, 'white': 0.35, 'add': True}),
    'hdringgold': ('brackeys', 'particles/alpha/circle_02_a.png', {'size': 200, 'tint': GOLD, 'white': 0.35}),
    'hdringred': ('brackeys', 'particles/alpha/circle_02_a.png', {'size': 200, 'tint': RED, 'white': 0.35}),
    'hdringarcane': ('brackeys', 'particles/alpha/circle_02_a.png', {'size': 200, 'tint': '#b05cff', 'white': 0.35, 'add': True}),
    'hdringice': ('brackeys', 'particles/alpha/circle_02_a.png', {'size': 200, 'tint': '#3fd2ff', 'white': 0.35, 'add': True}),
    'hdringfire': ('brackeys', 'particles/alpha/circle_02_a.png', {'size': 200, 'tint': EMBER, 'white': 0.35}),
    'hdringpoison': ('brackeys', 'particles/alpha/circle_02_a.png', {'size': 200, 'tint': '#5fe03a', 'white': 0.35}),
    'hdringwind': ('brackeys', 'particles/alpha/circle_02_a.png', {'size': 200, 'tint': '#22d68a', 'white': 0.35, 'add': True}),
    'hdringshadow': ('brackeys', 'particles/alpha/circle_02_a.png', {'size': 200, 'tint': '#7a3cff', 'white': 0.35, 'add': True}),
    'hdbeam': ('brackeys', 'particles/alpha/trace_07_a.png', {'size': 220, 'tint': GOLD}),
    'hdbeamsteel': ('brackeys', 'particles/alpha/trace_07_a.png', {'size': 220, 'tint': STEEL, 'add': True}),
    'hdbeamred': ('brackeys', 'particles/alpha/trace_07_a.png', {'size': 220, 'tint': RED}),
    'hdstreak': ('brackeys', 'particles/alpha/trace_01_a.png', {'size': 200, 'tint': STEEL, 'add': True}),
    'hdtwirl': ('brackeys', 'particles/alpha/twirl_02_a.png', {'size': 200, 'tint': STEEL, 'add': True}),
    'hdtwirlred': ('brackeys', 'particles/alpha/twirl_02_a.png', {'size': 200, 'tint': RED}),
    'hdvortex': ('brackeys', 'particles/alpha/twirl_04_a.png', {'size': 220, 'tint': BLOOD}),
    'hdmoon': ('brackeys', 'particles/alpha/circle_05_a.png', {'size': 200, 'tint': BLOOD}),
    'hddirt': ('brackeys', 'particles/alpha/dirt_02_a.png', {'size': 160, 'tint': '#8a6a52'}),
}

# Glowing shapes from game-icons.net: name: (icon, options). `colour` and `deep` colour the body
# and rim, `core` is how white-hot the heart of thick parts gets (slashes and bursts burn white); `size` is the shape's longest side in strip pixels; `dissolve` adds
# that many frames after the first in which the shape breaks up into rising sparkles; `rot` turns the source
# (degrees) and `flip` mirrors it before anything else.
STEELC, STEELD = '#4aa8ff', '#0b3f8a'
GOLDC, GOLDD = '#ffc93a', '#9a4f00'
REDC, REDD = '#ff3048', '#6a0016'
EMBLEMS = {
    # Hit marks: crossed slashes struck across a monster, a burst.
    'gx': ('crossed-slashes', {'core': 0.9, 'colour': STEELC, 'deep': STEELD, 'size': 120, 'dissolve': 4}),
    'gxgold': ('crossed-slashes', {'core': 0.9, 'colour': GOLDC, 'deep': GOLDD, 'size': 120, 'dissolve': 4}),
    'gxred': ('crossed-slashes', {'core': 0.9, 'colour': REDC, 'deep': REDD, 'size': 120, 'dissolve': 4}),
    'gburst': ('spiky-explosion', {'core': 0.9, 'colour': '#ffe14a', 'deep': '#b05a00', 'size': 120, 'dissolve': 3}),
    'gburstred': ('spiky-explosion', {'core': 0.9, 'colour': REDC, 'deep': REDD, 'size': 120, 'dissolve': 3}),
    'gburststeel': ('spiky-explosion', {'core': 0.9, 'colour': STEELC, 'deep': STEELD, 'size': 120, 'dissolve': 3}),
    'gwhirl': ('whirlwind', {'colour': STEELC, 'deep': STEELD, 'size': 170, 'dissolve': 4}),
    # The Warrior: a roaring spectral lion (Rally Cry), a steel shield, crossed swords.
    'glion': ('lion', {'colour': '#2fd8ff', 'deep': '#0a5c9e', 'size': 190, 'dissolve': 5}),
    'gshield': ('magic-shield', {'colour': STEELC, 'deep': STEELD, 'size': 130, 'dissolve': 5}),
    'gswords': ('crossed-swords', {'colour': STEELC, 'deep': STEELD, 'size': 130, 'dissolve': 5}),
    # The Paladin: the holy symbol, a shield of light, a winged sword of judgement, the sun.
    'gholy': ('holy-symbol', {'colour': GOLDC, 'deep': GOLDD, 'size': 130, 'dissolve': 5}),
    'gaegis': ('energy-shield', {'colour': GOLDC, 'deep': GOLDD, 'size': 150, 'dissolve': 5}),
    'gverdict': ('winged-sword', {'colour': GOLDC, 'deep': GOLDD, 'size': 240, 'dissolve': 5}),
    'gsun': ('heraldic-sun', {'colour': GOLDC, 'deep': GOLDD, 'size': 170, 'dissolve': 5}),
    'gwings': ('angel-wings', {'colour': '#ffe27a', 'deep': '#b07000', 'size': 170, 'dissolve': 5}),
    # The Berserker: a horned skull, demon wings, a dragon.
    'gskull': ('horned-skull', {'colour': REDC, 'deep': REDD, 'size': 150, 'dissolve': 5}),
    'gdemonwings': ('evil-wings', {'colour': REDC, 'deep': REDD, 'size': 200, 'dissolve': 5}),
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
        import re
        names = sorted((f for f in os.listdir(full) if f.endswith('.png')), key=lambda f: [int(x) if x.isdigit() else x for x in re.split(r'(\d+)', f)])
        frames = [Image.open(os.path.join(full, f)).convert('RGBA') for f in names]
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


def emblem_frames(base, jobs):
    # Renders every emblem's SVG in one browser run, then makes its glowing frames.
    import subprocess
    import tempfile
    import numpy as np
    from PIL import ImageFilter
    root = os.path.join(base, 'gameicons', 'icons', 'ffffff', 'transparent', '1x1')
    paths = {}
    for author in os.listdir(root):
        for f in os.listdir(os.path.join(root, author)):
            paths.setdefault(f[:-4], os.path.join(root, author, f))
    tmp = tempfile.mkdtemp()
    args = []
    for name, (icon, o) in jobs.items():
        args += [paths[icon], os.path.join(tmp, name + '.png')]
    subprocess.run(['node', os.path.join(ROOT, 'tools', 'svg-to-png.cjs'), '512'] + args, check=True)
    out = {}
    for name, (icon, o) in jobs.items():
        src = Image.open(os.path.join(tmp, name + '.png')).convert('RGBA').split()[3]
        if o.get('flip'):
            src = src.transpose(Image.FLIP_LEFT_RIGHT)
        if o.get('rot'):
            src = src.rotate(o['rot'], resample=Image.BICUBIC)
        box = src.getbbox()
        src = src.crop(box)
        k = o['size'] / max(src.size)
        src = src.resize((max(1, round(src.width * k)), max(1, round(src.height * k))), Image.LANCZOS)
        out[name] = glow_frames(src, o, sum(map(ord, name)))
    return out


def hexrgb(c):
    return [int(c[i:i + 2], 16) for i in (1, 3, 5)]


def glow_frames(shape, o, seed):
    # A shape made light: white-hot where it's thick, the colour toward its edges, a deep rim, a
    # soft glow of the colour round it. Later frames break it up into sparkles that drift up.
    import numpy as np
    from PIL import ImageFilter
    size = max(shape.size)
    pad = max(8, size // 6)
    W, H = shape.width + pad * 2, shape.height + pad * 2
    mask = Image.new('L', (W, H))
    mask.paste(shape, (pad, pad))
    a = np.asarray(mask, dtype=np.float32) / 255
    inner = np.asarray(mask.filter(ImageFilter.GaussianBlur(max(1.5, size / 45))), dtype=np.float32) / 255
    halo = np.asarray(mask.filter(ImageFilter.GaussianBlur(max(3, size / 14))), dtype=np.float32) / 255
    edge = np.clip((a - np.asarray(mask.filter(ImageFilter.MinFilter(3)), dtype=np.float32) / 255) * 1.5, 0, 1)
    c, d, w = (np.array(hexrgb(x), dtype=np.float32) for x in (o['colour'], o['deep'], '#ffffff'))
    # The body is the colour lit from within: lighter toward the middle of each stroke, white only
    # at the very heart of thick parts, a touch brighter at the top (light from above).
    light = c * 0.8 + w * 0.2
    depth = np.clip((inner - 0.35) / 0.65, 0, 1)[..., None]
    top = np.linspace(1.08, 0.92, H, dtype=np.float32)[:, None, None]
    body = np.clip((c * (1 - depth) + light * depth) * top, 0, 255)
    k = (np.clip((inner - 0.9) / 0.1, 0, 1) * o.get('core', 0.4))[..., None]
    body = body * (1 - k) + w * k
    # A bright line just inside the rim, so each shape reads polished, like lit glass.
    band = np.asarray(mask.filter(ImageFilter.MinFilter(3)), dtype=np.float32) / 255 - np.asarray(mask.filter(ImageFilter.MinFilter(7)), dtype=np.float32) / 255
    band = (np.clip(band, 0, 1) * 0.55)[..., None]
    body = body * (1 - band) + w * band
    body = body * (1 - edge[..., None] * 0.65) + d * edge[..., None] * 0.65
    glow_a = np.clip(halo * 1.7, 0, 1) * 0.8
    rgb = body * a[..., None] + c * (1 - a[..., None])
    frames = []
    n = o.get('dissolve', 0)
    rng = np.random.default_rng(seed)
    noise = Image.fromarray((rng.random((H, W)) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(max(2, size / 30)))
    nz = np.asarray(noise, dtype=np.float32)
    nz = (nz - nz.min()) / max(1, nz.max() - nz.min())
    ys, xs = np.nonzero(a > 0.5)
    pick = rng.choice(len(xs), size=min(len(xs), 26), replace=False) if len(xs) else []
    sparks = [(xs[i], ys[i], nz[ys[i], xs[i]], rng.random()) for i in pick]
    for i in range(n + 1):
        t = i / (n + 1) if n else 0
        if i == 0:
            keep = np.ones_like(a)
        else:
            thr = t * 1.15 - 0.05
            keep = np.clip((nz - thr) / 0.08, 0, 1)
        alpha = np.maximum(a * keep, glow_a * (1 - t) * (0.4 + 0.6 * keep))
        img = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), 'RGBA')
        if i:
            # Sparkles where the shape has broken up, drifting up and shrinking.
            from PIL import ImageDraw
            dr = ImageDraw.Draw(img)
            for sx, sy, sn, r in sparks:
                if sn > t * 1.15 - 0.05 + 0.02:
                    continue
                life = min(1, (t * 1.15 - 0.05 - sn) * 3)
                if life >= 1:
                    continue
                x = sx + (r - 0.5) * size * 0.1 * life
                y = sy - size * 0.18 * life
                rad = max(1, size / 40 * (1 - life))
                col = tuple(int(v) for v in (w * (1 - life) + c * life)) + (255,)
                dr.polygon([(x, y - rad * 2.6), (x + rad * 0.6, y), (x, y + rad * 2.6), (x - rad * 0.6, y)], fill=col)
                dr.polygon([(x - rad * 2.6, y), (x, y + rad * 0.6), (x + rad * 2.6, y), (x, y - rad * 0.6)], fill=col)
        frames.append(img)
    return frames


def tint(img, colour, white=1.0):
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
            k = k * k * white
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
    entries += [(n, 'emblem', i, o, True) for n, (i, o) in EMBLEMS.items()]
    emblems = emblem_frames(base, EMBLEMS)
    for name, pack, effect, o, hd in entries:
        if pack == 'emblem':
            frames = emblems[name]
            pivot, fps = [frames[0].width / 2, frames[0].height / 2], o.get('fps', 24)
        elif hd:
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
            frames = [tint(f, o['tint'], o.get('white', 1.0)) for f in frames]
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
        sheets[name] = {'w': w, 'h': h, 'n': len(frames), 'fps': o.get('fps', fps), 'px': round(px), 'py': round(py), 'loop': bool(o.get('loop')), 'hd': hd, 'add': bool(o.get('add')),
                       'swing': [round(math.radians(o['swing'][0]), 3), o['swing'][1], round(o['swing'][2] * o['size'], 1)] if 'swing' in o else None}
        print(f'{name:10s} {len(frames):3d} frames {w}x{h}')
    lines = ['// Generated by tools/build-fx.py: the effect sprite strips in assets/fx/ (effect art from',
             '// effect packs; see assets/fx/CREDITS.md). Each strip is `n` frames of w x h laid side by',
             '// side, played at `fps`; (px, py) is the point in a frame that sits on the effect\'s position',
             '// (the pack\'s pivot). `hd` strips are smooth HD art, drawn smoothed; `add` ones are light,',
             '// drawn additively.', '', 'export const FX_SHEETS = {']
    for name, s in sheets.items():
        extra = (', hd: true' if s['hd'] else '') + (', add: true' if s['add'] else '')
        if s.get('swing'):
            extra += f", r: {s['swing'][2]}, mid: {s['swing'][0]}, turn: {s['swing'][1]}"
        lines.append(f"  {name}: {{ w: {s['w']}, h: {s['h']}, n: {s['n']}, fps: {s['fps']}, px: {s['px']}, py: {s['py']}, loop: {str(s['loop']).lower()}{extra} }},")
    lines.append('};')
    open(os.path.join(ROOT, 'src', 'render', 'fx-sheets.js'), 'w').write('\n'.join(lines) + '\n')


if __name__ == '__main__':
    build(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'packs'))
