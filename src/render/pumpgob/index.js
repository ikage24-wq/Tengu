// The Pumpkin Goblin (2026-11-25, remade on the bird base, the player's pick "C" of three, Honkers):
// Clover Hills' level 6 farm-field monster, one of Old MacGoblin's farmhands: the farm's
// self-appointed guard goose, plump and white, a bright orange bill with a knob on top, orange feet,
// a blue gingham neckerchief, bossy blue eyes, and an opinion about everyone. It moves on its own copy
// of the bird base (birdbase.js: its bones, waddle, springs and moves), grown from the duck into a
// goose (a longer neck of its own width, a smaller head, a plumper body) that never takes off.
//   idle    a 32 s act (see its pose below):
//           - on patrol: chest out, a pompous head-bobbing strut on the spot; then it freezes and
//             gives a long suspicious side-eye back over its shoulder, then a narrow squint ahead;
//           - the HONK: it spots something, puffs up, draws its neck back, then stretches tall, wings
//             flung wide, HONK! HONK!; then smooths its feathers with a smug little ruffle;
//           - preening: neck curled round to nibble its back; a feather pings loose, it watches it
//             float down to the grass, startled, then sheepish;
//           - an intruder (imaginary): a start ("!"), then the hiss, neck out low, wings wide, two
//             lunges at nothing; it waddles back and puffs its chest out, very proud of itself;
//           - a weed: head down, beak on it, three hard tugs, it pops out roots and all; a toss of
//             the head flings it away over its back; smug;
//           - a waddle-dance: rocking foot to foot, wings out, tail wagging, little bounces, sparkles.
//   moves   (def.moves order) the honk blast (neck drawn back, then thrust out, wings flung wide, a
//           "HONK!" burst and sound arcs off its bill), the charge (crouched, neck out low, wings
//           wide, a hissing rush and a peck), the wing slap (the base's own).
//   faces   bossy (a flat stern lid), cross before and in a move, a side-eye, a squint, startled,
//           wide on a honk, smug, sheepish, straining, happy, hurt (squeezed shut), asleep (sat down
//           with its head tucked, a little blue "z"), and soft swirl eyes when it's beaten.
// Everything drawn here from scratch (the face too). Text it draws ("HONK!") reads the right way
// round when it faces left (the rig's space is mirrored then).
import { dressedBird } from './birdbase.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, u) => a + (b - a) * u;
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
// (a beat's weight: 0 before t0, eased up to 1 by t1, held to t2, eased back to 0 by t3)
const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
// (a quick soft pulse 0..1..0 over [t0, t0 + d])
const pulse = (t, t0, d) => {
  const u = (t - t0) / d;
  return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
};
// (0..1 through [t0, t0 + d], else -1)
const span = (t, t0, d) => (t >= t0 && t < t0 + d ? (t - t0) / d : -1);
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const rot = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
};
const sparkle = (ctx, x, y, k) => {
  ctx.beginPath();
  ctx.moveTo(x, y - k);
  ctx.quadraticCurveTo(x, y, x + k, y);
  ctx.quadraticCurveTo(x, y, x, y + k);
  ctx.quadraticCurveTo(x, y, x - k, y);
  ctx.quadraticCurveTo(x, y, x, y - k);
  ctx.fill();
};

const INK = '#9a887c';
const EYE_INK = '#5a4a44';
const GS = {
  kerchief: '#5a8ee0', kerchiefSh: '#3e6cc0', check: '#ffffff', knob: '#ff8a2a', knobLt: '#ffd0a0',
  honk: '#ff7a2a', breath: '#ffd8b0', brow: '#b8aca4', blush: '#ffb0a8', zed: '#7aa6e8',
  weed: '#6cbf4a', weedSh: '#3f8a34', weedInk: '#4a7a3a', root: '#c8a070', soil: '#a87850', flower: '#ffe066',
};
const FEATHERS = { lt: '#ffffff', base: '#f7f3ec', sh: '#e2dad0', deep: '#c4b8b0' };

