// Monster art: the Tanuki Tea Terraces (the player's pick, 2026-11-10).
//   tanukipicker  Tanuki Picker: a round, sly tanuki in a tea-picker's cone hat with a shapeshifting
//                 leaf tucked in its band, a wicker basket of tea on its back and a pair of tea
//                 shears it snips you with. Signature: the dark bandit mask round its eyes and the
//                 leaf, which flutters loose when it's hurt.
//   kettletanuki  Kettle Tanuki: a tanuki halfway through turning into an iron tea kettle (the old
//                 story of the kettle that grew legs), head, paws and striped tail poking out of a
//                 cast-iron pot. Signature: its lid rattles as it winds up, then it blasts steam out
//                 of the spout.
// Faces use the simple eyes and mouths (faces.js). Faces right; see kit.js for the shapes.

//   lantertanuki  Lantern Tanuki: a tanuki pretending to be a paper lantern in the Mist Hollow at
//                 night, its face peeking through the paper, little legs underneath. Signature: the
//                 candle inside flares up and it coughs out a puff of lantern flame.
//   grandkettle   The Grand Kettle, the terraces' area boss: the oldest tanuki of all, so round and
//                 so long a kettle that he IS one, a giant iron pot with his belly, head and a
//                 bamboo tea ladle sticking out of it. Signature: his lid rattles louder and louder
//                 as he winds up, then he slams the ladle down in a burst of steam.

import { E, T, F, stroke, mix } from './kit.js';
import { simpleEye, simpleMouth, deadEye, sweat, vein } from './faces.js';
import { ramp, crescent, smear, sway, shine } from './meadow.js';
import { part, makeRig, stateBlend } from './rig.js';

const TAU = Math.PI * 2;
const D2R = Math.PI / 180;
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
// An ease for every pose change (no linear motion in bodies).
const ease = (t) => t * t * (3 - 2 * t);

const FUR = ramp('#a07a5a', { step: 10, turn: 14, sat: -4 });
const DARK = ramp('#4e3a34', { step: 8, turn: 10 });
const CREAM = ramp('#f2e2c6', { step: 8, turn: 26, sat: -6 });
const STRAW = ramp('#e6c27a', { step: 10, turn: 12, sat: -8 });
const WICKER = ramp('#c08a52', { step: 10, turn: 12, sat: -6 });
const LEAF = ramp('#7cc46a', { step: 11, turn: 16 });
const TEA = ramp('#5aa85a', { step: 10, turn: 14 });
const STEEL = ['#eef2f8', '#b8c2d4', '#7a849a'];
const IRON = ramp('#4a5262', { step: 9, turn: 12, sat: -4 });
const RIBBON = '#d0504a';
const STEAM = '#ffffff';

// The tanuki face both share: a round head, round ears with dark insides, the bandit mask, a cream
// muzzle and a button nose. hx, hy: head centre; k: size; em: the eye mood; m: the mouth mood.
function tanukiHead(hx, hy, k, em, m, { dead = false, ear = 0 } = {}) {
  const o = [];
  // Ears: round, the far one a little lower, the near one flicking with `ear`.
  for (const [ex, ey, s, a] of [[hx - 4.6 * k, hy - 5.2 * k, -1, -8], [hx + 3.4 * k, hy - 5.8 * k, 1, 10 + ear]]) {
    o.push(O(ex, ey, 2.6 * k, 2.4 * k, a, s < 0 ? FUR.sh : FUR.base, 12), O(ex + 0.2 * k, ey + 0.3 * k, 1.4 * k, 1.3 * k, a, DARK.base, 10));
  }
  o.push(O(hx, hy, 7 * k, 6.2 * k, 0, FUR.base, 20), crescent(hx, hy, 7 * k, 6.2 * k, FUR.sh, { k: 0.28, a0: 80, a1: 230 }));
  // The bandit mask: two dark patches sweeping down from the eyes.
  o.push(O(hx - 2.2 * k, hy + 0.2 * k, 2.7 * k, 2.1 * k, 18, DARK.base, 14), O(hx + 3.2 * k, hy + 0.1 * k, 2.9 * k, 2.2 * k, -16, DARK.base, 14));
  // Cream muzzle and brow.
  o.push(O(hx + 1.6 * k, hy + 3 * k, 3.6 * k, 2.4 * k, 0, CREAM.base, 16), O(hx + 0.4 * k, hy - 3.6 * k, 2.4 * k, 1.3 * k, 0, CREAM.hi, 12));
  o.push(E(hx + 3.6 * k, hy + 2 * k, 1.1 * k, 0.8 * k, DARK.deep));
  if (dead) o.push(...deadEye(hx - 2 * k, hy, 1.4 * k, { s: -1, c: '#f6ead6' }), ...deadEye(hx + 3.1 * k, hy, 1.6 * k, { c: '#f6ead6' }));
  else {
    // Bright eyes in the dark mask: a pale ring so they read.
    o.push(...simpleEye(hx - 2 * k, hy - 0.2 * k, { s: -1, w: 1.3 * k, h: 1.6 * k, mood: em, iris: '#3a2418', ink: '#1a1012' }));
    o.push(...simpleEye(hx + 3.1 * k, hy - 0.3 * k, { s: 1, w: 1.5 * k, h: 1.8 * k, mood: em, iris: '#3a2418', ink: '#1a1012' }));
  }
  o.push(...simpleMouth(hx + 2.4 * k, hy + 4.2 * k, { k: 0.8 * k, mood: m, smug: m === 'smug', lip: '#5a3028' }));
  return o;
}

