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

function frog(ctx, fx, fy, s, raise, flip = 1) {
  ctx.fillStyle = '#4fbf5a';
  ctx.beginPath();
  ctx.ellipse(fx, fy - 6 * s, 5 * s, 6 * s, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#7fe07a';
  ctx.beginPath();
  ctx.ellipse(fx, fy - 12 * s, 4.5 * s, 3.5 * s, 0, 0, 7);
  ctx.fill();
  for (const sx of [-2, 2]) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(fx + sx * s, fy - 14.5 * s, 1.6 * s, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(fx + sx * s + flip * 0.3 * s, fy - 14.5 * s, 0.7 * s, 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = '#ff7fb0';
  ctx.fillRect(fx - 2 * s, fy - 10.5 * s, 4 * s, 0.8 * s);
  ctx.strokeStyle = '#4fbf5a';
  ctx.lineWidth = 1.6 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (raise) {
    ctx.moveTo(fx + raise * 4 * s, fy - 8 * s);
    ctx.lineTo(fx + raise * 8 * s, fy - 16 * s);
  }
  ctx.moveTo(fx - (raise || 1) * 4 * s, fy - 8 * s);
  ctx.lineTo(fx - (raise || 1) * 6 * s, fy - 3 * s);
  ctx.stroke();
}

// Floor telegraphs and hits, drawn under the actors. `now` is world time.
export function drawDiscoZones(ctx, world, cam, now) {
  const b = world.disco;
  if (!b) return;
  const gy = world.map.groundY - cam.y;
  const H = ctx.canvas.height;
  for (const z of b.zones) {
    const warn = now < z.at;
    const since = now - z.at;
    const X = (wx) => wx - cam.x;
    if (z.kind === 'half') {
      const x0 = X(z.x0);
      const x1 = X(z.x1);
      if (warn) {
        // A rainbow wall rising on that side, and the floor there tinted.
        const u = Math.min(1, (now - z.from) / Math.max(0.2, z.at - z.from));
        ctx.fillStyle = `rgba(255,120,190,${0.08 + 0.14 * u})`;
        ctx.fillRect(x0, gy - 140, x1 - x0, H);
        const wx = z.side < 0 ? x0 + 6 : x1 - 24;
        if (!z.blind) RAINBOW.forEach((c, i) => { ctx.fillStyle = c; ctx.globalAlpha = 0.85; ctx.fillRect(wx + i * 3, gy - 120 * u, 3, 120 * u); });
        if (z.cubes) {
          for (let col = 0; col < 5; col++) for (let row = 0; row < 5 - col; row++) {
            const v = Math.max(0, Math.min(1, u * 6 - (row + col * 0.5)));
            if (v <= 0) continue;
            ctx.globalAlpha = v * 0.9;
            ctx.fillStyle = '#f2f2ff';
            const cx = z.side < 0 ? x0 + 4 + col * 12 : x1 - 16 - col * 12;
            ctx.fillRect(cx, gy - 12 - row * 11 + (1 - v) * 5, 11, 10);
            ctx.fillStyle = '#c4cbff';
            ctx.fillRect(cx, gy - 4 - row * 11 + (1 - v) * 5, 11, 2);
          }
        }
        ctx.globalAlpha = 1;
      } else if (since < 0.45) {
        const a = 0.65 * (1 - since / 0.45);
        ctx.fillStyle = `rgba(255,${z.side < 0 ? 120 : 190},${z.side < 0 ? 210 : 140},${a})`;
        ctx.fillRect(x0, 0, x1 - x0, H);
      }
    } else if (z.kind === 'tiles') {
      for (let i = Math.floor(cam.x / z.T) - 1; i < Math.floor(cam.x / z.T) + 12; i++) {
        if (((i % 2) + 2) % 2 !== z.parity) continue;
        const x0 = X(i * z.T);
        if (warn) {
          const u = Math.min(1, (now - z.from) / (z.at - z.from));
          const blink = 0.5 + 0.5 * Math.sin(now * (10 + u * 20));
          ctx.fillStyle = `rgba(255,70,60,${0.3 + 0.35 * u * blink})`;
          ctx.fillRect(x0 + 1, gy - 2, z.T - 2, H);
          ctx.fillStyle = `rgba(255,140,90,${0.25 + 0.25 * u})`;
          ctx.fillRect(x0 + 1, gy - 2 - 26 * u, z.T - 2, 26 * u);
          ctx.strokeStyle = '#fff0b0';
          ctx.lineWidth = 2;
          ctx.strokeRect(x0 + 2, gy - 1, z.T - 4, H);
        } else if (since < 0.4) {
          ctx.fillStyle = `rgba(255,160,90,${0.8 * (1 - since / 0.4)})`;
          ctx.fillRect(x0, gy - 60 * (1 - since / 0.4), z.T, H);
        }
      }
    } else if (z.kind === 'cone') {
      const x0 = X(z.x0);
      const x1 = X(z.x1);
      if (warn) {
        ctx.fillStyle = 'rgba(255,90,140,0.25)';
        ctx.beginPath();
        const ox = z.dir > 0 ? x0 : x1;
        ctx.moveTo(ox, gy - 60);
        ctx.lineTo(z.dir > 0 ? x1 : x0, gy - 100);
        ctx.lineTo(z.dir > 0 ? x1 : x0, gy + 4);
        ctx.fill();
      } else if (since < 0.4) {
        ctx.fillStyle = `rgba(255,120,170,${0.7 * (1 - since / 0.4)})`;
        ctx.fillRect(x0, gy - 110, x1 - x0, 116);
      }
    } else if (z.kind === 'wave') {
      if (now < z.from) continue;
      const wx = X(z.x0 + z.dir * z.speed * Math.max(0, now - z.at));
      if (warn) {
        ctx.fillStyle = 'rgba(120,200,255,0.35)';
        ctx.fillRect(X(z.x0) - 4, gy - 22, 8, 22);
      } else if (wx > -40 && wx < ctx.canvas.width + 40) {
        for (let r = 0; r < 2; r++) {
          ctx.fillStyle = r ? 'rgba(200,240,255,0.95)' : 'rgba(110,200,255,0.75)';
          ctx.fillRect(wx - 7 + r * 3, gy - 18 + r * 4, 14 - r * 6, 18 - r * 4);
        }
        ctx.fillStyle = 'rgba(110,200,255,0.25)';
        ctx.fillRect(wx - z.dir * 40, gy - 6, 40 * z.dir, 6);
      }
    } else if (z.kind === 'spot') {
      // Spotlights drifting across the floor; when the timer runs out, stand in one.
      for (const l of z.lights) {
        const lx = X(l.x + l.vx * (now - z.from));
        const left = z.at - now;
        ctx.fillStyle = `rgba(255,250,220,${0.14 + (left < 1 && left > 0 ? 0.12 * Math.sin(now * 20) : 0)})`;
        ctx.beginPath();
        ctx.moveTo(lx - 4, 0);
        ctx.lineTo(lx + 4, 0);
        ctx.lineTo(lx + z.w / 2, gy + 4);
        ctx.lineTo(lx - z.w / 2, gy + 4);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,250,220,0.45)';
        ctx.beginPath();
        ctx.ellipse(lx, gy + 4, z.w / 2, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (z.kind === 'track') {
      // A frog moonwalks along the track, leaving it glowing; then it bursts.
      const x0 = X(z.x0);
      const x1 = X(z.x1);
      const u = Math.max(0, Math.min(1, (now - z.from) / (z.walk ?? 1.5)));
      const head = z.dir > 0 ? x0 + (x1 - x0) * u : x1 - (x1 - x0) * u;
      if (warn) {
        ctx.fillStyle = 'rgba(255,90,170,0.35)';
        if (z.dir > 0) ctx.fillRect(x0, gy - 2, head - x0, 10);
        else ctx.fillRect(head, gy - 2, x1 - head, 10);
        frog(ctx, head, gy, 1.5, 0, -z.dir);
      } else if (since < 0.45) {
        ctx.fillStyle = `rgba(255,110,180,${0.75 * (1 - since / 0.45)})`;
        ctx.fillRect(x0, gy - 70 * (1 - since / 0.45), x1 - x0, H);
      }
    }
  }
  // Frog dancers on their pedestals for Let's Dance: each poses a hand when its turn comes.
  if (b.frogs) {
    for (const f of b.frogs) {
      const x = f.x - cam.x;
      const pop = Math.max(0, Math.min(1, (now - f.from) / 0.25));
      if (pop <= 0) continue;
      const raise = now >= f.poseAt ? f.hand : 0;
      const lit = now >= f.poseAt && now < f.poseAt + 0.5;
      if (lit) {
        ctx.fillStyle = 'rgba(255,240,170,0.35)';
        ctx.beginPath();
        ctx.ellipse(x, gy - 46, 16, 22, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      frog(ctx, x, gy - 30, 1.6 * Math.min(1, pop * 1.2), raise);
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
