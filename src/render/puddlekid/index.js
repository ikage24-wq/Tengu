// The Puddle Kid on screen (2026-11-26, the Whispering Glade's Puddle Kid remade from scratch to the
// new standard, the player: "It should still be remade into a puddle kid tho"). A tanuki in disguise:
// a puddle-mad little rain kid in a buttercup raincoat, hood up over the ears she is hiding, sky-blue
// boots, a lily pad with a water lily on it for an umbrella; under the coat a striped tail she keeps
// tucked away. Her look is in art.js; she moves on her own copy of the kid base's rig (kidrig.js: its
// bones, the kid walk and its springs; the base's own moves left out), every loose piece of her
// outfit on the engine's own soft-layer springs (coat panels, pocket flaps, collar points,
// drawstrings, side locks, the leaf in her hair, her tail, the lily pad, the hood).
//   puddle  where she stands, her lily pad drips a little puddle under her (it grows in as she stops
//           and drains away as she walks on); drips ring it, her boots mirror in it; walking, every
//           boot that plants makes a little ring of its own.
//   idle    her act, in four pieces, each whole in itself, the next one that fits the time she has
//           before she moves on (data: `rest`; world/mobs.js tells her, `m.restUntil`):
//           - stomp (7.2 s): a look down at her puddle, a crouch, two big hops in it (SPLASH,
//             SPLASH), giggling, her tail wagging out from under her coat without her noticing; a
//             kick of water off her toe;
//           - rain (6.4 s): she looks up, holds her palm out to catch the drips, sticks her tongue
//             out for one, a shiver when it lands, a happy shake of her head;
//           - slip (8.4 s): her nose twitches... ACHOO, poof: her hood flops back, her round tanuki
//             ears pop up and her tail pops out; frozen, eyes darting, a bead of sweat; she yanks her
//             hood up over the ears, tucks the tail away, and whistles, nothing to see here;
//           - twirl (6.2 s): she spins her lily pad so its drips fly off in a ring, twirls round
//             herself (two clean mirror flips), and a ta-da.
//   moves   Puddle Stomp (her near knee hauled up high, then stamped down: a crown of water and a
//           wave rolling out along the ground at you); Lily Pad Swat (the pad hauled up overhead,
//           then swatted down in front of her, a spray off its rim); Splash Kick (her boot drawn
//           back, then kicked through her puddle, an arc of water flung at you).
//   else    hurt: a squeezed wince, a flinch away, her ears popping out a moment; after landing a
//           hit: a giggle behind her hand; hunting you: a determined grin, the pad held ready; low on
//           health: worried, a bead of sweat; a nap: squatting under her lily pad, dozing (her ears
//           and tail slip out while she sleeps); beaten: she goes up in smoke and leaves her leaf
//           (render/particles.js leafPoof, the game's own).
// Every effect is drawn here, live, in her own soft style: water in rounded drops with a soft blue
// line and a glint, splash crowns of round droplets, ripples, the poof a soft cloud of round puffs,
// sparkles the game's curvy stars, notes and z's soft rounded strokes.
import { dressRig } from './kidrig.js';
import {
  TAU, D2R, clamp, lerp, sstep, win, boing, ell, tone, rgba, paint, glow, smoothPath, drawShapes,
  SKIN, HAIR, COAT, BOOT, PAD, WATER, TAIL, HAIR_INK, COAT_INK, BOOT_INK,
  HS, HX, HY, hk, faceShapes, hairBack, hairFront, sideLock, hood, ears, leaf, yoke, panel, flap, coatBack, collar, cord, sleevePiece, bootShaft, bootFoot, tailShape, lilyPad, GRIP, PADC,
} from './art.js';

const SC = 1 / 3;
const WATER_INK = '#4e8ec0';
// A small steady hash.
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ---------- Her loose pieces, on the engine's soft springs ----------
const JOINTS = {
  coatF: [73, 98], coatN: [88, 98], coatB: [80, 101], flapF: [67.8, 111.4], flapN: [92.4, 111.4], colF: [78.4, 86.6], colN: [82.8, 86.6],
  cordF: [78, 89.6], cordN: [84.4, 89.8], tailJ: [77, 110], grip: GRIP,
  lockF: hk([-34.6, -16]), lockN: hk([35.4, -16]), leafJ: hk([9, -52]), hoodJ: hk([0, 28]),
};
const chestAng = (S) => (S.tilt ?? 0) + (S.pelvis ?? 0) + (S.waist ?? 0) + (S.chest ?? 0);
const SOFTS = [
  { name: 'coatF', parent: 'waistB', pivot: 'coatF', rot: (S, a) => (a.pk?.coatF ?? 0) * D2R, soft: { k: 92, c: 6.4, gain: 0.6, turn: 0.9, hang: 0.5, max: 12, dir: [-1, 10] } },
  { name: 'coatN', parent: 'waistB', pivot: 'coatN', rot: (S, a) => (a.pk?.coatN ?? 0) * D2R, soft: { k: 104, c: 6.6, gain: 0.6, turn: 0.9, hang: 0.5, max: 12, dir: [1, 10] } },
  { name: 'coatB', parent: 'torso', pivot: 'coatB', soft: { k: 84, c: 6.2, gain: 0.55, turn: 0.9, hang: 0.5, max: 10, dir: [0, 9] } },
  { name: 'flapF', parent: 'coatF', pivot: 'flapF', soft: { k: 170, c: 6, gain: 0.28, turn: 0.7, max: 22, dir: [0, 1.5] } },
  { name: 'flapN', parent: 'coatN', pivot: 'flapN', soft: { k: 185, c: 6, gain: 0.28, turn: 0.7, max: 22, dir: [0, 1.5] } },
  { name: 'colF', parent: 'chest', pivot: 'colF', soft: { k: 180, c: 7, gain: 0.2, turn: 0.7, max: 14, dir: [-1.5, 1] } },
  { name: 'colN', parent: 'chest', pivot: 'colN', soft: { k: 195, c: 7, gain: 0.2, turn: 0.7, max: 14, dir: [1.5, 1] } },
  { name: 'cordF', parent: 'chest', pivot: 'cordF', soft: { k: 62, c: 4.6, gain: 0.6, turn: 0.9, hang: 0.85, max: 24, dir: [0, 4] } },
  { name: 'cordN', parent: 'chest', pivot: 'cordN', soft: { k: 70, c: 4.8, gain: 0.6, turn: 0.9, hang: 0.85, max: 24, dir: [0, 4] } },
  { name: 'tailJ', parent: 'torso', pivot: 'tailJ', rot: (S, a) => (a.pk?.tailRot ?? 0), soft: { k: 58, c: 5, gain: 0.5, turn: 0.8, max: 16, flutter: 3, hz: 0.55, dir: [-6, 3] } },
  { name: 'padJ', parent: 'handF', pivot: 'grip', rot: (S, a) => (a.pk?.padR ?? 0) - (chestAng(S) + S.shF + S.elF + (S.hwF ?? 0)) * D2R, soft: { k: 78, c: 6.4, gain: 0.26, turn: 0.3, max: 14, flutter: 2, hz: 0.5, dir: [-2, -20] } },
  { name: 'hoodJ', parent: 'head', pivot: 'hoodJ', soft: { k: 140, c: 8, gain: 0.25, turn: 0.2, max: 4, dir: [0, -14] } },
  { name: 'lockF', parent: 'head', pivot: 'lockF', soft: { k: 90, c: 6, gain: 0.5, turn: 0.9, hang: 0.4, max: 12, flutter: 1.5, hz: 0.45, dir: [0, 6] } },
  { name: 'lockN', parent: 'head', pivot: 'lockN', soft: { k: 100, c: 6, gain: 0.5, turn: 0.9, hang: 0.4, max: 12, flutter: 1.5, hz: 0.52, dir: [0, 6] } },
  { name: 'leafJ', parent: 'head', pivot: 'leafJ', rot: (S, a) => (a.pk?.leafRot ?? 0), soft: { k: 120, c: 5, gain: 0.42, turn: 0.8, max: 22, flutter: 3, hz: 0.8, dir: [1, -3] } },
];
const SOFT_NAMES = SOFTS.map((p) => p.name);
// The frames: a bone's (its pivot joint at 0, 0, game px) entered in kid units.
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
// Where a point is now (rig space): kid units in a bone's frame, or head units.
const pointIn = (a, D, bone, [x, y]) => D.at(a, bone, [(x - D.J[PIVOT[bone]][0]) * SC, (y - D.J[PIVOT[bone]][1]) * SC]);
const headAt = (a, D, uv) => pointIn(a, D, 'head', hk(uv));
// A loose piece's own swing on its parent (radians).
const angOf = (M) => Math.atan2(M[1], M[0]);
const swingOf = (a, name, parent) => {
  const d = angOf(a.blMat(name)) - angOf(a.blMat(parent));
  return Math.atan2(Math.sin(d), Math.cos(d));
};

