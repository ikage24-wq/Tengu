// The Blossom Fairy on screen (2026-11-26, the Whispering Glade's Blossom Fairy remade from scratch to
// the new standard, keeping her idea). A tanuki in disguise as a tiny prankster flower fairy: two big
// buns with rosebuds, butterfly-petal wings, a bellflower skirt, a blossom wand; her tail tucked under
// her skirt (a pink bow on it), and wings that are really two leaves. Her look is in art.js; she moves
// on her own copy of the kid base's rig (kidrig.js: its bones and springs; the base's own moves left
// out), every loose piece on the engine's own soft-layer springs (four wings, five skirt petals and
// the ones behind, two sepals at her neck, her two long tails of hair, the wand, her tail).
//   flying  she always flies (the game counts a flyer as always moving; her motion goes by her own
//           travel): a hover on a light bounce, legs dangling with toes pointed, wings beating;
//           moving, she leans into it, her legs trail, her hair and petals stream and a trail of
//           sparkles comes off her wings.
//   idle    her act, in four pieces, the next one that fits the time she has before she moves on
//           (data: `rest`; world/mobs.js tells her, `m.restUntil`):
//           - bloom (7.2 s): a twirl of her wand, a tap on the air, and a flower blooms there; she
//             leans in to smell it; it bursts into petals that swirl round her; a happy clap;
//           - twirl (6.6 s): a pirouette in the air (two clean mirror flips), a curtsey, a wink;
//           - slip (8.4 s): a big yawn and a stretch... her wings droop and turn back into leaves;
//             she drops, flaps them frantically, her tail pops out; a tap of the wand on her own
//             head, sparkles, wings again, the tail tucked away; a look round, and "shh";
//           - giggles (6.4 s): a puff of pollen blown off her wand's blossom, and a fit of giggles, kicking.
//   moves   Petal Flurry (the wand hauled back over her head, then swished: a fan of petals at
//           you); Pollen Bomb (a glowing ball of pollen swelling on her wand, then lobbed: it bursts
//           in a golden cloud); Wing Gust (she curls up, wings high, then beats them at you: a
//           swirling gust of air and petals).
//   else    hurt: a squeezed wince, a flinch, her wings jolted shut a moment; after
//           landing a hit: a teasing "bleh"; hunting you: a smirk, the wand ready; low on health:
//           worried, a bead of sweat; a nap: curled up in the air, hugging her knees, wings folded,
//           her tail slipping out; beaten: she goes up in smoke and leaves her leaf (the game's own
//           leafPoof). Her marks over her head (!, ?, z's, sweat) are her own (`ownEmotes`).
// Every effect is drawn here, live, in her own soft style: petals with a soft rose line and a notch,
// the game's curvy sparkle stars, pollen as soft golden puffs, gusts as soft swirling strokes.
import { dressRig } from './kidrig.js';
import {
  TAU, D2R, clamp, lerp, sstep, win, boing, ell, tone, rgba, paint, glow, smoothPath, drawShapes,
  SKIN, HAIR, ROSE, LEAF, GOLD, HAIR_INK, ROSE_INK,
  HS, HX, HY, hk, faceShapes, hairBack, hairFront, sideLock, fairyEar, bun, hairTail, wing, bodice, sepal, bellShape, skirtPetal, puff, slipper, tailShape, wand, GRIP, BLOOM, WING_ROOT,
} from './art.js';

const SC = 1 / 3;
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ---------- Her loose pieces, on the engine's soft springs ----------
const PETALS = [0, 1, 2, 3, 4].map((k) => ({ r: [63.4 + k * 8.3, 104.6], ang: (2 - k) * 0.3, len: 19 - Math.abs(k - 2) * 1.2, wd: 11.4 }));
const JOINTS = {
  wroot: WING_ROOT, wand: GRIP, tailJ: [77, 108], sepF: [75, 87], sepN: [86, 87], backP: [80, 104],
  hairF: hk([-17, -54]), hairN: hk([18, -55]), hairF2: hk([-17, -4]), hairN2: hk([18, -5]), lockF: hk([-34.4, -16]), lockN: hk([35.2, -16]),
  ...Object.fromEntries(PETALS.map((p, k) => [`petal${k}`, p.r])),
};
const chestAng = (S) => (S.tilt ?? 0) + (S.pelvis ?? 0) + (S.waist ?? 0) + (S.chest ?? 0);
const SOFTS = [
  { name: 'wingL', parent: 'chest', pivot: 'wroot', soft: { k: 120, c: 7, gain: 0.35, turn: 0.6, max: 10, dir: [-8, -2] } },
  { name: 'wingR', parent: 'chest', pivot: 'wroot', soft: { k: 132, c: 7, gain: 0.35, turn: 0.6, max: 10, dir: [8, -2] } },
  ...PETALS.map((p, k) => ({ name: `petal${k}`, parent: 'waistB', pivot: `petal${k}`, rot: (S, a) => (a.bf?.petalRot?.[k] ?? 0), soft: { k: 105 + k * 9, c: 5.4, gain: 0.45, turn: 0.85, hang: 0.4, max: 18, flutter: 2.5, hz: 0.7 + k * 0.07, dir: [Math.sin(-p.ang) * 6, 6] } })),
  { name: 'backP', parent: 'torso', pivot: 'backP', soft: { k: 95, c: 6, gain: 0.5, turn: 0.85, hang: 0.4, max: 14, dir: [0, 6] } },
  { name: 'sepF', parent: 'chest', pivot: 'sepF', soft: { k: 170, c: 6, gain: 0.25, turn: 0.7, max: 16, dir: [-1, 1.5] } },
  { name: 'sepN', parent: 'chest', pivot: 'sepN', soft: { k: 185, c: 6, gain: 0.25, turn: 0.7, max: 16, dir: [1, 1.5] } },
  { name: 'hairF', parent: 'head', pivot: 'hairF', soft: { k: 62, c: 5.4, gain: 0.55, turn: 0.95, hang: 0.6, max: 18, flutter: 2, hz: 0.45, dir: [0, 8] } },
  { name: 'hairN', parent: 'head', pivot: 'hairN', soft: { k: 70, c: 5.4, gain: 0.55, turn: 0.95, hang: 0.6, max: 18, flutter: 2, hz: 0.52, dir: [0, 8] } },
  { name: 'hairF2', parent: 'hairF', pivot: 'hairF2', soft: { k: 80, c: 5.6, gain: 0.5, turn: 0.9, hang: 0.5, max: 16, flutter: 2, hz: 0.6, dir: [0, 7] } },
  { name: 'hairN2', parent: 'hairN', pivot: 'hairN2', soft: { k: 88, c: 5.6, gain: 0.5, turn: 0.9, hang: 0.5, max: 16, flutter: 2, hz: 0.66, dir: [0, 7] } },
  { name: 'lockF', parent: 'head', pivot: 'lockF', soft: { k: 92, c: 6, gain: 0.5, turn: 0.9, hang: 0.4, max: 10, flutter: 1.5, hz: 0.47, dir: [0, 6] } },
  { name: 'lockN', parent: 'head', pivot: 'lockN', soft: { k: 100, c: 6, gain: 0.5, turn: 0.9, hang: 0.4, max: 10, flutter: 1.5, hz: 0.53, dir: [0, 6] } },
  { name: 'wandJ', parent: 'handN', pivot: 'wand', rot: (S, a) => (a.bf?.wandR ?? 0) - (chestAng(S) + S.shN + S.elN + (S.hwN ?? 0)) * D2R, soft: { k: 120, c: 7.5, gain: 0.2, turn: 0.3, max: 12, dir: [0, -11] } },
  { name: 'tailJ', parent: 'torso', pivot: 'tailJ', rot: (S, a) => (a.bf?.tailRot ?? 0), soft: { k: 58, c: 5, gain: 0.5, turn: 0.8, max: 16, flutter: 3, hz: 0.55, dir: [-6, 3] } },
];
const SOFT_NAMES = SOFTS.map((p) => p.name);
const PIVOT = { chest: 'ribs', waistB: 'navel', torso: 'hip', head: 'neck', armFu: 'shF', armFf: 'elF', armNu: 'shN', armNf: 'elN', handF: 'wrF', handN: 'wrN', shinF: 'kneeF', shinN: 'kneeN', footF: 'ankF', footN: 'ankN', ...Object.fromEntries(SOFTS.map((p) => [p.name, p.pivot])) };
function enter(ctx, a, D, bone) {
  ctx.transform(...a.blMat(bone));
  const p = D.J[PIVOT[bone]];
  ctx.translate(-p[0] * SC, -p[1] * SC);
  ctx.scale(SC, SC);
}
function headFrame(ctx, a, D) {
  enter(ctx, a, D, 'head');
  ctx.translate(HX, HY);
  ctx.scale(HS, HS);
}
const pointIn = (a, D, bone, [x, y]) => D.at(a, bone, [(x - D.J[PIVOT[bone]][0]) * SC, (y - D.J[PIVOT[bone]][1]) * SC]);
const headAt = (a, D, uv) => pointIn(a, D, 'head', hk(uv));
const angOf = (M) => Math.atan2(M[1], M[0]);
const swingOf = (a, name, parent) => {
  const d = angOf(a.blMat(name)) - angOf(a.blMat(parent));
  return Math.atan2(Math.sin(d), Math.cos(d));
};