// A striped tail, curling up behind; `wag` swings its tip (it trails the body a beat late).
function tail(x, y, k, wag, c = FUR) {
  const pts = [];
  for (let i = 0; i <= 4; i++) {
    const t = i / 4;
    pts.push([x - 5 * k * t - Math.sin(t * 2.2) * 2 * k, y - 6 * k * t * t + wag * t * t]);
  }
  const o = [];
  pts.forEach(([px, py], i) => o.push(O(px, py, (3.2 - i * 0.25) * k, (2.8 - i * 0.2) * k, 0, i % 2 ? DARK.base : c.base, 12)));
  return o;
}

// ---------- Tanuki Picker ----------

// Attack keys: shears (the near arm's reach, deg), lean, hop. Wind-up held, the snip fast.
const PICK_ATK = [
  { arm: -70, lean: -12, hop: 0, open: 1 },
  { arm: 60, lean: 16, hop: 2, open: 0.2 },
  { arm: 70, lean: 18, hop: 0, open: 0 },
  { arm: 20, lean: 6, hop: 0, open: 0.6 },
];

function tanukipicker(pose, f, mood) {
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? PICK_ATK[f] : null;
  const q = walk ? f / 8 : idle ? f / 6 : 0;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const out = [];
  const x0 = 20;
  const gy = 44;
  // A waddle: the body rolls side to side and bobs twice a loop; at rest it breathes.
  const bob = walk ? Math.abs(Math.sin(TAU * q)) * 2.2 : idle ? (Math.sin(TAU * q - 1) + 1) * 0.5 : A ? A.hop : 0;
  const lean = dead ? 84 : A ? A.lean : hurt ? -16 : walk ? 5 * Math.sin(TAU * q) : sway(q) * 2;
  const by = gy - 11 - bob;
  const body = [];
  // Legs: short dark socks, stepping on the walk, planted otherwise.
  for (const [s, ph] of [[-1, 0], [1, 0.5]]) {
    const step = walk ? Math.sin(TAU * (q + ph)) * 3.2 : 0;
    const lift = walk ? Math.max(0, Math.cos(TAU * (q + ph))) * 1.6 : 0;
    const fx = x0 + s * 3.4 + step;
    body.push(...stroke([[x0 + s * 3, by + 6], [fx, gy - 1.6 - lift]], 3, s < 0 ? DARK.sh : DARK.base, false), O(fx + 1, gy - 1 - lift, 2.4, 1.2, 0, DARK.deep, 10));
  }
  // The striped tail, trailing the body's sway a beat late.
  const wag = walk ? Math.sin(TAU * q - 1.2) * 2.6 : idle ? Math.sin(TAU * q - 1.6) * 1.8 : A ? -A.lean * 0.15 : 0;
  body.push(...tail(x0 - 7, by + 4, 1, wag));
  // The wicker basket on its back, tea leaves heaped in it.
  body.push(F(T([[x0 - 11, by - 7], [x0 - 4, by - 8], [x0 - 4.6, by + 3], [x0 - 10, by + 2.4]], WICKER.base)));
  for (let i = 0; i < 3; i++) body.push(...stroke([[x0 - 10.8, by - 4 + i * 2.6], [x0 - 4.4, by - 5 + i * 2.6]], 0.5, WICKER.sh));
  body.push(O(x0 - 7.6, by - 8.6, 3.6, 1.8, -8, TEA.base, 12), O(x0 - 9, by - 9.4, 1.6, 1, 30, TEA.hi, 8), O(x0 - 6, by - 9.8, 1.4, 0.9, -30, TEA.sh, 8));
  // The round body and cream belly.
  body.push(O(x0, by, 8.6, 8.2, 0, FUR.base, 22), crescent(x0, by, 8.6, 8.2, FUR.sh, { k: 0.28, a0: 70, a1: 240 }));
  body.push(O(x0 + 2.2, by + 1.6, 5, 5.4, 0, CREAM.base, 16), crescent(x0 + 2.2, by + 1.6, 5, 5.4, CREAM.sh, { k: 0.22, a0: 90, a1: 200 }));
  // The basket strap across the chest.
  body.push(...stroke([[x0 - 5, by - 6], [x0 + 5, by + 3]], 0.9, WICKER.sh));
  // Arms: the far one resting on the belly; the near one holding the shears.
  body.push(...stroke([[x0 - 2, by - 3], [x0 + 1.4, by + 2]], 2.4, DARK.sh, false));
  const sh2 = [x0 + 4.6, by - 3];
  const reach = A ? A.arm : walk ? 10 * Math.sin(TAU * q + 1) : idle ? 4 + 3 * Math.sin(TAU * q - 0.7) : hurt ? -40 : 10;
  const ar = reach * D2R;
  const hand = [sh2[0] + Math.sin(ar) * 6, sh2[1] + Math.cos(ar) * 6];
  const arm = [...stroke([sh2, hand], 2.6, DARK.base, false), O(hand[0], hand[1], 1.5, 1.4, 0, DARK.deep, 10)];
  // The shears: two blades pivoting at the hand, opening by `open`.
  const open = A ? A.open : 0.35;
  const dir = ar;
  for (const s of [-1, 1]) {
    const a = dir + s * open * 0.45;
    const tip = [hand[0] + Math.sin(a) * 8, hand[1] + Math.cos(a) * 8];
    arm.push(...stroke([hand, tip], 1.1, s < 0 ? STEEL[1] : STEEL[0]));
  }
  arm.push(O(hand[0] - Math.sin(dir) * 1.6, hand[1] - Math.cos(dir) * 1.6, 1.4, 1, 0, RIBBON, 8));
  out.push(...rotate([...body, ...arm], x0, gy, lean));
  // The head, nodding a beat after the body.
  const hx = x0 + 2;
  const hy = by - 11 + (walk ? Math.sin(TAU * q * 2 - 1.4) * 0.8 : idle ? Math.sin(TAU * q - 1.6) * 0.6 : 0);
  const em = dead ? 'dead' : hurt ? 'hurt' : mood === 'angry' || A ? 'angry' : mood === 'happy' ? 'happy' : mood === 'blink' ? 'blink' : 'idle';
  const mm = dead || hurt ? 'hurt' : A && f === 1 ? 'shout' : A ? 'angry' : mood === 'happy' ? 'happy' : 'smug';
  const ear = idle ? (f === 3 ? 18 : 0) : walk ? Math.sin(TAU * q * 2 - 2) * 6 : 0;
  const head = tanukiHead(hx, hy, 1, em, mm, { dead, ear });
  // The cone hat with its red band, tilted; the leaf tucked in the band (blown loose when hurt).
  const hat = [F(T([[hx - 10, hy - 4.6], [hx + 10, hy - 6.2], [hx + 0.6, hy - 13]], STRAW.base)), F(T([[hx + 0.6, hy - 13], [hx + 10, hy - 6.2], [hx + 3, hy - 6]], STRAW.sh))];
  for (let i = 1; i < 4; i++) hat.push(...stroke([[hx + 0.6, hy - 13], [hx - 10 + i * 5, hy - 5.1 - i * 0.4]], 0.4, STRAW.sh));
  hat.push(...stroke([[hx - 5.4, hy - 7.4], [hx + 5.6, hy - 8.4]], 1, RIBBON));
  if (!hurt && !dead) hat.push(O(hx + 3.4, hy - 10, 2.6, 1.2, -38, LEAF.base, 10), ...stroke([[hx + 1.6, hy - 8.6], [hx + 5, hy - 11.6]], 0.35, LEAF.sh));
  const tilt = walk ? Math.sin(TAU * q * 2 - 1.8) * 3 : idle ? Math.sin(TAU * q - 1.8) * 2 : A ? A.lean * 0.3 : 0;
  out.push(...rotate([...head, ...hat], hx, hy + 6, tilt + lean * 0.4));
  // Hurt: the leaf flutters off its hat.
  if (hurt) out.push(O(hx + 10, hy - 16, 2.6, 1.2, 30, LEAF.base, 10));
  if (hurt) out.push(...sweat(hx - 6, hy - 6, 0.8));
  if (A && f === 1) out.push(smear([[x0 + 6, by - 10], [x0 + 14, by - 6], [x0 + 20, by]], 3, '#e8fff0'));
  if (A && f === 2) for (let i = 0; i < 4; i++) out.push(O(x0 + 20 + Math.cos(i * 1.6) * 4, by - 2 + Math.sin(i * 1.6) * 3, 1.6, 0.8, i * 47, i % 2 ? TEA.hi : LEAF.base, 8));
  return { w: 46, h: 52, res: 3, shapes: shift(out, 2, 2) };
}

