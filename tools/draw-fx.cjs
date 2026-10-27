// Renders Tengu's own effect art (tools/fx-art.js) in the browser, matched to the sprites' pixel
// look: every effect's frames as PNGs
// in OUT/<name>/<i>.png, and OUT/meta.json with each effect's pivot, rate and swing.
// Usage: node tools/draw-fx.cjs OUT   (build-fx.py runs it; needs Playwright)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const out = process.argv[2];
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setContent('<html><body></body></html>');
  await p.addScriptTag({ path: path.join(__dirname, 'fx-art.js') });
  const effects = await p.evaluate(() => {
    const res = {};
    for (const [name, e] of Object.entries(window.FXART)) {
      // Every frame is drawn smooth, then matched to the sprites' pixel look.
      const frames = [];
      for (let i = 0; i < e.n; i++) {
        const c = document.createElement('canvas');
        c.width = e.w;
        c.height = e.h;
        e.draw(c.getContext('2d'), i);
        frames.push(window.FXMATCH.match(c).toDataURL('image/png'));
      }
      const m = window.FXMATCH.matched(e);
      res[name] = { frames, meta: { w: m.w, h: m.h, n: e.n, fps: e.fps, px: m.px, py: m.py, loop: Boolean(e.loop), swing: e.swing ? [e.swing[0], e.swing[1], m.r] : null } };
    }
    return res;
  });
  const meta = {};
  for (const [name, { frames, meta: m }] of Object.entries(effects)) {
    fs.mkdirSync(path.join(out, name), { recursive: true });
    frames.forEach((d, i) => fs.writeFileSync(path.join(out, name, `${i}.png`), Buffer.from(d.split(',')[1], 'base64')));
    meta[name] = m;
  }
  fs.writeFileSync(path.join(out, 'meta.json'), JSON.stringify(meta, null, 1));
  await b.close();
})();