// ---------- Live pieces of her ----------
// Behind everything: her wings (far pair, then near), and her two long tails of hair.
function drawBack(ctx, a, mode, S, D) {
  const q = a.bf ?? {};
  const f = q.flap ?? 0;
  const f2 = q.flap2 ?? 0;
  const op = q.wingOpen ?? 0;
  const lf = q.leafy ?? 0;
  ctx.save();
  enter(ctx, a, D, 'chest');
  const sL = swingOf(a, 'wingL', 'chest');
  const sR = swingOf(a, 'wingR', 'chest');
  // (far side: to her back, a touch smaller; each upper and lower wing on its own beat)
  const s = 1 - lf * 0.25;
  wing(ctx, a, mode, Math.PI + 0.66 + f * 0.24 + op + sL, 80 * 0.86 * s, 52 * 0.86, true, lf);
  wing(ctx, a, mode, Math.PI - 0.4 - f2 * 0.16 - op * 0.4 + sL * 0.6, 52 * 0.86 * s, 36 * 0.86, true, lf);
  wing(ctx, a, mode, -0.66 - f * 0.24 - op + sR, 80 * s, 52, false, lf);
  wing(ctx, a, mode, 0.4 + f2 * 0.16 + op * 0.4 + sR * 0.6, 52 * s, 36, false, lf);
  ctx.restore();
  ctx.save();
  headFrame(ctx, a, D);
  for (const [k, o, root] of [['F', -1, [-17, -54]], ['N', 1, [18, -55]]]) {
    ctx.save();
    ctx.translate(root[0], root[1]);
    ctx.rotate(swingOf(a, `hair${k}`, 'head') - o * 0.3);
    hairTail(ctx, a, mode, o, swingOf(a, `hair${k}2`, `hair${k}`), root);
    ctx.restore();
  }
  ctx.restore();
}
function drawHead(ctx, a, mode, S, D) {
  const q = a.bf ?? {};
  ctx.save();
  headFrame(ctx, a, D);
  hairBack(ctx, a, mode);
  for (const o of [-1, 1]) fairyEar(ctx, a, mode, o, (q.earWig ?? 0) * (o > 0 ? 1 : 0.7));
  drawShapes(ctx, a, mode, faceShapes(q.face ?? 'calm'), 6 / HS, SKIN.deep);
  // the side locks framing her cheeks, outside her eyes, each swinging from its root under the cap
  for (const [k, root, o, len] of [['lockF', [-34.4, -16], -1, 36], ['lockN', [35.2, -16], 1, 35]]) sideLock(ctx, a, mode, root, len, 10, o, swingOf(a, k, 'head') * 0.8);
  hairFront(ctx, a, mode);
  // her buns, pinned high on the back of her head
  bun(ctx, a, mode, [-17, -58], -1);
  bun(ctx, a, mode, [18, -59], 1);
  ctx.restore();
}
function drawTailAndBack(ctx, a, mode, S, D) {
  const q = a.bf ?? {};
  if ((q.tail ?? 0) > 0.02) {
    ctx.save();
    enter(ctx, a, D, 'tailJ');
    tailShape(ctx, a, mode);
    ctx.restore();
  }
  ctx.save();
  enter(ctx, a, D, 'backP');
  for (const [x, ang] of [[70, 0.5], [80, 0], [90, -0.5]]) skirtPetal(ctx, a, mode, [x, 104], ang, 15, 11, 0, true);
  ctx.restore();
}
function drawDress(ctx, a, mode, S, D) {
  ctx.save();
  enter(ctx, a, D, 'waistB');
  bellShape(ctx, a, mode);
  ctx.restore();
  // the petals: the outer ones first, the middle one last
  for (const k of [0, 4, 1, 3, 2]) {
    const p = PETALS[k];
    ctx.save();
    enter(ctx, a, D, `petal${k}`);
    skirtPetal(ctx, a, mode, p.r, p.ang, p.len, p.wd, k, false);
    ctx.restore();
  }
  ctx.save();
  enter(ctx, a, D, 'chest');
  bodice(ctx, a, mode);
  ctx.restore();
}
function drawSepals(ctx, a, mode, S, D) {
  for (const k of ['F', 'N']) {
    ctx.save();
    enter(ctx, a, D, `sep${k}`);
    sepal(ctx, a, mode, k);
    ctx.restore();
  }
}
function drawPuff(ctx, a, mode, S, D, k) {
  ctx.save();
  D.frame(ctx, a, `arm${k}u`);
  puff(ctx, a, mode, D.loc(`sh${k}`, `arm${k}u`), D.loc(`el${k}`, `arm${k}u`), k === 'F');
  ctx.restore();
}
function drawSlipper(ctx, a, mode, S, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  slipper(ctx, a, mode, k);
  ctx.restore();
}
function drawWand(ctx, a, mode, S, D) {
  const q = a.bf ?? {};
  ctx.save();
  enter(ctx, a, D, 'wandJ');
  wand(ctx, a, mode, q.wandOpen ?? 0, q.wandGlow ?? 0);
  ctx.restore();
}

