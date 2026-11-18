// Rootwood Hollow's monsters, remade from scratch for Chapter 3 (2026-11-18). The great tree has
// been woken in the night and everything in it is sleepy and grumpy about it: root and mushroom
// folk with heavy lids, a bear with a blackberry bramble on its back, puffballs that sneeze. Live
// puppets on the rig (rig.js): every part drawn once and placed each frame, nothing squashed or
// stretched, outer outline only (an outlined pass, then the same parts bare over it), faces bare.
// No legs show on any of them: they waddle on root fringes, glide on mushroom skirts, or step on
// round mitten paws peeking out from under their fur.
//
//   rootling   Root Imp: a plump peach root bulb with a two-leaf sprout, stubby root arms and a
//              fringe of curly rootlets it shuffles on. Waddles; yawns, shakes the soil off like a
//              dog, nods off standing. Swing: leans back and headbutts. Burrow: dives into the
//              floor, only its sprout poking out of a travelling mound, and bursts up under you.
//   sporecap   Myconid Shaman: a little mushroom elder under a huge droopy violet cap whose soft
//              tip flops about, a moss cape, a twig staff topped with a glowing dandelion puff.
//              Glides on its skirt using the staff as a walking stick; dozes off, jolts awake,
//              rattles the staff in a little dance. Spits a puff of spores; Sleepy Spores: holds
//              the staff high and a drowsy cloud gathers on you.
//   thornback  Bramble Bear: a round cocoa bear wearing a blackberry bramble on its back like a
//              blanket. Ambles on mitten paws under its fringe; sniffs about, sits down and picks a
//              berry off its own back to munch, yawns. Swing: rears up and slams both paws down.
//              Bramble Roll: curls into a thorny ball, revs and rolls at you.
//   sporeling  Spore Mite: a round pink puffball with a glowing tuft. Scoots on two hidden nubs;
//              sneezes, does a happy roll. Bonks you; pops into spores when beaten.

import { E, T, F, stroke } from './kit.js';
import { simpleEye, deadEye, tear, vein } from './faces.js';
import { ramp, crescent, shine } from './meadow.js';
import { part, partBare, makeRig, stateBlend, smooth, clamp, lerp, inPart, TAU } from './rig.js';
import { sprite, blit } from '../pixel.js';

const D2R = Math.PI / 180;
// The fractional part, never negative.
const fr = (x) => ((x % 1) + 1) % 1;
const INK = '#2e1c26';

// ---------- Shared bits ----------

