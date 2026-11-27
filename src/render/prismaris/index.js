// Prismaris, the Little Crystal King, on screen (2026-11-27, rebuilt to today's standard keeping his idea;
// the ids stay `crystalking`, the Crystal Throne's field boss, and `nightking`, his Chapter 10 trial in the
// Dark Throne). A little boy-king scared of the dark, playing at being terribly grand under a crown far too
// big for him. His look is in art.js; he moves on his own copy of the kid base's rig (kidrig.js: its bones
// and springs; the base's own moves left out), drawn 2.6 times the kid's size, every loose piece on the
// engine's soft-layer springs (both halves of his cape, his doublet's two skirt panels, the two sides of
// his bob, the crown riding loose on his head, the alarm clock swinging on its chain in his trial).
//   idle    his act, in four pieces, the next one that fits the time he has before he moves on (data
//           `rest`; world/mobs.js tells him, `m.restUntil`):
//           - crown (7.6 s): the crown slides down over his eyes; he shoves it back up; it tips over the
//             other way; a huff, cheeks puffed, and he holds it on with one hand, chin up, very royal;
//           - decree (8.4 s): a cough, the sceptre raised high, a proclamation (his mouth working through
//             the words); then a drip echoes in the dark: he jumps, ducks behind his raised arms, peeks
//             left and right, straightens up and pretends nothing happened;
//           - rainbow (8.0 s): he holds the prism up to the light: a little rainbow lands on the floor
//             before him; delighted, he taps it with his toe, it skips away, he hops after it, giggling;
//           - dark (7.4 s): wide eyes left, right, a shiver, and he hugs himself small (in his trial the
//             Queen's clock goes off under its sock: he smothers it, "shh!", then a sigh of relief).
//   walk    small careful steps (the kid walk on a short stride), the sceptre carried before him, the
//           cape trailing, the crown nodding a beat behind.
//   swings  between casts, at whoever's touching him, in turn: Royal Tap (the sceptre up over his
//           shoulder and tapped down: a little gem burst), Little Stomp (a knee up, fists clenched, and a
//           STOMP: crystals pop up round his slipper), Prism Gleam (the prism drawn back and thrust out: a
//           short fan of rainbow).
//   casts   (m.castPose, world/prismaris.js through world/story.js rotationTurn) audience (Kneel Before
//           the King!: chin up, the crown set straight, the sceptre raised, the crown slips over his eyes,
//           shoved up), mine (MINE!: the clock hugged, head shaking, a stamp), bonk (Royal Bonk: the
//           sceptre hauled up overhead on tiptoe, then WHACK), beam (Prism Beam: the prism levelled at you,
//           light gathering in it), gems (Royal Gems: the sceptre pointed at your feet, then flicked up),
//           tantrum (Royal Tantrum: stamping and wailing, the crown bouncing; a double stamp), portrait
//           (Royal Portrait: chest out, chin up, the sceptre across him, a hand on his hip: hold it...),
//           refract (Refraction: the sceptre up high at the ceiling, looking up, then swept down), mirror
//           (Mirror, Mirror: the prism held up to one side then the other, a smug look).
//   else    hurt: a squeezed wince, the crown jolted; after landing a hit: a royal "hmph", the sceptre
//           up; hunting you: the sceptre out before him, chin up, trying very hard to look brave; low on
//           health: teary, panting, the crown askew; beaten: sat down, dizzy, the crown over one eye.
//   scenes  tantrum (his entrance: a stamp of each foot, fists down, the crown bouncing, then the
//           sceptre jabbed at you), give (the clock lifted off and held out), getstar (a little star in
//           his hand), and his moods: angry, sad, happy, surprised, talking. His marks over his head (!,
//           ?, z's, sweat) are his own (`ownEmotes`).
// Every effect is drawn here, live, in his own soft style: crystal glints as the game's curvy sparkles,
// light as soft rainbow fans, crystals as small rounded prisms, never specks.
import { dressRig } from './kidrig.js';
import {
  TAU, D2R, clamp, lerp, sstep, win, pulse, boing, hash, ell, rgba, glow, smoothPath,
  SKIN, HAIR, RAINBOW, PRISM, GOLD, VELVET, SC, HS, HX, HY, hk, FACES, SHUTS,
  faceDraw, backHair, sideLock, drawHair, crown, sceptre, clockFace, PRISM_TIP, shard, rainbowFan,
  doublet, skirtPanel, breechSeat, breechLeg, tights, slipper, sleeve, capelet, capeHalf, capeYoke, CAPE_ROOT,
  DOUBLET, DOUBLET_INK,
} from './art.js';

export const BIG = 2.6;