// ---------- Her act ----------
const PIECES = { bloom: 7.2, twirl: 6.6, slip: 8.4, giggles: 6.4 };
const ORDER = ['bloom', 'twirl', 'slip', 'giggles'];
const POOL = ['flurry', 'pollen', 'gust'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const q = { face: null, flap: 0, flap2: 0, wingOpen: 0, leafy: 0, earWig: 0, tail: 0, tailRot: 0, wandR: 0, wandOpen: 0, wandGlow: 0, petalRot: [0, 0, 0, 0, 0], bloom: -1, petalBurst: -1, pollenPuff: -1, sweat: -1, zz: 0, sparkle: -1, poof: -1, tapT: -1, flurry: -1, bomb: null, gust: -1, trail: 0, kick: 0 };
  a.bf = q;
  const go = (p, k) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const add = (p, k) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + val * k;
  };
  const say = (f, k) => {
    if (k > 0.45) q.face = f;
  };
  const alive = m.hp > 0;
  // (flying: by her own travel, as a flyer always counts as moving)
  if (dt > 0) {
    const vx = st.bfX == null ? 0 : (m.x - st.bfX) / dt;
    st.bfV = lerp(st.bfV ?? 0, Math.min(140, Math.abs(vx)), Math.min(1, dt * 5));
  }
  st.bfX = m.x;
  const fly = alive ? sstep(((st.bfV ?? 0) - 6) / 30) : 0;
  // Her wings' beat: a phase of its own (quicker as she flies), the lower pair a beat behind.
  st.bfPh = ((st.bfPh ?? 0) + dt * TAU * (1.5 + fly * 1.4)) % (TAU * 64);
  const ph = st.bfPh;
  q.flap = Math.sin(ph);
  q.flap2 = Math.sin(ph - 0.9);
  // Hovering: a light bounce (it springs off the bottom of each bob), legs dangling, toes pointed,
  // the wand held up in front, her far hand out to the side.
  const bob = Math.pow(Math.abs(Math.sin(t * 2.0)), 0.7);
  go({ x: 0, hop: 0.13 + bob * 0.03, lift: 0, tilt: Math.sin(t * 1.1) * 1.6, head: Math.sin(t * 0.8) * 3, fxN: 0.12, fyN: 0.04, toeN: 34, fxF: -0.1, fyF: 0.12, toeF: 28, shN: -44 + Math.sin(t * 1.3) * 3, elN: -60, hwN: -6, shF: 44 + Math.sin(t * 1.1) * 3, elF: -70, hwF: 10 }, 1);
  // Flying: leaning into it, legs trailing, the wand pointed ahead.
  go({ tilt: 13, head: -7, neckR: -3, fxN: -0.2, fyN: 0.14, fxF: -0.34, fyF: 0.18, toeN: 40, toeF: 36, shN: -70, elN: -24, shF: 40, elF: -20 }, fly);
  q.trail = fly;
  q.wandR = -0.1 + Math.sin(t * 1.3) * 0.06 + fly * 0.5;
  // the skirt's petals streaming back as she flies
  for (let i = 0; i < 5; i++) q.petalRot[i] = fly * 0.32;

  // ----- The fight -----
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const wind = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  if (wind > 0) st.bfWindAt = now;
  const since = now - (m.attackAt ?? -9);
  const striking = since >= 0 && since < 1.0;
  if ((wind > 0 || striking) && alive) {
    if (!st.bfAtk) {
      const pool = m.def.moves ?? POOL;
      st.bfN = (st.bfN ?? m.uid ?? 0) + 1;
      st.bfMove = m.move ?? pool[st.bfN % pool.length];
    }
    st.bfAtk = true;
  } else st.bfAtk = false;
  const mvName = st.bfAtk ? st.bfMove : null;
  const hadWind = now - (st.bfWindAt ?? -9) < Math.max(0, since) + 0.15;
  let W = wind;
  let s = striking ? since : -1;
  if (mvName && striking) {
    if (!hadWind) {
      W = since < 0.24 ? sstep(since / 0.24) : 1;
      s = since - 0.24;
    } else W = 1;
  }
  const busy = Boolean(mvName) || !alive;

  const ago = a.hurtAgo ?? 9;
  const hurt = alive && ago >= 0 && ago < 0.6;
  const fighting = (m.aggroUntil ?? 0) > now;
  const napping = alive && (m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now));
  const cine = m.cine?.mood;
  const low = alive && m.hp < m.def.hp * 0.25 && !m.cine;

  // ----- The act (hovering about calm, eased in and out) -----
  const calmGoal = !busy && !napping && !m.pose && !m.cine && !hurt && !fighting && fly < 0.05 && alive ? 1 : 0;
  st.bfCalm = lerp(st.bfCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const cw = sstep(st.bfCalm);
  let PC = st.bfPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.bfOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.bfOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.bfOrd = (st.bfOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.bfPiece = PC;
  const piece = PC?.name ?? null;
  const pu = PC?.name ? now - PC.t0 : -1;
  const k = cw;

  if (k > 0.001 && piece === 'bloom') {
    // a twirl of the wand in little circles, then a tap on the air
    const twirl = win(pu, 0.1, 0.4, 1.2, 1.4);
    add({ shN: Math.sin(pu * 9) * 14 * twirl, elN: Math.cos(pu * 9) * 12 * twirl }, k);
    q.wandR += Math.sin(pu * 9) * 0.3 * twirl * k;
    say('smug', twirl * k);
    const tap = win(pu, 1.3, 1.45, 1.55, 1.9);
    go({ shN: -86, elN: -20, tilt: 4 }, tap * k);
    if (pu >= 1.45 && pu < 1.9) q.tapT = pu - 1.45;
    q.wandGlow = Math.max(q.wandGlow, win(pu, 1.2, 1.45, 1.5, 2.0) * k);
    // the flower blooming in the air, ahead of her
    if (pu >= 1.5 && pu < 5.8) q.bloom = pu - 1.5;
    const lean = win(pu, 2.5, 2.9, 3.7, 4.0);
    go({ tilt: 12, head: 10, neckR: 4, x: 0.03, shF: 10 }, lean * k);
    say('surprised', win(pu, 1.6, 1.7, 2.4, 2.5) * k);
    say('sniff', lean * k);
    if (pu >= 3.9 && pu < 6.2) q.petalBurst = pu - 3.9;
    const joy = win(pu, 4.0, 4.2, 6.6, 7.2);
    say('happy', joy * k);
    // a happy clap (hands together and apart, twice)
    const clap = win(pu, 4.6, 4.8, 5.8, 6.1);
    const cl = Math.abs(Math.sin((pu - 4.6) * 9));
    go({ shN: -60 + cl * 6, elN: -70, shF: -30 - cl * 8, elF: -70 }, clap * k);
    add({ hop: Math.max(0, Math.sin((pu - 4.6) * 9)) * 0.01 }, clap * k);
  }
  if (k > 0.001 && piece === 'twirl') {
    const ready = win(pu, 0.2, 0.7, 2.9, 3.2);
    go({ shN: -150, elN: -30, shF: -150, elF: -30, fxN: 0.02, fxF: 0.02, fyN: 0.1, fyF: 0.1, toeN: 40, toeF: 40, head: -6 }, ready * k);
    add({ hop: 0.04 * win(pu, 0.6, 1.4, 3.0, 3.6) }, k);
    say('happy', ready * k);
    // two clean mirror flips at each half turn
    q.twirl = pu >= 1.6 && pu < 2.8 && Math.floor((pu - 1.6) / 0.3) % 2 === 0;
    if (pu > 1.5 && pu < 3.2) q.sparkle = (pu - 1.5) / 1.7;
    // the curtsey: one leg crossed behind, a dip, her head bowed
    const bow = win(pu, 3.3, 3.7, 4.6, 5.0);
    go({ tilt: 10, head: 14, neckR: 4, fxF: -0.32, fyF: 0.28, fxN: 0.1, shN: -20, elN: -40, shF: 40, elF: -30, hop: 0.09 }, bow * k);
    say('happy', bow * k);
    const wink = win(pu, 4.9, 5.1, 6.2, 6.6);
    go({ head: -6, tilt: -3, shN: -60, elN: -60 }, wink * k);
    say('wink', wink * k);
  }
  if (k > 0.001 && piece === 'slip') {
    // the big yawn and stretch
    const yawn = win(pu, 0.1, 0.5, 1.2, 1.5);
    go({ shN: -160, elN: -40, shF: -160, elF: -40, tilt: -6, head: -10, chest: -4 }, yawn * k);
    say('yawn', yawn * k);
    // her wings droop and turn back into leaves; she drops a little
    const leafW = sstep((pu - 1.4) / 0.4) * (1 - sstep((pu - 3.95) / 0.45));
    q.leafy = Math.max(q.leafy, leafW * k);
    if (pu >= 1.4 && pu < 2.6) q.poof = pu - 1.4;
    add({ hop: -0.06 * leafW }, k);
    say('surprised', win(pu, 1.5, 1.6, 2.0, 2.1) * k);
    // flapping the leaves frantically, the tail popped out, eyes darting, sweat
    const frantic = win(pu, 2.0, 2.15, 3.6, 3.8);
    add({ hop: Math.abs(Math.sin(pu * 14)) * 0.015 * frantic, tilt: Math.sin(pu * 14) * 3 * frantic }, k);
    go({ shN: -110, elN: -60, shF: -120, elF: -50 }, frantic * k);
    q.tail = Math.max(q.tail, clamp(boing(pu - 2.0, 7, 14), 0, 1.1) * (1 - sstep((pu - 4.6) / 0.5)) * k);
    const left = Math.floor((pu - 2.0) / 0.3) % 2 === 1;
    say(left ? 'panicL' : 'panic', frantic * k);
    if (pu > 2.0 && pu < 4.2) q.sweat = (pu - 2.0) / 2.2;
    // a tap of the wand on her own head: sparkles, wings again
    const tap = win(pu, 3.7, 3.9, 4.1, 4.4);
    go({ shN: -150, elN: -120, head: 4, hwN: -20 }, tap * k);
    q.wandGlow = Math.max(q.wandGlow, tap * k);
    if (pu >= 3.95 && pu < 5.2) q.tapT = pu - 3.95;
    say('shut', tap * k);
    // relief, a look round, "shh"
    const look = win(pu, 4.6, 4.8, 6.4, 6.6);
    const lookL = Math.floor((pu - 4.6) / 0.6) % 2 === 1;
    add({ head: (lookL ? -4 : 4) * look, neckR: (lookL ? -2 : 2) * look }, k);
    say(lookL ? 'panicL' : 'smug', look * k);
    const shh = win(pu, 6.6, 6.9, 7.9, 8.4);
    go({ shN: -96, elN: -128, hwN: -30, head: -4 }, shh * k);
    say('shh', shh * k);
  }
  if (k > 0.001 && piece === 'giggles') {
    // her palm held up flat, a big breath, then blowing the pollen off it
    // (the wand's blossom brought up under her lips, then blown on: its pollen drifts off)
    const palm = win(pu, 0.3, 0.6, 2.0, 2.3);
    go({ shN: -96, elN: -118, hwN: -10, head: 3 }, palm * k);
    q.wandR -= 0.3 * palm * k;
    say('blow', win(pu, 0.8, 0.95, 1.9, 2.0) * k);
    if (pu >= 1.0 && pu < 3.6) q.pollenPuff = pu - 1.0;
    // a fit of giggles, kicking her legs in turn
    const gig = win(pu, 2.2, 2.4, 5.4, 5.9);
    const kk = Math.sin(pu * 9);
    add({ fxN: kk * 0.16 * gig, fyN: Math.max(0, kk) * 0.12 * gig, fxF: -kk * 0.14 * gig, fyF: Math.max(0, -kk) * 0.12 * gig, chest: Math.sin(pu * 13) * 2 * gig, head: Math.sin(pu * 13 - 0.5) * 3 * gig }, k);
    go({ shN: -80, elN: -110, hwN: -30 }, gig * k);
    say('giggle', gig * k);
    q.kick = gig * k;
  }
  q.calm = cw;

  // her own marks: "!" as she starts hunting you, "?" when she loses you
  if (fighting && alive && !st.bfHunt) st.bfBangAt = now;
  if (!fighting && st.bfHunt && alive) st.bfLostAt = now;
  st.bfHunt = fighting && alive;
  q.bang = now - (st.bfBangAt ?? -9);
  q.huh = now - (st.bfLostAt ?? -9);
  q.hurtT = hurt ? ago : -1;
  q.gloatT = now - (m.gloatAt ?? -9);

  // ----- Hunting you: a smirk, the wand ready -----
  if (fighting && alive && !hurt) {
    go({ shN: -80, elN: -40, tilt: 6, head: 3 }, 1 - fly * 0.4);
    q.face = 'fierce';
  }
  if (low && !busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.5) % 1;
  }
  // ----- Her moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.42) / 0.45) : 0;
    const snap = s >= 0 ? sstep(s / (hadWind ? 0.08 : 0.12)) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'flurry') {
      // the wand hauled back over her head, then swished down at you
      go({ shN: -175, elN: -30, hwN: -10, tilt: -10, head: -8, chest: -4, fyN: 0.18, fyF: 0.14 }, wu);
      q.wandR -= 0.9 * wu;
      q.wandGlow = Math.max(q.wandGlow, wu);
      q.wingOpen = Math.max(q.wingOpen, 0.25 * wu);
      say('fierce', W);
      go({ shN: -36, elN: -6, tilt: 14, head: 8, chest: 5, x: 0.03 }, snap * sw);
      q.wandR += 0.6 * snap * sw;
      say('shout', snap * sw);
      if (s >= 0 && s < 1.0) q.flurry = s;
    } else if (mvName === 'pollen') {
      // a glowing ball of pollen swelling on her wand, held up; then lobbed at you
      go({ shN: -130, elN: -40, tilt: -6, head: -10, shF: -40, elF: -60 }, wu);
      say('focus', W);
      q.bomb = { grow: W, s };
      go({ shN: -60, elN: -10, tilt: 10, head: 4, x: 0.02 }, snap * sw);
      say('smug', snap * sw);
    } else {
      // curled up, wings raised high; then a great beat of them at you
      go({ fyN: 0.3, fyF: 0.26, fxN: 0.16, fxF: 0.1, tilt: -8, head: 8, shN: -40, elN: -110, shF: -30, elF: -110, hop: 0.16 }, wu);
      q.wingOpen = Math.max(q.wingOpen, 0.7 * wu);
      say('focus', W);
      go({ x: -0.03, tilt: -4, head: -6, fyN: 0.06, fyF: 0.08, shN: -70, elN: -20, shF: 30, elF: -10 }, snap * sw);
      q.wingOpen -= 0.5 * snap * sw;
      say('shout', snap * sw);
      if (s >= 0 && s < 1.0) q.gust = s;
    }
  }
  // ----- Hurt: a wince, a flinch, her wings jolted shut a moment -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -14, head: 12, neckR: 4, shN: -80, elN: -120, hwN: -20, fyN: 0.2, fyF: 0.16 }, kh);
    q.face = 'hurt';
    q.wingOpen -= 0.3 * Math.sin(Math.PI * clamp(ago / 0.6, 0, 1));
    q.earWig = Math.max(q.earWig, 0.3 * kh);
  }
  // ----- After landing a hit: a teasing "bleh" (blended in as a move lets go) -----
  const moveW = mvName ? (s >= 0 ? 1 - sstep((s - 0.42) / 0.45) : 1) : 0;
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.1 && alive && !hurt) {
    const kg = win(gl, 0, 0.15, 0.85, 1.1) * (1 - moveW);
    go({ head: -6, tilt: -4, shN: -96, elN: -110, hwN: -20 }, kg);
    say('bleh', kg);
  }
  // ----- A nap: curled up in the air, hugging her knees, wings folded; her tail slips out -----
  st.bfNap = lerp(st.bfNap ?? 0, napping && !busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.bfNap);
  if (nw > 0.001) {
    const nod = Math.sin(now * 1.4);
    go({ hop: 0.07 + nod * 0.008, tilt: 8, waist: 4, chest: 4, head: 16 + nod * 3, neckR: 4, fyN: 0.42, fyF: 0.38, fxN: 0.24, fxF: 0.14, toeN: 20, toeF: 20, shN: -46, elN: -96, shF: -36, elF: -100 }, nw);
    q.wingOpen -= 0.5 * nw;
    q.tail = Math.max(q.tail, 0.8 * nw);
    q.tailRot += Math.sin(now * 0.8) * 0.15 * nw;
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
    }
  }
  if (alive && !busy && !hurt) {
    if (cine === 'happy') q.face = 'happy';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'fierce';
    else if (cine === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 7) % VOWELS.length];
  }
  if (!alive) q.face = 'dizzy';
  // ----- The face: an in-between on every change; her own blink rhythm -----
  let f = q.face ?? 'calm';
  if (f !== st.bfFace) {
    st.bfFaceFrom = st.bfFace;
    st.bfFace = f;
    st.bfFaceAt = now;
  }
  const since0 = now - (st.bfFaceAt ?? -9);
  const SHUT = new Set(['happy', 'giggle', 'shout', 'bleh', 'hurt', 'yawn', 'sleep', 'sniff', 'shut', 'dizzy', 'wink']);
  if (since0 >= 0 && since0 < 0.07 && st.bfFaceFrom && !SHUT.has(f) && !SHUT.has(st.bfFaceFrom)) f = 'blink';
  const bl = (now + (m.uid ?? 0) * 0.71) % 4.4;
  if (bl < 0.12 && !SHUT.has(f) && f !== 'blink') f = 'blink';
  q.face = f;
  // (the leaves, the tail and the skirt's petals eased, so nothing ever snaps)
  for (const key of ['leafy', 'tail', 'wingOpen', 'wandR']) {
    st[`bf_${key}`] = lerp(st[`bf_${key}`] ?? q[key], q[key], ease(key === 'wandR' ? 16 : 14));
    q[key] = st[`bf_${key}`];
  }
  st.bfPR ??= [0, 0, 0, 0, 0];
  for (let i = 0; i < 5; i++) {
    // (a petal kicked by a leg that swings forward under it)
    const legK = i < 2 ? out.fxF ?? 0 : i > 2 ? out.fxN ?? 0 : ((out.fxN ?? 0) + (out.fxF ?? 0)) / 2;
    const goal = q.petalRot[i] - clamp(legK * 0.5, -0.25, 0.3);
    st.bfPR[i] = lerp(st.bfPR[i], goal, ease(16));
    q.petalRot[i] = st.bfPR[i];
  }
  q.tailRot += lerp(1.15, 0, sstep(q.tail));
  st.bfTwirl = Boolean(q.twirl);
}

