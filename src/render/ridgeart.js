// Moonlit Ridge (its makeover, 2026-11-20): the ridgeline's landmarks. In the meadow, a moon gate:
// two standing moonstones with a capstone across them (a ledge), crescent runes glowing in them and
// the moonbeam rising between. On the knoll, the Lupinas' den: a mound of mossy boulders with a
// warm doorway, a straw bed inside, a lantern and a campfire (its roof and a side boulder are
// ledges). On the summit, the Howling Rock: a great rock shaped like a wolf howling at the moon,
// its ears laid back, its snout to the sky (its crown and its chest are ledges).

import { E, T, F, sprite, blit, snap } from './pixel.js';
import { band } from './propkit.js';

export const MR = {
  rock: '#8f95cc', rockLit: '#b8bee8', rockSh: '#6a70aa', rockDeep: '#50568e',
  moss: '#8fd8b0', mossLit: '#c4f2d6', mossSh: '#5fb08e',
  stone: '#dfe6fa', stoneLit: '#f6f8ff', stoneSh: '#b4bce4', rune: '#9fe0ff', runeLit: '#e8faff',
  wood: '#b08a74', woodSh: '#8a6656', hay: '#f2d494', haySh: '#d8b06a',
  warm: '#ffd890', warmDeep: '#e8a860', hole: '#3a3466', holeIn: '#5a4a6e',
  flower: '#ffffff', flowerMid: '#bfe6ff', banner: '#ff9cb4', bannerSh: '#e07894', ink: '#4a3a5c',
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

const M = 40;
const moveIn = (sh) => (sh.pts ? { ...sh, pts: sh.pts.map(([px, py]) => [px + M, py + M]) } : { ...sh, x: (sh.x ?? 0) + M, y: (sh.y ?? 0) + M });
function art(key, w, h, build) {
  return sprite(`mr|${key}`, () => ({ w: w + M * 2, h: h + M, shapes: build().filter(Boolean).map(moveIn), res: 2, soft: 'cel' }));
}
function place(ctx, s, x, y) {
  blit(ctx, s, snap(x - s.w / 2), snap(y - s.h));
}
// A moonflower at (x, y): five white petals round a pale blue heart.
const moonflower = (x, y, r = 3.4) => {
  const out = [];
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
    out.push(F(E(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.52, r * 0.52, MR.flower)));
  }
  out.push(F(E(x, y, r * 0.32, r * 0.32, MR.flowerMid)));
  return out;
};
// A tuft of grass rising from (x, y).
const tuft = (x, y, s = 1, c = MR.moss) => F(T([[x - 5 * s, y], [x - 4 * s, y - 6 * s], [x - 2 * s, y - 2 * s], [x, y - 9 * s], [x + 2 * s, y - 2 * s], [x + 4 * s, y - 6 * s], [x + 5 * s, y]], c));
// Moss draped along a flat top from x0 to x1 at y: a soft cap just under the line you stand on,
// little lobes hanging off its front, a few flowers.
function mossCap(x0, x1, y, seed, depth = 9) {
  const out = [];
  const pts = [[x0, y]];
  for (let x = x0; x <= x1; x += 12) pts.push([x, y + depth * (0.6 + 0.5 * h01(seed + x))]);
  pts.push([x1, y]);
  out.push(T(pts, MR.moss));
  out.push(F(T([[x0 + 4, y], [x1 - 4, y], [x1 - 6, y + 2.4], [x0 + 6, y + 2.4]], MR.mossLit)));
  for (let x = x0 + 10; x < x1 - 8; x += 36) if (h01(seed + x * 3) > 0.35) out.push(...moonflower(x + h01(x) * 10, y + 4 + h01(x + 1) * 3, 3));
  return out;
}
// A crescent rune carved in stone at (x, y), glowing.
const rune = (x, y, r) => [
  T([...arc(x, y, r, r, 60, 300, 12), ...arc(x + r * 0.42, y, r * 0.78, r * 0.82, 290, 70, 12)], MR.rune),
  F(T([...arc(x, y, r * 0.8, r * 0.8, 120, 240, 8), ...arc(x + r * 0.2, y, r * 0.7, r * 0.72, 230, 130, 8)], MR.runeLit)),
];

