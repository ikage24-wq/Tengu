// Ramen Ryu's rig (2026-11-25, the Cup-Noodle Dragon remade on the serpent base; his own copy: the
// base stays clean, and his motion can be tuned later without touching it). A copy of the blank bases'
// rig (render/mobs/blankrigs.js) for the serpent only, unchanged in everything that moves: its
// skeleton (the hips, the waist and chest bending, the collarbones, the arms, the neck and head; the
// tail's four pieces on their three joints), its sway and slither, its moves, its springs. What
// differs: his skin is drawn in his skin tones; the mannequin's sprites are his pieces (ryu/art.js:
// the cup round his waist, his tee and red scarf, the foil lid, his noodle hair, bun and locks, his
// face in each expression); his tail is one rope of wavy noodles drawn live along the tail's bones,
// its strands rippling, loose curls at its tip; his noodle whiskers are drawn live from his cheeks,
// swaying; the chopsticks, when they're out of his bun, are drawn live in his hands; each of his
// casts (m.castPose) is a pose he holds for as long as it lasts.
//
//   ryuRig({ design, skin, fx, under, J: { ...his joints in base units } }) -> { rig, still, stride, speed, w, h, H }
//
// The blank rigs' own notes follow.
// (base) The blank bases, rigged and game-ready (2026-11-22, the player: "rig them to perfection", then
// "heavily animate all of them to be game ready so they can be easily used ... attacks for common
// weapons, common attacks and punches and other martial arts, guns etc"): each blank base
// (blankbase.js, blankbases.js) as a live rig on the kid rig (kidrig.js), at its true size, with the
// whole move set (blankmoves.js), plain weapons (blankprops.js) and legs that walk and run
// (blankgait.js). They're not monsters in the game: dev pages and new builds use them (BLANK_ARTS).
// The player base is a reference for the player character's build only, never a monster's body.
//
// Using one in the game (a monster def on a base):
//   weapon  def.weapon (or m.weapon): sword, dagger, spear, axe, hammer, staff, bow, pistol, rifle,
//           ball; held at rest, carried on the walk and the run, and its moves used to attack
//   moves   def.moves: its own list of attacks (default: the weapon's, or fists and feet, or
//           def.caster's magic); each attack takes the next in turn, so a fight never repeats one
//           swing; m.move forces one
//   the rest is the game's own: the wind-up (m.windup, def.fight.windup) is the move's wind-up,
//   m.attackAt its release; a hit (m.flash) plays a flinch on top of the rig's kick; beaten
//   (hp <= 0) it slumps as it falls; gloating (m.gloatAt) it cheers; m.guard holds a block; m.act
//   = { name, at } plays any move or action on the clock (cutscenes, sheets): jump, dash, dodge,
//   block, hurt, knockdown, cheer as well as every attack.
//
// How each moves at rest:
//   idle    breathing; a slow shift of weight from foot to foot; the arms easing with the breath;
//           every 9 s a glance back over the shoulder and back again.
//   walk    the kid walk (the hero's approved walk on its legs): heel down, roll, toe off, the hips
//           sinking just as far as the planted feet need; the arms swinging opposite the legs.
//   run     past a brisk walk: a longer stride with both feet off the ground between steps, a lean,
//           elbows bent and pumping.
//   poses   (m.pose, for sheets) tpose, wave, crouch; fly (winged): up off the ground, flapping.
//   creature  its tail and round ears swing on their own.
//   spirit  no legs: it hovers, bobbing; it glides leaning forward with its arms out in front,
//           hands drooping, its wisp trailing; a wisp lash for a kick.
//   serpent no legs: it slithers, waves running back down its tail, its upper body swaying like a
//           dancer's; a tail whip for a kick.
//   winged  its wings breathe at rest, lift with the walk, spread on a wind-up and sweep on a blow,
//           swinging on their own; a wing buffet.

import { makeRig, clamp, TAU } from '../mobs/rig.js';
import { kidKit, SOFT, hold, D2R } from '../mobs/kidrig.js';
import { CX, G, mapShape } from '../mobs/kidbase.js';
import { blit, sprite, CHAR_LINE } from '../pixel.js';
import { blankBase, blankSkinSpec } from '../mobs/blankbase.js';
import { blankBody, BODIES, skinSpec } from '../mobs/blankbases.js';
import { makeSkin } from '../mobs/blankskin.js';
import { blankGait } from '../mobs/blankgait.js';
import { weaponOf, weaponSprite, inSprite } from '../mobs/blankprops.js';
import { MOVES as BASE_MOVES, HOLDS, POOLS, LEGLESS, poseAt, lengthOf, inWindow, since } from '../mobs/blankmoves.js';
import { legDefs, legPhase, stepAt, lowAngle, sinks, placeLeg } from '../mobs/blankquad.js';


// A base drawn standing (arms hanging), fitted into the kid box (160 x 150, feet on G) at `1 / f` of
// its size; the kit draws it back at `f`, so it keeps its true size, every part re-rendered, never
// stretched. Also where its near hand holds things, how big the hand is, and the tips a trail is
// drawn from (the toes, the serpent's tail, the spirit's wisp).
function fitted(kind) {
  if (kind === 'kid') {
    const b = blankBase({ tpose: false, guides: true });
    const J = { ...b.J };
    J.handN = [J.wrN[0], J.wrN[1] + 4];
    J.handF = [J.wrF[0], J.wrF[1] + 4];
    J.toeN = [J.ankN[0] + 3, J.ankN[1] + 2];
    const spec = blankSkinSpec();
    J.ribs = spec.ribs;
    J.navel = spec.navel;
    J.stern = spec.stern;
    return { groups: b.groups, J, f: 1, r: 4.2, spec };
  }
  const b = blankBody(kind, { tpose: false, guides: true });
  const B = BODIES[kind];
  const f = Math.max(b.box[0] / 160, b.box[1] / 148);
  const m = ([x, y]) => [CX + (x - B.cx) / f, G - (b.g - y) / f];
  const groups = {};
  for (const [n, list] of Object.entries(b.groups)) groups[n] = list.map((sh) => mapShape(sh, m, 1 / f));
  // (The ears ride on the head.)
  groups.head = [...(groups.ears ?? []), ...(groups.head ?? [])];
  delete groups.ears;
  const J = Object.fromEntries(Object.entries(b.J).map(([k, v]) => [k, m(v)]));
  if (B.tail) J.tail = m([B.cx - 10, 110]);
  const hr = B.arm[4];
  J.handN = m([b.J.wrN[0], b.J.wrN[1] + hr * 0.9]);
  J.handF = m([b.J.wrF[0], b.J.wrF[1] + hr * 0.9]);
  J.toeN = m([b.J.ankN[0] + B.foot * 0.5, b.J.ankN[1] + B.foot * 0.2]);
  if (B.lower === 'serpent') J.tailTip = m([B.cx - 113, b.g - 23.6]);
  if (B.lower === 'ghost') J.wispTip = m([B.cx - 26, B.hips[0] + 44]);
  // Its skin's shape, in the kid box too.
  const sp = skinSpec(kind);
  const my = (y) => G - (b.g - y) / f;
  const w = (v) => v / f;
  const spec = {
    right: sp.right.map(m),
    left: sp.left.map(m),
    cx: m([sp.cx, 0])[0],
    shoulder: { y: my(sp.shoulder.y), w: w(sp.shoulder.w), neckW: w(sp.shoulder.neckW) },
    lines: Object.fromEntries(Object.entries(sp.lines).map(([k, v]) => [k, my(v)])),
    neck: { base: m(sp.neck.base), top: m(sp.neck.top), chin: my(sp.neck.chin), w: w(sp.neck.w) },
    arm: Object.fromEntries(Object.entries(sp.arm).map(([k, v]) => [k, w(v)])),
    leg: { tw: w(sp.leg.tw), kw: w(sp.leg.kw), anw: w(sp.leg.anw), top: my(sp.leg.top), heel: w(sp.leg.heel), toe: w(sp.leg.toe), ftop: w(sp.leg.ftop), fbot: w(sp.leg.fbot) },
    collar: sp.collar.map((c) => c.map(m)),
    belly: sp.belly ? { x: m([sp.belly.x, sp.belly.y])[0], y: m([sp.belly.x, sp.belly.y])[1], rx: w(sp.belly.rx), ry: w(sp.belly.ry) } : null,
    fine: w(sp.fine),
    legs: sp.legs,
    horse: sp.horse
      ? {
          name: sp.horse.name,
          barrel: sp.horse.barrel.map(([x, y, kf, kh]) => [...m([B.cx + x, y]), kf, kh]),
          fore: { top: m([B.cx + sp.horse.fore.top[0], sp.horse.fore.top[1]]), bones: sp.horse.fore.bones.map(([x, y]) => [w(x), w(y)]), w: sp.horse.fore.w.map(w) },
          hind: { top: m([B.cx + sp.horse.hind.top[0], sp.horse.hind.top[1]]), bones: sp.horse.hind.bones.map(([x, y]) => [w(x), w(y)]), w: sp.horse.hind.w.map(w) },
          far: sp.horse.far.map(w),
          hoof: { w: w(sp.horse.hoof.w), h: w(sp.horse.hoof.h), up: w(sp.horse.hoof.up), cloven: sp.horse.hoof.cloven },
          tail: { kind: sp.horse.tail.kind, root: m([B.cx + sp.horse.tail.root[0], sp.horse.tail.root[1]]), len: w(sp.horse.tail.len), w: sp.horse.tail.w.map(w) },
        }
      : null,
  };
  J.ribs = m(sp.ribs);
  J.navel = m(sp.navel);
  J.stern = m(sp.stern);
  return { groups, J, f, r: hr / f, spec, m };
}