// A rotated oval as a polygon.
const ov = (cx, cy, rx, ry, deg, c, n = 18) => {
  const r = deg * D2R;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    pts.push([cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
  }
  return T(pts, c);
};
// Points round an arc, degrees.
const arcP = (cx, cy, rx, ry, a0, a1, n = 10) => {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = (a0 + ((a1 - a0) * i) / n) * D2R;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
};
// A tapered band along a path (widths w0 at the start to w1 at the end), as one polygon.
const taper = (pts, w0, w1, c) => {
  const l = [];
  const r = [];
  pts.forEach(([x, y], i) => {
    const [ax, ay] = pts[Math.max(0, i - 1)];
    const [bx, by] = pts[Math.min(pts.length - 1, i + 1)];
    const d = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / d;
    const ny = (bx - ax) / d;
    const w = (w0 + (w1 - w0) * (i / (pts.length - 1))) / 2;
    l.push([x + nx * w, y + ny * w]);
    r.push([x - nx * w, y - ny * w]);
  });
  return T([...l, ...r.reverse()], c);
};
const pairOf = (pre) => (key, w, h, shapes, pad = 3) => [() => part(`${pre}|${key}`, w, h, shapes, pad), () => partBare(`${pre}|${key}`, w, h, shapes, pad)];
const faceSprite = (key, w, h, shapes) => sprite(`rig|${key}`, () => ({ w, h, res: 2, soft: 'cel', crisp: true, bare: true, pad: 3, shapes: shapes() }));
const hold = (u, a, b, c, d) => (u < a || u > d ? 0 : u < b ? smooth((u - a) / (b - a)) : u < c ? 1 : 1 - smooth((u - c) / (d - c)));
// The walk's phase: one cycle per `stride` px walked, on the speed eased over a moment (so a step
// never jumps when it starts or stops).
const stepPhase = (m, a, key, stride, cap = 160) => {
  const st = (a.mo.rig ??= {});
  const odo = m.odo ?? 0;
  const dt = Math.max(1e-3, a.dt);
  const raw = Math.min(cap, Math.abs(odo - (st[`${key}O`] ?? odo)) / dt);
  st[`${key}O`] = odo;
  st[`${key}V`] = (st[`${key}V`] ?? 0) + (raw - (st[`${key}V`] ?? 0)) * Math.min(1, dt * 4);
  st[`${key}U`] = ((st[`${key}U`] ?? 0) + (st[`${key}V`] / stride) * dt) % 1;
  return st[`${key}U`];
};
// Paws stepping under a fringe: planted (sliding back at the walking speed so it stays put),
// then tucked up and brought forward on an eased arc. [x off its rest, lift].
const pawStep = (u, ph, stride, duty, lift) => {
  const R = (stride * duty) / 2;
  const q = (((u + ph) % 1) + 1) % 1;
  if (q < duty) return [R - (2 * R * q) / duty, 0];
  const s = (q - duty) / (1 - duty);
  return [-R + 2 * R * smooth(s), Math.sin(Math.PI * s) * lift];
};
// The move a dungeon monster is doing (world/dungeon.js `m.move`), if it's this kind.
const moveOf = (m, kind) => (m.move?.kind === kind ? m.move : null);

// For the stills (portraits, the monster book): parts' shapes moved and turned into place.
const shift = (shapes, dx, dy) => shapes.filter(Boolean).map((s) => (s.t === 'p' ? { ...s, x: 0, y: 0, pts: s.pts.map(([x, y]) => [x + (s.x ?? 0) + dx, y + (s.y ?? 0) + dy]) } : { ...s, x: s.x + dx, y: s.y + dy }));
const rot = (shapes, ang, px, py) => {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const R2 = ([x, y]) => [px + (x - px) * c - (y - py) * s, py + (x - px) * s + (y - py) * c];
  return shapes.filter(Boolean).map((sh) => (sh.t === 'p' ? { ...sh, x: 0, y: 0, pts: sh.pts.map(([x, y]) => R2([x + (sh.x ?? 0), y + (sh.y ?? 0)])) } : { ...sh, ...(([x, y]) => ({ x, y }))(R2([sh.x, sh.y])) }));
};
// A part's shapes placed with its pivot at (x, y), turned by deg about it.
const put = (shapes, [pvx, pvy], x, y, deg = 0) => rot(shift(shapes, x - pvx, y - pvy), deg * D2R, x, y);

// A face's mood from the rig: dead, shouting on the strike, cross in a fight, blinking now and then.
const MOODS = new Set(['idle', 'angry', 'hurt', 'happy', 'blink', 'dead', 'shout', 'sleep']);
const moodOf = (a, extra = null) => {
  if (a.face === 'dead') return 'dead';
  if (a.ph.strike > 0.25) return 'shout';
  if (a.ph.atk || a.ph.antic > 0.3) return 'angry';
  if (extra) return extra;
  if (a.face === 'idle' && (a.t + (a.uidOff ?? 0)) % 4.3 < 0.13) return 'blink';
  return MOODS.has(a.face) ? a.face : 'idle';
};
// Two eyes, cheeks, a mouth: the house face, at any size. `lid` is how heavy the lids hang.
const faceShapes = (mood, o) => {
  const { eyes, mouth, blush, iris, lid = 0.3, k = 1 } = o;
  const out = [];
  if (mood === 'dead') for (const [x, y, w] of eyes) out.push(...deadEye(x, y, w * 0.75, { c: INK, th: 0.5 * k }));
  else if (mood === 'sleep') for (const [x, y, w] of eyes) out.push(...stroke(arcP(x, y - 0.4 * k, w, w * 0.45, 20, 160, 6), 0.5 * k, INK));
  else {
    const em = mood === 'shout' ? 'angry' : mood;
    for (const [x, y, w, h, s] of eyes) out.push(...simpleEye(x, y, { s, w, h, mood: em, iris, ink: INK, lid: em === 'idle' ? lid : 0 }));
  }
  if (blush && mood !== 'dead') for (const [x, y, rx] of blush) out.push(F(E(x, y, rx, rx * 0.5, '#ff9fb4')));
  const [mx, my, mw] = mouth;
  if (mood === 'shout') out.push(F(E(mx, my + 0.4 * k, mw * 0.55, mw * 0.5, '#7a3040')), F(E(mx, my + 0.8 * k, mw * 0.32, mw * 0.2, '#ff9ab0')));
  else if (mood === 'happy') out.push(...stroke(arcP(mx, my - 0.3 * k, mw * 0.5, mw * 0.4, 20, 160, 6), 0.42 * k, INK));
  else if (mood === 'sleep') out.push(F(E(mx, my, mw * 0.22, mw * 0.18, '#7a3040')));
  else if (mood === 'angry' || mood === 'hurt') out.push(...stroke(arcP(mx, my + 0.6 * k, mw * 0.45, mw * 0.3, 200, 340, 6), 0.42 * k, INK));
  else out.push(...stroke([[mx - mw * 0.45, my], [mx, my + 0.5 * k], [mx + mw * 0.45, my - 0.1 * k]], 0.4 * k, INK));
  if (mood === 'hurt') out.push(...tear(eyes[0][0] + 0.6 * k, eyes[0][1] + 1.6 * k, 0.7 * k, { type: 'stream', len: 2 }));
  if (mood === 'angry') out.push(...vein(eyes[0][0] - 3.4 * k, eyes[0][1] - 4.6 * k, 0.55 * k));
  return out;
};

// =====================================================================================
// Root Imp (rootling)
// =====================================================================================

const IMP = ramp('#eeac88', { step: 9, turn: 10 });
const IMP_LEAF = ramp('#92d468', { step: 10, turn: 10 });
const DIRT = ramp('#8a5e48', { step: 9, turn: 8 });
const ip = pairOf('ri');

// The bulb: plump and round with turnip shoulders up to where the sprout grows, two soft growth
// rings, a little sheen. Box 18 x 19; its joint (bottom middle) at (9, 18.4).
const impBodyShapes = () => [
  E(9, 11.6, 8, 7, IMP.base),
  T([[3.2, 9.4], [5.6, 5.2], [9, 2.4], [12.4, 5.2], [14.8, 9.4]], IMP.base),
  F(taper(arcP(9.6, 9.6, 7.2, 2.2, 200, 330, 8), 0.7, 0.3, IMP.sh)),
  F(taper(arcP(9.4, 14.6, 6.6, 2, 205, 320, 8), 0.6, 0.25, IMP.sh)),
  crescent(9, 11.6, 8, 7, IMP.sh, { k: 0.2, a0: 30, a1: 160 }),
  shine(9, 11.2, 8, 7, IMP.hi, 0, 0.8),
  F(E(6.4, 6.4, 1.2, 0.7, IMP.hi)),
];
// The sprout: a short stem, two round leaves and a curled tendril. Box 14 x 13; its base at (7, 12.6).
const impSproutShapes = () => [
  taper([[7, 12.6], [7.2, 9.6], [6.8, 7]], 1.6, 1.1, IMP_LEAF.sh),
  ov(3.8, 5.2, 3.6, 2.2, -28, IMP_LEAF.base),
  ov(10.2, 4.4, 3.8, 2.3, 22, IMP_LEAF.base),
  F(taper([[6.6, 7], [5, 5.8], [1.6, 4.4]], 0.5, 0.2, IMP_LEAF.sh)),
  F(taper([[7.2, 6.8], [9, 5], [12.6, 3.4]], 0.5, 0.2, IMP_LEAF.sh)),
  F(E(10.6, 3.4, 1.4, 0.5, IMP_LEAF.hi)),
  taper([[7, 7.2], [7.8, 3.6], [6.6, 1.4], [5.4, 2.4], [6.2, 3.2]], 0.8, 0.5, IMP_LEAF.base),
];
// An arm: a stubby root nub ending in two rootlet fingers. Box 8 x 5; the shoulder at (1.2, 2.5).
const impArmShapes = (far) => () => {
  const c = far ? IMP.sh : IMP.base;
  return [taper([[1.2, 2.5], [4.6, 2.6]], 3, 2.2, c), E(5, 2.6, 1.3, 1.2, c), taper([[5.4, 2], [6.8, 1.2], [7.4, 1.8]], 0.9, 0.5, c), taper([[5.6, 3.1], [7, 3.6], [7.2, 4.4]], 0.9, 0.5, c)];
};
// A rootlet of the little tuft trailing off its bottom like a tail: a short curl. Box 4 x 5; its
// root at (2, 0.6).
const impRootShapes = (k) => () => [taper([[2, 0.6], [2.1, 2.2], [1.5, 3.6], [0.6, 4.1]], 1.4, 0.4, k ? IMP.sh : IMP.base)];
// The mound of dirt it travels under, its sprout poking out. Box 26 x 9; its middle on the ground (13, 8.6).
const impMoundShapes = () => [
  T(arcP(13, 8.6, 12.4, 7.4, 180, 360, 14), DIRT.base),
  crescent(13, 8.6, 12.4, 7.4, DIRT.sh, { k: 0.25, a0: 270, a1: 350 }),
  F(E(8.6, 4.4, 2.2, 0.8, DIRT.hi)),
  F(E(5, 7, 1, 0.7, DIRT.sh)),
  F(E(18.6, 5.4, 1.2, 0.8, DIRT.sh)),
  F(E(14.4, 2.8, 0.8, 0.6, DIRT.sh)),
];
const IMP_BODY = ip('body', 18, 19, impBodyShapes);
const IMP_SPROUT = ip('sprout', 14, 13, impSproutShapes);
const IMP_ARM = [false, true].map((far) => ip(`arm${far ? 1 : 0}`, 8, 5, impArmShapes(far), 2));
const IMP_ROOT = [0, 1].map((k) => ip(`root${k}`, 4, 5, impRootShapes(k), 2));
const IMP_MOUND = () => part('ri|mound', 26, 9, impMoundShapes, 3);
const IMP_FACE = { eyes: [[10.8, 11, 1.7, 2.3, -1], [14.6, 10.6, 1.35, 1.9, 1]], mouth: [13.4, 14.6, 2.2], blush: [[9.2, 13.6, 1.5], [15.8, 13.2, 1]], iris: '#8a4a2e', lid: 0 };
const impFace = (mood) => faceSprite(`ri|face|${mood}`, 18, 19, () => faceShapes(mood, IMP_FACE));

const IMP_LOOP = 12;
const impPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `sprout${tag}`, parent: 'bulb', s: IMP_SPROUT[i], pivot: [7, 12.6], at: () => [0.6, -15.6], rot: (S) => (S.sprout + S.sproutLag) * D2R },
    ...[0, 1, 2].map((k) => ({
      name: `root${k}${tag}`,
      parent: 'bulb',
      s: IMP_ROOT[k % 2][i],
      pivot: [2, 0.6],
      at: () => [-5.4 + k * 1.6, -2.4 + k * 0.4],
      rot: (S, a) => (70 - k * 14 + Math.sin(a.t * 2.4 + k * 1.3) * 6 + S.root * (k % 2 ? 0.6 : -0.6)) * D2R,
    })),
    { name: `armF${tag}`, parent: 'bulb', s: IMP_ARM[1][i], pivot: [1.2, 2.5], at: () => [3.4, -8.6], rot: (S) => (64 + S.armF) * D2R },
    { name: `body${tag}`, parent: 'bulb', s: IMP_BODY[i], pivot: [9, 18.4] },
    { name: `armN${tag}`, parent: 'bulb', s: IMP_ARM[0][i], pivot: [1.2, 2.5], at: () => [0.4, -7.8], rot: (S) => (70 + S.armN) * D2R },
  ];
};

