// Fox Shrine Path (its makeover, 2026-11-20): the sacred hill's landmarks. A five-tier pagoda by
// the gate, its roofs the steps up it; a giant sacred cherry with a straw rope round its trunk, its
// boughs and its crown the terraces; a steep stone stair climbing the hill under a tunnel of
// vermilion gates; and the Fox Shrine on the summit, its doorway the way into Tamamo's Sanctum.

import { E, T, F, sprite, blit, snap } from './pixel.js';
import { band } from './propkit.js';

export const FS = {
  verm: '#f0645a', vermLit: '#ff9a86', vermSh: '#c8484a',
  wall: '#fff6ee', wallSh: '#f0dcd0', lattice: '#e8d0c0', latticeLine: '#c8a898',
  roof: '#6a5488', roofLit: '#8a74a8', roofSh: '#4c3a66', roofDeep: '#3a2c52',
  gold: '#ffd27a', goldSh: '#e0a850', goldLit: '#fff0b8',
  stone: '#f4ebe4', stoneLit: '#fffaf4', stoneSh: '#d8c8be', stoneDeep: '#bca89c',
  bark: '#9a7268', barkLit: '#b88e84', barkSh: '#7a5650', barkDeep: '#644440',
  bloom: '#ffc6de', bloomLit: '#ffe4ef', bloomSh: '#f4a0c4', bloomDeep: '#e886b0',
  straw: '#ecd49a', strawSh: '#c8ae6e', paper: '#ffffff', paperSh: '#e6e0f6',
  ink: '#4a3a5c', inkSh: '#33283f', inkLit: '#6a5a7c', door: '#5a3048', doorIn: '#7a4058',
};

const h01 = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const hexA = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const R = (x0, y0, x1, y1, c) => T(rect(x0, y0, x1, y1), c);

const M = 40;
const moveIn = (sh) => (sh.pts ? { ...sh, pts: sh.pts.map(([px, py]) => [px + M, py + M]) } : { ...sh, x: (sh.x ?? 0) + M, y: (sh.y ?? 0) + M });
function art(key, w, h, build) {
  return sprite(`fs|${key}`, () => ({ w: w + M * 2, h: h + M, shapes: build().filter(Boolean).map(moveIn), res: 2, soft: 'cel' }));
}
function place(ctx, s, x, y) {
  blit(ctx, s, snap(x - s.w / 2), snap(y - s.h));
}
// Paper streamers (shide) hanging from a rope at (x, y).
const shide = (x, y, s = 1) => [
  T([[x, y], [x + 4 * s, y], [x + 2 * s, y + 5 * s], [x + 5 * s, y + 10 * s], [x + 1 * s, y + 10 * s], [x + 3 * s, y + 5 * s]], FS.paper),
  F(T([[x + 2 * s, y + 5 * s], [x + 5 * s, y + 10 * s], [x + 3.4 * s, y + 10 * s]], FS.paperSh)),
];
// A sagging straw rope (shimenawa) from x0 to x1 at y, thickness th.
const shimenawa = (x0, x1, y, th, sag = 6) => {
  const path = Array.from({ length: 13 }, (_, i) => {
    const u = i / 12;
    return [x0 + (x1 - x0) * u, y + Math.sin(u * Math.PI) * sag];
  });
  const out = [band(path, (u) => th * (0.7 + 0.3 * Math.sin(u * Math.PI)), FS.straw)];
  for (let i = 1; i < 12; i++) {
    const [px, py] = path[i];
    out.push(F(band([[px - 2, py - th * 0.4], [px + 2, py + th * 0.4]], () => 1.2, FS.strawSh)));
  }
  return out;
};
// A paper lantern hanging at (x, y) (its top).
const lantern = (x, y, s = 1) => [
  F(band([[x, y - 8 * s], [x, y]], () => 1, FS.ink)),
  R(x - 4 * s, y, x + 4 * s, y + 3 * s, FS.ink),
  T([[x - 6 * s, y + 3 * s], [x + 6 * s, y + 3 * s], [x + 8 * s, y + 10 * s], [x + 6 * s, y + 17 * s], [x - 6 * s, y + 17 * s], [x - 8 * s, y + 10 * s]], FS.verm),
  F(T([[x - 2 * s, y + 4 * s], [x + 2 * s, y + 4 * s], [x + 3 * s, y + 10 * s], [x + 2 * s, y + 16 * s], [x - 2 * s, y + 16 * s], [x - 3 * s, y + 10 * s]], FS.vermLit)),
  F(R(x - 7 * s, y + 9.4 * s, x + 7 * s, y + 10.6 * s, FS.vermSh)),
  R(x - 4 * s, y + 17 * s, x + 4 * s, y + 20 * s, FS.ink),
];
// A five-petal blossom at (x, y), radius r.
const blossom = (x, y, r, c = FS.paper) => {
  const out = [];
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
    out.push(F(E(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.5, r * 0.5, c)));
  }
  out.push(F(E(x, y, r * 0.3, r * 0.3, FS.gold)));
  return out;
};