// ---------- Live pieces of her, by the base's parts ----------
function drawHood(ctx, a, mode, S, D) {
  const q = a.pk ?? {};
  ctx.save();
  headFrame(ctx, a, D);
  // (the hood's own little sway on its spring, about the back of her neck)
  ctx.translate(0, 28);
  ctx.rotate(swingOf(a, 'hoodJ', 'head') + (q.hoodTug ?? 0));
  ctx.translate(0, -28);
  hood(ctx, a, mode, q.hood ?? 0);
  ctx.restore();
}
function drawHead(ctx, a, mode, S, D) {
  const q = a.pk ?? {};
  ctx.save();
  headFrame(ctx, a, D);
  hairBack(ctx, a, mode);
  // (her ears pop up from behind her cap: their roots stay hidden in her hair)
  ears(ctx, a, mode, q.ears ?? 0, q.earWig ?? 0);
  drawShapes(ctx, a, mode, faceShapes(q.face ?? 'calm'), 6 / HS, SKIN.deep);
  // the side locks framing her cheeks, outside her eyes, each swinging from its root under the cap
  for (const [k, root, o, len] of [['lockF', [-34.6, -16], -1, 36], ['lockN', [35.4, -16], 1, 35]]) sideLock(ctx, a, mode, root, len, 10, o, swingOf(a, k, 'head') * 0.8);
  hairFront(ctx, a, mode);
  // the leaf pinned in her hair (popping up off its pin and springing back in the slip)
  ctx.save();
  ctx.translate(9, -52 - (q.leafPop ?? 0) * 10);
  ctx.rotate(0.38 + swingOf(a, 'leafJ', 'head'));
  leaf(ctx, a, mode);
  ctx.restore();
  ctx.restore();
}
function drawPad(ctx, a, mode, S, D) {
  ctx.save();
  enter(ctx, a, D, 'padJ');
  lilyPad(ctx, a, mode, a.pk?.padSpin ?? 0);
  ctx.restore();
}
function drawTailAndBack(ctx, a, mode, S, D) {
  const q = a.pk ?? {};
  if ((q.tail ?? 0) > 0.02) {
    ctx.save();
    enter(ctx, a, D, 'tailJ');
    tailShape(ctx, a, mode);
    ctx.restore();
  }
  ctx.save();
  enter(ctx, a, D, 'coatB');
  coatBack(ctx, a, mode);
  ctx.restore();
}
function drawCoat(ctx, a, mode, S, D) {
  for (const k of ['F', 'N']) {
    ctx.save();
    enter(ctx, a, D, `coat${k}`);
    panel(ctx, a, mode, k);
    ctx.restore();
    ctx.save();
    enter(ctx, a, D, `flap${k}`);
    flap(ctx, a, mode, k);
    ctx.restore();
  }
  ctx.save();
  enter(ctx, a, D, 'chest');
  yoke(ctx, a, mode);
  ctx.restore();
}
function drawCollar(ctx, a, mode, S, D) {
  for (const k of ['F', 'N']) {
    ctx.save();
    enter(ctx, a, D, `cord${k}`);
    const p = D.J[`cord${k}`];
    ctx.translate(p[0], p[1]);
    cord(ctx, a, mode, k === 'F' ? 9 : 10.4);
    ctx.restore();
  }
  for (const k of ['F', 'N']) {
    ctx.save();
    enter(ctx, a, D, `col${k}`);
    collar(ctx, a, mode, k);
    ctx.restore();
  }
}
function drawSleeve(ctx, a, mode, S, D, k) {
  for (const [bone, from, to, w0, w1] of [[`arm${k}u`, `sh${k}`, `el${k}`, 10.6, 9.6], [`arm${k}f`, `el${k}`, `wr${k}`, 9.6, 10.4]]) {
    ctx.save();
    D.frame(ctx, a, bone);
    sleevePiece(ctx, a, mode, D.loc(from, bone), D.loc(to, bone), w0, w1, k === 'N' ? COAT[1] : COAT[2], bone.endsWith('f'));
    ctx.restore();
  }
}
function drawBoot(ctx, a, mode, S, D, k) {
  ctx.save();
  enter(ctx, a, D, `shin${k}`);
  bootShaft(ctx, a, mode, k);
  ctx.restore();
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  bootFoot(ctx, a, mode, k);
  ctx.restore();
}

