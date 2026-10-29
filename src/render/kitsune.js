// Draws the Shrine Maiden's kitsune shrine guardian (world/kitsune.js). She's built on the player
// character (the hero's body and drawing, hero.js drawPosed), so she belongs in the game's look,
// with a rig and animations of her own on top:
//   - her look, "Silver Moon" (the player's pick), in new parts drawn for her: a long silver-white
//     hime cut, tall fox ears and a great fox tail both tipped vermilion, amber eyes with kitsune
//     shrine make-up, and a shrine maiden's dress; drawn a good deal bigger than the Maiden (the
//     whole figure scaled, never stretched);
//   - her bearing: a very strong woman, proud, cold and not friendly at all. She stands like a
//     warlord: feet planted wide, chin up, a heavy-lidded stare, the naginata gripped out at her
//     side with its butt on the ground and her other arm hanging; she walks slow and unbothered,
//     the naginata striking the ground like a staff, a faint aura of spirit light about her feet,
//     and never hurries: left behind, she dissolves into fox fire and steps out of it again at the
//     Maiden's side; she never smiles, never hurries a strike;
//   - her naginata: a huge, ornate glaive taller than she is (a lacquered vermilion haft bound in
//     gold, a long curved blade with a groove down it, a gold collar, a great red tassel with a
//     bell), which she handles with ease: it twirls in her hand, sweeps in great arcs, and is
//     planted with a stamp;
//   - her rig: the whole figure leans from the hips and lunges and rises (drawPosed's `lean`), every
//     number of a pose rides a spring to the next (the body slower and fluid, the hands and blade
//     quicker), and over it all a layer of life that never stops: breath, a slow shift of weight,
//     her hair stirring in a breeze, ears that twitch, a tail that swishes and curls, sleeves and
//     robes that sway, the blade's tip drifting, the tassel swinging, slow blinks and glances;
//   - her moods (cross, pleased, attentive) colour whatever she's doing.
import { drawPosed } from './hero.js';
import { fxSprite } from './fx-sprites.js';
import { KMOVES, CALL, MOONFALL } from '../world/kitsune.js';

export const KITSUNE_LOOK = {
  hairStyle: 'hime', hairColor: '#f4f2ff', hairTip: '#ffb8ae', earStyle: 'fox', earTip: '#ff6a52', tail: 'fox', tailTip: '#ff6a52',
  skinTone: '#fff0e6', eyeColor: '#f0a53a', eyeStyle: 'sleepy', browStyle: 'sharp', face: 'cool', lid: 0.4, outfit: 'miko', outfitColor: '#ffffff', marks: ['kitsune'],
};
// She's big: the whole figure scaled up (never stretched).
const SCALE = 1.6;
const TAU = Math.PI * 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const ease = (t) => 1 - (1 - t) ** 3;
const soft = (t) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t));
const lerp = (a, b, t) => a + (b - a) * t;
const bump = (p, a, b) => (p < a || p > b ? 0 : Math.sin(((p - a) / (b - a)) * Math.PI));
// Committing to a strike: fast in, a little past, settling back.
const overshoot = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2);

// ---------- Her poses ----------
// A pose, facing right (in the hero's body px, before she's scaled up):
//   lean            the whole figure's lean from the hips (radians, + forward), lunge (px forward),
//                   lift (px up, off the ground)
//   pole, grip      the naginata's angle (radians: 0 straight up, + tipping forward; whole turns
//                   twirl it) and where along the haft her hand is (0 butt, 1 blade)
//   hand, free      where her naginata hand (the near arm, so it can reach out past her body) and
//                   her other hand reach, from rest
//   legF, legB      each foot's [ahead, up (negative), tilt]; squat how low she sinks
//   tx, by          the hips' sway and the body's bob; hx, hy, tilt the head's offset and roll
//   ears            her ears' turn [near, far] (degrees: - pricked forward, + laid back)
//   tail, curl      her tail's swing (+ down and back) and curl (+ tighter), degrees
//   cloth           how the robes and sleeves swing; mouth, eyes, brows the face
const REST = {
  lean: -0.05, lunge: 0, lift: 0, pole: 0, grip: 0.24, hand: [8, -1.2], free: [0.2, 2.6], legF: [3.4, 0, 6], legB: [-3.6, 0, -6], squat: 0,
  tx: 0, by: 0, hx: 0.4, hy: -0.6, tilt: -3, ears: [-6, -6], tail: 8, curl: -10, cloth: 0, mouth: 'flat', eyes: null, brows: 'stern',
};
const pose = (o) => ({ ...REST, ...o });

// ---------- Standing, and her idle acting ----------
// Her guard, a warlord's stance: feet planted wide, chest out, chin up, the naginata gripped out at
// her side with its butt on the ground, her other arm hanging with the fist clenched, her tail low
// and heavy; every few seconds she does one small thing (her `bit`, `u` 0-1 through it).
function standing(bit, u) {
  const k = soft(seg(u, 0, 0.22)) * (1 - soft(seg(u, 0.78, 1)));
  if (bit === 'glance') {
    // A cold look back over her shoulder at the Maiden, one ear turned to her, and away again.
    return pose({ hx: -1.4 * k, tilt: -3 - 4 * k, ears: [-6 + 16 * k, -6 - 4 * k], lean: -0.05 - 0.02 * k });
  }
  if (bit === 'stamp') {
    // She lifts the naginata a hand's width and drives its butt back into the ground: a warning.
    const up = soft(seg(u, 0.2, 0.42));
    const down = ease(seg(u, 0.44, 0.52));
    return pose({ hand: [8, -1.2 - 3.4 * up * (1 - down) + 0.8 * bump(u, 0.5, 0.66)], by: 0.8 * bump(u, 0.5, 0.66), lean: -0.05 + 0.04 * bump(u, 0.48, 0.7), ears: [-10 * up, -10 * up], eyes: up > 0.5 && down < 0.5 ? 'half' : null });
  }
  if (bit === 'twirl') {
    // She lifts the naginata, twirls it once in a full circle beside her, and plants it with a stamp.
    // (It's very heavy: the twirl is slow to start and slow to stop, and her body swings with it.)
    const spin = soft(seg(u, 0.16, 0.78));
    const stamp = bump(u, 0.7, 0.86);
    return pose({
      pole: TAU * spin, grip: lerp(0.24, 0.5, k), hand: [8 - 2 * k, -1.2 - 5 * k * (1 - stamp)], lean: -0.05 + 0.05 * k * Math.sin(spin * TAU), by: 0.8 * stamp,
      legF: [3.4 + 0.6 * stamp, -1.4 * bump(u, 0.62, 0.74), 6], tail: 8 + 14 * Math.sin(spin * TAU), ears: [-8 * k, -8 * k], eyes: k > 0.5 && u < 0.7 ? 'half' : null,
    });
  }
  if (bit === 'tail') {
    // Her tail lashes once, slow and heavy, the way a big cat's does; her ears flatten a moment.
    const lash = Math.sin(seg(u, 0.1, 0.9) * TAU);
    return pose({ tail: 8 - 26 * lash * k, curl: -10 + 30 * k, ears: [-6 + 10 * k, -6 + 10 * k] });
  }
  return pose({});
}
const BITS = ['glance', 'stamp', 'twirl', 'tail'];
const BIT_LEN = { glance: 2.4, stamp: 1.8, twirl: 3, tail: 2.6 };

