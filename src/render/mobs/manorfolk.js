// Monster art: the Moonlit Manor's residents (the levels 15-20 group dungeon, see
// docs/design/moonlit-manor.md). Redrawn creature-first (2026-11-03, the dungeon monster redesign:
// chibi creatures with their own silhouettes; the old costumed girls on the manor rig are retired,
// the rig itself stays for the other dungeons that still use it).
//   porcelaindoll  Porcelain Doll: a china bunny doll in a ruffled bonnet with a hairline crack and
//                  a lace parasol; stiff doll hops, a parasol jab.
//   ghostmaid      Ghost Maid: a little ghost cat in a maid's cap and apron with a feather duster;
//                  floats about tidying, swats with the duster.
//   candlebride    Candle Bride: a living candle in a bridal veil, her flame for hair; it flares up.
//   topiarydryad   Topiary Swan: a hedge clipped into a swan, with a rose; waddles and pecks.
//   lanternghost   Lantern Wisp: a flame spirit floating in a little iron lantern; it flares out.
//   armourknight   Armour Knight: a small empty suit of armour, its helm too big, eyes glowing
//                  inside; clanks along and slashes.
//   teahatter      Tea Party Hatter: a round teapot in a top hat on little legs; tips over and pours
//                  a splash of hot tea.
// Every design faces right, its lowest point on the bottom edge. Attacks are four frames:
// wind-up (the tell), strike, impact, recover.

import { E, T, F, R, mix, ramp, crescent, shine, smear, chain, wave, breath, sway, TAU, D2R, O, arcPts, limb, spin, strand, star, cuteFace, blob, bubbles } from './critter.js';

const frames = (pose) => (pose === 'walk' ? 8 : pose === 'attack' ? 4 : 6);
const phase = (pose, f) => f / frames(pose);
// A flame: a teardrop flickering by phase.
export function flame(x, y, h, q, outer = '#ff9a3a', inner = '#ffe36b') {
  const w = h * 0.42;
  const lean = Math.sin(q * TAU * 3) * h * 0.12;
  return [F(T([[x - w, y], [x - w * 0.9, y - h * 0.45], [x + lean, y - h], [x + w * 0.9, y - h * 0.5], [x + w, y], [x, y + w * 0.6]], outer)), F(T([[x - w * 0.5, y], [x - w * 0.4, y - h * 0.4], [x + lean * 0.6, y - h * 0.7], [x + w * 0.45, y - h * 0.35], [x + w * 0.5, y]], inner)), F(E(x, y - h * 0.15, w * 0.3, w * 0.35, '#ffffff'))];
}

// ---------- Porcelain Doll ----------

const DOLL_ATK = [
  { jab: -60, lean: -10, hop: 0 },
  { jab: 6, lean: 10, hop: 1, smear: 1 },
  { jab: 4, lean: 8, hop: 0.6, hit: 1 },
  { jab: -30, lean: 0, hop: 0 },
];

