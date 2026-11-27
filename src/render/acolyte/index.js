// The Ruin Acolyte on screen (2026-11-26, rebuilt from scratch to the new standard, keeping her idea; the
// id stays `wisp`). A little acolyte of the Moon Maiden who still floats through the Twilight Ruins'
// halls, tending a temple nobody else remembers: hooded in plum and gold, silver-lilac hair, a robe that
// thins into three soft wisps where her feet would be, and a gold censer on a chain with her friend in
// it, a wisp. Her look is in art.js; she moves on her own copy of the kid base's rig (kidrig.js: its
// bones and springs; the base's own moves, legs and arm skin left out), every loose piece on the
// engine's soft-layer springs (the censer on its chain, a real pendulum; both bell sleeves; the skirt's
// three panels; the sash's two ends; the three wisps; her two side locks).
//   floating  she always floats (the game counts a flyer as always moving; her motion goes by her own
//           travel): a slow swell, never a bounce; moving, she leans into it, the wisps stream out
//           behind her, the sleeves trail and the censer swings back on its chain.
//   idle    her act, in four pieces, the next one that fits the time she has before she moves on
//           (data: `rest`; world/mobs.js tells her, `m.restUntil`):
//           - offering (7.0 s): she lifts the censer high in both hands, eyes shut, soft smoke rings
//             curling up off it; she lowers it and gives a small bow;
//           - play (8.0 s): she opens its lid and the wisp hops out and circles her (behind her and
//             in front), her eyes following it; it boops her cheek, she giggles; it goes home and the
//             lid clicks shut;
//           - doze (7.6 s): hands together in prayer, she nods off, sinking a little, z's... the censer
//             clinks and she startles awake, flustered, looks round, and straightens her hood;
//           - hymn (6.6 s): humming a little hymn, swinging the censer slow, a twirl in the air (two
//             clean mirror flips), a curtsey.
//   moves   Censer Swing (the censer drawn back past her hip, then swung up and round in a big arc, a
//           ribbon of teal smoke behind it); Wisp Shot (the censer held out, its lid open, the wisp
//           swelling bright inside; then it shoots out at you and zips home); Incense Cloud (the
//           censer whirled overhead, smoke gathering; then flung down, a soft billow of smoke rolling
//           along the ground at you).
//   else    hurt: a squeezed wince, a flinch away, the censer jolting on its chain; after landing a
//           hit: a sweet little bow; hunting you: a determined pout, the censer ready; low on health:
//           worried, a bead of sweat; a nap: curled up in the air hugging the censer, the wisp dimmed;
//           beaten: dizzy, sinking. Her marks over her head (!, ?, z's, sweat, notes) are her own
//           (`ownEmotes`).
// Every effect is drawn here, live, in her own soft style: smoke as soft lilac puffs with a violet line
// and a white heart, the wisp a round teal flame with no face, sparkles the game's curvy stars in
// gold, notes and z's soft rounded strokes.
import { dressRig } from './kidrig.js';
import {
  TAU, D2R, clamp, lerp, sstep, win, boing, ell, tone, rgba, paint, glow, smoothPath, drawShapes,
  SKIN, HAIR, ROBE, GOLD, WISP, MIST, HAIR_INK, ROBE_INK,
  HS, HX, HY, hk, faceShapes, browShapes, hairBack, sideLock, hairFront, foreheadShade, hoodBack, hoodRim, LOCK_ROOT,
  bodice, capelet, sash, sashKnot, sashEnd, skirtPanel, skirtBack, wispTail, sleevePiece, sleeveBell, censer, wispFlame, CENSER,
} from './art.js';

