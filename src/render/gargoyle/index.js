// The Gargoyle Kid on screen (2026-11-26, rebuilt from scratch to the new standard, keeping her idea; the
// id stays `gloombat`). An impish little gargoyle from the Twilight Ruins' gutters, up on the Temple
// Roof: moss-green bob cut blunt like a statue's, little stone horns, heavy stone bat wings, a stone tail
// with a round spade, stone boots, a plum smock with moss on its hem; she turns to stone for fun. Her
// look is in art.js; she moves on her own copy of the kid base's rig (kidrig.js: its bones and springs;
// the base's own moves left out), every loose piece on the engine's soft-layer springs (both wings and
// their outer scallops, each easing into its limit; the two tail pieces; the smock's three panels; her
// two side locks).
//   flying  she always flies (the game counts a flyer as always moving; her motion goes by her own
//           travel): hovering, slow heavy beats (a hard downstroke, a slow recovery), legs dangling and
//           swinging; moving, two beats then a sinking glide, wings held out, legs trailing.
//   idle    her act, in four pieces, the next one that fits the time she has before she moves on
//           (data: `rest`; world/mobs.js tells her, `m.restUntil`):
//           - raspberry (6.0 s): she spots you, thumbs to her temples, fingers waggling, and blows a
//             raspberry; a fit of giggles, kicking her boots;
//           - statue (9.0 s): a fierce gargoyle pose (wings high, claws out, a growl), and she FREEZES
//             into stone, dust crumbling off; her wings stopped, she starts to sink; she cracks out in a
//             shower of chips, flaps like mad to climb back up, and laughs about it;
//           - stretch (7.0 s): a huge wing stretch, both arms up, a yawn; a shake from horns to tail;
//           - tail (7.0 s): she catches her own tail, twirls the spade like a baton, smug, and lets it
//             spring back.
//   moves   Horn Dive (rearing back, wings high, horns lowered; then a dive at you horns first, wings
//           swept back, a puff of dust where she lands it); Gutter Spout (she leans back and puffs her
//           cheeks full of rainwater; then spouts a stream of it at you, like the temple's rain spouts);
//           Stone Drop (she flies up, tucks in and turns to stone; then drops like a rock, THUD, a ring
//           of dust and pebbles; she cracks out and flaps back up).
//   else    hurt: a squeezed wince, a flinch, her wings jolted in, a few chips off her; after landing
//           a hit: a quick raspberry; hunting you: a fang grin, claws ready; low on health: worried, a
//           bead of sweat; a nap: wings wrapped round her like a bat, knees hugged; beaten: dizzy, her
//           wings stopped. Her marks over her head (!, ?, z's, sweat) are her own (`ownEmotes`).
// Every effect is drawn here, live, in her own soft style: dust as soft lilac-grey puffs, chips and
// pebbles as round stones, rainwater as round drops with a soft blue line and a glint, sparkles the
// game's curvy stars in gold.
import { dressRig } from './kidrig.js';
import {
  TAU, D2R, clamp, lerp, sstep, win, boing, ell, tone, rgba, paint, glow, smoothPath, drawShapes,
  SKIN, HAIR, STONE, STONE_INK, TUNIC, WATER, WATER_INK, HAIR_INK,
  HS, HX, HY, hk, faceShapes, browShapes, hairBack, sideLock, hairFront, foreheadShade, LOCK_ROOT, horns,
  WROOT, WRIST, WSC, wingInner, wingOuter, yoke, skirtPanel, skirtBack, belt, collar, puffSleeve, stoneCuff, bootCuff, bootFoot, TAIL0, TAIL1, tailPiece, spade,
} from './art.js';

