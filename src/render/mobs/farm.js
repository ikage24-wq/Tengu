// Monster art: Clover Hills' farm (the player's picks, 2026-11-01).
//   macgoblin  Old MacGoblin, the Pumpkin Goblins' farmer chief and Clover Hills' area boss,
//              redrawn 2026-11-19 as the Pumpkin-Hat Farmer: his rig is in macgoblinrig.js.
//   brownie    (Now the Chickling, render/mobs/chickrig.js: these old Kitchen Brownie frames are unused.)
// Faces use the simple eyes and mouths (faces.js). Faces right; see kit.js for the shapes.

import { macGoblinRig, macGoblinStill } from './macgoblinrig.js';
import { E, T, F, mix, shade, stroke } from './kit.js';
import { simpleEye, simpleMouth, deadEye, sweat, vein } from './faces.js';
import { ramp, crescent, shine, smear, breath, sway, chain, wave } from './meadow.js';
import { part, makeRig, stateBlend, inPart } from './rig.js';

const TAU = Math.PI * 2;
const D2R = Math.PI / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const shift = (shapes, dx, dy) => shapes.map((s) => s && (s.t === 'p' ? { ...s, pts: s.pts.map(([x, y]) => [x + dx, y + dy]) } : { ...s, x: s.x + dx, y: s.y + dy }));
function O(cx, cy, rx, ry, deg, c, n = 18) {
  const a = deg * D2R;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    const x = Math.cos(t) * rx;
    const y = Math.sin(t) * ry;
    pts.push([cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]);
  }
  return T(pts, c);
}
function star(x, y, r, c, core = '#ffffff') {
  const k = r * 0.28;
  return [F(T([[x, y - r], [x + k, y - k], [x + r, y], [x + k, y + k], [x, y + r], [x - k, y + k], [x - r, y], [x - k, y - k]], c)), F(E(x, y, k * 0.9, k * 0.9, core))];
}

const SK = ramp('#a8da8c', { step: 10, turn: 16, sat: -6 });
const DENIM = ramp('#5b86c8', { step: 10, turn: 10 });
const STRAW = ramp('#f0cf86', { step: 10, turn: 12, sat: -6 });
const CAP = ramp('#ff7072', { step: 11, turn: 14, sat: -8 });
const WHITE = ramp('#f6f2ea', { step: 7, turn: 30 });
const BOOT = ramp('#8a5a3c', { step: 9, turn: 10 });
const WOOD = ramp('#cf9c66', { step: 11, turn: 12, sat: -12 });
const STEEL = ['#eef2f8', '#b8c2d4', '#7a849a'];

// ---------- Kitchen Brownie ----------
// A tiny house spirit from the old stories: a round little fellow in a brown hooded cloak with
// long ears poking out, a patched apron and a broom twice his size. He sweeps as he goes, and
// whacks you with the broom (a puff of dust) when his chores are interrupted.

const CLOAK = ramp('#9a6a4a', { step: 10, turn: 12 });
const BSKIN = ramp('#ffd8b8', { step: 7, turn: 30 });
const APRON = ramp('#f6efe0', { step: 6, turn: 30 });
const BRISTLE = ramp('#e8c070', { step: 9, turn: 12 });

const BROWNIE_ATK = [
  { broom: -150, lean: -8 },
  { broom: 30, lean: 12 },
  { broom: 50, lean: 14 },
  { broom: 0, lean: 2 },
];