// ---------- Her act ----------
const PIECES = { stomp: 7.2, rain: 6.4, slip: 8.4, twirl: 6.2 };
const ORDER = ['stomp', 'rain', 'slip', 'twirl'];
const POOL = ['stomp', 'swat', 'kick'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

// Each frame, before the bones are placed: her act, her fight, her face and every live piece's state
// (a.pk). `out` is in the base's units (x, lift, hop in heights; fx, fy, drop in leg lengths).
function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const q = { face: null, look: null, hood: 0, hoodTug: 0, ears: 0, earWig: 0, tail: 0, tailRot: 0, leafPop: 0, leafRot: 0, padR: -0.12, padSpin: st.pkSpin ?? 0, coatF: 0, coatN: 0, puddle: 0, fx: [], splashes: [], sweat: -1, zz: 0, notes: 0, sparkle: -1, palm: 0, poof: -1, ring: -1, wave: -1, spray: -1, arc: -1, flicks: 0 };
  a.pk = q;
  const go = (p, k) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const add = (p, k) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + val * k;
  };
  const say = (f, k) => {
    if (k > 0.45) q.face = f;
  };
  const walking = clamp(a.walkW ?? 0, 0, 1);
  const alive = m.hp > 0;
  // At rest: the lily pad up over her far shoulder, her near hand loose at her side, a little rock
  // from foot to foot with the breath.
  const br = c.breath;
  go({ shF: 16 + br * 2, elF: -148, hwF: 10, shN: -6 + br * 1.5, elN: -14 - br, hwN: 6 }, 1 - walking * 0.7);
  q.padR = -0.1 + Math.sin(t * 0.9) * 0.05;
  // (walking: the pad rides on her shoulder, bobbing on its spring; her coat panels kicked by her
  // thighs as they swing)
  const u = a.blkidU ?? 0;
  q.coatF = Math.sin(u * TAU + Math.PI) * 7 * walking;
  q.coatN = Math.sin(u * TAU) * 7 * walking;

  // ----- The fight: a wind-up (m.windup) 0..1 through it, the blow (m.attackAt) after -----
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const wind = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  if (wind > 0) st.pkWindAt = now;
  const since = now - (m.attackAt ?? -9);
  const striking = since >= 0 && since < 1.0;
  if ((wind > 0 || striking) && alive) {
    if (!st.pkAtk) {
      const pool = m.def.moves ?? POOL;
      st.pkN = (st.pkN ?? m.uid ?? 0) + 1;
      st.pkMove = m.move ?? pool[st.pkN % pool.length];
    }
    st.pkAtk = true;
  } else st.pkAtk = false;
  const mvName = st.pkAtk ? st.pkMove : null;
  // (a blow with no wind-up before it, a bump up close: its wind-up played quickly first)
  const hadWind = now - (st.pkWindAt ?? -9) < Math.max(0, since) + 0.15;
  let W = wind;
  let s = striking ? since : -1;
  // (the wind-up pose is held into the blow and handed over to it as the blow snaps in, never
  // dropped in one frame)
  if (mvName && striking) {
    if (!hadWind) {
      W = since < 0.16 ? sstep(since / 0.16) : 1;
      s = since - 0.16;
    } else W = 1;
  }
  const busy = Boolean(mvName) || !alive;

  // ----- Her face and life outside the act -----
  const ago = a.hurtAgo ?? 9;
  const hurt = alive && ago >= 0 && ago < 0.6;
  const fighting = (m.aggroUntil ?? 0) > now;
  const napping = alive && (m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now));
  const cine = m.cine?.mood;
  const low = alive && m.hp < m.def.hp * 0.25 && !m.cine;

  // ----- The act (only while she stands about calm, eased in and out) -----
  const calmGoal = !busy && !napping && !m.pose && !m.cine && !hurt && !fighting && walking < 0.05 && alive ? 1 : 0;
  st.pkCalm = lerp(st.pkCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const cw = sstep(st.pkCalm);
  let PC = st.pkPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.pkOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.pkOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.pkOrd = (st.pkOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.pkPiece = PC;
  const piece = PC?.name ?? null;
  const pu = PC?.name ? now - PC.t0 : -1;
  // the puddle grows in while she stands about, and drains away as she walks on
  st.pkPud = lerp(st.pkPud ?? 0, walking < 0.3 && alive ? 1 : 0, ease(walking < 0.3 ? 0.7 : 1.6));
  q.puddle = st.pkPud;

  if (cw > 0.001 && piece === 'stomp') {
    const k = cw;
    const look = win(pu, 0, 0.5, 1.4, 1.8);
    go({ head: 12, neckR: 4, tilt: 3 }, look * k);
    say('down', look * k);
    // a crouch, then two hops, a crouch to take each landing
    const crouch = win(pu, 0.8, 1.2, 1.3, 1.45) + win(pu, 1.85, 1.95, 2.05, 2.3) * 0.8 + win(pu, 2.75, 2.85, 2.95, 3.3);
    go({ lift: -0.075, tilt: 7, head: 6, shN: 24, elN: -30, shF: -20 }, clamp(crouch, 0, 1) * k);
    for (const [h0, h1, ht] of [[1.42, 1.85, 0.17], [2.3, 2.75, 0.2]]) {
      if (pu >= h0 && pu <= h1) {
        const v = (pu - h0) / (h1 - h0);
        add({ hop: Math.sin(Math.PI * v) * ht }, k);
        go({ shN: -110, elN: -30, tilt: -4, head: -8, fyN: 0.18 * Math.sin(Math.PI * v), fyF: 0.22 * Math.sin(Math.PI * v), toeN: 18, toeF: 14 }, k * sstep(v / 0.25) * (1 - sstep((v - 0.75) / 0.25)));
      }
      if (pu >= h1 && pu < h1 + 0.9) q.splashes.push({ x: 0.5, t: pu - h1, big: ht > 0.18 ? 1.15 : 1 });
    }
    say('cheeky', win(pu, 0.8, 0.9, 1.4, 1.5) * k);
    say('happy', win(pu, 1.4, 1.5, 3.0, 3.1) * k);
    // giggling, bouncing on her toes, her tail wagging out from under her coat (she hasn't noticed)
    const gig = win(pu, 3.0, 3.2, 4.2, 4.5);
    add({ lift: Math.abs(Math.sin(pu * 11)) * 0.018 * gig, chest: Math.sin(pu * 11) * 3 * gig, head: Math.sin(pu * 11 - 0.6) * 4 * gig }, k);
    go({ shN: -60, elN: -110, hwN: -20 }, gig * k);
    say('giggle', gig * k);
    q.tail = Math.max(q.tail, win(pu, 2.9, 3.3, 4.4, 4.9) * k);
    q.tailRot += Math.sin(pu * 9) * 0.35 * win(pu, 3.2, 3.4, 4.3, 4.6);
    // the kick: her near boot swung back, then flicked forward through the water
    const back = win(pu, 4.6, 4.9, 4.95, 5.05);
    const kick = win(pu, 4.98, 5.1, 5.35, 5.9);
    go({ fxN: -0.35, fyN: 0.2, toeN: -10, tilt: 3, shN: 20 }, back * k);
    go({ fxN: 0.55, fyN: 0.42, toeN: 26, tilt: -7, shN: -40, shF: -30, head: -4 }, kick * k);
    if (pu > 5.0 && pu < 6.2) {
      q.arc = pu - 5.0;
      // (a playful little flick, not a throw: it stays by her)
      q.arcK = 0.45;
    }
    say('fierce', back * k);
    say('happy', win(pu, 5.0, 5.1, 6.6, 7.0) * k);
  }
  if (cw > 0.001 && piece === 'rain') {
    const k = cw;
    const up = win(pu, 0, 0.6, 5.0, 5.6);
    go({ head: -14, neckR: -4, chest: -2 }, up * k);
    say('up', up * k);
    // the palm held out under the drips
    const palm = win(pu, 0.7, 1.1, 3.0, 3.4);
    go({ shN: -58, elN: -40, hwN: -50 }, palm * k);
    q.palm = palm * k;
    say('happy', win(pu, 1.6, 1.7, 2.9, 3.0) * k);
    // the tongue out for one, the shiver as it lands
    const blep = win(pu, 3.3, 3.5, 4.0, 4.1);
    go({ head: -20, neckR: -6, tilt: -3 }, blep * k);
    say('blep', blep * k);
    const shiver = win(pu, 4.05, 4.12, 4.5, 4.7);
    add({ chest: Math.sin(pu * 50) * 2.4 * shiver, head: Math.sin(pu * 50 + 1) * 2 * shiver }, k);
    say('scrunch', shiver * k);
    // a happy shake of her head, the drips flicked off
    const shake = win(pu, 4.8, 5.0, 5.7, 6.0);
    add({ head: Math.sin(pu * 16) * 9 * shake, neckR: Math.sin(pu * 16 - 0.5) * 3 * shake }, k);
    say('happy', shake * k);
    if (shake > 0.3) q.flicks = shake * k;
    q.fx.push(['rainLook', up * k]);
  }
  if (cw > 0.001 && piece === 'slip') {
    const k = cw;
    // the nose twitching... ah... ah...
    const ah = win(pu, 0, 0.3, 0.85, 0.92);
    go({ head: -10 - Math.sin(pu * 10) * 2 * ah, neckR: -4, chest: -4, tilt: -3 }, ah * k);
    say(pu < 0.5 ? 'up' : 'scrunch', ah * k);
    // ACHOO
    const choo = win(pu, 0.9, 0.98, 1.1, 1.5);
    go({ head: 16, neckR: 5, chest: 6, tilt: 6, lift: -0.03, shN: -40, elN: -80 }, choo * k);
    say('scrunch', choo * k);
    if (pu >= 0.95 && pu < 2.3) q.poof = pu - 0.95;
    // poof: the hood flops back, the ears and the tail pop out, the leaf springs up off its pin
    const outW = sstep((pu - 1.0) / 0.35) * (1 - sstep((pu - 4.5) / 0.5));
    q.hood = Math.max(q.hood, outW * k);
    q.ears = Math.max(q.ears, clamp(boing(pu - 1.05, 8, 16), 0, 1.15) * (1 - sstep((pu - 4.6) / 0.45)) * k);
    q.tail = Math.max(q.tail, clamp(boing(pu - 1.1, 7, 14), 0, 1.1) * (1 - sstep((pu - 5.5) / 0.5)) * k);
    q.leafPop = Math.max(0, Math.sin(Math.PI * clamp((pu - 0.98) / 0.5, 0, 1))) * k;
    q.leafRot += Math.sin(clamp((pu - 0.98) / 0.9, 0, 1) * TAU * 1.5) * 0.6 * (1 - clamp((pu - 0.98) / 0.9, 0, 1)) * k;
    // frozen, then her eyes darting, a bead of sweat
    const frozen = win(pu, 1.3, 1.4, 2.3, 2.4);
    say('surprised', frozen * k);
    go({ shN: -30, elN: -60, shF: -54 }, win(pu, 1.3, 1.5, 3.7, 4.0) * k);
    const dart = win(pu, 2.4, 2.45, 3.7, 3.8);
    const left = Math.floor((pu - 2.4) / 0.32) % 2 === 1;
    say(left ? 'panicL' : 'panic', dart * k);
    add({ head: (left ? -4 : 4) * dart, neckR: (left ? -2 : 2) * dart }, k);
    if (pu > 2.4 && pu < 4.6) q.sweat = (pu - 2.4) / 2.2;
    // the hood yanked back up over her ears
    const yank = win(pu, 3.8, 4.1, 4.7, 5.0);
    go({ shN: -128, elN: -100, hwN: -30, head: 6, neckR: 3 }, yank * k);
    q.hoodTug = Math.sin(clamp((pu - 4.4) / 0.4, 0, 1) * Math.PI) * -0.12 * k;
    say('panic', yank * k);
    // the tail tucked away (a pat at her coat), then the whistle: nothing to see here
    const pat = win(pu, 5.0, 5.2, 5.6, 5.8);
    go({ shN: 30, elN: -20, hwN: 30, tilt: -3, head: 4 }, pat * k);
    say('cheeky', pat * k);
    const whistle = win(pu, 5.7, 5.9, 8.0, 8.4);
    add({ lift: Math.max(0, Math.sin(pu * 4)) * 0.012 * whistle, tilt: Math.sin(pu * 2) * 2 * whistle, head: -5 * whistle }, k);
    go({ shN: 18, elN: -24 }, whistle * k);
    say('whistle', whistle * k);
    q.notes = whistle * k;
    q.notesT = pu - 5.7;
  }
  if (cw > 0.001 && piece === 'twirl') {
    const k = cw;
    const lift = win(pu, 0.2, 0.6, 2.5, 2.9);
    go({ shF: -96, elF: -70, head: -10 }, lift * k);
    say('cheeky', win(pu, 0, 0.2, 0.6, 0.7) * k);
    say('up', win(pu, 0.6, 0.7, 2.5, 2.6) * k);
    // the pad spun on its stem, its drips flung off in a ring
    const spinW = win(pu, 0.6, 0.9, 2.2, 2.6);
    st.pkSpin = ((st.pkSpin ?? 0) + spinW * 9 * dt) % TAU;
    q.padSpin = st.pkSpin;
    if (spinW > 0.2) q.fling = spinW * k;
    // her own twirl: two quick mirror flips, a hop between
    const tw = pu >= 2.8 && pu < 3.6;
    q.twirl = tw && Math.floor((pu - 2.8) / 0.4) % 2 === 0;
    if (tw) add({ hop: Math.sin(Math.PI * ((pu - 2.8) / 0.8)) * 0.05, shN: -40, shF: 30 }, k);
    say('happy', win(pu, 2.7, 2.8, 3.6, 3.7) * k);
    // ta-da
    const ta = win(pu, 3.7, 3.95, 5.0, 5.6);
    go({ shN: -132, elN: -24, hwN: -30, tilt: -4, head: -6, neckR: -2, fxN: 0.18, toeN: 12, chest: -3 }, ta * k);
    say('smug', ta * k);
    if (pu > 3.85 && pu < 5.2) q.sparkle = pu - 3.85;
  }
  q.calm = cw;

  // (her own marks over her head: a "!" as she starts hunting you, a "?" when she loses you)
  if (fighting && alive && !st.pkHunt) st.pkBangAt = now;
  if (!fighting && st.pkHunt && alive) st.pkLostAt = now;
  st.pkHunt = fighting && alive;
  q.bang = now - (st.pkBangAt ?? -9);
  q.huh = now - (st.pkLostAt ?? -9);
  q.hurtT = hurt ? ago : -1;
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: a determined grin, the pad held ready -----
  if (fighting && alive && !hurt) {
    go({ shF: -70, elF: -80, tilt: 4, head: 4, lift: -0.015, shN: -30, elN: -50 }, 1 - walking * 0.5);
    q.face = 'fierce';
  }
  if (low && !busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.5) % 1;
  }
  // ----- The fight's moves -----
  if (mvName && alive) {
    // (wind-up: W 0..1; blow: s seconds since it lands)
    const sw = s >= 0 ? 1 - sstep((s - 0.42) / 0.45) : 0;
    const snap = s >= 0 ? sstep(s / 0.08) : 0;
    if (mvName === 'stomp') {
      go({ lift: 0.01, tilt: -7, head: -6, fyN: 0.6, fxN: 0.2, toeN: -12, shN: -96, elN: -30, shF: -70, elF: -60 }, sstep(W) * (1 - snap));
      say('fierce', W);
      go({ lift: -0.07, tilt: 9, head: 9, fyN: 0, fxN: 0.25, toeN: 0, shN: -20, elN: -60, shF: -10 }, snap * sw);
      say('shout', snap * sw);
      if (s >= 0 && s < 1.0) {
        q.splashes.push({ x: 2.6, t: s, big: 1.4 });
        q.wave = s;
      }
    } else if (mvName === 'swat') {
      go({ shF: -170, elF: -40, tilt: -10, head: -10, chest: -4, x: -0.02 }, sstep(W) * (1 - snap));
      q.padR += -1.4 * sstep(W) * (1 - snap);
      say('fierce', W);
      go({ shF: -40, elF: -10, tilt: 14, head: 8, chest: 6, x: 0.04, lift: -0.03, shN: 20 }, snap * sw);
      q.padR += 1.25 * snap * sw;
      say('shout', snap * sw);
      if (s >= 0.02 && s < 1.0) q.spray = s - 0.02;
    } else {
      go({ x: -0.03, fxN: -0.45, fyN: 0.25, toeN: -14, tilt: 4, shN: -50, shF: -60, head: 2 }, sstep(W) * (1 - snap));
      say('aim', W);
      go({ x: 0.01, fxN: 0.7, fyN: 0.45, toeN: 30, tilt: -9, head: -6, shN: 30, shF: 20, elN: -30 }, snap * sw);
      say('shout', snap * sw);
      if (s >= 0 && s < 1.1) q.arc = s;
    }
  }
  // (her coat's front panels pushed forward by a knee that lifts or a leg that kicks out under them)
  q.coatN -= clamp((out.fyN ?? 0) * 46 + Math.max(0, out.fxN ?? 0) * 26, 0, 34);
  q.coatF -= clamp((out.fyF ?? 0) * 46 + Math.max(0, out.fxF ?? 0) * 26, 0, 30);
  // (eased like the leg under it, so a panel never jumps; the pad's turn on its stem eased too)
  for (const key of ['coatF', 'coatN']) {
    st[`pk_${key}`] = lerp(st[`pk_${key}`] ?? q[key], q[key], ease(18));
    q[key] = st[`pk_${key}`];
  }
  // ----- Hurt: a squeezed wince, a flinch away, her ears popping out a moment -----
  if (hurt && !mvName) {
    const k = sstep(1 - ago / 0.6);
    go({ tilt: -12, head: 12, neckR: 4, shN: -70, elN: -120, hwN: -20, lift: -0.02 }, k);
    q.face = 'hurt';
    q.ears = Math.max(q.ears, Math.sin(Math.PI * clamp(ago / 0.6, 0, 1)) * 0.75);
    q.hood = Math.max(q.hood, Math.sin(Math.PI * clamp(ago / 0.6, 0, 1)) * 0.12);
  }
  // ----- After landing a hit: a giggle behind her hand -----
  const gl = now - (m.gloatAt ?? -9);
  // (eased in as a blow's own pose lets go, never jumped to as the blow ends)
  const moveW = mvName ? (s >= 0 ? 1 - sstep((s - 0.42) / 0.45) : 1) : 0;
  if (gl >= 0 && gl < 1.1 && alive && !hurt) {
    const k = win(gl, 0, 0.15, 0.85, 1.1) * (1 - moveW);
    go({ shN: -78, elN: -120, hwN: -30, head: -4, chest: Math.sin(gl * 28) * 3 }, k);
    say('giggle', k);
  }
  // ----- A nap: squatting under her lily pad, dozing; her ears and tail slip out -----
  st.pkNap = lerp(st.pkNap ?? 0, napping && !busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.pkNap);
  if (nw > 0.001) {
    const nod = Math.sin(now * 1.6);
    go({ lift: -0.12, tilt: 3, waist: 2, chest: 3, head: 15 + nod * 3, neckR: 4, shN: -40, elN: -80, hwN: 20, shF: 10, elF: -140, fxN: 0.14, fxF: -0.08 }, nw);
    q.padR += 0.25 * nw;
    q.ears = Math.max(q.ears, 0.55 * nw);
    q.tail = Math.max(q.tail, 0.8 * nw);
    q.tailRot += Math.sin(now * 0.8) * 0.15 * nw;
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
    }
  }
  // ----- Scenes -----
  if (alive && !busy && !hurt) {
    if (cine === 'happy') q.face = 'happy';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'fierce';
    else if (cine === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 7) % VOWELS.length];
  }
  if (!alive) q.face = 'dizzy';
  // ----- The face: an in-between (a blink) on every change; her own blink rhythm -----
  let f = q.face ?? (walking > 0.3 ? 'calm' : 'calm');
  if (f !== st.pkFace) {
    st.pkFaceFrom = st.pkFace;
    st.pkFace = f;
    st.pkFaceAt = now;
  }
  const since0 = now - (st.pkFaceAt ?? -9);
  const SHUT = new Set(['happy', 'giggle', 'shout', 'blep', 'hurt', 'scrunch', 'sleep', 'shut', 'dizzy']);
  if (since0 >= 0 && since0 < 0.07 && st.pkFaceFrom && !SHUT.has(f) && !SHUT.has(st.pkFaceFrom)) f = 'blink';
  const bl = (now + (m.uid ?? 0) * 0.83) % 3.9;
  if (bl < 0.12 && !SHUT.has(f) && f !== 'blink' && f !== 'dizzy') f = 'blink';
  q.faceShown = f;
  q.face = f;
  // (the hood, ears and tail eased so nothing ever snaps)
  for (const key of ['hood', 'ears', 'tail']) {
    const cur = st[`pk_${key}`] ?? 0;
    st[`pk_${key}`] = lerp(cur, q[key], ease(key === 'ears' ? 26 : 16));
    q[key] = st[`pk_${key}`];
  }
  // the tail swung out from hanging hidden behind her coat
  q.tailRot += lerp(1.15, 0, sstep(q.tail));
  st.pkPadR = lerp(st.pkPadR ?? q.padR, q.padR, ease(16));
  q.padR = st.pkPadR;
  st.pkTwirl = Boolean(q.twirl);
}

