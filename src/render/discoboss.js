// Dancing Green, the disco boss: drawn on the hero body (scaled up, same proportions) in his stage
// outfit, then in his toad form after the transformation, with the long red tail and his record.
// His moves are keyframed poses (eased in over a fifth of a second, settling slightly past) on a
// soft knee bounce in time with the 120 bpm music. Also draws the fight's telegraphs and hits:
// rainbow walls, cube walls, floor tiles, spotlights, waves, frog dancers and their tracks.

import { drawHero } from './hero.js';

const HIPS = [0.6, -4.2];
const P = {
  stand: { arm: 70, rig: { backArm: [-0.5, -1] } },
  groove: { arm: 75, body: { tilt: 0.02 }, rig: { backArm: HIPS, armSide: -1, frontLeg: [2, 0, 6], backLeg: [-1.5, 0, -4] } },
  ready: { arm: 30, rig: { backArm: [2, -5], frontLeg: [3, 0, 10], backLeg: [-3, 0, -10], squat: 1, by: 1 } },
  wind: { arm: 150, body: { tilt: -0.08 }, rig: { tx: -1, backArm: [-5, -10], frontLeg: [2, 0, 6], backLeg: [-3, 0, -10], squat: 1, by: 1 } },
  hitL: { arm: 60, body: { tilt: -0.1, lunge: -2 }, rig: { tx: -2, backArm: [-6, -10], frontLeg: [2, 0, 6], backLeg: [-4.5, 0, -14], squat: 2, by: 1.5 } },
  hitR: { arm: 110, body: { tilt: 0.1, lunge: 2 }, rig: { tx: 2, backArm: [2, -4], frontLeg: [4.5, 0, 14], backLeg: [-2, 0, -6], squat: 2, by: 1.5 } },
  kickUp: { arm: 120, body: { tilt: -0.08 }, rig: { backArm: [-4, -9], frontLeg: [3, -4, 30], backLeg: [-1, 0, -4] } },
  kickOut: { arm: 60, body: { tilt: -0.12, lunge: 3 }, rig: { backArm: [-5, -6], frontLeg: [6, -5, 60], backLeg: [-2, 0, -8], squat: 1 } },
  stompUp: { arm: 120, body: { tilt: 0.03, lift: 1 }, rig: { backArm: [-4, -12], frontLeg: [2, -5, 20], backLeg: [-1.5, 0, -4] } },
  stompDown: { arm: 40, body: { stretch: 0.94 }, rig: { backArm: [-3, -3], frontLeg: [3.5, 0, 12], backLeg: [-3.5, 0, -12], squat: 2, by: 2 } },
  armsUp: { arm: 168, body: { stretch: 1.04 }, rig: { backArm: [-3, -16], frontLeg: [2.5, 0, 8], backLeg: [-2.5, 0, -8], hy: -0.5 } },
  armsUpJump: { arm: 172, body: { lift: 5, stretch: 1.06 }, rig: { backArm: [-3.5, -16.5], frontLeg: [2, -3, 10], backLeg: [-2, -3, -10], hy: -1 } },
  crouch: { arm: 40, body: { stretch: 0.92 }, rig: { backArm: [2, -2], frontLeg: [3, 0, 12], backLeg: [-3, 0, -12], squat: 2, by: 2.5, hy: 1 } },
  sweepBack: { arm: 20, body: { tilt: -0.06 }, rig: { tx: -1, backArm: [-6, -6], frontLeg: [2, 0, 6], backLeg: [-3, 0, -10] } },
  sweepOut: { arm: 95, body: { tilt: 0.1, lunge: 3 }, rig: { tx: 2, backArm: [-2, -4], frontLeg: [4.5, 0, 14], backLeg: [-2.5, 0, -8], squat: 1, by: 1 } },
  clapOpen: { arm: 80, rig: { backArm: [-5, -9], frontLeg: [2, 0, 6], backLeg: [-2, 0, -6] } },
  clap: { arm: 45, body: { tilt: 0.02 }, rig: { backArm: [7.5, -7], frontLeg: [2, 0, 6], backLeg: [-2, 0, -6], squat: 1, by: 0.5 } },
  pointL: { arm: 20, body: { tilt: -0.1, lunge: -1.5 }, rig: { tx: -2, tilt: -4, backArm: [-8, -11], frontLeg: [1.5, 0, 4], backLeg: [-3.5, 0, -12] } },
  pointR: { arm: 100, body: { tilt: 0.1, lunge: 1.5 }, rig: { tx: 2, tilt: 4, backArm: HIPS, armSide: -1, frontLeg: [3.5, 0, 12], backLeg: [-1.5, 0, -4] } },
  bigPose: { arm: 150, body: { tilt: 0.08, stretch: 1.04 }, rig: { tx: 1, tilt: 6, backArm: HIPS, armSide: -1, frontLeg: [3.5, 0, 12], backLeg: [-1, 0, -4] } },
  hurt: { arm: 30, body: { tilt: -0.14, lunge: -2 }, rig: { tx: -2, tilt: -6, backArm: [-3, -1], frontLeg: [1, 0, 4], backLeg: [-3, 0, -10], squat: 1, by: 1 } },
  wobbleL: { arm: 60, body: { tilt: -0.12 }, rig: { tx: -1.5, tilt: -6, backArm: [-5, -6], frontLeg: [1.5, -1, 8], backLeg: [-1.5, 0, -4], squat: 1 } },
  wobbleR: { arm: 100, body: { tilt: 0.12 }, rig: { tx: 1.5, tilt: 6, backArm: [-2, -6], frontLeg: [1.5, 0, 4], backLeg: [-1.5, -1, -8], squat: 1 } },
  sit: { arm: 20, body: { tilt: -0.2, stretch: 0.86 }, rig: { backArm: [-4, 2], frontLeg: [5, -3, 50], backLeg: [-4, -2, -40], squat: 2, by: 3, hy: 1.5, tilt: -8 } },
  roar: { arm: 140, body: { stretch: 1.05, tilt: -0.04 }, rig: { backArm: [-5, -13], frontLeg: [3.5, 0, 12], backLeg: [-3.5, 0, -12], hy: -1 } },
  reveal: { arm: 92, body: { tilt: 0.03 }, rig: { backArm: [3, -14], frontLeg: [2.5, 0, 8], backLeg: [-1.5, 0, -4] } },
  push: { arm: 160, body: { tilt: -0.02 }, rig: { backArm: [3, -14], frontLeg: [2, 0, 6], backLeg: [-1.5, 0, -4] } },
  // The stage form's intro poses.
  hkick: { arm: 40, body: { tilt: -0.04 }, rig: { backArm: [2, -3], frontLeg: [4.5, -3, 24], backLeg: [-1, 0, -4], by: 0.5 } },
  hlean: { arm: 70, body: { tilt: -0.05 }, rig: { backArm: [-4, -7], frontLeg: [2, 0, 8], backLeg: [-2, 0, -8] } },
  hpoint: { point: true, body: { tilt: 0.04 }, rig: { tx: 1, tilt: 4, backArm: HIPS, armSide: -1, frontLeg: [2.5, 0, 8], backLeg: [-1, 0, -3] } },
};

