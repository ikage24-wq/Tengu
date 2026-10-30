// Records the endless barrages (Endless Fox-Fire, Endless Blade Dance, Wild Hunt): attack held
// for a while as it builds through its stages, then let go for the finisher.
// Needs the game served at localhost:8000, playwright and ffmpeg.
// Usage: node tools/record-barrage.cjs <out.mp4> [job:passive,...] [seconds held]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const [outFile, list, secsArg] = process.argv.slice(2);
const RUNS = (list ?? 'shinobi:inkdance,beastmaster:wildhunt').split(',').map((s) => s.split(':'));
const SECS = Number(secsArg ?? 7.5);
const FPS = 30;
const NAMES = { inkdance: 'Endless Blade Dance', wildhunt: 'Wild Hunt', foxbarrage: 'Endless Fox-Fire' };
const tmp = fs.mkdtempSync(path.join(path.dirname(path.resolve(outFile)), 'frames-'));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.log('ERR', e.message));
  let n = 0;
  const shot = async () => {
    const data = await page.evaluate(() => window.frame());
    fs.writeFileSync(path.join(tmp, `f${String(n++).padStart(6, '0')}.jpg`), Buffer.from(data.split(',')[1], 'base64'));
  };
  const play = async (secs, held = [], press = []) => {
    for (let i = 0; i < Math.round(secs * FPS); i++) {
      await page.evaluate(([h, p]) => window.step(1 / 30, h, p), [held, i === 0 ? press : []]);
      await shot();
    }
  };
  for (const [job, passive] of RUNS) {
    await page.goto(`http://localhost:8000/tools/moves-stage.html?job=${job}&learn=${passive}`);
    await page.waitForFunction(() => window.ready);
    await page.waitForTimeout(1500);
    await page.evaluate(() => { for (let i = 0; i < 45; i++) window.step(1 / 30); });
    await page.evaluate((x) => window.place(x), job === 'shinobi' ? 390 : 300);
    await page.evaluate((s) => window.caption(s), `${NAMES[passive]}: hold attack`);
    await play(0.5);
    await play(SECS, ['KeyZ'], ['KeyZ']);
    await page.evaluate((s) => window.caption(s), 'Let go: the finisher');
    await play(1.8);
  }
  await browser.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(tmp, 'f%06d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', outFile]);
  fs.rmSync(tmp, { recursive: true });
  console.log('wrote', outFile);
})();
