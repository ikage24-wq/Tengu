// Gnarlroot's Root Tendrils, remade from scratch for Chapter 3 (2026-11-18): live puppets on the rig
// (rig.js), every part drawn once and placed each frame, outer outline only. (Gnarlroot himself was
// redrawn on 2026-11-25 as Old Mossbeard on the brute base: render/gnarlroot/.)
//
//   sapling    Root Tendril (was the Corrupted Sapling): a thick root curling up out of the floor,
//              a leaf or two and a pink bud at its tip, swaying; cut, it wilts.

import { E, T, F, stroke } from './kit.js';
import { simpleEye, deadEye, tear } from './faces.js';
import { ramp, crescent, shine } from './meadow.js';
import { part, partBare, makeRig, stateBlend, smooth, clamp, lerp, TAU } from './rig.js';
import { sprite } from '../pixel.js';
import { drawMochiAnim } from '../mochi-anim.js';
import { rollMochi } from '../../data/mochi-genes.js';

const D2R = Math.PI / 180;
const INK = '#2e1c26';
const fr = (x) => ((x % 1) + 1) % 1;
const BARK = ramp('#a8785a', { step: 9, turn: 10 });
const MOSS = ramp('#8cc46e', { step: 9, turn: 10 });
const LEAF = [ramp('#7fc46a', { step: 10, turn: 10 }), ramp('#a2d878', { step: 10, turn: 10 }), ramp('#62a85e', { step: 10, turn: 10 })];
const ACORN = ramp('#c88a4a', { step: 9, turn: 8 });
const BUD = ramp('#ff9ec0', { step: 9, turn: 8 });