// ---------- Live effects (rig space, game px, the point she hovers over at 0, 0) ----------
// A blossom petal: rounded with a soft notch, a soft rose line, a light; spinning about `rot`,
// tipping as it flutters (a turn of its own, never a squeeze).
function petalFx(ctx, a, x, y, r, rot, al, col = ROSE[1]) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  smoothPath(ctx, [[0, r * 0.9], [-r * 0.9, r * 0.1], [-r * 0.7, -r * 0.8], [-r * 0.2, -r], [0, -r * 0.7], [r * 0.2, -r], [r * 0.7, -r * 0.8], [r * 0.9, r * 0.1]]);
  ctx.lineWidth = Math.max(0.3, r * 0.3);
  ctx.strokeStyle = ROSE_INK;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = tone(a, col);
  ctx.fill();
  ell(ctx, -r * 0.25, -r * 0.25, r * 0.32, r * 0.24, -0.5);
  ctx.fillStyle = tone(a, ROSE[0]);
  ctx.fill();
  ctx.restore();
}
// The curvy sparkle star.
function sparkle(ctx, x, y, r, al, col = '#ffffff', ink = '#e28ab4') {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + r * 0.16, y - r * 0.16, x + r, y);
  ctx.quadraticCurveTo(x + r * 0.16, y + r * 0.16, x, y + r);
  ctx.quadraticCurveTo(x - r * 0.16, y + r * 0.16, x - r, y);
  ctx.quadraticCurveTo(x - r * 0.16, y - r * 0.16, x, y - r);
  ctx.closePath();
  ctx.lineWidth = Math.max(0.3, r * 0.22);
  ctx.strokeStyle = ink;
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}
// A soft golden puff of pollen (a round fluff with a soft line and a light), never a speck.
function pollen(ctx, a, x, y, r, al) {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.lineWidth = Math.max(0.3, r * 0.3);
  ctx.strokeStyle = GOLD[2];
  ctx.stroke();
  ctx.fillStyle = tone(a, GOLD[1]);
  ctx.fill();
  ell(ctx, x - r * 0.3, y - r * 0.3, r * 0.45, r * 0.4);
  ctx.fillStyle = tone(a, GOLD[0]);
  ctx.fill();
  ctx.restore();
}
// A flower blooming in the air (t seconds since it started): its petals opening one by one, a golden
// heart, then (pop) gone into the petal burst.
function airBloom(ctx, a, x, y, t) {
  const open = sstep(t / 0.9);
  const fade = 1 - sstep((t - 2.35) / 0.12);
  if (fade <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= fade;
  ctx.translate(x, y + Math.sin(t * 2) * 0.6);
  ctx.rotate(t * 0.3);
  for (const pass of ['line', 'fill']) {
    for (let i = 0; i < 5; i++) {
      const u = clamp(open * 1.6 - i * 0.12, 0, 1);
      const r = 2.6 * boing(u * 0.8, 6, 12);
      if (r <= 0.05) continue;
      const q = -Math.PI / 2 + (i / 5) * TAU;
      ctx.save();
      ctx.rotate(q + Math.PI / 2);
      smoothPath(ctx, [[0, 0], [-r * 0.85, -r * 0.6], [-r * 0.7, -r * 1.5], [-r * 0.22, -r * 1.7], [0, -r * 1.5], [r * 0.22, -r * 1.7], [r * 0.7, -r * 1.5], [r * 0.85, -r * 0.6]]);
      if (pass === 'line') {
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = ROSE_INK;
        ctx.stroke();
      } else {
        ctx.fillStyle = tone(a, i % 2 ? ROSE[0] : ROSE[1]);
        ctx.fill();
      }
      ctx.restore();
    }
  }
  ell(ctx, 0, 0, 1.1 * open, 1.1 * open);
  ctx.fillStyle = tone(a, GOLD[1]);
  ctx.fill();
  ctx.restore();
  sparkle(ctx, x + 4, y - 4, 1.4 * Math.sin(Math.PI * clamp(t / 1.2, 0, 1)), fade);
}
// A soft rounded note, z, and her thought bubble.
function zee(ctx, x, y, s, al, fl = false) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(fl ? -s : s, s);
  ctx.beginPath();
  ctx.moveTo(-1.6, -1.6);
  ctx.quadraticCurveTo(0, -1.9, 1.6, -1.6);
  ctx.quadraticCurveTo(0, 0, -1.6, 1.6);
  ctx.quadraticCurveTo(0, 1.3, 1.7, 1.6);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#b080c8';
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = '#fbefff';
  ctx.stroke();
  ctx.restore();
}
// A bead of sweat.
function sweatDrop(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -r * 2);
  ctx.bezierCurveTo(r * 0.4, -r * 1.4, r * 1.05, -r * 0.6, r, 0);
  ctx.arc(0, 0, r, 0, Math.PI);
  ctx.bezierCurveTo(-r * 1.05, -r * 0.6, -r * 0.4, -r * 1.4, 0, -r * 2);
  ctx.closePath();
  ctx.lineWidth = 0.4;
  ctx.strokeStyle = '#6aa6d6';
  ctx.stroke();
  ctx.fillStyle = '#cdeeff';
  ctx.fill();
  ell(ctx, -r * 0.35, -r * 0.4, r * 0.28, r * 0.4, -0.4);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