// Walking: slow and unbothered (she's big, and nothing here worries her). Chin up, eyes half
// lidded, a heavy, even stride with her hips rolling; the naginata used as a staff, its butt
// set down beside her with each step of the near foot and swung forward again, her other arm
// hanging loose, her tail swaying behind. `ph` runs one full stride (both feet) per 2 PI.
function walking(ph) {
  const s = Math.sin(ph);
  const c = Math.cos(ph);
  // The staff: planted while the near foot carries her (s < 0), swung on with the next step.
  const swingOn = Math.max(0, s);
  return pose({
    legF: [2.4 + 3.4 * s, -1.4 * Math.max(0, c), 12 * s], legB: [-2.4 - 3.4 * s, -1.4 * Math.max(0, -c), -12 * s], by: -0.5 * Math.abs(c), tx: 0.7 * s, lean: -0.04 + 0.015 * c,
    pole: -0.06 + 0.16 * swingOn, grip: 0.24, hand: [7.2 + 1.4 * s, -0.6 - 1.6 * swingOn], free: [0.4 - 0.8 * s, 2.6], tail: 8 - 7 * s, curl: -10 + 8 * c,
    ears: [-6, -6], cloth: -0.8 - 1.4 * s, hx: 0.4 + 0.25 * s, hy: -0.6, tilt: -3 + 1.2 * s, eyes: 'half',
  });
}
// ---------- Her moves (KMOVES in world/kitsune.js) ----------

