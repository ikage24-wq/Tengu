// The same as tools/draw-fx.cjs, on the Electron the project already has (for a machine without
// Playwright): renders Tengu's effect art (tools/fx-art.js) in HD with its soft glow, every frame
// as OUT/<name>/<i>.png and OUT/meta.json. Only the effects whose names start with ONLY (a comma
// list of prefixes) when given, so new art can be built without redrawing every other strip.
// Usage: npx electron tools/draw-fx-electron.cjs OUT [ONLY]
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const D = 3;
const [out, only] = process.argv.slice(-2).length === 2 && !process.argv.at(-1).includes(path.sep) && !process.argv.at(-1).includes('/') ? process.argv.slice(-2) : [process.argv.at(-1), ''];

// (A drawing that throws must stop the build with its error, never leave it waiting.)
process.on('unhandledRejection', (e) => {
  console.error('drawing failed:', e?.message ?? e);
  app.exit(1);
});
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 64, height: 64, webPreferences: { offscreen: true } });
  await win.loadURL('data:text/html,<html><body></body></html>');
  await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, 'fx-art.js'), 'utf8') + '\n;true');
  // (One effect at a time: handing every drawing back in one message stalled the page once there
  // were a few hundred of them.)
  const names = await win.webContents.executeJavaScript(`(() => {
    const only = ${JSON.stringify(only)}.split(',').filter(Boolean);
    return Object.keys(window.FXART).filter((n) => !only.length || only.some((o) => n.startsWith(o)));
  })()`);
  const effects = {};
  for (const name of names) {
    effects[name] = await win.webContents.executeJavaScript(`(() => {
      const D = ${D};
      const e = window.FXART[${JSON.stringify(name)}];
      const names = new Map(Object.entries(window.FXART).map(([n, x]) => [x, n]));
      if (e.base) return { alias: { of: names.get(e.base), k: e.bigK } };
      const frames = [];
      let first = null;
      for (let i = 0; i < e.n; i++) {
        const r = window.FXHD.render(e, i, D);
        first ??= r;
        frames.push(r.canvas.toDataURL('image/png'));
      }
      return { frames, meta: { w: first.canvas.width, h: first.canvas.height, n: e.n, fps: e.fps, px: first.px, py: first.py, loop: Boolean(e.loop), d: D, swing: e.swing ? [e.swing[0], e.swing[1], first.r] : null } };
    })()`);
    console.log('drew', name, effects[name].frames?.length ?? 'alias');
  }
  const meta = {};
  for (const [name, { frames, meta: m, alias }] of Object.entries(effects)) {
    if (alias) { meta[name] = { alias }; continue; }
    fs.mkdirSync(path.join(out, name), { recursive: true });
    frames.forEach((d, i) => fs.writeFileSync(path.join(out, name, `${i}.png`), Buffer.from(d.split(',')[1], 'base64')));
    meta[name] = m;
  }
  fs.writeFileSync(path.join(out, 'meta.json'), JSON.stringify(meta, null, 1));
  console.log('drew', Object.keys(meta).length, 'effects');
  app.quit();
});
