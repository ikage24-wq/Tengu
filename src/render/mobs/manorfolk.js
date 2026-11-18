// Monster art: the Moonlit Manor's residents (the levels 15-20 group dungeon, see
// docs/design/moonlit-manor.md). Redrawn creature-first (2026-11-03, the dungeon monster redesign:
// chibi creatures with their own silhouettes; the old costumed girls on the manor rig are retired,
// the rig itself stays for the other dungeons that still use it).
//   porcelaindoll  Porcelain Doll: a wind-up china bunny with a parasol (manorrigs.js, remade 2026-11-18)
//   ghostmaid      Ghost Maid: a little ghost cat maid with a feather duster (manorrigs.js, 2026-11-18)
//   candlebride    Candle Bride: a living candle in a bridal veil, her flame for hair; it flares up.
//   topiarydryad   Topiary Swan: a hedge clipped into a swan, a rose on its head (manorrigs.js, 2026-11-18)
//   lanternghost   Lantern Wisp: a flame spirit living in an iron lantern (manorrigs.js, 2026-11-18)
//   armourknight   Armour Knight: a small empty suit of armour, its helm too big, eyes glowing
//                  inside; clanks along and slashes.
//   teahatter      Tea Party Hatter: a round teapot in a top hat on a saucer (manorrigs.js, 2026-11-18)
//   pumpkinbutler  Pumpkin Butler: Lady Marigold's staff, who cut in on her waltz (manorrigs.js, 2026-11-18)
// Every design faces right, its lowest point on the bottom edge. Attacks are four frames:
// wind-up (the tell), strike, impact, recover.

import { E, T, F, R, mix, ramp, crescent, shine, smear, chain, wave, breath, sway, TAU, D2R, O, arcPts, limb, spin, strand, star, cuteFace, blob, bubbles } from './critter.js';
import { swanRig, swanStill, wispRig, wispStill, dollRig, dollStill, maidRig, maidStill, teapotRig, teapotStill, butlerRig, butlerStill } from './manorrigs.js';

const frames = (pose) => (pose === 'walk' ? 8 : pose === 'attack' ? 4 : 6);
const phase = (pose, f) => f / frames(pose);
// A flame: a teardrop flickering by phase.
export function flame(x, y, h, q, outer = '#ff9a3a', inner = '#ffe36b') {
  const w = h * 0.42;
  const lean = Math.sin(q * TAU * 3) * h * 0.12;
  return [F(T([[x - w, y], [x - w * 0.9, y - h * 0.45], [x + lean, y - h], [x + w * 0.9, y - h * 0.5], [x + w, y], [x, y + w * 0.6]], outer)), F(T([[x - w * 0.5, y], [x - w * 0.4, y - h * 0.4], [x + lean * 0.6, y - h * 0.7], [x + w * 0.45, y - h * 0.35], [x + w * 0.5, y]], inner)), F(E(x, y - h * 0.15, w * 0.3, w * 0.35, '#ffffff'))];
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

export const ART = {
  porcelaindoll: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [70, 220, 180], draw: dollStill, rig: dollRig },
  ghostmaid: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 26, atkMs: [60, 210, 170], draw: maidStill, rig: maidRig },
  candlebride: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [80, 260, 200], draw: candle },
  topiarydryad: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 24, atkMs: [60, 200, 160], draw: swanStill, rig: swanRig },
  lanternghost: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [60, 220, 170], draw: wispStill, rig: wispRig },
  armourknight: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [80, 260, 200], draw: armour },
  teahatter: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 240, 180], draw: teapotStill, rig: teapotRig },
  pumpkinbutler: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 12, atkMs: [70, 240, 180], draw: butlerStill, rig: butlerRig },
};

export const INFO = {
  porcelaindoll: { name: 'Porcelain Doll', w: 24, h: 36 },
  ghostmaid: { name: 'Ghost Maid', w: 26, h: 32 },
  candlebride: { name: 'Candle Bride', w: 24, h: 38 },
  topiarydryad: { name: 'Topiary Swan', w: 28, h: 34 },
  lanternghost: { name: 'Lantern Wisp', w: 26, h: 34 },
  armourknight: { name: 'Armour Knight', w: 28, h: 36 },
  teahatter: { name: 'Tea Party Hatter', w: 28, h: 36 },
  pumpkinbutler: { name: 'Pumpkin Butler', w: 28, h: 40 },
};