function doll(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? DOLL_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const china = ramp('#fff6f4', { step: 8, turn: 14 });
  const dress = ramp('#ffb3cf', { step: 10 });
  // Stiff little doll hops: the whole body lifts at once, an eerie head tilt at rest.
  const hop = walk ? Math.abs(Math.sin(TAU * q * 2)) * 2.4 : A ? A.hop * 2 : 0;
  const cx = 17;
  const cy = (dead ? 10 : 0) - hop;
  const lean = dead ? 88 : A ? A.lean : walk ? Math.sin(TAU * q * 2) * 3 : 0;
  const tilt = pose === 'idle' ? Math.sin(q * TAU) * 10 : 0;
  const out = [];
  const body = [];
  // Stubby jointed legs in white socks and Mary Janes.
  for (const [ox, c] of [[-3, china.sh], [3, china.base]]) body.push(...limb([cx + ox, cy + 28], [cx + ox, cy + 34], 2.8, 2.6, c), O(cx + ox + 0.8, cy + 35, 2.4, 1.2, 0, '#7a3a5a', 12));
  // A bell dress with a frilled hem and a sash.
  body.push(T([[cx - 5, cy + 18], [cx + 5, cy + 18], [cx + 10, cy + 29], [cx - 10, cy + 29]], dress.base), F(T([[cx + 2, cy + 18], [cx + 5, cy + 18], [cx + 10, cy + 29], [cx + 5, cy + 29]], dress.sh)));
  for (let i = 0; i < 6; i++) body.push(E(cx - 8 + i * 3.2, cy + 29, 1.8, 1.2, '#ffffff'));
  body.push(F(R(cx - 5.6, cy + 19, 11.2, 1.6, '#9a7ad8')));
  // Head: a china bunny with long ears under a ruffled bonnet, a hairline crack, rosy cheeks.
  const hx = cx + 1;
  const hy = cy + 10;
  const head = [];
  for (const [x, a, c] of [[-2.6, -104, china.sh], [2, -84, china.base]]) {
    const ear = chain(hx + x, hy - 6, a, [4, 4], () => 6);
    head.push(strand(ear, (t) => 3.4 * (1 - t * 0.2), c), strand(ear.map(([x2, y2]) => [x2 + 0.3, y2]), 1.2, '#ffd0dc'));
  }
  head.push(...blob(hx, hy, 7.6, 7, china));
  head.push(T([...arcPts(hx - 0.6, hy - 1, 8.6, 8, 175, 330, 12), [hx + 6, hy - 2], [hx - 8, hy + 2]], '#ffd6e6'));
  for (let i = 0; i < 7; i++) head.push(F(E(hx - 8 + i * 2, hy + 0.6 + Math.abs(3 - i) * -0.4, 1.4, 1, '#ffffff')));
  head.push(F(T([[hx - 4, hy - 4], [hx - 3, hy - 1], [hx - 4.4, hy + 0.6], [hx - 3.6, hy + 0.8], [hx - 2.4, hy - 1], [hx - 3.4, hy - 4]], '#c8a8b0')));
  head.push(...cuteFace(hx + 1.4, hy + 1.4, 0.95, mood, { iris: '#7a5ad8', gap: 4.6, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: china.base, mouthDy: 3.4, lash: 1.4, wing: 1.2 }));
  body.push(...spin(head, hx, hy + 6, tilt));
  // The lace parasol: closed and thrust like a rapier on the jab, open on the shoulder at rest.
  const ja = A ? A.jab : -50 + (walk ? Math.sin(TAU * q * 2) * 4 : 0);
  const hand = [cx + 6, cy + 20];
  const dir = [Math.cos(ja * D2R), Math.sin(ja * D2R)];
  const tip = [hand[0] + dir[0] * 16, hand[1] + dir[1] * 16];
  body.push(...limb([cx + 3, cy + 18], hand, 2.4, 2, china.base), ...limb([hand[0] - dir[0] * 3, hand[1] - dir[1] * 3], tip, 0.8, 0.8, '#c99a6b'));
  if (A && A.jab > -20) body.push(T([[hand[0] + dir[0] * 4 - dir[1] * 2, hand[1] + dir[1] * 4 + dir[0] * 2], [tip[0] - dir[0] * 2, tip[1] - dir[1] * 2], [hand[0] + dir[0] * 4 + dir[1] * 2, hand[1] + dir[1] * 4 - dir[0] * 2]], '#ffffff'));
  else {
    const top = [hand[0] + dir[0] * 12, hand[1] + dir[1] * 12];
    body.push(T([...arcPts(top[0], top[1], 9, 5, 180 + ja + 90, 360 + ja + 90, 10)], '#ffffff'));
    for (let i = 0; i < 5; i++) body.push(F(E(top[0] + Math.cos((ja + 90 + 180 + i * 45) * D2R) * 8, top[1] + Math.sin((ja + 90 + 180 + i * 45) * D2R) * 4.6, 1.2, 1.2, '#ffd6e6')));
  }
  out.push(...spin(body, cx, 36, lean));
  if (A?.smear) out.push(smear([[hand[0] - 6, hand[1] + 2], [hand[0] + 4, hand[1]], [tip[0] + 2, tip[1]]], 3, '#fff0f6'));
  if (A?.hit) out.push(...star(tip[0] + 2, tip[1], 2.8, '#fff6a8'));
  return { w: 40, h: 38, res: 3, shapes: out };
}

