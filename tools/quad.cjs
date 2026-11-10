// Four players at once, at full speed, for testing co-op (2026-11-10). Opens four game windows
// (localhost, ?net=local so they share rooms through the browser) that are never slowed the way
// background tabs are, runs one scenario file against them, and closes:
//
//   npx electron tools/quad.cjs path/to/scenario.cjs [out-folder] [game=http://localhost:8000]
//   (QUAD_WATCH=1 in front: the four windows open on your screen, 2 x 2, to watch them play)
//
// The scenario exports `async (q) => result`, with q = {
//   run(i, js)            run JavaScript in window i (0-3), awaited; returns its result
//   key(i, code, ms)      a real key press in window i (held ms, default a tap)
//   click(i, x, y)        a real click at game pixels (640 x 360)
//   shot(i, name)         a picture of window i, saved as <out>/<name>.png
//   all(fn)               fn(i) for all four windows at once
//   sleep(ms), log(...)   wait; note a line for the report
// }
// The result and the log are written to <out>/result.json. The windows keep their own saves (this
// app's storage), apart from your browser's.
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(process.argv.findIndex((a) => a.endsWith('quad.cjs')) + 1);
const scenario = path.resolve(args[0]);
const OUT = path.resolve(args[1] ?? path.join(path.dirname(scenario), 'quad-out'));
const GAME = args[2] ?? 'http://localhost:8000';
// (QUAD_WATCH=1: the four windows open on your screen in a 2 x 2 grid, so you can see all four heroes
// play. Still never slowed down.)
const WATCH = args[3] === 'watch' || process.env.QUAD_WATCH === '1';
const W = 800;
const H = 450;

app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

app.whenReady().then(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const wins = [];
  for (let i = 0; i < 4; i++) {
    const NAMES = ['Marin', 'Coral', 'Bastion', 'Blitz'];
    // (On a second screen if you have one, or QUAD_SCREEN=n for the nth: your main one stays free.)
    const { screen } = require('electron');
    const shown = screen.getAllDisplays();
    const main = screen.getPrimaryDisplay();
    const pick = process.env.QUAD_SCREEN != null ? shown[Number(process.env.QUAD_SCREEN)] : shown.find((d) => d.id !== main.id);
    const area = (pick ?? main).workArea;
    const cw = Math.floor(area.width / 2);
    const ch = Math.floor(area.height / 2);
    const w = WATCH
      ? new BrowserWindow({ show: true, x: area.x + (i % 2) * cw, y: area.y + Math.floor(i / 2) * ch, width: cw, height: ch, title: `Tengu co-op: ${NAMES[i]}`, webPreferences: { backgroundThrottling: false } })
      : new BrowserWindow({ show: false, width: W, height: H, useContentSize: true, webPreferences: { offscreen: true, backgroundThrottling: false } });
    if (!WATCH) w.webContents.setFrameRate(60);
    // (Always today's code, never a cached copy.)
    if (i === 0) await w.webContents.session.clearCache();
    await w.loadURL(`${GAME}/?net=local`);
    wins.push(w);
  }
  const lines = [];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const q = {
    run: (i, js) => wins[i].webContents.executeJavaScript(`(async () => { ${js} })()`),
    async key(i, code, ms = 60) {
      const wc = wins[i].webContents;
      const keyCode = code.replace(/^Key|^Digit/, '').replace(/^Arrow/, '');
      wc.sendInputEvent({ type: 'keyDown', keyCode });
      await sleep(ms);
      wc.sendInputEvent({ type: 'keyUp', keyCode });
    },
    click(i, gx, gy) {
      const wc = wins[i].webContents;
      const [cw, ch] = wins[i].getContentSize();
      // (The game is letterboxed to 16:9 in the window: find where its picture sits.)
      const s = Math.min(cw / 640, ch / 360);
      const x = Math.round((cw - 640 * s) / 2 + gx * s);
      const y = Math.round((ch - 360 * s) / 2 + gy * s);
      wc.sendInputEvent({ type: 'mouseMove', x, y });
      wc.sendInputEvent({ type: 'mouseDown', x, y, button: 'left', clickCount: 1 });
      wc.sendInputEvent({ type: 'mouseUp', x, y, button: 'left', clickCount: 1 });
    },
    async shot(i, name) {
      const img = await wins[i].webContents.capturePage();
      fs.writeFileSync(path.join(OUT, `${name}.png`), img.toPNG());
    },
    all: (fn) => Promise.all([0, 1, 2, 3].map(fn)),
    sleep,
    log: (...a) => lines.push(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ')),
  };
  let result = null;
  try {
    result = await require(scenario)(q);
  } catch (err) {
    result = { error: String(err?.stack ?? err) };
  }
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify({ result, log: lines }, null, 1));
  console.log(`quad: done, ${lines.length} log lines -> ${OUT}`);
  app.exit(0);
});