const CHANNELS = ['x', 'lift', 'hop', 'drop', 'pitch', 'paw', 'tilt', 'pelvis', 'waist', 'chest', 'neckR', 'shrugN', 'shrugF', 'reachN', 'reachF', 'hwN', 'hwF', 'turnC', 'turnP', 'head', 'shF', 'elF', 'shN', 'elN', 'wa', 'fxN', 'fyN', 'fxF', 'fyF', 'toeN', 'toeF', 'wing', 'wisp', 'tailW'];
// (Guns lie along the forearm; everything else sticks out of the fist across it.)
const ALONG = new Set(['pistol', 'rifle']);
const smoothstep = (u) => {
  const v = Math.min(1, Math.max(0, u));
  return v * v * (3 - 2 * v);
};
// (a point turned about the origin, radians)
const rotR = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
// ---------- His own moves (2026-11-25): the base's, and his own ----------
// (in the base's move format, blankmoves.js: key poses on a clock from the release)
//   noodleLash  he winds his near arm back and lashes a long noodle out at you from his hand, cracking
//               like a whip (`lash`: the window the noodle is out)
//   stickJab    he whips the chopsticks out of his bun and jabs them at you, snapping (`jab`: when
//               they snap; `sticks`: when they're in his hand)
//   (and the base serpent's tailWhip: his noodle tail swung round at you)
const RYU_MOVES = {
  noodleLash: {
    anticT: 0.42,
    keys: [
      [0, { tilt: -10, x: -0.03, head: -6, chest: -4, shN: 60, elN: -70, shF: -30, elF: -50, tailW: 0.3 }],
      [0.07, { tilt: 12, x: 0.05, head: 4, chest: 6, shN: -96, elN: -6, shF: 20, elF: -30, tailW: -0.4 }, 'out'],
      [0.32, { tilt: 9, x: 0.04, head: 2, chest: 4, shN: -84, elN: -14, tailW: -0.2 }],
      [0.7, {}],
    ],
    lash: [0, 0.5],
    face: [['angry', -9, 0.04], ['shout', 0.04, 0.3], ['smug', 0.3, 0.7]],
  },
  stickJab: {
    anticT: 0.36,
    keys: [
      [0, { tilt: -6, x: -0.02, head: -4, shN: -150, elN: -70, shF: -10, elF: -40 }],
      [0.1, { tilt: -8, x: -0.03, head: -6, shN: 30, elN: -90, shF: -10, elF: -40 }],
      [0.18, { tilt: 14, x: 0.07, head: 6, chest: 6, shN: -88, elN: -4, shF: 24, elF: -30, tailW: -0.3 }, 'out'],
      [0.42, { tilt: 10, x: 0.05, head: 4, shN: -84, elN: -10 }],
      [0.8, {}],
    ],
    jab: [0.18],
    sticks: [0.06, 0.62],
    face: [['smug', -9, 0.16], ['angry', 0.16, 0.42], ['smug', 0.42, 0.8]],
  },
};
const MOVES = { ...BASE_MOVES, ...RYU_MOVES };
// His casts (world/theatre.js sets m.castPose and m.cast): the pose he holds for the whole cast, acted
// out (t: seconds into it), and the face he makes. (Angles in degrees; x and lift in body heights.)
//   steam   arms flung up, head back, puffing up: steam bursts out all round him from the cup
//   whip    the near arm wound back high, the noodle lash swinging round over his head, then cracked
//   spit    a deep breath (cheeks puffed, reared back), then a spray of hot broth out over everyone
//   snap    the chopsticks pulled from his bun, held up snapping, then jabbed at the tank
//   timer   "Three Minutes!": both hands on the cup's rim, rocking it, the broth boiling over,
//           shouting
const CASTS = {
  steam: (t) => ({ lift: 0.02 + Math.abs(Math.sin(t * 5)) * 0.01, tilt: -8, head: -14, chest: -6, shN: -160 + Math.sin(t * 7) * 10, elN: -30, shF: -160 - Math.sin(t * 7 + 1) * 10, elF: -30, tailW: Math.sin(t * 4) * 0.4 }),
  whip: (t) => ({ tilt: -8 + Math.sin(t * 5) * 3, head: -8, chest: -4, shN: -170 + Math.sin(t * 9) * 26, elN: -40 + Math.cos(t * 9) * 30, shF: -20, elF: -50, tailW: Math.sin(t * 4.5) * 0.5 }),
  spit: (t) => (t < 0.9
    ? { tilt: -12 - t * 6, head: -16, chest: -6, shN: 20, elN: -60, shF: -20, elF: -60, tailW: 0.3 }
    : { tilt: 14 + Math.sin(t * 20) * 1.4, x: 0.04, head: 10, chest: 6, shN: -40, elN: -50, shF: 10, elF: -50, tailW: -0.3 }),
  snap: (t) => ({ tilt: -4 + Math.sin(t * 3) * 2, head: -6, shN: -120 + Math.abs(Math.sin(t * 8)) * 20, elN: -60 + Math.sin(t * 16) * 10, shF: -10, elF: -40, tailW: Math.sin(t * 3) * 0.3 }),
  timer: (t) => ({ x: Math.sin(t * 22) * 0.008, lift: Math.abs(Math.sin(t * 11)) * 0.012, tilt: 6 + Math.sin(t * 11) * 3, head: -10 + Math.sin(t * 11) * 4, chest: 2, shN: -20, elN: -84, shF: -20, elF: -84, tailW: Math.sin(t * 6) * 0.6 }),
};
const CAST_FACE = { steam: 'hot', whip: 'angry', spit: 'slurp', snap: 'smug', timer: 'shout' };

// (his stance: both hands on the cup's rim)
const RYU_STANCE = { shN: 14, elN: -74, shF: 14, elF: -74 };

const DEAD = { drop: 0.35, tilt: 18, waist: 12, head: 22, shN: 8, elN: -5, shF: -8, elF: 5, fxN: 0.1, fxF: -0.05, wing: -10, wisp: 10 };
const isBow = (w) => w === 'bow' || w === 'bowDrawn';
const BLANK_COLORS = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6' };
// A part drawn live by the skin (blankskin.js) rather than from a sprite: it sits at the rig's root
// and draws in the rig's space, its outline in the first pass and its fill in the second.
const EMPTY = () => sprite('rig|blankempty', () => ({ w: 1, h: 1, shapes: [], res: 1, bare: true }));
const live = (name, draw) => ({ name, live: draw });
// The two passes, as twoPass (kidrig.js) does for drawn parts: every part's outline first, then every
// part's fill, so only the figure's outer edge is outlined; live parts draw their outline, then
// their fill, in the same order.
function skinPasses(list) {
  const liveAs = (p, mode, suffix) => ({ name: `${p.name}${suffix}`, parent: null, at: () => [0, 0], pivot: [0, 0], s: EMPTY, paint: (ctx, a, S) => p.live(ctx, a, mode, S) });
  const first = list.map((p) => (p.live ? liveAs(p, 'line', '') : p.s ? { ...p, paint: undefined, s: (a, S) => p.s(a, S, false) } : p));
  const second = list.filter((p) => p.s || p.live).map((p) => (p.live ? liveAs(p, 'fill', '~b') : { ...p, name: `${p.name}~b`, s: (a, S) => p.s(a, S, true) }));
  return [...first, ...second];
}
// The rig's bones (2026-11-23, the player: "the whole body shouldn't move when animating ... a
// complex rig system that has many parts"): the hips (the pelvis, the root: the legs hang from it),
// the waist (the belly, bending from the hips at the navel), the chest (the ribcage, bending from
// the waist at the ribs), a collarbone each side from the top of the breastbone (the shoulder
// rising, `shrug`, and coming forward, `reach`, with its arm), the neck (from the breastbone) and
// the head on it, the arms on the collarbones, the hands turning at the wrists (`hw`), the legs.
// A lean (`tilt`) is shared up the spine, least at the hips, most in the chest, so a lean bends the
// back and the hips stay over the feet; `pelvis`, `waist`, `chest` turn each on top; `turnC` and
// `turnP` turn the chest and the hips round toward or away (their lines slide round, blankskin.js).
const rootAng = (S) => (S.tilt ?? 0) * 0.25 + (S.pelvis ?? 0);
const waistRel = (S) => (S.tilt ?? 0) * 0.35 + (S.waist ?? 0) * 0.55;
const chestRel = (S) => (S.tilt ?? 0) * 0.4 + (S.waist ?? 0) * 0.45 + (S.chest ?? 0);
const chestAng = (S) => (S.tilt ?? 0) + (S.pelvis ?? 0) + (S.waist ?? 0) + (S.chest ?? 0);

