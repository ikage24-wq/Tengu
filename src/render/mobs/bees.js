// Monster art: Petal Meadow's new residents (the player's picks, 2026-11-01).
//   bumble       Puffbee: a round fuzzy pom-pom of a bee from the giant hive, its face on the front
//                of the ball; it bobs on every wingbeat and bonks you in a tumbling dive.
//   petalsprite  Dandelion Puff: a fluffy dandelion clock drifting on the breeze, a little face
//                in its heart; it sneezes a spray of parachute seeds at you.
//   queenbee     The Queen Bee (Petal Meadow's area boss), redrawn 2026-11-19 as the Royal Bumble:
//                her rig is in queenbeerig.js.
// All three fly: their walk is the flight loop (bob and wingbeat), their idle a hover. Every
// design faces right; see kit.js for the shapes and faces.js for the faces.

import { queenBeeRig, queenBeeStill } from './queenbeerig.js';
import { E, T, F, mix, shade, stroke } from './kit.js';
import { easyEye, mouth, blush as cheek, sweat, tear, vein, deadEye, simpleEye, simpleMouth } from './faces.js';
import { ramp, crescent, shine, smear, breath, sway, chain, wave } from './meadow.js';
import { part, makeRig, stateBlend, inPart, chainParts } from './rig.js';

const TAU = Math.PI * 2;
const D2R = Math.PI / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const shift = (shapes, dx, dy) => shapes.map((s) => s && (s.t === 'p' ? { ...s, pts: s.pts.map(([x, y]) => [x + dx, y + dy]) } : { ...s, x: s.x + dx, y: s.y + dy }));
// Turns shapes about (cx, cy) by deg.
function spin(shapes, cx, cy, deg) {
  if (!deg) return shapes;
  const c = Math.cos(deg * D2R);
  const s = Math.sin(deg * D2R);
  const r = (x, y) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
  return shapes.map((q) => {
    if (!q) return q;
    if (q.t === 'p') return { ...q, x: 0, y: 0, pts: q.pts.map(([px, py]) => r(q.x + px, q.y + py)) };
    const [x, y] = q.t === 'e' ? r(q.x, q.y) : r(q.x + q.w / 2, q.y + q.h / 2);
    return q.t === 'e' ? { ...q, x, y } : { ...q, x: x - q.w / 2, y: y - q.h / 2 };
  });
}
// A rotated oval as a polygon.
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
// A stripe across an oval body: the slice of the oval between x0 and x1.
function stripe(cx, cy, rx, ry, x0, x1, c) {
  const top = [];
  const bot = [];
  for (let i = 0; i <= 6; i++) {
    const x = lerp(x0, x1, i / 6);
    const k = Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2)) * 0.98;
    top.push([x, cy - ry * k]);
    bot.push([x, cy + ry * k]);
  }
  return F(T([...top, ...bot.reverse()], c));
}
// A soft-edged wing: a long oval from its root along deg, pale and see-through looking (a lighter
// inner panel and two veins), its rim a shade of its own color.
function wing(x, y, deg, len, wid, c, vein) {
  const a = deg * D2R;
  const cx = x + Math.cos(a) * len * 0.5;
  const cy = y + Math.sin(a) * len * 0.5;
  return [O(cx, cy, len * 0.5, wid, deg, c), F(O(cx + Math.cos(a) * 0.6, cy + Math.sin(a) * 0.6 - 0.4, len * 0.36, wid * 0.55, deg, mix(c, '#ffffff', 0.55))),
    ...stroke([[x, y], [x + Math.cos(a - 0.12) * len * 0.8, y + Math.sin(a - 0.12) * len * 0.8]], 0.35, vein), ...stroke([[x, y], [x + Math.cos(a + 0.18) * len * 0.6, y + Math.sin(a + 0.18) * len * 0.6]], 0.3, vein)];
}
// A four-point sparkle.
function star(x, y, r, c, core = '#ffffff') {
  const k = r * 0.28;
  return [F(T([[x, y - r], [x + k, y - k], [x + r, y], [x + k, y + k], [x, y + r], [x - k, y + k], [x - r, y], [x - k, y - k]], c)), F(E(x, y, k * 0.9, k * 0.9, core))];
}
// A petal: rounded at the tip with a little notch, narrowing to its base at (bx, by).
function petal(bx, by, deg, len, wid, c, notch = true) {
  const a = deg * D2R;
  const p = (u, v) => [bx + Math.cos(a) * len * u - Math.sin(a) * wid * v, by + Math.sin(a) * len * u + Math.cos(a) * wid * v];
  const pts = [p(0, 0.2), p(0.3, 0.8), p(0.7, 1), p(0.95, 0.6), p(notch ? 0.86 : 1, 0), p(0.95, -0.6), p(0.7, -1), p(0.3, -0.8), p(0, -0.2)];
  return T(pts, c);
}