// ---------- Ghost Maid ----------

const MAID_ATK = [
  { duster: -150, lean: -10 },
  { duster: -10, lean: 12, smear: 1 },
  { duster: 20, lean: 12, hit: 1 },
  { duster: -60, lean: 0 },
];

function maid(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? MAID_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const ghost = ramp('#e8f0ff', { step: 9, turn: 14 });
  const bob = dead ? 0 : walk ? Math.sin(TAU * q * 2) * 1.8 : -breath(q) * 1.6;
  const cx = 17;
  const cy = (dead ? 26 : 16) + bob;
  const lean = dead ? 86 : A ? A.lean : walk ? 8 : sway(q) * 3;
  const out = [];
  const body = [];
  // A wispy cat-ghost: a round body narrowing to a curling wisp of a tail.
  const tail = chain(cx - 2, cy + 10, 140, [3, 3, 3, 2.6], dead ? () => 6 : wave(TAU * q * 2, 22, 0.8));
  body.push(strand(tail, (t) => 9 * (1 - t * 0.85), ghost.base));
  body.push(...blob(cx, cy + 4, 9, 8, ghost));
  // The apron with a frilly edge and a bow behind.
  body.push(T([[cx - 3, cy + 1], [cx + 8, cy + 1], [cx + 9, cy + 11], [cx - 1, cy + 11]], '#ffffff'));
  for (let i = 0; i < 5; i++) body.push(F(E(cx + i * 2.2 - 0.4, cy + 11.2, 1.3, 0.9, '#ffffff')));
  body.push(E(cx - 8, cy + 3, 2.6, 1.8, '#3a3050'), E(cx - 8, cy + 6, 2.6, 1.8, '#3a3050'));
  // Head: a cat ghost with pointed ears, whiskers, a frilly maid cap.
  const hx = cx + 1;
  const hy = cy - 5;
  body.push(T([[hx - 6, hy - 3], [hx - 7, hy - 11], [hx - 1, hy - 6]], ghost.sh), T([[hx + 6, hy - 3], [hx + 7, hy - 11], [hx + 1, hy - 6]], ghost.base), F(T([[hx + 5, hy - 4], [hx + 6, hy - 9], [hx + 2.4, hy - 6]], '#ffd0e0')));
  body.push(...blob(hx, hy, 7.4, 6.6, ghost));
  for (let i = 0; i < 5; i++) body.push(E(hx - 5 + i * 2.4, hy - 6.4 - Math.sin((i / 4) * Math.PI) * 1.4, 1.6, 1.4, '#ffffff'));
  body.push(F(R(hx - 4, hy - 6, 8, 1, '#3a3050')));
  body.push(...cuteFace(hx + 1.4, hy + 0.4, 0.9, mood, { iris: '#5ab0e0', gap: 4.4, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: ghost.base, mouthDy: 3.2 }));
  for (const dy of [-0.6, 0.8]) body.push(F(T([[hx + 6, hy + 2 + dy], [hx + 10, hy + 1.4 + dy * 1.6], [hx + 10, hy + 1.8 + dy * 1.6], [hx + 6, hy + 2.4 + dy]], '#c8d0e8')));
  // The feather duster: a stick with a big pink plume, swatting.
  const da = A ? A.duster : walk ? -60 + Math.sin(TAU * q * 4) * 20 : -60 + sway(q) * 10;
  const hand = [cx + 7, cy + 4];
  const tip = [hand[0] + Math.cos(da * D2R) * 10, hand[1] + Math.sin(da * D2R) * 10];
  body.push(...limb([cx + 4, cy + 3], hand, 2.6, 2.2, ghost.base), ...limb(hand, tip, 0.9, 0.9, '#c99a6b'));
  for (let i = 0; i < 5; i++) {
    const a = da + (i - 2) * 18;
    body.push(O(tip[0] + Math.cos(a * D2R) * 3.4, tip[1] + Math.sin(a * D2R) * 3.4, 3.4, 1.6, a, i % 2 ? '#ff9ac8' : '#ffc6e2', 10));
  }
  out.push(...spin(body, cx, cy + 10, lean));
  if (A?.smear) out.push(smear([[cx, cy - 12], [cx + 12, cy - 6], [tip[0] + 2, tip[1]]], 4, '#ffe6f2'));
  if (A?.hit) out.push(...star(tip[0] + 4, tip[1], 2.8, '#fff6a8'), F(E(tip[0] + 2, tip[1] - 3, 1, 1, '#ffd0e8')));
  return { w: 40, h: 40, res: 3, shapes: out };
}