const SC = 1 / 3;
const SMOKE_INK = '#a690d6';
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ---------- Her loose pieces, on the engine's soft springs ----------
const GRIP = [95, 113];
const WISPS = [[71, 130, 0.55], [80, 132, 0.62], [89, 130, 0.7]];
const JOINTS = {
  grip: GRIP, bellF: [65, 108], bellN: [95, 108], skF: [73, 104], skN: [88, 104], skB: [80, 106], sashA: [89.6, 106.6], sashB: [92.2, 106.6],
  lockF: hk(LOCK_ROOT.F), lockN: hk(LOCK_ROOT.N),
  ...Object.fromEntries(WISPS.map(([x, y], i) => [`wisp${i}`, [x, y]])),
};
const chestAng = (S) => (S.tilt ?? 0) + (S.pelvis ?? 0) + (S.waist ?? 0) + (S.chest ?? 0);
const SOFTS = [
  // the censer on its chain: turned so it hangs straight down whatever her hand does, then swinging
  // on a long slow pendulum spring
  { name: 'censer', parent: 'handN', pivot: 'grip', rot: (S, a) => (a.ac?.censerR ?? 0) - (chestAng(S) + S.shN + S.elN + (S.hwN ?? 0)) * D2R, soft: { k: 44, c: 4.6, gain: 0.62, turn: 0.95, max: 50, dir: [0, 22] } },
  { name: 'bellF', parent: 'armFf', pivot: 'bellF', rot: (S) => -(chestAng(S) + S.shF + S.elF) * 0.55 * D2R, soft: { k: 96, c: 6, gain: 0.5, turn: 0.8, max: 18, flutter: 1.5, hz: 0.6, dir: [0, 8] } },
  { name: 'bellN', parent: 'armNf', pivot: 'bellN', rot: (S) => -(chestAng(S) + S.shN + S.elN) * 0.55 * D2R, soft: { k: 104, c: 6, gain: 0.5, turn: 0.8, max: 18, flutter: 1.5, hz: 0.66, dir: [0, 8] } },
  { name: 'skF', parent: 'waistB', pivot: 'skF', rot: (S, a) => (a.ac?.skirt ?? 0), soft: { k: 92, c: 6.4, gain: 0.6, turn: 0.9, hang: 0.5, max: 12, dir: [-1, 10] } },
  { name: 'skN', parent: 'waistB', pivot: 'skN', rot: (S, a) => (a.ac?.skirt ?? 0), soft: { k: 104, c: 6.6, gain: 0.6, turn: 0.9, hang: 0.5, max: 12, dir: [1, 10] } },
  { name: 'skB', parent: 'torso', pivot: 'skB', rot: (S, a) => (a.ac?.skirt ?? 0), soft: { k: 84, c: 6.2, gain: 0.55, turn: 0.9, hang: 0.5, max: 10, dir: [0, 9] } },
  { name: 'sashA', parent: 'waistB', pivot: 'sashA', soft: { k: 66, c: 4.8, gain: 0.6, turn: 0.9, hang: 0.8, max: 22, flutter: 2, hz: 0.6, dir: [0, 6] } },
  { name: 'sashB', parent: 'waistB', pivot: 'sashB', soft: { k: 74, c: 5, gain: 0.6, turn: 0.9, hang: 0.8, max: 22, flutter: 2, hz: 0.7, dir: [0, 5] } },
  ...WISPS.map(([, , hz], i) => ({ name: `wisp${i}`, parent: 'waistB', pivot: `wisp${i}`, rot: (S, a) => (a.ac?.trail ?? 0) * (0.8 + i * 0.15), soft: { k: 40 + i * 6, c: 3.6, gain: 0.7, turn: 0.95, hang: 0.55, max: 26, flutter: 5, hz, dir: [0, 14] } })),
  { name: 'lockF', parent: 'head', pivot: 'lockF', soft: { k: 90, c: 6, gain: 0.5, turn: 0.9, hang: 0.4, max: 10, flutter: 1.2, hz: 0.45, dir: [0, 8] } },
  { name: 'lockN', parent: 'head', pivot: 'lockN', soft: { k: 100, c: 6, gain: 0.5, turn: 0.9, hang: 0.4, max: 10, flutter: 1.2, hz: 0.52, dir: [0, 8] } },
];
const SOFT_NAMES = SOFTS.map((p) => p.name);
const PIVOT = { chest: 'ribs', waistB: 'navel', torso: 'hip', head: 'neck', armFu: 'shF', armFf: 'elF', armNu: 'shN', armNf: 'elN', handF: 'wrF', handN: 'wrN', ...Object.fromEntries(SOFTS.map((p) => [p.name, p.pivot])) };
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
const censerAt = (a, D, dy = 0) => pointIn(a, D, 'censer', [GRIP[0] + CENSER[0], GRIP[1] + CENSER[1] + dy]);
const angOf = (M) => Math.atan2(M[1], M[0]);
const swingOf = (a, name, parent) => {
  const d = angOf(a.blMat(name)) - angOf(a.blMat(parent));
  return Math.atan2(Math.sin(d), Math.cos(d));
};

// ---------- Live pieces of her ----------
// Behind everything: her hood and the back of her hair; the back of her skirt and her three wisps.
function drawBack(ctx, a, mode, S, D) {
  ctx.save();
  headFrame(ctx, a, D);
  hoodBack(ctx, a, mode);
  hairBack(ctx, a, mode);
  ctx.restore();
  for (let i = 0; i < WISPS.length; i++) {
    ctx.save();
    enter(ctx, a, D, `wisp${i}`);
    ctx.translate(WISPS[i][0], WISPS[i][1]);
    wispTail(ctx, a, mode, [20, 27, 18][i], [13.4, 15, 12.6][i], [-9, -12, -7][i]);
    ctx.restore();
  }
  ctx.save();
  enter(ctx, a, D, 'skB');
  skirtBack(ctx, a, mode);
  ctx.restore();
}
function drawHead(ctx, a, mode, S, D) {
  const q = a.ac ?? {};
  ctx.save();
  headFrame(ctx, a, D);
  const sF = swingOf(a, 'lockF', 'head');
  const sN = swingOf(a, 'lockN', 'head');
  if (mode === 'line') {
    drawShapes(ctx, a, 'line', faceShapes(q.face ?? 'calm'), 6 / HS, SKIN.deep);
    sideLock(ctx, a, 'line', 'F', sF);
    sideLock(ctx, a, 'line', 'N', sN);
    hairFront(ctx, a, 'line', q.sway);
    hoodRim(ctx, a, 'line');
  } else {
    drawShapes(ctx, a, 'fill', faceShapes(q.face ?? 'calm'), 6 / HS, SKIN.deep);
    foreheadShade(ctx, a);
    drawShapes(ctx, a, 'fill', browShapes(q.face ?? 'calm'), 0, HAIR_INK);
    sideLock(ctx, a, 'fill', 'F', sF);
    sideLock(ctx, a, 'fill', 'N', sN);
    hairFront(ctx, a, 'fill', q.sway);
    hoodRim(ctx, a, 'fill');
  }
  ctx.restore();
}
function drawRobe(ctx, a, mode, S, D) {
  for (const k of ['F', 'N']) {
    ctx.save();
    enter(ctx, a, D, `sk${k}`);
    skirtPanel(ctx, a, mode, k);
    ctx.restore();
  }
  ctx.save();
  enter(ctx, a, D, 'chest');
  bodice(ctx, a, mode);
  ctx.restore();
  ctx.save();
  enter(ctx, a, D, 'waistB');
  sash(ctx, a, mode);
  ctx.restore();
  for (const [k, len, w] of [['sashA', 14, 4.4], ['sashB', 11, 3.8]]) {
    ctx.save();
    enter(ctx, a, D, k);
    const p = D.J[k];
    ctx.translate(p[0], p[1]);
    sashEnd(ctx, a, mode, len, w);
    ctx.restore();
  }
  ctx.save();
  enter(ctx, a, D, 'waistB');
  sashKnot(ctx, a, mode);
  ctx.restore();
}
function drawCapelet(ctx, a, mode, S, D) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  capelet(ctx, a, mode);
  ctx.restore();
}
function drawSleeve(ctx, a, mode, S, D, k) {
  for (const [bone, from, to, w0, w1] of [[`arm${k}u`, `sh${k}`, `el${k}`, 10.4, 9.8], [`arm${k}f`, `el${k}`, `wr${k}`, 9.8, 11.6]]) {
    ctx.save();
    D.frame(ctx, a, bone);
    sleevePiece(ctx, a, mode, D.loc(from, bone), D.loc(to, bone), w0, w1, k === 'N' ? ROBE[1] : ROBE[2]);
    ctx.restore();
  }
}
function drawBell(ctx, a, mode, S, D, k) {
  ctx.save();
  enter(ctx, a, D, `bell${k}`);
  const p = D.J[`bell${k}`];
  ctx.translate(p[0], p[1]);
  sleeveBell(ctx, a, mode, k === 'F');
  ctx.restore();
}
function drawCenser(ctx, a, mode, S, D) {
  const q = a.ac ?? {};
  ctx.save();
  enter(ctx, a, D, 'censer');
  ctx.translate(GRIP[0], GRIP[1]);
  censer(ctx, a, mode, q.lid ?? 0, q.charge ?? 0);
  ctx.restore();
}

