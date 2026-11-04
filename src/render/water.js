// Water you can wade into (a map's `water`: [{ x1, x2, y }], physics.js waterAt): the pool or sea
// shallows from its surface down to the bed, in the lagoon's pastel teal bands, the surface rolling
// in a slow swell with foam and glints drifting along it. Drawn twice: the body behind everyone
// (`drawWaterBack`), and a see-through skin over their legs with the foam line and a ring of
// ripples round anyone in it (`drawWaterFront`), so a wader is in the water, not stood behind it.
// The swell's phase comes from the water's place in the world, never the screen.

import { groundAt } from '../world/physics.js';

const C = { top: '#8fe6dc', mid: '#5cc6cc', deep: '#3f94b8', foam: '#f4fffc', glint: '#d8fff8', line: '#3a8ab0' };
const swell = (x, time) => Math.sin(x * 0.045 + time * 1.6) * 1.4 + Math.sin(x * 0.11 - time * 2.3) * 0.6;

// The water's outline: its rolling surface, then back along the bed (no deeper than `down`), so it
// fills the pool's shape and never spills over the bank.
function surfacePath(ctx, map, w, cam, time, x0, x1, down) {
  ctx.beginPath();
  ctx.moveTo(x0 - cam.x, w.y - cam.y + swell(x0, time));
  for (let x = x0; x <= x1; x += 4) ctx.lineTo(x - cam.x, w.y - cam.y + swell(x, time));
  ctx.lineTo(x1 - cam.x, w.y - cam.y + swell(x1, time));
  for (let x = x1; x >= x0; x -= 4) ctx.lineTo(x - cam.x, Math.min(w.y + down, Math.max(w.y, groundAt(map, x))) - cam.y);
  ctx.closePath();
}

const span = (w, cam, width) => [Math.max(w.x1, cam.x - 8), Math.min(w.x2, cam.x + width + 8)];

export function drawWaterBack(ctx, map, cam, width, time) {
  for (const w of map.water ?? []) {
    const [x0, x1] = span(w, cam, width);
    if (x1 <= x0) continue;
    // Deepest point of the bed in view, for the bands.
    let bed = w.y + 8;
    for (let x = x0; x <= x1; x += 16) bed = Math.max(bed, groundAt(map, x));
    const depth = bed - w.y + 6;
    const g = ctx.createLinearGradient(0, w.y - cam.y, 0, w.y - cam.y + depth);
    g.addColorStop(0, C.top);
    g.addColorStop(0.35, C.mid);
    g.addColorStop(1, C.deep);
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = g;
    surfacePath(ctx, map, w, cam, time, x0, x1, depth);
    ctx.fill();
    // Light rippling on the bed: soft pale bands drifting.
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#ffffff';
    for (let x = Math.floor(x0 / 22) * 22; x < x1; x += 22) {
      const k = Math.sin(x * 0.7 + time * 1.3);
      const by = groundAt(map, x) - cam.y - 3;
      ctx.beginPath();
      ctx.ellipse(x - cam.x + k * 3, by, 7 + k * 2, 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function drawWaterFront(ctx, map, cam, width, time, waders = []) {
  for (const w of map.water ?? []) {
    const [x0, x1] = span(w, cam, width);
    if (x1 <= x0) continue;
    ctx.save();
    // The skin over legs: a shallow band, see-through.
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = C.top;
    surfacePath(ctx, map, w, cam, time, x0, x1, 14);
    ctx.fill();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = C.mid;
    surfacePath(ctx, map, w, cam, time, x0, x1, 40);
    ctx.fill();
    // The foam line and drifting glints.
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = C.foam;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 3) {
      const y = w.y - cam.y + swell(x, time);
      if (x === x0) ctx.moveTo(x - cam.x, y);
      else ctx.lineTo(x - cam.x, y);
    }
    ctx.stroke();
    ctx.fillStyle = C.glint;
    for (let x = Math.floor(x0 / 30) * 30; x < x1; x += 30) {
      const tw = (Math.sin(x * 1.7 + time * 3) + 1) / 2;
      if (tw < 0.55) continue;
      const gx = x + ((time * 9 + x) % 30) - cam.x;
      ctx.globalAlpha = (tw - 0.55) * 2;
      ctx.fillRect(gx - 2, w.y - cam.y + swell(x, time) + 3, 4, 1);
    }
    // Ripples spreading round whoever's in the water.
    for (const b of waders) {
      if (b.x < w.x1 || b.x > w.x2 || b.y < w.y - 2) continue;
      for (let i = 0; i < 2; i++) {
        const k = (time * 0.9 + i / 2 + b.x * 0.01) % 1;
        ctx.globalAlpha = (1 - k) * 0.8;
        ctx.strokeStyle = C.foam;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(b.x - cam.x, w.y - cam.y + swell(b.x, time) + 1, 8 + k * 16, 1.6 + k * 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
