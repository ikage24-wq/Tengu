// Monster art: the Sunken Aquarium Palace's swimmers (the levels 20-25 group dungeon, see
// docs/design/aquarium-palace.md). Redrawn creature-first (2026-11-03, the player's call: the old
// costumed girls on one tall rig read as clunky): chibi sea creatures in the field monsters' style,
// each its own silhouette so a room reads at a glance.
//   jellymaid      Jelly Belle: a round jelly bell with a face, a scalloped rim and ribbon
//                  tentacles; drifts with a pulse, lashes two stinging ribbons.
//   seahorseknight Seahorse Squire: a chubby seahorse in a little plumed helmet with a lance;
//                  bounces on its curled tail, springs forward in a thrust.
//   anglerlamp     Lantern Angler: a round anglerfish with a toothy grin and a glowing lure;
//                  the lure flashes, then it lunges and chomps.
//   pearldiver     Pearl Otter: an otter in a glass bubble helmet hugging a pearl; swims with
//                  little kicks, winds up and throws the pearl.
//   stardancer     Star Twirler: a starfish standing on two of its arms with a bow; skips along on
//                  tiptoe and cartwheels into a spinning slap.
//   octoscholar    Octo Scholar: a round octopus in glasses and a mortarboard, a book in one arm;
//                  walks on curling arms, flings the book in a puff of ink.
// Every design faces right, its lowest point on the bottom edge. Attacks are four frames:
// wind-up (the tell), strike, impact, recover.

import { E, T, F, mix, ramp, crescent, shine, smear, chain, wave, breath, sway, TAU, D2R, O, arcPts, limb, spin, strand, star, bubbles, ink, cuteFace, blob } from './critter.js';

const frames = (pose) => (pose === 'walk' ? 8 : pose === 'attack' ? 4 : 6);
const phase = (pose, f) => f / frames(pose);

// ---------- Jelly Belle ----------

// Attack keys: dx/dy body shift, tilt (deg), lash (the two front ribbons whipping forward), zap:
// sparks at the ribbon tips, pulse: the bell's rim.
const JELLY_ATK = [
  { dx: -2.4, dy: 1.2, tilt: -14, lash: -0.4, zap: 0, pulse: 1 },
  { dx: 3.2, dy: -0.6, tilt: 16, lash: 1, zap: 0.6, pulse: 0 },
  { dx: 3.6, dy: -0.4, tilt: 12, lash: 1.1, zap: 1, pulse: 0.2 },
  { dx: 0.6, dy: 0.2, tilt: 2, lash: 0.2, zap: 0, pulse: 0.6 },
];