// Thrust: she slides back, drawing the great naginata level at her hip, eyes narrowing; then
// drives it out in one long, committed lunge (it lands at 0.42), her whole body behind it and her
// tail lashing out behind for balance; holds the line, and draws it back.
function thrusting(p) {
  const draw = soft(seg(p, 0, 0.3));
  const drive = overshoot(seg(p, 0.32, 0.46));
  const back = soft(seg(p, 0.7, 1));
  const k = drive * (1 - back);
  const level = soft(seg(p, 0, 0.24)) * (1 - back);
  return pose({
    lean: -0.12 * draw * (1 - drive) + 0.36 * k, lunge: -2 * draw * (1 - drive) + 8 * k,
    pole: lerp(0, 1.6, level), grip: 0.3, hand: [lerp(1.6, -3.6, draw) * (1 - drive) + 7 * k, lerp(2, 4.4, draw) * (1 - back) + 2 * back],
    free: [lerp(-1.4, -3.4, draw) + 5 * k, lerp(0.8, 2.6, draw) - 1.6 * k], squat: 2.2 * draw * (1 - back),
    legF: [lerp(2, 3, draw) + 4.4 * k, 0, 10], legB: [lerp(-2.2, -3.6, draw) - 2.6 * k, 0, -16], cloth: 2 * draw - 5 * k,
    tail: 16 * draw * (1 - drive) - 30 * k, curl: 30 * k, ears: [-8 * draw + 22 * k, -6 * draw + 18 * k], hy: -0.4 + 0.6 * draw, tilt: -2 + 4 * k,
    mouth: k > 0.4 ? 'open' : null, eyes: draw > 0.4 && k < 0.3 ? 'half' : null, brows: draw > 0.4 || k > 0.3 ? 'knit' : null,
  });
}
// Sweep: she winds the naginata up and back over her shoulder, coiling at the hips, then brings it
// round in one huge arc, down and through everything in front of her (landing at 0.5), and swings
// it back up to the guard.
function sweeping(p) {
  const wind = soft(seg(p, 0, 0.34));
  const cut = overshoot(seg(p, 0.35, 0.58));
  const back = soft(seg(p, 0.74, 1));
  const on = 1 - back;
  return pose({
    lean: -0.16 * wind * (1 - cut) + 0.3 * cut * on, lunge: -2 * wind * (1 - cut) + 5 * cut * on,
    pole: lerp(lerp(0, -1.9, wind), 1.55, cut) * on, grip: 0.28,
    hand: [lerp(lerp(1.6, -3, wind), 5.6, cut) * on + 1.6 * back, lerp(lerp(2, -2, wind), 3, cut) * on + 2 * back],
    free: [lerp(-1.4, 2.2, wind) - 5.8 * cut * on, -1.6 * cut * on + 0.8 * back], squat: 2.6 * Math.max(wind * 0.6, cut) * on,
    legF: [2.6 + 2.4 * cut * on, 0, 12], legB: [-3.6, 0, -20], cloth: 3 * wind - 6 * cut * on,
    tail: 24 * wind * (1 - cut) - 36 * cut * on, curl: 20 * wind - 30 * cut * on, ears: [18 * cut * on, 14 * cut * on], hy: -0.4 - 0.6 * wind + 0.8 * cut * on, tilt: -2 - 4 * wind + 6 * cut * on,
    mouth: cut > 0.3 && back < 0.5 ? 'open' : null, brows: 'knit', eyes: wind > 0.4 && cut < 0.3 ? 'half' : null,
  });
}
// Rising Cut: she sinks low with the blade down in front, then cuts up and over her head, rising
// right up onto her toes (it lands at 0.46, throwing it up), her tail and hair flung up after it,
// and settles back down with the blade upright.
function risingCut(p) {
  const low = soft(seg(p, 0, 0.32));
  const up = overshoot(seg(p, 0.33, 0.5));
  const back = soft(seg(p, 0.74, 1));
  const on = 1 - back;
  return pose({
    lean: 0.24 * low * (1 - up) - 0.18 * up * on, lunge: 3 * low * (1 - up), lift: 6 * up * on,
    pole: lerp(lerp(0, 1.8, low), -0.4, up) * on, grip: 0.3, hand: [lerp(lerp(1.6, 3, low), 1.4, up), lerp(lerp(2, 4.6, low), -10, up) * on + 2 * back],
    free: [1.2, lerp(lerp(0.8, 1.6, low), -8, up) * on], squat: 3 * low * (1 - up),
    legF: [2.8, -2.4 * up * on, 14], legB: [-2.6, -1.8 * up * on, -12], cloth: 4 * up * on,
    tail: 14 * low * (1 - up) - 44 * up * on, curl: -30 * up * on, ears: [-14 * up * on, -12 * up * on], hy: -0.4 + 0.8 * low - 1.2 * up * on, tilt: -2 - 6 * up * on,
    mouth: up > 0.3 && back < 0.5 ? 'open' : null, brows: low > 0.3 ? 'knit' : null,
  });
}
// Twin Strike: two quick thrusts, high then low (at 0.3 and 0.62), a step in with each and a flick
// of the tail.
function twinning(p) {
  const a = bump(p, 0.16, 0.44);
  const b = bump(p, 0.48, 0.78);
  const set = soft(seg(p, 0, 0.14)) * (1 - soft(seg(p, 0.82, 1)));
  return pose({
    lean: 0.06 * set + 0.24 * (a + b), lunge: 4 * (a + b), pole: lerp(0, lerp(1.4, 1.85, seg(p, 0.45, 0.55)), set), grip: 0.3,
    hand: [lerp(1.6, -1.8, set) + 7 * a + 7 * b, -2.4 * a + 3.6 * b + 2 * (1 - set)], free: [-1 + 2.6 * (a + b), 1],
    squat: 1.6 * set, legF: [2.6 + 2 * b, 0, 10], legB: [-3, 0, -16], tail: -18 * a + 18 * b, curl: 12 * (a - b), ears: [14 * (a + b), 12 * (a + b)],
    mouth: a + b > 0.6 ? 'open' : null, brows: 'knit',
  });
}
// Fox-Fire Call: she raises the naginata high overhead and twirls it once, eyes closed, ears up,
// tail fanned up behind her; then drives its butt into the ground (at 0.5) as the ring goes out,
// and stands tall over it, chin raised.
function calling(p) {
  const raise = soft(seg(p, 0, 0.3));
  const spin = ease(seg(p, 0.08, 0.4));
  const slam = ease(seg(p, 0.42, 0.52));
  const settle = soft(seg(p, 0.8, 1));
  return pose({
    lean: -0.08 * raise * (1 - slam) + 0.1 * slam * (1 - settle), lift: 3 * raise * (1 - slam), squat: 2.4 * slam * (1 - settle),
    pole: TAU * spin * (1 - slam), grip: 0.5 - 0.24 * slam, hand: [1.8, lerp(2, -11, raise) * (1 - slam) + 3 * slam * (1 - settle) + 2 * settle], free: [2, lerp(0.8, -10, raise) * (1 - slam) + 1.4 * slam],
    legF: [3, 0, 8], legB: [-3, 0, -8], cloth: 3 * slam * (1 - settle), tail: -36 * raise + 12 * slam * (1 - settle), curl: -24 * raise, ears: [-18 * raise, -16 * raise],
    hy: -0.4 - 0.8 * raise, tilt: -2 - 6 * raise, mouth: slam > 0.3 && settle < 0.5 ? 'open' : null, eyes: raise > 0.5 && slam < 0.3 ? 'blink' : null, brows: slam > 0.3 ? 'knit' : null,
  });
}
// Guard: she whips the haft up level across her body in both hands and braces; the blow jolts her
// back, tail bristling, ears pinned; then she sets the naginata down again, unbothered.
function blocking(p) {
  const k = ease(seg(p, 0, 0.14)) * (1 - soft(seg(p, 0.7, 1)));
  const jolt = bump(p, 0.12, 0.4);
  return pose({
    lean: 0.1 * k - 0.2 * jolt, lunge: -3 * jolt, pole: lerp(0, 1.57, k), grip: 0.5, hand: [lerp(1.6, 3.4, k) - 1.4 * jolt, lerp(2, -5.4, k)], free: [lerp(-1.4, 5, k) - 1.4 * jolt, lerp(0.8, -5.4, k)],
    squat: 2.2 * k, legF: [3.4, 0, 10], legB: [-3.8, 0, -16], tail: -20 * jolt + 10 * k, curl: 24 * jolt, ears: [24 * k, 22 * k],
    mouth: jolt > 0.3 ? 'open' : null, eyes: jolt > 0.3 ? 'half' : null, brows: 'knit',
  });
}
// Cleave: she hauls the naginata up over her head in both hands, rising onto her toes and leaning
// back under its weight, then brings it straight down in front of her (at 0.5) with everything she
// has, the blade biting into the ground, her body following it down into a deep lunge; she holds it
// there a beat, and wrenches it free.
function cleaving(p) {
  const up = soft(seg(p, 0, 0.38));
  const chop = overshoot(seg(p, 0.4, 0.52));
  const back = soft(seg(p, 0.76, 1));
  const on = 1 - back;
  const high = up * (1 - chop);
  return pose({
    lean: -0.05 - 0.12 * high + 0.46 * chop * on, lunge: 7 * chop * on, lift: 1.6 * high, squat: 4 * chop * on,
    pole: (lerp(0, -0.55, up) * (1 - chop) + 2.08 * chop) * on, grip: lerp(0.24, 0.36, up),
    hand: [(lerp(8, 2, up) * (1 - chop) + 8.6 * chop) * on + 8 * back, (lerp(-1.2, -11.5, up) * (1 - chop) + 4.4 * chop) * on - 1.2 * back],
    free: [(lerp(0.2, 2.8, up) * (1 - chop) + 6.2 * chop) * on + 0.2 * back, (lerp(2.6, -10.5, up) * (1 - chop) + 3.2 * chop) * on + 2.6 * back],
    legF: [3.4 + 2.8 * chop * on, -1.2 * high, 8 + 6 * chop * on], legB: [-3.6 - 1.6 * chop * on, -0.8 * high, -8 - 10 * chop * on],
    tail: 8 - 30 * high + 24 * chop * on, curl: -10 - 14 * high + 22 * chop * on, ears: [-6 - 6 * high + 26 * chop * on, -6 - 4 * high + 22 * chop * on], cloth: -3 * high + 6 * chop * on,
    hy: -0.6 - 0.9 * high + 1.3 * chop * on, tilt: -3 - 6 * high + 8 * chop * on,
    mouth: chop > 0.3 && on > 0.5 ? 'open' : null, eyes: high > 0.5 ? 'half' : null, brows: 'knit',
  });
}
// Low Reap: she sinks low and draws the naginata back along the ground, blade trailing low in front
// of her feet; then drives forward in a long scything slide, the blade skimming the ground and
// scooping up at the end (at 0.47) to take their feet out and pop them up; she rises back.
function reaping(p) {
  const draw = soft(seg(p, 0, 0.34));
  const cut = overshoot(seg(p, 0.36, 0.5));
  const back = soft(seg(p, 0.74, 1));
  const on = 1 - back;
  return pose({
    lean: -0.05 + (0.2 * draw * (1 - cut) + 0.36 * cut) * on, lunge: (-3 * draw * (1 - cut) + 8 * cut) * on, squat: (4.4 * draw + 0.6 * cut) * on,
    pole: (lerp(0, 2.25, draw) * (1 - cut) + 1.3 * cut) * on, grip: 0.3,
    hand: [(lerp(8, -4, draw) * (1 - cut) + 9.4 * cut) * on + 8 * back, (lerp(-1.2, 4.6, draw) * (1 - cut) + 2.4 * cut) * on - 1.2 * back],
    free: [(lerp(0.2, 3, draw) * (1 - cut) - 3 * cut) * on + 0.2 * back, (lerp(2.6, 1, draw) * (1 - cut) - 1 * cut) * on + 2.6 * back],
    legF: [3.4 + 1 * draw * (1 - cut) + 4 * cut * on, 0, 12], legB: [-3.6 - 2 * draw - 2 * cut * on, 0, -14 - 8 * cut * on],
    tail: 8 + 16 * draw * (1 - cut) - 38 * cut * on, curl: -10 + 20 * draw * (1 - cut) - 20 * cut * on, ears: [8 * draw + 18 * cut * on, 6 * draw + 14 * cut * on], cloth: 3 * draw - 6 * cut * on,
    hy: -0.6 + 0.8 * draw * on, tilt: -3 + 4 * draw * on,
    mouth: cut > 0.3 && on > 0.5 ? 'open' : null, eyes: draw > 0.5 && cut < 0.2 ? 'half' : null, brows: 'knit',
  });
}
// Haft Strike: she turns the naginata round in her hands and drives its butt straight into a face
// (at 0.28: it dazes), draws back, then brings the blade up over the top and down on it (at 0.6).
function haftStrike(p) {
  const set = soft(seg(p, 0, 0.13));
  const jab = overshoot(seg(p, 0.14, 0.28)) * (1 - soft(seg(p, 0.32, 0.46)));
  const cut = overshoot(seg(p, 0.46, 0.6));
  const back = soft(seg(p, 0.78, 1));
  const on = 1 - back;
  return pose({
    lean: -0.05 + (0.06 * set + 0.3 * jab + 0.4 * cut) * on, lunge: (6 * jab + 7 * cut) * on, squat: (1.4 * set + 2.8 * cut) * on,
    pole: (lerp(0, -1.6, set) * (1 - cut) + 1.95 * cut) * on, grip: lerp(0.24, 0.5, set) * (1 - cut) + 0.32 * cut,
    hand: [((lerp(8, 3, set) * (1 - jab) + 10 * jab) * (1 - cut) + 8.6 * cut) * on + 8 * back, (lerp(-1.2, 1.4, set) * (1 - cut) + 4 * cut) * on - 1.2 * back],
    free: [((-1 + 2 * set) * (1 - cut) + 5.6 * cut) * on + 0.2 * back, (1 * (1 - cut) + 3 * cut) * on + 2.6 * back],
    legF: [3.4 + 2.4 * (jab + cut) * on, 0, 8 + 4 * cut * on], legB: [-3.6 - 1.6 * cut * on, 0, -10 - 6 * cut * on],
    tail: 8 - 26 * jab + 22 * cut * on, curl: -10 + 18 * jab - 10 * cut * on, ears: [(16 * jab + 20 * cut) * on - 6, (12 * jab + 18 * cut) * on - 6], cloth: -4 * jab + 5 * cut * on,
    hy: -0.6 + 0.6 * cut * on, tilt: -3 + 2 * jab + 6 * cut * on,
    mouth: (jab > 0.5 || cut > 0.3) && on > 0.5 ? 'open' : null, brows: 'knit',
  });
}

