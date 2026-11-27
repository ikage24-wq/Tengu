// Sky Garden (its makeover, 2026-11-20): a smaller sky built round its landmarks, the way Mossy
// Woods is built round its giant trees. Floating garden islands (grass and flowers on top, rock
// tapering under, roots hanging, clouds wrapped round their bellies, the big one pouring a
// waterfall off its edge into the cloud sea); a rainbow arching from the meadows over to the roost,
// little clouds riding it for steps; and the Windsock Roost (the Harpy Roost before its albatrosses), a round birdhouse on a pillar of cloud
// with perches stepping up round it.

import { E, T, F, sprite, blit, snap, shade } from './pixel.js';
import { band } from './propkit.js';

export const SK = {
  grass: '#9fe08a', grassLit: '#cff4a8', grassSh: '#6fc07a', soil: '#c89a78', soilSh: '#a07a62',
  rock: '#c8b8e0', rockLit: '#e6dcf4', rockSh: '#9a8abc', line: '#7a6a9a',
  root: '#a08070', cloud: '#ffffff', cloudSh: '#dfe6fb', cloudDeep: '#c4cdf0',
  water: '#a8dcff', waterLit: '#e8f8ff',
  wood: '#e8b888', woodSh: '#c08a62', roof: '#ff9cc0', roofLit: '#ffd0e2', roofSh: '#d86a98',
  house: '#fff2e0', houseSh: '#f0d8c0', hole: '#6a5070',
  bow: ['#ffb0c0', '#ffcfa0', '#fff0a8', '#bff0b0', '#a8dcff', '#c8b8ff'],
};

const h01 = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const hexA = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;
const arc = (cx, cy, rx, ry, a0, a1, n = 12) => Array.from({ length: n + 1 }, (_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
});
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

const M = 40;
const moveIn = (sh) => (sh.pts ? { ...sh, pts: sh.pts.map(([px, py]) => [px + M, py + M]) } : { ...sh, x: (sh.x ?? 0) + M, y: (sh.y ?? 0) + M });
function art(key, w, h, build) {
  return sprite(`sk|${key}`, () => ({ w: w + M * 2, h: h + M, shapes: build().filter(Boolean).map(moveIn), res: 2, soft: 'cel' }));
}
function place(ctx, s, x, y) {
  blit(ctx, s, snap(x - s.w / 2), snap(y - s.h));
}
// A puff of cloud: a cluster of round lobes on a flat-ish base.
function puff(out, cx, cy, w, h, seed, c = SK.cloud, sh = SK.cloudSh) {
  const n = Math.max(3, Math.round(w / (h * 0.9)));
  out.push(F(E(cx, cy + h * 0.25, w * 0.5, h * 0.4, sh)));
  for (let k = 0; k < n; k++) {
    const u = n === 1 ? 0.5 : k / (n - 1);
    const r = h * (0.42 + 0.22 * Math.sin(Math.PI * u) + h01(seed + k) * 0.1);
    out.push(E(cx - w * 0.42 + u * w * 0.84, cy - r * 0.35, r, r * 0.86, c));
  }
  out.push(F(E(cx, cy + h * 0.12, w * 0.46, h * 0.28, c)));
}