function jelly(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? JELLY_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const bell = ramp('#ffb3dc', { step: 10, turn: 14, sat: -6 });
  const inner = '#ffe2f2';
  const ribA = ramp('#c9b6ff', { step: 10 });
  const ribB = ramp('#9fe8ff', { step: 10 });
  // She hovers: a slow bob on the drift's beat, the rim opening and closing (the pulse that swims).
  const pulse = A ? A.pulse : walk ? 0.5 + 0.5 * Math.sin(TAU * q * 2) : breath(q);
  const bob = dead ? 0 : (walk ? Math.sin(TAU * q * 2 - 0.6) * 1.4 : -breath(q) * 1.2) + (A ? A.dy : 0);
  const cx = 18 + (A ? A.dx : 0);
  const cy = dead ? 34 : 15 + bob;
  const tilt = dead ? 78 : A ? A.tilt : walk ? 7 + Math.sin(TAU * q * 2) * 3 : sway(q) * 3;
  const rx = 12 + pulse * 1.1;
  const ry = 10 - pulse * 0.7;
  const out = [];
  // Ribbon tentacles from under the rim, trailing back as she drifts; the front two whip forward
  // on the lash.
  const rimY = cy + 5.4;
  const ribbons = [[-8, ribB, 0], [-4.4, ribA, 0.9], [-0.6, ribB, 1.8], [3, ribA, 2.6], [6.4, ribB, 3.3]];
  ribbons.forEach(([dx, r, ph], i) => {
    const front = i >= 3;
    const lash = A && front ? A.lash : 0;
    const base = dead ? 0 : lash > 0 ? 100 - lash * 105 : 98 + (walk ? 12 : 6) - lash * 30;
    const amp = dead ? 0 : lash > 0.5 ? 6 : walk ? 26 : 16;
    const len = lash > 0.5 ? 4.6 : 3.6 + (i % 2) * 0.4;
    const j = chain(cx + dx, rimY, base, [len, len, len, len - 0.4, len - 0.8], dead ? () => 8 : wave(TAU * q * (walk ? 2 : 1) + ph, amp, 0.9, 0.15));
    out.push(strand(j, (t) => 2.2 * (1 - t * 0.7), r.base), strand(j.map(([x, y]) => [x + 0.4, y + 0.3]), (t) => 0.8 * (1 - t), r.sh));
    if (A?.zap && front) {
      const tip = j.at(-1);
      out.push(...star(tip[0] + 1, tip[1], 2.4 * A.zap, '#fff6a8'), ...star(tip[0] - 2, tip[1] - 2.4, 1.4 * A.zap, '#bff6ff'));
    }
  });
  // Frilly oral arms in the middle, short and ruffled.
  for (const [dx, l] of [[-2, 7], [1.6, 8.4]]) {
    const j = chain(cx + dx, rimY - 0.6, dead ? 0 : 92, [l / 3, l / 3, l / 3], dead ? () => 6 : wave(TAU * q + dx, 14, 0.8));
    out.push(strand(j, (t) => 3 * (1 - t * 0.4), mix(bell.base, '#ffffff', 0.35)));
    for (const p of j.slice(1)) out.push(F(E(p[0] + 1, p[1], 1.2, 0.8, bell.hi)));
  }
  // The bell: a dome with a lighter heart, a scalloped rim, freckle spots and a shine.
  const body = [];
  const dome = arcPts(cx, cy + 4, rx, ry + 3, 180, 360, 18);
  body.push(T([...dome, [cx + rx, cy + 5], [cx - rx, cy + 5]], bell.base));
  body.push(crescent(cx, cy + 4, rx, ry + 3, bell.sh, { k: 0.26, a0: 150, a1: 250 }));
  body.push(F(O(cx + 1, cy, rx * 0.6, ry * 0.55, 0, inner, 16)));
  for (let i = 0; i < 8; i++) {
    const x = cx - rx + 1.5 + (i * (rx * 2 - 3)) / 7;
    body.push(E(x, cy + 5.2, 1.9, 1.4, i % 2 ? bell.base : bell.sh));
  }
  for (const [x, y, r] of [[-6, -1.6, 0.9], [-3.4, -4.4, 0.7], [5.4, -3.6, 0.8], [7.4, 0.2, 0.6]]) body.push(F(E(cx + x, cy + y, r, r, '#ffffff')));
  body.push(shine(cx + 2, cy + 1, rx * 0.8, ry * 0.7, mix(bell.hi, '#ffffff', 0.5), -10, 0.8));
  // Her face, low on the bell's front.
  body.push(...cuteFace(cx + 1.4, cy + 0.6, 0.95, mood, { iris: '#ff7ab8', lip: '#c04a8a', gap: 5, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: inner, mouthDy: 2.8 }));
  out.push(...spin(body, cx, cy + 4, tilt));
  if (A && f === 1) out.push(smear([[cx - 6, cy + 10], [cx + 4, cy + 12], [cx + 16, cy + 9]], 3, '#fff0fa'));
  if (!dead) out.push(...bubbles(cx - 9, cy - 4, q, 2, 0.8));
  return { w: 36, h: 44, res: 3, shapes: out };
}

// ---------- Seahorse Squire ----------

const HORSE_ATK = [
  { dx: -2.6, dy: 2.2, lance: -30, coil: 1.4, lean: -8, back: 4 },
  { dx: 4.4, dy: -1.6, lance: 4, coil: -0.6, lean: 10, back: -3 },
  { dx: 5, dy: -1, lance: 2, coil: -0.4, lean: 8, back: -4, hit: 1 },
  { dx: 1, dy: 0.4, lance: -8, coil: 0.4, lean: 0, back: 0 },
];

// A short curved band (a belly plate).
const arcBand = (x, y, w, c) => T([...arcPts(x, y, w, 1.2, 200, 340, 6), ...arcPts(x, y + 0.6, w * 0.9, 1, 340, 200, 6)], c);