const impBase = makeRig({
  w: 26,
  h: 32,
  soft: true,
  stride: 14,
  recover: 0.6,
  springs: { x: [260, 20], lift: [180, 12], lean: [160, 11], tilt: [170, 12], armN: [140, 10], armF: [140, 10], sprout: [90, 7], root: [120, 9], sink: [140, 17] },
  fast: ['x', 'lean', 'armN', 'armF', 'sink'],
  kick: { lean: -320, sprout: 500 },
  turnKick: { tilt: 140, sprout: 260 },
  pose(m, a) {
    a.uidOff = (m.uid % 11) * 1.13;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'ri', 14);
    const p = u * TAU;
    const lu = t % IMP_LOOP;
    const look = hold(lu, 0.5, 1.1, 2.2, 2.8);
    const yawn = hold(lu, 3.6, 4.2, 5.2, 5.8);
    const shake = hold(lu, 7, 7.2, 8, 8.2);
    const nod = hold(lu, 9.2, 10.2, 11, 11.2);
    const still = 1 - a.walkW;
    a.impYawn = yawn * still;
    a.impNod = nod * still;
    a.impShake = shake * still;
    const br = Math.sin(t * 2);
    const idle = {
      x: 0, lift: br * 0.3 + 0.3, tilt: Math.sin(t * 17) * 13 * shake - look * 5, lean: nod * 16 - yawn * 8,
      armN: br * 4 - yawn * 150 + nod * 20, armF: -br * 4 - yawn * 130, sprout: Math.sin(t * 1.4) * 6 + nod * 28 + shake * Math.sin(t * 17 + 1.2) * 34, root: Math.sin(t * 1.8) * 6 + shake * Math.sin(t * 17) * 14,
    };
    // The waddle: rocking side to side on its round bottom, a springy lift every step, the arms
    // swinging, the rootlets shuffling under it and the sprout swaying a beat behind.
    const walk = { x: 0, lift: Math.abs(Math.sin(p)) * 1.1, tilt: Math.sin(p) * 8, lean: 8, armN: Math.sin(p) * 38 - 8, armF: -Math.sin(p) * 38 + 8, sprout: -Math.sin(p - 0.8) * 10 - 10, root: Math.sin(p) * 20 };
    // The headbutt: back on its heels, arms up behind, then a lunge forward head-first.
    const antic = { x: -2, lift: 0, tilt: 0, lean: -20, armN: -130, armF: -115, sprout: 26, root: -12 };
    const strike = { x: 6, lift: 2.4, tilt: 0, lean: 32, armN: -40, armF: -60, sprout: -34, root: 22 };
    const out = stateBlend(a, idle, walk, antic, strike);
    // Burrowing: down into the floor until only its sprout pokes out of the mound, then up it pops,
    // arms flung high.
    const mv = moveOf(m, 'burrow');
    out.sink = mv && mv.phase !== 'pop' ? 1 : 0;
    if (mv?.phase === 'dig') {
      out.lean = 24;
      out.armN = -150;
      out.armF = -140;
    }
    if (mv?.phase === 'pop') {
      const k = 1 - clamp((a.now - mv.popAt) / 0.7, 0, 1);
      out.armN = lerp(out.armN, -160, k);
      out.armF = lerp(out.armF, -150, k);
      out.lift += 4 * k;
      out.lean = lerp(out.lean, -10, k);
      a.impPop = k;
    } else a.impPop = 0;
    return out;
  },
  follow: (S) => ({ sproutLag: -(S.lean + S.tilt) * 0.7 }),
  parts: [
    { name: 'bulb', parent: null, at: (S) => [S.x, -0.6 - S.lift + S.sink * 15], rot: (S) => (S.lean + S.tilt) * D2R },
    ...impPass(false),
    ...impPass(true),
    { name: 'face', parent: 'bulb', s: (a) => impFace(moodOf(a, a.impPop > 0.3 ? 'happy' : a.impYawn > 0.5 ? 'shout' : a.impNod > 0.5 ? 'sleep' : null)), pivot: [9, 18.4] },
  ],
  fx(ctx, m, a, S) {
    // Soil flicked off as it shakes like a wet dog.
    if (a.impShake > 0.3) {
      ctx.fillStyle = DIRT.base;
      for (let k = 0; k < 5; k++) {
        const u = fr(a.t * 2.4 + k / 5);
        const side = k % 2 ? 1 : -1;
        ctx.globalAlpha = a.alpha * (1 - u) * a.impShake;
        ctx.beginPath();
        ctx.arc(side * (6 + u * 12), -12 - k * 2 + u * u * 10, 1.1, 0, TAU);
        ctx.fill();
      }
    }
    // Soil flying up with it as it pops out of the floor.
    if (a.impPop > 0) {
      const u = 1 - a.impPop;
      ctx.globalAlpha = a.alpha * a.impPop;
      ctx.fillStyle = DIRT.base;
      for (let k = 0; k < 7; k++) {
        const ang = (-160 + k * 23) * D2R;
        const d = 6 + u * 22;
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * d, -3 + Math.sin(ang) * d + u * u * 16, 1.6 - u, 0, TAU);
        ctx.fill();
      }
    }
    // A sleepy z rising off it as it dozes.
    if (a.impNod > 0.6) {
      const u = fr(a.t * 0.6);
      ctx.globalAlpha = a.alpha * (a.impNod - 0.6) * 2.5 * (1 - u);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 6px sans-serif';
      ctx.fillText('z', 6 + u * 4, -26 - u * 8);
    }
  },
});
// The rig drawn clipped at the floor while it's under it, the mound over the hole.
export const rootlingRig = {
  w: impBase.w,
  h: impBase.h,
  draw(ctx, m, a) {
    const st = a.mo.rig;
    const sink = st?.sink?.x ?? 0;
    // (Up in the air, knocked out of its hole: no mound under it.)
    if (sink < 0.02 || m.air > 0) return impBase.draw(ctx, m, a);
    ctx.save();
    ctx.beginPath();
    ctx.rect(-40, -60, 80, 60);
    ctx.clip();
    impBase.draw(ctx, m, a);
    ctx.restore();
    const moving = Math.abs((st?.riV ?? 0)) > 5;
    ctx.save();
    if (a.flip) ctx.scale(-1, 1);
    blit(ctx, IMP_MOUND(), -13 + (moving ? Math.sin(a.t * 22) * 0.6 : 0), -8.6 + (1 - sink) * 9, { alpha: a.alpha * clamp(sink * 1.6, 0, 1), flash: a.flash });
    // Crumbs kicked up behind it as it tunnels.
    if (moving) {
      ctx.fillStyle = DIRT.base;
      for (let k = 0; k < 3; k++) {
        const u = fr(a.t * 2.6 + k / 3);
        ctx.globalAlpha = a.alpha * (1 - u) * 0.9;
        ctx.beginPath();
        ctx.arc(-12 - u * 10, -2 - Math.sin(u * Math.PI) * 7, 1.3, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  },
};
export function rootlingStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const B = [0, -0.6];
  return {
    w: 30,
    h: 34,
    res: 3,
    shapes: shift(
      [
        ...put(impSproutShapes(), [7, 12.6], B[0] + 0.6, B[1] - 15.6, -6),
        ...[0, 1, 2].flatMap((k) => put(impRootShapes(k % 2)(), [2, 0.6], B[0] - 5.4 + k * 1.6, B[1] - 2.4 + k * 0.4, 70 - k * 14)),
        ...put(impArmShapes(true)(), [1.2, 2.5], B[0] + 3.4, B[1] - 8.6, 64),
        ...put(impBodyShapes(), [9, 18.4], B[0], B[1]),
        ...put(faceShapes(fm, IMP_FACE), [9, 18.4], B[0], B[1]),
        ...put(impArmShapes(false)(), [1.2, 2.5], B[0] + 0.4, B[1] - 7.8, 70),
      ],
      15,
      33,
    ),
  };
}

// =====================================================================================
// Myconid Shaman (sporecap)
// =====================================================================================

const CAP = ramp('#a77ce0', { step: 10, turn: 10 });
const GILL = '#f4dcf0';
const STEM = ramp('#f6ead6', { step: 8, turn: 8, lift: 3 });
const MOSS = ramp('#7cbc78', { step: 9, turn: 10 });
const TWIG = ramp('#9a6a50', { step: 9, turn: 8 });
const PUFF = '#c6fbef';
const SP_GLOW = '#7ff0d8';
const sp = pairOf('sc');

// The skirt it glides on: the stem's flared foot, a soft ruffle. Box 16 x 6; its middle on the ground (8, 5.6).
const scSkirtShapes = () => [
  T([[2.2, 0.6], [13.8, 0.6], [15.4, 4.6], [13.2, 5.6], [10.6, 4.8], [8, 5.7], [5.4, 4.8], [2.8, 5.6], [0.6, 4.6]], STEM.base),
  F(taper([[3, 3.6], [8, 4.2], [13, 3.6]], 0.6, 0.6, STEM.sh)),
];
// The stem body: chubby and pale, its face up under the brim, a little wider at the bottom. Box 14 x
// 19; its joint (bottom middle) at (7, 18.4).
const scStemShapes = () => [
  T([[2.6, 1.2], [11.4, 1.2], [12.4, 7], [12.6, 15], [11.6, 18.4], [2.4, 18.4], [1.4, 15], [1.6, 7]], STEM.base),
  crescent(7, 10, 5.8, 9, STEM.sh, { k: 0.22, a0: 100, a1: 230 }),
  F(E(10, 8, 1, 3.4, STEM.hi)),
];
// The moss cape over its shoulders: a scalloped mantle. Box 16 x 9; its collar at (8, 1).
const scCapeShapes = () => {
  const out = [T([[3, 0.6], [13, 0.6], [15, 6.4], [13, 8.2], [10.4, 7], [8, 8.6], [5.6, 7], [3, 8.2], [1, 6.4]], MOSS.base)];
  out.push(crescent(8, 4, 7, 4.4, MOSS.sh, { k: 0.2, a0: 120, a1: 240 }));
  for (const [x, y] of [[4.4, 3.6], [8.4, 4.8], [12, 3.4]]) out.push(F(E(x, y, 1.2, 0.8, MOSS.hi)));
  return out;
};
// The cap: a big droopy dome, wide in the brim, swept back into the floppy tip (its own part), the
// pale gills under the brim, soft glowing freckles. Box 28 x 16; it sits on the stem at (14, 14).
const scCapShapes = () => {
  const out = [];
  out.push(E(14, 13.2, 13, 2.6, GILL));
  for (let k = 0; k < 7; k++) out.push(F(taper([[5 + k * 3, 12.2], [5.4 + k * 3, 14.6]], 0.4, 0.3, '#d9b6d8')));
  out.push(T([[0.8, 12.4], [2.6, 8.4], [5.6, 5.2], [9.4, 3.4], [14, 2.8], [18.8, 3.8], [23, 6.6], [26.2, 10], [27.2, 12.4], [24, 13.2], [14, 13.6], [4, 13.2]], CAP.base));
  out.push(crescent(14, 9, 13, 5.6, CAP.sh, { k: 0.2, a0: 20, a1: 170 }));
  out.push(F(E(17, 5.4, 4.6, 1.2, CAP.hi)));
  for (const [x, y, r] of [[8, 8.4, 1.4], [13.4, 6.2, 1.1], [19.6, 8.8, 1.5], [24, 10.6, 0.9], [4.6, 11, 0.9]]) out.push(F(E(x, y, r, r * 0.8, '#fff1c8')));
  return out;
};
// The floppy tip of the cap. Box 10 x 11; its root (on the cap's crown) at (8.4, 10).
const scTipShapes = () => [
  T([[9.8, 10.4], [6.6, 10.6], [3.6, 8], [1.6, 4.6], [1.2, 1.8], [3, 2.6], [5.8, 5.4], [9, 7.6]], CAP.base),
  F(taper([[8.4, 8.6], [5.4, 7], [2.8, 3.8]], 0.7, 0.3, CAP.sh)),
  E(1.6, 1.6, 1.5, 1.5, '#fff1c8'),
];
// The staff: a twisty twig taller than it is, crowned with a glowing dandelion puff. Box 8 x 40; held
// at (4, 27).
const scStaffShapes = () => [
  taper([[4, 39], [4.6, 32], [3.6, 24], [4.4, 15], [3.8, 6]], 1.8, 1.3, TWIG.base),
  F(taper([[4.4, 37], [4.8, 31]], 0.5, 0.4, TWIG.hi)),
  taper([[4.2, 9], [6.4, 7.6], [7, 6.2]], 0.8, 0.4, TWIG.base),
  E(4, 3.6, 3.4, 3.4, PUFF),
  F(E(3, 2.6, 1.2, 1, '#ffffff')),
  ...[0, 60, 120, 180, 240, 300].map((d) => F(taper([[4, 3.6], [4 + Math.cos(d * D2R) * 2.8, 3.6 + Math.sin(d * D2R) * 2.8]], 0.3, 0.2, '#8fd8c8'))),
];
// An arm: a short sleeve-nub with a round hand. Box 8 x 5; the shoulder at (1.4, 2.5).
const scArmShapes = (far) => () => [taper([[1.4, 2.5], [5, 2.5]], 3, 2.4, far ? MOSS.sh : MOSS.base), E(6, 2.5, 1.6, 1.5, far ? STEM.sh : STEM.base)];
const SC_SKIRT = sp('skirt', 16, 6, scSkirtShapes);
const SC_STEM = sp('stem', 14, 19, scStemShapes);
const SC_CAPE = sp('cape', 16, 9, scCapeShapes);
const SC_CAP = sp('cap', 28, 16, scCapShapes);
const SC_TIP = sp('tip', 10, 11, scTipShapes, 2);
const SC_STAFF = sp('staff', 8, 40, scStaffShapes, 2);
const SC_ARM = [false, true].map((far) => sp(`arm${far ? 1 : 0}`, 8, 5, scArmShapes(far), 2));
const SC_FACE = { eyes: [[8.2, 6.4, 1.6, 2.2, -1], [11.6, 6, 1.3, 1.8, 1]], mouth: [10.2, 9.8, 1.8], blush: [[6.8, 8.8, 1.3], [12.4, 8.4, 0.9]], iris: '#7a50b8', lid: 0 };
const scFace = (mood) => faceSprite(`sc|face|${mood}`, 14, 19, () => faceShapes(mood, SC_FACE));

const SC_LOOP = 13;
const scPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `armF${tag}`, parent: 'trunk', s: SC_ARM[1][i], pivot: [1.4, 2.5], at: () => [2.6, -7.4], rot: (S) => (70 + S.armF) * D2R },
    { name: `skirt${tag}`, parent: null, s: SC_SKIRT[i], pivot: [8, 5.6], at: (S) => [S.x, 0], rot: (S) => S.skirt * D2R },
    { name: `stem${tag}`, parent: 'trunk', s: SC_STEM[i], pivot: [7, 18.4] },
    { name: `cape${tag}`, parent: 'trunk', s: SC_CAPE[i], pivot: [8, 1], at: () => [-0.6, -8.2], rot: (S) => S.cape * D2R },
    { name: `tip${tag}`, parent: 'cap', s: SC_TIP[i], pivot: [8.4, 10], at: () => [-5.6, -10.6], rot: (S) => (S.tip + S.tipLag) * D2R },
    { name: `cap${tag}`, parent: 'capJ', s: SC_CAP[i], pivot: [14, 14] },
    { name: `staff${tag}`, parent: 'hand', s: SC_STAFF[i], pivot: [4, 27], rot: (S) => (S.staff + 4 - (34 + S.armN) - S.lean) * D2R },
    { name: `armN${tag}`, parent: 'trunk', s: SC_ARM[0][i], pivot: [1.4, 2.5], at: () => [2.4, -6.8], rot: (S) => (34 + S.armN) * D2R },
  ];
};