const SC = 1 / 3;
const DUST_INK = '#9a92b8';
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ---------- Her loose pieces, on the engine's soft springs ----------
const ROOT_F = [WROOT[0] - 3, WROOT[1] - 1];
const ROOT_N = [WROOT[0] + 1, WROOT[1] + 1];
const JOINTS = {
  wgF: ROOT_F, wgN: ROOT_N, wgFo: [ROOT_F[0] + WRIST[0] * WSC * 0.92, ROOT_F[1] + WRIST[1] * WSC * 0.92], wgNo: [ROOT_N[0] + WRIST[0] * WSC, ROOT_N[1] + WRIST[1] * WSC],
  tail0: TAIL0, tail1: TAIL1, skF: [73, 103], skN: [88, 103], skB: [80, 105],
  lockF: hk(LOCK_ROOT.F), lockN: hk(LOCK_ROOT.N),
};
const SOFTS = [
  // (each wing beats by its own pose and swings on a spring past it, easing into its limit, never
  // hitting it)
  { name: 'wgF', parent: 'chest', pivot: 'wgF', rot: (S, a) => (a.gk?.flapF ?? 0), soft: { k: 150, c: 9, gain: 0.3, turn: 0.6, max: 14, dir: [-8, -8] } },
  { name: 'wgN', parent: 'chest', pivot: 'wgN', rot: (S, a) => (a.gk?.flapN ?? 0), soft: { k: 150, c: 9, gain: 0.3, turn: 0.6, max: 14, dir: [-8, -8] } },
  { name: 'wgFo', parent: 'wgF', pivot: 'wgFo', rot: (S, a) => -(a.gk?.fold ?? 0), soft: { k: 150, c: 9, gain: 0.3, turn: 0.9, max: 22, dir: [-8, -2] } },
  { name: 'wgNo', parent: 'wgN', pivot: 'wgNo', rot: (S, a) => -(a.gk?.fold ?? 0), soft: { k: 150, c: 9, gain: 0.3, turn: 0.9, max: 22, dir: [-8, -2] } },
  { name: 'tail0', parent: 'torso', pivot: 'tail0', rot: (S, a) => (a.gk?.tail0 ?? 0), soft: { k: 100, c: 8, gain: 0.35, turn: 0.6, max: 14, dir: [-6, 2] } },
  { name: 'tail1', parent: 'tail0', pivot: 'tail1', rot: (S, a) => (a.gk?.tail1 ?? 0), soft: { k: 70, c: 6.5, gain: 0.45, turn: 0.8, max: 22, flutter: 3, hz: 0.6, dir: [-6, -1] } },
  { name: 'skF', parent: 'waistB', pivot: 'skF', rot: (S, a) => (a.gk?.skirt ?? 0), soft: { k: 100, c: 6.6, gain: 0.55, turn: 0.9, hang: 0.5, max: 12, dir: [-1, 8] } },
  { name: 'skN', parent: 'waistB', pivot: 'skN', rot: (S, a) => (a.gk?.skirt ?? 0), soft: { k: 110, c: 6.8, gain: 0.55, turn: 0.9, hang: 0.5, max: 12, dir: [1, 8] } },
  { name: 'skB', parent: 'torso', pivot: 'skB', rot: (S, a) => (a.gk?.skirt ?? 0), soft: { k: 90, c: 6.4, gain: 0.5, turn: 0.9, hang: 0.5, max: 10, dir: [0, 7] } },
  { name: 'lockF', parent: 'head', pivot: 'lockF', soft: { k: 110, c: 6.6, gain: 0.45, turn: 0.9, hang: 0.35, max: 9, flutter: 1, hz: 0.5, dir: [0, 7] } },
  { name: 'lockN', parent: 'head', pivot: 'lockN', soft: { k: 120, c: 6.6, gain: 0.45, turn: 0.9, hang: 0.35, max: 9, flutter: 1, hz: 0.57, dir: [0, 7] } },
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
// Behind everything: her wings (far, then near), her tail, the back of her hair and smock.
function drawBack(ctx, a, mode, S, D) {
  for (const [k, far] of [['F', true], ['N', false]]) {
    ctx.save();
    enter(ctx, a, D, `wg${k}o`);
    const r = D.J[`wg${k}`];
    ctx.translate(r[0], r[1]);
    ctx.scale(WSC * (far ? 0.92 : 1), WSC * (far ? 0.92 : 1));
    wingOuter(ctx, a, mode, far);
    ctx.restore();
    ctx.save();
    enter(ctx, a, D, `wg${k}`);
    ctx.translate(r[0], r[1]);
    ctx.scale(WSC * (far ? 0.92 : 1), WSC * (far ? 0.92 : 1));
    wingInner(ctx, a, mode, far);
    ctx.restore();
  }
  ctx.save();
  enter(ctx, a, D, 'tail1');
  tailPiece(ctx, a, mode, TAIL1, [TAIL1[0] - 15, TAIL1[1] - 4], 5.4, 4.2);
  spade(ctx, a, mode, [TAIL1[0] - 16.6, TAIL1[1] - 4.4], 0.25 + (a.gk?.spadeR ?? 0));
  ctx.restore();
  ctx.save();
  enter(ctx, a, D, 'tail0');
  tailPiece(ctx, a, mode, TAIL0, TAIL1, 7, 5.6);
  ctx.restore();
  ctx.save();
  headFrame(ctx, a, D);
  hairBack(ctx, a, mode);
  ctx.restore();
  ctx.save();
  enter(ctx, a, D, 'skB');
  skirtBack(ctx, a, mode);
  ctx.restore();
}
function drawHead(ctx, a, mode, S, D) {
  const q = a.gk ?? {};
  ctx.save();
  headFrame(ctx, a, D);
  const sF = swingOf(a, 'lockF', 'head');
  const sN = swingOf(a, 'lockN', 'head');
  const f = q.face ?? 'calm';
  if (mode === 'line') {
    drawShapes(ctx, a, 'line', faceShapes(f), 6 / HS, SKIN.deep);
    horns(ctx, a, 'line');
    sideLock(ctx, a, 'line', 'F', sF);
    sideLock(ctx, a, 'line', 'N', sN);
    hairFront(ctx, a, 'line', q.sway);
  } else {
    drawShapes(ctx, a, 'fill', faceShapes(f), 6 / HS, SKIN.deep);
    foreheadShade(ctx, a);
    drawShapes(ctx, a, 'fill', browShapes(f), 0, HAIR_INK);
    horns(ctx, a, 'fill');
    sideLock(ctx, a, 'fill', 'F', sF);
    sideLock(ctx, a, 'fill', 'N', sN);
    hairFront(ctx, a, 'fill', q.sway);
  }
  ctx.restore();
}
function drawSmock(ctx, a, mode, S, D) {
  for (const k of ['F', 'N']) {
    ctx.save();
    enter(ctx, a, D, `sk${k}`);
    skirtPanel(ctx, a, mode, k);
    ctx.restore();
  }
  ctx.save();
  enter(ctx, a, D, 'chest');
  yoke(ctx, a, mode);
  ctx.restore();
  ctx.save();
  enter(ctx, a, D, 'waistB');
  belt(ctx, a, mode);
  ctx.restore();
}
function drawCollar(ctx, a, mode, S, D) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  collar(ctx, a, mode);
  ctx.restore();
}
function drawSleeve(ctx, a, mode, S, D, k) {
  ctx.save();
  D.frame(ctx, a, `arm${k}u`);
  puffSleeve(ctx, a, mode, D.loc(`sh${k}`, `arm${k}u`), D.loc(`el${k}`, `arm${k}u`), k === 'F');
  ctx.restore();
  ctx.save();
  D.frame(ctx, a, `arm${k}f`);
  stoneCuff(ctx, a, mode, D.loc(`el${k}`, `arm${k}f`), D.loc(`wr${k}`, `arm${k}f`));
  ctx.restore();
}
function drawBoot(ctx, a, mode, S, D, k) {
  ctx.save();
  enter(ctx, a, D, `shin${k}`);
  bootCuff(ctx, a, mode, k);
  ctx.restore();
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  bootFoot(ctx, a, mode, k);
  ctx.restore();
}

