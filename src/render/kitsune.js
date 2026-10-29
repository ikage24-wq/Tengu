// Draws the Shrine Maiden's kitsune shrine guardian (world/kitsune.js). She's built on the player
// character (the hero's body and drawing, hero.js drawPosed), so she belongs in the game's look,
// with a rig and animations of her own on top:
//   - her look, "Silver Moon" (the player's pick), in new parts drawn for her: a long silver-white
//     hime cut, tall fox ears tipped vermilion, a great fox tail dipped vermilion, amber eyes, and
//     a shrine maiden's dress (white kosode, scarlet hakama, tabi and zori); a naginata in her hand;
//   - she's drawn a good deal bigger than the Maiden (the whole figure scaled, never stretched);
//   - her rig: every pose number rides a spring to the next (a touch under-damped, so a quick move
//     overshoots a hair and settles), and over that her secondary motion runs on springs of its
//     own, driven by how she moves: her tail lags, lashes and swishes (swing and curl), her ears
//     twitch and pin back, her hair and sleeves trail, her body sways at the hip;
//   - her animations, all her own: a calm guard stance that breathes, with idle acting (a glance
//     back at the Maiden, a hand tucking her hair behind an ear, rolling the naginata in her grip,
//     her tail curling round in front of her feet), a long gliding stride, a run with the tail
//     streaming, and her naginata moves, the Fox-Fire Call, the guard and the bow, each with
//     anticipation, a committed strike, follow-through and a settle.
import { drawPosed } from './hero.js';
import { KMOVES, CALL } from '../world/kitsune.js';

export const KITSUNE_LOOK = {
  hairStyle: 'hime', hairColor: '#f4f2ff', hairTip: '#ffb8ae', earStyle: 'fox', earTip: '#ff6a52', tail: 'fox', tailTip: '#ff6a52',
  skinTone: '#fff0e6', eyeColor: '#f0a53a', eyeStyle: 'sleepy', browStyle: 'thin', face: 'cool', outfit: 'miko', outfitColor: '#ffffff', marks: ['kitsune'],
};
// She's big: the whole figure scaled up (never stretched).
const SCALE = 1.45;
const TAU = Math.PI * 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const ease = (t) => 1 - (1 - t) ** 3;
const soft = (t) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t));
const lerp = (a, b, t) => a + (b - a) * t;
const bump = (p, a, b) => (p < a || p > b ? 0 : Math.sin(((p - a) / (b - a)) * Math.PI));
// A little overshoot past 1 that settles back (for strikes that commit).
const overshoot = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2);

// ---------- Her poses ----------
// A pose, facing right (body px of the hero's frame, before she's scaled up):
//   pole, grip      the naginata's angle (radians: 0 straight up, + tipping forward) and where
//                   along the haft her hand is (0 butt, 1 blade)
//   hand, free      where her right (naginata) hand and left hand reach, from rest
//   legF, legB      each foot's [ahead, up (negative), tilt]; squat how low she sinks; lift a hop
//   tx, by, hx, hy  the hips' sway, the body's bob, the head's offset; tilt the lean (degrees)
//   ears            her ears' turn [near, far] (degrees: - pricked forward, + laid back)
//   tail, curl      her tail's swing and curl (degrees: - up and over, + down and back)
//   cloth           how the robes and sleeves swing; mouth, eyes, brows the face
const REST = {
  pole: 0.1, grip: 0.3, hand: [0.6, 0], free: [-0.4, 0.4], legF: [1.4, 0, 2], legB: [-1.4, 0, -2], squat: 0, lift: 0, tx: 0, by: 0, hx: 0, hy: 0, tilt: 0,
  ears: [0, 0], tail: 0, curl: 0, cloth: 0, mouth: null, eyes: null, brows: null,
};
const pose = (o) => ({ ...REST, ...o });