// ---------- Its face ----------
// Open eyes: [stern lid (0 none .. 1 shut), lid slant toward the bill, pupil size, iris turn (+
// toward the bill, - back), brow tilt (+ cross), brow lift].
const EYES = {
  open: [0.5, 0.12, 0.33, 0.16, 0.25, 0],
  angry: [0.62, 0.55, 0.3, 0.2, 1, 0],
  side: [0.56, -0.05, 0.3, -0.42, -0.55, 0.15],
  squint: [0.74, 0.22, 0.28, 0.24, 0.7, 0],
  startled: [-0.25, 0, 0.2, 0.05, -0.6, 0.55],
  honk: [-0.2, 0, 0.3, 0.12, -0.4, 0.35],
  sad: [0.42, -0.3, 0.36, 0.05, -0.9, 0.1],
};
function faceOf(a) {
  return a.gs?.face ?? 'open';
}
// A closed eye: a sleepy curve, a happy arc, or squeezed (hurt, straining).
function shut(ctx, a, K, x, y, r, kind) {
  ctx.strokeStyle = K.colour(a, EYE_INK);
  ctx.lineWidth = Math.max(0.4, K.sc(0.42));
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (kind === 'happy') {
    ctx.moveTo(x - r, y + r * 0.25);
    ctx.quadraticCurveTo(x, y - r * 0.8, x + r, y + r * 0.25);
  } else if (kind === 'squeeze') {
    ctx.moveTo(x - r * 0.9, y - r * 0.5);
    ctx.quadraticCurveTo(x + r * 0.1, y - r * 0.1, x + r * 0.65, y);
    ctx.quadraticCurveTo(x + r * 0.1, y + r * 0.12, x - r * 0.9, y + r * 0.55);
  } else {
    ctx.moveTo(x - r, y + r * 0.05);
    ctx.quadraticCurveTo(x, y + r * 0.62, x + r, y);
  }
  ctx.stroke();
}
// (the soft grey feather brow over the eye, tipping with its mood)
function brow(ctx, a, K, x, y, r, tilt, lift) {
  ctx.strokeStyle = K.colour(a, GS.brow);
  ctx.lineWidth = K.sc(0.75);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - r * 1.25, y - r * (1.55 + lift) + tilt * r * 0.4);
  ctx.quadraticCurveTo(x, y - r * (1.9 + lift), x + r * 1.15, y - r * (1.45 + lift) - tilt * r * 0.4);
  ctx.stroke();
}
// The eye, bossy blue: round, a sky-blue iris going deep navy at its top, a pale crescent below, a
// round pupil; a flat stern lid sitting low; a soft peach skin round it; the grey feather brow.
function eye(ctx, a, K, x, y) {
  const r = K.sc(2.0);
  const f = faceOf(a);
  const cl = (c) => K.colour(a, c);
  K.glow(ctx, [x, y + r * 0.2], r * 1.7, 0.55, '#ffd2b8');
  const cover = () => {
    ell(ctx, x, y, r * 1.02, r * 1.02);
    ctx.fillStyle = cl(K.C.base);
    ctx.fill();
  };
  if (f === 'dead') {
    // soft swirls
    cover();
    ctx.strokeStyle = cl(EYE_INK);
    ctx.lineWidth = Math.max(0.35, K.sc(0.36));
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 28; i++) {
      const u = i / 28;
      const q = u * TAU * 2.1;
      const p = [x + Math.cos(q) * r * 0.9 * u, y + Math.sin(q) * r * 0.9 * u];
      if (i) ctx.lineTo(...p);
      else ctx.moveTo(...p);
    }
    ctx.stroke();
    return;
  }
  if (f === 'hurt' || f === 'strain') {
    cover();
    shut(ctx, a, K, x, y, r, 'squeeze');
    if (f === 'strain') brow(ctx, a, K, x, y, r, 1, -0.1);
    return;
  }
  if (f === 'sleep' || f === 'blink' || f === 'smug' || f === 'happy') {
    cover();
    const up = f === 'smug' || f === 'happy';
    shut(ctx, a, K, x, y + (up ? 0 : r * 0.2), r, up ? 'happy' : 'shut');
    if (f === 'smug') brow(ctx, a, K, x, y, r, -0.6, 0.3);
    return;
  }
  const [lid, slant, pr, look, bt, bl] = EYES[f] ?? EYES.open;
  ell(ctx, x, y, r, r);
  ctx.fillStyle = cl('#ffffff');
  ctx.fill();
  ctx.save();
  ell(ctx, x, y, r, r);
  ctx.clip();
  const ix = x + r * look;
  const iy = y + r * (f === 'sad' ? 0.22 : 0.08);
  const g = ctx.createLinearGradient(0, iy - r, 0, iy + r);
  g.addColorStop(0, cl('#1e3a6e'));
  g.addColorStop(0.5, cl('#3f86d6'));
  g.addColorStop(1, cl('#a6e0ff'));
  ell(ctx, ix, iy, r * 0.74, r * 0.8);
  ctx.fillStyle = g;
  ctx.fill();
  ell(ctx, ix + r * 0.04, iy, r * pr, r * pr * 1.08);
  ctx.fillStyle = cl('#14203a');
  ctx.fill();
  ctx.fillStyle = K.tint(a, '#e4f6ff', 0.6);
  ctx.beginPath();
  ctx.ellipse(ix, iy + r * 0.42, r * 0.5, r * 0.28, 0, 0, Math.PI);
  ctx.ellipse(ix, iy + r * 0.3, r * 0.4, r * 0.14, 0, Math.PI, 0, true);
  ctx.fill();
  // the stern lid: flat and low, its front end lower when cross
  const lidB = y - r + lid * r * 1.4;
  const lidF = lidB + slant * r;
  if (lid > 0) {
    ctx.beginPath();
    ctx.moveTo(x - r * 1.3, y - r * 1.3);
    ctx.lineTo(x + r * 1.3, y - r * 1.3);
    ctx.lineTo(x + r * 1.3, lidF);
    ctx.lineTo(x - r * 1.3, lidB);
    ctx.closePath();
    ctx.fillStyle = cl(K.C.base);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  ell(ctx, ix - r * 0.3, Math.max(iy - r * 0.3, lidB + r * 0.3), r * 0.26, r * 0.22, -0.3);
  ctx.fill();
  ell(ctx, ix + r * 0.32, iy + r * 0.38, r * 0.11, r * 0.11);
  ctx.fill();
  // the lid's edge (a lash at the back), or round and wide; a soft lower lid
  ctx.strokeStyle = cl(EYE_INK);
  ctx.lineWidth = Math.max(0.4, K.sc(0.4));
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (lid > 0) {
    ctx.moveTo(x - r * 1.0, lidB + r * 0.12);
    ctx.lineTo(x + r * 0.98, lidF);
    ctx.moveTo(x - r * 0.95, lidB + r * 0.14);
    ctx.quadraticCurveTo(x - r * 1.35, lidB + r * 0.02, x - r * 1.5, lidB - r * 0.3);
  } else {
    ctx.ellipse(x, y, r * 1.02, r * 1.02, 0, Math.PI * 1.12, Math.PI * 1.88);
    ctx.moveTo(x - r * 0.92, y - r * 0.45);
    ctx.quadraticCurveTo(x - r * 1.35, y - r * 0.6, x - r * 1.5, y - r * 0.95);
  }
  ctx.stroke();
  ctx.strokeStyle = cl('#e0b8a8');
  ctx.lineWidth = Math.max(0.3, K.sc(0.28));
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.96, r * 0.96, 0, Math.PI * 0.25, Math.PI * 0.75);
  ctx.stroke();
  brow(ctx, a, K, x, y, r, bt, bl);
}
function face(ctx, a, sk, K) {
  const s = K.sc;
  const gs = a.gs ?? {};
  K.glow(ctx, [s(1.4), s(2.6)], s(1.8), 0.4 + (gs.blush ?? 0) * 0.4, GS.blush);
  eye(ctx, a, K, s(1.4), s(-1.4));
}
// The bill's knob: a round orange bump where the bill meets the forehead (head frame).
function knob(ctx, a, mode, K) {
  const s = K.sc;
  K.headFrame(ctx, a);
  const [bx, by] = K.P.beak.at.map(s);
  ell(ctx, bx + s(0.9), by - s(K.P.beak.h) * 0.62, s(1.5), s(1.25), -0.2);
  if (mode === 'line') return K.edge(ctx);
  ctx.fillStyle = K.colour(a, GS.knob);
  ctx.fill();
  K.glow(ctx, [bx + s(0.6), by - s(K.P.beak.h) * 0.8], s(0.9), 0.8, GS.knobLt);
}
// The neckerchief: a band round the bottom of the neck, its point hanging on the breast, swaying a
// little; blue gingham, a knot at the front.
function kerchief(ctx, a, mode, K) {
  const sk = a.bk;
  const s = K.sc;
  const d = [sk.hp[0] - sk.nb[0], sk.hp[1] - sk.nb[1]];
  const L = Math.hypot(...d) || 1;
  const u = [d[0] / L, d[1] / L];
  const n = [-u[1], u[0]];
  const c = [sk.nb[0] + u[0] * L * 0.32, sk.nb[1] + u[1] * L * 0.32];
  const hw = s(4.0);
  const A = [c[0] + n[0] * hw, c[1] + n[1] * hw];
  const B = [c[0] - n[0] * hw, c[1] - n[1] * hw];
  const A2 = [A[0] + u[0] * s(1.6), A[1] + u[1] * s(1.6)];
  const B2 = [B[0] + u[0] * s(1.6), B[1] + u[1] * s(1.6)];
  const sw = Math.sin((a.t ?? 0) * 2.4) * s(0.3) + (a.gs?.flap ?? 0) * s(0.8);
  const tip = [c[0] - u[0] * s(3.6) + s(2.6) + sw, c[1] - u[1] * s(3.6) + s(1.6)];
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(...A2);
    ctx.lineTo(...B2);
    ctx.lineTo(...B);
    ctx.quadraticCurveTo(B[0] + s(1.4), B[1] + s(2.2), ...tip);
    ctx.quadraticCurveTo(A[0] + s(1.6), A[1] + s(0.6), ...A);
    ctx.closePath();
  };
  path();
  if (mode === 'line') return K.edge(ctx);
  ctx.fillStyle = K.colour(a, GS.kerchief);
  ctx.fill();
  ctx.save();
  path();
  ctx.clip();
  ctx.strokeStyle = K.tint(a, GS.check, 0.42);
  ctx.lineWidth = s(0.6);
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(c[0] + i * s(1.15) - s(12), c[1] - s(12));
    ctx.lineTo(c[0] + i * s(1.15) + s(12), c[1] + s(12));
    ctx.moveTo(c[0] + i * s(1.15) + s(12), c[1] - s(12));
    ctx.lineTo(c[0] + i * s(1.15) - s(12), c[1] + s(12));
    ctx.stroke();
  }
  K.glow(ctx, tip, s(3), 0.5, GS.kerchiefSh);
  ctx.restore();
  const kn = [c[0] + n[0] * hw * 0.2 + u[0] * s(0.8) + s(0.5), c[1] + n[1] * hw * 0.2 + u[1] * s(0.8)];
  ell(ctx, kn[0], kn[1], s(1.0), s(0.85));
  ctx.fillStyle = K.colour(a, GS.kerchiefSh);
  ctx.fill();
}

