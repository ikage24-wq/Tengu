// Serpent Springs (its makeover, 2026-11-20): an onsen hillside. On the ground, the bathhouse: a
// wooden hot-spring house with a curtain over its door, lanterns and a steaming chimney (its roof a
// ledge). Up the hill, white mineral terraces holding steaming turquoise pools, one over the next
// (their tops are the ground's steps); a wooden aqueduct on stilts carrying the hot water over
// them (its deck a ledge); a rose-grown arch in the cliff behind the falls, the way into Lilith's
// Rose Grotto; and on the summit the Serpent Stone, a jade serpent coiled round on itself, smiling
// with its eyes shut, a rose by its cheek (its coils are ledges).

import { E, T, F, sprite, blit, snap } from './pixel.js';
import { band } from './propkit.js';

export const SP = {
  wood: '#d8a878', woodLit: '#f0c898', woodSh: '#b07e58', woodDeep: '#8a5e44',
  plaster: '#fff6ea', plasterSh: '#efdcc8', roof: '#5a6a8e', roofLit: '#7a8cb0', roofSh: '#45526e',
  noren: '#4a5a9a', norenSh: '#3a4880', paper: '#ffffff',
  trav: '#fbf6f0', travLit: '#ffffff', travSh: '#e8dcd4', travDeep: '#d4c4bc',
  water: '#7fdcd8', waterLit: '#c8f6f0', waterSh: '#4fbcc0',
  jade: '#8fd4b4', jadeLit: '#c4f0dc', jadeSh: '#5fae90', jadeDeep: '#3f8a70',
  rock: '#b8a8a4', rockLit: '#d8ccc8', rockSh: '#8e7e7c', hole: '#4a3a52', holeIn: '#6a4e66',
  rose: '#ff6a88', roseLit: '#ffa8bc', roseSh: '#d84868', leaf: '#7cc88a', leafSh: '#4f9e64',
  lantern: '#ff8a6a', lanternLit: '#ffe0a0', ink: '#4a3a5c', blush: '#ffb0b8', bamboo: '#a8d878', bambooSh: '#78b058',
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
const R = (x0, y0, x1, y1, c) => T([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], c);

const M = 40;
const moveIn = (sh) => (sh.pts ? { ...sh, pts: sh.pts.map(([px, py]) => [px + M, py + M]) } : { ...sh, x: (sh.x ?? 0) + M, y: (sh.y ?? 0) + M });
function art(key, w, h, build) {
  return sprite(`sp|${key}`, () => ({ w: w + M * 2, h: h + M, shapes: build().filter(Boolean).map(moveIn), res: 2, soft: 'cel' }));
}
function place(ctx, s, x, y) {
  blit(ctx, s, snap(x - s.w / 2), snap(y - s.h));
}
// Soft steam puffs rising from (x, y) across width w.
function steam(ctx, x, y, w, time, n = 4, rise = 60, seed = 0) {
  for (let k = 0; k < n; k++) {
    const u = (time * 0.25 + k / n + h01(seed + k)) % 1;
    const px = x - w / 2 + h01(seed + k * 3) * w + Math.sin(time * 1.2 + k) * 6;
    const py = y - u * rise;
    const r = 5 + u * 9;
    ctx.fillStyle = hexA('#ffffff', Math.sin(u * Math.PI) * 0.45);
    ctx.beginPath();
    ctx.ellipse(px, py, r, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
// A paper lantern hung at (x, y) (its top).
const lantern = (x, y, s = 1) => [
  F(band([[x, y - 6 * s], [x, y]], () => 0.9, SP.ink)),
  R(x - 3.4 * s, y, x + 3.4 * s, y + 2.4 * s, SP.ink),
  T([[x - 6 * s, y + 2.4 * s], [x + 6 * s, y + 2.4 * s], [x + 7.4 * s, y + 9 * s], [x + 6 * s, y + 15 * s], [x - 6 * s, y + 15 * s], [x - 7.4 * s, y + 9 * s]], SP.lantern),
  F(T([[x - 2 * s, y + 3.4 * s], [x + 2 * s, y + 3.4 * s], [x + 3 * s, y + 9 * s], [x + 2 * s, y + 14 * s], [x - 2 * s, y + 14 * s], [x - 3 * s, y + 9 * s]], SP.lanternLit)),
  R(x - 3.4 * s, y + 15 * s, x + 3.4 * s, y + 17.4 * s, SP.ink),
];
// The hot-spring sign: a bowl with three wavy steam lines over it.
const onsenMark = (x, y, s, c) => {
  const out = [F(band(arc(x, y, 9 * s, 6 * s, 10, 170, 10), () => 1.8 * s, c))];
  for (const dx of [-5, 0, 5]) out.push(F(band([[x + dx * s, y - 2 * s], [x + dx * s - 2 * s, y - 6 * s], [x + dx * s + 1.4 * s, y - 10 * s], [x + dx * s - 1 * s, y - 14 * s]], () => 1.4 * s, c)));
  return out;
};

// ---------- The bathhouse: wooden walls, white plaster above, a curtain with the hot-spring sign
// over the door, a tiled roof with a flat ridge walk on top (a ledge BH_ROOF up), a chimney on its
// left with steam pouring off it, lanterns, a stack of buckets. Bottom middle at the door. ----------
const BH_W = 280;
const BH_H = 200;
export const BH_ROOF = 130;
export const BH_ROOF_SPAN = [-70, 70];
function bathArt() {
  return art('bath', BH_W, BH_H, () => {
    const out = [];
    const cx = BH_W / 2;
    const H = BH_H;
    const rt = H - BH_ROOF;
    // The chimney on the left, behind the roof.
    out.push(R(cx - 112, rt - 30, cx - 88, rt + 40, SP.rock), F(R(cx - 96, rt - 30, cx - 88, rt + 40, SP.rockSh)), R(cx - 116, rt - 36, cx - 84, rt - 28, SP.rockLit));
    // The walls: a stone footing, wooden boards, white plaster up under the eaves.
    out.push(R(cx - 120, H - 10, cx + 120, H, SP.rock), F(R(cx - 120, H - 10, cx + 120, H - 8, SP.rockLit)));
    out.push(R(cx - 114, rt + 36, cx + 114, H - 10, SP.wood));
    for (let x = cx - 104; x < cx + 112; x += 13) out.push(F(R(x, rt + 70, x + 1.2, H - 10, SP.woodSh)));
    out.push(F(R(cx - 114, rt + 36, cx + 114, rt + 66, SP.plaster)), F(R(cx + 80, rt + 36, cx + 114, H - 10, SP.woodSh)));
    for (const px of [-114, -40, 40, 104]) out.push(R(cx + px, rt + 36, cx + px + 10, H - 10, SP.woodDeep), F(R(cx + px + 1.4, rt + 36, cx + px + 3, H - 10, SP.woodSh)));
    out.push(R(cx - 118, rt + 64, cx + 118, rt + 70, SP.woodDeep));
    // A lattice window either side of the door.
    for (const wx of [-78, 72]) {
      out.push(R(cx + wx - 16, rt + 80, cx + wx + 16, rt + 108, SP.woodDeep), F(R(cx + wx - 13, rt + 83, cx + wx + 13, rt + 105, '#ffe8b8')));
      for (const gx of [-6, 0, 6]) out.push(F(R(cx + wx + gx - 0.6, rt + 83, cx + wx + gx + 0.6, rt + 105, SP.woodSh)));
      out.push(F(R(cx + wx - 13, rt + 93.4, cx + wx + 13, rt + 94.6, SP.woodSh)));
    }
    // The doorway and its curtain: three panels, the hot-spring sign on the middle one.
    out.push(R(cx - 30, rt + 72, cx + 30, H - 10, SP.hole));
    for (const [px, k] of [[-30, 0], [-10, 1], [10, 2]]) {
      out.push(T([[cx + px, rt + 72], [cx + px + 20, rt + 72], [cx + px + 20, rt + 110], [cx + px + 10, rt + 113], [cx + px, rt + 110]], k === 1 ? SP.noren : SP.norenSh));
    }
    out.push(...onsenMark(cx, rt + 102, 0.9, SP.paper));
    out.push(F(R(cx - 32, rt + 70, cx + 32, rt + 73, SP.woodDeep)));
    // The roof: eaves sweeping out, tiled slopes, a flat ridge walk on top with a low rail.
    const [r0, r1] = BH_ROOF_SPAN;
    out.push(T([[cx - 140, rt + 44], [cx - 128, rt + 34], [cx + r0 - 6, rt + 2], [cx + r0, rt], [cx + r1, rt], [cx + r1 + 6, rt + 2], [cx + 128, rt + 34], [cx + 140, rt + 44], [cx + 132, rt + 48], [cx - 132, rt + 48]], SP.roof));
    out.push(F(T([[cx - 128, rt + 34], [cx + r0 - 6, rt + 2], [cx + r0, rt], [cx - 30, rt], [cx - 100, rt + 30]], SP.roofLit)));
    for (let x = cx - 120; x <= cx + 120; x += 12) out.push(F(band([[x * 0.5 + cx * 0.5, rt + 6], [x, rt + 44]], () => 1.2, SP.roofSh)));
    out.push(F(R(cx - 136, rt + 44, cx + 136, rt + 48, SP.roofSh)));
    out.push(R(cx + r0, rt - 2, cx + r1, rt + 6, SP.woodDeep), F(R(cx + r0, rt - 2, cx + r1, rt, SP.woodLit)));
    // Lanterns under the eaves, buckets stacked by the door.
    out.push(...lantern(cx - 50, rt + 50, 1.1), ...lantern(cx + 50, rt + 50, 1.1));
    for (const [bx, by] of [[cx + 46, H - 10], [cx + 62, H - 10], [cx + 54, H - 22]]) {
      out.push(T([[bx - 7, by - 12], [bx + 7, by - 12], [bx + 6, by], [bx - 6, by]], SP.woodLit), F(R(bx - 7, by - 9, bx + 7, by - 7.6, SP.woodDeep)), F(R(bx - 6.4, by - 4, bx + 6.4, by - 2.6, SP.woodDeep)));
    }
    return out;
  });
}
function drawBath(ctx, x, y, time) {
  place(ctx, bathArt(), x, y);
  steam(ctx, x - 100, y - BH_ROOF - 34, 24, time, 4, 70, 3);
}

// ---------- The terraces: white mineral lips draping down each step of the hill, a steaming
// turquoise pool on top of every step. Placed by the foot of its lowest step; the steps are
// TV_STEPS [from, to, rise] (they match the map's ground). ----------
export const TV_STEPS = [[0, 180, 80], [180, 360, 160], [360, 540, 240], [540, 820, 320]];
const TV_W = 840;
const TV_H = 360;
function terraceArt() {
  return art('terr', TV_W, TV_H, () => {
    const out = [];
    const H = TV_H;
    const ox = 10;
    for (const [x0, x1, rise] of TV_STEPS) {
      const top = H - rise;
      const below = top + 80;
      // The crust under the pool: white mineral built up along the step, scalloped underneath.
      const crust = [[ox + x0 - 6, top + 4], [ox + x1, top + 4], [ox + x1, top + 22]];
      for (let x = x1; x > x0; x -= 18) crust.push([ox + x, top + 22 + (h01(x) * 6)], [ox + x - 9, top + 30 + h01(x + 1) * 6]);
      crust.push([ox + x0 - 6, top + 28]);
      out.push(T(crust, SP.trav));
      out.push(F(R(ox + x0, top + 14, ox + x1, top + 17, SP.travSh)));
      // The pool on the step: water a hand deep over the walk (you wade it), a raised lip at its front.
      out.push(R(ox + x0 + 6, top - 5, ox + x1, top + 6, SP.water), F(R(ox + x0 + 10, top - 5, ox + x1, top - 3, SP.waterLit)), F(R(ox + x0 + 6, top + 3, ox + x1, top + 6, SP.waterSh)));
      for (let x = x0 + 30; x < x1 - 16; x += 46) out.push(F(R(ox + x, top - 1, ox + x + 12, top, SP.waterLit)));
      // The lip: white mineral rounded over the edge and draping down the face below in curtains.
      const drape = [[ox + x0 + 16, top - 8], [ox + x0 + 2, top - 9], [ox + x0 - 14, top - 2]];
      for (let k = 0; k <= 6; k++) {
        const yy = top + 6 + ((below - top - 6) * k) / 6;
        drape.push([ox + x0 - 16 + (k % 2 ? 6 : 0) - h01(x0 + k) * 4, yy]);
      }
      drape.push([ox + x0 + 12, below], [ox + x0 + 22, below - 24], [ox + x0 + 24, top + 4], [ox + x0 + 14, top - 2]);
      out.push(T(drape, SP.trav));
      out.push(F(T([[ox + x0 + 2, top - 7], [ox + x0 - 10, top - 1], [ox + x0 - 8, below - 6], [ox + x0, below - 10], [ox + x0 + 4, top + 2]], SP.travLit)));
      for (let k = 0; k < 3; k++) {
        const yy = top + 18 + k * 20;
        out.push(F(band(arc(ox + x0 - 4, yy, 11, 5, 20, 160, 8), () => 1.2, SP.travSh)));
      }
      // Water spilling over the lip in thin trickles.
      for (const dx of [-10, 0]) out.push(F(band([[ox + x0 + dx, top - 4], [ox + x0 + dx - 1, top + 30], [ox + x0 + dx + 1, below - 6]], () => 1.3, SP.waterLit)));
    }
    return out;
  });
}
function drawTerraces(ctx, x, y, time) {
  place(ctx, terraceArt(), x + TV_W / 2 - 10, y);
  for (const [x0, x1, rise] of TV_STEPS) steam(ctx, x + (x0 + x1) / 2, y - rise, x1 - x0 - 30, time, 3, 50, x0);
}

// ---------- The aqueduct: a wooden deck on stilts (its top a ledge) with a split-bamboo channel of
// hot water along its back, lanterns under it. Placed at the middle of its deck; AQ_LEGS are its
// stilts [x from the middle, how far down] (they stand on the terraces below). ----------
export const AQ_W = 620;
export const AQ_LEGS = [[-270, 320], [-80, 240], [100, 160], [250, 80]];
const AQ_DROP = 330;
const AQ_H = 40 + AQ_DROP;
function aqueductArt() {
  return art('aq', AQ_W, AQ_H, () => {
    const out = [];
    const cx = AQ_W / 2;
    const dy = AQ_H - AQ_DROP;
    // The stilts and their braces.
    for (const [lx, down] of AQ_LEGS) {
      out.push(R(cx + lx - 6, dy + 10, cx + lx + 6, dy + down, SP.wood), F(R(cx + lx + 2, dy + 10, cx + lx + 6, dy + down, SP.woodSh)));
      out.push(F(band([[cx + lx - 40, dy + 12], [cx + lx, dy + 46]], () => 2.4, SP.woodSh)), F(band([[cx + lx + 40, dy + 12], [cx + lx, dy + 46]], () => 2.4, SP.woodSh)));
    }
    // The bamboo channel along the back, water and steam in it.
    out.push(R(6, dy - 18, AQ_W - 6, dy - 4, SP.bamboo), F(R(6, dy - 18, AQ_W - 6, dy - 15, SP.waterLit)), F(R(6, dy - 8, AQ_W - 6, dy - 4, SP.bambooSh)));
    for (let x = 40; x < AQ_W; x += 80) out.push(F(R(x, dy - 18, x + 2, dy - 4, SP.bambooSh)));
    // The deck.
    out.push(R(0, dy, AQ_W, dy + 12, SP.wood), F(R(0, dy, AQ_W, dy + 2.4, SP.woodLit)), F(R(0, dy + 9, AQ_W, dy + 12, SP.woodSh)));
    for (let x = 14; x < AQ_W; x += 22) out.push(F(R(x, dy + 2.4, x + 1, dy + 9, SP.woodSh)));
    // Lanterns hung under it.
    for (const lx of [-190, -10, 170]) out.push(...lantern(cx + lx, dy + 18, 1));
    return out;
  });
}
function drawAqueduct(ctx, x, y, time) {
  place(ctx, aqueductArt(), x, y + AQ_DROP);
  steam(ctx, x, y - 16, AQ_W - 60, time, 5, 36, 21);
}

// ---------- The rose arch: a rock arch in the cliff, its opening dark (the grotto's swirl turns
// in it), roses climbing all round it. Bottom middle at the door. ----------
const RA_W = 160;
const RA_H = 150;
export const RA_DOOR = { w: 70, h: 100 };
function roseArt() {
  return art('rose', RA_W, RA_H, () => {
    const out = [];
    const cx = RA_W / 2;
    const H = RA_H;
    const dw = RA_DOOR.w / 2;
    const dh = RA_DOOR.h;
    out.push(T([[cx - 66, H], [cx - 64, H - 70], ...arc(cx, H - dh + 6, 64, 64, 180, 360, 16), [cx + 64, H - 70], [cx + 66, H]], SP.rock));
    out.push(F(T([[cx + 30, H], [cx + 40, H - 80], ...arc(cx, H - dh + 6, 60, 60, 300, 360, 6), [cx + 64, H - 70], [cx + 66, H]], SP.rockSh)));
    out.push(T([[cx - dw, H], ...arc(cx, H - dh + dw, dw, dw, 180, 360, 14), [cx + dw, H]], SP.hole));
    out.push(F(T([[cx - dw + 8, H], ...arc(cx, H - dh + dw + 6, dw - 8, dw - 8, 180, 360, 12), [cx + dw - 8, H]], SP.holeIn)));
    // Vines and roses climbing round the arch.
    const vine = arc(cx, H - dh + 6, 58, 58, 170, 370, 20);
    out.push(F(band(vine, () => 2.2, SP.leafSh)));
    for (let i = 0; i < vine.length; i += 2) {
      const [vx, vy] = vine[i];
      out.push(F(E(vx + (h01(i) - 0.5) * 8, vy - 4, 5, 3, SP.leaf)));
      if (i % 4 === 0) {
        const r = 6 + h01(i + 3) * 3;
        out.push(E(vx, vy, r, r, SP.rose), F(E(vx - r * 0.2, vy - r * 0.2, r * 0.55, r * 0.55, SP.roseLit)), F(band(arc(vx, vy, r * 0.45, r * 0.45, 0, 300, 8), () => 1, SP.roseSh)));
      }
    }
    for (const [vx, vy] of [[cx - 60, H - 20], [cx + 58, H - 30], [cx - 54, H - 50]]) out.push(E(vx, vy, 7, 7, SP.rose), F(E(vx - 1.4, vy - 1.4, 3.6, 3.6, SP.roseLit)), F(E(vx + 6, vy + 4, 5, 3, SP.leaf)));
    return out;
  });
}

// ---------- The Serpent Stone: a jade serpent coiled round on itself, its coils flat on top
// (ledges SS_COIL1 and SS_COIL2 up), its head rising from the top coil, smiling with its eyes
// shut, a rose by its cheek, its tail curling at the foot. Bottom middle on the summit. ----------
const SS_W = 280;
const SS_H = 270;
export const SS_COIL1 = 80;
export const SS_COIL2 = 160;
export const SS_SPAN1 = [-110, 110];
export const SS_SPAN2 = [-78, 78];
function serpentArt() {
  return art('serpent', SS_W, SS_H, () => {
    const out = [];
    const cx = SS_W / 2;
    const H = SS_H;
    const coil = (y0, y1, hw, seed) => {
      out.push(T([[cx - hw - 8, y1 - 4], [cx - hw - 12, (y0 + y1) / 2], [cx - hw, y0 + 4], [cx - hw + 10, y0], [cx + hw - 10, y0], [cx + hw, y0 + 4], [cx + hw + 12, (y0 + y1) / 2], [cx + hw + 8, y1 - 4], [cx + hw - 6, y1]], SP.jade));
      out.push(T([[cx - hw - 8, y1 - 4], [cx + hw + 8, y1 - 4], [cx + hw - 6, y1], [cx - hw + 6, y1]], SP.jade));
      out.push(F(T([[cx - hw + 10, y0], [cx + hw - 10, y0], [cx + hw, y0 + 4], [cx + hw - 4, y0 + 8], [cx - hw + 4, y0 + 8]], SP.jadeLit)));
      out.push(F(T([[cx + hw * 0.4, y1], [cx + hw + 8, y1 - 4], [cx + hw + 12, (y0 + y1) / 2], [cx + hw, y0 + 12], [cx + hw * 0.5, (y0 + y1) / 2 + 10]], SP.jadeSh)));
      // Its belly band and scales.
      out.push(F(band([[cx - hw - 6, (y0 + y1) / 2 + 14], [cx, (y0 + y1) / 2 + 22], [cx + hw + 6, (y0 + y1) / 2 + 14]], () => 5, SP.jadeLit)));
      for (let x = cx - hw + 14; x < cx + hw - 10; x += 18) out.push(F(band(arc(x, y0 + 26 + h01(seed + x) * 6, 7, 4, 20, 160, 6), () => 1.1, SP.jadeDeep)));
    };
    coil(H - SS_COIL1, H, SS_SPAN1[1] + 6, 1);
    coil(H - SS_COIL2, H - SS_COIL1 + 6, SS_SPAN2[1] + 6, 2);
    // The tail curling out at the foot on the right.
    out.push(F(band([[cx + 110, H - 8], [cx + 126, H - 12], [cx + 134, H - 26], [cx + 128, H - 36]], (u) => 9 - u * 7, SP.jade)));
    // The head and neck rising from the top coil (behind its middle, left of where you stand).
    const ny = H - SS_COIL2;
    out.push(T([[cx - 50, ny + 4], [cx - 54, ny - 30], [cx - 46, ny - 62], [cx - 20, ny - 84], [cx + 10, ny - 88], [cx + 34, ny - 74], [cx + 40, ny - 54], [cx + 22, ny - 40], [cx - 10, ny - 40], [cx - 18, ny - 24], [cx - 14, ny + 4]], SP.jade));
    out.push(F(T([[cx - 46, ny - 62], [cx - 20, ny - 84], [cx + 10, ny - 88], [cx + 6, ny - 78], [cx - 18, ny - 72], [cx - 40, ny - 50]], SP.jadeLit)));
    out.push(F(T([[cx + 34, ny - 74], [cx + 40, ny - 54], [cx + 22, ny - 40], [cx - 10, ny - 40], [cx + 8, ny - 50], [cx + 28, ny - 58]], SP.jadeSh)));
    // Its face: eyes shut in a smile, rosy cheeks, a smile.
    out.push(F(band(arc(cx - 8, ny - 66, 7, 5, 200, 340, 8), () => 1.8, SP.jadeDeep)));
    out.push(F(band(arc(cx + 18, ny - 64, 6, 4.4, 200, 340, 8), () => 1.8, SP.jadeDeep)));
    out.push(F(E(cx - 14, ny - 56, 6, 3.4, SP.blush)), F(E(cx + 24, ny - 54, 5, 3, SP.blush)));
    out.push(F(band(arc(cx + 10, ny - 52, 8, 5, 20, 160, 8), () => 1.6, SP.jadeDeep)));
    // A rose tucked by its cheek.
    const rx = cx - 34;
    const ry = ny - 70;
    out.push(E(rx, ry, 9, 9, SP.rose), F(E(rx - 2, ry - 2, 5, 5, SP.roseLit)), F(band(arc(rx, ry, 4, 4, 0, 300, 8), () => 1.1, SP.roseSh)), F(E(rx + 8, ry + 6, 6, 3.4, SP.leaf)));
    return out;
  });
}

export const SPRING_KINDS = {
  bathhouse: { w: BH_W + M * 2, h: BH_H + M, draw: drawBath },
  // (Placed by the foot of its lowest step: it runs right and up from x.)
  terraces: { w: TV_W + M * 2, h: TV_H + M, draw: drawTerraces },
  aqueduct: { w: AQ_W + M * 2, h: AQ_H + M, draw: drawAqueduct },
  rosearch: { w: RA_W + M * 2, h: RA_H + M, draw: (ctx, x, y) => place(ctx, roseArt(), x, y) },
  serpentstone: { w: SS_W + M * 2, h: SS_H + M, draw: (ctx, x, y) => place(ctx, serpentArt(), x, y) },
};