// ---------- A floating garden island: its top (a ledge, `bare` in the map) a strip of grass with
// flowers, its body rock tapering to a point under, roots hanging, clouds round its belly. Three
// sizes (seed 0 big, with the waterfall; 1 small; 2 middling). Placed by its bottom; its top is
// `ISLANDS[seed].h` above that. ----------
export const ISLANDS = [{ w: 560, h: 170 }, { w: 240, h: 110 }, { w: 320, h: 130 }];
function islandArt(seed) {
  const { w: W, h: H } = ISLANDS[seed % ISLANDS.length];
  const cx = W / 2;
  return art(`island${seed}`, W, H, () => {
    const out = [];
    // The rock underneath, in layers, tapering to a point.
    const tip = [cx + (h01(seed) - 0.5) * W * 0.2, H - 6];
    const body = [[0, 10], [W, 10], [W - W * 0.06, 30], [W - W * 0.16, H * 0.45], [W * 0.66, H * 0.7], tip, [W * 0.32, H * 0.72], [W * 0.14, H * 0.48], [W * 0.05, 30]];
    out.push(T(body, SK.rock));
    out.push(F(T([[2, 12], [W * 0.5, 12], [W * 0.42, H * 0.5], [tip[0] - 4, H - 10], [W * 0.32, H * 0.7], [W * 0.14, H * 0.47], [W * 0.05, 30]], SK.rockLit)));
    out.push(F(T([[W - 2, 12], [W * 0.78, 12], [W * 0.7, H * 0.45], tip, [W * 0.66, H * 0.7], [W - W * 0.16, H * 0.45], [W - W * 0.06, 30]], SK.rockSh)));
    for (let k = 0; k < 4; k++) {
      const y = 26 + k * (H - 40) / 4;
      const half = (W / 2) * (1 - (y - 10) / (H - 10)) * 0.92;
      out.push(F(band([[cx - half, y], [cx - half * 0.3, y + 3], [cx + half * 0.4, y - 2], [cx + half, y + 1]], () => 0.8, SK.rockSh)));
    }
    // The soil band and the grass on top, with a lip curling over.
    out.push(T(rect(-2, 2, W + 2, 14), SK.soil), F(T(rect(-2, 10, W + 2, 14), SK.soilSh)));
    out.push(T([[-6, 4], [-2, -6], [W + 2, -6], [W + 6, 4], [W + 2, 8], [-2, 8]], SK.grass));
    out.push(F(T(rect(0, -6, W, -3), SK.grassLit)));
    for (let k = 0; k < W / 18; k++) out.push(F(T([[k * 18 + 2, 6], [k * 18 + 8, 13 + h01(seed * 3 + k) * 6], [k * 18 + 14, 6]], SK.grassSh)));
    // Roots hanging off its belly.
    for (let k = 0; k < Math.round(W / 70); k++) {
      const rx = W * 0.18 + h01(seed * 5 + k) * W * 0.64;
      const ry = H * 0.4 + h01(seed * 7 + k) * H * 0.3;
      const len = 18 + h01(seed + k * 3) * 28;
      out.push(F(band([[rx, ry], [rx + 3, ry + len * 0.5], [rx - 2, ry + len]], (u) => 1.6 - u * 1.1, SK.root)));
    }
    // Flowers along the grass.
    for (let k = 0; k < W / 40; k++) {
      const fx = 10 + h01(seed * 11 + k) * (W - 20);
      const c = ['#ffb0d0', '#fff0a0', '#c8b8ff', '#ffffff'][k % 4];
      out.push(F(E(fx, -7, 3, 3, c)), F(E(fx, -7, 1.2, 1.2, '#ffd27a')));
    }
    // Clouds wrapped round its belly.
    puff(out, W * 0.2, H * 0.62, W * 0.34, 26, seed * 3);
    puff(out, W * 0.78, H * 0.55, W * 0.3, 22, seed * 3 + 9);
    if (seed % 3 === 0) puff(out, W * 0.5, H * 0.9, W * 0.28, 20, seed * 3 + 17);
    return out;
  });
}
function drawIsland(ctx, x, y, time, seed) {
  place(ctx, islandArt(seed), x, y);
  if (seed % 3 !== 0) return;
  // The big island's waterfall pours off its west end into the cloud sea, falling into mist.
  const { w: W, h: H } = ISLANDS[0];
  const fx = x - W / 2 + 70;
  const top = y - H + 6;
  const len = 150;
  const g = ctx.createLinearGradient(0, top, 0, top + len);
  g.addColorStop(0, hexA(SK.water, 0.95));
  g.addColorStop(0.7, hexA(SK.water, 0.7));
  g.addColorStop(1, hexA(SK.water, 0));
  ctx.fillStyle = g;
  ctx.fillRect(snap(fx - 10), snap(top), 20, len);
  ctx.fillStyle = hexA(SK.waterLit, 0.8);
  for (let k = 0; k < 4; k++) {
    const sy = top + ((time * 70 + k * 37) % (len - 20));
    ctx.fillRect(snap(fx - 7 + k * 4), snap(sy), 1.6, 12);
  }
  // Spray where it fades.
  for (let k = 0; k < 6; k++) {
    const u = (time * 0.5 + k / 6) % 1;
    ctx.fillStyle = hexA('#ffffff', 0.6 * (1 - u));
    ctx.beginPath();
    ctx.arc(fx + Math.sin(k * 2.1) * 14 * u, top + len - 20 + u * 18, 3 + u * 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------- A rainbow arching from one cloud to another: soft bands of pastel colour, a cloud
// at each foot (its steps are little cloud ledges along it, in the map). Bottom middle at the
// feet; RB_W across, RB_H high. ----------
const RB_W = 700;
const RB_H = 330;
function rainbowArt() {
  const W = RB_W;
  const H = RB_H;
  const cx = W / 2;
  return art('rainbow', W, H, () => {
    const out = [];
    const bw = 9;
    SK.bow.forEach((c, k) => {
      const r = cx - 20 - k * bw;
      const ry = H - 20 - k * bw;
      out.push(F(T([...arc(cx, H, r, ry, 180, 360, 40), ...arc(cx, H, r - bw, ry - bw, 360, 180, 40)], c)));
    });
    out.push(F(band(arc(cx, H, cx - 22, H - 22, 195, 345, 30), () => 0.9, '#ffffff')));
    puff(out, 70, H - 14, 150, 40, 3);
    puff(out, W - 70, H - 14, 150, 40, 7);
    return out;
  });
}
function drawRainbow(ctx, x, y) {
  ctx.save();
  ctx.globalAlpha = 0.92;
  place(ctx, rainbowArt(), x, y);
  ctx.restore();
}

// ---------- The Windsock Roost: a round birdhouse with a pointed pink roof, a round door and perch
// pegs, on top of a tall pillar of piled-up cloud. Its perches (ledges) step up round the pillar
// in the map. Bottom middle on the cloud sea. ----------
const RO_W = 220;
const RO_H = 760;
function roostArt() {
  const W = RO_W;
  const H = RO_H;
  const cx = W / 2;
  return art('roost', W, H, () => {
    const out = [];
    // The pillar of cloud, lobes piled up, wider at the foot.
    for (let y = H - 20, k = 0; y > 170; y -= 34 + h01(k * 3.7) * 22, k++) {
      const wd = 84 + Math.max(0, (y - 300) / (H - 300)) * 44 + h01(k * 1.3) * 26;
      const dx = (h01(k * 2.9) - 0.5) * 24;
      puff(out, cx + dx, y, wd, 40 + h01(k * 5.1) * 18, k * 5);
      // (Its east side in the shade.)
      out.push(F(E(cx + dx + wd * 0.3, y + 6, wd * 0.18, 12, SK.cloudSh)));
    }
    // The birdhouse: a round body, its door and windows, perch pegs, a little balcony rail.
    out.push(T(rect(cx - 66, 112, cx + 66, 182), SK.house), F(T(rect(cx + 40, 112, cx + 66, 182), SK.houseSh)));
    out.push(T(rect(cx - 72, 176, cx + 72, 188), SK.wood), F(T(rect(cx - 72, 184, cx + 72, 188), SK.woodSh)));
    out.push(E(cx, 146, 18, 18, SK.hole), F(E(cx - 4, 142, 6, 6, '#8a7090')));
    out.push(T(rect(cx - 2, 164, cx + 2, 172), SK.wood), F(E(cx, 172, 8, 2.4, SK.wood)));
    for (const s of [-1, 1]) {
      out.push(T([...arc(cx + s * 44, 136, 9, 11, 180, 360, 8), [cx + s * 44 + 9, 150], [cx + s * 44 - 9, 150]], '#bfe4ff'));
      out.push(F(T(rect(cx + s * 44 - 1, 126, cx + s * 44 + 1, 150), SK.house)));
    }
    // The roof: pointed, pink, shingled, a little weathervane bird on top.
    out.push(T([[cx - 84, 116], [cx, 30], [cx + 84, 116]], SK.roof));
    out.push(F(T([[cx - 80, 114], [cx, 34], [cx - 10, 60], [cx - 50, 108]], SK.roofLit)), F(T([[cx + 82, 115], [cx, 34], [cx + 20, 70], [cx + 60, 112]], SK.roofSh)));
    for (const y of [70, 92]) {
      const half = ((y - 30) / 86) * 84;
      out.push(F(band(arc(cx, y - 8, half, 8, 20, 160, 10), () => 0.9, SK.roofSh)));
    }
    out.push(F(T(rect(cx - 1.2, 8, cx + 1.2, 32), SK.woodSh)));
    out.push(T([[cx - 10, 12], [cx + 4, 6], [cx + 12, 10], [cx + 4, 14]], '#ffd27a'));
    return out;
  });
}
function drawRoost(ctx, x, y, time) {
  place(ctx, roostArt(), x, y);
  // A pennant flapping off the roof's peak.
  const px = x;
  const py = y - RO_H + 34;
  const f = Math.sin(time * 5) * 3;
  ctx.fillStyle = '#ffb0c0';
  ctx.beginPath();
  ctx.moveTo(px + 1, py - 22);
  ctx.quadraticCurveTo(px + 12, py - 22 + f, px + 22, py - 18 + f);
  ctx.lineTo(px + 1, py - 14);
  ctx.closePath();
  ctx.fill();
}

export const SKY_KINDS = {
  skyisland: { w: 560 + M * 2, h: 170 + M, draw: drawIsland },
  rainbowarch: { w: RB_W + M * 2, h: RB_H + M, draw: drawRainbow },
  roosttower: { w: RO_W + M * 2, h: RO_H + M, draw: drawRoost },
};