function bubble(ctx, x, y, mark, e, dur, fl = false) {
  const k = Math.max(0, boing(e, 9, 18)) * (1 - sstep((e - dur + 0.25) / 0.25));
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(fl ? -k : k, k);
  for (const pass of ['line', 'fill']) {
    // a little flower-shaped bubble: five soft lobes
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const q = -Math.PI / 2 + (i / 5) * TAU;
      ctx.moveTo(Math.cos(q) * 2.6 + 3.2, Math.sin(q) * 2.6);
      ctx.arc(Math.cos(q) * 2.6, Math.sin(q) * 2.6, 3.2, 0, TAU);
    }
    if (pass === 'line') {
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = '#e48ab6';
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }
  ctx.lineCap = 'round';
  ctx.strokeStyle = mark === '!' ? '#f2588e' : '#a070c4';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0, -2.8);
    ctx.lineTo(0, 0.4);
  } else {
    ctx.moveTo(-1.4, -1.6);
    ctx.quadraticCurveTo(-1.1, -3.4, 0.4, -3.2);
    ctx.quadraticCurveTo(1.9, -2.8, 1.3, -1.3);
    ctx.quadraticCurveTo(0.4, -0.6, 0.2, 0.5);
  }
  ctx.stroke();
  ell(ctx, mark === '!' ? 0 : 0.2, 2.2, 0.8, 0.8);
  ctx.fill();
  ctx.restore();
}