// ---------- The pagoda: five tiers, white walls and vermilion posts, each tier's roof a wide plum
// eave with upturned tips and a gold edge (their tops are ledges, PG_STEP apart), a gold spire on
// top. Bottom middle on the ground. ----------
const PG_W = 340;
const PG_H = 580;
export const PG_STEP = 80;
export const PG_EAVES = [320, 290, 260, 230, 200];
function pagodaArt() {
  return art('pagoda', PG_W, PG_H, () => {
    const out = [];
    const cx = PG_W / 2;
    const H = PG_H;
    // The stone plinth and its two steps.
    out.push(R(cx - 140, H - 14, cx + 140, H, FS.stoneSh), F(R(cx - 140, H - 14, cx + 140, H - 11, FS.stone)));
    out.push(R(cx - 40, H - 8, cx + 40, H, FS.stone), F(R(cx - 40, H - 8, cx + 40, H - 6, FS.stoneLit)));
    for (let k = 1; k <= 5; k++) {
      const ey = H - PG_STEP * k;
      const ew = PG_EAVES[k - 1];
      const bw = ew - 120;
      const y0 = k === 1 ? H - 14 : ey + PG_STEP;
      const y1 = ey + 20;
      // The tier: white walls, vermilion posts at its corners and middle, a rail band.
      out.push(R(cx - bw / 2, y1, cx + bw / 2, y0, FS.wall), F(R(cx + bw / 2 - 14, y1, cx + bw / 2, y0, FS.wallSh)));
      for (const px of [-bw / 2, -6, bw / 2 - 12]) out.push(R(cx + px, y1, cx + px + 12, y0, FS.verm), F(R(cx + px + 8, y1, cx + px + 12, y0, FS.vermSh)));
      const ry = y1 + (y0 - y1) * 0.62;
      out.push(R(cx - bw / 2 - 6, ry, cx + bw / 2 + 6, ry + 6, FS.verm), F(R(cx - bw / 2 - 6, ry + 4, cx + bw / 2 + 6, ry + 6, FS.vermSh)));
      for (let i = 0; i < 6; i++) {
        const bx = cx - bw / 2 + (bw * (i + 0.5)) / 6;
        out.push(F(R(bx - 1, ry + 6, bx + 1, y0 - 2, FS.vermSh)));
      }
      // Windows (a doorway on the ground tier, glowing).
      if (k === 1) {
        out.push(T([[cx - 22, y0 - 2], [cx - 22, y1 + 22], [cx, y1 + 14], [cx + 22, y1 + 22], [cx + 22, y0 - 2]], FS.door), F(T([[cx - 14, y0 - 2], [cx - 14, y1 + 26], [cx, y1 + 20], [cx + 14, y1 + 26], [cx + 14, y0 - 2]], FS.doorIn)));
        out.push(F(E(cx, y0 - 20, 7, 10, '#ffd8a0')));
      } else {
        for (const s of [-1, 1]) {
          const wx = cx + s * bw * 0.27;
          out.push(R(wx - 9, y1 + 10, wx + 9, ry - 6, FS.door), F(R(wx - 7, y1 + 12, wx + 7, ry - 8, FS.doorIn)));
          out.push(F(R(wx - 0.8, y1 + 10, wx + 0.8, ry - 6, FS.lattice)), F(R(wx - 9, (y1 + ry) / 2 - 3, wx + 9, (y1 + ry) / 2 - 1.4, FS.lattice)));
        }
      }
      // The eave: flat on top (the ledge), a deep tiled face, tips swept up, a gold edge.
      const L = cx - ew / 2;
      const Rr = cx + ew / 2;
      out.push(T([[L - 4, ey - 12], [L + 8, ey - 2], [L + 26, ey], [Rr - 26, ey], [Rr - 8, ey - 2], [Rr + 4, ey - 12], [Rr + 2, ey - 2], [Rr - 10, ey + 12], [Rr - 34, ey + 20], [L + 34, ey + 20], [L + 10, ey + 12], [L - 2, ey - 2]], FS.roof));
      out.push(F(T([[L + 8, ey - 2], [L + 26, ey], [Rr - 26, ey], [Rr - 8, ey - 2], [Rr - 12, ey + 4], [L + 12, ey + 4]], FS.roofLit)));
      for (let tx = L + 24; tx < Rr - 22; tx += 11) out.push(F(R(tx, ey + 5, tx + 2, ey + 16, FS.roofSh)));
      out.push(F(T([[L + 10, ey + 12], [L + 34, ey + 20], [Rr - 34, ey + 20], [Rr - 10, ey + 12], [Rr - 12, ey + 16], [Rr - 34, ey + 23], [L + 34, ey + 23], [L + 12, ey + 16]], FS.gold)));
      // Little gold bells under the tips.
      for (const bx of [L + 4, Rr - 4]) out.push(F(band([[bx, ey - 2], [bx, ey + 8]], () => 0.8, FS.goldSh)), E(bx, ey + 11, 3.4, 4, FS.gold));
    }
    // The spire: a base, nine gold rings, a flame and a jewel.
    const ty = H - PG_STEP * 5;
    out.push(R(cx - 12, ty - 14, cx + 12, ty, FS.verm), F(R(cx + 6, ty - 14, cx + 12, ty, FS.vermSh)));
    out.push(R(cx - 2.4, ty - 140, cx + 2.4, ty - 14, FS.goldSh));
    for (let i = 0; i < 9; i++) {
      const ry = ty - 22 - i * 11;
      const rw = 15 - i * 0.7;
      out.push(E(cx, ry, rw, 3.2, FS.gold), F(E(cx - rw * 0.3, ry - 1, rw * 0.5, 1.2, FS.goldLit)));
    }
    out.push(T([[cx, ty - 172], [cx + 9, ty - 150], [cx + 6, ty - 140], [cx, ty - 146], [cx - 6, ty - 140], [cx - 9, ty - 150]], FS.gold));
    out.push(E(cx, ty - 136, 6, 6, FS.gold), F(E(cx - 2, ty - 138, 2.2, 2.2, FS.goldLit)));
    return out;
  });
}