// ---------- Kettle Tanuki ----------

// Attack keys: rattle (the lid's jiggle), crouch, jet (steam out of the spout, 0..1).
const KETTLE_ATK = [
  { rattle: 1, crouch: 2, jet: 0 },
  { rattle: 1.6, crouch: 3, jet: 0 },
  { rattle: 0, crouch: -1, jet: 1 },
  { rattle: 0, crouch: 0, jet: 0.7 },
  { rattle: 0, crouch: 0, jet: 0.25 },
];

function kettletanuki(pose, f, mood) {
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? KETTLE_ATK[f] : null;
  const q = walk ? f / 8 : idle ? f / 6 : 0;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const out = [];
  const x0 = 22;
  const gy = 46;
  // It scuttles on four stubby legs, the heavy pot rocking; at rest the lid lifts with each breath.
  const bob = walk ? Math.abs(Math.sin(TAU * q * 2)) * 1.6 : A ? -A.crouch * 0.6 : 0;
  const rock = dead ? -90 : hurt ? -12 : walk ? 4 * Math.sin(TAU * q) : idle ? sway(q) * 1.5 : 0;
  const cy = gy - 13 - bob;
  const pot = [];
  // Legs: four little dark paws under the pot.
  [[-8, 0], [-3, 0.5], [3, 0], [8, 0.5]].forEach(([dx, ph], i) => {
    const step = walk ? Math.sin(TAU * (q * 2 + ph)) * 2 : 0;
    pot.push(...stroke([[x0 + dx, cy + 7], [x0 + dx + step, gy - 1.4]], 2.4, i % 2 ? DARK.base : DARK.sh, false), O(x0 + dx + step + 0.6, gy - 1, 1.9, 1, 0, DARK.deep, 8));
  });
  // The tail out of the back, swinging a beat late.
  const wag = walk ? Math.sin(TAU * q - 1.2) * 2.4 : idle ? Math.sin(TAU * q - 1.6) * 1.6 : 0;
  pot.push(...tail(x0 - 12, cy + 1, 0.9, wag));
  // The iron pot: a squat round body, a rim, a raised band of hobnails, a highlight from the light.
  pot.push(O(x0, cy, 13, 10, 0, IRON.base, 26), crescent(x0, cy, 13, 10, IRON.sh, { k: 0.3, a0: 60, a1: 240 }));
  for (let i = 0; i < 7; i++) pot.push(E(x0 - 9 + i * 3, cy - 3.6 + Math.abs(i - 3) * 0.3, 0.7, 0.7, IRON.hi));
  pot.push(O(x0 - 4, cy - 6, 4, 1.4, -10, IRON.hi, 12));
  // The spout, out of the front, and the bail handle arching over.
  pot.push(F(T([[x0 + 10, cy - 1], [x0 + 17, cy - 7], [x0 + 18.6, cy - 6], [x0 + 12, cy + 2]], IRON.sh)), O(x0 + 18, cy - 6.6, 1.4, 1, -40, IRON.deep, 8));
  // The lid, rattling up and down as it winds up (a held jiggle, the steam squeezing out under it).
  const rat = A ? A.rattle * (f % 2 ? 1 : -1) : idle ? (Math.sin(TAU * q - 1) + 1) * 0.4 : 0;
  const ly = cy - 9.6 - Math.abs(rat);
  const lid = [O(x0, ly, 8.4, 2.2, rat * 3, IRON.sh, 18), O(x0, ly - 1.2, 2, 1.4, 0, IRON.deep, 10)];
  pot.push(...stroke([[x0 - 10, cy - 7], [x0 - 7, cy - 17], [x0 + 7, cy - 17], [x0 + 10, cy - 7]], 1, IRON.deep));
  pot.push(...lid);
  // The tanuki front: head and two paws poking out of the pot's front.
  const hx = x0 + 6;
  const hy = cy - 1 + (walk ? Math.sin(TAU * q * 2 - 1.4) * 0.6 : 0);
  const em = dead ? 'dead' : hurt ? 'hurt' : mood === 'angry' || A ? 'angry' : mood === 'happy' ? 'happy' : mood === 'blink' ? 'blink' : 'idle';
  const mm = dead || hurt ? 'hurt' : A && f >= 2 ? 'shout' : A ? 'angry' : mood === 'happy' ? 'happy' : 'idle';
  pot.push(...stroke([[x0 + 4, cy + 4], [x0 + 9, cy + 6]], 2.2, DARK.base, false));
  pot.push(...tanukiHead(hx, hy, 0.85, em, mm, { dead, ear: walk ? Math.sin(TAU * q * 2) * 5 : 0 }));
  out.push(...rotate(pot, x0, gy, rock));
  // Steam: puffs squeezing out under the rattling lid on the wind-up, a jet out of the spout.
  if (A && A.rattle) for (let i = 0; i < 3; i++) out.push(O(x0 - 6 + i * 6, ly - 3 - i, 1.8 + i * 0.4, 1.2, 0, STEAM, 10));
  if (A && A.jet) {
    const n = Math.round(4 * A.jet) + 1;
    for (let i = 0; i < n; i++) out.push(O(x0 + 20 + i * 4.4 * ease(A.jet), cy - 7 - i * 1.6, 2 + i * 0.9, 1.4 + i * 0.6, -20, STEAM, 12));
  }
  if (idle && f === 2) out.push(O(x0 + 19, cy - 9, 1.4, 1, 0, STEAM, 8));
  return { w: 56, h: 52, res: 3, shapes: shift(out, 2, 2) };
}