// ---------- Her skills (world/kitsune.js MOONFALL, CRESCENT, FLURRY) ----------
// Moonfall: she hoists the naginata up over her head in both hands, held level with the blade out
// behind her, legs planted wide, leaning back, chin up and eyes shut as it charges (the vortex drags
// them in: the blade trembles, her robes and tail whip in its wind); then she brings it up and over
// the top and down (at 0.75) in one crushing blow in front of her, her body following it down; and
// hauls it back up.
function moonfallPose(u) {
  const lift = soft(seg(u, 0, 0.16));
  const charge = seg(u, MOONFALL.charge, MOONFALL.hit);
  const down = overshoot(seg(u, 0.69, 0.77));
  const back = soft(seg(u, 0.88, 1));
  const up = lift * (1 - down);
  const hold = down * (1 - back);
  const rest = (1 - up) * (1 - hold);
  const tremble = 0.4 * Math.sin(u * 140) * charge * up;
  return pose({
    lean: -0.05 - 0.12 * up + 0.52 * hold, lunge: 8 * hold, squat: 1.8 * up + 4.6 * hold,
    pole: -1.45 * up + 2.06 * hold + 0.04 * Math.sin(u * 90) * charge * up, grip: 0.24 * rest + 0.42 * up + 0.32 * hold,
    hand: [8 * rest + 3.4 * up + 8.6 * hold + tremble, -1.2 * rest - 9.4 * up + 4.6 * hold],
    free: [0.2 * rest + 4.4 * up + 6.4 * hold + tremble, 2.6 * rest - 9 * up + 3.4 * hold],
    legF: [3.4 + 1.2 * up + 2.8 * hold, 0, 6 + 4 * up + 6 * hold], legB: [-3.6 - 1.2 * up - 1.6 * hold, 0, -6 - 6 * up - 10 * hold],
    tail: 8 - 44 * up - 8 * Math.sin(u * 30) * charge + 24 * hold, curl: -10 - 20 * up + 22 * hold, ears: [-6 + 22 * up + 26 * hold, -6 + 18 * up + 22 * hold],
    cloth: 2.4 * Math.sin(u * 46) * charge * up - 2 * charge * up + 6 * hold,
    hy: -0.6 - 1.1 * up + 1.3 * hold, tilt: -3 - 8 * up + 8 * hold,
    mouth: hold > 0.4 ? 'open' : null, eyes: up > 0.6 && charge > 0.05 && down < 0.2 ? 'blink' : null, brows: 'knit',
  });
}
// Crescent Moon: she coils, drawing the naginata far back up over her shoulder with her free hand
// thrown out ahead to aim; then one huge diagonal cut, high to low, her whole body thrown after it
// (at 0.42: the blade leaves a great crescent of moonlight hanging in the air in front of her), and
// holds the follow-through before she rises.
function crescentPose(p) {
  const wind = soft(seg(p, 0, 0.34));
  const cut = overshoot(seg(p, 0.36, 0.46));
  const back = soft(seg(p, 0.72, 1));
  const on = 1 - back;
  return pose({
    lean: -0.05 + (-0.2 * wind * (1 - cut) + 0.46 * cut) * on, lunge: (-3 * wind * (1 - cut) + 8 * cut) * on, squat: (1.4 * wind + 3 * cut) * on,
    pole: (lerp(0, -2.3, wind) * (1 - cut) + 2.25 * cut) * on, grip: 0.3,
    hand: [(lerp(8, -3, wind) * (1 - cut) + 9.4 * cut) * on + 8 * back, (lerp(-1.2, -6, wind) * (1 - cut) + 3 * cut) * on - 1.2 * back],
    free: [(lerp(0.2, 5, wind) * (1 - cut) - 3 * cut) * on + 0.2 * back, (lerp(2.6, -2.6, wind) * (1 - cut) + 2 * cut) * on + 2.6 * back],
    legF: [3.4 + 3 * cut * on, 0, 8 + 6 * cut * on], legB: [-3.6 - 2 * cut * on, 0, -8 - 10 * cut * on],
    tail: 8 + 20 * wind * (1 - cut) - 40 * cut * on, curl: -10 + 22 * wind * (1 - cut) - 22 * cut * on, ears: [-6 - 8 * wind * (1 - cut) + 26 * cut * on, -6 - 6 * wind * (1 - cut) + 22 * cut * on], cloth: 3 * wind - 7 * cut * on,
    hy: -0.6 - 0.6 * wind * (1 - cut) + 1 * cut * on, tilt: -3 - 4 * wind * (1 - cut) + 7 * cut * on,
    mouth: cut > 0.3 && on > 0.5 ? 'open' : null, eyes: wind > 0.4 && cut < 0.2 ? 'half' : null, brows: 'knit',
  });
}
// Hundred Thrusts: she drops into a low stance with the naginata levelled at her hip, and drives it
// out again and again, each thrust a jolt of her whole body (at 0.2 to 0.52), her tail lashing with
// them; then draws it right back and puts everything into a last great lunge (at 0.7) that throws
// it, and holds it there.
function flurryPose(p) {
  const level = soft(seg(p, 0, 0.14));
  const back = soft(seg(p, 0.84, 1));
  const on = 1 - back;
  let jab = 0;
  for (const h of [0.2, 0.28, 0.36, 0.44, 0.52]) jab = Math.max(jab, bump(p, h - 0.045, h + 0.035));
  const draw = soft(seg(p, 0.55, 0.64)) * (1 - seg(p, 0.64, 0.7));
  const last = overshoot(seg(p, 0.64, 0.71));
  const k = level * on;
  return pose({
    lean: -0.05 + (0.12 * k + 0.16 * jab - 0.14 * draw + 0.42 * last) * on, lunge: (2 + 4 * jab - 3 * draw + 9 * last) * k, squat: (2.4 + 0.6 * jab + 1.4 * last) * k,
    pole: lerp(0, 1.58 + 0.05 * Math.sin(p * 70) * (1 - last), level) * on, grip: 0.3,
    hand: [(lerp(8, 1, level) + 6.4 * jab * (1 - last) - 3.6 * draw + 9 * last) * on + 8 * back, (lerp(-1.2, 3.4, level) - 0.8 * Math.sin(p * 47) * jab) * on - 1.2 * back],
    free: [(-1.6 + 2 * jab + 4.6 * last) * k + 0.2 * back, (1.4 - 1.2 * last) * k + 2.6 * back],
    legF: [3.4 + (1 + 1.4 * jab + 3.6 * last) * k, 0, 10], legB: [-3.6 - (0.8 + 1.8 * last) * k, 0, -14 - 6 * last * k],
    tail: 8 - 18 * jab * Math.sign(Math.sin(p * 40)) - 36 * last * on, curl: -10 + 14 * jab + 26 * last * on, ears: [(10 * jab + 24 * last) * on - 6, (8 * jab + 20 * last) * on - 6], cloth: (-2 * jab - 6 * last) * on,
    hy: -0.6 + 0.6 * k, tilt: -3 + (2 * jab + 5 * last) * on,
    mouth: (jab > 0.5 || last > 0.3) && on > 0.5 ? 'open' : null, eyes: draw > 0.5 ? 'half' : null, brows: 'knit',
  });
}
// ---------- Her teleport (world/kitsune.js TELE) ----------
// Vanishing: she plants the naginata, lifts her chin, closes her eyes, and is gone in fox fire
// (she fades; the fire is the effect's).
function vanishing(p) {
  const k = soft(seg(p, 0, 0.4));
  return pose({ hand: [8, -1.2 - 2 * bump(p, 0, 0.3)], by: 0.6 * bump(p, 0.2, 0.4), hy: -0.6 - 0.8 * k, tilt: -3 - 5 * k, eyes: k > 0.5 ? 'blink' : null, ears: [-6 + 14 * k, -6 + 12 * k], tail: 8 - 30 * k, curl: -10 - 16 * k, cloth: -2 * k });
}
// Arriving: she steps out of the fox fire low, one knee bent with the naginata planted, and rises
// to her full height with a stamp of its butt, eyes opening on whatever's there.
function arriving(p) {
  const rise = soft(seg(p, 0.3, 0.8));
  const low = 1 - rise;
  return pose({
    lean: -0.05 + 0.14 * low, squat: 3.4 * low, by: 0.8 * bump(p, 0.7, 0.9), hand: [8, -1.2 + 2 * low - 2 * bump(p, 0.55, 0.72)], free: [0.2 + 1.6 * low, 2.6],
    legF: [3.4 + 1 * low, 0, 6 + 8 * low], legB: [-3.6 - 1.4 * low, 0, -6 - 8 * low],
    tail: 8 - 24 * low, curl: -10 + 10 * low, ears: [-6 + 18 * low, -6 + 16 * low], hy: -0.6 + 0.8 * low, tilt: -3 + 4 * low, eyes: p < 0.45 ? 'blink' : p < 0.6 ? 'half' : null,
  });
}