// ---------- The sacred cherry: a giant old tree in full bloom, a straw rope round its trunk. Its
// low bough, its mid bough and its crown are flat on top (ledges in the map); blossom clouds hang
// under them. Bottom middle at the trunk's foot. ----------
const TR_W = 560;
const TR_H = 560;
// [left, right, top] of each standing surface, from the trunk's middle and the ground.
export const TREE_BOUGHS = [[-200, 200, 160], [-200, 120, 320], [-196, 180, 480]];
// A clump of blossom: lobes round (x, y), the top kept flat at `top` when given.
function bloomClump(x, y, rx, ry, seed, top = null) {
  const out = [];
  const lobes = [];
  const n = Math.max(4, Math.round(rx / 16));
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n;
    const lx = x - rx + u * rx * 2;
    const lr = ry * (0.62 + 0.3 * h01(seed + i));
    let ly = y + (h01(seed + i * 3) - 0.3) * ry * 0.5 + Math.abs(u - 0.5) * ry * 0.7;
    if (top != null) ly = Math.max(ly, top + lr);
    lobes.push([lx, ly, lr * 1.25, lr]);
  }
  for (const [lx, ly, a, b] of lobes) out.push(E(lx, ly, a, b, FS.bloom));
  for (const [lx, ly, a, b] of lobes) out.push(F(E(lx + a * 0.18, ly + b * 0.32, a * 0.8, b * 0.6, FS.bloomSh)));
  for (const [lx, ly, a, b] of lobes) out.push(F(E(lx - a * 0.2, ly - b * 0.28, a * 0.55, b * 0.45, FS.bloomLit)));
  for (let i = 0; i < n; i++) {
    const [lx, ly, a, b] = lobes[i];
    if (h01(seed + i * 7) > 0.45) out.push(...blossom(lx - a * 0.3 + h01(seed + i) * a * 0.6, ly - b * 0.1 + h01(seed + i * 5) * b * 0.5, 3.2));
  }
  return out;
}
function treeArt() {
  return art('tree', TR_W, TR_H, () => {
    const out = [];
    const cx = TR_W / 2;
    const H = TR_H;
    const [low, mid, crown] = TREE_BOUGHS;
    // Roots flaring into the ground and the trunk, a little S in it.
    out.push(T([[cx - 96, H], [cx - 62, H - 12], [cx - 44, H - 40], [cx - 36, H - 140], [cx - 28, H - 260], [cx - 34, H - 360], [cx - 24, H - 470], [cx + 28, H - 470], [cx + 34, H - 360], [cx + 26, H - 260], [cx + 34, H - 140], [cx + 46, H - 40], [cx + 66, H - 12], [cx + 100, H]], FS.bark));
    out.push(F(T([[cx + 6, H - 470], [cx + 28, H - 470], [cx + 34, H - 360], [cx + 26, H - 260], [cx + 34, H - 140], [cx + 46, H - 40], [cx + 66, H - 12], [cx + 100, H], [cx + 30, H], [cx + 18, H - 140], [cx + 12, H - 260], [cx + 16, H - 360]], FS.barkSh)));
    out.push(F(T([[cx - 24, H - 460], [cx - 14, H - 460], [cx - 22, H - 360], [cx - 16, H - 260], [cx - 24, H - 140], [cx - 34, H - 40], [cx - 44, H - 40], [cx - 36, H - 140], [cx - 28, H - 260], [cx - 34, H - 360]], FS.barkLit)));
    for (const [x0, y0, x1, y1] of [[-14, 60, -8, 130], [10, 200, 4, 280], [-12, 320, -6, 400], [14, 90, 18, 160]]) out.push(F(band([[cx + x0, H - y0], [cx + x1, H - y1]], () => 2, FS.barkDeep)));
    // The boughs: a limb out to each end, its top flat at the surface.
    const limb = (x0, x1, top, th) => {
      const out2 = [T([[cx + x0, top + 2], [cx + x0 + 8, top], [cx + x1 - 8, top], [cx + x1, top + 2], [cx + x1, top + th * 0.55], [cx + x1 - 8, top + th * 0.6], [cx + 30, top + th], [cx - 30, top + th], [cx + x0 + 8, top + th * 0.6], [cx + x0, top + th * 0.55]], FS.bark)];
      out2.push(F(T([[cx + x0 + 8, top], [cx + x1 - 8, top], [cx + x1 - 8, top + 3], [cx + x0 + 8, top + 3]], FS.barkLit)));
      out2.push(F(T([[cx + x1 - 8, top + th * 0.6], [cx + 30, top + th], [cx - 30, top + th], [cx + x0 + 8, top + th * 0.6], [cx + x0 + 8, top + th * 0.45], [cx - 30, top + th * 0.8], [cx + 30, top + th * 0.8], [cx + x1 - 8, top + th * 0.45]], FS.barkSh)));
      return out2;
    };
    // Blossom hung in clusters under each bough (never above where you stand), then the limb over
    // it, little sprigs off its tips.
    for (const [[x0, x1, t], th, sd] of [[low, 22, 11], [mid, 20, 23]]) {
      const top = H - t;
      const span = x1 - x0;
      out.push(...bloomClump(cx + x0 + 26, top + 30, 50, 24, sd));
      out.push(...bloomClump(cx + x0 + span * 0.62, top + 34, 46, 22, sd + 5));
      out.push(...bloomClump(cx + x1 - 24, top + 28, 48, 24, sd + 9));
      out.push(...limb(x0, x1, top, th));
      for (const [ex, s] of [[x0, -1], [x1, 1]]) {
        out.push(F(band([[cx + ex, top + 6], [cx + ex + s * 12, top - 8], [cx + ex + s * 20, top - 14]], (u) => 3.4 - u * 2.2, FS.bark)));
        out.push(...blossom(cx + ex + s * 20, top - 16, 5), ...blossom(cx + ex + s * 10, top - 9, 4, FS.bloomLit), ...blossom(cx + ex + s * 24, top - 6, 4));
      }
    }
    // A fringe of blossom along each bough's top edge, under the line you stand on.
    for (const [x0, x1, t] of [low, mid]) {
      for (let x = x0 + 14; x < x1 - 10; x += 26) out.push(...blossom(cx + x + h01(x) * 8, H - t + 7, 3.4, h01(x + 1) > 0.5 ? FS.paper : FS.bloomLit));
    }
    // The crown: a rounded dome of blossom, flat across its top (where you stand), scalloped under,
    // the tree's upper limbs showing between its lobes.
    const cy = H - crown[2];
    const ccx = cx + (crown[0] + crown[1]) / 2;
    const hw = (crown[1] - crown[0]) / 2;
    out.push(E(ccx, cy + 66, hw + 10, 60, FS.bloom));
    const lobes = [];
    for (let k = -3; k <= 3; k++) lobes.push([ccx + k * 50 + (h01(k + 60) - 0.5) * 14, cy + 112 + h01(k + 61) * 10, 28 + h01(k + 62) * 8]);
    for (const s of [-1, 1]) lobes.push([ccx + s * (hw + 2), cy + 46, 34], [ccx + s * (hw - 20), cy + 88, 34]);
    for (let x = ccx - hw + 22; x <= ccx + hw - 22; x += 34) {
      const r = 26 + h01(x) * 8;
      lobes.push([x, cy + r, r]);
    }
    for (const [lx, ly, r] of lobes) out.push(E(lx, ly, r * 1.15, r, FS.bloom));
    // Shade: the underside and the right deeper, the top left catching the light.
    out.push(F(E(ccx + 14, cy + 98, hw - 6, 30, FS.bloomSh)));
    for (const [lx, ly, r] of lobes) if (ly > cy + 70) out.push(F(E(lx + r * 0.15, ly + r * 0.25, r * 0.9, r * 0.65, FS.bloomSh)));
    for (const [lx, ly, r] of lobes) if (ly > cy + 90 && lx > ccx - hw * 0.3) out.push(F(E(lx + r * 0.25, ly + r * 0.4, r * 0.55, r * 0.35, FS.bloomDeep)));
    for (const [lx, ly, r] of lobes) if (ly < cy + 60 && lx < ccx + hw * 0.45) out.push(F(E(lx - r * 0.2, ly - r * 0.15, r * 0.65, r * 0.5, FS.bloomLit)));
    // Little flowers all over it.
    for (let i = 0; i < 34; i++) {
      const a = h01(i + 80) * Math.PI * 2;
      const rr = Math.sqrt(h01(i + 81));
      const fx = ccx + Math.cos(a) * rr * (hw - 6);
      const fy = Math.max(cy + 8, cy + 64 + Math.sin(a) * rr * 54);
      out.push(...blossom(fx, fy, 2.6 + h01(i + 82) * 1.4, i % 3 === 0 ? FS.bloomLit : FS.paper));
    }
    out.push(F(T([[ccx - hw + 14, cy + 1], [ccx + hw - 14, cy + 1], [ccx + hw - 22, cy + 5], [ccx - hw + 22, cy + 5]], FS.bloomLit)));
    // The straw rope round the trunk and its paper streamers.
    out.push(...shimenawa(cx - 44, cx + 46, H - 96, 9, 8));
    for (const sx of [-28, -4, 20]) out.push(...shide(cx + sx, H - 88, 1.6));
    // Lanterns hung from the low bough's ends.
    out.push(...lantern(cx + low[0] + 24, H - low[2] + 30, 1.1), ...lantern(cx + low[1] - 24, H - low[2] + 30, 1.1));
    return out;
  });
}
function drawTree(ctx, x, y, time) {
  place(ctx, treeArt(), x, y);
  // Petals drifting down off it.
  for (let i = 0; i < 9; i++) {
    const u = (time * (0.05 + h01(i) * 0.04) + h01(i + 9)) % 1;
    const px = x - 220 + h01(i + 3) * 440 + Math.sin(time * 1.3 + i) * 18 + u * 40;
    const py = y - 520 + u * 520;
    ctx.fillStyle = hexA(i % 3 ? FS.bloom : FS.paper, Math.sin(u * Math.PI) * 0.9);
    ctx.fillRect(snap(px), snap(py), 3, 2);
  }
}

