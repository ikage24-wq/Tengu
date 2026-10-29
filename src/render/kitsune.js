// Draws the Shrine Maiden's kitsune shrine guardian (world/kitsune.js) on a skeleton of her own:
// her look is the hero's parts ("Silver Moon": a long silver-white hime cut, fox ears, a bushy
// fox tail tipped red, amber eyes, white shrine robes), drawn a head taller than the Maiden, but
// nothing of the player's rig moves her. Every pose is hers, and she's carried from one to the
// next on springs (like the doll: render/spiritdoll.js), so she moves fluidly: a measured stride,
// weight in her strikes, a long follow-through. Her naginata is a bone in her right hand, drawn
// from where the hand really is: a lacquered vermilion haft, a curved silver blade, a red tassel.
import { drawPosed } from './hero.js';
import { fxSprite } from './fx-sprites.js';
import { KMOVES, CALL } from '../world/kitsune.js';

export const KITSUNE_LOOK = {
  hairStyle: 'hime', hairColor: '#f2f0ff', hairTip: '#ff8a7a', earStyle: 'wolf', tail: 'wolf', skinTone: '#fff0e6', eyeColor: '#e8a23c', eyeStyle: 'sleepy',
  browStyle: 'thin', face: 'cool', outfit: 'bigkimono', outfitColor: '#ffffff',
};
// A head taller than the Maiden (the whole figure scaled, never stretched).
const SCALE = 1.18;
const TAU = Math.PI * 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const ease = (t) => 1 - (1 - t) ** 3;
const soft = (t) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t));
const lerp = (a, b, t) => a + (b - a) * t;
const bump = (p, a, b) => (p < a || p > b ? 0 : Math.sin(((p - a) / (b - a)) * Math.PI));

// ---------- Her skeleton ----------
// A pose, in her own terms (facing right; body px of the hero's rig):
//   pole            the naginata's angle (radians: 0 straight up, + tipping forward, PI/2 level
//                   ahead), and `grip` how far along the haft her hand is (0 butt, 1 blade)
//   hand, free      where her right (naginata) hand and left hand reach, from rest
//   legF, legB      each foot's [ahead, up (negative), tilt]; `squat` how low she sinks
//   tx, by, hx, hy, tilt   the upper body's lean and bob, the head's offset, the lean (degrees)
//   ears            her fox ears' twitch [back, front]
//   mouth, eyes     the face; cloth the robes' (and tail's) sway; lift the whole figure up
const REST = {
  pole: 0.12, grip: 0.42, hand: [0.4, 0], free: [0, 0.4], legF: [1.4, 0, 2], legB: [-1.4, 0, -2], squat: 0, tx: 0, by: 0, hx: 0, hy: 0, tilt: 0, ears: [0, 0], cloth: 0, lift: 0,
  mouth: null, eyes: null,
};
const pose = (o) => ({ ...REST, ...o });

// Standing guard: tall and still, the naginata upright at her side, breathing slow; an ear
// flicks now and then and her tail sways.
function standing(t) {
  const breath = Math.sin(t * 1.6);
  const flick = Math.max(0, Math.sin(t * 0.9) - 0.92) * 12;
  return pose({ by: 0.3 * breath, hy: 0.2 * breath, cloth: Math.sin(t * 1.2) * 1.2, ears: [flick * 6, 0], free: [-0.4, 0.4 + 0.3 * breath] });
}
// Walking: a long measured stride, the naginata carried slanted back over her shoulder, free arm
// swinging a little, robes and tail swaying with her steps.
function walking(t, hurry) {
  const ph = t * (hurry ? 10 : 6.5);
  const f = Math.sin(ph);
  const up = (s) => -1.6 * Math.max(0, s) * (hurry ? 1.4 : 1);
  return pose({
    pole: hurry ? -1.1 : -0.42, grip: hurry ? 0.5 : 0.4, hand: [hurry ? -2 : 0.4, hurry ? 1 : -0.6], free: [1.6 * -f, 0.6], tilt: hurry ? 12 : 3,
    legF: [1.2 + 3.2 * f, up(Math.cos(ph)), 14 * f], legB: [-1.2 - 3.2 * f, up(-Math.cos(ph)), -14 * f], by: -0.6 * Math.abs(Math.cos(ph)), cloth: -1.5 - 1.5 * f - (hurry ? 2 : 0), ears: [hurry ? -8 : 0, hurry ? -8 : 0],
  });
}

// ---------- Her moves (KMOVES in world/kitsune.js) ----------

