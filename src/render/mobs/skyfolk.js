// Monster art: the folk of the Sky Whale's Back (the levels 45-50 group dungeon, see
// docs/design/sky-whale.md). Redrawn creature-first (2026-11-03, the dungeon monster redesign:
// chibi creatures with their own silhouettes; the costumed girls on the sky rig are retired).
// Everything loose streams back in the high wind.
//   kiterider       Kite Rider: a flying squirrel in goggles gliding on its own diamond membrane;
//                   a diving two-footed kick.
//   shepherdess     Cloud Shepherd: a corgi in a scarf with a crook, a little cloud lamb bobbing
//                   beside it; the crook hooks.
//   gunner          Sky Pirate Gunner: a seagull pirate in a tricorn and goggles with a
//                   bell-mouthed blunderbuss; a shot and a puff of smoke.
//   barnacleknight  Barnacle Knight: a walrus in barnacle-crusted armour with a coral lance; a heavy
//                   thrust.
//   harpist         Storm Harpist: a puffy dark storm cloud with lightning-bolt horns plucking a
//                   harp; a strum that cracks a bolt.
//   monk            Feather Monk: a round puffin in monk's robes with prayer beads; a palm strike
//                   that rings out a gust.
// Every design faces right, its lowest point on the bottom edge. Attacks are four frames:
// wind-up (the tell), strike, impact, recover.

import { E, T, F, R, mix, ramp, crescent, shine, smear, chain, wave, breath, sway, TAU, D2R, O, arcPts, limb, spin, strand, star, cuteFace, blob } from './critter.js';

const frames = (pose) => (pose === 'walk' ? 8 : pose === 'attack' ? 4 : 6);
const phase = (pose, f) => f / frames(pose);
// Wind lines streaking past behind a creature.
export function windLines(x, y, q, n = 3, len = 12) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const u = (q * 2 + i / n) % 1;
    const wx = x + 6 - u * 24;
    const wy = y + (i - 1) * 6;
    out.push(F(T([[wx, wy], [wx + len, wy - 0.4], [wx + len, wy + 0.4]], '#ffffff')));
  }
  return out;
}
// A soft puff of cloud.
export const cloudPuff = (x, y, r, c = '#ffffff') => [E(x - r * 0.7, y + r * 0.2, r * 0.7, r * 0.6, c), E(x + r * 0.7, y + r * 0.2, r * 0.7, r * 0.6, c), E(x, y - r * 0.2, r * 0.85, r * 0.8, c), F(E(x - r * 0.3, y - r * 0.5, r * 0.35, r * 0.2, '#ffffff'))];

// ---------- Kite Rider ----------

const SQUIRREL_ATK = [
  { dy: -8, dx: -4, tilt: -20, kick: 0 },
  { dy: 6, dx: 8, tilt: 34, kick: 1, smear: 1 },
  { dy: 8, dx: 10, tilt: 30, kick: 1, hit: 1 },
  { dy: 0, dx: 2, tilt: 4, kick: 0.2 },
];

