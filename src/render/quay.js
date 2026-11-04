// A quay on the sea (a map's `quay`: { x1, x2, sea, boats, kerb }): the walkway is the quay's own
// floor, and the sea lies beyond its far edge, at sea level `sea` px above the walkway's line (it is
// further back, so it shows higher up), fading into the backdrop's own sea. Boats ride in it: each
// hull sinks to its waterline with its reflection in the water under it and bobs with the swell
// (render/water.js drawAfloat). Mooring piles stand out in the water with rings round them. In
// front, the quay's kerb runs along the walkway's far edge (timber or stone, bollards and rope), so
// the sea is seen past the edge you stand on and nothing blue is ever drawn on the floor.
//
//   boats: [{ kind: 'galleon' | 'ship' | 'rowboat' | 'steamer', x, color }]
//   piles: [x, ...]  mooring piles out in the water

import { groundAt } from '../world/physics.js';
import { drawQuaySea, drawAfloat } from './water.js';
import { place } from './scenery.js';
import { snap } from './pixel.js';
import { galleonArt, rowboatArt } from './townhouses.js';
import { shipArt } from './landmarks.js';
import { steamerArt, steamerPaddle, steamerPuffs } from './lagoon.js';

const TAU = Math.PI * 2;
const BOATS = {
  // The galleon's decks are the map's ledges, so she only breathes on the swell. Her keel sits
  // 22 px up her art (the art's foot is open below the hull); her waterline is 10 px above it.
  galleon: { half: 214, line: 10, bob: 0.5, roll: 0.004, draw: (c) => place(c, galleonArt(), 0, 22) },
  ship: { half: 104, line: 9, bob: 1.4, roll: 0.012, draw: (c, time, wx) => place(c, shipArt(Math.floor((time * 3) % 4), Math.floor(time * 3 + wx) % 3), 0, 6) },
  rowboat: { half: 26, line: 5, bob: 1.6, roll: 0.03, draw: (c, time, wx, b) => place(c, rowboatArt(b.color ?? '#ff9ec0'), 0, 1) },
  steamer: {
    half: 50, line: 7, bob: 1.2, roll: 0.01,
    draw: (c, time) => {
      const k = 0.55;
      c.scale(k, k);
      place(c, steamerArt(), 0, 6);
      steamerPaddle(c, 60 - 75, 6 - 30, 1, time * 0.6);
      steamerPuffs(c, 111 - 75, 6 - 92, time);
    },
  },
};

const seaLevel = (map, q, x) => groundAt(map, x) - (q.sea ?? 30);

export function drawQuayBack(ctx, map, cam, width, time) {
  const q = map.quay;
  if (!q) return;
  const x0 = Math.max(q.x1, cam.x - 10) - cam.x;
  const x1 = Math.min(q.x2, cam.x + width + 10) - cam.x;
  if (x1 <= x0) return;
  const gy = groundAt(map, (q.x1 + q.x2) / 2) - cam.y;
  const top = gy - (q.sea ?? 30);
  drawQuaySea(ctx, x0, x1, top, gy - 2, time, cam.x, 'sea', map.night ?? 0);
  // Mooring piles out in the water, each with a ring of ripples at its foot.
  for (const px of q.piles ?? []) {
    const sx = px - cam.x;
    if (sx < -20 || sx > width + 20) continue;
    const wy = seaLevel(map, q, px) - cam.y;
    ctx.fillStyle = '#8a6a52';
    ctx.fillRect(snap(sx - 3), snap(wy - 16), 6, 20);
    ctx.fillStyle = '#a8866a';
    ctx.fillRect(snap(sx - 3), snap(wy - 16), 2, 20);
    ctx.fillStyle = '#6a4e40';
    ctx.fillRect(snap(sx - 4), snap(wy - 18), 8, 3);
    ripples(ctx, sx, wy, 7, time, px);
  }
  for (const b of q.boats ?? []) {
    const d = BOATS[b.kind];
    const sx = b.x - cam.x;
    if (!d || sx < -d.half - 40 || sx > width + d.half + 40) continue;
    const wy = seaLevel(map, q, b.x) - cam.y;
    drawAfloat(ctx, sx, wy, d.half + 6, d.line, time, b.x, (c) => d.draw(c, time, b.x, b), { bob: d.bob, roll: d.roll });
    ripples(ctx, sx - d.half * 0.7, wy, 10, time, b.x);
    ripples(ctx, sx + d.half * 0.75, wy, 10, time, b.x + 3);
  }
}