export const sporecapRig = makeRig({
  w: 30,
  h: 46,
  soft: true,
  stride: 16,
  recover: 0.65,
  springs: { x: [220, 18], lift: [160, 12], lean: [140, 11], tilt: [150, 11], armN: [130, 10], armF: [130, 10], staff: [130, 11], cap: [80, 7], skirt: [120, 8], cape: [70, 6], tip: [60, 5] },
  fast: ['x', 'lean', 'armN', 'staff'],
  kick: { lean: -260, cap: 300, tip: 600 },
  turnKick: { cap: 180, tip: 420, skirt: 160 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.91;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'sc', 16);
    const p = u * TAU;
    const lu = t % SC_LOOP;
    const doze = hold(lu, 1, 2.2, 4.2, 4.4);
    const jolt = hold(lu, 4.3, 4.4, 4.7, 5.4);
    const tap = hold(lu, 6.4, 6.7, 7.6, 8);
    const dance = hold(lu, 9.4, 9.8, 11.4, 11.9);
    const still = 1 - a.walkW;
    a.scDoze = doze * still;
    a.scDance = dance * still;
    a.scTap = tap * still;
    const br = Math.sin(t * 1.7);
    const bop = Math.sin(t * 9);
    const idle = {
      x: 0, lift: br * 0.4 + 0.4 + jolt * 2 + dance * Math.abs(bop) * 1.4, lean: doze * 12 - jolt * 8, tilt: dance * bop * 6,
      armN: br * 4 + tap * -20 + dance * (-40 + bop * 30), armF: -br * 4 + dance * -bop * 40, staff: tap * Math.abs(Math.sin(t * 7)) * -8 + dance * bop * 18,
      cap: doze * 10 - jolt * 6 + dance * bop * 5, skirt: dance * -bop * 8, cape: 0, tip: doze * 40 - jolt * 30 + Math.sin(t * 1.3) * 5,
    };
    // The glide: bobbing on its skirt, rocking a little, the staff planted ahead like a walking stick
    // with every other step, the cap and its tip trailing.
    const walk = {
      x: 0, lift: Math.abs(Math.sin(p)) * 1.2, lean: 6, tilt: Math.sin(p) * 4, armN: -10 + Math.sin(p * 0.5) * 22, armF: Math.sin(p) * 20, staff: -6 + Math.sin(p * 0.5) * 14,
      cap: -Math.sin(p) * 3, skirt: Math.sin(p) * 5, cape: -Math.sin(p - 0.6) * 6, tip: -16 - Math.sin(p - 1) * 10,
    };
    // The spit: staff raised overhead, the puff glowing, then thrust out at you.
    const antic = { x: -1, lift: 0.6, lean: -12, tilt: 0, armN: -150, armF: -60, staff: -20, cap: -8, skirt: 0, cape: 8, tip: 30 };
    const strike = { x: 3, lift: 0.4, lean: 14, tilt: 0, armN: -30, armF: 10, staff: 70, cap: 8, skirt: -6, cape: -10, tip: -40 };
    const out = stateBlend(a, idle, walk, antic, strike);
    // Sleepy Spores: the staff held high in both hands, the cloud gathering.
    const mv = moveOf(m, 'cloud');
    a.scCast = mv ? clamp((a.now - mv.at) / 0.4, 0, 1) : 0;
    if (mv) {
      const w = a.scCast;
      const sw = Math.sin(a.now * 5);
      out.armN = lerp(out.armN, -160 + sw * 8, w);
      out.armF = lerp(out.armF, -150 - sw * 8, w);
      out.staff = lerp(out.staff, -10 + sw * 10, w);
      out.lean = lerp(out.lean, -8, w);
      out.lift += w * (1 + Math.abs(sw));
      out.tip = lerp(out.tip, 20 + sw * 20, w);
    }
    return out;
  },
  follow: (S) => ({ tipLag: -(S.lean + S.tilt + S.cap) * 0.9 }),
  parts: [
    { name: 'trunk', parent: null, at: (S) => [S.x, -4 - S.lift], rot: (S) => (S.lean + S.tilt) * D2R },
    { name: 'capJ', parent: 'trunk', at: () => [0.4, -17.4], rot: (S) => (S.cap - (S.lean + S.tilt) * 0.3) * D2R },
    { name: 'hand', parent: 'armN', at: () => [4.6, 0] },
    ...scPass(false),
    ...scPass(true),
    { name: 'face', parent: 'trunk', s: (a) => scFace(moodOf(a, a.scDoze > 0.5 ? 'sleep' : a.scDance > 0.4 ? 'happy' : a.scCast > 0.5 ? 'angry' : null)), pivot: [7, 18.4] },
  ],
  fx(ctx, m, a, S, mat) {
    // The puff on the staff glows, brighter as it gathers a spit or a cloud.
    const pow = Math.max(a.ph.antic, a.scCast, a.scTap * 0.4);
    if (m.hp > 0) inPart(ctx, mat, 'staff', () => {
      const r = 6 + pow * 7 + Math.sin(a.t * 3) * 0.8;
      const g = ctx.createRadialGradient(0, -23.4, 0.5, 0, -23.4, r);
      g.addColorStop(0, `rgba(190,255,240,${(0.5 + pow * 0.4) * a.alpha})`);
      g.addColorStop(1, 'rgba(127,240,216,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-r, -23.4 - r, r * 2, r * 2);
      // Seeds circling it while the cloud gathers; puffing off as it taps.
      const n = a.scCast > 0 ? 6 : a.scTap > 0.3 ? 3 : 0;
      for (let k = 0; k < n; k++) {
        const ang = a.t * 4 + (k / n) * TAU;
        const d = 5 + a.scCast * 4 + fr(a.t * 0.8 + k * 0.3) * 3;
        ctx.globalAlpha = a.alpha * 0.85;
        ctx.fillStyle = k % 2 ? '#ffffff' : SP_GLOW;
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * d, -23.4 + Math.sin(ang) * d * 0.6, 0.9, 0, TAU);
        ctx.fill();
      }
    });
    if (a.scDoze > 0.6) {
      const u = fr(a.t * 0.55);
      ctx.globalAlpha = a.alpha * (a.scDoze - 0.6) * 2.5 * (1 - u);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 6px sans-serif';
      ctx.fillText('z', 8 + u * 4, -36 - u * 8);
    }
  },
});
export function sporecapStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const tr = [0, -4];
  return {
    w: 36,
    h: 50,
    res: 3,
    shapes: shift(
      [
        ...put(scArmShapes(true)(), [1.4, 2.5], tr[0] + 2.6, tr[1] - 7.4, 70),
        ...put(scSkirtShapes(), [8, 5.6], 0, 0),
        ...put(scStemShapes(), [7, 18.4], tr[0], tr[1]),
        ...put(scCapeShapes(), [8, 1], tr[0] - 0.6, tr[1] - 8.2),
        ...put(scTipShapes(), [8.4, 10], tr[0] + 0.4 - 5.6, tr[1] - 17.4 - 10.6, -14),
        ...put(scCapShapes(), [14, 14], tr[0] + 0.4, tr[1] - 17.4),
        ...put(faceShapes(fm, SC_FACE), [7, 18.4], tr[0], tr[1]),
        ...put(scStaffShapes(), [4, 27], tr[0] + 6.2, tr[1] - 4.2, 4),
        ...put(scArmShapes(false)(), [1.4, 2.5], tr[0] + 2.4, tr[1] - 6.8, 34),
      ],
      17,
      48,
    ),
  };
}