function under2(ctx, m, a, S, matOf, D) {
  // (every loose piece swung once a frame, drawn or not)
  for (const n of SOFT_NAMES) a.blMat(n);
  const q = a.bf ?? {};
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.57;
  // flying: a trail of sparkles and the odd petal off her wings, left where they fell behind her
  if ((q.trail ?? 0) > 0.05 && m.hp > 0) {
    const [wx, wy] = pointIn(a, D, 'chest', WING_ROOT);
    for (let i = 0; i < 5; i++) {
      const f = (t * 1.6 + i / 5) % 1;
      const n = Math.floor(t * 1.6 + i / 5);
      const x = wx - 4 - f * 16 + (hash(n * 3 + i) - 0.5) * 6;
      const y = wy + (hash(n * 7 + i) - 0.5) * 10 + f * 6;
      if (i % 2) sparkle(ctx, x, y, 1.3 * Math.sin(Math.PI * f), q.trail);
      else petalFx(ctx, a, x, y, 0.9, f * 5 + i, q.trail * (1 - f));
    }
  }
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.bf ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.37;
  if (m.hp <= 0) return;
  const [bx, by] = pointIn(a, D, 'wandJ', BLOOM);
  // her wand's blossom twinkling now and then, and glowing as she uses it
  const tw = ((t % 2.7) + 2.7) % 2.7;
  if (tw < 0.5) sparkle(ctx, bx + 2.6, by - 2.6, 1.6 * Math.sin(Math.PI * (tw / 0.5)), 1, '#ffffff');
  if ((q.wandGlow ?? 0) > 0.05) for (let i = 0; i < 3; i++) {
    const an = t * 3 + (i / 3) * TAU;
    sparkle(ctx, bx + Math.cos(an) * 4.4, by + Math.sin(an) * 4.4, 1.1, q.wandGlow, i % 2 ? GOLD[0] : '#ffffff');
  }
  // a tap of the wand: a little burst of sparkles where it touched
  if ((q.tapT ?? -1) >= 0 && q.tapT < 1.2) {
    const u = q.tapT / 1.2;
    for (let i = 0; i < 6; i++) {
      const an = (i / 6) * TAU + 0.3;
      const d = 2 + (1 - (1 - u) ** 2) * 8;
      sparkle(ctx, bx + Math.cos(an) * d, by + Math.sin(an) * d, (i % 2 ? 1.1 : 1.7) * Math.sin(Math.PI * u), 1, i % 3 ? '#ffffff' : GOLD[0]);
    }
  }
  // the flower blooming in the air ahead of her
  if ((q.bloom ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [62, 10]);
    airBloom(ctx, a, hx, hy, q.bloom);
  }
  // its burst: petals swirling round her and drifting down
  if ((q.petalBurst ?? -1) >= 0) {
    const [cx, cy] = headAt(a, D, [10, 30]);
    const u = q.petalBurst / 2.3;
    for (let i = 0; i < 10; i++) {
      const an = (i / 10) * TAU + u * 5;
      const r = 6 + u * 10 + (i % 3) * 2;
      const x = cx + Math.cos(an) * r;
      const y = cy + Math.sin(an) * r * 0.45 + u * u * 10 + (i % 2) * 2;
      petalFx(ctx, a, x, y, 1.2, an + u * 6, 1 - sstep((u - 0.7) / 0.3), i % 2 ? ROSE[0] : ROSE[1]);
    }
  }
  // the pollen she blows off her palm: soft golden puffs drifting ahead and up
  if ((q.pollenPuff ?? -1) >= 0) {
    const [px, py] = pointIn(a, D, 'wandJ', BLOOM);
    const u = q.pollenPuff / 2.6;
    for (let i = 0; i < 8; i++) {
      const uu = clamp(u * 1.3 - i * 0.04, 0, 1);
      const x = px + 2 + uu * (14 + (i % 3) * 4);
      const y = py - 2 - uu * (4 + (i % 4) * 2) + Math.sin(uu * 8 + i) * 1.2;
      pollen(ctx, a, x, y, (0.6 + (i % 3) * 0.2) * (0.6 + uu * 0.6), 1 - sstep((uu - 0.65) / 0.35));
    }
  }
  // twirling: sparkles spiralling round her
  if ((q.sparkle ?? -1) >= 0 && q.sparkle < 1) {
    const [cx, cy] = headAt(a, D, [0, 40]);
    for (let i = 0; i < 5; i++) {
      const an = q.sparkle * 9 + (i / 5) * TAU;
      sparkle(ctx, cx + Math.cos(an) * 10, cy + Math.sin(an) * 4 - q.sparkle * 6 + i, 1.4 * Math.sin(Math.PI * q.sparkle), 1, i % 2 ? GOLD[0] : '#ffffff');
    }
  }
  // the poof of her wings turning to leaves: a soft puff of petals and sparkles off her back
  if ((q.poof ?? -1) >= 0 && q.poof < 1.2) {
    const [wx, wy] = pointIn(a, D, 'chest', WING_ROOT);
    const u = q.poof / 1.2;
    for (let i = 0; i < 8; i++) {
      const an = (i / 8) * TAU;
      const d = 3 + (1 - (1 - u) ** 3) * 10;
      const x = wx + Math.cos(an) * d;
      const y = wy + Math.sin(an) * d * 0.7 + u * u * 6;
      if (i % 2) petalFx(ctx, a, x, y, 1.1, an + u * 4, 1 - u);
      else sparkle(ctx, x, y, 1.5 * Math.sin(Math.PI * u), 1);
    }
  }
  // Petal Flurry: a fan of petals flung forward off her wand, fluttering
  if ((q.flurry ?? -1) >= 0) {
    const s = q.flurry;
    if (!a.mo.bfFrom || s < 0.03) a.mo.bfFrom = [bx, by];
    const [ox, oy] = a.mo.bfFrom;
    for (let i = 0; i < 11; i++) {
      const uu = clamp((s - i * 0.02) / 0.8, 0, 1);
      if (uu <= 0) continue;
      const an = -0.5 + (i / 10) * 1.1;
      const d = (1 - (1 - uu) ** 2) * (26 + (i % 3) * 6);
      const x = ox + Math.cos(an) * d;
      const y = oy + Math.sin(an) * d + Math.sin(uu * 7 + i) * 1.6 + uu * uu * 6;
      petalFx(ctx, a, x, y, 1.3, uu * 8 + i, 1 - sstep((uu - 0.75) / 0.25), i % 3 ? ROSE[1] : ROSE[0]);
      if (i % 4 === 0) sparkle(ctx, x - 2, y - 1, 1.1 * Math.sin(Math.PI * uu), 1);
    }
  } else a.mo.bfFrom = null;
  // Pollen Bomb: the ball swelling on her wand, then lobbed in an arc, bursting into a golden cloud
  if (q.bomb) {
    const { grow, s } = q.bomb;
    if (s < 0) {
      const r = 1.2 + grow * 2.6;
      glowBall(ctx, a, bx, by - r * 0.4, r);
      a.mo.bfBomb = null;
    } else {
      if (!a.mo.bfBomb || s < 0.03) a.mo.bfBomb = [bx, by];
      const [ox, oy] = a.mo.bfBomb;
      const land = 0.42;
      if (s < land) {
        const u = s / land;
        const x = ox + u * 24;
        const y = oy + (8 - oy) * u * u - Math.sin(Math.PI * u) * 10;
        glowBall(ctx, a, x, y, 3.6);
      } else {
        const u = clamp((s - land) / 0.6, 0, 1);
        const cx = ox + 24;
        const cy = 4;
        for (let i = 0; i < 9; i++) {
          const an = (i / 9) * TAU;
          const d = 2 + (1 - (1 - u) ** 2) * (7 + (i % 3) * 2);
          pollen(ctx, a, cx + Math.cos(an) * d, cy + Math.sin(an) * d * 0.6 - u * 3, (1.6 - u * 0.6) * (i % 2 ? 0.8 : 1), 1 - sstep((u - 0.55) / 0.45));
        }
        for (let i = 0; i < 4; i++) sparkle(ctx, cx + Math.cos(i * 1.7) * 8 * u, cy - 3 - u * 5 + Math.sin(i * 1.7) * 3, 1.5 * Math.sin(Math.PI * u), 1, GOLD[0]);
      }
    }
  } else a.mo.bfBomb = null;
  // Wing Gust: soft swirling strokes of air and a few petals carried at you
  if ((q.gust ?? -1) >= 0) {
    const s = q.gust;
    const [wx, wy] = pointIn(a, D, 'chest', [86, 96]);
    const u = clamp(s / 0.8, 0, 1);
    for (let i = 0; i < 3; i++) {
      const uu = clamp(u * 1.2 - i * 0.12, 0, 1);
      if (uu <= 0 || uu >= 1) continue;
      const x = wx + 4 + uu * 28;
      const y = wy - 4 + i * 4;
      const r = 3 + uu * 4;
      ctx.save();
      ctx.globalAlpha = base * Math.sin(Math.PI * uu) * 0.9;
      ctx.lineCap = 'round';
      for (const [w, col] of [[1.8, '#e2a6cc'], [0.8, '#ffffff']]) {
        ctx.lineWidth = w;
        ctx.strokeStyle = col;
        ctx.beginPath();
        ctx.arc(x, y, r, -Math.PI * 0.9 + uu * 2, Math.PI * 0.4 + uu * 2);
        ctx.stroke();
      }
      ctx.restore();
      petalFx(ctx, a, x + r, y, 1, uu * 9 + i, Math.sin(Math.PI * uu));
    }
  }
  // her marks over her head
  const [mx, my] = headAt(a, D, [36, -76]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, mx, my, '!', q.bang, 1.1, a.flip);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, mx, my, '?', q.huh, 1.4, a.flip);
  if (q.gloatT >= 0 && q.gloatT < 1.0) {
    const e = q.gloatT;
    for (let i = 0; i < 2; i++) sparkle(ctx, mx - 4 + i * 6, my + 8 - e * 6 - i * 2, 1.5 * Math.sin(Math.PI * clamp(e * 1.2 - i * 0.15, 0, 1)), 1, i ? GOLD[0] : '#ffffff');
  }
  if (q.hurtT >= 0 && q.hurtT < 0.5) {
    const [hx, hy] = headAt(a, D, [0, -30]);
    for (let i = 0; i < 4; i++) {
      const e = q.hurtT / 0.5;
      const an = -Math.PI * 0.85 + (i / 3) * Math.PI * 0.7;
      petalFx(ctx, a, hx + Math.cos(an) * (5 + e * 8), hy + Math.sin(an) * (4 + e * 5) + e * e * 7, 0.9, an + e * 6, 1 - e);
    }
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [37, -16]);
    const f = q.sweat % 1;
    sweatDrop(ctx, hx, hy + sstep(f) * 5, 0.9, Math.sin(Math.PI * f));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [26, -62]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.45 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip);
    }
  }
  ctx.globalAlpha = base;
}
// A glowing ball of pollen: a soft golden ball with a light and a slow ring of sparkles.
function glowBall(ctx, a, x, y, r) {
  ctx.save();
  glow(ctx, x, y, r * 2.4, GOLD[0], 0.55);
  ell(ctx, x, y, r, r);
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = GOLD[2];
  ctx.stroke();
  ctx.fillStyle = tone(a, GOLD[1]);
  ctx.fill();
  ell(ctx, x - r * 0.3, y - r * 0.35, r * 0.42, r * 0.34);
  ctx.fillStyle = tone(a, GOLD[0]);
  ctx.fill();
  ctx.restore();
  const t = a.now ?? 0;
  for (let i = 0; i < 3; i++) {
    const an = t * 4 + (i / 3) * TAU;
    sparkle(ctx, x + Math.cos(an) * r * 1.5, y + Math.sin(an) * r * 1.1, 0.9, 1, '#ffffff', GOLD[2]);
  }
}