// Moves: keys [time, pose, face, shades down]; loop after `period` unless `once`.
export const MOVES = {
  groove: { period: 2, keys: [[0, 'groove', 'smug'], [1, 'stand', 'grin']] },
  // The cutscene before the fight (world/discoboss.js times the camera to it): he struts in, kicks,
  // leans back, strikes the point, changes, and strikes his toad-form pose.
  cut: { period: 13.4, once: true, keys: [[0, 'stand', 'smug'], [3.6, 'hkick', 'excited'], [4.2, 'hlean', 'grin'], [5.2, 'hpoint', 'grin'], [8.8, 'reveal', 'smug', 1], [11.6, 'push', 'excited'], [12.1, 'reveal', 'excited']] },
  intro: { period: 7.2, once: true, human: 3.6, keys: [[0, 'stand', 'smug'], [0.8, 'hkick', 'excited'], [1.3, 'hlean', 'grin'], [1.8, 'hpoint', 'grin'], [5.6, 'reveal', 'smug', 1], [6.5, 'push', 'excited'], [6.9, 'reveal', 'excited']] },
  hustle: { period: 2.6, once: true, keys: [[0, 'stand', 'smug'], [0.5, 'wind', 'determined', 1], [1.3, 'hitL', 'angry', 1], [1.9, 'stand', 'grin']] },
  twist: { period: 4, once: true, keys: [[0, 'ready', 'determined', 1], [0.8, 'hitL', 'angry', 1], [1.15, 'ready', 'determined', 1], [1.4, 'hitL', 'angry', 1], [1.75, 'ready', 'determined', 1], [2, 'hitL', 'angry', 1], [2.35, 'ready', 'determined', 1], [2.6, 'hitL', 'angry', 1], [2.95, 'ready', 'determined', 1], [3.2, 'hitR', 'angry', 1], [3.7, 'stand', 'smug']] },
  deepcut: { period: 2.4, once: true, keys: [[0, 'stand', 'smug'], [0.6, 'kickUp', 'determined', 1], [1.1, 'kickOut', 'angry', 1], [1.6, 'stand', 'cool']] },
  funky: { period: 1.2, keys: [[0, 'stompUp', 'excited'], [0.4, 'stompDown', 'grin']] },
  disco: { period: 3.2, once: true, keys: [[0, 'crouch', 'smug'], [0.5, 'armsUp', 'excited'], [2.2, 'groove', 'love']] },
  celebrate: { period: 2.6, once: true, keys: [[0, 'crouch', 'grin'], [0.5, 'armsUpJump', 'excited'], [0.9, 'armsUp', 'excited'], [1.8, 'stand', 'grin']] },
  waves: { period: 3, once: true, keys: [[0, 'sweepBack', 'cool'], [0.6, 'sweepOut', 'determined', 1], [2, 'stand', 'cool']] },
  assemble: { period: 3, once: true, keys: [[0, 'clapOpen', 'grin'], [0.35, 'clap', 'excited'], [0.6, 'clapOpen', 'grin'], [0.85, 'clap', 'excited'], [1.2, 'armsUp', 'proud'], [2.4, 'groove', 'smug']] },
  pointL: { period: 0.5, once: true, keys: [[0, 'pointL', 'playful']] },
  pointR: { period: 0.5, once: true, keys: [[0, 'pointR', 'grin']] },
  pose: { period: 2.6, once: true, keys: [[0, 'crouch', 'smug'], [0.5, 'bigPose', 'proud'], [2.1, 'stand', 'smug']] },
  moon: { period: 3, keys: [[0, 'stand', 'cool']] },
  hurt: { period: 0.6, once: true, keys: [[0, 'hurt', 'shock'], [0.45, 'stand', 'pout']] },
  defeat: { period: 4, once: true, keys: [[0, 'stand', 'shock'], [0.3, 'wobbleL', 'dizzy'], [0.7, 'wobbleR', 'dizzy'], [1.1, 'wobbleL', 'dizzy'], [1.6, 'sit', 'dizzy'], [3.4, 'sit', 'sad']] },
  enrage: { period: 3, once: true, keys: [[0, 'crouch', 'angry', 1], [0.9, 'roar', 'angry', 1]] },
};

const TR = 0.18;
const ease = (u) => { const b = u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2; return b + Math.sin(Math.PI * u) * 0.08 * u; };
const lerp = (a, b, u) => a + (b - a) * u;
const q = (v) => Math.round(v * 4) / 4;
const BODY0 = { lift: 0, lunge: 0, tilt: 0, turn: 1, stretch: 1 };
const RIG0 = { tx: 0, by: 0, hy: 0, tilt: 0, squat: 0, frontArm: [0.5, -1], backArm: [-0.5, -1], frontLeg: [0.8, 0, 0], backLeg: [-0.8, 0, 0], armSide: 1 };