// After a fight: she turns to the Maiden and gives one curt nod, eyes closing a moment (a
// guardian's acknowledgement, not a bow), then plants the naginata and stands tall again.
function bowing(p) {
  const k = soft(seg(p, 0.15, 0.35)) * (1 - soft(seg(p, 0.5, 0.7)));
  const plant = bump(p, 0.62, 0.8);
  return pose({ lean: -0.05 + 0.1 * k, hy: -0.6 + 1.4 * k, hx: 0.4 + 0.4 * k, tilt: -3 + 6 * k, ears: [-6 + 6 * k, -6 + 6 * k], eyes: k > 0.4 ? 'blink' : null, by: 0.6 * plant, hand: [8, -1.2 + 0.8 * plant] });
}

// ---------- Her moods ----------
//   cross    the Maiden was hurt: ears pinned flat, brows knit, eyes narrowed, tail bristling up
//   pleased  what she was fighting went down: a cold "hmph", chin up, eyes half shut, ears up
//   attend   the Maiden's Blessing or Ward went up: ears pricked and turned to her, a glance back
function moodOver(p, mood, t, k) {
  if (mood === 'cross') return { ...p, ears: [p.ears[0] + 30 * k, p.ears[1] + 28 * k], brows: 'knit', eyes: p.eyes ?? 'half', tail: p.tail - 24 * k, curl: p.curl + 24 * k, mouth: p.mouth === 'open' ? 'open' : 'grit' };
  if (mood === 'pleased') return { ...p, ears: [p.ears[0] - 8 * k, p.ears[1] - 6 * k], tail: p.tail - 10 * k, eyes: p.eyes ?? 'half', hy: p.hy - 0.5 * k, tilt: p.tilt - 3 * k };
  if (mood === 'attend') return { ...p, ears: [p.ears[0] + 16 * k, p.ears[1] - 10 * k], hx: p.hx - 1.4 * k, hy: p.hy + 0.3 * k };
  return p;
}