// ---------- His loose pieces, on the engine's soft springs ----------
const CROWN_AT = [0, -47];
const CLOCK_TOP = [80.6, 88.4];
const JOINTS = {
  lockF: hk([-35.4, -16]), lockN: hk([36, -16]), crownP: hk(CROWN_AT),
  capeF: CAPE_ROOT.F, capeN: CAPE_ROOT.N, skF: [72, 103.4], skN: [88.6, 103.4], clockC: CLOCK_TOP,
};
const SOFTS = [
  { name: 'lockF', parent: 'head', pivot: 'lockF', soft: { k: 120, c: 7, gain: 0.4, turn: 0.8, hang: 0.4, max: 8, flutter: 0.8, hz: 0.5, dir: [0, 6] } },
  { name: 'lockN', parent: 'head', pivot: 'lockN', soft: { k: 126, c: 7, gain: 0.4, turn: 0.8, hang: 0.4, max: 8, flutter: 0.8, hz: 0.56, dir: [0, 6] } },
  // (the crown rides loose: tipped by how far it has slipped, wobbling on its own, damped)
  { name: 'crown', parent: 'head', pivot: 'crownP', rot: (S, a) => (a.pm?.crown ?? 0) * D2R, soft: { k: 90, c: 7.4, gain: 0.32, turn: 0.7, hang: 0, max: 12, dir: [0, -6] } },
  { name: 'capeF', parent: 'chest', pivot: 'capeF', rot: (S, a) => -(a.pm?.cape ?? 0) * D2R, soft: { k: 58, c: 6.4, gain: 0.5, turn: 0.9, hang: 0.55, max: 16, flutter: 1, hz: 0.4, dir: [-2, 12] } },
  { name: 'capeN', parent: 'chest', pivot: 'capeN', rot: (S, a) => (a.pm?.cape ?? 0) * 0.8 * D2R, soft: { k: 62, c: 6.4, gain: 0.5, turn: 0.9, hang: 0.55, max: 16, flutter: 1, hz: 0.46, dir: [2, 12] } },
  { name: 'skF', parent: 'torso', pivot: 'skF', rot: (S, a) => (a.pm?.skF ?? 0) * D2R, soft: { k: 100, c: 6.8, gain: 0.5, turn: 0.9, hang: 0.5, max: 12, dir: [-1, 8] } },
  { name: 'skN', parent: 'torso', pivot: 'skN', rot: (S, a) => (a.pm?.skN ?? 0) * D2R, soft: { k: 106, c: 6.8, gain: 0.5, turn: 0.9, hang: 0.5, max: 12, dir: [1, 8] } },
  // (his trial: the Queen's clock on its chain, a heavy little pendulum, damped)
  { name: 'clock', parent: 'chest', pivot: 'clockC', rot: (S, a) => (a.pm?.clk ?? 0) * D2R, soft: { k: 80, c: 7.2, gain: 0.4, turn: 0.8, hang: 0.6, max: 14, dir: [0, 10] } },
];
const SOFT_NAMES = SOFTS.map((p) => p.name);
const PIVOT = { chest: 'ribs', waistB: 'navel', torso: 'hip', head: 'neck', armFu: 'shF', armFf: 'elF', armNu: 'shN', armNf: 'elN', handF: 'wrF', handN: 'wrN', thighF: 'hipF', thighN: 'hipN', shinF: 'kneeF', shinN: 'kneeN', footF: 'ankF', footN: 'ankN', ...Object.fromEntries(SOFTS.map((p) => [p.name, p.pivot])) };
function enter(ctx, a, D, bone) {
  ctx.transform(...a.blMat(bone));
  const p = D.J[PIVOT[bone]];
  ctx.translate(-p[0] * SC, -p[1] * SC);
  ctx.scale(SC, SC);
}
function headFrame(ctx, a, D, bone = 'head') {
  enter(ctx, a, D, bone);
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
// (the sceptre's grip, in the near hand, kid units)
const GRIP = [95.4, 113.4];
const isTrial = (m) => m.def?.id === 'nightking';

// ---------- Drawing ----------
function drawHead(ctx, a, mode, S, D) {
  const q = a.pm ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  ctx.save();
  headFrame(ctx, a, D);
  // (a proud chin up: the face only, never stretched)
  faceDraw(ctx, a, mode, f);
  for (const [k, root, o, len] of [['lockF', [-35.4, -16], -1, 38], ['lockN', [36, -16], 1, 36]]) sideLock(ctx, a, mode, root, len, 9.4, o, swingOf(a, k, 'head') * 0.8);
  drawHair(ctx, a, mode);
  ctx.restore();
  // the crown, riding loose on its own spring, slid down as far as it has slipped
  ctx.save();
  headFrame(ctx, a, D, 'crown');
  ctx.translate(CROWN_AT[0], CROWN_AT[1] + (q.crownDrop ?? 0));
  crown(ctx, a, mode);
  ctx.restore();
}
function drawBack(ctx, a, mode, S, D) {
  // his bob behind him, then the cape
  ctx.save();
  headFrame(ctx, a, D);
  backHair(ctx, a, mode);
  ctx.restore();
  for (const k of ['F', 'N']) {
    ctx.save();
    enter(ctx, a, D, `cape${k}`);
    capeHalf(ctx, a, mode, k);
    ctx.restore();
  }
  ctx.save();
  enter(ctx, a, D, 'chest');
  capeYoke(ctx, a, mode);
  ctx.restore();
}
function drawTorso(ctx, a, mode, S, D) {
  ctx.save();
  enter(ctx, a, D, 'torso');
  breechSeat(ctx, a, mode);
  ctx.restore();
  ctx.save();
  enter(ctx, a, D, 'chest');
  doublet(ctx, a, mode);
  ctx.restore();
  for (const k of ['F', 'N']) {
    ctx.save();
    enter(ctx, a, D, `sk${k}`);
    skirtPanel(ctx, a, mode, k);
    ctx.restore();
  }
}
function drawCollar(ctx, a, mode, S, D, m) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  capelet(ctx, a, mode, !isTrial(m));
  ctx.restore();
  // his trial: the Queen's alarm clock on its gold chain, glowing like a nightlight
  if (isTrial(m) && (a.pm?.clockOn ?? 1) > 0.01) {
    ctx.save();
    enter(ctx, a, D, 'clock');
    if (mode === 'fill') {
      ctx.beginPath();
      ctx.moveTo(CLOCK_TOP[0] - 2.4, CLOCK_TOP[1] - 0.6);
      ctx.quadraticCurveTo(CLOCK_TOP[0], CLOCK_TOP[1] + 3, CLOCK_TOP[0] + 2.4, CLOCK_TOP[1] - 0.6);
      ctx.moveTo(CLOCK_TOP[0], CLOCK_TOP[1] + 1.4);
      ctx.lineTo(CLOCK_TOP[0], CLOCK_TOP[1] + 4.6);
      ctx.strokeStyle = GOLD[2];
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    ctx.translate(CLOCK_TOP[0], CLOCK_TOP[1] + 10.6);
    clockFace(ctx, a, mode, 6, a.pm?.ring ?? 0);
    ctx.restore();
  }
}
function drawSleeve(ctx, a, mode, S, D, k) {
  const far = k === 'F';
  for (const [bone, from, to, w0, w1] of [[`arm${k}u`, `sh${k}`, `el${k}`, 12.6, 10], [`arm${k}f`, `el${k}`, `wr${k}`, 9.6, 9.4]]) {
    ctx.save();
    D.frame(ctx, a, bone);
    sleeve(ctx, a, mode, D.loc(from, bone), D.loc(to, bone), w0, w1, far ? DOUBLET[2] : DOUBLET[1], DOUBLET_INK, bone.endsWith('f'));
    ctx.restore();
  }
}
// The sceptre in his near hand: turned to the angle his pose asks for (0 upright, + leaning the way he
// faces), whatever his hand is doing; his fingers round its grip.
function drawSceptre(ctx, a, mode, S, D) {
  const q = a.pm ?? {};
  if ((q.rodOn ?? 1) < 0.5) return;
  ctx.save();
  enter(ctx, a, D, 'handN');
  ctx.translate(GRIP[0], GRIP[1]);
  const handAng = angOf(a.blMat('handN'));
  ctx.rotate((q.rod ?? 24) * D2R - handAng);
  sceptre(ctx, a, mode, q.shine ?? 0);
  if (mode === 'fill') {
    // his fingers wrapped round the rod
    ell(ctx, 0.6, 1.2, 3.4, 2.6);
    ctx.fillStyle = SKIN.base;
    ctx.fill();
    ctx.strokeStyle = SKIN.sh;
    ctx.lineWidth = 0.5;
    for (const y of [0.4, 2]) {
      ctx.beginPath();
      ctx.moveTo(-1.6, y);
      ctx.lineTo(2.4, y);
      ctx.stroke();
    }
  }
  ctx.restore();
}
// A little star of his own in his far hand (the cutscene's gift).
function drawStar(ctx, a, mode, S, D) {
  if (!a.pm?.star) return;
  ctx.save();
  enter(ctx, a, D, 'handF');
  const [wx, wy] = D.J.wrF;
  ctx.translate(wx, wy + 9);
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const an = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 2.8 : 6.2;
    pts.push([Math.cos(an) * r, Math.sin(an) * r]);
  }
  smoothPath(ctx, pts);
  if (mode === 'line') {
    ctx.strokeStyle = '#c8962a';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  } else {
    ctx.fillStyle = '#fff1a0';
    ctx.fill();
    glow(ctx, 0, 0, 9, '#fff6c8', 0.5);
  }
  ctx.restore();
}
function drawLegs(k) {
  return (ctx, a, mode, S, D) => {
    ctx.save();
    enter(ctx, a, D, `shin${k}`);
    tights(ctx, a, mode, k);
    ctx.restore();
    ctx.save();
    enter(ctx, a, D, `thigh${k}`);
    breechLeg(ctx, a, mode, k);
    ctx.restore();
  };
}
function drawFoot(k) {
  return (ctx, a, mode, S, D) => {
    ctx.save();
    enter(ctx, a, D, `foot${k}`);
    slipper(ctx, a, mode, k);
    ctx.restore();
  };
}

