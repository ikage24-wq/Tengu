// The Onmyoji's yuki-onna (docs/design/spirit-mage-paths.md): the second of her yokai troupe, a calm,
// aloof snow ghost, built on the player character (hero.js drawPosed) in new parts of her own
// (jobgear/troupe.js, hair.js, hero.js's yuki eyes), about the Onmyoji's own size.
//
// Her look, as the player picked it (2026-10-29): white hair in an icicle bun (ice-crystal pins
// and a snowflake) with blunt bangs, white-lashed veiled eyes, small pale blue lips, pale skin, and
// the spirit-flames kimono (white, pale blue hitodama drifting up from a hem that fades into mist,
// no feet). Her rig and animations are below (world/yuki.js runs her).
import { drawPosed, posedMouth } from './hero.js';
import { fxSprite } from './fx-sprites.js';
import { YUKI_MOVES } from '../world/yuki.js';

export const YUKI_SCALE = 1.1;
export const YUKI_LOOK = {
  hairStyle: 'yukibun', hairColor: '#f6f8ff', hairTip: '#cfe4fb', skinTone: '#f4f6ff', eyeColor: '#7ab8f0', eyeStyle: 'yukiwhiteveil', browStyle: 'none', earStyle: 'round',
  outfit: 'yukihitodama', outfitColor: '#ffffff', mouth: 'yukilips', marks: [],
};

// ======================================================================================
// Her rig and animations (world/yuki.js runs her). On the player character, in YUKI_LOOK, with
// poses and acting of her own:
//   - her bearing: still and sorrowful, hands folded in her sleeves at her breast, eyes lowered;
//     she never walks: she floats a hand's width over the ground, rising and sinking slowly, and
//     drifts after the Onmyoji leaning a little into it, her sleeves and hair trailing;
//   - her frost aura: always about her, a ring of frost on the ground under her, snowflakes
//     drifting slowly round her and a breath of cold mist; and where she drifts she leaves frost
//     on the ground (world/yuki.js, render/spirit-fx.js 'yukiprint');
//   - her moves: White Breath (she glides in and bends over the monster, a sleeve at her lips,
//     breathing out long and slow), Answer Me (she leans in face to face, head tilted, a hand to
//     its cheek; draws its soul out into her cupped hands and lets it go to the Onmyoji), Ice
//     Spikes (she bends and presses her palm to the snow), Icicle Fall (a hand raised slowly to
//     the sky and brought down), Whiteout (she rises, arms spread, head back, hair and robe
//     streaming), a lazy underhand snowball, a flick of her sleeve for the needles, and Into the
//     Mist (she melts away);
//   - her idle moods: catching a snowflake on her palm, breathing on her cold hands, looking down
//     sadly, gazing at the Onmyoji, humming with her eyes closed;
//   - and a layer of life: breath, a slow sway, hair stirring, springs on every number.

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const soft = (t) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t));
const lerp = (a, b, t) => a + (b - a) * t;
const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const TAU = Math.PI * 2;

// ---------- Her poses ----------
// lean, lift (her hover, px up); hand, free (her arms from rest); hx, hy, tilt (head); cloth; and her
// face: mouth, eyes, lid, glance, brows.
const FOLD_F = [-2.6, -3.4];
const FOLD_B = [2.4, -3.2];
const REST = { lean: 0.02, lift: 0, hand: FOLD_F, free: FOLD_B, hx: -0.2, hy: 0.4, tilt: 3, cloth: 0, mouth: 'yukilips', eyes: null, lid: 0, glance: 0, brows: 'sad' };
const pose = (o) => ({ ...REST, ...o });
const BROWS = { sad: [[0.3, -0.35], [0.3, -0.35]], calm: [[0.1, -0.05], [0.1, -0.05]], cold: [[-0.2, 0.4], [-0.2, 0.4]] };

