// The Topiary Hedgehog (2026-11-26, the Topiary Swan remade from scratch, the player's pick "A" of
// three: Topsy, the hedge-hog): the Moonlit Manor garden's level 15 monster. The garden's proudest
// topiary: a round little hedgehog whose prickles are a neatly clipped box hedge, a pink rose tucked
// in the top, and a terrible fusspot about his trim. On his own copy of the rodent base
// (rodentbase.js, its hamster, reshaped: a pointed snout, little round ears, the legs hidden under the
// hedge's skirt).
//   going   he never walks anywhere: like any proper topiary ball he tucks in and rolls (his turn
//           from the ground he covers, so nothing slides), then pops up again. His dart gait's quick
//           dashes are short rolls; between them he stands about long enough for a piece of his act
//           (data: `rest`, and world/mobs.js tells him how long he has, `m.restUntil`).
//   idle    his act, in three pieces, each whole in itself, the next one that fits the time he has
//           (one after another while he stays put):
//           - the sprig (9.6 s): he sits up; a stray sprig arches out of his hedge to dangle in
//             front of his nose; snip, it springs straight back; snip again, it springs back with a
//             rosebud on it; he gives up and admires it, then tucks it back in;
//           - the shake (4.6 s): a full-body wet-dog shake, the leaves fluffing out, then settling
//             neat again;
//           - the ornament (7.6 s): curled into a perfect topiary ball, holding very still (a garden
//             ornament, honest), then a "ta-da" peek out.
//   moves   Snip Snip (sat up, the snips raised open, two snaps out in front); Hedge Roll (curled up,
//           rocking back on the spot, then bowling in, bouncing off and rolling back); Leaf Shake
//           (bunched up, then bristling, a burst of clipped leaves).
//   face    his own: glossy bead eyes (a big round glint, a small second one), a soft lower lid that
//           rises when he smiles, fur-tuft brows that do the acting, a glossy berry nose, a mouth
//           from width, smile and openness; every change eased.
import { dressedRodent } from './rodentbase.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, u) => a + (b - a) * u;
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
const rgb = (hex) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgba = (hex, al) => {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${clamp(al, 0, 1)})`;
};
// (a damped settle: 1 - e^-kt cos wt, from 0 at t=0 to 1, overshooting once or twice)
const boing = (t, k = 7, w = 16) => (t <= 0 ? 0 : 1 - Math.exp(-k * t) * Math.cos(w * t));

// ---------- His colours ----------
const FUR = { lt: '#fff7ec', base: '#f2dcc0', sh: '#dbbb95', deep: '#c49c74', guide: '#e8cfae', nose: '#8a2e4a', inner: '#f4c4be', tooth: '#fffaf2', mouth: '#9a4f58' };
const INK = '#ad8058';
const HEDGE = { lt: '#a9dd9c', base: '#5f9f72', sh: '#447f5c', deep: '#346b4e', rim: '#d6f5c8', ink: '#3b7655' };
const ROSE = { lt: '#ffd3e4', base: '#f59bc0', sh: '#dc6f99', ink: '#c55c86' };
const STEEL = { lt: '#ffffff', base: '#e4eaf4', sh: '#a9b6cb', ink: '#8792ad' };
const GRIP = { base: '#ff9fbd', sh: '#e27a9e', ink: '#c86486' };
const TWIG = '#9a7150';

// ---------- His shape over the hamster's ----------
const S = 1.05;
const P = {
  scale: S,
  head: { skull: [7.4, 6.8], muzzle: [6.3, 2.3, 4.6, 2.6], nose: [10.7, 1.4, 0.8], cheek: [1.4, 3.0, 5.4, 4.0], pouch: 0, teeth: [9.4, 3.6, 0.02] },
  ears: { kind: 'round', near: [-2.2, -5.6], far: [-4.6, -4.8], len: 2.8, w: 3.4, ang: -112 },
  neck: { base: [6.4, -2.6], len: 2.2, w: 9, ang: -14 },
};
// (the hamster's body outline, which the hedge is built round: body units, x forward, y down)
const BODY = [[9.4, -2.4], [6.8, -6.8], [1.8, -8.8], [-3.6, -8.8], [-8.2, -6.6], [-10.6, -2.4], [-10.4, 2.6], [-7.8, 6.6], [-3.2, 8.4], [2, 8.4], [6.6, 6.6], [9.4, 2.6]];
function loopPts(pts, n) {
  const out = [];
  const N = pts.length;
  for (let i = 0; i < N; i++) {
    const [p0, p1, p2, p3] = [pts[(i - 1 + N) % N], pts[i], pts[(i + 1) % N], pts[(i + 2) % N]];
    for (let j = 0; j < n; j++) {
      const t = j / n;
      out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t * t * t)));
    }
  }
  return out;
}
// The hedge, worked out once in the body's frame (so it bends with him as he curls): its outer edge
// (the back's outline pushed out, from the shoulders over the back to the rump), its skirt (a line
// along his side, front to back, under which only his belly and paws show), the leaf scallops along
// both, and the leafy clumps inside it.
const HC = [-0.6, 0.2];
const HEDGE_SHAPE = (() => {
  const loop = loopPts(BODY, 6);
  const keyOf = (p) => {
    const an = Math.atan2(p[1] - HC[1], p[0] - HC[0]);
    return an < 0 ? -an : TAU - an;
  };
  const outer = loop
    .filter((p) => {
      const k = keyOf(p);
      return k >= 0.6 && k <= 3.95;
    })
    .sort((p, q) => keyOf(p) - keyOf(q))
    .map((p) => {
      const d = [p[0] - HC[0], p[1] - HC[1]];
      const l = Math.hypot(...d);
      return [p[0] + (d[0] / l) * 1.5, p[1] + (d[1] / l) * 1.5];
    });
  const last = outer[outer.length - 1];
  const skirt = [last, [-6.2, 6.9], [-2.6, 6.4], [1.0, 5.4], [4.2, 3.4], [6.4, 0.4], [7.6, -2.8], outer[0]];
  // (bumps every so far along a chain)
  const along = (chain, step) => {
    const out = [];
    let carry = 0;
    for (let i = 1; i < chain.length; i++) {
      const [a, b] = [chain[i - 1], chain[i]];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let s = carry;
      while (s < L) {
        const u = s / L;
        out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
        s += step;
      }
      carry = s - L;
    }
    return out;
  };
  const leaves = along(outer, 2.3).map((p, i) => [p[0], p[1], 1.85 + 0.25 * Math.sin(i * 2.3)]);
  const scallops = along(skirt.slice(0, 7), 1.9).map((p, i) => [p[0], p[1] + 0.2, 1.3 + 0.15 * Math.cos(i * 1.7)]);
  // (inside the hedge: a point-in-polygon test over the outer edge and the skirt)
  let ring = [...outer, ...skirt.slice(1, -1)];
  // (wound the same way as the leaf bumps' arcs, so they add to it rather than cut holes)
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const [p, q] = [ring[i], ring[(i + 1) % ring.length]];
    area += p[0] * q[1] - q[0] * p[1];
  }
  if (area < 0) ring = ring.reverse();
  const inside = ([x, y]) => {
    let c = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const clumps = [];
  let row = 0;
  for (let y = -7.4; y <= 6.2; y += 3.3, row++) for (let x = -11 + (row % 2) * 2.0; x <= 9; x += 4.0) if (inside([x, y])) clumps.push([x, y, 2.3 + 0.2 * Math.sin(x * 1.3 + y)]);
  return { ring, leaves, scallops, clumps };
})();

// ---------- His act: three pieces, each whole in itself ----------
// (each piece's beats in seconds from its own start)
const PIECES = { sprig: 9.6, shake: 4.6, ornament: 7.6 };
const ORDER = ['sprig', 'shake', 'ornament'];
const SNIP1 = 2.9;
const SNIP2 = 5.4;
const BACK1 = 3.35;
const BACK2 = 5.95;
const NONE = { sit: 0, reach: 0, look: 0, admire: 0, ball: 0, peek: 0, shake: 0, tense: 0, twig: 0, bud: 0, face: 'calm' };
function actAt(piece, u) {
  const A = { ...NONE, piece, u };
  if (piece === 'sprig') {
    A.sit = win(u, 0.3, 1.1, 8.6, 9.5);
    A.reach = Math.max(win(u, 2.0, 2.5, 3.05, 3.6), win(u, 4.6, 5.1, 5.55, 6.1));
    A.look = win(u, 0.9, 1.4, 6.6, 7.1);
    A.admire = win(u, 6.6, 7.1, 8.3, 8.9);
    // the twig: grown out, cut short at each snip, springing back (the second time with a bud),
    // tucked back into the hedge at the end
    let tw = sstep((u - 0.5) / 0.7);
    if (u > SNIP1) tw = mix(1, 0.32, sstep((u - SNIP1) / 0.06));
    if (u > BACK1) tw = mix(0.32, 1, boing(u - BACK1));
    if (u > SNIP2) tw = mix(1, 0.32, sstep((u - SNIP2) / 0.06));
    if (u > BACK2) tw = mix(0.32, 1, boing(u - BACK2));
    const tuck = 1 - sstep((u - 8.3) / 0.9);
    A.twig = u < 0.5 ? 0 : tw * tuck;
    A.bud = u > BACK2 ? clamp(boing(u - BACK2, 6, 13), 0, 1.25) * tuck : 0;
    if (u >= 0.9 && u < SNIP1 + 0.05) A.face = 'focus';
    else if (u >= SNIP1 + 0.05 && u < BACK1) A.face = 'proud';
    else if (u >= BACK1 && u < 4.4) A.face = 'shock';
    else if (u >= 4.4 && u < SNIP2 + 0.05) A.face = 'cross';
    else if (u >= SNIP2 + 0.05 && u < BACK2) A.face = 'proud';
    else if (u >= BACK2 && u < 6.5) A.face = 'shock';
    else if (u >= 6.5 && u < 6.95) A.face = 'sigh';
    else if (u >= 6.95 && u < 9.0) A.face = 'admire';
  } else if (piece === 'shake') {
    A.tense = win(u, 0.2, 0.7, 0.8, 1.0);
    A.shake = win(u, 0.8, 1.05, 3.05, 3.4);
    if (u >= 0.2 && u < 0.8) A.face = 'focus';
    else if (u >= 0.8 && u < 3.3) A.face = 'squeeze';
    else if (u >= 3.3 && u < 4.6) A.face = 'proud';
  } else if (piece === 'ornament') {
    A.ball = win(u, 0.3, 1.1, 4.6, 5.05);
    A.peek = win(u, 4.6, 5.05, 6.5, 7.5);
    if (u >= 0.5 && u < 4.7) A.face = 'still';
    else if (u >= 4.7 && u < 7.0) A.face = 'happy';
  }
  return A;
}
// His face's targets for a mood: lid (0 open, 1 shut), shut (which closed shape), brow tilt (+ knit,
// - worried) and raise, the mouth's width, smile, openness, blush, the lower lid's rise, how wide.
const FACES = {
  // (at rest: bright and pleased with himself, the lower lids lifted in a little smile, brows up)
  calm: { lid: 0, shut: 'happy', bt: -0.15, by: 0.35, mw: 0.85, ms: 0.75, mo: 0, bl: 0.6, lw: 0.28, wide: 1.06 },
  focus: { lid: 0.22, shut: 'happy', bt: 0.45, by: -0.1, mw: 0.5, ms: -0.05, mo: 0, bl: 0.4, lw: 0.3, wide: 0.98 },
  proud: { lid: 1, shut: 'happy', bt: -0.1, by: 0.4, mw: 0.9, ms: 1, mo: 0, bl: 0.6, lw: 0.6, wide: 1 },
  shock: { lid: 0, shut: 'happy', bt: -0.35, by: 1, mw: 0.55, ms: -0.1, mo: 0.8, bl: 0.5, lw: 0, wide: 1.16 },
  cross: { lid: 0.25, shut: 'happy', bt: 0.85, by: -0.3, mw: 0.6, ms: -0.45, mo: 0, bl: 0.6, lw: 0.4, wide: 0.97 },
  sigh: { lid: 0.62, shut: 'happy', bt: -0.55, by: 0.15, mw: 0.7, ms: -0.15, mo: 0.35, bl: 0.5, lw: 0.2, wide: 1 },
  admire: { lid: 0.35, shut: 'happy', bt: -0.3, by: 0.4, mw: 0.95, ms: 1, mo: 0.2, bl: 1, lw: 0.65, wide: 1.06 },
  still: { lid: 1, shut: 'still', bt: 0.1, by: 0, mw: 0.55, ms: 0.05, mo: 0, bl: 0.7, lw: 0.3, wide: 1 },
  happy: { lid: 1, shut: 'happy', bt: -0.2, by: 0.55, mw: 1.1, ms: 1, mo: 0.8, bl: 0.85, lw: 0.7, wide: 1 },
  squeeze: { lid: 1, shut: 'squeeze', bt: -0.2, by: 0.1, mw: 1.0, ms: 0.6, mo: 0.55, bl: 0.7, lw: 0.6, wide: 1 },
  fierce: { lid: 0.18, shut: 'happy', bt: 0.9, by: -0.35, mw: 0.85, ms: -0.2, mo: 0.55, bl: 0.5, lw: 0.4, wide: 1 },
  hurt: { lid: 1, shut: 'squeeze', bt: -0.6, by: 0.1, mw: 0.8, ms: -0.6, mo: 0.5, bl: 0.6, lw: 0.4, wide: 1 },
  sleep: { lid: 1, shut: 'sleep', bt: -0.1, by: 0, mw: 0.5, ms: 0.25, mo: 0.15, bl: 0.5, lw: 0.2, wide: 1 },
  dizzy: { lid: 1, shut: 'dizzy', bt: -0.4, by: 0.25, mw: 0.7, ms: -0.4, mo: 0.4, bl: 0.4, lw: 0, wide: 1 },
  worried: { lid: 0.08, shut: 'happy', bt: -0.6, by: 0.3, mw: 0.6, ms: -0.3, mo: 0.15, bl: 0.5, lw: 0.1, wide: 1.05 },
  sad: { lid: 0.4, shut: 'happy', bt: -0.7, by: 0.1, mw: 0.65, ms: -0.6, mo: 0, bl: 0.45, lw: 0.15, wide: 1 },
  talk: { lid: 0.05, shut: 'happy', bt: -0.1, by: 0.3, mw: 0.85, ms: 0.45, mo: 0.4, bl: 0.6, lw: 0.25, wide: 1.04 },
};
const SHUTS = ['happy', 'sleep', 'squeeze', 'dizzy', 'still'];

// ---------- His moves ----------
const MOVES = {
  // Sat up, the snips raised up and open over his head, then thrust out in front: snip, snip.
  snip: {
    anticT: 0.3,
    keys: [
      [0, { sit: 0.9, hold: 1, throwArm: -0.7, pitch: -8, head: -14, ears: 0.6, x: -0.04 }],
      [0.07, { sit: 0.62, hold: 0.7, throwArm: 1, pitch: 10, head: 8, ears: -0.4, x: 0.14 }, 'out'],
      [0.13, { sit: 0.66, hold: 0.7, throwArm: 0.55, pitch: 6, head: 4, ears: -0.3, x: 0.13 }, 'io'],
      [0.19, { sit: 0.6, hold: 0.7, throwArm: 1, pitch: 11, head: 9, ears: -0.4, x: 0.16 }, 'out'],
      [0.42, { sit: 0.4, hold: 0.45, throwArm: 0.45, pitch: 4, head: 3, x: 0.1 }, 'io'],
      [0.82, {}, 'io'],
    ],
    snaps: [0.07, 0.19],
  },
  // Tucked up tight, rocking back on the spot (the wind-up: dust and leaves kicked out behind), then
  // bowling in, bouncing off whoever it hits, rolling back to where he was and popping up out of the
  // ball. (His turns add up to none: -0.1 +0.1 +0.5 -0.5.)
  roll: {
    anticT: 0.3,
    keys: [
      [0, { ball: 1, curl: 2.8, crouch: 0.3, x: -0.07, hop: 0.02, head: 40, reach: -1, ears: -1 }],
      [0.1, { ball: 1, curl: 2.8, x: 0.45, hop: 0.05, head: 40, reach: -1, ears: -1 }, 'out'],
      [0.28, { ball: 1, curl: 2.8, x: 0.8, hop: 0, head: 40, reach: -1, ears: -1 }, 'io'],
      [0.4, { ball: 1, curl: 2.8, x: 0.68, hop: 0.13, head: 40, reach: -1, ears: -1 }, 'out'],
      [0.52, { ball: 1, curl: 2.8, x: 0.6, hop: 0, head: 40, reach: -1, ears: -1 }, 'in'],
      [0.84, { ball: 1, curl: 2.8, x: 0.03, hop: 0, head: 40, reach: -1, ears: -1 }, 'io'],
      [1.1, { ball: 0.25, curl: 0.5, x: 0, hop: 0.04, head: 8, reach: -0.3, ears: -0.3 }, 'io'],
      [1.2, { crouch: 0.25, curl: 0.1, x: 0, ears: 0.4 }, 'io'],
      [1.3, {}, 'io'],
    ],
    spin: [[-0.3, -0.12, -0.1], [-0.12, 0.02, 0.1], [0.02, 0.3, 0.5], [0.52, 0.84, -0.5]],
    hit: 0.28,
  },
  // Bunched up tight, then every leaf bristling out at once, a burst of clipped leaves.
  shake: {
    anticT: 0.3,
    keys: [
      [0, { crouch: 0.6, curl: 0.7, pitch: 5, head: 10, reach: -0.5, ears: -0.9 }],
      [0.06, { crouch: 0.05, curl: -0.25, hop: 0.12, pitch: -7, head: -6, reach: 0.2, ears: -1, x: 0.05 }, 'out'],
      [0.24, { crouch: 0.15, curl: 0.05, hop: 0, pitch: -2, head: -2, x: 0.05 }, 'io'],
      [0.7, {}, 'io'],
    ],
    burst: 0.06,
  },
};
// (Hedge Roll and Leaf Shake keep all four paws down, whatever the idle was up to)
const down = (mv) => ({ ...mv, keys: mv.keys.map(([t, p, e]) => [t, { sit: 0, hold: 0, ...p }, e]) });
MOVES.roll = down(MOVES.roll);
MOVES.shake = down(MOVES.shake);
const POOL = ['snip', 'roll', 'shake'];
// vowel mouths for talking: [width, smile, open], each held a beat, eased into the next
const VOWELS = [[0.55, 0.1, 0.75], [1.05, 0.45, 0.6], [1.1, 0.55, 0.3], [0.8, 0.3, 0], [0.7, 0.2, 0.5]];

// ---------- His act, his going about, moods and face's easing, each frame before drawing ----------
function pose(m, a, out, K, mv, mt) {
  const st = (a.mo.rig ??= {});
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const k = (rate) => 1 - Math.exp(-dt * rate);
  const now = a.now ?? a.t ?? 0;
  const napping = m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now);
  // (a hit only counts once it has happened: a negative time since it, as when a stage replays from
  // the start with the last hit remembered, is no hit at all)
  const ago = a.hurtAgo ?? 9;
  const hurt = m.hp > 0 && ago >= 0 && ago < 0.55;
  const fighting = (m.aggroUntil ?? 0) > now || Boolean(m.engaged);
  const name = mv ? Object.keys(MOVES).find((n) => MOVES[n] === mv) ?? null : null;
  // Going about: he tucks into a ball and rolls, his turn from the ground covered (so the ball never
  // slides), then, stopped, rolls on to the next whole turn and pops back up out of it.
  const odo = m.odo ?? 0;
  const dOdo = st.tdOdo === undefined ? 0 : Math.min(20, Math.abs(odo - st.tdOdo));
  st.tdOdo = odo;
  const moving = (a.walkW ?? 0) > 0.05 && m.hp > 0 && !mv;
  // (the ball's radius, from where its middle rode last frame: it rolls on what touches the floor)
  const R = Math.max(6, st.tdR ?? 11);
  const sp = (st.tdSpin ??= { a: 0, v: 0 });
  if (moving) {
    const step = dOdo / (TAU * R);
    sp.a += step;
    sp.v = dt > 0 ? step / dt : sp.v;
  } else if (sp.a > 0) {
    // (rolled on to the next whole turn and settled there, eased, never snapped)
    const goal = Math.ceil(sp.a - 0.02);
    sp.v += ((goal - sp.a) * 120 - sp.v * 20) * dt;
    sp.v = Math.max(0, sp.v);
    sp.a = Math.min(goal, sp.a + sp.v * dt);
    if (goal - sp.a < 2e-3 && sp.v < 0.08) {
      sp.a = 0;
      sp.v = 0;
    }
  }
  const finishing = !moving && sp.a > 0;
  const rollGoal = (moving || finishing) && !mv ? 1 : 0;
  st.tdRoll = mix(st.tdRoll ?? 0, rollGoal, k(rollGoal ? 26 : 10));
  const rw = sstep(st.tdRoll);
  a.dressSpin = sp.a;
  // (Hedge Roll's wind-up: tucked into the ball within its first beat, so the rev reads at once)
  if (name === 'roll' && mt < 0) {
    const tuck = sstep((mt + mv.anticT) / 0.1);
    out.ball = Math.max(out.ball, tuck);
    out.curl = mix(out.curl, 2.8, tuck);
    out.head = mix(out.head, 40, tuck);
    out.reach = mix(out.reach, -1, tuck);
    out.ears = mix(out.ears, -1, tuck);
  }
  out.ball = mix(out.ball, 1, rw);
  out.curl = mix(out.curl, 2.8, rw);
  out.head = mix(out.head, 40, rw);
  out.reach = mix(out.reach, -1, rw);
  out.ears = mix(out.ears, -1, rw);
  out.sit *= 1 - rw;
  out.hold *= 1 - rw;
  // (his gait, for the walk-pace check: a roll, never a run; one turn of the ball is one "step")
  const v = dt > 0 ? dOdo / dt : 0;
  a.gait = { run: 0, v, walkSpeed: (m.def?.speed ?? 46) * 1.2, cadence: v / (TAU * R), roll: true };
  // Calm: standing about with nothing else on (the act shows only then, fading in and out)
  const calmGoal = !mv && m.hp > 0 && !napping && !m.pose && !m.cine && !hurt && !fighting && !moving && rw < 0.05 ? 1 : 0;
  st.tdCalm = mix(st.tdCalm ?? 0, calmGoal, k(calmGoal ? 1.8 : 7));
  const cw = sstep(st.tdCalm);
  // The piece he is playing: started as he settles; the next once one ends (a breath between), the
  // first in turn that fits the time he has before he moves on (m.restUntil, from world/mobs.js); none
  // when nothing fits. Dropped once he's no longer calm, or the clock went back (a stage's replay).
  let P = st.tdPiece ?? null;
  if (P && (now < P.t0 - 0.25 || (cw < 0.03 && !calmGoal))) P = null;
  if (P && P.name && now - P.t0 > PIECES[P.name] + 1.2) P = null;
  if (P && !P.name && now >= P.until) P = null;
  if (!P && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.tdN ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.tdN + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        P = { name: nm, t0: now + 0.2 };
        st.tdN = (st.tdN + i + 1) % ORDER.length;
        break;
      }
    }
    // (none fits: he just stands and breathes until his next dash)
    if (!P) P = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.tdPiece = P;
  const A = P && P.name ? actAt(P.name, now - P.t0) : { ...NONE, piece: null, u: 0 };
  // (the act on the channels, as much as he is calm)
  const sw = A.sit * cw;
  // (the base's own sit-up-and-look-round gives way to his act while he is calm)
  out.sit *= 1 - cw;
  out.hold *= 1 - cw;
  out.sit = mix(out.sit, 1, sw);
  out.hold = mix(out.hold, 0.36 + 0.64 * A.reach, sw);
  out.pitch = mix(out.pitch, -2, sw);
  out.head += (-12 * A.look * (1 - A.admire) - 12 * A.admire + 4 * Math.sin(A.u * 1.7) * A.admire) * sw;
  out.ears = mix(out.ears, 0.4 + 0.5 * A.admire, sw);
  // curled into a ball, holding very still (no breath), then the peek out
  const bw = A.ball * cw;
  const pw = A.peek * cw;
  out.ball = mix(out.ball, 1, bw);
  out.curl = mix(out.curl, 2.8, bw);
  out.head = mix(out.head, 44, bw);
  out.reach = mix(out.reach, -1, bw);
  out.ears = mix(out.ears, -1, bw);
  out.lift *= 1 - bw;
  out.ball = mix(out.ball, 0.42, pw);
  out.curl = mix(out.curl, 1.0, pw);
  out.head = mix(out.head, -6 + 5 * Math.sin(A.u * 5), pw);
  out.reach = mix(out.reach, 0.35, pw);
  out.ears = mix(out.ears, 1, pw);
  // the wet-dog shake (a twist back and forth, quick and even, the head a beat behind)
  const sk = A.shake * cw;
  const ph = (A.u - 0.8) * TAU * 5.2;
  out.crouch += A.tense * cw * 0.5;
  out.pitch += sk * 7 * Math.sin(ph);
  out.head += sk * 18 * Math.sin(ph - 0.9);
  out.ears = mix(out.ears, -0.6 + 0.6 * Math.sin(ph - 1.6), sk);
  out.hop += sk * 0.015 * Math.abs(Math.sin(ph));
  // the paws up over his shoulder to the twig while he snips
  const rwp = A.reach * sw;
  a.dressPaw = rwp > 0.002 ? (side) => [1.0 * rwp + (side ? -0.5 : 0), -2.6 * rwp] : null;
  // the leaves fluffed out in a shake (the act's or a move's), settling neat on a spring
  let fluffGoal = sk;
  if (name === 'shake') fluffGoal = Math.max(fluffGoal, mt >= MOVES.shake.burst ? 1 - sstep((mt - 0.2) / 0.3) : clamp(1 + mt / mv.anticT, 0, 1) * 0.15);
  const fs = (st.tdFluff ??= { x: 0, v: 0 });
  if (dt > 0) {
    const n = Math.max(1, Math.ceil(dt * 240));
    for (let i = 0; i < n; i++) {
      fs.v += ((fluffGoal - fs.x) * 260 - fs.v * 15) * (dt / n);
      fs.x += fs.v * (dt / n);
    }
  }
  a.tdFluff = clamp(fs.x, -0.3, 1.4);
  a.tdAct = { ...A, cw };
  a.tdRollW = rw;
  // the snips: how far open, and which way they point (each on its own ease)
  let openGoal = 0.25;
  let angGoal = -1.2;
  const u = A.u;
  if (A.sit * cw > 0.05) {
    angGoal = mix(-1.2, -1.0, A.reach);
    const close = Math.max(win(u, SNIP1 - 0.05, SNIP1, SNIP1 + 0.1, SNIP1 + 0.3), win(u, SNIP2 - 0.05, SNIP2, SNIP2 + 0.1, SNIP2 + 0.3));
    openGoal = mix(0.25, 1, A.reach) * (1 - close);
  }
  if (name === 'snip') {
    angGoal = mt < 0 ? -1.9 : mix(-1.9, -0.15, sstep(mt / 0.06));
    const shut = MOVES.snip.snaps.reduce((s, t0) => Math.max(s, win(mt, t0 - 0.03, t0, t0 + 0.03, t0 + 0.08)), 0);
    openGoal = mt < 0 ? 1 : (1 - shut) * (mt < 0.3 ? 1 : 0.3);
  }
  st.tdOpen = mix(st.tdOpen ?? 0.25, openGoal, k(name === 'snip' || A.reach > 0.5 ? 40 : 10));
  st.tdAng = mix(st.tdAng ?? -1.2, angGoal, k(name === 'snip' ? 45 : 16));
  a.tdOpen = st.tdOpen;
  // (the snips come out only for the sprig and the Snip Snip, eased in and out)
  st.tdSnipW = mix(st.tdSnipW ?? 0, A.sit * cw > 0.05 || name === 'snip' ? 1 : 0, k(name === 'snip' ? 30 : 8));
  a.tdSnipW = st.tdSnipW;
  a.tdAng = st.tdAng;
  // His mood: beaten, hurt, asleep, a move, a scene's, rolling, the act's, low on health, calm
  let mood = 'calm';
  const cine = m.cine?.mood;
  if (m.hp <= 0) mood = 'dizzy';
  else if (hurt) mood = 'hurt';
  else if (napping) mood = 'sleep';
  else if (name === 'snip' || name === 'shake') mood = 'fierce';
  else if (name === 'roll') mood = 'squeeze';
  else if (cine === 'happy') mood = 'happy';
  else if (cine === 'sad') mood = 'sad';
  else if (cine === 'angry') mood = 'cross';
  else if (cine === 'talk' || m.talking) mood = 'talk';
  else if (rw > 0.5) mood = 'squeeze';
  else if (cw > 0.5 && A.face !== 'calm') mood = A.face;
  else if (m.hp < m.def.hp * 0.25) mood = 'worried';
  let F = FACES[mood];
  if (mood === 'talk') {
    const vw = VOWELS[Math.floor((a.t ?? 0) * 7) % VOWELS.length];
    F = { ...F, mw: vw[0], ms: vw[1], mo: vw[2] };
  }
  const f = (st.tdF ??= { lid: 0, bt: 0, by: 0, mw: 0.8, ms: 0.6, mo: 0, bl: 0.5, lw: 0.25, wide: 1, shut: { happy: 1, sleep: 0, squeeze: 0, dizzy: 0, still: 0 } });
  const fast = k(14);
  for (const key of ['bt', 'by', 'mw', 'ms', 'mo', 'bl', 'lw', 'wide']) f[key] = mix(f[key], F[key], fast);
  f.lid = mix(f.lid, F.lid, k(18));
  for (const s of SHUTS) f.shut[s] = mix(f.shut[s], s === F.shut ? 1 : 0, k(12));
  a.tdF = f;
  a.tdMood = mood;
  a.tdMove = name ? { name, t: mt } : null;
}
// (each frame once he's drawn: the ball's radius and how far his hedge dipped under the floor,
// measured on the skeleton drawn this frame, for the next)
function measure(a) {
  const sk = a.bk;
  const st = a.mo?.rig;
  if (!sk || !st) return;
  st.tdR = mix(st.tdR ?? 11, Math.max(6, -sk.pivot[1]), 0.3);
  let low = -Infinity;
  for (const list of [HEDGE_SHAPE.leaves, HEDGE_SHAPE.scallops]) for (const [x, y, r] of list) low = Math.max(low, sk.at([x, y])[1] + r * 1.05);
  st.tdPen = clamp(low, -3, 3);
}

// ---------- Drawing him ----------
// The hedge: one shape (the outer edge, its leaf bumps, the skirt's scallops), outlined on its own
// edge in a deep green; filled green, its leafy clumps lit from the top, a moonlit rim along the top.
function hedgePath(ctx, a, K, grow = 0) {
  const sk = a.bk;
  const fl = a.tdFluff ?? 0;
  const t = a.t ?? 0;
  ctx.beginPath();
  HEDGE_SHAPE.ring.forEach((p, i) => {
    const q = sk.at(p);
    i ? ctx.lineTo(...q) : ctx.moveTo(...q);
  });
  ctx.closePath();
  const bump = (list, k0) =>
    list.forEach(([x, y, r], i) => {
      // (fluffed: each leaf pushed out from the body's middle a little, nodding on its own)
      const d = [x - HC[0], y - HC[1]];
      const l = Math.hypot(...d) || 1;
      const out = fl * (0.9 + 0.35 * Math.sin(i * 2.7 + t * 30) * clamp(fl, 0, 1)) * k0;
      const q = sk.at([x + (d[0] / l) * out, y + (d[1] / l) * out]);
      const rr = K.sc(r * (1 + 0.12 * fl)) + grow;
      ctx.moveTo(q[0] + rr, q[1]);
      ctx.arc(q[0], q[1], rr, 0, TAU);
    });
  bump(HEDGE_SHAPE.leaves, 1);
  bump(HEDGE_SHAPE.scallops, 0.6);
}
function hedge(ctx, a, mode, K) {
  const sk = a.bk;
  if (mode === 'line') {
    hedgePath(ctx, a, K);
    ctx.strokeStyle = HEDGE.ink;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    return;
  }
  hedgePath(ctx, a, K);
  ctx.fillStyle = K.colour(a, HEDGE.base);
  ctx.fill('nonzero');
  ctx.save();
  hedgePath(ctx, a, K);
  ctx.clip('nonzero');
  const fl = a.tdFluff ?? 0;
  const t = a.t ?? 0;
  // (a soft shade low along the skirt, where it lies over his fur, and round the body's far side)
  for (const [x, y] of HEDGE_SHAPE.scallops) K.glow(ctx, sk.at([x, y - 0.4]), K.sc(2.6), 0.35, HEDGE.sh);
  // the leafy clumps: soft round cushions of leaves, shaded under, a few little leaves catching the
  // moonlight on top of each
  HEDGE_SHAPE.clumps.forEach(([x, y, r], i) => {
    const c = sk.at([x + Math.sin(i * 1.9 + t * 28) * 0.25 * fl, y]);
    const rr = K.sc(r);
    K.glow(ctx, [c[0] + rr * 0.2, c[1] + rr * 0.55], rr * 1.05, 0.42, HEDGE.deep);
    K.glow(ctx, [c[0] - rr * 0.25, c[1] - rr * 0.3], rr * 0.95, 0.5, HEDGE.lt);
    for (let j = 0; j < 3; j++) {
      const q = -0.6 + j * 0.75 + Math.sin(i * 3.1 + j) * 0.3;
      const p = [c[0] + Math.cos(-2.2 + j * 0.9 + i) * rr * 0.45, c[1] + Math.sin(-2.2 + j * 0.9 + i) * rr * 0.4 - rr * 0.1];
      ctx.beginPath();
      ctx.ellipse(p[0], p[1], rr * 0.34, rr * 0.17, q, 0, TAU);
      ctx.fillStyle = K.tint(a, j === 1 ? HEDGE.rim : HEDGE.lt, 0.55);
      ctx.fill();
    }
  });
  // the leaf bumps round the top: lit by the moon
  HEDGE_SHAPE.leaves.forEach(([x, y, r], i) => {
    const c = sk.at([x, y]);
    const rr = K.sc(r);
    const up = sstep((-(c[1] - sk.pivot[1]) / K.sc(6)) * 0.8 + 0.2);
    K.glow(ctx, [c[0] - rr * 0.25, c[1] - rr * 0.35], rr * 0.85, 0.35 + 0.4 * up, i % 3 ? HEDGE.lt : HEDGE.rim);
  });
  ctx.restore();
}
// A little fringe of the hedge over the back of his head (in the head's frame), his near ear poking
// out of it.
const FRINGE = [-3.05, -2.75, -2.45, -2.15, -1.85, -1.55].map((q, i) => [q, 1.75 + 0.2 * Math.sin(i * 2.1)]);
function fringePath(ctx, a, K) {
  const H = K.P.head;
  const rx = K.sc(H.skull[0]);
  const ry = K.sc(H.skull[1]);
  const fl = a.tdFluff ?? 0;
  ctx.beginPath();
  for (const [q, r] of FRINGE) {
    const k = 0.93 + 0.08 * fl;
    const c = [Math.cos(q) * rx * k, Math.sin(q) * ry * k];
    const rr = K.sc(r);
    ctx.moveTo(c[0] + rr, c[1]);
    ctx.arc(c[0], c[1], rr, 0, TAU);
  }
  // (and its root inside the skull, so it never floats off it)
  ctx.moveTo(-rx * 0.55, -ry * 0.25);
  ctx.ellipse(-rx * 0.45, -ry * 0.55, rx * 0.48, ry * 0.38, -0.3, 0, TAU);
}
function fringe(ctx, a, mode, K) {
  K.headFrame(ctx, a);
  // (clipped to the far side of a line behind the eye, so nothing ever covers his face)
  fringePath(ctx, a, K);
  if (mode === 'line') {
    ctx.strokeStyle = HEDGE.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    return;
  }
  ctx.fillStyle = K.colour(a, HEDGE.base);
  ctx.fill('nonzero');
  ctx.save();
  fringePath(ctx, a, K);
  ctx.clip('nonzero');
  const rx = K.sc(K.P.head.skull[0]);
  const ry = K.sc(K.P.head.skull[1]);
  for (const [q, r] of FRINGE) K.glow(ctx, [Math.cos(q) * rx * 0.93 - K.sc(0.5), Math.sin(q) * ry * 0.93 - K.sc(0.6)], K.sc(r), 0.75, HEDGE.lt);
  K.glow(ctx, [-rx * 0.2, -ry * 0.1], K.sc(3), 0.5, HEDGE.deep);
  ctx.restore();
}
// The rose tucked into the top of the hedge, rooted inside it, nodding on a spring.
function roseSpot(a, K) {
  const sk = a.bk;
  const st = a.mo.rig;
  const root = sk.at([-3.2, -8.0]);
  const top = sk.at([-4.2, -10.6]);
  const base = Math.atan2(top[1] - root[1], top[0] - root[0]);
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const R = (st.tdRose ??= { x: 0, v: 0, last: root });
  if (dt > 0) {
    const acc = [(root[0] - R.last[0]) / dt, (root[1] - R.last[1]) / dt];
    R.v += (-R.x * 180 - R.v * 9 - acc[0] * 0.25) * dt;
    R.x = clamp(R.x + R.v * dt, -0.6, 0.6);
  }
  R.last = root;
  const an = base + R.x + (a.tdFluff ?? 0) * 0.15 * Math.sin((a.t ?? 0) * 31);
  return { root, an };
}
function rose(ctx, a, mode, K) {
  const { root, an } = roseSpot(a, K);
  const s = K.sc(1);
  ctx.translate(...root);
  ctx.rotate(an + Math.PI / 2);
  // (in its own frame: up is -y; the bloom sits 2.6 up from its root inside the hedge)
  const by = -2.7 * s;
  const petals = [[-1.5, 0.2, 1.45], [1.5, 0.2, 1.45], [0, -0.9, 1.5], [-0.9, 0.9, 1.3], [0.9, 0.9, 1.3]];
  const path = () => {
    ctx.beginPath();
    for (const [x, y, r] of petals) {
      ctx.moveTo(x * s + r * s, by + y * s);
      ctx.arc(x * s, by + y * s, r * s, 0, TAU);
    }
    // two leaves at its foot, down in the hedge
    for (const sd of [-1, 1]) {
      ctx.moveTo(0, by + 1.6 * s);
      ctx.ellipse(sd * 1.9 * s, by + 2.0 * s, 1.5 * s, 0.7 * s, sd * 0.45, 0, TAU);
    }
  };
  path();
  if (mode === 'line') {
    ctx.strokeStyle = ROSE.ink;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    return;
  }
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(sd * 1.9 * s, by + 2.0 * s, 1.5 * s, 0.7 * s, sd * 0.45, 0, TAU);
    ctx.fillStyle = K.colour(a, HEDGE.sh);
    ctx.fill();
  }
  ctx.beginPath();
  for (const [x, y, r] of petals) {
    ctx.moveTo(x * s + r * s, by + y * s);
    ctx.arc(x * s, by + y * s, r * s, 0, TAU);
  }
  ctx.fillStyle = K.colour(a, ROSE.base);
  ctx.fill('nonzero');
  // the swirl of the bloom: a lighter cup and a curl of deeper pink
  ctx.beginPath();
  ctx.arc(0, by - 0.1 * s, 1.35 * s, 0, TAU);
  ctx.fillStyle = K.colour(a, ROSE.lt);
  ctx.fill();
  ctx.strokeStyle = K.colour(a, ROSE.sh);
  ctx.lineWidth = 0.45 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0.1 * s, by, 0.75 * s, -0.4, 3.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-0.05 * s, by + 0.05 * s, 0.3 * s, 0.6, 4.2);
  ctx.stroke();
  K.glow(ctx, [-0.6 * s, by - 0.8 * s], 1.2 * s, 0.7, '#ffffff');
}
// The stray sprig: out of the hedge fringe on top of his head, arching forward over his brow to dangle
// just in front of his nose (where his little snips can reach it); cut short, springing back (with a
// rosebud on the end the second time). Rooted inside the fringe.
const SPRIG = [[0.6, -6.0], [7.4, -9.4], [11.2, 0.4]];
function twigPts(a, K) {
  const A = a.tdAct;
  const sk = a.bk;
  const raw = (A?.twig ?? 0) * (A?.cw ?? 0);
  if (raw <= 0.01) return null;
  const L = Math.min(1, raw);
  // (springing back past full length: the tip bobs down and up again)
  const bob = (raw - L) * 6 + 0.35 * Math.sin((a.t ?? 0) * 2.1);
  const [p0, c0, p2] = SPRIG;
  const c = [c0[0], c0[1] + bob * 0.4];
  const e = [p2[0] - bob * 0.2, p2[1] + bob];
  const pts = [];
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * L;
    const q = [0, 1].map((k) => (1 - u) * (1 - u) * p0[k] + 2 * (1 - u) * u * c[k] + u * u * e[k]);
    pts.push(sk.headPt(q));
  }
  const tip = pts[n];
  const pre = pts[n - 1];
  const an = Math.atan2(tip[1] - pre[1], tip[0] - pre[0]);
  return { pts, tip, an, L };
}
function twig(ctx, a, mode, K) {
  const T = twigPts(a, K);
  if (!T) return;
  const s = K.sc(1);
  const A = a.tdAct;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const stem = (w, col) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.beginPath();
    T.pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
    ctx.stroke();
  };
  const leafAt = (u, sd) => {
    const i = Math.min(T.pts.length - 2, Math.floor(u * (T.pts.length - 1)));
    const [p, q0] = [T.pts[i], T.pts[i + 1]];
    const q = Math.atan2(q0[1] - p[1], q0[0] - p[0]) + sd * 0.95;
    return [p[0] + Math.cos(q) * 1.0 * s, p[1] + Math.sin(q) * 1.0 * s, q];
  };
  const leaves = T.L > 0.6 ? [leafAt(0.45, -1), leafAt(0.75, 1)] : [leafAt(0.6, -1)];
  const bud = (A?.bud ?? 0) * (A?.cw ?? 0);
  if (mode === 'line') {
    stem(0.8 * s + 2, HEDGE.ink);
    for (const [x, y, q] of leaves) {
      ctx.beginPath();
      ctx.ellipse(x, y, 1.1 * s + 1, 0.55 * s + 1, q, 0, TAU);
      ctx.fillStyle = HEDGE.ink;
      ctx.fill();
    }
    if (bud > 0.02) {
      ctx.beginPath();
      ctx.arc(T.tip[0], T.tip[1] + 0.6 * s * bud, 1.15 * s * bud + 1, 0, TAU);
      ctx.fillStyle = ROSE.ink;
      ctx.fill();
    }
    return;
  }
  stem(0.8 * s, K.colour(a, TWIG));
  for (const [x, y, q] of leaves) {
    ctx.beginPath();
    ctx.ellipse(x, y, 1.1 * s, 0.55 * s, q, 0, TAU);
    ctx.fillStyle = K.colour(a, HEDGE.base);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - 0.15 * s, y - 0.15 * s, 0.6 * s, 0.25 * s, q, 0, TAU);
    ctx.fillStyle = K.colour(a, HEDGE.lt);
    ctx.fill();
  }
  if (bud > 0.02) {
    // a little rosebud hanging off the tip, its green cup on top
    const r = 1.15 * s * bud;
    const c = [T.tip[0], T.tip[1] + r * 0.55];
    ctx.beginPath();
    ctx.ellipse(c[0], c[1], r * 0.85, r, 0, 0, TAU);
    ctx.fillStyle = K.colour(a, ROSE.base);
    ctx.fill();
    ctx.strokeStyle = K.colour(a, ROSE.sh);
    ctx.lineWidth = 0.35 * s;
    ctx.beginPath();
    ctx.arc(c[0] + r * 0.1, c[1] + r * 0.1, r * 0.45, -0.6, 2.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(c[0], c[1] - r * 0.7, r * 0.75, r * 0.38, 0, 0, TAU);
    ctx.fillStyle = K.colour(a, HEDGE.base);
    ctx.fill();
    K.glow(ctx, [c[0] - r * 0.3, c[1] - r * 0.15], r * 0.6, 0.8, '#ffffff');
  }
}
// The garden snips in his forepaws (only while they are up): two rounded silver blades on a pivot,
// two pink loop handles round his paws.
function snips(ctx, a, mode, K) {
  const sk = a.bk;
  const up = sstep((sk.hk - 0.45) / 0.3) * (a.tdSnipW ?? 0);
  if (up <= 0.01) return;
  const s = K.sc(1.35);
  const P0 = sk.legs.foreN.P;
  const P1 = sk.legs.foreF.P;
  const g = [mix(P0[0], P1[0], 0.35), mix(P0[1], P1[1], 0.35)];
  const an = a.tdAng ?? -1.2;
  const op = clamp(a.tdOpen ?? 0.25, 0, 1) * 0.42;
  ctx.globalAlpha *= up;
  ctx.translate(...g);
  ctx.rotate(an);
  // (in its own frame: the blades out along +x from the pivot at +1.6, the loops behind it)
  const blade = (sd, grow) => {
    ctx.save();
    ctx.translate(1.6 * s, 0);
    ctx.rotate(sd * op);
    ctx.moveTo(-0.4 * s, -0.55 * s * sd - grow);
    ctx.quadraticCurveTo(2.6 * s, -1.0 * s * sd - grow * sd, 4.1 * s + grow, -0.1 * s * sd);
    ctx.quadraticCurveTo(4.3 * s + grow, 0.35 * s * sd, 3.6 * s, 0.25 * s * sd + grow * sd);
    ctx.lineTo(-0.2 * s, 0.35 * s * sd + grow * sd);
    ctx.closePath();
    ctx.restore();
  };
  const loops = (grow) => {
    for (const sd of [-1, 1]) {
      ctx.save();
      ctx.translate(1.6 * s, 0);
      ctx.rotate(-sd * op * 0.8);
      ctx.moveTo(-1.6 * s + 1.0 * s + grow, sd * 0.65 * s);
      ctx.ellipse(-1.6 * s, sd * 0.65 * s, 1.0 * s + grow, 0.7 * s + grow, 0, 0, TAU);
      ctx.restore();
    }
  };
  if (mode === 'line') {
    ctx.beginPath();
    blade(1, 0);
    blade(-1, 0);
    ctx.strokeStyle = STEEL.ink;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.beginPath();
    loops(0);
    ctx.strokeStyle = GRIP.ink;
    ctx.stroke();
    return;
  }
  // the loop handles: pink rings round his paws (a hole through the middle)
  for (const sd of [-1, 1]) {
    ctx.save();
    ctx.translate(1.6 * s, 0);
    ctx.rotate(-sd * op * 0.8);
    ctx.beginPath();
    ctx.ellipse(-1.6 * s, sd * 0.65 * s, 1.0 * s, 0.7 * s, 0, 0, TAU);
    ctx.ellipse(-1.6 * s, sd * 0.65 * s, 0.5 * s, 0.3 * s, 0, 0, TAU, true);
    ctx.fillStyle = K.colour(a, sd > 0 ? GRIP.sh : GRIP.base);
    ctx.fill('evenodd');
    ctx.restore();
  }
  for (const sd of [1, -1]) {
    ctx.beginPath();
    blade(sd, 0);
    ctx.fillStyle = K.colour(a, sd > 0 ? STEEL.sh : STEEL.base);
    ctx.fill();
  }
  ctx.save();
  ctx.translate(1.6 * s, 0);
  ctx.rotate(-op);
  K.glow(ctx, [2.2 * s, -0.45 * s], 1.4 * s, 0.9, STEEL.lt);
  ctx.restore();
  // the pivot rivet
  ctx.beginPath();
  ctx.arc(1.6 * s, 0, 0.38 * s, 0, TAU);
  ctx.fillStyle = K.colour(a, GRIP.sh);
  ctx.fill();
}

// His face, in the head's frame (facing right): bead eyes, fur-tuft brows, a berry nose, a mouth.
function face(ctx, a, sk, K) {
  const f = a.tdF;
  if (!f) return;
  const sc = K.sc;
  const H = K.P.head;
  const rx = sc(H.skull[0]);
  const ry = sc(H.skull[1]);
  const t = a.t ?? 0;
  const ink = K.colour(a, '#5b3a35');
  const line = (pts, w, col = ink) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = sc(w);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    ctx.stroke();
  };
  const blink = f.lid < 0.6 && a.tdMood !== 'still' && !a.tdMove ? win((t + 0.7 + ((a.mo?.uid ?? 0) % 5) * 0.6) % 4.1, 3.7, 3.78, 3.86, 3.96) : 0;
  const L = Math.max(f.lid, blink);
  // the blush, low on his cheek
  K.glow(ctx, [rx * 0.42, ry * 0.36], sc(2.6), 0.55 * f.bl, '#ff8fae');
  const eye = (ex, ey, s0, far) => {
    const ew = sc(1.5) * s0 * f.wide;
    const eh = sc(1.75) * f.wide;
    const closed = sstep((L - 0.7) / 0.3);
    const open = 1 - closed;
    if (closed > 0.01) {
      ctx.save();
      ctx.globalAlpha *= closed;
      const w = 0.6;
      if (f.shut.happy > 0.01) {
        ctx.globalAlpha *= f.shut.happy;
        line([[ex - ew, ey + eh * 0.25], [ex, ey - eh * 0.85], [ex + ew, ey + eh * 0.25]], w);
        ctx.globalAlpha /= f.shut.happy;
      }
      if (f.shut.still > 0.01) {
        ctx.globalAlpha *= f.shut.still;
        line([[ex - ew, ey], [ex, ey + eh * 0.1], [ex + ew, ey]], w);
        ctx.globalAlpha /= f.shut.still;
      }
      if (f.shut.sleep > 0.01) {
        ctx.globalAlpha *= f.shut.sleep;
        line([[ex - ew, ey - eh * 0.1], [ex, ey + eh * 0.55], [ex + ew, ey - eh * 0.1]], w);
        ctx.globalAlpha /= f.shut.sleep;
      }
      if (f.shut.squeeze > 0.01) {
        ctx.globalAlpha *= f.shut.squeeze;
        line([[ex + ew, ey - eh * 0.55], [ex - ew * 0.1, ey - eh * 0.1], [ex - ew * 0.9, ey + sc(0.05)]], w);
        line([[ex - ew * 0.9, ey + sc(0.05)], [ex - ew * 0.1, ey + eh * 0.2], [ex + ew, ey + eh * 0.55]], w);
        ctx.globalAlpha /= f.shut.squeeze;
      }
      if (f.shut.dizzy > 0.01) {
        ctx.globalAlpha *= f.shut.dizzy;
        ctx.strokeStyle = ink;
        ctx.lineWidth = sc(0.42);
        ctx.beginPath();
        for (let i = 0; i <= 26; i++) {
          const q = (i / 26) * TAU * 2 + t * 5 * (far ? -1 : 1);
          const r = (i / 26) * ew * 0.95;
          const p = [ex + Math.cos(q) * r, ey + Math.sin(q) * r * 1.1];
          i ? ctx.lineTo(...p) : ctx.moveTo(...p);
        }
        ctx.stroke();
        ctx.globalAlpha /= f.shut.dizzy;
      }
      ctx.restore();
    }
    if (open <= 0.01) return;
    ctx.save();
    ctx.globalAlpha *= open;
    const Lo = clamp(L, 0, 0.85);
    // the lids: the upper coming down, the lower rising in a smile; the bead shows only between
    // them (so his own fur, lit as it is, is the lid)
    const ly = ey - eh + eh * 1.9 * Lo;
    const lw = f.lw;
    const low = ey + eh * (1.05 - 0.75 * lw);
    ctx.save();
    ctx.beginPath();
    // (open, the lid's edge follows the bead's round top; lowered, it flattens into a heavy lid)
    ctx.moveTo(ex - ew * 1.3, ly + eh * 0.12 + eh * 0.5 * (1 - Lo));
    ctx.quadraticCurveTo(ex, ly - eh * 0.12 - eh * 0.75 * (1 - Lo), ex + ew * 1.3, ly + eh * 0.12 + eh * 0.5 * (1 - Lo));
    ctx.lineTo(ex + ew * 1.3, low + eh * 0.25);
    ctx.quadraticCurveTo(ex, low - eh * 0.2, ex - ew * 1.3, low + eh * 0.25);
    ctx.closePath();
    ctx.clip();
    // the bead: deep glossy brown, a warm glow low in it
    ctx.beginPath();
    ctx.ellipse(ex, ey, ew, eh, 0, 0, TAU);
    const g = ctx.createRadialGradient(ex + ew * 0.1, ey + eh * 0.45, 0, ex, ey, eh * 1.1);
    g.addColorStop(0, '#8a5a44');
    g.addColorStop(0.45, '#4a2a26');
    g.addColorStop(1, '#2a161a');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
    // the glints: a big round one up front, a little one low behind
    if (L < 0.8) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex + ew * 0.3, Math.max(ly + eh * 0.42, ey - eh * 0.38), ew * 0.42, 0, TAU);
      ctx.fill();
      // (and a pinpoint of moonlight beside it, for a bright, pleased look)
      ctx.beginPath();
      ctx.arc(ex + ew * 0.62, Math.max(ly + eh * 0.5, ey - eh * 0.05), ew * 0.12, 0, TAU);
      ctx.fill();
      ctx.globalAlpha *= 0.85;
      ctx.beginPath();
      ctx.arc(ex - ew * 0.34, Math.min(ey + eh * 0.42, low - eh * 0.1), ew * 0.15, 0, TAU);
      ctx.fill();
      ctx.globalAlpha /= 0.85;
    }
    // the lid line (soft and heavy), one rounded lash curling back, the soft lower lid
    line([[ex - ew * 1.08, ly + eh * 0.45 * (1 - Lo)], [ex, ly - sc(0.18) - eh * 0.5 * (1 - Lo)], [ex + ew * 1.02, ly + eh * 0.4 * (1 - Lo)]], 0.5);
    if (!far) {
      const b = [ex - ew * 0.95, ly + eh * 0.3 * (1 - Lo)];
      line([b, [b[0] - sc(0.6), b[1] - sc(0.15)], [b[0] - sc(0.85), b[1] - sc(0.7)]], 0.42);
    }
    ctx.globalAlpha *= 0.7;
    line([[ex - ew * 0.8, low + eh * 0.1], [ex, low - eh * 0.02], [ex + ew * 0.8, low + eh * 0.1]], 0.32, K.colour(a, FUR.deep));
    ctx.restore();
  };
  // the near eye, and the far one just round the front of his face (smaller, turned away)
  const look = (a.tdMood === 'focus' || a.tdMood === 'cross') && (a.tdAct?.reach ?? 0) > 0.1 ? -0.1 : 0;
  const ey = -ry * 0.12;
  eye(rx * (0.3 + look), ey, 1, false);
  eye(rx * (0.86 + look * 0.5), ey - sc(0.15), 0.55, true);
  // the brows: soft fur tufts, tilted by the mood (+ knit, the front end down)
  const brow = (bx, s0) => {
    ctx.save();
    ctx.translate(bx, ey - sc(3.1) - f.by * sc(0.8));
    ctx.rotate(f.bt * 0.45);
    ctx.beginPath();
    ctx.ellipse(-sc(0.45) * s0, 0, sc(0.95) * s0, sc(0.42), -0.15, 0, TAU);
    ctx.ellipse(sc(0.55) * s0, -sc(0.08), sc(0.75) * s0, sc(0.36), 0.2, 0, TAU);
    ctx.fillStyle = K.colour(a, FUR.deep);
    ctx.fill('nonzero');
    ctx.restore();
  };
  brow(rx * 0.3, 1);
  brow(rx * 0.86, 0.55);
  // the mouth, under the snout: from its width, smile and openness
  const mx = sc(H.muzzle[0] + 1.6);
  const my = sc(H.muzzle[1] + H.muzzle[3] * 0.62);
  const w = sc(1.6) * f.mw;
  const cy = my - f.ms * sc(0.55);
  if (f.mo > 0.08) {
    const o = f.mo;
    ctx.beginPath();
    ctx.moveTo(mx + w * 0.55, my - sc(0.1));
    ctx.quadraticCurveTo(mx - w * 0.2, my + sc(0.25) - o * sc(0.1), mx - w, cy);
    ctx.quadraticCurveTo(mx - w * 0.3, my + o * sc(1.8) + f.ms * sc(0.3), mx + w * 0.55, my - sc(0.1));
    ctx.fillStyle = K.colour(a, '#8a3f4c');
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.beginPath();
    ctx.ellipse(mx - w * 0.15, my + o * sc(1.5), w * 0.6, o * sc(0.8), 0, 0, TAU);
    ctx.fillStyle = K.colour(a, '#f08fa8');
    ctx.fill();
    ctx.restore();
  } else line([[mx + w * 0.55, my - sc(0.1)], [mx - w * 0.2, my + f.ms * sc(0.5)], [mx - w, cy]], 0.4, K.colour(a, FUR.mouth));
  // the berry nose: round and glossy, twitching now and then
  const tw = win(t % 3.3, 1.2, 1.3, 1.7, 1.9) * Math.sin(t * 38) * sc(0.18);
  const nx = sc(H.nose[0]) + sc(0.15);
  const ny = sc(H.nose[1]) + tw;
  const nr = sc(1.15);
  const ng = ctx.createRadialGradient(nx - nr * 0.3, ny - nr * 0.35, 0, nx, ny, nr);
  ng.addColorStop(0, '#c4587a');
  ng.addColorStop(0.6, '#8a2e4a');
  ng.addColorStop(1, '#6a2038');
  ctx.beginPath();
  ctx.arc(nx, ny, nr, 0, TAU);
  ctx.fillStyle = ng;
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.ellipse(nx - nr * 0.3, ny - nr * 0.4, nr * 0.32, nr * 0.22, -0.4, 0, TAU);
  ctx.fill();
  // a sweat drop for a worried look
  if (a.tdMood === 'worried' || a.tdMood === 'sigh') {
    const x = -rx * 0.15;
    const y = -ry * 0.3 + ((t * 0.6) % 1) * sc(0.8);
    ctx.fillStyle = 'rgba(200,236,255,0.95)';
    ctx.beginPath();
    ctx.moveTo(x, y - sc(1.1));
    ctx.quadraticCurveTo(x + sc(0.85), y + sc(0.3), x, y + sc(0.85));
    ctx.quadraticCurveTo(x - sc(0.85), y + sc(0.3), x, y - sc(1.1));
    ctx.fill();
  }
}

// ---------- His effects ----------
const leafFx = (ctx, x, y, s, q, al) => {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(q);
  ctx.beginPath();
  ctx.ellipse(0, 0, 1.2 * s, 0.6 * s, 0, 0, TAU);
  ctx.fillStyle = HEDGE.base;
  ctx.fill();
  ctx.strokeStyle = HEDGE.ink;
  ctx.lineWidth = 0.3 * s;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-0.2 * s, -0.15 * s, 0.6 * s, 0.25 * s, 0, 0, TAU);
  ctx.fillStyle = HEDGE.lt;
  ctx.fill();
  ctx.restore();
};
function sparkle(ctx, x, y, k, fill) {
  if (k <= 0.01) return;
  ctx.beginPath();
  ctx.moveTo(x, y - k);
  ctx.quadraticCurveTo(x, y, x + k, y);
  ctx.quadraticCurveTo(x, y, x, y + k);
  ctx.quadraticCurveTo(x, y, x - k, y);
  ctx.quadraticCurveTo(x, y, x, y - k);
  ctx.fillStyle = fill;
  ctx.fill();
}
const dust = (ctx, x, y, r, al) => {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = '#f4ecf8';
  ctx.fill();
  ctx.strokeStyle = '#d6c8e2';
  ctx.lineWidth = 0.3 * r;
  ctx.stroke();
  ctx.restore();
};
function fx(ctx, m, a, K) {
  measure(a);
  const sk = a.bk;
  if (!sk) return;
  const s = K.sc(1);
  const A = a.tdAct;
  const t = a.t ?? 0;
  ctx.save();
  if (A && A.cw > 0.01 && m.hp > 0) {
    const u = A.u;
    const pc = A.piece;
    // the snipped twig ends, tumbling off his back with a little puff of leaf bits
    for (const t0 of pc === 'sprig' ? [SNIP1, SNIP2] : []) {
      const k = (u - t0) / 0.9;
      if (k <= 0 || k >= 1) continue;
      const T = twigPts({ ...a, tdAct: { ...A, twig: 1 } }, K);
      if (!T) continue;
      const x = T.tip[0] - k * 6 * s;
      const y = T.tip[1] + (k * k * 14 - k * 3) * s;
      ctx.save();
      ctx.globalAlpha *= (1 - k) * A.cw;
      ctx.translate(x, y);
      ctx.rotate(k * 7);
      ctx.strokeStyle = TWIG;
      ctx.lineWidth = 0.8 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-1.4 * s, 0);
      ctx.lineTo(1.4 * s, 0);
      ctx.stroke();
      ctx.restore();
      leafFx(ctx, x + 1.2 * s, y - 0.6 * s, s * 0.8, k * 5, (1 - k) * A.cw);
      sparkle(ctx, T.tip[0], T.tip[1], 2.2 * s * (1 - sstep(k * 3)), rgba('#ffffff', 0.95 * A.cw));
    }
    // the springs back: a little "boing" arc off the tip
    for (const t0 of pc === 'sprig' ? [BACK1, BACK2] : []) {
      const k = (u - t0) / 0.5;
      if (k <= 0 || k >= 1) continue;
      const T = twigPts(a, K);
      if (!T) continue;
      ctx.globalAlpha = (1 - k) * 0.85 * A.cw;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.6 * s;
      for (const sd of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(T.tip[0], T.tip[1], (1.6 + k * 2.4) * s, T.an + sd * 0.9 - 0.4, T.an + sd * 0.9 + 0.4);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // admiring the bud: a tiny heart rising
    if (pc === 'sprig' && u > 7.1 && u < 8.8) {
      const k = (u - 7.1) / 1.7;
      const c = sk.headPt([2, -10 - k * 6]);
      const r = 1.1 * s * Math.sin(Math.PI * Math.min(1, k * 1.4));
      ctx.globalAlpha = Math.sin(Math.PI * k) * A.cw;
      ctx.fillStyle = '#ff9ec0';
      ctx.beginPath();
      ctx.moveTo(c[0], c[1] + r);
      ctx.bezierCurveTo(c[0] - r * 1.6, c[1] - r * 0.2, c[0] - r * 0.6, c[1] - r * 1.4, c[0], c[1] - r * 0.5);
      ctx.bezierCurveTo(c[0] + r * 0.6, c[1] - r * 1.4, c[0] + r * 1.6, c[1] - r * 0.2, c[0], c[1] + r);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // the ornament: one slow glint across the perfect ball
    if (pc === 'ornament' && u > 1.9 && u < 3.1) {
      const k = (u - 1.9) / 1.2;
      const c = sk.at([-2 + k * 4, -9]);
      sparkle(ctx, c[0], c[1], 2.4 * s * Math.sin(Math.PI * k) * A.cw, '#ffffff');
    }
    // ta-da: sparkles popping round him as he peeks out
    if (pc === 'ornament' && u > 4.8 && u < 5.9) {
      const k = (u - 4.8) / 1.1;
      const c = sk.at([0, -3]);
      for (let i = 0; i < 5; i++) {
        const q = -Math.PI / 2 + (i - 2) * 0.55;
        const d = (9 + 6 * sstep(k)) * s;
        sparkle(ctx, c[0] + Math.cos(q) * d, c[1] + Math.sin(q) * d, (1.6 - 0.6 * (i % 2)) * s * (1 - k) * A.cw, i % 2 ? '#fff6c8' : '#ffffff');
      }
    }
    // the shake: leaves flung off, flicking out and drifting down
    if (pc === 'shake' && u > 0.85 && u < 4.0) {
      for (let i = 0; i < 6; i++) {
        const k = (u - 0.9 - i * 0.32) / 1.0;
        if (k <= 0 || k >= 1) continue;
        const q = (i % 2 ? -1 : 1) * (0.8 + (i % 3) * 0.35) - Math.PI / 2;
        const c = sk.at([(i % 3) * 3 - 3, -6]);
        leafFx(ctx, c[0] + Math.cos(q) * 10 * s * sstep(k), c[1] + Math.sin(q) * 7 * s * sstep(k) + k * k * 9 * s, s * 0.9, k * 6 + i, (1 - k) * A.cw);
      }
    }
  }
  // the moves'
  const mvn = a.tdMove;
  if (mvn && m.hp > 0) {
    if (mvn.name === 'snip') {
      for (const t0 of MOVES.snip.snaps) {
        const k = (mvn.t - t0) / 0.24;
        if (k <= 0 || k >= 1) continue;
        const P0 = sk.legs.foreN.P;
        const an = a.tdAng ?? 0;
        const c = [P0[0] + Math.cos(an) * 6.2 * s, P0[1] + Math.sin(an) * 6.2 * s];
        sparkle(ctx, c[0], c[1], 3 * s * (1 - k), '#ffffff');
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.7 * s;
        ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
          const q = an - 0.7 + i * 0.7;
          const r0 = (2.6 + k * 2.4) * s;
          ctx.beginPath();
          ctx.moveTo(c[0] + Math.cos(q) * r0, c[1] + Math.sin(q) * r0);
          ctx.lineTo(c[0] + Math.cos(q) * (r0 + 1.8 * s), c[1] + Math.sin(q) * (r0 + 1.8 * s));
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        for (let i = 0; i < 2; i++) leafFx(ctx, c[0] + (2 + i * 2) * s * k, c[1] + (k * k * 8 - i * 2) * s, s * 0.8, k * 6 + i * 2, 1 - k);
      }
    } else if (mvn.name === 'roll') {
      const T = mvn.t;
      const c = sk.pivot;
      // rocking back to wind up: dust and leaf bits kicked out behind the ball
      if (T < 0.05) {
        const rev = clamp((T + MOVES.roll.anticT) / MOVES.roll.anticT, 0, 1);
        for (let i = 0; i < 3; i++) {
          const kk = ((T + 0.3) * 4 + i / 3) % 1;
          dust(ctx, c[0] - (5 + kk * 9) * s, -(0.8 + kk * 3) * s, (1 + kk * 1.2) * s, (1 - kk) * 0.7 * rev);
          if (i < 2) leafFx(ctx, c[0] - (4 + kk * 8) * s, -(2 + i * 2 + kk * 4) * s, s * 0.75, kk * 9 + i, (1 - kk) * rev);
        }
      }
      // bowling in: a trail of leaves; the bump: a burst of leaves and a sparkle at the front
      if (T > 0.02 && T < 0.3) for (let i = 0; i < 3; i++) {
        const kk = (T * 5 + i / 3) % 1;
        leafFx(ctx, c[0] - (6 + kk * 8) * s, -(1.5 + (i % 2) * 2.5 + kk * 2) * s, s * 0.8, kk * 9 + i, (1 - kk) * 0.9);
      }
      const kh = (T - MOVES.roll.hit) / 0.45;
      if (kh > 0 && kh < 1) {
        const f0 = [c[0] + K.sc(10), c[1]];
        sparkle(ctx, f0[0], f0[1], 3 * s * (1 - kh), '#ffffff');
        for (let i = 0; i < 5; i++) {
          const q = -Math.PI / 2 + (i - 2) * 0.5;
          const d = (3 + 9 * sstep(kh)) * s;
          leafFx(ctx, f0[0] + Math.cos(q) * d, f0[1] + Math.sin(q) * d + kh * kh * 6 * s, s * 0.85, q + kh * 6, 1 - kh);
        }
      }
    } else if (mvn.name === 'shake') {
      const k = (mvn.t - MOVES.shake.burst) / 0.55;
      if (k > 0 && k < 1) {
        const c = sk.at([-1, -3]);
        for (let i = 0; i < 9; i++) {
          const q = -Math.PI * 0.95 + (i / 8) * Math.PI * 0.95 + 0.1;
          const d = (8 + 12 * sstep(k)) * s;
          leafFx(ctx, c[0] + Math.cos(q) * d, c[1] + Math.sin(q) * d * 0.8 + k * k * 6 * s, s, q + k * 6, 1 - k);
        }
      }
    }
  }
  ctx.restore();
  void t;
}

// ---------- His dress on the rodent ----------
const look = {
  kind: 'hamster',
  C: FUR,
  P,
  ink: INK,
  moves: MOVES,
  face,
  pick: (m, a, st) => (typeof m.move === 'string' && MOVES[m.move] ? m.move : POOL[(st.rdN ?? 0) % POOL.length]),
  pose,
  after: (m, a, out, K) => {
    // (beaten: curled up loose, the dizzy face from the pose)
    if (m.hp <= 0) a.dressPaw = null;
    const st = a.mo.rig;
    const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
    const k = (rate) => 1 - Math.exp(-dt * rate);
    // A ball rests on its hedge, never sunk into the floor: lifted by however far the hedge's lowest
    // leaf dipped under the floor last frame (eased), while he is curled at all.
    const ballNow = clamp(out.ball, 0, 1);
    const pen = st.tdPen ?? 0;
    st.tdLift = ballNow > 0.15 ? clamp((st.tdLift ?? 0) + pen * k(6), 0, 8) : (st.tdLift ?? 0) * (1 - k(10));
    out.hop += (st.tdLift * sstep((ballNow - 0.15) / 0.5)) / K.H;
  },
  hide: { earF: true },
  under: {},
  over: {
    // the hedge over his body and legs (only the paws peek out below its skirt), the twig and the
    // rose in it; the fringe on his head; the snips in his paws
    foreN: (ctx, a, mode, K) => {
      hedge(ctx, a, mode, K);
      ctx.save();
      rose(ctx, a, mode, K);
      ctx.restore();
    },
    head: (ctx, a, mode, K) => {
      ctx.save();
      fringe(ctx, a, mode, K);
      ctx.restore();
      twig(ctx, a, mode, K);
    },
    hands: snips,
  },
  fx,
};

export const TOPIARY_HEDGEHOG = dressedRodent(look);
// (`noHop`: none of the monster drawer's little hops or idle notes over him; he shows his moods in his
// own act and face)
TOPIARY_HEDGEHOG.art.noHop = true;
// (his dress, for the dev tools that watch his parts frame by frame)
export const TOPIARY_HEDGEHOG_LOOK = look;
