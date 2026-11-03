// Films a rigged boss beside its old frames (tools/boss-rig.html) for one or more loops of its
// little script. Same setup as tools/record-scene.cjs (the game served on PORT or 8000,
// playwright, and ffmpeg via FFMPEG; name the file .webm for the small ffmpeg playwright ships).
// Usage: node tools/record-rig.cjs <out.webm> <boss> [loops]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const [outFile, boss, loopsArg] = process.argv.slice(2);
const FPS = 30;
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg';
const tmp = fs.mkdtempSync(path.join(path.dirname(path.resolve(outFile)), 'frames-'));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.log('ERR', e.message));
  await page.goto(`http://localhost:${process.env.PORT || 8000}/tools/boss-rig.html?record&boss=${boss}`);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  const length = await page.evaluate(() => window.length);
  // A first pass to get every part drawn, then the take.
  await page.evaluate(() => window.step(0.5));
  const frames = Math.round(length * Number(loopsArg ?? 1) * FPS);
  for (let i = 0; i < frames; i++) {
    const data = await page.evaluate(() => (window.step(1 / 30), window.frame()));
    fs.writeFileSync(path.join(tmp, `f${String(i).padStart(6, '0')}.jpg`), Buffer.from(data.split(',')[1], 'base64'));
  }
  await browser.close();
  const all = fs.readdirSync(tmp).sort().map((f) => fs.readFileSync(path.join(tmp, f)));
  const codec = outFile.endsWith('.mp4') ? ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20'] : ['-c:v', 'libvpx-vp9', '-b:v', '3M', '-deadline', 'good', '-cpu-used', '4', '-row-mt', '1'];
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', 'pipe:0', ...codec, outFile], { input: Buffer.concat(all), maxBuffer: 1 << 30 });
  if (!process.env.KEEP) fs.rmSync(tmp, { recursive: true, force: true });
  console.log('wrote', outFile, frames, 'frames');
})();