// ---------- Its moves ----------
// The honk blast: neck drawn back low and puffed up, then thrust out and up, wings flung wide, bill
// wide open: HONK! (a burst and sound arcs off its bill, see fx); a shake of the head to settle.
const HONK = {
  anticT: 0.38,
  keys: [
    [0, { x: -0.04, crouch: 0.45, reach: -0.7, head: 14, pitch: 6, fluff: 0.9, wingN: 0.25, wingF: 0.2, tailUp: 8 }],
    [0.07, { x: 0.06, crouch: 0, reach: 0.85, head: -14, pitch: -6, beak: 1, wingN: 1, wingF: 0.9, spread: 1, fluff: 0.6, tailUp: 24 }, 'out'],
    [0.34, { x: 0.05, reach: 0.7, head: -10, pitch: -4, beak: 0.85, wingN: 0.9, wingF: 0.8, spread: 0.8, fluff: 0.4, tailUp: 18 }, 'io'],
    [0.5, { x: 0.03, reach: 0.3, head: -2, beak: 0.1, wingN: 0.3, wingF: 0.25, spread: 0.3, fluff: 0.3, tailUp: 8 }, 'io'],
    [0.9, {}, 'io'],
  ],
};
// The charge: crouched low, neck stretched out flat, wings flung wide, hissing; a rush forward and a
// hard peck; back, wings folding.
const CHARGE = {
  anticT: 0.42,
  keys: [
    [0, { x: -0.05, crouch: 0.5, reach: 0.25, head: 24, pitch: 10, wingN: 1, wingF: 0.9, spread: 1, beak: 0.45, tailUp: 22, fluff: 0.5 }],
    [0.12, { x: 0.22, hop: 0.05, crouch: 0.2, reach: 0.6, head: 18, pitch: 12, wingN: 1.05, wingF: 0.95, spread: 1, beak: 0.3, tailUp: 20 }, 'io'],
    [0.2, { x: 0.32, hop: 0, crouch: 0.15, reach: 1.15, head: 30, pitch: 16, beak: 0.8, wingN: 0.95, wingF: 0.85, spread: 1, tailUp: 22 }, 'out'],
    [0.28, { x: 0.33, reach: 0.5, head: 14, pitch: 10, beak: 0, wingN: 0.8, wingF: 0.7, spread: 0.8 }, 'in'],
    [0.56, { x: 0.14, reach: 0.1, head: 0, pitch: 2, wingN: 0.3, wingF: 0.25, spread: 0.3, tailUp: 6 }, 'io'],
    [0.92, {}, 'io'],
  ],
  spark: [0.2],
  sparkAt: 'beak',
  dust: [[0.12, 'feet'], [0.22, 'feet']],
};