// ---------- Her act ----------
const PIECES = { raspberry: 6.0, statue: 9.0, stretch: 7.0, tail: 7.0 };
const ORDER = ['raspberry', 'statue', 'stretch', 'tail'];
const POOL = ['dive', 'spout', 'drop'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];
// Heavy stone wings: a hard downstroke (up +1 to down -0.7), then a slower recovery back up.
const beat = (u) => (u < 0.42 ? lerp(0.9, -0.7, sstep(u / 0.42)) : lerp(-0.7, 0.9, sstep((u - 0.42) / 0.58)));

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const q = { face: null, flapF: 0, flapN: 0, fold: 0.12, tail0: 0, tail1: 0, spadeR: 0, skirt: 0, stone: 0, sway: [0, 0, 0, 0, 0], dust: -1, crack: -1, chips: -1, drips: 0, spout: -1, puffT: -1, dive: -1, thud: -1, spit: -1, sweat: -1, zz: 0, sparkle: -1, frantic: 0, hurtChips: -1 };
  a.gk = q;
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
    const vx = st.gkX == null ? 0 : (m.x - st.gkX) / dt;
    st.gkV = lerp(st.gkV ?? 0, Math.min(140, Math.abs(vx)), Math.min(1, dt * 5));
  }
  st.gkX = m.x;
  const fly = alive ? sstep(((st.gkV ?? 0) - 6) / 30) : 0;
  // Her wings' beat: hovering, steady heavy beats; flying, two beats then a glide. (`frantic` beats
  // fast, when she climbs back up after a fall.)
  const rate = 1.0 + fly * 0.25 + (st.gkFrantic ?? 0) * 1.8;
  st.gkPh = ((st.gkPh ?? 0) + dt * rate) % 64;
  const cyc = st.gkPh % 1;
  const share = fly * 0.4;
  let fl;
  let lift;
  if (cyc < 1 - share) {
    const u = ((cyc / (1 - share)) * 2) % 1;
    fl = beat(u);
    lift = Math.sin(u * TAU - 0.9) * 0.012;
  } else {
    const g = (cyc - (1 - share)) / share;
    fl = lerp(0.9, 0.1, sstep(g / 0.3)) * (1 - sstep((g - 0.8) / 0.2)) + 0.9 * sstep((g - 0.8) / 0.2);
    lift = -0.02 * Math.sin(Math.PI * g);
  }
  // Hovering: legs dangling, toes pointed, a little swing; hands loose and ready.
  go({ x: 0, hop: 0.2 + lift, lift: 0, tilt: Math.sin(t * 1.1) * 1.2, head: Math.sin(t * 0.8 + 1) * 2.2, fxN: 0.1 + Math.sin(t * 1.6) * 0.06, fyN: 0.06, toeN: 30, fxF: -0.08 + Math.sin(t * 1.6 + 1.6) * 0.06, fyF: 0.12, toeF: 26, shN: -30 + Math.sin(t * 1.3) * 3, elN: -50, hwN: -6, shF: 20, elF: -40, hwF: 8 }, 1);
  // Flying: leaning into it, legs trailing back.
  go({ tilt: 14, head: -6, neckR: -3, fxN: -0.24, fyN: 0.16, fxF: -0.36, fyF: 0.2, toeN: 40, toeF: 36, shN: 26, elN: -30, shF: 34, elF: -30 }, fly);
  q.skirt = 0.14 * fly;
  q.tail0 = 0.1 * fly + Math.sin(t * 1.3) * 0.06;
  q.tail1 = 0.12 * fly + Math.sin(t * 1.3 - 0.7) * 0.1;
  let flap = fl;
  q.fold = 0.12 - fly * 0.08;

  // ----- The fight -----
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const wind = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  if (wind > 0) st.gkWindAt = now;
  const since = now - (m.attackAt ?? -9);
  const striking = since >= 0 && since < 1.0;
  if ((wind > 0 || striking) && alive) {
    if (!st.gkAtk) {
      const pool = m.def.moves ?? POOL;
      st.gkN = (st.gkN ?? m.uid ?? 0) + 1;
      st.gkMove = m.move ?? pool[st.gkN % pool.length];
    }
    st.gkAtk = true;
  } else st.gkAtk = false;
  const mvName = st.gkAtk ? st.gkMove : null;
  const hadWind = now - (st.gkWindAt ?? -9) < Math.max(0, since) + 0.15;
  let W = wind;
  let s = striking ? since : -1;
  if (mvName && striking) {
    if (!hadWind) {
      W = since < 0.3 ? sstep(since / 0.3) : 1;
      s = since - 0.3;
    } else W = 1;
  }
  const busy = Boolean(mvName) || !alive;

  const ago = a.hurtAgo ?? 9;
  const hurt = alive && ago >= 0 && ago < 0.6;
  const fighting = (m.aggroUntil ?? 0) > now;
  const napping = alive && (m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now));
  const cine = m.cine?.mood;
  const low = alive && m.hp < m.def.hp * 0.25 && !m.cine;

  // ----- The act -----
  const calmGoal = !busy && !napping && !m.pose && !m.cine && !hurt && !fighting && fly < 0.05 && alive ? 1 : 0;
  st.gkCalm = lerp(st.gkCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const cw = sstep(st.gkCalm);
  let PC = st.gkPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.gkOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.gkOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.gkOrd = (st.gkOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.gkPiece = PC;
  const piece = PC?.name ?? null;
  const pu = PC?.name ? now - PC.t0 : -1;
  const k = cw;
  let frantic = 0;
  let stone = 0;

  if (k > 0.001 && piece === 'raspberry') {
    const spot = win(pu, 0, 0.3, 1.0, 1.2);
    say('look', spot * k);
    say('smug', win(pu, 0.9, 1.0, 1.3, 1.4) * k);
    // thumbs to her temples, fingers waggling
    const th = win(pu, 1.1, 1.8, 3.6, 4.1);
    go({ shN: -150, elN: -150, hwN: -30 + Math.sin(pu * 12) * 12, shF: -150, elF: -150, hwF: -30 + Math.sin(pu * 12 + 1) * 12, head: -2 }, th * k);
    const bl = win(pu, 1.7, 1.8, 3.4, 3.6);
    add({ head: Math.sin(pu * 26) * 2.4 * bl }, k);
    say('bleh', bl * k);
    if (pu > 1.8 && pu < 3.4) q.spit = pu - 1.8;
    // giggling, kicking her boots
    const gig = win(pu, 3.8, 4.0, 5.4, 5.9);
    add({ chest: Math.sin(pu * 20) * 2.6 * gig, head: Math.sin(pu * 20 - 0.6) * 3 * gig, fyN: Math.max(0, Math.sin(pu * 12)) * 0.2 * gig, fyF: Math.max(0, Math.sin(pu * 12 + 3)) * 0.2 * gig }, k);
    go({ shN: -80, elN: -120, shF: -60, elF: -110 }, gig * k);
    say('laugh', gig * k);
  }
  if (k > 0.001 && piece === 'statue') {
    // the fierce gargoyle pose: crouched in the air, wings high, claws out, a growl
    const pose0 = win(pu, 0.2, 0.7, 5.3, 5.6);
    go({ tilt: 10, head: 6, fyN: 0.42, fyF: 0.38, fxN: 0.22, fxF: 0.06, toeN: 10, toeF: 10, shN: -96, elN: -60, hwN: -30, shF: -70, elF: -70, hwF: -20 }, pose0 * k);
    say('grr', win(pu, 0.4, 0.6, 1.4, 1.6) * k);
    // frozen: to stone, her wings stopped, dust crumbling; sinking
    stone = Math.max(stone, win(pu, 1.4, 1.9, 4.9, 5.1) * k);
    say('stone', win(pu, 1.6, 1.7, 5.0, 5.1) * k);
    if (pu > 2.0 && pu < 5.0) q.dust = pu - 2.0;
    const sink = sstep((pu - 3.0) / 2.0) * (1 - sstep((pu - 5.2) / 1.4));
    add({ hop: -0.11 * sink }, k);
    // cracking out: chips flying, frantic flapping, climbing back up
    if (pu > 4.95 && pu < 6.2) q.chips = pu - 4.95;
    if (pu > 4.9 && pu < 5.3) q.crack = (pu - 4.9) / 0.4;
    say('surprised', win(pu, 5.0, 5.1, 5.5, 5.6) * k);
    frantic = Math.max(frantic, win(pu, 5.1, 5.3, 6.4, 6.9) * k);
    go({ shN: -130 + Math.sin(pu * 30) * 20, elN: -30, shF: -120 + Math.sin(pu * 30 + 2) * 20, elF: -30, fyN: 0.1 + Math.max(0, Math.sin(pu * 24)) * 0.16, fyF: 0.1 + Math.max(0, Math.sin(pu * 24 + 3)) * 0.16 }, win(pu, 5.2, 5.4, 6.2, 6.6) * k);
    say('panic', win(pu, 5.5, 5.6, 6.3, 6.4) * k);
    // and laughing about it
    const gig = win(pu, 6.6, 6.8, 8.4, 8.9);
    add({ chest: Math.sin(pu * 20) * 2.4 * gig, head: Math.sin(pu * 20 - 0.6) * 3 * gig, tilt: -4 * gig }, k);
    go({ shN: -70, elN: -120, shF: -40, elF: -110 }, gig * k);
    say('laugh', gig * k);
  }
  if (k > 0.001 && piece === 'stretch') {
    // a huge wing stretch, both arms up, a yawn
    const sp = win(pu, 0.2, 1.0, 3.6, 4.2);
    go({ shN: -170, elN: -10, hwN: -10, shF: -168, elF: -14, tilt: -6, head: -10, chest: -4, fyN: 0, fyF: 0, toeN: 44, toeF: 44 }, sp * k);
    q.fold -= 0.5 * sp * k;
    say('yawn', win(pu, 1.0, 1.3, 3.0, 3.3) * k);
    say('shut', win(pu, 3.3, 3.4, 3.8, 3.9) * k);
    // a shake from her horns to her tail
    const sh = win(pu, 4.4, 4.6, 5.6, 5.9);
    add({ head: Math.sin(pu * 34) * 6 * sh, chest: Math.sin(pu * 34 - 0.8) * 3 * sh, pelvis: Math.sin(pu * 34 - 1.6) * 2 * sh }, k);
    q.tail0 += Math.sin(pu * 34 - 2) * 0.3 * sh * k;
    say('shut', sh * k);
    say('grin', win(pu, 5.9, 6.1, 6.6, 7.0) * k);
  }
  if (k > 0.001 && piece === 'tail') {
    // she looks back at her tail, curls it round in front and catches the spade
    const look = win(pu, 0, 0.4, 1.0, 1.2);
    say('lookB', look * k);
    add({ head: -4 * look, neckR: -3 * look }, k);
    const curl = win(pu, 0.8, 1.4, 5.0, 5.6);
    q.tail0 += 0.85 * curl * k;
    q.tail1 += 0.9 * curl * k;
    go({ shF: 84, elF: -40, hwF: -20, shN: -40, elN: -70, tilt: -4, head: -3 }, curl * k);
    // twirling the spade like a baton
    const tw = win(pu, 1.6, 1.9, 4.4, 4.8);
    q.spadeR += Math.sin(pu * 9) * 1.2 * tw * k;
    q.tail1 += Math.sin(pu * 9) * 0.16 * tw * k;
    say('smug', win(pu, 1.4, 1.6, 4.8, 5.0) * k);
    if (pu > 4.6 && pu < 6.0) q.sparkle = pu - 4.6;
    // let go: it springs back
    if (pu > 5.2) q.tail1 += Math.sin((pu - 5.2) * 14) * Math.exp(-(pu - 5.2) * 5) * 0.3 * k;
    say('grin', win(pu, 5.4, 5.6, 6.6, 7.0) * k);
  }

  // (her own marks over her head)
  if (fighting && alive && !st.gkHunt) st.gkBangAt = now;
  if (!fighting && st.gkHunt && alive) st.gkLostAt = now;
  st.gkHunt = fighting && alive;
  q.bang = now - (st.gkBangAt ?? -9);
  q.huh = now - (st.gkLostAt ?? -9);
  q.hurtT = hurt ? ago : -1;
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: a fang grin, claws ready -----
  if (fighting && alive && !hurt) {
    go({ shN: -70, elN: -70, hwN: -20, shF: -40, elF: -80, tilt: 6, head: 3 }, 1 - fly * 0.4);
    q.face = 'grr';
  }
  if (low && !busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.5) % 1;
  }
  // ----- Her moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.45) / 0.45) : 0;
    const snapT = mvName === 'spout' ? 0.12 : 0.16;
    const snap = s >= 0 ? sstep(s / (hadWind ? snapT : snapT + 0.04)) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'dive') {
      // reared back, wings high, horns lowered; then a dive at you horns first, wings swept back
      go({ tilt: -14, head: 14, neckR: 4, hop: 0.27, x: -0.04, shN: 20, elN: -60, shF: 30, elF: -60, fyN: 0.3, fyF: 0.26 }, wu);
      flap = lerp(flap, 1, wu);
      say('grr', W);
      go({ tilt: 30, head: 12, hop: 0.13, x: 0.18, shN: 50, elN: -20, shF: 56, elF: -20, fxN: -0.36, fyN: 0.2, fxF: -0.44, fyF: 0.24, toeN: 50, toeF: 46 }, snap * sw);
      flap = lerp(flap, 0.6, snap * sw);
      q.fold += 0.5 * snap * sw;
      say('shout', snap * sw);
      if (s >= 0 && s < 0.9) q.dive = s;
    } else if (mvName === 'spout') {
      // leaning back, cheeks puffed full of rainwater; then spouting it at you
      go({ tilt: -10, head: -12, neckR: -3, shN: -20, elN: -90, shF: -10, elF: -90 }, wu);
      say('puff', W > 0.3 ? 1 : W);
      q.drips = wu;
      go({ tilt: 8, head: 6, neckR: 2, x: 0.02, shN: 30, elN: -30, shF: 30, elF: -30 }, snap * sw);
      say('talkO', snap * sw);
      if (s >= 0 && s < 1.0) q.spout = s;
    } else {
      // up, tucked in, turning to stone; then dropping like a rock, THUD, cracking out
      // (the tuck held through the fall, let go as she climbs back out, never dropped at once)
      const tuck = sstep(W) * (s >= 0 ? 1 - sstep((s - 0.5) / 0.4) : 1);
      go({ hop: 0.34, tilt: 6, head: 10, fyN: 0.46, fyF: 0.42, fxN: 0.26, fxF: 0.16, toeN: 10, toeF: 10, shN: -50, elN: -110, shF: -40, elF: -110 }, tuck);
      q.fold += 0.6 * tuck;
      stone = Math.max(stone, sstep((W - 0.3) / 0.6) * (1 - sstep((s - 0.45) / 0.25)));
      say('grr', W < 0.5 ? W * 2 : 0);
      say('stone', sstep((W - 0.45) / 0.2) * (s < 0.5 ? 1 : 0));
      // the fall: down to the floor (feet to the ground), held, then the climb back up
      const fall = s >= 0 ? sstep(s / 0.16) * (1 - sstep((s - 0.55) / 0.35)) : 0;
      go({ hop: 0.03 }, fall);
      if (s >= 0.14 && s < 1.0) q.thud = s - 0.14;
      if (s > 0.42 && s < 1.2) q.chips = s - 0.42;
      if (s > 0.4 && s < 0.7) q.crack = (s - 0.4) / 0.3;
      frantic = Math.max(frantic, win(s, 0.5, 0.6, 0.9, 1.0));
      say('surprised', win(s, 0.5, 0.55, 0.8, 0.9));
    }
  }
  // ----- Hurt: a wince, a flinch away, her wings jolted in, a few chips off her -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -14, head: 12, neckR: 4, shN: -80, elN: -120, hwN: -20, fyN: 0.24, fyF: 0.2 }, kh);
    q.fold += 0.4 * Math.sin(Math.PI * clamp(ago / 0.6, 0, 1));
    q.face = 'hurt';
    q.hurtChips = ago;
  }
  // ----- After landing a hit: a quick raspberry -----
  const moveW = mvName ? (s >= 0 ? 1 - sstep((s - 0.45) / 0.45) : 1) : 0;
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.1 && alive && !hurt) {
    const kg = win(gl, 0, 0.28, 0.8, 1.1) * (1 - moveW);
    go({ head: -6, tilt: -4, shN: -96, elN: -110, hwN: -20 }, kg);
    say('bleh', kg);
  }
  // ----- A nap: wings wrapped round her like a bat, knees hugged -----
  st.gkNap = lerp(st.gkNap ?? 0, napping && !busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.gkNap);
  if (nw > 0.001) {
    const nod = Math.sin(now * 1.4);
    go({ hop: 0.12 + nod * 0.008, tilt: 8, waist: 4, chest: 4, head: 16 + nod * 3, neckR: 4, fyN: 0.42, fyF: 0.38, fxN: 0.24, fxF: 0.14, toeN: 20, toeF: 20, shN: -46, elN: -96, shF: -36, elF: -100 }, nw);
    flap = lerp(flap, -0.9, nw);
    q.fold += 0.7 * nw;
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
    }
  }
  if (alive && !busy && !hurt) {
    if (cine === 'happy') q.face = 'laugh';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'grr';
    else if (cine === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 7) % VOWELS.length];
  }
  // beaten: dizzy, her wings stopped
  if (!alive) {
    q.face = 'dizzy';
    flap = 0.2;
  }
  // ----- Stone: everything eased, the wings held where they were when she froze -----
  st.gkStone = lerp(st.gkStone ?? 0, stone, ease(stone > (st.gkStone ?? 0) ? 7 : 12));
  q.stone = st.gkStone < 0.004 ? 0 : st.gkStone;
  if (q.stone < 0.05) st.gkHold = flap;
  flap = lerp(flap, st.gkHold ?? flap, sstep(q.stone * 1.4));
  st.gkFrantic = lerp(st.gkFrantic ?? 0, frantic, ease(8));
  // (the wings' beat eased into the pose, so a change of beat never snaps them; the far a beat behind)
  st.gkFlap = lerp(st.gkFlap ?? flap, flap, ease(22));
  st.gkFlapF = lerp(st.gkFlapF ?? flap, st.gkFlap, ease(14));
  q.flapN = 0.36 + st.gkFlap * 0.42;
  q.flapF = 0.44 + st.gkFlapF * 0.42;
  // ----- The face: an in-between (a blink) on every change; her own blink rhythm -----
  let f = q.face ?? 'calm';
  if (f !== st.gkFace) {
    st.gkFaceFrom = st.gkFace;
    st.gkFace = f;
    st.gkFaceAt = now;
  }
  const since0 = now - (st.gkFaceAt ?? -9);
  const SHUT = new Set(['laugh', 'happy', 'bleh', 'shout', 'hurt', 'yawn', 'sleep', 'shut', 'dizzy']);
  if (since0 >= 0 && since0 < 0.07 && st.gkFaceFrom && !SHUT.has(f) && !SHUT.has(st.gkFaceFrom)) f = 'blink';
  const bl = (now + (m.uid ?? 0) * 0.67) % 3.7;
  if (bl < 0.12 && !SHUT.has(f) && f !== 'blink' && q.stone < 0.3) f = 'blink';
  q.face = f;
  for (const key of ['fold', 'skirt', 'tail0', 'tail1', 'spadeR']) {
    st[`gk_${key}`] = lerp(st[`gk_${key}`] ?? q[key], q[key], ease(key === 'spadeR' ? 18 : 12));
    q[key] = st[`gk_${key}`];
  }
  const hs = (st.gkHeadV = lerp(st.gkHeadV ?? 0, ((out.head ?? 0) - (st.gkHead0 ?? out.head ?? 0)) / Math.max(dt, 1e-3), ease(10)));
  st.gkHead0 = out.head ?? 0;
  for (let i = 0; i < 5; i++) q.sway[i] = (clamp(-hs * 0.0016 * (0.8 + (i % 3) * 0.2), -0.04, 0.04) + Math.sin(t * (1.2 + i * 0.13) + i * 1.9) * 0.006) * (1 - q.stone);
}