// ---------- Standing, and her idle acting ----------
// The guard stance: tall and still, the naginata upright at her side, her weight on the back foot,
// breathing slow; her tail swishes in a lazy S and an ear flicks now and then. Every few seconds
// she does one small thing (her `bit`, `u` 0-1 through it).
function standing(t, bit, u) {
  const breath = Math.sin(t * 1.4);
  const swish = Math.sin(t * 0.9);
  const flick = Math.max(0, Math.sin(t * 1.7 + 1) - 0.9) * 10;
  const base = {
    by: 0.3 * breath, hy: 0.25 * breath, tilt: 1.2 * breath, tx: -0.3, legF: [1.6, 0, 4], legB: [-1.8, 0, -4],
    free: [-0.6, 0.6 + 0.3 * breath], tail: 6 * swish, curl: -18 + 10 * Math.sin(t * 0.9 + 0.8), ears: [flick * 3, flick * 1.5], cloth: Math.sin(t * 1.1) * 0.8,
  };
  const k = soft(seg(u, 0, 0.25)) * (1 - soft(seg(u, 0.75, 1)));
  if (bit === 'glance') {
    // A glance back over her shoulder at the Maiden, one ear turning to her, a small nod.
    return pose({ ...base, hx: -1.6 * k, hy: 0.3 * k + 0.4 * bump(u, 0.45, 0.6), tilt: base.tilt - 3 * k, ears: [base.ears[0] + 14 * k, base.ears[1] - 6 * k], eyes: k > 0.5 && u > 0.5 && u < 0.58 ? 'blink' : null });
  }
  if (bit === 'hair') {
    // Her free hand tucks her hair back behind her ear, her head tipping into it, eyes half shut.
    return pose({ ...base, free: [lerp(-0.6, 3.4, k), lerp(0.6, -10.6, k)], hx: 0.4 * k, hy: -0.2 * k, tilt: base.tilt + 4 * k, ears: [base.ears[0] - 8 * k, base.ears[1]], eyes: k > 0.5 ? 'half' : null });
  }
  if (bit === 'grip') {
    // She rolls the naginata in her hand: it tips out, turns, and comes back upright with a click.
    const roll = Math.sin(seg(u, 0.15, 0.85) * TAU);
    return pose({ ...base, pole: 0.1 + 0.55 * roll * k, hand: [0.6 + 1.4 * k, -1.2 * k], hy: base.hy + 0.4 * k, eyes: k > 0.4 ? 'half' : null, tail: base.tail + 10 * roll * k });
  }
  if (bit === 'tail') {
    // Her tail curls right round in front of her feet and back, slow and pleased; ears soft.
    return pose({ ...base, tail: base.tail + 40 * k, curl: base.curl + 60 * k, ears: [base.ears[0] + 8 * k, base.ears[1] + 8 * k], eyes: k > 0.6 ? 'happy' : null, hy: base.hy + 0.3 * k });
  }
  return pose(base);
}
const BITS = ['glance', 'hair', 'grip', 'tail'];
const BIT_LEN = { glance: 2.2, hair: 2.4, grip: 1.8, tail: 2.8 };

// Walking: a long gliding stride (the hakama hides her legs, so she seems to glide), hips swaying,
// the naginata carried slanted back over her shoulder and bobbing with her steps, her tail swinging
// against her hips, ears forward.
function walking(ph) {
  const s = Math.sin(ph);
  const c = Math.cos(ph);
  return pose({
    legF: [1.4 + 3.4 * s, -1.6 * Math.max(0, c), 14 * s], legB: [-1.4 - 3.4 * s, -1.6 * Math.max(0, -c), -14 * s], by: -0.5 * Math.abs(c), tx: 0.8 * s, tilt: 3 + 1.4 * Math.abs(c),
    pole: -0.5 + 0.06 * c, grip: 0.4, hand: [0.2, -0.8 + 0.4 * c], free: [1.6 * -s, 0.8], tail: -10 * s + 8, curl: -10 - 8 * c, ears: [-6, -4], cloth: -1.4 - 1.2 * s,
  });
}
// Running (hurrying into place): leaning hard, long low strides, the naginata trailing low behind
// her, ears laid back, tail streaming straight out behind.
function running(ph) {
  const s = Math.sin(ph);
  const c = Math.cos(ph);
  return pose({
    legF: [2 + 4.4 * s, -2.6 * Math.max(0, c), 24 * s], legB: [-2 - 4.4 * s, -2.6 * Math.max(0, -c), -24 * s], by: -1 * Math.abs(c), lift: 1.2 * Math.abs(c), tilt: 16, tx: 1,
    pole: -1.25, grip: 0.5, hand: [-2.4, 1.6], free: [2.6 * -s, -0.4], tail: 32 + 4 * s, curl: 10, ears: [18, 14], cloth: -4 - s, mouth: null,
  });
}

