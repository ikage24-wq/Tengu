// Records a demo of the redrawn level 1-50 weapons in use: for each one, its job holding attack
// at a line of training dummies, captioned with the weapon's name.
// Needs the game served at localhost:8000, playwright and ffmpeg.
// Usage: node tools/record-weapons.cjs <out.mp4> [job:weapon,job:weapon...]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const [outFile, listArg] = process.argv.slice(2);
const LIST = (listArg ?? [
  'warrior:sword_5', 'warrior:sword_25', 'warrior:sword_50', 'warrior:axe_30', 'warrior:axe_50', 'warrior:spear_35', 'warrior:spear_50',
  'thief:dagger_20', 'thief:dagger_50', 'thief:gauntlet_45', 'spiritmage:wand_25', 'spiritmage:wand_50', 'spiritmage:staff_30', 'spiritmage:staff_50',
  'archer:bow_25', 'archer:bow_50', 'archer:crossbow_40', 'archer:crossbow_50',
].join(',')).split(',');
const FPS = 30;
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
  for (const pair of LIST) {
    const [job, weapon] = pair.split(':');
    await page.goto(`http://localhost:8000/tools/moves-stage.html?job=${job}&level=50&weapon=${weapon}`);
    await page.waitForFunction(() => window.ready);
    await page.waitForTimeout(800);
    await page.evaluate(() => { for (let i = 0; i < 45; i++) window.step(1 / 30); });
    const name = await page.evaluate(async (id) => (await import('/src/data/items.js')).ITEMS[id].name, weapon);
    const ranged = /bow|wand|staff|gauntlet/.test(weapon);
    await page.evaluate((x) => window.place(x), ranged ? 250 : 380);
    await page.evaluate((s) => window.caption(s), `${name} (level ${weapon.split('_')[1] || 1})`);
    await play(0.5);
    await play(2.6, ['KeyZ']);
    await play(0.4);
  }
  await browser.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(tmp, 'f%06d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', outFile]);
  fs.rmSync(tmp, { recursive: true });
  console.log('wrote', outFile);
})();