// =====================================================================================
// Bramble Bear (thornback)
// =====================================================================================
// (Redrawn standing up on 2026-11-18: on all fours it read as a loaf with buttons under it.) A
// chubby bear cub standing on two round feet, wearing a blackberry bramble as a hood and a cape:
// leaves, berries, two little white flowers, soft rounded thorns.

const BEAR = ramp('#b47c56', { step: 9, turn: 10 });
const MUZ = '#f8e0c4';
const BRAM = ramp('#4f8a52', { step: 9, turn: 10 });
const BRAM2 = ramp('#6aa860', { step: 9, turn: 10 });
const BERRY = ramp('#5a3a8a', { step: 10, turn: 8, lift: 14 });
const bp = pairOf('bb2');

// Bramble bits: a cluster of three blackberries, a little white flower, a leaf.
const berries = (x, y, k = 1) => [[0, 0], [1.4 * k, 0.6 * k], [0.4 * k, 1.4 * k]].flatMap(([dx, dy]) => [E(x + dx, y + dy, 1.1 * k, 1.1 * k, BERRY.base), F(E(x + dx - 0.3 * k, y + dy - 0.3 * k, 0.35 * k, 0.35 * k, BERRY.hi))]);
const bloom = (x, y) => [...[0, 1, 2, 3, 4].map((p) => F(E(x + Math.cos(p * 72 * D2R) * 1.1, y + Math.sin(p * 72 * D2R) * 1.1, 0.9, 0.9, '#ffffff'))), F(E(x, y, 0.55, 0.55, '#ffe36b'))];
const leaf = (x, y, r, d, c) => {
  const cx = Math.cos(d * D2R) * r * 0.9;
  const cy = Math.sin(d * D2R) * r * 0.9;
  return [ov(x, y, r * 1.25, r * 0.8, d, c.base), F(taper([[x - cx, y - cy], [x + cx, y + cy]], 0.35, 0.2, c.sh))];
};
const nub = (x, y, d) => T([[x + Math.cos((d - 90) * D2R) * 1, y + Math.sin((d - 90) * D2R) * 1], [x + Math.cos(d * D2R) * 2, y + Math.sin(d * D2R) * 2], [x + Math.cos((d + 90) * D2R) * 1, y + Math.sin((d + 90) * D2R) * 1]], '#a8d890');