// ---------- Live effects (rig space, game px, her feet at 0, 0) ----------
// A water drop: round at the bottom, a soft point on top (rounded), a soft blue line, a glint.
function drop(ctx, a, x, y, r, al, rot = 0) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(0, -r * 2.1);
  ctx.bezierCurveTo(r * 0.35, -r * 1.5, r * 1.05, -r * 0.6, r, 0);
  ctx.arc(0, 0, r, 0, Math.PI);
  ctx.bezierCurveTo(-r * 1.05, -r * 0.6, -r * 0.35, -r * 1.5, 0, -r * 2.1);
  ctx.closePath();
  ctx.lineWidth = Math.max(0.3, r * 0.4);
  ctx.strokeStyle = WATER_INK;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = tone(a, WATER[2]);
  ctx.fill();
  ell(ctx, r * 0.15, r * 0.25, r * 0.6, r * 0.5);
  ctx.fillStyle = tone(a, WATER[3]);
  ctx.fill();
  ell(ctx, -r * 0.38, -r * 0.4, r * 0.3, r * 0.42, -0.4);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
// A round droplet (in flight).
function bead(ctx, a, x, y, r, al) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.lineWidth = Math.max(0.3, r * 0.45);
  ctx.strokeStyle = WATER_INK;
  ctx.stroke();
  ctx.fillStyle = tone(a, WATER[2]);
  ctx.fill();
  ell(ctx, x - r * 0.3, y - r * 0.3, r * 0.4, r * 0.35);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