// ---------- Candle Bride ----------

const CANDLE_ATK = [
  { flare: 0.6, lean: -8 },
  { flare: 1.8, lean: 10, smear: 1 },
  { flare: 2.2, lean: 12, hit: 1 },
  { flare: 0.8, lean: 0 },
];

function candle(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? CANDLE_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const wax = ramp('#fff4e0', { step: 8, turn: 12 });
  const cx = 17;
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const cy = (dead ? 12 : 0) - Math.abs(step) * 1;
  const lean = dead ? 88 : A ? A.lean : walk ? step * 3 : sway(q) * 2;
  const out = [];
  const body = [];
  // A silver candlestick foot it shuffles along on.
  body.push(O(cx, 36, 9, 2.4, 0, '#b8b8d0', 16), R(cx - 3, cy + 30, 6, 6, '#d8d8e8'), O(cx, cy + 30, 7, 2, 0, '#e8e8f4', 16));
  // The candle: a fat wax pillar with drips down the sides, her face on it.
  body.push(R(cx - 7, cy + 8, 14, 22, wax.base), F(R(cx + 4, cy + 8, 3, 22, wax.sh)), O(cx, cy + 8, 7, 2.4, 0, wax.hi, 16));
  for (const [x, l] of [[-5, 5], [-1, 8], [3, 4], [5.6, 6]]) body.push(R(cx + x - 1, cy + 8, 2, l, wax.hi), E(cx + x, cy + 8 + l, 1.1, 1.3, wax.hi));
  body.push(...cuteFace(cx + 1, cy + 17, 1, mood, { iris: '#c05ad8', gap: 5, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: wax.base, mouthDy: 3.6, lash: 1.4, wing: 1.2 }));
  // The flame on top, flaring up big on the attack.
  const fh = 8 + (A ? A.flare * 6 : (walk ? Math.abs(step) : breath(q)) * 1.6);
  body.push(...limb([cx, cy + 6], [cx, cy + 4], 0.6, 0.6, '#3a2a2a'), ...flame(cx, cy + 5, fh, q));
  // A bridal veil from a little crown of wax flowers, flowing back.
  // The veil: a soft sheer drape from the crown down the back of the candle, its hem swaying.
  const sw = Math.sin(TAU * q * (walk ? 2 : 1)) * (walk ? 2 : 1);
  body.push(T([[cx - 5, cy + 6], [cx - 1, cy + 6], [cx - 6, cy + 14], [cx - 9 + sw, cy + 26], [cx - 11 + sw, cy + 27], [cx - 10 + sw * 0.5, cy + 16]], '#f4f0ff'), F(T([[cx - 5, cy + 7], [cx - 7, cy + 14], [cx - 9 + sw, cy + 25], [cx - 8 + sw * 0.6, cy + 15]], '#ffffff')));
  for (const [dx, c] of [[-5, '#ffb3cf'], [-2, '#ffffff'], [1, '#ffb3cf']]) body.push(E(cx + dx, cy + 7.4, 1.5, 1.3, c));
  out.push(...spin(body, cx, 36, lean));
  if (A?.smear) out.push(smear([[cx, cy - 6], [cx + 10, cy - 8], [cx + 20, cy - 2]], 4, '#fff0c8'));
  if (A?.hit) out.push(...flame(cx + 20, cy + 6, 10, q), ...star(cx + 22, cy - 2, 3, '#fff6a8'));
  return { w: 40, h: 38, res: 3, shapes: out };
}

// ---------- Topiary Swan ----------

