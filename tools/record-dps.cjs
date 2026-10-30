// Records the DPS ranking video: every second job on an immortal dummy with its best
// single-target rotation (tools/balance.mjs finds it) under a live DPS meter, then the ranking.
// Needs the game served at localhost:8000, playwright and ffmpeg.
// Usage: node tools/record-dps.cjs <rotations.json> <out.mp4> [seconds per job]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const [rotFile, outFile, secsArg] = process.argv.slice(2);
const SECS = Number(secsArg ?? 20);
const FPS = 30;
const rot = JSON.parse(fs.readFileSync(rotFile, 'utf8'));
const tmp = fs.mkdtempSync(path.join(path.dirname(outFile), 'frames-'));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.log('ERR', e.message));
  let n = 0;
  const save = async () => {
    const data = await page.evaluate(() => window.frame());
    fs.writeFileSync(path.join(tmp, `f${String(n++).padStart(6, '0')}.jpg`), Buffer.from(data.split(',')[1], 'base64'));
  };
  const results = [];
  for (const [job, r] of Object.entries(rot)) {
    await page.goto(`http://localhost:8000/tools/dps-stage.html?job=${job}&main=${r.main ?? ''}&skip=${(r.skip ?? []).join(',')}`);
    await page.waitForFunction(() => window.ready);
    await page.waitForTimeout(1500);
    for (let i = 0; i < SECS * FPS; i++) {
      await page.evaluate((dt) => window.step(dt), 1 / FPS);
      await save();
    }
    const res = await page.evaluate(() => window.result());
    results.push(res);
    console.log(job, Math.round(res.dps));
  }
  // The ranking, growing in, then held.
  for (let i = 0; i < 6 * FPS; i++) {
    await page.evaluate(([list, p]) => window.rank(list, p), [results, Math.min(1, i / (2.5 * FPS))]);
    await save();
  }
  await browser.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(tmp, 'f%06d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', outFile]);
  fs.rmSync(tmp, { recursive: true });
  fs.writeFileSync(outFile.replace(/\.mp4$/, '.json'), JSON.stringify(results, null, 1));
  console.log('wrote', outFile);
})();