// ---------- The torii stair: a steep stone stair climbing the hill (the ground rises along it,
// TS_RUN across and TS_RISE up), a vermilion gate over every few steps, a tunnel of them. Bottom
// middle at the stair's foot level. ----------
export const TS_RUN = 480;
export const TS_RISE = 440;
const TS_W = TS_RUN;
// (Room below the foot for the stair's stone side.)
const TS_DROP = 40;
const TS_H = TS_RISE + 110 + TS_DROP;
function stairArt() {
  return art('stair', TS_W, TS_H, () => {
    const out = [];
    const H = TS_H - TS_DROP;
    const at = (x) => H - (x * TS_RISE) / TS_RUN;
    // The stair: treads level, the slope running through each one's middle; a stone side under.
    const n = 22;
    const run = TS_RUN / n;
    const prof = [];
    for (let i = 0; i < n; i++) {
      const ty = at((i + 0.5) * run);
      prof.push([i * run, ty], [(i + 1) * run, ty]);
    }
    const side = [...prof, [TS_RUN, at(TS_RUN) + 34], [0, H + 34]];
    out.push(T(side, FS.stoneSh));
    out.push(F(T([[0, H + 18], [TS_RUN, at(TS_RUN) + 18], [TS_RUN, at(TS_RUN) + 34], [0, H + 34]], FS.stoneDeep)));
    for (let i = 0; i < n; i++) {
      const ty = at((i + 0.5) * run);
      out.push(F(R(i * run, ty, (i + 1) * run, ty + 4, FS.stone)), F(R(i * run, ty, (i + 1) * run, ty + 1.4, FS.stoneLit)));
      out.push(F(R(i * run - 0.6, ty, i * run + 0.6, ty + 18, FS.stoneDeep)));
    }
    // Petals and moss tucked along it.
    for (let i = 0; i < 9; i++) {
      const x = 20 + h01(i + 50) * (TS_RUN - 40);
      out.push(...blossom(x, at(x) + 12 + h01(i) * 10, 2.6, i % 2 ? FS.bloom : FS.paper));
    }
    // The gates, the far (higher) ones first so the near ones overlap them.
    const gates = [];
    for (let gx = 40; gx < TS_RUN - 20; gx += 58) gates.push(gx);
    for (const gx of gates.reverse()) {
      const top = at(gx) - 92;
      const pl = gx - 25;
      const pr = gx + 25;
      for (const px of [pl, pr]) {
        out.push(T([[px - 4, at(px) + 6], [px - 3.2, top + 14], [px + 3.2, top + 14], [px + 4, at(px) + 6]], FS.verm), F(T([[px + 1.4, at(px) + 6], [px + 1.6, top + 14], [px + 3.2, top + 14], [px + 4, at(px) + 6]], FS.vermSh)));
        out.push(R(px - 5, at(px) - 2, px + 5, at(px) + 6, FS.ink));
      }
      out.push(R(pl - 8, top + 22, pr + 8, top + 27, FS.verm), F(R(pl - 8, top + 25.4, pr + 8, top + 27, FS.vermSh)));
      out.push(R(pl - 6, top + 9, pr + 6, top + 14, FS.verm));
      out.push(T([[pl - 16, top - 2], [pl - 8, top + 3], [gx, top + 4], [pr + 8, top + 3], [pr + 16, top - 2], [pr + 13, top + 9], [gx, top + 10], [pl - 13, top + 9]], FS.ink), F(T([[pl - 8, top + 3], [gx, top + 4], [pr + 8, top + 3], [pr + 7, top + 4.6], [gx, top + 5.6], [pl - 7, top + 4.6]], FS.inkLit)));
      out.push(R(gx - 4, top + 12, gx + 4, top + 22, FS.ink), F(R(gx - 2.6, top + 13.4, gx + 2.6, top + 20.6, FS.gold)));
    }
    return out;
  });
}