function seahorse(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? HORSE_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const skin = ramp('#ffb070', { step: 10, turn: 14, sat: -4 });
  const belly = ramp('#ffe0a8', { step: 9 });
  const steel = ramp('#b8c8e8', { step: 12 });
  const plume = ramp('#ff6b8a', { step: 10 });
  // It bounces upright on its curled tail: a hop each half cycle, the coil squeezing as it lands.
  const hop = walk ? Math.abs(Math.sin(TAU * q * 2)) : 0;
  const coil = A ? A.coil : walk ? (1 - hop) * 1.2 : breath(q) * 0.6;
  const bx = 16 + (A ? A.dx : 0);
  const by = (A ? A.dy : 0) - hop * 3.4 + (pose === 'idle' ? -breath(q) * 0.8 : 0);
  const lean = dead ? 90 : A ? A.lean : walk ? 4 : sway(q) * 2;
  const out = [];
  const body = [];
  // The curled tail: down from the belly, spiralling forward at the floor.
  const tail = chain(bx - 2, by + 30, 92, [3, 3, 2.8, 2.6, 2.2, 1.8, 1.4], (i) => (i ? 34 + coil * 6 + (dead ? -20 : 0) : 0));
  body.push(strand(tail, (t) => 6.4 * (1 - t * 0.78), skin.base), strand(tail.map(([x, y]) => [x - 0.6, y + 0.4]), (t) => 2.2 * (1 - t), skin.sh));
  for (const p of tail.slice(1, 5)) body.push(F(E(p[0] + 0.6, p[1], 1.6, 0.5, skin.hi)));
  // Dorsal fin fluttering on its back.
  const fin = [];
  for (let i = 0; i < 5; i++) {
    const a = 180 + 16 * Math.sin(TAU * q * 3 + i * 0.9);
    fin.push([bx - 7.4 + Math.cos(a * D2R) * 4.4, by + 18 + i * 2.2 + Math.sin(a * D2R) * 1.4 - 1.4]);
  }
  body.push(T([[bx - 6, by + 17], ...fin, [bx - 6, by + 28]], mix(skin.base, '#ffe6b0', 0.4)));
  for (let i = 0; i < 4; i++) body.push(F(T([[bx - 6, by + 18 + i * 2.4], [fin[i][0] + 0.6, fin[i][1]], [bx - 6, by + 19 + i * 2.4]], skin.sh)));
  // Belly and chest: a round pot belly with ridged plates.
  body.push(...blob(bx, by + 22, 7.4, 9, skin));
  body.push(F(O(bx + 3, by + 23, 3.6, 7.2, -8, belly.base, 16)));
  for (let i = 0; i < 4; i++) body.push(F(arcBand(bx + 3.4, by + 18 + i * 3, 3.2, belly.sh)));
  // The head: a big round head on a short neck, the tube snout out front.
  const hx = bx + 2;
  const hy = by + 10;
  body.push(...limb([hx + 5, hy + 1.4], [hx + 12, hy + 2.2], 4.2, 3.2, skin.base), F(E(hx + 12.4, hy + 2.2, 1.6, 1.8, skin.sh)), F(E(hx + 12.8, hy + 2.2, 0.7, 0.9, '#8a3a3a')));
  body.push(...blob(hx, hy, 7.6, 7, skin));
  const atk = A ? (f === 1 || f === 2 ? 1 : 0.4) : 0;
  body.push(...cuteFace(hx + 3, hy + 0.4, 1, mood, { iris: '#3a7ad8', gap: 3.4, atk, skin: skin.base, mouthDy: 3.4 }));
  // The helmet: a round steel dome on the back of the head, a red plume.
  body.push(T([...arcPts(hx - 0.6, hy - 1, 8.2, 7.6, 160, 300, 14), [hx - 0.6, hy - 1]], steel.base), F(T([...arcPts(hx - 0.6, hy - 1, 8.2, 7.6, 160, 205, 6), [hx - 2, hy - 1]], steel.sh)));
  body.push(F(T([...arcPts(hx - 0.6, hy - 1, 8.4, 7.8, 238, 290, 6), ...arcPts(hx - 0.6, hy - 1, 6.6, 6, 290, 238, 6)], steel.hi)));
  body.push(F(E(hx - 0.4, hy - 8.4, 1.2, 1.2, '#ffd36b')));
  const pl = chain(hx - 1, hy - 8.6, -120, [2.6, 2.6, 2.4, 2], dead ? () => 10 : wave(TAU * q * 2 - 1, walk ? 22 : 12, 0.8));
  body.push(strand(pl, (t) => 3.2 * (1 - t * 0.6), plume.base), strand(pl.map(([x, y]) => [x + 0.4, y + 0.6]), (t) => 1.2 * (1 - t), plume.sh));
  // The lance, held under the pectoral fin: a striped cone with a guard.
  // (Held low under the snout, tilted up a little; drawn back for the wind-up, thrust on the strike.)
  const la = (A ? A.lance : -12 + (walk ? Math.sin(TAU * q * 2) * 4 : 0)) + (dead ? 70 : 0);
  const gx = bx + 6 - (A ? A.back : 0);
  const gy = by + 24;
  const tipx = gx + Math.cos(la * D2R) * 20;
  const tipy = gy + Math.sin(la * D2R) * 20;
  const nx = -Math.sin(la * D2R);
  const ny = Math.cos(la * D2R);
  body.push(T([[gx + nx * 2.4, gy + ny * 2.4], [tipx, tipy], [gx - nx * 2.4, gy - ny * 2.4]], '#fff4e6'));
  for (const t of [0.25, 0.5]) {
    const x = gx + (tipx - gx) * t;
    const y = gy + (tipy - gy) * t;
    const w = 2.4 * (1 - t);
    body.push(F(T([[x + nx * w, y + ny * w], [x + (tipx - gx) * 0.1 + nx * w * 0.8, y + (tipy - gy) * 0.1 + ny * w * 0.8], [x + (tipx - gx) * 0.1 - nx * w * 0.8, y + (tipy - gy) * 0.1 - ny * w * 0.8], [x - nx * w, y - ny * w]], '#ff8fa8')));
  }
  body.push(O(gx, gy, 1.2, 3.2, la, '#ffd36b'), F(E(gx - 1, gy + 0.6, 1.8, 1.4, skin.sh)));
  // (Dead, it topples over onto the floor.)
  out.push(...spin(body, bx, by + 30, lean).map((s) => s));
  if (A && f === 1) out.push(smear([[gx - 4, gy + 1], [gx + 8, gy], [tipx + 2, tipy]], 3.4, '#fff8ec'));
  if (A?.hit) out.push(...star(tipx + 2, tipy, 3, '#fff6a8'));
  return { w: 44, h: 46, res: 3, shapes: dead ? spin(out, bx, 44, 0).map((s) => s) : out };
}

