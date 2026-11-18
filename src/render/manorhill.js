// Manor Hill (its remake, 2026-11-18, Chapter 4: The Party That Never Ends). The road up to Lady
// Marigold's manor, where a party has been going on for a hundred years with no guests. The road
// climbs the hill in two slopes (the ground itself), stone terraces stand above it on ivy-covered
// retaining walls that reach down to the road (so nothing floats), lamp posts carry strings of paper
// lanterns, an old pumpkin coach still waits by the turn for guests who never came, and at the top
// the wrought-iron gates stand open on the garden, Mr. Pumpkins beside them. Behind: a twilight sky,
// the manor lit up on its hill, fireworks going off over it now and then. Invitations drift past
// on the breeze.

import { E, T, F, R, sprite, blit, snap, mix } from './pixel.js';
import { band } from './propkit.js';

export const MH = {
  stone: '#cbb8e6', lit: '#e4d8f6', sh: '#a690c8', deep: '#7e6aa6', dark: '#5e4c84', mortar: '#b4a0d4',
  ivy: '#7fc49a', ivyLit: '#a8e0b8', ivySh: '#5a9a7a',
  iron: '#4a3e66', ironLit: '#7a6aa0', gold: '#ffd36b', goldSh: '#d8a840',
  hedge: '#5fae7e', hedgeLit: '#8fd4a0', hedgeSh: '#3f8a62', rose: '#ff8fb8', roseLit: '#ffd0e2',
  pumpkin: '#ff9a4a', pumpkinLit: '#ffc07a', pumpkinSh: '#d8702e', glow: '#ffd88a',
};
const LANTERNS = ['#ffb3c8', '#ffd59a', '#bfe8d8', '#fff2a8', '#d8c4ff'];
const D2R = Math.PI / 180;
const TAU = Math.PI * 2;
// A tapered band along a path, `wf(u)` its full width (propkit's band takes the half width).
const bd = (path, wf, c) => [band(path, (u) => wf(u) / 2, c)];
const h01 = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const hexA = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;
const ov = (cx, cy, rx, ry, deg, c, n = 16) => {
  const r = deg * D2R;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    pts.push([cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
  }
  return T(pts, c);
};

// ---------- Cached pictures ----------
const M = 30;
const moveIn = (sh) => (sh.pts ? { ...sh, pts: sh.pts.map(([px, py]) => [px + M, py + M]) } : { ...sh, x: (sh.x ?? 0) + M, y: (sh.y ?? 0) + M });
function art(key, w, h, build) {
  return sprite(`mh|${key}`, () => ({ w: w + M * 2, h: h + M, shapes: build().filter(Boolean).map(moveIn), res: 2, soft: 'cel' }));
}
function place(ctx, s, x, y) {
  blit(ctx, s, snap(x - s.w / 2), snap(y - s.h));
}
function glow(ctx, x, y, r, c, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, hexA(c, a));
  g.addColorStop(1, hexA(c, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
// Where the road is under world x (the map's ground line).
export function roadAt(map, x) {
  const pts = map.terrain ?? [[0, map.groundY], [map.width, map.groundY]];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    if (x <= x1) return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
}

// ---------- The terraces (`islands: 'terrace'`) ----------
// A stone terrace: paving on top, a balustrade along its back, and its retaining wall going down
// to the road under it (block courses, ivy curtains, an arched niche with a candle on a tall one).
// The wall's picture is cached by the shape of the road under it.
function terracePic(w, prof, seed) {
  const key = `terr|${w}|${prof.map((h) => Math.round(h / 4)).join(',')}|${seed}`;
  const H = Math.ceil(Math.max(...prof) + 14);
  return art(key, w, H, () => {
    const out = [];
    const n = prof.length - 1;
    const bottom = prof.map((h, i) => [(w * i) / n, 12 + h + 2]);
    out.push(T([[0, 10], [w, 10], ...bottom.slice().reverse()], MH.sh));
    // Block courses, staggered.
    for (let y = 22, row = 0; y < H; y += 13, row++) {
      out.push(F(R(0, y, w, 1.2, MH.mortar)));
      for (let x = (row % 2) * 14 + 6; x < w; x += 28) out.push(F(R(x, y - 12, 1.2, 12, MH.mortar)));
    }
    // A tall wall gets an arched niche (the candle in it is lit live).
    const tall = Math.min(...prof);
    if (tall > 70) {
      const cx = w / 2;
      out.push(T([[cx - 11, 60], [cx - 11, 36], [cx - 8, 28], [cx, 25], [cx + 8, 28], [cx + 11, 36], [cx + 11, 60]], MH.dark));
      out.push(F(R(cx - 13, 60, 26, 3, MH.lit)));
    }
    // The paving and the front edge of the slab.
    out.push(R(-2, 0, w + 4, 6, MH.lit));
    out.push(R(-2, 6, w + 4, 6, MH.stone));
    for (let x = 10; x < w; x += 22) out.push(F(R(x, 6, 1, 6, MH.sh)));
    out.push(F(R(-2, 11, w + 4, 2, MH.deep)));
    // Ivy hanging off the edge here and there.
    for (let k = 0; k < Math.max(1, Math.floor(w / 90)); k++) {
      const ix = 18 + h01(seed + k * 3.1) * (w - 36);
      const len = 22 + h01(seed + k * 5.3) * 30;
      out.push(...bd([[ix, 10], [ix + 3, 10 + len * 0.5], [ix - 1, 10 + len]], (u) => 7 * (1 - u * 0.5), MH.ivySh));
      for (let j = 0; j < 4; j++) out.push(ov(ix + (j % 2 ? 3 : -3), 14 + j * len * 0.24, 3.2, 2, j % 2 ? 30 : -30, j % 2 ? MH.ivy : MH.ivyLit));
    }
    return out;
  });
}
// The balustrade along the back of the paving: little vase balusters under a rail.
function balustradePic(w) {
  return art(`bal|${w}`, w, 18, () => {
    const out = [R(-1, 0, w + 2, 4, MH.lit), R(-1, 14, w + 2, 4, MH.stone)];
    for (let x = 6; x < w - 2; x += 10) out.push(T([[x - 2, 4], [x + 2, 4], [x + 3, 8], [x + 1.4, 11], [x + 2.4, 14], [x - 2.4, 14], [x - 1.4, 11], [x - 3, 8]], MH.stone), F(R(x - 1, 5, 0.8, 8, MH.lit)));
    for (const x of [0, w]) out.push(R(x - 3, -4, 6, 22, MH.stone), R(x - 4, -6, 8, 3, MH.lit));
    return out;
  });
}
export function drawTerrace(ctx, x, y, w, time, seed, map, cam) {
  x = snap(x);
  y = snap(y);
  const wx = x + cam.x;
  const wy = y + cam.y;
  const n = Math.max(2, Math.ceil(w / 20));
  const prof = [];
  for (let i = 0; i <= n; i++) prof.push(Math.max(8, roadAt(map, wx + (w * i) / n) - wy - 12));
  ctx.save();
  // The balustrade stands at the back of the paving, behind whoever walks on it.
  place(ctx, balustradePic(w), x + w / 2, y + 2);
  const s = terracePic(w, prof, seed);
  blit(ctx, s, x - M, y - M);
  // The candle in the niche.
  if (Math.min(...prof) > 70) {
    const fl = 0.75 + 0.25 * Math.sin(time * 9 + seed) * Math.sin(time * 5.3);
    glow(ctx, x + w / 2, y + 48, 16, MH.glow, 0.45 * fl);
    ctx.fillStyle = '#fff6e0';
    ctx.fillRect(x + w / 2 - 1.5, y + 50, 3, 9);
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + 47 + Math.sin(time * 7) * 0.4, 1.6, 3 * fl, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Landmarks ----------
// The gates at the top: two stone pillars with lantern urns, the wrought-iron gates swung open on
// the garden's glow, an iron arch with a heart crest. Box 170 x 176; standing on (85, 176).
const GATE_W = 170;
const GATE_H = 176;
function gatesArt() {
  return art('gates', GATE_W, GATE_H, () => {
    const out = [];
    // The glow beyond (the garden, the party), in the opening.
    out.push(T([[38, 176], [38, 70], [60, 44], [85, 36], [110, 44], [132, 70], [132, 176]], '#3a2a5a'));
    out.push(F(E(85, 120, 40, 50, '#6a4a8a')));
    // The iron arch with scrolls and the heart crest.
    out.push(...bd([[30, 64], [44, 36], [85, 22], [126, 36], [140, 64]], () => 5, MH.iron));
    out.push(...bd([[38, 66], [50, 44], [85, 32], [120, 44], [132, 66]], () => 2.4, MH.ironLit));
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
      const cx = 85 + s * (16 + k * 15);
      out.push(...bd([[cx, 28 + k * 4], [cx + s * 4, 36 + k * 4], [cx, 42 + k * 3], [cx - s * 3, 38 + k * 3]], () => 1.8, MH.iron));
    }
    out.push(T([[85, 26], [76, 16], [76, 10], [80, 7], [85, 11], [90, 7], [94, 10], [94, 16]], MH.rose), F(E(81, 11, 1.6, 1.2, MH.roseLit)));
    // The gates themselves, swung open: two leaves of curly bars, foreshortened.
    for (const s of [-1, 1]) {
      const x0 = 85 + s * 47;
      const x1 = 85 + s * 30;
      out.push(...bd([[x0, 176], [x0, 74]], () => 3.4, MH.iron), ...bd([[x1, 176], [x1, 86]], () => 3, MH.iron));
      for (let k = 0; k < 4; k++) {
        const bx = x0 + ((x1 - x0) * (k + 0.5)) / 4;
        out.push(...bd([[bx, 176], [bx, 80 + k * 2]], () => 1.8, MH.iron));
        out.push(T([[bx - 2, 82 + k * 2], [bx, 74 + k * 2], [bx + 2, 82 + k * 2]], MH.gold));
      }
      out.push(...bd([[x0, 120], [x1, 124]], () => 2.4, MH.iron), ...bd([[x0, 160], [x1, 162]], () => 2.4, MH.iron));
      out.push(...bd([[x0 + (x1 - x0) * 0.25, 140], [x0 + (x1 - x0) * 0.5, 132], [x0 + (x1 - x0) * 0.75, 140], [x0 + (x1 - x0) * 0.5, 148], [x0 + (x1 - x0) * 0.25, 140]], () => 1.6, MH.gold));
    }
    // The pillars, with lantern urns on top.
    for (const px of [16, 154]) {
      out.push(R(px - 14, 60, 28, 116, MH.stone), F(R(px - 14, 60, 6, 116, MH.lit)), F(R(px + 8, 60, 6, 116, MH.sh)));
      for (let y = 76; y < 176; y += 16) out.push(F(R(px - 14, y, 28, 1.2, MH.mortar)));
      out.push(R(px - 17, 52, 34, 9, MH.lit), R(px - 17, 168, 34, 8, MH.lit));
      out.push(T([[px - 10, 52], [px - 7, 40], [px - 11, 32], [px + 11, 32], [px + 7, 40], [px + 10, 52]], MH.stone), F(T([[px - 8, 38], [px - 6, 33], [px - 2, 33], [px - 4, 40]], MH.lit)));
      out.push(R(px - 6, 20, 12, 13, '#fff0c0'), ...bd([[px - 7, 20], [px + 7, 20]], () => 2, MH.iron), ...bd([[px - 7, 33], [px + 7, 33]], () => 2, MH.iron), T([[px - 7, 20], [px, 12], [px + 7, 20]], MH.iron));
      out.push(...bd([[px - 13, 120], [px - 8, 100], [px - 12, 80], [px - 9, 64]], (u) => 5 * (1 - u * 0.4), MH.ivySh));
      for (let j = 0; j < 5; j++) out.push(ov(px - 10 + (j % 2) * 4, 70 + j * 11, 3.2, 2.2, 20, j % 2 ? MH.ivy : MH.ivyLit));
    }
    return out;
  });
}
function drawGates(ctx, x, y, time) {
  // The glow from the garden through the open gates, breathing.
  glow(ctx, x, y - 70, 70, '#ffc8a8', 0.25 + 0.05 * Math.sin(time * 1.3));
  place(ctx, gatesArt(), x, y);
  for (const dx of [-69, 69]) glow(ctx, x + dx, y - 150, 18, MH.glow, 0.55 + 0.15 * Math.sin(time * 3 + dx));
}

// The pumpkin coach, waiting by the turn for a hundred years: a big ribbed pumpkin body with a
// curtained window and a door, a gold crown of curls on top, spoked wheels with ivy twined in
// them, a little step, a lantern on its hook. Box 132 x 110; standing on (66, 110).
function coachArt() {
  return art('coach', 132, 110, () => {
    const out = [];
    const wheel = (cx, cy, r) => {
      const o = [E(cx, cy, r, r, MH.iron), E(cx, cy, r - 2.6, r - 2.6, '#6a5a90'), E(cx, cy, r * 0.25, r * 0.25, MH.gold)];
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * TAU;
        o.push(...bd([[cx, cy], [cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2)]], () => 1.4, MH.iron));
      }
      return o;
    };
    out.push(...wheel(30, 88, 21), ...wheel(106, 94, 15));
    // The chassis: a curly iron bar.
    out.push(...bd([[22, 80], [66, 86], [108, 84], [122, 76]], () => 3, MH.iron));
    // The pumpkin body, ribbed.
    out.push(E(66, 56, 46, 34, MH.pumpkin));
    for (const [dx, rx] of [[-28, 16], [-10, 18], [10, 18], [28, 16]]) out.push(F(E(66 + dx, 56, rx, 32, dx < 0 ? MH.pumpkinSh : MH.pumpkin)));
    out.push(F(E(70, 40, 30, 10, MH.pumpkinLit)));
    // The window with its little curtain, and the door.
    out.push(E(52, 50, 13, 15, MH.gold), E(52, 50, 10.4, 12.4, '#4a3a6a'), F(E(52, 54, 9, 8, '#7a5aa0')));
    out.push(T([[42, 40], [62, 40], [58, 50], [52, 46], [46, 50]], '#ffb3c8'));
    out.push(R(76, 44, 22, 34, MH.pumpkinSh), F(R(78, 46, 18, 30, MH.pumpkin)), E(93, 62, 1.6, 1.6, MH.gold));
    // The gold crown of curls on top, and its stem.
    out.push(...bd([[38, 24], [50, 14], [66, 12], [82, 14], [94, 24]], () => 3.2, MH.gold));
    for (const cx of [46, 66, 86]) out.push(...bd([[cx - 4, 18], [cx - 6, 10], [cx, 6], [cx + 4, 10], [cx + 2, 14]], () => 2, MH.gold));
    out.push(...bd([[66, 12], [68, 4], [74, 0]], () => 3, '#6aa850'));
    // The step and the lantern hook.
    out.push(R(64, 88, 16, 4, MH.iron), ...bd([[112, 48], [124, 46], [124, 54]], () => 1.8, MH.iron));
    out.push(R(120, 54, 8, 10, '#fff0c0'), T([[119, 54], [124, 49], [129, 54]], MH.iron));
    // Ivy twined in the back wheel, and a ribbon faded by the years.
    out.push(...bd([[14, 108], [20, 92], [30, 80], [38, 70]], (u) => 4 * (1 - u * 0.5), MH.ivySh));
    for (let j = 0; j < 4; j++) out.push(ov(18 + j * 6, 100 - j * 9, 3, 2, 40, j % 2 ? MH.ivy : MH.ivyLit));
    out.push(...bd([[24, 30], [40, 36], [30, 46]], () => 2.4, '#ffb3c8'));
    return out;
  });
}
function drawCoach(ctx, x, y, time) {
  place(ctx, coachArt(), x, y);
  glow(ctx, x + 58, y - 51, 16, MH.glow, 0.5 + 0.15 * Math.sin(time * 2.4));
}

// A lamp post: an iron post on a foot, a scroll arm, a glass lantern lit warm. Box 30 x 112;
// standing on (15, 112). (The lantern strings hung between neighbouring posts are drawn live.)
function lampArt() {
  return art('lamp', 30, 112, () => [
    R(8, 104, 14, 8, MH.iron), R(10, 100, 10, 4, MH.ironLit),
    ...bd([[15, 100], [15, 22]], (u) => 4 - u, MH.iron),
    F(R(14, 30, 1, 66, MH.ironLit)),
    ...bd([[15, 30], [22, 24], [26, 28], [23, 32]], () => 1.6, MH.iron),
    R(9, 8, 12, 14, '#fff0c0'), F(R(10, 9, 3, 12, '#ffffff')),
    ...bd([[8, 8], [22, 8]], () => 2, MH.iron), ...bd([[8, 22], [22, 22]], () => 2, MH.iron),
    T([[7, 8], [15, 1], [23, 8]], MH.iron), E(15, 1, 1.6, 1.6, MH.gold),
  ]);
}
const LAMP_TOP = 96;
function drawLamp(ctx, x, y, time, seed) {
  place(ctx, lampArt(), x, y);
  glow(ctx, x, y - 97, 26, MH.glow, 0.5 + 0.1 * Math.sin(time * 2 + seed));
}

// A clipped rose hedge: a rounded block of hedge dotted with pink roses. Box 64 x 30.
function hedgeArt(seed) {
  return art(`hedge|${seed}`, 64, 30, () => {
    const out = [T([[2, 30], [0, 12], [6, 4], [20, 1], [44, 1], [58, 4], [64, 12], [62, 30]], MH.hedge)];
    for (let k = 0; k < 7; k++) out.push(E(6 + k * 9, 6 + (k % 2) * 2, 6, 5, MH.hedge));
    out.push(F(R(2, 24, 60, 6, MH.hedgeSh)), F(E(30, 6, 18, 2.4, MH.hedgeLit)));
    for (let k = 0; k < 6; k++) {
      const rx = 8 + h01(seed + k) * 48;
      const ry = 8 + h01(seed + k * 2.3) * 14;
      out.push(E(rx, ry, 2.6, 2.4, MH.rose), F(E(rx - 0.6, ry - 0.6, 1, 0.8, MH.roseLit)));
    }
    return out;
  });
}
// A topiary in a stone planter: a clipped ball on a ball, a ribbon tied round its stem. Box 40 x 72.
function topiaryArt() {
  return art('topiary', 40, 72, () => [
    T([[8, 72], [10, 56], [30, 56], [32, 72]], MH.stone), F(R(8, 56, 24, 3, MH.lit)), F(R(10, 64, 20, 1.2, MH.mortar)),
    ...bd([[20, 56], [20, 36]], () => 3, '#7a5a48'),
    E(20, 42, 11, 9, MH.hedge), F(E(17, 39, 5, 2.4, MH.hedgeLit)),
    E(20, 20, 15, 14, MH.hedge), F(E(15, 14, 7, 3, MH.hedgeLit)), F(E(24, 30, 9, 3, MH.hedgeSh)),
    ...bd([[16, 50], [24, 50]], () => 2, '#ffb3c8'), T([[20, 50], [15, 56], [18, 56]], '#ffb3c8'),
  ]);
}

export const MANORHILL_KINDS = {
  manorgates: { w: GATE_W + M * 2, h: GATE_H + M, draw: drawGates },
  pumpkincoach: { w: 132 + M * 2, h: 110 + M, draw: drawCoach },
  partylamp: { w: 30 + M * 2, h: 112 + M, draw: drawLamp },
  rosehedge: { w: 64 + M * 2, h: 30 + M, draw: (ctx, x, y, time, seed) => place(ctx, hedgeArt(seed % 5), x, y) },
  topiary: { w: 40 + M * 2, h: 72 + M, draw: (ctx, x, y) => place(ctx, topiaryArt(), x, y) },
};

// ---------- Life: lantern strings, invitations on the breeze ----------
// Strings of paper lanterns hung between neighbouring lamp posts, sagging and swaying; and a few
// invitations tumbling past on the breeze (nobody ever answered them).
export function drawManorHillLife(ctx, map, cam, width, height, time) {
  const lamps = (map.deco ?? []).filter((d) => d[0] === 'partylamp').map((d) => [d[1], (d[3] ?? roadAt(map, d[1])) + 3 - LAMP_TOP]).sort((a, b) => a[0] - b[0]);
  ctx.save();
  for (let i = 1; i < lamps.length; i++) {
    const [x0, y0] = lamps[i - 1];
    const [x1, y1] = lamps[i];
    if (x1 - x0 > 420) continue;
    if (Math.max(x0, x1) - cam.x < -40 || Math.min(x0, x1) - cam.x > width + 40) continue;
    const sag = 26 + (x1 - x0) * 0.04;
    const sway = Math.sin(time * 1.1 + i) * 3;
    const at = (u) => [x0 + (x1 - x0) * u - cam.x, y0 + (y1 - y0) * u + Math.sin(u * Math.PI) * (sag + sway) - cam.y];
    ctx.strokeStyle = '#3a2e52';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let k = 0; k <= 16; k++) {
      const [sx, sy] = at(k / 16);
      if (k) ctx.lineTo(sx, sy);
      else ctx.moveTo(sx, sy);
    }
    ctx.stroke();
    const n = Math.max(3, Math.round((x1 - x0) / 46));
    for (let k = 1; k < n; k++) {
      const u = k / n;
      const [sx, sy] = at(u);
      const c = LANTERNS[(i * 3 + k) % LANTERNS.length];
      const sw = Math.sin(time * 2 + k * 1.7 + i) * 0.12;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(sw);
      glow(ctx, 0, 9, 13, c, 0.35);
      ctx.fillStyle = '#3a2e52';
      ctx.fillRect(-0.5, 0, 1, 3);
      ctx.fillStyle = c;
      ctx.strokeStyle = '#3a2e52';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 9, 5, 6, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(-2.6, 5, 1.4, 6);
      ctx.fillStyle = '#3a2e52';
      ctx.fillRect(-2, 2.6, 4, 1.4);
      ctx.fillRect(-2, 14.6, 4, 1.4);
      ctx.restore();
    }
  }
  // The invitations, drifting down the hill on the breeze, turning over as they go.
  for (let k = 0; k < 4; k++) {
    const u = (time * (0.035 + k * 0.006) + k * 0.27) % 1;
    const sx = width * (1.1 - u * 1.3) + Math.sin(time * 0.9 + k * 2) * 20;
    const sy = height * (0.2 + 0.14 * k) + Math.sin(time * 1.3 + k) * 18 + u * 30;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(Math.sin(time * 1.6 + k * 2) * 0.6);
    ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.cos(time * 1.4 + k)));
    ctx.fillStyle = '#fff8f0';
    ctx.strokeStyle = '#b8a4d6';
    ctx.lineWidth = 1;
    ctx.fillRect(-6, -4, 12, 8);
    ctx.strokeRect(-6, -4, 12, 8);
    ctx.beginPath();
    ctx.moveTo(-6, -4);
    ctx.lineTo(0, 1);
    ctx.lineTo(6, -4);
    ctx.stroke();
    ctx.fillStyle = MH.rose;
    ctx.beginPath();
    ctx.arc(0, 1, 1.8, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// ---------- The painted backdrop ----------
export function drawPaintedManorHill(ctx, t, cam, width, height, time, layerY, air, map) {
  // 1. Far rolling hills in the twilight haze, lamp dots winding up them.
  const far = mix(t.far, air, 0.55);
  const farY = layerY(150, 0.05);
  ctx.fillStyle = far;
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width + 8; x += 8) {
    const k = x + cam.x * 0.05;
    ctx.lineTo(x, farY - 40 - Math.sin(k * 0.006) * 34 - Math.sin(k * 0.017 + 1) * 12);
  }
  ctx.lineTo(width, height);
  ctx.fill();
  // 2. The manor on its hill, lit up, its party still going: towers, a dome, rows of warm windows,
  // fireworks going off over it now and then.
  // (Up the hill ahead of you, just right of the middle, drifting only a little as you climb.)
  const mx = width * 0.64 - (cam.x - ((map?.width ?? 1500) - width) / 2) * 0.08;
  const my = layerY(150, 0.08) - 70;
  const hillC = mix(mix(t.mid, t.far, 0.4), air, 0.38);
  ctx.fillStyle = hillC;
  ctx.beginPath();
  ctx.moveTo(mx - 360, height);
  ctx.quadraticCurveTo(mx - 200, my + 10, mx, my);
  ctx.quadraticCurveTo(mx + 220, my + 10, mx + 380, height);
  ctx.fill();
  glow(ctx, mx, my - 30, 90, '#ffc8a8', 0.2 + 0.04 * Math.sin(time * 0.8));
  // One grand house, small with distance: a main hall under a pitched roof, two corner towers with
  // pointed roofs, a little dome over the ballroom, and its windows lit (each window keeps its own
  // place and its own slow flicker, however the camera moves).
  const sil = mix(t.far, '#2a2048', 0.55);
  const win = '#ffd88a';
  const k = 0.55;
  const block = (id, bx, by, w, h, roof) => {
    const [x0, y0, W, Hh] = [mx + bx * k, my + by * k, w * k, h * k];
    ctx.fillStyle = sil;
    ctx.fillRect(x0, y0, W, Hh);
    ctx.beginPath();
    if (roof === 'cone') {
      ctx.moveTo(x0 - 2, y0);
      ctx.lineTo(x0 + W / 2, y0 - W * 1.3);
      ctx.lineTo(x0 + W + 2, y0);
    } else if (roof === 'dome') {
      ctx.ellipse(x0 + W / 2, y0, W / 2, W * 0.45, 0, Math.PI, TAU);
    } else {
      ctx.moveTo(x0 - 3, y0);
      ctx.lineTo(x0 + W / 2, y0 - 10);
      ctx.lineTo(x0 + W + 3, y0);
    }
    ctx.fill();
    const cols = Math.max(1, Math.floor((W - 4) / 8));
    const rows = Math.max(1, Math.floor((Hh - 6) / 10));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const seed = id * 31 + r * 7 + c;
        if (h01(seed) < 0.4) continue;
        const fl = 0.7 + 0.3 * Math.sin(time * (0.6 + h01(seed + 3)) + seed);
        ctx.fillStyle = hexA(win, 0.9 * fl);
        ctx.fillRect(x0 + 3 + c * ((W - 6) / cols) + 1, y0 + 5 + r * 10, 3, 5);
      }
    }
  };
  block(1, -70, -60, 140, 60, 'roof');
  block(2, -100, -80, 30, 80, 'cone');
  block(3, 70, -80, 30, 80, 'cone');
  block(4, -20, -96, 40, 40, 'dome');
  // Fireworks: one every few seconds, soft pastel bursts over the manor.
  for (let k = 0; k < 2; k++) {
    const period = 3.6 + k * 1.3;
    const i = Math.floor((time + k * 1.7) / period);
    const u = ((time + k * 1.7) % period) / period;
    if (u > 0.5) continue;
    const p = u / 0.5;
    const fx = mx + (h01(i * 3.1 + k) - 0.5) * 160;
    const fy = my - 90 - h01(i * 1.7 + k) * 50;
    const c = LANTERNS[(i + k) % LANTERNS.length];
    for (let j = 0; j < 14; j++) {
      const a = (j / 14) * TAU + i;
      const r = 6 + p * 34;
      ctx.fillStyle = hexA(c, (1 - p) * 0.9);
      ctx.beginPath();
      ctx.arc(fx + Math.cos(a) * r, fy + Math.sin(a) * r + p * p * 10, 1.6 * (1 - p) + 0.6, 0, TAU);
      ctx.fill();
    }
    glow(ctx, fx, fy, 30, c, 0.25 * (1 - p));
  }
  // 3. Nearer: the hillside with cypresses and the iron fence along the garden wall.
  const mid = mix(t.mid, air, 0.32);
  const midY = layerY(200, 0.2);
  ctx.fillStyle = mid;
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width + 8; x += 8) {
    const k = x + cam.x * 0.2;
    ctx.lineTo(x, midY - 20 - Math.sin(k * 0.004 + 2) * 20);
  }
  ctx.lineTo(width, height);
  ctx.fill();
  const cyp = mix(mid, '#2a2048', 0.35);
  const step = 90;
  const first = Math.floor((cam.x * 0.2) / step) - 1;
  for (let i = first; i * step - cam.x * 0.2 < width + step; i++) {
    if (h01(i * 2.3) < 0.35) continue;
    const x = i * step - cam.x * 0.2 + h01(i) * 40;
    const k = x + cam.x * 0.2;
    const base = midY - 20 - Math.sin(k * 0.004 + 2) * 20 + 4;
    const h = 40 + h01(i * 5.1) * 30;
    ctx.fillStyle = cyp;
    ctx.beginPath();
    ctx.ellipse(x, base - h / 2, 7, h / 2, 0, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = mix(mid, '#2a2048', 0.5);
  ctx.lineWidth = 1;
  const fy = midY + 6;
  ctx.beginPath();
  ctx.moveTo(0, fy - 14);
  ctx.lineTo(width, fy - 14);
  for (let x = -((cam.x * 0.2) % 12); x < width; x += 12) {
    ctx.moveTo(x, fy);
    ctx.lineTo(x, fy - 18);
  }
  ctx.stroke();
}

// ---------- The Moonlit Garden's backdrop (`painted: 'manorgarden'`) ----------
// The manor itself, close behind the garden: a long facade under a pitched roof with chimneys and
// a pediment, two rows of tall arched windows lit warm, the ballroom's windows along the top where
// one lonely figure waltzes slowly past, round and round, all night; fireworks over the roof; a
// tall clipped hedge wall in front of it, topiaries standing up out of it.
export function drawPaintedManorGarden(ctx, t, cam, width, height, time, layerY, air, map) {
  const W = map?.width ?? 2200;
  // 1. The facade, scrolling slowly.
  const p = 0.25;
  const x0 = 260 - cam.x * p;
  const fw = Math.max(1000, W * 0.48);
  const base = layerY(70, 0.3);
  const top = base - 250;
  // (Darker and cooler than the garden's own stone, so the terraces stand out in front of it.)
  const wall = mix(mix(t.far, '#1c1638', 0.62), air, 0.12);
  const trim = mix(wall, '#e4d8f6', 0.18);
  glow(ctx, x0 + fw / 2, top + 60, 240, '#ffc8a8', 0.12);
  ctx.fillStyle = wall;
  ctx.fillRect(x0, top, fw, base - top + 40);
  // The roof, chimneys and the pediment over the middle.
  ctx.fillStyle = mix(wall, '#1e1636', 0.35);
  ctx.beginPath();
  ctx.moveTo(x0 - 14, top + 4);
  ctx.lineTo(x0 + 30, top - 46);
  ctx.lineTo(x0 + fw - 30, top - 46);
  ctx.lineTo(x0 + fw + 14, top + 4);
  ctx.fill();
  for (const cx of [0.18, 0.4, 0.62, 0.84]) ctx.fillRect(x0 + fw * cx - 8, top - 70, 16, 30);
  ctx.fillStyle = trim;
  ctx.beginPath();
  ctx.moveTo(x0 + fw / 2 - 90, top);
  ctx.lineTo(x0 + fw / 2, top - 60);
  ctx.lineTo(x0 + fw / 2 + 90, top);
  ctx.fill();
  ctx.fillStyle = wall;
  ctx.beginPath();
  ctx.moveTo(x0 + fw / 2 - 72, top - 6);
  ctx.lineTo(x0 + fw / 2, top - 48);
  ctx.lineTo(x0 + fw / 2 + 72, top - 6);
  ctx.fill();
  ctx.fillStyle = hexA(MH.glow, 0.8);
  ctx.beginPath();
  ctx.arc(x0 + fw / 2, top - 24, 8, 0, TAU);
  ctx.fill();
  ctx.fillRect(x0, top, fw, 3);
  // Two rows of tall arched windows, lit, between pilasters; the top row is the ballroom.
  const n = Math.floor(fw / 60);
  const winC = '#ffd88a';
  const dancerU = (time * 0.035) % 1;
  for (let row = 0; row < 2; row++) {
    const wy = top + 26 + row * 108;
    const wh = row ? 70 : 84;
    for (let i = 0; i < n; i++) {
      const wx = x0 + 18 + i * 60;
      ctx.fillStyle = trim;
      ctx.fillRect(wx - 9, wy - 6, 4, wh + 14);
      const lit = 0.75 + 0.25 * Math.sin(time * (0.5 + h01(i * 3 + row)) + i);
      const g = ctx.createLinearGradient(0, wy, 0, wy + wh);
      g.addColorStop(0, hexA('#ffe8b8', 0.8 * lit));
      g.addColorStop(1, hexA(winC, 0.55 * lit));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(wx, wy + wh);
      ctx.lineTo(wx, wy + 14);
      ctx.arc(wx + 14, wy + 14, 14, Math.PI, 0);
      ctx.lineTo(wx + 28, wy + wh);
      ctx.fill();
      ctx.fillStyle = hexA(mix(wall, '#000000', 0.2), 0.5);
      ctx.fillRect(wx + 13, wy + 4, 2, wh - 4);
      ctx.fillRect(wx, wy + wh * 0.5, 28, 2);
      // The lonely dancer: one figure waltzing slowly along the ballroom's windows, turning.
      if (row === 0) {
        const dx = x0 + fw * dancerU;
        if (Math.abs(dx - (wx + 14)) < 16) {
          const spin = Math.sin(time * 3);
          ctx.fillStyle = hexA('#5a3a6a', 0.75);
          ctx.beginPath();
          ctx.ellipse(dx, wy + wh - 18, 10 + spin * 3, 16, 0, Math.PI, TAU);
          ctx.fill();
          ctx.fillRect(dx - 3, wy + wh - 46, 6, 14);
          ctx.beginPath();
          ctx.arc(dx, wy + wh - 50, 5, 0, TAU);
          ctx.fill();
          ctx.fillRect(dx - 3 - spin * 8, wy + wh - 42, 14, 2);
        }
      }
    }
  }
  // Fireworks over the roof.
  for (let k = 0; k < 2; k++) {
    const period = 4 + k * 1.4;
    const i = Math.floor((time + k * 2.1) / period);
    const u = ((time + k * 2.1) % period) / period;
    if (u > 0.5) continue;
    const q = u / 0.5;
    const fx = x0 + fw * (0.2 + h01(i * 3.1 + k) * 0.6);
    const fy = top - 110 - h01(i * 1.7 + k) * 60;
    const c = LANTERNS[(i + k) % LANTERNS.length];
    for (let j = 0; j < 16; j++) {
      const a = (j / 16) * TAU + i;
      const r = 8 + q * 40;
      ctx.fillStyle = hexA(c, (1 - q) * 0.9);
      ctx.beginPath();
      ctx.arc(fx + Math.cos(a) * r, fy + Math.sin(a) * r + q * q * 12, 1.8 * (1 - q) + 0.6, 0, TAU);
      ctx.fill();
    }
    glow(ctx, fx, fy, 36, c, 0.25 * (1 - q));
  }
  // 2. The tall hedge wall in front, topiaries standing up out of it.
  const hp = 0.45;
  const hy = layerY(30, 0.45);
  const hedge = mix(MH.hedgeSh, air, 0.35);
  const hedgeLit = mix(MH.hedge, air, 0.35);
  ctx.fillStyle = hedge;
  ctx.fillRect(0, hy - 60, width, height);
  ctx.fillStyle = hedgeLit;
  ctx.fillRect(0, hy - 60, width, 4);
  const step = 140;
  const first = Math.floor((cam.x * hp) / step) - 1;
  for (let i = first; i * step - cam.x * hp < width + step; i++) {
    const x = i * step - cam.x * hp;
    ctx.fillStyle = hedge;
    if (h01(i * 1.9) < 0.5) {
      ctx.fillRect(x - 3, hy - 84, 6, 24);
      ctx.beginPath();
      ctx.arc(x, hy - 92, 14, 0, TAU);
      ctx.fill();
      ctx.fillStyle = hedgeLit;
      ctx.beginPath();
      ctx.arc(x - 4, hy - 96, 5, 0, TAU);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(x - 14, hy - 60);
      ctx.lineTo(x, hy - 104);
      ctx.lineTo(x + 14, hy - 60);
      ctx.fill();
    }
  }
}

// ---------- The Moonlit Rooftop: chimneys (`islands: 'chimney'`) and its backdrop ----------
const BRICK = { base: '#b8807a', lit: '#d8a49a', sh: '#94605c', mortar: '#e8cfc4', cap: '#cbb8e6', capLit: '#e4d8f6', pot: '#c8786a' };
// A brick chimney stack standing up out of the roof, its stone cap the place to stand, two chimney
// pots at the back. Cached by its size.
function chimneyPic(w, h) {
  return art(`chim|${w}|${h}`, w, h, () => {
    const out = [];
    const sw = w - 12;
    // The pots at the back (smoke rises from them live).
    out.push(R(10, 0, 9, 10, BRICK.pot), F(R(10, 0, 2.6, 10, BRICK.lit)), R(9, -1, 11, 3, BRICK.sh));
    out.push(R(w - 19, 2, 8, 8, BRICK.pot), F(R(w - 19, 2, 2.4, 8, BRICK.lit)), R(w - 20, 1, 10, 3, BRICK.sh));
    // The stack.
    out.push(R(6, 12, sw, h - 12, BRICK.base), F(R(6, 12, 4, h - 12, BRICK.lit)), F(R(6 + sw - 5, 12, 5, h - 12, BRICK.sh)));
    for (let y = 18, row = 0; y < h; y += 7, row++) {
      out.push(F(R(6, y, sw, 1, BRICK.mortar)));
      for (let x = 6 + (row % 2) * 7 + 7; x < 6 + sw - 2; x += 14) out.push(F(R(x, y - 6, 1, 6, BRICK.mortar)));
    }
    // The cap.
    out.push(R(0, 8, w, 6, BRICK.cap), F(R(0, 8, w, 2, BRICK.capLit)), F(R(0, 13, w, 1.4, MH.deep)));
    return out;
  });
}
export function drawChimney(ctx, x, y, w, time, seed, map, cam) {
  x = snap(x);
  y = snap(y);
  const h = Math.max(20, Math.ceil(map.groundY - (y + cam.y) + 4));
  const s = chimneyPic(w, h);
  blit(ctx, s, x - M, y - 8 - M);
  // Smoke curling up from the pots.
  ctx.save();
  for (const [px, k0] of [[x + 14, 0], [x + w - 15, 2]]) {
    for (let k = 0; k < 3; k++) {
      const u = (time * 0.25 + k / 3 + seed * 0.13 + k0) % 1;
      ctx.globalAlpha = (1 - u) * 0.45;
      ctx.fillStyle = '#e8e0f6';
      ctx.beginPath();
      ctx.arc(px + Math.sin(u * 5 + k) * 4 + u * 10, y - 10 - u * 40, 3 + u * 6, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

// The roofs of the manor under the big moon: steep gables with lit dormers, two towers with cone
// roofs and weathervanes, chimneys smoking; far below, the hill's lights; sky lanterns from the
// party rising slowly into the night.
export function drawPaintedManorRoof(ctx, t, cam, width, height, time, layerY, air, map) {
  // 1. Far hills and the tiny lights of the hill road below.
  const far = mix(t.far, air, 0.5);
  const farY = layerY(40, 0.05);
  ctx.fillStyle = far;
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width + 8; x += 8) {
    const k = x + cam.x * 0.05;
    ctx.lineTo(x, farY - Math.sin(k * 0.007) * 18 - Math.sin(k * 0.02 + 2) * 6);
  }
  ctx.lineTo(width, height);
  ctx.fill();
  for (let i = 0; i < 26; i++) {
    const x = ((i * 53 - cam.x * 0.05) % (width + 40) + width + 40) % (width + 40) - 20;
    const fl = 0.6 + 0.4 * Math.sin(time * 2 + i);
    ctx.fillStyle = hexA(LANTERNS[i % LANTERNS.length], 0.7 * fl);
    ctx.fillRect(x, farY + 6 + (i % 4) * 5, 2, 2);
  }
  // 2. Sky lanterns, rising slowly, swaying.
  for (let i = 0; i < 9; i++) {
    const u = (time * (0.018 + (i % 3) * 0.004) + i * 0.111) % 1;
    const x = ((h01(i * 7.3) * (width + 200) - cam.x * 0.1) % (width + 200) + width + 200) % (width + 200) - 100 + Math.sin(time * 0.6 + i) * 10;
    const y = height * (0.95 - u * 1.05);
    const c = LANTERNS[i % LANTERNS.length];
    glow(ctx, x, y, 12, c, 0.35 * (1 - u * 0.6));
    ctx.fillStyle = hexA(c, 0.85 * (1 - u * 0.5));
    ctx.beginPath();
    ctx.moveTo(x - 3, y - 4);
    ctx.lineTo(x + 3, y - 4);
    ctx.lineTo(x + 2.4, y + 4);
    ctx.lineTo(x - 2.4, y + 4);
    ctx.fill();
  }
  // 3. The roofs: gables in a row with lit dormers, two towers, chimneys.
  const p = 0.3;
  const base = layerY(0, 0.25) + 10;
  const roof = mix(mix(t.far, '#1a1434', 0.55), air, 0.1);
  const roofLit = mix(roof, '#c8b0ff', 0.15);
  const step = 170;
  const first = Math.floor((cam.x * p) / step) - 1;
  for (let i = first; i * step - cam.x * p < width + step; i++) {
    const x = i * step - cam.x * p;
    const kind = h01(i * 3.7);
    if (kind < 0.18) {
      // A tower with a cone roof and a weathervane.
      ctx.fillStyle = roof;
      ctx.fillRect(x - 22, base - 170, 44, 170);
      ctx.beginPath();
      ctx.moveTo(x - 28, base - 170);
      ctx.lineTo(x, base - 240);
      ctx.lineTo(x + 28, base - 170);
      ctx.fill();
      ctx.fillRect(x - 1, base - 262, 2, 24);
      ctx.fillRect(x - 8, base - 256, 16, 2);
      const fl = 0.7 + 0.3 * Math.sin(time * 0.8 + i);
      ctx.fillStyle = hexA(MH.glow, 0.8 * fl);
      ctx.fillRect(x - 5, base - 140, 10, 16);
      ctx.fillRect(x - 5, base - 100, 10, 16);
    } else {
      // A steep gable with a dormer window, lit.
      ctx.fillStyle = roof;
      ctx.beginPath();
      ctx.moveTo(x - 85, base);
      ctx.lineTo(x - 85, base - 50);
      ctx.lineTo(x, base - 130);
      ctx.lineTo(x + 85, base - 50);
      ctx.lineTo(x + 85, base);
      ctx.fill();
      ctx.strokeStyle = roofLit;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 85, base - 50);
      ctx.lineTo(x, base - 130);
      ctx.lineTo(x + 85, base - 50);
      ctx.stroke();
      const fl = 0.7 + 0.3 * Math.sin(time * (0.5 + h01(i)) + i * 2);
      ctx.fillStyle = hexA(MH.glow, 0.75 * fl);
      ctx.beginPath();
      ctx.moveTo(x - 9, base - 50);
      ctx.lineTo(x - 9, base - 70);
      ctx.arc(x, base - 70, 9, Math.PI, 0);
      ctx.lineTo(x + 9, base - 50);
      ctx.fill();
      if (kind > 0.6) {
        ctx.fillStyle = roof;
        ctx.fillRect(x + 40, base - 110, 14, 50);
        for (let k = 0; k < 2; k++) {
          const u = (time * 0.2 + k * 0.5 + i * 0.3) % 1;
          ctx.fillStyle = hexA('#e8e0f6', 0.3 * (1 - u));
          ctx.beginPath();
          ctx.arc(x + 47 + u * 12, base - 116 - u * 40, 4 + u * 7, 0, TAU);
          ctx.fill();
        }
      }
    }
  }
}

// ---------- Indoor mezzanines (`islands: 'balcony'`): the gallery, ballroom and hallway ----------
// A marble balcony: a slab with gold trim and little corbels under it, a gilded balustrade along its
// back, held up on fluted columns that stand on whatever is below them (the floor, or the balcony
// under it), so nothing hangs in the air.
const MARBLE = { base: '#efe6f8', lit: '#fbf6ff', sh: '#c8b8dc', deep: '#a894c4', gold: '#ffd36b', goldSh: '#d8a840' };
function balconyPic(w) {
  return art(`balc|${w}`, w, 30, () => {
    const out = [];
    // The balustrade at the back.
    out.push(R(0, 0, w, 3, MARBLE.gold), R(0, 14, w, 3, MARBLE.base));
    for (let x = 6; x < w - 2; x += 9) out.push(T([[x - 1.8, 3], [x + 1.8, 3], [x + 2.6, 7], [x + 1.2, 10], [x + 2.2, 14], [x - 2.2, 14], [x - 1.2, 10], [x - 2.6, 7]], MARBLE.base), F(R(x - 0.8, 4, 0.8, 9, MARBLE.lit)));
    // The slab.
    out.push(R(-3, 16, w + 6, 6, MARBLE.lit), R(-3, 22, w + 6, 4, MARBLE.base), F(R(-3, 21, w + 6, 1.4, MARBLE.gold)), F(R(-3, 25, w + 6, 1.4, MARBLE.deep)));
    // Corbels under it.
    for (let x = 18; x < w - 12; x += 34) out.push(T([[x - 4, 26], [x + 4, 26], [x + 2, 30], [x - 2, 30]], MARBLE.sh));
    return out;
  });
}
function columnPic(h) {
  return art(`col|${h}`, 16, h, () => [
    R(0, 0, 16, 5, MARBLE.base), F(R(0, 0, 16, 1.6, MARBLE.gold)),
    R(2, 5, 12, h - 10, MARBLE.base), F(R(4, 5, 1.2, h - 10, MARBLE.sh)), F(R(8, 5, 1.2, h - 10, MARBLE.sh)), F(R(11, 5, 1.2, h - 10, MARBLE.sh)), F(R(2, 5, 1.6, h - 10, MARBLE.lit)),
    R(0, h - 5, 16, 5, MARBLE.base), F(R(0, h - 1.6, 16, 1.6, MARBLE.deep)),
  ]);
}
// What a column under world (wx, wy) stands on: the nearest ledge below, or the floor.
function standOn(map, wx, wy) {
  let best = map.groundY;
  for (const p of map.platforms ?? []) if (p.y > wy + 4 && p.y < best && wx >= p.x && wx <= p.x + p.w) best = p.y;
  return best;
}
export function drawBalcony(ctx, x, y, w, time, seed, map, cam) {
  x = snap(x);
  y = snap(y);
  const wx = x + cam.x;
  const wy = y + cam.y;
  // The columns first, behind the slab.
  const cols = w > 150 ? [8, w / 2, w - 8] : [8, w - 8];
  for (const cx of cols) {
    const bottom = standOn(map, wx + cx, wy);
    const h = Math.round(bottom - (wy + 22));
    if (h > 8) blit(ctx, columnPic(h), snap(x + cx - 8 - M), snap(y + 22 - M));
  }
  blit(ctx, balconyPic(w), x - M, y - 16 - M);
}