// ---------- The Fox Shrine: a vermilion hall on a stone base, white walls and lattice, a great
// plum roof sweeping out to upturned eaves, crossed beams and logs on its ridge, a gold fox crest,
// a straw rope over its glowing doorway (Tamamo's Sanctum: the portal's swirl turns in it), paper
// lanterns at its eaves. Bottom middle at the doorway's foot. ----------
const SR_W = 420;
const SR_H = 330;
export const SHRINE_DOOR = { w: 76, h: 104 };
function shrineArt() {
  return art('shrine', SR_W, SR_H, () => {
    const out = [];
    const cx = SR_W / 2;
    const H = SR_H;
    // The stone base, two low steps.
    out.push(R(cx - 186, H - 8, cx + 186, H, FS.stoneSh), F(R(cx - 186, H - 8, cx + 186, H - 6, FS.stone)));
    out.push(R(cx - 166, H - 18, cx + 166, H - 8, FS.stone), F(R(cx - 166, H - 18, cx + 166, H - 16, FS.stoneLit)), F(R(cx + 130, H - 18, cx + 166, H - 8, FS.stoneSh)));
    // The hall: white walls, lattice bays, vermilion pillars and beams.
    const top = H - 150;
    out.push(R(cx - 150, top, cx + 150, H - 18, FS.wall));
    for (const s of [-1, 1]) {
      const x0 = s < 0 ? cx - 140 : cx + 52;
      out.push(R(x0, top + 44, x0 + 88, H - 30, FS.lattice));
      for (let gx = x0 + 11; gx < x0 + 88; gx += 11) out.push(F(R(gx - 0.6, top + 44, gx + 0.6, H - 30, FS.latticeLine)));
      for (let gy = top + 55; gy < H - 30; gy += 11) out.push(F(R(x0, gy - 0.6, x0 + 88, gy + 0.6, FS.latticeLine)));
    }
    out.push(F(R(cx + 120, top, cx + 150, H - 18, FS.wallSh)));
    // The doorway (the sanctum's way in), dark and warm.
    const dw = SHRINE_DOOR.w / 2;
    out.push(T([[cx - dw, H - 18], [cx - dw, H - 18 - SHRINE_DOOR.h + 10], [cx - dw + 10, H - 18 - SHRINE_DOOR.h], [cx + dw - 10, H - 18 - SHRINE_DOOR.h], [cx + dw, H - 18 - SHRINE_DOOR.h + 10], [cx + dw, H - 18]], FS.door));
    out.push(F(T([[cx - dw + 8, H - 18], [cx - dw + 8, H - 12 - SHRINE_DOOR.h + 10], [cx + dw - 8, H - 12 - SHRINE_DOOR.h + 10], [cx + dw - 8, H - 18]], FS.doorIn)));
    for (const px of [-150, -dw - 12, dw, 138]) out.push(R(cx + px, top - 4, cx + px + 12, H - 18, FS.verm), F(R(cx + px + 8, top - 4, cx + px + 12, H - 18, FS.vermSh)), F(R(cx + px + 1.4, top - 4, cx + px + 3, H - 18, FS.vermLit)));
    out.push(R(cx - 158, top - 8, cx + 158, top + 6, FS.verm), F(R(cx - 158, top + 2, cx + 158, top + 6, FS.vermSh)));
    out.push(R(cx - 152, top + 34, cx + 152, top + 40, FS.verm), F(R(cx - 152, top + 38, cx + 152, top + 40, FS.vermSh)));
    // The roof: sweeping out and up at the eaves, tiled, a gold edge.
    const eb = top - 8;
    out.push(T([[cx - 212, eb - 16], [cx - 196, eb - 4], [cx - 170, eb + 2], [cx + 170, eb + 2], [cx + 196, eb - 4], [cx + 212, eb - 16], [cx + 196, eb - 34], [cx + 150, eb - 70], [cx + 96, eb - 118], [cx - 96, eb - 118], [cx - 150, eb - 70], [cx - 196, eb - 34]], FS.roof));
    out.push(F(T([[cx - 96, eb - 118], [cx + 96, eb - 118], [cx + 112, eb - 104], [cx - 112, eb - 104]], FS.roofLit)));
    out.push(F(T([[cx - 196, eb - 34], [cx - 150, eb - 70], [cx - 140, eb - 62], [cx - 186, eb - 26]], FS.roofLit)));
    for (let tx = cx - 160; tx <= cx + 160; tx += 14) {
      const sx = tx + (tx - cx) * 0.18;
      out.push(F(band([[tx + (tx - cx) * 0.02, eb - 96 + Math.abs(tx - cx) * 0.25], [sx, eb - 6]], () => 1.4, FS.roofSh)));
    }
    out.push(F(T([[cx - 212, eb - 16], [cx - 196, eb - 4], [cx - 170, eb + 2], [cx + 170, eb + 2], [cx + 196, eb - 4], [cx + 212, eb - 16], [cx + 208, eb - 10], [cx + 194, eb - 1], [cx + 170, eb + 5], [cx - 170, eb + 5], [cx - 194, eb - 1], [cx - 208, eb - 10]], FS.gold)));
    // The ridge: a beam, three logs across it, the crossed boards at each end.
    out.push(R(cx - 104, eb - 130, cx + 104, eb - 118, FS.roofDeep), F(R(cx - 104, eb - 130, cx + 104, eb - 127, FS.roofLit)));
    for (const lx of [-56, 0, 56]) out.push(E(cx + lx, eb - 134, 8, 7, FS.roofDeep), F(E(cx + lx, eb - 134, 4.4, 4.4, FS.gold)));
    for (const s of [-1, 1]) {
      const ex = cx + s * 100;
      out.push(T([[ex - s * 4, eb - 120], [ex + s * 14, eb - 148], [ex + s * 21, eb - 146], [ex + s * 8, eb - 118]], FS.roofDeep));
      out.push(T([[ex + s * 4, eb - 120], [ex - s * 8, eb - 146], [ex - s * 1, eb - 148], [ex + s * 14, eb - 122]], FS.roofDeep));
      out.push(F(E(ex + s * 18, eb - 147, 2.6, 2.6, FS.gold)), F(E(ex - s * 5, eb - 147, 2.6, 2.6, FS.gold)));
    }
    // The gold fox crest on the roof's face.
    const fy = eb - 64;
    out.push(E(cx, fy, 21, 21, FS.goldSh), E(cx, fy, 18, 18, FS.gold));
    out.push(F(T([[cx - 11, fy - 2], [cx - 9, fy - 14], [cx - 2, fy - 7]], FS.verm)), F(T([[cx + 11, fy - 2], [cx + 9, fy - 14], [cx + 2, fy - 7]], FS.verm)));
    out.push(F(T([[cx - 10, fy - 4], [cx + 10, fy - 4], [cx + 4, fy + 8], [cx, fy + 11], [cx - 4, fy + 8]], FS.paper)));
    out.push(F(E(cx - 4.4, fy + 1, 1.6, 1, FS.ink)), F(E(cx + 4.4, fy + 1, 1.6, 1, FS.ink)), F(E(cx, fy + 9, 1.6, 1.2, FS.ink)));
    out.push(F(E(cx - 7, fy - 8, 3, 2, FS.goldLit)));
    // The straw rope over the doorway and its streamers.
    out.push(...shimenawa(cx - 128, cx + 128, top + 16, 10, 10));
    for (const sx of [-80, -30, 26, 76]) out.push(...shide(cx + sx, top + 24, 1.7));
    // Paper lanterns at the eaves.
    out.push(...lantern(cx - 176, eb + 6, 1.3), ...lantern(cx + 176, eb + 6, 1.3));
    return out;
  });
}

export const SHRINE_KINDS = {
  pagoda: { w: PG_W + M * 2, h: PG_H + M, draw: (ctx, x, y) => place(ctx, pagodaArt(), x, y) },
  sacredtree: { w: TR_W + M * 2, h: TR_H + M, draw: drawTree },
  // (Placed by its foot: the stair runs right and up from x.)
  toriistair: { w: TS_W + M * 2, h: TS_H + M, draw: (ctx, x, y) => place(ctx, stairArt(), x + TS_W / 2, y + TS_DROP) },
  foxshrine: { w: SR_W + M * 2, h: SR_H + M, draw: (ctx, x, y) => place(ctx, shrineArt(), x, y) },
};