// ---------- The moon gate: two standing moonstones, leaning in a little, a capstone across them,
// its top flat (a ledge) MG_TOP above the ground. Bottom middle between the stones. ----------
const MG_W = 300;
const MG_H = 210;
export const MG_TOP = 160;
export const MG_SPAN = 220;
function gateArt() {
  return art('gate', MG_W, MG_H, () => {
    const out = [];
    const cx = MG_W / 2;
    const H = MG_H;
    const top = H - MG_TOP;
    for (const s of [-1, 1]) {
      const sx = cx + s * 82;
      const pts = [[sx - 30, H], [sx - 28, top + 40], [sx - 22, top + 26], [sx - 4 + s * 4, top + 22], [sx + 20, top + 26], [sx + 28, top + 40], [sx + 30, H]];
      out.push(T(pts, MR.stone));
      out.push(F(T([[sx + 10, top + 26], [sx + 20, top + 26], [sx + 28, top + 40], [sx + 30, H], [sx + 14, H]], MR.stoneSh)));
      out.push(F(T([[sx - 22, top + 30], [sx - 14, top + 28], [sx - 18, H - 10], [sx - 26, H - 10]], MR.stoneLit)));
      out.push(...rune(sx - 2, top + 82, 13));
      for (const [dx, dy] of [[-18, 140], [16, 118]]) out.push(F(E(sx + dx, top + dy, 4, 3, MR.stoneSh)));
      out.push(tuft(sx - 26, H, 1.2), tuft(sx + 24, H, 1), ...moonflower(sx - 34, H - 3), ...moonflower(sx + 34, H - 4, 3));
    }
    // The capstone, its top flat, rounded ends, moss along its front.
    const L = cx - MG_SPAN / 2;
    const Rr = cx + MG_SPAN / 2;
    out.push(T([[L - 6, top + 8], [L + 4, top], [Rr - 4, top], [Rr + 6, top + 8], [Rr + 4, top + 22], [Rr - 10, top + 28], [L + 10, top + 28], [L - 4, top + 22]], MR.stone));
    out.push(F(T([[L + 10, top + 20], [Rr - 10, top + 20], [Rr + 4, top + 16], [Rr + 4, top + 22], [Rr - 10, top + 28], [L + 10, top + 28], [L - 4, top + 22]], MR.stoneSh)));
    out.push(...rune(cx, top + 15, 8));
    out.push(...mossCap(L + 6, Rr - 6, top, 5, 7));
    // A little crescent charm hung from its middle on a thread.
    out.push(F(band([[cx + 30, top + 28], [cx + 30, top + 48]], () => 0.8, MR.stoneSh)));
    out.push(T([...arc(cx + 30, top + 56, 8, 8, 40, 320, 10), ...arc(cx + 34, top + 56, 6, 6.4, 300, 60, 10)], MR.warm));
    return out;
  });
}
function drawGate(ctx, x, y, time) {
  // The moon's light pooled between the stones, breathing.
  const p = 0.5 + 0.5 * Math.sin(time * 1.1);
  const g = ctx.createRadialGradient(x, y - 70, 10, x, y - 70, 110);
  g.addColorStop(0, hexA('#cfeaff', 0.32 + 0.12 * p));
  g.addColorStop(1, hexA('#cfeaff', 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - 110, y - 180, 220, 200);
  place(ctx, gateArt(), x, y);
}

// ---------- The Lupinas' den: a mound of mossy boulders on the knoll, its roof flat (a ledge
// WD_ROOF up) with a side boulder (a ledge WD_STEP up) to climb by, a round doorway glowing warm
// with a straw bed inside, a lantern over it, a paw banner. Bottom middle at the doorway. ----------
const WD_W = 360;
const WD_H = 170;
export const WD_ROOF = 120;
export const WD_STEP = 60;
// [left, right] of the roof and the side boulder's tops, from the middle.
export const WD_ROOF_SPAN = [-110, 110];
export const WD_STEP_SPAN = [-170, -94];
function denArt() {
  return art('den', WD_W, WD_H, () => {
    const out = [];
    const cx = WD_W / 2;
    const H = WD_H;
    const rt = H - WD_ROOF;
    const st = H - WD_STEP;
    // The side boulder (behind the mound's left shoulder).
    const [s0, s1] = WD_STEP_SPAN;
    out.push(T([[cx + s0 - 10, H], [cx + s0 - 8, st + 14], [cx + s0, st], [cx + s1 + 10, st], [cx + s1 + 20, st + 12], [cx + s1 + 20, H]], MR.rock));
    out.push(F(T([[cx + s0 - 8, st + 14], [cx + s0, st], [cx + s0 + 20, st], [cx + s0 + 4, H - 10], [cx + s0 - 8, H]], MR.rockLit)));
    out.push(...mossCap(cx + s0 + 2, cx + s1 + 8, st, 31, 8));
    // The mound: rounded shoulders, its roof flat.
    const [r0, r1] = WD_ROOF_SPAN;
    out.push(T([[cx - 150, H], [cx - 146, rt + 60], [cx - 132, rt + 22], [cx + r0, rt], [cx + r1, rt], [cx + 134, rt + 20], [cx + 150, rt + 62], [cx + 156, H]], MR.rock));
    out.push(F(T([[cx + 40, rt + 2], [cx + r1, rt], [cx + 134, rt + 20], [cx + 150, rt + 62], [cx + 156, H], [cx + 70, H], [cx + 96, rt + 50]], MR.rockSh)));
    out.push(F(T([[cx - 146, rt + 60], [cx - 132, rt + 22], [cx + r0, rt], [cx - 60, rt + 2], [cx - 110, rt + 40], [cx - 128, H - 20]], MR.rockLit)));
    // Boulder seams, so it reads as rocks piled up.
    for (const path of [[[cx - 60, rt + 4], [cx - 70, rt + 40], [cx - 104, rt + 60]], [[cx + 50, rt + 4], [cx + 62, rt + 36], [cx + 100, rt + 52]], [[cx - 148, rt + 80], [cx - 96, rt + 76]], [[cx + 152, rt + 84], [cx + 104, rt + 80]]]) out.push(F(band(path, () => 1.6, MR.rockDeep)));
    out.push(...mossCap(cx + r0 + 2, cx + r1 - 2, rt, 41, 10));
    // The doorway: a round arch, glowing warm, a straw bed inside.
    const dw = 40;
    const dh = 70;
    out.push(T([[cx - dw, H], ...arc(cx, H - dh + dw, dw, dw, 180, 360, 14), [cx + dw, H]], MR.hole));
    out.push(F(T([[cx - dw + 8, H], ...arc(cx, H - dh + dw + 4, dw - 8, dw - 8, 180, 360, 12), [cx + dw - 8, H]], MR.holeIn)));
    out.push(F(E(cx, H - 24, 24, 20, '#9a6a78')), F(E(cx, H - 20, 16, 13, '#c8907c')));
    out.push(F(E(cx + 2, H - 6, 30, 9, MR.hay)), F(E(cx + 8, H - 4, 18, 5, MR.haySh)));
    for (const [hx, ha] of [[-18, -0.4], [-6, 0.3], [10, -0.2], [22, 0.5]]) out.push(F(band([[cx + hx, H - 8], [cx + hx + ha * 10, H - 16]], () => 1, MR.haySh)));
    // Stones round the arch.
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      out.push(E(cx + Math.cos(a) * (dw + 6), H - dh + dw + Math.sin(a) * (dw + 6), 7, 5.6, i % 2 ? MR.stoneSh : MR.stone));
    }
    // The lantern hung on a crook over the door, and the paw banner on its pole.
    out.push(F(band([[cx + 52, H], [cx + 52, H - 92], [cx + 40, H - 98], [cx + 30, H - 92]], () => 2.2, MR.wood)));
    out.push(F(band([[cx + 30, H - 92], [cx + 30, H - 84]], () => 0.8, MR.ink)));
    out.push(T([[cx + 24, H - 84], [cx + 36, H - 84], [cx + 38, H - 74], [cx + 34, H - 66], [cx + 26, H - 66], [cx + 22, H - 74]], MR.warm), F(T([[cx + 27, H - 82], [cx + 33, H - 82], [cx + 34, H - 74], [cx + 31, H - 69], [cx + 29, H - 69], [cx + 26, H - 74]], '#fff4d0')));
    out.push(R2(cx + 23, H - 86, cx + 37, H - 83, MR.ink), R2(cx + 25, H - 66, cx + 35, H - 63, MR.ink));
    const bx = cx - 126;
    out.push(F(band([[bx, H], [bx, H - 108]], () => 2, MR.wood)));
    out.push(T([[bx + 1, H - 104], [bx + 34, H - 100], [bx + 30, H - 88], [bx + 34, H - 76], [bx + 1, H - 80]], MR.banner), F(T([[bx + 1, H - 84], [bx + 32, H - 80], [bx + 34, H - 76], [bx + 1, H - 80]], MR.bannerSh)));
    out.push(F(E(bx + 16, H - 88, 4, 3.4, '#ffffff')));
    for (const [px, py] of [[-5, -5], [0, -7], [5, -5], [8, -1]]) out.push(F(E(bx + 15 + px, H - 89 + py, 1.6, 1.6, '#ffffff')));
    out.push(tuft(cx - 150, H, 1.3), tuft(cx + 150, H, 1.1), tuft(cx - 60, H, 0.9), ...moonflower(cx - 80, H - 4), ...moonflower(cx + 116, H - 3, 3));
    return out;
  });
}
const R2 = (x0, y0, x1, y1, c) => T([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], c);
function drawDen(ctx, x, y, time) {
  place(ctx, denArt(), x, y);
  // A little campfire beside the door: logs, a flickering flame, a warm glow, sparks rising.
  const fx = x + 104;
  const fy = y;
  const g = ctx.createRadialGradient(fx, fy - 10, 4, fx, fy - 10, 70);
  g.addColorStop(0, hexA(MR.warm, 0.34 + 0.06 * Math.sin(time * 7)));
  g.addColorStop(1, hexA(MR.warm, 0));
  ctx.fillStyle = g;
  ctx.fillRect(fx - 70, fy - 80, 140, 100);
  ctx.fillStyle = MR.woodSh;
  ctx.fillRect(snap(fx - 13), snap(fy - 5), 26, 4);
  ctx.fillStyle = MR.wood;
  ctx.fillRect(snap(fx - 10), snap(fy - 8), 20, 4);
  const fl = 0.5 + 0.5 * Math.sin(time * 9);
  for (const [c, s, dy] of [['#ffb070', 1, 0], ['#ffd890', 0.66, 3], ['#fff4d0', 0.36, 5]]) {
    const hgt = (16 + fl * 5) * s;
    const wid = 9 * s;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(fx - wid, fy - 7);
    ctx.quadraticCurveTo(fx - wid * 0.9, fy - 7 - hgt * 0.6, fx + Math.sin(time * 5) * 2, fy - 7 - hgt - dy);
    ctx.quadraticCurveTo(fx + wid * 0.9, fy - 7 - hgt * 0.6, fx + wid, fy - 7);
    ctx.closePath();
    ctx.fill();
  }
  for (let i = 0; i < 3; i++) {
    const u = (time * 0.6 + i / 3) % 1;
    ctx.fillStyle = hexA('#ffd890', 1 - u);
    ctx.fillRect(snap(fx - 3 + Math.sin(time * 2 + i * 2) * 5), snap(fy - 24 - u * 40), 2, 2);
  }
}