function squirrel(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? SQUIRREL_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const fur = ramp('#c8946a', { step: 10, turn: 12 });
  const glide = walk ? Math.sin(TAU * q * 2) * 2 : -breath(q) * 1.6;
  const cx = 20 + (A ? A.dx : 0);
  const cy = (dead ? 26 : 16) + (A ? A.dy : glide);
  const tilt = dead ? 80 : A ? A.tilt : walk ? 8 : sway(q) * 4;
  const out = [];
  if (!dead) out.push(...windLines(cx - 8, cy + 2, q));
  const body = [];
  // The glide membrane: a diamond of fur stretched between paws, rippling.
  const rip = Math.sin(TAU * q * 3) * 1.4;
  body.push(T([[cx - 14, cy + 1 + rip], [cx, cy - 6], [cx + 12, cy + 1 - rip], [cx, cy + 9]], fur.sh), F(T([[cx - 12, cy + 1 + rip], [cx, cy - 4], [cx + 10, cy + 1 - rip], [cx, cy + 6]], mix(fur.base, '#fff0e0', 0.25))));
  for (const [x, y] of [[-14, 1], [12, 1], [-6, 7], [6, 7]]) body.push(E(cx + x, cy + y, 1.6, 1.4, fur.base));
  // A big fluffy tail streaming behind.
  const tl = chain(cx - 6, cy + 4, 170, [4, 4, 4], wave(TAU * q * 2, 14, 0.8));
  body.push(strand(tl, (t) => 7 * (1 - t * 0.2), fur.base), E(tl.at(-1)[0], tl.at(-1)[1], 4, 3.6, fur.hi));
  // Feet: tucked when gliding, both out in front for the kick.
  const k = A ? A.kick : 0;
  for (const dy of [3, 6]) body.push(...limb([cx + 4, cy + dy], [cx + 6 + k * 8, cy + dy + 2 - k * 1], 2, 1.8, fur.sh), E(cx + 7 + k * 8, cy + dy + 2 - k, 1.6, 1.2, '#4a2a2a'));
  // Head: round, big ears, goggles on the brow, a cream face.
  const hx = cx + 6;
  const hy = cy - 4;
  body.push(T([[hx - 5, hy - 3], [hx - 6, hy - 10], [hx - 1, hy - 5]], fur.sh), T([[hx + 2, hy - 4], [hx + 3, hy - 11], [hx + 6, hy - 4]], fur.base));
  body.push(...blob(hx, hy, 6.6, 6, fur), F(O(hx + 2, hy + 2, 4, 3, 0, '#fff0e0', 12)), E(hx + 6, hy + 1, 1, 0.8, '#4a2a2a'));
  body.push(...cuteFace(hx + 1, hy, 0.85, mood, { iris: '#3a2a1a', gap: 4, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: fur.base, mouthDy: 3.2 }));
  body.push(R(hx - 6, hy - 5, 12, 2, '#5a4a3a'), E(hx - 1, hy - 4.6, 2.2, 2, '#9fe0ff'), E(hx + 3.6, hy - 4.6, 2.2, 2, '#9fe0ff'), F(E(hx - 1.6, hy - 5.2, 0.7, 0.6, '#ffffff')));
  out.push(...spin(body, cx, cy, tilt));
  if (A?.smear) out.push(smear([[cx - 14, cy - 14], [cx, cy - 2], [cx + 14, cy + 10]], 5, '#fff0e0'));
  if (A?.hit) out.push(...star(cx + 16, cy + 12, 3.2, '#fff6a8'));
  return { w: 46, h: 38, res: 3, shapes: dead ? spin(out, cx, 36, 0) : out };
}

// ---------- Cloud Shepherd ----------

const CORGI_ATK = [
  { crook: -150, lean: -8 },
  { crook: -20, lean: 12, smear: 1 },
  { crook: 20, lean: 14, hit: 1 },
  { crook: -60, lean: 0 },
];