const standing = () => pose({});
// Drifting: leaning a little into it, her arms held loose and trailing, her sleeves and robe swept
// back.
function drifting(t) {
  return pose({ lean: 0.12, hand: [-1.4, -1.6 + 0.4 * Math.sin(t * 2)], free: [0.6, -1.2], cloth: -3, hy: 0.6, tilt: 1, eyes: 'half' });
}
// White Breath: she glides in leaning into it, then bends right over the monster (head bowed to
// it), a sleeve drawn to her lips and the other hand held out low over it, and breathes out long
// and slow (from ~0.34 to ~0.84); she straightens as it ends.
function breathing(u) {
  const glide = 1 - soft(seg(u, 0.18, 0.3));
  const bend = soft(seg(u, 0.2, 0.36)) * (1 - soft(seg(u, 0.86, 1)));
  const out = soft(seg(u, 0.32, 0.4)) * (1 - soft(seg(u, 0.82, 0.9)));
  return pose({
    lean: 0.02 + 0.12 * glide + 0.17 * bend, lift: -1 * bend, hand: lerp2(lerp2(FOLD_F, [-1.4, -1.6], glide), [0.6, -10.4], bend), free: lerp2(lerp2(FOLD_B, [0.6, -1.2], glide), [6.4, -1], bend),
    hy: 0.4 + 0.6 * bend, tilt: 3 + 4 * bend, cloth: -3 * glide + 1.5 * bend, mouth: out > 0.3 ? 'yukibreath' : 'yukilips', eyes: bend > 0.4 ? 'half' : null, brows: bend > 0.4 ? 'calm' : 'sad',
  });
}
// Answer Me: she glides in and leans close, face to face, her head tipping to one side as she asks
// (0.24), a hand lifted to its cheek; then draws the soul out (0.4-0.8), that hand coming slowly
// back to her breast and the other cupped beneath it; at 0.84 she lifts her cupped hands and lets
// it go, glancing after it to the Onmyoji.
function asking(u) {
  const glide = 1 - soft(seg(u, 0.16, 0.26));
  const lean = soft(seg(u, 0.16, 0.3)) * (1 - soft(seg(u, 0.8, 0.95)));
  const cheek = soft(seg(u, 0.2, 0.32)) * (1 - soft(seg(u, 0.4, 0.62)));
  const draw = soft(seg(u, 0.4, 0.66)) * (1 - soft(seg(u, 0.8, 0.88)));
  const give = soft(seg(u, 0.8, 0.88)) * (1 - soft(seg(u, 0.93, 1)));
  const cup = Math.max(draw, give);
  const hand = lerp2(lerp2(lerp2(lerp2(FOLD_F, [-1.4, -1.6], glide), [8.6, -9.6], cheek), [2.4, -6.6], draw), [5.4, -12.6], give);
  return pose({
    lean: 0.02 + 0.1 * glide + 0.16 * lean, hand, free: lerp2(lerp2(FOLD_B, [0.6, -1.2], glide), [3.6, -5], cup),
    hx: -0.2 + 0.6 * lean, hy: 0.4 + 0.3 * lean, tilt: 3 - 13 * cheek - 4 * draw + 8 * give, glance: -1 * give, lid: 0.15 * draw,
    eyes: draw > 0.3 ? 'half' : null, brows: cheek > 0.3 ? 'calm' : 'sad', mouth: cheek > 0.4 && Math.sin(u * 60) > 0 ? 'yukibreath' : 'yukilips', cloth: -3 * glide,
  });
}
// Ice Spikes (0.44): she bends low, her sleeve swept back, and presses her palm down to the snow;
// holds it there, head lifting to watch the spikes go; then rises.
function spiking(u) {
  const down = soft(seg(u, 0, 0.38));
  const press = soft(seg(u, 0.36, 0.46));
  const rise = soft(seg(u, 0.74, 1));
  const k = down * (1 - rise);
  return pose({
    lean: 0.02 + 0.22 * k, lift: -3 * k, hand: lerp2(lerp2(FOLD_F, [-4, -4], down * (1 - press)), [6.6, 4.4], press * (1 - rise)), free: lerp2(FOLD_B, [-3, -6], k),
    hy: 0.4 + 0.6 * k - 0.8 * press * (1 - rise), tilt: 3 + 6 * k - 8 * press * (1 - rise), cloth: 3 * k - 4 * press * (1 - rise), brows: 'cold', eyes: down > 0.3 && press < 0.5 ? 'half' : null,
  });
}
// Icicle Fall (0.5): one hand raised slowly to the sky, eyes lifting with it; brought down sharply
// as the icicles fall.
function icicling(u) {
  const up = soft(seg(u, 0, 0.38));
  const down = soft(seg(u, 0.4, 0.5));
  const rest = soft(seg(u, 0.72, 1));
  return pose({
    hand: lerp2(lerp2(FOLD_F, [2, -16], up), [7, -2], down * (1 - rest)), lift: 2 * up * (1 - down), hy: 0.4 - 1 * up * (1 - down), tilt: 3 - 6 * up * (1 - down),
    brows: 'cold', eyes: up > 0.5 && down < 0.3 ? 'half' : null, cloth: -2 * up + 3 * down * (1 - rest),
  });
}
// Whiteout: she rises high, spreading her arms wide, her head tipping back and eyes closing, her
// hair and robe streaming in the storm; she sinks back as it dies.
function whiteouting(u) {
  const k = soft(seg(u, 0, 0.22)) * (1 - soft(seg(u, 0.88, 1)));
  return pose({
    lift: 12 * k + 1.4 * Math.sin(u * 26) * k, hand: lerp2(FOLD_F, [7, -10], k), free: lerp2(FOLD_B, [-6, -10], k), hy: 0.4 - 1.4 * k, tilt: 3 - 11 * k, cloth: -5 * k + 2.4 * Math.sin(u * 22) * k,
    eyes: k > 0.5 ? 'blink' : null, mouth: k > 0.5 ? 'yukibreath' : 'yukilips', brows: 'calm',
  });
}
// Snowball (0.42): a lazy scoop down at her side, then an underhand toss, unbothered, eyes half shut.
function snowballing(u) {
  const scoop = soft(seg(u, 0, 0.3));
  const toss = soft(seg(u, 0.32, 0.46));
  const rest = soft(seg(u, 0.66, 1));
  return pose({
    lean: 0.02 + 0.1 * scoop * (1 - toss) + 0.04 * toss * (1 - rest), lift: -1 * scoop * (1 - toss), hand: lerp2(lerp2(FOLD_F, [-2, 3], scoop), [8, -7.4], toss * (1 - rest)),
    hy: 0.4 + 0.6 * scoop * (1 - toss), tilt: 3 + 5 * scoop * (1 - toss) - 3 * toss * (1 - rest), cloth: 1.5 * scoop - 3 * toss * (1 - rest), eyes: 'half', brows: 'calm',
  });
}
// Ice Needles (0.42): her sleeve swept back, then flicked out at them, fingers spread.
function needling(u) {
  const back = soft(seg(u, 0, 0.34));
  const flick = soft(seg(u, 0.36, 0.46));
  const rest = soft(seg(u, 0.7, 1));
  return pose({
    lean: 0.02 - 0.06 * back * (1 - flick) + 0.1 * flick * (1 - rest), hand: lerp2(lerp2(FOLD_F, [-5, -6], back), [8, -5], flick * (1 - rest)),
    cloth: 2 * back - 4 * flick * (1 - rest), brows: 'cold', eyes: flick > 0.3 && rest < 0.5 ? null : 'half', tilt: 3 - 3 * flick * (1 - rest),
  });
}
// Into the Mist: she lifts, her sleeves rising round her, as she melts away (the fade is drawn
// below), and settles again as she gathers.
function misting(u) {
  const k = soft(seg(u, 0, 0.3)) * (1 - soft(seg(u, 0.7, 1)));
  return pose({ lift: 5 * k, hand: lerp2(FOLD_F, [-1, -8], k), free: lerp2(FOLD_B, [3, -8], k), eyes: 'blink', cloth: -4 * k, tilt: 3 - 4 * k });
}
// (Her part in the Onmyoji's Troupe Combo: her whiteout, freezing them all.)
const MOVES = { combo: whiteouting, breath: breathing, ask: asking, spikes: spiking, icicle: icicling, whiteout: whiteouting, snowball: snowballing, needles: needling, mist: misting };