// ---------- Its act ----------
const CYCLE = 32;
// (where the weed grows, ahead of its feet, in game px at its scale)
const WEED_X = 21;
const look = {
  kind: 'duck',
  noFly: true,
  ink: INK,
  P: {
    scale: 0.92,
    body: [[9.4, -3.4], [7.4, -6.8], [2.0, -8.0], [-4.6, -7.8], [-10.2, -6.6], [-13.8, -5.4], [-13.2, -2.0], [-10.6, 2.8], [-4.4, 5.6], [2.6, 6.0], [8.0, 4.6], [10.6, 0.6]],
    breast: [7.0, 1.4, 5.4],
    neck: { base: [7.2, -5.6], len: 10.2, ang: -84, w: [8.4, 5.6, 6.2] },
    head: { r: 6.2, rx: 6.9 },
    beak: { kind: 'bill', at: [5.4, 1.3], len: 5.8, h: 3.3 },
    tail: { root: [-13.0, -4.6], ang: 205, len: 4.8, w: 3.8, n: 3, spread: 6 },
    moves: ['honk', 'charge', 'wingSlap'],
  },
  C: { ...FEATHERS, guide: '#d8d0c8', beak: '#ff9a3c', beakSh: '#e8762a', leg: '#ff9a3c' },
  moves: { honk: HONK, charge: CHARGE },
  face,
  over: {
    neck: kerchief,
    head: knob,
  },
  // Its act on the base's channels (x, lift, hop, pitch, crouch, sit, sleep, fluff, reach, head,
  // beak, wingN, wingF, flap, tailUp, spread), its face and props (a.gs).
  pose: (m, a, out, K, mv, mt) => {
    const st = a.mo.rig;
    const gs = { face: 'open', blush: 0, flap: 0, honk: [], hiss: 0, feather: null, weed: null, bang: -1, puff: -1, dance: 0, z: 0, lu: -1 };
    a.gs = gs;
    const name = a.bdName;
    const napping = m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? 0);
    const mood = m.cine?.mood ?? a.mood;
    // (its act, only while it stands about: eased in and out on a spring, so starting to walk or
    // fight never snaps a pose; never while it walks, fights, naps or is posed in a scene)
    const goal = clamp((1 - clamp(a.walkW ?? 0, 0, 1)) * (a.moving ? 0 : 1) * (m.pose || m.cine || mv || napping || m.hp <= 0 ? 0 : 1), 0, 1);
    const dt = clamp(a.dt ?? 0, 0, 0.1);
    st.gsCalm = Number.isFinite(st.gsCalm) ? st.gsCalm + (goal - st.gsCalm) * Math.min(1, dt * 8) : goal;
    const calm = mv ? 0 : st.gsCalm;
    // faces outside the act
    if (m.hp <= 0) gs.face = 'dead';
    else if ((a.hurtAgo ?? 9) < 0.45 || name === 'hurt' || name === 'knockdown') gs.face = 'hurt';
    else if (napping || mood === 'sleep') {
      gs.face = 'sleep';
      gs.z = napping ? 1 : 0;
    } else if (name === 'flutter') gs.face = 'smug';
    else if (name === 'honk') {
      gs.face = mt < 0 ? 'angry' : mt < 0.5 ? 'honk' : 'smug';
      if (mt >= 0.05 && mt < 0.75) gs.honk.push({ u: (mt - 0.05) / 0.7, big: 1.15 });
    } else if (name === 'charge') {
      gs.face = 'angry';
      gs.hiss = mt < 0.3 ? 1 : 0;
    } else if (mv || a.face === 'angry' || mood === 'angry') gs.face = 'angry';
    else if (mood === 'happy') gs.face = 'happy';
    else if (mood === 'sad') gs.face = 'sad';
    else if (a.face === 'blink' || ((a.t ?? 0) + (m.uid ?? 0) * 0.37) % 4.3 < 0.12) gs.face = 'blink';
    if (mood === 'talk' && m.hp > 0) out.beak = Math.max(out.beak ?? 0, Math.max(0, Math.sin((a.t ?? 0) * 13)) * 0.45);
    if (calm < 0.02) return;
    const lu = ((((a.t ?? 0) + ((m.uid ?? 0) % 7) * 4.3) % CYCLE) + CYCLE) % CYCLE;
    gs.lu = lu;
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    const say = (f, w) => {
      if (w > 0.4) gs.face = f;
    };
    // 1. on patrol: chest out, a pompous head-bobbing strut on the spot (a rock from foot to foot);
    //    then a freeze and a long suspicious side-eye back; then a narrow squint ahead
    const strut = win(lu, 0.4, 0.9, 2.9, 3.3) * calm;
    const bob = Math.sin(lu * Math.PI * 2.4);
    go({ pitch: -6 + bob * 3, fluff: 0.35, reach: -0.1 + Math.max(0, bob) * 0.25, head: -6 - bob * 6, x: Math.sin(lu * Math.PI * 1.2) * 0.03, tailUp: 8 + bob * 8 }, strut);
    out.lift += strut * Math.abs(bob) * 0.5;
    const freeze = win(lu, 3.1, 3.3, 5.0, 5.4) * calm;
    go({ pitch: -2, reach: -0.25, head: 4, fluff: 0.2 }, freeze);
    say('side', win(lu, 3.2, 3.35, 4.3, 4.4) * calm);
    say('squint', win(lu, 4.35, 4.45, 5.1, 5.3) * calm);
    out.head += win(lu, 4.35, 4.6, 5.0, 5.3) * 6 * calm;
    // 2. the HONK: it spots something, puffs up, draws its neck back; stretches tall, wings wide,
    //    HONK! HONK!; then a smug ruffle, chin up
    const spot = win(lu, 6.0, 6.2, 6.6, 6.8) * calm;
    const wind = win(lu, 6.6, 6.85, 7.1, 7.2) * calm;
    const tall = win(lu, 7.15, 7.25, 8.15, 8.4) * calm;
    const h1 = pulse(lu, 7.2, 0.35);
    const h2 = pulse(lu, 7.65, 0.42);
    go({ head: -6, fluff: 0.8, pitch: -3 }, spot);
    go({ reach: -0.7, head: 16, crouch: 0.35, fluff: 0.9, wingN: 0.25, wingF: 0.2, pitch: 5 }, wind);
    go({ reach: 0.8, head: -30, pitch: -10, fluff: 0.5, wingN: 1, wingF: 0.9, spread: 1, tailUp: 22 }, tall);
    out.beak = Math.max(out.beak ?? 0, Math.max(h1, h2) * calm);
    say('angry', Math.max(spot, wind));
    say('honk', tall);
    for (const [t0, big] of [[7.2, 1], [7.65, 1.2]]) {
      const u = span(lu, t0, 0.75);
      if (u >= 0 && calm > 0.5) gs.honk.push({ u, big });
    }
    const ruffle = win(lu, 8.5, 8.6, 9.0, 9.1) * calm;
    out.fluff += ruffle * Math.abs(Math.sin(lu * 30)) * 0.8;
    out.pitch += ruffle * Math.sin(lu * 34) * 3;
    out.tailUp += ruffle * Math.sin(lu * 30) * 12;
    gs.flap += ruffle * Math.sin(lu * 30);
    const smugC = win(lu, 8.5, 8.7, 9.8, 10.2) * calm;
    go({ head: -14, pitch: -4, reach: -0.15 }, smugC);
    say('smug', smugC);
    // 3. preening: neck curled round to nibble its back; a feather pings loose and floats down; it
    //    watches it go, startled, then sheepish
    const preen = win(lu, 10.6, 11.2, 12.6, 13.0) * calm;
    go({ reach: -0.85, head: 82, pitch: -2, wingN: 0.3, fluff: 0.3 }, preen);
    out.head += preen * Math.sin(lu * 24) * 5;
    out.beak = Math.max(out.beak ?? 0, preen * Math.max(0, Math.sin(lu * 24)) * 0.35);
    say('blink', preen * win(lu, 10.8, 11.0, 12.5, 12.6));
    const watch = win(lu, 12.8, 13.1, 15.0, 15.5) * calm;
    const fall = sstep((lu - 12.7) / 2.3);
    go({ reach: 0.25, head: mix(-20, 40, fall), pitch: mix(-4, 8, fall) }, watch);
    say('startled', win(lu, 12.75, 12.85, 13.4, 13.5) * calm);
    say('sad', win(lu, 13.5, 13.6, 15.2, 15.4) * calm);
    gs.blush = Math.max(gs.blush, win(lu, 13.6, 13.9, 15.0, 15.4) * calm);
    if (lu >= 12.6 && lu < 16.2 && calm > 0.3) gs.feather = { u: (lu - 12.6) / 3.6 };
    // 4. an intruder (imaginary): a start; the hiss, neck out low, wings wide, two lunges at nothing;
    //    back again and a big proud chest-puff
    const start = win(lu, 16.0, 16.1, 16.5, 16.7) * calm;
    go({ reach: -0.3, head: -10, hop: 0.06, fluff: 0.7, pitch: -6 }, start);
    say('startled', start);
    gs.bang = span(lu, 16.0, 0.7);
    const hiss = win(lu, 16.6, 16.9, 18.4, 18.7) * calm;
    const lunge = pulse(lu, 17.2, 0.4) + pulse(lu, 17.8, 0.4);
    go({ crouch: 0.45, reach: 0.3 + lunge * 0.6, head: 24 + lunge * 6, pitch: 10, wingN: 1, wingF: 0.9, spread: 1, beak: 0.4 + lunge * 0.4, tailUp: 22, fluff: 0.5, x: lunge * 0.12 }, hiss);
    say('angry', hiss);
    gs.hiss = Math.max(gs.hiss, hiss);
    const puffUp = win(lu, 18.8, 19.2, 20.6, 21.1) * calm;
    go({ pitch: -12, head: -16, reach: -0.25, fluff: 1, wingN: 0.18, wingF: 0.14, tailUp: 14 }, puffUp);
    say('smug', puffUp);
    gs.puff = span(lu, 19.2, 1.2);
    // 5. a weed: head down to it, three hard tugs, it pops out roots and all; a toss of the head
    //    flings it away over its back; smug
    const down = win(lu, 21.8, 22.3, 24.15, 24.35) * calm;
    const tug = pulse(lu, 22.65, 0.42) + pulse(lu, 23.15, 0.42) + pulse(lu, 23.65, 0.5) * 1.3;
    go({ reach: 0.8, head: 70 - tug * 8, pitch: 20 - tug * 6, crouch: 0.4, x: -tug * 0.05, beak: 0.15, tailUp: 14, wingN: tug * 0.25, wingF: tug * 0.2 }, down);
    say('squint', down * win(lu, 22.2, 22.3, 22.6, 22.65));
    say('strain', down * win(lu, 22.6, 22.65, 24.0, 24.1));
    const toss = win(lu, 24.15, 24.3, 24.6, 25.0) * calm;
    go({ reach: -0.3, head: -50, pitch: -10, beak: 0.6 }, toss);
    say('happy', toss);
    const proud = win(lu, 24.9, 25.2, 26.2, 26.6) * calm;
    go({ head: -10, pitch: -5, fluff: 0.4 }, proud);
    say('smug', proud);
    if (lu >= 21.8 && lu < 26.8 && calm > 0.3) gs.weed = { lu };
    // 6. a waddle-dance: rocking foot to foot, wings out a little, tail wagging, little bounces
    const dance = win(lu, 27.0, 27.4, 30.6, 31.2) * calm;
    const beat = Math.sin(lu * Math.PI * 3);
    go({ pitch: beat * 7, head: -beat * 9 - 6, reach: 0.1, wingN: 0.35 + Math.max(0, beat) * 0.2, wingF: 0.3 + Math.max(0, -beat) * 0.2, tailUp: 10 + beat * 16, x: beat * 0.03, fluff: 0.3 }, dance);
    out.hop += dance * Math.abs(beat) * 0.05;
    say('happy', dance);
    gs.dance = dance;
  },
  // Napping: sat down, fluffed up, its head tucked in on its chest, a slow breath.
  after: (m, a, out) => {
    const napping = m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? 0) && m.hp > 0;
    if (!napping) return;
    const b = Math.sin((a.t ?? 0) * 1.4);
    Object.assign(out, { x: 0, hop: 0, crouch: 0, sit: 1, sleep: 0.35, reach: -0.5, fluff: 0.8 + b * 0.06, pitch: 2, head: 14 + b * 2, beak: 0, wingN: 0, wingF: 0, flap: 0, spread: 0, tailUp: -4 });
  },
  // Its extras: HONK! bursts, the hiss, the loose feather, the weed, the startle, a proud twinkle,
  // the dance's sparkles, a nap's "z".
  fx: (ctx, m, a, K) => {
    const gs = a.gs;
    const bk = a.bk;
    if (!gs || !bk) return;
    const s = K.sc;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // HONK!: a word popping out by the bill (the right way round either way it faces), and three
    // short sound arcs fanning out of it, a sparkle
    for (const { u, big } of gs.honk) {
      const bt = bk.beakTip;
      const e = 1 - (1 - u) ** 3;
      const al = Math.min(1, (1 - u) * 3, u * 12);
      if (al <= 0.02) continue;
      ctx.globalAlpha = al;
      const pop = 1 + 0.3 * Math.sin(Math.min(1, u * 5) * Math.PI);
      glyph(ctx, a, 'HONK!', bk.hp[0] + s(5) + e * s(1.5), bk.hp[1] - s(10) - e * s(2) - (big - 1) * s(12), s(5.2) * big * pop, -0.1);
      const an = Math.atan2(bt[1] - bk.hp[1], bt[0] - bk.hp[0]);
      ctx.strokeStyle = GS.honk;
      ctx.lineWidth = s(0.8);
      for (let i = 0; i < 3; i++) {
        const r0 = s(2.4 + i * 1.6) + e * s(3);
        ctx.beginPath();
        ctx.arc(bt[0], bt[1], r0, an - 0.55, an + 0.55);
        ctx.stroke();
      }
      ctx.fillStyle = '#fff3b0';
      sparkle(ctx, bt[0] + s(3) + e * s(3), bt[1] + s(2.5), s(0.9) * (1 - u));
      ctx.globalAlpha = 1;
    }
    // the hiss: little wavy breath lines off the open bill
    if (gs.hiss > 0.3) {
      const bt = bk.beakTip;
      ctx.globalAlpha = (gs.hiss - 0.3) / 0.7 * 0.8;
      ctx.strokeStyle = GS.breath;
      ctx.lineWidth = s(0.5);
      for (let i = 0; i < 2; i++) {
        const ph = (a.t ?? 0) * 3 + i * 0.5;
        const u = ph % 1;
        ctx.beginPath();
        for (let j = 0; j <= 6; j++) {
          const v = j / 6;
          const x = bt[0] + s(1.5) + u * s(4) + v * s(3);
          const y = bt[1] + (i - 0.5) * s(1.8) + Math.sin(v * TAU + ph * 4) * s(0.4);
          if (j) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // the loose feather: pinged up off its back, then rocking down like a leaf to the grass in front
    if (gs.feather) {
      const u = gs.feather.u;
      const from = add(bk.wings.near.root, [-s(4), -s(3)]);
      const land = [s(9), -s(0.6)];
      let p;
      let an;
      if (u < 0.12) {
        const k = u / 0.12;
        p = [from[0] + k * s(3), from[1] - Math.sin(Math.PI * k * 0.5) * s(5)];
        an = k * 3;
      } else {
        const k = sstep((u - 0.12) / 0.6);
        const top = [from[0] + s(3), from[1] - s(5)];
        p = [mix(top[0], land[0], k) + Math.sin(k * 9) * s(2.4) * (1 - k), mix(top[1], land[1], k)];
        an = 3 + Math.sin(k * 9 + 1) * 0.7 * (1 - k) + k * 0.2;
      }
      ctx.globalAlpha = 1 - sstep((u - 0.85) / 0.15);
      feather(ctx, a, K, p[0], p[1], an);
      ctx.globalAlpha = 1;
    }
    // the weed: growing ahead of its feet; gripped in its bill and stretched by the tugs; popped out
    // roots and all; flung back over its shoulder; gone
    if (gs.weed) weed(ctx, a, K, gs.weed.lu);
    // the startle: a little "!" over its head
    if (gs.bang >= 0) {
      const u = gs.bang;
      ctx.globalAlpha = Math.min(1, (1 - u) * 3);
      const p = add(bk.hp, [-s(1), -s(9) - sstep(u * 3) * s(2)]);
      glyph(ctx, a, '!', p[0], p[1], s(6), 0, '#ff8a5a');
      ctx.globalAlpha = 1;
    }
    // proud: a twinkle off its puffed chest
    if (gs.puff >= 0) {
      const u = gs.puff;
      const p = add(bk.nb, [s(4), s(4)]);
      ctx.globalAlpha = Math.sin(Math.PI * u);
      ctx.fillStyle = '#ffffff';
      sparkle(ctx, p[0], p[1], s(1.2) + Math.sin(Math.PI * u) * s(1.2));
      ctx.fillStyle = '#fff3b0';
      sparkle(ctx, p[0] + s(2.6), p[1] - s(2.4), s(0.8) * Math.sin(Math.PI * u));
      ctx.globalAlpha = 1;
    }
    // the dance: sparkles bobbing up round it on the beat
    if (gs.dance > 0.3) {
      for (let i = 0; i < 3; i++) {
        const u = ((a.t ?? 0) * 0.8 + i / 3) % 1;
        const c = add(bk.pivot, [(i - 1) * s(10), -s(10) - u * s(8)]);
        ctx.globalAlpha = Math.sin(Math.PI * u) * gs.dance;
        ctx.fillStyle = i % 2 ? '#fff3b0' : '#ffd8ec';
        sparkle(ctx, c[0], c[1], s(1.1));
      }
      ctx.globalAlpha = 1;
    }
    // napping: a little blue "z" drifting up off its head
    if (gs.z > 0 && m.hp > 0) {
      const top = add(bk.hp, [s(1), -s(7)]);
      for (let i = 0; i < 2; i++) {
        const u = ((a.t ?? 0) * 0.35 + i * 0.5) % 1;
        const z = s(1.8) + u * s(1.4);
        ctx.globalAlpha = Math.sin(Math.PI * u) * 0.95;
        ctx.save();
        ctx.translate(top[0] + s(2) + u * s(4), top[1] - u * s(7));
        if (a.flip) ctx.scale(-1, 1);
        ctx.beginPath();
        ctx.moveTo(-z * 0.5, -z * 0.5);
        ctx.lineTo(z * 0.5, -z * 0.5);
        ctx.lineTo(-z * 0.5, z * 0.5);
        ctx.lineTo(z * 0.5, z * 0.5);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.strokeStyle = GS.zed;
        ctx.lineWidth = 0.55;
        ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  },
};
// Text the right way round even when it faces left (the rig's space is mirrored then): bold, round,
// a white rim.
function glyph(ctx, a, text, x, y, sz, rotA, col = GS.honk) {
  ctx.save();
  ctx.translate(x, y);
  if (a.flip) ctx.scale(-1, 1);
  ctx.rotate(rotA);
  ctx.font = `900 ${sz.toFixed(2)}px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = sz * 0.3;
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = col;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}
// A small white goose feather: a soft vane round a quill, outlined in its own warm grey.
function feather(ctx, a, K, x, y, an) {
  const s = K.sc;
  const L = s(6);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(an);
  const vane = () => {
    ctx.beginPath();
    ctx.moveTo(-L * 0.5, 0);
    ctx.quadraticCurveTo(-L * 0.2, -L * 0.32, L * 0.32, -L * 0.18);
    ctx.quadraticCurveTo(L * 0.55, -L * 0.08, L * 0.5, 0.02);
    ctx.quadraticCurveTo(L * 0.2, L * 0.28, -L * 0.5, 0);
    ctx.closePath();
  };
  vane();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.fillStyle = K.colour(a, '#ffffff');
  ctx.fill();
  ell(ctx, L * 0.05, L * 0.08, L * 0.35, L * 0.08, -0.05);
  ctx.fillStyle = K.colour(a, '#dcdcf2');
  ctx.fill();
  ctx.strokeStyle = K.colour(a, '#d8cec2');
  ctx.lineWidth = s(0.22);
  ctx.beginPath();
  ctx.moveTo(-L * 0.7, L * 0.02);
  ctx.quadraticCurveTo(0, -L * 0.04, L * 0.45, -L * 0.02);
  ctx.stroke();
  ctx.restore();
}
// The weed, by the act's clock: a little dandelion (a leaf rosette and a yellow flower on a stem);
// gripped by the bill from 22.55, stretching with each tug, out at 23.95 roots and all, flung back over
// its shoulder at 24.2 in a spinning arc, landing behind and fading.
function weed(ctx, a, K, lu) {
  const s = K.sc;
  const bk = a.bk;
  const base = [s(WEED_X), 0];
  const out = lu >= 23.95;
  const held = lu >= 22.55 && lu < 24.25;
  const bt = bk.beakTip;
  let root;
  let top;
  let spin = 0;
  let al = 1;
  if (lu < 24.25) {
    root = out ? [bt[0], bt[1] + s(5.5)] : base;
    top = held ? bt : [base[0], -s(5.2)];
    if (out) spin = 0;
  } else {
    const u = clamp((lu - 24.25) / 0.85, 0, 1);
    const e = sstep(u);
    const from = bt;
    const to = [-s(16), -s(0.5)];
    const c = [mix(from[0], to[0], e), mix(from[1], to[1], e) - Math.sin(Math.PI * e) * s(8)];
    spin = -e * TAU * 1.2;
    root = add(c, rot([0, s(2.8)], spin));
    top = add(c, rot([0, -s(2.8)], spin));
    al = 1 - sstep((lu - 25.8) / 0.8);
  }
  if (al <= 0.01) return;
  ctx.globalAlpha = al;
  // (a little soil mound where it grows, until it's out)
  if (!out) {
    ell(ctx, base[0], 0, s(2.4), s(0.9));
    ctx.fillStyle = K.colour(a, GS.soil);
    ctx.fill();
  }
  // the stem from the root to the flower, stretched taut when tugged
  const strand = (pts, w, col) => {
    ctx.beginPath();
    pts.forEach((q, i) => (i ? ctx.lineTo(...q) : ctx.moveTo(...q)));
    ctx.strokeStyle = GS.weedInk;
    ctx.lineWidth = w + 1.6;
    ctx.stroke();
    ctx.strokeStyle = K.colour(a, col);
    ctx.lineWidth = w;
    ctx.stroke();
  };
  const mid = [mix(root[0], top[0], 0.5) + s(0.6), mix(root[1], top[1], 0.5)];
  strand([root, mid, top], s(0.6), GS.weedSh);
  // roots dangling once it's out
  if (out) {
    ctx.strokeStyle = K.colour(a, GS.root);
    ctx.lineWidth = s(0.4);
    for (const q of [-0.5, 0, 0.5]) {
      const d = rot([0, s(2.2)], spin + q);
      ctx.beginPath();
      ctx.moveTo(...root);
      ctx.quadraticCurveTo(root[0] + d[0] * 0.5 + s(0.4), root[1] + d[1] * 0.5, root[0] + d[0], root[1] + d[1]);
      ctx.stroke();
    }
  }
  // the leaf rosette at its root, two jagged leaves
  for (const dir of [-1, 1]) {
    const d = rot([dir * s(2.6), -s(0.6)], spin);
    const tip = add(root, d);
    ctx.beginPath();
    ctx.moveTo(...root);
    ctx.quadraticCurveTo(root[0] + d[0] * 0.5, root[1] + d[1] * 0.5 - s(1.2), ...tip);
    ctx.quadraticCurveTo(root[0] + d[0] * 0.5, root[1] + d[1] * 0.5 + s(0.3), ...root);
    ctx.strokeStyle = GS.weedInk;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = K.colour(a, GS.weed);
    ctx.fill();
  }
  // the flower: a yellow puff (hidden in the bill while it's held)
  if (!held) {
    ell(ctx, top[0], top[1], s(1.3), s(1.1));
    ctx.strokeStyle = '#d0a030';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.fillStyle = K.colour(a, GS.flower);
    ctx.fill();
    ell(ctx, top[0] - s(0.3), top[1] - s(0.3), s(0.5), s(0.4));
    ctx.fillStyle = '#fff6b0';
    ctx.fill();
  }
  // popping out: a burst of soil crumbs and a sparkle
  const pop = span(lu, 23.95, 0.5);
  if (pop >= 0) {
    const e = 1 - (1 - pop) ** 2;
    ctx.globalAlpha = 1 - pop;
    ctx.fillStyle = K.colour(a, GS.soil);
    for (let i = 0; i < 5; i++) {
      const q = -Math.PI * (0.15 + (i / 4) * 0.7);
      ell(ctx, base[0] + Math.cos(q) * (s(1) + e * s(4)), Math.sin(q) * (s(1) + e * s(4)) + e * e * s(3), s(0.55), s(0.5));
      ctx.fill();
    }
    ctx.fillStyle = '#fff3b0';
    sparkle(ctx, base[0] + s(2), -s(4) - e * s(2), s(1.1));
  }
  ctx.globalAlpha = 1;
}

export const PUMPGOB = dressedBird(look);
PUMPGOB.art.noHop = true;
