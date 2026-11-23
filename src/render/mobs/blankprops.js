// Plain weapons for the blank bases (2026-11-22, the player: "attacks for common weapons, common
// attacks and punches and other martial arts, guns etc"): one plain, game-ready prop per kind, sized
// to the body holding it (`H`, its height) and to its hand (`r`, the hand's radius), so the same
// sword is a short blade for a kid and a long one for a queen. A character built on a base swaps in
// its own weapon drawing with the same grip and tip.
//
// Each is drawn about its grip, the middle of the fist holding it, in the hand's own frame with the
// arm hanging down: x across the fist (the way a blade sticks out of it: forward, with the arm
// down), y down the forearm (toward the fingers). So with the arm held straight out in front, a
// sword (along x) points up and a pistol's barrel (along y) points ahead; a move turns the grip
// (the `gN` channel) from there.
//
//   sword   a guard, a grip and pommel, a pointed blade with a light edge and a fuller
//   dagger  the same, short
//   spear   a long shaft held a third of the way up, a leaf-shaped head on a gold collar
//   axe     a hafted axe, its curved edge on the side it swings toward
//   hammer  an iron war hammer, its striking face on the side it swings toward
//   staff   a wooden staff with a lilac crystal held in a curl at the top
//   bow     a short bow held at its middle, its string toward the archer; drawn, the limbs bend,
//           the string is pulled back to the nock and an arrow lies along the arm
//   arrow   an arrow on its own, for the shot in flight
//   pistol  a small pistol, the barrel along the forearm above the fist
//   rifle   a long gun, the stock back along the forearm, the barrel far ahead
//   ball    a round ball for throwing
//
// Every builder gives { shapes, tip, mid } (and `muzzle` for the guns, `nock` for the bow): tip
// and mid are where a swing's trail is drawn from.

import { E, T, F } from './kit.js';
import { band, curve, blob, mapShape } from './kidbase.js';
import { sprite } from '../pixel.js';

const STEEL = { lt: '#f6f8fd', c: '#d4dae8', sh: '#a0a9bf', deep: '#7e879e' };
const WOOD = { lt: '#e0b285', c: '#b67f52', sh: '#8a5a3b' };
const GOLD = { lt: '#fff2b8', c: '#f1c860', sh: '#c9963c' };
const IRON = { lt: '#a6aec4', c: '#6f7790', sh: '#4c536a' };
const GRIP = '#704c3e';
const GUN = { lt: '#9aa1b8', c: '#5e6479', sh: '#41465a' };
const GEM = { lt: '#ffffff', c: '#d2b4ff', sh: '#9f7fe0' };
const STRING = '#f7f0e2';
const FLETCH = '#ff9fc0';
const BALL = { lt: '#ffffff', c: '#ffb3c8', sh: '#ef86a6', stripe: '#fff3a8' };

export const WEAPONS = ['sword', 'dagger', 'spear', 'axe', 'hammer', 'staff', 'bow', 'pistol', 'rifle', 'ball'];
// Two hands on it (the far hand comes across to hold it too).
export const TWO_HANDED = new Set(['spear', 'staff', 'rifle']);

const rect = (x0, y0, x1, y1, c) => T([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], c);

// A blade along x from `b0` to its point at `L`, `w` wide: a light edge on the near half, a fuller.
function blade(b0, L, w, out) {
  out.push(T([[b0, -w / 2], [L - w * 1.3, -w / 2], [L, 0], [L - w * 1.3, w / 2], [b0, w / 2]], STEEL.c));
  out.push(F(T([[b0, -w / 2], [L - w * 1.3, -w / 2], [L, 0], [b0, -w * 0.06]], STEEL.lt)));
  out.push(...band([[b0 + w * 0.6, w * 0.1], [b0 + (L - b0) * 0.72, w * 0.08]], w * 0.2, w * 0.12, STEEL.sh, true));
}

