#!/usr/bin/env python3
"""Builds some effect strips without Playwright: a headless Edge (or Chrome) renders the named
effects of tools/fx-art.js through tools/draw-fx-page.html and prints them (--dump-dom); each is
trimmed and laid out as one strip in assets/fx/ exactly as tools/build-fx.py does, and its line in
src/render/fx-sheets.js is added or replaced. The game must be served at localhost:8000.

Usage: python tools/build-fx-edge.py twsweep,twhit   (needs Pillow and msedge on the PATH)
"""

import base64
import io
import json
import os
import re
import shutil
import subprocess
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def browser():
    for name in ('msedge', 'chrome', 'google-chrome'):
        path = shutil.which(name)
        if path:
            return path
    for path in (r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe', r'C:\Program Files\Microsoft\Edge\Application\msedge.exe'):
        if os.path.exists(path):
            return path
    raise SystemExit('no headless browser found')


def render(names):
    url = f'http://localhost:{os.environ.get("PORT", "8000")}/tools/draw-fx-page.html?names={",".join(names)}'
    out = subprocess.run([browser(), '--headless=new', '--disable-gpu', '--virtual-time-budget=60000', '--dump-dom', url], capture_output=True, text=True, encoding='utf-8', check=True).stdout
    m = re.search(r'<pre id="out">(.*?)</pre>', out, re.S)
    return json.loads(m.group(1).replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"'))


def build(names):
    out_dir = os.path.join(ROOT, 'assets', 'fx')
    lines = {}
    for effect, data in render(names).items():
        m = data['meta']
        frames = [Image.open(io.BytesIO(base64.b64decode(f.split(',')[1]))).convert('RGBA') for f in data['frames']]
        frames = [f for f in frames if f.getbbox()]
        boxes = [f.getbbox() for f in frames]
        x0 = min(b[0] for b in boxes)
        y0 = min(b[1] for b in boxes)
        x1 = max(b[2] for b in boxes)
        y1 = max(b[3] for b in boxes)
        w, h = x1 - x0, y1 - y0
        strip = Image.new('RGBA', (w * len(frames), h), (0, 0, 0, 0))
        for i, f in enumerate(frames):
            strip.paste(f.crop((x0, y0, x1, y1)), (i * w, 0))
        name = 'cel' + effect
        strip.save(os.path.join(out_dir, f'{name}.png'), optimize=True)
        extra = ''
        if m['swing']:
            extra = f", r: {m['swing'][2]}, mid: {round(m['swing'][0], 3)}, turn: {m['swing'][1]}"
        lines[name] = f"  {name}: {{ w: {w}, h: {h}, n: {len(frames)}, fps: {m['fps']}, px: {round(m['px'] - x0)}, py: {round(m['py'] - y0)}, d: {m['d']}, loop: {str(m['loop']).lower()}{extra} }},"
        print(f'{name:10s} {len(frames):3d} frames {w}x{h}')
    path = os.path.join(ROOT, 'src', 'render', 'fx-sheets.js')
    text = open(path, encoding='utf-8').read()
    for name, line in lines.items():
        pat = re.compile(rf'^  {name}: \{{.*\}},$', re.M)
        text = pat.sub(line, text) if pat.search(text) else text.replace('\n};', f'\n{line}\n}};', 1)
    open(path, 'w', encoding='utf-8', newline='\n').write(text)


if __name__ == '__main__':
    build(sys.argv[1].split(','))