// Her idle moods: how long each lasts and the pose `u` through it.
export const YUKI_IDLES = {
  catch: [3.2, (u) => {
    const k = soft(seg(u, 0, 0.25)) * (1 - soft(seg(u, 0.8, 1)));
    return pose({ hand: lerp2(FOLD_F, [4, -6], k), hy: 0.4 + 0.6 * k, tilt: 3 + 4 * k, eyes: k > 0.5 ? 'half' : null, brows: 'calm', glance: 0 });
  }],
  hands: [3, (u) => {
    const k = soft(seg(u, 0, 0.25)) * (1 - soft(seg(u, 0.78, 1)));
    return pose({ hand: lerp2(FOLD_F, [0.6, -10.4], k), free: lerp2(FOLD_B, [2.6, -10], k), mouth: k > 0.5 && Math.sin(u * 18) > 0 ? 'yukibreath' : 'yukilips', eyes: k > 0.5 ? 'blink' : null, brows: 'calm' });
  }],
  sorrow: [3.4, (u) => {
    const k = soft(seg(u, 0, 0.25)) * (1 - soft(seg(u, 0.78, 1)));
    return pose({ hy: 0.4 + 1 * k, tilt: 3 + 6 * k, lean: 0.02 + 0.04 * k, eyes: 'half', brows: 'sad' });
  }],
  gaze: [2.8, (u) => {
    const k = soft(seg(u, 0, 0.2)) * (1 - soft(seg(u, 0.8, 1)));
    return pose({ glance: -k, hx: -0.2 - 1 * k, tilt: 3 - 3 * k, brows: 'calm' });
  }],
  hum: [3.4, (u) => pose({ eyes: 'blink', tilt: 3 + 3 * Math.sin(u * TAU * 1.5), hx: -0.2 + 0.5 * Math.sin(u * TAU * 1.5), brows: 'calm' })],
};
const IDLE_KEYS = Object.keys(YUKI_IDLES);