// ---------- Her moves (KMOVES in world/kitsune.js) ----------

// Thrust: she slides back onto her back foot drawing the naginata level at her hip, eyes narrowing,
// tail low and still; then drives it straight out in one long committed lunge (it lands at 0.42),
// the tail lashing out behind for balance, holds the line, and draws it back.
function thrusting(p) {
  const draw = soft(seg(p, 0, 0.32));
  const drive = overshoot(seg(p, 0.33, 0.46));
  const back = soft(seg(p, 0.7, 1));
  const k = drive * (1 - back);
  return pose({
    pole: lerp(0.1, 1.55, soft(seg(p, 0, 0.24))) * (1 - back) + 0.1 * back, grip: 0.28, hand: [lerp(0.6, -3.8, draw) * (1 - drive) + 7.4 * k, lerp(0, 4.4, draw) * (1 - back)],
    free: [lerp(-0.4, -3.4, draw) + 4.6 * k, lerp(0.4, 2.4, draw) - 1.4 * k], tilt: -7 * draw * (1 - drive) + 19 * k, tx: -1.2 * draw * (1 - drive) + 2.4 * k, squat: 2 * draw * (1 - back),
    legF: [lerp(1.4, 2.6, draw) + 4.2 * k, 0, 8], legB: [lerp(-1.4, -3.4, draw) - 2.4 * k, 0, -14], cloth: 2 * draw - 4 * k,
    tail: 14 * draw * (1 - drive) - 26 * k, curl: -6 * draw + 30 * k, ears: [-6 * draw + 22 * k, -4 * draw + 18 * k],
    mouth: k > 0.4 ? 'open' : null, eyes: draw > 0.4 && k < 0.3 ? 'half' : null, brows: k > 0.3 || draw > 0.4 ? 'knit' : null,
  });
}
// Sweep: she winds the blade back low behind her, coiling at the hips, then unwinds into a wide
// low sweep through everything in front (landing at 0.5), the tail whipping the other way, and
// carries it right through and round to the guard.
function sweeping(p) {
  const wind = soft(seg(p, 0, 0.36));
  const cut = overshoot(seg(p, 0.37, 0.56));
  const back = soft(seg(p, 0.76, 1));
  const on = 1 - back;
  return pose({
    pole: lerp(lerp(0.1, -2.1, wind), 1.85, cut) * on + 0.1 * back, grip: 0.28, hand: [lerp(lerp(0.6, -3, wind), 5, cut) * on + 0.6 * back, lerp(0, 2.6, wind) * on],
    free: [lerp(-0.4, 2, wind) - 5.4 * cut * on, -1.4 * cut * on], tilt: -9 * wind * (1 - cut) + 15 * cut * on, tx: -1.4 * wind * (1 - cut) + 2 * cut * on, squat: 2.4 * Math.max(wind, cut) * on,
    legF: [3.2 + 1.6 * cut, 0, 10], legB: [-3.6, 0, -18], cloth: 3 * wind - 5 * cut * on,
    tail: 22 * wind * (1 - cut) - 30 * cut * on, curl: 20 * wind - 30 * cut * on, ears: [16 * cut * on, 12 * cut * on],
    mouth: cut > 0.3 && back < 0.5 ? 'open' : null, brows: 'knit', eyes: wind > 0.4 && cut < 0.3 ? 'half' : null,
  });
}
// Rising Cut: she drops low with the blade down in front, then cuts up and over her head rising
// onto her toes (it lands at 0.46, throwing it up), her tail and hair flung up after it, and
// settles back down with the blade upright.
function risingCut(p) {
  const low = soft(seg(p, 0, 0.32));
  const up = overshoot(seg(p, 0.33, 0.5));
  const back = soft(seg(p, 0.74, 1));
  const on = 1 - back;
  return pose({
    pole: lerp(lerp(0.1, 2.15, low), -0.35, up) * on + 0.1 * back, grip: 0.3, hand: [lerp(lerp(0.6, 2.6, low), 1, up), lerp(lerp(0, 3.4, low), -9.6, up) * on],
    free: [1.2, lerp(lerp(0.4, 1.4, low), -7, up) * on], tilt: 12 * low * (1 - up) - 9 * up * on, squat: 2.6 * low * (1 - up), lift: 5 * up * on,
    legF: [2.6, -2 * up * on, 12], legB: [-2.4, -1.4 * up * on, -10], cloth: 4 * up * on,
    tail: 10 * low * (1 - up) - 40 * up * on, curl: -30 * up * on, ears: [-12 * up * on, -10 * up * on],
    mouth: up > 0.3 && back < 0.5 ? 'open' : null, brows: low > 0.3 ? 'knit' : null,
  });
}
// Twin Strike: two quick thrusts, high then low (at 0.3 and 0.62), a hop of the feet with each and
// a flick of the tail.
function twinning(p) {
  const a = bump(p, 0.16, 0.44);
  const b = bump(p, 0.48, 0.78);
  const set = soft(seg(p, 0, 0.14)) * (1 - soft(seg(p, 0.82, 1)));
  return pose({
    pole: lerp(0.1, lerp(1.35, 1.8, seg(p, 0.45, 0.55)), set), grip: 0.28, hand: [-1.8 * set + 7 * a + 7 * b, -2.4 * a + 3.4 * b], free: [-1 + 2.6 * (a + b), 1],
    tilt: 4 * set + 11 * (a + b), tx: 1.8 * (a + b), squat: 1.4 * set, lift: 1.2 * (a + b), legF: [2.6 + 1.8 * b, 0, 8], legB: [-2.8, 0, -14],
    tail: -18 * a + 18 * b, curl: 12 * (a - b), ears: [14 * (a + b), 12 * (a + b)], mouth: a + b > 0.6 ? 'open' : null, brows: 'knit',
  });
}
// Fox-Fire Call: she raises the naginata high in both hands, eyes closed, ears up and tail rising,
// then drives its butt down into the ground (at 0.5) as the ring goes out, and stands tall over
// it, tail fanned up behind her.
function calling(p) {
  const raise = soft(seg(p, 0, 0.38));
  const slam = ease(seg(p, 0.42, 0.52));
  const settle = soft(seg(p, 0.8, 1));
  return pose({
    pole: -0.04, grip: 0.62, hand: [0.8, lerp(0, -10, raise) * (1 - slam) + 2.4 * slam * (1 - settle)], free: [1.8, lerp(0.4, -9, raise) * (1 - slam) + 1.4 * slam],
    lift: 2.4 * raise * (1 - slam), squat: 2 * slam * (1 - settle), tilt: -4 * raise * (1 - slam) + 7 * slam * (1 - settle), cloth: 3 * slam * (1 - settle),
    legF: [2.8, 0, 6], legB: [-2.8, 0, -6], tail: -30 * raise + 10 * slam * (1 - settle), curl: -20 * raise, ears: [-16 * raise, -14 * raise],
    mouth: slam > 0.3 && settle < 0.5 ? 'open' : null, eyes: raise > 0.5 && slam < 0.3 ? 'blink' : null, brows: slam > 0.3 ? 'knit' : null,
  });
}
// Guard: she whips the haft up level across her body in both hands and braces; the blow jolts her
// back a step, tail bristling, ears pinned; then she shakes it off.
function blocking(p) {
  const k = ease(seg(p, 0, 0.16)) * (1 - soft(seg(p, 0.7, 1)));
  const jolt = bump(p, 0.14, 0.4);
  return pose({
    pole: lerp(0.1, 1.57, k), grip: 0.5, hand: [lerp(0.6, 3.2, k) - 1.6 * jolt, lerp(0, -5.4, k)], free: [lerp(-0.4, 5, k) - 1.6 * jolt, lerp(0.4, -5.4, k)],
    tilt: 7 * k - 10 * jolt, tx: -1.6 * jolt, squat: 2 * k, legF: [3.2, 0, 8], legB: [-3.6, 0, -14], tail: 20 * jolt - 10 * k, curl: 24 * jolt, ears: [24 * k, 22 * k],
    mouth: jolt > 0.3 ? 'open' : null, eyes: jolt > 0.3 ? 'half' : null, brows: 'knit',
  });
}
// Her bow to the Maiden after a fight: the naginata upright beside her, her free hand to her
// chest, a deep, slow bow with eyes closed (her tail sweeping low behind), and back up with a
// small smile.
function bowing(p) {
  const k = soft(seg(p, 0.1, 0.42)) * (1 - soft(seg(p, 0.7, 0.95)));
  const smile = bump(p, 0.75, 1);
  return pose({
    pole: 0.04, hand: [0.6, 0.8 * k], free: [2.6 * k, -3.4 * k], tilt: 32 * k, hy: 0.8 * k, by: 0.6 * k, ears: [10 * k, 8 * k], tail: 14 * k, curl: -24 * k,
    eyes: k > 0.3 ? 'blink' : smile > 0.3 ? 'happy' : null, legF: [1.2, 0, 2], legB: [-1.2, 0, -2],
  });
}