// ---------- Live effects (rig space, game px, the point she hovers over at 0, 0) ----------
// A soft puff of dust: lilac grey, a soft line, a pale heart.
function puff(ctx, x, y, r, al, pass) {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 0.9);
  if (pass === 'line') {
    ctx.lineWidth = Math.max(0.4, r * 0.3);
    ctx.strokeStyle = DUST_INK;
    ctx.stroke();
  } else {
    ctx.fillStyle = '#e4e0f0';
    ctx.fill();
    ell(ctx, x - r * 0.2, y - r * 0.22, r * 0.56, r * 0.46);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  ctx.restore();
}
function cloud(ctx, list) {
  for (const pass of ['line', 'fill']) for (const [x, y, r, al] of list) puff(ctx, x, y, r, al, pass);
}
// A round stone chip, tumbling (a turn of its own, never a squeeze).
function chip(ctx, x, y, r, rot, al) {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  smoothPath(ctx, [[-r, -r * 0.4], [-r * 0.3, -r], [r * 0.8, -r * 0.7], [r, r * 0.3], [r * 0.2, r], [-r * 0.8, r * 0.7]]);
  ctx.lineWidth = Math.max(0.3, r * 0.4);
  ctx.strokeStyle = STONE_INK;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = STONE[1];
  ctx.fill();
  ell(ctx, -r * 0.25, -r * 0.3, r * 0.4, r * 0.3);
  ctx.fillStyle = STONE[0];
  ctx.fill();
  ctx.restore();
}
// A round water drop (in flight) and a drop with a soft point on top.
function bead(ctx, x, y, r, al) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.lineWidth = Math.max(0.3, r * 0.45);
  ctx.strokeStyle = WATER_INK;
  ctx.stroke();
  ctx.fillStyle = WATER[2];
  ctx.fill();
  ell(ctx, x - r * 0.3, y - r * 0.3, r * 0.4, r * 0.35);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
