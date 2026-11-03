// Monster art: the Star Observatory's sky-folk (the levels 30-35 group dungeon, see
// docs/design/star-observatory.md). Redrawn creature-first (2026-11-03, the dungeon monster
// redesign: chibi creatures with their own silhouettes; the costumed girls on the astral rig are
// retired). Little stars twinkle round each.
//   cometcourier   Comet Courier: a round sparrow with a postbag riding a comet tail; dashes in.
//   nebulawitch    Nebula Witch: a fluffy nebula-cloud puff in a pointed starry hat with a wand; a
//                  nebula burst.
//   starcarto      Star-chart Cartographer: a hermit crab living in a brass telescope, a rolled star
//                  chart under one claw; snaps its claw.
//   mothlibrarian  Moth Librarian: a fluffy round moth with feathery antennae and a little lamp; a
//                  puff of glittering scale dust.
//   meteorgolem    Meteor Golem: a round rock with glowing cracks and stubby fists; a heavy punch.
//   geminighosts   Gemini Ghosts: two tiny star-tipped ghosts holding hands; a twin spin.
// Every design faces right, its lowest point on the bottom edge. Attacks are four frames:
// wind-up (the tell), strike, impact, recover.

import { E, T, F, R, mix, ramp, crescent, shine, smear, chain, wave, breath, sway, TAU, D2R, O, arcPts, limb, spin, strand, star, cuteFace, blob } from './critter.js';

const frames = (pose) => (pose === 'walk' ? 8 : pose === 'attack' ? 4 : 6);
const phase = (pose, f) => f / frames(pose);
// A five-point star.
export function star5(x, y, r, c, deg = -90) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (deg + i * 36) * D2R;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return T(pts, c);
}
// A few little stars twinkling round a point, on the phase.
export function twinkles(x, y, q, n = 3, rad = 14) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + q * TAU * 0.5;
    const k = 0.5 + 0.5 * Math.sin(q * TAU * 2 + i * 2);
    if (k > 0.25) out.push(...star(x + Math.cos(a) * rad, y + Math.sin(a) * rad * 0.6, 1.4 * k + 0.4, '#fff6c8'));
  }
  return out;
}

// ---------- Comet Courier ----------

const COMET_ATK = [
  { dx: -4, lean: -12, trail: 0.4 },
  { dx: 10, lean: 14, trail: 1.6, smear: 1 },
  { dx: 12, lean: 12, trail: 1.4, hit: 1 },
  { dx: 3, lean: 2, trail: 0.6 },
];

function comet(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? COMET_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const feath = ramp('#8ab0ff', { step: 10, turn: 12 });
  const bob = dead ? 0 : walk ? Math.sin(TAU * q * 2) * 1.6 : -breath(q) * 1.4;
  const cx = 20 + (A ? A.dx : 0);
  const cy = (dead ? 28 : 18) + bob;
  const lean = dead ? 70 : A ? A.lean : walk ? 10 : sway(q) * 3;
  const out = [];
  // The comet tail it rides: a glowing streak of gold fading back, longer on the dash.
  const tl = (A ? A.trail : walk ? 1 : 0.5) * 16 + 10;
  out.push(F(T([[cx - 2, cy + 2], [cx - tl - 6, cy - 2], [cx - tl, cy + 4], [cx - tl - 4, cy + 9], [cx - 2, cy + 7]], '#ffe8a0')), F(T([[cx - 2, cy + 3], [cx - tl * 0.7, cy + 2], [cx - tl * 0.6, cy + 6], [cx - 2, cy + 6]], '#fff8dc')));
  for (let i = 0; i < 3; i++) out.push(...star(cx - tl * (0.4 + i * 0.25), cy + 4 + Math.sin(q * TAU * 2 + i) * 3, 1.2, '#ffffff'));
  const body = [];
  // A round sparrow: a fluffy body, a cream tummy, flapping wing, a little tail.
  body.push(T([[cx - 8, cy + 2], [cx - 14, cy - 2], [cx - 13, cy + 4]], feath.sh));
  body.push(...blob(cx, cy + 2, 9, 8, feath), F(O(cx + 3, cy + 5, 5, 4, 0, '#fff4e0', 14)));
  const flap = Math.sin(TAU * q * (walk ? 4 : 2));
  body.push(...spin([O(cx - 2, cy + 1, 6, 3.6, 0, feath.sh, 14), F(O(cx - 3, cy, 4, 2, 0, feath.base, 12))], cx + 2, cy, -20 + flap * 30));
  body.push(T([[cx + 8, cy], [cx + 12, cy + 1.4], [cx + 8, cy + 2.6]], '#ffb040'));
  body.push(...cuteFace(cx + 3, cy - 0.6, 0.85, mood, { iris: '#3a5ad8', gap: 4.2, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: feath.base, mouthDy: null }));
  // A postman's cap and a satchel with a star seal.
  body.push(T([...arcPts(cx + 1, cy - 4, 6, 4, 180, 360, 10)], '#3a4a8a'), R(cx + 1, cy - 4.6, 7, 1.4, '#2a3a7a'), F(E(cx, cy - 7, 1, 1, '#ffd36b')));
  body.push(R(cx - 6, cy + 5, 7, 6, '#c8864a'), F(R(cx - 6, cy + 5, 7, 2, '#a86a3a')), star5(cx - 2.6, cy + 8.6, 1.6, '#ffd36b'));
  out.push(...spin(body, cx, cy + 4, lean));
  if (A?.smear) out.push(smear([[cx - 20, cy + 4], [cx - 4, cy + 4], [cx + 14, cy + 2]], 6, '#fff4c8'));
  if (A?.hit) out.push(...star(cx + 14, cy + 1, 3.2, '#fff6a8'));
  if (!dead) out.push(...twinkles(cx, cy, q, 2, 14));
  return { w: 44, h: 36, res: 3, shapes: out };
}