// ---------- Her act ----------
const PIECES = { offering: 7.0, play: 8.0, doze: 7.6, hymn: 6.6 };
const ORDER = ['offering', 'play', 'doze', 'hymn'];
const POOL = ['swing', 'wisp', 'cloud'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];
// Where the wisp is while it plays round her (rig space, game px, from her middle), and whether it is
// behind her: a tilted loop round her body, then a dart to her cheek, then home.
function wispPath(u) {
  const an = u * TAU * 1.5 - Math.PI / 2;
  return { x: Math.cos(an) * 15, y: -16 + Math.sin(an) * 5 - Math.sin(u * TAU) * 4, behind: Math.sin(an) < -0.1 };
}

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const q = { face: null, censerR: 0, lid: 0, charge: 0, skirt: 0, trail: 0, smoke: 0.25, rings: 0, wispOut: null, boop: -1, giggleT: -1, clink: -1, sweat: -1, zz: 0, notes: 0, notesT: 0, sparkle: -1, swing: -1, shot: -1, gather: 0, cloud: -1, blush: 0, sway: [0, 0, 0, 0, 0, 0] };
  a.ac = q;
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
  // (floating: by her own travel, as a flyer always counts as moving)
  if (dt > 0) {
    const vx = st.acX == null ? 0 : (m.x - st.acX) / dt;
    st.acV = lerp(st.acV ?? 0, Math.min(140, Math.abs(vx)), Math.min(1, dt * 5));
  }
  st.acX = m.x;
  const fly = alive ? sstep(((st.acV ?? 0) - 6) / 30) : 0;
  // At rest: a slow swell (up a little, down a little, rounding off at each end), the censer held a
  // little out from her on its chain, her far hand resting at her sash.
  const swell = Math.sin(t * 1.25);
  go({ x: 0, hop: 0.17 + swell * 0.018, lift: 0, tilt: Math.sin(t * 0.7) * 1.2, head: Math.sin(t * 0.6 + 1) * 2.4, neckR: Math.sin(t * 0.5) * 1, shN: -24 + swell * 2, elN: -44, hwN: -6, shF: 8 - swell * 1.5, elF: -64, hwF: 10 }, 1);
  // Floating along: leaning into it, the wisps streaming out behind, the censer let swing back.
  go({ tilt: 10, head: -5, neckR: -2, shN: -14, elN: -30, shF: 18, elF: -40 }, fly);
  q.trail = 0.5 * fly + Math.sin(t * 0.9) * 0.06;
  q.skirt = 0.12 * fly;

  // ----- The fight: a wind-up (m.windup) 0..1 through it, the blow (m.attackAt) after -----
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const wind = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  if (wind > 0) st.acWindAt = now;
  const since = now - (m.attackAt ?? -9);
  const striking = since >= 0 && since < 1.0;
  if ((wind > 0 || striking) && alive) {
    if (!st.acAtk) {
      const pool = m.def.moves ?? POOL;
      st.acN = (st.acN ?? m.uid ?? 0) + 1;
      st.acMove = m.move ?? pool[st.acN % pool.length];
    }
    st.acAtk = true;
  } else st.acAtk = false;
  const mvName = st.acAtk ? st.acMove : null;
  // (a blow with no wind-up before it, a bump up close: its wind-up played quickly first)
  const hadWind = now - (st.acWindAt ?? -9) < Math.max(0, since) + 0.15;
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

  // ----- The act (floating about calm, eased in and out) -----
  const calmGoal = !busy && !napping && !m.pose && !m.cine && !hurt && !fighting && fly < 0.05 && alive ? 1 : 0;
  st.acCalm = lerp(st.acCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const cw = sstep(st.acCalm);
  let PC = st.acPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.acOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.acOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.acOrd = (st.acOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.acPiece = PC;
  const piece = PC?.name ?? null;
  const pu = PC?.name ? now - PC.t0 : -1;
  const k = cw;

  if (k > 0.001 && piece === 'offering') {
    const look = win(pu, 0, 0.5, 1.1, 1.5);
    go({ head: -10, neckR: -3 }, look * k);
    say('up', look * k);
    // both hands up, the censer lifted high, held there with her eyes shut
    const up = win(pu, 0.5, 1.4, 4.4, 5.3);
    go({ shN: -158, elN: -26, hwN: -8, shF: -150, elF: -34, hwF: -10, tilt: -4, head: -8, chest: -3, hop: 0.2 }, up * k);
    q.smoke = Math.max(q.smoke, up * k);
    q.rings = up * k;
    say('pray', win(pu, 1.2, 1.4, 4.4, 4.6) * k);
    add({ tilt: Math.sin(pu * 1.6) * 1.6 * up, head: Math.sin(pu * 1.3) * 1.4 * up }, k);
    // lowered, and a small bow
    const bow = win(pu, 5.2, 5.7, 6.2, 6.9);
    go({ tilt: 14, head: 12, neckR: 3, shN: -30, elN: -60, shF: -20, elF: -70 }, bow * k);
    say('smile', bow * k);
  }
  if (k > 0.001 && piece === 'play') {
    // the censer brought up to her chest, the lid opened
    const hold = win(pu, 0, 0.5, 7.0, 7.6);
    go({ shN: -64, elN: -70, hwN: -10, shF: -30, elF: -80 }, hold * k);
    q.censerR += 0.15 * hold * k;
    q.lid = win(pu, 0.6, 0.85, 6.6, 7.0) * k;
    say('down', win(pu, 0.2, 0.4, 0.9, 1.0) * k);
    // the wisp out: a hop up out of the lid, a loop round her, a dart to her cheek, then home
    if (pu > 0.8 && pu < 7.0) {
      const u = pu < 1.1 ? 0 : clamp((pu - 1.1) / 3.4, 0, 1);
      const out0 = sstep((pu - 0.8) / 0.3);
      const home = sstep((pu - 6.2) / 0.7);
      // (it darts to her cheek, boops it and stays there, bobbing, while she giggles)
      const boop = win(pu, 4.4, 4.75, 6.0, 6.3);
      q.wispOut = { u, out: out0 * (1 - home), boop, t: pu };
      const path = wispPath(u);
      say(path.x < -2 ? 'follow' : 'followR', win(pu, 1.1, 1.3, 4.4, 4.6) * k);
      add({ head: (path.x < 0 ? -1 : 1) * 3 * win(pu, 1.1, 1.3, 4.4, 4.6), neckR: path.y * 0.1 }, k);
    }
    if (pu > 4.9 && pu < 5.0) st.acBoopAt = now;
    const gig = win(pu, 4.9, 5.0, 6.0, 6.3);
    add({ chest: Math.sin(pu * 22) * 2.4 * gig, head: Math.sin(pu * 22 - 0.5) * 2.6 * gig, tilt: -4 * gig }, k);
    go({ shF: -96, elF: -118, hwF: -20 }, gig * k);
    say('giggle', gig * k);
    q.blush = Math.max(q.blush, gig * k);
    say('sweet', win(pu, 6.3, 6.5, 7.6, 7.9) * k);
  }
  if (k > 0.001 && piece === 'doze') {
    const pray = win(pu, 0, 0.6, 4.1, 4.3);
    go({ shN: -58, elN: -104, hwN: -20, shF: -52, elF: -100, hwF: -14 }, pray * k);
    say('pray', win(pu, 0.2, 0.4, 1.0, 1.1) * k);
    // nodding off, sinking a little in the air
    const nod = win(pu, 1.0, 1.8, 4.0, 4.2);
    go({ head: 14 + Math.sin(pu * 1.8) * 4, neckR: 4, tilt: 4, hop: 0.14 }, nod * k);
    q.censerR -= 0.1 * nod * k;
    say('sleep', nod * k);
    q.zz = Math.max(q.zz, win(pu, 1.6, 2.0, 3.9, 4.2) * k);
    // the censer clinks: a start, flung arms
    if (pu > 4.15 && pu < 4.25) st.acClinkAt = now;
    const jolt = clamp(boing(pu - 4.2, 9, 20), 0, 1.2) * (1 - sstep((pu - 4.8) / 0.4));
    go({ shN: -120, elN: -40, shF: -110, elF: -30, head: -8, tilt: -6, hop: 0.21 }, clamp(jolt, 0, 1) * k);
    say('surprised', win(pu, 4.2, 4.25, 4.6, 4.7) * k);
    // flustered: a look left, a look right, a bead of sweat
    const fl = win(pu, 4.7, 4.8, 5.9, 6.0);
    const left = Math.floor((pu - 4.7) / 0.35) % 2 === 0;
    say(left ? 'panicL' : 'panic', fl * k);
    add({ head: (left ? -4 : 4) * fl, neckR: (left ? -2 : 2) * fl }, k);
    if (pu > 4.7 && pu < 6.4) q.sweat = (pu - 4.7) / 1.7;
    // her hood straightened
    const fix = win(pu, 6.0, 6.3, 6.9, 7.3);
    go({ shF: -160, elF: -96, hwF: -30, head: 4 }, fix * k);
    say('sorry', fix * k);
    q.blush = Math.max(q.blush, win(pu, 4.7, 5.0, 7.0, 7.5) * k);
  }
  if (k > 0.001 && piece === 'hymn') {
    const hum = win(pu, 0, 0.4, 4.8, 5.2);
    add({ shN: Math.sin(pu * 2.2) * 26 * hum, elN: Math.cos(pu * 2.2) * 18 * hum, tilt: Math.sin(pu * 1.1) * 3 * hum, head: Math.sin(pu * 1.1 + 0.4) * 4 * hum }, k);
    q.censerR += Math.sin(pu * 2.2 - 0.6) * 0.25 * hum * k;
    say('hum', hum * k);
    q.notes = hum * k;
    q.notesT = pu;
    // a twirl: two clean mirror flips, a little rise between
    const tw = pu >= 2.6 && pu < 3.4;
    q.twirl = tw && Math.floor((pu - 2.6) / 0.4) % 2 === 0;
    if (tw) add({ hop: Math.sin(Math.PI * ((pu - 2.6) / 0.8)) * 0.04 }, k);
    // a curtsey, her far hand holding out her skirt
    const cur = win(pu, 5.0, 5.4, 6.0, 6.5);
    go({ tilt: 9, head: 9, neckR: 3, shF: 36, elF: -20, hwF: 20, hop: 0.15 }, cur * k);
    say('smile', cur * k);
    q.skirt -= 0.1 * cur * k;
    if (pu > 5.2 && pu < 6.4) q.sparkle = pu - 5.2;
  }

  // (her own marks over her head: a "!" as she starts hunting you, a "?" when she loses you)
  if (fighting && alive && !st.acHunt) st.acBangAt = now;
  if (!fighting && st.acHunt && alive) st.acLostAt = now;
  st.acHunt = fighting && alive;
  q.bang = now - (st.acBangAt ?? -9);
  q.huh = now - (st.acLostAt ?? -9);
  q.hurtT = hurt ? ago : -1;
  q.gloatT = now - (m.gloatAt ?? -9);
  q.boop = now - (st.acBoopAt ?? -9);
  q.clink = now - (st.acClinkAt ?? -9);
  // ----- Hunting you: a determined pout, the censer ready -----
  if (fighting && alive && !hurt) {
    go({ shN: -56, elN: -50, tilt: 5, head: 3, shF: -10, elF: -80 }, 1 - fly * 0.4);
    q.face = 'fierce';
  }
  if (low && !busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.5) % 1;
  }
  // ----- Her moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.42) / 0.45) : 0;
    // (the censer's long swings come through over a touch longer, so its chain never leaps)
    const snapT = mvName === 'wisp' ? 0.08 : 0.17;
    const snap = s >= 0 ? sstep(s / (hadWind ? snapT : snapT + 0.04)) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'swing') {
      // the censer drawn back past her hip, her body turned away; then swung up and round in front
      go({ shN: 34, elN: -20, hwN: 10, tilt: -9, head: -4, chest: -3, x: -0.03, shF: -40, elF: -50 }, wu);
      q.censerR += 0.6 * wu;
      say('focus', W);
      go({ shN: -118, elN: -22, tilt: 12, head: 6, chest: 5, x: 0.04, shF: 30, elF: -20 }, snap * sw);
      q.censerR -= 0.8 * snap * sw;
      say('shout', snap * sw);
      if (s >= 0 && s < 0.9) q.swing = s;
    } else if (mvName === 'wisp') {
      // the censer held out, its lid open, the wisp swelling bright inside; then shot out at you
      go({ shN: -82, elN: -44, hwN: -10, tilt: -4, head: -2, shF: -40, elF: -70, x: -0.02 }, wu);
      q.lid = Math.max(q.lid, sstep(W / 0.4));
      q.charge = W * (1 - snap);
      say('focus', W);
      go({ shN: -96, elN: -6, tilt: 8, head: 4, x: 0.03 }, snap * sw);
      q.lid = Math.max(q.lid, sw);
      say('shout', snap * win(s, 0, 0.02, 0.3, 0.45));
      say('fierce', snap * win(s, 0.3, 0.45, 0.8, 0.9));
      if (s >= 0 && s < 1.0) q.shot = s;
    } else {
      // the censer whirled overhead, smoke gathering round her; then flung down, a billow of smoke
      go({ shN: -150, elN: -24, hwN: -10, tilt: -6, head: -8, hop: 0.19, shF: -30, elF: -60 }, wu);
      const whirl = W * TAU * 1.5;
      q.censerR += Math.sin(whirl) * 0.7 * wu * (1 - sstep((W - 0.65) / 0.35));
      q.gather = wu;
      say('focus', W);
      go({ shN: -62, elN: -14, tilt: 12, head: 8, chest: 4, x: 0.03, hop: 0.17 }, snap * sw);
      q.censerR -= 0.6 * snap * sw;
      say('shout', snap * sw);
      if (s >= 0 && s < 1.0) q.cloud = s;
    }
  }
  // ----- Hurt: a squeezed wince, a flinch away -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -14, head: 12, neckR: 4, shN: -30, elN: -110, hwN: -20, shF: -70, elF: -110 }, kh);
    q.face = 'hurt';
  }
  // ----- After landing a hit: a sweet little bow (blended in as a move lets go) -----
  const moveW = mvName ? (s >= 0 ? 1 - sstep((s - 0.42) / 0.45) : 1) : 0;
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.1 && alive && !hurt) {
    const kg = win(gl, 0, 0.18, 0.8, 1.1) * (1 - moveW);
    go({ tilt: 12, head: 10, neckR: 3 }, kg);
    say('sweet', kg);
  }
  // ----- A nap: curled up in the air hugging the censer, the wisp dimmed -----
  st.acNap = lerp(st.acNap ?? 0, napping && !busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.acNap);
  if (nw > 0.001) {
    const nod = Math.sin(now * 1.3);
    go({ hop: 0.12 + nod * 0.008, tilt: 8, waist: 4, chest: 4, head: 16 + nod * 3, neckR: 4, shN: -50, elN: -118, hwN: -10, shF: -40, elF: -112 }, nw);
    q.trail -= 0.35 * nw;
    q.smoke *= 1 - nw * 0.8;
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
  // ----- The face: an in-between (a blink) on every change; her own blink rhythm -----
  let f = q.face ?? 'calm';
  if (f !== st.acFace) {
    st.acFaceFrom = st.acFace;
    st.acFace = f;
    st.acFaceAt = now;
  }
  const since0 = now - (st.acFaceAt ?? -9);
  const SHUT = new Set(['happy', 'giggle', 'sweet', 'shout', 'hurt', 'yawn', 'sleep', 'shut', 'pray', 'hum', 'dizzy']);
  if (since0 >= 0 && since0 < 0.07 && st.acFaceFrom && !SHUT.has(f) && !SHUT.has(st.acFaceFrom)) f = 'blink';
  const bl = (now + (m.uid ?? 0) * 0.77) % 4.2;
  if (bl < 0.12 && !SHUT.has(f) && f !== 'blink') f = 'blink';
  q.face = f;
  // (the lid, the skirt and the wisps' streaming eased, so nothing ever snaps)
  for (const key of ['lid', 'skirt', 'trail', 'censerR', 'blush']) {
    st[`ac_${key}`] = lerp(st[`ac_${key}`] ?? q[key], q[key], ease(key === 'censerR' ? 14 : 12));
    q[key] = st[`ac_${key}`];
  }
  // (her fringe's sections, each on its own little sway from her head's motion, never in step)
  const hs = (st.acHeadV = lerp(st.acHeadV ?? 0, ((out.head ?? 0) - (st.acHead0 ?? out.head ?? 0)) / Math.max(dt, 1e-3), ease(10)));
  st.acHead0 = out.head ?? 0;
  for (let i = 0; i < 6; i++) q.sway[i] = clamp(-hs * 0.0016 * (0.8 + (i % 3) * 0.2), -0.04, 0.04) + Math.sin(t * (1.1 + i * 0.13) + i * 1.7) * 0.006;
  st.acTwirl = Boolean(q.twirl);
}

