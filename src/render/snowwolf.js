// Draws Snow wolf, the Beastmaster's companion (world/pets.js), on a skeleton of her own: her look
// is the hero's parts (hair, face, ears, tail, kimono), but nothing of the player's rig moves her.
// Her poses (standing about fed up, plodding with the sword, running, jumping, climbing, and
// everything she does with it) come from here, blend into each other, and go to the hero's drawing
// whole (hero.js drawPosed). The Fang of the Wolf Queen is one of her bones: drawn from where her
// right hand really is, along its own angle, so it never leaves her hand.
import { drawPosed, posedMouth } from './hero.js';
import { footShadow } from './pixel.js';
import { wild } from '../world/melee.js';
import { procOf } from '../world/combat.js';

// Her look (the hero's parts): a short tomboy wolf cut in white with ice-blue tips, blue cat eyes
// half shut, small thick brows, a bored mouth, wolf ears and tail, an oversized white kimono, barefoot.
export const SNOW_LOOK = {
  hairStyle: 'wolfsleek', hairColor: '#eef1f8', hairTip: '#9fd8ff', eyeStyle: 'cat', eyeColor: '#4fc8ff', browStyle: 'stubby',
  earStyle: 'wolf', tail: 'wolf', face: 'cool', lid: 0.85, mouth: 'bored', outfit: 'bigkimono', outfitColor: '#f6f8fc',
};
// She's a head shorter than the Beastmaster (the whole figure scaled, never squashed).
const SCALE = 0.72;

// ---------- The Fang of the Wolf Queen ----------
// Drawn once, in its own units (1 = one body px) along its axis: the hilt at 0, the blade running
// to +LEN, the grip and pommel back toward -13. +y is the sword's top (the wolf head's ears), which
// faces the sky as she drags it behind her.
const LEN = 64;
const RES = 3;
const STEEL = '#e3e9f2';
const STEEL_SH = '#b7c3d6';
const STEEL_DK = '#8796b2';
const INK = '#2e3850';
const ICE = '#8fe6ff';
const ICE_DK = '#3c9cd0';
const GOLD = '#f2c94c';
const GOLD_DK = '#b8862a';
const SILVER = '#eef2f8';
const SILVER_SH = '#bcc7da';
const OX = 18; // where the hilt sits in the sword's canvas
const OY = 16;
let SWORD = null;
function sword() {
  if (SWORD) return SWORD;
  const cv = document.createElement('canvas');
  cv.width = (LEN + 24) * RES;
  cv.height = 32 * RES;
  const c = cv.getContext('2d');
  c.scale(RES, RES);
  c.translate(OX, OY);
  const path = (pts) => {
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
  };
  const poly = (pts, fill, line = INK, w = 1) => {
    path(pts);
    c.fillStyle = fill;
    c.fill();
    if (line) {
      c.lineWidth = w;
      c.strokeStyle = line;
      c.stroke();
    }
  };
  const dot = (x, y, r, fill, line = null) => {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = fill;
    c.fill();
    if (line) {
      c.lineWidth = 0.8;
      c.strokeStyle = line;
      c.stroke();
    }
  };
  // The blade: broad and pale, two wolf fangs cut into its back edge, frosted ice along both
  // edges, a gold-inlaid fuller with ice runes, a crescent moon pierced through it.
  const back = [[-3, 4.8], [26, 4.6], [27.4, 2.8], [28.8, 4.6], [31.4, 4.5], [32.8, 2.7], [34.2, 4.4], [LEN - 10, 4], [LEN, 0]];
  const edge = [[LEN - 10, -4], [-3, -4.8]];
  poly([...back, ...edge], STEEL);
  poly([[-3, -0.4], [LEN - 10, -0.3], [LEN - 1, -0.1], [LEN - 10, -3.8], [-3, -4.6]], STEEL_SH, null);
  poly([[12, -4.6], [LEN - 10, -3.9], [LEN - 1.2, -0.2], [LEN - 10, -3.1], [12, -3.7]], '#c6f1ff', null);
  poly([[35, 4.3], [LEN - 10, 3.9], [LEN - 1.2, 0.2], [LEN - 10, 3.1], [35, 3.4]], '#c6f1ff', null);
  poly([[12, -0.7], [LEN - 16, -0.5], [LEN - 16, 0.5], [12, 0.7]], STEEL_DK, null);
  poly([[12, -0.25], [LEN - 16, -0.15], [LEN - 16, 0.15], [12, 0.25]], GOLD, null);
  for (const x of [38, 43, 48]) poly([[x, -1.4], [x + 1.2, 0], [x, 1.4], [x - 1.2, 0]], ICE, ICE_DK, 0.5);
  c.save();
  c.globalCompositeOperation = 'destination-out';
  c.beginPath();
  c.arc(19, 0, 2.6, 0, Math.PI * 2);
  c.fill();
  c.restore();
  c.beginPath();
  c.arc(19, 0, 2.6, 0, Math.PI * 2);
  c.lineWidth = 0.8;
  c.strokeStyle = GOLD_DK;
  c.stroke();
  dot(20.2, 0.6, 2.2, STEEL);
  path([...back, ...edge]);
  c.lineWidth = 1;
  c.strokeStyle = INK;
  c.stroke();
  // The guard: a silver wolf's head holding the blade in its jaws: a ruff of fur flaring back,
  // ears up, an ice-blue eye, fangs bared over and under the steel, a gold crown on its brow.
  poly([[-3, 8], [-8.4, 12], [-6, 8], [-10, 7.6], [-5.6, 5.4], [-9.6, 3.6], [-4, 3]], SILVER);
  poly([[-3, -5], [-8.4, -9.6], [-6, -6.2], [-10, -5.4], [-5.6, -3.4], [-9.4, -1.4], [-4, -1]], SILVER);
  poly([[-1, 9.6], [-3.4, 14.6], [2.6, 10.4]], SILVER);
  poly([[-0.6, 10], [-2.4, 13], [1.4, 10.4]], '#d9b8c8', null);
  poly([[2, 10.4], [1, 15], [5, 10]], SILVER);
  poly([[-4.4, 3], [-3.4, 8], [0, 10.4], [3.4, 10.6], [6.4, 9.2], [10.6, 7.8], [12.6, 6.4], [12, 5], [4, 5.2], [-1, 4.6], [-4.4, 4]], SILVER);
  poly([[-4.4, 4], [-1, 4.6], [4, 5.2], [12, 5], [11, 5.8], [4, 6.4], [-3.6, 6.2]], SILVER_SH, null);
  poly([[-4.6, -4.6], [4, -5], [10.6, -5.2], [11.4, -6.4], [6, -7.6], [0, -7.8], [-3.4, -6.4]], SILVER);
  poly([[-4.6, 4], [-4.6, -4.6], [-2.6, -4.6], [-2.6, 4]], SILVER);
  for (const x of [7.6, 10]) poly([[x - 0.8, 5.1], [x + 0.8, 5.1], [x, 3.2]], '#ffffff', INK, 0.5);
  for (const x of [6.4, 9]) poly([[x - 0.8, -5.1], [x + 0.8, -5.1], [x, -3.3]], '#ffffff', INK, 0.5);
  dot(12.6, 6.2, 0.9, '#2a3048');
  poly([[4.6, 7.4], [7.6, 8], [6.2, 6.8]], ICE, ICE_DK, 0.4);
  c.lineWidth = 0.6;
  c.strokeStyle = INK;
  c.beginPath();
  c.moveTo(3.4, 8.8);
  c.lineTo(7.8, 8.6);
  c.stroke();
  poly([[0, 10.2], [0.4, 12.8], [1.4, 11.4], [2.2, 13.4], [3, 11.4], [4, 12.8], [4.4, 10.2]], GOLD, GOLD_DK, 0.6);
  dot(2.2, 11, 0.55, ICE);
  // The grip in white leather bound with gold, a gold crown pommel set with a great ice stone, and
  // a white fur tassel hanging from it.
  poly([[-3.4, 1.7], [-9, 1.5], [-9, -1.5], [-3.4, -1.7]], '#f4f1ea');
  c.strokeStyle = GOLD_DK;
  c.lineWidth = 0.6;
  for (let x = -4.2; x > -9; x -= 1.5) {
    c.beginPath();
    c.moveTo(x, 1.5);
    c.lineTo(x - 0.9, -1.5);
    c.stroke();
  }
  poly([[-9, 2.6], [-9.8, 3.8], [-10.6, 2.6], [-11.6, 3.8], [-12.4, 2.6], [-13.2, 3.8], [-13.2, -2.6], [-9, -2.6]], GOLD, GOLD_DK, 0.7);
  dot(-11.1, 0, 1.5, ICE, ICE_DK);
  dot(-11.5, 0.5, 0.5, '#ffffff');
  poly([[-12, -2.6], [-13.4, -6.2], [-12.6, -8.8], [-11, -9.6], [-10.2, -7.6], [-11, -5.4], [-11, -2.6]], '#ffffff', SILVER_SH, 0.6);
  dot(-11.4, -3, 0.7, ICE);
  return (SWORD = cv);
}