function corgi(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? CORGI_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const fur = ramp('#f0a050', { step: 10, turn: 12 });
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 22;
  const cy = (dead ? 10 : 0) - Math.abs(step) * 1;
  const lean = dead ? 86 : A ? A.lean : walk ? step * 3 : 0;
  const out = [];
  // The little cloud lamb bobbing along beside it.
  if (!dead) {
    const lx = cx - 14;
    const ly = 20 + Math.sin(TAU * q * 2 + 1) * 2;
    out.push(...cloudPuff(lx, ly, 5), E(lx + 4, ly - 1, 2.4, 2.2, '#fff4f0'), F(E(lx + 5, ly - 1.4, 0.5, 0.6, '#3a2a3a')), ...limb([lx - 2, ly + 4], [lx - 2, ly + 7], 0.8, 0.8, '#7a6a7a'), ...limb([lx + 2, ly + 4], [lx + 2, ly + 7], 0.8, 0.8, '#7a6a7a'));
  }
  const body = [];
  // A long low corgi on stubby legs, standing up on its hind legs, a fluffy cream chest.
  for (const [ox, s, c] of [[-3, step, fur.sh], [3, -step, fur.base]]) body.push(...limb([cx + ox, cy + 26], [cx + ox + Math.max(0, s) * 2, 34 - Math.max(0, s) * 1.6], 3.4, 3.2, c), O(cx + ox + 1 + Math.max(0, s) * 2, 34.6 - Math.max(0, s) * 1.6, 2.6, 1.4, 0, '#fff4e0', 12));
  body.push(E(cx - 9, cy + 22, 3.4, 3, '#fff4e0'));
  body.push(...blob(cx, cy + 20, 9, 8.4, fur), F(O(cx + 3, cy + 21, 5.4, 6.4, 0, '#fff4e0', 16)));
  // The scarf streaming in the wind.
  const sc = chain(cx - 3, cy + 12, 180, [4, 4, 4], wave(TAU * q * 2, 18, 0.8));
  body.push(R(cx - 6, cy + 11, 12, 3, '#4fb0e0'), strand(sc, 3, '#4fb0e0'));
  // Head: big pointy ears, a white blaze, a smiley muzzle.
  const hx = cx + 2;
  const hy = cy + 6;
  body.push(T([[hx - 6, hy - 3], [hx - 7, hy - 13], [hx - 1, hy - 6]], fur.sh), F(T([[hx - 5.4, hy - 4], [hx - 6, hy - 10], [hx - 2.6, hy - 6]], '#ffc8a8')), T([[hx + 3, hy - 5], [hx + 5, hy - 14], [hx + 8, hy - 4]], fur.base), F(T([[hx + 4, hy - 5], [hx + 5.4, hy - 11], [hx + 7, hy - 5]], '#ffc8a8')));
  body.push(...blob(hx, hy, 7.6, 6.6, fur), F(T([[hx + 1, hy - 6], [hx + 3, hy - 6], [hx + 5, hy + 4], [hx - 1, hy + 4]], '#fff4e0')), F(O(hx + 4, hy + 3, 4.4, 3, 0, '#fff4e0', 12)), E(hx + 7.6, hy + 1.6, 1.2, 1, '#3a2a2a'));
  body.push(...cuteFace(hx + 1.6, hy - 0.4, 0.9, mood, { iris: '#5a3a1a', gap: 4.4, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: fur.base, mouthDy: 3.6 }));
  // The crook.
  const ca = A ? A.crook : walk ? -70 + step * 6 : -70;
  const hand = [cx + 7, cy + 18];
  const dir = [Math.cos(ca * D2R), Math.sin(ca * D2R)];
  const top = [hand[0] + dir[0] * 16, hand[1] + dir[1] * 16];
  body.push(...limb([cx + 4, cy + 17], hand, 2.6, 2.4, fur.base), ...limb([hand[0] - dir[0] * 8, hand[1] - dir[1] * 8], top, 1.2, 1.2, '#a87a4a'), strand(arcPts(top[0] + 3, top[1], 3, 3, 180, 380, 8), 1.2, '#a87a4a'));
  out.push(...spin(body, cx, 34, lean));
  if (A?.smear) out.push(smear([[cx, cy - 4], [cx + 14, cy + 2], [top[0] + 4, top[1]]], 4, '#fff4e0'));
  if (A?.hit) out.push(...star(top[0] + 6, top[1], 3, '#fff6a8'));
  return { w: 46, h: 36, res: 3, shapes: out };
}

// ---------- Sky Pirate Gunner ----------

const GULL_ATK = [
  { aim: -8, recoil: 0, lean: -4 },
  { aim: -4, recoil: 1, lean: -10, fire: 1 },
  { aim: -12, recoil: 0.6, lean: -6, smoke: 1 },
  { aim: -6, recoil: 0, lean: 0, smoke: 0.5 },
];