const HONEY = ramp('#ffc93c', { step: 10, turn: 14, sat: 4 });
const COCOA = ramp('#6e4a5e', { step: 8, turn: 10 });
const FUZZ = ramp('#fff1cc', { step: 6, turn: 30 });
const WING = '#dff2ff';
const WINGV = '#a9c8ea';

// The bee's face shared by the Puffbee and the Queen: simple eyes and mouth acting each mood, cheeks,
// and the little acting marks.
function beeFace(out, hx, hy, k, mood, attacking, { queen = false } = {}) {
  const dead = mood === 'dead';
  const angry = mood === 'angry' || attacking;
  const hurt = mood === 'hurt';
  const happy = mood === 'happy';
  const ink = queen ? '#2e1630' : '#2a1a2e';
  const ey = hy + 0.4 * k;
  const far = [hx - 0.4 * k, ey];
  const near = [hx + 3.4 * k, ey - 0.2 * k];
  const em = angry ? 'angry' : hurt ? 'hurt' : happy ? 'happy' : mood === 'blink' ? 'blink' : 'idle';
  // A Puffbee's eyes are round and warm honey; the queen's narrower, violet, lashed with a wing.
  const eo = queen ? { iris: '#a04ad0', ink, lash: 1.25, wing: 1 } : { iris: '#c98a2e', ink, lash: 1 };
  const [fw, fh, nw, nh] = queen ? [1.4, 1.8, 1.8, 2.1] : [1.5, 1.9, 1.9, 2.3];
  if (dead) out.push(...deadEye(far[0], far[1], 1.4 * k, { type: 'swirl', s: -1, c: ink }), ...deadEye(near[0], near[1], 1.7 * k, { type: 'swirl', c: ink }));
  else out.push(...simpleEye(far[0], far[1], { ...eo, s: -1, w: fw * k, h: fh * k, mood: em }), ...simpleEye(near[0], near[1], { ...eo, s: 1, w: nw * k, h: nh * k, mood: em }));
  if (!dead) out.push(...cheek(hx - 2.4 * k, ey + 2.4 * k, 1 * k, { lines: happy ? 2 : 0 }), ...cheek(hx + 5.4 * k, ey + 2.6 * k, 1.1 * k, { lines: happy || hurt ? 3 : 0 }));
  // The mouth on the centre line, between the eyes and nearer the far one.
  const mm = dead ? 'dead' : attacking ? 'shout' : angry ? 'angry' : hurt ? 'hurt' : happy ? 'happy' : 'idle';
  out.push(...simpleMouth(hx + 1.6 * k, hy + 3.6 * k, { k, mood: mm, smug: queen, lip: queen ? '#c2386a' : '#8a3550' }));
  if (angry && !attacking) out.push(...vein(hx - 3 * k, hy - 3.6 * k, 0.9 * k));
  if (hurt) out.push(...sweat(hx - 4.4 * k, hy - 3 * k, 1 * k), ...tear(near[0] + 0.8 * k, ey + 2.2 * k, 0.8 * k, { type: 'stream', len: 2 * k }));
}

// The Puffbee's body motion, live (render/monsters.js applies it every frame): a lift on every
// wingbeat pair and a lagging roll in flight, a breathing hover at rest; it rolls about its
// middle, 12 px above its feet.
function puffMotion(pose, f) {
  const walk = pose === 'walk';
  const q = walk ? f / 8 : f / 6;
  if (walk) return { dx: 0.6 * Math.sin(TAU * q - 1), lift: 1.8 * Math.abs(Math.sin(2 * TAU * q)) - 0.6, rot: 6 * Math.sin(2 * TAU * q - 1.4), py: 12 };
  if (pose === 'idle') return { lift: breath(q) * 1.8 - sway(q) * 0.8, rot: sway(q) * 6, py: 12 };
  return {};
}
// The Dandelion Puff's, likewise: a soft rise and fall on the breeze with a slower lean, a
// breathing hover at rest, leaning about its seed ball's foot, 18 px above its stem's tip.
function seedMotion(pose, f) {
  const walk = pose === 'walk';
  const q = walk ? f / 8 : f / 6;
  if (walk) return { dx: 0.8 * Math.sin(TAU * q - 1.2), lift: 1.6 * Math.sin(TAU * q), rot: 5 * Math.sin(TAU * q - 1.8), py: 18 };
  if (pose === 'idle') return { lift: breath(q) * 1.6 - sway(q) * 0.8, rot: sway(q) * 4, py: 18 };
  return {};
}

