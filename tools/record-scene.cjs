// Films one dungeon boss's entrance scene: the group walks up to the boss, the scene plays through
// the way a player reads it, and the fight starts. Same setup as tools/record-dungeons.cjs (the
// game served on PORT or 8000, playwright, and ffmpeg via FFMPEG; name the file .webm for the
// small ffmpeg that comes with playwright).
// Usage: node tools/record-scene.cjs <out.webm> <room> [job]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const [outFile, roomId, job] = process.argv.slice(2);
const FPS = 30;
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg';
const tmp = fs.mkdtempSync(path.join(path.dirname(path.resolve(outFile)), 'frames-'));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.log('ERR', e.message));
  await page.goto(`http://localhost:${process.env.PORT || 8000}/tools/dungeon-stage.html?job=${job ?? 'spiritmage'}&level=30&seed=7`);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  await page.evaluate((r) => window.room(r), roomId);
  await page.evaluate(() => window.watch());
  // Walk up unfilmed until the boss is near, then roll.
  for (let k = 0; k < 120; k++) {
    const s = await page.evaluate(() => (window.sim(0.25), window.state()));
    if (s.scene || s.boss < 330) break;
  }
  await page.evaluate(() => window.step(0.6));
  let n = 0;
  let after = -1;
  for (let i = 0; i < FPS * 90 && after !== 0; i++) {
    const s = await page.evaluate(() => (window.step(1 / 30), window.state()));
    // (The first moments are the room fading in from white: left out.)
    const data = i < 15 ? null : await page.evaluate(() => window.frame());
    if (data) fs.writeFileSync(path.join(tmp, `f${String(n++).padStart(6, '0')}.jpg`), Buffer.from(data.split(',')[1], 'base64'));
    if (s.scene && after < 0) after = -2;
    if (!s.scene && after === -2) after = FPS * 2.5;
    if (after > 0) after--;
  }
  await browser.close();
  const frames = fs.readdirSync(tmp).sort().map((f) => fs.readFileSync(path.join(tmp, f)));
  const codec = outFile.endsWith('.mp4') ? ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20'] : ['-c:v', 'libvpx-vp9', '-b:v', '3M', '-deadline', 'good', '-cpu-used', '4', '-row-mt', '1'];
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', 'pipe:0', ...codec, outFile], { input: Buffer.concat(frames), maxBuffer: 1 << 30 });
  if (!process.env.KEEP) fs.rmSync(tmp, { recursive: true, force: true });
  console.log('wrote', outFile, n, 'frames');
})();