// ---------- Lantern Tanuki ----------

const PAPER = ramp('#f4e4c4', { step: 8, turn: 24, sat: -4 });
const LACQ = ramp('#c8463c', { step: 10, turn: 12 });
const FLAME = ['#fff4c0', '#ffc860', '#ff8a3a'];

// Attack keys: crouch, flare (the candle swelling, 0..1), puff (the flame blown out, 0..1).
const LANTERN_ATK = [
  { crouch: 2, flare: 0.6, puff: 0 },
  { crouch: 3, flare: 1, puff: 0 },
  { crouch: -2, flare: 0.3, puff: 1 },
  { crouch: 0, flare: 0.2, puff: 0.5 },
];

function lantertanuki(pose, f, mood) {
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? LANTERN_ATK[f] : null;
  const q = walk ? f / 8 : idle ? f / 6 : 0;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const out = [];
  const x0 = 20;
  const gy = 48;
  // It hops along on stubby legs, the lantern swinging a beat behind.
  const hop = walk ? Math.abs(Math.sin(TAU * q)) * 3 : A ? -A.crouch * 0.6 : idle ? (Math.sin(TAU * q - 1) + 1) * 0.4 : 0;
  const swing = dead ? 80 : hurt ? -14 : walk ? 6 * Math.sin(TAU * q - 0.8) : idle ? sway(q) * 2.4 : 0;
  const cy = gy - 17 - hop;
  const body = [];
  for (const [s, ph] of [[-1, 0], [1, 0.5]]) {
    const st = walk ? Math.sin(TAU * (q + ph)) * 2.6 : 0;
    body.push(...stroke([[x0 + s * 3, cy + 9], [x0 + s * 3.4 + st, gy - 1.4]], 2.6, s < 0 ? DARK.sh : DARK.base, false), O(x0 + s * 3.4 + st + 0.8, gy - 1, 2, 1, 0, DARK.deep, 8));
  }
  const wag = walk ? Math.sin(TAU * q - 1.2) * 2.4 : Math.sin(TAU * q - 1.6) * 1.4;
  body.push(...tail(x0 - 8, cy + 6, 0.8, wag));
  // The candle's glow through the paper, brighter as it flares.
  const flare = A ? A.flare : idle ? 0.25 + 0.1 * Math.sin(TAU * q * 2) : 0.25;
  // The lantern: lacquered caps top and bottom, the paper ribbed by its bamboo hoops.
  body.push(O(x0, cy, 10, 11, 0, PAPER.base, 22), crescent(x0, cy, 10, 11, PAPER.sh, { k: 0.26, a0: 70, a1: 230 }));
  body.push(F(O(x0 + 1.4, cy + 1, 6 + flare * 2, 7 + flare * 2, 0, mix(PAPER.hi, FLAME[1], 0.25 + flare * 0.4), 18)));
  for (let i = -3; i <= 3; i++) {
    const half = Math.sqrt(Math.max(0, 1 - (i / 3.6) ** 2)) * 10;
    body.push(...stroke([[x0 - half, cy + i * 3], [x0 + half, cy + i * 3]], 0.45, PAPER.sh));
  }
  body.push(F(T([[x0 - 6, cy - 12.6], [x0 + 6, cy - 12.6], [x0 + 5, cy - 9.6], [x0 - 5, cy - 9.6]], LACQ.base)), F(T([[x0 - 6, cy + 12.6], [x0 + 6, cy + 12.6], [x0 + 5, cy + 9.6], [x0 - 5, cy + 9.6]], LACQ.sh)));
  // Its tanuki face peeking through the paper, ears poking out of the top cap.
  const em = dead ? 'dead' : hurt ? 'hurt' : mood === 'angry' || A ? 'angry' : mood === 'happy' ? 'happy' : mood === 'blink' ? 'blink' : 'idle';
  const mm = dead || hurt ? 'hurt' : A && f === 2 ? 'shout' : A ? 'angry' : mood === 'happy' ? 'happy' : 'smug';
  for (const [ex, a] of [[x0 - 4, -12], [x0 + 4.4, 14 + (idle && f === 4 ? 14 : 0)]]) body.push(O(ex, cy - 13.6, 2.2, 2, a, FUR.base, 10), O(ex, cy - 13.3, 1.1, 1, a, DARK.base, 8));
  body.push(O(x0 - 0.8, cy - 1.4, 2.4, 1.8, 18, DARK.base, 12), O(x0 + 4, cy - 1.5, 2.6, 1.9, -16, DARK.base, 12));
  if (dead) body.push(...deadEye(x0 - 0.6, cy - 1.6, 1.3, { s: -1, c: '#f6ead6' }), ...deadEye(x0 + 4, cy - 1.6, 1.4, { c: '#f6ead6' }));
  else body.push(...simpleEye(x0 - 0.6, cy - 1.8, { s: -1, w: 1.2, h: 1.5, mood: em, iris: '#3a2418', ink: '#1a1012' }), ...simpleEye(x0 + 4, cy - 1.9, { s: 1, w: 1.4, h: 1.7, mood: em, iris: '#3a2418', ink: '#1a1012' }));
  body.push(O(x0 + 2.4, cy + 2, 2.6, 1.6, 0, CREAM.base, 12), E(x0 + 4, cy + 1.3, 0.8, 0.6, DARK.deep));
  body.push(...simpleMouth(x0 + 2.6, cy + 3.4, { k: 0.8, mood: mm, lip: '#5a3028' }));
  // A tassel under the lantern, trailing the swing.
  body.push(...stroke([[x0, cy + 12.6], [x0 - swing * 0.08, cy + 15]], 0.7, LACQ.sh), O(x0 - swing * 0.1, cy + 15.6, 0.9, 1.4, 0, LACQ.base, 8));
  out.push(...rotate(body, x0, gy, swing * 0.4));
  // The flame puffed out of its mouth: flame tongues ahead of it.
  if (A && A.puff) {
    const n = Math.round(3 * A.puff) + 1;
    for (let i = 0; i < n; i++) out.push(O(x0 + 12 + i * 3.4, cy + 2 - i * 0.4, 2.4 - i * 0.3, 1.6 - i * 0.2, -10, FLAME[i % 3], 10));
  }
  if (hurt) out.push(...sweat(x0 - 8, cy - 8, 0.8));
  return { w: 46, h: 54, res: 3, shapes: shift(out, 2, 2) };
}

