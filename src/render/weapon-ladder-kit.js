// Shared pieces for the Island Journey weapon ladder (docs/design/island-journey-gear.md): every
// tier's module (render/weapon-sprout.js, render/weapon-rootwood.js and on) draws with these, so
// they all keep the same frame, the same sizes the moves were drawn for, and the bow's shape.
//
// The frame is weapon-designs.js's: the grip at (0, 0), the weapon pointing toward -y, the edge or
// belly toward +x.

import { R, E, T, F } from './pixel.js';

// Matte things (wood, roots, twine, moss, leaves, stone) are shaded as leather, gems and sap as
// gems, fittings as metal (render/jobgear/kit.js).
export const matte = (shape) => ({ ...shape, mat: 'leather' });
export const gemmy = (shape) => ({ ...shape, mat: 'gem' });
export const metal = (shape) => ({ ...shape, mat: 'metal' });

// A tapered band along a centre line, `w0` wide at its start and `w1` at its end, as one polygon.
export function tube(pts, w0, w1 = w0) {
  const l = [];
  const r = [];
  pts.forEach(([x, y], i) => {
    const [px, py] = pts[Math.max(0, i - 1)];
    const [nx, ny] = pts[Math.min(pts.length - 1, i + 1)];
    const dx = nx - px;
    const dy = ny - py;
    const len = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * (i / (pts.length - 1))) / 2;
    l.push([x - (dy / len) * w, y + (dx / len) * w]);
    r.push([x + (dy / len) * w, y - (dx / len) * w]);
  });
  return [...l, ...r.reverse()];
}
// A polygon from its +x half (listed from the top down), mirrored onto -x.
export function mir(half) {
  const back = half.slice(half[0][0] === 0 ? 1 : 0).reverse().map(([x, y]) => [-x, y]);
  return [...half, ...back];
}
// Points round an ellipse arc, angles in degrees (0 = +x, 90 = up).
export function arc(cx, cy, rx, ry, a0, a1, n = 10) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const r = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return [cx + Math.cos(r) * rx, cy - Math.sin(r) * ry];
  });
}
// A curved bezier through three points, `n` steps.
export function curve([x0, y0], [x1, y1], [x2, y2], n = 8) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n;
    const v = 1 - u;
    return [v * v * x0 + 2 * v * u * x1 + u * u * x2, v * v * y0 + 2 * v * u * y1 + u * u * y2];
  });
}
// A line wandering a little either side of the way from (x0, y0) to (x1, y1), `wob` far.
export function wander([x0, y0], [x1, y1], wob = 0.3, n = 6, phase = 0) {
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const [nx, ny] = [-(y1 - y0) / len, (x1 - x0) / len];
  return Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n;
    const o = Math.sin(u * Math.PI * 2 + phase) * wob * Math.sin(u * Math.PI);
    return [x0 + (x1 - x0) * u + nx * o, y0 + (y1 - y0) * u + ny * o];
  });
}

// A leaf from (x, y) toward angle `a` (degrees, 0 = +x, 90 = up), `len` long and `w` wide: a full
// leaf with a light half, its midrib and two pairs of veins, curling a touch (`curl`, degrees).
// `pal`: { leaf, light, dark }; `lobed` gives it an oak leaf's wavy edge.
export function leaf(x, y, a, len, w, pal, { curl = 12, light = true, lobed = false } = {}) {
  const r = (a * Math.PI) / 180;
  const d = [Math.cos(r), -Math.sin(r)];
  const n = [-d[1], d[0]];
  const bend = (curl * Math.PI) / 180;
  const at = (u, s) => {
    const off = Math.sin(u * Math.PI * 0.5) * u * bend * len * 0.5;
    return [x + d[0] * len * u + n[0] * (w * s + off), y + d[1] * len * u + n[1] * (w * s + off)];
  };
  const outline = lobed
    ? [at(0, 0), at(0.16, 0.55), at(0.26, 0.85), at(0.36, 0.6), at(0.5, 1), at(0.62, 0.7), at(0.76, 0.85), at(0.9, 0.4), at(1, 0), at(0.9, -0.4), at(0.76, -0.85), at(0.62, -0.7), at(0.5, -1), at(0.36, -0.6), at(0.26, -0.85), at(0.16, -0.55)]
    : [at(0, 0), at(0.2, 0.75), at(0.45, 1), at(0.72, 0.78), at(0.92, 0.32), at(1, 0), at(0.92, -0.3), at(0.72, -0.76), at(0.45, -1), at(0.2, -0.72)];
  const out = [matte(T(outline, pal.leaf))];
  if (light) out.push(F(T([at(0.06, 0), at(0.2, 0.6), at(0.45, 0.85), at(0.72, 0.62), at(0.92, 0.22), at(0.96, 0)], pal.light)));
  out.push(F(T(tube([at(0.04, 0), at(0.5, 0), at(0.94, 0)], Math.max(0.26, w * 0.2), 0.14), pal.dark)));
  for (const [u, s] of [[0.32, 1], [0.32, -1], [0.58, 1], [0.58, -1]]) out.push(F(T(tube([at(u, 0), at(u + 0.14, s * 0.62)], 0.16, 0.12), pal.dark)));
  return out;
}