// ---------- Her rig ----------
// Every number of her pose rides a spring to its target (a touch under-damped, so a quick move
// overshoots a hair and settles).
const FOLLOW = { k: 240, damp: 0.74 };
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
    if (typeof to === 'number' && typeof was === 'number') [P[key], st.V[key]] = step(was, st.V[key] ?? 0, to);
    else if (Array.isArray(to) && Array.isArray(was) && to.length === was.length) {
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
// A damped spring toward `to` (stiffness k, damping c), for her secondary motion.
function spring(x, v, to, k, c, dt) {
  const nv = v + ((to - x) * k - v * c) * dt;
  return [x + nv * dt, nv];
}
const q = (v) => Math.round(v * 4) / 4;
const deg2 = (v) => Math.round(v / 2) * 2;
const STATE = new WeakMap();

export function drawKitsune(ctx, world, k, cam, time) {
  if (!k?.body) return;
  let st = STATE.get(k);
  if (!st) {
    st = { last: time, P: null, V: {}, walk: 0, vx: 0, tail: 0, tailV: 0, curl: 0, curlV: 0, earN: 0, earNV: 0, earF: 0, earFV: 0, hair: 0, hairV: 0, tip: 0, tipV: 0, sway: 0, swayV: 0, bit: null, bitAt: time + 3 };
    STATE.set(k, st);
  }
  const dt = Math.max(0, Math.min(0.05, time - st.last));
  st.last = time;
  const a = k.act;
  // Her idle acting: every few seconds, standing about, one small thing (never the same twice).
  if (a || k.moving) st.bitAt = Math.max(st.bitAt, time + 2.5);
  if (!a && !k.moving && time >= st.bitAt) {
    const pick = BITS.filter((b) => b !== st.bit?.kind);
    st.bit = { kind: pick[Math.floor(Math.random() * pick.length)], t0: time };
    st.bitAt = time + BIT_LEN[st.bit.kind] + 3 + Math.random() * 3;
  }
  if (st.bit && (a || k.moving || time - st.bit.t0 > BIT_LEN[st.bit.kind])) st.bit = null;
  let p;
  if (a) {
    const u = clamp01((world.now - a.t0) / a.dur);
    p = { thrust: thrusting, sweep: sweeping, rising: risingCut, twin: twinning, call: calling, block: blocking, bow: bowing }[a.kind]?.(u) ?? standing(time, null, 0);
  } else if (k.moving) {
    st.walk += dt * Math.min(1.8, Math.abs(k.vx) / 80) * (k.hurry ? 11 : 6.6);
    p = k.hurry ? running(st.walk) : walking(st.walk);
  } else p = st.bit ? standing(time, st.bit.kind, (time - st.bit.t0) / BIT_LEN[st.bit.kind]) : standing(time, null, 0);
  // Her moods colour whatever she's doing (stronger when she's free to show them).
  if (k.mood) p = moodOver(p, k.mood.kind, time, a ? 0.5 : 1);
  const P = follow(st, p, dt);

  // ----- Her secondary motion, driven by how she moves -----
  const dir = k.dir || 1;
  const ax = dt > 0 ? (k.vx - st.vx) / dt : 0;
  st.vx = k.vx;
  const v = (k.vx * dir) / 100; // moving forward (+) or back
  const surge = (ax * dir) / 600;
  // The tail trails behind her movement and lashes when she starts or stops; it curls by the pose.
  [st.tail, st.tailV] = spring(st.tail, st.tailV, P.tail + 18 * v + 30 * surge, 70, 7, dt);
  [st.curl, st.curlV] = spring(st.curl, st.curlV, P.curl - 10 * v, 50, 6, dt);
  // Her ears follow the pose's turn on quick springs (so a twitch flicks and settles).
  [st.earN, st.earNV] = spring(st.earN, st.earNV, P.ears[0] + 8 * v, 220, 12, dt);
  [st.earF, st.earFV] = spring(st.earF, st.earFV, P.ears[1] + 8 * v, 200, 12, dt);
  // Hair: swings after her and is thrown about by what she does.
  [st.hair, st.hairV] = spring(st.hair, st.hairV, -1.4 * v - 2 * surge + (P.lift > 2 ? -1 : 0), 60, 6, dt);
  [st.tip, st.tipV] = spring(st.tip, st.tipV, st.hair, 40, 4.5, dt);
  // Robes and sleeves sway after the hips.
  [st.sway, st.swayV] = spring(st.sway, st.swayV, P.cloth - 2 * v, 90, 8, dt);
  // She leans into a start and rocks back on a stop, and her head trails a beat behind.
  [st.lean, st.leanV] = spring(st.lean ?? 0, st.leanV ?? 0, 9 * surge + 3 * v, 110, 11, dt);
  [st.head, st.headV] = spring(st.head ?? 0, st.headV ?? 0, -1.2 * surge, 140, 12, dt);

  const x = k.x - cam.x;
  const y = k.y - cam.y;
  const brows = P.brows === 'knit' ? [[-0.2, 0.7], [-0.2, 0.7]] : null;
  const rig = {
    tx: q(P.tx), by: q(P.by), hx: q(P.hx + Math.max(-1.6, Math.min(1.6, st.head))), hy: q(P.hy), tilt: deg2(P.tilt + Math.max(-12, Math.min(12, st.lean))), backArm: [q(P.hand[0]), q(P.hand[1])], frontArm: [q(P.free[0]), q(P.free[1])], armSide: 1,
    frontLeg: [q(P.legF[0]), q(P.legF[1]), deg2(P.legF[2])], backLeg: [q(P.legB[0]), q(P.legB[1]), deg2(P.legB[2])], squat: q(P.squat), lift: q(P.lift),
    // (The drawing turns her tail the other way round from her poses' sense; and it never swings
    // down into the ground, however hard it lashes.)
    ears: [deg2(st.earN), deg2(st.earF)], tail: deg2(-Math.max(-60, Math.min(4, st.tail))), tailCurl: deg2(-Math.max(-55, Math.min(30, st.curl))), cape: q(st.sway),
    hair: q(Math.max(-3, Math.min(3, st.hair))), hairTip: q(Math.max(-4, Math.min(4, st.tip))), hairLift: Math.abs(st.hair) > 1.6 ? -1 : 0, hairWave: Math.floor((((time / 2.6) % 1) + 1) % 1 * 8),
    eyes: P.eyes ?? blinkOf(time), face: brows ? { brows } : undefined,
  };
  const look = { ...KITSUNE_LOOK, mouth: P.mouth ?? undefined };
  // The naginata goes behind her while it's upright or slung back, in front when it's out at them.
  const out = P.pole > 0.9 && P.pole < 2.8;
  const naginata = (c, hand, flip) => paintNaginata(c, hand, flip, P.pole, P.grip, st, dt, time);
  drawPosed(ctx, look, Math.round(x * 2) / 2, Math.round(y * 2) / 2, rig, { scale: SCALE, facing: dir, under: out ? null : naginata, over: out ? naginata : null });
}

// Her moods, over whatever pose she's in (`k` how strongly):
//   cross    the Maiden was hurt: ears pinned flat, brows knit, eyes narrowed, tail bristling up
//   pleased  what she was fighting went down: ears up, a quick happy swish of the tail, eyes
//            smiling a moment
//   attend   the Maiden's Blessing or Ward went up: ears pricked and turned to her, a glance back
function moodOver(p, mood, t, k) {
  if (mood === 'cross') return { ...p, ears: [p.ears[0] + 28 * k, p.ears[1] + 26 * k], brows: 'knit', eyes: p.eyes ?? 'half', tail: p.tail - 20 * k, curl: p.curl - 20 * k, mouth: p.mouth ?? 'flat' };
  if (mood === 'pleased') return { ...p, ears: [p.ears[0] - 10 * k, p.ears[1] - 8 * k], tail: p.tail + 16 * Math.sin(t * 14) * k, curl: p.curl - 14 * k, eyes: p.eyes ?? 'happy' };
  if (mood === 'attend') return { ...p, ears: [p.ears[0] + 16 * k, p.ears[1] - 10 * k], hx: p.hx - 1.4 * k, hy: p.hy + 0.3 * k };
  return p;
}

// Slow, calm blinks.
function blinkOf(t) {
  const b = (t * 0.26) % 1;
  return b < 0.014 ? 'blink' : b < 0.028 ? 'half' : 'open';
}

// ---------- The naginata ----------
// A lacquered vermilion haft with black bands and a gold butt cap, a gold collar, a long curved
// silver blade with a bright edge, and a red tassel that swings from the collar on its own spring.
// Drawn from her hand along `ang` (0 up, + forward), held at `grip` along it, in her body px.
const HAFT = 40;
const BLADE = 14;
function paintNaginata(c, hand, flip, ang, grip, st, dt, time) {
  // The tassel swings after the blade's motion.
  const swing = st.poleLast == null ? 0 : (ang - st.poleLast) / Math.max(dt, 1e-3);
  st.poleLast = ang;
  [st.tassel, st.tasselV] = spring(st.tassel ?? 0, st.tasselV ?? 0, -ang - swing * 0.08, 40, 4, dt);
  c.save();
  c.translate(hand[0], hand[1]);
  if (flip) c.scale(-1, 1);
  c.rotate(ang);
  c.scale(SCALE, SCALE);
  c.lineCap = 'round';
  const top = -HAFT * (1 - grip);
  const bot = HAFT * grip;
  for (const [w, col] of [[2.4, '#3a1212'], [1.5, '#d23a2e']]) {
    c.strokeStyle = col;
    c.lineWidth = w;
    c.beginPath();
    c.moveTo(0, bot);
    c.lineTo(0, top);
    c.stroke();
  }
  c.strokeStyle = '#ff8a7a';
  c.lineWidth = 0.4;
  c.beginPath();
  c.moveTo(-0.35, bot - 1);
  c.lineTo(-0.35, top + 1);
  c.stroke();
  c.fillStyle = '#1e0c0c';
  for (const u of [0.15, 0.5, 0.82]) c.fillRect(-1.25, lerp(top, bot, u) - 0.6, 2.5, 1.2);
  c.fillStyle = '#e8c45a';
  c.beginPath();
  c.arc(0, bot, 1.3, 0, TAU);
  c.fill();
  c.fillRect(-1.5, top - 1.8, 3, 2.2);
  // The tassel, hanging from the collar and swinging.
  c.save();
  c.translate(-0.6, top);
  c.rotate((st.tassel ?? 0) + Math.sin(time * 2.2) * 0.06);
  c.strokeStyle = '#e0453a';
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(-0.8, 3, 0, 6.4);
  c.stroke();
  c.fillStyle = '#e0453a';
  c.beginPath();
  c.moveTo(-1.4, 5.6);
  c.lineTo(1.4, 5.6);
  c.lineTo(1, 9.2);
  c.lineTo(-1, 9.2);
  c.fill();
  c.restore();
  // The blade.
  c.beginPath();
  c.moveTo(-1.1, top - 1.8);
  c.quadraticCurveTo(-1.6, top - BLADE * 0.6, 2, top - BLADE);
  c.quadraticCurveTo(2.9, top - BLADE * 0.55, 1.3, top - 1.8);
  c.closePath();
  c.fillStyle = '#e3e9f4';
  c.fill();
  c.strokeStyle = '#6f7d9a';
  c.lineWidth = 0.45;
  c.stroke();
  c.strokeStyle = '#ffffff';
  c.lineWidth = 0.6;
  c.beginPath();
  c.moveTo(1.1, top - 2.6);
  c.quadraticCurveTo(2.4, top - BLADE * 0.55, 1.8, top - BLADE + 1.2);
  c.stroke();
  c.restore();
}

export { KMOVES, CALL };