// Rings spreading on the water round something standing in it.
function ripples(ctx, x, y, r, time, seed) {
  ctx.save();
  ctx.strokeStyle = '#f4fffc';
  ctx.lineWidth = 0.9;
  for (let i = 0; i < 2; i++) {
    const u = (time * 0.6 + i / 2 + seed * 0.013) % 1;
    ctx.globalAlpha = (1 - u) * 0.7;
    ctx.beginPath();
    ctx.ellipse(x, y + 1, r * (0.6 + u), 1.2 + u * 1.4, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

// In front of the boats and anything standing in the water (a pier's legs): the water's skin over
// what's under the surface, then the quay's kerb along the walkway's far edge.
export function drawQuayFront(ctx, map, cam, width, time) {
  const q = map.quay;
  if (!q) return;
  const x0 = Math.max(q.x1, cam.x - 10) - cam.x;
  const x1 = Math.min(q.x2, cam.x + width + 10) - cam.x;
  if (x1 <= x0) return;
  const gy = snap(groundAt(map, (q.x1 + q.x2) / 2) - cam.y);
  const top = gy - (q.sea ?? 30);
  ctx.save();
  // Anything standing down in the sea (a pier's legs) goes under its surface.
  const g = ctx.createLinearGradient(0, top + 1, 0, gy);
  g.addColorStop(0, 'rgba(92,198,204,0.35)');
  g.addColorStop(1, 'rgba(63,148,184,0.55)');
  ctx.fillStyle = g;
  for (const [a, b] of q.under ?? []) {
    const ua = Math.max(x0, a - cam.x);
    const ub = Math.min(x1, b - cam.x);
    if (ub > ua) ctx.fillRect(ua, top + 1, ub - ua, gy - top - 4);
  }
  // The kerb: a timber beam along the edge (or dressed stone), its top lit, plank seams, and the
  // shadow it throws on the water just past it.
  const stone = q.kerb === 'stone';
  ctx.fillStyle = 'rgba(40,70,110,0.22)';
  ctx.fillRect(x0, gy - 8, x1 - x0, 3);
  ctx.fillStyle = stone ? '#b8b0c8' : '#b08a6a';
  ctx.fillRect(x0, gy - 6, x1 - x0, 6);
  ctx.fillStyle = stone ? '#dcd6e8' : '#d8b48a';
  ctx.fillRect(x0, gy - 6, x1 - x0, 1.6);
  ctx.fillStyle = stone ? '#9690aa' : '#8a6a52';
  ctx.fillRect(x0, gy - 1.2, x1 - x0, 1.2);
  const step = stone ? 28 : 42;
  for (let wx = Math.ceil((cam.x + x0) / step) * step; wx < cam.x + x1; wx += step) ctx.fillRect(snap(wx - cam.x), gy - 5, 1, 4);
  // Bollards, each with a mooring line looped on it now and then.
  for (let wx = Math.ceil((cam.x + x0 - 60) / 150) * 150 + 60; wx < cam.x + x1; wx += 150) {
    if (wx < q.x1 + 20 || wx > q.x2 - 20) continue;
    const sx = snap(wx - cam.x);
    ctx.fillStyle = '#5a5070';
    ctx.fillRect(sx - 3, gy - 12, 6, 7);
    ctx.fillStyle = '#7a7090';
    ctx.fillRect(sx - 4, gy - 13, 8, 2.4);
    ctx.fillStyle = '#9a90b0';
    ctx.fillRect(sx - 2.5, gy - 12, 1.4, 5);
    if ((wx / 150) % 2 < 1) {
      ctx.strokeStyle = '#e0c89a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(sx, gy - 9, 5, 1.6, 0, 0, TAU);
      ctx.stroke();
    }
  }
  ctx.restore();
}