function gull(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? GULL_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const white = ramp('#f4f6ff', { step: 9, turn: 14 });
  const grey = ramp('#a8b4c8', { step: 10 });
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 18;
  const cy = (dead ? 10 : 0) - Math.abs(step) * 1;
  const lean = dead ? 86 : A ? A.lean : walk ? step * 5 : 0;
  const out = [];
  const body = [];
  for (const [ox, s] of [[-3, step], [3, -step]]) body.push(...limb([cx + ox, cy + 27], [cx + ox + Math.max(0, s) * 2, 34 - Math.max(0, s) * 1.6], 1.4, 1.2, '#ffb040'), T([[cx + ox - 2 + Math.max(0, s) * 2, 34.6], [cx + ox + 3 + Math.max(0, s) * 2, 34.6], [cx + ox + 1 + Math.max(0, s) * 2, 33]], '#ffb040'));
  // A plump white gull, grey wings, a striped sailor shirt.
  body.push(T([[cx - 8, cy + 18], [cx - 15, cy + 22], [cx - 8, cy + 24]], grey.sh));
  body.push(...blob(cx, cy + 20, 9, 8.6, white), T([...arcPts(cx, cy + 22, 9, 7, -10, 190, 14)], '#ffffff'));
  for (let i = 0; i < 3; i++) body.push(F(T([...arcPts(cx, cy + 22, 9, 7, 10 + i * 50, 30 + i * 50, 4), [cx, cy + 22]], '#4f7ad8')));
  body.push(O(cx - 5, cy + 18, 6, 4, -20, grey.base, 14), F(O(cx - 6, cy + 17, 3, 1.6, -20, grey.hi, 10)));
  // Head: round, a yellow beak, a tricorn with goggles pushed up on it.
  const hx = cx + 2;
  const hy = cy + 7;
  body.push(...blob(hx, hy, 7, 6.4, white), T([[hx + 5, hy + 1], [hx + 12, hy + 2], [hx + 5, hy + 4]], '#ffc040'), F(E(hx + 11, hy + 2.6, 1, 0.8, '#ff6b4a')));
  body.push(...cuteFace(hx + 1, hy, 0.85, mood, { iris: '#3a3a5a', gap: 4, atk: A ? 1 : 0, skin: white.base, mouthDy: null }));
  body.push(T([[hx - 9, hy - 4], [hx, hy - 12], [hx + 9, hy - 4], [hx, hy - 6]], '#3a2a4a'), F(T([[hx - 8, hy - 4.6], [hx, hy - 11], [hx + 8, hy - 4.6], [hx, hy - 6.4]], '#4a3a5a')), F(R(hx - 5, hy - 7, 10, 1, '#e8b84a')));
  body.push(E(hx - 2, hy - 8.4, 2, 1.6, '#9fe0ff'), E(hx + 2.6, hy - 8.4, 2, 1.6, '#9fe0ff'), F(R(hx - 6, hy - 9, 12, 0.6, '#5a4a3a')));
  // The blunderbuss: a stubby gun with a flared bell mouth, recoiling.
  const ga = A ? A.aim : walk ? -4 + step * 4 : -4;
  const rc = A ? A.recoil * 3 : 0;
  const g0 = [cx + 2 - rc, cy + 21];
  const dir = [Math.cos(ga * D2R), Math.sin(ga * D2R)];
  const muzzle = [g0[0] + dir[0] * 16, g0[1] + dir[1] * 16];
  body.push(...limb([g0[0] - 4, g0[1] + 2], g0, 3, 2.6, '#8a5a3a'), ...limb(g0, muzzle, 2.4, 2.4, '#8a8aa0'), O(muzzle[0], muzzle[1], 2, 3.6, ga, '#a8a8c0', 12), F(O(muzzle[0] + 0.6, muzzle[1], 1, 2.4, ga, '#3a3a4a', 10)));
  body.push(E(cx + 4, cy + 22, 2.6, 2.2, grey.base));
  out.push(...spin(body, cx, 34, lean));
  if (A?.fire) out.push(F(E(muzzle[0] + 5, muzzle[1], 5, 3.6, '#ffe36b')), F(E(muzzle[0] + 4, muzzle[1], 2.6, 1.8, '#ffffff')), ...star(muzzle[0] + 10, muzzle[1], 3.4, '#ffb040'));
  if (A?.smoke) out.push(...cloudPuff(muzzle[0] + 8, muzzle[1] - 2, 4 * A.smoke + 1, '#d8d8e8'));
  return { w: 44, h: 36, res: 3, shapes: out };
}

// ---------- Barnacle Knight ----------

const WALRUS_ATK = [
  { lance: -30, back: 6, lean: -8 },
  { lance: -2, back: -6, lean: 12, smear: 1 },
  { lance: 0, back: -8, lean: 14, hit: 1 },
  { lance: -10, back: 0, lean: 2 },
];