// ---------- The Grand Kettle, rigged ----------
// A live skeleton like every boss (render/mobs/rig.js): the giant pot is his body, his head and
// belly poke out of its front, two stout legs carry it, a bamboo tea ladle in his near paw. The lid
// rides a spring and rattles on the wind-up; his ears and tail trail the body. Rig space: the floor
// under him at (0, 0).
const LADLE = ramp('#c8b46a', { step: 10, turn: 12, sat: -8 });
const GK = {
  leg: (near) => part(`gk|leg|${near}`, 18, 22, () => [...stroke([[9, 2], [near ? 10 : 8, 10], [9, 16]], 7, near ? DARK.base : DARK.sh, false), O(10.6, 17.4, 6, 3, 0, DARK.deep, 14)]),
  tail: () => part('gk|tail', 34, 28, () => tail(28, 22, 2.2, 3)),
  // The pot: iron with a hobnail band and the light's highlight, the spout out of the front.
  pot: () => part('gk|pot', 96, 66, () => {
    const cx = 45;
    const cy = 36;
    const o = [F(T([[cx + 30, cy - 6], [cx + 44, cy - 22], [cx + 47, cy - 19], [cx + 34, cy + 2]], IRON.sh)), O(cx + 46, cy - 21, 2.6, 2, -40, IRON.deep, 10)];
    o.push(O(cx, cy, 40, 28, 0, IRON.base, 32), crescent(cx, cy, 40, 28, IRON.sh, { k: 0.3, a0: 60, a1: 240 }), shine(cx, cy, 40, 28, IRON.hi, 0, 0.8));
    for (let i = 0; i < 13; i++) o.push(E(cx - 30 + i * 5, cy - 11 + Math.abs(i - 6) * 0.5, 1.1, 1.1, IRON.hi));
    o.push(O(cx, cy - 26, 30, 4, 0, IRON.deep, 24));
    return o;
  }),
  // The lid with its knob, from its centre (20, 8).
  lid: () => part('gk|lid', 40, 14, () => [O(20, 8, 19, 4.4, 0, IRON.sh, 20), F(O(16, 6.6, 10, 1.4, 0, IRON.base, 14)), O(20, 3.4, 4, 3, 0, IRON.deep, 12)]),
  // The bail handle arching over, from its left end (4, 30).
  bail: () => part('gk|bail', 86, 34, () => stroke([[4, 30], [12, 6], [74, 6], [82, 30]], 2.6, IRON.deep, false)),
  // His belly out of the pot's front.
  belly: () => part('gk|belly', 40, 34, () => [O(20, 17, 17, 15, 0, FUR.base, 22), O(22, 19, 12, 11, 0, CREAM.base, 20), crescent(22, 19, 12, 11, CREAM.sh, { k: 0.24, a0: 90, a1: 210 })]),
  // The head without its eyes and mouth (the face part acts those).
  head: () => part('gk|head', 46, 40, () => {
    const hx = 22;
    const hy = 22;
    const k = 2.4;
    return [
      O(hx, hy, 7 * k, 6.2 * k, 0, FUR.base, 24), crescent(hx, hy, 7 * k, 6.2 * k, FUR.sh, { k: 0.28, a0: 80, a1: 230 }),
      O(hx - 2.2 * k, hy + 0.2 * k, 2.7 * k, 2.1 * k, 18, DARK.base, 16), O(hx + 3.2 * k, hy + 0.1 * k, 2.9 * k, 2.2 * k, -16, DARK.base, 16),
      O(hx + 1.6 * k, hy + 3 * k, 3.6 * k, 2.4 * k, 0, CREAM.base, 18), O(hx + 0.4 * k, hy - 3.6 * k, 2.4 * k, 1.3 * k, 0, CREAM.hi, 12),
      E(hx + 3.6 * k, hy + 2 * k, 1.1 * k, 0.8 * k, DARK.deep),
    ];
  }),
  face: (mood, atk) => part(`gk|face|${mood}|${atk}`, 46, 40, () => {
    const dead = mood === 'dead';
    const hurt = mood === 'hurt';
    const angry = mood === 'angry' || atk;
    const em = dead ? 'dead' : hurt ? 'hurt' : angry ? 'angry' : mood === 'happy' ? 'happy' : mood === 'blink' ? 'blink' : 'idle';
    const o = [];
    if (dead) o.push(...deadEye(17, 22, 3, { type: 'swirl', s: -1, c: '#f6ead6' }), ...deadEye(29.4, 22, 3.4, { type: 'swirl', c: '#f6ead6' }));
    else o.push(...simpleEye(17.2, 21.6, { s: -1, w: 3, h: 3.6, mood: em, iris: angry ? '#d0504a' : '#3a2418', ink: '#1a1012', lid: 0.3 }), ...simpleEye(29.4, 21.4, { s: 1, w: 3.4, h: 4, mood: em, iris: angry ? '#d0504a' : '#3a2418', ink: '#1a1012', lid: 0.3 }));
    o.push(...simpleMouth(27.6, 32, { k: 1.8, mood: dead ? 'dead' : atk ? 'shout' : angry ? 'angry' : hurt ? 'hurt' : mood === 'happy' ? 'happy' : 'idle', smug: !angry && !hurt && !dead, lip: '#5a3028' }));
    // A wispy old white beard under the chin: the oldest tanuki of all.
    for (let k = -2; k <= 2; k++) o.push(O(27 + k * 2.2, 36.6 - Math.abs(k) * 0.6, 1.6, 2.6, k * 8, k % 2 ? CREAM.hi : '#ffffff', 10));
    if (angry && !atk) o.push(...vein(9, 10, 1.4));
    if (hurt) o.push(...sweat(6, 14, 1.4));
    return o;
  }),
  // An ear from its root (7, 10).
  ear: (near) => part(`gk|ear|${near}`, 14, 14, () => [O(7, 7, 6, 5.6, 0, near ? FUR.base : FUR.sh, 14), O(7.4, 7.6, 3.4, 3, 0, DARK.base, 12)]),
  arm: () => part('gk|arm', 26, 12, () => [...stroke([[3, 6], [20, 6]], 6.4, DARK.base, false), O(20, 6, 4.2, 4, 0, DARK.deep, 12)]),
  // The bamboo ladle along +x from the grip at (8, 8): the long jointed handle, the cup at the end.
  ladle: () => part('gk|ladle', 70, 20, () => {
    const o = [...stroke([[2, 8], [54, 8]], 2.6, LADLE.base, false), ...stroke([[2, 8.6], [54, 8.6]], 0.7, LADLE.hi)];
    for (const x of [16, 32, 48]) o.push(...stroke([[x, 6.4], [x, 9.8]], 0.9, LADLE.sh));
    o.push(O(60, 9, 7, 6, 0, LADLE.base, 16), crescent(60, 9, 7, 6, LADLE.sh, { k: 0.3, a0: 60, a1: 220 }), O(60, 7, 5, 2, 0, LADLE.deep, 12));
    return o;
  }),
};
const kettleRig = makeRig({
  w: 96,
  h: 96,
  stride: 40,
  fast: ['arm', 'ladle', 'rear'],
  kick: { rear: 1.4, lid: 6, earF: 3 },
  springs: { lid: [180, 6], earF: [80, 5], earB: [70, 5], tail: [50, 4], head: [140, 10] },
  pose(m, a) {
    const t = a.t;
    const s = Math.sin(a.wp);
    const dip = Math.abs(s);
    // At rest he sways and his lid lifts a hair with each slow breath, the ladle on his shoulder.
    const idle = { rear: Math.sin(t * 1.1) * 0.035, bob: Math.sin(t * 1.8) * 1.6, lid: Math.max(0, Math.sin(t * 1.8)) * 1.6, arm: -1.9 + Math.sin(t * 1.1) * 0.05, ladle: -2.5, legF: 0, legB: 0, x: 0 };
    const walk = { rear: Math.sin(a.wp * 2 - 1) * 0.06, bob: dip * 3 - 1.5, lid: dip * 2, arm: -1.9 + s * 0.08, ladle: -2.5 + s * 0.1, legF: -s * 0.45, legB: s * 0.45, x: s * 2 };
    // Wind-up: rocking back, the ladle hoisted high behind him, the lid rattling up on the steam.
    const antic = { rear: -10 * D2R, bob: -4, lid: 7 + Math.sin(t * 40) * 3, arm: -2.6, ladle: -2.9, legF: -0.12, legB: 0.18, x: 0 };
    // The slam: thrown forward, the ladle brought down in front of him.
    const strike = { rear: 12 * D2R, bob: 3, lid: 2, arm: 0.7, ladle: 0.75, legF: -0.3, legB: 0.25, x: 0 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  follow: (S) => ({ head: S.rear * 0.5, lidT: S.lid, earF: 0.25 - S.bob * 0.05 - S.rear, earB: -0.3 + S.bob * 0.05 + S.rear, tail: S.rear * 1.6 - S.bob * 0.04 }),
  parts: [
    { name: 'root', at: (S) => [S.x, -34 + S.bob], rot: (S) => S.rear },
    { name: 'tail', parent: 'root', pivot: [28, 22], at: () => [-38, 4], rot: (S) => S.tail, s: () => GK.tail() },
    { name: 'legB', parent: 'root', pivot: [9, 2], at: () => [-16, 18], rot: (S) => S.legB, s: () => GK.leg(false) },
    { name: 'legF', parent: 'root', pivot: [9, 2], at: () => [16, 18], rot: (S) => S.legF, s: () => GK.leg(true) },
    { name: 'bail', parent: 'root', pivot: [4, 30], at: () => [-41, -26], s: () => GK.bail() },
    { name: 'pot', parent: 'root', pivot: [45, 36], at: () => [0, 0], s: () => GK.pot() },
    { name: 'lid', parent: 'root', pivot: [20, 8], at: (S) => [0, -30 - (S.lidT ?? S.lid)], s: () => GK.lid() },
    { name: 'belly', parent: 'root', pivot: [20, 17], at: () => [20, 6], s: () => GK.belly() },
    { name: 'earB', parent: 'root', pivot: [7, 10], at: () => [16, -24], rot: (S) => S.earB, s: () => GK.ear(false) },
    { name: 'head', parent: 'root', pivot: [22, 22], at: () => [26, -14], rot: (S) => S.head, s: () => GK.head() },
    { name: 'face', parent: 'head', pivot: [22, 22], at: () => [0, 0], s: (a) => GK.face(a.face, a.atk) },
    { name: 'earF', parent: 'head', pivot: [7, 10], at: () => [8, -16], rot: (S) => S.earF - S.head, s: () => GK.ear(true) },
    { name: 'arm', parent: 'root', pivot: [3, 6], at: () => [30, 2], rot: (S) => S.arm - S.rear, s: () => GK.arm() },
    { name: 'ladle', parent: 'arm', pivot: [8, 8], at: () => [18, 0], rot: (S) => S.ladle - S.arm, s: () => GK.ladle() },
  ],
  fx(ctx, m, a) {
    // Steam bursting up round where the ladle lands.
    if (a.ph.since >= 0 && a.ph.since < 0.7) {
      const u = a.ph.since / 0.7;
      for (let i = 0; i < 9; i++) {
        const ang = (-170 + i * 20) * D2R;
        const r = 10 + 26 * u;
        ctx.globalAlpha = a.alpha * (1 - u) * 0.85;
        ctx.fillStyle = STEAM;
        ctx.beginPath();
        ctx.ellipse(64 + Math.cos(ang) * r, -4 + Math.sin(ang) * r * 0.6, 4 + 3 * u, 3 + 2 * u, 0, 0, TAU);
        ctx.fill();
      }
    }
  },
});

// The Grand Kettle's still frames (galleries, portraits).
function grandkettle(pose, f, mood) {
  const atk = pose === 'attack';
  const lift = atk ? [4, 8, 1, 1][f] ?? 0 : pose === 'idle' ? f % 3 : 0;
  const out = [];
  const cx = 50;
  const gy = 92;
  for (const s of [-1, 1]) out.push(...stroke([[cx + s * 16, gy - 20], [cx + s * 17, gy - 4]], 7, s < 0 ? DARK.sh : DARK.base, false), O(cx + s * 17 + 1.6, gy - 2.6, 6, 3, 0, DARK.deep, 12));
  out.push(...tail(cx - 38, gy - 30, 2.2, 3));
  out.push(O(cx, gy - 36, 40, 28, 0, IRON.base, 30), crescent(cx, gy - 36, 40, 28, IRON.sh, { k: 0.3, a0: 60, a1: 240 }));
  out.push(...stroke([[cx - 37, gy - 50], [cx - 29, gy - 76], [cx + 29, gy - 76], [cx + 37, gy - 50]], 2.6, IRON.deep));
  out.push(O(cx, gy - 64 - lift, 19, 4.4, 0, IRON.sh, 18), O(cx, gy - 68.6 - lift, 4, 3, 0, IRON.deep, 10));
  out.push(O(cx + 20, gy - 30, 17, 15, 0, FUR.base, 20), O(cx + 22, gy - 28, 12, 11, 0, CREAM.base, 18));
  const em = mood === 'dead' ? 'dead' : mood === 'hurt' ? 'hurt' : atk || mood === 'angry' ? 'angry' : mood;
  out.push(...tanukiHead(cx + 26, gy - 52, 2.1, em, atk ? 'shout' : 'smug', { dead: mood === 'dead' }));
  return { w: 104, h: 100, res: 2, shapes: out };
}

export const ART = {
  tanukipicker: { walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [80, 300, 160], draw: tanukipicker },
  kettletanuki: { walk: 8, idle: 6, attack: 5, stride: 18, atkMs: [120, 340, 200, 220], draw: kettletanuki },
  lantertanuki: { walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [140, 360, 200], draw: lantertanuki },
  grandkettle: { walk: 4, idle: 3, attack: 4, stride: 40, atkMs: [200, 620, 260], draw: grandkettle, rig: kettleRig },
};

export const INFO = {
  tanukipicker: { name: 'Tanuki Picker', w: 26, h: 34 },
  kettletanuki: { name: 'Kettle Tanuki', w: 34, h: 30 },
  lantertanuki: { name: 'Lantern Tanuki', w: 26, h: 36 },
  grandkettle: { name: 'The Grand Kettle', w: 84, h: 90 },
};