// The pose of a move `time` seconds in, on the beat clock `clock`.
export function poseOf(name, time, clock) {
  const mv = MOVES[name] ?? MOVES.groove;
  const t = mv.once ? Math.min(time, mv.period) : ((time % mv.period) + mv.period) % mv.period;
  const keys = mv.once ? [...mv.keys, [mv.period + 1, ...mv.keys.at(-1).slice(1)]] : [...mv.keys, [mv.period, ...mv.keys[0].slice(1)]];
  let i = 0;
  while (i < keys.length - 2 && keys[i + 1][0] <= t) i++;
  const [t0, p0, f0, sh0] = keys[i];
  const [t1, p1, f1, sh1] = keys[i + 1];
  const tr = Math.min(TR, (t1 - t0) * 0.9);
  const k = ease(Math.max(0, Math.min(1, (t - t1 + tr) / tr)));
  const A = P[p0];
  const Bp = P[p1];
  const ba = { ...BODY0, ...A.body };
  const bb = { ...BODY0, ...Bp.body };
  const body = {};
  for (const key of Object.keys(BODY0)) body[key] = Math.round(lerp(ba[key], bb[key], k) * 1000) / 1000;
  const ra = { ...RIG0, ...A.rig };
  const rb = { ...RIG0, ...Bp.rig };
  const rig = {};
  for (const key of Object.keys(RIG0)) {
    if (Array.isArray(ra[key])) rig[key] = ra[key].map((v, j) => q(lerp(v, rb[key][j], k)));
    else if (key === 'armSide') rig[key] = k < 0.5 ? ra[key] : rb[key];
    else if (key === 'tilt') rig[key] = Math.round(lerp(ra[key], rb[key], k));
    else rig[key] = q(lerp(ra[key], rb[key], k));
  }
  const near = k < 0.5 ? A : Bp;
  if (near.point) rig.armOver = 'point';
  else rig.armOver = Math.round(lerp(A.arm ?? 12, Bp.arm ?? 12, k));
  // The groove: a soft knee bounce on every beat, the head a moment behind.
  if (name !== 'defeat' && name !== 'hurt') {
    const beat = (clock % 0.5) / 0.5;
    const dip = Math.max(0, Math.sin(Math.PI * Math.min(1, beat * 1.6))) * (1 - Math.min(1, body.lift / 2));
    rig.by = q(rig.by + dip * 0.8);
    rig.hy = q(rig.hy + Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, beat - 0.1) * 1.6))) * 0.5);
  }
  return { body, rig, face: k < 0.5 ? f0 : f1, shades: Boolean(k < 0.5 ? sh0 : sh1), pose: k < 0.5 ? p0 : p1 };
}

const STAGE = { hairStyle: 'wolf', hairColor: '#e2e84a', hairTip: '#4fcf5a', skinTone: '#b97e5a', eyeStyle: 'cat', eyeColor: '#e0469c', browStyle: 'sharp', earStyle: 'bunny' };
export const SCALE = 2.6;
// His frog backup dancers: green frog-folk with big dark afros, in white disco shirts and teal flares.
const DANCER = { hairStyle: 'cloud', hairColor: '#1c2216', skinTone: '#9ad86e', eyeStyle: 'big', eyeColor: '#2a1a10', browStyle: 'none', earStyle: 'round', outfit: 'frogdancer', outfitColor: '#f6f4fb', face: 'smug' };

function tail(ctx, x, gy, s, time, body, dir) {
  const lean = (body.tilt + (body.lunge ?? 0) * 0.02) * dir;
  const hx = x - 2 * s * dir;
  const hy = gy - 9 * s - (body.lift ?? 0) * s;
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const u = i / 14;
    const w = Math.sin(time * 4.2 - i * 0.5) * (3 + 13 * u) + Math.sin(time * 1.9 - i * 0.3) * 7 * u - lean * 110 * u;
    pts.push([hx - dir * u * 60 + w * 0.4 * dir, gy - 9 * s - (body.lift ?? 0) * s - u * 26 + Math.sin(u * 3.2) * 14 + w]);
  }
  for (const [lw, col, oy] of [[5, '#5a0c1c', 0], [3.4, '#d21e3a', 0], [1.1, '#ff6a7e', -0.8]]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1] + oy);
    for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(pts[i][0], pts[i][1] + oy, (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2 + oy);
    ctx.stroke();
  }
}

// Draws the boss at his feet (x, y) on screen. `b` is his brain (world/discoboss.js).
export function drawDiscoBoss(ctx, m, x, y, time) {
  const b = m.brain ?? { move: 'groove', moveT: 0, form: 'toad', clock: time };
  const dir = m.dir < 0 ? -1 : 1;
  let name = b.move;
  let t = time - b.moveT;
  if (m.hp <= 0) { name = 'defeat'; t = m.dying ?? 0; }
  else if (m.flash > 0.12 && (name === 'groove' || name === 'moon')) { name = 'hurt'; t = 0.25 - (m.flash - 0.12); }
  const pz = poseOf(name, t, time);
  const human = b.form === 'human';
  const look = human
    ? { ...STAGE, outfit: 'disco', face: pz.face }
    : { ...STAGE, outfit: pz.shades ? 'toad' : 'toadup', face: pz.face, frog: 'record' };
  if (name === 'moon') look.dance = 'cool';
  // The red energy of the change, building over the intro's charge.
  if (b.charge > 0) {
    const g = ctx.createRadialGradient(x, y - 60, 4, x, y - 60, 30 + 110 * b.charge);
    g.addColorStop(0, `rgba(255,70,90,${0.9 * b.charge})`);
    g.addColorStop(1, 'rgba(255,40,70,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 160, y - 200, 320, 240);
    x += Math.sin(time * 60) * b.charge * 2;
  }
  if (b.enraged) {
    const g = ctx.createRadialGradient(x, y - 60, 4, x, y - 60, 90);
    g.addColorStop(0, `rgba(255,60,80,${0.4 + 0.2 * Math.sin(time * 12)})`);
    g.addColorStop(1, 'rgba(255,40,70,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 100, y - 160, 200, 180);
  }
  if (!human && !(m.hp <= 0 && (m.dying ?? 0) > 1.6)) tail(ctx, x, y, SCALE, time, pz.body, dir);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + 1, 30 - (pz.body.lift ?? 0) * 2, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  const state = name === 'moon'
    ? { pose: 'walk', time: time * 1.1, facing: dir, seed: 0, scale: SCALE, body: { tilt: -0.06 }, flash: m.flash > 0 ? 0.5 : 0 }
    : b.walking
      ? { pose: 'walk', time, facing: dir, seed: 0, scale: SCALE, body: { tilt: -0.03 }, flash: m.flash > 0 ? 0.5 : 0 }
      : { pose: 'idle', time, facing: dir, seed: 0, scale: SCALE, body: pz.body, rig: pz.rig, flash: m.flash > 0 ? 0.5 : 0, alpha: m.hp <= 0 ? Math.max(0, 1 - Math.max(0, (m.dying ?? 0) - 3.4) * 2) : 1 };
  if (b.walking) look.dance = 'proud';
  drawHero(ctx, look, null, x, y, state);
}

// ---------- Telegraphs and hits ----------

const RAINBOW = ['#ff5b7f', '#ffb347', '#ffe36b', '#7fe07a', '#5bc8ff', '#b07aff'];

function heart(ctx, x, y, s, col) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x, y + s);
  ctx.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.8, y - s * 1.4, x, y - s * 0.5);
  ctx.bezierCurveTo(x + s * 0.8, y - s * 1.4, x + s * 1.6, y - s * 0.2, x, y + s);
  ctx.fill();
}