function walrus(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? WALRUS_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const skin = ramp('#c89a8a', { step: 10, turn: 10 });
  const steel = ramp('#8aa0b8', { step: 11 });
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 20;
  const cy = (dead ? 8 : 0) - Math.abs(step) * 0.6;
  const lean = dead ? 86 : A ? A.lean : walk ? step * 3 : 0;
  const out = [];
  const body = [];
  // Flippers for feet, a heavy round body in barnacle-crusted plate.
  for (const [ox, s, c] of [[-5, step, skin.sh], [5, -step, skin.base]]) body.push(O(cx + ox + 2 + Math.max(0, s) * 2, 34.4 - Math.max(0, s) * 1.4, 5, 2, 0, c, 14));
  body.push(...blob(cx, cy + 22, 12, 11, skin));
  body.push(T([...arcPts(cx, cy + 22, 12, 11, 190, 360, 14), [cx + 12, cy + 26], [cx - 10, cy + 28]], steel.base), F(T([...arcPts(cx, cy + 22, 12, 11, 300, 360, 6), [cx + 12, cy + 26], [cx + 8, cy + 26]], steel.sh)));
  for (const [x, y, r] of [[-8, 16, 2], [-3, 13, 1.6], [6, 15, 1.8], [-6, 22, 1.4]]) body.push(E(cx + x, cy + y, r, r, '#e8e0d0'), F(E(cx + x, cy + y - 0.4, r * 0.4, r * 0.4, '#8a7a6a')));
  body.push(E(cx + 8, cy + 19, 2, 1.6, '#ff8a7a'), E(cx + 9.4, cy + 18, 1, 1.4, '#ff8a7a'));
  // Head: a round walrus head, bushy whiskers, two long tusks, a little helm.
  const hx = cx + 4;
  const hy = cy + 8;
  body.push(...blob(hx, hy, 8.4, 7.6, skin), E(hx + 4, hy + 3.6, 3.4, 2.6, skin.hi), E(hx + 7.4, hy + 3.6, 3.4, 2.6, skin.hi));
  for (let i = 0; i < 6; i++) body.push(F(E(hx + 3 + (i % 3) * 2, hy + 3 + Math.floor(i / 3) * 1.6, 0.4, 0.4, skin.deep)));
  body.push(...limb([hx + 4, hy + 6], [hx + 4.4, hy + 13], 1.8, 1, '#fffaf2'), ...limb([hx + 7, hy + 6], [hx + 7.4, hy + 13], 1.8, 1, '#fffaf2'));
  body.push(...cuteFace(hx + 2, hy - 1.4, 0.9, mood, { iris: '#2a3a5a', gap: 4.6, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: skin.base, mouthDy: null }));
  body.push(T([...arcPts(hx - 0.6, hy - 2, 8.6, 6.6, 190, 350, 12)], steel.base), F(E(hx - 1, hy - 8, 1.6, 1.6, '#ff8a7a')));
  // The coral lance: a branching pink spear.
  const la = A ? A.lance : -16 + step * 3;
  const hand = [cx + 10 - (A ? A.back : 0), cy + 22];
  const dir = [Math.cos(la * D2R), Math.sin(la * D2R)];
  const tip = [hand[0] + dir[0] * 20, hand[1] + dir[1] * 20];
  body.push(...limb([hand[0] - dir[0] * 6, hand[1] - dir[1] * 6], tip, 2.6, 1.4, '#ff7a8a'));
  for (const u of [0.4, 0.7]) {
    const bx = hand[0] + dir[0] * 20 * u;
    const by = hand[1] + dir[1] * 20 * u;
    body.push(...limb([bx, by], [bx + 2, by - 4], 1.4, 1, '#ff9aa8'));
  }
  body.push(O(hand[0], hand[1], 3, 2.6, 0, skin.base, 12));
  out.push(...spin(body, cx, 34, lean));
  if (A?.smear) out.push(smear([[cx - 4, cy + 22], [cx + 10, cy + 20], [tip[0] + 4, tip[1]]], 5, '#ffe6ea'));
  if (A?.hit) out.push(...star(tip[0] + 4, tip[1], 3.2, '#fff6a8'));
  return { w: 48, h: 38, res: 3, shapes: out };
}

// ---------- Storm Harpist ----------

const STORM_ATK = [
  { strum: -1, bolt: 0 },
  { strum: 1, bolt: 0.6 },
  { strum: 1, bolt: 1.2, hit: 1 },
  { strum: 0, bolt: 0.3 },
];