// Thrust: she draws the naginata back level at her hip, sinking, then drives it straight out in a
// long lunge (it lands at 0.42) and holds the line before drawing it back.
function thrusting(p) {
  const draw = soft(seg(p, 0, 0.32));
  const drive = ease(seg(p, 0.34, 0.46));
  const back = soft(seg(p, 0.72, 1));
  const k = drive * (1 - back);
  return pose({
    pole: lerp(0.12, 1.5, soft(seg(p, 0, 0.2))) * (1 - back) + 0.12 * back, grip: 0.3, hand: [lerp(0.4, -3.4, draw) * (1 - drive) + 6.4 * k, lerp(0, 4, draw) * (1 - back)],
    free: [lerp(0, -3, draw) + 4 * k, lerp(0.4, 2, draw) - 1 * k], tilt: -6 * draw * (1 - drive) + 16 * k, tx: 2 * k, squat: 1.6 * draw * (1 - back),
    legF: [lerp(1.4, 2.4, draw) + 3.6 * k, 0, 6], legB: [lerp(-1.4, -3, draw) - 2 * k, 0, -12], cloth: -3 * k, ears: [-6 * k, -6 * k],
    mouth: k > 0.4 ? 'open' : null, eyes: k > 0.4 ? null : draw > 0.4 ? 'half' : null,
  });
}
// Sweep: the blade swung back low behind her, then swept wide and low through everything in front
// (landing at 0.5), carried right through and round to the guard.
function sweeping(p) {
  const wind = soft(seg(p, 0, 0.36));
  const cut = ease(seg(p, 0.38, 0.56));
  const back = soft(seg(p, 0.76, 1));
  return pose({
    pole: lerp(lerp(0.12, -2.3, wind), 2.5, cut) * (1 - back) + 0.12 * back, grip: 0.25, hand: [lerp(-2.6, 4.4, cut) * (1 - back) + 0.4 * back, 2 * (1 - back)],
    free: [lerp(1.6, -3.4, cut) * (1 - back), -1 * (1 - back)], tilt: -8 * wind * (1 - cut) + 14 * cut * (1 - back), tx: 1.6 * cut * (1 - back), squat: 2 * Math.max(wind, cut) * (1 - back),
    legF: [3 + 1.4 * cut, 0, 8], legB: [-3.4, 0, -16], cloth: -4 * cut * (1 - back), ears: [-8 * cut * (1 - back), -4], mouth: cut > 0.3 && back < 0.5 ? 'open' : null,
  });
}
// Rising Cut: crouched with the blade low in front, she cuts up and over her head, rising onto her
// toes (it lands at 0.46, throwing it up), and settles back down with the blade upright.
function rising(p) {
  const low = soft(seg(p, 0, 0.32));
  const up = ease(seg(p, 0.34, 0.5));
  const back = soft(seg(p, 0.74, 1));
  return pose({
    pole: lerp(lerp(0.12, 2.5, low), -0.4, up) * (1 - back) + 0.12 * back, grip: 0.3, hand: [lerp(2.4, 1, up), lerp(3, -9, up) * (1 - back)],
    free: [1, lerp(1, -6, up) * (1 - back)], tilt: 10 * low * (1 - up) - 8 * up * (1 - back), squat: 2.2 * low * (1 - up), lift: 4 * up * (1 - back),
    legF: [2.4, -1.6 * up * (1 - back), 10], legB: [-2.2, -1 * up * (1 - back), -8], cloth: 3 * up * (1 - back), ears: [8 * up * (1 - back), 8 * up * (1 - back)], mouth: up > 0.3 && back < 0.5 ? 'open' : null,
  });
}
// Twin Strike: two quick thrusts, high then low (at 0.3 and 0.62), her feet shifting with each.
function twinning(p) {
  const a = bump(p, 0.18, 0.44);
  const b = bump(p, 0.5, 0.78);
  const settle = soft(seg(p, 0.82, 1));
  return pose({
    pole: lerp(1.35, 1.75, seg(p, 0.45, 0.55)) * (1 - settle) + 0.12 * settle, grip: 0.3, hand: [-1.6 + 6 * a + 6 * b, -2 * a + 3 * b],
    free: [-1 + 2 * (a + b), 1], tilt: 10 * (a + b), tx: 1.6 * (a + b), squat: 1.2 * (1 - settle),
    legF: [2.6 + 1.6 * b, 0, 6], legB: [-2.6, 0, -12], ears: [-6 * (a + b), -6 * (a + b)], mouth: a + b > 0.6 ? 'open' : null,
  });
}
// Fox-Fire Call: she raises the naginata high in both hands, ears up, then drives its butt into
// the ground (at 0.5) as the ring of fox fire goes out, and stands tall over it.
function calling(p) {
  const raise = soft(seg(p, 0, 0.38));
  const slam = ease(seg(p, 0.42, 0.52));
  const settle = soft(seg(p, 0.8, 1));
  return pose({
    pole: -0.05, grip: 0.5, hand: [0.6, lerp(0, -9, raise) * (1 - slam) + 2 * slam * (1 - settle)], free: [1.4, lerp(0.4, -8, raise) * (1 - slam) + 1 * slam],
    lift: 2 * raise * (1 - slam), squat: 1.6 * slam * (1 - settle), tilt: 6 * slam * (1 - settle), ears: [10 * raise, 10 * raise], cloth: 3 * slam * (1 - settle),
    legF: [2.6, 0, 6], legB: [-2.6, 0, -6], mouth: slam > 0.3 && settle < 0.5 ? 'open' : null, eyes: raise > 0.5 && slam < 0.3 ? 'half' : null,
  });
}
// Guard: the haft brought up level across her body in both hands, braced, taking the blow.
function blocking(p) {
  const k = ease(seg(p, 0, 0.18)) * (1 - soft(seg(p, 0.7, 1)));
  const jolt = bump(p, 0.15, 0.4);
  return pose({
    pole: lerp(0.12, 1.57, k), grip: 0.5, hand: [lerp(0.4, 3, k) - 1.4 * jolt, lerp(0, -5, k)], free: [lerp(0, 4.6, k) - 1.4 * jolt, lerp(0.4, -5, k)],
    tilt: 6 * k - 8 * jolt, tx: -1.4 * jolt, squat: 1.6 * k, legF: [3, 0, 6], legB: [-3.4, 0, -12], ears: [-10 * k, -10 * k], mouth: jolt > 0.3 ? 'open' : null, eyes: jolt > 0.3 ? 'half' : null,
  });
}
// Her bow to the Maiden after a fight: the naginata upright beside her, her free hand at her
// chest, a deep, slow bow with her eyes closed, and back up.
function bowing(p) {
  const k = soft(seg(p, 0.1, 0.4)) * (1 - soft(seg(p, 0.72, 0.95)));
  return pose({ pole: 0.05, hand: [0.4, 0.6 * k], free: [2.2 * k, -3 * k], tilt: 34 * k, hy: 0.6 * k, ears: [-6 * k, -6 * k], eyes: k > 0.3 ? 'blink' : null, legF: [1.2, 0, 2], legB: [-1.2, 0, -2] });
}