// The sword along +x from its hilt at the origin, `k` px per unit, the crescent lit by `glow`.
function paintSword(ctx, k, glow) {
  const cv = sword();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(cv, -OX * k, -OY * k, (cv.width * k) / RES, (cv.height * k) / RES);
  if (glow > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(19 * k, 0, 0, 19 * k, 0, 9 * k);
    g.addColorStop(0, `rgba(220, 236, 255, ${0.9 * glow})`);
    g.addColorStop(1, 'rgba(120, 160, 240, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(10 * k, -9 * k, 18 * k, 18 * k);
    ctx.restore();
  }
}
// Where her hand closes on the grip, along the sword from the hilt.
const GRIP = -6.2;

// ---------- Her skeleton ----------
// A pose, in her own terms (facing right; body px of the hero's rig, before its chibi proportions):
//   tx, by, squat, lift, hx, hy, tilt   the upper body's lean and bob, how far she sinks, a hop,
//                                       the head's offset and tilt (degrees)
//   hand, free                          where her right hand (holding the sword) and her free left
//                                       hand reach, from where they'd rest
//   sword                               the blade's direction from her hand (radians, 0 = ahead,
//                                       PI/2 = down), or 'trail': dragged, its tip on the ground
//   abs                                 `sword` is on screen as is (spins, which turn her round)
//   legF, legB                          each foot's [ahead, up (negative), tilt]
//   ears, tail, cloth, clothRoot, kick  ears and tail (degrees), the kimono's hem and root, the hair
//                                       thrown up
//   mouth, lid, brows, extras, blush,   the face (blush and puffed cheeks too), and whether she's
//   puff, turned                        turned round (mid-spin)
//   front                               the sword drawn in front of her (stood before her)
// Each thing she does is a function of time giving a pose; switching from one to the next blends
// over a moment, so nothing ever jumps. The sword is a bone: drawn from her right hand where the
// arm really reached, along `sword`, so it never leaves her hand.
const REST = {
  tx: 0, by: 0, squat: 0, lift: 0, hx: 0, hy: 1, tilt: -3, hand: [-4.6, 0.6], free: [0.4, 0.2], sword: 'trail', skip: 0, abs: false,
  legF: [0.8, 0, 0], legB: [-0.8, 0, 0], hipIn: 0, ears: [4, 4], tail: 0, cloth: 0, clothRoot: 0, kick: 0,
  mouth: 'bored', lid: null, brows: [[-0.2, 0.2], [-0.2, 0.2]], extras: [], blush: 1, puff: false, turned: false, air: false, view: 'side', climb: 0, glow: 0, front: false, frontK: 0,
  flake: -1, snow: -1,
};
const pose = (o) => ({ ...REST, ...o });

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const ease = (t) => 1 - (1 - t) ** 3;
const easeIn = (t) => t * t;
const lerp = (a, b, t) => a + (b - a) * t;
const bump = (p, a, b) => (p < a || p > b ? 0 : Math.sin(((p - a) / (b - a)) * Math.PI));
const TAU = Math.PI * 2;
const lerp2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
// The sword trailing behind her, low.
const TRAIL = 2.9;
// Her right hand reaching along the sword's direction `a`, `r` out from the shoulder (the arm is in
// the rig's tall proportions, so its height is drawn shorter: hence the 0.6).
const handAlong = (a, r = 8) => [1.4 + Math.cos(a) * r, -9.4 + (Math.sin(a) * r) / 0.6];

// Standing about (a 21 s routine).
//   0-5.2 s    fed up: breathing; a big sigh (steam, ears flat back, the hair lifting as she breathes
//              in and dropping as she lets it out); fuming (a vein, ears pinned, the tail thumping);
//              a grudging tug at the sword; a long "..."
//   5.2-9.6    dozing off on her feet: leaning on it, her eyes closing, z's, her head sinking, ears
//              drooping, until it drops with a jerk and she snaps awake with a "!", wide-eyed, and
//              looks round as if nothing happened, a bead of sweat
//   9.6-12     a huge yawn, a hand to her mouth, ears back, a stretch of the tail
//   12-16.4    a snowflake: she watches one drift down onto her nose, "ah... ah..." and sneezes
//              it off (a puff of snow, ears and tail flung about), rubs her nose, "..."
//   16.4-21    a snowball: she squats, scoops up snow in her free hand and rolls it into a ball,
//              looks at it, lobs it straight up and watches it come down plop on her own head; a
//              deadpan "...", and she shakes it off
// Ears twitch now and then all through it.
function standing(t) {
  const c = t % 21;
  const tw = t % 3.3;
  const twitch = [-(tw < 0.12 ? 18 : 0), -(tw > 1.9 && tw < 2.02 ? 18 : 0)];
  // The fed-up breathing she comes out of and goes back into, for the routines below.
  const base = () => pose({
    by: 0.4 * Math.sin(t * 2.2), tilt: -3 + Math.sin(t * 1.1), ears: [4 + 3 * Math.sin(t * 1.3) + twitch[0], 4 + 3 * Math.sin(t * 1.3 - 0.8) + twitch[1]],
    tail: 9 * Math.sin(t * 1.7), cloth: Math.sin(t * 1.4) * 0.8 + Math.sin(t * 2.3 + 1) * 0.4,
  });
  if (c >= 16.4) {
    const e = c - 16.4;
    const k = ease(seg(e, 0, 0.35)) * (1 - ease(seg(e, 4.2, 4.6)));
    const down = ease(seg(e, 0, 0.4)) * (1 - ease(seg(e, 1.4, 1.8)));
    const roll = seg(e, 0.6, 1.4);
    const toss = seg(e, 2, 2.2);
    const watch = ease(seg(e, 2.15, 2.5)) * (1 - ease(seg(e, 2.9, 3)));
    const plop = bump(e, 2.98, 3.3);
    const hit = e > 2.98;
    const shake = e > 3.9 && e < 4.3 ? Math.sin(e * 46) * bump(e, 3.9, 4.3) : 0;
    const free = e < 0.6 ? lerp2([0.4, 0.2], [3.4, 14], down) : e < 1.6 ? [lerp(3.4, 2.6, ease(roll)) + 0.6 * Math.sin(e * 22) * (roll > 0 && roll < 1 ? 1 : 0), lerp(14, -3.4, ease(seg(e, 0.6, 1)))]
      : e < 2.2 ? lerp2([2.6, -3.4], [2, -13], ease(toss)) : lerp2([2, -13], [0.4, 0.2], ease(seg(e, 2.25, 2.8)));
    return { ...blend(base(), pose({
      squat: down, by: 2.4 * down, tilt: 16 * down + 5 * (e > 1.4 && e < 2) - 12 * watch + 10 * plop + 4 * shake, hy: 1 + 1.5 * down + 2.2 * plop, hx: 1.4 * shake, free, kick: 1.2 * plop + 0.6 * shake,
      mouth: hit ? 'flat' : watch > 0.3 ? 'o' : 'bored', lid: hit ? (plop > 0.2 ? 1 : 0.9) : watch > 0.3 ? 0.3 : 0.75, ears: [8 + 30 * plop + 10 * (hit ? 1 : 0), 10 + 30 * plop + 10 * (hit ? 1 : 0)],
      tail: hit ? 0 : 9 * Math.sin(t * 1.7), extras: e > 3.3 && e < 3.95 ? [`dots${Math.min(3, 1 + Math.floor((e - 3.3) * 5))}`] : [], snow: e,
    }), k), snow: e };
  }
  if (c >= 12) {
    const d = c - 12;
    const k = ease(seg(d, 0, 0.3)) * (1 - ease(seg(d, 4, 4.4)));
    const look = ease(seg(d, 0.1, 0.9)) * (1 - ease(seg(d, 2.3, 2.4)));
    const ah = seg(d, 1.4, 2.3) * (d < 2.3 ? 1 : 0);
    const choo = bump(d, 2.3, 2.8);
    const rub = bump(d, 2.85, 3.7);
    return { ...blend(base(), pose({
      tilt: -3 - 9 * look - 6 * ah + 16 * choo + 3 * rub, hy: 1 - 0.6 * look + 2.6 * choo, by: -0.8 * ah + 1.2 * choo, tx: -0.4 * ah + 0.8 * choo,
      free: lerp2([0.4, 0.2], [3.4, -7.4 + 0.5 * Math.sin(d * 34)], rub), kick: 2 * choo, cloth: 1.6 * choo,
      mouth: choo > 0.15 ? 'o' : ah > 0.3 ? 'ah' : d > 2.8 ? 'flat' : look > 0.5 ? 'tiny' : 'bored', lid: choo > 0.1 || ah > 0.6 ? 1 : look > 0.5 ? 0.2 : 0.8,
      brows: look > 0.5 && ah < 0.4 ? [[0.8, -0.3], [0.8, -0.3]] : REST.brows, ears: [4 - 12 * look + 26 * ah - 20 * choo + 20 * rub + twitch[0], 4 - 12 * look + 28 * ah - 22 * choo + 22 * rub + twitch[1]],
      tail: 9 * Math.sin(t * 1.7) * (1 - choo) + 40 * choo, extras: choo > 0.3 ? ['shock'] : d > 3.6 ? [`dots${Math.min(3, 1 + Math.floor((d - 3.6) * 6))}`] : [], flake: d,
    }), k), flake: d };
  }
  if (c >= 5.2 && c < 9.6) {
    const d = c - 5.2;
    const sleep = ease(seg(d, 0, 1.6));
    const nod = d > 3.2 && d < 3.45;
    const awake = d >= 3.45;
    const look = awake ? Math.sin((d - 3.45) * 9) * (1 - seg(d, 3.45, 4.4)) : 0;
    return pose({
      by: nod ? 1.6 : awake ? -0.8 * (1 - seg(d, 3.45, 3.8)) : 0.6 * sleep + 0.3 * Math.sin(t * 1.6),
      hy: nod ? 3.5 : awake ? 0 : 1 + 1.6 * sleep, hx: 1.2 * look, tilt: nod ? 9 : awake ? -3 : -3 + 7 * sleep,
      hand: [-4.6, 0.6 + 0.8 * sleep], free: [0.4, 0.6 * sleep], lid: awake ? 0 : 0.85 + 0.15 * sleep,
      mouth: awake ? (d < 3.9 ? 'o' : 'flat') : sleep > 0.6 ? 'tiny' : 'bored', brows: awake && d < 4 ? [[0.9, -0.3], [0.9, -0.3]] : REST.brows,
      extras: awake ? (d < 3.85 ? ['shock'] : ['sweat0']) : sleep > 0.5 ? [`zzz${Math.floor(t * 1.5) % 3}`] : [],
      ears: awake ? [-10 + twitch[0], -10 + twitch[1]] : [4 + 22 * sleep + twitch[0], 4 + 24 * sleep + twitch[1]],
      tail: awake ? 22 * (1 - seg(d, 3.45, 3.8)) : 4 * Math.sin(t * 0.8), kick: nod ? -1.5 : awake && d < 3.6 ? 1.5 : 0,
    });
  }
  if (c >= 9.6) {
    const y = bump(c, 9.7, 11.2);
    return pose({
      by: -0.6 * y, hy: 1 - 1.5 * y, tilt: -3 - 6 * y, mouth: y > 0.25 ? 'ah' : 'bored', lid: y > 0.25 ? 1 : null,
      free: [2.6 * y, -9 * y], ears: [4 + 24 * y + twitch[0], 4 + 26 * y + twitch[1]], tail: -18 * y, kick: y,
      extras: y > 0.3 && y < 0.9 && c > 10.4 ? ['tears'] : [],
    });
  }
  const p = c / 5.2;
  const sigh = bump(p, 0.08, 0.44);
  const inhale = bump(p, 0.08, 0.26);
  const out = bump(p, 0.26, 0.44);
  const fume = p > 0.44 && p < 0.76;
  const tug = p > 0.7 && p < 0.8;
  const extras = [];
  if (p > 0.12 && p < 0.42) extras.push(`steam${Math.min(2, Math.floor((p - 0.12) * 10))}`);
  if (fume) extras.push(Math.floor(t * 4) % 2 ? 'veinbig' : 'vein');
  if (p > 0.8) extras.push(`dots${Math.min(3, 1 + Math.floor((p - 0.8) * 15))}`);
  return pose({
    by: 0.4 * Math.sin(t * 2.2) - inhale + out * 1.2,
    hy: 1 + out,
    tilt: tug ? -7 : -3 + Math.sin(t * 1.1),
    tx: tug ? -1 : 0,
    hand: tug ? [-6, 0.4] : [-4.6, 0.6 - inhale],
    free: [0.4, 0.2 - inhale],
    skip: tug ? 0.08 : 0,
    ears: [4 + 3 * Math.sin(t * 1.3) + 34 * sigh + (fume ? 22 : 0) + twitch[0] - (tug ? 10 : 0), 4 + 3 * Math.sin(t * 1.3 - 0.8) + 34 * sigh + (fume ? 22 : 0) + twitch[1] - (tug ? 10 : 0)],
    tail: tug ? 20 : fume ? (Math.floor(t * 5) % 2 ? -26 : 8) : 9 * Math.sin(t * 1.7),
    cloth: (tug ? -2.5 : Math.sin(t * 1.4) * 0.8 + Math.sin(t * 2.3 + 1) * 0.4) + 1.2 * sigh * Math.sin(t * 9),
    kick: -1.2 * inhale + out,
    extras,
  });
}

// Waddling along dragging it (`p` the walk cycle, two steps; `t` the time): slow, short-legged steps, feet
// apart and barely lifted, her weight rocking from one foot onto the other (the body swaying
// over the planted foot and tipping with it, the head tipping back the other way), a little bob
// up as she rocks over each; the hand dips on each footfall and hauls the sword on, the tip
// skipping over the ground; ears flop with each step, the tail sways, the kimono trails.
function plodding(p, t) {
  const leg = (q) => [3 * Math.cos(TAU * q), -Math.max(0, 1.2 * Math.sin(TAU * q)), Math.cos(TAU * q) * 10];
  const u = (p * 2) % 1;
  const side = p < 0.5 ? 1 : -1;
  const rock = Math.sin(Math.PI * u);
  const flop = Math.exp(-u * 5) * Math.cos(u * 14);
  // Every 7 s or so the sword snags on something: she's yanked back with a "!", then turns and
  // glares at it, fuming, and waddles on.
  const c = t % 7;
  if (c < 0.9) {
    const yank = bump(c, 0, 0.3);
    const glare = seg(c, 0.25, 0.4) * (1 - seg(c, 0.75, 0.9));
    return pose({
      legF: leg(p), legB: leg(p + 0.5), hipIn: 0, by: 0.6, tx: -2.5 * yank - glare, tilt: -12 * yank - 4 * glare, hy: 1.5, hx: -1.5 * glare,
      hand: [-7 * Math.max(yank, glare * 0.6), 0.6], free: [3 * yank, -4 * yank - 2 * glare], skip: 0.1 * yank,
      mouth: yank > 0.2 ? 'o' : 'grit', lid: yank > 0.2 ? 0 : null, brows: glare > 0.3 ? [[-0.2, 0.9], [-0.2, 0.9]] : [[0.9, -0.3], [0.9, -0.3]],
      extras: yank > 0.2 ? ['shock'] : glare > 0.3 ? [Math.floor(t * 6) % 2 ? 'veinbig' : 'vein'] : [],
      ears: [30 * yank + 26 * glare, 32 * yank + 28 * glare], tail: 26 * yank, cloth: 2 * yank, kick: 1.6 * yank,
    });
  }
  return pose({
    legF: leg(p), legB: leg(p + 0.5), hipIn: 0,
    by: 0.6 - 0.9 * rock, tx: 0.5 + side * 1.5 * rock, tilt: -1 + side * 7 * rock, hy: 1.5, hx: -side * 0.5 * rock,
    hand: [-4.8 - 0.8 * side, 0.6 + 2.2 * Math.sin(Math.min(1, u / 0.4) * Math.PI)],
    free: [1.5 + side * 1.2 * rock, 0.4 - rock],
    skip: 0.03 * Math.abs(Math.sin(t * 13)) + 0.02 * Math.abs(Math.sin(t * 21 + 1)) + (u < 0.12 ? 0.05 : 0),
    ears: [10 + 20 * flop - side * 6 * rock, 10 + 20 * Math.exp(-u * 5) * Math.cos(u * 14 - 0.9) + side * 6 * rock], tail: side * 16 * rock - 6 * flop,
    cloth: -1 + side * 1.2 * rock, clothRoot: side * 0.5 * rock, kick: -1.2 * flop,
  });
}

// Running to catch up: longer strides, a real lean, the sword bouncing along behind, ears back,
// tongue out and panting, sweating.
function running(p, t) {
  const leg = (q) => [3.4 * Math.cos(TAU * q), -Math.max(0, 3 * Math.sin(TAU * q)), Math.cos(TAU * q) * 18];
  const u = (p * 2) % 1;
  return pose({
    legF: leg(p), legB: leg(p + 0.5), hipIn: 0.6,
    by: 1.2 * (1 - Math.sin(Math.PI * u)) - 0.6, lift: 1.2 * Math.sin(Math.PI * u), tx: 2, tilt: 2, hy: 0.5,
    hand: [-6, 1 + 1.4 * Math.sin(Math.PI * u)], free: [2.4 * Math.sin(TAU * p), -1.4],
    skip: 0.12 * Math.sin(Math.PI * u) + 0.02 * Math.sin(t * 40),
    ears: [24, 26], tail: 14 * Math.sin(TAU * p), cloth: -3, clothRoot: -1, kick: -1.6 * Math.sin(Math.PI * u),
    mouth: 'tongue', lid: 0.5, extras: [`sweat${Math.floor(t * 4) % 3}`], blush: 1.4,
  });
}

// In the air: legs tucked, the sword hanging off behind, hair and kimono thrown by the jump.
function airborne(vy) {
  const up = vy < 0;
  return pose({
    air: true, legF: [2.6, -5, 10], legB: [-1.6, -2.6, -10], by: up ? -1 : 0, tilt: up ? -2 : 2,
    hand: [-5, -1], free: [2, -3], sword: 2.5, ears: [up ? 26 : -6, up ? 28 : -8], tail: up ? -16 : 16, cloth: up ? 2 : -2, kick: up ? 1.5 : -1.5,
  });
}

// On a rope, seen from behind, hand over hand; the sword hangs on her back.
function climbing(y) {
  return pose({ view: 'back', climb: [2, 0, -2, 0][Math.floor(((y / 10) % 4) + 4) % 4], sword: Math.PI / 2 });
}

// ---------- What she does ----------

// The spin (her swing, and Fine, I'll Go once she's there). She digs in and twists to get the sword
// moving (strained); it whips round her once, fast (it lands at 0.46 s); its weight drags her on
// round past where she meant to stop; she stands there dizzy while it sinks back to the ground.
function spinning(t) {
  if (t < 0.28) {
    const k = ease(t / 0.28);
    const a = lerp(TRAIL, TRAIL + 0.5, k) + Math.sin(t * 90) * 0.04 * k;
    return pose({ sword: a, hand: handAlong(a, lerp(6, 8, k)), squat: 2 * k, tx: -1.5 * k, tilt: -6 * k, legF: [3, 0, 2], legB: [-3, 0, -2], mouth: 'grit', ears: [16, 18], tail: -10 * k, cloth: 1.5 * k });
  }
  // From here the angle is on screen as seen: it runs on round, and she turns with it.
  const whip = ease(seg(t, 0.28, 0.6));
  const over = 1 - (1 - seg(t, 0.6, 0.86)) ** 2;
  const turnsDone = whip + 0.45 * over;
  const a = TRAIL + 0.5 + TAU * turnsDone;
  const dizzy = seg(t, 0.86, 1.2);
  const sway = Math.sin(dizzy * Math.PI * 3) * (1 - dizzy);
  const turned = Math.cos(TAU * turnsDone) < 0;
  if (dizzy > 0) {
    // Settling: back to dragging it, wobbling.
    const settle = ease(dizzy);
    const from = TRAIL + 0.5 + TAU * 1.45;
    const to = TRAIL + TAU * 2;
    const b = lerp(from, to, settle);
    return pose({ sword: b, hand: handAlong(turned ? Math.PI - b : b, lerp(8, 6, settle)), abs: true, turned, tilt: 8 * sway - 3, tx: Math.round(2 * sway), squat: 1, legF: [2.4, 0, 2], legB: [-2.4, 0, -2], mouth: 'wavy', extras: [`orbit${Math.floor(t * 12) % 8}`], ears: [26 - 10 * settle, 30 - 10 * settle], tail: 14 * sway, cloth: -2 * sway });
  }
  return pose({ sword: a, hand: handAlong(turned ? Math.PI - a : a, 8), abs: true, turned, lift: 3 * bump(t, 0.3, 0.6), tx: 2 * over, squat: whip < 1 ? 0 : 1, legF: [3, 0, 2], legB: [-3, 0, -2], tilt: 4, mouth: 'open', ears: [30, 32], tail: -20, cloth: -3, clothRoot: -1.5, kick: -1.5 });
}

// The slam: she heaves it up over her head, trembling, leaning back under it; it comes down all at
// once (lands at 0.6 s) and buries itself in the ground; a beat of stillness; it's stuck: two tugs,
// and on the second it comes free all at once and she goes over backwards onto her bottom, feet in
// the air, the sword flopping down behind her; she sits a beat, fuming, and gets up.
function slamming(t) {
  const UP = TRAIL + 1.15;
  const DOWN = TAU + 0.45;
  if (t < 0.5) {
    const k = ease(t / 0.5);
    const a = lerp(TRAIL, UP, k) + Math.sin(t * 150) * 0.05 * k;
    return pose({ sword: a, hand: handAlong(a, 8.5), squat: k < 0.5 ? 2 : 1, tx: -1.5 * k, tilt: -7 * k, hy: 1 - 1.5 * k, legF: [3, 0, 2], legB: [-3, 0, -2], mouth: 'grit', ears: [24, 26], tail: -14 * k, free: [-1, -6 * k], kick: -k, puff: k > 0.5 });
  }
  if (t < 0.6) {
    const k = easeIn(seg(t, 0.5, 0.6));
    const a = lerp(UP, DOWN, k);
    return pose({ sword: a, hand: handAlong(a, 9), tx: lerp(-1.5, 3, k), tilt: lerp(-7, 9, k), squat: 3 * k, legF: [3.6, 0, 4], legB: [-3, 0, -10], mouth: 'yell', ears: [30, 32], tail: 20 * k, cloth: 2.5 * k, kick: 1.5 * k });
  }
  if (t < 0.92) {
    // Stuck: the hit held, then two tugs leaning back on the grip.
    const tug = bump(t, 0.7, 0.78) + 1.4 * bump(t, 0.82, 0.92);
    const a = DOWN - 0.07 * tug;
    return pose({ sword: a, hand: handAlong(a, 9 - 1.5 * tug), tx: 3 - 4 * tug, tilt: 9 - 14 * tug, squat: t < 0.68 ? 3 : 2, legF: [3.6, 0, 4], legB: [-3, 0, -10], mouth: tug > 0.3 ? 'grit' : 'flat', puff: tug > 0.6, ears: [20 + 10 * tug, 22 + 10 * tug], tail: 10 - 20 * tug, extras: t > 0.7 ? ['sweat0'] : [] });
  }
  if (t < 1.2) {
    // Free! Over she goes: sat down hard, feet up, the sword flopping over behind her.
    const k = ease(seg(t, 0.92, 1.02));
    const a = lerp(DOWN - 0.1, TRAIL + TAU, k);
    const flail = 1 - seg(t, 1.0, 1.2);
    return pose({
      sword: a, hand: handAlong(a, lerp(9, 6, k)), squat: 3, tx: -2.5 * k, tilt: -14 * k + 4 * seg(t, 1.0, 1.2), by: 1.5 * k,
      legF: [3.4, -4 * k * flail - 1, 30 * k], legB: [2.4, -3 * k * flail - 0.5, 18 * k], free: [-3, -6 * flail],
      mouth: 'o', lid: 0, brows: [[0.9, -0.3], [0.9, -0.3]], extras: ['shock'], ears: [38, 40], tail: 30 * flail, cloth: 3 * flail, kick: 2 * flail,
    });
  }
  // Sat a beat, fuming, then up again, dusting herself off.
  const up = ease(seg(t, 1.3, 1.45));
  return pose({
    sword: TRAIL + TAU, squat: 3 - 3 * up, tx: -2.5 * (1 - up), tilt: lerp(-10, -3, up), by: 1.5 * (1 - up),
    legF: [lerp(3.4, 0.8, up), -1 * (1 - up), 30 * (1 - up)], legB: [lerp(2.4, -0.8, up), -0.5 * (1 - up), 18 * (1 - up)], free: [-2 + 2 * up, -1],
    mouth: 'grit', brows: [[-0.2, 0.9], [-0.2, 0.9]], extras: [Math.floor(t * 6) % 2 ? 'veinbig' : 'vein'], ears: [26, 28], tail: Math.floor(t * 8) % 2 ? -20 : 10,
  });
}

// The crescent flick: barely bothering. Mid-yawn, eyes shut, not even looking, she tips the blade
// up a little and flicks her free hand at them (the crescent leaves at 0.25 s); the sword drops
// back down with a little slump.
function flicking(t) {
  const up = bump(t, 0, 0.4);
  const flick = bump(t, 0.15, 0.32);
  const yawn = bump(t, 0.05, 0.5);
  return pose({ sword: TRAIL + 0.35 * up, hand: [-4.6, 0.6 - up], free: [3 + 3 * flick, -6 * flick - 2 * up], tilt: -3 + 3 * flick - 4 * yawn, hy: 1 - yawn, tx: flick, squat: t > 0.4 && t < 0.5 ? 1 : 0, glow: 1 - seg(t, 0.3, 0.55), ears: [6 + 16 * yawn, 6 + 18 * yawn], tail: 6 * flick, mouth: yawn > 0.3 ? 'ah' : 'bored', lid: yawn > 0.3 ? 1 : null, kick: yawn });
}

// Moonfall: she drags the sword up to point at the sky, cheeks puffed, shaking harder and harder
// (the crescent lights, sweat flies), holds it there while the moonlight comes down (0.42-0.55 s),
// then can't any more: it topples forward and drags her a stumbling step after it; she hauls it
// back down behind her with a long "...".
function casting(t) {
  const SKY = TAU - Math.PI / 2;
  if (t < 0.35) {
    const k = ease(t / 0.35);
    const a = lerp(TRAIL, SKY, k) + Math.sin(t * 130) * 0.04 * k;
    return pose({ sword: a, hand: handAlong(a, 9), squat: 2, tilt: -6 * k, hy: 1 - 1.5 * k, legF: [2.6, 0, 2], legB: [-2.6, 0, -2], mouth: 'grit', puff: k > 0.4, glow: k, free: [-1, -5 * k], ears: [10, 12] });
  }
  if (t < 0.6) {
    const shake = 0.03 + 0.08 * seg(t, 0.35, 0.6);
    const a = SKY + Math.sin(t * 160) * shake;
    return pose({ sword: a, hand: handAlong(a, 9.5), squat: 1, tilt: -6 + Math.sin(t * 90) * 2, hy: -0.5, tx: Math.sin(t * 70), legF: [2.6, 0, 2], legB: [-2.6, 0, -2], mouth: 'flat', puff: true, blush: 1.6, glow: 1, free: [2, -9], ears: [-4, -4], tail: 10, extras: [`sweat${Math.floor(t * 12) % 3}`] });
  }
  if (t < 0.78) {
    // It goes, and takes her with it a step.
    const k = easeIn(seg(t, 0.6, 0.7));
    const step = seg(t, 0.66, 0.78);
    const a = lerp(SKY, TAU + 0.4, k);
    return pose({ sword: a, hand: handAlong(a, 9), tx: 2 * k + 2 * step, tilt: lerp(-6, 12, k), squat: 2 * k, legF: [3.4 + 1.5 * step, -2 * bump(t, 0.66, 0.78), 4], legB: [-2.6, 0, -8], mouth: 'o', lid: 0, brows: [[0.9, -0.3], [0.9, -0.3]], extras: ['shock'], glow: 1 - k, ears: [30, 32], tail: 24, free: [4, -4] });
  }
  const k = ease(seg(t, 0.78, 1));
  const a = lerp(TAU + 0.4, TRAIL + TAU, k);
  return pose({ sword: a, hand: handAlong(a, lerp(9, 6, k)), tx: 4 * (1 - k), tilt: lerp(10, -3, k), squat: 1 - k, mouth: 'flat', ears: [12, 14], extras: [`dots${1 + Math.min(2, Math.floor(k * 3))}`] });
}

// Lunar Howl: head thrown back, a grudging howl, ears back, the tail up; then her voice cracks
// into a squeak, and she goes red and looks away with a "...".
function howling(t) {
  const k = ease(seg(t, 0, 0.2)) * (1 - ease(seg(t, 0.5, 0.6)));
  const crack = seg(t, 0.5, 0.58);
  return pose({
    hy: 1 - 2 * k, hx: -1.2 * crack, tilt: -3 - 9 * k + 3 * crack, by: -0.6 * k, mouth: k > 0.3 ? 'ah' : crack > 0 ? 'wavy' : 'bored', lid: k > 0.3 ? 0.6 : crack > 0 ? 0.5 : null,
    blush: 1 + 1.2 * crack, extras: crack > 0 ? [`dots${1 + Math.min(2, Math.floor(seg(t, 0.55, 0.8) * 3))}`, 'sweat0'] : [],
    ears: [4 + 26 * k + 20 * crack, 4 + 28 * k + 20 * crack], tail: -24 * k - 10 * crack, free: [2 * k + 3 * crack, -4 * k - 6 * crack], kick: k, cloth: 1.5 * k,
  });
}

// Moon Ward: she drives the greatsword point-down into the ground in front of her and leans on it,
// half asleep behind it, a yawn on the way. (The ground hides the blade's lower half: it's driven in.)
function warding(t) {
  const k = ease(seg(t, 0, 0.15)) * (1 - ease(seg(t, 0.55, 0.7)));
  // Her hand up on the grip, the blade stood point-down in the ground before her.
  const a = lerp(TRAIL, TAU + 1.42, k);
  const h = handAlong(lerp(TRAIL, TAU - 1.2, k), lerp(6, 9.5, k));
  const yawn = bump(t, 0.2, 0.6);
  return pose({ sword: a, hand: h, front: k > 0.05, frontK: k, squat: k, tilt: 6 * k - 4 * yawn, tx: 1.5 * k, hy: 1 + 1.5 * k - yawn, legF: [2, 0, 2], legB: [-2.4, 0, -2], mouth: yawn > 0.3 ? 'ah' : 'bored', lid: 0.95, ears: [16 * k + 10 * yawn, 18 * k + 10 * yawn], tail: 4 * Math.sin(t * 4), free: [2 * k, -1 - 7 * yawn], extras: k > 0.5 && yawn < 0.3 ? ['zzz0'] : [] });
}

// The leap (a target out of her reach), played for laughs: the sword is too heavy for her, so it's
// the sword that does the leaping and she goes along with it.
//   0-0.45 s   "ugh, fine": a sigh with a huff of steam and her ears flat, then two little bounces
//              in a crouch to gather herself, dragging the sword round
//   0.45-0.9   she heaves it up and it yanks her into the air: wide-eyed, mouth open, a "!", legs
//              pedalling, the free arm flailing, ears streaming, tail whirling, hair and kimono
//              flying; at the top it tips over, and she comes down screaming behind it
//   0.9-1.75   the crash, seeing stars, then the slam's end lag from there: stuck, the tug that
//              sends her over backwards, fuming as she gets up
function leaping(t) {
  if (t < 0.45) {
    const sigh = bump(t, 0, 0.14);
    const bounce = t < 0.12 ? 0 : Math.abs(Math.sin((Math.PI * (t - 0.12)) / 0.165));
    const k = ease(seg(t, 0.12, 0.45));
    const sw = TRAIL + 0.4 * k;
    return pose({
      sword: sw, hand: handAlong(sw, 7), squat: t < 0.12 ? 1 : 1 + 2 * bounce, by: sigh, hy: 1 + sigh, tilt: -3 + 9 * k, tx: 1.5 * k,
      legF: [3, 0, 2], legB: [-3, 0, -2], free: [-2 * k, -1 + bounce], mouth: t < 0.12 ? 'flat' : 'grit', ears: [10 + 30 * sigh + 14 * k, 10 + 30 * sigh + 16 * k],
      tail: 10 * Math.sin(t * 30) * k, cloth: -1.5 * k, kick: -bounce, extras: t < 0.14 ? [`steam${Math.min(2, Math.floor(t * 20))}`] : [],
    });
  }
  if (t < 0.9) {
    const f = seg(t, 0.45, 0.9);
    const UPF = TAU - 1.25;
    const DOWN = TAU + 0.45;
    // The sword's path: whipped up and over in front of her, held aloft at the top, brought down.
    const sw = f < 0.25 ? lerp(TRAIL + 0.4, UPF + 0, ease(f / 0.25)) : f < 0.72 ? UPF - 0.25 * Math.sin(((f - 0.25) / 0.47) * Math.PI) : lerp(UPF, DOWN, easeIn(seg(f, 0.72, 1)));
    const pedal = t * 42;
    const down = f >= 0.72;
    return pose({
      air: true, sword: sw, hand: handAlong(sw, 9.5), tilt: down ? 10 : lerp(10, 2, seg(f, 0, 0.5)), tx: 2, by: -1,
      legF: down ? [2.6, -5, 10] : [2.4 * Math.sin(pedal), -3.5 - 1.5 * Math.cos(pedal), 20 * Math.sin(pedal)],
      legB: down ? [-1.6, -2.6, -10] : [2.4 * Math.sin(pedal + Math.PI), -3.5 - 1.5 * Math.cos(pedal + Math.PI), 20 * Math.sin(pedal + Math.PI)],
      free: down ? [2, -6] : [2.5 * Math.sin(t * 36), -5 + 3 * Math.cos(t * 36)],
      mouth: down ? 'yell' : 'D', lid: 0, brows: [[0.9, -0.3], [0.9, -0.3]], extras: down ? ['sweat0'] : f < 0.5 ? ['shock'] : ['sweat0'],
      ears: [44 + 6 * Math.sin(t * 50), 46 + 6 * Math.sin(t * 50 + 1)], tail: 30 * Math.sin(t * 28), cloth: down ? -3 : 3, clothRoot: down ? -1 : 1.5, kick: down ? -2 : 2,
    });
  }
  // Down: the slam's crash and end lag, but dazed first and cross after.
  const u = t - 0.9;
  const p = slamming(0.6 + u);
  if (u < 0.1) return { ...p, mouth: 'wavy', lid: 0.4, extras: [`orbit${Math.floor(t * 14) % 8}`], ears: [34, 30], tail: -8 };
  return p;
}

// Last Straw (the finisher): she snaps.
//   0-0.6 s    fuming: shaking, steam pouring off her, a great vein, eyes wide open and blazing,
//              brows down, teeth gritted, red in the face, hair and tail bristling, ears pinned
//   0.6-0.95   she lifts the sword in one hand as if it weighed nothing and twirls it overhead
//   0.95-1.25  and leaps, screaming, the sword raised behind her
//   1.25-1.55  down (it lands at 1.35 s), the sword buried, crouched in the crash
//   1.55-2.7   spent: the sword topples back over her head (bonk), and she keels over backwards and
//              falls asleep where she sits
function strawing(t) {
  const SKY = TAU - Math.PI / 2;
  const DOWN = TAU + 0.45;
  const angry = { lid: 0, brows: [[-0.2, 0.9], [-0.2, 0.9]], blush: 1.8 };
  if (t < 0.6) {
    const k = ease(t / 0.3);
    return pose({
      ...angry, squat: 2 * k, tx: Math.sin(t * 80) * 0.8 * k, tilt: -2 + Math.sin(t * 60) * 2 * k, sword: TRAIL, skip: Math.abs(Math.sin(t * 50)) * 0.06 * k,
      hand: [-4.6, 1.4], free: [1.6, 1.2], legF: [2.6, 0, 2], legB: [-2.6, 0, -2], mouth: 'grit',
      extras: ['veinbig', `steam${Math.floor(t * 12) % 3}`], ears: [44, 46], tail: 30 * Math.sin(t * 40), kick: 2 * k, cloth: Math.sin(t * 50) * 1.5,
    });
  }
  if (t < 0.95) {
    const k = ease(seg(t, 0.6, 0.72));
    const spin = SKY + TAU * 3 * ease(seg(t, 0.68, 0.95));
    const a = lerp(TRAIL, SKY, k) + (t > 0.68 ? spin - SKY : 0);
    return pose({ ...angry, sword: a, hand: handAlong(lerp(TRAIL, SKY, k), 9.5), squat: 1, legF: [2.6, 0, 2], legB: [-2.6, 0, -2], mouth: 'yell', extras: ['veinbig'], ears: [44, 46], tail: 24, kick: 2, cloth: 2, free: [3, -2] });
  }
  if (t < 1.25) {
    const k = ease(seg(t, 0.95, 1.25));
    const a = lerp(SKY, SKY - 0.7, k);
    return pose({ ...angry, air: true, lift: 40 * k, sword: a, hand: handAlong(a, 9.5), legF: [2.6, -5, 10], legB: [-1.6, -2.6, -10], tilt: -4, mouth: 'yell', extras: ['veinbig'], ears: [46, 48], tail: -24, kick: 2.5, cloth: 3, free: [3, -6] });
  }
  if (t < 1.55) {
    const k = easeIn(seg(t, 1.25, 1.35));
    const a = lerp(SKY - 0.7, DOWN, k);
    return pose({ ...angry, lift: 40 * (1 - k), sword: a, hand: handAlong(a, 9.5), squat: 3 * k, tilt: lerp(-4, 10, k), tx: 3 * k, legF: [3.6, 0, 4], legB: [-3, 0, -10], mouth: 'yell', ears: [40, 42], tail: 24, kick: -2 * k, cloth: -3 });
  }
  // Spent.
  const fall = ease(seg(t, 1.55, 1.8));
  const a = lerp(DOWN, TRAIL + TAU, ease(seg(t, 1.6, 1.85)));
  const asleep = t > 1.9;
  return pose({
    sword: a, hand: handAlong(a, lerp(9, 6, fall)), squat: 3, by: 1.5 * fall, tx: -2.5 * fall, tilt: -3 - 12 * fall, hy: 1 + 2 * fall,
    legF: [3.4, -1, 30 * fall], legB: [2.4, -0.5, 18 * fall], free: [-1, 1],
    mouth: asleep ? 'tiny' : 'o', lid: asleep ? 1 : 0.5, extras: t > 1.8 && t < 1.95 ? ['bang'] : asleep ? [`zzz${Math.floor(t * 1.5) % 3}`] : ['orbit0'],
    ears: [30 * fall, 34 * fall], tail: 0, kick: 0,
  });
}

// Snack Time: she spots the cookie coming (eyes wide), catches it in one hand with a little hop,
// and munches it, eyes squeezed happy, blushing, hearts, the tail going.
function snacking(t) {
  const catchIt = bump(t, 0.15, 0.4);
  const munch = t > 0.35;
  return pose({
    lift: 3 * catchIt, free: munch ? [3, -8] : [2, -11 * seg(t, 0.1, 0.3)], hy: munch ? 1.5 : 0, tilt: munch ? 2 : -4,
    mouth: munch ? (Math.floor(t * 9) % 2 ? 'cat' : 'o') : 'o', lid: munch ? 0.6 : 0, blush: munch ? 1.6 : 1,
    extras: munch ? ['hearts'] : ['shock'], ears: [-12, -12], tail: 26 * Math.sin(t * 22), kick: catchIt,
  });
}

// Happy (Snack Time): ears up, tail wagging, eyes open and smiling, a little bounce, humming; she
// keeps up instead of waddling. Laid over whatever she's doing that doesn't have a face of its own.
function happier(p, t, standing) {
  const own = !['bored', 'flat', 'grit'].includes(p.mouth) || p.extras.length;
  return {
    ...p, ears: [Math.min(p.ears[0], 0) - 8, Math.min(p.ears[1], 0) - 8], tail: 24 * Math.sin(t * 14), blush: 1.3,
    ...(own ? {} : { mouth: 'smile', lid: 0.1, extras: standing && t % 2.4 < 1.2 ? ['note'] : [] }),
    ...(standing ? { by: p.by - 0.6 * Math.abs(Math.sin(t * 5)), tilt: -1 + 3 * Math.sin(t * 2.5), hand: p.hand } : {}),
  };
}

// Just after Snack Time wears off: she slumps right back, with a "...".
function slumped(p, k) {
  return { ...p, ears: [p.ears[0] + 30 * k, p.ears[1] + 32 * k], hy: p.hy + 1.5 * k, by: p.by + k, mouth: 'flat', lid: 0.95, extras: [`dots${1 + Math.min(2, Math.floor((1 - k) * 4))}`], tail: 0 };
}

// Sleeve Junk: she rummages around in her big sleeve with her free hand, head down, peering in;
// pulls something out and, eyes shut, not even looking, lobs it overhand (it leaves at 0.42 s);
// her arm flops back down. If it's a cookie, she stops, looks at it, and eats it instead.
function tossing(t, a) {
  const rummage = t < 0.32;
  if (a?.item === 'cookie' && t > 0.32) {
    const munch = t > 0.5;
    return pose({ free: munch ? [3, -8] : [2, -6], hy: munch ? 1.5 : 0.5, lid: munch ? 0.6 : 0, brows: munch ? REST.brows : [[0.9, -0.3], [0.9, -0.3]], mouth: munch ? (Math.floor(t * 9) % 2 ? 'cat' : 'o') : 'o', blush: munch ? 1.5 : 1, extras: munch ? ['hearts'] : ['q'], ears: [-6, -6], tail: munch ? 20 * Math.sin(t * 20) : 0 });
  }
  if (rummage) {
    const dig = Math.sin(t * 40) * 0.8;
    return pose({ free: [-4 + dig, -1], hx: -1, hy: 2.2, tilt: 4, mouth: 'flat', lid: 0.6, ears: [12, 14], tail: 4 * Math.sin(t * 10) });
  }
  const up = seg(t, 0.32, 0.42);
  const out = seg(t, 0.42, 0.52);
  const flop = seg(t, 0.55, 0.75);
  return pose({
    free: up < 1 ? [lerp(-4, -1, up), lerp(-1, -12, up)] : out < 1 ? [lerp(-1, 6, out), lerp(-12, -5, out)] : [lerp(6, 0.4, flop), lerp(-5, 0.6, flop)],
    tilt: up < 1 ? -4 * up : 6 * (1 - flop), tx: out * (1 - flop), hx: -0.8, hy: 1, lid: 1, mouth: 'bored', ears: [6, 6], tail: 8 * out * (1 - flop),
  });
}

const DOING = { toss: tossing, swing: spinning, slam: slamming, flick: flicking, cast: casting, howl: howling, ward: warding, leap: leaping, straw: strawing, snack: snacking };

// Blending: every number eases over, angles the short way round.
function blend(a, b, k) {
  if (k >= 1) return b;
  const out = { ...b };
  for (const key of Object.keys(b)) {
    const x = a[key];
    const y = b[key];
    if (typeof y === 'number' && typeof x === 'number') out[key] = key === 'sword' ? x + angleDiff(x, y) * k : lerp(x, y, k);
    else if (Array.isArray(y) && Array.isArray(x) && typeof y[0] === 'number') out[key] = y.map((v, i) => lerp(x[i], v, k));
  }
  return out;
}
const angleDiff = (a, b) => ((((b - a) % TAU) + TAU * 1.5) % TAU) - Math.PI;

// ---------- Drawing her ----------

const q = (v) => Math.round(v * 2) / 2;
const deg3 = (v) => Math.round(v / 3) * 3;
// Her state between frames: the walk cycle, the blend from what she was doing, the hair spring,
// her blinks, the dust off the tip, and where her hand was (to lay the sword on the ground from).
const STATE = new WeakMap();

export function drawSnowWolf(ctx, world, s, cam, time) {
  let st = STATE.get(s);
  if (!st) STATE.set(s, (st = { last: time, phase: 0, doing: null, from: null, since: -9, shown: null, hair: 0, hairV: 0, tip: 0, tipV: 0, handY: null, dust: [] }));
  const dt = Math.max(0, Math.min(0.1, time - st.last));
  st.last = time;
  const dir = s.dir || 1;
  const x = Math.round(s.x - cam.x);
  const y = Math.round(s.y - cam.y);
  const body = s.body ?? { onGround: true, rope: null, vy: 0, y: s.y };
  const a = s.act;
  const t = a ? (world.now - a.t0) * (a.speed ?? 1) : 0;
  // What she's doing, and her pose for it.
  let doing;
  let p;
  if (a?.kind === 'leap') {
    doing = 'leap';
    p = leaping(t);
  } else if (body.rope) {
    doing = 'climb';
    p = climbing(body.y);
  } else if (!body.onGround) {
    doing = 'air';
    p = airborne(body.vy);
  } else if (a && a.kind === 'go' && a.phase === 'spin') {
    doing = 'swing';
    p = spinning(t);
  } else if (a && DOING[a.kind]) {
    doing = a.kind;
    p = DOING[a.kind](t, a);
  } else if (s.moving) {
    // Her stride, in her own (smaller) body px a cycle: long slow waddling steps (about two and a
    // half a second at her pace), a quicker run.
    const run = s.hurry || (a?.kind === 'go') || Boolean(s.happy);
    st.phase = (st.phase + (Math.abs(s.vx) * dt) / ((run ? 34 : 42) * SCALE)) % 1;
    doing = run ? 'run' : 'walk';
    p = run ? running(st.phase, time) : plodding(st.phase, time);
  } else {
    doing = 'stand';
    p = standing(time);
  }
  // Happy (Snack Time) brightens whatever has no face of its own; just after, she slumps.
  if (s.happy) {
    st.happyEnd = null;
    if (doing === 'run' && !s.hurry) p = { ...p, mouth: 'smile', lid: 0.1, extras: [], blush: 1.3 };
    if (doing === 'stand' || doing === 'walk' || doing === 'run') p = happier(p, time, doing === 'stand');
  } else if (st.wasHappy) st.happyEnd = time;
  st.wasHappy = Boolean(s.happy);
  if (st.happyEnd != null && time - st.happyEnd < 1.6 && (doing === 'stand' || doing === 'walk')) p = slumped(p, 1 - (time - st.happyEnd) / 1.6);
  // Fed Up the crescent burns; Queen's Awakening opens her eyes.
  const fed = wild(world);
  const awake = fed && procOf(world.char, 'alpha');
  p.glow = Math.max(p.glow, fed ? 0.6 + 0.3 * Math.sin(time * 6) : 0);
  // Dragged: the sword's angle comes from how high her hand is over the ground.
  const trail = () => trailAngle(st.handY == null ? HILT_Y * SCALE : y - st.handY) + p.skip;
  if (p.sword === 'trail') p.sword = trail();
  // A new thing to do blends in from wherever she was.
  if (doing !== st.doing) {
    st.from = st.shown;
    st.since = time;
    st.doing = doing;
  }
  const k = st.from ? ease(clamp01((time - st.since) / 0.14)) : 1;
  const P = st.from ? blend(st.from, p, k) : p;
  st.shown = P;
  // The hair: a spring that swings after her and is thrown about by what she does.
  const pull = -(s.moving ? s.vx / 60 : 0) * dir + (P.kick ?? 0);
  [st.hair, st.hairV] = spring(st.hair, st.hairV, pull, 60, 7, dt);
  [st.tip, st.tipV] = spring(st.tip, st.tipV, st.hair, 40, 5, dt);
  const look = { ...SNOW_LOOK, mouth: P.mouth, lid: P.lid ?? (awake ? 0.15 : SNOW_LOOK.lid) };
  const blink = (time * 0.31) % 1;
  const facing = P.turned ? -dir : dir;
  const rig = {
    view: P.view, tx: q(P.tx), by: q(P.by), squat: q(P.squat), lift: q(P.lift), hx: q(P.hx), hy: q(P.hy), tilt: deg3(P.tilt),
    backArm: [q(P.hand[0]), q(P.hand[1])], frontArm: [q(P.free[0]), q(P.free[1])], armSide: 0.6,
    frontLeg: [q(P.legF[0]), q(P.legF[1]), deg3(P.legF[2])], backLeg: [q(P.legB[0]), q(P.legB[1]), deg3(P.legB[2])], hipIn: Math.round(P.hipIn * 4) / 4, air: P.air,
    hair: q(Math.max(-3, Math.min(3, st.hair))), hairTip: q(Math.max(-4, Math.min(4, st.tip))), hairLift: q(-(P.kick ?? 0)), hairWave: Math.floor((((time / 2.6) % 1) + 1) % 1 * 8),
    cape: q(P.cloth), capeRoot: q(P.clothRoot), ears: [deg3(P.ears[0]), deg3(P.ears[1])], tail: deg3(P.tail), climb: P.climb,
    eyes: blink < 0.012 || (blink > 0.03 && blink < 0.042) ? 'half' : blink < 0.03 ? 'blink' : 'open',
    face: { brows: P.brows, extra: P.extras, blush: P.blush, puff: P.puff },
  };
  if (body.onGround && !body.rope) footShadow(ctx, x, y, 9, 0, 0.8);
  // Dust off the dragged tip.
  drawDust(ctx, st.dust, cam, dt);
  const floor = !body.onGround || body.rope ? null : (() => {
    const T = ctx.getTransform();
    return T.b * x + T.d * (y + 1) + T.f;
  })();
  const drawBlade = (c, hand, flip) => {
    st.handY = hand[1];
    c.save();
    if (floor != null) {
      // Nothing below her feet: a sword brought down on the ground bites into it.
      const T = c.getTransform();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.beginPath();
      c.rect(-1e5, -1e5, 2e5, floor + 1e5);
      c.clip();
      c.setTransform(T);
    }
    c.translate(hand[0], hand[1]);
    // Stood before her, it's a step out ahead of her hand, its guard below her chin.
    if (P.front) c.translate((flip ? -1 : 1) * 14 * SCALE * P.frontK, 8 * SCALE * P.frontK);
    // Her facing mirrors the sword with her, unless the angle is already as seen (a spin).
    if (P.abs ? dir < 0 : flip) c.scale(-1, 1);
    c.rotate(P.sword);
    c.translate(-GRIP * SCALE, 0);
    paintSword(c, SCALE, P.glow);
    c.restore();
    if (doing === 'walk' || doing === 'run') {
      const ang = (flip ? Math.PI - P.sword : P.sword);
      if (Math.random() < dt * (doing === 'run' ? 40 : 28)) {
        const tx = hand[0] + Math.cos(ang) * (LEN - GRIP) * SCALE + cam.x;
        st.dust.push({ x: tx, y: s.y - 1, vx: -dir * (10 + Math.random() * 30), vy: -20 - Math.random() * 40, life: 0.5, t: 0, spark: Math.random() < 0.15, r: 1 + Math.random() * 1.6 });
      }
    }
  };
  const over = P.view === 'back' || P.front;
  const mouth = doing === 'stand' && (P.flake >= 0 || P.snow >= 0) ? posedMouth(x, y, rig, { scale: SCALE, facing }) : null;
  drawPosed(ctx, look, x, y, rig, {
    scale: SCALE, facing, under: over ? null : drawBlade,
    over: (c, hand, flip, other) => {
      if (over) drawBlade(c, hand, flip);
      if (mouth) drawIdleProps(c, P, st, other, mouth, dir);
    },
  });
}

// What she plays with standing about, drawn from where her hand and face really are: the
// snowflake that lands on her nose (and the puff of snow she sneezes it away in), and the snowball
// scooped up in her free hand, lobbed up and come down on her head (a cap of snow, shaken off).
function drawIdleProps(c, P, st, free, mouth, dir) {
  const nose = [mouth[0] - dir * 2.3, mouth[1] + 2.4];
  const head = [mouth[0] - dir * 2.6, mouth[1] - 13.5];
  c.save();
  const d = P.flake;
  if (d >= 0 && d < 2.34) {
    const f = Math.min(1, d / 1);
    const fx = nose[0] + dir * (16 * (1 - f) + 5 * Math.sin(f * 9) * (1 - f));
    const fy = nose[1] - 46 * (1 - f) - 0.6;
    flake(c, fx, fy, 1.8, d * 2);
  }
  if (d >= 2.3 && d < 2.9) {
    // The sneeze: a puff of snow blown off ahead of her nose.
    const u = (d - 2.3) / 0.6;
    c.globalAlpha = 1 - u;
    c.fillStyle = '#f6fbff';
    for (let i = 0; i < 7; i++) {
      const a = -0.5 + (i / 6) * 1;
      const r = 3 + 14 * ease(u) * (0.6 + 0.4 * ((i * 37) % 7) / 7);
      c.beginPath();
      c.arc(nose[0] + dir * Math.cos(a) * r, nose[1] + Math.sin(a) * r * 0.7, 1.4 * (1 - 0.5 * u), 0, TAU);
      c.fill();
    }
    c.globalAlpha = 1;
  }
  const e = P.snow;
  if (e >= 0.35 && e < 0.75) {
    // Scooping: snow kicked up off the ground under her hand.
    const u = (e - 0.35) / 0.4;
    c.fillStyle = '#f6fbff';
    c.globalAlpha = 1 - u;
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.arc(free[0] + dir * (i - 2) * 1.6 * (0.5 + u), free[1] + 1 - 5 * Math.sin(u * Math.PI) * (0.5 + (i % 2) * 0.5), 0.7, 0, TAU);
      c.fill();
    }
    c.globalAlpha = 1;
  }
  if (e >= 0.5 && e < 2.2) {
    st.ballAt = [free[0], free[1] - 1.8];
    snowball(c, st.ballAt[0], st.ballAt[1], 2.6 * ease(seg(e, 0.5, 1.4)) + 0.4);
  } else if (e >= 2.2 && e < 2.98 && st.ballAt) {
    const f = (e - 2.2) / 0.78;
    snowball(c, lerp(st.ballAt[0], head[0], f), lerp(st.ballAt[1], head[1], f) - 34 * 4 * f * (1 - f), 3);
  } else if (e >= 2.98 && e < 4.25) {
    // A cap of snow on her head (flattened by the plop, so it's drawn as a heap, not a squashed
    // ball), crumbling off as she shakes it.
    const gone = seg(e, 3.95, 4.25);
    c.globalAlpha = 1 - gone;
    c.fillStyle = '#f8fbff';
    c.strokeStyle = '#a9c4de';
    c.lineWidth = 0.5;
    // A lumpy heap: three mounds.
    for (const [ox, rx, ry] of [[-2.2, 2.2, 1.8], [2.6, 2, 1.6], [0.4, 2.6, 2.8]]) {
      c.beginPath();
      c.ellipse(head[0] + ox, head[1] + 1.6 + 6 * gone, rx, ry, 0, Math.PI, 0);
      c.closePath();
      c.fill();
      c.stroke();
    }
    for (let i = 0; i < 5; i++) {
      const s = seg(e, 2.98, 3.3) + gone;
      c.beginPath();
      c.arc(head[0] + (i - 2) * 2.4 * (0.6 + s), head[1] + 1 + 9 * s * s * (0.5 + (i % 2)), 0.8, 0, TAU);
      c.fill();
    }
  }
  c.restore();
}
function snowball(c, x, y, r) {
  c.fillStyle = '#f8fbff';
  c.strokeStyle = '#9fbcd8';
  c.lineWidth = 0.5;
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
  c.stroke();
  c.fillStyle = '#dbe8f6';
  c.beginPath();
  c.arc(x + r * 0.25, y + r * 0.25, r * 0.55, 0, TAU);
  c.fill();
}
function flake(c, x, y, r, spin) {
  c.save();
  c.translate(x, y);
  c.rotate(spin);
  c.strokeStyle = '#ffffff';
  c.lineWidth = 0.7;
  c.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI) / 3;
    c.moveTo(-Math.cos(a) * r, -Math.sin(a) * r);
    c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  c.stroke();
  c.strokeStyle = '#8fd8ff';
  c.lineWidth = 0.35;
  c.stroke();
  c.restore();
}

