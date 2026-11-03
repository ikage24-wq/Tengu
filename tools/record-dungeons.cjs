// Records a montage of the dungeons' rooms: a few seconds in each, the group fighting through it
// (the dungeon-stage autopilot), a title card for each room, fading from one to the next.
// Needs the game served at localhost:8000, playwright and ffmpeg (FFMPEG= to point at it; the
// small ffmpeg that comes with playwright works, it only writes VP9, so name the file .webm).
// Usage: node tools/record-dungeons.cjs <out.webm> [secondsPerRoom]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const [outFile, perArg] = process.argv.slice(2);
const PER = Number(perArg ?? 4.5);
const FPS = 30;
const FADE = 8;
// The rooms, in order: [map, title, subtitle].
const ROOMS = [
  ['hollow3', 'Rootwood Hollow', 'Bramble Tunnels'],
  ['manor2', 'Moonlit Manor', 'The Portrait Gallery'],
  ['manor4', 'Moonlit Manor', 'The Library'],
  ['aquarium3', 'Sunken Aquarium Palace', 'The Pearl Vault'],
  ['aquarium6', 'Sunken Aquarium Palace', 'The Throne of Tides'],
  ['carnival2', 'Clockwork Carnival', 'The Funhouse'],
  ['carnival4', 'Clockwork Carnival', 'The Big Top'],
  ['carnival5', 'Clockwork Carnival', 'The Toy Workshop'],
  ['observatory3', 'Star Observatory', 'The Weightless Reading Room'],
  ['observatory5', 'Star Observatory', 'The Orrery'],
  ['volcano2', 'Candy Volcano', 'The Licorice Mine'],
  ['volcano3', 'Candy Volcano', 'The Candy Kitchen'],
  ['volcano4', 'Candy Volcano', 'The Caramel Forge'],
  ['theatre1', 'Dream Theatre', 'The Grand Lobby'],
  ['theatre4', 'Dream Theatre', 'Act III: The Masked Ball'],
  ['theatre5', 'Dream Theatre', 'Backstage'],
];
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg';
const tmp = fs.mkdtempSync(path.join(path.dirname(path.resolve(outFile)), 'frames-'));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.log('ERR', e.message));
  await page.goto(`http://localhost:${process.env.PORT || 8000}/tools/dungeon-stage.html?job=archer&level=60&seed=7`);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  let n = 0;
  const shot = async () => {
    const data = await page.evaluate(() => window.frame());
    fs.writeFileSync(path.join(tmp, `f${String(n++).padStart(6, '0')}.jpg`), Buffer.from(data.split(',')[1], 'base64'));
  };
  for (const [id, title, sub] of ROOMS) {
    const at = await page.evaluate((r) => window.room(r), id);
    if (at !== id) {
      console.log('skip', id, at);
      continue;
    }
    // Let the group arrive and the fight start before filming.
    await page.evaluate(() => window.sim(2.2));
    await page.evaluate(([t, s]) => window.caption(t, s), [title, sub]);
    const frames = Math.round(PER * FPS);
    for (let i = 0; i < frames; i++) {
      const fade = i < FADE ? 1 - i / FADE : i >= frames - FADE ? (i - (frames - FADE) + 1) / FADE : 0;
      await page.evaluate(([a]) => {
        window.fade(a);
        window.step(1 / 30);
      }, [fade]);
      await shot();
    }
    console.log('filmed', id, n);
  }
  await browser.close();
  // The frames go in through a pipe (the small ffmpeg can't read numbered files).
  const frames = fs.readdirSync(tmp).sort().map((f) => fs.readFileSync(path.join(tmp, f)));
  const codec = outFile.endsWith('.mp4') ? ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20'] : ['-c:v', 'libvpx-vp9', '-b:v', '3M', '-deadline', 'good', '-cpu-used', '4', '-row-mt', '1'];
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', 'pipe:0', ...codec, outFile], { input: Buffer.concat(frames), maxBuffer: 1 << 30 });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('wrote', outFile, n, 'frames');
})();