// ---------- Her rig ----------
// Every number of her pose rides a spring to its target: her body slower and fluid, her hands and
// her blade quicker (so strikes snap but she never jerks), each a touch under-damped.
// (The naginata is very heavy: her weapon hand and the blade ride a stiff, well-damped spring, so it
// swings with weight and stops dead rather than bouncing; her free hand is light and quick.)
const FAST = new Set(['hand', 'free', 'pole', 'grip']);
const SLOW = { k: 150, damp: 0.8 };
const QUICK = { k: 340, damp: 0.72 };
const HEAVY = { k: 210, damp: 0.95 };
const HEAVY_KEYS = new Set(['hand', 'pole', 'grip']);
function follow(st, target, dt) {
  if (!st.P) return (st.P = structuredClone(target));
  const n = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / n;
  const P = { ...target };
  for (const key of Object.keys(target)) {
    const { k, damp } = HEAVY_KEYS.has(key) ? HEAVY : FAST.has(key) ? QUICK : SLOW;
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
    if (typeof to === 'number' && typeof was === 'number') {
      // A finished twirl comes back to the same angle without unwinding.
      const from = key === 'pole' && Math.abs(to - was) > Math.PI ? was - TAU * Math.round((was - to) / TAU) : was;
      [P[key], st.V[key]] = step(from, st.V[key] ?? 0, to);
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
// A damped spring toward `to` (stiffness k, damping c), for her secondary motion.
function spring(x, v, to, k, c, dt) {
  const nv = v + ((to - x) * k - v * c) * dt;
  return [x + nv * dt, nv];
}
// Fine steps, so the motion reads as smooth: an eighth of a body px, a degree.
const q = (v) => Math.round(v * 8) / 8;
const deg = (v) => Math.round(v);
const STATE = new WeakMap();
const POSES = {
  thrust: thrusting, sweep: sweeping, rising: risingCut, twin: twinning, cleave: cleaving, reap: reaping, haft: haftStrike,
  moonfall: moonfallPose, crescent: crescentPose, flurry: flurryPose, call: calling, block: blocking, bow: bowing, vanish: vanishing, arrive: arriving,
};

export function drawKitsune(ctx, world, k, cam, time) {
  if (!k?.body) return;
  let st = STATE.get(k);
  if (!st) {
    st = { last: time, P: null, V: {}, walk: 0, vx: 0, bit: null, bitAt: time + 3 };
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
    st.bitAt = time + BIT_LEN[st.bit.kind] + 2.5 + Math.random() * 2.5;
  }
  if (st.bit && (a || k.moving || time - st.bit.t0 > BIT_LEN[st.bit.kind])) st.bit = null;
  let p;
  if (a) {
    const u = clamp01((world.now - a.t0) / a.dur);
    p = POSES[a.kind]?.(u) ?? standing(null, 0);
  } else if (k.moving) {
    st.walk += dt * Math.min(1.8, Math.abs(k.vx) / 52) * 3.6;
    p = walking(st.walk);
  } else p = st.bit ? standing(st.bit.kind, (time - st.bit.t0) / BIT_LEN[st.bit.kind]) : standing(null, 0);
  if (k.mood) p = moodOver(p, k.mood.kind, time, a ? 0.5 : 1);
  const P = follow(st, p, dt);

  // ----- The life layer: always moving, whatever she's doing -----
  const calm = a ? 0.4 : 1;
  const breath = Math.sin(time * 1.25);
  const shift = Math.sin(time * 0.42);
  const breeze = Math.sin(time * 0.9) + 0.5 * Math.sin(time * 2.3 + 1);
  const twitch = Math.max(0, Math.sin(time * 1.9 + 2) - 0.86) * 18 + Math.max(0, Math.sin(time * 1.3) - 0.9) * 14;

  // ----- Secondary motion, driven by how she moves -----
  const dir = k.dir || 1;
  const ax = dt > 0 ? (k.vx - st.vx) / dt : 0;
  st.vx = k.vx;
  const v = (k.vx * dir) / 100;
  const surge = (ax * dir) / 600;
  const S = (name, to, kk, c) => {
    [st[name], st[name + 'V']] = spring(st[name] ?? to, st[name + 'V'] ?? 0, to, kk, c, dt);
    return st[name];
  };
  // (Her tail is heavy and slow, a big cat's: it sways, it doesn't wag.)
  const tail = S('tail', P.tail + 6 * Math.sin(time * 0.7) * calm + 2 * Math.sin(time * 1.9) * calm - 18 * v - 26 * surge, 50, 6.5);
  const curl = S('curl', P.curl + 8 * Math.sin(time * 0.7 + 1.2) * calm + 10 * v, 40, 6);
  const earN = S('earN', P.ears[0] + twitch + 8 * v, 240, 12);
  const earF = S('earF', P.ears[1] + twitch * 0.6 + 8 * v + 3 * Math.sin(time * 0.7), 210, 12);
  const hair = S('hair', -1.4 * v - 2 * surge + 0.5 * breeze + (P.lift > 2 ? -1 : 0), 55, 5.5);
  const tip = S('tip', hair + 0.4 * Math.sin(time * 1.7), 38, 4.2);
  const sway = S('sway', P.cloth + 0.8 * breeze * calm - 2 * v, 80, 7.5);
  // The weight of the naginata pulls her body after it: as the blade swings, she leans with it.
  const poleVel = st.poleWas == null ? 0 : (P.pole - st.poleWas) / Math.max(dt, 1e-3);
  st.poleWas = P.pole;
  const lean = S('lean', 0.16 * surge + 0.04 * v + Math.max(-0.12, Math.min(0.12, poleVel * 0.012)), 110, 11);
  const head = S('head', -1.2 * surge, 140, 12);

  const x = k.x - cam.x;
  const y = k.y - cam.y;
  // Her brows: always stern, drawn down hard when she strikes or is crossed.
  const brows = P.brows === 'knit' ? [[-0.4, 0.95], [-0.4, 0.95]] : [[-0.15, 0.55], [-0.15, 0.55]];
  const rig = {
    tx: q(P.tx + 0.35 * shift * calm), by: q(P.by + 0.3 * breath * calm), hx: q(P.hx + Math.max(-1.6, Math.min(1.6, head)) + 0.2 * shift * calm), hy: q(P.hy + 0.22 * breath * calm),
    tilt: deg(P.tilt + 1.2 * shift * calm), frontArm: [q(P.hand[0]), q(P.hand[1] + 0.25 * breath * calm)], backArm: [q(P.free[0]), q(P.free[1] + 0.3 * breath * calm)], armSide: 1,
    frontLeg: [q(P.legF[0]), q(P.legF[1]), deg(P.legF[2])], backLeg: [q(P.legB[0]), q(P.legB[1]), deg(P.legB[2])], squat: q(P.squat),
    // (The drawing turns her tail the other way round from her poses' sense; it never swings down
    // into the ground however hard it lashes.)
    ears: [deg(earN), deg(earF)], tail: deg(-Math.max(-60, Math.min(6, tail))), tailCurl: deg(Math.max(-40, Math.min(60, curl))), cape: q(sway),
    hair: q(Math.max(-3, Math.min(3, hair))), hairTip: q(Math.max(-4, Math.min(4, tip))), hairLift: Math.abs(hair) > 1.6 ? -1 : 0, hairWave: Math.floor((((time / 1.7) % 1) + 1) % 1 * 8),
    eyes: P.eyes ?? blinkOf(time), face: { brows },
  };
  const look = { ...KITSUNE_LOOK, mouth: P.mouth ?? undefined };
  // The naginata goes behind her while it's upright or slung back, in front when it's out at them.
  const ang = ((P.pole % TAU) + TAU) % TAU;
  const out = (ang > 0.9 && ang < 2.8) || P.hand[0] > 5;
  const drift = 0.025 * Math.sin(time * 0.8) * calm;
  const naginata = (c, hand, flip) => paintNaginata(c, hand, flip, P.pole + drift, P.grip, st, dt, time);
  // A faint aura of spirit light about her feet, rising as she walks (fainter standing, gone in a
  // fight or in the air).
  st.aura = lerp(st.aura ?? 0, a ? 0 : k.moving ? 1 : 0.45, Math.min(1, dt * 3));
  // Teleporting: she fades out into her fox fire, and fades in out of it.
  const au = a ? clamp01((world.now - a.t0) / a.dur) : 0;
  const fade = a?.kind === 'vanish' ? 1 - soft(seg(au, 0.25, 0.95)) : a?.kind === 'arrive' ? soft(seg(au, 0, 0.45)) : 1;
  // Moonfall's charge gathers in the blade as a glow.
  const charging = a?.kind === 'moonfall' && au >= MOONFALL.charge && au < MOONFALL.hit;
  st.glow = lerp(st.glow ?? 0, charging ? 0.4 + 0.6 * seg(au, MOONFALL.charge, MOONFALL.hit) : 0, Math.min(1, dt * (charging ? 4 : 10)));
  if (fade <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= fade;
  if (st.aura > 0.05) fxSprite(ctx, 'celspiritaura', x, y + 2, { t: time * 0.9, scale: 0.62, alpha: 0.55 * st.aura });
  drawPosed(ctx, look, Math.round(x * 4) / 4, Math.round(y * 4) / 4, rig, {
    scale: SCALE, facing: dir, under: out ? null : naginata, over: out ? naginata : null, hold: 'front',
    lean: { tilt: P.lean + lean + 0.012 * shift * calm, lunge: P.lunge, lift: P.lift },
  });
  ctx.restore();
}

// Slow, calm blinks, and now and then a slow double blink.
function blinkOf(t) {
  const b = (t * 0.24) % 1;
  return b < 0.012 ? 'blink' : b < 0.024 ? 'half' : b > 0.5 && b < 0.508 ? 'half' : 'open';
}

// ---------- The naginata ----------
// A huge, ornate glaive, taller than she is: a lacquered vermilion haft bound with gold rings and a
// gold butt cap, a gold collar, a long curved blade with a groove down it and a bright edge, and a
// great red tassel with a gold bell that swings from the collar on its own spring. Drawn from her
// hand along `ang` (0 up, + forward), held at `grip` along it, in her body px.
const HAFT = 70;
const BLADE = 26;
function paintNaginata(c, hand, flip, ang, grip, st, dt, time) {
  // The tassel swings after the blade's motion.
  const swing = st.poleLast == null ? 0 : (ang - st.poleLast) / Math.max(dt, 1e-3);
  st.poleLast = ang;
  [st.tassel, st.tasselV] = spring(st.tassel ?? 0, st.tasselV ?? 0, -ang - swing * 0.06, 34, 3.6, dt);
  c.save();
  c.translate(hand[0], hand[1]);
  if (flip) c.scale(-1, 1);
  c.rotate(ang);
  c.scale(SCALE, SCALE);
  c.lineCap = 'round';
  const top = -HAFT * (1 - grip);
  const bot = HAFT * grip;
  // The haft.
  for (const [w, col] of [[3, '#3a1212'], [2, '#c8302a']]) {
    c.strokeStyle = col;
    c.lineWidth = w;
    c.beginPath();
    c.moveTo(0, bot);
    c.lineTo(0, top);
    c.stroke();
  }
  c.strokeStyle = '#ff8a7a';
  c.lineWidth = 0.6;
  c.beginPath();
  c.moveTo(-0.5, bot - 2);
  c.lineTo(-0.5, top + 2);
  c.stroke();
  // Gold rings, and the gold butt cap.
  c.fillStyle = '#e8c45a';
  c.strokeStyle = '#8a6a1a';
  c.lineWidth = 0.35;
  for (const u of [0.08, 0.36, 0.64, 0.9]) {
    c.fillRect(-1.7, lerp(top, bot, u) - 0.8, 3.4, 1.6);
    c.strokeRect(-1.7, lerp(top, bot, u) - 0.8, 3.4, 1.6);
  }
  c.beginPath();
  c.moveTo(-1.6, bot - 2);
  c.lineTo(1.6, bot - 2);
  c.lineTo(1, bot + 1.4);
  c.lineTo(-1, bot + 1.4);
  c.closePath();
  c.fill();
  c.stroke();
  // The tassel and its bell, hanging from the collar and swinging.
  c.save();
  c.translate(-1, top + 1);
  c.rotate((st.tassel ?? 0) + Math.sin(time * 2.1) * 0.08);
  c.strokeStyle = '#e0453a';
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(-1, 4, 0, 8);
  c.stroke();
  c.fillStyle = '#e8c45a';
  c.beginPath();
  c.arc(0, 8.6, 1.3, 0, TAU);
  c.fill();
  c.fillStyle = '#e0453a';
  c.beginPath();
  c.moveTo(-1.8, 9.6);
  c.lineTo(1.8, 9.6);
  c.lineTo(1.4 + Math.sin(time * 3) * 0.3, 15);
  c.lineTo(-1.4 + Math.sin(time * 3 + 1) * 0.3, 15);
  c.closePath();
  c.fill();
  c.strokeStyle = '#b02828';
  c.lineWidth = 0.3;
  for (const dx of [-0.8, 0, 0.8]) {
    c.beginPath();
    c.moveTo(dx, 10);
    c.lineTo(dx * 1.1, 14.6);
    c.stroke();
  }
  c.restore();
  // The collar.
  c.fillStyle = '#e8c45a';
  c.strokeStyle = '#8a6a1a';
  c.lineWidth = 0.4;
  c.beginPath();
  c.moveTo(-2.2, top + 1);
  c.lineTo(2.2, top + 1);
  c.lineTo(2.6, top - 2.6);
  c.lineTo(-2.6, top - 2.6);
  c.closePath();
  c.fill();
  c.stroke();
  // The blade: long and curving forward, silver, with a groove down it and a bright cutting edge.
  const b0 = top - 2.6;
  c.beginPath();
  c.moveTo(-2, b0);
  c.bezierCurveTo(-2.6, b0 - BLADE * 0.45, -1, b0 - BLADE * 0.85, 3.4, b0 - BLADE);
  c.bezierCurveTo(4.4, b0 - BLADE * 0.62, 3.8, b0 - BLADE * 0.3, 2, b0);
  c.closePath();
  c.fillStyle = '#e6ecf6';
  c.fill();
  c.strokeStyle = '#6f7d9a';
  c.lineWidth = 0.5;
  c.stroke();
  c.strokeStyle = '#a9b6cc';
  c.lineWidth = 0.6;
  c.beginPath();
  c.moveTo(-0.6, b0 - 1);
  c.bezierCurveTo(-0.9, b0 - BLADE * 0.42, 0, b0 - BLADE * 0.72, 1.6, b0 - BLADE * 0.86);
  c.stroke();
  c.strokeStyle = '#ffffff';
  c.lineWidth = 0.75;
  c.beginPath();
  c.moveTo(1.8, b0 - 1.2);
  c.bezierCurveTo(3.4, b0 - BLADE * 0.3, 4, b0 - BLADE * 0.6, 3.4, b0 - BLADE + 1.2);
  c.stroke();
  // Moonfall's charge: a gathering ball of light on the blade.
  if ((st.glow ?? 0) > 0.03) {
    c.save();
    c.translate(1, b0 - BLADE * 0.55);
    c.rotate(-ang);
    c.scale(1 / SCALE, 1 / SCALE);
    fxSprite(c, 'celcharge', 0, 0, { t: time, scale: 0.18 + 0.32 * st.glow, alpha: st.glow });
    c.restore();
  }
  c.restore();
}

export { KMOVES, CALL };