// ---------- Puffbee (bumble) ----------
// (Petal Meadow's new cast, 2026-11-11: replaced the Bumble.) A round fuzzy pom-pom of a bee, all
// one ball: its face on the front, cocoa stripes round its back, a soft ring of cream fluff
// tufts for an edge, tiny buzzing wings and pom-tipped antennae. It bobs on every wingbeat; to
// attack it rears back, tumbles into a dive and bonks you head first, its stinger sparking.

// Attack: the bonk dive. rot: ball roll (deg, + nose down), bx/by: shift, ant: antennae swept
// back (deg), imp: impact spark.
const PUFF_ATK = [
  // Wind-up (held): rolled back, rising, antennae swept back, wings a blur.
  { rot: -26, bx: -2.4, by: -2.4, ant: 30, imp: 0 },
  // Dive: tumbling forward and down (a smear behind).
  { rot: 34, bx: 3, by: 2.6, ant: -10, imp: 0 },
  // Impact (held): the bonk, a spark at its nose.
  { rot: 22, bx: 3.6, by: 3, ant: -18, imp: 1 },
  // Recover: bobbing back, rolling upright past rest.
  { rot: -5, bx: 0.4, by: -0.6, ant: 8, imp: 0 },
];

// An attack pose between keys (an art with `atkTween`): frame f = key + quarters; each key holds
// for the first part of its beat, then eases into the next (or back to rest after the last).
function atkPose(table, f, rest) {
  const k = Math.floor(f);
  const u = Math.max(0, Math.min(1, (f - k - 0.25) / 0.75));
  const e = u * u * (3 - 2 * u);
  const a = table[k];
  const b = table[k + 1] ?? rest;
  const out = {};
  for (const key of Object.keys(a)) out[key] = a[key] + ((b[key] ?? a[key]) - a[key]) * e;
  return out;
}