const BUILD = {
  sword(H, r) {
    const L = H * 0.46;
    const w = Math.max(r * 0.95, H * 0.052);
    const g0 = r * 1.15;
    const out = [E(-r * 1.4, 0, r * 0.5, r * 0.5, GOLD.c), ...band([[-r * 1.3, 0], [g0, 0]], r * 0.64, r * 0.64, GRIP)];
    blade(g0 + r * 0.2, L, w, out);
    out.push(rect(g0 - r * 0.3, -w * 1.5, g0 + r * 0.3, w * 1.5, GOLD.c), F(rect(g0 - r * 0.3, -w * 1.5, g0 + r * 0.3, -w * 0.2, GOLD.lt)), F(E(g0, 0, r * 0.26, r * 0.26, GOLD.sh)));
    return { shapes: out, tip: [L, 0], mid: [L * 0.55, 0] };
  },
  dagger(H, r) {
    const L = H * 0.27 + r;
    const w = Math.max(r * 0.8, H * 0.044);
    const g0 = r * 1.05;
    const out = [E(-r * 1.2, 0, r * 0.42, r * 0.42, GOLD.c), ...band([[-r * 1.1, 0], [g0, 0]], r * 0.56, r * 0.56, GRIP)];
    blade(g0 + r * 0.15, L, w, out);
    out.push(rect(g0 - r * 0.24, -w * 1.25, g0 + r * 0.24, w * 1.25, GOLD.c), F(rect(g0 - r * 0.24, -w * 1.25, g0 + r * 0.24, -w * 0.2, GOLD.lt)));
    return { shapes: out, tip: [L, 0], mid: [L * 0.6, 0] };
  },
  spear(H, r) {
    const L = H * 1.02;
    const sw = Math.max(r * 0.5, H * 0.03);
    const butt = -L * 0.36;
    const hb = L * 0.64;
    const hl = L * 0.18;
    const hw = Math.max(sw * 2.8, r * 1.5);
    const out = [...band([[butt, 0], [hb, 0]], sw, sw, WOOD.c), ...band([[butt + sw, -sw * 0.22], [hb - sw, -sw * 0.22]], sw * 0.34, sw * 0.34, WOOD.lt, true), E(butt, 0, sw * 0.72, sw * 0.72, STEEL.sh)];
    out.push(blob([[hb + r * 0.3, 0], [hb + hl * 0.38, -hw / 2], [hb + hl, 0], [hb + hl * 0.38, hw / 2]], STEEL.c, 2));
    out.push(F(blob([[hb + r * 0.4, -hw * 0.05], [hb + hl * 0.38, -hw / 2 + 0.3], [hb + hl - 0.4, 0]], STEEL.lt, 2)), ...band([[hb + r * 0.5, 0], [hb + hl * 0.8, 0]], sw * 0.3, sw * 0.2, STEEL.sh, true));
    out.push(rect(hb - r * 0.5, -sw * 0.85, hb + r * 0.4, sw * 0.85, GOLD.c), F(rect(hb - r * 0.5, -sw * 0.85, hb + r * 0.4, -sw * 0.2, GOLD.lt)));
    return { shapes: out, tip: [hb + hl, 0], mid: [hb, 0] };
  },
  axe(H, r) {
    const L = H * 0.56;
    const sw = Math.max(r * 0.58, H * 0.034);
    const out = [...band([[-L * 0.1, 0], [L, 0]], sw, sw * 0.9, WOOD.c), ...band([[-L * 0.06, -sw * 0.22], [L * 0.7, -sw * 0.22]], sw * 0.3, sw * 0.3, WOOD.lt, true), E(-L * 0.1, 0, sw * 0.62, sw * 0.62, WOOD.sh)];
    const e = r * 3.1;
    out.push(blob([[L * 0.76, -sw * 0.55], [L * 0.95, -sw * 0.55], [L * 0.95, r * 0.9], [L * 1.08, r * 2.1], [L * 1.06, e], [L * 0.86, e + r * 0.35], [L * 0.66, e], [L * 0.63, r * 2.1], [L * 0.76, r * 0.9]], STEEL.c, 2));
    out.push(...band(curve([[L * 1.05, r * 2.5], [L * 0.86, e + r * 0.1], [L * 0.67, r * 2.6]], 3), r * 0.5, r * 0.5, STEEL.lt, true));
    out.push(blob([[L * 0.78, -sw * 0.5], [L * 0.93, -sw * 0.5], [L * 0.9, -r * 1.2], [L * 0.81, -r * 1.2]], STEEL.sh, 1));
    return { shapes: out, tip: [L * 0.86, e], mid: [L * 0.55, r * 1.2] };
  },
  hammer(H, r) {
    const L = H * 0.56;
    const sw = Math.max(r * 0.58, H * 0.034);
    const hx = L * 0.9;
    const hw = Math.max(r * 1.5, H * 0.078);
    const hh = Math.max(r * 2.1, H * 0.115);
    const out = [...band([[-L * 0.1, 0], [hx, 0]], sw, sw * 0.9, WOOD.c), ...band([[-L * 0.06, -sw * 0.22], [hx - hw, -sw * 0.22]], sw * 0.3, sw * 0.3, WOOD.lt, true), E(-L * 0.1, 0, sw * 0.62, sw * 0.62, WOOD.sh)];
    out.push(blob([[hx - hw, -hh * 0.82], [hx + hw, -hh * 0.82], [hx + hw * 1.08, -hh * 0.6], [hx + hw * 1.08, hh * 0.9], [hx - hw * 1.08, hh * 0.9], [hx - hw * 1.08, -hh * 0.6]], IRON.c, 1));
    out.push(F(rect(hx - hw * 0.9, -hh * 0.74, hx + hw * 0.9, -hh * 0.4, IRON.lt)), F(rect(hx - hw * 1.08, hh * 0.62, hx + hw * 1.08, hh * 0.9, IRON.sh)), rect(hx - hw * 1.1, -hh * 0.1, hx + hw * 1.1, hh * 0.14, GOLD.c));
    return { shapes: out, tip: [hx, hh * 0.9], mid: [hx * 0.6, 0] };
  },
  staff(H, r) {
    const L = H * 0.95;
    const sw = Math.max(r * 0.55, H * 0.032);
    const top = L * 0.5;
    const gr = Math.max(r * 1.05, H * 0.055);
    const gx = top + gr * 1.5;
    const out = [...band([[-L * 0.42, 0], [top, 0]], sw * 0.9, sw, WOOD.c), ...band([[-L * 0.38, -sw * 0.22], [top - sw, -sw * 0.22]], sw * 0.3, sw * 0.3, WOOD.lt, true), E(-L * 0.42, 0, sw * 0.6, sw * 0.6, WOOD.sh)];
    // (A curl of the wood round the crystal.)
    out.push(...band(curve([[top, 0], [top + gr * 0.8, gr * 1.3], [gx + gr * 1.2, gr * 0.9], [gx + gr * 1.5, -gr * 0.4], [gx + gr * 0.8, -gr * 1.4]], 4), sw, sw * 0.6, WOOD.c));
    out.push(E(gx, 0, gr, gr * 1.15, GEM.c), F(E(gx - gr * 0.25, -gr * 0.3, gr * 0.42, gr * 0.5, GEM.lt)), F(E(gx + gr * 0.3, gr * 0.4, gr * 0.4, gr * 0.36, GEM.sh)));
    return { shapes: out, tip: [gx, 0], mid: [top, 0] };
  },
  bow(H, r, D, drawn) {
    const L = H * 0.6;
    const th = Math.max(r * 0.5, H * 0.03);
    const bend = drawn ? 0.24 : 0.16;
    const span = drawn ? 0.46 : 0.5;
    const tipA = [-L * span, -L * bend];
    const tipB = [L * span, -L * bend];
    const up = curve([tipA, [-L * 0.3, -L * 0.03], [0, 0]], 4);
    const dn = curve([[0, 0], [L * 0.3, -L * 0.03], tipB], 4);
    const nock = drawn ? [0, -D] : [0, -L * bend];
    const out = [];
    // The string first, under the bow; drawn, an arrow along the arm from the nock.
    out.push(...band([tipA, nock], th * 0.24, th * 0.24, STRING), ...band([nock, tipB], th * 0.24, th * 0.24, STRING));
    out.push(...band(up, th * 0.55, th * 1.2, WOOD.c), ...band(dn, th * 1.2, th * 0.55, WOOD.c), ...band(curve([[-L * span * 0.9, -L * bend * 0.8], [-L * 0.3, -L * 0.035 - th * 0.3], [0, -th * 0.3]], 3), th * 0.3, th * 0.4, WOOD.lt, true));
    out.push(...band([[-r * 1.1, 0], [r * 1.1, 0]], th * 1.5, th * 1.5, GRIP), E(tipA[0], tipA[1], th * 0.5, th * 0.5, GOLD.c), E(tipB[0], tipB[1], th * 0.5, th * 0.5, GOLD.c));
    if (drawn) out.push(...arrowShapes(H, r, -D, r * 2.8));
    return { shapes: out, tip: [0, r * 2.8], mid: [0, 0], nock };
  },
  arrow(H, r) {
    const len = Math.max(H * 0.42, r * 8);
    return { shapes: arrowShapes(H, r, -len, 0), tip: [0, 0], mid: [0, -len / 2] };
  },
  pistol(H, r0) {
    // (A gun sized to the body more than the hand: a chibi's mitten would hold a toy.)
    const r = Math.max(r0 * 1.35, H * 0.05);
    const out = [];
    out.push(T([[r * 0.42, -r * 0.55], [r * 0.42, r * 0.38], [-r * 0.62, r * 0.18], [-r * 0.74, -r * 0.72]], GRIP), F(T([[r * 0.2, -r * 0.4], [r * 0.2, r * 0.1], [-r * 0.4, -r * 0.05], [-r * 0.5, -r * 0.5]], '#8d6656')));
    out.push(rect(r * 0.34, -r * 0.8, r * 1.3, r * 2.5, GUN.c), F(rect(r * 1.02, -r * 0.8, r * 1.3, r * 2.5, GUN.lt)), rect(r * 0.62, r * 2.4, r * 1.02, r * 2.9, GUN.sh));
    out.push(...band(curve([[r * 0.34, r * 0.2], [-r * 0.15, r * 0.6], [r * 0.34, r * 1.0]], 2), r * 0.18, r * 0.18, GUN.sh));
    return { shapes: out, tip: [r * 0.82, r * 2.9], mid: [r * 0.82, r], muzzle: [r * 0.82, r * 2.9] };
  },
  rifle(H, r0) {
    const r = Math.max(r0 * 1.2, H * 0.042);
    const len = Math.max(H * 0.66, r * 9);
    const out = [];
    out.push(blob([[r * 1.25, -r * 1.2], [r * 1.25, -len * 0.42], [-r * 0.9, -len * 0.4], [-r * 0.5, -r * 2], [r * 0.3, -r * 1.2]], WOOD.c, 1), F(blob([[r * 1.25, -r * 1.4], [r * 1.25, -len * 0.4], [r * 0.6, -len * 0.4], [r * 0.7, -r * 1.4]], WOOD.lt, 1)));
    out.push(T([[r * 0.42, -r * 0.5], [r * 0.42, r * 0.4], [-r * 0.6, r * 0.2], [-r * 0.72, -r * 0.7]], WOOD.sh));
    out.push(rect(r * 0.3, -r * 1.4, r * 1.45, r * 2.6, GUN.c), F(rect(r * 1.12, -r * 1.4, r * 1.45, r * 2.6, GUN.lt)));
    out.push(blob([[r * 0.35, r * 2.4], [r * 1.3, r * 2.4], [r * 1.3, len * 0.42], [r * 0.25, len * 0.4]], WOOD.c, 1));
    out.push(rect(r * 0.78, r * 2.4, r * 1.2, len * 0.62, GUN.sh), F(rect(r * 1.02, r * 2.4, r * 1.2, len * 0.62, GUN.lt)), rect(r * 0.66, len * 0.6, r * 1.3, len * 0.64, GUN.c));
    out.push(...band(curve([[r * 0.3, r * 0.2], [-r * 0.2, r * 0.6], [r * 0.3, r * 1.0]], 2), r * 0.18, r * 0.18, GUN.sh));
    return { shapes: out, tip: [r, len * 0.64], mid: [r, len * 0.3], muzzle: [r, len * 0.64] };
  },
  ball(H, r) {
    const br = Math.max(r * 1.05, H * 0.05);
    const out = [E(r * 0.1, r * 0.6, br, br, BALL.c), F(E(r * 0.1, r * 0.6, br * 0.98, br * 0.3, BALL.stripe)), F(E(r * 0.1 - br * 0.35, r * 0.6 - br * 0.4, br * 0.32, br * 0.26, BALL.lt)), F(E(r * 0.1 + br * 0.3, r * 0.6 + br * 0.5, br * 0.5, br * 0.24, BALL.sh))];
    return { shapes: out, tip: [r * 0.1, r * 0.6], mid: [r * 0.1, r * 0.6] };
  },
};