// ---------- Live effects (rig space, game px, the point she floats over at 0, 0) ----------
// A puff of smoke: a soft round cloud with a lilac line and a white heart.
function puff(ctx, x, y, r, al, pass) {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 0.92);
  if (pass === 'line') {
    ctx.lineWidth = Math.max(0.4, r * 0.3);
    ctx.strokeStyle = SMOKE_INK;
    ctx.stroke();
  } else {
    ctx.fillStyle = MIST[1];
    ctx.fill();
    ell(ctx, x - r * 0.18, y - r * 0.2, r * 0.6, r * 0.5);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  ctx.restore();
}
// A soft cluster of puffs (outlines first, then fills, so they read as one cloud).
function cloud(ctx, list) {
  for (const pass of ['line', 'fill']) for (const [x, y, r, al] of list) puff(ctx, x, y, r, al, pass);
}
// A ring of smoke drifting up (a soft open ellipse with a pale core line).
function smokeRing(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 0.34);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = SMOKE_INK;
  ctx.stroke();
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = '#f6f0ff';
  ctx.stroke();
  ctx.restore();
}
// The curvy sparkle star.
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
      ctx.strokeStyle = '#7a62c2';
      ctx.stroke();
    } else {
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = '#eee6ff';
      ctx.stroke();
      ctx.fillStyle = '#eee6ff';
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
  ctx.strokeStyle = '#8a76c8';
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = '#f4f0ff';
  ctx.stroke();
  ctx.restore();
}
function sweatDrop(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -r * 2);
  ctx.bezierCurveTo(r * 0.35, -r * 1.4, r * 1.05, -r * 0.6, r, 0);
  ctx.arc(0, 0, r, 0, Math.PI);
  ctx.bezierCurveTo(-r * 1.05, -r * 0.6, -r * 0.35, -r * 1.4, 0, -r * 2);
  ctx.closePath();
  ctx.lineWidth = Math.max(0.3, r * 0.4);
  ctx.strokeStyle = '#6aa6d8';
  ctx.stroke();
  ctx.fillStyle = '#d4f0ff';
  ctx.fill();
  ell(ctx, -r * 0.35, -r * 0.4, r * 0.28, r * 0.38, -0.4);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