// ---------- Nebula Witch ----------

const NEB_ATK = [
  { wand: -150, puff: 1.2, burst: 0 },
  { wand: -10, puff: 0.8, burst: 0.7 },
  { wand: 10, puff: 0.9, burst: 1.4, hit: 1 },
  { wand: -50, puff: 1, burst: 0.4 },
];

function nebula(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? NEB_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const cloud = ramp('#c9a6ff', { step: 10, turn: 14 });
  const bob = dead ? 0 : walk ? Math.sin(TAU * q * 2) * 1.6 : -breath(q) * 1.4;
  const cx = 18;
  const cy = (dead ? 28 : 20) + bob;
  const puff = A ? A.puff : 1 + breath(q) * 0.06;
  const out = [];
  // The body: a fluffy nebula cloud, overlapping puffs in pink and violet with stars caught in it.
  const puffs = [[-7, 3, 6, cloud.sh], [6, 4, 6, cloud.base], [0, 5, 7, cloud.base], [-4, -2, 6, cloud.base], [4, -2, 6, '#ffb8e8'], [0, -3, 6.4, cloud.hi]];
  for (const [dx, dy, r, c] of puffs) out.push(E(cx + dx * puff, cy + dy, r * puff, r * puff * 0.9, c));
  for (const [dx, dy] of [[-6, 4], [5, 6], [-1, 8]]) out.push(star5(cx + dx, cy + dy, 1.2, '#fff6c8'));
  out.push(...cuteFace(cx + 1.4, cy + 1, 0.95, mood, { iris: '#ff5ab8', gap: 4.6, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: cloud.base, mouthDy: 3.4, lash: 1.4, wing: 1.2 }));
  // The witch's hat: tall, bent at the tip, with a star band.
  const hat = [T([[cx - 9, cy - 6], [cx + 9, cy - 6], [cx + 3, cy - 18], [cx - 4, cy - 24], [cx - 2, cy - 16]], '#4a3a8a'), O(cx, cy - 6, 11, 2.4, 0, '#3a2a7a', 16), F(R(cx - 7, cy - 9, 13, 1.6, '#ffd36b')), star5(cx + 2, cy - 12, 1.8, '#fff6c8')];
  out.push(...spin(hat, cx, cy - 6, walk ? Math.sin(TAU * q * 2) * 4 : sway(q) * 3));
  // The wand in a little puff of an arm.
  const wa = A ? A.wand : walk ? -60 + Math.sin(TAU * q * 2) * 6 : -60;
  const hand = [cx + 9, cy + 2];
  const tip = [hand[0] + Math.cos(wa * D2R) * 10, hand[1] + Math.sin(wa * D2R) * 10];
  out.push(E(hand[0], hand[1], 2.6, 2.4, cloud.base), ...limb(hand, tip, 1, 1, '#ffe8a0'), star5(tip[0], tip[1], 2.4, '#ffd36b'));
  if (A?.burst) {
    const k = A.burst;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + q * 3;
      out.push(E(cx + 20 + Math.cos(a) * 6 * k, cy + Math.sin(a) * 5 * k, 2.6 * k, 2.2 * k, i % 2 ? '#ffb8e8' : '#c9a6ff'));
    }
    out.push(...star(cx + 20, cy, 3 * k, '#fff6a8'));
  }
  if (!dead) out.push(...twinkles(cx, cy, q, 3, 15));
  return { w: 44, h: 42, res: 3, shapes: dead ? spin(out, cx, 40, 0) : out };
}