// ---------- The Howling Rock: a great rock in the shape of a wolf howling at the moon, ears laid
// back, snout to the sky. Its crown (WR_CROWN up) and its chest (WR_CHEST up) are flat (ledges).
// Bottom middle on the summit. ----------
const WR_W = 440;
const WR_H = 270;
export const WR_CROWN = 160;
export const WR_CHEST = 80;
// [left, right] of the crown's and the chest's tops, from the middle.
export const WR_CROWN_SPAN = [-30, 70];
export const WR_CHEST_SPAN = [100, 184];
function wolfArt() {
  return art('wolf', WR_W, WR_H, () => {
    const out = [];
    const cx = WR_W / 2;
    const H = WR_H;
    const ct = H - WR_CROWN;
    const ch = H - WR_CHEST;
    const [c0, c1] = WR_CROWN_SPAN;
    const [k0, k1] = WR_CHEST_SPAN;
    // The whole rock, in hard facets: the craggy back on the left, the ears laid back, the crown,
    // a short thick snout tipped up to the sky with the howl open in it, the throat, the chest
    // jutting out (a shelf) and down to the ground.
    const body = [
      [cx - 206, H], [cx - 198, H - 34], [cx - 184, H - 52], [cx - 178, H - 84], [cx - 152, H - 100], [cx - 140, ct + 34], [cx - 112, ct + 16],
      [cx - 116, ct - 14], [cx - 140, ct - 46], [cx - 130, ct - 52], [cx - 96, ct - 30], [cx - 82, ct - 4],
      [cx - 76, ct - 26], [cx - 96, ct - 62], [cx - 84, ct - 66], [cx - 50, ct - 36], [cx - 40, ct - 2],
      [cx + c0, ct], [cx + c1, ct], [cx + 92, ct - 24], [cx + 112, ct - 52], [cx + 124, ct - 66], [cx + 136, ct - 68], [cx + 142, ct - 60],
      [cx + 132, ct - 50], [cx + 118, ct - 44], [cx + 136, ct - 38], [cx + 132, ct - 26], [cx + 118, ct - 10], [cx + 112, ct + 20],
      [cx + 104, ch - 20], [cx + k0, ch], [cx + k1, ch], [cx + k1 + 14, ch + 18], [cx + 206, H - 40], [cx + 214, H],
    ];
    out.push(T(body, MR.rock));
    // Facets: lit planes facing the moon (upper right), shaded planes turned away.
    const facet = (pts, c) => out.push(F(T(pts.map(([px, py]) => [cx + px, py]), c)));
    facet([[-198, H - 34], [-184, H - 52], [-178, H - 84], [-152, H - 100], [-140, ct + 34], [-150, H - 60], [-176, H - 20]], MR.rockSh);
    facet([[-112, ct + 16], [-42, ct - 4], [c0, ct], [c1, ct], [96, ct - 22], [60, ct + 24], [-40, ct + 40], [-100, ct + 50]], MR.rockLit);
    facet([[92, ct - 24], [112, ct - 52], [124, ct - 66], [136, ct - 68], [126, ct - 54], [104, ct - 22]], MR.rockLit);
    facet([[118, ct - 44], [136, ct - 38], [132, ct - 26], [118, ct - 10], [112, ct + 20], [96, ct + 8], [108, ct - 28]], MR.rockSh);
    facet([[112, ct + 20], [104, ch - 20], [k0, ch], [k1, ch], [k1 + 14, ch + 18], [206, H - 40], [214, H], [140, H], [96, ch + 20], [80, ct + 40]], MR.rockSh);
    facet([[-60, H], [-80, H - 60], [-20, H - 96], [40, H - 70], [60, H]], MR.rockSh);
    // The open howl between the jaws, the nose, and its eye shut as it sings (a carved crease).
    facet([[118, ct - 44], [132, ct - 50], [136, ct - 40]], MR.rockDeep);
    out.push(E(cx + 136, ct - 64, 6.4, 5, MR.rockDeep), F(E(cx + 134, ct - 66, 2.2, 1.6, MR.rockLit)));
    out.push(F(band(arc(cx + 54, ct + 12, 13, 8, 15, 165, 10), (u) => 1.4 + Math.sin(u * Math.PI) * 1.4, MR.rockDeep)));
    // Inside the ears.
    facet([[-114, ct - 16], [-128, ct - 44], [-98, ct - 28], [-90, ct - 8]], MR.rockSh);
    facet([[-74, ct - 26], [-88, ct - 56], [-56, ct - 36], [-48, ct - 6]], MR.rockSh);
    // Cracks between the facets.
    for (const path of [[[-150, H - 10], [-150, H - 60], [-128, H - 90]], [[-80, H - 60], [-20, H - 96], [40, H - 70]], [[60, ct + 24], [30, ct + 60], [40, H - 40]], [[96, ch + 20], [110, H - 30]]]) out.push(F(band(path.map(([px, py]) => [cx + px, py]), () => 1.6, MR.rockDeep)));
    // Moonstones set in its flank, glowing faintly.
    for (const [sx, sy, r] of [[-120, H - 36, 9], [-96, H - 24, 6], [0, H - 40, 7], [90, H - 26, 8]]) {
      out.push(E(cx + sx, sy, r, r * 0.8, MR.stone), F(E(cx + sx - r * 0.3, sy - r * 0.3, r * 0.4, r * 0.3, MR.runeLit)));
    }
    out.push(...mossCap(cx + c0 + 2, cx + c1 - 2, ct, 51, 9));
    out.push(...mossCap(cx + k0 + 2, cx + k1 - 2, ch, 57, 9));
    out.push(tuft(cx - 200, H, 1.3), tuft(cx + 208, H, 1.2), tuft(cx - 10, H, 1), ...moonflower(cx - 170, H - 4), ...moonflower(cx + 184, H - 3), ...moonflower(cx + 20, H - 4, 3));
    return out;
  });
}
function drawWolf(ctx, x, y, time) {
  // Moonlight catching its snout, and a little note of song drifting off it now and then.
  place(ctx, wolfArt(), x, y);
  const u = (time * 0.18) % 1;
  const a = Math.sin(u * Math.PI);
  const nx = x + 146 + u * 40;
  const ny = y - WR_CROWN - 76 - u * 60;
  ctx.fillStyle = hexA('#e8faff', a * 0.85);
  ctx.beginPath();
  ctx.ellipse(nx, ny, 3.4, 2.6, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(snap(nx + 2.4), snap(ny - 12), 1.4, 12);
}

export const RIDGE_KINDS = {
  moongate: { w: MG_W + M * 2, h: MG_H + M, draw: drawGate },
  wolfden: { w: WD_W + M * 2, h: WD_H + M, draw: drawDen },
  wolfrock: { w: WR_W + M * 2, h: WR_H + M, draw: drawWolf },
};