// A ripple ring on the ground (flat), u 0..1 spreading.
function ripple(ctx, x, y, u, size, al) {
  if (u < 0 || u > 1 || al <= 0.01) return;
  const rx = 0.6 + sstep(u) * size;
  ctx.save();
  ctx.globalAlpha *= al * (1 - u) * (1 - u * 0.3);
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = '#ffffff';
  ell(ctx, x, y, rx, rx * 0.28);
  ctx.stroke();
  ctx.globalAlpha *= 0.6;
  ctx.strokeStyle = WATER[3];
  ell(ctx, x, y + 0.35, rx * 0.92, rx * 0.26);
  ctx.stroke();
  ctx.restore();
}
// A splash crown: a ring of round droplet-petals springing up out of the water and falling back,
// beads flung off their tips. t seconds since it landed; `big` its size.
function crown(ctx, a, x, t, big) {
  if (t < 0 || t > 0.9) return;
  const u = t / 0.9;
  const rise = Math.sin(Math.PI * clamp(t / 0.55, 0, 1));
  const n = 7;
  for (let i = 0; i < n; i++) {
    const side = (i / (n - 1)) * 2 - 1;
    const sx = x + side * (2.6 + sstep(u) * 4.4) * big;
    const h = (3 + 3.4 * (1 - Math.abs(side) * 0.55)) * rise * big;
    if (h > 0.3) {
      // a petal of water: a rounded tongue leaning out
      ctx.save();
      ctx.translate(sx, -0.2);
      ctx.rotate(side * 0.55);
      // (a rounded tongue: wide at its foot, a round cap on top, never a point)
      const rw = 1.05 * big;
      ctx.beginPath();
      ctx.moveTo(-rw, 0);
      ctx.bezierCurveTo(-rw, -h * 0.55, -rw * 0.8, -h + rw * 0.9, 0, -h);
      ctx.bezierCurveTo(rw * 0.8, -h + rw * 0.9, rw, -h * 0.55, rw, 0);
      ctx.closePath();
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = WATER_INK;
      ctx.globalAlpha *= 1 - sstep((u - 0.6) / 0.4);
      ctx.stroke();
      ctx.fillStyle = tone(a, i % 2 ? WATER[1] : WATER[2]);
      ctx.fill();
      ell(ctx, -0.25 * big, -h * 0.6, 0.3 * big, h * 0.18);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    }
    // a bead thrown off each tip
    const bu = clamp((t - 0.08) / 0.7, 0, 1);
    if (bu > 0 && bu < 1) {
      const vx = side * (9 + (i % 3) * 3) * big;
      const by = -(16 + (i % 2) * 6) * big * bu + 34 * big * bu * bu;
      bead(ctx, a, sx + vx * bu, Math.min(-0.3, by - 2 * big), 0.75 * big * (1 - bu * 0.4), 1 - sstep((bu - 0.7) / 0.3));
    }
  }
  ripple(ctx, x, -0.3, clamp(t / 0.8, 0, 1), 9 * big, 1);
  ripple(ctx, x, -0.3, clamp((t - 0.18) / 0.7, 0, 1), 6 * big, 0.8);
}
// The curvy sparkle star.
function sparkle(ctx, x, y, r, al, col = '#ffffff') {
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
  ctx.strokeStyle = '#8fb8e8';
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}
// The poof of her disguise slipping: a soft cloud of round puffs bursting out round her head and
// breaking up into little ones, a few sparkles.
function poof(ctx, a, x, y, t) {
  if (t < 0 || t > 1.35) return;
  const u = t / 1.35;
  const grow = 1 - (1 - clamp(t / 0.35, 0, 1)) ** 3;
  const fade = 1 - sstep((u - 0.45) / 0.55);
  const n = 8;
  for (const pass of ['line', 'fill']) {
    for (let i = 0; i < n; i++) {
      const an = (i / n) * TAU + 0.4;
      const d = (7 + 5 * grow + u * 4) * (0.85 + (i % 3) * 0.12);
      const r = (2.4 + (i % 2) * 1.2) * (0.5 + grow * 0.6) * (1 - u * 0.5);
      const px = x + Math.cos(an) * d;
      const py = y + Math.sin(an) * d * 0.55 - u * 4 - Math.max(0, Math.sin(an)) * d * 0.2;
      ctx.save();
      ctx.globalAlpha *= fade;
      ell(ctx, px, py, r, r);
      if (pass === 'line') {
        ctx.lineWidth = 0.9;
        ctx.strokeStyle = '#b6a8cc';
        ctx.stroke();
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ell(ctx, px + r * 0.2, py + r * 0.3, r * 0.7, r * 0.5);
        ctx.fillStyle = '#ece6f6';
        ctx.fill();
      }
      ctx.restore();
    }
  }
  for (let i = 0; i < 4; i++) {
    const an = (i / 4) * TAU + 1;
    const d = 6 + grow * 8 + u * 4;
    sparkle(ctx, x + Math.cos(an) * d, y + Math.sin(an) * d * 0.8 - u * 6, 1.6 * Math.sin(Math.PI * clamp(u * 1.6 - i * 0.08, 0, 1)), 1);
  }
}
// A soft rounded music note, and a soft rounded z.
function note(ctx, x, y, s, al, fl = false) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(fl ? -s : s, s);
  for (const pass of ['line', 'fill']) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 1.4, 1.05, -0.35, 0, TAU);
    ctx.moveTo(1.1, -0.3);
    ctx.lineTo(1.1, -4.4);
    ctx.quadraticCurveTo(2.4, -3.6, 2.6, -2.2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (pass === 'line') {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#6a8ad0';
      ctx.stroke();
    } else {
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = '#d8ecff';
      ctx.stroke();
      ctx.fillStyle = '#d8ecff';
      ctx.fill();
    }
  }
  ctx.restore();
}
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
  ctx.strokeStyle = '#8a92c8';
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = '#f0f2ff';
  ctx.stroke();
  ctx.restore();
}