// ---------- Lantern Angler ----------

const ANGLER_ATK = [
  { dx: -3, lean: -10, gape: 0.2, flash: 1 },
  { dx: 6, lean: 6, gape: 1, flash: 0.4 },
  { dx: 6.6, lean: 4, gape: 0, flash: 0.2, bite: 1 },
  { dx: 1.4, lean: 0, gape: 0.1, flash: 0 },
];

function angler(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? ANGLER_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const body = ramp('#4f5fb8', { step: 10, turn: 12, sat: 4 });
  const belly = ramp('#9fb8ff', { step: 9 });
  const fin = ramp('#7f9ae8', { step: 10 });
  const bob = dead ? 0 : walk ? Math.sin(TAU * q * 2) * 1.2 : -breath(q) * 1;
  const cx = 21 + (A ? A.dx : 0);
  const cy = dead ? 24 : 18 + bob;
  const lean = dead ? 170 : A ? A.lean : walk ? 4 + Math.sin(TAU * q * 2) * 2 : 0;
  const gape = dead ? 0.2 : A ? A.gape : mood === 'angry' ? 0.3 : 0.08;
  const out = [];
  // Tail fin and the little pectoral fin, fanning on the swim.
  const tw = Math.sin(TAU * q * 2) * (walk ? 18 : 8);
  out.push(...spin([T([[cx - 13, cy], [cx - 21, cy - 7], [cx - 19, cy], [cx - 21, cy + 7]], fin.base), F(T([[cx - 13, cy], [cx - 19, cy - 1], [cx - 21, cy + 7]], fin.sh))], cx - 13, cy, tw));
  // The body: a round ball with a pale belly and a few dark spots.
  out.push(...blob(cx, cy, 14, 12, body));
  out.push(F(T([...arcPts(cx + 1, cy + 1, 12.6, 10.6, 20, 160, 12), ...arcPts(cx + 1, cy + 5, 8, 5, 160, 20, 8)], belly.base)));
  for (const [x, y, r] of [[-6, -6, 1.4], [-9, -1, 1.1], [-2, -8.6, 1]]) out.push(F(E(cx + x, cy + y, r, r * 0.8, body.sh)));
  out.push(...spin([T([[cx - 1, cy + 4], [cx - 7, cy + 9], [cx - 2, cy + 8]], fin.base)], cx - 1, cy + 4, Math.sin(TAU * q * 3) * 18));
  // The mouth: a wide grin across the front, little teeth; on the lunge it opens wide.
  const mx = cx + 7;
  const my = cy + 3;
  const open = gape * 5;
  out.push(T([[mx - 4, my], [mx + 7, my - 1.4], [mx + 7.4, my + 0.4 + open], [mx + 1, my + 1.6 + open], [mx - 4, my + 0.6]], '#3a1a3a'));
  if (open > 1) out.push(F(E(mx + 2, my + open * 0.7, 3, 1.2, '#ff8fab')));
  for (let i = 0; i < 4; i++) {
    const tx = mx - 2 + i * 2.6;
    out.push(F(T([[tx, my - 0.4 - i * 0.3], [tx + 1.2, my - 0.4 - i * 0.3], [tx + 0.6, my + 1.2 - i * 0.3]], '#fffaf2')));
    if (open > 1) out.push(F(T([[tx, my + 1.4 + open - i * 0.2], [tx + 1.2, my + 1.4 + open - i * 0.2], [tx + 0.6, my - 0.2 + open - i * 0.2]], '#fffaf2')));
  }
  // Big cute eyes up front, and a blush (the grin is its mouth).
  out.push(...cuteFace(cx + 5, cy - 3.6, 1.15, mood, { iris: '#ffd36b', gap: 4.4, atk: A ? (f === 1 ? 1 : 0.5) : 0, skin: body.base, mouthDy: null }));
  // The lure: a stalk arching up and over, a glowing bulb that flashes.
  const stalk = chain(cx + 2, cy - 11, -96, [3.4, 3.4, 3.2, 3], dead ? () => 30 : (i) => (i ? 24 : 0) + Math.sin(TAU * q * 2 - i) * 6);
  const bulb = stalk.at(-1);
  out.push(strand(stalk, (t) => 1.4 * (1 - t * 0.4), body.sh));
  const fl = A ? A.flash : walk ? 0.2 + 0.2 * Math.sin(TAU * q * 4) : 0.15 + 0.15 * breath(q);
  out.push(F(E(bulb[0], bulb[1], 4 + fl * 4, 4 + fl * 4, mix('#fff6c8', '#ffffff', 0.2))), E(bulb[0], bulb[1], 2.6, 2.6, '#ffe36b'), F(E(bulb[0] - 0.7, bulb[1] - 0.7, 1.1, 1.1, '#ffffff')));
  if (fl > 0.8) out.push(...star(bulb[0] + 4, bulb[1] - 3, 2.6, '#fff6a8'), ...star(bulb[0] - 4, bulb[1] + 3, 1.6, '#fff6a8'));
  const shapes = spin(out, cx, cy, lean);
  if (A && f === 1) shapes.push(smear([[cx - 10, cy + 2], [cx, cy + 3], [cx + 18, cy + 3]], 4, '#cfe0ff'));
  if (A?.bite) shapes.push(...star(cx + 17, cy + 2, 3.2, '#fff6a8'));
  if (!dead) shapes.push(...bubbles(cx + 14, cy - 2, q, 2, 0.7));
  return { w: 50, h: 36, res: 3, shapes };
}