// A silver star dancer (a Frogtourage frog spinning): five points around a dark core, turning.
function starFrog(ctx, x, y, r, spin, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(1, 0.92);
  const pts = (rr) => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = spin + (i / 10) * Math.PI * 2 - Math.PI / 2;
      const k = i % 2 ? rr * 0.48 : rr;
      ctx.lineTo(Math.cos(a) * k, Math.sin(a) * k);
    }
    ctx.closePath();
  };
  pts(r * 1.15);
  ctx.fillStyle = 'rgba(200,220,255,0.35)';
  ctx.fill();
  pts(r);
  const g = ctx.createLinearGradient(-r, -r, r, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.5, '#a8b2d0');
  g.addColorStop(1, '#5e6890');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = '#2a3050';
  ctx.lineWidth = 1;
  ctx.stroke();
  pts(r * 0.45);
  ctx.fillStyle = '#2a2a48';
  ctx.fill();
  ctx.fillStyle = '#7fe0ff';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// A jagged lightning line from (x0, y0) to (x1, y1), redrawn every few frames.
function bolt(ctx, x0, y0, x1, y1, now, col = '#7fe8ff') {
  const n = 8;
  const seed = Math.floor(now * 20);
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    for (let i = 1; i < n; i++) {
      const u = i / n;
      const j = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
      const off = ((j - Math.floor(j)) - 0.5) * 12;
      ctx.lineTo(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + off);
    }
    ctx.lineTo(x1, y1);
  };
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = col;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 4;
  path();
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1.4;
  path();
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.6;
  path();
  ctx.stroke();
  ctx.restore();
}

// A stepped wall of glowing glass cubes on one side of the stage, tallest against the line through
// him and stepping down outward, rising cube by cube; the cubes are tinted through the rainbow.
function cubeWall(ctx, x0, x1, side, gy, u) {
  const C = 16;
  const cols = Math.min(7, Math.floor((x1 - x0) / C));
  for (let col = 0; col < cols; col++) {
    const rows = cols - col;
    for (let row = 0; row < rows; row++) {
      const v = Math.max(0, Math.min(1, u * (cols + 2) - (row + col * 0.6)));
      if (v <= 0) continue;
      const cx = side < 0 ? x1 - 40 - (col + 1) * C : x0 + 40 + col * C;
      const cy = gy - (row + 1) * (C - 2) + (1 - v) * 8;
      ctx.globalAlpha = v * 0.8;
      ctx.fillStyle = RAINBOW[(row + col) % RAINBOW.length];
      ctx.fillRect(cx, cy, C - 2, C - 3);
      ctx.globalAlpha = v * 0.7;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx + 1, cy + 1, C - 4, 3);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx + 0.5, cy + 0.5, C - 3, C - 4);
    }
  }
  ctx.globalAlpha = 1;
}

// Tall panes of rainbow glass standing along one side (Do the Hustle).
function glassPanes(ctx, x0, x1, side, gy, u) {
  const n = 3;
  for (let i = 0; i < n; i++) {
    const px = side < 0 ? x1 - 62 - i * 26 : x0 + 42 + i * 26;
    const h = 120 * Math.min(1, u * 1.4 - i * 0.12);
    if (h <= 0) continue;
    const g = ctx.createLinearGradient(px, 0, px + 20, 0);
    RAINBOW.forEach((c, k) => g.addColorStop(k / (RAINBOW.length - 1), c));
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = g;
    ctx.fillRect(px, gy - h, 20, h);
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, gy - h + 0.5, 19, h - 1);
  }
  ctx.globalAlpha = 1;
}