const SWAN_ATK = [
  { neck: -1, lean: -8 },
  { neck: 1, lean: 10, smear: 1 },
  { neck: 1.1, lean: 12, hit: 1 },
  { neck: 0.2, lean: 0 },
];

function swan(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? SWAN_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const hedge = ramp('#6fc06a', { step: 10, turn: 14, sat: -4 });
  const out = [];
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 18;
  const cy = (dead ? 8 : 0) - Math.abs(step) * 0.8;
  const lean = dead ? 80 : A ? A.lean : walk ? step * 5 : sway(q) * 2;
  const body = [];
  // Little clipped-hedge feet, waddling.
  for (const [ox, s, c] of [[-4, step, hedge.sh], [3, -step, hedge.base]]) body.push(O(cx + ox + Math.max(0, s) * 2, 35.4 - Math.max(0, s) * 1.6, 3.4, 1.8, 0, c, 12));
  // The body: a round clipped bush with leafy texture and a wing shape.
  const leafy = (x, y, rx, ry, r) => {
    const o = [...blob(x, y, rx, ry, r)];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      o.push(F(E(x + Math.cos(a) * rx * 0.6, y + Math.sin(a) * ry * 0.6, 1.4, 1, i % 2 ? r.hi : r.sh)));
    }
    return o;
  };
  body.push(...leafy(cx, cy + 26, 12, 8, hedge));
  body.push(T([[cx - 10, cy + 22], [cx - 16, cy + 16], [cx - 8, cy + 18]], hedge.sh), T([[cx - 2, cy + 22], [cx + 6, cy + 20], [cx + 2, cy + 28]], hedge.hi));
  // The neck: an S of hedge, the head with a gold-clipped beak and a red rose.
  const nk = A ? A.neck : walk ? Math.sin(TAU * q * 2) * 0.2 : 0;
  const neck = chain(cx + 8, cy + 22, -80 + nk * 40, [5, 5, 5], dead ? () => 30 : (i) => (i === 1 ? -40 + nk * 20 : i === 2 ? 50 - nk * 30 : 0));
  body.push(strand(neck, 4.4, hedge.base));
  for (const p of neck.slice(1)) body.push(F(E(p[0], p[1], 1.2, 0.9, hedge.hi)));
  const [hx, hy] = neck.at(-1);
  body.push(...leafy(hx, hy, 4.6, 4, hedge), T([[hx + 3, hy - 1], [hx + 9, hy + 1], [hx + 3, hy + 2]], '#ffb040'), F(T([[hx + 3, hy - 1], [hx + 9, hy + 1], [hx + 5, hy + 0.6]], '#ffd080')));
  body.push(...cuteFace(hx + 0.6, hy - 0.6, 0.7, mood, { iris: '#3a7a3a', gap: 3, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: hedge.base, mouthDy: null, lash: 1.3 }));
  body.push(E(hx - 3, hy - 3.4, 2, 2, '#ff4d6d'), F(E(hx - 3, hy - 3.4, 1, 1, '#ff8a9a')), F(T([[hx - 2, hy - 2], [hx, hy - 1], [hx - 1.4, hy - 0.4]], '#3a8a3a')));
  out.push(...spin(body, cx, 36, lean));
  if (A?.smear) out.push(smear([[cx + 6, cy + 4], [cx + 16, cy + 8], [hx + 10, hy + 1]], 3, '#e0ffd8'));
  if (A?.hit) out.push(...star(hx + 11, hy + 1, 3, '#fff6a8'), F(O(hx + 6, hy + 8, 1.6, 0.8, 30, '#8ad88a')));
  return { w: 40, h: 38, res: 3, shapes: out };
}

// ---------- Lantern Wisp ----------

const WISP_ATK = [
  { flare: 0.4, lean: -8 },
  { flare: 1.6, lean: 8, burst: 1 },
  { flare: 2, lean: 10, burst: 1.6, hit: 1 },
  { flare: 0.6, lean: 0 },
];