// ---------- Pearl Otter ----------

const OTTER_ATK = [
  { dx: -2, lean: -12, arm: -150, pearl: 1 },
  { dx: 2.6, lean: 10, arm: -20, pearl: 1, throw: 1 },
  { dx: 3, lean: 8, arm: 10, pearl: 0 },
  { dx: 0.6, lean: 0, arm: 40, pearl: 0 },
];

function otter(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? OTTER_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const fur = ramp('#b8845e', { step: 10, turn: 12, sat: -6 });
  const cream = ramp('#fff0dc', { step: 8 });
  const bob = dead ? 0 : walk ? Math.sin(TAU * q * 2) * 1.4 : -breath(q) * 0.9;
  const bx = 17 + (A ? A.dx : 0);
  const by = bob;
  const lean = dead ? 80 : A ? A.lean : walk ? 6 : sway(q) * 2;
  const out = [];
  // Tail: a flat paddle wagging behind, and the webbed feet kicking.
  const tail = chain(bx - 6, by + 26, 160, [3, 3, 2.6], dead ? () => 4 : wave(TAU * q * 2, walk ? 16 : 8));
  out.push(strand(tail, (t) => 4.2 * (1 - t * 0.4), fur.sh));
  for (const [ox, ph] of [[-2, 0], [3, 0.5]]) {
    const kick = walk ? Math.sin(TAU * (q + ph) * 2) * 3 : 0;
    out.push(...limb([bx + ox, by + 27], [bx + ox + 2 + kick * 0.4, by + 31 - Math.abs(kick) * 0.3], 3, 2.4, ox < 0 ? fur.sh : fur.base), F(E(bx + ox + 3 + kick * 0.4, by + 31.6, 2.2, 1, ox < 0 ? fur.deep : fur.sh)));
  }
  // Body: a round, soft body with a cream tummy.
  const body = [];
  body.push(...blob(bx, by + 21, 7.6, 8.4, fur));
  body.push(F(O(bx + 2, by + 22.4, 4.4, 6.4, -6, cream.base, 16)));
  // Head with its muzzle, ears, whiskers and nose.
  const hx = bx + 2;
  const hy = by + 10;
  body.push(E(hx - 5.6, hy - 5, 2, 1.8, fur.sh), E(hx + 4.2, hy - 5.6, 2, 1.8, fur.base), F(E(hx + 4.2, hy - 5.4, 1, 0.9, '#ffb8c8')));
  body.push(...blob(hx, hy, 7.6, 7, fur));
  body.push(F(O(hx + 3, hy + 2.6, 4.2, 3, 0, cream.base, 14)));
  body.push(F(E(hx + 6.4, hy + 1.4, 1.1, 0.8, '#4a2a2a')));
  for (const [dy, a] of [[0.8, -6], [2.2, 6]]) body.push(F(T([[hx + 6.4, hy + dy + 1], [hx + 10.4, hy + dy + 1 + a * 0.12], [hx + 10.4, hy + dy + 1.3 + a * 0.12], [hx + 6.4, hy + dy + 1.3]], '#fff6f0')));
  body.push(...cuteFace(hx + 1.6, hy - 0.6, 0.95, mood, { iris: '#6a3a2a', gap: 4.4, atk: A ? (f === 1 ? 1 : 0.4) : 0, skin: fur.base, mouthDy: 4 }));
  // The pearl, hugged to the chest, or held up behind for the throw.
  const arm = A ? A.arm : walk ? 30 + Math.sin(TAU * q * 2) * 6 : 34;
  const sx = bx + 3;
  const sy = by + 17;
  const hand = [sx + Math.cos(arm * D2R) * 6.4, sy + Math.sin(arm * D2R) * 6.4];
  body.push(...limb([sx, sy], hand, 3.2, 2.8, fur.base));
  if (!A || A.pearl) body.push(E(hand[0] + 1, hand[1] - 0.6, 2.8, 2.8, '#f8f4ff'), crescent(hand[0] + 1, hand[1] - 0.6, 2.8, 2.8, '#d8d0f0', { k: 0.3 }), F(E(hand[0], hand[1] - 1.6, 1, 0.8, '#ffffff')));
  body.push(...limb([bx - 2, by + 18], [bx + 2, by + 22], 2.8, 2.6, fur.sh));
  // The glass helmet round the head, its brass collar, a glint.
  const rim = arcPts(hx + 0.6, hy, 10.2, 10, 0, 360, 28);
  for (let i = 0; i < rim.length - 1; i++) body.push(F(T([rim[i], rim[i + 1], [hx + 0.6 + (rim[i + 1][0] - hx - 0.6) * 0.92, hy + (rim[i + 1][1] - hy) * 0.92], [hx + 0.6 + (rim[i][0] - hx - 0.6) * 0.92, hy + (rim[i][1] - hy) * 0.92]], '#cfeefa')));
  body.push(F(T([...arcPts(hx + 0.6, hy, 9, 8.8, 200, 250, 6), ...arcPts(hx + 0.6, hy, 7.6, 7.4, 250, 200, 6)], '#ffffff')));
  body.push(F(T([[hx - 6, hy + 8], [hx + 7, hy + 8], [hx + 6.4, hy + 10.4], [hx - 5.4, hy + 10.4]], '#e0b04a')), F(T([[hx - 5.4, hy + 9.4], [hx + 6.6, hy + 9.4], [hx + 6.4, hy + 10.4], [hx - 5.4, hy + 10.4]], '#b8862a')));
  out.push(...spin(body, bx, by + 30, lean));
  if (A?.throw) out.push(smear([[bx - 4, by + 4], [bx + 6, by + 6], [bx + 16, by + 12]], 3, '#ffffff'), E(bx + 18, by + 12, 2.8, 2.8, '#f8f4ff'), F(E(bx + 17.4, by + 11, 1, 0.8, '#ffffff')));
  if (!dead) out.push(...bubbles(hx + 2, by - 1, q, 3, 0.8));
  return { w: 40, h: 34, res: 3, shapes: out };
}

