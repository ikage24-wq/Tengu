const { chromium } = require('playwright');
const [map, x, keys, out] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8000'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
  await p.evaluate(async ([map, x, keys, gap]) => {
    window.twzt.start('Rin'); const w = window.twzt.world; w.log = () => {};
    const W = await import('/src/world/world.js'); const M = await import('/src/world/mobs.js'); const Ph = await import('/src/world/physics.js');
    W.loadMap(w, map, null); w.body.x = +x; w.body.y = Ph.groundAt(w.map, +x); w.invuln = 1e9;
    w.mobs.length = 0;
    keys.split(',').forEach((k, i) => { const mx = +x - 420 + i * gap; const m = M.spawnMob(w.map, { mob: k, x: mx, y: Ph.groundAt(w.map, mx) }); m.age = 1; w.mobs.push(m); });
  }, [map, x, keys, +(process.env.GAP || 120)]);
  await p.waitForTimeout(1300); await p.evaluate(() => { window.twzt.ui.banner = 0; });
  await p.screenshot({ path: out });
  console.log(errs); await b.close();
})();