// The body: a round pear of a tummy, a cream belly patch, a few tufts of fur along its bottom (its
// legs are tucked up under it). Box 30 x 24; its joint (bottom middle) at (15, 22.6).
const bbBodyShapes = () => [
  E(15, 13, 11.6, 9.6, BEAR.base),
  E(15, 16.4, 12.6, 6.6, BEAR.base),
  ...[5, 9.4, 13.8, 18.2, 22.6].map((x, i) => E(x, 21.4 + (i % 2) * 0.5, 2.6, 1.6, BEAR.base)),
  F(E(18.6, 15.6, 6.4, 5.8, MUZ)),
  crescent(15, 14, 12.4, 9.6, BEAR.sh, { k: 0.2, a0: 110, a1: 230, jag: 0.3 }),
  shine(15, 12, 11.6, 9.6, BEAR.hi, 0, 0.7),
];
// The head: big and round, a cream muzzle, a dark button nose. Box 30 x 26; the neck at (13, 23.4).
const bbHeadShapes = () => [
  E(15, 12.6, 12.6, 11, BEAR.base),
  E(23.6, 16.6, 5.8, 4.4, MUZ),
  E(28.2, 14.8, 2.2, 1.6, '#3a2420'),
  F(E(27.7, 14.2, 0.7, 0.45, '#ffffff')),
  crescent(15, 12.6, 12.6, 11, BEAR.sh, { k: 0.2, a0: 110, a1: 230 }),
  F(E(12, 5, 4, 1.2, BEAR.hi)),
];
// The bramble hood over the back and top of its head (in the head's own box). A band of tangle
// hugging the head, leaves along its edge, berries, a flower, soft thorns.
const bbHoodShapes = () => {
  const [cx, cy] = [15, 12.6];
  const outer = arcP(cx, cy, 13.8, 12.2, 150, 318, 16);
  const inner = arcP(cx, cy, 10.2, 8.4, 318, 150, 16);
  const out = [T([...outer, ...inner], BRAM.sh)];
  out.push(F(taper(arcP(cx, cy, 12, 10.4, 160, 310, 12), 0.9, 0.6, BRAM.deep)));
  for (const [a, r, k] of [[156, 2.6, 0], [180, 2.8, 1], [204, 3, 0], [228, 2.8, 1], [252, 3, 0], [276, 2.8, 1], [300, 2.6, 0], [316, 2.2, 1]]) {
    out.push(...leaf(cx + Math.cos(a * D2R) * 13.2, cy + Math.sin(a * D2R) * 11.6, r, a + 90, k ? BRAM2 : BRAM));
  }
  out.push(...berries(cx + Math.cos(196 * D2R) * 11.4, cy + Math.sin(196 * D2R) * 9.8), ...berries(cx + Math.cos(262 * D2R) * 11.6, cy + Math.sin(262 * D2R) * 10));
  out.push(...bloom(cx + Math.cos(232 * D2R) * 12, cy + Math.sin(232 * D2R) * 10.4), ...bloom(cx + Math.cos(296 * D2R) * 11.6, cy + Math.sin(296 * D2R) * 10.2));
  for (const a of [170, 216, 284, 320]) out.push(nub(cx + Math.cos(a * D2R) * 14.4, cy + Math.sin(a * D2R) * 12.8, a));
  return out;
};
// The bramble cape down its back. Box 22 x 22; hung at its collar (17, 2).
const bbCapeShapes = () => {
  const out = [T([[12, 0.6], [21, 0.6], [20, 6], [15, 12], [9, 17.6], [3, 21], [0.8, 15], [3, 8], [7, 3]], BRAM.sh)];
  out.push(F(taper([[18, 2], [12, 8], [5, 16]], 1, 0.6, BRAM.deep)));
  for (const [x, y, r, d, k] of [[3, 9, 2.6, 120, 0], [1.6, 15, 2.6, 100, 1], [4.4, 20, 2.4, 140, 0], [10, 17, 2.4, 60, 1], [15.6, 11.6, 2.4, 40, 0], [19.6, 5, 2.2, 20, 1], [8, 5, 2.4, 160, 1]]) out.push(...leaf(x, y, r, d, k ? BRAM2 : BRAM));
  out.push(...bloom(11.6, 6.4));
  for (const [x, y, d] of [[1, 12, 180], [7.6, 19.6, 120], [17.6, 9.6, 30]]) out.push(nub(x, y, d));
  return out;
};
// An arm: chubby, a round mitten paw. Box 16 x 9; the shoulder at (3, 4.5).
const bbArmShapes = (far) => () => [
  taper([[3, 4.5], [10, 4.6]], 6.2, 5.2, far ? BEAR.sh : BEAR.base),
  E(11.6, 4.8, 3.6, 3.3, far ? BEAR.sh : BEAR.base),
  ...(far ? [] : [F(E(12.8, 5.6, 1.8, 1.2, MUZ))]),
];
// A foot: a round mitten foot with a cream pad. Box 11 x 6; its middle at (5.5, 3).
const bbFootShapes = (far) => () => [
  E(6, 3.2, 5, 2.8, far ? BEAR.sh : BEAR.base),
  ...(far ? [] : [F(E(7.4, 4.2, 2.8, 1.1, MUZ)), ...stroke([[8.6, 1.6], [8.8, 3]], 0.35, BEAR.sh), ...stroke([[10, 2], [10.2, 3.2]], 0.35, BEAR.sh)]),
];
const bbEarShapes = (far) => () => [E(4.5, 4.6, 3.8, 3.6, far ? BEAR.sh : BEAR.base), F(E(4.6, 5, 2.2, 2, far ? BEAR.deep : '#e8a8a0'))];
const bbTailShapes = () => [E(3, 3, 2.8, 2.6, BEAR.base), F(E(2.4, 2.4, 1, 0.8, BEAR.hi))];
const bbBerryShapes = () => berries(1.4, 1.4);
// Curled up: a round ball of fur, the bramble wrapped round it. Box 30 x 30; its middle at (15, 15).
const bbBallShapes = () => {
  const out = [E(15, 15, 13.6, 13.6, BEAR.base), crescent(15, 15, 13.6, 13.6, BEAR.sh, { k: 0.2, a0: 20, a1: 200, jag: 0.4 })];
  for (const a0 of [0, 120, 240]) out.push(F(taper(arcP(15, 15, 10.6, 10.6, a0, a0 + 100, 8), 1.3, 0.8, BRAM.deep)));
  for (const a0 of [20, 70, 140, 190, 260, 310]) out.push(...leaf(15 + Math.cos(a0 * D2R) * 11, 15 + Math.sin(a0 * D2R) * 11, 2.4, a0 + 90, a0 % 40 ? BRAM : BRAM2));
  for (const a0 of [45, 165, 285]) out.push(...berries(15 + Math.cos(a0 * D2R) * 7.4, 15 + Math.sin(a0 * D2R) * 7.4));
  for (const a0 of [100, 220, 340]) out.push(nub(15 + Math.cos(a0 * D2R) * 13.6, 15 + Math.sin(a0 * D2R) * 13.6, a0));
  out.push(F(E(10, 9, 3.4, 1.4, BEAR.hi)));
  return out;
};
const BB_BODY = bp('body', 30, 24, bbBodyShapes);
const BB_HEAD = bp('head', 30, 26, bbHeadShapes);
const BB_HOOD = bp('hood', 30, 26, bbHoodShapes, 4);
const BB_CAPE = bp('cape', 22, 22, bbCapeShapes);
const BB_ARM = [false, true].map((far) => bp(`arm${far ? 1 : 0}`, 16, 9, bbArmShapes(far), 2));
const BB_FOOT = [false, true].map((far) => bp(`foot${far ? 1 : 0}`, 11, 6, bbFootShapes(far), 2));
const BB_EAR = [false, true].map((far) => bp(`ear${far ? 1 : 0}`, 9, 9, bbEarShapes(far), 2));
const BB_TAIL = bp('tail', 6, 6, bbTailShapes, 2);
const BB_BERRY = bp('berry', 4, 4, bbBerryShapes, 2);
const BB_BALL = bp('ball', 30, 30, bbBallShapes, 3);
const BB_FACE = { eyes: [[17.4, 10.4, 2, 2.6, -1], [23, 9.8, 1.6, 2.2, 1]], mouth: [25.4, 20, 2.2], blush: [[13.6, 15.4, 1.9]], iris: '#6a4228', lid: 0 };
const bbFace = (mood) => faceSprite(`bb2|face|${mood}`, 30, 26, () => faceShapes(mood, BB_FACE));