// ---------- Star Twirler ----------

const STAR_ATK = [
  { spin: -28, dy: 2.4, dx: -1.6, tuck: 1 },
  { spin: 150, dy: -4, dx: 3.4, tuck: 0.2 },
  { spin: 330, dy: -1.6, dx: 6, tuck: 0, hit: 1 },
  { spin: 360, dy: 0.4, dx: 2, tuck: 0.4 },
];

function starfish(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? STAR_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const skin = ramp('#ff9a7a', { step: 10, turn: 14, sat: -4 });
  const dot = '#ffe0c8';
  // She skips on tiptoe: a hop each step, her arms swinging, a little sway; idle, she sways.
  const hop = walk ? Math.abs(Math.sin(TAU * q * 2)) : 0;
  const cx = 18 + (A ? A.dx : 0);
  const cy = (dead ? 29 : 18) - hop * 3 + (A ? A.dy : 0) + (pose === 'idle' ? -breath(q) * 0.8 : 0);
  const rot = dead ? 90 : A ? A.spin : walk ? Math.sin(TAU * q * 2) * 8 : sway(q) * 4;
  const tuck = A ? A.tuck : 0;
  // Five arms: the head point, two arms, two legs: [angle, reach, kind].
  const swing = walk ? Math.sin(TAU * q * 2) * 18 : pose === 'idle' ? Math.sin(TAU * q) * 8 : 0;
  const arms = [
    [-90, 11.6, 0],
    [-18 - swing - tuck * 30, 11 - tuck * 3, 1],
    [198 + swing + tuck * 30, 11 - tuck * 3, 1],
    [62 + (walk ? -swing * 0.6 : 0) - tuck * 16, 13 - tuck * 3, 2],
    [118 + (walk ? -swing * 0.6 : 0) + tuck * 16, 13 - tuck * 3, 2],
  ];
  const body = [];
  for (const [a, len, kind] of arms) {
    const tip = [cx + Math.cos(a * D2R) * len, cy + Math.sin(a * D2R) * len];
    const far = kind && a > 90 && a < 270;
    body.push(...limb([cx, cy], tip, 8, 3.2, far ? skin.sh : skin.base));
    if (!far) body.push(F(E(cx + Math.cos(a * D2R) * len * 0.55 - 0.4, cy + Math.sin(a * D2R) * len * 0.55 - 0.6, 1.4, 0.8, skin.hi)));
    for (const u of [0.45, 0.72]) body.push(F(E(cx + Math.cos(a * D2R) * len * u, cy + Math.sin(a * D2R) * len * u + 0.6, 0.6, 0.6, dot)));
  }
  body.push(...blob(cx, cy, 6.4, 6, skin, { lit: 0.8 }));
  // A ruffled tutu round her middle and a bow on her head point.
  for (let i = 0; i < 7; i++) body.push(F(E(cx - 6 + i * 2, cy + 4.6 + (i % 2) * 0.4, 2, 1.4, i % 2 ? '#ffe6f4' : '#ffc6e2')));
  body.push(T([[cx - 0.4, cy - 11], [cx - 4.4, cy - 13.4], [cx - 4, cy - 9.4]], '#ff6b9a'), T([[cx + 0.4, cy - 11], [cx + 4.4, cy - 13.4], [cx + 4, cy - 9.4]], '#ff6b9a'), E(cx, cy - 11.2, 1.3, 1.3, '#ffb8d0'));
  body.push(...cuteFace(cx + 0.8, cy - 1.4, 0.85, mood, { iris: '#7a4ad8', gap: 4.2, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: skin.base, mouthDy: 3 }));
  const out = spin(body, cx, cy, rot);
  if (A && (f === 1 || f === 2)) out.push(smear(arcPts(cx, cy, 15, 15, rot - 120, rot - 10, 8), 4, '#ffe0d4'));
  if (A?.hit) out.push(...star(cx + 14, cy - 2, 3, '#fff6a8'));
  return { w: 40, h: 36, res: 3, shapes: out };
}

