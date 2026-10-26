// node faces.cjs out.png key1,key2 [moods] — big render of each design's idle frame per mood.
const { chromium } = require('playwright');
const [out, keys, moodArg] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 2400, height: 1400 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8000/tools/mob-gallery.html?group=meadow&keys=puffle'); await p.waitForFunction(() => document.title === 'ready');
  const size = await p.evaluate(async ([keys, moodArg]) => {
    const { monsterSprite } = await import('/src/render/monsters.js');
    const moods = (moodArg || 'idle,angry,hurt,happy').split(',');
    const list = keys.split(',');
    const c = document.createElement('canvas'); const S = 6, CELL = 240;
    c.width = moods.length * CELL + 20; c.height = list.length * CELL;
    document.body.innerHTML = ''; document.body.appendChild(c);
    const ctx = c.getContext('2d'); ctx.fillStyle = '#f6f0ff'; ctx.fillRect(0, 0, c.width, c.height); ctx.imageSmoothingEnabled = false;
    list.forEach((k, r) => moods.forEach((m, i) => {
      const s = monsterSprite(k, 0, m, 'idle');
      const img = s.canvas ?? s.img ?? s.c;
      const k2 = Math.min(S, (CELL - 10) / Math.max(s.w, s.h));
      // draw upper part (face region) bigger: fit whole sprite into the cell
      ctx.drawImage(img, i * CELL + 10, r * CELL + 5, s.w * k2, s.h * k2);
      ctx.fillStyle = '#3a2d4f'; ctx.font = '14px sans-serif'; ctx.fillText(`${k} ${m}`, i * CELL + 10, r * CELL + 18);
    }));
    return [c.width, c.height];
  }, [keys, moodArg]);
  await p.setViewportSize({ width: size[0], height: size[1] });
  await p.screenshot({ path: out });
  console.log(errs); await b.close();
})();