// ---------- His act and his fight ----------
const PIECES = { crown: 7.6, decree: 8.4, rainbow: 8.0, dark: 7.4 };
const ORDER = ['crown', 'decree', 'rainbow', 'dark'];
const POOL = ['tap', 'stomp', 'gleam'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const trial = isTrial(m);
  const q = { face: null, crown: 0, crownDrop: 0, cape: 0, skF: 0, skN: 0, clk: 0, ring: 0, rod: 24, shine: 0, gather: 0, beamT: -1, gemT: -1, popT: -1, tapT: -1, rainbow: -1, drip: -1, star: false, clockOn: 1, rodOn: 1, sweat: -1, zz: 0, hmph: -1, shiver: 0, tearT: -1, flashT: -1, fanT: -1, raysT: -1, bounceT: -1 };
  a.pm = q;
  const go = (p, k) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const add = (p, k) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + val * k;
  };
  const say = (f, k) => {
    if (k > 0.45) q.face = f;
  };
  const rodTo = (v, k) => {
    if (k > 0.001) q.rod += (v - q.rod) * k;
  };
  const walking = clamp(a.walkW ?? 0, 0, 1);
  const alive = m.hp > 0;
  const br = c.breath ?? 0;
  // Standing: the sceptre held before him, leaning forward so its prism sits clear of his face; his free
  // hand loose; his weight on one leg, a slow breath, a slow shift.
  const sway = Math.sin(t * 0.5);
  go({ shF: 10 + br * 2, elF: -18, hwF: 6, shN: -12 - br * 1.5, elN: -46, hwN: -6, tilt: sway * 1.2, head: -sway * 1 + Math.sin(t * 0.7) * 1.4 }, 1 - walking);
  // His careful little walk: the sceptre carried before him, the free arm swinging a little.
  const u = a.blkidU ?? 0;
  const p = u * TAU;
  const fold = (v) => (1 - Math.cos(v)) / 2;
  go({ shF: 2 - Math.cos(p - 0.15) * 14, elF: -10 - fold(p - 0.4) * 12, shN: -16 + Math.cos(p - 0.15) * 4, elN: -50, tilt: 3 + Math.sin(p - 0.5) * 1.2, head: 1 + Math.sin(p * 2 - 1) * 1.2 }, walking);
  q.cape = 4 * walking + Math.sin(p - 1) * 2 * walking;
  q.skF = Math.sin(p + Math.PI) * 5 * walking;
  q.skN = Math.sin(p) * 5 * walking;
  q.crown = Math.sin(p * 2 - 1.6) * 1.6 * walking + Math.sin(t * 0.8) * 0.6;
  q.clk = Math.sin(p * 2 - 1) * 4 * walking;

  // ----- The fight: his casts, and his swings outside them -----
  const casting = alive && m.cast && m.castPose;
  if (casting && st.pmCastT0 !== m.cast.t0) {
    st.pmCastT0 = m.cast.t0;
    st.pmMove = m.castPose;
  }
  const since = now - (m.attackAt ?? -9);
  const striking = since >= 0 && since < 1.3;
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const winding = alive && !casting && m.windup > 0;
  if (winding) {
    if (!(now - (st.pmWindAt ?? -9) < 0.2)) {
      st.pmN = (st.pmN ?? m.uid ?? 0) + 1;
      st.pmMove = (m.def.moves ?? POOL)[st.pmN % (m.def.moves ?? POOL).length];
    }
    st.pmWindAt = now;
  }
  if (!casting && striking && alive && st.pmAtkAt !== m.attackAt) {
    st.pmAtkAt = m.attackAt;
    const afterCast = st.pmCastT0 != null && m.attackAt >= st.pmCastT0 && m.attackAt - st.pmCastT0 < 6 && st.pmLastStrike !== st.pmCastT0;
    if (afterCast) st.pmLastStrike = st.pmCastT0;
    else if (!(now - (st.pmWindAt ?? -9) < 0.2)) {
      st.pmN = (st.pmN ?? m.uid ?? 0) + 1;
      st.pmMove = m.move ?? (m.def.moves ?? POOL)[st.pmN % (m.def.moves ?? POOL).length];
    }
  }
  const hadWind = now - (st.pmWindAt ?? -9) < Math.max(0, since) + 0.15;
  const cine = m.cine ?? {};
  const act = cine.act && now - cine.act.at >= 0 && now - cine.act.at < (cine.act.dur ?? 1) + 1.2 ? cine.act : null;
  let mv = alive && (casting || striking || winding) ? st.pmMove : null;
  const isSwing = POOL.includes(mv);
  const cu = casting ? clamp((now - m.cast.t0) / m.cast.dur, 0, 1) : 1;
  const ct = casting ? now - m.cast.t0 : 99;
  let W = 1;
  if (casting) W = m.windup > 0 ? clamp(1 - m.windup / 0.5, 0, 1) : 0;
  else if (winding) W = clamp(1 - m.windup / total, 0, 1);
  else if (isSwing && !hadWind) W = since < 0.35 ? sstep(since / 0.35) : 1;
  let s = casting || winding ? -1 : isSwing && !hadWind ? since - 0.35 : since;
  // (a scene's act: his entrance tantrum, played on the scene's clock)
  if (act && act.move === 'tantrum' && alive) {
    mv = 'entrance';
    const at = now - act.at;
    W = sstep(at / 0.8);
    s = at - 0.8;
  }
  const busy = Boolean(mv) || !alive;
  const ago = a.hurtAgo ?? 9;
  const hurt = alive && ago >= 0 && ago < 0.6;
  const fighting = (m.aggroUntil ?? 0) > now;
  const napping = alive && (m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now));
  const mood = cine.mood;
  const low = alive && m.hp < m.def.hp * 0.25 && !m.cine;

  // ----- The act -----
  const calmGoal = !busy && !napping && !m.pose && !m.cine && !hurt && !fighting && walking < 0.05 && alive ? 1 : 0;
  st.pmCalm = lerp(st.pmCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const cw = sstep(st.pmCalm);
  let PC = st.pmPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.pmOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.pmOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.pmOrd = (st.pmOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.pmPiece = PC;
  const piece = PC?.name ?? null;
  const pu = PC?.name ? now - PC.t0 : -1;
  const k = cw;

  if (k > 0.001 && piece === 'crown') {
    // the crown slides down over his eyes
    const slip1 = win(pu, 0.4, 1.2, 2.2, 2.6);
    q.crown += 10 * slip1 * k;
    q.crownDrop += 9 * slip1 * k;
    go({ head: 6 }, slip1 * k);
    say('surprised', win(pu, 0.8, 1.0, 1.6, 1.8) * k);
    // he shoves it back up with his free hand
    const shove = win(pu, 1.6, 2.0, 2.6, 3.0);
    go({ shF: -158, elF: -46, hwF: -10, head: -4, tilt: -2 }, shove * k);
    say('cross', shove * k);
    // it tips over the other way
    const slip2 = win(pu, 3.0, 3.5, 4.4, 4.8);
    q.crown -= 12 * slip2 * k;
    q.crownDrop += 4 * slip2 * k;
    go({ head: -6, tilt: -2 }, slip2 * k);
    say('worried', slip2 * k);
    // a huff, cheeks puffed, and he holds it on, chin up, very royal
    const holdOn = win(pu, 4.6, 5.0, 7.0, 7.5);
    go({ shF: -164, elF: -38, hwF: -16, head: -8, chest: -3 }, holdOn * k);
    say('cross', win(pu, 4.8, 5.0, 5.8, 6.0) * k);
    say('proud', win(pu, 5.9, 6.1, 7.1, 7.4) * k);
  }
  if (k > 0.001 && piece === 'decree') {
    // a cough into his free fist
    const cough = win(pu, 0.3, 0.6, 1.2, 1.5);
    go({ shF: -110, elF: -130, head: 6 }, cough * k);
    add({ chest: pulse(pu, 0.7, 0.2) * 4 + pulse(pu, 1.0, 0.2) * 3 }, k);
    say('shut', cough * k);
    // the sceptre raised high: a proclamation
    const pro = win(pu, 1.5, 2.0, 3.9, 4.3);
    go({ shN: -118, elN: -14, chest: -4, head: -8, tilt: -2 }, pro * k);
    rodTo(4, pro * k);
    q.shine = Math.max(q.shine, pro * k * 0.6);
    if (pro * k > 0.45) q.face = pu < 3.9 ? VOWELS[Math.floor(pu * 6) % 3] : 'proud';
    // a drip echoes in the dark: he jumps and ducks behind his arms
    if (pu > 4.1 && pu < 5.2) q.drip = pu - 4.1;
    const jump = win(pu, 4.3, 4.45, 4.7, 4.9);
    add({ hop: jump * 0.05 }, k);
    const duck = win(pu, 4.4, 4.6, 6.4, 6.8);
    go({ lift: -0.05, tilt: 6, head: 10, shN: -96, elN: -118, shF: -96, elF: -120 }, duck * k);
    rodTo(30, duck * k);
    q.cape -= 8 * duck * k;
    say('scared', win(pu, 4.4, 4.5, 5.0, 5.2) * k);
    // peeks left, then right
    if (duck * k > 0.45 && pu > 5.1) q.face = pu < 5.75 ? 'peekL' : 'peekR';
    // straightens up as if nothing happened
    const smug = win(pu, 6.6, 7.0, 8.0, 8.4);
    go({ chest: -3, head: -6 }, smug * k);
    say('smug', smug * k);
  }
  if (k > 0.001 && piece === 'rainbow') {
    // the prism held up to the light: a little rainbow lands before him
    const up = win(pu, 0.3, 0.9, 3.2, 3.8);
    go({ shN: -128, elN: -40, head: -10 }, up * k);
    rodTo(12, up * k);
    q.shine = Math.max(q.shine, up * k);
    if (pu > 0.8 && pu < 7.6) q.rainbow = pu - 0.8;
    say('delight', win(pu, 1.0, 1.3, 3.2, 3.5) * k);
    // he leans down and taps it with his toe; it skips away
    const tap = win(pu, 3.6, 4.0, 4.4, 4.8);
    go({ head: 10, tilt: 6, fyN: -0.12, fxN: 0.1 }, tap * k);
    say('happy', win(pu, 3.6, 3.8, 6.8, 7.4) * k);
    // a hop after it, giggling
    for (const t0 of [5.0, 5.6]) add({ hop: pulse(pu, t0, 0.42) * 0.05, x: pulse(pu, t0, 0.42) * 0.02 }, k);
    go({ shF: -40, elF: -40 }, win(pu, 4.9, 5.1, 6.4, 6.8) * k);
  }
  if (k > 0.001 && piece === 'dark') {
    // wide eyes into the dark, left, right; a shiver
    const look = win(pu, 0.2, 0.5, 3.0, 3.4);
    if (look * k > 0.45) q.face = Math.sin((pu - 0.2) * 2.2) > 0 ? 'peekR' : 'peekL';
    go({ head: Math.sin((pu - 0.2) * 2.2) * -6, lift: -0.02 }, look * k);
    q.shiver = look * k;
    add({ tilt: Math.sin(now * 38) * 0.7 * look }, k);
    if (trial) {
      // the clock goes off under its sock: he smothers it, "shh!"
      const ring = win(pu, 3.2, 3.3, 4.1, 4.2);
      q.ring = ring * k;
      say('scared', ring * k);
      const smother = win(pu, 3.9, 4.2, 5.6, 6.0);
      go({ shN: -12, elN: -142, shF: 20, elF: -120, head: 12, lift: -0.03, tilt: 4 }, smother * k);
      rodTo(34, smother * k);
      q.clk -= 26 * smother * k;
      say('shush', smother * k);
      const phew = win(pu, 5.8, 6.1, 6.9, 7.3);
      go({ head: -4, chest: -2 }, phew * k);
      add({ chest: Math.sin(Math.PI * clamp((pu - 5.8) / 1.2, 0, 1)) * 4 }, k);
      say('relief', phew * k);
    } else {
      // he hugs himself (and his sceptre) small
      const hug = win(pu, 3.2, 3.6, 6.0, 6.6);
      go({ shN: 8, elN: -128, shF: 20, elF: -120, head: 12, lift: -0.04, tilt: 4 }, hug * k);
      rodTo(34, hug * k);
      q.cape -= 10 * hug * k;
      say('worried', hug * k);
      say('relief', win(pu, 6.2, 6.4, 7.0, 7.3) * k);
    }
  }
  q.calm = cw;

  // (his own marks over his head)
  if (fighting && alive && !st.pmHunt) st.pmBangAt = now;
  if (!fighting && st.pmHunt && alive) st.pmLostAt = now;
  st.pmHunt = fighting && alive;
  q.bang = now - (st.pmBangAt ?? -9);
  q.huh = now - (st.pmLostAt ?? -9);
  q.hurtT = hurt ? ago : -1;
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: the sceptre out before him, chin up, trying very hard to look brave -----
  if (fighting && alive && !hurt && !mv) {
    go({ shN: -58, elN: -40, shF: 18, elF: -60, tilt: -2, head: -3, chest: -2 }, 1 - walking * 0.5);
    rodTo(58, 1 - walking * 0.5);
    q.face = 'focus';
  }
  if (low && !busy) {
    q.face = q.face === 'focus' || !q.face ? 'pant' : q.face;
    q.sweat = (t * 0.5) % 1;
    q.crown += 8;
    q.crownDrop += 3;
  }
  // ----- A phase change: the crown slips (world/story.js m.rot) -----
  const ph = m.rot?.phase ?? 0;
  if (st.pmPhase == null) st.pmPhase = ph;
  if (ph !== st.pmPhase) {
    st.pmPhase = ph;
    st.pmPhaseAt = now;
  }
  const pa = now - (st.pmPhaseAt ?? -9);
  if (alive && pa >= 0 && pa < 2.2) {
    const slip = win(pa, 0, 0.25, 1.4, 2.0);
    q.crown += 16 * slip;
    q.crownDrop += 8 * slip;
    say('surprised', win(pa, 0.1, 0.2, 0.9, 1.0));
    say('cross', win(pa, 1.0, 1.1, 2.0, 2.2));
  }

  // ----- His moves: acted through the cast (cu), winding up at its end (W), landing (s) -----
  if (mv && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.55) / 0.55) : 0;
    const snap = s >= 0 ? sstep(s / (isSwing ? 0.12 : 0.16)) : 0;
    const wu = sstep(W) * (1 - snap);
    const perf = casting ? sstep(ct / 0.4) : s >= 0 ? sw : 0;
    if (mv === 'tap') {
      // up over his shoulder; tapped down
      go({ shN: -140, elN: -50, tilt: -4, head: -4, lift: 0.01 }, wu);
      rodTo(-24, wu);
      say('focus', W);
      go({ shN: -46, elN: -8, tilt: 10, head: 6 }, snap * sw);
      rodTo(112, snap * sw);
      say('shout', snap * win(s, 0, 0.02, 0.3, 0.4));
      if (s >= 0.04 && s < 0.7) q.tapT = s - 0.04;
    } else if (mv === 'stomp') {
      // a knee up, fists clenched; STOMP
      go({ fyN: -0.3, tilt: -3, shF: 26, elF: -40, shN: -20, elN: -80 }, wu);
      say('cross', W);
      go({ fyN: 0, tilt: 8, lift: -0.03, head: 8, shF: 20, elF: -20, shN: -10, elN: -40 }, snap * sw);
      say('tantrum', snap * win(s, 0, 0.02, 0.45, 0.6));
      if (s >= 0 && s < 0.8) q.popT = s;
      q.crown += 6 * snap * sw * Math.sin(s * 18);
    } else if (mv === 'gleam') {
      // the prism drawn back; thrust out
      go({ shN: 24, elN: -110, tilt: -6, head: -2 }, wu);
      rodTo(70, wu);
      q.shine = Math.max(q.shine, wu);
      q.gather = Math.max(q.gather, wu * 0.7);
      say('focus', W);
      go({ shN: -82, elN: -6, tilt: 8, x: 0.02 }, snap * sw);
      rodTo(88, snap * sw);
      say('shout', snap * win(s, 0, 0.02, 0.3, 0.4));
      if (s >= 0 && s < 0.6) q.fanT = s;
    } else if (mv === 'entrance') {
      // his entrance: a stamp of each foot, fists down, the crown bouncing; then the sceptre at you
      const at = W < 1 ? W * 0.8 : 0.8 + s;
      for (const [t0, foot] of [[0.1, 'fyN'], [0.45, 'fyF'], [0.8, 'fyN'], [1.15, 'fyF']]) add({ [foot]: -0.2 * pulse(at, t0, 0.3) }, 1);
      go({ shF: 30, elF: -20, shN: -6, elN: -30, tilt: -2, head: 8 }, win(at, 0, 0.15, 1.3, 1.5));
      say('tantrum', win(at, 0, 0.05, 1.3, 1.4));
      for (const t0 of [0.25, 0.6, 0.95, 1.3]) if (at > t0 && at < t0 + 0.4) q.popT = at - t0;
      q.crown += Math.sin(at * 14) * 6 * win(at, 0, 0.1, 1.3, 1.5);
      const jab = win(at, 1.4, 1.55, 2.0, 2.3);
      go({ shN: -80, elN: -8, tilt: 6, head: -4 }, jab);
      rodTo(86, jab);
      q.shine = Math.max(q.shine, jab);
      say('shout', jab);
    } else if (mv === 'audience') {
      // chin up, the crown set straight with his free hand
      const set = casting ? win(cu, 0.02, 0.1, 0.24, 0.32) : 0;
      go({ shF: -158, elF: -40, head: -6 }, set);
      say('proud', set);
      // the sceptre raised high: kneel!
      const up = casting ? win(cu, 0.28, 0.4, 0.92, 1.1) : sw;
      go({ shN: -120, elN: -16, chest: -4, head: -8 }, up);
      rodTo(2, up);
      q.shine = Math.max(q.shine, up);
      if (casting && cu > 0.32 && cu < 0.56) q.face = VOWELS[Math.floor(ct * 6) % 3];
      // the crown slips down over his eyes; shoved back up
      const slip = casting ? win(cu, 0.55, 0.64, 0.74, 0.82) : 0;
      q.crown += 14 * slip;
      q.crownDrop += 9 * slip;
      say('surprised', slip);
      const shove = casting ? win(cu, 0.74, 0.8, 0.92, 1) : 0;
      go({ shF: -160, elF: -44, head: -2 }, shove);
      say('cross', shove);
      if (s >= 0) say('proud', sw);
    } else if (mv === 'mine') {
      // the clock hugged tight, head shaking, a stamp: MINE!
      const hug = casting ? sstep(ct / 0.3) : sw;
      go({ shN: -12, elN: -142, shF: 20, elF: -120, tilt: 4, head: 6 }, hug);
      q.clk -= 26 * hug;
      rodTo(34, hug);
      add({ head: Math.sin(ct * 16) * 9 * (casting ? win(cu, 0.1, 0.2, 0.6, 0.7) : 0) }, 1);
      say('cross', hug);
      for (const t0 of [0.66, 0.82]) add({ fyN: -0.22 * pulse(cu, t0, 0.12) }, casting ? 1 : 0);
      if (casting && cu > 0.7) {
        q.face = 'shout';
        if (cu > 0.72 && cu < 0.95) q.popT = (cu - 0.72) * m.cast.dur;
      }
      if (s >= 0) say('shout', sw);
    } else if (mv === 'bonk') {
      // the sceptre hauled up overhead, up on tiptoe; WHACK
      const haul = casting ? sstep(ct / 0.5) * (1 - snap) : 0;
      go({ shN: -132, elN: -54, shF: -120, elF: -60, tilt: -6, head: -6, lift: 0.015 }, haul);
      rodTo(-16, haul);
      q.shine = Math.max(q.shine, haul * cu);
      say('cross', haul);
      go({ shN: -140, elN: -60, lift: 0.025, tilt: -8 }, wu);
      rodTo(-22, wu);
      say('focus', W);
      go({ shN: -40, elN: -6, shF: 10, elF: -30, tilt: 16, head: 10, lift: -0.03 }, snap * sw);
      rodTo(118, snap * sw);
      say('shout', snap * win(s, 0, 0.02, 0.4, 0.5));
    } else if (mv === 'beam') {
      // the prism levelled at you, light gathering in it; it lets go
      go({ shN: -84, elN: -8, shF: 30, elF: -50, tilt: -3, head: -2 }, perf);
      rodTo(88, perf);
      q.gather = Math.max(q.gather, casting ? cu : 0);
      q.shine = Math.max(q.shine, casting ? cu : sw);
      say('focus', perf);
      go({ tilt: -9, x: -0.02, head: -6 }, snap * sw);
      say('shout', snap * win(s, 0, 0.02, 0.5, 0.6));
    } else if (mv === 'gems') {
      // the sceptre pointed down at your feet: crystals, grow!
      go({ shN: -58, elN: -6, shF: 24, elF: -86, tilt: 4, head: 4 }, perf);
      rodTo(128, perf);
      q.shine = Math.max(q.shine, perf * 0.6);
      if (casting && cu < 0.4) q.face = VOWELS[Math.floor(ct * 6) % 3];
      else say('focus', perf);
      go({ shN: -132, elN: -30, tilt: -4, head: -6 }, snap * sw);
      rodTo(20, snap * sw);
      say('proud', snap * sw);
    } else if (mv === 'tantrum') {
      // stamping and wailing, fists down, the crown bouncing; a double stamp
      const tt = casting ? win(cu, 0, 0.08, 0.95, 1) : sw;
      go({ shF: 30, elF: -24, shN: -4, elN: -30, head: 8, tilt: -1 }, tt);
      rodTo(30, tt);
      if (casting) for (let i = 0; i < 8; i++) add({ [i % 2 ? 'fyF' : 'fyN']: -0.2 * pulse(ct, 0.15 + i * 0.3, 0.28) }, 1);
      add({ head: Math.sin(now * 13) * 5 * tt }, 1);
      q.crown += Math.sin(now * 15) * 7 * tt;
      say('tantrum', tt);
      if (casting) for (let i = 0; i < 8; i++) if (ct > 0.3 + i * 0.3 && ct < 0.62 + i * 0.3) q.popT = ct - 0.3 - i * 0.3;
      go({ hop: 0.05, fyN: -0.1, fyF: -0.1 }, wu);
      go({ hop: 0, lift: -0.04, tilt: 6, head: 10 }, snap * sw);
      if (s >= 0 && s < 0.8) q.popT = s;
      q.cape += 10 * wu;
    } else if (mv === 'portrait') {
      // chest out, chin up, the sceptre across him, a hand on his hip: hold it...
      go({ chest: -5, head: -8, shN: -34, elN: -104, shF: 34, elF: -100, hwF: 20, tilt: -2 }, perf);
      rodTo(48, perf);
      say('proud', perf);
      if (casting && cu > 0.6) q.face = 'smug';
      if (s >= 0 && s < 0.3) q.face = 'shut';
      if (s >= 0 && s < 0.8) q.flashT = s;
    } else if (mv === 'refract') {
      // the sceptre up high at the ceiling, looking up; then swept down
      go({ shN: -128, elN: -20, shF: -140, elF: -40, head: -16, chest: -4, tilt: -3 }, perf * (1 - snap));
      rodTo(-6, perf * (1 - snap));
      q.shine = Math.max(q.shine, casting ? cu : 0);
      q.gather = Math.max(q.gather, casting ? cu * 0.8 : 0);
      say('delight', perf);
      if (s >= 0) q.raysT = s;
      go({ shN: -60, elN: -6, shF: 20, elF: -40, head: 6, tilt: 8 }, snap * sw);
      rodTo(132, snap * sw);
      say('shout', snap * win(s, 0, 0.02, 0.4, 0.5));
    } else if (mv === 'mirror') {
      // the prism held up to one side, then the other; a smug look
      const one = casting ? win(cu, 0.02, 0.15, 0.45, 0.55) : 0;
      const two = casting ? win(cu, 0.5, 0.62, 0.95, 1) : 0;
      go({ shN: -112, elN: -20, head: -6 }, one);
      rodTo(60, one);
      go({ shN: -120, elN: -40, head: 2, chest: -2 }, two);
      rodTo(-14, two);
      q.shine = Math.max(q.shine, Math.max(one, two));
      say('smug', Math.max(one, two));
      if (s >= 0) say('proud', sw);
      if (s >= 0 && s < 0.6) q.fanT = s;
    }
  }
  // (his skirt panels kicked by a knee that lifts or a leg that strides out under them; the cape
  // swept by a lean)
  q.skN -= clamp((out.fyN ?? 0) * 36 + Math.max(0, out.fxN ?? 0) * 20, 0, 22);
  q.skF -= clamp((out.fyF ?? 0) * 36 + Math.max(0, out.fxF ?? 0) * 20, 0, 20);
  q.cape += clamp((out.tilt ?? 0) * 0.5, -6, 10);
  // ----- Hurt: a squeezed wince, the crown jolted -----
  if (hurt && !mv) {
    const kh = win(ago, 0, 0.12, 0.2, 0.6);
    go({ tilt: -10, head: 10, shN: -24, elN: -70, shF: -20, elF: -100, lift: -0.02 }, kh);
    q.crown += 10 * kh;
    q.face = 'hurt';
  }
  // ----- After landing a hit: a royal "hmph", the sceptre up -----
  const moveW = mv ? (s >= 0 ? 1 - sstep((s - 0.6) / 0.45) : 1) : 0;
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.2 && alive && !hurt) {
    const kg = win(gl, 0, 0.2, 0.9, 1.2) * (1 - moveW);
    go({ shN: -112, elN: -24, chest: -4, head: -8 }, kg);
    rodTo(8, kg);
    say('smug', kg);
    if (kg > 0.4) q.hmph = gl;
  }
  // ----- A nap: sat down, the sceptre hugged, nodding off -----
  st.pmNap = lerp(st.pmNap ?? 0, napping && !busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.pmNap);
  if (nw > 0.001) {
    go({ lift: -0.14, tilt: 4, head: 16 + Math.sin(now * 1.4) * 3, shN: 6, elN: -124, shF: 18, elF: -110, fxN: 0.26, fyN: 0.02, fxF: -0.18, toeN: -20, toeF: 20 }, nw);
    rodTo(30, nw);
    q.crown += 10 * nw;
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
    }
  }
  // ----- Scenes -----
  if (cine.star) q.star = true;
  if (cine.gave != null) {
    const g = clamp((now - cine.gave) / 0.9, 0, 1);
    const giving = g > 0 && g < 1 ? Math.sin(Math.PI * g) : 0;
    go({ shN: -78, elN: -16, shF: -60, elF: -20, tilt: 4, head: -2 }, giving);
    q.clockOn = g >= 0.85 ? 0 : 1;
  }
  if (act && act.move === 'getstar') go({ shF: -70, elF: -40, head: 4 }, 1);
  if (q.star) go({ shF: -64, elF: -44, head: 6 }, alive ? 1 : 0.7);
  if (alive && !busy && !hurt) {
    if (mood === 'happy') q.face = q.star ? 'delight' : 'happy';
    else if (mood === 'sad') q.face = 'sad';
    else if (mood === 'angry') q.face = 'cross';
    else if (mood === 'surprised') q.face = 'surprised';
    else if (mood === 'sleepy') q.face = 'sleep';
    else if (mood === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 7) % VOWELS.length];
  }
  // ----- Beaten: sat down, dizzy, the crown over one eye (or, set free in his ending, standing, sad) -----
  if (!alive) {
    if (cine.freed) {
      q.face = mood === 'happy' ? (q.star ? 'delight' : 'happy') : mood === 'surprised' ? 'surprised' : mood === 'talk' ? VOWELS[Math.floor(now * 7) % VOWELS.length] : 'sniffle';
      if (!mood || mood === 'sad') go({ head: 10, shF: 10, elF: -20, shN: -10, elN: -40 }, 1);
    } else {
      go({ lift: -0.14, tilt: -4, head: 10, shN: 10, elN: -30, shF: 20, elF: -20, fxN: 0.26, fxF: -0.18, toeN: -20, toeF: 20 }, 1);
      rodTo(70, 1);
      q.crown += 22;
      q.crownDrop += 8;
      q.face = 'dizzy';
    }
  }
  // ----- The face: an in-between (a blink) on every change; his own blink rhythm -----
  // (`m.faceForce`: a face held for a dev sheet)
  if (m.faceForce) {
    q.face = m.faceForce;
    return;
  }
  let f = q.face ?? 'calm';
  if (f !== st.pmFace) {
    st.pmFaceFrom = st.pmFace;
    st.pmFace = f;
    st.pmFaceAt = now;
  }
  const since0 = now - (st.pmFaceAt ?? -9);
  const talky = (n) => n === 'calm' || n.startsWith('talk');
  const peeky = (n) => n === 'peekL' || n === 'peekR';
  if (since0 >= 0 && since0 < 0.07 && st.pmFaceFrom && !SHUTS.has(f) && !SHUTS.has(st.pmFaceFrom) && !(talky(f) && talky(st.pmFaceFrom)) && !(peeky(f) && peeky(st.pmFaceFrom))) f = 'shut';
  const P = 3.1 + ((m.uid ?? 0) % 7) * 0.33;
  if ((now + ((m.uid ?? 0) % 5) * 0.8) % P < 0.12 && !SHUTS.has(f)) f = 'shut';
  q.face = f;
  // (eased: the crown's slip, the cape's sweep, the sceptre's angle)
  for (const key of ['crown', 'crownDrop', 'cape', 'skF', 'skN', 'rod', 'shine', 'clk']) {
    st[`pm_${key}`] = lerp(st[`pm_${key}`] ?? q[key], q[key], ease(key === 'rod' ? 10 : key === 'shine' ? 8 : 12));
    q[key] = st[`pm_${key}`];
  }
}