// ---------- Octo Scholar ----------

const OCTO_ATK = [
  { dx: -1.6, lean: -8, arm: -140, book: 1 },
  { dx: 2.4, lean: 8, arm: -20, book: 1, fling: 1 },
  { dx: 2.8, lean: 6, arm: 10, book: 0, puff: 1 },
  { dx: 0.6, lean: 0, arm: 30, book: 0 },
];

// An open book (blue cover, cream pages), turned by deg.
function book(x, y, deg) {
  const s = [T([[x - 5, y], [x, y + 1.6], [x + 5, y], [x + 5, y - 5], [x, y - 3.6], [x - 5, y - 5]], '#4f7ad8'), F(T([[x - 4.4, y - 0.6], [x - 0.2, y + 0.8], [x - 0.2, y - 3.8], [x - 4.4, y - 4.8]], '#fff8ec')), F(T([[x + 0.2, y + 0.8], [x + 4.4, y - 0.6], [x + 4.4, y - 4.8], [x + 0.2, y - 3.8]], '#f0e6d4'))];
  for (const k of [1, 2]) s.push(F(T([[x - 3.8, y - k * 1.4 - 0.6], [x - 0.8, y - k * 1.4 + 0.2], [x - 0.8, y - k * 1.4 + 0.6], [x - 3.8, y - k * 1.4 - 0.2]], '#c9b8a8')));
  return spin(s, x, y - 2, deg);
}

