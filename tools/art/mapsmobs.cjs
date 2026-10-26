const { chromium } = require('playwright');
const [OUT, tag, only] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto(`http://localhost:${process.env.PORT || 8000}`); await p.waitForTimeout(300);
  await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForTimeout(500);
  await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  await p.keyboard.type('Ana'); await p.keyboard.press('Enter'); await p.waitForTimeout(800);
  const shots = [['crag', 700], ['grove', 700], ['canyon', 900], ['sprout', 700], ['meadow1', 900], ['meadow2', 1200], ['harbor', 900], ['woods', 1200], ['ruins', 1300], ['cave', 1300], ['sky', 1300], ['bossroom', 400]];
  for (const [id, x] of shots) {
    if (only && !only.split(',').includes(id)) continue;
    await p.evaluate(async ([id, x]) => {
      const { loadMap } = await import('/src/world/world.js');
      const w = window.twzt.world;
      w.log = () => {};
      loadMap(w, id, Object.values(w.map.portals)[0]?.id);
      loadMap(w, id, null);
      w.invuln = 9999;
      w.body.x = x; w.body.y = w.map.groundY;
      w.char.level = 99; w.char.hp = 1e9; w.stats.maxHp = 1e9;
      for (const [i, m] of w.mobs.entries()) { if (i % 2) m.aggroUntil = w.now + 5.5; m.age = 1; }
    }, [id, x]);
    await p.waitForTimeout(450);
    await p.screenshot({ path: `${OUT}/${tag}-${id}.png` });
  }
  console.log('errors:', errs.slice(0, 5)); await b.close();
})();
