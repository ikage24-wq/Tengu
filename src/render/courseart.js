// The Mochi race courses' own scenery (the course redraw, 2026-11-13; placed by world/stadium.js).
// Each course has a backdrop of its own (`look.skyline` 'course:<name>': a far plane and a middle
// plane, plugged into the scenery painter through BACKDROPS) and track-side pieces (`mr_*`, handed
// over by render/race.js), all lit from the upper left like everything else. Everything that moves
// leans or bobs a picture painted once (never repainted for each step of a sway), on the world
// clock, so it glides rather than steps.
//
// Sakura Sprint ('course:sakura'): a spring festival dash under the cherry blossoms. Far off, a
// snow-capped mountain over rolling hills dotted with blossom groves, a pagoda and a torii on the
// hills; nearer, big blossom trees nodding in the breeze, petals spiralling down, and under them Mochi
// out for a hanami picnic on gingham blankets, cheering as the race goes by. Along the track: a
// festival rope fence with bunting, quarter signs with balloons tied on, and blossom trees of its own.
//   mr_sakura   a big blossom tree beside the track (`extra`: which one, 0-4), petals falling from it
//   mr_fence    the festival fence (from x to `extra.to`): posts, a rope, bunting between tall posts
//   mr_sign     a quarter sign (`extra`: 1 to 3), a bunch of balloons tied to its post

import { art, place, BACKDROPS, BEHIND_GROUND } from './scenery.js';
import { R, E, T, F, snap, mix, shade } from './pixel.js';
import { hash, lean, leanFrame, pivoted, swing } from './propkit.js';
import { windAt, windTravel, GROUND_ART, EDGE_KINDS } from './terrain.js';
import { groundAt } from '../world/physics.js';
import { drawSpectator, drawMochiPose } from './mochi-anim.js';
import { drawHayate, WAKE_SECS } from './hayate.js';
import { newRecord } from '../data/mochi-raise.js';
import { rollMochi } from '../data/mochi-genes.js';
import { introLen, PODIUM, CREST_AHEAD } from '../world/mochi-race.js';
import { WATER_BED, WATER_LIFE, swell } from './water.js';

const TAU = Math.PI * 2;
// (Screen-space repeats for a backdrop plane: index i, its screen x, `factor` of the camera.)
function repeat(camX, factor, spacing, width, draw) {
  const off = camX * factor;
  const first = Math.floor(off / spacing) - 2;
  const count = Math.ceil(width / spacing) + 5;
  for (let k = 0; k < count; k++) draw(first + k, (first + k) * spacing - off);
}

// ---------- Blossom trees ----------
// The blossom palette: the canopy's body, its pale top and its deep underside; white flowers.
const BLOSSOM = [
  { body: '#ffb0c8', top: '#ffe0ea', deep: '#e57aa0' },
  { body: '#ffbfd3', top: '#ffeaf0', deep: '#ec8cae' },
  { body: '#ffa2bf', top: '#ffd4e1', deep: '#dc6e96' },
  { body: '#ffcadb', top: '#fff2f6', deep: '#ef9ab8' },
];
const BARK = '#8a5a60';
const BARK_DK = '#6a4248';
// A canopy: soft round clouds of blossom in a dome, big ones under, smaller on top, each a little
// off from the last (so no two trees match). An outline pass first, then the same clouds bare over
// it, so only the canopy's outer edge carries a line; then the light: a pale crown on the upper
// left of the top clouds, the deep underside, and a scatter of flowers.
const CLOUDS = [[-0.42, 0.2, 0.34], [0.4, 0.22, 0.32], [0, 0.3, 0.38], [-0.22, -0.12, 0.36], [0.24, -0.08, 0.34], [-0.02, -0.38, 0.3], [0.5, -0.02, 0.22], [-0.52, -0.02, 0.2]];
function canopy(cx, cy, cw, ch, v, pal) {
  const rx = cw / 2;
  const ry = ch / 2;
  const blobs = CLOUDS.filter((_, i) => i < 6 || hash(v * 3.1 + i) < 0.55).map(([bx, by, br], i) => {
    const j = hash(v * 7.3 + i * 1.9);
    const r = br * rx * (0.88 + j * 0.24);
    return [cx + (bx + (j - 0.5) * 0.12) * rx, cy + (by + (hash(v * 2.7 + i) - 0.5) * 0.1) * ry, r, by];
  });
  const out = [];
  // (The outline pass, a shade deeper all round, then the clouds bare a hair inside it.)
  for (const [x, y, r] of blobs) out.push(F(E(x, y, r + 1.1, r * 0.86 + 1.1, shade(pal.deep, -18))));
  for (const [x, y, r, by] of blobs) out.push(F(E(x, y, r, r * 0.86, by > 0.1 ? pal.deep : pal.body)));
  // A few dark boughs showing in the gaps underneath.
  for (let k = 0; k < 3; k++) {
    const bx = cx + (hash(v * 6.1 + k) - 0.5) * rx * 1.1;
    const by = cy + ry * (0.25 + hash(v + k * 1.7) * 0.2);
    out.push(F(T([[bx - 1, by + 4], [bx + 4 * (k - 1), by - 3], [bx + 4 * (k - 1) + 1.2, by - 3.4], [bx + 1, by + 4]], BARK_DK)));
  }
  // The middle clouds over the deep underside, then each crown lit from the upper left.
  for (const [x, y, r, by] of blobs) if (by > 0.1) out.push(F(E(x - r * 0.06, y - r * 0.2, r * 0.8, r * 0.58, pal.body)));
  for (const [x, y, r, by] of blobs) if (by <= 0.1) out.push(F(E(x - r * 0.22, y - r * 0.28, r * 0.6, r * 0.42, pal.top)));
  for (const [x, y, r, by] of blobs) if (by <= 0.1) out.push(F(E(x - r * 0.34, y - r * 0.42, r * 0.22, r * 0.14, '#ffffff')));
  // (A maple's: little leaves instead, the lit ones pale gold, the rest in its own shades.)
  if (pal.maple) {
    const n = Math.round(cw / 6);
    for (let k = 0; k < n; k++) {
      const b = blobs[Math.floor(hash(v * 5.5 + k * 3.3) * blobs.length)];
      const a = hash(v * 1.7 + k * 9.1) * TAU;
      const d = Math.sqrt(hash(v * 4.4 + k * 2.2)) * b[2] * 0.8;
      const fx = b[0] + Math.cos(a) * d;
      const fy = b[1] + Math.sin(a) * d * 0.86;
      const lit = fy < cy && fx < cx + rx * 0.3;
      const c = lit ? '#fff0c0' : hash(k + v) < 0.5 ? pal.top : pal.deep;
      out.push(F(T(leafPts(fx, fy, (1.6 + hash(k * 1.3 + v) * 0.9) * (cw > 100 ? 1.25 : 1), k * 0.9), c)));
    }
    return out;
  }
  // Flowers: little five-petal stars, white on the lit side, a few rosy ones in the shade.
  const n = Math.round(cw / 7);
  for (let k = 0; k < n; k++) {
    const b = blobs[Math.floor(hash(v * 5.5 + k * 3.3) * blobs.length)];
    const a = hash(v * 1.7 + k * 9.1) * TAU;
    const d = Math.sqrt(hash(v * 4.4 + k * 2.2)) * b[2] * 0.8;
    const fx = b[0] + Math.cos(a) * d;
    const fy = b[1] + Math.sin(a) * d * 0.86;
    const lit = fy < cy && fx < cx + rx * 0.3;
    const c = lit ? '#ffffff' : hash(k + v) < 0.5 ? pal.top : '#ff8fb0';
    const s = (1.1 + hash(k * 1.3 + v) * 0.8) * (cw > 100 ? 1.25 : 1);
    for (let p = 0; p < 5; p++) {
      const pa = (p / 5) * TAU + k;
      out.push(F(E(fx + Math.cos(pa) * s * 0.8, fy + Math.sin(pa) * s * 0.8, s * 0.62, s * 0.62, c)));
    }
    out.push(F(E(fx, fy, s * 0.4, s * 0.4, '#ffd75e')));
  }
  return out;
}
// A trunk: a soft S, flared at the foot, splitting into two or three boughs that reach into the
// canopy; the shadow side darker; a mossy-pink contact shadow on the ground under it.
// (`bk`: its bark, light and dark: the blossom's rosy brown, or a maple's warmer one.)
function trunk(cx, foot, h, w, v, bk = [BARK, BARK_DK]) {
  const lean0 = (hash(v * 9.7) - 0.5) * w * 0.8;
  const top = foot - h;
  const out = [F(E(cx, foot - 1, w * 1.9, 2.4, '#7ab872'))];
  out.push(T([[cx - w * 0.95, foot], [cx - w * 0.55, foot - h * 0.3], [cx - w * 0.5 + lean0, top + h * 0.15], [cx - w * 0.2 + lean0, top], [cx + w * 0.3 + lean0, top], [cx + w * 0.55 + lean0, top + h * 0.2], [cx + w * 0.5, foot - h * 0.3], [cx + w * 1.0, foot]], bk[0]));
  out.push(F(T([[cx + w * 0.1, foot], [cx + w * 0.2 + lean0 * 0.5, foot - h * 0.5], [cx + w * 0.3 + lean0, top + 2], [cx + w * 0.55 + lean0, top + h * 0.2], [cx + w * 0.5, foot - h * 0.3], [cx + w * 1.0, foot]], bk[1])));
  // The boughs.
  const boughs = 2 + (hash(v * 4.1) < 0.5 ? 1 : 0);
  for (let b = 0; b < boughs; b++) {
    const dir = b === 0 ? -1 : b === 1 ? 1 : (hash(v) - 0.5) * 0.6;
    const bx = cx + lean0 + dir * w * (2.2 + hash(v + b) * 1.4);
    const by = top - h * (0.18 + hash(v * 2 + b) * 0.2);
    out.push(T([[cx + lean0 - w * 0.25, top + 3], [bx - 1.1, by], [bx + 1.1, by - 0.6], [cx + lean0 + w * 0.25, top + 2]], bk[0]));
  }
  // Bark marks.
  for (let k = 0; k < 3; k++) out.push(F(R(cx - w * 0.3 + hash(v + k * 3) * w * 0.5, foot - h * (0.2 + k * 0.22), w * 0.5, 0.8, bk[1])));
  return out;
}
// A whole tree's two pictures (its trunk, and its canopy, which sways on its own): `v` the shape,
// `size` 0 (a backdrop tree) or 1 (beside the track).
const TREE = [
  { w: 92, h: 64, ch: 64, th: 26, tw: 4.2 },
  { w: 156, h: 106, ch: 104, th: 52, tw: 6.4 },
];
const MAPLE_BARK = ['#7a5440', '#5a3a2c'];
const trunkArt = (v, size, maple = false) => art(`mc-trunk|${v}|${size}${maple ? '|m' : ''}`, TREE[size].w, TREE[size].th + 30, () => trunk(TREE[size].w / 2, TREE[size].th + 28, TREE[size].th + 22, TREE[size].tw, v, maple ? MAPLE_BARK : undefined));
// (`set`: the blossom's colours, or a maple's, MAPLE.)
const canopyArt = (v, size, set = BLOSSOM) => art(`mc-canopy|${v}|${size}|${set === BLOSSOM ? 'b' : 'm'}`, TREE[size].w, TREE[size].ch, () => canopy(TREE[size].w / 2, TREE[size].ch * 0.5, TREE[size].w * 0.84, TREE[size].ch * 0.78, v, set[v % set.length]));
// Draws a blossom tree standing at (x, foot): its trunk still, its canopy nodding in the breeze
// (leaning about the top of the trunk) and breathing a little, each tree on its own beat.
function drawTree(ctx, x, foot, v, size, time, wx, shake = 0, set = BLOSSOM) {
  const t = TREE[size];
  place(ctx, trunkArt(v, size, set !== BLOSSOM), snap(x), foot + 2);
  // (The canopy hangs about the top of the trunk, a little above it.)
  const py = foot - t.th - 22;
  const a = (lean(time, wx, 0.25, v) + 0.1) * (size ? 0.045 : 0.035) + shake;
  const bob = Math.sin(time * 1.3 + wx * 0.013) * (size ? 0.8 : 0.5);
  pivoted(ctx, x, py, a, () => place(ctx, canopyArt(v, size, set), x, py + t.ch * 0.32 + bob));
}
// Petals falling from a tree: each loosed from somewhere in the canopy, rocking side to side as it
// drifts down and along with the breeze, spinning, fading in and out; on its own long loop.
const PETAL = ['#ffc8d8', '#ffe4ec', '#ff9fbc'];
function petals(ctx, x, top, foot, w, n, time, seed, scale = 1) {
  for (let k = 0; k < n; k++) {
    const h = hash(seed * 1.31 + k * 7.7);
    const period = 6 + h * 4;
    const u = ((time + h * period * 3.3) % period) / period;
    const x0 = x + (hash(seed + k * 3.9) - 0.5) * w;
    const fall = foot - top;
    const blow = windAt(time, x0) * 26 * u;
    const px = x0 + blow + Math.sin(u * TAU * 1.6 + h * 9) * 7 * scale;
    const py = top + fall * u;
    const alpha = Math.min(1, u / 0.08, (1 - u) / 0.12);
    if (alpha <= 0) continue;
    ctx.save();
    ctx.globalAlpha = alpha * 0.95;
    ctx.translate(px, py);
    ctx.rotate(u * 9 + h * 6);
    const s = (0.9 + h * 0.5) * scale;
    ctx.fillStyle = PETAL[k % PETAL.length];
    ctx.beginPath();
    ctx.ellipse(0, 0, 1.9 * s, 1.1 * s * Math.abs(Math.cos(u * 11 + h * 4)) + 0.3, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

// ---------- The backdrop: far ----------
// The mountain far off: a broad soft cone with a rounded crown, its shaded right flank a step
// darker, under a snowcap with a scalloped hem (pink in its folds).
function mountain(ctx, sx, base, w, h, air) {
  const body = mix('#aab2ea', air, 0.42);
  const dark = mix('#949ddb', air, 0.42);
  const snow = mix('#ffffff', air, 0.12);
  const snowSh = mix('#f2dcec', air, 0.18);
  const peak = base - h;
  const path = (ctx2) => {
    ctx2.beginPath();
    ctx2.moveTo(sx - w / 2, base);
    ctx2.bezierCurveTo(sx - w * 0.28, base - h * 0.32, sx - w * 0.1, peak + h * 0.02, sx, peak);
    ctx2.bezierCurveTo(sx + w * 0.1, peak + h * 0.02, sx + w * 0.28, base - h * 0.32, sx + w / 2, base);
    ctx2.closePath();
  };
  ctx.fillStyle = body;
  path(ctx);
  ctx.fill();
  ctx.save();
  path(ctx);
  ctx.clip();
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(sx + 2, peak);
  ctx.bezierCurveTo(sx + w * 0.05, base - h * 0.5, sx + w * 0.02, base - h * 0.2, sx + w * 0.1, base);
  ctx.lineTo(sx + w, base);
  ctx.lineTo(sx + w, peak);
  ctx.fill();
  // The snowcap, its hem in soft scallops.
  const capY = peak + h * 0.34;
  ctx.fillStyle = snow;
  ctx.beginPath();
  ctx.moveTo(sx - w * 0.4, capY - h * 0.2);
  const n = 7;
  for (let k = 0; k <= n; k++) {
    const u = k / n;
    const x = sx - w * 0.2 + u * w * 0.4;
    const dip = k % 2 ? h * 0.07 : -h * 0.02;
    ctx.quadraticCurveTo(x - w * 0.028, capY + dip + h * 0.04, x, capY + dip * 0.4);
  }
  ctx.lineTo(sx + w * 0.4, capY - h * 0.2);
  ctx.lineTo(sx, peak - 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = snowSh;
  ctx.beginPath();
  ctx.moveTo(sx + 1, peak);
  ctx.quadraticCurveTo(sx + w * 0.06, capY - h * 0.12, sx + w * 0.12, capY + h * 0.02);
  ctx.lineTo(sx + w * 0.3, capY - h * 0.1);
  ctx.lineTo(sx + w * 0.3, peak);
  ctx.fill();
  ctx.restore();
}
// A band of rolling hills across the plane (`par`: how much it moves with the camera), filled down
// to the foot of the screen, a lit rim along its top.
function hills(ctx, cam, width, y, amp, par, seed, fill, rim) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(-4, y + 400);
  const pts = [];
  for (let sx = -4; sx <= width + 8; sx += 4) {
    const k = sx + cam.x * par;
    const v = Math.sin(k * 0.0062 + seed) * 0.55 + Math.sin(k * 0.017 + seed * 2.1) * 0.3 + Math.sin(k * 0.041 + seed) * 0.15;
    pts.push([sx, y - amp * (v * 0.5 + 0.5)]);
  }
  for (const [x, yy] of pts) ctx.lineTo(x, yy);
  ctx.lineTo(width + 8, y + 400);
  ctx.fill();
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  pts.forEach(([x, yy], i) => (i ? ctx.lineTo(x, yy + 0.8) : ctx.moveTo(x, yy + 0.8)));
  ctx.stroke();
  return (sx) => {
    const k = sx + cam.x * par;
    const v = Math.sin(k * 0.0062 + seed) * 0.55 + Math.sin(k * 0.017 + seed * 2.1) * 0.3 + Math.sin(k * 0.041 + seed) * 0.15;
    return y - amp * (v * 0.5 + 0.5);
  };
}
// A blossom grove far off: three to five round tree puffs on a hill, the back ones paler.
function grove(ctx, x, y, seed, air) {
  const n = 3 + Math.floor(hash(seed) * 3);
  for (let k = 0; k < n; k++) {
    const h = hash(seed * 3.7 + k);
    const r = 5 + h * 5;
    const gx = x + (k - (n - 1) / 2) * 8 + (hash(seed + k * 2.3) - 0.5) * 6;
    const gy = y - r * 0.5 - (k % 2) * 3;
    ctx.fillStyle = mix(k % 2 ? '#ffc6d8' : '#ffb2ca', air, 0.38);
    ctx.beginPath();
    ctx.arc(gx, gy, r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = mix('#ffe2ec', air, 0.3);
    ctx.beginPath();
    ctx.arc(gx - r * 0.3, gy - r * 0.35, r * 0.45, 0, TAU);
    ctx.fill();
  }
}
// A five-roofed pagoda far off, its roofs sweeping up at the ends, a spire on top.
const pagodaArt = () => art('mc-pagoda', 50, 76, () => {
  const c = 25;
  const out = [R(c - 1, 2, 2, 12, '#c8a078'), F(E(c, 4, 1.6, 1.6, '#ffd75e'))];
  for (let k = 0; k < 5; k++) {
    const y = 14 + k * 12;
    const hw = 9 + k * 2.4;
    out.push(R(c - hw * 0.62, y + 3, hw * 1.24, 9, '#fff2e6'), F(R(c - hw * 0.62, y + 9, hw * 1.24, 1, '#e8cdbb')));
    out.push(T([[c - hw - 3, y + 1], [c - hw, y + 3.6], [c + hw, y + 3.6], [c + hw + 3, y + 1], [c + hw * 0.5, y - 1.4], [c - hw * 0.5, y - 1.4]], '#e8607a'));
  }
  out.push(R(c - 10, 72, 20, 4, '#d8c0b0'));
  return out;
});
// A torii far off: two posts, two beams, the top one curving up at its ends.
const toriiArt = () => art('mc-torii', 34, 34, () => [
  R(7, 9, 3, 25, '#e8607a'), R(24, 9, 3, 25, '#e8607a'),
  T([[1, 3], [17, 5.4], [33, 3], [32, 7], [17, 8.6], [2, 7]], '#e8607a'), F(R(2, 7, 30, 1.2, '#c84860')),
  R(4, 11, 26, 2.4, '#e8607a'), R(15.5, 7, 3, 4, '#e8607a'),
]);

// ---------- The ground (Sakura Sprint's: `look.groundArt` 'sakura') ----------
// Under the puffy grass, blossom loam laid in soft layers that follow the ground's own top, like a
// cake cut through: a rosy band just under the grass with fallen petals pressed into it, a pale
// seam, a deeper band, another seam, each with a lit upper edge. Round pastel pebbles sit between
// the layers in little nests; and here and there a little lost treat lies buried (a sakura mochi in its leaf, a dango skewer, a marble that winks, a
// ribbon, a star coin).
// Each course's ground (`look.groundArt`): its layers, its pebbles, the little flecks pressed into
// its top layer, and which treats lie buried in it (treat kinds).
const GROUND_SPECS = {
  sakura: {
    layers: [
      { top: 10, bot: 26, c: '#eaa6a2', a: 0.5, amp: 2.4, f: 0.043, rim: '#ffd8d0' },
      { top: 33, bot: 37, c: '#fff0e8', a: 0.7, amp: 3, f: 0.031, rim: null },
      { top: 60, bot: 78, c: '#df9894', a: 0.42, amp: 3.6, f: 0.021, rim: '#f6c4bc' },
      { top: 90, bot: 93, c: '#fde4dc', a: 0.5, amp: 3, f: 0.036, rim: null },
    ],
    pebbles: ['#e6d6f4', '#d2eedc', '#fde4c8', '#ffd6e2', '#d4e4f8', '#fff1c4'],
    flecks: ['#ffffff', '#ffc4d4', '#ff9fbc'],
    treats: [0, 1, 2, 3, 4],
    near: 'mr_sakura',
  },
  // Lily Lake's sandy shore and bed: pale sand in soft bands, a damp darker band under the top, bits
  // of shell pressed in, sea-glass pebbles, and the odd find: a scallop shell, a bottle with a note
  // in it, a pair of swim goggles, a marble, a star coin.
  lake: {
    layers: [
      { top: 6, bot: 18, c: '#e8c48e', a: 0.45, amp: 2, f: 0.05, rim: '#fff4dc' },
      { top: 26, bot: 30, c: '#fffaf0', a: 0.75, amp: 3, f: 0.033, rim: null },
      { top: 50, bot: 66, c: '#d8b07c', a: 0.4, amp: 3.4, f: 0.024, rim: '#fbe6c4' },
      { top: 82, bot: 85, c: '#fff6e6', a: 0.55, amp: 3, f: 0.038, rim: null },
    ],
    pebbles: ['#bfe8e0', '#d6ecff', '#fde4c8', '#ffd6e2', '#e6f6d8', '#f4e8ff'],
    flecks: ['#ffffff', '#ffd8e0', '#f6e0c4'],
    treats: [5, 6, 7, 2, 4],
    near: null,
  },
};
// The ground's top at screen x (along the runs), or null where there's none.
function topOf(runs) {
  return (sx) => {
    for (const pts of runs) {
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1];
        const [bx, by] = pts[i];
        if (sx >= ax && sx <= bx) return ay + ((by - ay) * (sx - ax)) / (bx - ax || 1);
      }
    }
    return null;
  };
}
function courseGround(ctx, m, runs, cam, width, height, time, map) {
  const spec = GROUND_SPECS[map.look?.groundArt];
  if (!spec) return;
  const topAt = topOf(runs);
  // The layers.
  for (const pts of runs) {
    const x0 = Math.max(-8, pts[0][0]);
    const x1 = Math.min(width + 8, pts[pts.length - 1][0]);
    if (x1 <= x0) continue;
    const xs = [];
    for (let x = x0; x < x1; x += 4) xs.push(x);
    xs.push(x1);
    for (const L of spec.layers) {
      const upper = xs.map((x) => [x, topAt(x) + L.top + Math.sin((x + cam.x) * L.f) * L.amp]);
      const lower = xs.map((x) => [x, topAt(x) + L.bot + Math.sin((x + cam.x) * L.f * 1.3 + 2) * L.amp * 0.7]);
      ctx.globalAlpha = L.a;
      ctx.fillStyle = L.c;
      ctx.beginPath();
      upper.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      for (let i = lower.length - 1; i >= 0; i--) ctx.lineTo(lower[i][0], lower[i][1]);
      ctx.closePath();
      ctx.fill();
      if (L.rim) {
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = L.rim;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        upper.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + 0.6) : ctx.moveTo(x, y + 0.6)));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }
  // Petals pressed into the top layer.
  const C = 13;
  for (let c = Math.floor((cam.x - 20) / C); c * C < cam.x + width + 20; c++) {
    const h = hash(c * 1.37 + 5);
    if (h < 0.45) continue;
    const sx = c * C + hash(c * 2.9) * C - cam.x;
    const top = topAt(sx);
    if (top == null) continue;
    ctx.save();
    ctx.translate(sx, top + 13 + hash(c * 4.1) * 10);
    ctx.rotate(hash(c * 7.7) * Math.PI);
    ctx.fillStyle = h > 0.85 ? spec.flecks[0] : h > 0.65 ? spec.flecks[1] : spec.flecks[2];
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.1, 1.1, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(-0.6, -0.3, 0.9, 0.4, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  // Pebble nests between the layers.
  const P = 58;
  for (let c = Math.floor((cam.x - 40) / P); c * P < cam.x + width + 40; c++) {
    if (hash(c * 3.3 + 1) < 0.4) continue;
    const bx = c * P + hash(c * 1.9) * P - cam.x;
    const top = topAt(bx);
    if (top == null) continue;
    const n = 1 + Math.floor(hash(c * 6.1) * 3);
    for (let k = 0; k < n; k++) {
      const r = 2.6 + hash(c * 2.2 + k) * 3.6;
      const x = bx + k * 7 - n * 3;
      const y = top + 44 + hash(c + k * 3.1) * 8 - (k % 2) * 2;
      ctx.fillStyle = 'rgba(150,80,90,0.35)';
      ctx.beginPath();
      ctx.ellipse(x + 0.8, y + 1.4, r * 1.15, r * 0.8, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = spec.pebbles[Math.floor(hash(c * 4.4 + k) * spec.pebbles.length)];
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.15, r * 0.8, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(176,112,118,0.75)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.ellipse(x - r * 0.38, y - r * 0.3, r * 0.42, r * 0.24, -0.4, 0, TAU);
      ctx.fill();
    }
  }
  const trees = (map.townPieces ?? []).filter(([kind]) => kind === spec.near);
  // Buried treats.
  const B = 340;
  const nearTree = (x) => trees.some(([, wx]) => Math.abs(wx - x) < 90);
  for (let c = Math.floor((cam.x - 60) / B); c * B < cam.x + width + 60; c++) {
    const wx = c * B + 60 + hash(c * 8.3) * (B - 120);
    if (hash(c * 5.9 + 2) < 0.25 || nearTree(wx)) continue;
    const sx = wx - cam.x;
    const top = topAt(sx);
    if (top == null) continue;
    treat(ctx, spec.treats[Math.floor(hash(c * 2.7 + 9) * spec.treats.length)], sx, top + 48 + hash(c * 1.1) * 10, time, c);
  }
}
GROUND_ART.push(courseGround);
// A lost treat in the earth (`kind` 0-7), lying a little tilted; the marble now and then winks.
function treat(ctx, kind, x, y, time, seed) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((hash(seed * 3.3) - 0.5) * 0.7);
  const ink = '#a86a72';
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = ink;
  const blob = (bx, by, rx, ry, c) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(bx, by, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  };
  const shine = (bx, by, r) => {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.ellipse(bx, by, r, r * 0.6, -0.5, 0, TAU);
    ctx.fill();
  };
  if (kind === 0) {
    // A sakura mochi wrapped in its leaf.
    blob(1.5, 0.5, 7.5, 4.6, '#8fcf7a');
    ctx.strokeStyle = '#6aa85a';
    ctx.beginPath();
    ctx.moveTo(-4, 1);
    ctx.quadraticCurveTo(1.5, -1, 8, 1.4);
    ctx.stroke();
    ctx.strokeStyle = ink;
    blob(-1, -0.4, 6, 4.2, '#ffc2d4');
    shine(-3, -2, 1.8);
    ctx.fillStyle = '#ff8fb0';
    ctx.beginPath();
    ctx.arc(-0.4, -1.2, 0.9, 0, TAU);
    ctx.fill();
  } else if (kind === 1) {
    // A dango skewer: pink, white and green.
    ctx.strokeStyle = '#c8945a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-13, 0);
    ctx.lineTo(11, 0);
    ctx.stroke();
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = ink;
    ['#ffb0c8', '#fff8f0', '#a8dc8c'].forEach((c, i) => {
      blob(-7 + i * 6, 0, 3, 3, c);
      shine(-8 + i * 6, -1.2, 1);
    });
  } else if (kind === 2) {
    // A glass marble with a swirl; now and then it winks.
    blob(0, 0, 3.6, 3.6, '#9fd8ff');
    ctx.strokeStyle = '#ff9ec0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0.4, 2.8);
    ctx.stroke();
    shine(-1.2, -1.4, 1.2);
    const p = (time + hash(seed) * 9) % 4.5;
    if (p < 0.6) {
      const k = Math.sin((p / 0.6) * Math.PI);
      const r = 4.5 * k;
      ctx.fillStyle = `rgba(255,255,255,${0.95 * k})`;
      ctx.beginPath();
      ctx.moveTo(-1.6, -r - 1.6);
      ctx.lineTo(-1.1, -2.1);
      ctx.lineTo(r - 1.6, -1.6);
      ctx.lineTo(-1.1, -1.1);
      ctx.lineTo(-1.6, r - 1.6);
      ctx.lineTo(-2.1, -1.1);
      ctx.lineTo(-r - 1.6, -1.6);
      ctx.lineTo(-2.1, -2.1);
      ctx.closePath();
      ctx.fill();
    }
  } else if (kind === 3) {
    // A lost hair ribbon.
    ctx.fillStyle = '#ff8fb8';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(s * 6, -5, s * 6.4, 0);
      ctx.quadraticCurveTo(s * 6, 4, 0, 0);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s * 0.6, 0.6);
      ctx.lineTo(s * 3.4, 6);
      ctx.lineTo(s * 1.6, 5.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    blob(0, 0, 1.6, 1.6, '#ff6f9a');
  } else if (kind === 5) {
    // A scallop shell, ridged, pink at its heart.
    ctx.fillStyle = '#ffe2e6';
    ctx.beginPath();
    ctx.moveTo(-5.5, 1.5);
    ctx.quadraticCurveTo(0, -7, 5.5, 1.5);
    ctx.lineTo(1.4, 3);
    ctx.lineTo(-1.4, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#f0a8b8';
    ctx.lineWidth = 0.6;
    for (const a of [-0.9, -0.45, 0, 0.45, 0.9]) {
      ctx.beginPath();
      ctx.moveTo(0, 2.6);
      ctx.lineTo(Math.sin(a) * 5, 2 - Math.cos(a) * 6.2);
      ctx.stroke();
    }
    blob(0, 3.2, 1.8, 1, '#f6c4cc');
  } else if (kind === 6) {
    // A little glass bottle lying on its side, a rolled-up note inside, a cork.
    ctx.fillStyle = 'rgba(150,220,200,0.75)';
    ctx.beginPath();
    ctx.ellipse(-1, 0, 6.5, 3.4, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(5, -1.3, 4, 2.6);
    ctx.strokeRect(5, -1.3, 4, 2.6);
    ctx.fillStyle = '#c8945a';
    ctx.fillRect(8.4, -1.5, 2.2, 3);
    ctx.fillStyle = '#fff6e0';
    ctx.fillRect(-4, -1.2, 6, 2.4);
    ctx.fillStyle = '#e8a0a8';
    ctx.fillRect(-1.6, -1.2, 0.8, 2.4);
    shine(-3, -2, 1.4);
  } else if (kind === 7) {
    // A pair of swim goggles, pink, on their strap.
    ctx.strokeStyle = '#ff8fb0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-8, 1);
    ctx.quadraticCurveTo(-10, 4, -6, 4);
    ctx.moveTo(8, 1);
    ctx.quadraticCurveTo(10, 4, 6, 4);
    ctx.stroke();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.8;
    blob(-3.4, 0, 3.2, 2.6, '#ff9fbc');
    blob(3.4, 0, 3.2, 2.6, '#ff9fbc');
    ctx.fillStyle = '#bfe8ff';
    ctx.beginPath();
    ctx.ellipse(-3.4, 0, 2.1, 1.6, 0, 0, TAU);
    ctx.ellipse(3.4, 0, 2.1, 1.6, 0, 0, TAU);
    ctx.fill();
    shine(-4.2, -0.6, 0.8);
    shine(2.6, -0.6, 0.8);
  } else if (kind === 8) {
    // A chestnut, glossy brown, its pale base, a little point on top.
    blob(0, 0.6, 4.4, 3.8, '#a8603a');
    blob(0, 3, 4, 1.4, '#f0d0a0');
    ctx.fillStyle = '#7a4028';
    ctx.fillRect(-0.5, -4, 1, 1.6);
    shine(-1.6, -1.2, 1.2);
  } else if (kind === 9) {
    // A persimmon, its four green sepals on top.
    blob(0, 0.8, 4.4, 3.6, '#ff9a3a');
    for (const [dx, dy] of [[-1.8, -2.6], [1.8, -2.6], [-0.8, -3.4], [0.8, -3.4]]) blob(dx, dy, 1.5, 0.8, '#6ca050');
    shine(-1.6, -0.6, 1.2);
  } else if (kind === 10) {
    // A lost red mitten, its white cuff.
    blob(0.6, 0.6, 3.4, 4, '#e8607a');
    blob(-2.8, -0.4, 1.3, 2, '#e8607a');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2.6, 3.2, 6.4, 1.6);
    shine(-0.6, -1.6, 1);
  } else if (kind === 11) {
    // A mandarin, its little leaf.
    blob(0, 0.6, 3.8, 3.4, '#ff9a3a');
    blob(1.6, -3, 1.6, 0.8, '#6cb050');
    shine(-1.4, -0.6, 1.1);
  } else if (kind === 12) {
    // A paper fan (uchiwa) on its bamboo handle, a little firework printed on it.
    ctx.fillStyle = '#c8945a';
    ctx.fillRect(-0.6, 1, 1.2, 5.6);
    blob(0, -2.4, 4.6, 4, '#fff4e4');
    ctx.fillStyle = '#e8485e';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      ctx.fillRect(Math.cos(a) * 2 - 0.4, -2.4 + Math.sin(a) * 1.8 - 0.4, 0.8, 0.8);
    }
  } else if (kind === 14) {
    // A little crown, its band worn bright.
    ctx.fillStyle = '#e8c04a';
    ctx.beginPath();
    ctx.moveTo(-4, 2);
    ctx.lineTo(-4, -2.4);
    ctx.lineTo(-2, 0);
    ctx.lineTo(0, -3.4);
    ctx.lineTo(2, 0);
    ctx.lineTo(4, -2.4);
    ctx.lineTo(4, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff0b0';
    ctx.fillRect(-4, 0.6, 8, 1);
    shine(-2, -1, 0.9);
  } else if (kind === 15) {
    // An old iron key.
    ctx.strokeStyle = '#8a8296';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(-2.6, 0, 2, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = '#9a92a6';
    ctx.fillRect(-0.6, -0.7, 6, 1.4);
    ctx.fillRect(4, -0.7, 1.2, 3);
    ctx.fillRect(2.2, -0.7, 1.2, 2.2);
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = ink;
  } else if (kind === 13) {
    // A candy apple on its stick, glossy red.
    ctx.fillStyle = '#c8945a';
    ctx.fillRect(-0.5, -7.4, 1, 4.4);
    blob(0, 0, 4, 3.8, '#e8304a');
    shine(-1.4, -1.4, 1.2);
  } else {
    // A star coin.
    blob(0, 0, 4.4, 4.4, '#ffd75e');
    ctx.fillStyle = '#f0a830';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? 1.1 : 2.6;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    shine(-2, -2.2, 1.1);
  }
  ctx.restore();
}

// The grass edge (`look.edges` 'sakura'): tufts of grass and little flowers along the top, each
// bowing in the breeze on its own, fallen petals lying in the grass, and now and then one of them
// lifting off and tumbling a little way along before it settles again.
const TULIPS = ['#ff8fb0', '#ffd75e', '#ff9e7a', '#ffffff'];
EDGE_KINDS.sakura = (ctx, along, time, seed, width, camX) => {
  const tufts = [];
  const flowers = [];
  const fallen = [];
  along(9, (x, y, k) => {
    if (x < -10 || x > width + 10) return;
    const h = hash(k * 2.3 + seed * 7);
    const w = windAt(time, x + camX);
    // (Bowing away from any runner going by: render/courseart.js pushAt.)
    const sway = Math.sin(time * 2.1 + (x + camX) * 0.06) * 0.6 * (0.5 + w) + w * 1.2 + pushAt(x + camX, time);
    if (h < 0.42) tufts.push([x, y, sway, h]);
    else if (h < 0.58) flowers.push([x, y, sway, h, k]);
    else if (h < 0.82) fallen.push([x, y, h, k]);
  });
  // The grass tufts, in two strokes (the deeper blades, then the lighter ones in front).
  for (const [c, lw, f] of [['#6cbf6a', 1.4, 1], ['#a8e692', 1, 0.7]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const [x, y, sway, h] of tufts) {
      for (const [dx, hh] of [[-1.6, 5], [0, 7.5], [1.8, 5.6]]) {
        const tall = (hh + h * 4) * f;
        ctx.moveTo(x + dx, y);
        ctx.quadraticCurveTo(x + dx + sway * 0.4, y - tall * 0.6, x + dx + sway * (0.7 + h), y - tall);
      }
    }
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  // Little flowers: a tulip cup or a daisy, each nodding on its stem.
  for (const [x, y, sway, h, k] of flowers) {
    const stem = 6 + h * 8;
    const tx = x + sway * 1.2;
    const ty = y - stem + Math.abs(sway) * 0.4;
    ctx.strokeStyle = '#5fb46a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + sway * 0.3, y - stem * 0.5, tx, ty);
    ctx.stroke();
    ctx.fillStyle = '#7ccc72';
    ctx.beginPath();
    ctx.ellipse(x + 1.6, y - stem * 0.35, 1.8, 0.8, -0.6, 0, TAU);
    ctx.fill();
    if (hash(k * 3.1 + seed) < 0.55) {
      const c = TULIPS[Math.floor(hash(k * 1.9 + seed) * TULIPS.length)];
      ctx.fillStyle = shade(c, -14);
      ctx.beginPath();
      ctx.moveTo(tx - 2.4, ty - 2.6);
      ctx.lineTo(tx - 1.2, ty - 0.6);
      ctx.lineTo(tx, ty - 3.2);
      ctx.lineTo(tx + 1.2, ty - 0.6);
      ctx.lineTo(tx + 2.4, ty - 2.6);
      ctx.quadraticCurveTo(tx + 2.6, ty + 1.8, tx, ty + 1.8);
      ctx.quadraticCurveTo(tx - 2.6, ty + 1.8, tx - 2.4, ty - 2.6);
      ctx.fill();
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(tx - 0.5, ty - 0.2, 1.4, 1.6, 0, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = '#ffffff';
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * TAU + h;
        ctx.beginPath();
        ctx.ellipse(tx + Math.cos(a) * 1.7, ty + Math.sin(a) * 1.7, 1.2, 0.8, a, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = '#ffd75e';
      ctx.beginPath();
      ctx.arc(tx, ty, 1, 0, TAU);
      ctx.fill();
    }
  }
  // Fallen petals: lying in the grass, or now and then hopping up and tumbling along a little.
  for (const [x, y, h, k] of fallen) {
    const period = 7 + h * 6;
    const p = (time + hash(k * 4.7 + seed) * period) % period;
    let px = x;
    let py = y - 1;
    let rot = h * 5;
    // (A runner going over it: it flutters up off the grass.)
    const kick = Math.abs(pushAt(x + camX, time));
    if (kick > 0.5) {
      py -= kick * 1.3;
      rot += time * 9;
    }
    if (p < 1.4) {
      const u = p / 1.4;
      px += u * 14 * (0.6 + windAt(time, x + camX) * 0.5);
      py -= Math.sin(u * Math.PI) * 6;
      rot += u * 7;
    }
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);
    ctx.fillStyle = h > 0.74 ? '#ffd8e4' : '#ffaac4';
    ctx.beginPath();
    ctx.ellipse(0, 0, 2, 1.1, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
};

// ---------- The course's clouds ----------
// Big round cumulus, each its own shape: a flat soft underside in lilac-pink, a bright crown, the
// outline only round the outside; drifting slowly along and bobbing a touch. (In place of the
// sky's usual clouds: `look.clouds` false.)
const cloudArt = (v) => art(`mc-cloud|${v}`, 120, 56, () => {
  const n = 4 + (v % 3);
  const lobes = [];
  for (let k = 0; k < n; k++) {
    const u = (k + 0.5) / n;
    const r = 11 + Math.sin(u * Math.PI) * 10 + hash(v * 3.1 + k) * 5;
    lobes.push([10 + u * 100, 46 - r * 0.72, r]);
  }
  const out = [];
  for (const [x, y, r] of lobes) out.push(F(E(x, y, r + 1, r * 0.82 + 1, '#e4d4ee')));
  out.push(F(R(9, 38, 102, 13, '#e4d4ee')), F(E(10, 44.5, 7, 6.5, '#e4d4ee')), F(E(110, 44.5, 7, 6.5, '#e4d4ee')));
  for (const [x, y, r] of lobes) out.push(F(E(x, y, r, r * 0.82, '#ffffff')));
  out.push(F(R(10, 38, 100, 12, '#f6eefa')), F(E(10, 44, 6, 6, '#f6eefa')), F(E(110, 44, 6, 6, '#f6eefa')));
  out.push(F(R(12, 46, 96, 4, '#ecdcf2')));
  for (const [x, y, r] of lobes) out.push(F(E(x - r * 0.3, y - r * 0.32, r * 0.42, r * 0.26, '#ffffff')));
  return out;
}, false);
function clouds(ctx, cam, width, time, night) {
  const drift = cam.x * 0.025 + windTravel(time) * 2.5;
  repeat(drift, 1, 260, width, (i, x) => {
    if (hash(i * 3.7 + 11) < 0.3) return;
    const y = 34 + hash(i * 1.3) * 46 + Math.sin(time * 0.5 + i) * 1.5;
    place(ctx, cloudArt(Math.floor(hash(i * 9.1) * 6)), x + hash(i * 2.2) * 80, y, night ? { alpha: 0.35 } : undefined);
  });
}

// ---------- The race going by (Sakura Sprint's polish, 2026-11-13) ----------
// What the course knows of the race (render/race.js noteRace, each frame): where everyone is and
// how fast, and yours, so the grass can part round the runners, the picnickers can follow yours,
// a quarter sign can cheer as yours passes; and when the big moments came (Go, the first home,
// yours home), for the arches' fanfares. Petals kicked up from the grass under running feet live
// here too.
const RUN = { racers: [], you: null, R: null, map: null, time: -9 };
// (For tests and the live debug tools: what the course has noted of the race.)
export const courseRace = () => ({ ...RUN, moments: RUN.R ? momentsOf(RUN.R) : null });
const MOMENTS = new WeakMap();
const KICKS = [];
const PETALS = ['#ffc4d6', '#ffe2ec', '#ff9fbc', '#ffffff'];
const live = (time) => RUN.R && Math.abs(time - RUN.time) < 0.25;
const momentsOf = (R) => (MOMENTS.has(R) ? MOMENTS.get(R) : MOMENTS.set(R, { signs: {} }).get(R));
export function noteRace(map, R, cam, time) {
  const dt = Math.max(0, Math.min(0.1, time - RUN.time));
  Object.assign(RUN, { R, map, time, you: R.racers[R.me] });
  RUN.racers = R.racers.map((r) => ({ x: r.x, y: r.y, speed: r.m.mode === 'run' ? r.m.speed ?? 0 : 0, mode: r.m.mode, sp: r.m.speed ?? 0, you: r.you }));
  if (!map.look?.festival) return;
  const mo = momentsOf(R);
  if (R.phase !== 'ready') mo.go ??= time;
  if (R.first != null) mo.first ??= time;
  if (RUN.you.done != null) mo.home ??= time;
  if (R.finalAt != null) mo.final ??= time;
  if (R.phase === 'run') {
    for (const [kind, wx] of map.townPieces ?? []) {
      if (kind === 'mr_sign' && RUN.you.x >= wx) mo.signs[wx] ??= time;
      if (kind === 'mr_buoy' && RUN.you.x >= wx) (mo.buoys ??= {})[wx] ??= time;
    }
  }
  if (R.phase === 'run') shakeTrees(map, R, mo, time);
  stepFalls(dt);
  if (map.look.waterArt === 'lake') noteLake(map, R, mo, dt, time);
  if (map.look.wallArt === 'maple') noteMaple(map, R, mo, time);
  if (map.look.launchArt === 'snow') noteSnow(map, R, mo, time);
  if (map.look.groundArt === 'sweets') noteSweets(map, R, mo, time);
  if (map.look.groundArt === 'matsuri') {
    noteLake(map, R, mo, dt, time);
    noteMatsuri(map, R, mo, time);
  }
  if (map.look.groundArt === 'kingdom') {
    noteLake(map, R, mo, dt, time);
    noteKingdom(map, R, mo, time);
  }
  stepDrops(map, dt, time);
  // Petals kicked up: a couple every so many steps from each runner's heels.
  for (const r of R.racers) {
    if (R.phase !== 'run' || r.m.mode !== 'run' || (r.m.speed ?? 0) < 25) {
      r.kickAt = r.m.dist;
      continue;
    }
    r.kickAt ??= r.m.dist;
    if (r.m.dist - r.kickAt < (map.look.leaves || map.look.calm ? 44 : 20)) continue;
    r.kickAt = r.m.dist;
    for (let k = 0; k < (map.look.leaves || map.look.calm ? 1 : 2); k++) {
      const kick = map.look.kicks ?? PETALS;
      KICKS.push({ x: r.x - 4 - Math.random() * 4, y: r.y - 1, vx: -12 - Math.random() * 26, vy: -26 - Math.random() * 30, age: 0, life: 0.8 + Math.random() * 0.4, rot: Math.random() * 6, spin: (Math.random() - 0.5) * 14, c: kick[Math.floor(Math.random() * kick.length)] });
    }
  }
  for (const p of KICKS) {
    p.age += dt;
    p.vy += 130 * dt;
    p.vx *= Math.exp(-2.2 * dt);
    p.vy *= Math.exp(-1.2 * dt);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.spin * dt;
  }
  for (let i = KICKS.length - 1; i >= 0; i--) if (KICKS[i].age >= KICKS[i].life) KICKS.splice(i, 1);
  if (KICKS.length > 160) KICKS.splice(0, KICKS.length - 160);
}
// In front of the runners: the petals they kick up.
export function drawRaceFront(ctx, map, R, cam, time) {
  if (!map.look?.festival) return;
  drawFront2(ctx, map, R, cam, time);
  drawDrops(ctx, cam, time);
  for (const p of KICKS) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, (1 - p.age / p.life) * 2);
    ctx.translate(p.x - cam.x, p.y - cam.y);
    ctx.rotate(p.rot);
    if (map.look.leaves) place(ctx, leafArt(p.c, true), 0, 4.5);
    else {
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.8, 1, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}
// Behind the runners: on the final stretch, a gust of petals sweeping across the course behind
// them, swirling as it goes, for a few seconds.
export function drawRaceBehind(ctx, map, R, cam, time) {
  // (A lake course's floating things: its lane rope and quarter buoys.)
  if (map.look?.waterArt === 'lake') lakeBehind(ctx, map, R, cam, time);
  if (map.look?.snowfall) snowfall(ctx, R, time);
  if (map.look?.launchArt === 'snow') glideTrails(ctx, R, cam);
  if (map.look?.groundArt === 'sweets' && map.look.festival) hillTrails(ctx, map, R, cam, time);
  if (map.look?.groundArt === 'matsuri') {
    duskLanterns(ctx, map, cam, time);
    launchFirework(ctx, map, R, cam, time);
  }
  if (map.look?.groundArt === 'kingdom') kingMoat(ctx, map, cam, time);
  if (!map.look?.festival) return;
  const PET = map.look.petals ?? PETALS;
  const mo = momentsOf(R);
  const k = mo.final != null ? time - mo.final : -1;
  if (k < 0 || k > 4) return;
  const vw = 640 / (R.cam?.zoom ?? 1);
  for (let i = 0; i < 120; i++) {
    const h = hash(i * 3.71 + 1);
    const dur = 1.7 + hash(i * 1.3) * 0.9;
    const u = (k - hash(i * 7.9) * 1.6) / dur;
    if (u <= 0 || u >= 1) continue;
    if ((map.look.leaves || map.look.calm) && i % 3) continue;
    const x = -30 + u * (vw + 60);
    const ground = groundAt(map, x + cam.x) - cam.y;
    const y = ground - 8 - h * 74 + Math.sin(u * TAU * 1.4 + h * 9) * 11;
    ctx.save();
    ctx.globalAlpha = Math.min(1, u * 8, (1 - u) * 8) * 0.95;
    ctx.translate(x, y);
    ctx.rotate(u * 10 + h * 6);
    const s = 1.1 + hash(i * 2.9) * 0.6;
    if (map.look.leaves) place(ctx, leafArt(PET[i % PET.length], s < 1.4), 0, 5.5);
    else if (map.look.sprinkles) {
      ctx.fillStyle = PET[i % PET.length];
      ctx.fillRect(-1.6, -0.55, 3.2, 1.1);
    } else if (map.look.sparks) {
      ctx.fillStyle = PET[i % PET.length];
      ctx.fillRect(-0.7, -0.7, 1.4, 1.4);
    } else if (map.look.confetti) {
      ctx.fillStyle = PET[i % PET.length];
      ctx.fillRect(-1.7, -1.1, 3.4, 2.2);
    } else if (map.look.flakes) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 1 + s * 0.4, 0, TAU);
      ctx.fill();
    }
    else {
      ctx.fillStyle = PET[i % PET.length];
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.3 * s, (1.2 * Math.abs(Math.cos(u * 14 + h * 5)) + 0.4) * s, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}
// How far a runner on screen pushes the grass at world x: away from it, most right at its feet.
function pushAt(wx, time) {
  if (!live(time)) return 0;
  let p = 0;
  for (const r of RUN.racers) {
    const d = wx - r.x;
    const a = Math.abs(d);
    if (a < 30 && r.speed > 8) p += Math.sign(d || 1) * (1 - a / 30) ** 2 * Math.min(1, r.speed / 70) * 4.5;
  }
  return p;
}
// Confetti bursting from (x, y) `k` seconds ago, worked out from the moment alone (no state): each
// scrap flung out on its own line, slowing, falling, flipping, fading. `dir` aims the burst
// (radians, up is -PI/2), `spread` how wide.
const CONFETTI = ['#ff8fb0', '#ffd75e', '#8fd3ff', '#9fe0a0', '#c8a8f0', '#ffffff', '#ff9e7a'];
function confetti(ctx, x, y, k, seed, n, dir = -Math.PI / 2, spread = 1.8, power = 1) {
  if (k < 0 || k > 2) return;
  for (let i = 0; i < n; i++) {
    const h = hash(seed * 1.7 + i * 3.3);
    const a = dir + (h - 0.5) * spread;
    const sp = (55 + hash(seed + i * 5.1) * 75) * power;
    const out = (1 - Math.exp(-2.4 * k)) / 2.4;
    const px = x + Math.cos(a) * sp * out + Math.sin(k * 5 + i) * 3;
    const py = y + Math.sin(a) * sp * out + 46 * k * k;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, (2 - k) * 1.2));
    ctx.translate(px, py);
    ctx.rotate(k * (6 + h * 8) + h * 9);
    ctx.fillStyle = CONFETTI[i % CONFETTI.length];
    const fl = Math.abs(Math.cos(k * 11 + i));
    ctx.fillRect(-1.7, -fl - 0.25, 3.4, 2 * fl + 0.5);
    ctx.restore();
  }
}
// The dango on an arch's two posts, drawn live so they can bob: a little idle wobble up the stack,
// and a big happy bounce, ball after ball, at its moment (Go for the start, the first home and
// yours home for the finish), the top one tossing confetti.
const ARCH_DANGO = ['#b8e09c', '#fff6ee', '#ffb7cf'];
export function archDango(ctx, map, x, gy, kind, time) {
  const left = snap(x) - 75;
  const top = gy + 2 - 132;
  const mo = RUN.R && RUN.map === map ? momentsOf(RUN.R) : {};
  const hits = kind === 'start' ? [mo.go] : [mo.first, mo.home];
  for (const [j, px] of [[0, 16], [1, 134]]) {
    let stackY = 0;
    for (let k = 0; k < 3; k++) {
      let lift = Math.sin(time * 2.3 + k * 0.7 + j * 1.9) * 0.35 * (k + 1);
      for (const at of hits) {
        if (at == null) continue;
        const t = time - at - k * 0.06 - j * 0.05;
        if (t > 0 && t < 1.6) lift -= Math.abs(Math.sin(t * 9)) * 7 * Math.exp(-t * 2.6) * (0.6 + k * 0.25);
      }
      stackY = Math.min(stackY, lift);
      const bx = left + px + Math.sin(time * 1.7 + k + j) * 0.3 * k;
      const by = top + 25 - k * 7.4 + Math.min(lift, stackY);
      const c = ARCH_DANGO[k];
      ctx.fillStyle = shade(c, -42);
      ctx.beginPath();
      ctx.ellipse(bx, by, 6.1, 5.7, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(bx, by, 5.4, 5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = shade(c, -10);
      ctx.beginPath();
      ctx.ellipse(bx + 1, by + 2, 3.8, 2.2, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(bx - 1.8, by - 2, 1.6, 1, 0, 0, TAU);
      ctx.fill();
      if (k === 2) {
        ctx.fillStyle = '#c8945a';
        ctx.fillRect(bx - 0.6, by - 9, 1.2, 4);
        for (const at of hits) if (at != null) confetti(ctx, bx, by - 6, time - at - 0.12, at * 7 + j, 14, -Math.PI / 2 + (j ? -0.5 : 0.5), 1.4);
      }
    }
  }
  // (The finish's big moment: a burst of confetti from the middle of its banner as the first one
  // comes home, and a smaller one as yours does.)
  if (kind === 'finish') {
    if (mo.first != null) confetti(ctx, x, top + 22, time - mo.first, mo.first * 3, 70, -Math.PI / 2, 2.8, 1.8);
    if (mo.home != null && mo.home !== mo.first) confetti(ctx, x, top + 22, time - mo.home, mo.home * 3, 40, -Math.PI / 2, 2.4, 1.4);
  }
}

// ---------- Mochi kites ----------
// A round daifuku kite with a sleepy smiling face and a blossom on its brow, flown on a long string
// by one of the picnickers: swooping slowly about the sky, tilting into the breeze, its ribbon tail
// of little bows rippling out behind.
const kiteArt = (v) => art(`mc-kite|${v}`, 30, 30, () => {
  const c = v % 2 ? '#ffe4ee' : '#fff6f0';
  return [
    E(15, 15, 12, 11, c), F(E(11, 11, 5, 3.4, '#ffffff')),
    F(R(14.4, 4, 1.2, 22, 'rgba(200,150,140,0.35)')), F(R(4, 14.4, 22, 1.2, 'rgba(200,150,140,0.35)')),
    F(T([[9.6, 15.6], [11, 14.4], [12.4, 15.6]], '#5a3a48')), F(T([[17.6, 15.6], [19, 14.4], [20.4, 15.6]], '#5a3a48')),
    F(E(8.6, 18, 2, 1.1, '#ffb0c4')), F(E(21.4, 18, 2, 1.1, '#ffb0c4')),
    F(T([[13.6, 18.4], [15, 19.8], [16.4, 18.4]], '#e8607a')),
    ...[0, 1, 2, 3, 4].map((p) => F(E(20 + Math.cos((p / 5) * TAU) * 1.8, 7.4 + Math.sin((p / 5) * TAU) * 1.8, 1.4, 1.4, v % 2 ? '#ff9fbc' : '#ffc4d6'))),
    F(E(20, 7.4, 0.9, 0.9, '#ffd75e')),
  ];
});
function kite(ctx, hx, hy, seed, time) {
  const kx = hx + 40 + Math.sin(time * 0.62 + seed) * 14 + Math.sin(time * 1.4 + seed * 2) * 4;
  // (Low enough to fly clear of the race's progress bar along the top.)
  const ky = hy - 66 + Math.sin(time * 0.9 + seed * 3) * 8;
  const tilt = Math.sin(time * 1.3 + seed) * 0.18 + 0.1;
  // The string, sagging between hand and kite.
  ctx.strokeStyle = 'rgba(140,110,120,0.7)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.quadraticCurveTo((hx + kx) / 2 - 6, (hy + ky) / 2 + 22, kx, ky + 11);
  ctx.stroke();
  // The tail: a ribbon rippling out from under it, little bows along it.
  const tail = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    tail.push([kx - u * 26 + Math.sin(time * 4.2 - i * 0.9 + seed) * 3 * u, ky + 12 + u * 22 + Math.cos(time * 3.1 - i * 0.7) * 2 * u]);
  }
  ctx.strokeStyle = '#ff9fbc';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  tail.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  for (const i of [3, 5, 7]) {
    const [x, y] = tail[i];
    ctx.fillStyle = i === 5 ? '#ffd75e' : '#ff8fb0';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2.6, y - 1.8);
    ctx.lineTo(x - 2.6, y + 1.8);
    ctx.closePath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 2.6, y - 1.8);
    ctx.lineTo(x + 2.6, y + 1.8);
    ctx.closePath();
    ctx.fill();
  }
  pivoted(ctx, kx, ky, tilt, () => place(ctx, kiteArt(seed), kx, ky + 15));
}

// ---------- Festival stalls ----------
// Two little stalls in the meadow near the finish (each once): a dango stall, skewers on its grill
// and a thread of steam curling up, and a candy-floss stall, a pink cloud spinning up in its bowl.
// Striped awnings with a scalloped hem, a noren curtain, a paper lantern swinging from the eave,
// and a Mochi behind each counter, waving at the race.
// (Set back in the meadow along the last quarter, so they pass by as the finish nears, clear of
// the finish arch and the stands.)
const STALLS = [{ at: 960, kind: 'dango', c: '#ff8fb0', seed: 3 }, { at: 1072, kind: 'floss', c: '#8fc8f0', seed: 8 }];
const stallBackArt = (kind, c) => art(`mc-stallb|${kind}`, 70, 66, () => {
  const out = [R(6, 18, 3.6, 46, '#c8945a'), R(60.4, 18, 3.6, 46, '#c8945a'), F(R(7.4, 18, 1.2, 46, '#dcae74')), F(R(61.8, 18, 1.2, 46, '#dcae74'))];
  out.push(R(8, 22, 54, 20, '#fff6ea'));
  // The noren: three panels, a sweet on the middle one.
  for (let k = 0; k < 3; k++) out.push(T([[9 + k * 17.6, 22], [26 + k * 17.6, 22], [26 + k * 17.6, 31], [9 + k * 17.6, 31]], k === 1 ? c : mix(c, '#ffffff', 0.25)));
  if (kind === 'dango') out.push(F(R(34.5, 23.5, 1, 7, '#c8945a')), F(E(35, 25, 1.8, 1.6, '#ffb7cf')), F(E(35, 27.6, 1.8, 1.6, '#ffffff')), F(E(35, 30.2, 1.8, 1.6, '#b8e09c')));
  else out.push(F(R(34.5, 26, 1, 5, '#c8945a')), F(E(35, 25.4, 3, 2.6, '#ffc4d8')), F(E(34, 24.6, 1, 0.8, '#ffffff')));
  // The awning: stripes, then a scalloped hem.
  for (let k = 0; k < 8; k++) out.push(T([[2 + k * 8.25, 8], [10.25 + k * 8.25, 8], [10.25 + k * 8.25, 19], [2 + k * 8.25, 19]], k % 2 ? '#ffffff' : c));
  for (let k = 0; k < 8; k++) out.push(E(6.1 + k * 8.25, 19, 4.1, 3, k % 2 ? '#ffffff' : c));
  out.push(T([[0, 9], [35, 1], [70, 9], [68, 10.5], [35, 3], [2, 10.5]], shade(c, -10)));
  return out;
});
// (Drawn 10 down, room over the counter for the skewers and the floss on its sticks.)
const stallFrontArt = (kind, c) => art(`mc-stallf|${kind}`, 70, 40, () => {
  const out = [F(E(35, 39, 34, 1.8, '#86c47e')), R(4, 18, 62, 21, '#d8a878'), F(R(4, 18, 62, 2.4, '#ecc496')), F(R(4, 37, 62, 2, '#b88658'))];
  for (let x = 12; x < 62; x += 12) out.push(F(R(x, 21, 1, 15, '#c09060')));
  out.push(R(22, 23, 26, 9, '#fff6ea'), F(R(23.5, 24.5, 23, 6, c)));
  if (kind === 'dango') {
    // The grill and its skewers.
    out.push(R(8, 13, 22, 5, '#6a5a60'), F(R(9, 14, 20, 1.4, '#ff9e5a')));
    for (let k = 0; k < 4; k++) {
      const x = 11 + k * 5;
      out.push(F(R(x, 10, 0.8, 7, '#c8945a')), F(E(x + 0.4, 10.6, 1.8, 1.6, '#ffb7cf')), F(E(x + 0.4, 13, 1.8, 1.6, '#ffffff')), F(E(x + 0.4, 15.4, 1.8, 1.6, '#b8e09c')));
    }
  } else {
    // The floss bowl, and finished clouds on sticks in a stand.
    out.push(T([[10, 12], [28, 12], [25, 18], [13, 18]], '#d8e8f4'), F(R(11, 13, 16, 1.2, '#ffffff')));
    for (let k = 0; k < 3; k++) out.push(F(R(44 + k * 6, 6, 0.8, 12, '#ffffff')), E(44.4 + k * 6, 4, 3.4, 3, k === 1 ? '#c8e4ff' : '#ffc4d8'));
  }
  return out;
});
function stall(ctx, s, x, y, time, youX) {
  place(ctx, stallBackArt(s.kind, s.c), snap(x), y);
  // The stallkeeper, behind the counter, waving at the race now and then (and always as yours
  // goes by).
  const pool = picnickers();
  const g = pool[(s.seed * 5) % pool.length];
  const near = youX != null && Math.abs(youX - x) < 90;
  const period = near ? 0.9 : 4;
  const into = (time + s.seed) % period;
  const beat = into < 0.9 ? CHEER_SEQ[Math.min(CHEER_SEQ.length - 1, Math.floor((into / 0.9) * CHEER_SEQ.length))] : 0;
  ctx.save();
  ctx.translate(x - 4, y - 22 - (into < 0.9 ? Math.sin((Math.PI * into) / 0.9) * 1.4 : 0));
  ctx.scale(0.64, 0.64);
  drawSpectator(ctx, g, 0, 0, beat, youX != null && youX < x ? -1 : 1, `stall|${s.kind}`);
  ctx.restore();
  place(ctx, stallFrontArt(s.kind, s.c), snap(x), y + 1);
  // Its lantern, swinging under the eave.
  const lx = x + 26;
  const ly = y - 52;
  pivoted(ctx, lx, ly, swing(time, s.at, 1.4, s.seed), () => {
    ctx.strokeStyle = '#8a6a50';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx, ly + 3);
    ctx.stroke();
    paperLantern(ctx, lx, ly + 8, s.glow ?? 0, 0.8);
  });
  if (s.kind === 'dango') {
    // Steam off the grill, curling up and thinning.
    for (let i = 0; i < 4; i++) {
      const u = (time * 0.45 + i / 4) % 1;
      ctx.fillStyle = `rgba(255,255,255,${(1 - u) * 0.55})`;
      ctx.beginPath();
      ctx.arc(x - 16 + Math.sin(u * 6 + i * 2) * 3 + u * 4, y - 26 - u * 24, 1.8 + u * 4, 0, TAU);
      ctx.fill();
    }
  } else {
    // The floss spinning up in its bowl: a soft pink cloud, wisps turning round it.
    const bx = x - 16;
    const by = y - 32;
    ctx.fillStyle = '#ffd0e0';
    ctx.beginPath();
    ctx.ellipse(bx, by, 6, 4, 0, 0, TAU);
    ctx.fill();
    for (let i = 0; i < 6; i++) {
      const a = time * 3 + (i / 6) * TAU;
      ctx.fillStyle = i % 2 ? '#ffffff' : '#ffb8d0';
      ctx.beginPath();
      ctx.arc(bx + Math.cos(a) * 6, by + Math.sin(a) * 2.6 - 1, 1.6, 0, TAU);
      ctx.fill();
    }
  }
}

// ---------- Paper lanterns (and their light at night) ----------
// A round paper lantern: ribbed, a dark cap and foot, a tassel; by day its paper takes the light,
// at night it glows warm from inside, a soft halo round it (`night`: how dark it is, 0 to 1).
function paperLantern(ctx, x, y, night, s = 1) {
  if (night > 0.05) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, 22 * s);
    g.addColorStop(0, `rgba(255,214,150,${0.55 * night})`);
    g.addColorStop(1, 'rgba(255,214,150,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 22 * s, 0, TAU);
    ctx.fill();
  }
  const body = mix('#ff8fa8', '#ffe0a8', night * 0.85);
  ctx.fillStyle = shade(body, -30);
  ctx.beginPath();
  ctx.ellipse(x, y, 5.8 * s, 6.6 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(x, y, 5 * s, 5.9 * s, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = shade(body, -18);
  ctx.lineWidth = 0.6;
  for (const dy of [-3, 0, 3]) {
    ctx.beginPath();
    ctx.ellipse(x, y + dy * s, 4.8 * s * Math.sqrt(1 - (dy / 6.4) ** 2), 0.8 * s, 0, 0, Math.PI);
    ctx.stroke();
  }
  ctx.fillStyle = '#5a3a40';
  ctx.fillRect(x - 3 * s, y - 7 * s, 6 * s, 1.6 * s);
  ctx.fillRect(x - 3 * s, y + 5.6 * s, 6 * s, 1.6 * s);
  ctx.fillStyle = '#ffd75e';
  ctx.fillRect(x - 0.5 * s, y + 7 * s, 1 * s, 3 * s);
  ctx.fillStyle = `rgba(255,255,255,${0.5 - night * 0.3})`;
  ctx.beginPath();
  ctx.ellipse(x - 2 * s, y - 2.4 * s, 1.4 * s, 2 * s, -0.3, 0, TAU);
  ctx.fill();
}

// ---------- More of the race going by (the second polish pass, 2026-11-13) ----------
// Petals shaken out of a blossom tree as runners pass under it (spawned in noteRace, drawn in front
// of the runners so they drift down over them).
const FALLS = [];
function shakeTrees(map, R, mo, time) {
  mo.trees ??= {};
  for (const [kind, wx] of map.townPieces ?? []) {
    if (kind !== 'mr_sakura' && kind !== 'mr_maple' && kind !== 'mr_pine') continue;
    const under = R.racers.some((r) => Math.abs(r.x - wx) < 26 && (r.m.speed ?? 0) > 20 && r.m.mode === 'run');
    if (!under || time - (mo.trees[wx] ?? -9) < 2.6) continue;
    mo.trees[wx] = time;
    const top = groundAt(map, wx) - 128;
    for (let k = 0, n = kind === 'mr_sakura' ? 16 : 6; k < n; k++) {
      FALLS.push({ x: wx + (Math.random() - 0.5) * 110, y: top + Math.random() * 50, vx: (Math.random() - 0.5) * 10, vy: 6 + Math.random() * 12, age: -Math.random() * 0.3, life: 2.4 + Math.random() * 1.2, rot: Math.random() * 6, spin: (Math.random() - 0.5) * 6, phase: Math.random() * 6, c: (map.look.petals ?? PETALS)[k % (map.look.petals ?? PETALS).length] });
    }
  }
}
function stepFalls(dt) {
  for (const p of FALLS) {
    p.age += dt;
    if (p.age < 0) continue;
    p.vy = Math.min(26, p.vy + 10 * dt);
    p.x += (p.vx + Math.sin(p.age * 2.4 + p.phase) * 12) * dt;
    p.y += p.vy * dt;
    p.rot += p.spin * dt;
  }
  for (let i = FALLS.length - 1; i >= 0; i--) if (FALLS[i].age >= FALLS[i].life) FALLS.splice(i, 1);
  if (FALLS.length > 200) FALLS.splice(0, FALLS.length - 200);
}
// How hard a tree is shivering `k` seconds after the runners shook it.
const shiver = (k) => (k > 0 && k < 1.6 ? Math.sin(k * 22) * 0.06 * Math.exp(-k * 3.2) : 0);

// Golden hour: how far into the warm light between day and night (0 to 1, at its warmest about
// halfway into dusk), from the map's darkness.
export const goldenOf = (night) => (night > 0.04 && night < 0.56 ? Math.sin(Math.PI * Math.min(1, (night - 0.04) / 0.5)) : 0);
function goldenSky(ctx, width, y0, w) {
  if (w <= 0.01) return;
  const g = ctx.createLinearGradient(0, y0 - 220, 0, y0 + 30);
  g.addColorStop(0, 'rgba(255,190,140,0)');
  g.addColorStop(0.6, `rgba(255,186,120,${0.42 * w})`);
  g.addColorStop(1, `rgba(255,214,150,${0.6 * w})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, y0 - 220, width, 260);
  const sx = width * 0.78;
  const sun = ctx.createRadialGradient(sx, y0 - 6, 0, sx, y0 - 6, 150);
  sun.addColorStop(0, `rgba(255,236,170,${0.75 * w})`);
  sun.addColorStop(0.25, `rgba(255,200,130,${0.45 * w})`);
  sun.addColorStop(1, 'rgba(255,190,130,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(sx - 150, y0 - 156, 300, 300);
}

// A routine of key poses (`keys`: [[t, pose], ...], seconds from its start) at time `t`, eased
// between keys (the hands, the head, the lean, the bob and squat, a hop `lift`, and a held prop's
// angle `pole`); the face and the rest held from the last key passed. Stepped to 15 a second (`FPS`):
// the figure's drawings are painted once and come round again; only the hop and what it holds
// move smoothly between.
const FPS = 15;
const POSE_REST = { hx: 0, hy: 1, tilt: -2, bob: 0, squat: 0, lift: 0, pole: 0 };
function routine(keys, t) {
  let i = 0;
  while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
  const [t0, a] = keys[i];
  const [t1, b] = keys[Math.min(keys.length - 1, i + 1)];
  const u = t1 > t0 ? Math.max(0, Math.min(1, (t - t0) / (t1 - t0))) : 1;
  const e = u * u * (3 - 2 * u);
  const out = { ...a };
  for (const k of Object.keys(POSE_REST)) out[k] = (a[k] ?? POSE_REST[k]) + ((b[k] ?? POSE_REST[k]) - (a[k] ?? POSE_REST[k])) * e;
  for (const k of ['front', 'back']) {
    const pa = a[k] ?? [0, 0];
    const pb = b[k] ?? [0, 0];
    out[k] = [pa[0] + (pb[0] - pa[0]) * e, pa[1] + (pb[1] - pa[1]) * e];
  }
  return out;
}
// Draws a posed Mochi from a routine at time `t`: its pose stepped, its hop smooth.
// (A near paw raised up by the head is drawn over it, as the idles do, so you see it lift and grip.)
function posed(ctx, g, x, y, keys, t, opts, fps = FPS) {
  const P = routine(keys, Math.floor(t * fps) / fps);
  const hop = routine(keys, t).lift;
  drawMochiPose(ctx, g, x, y - hop, { ...P, lift: 0, over: P.over ?? P.front[1] < -8 }, opts);
}

// ---------- The starter ----------
// The starter, ahead of the line and facing back at the runners, in the course's own costume (the
// Dango Runner, Sakura Sprint's prize): its pink blossom flag held in its near paw, the pole going
// right through the paw. Through the opening it shoulders the flag and now and then waves to the
// crowd with its other paw; through the countdown it raises the flag high, leaning back proud and
// bobbing on each beat; at Go it swings the flag down with a hop and a yell; then it whirls the flag
// over its head after the runners, turned to watch them go, and settles to a slow, happy sway.
// Each course's festival cast (by `look.cast`, else its ground art): the starter's costume (the
// course's own prize) and its flag, the squad's costume, its pom-poms and its banner.
const CASTS = {
  sakura: {
    id: 'sakura', starter: 'dango', seed: 8817, squad: 'sakura', crew: [8921, 8933, 8947],
    flag: { cloth: '#ff7fa6', hem: '#ffb3cb', mark: 'blossom' },
    pom: { shade: 'rgba(230,110,150,0.35)', outer: ['#ffffff', '#ff8fb0', '#ffb8cc'], inner: ['#ffffff', '#ffd0de'], heart: '#ffe8ee' },
    banner: { text: 'GO! GO!', ink: '#e8507e', edge: '#ff9ec0', tri: ['#ff8fb0', '#ffd75e'] },
  },
  // Lily Lake: the starter a lifeguard in the Warabi Swimmer, waving an aqua flag with a ring buoy on
  // it; the squad a sailor team (Sailor Sweet) with sea-foam pom-poms and a "SPLASH!" banner.
  lake: {
    id: 'lake', starter: 'warabi', seed: 9207, squad: 'sailor', crew: [9311, 9323, 9337],
    flag: { cloth: '#4fb8f0', hem: '#bfe8ff', mark: 'ring' },
    pom: { shade: 'rgba(60,140,210,0.35)', outer: ['#ffffff', '#5fc4f4', '#a8e4ff'], inner: ['#ffffff', '#ffd0e0'], heart: '#eafaff' },
    banner: { text: 'SPLASH!', ink: '#2f8cd0', edge: '#8fd3ff', tri: ['#5fc4f4', '#ffd75e'] },
  },
  // Mortar Cliff: the starter in the Kagami Wrestler (the climb's prize) with a maple-leaf flag; the
  // squad at the summit in Cozy Knit with pom-poms in autumn colours and an "UP! UP!" banner.
  maple: {
    id: 'maple', starter: 'kagami', seed: 9409, squad: 'cozy', crew: [9511, 9523, 9537],
    flag: { cloth: '#ff7a4a', hem: '#ffc49a', mark: 'leaf' },
    pom: { shade: 'rgba(220,100,60,0.35)', outer: ['#ffffff', '#ff8a5c', '#ffc85a'], inner: ['#fff0c0', '#ffb04a'], heart: '#fff4e0' },
    banner: { text: 'UP! UP!', ink: '#e0603a', edge: '#ffb07a', tri: ['#ff8a5c', '#ffd75e'] },
  },
  // Cloud Glide: the starter in the Sakura Glider (the glide's prize) with a sky-blue snowflake
  // flag; the squad at the landing in Cloud Pajamas, snowy pom-poms, a "FLY! FLY!" banner.
  snow: {
    id: 'snow', starter: 'sakura', seed: 9811, squad: 'cloud', crew: [9911, 9923, 9937],
    flag: { cloth: '#8fc8ff', hem: '#e0f0ff', mark: 'flake' },
    pom: { shade: 'rgba(120,150,220,0.35)', outer: ['#ffffff', '#bfe0ff', '#ffd0e0'], inner: ['#ffffff', '#e0f0ff'], heart: '#ffffff' },
    banner: { text: 'FLY! FLY!', ink: '#4a80d0', edge: '#a8d0ff', tri: ['#bfe0ff', '#ffd0e0'] },
  },
  // Long Hill Run: the starter in the Monaka Knight (the hills' prize) waving a matcha-green flag
  // with a dango on it; the squad by the finish in Little Chef, pastry cooks with pink and green
  // pom-poms and a "SWEET!" banner.
  sweets: {
    id: 'sweets', starter: 'monaka', seed: 10211, squad: 'chef', crew: [10311, 10323, 10337],
    flag: { cloth: '#7cc070', hem: '#d4f0c4', mark: 'dango' },
    pom: { shade: 'rgba(230,110,150,0.35)', outer: ['#ffffff', '#ff9ab8', '#b8e09c'], inner: ['#ffffff', '#ffd0de'], heart: '#ffe8ee' },
    banner: { text: 'SWEET!', ink: '#e8507e', edge: '#ffb0c8', tri: ['#ff9ab8', '#b8e09c'] },
  },
  // The Grand Mochi Course's festival at dusk: the starter in Starry Night waving a red flag with a
  // firework on it; the squad in Disco Star, red and gold pom-poms, a "WASSHOI!" banner (the
  // festival shout).
  matsuri: {
    id: 'matsuri', starter: 'starry', seed: 10611, squad: 'disco', crew: [10711, 10723, 10737],
    flag: { cloth: '#e8485e', hem: '#ffd0d8', mark: 'firework' },
    pom: { shade: 'rgba(200,60,80,0.35)', outer: ['#ffffff', '#ff6a7a', '#ffd75e'], inner: ['#fff0c0', '#ff9aa8'], heart: '#fff4e0' },
    banner: { text: 'WASSHOI!', ink: '#d8384e', edge: '#ff9aa8', tri: ['#ff6a7a', '#ffd75e'] },
  },
  // The Grand Tour's royal progress: the starter a herald in the Study Buddy with the kingdom's
  // red flag; the squad by the finish in Berry Overalls, red and gold pom-poms, a "HURRAH!" banner.
  kingdom: {
    id: 'kingdom', starter: 'study', seed: 11011, squad: 'berry', crew: [11111, 11123, 11137],
    flag: { cloth: '#d8304a', hem: '#ffd0d8', mark: 'crown' },
    pom: { shade: 'rgba(200,40,70,0.35)', outer: ['#ffffff', '#e8405a', '#ffd75e'], inner: ['#fff0c0', '#ff9aa8'], heart: '#fff4e0' },
    banner: { text: 'HURRAH!', ink: '#c82a44', edge: '#ff9aa8', tri: ['#d8304a', '#ffd75e'] },
  },
};
const castOf = (map) => CASTS[map?.look?.cast ?? map?.look?.groundArt] ?? CASTS.sakura;
const STARTERS = {};
const starterOf = (C = CASTS.sakura) => (STARTERS[C.id] ??= { ...newRecord(rollMochi(C.seed, { coat: null })), dress: C.starter });
const FLAG_REST = [
  [0, { front: [3, -7], back: [-1.4, -1.4], pole: -0.55, tilt: -2 }],
  [1.3, { front: [3, -7.4], back: [-1.4, -1.4], pole: -0.5, tilt: 0, hy: 1.5 }],
  [2, { front: [3, -7], back: [-1.4, -1.4], pole: -0.5, tilt: -8, squat: 1, mouth: 'mochiw', sprout: 'happy' }],
  [2.25, { front: [4, -9], back: [-6, -6], pole: -0.35, tilt: -6, lift: 3, mouth: 'D', closed: [true, true], sprout: 'happy' }],
  [2.5, { front: [3, -7], back: [-1.4, -1.4], pole: -0.5, tilt: 4, squat: 1, mouth: 'D', closed: [true, true], sprout: 'happy' }],
  [2.75, { front: [4, -9], back: [-6, -6], pole: -0.35, tilt: -6, lift: 2, mouth: 'D', closed: [true, true], sprout: 'happy' }],
  [3.1, { front: [3, -7], back: [-1.4, -1.4], pole: -0.55, tilt: 2, mouth: 'mochiw', sprout: 'happy' }],
  [4.2, { front: [3, -7], back: [-1.4, -1.4], pole: -0.55, tilt: -2 }],
];
const FLAG_UP = [
  [0, { front: [3, -7], back: [-1.4, -1.4], pole: -0.55, tilt: -2 }],
  [0.35, { front: [3.5, -18], back: [-3, -5], pole: -0.06, tilt: -7, mouth: 'o', sprout: 'excited' }],
  [3.2, { front: [3.5, -18], back: [-3, -5], pole: -0.06, tilt: -7, mouth: 'o', sprout: 'excited' }],
];
const FLAG_GO = [
  [0, { front: [3.5, -18], back: [-3, -5], pole: -0.06, tilt: -7, mouth: 'o', sprout: 'excited' }],
  [0.12, { front: [11, -5], back: [-8, -9], pole: 0.85, tilt: 3, lift: 3.5, mouth: 'yell', closed: [true, true], sprout: 'excited' }],
  [0.3, { front: [11, 1], back: [-10, -12], pole: 1.35, tilt: 7, lift: 5, mouth: 'yell', closed: [true, true], sprout: 'excited' }],
  [0.55, { front: [10.5, -1], back: [-9, -11], pole: 1.2, tilt: 4, lift: 0, squat: 1, mouth: 'D', closed: [true, true], sprout: 'happy' }],
  [0.8, { front: [4, -17], back: [-9, -11], pole: -0.35, tilt: -4, lift: 3, mouth: 'D', closed: [true, true], sprout: 'happy' }],
  [1.1, { front: [8, -10], back: [-6, -4], pole: 0.6, tilt: 2, lift: 0, mouth: 'D', sprout: 'happy' }],
  [1.4, { front: [4, -17], back: [-9, -11], pole: -0.35, tilt: -4, lift: 2.5, mouth: 'D', closed: [true, true], sprout: 'happy' }],
  [1.7, { front: [8, -10], back: [-6, -4], pole: 0.6, tilt: 2, lift: 0, mouth: 'D', sprout: 'happy' }],
  [2, { front: [4, -17], back: [-9, -11], pole: -0.35, tilt: -4, lift: 2, mouth: 'D', closed: [true, true], sprout: 'happy' }],
  [2.3, { front: [8, -10], back: [-6, -4], pole: 0.6, tilt: 2, lift: 0, mouth: 'D', sprout: 'happy' }],
  [2.8, { front: [4, -16.5], back: [-1.4, -1.4], pole: -0.15, tilt: -2, mouth: 'mochiw', sprout: 'happy' }],
];
const FLAG_SWAY = [
  [0, { front: [4, -16.5], back: [-1.4, -1.4], pole: -0.15, tilt: -2, mouth: 'mochiw', sprout: 'happy' }],
  [1.6, { front: [5, -15], back: [-1.4, -1.4], pole: 0.3, tilt: -1, hy: 1.4, mouth: 'mochiw', sprout: 'happy' }],
  [3.2, { front: [4, -16.5], back: [-1.4, -1.4], pole: -0.15, tilt: -2, mouth: 'mochiw', sprout: 'happy' }],
];
// The flag: a pole through the paw (`hand`), `ang` from upright toward where it faces, the pink
// cloth near its top streaming back from the pole, rippling (faster the harder it's waved), a white
// blossom on it, a gold knob on top.
function flag(ctx, hand, ang, face, time, brisk, look = CASTS.sakura.flag) {
  const vx = Math.sin(ang) * face;
  const vy = -Math.cos(ang);
  const [hx, hy] = hand;
  const bx = hx - vx * 7;
  const by = hy - vy * 7;
  const tx = hx + vx * 30;
  const ty = hy + vy * 30;
  ctx.strokeStyle = '#7a5038';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  ctx.strokeStyle = '#c8945a';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(bx - vy * 0.4, by + vx * 0.4);
  ctx.lineTo(tx - vy * 0.4, ty + vx * 0.4);
  ctx.stroke();
  ctx.lineCap = 'butt';
  // The cloth: from just under the knob down the pole, streaming away behind it (`n`, square to the
  // pole on the side away from where it faces), rippling along its length.
  const nx = face * vy;
  const ny = -face * vx;
  const along = (u, w) => {
    const px = tx - vx * (2 + u * 13);
    const py = ty - vy * (2 + u * 13);
    const ripple = Math.sin(time * (brisk ? 12 : 6) - w * 4) * 1.8 * w;
    return [px + nx * w * 18 + vx * ripple, py + ny * w * 18 + vy * ripple];
  };
  const edge = [];
  for (let i = 0; i <= 6; i++) edge.push(along(0, i / 6));
  const low = [];
  for (let i = 6; i >= 0; i--) low.push(along(1, i / 6));
  ctx.fillStyle = look.cloth;
  ctx.beginPath();
  [...edge, ...low].forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = look.hem;
  ctx.beginPath();
  [...edge, ...edge.slice().reverse().map(([px, py]) => [px, py + 2.4])].forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.fill();
  const [mx, my] = along(0.5, 0.55);
  if (look.mark === 'ring') {
    // A little ring buoy, white with pink quarters, slowly turning.
    ctx.lineWidth = 1.6;
    for (let q = 0; q < 4; q++) {
      ctx.strokeStyle = q % 2 ? '#ff7fa6' : '#ffffff';
      ctx.beginPath();
      ctx.arc(mx, my, 2.4, (q / 4) * TAU + time * 0.3, ((q + 1) / 4) * TAU + time * 0.3);
      ctx.stroke();
    }
  } else if (look.mark === 'crown') {
    crownMark(ctx, mx, my, 4, '#ffd75e');
  } else if (look.mark === 'firework') {
    // A little firework: gold sparks bursting out, turning slowly.
    ctx.fillStyle = '#ffd75e';
    for (let q = 0; q < 8; q++) {
      const a = (q / 8) * TAU + time * 0.3;
      ctx.fillRect(mx + Math.cos(a) * 3.2 - 0.6, my + Math.sin(a) * 3.2 - 0.6, 1.2, 1.2);
      ctx.fillRect(mx + Math.cos(a) * 1.7 - 0.4, my + Math.sin(a) * 1.7 - 0.4, 0.8, 0.8);
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(mx - 0.7, my - 0.7, 1.4, 1.4);
  } else if (look.mark === 'dango') {
    // A dango on its skewer: pink, white and green, swaying with the cloth.
    ctx.strokeStyle = '#c8945a';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(mx, my - 4.8);
    ctx.lineTo(mx, my + 4.8);
    ctx.stroke();
    for (const [c, dy] of [['#ffb7cf', -2.7], ['#ffffff', 0], ['#e8f6d8', 2.7]]) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(mx, my + dy, 1.5, 0, TAU);
      ctx.fill();
    }
  } else if (look.mark === 'flake') {
    // A snowflake, white, slowly turning.
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.1;
    for (let q = 0; q < 3; q++) {
      const a = (q / 3) * Math.PI + time * 0.3;
      ctx.beginPath();
      ctx.moveTo(mx - Math.cos(a) * 3.4, my - Math.sin(a) * 3.4);
      ctx.lineTo(mx + Math.cos(a) * 3.4, my + Math.sin(a) * 3.4);
      ctx.stroke();
    }
  } else if (look.mark === 'leaf') {
    // A maple leaf, gold, slowly turning.
    ctx.fillStyle = '#fff0b8';
    ctx.beginPath();
    leafPts(mx, my, 3.4, time * 0.3).forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = '#ffffff';
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * TAU + time * 0.5;
      ctx.beginPath();
      ctx.arc(mx + Math.cos(a) * 2.1, my + Math.sin(a) * 2.1, 1.5, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd75e';
    ctx.beginPath();
    ctx.arc(mx, my, 1, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#ffd75e';
  ctx.beginPath();
  ctx.arc(tx + vx * 1.2, ty + vy * 1.2, 1.7, 0, TAU);
  ctx.fill();
}
function starter(ctx, map, x, gy, time) {
  const R = live(time) && RUN.map === map ? RUN.R : null;
  const mo = R ? momentsOf(R) : {};
  const goK = mo.go != null ? time - mo.go : -1;
  let keys = FLAG_REST;
  let t = time % 4.2;
  let brisk = false;
  if (R && R.phase === 'ready' && R.t >= introLen(R)) {
    keys = FLAG_UP;
    t = R.t - introLen(R);
    brisk = true;
  } else if (goK >= 0 && goK < 2.8) {
    keys = FLAG_GO;
    t = goK;
    brisk = true;
  } else if (goK >= 2.8) {
    keys = FLAG_SWAY;
    t = (goK - 2.8) % 3.2;
  }
  // (Facing back at the line until the runners are off and past; then turned to watch them go.)
  const face = goK > 0.7 ? 1 : -1;
  // (Each beat of the countdown, a little bob.)
  const ph = t % 1;
  const beat = keys === FLAG_UP && ph < 0.3 ? Math.sin((ph / 0.3) * Math.PI) * 1.4 : 0;
  const P = routine(keys, t);
  const pole = P.pole;
  const C = castOf(map);
  posed(ctx, starterOf(C), x, gy + beat, keys, t, {
    facing: face,
    hold: 'front',
    slot: `starter|${C.id}`,
    under: (c, hand) => flag(c, hand, pole, face, time, brisk, C.flag),
  });
}

// ---------- The cheer squad ----------
// Three Mochi behind the fence just before the finish, in the Sakura Glider costume (blossom
// wrapped): the two on the ends each hold up a pole in their near paw with the "GO! GO!" banner
// slung between the poles' tops, their free paws waving; the one in the middle runs a pom-pom
// routine, a big blossom pom-pom in each paw (pumping up one side then the other, both up with a
// jump, a shake at its chest), faster and bouncier the nearer the runners come; all turned to
// watch them go by.
const SQUADS = {};
const squadOf = (C = CASTS.sakura) => (SQUADS[C.id] ??= C.crew.map((s) => ({ ...newRecord(rollMochi(s, { coat: null })), dress: C.squad })));
// (Unhurried, each move eased in and held a moment before the next: 3.6 s round.)
const POMS = [
  [0, { front: [6, -3], back: [-6, -3], squat: 1, mouth: 'mochiw', sprout: 'happy' }],
  [0.3, { front: [6, -3.4], back: [-6, -3.4], mouth: 'mochiw', sprout: 'happy' }],
  [0.7, { front: [8, -14.5], back: [-6, -1], lift: 2.4, tilt: -5, mouth: 'D', sprout: 'excited' }],
  [1.05, { front: [8, -14.5], back: [-6, -1], lift: 1.6, tilt: -5, mouth: 'D', sprout: 'excited' }],
  [1.4, { front: [6, -3], back: [-6, -3], squat: 1, mouth: 'mochiw', sprout: 'happy' }],
  [1.8, { front: [6, -1], back: [-7.5, -14.5], lift: 2.4, tilt: 3, mouth: 'D', sprout: 'excited' }],
  [2.15, { front: [6, -1], back: [-7.5, -14.5], lift: 1.6, tilt: 3, mouth: 'D', sprout: 'excited' }],
  [2.5, { front: [6, -3], back: [-6, -3], squat: 1, mouth: 'mochiw', sprout: 'happy' }],
  [2.85, { front: [8.5, -15], back: [-8, -15], lift: 3.6, tilt: -3, mouth: 'yell', closed: [true, true], sprout: 'excited' }],
  [3.15, { front: [8.5, -15], back: [-8, -15], lift: 2.6, tilt: -3, mouth: 'D', closed: [true, true], sprout: 'excited' }],
  [3.4, { front: [3, -7], back: [-3, -7], squat: 1, mouth: 'D', closed: [true, true], sprout: 'happy' }],
  [3.6, { front: [6, -3], back: [-6, -3], squat: 1, mouth: 'mochiw', sprout: 'happy' }],
];
const BANNER = [
  [0, { front: [3, -17.5], back: [-8, -6], mouth: 'D', sprout: 'happy' }],
  [0.6, { front: [3, -17.5], back: [-8, -6], mouth: 'D', sprout: 'happy' }],
  [1.1, { front: [3, -18], back: [-10, -12], lift: 1.2, tilt: -3, mouth: 'D', closed: [true, true], sprout: 'excited' }],
  [1.6, { front: [3, -18], back: [-10, -12], lift: 0.6, tilt: -3, mouth: 'D', closed: [true, true], sprout: 'excited' }],
  [2.4, { front: [3, -17.5], back: [-8, -6], mouth: 'D', sprout: 'happy' }],
];
// The squad's own clock: running on at a pace that eases up a little as the runners come near (the
// routine's place is carried forward each frame, never worked out from the pace, which made it
// jump about whenever the pace changed).
const SQUAD_CLOCK = new Map();
function squadClock(wx, time, near) {
  let c = SQUAD_CLOCK.get(wx);
  if (!c) SQUAD_CLOCK.set(wx, (c = { t: 0, last: time, pace: 1 }));
  const dt = Math.max(0, Math.min(0.1, time - c.last));
  c.last = time;
  c.pace += (1 + near * 0.25 - c.pace) * (1 - Math.exp(-dt * 1.5));
  c.t += dt * c.pace;
  return c.t;
}
const SQUAD_FPS = 24;
// A blossom pom-pom: a puff of petal fronds in pinks and white round a pale heart, the fronds
// turning and shimmering as it's shaken.
function pomPom(ctx, x, y, time, seed, shake, P = CASTS.sakura.pom, k = 0.72) {
  const spin = time * (0.8 + shake * 1.2) + seed;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.translate(-x, -y);
  // (A soft rosy shade behind, so the white fronds read against a pale costume.)
  ctx.fillStyle = P.shade;
  ctx.beginPath();
  ctx.arc(x + 0.4, y + 0.6, 5.4, 0, TAU);
  ctx.fill();
  for (let ring = 0; ring < 2; ring++) {
    const n = ring ? 8 : 12;
    const r = ring ? 2.4 : 4.2;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + spin * (ring ? -0.6 : 1);
      const jit = Math.sin(time * 7 + k * 1.7 + seed) * 0.35 * shake;
      ctx.fillStyle = ring ? P.inner[k % 2] : P.outer[k % 3];
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * (r + jit), y + Math.sin(a) * (r + jit), 2.3, 1.35, a, 0, TAU);
      ctx.fill();
    }
  }
  ctx.fillStyle = P.heart;
  ctx.beginPath();
  ctx.arc(x, y, 1.4, 0, TAU);
  ctx.fill();
  ctx.restore();
}
// (Held just beyond the paw, out to its side and a touch up, so it frames the face, not hides it.)
const pomAt = (hand, flip, out) => [hand[0] + (flip ? -1 : 1) * out * 3.2, hand[1] - 2.4];
function squad(ctx, map, x, gy, wx, time) {
  const R = live(time) && RUN.map === map ? RUN.R : null;
  let near = 0;
  let side = -1;
  if (R) {
    for (const r of R.racers) {
      if (r.done != null) continue;
      const d = r.x - wx;
      near = Math.max(near, Math.max(0, 1 - Math.abs(d) / 520));
      if (Math.abs(d) < 60) side = d > 0 ? 1 : -1;
    }
    if (R.racers.every((r) => r.x > wx + 30)) side = 1;
  }
  const C = castOf(map);
  const crew = squadOf(C);
  const clock = squadClock(wx, time, near);
  const tops = [];
  // The two banner holders, their poles' tops kept for the banner.
  for (const [i, dx] of [[0, -26], [2, 26]]) {
    const t = (clock * 0.9 + i * 0.55) % 2.4;
    const lean = i === 0 ? -0.12 : 0.12;
    posed(ctx, crew[i], x + dx, gy + groundAt(map, wx + dx) - groundAt(map, wx), BANNER, t, {
      facing: side,
      hold: 'front',
      slot: `squad|${C.id}|${i}`,
      under: (c, hand) => {
        const vx = Math.sin(lean);
        const vy = -Math.cos(lean);
        const top = [hand[0] + vx * 26, hand[1] + vy * 26];
        c.strokeStyle = '#7a5038';
        c.lineWidth = 1.6;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(hand[0] - vx * 5, hand[1] - vy * 5);
        c.lineTo(top[0], top[1]);
        c.stroke();
        c.lineCap = 'butt';
        tops[i ? 1 : 0] = top;
      },
    }, SQUAD_FPS);
  }
  // The pom-pom routine in the middle, a pom-pom in each paw (the far one behind it).
  const t = clock % 3.6;
  const P = routine(POMS, Math.floor(t * SQUAD_FPS) / SQUAD_FPS);
  const shake = Math.min(1, Math.hypot(P.front[0] - 6, P.front[1] + 3) / 10 + near * 0.4);
  posed(ctx, crew[1], x, gy, POMS, t, {
    facing: side,
    slot: `squad|${C.id}|1`,
    under: (c, hand, flip) => pomPom(c, ...pomAt(hand, flip, -1), time, 1, shake, C.pom),
    over: (c, hand, flip, other) => pomPom(c, ...pomAt(other, flip, 1), time, 4, shake, C.pom),
  }, SQUAD_FPS);
  // The banner, slung between the poles' tops, sagging and rippling, "GO! GO!" on it.
  if (tops[0] && tops[1]) {
    const [a, b] = tops;
    const at = (u, dy) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + Math.sin(Math.PI * u) * 3 + Math.sin(time * 5 - u * 6) * 1.1 + dy];
    ctx.fillStyle = '#fff6ea';
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const [px, py] = at(i / 12, 1);
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    for (let i = 12; i >= 0; i--) {
      const [px, py] = at(i / 12, 11);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = C.banner.edge;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    for (let i = 1; i < 12; i += 2) {
      const [px, py] = at(i / 12, 11);
      ctx.fillStyle = C.banner.tri[i % 4 === 1 ? 0 : 1];
      ctx.beginPath();
      ctx.moveTo(px - 1.6, py);
      ctx.lineTo(px + 1.6, py);
      ctx.lineTo(px, py + 2.6);
      ctx.fill();
    }
    const [tx, ty] = at(0.5, 8.6);
    ctx.fillStyle = C.banner.ink;
    ctx.font = '900 6.5px Nunito, "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(C.banner.text, tx, ty);
    ctx.textAlign = 'left';
  }
}

// (For the pose sheet, tools/cast-sheet.html: one of the festival's cast at time `t` of a routine:
// the starter 'rest', 'up', 'go' or 'sway'; the squad's 'poms' or 'banner'.)
export function drawCastFrame(ctx, state, x, y, t, time, face = 1, cast = 'sakura') {
  const C = CASTS[cast] ?? CASTS.sakura;
  const STARTER_KEYS = { rest: FLAG_REST, up: FLAG_UP, go: FLAG_GO, sway: FLAG_SWAY };
  if (STARTER_KEYS[state]) {
    const keys = STARTER_KEYS[state];
    const pole = routine(keys, t).pole;
    posed(ctx, starterOf(C), x, y, keys, t, { facing: face, hold: 'front', under: (c, hand) => flag(c, hand, pole, face, time, state === 'up' || state === 'go', C.flag) });
  } else if (state === 'poms') {
    const P = routine(POMS, Math.floor(t * SQUAD_FPS) / SQUAD_FPS);
    const shake = Math.min(1, Math.hypot(P.front[0] - 6, P.front[1] + 3) / 10);
    posed(ctx, squadOf(C)[1], x, y, POMS, t, { facing: face, under: (c, hand, flip) => pomPom(c, ...pomAt(hand, flip, -1), time, 1, shake, C.pom), over: (c, hand, flip, other) => pomPom(c, ...pomAt(other, flip, 1), time, 4, shake, C.pom) }, SQUAD_FPS);
  } else if (state === 'pound' || state === 'turn' || state === 'hurray') {
    const [pp, qq] = poundersOf(500);
    const keys = state === 'pound' ? POUND : state === 'turn' ? TURN : HURRAY;
    const pole = routine(keys, t).pole;
    posed(ctx, state === 'turn' ? qq : pp, x, y, keys, t, { facing: face, hold: 'front', under: state === 'turn' ? undefined : (c, hand) => kine(c, hand, pole, face) });
  } else if (state === 'banner') {
    posed(ctx, squadOf(C)[0], x, y, BANNER, t, { facing: face, hold: 'front', under: (c, hand) => {
      c.strokeStyle = '#7a5038';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(hand[0], hand[1] + 5);
      c.lineTo(hand[0] - 3, hand[1] - 26);
      c.stroke();
    } });
  }
}

// In front of the runners (with the kicked petals): petals shaken from the trees, a soft shower of
// petals over the podium, and at golden hour a warm light over everything. (A swirl of petals round
// your Mochi on a Perfect cheer was taken out, 2026-11-13: too busy round its face.)
function drawFront2(ctx, map, R, cam, time) {
  const PET = map.look.petals ?? PETALS;
  for (const p of FALLS) {
    if (p.age < 0) continue;
    ctx.save();
    ctx.globalAlpha = Math.min(1, p.age * 4, (p.life - p.age) * 2);
    ctx.translate(p.x - cam.x, p.y - cam.y);
    ctx.rotate(p.rot);
    if (map.look.leaves) place(ctx, leafArt(p.c, true), 0, 4.5);
    else {
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.ellipse(0, 0, 2, 1.1 * Math.abs(Math.cos(p.age * 5 + p.phase)) + 0.35, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
  if (R.phase === 'done' && R.t > 1.4 && R.t < 12 && map.look.waterArt === 'lake') {
    // (Lily Lake's: bubbles rising round the podium, wobbling, popping at the top in a little ring.)
    const course = map.race;
    const cx = course.finish + PODIUM.x - cam.x;
    const gy = groundAt(map, course.finish + PODIUM.x) - cam.y;
    ctx.save();
    for (let i = 0; i < 34; i++) {
      const h = hash(i * 2.71 + 3);
      const period = 2.6 + h * 1.6;
      const u = ((R.t - 1.4 + h * period) % period) / period;
      const px = cx + (hash(i * 5.3) - 0.5) * 150 + Math.sin(u * TAU * 1.5 + h * 7) * 4;
      const py = gy + 6 - u * 130;
      const r = 1.4 + hash(i * 3.7) * 2.4;
      const fade = Math.min(1, (R.t - 1.4) * 2, (12 - R.t) * 0.5);
      if (u > 0.92) {
        const k = (u - 0.92) / 0.08;
        ctx.globalAlpha = (1 - k) * fade;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(px, py, r + k * 3, 0, TAU);
        ctx.stroke();
        continue;
      }
      ctx.globalAlpha = Math.min(1, u * 8) * fade;
      ctx.fillStyle = 'rgba(200,240,255,0.3)';
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - r * 0.5, py - r * 0.55, Math.max(0.8, r * 0.4), Math.max(0.8, r * 0.3));
    }
    ctx.restore();
  } else if (R.phase === 'done' && R.t > 1.4 && R.t < 12) {
    const course = map.race;
    const cx = course.finish + PODIUM.x - cam.x;
    const gy = groundAt(map, course.finish + PODIUM.x) - cam.y;
    for (let i = 0; i < 40; i++) {
      const h = hash(i * 2.71 + 3);
      const period = 3.2 + h * 1.6;
      if ((map.look.leaves || map.look.calm) && i % 2) continue;
      const u = ((R.t - 1.4 + h * period) % period) / period;
      const px = cx + (hash(i * 5.3) - 0.5) * 150 + Math.sin(u * TAU + h * 7) * 8;
      const py = gy - 130 + u * 140;
      ctx.save();
      ctx.globalAlpha = Math.min(1, u * 6, (1 - u) * 5, (R.t - 1.4) * 2, (12 - R.t) * 0.5);
      ctx.translate(px, py);
      ctx.rotate(u * 9 + h * 5);
      if (map.look.leaves) place(ctx, leafArt(PET[i % PET.length]), 0, 6.5);
      else if (map.look.flakes) place(ctx, flakeArt(), 0, 4);
      else if (map.look.confetti) {
        // (The Grand Tour's: red and gold paper confetti, each scrap turning as it falls.)
        ctx.fillStyle = PET[i % PET.length];
        ctx.fillRect(-2.2, -1.4 * Math.abs(Math.cos(R.t * 3 + i)), 4.4, 2.8 * Math.abs(Math.cos(R.t * 3 + i)) + 0.5);
      } else if (map.look.sparks) {
        // (The festival's: sparkler sparks, little four-point twinkles drifting down.)
        const tw = 0.6 + 0.4 * Math.sin(R.t * 14 + i * 2.3);
        ctx.fillStyle = PET[i % PET.length];
        ctx.fillRect(-0.6, -2 * tw, 1.2, 4 * tw);
        ctx.fillRect(-2 * tw, -0.6, 4 * tw, 1.2);
      } else if (map.look.sprinkles) {
        // (Long Hill Run's: candy sprinkles tumbling down.)
        ctx.fillStyle = PET[i % PET.length];
        ctx.fillRect(-2, -0.65, 4, 1.3);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillRect(-1.4, -0.65, 2, 0.5);
      }
      else {
        ctx.fillStyle = PET[i % PET.length];
        ctx.beginPath();
        ctx.ellipse(0, 0, 2.2, 1.2 * Math.abs(Math.cos(u * 12 + h * 4)) + 0.35, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }
  const w = goldenOf(map.night ?? 0);
  if (w > 0.01) {
    const vw = 640 / (R.cam?.zoom ?? 1);
    const vh = 360 / (R.cam?.zoom ?? 1);
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = `rgba(255,170,90,${0.45 * w})`;
    ctx.fillRect(-10, -10, vw + 20, vh + 20);
    ctx.restore();
  }
}

const COURSES = {};
// Sakura Sprint's far plane.
COURSES.sakura = {
  far(ctx, t, cam, width, y0, time) {
    const air = t.sky[1];
    goldenSky(ctx, width, y0, goldenOf(RUN.map?.night ?? 0));
    clouds(ctx, cam, width, time, t.face === 'moon');
    // The mountain: one, far off, barely moving.
    // (On the left, clear of the sun.)
    mountain(ctx, 130 - cam.x * 0.03, y0 + 2, 300, 92, air);
    // The far hills, then the nearer ones with their groves, the pagoda and the torii.
    hills(ctx, cam, width, y0 - 4, 30, 0.05, 1.3, mix('#cdeccf', air, 0.45), mix('#e6f6e4', air, 0.4));
    const near = hills(ctx, cam, width, y0 + 18, 36, 0.1, 4.2, mix('#b2e2b8', air, 0.32), mix('#d8f2d0', air, 0.25));
    repeat(cam.x, 0.1, 74, width, (i, x) => {
      if (hash(i * 1.9 + 3) < 0.35) return;
      const gx = x + hash(i * 5.1) * 30;
      grove(ctx, gx, near(gx) + 3, i, air);
    });
    const pg = 560 - cam.x * 0.1;
    place(ctx, pagodaArt(), pg, near(pg) + 6);
    const to = 180 - cam.x * 0.1;
    place(ctx, toriiArt(), to, near(to) + 4);
    return true;
  },
  // The middle plane: a soft meadow, blossom trees standing in loose groups (never in a row), and
  // under some of them a hanami picnic.
  mid(ctx, t, cam, width, y0, time) {
    const air = t.sky[1];
    const meadow = hills(ctx, cam, width, y0 + 6, 10, 0.45, 7.7, mix('#a6dca8', air, 0.18), mix('#c8ecbc', air, 0.14));
    // (Where your Mochi is on screen, for the picnickers and stallkeepers to follow.)
    const youX = live(time) ? RUN.you.x - cam.x : null;
    const stallAt = (tx) => STALLS.some((st) => Math.abs(tx + cam.x * 0.45 - st.at) < 84);
    repeat(cam.x, 0.45, 104, width, (i, x) => {
      const s = hash(i * 2.3 + 1);
      if (s < 0.3) return;
      const tx = x + hash(i * 1.1) * 46;
      if (stallAt(tx)) return;
      const foot = meadow(tx) + 3;
      const wx = tx + cam.x * 0.45;
      // (A picnic sits up on a little grassy rise under its tree, out in the meadow.)
      const party = s > 0.78;
      if (party) {
        ctx.fillStyle = mix('#a6dca8', air, 0.14);
        ctx.beginPath();
        ctx.ellipse(tx + 18, foot + 6, 46, 13, 0, Math.PI, TAU);
        ctx.fill();
        ctx.strokeStyle = mix('#7cc488', air, 0.12);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(tx + 18, foot + 6, 46, 13, 0, Math.PI * 1.04, Math.PI * 1.96);
        ctx.stroke();
        ctx.strokeStyle = mix('#d4f2c8', air, 0.1);
        ctx.beginPath();
        ctx.ellipse(tx + 18, foot + 7.2, 44, 12, 0, Math.PI * 1.2, Math.PI * 1.7);
        ctx.stroke();
      }
      drawTree(ctx, tx, foot - (party ? 5 : 0), Math.floor(hash(i * 4.9) * 7), 0, time, wx);
      petals(ctx, tx, foot - 70, foot, 70, 3, time, i, 0.8);
      if (party) picnic(ctx, tx + 22, foot - 6, i, time, youX, s > 0.88);
    });
    // The festival stalls, by the finish.
    for (const st of STALLS) {
      const sx = st.at - cam.x * 0.45;
      if (sx < -80 || sx > width + 80) continue;
      stall(ctx, st, sx, meadow(sx) + 4, time, youX);
    }
    return true;
  },
};

// ---------- Lily Lake Swim ('course:lake'; its redraw, 2026-11-13) ----------
// A summer swimming gala on a lotus lake. Far off, blue mountains and a red arched bridge over an
// inlet on the green hills; across the water, the far shore's weeping willows trailing their fronds
// in the breeze, hydrangeas in bloom, a waterfall pouring down a rocky bluff (a rainbow over it once
// yours is home), a boathouse on its stilts and a little island pavilion, and Mochi out in rowboats
// to watch, bobbing (cheering as yours swims by). On the course: a jetty behind the start, a lane
// rope of floats across the lake (bobbing in the swimmers' wash), floating quarter buoys (fountains
// leaping as yours passes), clumps of lily pads with lotus and buds beyond the rope, rocked as the
// swimmers pass (ripples and a wake behind each swimmer, a splash as each dives in, a shake-off
// climbing out), waterweed swaying on the sandy bed with the lotus stems rising from it, and parasols
// on the beaches.
const WILLOW = { body: '#8ccf86', top: '#b6e6a0', deep: '#5ea86c' };
// The waterfall on the far shore: a rocky bluff (round boulders in soft lilac greys, a grassy cap,
// ferns at its sides, a shadowed cleft down its middle) with the water pouring over its lip and down
// the cleft, streaks running down it, mist billowing up where it meets the lake.
const fallsArt = () => art('mc-falls', 80, 68, () => {
  const rocks = [[16, 50, 13, 13], [64, 50, 13, 13], [24, 32, 13, 15], [56, 32, 13, 15], [40, 52, 19, 12], [40, 22, 15, 12], [12, 60, 9, 5], [68, 60, 9, 5]];
  return [
    ...rocks.map(([x, y, rx, ry]) => E(x, y, rx, ry, '#b9b0cc')),
    ...rocks.map(([x, y, rx, ry]) => F(E(x - rx * 0.25, y - ry * 0.3, rx * 0.55, ry * 0.45, '#d4cce2'))),
    E(18, 24, 8, 4.5, '#8fd08a'), E(62, 24, 8, 4.5, '#8fd08a'),
    E(40, 12, 23, 6, '#8fd08a'), F(E(34, 10.4, 13, 3, '#b8e6a0')),
    E(9, 44, 5, 4.5, '#7cc47a'), E(71, 42, 5, 4.5, '#7cc47a'), F(E(8, 42.6, 2.6, 1.8, '#a6dc90')), F(E(70, 40.6, 2.6, 1.8, '#a6dc90')),
    F(R(34, 14, 12, 52, '#9a92b0')),
    // (Little flowers in the grass on top and at its shoulders.)
    ...[[24, 9.6, '#ffb8cc'], [29, 7.4, '#ffffff'], [51, 8.4, '#ffd75e'], [56, 10.6, '#ffb8cc'], [14, 22.4, '#ffffff'], [64, 22, '#ffb8cc'], [8, 41.6, '#ffd6e2'], [72, 39.6, '#ffffff']].map(([x, y, c]) => F(E(x, y, 1.4, 1.2, c))),
  ];
});
function falls(ctx, x, foot, time, air, k) {
  place(ctx, fallsArt(), snap(x), foot + 3);
  const top = foot - 51;
  const w = 12;
  ctx.fillStyle = mix('#dff6ff', air, 0.12);
  ctx.fillRect(x - w / 2, top, w, foot - top);
  ctx.fillStyle = mix('#ffffff', air, 0.08);
  ctx.beginPath();
  ctx.ellipse(x, top, w / 2 + 1.2, 1.8, 0, 0, TAU);
  ctx.fill();
  for (let s = 0; s < 5; s++) {
    const sx = x - w / 2 + 1.2 + s * 2.2;
    const off = (time * (34 + s * 6) + s * 5) % 9;
    for (let y = top - 9 + off; y < foot; y += 9) {
      const y0 = Math.max(top, y);
      ctx.fillRect(sx, y0, 0.9, Math.min(4.5, foot - y0));
    }
  }
  for (let i = 0; i < 8; i++) {
    const u = (time * 0.45 + i / 8) % 1;
    ctx.globalAlpha = (1 - u) * 0.75;
    ctx.beginPath();
    ctx.arc(x + (i - 3.5) * 3.6 + Math.sin(time + i) * 1.4, foot - u * 11, 2.6 + u * 4, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.ellipse(x, foot + 1, 11, 2.2, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  // (Once yours is home: a rainbow arching over the spray.)
  rainbow(ctx, x, foot + 8, k, air);
}
// A red arched bridge, far off: a high curving deck, its rail and posts.
const bridgeArt = () => art('mc-bridge', 64, 26, () => {
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const u = i / 16;
    pts.push([2 + u * 60, 21 - Math.sin(u * Math.PI) * 12]);
  }
  const out = [T([...pts, ...pts.slice().reverse().map(([x, y]) => [x, y + 4])], '#e8607a')];
  const rail = pts.map(([x, y]) => [x, y - 6]);
  out.push(T([...rail, ...rail.slice().reverse().map(([x, y]) => [x, y + 1.6])], '#e8607a'));
  for (let i = 0; i <= 16; i += 2) {
    const [x, y] = pts[i];
    out.push(F(R(x - 0.6, y - 6, 1.2, 6, '#c84860')));
  }
  out.push(R(2, 19, 3, 7, '#c84860'), R(59, 19, 3, 7, '#c84860'));
  return out;
});
// A weeping willow: a soft green dome on a slim trunk (its fronds drawn live, `willow`).
const willowArt = (v) => art(`mc-willow|${v}`, 84, 78, () => {
  const out = trunk(42, 76, 40, 3.4, v + 11);
  const j = (k) => (hash(v * 2.3 + k) - 0.5) * 4;
  const blobs = [[42 + j(1), 26, 26, 15], [25 + j(2), 32, 16, 11], [59 + j(3), 32, 16, 11], [42 + j(4), 17, 18, 11]];
  for (const [x, y, rx, ry] of blobs) out.push(F(E(x, y, rx + 1, ry + 1, shade(WILLOW.deep, -16))));
  for (const [x, y, rx, ry] of blobs) out.push(F(E(x, y, rx, ry, WILLOW.body)));
  out.push(F(E(42, 36, 24, 5, WILLOW.deep)));
  for (const [x, y, rx, ry] of blobs) out.push(F(E(x - rx * 0.25, y - ry * 0.32, rx * 0.55, ry * 0.4, WILLOW.top)));
  return out;
});
// A willow with its fronds: a dozen strands hanging from under the dome, leaves along them, each
// swaying on its own a beat after the one beside it, more at the tips.
function willow(ctx, x, foot, v, time, wx, air) {
  place(ctx, willowArt(v), snap(x), foot + 2);
  const base = foot + 2 - 78 + 36;
  const leaf = mix(WILLOW.top, air, 0.18);
  for (let i = 0; i < 13; i++) {
    const u0 = i / 12;
    const sx = x - 30 + u0 * 60 + (hash(v * 3 + i) - 0.5) * 4;
    const len = 20 + hash(v + i * 1.7) * 16 - Math.abs(u0 - 0.5) * 10;
    const sy = base + Math.sin(u0 * Math.PI) * 2;
    const pts = [[sx, sy]];
    for (let k = 1; k <= 6; k++) {
      const u = k / 6;
      const sway = (Math.sin(time * 1.3 + i * 0.6 + wx * 0.01 - u * 1.4) * 2.2 + (windAt(time, wx) - 0.5) * 3) * u * u;
      pts.push([sx + sway, sy + len * u]);
    }
    ctx.strokeStyle = mix(i % 2 ? '#78c078' : '#94d48c', air, 0.18);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    pts.forEach(([px, py], k) => (k ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.stroke();
    ctx.fillStyle = leaf;
    for (let k = 2; k <= 6; k += 2) {
      const [px, py] = pts[k];
      ctx.beginPath();
      ctx.ellipse(px + 0.8, py, 1.4, 0.8, 0.9, 0, TAU);
      ctx.fill();
    }
  }
}
// A hydrangea bush in bloom: a leafy mound with big round heads of florets, blue, lilac and pink.
const HYDRANGEA = ['#9fb8ff', '#c8a8f0', '#ffb8d8'];
const hydrangeaArt = (v) => art(`mc-hydrangea|${v}`, 34, 22, () => {
  const out = [F(E(17, 21, 15, 2, '#6fae6e')), E(17, 15, 15, 7, '#7cc47a'), F(E(13, 12, 7, 3.4, '#a6dc90'))];
  for (let k = 0; k < 3; k++) {
    const cx = 8 + k * 9 + (hash(v + k) - 0.5) * 3;
    const cy = 11 - (k === 1 ? 3 : 0);
    const c = HYDRANGEA[(v + k) % HYDRANGEA.length];
    out.push(E(cx, cy, 5.2, 4.6, c));
    for (let d = 0; d < 6; d++) {
      const a = (d / 6) * TAU + k;
      out.push(F(E(cx + Math.cos(a) * 2.6, cy + Math.sin(a) * 2.2, 1.2, 1.1, mix(c, '#ffffff', 0.45))));
    }
  }
  return out;
});
// A boathouse on stilts at the water's edge: cream boards, a red roof, a round window, a door onto
// its little dock.
const boathouseArt = () => art('mc-boathouse', 60, 48, () => [
  ...[8, 20, 40, 52].map((x) => R(x, 30, 2, 18, '#8a6a50')),
  R(4, 30, 52, 3, '#b88658'), F(R(4, 30, 52, 1, '#d8a878')),
  R(10, 14, 40, 16, '#fff2e0'), F(R(10, 14, 2, 16, '#e8d8c4')),
  ...[16, 22, 28, 34, 40].map((x) => F(R(x, 15, 0.8, 14, '#eadcc8'))),
  T([[6, 15], [30, 2], [54, 15]], '#e8607a'), F(T([[10, 15], [30, 5], [50, 15]], '#ff8fa0')), F(R(6, 14, 48, 1.4, '#c84860')),
  E(30, 10, 3, 3, '#bfe8ff'), F(E(29, 9.2, 1.1, 1.1, '#ffffff')),
  R(36, 20, 7, 10, '#c8945a'), F(E(41.5, 25.5, 0.6, 0.6, '#ffd75e')),
  R(42, 30, 16, 2.4, '#b88658'),
]);
// A little island with a pavilion: a grassy mound, six red posts under a green roof that curls up
// at its corners.
const pavilionArt = () => art('mc-pavilion', 52, 45, () => [
  E(26, 42, 24, 2.6, '#8fd08a'), F(E(21, 40.4, 12, 1.6, '#b8e6a0')),
  ...[13, 21, 31, 39].map((x) => R(x, 23, 1.8, 17, '#e8607a')),
  R(10, 38, 32, 2.4, '#d8c0b0'),
  T([[5, 24], [11, 19], [41, 19], [47, 24], [42, 22.4], [10, 22.4]], '#5fae7a'),
  T([[11, 19], [26, 9], [41, 19]], '#6fc08a'), F(T([[15, 19], [26, 11.4], [37, 19]], '#8fd8a0')),
  F(R(25.4, 4, 1.2, 6, '#c8945a')), F(E(26, 4, 1.6, 1.6, '#ffd75e')),
]);
// A rowboat: a wooden hull with a white stripe, oars shipped.
const rowboatArt = (v) => art(`mc-rowboat|${v}`, 44, 14, () => [
  T([[1, 3], [43, 3], [38, 12], [6, 12]], v ? '#e8a060' : '#d88a58'), F(R(3, 5, 38, 1.6, '#ffffff')),
  F(T([[6, 12], [38, 12], [37, 10.6], [7, 10.6]], v ? '#c88048' : '#b8704a')), F(R(2, 3, 40, 1, '#f4c890')),
  F(T([[30, 1], [44, 9], [43, 10], [29, 2]], '#b88658')),
]);
// (As yours swims by, `youX` on screen, the two in it turn to it and jump up cheering, over and
// over, rocking the boat.)
function rowboat(ctx, x, y, v, time, youX = null) {
  const near = youX != null && Math.abs(youX - x) < 90;
  const bob = Math.sin(time * 1.4 + v * 2) * 1.1;
  const tilt = Math.sin(time * (near ? 2.6 : 1.1) + v) * (near ? 0.06 : 0.03);
  pivoted(ctx, x, y, tilt, () => {
    const pool = picnickers();
    for (let k = 0; k < 2; k++) {
      const h = hash(v * 3.1 + k * 7.3);
      const period = near ? 0.85 + h * 0.2 : 3.2 + h * 2;
      const len = near ? period : 1;
      const into = (time + h * 11) % period;
      const beat = into < len ? CHEER_SEQ[Math.min(CHEER_SEQ.length - 1, Math.floor((into / len) * CHEER_SEQ.length))] : 0;
      const mx = x - 8 + k * 14;
      const facing = near ? (youX < mx ? -1 : 1) : k ? -1 : 1;
      ctx.save();
      ctx.translate(mx, y - 3 + bob - (into < len ? Math.sin((Math.PI * into) / len) * (near ? 2 : 1.2) : 0));
      ctx.scale(0.56, 0.56);
      drawSpectator(ctx, pool[(v * 3 + k * 5) % pool.length], 0, 0, beat, facing, `boat|${v}|${k}`);
      ctx.restore();
    }
    place(ctx, rowboatArt(v % 2), snap(x), y + 6 + bob);
  });
}
// The far water: little glints sliding along it.
function farGlints(ctx, cam, width, top, time) {
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (let i = 0; i < 26; i++) {
    const h = hash(i * 4.1);
    const x = ((h * width * 1.6 - cam.x * 0.45 + time * (4 + h * 4)) % (width + 40) + width + 40) % (width + 40) - 20;
    const y = top + 4 + hash(i * 2.3) * 26;
    const a = Math.max(0, Math.sin(time * (1.5 + h) + i));
    ctx.globalAlpha = a * 0.8;
    ctx.fillRect(x, y, 3 + h * 4, 0.9);
  }
  ctx.globalAlpha = 1;
}
const LAKE_SPOTS = { boathouse: 760, island: 380, boats: [600, 1180], falls: 1110 };

// ---------- Lily Lake: lilies, splashes, fountains ----------
// A lily pad seen from the shore: a round leaf foreshortened to a flat oval, its notch cut toward
// one side (`flip`), a paler heart and veins running out from it, the darker lip of its edge showing
// under it. (Integer radius `r`, so a handful of drawings serve the whole lake.)
const padArt = (r, flip) => art(`mc-pad|${r}|${flip}`, r * 2 + 6, Math.ceil(r * 0.7) + 6, () => {
  const cx = r + 3;
  const ry = r * 0.34;
  const cy = ry + 2.5;
  const notch = flip ? Math.PI - 0.55 : 0.55;
  const leaf = (rx, ryy, dy) => {
    const out = [[cx, cy + dy]];
    for (let k = 0; k <= 28; k++) {
      const a = notch + 0.3 + (k / 28) * (TAU - 0.6);
      out.push([cx + Math.cos(a) * rx, cy + dy + Math.sin(a) * ryy]);
    }
    return out;
  };
  const vein = (a) => {
    const ex = cx + Math.cos(notch + a) * r * 0.82;
    const ey = cy + Math.sin(notch + a) * ry * 0.82;
    return F(T([[cx, cy - 0.15], [ex, ey], [ex + 0.5, ey + 0.2], [cx, cy + 0.35]], '#94d890'));
  };
  return [
    T(leaf(r, ry, 1.1), '#3f9460'),
    T(leaf(r, ry, 0), '#5cbc74'),
    F(T(leaf(r * 0.74, ry * 0.66, -0.3), '#72ca82')),
    ...[1.0, 2.0, 3.1, 4.2, 5.25].map(vein),
    F(E(cx - r * 0.38, cy - ry * 0.32, r * 0.28, ry * 0.2, '#b4eab0')),
  ];
});
// (How far below a pad's middle its drawing's foot is.)
const padFoot = (r) => Math.ceil(r * 0.7) + 6 - (r * 0.34 + 2.5);
// A lotus in bloom: pointed petals in two rows (the back ones pale, the front ones deeper pink) and
// a gold heart showing between.
const lotusArt = () => art('mc-lotus', 22, 15, () => {
  const petal = (ang, len, wid, c, by = 13) => {
    const bx = 11;
    const tx = bx + Math.sin(ang) * len;
    const ty = by - Math.cos(ang) * len;
    const nx = Math.cos(ang) * wid;
    const ny = Math.sin(ang) * wid;
    const mx = bx + (tx - bx) * 0.45;
    const my = by + (ty - by) * 0.45;
    return T([[bx - nx * 0.5, by - ny * 0.5], [mx - nx, my - ny], [tx, ty], [mx + nx, my + ny], [bx + nx * 0.5, by + ny * 0.5]], c);
  };
  return [
    petal(-1.15, 7, 2.1, '#ffd6e4'), petal(1.15, 7, 2.1, '#ffd6e4'),
    petal(-0.55, 8.6, 2.3, '#ffc4d8'), petal(0.55, 8.6, 2.3, '#ffc4d8'),
    petal(0, 9.6, 2.5, '#ffe6ef'),
    F(E(11, 8.6, 2.4, 1.3, '#ffd75e')), F(E(10.4, 8.2, 0.9, 0.5, '#fff2b8')),
    petal(-0.8, 6, 2.1, '#ff9fbc', 13.4), petal(0.8, 6, 2.1, '#ff9fbc', 13.4), petal(0, 5.4, 2.3, '#ffb0c8', 13.4),
  ];
});
// A lotus bud, closed and pointed, on its short green stalk.
const budArt = () => art('mc-lilybud', 10, 14, () => [
  R(4.4, 7, 1.3, 7, '#4f9a5c'),
  T([[5, 1.5], [7.8, 5.6], [6.8, 8.6], [3.2, 8.6], [2.2, 5.6]], '#ff9fbc'),
  F(T([[5, 2.6], [6.4, 5.8], [5.4, 8], [4.6, 8], [3.8, 5.8]], '#ffc4d8')),
  F(T([[3.2, 8.6], [5, 7.2], [6.8, 8.6], [5, 9.6]], '#6cc47e')),
]);

// Water thrown up: drops arcing and falling (into the lake with a little ring, or onto the sand,
// where each leaves a wet spot that dries), the crown of a racer diving in, the rings.
const DROPS = [];
const CROWNS = [];
const RINGS = [];
const WET = [];
// (`c`: a pebble of that colour, not a drop of water.)
const drop = (x, y, vx, vy, life = 1.2, c = null) => DROPS.push({ x, y, vx, vy, age: 0, life, c });
function waterUnder(map, x) {
  return (map.water ?? []).find((w) => x > w.x1 && x < w.x2) ?? null;
}
function stepDrops(map, dt, time) {
  for (const p of DROPS) {
    p.age += dt;
    p.vy += 240 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.vy <= 0) continue;
    const w = waterUnder(map, p.x);
    if (w && p.y >= w.y) {
      p.age = p.life;
      if (RINGS.length < 40) RINGS.push({ x: p.x, y: w.y, t: time });
    } else if (!w && p.y >= groundAt(map, p.x)) {
      p.age = p.life;
      if (!p.c && WET.length < 60) WET.push({ x: p.x, y: groundAt(map, p.x), t: time, r: 1.2 + Math.random() * 1.4 });
    }
  }
  for (let i = DROPS.length - 1; i >= 0; i--) if (DROPS[i].age >= DROPS[i].life) DROPS.splice(i, 1);
  if (DROPS.length > 260) DROPS.splice(0, DROPS.length - 260);
  for (const L of [CROWNS, RINGS, WET]) {
    const keep = L === WET ? 3 : 0.8;
    for (let i = L.length - 1; i >= 0; i--) if (time - L[i].t > keep || L[i].t > time + 0.5) L.splice(i, 1);
  }
}
// Each frame of a lake race: a racer diving in throws up a crown and a burst of drops, one climbing
// out shakes itself off and drips for a moment after; a fountain at each quarter buoy yours has just
// passed throws spray off its top.
function noteLake(map, R, mo, dt, time) {
  for (const r of R.racers) {
    const was = r.caMode;
    r.caMode = r.m.mode;
    if (R.phase !== 'run' || !was || was === r.m.mode) {
      if (r.caOut != null && time - r.caOut < 1.4 && Math.random() < dt * 7) drop(r.x - 2 + Math.random() * 4, r.y - 6 - Math.random() * 8, (Math.random() - 0.5) * 8, 10);
      continue;
    }
    if (r.m.mode === 'swim') {
      const w = waterUnder(map, r.x + 6) ?? waterUnder(map, r.x - 6);
      const y = w ? w.y : r.y;
      CROWNS.push({ x: r.x + 4, y, t: time, big: r.you, seed: r.x });
      for (let k = 0, n = r.you ? 20 : 12; k < n; k++) drop(r.x + 4 + (Math.random() - 0.4) * 10, y - 1, (Math.random() - 0.35) * 80, -60 - Math.random() * 90);
    } else if (was === 'swim') {
      r.caOut = time;
      for (let k = 0; k < 14; k++) {
        const s = k % 2 ? 1 : -1;
        drop(r.x + s * (3 + Math.random() * 4), r.y - 8 - Math.random() * 12, s * (35 + Math.random() * 45), -30 - Math.random() * 45, 0.9);
      }
    }
  }
  for (const [kind, wx] of map.townPieces ?? []) {
    if (kind !== 'mr_buoy' || mo.buoys?.[wx] == null) continue;
    const k = time - mo.buoys[wx];
    if (k < 0.15 || k > 1.0) continue;
    const w = waterUnder(map, wx);
    const H = jetHeight(k);
    for (const s of [-1, 1]) if (Math.random() < 0.55) drop(wx + s * (8 + 0.14 * H), (w?.y ?? 0) - H, s * (12 + Math.random() * 34), -20 - Math.random() * 30, 1.1);
  }
}
// A buoy fountain's height `k` seconds after yours passed: it leaps up, holds a moment, falls away.
const jetHeight = (k) => 46 * (k < 0.3 ? 1 - (1 - k / 0.3) ** 3 : k < 0.9 ? 1 + Math.sin((k - 0.3) * 18) * 0.04 : Math.max(0, 1 - ((k - 0.9) / 0.8) ** 1.4));
// The fountain: a wavering column of water, tapering up to a crown of spray.
function jet(ctx, x, y, k, lean, seed, time) {
  if (k < 0 || k > 1.7) return;
  const H = jetHeight(k);
  if (H < 1) return;
  const a = k < 1.2 ? 1 : Math.max(0, 1 - (k - 1.2) / 0.5);
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10;
    pts.push([x + lean * H * u + Math.sin(time * 13 + u * 7 + seed) * 0.9 * u, y - H * u, 4 - u * 1.9]);
  }
  ctx.save();
  ctx.globalAlpha = 0.8 * a;
  ctx.fillStyle = '#bfeefa';
  ctx.beginPath();
  pts.forEach(([px, py, w], i) => (i ? ctx.lineTo(px - w, py) : ctx.moveTo(px - w, py)));
  for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0] + pts[i][2], pts[i][1]);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#7ccbe8';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.globalAlpha = 0.95 * a;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i ? ctx.lineTo(px - 0.6, py) : ctx.moveTo(px - 0.6, py)));
  ctx.stroke();
  const [tx, ty] = pts[10];
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 7; i++) {
    const ang = -Math.PI / 2 + (i - 3) * 0.45;
    const d = 1.5 + ((time * 5 + i * 0.37 + seed) % 1) * 5;
    ctx.beginPath();
    ctx.arc(tx + Math.cos(ang) * d, ty + Math.sin(ang) * d * 0.6 + d * 0.5, 1.2, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
// A racer diving in: a crown of water rising round it in tapering spikes, each with a bead at its
// tip, opening out and falling back, and a ring of foam spreading.
function splashCrown(ctx, x, y, k, big, seed) {
  const n = big ? 9 : 7;
  const H = big ? 17 : 12;
  const rise = Math.sin(Math.min(1, k) * Math.PI);
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, (1 - k) * 2.5));
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1) - 0.5;
    const h = H * rise * (0.6 + 0.4 * hash(seed + i * 1.7)) * (1 - Math.abs(u) * 0.7);
    const bx = x + u * (10 + k * 14);
    const tip = bx + u * 12 * k;
    ctx.fillStyle = i % 2 ? '#ffffff' : '#d8f6ff';
    ctx.beginPath();
    ctx.moveTo(bx - 1.8, y);
    ctx.quadraticCurveTo(bx - 0.5, y - h * 0.6, tip, y - h);
    ctx.quadraticCurveTo(bx + 0.5, y - h * 0.6, bx + 1.8, y);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(tip, y - h - 1.2, 1.1, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = Math.max(0, 1 - k) * 0.9;
  ctx.beginPath();
  ctx.ellipse(x, y + 1, 6 + k * 22, 1.6 + k * 2.6, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
}
// In front of the racers: the drops, the crowns, the little rings where drops fall back in.
function drawDrops(ctx, cam, time) {
  ctx.save();
  for (const c of CROWNS) splashCrown(ctx, c.x - cam.x, c.y - cam.y, (time - c.t) / 0.6, c.big, c.seed);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.8;
  for (const g of RINGS) {
    const k = (time - g.t) / 0.5;
    if (k < 0 || k > 1) continue;
    ctx.globalAlpha = (1 - k) * 0.8;
    ctx.beginPath();
    ctx.ellipse(g.x - cam.x, g.y - cam.y + 0.5, 1.5 + k * 5, 0.5 + k * 1, 0, 0, TAU);
    ctx.stroke();
  }
  for (const p of DROPS) {
    ctx.globalAlpha = Math.max(0, Math.min(1, (1 - p.age / p.life) * 3));
    if (p.c) {
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x - cam.x, p.y - cam.y, 1.3, 0, TAU);
      ctx.fill();
      continue;
    }
    ctx.save();
    ctx.translate(p.x - cam.x, p.y - cam.y);
    ctx.rotate(Math.atan2(p.vy, p.vx));
    ctx.fillStyle = 'rgba(70,160,210,0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 0.3, 2.1, 1.25, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 0, 1.7, 0.95, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
// Behind the racers, on the sand: the wet spots the drops left, drying.
function drawWet(ctx, cam, time) {
  for (const s of WET) {
    const k = (time - s.t) / 3;
    if (k < 0 || k > 1) continue;
    ctx.fillStyle = `rgba(176,128,84,${0.4 * (1 - k)})`;
    ctx.beginPath();
    ctx.ellipse(s.x - cam.x, s.y - cam.y + 1, s.r * 1.6, s.r * 0.5, 0, 0, TAU);
    ctx.fill();
  }
}
// The waterfall's rainbow, once yours is home: bands of colour arching over the falls' foot,
// fading in, soft in the haze.
const RAINBOW = ['#ff9fb8', '#ffc48a', '#fff09a', '#a8eaa0', '#9fd8ff', '#c8b0f8'];
function rainbow(ctx, x, y, k, air) {
  if (k <= 0) return;
  ctx.save();
  ctx.globalAlpha = 0.5 * k;
  ctx.lineWidth = 2.2;
  RAINBOW.forEach((c, i) => {
    ctx.strokeStyle = mix(c, air, 0.25);
    ctx.beginPath();
    ctx.arc(x, y, 46 - i * 2.2, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
  });
  ctx.restore();
}

// ---------- Lily Lake on the water ----------
// The lily pads and lotus on the lake: where each sits (from the lake's own seed), so the stems on
// the bed and the pads on the surface match.
function lilySpots(w, map) {
  if (w._lilies) return w._lilies;
  // (None right by a quarter buoy.)
  const buoys = (map?.townPieces ?? []).filter(([k]) => k === 'mr_buoy').map(([, x]) => x);
  const piers = (map?.townPieces ?? []).filter(([k]) => k === 'mr_pier').map(([, x, e]) => [x - 10, e.to + 24]);
  const out = [];
  for (let x = w.x1 + 46; x < w.x2 - 40; x += 46) {
    const h = hash(x * 0.71 + 3);
    if (h < 0.3) continue;
    const lx = x + (hash(x * 1.3) - 0.5) * 18;
    if (buoys.some((b) => Math.abs(b - lx) < 36) || piers.some(([a, b]) => lx > a && lx < b)) continue;
    // A clump: its main pad, and up to two smaller ones beside it.
    const r = 6 + Math.floor(hash(x * 2.7) * 3);
    const pads = [[0, r, hash(x * 3.1) < 0.5 ? 1 : 0]];
    for (let k = 0, n = Math.floor(hash(x * 4.3) * 3); k < n; k++) {
      const side = k ? -1 : 1;
      pads.push([side * (r + 2 + hash(x * 5.9 + k) * 5), Math.max(4, r - 2 - Math.floor(hash(x * 6.7 + k) * 2)), hash(x * 7.3 + k) < 0.5 ? 1 : 0]);
    }
    out.push({ x: lx, r, pads, kind: h > 0.72 ? 'lotus' : h > 0.6 ? 'bud' : 'pad', seed: x });
  }
  return (w._lilies = out);
}
// How far a swimmer going by nudges a pad at world x (+ away from it), and how much it dips.
function lilyNudge(wx, time) {
  if (!live(time)) return [0, 0];
  let dx = 0;
  let dip = 0;
  for (const r of RUN.racers) {
    if (r.mode !== 'swim') continue;
    const d = wx - r.x;
    const a = Math.abs(d);
    if (a > 34) continue;
    const k = (1 - a / 34) ** 2;
    dx += Math.sign(d || 1) * k * 8;
    dip += k * 1.6;
  }
  return [Math.max(-10, Math.min(10, dx)), Math.min(2.4, dip)];
}
function lakeBed(ctx, map, w, cam, time, x0, x1) {
  if (w.kind !== 'lotus') return;
  // Waterweed swaying up off the sandy bed, in two greens, here and there.
  for (let x = Math.floor(x0 / 26) * 26; x < x1; x += 26) {
    const h = hash(x * 0.37 + 9);
    if (h < 0.35) continue;
    const by = groundAt(map, x) - cam.y;
    const n = 2 + Math.floor(h * 3);
    for (let k = 0; k < n; k++) {
      const sx = x - cam.x + k * 3 - n;
      const len = 8 + hash(x + k) * 16;
      ctx.strokeStyle = k % 2 ? 'rgba(80,170,120,0.75)' : 'rgba(110,196,130,0.75)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(sx, by);
      for (let s = 1; s <= 5; s++) {
        const u = s / 5;
        ctx.lineTo(sx + Math.sin(time * 1.4 + x * 0.05 + k - u * 2) * 2.4 * u, by - len * u);
      }
      ctx.stroke();
    }
  }
  // Smooth stones in little heaps on the bed, moss on the odd one, and here and there a lost toy.
  for (let x = Math.floor(x0 / 90) * 90; x < x1; x += 90) {
    const h = hash(x * 0.53 + 21);
    if (h < 0.3) continue;
    const bx = x + hash(x * 1.9) * 50;
    if (bx < w.x1 + 40 || bx > w.x2 - 40) continue;
    const v = Math.floor(hash(x * 3.3) * 12);
    place(ctx, bedArt(v < 6 ? v : v % 4), snap(bx - cam.x), groundAt(map, bx) - cam.y + 2);
  }
  // The pier's posts and its ladder going on down through the water, faint in it.
  for (const [kind, wx, extra] of map.townPieces ?? []) {
    if (kind !== 'mr_pier') continue;
    const len = extra.to - wx;
    const left = Math.round(wx - 2 - cam.x);
    if (left > x1 - cam.x || left + len < x0 - cam.x) continue;
    const top = w.y - cam.y;
    ctx.fillStyle = 'rgba(110,84,64,0.32)';
    for (let x = 4; x < len; x += 20) {
      const px = wx - 2 + x;
      if (px < w.x1) continue;
      ctx.fillRect(left + x, top, 3, groundAt(map, px + 1.5) - cam.y - top);
    }
    const lx = 4 + Math.floor((len - 30) / 20) * 20 + 7;
    const deck = groundAt(map, wx) - cam.y - PIER_UP;
    const end = deck + 32;
    ctx.fillStyle = 'rgba(214,226,232,0.45)';
    ctx.fillRect(left + lx, top, 1.6, end - top);
    ctx.fillRect(left + lx + 7, top, 1.6, end - top);
    for (let y = deck + 10; y < end; y += 6) if (y > top) ctx.fillRect(left + lx + 1, y, 6.4, 1.2);
  }
  // The lily stems, rising from the bed to their pads in a soft S, swaying.
  ctx.strokeStyle = 'rgba(96,170,120,0.32)';
  ctx.lineWidth = 1;
  for (const l of lilySpots(w, map)) {
    const lx = l.x - cam.x;
    if (lx < -30 || lx > x1 - cam.x + 30) continue;
    const [nx] = lilyNudge(l.x, time);
    const top = w.y - cam.y + swell(l.x, time) + 2;
    const by = groundAt(map, l.x) - cam.y;
    const d = by - top;
    ctx.beginPath();
    ctx.moveTo(lx, by);
    ctx.bezierCurveTo(lx + 5 + Math.sin(time * 0.8 + l.seed) * 2, by - d * 0.35, lx - 5 + Math.sin(time * 0.6 + l.seed) * 3, by - d * 0.7, lx + nx + Math.sin(time * 0.4 + l.seed) * 2, top);
    ctx.stroke();
  }
  // Bubbles streaming up behind each swimmer, wobbling, popping at the top.
  if (live(time) && RUN.map === map) {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 0.7;
    const top = w.y - cam.y;
    RUN.racers.forEach((r, i) => {
      if (r.mode !== 'swim') return;
      for (let k = 0; k < 5; k++) {
        const p = (time * 0.8 + k * 0.2 + i * 0.37) % 1;
        const bx = r.x - cam.x - 7 - p * 16 + Math.sin(time * 5 + k * 2 + i) * 1.2;
        const by = top + 16 - p * 13;
        ctx.beginPath();
        ctx.arc(bx, by, 0.7 + (k % 3) * 0.45 + p * 0.4, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
    });
  }
}
// On the lake bed (`v`): a heap of smooth stones (0-3, the odd one mossy), a toy sailboat lying on
// its side, or a little pink pail tipped over; all in the water's soft tint.
const bedArt = (v) => art(`mc-bed|${v}`, 44, 17, () => {
  if (v === 4) {
    return [
      T([[11, 16], [31, 16], [34, 12], [9, 12]], '#d890a8'), F(R(11, 12, 22, 1, '#eab0c0')),
      R(20, 5, 1.2, 8, '#c8a888'), F(T([[21.2, 5], [31, 10.4], [21.2, 10.4]], '#e8f4f0')), F(R(20.4, 4, 3, 1.4, '#ffd75e')),
    ];
  }
  if (v === 5) {
    return [
      T([[13, 11], [13, 16], [28, 16.4], [28, 7]], '#e8a0b8'), F(T([[14, 11.4], [14, 12.6], [27, 10.4], [27, 8.4]], '#f6c4d4')),
      E(28, 11.8, 2, 4.8, '#c87896'), F(E(28.4, 11.8, 1, 3.4, '#a8607c')),
      F(R(10, 13.6, 3, 1, '#d88aa4')),
    ];
  }
  const out = [];
  const tones = ['#8fbcbc', '#a8ccc4', '#7eaab4', '#b8d4c8'];
  const n = 2 + (v % 3);
  for (let k = 0; k < n; k++) {
    const cx = 13 + k * 6 + hash(v * 7 + k) * 3;
    const rx = 4 + hash(v * 3 + k) * 3;
    const ry = 2.4 + hash(v * 5 + k) * 1.6;
    out.push(E(cx, 16 - ry, rx, ry, tones[(v + k) % tones.length]), F(E(cx - rx * 0.3, 16 - ry * 1.5, rx * 0.4, ry * 0.3, '#d4ecea')));
  }
  if (v === 1 || v === 3) out.push(F(E(15, 16 - 5, 3.4, 1.2, '#6fae86')), F(E(17, 16 - 5.6, 1.6, 0.8, '#8fd0a0')));
  return out;
});
WATER_BED.push(lakeBed);
// On the water, over its skin: the pads and lotus (bobbing on the swell, drifting aside from any
// swimmer going by and dipping as its wake lifts them), and ripples ringing out round each swimmer.
function lakeSurface(ctx, map, w, cam, time, x0, x1, at) {
  if (w.kind !== 'lotus' && w.kind !== 'dusk' && w.kind !== 'moat') return;
  if (!live(time) || RUN.map !== map) return;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  for (const r of RUN.racers) {
    if (r.mode !== 'swim' || r.x < w.x1 || r.x > w.x2) continue;
    for (let i = 0; i < 2; i++) {
      const u = (time * 1.1 + i / 2 + r.x * 0.003) % 1;
      ctx.globalAlpha = (1 - u) * 0.7;
      ctx.beginPath();
      ctx.ellipse(r.x - cam.x - 4, at(r.x) + 1, 7 + u * 18, 1.4 + u * 2.4, 0, 0, TAU);
      ctx.stroke();
    }
    // Its wake: two arms of foam spreading back from it (the far one up the water, the near one
    // down it), longer the faster it swims, the foam flecks streaming back along them.
    const len = 30 + Math.min(1, r.sp / 70) * 30;
    ctx.fillStyle = '#ffffff';
    for (const arm of [-1, 1]) {
      for (let i = 0; i < 9; i++) {
        const u = (i + ((time * 2.4) % 1)) / 9;
        const bx = r.x - 9 - u * len;
        ctx.globalAlpha = (1 - u) * (arm < 0 ? 0.55 : 0.8);
        ctx.beginPath();
        ctx.ellipse(bx - cam.x, at(bx) + 0.8 + arm * u * (arm < 0 ? 2.6 : 3.6) + Math.sin(i * 2.3 + time * 7) * 0.3, 2.4 - u * 1.3, 0.7, 0, 0, TAU);
        ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1;
}
WATER_LIFE.push(lakeSurface);
// Behind the swimmers, after the water (render/race.js): the lane rope of floats across the lake,
// bobbing on the swell and dipping as a swimmer passes, and the floating quarter buoys, their
// plaques and balloons above (the water's skin laps over the lower half of each, so they float).
const FLOATS = ['#ff8fb0', '#ffffff', '#ffd75e', '#ffffff'];
function lakeBehind(ctx, map, R, cam, time) {
  const w = (map.water ?? []).find((x) => x.kind === 'lotus');
  if (!w) return;
  const vw = 640 / (R.cam?.zoom ?? 1);
  const x0 = Math.max(w.x1 + 14, cam.x - 10);
  const x1 = Math.min(w.x2 - 14, cam.x + vw + 10);
  const at = (x) => w.y - cam.y + swell(x, time) - 1;
  // Wet spots on the sand from the drops.
  drawWet(ctx, cam, time);
  // The lilies, out beyond the lane rope (drawn first, so its floats pass in front of them): pads in
  // little clumps, a lotus or a bud standing up from some; drifting a touch on the swell and rocked
  // by the swimmers' wash going by.
  for (const l of lilySpots(w, map)) {
    const lx = l.x - cam.x;
    if (lx < -40 || lx > vw + 40) continue;
    const [nx, dip] = lilyNudge(l.x, time);
    const drift = Math.sin(time * 0.4 + l.seed) * 1.5 + nx * 0.35;
    for (let i = l.pads.length - 1; i >= 0; i--) {
      const [dx, r, flip] = l.pads[i];
      place(ctx, padArt(r, flip), snap(lx + dx + drift), at(l.x + dx) - 5 + dip * 0.35 + padFoot(r));
    }
    const fy = at(l.x) - 5 + dip * 0.35;
    const rock = Math.sin(time * 1.3 + l.seed) * 0.05 + nx * 0.006;
    if (l.kind === 'lotus') pivoted(ctx, lx + drift, fy, rock, () => place(ctx, lotusArt(), snap(lx + drift), fy + 1.5));
    else if (l.kind === 'bud') pivoted(ctx, lx + drift + 1, fy, rock * 1.6, () => place(ctx, budArt(), snap(lx + drift + 1), fy + 1));
  }
  if (x1 > x0) {
    ctx.strokeStyle = '#e8eef4';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 4) (x === x0 ? ctx.moveTo(x - cam.x, at(x) - 1.5) : ctx.lineTo(x - cam.x, at(x) - 1.5));
    ctx.stroke();
    for (let x = Math.ceil(x0 / 8) * 8; x <= x1; x += 8) {
      const [, dip] = lilyNudge(x, time);
      const fx = x - cam.x;
      // (Pushed down by a swimmer's wash and bobbing back up, rocking as it settles.)
      const fy = at(x) - 1.5 + dip * 1.1 - Math.sin(time * 9 + x * 0.35) * dip * 0.45;
      const c = FLOATS[(x / 8) % FLOATS.length];
      ctx.fillStyle = shade(c, -30);
      ctx.beginPath();
      ctx.ellipse(fx, fy + 0.4, 3.2, 2.2, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(fx - 0.2, fy, 2.8, 1.9, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(fx - 1.6, fy - 1.2, 1.4, 0.7);
    }
  }
  // The quarter buoys.
  const mo = momentsOf(R);
  for (const [kind, wx, n] of map.townPieces ?? []) {
    if (kind !== 'mr_buoy') continue;
    const bx = wx - cam.x;
    if (bx < -60 || bx > vw + 60) continue;
    // (Set back beyond the swim lane, by the rope, so the swimmers pass in front of it.)
    const by = at(wx) - 3 + Math.sin(time * 1.3 + wx) * 0.6;
    const k = mo.buoys?.[wx] != null ? time - mo.buoys[wx] : -1;
    const hop = k > 0 && k < 0.45 ? Math.sin((k / 0.45) * Math.PI) * 4 : 0;
    const tilt = Math.sin(time * 1.1 + wx * 0.01) * 0.05;
    // (As yours goes by: a fountain leaps up from each side of it.)
    jet(ctx, bx - 8, by, k, -0.14, wx, time);
    jet(ctx, bx + 8, by, k - 0.08, 0.14, wx + 3, time);
    pivoted(ctx, bx, by, tilt, () => {
      balloons(ctx, bx, by - 63 - hop, time, wx, k);
      place(ctx, signArt(true), snap(bx), by - 3 - hop);
      ctx.fillStyle = '#c8607e';
      ctx.font = '900 8px Nunito, "Trebuchet MS", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${n ?? 1}/4`, bx, by - 53.2 - hop);
      ctx.textAlign = 'left';
      // The float: a red-and-white ring buoy.
      ctx.fillStyle = '#e8506e';
      ctx.beginPath();
      ctx.ellipse(bx, by, 8.6, 3.6, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(bx + s * 5.5, by - 0.2, 2.2, 2.9, 0, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(bx - 4.3, by - 2.9, 5, 0.8);
    });
    confetti(ctx, bx, by - 67, k, wx, 30, -Math.PI / 2, 2.2);
  }
  // Cattails and reeds at both banks, swaying.
  for (const [ex, dir] of [[w.x1, 1], [w.x2, -1]]) {
    const sx = ex - cam.x;
    if (sx < -40 || sx > vw + 40) continue;
    for (let i = 0; i < 7; i++) {
      const rx = sx + dir * (4 + i * 3.2);
      const h = 12 + hash(ex + i) * 12;
      const lean = (Math.sin(time * 1.2 + i * 0.9 + ex * 0.01) * 1.6 + (windAt(time, ex) - 0.6) * 2) * dir;
      const by = w.y - cam.y + 4;
      ctx.strokeStyle = i % 2 ? '#5aa868' : '#4f9a5e';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(rx, by);
      ctx.quadraticCurveTo(rx, by - h * 0.6, rx + lean, by - h);
      ctx.stroke();
      if (i === 1 || i === 4 || i === 6) {
        ctx.fillStyle = '#9a6a4a';
        ctx.beginPath();
        ctx.ellipse(rx + lean, by - h - 2, 1.5, 3.2, 0, 0, TAU);
        ctx.fill();
      }
    }
  }
}
// (How far its deck stands above the shore.)
const PIER_UP = 12;
// The pier: planks out over the water on posts, a ring buoy hanging on a post, two tall poles with
// bunting between them.
const pierArt = (len) => art(`mc-pier|${len}`, len + 4, 120, () => {
  const out = [];
  for (let x = 4; x < len; x += 20) out.push(R(x, 64, 3, 56, '#8a6a50'), F(R(x + 2, 64, 1, 56, '#6a4a38')));
  // A steel ladder down into the water off its end, between two posts.
  const lx = 4 + Math.floor((len - 30) / 20) * 20 + 7;
  out.push(R(lx, 56, 1.6, 34, '#b8c4cc'), R(lx + 7, 56, 1.6, 34, '#b8c4cc'));
  for (let y = 68; y < 90; y += 6) out.push(F(R(lx + 1, y, 6.4, 1.2, '#dce6ec')));
  out.push(R(0, 58, len + 4, 6, '#c8945a'), F(R(0, 58, len + 4, 1.6, '#e2b47a')), F(R(0, 63, len + 4, 1, '#9a6a40')));
  for (let x = 6; x < len; x += 9) out.push(F(R(x, 58.6, 0.8, 4.6, '#a87a48')));
  // The posts at the end, the ring buoy on the far one.
  out.push(R(len - 6, 36, 3.4, 24, '#b88658'), F(E(len - 4.3, 36, 2.4, 1.4, '#ff9ec0')));
  out.push(E(len - 4.3, 48, 6, 6, '#e8506e'), F(E(len - 4.3, 48, 3, 3, '#c8945a')), F(E(len - 4.3, 48, 2.2, 2.2, '#c8945a')));
  for (const a of [0.6, 2.2, 3.8, 5.4]) out.push(F(E(len - 4.3 + Math.cos(a) * 4.5, 48 + Math.sin(a) * 4.5, 1.6, 1.6, '#ffffff')));
  return out;
});
// A beach parasol in candy stripes over a towel, a little bucket and spade by it.
const parasolArt = (v) => art(`mc-parasol|${v}`, 48, 50, () => {
  const [a, b] = v ? ['#8fd3ff', '#ffffff'] : ['#ff8fb0', '#ffffff'];
  const out = [F(E(26, 49, 18, 1.6, '#e8d0a0')), T([[10, 46], [40, 46], [42, 49], [8, 49]], v ? '#ffd75e' : '#9fe0a0'), F(R(12, 47, 28, 0.8, '#ffffff'))];
  out.push(R(23.4, 12, 1.6, 36, '#ffffff'), F(R(24.6, 12, 0.4, 36, '#d8d0c8')));
  for (let k = 0; k < 6; k++) {
    const u0 = k / 6;
    const u1 = (k + 1) / 6;
    out.push(T([[24, 4], [2 + u0 * 44, 16 - Math.sin(u0 * Math.PI) * 6], [2 + u1 * 44, 16 - Math.sin(u1 * Math.PI) * 6]], k % 2 ? a : b));
  }
  for (let k = 0; k <= 6; k++) out.push(F(E(2 + (k / 6) * 44, 16 - Math.sin((k / 6) * Math.PI) * 6 + 1, 2.2, 1.4, k % 2 ? b : a)));
  out.push(F(E(24, 4, 1.4, 1.4, '#ffd75e')));
  out.push(T([[38, 41], [44, 41], [43, 47], [39, 47]], '#ff9ec0'), F(R(37.6, 40.4, 6.8, 1, '#e8708e')), F(R(44, 36, 0.8, 8, '#c8945a')), F(T([[43, 35], [46.4, 35], [45.4, 37.6], [44, 37.6]], '#8fd3ff')));
  return out;
});

COURSES.lake = {
  far(ctx, t, cam, width, y0, time) {
    const air = t.sky[1];
    goldenSky(ctx, width, y0, goldenOf(RUN.map?.night ?? 0));
    clouds(ctx, cam, width, time, t.face === 'moon');
    hills(ctx, cam, width, y0 - 4, 62, 0.04, 2.2, mix('#93b6e2', air, 0.42), mix('#d0e2f6', air, 0.35));
    const near = hills(ctx, cam, width, y0 + 16, 30, 0.08, 5.1, mix('#86c8a8', air, 0.32), mix('#c4ecc8', air, 0.28));
    repeat(cam.x, 0.08, 64, width, (i, x) => {
      if (hash(i * 2.7 + 5) < 0.4) return;
      const gx = x + hash(i * 3.3) * 26;
      const gy = near(gx) + 3;
      for (let k = 0; k < 4; k++) {
        const r = 5 + hash(i * 5 + k) * 4;
        ctx.fillStyle = mix(k % 2 ? '#78b890' : '#8ec8a0', air, 0.35);
        ctx.beginPath();
        ctx.arc(gx + (k - 1.5) * 7, gy - r * 0.6 - (k % 2) * 2, r, 0, TAU);
        ctx.fill();
      }
    });
    const bx = 640 - cam.x * 0.08;
    place(ctx, bridgeArt(), bx, near(bx) + 6);
    return true;
  },
  mid(ctx, t, cam, width, y0, time) {
    const air = t.sky[1];
    const shore = y0 - 22;
    const land = hills(ctx, cam, width, shore + 4, 5, 0.45, 3.3, mix('#9ad8a0', air, 0.18), mix('#cbf0c2', air, 0.12));
    // The far water, glinting, from under the far shore down.
    const g = ctx.createLinearGradient(0, shore + 6, 0, shore + 60);
    g.addColorStop(0, mix('#bdf0ea', air, 0.2));
    g.addColorStop(1, mix('#7fd4dc', air, 0.15));
    ctx.fillStyle = g;
    ctx.fillRect(0, shore + 6, width, 400);
    ctx.fillStyle = mix('#ffffff', air, 0.1);
    ctx.fillRect(0, shore + 6, width, 1);
    farGlints(ctx, cam, width, shore + 6, time);
    // The waterfall, and its rainbow once yours is home.
    const fx = LAKE_SPOTS.falls - cam.x * 0.45;
    if (fx > -90 && fx < width + 90) {
      const mo = live(time) && RUN.map?.look?.waterArt === 'lake' ? momentsOf(RUN.R) : null;
      falls(ctx, fx, land(fx) + 6, time, air, mo?.home != null ? Math.min(1, (time - mo.home) / 2.5) : 0);
    }
    // The island pavilion and the rowboats out on the water.
    const youX = live(time) && RUN.map?.look?.waterArt === 'lake' ? RUN.you.x - cam.x : null;
    const ix = LAKE_SPOTS.island - cam.x * 0.45;
    if (ix > -60 && ix < width + 60) place(ctx, pavilionArt(), ix, shore + 26 + Math.sin(time * 0.6) * 0.3);
    LAKE_SPOTS.boats.forEach((at, v) => {
      const rx = at - cam.x * 0.45 + Math.sin(time * 0.25 + v * 2) * 6;
      if (rx > -50 && rx < width + 50) rowboat(ctx, rx, shore + 30 + v * 8, v, time, youX);
    });
    // Along the far shore: willows in loose groups, hydrangeas between, the boathouse.
    repeat(cam.x, 0.45, 118, width, (i, x) => {
      const s = hash(i * 2.9 + 4);
      const tx = x + hash(i * 1.7) * 40;
      const wx = tx + cam.x * 0.45;
      if (Math.abs(wx - LAKE_SPOTS.boathouse) < 70 || Math.abs(wx - LAKE_SPOTS.falls) < 75 || Math.abs(wx + 38 - LAKE_SPOTS.falls) < 60) return;
      if (s > 0.35) willow(ctx, tx, land(tx) + 2, Math.floor(hash(i * 3.9) * 6), time, wx, air);
      if (s < 0.75) place(ctx, hydrangeaArt(((i % 3) + 3) % 3), tx + 38, land(tx + 38) + 4);
    });
    const hx = LAKE_SPOTS.boathouse - cam.x * 0.45;
    if (hx > -70 && hx < width + 70) place(ctx, boathouseArt(), hx, shore + 22);
    return true;
  },
};

// The grass edge of the lake's beaches (`look.edges` 'lake'): tufts of beach grass bowing in the
// breeze (and away from the runners), little pink sea-thrift flowers, and shells and pebbles lying
// on the sand.
EDGE_KINDS.lake = (ctx, along, time, seed, width, camX) => {
  const tufts = [];
  const blooms = [];
  const shells = [];
  along(9, (x, y, k) => {
    if (x < -10 || x > width + 10) return;
    const h = hash(k * 2.3 + seed * 7);
    const w = windAt(time, x + camX);
    const sway = Math.sin(time * 2 + (x + camX) * 0.06) * 0.6 * (0.5 + w) + w * 1.3 + pushAt(x + camX, time);
    if (h < 0.3) tufts.push([x, y, sway, h]);
    else if (h < 0.42) blooms.push([x, y, sway, h]);
    else if (h < 0.62) shells.push([x, y, h, k]);
  });
  for (const [c, lw, f] of [['#8cc070', 1.3, 1], ['#bfe090', 0.9, 0.7]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const [x, y, sway, h] of tufts) {
      for (const [dx, hh] of [[-1.8, 6], [0, 9], [1.8, 6.6]]) {
        const tall = (hh + h * 4) * f;
        ctx.moveTo(x + dx, y);
        ctx.quadraticCurveTo(x + dx + sway * 0.3, y - tall * 0.6, x + dx * 1.6 + sway * (0.8 + h), y - tall);
      }
    }
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  for (const [x, y, sway, h] of blooms) {
    const tx = x + sway;
    const ty = y - 5 - h * 6;
    ctx.strokeStyle = '#7cb46a';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.fillStyle = '#ff9fbc';
    ctx.beginPath();
    ctx.arc(tx, ty, 2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffd0e0';
    ctx.beginPath();
    ctx.arc(tx - 0.6, ty - 0.6, 0.9, 0, TAU);
    ctx.fill();
  }
  for (const [x, y, h] of shells) {
    if (h < 0.52) {
      ctx.fillStyle = h < 0.47 ? '#ffe2e6' : '#fff6ee';
      ctx.beginPath();
      ctx.moveTo(x - 2.4, y);
      ctx.quadraticCurveTo(x, y - 3.4, x + 2.4, y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f0b8c0';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - 2.4);
      ctx.stroke();
    } else {
      ctx.fillStyle = h < 0.57 ? '#d8e8f0' : '#f0e0c8';
      ctx.beginPath();
      ctx.ellipse(x, y - 0.6, 1.8, 1.1, 0, 0, TAU);
      ctx.fill();
    }
  }
};

// ---------- Hanami picnics ----------
// A gingham blanket on the grass (seen side-on: a soft folded strip in pink and cream checks), a
// little wicker hamper, a thermos, and two or three Mochi on it, each on its own beat, swaying and
// now and then hopping up to cheer the race on (the crowd's own drawings: render/mochi-anim.js).
let PICNICKERS = null;
const picnickers = () => (PICNICKERS ??= Array.from({ length: 12 }, (_, i) => newRecord(rollMochi(9300 + i * 211, { coat: null }))));
const blanketArt = (v) => art(`mc-blanket|${v}`, 60, 20, () => {
  const c = v % 2 ? '#b8e2f4' : '#ffc4d4';
  // (Spread on the grass and seen a little from above: a wide trapezoid, its far edge narrower,
  // checked both ways, a soft fold along the front. Drawn 6 down, room over it for the hamper.)
  const out = [T([[1, 19], [9, 9], [51, 9], [59, 19]], '#fff6ee')];
  for (let k = 0; k < 7; k++) out.push(F(T([[9 + k * 6, 9], [12 + k * 6, 9], [11 + k * 7.2 - 6.4, 19], [7.6 + k * 7.2 - 6.4, 19]], c)));
  out.push(F(T([[6, 12.4], [54, 12.4], [55.4, 14.2], [4.6, 14.2]], mix(c, '#ffffff', 0.25))), F(T([[3, 16.4], [57, 16.4], [58, 18], [2, 18]], mix(c, '#ffffff', 0.25))));
  out.push(F(R(2, 19, 56, 1, '#e8d0c8')));
  // The hamper and its lid, and a thermos.
  out.push(R(40, 5, 10, 6, '#d8a060'), F(R(40, 7, 10, 1, '#b07a40')), T([[41, 5], [44, 1], [46, 1], [49, 5]], '#d8a060'), F(E(45, 4.6, 4.2, 1, '#ffd6e0')));
  out.push(R(9, 3, 3.4, 7, '#ffffff'), F(R(9, 3, 3.4, 1.6, c)));
  return out;
});
const CHEER_SEQ = [1, 2, 3, 3, 2, 1];
// (They watch the race: turned toward your Mochi, `youX` on screen; as it goes by they jump up
// cheering, over and over, then settle back to the odd cheer. One of them may be flying a kite.)
function picnic(ctx, x, y, seed, time, youX = null, flying = false) {
  place(ctx, blanketArt(seed), snap(x), y + 2);
  const pool = picnickers();
  const n = 2 + (hash(seed * 3.3) < 0.5 ? 1 : 0);
  for (let k = 0; k < n; k++) {
    const h = hash(seed * 7.1 + k * 2.9);
    const g = pool[Math.floor(hash(seed * 1.7 + k * 5.3) * pool.length)];
    const mx = x - 13 + k * 11;
    const near = youX != null && Math.abs(youX - mx) < 80;
    const period = near ? 0.85 + h * 0.2 : 3 + h * 2.4;
    const len = near ? period : 1;
    const into = (time + h * 13) % period;
    const beat = into < len ? CHEER_SEQ[Math.min(CHEER_SEQ.length - 1, Math.floor((into / len) * CHEER_SEQ.length))] : 0;
    const hop = into < len ? Math.sin((Math.PI * into) / len) * (near ? 2.6 : 1.8) : 0;
    const sway = Math.sin(time * (1.4 + h) + h * 20) * 0.4;
    const facing = youX != null ? (youX < mx ? -1 : 1) : h < 0.5 ? -1 : 1;
    ctx.save();
    ctx.translate(mx + sway, y - hop);
    ctx.scale(0.64, 0.64);
    drawSpectator(ctx, g, 0, 0, flying && k === 0 ? 0 : beat, facing, `picnic|${seed}|${k}`);
    ctx.restore();
  }
  if (flying) kite(ctx, x - 13 + 3, y - 11, seed, time);
}

// ---------- Track-side pieces ----------
// The festival fence: a low post every so often (wood, a pink-capped top), a soft rope swagged
// between them, and on every fourth, a taller pole carrying a line of bunting high over the runners'
// heads, the little flags fluttering one after another as the breeze runs along them.
const FLAGS = ['#ff9ec0', '#ffd75e', '#8fd3ff', '#9fe0a0', '#c8a8f0', '#ffffff'];
const POST = 46;
const postArt = (tall) => art(`mc-post|${tall}`, 10, tall ? 50 : 22, () => {
  const h = tall ? 50 : 22;
  return [F(E(5, h - 0.6, 4.4, 1.3, '#7ab872')), R(3.2, 4, 3.6, h - 4, '#d8a878'), F(R(5.6, 4, 1.4, h - 4, '#b88658')), E(5, 3.6, 3, 2.6, '#ff9ec0'), F(E(4.2, 2.8, 1.2, 0.9, '#ffd6e2'))];
});
function fence(ctx, map, wx, to, cam, width, time) {
  const posts = [];
  for (let px = wx; px <= to; px += POST) posts.push(px);
  const seen = posts.filter((p) => p - cam.x > -POST * 5 && p - cam.x < width + POST * 5);
  // Posts.
  for (const p of seen) {
    const tall = Math.round((p - wx) / POST) % 4 === 0;
    const foot = groundAt(map, p) - cam.y;
    place(ctx, postArt(tall), snap(p - cam.x), foot + 4);
  }
  // The rope between neighbours, swagged and swaying a touch.
  ctx.lineCap = 'round';
  for (const p of seen) {
    if (p + POST > to) continue;
    const a = [p - cam.x, groundAt(map, p) - cam.y - 14];
    const b = [p + POST - cam.x, groundAt(map, p + POST) - cam.y - 14];
    const sag = 4 + Math.sin(time * 1.7 + p * 0.05) * 0.6;
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2 + sag * 2;
    ctx.strokeStyle = '#d07a96';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.quadraticCurveTo(mx, my, b[0], b[1]);
    ctx.stroke();
    ctx.strokeStyle = '#ffe6ee';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1] - 0.4);
    ctx.quadraticCurveTo(mx, my - 0.4, b[0], b[1] - 0.4);
    ctx.stroke();
  }
  // A paper lantern hanging from each tall pole, swinging a little; lit at night.
  for (const p of seen) {
    if (Math.round((p - wx) / POST) % 4 !== 0) continue;
    const lx = p - cam.x + 4.5;
    const ly = groundAt(map, p) - cam.y - 40;
    pivoted(ctx, lx, ly, swing(time, p, 1.2, p * 0.01), () => {
      ctx.fillStyle = '#9a6a40';
      ctx.fillRect(lx - 0.4, ly, 0.8, 3);
      paperLantern(ctx, lx, ly + 9, map.night ?? 0, 0.9);
    });
  }
  // The bunting, from tall pole to tall pole.
  for (const p of seen) {
    if ((Math.round((p - wx) / POST) % 4) !== 0 || p + POST * 4 > to) continue;
    const q = p + POST * 4;
    const a = [p - cam.x, groundAt(map, p) - cam.y - 46];
    const b = [q - cam.x, groundAt(map, q) - cam.y - 46];
    const sag = 9 + Math.sin(time * 1.1 + p * 0.02) * 1.2;
    const at = (u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + Math.sin(Math.PI * u) * sag];
    ctx.strokeStyle = '#b88658';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (let k = 0; k <= 16; k++) {
      const [x, y] = at(k / 16);
      if (k) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.stroke();
    const n = 11;
    for (let k = 1; k < n; k++) {
      const u = k / n;
      const [x, y] = at(u);
      const wxk = p + (q - p) * u;
      const flap = Math.sin(time * 4.2 - wxk * 0.06) * 0.22 + (windAt(time, wxk) - 0.6) * 0.3;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(flap);
      ctx.fillStyle = FLAGS[(k + Math.round(p / POST)) % FLAGS.length];
      ctx.beginPath();
      ctx.moveTo(-3.4, 0);
      ctx.lineTo(3.4, 0);
      ctx.lineTo(0, 7.4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.moveTo(-3.4, 0);
      ctx.lineTo(-0.6, 0);
      ctx.lineTo(-1.1, 3.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}
// A quarter sign: a stout post, a round wooden plaque with a pink rim and a blossom, the quarter
// written on it; tied to the top, a bunch of three balloons bobbing on their strings, each on its
// own beat.
// (`bare`: one floating on the lake: no tuft of grass at its foot, and a longer post, so its plaque
// rides up clear of the swimmers' tags.)
const signArt = (bare = false) => art(`mc-sign|${bare}`, 30, bare ? 64 : 50, () => [
  bare ? null : F(E(15, 49.4, 7, 1.4, '#7ab872')), R(13, 20, 4, bare ? 44 : 30, '#c8945a'), F(R(15.4, 20, 1.6, bare ? 44 : 30, '#9a6a40')),
  E(15, 13, 13, 12, '#ff9ec0'), F(E(15, 13, 10.6, 9.6, '#fff4e6')), F(E(12, 9.6, 4.4, 2.6, '#ffffff')),
  ...[0, 1, 2, 3, 4].map((p) => F(E(23.4 + Math.cos((p / 5) * TAU) * 1.6, 5.4 + Math.sin((p / 5) * TAU) * 1.6, 1.3, 1.3, '#ffc0d4'))), F(E(23.4, 5.4, 0.8, 0.8, '#ffd75e')),
]);
const BALLOONS = [['#ff8fb0', '#e8607e'], ['#ffd75e', '#e8b030'], ['#8fd3ff', '#5ab0e8']];
function balloons(ctx, x, y, time, seed, kick = -1) {
  BALLOONS.forEach(([c, d], k) => {
    const h = hash(seed * 2.3 + k * 5.1);
    // (Just passed: they jump on their strings and settle, one after another.)
    const t = kick - k * 0.08;
    const jump = t > 0 && t < 2 ? -Math.abs(Math.sin(t * 7)) * 7 * Math.exp(-t * 2.2) : 0;
    const sway = Math.sin(time * (1.1 + h * 0.5) + h * 9) * 3 + (windAt(time, x) - 0.6) * 4 + (t > 0 && t < 2 ? Math.sin(t * 5 + k * 2) * 4 * Math.exp(-t * 2) : 0);
    const bob = Math.sin(time * (1.6 + h * 0.6) + h * 5) * 1.6 + jump;
    const bx = x + (k - 1) * 8 + sway;
    const by = y - 26 - (k === 1 ? 6 : 0) + bob;
    ctx.strokeStyle = 'rgba(120,90,100,0.7)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo((x + bx) / 2 + sway * 0.4, (y + by) / 2 + 4, bx, by + 7);
    ctx.stroke();
    ctx.fillStyle = d;
    ctx.beginPath();
    ctx.ellipse(bx, by, 5.4, 6.4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(bx - 0.5, by - 0.5, 4.8, 5.8, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.ellipse(bx - 2, by - 2.6, 1.3, 1.9, -0.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = d;
    ctx.beginPath();
    ctx.moveTo(bx - 1.2, by + 6.8);
    ctx.lineTo(bx + 1.2, by + 6.8);
    ctx.lineTo(bx, by + 5.6);
    ctx.fill();
  });
}

// ---------- Mortar Cliff Climb ('course:maple'; its redraw, 2026-11-13) ----------
// An autumn mochi-pounding festival up a maple mountain. Far off, blue-violet peaks and a ridge in
// autumn colour, a rope bridge over a gorge and golden terraced rice fields; across the valley,
// maples in loose groups, pampas grass nodding and a farm hut with persimmons drying under its
// eaves. On the course: big maples beside the track dropping leaves (shaken loose as the runners
// pass), a hot spring steaming at the cliff's foot with two Mochi soaking in it, warm sandstone
// cliffs with roots, red ivy and holds like little mochi, a bell on a post at each wall's top (it
// rings as yours climbs over, pebbles trickling down), and on each ledge two Mochi pounding mochi
// in a mortar (pounding harder as yours comes over); at the summit a giant kagami mochi by the
// finish.
const MAPLE = [
  { body: '#ff8a5c', top: '#ffc08a', deep: '#e0583e', maple: true },
  { body: '#ffb04a', top: '#ffd88a', deep: '#e08a2e', maple: true },
  { body: '#f26a5a', top: '#ffa08c', deep: '#c84a44', maple: true },
  { body: '#ffc85a', top: '#ffe6a0', deep: '#e0a040', maple: true },
];
const LEAVES = ['#f88a5c', '#f8b456', '#ec7062', '#f8d074', '#e87a52'];
// (A leaf colour for any index, below zero too.)
const leafOf = (i) => LEAVES[((Math.floor(i) % LEAVES.length) + LEAVES.length) % LEAVES.length];
// A maple leaf's outline round (x, y), `r` across its middle: five pointed lobes, each with a
// tooth either side, the deep notches between.
function leafPts(x, y, r, rot = 0) {
  const pts = [];
  const D = TAU / 5;
  for (let l = 0; l < 5; l++) {
    const a = rot - Math.PI / 2 + l * D;
    for (const [da, k] of [[-0.5, 0.36], [-0.27, 0.72], [0, 1], [0.27, 0.72]]) pts.push([x + Math.cos(a + da * D) * r * k, y + Math.sin(a + da * D) * r * k]);
  }
  return pts;
}
// One leaf, a little picture in its colour: the leaf, its stem, a light vein.
// (`small`: a little one, for the leaves kicked and blown about.)
const leafArt = (c, small = false) => (small
  ? art(`mc-leaf|${c}|s`, 9, 9, () => [T(leafPts(4.5, 4, 3.2), c), F(R(4.2, 5.4, 0.7, 3, shade(c, -40)))])
  : art(`mc-leaf|${c}`, 12, 13, () => [
    T(leafPts(6, 5.6, 4.6), c), F(R(5.6, 7.6, 0.9, 4, shade(c, -40))), F(T(leafPts(5.4, 5, 1.8), mix(c, '#ffffff', 0.35))),
  ]));
// Draws a leaf at (x, y) turned by `rot`.
function leafAt(ctx, c, x, y, rot, small = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  place(ctx, leafArt(c, small), 0, small ? 4.5 : 6.5);
  ctx.restore();
}
// Leaves falling from a tree: each loosed from somewhere in the canopy, see-sawing down and along
// with the breeze, turning as it goes, fading in and out; on its own long loop.
function leafFall(ctx, x, top, foot, w, n, time, seed) {
  for (let k = 0; k < n; k++) {
    const h = hash(seed * 1.31 + k * 7.7);
    const period = 6.5 + h * 4;
    const u = ((time + h * period * 3.3) % period) / period;
    const x0 = x + (hash(seed + k * 3.9) - 0.5) * w;
    const rock = Math.sin(u * TAU * 1.4 + h * 9);
    const px = x0 + windAt(time, x0) * 24 * u + rock * 9;
    const py = top + (foot - top) * u;
    const alpha = Math.min(1, u / 0.08, (1 - u) / 0.12);
    if (alpha <= 0) continue;
    ctx.globalAlpha = alpha;
    leafAt(ctx, LEAVES[k % LEAVES.length], px, py, rock * 0.9 + h * 6, true);
  }
  ctx.globalAlpha = 1;
}

// The far range's rope bridge: two ropes sagging across a gorge, planks along the lower one.
function ropeBridge(ctx, x, yl, yr, time, air) {
  const sway = Math.sin(time * 0.8) * 0.6;
  const at = (u, dy) => [x - 44 + u * 88, yl + (yr - yl) * u + Math.sin(Math.PI * u) * (9 + sway) + dy];
  ctx.strokeStyle = mix('#8a5a40', air, 0.4);
  ctx.lineWidth = 0.9;
  for (const dy of [-7, 0]) {
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const [px, py] = at(i / 16, dy);
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
  ctx.fillStyle = mix('#c8945a', air, 0.4);
  for (let i = 1; i < 16; i++) {
    const [px, py] = at(i / 16, 0);
    ctx.fillRect(px - 1.2, py - 0.4, 2.4, 1.6);
    if (i % 3 === 0) {
      const [qx, qy] = at(i / 16, -7);
      ctx.fillRect(qx - 0.3, qy, 0.6, py - qy);
    }
  }
}
// Terraced rice fields on a hillside: golden steps, each edged in green, sheaves dotted along them.
const terracesArt = () => art('mc-terraces', 124, 48, () => {
  // (A rounded hill, its upper slopes cut into paddies: each a golden strip following the hill's
  // curve, a green bund along its lip, sheaves stood along it.)
  const out = [E(62, 48, 60, 40, '#a8c070'), F(E(52, 30, 30, 10, '#bcd080'))];
  for (let k = 0; k < 6; k++) {
    const y = 13 + k * 6;
    const w = 2 * 58 * Math.sqrt(Math.max(0, 1 - ((48 - y) / 40) ** 2));
    out.push(E(62, y, w / 2 - 2, 2.6, k % 2 ? '#f2c860' : '#e8b44c'), F(E(62, y - 1.6, w / 2 - 4, 0.8, '#d8e890')));
    for (let s = 0; s < Math.floor(w / 14); s++) out.push(F(E(62 - w / 2 + 10 + s * 14, y + 0.4, 1, 1.5, '#c89040')));
  }
  return out;
});
// Pampas grass: a clump of slim stems, each nodding a silvery-gold plume, swaying in the breeze.
function pampas(ctx, x, y, time, wx, air) {
  for (let i = 0; i < 5; i++) {
    const h = 16 + hash(wx + i * 2.1) * 10;
    const a = (lean(time, wx + i * 13, 0.15 * i, i) + 0.3) * 0.25 + (i - 2) * 0.12;
    const tx = x + (i - 2) * 2.4 + Math.sin(a) * h;
    const ty = y - Math.cos(a) * h;
    ctx.strokeStyle = mix('#b8a868', air, 0.2);
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(x + (i - 2) * 2.4, y);
    ctx.quadraticCurveTo(x + (i - 2) * 2.4 + Math.sin(a) * h * 0.4, y - h * 0.6, tx, ty);
    ctx.stroke();
    ctx.fillStyle = mix(i % 2 ? '#fff4d8' : '#f0dcb0', air, 0.15);
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.ellipse(tx - Math.sin(a) * k * 2.2 + 1.2, ty + Math.cos(a) * k * 2.2, 2.2 - k * 0.3, 1.1, a + 0.6, 0, TAU);
      ctx.fill();
    }
  }
}
// A farm hut: cream walls, a thick thatch roof, a sliding door; strings of persimmons drying under
// the eaves, swaying.
const hutArt = () => art('mc-hut', 70, 54, () => [
  R(46, 2, 6, 10, '#a8806a'), F(R(46, 2, 6, 1.6, '#c8a088')),
  R(10, 24, 50, 28, '#fff2dc'), F(R(10, 24, 3, 28, '#e8d6bc')), ...[22, 34, 46].map((x) => F(R(x, 25, 1, 26, '#e0caa8'))),
  R(26, 32, 14, 20, '#c8945a'), F(R(32.6, 32, 0.8, 20, '#a8703e')), R(46, 31, 9, 7, '#bfe0f0'), F(R(50.2, 31, 0.6, 7, '#8a6a50')),
  T([[2, 26], [18, 6], [52, 6], [68, 26]], '#c8a060'), F(T([[8, 24], [21, 9], [49, 9], [62, 24]], '#dab878')), F(R(16, 6, 38, 2, '#e8c890')),
  ...[14, 24, 34, 44, 54].map((x) => F(R(x, 11, 0.8, 13, '#b88a50'))),
]);
function persimmonHut(ctx, x, foot, time, air) {
  // (A thin curl of smoke from the chimney, rising and drifting off with the breeze.)
  ctx.fillStyle = mix('#ffffff', air, 0.2);
  for (let i = 0; i < 6; i++) {
    const u = (time * 0.18 + i / 6) % 1;
    ctx.globalAlpha = Math.sin(u * Math.PI) * 0.55;
    ctx.beginPath();
    ctx.arc(x + 16 + u * 14 + Math.sin(u * 5 + i) * 2, foot - 56 - u * 30, 1.6 + u * 3.4, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  place(ctx, hutArt(), snap(x), foot);
  for (let s = 0; s < 4; s++) {
    const sx = x - 20 + s * 12;
    const sy = foot - 28;
    const a = Math.sin(time * 1.3 + s * 1.7) * 0.06;
    ctx.strokeStyle = mix('#8a6a50', air, 0.15);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.sin(a) * 16, sy + 16);
    ctx.stroke();
    ctx.fillStyle = mix('#ff9a3a', air, 0.15);
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.arc(sx + Math.sin(a) * (3 + k * 4), sy + 3 + k * 4, 1.7, 0, TAU);
      ctx.fill();
    }
  }
}
const MAPLE_SPOTS = { hut: 640 };
COURSES.maple = {
  far(ctx, t, cam, width, y0, time) {
    const air = t.sky[1];
    goldenSky(ctx, width, y0, goldenOf(RUN.map?.night ?? 0));
    clouds(ctx, cam, width, time, t.face === 'moon');
    // The far peaks, then a ridge in autumn colour dotted with trees.
    hills(ctx, cam, width, y0 - 18, 64, 0.03, 3.7, mix('#a6a6d8', air, 0.42), mix('#d2cff0', air, 0.38));
    const ridge = hills(ctx, cam, width, y0 + 4, 38, 0.06, 6.1, mix('#d8805c', air, 0.34), mix('#f4b890', air, 0.3));
    // (Its forest: round treetops in autumn colours sitting along its line.)
    repeat(cam.x, 0.06, 8, width, (i, x) => {
      const gx = x + hash(i * 3.7) * 4;
      const r = 3.6 + hash(i * 2.1) * 2.4;
      ctx.fillStyle = mix(leafOf(i), air, 0.38);
      ctx.beginPath();
      ctx.arc(gx, ridge(gx) + r * 0.7, r, Math.PI, TAU);
      ctx.fill();
    });
    const bx = 520 - cam.x * 0.06;
    if (bx > -60 && bx < width + 60) ropeBridge(ctx, bx, ridge(bx - 44) + 8, ridge(bx + 44) + 8, time, air);
    // The terraced rice fields, golden, on the nearer hills.
    const near = hills(ctx, cam, width, y0 + 24, 24, 0.1, 8.3, mix('#b4c46c', air, 0.28), mix('#d8e49a', air, 0.24));
    for (const at of [260, 980]) {
      const tx = at - cam.x * 0.1;
      if (tx > -80 && tx < width + 80) place(ctx, terracesArt(), tx, near(tx) + 12);
    }
    return true;
  },
  // The middle plane: a golden meadow, maples in loose groups, pampas between, the persimmon hut.
  mid(ctx, t, cam, width, y0, time) {
    const air = t.sky[1];
    const land = hills(ctx, cam, width, y0 + 6, 10, 0.45, 9.1, mix('#c4cc74', air, 0.16), mix('#e0e6a0', air, 0.12));
    repeat(cam.x, 0.45, 104, width, (i, x) => {
      const s = hash(i * 2.9 + 7);
      const tx = x + hash(i * 1.7) * 36;
      const wx = tx + cam.x * 0.45;
      if (Math.abs(wx - MAPLE_SPOTS.hut) < 70) return;
      if (s > 0.3) drawTree(ctx, tx, land(tx) + 2, Math.floor(hash(i * 3.9) * 8), 0, time, wx, 0, MAPLE);
      if (s < 0.72) pampas(ctx, tx + 44, land(tx + 44) + 3, time, wx, air);
    });
    const hx = MAPLE_SPOTS.hut - cam.x * 0.45;
    if (hx > -70 && hx < width + 70) persimmonHut(ctx, hx, land(hx) + 4, time, air);
    return true;
  },
};

// Mortar Cliff's ground and grass: warm autumn loam with leaves pressed in, chestnuts and
// persimmons for its lost treats; golden grass, fallen leaves lying on it, little red mushrooms,
// cosmos nodding.
GROUND_SPECS.maple = {
  layers: [
    { top: 10, bot: 24, c: '#e0a070', a: 0.5, amp: 2.4, f: 0.043, rim: '#fcd8b0' },
    { top: 31, bot: 35, c: '#fff0dc', a: 0.65, amp: 3, f: 0.031, rim: null },
    { top: 56, bot: 74, c: '#c88060', a: 0.42, amp: 3.6, f: 0.021, rim: '#eab890' },
    { top: 88, bot: 91, c: '#fde0c4', a: 0.5, amp: 3, f: 0.036, rim: null },
  ],
  pebbles: ['#e8d6c4', '#d8c0e0', '#fde4c8', '#f4c8b0', '#d4e0c0', '#fff1c4'],
  flecks: ['#ffe8b0', '#ff9a5a', '#e8603a'],
  treats: [8, 9, 2, 4, 8, 9],
  near: 'mr_maple',
};
const shroomArt = (v) => art(`mc-shroom|${v}`, 10, 10, () => [
  R(4, 4.6, 2, 5, '#fff4e0'), E(5, 4.6, 4.4, 3.2, v ? '#ff6a5a' : '#e8a050'),
  F(E(3.4, 3.6, 1, 0.8, '#ffffff')), F(E(6.4, 4, 0.8, 0.7, '#ffffff')), F(E(5, 2.4, 0.7, 0.6, '#ffffff')),
]);
EDGE_KINDS.maple = (ctx, along, time, seed, width, camX) => {
  const tufts = [];
  const fallen = [];
  const shrooms = [];
  const cosmos = [];
  along(9, (x, y, k) => {
    if (x < -10 || x > width + 10) return;
    const h = hash(k * 2.3 + seed * 7);
    const w = windAt(time, x + camX);
    const sway = Math.sin(time * 2 + (x + camX) * 0.06) * 0.6 * (0.5 + w) + w * 1.3 + pushAt(x + camX, time);
    if (h < 0.3) tufts.push([x, y, sway, h]);
    else if (h < 0.36) fallen.push([x, y, h, k]);
    else if (h < 0.4) shrooms.push([x, y, h]);
    else if (h < 0.47) cosmos.push([x, y, sway, h]);
  });
  for (const [c, lw, f] of [['#b8b060', 1.3, 1], ['#e2d890', 0.9, 0.7]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const [x, y, sway, h] of tufts) {
      for (const [dx, hh] of [[-1.8, 6], [0, 9], [1.8, 6.6]]) {
        const tall = (hh + h * 4) * f;
        ctx.moveTo(x + dx, y);
        ctx.quadraticCurveTo(x + dx + sway * 0.3, y - tall * 0.6, x + dx * 1.6 + sway * (0.8 + h), y - tall);
      }
    }
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  for (const [x, y, h, k] of fallen) leafAt(ctx, mix(leafOf(k), '#c8b878', 0.3), x + (h - 0.3) * 20, y - 0.5, (h * 37) % TAU, true);
  for (const [x, y, h] of shrooms) place(ctx, shroomArt(h > 0.38 ? 1 : 0), snap(x), y + 1);
  for (const [x, y, sway, h] of cosmos) {
    const tx = x + sway;
    const ty = y - 7 - h * 6;
    ctx.strokeStyle = '#7cb46a';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.fillStyle = h > 0.44 ? '#ffffff' : '#ffb0d0';
    for (let p = 0; p < 8; p++) {
      const a = (p / 8) * TAU + h * 4;
      ctx.beginPath();
      ctx.ellipse(tx + Math.cos(a) * 1.7, ty + Math.sin(a) * 1.7, 1.2, 0.7, a, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd75e';
    ctx.beginPath();
    ctx.arc(tx, ty, 0.8, 0, TAU);
    ctx.fill();
  }
};

// ---------- The cliffs ----------
// A climbing cliff of warm sandstone, `h` tall, built out from the cliff face (at x 50 of the
// drawing): rounded stones stacked in courses, moss in the joints, roots and red ivy trailing down,
// holds like little mochi (pink, white and green, the dango's colours) set in it; its top a grassy
// lip strewn with fallen leaves.
const STONES = ['#e8c49a', '#dcb084', '#f0d2aa', '#e2bc90'];
const MOCHI_HOLDS = ['#ffb7cf', '#ffffff', '#b8e09c'];
const mapleCragArt = (h, seed) => art(`mc-crag|${h}|${seed}`, 66, h + 6, () => {
  const out = [];
  const H = h + 6;
  // (Its left edge, rough: in a little, out a little, every few px down.)
  const lx = (y) => 4 + hash(seed * 3.1 + Math.floor(y / 7)) * 5;
  // The stone: courses of rough blocks, each a different width and shade, their corners worn
  // round, lit along the top, speckled; the courses' joints offset like a dry-stone wall.
  const TONES = ['#ecc89e', '#e0b68a', '#d6a67c', '#e8c094', '#f0d0a8'];
  const block = (x0, y0, x1, y1, c, k) => {
    const r = Math.min(3, (x1 - x0) / 3, (y1 - y0) / 3);
    out.push(T([[x0 + r, y0], [x1 - r, y0], [x1, y0 + r], [x1, y1 - r], [x1 - r, y1], [x0 + r, y1], [x0, y1 - r], [x0, y0 + r]], c));
    out.push(F(R(x0 + r, y0 + 0.6, x1 - x0 - r * 2, 1.2, '#fae2c0')));
    for (let d = 0; d < 3; d++) {
      const sx = x0 + 2 + hash(k * 3.1 + d) * (x1 - x0 - 4);
      const sy = y0 + 3 + hash(k * 5.7 + d) * (y1 - y0 - 5);
      out.push(F(E(sx, sy, 0.7, 0.6, shade(c, -26))));
    }
  };
  for (let r = 0, y1 = H; y1 > 7; r++) {
    const bh = 10 + hash(seed * 1.7 + r) * 6;
    const y0 = Math.max(6, y1 - bh);
    let x = lx((y0 + y1) / 2);
    while (x < 55) {
      let bw = Math.min(56 - x, 12 + hash(seed + r * 4.1 + x) * 14);
      if (56 - x - bw < 7) bw = 56 - x;
      if (bw > 3) block(x, y0 + 0.4, x + bw - 0.6, y1 - 0.4, TONES[Math.floor(hash(seed + r * 2.3 + x * 0.7) * TONES.length)], seed + r * 13 + x);
      x += bw;
    }
    const y1Prev = y1;
    y1 = y0;
    if (y1Prev - y0 < 4) break;
    // (Now and then a jutting lip with a tuft of moss on it, and a crack running down.)
    if (hash(seed + r * 4.7) < 0.45) out.push(F(E(lx(y0) + 9 + hash(r + seed) * 24, y0 + 0.6, 5, 1.4, '#a8c870')));
  }
  // Roots and red ivy trailing down from the top.
  for (const [rx, len] of [[14, 0.3], [40, 0.22]]) out.push(F(T([[rx, 7], [rx + 2, 7], [rx + 3.4, 7 + H * len], [rx + 2.4, 7 + H * len]], '#9a6a48')));
  for (const [ix, len] of [[24, 0.55], [47, 0.38]]) {
    const n = Math.floor((H * len) / 6);
    for (let k = 0; k < n; k++) out.push(F(T(leafPts(ix + (k % 2 ? 2.2 : -2.2), 9 + k * 6, 2.4, k * 0.7), k % 3 ? '#e8503a' : '#ff8a4a')));
  }
  // The holds: little mochi set in the stone.
  for (let r = 0, y = H - 14; y > 14; r++, y -= 15) {
    const hx = 22 + (r % 2 ? 14 : 4) + hash(seed + r * 3.3) * 8;
    out.push(E(hx, y, 2.8, 2.3, MOCHI_HOLDS[r % 3]), F(E(hx - 0.9, y - 0.8, 0.9, 0.6, '#ffffff')));
  }
  // The top: a grassy lip with leaves on it.
  out.push(R(2, 4, 56, 4, '#c8d46a'), F(R(4, 4, 50, 1.2, '#e4ec9a')), ...[8, 22, 36, 50].map((x) => F(E(x, 8.4, 4, 1.6, '#b4c45a'))));
  for (let k = 0; k < 4; k++) out.push(F(T(leafPts(10 + k * 13, 4.4, 2.6, k * 1.3), LEAVES[(k + seed) % LEAVES.length])));
  return out;
});
// A bronze bell, its cord and tassel.
const bellArt = () => art('mc-bell', 12, 16, () => [
  F(R(5.4, 0, 1.2, 4, '#c84860')), T([[3, 12], [3.6, 6], [6, 4], [8.4, 6], [9, 12], [10, 13], [2, 13]], '#e8b84a'),
  F(R(2.4, 11.6, 7.2, 1.4, '#c8962e')), F(E(4.8, 7.4, 0.9, 2, '#fff0b8')), E(6, 14.2, 1.4, 1.2, '#b88a2a'),
]);
// The wall's top: a post with a bell hanging off its arm over the edge, swaying; as yours climbs
// over, it swings and rings, and a sparkle goes up.
function wallBell(ctx, x, top, wx, time, k) {
  ctx.fillStyle = '#9a6a48';
  ctx.fillRect(snap(x + 5), snap(top - 26), 2, 26);
  ctx.fillRect(snap(x - 3), snap(top - 26), 10, 2);
  const ring = k >= 0 && k < 2.4 ? Math.sin(k * 11) * 0.6 * Math.exp(-k * 1.6) : 0;
  const a = Math.sin(time * 1.2 + wx) * 0.06 + ring;
  pivoted(ctx, x - 2, top - 24, a, () => place(ctx, bellArt(), snap(x - 2), top - 9));
  if (k >= 0 && k < 1) {
    ctx.fillStyle = '#fff4b0';
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * TAU + k * 2;
      const d = 6 + k * 14;
      ctx.globalAlpha = 1 - k;
      ctx.fillRect(x - 2 + Math.cos(ang) * d - 0.8, top - 16 + Math.sin(ang) * d - 0.8, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;
  }
}

// ---------- The mochi pounders ----------
// On each ledge just over a wall's top, two Mochi make mochi: one swings the mallet (raised high,
// then down into the mortar with a thump), the other, across the mortar, reaches in to turn the
// dough between strokes and snatches its paws back before the next. The dough dents with each
// stroke and a puff of rice flour flies. As yours climbs over, they pound faster, "Pettan!", then
// both jump and cheer it on its way.
const POUND = [
  [0, { front: [6, -9], back: [3.5, -8], pole: 0.45, tilt: -2, mouth: 'mochiw' }],
  [0.3, { front: [3.5, -17], back: [1.5, -16], pole: -0.5, tilt: -7, lift: 0.6, mouth: 'o', sprout: 'excited' }],
  [0.5, { front: [3.5, -17.5], back: [1.5, -16.5], pole: -0.6, tilt: -8, lift: 1, mouth: 'o', sprout: 'excited' }],
  [0.62, { front: [8.5, -11], back: [6, -10], pole: 1.1, tilt: 7, squat: 1, mouth: 'D', closed: [true, true], sprout: 'happy' }],
  [0.85, { front: [8.5, -11], back: [6, -10], pole: 1.05, tilt: 6, squat: 1, mouth: 'D', sprout: 'happy' }],
  [1.1, { front: [6, -9], back: [3.5, -8], pole: 0.45, tilt: 0, mouth: 'mochiw', sprout: 'happy' }],
  [1.4, { front: [6, -9], back: [3.5, -8], pole: 0.45, tilt: -2, mouth: 'mochiw' }],
];
const TURN = [
  [0, { front: [3, -9], back: [-3, -9], tilt: -3, mouth: 'mochiw' }],
  [0.4, { front: [2, -10], back: [-4, -10], tilt: -5, mouth: 'mochiw' }],
  [0.62, { front: [1.5, -11], back: [-4.5, -11], tilt: -7, lift: 1.4, mouth: 'o', closed: [true, true] }],
  [0.8, { front: [3, -8], back: [-2, -8], tilt: 0, mouth: 'mochiw', sprout: 'happy' }],
  [0.92, { front: [10.5, -8], back: [8.5, -7.5], tilt: 11, squat: 1, mouth: 'mochiw', sprout: 'happy' }],
  [1.05, { front: [11, -5.5], back: [9, -5], tilt: 12, squat: 1, mouth: 'D', sprout: 'happy' }],
  [1.18, { front: [10, -9], back: [8, -8.5], tilt: 9, mouth: 'D', sprout: 'happy' }],
  [1.3, { front: [3, -9], back: [-3, -9], tilt: -3, mouth: 'mochiw' }],
  [1.4, { front: [3, -9], back: [-3, -9], tilt: -3, mouth: 'mochiw' }],
];
const HURRAY = [
  [0, { front: [3.5, -17], back: [-6, -12], pole: -0.3, mouth: 'D', sprout: 'excited' }],
  [0.25, { front: [3.5, -17.5], back: [-7, -14], pole: -0.35, lift: 3.4, tilt: -4, mouth: 'yell', closed: [true, true], sprout: 'excited' }],
  [0.5, { front: [3.5, -17], back: [-6, -12], pole: -0.3, squat: 1, mouth: 'D', sprout: 'excited' }],
];
const POUND_LEN = 1.4;
const POUND_HIT = 0.62;
const POUNDERS = {};
const poundersOf = (wx) => (POUNDERS[wx] ??= [
  { ...newRecord(rollMochi(9601 + wx, { coat: null })), dress: 'chef' },
  { ...newRecord(rollMochi(9707 + wx, { coat: null })), dress: 'cozy' },
]);
// The mortar: a stout wooden usu, waisted, banded, on the ground.
const usuArt = () => art('mc-usu', 32, 20, () => [
  F(E(16, 18.6, 14, 1.6, '#b4c45a')), T([[3, 4], [29, 4], [26, 11], [29, 18], [3, 18], [6, 11]], '#c88a52'),
  F(R(4, 4, 24, 2, '#e0a868')), F(R(5.6, 9.6, 21, 1.2, '#a86a3a')), F(R(4, 15, 24, 1.2, '#a86a3a')), F(R(5, 6, 2, 11, '#d89a62')),
  E(16, 4.4, 11, 2.4, '#7a4a2a'),
]);
// The mallet (kine) in the paw: a long handle through it, `ang` from upright toward where it faces,
// a fat barrel of a head across its end.
function kine(ctx, hand, ang, face) {
  const vx = Math.sin(ang) * face;
  const vy = -Math.cos(ang);
  const [hx, hy] = hand;
  ctx.strokeStyle = '#7a5038';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hx - vx * 4, hy - vy * 4);
  ctx.lineTo(hx + vx * 17, hy + vy * 17);
  ctx.stroke();
  ctx.strokeStyle = '#d8a870';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(hx - vx * 4, hy - vy * 4);
  ctx.lineTo(hx + vx * 17, hy + vy * 17);
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.save();
  ctx.translate(hx + vx * 20, hy + vy * 20);
  ctx.rotate(Math.atan2(vy, vx));
  ctx.fillStyle = '#6a4030';
  ctx.beginPath();
  ctx.ellipse(0, -5.4, 4.6, 1.8, 0, 0, TAU);
  ctx.ellipse(0, 5.4, 4.6, 1.8, 0, 0, TAU);
  ctx.fill();
  ctx.fillRect(-4.6, -5.4, 9.2, 10.8);
  ctx.fillStyle = '#c8945a';
  ctx.fillRect(-3.8, -5.2, 7.6, 10.4);
  ctx.fillStyle = '#e2b47a';
  ctx.fillRect(-3.8, -5.2, 2.4, 10.4);
  ctx.fillStyle = '#8a5a38';
  ctx.fillRect(-3.8, -3.4, 7.6, 1);
  ctx.fillRect(-3.8, 2.4, 7.6, 1);
  ctx.restore();
}
// The dough in the mortar's mouth: a soft white dome, dented for a moment by each stroke and
// springing back, its shine.
function dough(ctx, x, y, dent, fold = 0) {
  const ry = 3.6 - dent * 1.6 + fold * 1.4;
  x += fold * 2.4;
  ctx.fillStyle = '#e8e0e8';
  ctx.beginPath();
  ctx.ellipse(x, y + 0.4, 10, ry + 0.6, 0, Math.PI, TAU);
  ctx.fill();
  ctx.fillStyle = '#fffaf4';
  ctx.beginPath();
  ctx.ellipse(x, y, 9.4, ry, 0, Math.PI, TAU);
  ctx.fill();
  if (dent > 0.2) {
    ctx.fillStyle = 'rgba(200,190,200,0.7)';
    ctx.beginPath();
    ctx.ellipse(x + 1, y - ry * 0.4, 4, 1 * dent, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 5, y - ry + 0.8, 3, 0.9);
  if (fold > 0.1) {
    // (The flap turned over: a fold line across its top.)
    ctx.strokeStyle = `rgba(190,180,195,${fold})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(x + 3, y - ry * 0.3, 4, Math.PI * 1.1, Math.PI * 1.75);
    ctx.stroke();
  }
}
function pounders(ctx, map, x, gy, wx, time) {
  const R = live(time) && RUN.map === map ? RUN.R : null;
  const mo = R ? momentsOf(R) : {};
  const top = mo.tops?.[wx] != null ? time - mo.tops[wx] : -1;
  const [p, q] = poundersOf(wx);
  const mx = x + 24;
  // (Yours just over: a burst of quick strokes, then a cheer; otherwise the steady work.)
  const fast = top >= 0 && top < 1.8;
  const cheer = top >= 1.8 && top < 3.6;
  const t = fast ? (top * POUND_LEN) / 0.6 : (time + hash(wx) * 3) % POUND_LEN;
  const tt = fast ? t % POUND_LEN : t;
  const since = (tt - POUND_HIT + POUND_LEN) % POUND_LEN;
  const dent = cheer ? 0 : since < 0.4 ? Math.max(0, 1 - since / 0.4) : 0;
  place(ctx, usuArt(), snap(mx), gy + 2);
  const fold = cheer ? 0 : tt > 0.9 && tt < 1.3 ? Math.sin(((tt - 0.9) / 0.4) * Math.PI) : 0;
  dough(ctx, mx, gy - 14, dent, fold);
  // Steam off the fresh, hot mochi: soft wisps curling up, a puff more after each stroke.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const u = (time * 0.4 + i / 3 + hash(wx)) % 1;
    const sx = mx - 4 + i * 4;
    const sy = gy - 18 - u * 22;
    ctx.globalAlpha = Math.sin(u * Math.PI) * (0.35 + (since < 0.6 ? 0.3 * (1 - since / 0.6) : 0));
    ctx.beginPath();
    ctx.moveTo(sx + Math.sin(u * 6 + i) * 2, sy + 5);
    ctx.quadraticCurveTo(sx + Math.sin(u * 6 + i + 1.5) * 3.5, sy, sx + Math.sin(u * 6 + i + 3) * 2, sy - 5);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.lineCap = 'butt';
  // Flour flying off the stroke.
  if (!cheer && since < 0.35) {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 6; i++) {
      const a = Math.PI + (i / 5) * Math.PI;
      const d = 3 + since * 30;
      ctx.globalAlpha = 1 - since / 0.35;
      ctx.beginPath();
      ctx.arc(mx + Math.cos(a) * d * 1.4, gy - 16 + Math.sin(a) * d * 0.7, 1, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  const keys = cheer ? HURRAY : POUND;
  const kt = cheer ? (top - 1.8) % 0.5 : tt;
  const pole = routine(keys, kt).pole;
  posed(ctx, p, x, gy, keys, kt, { facing: cheer && RUN.you && RUN.you.x < wx ? -1 : 1, hold: 'front', slot: `pound|${wx}|0`, under: (c, hand) => kine(c, hand, pole, cheer && RUN.you && RUN.you.x < wx ? -1 : 1) });
  const qk = cheer ? HURRAY : TURN;
  posed(ctx, q, x + 48, gy, qk, cheer ? (top - 1.55) % 0.5 : tt, { facing: -1, slot: `pound|${wx}|1` });
  // "Pettan!" over the mortar at each quick stroke.
  if (fast && since < 0.5) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, (0.5 - since) * 4);
    ctx.font = '900 9px Nunito, "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText('Pettan!', mx, gy - 32 - since * 16);
    ctx.fillStyle = '#e0603a';
    ctx.fillText('Pettan!', mx, gy - 32 - since * 16);
    ctx.restore();
  }
}

// ---------- The summit's kagami mochi ----------
// A giant kagami mochi on its wooden stand beside the finish: two soft white tiers, a bitter orange
// on top with its leaf, a folded paper streamer down the front; it bobs, the leaf nodding; as yours
// comes home it gives a hop and sparkles.
const kagamiArt = () => art('mc-kagami', 64, 74, () => [
  R(10, 56, 44, 14, '#e8b070'), F(R(10, 56, 44, 2.4, '#f8d4a0')), R(6, 52, 52, 5, '#d89a5a'), F(R(6, 52, 52, 1.4, '#f0c080')),
  R(26, 59, 12, 9, '#c88048'), F(E(32, 63.5, 3.4, 3, '#e8b070')), R(8, 70, 6, 3, '#c88048'), R(50, 70, 6, 3, '#c88048'),
  E(32, 42, 24, 11, '#fff8f2'), F(E(26, 38, 12, 3.6, '#ffffff')), F(E(32, 49, 20, 3, '#efe4e8')),
  E(32, 26, 17, 9, '#fff8f2'), F(E(27.6, 23, 8, 2.8, '#ffffff')), F(E(32, 32, 14, 2.4, '#efe4e8')),
  T([[24, 34], [40, 34], [42, 38], [38, 40], [36, 37], [32, 41], [28, 37], [26, 40], [22, 38]], '#ffffff'),
  E(32, 13.4, 7.4, 6.4, '#ff9a3a'), F(E(29.6, 11.4, 2.4, 1.6, '#ffc890')), F(E(32, 7.6, 1.4, 1, '#6a8a40')),
]);
function kagami(ctx, map, x, gy, wx, time) {
  const R = live(time) && RUN.map === map ? RUN.R : null;
  const mo = R ? momentsOf(R) : {};
  const k = mo.home != null ? time - mo.home : -1;
  const hop = k > 0 && k < 0.5 ? Math.sin((k / 0.5) * Math.PI) * 5 : 0;
  const bob = Math.sin(time * 1.4 + wx) * 0.5;
  place(ctx, kagamiArt(), snap(x), gy + 2 - hop + bob * 0.4);
  // The orange's leaf, nodding.
  const a = Math.sin(time * 1.8 + wx) * 0.25;
  ctx.save();
  ctx.translate(x + 1, gy + 2 - 74 + 7 - hop);
  ctx.rotate(a);
  ctx.fillStyle = '#6cb050';
  ctx.beginPath();
  ctx.ellipse(4, -1, 4, 1.8, -0.4, 0, TAU);
  ctx.fill();
  ctx.restore();
  if (k > 0 && k < 1.6) {
    ctx.fillStyle = '#fff4b0';
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * TAU + k;
      const d = 20 + k * 22;
      ctx.globalAlpha = Math.max(0, 1 - k / 1.6);
      ctx.fillRect(x + Math.cos(ang) * d - 1, gy - 40 + Math.sin(ang) * d * 0.7 - 1, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
}

// ---------- The hot spring ----------
// At the cliff's foot: a pool rimmed in round stones, steam curling up off it, two Mochi soaking to
// their chins with little towels folded on their heads (they wave as yours runs by), and a wooden
// sign with the hot-spring mark.
const onsenBackArt = () => art('mc-onsen-b', 100, 30, () => [
  ...[[10, 17, 9, 7], [26, 13, 9, 7], [42, 12, 10, 6.4], [58, 12, 10, 6.4], [74, 13, 9, 7], [90, 17, 9, 7]].map(([x, y, rx, ry], i) => E(x, y, rx, ry, ['#b8b0c0', '#c8c0cc', '#a8a0b4'][i % 3])),
  ...[[10, 17], [26, 13], [42, 12], [58, 12], [74, 13], [90, 17]].map(([x, y]) => F(E(x - 2.6, y - 2.6, 3.6, 1.8, '#e4dcea'))),
  E(50, 22, 42, 6.4, '#8fd8e0'), F(E(44, 20.4, 26, 2.2, '#c4f0f2')),
]);
const onsenFrontArt = () => art('mc-onsen-f', 100, 16, () => [
  ...[[9, 9, 9, 6.4], [25, 11, 9, 5], [42, 12, 10, 4], [58, 12, 10, 4], [75, 11, 9, 5], [91, 9, 9, 6.4]].map(([x, y, rx, ry], i) => E(x, y, rx, ry, ['#c8c0cc', '#b8b0c0', '#d0c8d6'][i % 3])),
  ...[[9, 9], [25, 11], [42, 12], [58, 12], [75, 11], [91, 9]].map(([x, y]) => F(E(x - 2.4, y - 2, 3.4, 1.4, '#ece6f0'))),
]);
const onsenSignArt = () => art('mc-onsen-s', 18, 28, () => [
  R(8, 12, 2.4, 16, '#9a6a48'), R(1, 2, 16, 12, '#e8c08a'), F(R(1, 2, 16, 2, '#f8dcae')),
  E(9, 10.4, 4.6, 2.4, '#e0503a'), F(E(9, 9.6, 3, 1, '#e8c08a')),
  ...[5.6, 9, 12.4].map((x) => F(T([[x - 0.6, 8], [x + 0.6, 8], [x + 1.2, 6], [x - 0.2, 4], [x + 0.6, 2.6], [x - 0.6, 2.6], [x - 1.4, 4], [x, 6]], '#e0503a'))),
]);
let BATHERS = null;
const bathersOf = () => (BATHERS ??= [8871, 8893].map((s) => newRecord(rollMochi(s, { coat: null }))));
function onsen(ctx, map, x, gy, wx, time) {
  const youX = live(time) && RUN.map === map ? RUN.you.x : null;
  const near = youX != null && Math.abs(youX - wx) < 100;
  place(ctx, onsenBackArt(), snap(x), gy + 2);
  const water = gy + 2 - 30 + 22;
  bathersOf().forEach((g, k) => {
    const bx = x - 14 + k * 26;
    const h = hash(wx + k * 3.3);
    const period = near ? 0.9 : 4 + h * 2;
    const into = (time + h * 9) % period;
    const beat = near && into < 0.9 ? CHEER_SEQ[Math.min(CHEER_SEQ.length - 1, Math.floor((into / 0.9) * CHEER_SEQ.length))] : 0;
    ctx.save();
    ctx.translate(bx, water + 5 + Math.sin(time * 1.1 + k * 2) * 0.5);
    ctx.scale(0.7, 0.7);
    drawSpectator(ctx, g, 0, 0, beat, near ? (youX < bx ? -1 : 1) : k ? -1 : 1, `onsen|${k}`);
    ctx.restore();
    // A little towel folded on its head.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx - 3.6, water - 13.6 + Math.sin(time * 1.1 + k * 2) * 0.5, 7.2, 2.4);
    ctx.fillStyle = '#d8e8f4';
    ctx.fillRect(bx - 3.6, water - 11.6 + Math.sin(time * 1.1 + k * 2) * 0.5, 7.2, 0.6);
  });
  // The water over them, to their chins.
  ctx.fillStyle = 'rgba(143,216,224,0.88)';
  ctx.beginPath();
  ctx.ellipse(x, water + 1.6, 40, 4, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(x - 24, water - 1.4, 12, 0.8);
  ctx.fillRect(x + 6, water - 1, 9, 0.8);
  place(ctx, onsenFrontArt(), snap(x), gy + 4);
  place(ctx, onsenSignArt(), snap(x + 56), gy + 2);
  // Steam curling up and fading.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const u = (time * 0.32 + i / 6) % 1;
    const sx = x - 30 + i * 12;
    const sy = water - 2 - u * 34;
    ctx.globalAlpha = Math.sin(u * Math.PI) * 0.55;
    ctx.beginPath();
    ctx.moveTo(sx + Math.sin(u * 7 + i) * 3, sy + 6);
    ctx.quadraticCurveTo(sx + Math.sin(u * 7 + i + 1.4) * 5, sy, sx + Math.sin(u * 7 + i + 2.6) * 3, sy - 6);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.lineCap = 'butt';
}

// Each frame of a maple race: yours coming over each wall's top rings its bell, sets its pounders
// going, and sends a trickle of pebbles down the face.
function noteMaple(map, R, mo, time) {
  const you = R.racers[R.me];
  const was = you.mapleMode;
  you.mapleMode = you.m.mode;
  if (R.phase !== 'run' || was !== 'climb' || you.m.mode === 'climb') return;
  // (The wall it just topped: the nearest behind it.)
  let best = null;
  for (const [kind, wx, e] of map.townPieces ?? []) if (kind === 'mr_wall' && wx <= you.x + 20 && (!best || wx > best[0])) best = [wx, e];
  if (!best) return;
  const [wx, e] = best;
  (mo.tops ??= {})[wx] ??= time;
  // (The pounders on its ledge go too: they're keyed by their own spot.)
  for (const [kind, px] of map.townPieces ?? []) if (kind === 'mr_pound' && px > wx && px < wx + 120) mo.tops[px] ??= time;
  for (let k = 0; k < 9; k++) drop(wx - 4 - Math.random() * 22, e.top + 2, (Math.random() - 0.5) * 16, -10 - Math.random() * 20, 2.2, ['#c8a07a', '#a8805a', '#e0c098'][k % 3]);
}
// ---------- Cloud Glide ('course:snow'; its redraw, 2026-11-13) ----------
// A winter glide off a snowy peak (the seasons' last: spring, summer, autumn, winter). Far off,
// snow-capped peaks rising out of a sea of clouds under a low pink sun; nearer, the cloud sea
// rolling slowly by. On the peak: snowy pines (dropping snow as the runners pass), stone lanterns
// glowing, a pennant post, a wooden launch ramp with wind streamers (whipping as yours takes off);
// an icy cliff below it hung with icicles. Out on the landing field: snow-mochi snowmen, a hot
// cocoa stall steaming, a giant snow mochi by the finish (it waves as yours comes home). A light
// snowfall; a puff of snow as each racer lands.
const SNOWS = ['#ffffff', '#eef4ff', '#dce8fb'];
// A snowflake, a little six-armed star.
const flakeArt = () => art('mc-flake', 8, 8, () => {
  const out = [];
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI;
    const dx = Math.cos(a) * 3.2;
    const dy = Math.sin(a) * 3.2;
    out.push(T([[4 - dx, 4 - dy], [4 - dx + 0.5, 4 - dy - 0.5], [4 + dx + 0.5, 4 + dy - 0.5], [4 + dx, 4 + dy]], '#ffffff'));
  }
  out.push(F(E(4, 4, 1, 1, '#e8f2ff')));
  return out;
});
// A snowy pine: tiers of dark green boughs, each with snow lying along it, a short trunk.
const PINE = [{ w: 40, h: 58 }, { w: 64, h: 96 }];
const pineArt = (v, size) => art(`mc-pine|${v}|${size}`, PINE[size].w, PINE[size].h, () => {
  const { w, h } = PINE[size];
  const cx = w / 2;
  const out = [R(cx - 2.5, h - 12, 5, 12, '#7a5440'), F(E(cx, h - 1, w * 0.36, 1.6, '#e8eef8'))];
  const tiers = 4;
  for (let k = 0; k < tiers; k++) {
    const top = 3 + k * ((h - 18) / tiers);
    const bot = top + (h - 18) / tiers + 8;
    const half = (w / 2 - 2) * (0.42 + 0.58 * ((k + 1) / tiers));
    const j = (hash(v * 3.1 + k) - 0.5) * 2;
    out.push(T([[cx + j * 0.4, top], [cx + half, bot], [cx - half, bot]], k % 2 ? '#4f8a76' : '#3f7a68'));
    out.push(F(T([[cx + j * 0.4, top], [cx - 1, top + (bot - top) * 0.6], [cx - half * 0.7, bot - 1], [cx - half, bot]], '#5e9c86')));
    out.push(F(E(cx - half * 0.45, bot - 1.6, half * 0.5, 2.2, '#ffffff')), F(E(cx + half * 0.4, bot - 1.2, half * 0.42, 1.8, '#f0f6ff')));
  }
  out.push(F(E(cx, 5, 4, 3, '#ffffff')));
  return out;
});
function drawPine(ctx, x, foot, v, size, time, wx, shake = 0) {
  const a = (lean(time, wx, 0.25, v) + 0.1) * 0.02 + shake;
  pivoted(ctx, x, foot, a, () => place(ctx, pineArt(v, size), snap(x), foot + 2));
}
// A stone lantern: a pedestal, a post, a firebox with its warm lit window, a broad roof with snow
// on it; a soft glow round its light that breathes.
const toroArt = () => art('mc-toro', 22, 40, () => [
  R(5, 34, 12, 5, '#a8a8b8'), F(R(5, 34, 12, 1.2, '#c8c8d4')), R(8.5, 22, 5, 12, '#b4b4c4'),
  R(5, 14, 12, 8, '#b8b8c8'), R(8, 16, 6, 5, '#ffd890'), F(R(8, 16, 6, 1.4, '#fff0c0')),
  T([[1, 14], [6, 8], [16, 8], [21, 14]], '#9c9cb0'), F(E(11, 8.4, 8, 2.4, '#ffffff')), F(E(11, 5, 2, 2, '#9c9cb0')), F(E(11, 3.6, 1.8, 1.2, '#ffffff')),
]);
function toro(ctx, x, gy, time, wx) {
  const k = 0.82 + 0.1 * Math.sin(time * 2.1 + wx) + 0.06 * Math.sin(time * 5.3 + wx * 2);
  const g = ctx.createRadialGradient(x, gy - 21, 1, x, gy - 21, 18);
  g.addColorStop(0, `rgba(255,214,140,${0.42 * k})`);
  g.addColorStop(1, 'rgba(255,214,140,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 18, gy - 39, 36, 36);
  place(ctx, toroArt(), snap(x), gy + 2);
}
// The launch ramp: a wooden ramp up to the edge, snow along its top, two poles with long ribbons
// streaming out over the drop; as yours takes off, they whip and a burst of sparkles flies.
const rampArt = () => art('mc-ramp', 64, 22, () => [
  T([[2, 20], [58, 6], [62, 6], [62, 20]], '#c8945a'), F(T([[2, 20], [58, 6], [62, 6], [62, 8.4], [6, 20]], '#e2b47a')),
  ...[14, 30, 46].map((x) => F(R(x, 20 - (x - 2) * 0.25, 1, (x - 2) * 0.25 + 1, '#a8703e'))),
  F(T([[4, 19], [58, 5], [61, 4.4], [60, 6.4], [8, 19.6]], '#ffffff')), R(56, 6, 6, 15, '#a8703e'),
]);
const RIBBONS = ['#ff9ec0', '#8fd3ff', '#ffd75e', '#c8a8f0'];
function streamers(ctx, px, top, time, k, n0) {
  ctx.fillStyle = '#8a6a50';
  ctx.fillRect(snap(px - 1), snap(top), 2, 34);
  ctx.fillStyle = '#ffd75e';
  ctx.beginPath();
  ctx.arc(px, top, 1.6, 0, TAU);
  ctx.fill();
  const whip = k >= 0 && k < 1.6 ? Math.exp(-k * 2) : 0;
  for (let r = 0; r < 2; r++) {
    const c = RIBBONS[(n0 + r) % RIBBONS.length];
    const len = 22 + r * 6 + whip * 10;
    ctx.strokeStyle = c;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const u = i / 10;
      const wave = Math.sin(time * (5 + whip * 10) - u * 7 + r * 2) * (1.2 + whip * 3) * u;
      const x = px + u * len;
      const y = top + 2 + r * 3 + u * (4 - whip * 3) + wave;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
}
// The marker post on the run-up: a snow-capped post with a long pennant; it flaps hard and drops
// its snow as yours goes by.
function snowMarker(ctx, x, gy, time, wx, k) {
  ctx.fillStyle = '#8a6a50';
  ctx.fillRect(snap(x - 1), snap(gy - 40), 3, 40);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(x + 0.5, gy - 40, 3, 1.6, 0, 0, TAU);
  ctx.fill();
  const flap = k >= 0 && k < 1.8 ? Math.exp(-k * 1.6) : 0;
  ctx.fillStyle = '#8fc8ff';
  ctx.beginPath();
  ctx.moveTo(x + 2, gy - 38);
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    ctx.lineTo(x + 2 + u * 18, gy - 38 + u * 4 + Math.sin(time * (4 + flap * 12) - u * 6) * (1 + flap * 2.4) * u);
  }
  for (let i = 8; i >= 0; i--) {
    const u = i / 8;
    ctx.lineTo(x + 2 + u * 18, gy - 31 + u * 0.6 + Math.sin(time * (4 + flap * 12) - u * 6) * (1 + flap * 2.4) * u);
  }
  ctx.closePath();
  ctx.fill();
}
// The icy cliff under the launch: bands of cold blue-grey rock, snow lying on each ledge, icicles
// hanging under them, frost glints.
const snowCliffArt = (h) => art(`mc-snowcliff|${h}`, 40, h, () => {
  const out = [];
  const TONES = ['#b8c4dc', '#a8b4d0', '#c8d2e8', '#b0bcd8'];
  for (let r = 0, y1 = h; y1 > 2; r++) {
    const bh = 14 + hash(r * 3.7) * 10;
    const y0 = Math.max(2, y1 - bh);
    const lx = 4 + hash(r * 5.1) * 6;
    out.push(T([[lx, y0], [36, y0], [36, y1], [lx + 2, y1]], TONES[r % TONES.length]));
    out.push(F(E((lx + 36) / 2 + 2, y0 + 0.8, (36 - lx) / 2, 2, '#ffffff')));
    for (let i = 0; i < 3; i++) {
      const ix = lx + 4 + hash(r * 2.3 + i) * (30 - lx);
      const il = 3 + hash(r + i * 7) * 5;
      out.push(F(T([[ix - 1.2, y0 + 2], [ix + 1.2, y0 + 2], [ix, y0 + 2 + il]], '#dff0ff')));
    }
    if (hash(r * 9.1) < 0.5) out.push(F(E(lx + 10 + hash(r) * 14, y0 + bh * 0.5, 1.2, 1.2, '#f0f8ff')));
    y1 = y0;
  }
  return out;
});
// A snow mochi: two soft snowballs, a little face, twig arms, a knitted scarf, a mandarin for a hat.
const snowMochiArt = (v) => art(`mc-snowmochi|${v}`, 30, 34, () => {
  const scarf = ['#ff8fb0', '#8fc8ff', '#ffc85a'][v % 3];
  return [
    F(E(15, 33, 11, 1.4, '#dce6f6')), E(15, 26, 10.5, 7.6, '#ffffff'), F(E(12, 23.6, 5, 2.6, '#fbfdff')),
    E(15, 14, 7.6, 6.4, '#ffffff'), F(E(13, 12, 3.4, 2, '#fbfdff')),
    F(E(12.4, 14.4, 0.9, 1.1, '#3a2d4f')), F(E(17.6, 14.4, 0.9, 1.1, '#3a2d4f')), F(E(15, 16.8, 1.4, 0.7, '#ff8a6a')),
    F(E(10.8, 16.4, 1.4, 0.8, '#ffc4d4')), F(E(19.2, 16.4, 1.4, 0.8, '#ffc4d4')),
    R(8.6, 19, 12.8, 3, scarf), R(18, 20, 3, 7, scarf), F(R(8.6, 19, 12.8, 1, shade(scarf, 30))),
    F(T([[5, 21], [1, 16], [2, 15.6], [5.8, 20.4]], '#8a6a50')), F(T([[25, 21], [29, 16], [28, 15.6], [24.2, 20.4]], '#8a6a50')),
    E(15, 6.6, 3.6, 3, '#ff9a3a'), F(E(14, 5.6, 1.2, 0.8, '#ffc890')), F(E(16.4, 3.6, 1.6, 0.8, '#6cb050')),
  ];
});
// The giant snow mochi by the finish: a big two-ball snow mochi in a scarf and a bobble hat, waving
// one twig arm (and both, hopping, as yours comes home).
const bigSnowArt = () => art('mc-bigsnow', 80, 96, () => [
  F(E(40, 94, 30, 2.4, '#dce6f6')), E(40, 72, 30, 22, '#ffffff'), F(E(31, 64, 14, 8, '#fbfdff')), F(E(40, 90, 26, 3, '#e8eef8')),
  E(40, 38, 21, 18, '#ffffff'), F(E(33, 31, 9, 6, '#fbfdff')),
  F(E(33, 38, 2.4, 2.8, '#3a2d4f')), F(E(47, 38, 2.4, 2.8, '#3a2d4f')), F(E(32.4, 37, 0.8, 0.8, '#ffffff')), F(E(46.4, 37, 0.8, 0.8, '#ffffff')),
  F(T([[36, 44], [44, 44], [40, 47.4]], '#e8607a')), F(E(28, 43, 3.4, 1.8, '#ffc4d4')), F(E(52, 43, 3.4, 1.8, '#ffc4d4')),
  R(20, 52, 40, 7, '#8fc8ff'), F(R(20, 52, 40, 2, '#c4e2ff')), ...[24, 32, 40, 48, 56].map((x) => F(R(x, 52, 2, 7, '#ffffff'))), R(46, 56, 8, 18, '#8fc8ff'), F(R(46, 70, 8, 3, '#ffffff')),
  ...[64, 72, 80].map((y) => F(E(40, y, 2.2, 2.2, '#a8b4d0'))),
  T([[22, 24], [40, 7], [58, 24]], '#ff8fb0'), F(T([[26, 24], [40, 10.5], [44, 24]], '#ffb0c8')), R(20, 22, 40, 5, '#ffffff'), E(40, 6, 4, 4, '#ffffff'),
]);
function bigSnow(ctx, map, x, gy, wx, time) {
  const R = live(time) && RUN.map === map ? RUN.R : null;
  const mo = R ? momentsOf(R) : {};
  const k = mo.home != null ? time - mo.home : -1;
  const hop = k > 0 && k < 0.5 ? Math.sin((k / 0.5) * Math.PI) * 4 : 0;
  // The twig arms, one waving (both when yours is home).
  const arm = (sx, dir, a) => {
    ctx.strokeStyle = '#8a6a50';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    const ex = sx + Math.cos(a) * 20 * dir;
    const ey = gy - 52 - hop - Math.sin(a) * 20;
    ctx.beginPath();
    ctx.moveTo(sx, gy - 46 - hop);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.fillStyle = '#ff8fb0';
    ctx.beginPath();
    ctx.arc(ex, ey, 3, 0, TAU);
    ctx.fill();
    ctx.lineCap = 'butt';
  };
  const wave = Math.sin(time * 3) * 0.35;
  arm(x - 26, -1, k > 0 && k < 3 ? 0.9 + Math.sin(k * 9) * 0.4 : 0.2);
  arm(x + 26, 1, 0.6 + wave + (k > 0 && k < 3 ? Math.sin(k * 9 + 1) * 0.4 : 0));
  place(ctx, bigSnowArt(), snap(x), gy + 2 - hop);
  if (k > 0 && k < 1.6) {
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * TAU + k;
      const d = 26 + k * 24;
      ctx.globalAlpha = Math.max(0, 1 - k / 1.6);
      place(ctx, flakeArt(), x + Math.cos(ang) * d, gy - 50 + Math.sin(ang) * d * 0.7);
    }
    ctx.globalAlpha = 1;
  }
}
// The hot cocoa stall: a wooden counter under a striped awning, a big pot steaming, mugs lined up;
// its keeper behind the counter waving at the race (and always as yours goes by).
const cocoaBackArt = () => art('mc-cocoa-b', 60, 56, () => [
  R(6, 14, 4, 42, '#a8703e'), R(50, 14, 4, 42, '#a8703e'), R(8, 20, 44, 20, '#f6e6d6'),
  ...[0, 1, 2, 3, 4, 5].map((i) => T([[2 + i * 9.4, 6], [11.4 + i * 9.4, 6], [11.4 + i * 9.4, 16], [6.7 + i * 9.4, 19], [2 + i * 9.4, 16]], i % 2 ? '#ffffff' : '#e8607a')),
  F(R(2, 4, 56, 3, '#c84860')), F(E(30, 3, 26, 2.4, '#ffffff')),
]);
const cocoaFrontArt = () => art('mc-cocoa-f', 60, 30, () => [
  R(4, 12, 52, 17, '#c8945a'), F(R(4, 12, 52, 2.4, '#e2b47a')), R(18, 16, 24, 9, '#fff6ea'), F(R(19.5, 17.5, 21, 6, '#8a5a40')),
  R(8, 4, 12, 8, '#7a7a8a'), F(E(14, 4, 6, 1.6, '#6a4030')), ...[26, 32, 38, 44].map((x) => R(x, 7, 4.4, 5, ['#ff8fb0', '#8fc8ff', '#ffd75e', '#ffffff'][(x / 6) % 4 | 0])),
]);
function cocoa(ctx, map, x, gy, wx, time) {
  place(ctx, cocoaBackArt(), snap(x), gy - 6);
  const youX = live(time) && RUN.map === map ? RUN.you.x : null;
  const near = youX != null && Math.abs(youX - wx) < 90;
  const h = hash(wx);
  const period = near ? 0.9 : 3.6 + h * 2;
  const into = (time + h * 7) % period;
  const beat = into < 0.9 ? CHEER_SEQ[Math.min(CHEER_SEQ.length - 1, Math.floor((into / 0.9) * CHEER_SEQ.length))] : 0;
  ctx.save();
  ctx.translate(x - 4, gy - 16);
  ctx.scale(0.64, 0.64);
  drawSpectator(ctx, picnickers()[(Math.floor(h * 12)) % 12], 0, 0, beat, youX != null && youX < wx ? -1 : 1, `cocoa|${wx}`);
  ctx.restore();
  place(ctx, cocoaFrontArt(), snap(x), gy + 2);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const u = (time * 0.35 + i / 3) % 1;
    const sx = x - 16 + i * 3;
    const sy = gy - 30 - u * 22;
    ctx.globalAlpha = Math.sin(u * Math.PI) * 0.5;
    ctx.beginPath();
    ctx.moveTo(sx + Math.sin(u * 6 + i) * 2, sy + 5);
    ctx.quadraticCurveTo(sx + Math.sin(u * 6 + i + 1.5) * 3.5, sy, sx + Math.sin(u * 6 + i + 3) * 2, sy - 5);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.lineCap = 'butt';
}
// The backdrop: snow-capped peaks rising out of a sea of clouds, the clouds rolling slowly by.
COURSES.snow = {
  far(ctx, t, cam, width, y0, time) {
    const air = t.sky[1];
    goldenSky(ctx, width, y0, goldenOf(RUN.map?.night ?? 0));
    clouds(ctx, cam, width, time, t.face === 'moon');
    for (const [at, w, h] of [[120, 260, 120], [470, 320, 150], [860, 240, 105], [1220, 300, 135]]) {
      const sx = at - cam.x * 0.03;
      if (sx > -w && sx < width + w) mountain(ctx, sx, y0 + 18, w, h, air);
    }
    seaOfClouds(ctx, cam, width, y0 + 14, 0.05, time, air, 0.5, 9);
    return true;
  },
  mid(ctx, t, cam, width, y0, time) {
    const air = t.sky[1];
    seaOfClouds(ctx, cam, width, y0 - 4, 0.3, time, air, 0.2, 14);
    return true;
  },
};
// A sea of clouds: rows of soft round puffs, lit on top, a lilac shade under, drifting along.
function seaOfClouds(ctx, cam, width, y, par, time, air, haze, r0) {
  const drift = time * (par * 6);
  for (let row = 0; row < 2; row++) {
    const off = cam.x * par + drift * (row ? 0.7 : 1);
    const step = r0 * 1.3;
    const first = Math.floor(off / step) - 2;
    for (let k = 0; k < width / step + 5; k++) {
      const i = first + k;
      const px = i * step - off + (row ? step / 2 : 0);
      const h = hash(i * 1.7 + row * 31);
      const r = r0 * (0.75 + h * 0.6);
      const py = y + row * r0 * 0.9 + (1 - h) * 4;
      ctx.fillStyle = mix('#c8c4e8', air, haze);
      ctx.beginPath();
      ctx.arc(px, py + 2, r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = mix(row ? '#f4f2fc' : '#ffffff', air, haze * 0.6);
      ctx.beginPath();
      ctx.arc(px - 1, py, r * 0.94, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = mix('#ecebf8', air, haze);
    ctx.fillRect(0, y + row * r0 * 0.9 + r0 * 0.5, width, 600);
  }
}
// Cloud Glide's ground and edge: snow over a frosty bed, pebbles of ice, lost mittens and mandarins
// for its treats; snow drifts along the top, sprigs of evergreen with red berries, snowdrops.
GROUND_SPECS.snow = {
  layers: [
    { top: 10, bot: 24, c: '#c8d4f0', a: 0.5, amp: 2.4, f: 0.043, rim: '#ffffff' },
    { top: 31, bot: 35, c: '#ffffff', a: 0.7, amp: 3, f: 0.031, rim: null },
    { top: 56, bot: 74, c: '#b4c0e4', a: 0.42, amp: 3.6, f: 0.021, rim: '#e8eeff' },
    { top: 88, bot: 91, c: '#f4f6ff', a: 0.5, amp: 3, f: 0.036, rim: null },
  ],
  pebbles: ['#d8e8ff', '#e8dcff', '#ffffff', '#dceef8', '#f0e4f8', '#e4f4f0'],
  flecks: ['#ffffff', '#e8f0ff', '#c8d8f8'],
  treats: [10, 11, 2, 4, 10, 11],
  near: 'mr_pine',
};
EDGE_KINDS.snow = (ctx, along, time, seed, width, camX) => {
  const drifts = [];
  const sprigs = [];
  const drops = [];
  along(9, (x, y, k) => {
    if (x < -10 || x > width + 10) return;
    const h = hash(k * 2.3 + seed * 7);
    if (h < 0.22) drifts.push([x, y, h]);
    else if (h < 0.3) sprigs.push([x, y, h, k]);
    else if (h < 0.35) drops.push([x, y, h, Math.sin(time * 2 + (x + camX) * 0.06) * 0.5 + pushAt(x + camX, time) * 0.5]);
  });
  ctx.fillStyle = '#ffffff';
  for (const [x, y, h] of drifts) {
    ctx.beginPath();
    ctx.ellipse(x, y - 0.6, 4 + h * 10, 2 + h * 3, 0, Math.PI, TAU);
    ctx.fill();
  }
  for (const [x, y, h, k] of sprigs) {
    ctx.strokeStyle = '#3f7a68';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const a of [-0.5, 0, 0.5]) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.sin(a) * 6, y - Math.cos(a) * 6);
    }
    ctx.stroke();
    ctx.fillStyle = '#e84a5a';
    for (let b = 0; b < 3; b++) {
      ctx.beginPath();
      ctx.arc(x - 1 + b * 1.6, y - 2.4 - (b % 2), 1, 0, TAU);
      ctx.fill();
    }
  }
  for (const [x, y, h, sway] of drops) {
    ctx.strokeStyle = '#7cb46a';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + sway, y - 5, x + 2 + sway, y - 7);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x + 2.4 + sway, y - 5.4, 1.4, 2, 0.3, 0, TAU);
    ctx.fill();
  }
};
// Cloud Glide's cloud fluff on the landing field (where a racer coming down early is slowed): soft
// cloud puffs with snow dusted on their tops, lilac shadows under, and now and then a faint glint.
const snowFluffArt = (w) => art(`mc-snowfluff|${w}`, w, 42, () => {
  const out = [];
  const taper = (cx) => Math.max(0.35, Math.min(1, Math.min(cx, w - cx) / 70));
  for (let x = 6, k = 0; x < w - 6; x += 24, k++) {
    const r = (13 + hash(k * 3.3 + w) * 9) * taper(x + 8);
    out.push(E(Math.max(r + 1, Math.min(w - r - 1, x + 8)), 42 - r * 0.7, r, r * 0.72, '#d8dcf4'));
  }
  for (let x = 0, k = 0; x < w; x += 20, k++) {
    const r = (10 + hash(k * 7.1 + w * 0.3) * 8) * taper(x + 6);
    const px = Math.max(r + 1, Math.min(w - r - 1, x + 6));
    out.push(F(E(px, 42 - r * 0.9, r, r * 0.76, '#ffffff')), F(E(px - r * 0.25, 42 - r * 1.25, r * 0.55, r * 0.3, '#f6f8ff')));
  }
  return out;
});
function snowFluff(ctx, x, gy, w, wx, time) {
  place(ctx, snowFluffArt(w), snap(x + w / 2), gy + 8);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < Math.floor(w / 60); i++) {
    const tw = Math.sin(time * 1.6 + i * 2.3 + wx);
    if (tw < 0.7) continue;
    const gx = x + 20 + hash(i * 3.7 + wx) * (w - 40);
    ctx.globalAlpha = (tw - 0.7) * 2.6;
    ctx.fillRect(gx - 0.5, gy - 14 - hash(i * 1.9) * 10, 1, 3);
    ctx.fillRect(gx - 1.5, gy - 13 - hash(i * 1.9) * 10, 3, 1);
  }
  ctx.globalAlpha = 1;
}
// Behind each glider, a faint wind trail: two thin curved strokes streaming back from it, fading.
function glideTrails(ctx, R, cam) {
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.8;
  for (const r of R.racers) {
    if (r.m.mode !== 'fly') continue;
    const x = r.x - cam.x;
    const y = r.y - cam.y - 10;
    ctx.globalAlpha = 0.38;
    for (const dy of [-3, 3]) {
      ctx.beginPath();
      ctx.moveTo(x - 6, y + dy);
      ctx.quadraticCurveTo(x - 18, y + dy - 3, x - 32, y + dy - 6);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}
// A light snowfall over the course (behind the racers): a few small flakes drifting down, swaying.
function snowfall(ctx, R, time) {
  const vw = 640 / (R.cam?.zoom ?? 1);
  const vh = 360 / (R.cam?.zoom ?? 1);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 26; i++) {
    const h = hash(i * 3.17 + 1);
    const fall = 10 + h * 10;
    const y = ((time * fall + h * 900) % (vh + 20)) - 10;
    const x = ((h * vw * 1.7 + Math.sin(time * 0.8 + i) * 8 + time * 4) % (vw + 20) + vw + 20) % (vw + 20) - 10;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.arc(x, y, 0.8 + h * 0.9, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
// Each frame of a snow race: yours taking off (the streamers whip, sparkles fly), passing the
// marker post, and every racer landing in a puff of snow.
function noteSnow(map, R, mo, time) {
  for (const r of R.racers) {
    const was = r.snowMode;
    r.snowMode = r.m.mode;
    if (R.phase !== 'run' || !was || was === r.m.mode) continue;
    if (r.m.mode === 'fly' && r.you) {
      mo.launch ??= time;
      for (let k = 0; k < 14; k++) drop(r.x + Math.random() * 6, r.y - 4 - Math.random() * 10, 20 + Math.random() * 60, -30 - Math.random() * 50, 1.2, k % 2 ? '#fff4b0' : '#ffffff');
    }
    if (was === 'fly' && r.m.mode === 'run') {
      const gy = groundAt(map, r.x);
      if (RINGS.length < 40) RINGS.push({ x: r.x, y: gy, t: time });
      for (let k = 0; k < (r.you ? 14 : 8); k++) drop(r.x + (Math.random() - 0.5) * 10, gy - 1, (Math.random() - 0.5) * 70, -30 - Math.random() * 50, 1, SNOWS[k % 3]);
    }
  }
  if (R.phase === 'run') for (const [kind, wx] of map.townPieces ?? []) if (kind === 'mr_marker' && RUN.you.x >= wx) (mo.markers ??= {})[wx] ??= time;
}
// ---------- Long Hill Run ('course:sweets'; its redraw, 2026-11-13) ----------
// Wagashi hills: a land of Japanese sweets. Far off, hills of soft daifuku domes under a
// strawberry-milk sky with candy-floss clouds, and a castle built of monaka wafers; nearer, dango
// trees and swirls of cream. On the course: rolling hills of sponge cake under white frosting,
// dango-skewer trees beside the track, picnickers on each hilltop (cheering as yours comes over),
// a sweets market at the finish and a giant dango by it (it bounces as yours comes home).
const DANGO = ['#ffb7cf', '#fff6ee', '#b8e09c'];
const SPRINKLES = ['#ff8fb0', '#8fd3ff', '#ffd75e', '#9fe0a0', '#c8a8f0', '#ffffff'];
// A dango tree: a slim stick trunk, branches like skewers, each ending in a bunch of three dango.
const dangoTreeArt = (v, size) => art(`mc-dangotree|${v}|${size}`, size ? 70 : 44, size ? 100 : 62, () => {
  const W = size ? 70 : 44;
  const H = size ? 100 : 62;
  const k = size ? 1 : 0.62;
  const cx = W / 2;
  const out = [R(cx - 2 * k, H * 0.45, 4 * k, H * 0.55, '#c8945a'), F(R(cx - 2 * k + 2.6 * k, H * 0.45, 1.2 * k, H * 0.55, '#a8703e')), F(E(cx, H - 2, 12 * k, 1.4, '#ecd4dc'))];
  const sticks = [[-0.9, 0.42], [0, 0.18], [0.9, 0.38], [-0.45, 0.28], [0.5, 0.26]];
  sticks.forEach(([dx, top], i) => {
    const ex = cx + dx * 20 * k;
    const ey = H * top;
    out.push(T([[cx - 1, H * 0.5], [ex - 0.7, ey + 16 * k], [ex + 0.7, ey + 16 * k], [cx + 1, H * 0.5]], '#c8945a'));
    for (let b = 0; b < 3; b++) {
      const c = DANGO[(b + i + v) % 3];
      out.push(E(ex, ey + b * 7 * k, 5.6 * k, 5.2 * k, c), F(E(ex - 1.6 * k, ey + b * 7 * k - 1.8 * k, 1.6 * k, 1.1 * k, '#ffffff')));
    }
  });
  return out;
});
function drawDangoTree(ctx, x, foot, v, size, time, wx, shake = 0) {
  const a = (lean(time, wx, 0.25, v) + 0.1) * 0.03 + shake;
  pivoted(ctx, x, foot, a, () => place(ctx, dangoTreeArt(v, size), snap(x), foot + 2));
}
// The monaka castle, far off: walls and towers of crisp wafer, their criss-cross pattern, roofs like
// pink mochi caps.
const monakaCastleArt = () => art('mc-monakacastle', 66, 50, () => {
  const out = [];
  const wafer = (x, y, w, h) => {
    out.push(R(x, y, w, h, '#e8c088'));
    for (let i = 3; i < w - 1; i += 4) out.push(F(R(x + i, y + 1, 0.6, h - 2, '#d4a46c')));
    for (let j = 3; j < h - 1; j += 4) out.push(F(R(x + 1, y + j, w - 2, 0.6, '#d4a46c')));
  };
  wafer(10, 24, 46, 26);
  wafer(4, 16, 12, 34);
  wafer(50, 16, 12, 34);
  wafer(26, 10, 14, 40);
  for (const [x, w, y] of [[10, 6, 16], [56, 6, 16], [33, 7, 10]]) out.push(E(x, y, w + 0.5, 4, '#ffb7cf'), F(E(x - 1.5, y - 1.4, 2.6, 1.3, '#ffd8e4')), F(E(x, y - 4.4, 1.2, 1.2, '#b8e09c')));
  out.push(R(29, 38, 8, 12, '#a8703e'), F(E(33, 38, 4, 2.4, '#a8703e')));
  return out;
});
// A candy-floss cloud: soft round puffs in pink or sky blue, drifting.
function flossClouds(ctx, cam, width, y0, time, air) {
  for (let i = 0; i < 6; i++) {
    const h = hash(i * 4.7 + 1);
    const span = width + 200;
    const x = ((h * span - cam.x * 0.04 + time * (3 + h * 3)) % span + span) % span - 100;
    const y = y0 - 62 + h * 36;
    const c = mix(i % 2 ? '#bfe0ff' : '#ffc4dc', air, 0.25);
    ctx.fillStyle = c;
    for (const [dx, dy, r] of [[-16, 2, 10], [0, -4, 14], [16, 1, 11], [8, 6, 9], [-6, 6, 9]]) {
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, r, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = mix('#ffffff', air, 0.2);
    ctx.beginPath();
    ctx.arc(x - 4, y - 8, 6, 0, TAU);
    ctx.fill();
  }
}
// Hills of daifuku, far off: soft round domes, white, pink and green, a dusting of flour on top.
function daifukuHills(ctx, cam, width, y, par, air, haze, size) {
  const step = size * 1.5;
  const off = cam.x * par;
  const first = Math.floor(off / step) - 2;
  for (let k = 0; k < width / step + 5; k++) {
    const i = first + k;
    const px = i * step - off;
    const h = hash(i * 2.3 + size);
    const r = size * (0.8 + h * 0.5);
    const c = ['#fff6f0', '#ffd0e0', '#d4ecc0'][((i % 3) + 3) % 3];
    ctx.fillStyle = mix(shade(c, -14), air, haze);
    ctx.beginPath();
    ctx.ellipse(px, y + 2, r + 1.5, r * 0.78 + 1.5, 0, Math.PI, TAU);
    ctx.fill();
    ctx.fillStyle = mix(c, air, haze);
    ctx.beginPath();
    ctx.ellipse(px, y + 2, r, r * 0.78, 0, Math.PI, TAU);
    ctx.fill();
    ctx.fillStyle = mix('#ffffff', air, haze * 0.6);
    ctx.beginPath();
    ctx.ellipse(px - r * 0.3, y - r * 0.5, r * 0.3, r * 0.12, -0.3, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = mix('#fff0f4', air, haze);
  ctx.fillRect(0, y + 2, width, 400);
}
COURSES.sweets = {
  far(ctx, t, cam, width, y0, time) {
    const air = t.sky[1];
    goldenSky(ctx, width, y0, goldenOf(RUN.map?.night ?? 0));
    flossClouds(ctx, cam, width, y0, time, air);
    daifukuHills(ctx, cam, width, y0 + 4, 0.04, air, 0.55, 24);
    const cx = 250 - cam.x * 0.06;
    if (cx > -80 && cx < width + 80) place(ctx, monakaCastleArt(), cx, y0 + 16);
    daifukuHills(ctx, cam, width, y0 + 22, 0.1, air, 0.4, 16);
    return true;
  },
  mid(ctx, t, cam, width, y0, time) {
    const air = t.sky[1];
    const land = hills(ctx, cam, width, y0 + 6, 10, 0.45, 5.3, mix('#d4ecc0', air, 0.16), mix('#ecf8e0', air, 0.12));
    repeat(cam.x, 0.45, 96, width, (i, x) => {
      const s = hash(i * 2.9 + 7);
      const tx = x + hash(i * 1.7) * 36;
      const wx = tx + cam.x * 0.45;
      if (MARKET.some((m) => Math.abs(wx - m.at) < 60)) return;
      if (s > 0.35) drawDangoTree(ctx, tx, land(tx) + 2, Math.floor(hash(i * 3.9) * 3), 0, time, wx);
      if (s < 0.6) {
        // A swirl of whipped cream.
        const cx = tx + 42;
        const cy = land(cx) + 3;
        for (const [dy, r] of [[0, 9], [-6, 6.6], [-11, 4.2]]) {
          ctx.fillStyle = mix('#f4ece8', air, 0.15);
          ctx.beginPath();
          ctx.ellipse(cx, cy + dy, r + 1, r * 0.55 + 1, 0, 0, TAU);
          ctx.fill();
          ctx.fillStyle = mix('#ffffff', air, 0.12);
          ctx.beginPath();
          ctx.ellipse(cx - 0.6, cy + dy - 0.6, r, r * 0.55, 0, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = mix('#ff6a7a', air, 0.15);
        ctx.beginPath();
        ctx.arc(cx, cy - 16, 2.4, 0, TAU);
        ctx.fill();
      }
    });
    const youX = live(time) && RUN.map?.look?.groundArt === 'sweets' ? RUN.you.x - cam.x : null;
    for (const m of MARKET) {
      const sx = m.at - cam.x * 0.45;
      if (sx > -60 && sx < width + 60) stall(ctx, m, sx, land(sx) + 4, time, youX);
    }
    return true;
  },
};
// Long Hill Run's ground and edge: sponge cake under frosting, cream and jam layers, sprinkles
// pressed in; sprinkles and little star candies on top. (Drips down the frosting were tried: white
// was lost on the white, syrup-pink read as pegs.)
GROUND_SPECS.sweets = {
  layers: [
    { top: 10, bot: 22, c: '#fff4f0', a: 0.75, amp: 2, f: 0.043, rim: '#ffffff' },
    { top: 30, bot: 34, c: '#ff9ab4', a: 0.6, amp: 2.6, f: 0.031, rim: '#ffc4d4' },
    { top: 54, bot: 66, c: '#fff4f0', a: 0.65, amp: 3, f: 0.021, rim: '#ffffff' },
    { top: 84, bot: 88, c: '#b8e09c', a: 0.55, amp: 3, f: 0.036, rim: '#d8f0c4' },
  ],
  pebbles: ['#ffb7cf', '#bfe0ff', '#fff1c4', '#d4f0c4', '#e8d4ff', '#ffffff'],
  flecks: ['#ff8fb0', '#8fd3ff', '#ffd75e'],
  treats: [0, 1, 4, 0, 1],
  near: 'mr_dango',
};
EDGE_KINDS.sweets = (ctx, along, time, seed, width) => {
  const sprinks = [];
  const stars = [];
  along(9, (x, y, k) => {
    if (x < -10 || x > width + 10) return;
    const h = hash(k * 2.3 + seed * 7);
    if (h < 0.14) sprinks.push([x, y, h, k]);
    else if (h < 0.18) stars.push([x, y, h, k]);
  });
  for (const [x, y, h, k] of sprinks) {
    for (let s = 0; s < 3; s++) {
      ctx.save();
      ctx.translate(x + s * 3 - 3, y - 1.2 - (s % 2));
      ctx.rotate((h * 9 + s * 1.7) % 3);
      ctx.fillStyle = SPRINKLES[(k + s) % SPRINKLES.length];
      ctx.fillRect(-1.2, -0.4, 2.4, 0.9);
      ctx.restore();
    }
  }
  for (const [x, y, h, k] of stars) {
    ctx.fillStyle = SPRINKLES[k % 5];
    ctx.beginPath();
    for (let p = 0; p < 10; p++) {
      const a = (p / 10) * TAU - Math.PI / 2;
      const r = p % 2 ? 1.1 : 2.4;
      const px = x + Math.cos(a) * r;
      const py = y - 2.4 + Math.sin(a) * r;
      if (p) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
};
// The giant dango by the finish: three big balls, pink, white and green, high on a long skewer stuck
// in the ground behind the podium (so through the prizes its top two still show over it), a little
// face on the white one, a ribbon tied on the stick; it bounces and sprinkles fly off it as yours
// comes home.
const bigDangoArt = () => art('mc-bigdango', 50, 150, () => [
  R(23, 6, 4, 144, '#c8945a'), F(R(25.6, 6, 1.2, 144, '#a8703e')), F(E(25, 148, 14, 1.4, '#ecd4dc')),
  E(25, 68, 19, 17, '#b8e09c'), F(E(18, 62, 7, 4, '#d8f0c4')),
  E(25, 44, 19, 17, '#fff6ee'), F(E(18, 38, 7, 4, '#ffffff')),
  E(25, 20, 19, 17, '#ffb7cf'), F(E(18, 13, 7, 4, '#ffd8e4')), F(E(15, 11, 2, 1.2, '#ffffff')),
  T([[25, 96], [14, 92], [14, 101]], '#ff8fb0'), T([[25, 96], [36, 92], [36, 101]], '#ff8fb0'), E(25, 96, 3, 3, '#e8607a'),
  F(E(19, 46, 1.6, 1.8, '#3a2d4f')), F(E(31, 46, 1.6, 1.8, '#3a2d4f')), F(T([[23, 51], [27, 51], [25, 53]], '#e8607a')), F(E(15, 50, 2.4, 1.2, '#ffc4d4')), F(E(35, 50, 2.4, 1.2, '#ffc4d4')),
]);
function bigDango(ctx, map, x, gy, wx, time) {
  const R = live(time) && RUN.map === map ? RUN.R : null;
  const mo = R ? momentsOf(R) : {};
  const k = mo.home != null ? time - mo.home : -1;
  const hop = k > 0 && k < 1.35 ? Math.abs(Math.sin(k * 7)) * 10 * Math.exp(-k * 2) : 0;
  pivoted(ctx, x, gy, Math.sin(time * 1.2 + wx) * 0.015, () => place(ctx, bigDangoArt(), snap(x), gy + 2 - hop));
  if (k > 0 && k < 1.6) {
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * TAU + k;
      const d = 24 + k * 22;
      ctx.globalAlpha = Math.max(0, 1 - k / 1.6);
      ctx.fillStyle = SPRINKLES[i % SPRINKLES.length];
      ctx.fillRect(x + Math.cos(ang) * d - 1.2, gy - 104 + Math.sin(ang) * d * 0.7 - 0.5, 2.4, 1);
    }
    ctx.globalAlpha = 1;
  }
}
// Each frame of a sweets race: yours coming over a hilltop (its picnickers cheer it over).
function noteSweets(map, R, mo, time) {
  if (R.phase !== 'run') return;
  for (const [kind, wx] of map.townPieces ?? []) if (kind === 'mr_fans' && RUN.you.x >= wx + CREST_AHEAD) (mo.crests ??= {})[wx] ??= time;
}
// A picnic on a hilltop: a blanket and two or three Mochi on it watching the race; as yours comes
// over the top they're up on their feet cheering it on (and it runs on down in a soft gust).
function fans(ctx, map, x, gy, wx, time, v) {
  const youX = live(time) && RUN.map === map ? x + (RUN.you.x - wx) : null;
  picnic(ctx, x, gy - 3, 31 + v * 5, time, youX);
}
// The gust behind yours as it runs down from a hilltop: two faint strokes streaming back from its
// body along the slope (low, never round its face), fading in and out over a second and a half.
function hillTrails(ctx, map, R, cam, time) {
  const at = Math.max(-99, ...Object.values(momentsOf(R).crests ?? {}));
  const k = time - at;
  if (k < 0 || k > 1.6) return;
  const r = R.racers[R.me];
  const x = r.x - cam.x;
  const y = r.y - cam.y;
  const sl = (groundAt(map, r.x + 6) - groundAt(map, r.x - 6)) / 12;
  const fade = Math.sin((Math.PI * k) / 1.6);
  ctx.lineCap = 'round';
  for (const [c, w, a] of [['#f2a6c0', 1.8, 0.45], ['#ffffff', 0.8, 0.9]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.globalAlpha = a * fade;
    for (const [dy, len] of [[-4, 30], [-9, 22]]) {
      ctx.beginPath();
      ctx.moveTo(x - 8, y + dy - 8 * sl);
      ctx.quadraticCurveTo(x - 8 - len * 0.5, y + dy - (8 + len * 0.5) * sl - 1.5, x - 8 - len, y + dy - (8 + len) * sl - 2);
      ctx.stroke();
    }
  }
  ctx.lineCap = 'butt';
  ctx.globalAlpha = 1;
}
// The sweets market in the meadow behind the last stretch: a dango stall and a candy-floss stall
// (the festival's own).
const MARKET = [{ at: 905, kind: 'dango', c: '#ff8fb0', seed: 5 }, { at: 1012, kind: 'floss', c: '#8fc8f0', seed: 11 }];
// ---------- The Grand Mochi Course ('course:matsuri'; its redraw, 2026-11-13) ----------
// A summer festival at dusk. A violet sky warming to peach at the horizon, the first stars, and
// fireworks blooming over far hills where a little town's windows are lit; nearer, a row of food
// stalls with their lanterns glowing. On the course: strings of paper lanterns over the meadow and
// the hills, lit stalls, floating lanterns drifting on the pond, a yagura (the festival's drum
// tower) to climb, a drummer on top who drums yours over, a ramp off the far tower into a glide over
// dusk-pink cloud, a firework bursting ahead as yours takes off, and a giant lantern at the finish.
const FW = ['#ffd75e', '#ff8fb0', '#8fd3ff', '#9fe0a0', '#ffffff', '#ffa86a', '#c8a8f0'];
// A soft round glow (a lantern's light), made once per size and colour and only placed after.
const GLOWS = new Map();
function glow(ctx, x, y, r, rgb = '255,200,130', a = 1) {
  const key = `${r}|${rgb}`;
  let g = GLOWS.get(key);
  if (!g) {
    g = document.createElement('canvas');
    g.width = g.height = r * 2;
    const c = g.getContext('2d');
    const grad = c.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, `rgba(${rgb},0.55)`);
    grad.addColorStop(0.45, `rgba(${rgb},0.2)`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = grad;
    c.fillRect(0, 0, r * 2, r * 2);
    GLOWS.set(key, g);
  }
  ctx.globalAlpha = a;
  ctx.drawImage(g, x - r, y - r);
  ctx.globalAlpha = 1;
}
// A paper lantern (chochin), small: black rims, ribbed paper in red or white, lit from inside.
const chochinArt = (white) => art(`mc-chochin|${white ? 1 : 0}`, 9, 13, () => {
  const c = white ? '#fff4e4' : '#f05a6a';
  const rib = white ? '#f0d8c0' : '#d0404e';
  return [
    R(3, 0, 3, 2, '#3a2a30'), E(4.5, 6.5, 4, 4.6, c), F(E(3.4, 5.4, 1.4, 2.4, white ? '#ffffff' : '#ff8a8a')),
    F(R(1.2, 4.6, 6.6, 0.6, rib)), F(R(0.8, 6.6, 7.4, 0.6, rib)), F(R(1.2, 8.6, 6.6, 0.6, rib)),
    R(2.6, 10.6, 3.8, 1.6, '#3a2a30'),
  ];
});
// One hanging lantern, its glow behind, swinging a little from where it hangs.
function chochin(ctx, x, top, white, sway, lit = 1) {
  glow(ctx, x, top + 8, 13, white ? '255,226,170' : '255,170,130', 0.9 * lit);
  pivoted(ctx, x, top, sway, () => place(ctx, chochinArt(white), snap(x), top + 13));
}
// Fireworks over the far hills: two shows, each a firework every few seconds at its own spot in the
// sky, a bright seed climbing on a fading tail, then a burst of sparks blooming out, drooping and
// fading (an inner ring in a second colour); a soft flash at the bloom.
function skyFireworks(ctx, width, y0, time) {
  for (let lane = 0; lane < 2; lane++) {
    const P = 3.6 + lane * 1.4;
    const tt = time + lane * 1.9;
    const n = Math.floor(tt / P);
    const u = tt - n * P;
    const h = hash(n * 7.3 + lane * 31);
    const x = 50 + h * (width - 100);
    const top = y0 - 12 - hash(n * 3.1 + lane * 5) * 14;
    const c = FW[Math.floor(hash(n * 5.9 + lane) * FW.length)];
    const c2 = FW[Math.floor(hash(n * 2.2 + lane + 9) * FW.length)];
    const RISE = 0.9;
    if (u < RISE) {
      const k = u / RISE;
      const yy = y0 - (y0 - top) * (1 - (1 - k) ** 2);
      for (let s = 0; s < 4; s++) {
        ctx.globalAlpha = (1 - s / 4) * 0.8;
        ctx.fillStyle = s ? c : '#fff6d8';
        ctx.fillRect(x + Math.sin((k - s * 0.03) * 9) * 0.8 - 0.6, yy + s * 3 - 0.6, 1.2, 1.2);
      }
      ctx.globalAlpha = 1;
      continue;
    }
    const k = (u - RISE) / 1.9;
    if (k > 1) continue;
    const R0 = 12 + h * 8;
    const r = R0 * (1 - (1 - Math.min(1, k * 1.6)) ** 3);
    const droop = k * k * 8;
    if (k < 0.1) glow(ctx, x, top, 20, '255,236,200', 1 - k / 0.1);
    const N = 16 + Math.floor(h * 6);
    for (let i = 0; i < N; i++) {
      const a = (i / N) * TAU + h * 3;
      for (const [f, col] of [[1, c], [0.58, c2]]) {
        const px = x + Math.cos(a) * r * f;
        const py = top + Math.sin(a) * r * f + droop * f;
        ctx.globalAlpha = Math.max(0, (1 - k) ** 1.4) * (f < 1 ? 0.85 : 1);
        ctx.fillStyle = col;
        const s = 0.8 + (1 - k) * 0.9;
        ctx.fillRect(px - s / 2, py - s / 2, s, s);
        // (A short streak back toward the middle while it's still flying out.)
        if (k < 0.45 && f === 1) {
          ctx.globalAlpha *= 0.45;
          ctx.fillRect(px - Math.cos(a) * 3 - 0.4, py - Math.sin(a) * 3 - 0.4, 0.8, 0.8);
        }
      }
    }
    ctx.globalAlpha = 1;
  }
}
// The far town: little roofs along the ridge, some windows lit, and a pagoda.
function farTown(ctx, cam, width, ridge, air, time) {
  repeat(cam.x, 0.06, 15, width, (i, x) => {
    const h = hash(i * 1.9 + 4);
    if (h < 0.25) return;
    const bx = x + hash(i * 2.7) * 6;
    const by = ridge(bx) + 3;
    const w = 7 + h * 5;
    const hh = 4 + hash(i * 3.3) * 4;
    ctx.fillStyle = mix('#5a4a88', air, 0.3);
    ctx.fillRect(bx - w / 2, by - hh, w, hh + 2);
    ctx.fillStyle = mix('#463a74', air, 0.3);
    ctx.beginPath();
    ctx.moveTo(bx - w / 2 - 1.5, by - hh);
    ctx.lineTo(bx, by - hh - 3.4);
    ctx.lineTo(bx + w / 2 + 1.5, by - hh);
    ctx.fill();
    if (h > 0.45) {
      const on = 0.75 + 0.25 * Math.sin(time * 0.7 + i * 2.1);
      ctx.fillStyle = `rgba(255,214,140,${on})`;
      ctx.fillRect(bx - 1.5 + (h > 0.75 ? 2 : 0), by - hh + 1.6, 1.4, 1.4);
    }
  });
  const px = 380 - cam.x * 0.06;
  if (px > -30 && px < width + 30) {
    const by = ridge(px) + 3;
    ctx.fillStyle = mix('#463a74', air, 0.28);
    for (let s = 0; s < 4; s++) {
      const w = 15 - s * 2.6;
      const y = by - 6 - s * 7;
      ctx.fillRect(px - w / 2 + 2, y, w - 4, 6);
      ctx.beginPath();
      ctx.moveTo(px - w / 2 - 2, y + 1);
      ctx.lineTo(px, y - 2.4);
      ctx.lineTo(px + w / 2 + 2, y + 1);
      ctx.fill();
    }
    ctx.fillRect(px - 0.5, by - 38, 1, 8);
    ctx.fillStyle = 'rgba(255,214,140,0.85)';
    ctx.fillRect(px - 0.7, by - 10, 1.4, 1.4);
  }
}
// A food stall far off, small: a striped awning, the counter lit warm inside, a lantern glowing.
const AWNINGS = ['#e8485e', '#4a7ad8', '#f07aa0', '#f0a040'];
const yataiArt = (v) => art(`mc-yatai|${v}`, 30, 24, () => {
  const c = AWNINGS[v % AWNINGS.length];
  const out = [R(3, 6, 2, 18, '#5a3a30'), R(25, 6, 2, 18, '#5a3a30'), R(5, 10, 20, 8, '#ffd890'), F(R(5, 10, 20, 2, '#ffeec0'))];
  for (let k = 0; k < 6; k++) out.push(T([[1 + k * 4.67, 3], [5.67 + k * 4.67, 3], [5.67 + k * 4.67, 8], [1 + k * 4.67, 8]], k % 2 ? '#ffffff' : c));
  for (let k = 0; k < 6; k++) out.push(E(3.33 + k * 4.67, 8, 2.33, 1.6, k % 2 ? '#ffffff' : c));
  out.push(R(2, 18, 26, 6, '#8a5a40'), F(R(2, 18, 26, 1.4, '#b07a58')));
  return out;
});
COURSES.matsuri = {
  far(ctx, t, cam, width, y0, time) {
    const air = t.sky[1];
    // The first stars, twinkling.
    for (let i = 0; i < 16; i++) {
      const h = hash(i * 9.1 + 2);
      const sy = 6 + hash(i * 4.3) * Math.max(8, y0 * 0.4);
      const sx = ((h * width * 1.3 - cam.x * 0.01) % width + width) % width;
      ctx.globalAlpha = 0.45 + 0.4 * Math.sin(time * (1 + h) + i * 2);
      ctx.fillStyle = '#fff6e0';
      ctx.fillRect(sx, sy, h > 0.8 ? 1.6 : 1, h > 0.8 ? 1.6 : 1);
    }
    ctx.globalAlpha = 1;
    hills(ctx, cam, width, y0 - 16, 46, 0.03, 2.2, mix('#7a68b0', air, 0.4), mix('#9a88c8', air, 0.32));
    skyFireworks(ctx, width, y0, time);
    const ridge = hills(ctx, cam, width, y0 + 8, 24, 0.06, 4.4, mix('#5e5294', air, 0.3), mix('#8a78b8', air, 0.26));
    farTown(ctx, cam, width, ridge, air, time);
    return true;
  },
  // The middle plane: a dusky meadow, the festival's stalls along it with lanterns strung between,
  // a torii here and there.
  mid(ctx, t, cam, width, y0, time) {
    const air = t.sky[1];
    const land = hills(ctx, cam, width, y0 + 6, 9, 0.45, 7.7, mix('#4f8a7c', air, 0.22), mix('#7ab09a', air, 0.18));
    const tops = [];
    repeat(cam.x, 0.45, 70, width, (i, x) => {
      const h = hash(i * 3.7 + 1);
      const sx = x + hash(i * 1.3) * 16;
      const gy = land(sx) + 3;
      if (h < 0.18) {
        // A torii.
        ctx.fillStyle = mix('#d84a3a', air, 0.18);
        ctx.fillRect(sx - 9, gy - 24, 2, 24);
        ctx.fillRect(sx + 7, gy - 24, 2, 24);
        ctx.fillRect(sx - 12, gy - 26, 24, 2.4);
        ctx.fillRect(sx - 9, gy - 20, 18, 1.6);
        ctx.fillStyle = mix('#3a2a30', air, 0.2);
        ctx.fillRect(sx - 13, gy - 27.4, 26, 1.6);
        return;
      }
      place(ctx, yataiArt(Math.floor(h * 8)), snap(sx), gy + 1);
      glow(ctx, sx, gy - 10, 14, '255,210,140', 0.7);
      tops.push([sx, gy - 22]);
      const lx = sx + 10;
      pivoted(ctx, lx, gy - 21, Math.sin(time * 1.4 + i) * 0.08, () => {
        glow(ctx, lx, gy - 16, 8, '255,170,130', 0.9);
        ctx.fillStyle = '#f05a6a';
        ctx.beginPath();
        ctx.ellipse(lx, gy - 16, 2.2, 2.8, 0, 0, TAU);
        ctx.fill();
      });
    });
    // Lantern strings between the stall roofs: a gently sagging cord, little lit dots along it.
    for (let i = 1; i < tops.length; i++) {
      const [ax, ay] = tops[i - 1];
      const [bx, by] = tops[i];
      if (bx - ax > 90) continue;
      ctx.strokeStyle = mix('#3a2a30', air, 0.3);
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + 7, bx, by);
      ctx.stroke();
      for (let k = 1; k < 6; k++) {
        const u = k / 6;
        const px = ax + (bx - ax) * u;
        const py = ay + (by - ay) * u + 4 * u * (1 - u) * 7 + 1.4;
        ctx.fillStyle = k % 2 ? '#ffe2a8' : '#ff8a8a';
        ctx.fillRect(px - 0.8, py - 0.8, 1.6, 1.8);
      }
    }
    return true;
  },
};
// The ground: a dusky meadow, its soil warm with lantern-light, festival confetti pressed into it;
// lost things in it: a ramune marble, a star coin, a paper fan, a candy apple. Along the top,
// morning glories closed up for the evening and the odd scrap of confetti.
GROUND_SPECS.matsuri = {
  layers: [
    { top: 10, bot: 24, c: '#c88a84', a: 0.5, amp: 2.4, f: 0.043, rim: '#f0c4b8' },
    { top: 31, bot: 35, c: '#fff0e4', a: 0.6, amp: 3, f: 0.031, rim: null },
    { top: 56, bot: 74, c: '#a87884', a: 0.42, amp: 3.6, f: 0.021, rim: '#d8a8a8' },
    { top: 88, bot: 91, c: '#fde0d4', a: 0.5, amp: 3, f: 0.036, rim: null },
  ],
  pebbles: ['#d8d0f4', '#c8e8dc', '#fde0c8', '#ffd0dc', '#d0e0f8', '#fff0c4'],
  flecks: ['#ffd75e', '#ff8fb0', '#8fd3ff'],
  treats: [2, 4, 12, 13, 12, 13],
  near: null,
};
const GLORIES = ['#7a8ae8', '#b07ad8', '#e87ab0'];
EDGE_KINDS.matsuri = (ctx, along, time, seed, width, camX) => {
  const glories = [];
  const bits = [];
  along(9, (x, y, k) => {
    if (x < -10 || x > width + 10) return;
    const h = hash(k * 2.9 + seed * 5);
    if (h < 0.1) glories.push([x, y, h, k]);
    else if (h < 0.16) bits.push([x, y, h, k]);
  });
  for (const [x, y, h, k] of glories) {
    // A curl of vine, two heart leaves, a morning glory's trumpet (closed at dusk: a twist).
    const sway = Math.sin(time * 1.6 + (x + camX) * 0.05) * 0.6;
    ctx.strokeStyle = '#4f9a62';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - 2, y - 4, x + sway, y - 7);
    ctx.stroke();
    ctx.fillStyle = '#5aae6c';
    ctx.beginPath();
    ctx.ellipse(x - 2.4, y - 3, 1.8, 1.2, -0.5, 0, TAU);
    ctx.ellipse(x + 2.2, y - 5, 1.6, 1.1, 0.5, 0, TAU);
    ctx.fill();
    const c = GLORIES[k % GLORIES.length];
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x + sway - 1.6, y - 7);
    ctx.lineTo(x + sway + 1.6, y - 7);
    ctx.lineTo(x + sway + 0.6, y - 11);
    ctx.lineTo(x + sway - 0.6, y - 11);
    ctx.fill();
    ctx.fillStyle = mix(c, '#ffffff', 0.5);
    ctx.fillRect(x + sway - 0.3, y - 10.6, 0.6, 3);
  }
  for (const [x, y, h, k] of bits) {
    ctx.save();
    ctx.translate(x, y - 1.2);
    ctx.rotate(h * 20);
    ctx.fillStyle = FW[k % FW.length];
    ctx.fillRect(-1.3, -0.6, 2.6, 1.2);
    ctx.restore();
  }
};
// ---- The pond: floating lanterns (toro nagashi) ----
// Little square paper lanterns on wooden bases, a candle lit in each, drifting on the dusk pond and
// bobbing on the swell, a warm streak of their light on the water under each; a swimmer coming
// past rocks them aside and they ease back.
const toroFloatArt = (v) => art(`mc-toroflt|${v}`, 12, 14, () => [
  R(1, 10, 10, 3, '#8a5a40'), F(R(1, 10, 10, 1, '#b07a58')),
  R(2, 2, 8, 8, '#fff2d8'), F(R(2, 2, 1.4, 8, '#ffe0a8')), F(R(8.6, 2, 1.4, 8, '#ffe0a8')),
  R(1.4, 1, 9.2, 1.6, ['#e8485e', '#4a7ad8', '#f07aa0'][v % 3]),
  F(E(6, 7, 1.4, 2, '#ffd27a')), F(E(6, 6.4, 0.6, 1, '#fffbe8')),
]);
function duskLanterns(ctx, map, cam, time) {
  const w = (map.water ?? []).find((x) => x.kind === 'dusk');
  if (!w) return;
  const x1 = cam.x + 700;
  const at = (x) => w.y - cam.y + swell(x, time) - 1;
  const L = w.x2 - w.x1 - 60;
  const n = Math.round(L / 44);
  for (let i = 0; i < n; i++) {
    const h = hash(i * 4.1 + 3);
    let wx = w.x1 + 30 + ((i + 0.5) / n) * L + Math.sin(time * 0.25 + i * 1.7) * 8;
    let dip = 0;
    if (live(time) && RUN.map === map) {
      for (const r of RUN.racers) {
        if (r.mode !== 'swim') continue;
        const d = wx - r.x;
        if (Math.abs(d) > 22) continue;
        const k = 1 - Math.abs(d) / 22;
        wx += Math.sign(d || 1) * k * k * 9;
        dip = Math.max(dip, k);
      }
    }
    const x = wx - cam.x;
    if (x < -20 || x > (x1 - cam.x) + 40) continue;
    const y = at(wx) + dip * 1.4;
    const flick = 0.85 + 0.15 * Math.sin(time * 9 + i * 3) * Math.sin(time * 5.3 + i);
    // Its light on the water: a warm streak breaking up below it.
    ctx.fillStyle = '#ffd890';
    for (let s = 0; s < 5; s++) {
      ctx.globalAlpha = (0.4 - s * 0.07) * flick;
      const ww = 4 - s * 0.5 + Math.sin(time * 3 + s + i) * 0.8;
      ctx.fillRect(x - ww / 2, y + 2 + s * 2.6, ww, 1.2);
    }
    ctx.globalAlpha = 1;
    glow(ctx, x, y - 6, 16, '255,200,120', flick);
    pivoted(ctx, x, y, Math.sin(time * 1.3 + i * 2) * 0.05 + dip * 0.25 * Math.sign(wx - (w.x1 + 30 + ((i + 0.5) / n) * L)), () => place(ctx, toroFloatArt(Math.floor(h * 3)), snap(x), y + 2));
  }
}
// ---- The yagura: the drum tower to climb ----
// A tall wooden tower: two heavy posts, beams across with braces between, a red-and-white festival
// curtain round its foot, lanterns hanging down its face for the climbers' holds (lit), and its deck
// across the top.
const yaguraArt = (h) => art(`mc-yagura|${h}`, 66, h + 6, () => {
  const H = h + 6;
  const out = [];
  const W1 = '#7a4a34';
  const W2 = '#a8704e';
  out.push(R(6, 6, 6, H - 6, W1), F(R(7, 6, 1.6, H - 6, W2)), R(50, 6, 6, H - 6, W1), F(R(51, 6, 1.6, H - 6, W2)));
  for (let y = 18; y < H - 8; y += 26) {
    out.push(R(4, y, 56, 4, W1), F(R(4, y, 56, 1.2, W2)));
    if (y + 26 < H * 0.62) out.push(F(T([[12, y + 4], [14.4, y + 4], [50, y + 24], [47.6, y + 24]], '#8a5a40')), F(T([[50, y + 4], [47.6, y + 4], [12, y + 24], [14.4, y + 24]], '#8a5a40')));
  }
  // The curtain: red and white stripes round the foot, its top hem gathered.
  const cTop = Math.round(H * 0.62);
  for (let x = 4, k = 0; x < 58; x += 6, k++) out.push(R(x, cTop, Math.min(6, 58 - x), H - cTop, k % 2 ? '#ffffff' : '#e8485e'));
  out.push(R(3, cTop - 2, 56, 3, '#3a2a30'), ...[10, 22, 34, 46].map((x) => F(E(x, cTop + 1.4, 3.4, 1.4, '#c83a4e'))));
  // The deck across the top, a red hem under it.
  out.push(R(2, 4, 60, 5, W1), F(R(2, 4, 60, 1.4, '#c8946a')), F(R(2, 9, 60, 1.6, '#e8485e')));
  return out;
});
// Where its face lanterns hang (from its foot, for the glow drawn live over them).
const yaguraHolds = (h) => {
  const out = [];
  for (let r = 0, y = h + 6 - 16; y > 16; r++, y -= 15) out.push([16 + (r % 2 ? 9 : 0) + hash(r * 3.3) * 4, y]);
  return out;
};
function yagura(ctx, x, top, bottom, time, flip = false) {
  const h = bottom - top;
  const s = yaguraArt(h);
  const left = flip ? x - 16 : x - 50;
  place(ctx, s, snap(left + s.w / 2), bottom, flip ? { flip: true } : undefined);
  // Its lanterns, hanging down the face (lit; above the curtain), each swaying.
  const cTop = (h + 6) * 0.62;
  for (const [hx, hy] of yaguraHolds(h)) {
    if (hy > cTop - 6) continue;
    const lx = flip ? left + s.w - hx : left + hx;
    const ly = bottom - (h + 6) + hy;
    chochin(ctx, lx, ly - 6, (hy | 0) % 2 === 0, Math.sin(time * 1.5 + hy) * 0.06);
  }
}
// The drummer on the tower top: a big taiko on its stand, a Mochi in a happi coat beating it with
// both sticks, one stroke after the other; as yours comes over the top, a fast roll and a big
// double stroke, "DON!", then a cheer.
const taikoArt = () => art('mc-taiko', 34, 30, () => [
  R(5, 20, 3, 10, '#5a3a30'), R(26, 20, 3, 10, '#5a3a30'), R(4, 25, 26, 2, '#5a3a30'),
  E(17, 13, 13, 10, '#a8603e'), F(E(17, 11, 12, 7, '#c8784a')), F(R(5, 8, 24, 1, '#7a4030')), F(R(5, 17, 24, 1, '#7a4030')),
  ...[8, 13, 21, 26].map((x) => F(E(x, 8.4, 0.8, 0.8, '#ffd75e'))), ...[8, 13, 21, 26].map((x) => F(E(x, 17.6, 0.8, 0.8, '#ffd75e'))),
  E(30, 13, 2.6, 10, '#f6ead8'), F(E(29.6, 13, 1.4, 7, '#fff8ec')), F(E(30, 13, 1, 1.2, '#e8485e')),
]);
const DRUM = [
  [0, { front: [6, -15], back: [2, -8], pole: -0.2, pole2: 0.9, tilt: -3, mouth: 'mochiw' }],
  [0.16, { front: [9, -6], back: [2, -12], pole: 1.15, pole2: 0.3, tilt: 4, squat: 1, mouth: 'D', sprout: 'happy' }],
  [0.3, { front: [5, -11], back: [4, -15], pole: 0.4, pole2: -0.2, tilt: -2, mouth: 'mochiw' }],
  [0.46, { front: [3, -9], back: [9, -6], pole: 0.8, pole2: 1.15, tilt: 4, squat: 1, mouth: 'D', sprout: 'happy' }],
  [0.6, { front: [6, -15], back: [2, -8], pole: -0.2, pole2: 0.9, tilt: -3, mouth: 'mochiw' }],
];
const DRUM_BIG = [
  [0, { front: [7, -17], back: [6, -17], pole: -0.5, pole2: -0.5, tilt: -6, lift: 1.4, mouth: 'o', sprout: 'excited' }],
  [0.3, { front: [10, -5], back: [9, -5], pole: 1.25, pole2: 1.25, tilt: 7, squat: 1, mouth: 'yell', closed: [true, true], sprout: 'excited' }],
  [0.7, { front: [10, -5], back: [9, -5], pole: 1.25, pole2: 1.25, tilt: 6, squat: 1, mouth: 'D', closed: [true, true], sprout: 'happy' }],
  [1.0, { front: [4, -16], back: [-6, -14], pole: -0.4, pole2: -0.3, lift: 2.6, tilt: -4, mouth: 'D', sprout: 'excited' }],
  [1.3, { front: [4, -16], back: [-6, -14], pole: -0.4, pole2: -0.3, lift: 0, tilt: -2, mouth: 'D', sprout: 'excited' }],
];
let DRUMMER = null;
const drummerOf = () => (DRUMMER ??= { ...newRecord(rollMochi(10903, { coat: null })), dress: 'chef' });
function bachi(ctx, hand, ang, face) {
  const vx = Math.sin(ang) * face;
  const vy = -Math.cos(ang);
  ctx.strokeStyle = '#7a5038';
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hand[0] - vx * 2, hand[1] - vy * 2);
  ctx.lineTo(hand[0] + vx * 11, hand[1] + vy * 11);
  ctx.stroke();
  ctx.strokeStyle = '#e8c08a';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(hand[0] - vx * 2, hand[1] - vy * 2);
  ctx.lineTo(hand[0] + vx * 11, hand[1] + vy * 11);
  ctx.stroke();
  ctx.lineCap = 'butt';
}
function drummer(ctx, map, x, gy, wx, time) {
  const R = live(time) && RUN.map === map ? RUN.R : null;
  const mo = R ? momentsOf(R) : {};
  const top = mo.tops?.[wx] != null ? time - mo.tops[wx] : -1;
  const roll = top >= 0 && top < 1.2;
  const big = top >= 1.2 && top < 2.5;
  const keys = big ? DRUM_BIG : DRUM;
  const t = big ? top - 1.2 : roll ? (top * 2.2) % 0.6 : (time * 0.75 + hash(wx)) % 0.6;
  const P = routine(keys, t);
  // The drum (its skin shivers a moment after each stroke).
  const hit = big ? (t > 0.3 && t < 0.6 ? 1 - (t - 0.3) / 0.3 : 0) : Math.max(0, 1 - (((t - 0.16 + 0.6) % 0.3) / 0.12));
  place(ctx, taikoArt(), snap(x - 6), gy + 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 2 && hit > 0; i++) {
    ctx.globalAlpha = hit * (1 - i * 0.4);
    ctx.beginPath();
    ctx.ellipse(x + 7, gy - 15, 3 + i * 3 + (1 - hit) * 3, 10 + i * 2, 0, -1.2, 1.2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  posed(ctx, drummerOf(), x + 20, gy, keys, t, {
    facing: -1,
    hold: 'front',
    slot: `drum|${wx}`,
    under: (c, hand, flip, other) => {
      bachi(c, hand, P.pole, -1);
      bachi(c, other, P.pole2 ?? P.pole, -1);
    },
  });
  if (big && top < 2.3) {
    const k = (top - 1.45) / 0.85;
    if (k > 0) {
      ctx.globalAlpha = Math.min(1, (1 - k) * 3);
      ctx.fillStyle = '#e8485e';
      ctx.font = '900 9px Nunito, "Trebuchet MS", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DON!', x + 4, gy - 34 - k * 10);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }
  }
}
// ---- The launch: a ramp off the far tower, red and white, lanterns either side ----
const festRampArt = () => art('mc-festramp', 64, 22, () => [
  T([[2, 20], [58, 6], [62, 6], [62, 20]], '#a8704e'), F(T([[2, 20], [58, 6], [62, 6], [62, 8.4], [6, 20]], '#c8946a')),
  ...[14, 30, 46].map((x) => F(R(x, 20 - (x - 2) * 0.25, 1, (x - 2) * 0.25 + 1, '#7a4a34'))),
  ...[0, 1, 2, 3, 4, 5].map((k) => F(T([[8 + k * 8.4, 20 - (6 + k * 8.4) * 0.25], [12.2 + k * 8.4, 20 - (10.2 + k * 8.4) * 0.25], [12.2 + k * 8.4, 20], [8 + k * 8.4, 20]], k % 2 ? '#ffffff' : '#e8485e'))),
  F(T([[4, 19], [58, 5], [61, 4.4], [60, 6.4], [8, 19.6]], '#f0d0a8')), R(56, 6, 6, 15, '#7a4a34'),
]);
// ---- The dusk cloud fluff on the landing field ----
const duskFluffArt = (w) => art(`mc-duskfluff|${w}`, w, 42, () => {
  const out = [];
  const taper = (cx) => Math.max(0.35, Math.min(1, Math.min(cx, w - cx) / 70));
  for (let x = 6, k = 0; x < w - 6; x += 24, k++) {
    const r = (13 + hash(k * 3.3 + w) * 9) * taper(x + 8);
    out.push(E(Math.max(r + 1, Math.min(w - r - 1, x + 8)), 42 - r * 0.7, r, r * 0.72, '#d8bce0'));
  }
  for (let x = 0, k = 0; x < w; x += 20, k++) {
    const r = (10 + hash(k * 7.1 + w * 0.3) * 8) * taper(x + 6);
    const px = Math.max(r + 1, Math.min(w - r - 1, x + 6));
    out.push(F(E(px, 42 - r * 0.9, r, r * 0.76, '#ffe6e4')), F(E(px - r * 0.25, 42 - r * 1.25, r * 0.55, r * 0.3, '#fff4ec')));
  }
  return out;
});
// ---- The launch firework: as yours takes off, a rocket climbs from the dark below the glide and
// bursts big ahead of it and above (never round its face), its sparks drooping as they fade ----
function launchFirework(ctx, map, R, cam, time) {
  const mo = momentsOf(R);
  if (mo.launch == null) return;
  const k0 = time - mo.launch;
  if (k0 < 0 || k0 > 3.4) return;
  if (!mo.fw) return;
  const bx = mo.fw[0] - cam.x;
  const by = mo.fw[1] - cam.y;
  const RISE = 1.1;
  if (k0 < RISE) {
    const k = k0 / RISE;
    const y = by + 110 * (1 - k) ** 2;
    for (let s = 0; s < 6; s++) {
      ctx.globalAlpha = (1 - s / 6) * 0.9;
      ctx.fillStyle = s ? '#ffd890' : '#ffffff';
      ctx.fillRect(bx + Math.sin((k - s * 0.02) * 12) * 1.2 - 0.9, y + s * 4 - 0.9, 1.8, 1.8);
    }
    ctx.globalAlpha = 1;
    return;
  }
  const k = (k0 - RISE) / 2.3;
  if (k < 0.12) glow(ctx, bx, by, 46, '255,236,200', 1 - k / 0.12);
  const r = 44 * (1 - (1 - Math.min(1, k * 1.5)) ** 3);
  const droop = k * k * 14;
  for (const [f, col, n] of [[1, '#ffd75e', 26], [0.66, '#ff8fb0', 20], [0.36, '#ffffff', 12]]) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + f * 2;
      const px = bx + Math.cos(a) * r * f;
      const py = by + Math.sin(a) * r * f + droop * f;
      ctx.globalAlpha = Math.max(0, (1 - k) ** 1.3);
      ctx.fillStyle = col;
      const s = 1.4 + (1 - k) * 1.5;
      ctx.fillRect(px - s / 2, py - s / 2, s, s);
      if (k < 0.5 && f === 1) {
        ctx.globalAlpha *= 0.5;
        ctx.fillRect(px - Math.cos(a) * 4 - 0.5, py - Math.sin(a) * 4 - 0.5, 1, 1);
      }
    }
  }
  ctx.globalAlpha = 1;
}
// ---- The giant lantern at the finish ----
// Hung from a wooden frame behind the podium, high enough to show over the prizes: a great red
// paper lantern with black rims, its ribs, and a white crest with a little mochi on it; it glows,
// sways a touch, and when yours comes home it swings and glows brighter, a few sparks falling.
const bigChochinArt = () => art('mc-bigchochin', 52, 70, () => [
  R(14, 0, 24, 6, '#2e2228'), F(R(14, 0, 24, 1.4, '#5a4650')),
  E(26, 35, 25, 29, '#e8485e'), F(E(19, 26, 8, 14, '#ff7a84')),
  ...[14, 22, 30, 38, 46, 54].map((y) => F(T([[26 - Math.sqrt(Math.max(0, 1 - ((y - 35) / 29) ** 2)) * 24, y], [26 + Math.sqrt(Math.max(0, 1 - ((y - 35) / 29) ** 2)) * 24, y], [26 + Math.sqrt(Math.max(0, 1 - ((y - 35) / 29) ** 2)) * 24, y + 0.9], [26 - Math.sqrt(Math.max(0, 1 - ((y - 35) / 29) ** 2)) * 24, y + 0.9]], '#c8384a'))),
  E(26, 36, 10.5, 10.5, '#fff6ea'), F(E(26, 38, 6.6, 5.4, '#ffffff')), F(E(26, 38.4, 6, 4.8, '#fffaf4')),
  F(E(23.8, 38, 0.8, 1, '#3a2d4f')), F(E(28.2, 38, 0.8, 1, '#3a2d4f')), F(E(21.6, 39.6, 1.3, 0.7, '#ffc4d4')), F(E(30.4, 39.6, 1.3, 0.7, '#ffc4d4')), F(R(25.4, 39.6, 1.2, 0.6, '#e8607a')),
  R(14, 63, 24, 6, '#2e2228'), F(R(14, 63, 24, 1.4, '#5a4650')),
]);
function bigChochin(ctx, map, x, gy, wx, time) {
  const R = live(time) && RUN.map === map ? RUN.R : null;
  const mo = R ? momentsOf(R) : {};
  const k = mo.home != null ? time - mo.home : -1;
  const beam = gy - 166;
  // The frame: two posts and a beam with a little roof.
  ctx.fillStyle = '#5a3a30';
  ctx.fillRect(snap(x - 38), snap(beam), 4, gy - beam + 2);
  ctx.fillRect(snap(x + 34), snap(beam), 4, gy - beam + 2);
  ctx.fillStyle = '#7a4a34';
  ctx.fillRect(snap(x - 44), snap(beam - 4), 88, 5);
  ctx.fillStyle = '#3a2a30';
  ctx.beginPath();
  ctx.moveTo(x - 48, beam - 4);
  ctx.lineTo(x + 48, beam - 4);
  ctx.lineTo(x + 40, beam - 10);
  ctx.lineTo(x - 40, beam - 10);
  ctx.fill();
  const swing = k > 0 && k < 4 ? Math.sin(k * 4.2) * 0.16 * Math.exp(-k * 1.1) : 0;
  const a = Math.sin(time * 0.8 + wx) * 0.02 + swing;
  const bright = 1 + (k > 0 && k < 3 ? 0.6 * Math.exp(-k * 1.2) : 0);
  glow(ctx, x, beam + 44, 60, '255,170,120', Math.min(1, 0.65 * bright));
  pivoted(ctx, x, beam + 1, a, () => {
    ctx.fillStyle = '#3a2a30';
    ctx.fillRect(snap(x - 0.5), snap(beam + 1), 1, 6);
    place(ctx, bigChochinArt(), snap(x), beam + 77);
  });
  if (k > 0.2 && k < 3.2) {
    for (let i = 0; i < 9; i++) {
      const u = ((k - 0.2) * 0.6 + hash(i * 3.1)) % 1;
      const px = x + (hash(i * 5.3) - 0.5) * 50 + Math.sin(u * 6 + i) * 3;
      const py = beam + 76 + u * 50;
      ctx.globalAlpha = Math.min(1, (3.2 - k) * 0.8) * (1 - u) * (0.6 + 0.4 * Math.sin(time * 12 + i));
      ctx.fillStyle = i % 2 ? '#ffd75e' : '#fff4c0';
      ctx.fillRect(px - 0.8, py - 0.8, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;
  }
}
// ---- Lantern strings over the course ----
// Tall poles every so often, a cord swagged between each pair, paper lanterns hanging along it, red
// and white by turns, each glowing and swaying on its own.
const CHOCHIN_POST = 120;
function chochinLine(ctx, map, wx, to, cam, width, time) {
  const posts = [];
  for (let px = wx; px <= to; px += CHOCHIN_POST) posts.push(px);
  for (const p of posts) {
    const x = p - cam.x;
    if (x < -CHOCHIN_POST || x > width + CHOCHIN_POST) continue;
    const foot = groundAt(map, p) - cam.y;
    ctx.fillStyle = '#5a3a30';
    ctx.fillRect(snap(x - 1.5), snap(foot - 84), 3, 88);
    ctx.fillStyle = '#7a4a34';
    ctx.fillRect(snap(x - 1), snap(foot - 84), 1, 88);
    ctx.fillStyle = '#e8485e';
    ctx.fillRect(snap(x - 2.5), snap(foot - 86), 5, 3);
  }
  for (let i = 1; i < posts.length; i++) {
    const a = posts[i - 1];
    const b = posts[i];
    if (b - cam.x < -20 || a - cam.x > width + 20) continue;
    const ax = a - cam.x;
    const bx = b - cam.x;
    const ay = groundAt(map, a) - cam.y - 82;
    const by = groundAt(map, b) - cam.y - 82;
    const sag = 12;
    const cy = (ay + by) / 2 + sag * 2;
    ctx.strokeStyle = '#3a2a30';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo((ax + bx) / 2, cy, bx, by);
    ctx.stroke();
    for (let k = 1; k < 6; k++) {
      const u = k / 6;
      const px = (1 - u) * (1 - u) * ax + 2 * u * (1 - u) * ((ax + bx) / 2) + u * u * bx;
      const py = (1 - u) * (1 - u) * ay + 2 * u * (1 - u) * cy + u * u * by;
      chochin(ctx, px, py, (k + i) % 2 === 0, Math.sin(time * 1.5 + a * 0.01 + k * 1.3) * 0.08);
    }
  }
}
// The meadow's stalls (the festival's own, their lanterns lit at dusk).
const YATAI = [{ at: 1, kind: 'dango', c: '#e8485e', seed: 21, glow: 0.8 }, { at: 2, kind: 'floss', c: '#4a7ad8', seed: 27, glow: 0.8 }];
// Each frame of the festival race: yours coming over the tower's top (the drummer drums it over),
// and taking off into the glide (the firework).
function noteMatsuri(map, R, mo, time) {
  const you = R.racers[R.me];
  const was = you.festMode;
  you.festMode = you.m.mode;
  if (R.phase !== 'run' || !was || was === you.m.mode) return;
  if (was === 'climb') {
    let best = null;
    for (const [kind, wx] of map.townPieces ?? []) if (kind === 'mr_wall' && wx <= you.x + 20 && (best == null || wx > best)) best = wx;
    if (best == null) return;
    (mo.tops ??= {})[best] ??= time;
    for (const [kind, px] of map.townPieces ?? []) if (kind === 'mr_taiko' && px > best && px < best + 120) mo.tops[px] ??= time;
  }
  if (you.m.mode === 'fly' && mo.launch == null) {
    mo.launch = time;
    // (Ahead of where it'll come down and above it: the race's camera follows it down, so the burst
    // shows in the open sky over the landing field, never round its face.)
    mo.fw = [you.x + 230, you.y + 85];
  }
}
// ---------- The Mochi Grand Tour ('course:kingdom'; its redraw, 2026-11-13) ----------
// A royal progress through the Mochi kingdom, in five parts, from the castle town at dawn to the
// throne at dusk. The castle itself is the thread: a speck over the town roofs at the start, it
// grows all the way in until you are climbing its own walls and gliding off its keep, then stands
// behind you, its windows lit, as you run the royal road home.
// Castle Town: the town gate swings open at Go, guards grounding their spears; banner poles and
// townsfolk along the road. The Moat: boats out on the water, the drawbridge overhead. Castle
// Walls: two courses of cut stone, a flag running up the pole at each top as yours comes over.
// Over the Keep: off the ramp into the sunset over the castle's towers. The Royal Road: lantern
// poles and subjects lining the way home, and the crown waiting by the finish.
const ROYAL = { cloth: '#d8304a', deep: '#a81f36', gold: '#ffd75e', goldDk: '#d8a32e', cream: '#fff4e4' };
const PENNANTS = ['#d8304a', '#ffd75e', '#3a6ad8', '#ffffff'];
// ---- The castle ----
// A castle keep in tiers: a battered stone base, then white-walled storeys each under a dark tiled
// roof whose eaves flare up at the corners, little barred windows (lit at dusk), a gold fish
// ornament at each end of the top ridge. Drawn straight to the canvas at whatever size it is now,
// so coming nearer only changes the numbers, never repaints a picture.
function castle(ctx, cx, baseY, s, air, haze, lit, t = 0) {
  const C = (c) => mix(c, air, haze);
  const w = 70 * s;
  const H = 96 * s;
  // The stone base: wider at the foot, its courses.
  ctx.fillStyle = C('#8a8296');
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.52, baseY);
  ctx.lineTo(cx - w * 0.36, baseY - H * 0.26);
  ctx.lineTo(cx + w * 0.36, baseY - H * 0.26);
  ctx.lineTo(cx + w * 0.52, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C('#9e96ac');
  for (let i = 1; i < 3; i++) {
    const u = i / 3;
    const hw = w * (0.52 - 0.16 * u);
    ctx.fillRect(cx - hw, baseY - H * 0.26 * u, hw * 2, Math.max(0.6, s * 0.8));
  }
  // Three storeys, each smaller, white walls under a dark roof.
  const tiers = [[0.26, 0.72, 0.2], [0.46, 0.54, 0.17], [0.64, 0.38, 0.15]];
  for (const [at, tw, th] of tiers) {
    const y = baseY - H * at;
    const hw = (w * tw) / 2;
    const wallH = H * th * 0.62;
    ctx.fillStyle = C('#f4eee8');
    ctx.fillRect(cx - hw, y - wallH, hw * 2, wallH);
    ctx.fillStyle = C('#d8cec8');
    ctx.fillRect(cx - hw, y - wallH, hw * 2, Math.max(0.6, s * 0.7));
    // Its windows: little dark slots, warm when the lanterns are lit.
    const n = Math.max(2, Math.round(tw * 4));
    for (let k = 0; k < n; k++) {
      const wx = cx - hw + ((k + 0.5) / n) * hw * 2;
      const ww = Math.max(0.8, s * 2.4);
      const wh = Math.max(1.2, wallH * 0.42);
      // (Lit, each window has its own candle, and candles flicker.)
      const fl = lit > 0.05 ? lit * (0.72 + 0.28 * Math.sin(t * (1.6 + (k % 3) * 0.7) + k * 2.1 + at * 9)) : 0;
      ctx.fillStyle = fl > 0.05 ? mix(C('#4a4060'), '#ffcf8a', fl) : C('#4a4060');
      ctx.fillRect(wx - ww / 2, y - wallH * 0.76, ww, wh);
    }
    // The roof: a dark tiled sweep, its eaves turning up at the ends.
    const ry = y - wallH;
    const rw = hw * 1.34;
    const rh = H * th * 0.5;
    ctx.fillStyle = C('#3e3a50');
    ctx.beginPath();
    ctx.moveTo(cx - rw, ry + rh * 0.12);
    ctx.quadraticCurveTo(cx - rw * 0.52, ry - rh * 0.5, cx, ry - rh);
    ctx.quadraticCurveTo(cx + rw * 0.52, ry - rh * 0.5, cx + rw, ry + rh * 0.12);
    ctx.quadraticCurveTo(cx + rw * 0.6, ry - rh * 0.16, cx, ry - rh * 0.3);
    ctx.quadraticCurveTo(cx - rw * 0.6, ry - rh * 0.16, cx - rw, ry + rh * 0.12);
    ctx.fill();
    ctx.fillStyle = C('#625c76');
    ctx.beginPath();
    ctx.moveTo(cx - rw, ry + rh * 0.12);
    ctx.quadraticCurveTo(cx - rw * 0.52, ry - rh * 0.5, cx, ry - rh);
    ctx.quadraticCurveTo(cx - rw * 0.5, ry - rh * 0.42, cx - rw * 0.9, ry + rh * 0.08);
    ctx.fill();
  }
  // Pennants on the tiers' corners, snapping in her wind.
  for (const [at, side] of [[0.46, -1], [0.46, 1], [0.64, 1]]) {
    const px = cx + side * w * (at > 0.5 ? 0.2 : 0.37);
    const py = baseY - H * at - H * 0.1;
    const fly = 1 + 0.35 * Math.sin(t * 2.6 + side * 1.3 + at * 7);
    ctx.fillStyle = C('#7a6a84');
    ctx.fillRect(px - s * 0.4, py - H * 0.1, Math.max(0.6, s * 0.8), H * 0.1);
    ctx.fillStyle = C('#d8304a');
    ctx.beginPath();
    ctx.moveTo(px, py - H * 0.1);
    ctx.lineTo(px + side * w * 0.11 * fly, py - H * 0.075 + s * 0.8 * Math.sin(t * 3 + at * 5));
    ctx.lineTo(px, py - H * 0.045);
    ctx.fill();
  }
  // Smoke drifting up from its kitchens.
  if (s > 0.55) {
    ctx.fillStyle = C('#e8e4f0');
    for (let i = 0; i < 4; i++) {
      const u = (t * 0.11 + i / 4) % 1;
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.4;
      ctx.beginPath();
      ctx.arc(cx - w * 0.44 + Math.sin(u * 5 + i) * w * 0.05 - u * w * 0.1, baseY - H * 0.3 - u * H * 0.42, s * (1.4 + u * 3), 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // The gold fish at each end of the top ridge, and a flag on the very top.
  const topY = baseY - H * 0.64 - H * 0.15 * 0.62 - H * 0.15 * 0.5;
  if (s > 0.6) {
    ctx.fillStyle = C(ROYAL.gold);
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + sx * w * 0.13, topY + s * 1.6, s * 1.9, s * 1.3, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + sx * w * 0.13, topY + s * 1.6);
      ctx.lineTo(cx + sx * w * 0.13 - sx * s * 1.2, topY - s * 1.4);
      ctx.lineTo(cx + sx * w * 0.13 + sx * s * 1.6, topY + s * 0.4);
      ctx.fill();
    }
  }
}
// The town's roofs: dark tiled houses stepping up the hillside, their windows warm at dusk.
function townRoofs(ctx, cam, width, ridge, air, haze, par, lit, step, t = 0) {
  repeat(cam.x, par, step, width, (i, x) => {
    const h = hash(i * 1.9 + 7);
    if (h < 0.2) return;
    const bx = x + hash(i * 2.7) * (step * 0.4);
    const by = ridge(bx) + 3;
    const w = step * (0.5 + h * 0.4);
    const hh = step * (0.26 + hash(i * 3.3) * 0.26);
    ctx.fillStyle = mix('#efe6dc', air, haze);
    ctx.fillRect(bx - w / 2, by - hh, w, hh + 2);
    if (lit > 0.05) {
      const fl = 0.74 + 0.26 * Math.sin(t * (1.4 + (i % 3) * 0.6) + i * 1.7);
      ctx.fillStyle = `rgba(255,206,140,${(0.5 + 0.3 * lit) * fl})`;
      ctx.fillRect(bx - w * 0.18, by - hh * 0.72, w * 0.22, hh * 0.3);
    }
    // A chimney on some of them, with its smoke drifting away down the ridge.
    if (h > 0.62) {
      const chx = bx + w * 0.3;
      const chy = by - hh - w * 0.18;
      ctx.fillStyle = mix('#6a6478', air, haze);
      ctx.fillRect(chx - w * 0.06, chy, w * 0.12, hh * 0.5);
      ctx.fillStyle = mix('#efeaf6', air, haze * 0.6);
      for (let k = 0; k < 3; k++) {
        const u = (t * 0.09 + k / 3 + h) % 1;
        ctx.globalAlpha = Math.sin(u * Math.PI) * 0.45;
        ctx.beginPath();
        ctx.arc(chx + Math.sin(u * 4 + k) * step * 0.06 - u * step * 0.1, chy - u * step * 0.5, step * (0.03 + u * 0.07), 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = mix('#5a5468', air, haze);
    ctx.beginPath();
    ctx.moveTo(bx - w * 0.72, by - hh);
    ctx.quadraticCurveTo(bx, by - hh - w * 0.36, bx + w * 0.72, by - hh);
    ctx.quadraticCurveTo(bx + w * 0.3, by - hh - w * 0.1, bx, by - hh - w * 0.14);
    ctx.quadraticCurveTo(bx - w * 0.3, by - hh - w * 0.1, bx - w * 0.72, by - hh);
    ctx.fill();
  });
}
// Where the race is along the Tour, for the backdrop: 0 at the town, 1 at the castle walls, back
// toward 0 on the road home.
const KING_AT = 4100;
COURSES.kingdom = {
  far(ctx, t, cam, width, y0, time) {
    const air = t.sky[1];
    const lit = Math.max(0, Math.min(1, (cam.x - 4700) / 1400));
    goldenSky(ctx, width, y0, goldenOf(RUN.map?.night ?? 0));
    if (!t.stars) clouds(ctx, cam, width, time, false);
    hills(ctx, cam, width, y0 - 16, 54, 0.03, 5.1, mix('#8a7eb8', air, 0.34), mix('#a89cd0', air, 0.3));
    const ridge = hills(ctx, cam, width, y0 + 4, 30, 0.07, 3.3, mix('#6e7aa0', air, 0.24), mix('#94a0c4', air, 0.2));
    // The kingdom's hill town along the ridge, its windows warm once the sun is down.
    townRoofs(ctx, cam, width, ridge, air, 0.22, 0.07, lit, 34, time);
    return true;
  },
  // The middle plane, where this course has its room: the castle standing over the kingdom, growing
  // all the way in to its own walls and left behind you after; in front of it a band of countryside,
  // its hedges, trees and farmhouses, or, along the castle's foot, its outer wall.
  mid(ctx, t, cam, width, y0, time) {
    const air = t.sky[1];
    const lit = Math.max(0, Math.min(1, (cam.x - 4700) / 1400));
    const land = hills(ctx, cam, width, y0 + 10, 12, 0.45, 6.7, mix('#7aa06c', air, 0.14), mix('#a6c48e', air, 0.1));
    // The countryside: a hedge line, trees along it, the odd farmhouse.
    repeat(cam.x, 0.45, 74, width, (i, x) => {
      const h = hash(i * 2.3 + 2);
      const gy = land(x) + 3;
      ctx.strokeStyle = mix('#4e7a4a', air, 0.1);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, gy - 5);
      ctx.lineTo(x + 40, gy - 5 + (land(x + 40) - land(x)));
      ctx.stroke();
      // A round tree on the hedge line, leaning with the breeze.
      if (h > 0.4) {
        const tx = x + 16 + hash(i * 5.1) * 14;
        const ty = land(tx) + 2;
        const wx = tx + cam.x * 0.45;
        const sway = (Math.sin(time * 1.5 + wx * 0.02) * 0.5 + windAt(time, wx)) * 2.2;
        ctx.fillStyle = mix('#3f6a40', air, 0.1);
        ctx.beginPath();
        ctx.moveTo(tx - 1.2, ty);
        ctx.lineTo(tx - 1.2 + sway * 0.4, ty - 9);
        ctx.lineTo(tx + 1.2 + sway * 0.4, ty - 9);
        ctx.lineTo(tx + 1.2, ty);
        ctx.fill();
        ctx.fillStyle = mix('#58905a', air, 0.1);
        ctx.beginPath();
        ctx.arc(tx + sway, ty - 13, 6.5 + h * 2.5, 0, TAU);
        ctx.fill();
        ctx.fillStyle = mix('#74ac72', air, 0.1);
        ctx.beginPath();
        ctx.arc(tx - 2 + sway * 1.2, ty - 15, 4 + h, 0, TAU);
        ctx.fill();
      }
      // A windmill out in the fields now and then, its sails turning on her wind.
      if (h > 0.26 && h < 0.34) {
        const mx = x + 26;
        const my = land(mx) + 2;
        ctx.fillStyle = mix('#efe6dc', air, 0.08);
        ctx.beginPath();
        ctx.moveTo(mx - 7, my);
        ctx.lineTo(mx - 4.4, my - 26);
        ctx.lineTo(mx + 4.4, my - 26);
        ctx.lineTo(mx + 7, my);
        ctx.fill();
        ctx.fillStyle = mix('#c8bcc8', air, 0.08);
        ctx.fillRect(mx - 5.6, my - 14, 11.2, 1.4);
        ctx.fillStyle = mix('#5a5468', air, 0.08);
        ctx.beginPath();
        ctx.moveTo(mx - 6, my - 26);
        ctx.quadraticCurveTo(mx, my - 34, mx + 6, my - 26);
        ctx.fill();
        // Its four sails, round and round.
        const spin = time * 0.5 + i;
        for (let s = 0; s < 4; s++) {
          const a = spin + (s / 4) * TAU;
          const ex = mx + Math.cos(a) * 15;
          const ey = my - 28 + Math.sin(a) * 15;
          ctx.strokeStyle = mix('#6a5a50', air, 0.08);
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(mx, my - 28);
          ctx.lineTo(ex, ey);
          ctx.stroke();
          ctx.fillStyle = mix('#fff4e4', air, 0.08);
          ctx.save();
          ctx.translate((mx + ex) / 2, (my - 28 + ey) / 2);
          ctx.rotate(a);
          ctx.fillRect(-6, -2.6, 12, 2.4);
          ctx.restore();
        }
        ctx.fillStyle = mix('#8a8296', air, 0.08);
        ctx.beginPath();
        ctx.arc(mx, my - 28, 1.8, 0, TAU);
        ctx.fill();
      }
      if (h < 0.55) return;
      const bx = x + 50;
      const by = land(bx) + 3;
      ctx.fillStyle = mix('#f6efe6', air, 0.08);
      ctx.fillRect(bx - 10, by - 15, 20, 15);
      ctx.fillStyle = `rgba(255,206,140,${0.25 + 0.6 * lit})`;
      ctx.fillRect(bx - 5, by - 11, 4, 4);
      ctx.fillStyle = mix('#b8503e', air, 0.08);
      ctx.beginPath();
      ctx.moveTo(bx - 14, by - 15);
      ctx.lineTo(bx, by - 25);
      ctx.lineTo(bx + 14, by - 15);
      ctx.fill();
      ctx.fillStyle = mix('#8a8296', air, 0.08);
      ctx.fillRect(bx + 5, by - 28, 4, 13);
      // Its chimney smoke, carried away on the wind.
      ctx.fillStyle = mix('#efeaf6', air, 0.1);
      for (let k = 0; k < 3; k++) {
        const u = (time * 0.1 + k / 3 + h) % 1;
        ctx.globalAlpha = Math.sin(u * Math.PI) * 0.5;
        ctx.beginPath();
        ctx.arc(bx + 7 + Math.sin(u * 4 + k) * 2 - u * 7, by - 30 - u * 22, 1.6 + u * 3.4, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
    // The castle itself, standing over the fields, in front of all of it: near enough to read, far
    // enough to grow all the way in to its own walls and shrink behind you after. (This course's
    // camera sits low, so the sky is a thin strip: the castle stands in the land, not above it.)
    const d = Math.abs(cam.x - KING_AT);
    const s = Math.max(0.62, Math.min(1.6, 1.6 - d / 3400));
    const cx = width / 2 + KING_AT * 0.12 - cam.x * 0.12;
    if (cx > -140 && cx < width + 140) castle(ctx, cx, y0 + 104, s, air, 0.12, lit, time);
    // The near fields, right behind the road: this course's camera lies low and leaves a long empty
    // band between the horizon and the track, so the kingdom's own country fills it, big and close
    // and in front of the castle. Hedges with gates, orchard trees bending in her wind, haystacks,
    // and a great windmill turning beside a farm with its smoke.
    const near = hills(ctx, cam, width, y0 + 118, 16, 0.72, 2.9, mix('#5f8f5a', air, 0.04), mix('#86b874', air, 0.02));
    repeat(cam.x, 0.72, 128, width, (i, x) => {
      const h = hash(i * 3.1 + 5);
      const gy = near(x) + 3;
      // The hedge along the field's edge, with a gate in it.
      ctx.strokeStyle = mix('#3c6b3c', air, 0.04);
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, gy - 7);
      ctx.lineTo(x + 54, gy - 7 + (near(x + 54) - near(x)));
      ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.strokeStyle = mix('#8a6a50', air, 0.04);
      ctx.lineWidth = 1.6;
      for (const d2 of [0, 4, 8]) {
        ctx.beginPath();
        ctx.moveTo(x + 58, gy - 2 - d2);
        ctx.lineTo(x + 74, gy - 2 - d2 + (near(x + 74) - near(x + 58)));
        ctx.stroke();
      }
      // Orchard trees, bending together in her wind.
      for (let k = 0; k < 2; k++) {
        if (hash(i * 7.7 + k) < 0.3) continue;
        const tx = x + 16 + k * 30 + hash(i * 2.9 + k) * 10;
        const ty = near(tx) + 3;
        const sway = (Math.sin(time * 1.4 + (tx + cam.x * 0.72) * 0.016) * 0.6 + windAt(time, tx + cam.x * 0.72)) * 3.4;
        ctx.fillStyle = mix('#5a4030', air, 0.04);
        ctx.beginPath();
        ctx.moveTo(tx - 2, ty);
        ctx.lineTo(tx - 1.6 + sway * 0.35, ty - 15);
        ctx.lineTo(tx + 1.6 + sway * 0.35, ty - 15);
        ctx.lineTo(tx + 2, ty);
        ctx.fill();
        ctx.fillStyle = mix('#3f7a46', air, 0.04);
        ctx.beginPath();
        ctx.arc(tx + sway, ty - 22, 10 + h * 3, 0, TAU);
        ctx.fill();
        ctx.fillStyle = mix('#5ea15c', air, 0.04);
        ctx.beginPath();
        ctx.arc(tx - 3 + sway * 1.2, ty - 25, 6.4 + h * 2, 0, TAU);
        ctx.fill();
        ctx.fillStyle = mix('#7cc077', air, 0.04);
        ctx.beginPath();
        ctx.arc(tx - 5 + sway * 1.3, ty - 27, 3, 0, TAU);
        ctx.fill();
      }
      // A haystack or two in the stubble.
      if (h > 0.4 && h < 0.8) {
        for (let k = 0; k < 2; k++) {
          const sx = x + 86 + k * 16;
          const sy = near(sx) + 3;
          ctx.fillStyle = mix('#d8a850', air, 0.04);
          ctx.beginPath();
          ctx.moveTo(sx - 7, sy);
          ctx.quadraticCurveTo(sx - 5, sy - 13, sx, sy - 15);
          ctx.quadraticCurveTo(sx + 5, sy - 13, sx + 7, sy);
          ctx.fill();
          ctx.fillStyle = mix('#eec472', air, 0.04);
          ctx.beginPath();
          ctx.moveTo(sx - 6, sy - 3);
          ctx.quadraticCurveTo(sx - 3, sy - 12, sx - 0.5, sy - 14);
          ctx.lineTo(sx - 1.5, sy - 3);
          ctx.fill();
        }
      }
      // A great windmill, its sails turning, and a farm beside it with its smoke. (Rare: one every
      // few fields, so it reads as a landmark.)
      if (h > 0.8) {
        const mx = x + 58;
        const my = near(mx) + 3;
        ctx.fillStyle = mix('#f2e8dc', air, 0.03);
        ctx.beginPath();
        ctx.moveTo(mx - 11, my);
        ctx.lineTo(mx - 7, my - 40);
        ctx.lineTo(mx + 7, my - 40);
        ctx.lineTo(mx + 11, my);
        ctx.fill();
        ctx.fillStyle = mix('#d6c8c0', air, 0.03);
        ctx.fillRect(mx - 9.4, my - 22, 18.8, 2.2);
        ctx.fillStyle = mix('#4a4458', air, 0.03);
        ctx.beginPath();
        ctx.moveTo(mx - 10, my - 40);
        ctx.quadraticCurveTo(mx, my - 52, mx + 10, my - 40);
        ctx.fill();
        ctx.fillStyle = mix('#3a3448', air, 0.03);
        ctx.fillRect(mx - 3, my - 16, 6, 16);
        const spin = time * 0.42 + i;
        for (let sail = 0; sail < 4; sail++) {
          const a = spin + (sail / 4) * TAU;
          const ex = mx + Math.cos(a) * 24;
          const ey = my - 44 + Math.sin(a) * 24;
          ctx.strokeStyle = mix('#6a5a50', air, 0.03);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(mx, my - 44);
          ctx.lineTo(ex, ey);
          ctx.stroke();
          ctx.save();
          ctx.translate((mx + ex) / 2, (my - 44 + ey) / 2);
          ctx.rotate(a);
          ctx.fillStyle = mix('#fff6ea', air, 0.03);
          ctx.fillRect(-9, -4.4, 18, 3.6);
          ctx.fillStyle = mix('#e0d2c4', air, 0.03);
          for (let b = -8; b < 9; b += 4) ctx.fillRect(b, -4.4, 1, 3.6);
          ctx.restore();
        }
        ctx.fillStyle = mix('#8a8296', air, 0.03);
        ctx.beginPath();
        ctx.arc(mx, my - 44, 2.6, 0, TAU);
        ctx.fill();
        // The farmhouse under it, its windows warm.
        const bx = mx + 34;
        const by = near(bx) + 3;
        ctx.fillStyle = mix('#f6efe6', air, 0.03);
        ctx.fillRect(bx - 13, by - 19, 26, 19);
        ctx.fillStyle = `rgba(255,206,140,${(0.3 + 0.6 * lit) * (0.75 + 0.25 * Math.sin(time * 1.6 + i))})`;
        ctx.fillRect(bx - 7, by - 14, 5, 5);
        ctx.fillRect(bx + 3, by - 14, 5, 5);
        ctx.fillStyle = mix('#a8483c', air, 0.03);
        ctx.beginPath();
        ctx.moveTo(bx - 17, by - 19);
        ctx.lineTo(bx, by - 31);
        ctx.lineTo(bx + 17, by - 19);
        ctx.fill();
        ctx.fillStyle = mix('#8a8296', air, 0.03);
        ctx.fillRect(bx + 7, by - 36, 5, 17);
        ctx.fillStyle = mix('#efeaf6', air, 0.04);
        for (let k = 0; k < 4; k++) {
          const u = (time * 0.1 + k / 4 + h) % 1;
          ctx.globalAlpha = Math.sin(u * Math.PI) * 0.5;
          ctx.beginPath();
          ctx.arc(bx + 9.5 + Math.sin(u * 4 + k) * 3 - u * 10, by - 38 - u * 30, 2.4 + u * 5, 0, TAU);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    });
    // Along the castle's foot, its outer wall runs in front of the fields.
    if (cam.x > 2500 && cam.x < 5400) {
      repeat(cam.x, 0.72, 34, width, (i, x) => {
        const gy = near(x) + 6;
        ctx.fillStyle = mix('#b8aec4', air, 0.06);
        ctx.fillRect(x, gy - 34, 34.5, 36);
        ctx.fillStyle = mix('#d8d0e0', air, 0.05);
        ctx.fillRect(x, gy - 34, 34.5, 2.8);
        ctx.fillStyle = mix('#9a90a8', air, 0.06);
        ctx.fillRect(x + (i % 2 ? 9 : 22), gy - 34, 8, 3.4);
        ctx.fillRect(x, gy - 18, 34.5, 1.2);
      });
    }
    return true;
  },
};
// The Tour's ground: the kingdom's warm earth with old cobbles in it, and lost things from a
// hundred royal processions: a marble, a star coin, a little crown, an old iron key.
GROUND_SPECS.kingdom = {
  layers: [
    { top: 10, bot: 24, c: '#c0a088', a: 0.5, amp: 2.4, f: 0.043, rim: '#ecd4bc' },
    { top: 31, bot: 35, c: '#fff2e4', a: 0.6, amp: 3, f: 0.031, rim: null },
    { top: 56, bot: 74, c: '#a88878', a: 0.42, amp: 3.6, f: 0.021, rim: '#d4b4a0' },
    { top: 88, bot: 91, c: '#fbe2cc', a: 0.5, amp: 3, f: 0.036, rim: null },
  ],
  pebbles: ['#cfc6d2', '#d8d0c0', '#e8dcc8', '#c8bcc8', '#dcd2bc', '#f0e6d4'],
  flecks: ['#ffd75e', '#d8304a', '#ffffff'],
  treats: [2, 4, 14, 15, 14, 15],
  near: null,
};
// Along the top: tufts of grass, little flags pegged in the verge for the procession, and roses.
EDGE_KINDS.kingdom = (ctx, along, time, seed, width, camX) => {
  const tufts = [];
  const flags = [];
  const roses = [];
  along(9, (x, y, k) => {
    if (x < -10 || x > width + 10) return;
    const h = hash(k * 2.7 + seed * 3);
    if (h < 0.3) tufts.push([x, y, h, k]);
    else if (h < 0.38) flags.push([x, y, h, k]);
    else if (h < 0.42) roses.push([x, y, h, k]);
  });
  ctx.strokeStyle = '#6aa862';
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [x, y, h] of tufts) {
    const w = windAt(time, x + camX);
    const sway = Math.sin(time * 2 + (x + camX) * 0.05) * 0.5 * (0.5 + w) + w * 1.2;
    for (const dx of [-1.6, 0, 1.6]) {
      ctx.moveTo(x + dx, y);
      ctx.lineTo(x + dx + sway, y - 3.5 - h * 4);
    }
  }
  ctx.stroke();
  ctx.lineCap = 'butt';
  // Little pennants on sticks pegged into the verge, fluttering.
  for (const [x, y, h, k] of flags) {
    const f = Math.sin(time * 5 + (x + camX) * 0.09) * 0.8;
    ctx.fillStyle = '#8a6a50';
    ctx.fillRect(x - 0.4, y - 9, 0.9, 9);
    ctx.fillStyle = PENNANTS[k % PENNANTS.length];
    ctx.beginPath();
    ctx.moveTo(x + 0.5, y - 9);
    ctx.quadraticCurveTo(x + 3.5, y - 8.4 + f, x + 6.5, y - 7.6 - f);
    ctx.lineTo(x + 6.5, y - 5.6 - f);
    ctx.quadraticCurveTo(x + 3.5, y - 5.4 + f, x + 0.5, y - 5);
    ctx.fill();
  }
  // A rose or two in the verge.
  for (const [x, y, h, k] of roses) {
    ctx.fillStyle = k % 2 ? '#e8506a' : '#f8e0e8';
    ctx.beginPath();
    ctx.arc(x, y - 4.4, 2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = k % 2 ? '#c03a54' : '#e4c4d4';
    ctx.beginPath();
    ctx.arc(x + 0.6, y - 4, 1.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#5aae6c';
    ctx.beginPath();
    ctx.ellipse(x - 2, y - 2, 1.7, 1, -0.5, 0, TAU);
    ctx.fill();
  }
};
// ---- The town gate ----
// A great wooden gate in the town wall: stone either side, heavy doors with iron studs, a tiled
// roof over, and the kingdom's banner hanging down. At Go the doors swing open and stay open.
const gateArt = () => art('mc-kgate', 108, 128, () => {
  const out = [];
  // The stone either side and the arch.
  for (const x of [0, 82]) {
    out.push(R(x, 18, 26, 110, '#b6acc0'), F(R(x, 18, 26, 2.4, '#e0d6e4')));
    for (let y = 28; y < 126; y += 14) out.push(F(R(x + (y % 28 ? 0 : 13), y, 13, 1, '#9a90a8')));
  }
  out.push(R(22, 18, 64, 12, '#b6acc0'), F(R(22, 18, 64, 2.4, '#e0d6e4')));
  // The roof over it: dark tiles, eaves turning up.
  out.push(T([[2, 18], [20, 4], [88, 4], [106, 18], [98, 18], [86, 9], [22, 9], [10, 18]], '#4a4458'));
  out.push(F(R(18, 2, 72, 3.4, '#625c76')), F(E(54, 2, 10, 2, '#8a8296')));
  // The doorway: dark inside, so the open doors read.
  out.push(R(26, 30, 56, 98, '#3a3042'));
  return out;
});
const gateDoorArt = () => art('mc-kgdoor', 28, 96, () => {
  const out = [R(0, 0, 28, 96, '#7a4a34'), F(R(0, 0, 28, 2, '#a8704e')), F(R(0, 0, 3, 96, '#a8704e'))];
  for (let y = 10; y < 92; y += 18) out.push(F(R(2, y, 24, 2.4, '#5e3826')));
  for (let y = 16; y < 90; y += 18) for (const x of [7, 19]) out.push(F(E(x, y, 1.8, 1.8, '#d8cfc4')), F(E(x - 0.5, y - 0.5, 0.7, 0.7, '#ffffff')));
  return out;
});
// The guards either side: in the Kagami Wrestler, a spear held upright in the near paw. They stand
// easy, and as the countdown ends they ground their spears and straighten up; as yours goes
// through they turn and watch it away.
const GUARD_REST = [
  [0, { front: [3.4, -7], back: [-2, -2], pole: 0, tilt: -2, mouth: null }],
  [2.4, { front: [3.4, -7.4], back: [-2, -2], pole: 0, tilt: -2, hy: 1.4, mouth: null }],
  [4.8, { front: [3.4, -7], back: [-2, -2], pole: 0, tilt: -2, mouth: null }],
];
const GUARD_HAIL = [
  [0, { front: [3.4, -7], back: [-2, -2], pole: 0, tilt: -2, mouth: 'mochiw' }],
  [0.2, { front: [3.4, -10], back: [-2, -3], pole: -0.12, tilt: -5, lift: 1.6, mouth: 'o', sprout: 'excited' }],
  [0.38, { front: [3.4, -6], back: [-2, -1.6], pole: 0, tilt: 2, squat: 1, mouth: 'D', closed: [true, true], sprout: 'happy' }],
  [0.7, { front: [3.4, -7], back: [-2, -2], pole: 0, tilt: -2, mouth: 'D', sprout: 'happy' }],
  [1.2, { front: [3.4, -7], back: [-2, -2], pole: 0, tilt: -2, mouth: 'mochiw', sprout: 'happy' }],
];
const GUARDS = {};
const guardsOf = (wx) => (GUARDS[wx] ??= [
  { ...newRecord(rollMochi(11201 + wx, { coat: null })), dress: 'kagami' },
  { ...newRecord(rollMochi(11303 + wx, { coat: null })), dress: 'kagami' },
]);
// A guard's spear: a long shaft through the paw, a leaf blade on top, a tassel under it.
function spear(ctx, hand, ang, face) {
  const vx = Math.sin(ang) * face;
  const vy = -Math.cos(ang);
  const [hx, hy] = hand;
  ctx.strokeStyle = '#7a5038';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hx - vx * 10, hy - vy * 10);
  ctx.lineTo(hx + vx * 22, hy + vy * 22);
  ctx.stroke();
  ctx.lineCap = 'butt';
  const tx = hx + vx * 22;
  const ty = hy + vy * 22;
  ctx.fillStyle = '#d8d0dc';
  ctx.beginPath();
  ctx.moveTo(tx + vx * 7, ty + vy * 7);
  ctx.lineTo(tx - vy * 2, ty + vx * 2);
  ctx.lineTo(tx + vy * 2, ty - vx * 2);
  ctx.fill();
  ctx.fillStyle = ROYAL.gold;
  ctx.fillRect(tx - 1.4, ty - 1.4, 2.8, 2.8);
  ctx.fillStyle = ROYAL.cloth;
  ctx.fillRect(tx - vx * 3 - 1, ty - vy * 3, 2, 3.4);
}
function kingGate(ctx, map, x, gy, wx, time) {
  const R = live(time) && RUN.map === map ? RUN.R : null;
  const mo = R ? momentsOf(R) : {};
  const goK = mo.go != null ? time - mo.go : -1;
  // The doors: shut until Go, then swinging open and staying open.
  const open = goK < 0 ? 0 : Math.min(1, goK / 1.1) ** 0.7;
  place(ctx, gateArt(), snap(x), gy + 2);
  for (const side of [-1, 1]) {
    const hinge = x + side * 28;
    ctx.save();
    ctx.translate(hinge, gy - 94);
    ctx.transform(1 - open * 0.86, 0, 0, 1, 0, 0);
    ctx.translate(-hinge, -(gy - 94));
    place(ctx, gateDoorArt(), snap(hinge - side * 14), gy + 2, { flip: side < 0 });
    ctx.restore();
  }
  // The kingdom's banner over the arch: red, a gold crown on it, swaying.
  const bx = x;
  const by = gy - 112;
  pivoted(ctx, bx, by, Math.sin(time * 1.1 + wx) * 0.02, () => {
    ctx.fillStyle = ROYAL.deep;
    ctx.fillRect(bx - 11, by, 22, 30);
    ctx.fillStyle = ROYAL.cloth;
    ctx.fillRect(bx - 10, by, 20, 29);
    ctx.beginPath();
    ctx.moveTo(bx - 10, by + 29);
    ctx.lineTo(bx, by + 34);
    ctx.lineTo(bx + 10, by + 29);
    ctx.fill();
    crownMark(ctx, bx, by + 14, 6, ROYAL.gold);
  });
  // The two guards, on the ground either side of the doorway.
  const [a, b] = guardsOf(wx);
  const hail = goK >= 0 && goK < 1.2;
  const t = hail ? goK : (time + hash(wx) * 4) % 4.8;
  const keys = hail ? GUARD_HAIL : GUARD_REST;
  const P = routine(keys, t);
  const youX = R ? x + (RUN.you.x - wx) : null;
  for (const [i, g] of [a, b].entries()) {
    const gx = x + (i ? 62 : -62);
    const face = youX != null && youX > gx + 10 ? -1 : 1;
    posed(ctx, g, gx, gy, keys, t, { facing: face, hold: 'front', slot: `guard|${wx}|${i}`, under: (c, hand) => spear(c, hand, P.pole ?? 0, face) });
  }
}
// A little crown, drawn straight: three points, a band, a jewel.
function crownMark(ctx, x, y, r, c) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x - r, y + r * 0.5);
  ctx.lineTo(x - r, y - r * 0.6);
  ctx.lineTo(x - r * 0.5, y - r * 0.1);
  ctx.lineTo(x, y - r * 0.8);
  ctx.lineTo(x + r * 0.5, y - r * 0.1);
  ctx.lineTo(x + r, y - r * 0.6);
  ctx.lineTo(x + r, y + r * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = mix(c, '#ffffff', 0.45);
  ctx.fillRect(x - r, y + r * 0.1, r * 2, r * 0.26);
}
// ---- Banner poles along the town road ----
// A tall pole with a long vertical banner, the crown on it, rippling along its length.
function bannerPole(ctx, x, gy, wx, time, v) {
  ctx.fillStyle = '#6a4a38';
  ctx.fillRect(snap(x - 1.5), snap(gy - 76), 3, 78);
  ctx.fillStyle = ROYAL.gold;
  ctx.beginPath();
  ctx.arc(x, gy - 77, 2.4, 0, TAU);
  ctx.fill();
  const c = v % 2 ? ROYAL.cloth : '#3a6ad8';
  const w = windAt(time, wx);
  ctx.beginPath();
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    const rip = Math.sin(time * 3 + u * 5 + wx * 0.02) * (1.2 + w * 2) * u;
    ctx.lineTo(x + 2 + rip, gy - 72 + u * 44);
  }
  for (let i = 8; i >= 0; i--) {
    const u = i / 8;
    const rip = Math.sin(time * 3 + u * 5 + wx * 0.02) * (1.2 + w * 2) * u;
    ctx.lineTo(x + 15 + rip, gy - 72 + u * 44);
  }
  ctx.closePath();
  ctx.fillStyle = c;
  ctx.fill();
  ctx.fillStyle = mix(c, '#000000', 0.18);
  ctx.fillRect(x + 2, gy - 72, 13, 1.6);
  crownMark(ctx, x + 8.5 + Math.sin(time * 3 + 2.5 + wx * 0.02) * (1.2 + w * 2) * 0.5, gy - 56, 4, ROYAL.gold);
}
// ---- The moat ----
// A rowing boat out on the water, a Mochi at the oars and another waving; it rocks on the swell,
// and the wave of its hull sits on the water's skin.
const boatArt = (v) => art(`mc-kboat|${v}`, 54, 18, () => [
  T([[2, 6], [52, 6], [46, 16], [8, 16]], '#8a5a40'), F(T([[4, 7.4], [50, 7.4], [45, 10], [9, 10]], '#b07a58')),
  F(R(6, 6, 42, 1.6, ['#d8304a', '#3a6ad8', '#ffd75e'][v % 3])), F(R(16, 10, 22, 1.4, '#6a4430')),
  F(E(27, 16.4, 22, 1.6, '#5e3826')),
]);
function kingBoat(ctx, map, w, cam, time, wx, v) {
  const x = wx - cam.x;
  const base = w.y - cam.y + swell(wx, time) - 1;
  const rock = Math.sin(time * 1.3 + v * 2) * 0.05;
  const y = base + Math.sin(time * 1.1 + v) * 0.8;
  const youX = live(time) && RUN.map === map ? x + (RUN.you.x - wx) : null;
  const near = youX != null && Math.abs(youX - x) < 110;
  // The oars, dipping and pulling.
  const stroke = (time * 1.1 + v) % 1;
  const a = Math.sin(stroke * TAU) * 0.5;
  pivoted(ctx, x, y, rock, () => {
    ctx.strokeStyle = '#8a5a40';
    ctx.lineWidth = 1.6;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 6);
      ctx.lineTo(x - 4 - Math.cos(a) * 14, y - 6 + Math.sin(a) * 7 * side + 5);
      ctx.stroke();
    }
    // The rower and a passenger waving at the race.
    const pool = picnickers();
    const h = hash(v * 3.7);
    ctx.save();
    ctx.translate(x - 4, y - 7);
    ctx.scale(0.6, 0.6);
    drawSpectator(ctx, pool[Math.floor(h * pool.length)], 0, 0, 0, youX != null && youX < x ? -1 : 1, `boat|${v}|0`);
    ctx.restore();
    const into = (time + v) % (near ? 0.95 : 4);
    const beat = into < 0.95 ? CHEER_SEQ[Math.min(CHEER_SEQ.length - 1, Math.floor((into / 0.95) * CHEER_SEQ.length))] : 0;
    ctx.save();
    ctx.translate(x + 12, y - 7 - (into < 0.95 ? Math.sin((Math.PI * into) / 0.95) * 1.2 : 0));
    ctx.scale(0.6, 0.6);
    drawSpectator(ctx, pool[Math.floor(hash(v * 5.1) * pool.length)], 0, 0, beat, youX != null && youX < x ? -1 : 1, `boat|${v}|1`);
    ctx.restore();
    place(ctx, boatArt(v), snap(x), y + 6);
  });
}
// The drawbridge over the moat: two heavy chains from the gatehouse down to a raised span, hanging
// overhead as the swimmers pass under; the chains sway as yours goes by.
function drawbridge(ctx, map, x, top, wx, time) {
  const R = live(time) && RUN.map === map ? RUN.R : null;
  const k = R && Math.abs(RUN.you.x - wx) < 150 ? 1 - Math.abs(RUN.you.x - wx) / 150 : 0;
  const sway = Math.sin(time * 2.2) * 1.4 * k;
  // The gatehouse it hangs from, and the span, angled up.
  ctx.fillStyle = '#b6acc0';
  ctx.fillRect(snap(x - 16), snap(top - 54), 32, 54);
  ctx.fillStyle = '#e0d6e4';
  ctx.fillRect(snap(x - 16), snap(top - 54), 32, 2.4);
  ctx.fillStyle = '#9a90a8';
  for (const dx of [-12, -2, 8]) ctx.fillRect(snap(x + dx), snap(top - 50), 6, 2.4);
  ctx.save();
  ctx.translate(x - 16, top - 6);
  ctx.rotate(-0.95);
  ctx.fillStyle = '#7a4a34';
  ctx.fillRect(0, -7, 54, 8);
  ctx.fillStyle = '#a8704e';
  ctx.fillRect(0, -7, 54, 2);
  ctx.fillStyle = '#5e3826';
  for (let i = 8; i < 52; i += 11) ctx.fillRect(i, -7, 2, 8);
  ctx.restore();
  // Its chains.
  ctx.strokeStyle = '#8a8296';
  ctx.lineWidth = 1.2;
  for (const dx of [-13, 9]) {
    ctx.beginPath();
    ctx.moveTo(x + dx, top - 50);
    ctx.quadraticCurveTo(x + dx - 12 + sway, top - 32, x - 36 + sway * 2, top - 32);
    ctx.stroke();
  }
}
// ---- The castle walls ----
// A wall of cut stone: big blocks in offset courses, lit along each top edge, moss in the joints,
// iron rungs set in for the climb, and a little arrow slit here and there.
const kingWallArt = (h, seed) => art(`mc-kwall|${h}|${seed}`, 66, h + 6, () => {
  const out = [];
  const H = h + 6;
  const TONES = ['#cfc6d2', '#c2b8c6', '#d8d0dc', '#bcb2c2', '#c8c0cc'];
  const block = (x0, y0, x1, y1, c, k) => {
    out.push(R(x0, y0, x1 - x0, y1 - y0, c));
    out.push(F(R(x0, y0 + 0.4, x1 - x0, 1.2, '#eae2ee')));
    out.push(F(R(x0, y1 - 1.2, x1 - x0, 1, shade(c, -16))));
    if (hash(k * 2.3) > 0.72) out.push(F(E(x0 + 3 + hash(k * 5) * (x1 - x0 - 6), y0 + 2.4, 1.6, 0.8, '#8ab070')));
  };
  for (let r = 0, y1 = H; y1 > 6; r++) {
    const bh = 13 + hash(seed * 1.7 + r) * 4;
    const y0 = Math.max(5, y1 - bh);
    const off = r % 2 ? 11 : 0;
    for (let x = 3 - off; x < 60; x += 22) {
      const x0 = Math.max(3, x);
      const x1 = Math.min(60, x + 22 - 1.2);
      if (x1 - x0 > 3) block(x0, y0 + 0.6, x1, y1 - 0.6, TONES[Math.floor(hash(seed + r * 2.3 + x * 0.7) * TONES.length)], seed + r * 13 + x);
    }
    y1 = y0;
    if (y1 <= 6) break;
  }
  // The iron rungs set into it for the climb, and an arrow slit or two.
  for (let r = 0, y = H - 15; y > 15; r++, y -= 15) {
    const hx = 24 + (r % 2 ? 12 : 2) + hash(seed + r * 3.3) * 6;
    out.push(R(hx - 5, y - 1.4, 10, 2.8, '#6a6076'), F(R(hx - 5, y - 1.4, 10, 1, '#9a90a8')));
  }
  for (let y = 24; y < H - 20; y += 46) out.push(F(R(14 + ((y / 46) | 0) * 24, y, 3, 9, '#4a4058')), F(R(14 + ((y / 46) | 0) * 24, y + 3, 3, 3, '#3a3048')));
  // The top: a crenellated parapet.
  out.push(R(2, 3, 58, 6, '#c8c0cc'), F(R(2, 3, 58, 1.4, '#eae2ee')));
  for (let x = 3; x < 58; x += 13) out.push(R(x, 0, 8, 4, '#c8c0cc'), F(R(x, 0, 8, 1.2, '#eae2ee')));
  return out;
});
// At each wall top, a flag pole: the flag lies furled until yours comes over, then runs up the pole
// and flies out, and a shout of gold sparks goes up with it.
function wallFlag(ctx, x, top, wx, time, k) {
  const poleTop = top - 46;
  ctx.fillStyle = '#6a4a38';
  ctx.fillRect(snap(x + 5), snap(poleTop), 3, 48);
  ctx.fillStyle = ROYAL.gold;
  ctx.beginPath();
  ctx.arc(x + 6.5, poleTop, 2.4, 0, TAU);
  ctx.fill();
  // How far up the flag is: furled at the foot, running up over a second once yours is over.
  const up = k < 0 ? 0 : Math.min(1, k / 1.1) ** 0.8;
  const fy = poleTop + 6 + (1 - up) * 30;
  const w = windAt(time, wx);
  const fly = 0.25 + up * 0.75;
  ctx.beginPath();
  for (let i = 0; i <= 7; i++) {
    const u = i / 7;
    const rip = Math.sin(time * 4 + u * 6 + wx * 0.02) * (1 + w * 2.4) * u * fly;
    ctx.lineTo(x + 7 + u * 26 * fly, fy + rip);
  }
  for (let i = 7; i >= 0; i--) {
    const u = i / 7;
    const rip = Math.sin(time * 4 + u * 6 + wx * 0.02) * (1 + w * 2.4) * u * fly;
    ctx.lineTo(x + 7 + u * 26 * fly, fy + 15 * (0.4 + 0.6 * fly) + rip);
  }
  ctx.closePath();
  ctx.fillStyle = ROYAL.cloth;
  ctx.fill();
  if (fly > 0.5) crownMark(ctx, x + 7 + 13 * fly, fy + 8, 4.4 * fly, ROYAL.gold);
  if (k >= 0 && k < 1.4) {
    ctx.fillStyle = ROYAL.gold;
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * TAU + k * 2;
      const d = 8 + k * 24;
      ctx.globalAlpha = Math.max(0, 1 - k / 1.4);
      ctx.fillRect(x + 7 + Math.cos(ang) * d - 0.9, poleTop + 10 + Math.sin(ang) * d * 0.7 - 0.9, 1.8, 1.8);
    }
    ctx.globalAlpha = 1;
  }
}
// ---- The keep's launch ----
// The ramp off the keep: pale stone with a red carpet down it, a gold rail, and a pennant pole
// either side that whips as yours takes off.
const keepRampArt = () => art('mc-kramp', 64, 24, () => [
  T([[2, 22], [58, 7], [62, 7], [62, 22]], '#c2b8c6'), F(T([[2, 22], [58, 7], [62, 7], [62, 9.4], [6, 22]], '#e0d6e4')),
  F(T([[8, 20.6], [58, 7.4], [60, 7.4], [60, 10], [12, 22]], ROYAL.cloth)), F(T([[8, 20.6], [58, 7.4], [59, 7.4], [59, 8.6], [10, 21.4]], '#f06a80')),
  R(56, 7, 6, 16, '#a8a0b4'), F(R(56, 7, 6, 1.6, ROYAL.gold)),
]);
// ---- The royal road ----
// A lantern pole along the road home: a tall post with a crown on top, a warm lamp hanging from its
// arm, and a long pennant below it.
function roadPole(ctx, x, gy, wx, time, v) {
  ctx.fillStyle = '#5a4a40';
  ctx.fillRect(snap(x - 1.8), snap(gy - 86), 3.6, 88);
  ctx.fillStyle = '#6a5a4e';
  ctx.fillRect(snap(x - 1), snap(gy - 86), 1.2, 88);
  crownMark(ctx, x, gy - 90, 4.6, ROYAL.gold);
  ctx.fillStyle = '#5a4a40';
  ctx.fillRect(snap(x), snap(gy - 80), 13, 2.4);
  const lx = x + 12;
  const ly = gy - 78;
  // Its light pooling on the road under it.
  ctx.save();
  ctx.globalAlpha = 0.5;
  const pool = ctx.createRadialGradient(lx, gy, 0, lx, gy, 54);
  pool.addColorStop(0, 'rgba(255,206,140,0.5)');
  pool.addColorStop(1, 'rgba(255,206,140,0)');
  ctx.fillStyle = pool;
  ctx.beginPath();
  ctx.ellipse(lx, gy, 54, 13, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  glow(ctx, lx, ly + 7, 22, '255,206,140', 0.95);
  pivoted(ctx, lx, ly, Math.sin(time * 1.3 + v * 2) * 0.05, () => {
    ctx.fillStyle = '#3a2a30';
    ctx.fillRect(snap(lx - 3.5), snap(ly + 2), 7, 2);
    ctx.fillStyle = '#ffdca0';
    ctx.beginPath();
    ctx.ellipse(lx, ly + 7.5, 4, 5, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff4d8';
    ctx.beginPath();
    ctx.ellipse(lx - 1, ly + 6, 1.6, 2.2, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3a2a30';
    ctx.fillRect(snap(lx - 3.5), snap(ly + 11.5), 7, 2);
  });
  // The pennant below the lamp arm.
  const w = windAt(time, wx);
  const c = v % 2 ? ROYAL.cloth : '#3a6ad8';
  ctx.beginPath();
  for (let i = 0; i <= 6; i++) {
    const u = i / 6;
    const rip = Math.sin(time * 3.4 + u * 5 + wx * 0.02) * (1 + w * 2) * u;
    ctx.lineTo(x + 2 + rip, gy - 68 + u * 26);
  }
  for (let i = 6; i >= 0; i--) {
    const u = i / 6;
    const rip = Math.sin(time * 3.4 + u * 5 + wx * 0.02) * (1 + w * 2) * u;
    ctx.lineTo(x + 11 + rip, gy - 68 + u * 26);
  }
  ctx.closePath();
  ctx.fillStyle = c;
  ctx.fill();
}
// Between the road's poles: a cord slung from one to the next, little pennants along it in the
// kingdom's colours and a warm light between each pair, the whole line swaying together.
function roadString(ctx, map, from, to, cam, time) {
  const ax = from - cam.x;
  const bx = to - cam.x;
  const ay = groundAt(map, from) - cam.y - 80;
  const by = groundAt(map, to) - cam.y - 80;
  const sag = 16;
  const cy = (ay + by) / 2 + sag * 2;
  const at = (u) => [(1 - u) * (1 - u) * ax + 2 * u * (1 - u) * ((ax + bx) / 2) + u * u * bx,
    (1 - u) * (1 - u) * ay + 2 * u * (1 - u) * cy + u * u * by];
  ctx.strokeStyle = '#6a5a4e';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.quadraticCurveTo((ax + bx) / 2, cy, bx, by);
  ctx.stroke();
  const n = 9;
  for (let k = 1; k < n; k++) {
    const u = k / n;
    const [px, py] = at(u);
    const sway = Math.sin(time * 1.6 + from * 0.01 + k) * 0.5;
    if (k % 2) {
      // A pennant hanging from the cord.
      ctx.fillStyle = PENNANTS[(k + from) % PENNANTS.length];
      ctx.beginPath();
      ctx.moveTo(px - 3.4 + sway, py);
      ctx.lineTo(px + 3.4 + sway, py);
      ctx.lineTo(px + sway * 1.6, py + 8);
      ctx.fill();
    } else {
      // A little warm light.
      glow(ctx, px + sway, py + 2.4, 9, '255,206,140', 0.85);
      ctx.fillStyle = '#ffe2a8';
      ctx.beginPath();
      ctx.arc(px + sway, py + 2.4, 1.8, 0, TAU);
      ctx.fill();
    }
  }
}
// The subjects lining the road: three or four Mochi standing along the verge, each waving a little
// flag on a stick, cheering hard as yours comes by.
const SUBJECTS = {};
const subjectsOf = (wx) => (SUBJECTS[wx] ??= Array.from({ length: 4 }, (_, i) => newRecord(rollMochi(11500 + wx + i * 37, { coat: null }))));
function subjects(ctx, map, x, gy, wx, time) {
  const pool = subjectsOf(wx);
  const youX = live(time) && RUN.map === map ? x + (RUN.you.x - wx) : null;
  for (let k = 0; k < pool.length; k++) {
    const h = hash(wx * 1.3 + k * 2.9);
    const mx = x - 24 + k * 16;
    const near = youX != null && Math.abs(youX - mx) < 90;
    const period = near ? 0.8 + h * 0.2 : 2.6 + h * 2;
    const len = near ? period : 1;
    const into = (time + h * 11) % period;
    const beat = into < len ? CHEER_SEQ[Math.min(CHEER_SEQ.length - 1, Math.floor((into / len) * CHEER_SEQ.length))] : 0;
    const hop = into < len ? Math.sin((Math.PI * into) / len) * (near ? 2.4 : 1.4) : 0;
    const facing = youX != null ? (youX < mx ? -1 : 1) : h < 0.5 ? -1 : 1;
    ctx.save();
    ctx.translate(mx + Math.sin(time * (1.3 + h) + h * 18) * 0.4, gy - hop);
    ctx.scale(0.64, 0.64);
    drawSpectator(ctx, pool[k], 0, 0, beat, facing, `subject|${wx}|${k}`);
    ctx.restore();
    // Its little flag, held up and waving.
    const fx = mx + facing * 5;
    const fy = gy - 15 - hop - beat * 1.6;
    const wave = Math.sin(time * (6 + beat) + k * 2) * 0.3;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(facing * (0.5 + wave));
    ctx.fillStyle = '#8a6a50';
    ctx.fillRect(-0.4, -1, 0.9, 11);
    ctx.fillStyle = PENNANTS[(k + wx) % PENNANTS.length];
    ctx.beginPath();
    ctx.moveTo(0.5, -1);
    ctx.lineTo(6.5, 0.6);
    ctx.lineTo(0.5, 3.4);
    ctx.fill();
    ctx.restore();
  }
}
// ---- The crown by the finish ----
// The kingdom's crown on a velvet cushion, up on a little dais behind the podium: a gold band with
// five points, a jewel in each, a red cap inside, pearls round the rim. It turns slowly, and when
// yours is home it lifts, gleams and sheds a few gold sparks.
const crownArt = () => art('mc-kcrown', 86, 96, () => {
  const out = [];
  // The dais and its cushion.
  out.push(R(3, 74, 80, 10, '#8a5a40'), F(R(3, 74, 80, 2.4, '#b07a58')), F(R(3, 82, 80, 2, '#6a4430')));
  out.push(R(10, 84, 66, 8, '#7a4a34'), F(R(10, 90, 66, 2, '#5e3826')));
  out.push(E(43, 68, 32, 10, ROYAL.deep), F(E(43, 65, 29, 7, ROYAL.cloth)), F(E(30, 63, 10, 3, '#f06a80')));
  for (const x of [13, 73]) out.push(F(E(x, 72, 3.4, 3.4, ROYAL.gold)));
  // The crown: its band, its points, the cap, the jewels.
  out.push(T([[18, 60], [68, 60], [64, 30], [58, 42], [50, 24], [43, 38], [36, 24], [28, 42], [22, 30]], ROYAL.gold));
  out.push(F(T([[18, 60], [68, 60], [67, 50], [19, 50]], ROYAL.goldDk)));
  out.push(F(T([[20, 52], [66, 52], [66, 56], [20, 56]], '#ffeeae')));
  out.push(F(T([[24, 46], [62, 46], [60, 40], [26, 40]], ROYAL.cloth)));
  for (const [x, y, c] of [[43, 54, '#e8304a'], [30, 54, '#3a9ae8'], [56, 54, '#5ad88a'], [43, 30, '#e8304a']]) out.push(F(E(x, y, 3, 3, c)), F(E(x - 1, y - 1, 1, 1, '#ffffff')));
  for (const x of [22, 28, 36, 43, 50, 58, 64]) out.push(F(E(x, 26 + (x === 43 ? -4 : x === 36 || x === 50 ? -2 : 4), 2.2, 2.2, '#fff8e8')));
  out.push(F(E(34, 57, 7, 1.6, '#ffeeae')));
  return out;
});
// Hayate herself at the end of the royal road, which is who the whole progress has been coming to
// see: she stands on a low dais behind the podium, asleep as ever, under her own light. As yours
// comes home she wakes, and a shower of gold goes up off her.
function kingHayate(ctx, map, x, gy, wx, time) {
  const R = live(time) && RUN.map === map ? RUN.R : null;
  const mo = R ? momentsOf(R) : {};
  const k = mo.home != null ? time - mo.home : -1;
  const awake = k >= 0;
  // Her dais: two low steps she stands on top of, with the road's carpet running up onto it.
  for (let i = 0; i < 2; i++) {
    const w = 150 - i * 34;
    ctx.fillStyle = '#b8aec4';
    ctx.fillRect(snap(x - w / 2), snap(gy - (i + 1) * 7 + 2), w, 7);
    ctx.fillStyle = '#d8d0e0';
    ctx.fillRect(snap(x - w / 2), snap(gy - (i + 1) * 7 + 2), w, 1.6);
  }
  ctx.fillStyle = ROYAL.cloth;
  ctx.fillRect(snap(x - 100), snap(gy - 2), 100, 4);
  ctx.fillRect(snap(x - 58), snap(gy - 9), 58, 7);
  // The light she sits in (it swells as she comes to, rather than switching on), and the Queen
  // herself, standing on the dais's top step.
  const lit = awake ? Math.min(1, k / 1.2) : 0;
  glow(ctx, x, gy - 60, 86 + 26 * lit, '255,236,200', 0.32 + 0.26 * lit);
  drawHayate(ctx, x, gy - DAIS_TOP, time, { s: 2, awake, wake: awake ? k : null });
  // And the gold that goes up off her: not at the line, where the finish's own confetti would
  // swallow it, but as she rises and opens her hand (WAKE_SECS * 0.46 in). Each mote starts low
  // about her, climbs on its own slow curve, sways as it goes and twinkles out near the top, so it
  // reads as her light lifting off her rather than a ring thrown outward.
  const up = k - WAKE_SECS * 0.46;
  if (up > 0 && up < 5.6) {
    for (let i = 0; i < 34; i++) {
      const u = (up / 4.6) * 1.35 - hash(i * 3.7) * 0.42;
      if (u <= 0 || u >= 1) continue;
      const e = 1 - (1 - u) ** 2;
      const side = (hash(i * 1.9) - 0.5) * 2;
      const mx = x + side * (14 + 34 * e) + Math.sin(u * 5.4 + i) * (3 + 5 * e);
      const my = gy - 22 - e * (86 + hash(i * 5.1) * 58);
      const tw = 0.55 + 0.45 * Math.sin(up * 7 + i * 2.1);
      ctx.globalAlpha = Math.min(1, u * 6) * (1 - u) ** 1.3 * tw;
      ctx.fillStyle = i % 4 === 0 ? '#fffbe4' : i % 3 ? ROYAL.gold : '#fff4c0';
      const r = 1.1 + hash(i * 7.3) * 1.8;
      ctx.fillRect(mx - r, my - r, r * 2, r * 2);
      // (The biggest ones catch the light as a little four-point star.)
      if (r > 2.1 && tw > 0.76) {
        ctx.fillRect(mx - r * 2.6, my - 0.5, r * 5.2, 1);
        ctx.fillRect(mx - 0.5, my - r * 2.6, 1, r * 5.2);
      }
    }
    ctx.globalAlpha = 1;
  }
}
// The top of her dais, above the road: where her feet stand.
const DAIS_TOP = 12;
function kingCrown(ctx, map, x, gy, wx, time) {
  const R = live(time) && RUN.map === map ? RUN.R : null;
  const mo = R ? momentsOf(R) : {};
  const k = mo.home != null ? time - mo.home : -1;
  const lift = k > 0 && k < 3 ? Math.sin(Math.min(1, k / 0.5) * Math.PI * 0.5) * 9 * Math.exp(-k * 0.5) : 0;
  const bright = k > 0 && k < 3 ? Math.exp(-k * 0.9) : 0;
  glow(ctx, x, gy - 58 - lift, 44, '255,215,140', 0.4 + 0.5 * bright);
  pivoted(ctx, x, gy, Math.sin(time * 0.8 + wx) * 0.01, () => place(ctx, crownArt(), snap(x), gy + 2 - lift));
  // Its gleam: a slow star crossing the band, and sparks when yours is home.
  const g = (time * 0.4 + hash(wx)) % 1;
  if (g < 0.5) {
    const gx = x - 20 + g * 80;
    ctx.globalAlpha = Math.sin(g * 2 * Math.PI) * 0.9;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(gx - 0.8, gy - 44 - lift - 5, 1.6, 10);
    ctx.fillRect(gx - 5, gy - 44 - lift - 0.8, 10, 1.6);
    ctx.globalAlpha = 1;
  }
  if (k > 0 && k < 2.4) {
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * TAU + k * 1.5;
      const d = 18 + k * 30;
      ctx.globalAlpha = Math.max(0, 1 - k / 2.4);
      ctx.fillStyle = i % 3 ? ROYAL.gold : '#fff4c0';
      ctx.fillRect(x + Math.cos(ang) * d - 1, gy - 52 - lift + Math.sin(ang) * d * 0.7 - 1, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
}
// On the moat, behind the swimmers: the drawbridge hanging overhead at the gatehouse end, and the
// boats out on the water further off.
const KBOATS = [2430, 2760, 3090];
function kingMoat(ctx, map, cam, time) {
  const w = (map.water ?? []).find((x) => x.kind === 'moat');
  if (!w) return;
  for (const [i, wx] of KBOATS.entries()) {
    const x = wx - cam.x;
    if (x < -70 || x > 710) continue;
    // (Further out on the water: a little higher up the skin and a touch smaller.)
    ctx.save();
    ctx.translate(0, -7);
    ctx.scale(1, 0.92);
    kingBoat(ctx, map, w, cam, time, wx, i);
    ctx.restore();
  }
  const bx = 2150 - cam.x;
  if (bx > -90 && bx < 730) drawbridge(ctx, map, bx, groundAt(map, 2090) - cam.y, 2150, time);
}
// Each frame of a kingdom race: yours coming over a wall's top (its flag runs up), and taking off
// from the keep.
function noteKingdom(map, R, mo, time) {
  const you = R.racers[R.me];
  const was = you.kingMode;
  you.kingMode = you.m.mode;
  if (R.phase !== 'run' || !was || was === you.m.mode) return;
  if (was === 'climb') {
    let best = null;
    for (const [kind, wx] of map.townPieces ?? []) if (kind === 'mr_wall' && wx <= you.x + 20 && (best == null || wx > best)) best = wx;
    if (best != null) (mo.tops ??= {})[best] ??= time;
  }
  if (you.m.mode === 'fly') mo.launch ??= time;
}
// The things that stand beside the track (drawn behind the ground, the runners passing in front).
// ---------- The Mochi Race Stadium ('course:stadium'; its redraw, 2026-11-13) ----------
// The plaza you stand in before a race, and the only Mochi place that was never redrawn with the
// courses. It is an open-air bowl on a sunny afternoon: far off, the far side of the stands curving
// away with pennants along its top and the town's roofs beyond; nearer, the terrace that runs the
// length of the plaza under a striped awning, with the day's standings on a board and blossom in
// planters along it; and in front of that the swept clay of the track, chalked with a lane line.
// The winners' podium stands where the races finish, and pennant poles mark the way out to the
// courses.

// The far side of the bowl: a long bank of seats curving away, its rows of Mochi just specks at
// this distance, under a pale awning. It stands high enough to be seen over the near stands.
function farStand(ctx, cam, width, y0, air) {
  const par = 0.08;
  const base = y0 - 34;
  const off = cam.x * par;
  const top = (sx) => base - 46 - Math.cos(((sx + off - 480) / 1600) * Math.PI) * 12;
  const W = (c, k) => mix(c, air, k);
  // The bank itself.
  ctx.fillStyle = W('#aab8d4', 0.26);
  ctx.beginPath();
  ctx.moveTo(-8, base + 60);
  for (let sx = -8; sx <= width + 8; sx += 6) ctx.lineTo(sx, top(sx));
  ctx.lineTo(width + 8, base + 60);
  ctx.fill();
  // Its rows, each one a shade paler as it climbs.
  for (let r = 0; r < 6; r++) {
    ctx.fillStyle = W(r % 2 ? '#d2dcf0' : '#bcc8e2', 0.22);
    ctx.beginPath();
    ctx.moveTo(-8, top(-8) + 7 + r * 7);
    for (let sx = -8; sx <= width + 8; sx += 6) ctx.lineTo(sx, top(sx) + 7 + r * 7);
    for (let sx = width + 8; sx >= -8; sx -= 6) ctx.lineTo(sx, top(sx) + 11.4 + r * 7);
    ctx.fill();
  }
  // The crowd in them, too far to be more than specks.
  const specks = ['#ff9ec0', '#8fc8ee', '#ffcf86', '#9fd8a8', '#c8a8f0'];
  repeat(cam.x, par, 6, width, (i, sx) => {
    if (hash(i * 5.3) < 0.14) return;
    const r = Math.floor(hash(i * 2.7) * 6);
    ctx.fillStyle = W(specks[Math.floor(hash(i * 1.7) * specks.length)], 0.18);
    ctx.fillRect(snap(sx), snap(top(sx) + 7.4 + r * 7), 3.4, 3.6);
  });
  // The roof over the back of it, its front edge scalloped, and the rail along the front.
  ctx.fillStyle = W('#f0a8c0', 0.2);
  ctx.beginPath();
  ctx.moveTo(-8, top(-8) - 2);
  for (let sx = -8; sx <= width + 8; sx += 6) ctx.lineTo(sx, top(sx) - 2);
  for (let sx = width + 8; sx >= -8; sx -= 6) ctx.lineTo(sx, top(sx) - 11);
  ctx.fill();
  ctx.fillStyle = W('#fff4ea', 0.2);
  repeat(cam.x, par, 13, width, (i, sx) => {
    ctx.beginPath();
    ctx.arc(sx + 6.5, top(sx) - 2, 6.5, 0, Math.PI);
    ctx.fill();
  });
  ctx.fillStyle = W('#8fa0c4', 0.24);
  ctx.beginPath();
  for (let sx = -8; sx <= width + 8; sx += 6) ctx.lineTo(sx, top(sx) + 49);
  for (let sx = width + 8; sx >= -8; sx -= 6) ctx.lineTo(sx, top(sx) + 52);
  ctx.fill();
  return top;
}
// A pennant on a thin pole, in a few cached shapes so it flies without asking for a new drawing.
const pennantArt = (c, f) => art(`st-pennant|${c}|${f}`, 20, 32, () => {
  const k = (f - 2) / 2;
  return [F(R(1, 0, 1.6, 32, '#cbb79c')), F(E(1.8, 0.8, 1.6, 1.6, '#e8c470')),
    F(T([[2.6, 1.8], [18 + k * 1.8, 4.4 + k * 2.2], [17 + k * 2, 9 + k * 2.6], [2.6, 11]], c)),
    F(T([[2.6, 1.8], [10 + k, 3 + k], [9.6 + k, 6.6 + k], [2.6, 6.6]], mix(c, '#ffffff', 0.35)))];
}, false);
// The pennants along the top of the far stand.
function farPennants(ctx, cam, width, top, air) {
  const cols = ['#ff9ec0', '#ffd79a', '#9fd8e8', '#c8b0f0'];
  repeat(cam.x, 0.08, 68, width, (i, sx) => {
    const c = mix(cols[Math.abs(i) % cols.length], air, 0.22);
    place(ctx, pennantArt(c, 2), snap(sx), snap(top(sx) - 8));
  });
}

COURSES.stadium = {
  far(ctx, t, cam, width, y0, time) {
    const air = t.sky[1];
    goldenSky(ctx, width, y0, 0);
    clouds(ctx, cam, width, time, t.face === 'moon');
    // The town the stadium was built beside, off over the hills.
    const sky2 = mix(air, '#ffffff', 0.3);
    hills(ctx, cam, width, y0 - 96, 22, 0.03, 4.1, mix('#cfe4ef', sky2, 0.55), mix('#e8f4fa', sky2, 0.5));
    const ridge = hills(ctx, cam, width, y0 - 76, 26, 0.04, 2.3, mix('#b8ddbe', air, 0.4), mix('#dcf0dc', air, 0.36));
    repeat(cam.x, 0.04, 96, width, (i, sx) => {
      if (hash(i * 3.3) < 0.4) return;
      const h = 10 + hash(i * 7.1) * 10;
      const gy = ridge(sx) + 6;
      ctx.fillStyle = mix('#e4d8ea', air, 0.46);
      ctx.fillRect(snap(sx), snap(gy - h), 14, h);
      ctx.fillStyle = mix('#c08a9c', air, 0.46);
      ctx.beginPath();
      ctx.moveTo(sx - 2, gy - h);
      ctx.lineTo(sx + 7, gy - 7 - h);
      ctx.lineTo(sx + 16, gy - h);
      ctx.fill();
    });
    const top = farStand(ctx, cam, width, y0, air);
    farPennants(ctx, cam, width, top, air);
    return true;
  },
  mid(ctx, t, cam, width, y0, time) {
    const air = t.sky[1];
    // The infield: a wide band of close-cropped grass between the far stand and the track, which is
    // also what hides the foot of the far stand.
    // (This map's middle plane sits a little under the ground line, so the terrace is built up
    // from well above it.)
    const turf = hills(ctx, cam, width, y0 - 66, 9, 0.42, 5.1, mix('#9ad69e', air, 0.1), mix('#c8ecbc', air, 0.08));
    // The terrace along the back of the plaza: a low wall, posts, and a striped awning over them.
    const par = 0.42;
    const off = cam.x * par;
    const wallY = (sx) => turf(sx) + 34;
    const H = 52;
    ctx.fillStyle = '#e8d2ae';
    ctx.beginPath();
    ctx.moveTo(-8, wallY(-8));
    for (let sx = -8; sx <= width + 8; sx += 8) ctx.lineTo(sx, wallY(sx));
    for (let sx = width + 8; sx >= -8; sx -= 8) ctx.lineTo(sx, wallY(sx) - H);
    ctx.fill();
    ctx.fillStyle = '#c9ae85';
    ctx.beginPath();
    for (let sx = -8; sx <= width + 8; sx += 8) ctx.lineTo(sx, wallY(sx) - 3.4);
    for (let sx = width + 8; sx >= -8; sx -= 8) ctx.lineTo(sx, wallY(sx) - 5);
    ctx.fill();
    // The awning: stripes along it, scalloped at its edge, with the posts it stands on.
    repeat(cam.x, par, 26, width, (i, sx) => {
      const y = wallY(sx) - H;
      ctx.fillStyle = Math.abs(i) % 2 ? '#f47ca8' : '#fff4ea';
      ctx.fillRect(snap(sx), snap(y - 9), 27, 9);
      ctx.fillStyle = Math.abs(i) % 2 ? '#dc5c8a' : '#efe0d0';
      ctx.beginPath();
      ctx.arc(sx + 13, y, 13, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#b89b78';
      ctx.fillRect(snap(sx + 12), snap(y + 2), 2.6, H - 2);
    });
    ctx.fillStyle = '#e8a878';
    ctx.beginPath();
    for (let sx = -8; sx <= width + 8; sx += 8) ctx.lineTo(sx, wallY(sx) - H - 10.4);
    for (let sx = width + 8; sx >= -8; sx -= 8) ctx.lineTo(sx, wallY(sx) - H - 13);
    ctx.fill();
    // Bunting swagged between the posts, and a lantern hung under every other one.
    repeat(cam.x, par, 26, width, (i, sx) => {
      const y = wallY(sx) - H + 5;
      const c = ['#ff9ec0', '#ffd79a', '#9fd8e8', '#c8b0f0'][Math.abs(i) % 4];
      for (let k = 0; k < 4; k++) {
        const fx = sx + 4 + k * 6;
        const dip = Math.sin(((k + 0.5) / 4) * Math.PI) * 4;
        ctx.fillStyle = k % 2 ? c : mix(c, '#ffffff', 0.4);
        ctx.beginPath();
        ctx.moveTo(fx, y + dip);
        ctx.lineTo(fx + 4.4, y + dip);
        ctx.lineTo(fx + 2.2, y + dip + 5);
        ctx.fill();
      }
      if (Math.abs(i) % 2 === 0) {
        const a = swing(time, Math.round(sx + off), 1, i);
        pivoted(ctx, sx + 13, y + 7, a, () => {
          ctx.fillStyle = '#fff0d8';
          ctx.beginPath();
          ctx.ellipse(sx + 13, y + 12, 4, 5, 0, 0, TAU);
          ctx.fill();
          ctx.fillStyle = '#e8b06a';
          ctx.fillRect(snap(sx + 10), snap(y + 11.4), 6, 1.2);
        });
      }
    });
    // Along the terrace: blossom in big planters, the standings board, and tall masts with the
    // stadium's banners hanging from them.
    repeat(cam.x, par, 104, width, (i, sx) => {
      const k = Math.abs(i) % 3;
      if (k === 1) place(ctx, boardArt(), snap(sx + 30), snap(wallY(sx) + 3));
      else place(ctx, planterArt(Math.abs(i) % 4), snap(sx + 46), snap(wallY(sx) + 3));
      place(ctx, mastArt(Math.abs(i) % 4), snap(sx + 86), snap(wallY(sx) + 3));
    });
    return true;
  },
};
// The standings board: the day's three places chalked up on it, under a little tiled roof.
const boardArt = () => art('st-board', 64, 62, () => [
  F(R(12, 52, 6, 10, '#9a7a56')), F(R(46, 52, 6, 10, '#9a7a56')),
  R(4, 12, 56, 42, '#f2e2c4'), F(R(7, 15, 50, 36, '#fff6e6')),
  F(T([[0, 13], [64, 13], [58, 3], [6, 3]], '#d8607e')),
  F(T([[0, 13], [64, 13], [64, 16], [0, 16]], '#b4475f')),
  ...[0, 1, 2].flatMap((k) => [
    F(E(14, 24 + k * 10, 3.6, 3.6, ['#f2c94c', '#cfd8e6', '#e0996a'][k])),
    F(E(13.2, 23 + k * 10, 1.4, 1, '#ffffff')),
    F(R(21, 21.4 + k * 10, 30, 3, '#c9b89c')), F(R(21, 25.4 + k * 10, 20, 2.4, '#dbcdb4'))]),
], true);
// A tall mast behind the terrace, with the stadium's banner hanging from its yard: a Mochi's
// sprout on a coloured ground, so the place says what it is from a long way off.
const mastArt = (i) => art(`st-mast|${i}`, 26, 118, () => {
  const c = ['#ff9ec0', '#ffd79a', '#9fd8e8', '#c8b0f0'][i % 4];
  return [F(R(11, 10, 3.4, 108, '#cbb79c')), F(R(11, 10, 1.2, 108, '#e8d8bc')),
    F(E(12.7, 8, 2.6, 2.6, '#e8c470')), F(E(12.2, 7.4, 1.1, 0.8, '#fff2d0')),
    F(R(4, 12, 18, 2.4, '#b09a7c')),
    T([[5, 14], [21, 14], [21, 56], [13, 62], [5, 56]], c),
    F(T([[5, 14], [9, 14], [9, 58], [5, 56]], mix(c, '#ffffff', 0.4))),
    F(R(5, 14, 16, 2, mix(c, '#ffffff', 0.55))),
    F(E(13, 32, 5.2, 5.2, '#fff6ee')), F(R(12.4, 24, 1.4, 8, '#7fb86e')),
    F(E(10.6, 23, 2.6, 2, '#8fcf74')), F(E(15.4, 22.4, 2.6, 2, '#8fcf74'))];
}, true);
// A blossom tree in a planter, standing against the terrace.
const planterArt = (i) => art(`st-planter|${i}`, 60, 86, () => {
  const b = BLOSSOM[i % BLOSSOM.length];
  const puff = (x, y, r, c) => F(E(x, y, r, r * 0.92, c));
  return [F(R(28, 40, 5, 30, '#9a7a56')), F(R(28, 40, 1.8, 30, '#b8956c')),
    puff(19, 27, 15, b.deep), puff(41, 29, 13.5, b.deep), puff(30, 18, 16, b.body),
    puff(16, 22, 12, b.body), puff(43, 24, 11.5, b.body), puff(25, 12, 10.5, b.top), puff(38, 16, 9, b.top),
    ...[[13, 32], [47, 34], [30, 7], [21, 38]].map(([x, y]) => F(E(x, y, 2, 1.7, '#fff4f8'))),
    R(14, 68, 32, 18, '#d8a06a'), F(R(14, 68, 32, 3.4, '#f0bd86')), F(R(14, 81, 32, 5, '#b07c4e')),
    ...[0, 1, 2, 3, 4].map((k) => F(R(17 + k * 6, 72, 2.6, 8, '#c08c5e')))];
}, true);

// The winners' podium, where the three places stand after a race: three blocks on a carpet, with a
// ribbon above them.
function stadPodium(ctx, x, gy, time) {
  const blocks = [[0, 26, '#f2c94c', '#fff0b4'], [-26, 18, '#cfd8e6', '#f2f6fc'], [26, 13, '#e0996a', '#f6c89c']];
  // The carpet it stands on.
  ctx.fillStyle = '#b8456a';
  ctx.fillRect(snap(x - 44), snap(gy - 3), 88, 6);
  ctx.fillStyle = '#e4738e';
  ctx.fillRect(snap(x - 44), snap(gy - 3), 88, 1.8);
  for (const [dx, h, c, lit] of blocks) {
    ctx.fillStyle = shade(c, -26);
    ctx.fillRect(snap(x + dx - 12), snap(gy - 3 - h), 24, h);
    ctx.fillStyle = c;
    ctx.fillRect(snap(x + dx - 12), snap(gy - 3 - h), 24, h - 3);
    ctx.fillStyle = lit;
    ctx.fillRect(snap(x + dx - 12), snap(gy - 3 - h), 24, 2.2);
    // The place's number on the front of it.
    ctx.fillStyle = shade(c, -34);
    ctx.font = '900 9px Nunito, "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(dx === 0 ? '1' : dx < 0 ? '2' : '3', x + dx, gy - 6);
    ctx.textAlign = 'left';
  }
  // The ribbon strung over it, on two posts.
  for (const px of [x - 48, x + 46]) {
    ctx.fillStyle = '#9a8468';
    ctx.fillRect(snap(px), snap(gy - 56), 3, 54);
    ctx.fillStyle = '#c4ae8c';
    ctx.fillRect(snap(px), snap(gy - 56), 1.1, 54);
    ctx.fillStyle = '#e8c470';
    ctx.beginPath();
    ctx.arc(px + 1.5, gy - 57, 2.4, 0, TAU);
    ctx.fill();
  }
  for (let k = 0; k < 12; k++) {
    const fx = x - 46 + k * 8;
    const dip = Math.sin(((k + 0.5) / 12) * Math.PI) * 6 + Math.sin(time * 1.4 + k) * 0.5;
    ctx.fillStyle = k % 2 ? '#ff7fac' : '#fff4ea';
    ctx.beginPath();
    ctx.moveTo(fx, gy - 54 + dip);
    ctx.lineTo(fx + 7, gy - 54 + dip);
    ctx.lineTo(fx + 3.5, gy - 45 + dip);
    ctx.fill();
  }
}
// A pennant pole beside the plaza, its flag flying in cached frames.
function stadFlag(ctx, x, gy, wx, time, i) {
  const cols = ['#ff9ec0', '#ffd79a', '#9fd8e8', '#c8b0f0'];
  const f = leanFrame(time, wx, 5, 0, i);
  ctx.fillStyle = '#9a8468';
  ctx.fillRect(snap(x - 1.4), snap(gy - 62), 2.8, 62);
  ctx.fillStyle = '#c4ae8c';
  ctx.fillRect(snap(x - 1.4), snap(gy - 62), 1, 62);
  place(ctx, pennantArt(cols[i % cols.length], f), snap(x + 8), snap(gy - 34));
  ctx.fillStyle = '#d8c3a6';
  ctx.beginPath();
  ctx.ellipse(x, gy, 7, 2.6, 0, 0, TAU);
  ctx.fill();
}

// The stadium's ground: swept clay, chalked with a lane line, with the plaza's gravel under it.
GROUND_SPECS.stadium = {
  layers: [
    { top: 9, bot: 24, c: '#dfae82', a: 0.5, amp: 2, f: 0.045, rim: '#ffe6c8' },
    { top: 30, bot: 34, c: '#fffaf0', a: 0.8, amp: 2.4, f: 0.03, rim: null },
    { top: 56, bot: 74, c: '#cf9a70', a: 0.42, amp: 3.4, f: 0.022, rim: '#f2cfa8' },
    { top: 86, bot: 89, c: '#fff2e0', a: 0.5, amp: 3, f: 0.036, rim: null },
  ],
  pebbles: ['#e6d6f4', '#d2eedc', '#fde4c8', '#ffd6e2', '#d4e4f8', '#fff1c4'],
  flecks: ['#ffffff', '#ffd8b0', '#f0b98a'],
  treats: [0, 1, 2, 3, 4],
  near: null,
};

const TRACKSIDE = new Set(['mr_squad', 'mr_starter', 'mr_parasol', 'mr_pound', 'mr_kagami', 'mr_onsen', 'mr_toro', 'mr_snowman', 'mr_cocoa', 'mr_bigsnow', 'mr_fans', 'mr_bigdango', 'mr_yatai', 'mr_taiko', 'mr_bigchochin', 'mr_kgate', 'mr_kbanner', 'mr_ksubjects', 'mr_kpole', 'mr_kcrown', 'mr_hayate', 'mr_podium', 'mr_flag']);
// A quarter sign beside the track. (As yours goes past it: the sign hops, its balloons jump, and
// confetti pops off its top.)
function quarterSign(ctx, map, x, gy, wx, n, time) {
  const at = live(time) && RUN.map === map ? momentsOf(RUN.R).signs[wx] : null;
  const k = at != null ? time - at : -1;
  const hop = k > 0 && k < 0.45 ? Math.sin((k / 0.45) * Math.PI) * 4 : 0;
  balloons(ctx, x, gy - 44 - hop, time, wx, k);
  place(ctx, signArt(), snap(x), gy + 2 - hop);
  ctx.fillStyle = '#c8607e';
  ctx.font = '900 8px Nunito, "Trebuchet MS", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${n ?? 1}/4`, x, gy - 34.2 - hop);
  ctx.textAlign = 'left';
  confetti(ctx, x, gy - 48, k, wx, 30, -Math.PI / 2, 2.2);
}
// Drawn behind the ground (so the grass lip covers their feet): the fences and the trees beside the
// track, and the petals falling from those trees.
function behindGround(ctx, map, cam, width, time) {
  if (!map.mochiRace) return;
  // (The cheer squad first, so the fence's rope runs in front of them.)
  for (const [kind, wx, extra] of map.townPieces ?? []) {
    const x = wx - cam.x;
    if (!TRACKSIDE.has(kind) || x < -80 || x > width + 80) continue;
    // (Behind a fence they stand a step back, the fence hiding their feet; with no fence, on the
    // ground itself, the grass lip over their toes like the trees'. Either way trackside, so the
    // runners pass in front of them, never through them.)
    const fenced = (map.townPieces ?? []).some(([k, from, e]) => k === 'mr_fence' && wx >= from && wx <= e.to);
    const gy = groundAt(map, wx) - cam.y - (fenced ? 6 : -1);
    if (kind === 'mr_squad') squad(ctx, map, x, gy, wx, time);
    else if (kind === 'mr_starter') starter(ctx, map, x, gy, time);
    else if (kind === 'mr_pound') pounders(ctx, map, x, gy, wx, time);
    else if (kind === 'mr_kagami') kagami(ctx, map, x, gy, wx, time);
    else if (kind === 'mr_onsen') onsen(ctx, map, x, gy, wx, time);
    else if (kind === 'mr_toro') toro(ctx, x, gy, time, wx);
    else if (kind === 'mr_snowman') place(ctx, snowMochiArt(extra ?? 0), snap(x), gy + 2);
    else if (kind === 'mr_cocoa') cocoa(ctx, map, x, gy, wx, time);
    else if (kind === 'mr_bigsnow') bigSnow(ctx, map, x, gy, wx, time);
    else if (kind === 'mr_fans') fans(ctx, map, x, gy, wx, time, extra ?? 0);
    else if (kind === 'mr_bigdango') bigDango(ctx, map, x, gy, wx, time);
    else if (kind === 'mr_yatai') stall(ctx, YATAI[extra ?? 0], x, gy + 2, time, live(time) && RUN.map === map ? x + (RUN.you.x - wx) : null);
    else if (kind === 'mr_taiko') drummer(ctx, map, x, gy, wx, time);
    else if (kind === 'mr_bigchochin') bigChochin(ctx, map, x, gy, wx, time);
    else if (kind === 'mr_kgate') kingGate(ctx, map, x, gy, wx, time);
    else if (kind === 'mr_kbanner') bannerPole(ctx, x, gy, wx, time, extra ?? 0);
    else if (kind === 'mr_ksubjects') subjects(ctx, map, x, gy, wx, time);
    else if (kind === 'mr_kpole') roadPole(ctx, x, gy, wx, time, extra ?? 0);
    else if (kind === 'mr_kcrown') kingCrown(ctx, map, x, gy, wx, time);
    else if (kind === 'mr_hayate') kingHayate(ctx, map, x, gy, wx, time);
    else if (kind === 'mr_podium') stadPodium(ctx, x, gy, time);
    else if (kind === 'mr_flag') stadFlag(ctx, x, gy, wx, time, extra ?? 0);
    else pivoted(ctx, x, gy, (lean(time, wx, 0.2) + 0.2) * 0.02, () => place(ctx, parasolArt(extra ?? 0), snap(x), gy + 2));
  }
  for (const [kind, wx, extra] of map.townPieces ?? []) {
    if (kind === 'mr_fence') {
      if (extra.to - cam.x < -60 || wx - cam.x > width + 60) continue;
      fence(ctx, map, wx, extra.to, cam, width, time);
    } else if (kind === 'mr_pier') {
      // (A jetty just behind the track, its deck a touch above the shore, out over the water to
      // `extra.to`: the sand hides its posts' feet, the lake the rest.)
      const len = extra.to - wx;
      const sx = (wx + extra.to) / 2 - cam.x;
      if (sx < -len || sx > width + len) continue;
      place(ctx, pierArt(len), snap(sx), groundAt(map, wx) - cam.y - PIER_UP + 62);
    } else if (kind === 'mr_pine') {
      const x = wx - cam.x;
      if (x < -80 || x > width + 80) continue;
      const shook = live(time) && RUN.map === map ? momentsOf(RUN.R).trees?.[wx] : null;
      drawPine(ctx, x, groundAt(map, wx) - cam.y, extra ?? 0, 1, time, wx, shook != null ? shiver(time - shook) * 0.6 : 0);
    } else if (kind === 'mr_chochin') {
      if (extra.to - cam.x < -CHOCHIN_POST || wx - cam.x > width + CHOCHIN_POST) continue;
      chochinLine(ctx, map, wx, extra.to, cam, width, time);
    } else if (kind === 'mr_kstring') {
      if (extra.to - cam.x < -40 || wx - cam.x > width + 40) continue;
      roadString(ctx, map, wx, extra.to, cam, time);
    } else if (kind === 'mr_dango') {
      const x = wx - cam.x;
      if (x < -80 || x > width + 80) continue;
      drawDangoTree(ctx, x, Math.max(groundAt(map, wx - 6), groundAt(map, wx + 6)) - cam.y, extra ?? 0, 1, time, wx);
    } else if (kind === 'mr_sakura' || kind === 'mr_maple') {
      const x = wx - cam.x;
      if (x < -140 || x > width + 140) continue;
      const foot = Math.max(groundAt(map, wx - 8), groundAt(map, wx + 8)) - cam.y;
      // (Shaken by the runners going under it: render/courseart.js shakeTrees.)
      const shook = live(time) && RUN.map === map ? momentsOf(RUN.R).trees?.[wx] : null;
      const maple = kind === 'mr_maple';
      drawTree(ctx, x, foot, (extra ?? 0) + 3, 1, time, wx, shook != null ? shiver(time - shook) : 0, maple ? MAPLE : BLOSSOM);
      if (maple) leafFall(ctx, x, foot - 110, foot + 2, 120, 3, time, wx);
      else petals(ctx, x, foot - 110, foot + 2, 120, 7, time, wx);
    }
  }
  // The quarter signs last: trackside, in front of the fence (its bunting behind their plaques).
  for (const [kind, wx, extra] of map.townPieces ?? []) {
    const x = wx - cam.x;
    if (kind === 'mr_sign' && x > -60 && x < width + 60) quarterSign(ctx, map, x, groundAt(map, wx) - cam.y + 1, wx, extra, time);
  }
}
BEHIND_GROUND.push(behindGround);

// The pieces drawn with the rest of the course's (render/race.js): returns true if it was one.
export function drawCoursePiece(ctx, map, kind, wx, extra, cam, width, time) {
  const x = wx - cam.x;
  switch (kind) {
    case 'mr_fence':
    case 'mr_sakura':
    case 'mr_buoy':
      return true;
    case 'mr_pier':
      return true;
    case 'mr_parasol':
    case 'mr_sign':
    case 'mr_maple':
    case 'mr_pound':
    case 'mr_kagami':
    case 'mr_onsen':
    case 'mr_pine':
    case 'mr_toro':
    case 'mr_snowman':
    case 'mr_cocoa':
    case 'mr_bigsnow':
    case 'mr_dango':
    case 'mr_fans':
    case 'mr_bigdango':
    case 'mr_kgate':
    case 'mr_kbanner':
    case 'mr_ksubjects':
    case 'mr_kpole':
    case 'mr_kcrown':
    case 'mr_hayate':
    case 'mr_podium':
    case 'mr_flag':
    case 'mr_kstring':
    case 'mr_chochin':
    case 'mr_yatai':
    case 'mr_taiko':
    case 'mr_bigchochin':
      return true;
    case 'mr_yaguraR':
      yagura(ctx, x, extra.top - cam.y, extra.bottom - cam.y, time, true);
      return true;
    case 'mr_kcliff': {
      // (The Grand Tour's: the castle's outer wall, dropping away under the keep's ramp.)
      const s = kingWallArt(extra.bottom - extra.top, 3);
      place(ctx, s, snap(x + 16 - s.w / 2), extra.bottom - cam.y, { flip: true });
      return true;
    }
    case 'mr_clouds':
      if (map.look?.launchArt === 'matsuri') {
        place(ctx, duskFluffArt(extra.w), snap(x + extra.w / 2), groundAt(map, wx + 4) - cam.y + 8);
        return true;
      }
      if (map.look?.launchArt !== 'snow') return false;
      snowFluff(ctx, x, groundAt(map, wx + 4) - cam.y, extra.w, wx, time);
      return true;
    case 'mr_snowcliff':
      place(ctx, snowCliffArt(extra.bottom - extra.top), snap(x - 16), extra.bottom - cam.y);
      return true;
    case 'mr_launch': {
      // (Cloud Glide's own: a snowy ramp, streamers either side; the festival's, red and white. Others
      // keep the plain one.)
      if (map.look?.launchArt !== 'snow' && map.look?.launchArt !== 'matsuri' && map.look?.launchArt !== 'kingdom') return false;
      const gy = groundAt(map, wx - 4) - cam.y;
      const mo = live(time) && RUN.map === map ? momentsOf(RUN.R) : {};
      const k = mo.launch != null ? time - mo.launch : -1;
      streamers(ctx, x - 54, gy - 34, time, k, 0);
      place(ctx, map.look.launchArt === 'kingdom' ? keepRampArt() : map.look.launchArt === 'matsuri' ? festRampArt() : rampArt(), snap(x - 30), gy + 2);
      streamers(ctx, x - 4, gy - 40, time, k, 2);
      return true;
    }
    case 'mr_marker': {
      if (map.look?.launchArt !== 'snow') return false;
      const mo = live(time) && RUN.map === map ? momentsOf(RUN.R) : {};
      snowMarker(ctx, x, groundAt(map, wx) - cam.y, time, wx, mo.markers?.[wx] != null ? time - mo.markers[wx] : -1);
      return true;
    }
    case 'mr_wall': {
      // (The Grand Tour's: a castle wall of cut stone, a flag running up at its top.)
      if (map.look?.wallArt === 'kingdom') {
        const s = kingWallArt(extra.bottom - extra.top, Math.round(wx * 0.31) % 7);
        place(ctx, s, snap(x - 50 + s.w / 2), extra.bottom - cam.y);
        const mo = live(time) && RUN.map === map ? momentsOf(RUN.R) : {};
        wallFlag(ctx, x, extra.top - cam.y, wx, time, mo.tops?.[wx] != null ? time - mo.tops[wx] : -1);
        return true;
      }
      // (The festival's: the yagura, its drum tower.)
      if (map.look?.wallArt === 'matsuri') {
        yagura(ctx, x, extra.top - cam.y, extra.bottom - cam.y, time);
        return true;
      }
      // (Mortar Cliff's own: warm sandstone, a bell at its top. Others keep the garden crag.)
      if (map.look?.wallArt !== 'maple') return false;
      const s = mapleCragArt(extra.bottom - extra.top, Math.round(wx * 0.37) % 7);
      place(ctx, s, snap(x - 50 + s.w / 2), extra.bottom - cam.y);
      const mo = live(time) && RUN.map === map ? momentsOf(RUN.R) : {};
      wallBell(ctx, x, extra.top - cam.y, wx, time, mo.tops?.[wx] != null ? time - mo.tops[wx] : -1);
      return true;
    }
    case 'mr_starter':
      return true;
    case 'mr_squad':
      return true;
    default:
      return false;
  }
}

// The backdrops, for any look whose skyline is 'course:<name>'.
const courseOf = (t) => (typeof t.skyline === 'string' && t.skyline.startsWith('course:') ? COURSES[t.skyline.slice(7)] : null);
BACKDROPS.push({
  far: (ctx, t, cam, width, y0, time) => Boolean(courseOf(t)?.far?.(ctx, t, cam, width, y0, time)),
  mid: (ctx, t, cam, width, y0, time) => Boolean(courseOf(t)?.mid?.(ctx, t, cam, width, y0, time)),
});
