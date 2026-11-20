// Frozen Peak (its makeover, 2026-11-20): a real mountain, the summit's snowy mass running down to
// a mid shelf and the frozen lake. Its landmarks: the Yuki-onna's little snow shrine on the summit
// (a red torii, a shrine under a heavy snow roof, an ice lantern); the Great Icefall, a giant
// frozen waterfall from a glacier lip down into the lake, ice shelves stepping down either side of
// it (ledges in the map) with an ice ladder up its middle; and igloos on the lake shore.

import { E, T, F, sprite, blit, snap } from './pixel.js';
import { band } from './propkit.js';

export const PK = {
  ice: '#bfe6f6', iceLit: '#eefaff', iceSh: '#86c2e0', iceDeep: '#5a9cc8', line: '#4a7aa8',
  snow: '#f8fbff', snowSh: '#d4e2f2', snowDeep: '#b4c8e2',
  red: '#e05a5a', redSh: '#b03a44', wood: '#9a6a52', woodSh: '#704a3a', roof: '#6a5a7a',
  glow: '#ffe2a0',
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
  return sprite(`pk|${key}`, () => ({ w: w + M * 2, h: h + M, shapes: build().filter(Boolean).map(moveIn), res: 2, soft: 'cel' }));
}
function place(ctx, s, x, y) {
  blit(ctx, s, snap(x - s.w / 2), snap(y - s.h));
}
// A drift of snow, a lumpy white mound.
function drift(out, cx, cy, w, h, seed) {
  out.push(E(cx, cy, w / 2, h, PK.snow));
  out.push(F(E(cx + w * 0.15, cy + h * 0.3, w * 0.36, h * 0.5, PK.snowSh)));
  for (let k = 0; k < 3; k++) out.push(F(E(cx - w * 0.3 + k * w * 0.3, cy - h * 0.7 + h01(seed + k) * 4, w * 0.16, h * 0.5, PK.snow)));
}
// Icicles along a line.
function icicles(out, x0, x1, y, seed, long = 14) {
  for (let x = x0, k = 0; x < x1; x += 9 + h01(seed + k) * 6, k++) {
    const len = 5 + h01(seed * 3 + k) * long;
    out.push(T([[x - 2.4, y], [x + 2.4, y], [x, y + len]], PK.ice), F(T([[x - 1.6, y], [x - 0.2, y], [x - 0.6, y + len * 0.7]], PK.iceLit)));
  }
}