const BB_STRIDE = 14;
const BB_FEET = { N: [-2.6, 0], F: [3.6, 0.5] };
const bbHip = (S) => [S.x, -5 - S.lift];
const bbFoot = (S, a, key) => {
  const [rx, ph] = BB_FEET[key];
  const [dx, lift] = pawStep(a.bbU ?? 0, ph, BB_STRIDE, 0.56, 2.6);
  return [S.x + rx + dx * a.walkW, -3 - lift * a.walkW];
};
const unrolled = (a, S) => 1 - clamp(S.ball * 1.4, 0, 1);
const BB_LOOP = 15;
const bbPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `tail${tag}`, parent: 'hip', s: BB_TAIL[i], pivot: [3.6, 3], at: () => [-11, -7], rot: (S) => S.tailWag * D2R, alpha: unrolled },
    { name: `cape${tag}`, parent: 'hip', s: BB_CAPE[i], pivot: [17, 2], at: () => [-1, -19], rot: (S) => clamp(S.cape, -12, 2) * D2R, alpha: unrolled },
    { name: `picked${tag}`, parent: `cape${tag}`, s: BB_BERRY[i], pivot: [2, 2], at: () => [-12, 10], alpha: (a, S) => unrolled(a, S) * (1 - (a.bbPicked ?? 0)) },
    { name: `armF${tag}`, parent: 'hip', s: BB_ARM[1][i], pivot: [3, 4.5], at: () => [-2, -16.4], rot: (S) => (46 + S.armF) * D2R, alpha: unrolled },
    { name: `footF${tag}`, parent: null, s: BB_FOOT[1][i], pivot: [5.5, 3], at: (S, a) => bbFoot(S, a, 'F'), alpha: unrolled },
    { name: `footN${tag}`, parent: null, s: BB_FOOT[0][i], pivot: [5.5, 3], at: (S, a) => bbFoot(S, a, 'N'), alpha: unrolled },
    { name: `body${tag}`, parent: 'hip', s: BB_BODY[i], pivot: [15, 22.6], alpha: unrolled },
    { name: `earF${tag}`, parent: 'neck', s: BB_EAR[1][i], pivot: [4.5, 7.6], at: () => [-5.4, -19.6], rot: (S) => (-24 + S.ear) * D2R, alpha: unrolled },
    { name: `head${tag}`, parent: 'neck', s: BB_HEAD[i], pivot: [13, 23.4], alpha: unrolled },
    { name: `hood${tag}`, parent: 'neck', s: BB_HOOD[i], pivot: [13, 23.4], alpha: unrolled },
    { name: `earN${tag}`, parent: 'neck', s: BB_EAR[0][i], pivot: [4.5, 7.6], at: () => [3.6, -21], rot: (S) => (8 + S.ear) * D2R, alpha: unrolled },
    { name: `armN${tag}`, parent: 'hip', s: BB_ARM[0][i], pivot: [3, 4.5], at: () => [5, -15.6], rot: (S) => (40 + S.armN) * D2R, alpha: unrolled },
    { name: `held${tag}`, parent: `armN${tag}`, s: BB_BERRY[i], pivot: [2, 2.6], at: () => [9.4, -1.4], alpha: (a, S) => unrolled(a, S) * (a.bbHeld ?? 0) },
    { name: `ball${tag}`, parent: null, s: BB_BALL[i], pivot: [15, 15], at: (S) => [S.x, -14.2 - S.hopB], rot: (S, a) => a.bbRoll, alpha: (a, S) => clamp(S.ball * 1.4 - 0.4, 0, 1) },
  ];
};

export const thornbackRig = makeRig({
  w: 40,
  h: 52,
  soft: true,
  stride: BB_STRIDE,
  recover: 0.7,
  springs: { x: [200, 18], lift: [170, 12], lean: [130, 11], tilt: [150, 11], head: [120, 10], armN: [140, 10], armF: [140, 10], ear: [140, 7], cape: [140, 12], tailWag: [120, 6], ball: [160, 18], hopB: [200, 14] },
  fast: ['x', 'lean', 'armN', 'armF', 'head', 'ball'],
  kick: { lean: -200, head: -220, ear: 500, cape: -90 },
  turnKick: { tilt: 120, ear: 300, cape: -80 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 1.07;
    const t = a.t + a.uidOff;
    a.bbU = stepPhase(m, a, 'bb', BB_STRIDE);
    const p = a.bbU * TAU;
    const lu = t % BB_LOOP;
    const sniff = hold(lu, 0.6, 1.2, 2.8, 3.3);
    const pick = hold(lu, 5, 5.6, 6.2, 6.8);
    const munch = hold(lu, 6.5, 7.1, 9.6, 10.2);
    const yawn = hold(lu, 11.6, 12.2, 13.2, 13.8);
    const still = 1 - a.walkW;
    a.bbMunch = munch * still;
    a.bbYawn = yawn * still;
    // (The berry it picks off its cape: gone from the cape, in its paw to its mouth, eaten; a new one
    // has grown back by the next time round.)
    a.bbPicked = still * clamp((lu - 6.1) * 5, 0, 1) * (lu < 14.4 ? 1 : 0);
    a.bbHeld = still * clamp((lu - 6.1) * 5, 0, 1) * clamp((9.2 - lu) * 4, 0, 1);
    const br = Math.sin(t * 1.6);
    const chew = Math.sin(t * 14);
    const idle = {
      x: 0, lift: br * 0.3 + 0.3, lean: sniff * 8 - yawn * 6 + munch * 3, tilt: 0,
      head: sniff * (12 + Math.sin(t * 11) * 3) - yawn * 16 + munch * (6 + chew * 2), armN: br * 3 + pick * 122 - munch * 86 - yawn * 128, armF: -br * 3 - yawn * 120 - munch * 10,
      ear: br * 4 + sniff * Math.sin(t * 9) * 6, cape: br * 2, tailWag: Math.sin(t * 2.2) * 8, ball: 0, hopB: 0,
    };
    // The waddle: a toddler's walk, rocking from foot to foot, arms swinging, the cape and the ears a
    // beat behind.
    const walk = { x: 0, lift: Math.abs(Math.sin(p)) * 1.3, lean: 4, tilt: Math.sin(p) * 5, head: 2 - Math.sin(p * 2) * 2, armN: Math.sin(p) * 28, armF: -Math.sin(p) * 28, ear: -Math.sin(p) * 8, cape: -Math.sin(p - 0.6) * 7 - 4, tailWag: Math.sin(p) * 12, ball: 0, hopB: 0 };
    // The slam: both paws high over its head, then down with all its weight.
    const antic = { x: -2, lift: 0.6, lean: -10, tilt: 0, head: -8, armN: -130, armF: -130, ear: -14, cape: 8, tailWag: 0, ball: 0, hopB: 0 };
    const strike = { x: 5, lift: 0, lean: 22, tilt: 0, head: 10, armN: -20, armF: -26, ear: 20, cape: -14, tailWag: 0, ball: 0, hopB: 0 };
    const out = stateBlend(a, idle, walk, antic, strike);
    // The Bramble Roll: curled up, revving in place, then rolling (the ball turns with the distance it
    // covers, so it truly rolls).
    const mv = moveOf(m, 'roll');
    const st = a.mo.rig;
    st.bbA ??= 0;
    if (mv) {
      out.ball = 1;
      out.hopB = mv.phase === 'rev' ? Math.abs(Math.sin(a.now * 18)) * 1.2 : 0;
      const dist = (m.x - (st.bbX ?? m.x)) * (a.flip ? -1 : 1);
      st.bbA += mv.phase === 'rev' ? a.dt * 16 : dist / 14;
    } else st.bbA *= Math.max(0, 1 - a.dt * 3);
    st.bbX = m.x;
    a.bbRoll = st.bbA;
    a.bbRev = mv?.phase === 'rev' ? 1 : mv ? 2 : 0;
    return out;
  },
  parts: [
    { name: 'hip', parent: null, at: (S) => bbHip(S), rot: (S) => (S.lean + S.tilt) * D2R },
    { name: 'neck', parent: 'hip', at: () => [2, -18], rot: (S) => (S.head - (S.lean + S.tilt) * 0.4) * D2R },
    ...bbPass(false),
    ...bbPass(true),
    { name: 'face', parent: 'neck', s: (a) => bbFace(moodOf(a, a.bbYawn > 0.5 ? 'shout' : a.bbMunch > 0.5 ? 'happy' : null)), pivot: [13, 23.4], alpha: unrolled },
  ],
  fx(ctx, m, a) {
    const dust = (x, y, r, al) => {
      ctx.globalAlpha = a.alpha * al;
      ctx.fillStyle = '#e8dccc';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    };
    // Dust spun up as it revs, and kicked behind as it rolls.
    if (a.bbRev) for (let k = 0; k < 4; k++) {
      const u = fr(a.t * (a.bbRev === 1 ? 3 : 2.2) + k / 4);
      dust(-10 - u * 18 - k * 2, -2 - u * 6, 1.6 + u * 3.4, (1 - u) * 0.65);
    }
    // A puff where its paws come down.
    if (a.ph.since >= 0 && a.ph.since < 0.4) {
      const u = a.ph.since / 0.4;
      for (const dx of [-6, 0, 6]) dust(16 + dx * (1 + u), -2 - u * 4, 2 + u * 4, (1 - u) * 0.7);
    }
  },
});
export function thornbackStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const [hx, hy] = [0, -5];
  const nk = [hx + 2, hy - 18];
  return {
    w: 44,
    h: 56,
    res: 3,
    shapes: shift(
      [
        ...put(bbTailShapes(), [3.6, 3], hx - 11, hy - 7),
        ...put(bbCapeShapes(), [17, 2], hx - 1, hy - 19),
        ...put(bbArmShapes(true)(), [3, 4.5], hx - 2, hy - 16.4, 46),
        ...put(bbFootShapes(true)(), [5.5, 3], 3.6, -3),
        ...put(bbFootShapes(false)(), [5.5, 3], -2.6, -3),
        ...put(bbBodyShapes(), [15, 22.6], hx, hy),
        ...put(bbEarShapes(true)(), [4.5, 7.6], nk[0] - 5.4, nk[1] - 19.6, -24),
        ...put(bbHeadShapes(), [13, 23.4], nk[0], nk[1]),
        ...put(bbHoodShapes(), [13, 23.4], nk[0], nk[1]),
        ...put(faceShapes(fm, BB_FACE), [13, 23.4], nk[0], nk[1]),
        ...put(bbEarShapes(false)(), [4.5, 7.6], nk[0] + 3.6, nk[1] - 21, 8),
        ...put(bbArmShapes(false)(), [3, 4.5], hx + 5, hy - 15.6, 40),
      ],
      20,
      54,
    ),
  };
}

