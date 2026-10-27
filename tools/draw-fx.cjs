// Renders Tengu's own effect art (tools/fx-art.js) in the browser, in HD with a soft glow: every
// effect's frames as PNGs in OUT/<name>/<i>.png, and OUT/meta.json with each effect's pivot, rate,
// density and swing (big versions are listed as their effect played larger).
// Usage: node tools/draw-fx.cjs OUT   (build-fx.py runs it; needs Playwright)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Strip pixels per game pixel: sharp up to a 3x screen, smoothed above it.
const D = 3;

(async () => {
  const out = process.argv[2];
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setContent('<html><body></body></html>');
  await p.addScriptTag({ path: path.join(__dirname, 'fx-art.js') });
  const effects = await p.evaluate((D) => {
    const res = {};
    const names = new Map(Object.entries(window.FXART).map(([n, e]) => [e, n]));
    for (const [name, e] of Object.entries(window.FXART)) {
      // A big version is its effect played larger: the game scales the base strip.
      if (e.base) {
        res[name] = { alias: { of: names.get(e.base), k: e.bigK } };
        continue;
      }
      // Every frame is drawn smooth in HD with its soft glow.
      const frames = [];
      let first = null;
      for (let i = 0; i < e.n; i++) {
        const r = window.FXHD.render(e, i, D);
        first ??= r;
        frames.push(r.canvas.toDataURL('image/png'));
      }
      res[name] = { frames, meta: { w: first.canvas.width, h: first.canvas.height, n: e.n, fps: e.fps, px: first.px, py: first.py, loop: Boolean(e.loop), d: D, swing: e.swing ? [e.swing[0], e.swing[1], first.r] : null } };
    }
    return res;
  }, D);
  const meta = {};
  for (const [name, { frames, meta: m, alias }] of Object.entries(effects)) {
    if (alias) {
      meta[name] = { alias };
      continue;
    }
    fs.mkdirSync(path.join(out, name), { recursive: true });
    frames.forEach((d, i) => fs.writeFileSync(path.join(out, name, `${i}.png`), Buffer.from(d.split(',')[1], 'base64')));
    meta[name] = m;
  }
  fs.writeFileSync(path.join(out, 'meta.json'), JSON.stringify(meta, null, 1));
  await b.close();
})();
