const { chromium } = require('playwright');
const [map, x, out, clip] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://localhost:${process.env.PORT || 8000}`); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
  await p.evaluate(async ([map, x]) => { window.twzt.start('Rin'); const w = window.twzt.world; w.log = () => {}; const W = await import('/src/world/world.js'); W.loadMap(w, map, null); w.body.x = +x; const Ph = await import('/src/world/physics.js'); w.body.y = Ph.groundAt(w.map, +x); w.invuln = 1e9; for (const m of w.mobs) m.age = 1; }, [map, x]);
  await p.waitForTimeout(1200); await p.evaluate(() => { window.twzt.ui.banner = 0; });
  const [cx, cy, cw, ch] = (clip || '0,80,1280,560').split(',').map(Number);
  for (let i = 0; i < 48; i++) { await p.screenshot({ path: `gf/${String(i).padStart(2, '0')}.png`, clip: { x: cx, y: cy, width: cw, height: ch } }); await p.waitForTimeout(50); }
  console.log(errs); await b.close();
})();