function brownie(pose, f, mood) {
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? BROWNIE_ATK[f] : null;
  const q = walk ? f / 8 : idle ? f / 6 : 0;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const out = [];
  const bob = walk ? Math.abs(Math.sin(TAU * q * 2)) * 2.8 : idle ? breath(q) * 1.4 : 0;
  const x0 = 18 + (hurt ? -1.4 : 0);
  const gy = 40;
  const lean = dead ? 80 : A ? A.lean : hurt ? -12 : walk ? 4 + 7 * Math.sin(TAU * q * 2) : 6 * Math.sin(TAU * q - 0.3);
  const body = [];
  // Little boots pattering under the cloak.
  for (const [dx, ph] of [[-3, 0], [3, 0.5]]) {
    const step = walk ? Math.sin(TAU * (q + ph)) * 2.4 : 0;
    body.push(E(x0 + dx + step, gy - 1.2, 2.6, 1.6, CLOAK.deep));
  }
  // The cloak: a round brown bell, the apron over its front.
  const cy = gy - 8 - bob;
  body.push(O(x0, cy, 6.6, 7, 0, CLOAK.base, 18), crescent(x0, cy, 6.6, 7, CLOAK.sh, { k: 0.3, a0: 50, a1: 230 }));
  body.push(T([[x0 + 0.6, cy - 3], [x0 + 5.6, cy - 3], [x0 + 6.2, cy + 6], [x0 + 0.4, cy + 6.4]], APRON.base), F(T([[x0 + 2.4, cy + 1], [x0 + 5, cy + 1], [x0 + 5, cy + 3.6], [x0 + 2.4, cy + 3.6]], APRON.sh)));
  out.push(...rotate(body, x0, gy, lean * 0.5));
  // The broom: sweeping side to side at rest and walking, raised high and brought down to attack.
  const ba = A ? A.broom : walk ? 15 + 24 * Math.sin(TAU * q * 2 - 0.5) : 20 + 30 * Math.sin(TAU * q - 0.4);
  const hand = [x0 + 10, cy - 2];
  const d = [Math.sin(ba * D2R), Math.cos(ba * D2R)];
  const top = [hand[0] - d[0] * 8, hand[1] - d[1] * 8];
  const foot = [hand[0] + d[0] * 13, hand[1] + d[1] * 13];
  const broom = [...stroke([top, foot], 1.4, WOOD.base, false)];
  const n = [Math.cos(ba * D2R), -Math.sin(ba * D2R)];
  broom.push(T([[foot[0] - n[0] * 2, foot[1] - n[1] * 2], [foot[0] + n[0] * 2, foot[1] + n[1] * 2], [foot[0] + n[0] * 4 + d[0] * 7, foot[1] + n[1] * 4 + d[1] * 7], [foot[0] - n[0] * 4 + d[0] * 7, foot[1] - n[1] * 4 + d[1] * 7]], BRISTLE.base));
  for (const k of [-2.4, 0, 2.4]) broom.push(...stroke([[foot[0] + n[0] * k * 0.5, foot[1] + n[1] * k * 0.5], [foot[0] + n[0] * k + d[0] * 6.6, foot[1] + n[1] * k + d[1] * 6.6]], 0.4, BRISTLE.sh));
  broom.push(...stroke([[foot[0] - n[0] * 2.2, foot[1] - n[1] * 2.2 + 0.6], [foot[0] + n[0] * 2.2, foot[1] + n[1] * 2.2 + 0.6]], 0.8, '#d0504a'));
  out.push(...broom, E(hand[0], hand[1], 1.6, 1.6, BSKIN.base));
  // The head: a round face in the hood, long ears poking out of it, a button nose, simple eyes.
  const hx = x0 + 1.4;
  const hy = cy - 11 + (walk ? -bob * 0.5 : 0);
  const head = [];
  const ear = (s, c) => T([[hx + s * 4, hy - 2], [hx + s * 14, hy - 5 + (hurt || dead ? 4 : 0) + (idle ? Math.sin(TAU * q - 1) * 2.6 : walk ? Math.sin(TAU * q * 2 - 1.8) * 3.2 : 0)], [hx + s * 4, hy + 2]], c);
  head.push(ear(-1, BSKIN.sh), O(hx, hy - 1, 9.6, 9.2, 0, CLOAK.base, 18), crescent(hx, hy - 1, 9.6, 9.2, CLOAK.sh, { k: 0.3, a0: 90, a1: 230 }));
  head.push(E(hx + 1.6, hy + 0.8, 7, 6.4, BSKIN.base), crescent(hx + 1.6, hy + 0.8, 7, 6.4, BSKIN.sh, { k: 0.3, a0: 100, a1: 220 }), ear(1, BSKIN.base));
  head.push(T([[hx - 7, hy - 7], [hx - 1, hy - 13], [hx + 4, hy - 8]], CLOAK.base));
  const em = dead ? 'dead' : hurt ? 'hurt' : mood === 'angry' || A ? 'angry' : mood === 'happy' ? 'happy' : mood === 'blink' ? 'blink' : 'idle';
  if (dead) head.push(...deadEye(hx, hy, 1.3, { type: 'swirl', s: -1, c: '#3a2a2a' }), ...deadEye(hx + 3.6, hy, 1.4, { type: 'swirl', c: '#3a2a2a' }));
  else head.push(...simpleEye(hx - 0.4, hy, { s: -1, w: 1.6, h: 2, mood: em, iris: '#7a4a2a', ink: '#2a1a1a' }), ...simpleEye(hx + 4.4, hy - 0.1, { s: 1, w: 1.9, h: 2.3, mood: em, iris: '#7a4a2a', ink: '#2a1a1a' }));
  head.push(E(hx + 4.6, hy + 2, 1.2, 1, BSKIN.sh), F(E(hx - 0.6, hy + 2.4, 1, 0.6, '#ffb3c6')), F(E(hx + 5, hy + 2.8, 1, 0.6, '#ffb3c6')));
  head.push(...simpleMouth(hx + 2, hy + 3.6, { k: 0.8, mood: dead ? 'dead' : A && f < 3 ? 'shout' : em === 'angry' ? 'angry' : em, lip: '#8a3550' }));
  out.push(...rotate(head, x0, gy, lean * 0.6));
  if (A && f === 1) out.push(smear([[x0 + 2, cy - 18], [x0 + 12, cy - 10], [x0 + 16, cy + 6]], 3, '#fff2c0'));
  if (A && f === 2) for (const k of [-4, 0, 4]) out.push(E(x0 + 18 + k, gy - 1 - Math.abs(k) * 0.3, 2.6, 1.6, '#f3e6d6'));
  return { w: 40, h: 46, res: 3, shapes: shift(out, 2, 4) };
}

// Turns shapes about (cx, cy) by deg.
function rotate(shapes, cx, cy, deg) {
  if (!deg) return shapes;
  const c = Math.cos(deg * D2R);
  const s = Math.sin(deg * D2R);
  const r = (x, y) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
  return shapes.map((sh) => {
    if (!sh) return sh;
    if (sh.t === 'p') return { ...sh, x: 0, y: 0, pts: sh.pts.map(([px, py]) => r(sh.x + px, sh.y + py)) };
    const [x, y] = sh.t === 'e' ? r(sh.x, sh.y) : r(sh.x + sh.w / 2, sh.y + sh.h / 2);
    return sh.t === 'e' ? { ...sh, x, y } : { ...sh, x: x - sh.w / 2, y: y - sh.h / 2 };
  });
}

export const ART = {
  macgoblin: { walk: 8, idle: 6, attack: 5, stride: 26, atkMs: [120, 460, 220, 260], draw: macGoblinStill, rig: macGoblinRig },
  brownie: { walk: 8, idle: 6, attack: 4, stride: 16, atkMs: [70, 260, 200], draw: brownie },
};

export const INFO = {
  macgoblin: { name: 'Old MacGoblin', w: 70, h: 84 },
  brownie: { name: 'Chickling', w: 22, h: 26 },
};