function bumble(pose, f, mood) {
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? atkPose(PUFF_ATK, f, { rot: 0, bx: 0, by: 0, ant: 0, imp: 0 }) : null;
  const fk = Math.floor(f);
  const q = walk ? f / 8 : idle ? f / 6 : 0;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const out = [];
  // Flight: a little lift on every wingbeat pair (two bobs a loop) with a lagging roll; idle, a
  // lazy hover that breathes. Dead, it lies belly up.
  const br = idle ? breath(q) : 0;
  // (Its flight bob, drift and roll are applied live every frame, puffMotion below.)
  const bob = dead ? 5 : A ? A.by : 0;
  const bx = 16 + (A ? A.bx : 0) + (hurt ? -1.6 : 0);
  const by = 16 + bob;
  const rot = dead ? 180 : A ? A.rot : hurt ? -14 : 0;
  const up = Math.floor(f * 2) % 2 === 0;
  const flap = dead ? 20 : hurt ? -60 : up ? -70 : -10;
  const R0 = 8.6;

  // Far wing behind the ball.
  if (!dead) out.push(...wing(bx - 3.6, by - R0 + 2.6, -90 + flap * 0.6 - 40, 6.4, 2.6, WING, WINGV));

  // The ball: honey with a cocoa stripe band round the back, a stinger nub, and a ring of fluff.
  const ball = [];
  ball.push(E(bx, by, R0, R0 * 0.95, HONEY.base));
  ball.push(stripe(bx, by, R0, R0 * 0.95, bx - 6.6, bx - 4.8, COCOA.base), stripe(bx, by, R0, R0 * 0.95, bx - 3.2, bx - 1.6, COCOA.base));
  ball.push(F(T([[bx - R0 + 0.4, by - 1], [bx - R0 - 3.2, by + 0.6], [bx - R0 + 0.6, by + 1.8]], COCOA.deep)));
  ball.push(crescent(bx, by, R0, R0 * 0.95, HONEY.sh, { k: 0.28, a0: 40, a1: 200, jag: 0.8 }));
  // A clean cream face patch on the front, and a little tuft of fluff on top.
  ball.push(E(bx + 2.6, by - 0.2, 5.4, 5, FUZZ.base), crescent(bx + 2.6, by - 0.2, 5.4, 5, FUZZ.sh, { k: 0.22, a0: 80, a1: 200 }));
  for (const [dx, r] of [[-1.6, 1.6], [0.2, 2], [2, 1.5]]) ball.push(E(bx + dx, by - R0 + 0.4, r, r * 0.85, FUZZ.hi));
  ball.push(shine(bx, by, R0, R0 * 0.95, '#ffffff', 0, 1.1));
  // Little feet tucked under.
  for (const x of [-1.6, 2.2]) ball.push(E(bx + x, by + R0 + 0.2, 1.3, 1, COCOA.base));
  // Antennae: two chains from the top, pom tips, swept back with the roll and a beat behind.
  const aph = walk ? 2 * TAU * q - 2.6 : TAU * q - 1.4;
  const sweep = (A ? A.ant : 0) + (dead ? 50 : hurt ? 34 : angry ? -12 : 0);
  for (const [x, a0, near] of [[0.4, -108, false], [3.4, -74, true]]) {
    const pts = chain(bx + x, by - R0 + 0.6, a0 - sweep * (near ? 0.7 : 1), [2.4, 2.4, 2.2], (i) => (i ? 12 : 0) + wave(aph + (near ? 0 : 0.8), idle ? 7 : 10)(i));
    ball.push(...stroke(pts.map(([x2, y2]) => [x2, y2]), 0.7, COCOA.base, false));
    const t = pts.at(-1);
    ball.push(E(t[0], t[1], 1.4, 1.4, near ? '#ff9ec7' : '#f088b4'), F(E(t[0] - 0.4, t[1] - 0.5, 0.5, 0.4, '#ffe0ee')));
  }
  // The face on the front of the ball.
  beeFace(ball, bx + 1.4, by - 1.2, 1.05, mood, Boolean(A) && fk < 3);
  out.push(...spin(ball, bx, by, rot));

  // Near wing, blurred: where it is and a pale ghost of where it was.
  if (!dead) {
    out.push(...wing(bx - 2, by - R0 + 2.2, -90 + (up ? -10 : -70) * 0.6 - 30, 6.8, 2.6, mix(WING, '#ffffff', 0.55), mix(WINGV, '#ffffff', 0.55)));
    out.push(...wing(bx - 2, by - R0 + 2.2, -90 + flap * 0.6 - 36, 7.6, 3, WING, WINGV));
  }

  if (A && fk === 1) out.push(smear([[bx - 13, by - 9], [bx - 6, by - 4], [bx + 1, by + 3]], 4, '#fff2c0'));
  if (A && fk === 2) out.push(...star(bx + R0 + 1.6, by + 3, 3, '#ffd65a'), ...star(bx + R0 - 1, by + 7.4, 1.6, '#ffffff', '#ffd65a'));
  if (hurt) out.push(E(bx - 9, by - 7, 1, 0.8, FUZZ.hi), E(bx - 11, by - 3, 0.8, 0.7, FUZZ.base));
  return { w: 34, h: 32, res: 3, shapes: shift(out, 2, 4) };
}

// ---------- Dandelion Puff (petalsprite) ----------
// (Petal Meadow's new cast, 2026-11-11: replaced the Petal Sprite.) A fluffy white dandelion
// clock drifting on the breeze: a ball of seed fluff, fine seed lines radiating from a little
// yellow-green heart that wears its face, two leaf arms and a stem dangling below. It bobs and
// drifts; to attack it breathes in (leaning back), then sneezes a spray of parachute seeds at you.
// Hit, a few seeds are knocked loose; dead, it is blown nearly bald and droops.

// Attack: the seed sneeze. lean: body lean (deg, + forward), by: rise, arms: leaf arms raised (0
// down, 1 up), spray: seeds flown out (0 none, 1 far), mouth: 0 shut, 1 sneezing.
const PUFF_SEED_ATK = [
  // Wind-up (held): leaning back, rising, arms up, breathing in, eyes squeezed.
  { lean: -16, by: -1.6, arms: 1, spray: 0, mouth: 0 },
  // Sneeze: thrown forward, the seeds bursting out ahead.
  { lean: 18, by: 1, arms: -0.4, spray: 0.45, mouth: 1 },
  // Impact (held): the seeds at full spread, a star among them.
  { lean: 12, by: 0.6, arms: -0.2, spray: 1, mouth: 1 },
  // Recover: settling back, sniffling, the last seeds drifting off.
  { lean: -3, by: 0, arms: 0.2, spray: 1.3, mouth: 0 },
];