function wisp(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? WISP_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const iron = '#4a4060';
  const bob = dead ? 0 : walk ? Math.sin(TAU * q * 2) * 2 : -breath(q) * 1.6;
  const cx = 18;
  const cy = (dead ? 26 : 16) + bob;
  const lean = dead ? 80 : A ? A.lean : walk ? Math.sin(TAU * q * 2) * 6 : sway(q) * 4;
  const out = [];
  const body = [];
  // A wispy flame tail trailing under the lantern.
  const tail = chain(cx, cy + 12, 110, [3, 3, 3], dead ? () => 0 : wave(TAU * q * 2, 22, 0.8));
  body.push(strand(tail, (t) => 5 * (1 - t * 0.8), '#ffb86a'));
  // The lantern: an iron cap and ring, glass panes glowing, the flame spirit inside with its face.
  const glow = 0.4 + (A ? A.flare * 0.3 : breath(q) * 0.2);
  body.push(R(cx - 7, cy - 7, 14, 17, '#fff0b8'), F(R(cx - 7, cy - 7, 14, 17, '#ffe08a')), F(R(cx - 5, cy - 5, 4, 13, '#fff6d8')));
  body.push(...flame(cx, cy + 9, 14 + (A ? A.flare * 3 : 0), q, '#ff9a3a', '#ffe36b'));
  for (const x of [-7, 0, 7]) body.push(R(cx + x - 0.8, cy - 7, 1.6, 17, iron));
  body.push(T([[cx - 9, cy - 7], [cx, cy - 14], [cx + 9, cy - 7]], iron), R(cx - 9, cy + 9, 18, 2.4, iron), F(R(cx - 9, cy - 7.4, 18, 1, '#6a6080')));
  body.push(...limb([cx, cy - 14], [cx, cy - 17], 0.8, 0.8, iron), E(cx, cy - 18.6, 2.2, 2.2, '#4a4060'), F(E(cx, cy - 18.6, 1.2, 1.2, '#fff0b8')));
  body.push(...cuteFace(cx + 0.6, cy + 2, 0.9, mood, { iris: '#ff6a2a', inkC: '#6a2a1a', gap: 4.2, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: '#ffe08a', mouthDy: 3.2, blushOn: false }));
  out.push(...spin(body, cx, cy - 18, lean));
  if (A?.burst) for (let i = 0; i < 5; i++) {
    const a = (-60 + i * 30) * D2R;
    out.push(...flame(cx + 14 + Math.cos(a) * 8 * A.burst, cy + 4 + Math.sin(a) * 8 * A.burst, 5, q + i * 0.2));
  }
  if (A?.hit) out.push(...star(cx + 26, cy + 2, 3, '#fff6a8'));
  if (!dead) out.push(F(E(cx - 10, cy - 8 - (q * 10) % 8, 0.8, 0.8, '#ffe8a0')), F(E(cx + 10, cy - 4 - ((q + 0.5) * 10) % 8, 0.6, 0.6, '#ffe8a0')));
  return { w: 44, h: 42, res: 3, shapes: out };
}

// ---------- Armour Knight ----------

const ARMOUR_ATK = [
  { sword: -150, lean: -10 },
  { sword: -10, lean: 12, smear: 1 },
  { sword: 30, lean: 14, hit: 1 },
  { sword: -40, lean: 0 },
];