// A damped spring toward `to` (stiffness k, damping c).
function spring(x, v, to, k, c, dt) {
  const nv = v + ((to - x) * k - v * c) * dt;
  return [x + nv * dt, nv];
}

// Her hand's height over the ground when she stands dragging it (body px), for the first frame.
const HILT_Y = 6.6;
// The angle the sword lies at when dragged with its tip on the ground, from her hand `h` px up.
function trailAngle(h) {
  const reach = (LEN - GRIP) * SCALE;
  return Math.PI - Math.asin(Math.max(0, Math.min(0.9, (h - 1) / reach)));
}

// The dust and sparks the sword's tip kicks up, falling and fading.
function drawDust(ctx, dust, cam, dt) {
  for (let i = dust.length - 1; i >= 0; i--) {
    const d = dust[i];
    d.t += dt;
    if (d.t >= d.life) {
      dust.splice(i, 1);
      continue;
    }
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.vy += 160 * dt;
    ctx.globalAlpha = (1 - d.t / d.life) * (d.spark ? 1 : 0.7);
    ctx.fillStyle = d.spark ? '#fff1b8' : '#d8d2bc';
    const r = d.spark ? 0.8 : d.r;
    ctx.fillRect(Math.round(d.x - cam.x - r), Math.round(d.y - cam.y - r), r * 2, r * 2);
  }
  ctx.globalAlpha = 1;
}