// Floor telegraphs and hits, drawn under the actors. `now` is world time.
export function drawDiscoZones(ctx, world, cam, now) {
  const b = world.disco;
  if (!b) return;
  const gy = world.map.groundY - cam.y;
  const H = ctx.canvas.height;
  const X = (wx) => wx - cam.x;
  const boss = world.mobs.find((m) => m.def.disco);
  // Funky Floor: the stage floor turns to a red-orange and black checkerboard.
  if (b.funky && now >= b.funky.from && now < b.funky.until) {
    const T = 72;
    const k = Math.min(1, (now - b.funky.from) / 0.3) * Math.min(1, (b.funky.until - now) / 0.3);
    ctx.globalAlpha = k;
    for (let i = Math.floor(cam.x / T) - 1; i < Math.floor(cam.x / T) + 12; i++) {
      for (let r = 0; r < 3; r++) {
        const on = ((i + r) % 2 + 2) % 2 === 0;
        const g = ctx.createLinearGradient(0, gy - 2 + r * 26, 0, gy + 24 + r * 26);
        g.addColorStop(0, on ? '#ff6a2a' : '#1a0c14');
        g.addColorStop(1, on ? '#d8401a' : '#2a1018');
        ctx.fillStyle = g;
        ctx.fillRect(X(i * T), gy - 2 + r * 26, T, 26);
      }
    }
    ctx.fillStyle = 'rgba(255,170,90,0.9)';
    for (let i = Math.floor(cam.x / T) - 1; i < Math.floor(cam.x / T) + 12; i++) ctx.fillRect(X(i * T) - 1, gy - 2, 2, H);
    ctx.globalAlpha = 1;
  }
  // The boss's red ring at his feet.
  if (boss && boss.hp > 0 && b.cut == null) {
    const bx = X(boss.x);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,60,80,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(bx, gy + 2, 46, 9, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,120,140,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(bx, gy + 2, 52, 11, 0, Math.PI * 0.1, Math.PI * 0.9);
    ctx.stroke();
    // The facing notch.
    ctx.fillStyle = 'rgba(255,90,110,0.9)';
    const fx = bx + (boss.dir < 0 ? -48 : 48);
    ctx.beginPath();
    ctx.moveTo(fx, gy - 2);
    ctx.lineTo(fx + (boss.dir < 0 ? -6 : 6), gy + 2);
    ctx.lineTo(fx, gy + 6);
    ctx.fill();
    ctx.restore();
  }
  for (const z of b.zones) {
    const warn = now < z.at;
    const since = now - z.at;
    if (z.kind === 'half') {
      const x0 = X(z.x0);
      const x1 = X(z.x1);
      if (warn) {
        const u = Math.min(1, (now - z.from) / Math.max(0.2, z.at - z.from));
        ctx.fillStyle = `rgba(255,140,200,${0.06 + 0.12 * u})`;
        ctx.fillRect(x0, gy - 2, x1 - x0, H);
        if (z.cubes) cubeWall(ctx, x0, x1, z.side, gy, u);
        else if (!z.blind) glassPanes(ctx, x0, x1, z.side, gy, u);
      } else if (since < 0.45) {
        const a = 1 - since / 0.45;
        // The hit: a sweep of white light across that half, with a rainbow edge.
        ctx.fillStyle = `rgba(255,240,255,${0.55 * a})`;
        ctx.fillRect(x0, 0, x1 - x0, H);
        const edge = z.side < 0 ? x1 : x0;
        RAINBOW.forEach((c, i) => { ctx.fillStyle = c; ctx.globalAlpha = 0.7 * a; ctx.fillRect(edge - z.side * (i * 3 + 3), 0, 3, H); });
        ctx.globalAlpha = 1;
      }
    } else if (z.kind === 'tiles') {
      for (let i = Math.floor(cam.x / z.T) - 1; i < Math.floor(cam.x / z.T) + 12; i++) {
        if (((i % 2) + 2) % 2 !== z.parity) continue;
        const x0 = X(i * z.T);
        if (warn) {
          const u = Math.min(1, (now - z.from) / (z.at - z.from));
          ctx.fillStyle = `rgba(255,${200 - 80 * u},120,${0.15 + 0.35 * u * (0.6 + 0.4 * Math.sin(now * (10 + 20 * u)))})`;
          ctx.fillRect(x0 + 2, gy, z.T - 4, H);
          ctx.strokeStyle = '#ffe0a0';
          ctx.lineWidth = 2;
          ctx.strokeRect(x0 + 2, gy, z.T - 4, H);
        } else if (since < 0.4) {
          const a = 1 - since / 0.4;
          ctx.fillStyle = `rgba(255,220,160,${0.85 * a})`;
          ctx.fillRect(x0, gy - 50 * a, z.T, H);
          ctx.fillStyle = `rgba(255,255,255,${0.7 * a})`;
          ctx.fillRect(x0 + 4, gy - 50 * a, z.T - 8, 3);
        }
      }
    } else if (z.kind === 'cone') {
      const x0 = X(z.x0);
      const x1 = X(z.x1);
      const ox = z.dir > 0 ? x0 : x1;
      const fx = z.dir > 0 ? x1 : x0;
      if (warn) {
        const u = Math.min(1, (now - z.from) / Math.max(0.2, z.at - z.from));
        ctx.fillStyle = `rgba(255,90,140,${0.15 + 0.2 * u})`;
        ctx.beginPath();
        ctx.moveTo(ox, gy - 40);
        ctx.lineTo(fx, gy - 100);
        ctx.lineTo(fx, gy + 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,190,220,0.8)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else if (since < 0.4) {
        const a = 1 - since / 0.4;
        // A crescent slash and sparks thrown along it.
        ctx.strokeStyle = `rgba(255,255,255,${a})`;
        ctx.lineWidth = 4 * a + 1;
        ctx.beginPath();
        ctx.arc(ox, gy - 40, 40 + since * 260, z.dir > 0 ? -0.6 : Math.PI - 0.6, z.dir > 0 ? 0.6 : Math.PI + 0.6);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,120,170,${0.5 * a})`;
        ctx.fillRect(Math.min(x0, x1), gy - 100, Math.abs(x1 - x0), 106);
      }
    } else if (z.kind === 'wave') {
      if (now < z.from) continue;
      const wx = X(z.x0 + z.dir * z.speed * Math.max(0, now - z.at));
      if (warn) {
        // Arrows lighting up at the edge it will come from.
        for (let i = 0; i < 3; i++) {
          const on = Math.floor(now * 8) % 3 === i;
          ctx.fillStyle = on ? '#bfefff' : 'rgba(120,200,255,0.5)';
          const ax = X(z.x0) + z.dir * i * 9;
          ctx.beginPath();
          ctx.moveTo(ax, gy - 18);
          ctx.lineTo(ax + z.dir * 7, gy - 12);
          ctx.lineTo(ax, gy - 6);
          ctx.fill();
        }
      } else if (wx > -40 && wx < ctx.canvas.width + 40) {
        // A row of glowing white tiles racing over the floor, with a light trail.
        const g = ctx.createLinearGradient(wx - z.dir * 70, 0, wx, 0);
        g.addColorStop(0, 'rgba(160,220,255,0)');
        g.addColorStop(1, 'rgba(200,240,255,0.6)');
        ctx.fillStyle = g;
        ctx.fillRect(Math.min(wx, wx - z.dir * 70), gy - 4, 70, 30);
        ctx.fillStyle = 'rgba(240,250,255,0.95)';
        ctx.fillRect(wx - 7, gy - 20, 14, 22);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(wx - 7.5, gy - 20.5, 15, 23);
      }
    } else if (z.kind === 'spot') {
      // Spotlights: tall glowing cylinders of light with a bright ring where they meet the floor.
      if (now < z.from) continue;
      const fade = Math.min(1, (now - z.from) / 0.3);
      for (const l of z.lights) {
        const lx = X(l.x + l.vx * (now - z.from));
        const left = z.at - now;
        const hot = left < 1 && left > 0 ? 0.15 * (0.5 + 0.5 * Math.sin(now * 20)) : 0;
        const g = ctx.createLinearGradient(lx - z.w / 2, 0, lx + z.w / 2, 0);
        g.addColorStop(0, `rgba(255,250,235,${0.18 * fade})`);
        g.addColorStop(0.5, `rgba(255,250,235,${(0.45 + hot) * fade})`);
        g.addColorStop(1, `rgba(255,250,235,${0.18 * fade})`);
        ctx.fillStyle = g;
        ctx.fillRect(lx - z.w / 2, 0, z.w, gy + 4);
        ctx.strokeStyle = `rgba(255,255,255,${0.5 * fade})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lx - z.w / 2, 0);
        ctx.lineTo(lx - z.w / 2, gy + 4);
        ctx.moveTo(lx + z.w / 2, 0);
        ctx.lineTo(lx + z.w / 2, gy + 4);
        ctx.stroke();
        ctx.strokeStyle = `rgba(255,250,220,${0.9 * fade})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(lx, gy + 4, z.w / 2, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,250,220,${0.25 * fade})`;
        ctx.fill();
      }
    } else if (z.kind === 'track') {
      // A silver star frog spins along the track, lighting it pink; then it bursts.
      const x0 = X(z.x0);
      const x1 = X(z.x1);
      const u = Math.max(0, Math.min(1, (now - z.from) / (z.walk ?? 1.5)));
      if (now < z.from) continue;
      const head = z.dir > 0 ? x0 + (x1 - x0) * u : x1 - (x1 - x0) * u;
      if (warn) {
        ctx.fillStyle = 'rgba(255,90,170,0.3)';
        if (z.dir > 0) ctx.fillRect(x0, gy - 2, head - x0, H);
        else ctx.fillRect(head, gy - 2, x1 - head, H);
        ctx.strokeStyle = 'rgba(255,170,220,0.9)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(Math.min(x0, x1), gy - 2, Math.abs(x1 - x0), H);
        starFrog(ctx, head, gy - 18, 14, now * -6 * z.dir);
      } else if (since < 0.45) {
        const a = 1 - since / 0.45;
        ctx.fillStyle = `rgba(255,140,200,${0.8 * a})`;
        ctx.fillRect(x0, gy - 70 * a, x1 - x0, H);
        starFrog(ctx, z.dir > 0 ? x1 : x0, gy - 18 - since * 60, 14, now * -10, a);
      }
    } else if (z.kind === 'beats') {
      // Eighth Beats: red rings closing in under you, then a burst.
      if (now < z.from) continue;
      const px = X(z.x ?? world.body.x);
      if (warn) {
        const u = Math.min(1, (now - z.from) / (z.at - z.from));
        for (let i = 0; i < 3; i++) {
          const r = 34 - ((now * 30 + i * 11) % 33) * (0.4 + 0.6 * u);
          ctx.strokeStyle = `rgba(255,70,90,${0.5 + 0.4 * u})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.ellipse(px, gy + 3, Math.max(4, r), Math.max(1, r * 0.22), 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (since < 0.35) {
        const a = 1 - since / 0.35;
        ctx.fillStyle = `rgba(255,240,240,${0.8 * a})`;
        ctx.beginPath();
        ctx.ellipse(px, gy - 10, 34 * (1 + since * 2), 30 * a, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // Frog dancers on their pedestals for Let's Dance: little frog-folk in white disco shirts and teal
  // flares (drawn on the hero body), standing on the pedestals at the back of the stage. They pop up
  // and groove; when its turn comes each one throws a pose pointing left or right, and blue
  // lightning tethers it to him while its cleave is coming.
  if (b.frogs) {
    const W = ctx.canvas.width / (ctx.getTransform().a || 1);
    // The pedestals sit at the back of the stage, which drifts at 0.9 of the floor (discostage.js).
    const PX = (wx) => W / 2 + (wx - (cam.x + W / 2)) * 0.9;
    const top = gy - 32;
    const tether = b.zones.find((z) => z.dance && !z.hit && now >= z.from);
    const turn = tether ? b.zones.filter((z) => z.dance).indexOf(tether) : -1;
    b.frogs.forEach((f, i) => {
      const x = PX(f.x);
      const e = now - f.from;
      if (e <= 0) return;
      const pop = e < 0.15 ? (e / 0.15) * 1.2 : e < 0.3 ? 1.2 - ((e - 0.15) / 0.15) * 0.2 : 1;
      const posing = now >= f.poseAt;
      const lit = i === turn || (posing && now < f.poseAt + 0.5);
      if (lit) {
        const g = ctx.createRadialGradient(x, top - 18, 2, x, top - 18, 26);
        g.addColorStop(0, 'rgba(255,245,190,0.5)');
        g.addColorStop(1, 'rgba(255,245,190,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - 26, top - 44, 52, 48);
      }
      const beat = (now % 0.5) / 0.5;
      const dip = Math.round(Math.max(0, Math.sin(Math.PI * Math.min(1, beat * 1.6))) * 4) / 4;
      // Grooving: a hand on the hip, the other swinging, bobbing on the beat. Posing: turned to its
      // side, the disco point thrown up and out that way.
      const rig = posing
        ? { armOver: 'point', backArm: [0.6, -4.2], armSide: -1, tilt: 4, tx: 1, by: dip, frontLeg: [2.5, 0, 8], backLeg: [-1, 0, -3] }
        : { armOver: 60 + Math.round(Math.sin(now * Math.PI * 2 + i) * 15), backArm: [0.6, -4.2], armSide: -1, by: dip, frontLeg: [1.5, 0, 4], backLeg: [-1.5, 0, -4], tilt: (i % 2 ? 2 : -2) };
      const look = { ...DANCER, face: posing ? 'excited' : 'smug' };
      drawHero(ctx, look, null, x, top + 1, { pose: 'idle', time: now + i, facing: posing ? f.hand : 1, seed: i, scale: 0.95 * pop, rig, body: { tilt: posing ? 0.06 : 0 } });
    });
    if (tether && boss && b.frogs[turn]) bolt(ctx, X(boss.x), gy - 70, PX(b.frogs[turn].x), top - 24, now);
  }
  // Pillars of light falling where frogs appear.
  for (const c of b.casts ?? []) {
    if (c.kind !== 'pillars') continue;
    const e = now - (c.at - 0.5);
    if (e < 0 || e > 1.1) continue;
    for (const wx of c.xs) {
      const px = X(wx);
      const k = e < 0.3 ? e / 0.3 : 1 - (e - 0.3) / 0.8;
      const g = ctx.createLinearGradient(px - 18, 0, px + 18, 0);
      g.addColorStop(0, 'rgba(160,220,255,0)');
      g.addColorStop(0.5, `rgba(230,245,255,${0.8 * k})`);
      g.addColorStop(1, 'rgba(160,220,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(px - 18, 0, 36, gy + 4);
      ctx.strokeStyle = `rgba(200,240,255,${k})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(px, gy + 4, 22 + e * 20, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// The big casts over the stage: the dark red orb (Disco Infernal, the enrage) and the white-red
// burst with rainbow speed lines (Celebrate Good Times, Let's Pose!).
export function drawDiscoCasts(ctx, world, cam, now, W, H) {
  const b = world.disco;
  if (!b?.casts) return;
  const gy = world.map.groundY - cam.y;
  for (const c of b.casts) {
    const x = c.x - cam.x;
    const y = gy - 70;
    if (c.kind === 'orb') {
      const lead = c.big ? 3 : 1.2;
      const e = now - (c.at - lead);
      if (e < 0 || e > lead + 0.6) continue;
      if (e < lead) {
        // Swelling: a dark red sphere with a glow, a rune ring turning round it.
        const u = e / lead;
        const r = 20 + u * (c.big ? 160 : 110);
        const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
        g.addColorStop(0, 'rgba(255,220,200,0.9)');
        g.addColorStop(0.25, 'rgba(230,60,70,0.75)');
        g.addColorStop(0.8, 'rgba(90,10,30,0.6)');
        g.addColorStop(1, 'rgba(255,90,110,0.0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(now * 1.4);
        ctx.strokeStyle = 'rgba(255,200,190,0.9)';
        ctx.lineWidth = 1.2;
        for (const rr of [r * 0.62, r * 0.7]) {
          ctx.beginPath();
          ctx.arc(0, 0, rr, 0, Math.PI * 2);
          ctx.stroke();
        }
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          ctx.save();
          ctx.rotate(a);
          ctx.strokeRect(r * 0.63, -2, 5, 4);
          ctx.beginPath();
          ctx.moveTo(r * 0.3, 0);
          ctx.lineTo(r * 0.55, 0);
          ctx.stroke();
          ctx.restore();
        }
        ctx.rotate(-now * 2.8);
        ctx.beginPath();
        for (let i = 0; i <= 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ctx.lineTo(Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42);
        }
        ctx.stroke();
        ctx.restore();
      } else {
        // The burst: a white flash ring rushing out.
        const u = (e - lead) / 0.6;
        ctx.fillStyle = `rgba(255,230,230,${0.6 * (1 - u)})`;
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = `rgba(255,120,140,${1 - u})`;
        ctx.lineWidth = 6 * (1 - u) + 1;
        ctx.beginPath();
        ctx.arc(x, y, 60 + u * 360, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (c.kind === 'burst') {
      const e = now - c.at;
      if (e < 0 || e > 0.8) continue;
      const u = e / 0.8;
      // Rainbow speed lines rushing out from him.
      ctx.save();
      ctx.lineCap = 'round';
      for (let i = 0; i < 40; i++) {
        const a = i * 2.39996;
        const r0 = 20 + u * 140 + (i % 5) * 12;
        const len = 30 + (i % 7) * 12;
        ctx.strokeStyle = i % 3 === 0 ? `rgba(255,255,255,${1 - u})` : RAINBOW[i % RAINBOW.length];
        ctx.globalAlpha = 1 - u;
        ctx.lineWidth = 1.5 + (i % 3);
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0 * 0.7);
        ctx.lineTo(x + Math.cos(a) * (r0 + len), y + Math.sin(a) * (r0 + len) * 0.7);
        ctx.stroke();
      }
      ctx.restore();
      const g = ctx.createRadialGradient(x, y, 2, x, y, 80);
      g.addColorStop(0, `rgba(255,255,255,${1 - u})`);
      g.addColorStop(0.4, `rgba(255,90,120,${0.8 * (1 - u)})`);
      g.addColorStop(1, 'rgba(255,60,90,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 80, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Text callouts and the grooviness meter, over everything.
export function drawDiscoTop(ctx, world, cam, now) {
  const b = world.disco;
  if (!b) return;
  for (const c of b.callouts) {
    const e = now - c.at;
    if (e < 0 || e > c.dur) continue;
    const s = Math.min(1, e / 0.12) * (1 + 0.2 * Math.max(0, 1 - (e - 0.12) / 0.2));
    ctx.save();
    ctx.translate(ctx.canvas.width / 2 / (ctx.getTransform().a || 1), 112);
    ctx.scale(s, s);
    ctx.globalAlpha = Math.min(1, (c.dur - e) * 3);
    ctx.font = `bold ${c.size ?? 18}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#5a1a6a';
    ctx.strokeText(c.text, 0, 0);
    ctx.fillStyle = c.color ?? '#ffe36b';
    ctx.fillText(c.text, 0, 0);
    ctx.restore();
  }
  // PERFECT GROOVE: chunky gold letters with a neon dancer sign, bouncing in.
  if (b.perfectAt != null) {
    const e = now - b.perfectAt;
    if (e >= 0 && e < 2.4) {
      const W = ctx.canvas.width / (ctx.getTransform().a || 1);
      const s = Math.min(1, e / 0.15) * (1 + 0.25 * Math.max(0, 1 - (e - 0.15) / 0.25));
      ctx.save();
      ctx.globalAlpha = Math.min(1, (2.4 - e) * 3);
      ctx.translate(W / 2, 120);
      ctx.scale(s, s);
      ctx.rotate(-0.08);
      for (const [word, dx, dy] of [['PERFECT', -30, -14], ['GROOVE', 24, 22]]) {
        ctx.font = '900 34px "Impact", "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 9;
        ctx.strokeStyle = '#3a1a08';
        ctx.strokeText(word, dx, dy);
        const g = ctx.createLinearGradient(0, dy - 28, 0, dy);
        g.addColorStop(0, '#fff6b0');
        g.addColorStop(0.5, '#ffc83a');
        g.addColorStop(1, '#e07a10');
        ctx.fillStyle = g;
        ctx.fillText(word, dx, dy);
      }
      // A tiny neon dancer line-up beside it, the bulbs chasing.
      for (let i = 0; i < 12; i++) {
        const on = (i + Math.floor(now * 12)) % 3 === 0;
        ctx.fillStyle = on ? '#fff6c8' : '#ff8fd0';
        ctx.beginPath();
        ctx.arc(70 + (i % 6) * 8, -26 + Math.floor(i / 6) * 10, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
  // Burn Baby Burn: a countdown over your head while a spotlight timer runs.
  const spot = b.zones.find((z) => z.kind === 'spot' && !z.hit && now >= z.from);
  if (spot) {
    const left = Math.max(0, spot.at - now);
    const px = world.body.x - cam.x;
    const py = world.body.y - cam.y - 62;
    ctx.fillStyle = 'rgba(40,10,30,0.85)';
    ctx.beginPath();
    ctx.arc(px, py, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = left < 1.5 ? '#ff5a6a' : '#ffb347';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 9, -Math.PI / 2, -Math.PI / 2 + (left / (spot.at - spot.from)) * Math.PI * 2);
    ctx.stroke();
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(Math.ceil(left)), px, py + 3);
  }
  // Blown hearts and confetti from his moves.
  for (const h of b.hearts ?? []) {
    const u = (now - h.at) / 1.4;
    if (u < 0 || u > 1) continue;
    ctx.globalAlpha = Math.min(1, (1 - u) * 3);
    heart(ctx, h.x - cam.x + h.dx * u * 60, h.y - cam.y - u * 30 + Math.sin(u * 10) * 4, 4 + u * 3, '#ff5f9f');
    ctx.globalAlpha = 1;
  }
}

// ---------- The cutscene ----------

const smoothstep = (a, b, t) => {
  const u = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

// The camera for the cutscene at time t: where it looks (world x, y), how far it zooms in, and how
// far the letterbox bars are in. Shots: a pan across the stage; following him as he struts in;
// closer on the dance; close on the point; pulling back as the energy builds; quick cuts to his new
// feet, his hand and record, and his face; the reveal pose; then back out to the fight.
export function cutShot(world, m, t) {
  const gy = world.map.groundY;
  const hx = m.x;
  const SHOTS = [
    [0, { x: 260, y: gy - 120, z: 1 }],
    [1.4, { x: 700, y: gy - 120, z: 1 }],
    [1.5, { x: hx, y: gy - 80, z: 1.25 }],
    [3.6, { x: hx, y: gy - 80, z: 1.25 }],
    [3.7, { x: hx, y: gy - 70, z: 1.6 }],
    [5.1, { x: hx, y: gy - 72, z: 1.7 }],
    [5.2, { x: hx + 8, y: gy - 72, z: 2.2 }],
    [6.7, { x: hx + 8, y: gy - 74, z: 2.3 }],
    [6.8, { x: hx, y: gy - 80, z: 1.7 }],
    [8.6, { x: hx, y: gy - 80, z: 1.25 }],
    [8.9, { x: hx, y: gy - 12, z: 3.4 }],
    [9.4, { x: hx, y: gy - 12, z: 3.5 }],
    [9.45, { x: hx + 22 * (m.dir || 1), y: gy - 62, z: 3.2 }],
    [9.95, { x: hx + 22 * (m.dir || 1), y: gy - 64, z: 3.3 }],
    [10, { x: hx, y: gy - 80, z: 3 }],
    [10.5, { x: hx, y: gy - 80, z: 3.1 }],
    [10.55, { x: hx, y: gy - 80, z: 1.5 }],
    [12.6, { x: hx, y: gy - 82, z: 1.55 }],
    [13.4, { x: hx, y: gy - 120, z: 1 }],
  ];
  let i = 0;
  while (i < SHOTS.length - 2 && SHOTS[i + 1][0] <= t) i++;
  const [t0, a] = SHOTS[i];
  const [t1, b] = SHOTS[i + 1];
  // Short gaps are hard cuts; long ones glide.
  const k = t1 - t0 < 0.15 ? (t >= t1 ? 1 : 0) : smoothstep(t0, t1, t);
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k, bars: smoothstep(0, 0.8, t) * (1 - smoothstep(12.7, 13.4, t)) };
}

function slab(ctx, text, x, y, size, fill, stroke, skew = -0.2) {
  ctx.save();
  ctx.translate(x, y);
  ctx.transform(1, 0, skew, 1, 0, 0);
  ctx.font = `900 ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.28;
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = fill;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

// The cutscene's overlay, in screen space: letterbox bars, the stage title, his line (in a box
// under the top bar, clear of his face), the red of the
// change, the name card, and a skip hint.
export function drawDiscoCut(ctx, world, W, H) {
  const b = world.disco;
  if (b?.cut == null) return;
  const t = b.cut;
  const m = world.mobs.find((x) => x.def.disco);
  if (!m) return;
  const shot = cutShot(world, m, t);
  // The red of the change: building, then a full flash, then the red-lit close-ups.
  if (t > 6.8 && t < 8.6) {
    ctx.fillStyle = `rgba(255,40,70,${0.35 * smoothstep(6.8, 8.6, t)})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (t >= 8.6 && t < 8.95) {
    ctx.fillStyle = `rgba(255,${t < 8.75 ? 70 : 230},${t < 8.75 ? 90 : 230},${t < 8.75 ? 1 : 1 - (t - 8.75) / 0.2})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (t >= 8.95 && t < 10.5) {
    ctx.fillStyle = 'rgba(255,50,80,0.28)';
    ctx.fillRect(0, 0, W, H);
    // Speed lines rushing past the close-ups.
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 18; i++) {
      const y = (i * 41 + Math.floor(t * 30) * 13) % H;
      const len = 40 + (i * 37) % 80;
      const x = ((i * 97 + t * 900) % (W + len)) - len;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y);
      ctx.stroke();
    }
  }
  // Letterbox bars.
  const bar = Math.round(44 * shot.bars);
  if (bar > 0) {
    ctx.fillStyle = '#08040f';
    ctx.fillRect(0, 0, W, bar);
    ctx.fillRect(0, H - bar, W, bar);
  }
  // The stage title over the opening pan.
  if (t < 1.6) {
    const a = smoothstep(0.1, 0.5, t) * (1 - smoothstep(1.2, 1.6, t));
    ctx.globalAlpha = a;
    slab(ctx, 'FUNKY FEVER STAGE', W / 2, H / 2 - 6, 26, '#ffe96a', '#5a1a6a');
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Solution Nine  ·  Boss Rush', W / 2, H / 2 + 12);
    ctx.globalAlpha = 1;
  }
  // His line, typed out in a speech box under the close-up.
  if (t > 5.3 && t < 6.8) {
    const line = 'Are you ready to get down?';
    const n = Math.min(line.length, Math.floor((t - 5.3) * 30));
    ctx.fillStyle = 'rgba(20,10,35,0.85)';
    const by = bar + 8;
    ctx.fillRect(W / 2 - 150, by, 300, 26);
    ctx.strokeStyle = '#ff8fd0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(W / 2 - 150, by, 300, 26);
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#c6e83a';
    ctx.fillText('Dancing Green', W / 2 - 142, by + 10);
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(line.slice(0, n), W / 2 - 142, by + 22);
  }
  // The name card: slides in from the side with stripes behind it, holds, and slides away.
  if (t > 10.6 && t < 12.9) {
    const inK = smoothstep(10.6, 10.9, t);
    const outK = smoothstep(12.5, 12.9, t);
    const off = (1 - inK) * -W + outK * W;
    ctx.save();
    ctx.translate(off, 0);
    const y = H * 0.58;
    for (const [dy, h, c] of [[-26, 52, 'rgba(198,232,58,0.85)'], [-22, 44, 'rgba(155,63,214,0.92)']]) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(0, y + dy);
      ctx.lineTo(W * 0.62, y + dy);
      ctx.lineTo(W * 0.62 - 20, y + dy + h);
      ctx.lineTo(0, y + dy + h);
      ctx.fill();
    }
    slab(ctx, 'DANCING GREEN', W * 0.3, y + 6, 28, '#c6e83a', '#2a0f3a');
    ctx.font = 'bold italic 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd0f0';
    ctx.fillText('— The Party Animal —', W * 0.3, y + 18);
    ctx.restore();
  }
  // Skip hint.
  if (t > 0.6 && t < 12.6) {
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('Space / Enter: skip', W - 8, H - Math.max(6, bar - 14));
  }
}