const DRESS = {
  skin: SKIN,
  liveHead: true,
  noMoves: true,
  joints: JOINTS,
  softParts: SOFTS,
  under2,
  under: {
    armFu: drawBack,
    legF: drawTailAndBack,
    handNskin: drawWand,
  },
  over: {
    armF: (ctx, a, mode, S, D) => drawPuff(ctx, a, mode, S, D, 'F'),
    footFskin: (ctx, a, mode, S, D) => drawSlipper(ctx, a, mode, S, D, 'F'),
    footNskin: (ctx, a, mode, S, D) => drawSlipper(ctx, a, mode, S, D, 'N'),
    torsoSkin: drawDress,
    neckSkin: drawSepals,
    head: drawHead,
    armN: (ctx, a, mode, S, D) => drawPuff(ctx, a, mode, S, D, 'N'),
  },
  pose,
  fx,
};

const R = dressRig(DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  a.m = m;
  // (she never steps: the game counts a flyer as always moving, so the base is told she isn't, and
  // her flight goes by her own travel; her twirl is clean mirror flips)
  const moving0 = a.moving;
  const flip0 = a.flip;
  a.moving = false;
  const st = a.mo.rig;
  if (st?.bfTwirl && m.hp > 0) a.flip = !a.flip;
  draw0(ctx, m, a);
  a.moving = moving0;
  a.flip = flip0;
  a.gait = null;
};
rig.w = Math.round(rig.w * 1.2);
rig.h = Math.round(rig.h * 1.2);
// (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: its marks over her head left
// to her, drawn here in her own style)
export const BLOSSOM_FAIRY_ART = { pad: 12, walk: 8, idle: 8, attack: 5, stride: R.stride, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const BLOSSOM_FAIRY_DRESS = DRESS;