// ---------- Telescope Crab (Star-chart Cartographer) ----------

const CRAB_ATK = [
  { claw: -40, open: 1, lean: -8 },
  { claw: 6, open: 1, lean: 10, smear: 1 },
  { claw: 8, open: 0, lean: 10, hit: 1 },
  { claw: -10, open: 0.4, lean: 0 },
];

function crab(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? CRAB_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const shell = ramp('#ff8a6a', { step: 10, turn: 12 });
  const brass = ramp('#e8b84a', { step: 10, turn: 10 });
  const cx = 20;
  const scut = walk ? Math.sin(TAU * q * 4) : 0;
  const cy = (dead ? 6 : 0) - Math.abs(scut) * 0.6;
  const lean = dead ? 180 : A ? A.lean : 0;
  const out = [];
  const body = [];
  // Scuttling legs, three a side, ticking fast.
  for (let i = 0; i < 3; i++) {
    const ph = i * 0.33;
    const lift = walk ? Math.max(0, Math.sin(TAU * (q * 2 + ph))) * 2 : 0;
    body.push(...limb([cx - 2 + i * 3, cy + 26], [cx - 6 + i * 5, cy + 30 - lift], 1.8, 1.6, shell.sh), ...limb([cx - 6 + i * 5, cy + 30 - lift], [cx - 7 + i * 5, 34 - lift], 1.6, 1.2, shell.sh));
  }
  // Its home: a brass telescope lying back over it, lenses glinting.
  body.push(...spin([R(cx - 20, cy + 12, 24, 10, brass.base), F(R(cx - 20, cy + 19, 24, 3, brass.sh)), R(cx - 24, cy + 11, 6, 12, brass.sh), O(cx - 24, cy + 17, 2, 6, 0, '#8fd0ff', 12), F(O(cx - 24.4, cy + 15, 0.8, 2, 0, '#ffffff', 8)), R(cx - 8, cy + 10.4, 2, 12.6, brass.deep), R(cx - 16, cy + 10.4, 2, 12.6, brass.deep)], cx - 6, cy + 18, -14));
  // The body peeking out, round and red, with stalk eyes.
  body.push(...blob(cx + 2, cy + 22, 8, 6, shell));
  for (const [dx, s] of [[-1, -1], [4, 1]]) {
    const st = chain(cx + dx, cy + 17, -90 + s * 10, [3, 3], () => (walk ? Math.sin(TAU * q * 2) * 6 : 0));
    body.push(strand(st, 1.2, shell.sh), E(st.at(-1)[0], st.at(-1)[1], 2.4, 2.4, '#ffffff'));
    if (mood === 'dead') body.push(F(T([[st.at(-1)[0] - 1, st.at(-1)[1] - 1], [st.at(-1)[0] + 1, st.at(-1)[1] + 1], [st.at(-1)[0] + 1.2, st.at(-1)[1] + 0.8], [st.at(-1)[0] - 0.8, st.at(-1)[1] - 1.2]], '#2a1a3a')));
    else body.push(E(st.at(-1)[0] + 0.6, st.at(-1)[1] + 0.2, 1.2, 1.4, A || mood === 'angry' ? '#c03a3a' : '#2a1a3a'), F(E(st.at(-1)[0] + 1, st.at(-1)[1] - 0.4, 0.5, 0.5, '#ffffff')));
  }
  // (Its eyes are the stalks; a little mouth and blush on the body.)
  body.push(F(T([...arcPts(cx + 5, cy + 23, 1.6, 1, 20, 160, 6)], '#8a2a3a')), F(E(cx + 1.6, cy + 22.6, 1.3, 0.7, '#ff9ab8')), F(E(cx + 8.4, cy + 22.6, 1.3, 0.7, '#ff9ab8')));
  // The big claw, opening for the wind-up and snapping shut on the strike; the chart in the other.
  const ca = A ? A.claw : walk ? -20 + scut * 4 : -20 + sway(q) * 4;
  const open = A ? A.open : 0.3;
  const sh = [cx + 8, cy + 21];
  const el = [sh[0] + Math.cos(ca * D2R) * 6, sh[1] + Math.sin(ca * D2R) * 6];
  body.push(...limb(sh, el, 2.6, 2.4, shell.base));
  body.push(...spin([O(el[0] + 5, el[1] - 1, 5, 3, 0, shell.base, 14), crescent(el[0] + 5, el[1] - 1, 5, 3, shell.sh, { k: 0.3 })], el[0], el[1], ca - open * 24));
  body.push(...spin([O(el[0] + 4, el[1] + 2, 4.4, 2, 0, shell.hi, 12)], el[0], el[1], ca + open * 24));
  body.push(R(cx - 4, cy + 22, 10, 3, '#fff4dc'), O(cx - 4, cy + 23.5, 1.4, 1.6, 0, '#f0e6d4', 8), O(cx + 6, cy + 23.5, 1.4, 1.6, 0, '#f0e6d4', 8), F(star5(cx + 1, cy + 23.5, 1, '#4f7ad8')));
  out.push(...spin(body, cx, dead ? 26 : 34, lean));
  if (A?.smear) out.push(smear([[cx + 6, cy + 14], [cx + 14, cy + 16], [cx + 22, cy + 20]], 3.4, '#ffe0d8'));
  if (A?.hit) out.push(...star(cx + 24, cy + 19, 3, '#fff6a8'));
  return { w: 46, h: 36, res: 3, shapes: out };
}

