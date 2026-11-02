#!/usr/bin/env python3
"""Makes a demo GIF without Playwright or ffmpeg: a headless Edge (or Chrome) plays a page that
prints its frames into <pre id="out"> (--dump-dom), and Pillow strings them into a GIF. The game
must be served at localhost:8000. Pages: move-frames (moves on the hero alone,
tools/move-frames.html) and moves-stage (skills in the game with a  plan,
tools/moves-stage.html).

Usage: python tools/make-gif.py out.gif [query] [page]
  e.g. python tools/make-gif.py moves.gif "job=thief" move-frames
       python tools/make-gif.py skills.gif "job=thief&weapon=dagger_45&record=place:330;KeyZ:3" moves-stage
"""

import base64
import html
import io
import json
import re
import subprocess
import sys

import os
import shutil

from PIL import Image


def find_browser():
    for name in ('msedge', 'chrome', 'google-chrome'):
        path = shutil.which(name)
        if path:
            return path
    for path in (r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe', r'C:\Program Files\Microsoft\Edge\Application\msedge.exe'):
        if os.path.exists(path):
            return path
    raise SystemExit('no headless browser found')


def main(out, query='job=thief', page='move-frames'):
    url = f'http://localhost:8000/tools/{page}.html?{query}'
    dom = subprocess.run([find_browser(), '--headless=new', '--disable-gpu', '--virtual-time-budget=600000', '--dump-dom', url], capture_output=True, text=True, encoding='utf-8', check=True).stdout
    # (The last one: a page's own notes may mention the box too.)
    found = re.findall(r"<pre id=\"out\">(\[.*?)</pre>", dom, re.S)
    frames = [Image.open(io.BytesIO(base64.b64decode(d.split(',')[1]))).convert('RGB') for d in json.loads(html.unescape(found[-1]))]
    pal = [f.quantize(colors=255, method=Image.Quantize.MEDIANCUT) for f in frames]
    pal[0].save(out, save_all=True, append_images=pal[1:], duration=50, loop=0, optimize=True)
    print(f'wrote {out}: {len(frames)} frames')


if __name__ == '__main__':
    main(*sys.argv[1:])
