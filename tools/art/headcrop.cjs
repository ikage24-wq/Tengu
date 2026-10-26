// node headcrop.cjs out.png key1,key2 [moods] [topFrac] — the head region of each design, very big.
const { chromium } = require('playwright');
const [out, keys, moodArg, topArg] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 2400, height: 1400 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://localhost:${process.env.PORT || 8000}/tools/mob-gallery.html?group=meadow&keys=puffle`); await p.waitForFunction(() => document.title === 'ready');
  const size = await p.evaluate(async ([keys, moodArg, topArg]) => {
    const { monsterSprite } = await import('/src/render/monsters.js');
    const moods = (moodArg || 'idle,angry,hurt,happy,blink,dead').split(',');
    const list = keys.split(',');
    const CW = 360, CH = 360, frac = +(topArg || 0.4);
    const c = document.createElement('canvas'); c.width = moods.length * CW; c.height = list.length * CH;
    document.body.innerHTML = ''; document.body.appendChild(c);
    const ctx = c.getContext('2d'); ctx.fillStyle = '#f6f0ff'; ctx.fillRect(0, 0, c.width, c.height); ctx.imageSmoothingEnabled = false;
    list.forEach((k, r) => moods.forEach((m, i) => {
      const s = monsterSprite(k, 0, m, 'idle');
      const img = s.canvas; const sw = img.width, sh = img.height;
      // crop the top `frac` of the sprite, centred square
      const ch = sh * frac, cw = Math.min(sw, ch * 1.2), cx = (sw - cw) / 2 + sw * 0.08;
      ctx.drawImage(img, cx, 0, cw, ch, i * CW + 5, r * CH + 22, CW - 10, (CH - 30) * Math.min(1, ch / cw));
      ctx.fillStyle = '#3a2d4f'; ctx.font = '16px sans-serif'; ctx.fillText(`${k} ${m}`, i * CW + 8, r * CH + 16);
    }));
    return [c.width, c.height];
  }, [keys, moodArg, topArg]);
  await p.setViewportSize({ width: size[0], height: size[1] });
  await p.screenshot({ path: out });
  console.log(errs); await b.close();
})();