// A thought bubble over her head with a soft rounded mark in it ('!' or '?').
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
      ctx.strokeStyle = '#9a84d0';
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }
  ctx.lineCap = 'round';
  ctx.strokeStyle = mark === '!' ? '#e2589a' : '#7a62c2';
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

// Under everything: the wisp when it plays behind her; every loose piece swung once a frame.
function under2(ctx, m, a, S, matOf, D) {
  for (const n of SOFT_NAMES) a.blMat(n);
  const q = a.ac ?? {};
  if (q.wispOut && m.hp > 0) {
    const p = wispPath(q.wispOut.u);
    if (p.behind && q.wispOut.boop < 0.05) drawPlayWisp(ctx, m, a, D, q, 0.85);
  }
}
// The wisp out playing: hopping up out of the lid, looping round her, darting to boop her cheek, home.
function drawPlayWisp(ctx, m, a, D, q, dim = 1) {
  const w = q.wispOut;
  const [cx, cy] = censerAt(a, D, -6);
  const p = wispPath(w.u);
  const [bx, by] = headAt(a, D, [42, 24]);
  const [mx, my] = pointIn(a, D, 'chest', [80, 96]);
  let x = lerp(cx, mx + p.x, sstep((w.t - 0.8) / 0.5));
  let y = lerp(cy, my + p.y, sstep((w.t - 0.8) / 0.5)) - Math.sin(Math.PI * clamp((w.t - 0.8) / 0.5, 0, 1)) * 5;
  x = lerp(x, bx + 2.4, w.boop);
  y = lerp(y, by, w.boop);
  // (going home: back down into the lid)
  const home = sstep((w.t - 6.2) / 0.7);
  x = lerp(x, cx, home);
  y = lerp(y, cy, home);
  const t = a.now ?? 0;
  for (let i = 1; i <= 3; i++) sparkle(ctx, x - Math.cos(t * 3 + i) * (2 + i * 2), y + 2 + i * 1.2, 0.7 * w.out * (1 - i * 0.22), dim, WISP[0], WISP[3]);
  wispFlame(ctx, a, x, y + Math.sin(t * 5) * 0.6, 1.9 * (0.4 + 0.6 * w.out), dim * (0.3 + 0.7 * w.out), -(a.flip ? -1 : 1) * 0.3, t);
}