function octopus(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? OCTO_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const skin = ramp('#f58aa8', { step: 10, turn: 14, sat: -6 });
  const spot = '#ffd0dc';
  const cx = 19 + (A ? A.dx : 0);
  const rise = walk ? Math.abs(Math.sin(TAU * q * 2)) * 1.2 : pose === 'idle' ? breath(q) * 0.9 : 0;
  const cy = (dead ? 24 : 14) - rise;
  const lean = dead ? 0 : A ? A.lean : walk ? 4 + Math.sin(TAU * q * 2) * 3 : sway(q) * 2;
  const out = [];
  // Six curling arms under the mantle, stepping in turn, the tips rolled up.
  const roots = [[-8, 0], [-5, 0.33], [-1.6, 0.66], [1.8, 0.16], [5, 0.5], [8, 0.83]];
  roots.forEach(([dx, ph], i) => {
    const far = i % 2 === 0;
    const lift = walk ? Math.max(0, Math.sin(TAU * (q + ph))) * 3 : 0;
    const base = dead ? dx * 6 : 90 + dx * 4.4;
    const j = chain(cx + dx, cy + 9.4, base, [3.6, 3.6, 3.2, 2.6, 2], (k) => (k ? (dx > 0 ? -1 : 1) * (12 + k * 10) - lift * 4 : 0));
    out.push(strand(j, (t) => 4.4 * (1 - t * 0.72), far ? skin.sh : skin.base));
    if (!far) for (const p of j.slice(1, 4)) out.push(F(E(p[0] + 0.3, p[1] + 1.2, 0.8, 0.6, spot)));
  });
  // The mantle: a big round head, spots, its face.
  const body = [];
  body.push(...blob(cx, cy, 11.4, 10.4, skin));
  for (const [x, y, r] of [[-7, -4, 1.4], [-4, -8, 1.1], [-8.6, 1.4, 1]]) body.push(F(E(cx + x, cy + y, r, r * 0.8, spot)));
  body.push(...cuteFace(cx + 2, cy + 2, 1, mood, { iris: '#8a5ad8', gap: 5.6, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: skin.base, mouthDy: 3.6 }));
  // Round glasses over the eyes, and the mortarboard with its swinging tassel.
  for (const [ex, r] of [[cx - 0.8, 2.6], [cx + 4.8, 2.9]]) {
    const rim = arcPts(ex, cy + 2, r, r, 0, 360, 18);
    for (let i = 0; i < rim.length - 1; i++) body.push(F(T([rim[i], rim[i + 1], [ex + (rim[i + 1][0] - ex) * 0.82, cy + 2 + (rim[i + 1][1] - cy - 2) * 0.82], [ex + (rim[i][0] - ex) * 0.82, cy + 2 + (rim[i][1] - cy - 2) * 0.82]], '#5a3a6a')));
  }
  body.push(F(T([[cx + 1.6, cy + 1.6], [cx + 2.2, cy + 1.6], [cx + 2.2, cy + 2.2], [cx + 1.6, cy + 2.2]], '#5a3a6a')));
  body.push(T([[cx - 9, cy - 9.4], [cx + 1, cy - 13.4], [cx + 11, cy - 9.4], [cx + 1, cy - 5.4]], '#3a3060'), F(T([[cx + 1, cy - 5.4], [cx + 11, cy - 9.4], [cx + 11, cy - 8.2], [cx + 1, cy - 4.2]], '#2a2048')), E(cx + 1, cy - 9.6, 1.2, 0.8, '#ffd36b'));
  const ts = chain(cx + 1, cy - 9.6, 30, [3, 3, 2], dead ? () => 40 : wave(TAU * q * 2, 20, 0.8));
  body.push(strand(ts, 0.7, '#ffd36b'), F(E(ts.at(-1)[0], ts.at(-1)[1] + 0.6, 1, 1.4, '#ffd36b')));
  // The book arm: a front arm curling up holding an open book; thrown on the attack.
  const arm = A ? A.arm : walk ? -40 + Math.sin(TAU * q * 2) * 6 : -36 + sway(q) * 4;
  const ar = chain(cx + 7, cy + 6, arm + 60, [3, 3, 2.8], () => -18);
  body.push(strand(ar, (t) => 3.4 * (1 - t * 0.5), skin.base));
  const hand = ar.at(-1);
  if (!A || A.book) body.push(...book(hand[0] + 1, hand[1] - 2, A ? arm * 0.3 : -8 + Math.sin(TAU * q) * 4));
  out.push(...spin(body, cx, cy + 9, lean));
  if (A?.fling) out.push(smear([[cx, cy - 8], [cx + 10, cy - 6], [cx + 20, cy]], 3.4, '#e6e0ff'), ...book(cx + 22, cy, 30));
  if (A?.puff) out.push(...ink(cx + 13, cy + 5, 1.1), ...book(cx + 28, cy + 4, 70));
  return { w: 44, h: 38, res: 3, shapes: out };
}

export const ART = {
  jellymaid: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 220, 170], draw: jelly },
  seahorseknight: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [70, 220, 190], draw: seahorse },
  anglerlamp: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 24, atkMs: [70, 210, 170], draw: angler },
  pearldiver: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 26, atkMs: [80, 210, 170], draw: otter },
  stardancer: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 24, atkMs: [70, 180, 170], draw: starfish },
  octoscholar: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [70, 220, 180], draw: octopus },
};

export const INFO = {
  jellymaid: { name: 'Jelly Belle', w: 26, h: 34 },
  seahorseknight: { name: 'Seahorse Squire', w: 26, h: 42 },
  anglerlamp: { name: 'Lantern Angler', w: 34, h: 30 },
  pearldiver: { name: 'Pearl Otter', w: 26, h: 34 },
  stardancer: { name: 'Star Twirler', w: 26, h: 32 },
  octoscholar: { name: 'Octo Scholar', w: 30, h: 34 },
};