const FLUFF = ramp('#fbf8ff', { step: 7, turn: 40 });
const CORE = ramp('#d8e88a', { step: 9, turn: 14 });
const STEMC = ramp('#8fcf86', { step: 10, turn: 16 });

// One parachute seed: a slim stalk with a little fan of fluff on top, along angle deg.
function seed(x, y, deg, len, c, k = 1) {
  const a = deg * D2R;
  const tx = x + Math.cos(a) * len;
  const ty = y + Math.sin(a) * len;
  const o = [...stroke([[x, y], [tx, ty]], 0.4 * k, mix(c, '#b8b0c8', 0.5), false), E(x, y, 0.5 * k, 0.5 * k, '#c8a878')];
  for (const d of [-40, -20, 0, 20, 40]) {
    const b = a + d * D2R;
    o.push(...stroke([[tx, ty], [tx + Math.cos(b) * 1.8 * k, ty + Math.sin(b) * 1.8 * k]], 0.35 * k, c, false));
  }
  o.push(F(E(tx + Math.cos(a) * 0.9 * k, ty + Math.sin(a) * 0.9 * k, 1.3 * k, 1.1 * k, mix(c, '#ffffff', 0.4))));
  return o;
}

function petalsprite(pose, f, mood) {
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? atkPose(PUFF_SEED_ATK, f, { lean: 0, by: 0, arms: 0, spray: 1.6, mouth: 0 }) : null;
  const fk = Math.floor(f);
  const q = walk ? f / 8 : idle ? f / 6 : 0;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const happy = mood === 'happy';
  const out = [];
  // Drifting: a soft rise and fall once a loop with a slower sway (it rides the breeze), idle a
  // breathing hover; dead, it sinks low and droops.
  const br = idle ? breath(q) : 0;
  // (Its drift, bob and lean are applied live every frame, seedMotion below.)
  const bob = dead ? 7 : A ? A.by : 0;
  const cx = 18 + (hurt ? -1.4 : 0);
  const cy = 15 + bob;
  const lean = (A ? A.lean : 0) + (dead ? 24 : hurt ? -12 : 0);
  const R0 = dead ? 5.4 : 9;

  // The stem dangling below, swaying a beat behind (a chain), with a tiny leaf on it.
  const sph = walk ? TAU * q - 2.4 : TAU * q - 1.6;
  const st = chain(cx + 0.6, cy + R0 - 1.4, 94 - lean * 0.6, [3.4, 3.2, 3], (i) => wave(sph, dead ? 0 : idle ? 9 : 12)(i) + (dead ? 10 : 0));
  out.push(...stroke(st.map((p) => p.slice(0, 2)), 1.1, STEMC.base, false));
  // Its leaf arms grow from the stem just under the ball: raised winding up, flung down sneezing.
  const ar = A ? A.arms : hurt ? 0.6 : dead ? -1 : 0;
  const wv = idle ? Math.sin(TAU * q * 2) * 8 : walk ? Math.sin(TAU * q * 2 - 1) * 10 : 0;
  const lb = st[1];
  out.push(petal(lb[0], lb[1], 200 - ar * 45 + wv, 5, 1.7, STEMC.sh, false), petal(lb[0], lb[1], -20 + ar * 45 - wv, 5.2, 1.8, STEMC.base, false));

  const ball = [];
  // The seed ball: a soft white sphere, a tufted rim of fluff, fine seed lines from the heart, and
  // the shade on its underside.
  // A soft airy ball (pale, its underside lilac), then the seeds: fine lines from the heart that
  // poke out past it, each ending in a tiny tuft of fluff, so the edge is a fuzzy halo of seeds.
  ball.push(E(cx, cy, R0 - 1, R0 * 0.96 - 1, mix(FLUFF.base, '#ffffff', 0.3)), crescent(cx, cy, R0 - 1, R0 * 0.96 - 1, mix(FLUFF.sh, '#e6dcf4', 0.5), { k: 0.3, a0: 20, a1: 160 }));
  const n = dead ? 6 : 22;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + 0.15 + (i % 2) * 0.06;
    const r = R0 + (i % 3 === 0 ? 1.2 : i % 3 === 1 ? 0.2 : 0.7);
    const ex = cx + Math.cos(a) * r;
    const ey = cy + Math.sin(a) * r * 0.96;
    ball.push(...stroke([[cx + Math.cos(a) * 1.4, cy + Math.sin(a) * 1.4], [ex, ey]], 0.3, mix(FLUFF.sh, '#c8c0d8', 0.5), false));
    ball.push(E(ex, ey, 1.05, 1.05, Math.sin(a) < -0.3 ? '#ffffff' : FLUFF.base));
  }
  ball.push(shine(cx, cy, R0 - 1, R0 - 1, '#ffffff', 0, 1.1));
  // The heart and its face.
  const hx = cx + 1.2;
  const hy = cy + 1;
  ball.push(E(hx, hy, 4.4, 4, CORE.base), crescent(hx, hy, 4.4, 4, CORE.sh, { k: 0.28, a0: 60, a1: 200 }), shine(hx, hy, 4.4, 4, CORE.hi, 0, 1));
  const ink = '#3a3040';
  const em = A && !hurt ? (fk === 0 ? 'hurt' : 'angry') : { idle: 'idle', angry: 'angry', hurt: 'hurt', happy: 'happy', blink: 'blink' }[mood] ?? 'idle';
  if (dead) ball.push(...deadEye(hx - 1.4, hy - 0.4, 1, { c: ink, th: 0.45 }), ...deadEye(hx + 1.8, hy - 0.4, 1.1, { c: ink, th: 0.45 }));
  else ball.push(...simpleEye(hx - 1.4, hy - 0.5, { iris: '#7a8a3a', ink, s: -1, w: 1.2, h: 1.6, mood: em }), ...simpleEye(hx + 1.8, hy - 0.6, { iris: '#7a8a3a', ink, s: 1, w: 1.4, h: 1.8, mood: em }));
  if (!dead) ball.push(...cheek(hx - 2.8, hy + 1.6, 0.8, { on: CORE.base }), ...cheek(hx + 3.1, hy + 1.6, 0.85, { on: CORE.base }));
  const sneeze = A && A.mouth > 0.5;
  ball.push(...simpleMouth(hx + 0.3, hy + 2, { k: 0.75, mood: dead ? 'dead' : sneeze ? 'shout' : angry ? 'angry' : happy ? 'happy' : hurt ? 'hurt' : 'idle', lip: '#6a5040' }));
  if (hurt) ball.push(...tear(hx + 2.4, hy + 0.8, 0.7, { type: 'stream', len: 2 }), ...sweat(hx - 4, hy - 2.6, 0.8));
  if (angry && !A) ball.push(...vein(hx - 3.2, hy - 3, 0.7));
  out.push(...spin(ball, cx, cy + 3, lean));

  // Seeds loosened: drifting off behind when hurt, or flown out ahead in the sneeze.
  if (hurt) for (const [dx, dy, d] of [[-11, -6, -150], [-9, -11, -120]]) out.push(...seed(cx + dx, cy + dy, d, 3.4, FLUFF.base, 0.9));
  if (A && A.spray > 0.05) {
    const k = Math.min(1.3, A.spray);
    for (const [dx, dy, d, l] of [[10, -4, -30, 3.6], [12, 1, -10, 3.4], [9, 5, 10, 3.2], [14, -8, -50, 3]]) {
      const s = k * (0.8 + l * 0.08);
      out.push(...seed(cx + 4 + dx * s, cy + dy * s, d, l, FLUFF.base, 0.95));
    }
    if (fk === 1) out.push(smear([[cx + 6, cy - 2], [cx + 12, cy - 2], [cx + 18, cy - 1]], 2.6, '#ffffff'));
    if (fk === 2) out.push(...star(cx + 18, cy - 7, 2.2, '#fff6c8'));
  }
  return { w: 36, h: 40, res: 3, shapes: shift(out, 2, 4) };
}

export const ART = {
  bumble: { sub: 8, atkTween: true, motion: puffMotion, walk: 8, idle: 6, attack: 4, stride: 30, atkMs: [60, 220, 160], draw: bumble },
  petalsprite: { pad: 7, sub: 8, atkTween: true, motion: seedMotion, walk: 8, idle: 6, attack: 4, stride: 24, atkMs: [70, 240, 200], draw: petalsprite },
  queenbee: { walk: 8, idle: 6, attack: 5, stride: 30, atkMs: [120, 420, 200, 240], draw: queenBeeStill, rig: queenBeeRig },
};

export const INFO = {
  bumble: { name: 'Puffbee', w: 24, h: 24 },
  petalsprite: { name: 'Dandelion Puff', w: 22, h: 26 },
  queenbee: { name: 'The Queen Bee', w: 60, h: 64 },
};