function storm(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? STORM_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const cloud = ramp('#7a88b0', { step: 10, turn: 10 });
  const bob = dead ? 0 : walk ? Math.sin(TAU * q * 2) * 1.6 : -breath(q) * 1.4;
  const cx = 18;
  const cy = (dead ? 28 : 16) + bob;
  const out = [];
  // Rain dripping from the cloud's underside.
  if (!dead) for (let i = 0; i < 4; i++) {
    const u = (q * 2 + i * 0.27) % 1;
    out.push(F(T([[cx - 7 + i * 5, cy + 9 + u * 14], [cx - 6.4 + i * 5, cy + 9 + u * 14], [cx - 6.7 + i * 5, cy + 12 + u * 14]], '#9fd0ff')));
  }
  // The puffy storm cloud body.
  for (const [dx, dy, r, c] of [[-7, 3, 6, cloud.sh], [7, 3, 6, cloud.base], [0, 4, 7, cloud.base], [-4, -2, 6, cloud.base], [4, -3, 6, cloud.hi], [0, -5, 5, cloud.hi]]) out.push(E(cx + dx, cy + dy, r, r * 0.9, c));
  // Lightning-bolt horns.
  for (const s of [-1, 1]) out.push(T([[cx + s * 4, cy - 8], [cx + s * 7, cy - 14], [cx + s * 5, cy - 13], [cx + s * 8, cy - 19], [cx + s * 3, cy - 12], [cx + s * 5, cy - 12.6], [cx + s * 2, cy - 8]], '#ffe36b'));
  out.push(...cuteFace(cx + 1.4, cy + 1, 0.95, mood, { iris: '#ffe36b', gap: 4.6, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: cloud.base, mouthDy: 3.4, blushOn: false }));
  // The harp held out front: a gold frame with strings of light, plucked.
  const hx = cx + 12;
  const hy = cy + 2;
  out.push(strand([[hx - 2, hy + 8], [hx - 3, hy - 4], [hx + 3, hy - 8], [hx + 6, hy - 4]], 1.6, '#e8b84a'), ...limb([hx - 2, hy + 8], [hx + 6, hy + 6], 1.4, 1.4, '#e8b84a'), ...limb([hx + 6, hy - 4], [hx + 6, hy + 6], 1.4, 1.4, '#e8b84a'));
  const pl = A ? A.strum : Math.sin(TAU * q * 2) * 0.3;
  for (let i = 0; i < 3; i++) out.push(F(strand([[hx - 1 + i * 2.4, hy - 3 - i], [hx - 1 + i * 2.4 + pl * (i === 1 ? 1 : 0.5), hy + 1.6], [hx - 1 + i * 2.4, hy + 7 - i * 0.4]], 0.5, '#fff6c8')));
  out.push(E(cx + 8, cy + 3, 2.4, 2.2, cloud.hi));
  if (A?.bolt) {
    const k = A.bolt;
    out.push(T([[hx + 8, hy - 4], [hx + 8 + 8 * k, hy - 1], [hx + 6 + 8 * k, hy], [hx + 10 + 14 * k, hy + 6], [hx + 6 + 8 * k, hy + 2], [hx + 8 + 8 * k, hy + 1], [hx + 6, hy - 2]], '#ffe36b'));
    out.push(...star(hx + 10 + 14 * k, hy + 6, 2.6 * k, '#ffffff'));
  }
  if (A?.hit) out.push(...star(hx + 26, hy + 6, 3, '#fff6a8'));
  return { w: 46, h: 40, res: 3, shapes: dead ? spin(out, cx, 36, 0) : out };
}

// ---------- Feather Monk ----------

const PUFFIN_ATK = [
  { palm: -0.4, lean: -10, gust: 0 },
  { palm: 1, lean: 12, gust: 0.6 },
  { palm: 1.1, lean: 12, gust: 1.3, hit: 1 },
  { palm: 0.2, lean: 2, gust: 0.4 },
];