// A thought bubble over her head with a soft rounded mark in it ('!' or '?'), popping in with a
// little overshoot, held, then shrinking away.
function bubble(ctx, x, y, mark, e, dur, fl = false) {
  const k = Math.max(0, boing(e, 9, 18)) * (1 - sstep((e - dur + 0.25) / 0.25));
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  // (marks read the right way round whichever way she faces)
  ctx.scale(fl ? -k : k, k);
  for (const pass of ['line', 'fill']) {
    smoothPath(ctx, [[-5.4, -5], [5.4, -5.2], [5.8, 3.4], [1.2, 4.6], [-0.4, 7.2], [-1.6, 4.6], [-5.6, 3.4]]);
    if (pass === 'line') {
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = '#7aa6d8';
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }
  ctx.lineCap = 'round';
  ctx.strokeStyle = mark === '!' ? '#ff6f96' : '#8f7cc4';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0, -3);
    ctx.lineTo(0, 0.4);
  } else {
    ctx.moveTo(-1.5, -1.8);
    ctx.quadraticCurveTo(-1.2, -3.6, 0.4, -3.4);
    ctx.quadraticCurveTo(2, -3, 1.4, -1.4);
    ctx.quadraticCurveTo(0.4, -0.6, 0.2, 0.6);
  }
  ctx.stroke();
  ell(ctx, mark === '!' ? 0 : 0.2, 2.4, 0.85, 0.85);
  ctx.fill();
  ctx.restore();
}