// ---------- Her rig ----------
const SLOW = { k: 90, damp: 0.9 };
const QUICK = { k: 200, damp: 0.85 };
function follow(st, target, dt) {
  if (!st.P) return (st.P = structuredClone(target));
  const n = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / n;
  const P = { ...target };
  for (const key of Object.keys(target)) {
    const { k, damp } = key === 'hand' || key === 'free' ? QUICK : SLOW;
    const c = 2 * Math.sqrt(k) * damp;
    const step = (x, v, to) => {
      for (let i = 0; i < n; i++) {
        v += ((to - x) * k - v * c) * h;
        x += v * h;
      }
      return [x, v];
    };
    const to = target[key];
    const was = st.P[key];
    if (typeof to === 'number' && typeof was === 'number') [P[key], st.V[key]] = step(was, st.V[key] ?? 0, to);
    else if (Array.isArray(to) && Array.isArray(was) && to.length === was.length && typeof to[0] === 'number') {
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
function spring(x, v, to, k, c, dt) {
  const nv = v + ((to - x) * k - v * c) * dt;
  return [x + nv * dt, nv];
}
const q = (v) => Math.round(v * 8) / 8;
const deg = (v) => Math.round(v);
const STATE = new WeakMap();

// Her frost aura: frost on the ground under her, snowflakes drifting slowly round her (some
// behind her, some in front), and a cold mist.
function aura(ctx, x, y, time, layer, k) {
  if (layer === 'back') {
    fxSprite(ctx, 'celringice', x, y, { frame: 2, scale: 0.55, sy: 0.3, alpha: 0.55 * k });
    fxSprite(ctx, 'celmotes', x, y + 2, { t: time * 0.6, scale: 0.6, alpha: 0.45 * k });
  }
  for (let i = 0; i < 6; i++) {
    const a = time * 0.5 + (i / 6) * TAU;
    const front = Math.sin(a) > 0;
    if ((layer === 'front') !== front) continue;
    const fx0 = x + Math.cos(a) * 20;
    const fy = y - 14 - ((time * 9 + i * 13) % 52);
    fxSprite(ctx, 'celsnowflake', fx0, fy, { t: time + i, scale: 0.09 + 0.03 * (i % 3), alpha: 0.85 * k });
  }
}

export function drawYukiCompanion(ctx, world, k, cam, time, layer = 'back') {
  if (!k?.body) return;
  const x = k.x - cam.x;
  const y = k.y - cam.y;
  let st = STATE.get(k);
  if (!st) {
    st = { last: time, P: null, V: {}, idle: null, idleAt: time + 2, aura: 1 };
    STATE.set(k, st);
  }
  if (layer === 'front') {
    aura(ctx, x, y, time, 'front', st.fade ?? 1);
    return;
  }
  const dt = Math.max(0, Math.min(0.05, time - st.last));
  st.last = time;
  const a = k.act;
  if (a || k.moving) st.idleAt = Math.max(st.idleAt, time + 2);
  if (k.idle) st.idle = { kind: k.idle, t0: k.idleT0 ?? 0 };
  else if (!a && !k.moving && time >= st.idleAt) {
    const pick = IDLE_KEYS.filter((b) => b !== st.idle?.kind);
    st.idle = { kind: pick[Math.floor(Math.random() * pick.length)], t0: time };
    st.idleAt = time + YUKI_IDLES[st.idle.kind][0] + 2 + Math.random() * 2;
  }
  if (!k.idle && st.idle && (a || k.moving || time - st.idle.t0 > YUKI_IDLES[st.idle.kind][0])) st.idle = null;
  const u = a ? clamp01((world.now - a.t0) / a.dur) : 0;
  let p;
  if (a && MOVES[a.kind]) p = MOVES[a.kind](u);
  else if (k.moving) p = drifting(time);
  else if (st.idle) p = YUKI_IDLES[st.idle.kind][1](clamp01((time - st.idle.t0) / YUKI_IDLES[st.idle.kind][0]));
  else p = standing();
  if (k.mood?.kind === 'pleased' && !a) p = { ...p, eyes: 'half', brows: 'calm', hy: p.hy - 0.3 };
  const P = follow(st, p, dt);

  // The life layer: her hover rising and sinking, a breath, a slow sway, her hair and robe stirring.
  const hover = 3 + 1.2 * Math.sin(time * 1.3);
  const breath = Math.sin(time * 0.9);
  const sway = Math.sin(time * 0.5);
  const dir = k.dir || 1;
  const v = (k.vx * dir) / 100;
  const S = (name, to, kk, c) => {
    [st[name], st[name + 'V']] = spring(st[name] ?? to, st[name + 'V'] ?? 0, to, kk, c, dt);
    return st[name];
  };
  const hair = S('hair', -1.6 * v + 0.6 * Math.sin(time * 0.7) + (a?.kind === 'whiteout' ? -2.8 * Math.sin(time * 6) : 0), 40, 5);
  const tip = S('tip', hair + 0.5 * Math.sin(time * 1.3), 30, 4);
  const robe = S('robe', P.cloth + 1 * Math.sin(time * 0.8) - 2.4 * v, 60, 6);
  // Into the Mist: she melts away and gathers again (gone in between).
  const fade = a?.kind === 'mist' ? (u < 0.5 ? 1 - soft(seg(u, 0.06, 0.3)) : soft(seg(u, 0.7, 0.94))) : 1;
  st.fade = fade;
  if (fade <= 0.02) return;
  ctx.save();
  ctx.globalAlpha *= fade;
  aura(ctx, x, y, time, 'back', fade);
  const rig = {
    tx: q(0.3 * sway), by: q(0.25 * breath), hx: q(P.hx + 0.2 * sway), hy: q(P.hy + 0.2 * breath), tilt: deg(P.tilt + 1.5 * sway),
    frontArm: [q(P.hand[0]), q(P.hand[1] + 0.25 * breath)], backArm: [q(P.free[0]), q(P.free[1] + 0.25 * breath)], armSide: 1,
    frontLeg: [0.8, 0, 0], backLeg: [-0.8, 0, 0], squat: 0, cape: q(robe),
    hair: q(Math.max(-3, Math.min(3, hair))), hairTip: q(Math.max(-4, Math.min(4, tip))), hairLift: Math.abs(hair) > 1.6 || P.lift > 5 ? -1 : 0, hairWave: Math.floor((((time / 2.2) % 1) + 1) % 1 * 8),
    eyes: P.eyes ?? yukiBlink(time), face: { brows: BROWS[P.brows] ?? BROWS.sad, glance: q(P.glance) },
  };
  const look = { ...YUKI_LOOK, mouth: P.mouth, lid: q(P.lid) };
  const opts = { scale: YUKI_SCALE, facing: dir, hold: 'front', lean: { tilt: P.lean + 0.01 * sway, lunge: 0, lift: hover + P.lift } };
  drawPosed(ctx, look, Math.round(x * 4) / 4, Math.round(y * 4) / 4, rig, opts);
  // Where her lips are (in the world), for her breath and her question to come from.
  const [mx, my] = posedMouth(Math.round(x * 4) / 4, Math.round(y * 4) / 4, rig, opts);
  k.mouth = [mx + cam.x, my + cam.y];
  ctx.restore();
}
// Slow, sorrowful blinks.
function yukiBlink(t) {
  const b = (t * 0.2) % 1;
  return b < 0.016 ? 'blink' : b < 0.034 ? 'half' : 'open';
}