// An arrow along y, its nock at `n` and its point at `p` (p > n): shaft, a steel head, pink fletching.
function arrowShapes(H, r, n, p) {
  const sw = Math.max(r * 0.26, H * 0.016);
  const hl = Math.max(r * 1.2, H * 0.06);
  return [
    ...band([[0, n], [0, p - hl * 0.6]], sw, sw, WOOD.lt),
    T([[0, n + hl * 1.6], [-hl * 0.55, n - hl * 0.1], [-hl * 0.3, n + hl * 1.9]], FLETCH),
    T([[0, n + hl * 1.6], [hl * 0.55, n - hl * 0.1], [hl * 0.3, n + hl * 1.9]], FLETCH),
    T([[0, p], [-hl * 0.42, p - hl], [hl * 0.42, p - hl]], STEEL.c),
    F(T([[0, p], [-hl * 0.42, p - hl], [0, p - hl * 0.7]], STEEL.lt)),
  ];
}

// A weapon's drawing, measured: its shapes and where its grip, tip, mid and muzzle are, for a body
// `H` tall with hands `r` across (kid-box units), and `D` its draw length (the bow).
export function weaponOf(kind, H, r, D = H * 0.3, drawn = false) {
  const w = BUILD[kind](H, r, D, drawn);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const sh of w.shapes) {
    const ext = (sh.rx ?? 0) + (sh.ry ?? 0);
    mapShape(sh, ([x, y]) => {
      x0 = Math.min(x0, x - ext);
      y0 = Math.min(y0, y - ext);
      x1 = Math.max(x1, x + ext);
      y1 = Math.max(y1, y + ext);
      return [x, y];
    }, 1);
  }
  return { ...w, box: [x0 - 2, y0 - 2, x1 + 2, y1 + 2] };
}

// Its sprite at a kit's scale `SC` (game px a kid-box unit), the grip at `pivot` in it.
export function weaponSprite(key, w, SC, bare) {
  const [x0, y0, x1, y1] = w.box;
  const W = Math.ceil((x1 - x0) * SC);
  const Hh = Math.ceil((y1 - y0) * SC);
  const s = sprite(`rig|blankprop|${key}|flat${bare ? '|bare' : ''}`, () => ({ w: W, h: Hh, shapes: w.shapes.map((sh) => mapShape(sh, ([x, y]) => [(x - x0) * SC, (y - y0) * SC], SC)), res: 3, crisp: true, bare: Boolean(bare), pad: 4 }));
  return s;
}
// Where a point of the weapon's own drawing (grip at 0, 0) sits in its sprite.
export const inSprite = (w, [x, y], SC) => [(x - w.box[0]) * SC, (y - w.box[1]) * SC];