function armour(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? ARMOUR_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const steel = ramp('#b8c0d8', { step: 12, turn: 10 });
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 17;
  const cy = (dead ? 10 : 0) - Math.abs(step) * 0.8;
  const lean = dead ? 86 : A ? A.lean : walk ? step * 4 : 0;
  const out = [];
  const body = [];
  for (const [ox, s, c] of [[-3.4, step, steel.sh], [3.4, -step, steel.base]]) body.push(...limb([cx + ox, cy + 26], [cx + ox + Math.max(0, s) * 2, 34 - Math.max(0, s) * 1.6], 4, 3.6, c), O(cx + ox + 1.4 + Math.max(0, s) * 2, 35 - Math.max(0, s) * 1.6, 3.6, 1.6, 0, c, 12));
  // Breastplate: a round barrel chest with a crest, a short skirt of lames.
  body.push(...blob(cx, cy + 21, 8, 6.4, steel));
  for (let i = 0; i < 2; i++) body.push(R(cx - 7 + i, cy + 25 + i * 2, 14 - i * 2, 2, i ? steel.sh : steel.base));
  body.push(F(T([[cx + 1, cy + 18], [cx + 4, cy + 18], [cx + 4, cy + 22], [cx + 2.5, cy + 24], [cx + 1, cy + 22]], '#9a5ad8')));
  // The helm: much too big, a great round bucket with a visor slit, the eyes glowing within, a plume.
  const hx = cx + 1;
  const hy = cy + 9;
  body.push(...blob(hx, hy, 9, 8.4, steel));
  body.push(R(hx - 1, hy - 1.4, 10, 3.4, '#2a2440'));
  const glow = mood === 'dead' ? '#5a5070' : A ? '#ff6a8a' : '#7ff0ff';
  if (mood === 'blink') body.push(F(R(hx + 2, hy, 6, 0.6, glow)));
  else body.push(F(E(hx + 2.6, hy + 0.3, 1.2, 1, glow)), F(E(hx + 6.4, hy + 0.3, 1.2, 1, glow)));
  for (let i = 0; i < 3; i++) body.push(F(R(hx + 1 + i * 2.6, hy + 4, 1, 2.6, steel.sh)));
  const pl = chain(hx - 2, hy - 8, -110, [3, 3, 3, 2.6], dead ? () => 20 : wave(TAU * q * 2, 14, 0.8));
  body.push(strand(pl, (t) => 3.6 * (1 - t * 0.5), '#ff6b8a'));
  // A sword bigger than it should carry.
  const sa = A ? A.sword : walk ? -50 + step * 6 : -50;
  const hand = [cx + 7, cy + 20];
  const tip = [hand[0] + Math.cos(sa * D2R) * 18, hand[1] + Math.sin(sa * D2R) * 18];
  body.push(...limb([cx + 5, cy + 18], hand, 3, 2.8, steel.base), ...limb(hand, tip, 2.4, 1.2, '#e8eef8'), F(T([[hand[0], hand[1]], [tip[0], tip[1]], [hand[0] + 1, hand[1] + 1]], '#ffffff')));
  body.push(...limb([hand[0] - Math.sin(sa * D2R) * 3, hand[1] + Math.cos(sa * D2R) * 3], [hand[0] + Math.sin(sa * D2R) * 3, hand[1] - Math.cos(sa * D2R) * 3], 1.4, 1.4, '#e8b84a'));
  out.push(...spin(body, cx, 36, lean));
  if (A?.smear) out.push(smear([[cx - 2, cy - 4], [cx + 14, cy + 2], [tip[0] + 2, tip[1]]], 5, '#eef4ff'));
  if (A?.hit) out.push(...star(tip[0] + 2, tip[1], 3, '#fff6a8'));
  return { w: 42, h: 38, res: 3, shapes: out };
}

// ---------- Tea Party Hatter ----------

const POT_ATK = [
  { tip: -14, lean: 0, pour: 0 },
  { tip: 22, lean: 0, pour: 0.8 },
  { tip: 28, lean: 0, pour: 1.4, hit: 1 },
  { tip: 8, lean: 0, pour: 0.3 },
];