// Under everything: her puddle and the ripples on it; the rings her boots leave as she walks.
function under2(ctx, m, a, S, matOf, D) {
  // (every loose piece swung once a frame, drawn or not, so none of them ever skips time)
  for (const n of SOFT_NAMES) a.blMat(n);
  const q = a.pk ?? {};
  const st = a.mo.rig ?? {};
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.71;
  const base = ctx.globalAlpha;
  const w = q.puddle ?? 0;
  if (w > 0.02) {
    const rx = 13.5 * sstep(w);
    ctx.save();
    // the water: a soft uneven pool, deeper in the middle
    const pool = (sx, sy, k) => {
      ctx.beginPath();
      for (let i = 0; i <= 28; i++) {
        const an = (i / 28) * TAU;
        const r = rx * k * (1 + Math.sin(an * 3 + 0.6) * 0.06 + Math.sin(an * 5 + 2) * 0.03);
        const px = sx + Math.cos(an) * r;
        const py = sy + Math.sin(an) * r * 0.16;
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.closePath();
    };
    pool(0.5, -0.5, 1);
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = rgba(WATER[4], 0.8 * base);
    ctx.stroke();
    ctx.fillStyle = rgba(WATER[2], 0.85 * base);
    ctx.fill();
    ctx.save();
    ctx.clip();
    pool(0.8, -0.3, 0.72);
    ctx.fillStyle = rgba(WATER[3], 0.55 * base);
    ctx.fill();
    // the boots mirrored in it
    for (const k of ['F', 'N']) {
      const [fx, fy] = pointIn(a, D, `foot${k}`, [k === 'F' ? 75 : 89, 146]);
      const up = clamp(-fy / 3, 0, 1);
      ctx.globalAlpha = base * 0.55 * (1 - up);
      ell(ctx, fx, 0.4, 3.4, 0.6);
      ctx.fillStyle = k === 'F' ? BOOT[3] : BOOT[2];
      ctx.fill();
    }
    // a slow shimmer sliding across
    for (const [x0, sp, ph, ww] of [[-5, 0.6, 0, 4.2], [7, 0.8, 2, 2.8]]) {
      ctx.globalAlpha = base * (0.5 + 0.25 * Math.sin(t * 1.3 + ph));
      ell(ctx, x0 * w + Math.sin(t * sp + ph) * 2.2, -0.9, ww * w, 0.3);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.restore();
    ctx.restore();
    ctx.globalAlpha = base;
    // drips landing in it: a ring each
    for (let i = 0; i < 3; i++) {
      const P = 1.4 + i * 0.27;
      const k = (t + i * 0.53) / P;
      const n = Math.floor(k);
      const uu = ((k - n) * P) / 0.9;
      ripple(ctx, (-9 + hash(n * 3 + i) * 18) * w, -0.6 + hash(n * 7 + i) * 0.4, uu, 3.2 * w, w);
    }
  }
  // drips swelling (behind her: they fall from the pad's far rim) at two points of the pad's rim and falling off to the ground
  const rimPts = [[PADC[0] - 30, PADC[1] + 8], [PADC[0] + 24, PADC[1] + 10]];
  rimPts.forEach((p, i) => {
    const [tx, ty] = pointIn(a, D, 'padJ', p);
    const P = 2.2 + i * 0.7;
    const f = ((((t + i * 1.3) % P) + P) % P) / P;
    const swell = 0.62;
    const r = 0.3 + 0.55 * sstep(f / swell);
    let y = ty + r;
    if (f > swell) y += 0.5 * 260 * ((f - swell) * P) ** 2;
    if (y < -0.5) drop(ctx, a, tx, y, r, 1);
    else if (y < 7) {
      const uu = y / 7;
      for (const d of [-1, 1]) bead(ctx, a, tx + d * (0.6 + uu * 2.2), -Math.sin(uu * Math.PI) * 1.8 - 0.2, 0.4 * (1 - uu * 0.5), 1 - uu);
    }
  });
  // the rings her boots leave as they plant (kept where they landed as she walks on)
  const sx = a.flip ? -1 : 1;
  const wx = sx * (m.x ?? 0);
  st.pkRings ??= [];
  const walking = a.walkW ?? 0;
  const u = a.blkidU ?? 0;
  for (const [k, ph] of [['N', 0], ['F', 0.5]]) {
    const qq = (((u + ph) % 1) + 1) % 1;
    const key = `pkPl${k}`;
    const planted = qq < 0.3;
    if (planted && !st[key] && walking > 0.4) {
      const [fx] = pointIn(a, D, `foot${k}`, [k === 'F' ? 75 : 89, 146]);
      st.pkRings.push({ x: fx + wx, at: a.now ?? 0 });
    }
    st[key] = planted;
  }
  st.pkRings = st.pkRings.filter((r) => (a.now ?? 0) - r.at < 0.8 && (a.now ?? 0) >= r.at);
  for (const r of st.pkRings) {
    const age = (a.now ?? 0) - r.at;
    ripple(ctx, r.x - wx, -0.3, age / 0.8, 4.4, 0.9);
    if (age < 0.35) for (const d of [-1, 1]) bead(ctx, a, r.x - wx + d * (1.4 + age * 8), -Math.sin(Math.PI * (age / 0.35)) * 2.2 - 0.3, 0.45, 1 - age / 0.35);
  }
  ctx.globalAlpha = base;
}

// Over everything: drips off her lily pad, the rain into her palm, splashes, the poof, the sweat,
// the notes, the z's, the sparkles.
function fx(ctx, m, a, S, matOf, D) {
  const q = a.pk ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.37;
  if (m.hp <= 0) return;
  // the drips she catches in her palm
  if ((q.palm ?? 0) > 0.05) {
    const [px, py] = pointIn(a, D, 'handN', [96, 112]);
    for (let i = 0; i < 2; i++) {
      const P = 0.85;
      const f = ((((t + i * 0.42) % P) + P) % P) / P;
      if (f < 0.45) drop(ctx, a, px + i * 1.3 - 0.6, py - 2 - 16 * (1 - (f / 0.45) ** 2), 0.55, q.palm);
      else {
        const uu = (f - 0.45) / 0.55;
        for (const d of [-1, 1]) bead(ctx, a, px + i * 1.3 - 0.6 + d * (0.5 + uu * 1.8), py - 2 - Math.sin(uu * Math.PI) * 1.6, 0.35, q.palm * (1 - uu));
      }
    }
  }
  // looking up at the drizzle: a few drops falling past her face toward her
  for (const [name, w] of q.fx ?? []) {
    if (name !== 'rainLook' || w < 0.05) continue;
    const [hx, hy] = headAt(a, D, [10, -20]);
    for (let i = 0; i < 3; i++) {
      const f = (t * 0.9 + i / 3) % 1;
      drop(ctx, a, hx - 6 + i * 6 + hash(i + Math.floor(t * 0.9 + i / 3)) * 3, hy - 20 + f * 18, 0.5, w * Math.sin(Math.PI * f));
    }
  }
  // the drips flicked off as she shakes her head
  if ((q.flicks ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [0, -10]);
    for (let i = 0; i < 5; i++) {
      const f = (t * 2.4 + i / 5) % 1;
      const an = -Math.PI * 0.95 + (i / 4) * Math.PI * 0.9;
      bead(ctx, a, hx + Math.cos(an) * (6 + f * 8), hy + Math.sin(an) * (6 + f * 6) + f * f * 6, 0.5, q.flicks * (1 - f));
    }
  }
  // splashes in the puddle (hops, the stomp)
  for (const sp of q.splashes ?? []) crown(ctx, a, sp.x, sp.t, sp.big);
  // the stomp's wave: a rounded crest of water rolling out along the ground at you, foam on top
  if ((q.wave ?? -1) >= 0) {
    const s = q.wave;
    const uu = clamp(s / 0.75, 0, 1);
    const x = 4 + (1 - (1 - uu) ** 2) * 30;
    const h = Math.sin(Math.PI * clamp(s / 0.75, 0, 1)) * 5;
    if (h > 0.2) {
      ctx.save();
      ctx.globalAlpha = base * (1 - sstep((uu - 0.7) / 0.3));
      ctx.beginPath();
      ctx.moveTo(x - 9, 0);
      ctx.quadraticCurveTo(x - 4, -h * 0.4, x - 1, -h);
      ctx.quadraticCurveTo(x + 2.4, -h * 1.1, x + 2.6, -h * 0.5);
      ctx.quadraticCurveTo(x + 2.4, 0, x + 4, 0);
      ctx.closePath();
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = WATER_INK;
      ctx.stroke();
      ctx.fillStyle = tone(a, WATER[2]);
      ctx.fill();
      ell(ctx, x - 0.4, -h * 0.9, 2, 0.8);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
      for (let i = 0; i < 3; i++) bead(ctx, a, x + 1 + i * 1.6, -h - 1.2 - i * 0.9 + uu * 2, 0.5, 1 - uu);
    }
    ripple(ctx, x - 2, -0.2, uu, 6, 0.8);
  }
  // the swat's spray: drops thrown forward and down off the pad's rim
  if ((q.spray ?? -1) >= 0 && q.spray < 0.9) {
    const s = q.spray;
    const [px, py] = pointIn(a, D, 'padJ', [PADC[0] + 30, PADC[1] + 6]);
    if (!a.mo.pkSprayAt || s < 0.03) a.mo.pkSprayAt = [px, py];
    const [ox, oy] = a.mo.pkSprayAt;
    for (let i = 0; i < 7; i++) {
      const uu = clamp((s - i * 0.02) / 0.7, 0, 1);
      const vx = 16 + (i % 3) * 6;
      const vy = -8 - (i % 2) * 6;
      const x = ox + vx * uu * 1.4;
      const y = Math.min(-0.3, oy + vy * uu + 40 * uu * uu);
      if (y >= -0.4 && uu > 0.2) crown(ctx, a, x, (uu - 0.2) * 0.4, 0.4);
      else bead(ctx, a, x, y, 0.7 - (i % 3) * 0.1, 1 - sstep((uu - 0.8) / 0.2));
    }
    crown(ctx, a, ox + 3, s, 0.8);
  } else a.mo.pkSprayAt = null;
  // the kick's arc of water flung forward off her toe
  if ((q.arc ?? -1) >= 0 && q.arc < 1.1) {
    const s = q.arc;
    const [bx] = pointIn(a, D, 'footN', [97, 140]);
    if (!a.mo.pkArcAt || s < 0.03) a.mo.pkArcAt = bx;
    const ox = a.mo.pkArcAt;
    for (let i = 0; i < 9; i++) {
      const uu = clamp((s - i * 0.025) / 0.85, 0, 1);
      if (uu <= 0) continue;
      const vx = (18 + (i % 4) * 5) * (q.arcK ?? 1);
      const vy = (-14 - (i % 3) * 5) * (0.6 + 0.4 * (q.arcK ?? 1));
      const x = ox + vx * uu * 1.3;
      const y = -1 + vy * uu * 1.2 + 32 * uu * uu;
      if (y > -0.3) {
        ripple(ctx, x, -0.2, (uu - 0.6) / 0.4, 2.6, 0.9);
        continue;
      }
      if (i % 3 === 0) drop(ctx, a, x, y, 0.75, 1 - sstep((uu - 0.85) / 0.15), Math.atan2(vy + 64 * uu, vx) + Math.PI / 2);
      else bead(ctx, a, x, y, 0.6, 1 - sstep((uu - 0.85) / 0.15));
    }
  } else a.mo.pkArcAt = null;
  // the lily pad spun: drips flung off its rim in a ring
  if ((q.fling ?? 0) > 0.05) {
    const [cx, cy] = pointIn(a, D, 'padJ', PADC);
    for (let i = 0; i < 6; i++) {
      const f = (t * 1.8 + i / 6) % 1;
      const an = (i / 6) * TAU + q.padSpin;
      const r = 11 + f * 10;
      bead(ctx, a, cx + Math.cos(an) * r, cy + Math.sin(an) * r * 0.36 + f * f * 10, 0.55, q.fling * (1 - f));
    }
  }
  // the poof of her disguise slipping
  if ((q.poof ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [0, -46]);
    poof(ctx, a, hx, hy, q.poof);
  }
  // a bead of sweat by her temple
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [38, -18]);
    const f = q.sweat % 1;
    drop(ctx, a, hx, hy + sstep(f) * 6, 0.9, Math.sin(Math.PI * f));
  }
  // whistling: little notes floating up off her lips
  if ((q.notes ?? 0) > 0.05) {
    const [mx, my] = headAt(a, D, [10, 22]);
    for (let i = 0; i < 2; i++) {
      const f = ((q.notesT ?? 0) * 0.7 + i * 0.5) % 1;
      note(ctx, mx + 3 + f * 7 + Math.sin(f * 6 + i) * 1.2, my - 2 - f * 10, 0.7, q.notes * Math.sin(Math.PI * f), a.flip);
    }
  }
  // asleep: soft z's drifting up
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [24, -46]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.45 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip);
    }
  }
  // her marks: "!" (hunting you), "?" (lost you), a happy note after landing a hit, drops shaken
  // off her head when hit
  const [bx, by] = headAt(a, D, [34, -74]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip);
  if (q.gloatT >= 0 && q.gloatT < 1.0) {
    const e = q.gloatT;
    note(ctx, bx - 2 + e * 6, by + 6 - e * 9 - Math.abs(Math.sin(e * 12)) * 1.5, 0.75, Math.min(1, (1 - e) * 4) * sstep(e / 0.1), a.flip);
    sparkle(ctx, bx - 8, by + 10 - e * 4, 1.4 * Math.sin(Math.PI * e), 1, '#fff4b0');
  }
  if (q.hurtT >= 0 && q.hurtT < 0.5) {
    const [hx, hy] = headAt(a, D, [0, -40]);
    for (let i = 0; i < 4; i++) {
      const e = q.hurtT / 0.5;
      const an = -Math.PI * 0.85 + (i / 3) * Math.PI * 0.7;
      bead(ctx, a, hx + Math.cos(an) * (5 + e * 8), hy + Math.sin(an) * (4 + e * 6) + e * e * 8, 0.55, 1 - e);
    }
  }
  // ta-da: sparkles round her raised hand
  if ((q.sparkle ?? -1) >= 0) {
    const [px, py] = pointIn(a, D, 'handN', [95, 112]);
    for (let i = 0; i < 4; i++) {
      const f = clamp(q.sparkle * 1.3 - i * 0.18, 0, 1);
      const an = -Math.PI / 2 + (i - 1.5) * 0.9;
      sparkle(ctx, px + Math.cos(an) * (3 + f * 5), py + Math.sin(an) * (3 + f * 5), (i % 2 ? 1.2 : 1.8) * Math.sin(Math.PI * f), 1, i % 2 ? '#fff4b0' : '#ffffff');
    }
  }
  ctx.globalAlpha = base;
}

