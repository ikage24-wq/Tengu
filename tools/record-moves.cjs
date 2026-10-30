// Records a demo of the light-footed jobs' moves: the basic combo held down (flowing on, the
// back flips mid-string), the Thief's flash jump and shadow dash, the Archer's air leap.
// Needs the game served at localhost:8000, playwright and ffmpeg.
// Usage: node tools/record-moves.cjs <out.mp4> [jobs,comma,separated]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const [outFile, jobsArg] = process.argv.slice(2);
const JOBS = (jobsArg ?? 'thief,shinobi,kitsune,archer,beastmaster,stormcaller').split(',');
const FPS = 30;
const THIEVES = new Set(['thief', 'shinobi', 'kitsune']);
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
  // Holds keys for `secs`, pressing `press` on the first frame.
  const play = async (secs, held = [], press = []) => {
    for (let i = 0; i < Math.round(secs * FPS); i++) {
      await page.evaluate(([h, p]) => window.step(1 / 30, h, p), [held, i === 0 ? press : []]);
      await shot();
    }
  };
  const say = (s) => page.evaluate((s) => window.caption(s), s);
  const place = (x) => page.evaluate((x) => window.place(x), x);
  for (const job of JOBS) {
    await page.goto(`http://localhost:8000/tools/moves-stage.html?job=${job}`);
    await page.waitForFunction(() => window.ready);
    await page.waitForTimeout(1500);
    // (The map's arrival fade plays out before recording.)
    await page.evaluate(() => { for (let i = 0; i < 45; i++) window.step(1 / 30); });
    const ranged = !['thief', 'shinobi'].includes(job);
    await place(ranged ? 250 : 380);
    await say('Holding attack: the combo flows on, flips mid-string');
    await play(0.4);
    await play(6.5, ['KeyZ']);
    await play(0.6);
    if (THIEVES.has(job)) {
      await place(150);
      await say('Flash jump: jump, then jump again in the air');
      await play(0.5);
      for (let k = 0; k < 2; k++) {
        await play(0.25, ['Space'], ['Space']);
        await play(0.15);
        await play(0.1, ['Space'], ['Space']);
        await play(0.9);
        await page.evaluate(() => window.place(150));
      }
      await place(300);
      await say('Shadow dash: double-tap a direction');
      await play(0.5);
      for (const [key, x] of [['ArrowRight', 300], ['ArrowLeft', 640], ['ArrowRight', 300]]) {
        await place(x);
        await play(0.08, [key], [key]);
        await play(0.08);
        await play(0.08, [key], [key]);
        await play(0.9);
      }
    } else {
      await place(330);
      await say('Air leap: jump, then jump again to flip back and shoot');
      await play(0.5);
      for (let k = 0; k < 2; k++) {
        await place(330);
        await play(0.2, ['Space'], ['Space']);
        await play(0.12);
        await play(0.1, ['Space'], ['Space']);
        await play(1.2);
      }
    }
  }
  await browser.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(tmp, 'f%06d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', outFile]);
  fs.rmSync(tmp, { recursive: true });
  console.log('wrote', outFile);
})();