function drop(ctx, x, y, r, al, rot = 0, ink = WATER_INK, col = WATER[2]) {
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
  ctx.strokeStyle = ink;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.fill();
  ell(ctx, -r * 0.38, -r * 0.4, r * 0.3, r * 0.42, -0.4);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
// A ripple ring on the floor where water lands.
function ripple(ctx, x, y, u, size, al) {
  if (u < 0 || u > 1 || al <= 0.01) return;
  const rx = 0.6 + sstep(u) * size;
  ctx.save();
  ctx.globalAlpha *= al * (1 - u);
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
function sparkle(ctx, x, y, r, al, col = '#ffffff', ink = '#d8a444') {
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
  ctx.strokeStyle = '#6a8a6a';
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = '#f2fae8';
  ctx.stroke();
  ctx.restore();
}
function bubble(ctx, x, y, mark, e, dur, fl = false) {
  const k = Math.max(0, boing(e, 9, 18)) * (1 - sstep((e - dur + 0.25) / 0.25));
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(fl ? -k : k, k);
  for (const pass of ['line', 'fill']) {
    smoothPath(ctx, [[-5.4, -5], [5.4, -5.2], [5.8, 3.4], [1.2, 4.6], [-0.4, 7.2], [-1.6, 4.6], [-5.6, 3.4]]);
    if (pass === 'line') {
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = STONE_INK;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }
  ctx.lineCap = 'round';
  ctx.strokeStyle = mark === '!' ? '#e8608e' : '#6c8a5a';
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
// Soft crack lines over her as she breaks out of stone (on her body, fading).
function cracks(ctx, a, D, u) {
  if (u <= 0 || u >= 1) return;
  const al = Math.sin(Math.PI * u);
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.strokeStyle = STONE[3];
  ctx.lineWidth = 0.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [bone, pts] of [['chest', [[76, 88], [80, 94], [78, 99], [83, 104]]], ['head', [[78, 50], [83, 56], [80, 62]]], ['waistB', [[86, 106], [90, 112], [88, 118]]]]) {
    ctx.beginPath();
    pts.forEach((p, i) => {
      const [x, y] = pointIn(a, D, bone, p);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.stroke();
  }
  ctx.restore();
}

function under2(ctx, m, a, S, matOf, D) {
  for (const n of SOFT_NAMES) a.blMat(n);
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.gk ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.43;
  if (m.hp <= 0) return;
  // turned to stone: dust crumbling off her and drifting down
  if ((q.dust ?? -1) >= 0) {
    const L = [];
    for (let i = 0; i < 5; i++) {
      const f = (q.dust * 0.7 + i / 5) % 1;
      const n = Math.floor(q.dust * 0.7 + i / 5);
      const [hx, hy] = pointIn(a, D, i % 2 ? 'chest' : 'waistB', [70 + hash(n * 3 + i) * 22, 96 + hash(n * 5 + i) * 14]);
      L.push([hx + (hash(n + i) - 0.5) * 3, hy + f * 14, 0.7 + f * 0.6, Math.sin(Math.PI * f) * 0.8]);
    }
    cloud(ctx, L);
  }
  cracks(ctx, a, D, q.crack ?? -1);
  // chips flying off as she cracks out of stone
  if ((q.chips ?? -1) >= 0 && q.chips < 1.2) {
    const [cx, cy] = pointIn(a, D, 'chest', [80, 98]);
    for (let i = 0; i < 7; i++) {
      const u = clamp(q.chips / 0.9, 0, 1);
      const an = -Math.PI * 0.9 + (i / 6) * Math.PI * 0.8 + hash(i) * 0.3;
      const v = 14 + hash(i * 7) * 10;
      const x = cx + Math.cos(an) * v * u;
      const y = cy + Math.sin(an) * v * u + 30 * u * u;
      chip(ctx, x, y, 0.8 + (i % 3) * 0.25, u * 8 + i, 1 - sstep((u - 0.7) / 0.3));
    }
    cloud(ctx, [0, 1, 2, 3].map((i) => [cx + (i - 1.5) * 4 * (1 + q.chips * 2), cy - 2 + (i % 2) * 3, 1.4 + q.chips * 1.2, (1 - q.chips / 1.2) * 0.8]));
  }
  // the raspberry's little spray
  if ((q.spit ?? -1) >= 0) {
    const [mx, my] = headAt(a, D, [6, 30]);
    for (let i = 0; i < 3; i++) {
      const f = (q.spit * 2.2 + i / 3) % 1;
      bead(ctx, mx + 3 + f * 8, my + Math.sin(f * 6 + i) * 1.6 - 1 + f * f * 4, 0.45, Math.sin(Math.PI * f) * 0.9);
    }
  }
  // ----- Horn Dive: a swish of air off her horns, a puff of dust where she lands it -----
  if ((q.dive ?? -1) >= 0 && q.dive < 0.9) {
    const s = q.dive;
    for (let i = 0; i < 3; i++) {
      const u = clamp((s - i * 0.03) / 0.3, 0, 1);
      if (u <= 0 || u >= 1) continue;
      ctx.save();
      ctx.globalAlpha *= (1 - u) * 0.8;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const y = -26 + i * 5;
      ctx.moveTo(-6 + u * 10, y);
      ctx.quadraticCurveTo(4 + u * 14, y - 2, 14 + u * 14, y + 1);
      ctx.stroke();
      ctx.restore();
    }
    if (s > 0.08 && s < 0.8) {
      const u = (s - 0.08) / 0.72;
      const L = [];
      for (let i = 0; i < 6; i++) {
        const an = (i / 6) * TAU + 0.4;
        const d = 2 + sstep(u) * 7;
        L.push([22 + Math.cos(an) * d, -14 + Math.sin(an) * d * 0.8, (1.5 + (i % 2) * 0.5) * (1 - u * 0.4), 1 - sstep((u - 0.5) / 0.5)]);
      }
      cloud(ctx, L);
      for (let i = 0; i < 3; i++) {
        const an = -Math.PI / 2 + (i - 1) * 0.9;
        sparkle(ctx, 22 + Math.cos(an) * (3 + u * 7), -14 + Math.sin(an) * (3 + u * 6), 1.8 * Math.sin(Math.PI * u), 1, i % 2 ? '#ffffff' : '#fff2b8');
      }
    }
  }
  // ----- Gutter Spout: drips at her lips as she puffs up, then a stream of rainwater at you -----
  if ((q.drips ?? 0) > 0.1) {
    const [mx, my] = headAt(a, D, [4, 30]);
    const f = (t * 1.6) % 1;
    drop(ctx, mx + 1, my + f * 5, 0.5, q.drips * Math.sin(Math.PI * f));
  }
  if ((q.spout ?? -1) >= 0 && q.spout < 1.0) {
    const s = q.spout;
    if (!a.mo.gkMouth || s < 0.03) a.mo.gkMouth = headAt(a, D, [8, 28]);
    const [ox, oy] = a.mo.gkMouth;
    const flow = s < 0.55 ? 1 : 1 - sstep((s - 0.55) / 0.3);
    // the stream (2026-11-27, the player: a string of beads read as a row of dots): one soft
    // continuous ribbon of rainwater arcing from her lips to the floor ahead, its front running out,
    // its tail drawn in after her as she runs dry, a gentle ripple travelling down it, a light core
    // along its top; only a few loose droplets fly off it
    const at = (u) => [ox + u * 28, Math.min(-0.4, oy + u * 6 + u * u * (-oy - 6))];
    const u1 = Math.min(1, s * 3);
    const u0 = s < 0.55 ? 0 : sstep((s - 0.55) / 0.3);
    if (u1 - u0 > 0.02) {
      const pts = [];
      const N = 22;
      for (let i = 0; i <= N; i++) {
        const u = lerp(u0, u1, i / N);
        const [x, y] = at(u);
        pts.push([x, y + Math.sin(u * 15 - s * 22) * 0.35 * u]);
      }
      const path = () => {
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      };
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha *= Math.max(0.35, flow);
      path();
      ctx.strokeStyle = WATER_INK;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      path();
      ctx.strokeStyle = WATER[2];
      ctx.lineWidth = 1.7;
      ctx.stroke();
      // (the light core, along its upper side, thinning out toward the front)
      ctx.beginPath();
      pts.slice(0, Math.max(2, Math.round(N * 0.8))).forEach(([x, y], i) => (i ? ctx.lineTo(x, y - 0.32) : ctx.moveTo(x, y - 0.32)));
      ctx.strokeStyle = WATER[1];
      ctx.lineWidth = 0.6;
      ctx.stroke();
      ctx.restore();
      // a couple of loose droplets peeling off its top, each on its own loop
      for (let i = 0; i < 2; i++) {
        const v = (s * 2.2 + i * 0.5) % 1;
        const base = lerp(u0, u1, 0.35 + i * 0.3);
        const [bx, by] = at(base);
        bead(ctx, bx + v * 3, by - 1.2 - Math.sin(Math.PI * v) * 2.6, 0.55, flow * Math.sin(Math.PI * v) * (u1 > base ? 1 : 0));
      }
    }
    // where it lands: ripples and a little splash of three drops
    if (s > 0.15 && u1 >= 1) {
      const lx = ox + 28;
      ripple(ctx, lx, -0.3, ((s - 0.15) * 2.2) % 1, 6, flow);
      for (let i = 0; i < 3; i++) {
        const u = ((s * 2.6 + i / 3) % 1);
        drop(ctx, lx + (i - 1) * 2.8 * (1 + u), -Math.sin(Math.PI * u) * 4.2 - 0.6, 0.5, flow * (1 - u), (i - 1) * 0.5);
      }
    }
  } else a.mo.gkMouth = null;
  // ----- Stone Drop: THUD, a ring of dust rolling out and pebbles skittering -----
  if ((q.thud ?? -1) >= 0 && q.thud < 0.9) {
    const s = q.thud;
    const u = clamp(s / 0.7, 0, 1);
    const L = [];
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const d = 4 + sstep(u) * (12 + i * 5);
        L.push([side * d, -1.4 - (i % 2) * 1.6 - Math.sin(Math.PI * u) * 2, (1.6 + (i % 3) * 0.6) * (0.6 + u * 0.6), 1 - sstep((u - 0.55) / 0.45)]);
      }
    }
    cloud(ctx, L);
    for (let i = 0; i < 5; i++) {
      const side = i % 2 ? -1 : 1;
      const v = 10 + i * 4;
      chip(ctx, side * (3 + v * u), -Math.sin(Math.PI * clamp(u * 1.3, 0, 1)) * (4 + i) - 0.6, 0.7 + (i % 2) * 0.3, u * 9 * side + i, 1 - sstep((u - 0.75) / 0.25));
    }
  }
  // hurt: a few chips knocked off her
  if ((q.hurtChips ?? -1) >= 0 && q.hurtChips < 0.5) {
    const e = q.hurtChips / 0.5;
    const [hx, hy] = pointIn(a, D, 'chest', [84, 92]);
    for (let i = 0; i < 3; i++) {
      const an = -Math.PI * 0.8 + i * 0.5;
      chip(ctx, hx + Math.cos(an) * (3 + e * 9), hy + Math.sin(an) * (3 + e * 6) + e * e * 10, 0.7, e * 7 + i, 1 - e);
    }
  }
  // a bead of sweat
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [38, -10]);
    const f = q.sweat % 1;
    drop(ctx, hx, hy + sstep(f) * 5, 0.9, Math.sin(Math.PI * f), 0, '#6aa6d8', '#d4f0ff');
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [26, -56]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.45 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip);
    }
  }
  // the spade twirl's sparkles
  if ((q.sparkle ?? -1) >= 0) {
    const [px, py] = pointIn(a, D, 'tail1', [TAIL1[0] - 20, TAIL1[1] - 5]);
    for (let i = 0; i < 3; i++) {
      const f = clamp(q.sparkle * 1.2 - i * 0.2, 0, 1);
      sparkle(ctx, px - 3 + i * 3, py - 3 - f * 5, (i % 2 ? 1.0 : 1.5) * Math.sin(Math.PI * f), 1, i % 2 ? '#fff2b8' : '#ffffff');
    }
  }
  const [bx, by] = headAt(a, D, [38, -84]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip);
  if (q.gloatT >= 0 && q.gloatT < 1.0) {
    const e = q.gloatT;
    sparkle(ctx, bx - 4 + e * 4, by + 10 - e * 6, 1.5 * Math.sin(Math.PI * e), 1, '#fff2b8');
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
    armFu: drawBack,
  },
  over: {
    armF: (ctx, a, mode, S, D) => drawSleeve(ctx, a, mode, S, D, 'F'),
    footFskin: (ctx, a, mode, S, D) => drawBoot(ctx, a, mode, S, D, 'F'),
    footNskin: (ctx, a, mode, S, D) => drawBoot(ctx, a, mode, S, D, 'N'),
    torsoSkin: drawSmock,
    neckSkin: drawCollar,
    head: drawHead,
    armN: (ctx, a, mode, S, D) => drawSleeve(ctx, a, mode, S, D, 'N'),
  },
  pose,
  fx,
};

const R = dressRig(DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  a.m = m;
  const moving0 = a.moving;
  a.moving = false;
  draw0(ctx, m, a);
  a.moving = moving0;
  a.gait = null;
};
rig.w = Math.round(rig.w * 1.3);
rig.h = Math.round(rig.h * 1.25);
export const GARGOYLE_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const GARGOYLE_DRESS = DRESS;