// ---------- Moth Librarian ----------

const MOTH_ATK = [
  { wings: 1, lean: -10, dust: 0 },
  { wings: -0.6, lean: 10, dust: 0.8 },
  { wings: -0.8, lean: 10, dust: 1.4, hit: 1 },
  { wings: 0.2, lean: 0, dust: 0.4 },
];

function moth(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? MOTH_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const fluff = ramp('#f4ecd8', { step: 9, turn: 12 });
  const wingC = ramp('#c9b6ff', { step: 10 });
  const flap = A ? A.wings : Math.sin(TAU * q * (walk ? 4 : 2));
  const bob = dead ? 0 : -Math.abs(flap) * 1.4 - (pose === 'idle' ? breath(q) : 0);
  const cx = 20;
  const cy = (dead ? 28 : 18) + bob;
  const lean = dead ? 80 : A ? A.lean : walk ? 6 : 0;
  const out = [];
  const body = [];
  // Wings: two big rounded pairs with eyespots, beating.
  for (const [s, c] of [[-1, wingC.sh], [1, wingC.base]]) {
    // Raised up over its back like a butterfly at rest, the near pair a little forward.
    const bx = cx - 3 + s * 3;
    const up = [O(bx - 2, cy - 10, 6, 10, -18, c, 18), F(E(bx - 3, cy - 13, 2.4, 2.4, '#ffd36b')), F(E(bx - 3, cy - 13, 1.1, 1.1, '#7a5ad8')), F(O(bx - 2, cy - 6, 4, 1, -18, mix(c, '#ffffff', 0.3), 10))];
    const dn = [O(bx - 6, cy + 2, 5, 4, 40, c, 16)];
    body.push(...spin([...up, ...dn], cx - 2, cy, flap * 22 * (s < 0 ? 1.2 : 1)));
  }
  // The fluffy round body, a fur ruff, little legs.
  body.push(...blob(cx, cy + 4, 8, 8.4, fluff));
  for (let i = 0; i < 6; i++) body.push(E(cx - 6 + i * 2.4, cy - 2 + Math.abs(2.5 - i) * 0.4, 2, 1.6, '#ffffff'));
  body.push(...cuteFace(cx + 1.6, cy + 3, 0.9, mood, { iris: '#7a5ad8', gap: 4.4, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: fluff.base, mouthDy: 3.2 }));
  // Feathery antennae.
  for (const [dx, a] of [[-2, -110], [3, -70]]) {
    const an = chain(cx + dx, cy - 4, a, [3, 3, 3], wave(TAU * q * 2, 10, 0.8));
    body.push(strand(an, 0.8, '#8a6a5a'));
    for (const p of an.slice(1)) body.push(F(O(p[0], p[1], 1.6, 0.6, a + 90, '#c8a888', 8)));
  }
  // Round spectacles and a little lamp held out.
  const lx = cx + 10;
  const ly = cy + 8 + Math.sin(TAU * q) * 1;
  body.push(...limb([cx + 6, cy + 6], [lx, ly - 4], 1.8, 1.6, fluff.sh), R(lx - 2, ly - 4, 4, 5, '#ffd36b'), F(R(lx - 1.2, ly - 3, 2.4, 3, '#fff6c8')), R(lx - 2.4, ly - 4.6, 4.8, 1, '#c8902a'));
  out.push(...spin(body, cx, cy + 4, lean));
  if (A?.dust) for (let i = 0; i < 10; i++) {
    const a = (-50 + i * 10) * D2R;
    const r = 6 + A.dust * 10 + (i % 3) * 2;
    out.push(F(E(cx + 10 + Math.cos(a) * r, cy + 2 + Math.sin(a) * r, 0.9, 0.9, i % 2 ? '#fff6c8' : '#e6dcff')));
  }
  if (A?.hit) out.push(...star(cx + 26, cy + 2, 3, '#fff6a8'));
  return { w: 46, h: 40, res: 3, shapes: out };
}