// A knot in the wood: a dark ring round a lighter heart. `pal`: { dark, mid, light }.
export const knot = (x, y, r, pal) => [F(E(x, y, r, r * 0.75, pal.dark)), F(E(x, y, r * 0.55, r * 0.4, pal.mid)), F(E(x - r * 0.15, y - r * 0.1, r * 0.2, r * 0.15, pal.light))];
// Grain: a thin line wandering along wood from (x, y0) to (x, y1).
export const grainLine = (x, y0, y1, c, wob = 0.25, w = 0.3) => F(T(tube([[x, y0], [x + wob, y0 + (y1 - y0) * 0.35], [x - wob, y0 + (y1 - y0) * 0.7], [x, y1]], w, w * 0.7), c));

// ---------- The bow's shape ----------
// Every tier's bow keeps the sample recurve's shape exactly (render/weapon-designs.js `bow`): short
// enough that drawn upright behind her (render/hero.js `bowUp`) its top tip stays hidden behind her
// head, with its foot clear of the ground.
export const BOW_H = 14;
export const BOW_DEEP = 0.86;
export function bowX(u) {
  const a = Math.abs(u);
  if (a <= 0.2) return 1.6 - 0.6 * (a / 0.2) ** 2;
  if (a <= BOW_DEEP) return 1 - 4.6 * ((a - 0.2) / (BOW_DEEP - 0.2)) ** 1.5;
  return -3.6 + 0.9 * ((a - BOW_DEEP) / (1 - BOW_DEEP)) ** 1.6;
}
export const bowW = (u) => {
  const a = Math.abs(u);
  return a <= 0.3 ? 3 + 1.8 * (1 - (a / 0.3) ** 2) ** 1.5 : 3 - 1.4 * ((a - 0.3) / 0.7);
};
// The limb as one polygon from u0 to u1: `side` 0 the whole width, -1 a strip `k` of its width down
// its back (the string side), +1 down its face.
export function bowLimb(u0, u1, side = 0, k = 0.5, n = 24) {
  const l = [];
  const r = [];
  for (let i = 0; i <= n; i++) {
    const u = u0 + ((u1 - u0) * i) / n;
    const x = bowX(u);
    const w = bowW(u) / 2;
    const y = u * BOW_H;
    if (side === 0) {
      l.push([x - w, y]);
      r.push([x + w, y]);
    } else {
      const edge = x + side * w;
      l.push([edge - side * w * 2 * k, y]);
      r.push([edge, y]);
    }
  }
  return [...l, ...r.reverse()];
}
// A point on the limb's middle line at u.
export const bowAt = (u) => [bowX(u), u * BOW_H];
// The resting string (drawn live instead while she draws: render/hero.js drawString, 1 px back).
export function bowString(color) {
  const deep = bowX(BOW_DEEP);
  const sh = BOW_DEEP * BOW_H;
  return { shape: { ...R(deep - 1 / 1.3 - 0.4, -sh, 0.8, sh * 2, color), string: true }, anchor: { x: deep, h: sh, color } };
}

// ---------- The crossbow's shape ----------
// Every tier's crossbow keeps the sample's: held at the hip, the tiller level with the hand, a
// stock behind that swoops down, a prod across the front at XB.px, the nut on top.
export const XB = { cy: 1, px: 13, S: 7.4, nut: [1.8, -1.1] };
export const xbProdX = (u) => XB.px + 1.3 - 2.6 * Math.abs(u) ** 1.5 + 1.1 * Math.max(0, (Math.abs(u) - 0.8) / 0.2) ** 1.6;
// The prod as one polygon: `side` 0 the whole width, -1 a strip down its back, +1 down its face.
export function xbProd(side = 0, k = 0.5, wide = 2.4) {
  const { cy, S } = XB;
  const l = [];
  const r = [];
  for (let i = 0; i <= 20; i++) {
    const u = -1 + i / 10;
    const w = (wide - Math.abs(u)) / 2;
    const x = xbProdX(u);
    if (side === 0) {
      l.push([x - w, cy + u * S]);
      r.push([x + w, cy + u * S]);
    } else {
      const e = x + side * w;
      l.push([e - side * w * 2 * k, cy + u * S]);
      r.push([e, cy + u * S]);
    }
  }
  return [...l, ...r.reverse()];
}
// The stock's outline (the tiller and the shoulder stock swooping down behind).
export const XB_STOCK = [[-9.4, 0 - 0.3], [12, -0.9], [12, 2.5], [2.4, 2.7], [-2.4, 2.7], [-5, 3.8], [-8.4, 6], [-9.8, 5.6]];
// The two runs of string from the prod's tips back to the nut.
export const xbStrings = (color) => [-1, 1].map((sd) => T(tube([[xbProdX(sd), XB.cy + sd * XB.S], XB.nut], 0.75), color));