const ov = (cx, cy, rx, ry, deg, c, n = 18) => {
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
const arcP = (cx, cy, rx, ry, a0, a1, n = 10) => {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = (a0 + ((a1 - a0) * i) / n) * D2R;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
};
const taper = (pts, w0, w1, c) => {
  const l = [];
  const r = [];
  pts.forEach(([x, y], i) => {
    const [ax, ay] = pts[Math.max(0, i - 1)];
    const [bx, by] = pts[Math.min(pts.length - 1, i + 1)];
    const d = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / d;
    const ny = (bx - ax) / d;
    const w = (w0 + (w1 - w0) * (i / (pts.length - 1))) / 2;
    l.push([x + nx * w, y + ny * w]);
    r.push([x - nx * w, y - ny * w]);
  });
  return T([...l, ...r.reverse()], c);
};
const pairOf = (pre) => (key, w, h, shapes, pad = 3) => [() => part(`${pre}|${key}`, w, h, shapes, pad), () => partBare(`${pre}|${key}`, w, h, shapes, pad)];
const hold = (u, a, b, c, d) => (u < a || u > d ? 0 : u < b ? smooth((u - a) / (b - a)) : u < c ? 1 : 1 - smooth((u - c) / (d - c)));
const leafy = (x, y, r, d, c) => [ov(x, y, r * 1.3, r * 0.8, d, c.base), F(taper([[x - Math.cos(d * D2R) * r, y - Math.sin(d * D2R) * r], [x + Math.cos(d * D2R) * r, y + Math.sin(d * D2R) * r]], 0.5, 0.25, c.sh))];
const blossom = (x, y, k = 1) => [...[0, 1, 2, 3, 4].map((p) => F(E(x + Math.cos(p * 72 * D2R) * 1.4 * k, y + Math.sin(p * 72 * D2R) * 1.4 * k, 1.2 * k, 1.2 * k, '#ffffff'))), F(E(x, y, 0.7 * k, 0.7 * k, '#ffe36b'))];
const acorn = (x, y) => [E(x, y + 1.6, 2, 2.4, ACORN.base), T([[x - 2.6, y + 0.4], [x - 2, y - 1.4], [x, y - 2.2], [x + 2, y - 1.4], [x + 2.6, y + 0.4]], '#8a5a3a'), F(E(x - 0.6, y + 1.4, 0.6, 0.9, ACORN.hi))];

// Elder Yomogi, kept in Gnarlroot's roots: a Mochi elder (mugwort-green, in the palace's elder robe
// and hat, a monocle and the famous fake beard), drawn by the Mochi renderer (render/gnarlroot/index.js).
export const YOMOGI = { seed: 41, force: { dough: '#d8efc0', hairColor: 'yomogi' }, wear: { dress: 'elderrobe', hat: 'elderhat', eyes: 'monocle', face: 'fakebeard' } };

// =====================================================================================
// Root Tendril (sapling)
// =====================================================================================
const tp = pairOf('rt');
// A segment of the tendril: a thick root, tapering. Box 10 x 18; its root at (5, 17).
const rtSegShapes = (k) => () => {
  const w0 = 10 - k * 2.4;
  const w1 = w0 - 2.4;
  return [taper([[5, 17], [5.4, 9], [5, 1]], w0, w1, k % 2 ? BARK.sh : BARK.base), F(taper([[4.2, 15], [4.4, 4]], 0.8, 0.4, BARK.hi))];
};
const rtBudShapes = () => [E(5, 5, 3.6, 4.2, BUD.base), F(E(4, 3.6, 1.2, 1.4, BUD.hi)), ...leafy(1.6, 8.6, 2.4, 150, LEAF[0]), ...leafy(8.6, 8.4, 2.4, 30, LEAF[1])];
const rtFootShapes = () => [ov(9, 4, 9, 3.4, 0, BARK.base), F(E(5, 3, 2.4, 1, MOSS.base))];
const RT_SEG = [0, 1, 2].map((k) => tp(`seg${k}`, 10, 18, rtSegShapes(k), 2));
const RT_BUD = tp('bud', 10, 12, rtBudShapes, 2);
const RT_FOOT = tp('foot', 18, 8, rtFootShapes, 2);
const rtPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    ...[0, 1, 2].map((k) => ({
      name: `seg${k}${tag}`,
      parent: k ? `seg${k - 1}${tag}` : 'base',
      s: RT_SEG[k][i],
      pivot: [5, 17],
      at: k ? () => [0, -15] : () => [0, 0],
      rot: (S, a) => ([-12, 26, 34][k] + Math.sin(a.t * 1.6 + k * 0.9 + (a.uidOff ?? 0)) * (5 + k * 3) + S.curl * (k + 1) * 0.6) * D2R,
    })),
    { name: `bud${tag}`, parent: `seg2${tag}`, s: RT_BUD[i], pivot: [5, 11], at: () => [0, -14], rot: (S, a) => (Math.sin(a.t * 2 + 1) * 8) * D2R },
    { name: `foot${tag}`, parent: null, s: RT_FOOT[i], pivot: [9, 6], at: () => [0, 0] },
  ];
};
export const tendrilRig = makeRig({
  w: 26,
  h: 56,
  soft: true,
  stride: 20,
  springs: { curl: [60, 6], wilt: [40, 8] },
  kick: { curl: 600 },
  pose(m, a) {
    a.uidOff = (m.uid % 9) * 0.7;
    // (Cut: it wilts over.)
    return { curl: m.hp <= 0 ? 40 : Math.sin(a.t * 0.9 + a.uidOff) * 6, wilt: m.hp <= 0 ? 1 : 0 };
  },
  parts: [{ name: 'base', parent: null, at: () => [0, -2], rot: (S) => S.wilt * 50 * D2R }, ...rtPass(false), ...rtPass(true)],
});
export function tendrilStill() {
  const put = (shapes, [px, py], x, y) => shapes.filter(Boolean).map((sh) => (sh.t === 'p' ? { ...sh, x: 0, y: 0, pts: sh.pts.map(([qx, qy]) => [qx + (sh.x ?? 0) - px + x, qy + (sh.y ?? 0) - py + y]) } : { ...sh, x: sh.x - px + x, y: sh.y - py + y }));
  return {
    w: 26,
    h: 56,
    res: 3,
    shapes: [...put(rtSegShapes(0)(), [5, 17], 13, 52), ...put(rtSegShapes(1)(), [5, 17], 13, 37), ...put(rtSegShapes(2)(), [5, 17], 13, 22), ...put(rtBudShapes(), [5, 11], 13, 8), ...put(rtFootShapes(), [9, 6], 13, 54)],
  };
}