function puffin(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? PUFFIN_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const black = ramp('#3a3a50', { step: 10, turn: 10 });
  const robe = ramp('#ff9a3a', { step: 10, turn: 10 });
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 18;
  const cy = (dead ? 10 : 0) - Math.abs(step) * 1;
  const lean = dead ? 86 : A ? A.lean : walk ? step * 4 : sway(q) * 2;
  const out = [];
  const body = [];
  for (const [ox, s] of [[-3, step], [3, -step]]) body.push(O(cx + ox + 1 + Math.max(0, s) * 2, 34.4 - Math.max(0, s) * 1.4, 3, 1.4, 0, '#ff8a3a', 12));
  // A round puffin body in an orange robe with a sash, prayer beads round the neck.
  body.push(...blob(cx, cy + 22, 9, 10, black), T([[cx - 6, cy + 14], [cx + 8, cy + 14], [cx + 10, cy + 32], [cx - 8, cy + 32]], robe.base), F(T([[cx + 5, cy + 14], [cx + 8, cy + 14], [cx + 10, cy + 32], [cx + 6, cy + 32]], robe.sh)));
  body.push(F(T([[cx - 6, cy + 16], [cx - 3, cy + 14], [cx + 8, cy + 28], [cx + 5, cy + 30]], '#c84a2a')));
  for (let i = 0; i < 7; i++) body.push(E(cx - 5 + i * 1.8, cy + 13 + Math.sin((i / 6) * Math.PI) * 2.4, 0.9, 0.9, '#8a5a3a'));
  // Head: a round puffin head, white cheeks, the big striped beak.
  const hx = cx + 1;
  const hy = cy + 7;
  body.push(...blob(hx, hy, 7.4, 6.8, black), F(O(hx + 2, hy + 1, 5.4, 4.6, 0, '#ffffff', 14)));
  body.push(T([[hx + 5, hy - 1], [hx + 11, hy + 1.4], [hx + 5, hy + 4.6]], '#ff6b3a'), F(T([[hx + 5, hy - 1], [hx + 7, hy - 0.2], [hx + 7, hy + 3.6], [hx + 5, hy + 4.6]], '#ffd36b')), F(T([[hx + 7.4, hy], [hx + 8, hy + 0.4], [hx + 8, hy + 3], [hx + 7.4, hy + 3.4]], '#3a3a50')));
  body.push(...cuteFace(hx + 1.4, hy - 0.4, 0.85, mood, { iris: '#3a3a50', gap: 3.8, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: '#ffffff', mouthDy: null }));
  body.push(F(T([[hx + 2.4, hy - 2], [hx + 3.4, hy - 3], [hx + 4.6, hy - 2]], '#ff6b3a')));
  // Wing-hands: one in prayer, the other thrusting a palm strike.
  const p = A ? A.palm : 0;
  body.push(O(cx - 7, cy + 20, 2.6, 4, 20, black.base, 12));
  body.push(...limb([cx + 5, cy + 18], [cx + 8 + p * 8, cy + 18 - p], 2.6, 2.2, black.base), O(cx + 9 + p * 8, cy + 18 - p, 2.2, 3, 0, black.hi, 10));
  out.push(...spin(body, cx, 34, lean));
  if (A?.gust) {
    const k = A.gust;
    for (let i = 0; i < 3; i++) out.push(F(T([...arcPts(cx + 20 + k * 4 * (i + 1), cy + 18, 3 * k * (i + 1) * 0.6, 5 * k * (i + 1) * 0.6, -60, 60, 8), ...arcPts(cx + 20 + k * 4 * (i + 1), cy + 18, 2 * k * (i + 1) * 0.6, 3.6 * k * (i + 1) * 0.6, 60, -60, 8)], '#e6f6ff')));
  }
  if (A?.hit) out.push(...star(cx + 30, cy + 18, 3, '#fff6a8'));
  return { w: 44, h: 36, res: 3, shapes: out };
}

export const ART = {
  kiterider: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 26, atkMs: [80, 240, 180], draw: squirrel },
  shepherdess: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [80, 240, 180], draw: corgi },
  gunner: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 220, 170], draw: gull },
  barnacleknight: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [100, 280, 200], draw: walrus },
  harpist: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [90, 260, 190], draw: storm },
  monk: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 220, 170], draw: puffin },
};

export const INFO = {
  kiterider: { name: 'Kite Rider', w: 28, h: 30 },
  shepherdess: { name: 'Cloud Shepherd', w: 26, h: 34 },
  gunner: { name: 'Sky Pirate Gunner', w: 26, h: 34 },
  barnacleknight: { name: 'Barnacle Knight', w: 30, h: 36 },
  harpist: { name: 'Storm Harpist', w: 28, h: 32 },
  monk: { name: 'Feather Monk', w: 26, h: 34 },
};