// ---------- Meteor Golem ----------

const ROCK_ATK = [
  { fist: [-8, -10], lean: -10, crouch: 2 },
  { fist: [14, 0], lean: 12, crouch: -1, smear: 1 },
  { fist: [16, 2], lean: 14, crouch: -1, hit: 1 },
  { fist: [6, 4], lean: 2, crouch: 0 },
];

function meteor(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? ROCK_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const rock = ramp('#8a7aa0', { step: 11, turn: 12 });
  const glow = '#ff9a4a';
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 20;
  const cy = (dead ? 6 : 0) + (A ? A.crouch : 0) - Math.abs(step) * 1;
  const lean = dead ? 70 : A ? A.lean : walk ? step * 6 : 0;
  const out = [];
  const body = [];
  for (const [ox, s, c] of [[-5, step, rock.sh], [5, -step, rock.base]]) body.push(O(cx + ox + Math.max(0, s) * 2, 34.6 - Math.max(0, s) * 1.6, 4.4, 2.6, 0, c, 14));
  // A big lumpy round rock with glowing cracks and a little crater or two.
  body.push(...blob(cx, cy + 20, 13, 12, rock), E(cx - 8, cy + 12, 4, 3, rock.base), E(cx + 8, cy + 11, 3.4, 2.8, rock.hi));
  for (const pts of [[[-8, 14], [-4, 18], [-6, 22]], [[6, 26], [9, 22], [12, 24]], [[-2, 28], [1, 30]]]) body.push(F(strand(pts.map(([x, y]) => [cx + x, cy + y]), 1.4, glow)));
  for (const [x, y, r] of [[-6, 24, 2], [9, 16, 1.6]]) body.push(F(E(cx + x, cy + y, r, r * 0.7, rock.deep)), F(E(cx + x + 0.4, cy + y - 0.4, r * 0.6, r * 0.3, rock.sh)));
  body.push(...cuteFace(cx + 3, cy + 18, 1.1, mood, { iris: glow, gap: 5.4, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: rock.base, mouthDy: 3.4, blushOn: false }));
  // Stubby rock fists, a heavy wind-up and a punch.
  const fo = A ? A.fist : [8 + step * 2, 6];
  body.push(O(cx - 13, cy + 24, 4.4, 4, 0, rock.sh, 14));
  body.push(O(cx + 10 + fo[0], cy + 20 + fo[1], 5.4, 5, 0, rock.base, 14), F(strand([[cx + 8 + fo[0], cy + 18 + fo[1]], [cx + 11 + fo[0], cy + 21 + fo[1]]], 1, glow)));
  out.push(...spin(body, cx, 34, lean));
  if (A?.smear) out.push(smear([[cx, cy + 12], [cx + 14, cy + 16], [cx + 30, cy + 20]], 6, '#ffe0c8'));
  if (A?.hit) out.push(...star(cx + 32, cy + 22, 3.6, '#fff6a8'), F(E(cx + 30, cy + 26, 1.6, 1.2, glow)));
  if (!dead) out.push(F(E(cx - 6, cy + 2 - (q * 12) % 8, 1, 1, glow)), F(E(cx + 8, cy + 4 - ((q + 0.5) * 12) % 8, 0.8, 0.8, glow)));
  return { w: 52, h: 36, res: 3, shapes: out };
}