export function ryuRig(opts) {
  const kind = 'serpent';
  const B = BODIES[kind] ?? {};
  const { groups, J, f, r: handR, spec, m: toKid } = fitted(kind);
  // (his pieces, per face, in the kid box like the base's own; his own joints)
  const dressed = {};
  const design = (mood) => (dressed[mood] ??= Object.fromEntries(Object.entries(opts.design(mood)).map(([n, list]) => [n, list.map((sh) => mapShape(sh, toKid, 1 / f))])));
  for (const [n, p] of Object.entries(opts.J)) J[n] = toKid(p);
  const K = kidKit('ramenryu', (mood) => ({ groups: design(mood) }), J, { scale: f, flat: true });
  // (a piece of his, the same in every face)
  const D = (name, o) => ({ ...K.layer(name, o), s: (a, S, bare) => K.piece(name, null, bare) });
  const { rel, SC } = K;
  const skin = makeSkin({ J, SC, C: opts.skin, spec });
  // ---------- His live-drawn parts: the noodle tail, the whiskers, the chopsticks in his hands ----------
  // (each drawn twice by the two passes: its outline, then its fill, so only his outer edge shows a line)
  const NOOD = opts.noodle;
  const mixW = (c, k) => {
    if (k <= 0.001) return c;
    const n = parseInt(c.slice(1), 16);
    const f = (v) => Math.round(v + (255 - v) * Math.min(0.85, k));
    return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
  };
  const col = (a, c) => mixW(c, (a.flash ?? 0) * 6);
  const apply = (M, [x, y]) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
  const local = (p, pivot) => [(p[0] - J[pivot][0]) * SC, (p[1] - J[pivot][1]) * SC];
  const ptOn = (a, part, p, pivot) => apply(a.blMat(part), local(p, pivot));
  const OUTW = 2;
  // (base units to game px: how long a base unit is on him)
  const kPx = (() => {
    const p = toKid([100, 100]);
    const q = toKid([110, 100]);
    return (Math.hypot(q[0] - p[0], q[1] - p[1]) * SC) / 10;
  })();
  const pathOf = (ctx, pts, close) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (close) ctx.closePath();
  };
  const strokeLine = (ctx, pts, w, c) => {
    pathOf(ctx, pts, false);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = w;
    ctx.strokeStyle = c;
    ctx.stroke();
  };
  // The tail's centre line in base units (the base's own), sampled smooth; each sample's piece of the
  // tail (its bone) and its width; a sample's two edges.
  const TL = [[150, 116], [150, 124], [155, 150], [154, 174], [146, 197], [128, 201], [108, 202.5], [88, 204], [68, 206], [50, 208], [39, 208], [31, 204], [29, 196], [35, 190.4]];
  const cr = (p0, p1, p2, p3, u) => {
    const u2 = u * u;
    const u3 = u2 * u;
    return [0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u3));
  };
  const TS = [];
  for (let i = 0; i < TL.length - 1; i++) {
    const p0 = TL[Math.max(0, i - 1)];
    const p3 = TL[Math.min(TL.length - 1, i + 2)];
    for (let k = 0; k < 6; k++) TS.push(cr(p0, TL[i], TL[i + 1], p3, k / 6));
  }
  TS.push(TL[TL.length - 1]);
  const nearest = (p) => TS.reduce((b, q, i) => (Math.hypot(q[0] - p[0], q[1] - p[1]) < Math.hypot(TS[b][0] - p[0], TS[b][1] - p[1]) ? i : b), 0);
  const BS = opts.Jbase;
  const i0 = nearest(BS.serp0);
  const i1 = nearest(BS.serp1);
  const i2 = nearest(BS.serp2);
  const T_PART = TS.map((_, i) => (i <= i0 ? ['lower', 'serp0'] : i <= i1 ? ['tailA', 'serp0'] : i <= i2 ? ['tailB', 'serp1'] : ['tailC', 'serp2']));
  const T_U = TS.map((_, i) => i / (TS.length - 1));
  const tW = (u) => (u < 0.38 ? 31 - u * 13 : Math.max(3, 26 - (u - 0.38) * 37));
  const T_EDGE = TS.map((p, i) => {
    const a0 = TS[Math.max(0, i - 1)];
    const b0 = TS[Math.min(TS.length - 1, i + 1)];
    const an = Math.atan2(b0[1] - a0[1], b0[0] - a0[0]);
    const w = tW(T_U[i]) * 0.5;
    const n = [-Math.sin(an), Math.cos(an)];
    // (top: the outer side of the curve, away from the floor; bottom: the belly)
    return [toKid([p[0] - n[0] * w, p[1] - n[1] * w]), toKid([p[0] + n[0] * w, p[1] + n[1] * w]), toKid(p)];
  });
  // The tail this frame, in game px: [top edge, belly edge, centre] per sample.
  const tailNow = (a) => T_EDGE.map(([tp, bt, c], i) => {
    const [part, pv] = T_PART[i];
    const M = a.blMat(part);
    return [apply(M, local(tp, pv)), apply(M, local(bt, pv)), apply(M, local(c, pv))];
  });
  const lerpP = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
  // The loose noodle curls at the tip: [start, angle, length, curl, phase].
  const CURLS = [[0, -0.6, 22, 0.2, 0], [0.5, 0.3, 18, -0.26, 1.7], [-0.5, -1.4, 15, 0.3, 3.1]];
  const curlPts = (a, tip, dir, [off, ang, len, curl, ph]) => {
    const pts = [];
    let an = dir + ang + Math.sin(a.t * 2.2 + ph) * 0.25;
    let [x, y] = [tip[0] - Math.sin(dir) * off * 2 * kPx, tip[1] + Math.cos(dir) * off * 2 * kPx];
    const n = 9;
    for (let i = 0; i <= n; i++) {
      pts.push([x, y]);
      const step = (len / n) * kPx;
      an += curl + Math.sin(a.t * 3 + ph + i * 0.7) * 0.06;
      x += Math.cos(an) * step;
      y += Math.sin(an) * step;
    }
    return pts;
  };
  const tailLive = (ctx, a, mode) => {
    if (!a.blMat) return;
    const T = tailNow(a);
    const top = T.map((v) => v[0]);
    const bot = T.map((v) => v[1]);
    const ring = [...top, ...bot.slice().reverse()];
    const n = T.length;
    const tip = T[n - 1][2];
    const prev = T[n - 3][2];
    const dir = Math.atan2(tip[1] - prev[1], tip[0] - prev[0]);
    const wk = 2.2 * kPx;
    if (mode === 'line') {
      pathOf(ctx, ring, true);
      ctx.lineWidth = OUTW;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = CHAR_LINE;
      ctx.stroke();
      for (const c of CURLS) strokeLine(ctx, curlPts(a, tip, dir, c), wk + OUTW, CHAR_LINE);
      return;
    }
    // the rope
    pathOf(ctx, ring, true);
    ctx.fillStyle = col(a, NOOD[1]);
    ctx.fill();
    // the shade along its belly, a light along its top
    pathOf(ctx, [...T.map(([p, q]) => lerpP(p, q, 0.66)), ...bot.slice().reverse()], true);
    ctx.fillStyle = col(a, NOOD[2]);
    ctx.fill();
    pathOf(ctx, [...T.map(([p, q]) => lerpP(p, q, 0.08)), ...T.map(([p, q]) => lerpP(p, q, 0.26)).reverse()], true);
    ctx.fillStyle = col(a, NOOD[0]);
    ctx.fill();
    // the strands twisted along it, rippling back down the tail
    const walk = a.walkW ?? 0;
    for (let j = 0; j < 7; j++) {
      const f0 = 0.12 + j * 0.13;
      const pts = [];
      for (let i = 2; i < n; i++) {
        const u = T_U[i];
        const f = clamp(f0 + Math.sin(u * 30 + j * 1.9 - a.t * (2.6 + walk * 4)) * 0.07, 0.04, 0.96);
        pts.push(lerpP(T[i][0], T[i][1], f));
      }
      strokeLine(ctx, pts, 0.9 * kPx, col(a, j % 2 ? NOOD[3] : NOOD[2]));
      strokeLine(ctx, pts.map(([x, y]) => [x - 0.2 * kPx, y - 0.45 * kPx]), 0.35 * kPx, col(a, NOOD[0]));
    }
    // the curls at the tip
    for (const c of CURLS) {
      const pts = curlPts(a, tip, dir, c);
      strokeLine(ctx, pts, wk, col(a, NOOD[1]));
      strokeLine(ctx, pts.map(([x, y]) => [x - 0.3 * kPx, y - 0.5 * kPx]), wk * 0.32, col(a, NOOD[0]));
    }
  };
  // His noodle whiskers: from each cheek, drooping in a wavy curve, swaying; longer on the near side.
  const whiskerPts = (a, side) => {
    const M = a.blMat('headJ');
    const root = apply(M, local(side < 0 ? J.cheekF : J.cheekN, 'neck'));
    const ax = Math.atan2(M[1], M[0]);
    const pts = [root];
    let an = ax + (side > 0 ? 0.25 : Math.PI - 0.25);
    let [x, y] = root;
    const len = (side > 0 ? 18 : 14) * kPx;
    for (let i = 1; i <= 10; i++) {
      an += (side > 0 ? 0.14 : -0.14) + Math.sin(a.t * 2.6 + i * 0.8 + side) * 0.05;
      x += (Math.cos(an) * len) / 10;
      y += (Math.sin(an) * len) / 10;
      const wv = Math.sin(i * 1.3 + a.t * 3) * 0.5 * kPx;
      pts.push([x - Math.sin(an) * wv, y + Math.cos(an) * wv]);
    }
    return pts;
  };
  const whiskersLive = (ctx, a, mode) => {
    if (!a.blMat) return;
    const w = 1.5 * kPx;
    for (const side of [-1, 1]) {
      const pts = whiskerPts(a, side);
      if (mode === 'line') strokeLine(ctx, pts, w + OUTW, CHAR_LINE);
      else {
        strokeLine(ctx, pts, w, col(a, NOOD[1]));
        strokeLine(ctx, pts.map(([x, y]) => [x, y - 0.3 * kPx]), w * 0.35, col(a, NOOD[0]));
      }
    }
  };
  // The chopsticks out of his bun: both in his near hand to snap and stir, one in each hand to drum.
  const stickAt = (a, k) => {
    const hand = ptOn(a, `hand${k}`, J[`hand${k}`], `wr${k}`);
    const e = ptOn(a, `arm${k}f`, J[`el${k}`], `el${k}`);
    const w = ptOn(a, `arm${k}f`, J[`wr${k}`], `el${k}`);
    return [hand, Math.atan2(w[1] - e[1], w[0] - e[0])];
  };
  const oneStick = (ctx, a, mode, from, an) => {
    const L = 24 * kPx;
    const b = [from[0] - Math.cos(an) * L * 0.18, from[1] - Math.sin(an) * L * 0.18];
    const tip = [from[0] + Math.cos(an) * L * 0.82, from[1] + Math.sin(an) * L * 0.82];
    const w = 2 * kPx;
    if (mode === 'line') return strokeLine(ctx, [b, tip], w + OUTW, CHAR_LINE);
    const mid = lerpP(b, tip, 0.8);
    strokeLine(ctx, [b, mid], w, col(a, '#e8304a'));
    strokeLine(ctx, [mid, tip], w * 0.8, col(a, '#f4dcb0'));
    strokeLine(ctx, [lerpP(b, tip, 0.12), lerpP(b, tip, 0.17)], w * 1.1, col(a, '#ffd36a'));
    strokeLine(ctx, [lerpP(b, tip, 0.04), lerpP(b, tip, 0.7)].map(([x, y]) => [x, y - w * 0.22]), w * 0.3, col(a, '#ff7a8a'));
  };
  const sticksLive = (ctx, a, mode, S, k) => {
    const how = a.ryuSticks;
    if (!how || !a.blMat) return;
    if (how === 'drum') {
      const [h, an] = stickAt(a, k);
      return oneStick(ctx, a, mode, h, an + 0.5);
    }
    if (k !== 'N') return;
    const [h, an] = stickAt(a, 'N');
    if (how === 'stir') {
      const d = Math.PI / 2 + 0.55 + Math.sin(a.t * 6) * 0.25;
      oneStick(ctx, a, mode, h, d - 0.06);
      return oneStick(ctx, a, mode, h, d + 0.06);
    }
    const open = 0.06 + Math.abs(Math.sin(a.t * 14)) * 0.16;
    oneStick(ctx, a, mode, h, an - 0.25 - open);
    oneStick(ctx, a, mode, h, an - 0.25 + open);
  };

  const legs = B.legs !== false;
  const spirit = B.lower === 'ghost';
  const serpent = B.lower === 'serpent';
  const wings = Boolean(B.wings);
  // Its size: H its height (game px), `leg` its leg's length; every move's distances come from
  // these, so a tall queen lunges as far for her height as the kid does for its.
  const sz = f;
  const leg = (J.ankN[1] - J.hipN[1]) * SC;
  const Hk = G - J.crown[1];
  const H = Hk * SC;
  // (A four-legged lower half, blankquad.js: its legs at rest, a foreleg's length; it strides on them.)
  const horse = spec.horse;
  const QL = horse ? legDefs(horse, (v) => v * SC) : null;
  const hLF = QL ? QL.foreN.lens.reduce((x, y) => x + y, 0) : 0;
  const stride = (horse ? hLF : leg) * 1.15;
  const key = `bl${kind}`;
  const walkSpeed = stride * 1.4;
  const WK = blankGait(K, { stride, kick: leg * 0.24, key, walkSpeed, lean: rootAng });
  const tail = Boolean(groups.tail);
  const dist = (p, q) => Math.hypot(J[q][0] - J[p][0], J[q][1] - J[p][1]) * SC;
  const sub = (p, q) => [(J[p][0] - J[q][0]) * SC, (J[p][1] - J[q][1]) * SC];

  // Its weapons, sized to it (the bow's draw a little less than its arm's reach).
  const reach = (Math.hypot(J.elN[0] - J.shN[0], J.elN[1] - J.shN[1]) + Math.hypot(J.wrN[0] - J.elN[0], J.wrN[1] - J.elN[1])) * 0.85;
  const W = {};
  const weapon = (w) => (W[w] ??= w === 'bowDrawn' ? weaponOf('bow', Hk, handR, reach, true) : weaponOf(w, Hk, handR, reach));
  const handAt = sub('handN', 'elN');

  // The serpent's tail: each piece's turn as the waves pass (and as it whips), so the joints rise to
  // the waves' heights (the first stays on the ground where the body comes down to it).
  const LA = serpent ? dist('serp0', 'serp1') : 1;
  const LB = serpent ? dist('serp1', 'serp2') : 1;
  const LC = LB * 0.55;
  const hgt = serpent ? (J.serp0[1] - J.hip[1]) * SC : 1;
  const segs = (S, a) => {
    const c = a.blSegs;
    if (c?.S === S) return c.v;
    const w = a.walkW ?? 0;
    const ph = a.blSl ?? 0;
    const amp = (0.25 + 1.1 * w) * sz;
    const h = [0, 1, 2, 3].map((j) => (j ? amp * (0.5 + 0.5 * Math.sin(ph - j * 1.7)) : 0));
    const ang = (d, L) => Math.asin(clamp(d / L, -0.7, 0.7));
    const tw = S.tailW ?? 0;
    const A = ang(h[1] - h[0], LA) + tw * 0.62;
    const Bt = ang(h[2] - h[1], LB) + tw * 1.45;
    const C = ang(h[3] - h[2], LC) + Math.sin(ph - 5.6) * (0.06 + 0.1 * w) + tw * 2.4;
    const v = [A, Bt - A, C - Bt];
    a.blSegs = { S, v };
    return v;
  };

  // Where the near hand is for a pose (the rig's space, feet at 0, 0, y down), and the weapon's
  // angle turned up from the ground if its tip or head would be under it.
  const rot2 = ([x, y], deg) => {
    const r = deg * D2R;
    return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
  };
  const navelAt = rel('navel', 'hip');
  const ribsAt = rel('ribs', 'navel');
  const sternAt = rel('stern', 'ribs');
  const shoulderAt = rel('shN', 'stern');
  const elbowAt = rel('elN', 'shN');
  function aboveGround(P, wn, drawn) {
    const [hx, hy] = rel('hip');
    const T = [hx + P.x, hy - P.lift - P.hop];
    const C = chestAng(P);
    const nv = rot2(navelAt, rootAng(P));
    const rb = rot2(ribsAt, rootAng(P) + waistRel(P));
    const st = rot2([sternAt[0] + (P.reachN ?? 0), sternAt[1]], C);
    const sh = rot2(shoulderAt, C - (P.shrugN ?? 0));
    const el = rot2(elbowAt, C + P.shN);
    const hd = rot2(handAt, C + P.shN + P.elN);
    const hand = [T[0] + nv[0] + rb[0] + st[0] + sh[0] + el[0] + hd[0], T[1] + nv[1] + rb[1] + st[1] + sh[1] + el[1] + hd[1]];
    const w = weapon(drawn ? 'bowDrawn' : wn);
    const pts = [w.tip, [w.box[0], 0], [w.box[2], 0]].map(([x, y]) => [x * SC, y * SC]);
    const along = ALONG.has(wn);
    const lowest = (wa) => Math.max(...pts.map((p) => hand[1] + rot2(p, along ? wa : wa + 90)[1]));
    const floor = -0.6;
    let wa = P.wa;
    if (lowest(wa) <= floor) return wa;
    // (Turned toward level on the side it points to, a few degrees at a time.)
    const dir = Math.sin(wa * D2R) > 0 ? 1 : -1;
    for (let i = 0; i < 40 && lowest(wa) > floor; i++) wa += dir * 3 * (Math.cos(wa * D2R) > 0 ? 1 : -1);
    return wa;
  }

  // A four-legged lower half (blankbases.js HORSE, DEER; its legs blankquad.js): its body rides level
  // under the rider's lean (and pitches up to rear, about its hind legs) and rocks over its legs as
  // they step, about the rider's hips (so she stays on it), flexing along its back with the stride;
  // each leg, three bones, reaches its hoof's place from its top joint inside the body; walking, the
  // hooves step one at a time, trotting in diagonal pairs, galloping gathered, hinds then fores;
  // jumping the legs tuck up, rearing the forelegs paw the air; the body's outline follows the near
  // legs' upper bones (blankskin.js); the tail flows from the rump (a pony's) or flicks up (a deer's).
  let Dh = 0;
  if (horse) Dh = (J.hip[0] - horse.hind.top[0]) * SC;
  // The step this frame: each hoof's place, how low each end is held, walk, trot or gallop.
  const horseGait = (a) => {
    const u = a[`${key}U`] ?? 0;
    const R = a[`${key}R`] ?? 0;
    const trot = smoothstep(R / 0.5);
    const run = smoothstep((R - 0.5) / 0.5);
    const cyc = stride * (1 + 0.75 * R);
    const steps = {};
    for (const k of Object.keys(QL)) steps[k] = stepAt(u, legPhase(k, trot, run), run, cyc, hLF);
    return { u, trot, run, steps, ...sinks(QL, steps) };
  };
  function horseUnder(S, a, matOf) {
    const M = matOf('barrel');
    const w = a.walkW ?? 0;
    const t = a.t;
    const hop = S.hop ?? 0;
    const gt = horseGait(a);
    const bang = Math.atan2(M[1], M[0]);
    // (rocking: the back end held lower as the hind legs slant; the back flexing behind its middle)
    const D = (horse.fore.top[0] - horse.hind.top[0]) * SC;
    const rock = -Math.atan2((gt.hS - gt.fS) * w, D);
    const flex = Math.sin(4 * Math.PI * gt.u + 0.5) * (0.8 + 1.2 * gt.trot + 4 * gt.run) * w * D2R;
    const kOf = (p) => smoothstep(((J.hip[0] - p[0]) * SC - D * 0.35) / (D * 0.45));
    const angAt = (p) => bang + rock + flex * kOf(p);
    const loc = (p) => {
      const q = rotR([(p[0] - J.hip[0]) * SC, (p[1] - J.hip[1]) * SC], rock + flex * kOf(p));
      return [M[0] * q[0] + M[2] * q[1] + M[4], M[1] * q[0] + M[3] * q[1] + M[5]];
    };
    const tuck = clamp(hop / (H * 0.15), 0, 1);
    const paw = clamp(S.paw ?? 0, 0, 1);
    const ground = -horse.hoof.up * SC;
    // (brought low, knocked down or beaten, its legs fold under it as it lies: the forelegs' cannons
    // tucked back under the chest, the hind legs' along the ground under the belly)
    const low = smoothstep((M[5] - (J.hip[1] - G) * SC - hLF * 0.12) / (hLF * 0.4)) * (1 - tuck);
    const legs = {};
    for (const [k, L] of Object.entries(QL)) {
      const g = gt.steps[k];
      // (the shoulder blade slides along the ribs with the foreleg's swing; the hip is fixed)
      const T = loc(L.hind ? L.top : [L.top[0] + (g.dx / SC) * 0.1 * w, L.top[1]]);
      let foot = [(L.rest[3][0] - CX) * SC + g.dx * w + (S.x ?? 0) * 0.3 * (1 - w), ground - g.lift * w - hop];
      let a3 = L.a3 + (lowAngle(L, g) - L.a3) * w;
      const to = (q, ang, k2) => {
        foot = [foot[0] + (q[0] - foot[0]) * k2, foot[1] + (q[1] - foot[1]) * k2];
        a3 += (ang - a3) * k2;
      };
      // (leaping, the legs fold up under the belly: the forelegs' cannons folded back under the
      // forearms, the hind legs' hocks flexed tight, their cannons forward under the body)
      if (tuck > 0) to([T[0] + hLF * (L.hind ? 0.15 : 0.08), T[1] + hLF * (L.hind ? 0.42 : 0.3)], L.hind ? 1.5 : -2.2, tuck);
      if (low > 0) to([T[0] + hLF * (L.hind ? 0.42 : 0.3), ground], L.hind ? 1.5 : -2.2, low);
      if (!L.hind && paw > 0) {
        // (rearing, the forelegs paw the air in turn)
        const ph = t * 13 + (L.far ? 1.7 : 0);
        to([T[0] + hLF * (0.3 + 0.14 * Math.sin(ph)), T[1] + hLF * (0.44 - 0.12 * Math.abs(Math.cos(ph)))], -1.5 + 0.55 * Math.sin(ph), paw);
      }
      const bones = placeLeg(L, T, foot, a3);
      // (a planted hoof stands flat, rolling over its toe as it leaves; a lifted one tips with its leg)
      const flat = g.v < 0 && Math.max(tuck, low) < 0.5 && (L.hind || paw < 0.5) ? 0.22 : 0.62;
      legs[k] = { hind: L.hind, far: L.far, ...bones, rot: (a3 - L.a3) * flat, w: L.w };
    }
    // The body's outline: each point follows the body, and near the near legs those legs' upper
    // bones (the chest's bottom by the elbow turning with the upper arm, the haunch with the thigh).
    const dF = legs.foreN.up - (QL.foreN.up + angAt(QL.foreN.top));
    const dH = legs.hindN.up - (QL.hindN.up + angAt(QL.hindN.top));
    const turnAbout = (q, c, ang) => {
      const [x, y] = rotR([q[0] - c[0], q[1] - c[1]], ang);
      return [c[0] + x, c[1] + y];
    };
    const mix = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
    const bodyPt = (p) => {
      let q = loc(p);
      if (p[2]) q = mix(q, turnAbout(q, legs.foreN.T, dF), p[2]);
      if (p[3]) q = mix(q, turnAbout(q, legs.hindN.T, dH), p[3]);
      return q;
    };
    const root = loc(horse.tail.root);
    const ra = angAt(horse.tail.root);
    const tail = [root];
    if (horse.tail.kind === 'flag') {
      // A deer's: short, out back from the rump and a little down, flicking up now and then (a few
      // quick flips), raised like a flag as it runs or leaps.
      const fl = hold(t % 4.7, 1, 1.08, 1.5, 1.7);
      const raise = Math.min(1, fl * (0.55 + 0.45 * Math.abs(Math.sin(t * 19))) + gt.run * 0.9 + w * 0.15 + tuck * 0.8);
      const seg = (horse.tail.len * SC) / 3;
      for (let i = 1; i <= 3; i++) {
        const th = ra + Math.PI - 0.55 + raise * 1.15 - (i - 1) * (0.32 - raise * 0.2);
        const [px, py] = tail[i - 1];
        tail.push([px + Math.cos(th) * seg, py + Math.sin(th) * seg]);
      }
    } else {
      // A pony's: out back from the croup first, then falling away down, an arc, never a stick;
      // moving, it streams out behind; a sway runs down it, the tip a beat behind the root.
      const seg = (horse.tail.len * SC) / 6;
      for (let i = 1; i <= 6; i++) {
        const k = i / 6;
        const th = ra + 2.75 - 1.05 * k ** 0.8 + (w * 0.35 + gt.run * 0.45) * k + Math.sin(t * 1.8 - i * 0.6) * (0.05 + 0.1 * w) * (k + 0.3) - tuck * 0.35 * k;
        const [px, py] = tail[i - 1];
        tail.push([px + Math.cos(th) * seg, py + Math.sin(th) * seg]);
      }
    }
    a.blHorse = { legs, tail, bodyPt };
  }

  // The move playing now: [move, time from its release (< 0: winding up), how far into the wind-up].
  function moveNow(m, a, st, weaponHeld) {
    if (m.act && MOVES[m.act.name]) {
      const mv = MOVES[m.act.name];
      const T = a.now - m.act.at;
      if (T >= 0 && T < mv.anticT + lengthOf(mv)) {
        const t = T - mv.anticT;
        return [mv, t, t < 0 ? (mv.anticT > 0 ? Math.min(1, T / mv.anticT) : 1) : 1];
      }
    }
    // An attack: the next move off its list, picked as it starts winding up (or as it strikes).
    const on = a.ph.antic > 0 || a.ph.since >= 0;
    if (on) {
      if (!st.blAtk) {
        const pool = m.def.moves ?? POOLS[weaponHeld ?? (m.def.caster ? 'magic' : 'fist')] ?? POOLS.fist;
        st.blN = (st.blN ?? m.uid) + 1;
        st.blPick = m.move ?? pool[st.blN % pool.length];
      }
      st.blAtk = true;
      const mv = MOVES[m.move ?? st.blPick];
      if (mv) {
        if (a.ph.since >= 0) return [mv, a.ph.since, 1];
        return [mv, -(1 - a.ph.antic) * mv.anticT, a.ph.antic];
      }
    } else st.blAtk = false;
    if (m.hp > 0 && (a.hurtAgo ?? 9) < lengthOf(MOVES.hurt)) return [MOVES.hurt, a.hurtAgo, 1];
    const gl = a.now - (m.gloatAt ?? -9);
    if (m.hp > 0 && gl >= 0 && gl < lengthOf(MOVES.cheer)) return [MOVES.cheer, gl, 1];
    return [null, 0, 0];
  }

  const rig = makeRig({
    w: K.BW,
    h: K.BH,
    soft: true,
    stride,
    recover: 1.4,
    springs: {
      x: [170, 15], lift: [170, 13], hop: [140, 13], tilt: [130, 11], pelvis: [150, 13], waist: [150, 13], chest: [150, 13], neckR: [120, 11], head: [110, 10], pitch: [150, 13], paw: [200, 16],
      shrugN: [170, 14], shrugF: [170, 14], reachN: [170, 14], reachF: [170, 14], hwN: [220, 17], hwF: [220, 17], turnC: [140, 12], turnP: [140, 12],
      shF: [150, 12], elF: [160, 12], shN: [150, 12], elN: [160, 12], wa: [170, 14],
      fxN: [260, 22], fyN: [260, 22], fxF: [260, 22], fyF: [260, 22], toeN: [400, 30], toeF: [400, 30],
      wing: [260, 16], wisp: [90, 8], tailW: [140, 12],
    },
    walkStiff: { x: [500, 44], lift: [1400, 75], tilt: [400, 38], pelvis: [380, 34], waist: [380, 34], chest: [380, 34], head: [260, 28], neckR: [260, 28], shrugN: [300, 30], shrugF: [300, 30], reachN: [300, 30], reachF: [300, 30], turnC: [320, 32], turnP: [320, 32], shN: [320, 32], shF: [320, 32], elN: [200, 22], elF: [200, 22], wa: [320, 32] },
    fast: CHANNELS,
    fastNow: (m, a) => Boolean(a.mo.rig?.blActive),
    kick: { tilt: -40, head: 60 },
    turnKick: { tilt: 24, head: -30 },
    pose(m, a) {
      const st = (a.mo.rig ??= {});
      const t = a.t + (m.uid % 7) * 1.1;
      const U0 = a[`${key}U`] ?? st[`${key}U`] ?? 0;
      WK.step(m, a);
      const U = a[`${key}U`] ?? 0;
      const run = a[`${key}R`] ?? 0;
      // (The slither's phase: run on by the distance slithered, and slowly at rest; kept, never
      // worked out from the clock, so it never jumps as the walk eases in and out.)
      st.blSl = ((st.blSl ?? 0) + (((U - U0 + 1) % 1) * TAU) + Math.max(0, a.dt) * 1.2 * (1 - (a.walkW ?? 0))) % (TAU * 64);
      a.blSl = st.blSl;
      const held = m.weapon ?? m.def.weapon ?? null;
      const [mv0, mt, anticW] = moveNow(m, a, st, held);
      // (A body without legs fights with its tail or wisp instead of a kick.)
      const mv = mv0?.legs && !legs ? MOVES[LEGLESS[B.lower]] : mv0;
      const weaponNow = held ?? mv?.weapon ?? null;
      a.blWeaponHeld = Boolean(weaponNow);

      // The rest pose: idle, walk, run, holding its weapon.
      const breath = Math.sin(t * 1.5);
      const shift = Math.sin(t * 0.45);
      const glance = hold(t % 9, 4, 4.7, 6, 6.8) * (a.calm ?? 1);
      const hover = spirit ? (0.7 + 0.6 * Math.sin(t * 2.1)) * sz : 0;
      const idle = {
        // (Standing still: the feet and the hips stay put. The weight shifting from foot to foot
        // drops one hip, the waist and chest righting the body over it, the chest turning a touch
        // against the hips; each breath lifts the chest and the shoulders, never the whole body; a
        // glance turns the neck, then the head.)
        x: shift * 0.12 * sz, lift: hover, hop: 0, drop: 0, tilt: 0, pelvis: shift * 2.6, waist: -shift * 1.8, chest: -shift * 0.7 - breath * 0.7, neckR: -breath * 0.4 - glance * 2.6, head: breath * 0.3 - glance * 4.6,
        shF: 4 + breath * 1.2, elF: 6 + breath, shN: -4 - breath * 1.2, elN: -6 - breath, wa: -100,
        fxN: shift * 0.25 * sz, fyN: 0, fxF: -shift * 0.12 * sz, fyF: 0, toeN: 0, toeF: 0,
        shrugN: 1 + breath * 1.5, shrugF: 1 + breath * 1.5, reachN: 0, reachF: 0, hwN: 4 + breath, hwF: -4 - breath, turnC: shift * 0.08, turnP: -shift * 0.06,
        wing: 3 + Math.sin(t * 1.6) * 3, wisp: Math.sin(t * 2.2) * 5, tailW: 0,
      };
      const p = U * TAU;
      const roll = Math.sin(p - 0.5);
      const fold = (v) => (1 - Math.cos(v)) / 2;
      const swing = Math.cos(p - 0.15);
      const walk = {
        // (Walking: the hips rock with each step and turn with the forward leg, the chest turns
        // against them with the swinging arms, each shoulder coming forward with its arm; the head
        // rides steady on the neck.)
        x: (0.2 + roll * 0.25) * sz, lift: -WK.sink(a) - 0.6 * sz + WK.bob(a) * 1.3 * sz, hop: 0, drop: 0, tilt: 1 + roll * 0.8, pelvis: Math.sin(p - 0.3) * 3, waist: 1 - Math.sin(p - 0.3) * 2.4, chest: -Math.sin(p - 0.3) * 1.2, neckR: -1 + WK.headBob(a) * 2, head: -1 - roll * 0.5 + WK.headBob(a) * 3,
        shF: 4 - swing * 18, elF: 8 - fold(p - 0.4) * 16, shN: -4 + swing * 18, elN: -8 - fold(p - 0.4 + Math.PI) * 16, wa: -100,
        fxN: 0, fyN: 0, fxF: 0, fyF: 0, toeN: 0, toeF: 0,
        shrugN: 1.5 + swing * 1.2, shrugF: 1.5 - swing * 1.2, reachN: -swing * H * 0.014, reachF: swing * H * 0.014, hwN: 6, hwF: -6, turnC: -swing * 0.22, turnP: swing * 0.17,
        wing: 6 + Math.sin(p * 2 - 0.6) * 4, wisp: 0, tailW: 0,
      };
      // The run: leaning in, elbows bent and pumping, the head steady.
      if (run > 0 && legs) {
        const rn = {
          x: 0.6 * sz, lift: -WK.sink(a) - 0.4 * sz + WK.bob(a) * H * 0.045, tilt: 9 + roll * 1.4, pelvis: Math.sin(p - 0.3) * 3.6, waist: 5 - Math.sin(p - 0.3) * 3, chest: 2 - Math.sin(p - 0.3) * 1.6, neckR: -3, head: -3 + WK.headBob(a) * 3,
          shrugN: 3 + swing * 2.5, shrugF: 3 - swing * 2.5, reachN: -swing * H * 0.026, reachF: swing * H * 0.026, turnC: -swing * 0.36, turnP: swing * 0.26, hwN: 10, hwF: -10,
          shF: 6 - swing * 38, elF: -78 + swing * 10, shN: -6 + swing * 38, elN: -78 - swing * 10, wing: 12 + Math.sin(p * 2) * 5,
        };
        for (const [k2, v] of Object.entries(rn)) walk[k2] += (v - walk[k2]) * run;
      }
      if (spirit) {
        // The glide: leaning forward, arms out in front with the hands drooping, the wisp trailing.
        const sw = Math.sin(t * 2.1);
        Object.assign(walk, { x: 0.6 * sz, lift: hover + 0.6 * sz, tilt: 8 + sw * 0.8 + run * 6, pelvis: -4 + sw, waist: 4 - sw, chest: 2 + sw, shrugN: 6, shrugF: 6, reachN: H * 0.02, reachF: H * 0.01, head: -5 + sw, shF: -58 + sw * 3, elF: 38, shN: -68 + sw * 3, elN: 42, wisp: 14 + run * 10 + Math.sin(t * 4) * 5 });
      } else if (serpent) {
        // The slither: the upper body swaying forward and back with the waves, a dancer's arms.
        const ph = a.blSl;
        Object.assign(walk, { x: Math.sin(ph) * 0.9 * sz, lift: Math.cos(ph * 2) * 0.3 * sz, tilt: 3 + run * 5 + Math.sin(ph) * 2.4, pelvis: Math.sin(ph) * 2.4, waist: -Math.sin(ph - 0.6) * 4, chest: -Math.sin(ph - 1.2) * 2, turnC: Math.sin(ph - 0.8) * 0.3, turnP: -Math.sin(ph) * 0.2, shrugN: 2 + Math.sin(ph) * 2, shrugF: 2 - Math.sin(ph) * 2, head: -Math.sin(ph) * 2.4, shF: 10 + Math.sin(ph) * 8, elF: 16 - Math.sin(ph) * 6, shN: -12 + Math.sin(ph) * 8, elN: -18 + Math.sin(ph) * 6 });
        Object.assign(idle, { x: Math.sin(ph) * 0.3 * sz, tilt: Math.sin(ph) * 1, pelvis: Math.sin(ph) * 1.6, waist: -Math.sin(ph - 0.6) * 2.6, chest: -Math.sin(ph - 1.2) * 1.2, turnC: Math.sin(ph - 0.8) * 0.18, turnP: -Math.sin(ph) * 0.12 });
        // His stance: a cheeky lean, both hands resting on his cup's rim, a little bounce on his tail.
        Object.assign(idle, { shN: RYU_STANCE.shN + breath * 1.2, elN: RYU_STANCE.elN - breath, shF: RYU_STANCE.shF - breath * 1.2, elF: RYU_STANCE.elF + breath, hwN: 0, hwF: 0, head: -2 + breath * 0.3 - glance * 4.6, tailW: Math.sin(t * 1.3) * 0.12 });
        // His slither: arms swinging loose at his sides, the noodle tail rippling.
        Object.assign(walk, { shF: -16 - Math.sin(ph) * 12, elF: -34, shN: -16 + Math.sin(ph) * 12, elN: -34 });
      }
      if (horse) {
        // (The rider rides its steps: lower as the forelegs slant under her, floating in a gallop's
        // flight, no stepping of her own.)
        const gt = horseGait(a);
        Object.assign(walk, { x: 0.2 * sz, lift: -gt.fS + (gt.down ? 0 : hLF * 0.07 * gt.run), tilt: 1 + roll * 0.5 + run * 4 });
        idle.x = shift * 0.05 * sz;
      }
      // Holding a weapon: the near arm keeps it ready (swinging a little on the walk), and the far
      // hand stays on a two-handed one.
      const hp0 = weaponNow ? HOLDS[weaponNow] : null;
      if (hp0) {
        for (const [k2, v] of Object.entries(hp0)) {
          idle[k2] = v + (k2 === 'shN' || k2 === 'shF' ? breath * 1.2 : 0) + (k2 === 'wa' ? Math.sin(t * 1.3) * 3 : 0);
          walk[k2] = v + (k2 === 'shN' ? swing * 5 : k2 === 'shF' ? -swing * 5 : 0) + (k2 === 'wa' ? Math.sin(p) * 4 : 0);
        }
      }
      // In move units: body offsets in body heights, feet and sitting in leg lengths.
      const base = {};
      for (const k2 of CHANNELS) base[k2] = (idle[k2] ?? 0) * (1 - a.walkW) + (walk[k2] ?? 0) * a.walkW;
      for (const k2 of ['x', 'lift', 'hop']) base[k2] /= H;
      for (const k2 of ['drop', 'fxN', 'fyN', 'fxF', 'fyF']) base[k2] /= leg;
      const out = mv ? poseAt(mv, mt, anticW, base) : { ...base };
      // His own act, on top of the base's sway (degrees; x and lift in body heights): a 32 s loop
      // (2026-11-25, the player: "heavily heavily polish it"):
      //   - a slurp: he plucks a noodle off his bun, holds it up, SLUUURP, it zips into his mouth;
      //     cheeks puffed, chewing, a happy wiggle;
      //   - a stir: he pulls the chopsticks out of his bun and stirs his cup, peering in, sniffing;
      //   - a steam bath: steam billows up off the cup, he stretches up into it, swaying, blissful;
      //   - hungry: he leans in at you, starry-eyed, licking his lips, rubbing his cup like a belly;
      //   - a drum solo on the cup's rim with both chopsticks, head bopping;
      //   - 2 a.m.: a huge yawn, arms up; nodding off... a steam pop jolts him awake;
      //   - a flick of his noodle locks, smug.
      //   a named cast: the pose he holds for it (CASTS), whatever else is going on.
      //   cleared (m.cine.mood 'happy' / 'sad'): his face of the moment, swaying gently.
      {
        a.ryuFace = null;
        a.ryuSticks = null;
        a.ryuSlurp = -1;
        a.ryuSteam = 0;
        a.ryuDrum = 0;
        a.ryuDrool = 0;
        a.ryuPop = -1;
        a.ryuStir = 0;
        const go = (pose, w) => {
          if (w > 0.001) for (const [k2, v] of Object.entries(pose)) out[k2] = (out[k2] ?? 0) + (v - (out[k2] ?? 0)) * w;
        };
        const mood = m.cine?.mood;
        const calmK = (a.calm ?? 1) * (mv ? 0 : 1) * (1 - (a.walkW ?? 0)) * (m.hp > 0 ? 1 : 0) * (mood ? 0 : 1) * (m.cast && m.castPose ? 0 : 1);
        const lu = (t + (m.uid % 5) * 1.7) % 32;
        // the slurp
        const pluck = hold(lu, 0.8, 1.2, 1.6, 1.9) * calmK;
        const hold1 = hold(lu, 1.7, 2, 2.3, 2.5) * calmK;
        const sl = hold(lu, 2.4, 2.5, 3.1, 3.4) * calmK;
        const chew = hold(lu, 3.2, 3.4, 4.6, 5) * calmK;
        const ch = Math.abs(Math.sin(t * 9));
        go({ shN: -172, elN: -70, head: -6, tilt: -2, chest: -2 }, pluck);
        go({ shN: -130, elN: -40, head: -12, tilt: -4 }, hold1);
        go({ shN: -110, elN: -96, head: -18, tilt: -6, chest: -4, lift: 0.02 }, sl);
        go({ shN: 0, elN: -40, shF: 0, elF: -40, head: 4 + ch * 4, tilt: Math.sin(t * 8) * 3, waist: Math.sin(t * 8) * 4, tailW: Math.sin(t * 8) * 0.3 }, chew);
        a.ryuSlurp = calmK > 0.3 && lu >= 1.9 && lu < 3.1 ? (lu - 1.9) / 1.2 : -1;
        // the stir
        const stir = hold(lu, 6, 6.5, 9, 9.5) * calmK;
        const sa = (lu - 6.5) * 6;
        go({ shN: -46 + Math.sin(sa) * 12, elN: -60 + Math.cos(sa) * 14, shF: -10, elF: -60, head: 16, tilt: 6, chest: 4, neckR: -4 }, stir);
        if (stir > 0.3) a.ryuSticks = 'stir';
        a.ryuStir = stir;
        // the steam bath
        const bath = hold(lu, 10.6, 11.4, 13.8, 14.6) * calmK;
        const bs = Math.sin(t * 1.8);
        go({ shN: -160 + bs * 8, elN: -40, shF: -160 - bs * 8, elF: -40, head: -16 + bs * 3, tilt: -6 + bs * 4, waist: bs * 5, chest: -5, lift: 0.025, tailW: bs * 0.4 }, bath);
        a.ryuSteam = bath;
        // hungry: leaning in at you, licking his lips, rubbing his cup
        const hung = hold(lu, 15.6, 16.2, 18.6, 19.2) * calmK;
        const rub = (lu - 16.2) * 5;
        go({ tilt: 12, x: 0.03, head: 6, chest: 6, shN: 10 + Math.sin(rub) * 14, elN: -80 + Math.cos(rub) * 10, shF: -20, elF: -60, tailW: Math.sin(t * 5) * 0.5 }, hung);
        a.ryuDrool = hung;
        // the drum solo on the cup's rim
        const drum = hold(lu, 20.2, 20.6, 23, 23.4) * calmK;
        const bt = (lu - 20.6) * 8;
        const hitN = Math.max(0, Math.sin(bt));
        const hitF = Math.max(0, Math.sin(bt + Math.PI));
        go({ shN: -50 + hitN * 18, elN: -70 + hitN * 20, shF: -50 + hitF * 18, elF: -70 + hitF * 20, head: 6 + Math.abs(Math.sin(bt)) * 6, tilt: Math.sin(bt * 0.5) * 3, chest: 2 }, drum);
        if (drum > 0.3) a.ryuSticks = 'drum';
        a.ryuDrum = drum > 0.3 ? bt : 0;
        // 2 a.m.: a huge yawn; nodding off; a steam pop
        const yawn = hold(lu, 24.6, 25, 26.2, 26.6) * calmK;
        go({ shN: -168, elN: -24, shF: -168, elF: -24, head: -16, tilt: -6, chest: -6, lift: 0.02 }, yawn);
        const doze = hold(lu, 26.4, 26.9, 28.6, 28.7) * calmK;
        const nod = Math.min(1, Math.max(0, (lu - 26.9) / 1.6));
        go({ head: 8 + nod * 14 + Math.sin(t * 2) * 2, tilt: 3 + nod * 3, chest: 3, shN: 4, elN: -20, shF: -4, elF: -20, lift: -0.02 * nod, tailW: -0.2 }, doze);
        const pop = hold(lu, 28.65, 28.72, 28.9, 29.4) * calmK;
        go({ lift: 0.05, head: -12, tilt: -6, shN: -60, elN: -30, shF: -60, elF: -30, tailW: 0.6 }, pop);
        a.ryuPop = calmK > 0.3 && lu >= 28.62 && lu < 29.6 ? (lu - 28.62) / 1 : -1;
        // a flick of his noodle locks
        const flick = hold(lu, 30, 30.3, 31.2, 31.7) * calmK;
        const fk = hold(lu, 30.3, 30.45, 30.6, 30.9) * calmK;
        go({ shN: -150, elN: -110, head: -6, tilt: -3 }, flick);
        go({ head: -14, neckR: -8, tilt: -6 }, fk);
        a.ryuFace = pluck > 0.4 ? 'o' : hold1 > 0.4 ? 'hungry' : sl > 0.3 ? 'slurp' : chew > 0.4 ? (lu > 4.2 ? 'happy' : 'chew')
          : stir > 0.4 ? (lu < 8 ? 'o' : 'smug') : bath > 0.4 ? 'happy' : hung > 0.4 ? 'hungry' : drum > 0.4 ? 'happy'
          : yawn > 0.4 ? 'yawn' : pop > 0.3 ? 'o' : doze > 0.4 ? 'sleepy' : flick > 0.4 ? 'smug' : null;
        // a named cast, held for as long as it lasts
        st.ryuKind = m.castPose && CASTS[m.castPose] && m.cast ? m.castPose : null;
        if (st.ryuKind && m.hp > 0) {
          const ct = a.now - m.cast.t0;
          go(CASTS[st.ryuKind](ct), clamp(ct / 0.4, 0, 1));
          a.ryuFace = CAST_FACE[st.ryuKind] === 'slurp' && ct > 0.9 ? 'shout' : CAST_FACE[st.ryuKind];
          if (st.ryuKind === 'snap') a.ryuSticks = 'snap';
        }
        // cleared, in a scene: his face of the moment, swaying gently
        if (mood && m.hp > 0) {
          const sw = Math.sin(t * 2);
          if (mood === 'happy') go({ tilt: sw * 4, head: -4 + sw * 3, shN: -40, elN: -80, shF: -40, elF: -80, tailW: sw * 0.4 }, 1);
          else if (mood === 'sad') go({ tilt: 4, head: 14, chest: 4, shN: 6, elN: -30, shF: -6, elF: -30, tailW: -0.3 }, 1);
        }
      }
      // (his attacks' faces: each move's list of [face, from, to]; the chopsticks in his hand)
      if (mv?.face) for (const [fc, f0, f1] of mv.face) if (mt >= f0 && mt < f1) a.ryuFace = fc;
      if (mv?.sticks && mt >= mv.sticks[0] && mt < mv.sticks[1]) a.ryuSticks = 'snap';
      // A block held (m.guard), eased in and out.
      st.blGuard = (st.blGuard ?? 0) + ((m.guard && !mv ? 1 : 0) - (st.blGuard ?? 0)) * Math.min(1, a.dt * 12);
      if (st.blGuard > 0.001) {
        const g = poseAt(MOVES.block, 0.4, 1, out);
        for (const k2 of CHANNELS) out[k2] += (g[k2] - out[k2]) * st.blGuard;
      }
      // Beaten: it slumps as it falls.
      if (m.hp <= 0) {
        st.blDeadAt ??= a.now;
        const w = Math.min(1, (a.now - st.blDeadAt) / 0.3);
        for (const [k2, v] of Object.entries(DEAD)) out[k2] += (v - out[k2]) * w;
      } else st.blDeadAt = undefined;
      // Set poses, for sheets and checks.
      const lay = (pose) => {
        for (const [k2, v] of Object.entries(pose)) out[k2] = v;
      };
      const hv = hover / H;
      if (m.pose === 'tpose') lay({ x: 0, lift: hv, hop: 0, drop: 0, tilt: 0, pelvis: 0, waist: 0, head: 0, shF: 90, elF: 0, shN: -90, elN: 0, fxN: 0, fxF: 0, fyN: 0, fyF: 0, toeN: 0, toeF: 0, wing: 0, wisp: 0 });
      else if (m.pose === 'wave') lay({ x: 0, lift: (breath * 0.2 * sz + hover) / H, hop: 0, tilt: -3, pelvis: 2, waist: -3, head: -4, shF: 6, elF: 8, shN: -84, elN: -72 + Math.sin(t * 8) * 14, fxN: 0, fxF: 0, wing: 4 + Math.sin(t * 2) * 3 });
      else if (m.pose === 'crouch') {
        if (spirit) lay({ x: (-0.4 * sz) / H, lift: (hover - 1.6 * sz) / H, hop: 0, tilt: 9, head: -7, shF: 20, elF: 40, shN: -26, elN: -56, wisp: 26 });
        else lay({ x: (-0.6 * sz) / H, lift: (-leg * 0.16) / H, hop: 0, tilt: 7, head: -6, shF: 16, elF: 30, shN: -30, elN: -50, fxN: (1.4 * sz) / leg, fxF: (-0.7 * sz) / leg, wing: 12 });
      } else if (m.pose === 'fly') {
        // Up off the ground, flapping: the body rises on each downstroke, the feet hang, toes down.
        const fl = Math.sin(t * 7);
        lay({ x: 0, lift: 0, hop: ((5 + Math.sin(t * 7 - 1.2) * 0.8) * sz) / H, tilt: 4, pelvis: -4, waist: Math.sin(t * 7 - 0.6) * 3, head: -3, shF: 22, elF: 20, shN: -22, elN: -20, fxN: (0.6 * sz) / leg, fxF: (-0.3 * sz) / leg, fyN: (0.8 * sz) / leg, toeN: 26, toeF: 22, wing: 4 + fl * 28 });
      }
      // Back to game pixels. (A serpent can't leave the ground: a jump rears it up instead; a fall coils
      // it lower. A spirit sinks only so far.)
      const res = {};
      for (const k2 of CHANNELS) res[k2] = out[k2] ?? 0;
      res.x = out.x * H;
      res.hop = out.hop * H;
      res.lift = out.lift * H - out.drop * leg * (serpent ? 0.3 : spirit ? 0.5 : horse ? 0.55 : 1);
      // (Rearing pitches the barrel up about its hind legs: the front rises with it.)
      if (horse) res.lift += Dh * Math.sin(clamp(out.pitch ?? 0, -40, 60) * D2R);
      if (serpent) {
        // (Its body can't leave its tail: it rears back instead, the tail lifting with it.)
        res.lift = Math.min(res.lift, H * 0.03) + Math.min(res.hop * 0.15, H * 0.02);
        res.tilt -= (res.hop / H) * 22;
        res.tailW += (res.hop / H) * 1.3;
        res.hop = 0;
      }
      for (const k2 of ['fxN', 'fyN', 'fxF', 'fyF']) res[k2] = out[k2] * leg;
      delete res.drop;
      res.elN = clamp(res.elN, -150, 150);
      res.elF = clamp(res.elF, -150, 150);
      // The shoulders and the chest follow the arms, in every pose and move: an arm raised past the
      // shoulder lifts its collarbone; an arm reaching ahead brings its shoulder forward and turns
      // the chest into it (an arm drawn back, back and away), the hips turning a little against
      // the chest; so a punch is thrown from the shoulder and the body, not the whole figure.
      {
        const raise = (v) => {
          const u = clamp((Math.abs(v) - 55) / 125, 0, 1);
          return u * u * (3 - 2 * u);
        };
        res.shrugN += 16 * raise(res.shN);
        res.shrugF += 16 * raise(res.shF);
        const ext = (el) => 1 - Math.min(1, Math.abs(el) / 130);
        const fwdN = Math.max(0, -Math.sin(res.shN * D2R)) * (0.4 + 0.6 * ext(res.elN));
        const backN = Math.max(0, Math.sin(res.shN * D2R));
        const fwdF = Math.max(0, -Math.sin(res.shF * D2R)) * (0.4 + 0.6 * ext(res.elF));
        const set = m.pose === 'tpose' || m.pose === 'wave';
        if (!set) {
          res.reachN += H * (0.034 * fwdN - 0.022 * backN);
          res.reachF += H * 0.026 * fwdF;
        }
        // (Not in a set pose: a T-pose's arm out to the side isn't reaching anywhere.)
        const turn = set ? 0 : 0.42 * fwdN - 0.34 * backN - 0.2 * fwdF;
        res.turnC = clamp(res.turnC + turn, -0.85, 0.85);
        res.turnP = clamp(res.turnP - turn * 0.35, -0.6, 0.6);
        // (A hand holding a weapon keeps it square in the fist.)
        if (a.blWeaponHeld) res.hwN = 0;
      }
      // Follow-through, from how fast each part was moving last frame: a hand trails its arm's swing
      // at the wrist and snaps through after it; the neck and head trail the chest's turn a beat;
      // the chest trails the hips when they lunge or pull back; so a move flows out through the body
      // and settles, never all of it at once.
      {
        const vel = (n) => st[n]?.v ?? 0;
        if (!a.blWeaponHeld) res.hwN += clamp(-(vel('shN') + vel('elN')) * 0.02, -20, 20);
        res.hwF += clamp(-(vel('shF') + vel('elF')) * 0.02, -20, 20);
        const chestV = vel('tilt') * 0.4 + vel('pelvis') + vel('waist') * 0.45 + vel('chest');
        res.neckR += clamp(-chestV * 0.012, -6, 6);
        res.head += clamp(-chestV * 0.02, -9, 9);
        res.waist += clamp((-vel('x') / H) * 5, -5, 5);
      }
      // (A weapon never digs into the ground: where its tip would go under, it turns up just enough.)
      if (weaponNow && !(mv && mv.ground === false)) res.wa = aboveGround(res, weaponNow, isBow(weaponNow) && mv && inWindow(mv.drawn, mt));
      // (The weapon's angle kept within a turn of the last, so it never spins the long way round.)
      res.wa = st.blWa == null ? res.wa : res.wa + 360 * Math.round((st.blWa - res.wa) / 360);
      st.blWa = res.wa;
      // For the parts and effects: the move, its time, the weapon in hand.
      st.blActive = Boolean(mv);
      const shown = isBow(weaponNow) && mv && inWindow(mv.drawn, mt) ? 'bowDrawn' : weaponNow;
      a.blWeapon = weaponNow === 'ball' && mv?.ball && !inWindow(mv.ball, mt) ? null : shown;
      a.blMove = mv ? { mv, t: mt } : null;
      return res;
    },
    // (Each frame the bones are placed first, so the skin can follow them.)
    under: (ctx, m, a, S, matOf) => {
      a.blMat = matOf;
      a.ryuK = K;
      opts.under?.(ctx, m, a, S, matOf, K, H);
      if (horse) horseUnder(S, a, matOf);
    },
    // The spine, the collarbones and neck as the base's; his pieces on its bones, his skin under them.
    parts: skinPasses([
      K.layer('torso', { joint: true, pivot: 'hip', at: (S) => [rel('hip')[0] + S.x, rel('hip')[1] - S.lift - (S.hop ?? 0)], rot: (S) => rootAng(S) * D2R }),
      K.layer('waistB', { joint: true, parent: 'torso', pivot: 'navel', from: 'hip', rot: (S) => waistRel(S) * D2R }),
      K.layer('chest', { joint: true, parent: 'waistB', pivot: 'ribs', rot: (S) => chestRel(S) * D2R }),
      K.layer('claF', { joint: true, parent: 'chest', pivot: 'stern', from: 'ribs', at: (S) => [rel('stern', 'ribs')[0] + (S.reachF ?? 0), rel('stern', 'ribs')[1]], rot: (S) => (S.shrugF ?? 0) * D2R }),
      K.layer('claN', { joint: true, parent: 'chest', pivot: 'stern', from: 'ribs', at: (S) => [rel('stern', 'ribs')[0] + (S.reachN ?? 0), rel('stern', 'ribs')[1]], rot: (S) => -(S.shrugN ?? 0) * D2R }),
      K.layer('neckB', { joint: true, parent: 'chest', pivot: 'stern', from: 'ribs', rot: (S) => (S.neckR ?? 0) * D2R }),
      // (behind everything: the foil lid standing up from his back; his long hair, riding his head:
      // listed before the head, so each names its joint)
      D('lid', { parent: 'chest', pivot: 'napeJ', from: 'ribs', soft: { ...SOFT.CLOTH, k: 70, max: 6, gain: 0.35 } }),
      D('hairLocks', { parent: 'headJ', pivot: 'locksJ', from: 'neck', soft: { ...SOFT.HAIR, k: 50, max: 12, gain: 0.8, hang: 0.7, flutter: 1.5 } }),
      D('hairB', { parent: 'headJ', pivot: 'neck', from: 'neck', soft: { ...SOFT.HAIR, max: 7, gain: 0.5, hang: 0.4 } }),
      // The far arm (behind the body): the skin, the cap sleeve, the wristband; a chopstick in its hand.
      K.layer('armFu', { joint: true, parent: 'claF', pivot: 'shF', from: 'stern', rot: (S) => (S.shF - (S.shrugF ?? 0)) * D2R }),
      K.layer('armFf', { joint: true, parent: 'armFu', pivot: 'elF', rot: (S) => S.elF * D2R }),
      K.layer('handF', { joint: true, parent: 'armFf', pivot: 'wrF', rot: (S) => (S.hwF ?? 0) * D2R }),
      live('sticksF', (ctx, a, mode, S) => sticksLive(ctx, a, mode, S, 'F')),
      live('armF', (ctx, a, mode, S) => skin.arm(ctx, a, mode, S, 'F')),
      live('handFskin', (ctx, a, mode, S) => skin.hand(ctx, a, mode, S, 'F')),
      D('cuffF', { parent: 'armFf', pivot: 'elF', from: 'elF' }),
      D('sleeveFu', { parent: 'armFu', pivot: 'shF', from: 'shF' }),
      // (the tail's bones: joints only; his noodle tail drawn live along them)
      K.layer('tailC', { joint: true, parent: 'tailB', pivot: 'serp2', from: 'serp1', rot: (S, a) => segs(S, a)[2] }),
      K.layer('tailB', { joint: true, parent: 'tailA', pivot: 'serp1', from: 'serp0', rot: (S, a) => segs(S, a)[1] }),
      K.layer('tailA', { joint: true, pivot: 'serp0', rot: (S, a) => segs(S, a)[0] }),
      K.layer('lower', { joint: true, pivot: 'serp0', rot: (S) => Math.asin(clamp(S.x / hgt, -0.4, 0.4)) }),
      live('noodleTail', (ctx, a, mode, S) => tailLive(ctx, a, mode, S)),
      live('torsoSkin', (ctx, a, mode, S) => skin.torso(ctx, a, mode, S)),
      // The cup round his waist, the noodles spilling over its rim on a spring.
      D('cup', { parent: 'torso', pivot: 'hip', from: 'hip' }),
      D('spill', { parent: 'torso', pivot: 'cupJ', from: 'hip', soft: { ...SOFT.HAIR, k: 80, max: 10, gain: 0.6, hang: 0.5 } }),
      // His tee; the neck; the scarf, its ends flicking on a spring.
      D('top', { parent: 'chest', pivot: 'ribs', from: 'ribs' }),
      live('neckSkin', (ctx, a, mode, S) => skin.neck(ctx, a, mode, S)),
      D('scarfEnd', { parent: 'chest', pivot: 'knotJ', from: 'ribs', soft: { ...SOFT.CLOTH, k: 60, max: 16, gain: 0.8, flutter: 2 } }),
      D('scarf', { parent: 'chest', pivot: 'ribs', from: 'ribs' }),
      // His head: the face of the moment; the bun on top on a spring, the chopsticks in it (while
      // they're not in his hands); a noodle lock by each cheek on a spring; his whiskers, live.
      K.layer('headJ', { joint: true, parent: 'neckB', pivot: 'neck', from: 'stern', rot: (S) => S.head * D2R }),
      D('bun', { parent: 'headJ', pivot: 'bunJ', from: 'neck', soft: { ...SOFT.HAIR, k: 120, max: 8, gain: 0.5 } }),
      { ...D('sticks', { parent: 'bun', pivot: 'bunJ', from: 'bunJ' }), when: (a) => !a.ryuSticks },
      { ...K.layer('head', { parent: 'headJ', pivot: 'neck', from: 'neck' }), s: (a, S, bare) => K.piece('head', a.ryuFace ?? K.faceOf(a), bare) },
      D('lockF', { parent: 'headJ', pivot: 'lockFJ', from: 'neck', soft: { ...SOFT.HAIR, max: 14, gain: 0.8, hang: 0.6 } }),
      D('lockN', { parent: 'headJ', pivot: 'lockNJ', from: 'neck', soft: { ...SOFT.HAIR, max: 14, gain: 0.8, hang: 0.6 } }),
      live('whiskers', (ctx, a, mode, S) => whiskersLive(ctx, a, mode, S)),
      // The near arm (in front): the skin, the cap sleeve, the wristband; the chopsticks in its hand.
      K.layer('armNu', { joint: true, parent: 'claN', pivot: 'shN', from: 'stern', rot: (S) => (S.shN + (S.shrugN ?? 0)) * D2R }),
      K.layer('armNf', { joint: true, parent: 'armNu', pivot: 'elN', rot: (S) => S.elN * D2R }),
      live('armN', (ctx, a, mode, S) => skin.arm(ctx, a, mode, S, 'N')),
      D('sleeveNu', { parent: 'armNu', pivot: 'shN', from: 'shN' }),
      D('cuffN', { parent: 'armNf', pivot: 'elN', from: 'elN' }),
      K.layer('handN', { joint: true, parent: 'armNf', pivot: 'wrN', rot: (S) => (S.hwN ?? 0) * D2R }),
      live('sticksN', (ctx, a, mode, S) => sticksLive(ctx, a, mode, S, 'N')),
      live('handNskin', (ctx, a, mode, S) => skin.hand(ctx, a, mode, S, 'N')),
    ]),
    fx: (ctx, m, a, S, matOf) => {
      drawFx(ctx, m, a, S, matOf);
      opts.fx?.(ctx, m, a, S, matOf, K, H);
    },
  });

  // ---------- Effects ----------
  // A point of a part's drawing (kid-box units), where it is now in the rig's space.
  const at = (M, [x, y], pivot) => {
    const lx = (x - J[pivot][0]) * SC;
    const ly = (y - J[pivot][1]) * SC;
    return [M[0] * lx + M[2] * ly + M[4], M[1] * lx + M[3] * ly + M[5]];
  };
  const wpt = (a, matOf, pt, w = weapon(a.blWeapon ?? 'sword')) => {
    const M = matOf('weapon');
    const [px, py] = inSprite(w, [0, 0], SC);
    const [sx, sy] = inSprite(w, pt, SC);
    return [M[0] * (sx - px) + M[2] * (sy - py) + M[4], M[1] * (sx - px) + M[3] * (sy - py) + M[5]];
  };
  // Where a trail, a sparkle or a puff comes from: [the point, a second point back along it].
  const source = (src, a, matOf) => {
    const w = a.blWeapon ? weapon(a.blWeapon) : null;
    if ((src === 'weapon' || src === 'tip') && w) return [wpt(a, matOf, w.tip), wpt(a, matOf, w.mid)];
    if (src === 'foot' && legs) {
      const M = matOf('footN');
      return [at(M, J.toeN, 'ankN'), at(M, J.ankN, 'ankN')];
    }
    if (src === 'tail' && serpent) {
      const M = matOf('tailC');
      return [at(M, J.tailTip, 'serp2'), at(M, J.serp2, 'serp2')];
    }
    if (src === 'wisp' && spirit) {
      const M = matOf('lower');
      return [at(M, J.wispTip, 'lower'), at(M, J.lower, 'lower')];
    }
    const M = matOf('handN');
    return [at(M, J.handN, 'wrN'), at(M, J.wrN, 'wrN')];
  };
  const star = (ctx, x, y, s, rot, fill) => {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const rr = i % 2 ? s * 0.32 : s;
      const an = rot + (i * Math.PI) / 4;
      ctx.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const puff = (ctx, x, y, rr, alpha) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#f3eefa';
    ctx.strokeStyle = '#d6cbe6';
    ctx.lineWidth = Math.max(0.4, rr * 0.12);
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, TAU);
    ctx.fill();
    ctx.stroke();
  };
  const glowBall = (ctx, x, y, rr) => {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, rr);
    gr.addColorStop(0, 'rgba(255,255,255,0.95)');
    gr.addColorStop(0.45, 'rgba(226,206,255,0.75)');
    gr.addColorStop(1, 'rgba(200,170,255,0)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, TAU);
    ctx.fill();
  };
  // A sprite drawn about a point of it, turned.
  const stamp = (ctx, s, px, py, x, y, rot, alpha) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    blit(ctx, s, -px, -py, { alpha });
    ctx.restore();
  };

  function drawFx(ctx, m, a, S, matOf) {
    const st = a.mo.rig;
    const mv = a.blMove?.mv;
    const t = a.blMove?.t ?? 0;
    // A swing's trail: the path its edge (or fist, foot, tail, wisp) swept these last moments.
    const TR = 0.14;
    const trail = (st.blTrail ??= []);
    const win = mv?.trail?.find((w) => t >= w[0] && t <= w[1]);
    if (win) {
      const [p0, p1] = source(win[2], a, matOf);
      // (A weapon's swing is drawn round the shoulder it turns from, so it curves as the swing does.)
      const Ms = matOf('armNu');
      trail.push({ at: a.now, p0, p1, kind: win[2], c: [Ms[4], Ms[5]] });
      if (trail.length > 30) trail.shift();
    }
    while (trail.length && (a.now - trail[0].at > TR || a.now < trail[0].at)) trail.shift();
    if (trail.length > 1) {
      ctx.save();
      for (let i = 1; i < trail.length; i++) {
        const A = trail[i - 1];
        const Bq = trail[i];
        const k = 1 - (a.now - A.at) / TR;
        if (k <= 0 || A.kind !== Bq.kind) continue;
        if (A.kind === 'weapon') {
          // A crescent between the paths of the tip and the middle of the blade, swept round the
          // shoulder from one moment to the next (a fast swing covers a wide arc in a frame), the
          // tip's edge lit.
          const [cx0, cy0] = Bq.c;
          const pol = ([x, y]) => [Math.atan2(y - cy0, x - cx0), Math.hypot(x - cx0, y - cy0)];
          const [a0, r0] = pol(A.p0);
          let [a1, r1] = pol(Bq.p0);
          const [b0, q0] = pol(A.p1);
          let [b1, q1] = pol(Bq.p1);
          a1 = a0 + Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0));
          b1 = b0 + Math.atan2(Math.sin(b1 - b0), Math.cos(b1 - b0));
          const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 0.12));
          const outer = [];
          const inner = [];
          for (let j = 0; j <= n; j++) {
            const u = j / n;
            const ao = a0 + (a1 - a0) * u;
            const ro = r0 + (r1 - r0) * u;
            const ai = b0 + (b1 - b0) * u;
            const ri = q0 + (q1 - q0) * u;
            outer.push([cx0 + Math.cos(ao) * ro, cy0 + Math.sin(ao) * ro]);
            inner.push([cx0 + Math.cos(ai) * ri, cy0 + Math.sin(ai) * ri]);
          }
          const k1 = 1 - (a.now - Bq.at) / TR;
          ctx.globalAlpha = 0.5 * (k + k1) * 0.5;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          outer.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          for (let j = inner.length - 1; j >= 0; j--) ctx.lineTo(inner[j][0], inner[j][1]);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 0.9 * (k + k1) * 0.5;
          ctx.strokeStyle = '#efe6ff';
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = Math.max(0.5, H * 0.016);
          ctx.beginPath();
          outer.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.stroke();
        } else {
          ctx.globalAlpha = 0.55 * k;
          ctx.strokeStyle = '#ffffff';
          ctx.lineCap = 'round';
          ctx.lineWidth = Math.max(0.6, H * 0.07 * k);
          ctx.beginPath();
          ctx.moveTo(A.p0[0], A.p0[1]);
          ctx.lineTo(Bq.p0[0], Bq.p0[1]);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    if (!mv) {
      st.blShot = null;
      st.blThrow = null;
      return;
    }
    ctx.save();
    // Magic gathering: a soft glow at the staff's crystal (or at the hands), pulsing, with sparkles
    // circling in.
    if (mv.glow && inWindow(mv.glow, t)) {
      const k = Math.max(0, Math.min(1, (t - mv.glow[0]) / 0.15, (mv.glow[1] - t) / 0.1));
      const [[gx0, gy]] = source(mv.glow[2] === 'tip' ? 'tip' : 'fist', a, matOf);
      const gx = gx0 + (mv.glow[2] === 'hand' ? H * 0.05 : 0);
      const rr = H * 0.11 * (1 + 0.12 * Math.sin(a.now * 24));
      ctx.globalAlpha = k;
      glowBall(ctx, gx, gy, rr);
      for (let i = 0; i < 3; i++) {
        const an = a.now * 5 + (i * TAU) / 3;
        const d = rr * (1.5 - ((a.now * 1.5 + i / 3) % 1) * 0.9);
        star(ctx, gx + Math.cos(an) * d, gy + Math.sin(an) * d, H * 0.024, an, '#fff6c8');
      }
    }
    // A spell going off: a flash and a ring of sparkles opening out, and an orb of light flying on.
    if (mv.burst) {
      const bp = since([mv.burst[0]], t, 0.4);
      const op = since([mv.burst[0]], t, 0.45);
      if (op >= 0 && !st.blOrb) st.blOrb = source(mv.burst[1] === 'tip' ? 'tip' : 'fist', a, matOf)[0];
      if (op < 0) st.blOrb = null;
      if (bp >= 0 && st.blOrb) {
        const [bx, by] = st.blOrb;
        const e = 1 - (1 - bp) ** 3;
        ctx.globalAlpha = 1 - bp;
        glowBall(ctx, bx, by, H * 0.14 * (1 - bp * 0.5));
        for (let i = 0; i < 8; i++) {
          const an = (i * TAU) / 8 + 0.3;
          star(ctx, bx + Math.cos(an) * H * 0.24 * e, by + Math.sin(an) * H * 0.24 * e, H * 0.04 * (1 - bp * 0.5), an, i % 2 ? '#e8d8ff' : '#fff2b8');
        }
      }
      if (op >= 0 && st.blOrb && mv !== MOVES.palm) {
        const [bx, by] = st.blOrb;
        const ox = bx + H * 2.4 * op;
        ctx.globalAlpha = Math.min(1, (1 - op) * 3);
        glowBall(ctx, ox, by, H * 0.1);
        for (let i = 1; i < 4; i++) star(ctx, ox - i * H * 0.08, by + Math.sin(a.now * 30 + i) * H * 0.02, H * 0.028 * (1 - i * 0.2), a.now * 8 + i, '#fff6c8');
      }
    }
    // Hit sparkles: a four-point star and a few little ones flying out.
    for (const s0 of mv.spark ?? []) {
      const sp = since([s0], t, 0.22);
      if (sp < 0) continue;
      const src = mv.sparkAt ?? mv.trail?.find((w) => s0 >= w[0] - 0.02 && s0 <= w[1] + 0.02)?.[2] ?? (a.blWeapon ? 'weapon' : 'fist');
      const [[sx, sy]] = source(src, a, matOf);
      const e = 1 - (1 - sp) ** 3;
      ctx.globalAlpha = 1 - sp;
      star(ctx, sx, sy, H * 0.1 * (0.5 + 0.7 * e), sp * 0.8, '#ffffff');
      star(ctx, sx, sy, H * 0.05 * (0.5 + 0.7 * e), sp * 0.8 + 0.4, '#fff2a8');
      for (let i = 0; i < 4; i++) {
        const an = (i * TAU) / 4 + 0.6;
        star(ctx, sx + Math.cos(an) * H * 0.14 * e, sy + Math.sin(an) * H * 0.14 * e, H * 0.025, an, i % 2 ? '#ffc8de' : '#fff6c8');
      }
    }
    // A gun's muzzle flash and a puff of smoke.
    const held = a.blWeapon ? weapon(a.blWeapon) : null;
    for (const f0 of mv.flash ?? []) {
      const fp = since([f0], t, 0.08);
      const sm = since([f0], t, 0.5);
      if (sm < 0 || !held?.muzzle) continue;
      const [mx, my] = wpt(a, matOf, held.muzzle);
      const [qx, qy] = wpt(a, matOf, [held.muzzle[0], held.muzzle[1] + 1]);
      const dl = Math.hypot(qx - mx, qy - my) || 1;
      const ux = (qx - mx) / dl;
      const uy = (qy - my) / dl;
      if (fp >= 0) {
        const L = H * 0.17 * (1 - fp * 0.6);
        ctx.globalAlpha = 1 - fp;
        ctx.fillStyle = '#fff3b0';
        ctx.beginPath();
        ctx.moveTo(mx - uy * L * 0.35, my + ux * L * 0.35);
        ctx.lineTo(mx + ux * L, my + uy * L);
        ctx.lineTo(mx + uy * L * 0.35, my - ux * L * 0.35);
        ctx.closePath();
        ctx.fill();
        star(ctx, mx + ux * L * 0.25, my + uy * L * 0.25, L * 0.45, fp, '#ffffff');
      }
      puff(ctx, mx + ux * H * 0.04 + H * 0.03 * sm, my - H * 0.12 * sm, H * 0.035 * (0.6 + sm), 0.5 * (1 - sm));
    }
    // The shot leaving: an arrow flying on, or a bullet's streak; where from and which way fixed at
    // the moment it left.
    for (const s0 of mv.shot ?? []) {
      const bowShot = isBow(a.blWeapon);
      const sp = since([s0], t, bowShot ? 0.42 : 0.14);
      const id = `${s0}`;
      if (sp < 0) {
        if (st.blShot?.id === id) st.blShot = null;
        continue;
      }
      if (st.blShot?.id !== id) {
        const from = bowShot ? wpt(a, matOf, [0, 0]) : wpt(a, matOf, held?.muzzle ?? held?.tip ?? [0, 0]);
        const M = matOf('armNf');
        const dl = Math.hypot(M[2], M[3]) || 1;
        st.blShot = { id, from, dir: [M[2] / dl, M[3] / dl] };
      }
      const { from, dir } = st.blShot;
      if (bowShot) {
        const d = H * 2.6 * sp;
        const ar = weapon('arrow');
        const [px, py] = inSprite(ar, [0, 0], SC);
        stamp(ctx, weaponSprite(`${kind}|arrow`, ar, SC, false), px, py, from[0] + dir[0] * d, from[1] + dir[1] * d, Math.atan2(dir[1], dir[0]) - Math.PI / 2, Math.min(1, (1 - sp) * 4));
      } else {
        const d = H * 3.2 * sp;
        const tl = H * 0.35;
        ctx.globalAlpha = 1 - sp * 0.6;
        ctx.strokeStyle = '#fff6cc';
        ctx.lineCap = 'round';
        ctx.lineWidth = Math.max(0.6, H * 0.024);
        ctx.beginPath();
        ctx.moveTo(from[0] + dir[0] * Math.max(0, d - tl), from[1] + dir[1] * Math.max(0, d - tl));
        ctx.lineTo(from[0] + dir[0] * d, from[1] + dir[1] * d);
        ctx.stroke();
      }
    }
    // The thrown ball, in an arc ahead, spinning.
    for (const s0 of mv.throwAt ?? []) {
      const sp = since([s0], t, 0.5);
      if (sp < 0) {
        st.blThrow = null;
        continue;
      }
      st.blThrow ??= source('fist', a, matOf)[0];
      const from = st.blThrow;
      const bw = weapon('ball');
      const [px, py] = inSprite(bw, bw.tip, SC);
      stamp(ctx, weaponSprite(`${kind}|ball`, bw, SC, false), px, py, from[0] + H * 2.2 * sp, from[1] - H * 0.3 * Math.sin(Math.PI * sp) + H * 0.25 * sp * sp, sp * 9, Math.min(1, (1 - sp) * 4));
    }
    // Dust where something lands: soft round puffs rolling out along the ground.
    for (const [d0, where] of mv.dust ?? []) {
      const dp = since([d0], t, 0.45);
      if (dp < 0) continue;
      let gx = S.x * 0.5;
      if (where === 'tip' && held) gx = wpt(a, matOf, held.tip)[0];
      else if (where === 'foot' || where === 'tail') gx = source(where, a, matOf)[0][0];
      else if (where === 'hips') gx = S.x;
      else if (where === 'front' && a.blHorse) gx = (a.blHorse.legs.foreN.P[0] + a.blHorse.legs.foreF.P[0]) / 2;
      const e = 1 - (1 - dp) ** 2;
      for (const s2 of [-1, 1]) {
        for (let i = 0; i < 2; i++) {
          const rr = H * (0.05 - i * 0.012) * (0.6 + e * 0.8);
          puff(ctx, gx + s2 * H * (0.06 + i * 0.07) * (0.4 + e), -rr * 0.7 - H * 0.02 * e, rr, 0.75 * (1 - dp));
        }
      }
    }
    // Speed lines behind a dash.
    if (mv.lines && inWindow(mv.lines, t)) {
      const k = Math.max(0, Math.min(1, (t - mv.lines[0]) / 0.05, (mv.lines[1] - t) / 0.1));
      ctx.globalAlpha = 0.75 * k;
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(0.5, H * 0.02);
      for (let i = 0; i < 4; i++) {
        const y = -H * (0.22 + i * 0.17);
        const x0 = S.x - H * (0.24 + ((t * 3 + i * 0.37) % 1) * 0.25);
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x0 - H * (0.22 + (i % 2) * 0.1), y);
        ctx.stroke();
      }
    }
    // A gust from the wings: arcs of wind rolling ahead.
    for (const g0 of mv.gust ?? []) {
      const gp = since([g0], t, 0.45);
      if (gp < 0) continue;
      ctx.globalAlpha = 0.8 * (1 - gp);
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(0.5, H * 0.022);
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(S.x + H * (0.3 + gp * 0.9 + i * 0.08), -H * (0.35 + (i - 1) * 0.2), H * 0.12, -0.9, 0.9);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  return { rig, still: K.still, stride, speed: walkSpeed, h: Math.round(K.BH * 0.86), w: Math.round(K.BW * 0.5), H };
}