// ---------- Live effects (rig space, game px, his feet at 0, 0) ----------
// A curvy four-point sparkle (the game's star), soft-glowing.
function sparkle(ctx, x, y, s, al = 1, col = '#fffbe8') {
  if (al <= 0.01 || s <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= clamp(al, 0, 1);
  glow(ctx, x, y, s * 1.8, col, 0.45);
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x + s * 0.18, y - s * 0.18, x + s, y);
  ctx.quadraticCurveTo(x + s * 0.18, y + s * 0.18, x, y + s);
  ctx.quadraticCurveTo(x - s * 0.18, y + s * 0.18, x - s, y);
  ctx.quadraticCurveTo(x - s * 0.18, y - s * 0.18, x, y - s);
  ctx.fillStyle = '#ffffff';
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
  ctx.strokeStyle = '#8a74d0';
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = '#f4f0ff';
  ctx.stroke();
  ctx.restore();
}
// His marks over his head: a little crystal speech gem with a "!" or a "?".
function bubble(ctx, x, y, mark, e, dur, fl = false) {
  if (e < 0) return;
  const kk = Math.max(0, boing(e, 9, 18)) * (1 - sstep((e - dur + 0.25) / 0.25));
  if (kk <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(fl ? -kk : kk, kk);
  for (const pass of ['line', 'fill']) {
    smoothPath(ctx, [[-5, -6.4], [0, -8], [5, -6.4], [6, 1.4], [1.4, 3.6], [0, 6.8], [-1.4, 3.6], [-6, 1.4]]);
    if (pass === 'line') {
      ctx.strokeStyle = '#7a62c0';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else {
      const g = ctx.createLinearGradient(-6, -8, 6, 4);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(1, '#e2ecff');
      ctx.fillStyle = g;
      ctx.fill();
    }
  }
  ctx.strokeStyle = mark === '!' ? '#e8608e' : '#6a58c0';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0, -4.2);
    ctx.lineTo(0, -0.6);
  } else {
    ctx.moveTo(-1.5, -3);
    ctx.quadraticCurveTo(-1.2, -4.8, 0.4, -4.6);
    ctx.quadraticCurveTo(2, -4.2, 1.4, -2.6);
    ctx.quadraticCurveTo(0.4, -1.8, 0.2, -0.6);
  }
  ctx.stroke();
  ell(ctx, mark === '!' ? 0 : 0.2, 1.4, 0.85, 0.85);
  ctx.fill();
  ctx.restore();
}
function sweat(ctx, x, y, s, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 1.4);
  ctx.quadraticCurveTo(x + s, y + s * 0.2, x, y + s);
  ctx.quadraticCurveTo(x - s, y + s * 0.2, x, y - s * 1.4);
  ctx.fillStyle = '#cfeaff';
  ctx.fill();
  ctx.strokeStyle = '#86b6e0';
  ctx.lineWidth = s * 0.25;
  ctx.stroke();
  ctx.restore();
}
// A soft puff of breath ("hmph!").
function huff(ctx, x, y, e, fl) {
  if (e < 0 || e > 1) return;
  ctx.save();
  ctx.globalAlpha *= 1 - sstep((e - 0.5) / 0.5);
  for (let i = 0; i < 2; i++) {
    const d = (fl ? -1 : 1) * (2 + e * 6 + i * 2.2);
    ell(ctx, x + d, y + 1 - i * 1.4 - e * 2, 1.4 + e * 1.2, 1.1 + e);
    ctx.fillStyle = 'rgba(244,240,255,0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(176,164,220,0.7)';
    ctx.lineWidth = 0.4;
    ctx.stroke();
  }
  ctx.restore();
}