// =====================================================================================
// Spore Mite (sporeling)
// =====================================================================================

const PUFFB = ramp('#fbd6e6', { step: 8, turn: 8, lift: 4 });
const mp = pairOf('sm');
// The puffball: round and soft, a few paler soft patches, a sheen. Box 16 x 14; its joint (bottom
// middle) at (8, 13.4).
const smBodyShapes = () => [
  E(8, 7.6, 7.4, 6, PUFFB.base),
  F(E(4.6, 6.4, 1.8, 1.2, '#fff0f6')),
  F(E(10.6, 4.4, 1.4, 0.9, '#fff0f6')),
  F(E(6.6, 10.6, 1.4, 0.8, '#fff0f6')),
  crescent(8, 7.6, 7.4, 6, PUFFB.sh, { k: 0.2, a0: 30, a1: 170 }),
  shine(8, 7.4, 7.4, 6, '#ffffff', 0, 0.8),
];
// The tuft on top: three soft spore wisps with glowing tips. Box 8 x 7; its root at (4, 6.6).
const smTuftShapes = () => [
  ...[[-28, 4.6], [0, 5.6], [26, 4.4]].flatMap(([d, l]) => {
    const ex = 4 + Math.sin(d * D2R) * l;
    const ey = 6.6 - Math.cos(d * D2R) * l;
    return [F(taper([[4, 6.6], [(4 + ex) / 2 + d * 0.02, (6.6 + ey) / 2], [ex, ey]], 0.8, 0.4, PUFFB.sh)), E(ex, ey, 1.1, 1.1, PUFF)];
  }),
];
const smFootShapes = (far) => () => [E(2.4, 1.4, 2.2, 1.3, far ? PUFFB.sh : PUFFB.base)];
const SM_BODY = mp('body', 16, 14, smBodyShapes);
const SM_TUFT = mp('tuft', 8, 7, smTuftShapes, 2);
const SM_FOOT = [false, true].map((far) => mp(`foot${far ? 1 : 0}`, 5, 3, smFootShapes(far), 2));
const SM_FACE = { eyes: [[8.8, 7.4, 1.5, 2.1, -1], [12.2, 7, 1.2, 1.7, 1]], mouth: [11, 10.6, 1.8], blush: [[7.4, 9.6, 1.3], [13.2, 9.2, 0.9]], iris: '#c0507a', lid: 0 };
const smFace = (mood) => faceSprite(`sm|face|${mood}`, 16, 14, () => faceShapes(mood, SM_FACE));
const SM_LOOP = 9;
const smPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `footF${tag}`, parent: null, s: SM_FOOT[1][i], pivot: [2.4, 1.4], at: (S) => [S.x + 2.4 + S.footF, -1.2] },
    { name: `tuft${tag}`, parent: 'ball', s: SM_TUFT[i], pivot: [4, 6.6], at: () => [-0.4, -11.8], rot: (S) => (S.tuft + S.tuftLag) * D2R },
    { name: `body${tag}`, parent: 'ball', s: SM_BODY[i], pivot: [8, 13.4] },
    { name: `footN${tag}`, parent: null, s: SM_FOOT[0][i], pivot: [2.4, 1.4], at: (S) => [S.x - 2.2 + S.footN, -0.9] },
  ];
};
export const sporelingRig = makeRig({
  w: 24,
  h: 24,
  soft: true,
  stride: 12,
  recover: 0.55,
  springs: { x: [260, 20], lift: [200, 13], rock: [170, 11], tuft: [70, 6], footN: [400, 30], footF: [400, 30] },
  fast: ['x', 'rock'],
  kick: { rock: -420, tuft: 600 },
  turnKick: { rock: 160, tuft: 400 },
  pose(m, a) {
    a.uidOff = (m.uid % 7) * 1.31;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'sm', 12);
    const p = u * TAU;
    const lu = t % SM_LOOP;
    const sneeze = hold(lu, 2, 2.6, 2.7, 3.2);
    const roll = lu > 5.6 && lu < 6.6 ? smooth((lu - 5.6) / 1) : 0;
    const still = 1 - a.walkW;
    a.smSneeze = sneeze * still;
    a.smRoll = roll > 0 && roll < 1 ? still : 0;
    const br = Math.sin(t * 2.4);
    const idle = { x: 0, lift: br * 0.3 + 0.3 + Math.sin(roll * Math.PI) * 3, rock: -sneeze * 14 + (lu > 2.6 && lu < 3.1 ? 20 : 0) + roll * 360, tuft: br * 8 + sneeze * 30, footN: 0, footF: 0 };
    // The scoot: quick little rocks forward and back on two hidden nubs.
    const walk = { x: 0, lift: Math.abs(Math.sin(p)) * 1.4, rock: Math.sin(p) * 10 + 4, tuft: -Math.sin(p - 0.8) * 16 - 10, footN: Math.sin(p) * 2, footF: -Math.sin(p) * 2 };
    const antic = { x: -1.5, lift: 0, rock: -18, tuft: 30, footN: 0, footF: 0 };
    const strike = { x: 6, lift: 2.4, rock: 50, tuft: -30, footN: 2, footF: 2 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  follow: (S) => ({ tuftLag: -S.rock * 0.6 }),
  parts: [
    { name: 'ball', parent: null, at: (S) => [S.x, -1.6 - S.lift], rot: (S) => S.rock * D2R },
    ...smPass(false),
    ...smPass(true),
    { name: 'face', parent: 'ball', s: (a) => smFace(moodOf(a, a.smSneeze > 0.5 ? 'sleep' : a.smRoll ? 'happy' : null)), pivot: [8, 13.4] },
  ],
  fx(ctx, m, a) {
    // The sneeze, and the pop when it's beaten: a burst of spores.
    const burst = (cx, cy, u, n, r) => {
      if (!(u >= 0 && u < 1)) return;
      for (let k = 0; k < n; k++) {
        const ang = (k / n) * TAU + 0.3;
        ctx.globalAlpha = a.alpha * (1 - u) * 0.9;
        ctx.fillStyle = k % 2 ? '#ffffff' : SP_GLOW;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(ang) * r * u, cy + Math.sin(ang) * r * u * 0.7, 1.2 * (1 - u) + 0.4, 0, TAU);
        ctx.fill();
      }
    };
    if (a.smSneeze > 0.4) burst(10, -8, ((a.t + a.uidOff) % SM_LOOP - 2.5) / 0.8, 6, 10);
    if (m.hp <= 0) {
      const st = a.mo.rig;
      st.smPop ??= a.now;
      const u = clamp((a.now - st.smPop) / 0.6, 0, 1);
      if (u < 1) burst(0, -8, u, 10, 18);
    }
  },
});
export function sporelingStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  return {
    w: 24,
    h: 24,
    res: 3,
    shapes: shift(
      [
        ...put(smFootShapes(true)(), [2.4, 1.4], 2.4, -1.2),
        ...put(smTuftShapes(), [4, 6.6], -0.4, -1.6 - 11.8),
        ...put(smBodyShapes(), [8, 13.4], 0, -1.6),
        ...put(faceShapes(fm, SM_FACE), [8, 13.4], 0, -1.6),
        ...put(smFootShapes(false)(), [2.4, 1.4], -2.2, -0.9),
      ],
      12,
      22,
    ),
  };
}