// ---------- Following (as the doll does: a spring per number, a touch under-damped) ----------
const FOLLOW = { k: 300, damp: 0.78 };
function follow(st, target, dt) {
  if (!st.P) return (st.P = structuredClone(target));
  const c = 2 * Math.sqrt(FOLLOW.k) * FOLLOW.damp;
  const n = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / n;
  const step = (x, v, to) => {
    for (let i = 0; i < n; i++) {
      v += ((to - x) * FOLLOW.k - v * c) * h;
      x += v * h;
    }
    return [x, v];
  };
  const P = { ...target };
  for (const key of Object.keys(target)) {
    const to = target[key];
    const was = st.P[key];
    if (typeof to === 'number' && typeof was === 'number') {
      [P[key], st.V[key]] = step(was, st.V[key] ?? 0, to);
    } else if (Array.isArray(to) && Array.isArray(was) && to.length === was.length) {
      const vs = (st.V[key] ??= to.map(() => 0));
      P[key] = to.map((t, i) => {
        const [x, v] = step(was[i], vs[i], t);
        vs[i] = v;
        return x;
      });
    }
  }
  st.P = P;
  return P;
}
const q = (v) => Math.round(v * 4) / 4;
const deg2 = (v) => Math.round(v / 2) * 2;
const STATE = new WeakMap();