function under2(ctx, m, a, S, matOf, D) {
  // (every loose piece swung once a frame, drawn or not, so none of them ever skips time)
  for (const n of SOFT_NAMES) a.blMat(n);
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.pm ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.43;
  // where the prism is
  const prism = () => {
    const M = a.blMat('handN');
    const [gx, gy] = D.at(a, 'handN', [(GRIP[0] - D.J.wrN[0]) * SC, (GRIP[1] - D.J.wrN[1]) * SC]);
    const r = (q.rod ?? 24) * D2R;
    const L = -PRISM_TIP * SC;
    void M;
    return [gx + Math.sin(r) * L, gy - Math.cos(r) * L, r];
  };
  const [px, py, pr] = prism();
  if (m.hp <= 0 && !m.cine?.freed) {
    const [hx, hy] = headAt(a, D, [0, -70]);
    for (let i = 0; i < 3; i++) {
      const an = (a.now ?? 0) * 3.2 + (i * TAU) / 3;
      sparkle(ctx, hx + Math.cos(an) * 8, hy + Math.sin(an) * 2.4, 1.8, Math.sin(an) > 0 ? 1 : 0.55, RAINBOW[i * 2]);
    }
    ctx.globalAlpha = base;
    return;
  }
  // the prism's own little twinkle, brighter as it shines
  if ((q.rodOn ?? 1) > 0.5) {
    const P = 1.9;
    const f = (((t % P) + P) % P) / P;
    sparkle(ctx, px + 1.2, py - 1.2, (0.9 + (q.shine ?? 0) * 1.4) * Math.sin(Math.PI * f), 0.9, '#ffffff');
    if ((q.shine ?? 0) > 0.05) glow(ctx, px, py, 5 + q.shine * 5, '#f4ecff', 0.35 * q.shine);
  }
  // light gathering into the prism: soft rainbow motes drawn in
  if ((q.gather ?? 0) > 0.05) {
    for (let i = 0; i < 5; i++) {
      const ph = ((t * 1.4 + i / 5) % 1);
      const an = i * 1.26 + t * 0.6;
      const r = (1 - ph) * 12;
      sparkle(ctx, px + Math.cos(an) * r, py + Math.sin(an) * r, 0.9 * q.gather, ph * q.gather, RAINBOW[i]);
    }
  }
  // Prism Gleam / Mirror: a short fan of rainbow off the prism
  if ((q.fanT ?? -1) >= 0) {
    const e = q.fanT / 0.6;
    rainbowFan(ctx, px, py, pr - Math.PI / 2, 14 + e * 26, 8 + e * 10, 1 - sstep((e - 0.3) / 0.7));
    sparkle(ctx, px, py, 3 * Math.sin(Math.PI * clamp(e * 2, 0, 1)), 1);
  }
  // Refraction: rays fanning up from the prism as he sweeps it down
  if ((q.raysT ?? -1) >= 0 && q.raysT < 0.7) {
    const e = q.raysT / 0.7;
    rainbowFan(ctx, px, py, -Math.PI / 2, 20 + e * 20, 24, 1 - e);
  }
  // Royal Tap: a little gem burst where the prism comes down
  if ((q.tapT ?? -1) >= 0) {
    const e = q.tapT / 0.66;
    sparkle(ctx, px, py, 3.6 * Math.sin(Math.PI * clamp(e * 1.6, 0, 1)), 1, '#ffffff');
    for (let i = 0; i < 5; i++) {
      const an = -Math.PI / 2 + (i - 2) * 0.6;
      shard(ctx, px + Math.cos(an) * (2 + e * 8), py + Math.sin(an) * (2 + e * 8) + e * e * 6, 1.1 * (1 - e * 0.5), an + Math.PI / 2, i, 1 - e);
    }
  }
  // the stomp: crystals popping up round his slipper
  if ((q.popT ?? -1) >= 0 && q.popT < 0.8) {
    const e = q.popT / 0.8;
    const fx0 = 6;
    for (let i = 0; i < 5; i++) {
      const dx = (i - 2) * 4.4;
      const grow = boing(e * 1.2, 9, 14) * (1 - sstep((e - 0.6) / 0.4));
      shard(ctx, fx0 + dx, 0.4, (1.4 + (i % 2) * 0.6) * Math.max(0, grow), (i - 2) * 0.22, i, 1);
    }
    sparkle(ctx, fx0, -2, 2.4 * Math.sin(Math.PI * clamp(e * 2.2, 0, 1)), 1);
  }
  // Royal Portrait: a soft camera sparkle (never a white flash)
  if ((q.flashT ?? -1) >= 0) {
    const e = q.flashT / 0.8;
    const [hx, hy] = headAt(a, D, [44, -30]);
    for (let i = 0; i < 4; i++) {
      const an = (i / 4) * TAU + 0.4;
      sparkle(ctx, hx + Math.cos(an) * e * 8, hy + Math.sin(an) * e * 6, 1.8 * (1 - e), 1 - e, RAINBOW[i + 1]);
    }
  }
  // the rainbow he makes on the floor in his act, skipping away from his toe
  if ((q.rainbow ?? -1) >= 0) {
    const r = q.rainbow;
    const skip = sstep((r - 3.4) / 0.4) * 10 + sstep((r - 4.4) / 0.5) * 8;
    const x = 18 + skip;
    const al = win(r, 0, 0.5, 6.4, 6.8);
    rainbowFan(ctx, px, py, Math.atan2(-py, x - px), Math.hypot(x - px, py), 6, al * 0.7);
    ctx.save();
    ctx.globalAlpha *= al;
    RAINBOW.forEach((col, i) => {
      ell(ctx, x, -0.6, 5.4 - i * 0.6, 1.3 - i * 0.12);
      ctx.strokeStyle = rgba(col, 0.75);
      ctx.lineWidth = 0.6;
      ctx.stroke();
    });
    ctx.restore();
  }
  // the drip that scares him
  if ((q.drip ?? -1) >= 0) {
    const e = q.drip / 1.1;
    const [hx, hy] = headAt(a, D, [-60, -90]);
    const fall = clamp(e / 0.4, 0, 1);
    const dy = hy + fall * fall * 30;
    if (e < 0.4) {
      ctx.beginPath();
      ctx.moveTo(hx, dy - 1.6);
      ctx.quadraticCurveTo(hx + 1, dy + 0.4, hx, dy + 1);
      ctx.quadraticCurveTo(hx - 1, dy + 0.4, hx, dy - 1.6);
      ctx.fillStyle = 'rgba(206,236,255,0.95)';
      ctx.fill();
    } else {
      const r = (e - 0.4) / 0.6;
      ell(ctx, hx, hy + 30, 1 + r * 4, 0.4 + r * 1.2);
      ctx.strokeStyle = `rgba(206,236,255,${0.9 * (1 - r)})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }
  // the clock ringing under its sock: soft muffled rings
  if ((q.ring ?? 0) > 0.05 && isTrial(m)) {
    const [cx, cy] = pointIn(a, D, 'clock', [CLOCK_TOP[0], CLOCK_TOP[1] + 4]);
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const r = 3 + i * 2 + ((t * 10) % 2);
      ctx.globalAlpha = base * q.ring * (1 - i / 3);
      ctx.strokeStyle = '#ffd6e6';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI * 0.85, -Math.PI * 0.15);
      ctx.stroke();
    }
    ctx.restore();
  }
  // his trial's nightlight: the clock glowing softly on his chest
  if (isTrial(m) && (q.clockOn ?? 1) > 0.01) {
    const [cx, cy] = pointIn(a, D, 'clock', [CLOCK_TOP[0], CLOCK_TOP[1] + 10.6]);
    glow(ctx, cx, cy, 9 + Math.sin(t * 2.2) * 0.6, '#ffe6b8', 0.22);
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [38, -18]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.hmph ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [20, 24]);
    huff(ctx, hx, hy, q.hmph / 1.1, false);
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [26, -62]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.45 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip);
    }
  }
  const [bx, by] = headAt(a, D, [40, -86]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip);
  if (q.hurtT >= 0 && q.hurtT < 0.5) {
    const e = q.hurtT / 0.5;
    const [hx, hy] = headAt(a, D, [0, -50]);
    for (let i = 0; i < 3; i++) sparkle(ctx, hx - 7 + i * 7, hy - e * 6, 1.4 * (1 - e), 1 - e, RAINBOW[i * 2]);
  }
  ctx.globalAlpha = base;
}

const DRESS = {
  skin: SKIN,
  liveHead: true,
  noMoves: true,
  stride: 10,
  kick: 2.6,
  joints: JOINTS,
  softParts: SOFTS,
  under2,
  under: {
    // (his bob and his cape behind everything)
    armFu: drawBack,
  },
  // (his sleeves draw his arms whole: the base's own arm skin is left out)
  hide: ['armF', 'armN'],
  over: {
    armFf: (ctx, a, mode, S, D) => drawSleeve(ctx, a, mode, S, D, 'F'),
    handFskin: drawStar,
    legF: drawLegs('F'),
    legN: drawLegs('N'),
    footFskin: drawFoot('F'),
    footNskin: drawFoot('N'),
    torsoSkin: drawTorso,
    neckSkin: (ctx, a, mode, S, D) => drawCollar(ctx, a, mode, S, D, a.pmMob ?? {}),
    head: drawHead,
    armNf: (ctx, a, mode, S, D) => drawSleeve(ctx, a, mode, S, D, 'N'),
    handNskin: drawSceptre,
  },
  pose: (m, a, out, c) => {
    a.pmMob = m;
    pose(m, a, out, c);
  },
  fx,
};

const R = dressRig(DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.4);
rig.h = Math.round(rig.h * BIG * 1.3);
// His art entry (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: his marks over his
// head are his own).
export const PRISMARIS_ART = { pad: 16, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const PRISMARIS_SIZE = { w: 52, h: Math.round(R.H * BIG * 1.12), speed: Math.round(R.speed * BIG) };
export const PRISMARIS_DRESS = DRESS;