function teapot(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? POT_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const china = ramp('#bfe4ff', { step: 10, turn: 12 });
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 18;
  const cy = (dead ? 8 : 0) - Math.abs(step) * 1.2;
  const out = [];
  for (const [ox, s] of [[-4, step], [4, -step]]) out.push(...limb([cx + ox, cy + 30], [cx + ox + Math.max(0, s) * 2, 35 - Math.max(0, s) * 1.6], 2.6, 2.4, '#e8b84a'), O(cx + ox + 1 + Math.max(0, s) * 2, 35.6 - Math.max(0, s) * 1.6, 2.6, 1.2, 0, '#c8902a', 12));
  const body = [];
  // The pot: a round china belly with a flower print, a handle, a spout out front.
  body.push(...limb([cx - 9, cy + 18], [cx - 13, cy + 22], 2.6, 2.6, china.sh), ...limb([cx - 13, cy + 22], [cx - 9, cy + 27], 2.6, 2.6, china.sh));
  body.push(...limb([cx + 8, cy + 25], [cx + 15, cy + 18], 4, 2.4, china.base), O(cx + 15.4, cy + 17.4, 1.6, 1, -40, china.sh, 10));
  body.push(...blob(cx, cy + 22, 11, 9, china));
  for (const [x, y] of [[-5, 20], [3, 26], [-2, 28], [5, 19]]) body.push(F(E(cx + x, cy + y, 1.4, 1.4, '#ff9ac8')), F(E(cx + x, cy + y, 0.5, 0.5, '#ffe36b')));
  body.push(F(T([...arcPts(cx, cy + 22, 11, 9, 200, 340, 10), ...arcPts(cx, cy + 22, 9.6, 7.4, 340, 200, 10)], china.sh)));
  body.push(...cuteFace(cx + 3, cy + 22, 1, mood, { iris: '#3a7ad8', gap: 5, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: china.base, mouthDy: 3.4 }));
  // The lid, and a tall top hat on it with a band and a tag.
  body.push(O(cx, cy + 13.4, 7, 2.2, 0, china.hi, 14), E(cx, cy + 11.6, 1.6, 1.4, china.base));
  body.push(O(cx, cy + 11, 8, 2, 0, '#3a3050', 16), R(cx - 5, cy - 1, 10, 12, '#4a3a6a'), F(R(cx + 2, cy - 1, 3, 12, '#3a3050')), R(cx - 5, cy + 7, 10, 2, '#ff6b8a'), O(cx, cy - 1, 5, 1.4, 0, '#5a4a7a', 12));
  body.push(...spin([R(cx + 3, cy + 1, 4, 5, '#fff6dc'), F(R(cx + 3.6, cy + 2, 2.6, 0.6, '#c9b8a8'))], cx + 3, cy + 7, 20));
  const tip = dead ? 90 : A ? A.tip : walk ? step * 6 : sway(q) * 4;
  out.push(...spin(body, cx, dead ? 34 : cy + 24, tip + (A ? A.lean : 0)));
  // The pour: a stream of hot tea arcing from the spout, steam rising.
  if (A?.pour) {
    const k = A.pour;
    out.push(F(T([[cx + 15, cy + 22], [cx + 17, cy + 21], [cx + 22 + k * 5, 33], [cx + 18 + k * 4, 34]], '#c8864a')), F(O(cx + 22 + k * 5, 34, 4 * k, 1.4 * k, 0, '#d89a5a', 12)));
    for (let i = 0; i < 3; i++) out.push(F(E(cx + 20 + i * 3, 28 - k * 6 - i * 2, 1.6, 1.2, '#ffffff')));
  }
  if (A?.hit) out.push(...star(cx + 26, 32, 3, '#fff6a8'));
  if (!dead && !A) out.push(...bubbles(cx + 15, cy + 15, q, 2, 0.7));
  return { w: 42, h: 38, res: 3, shapes: out };
}

export const ART = {
  porcelaindoll: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [70, 220, 180], draw: doll },
  ghostmaid: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 26, atkMs: [60, 210, 170], draw: maid },
  candlebride: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [80, 260, 200], draw: candle },
  topiarydryad: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 24, atkMs: [60, 200, 160], draw: swan },
  lanternghost: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [60, 220, 170], draw: wisp },
  armourknight: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [80, 260, 200], draw: armour },
  teahatter: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 240, 180], draw: teapot },
};

export const INFO = {
  porcelaindoll: { name: 'Porcelain Doll', w: 24, h: 36 },
  ghostmaid: { name: 'Ghost Maid', w: 26, h: 32 },
  candlebride: { name: 'Candle Bride', w: 24, h: 38 },
  topiarydryad: { name: 'Topiary Swan', w: 28, h: 34 },
  lanternghost: { name: 'Lantern Wisp', w: 26, h: 34 },
  armourknight: { name: 'Armour Knight', w: 28, h: 36 },
  teahatter: { name: 'Tea Party Hatter', w: 28, h: 36 },
};
