// Usage: node ledgeclip.cjs [map1,map2] — lists scenery (landmarks, houses, props) whose opaque
// pixels run up into a ledge from below, for every map (or the ones named). Only sprites in the
// play layer count: each map is drawn twice with the camera nudged, and backdrop layers (which
// scroll slower) are left out, as are set-back landmarks and tiny things hanging under a ledge.
// Waterfalls and cloud pillars meet their ledge on purpose. Prints "no clipping" when clean.
const { chromium } = require('playwright');
const [ids] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`http://localhost:${process.env.PORT || 8000}/tools/mob-gallery.html?group=meadow&keys=puffle`);
  await p.waitForFunction(() => document.title === 'ready');
  const res = await p.evaluate(async (ids) => {
    const { MAPS } = await import('/src/data/maps.js');
    const { drawSceneBack } = await import('/src/render/scenery.js');
    const { drawStreet } = await import('/src/render/town.js');
    const out = [];
    for (const id of ids ? ids.split(',') : Object.keys(MAPS)) {
      const map = MAPS[id];
      const c = document.createElement('canvas'); c.width = map.width; c.height = map.height;
      const ctx = c.getContext('2d');
      const draws = [];
      const orig = ctx.drawImage.bind(ctx);
      ctx.drawImage = (img, ...a) => {
        let sx = 0, sy = 0, sw = img.width, sh = img.height, dx, dy, dw, dh;
        if (a.length === 2) [dx, dy] = a, dw = img.width, dh = img.height;
        else if (a.length === 4) [dx, dy, dw, dh] = a;
        else [sx, sy, sw, sh, dx, dy, dw, dh] = a;
        const t = ctx.getTransform();
        draws.push({ img, sx, sy, sw, sh, dx, dy, dw, dh, t: [t.a, t.b, t.c, t.d, t.e, t.f], street: draws.street });
        return orig(img, ...a);
      };
      const pass = (cam) => drawSceneBack(ctx, map, cam, map.width, map.height, 3.3, null, () => { draws.street = true; drawStreet(ctx, map, cam, map.width, 3.3); draws.street = false; });
      pass({ x: 0, y: 0 });
      const first = draws.splice(0);
      pass({ x: 2, y: 0 });
      const second = draws.splice(0);
      const play = first.filter((d, i) => second[i]?.img === d.img && Math.abs(second[i].t[4] + second[i].t[0] * second[i].dx - (d.t[4] + d.t[0] * d.dx) + 2) < 0.3);
      const ledges = map.platforms.map((pl) => ({ x1: pl.x, x2: pl.x + pl.w, y: pl.y, y2: pl.y + (pl.thick ?? 26) }));
      for (const d of play) {
        if (!d.img.getContext || d.sw < d.img.width - 1 || d.sh < d.img.height - 1) continue;
        const [A, B, C, D, E, F] = d.t;
        if (Math.abs(B) > 0.01 || Math.abs(C) > 0.01) continue;
        const x0 = Math.min(A * d.dx + E, A * (d.dx + d.dw) + E), x1 = Math.max(A * d.dx + E, A * (d.dx + d.dw) + E);
        const y0 = D * d.dy + F, y1 = D * (d.dy + d.dh) + F;
        if (x1 - x0 < 20 || x1 - x0 > 400 || y1 - y0 > 400) continue;
        const cx = (x0 + x1) / 2;
        const deco = (map.deco ?? []).find(([, dx]) => Math.abs(dx - cx) < 14);
        if (deco && ['waterfall', 'cloudpillar'].includes(deco[0])) continue;
        let data = null;
        for (const pl of ledges) {
          if (y1 <= pl.y + 15) continue;
          const ox0 = Math.max(x0, pl.x1), ox1 = Math.min(x1, pl.x2), oy0 = Math.max(y0, pl.y - 1), oy1 = Math.min(y1, pl.y2);
          if (ox1 - ox0 < 2 || oy1 - oy0 < 2) continue;
          data ??= d.img.getContext('2d').getImageData(0, 0, d.img.width, d.img.height).data;
          let hits = 0;
          for (let y = oy0; y < oy1; y++) for (let x = ox0; x < ox1; x++) {
            const u = (x - x0) / (x1 - x0), v = (y - y0) / (y1 - y0);
            const px = Math.floor(d.sx + (A < 0 ? 1 - u : u) * d.sw), py = Math.floor(d.sy + v * d.sh);
            if (px >= 0 && py >= 0 && px < d.img.width && py < d.img.height && data[(py * d.img.width + px) * 4 + 3] > 60) hits++;
          }
          const what = d.street ? 'street building' : deco ? `${deco[0]}@${deco[1]}` : 'prop';
          if (hits > 6) out.push(`${id}: ${what} at x ${Math.round(x0)}-${Math.round(x1)} runs into the ledge at x ${pl.x1}-${pl.x2}, y ${pl.y}`);
        }
      }
    }
    return out;
  }, ids || '');
  console.log(res.length ? res.join('\n') : 'no clipping');
  if (errs.length) console.log(errs.join('\n'));
  await b.close();
})();