// ---------- The Great Icefall: a giant waterfall frozen solid, pouring from a glacier lip (a ledge,
// `bare` in the map) down into the lake, streams of ice running down it, icicles off its shoulders,
// a ladder of steps cut up its middle. Bottom middle on the lake floor. ----------
const IF_W = 280;
const IF_H = 870;
function icefallArt() {
  const W = IF_W;
  const H = IF_H;
  const cx = W / 2;
  return art('icefall', W, H, () => {
    const out = [];
    // The frozen fall: wider at its foot, its streams in bands of blue and white.
    out.push(T([[cx - 96, 30], [cx + 96, 30], [cx + 112, H * 0.4], [cx + 126, H - 60], [cx + 150, H + 4], [cx - 150, H + 4], [cx - 126, H - 60], [cx - 112, H * 0.4]], PK.ice));
    for (let k = 0; k < 9; k++) {
      const x0 = cx - 88 + k * 22 + (h01(k) - 0.5) * 6;
      const pts = [];
      for (let q = 0; q <= 12; q++) {
        const u = q / 12;
        pts.push([x0 + (x0 - cx) * u * 0.32 + Math.sin(u * 8 + k) * 3, 34 + u * (H - 40)]);
      }
      out.push(F(band(pts, (u) => 3 + u * 2, k % 3 === 0 ? PK.iceLit : k % 3 === 1 ? PK.iceSh : '#a8d8ee')));
    }
    out.push(F(T([[cx - 94, 32], [cx - 70, 32], [cx - 86, H * 0.4], [cx - 106, H - 60], [cx - 126, H], [cx - 146, H], [cx - 122, H - 60], [cx - 108, H * 0.4]], PK.iceLit)));
    out.push(F(T([[cx + 94, 32], [cx + 74, 32], [cx + 92, H * 0.4], [cx + 110, H - 60], [cx + 130, H], [cx + 148, H], [cx + 124, H - 60], [cx + 110, H * 0.4]], PK.iceDeep)));
    // Steps cut up its middle (the ladder).
    for (let y = 70; y < H - 20; y += 24) out.push(F(T(rect(cx - 12, y, cx + 12, y + 4), PK.iceDeep)), F(T(rect(cx - 12, y, cx + 12, y + 1.4), PK.iceLit)));
    // The glacier lip on top: a snowy shelf of old ice, icicles hanging off it.
    out.push(T([[cx - 130, 30], [cx - 120, 6], [cx - 60, -6], [cx + 60, -6], [cx + 122, 4], [cx + 132, 30], [cx + 100, 40], [cx - 100, 40]], PK.iceSh));
    out.push(T([[cx - 128, 4], [cx - 116, -10], [cx - 50, -16], [cx + 50, -16], [cx + 118, -8], [cx + 130, 4], [cx + 110, 10], [cx - 110, 10]], PK.snow));
    out.push(F(T([[cx - 110, 6], [cx - 50, -12], [cx + 40, -12], [cx + 100, 2], [cx + 60, 6]], PK.snowSh)));
    icicles(out, cx - 124, cx + 124, 38, 7, 20);
    // A frozen splash mound at its foot.
    drift(out, cx - 100, H - 6, 120, 18, 3);
    drift(out, cx + 104, H - 4, 110, 16, 9);
    return out;
  });
}
function drawIcefall(ctx, x, y, time) {
  place(ctx, icefallArt(), x, y);
  // Glints sliding down the ice, and a breath of frost mist at its foot.
  for (let k = 0; k < 5; k++) {
    const u = (time * 0.12 + k * 0.2) % 1;
    const gx = x - 70 + k * 35;
    const gy = y - IF_H + 40 + u * (IF_H - 80);
    ctx.fillStyle = hexA('#ffffff', 0.8 * Math.sin(u * Math.PI));
    ctx.fillRect(snap(gx), snap(gy), 2, 9);
  }
  const g = ctx.createRadialGradient(x, y - 10, 10, x, y - 10, 170);
  g.addColorStop(0, hexA('#ffffff', 0.4 + 0.1 * Math.sin(time * 0.8)));
  g.addColorStop(1, hexA('#ffffff', 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - 170, y - 120, 340, 140);
}

// ---------- The snow shrine on the summit: a red torii, a little shrine under a heavy snow roof
// with a bell rope, an ice lantern glowing beside it. Bottom middle on the summit. ----------
const SH_W = 260;
const SH_H = 150;
function shrineArt() {
  const W = SH_W;
  const H = SH_H;
  return art('shrine', W, H, () => {
    const out = [];
    // The torii on the left.
    const tx = 50;
    for (const s of [-1, 1]) out.push(T(rect(tx + s * 30 - 5, 30, tx + s * 30 + 5, H), PK.red), F(T(rect(tx + s * 30 + 1, 30, tx + s * 30 + 5, H), PK.redSh)));
    out.push(T([[tx - 50, 24], [tx + 50, 24], [tx + 44, 34], [tx - 44, 34]], PK.red), T(rect(tx - 40, 46, tx + 40, 53), PK.red));
    out.push(T([[tx - 54, 18], [tx - 46, 12], [tx + 46, 12], [tx + 54, 18], [tx + 48, 24], [tx - 48, 24]], PK.snow));
    // The shrine: wooden walls, a dark doorway, a bell and its rope, a heavy snow roof.
    const sx = 170;
    out.push(T(rect(sx - 50, 70, sx + 50, H), PK.wood), F(T(rect(sx + 30, 70, sx + 50, H), PK.woodSh)));
    out.push(T(rect(sx - 20, 92, sx + 20, H), '#3a2a3a'));
    out.push(E(sx, 86, 8, 7, '#e6c060'), F(band([[sx, 92], [sx + 1, 110], [sx - 1, 124]], () => 1.3, PK.red)));
    out.push(T([[sx - 74, 74], [sx - 58, 46], [sx + 58, 46], [sx + 74, 74]], PK.roof));
    out.push(T([[sx - 80, 74], [sx - 70, 56], [sx - 40, 38], [sx + 40, 38], [sx + 70, 56], [sx + 80, 74], [sx + 60, 80], [sx - 60, 80]], PK.snow));
    out.push(F(T([[sx - 64, 70], [sx - 30, 44], [sx + 20, 42], [sx + 60, 66]], PK.snowSh)));
    icicles(out, sx - 70, sx + 70, 78, 3, 10);
    // An ice lantern beside it.
    const lx = sx + 74;
    out.push(T(rect(lx - 6, H - 30, lx + 6, H), PK.iceSh), T(rect(lx - 10, H - 46, lx + 10, H - 30), PK.ice), F(T(rect(lx - 6, H - 43, lx + 6, H - 33), '#fff4c8')));
    out.push(T([[lx - 13, H - 46], [lx, H - 56], [lx + 13, H - 46]], PK.snow));
    drift(out, 120, H - 2, 60, 9, 4);
    drift(out, W - 10, H - 2, 50, 8, 8);
    return out;
  });
}
function drawShrine(ctx, x, y, time) {
  place(ctx, shrineArt(), x, y);
  const lx = x - SH_W / 2 + 244;
  const ly = y - 38;
  const g = ctx.createRadialGradient(lx, ly, 2, lx, ly, 34);
  g.addColorStop(0, hexA(PK.glow, 0.5 + 0.1 * Math.sin(time * 4)));
  g.addColorStop(1, hexA(PK.glow, 0));
  ctx.fillStyle = g;
  ctx.fillRect(lx - 34, ly - 34, 68, 68);
}

// ---------- An igloo: snow blocks in rows, a round tunnel door glowing warm, snow drifted round. ----------
const IG_W = 130;
const IG_H = 80;
function iglooArt(seed) {
  const W = IG_W;
  const H = IG_H;
  const cx = W / 2;
  return art(`igloo${seed}`, W, H, () => {
    const out = [];
    out.push(T([...arc(cx, H, 58, 66, 180, 360, 20)], PK.snow));
    out.push(F(T(arc(cx + 18, H, 38, 58, 270, 360, 10).concat([[cx + 18, H]]), PK.snowSh)));
    for (const y of [H - 18, H - 36, H - 52]) {
      const half = 58 * Math.sqrt(Math.max(0, 1 - ((H - y) / 66) ** 2));
      out.push(F(band([[cx - half + 3, y], [cx + half - 3, y]], () => 0.7, PK.snowDeep)));
      for (let k = -2; k <= 2; k++) {
        const bx = cx + k * 22 + (y % 2 ? 11 : 0);
        if (Math.abs(bx - cx) < half - 6) out.push(F(T(rect(bx - 0.6, y, bx + 0.6, y + 17), PK.snowDeep)));
      }
    }
    // The tunnel door.
    out.push(T([...arc(cx - 34, H, 20, 24, 180, 360, 10)], PK.snow), F(T(arc(cx - 34, H, 13, 17, 180, 360, 10), '#5a4a5a')));
    drift(out, cx + 50, H - 2, 50, 8, seed + 2);
    return out;
  });
}
function drawIgloo(ctx, x, y, time, seed) {
  place(ctx, iglooArt(seed), x, y);
  const dx = x - 34;
  const g = ctx.createRadialGradient(dx, y - 8, 2, dx, y - 8, 30);
  g.addColorStop(0, hexA(PK.glow, 0.45 + 0.08 * Math.sin(time * 3 + seed)));
  g.addColorStop(1, hexA(PK.glow, 0));
  ctx.fillStyle = g;
  ctx.fillRect(dx - 30, y - 38, 60, 40);
}

export const PEAK_KINDS = {
  icefall: { w: IF_W + M * 2, h: IF_H + M, draw: drawIcefall },
  snowshrine: { w: SH_W + M * 2, h: SH_H + M, draw: drawShrine },
  igloo: { w: IG_W + M * 2, h: IG_H + M, draw: drawIgloo },
};