export function drawKitsune(ctx, world, k, cam, time) {
  if (!k?.body) return;
  let st = STATE.get(k);
  if (!st) STATE.set(k, (st = { last: time, P: null, V: {}, walk: 0 }));
  const dt = Math.max(0, Math.min(0.1, time - st.last));
  st.last = time;
  const a = k.act;
  let p;
  if (a) {
    const u = clamp01((world.now - a.t0) / a.dur);
    p = { thrust: thrusting, sweep: sweeping, rising, twin: twinning, call: calling, block: blocking, bow: bowing }[a.kind]?.(u) ?? standing(time);
  } else if (k.moving) {
    st.walk += dt * Math.min(1.6, Math.abs(k.vx) / 80);
    p = walking(st.walk, k.hurry);
  } else p = standing(time);
  const P = follow(st, p, dt);
  const x = k.x - cam.x;
  const y = k.y - cam.y;
  const facing = k.dir || 1;
  const rig = {
    tx: q(P.tx), by: q(P.by), hx: q(P.hx), hy: q(P.hy), tilt: deg2(P.tilt), backArm: [q(P.hand[0]), q(P.hand[1])], frontArm: [q(P.free[0]), q(P.free[1])], armSide: 1,
    frontLeg: [q(P.legF[0]), q(P.legF[1]), deg2(P.legF[2])], backLeg: [q(P.legB[0]), q(P.legB[1]), deg2(P.legB[2])], squat: q(P.squat), lift: q(P.lift),
    ears: [deg2(P.ears[0]), deg2(P.ears[1])], cape: q(P.cloth), hairWave: Math.floor((((time / 2.6) % 1) + 1) % 1 * 8), eyes: P.eyes ?? blinkOf(time),
  };
  const look = { ...KITSUNE_LOOK, mouth: P.mouth };
  // The naginata, behind her when held upright or back, in front when it's out at them.
  const front = Math.abs(P.pole) > 0.9;
  const pole = (c, hand, flip) => paintNaginata(c, hand, flip, P.pole, P.grip);
  drawPosed(ctx, look, Math.round(x * 2) / 2, Math.round(y * 2) / 2, rig, { scale: SCALE, facing, under: front ? null : pole, over: front ? pole : null });
  // A wisp of spirit light at the tip of her tail.
  fxSprite(ctx, 'celspiritorb', x - facing * 15 * SCALE, y - 17 * SCALE + Math.sin(time * 3) * 1.2, { t: time, rot: -Math.PI / 2, scale: 0.12, alpha: 0.8 });
}

// Slow blinks: calm.
function blinkOf(t) {
  const b = (t * 0.28) % 1;
  return b < 0.015 ? 'blink' : b < 0.03 ? 'half' : 'open';
}

// The naginata: a lacquered vermilion haft with black bands, held at `grip` along it, angled by
// `ang` (0 up, + forward), and a long curved silver blade with a white edge and a red tassel at
// its collar. Drawn in the hero's scaled space, so it's in her body pixels.
const HAFT = 50;
const BLADE = 15;
function paintNaginata(c, hand, flip, ang, grip) {
  c.save();
  c.translate(hand[0], hand[1]);
  if (flip) c.scale(-1, 1);
  c.rotate(ang);
  c.scale(SCALE, SCALE);
  const top = -HAFT * (1 - grip);
  const bot = HAFT * grip;
  c.lineCap = 'round';
  c.strokeStyle = '#4a1a1a';
  c.lineWidth = 2.6;
  c.beginPath();
  c.moveTo(0, bot);
  c.lineTo(0, top);
  c.stroke();
  c.strokeStyle = '#d23a2e';
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(0, bot - 0.6);
  c.lineTo(0, top + 0.6);
  c.stroke();
  c.fillStyle = '#2a1414';
  for (const at of [0.12, 0.5, 0.88]) c.fillRect(-1.3, lerp(top, bot, at) - 0.7, 2.6, 1.4);
  // The collar and tassel.
  c.fillStyle = '#e8c45a';
  c.fillRect(-1.6, top - 1.6, 3.2, 2);
  c.fillStyle = '#e0453a';
  c.beginPath();
  c.moveTo(-0.6, top);
  c.quadraticCurveTo(-4, top + 3, -3, top + 7);
  c.lineTo(-1.6, top + 6.4);
  c.quadraticCurveTo(-2, top + 3, -0.2, top + 0.6);
  c.fill();
  // The blade: curved forward, silver with a bright edge.
  c.beginPath();
  c.moveTo(-1.2, top - 1.6);
  c.quadraticCurveTo(-1.6, top - BLADE * 0.6, 1.8, top - BLADE);
  c.quadraticCurveTo(2.8, top - BLADE * 0.55, 1.4, top - 1.6);
  c.closePath();
  c.fillStyle = '#dfe6f2';
  c.fill();
  c.strokeStyle = '#7d8aa6';
  c.lineWidth = 0.5;
  c.stroke();
  c.strokeStyle = '#ffffff';
  c.lineWidth = 0.7;
  c.beginPath();
  c.moveTo(1.2, top - 2.4);
  c.quadraticCurveTo(2.4, top - BLADE * 0.55, 1.7, top - BLADE + 1);
  c.stroke();
  c.restore();
}

export { KMOVES, CALL };