const DRESS = {
  skin: SKIN,
  liveHead: true,
  noMoves: true,
  joints: JOINTS,
  softParts: SOFTS,
  under2,
  under: {
    armFu: drawPad,
    armFf: drawHood,
    legF: drawTailAndBack,
  },
  // (her sleeves draw her arms whole: the base's own arm skin is left out, so its shoulder never
  // shows above a sleeve)
  hide: ['armF', 'armN'],
  over: {
    armFf: (ctx, a, mode, S, D) => drawSleeve(ctx, a, mode, S, D, 'F'),
    footFskin: (ctx, a, mode, S, D) => drawBoot(ctx, a, mode, S, D, 'F'),
    footNskin: (ctx, a, mode, S, D) => drawBoot(ctx, a, mode, S, D, 'N'),
    torsoSkin: drawCoat,
    neckSkin: drawCollar,
    head: drawHead,
    armNf: (ctx, a, mode, S, D) => drawSleeve(ctx, a, mode, S, D, 'N'),
  },
  pose,
  fx,
};

const R = dressRig(DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  a.m = m;
  // (her twirl: clean mirror flips at each half turn, never a squeeze)
  const st = a.mo.rig;
  const flip0 = a.flip;
  if (st?.pkTwirl && m.hp > 0) a.flip = !a.flip;
  draw0(ctx, m, a);
  a.flip = flip0;
};
// (her box: the hood and the lily pad over her head, the coat's hem)
rig.w = Math.round(rig.w * 1.0);
rig.h = Math.round(rig.h * 1.1);
// (`noHop`: none of the monster drawer's little hops or idle notes over her; she shows her moods in
// her own act and face. `ownEmotes`: the drawer's marks over her head (!, ?, the anger mark, the hurt
// drop, the sweat, z's, the gloat note) left to her, drawn here in her own style.)
export const PUDDLE_KID_ART = { pad: 10, walk: 8, idle: 8, attack: 5, stride: R.stride, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const PUDDLE_KID_SIZE = { w: 26, h: Math.round(R.H * 1.12) };
export const PUDDLE_KID_DRESS = DRESS;