// ---------- Gemini Ghosts ----------

const TWIN_ATK = [
  { spin: -20, rise: 2 },
  { spin: 180, rise: -2, smear: 1 },
  { spin: 340, rise: -1, hit: 1 },
  { spin: 360, rise: 0 },
];

function twins(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? TWIN_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const cx = 20;
  const cy = (dead ? 28 : 18) + (A ? -A.rise : walk ? Math.sin(TAU * q * 2) * 1.6 : -breath(q) * 1.4);
  const rot = A ? A.spin : walk ? Math.sin(TAU * q * 2) * 10 : sway(q) * 6;
  const out = [];
  // Two tiny ghosts, one gold and one blue, holding hands; they spin round their joined hands.
  const ghost = (x, y, c, star) => {
    const r = ramp(c, { step: 9, turn: 14 });
    const s = [T([...arcPts(x, y, 6.4, 6.4, 180, 360, 12), [x + 6.4, y + 6], [x + 4, y + 8], [x + 1.4, y + 6.6], [x - 1.4, y + 8.4], [x - 4, y + 6.4], [x - 6.4, y + 8]], r.base), crescent(x, y + 2, 6.4, 7, r.sh, { k: 0.3, a0: 120, a1: 230 }), shine(x, y, 6.4, 6.4, '#ffffff', -10, 0.9)];
    s.push(star5(x, y - 7.6, 2.6, star));
    s.push(...cuteFace(x + 0.8, y + 0.6, 0.7, mood, { iris: star, gap: 3.6, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: r.base, mouthDy: 3 }));
    return s;
  };
  const pair = [...ghost(cx - 8, cy, '#fff0b8', '#ffd36b'), ...ghost(cx + 8, cy + 1, '#cfe0ff', '#7fb8ff')];
  pair.push(...limb([cx - 3, cy + 3], [cx + 3, cy + 4], 2, 2, '#f8f4ff'), F(E(cx, cy + 3.5, 1.8, 1.8, '#ffffff')));
  out.push(...spin(pair, cx, cy + 3, rot));
  if (A?.smear) out.push(smear(arcPts(cx, cy + 3, 16, 10, -150, 30, 12), 4, '#fff6dc'));
  if (A?.hit) out.push(...star(cx + 18, cy + 2, 3, '#fff6a8'));
  if (!dead) out.push(...twinkles(cx, cy, q, 3, 18));
  return { w: 46, h: 36, res: 3, shapes: dead ? spin(out, cx, 34, 0) : out };
}

export const ART = {
  cometcourier: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 30, atkMs: [70, 220, 170], draw: comet },
  nebulawitch: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [80, 240, 180], draw: nebula },
  starcarto: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [70, 220, 170], draw: crab },
  mothlibrarian: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [80, 240, 180], draw: moth },
  meteorgolem: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [100, 300, 220], draw: meteor },
  geminighosts: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 220, 170], draw: twins },
};

export const INFO = {
  cometcourier: { name: 'Comet Courier', w: 26, h: 30 },
  nebulawitch: { name: 'Nebula Witch', w: 26, h: 36 },
  starcarto: { name: 'Telescope Crab', w: 32, h: 30 },
  mothlibrarian: { name: 'Moth Librarian', w: 28, h: 34 },
  meteorgolem: { name: 'Meteor Golem', w: 32, h: 34 },
  geminighosts: { name: 'Gemini Ghosts', w: 32, h: 30 },
};