// Over everything: the censer's smoke and the wisp's glow, the moves, her marks.
function fx(ctx, m, a, S, matOf, D) {
  const q = a.ac ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.41;
  if (m.hp <= 0) return;
  const st = a.mo.rig ?? {};
  const [cx, cy] = censerAt(a, D, -8);
  // the wisp's glow through the censer's windows
  const [gx, gy] = censerAt(a, D, 1);
  ctx.save();
  glow(ctx, gx, gy, 5 + (q.charge ?? 0) * 6, WISP[2], 0.28 + (q.charge ?? 0) * 0.4);
  ctx.restore();
  // a thin curl of smoke always rising off the lid (more in the offering), soft rings in the offering
  const sm = q.smoke ?? 0;
  const list = [];
  for (let i = 0; i < 4; i++) {
    const f = (t * 0.32 + i / 4) % 1;
    const n = Math.floor(t * 0.32 + i / 4);
    list.push([cx + Math.sin(f * 5 + n) * (1.2 + f * 3), cy - f * (14 + sm * 10), (0.8 + f * 1.6) * (0.6 + sm * 0.4), sm * Math.sin(Math.PI * f) * 0.8]);
  }
  cloud(ctx, list);
  if ((q.rings ?? 0) > 0.05) {
    for (let i = 0; i < 2; i++) {
      const f = (t * 0.45 + i * 0.5) % 1;
      smokeRing(ctx, cx + Math.sin(f * 4) * 1.4, cy - 6 - f * 18, 1.6 + f * 3.2, q.rings * Math.sin(Math.PI * f));
    }
  }
  // the wisp out playing (in front of her)
  if (q.wispOut) {
    const p = wispPath(q.wispOut.u);
    if (!p.behind || q.wispOut.boop >= 0.05) drawPlayWisp(ctx, m, a, D, q);
  }
  // the boop on her cheek: a little heart-shaped sparkle pop
  if (q.boop >= 0 && q.boop < 0.7) {
    const [bx, by] = headAt(a, D, [40, 16]);
    const e = q.boop / 0.7;
    for (let i = 0; i < 4; i++) {
      const an = -Math.PI / 2 + (i - 1.5) * 0.7;
      sparkle(ctx, bx + Math.cos(an) * (2 + e * 5), by + Math.sin(an) * (2 + e * 4), 1.1 * Math.sin(Math.PI * e), 1, i % 2 ? '#fff4c8' : '#ffffff');
    }
  }
  // the clink that wakes her: a gold glint off the censer and two little sparkles
  if (q.clink >= 0 && q.clink < 0.5) {
    const e = q.clink / 0.5;
    const [kx, ky] = censerAt(a, D, -2);
    sparkle(ctx, kx + 4, ky - 3, 2.2 * Math.sin(Math.PI * e), 1, '#fff6c8');
    sparkle(ctx, kx - 3, ky - 5 - e * 3, 1.2 * Math.sin(Math.PI * e), 1, '#ffffff');
  }
  // ----- Censer Swing: a ribbon of teal-lilac smoke along the censer's path, a puff where it lands -----
  st.acTrail ??= [];
  if ((q.swing ?? -1) >= 0 && q.swing < 0.45) st.acTrail.push({ x: cx, y: cy + 6, at: a.now ?? 0 });
  st.acTrail = st.acTrail.filter((p) => (a.now ?? 0) - p.at < 0.45 && (a.now ?? 0) >= p.at);
  if (st.acTrail.length > 1) {
    const L = [];
    st.acTrail.forEach((p, i) => {
      const e = ((a.now ?? 0) - p.at) / 0.45;
      if (i % 2 === 0) L.push([p.x, p.y - e * 3, (1.3 + i * 0.05) * (1 - e * 0.4), (1 - e) * 0.9]);
    });
    cloud(ctx, L);
    for (let i = 1; i < st.acTrail.length; i += 3) {
      const p = st.acTrail[i];
      const e = ((a.now ?? 0) - p.at) / 0.45;
      sparkle(ctx, p.x, p.y, 0.9 * (1 - e), 1, WISP[0], WISP[3]);
    }
  }
  if ((q.swing ?? -1) >= 0.12 && q.swing < 0.75) hitPop(ctx, 22, -12, (q.swing - 0.12) / 0.63);
  // ----- Wisp Shot: the wisp swelling in the censer, then out at you and home again -----
  if ((q.charge ?? 0) > 0.05) {
    const [wx, wy] = censerAt(a, D, -4);
    wispFlame(ctx, a, wx, wy - q.charge * 3, 1.2 + q.charge * 1.6, q.charge, 0, t);
    for (let i = 0; i < 4; i++) {
      const an = t * 3 + (i / 4) * TAU;
      const r = 7 - q.charge * 4;
      sparkle(ctx, wx + Math.cos(an) * r, wy - 3 + Math.sin(an) * r * 0.7, 0.8, q.charge, WISP[0], WISP[3]);
    }
  }
  if ((q.shot ?? -1) >= 0 && q.shot < 1.0) {
    const s = q.shot;
    if (!a.mo.acShotAt || s < 0.03) a.mo.acShotAt = censerAt(a, D, -4);
    const [ox, oy] = a.mo.acShotAt;
    const out0 = sstep(s / 0.3);
    const back = sstep((s - 0.55) / 0.4);
    const x = lerp(ox, 34, out0 * (1 - back)) + (back > 0 ? lerp(0, 0, back) : 0);
    const y = lerp(oy, -14, out0 * (1 - back)) - Math.sin(Math.PI * out0) * 4;
    const fx0 = lerp(x, ox, back);
    const fy0 = lerp(y, oy, back);
    for (let i = 1; i <= 4; i++) {
      const lag = i * 2.6 * (back > 0 ? -1 : 1);
      sparkle(ctx, fx0 - lag, fy0 + Math.sin(i * 1.3 + t * 8) * 1.2, 1.0 * (1 - i * 0.2), 1, WISP[0], WISP[3]);
    }
    wispFlame(ctx, a, fx0, fy0, 2.2, 1, back > 0 ? 0.5 : -0.6, t);
    if (s > 0.28 && s < 0.7) hitPop(ctx, 34, -14, (s - 0.28) / 0.42, true);
  } else a.mo.acShotAt = null;
  // ----- Incense Cloud: smoke gathering round her as she whirls it, then a billow rolling at you -----
  if ((q.gather ?? 0) > 0.05) {
    const L = [];
    for (let i = 0; i < 6; i++) {
      const an = t * 2.4 + (i / 6) * TAU;
      const r = 16 - q.gather * 8;
      L.push([Math.cos(an) * r, -22 + Math.sin(an) * r * 0.45, 1.4 + q.gather * 0.8, q.gather * 0.75]);
    }
    cloud(ctx, L);
  }
  if ((q.cloud ?? -1) >= 0 && q.cloud < 1.0) {
    const s = q.cloud;
    const L = [];
    for (let i = 0; i < 9; i++) {
      const u = clamp((s - i * 0.03) / 0.75, 0, 1);
      if (u <= 0) continue;
      const x = 6 + sstep(u) * (14 + (i % 3) * 7);
      const y = -2.6 - (i % 2) * 2.6 - Math.sin(u * Math.PI) * 4 - u * 3;
      L.push([x, y, (1.6 + (i % 3) * 0.7) * (0.6 + u * 0.8), 1 - sstep((u - 0.6) / 0.4)]);
    }
    cloud(ctx, L);
    for (let i = 0; i < 3; i++) {
      const u = clamp((s - 0.1 - i * 0.1) / 0.6, 0, 1);
      sparkle(ctx, 14 + i * 7, -8 - u * 6, 1.2 * Math.sin(Math.PI * u), 1, '#fff6c8');
    }
  }
  // a bead of sweat by her temple
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [36, -10]);
    const f = q.sweat % 1;
    sweatDrop(ctx, hx, hy + sstep(f) * 5, 0.9, Math.sin(Math.PI * f));
  }
  // humming: notes floating up off her lips
  if ((q.notes ?? 0) > 0.05) {
    const [mx, my] = headAt(a, D, [8, 24]);
    for (let i = 0; i < 2; i++) {
      const f = ((q.notesT ?? 0) * 0.6 + i * 0.5) % 1;
      note(ctx, mx + 3 + f * 7 + Math.sin(f * 6 + i) * 1.2, my - 3 - f * 11, 0.7, q.notes * Math.sin(Math.PI * f), a.flip);
    }
  }
  // asleep: soft z's drifting up
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [26, -50]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.45 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip);
    }
  }
  // her marks: "!" (hunting you), "?" (lost you); a happy sparkle after landing a hit; a little puff of
  // smoke jolted out of the censer when she's hit
  const [bx, by] = headAt(a, D, [36, -80]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip);
  if (q.gloatT >= 0 && q.gloatT < 1.0) {
    const e = q.gloatT;
    sparkle(ctx, bx - 4 + e * 4, by + 8 - e * 6, 1.6 * Math.sin(Math.PI * e), 1, '#fff6c8');
    sparkle(ctx, bx + 3, by + 12 - e * 4, 1.0 * Math.sin(Math.PI * clamp(e * 1.3 - 0.2, 0, 1)), 1);
  }
  if (q.hurtT >= 0 && q.hurtT < 0.5) {
    const e = q.hurtT / 0.5;
    const L = [];
    for (let i = 0; i < 4; i++) L.push([cx + (i - 1.5) * 2 * (1 + e), cy - 2 - e * 6 - (i % 2) * 2, 1.2 + e, 1 - e]);
    cloud(ctx, L);
  }
  // the curtsey's sparkles
  if ((q.sparkle ?? -1) >= 0) {
    const [px, py] = headAt(a, D, [0, -20]);
    for (let i = 0; i < 3; i++) {
      const f = clamp(q.sparkle * 1.2 - i * 0.2, 0, 1);
      sparkle(ctx, px - 10 + i * 10, py - 10 - f * 6, (i % 2 ? 1.1 : 1.6) * Math.sin(Math.PI * f), 1, i % 2 ? '#fff6c8' : '#ffffff');
    }
  }
  ctx.globalAlpha = base;
}
// Where a blow lands: a soft pop of smoke puffs opening out, a sparkle in the middle.
function hitPop(ctx, x, y, u, teal = false) {
  if (u <= 0 || u >= 1) return;
  const L = [];
  for (let i = 0; i < 6; i++) {
    const an = (i / 6) * TAU + 0.3;
    const d = 2 + sstep(u) * 6;
    L.push([x + Math.cos(an) * d, y + Math.sin(an) * d * 0.8, (1.4 + (i % 2) * 0.5) * (1 - u * 0.5), 1 - sstep((u - 0.5) / 0.5)]);
  }
  cloud(ctx, L);
  sparkle(ctx, x, y, 2.6 * Math.sin(Math.PI * clamp(u * 1.4, 0, 1)), 1, teal ? WISP[0] : '#fff6c8', teal ? WISP[3] : '#d8a444');
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
    handFskin: (ctx, a, mode, S, D) => drawBell(ctx, a, mode, S, D, 'F'),
    handNskin: (ctx, a, mode, S, D) => drawBell(ctx, a, mode, S, D, 'N'),
  },
  // (her sleeves draw her arms whole; she floats, her robe thinning into wisps where her legs would be)
  hide: ['armF', 'armN', 'legF', 'footFskin', 'legN', 'footNskin'],
  over: {
    armFf: (ctx, a, mode, S, D) => drawSleeve(ctx, a, mode, S, D, 'F'),
    torsoSkin: drawRobe,
    neckSkin: drawCapelet,
    head: drawHead,
    armNf: (ctx, a, mode, S, D) => drawSleeve(ctx, a, mode, S, D, 'N'),
    handNskin: drawCenser,
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
  // her floating goes by her own travel; her twirl is clean mirror flips)
  const moving0 = a.moving;
  const flip0 = a.flip;
  a.moving = false;
  const st = a.mo.rig;
  if (st?.acTwirl && m.hp > 0) a.flip = !a.flip;
  draw0(ctx, m, a);
  a.moving = moving0;
  a.flip = flip0;
  a.gait = null;
};
rig.w = Math.round(rig.w * 1.2);
rig.h = Math.round(rig.h * 1.25);
// (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: its marks over her head left
// to her, drawn here in her own style)
export const ACOLYTE_ART = { pad: 12, walk: 8, idle: 8, attack: 5, stride: R.stride, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const ACOLYTE_SIZE = { w: 26, h: Math.round(R.H * 1.14) };
export const ACOLYTE_DRESS = DRESS;
