// Draws Snow wolf, the Beastmaster's companion (world/pets.js), on a skeleton of her own: her look
// is the hero's parts (hair, face, ears, tail, kimono), but nothing of the player's rig moves her.
// Her poses (standing about fed up, plodding with the sword, running, jumping, climbing, and
// everything she does with it) come from here, blend into each other, and go to the hero's drawing
// whole (hero.js drawPosed). The Fang of the Wolf Queen is one of her bones: drawn from where her
// right hand really is, along its own angle, so it never leaves her hand.
import { drawPosed } from './hero.js';
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
//   mouth, lid, brows, extras, turned   the face, and whether she's turned round (mid-spin)
//   front                               the sword drawn in front of her (stood before her)
// Each thing she does is a function of time giving a pose; switching from one to the next blends
// over a moment, so nothing ever jumps. The sword is a bone: drawn from her right hand where the
// arm really reached, along `sword`, so it never leaves her hand.
const REST = {
  tx: 0, by: 0, squat: 0, lift: 0, hx: 0, hy: 1, tilt: -3, hand: [-4.6, 0.6], free: [0.4, 0.2], sword: 'trail', skip: 0, abs: false,
  legF: [0.8, 0, 0], legB: [-0.8, 0, 0], hipIn: 0, ears: [4, 4], tail: 0, cloth: 0, clothRoot: 0, kick: 0,
  mouth: 'bored', lid: null, brows: [[-0.2, 0.2], [-0.2, 0.2]], extras: [], turned: false, air: false, view: 'side', climb: 0, glow: 0, front: false, frontK: 0,
};
const pose = (o) => ({ ...REST, ...o });

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const ease = (t) => 1 - (1 - t) ** 3;
const easeIn = (t) => t * t;
const lerp = (a, b, t) => a + (b - a) * t;
const bump = (p, a, b) => (p < a || p > b ? 0 : Math.sin(((p - a) / (b - a)) * Math.PI));
const TAU = Math.PI * 2;
// The sword trailing behind her, low.
const TRAIL = 2.9;
// Her right hand reaching along the sword's direction `a`, `r` out from the shoulder (the arm is in
// the rig's tall proportions, so its height is drawn shorter: hence the 0.6).
const handAlong = (a, r = 8) => [1.4 + Math.cos(a) * r, -9.4 + (Math.sin(a) * r) / 0.6];

// Standing about, fed up (a 5.2 s cycle): breathing; a big sigh (steam, ears flat back, the hair
// lifting as she breathes in and dropping as she lets it out); then fuming (a vein, ears pinned,
// the tail thumping); a grudging tug at the sword; a long "...". Ears twitch now and then.
function standing(t) {
  const p = (t % 5.2) / 5.2;
  const sigh = bump(p, 0.08, 0.44);
  const inhale = bump(p, 0.08, 0.26);
  const out = bump(p, 0.26, 0.44);
  const fume = p > 0.44 && p < 0.76;
  const tug = p > 0.7 && p < 0.8;
  const tw = t % 3.3;
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
    ears: [4 + 3 * Math.sin(t * 1.3) + 34 * sigh + (fume ? 22 : 0) - (tw < 0.12 ? 18 : 0) - (tug ? 10 : 0), 4 + 3 * Math.sin(t * 1.3 - 0.8) + 34 * sigh + (fume ? 22 : 0) - (tw > 1.9 && tw < 2.02 ? 18 : 0) - (tug ? 10 : 0)],
    tail: tug ? 20 : fume ? (Math.floor(t * 5) % 2 ? -26 : 8) : 9 * Math.sin(t * 1.7),
    cloth: (tug ? -2.5 : Math.sin(t * 1.4) * 0.8 + Math.sin(t * 2.3 + 1) * 0.4) + 1.2 * sigh * Math.sin(t * 9),
    kick: -1.2 * inhale + out,
    extras,
  });
}

// Plodding along dragging it (`p` the walk cycle, two steps): short heavy steps, feet barely off the
// ground, leaning into the pull; the hand dips on each footfall and hauls the sword on, the tip
// skipping over the ground; ears flop with each step, the tail sways, the kimono trails.
function plodding(p, t) {
  const leg = (q) => [2.2 * Math.cos(TAU * q), -Math.max(0, 1.5 * Math.sin(TAU * q)), Math.cos(TAU * q) * 12];
  const u = (p * 2) % 1;
  const side = p < 0.5 ? 1 : -1;
  const flop = Math.exp(-u * 5) * Math.cos(u * 14);
  return pose({
    legF: leg(p), legB: leg(p + 0.5), hipIn: 0.5,
    by: 0.7 * (1 - Math.sin(Math.PI * u)), tx: 1, tilt: -1 + side * 2, hy: 1.5,
    hand: [-4.8 - 0.8 * side, 0.6 + 2.2 * Math.sin(Math.min(1, u / 0.4) * Math.PI)],
    free: [1.2 * Math.sin(TAU * p), 0.4],
    skip: 0.03 * Math.abs(Math.sin(t * 19)) + 0.02 * Math.abs(Math.sin(t * 31 + 1)) + (u < 0.12 ? 0.05 : 0),
    ears: [10 + 20 * flop, 10 + 20 * Math.exp(-u * 5) * Math.cos(u * 14 - 0.9)], tail: side * 12 * Math.sin(u * Math.PI) - 6 * flop,
    cloth: -1.5 - 1.2 * Math.sin(u * Math.PI), clothRoot: -0.5, kick: -1.2 * flop,
  });
}

// Running to catch up: longer strides, a real lean, the sword bouncing along behind, ears back.
function running(p, t) {
  const leg = (q) => [3.4 * Math.cos(TAU * q), -Math.max(0, 3 * Math.sin(TAU * q)), Math.cos(TAU * q) * 18];
  const u = (p * 2) % 1;
  return pose({
    legF: leg(p), legB: leg(p + 0.5), hipIn: 0.6,
    by: 1.2 * (1 - Math.sin(Math.PI * u)) - 0.6, lift: 1.2 * Math.sin(Math.PI * u), tx: 2, tilt: 2, hy: 0.5,
    hand: [-6, 1 + 1.4 * Math.sin(Math.PI * u)], free: [2.4 * Math.sin(TAU * p), -1.4],
    skip: 0.12 * Math.sin(Math.PI * u) + 0.02 * Math.sin(t * 40),
    ears: [24, 26], tail: 14 * Math.sin(TAU * p), cloth: -3, clothRoot: -1, kick: -1.6 * Math.sin(Math.PI * u),
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
// once (lands at 0.6 s) and buries itself in the ground; a beat of stillness; it's stuck: two tugs;
// she wrenches it free and hauls it back over and down behind her, stumbling a step back.
function slamming(t) {
  const UP = TRAIL + 1.15;
  const DOWN = TAU + 0.45;
  if (t < 0.5) {
    const k = ease(t / 0.5);
    const a = lerp(TRAIL, UP, k) + Math.sin(t * 150) * 0.05 * k;
    return pose({ sword: a, hand: handAlong(a, 8.5), squat: k < 0.5 ? 2 : 1, tx: -1.5 * k, tilt: -7 * k, hy: 1 - 1.5 * k, legF: [3, 0, 2], legB: [-3, 0, -2], mouth: 'grit', ears: [24, 26], tail: -14 * k, free: [-1, -6 * k], kick: -k });
  }
  if (t < 0.6) {
    const k = easeIn(seg(t, 0.5, 0.6));
    const a = lerp(UP, DOWN, k);
    return pose({ sword: a, hand: handAlong(a, 9), tx: lerp(-1.5, 3, k), tilt: lerp(-7, 9, k), squat: 3 * k, legF: [3.6, 0, 4], legB: [-3, 0, -10], mouth: 'yell', ears: [30, 32], tail: 20 * k, cloth: 2.5 * k, kick: 1.5 * k });
  }
  if (t < 1.05) {
    // Stuck: the hit held, then two tugs leaning back on the grip.
    const tug = bump(t, 0.72, 0.82) + bump(t, 0.88, 0.98);
    const a = DOWN - 0.07 * tug;
    return pose({ sword: a, hand: handAlong(a, 9 - 1.5 * tug), tx: 3 - 4 * tug, tilt: 9 - 14 * tug, squat: t < 0.68 ? 3 : 2, legF: [3.6, 0, 4], legB: [-3, 0, -10], mouth: tug > 0.3 ? 'grit' : 'flat', ears: [20 + 10 * tug, 22 + 10 * tug], tail: 10 - 20 * tug, extras: t > 0.7 ? ['sweat0'] : [] });
  }
  // Free: hauled back up and over, down behind her.
  const k = ease(seg(t, 1.05, 1.3));
  const a = lerp(DOWN, TRAIL + TAU, k);
  return pose({ sword: a, hand: handAlong(a, lerp(9, 6, k)), tx: lerp(-1, 0, k), tilt: lerp(-8, -3, k), squat: 1 - k, legF: [lerp(2, 0.8, k), 0, 0], legB: [lerp(-3, -0.8, k), 0, 0], mouth: 'flat', ears: [16, 18], cloth: -2 * (1 - k) });
}

// The crescent flick: barely bothering. She tips the blade up a little and flicks her free hand
// at them (the crescent leaves at 0.25 s); the sword drops back down with a little slump.
function flicking(t) {
  const up = bump(t, 0, 0.4);
  const flick = bump(t, 0.15, 0.32);
  return pose({ sword: TRAIL + 0.35 * up, hand: [-4.6, 0.6 - up], free: [3 + 3 * flick, -6 * flick - 2 * up], tilt: -3 + 3 * flick, tx: flick, squat: t > 0.4 && t < 0.5 ? 1 : 0, glow: 1 - seg(t, 0.3, 0.55), ears: [6, 6], tail: 6 * flick });
}

// Moonfall: she drags the sword up to point at the sky, shaking (the crescent lights), holds it
// there while the moonlight comes down (0.42-0.55 s), then can't any more: it topples forward with
// a thud, and she hauls it back down behind her.
function casting(t) {
  const SKY = TAU - Math.PI / 2;
  if (t < 0.35) {
    const k = ease(t / 0.35);
    const a = lerp(TRAIL, SKY, k) + Math.sin(t * 130) * 0.04 * k;
    return pose({ sword: a, hand: handAlong(a, 9), squat: 2, tilt: -6 * k, hy: 1 - 1.5 * k, legF: [2.6, 0, 2], legB: [-2.6, 0, -2], mouth: 'grit', glow: k, free: [-1, -5 * k], ears: [10, 12] });
  }
  if (t < 0.6) {
    const a = SKY + Math.sin(t * 160) * (0.03 + 0.06 * seg(t, 0.35, 0.6));
    return pose({ sword: a, hand: handAlong(a, 9.5), squat: 1, tilt: -6, hy: -0.5, legF: [2.6, 0, 2], legB: [-2.6, 0, -2], mouth: 'grit', glow: 1, free: [2, -9], ears: [-4, -4], tail: 10, extras: ['sweat0'] });
  }
  if (t < 0.72) {
    const k = easeIn(seg(t, 0.6, 0.72));
    const a = lerp(SKY, TAU + 0.4, k);
    return pose({ sword: a, hand: handAlong(a, 9), tx: 2 * k, tilt: lerp(-6, 8, k), squat: 2 * k, legF: [3.4, 0, 4], legB: [-2.6, 0, -8], mouth: 'o', glow: 1 - k, ears: [20, 22] });
  }
  const k = ease(seg(t, 0.72, 1));
  const a = lerp(TAU + 0.4, TRAIL + TAU, k);
  return pose({ sword: a, hand: handAlong(a, lerp(9, 6, k)), tx: 2 * (1 - k), tilt: lerp(8, -3, k), squat: 1 - k, mouth: 'flat', ears: [12, 14] });
}

// Lunar Howl: head thrown back, a grudging howl, ears back, the tail up; the sword left lying.
function howling(t) {
  const k = ease(seg(t, 0, 0.2)) * (1 - ease(seg(t, 0.65, 0.8)));
  return pose({ hy: 1 - 2 * k, tilt: -3 - 9 * k, by: -0.6 * k, mouth: k > 0.3 ? 'ah' : 'bored', lid: k > 0.3 ? 0.6 : null, ears: [4 + 26 * k, 4 + 28 * k], tail: -24 * k, free: [2 * k, -4 * k], kick: k, cloth: 1.5 * k });
}

// Moon Ward: braced behind the greatsword stood point-down in front of her, gritting her teeth.
// (The ground hides the blade's lower half: it's driven in.)
function warding(t) {
  const k = ease(seg(t, 0, 0.15)) * (1 - ease(seg(t, 0.55, 0.7)));
  // Her hand up on the grip, the blade stood point-down in the ground before her.
  const a = lerp(TRAIL, TAU + 1.42, k);
  const h = handAlong(lerp(TRAIL, TAU - 1.2, k), lerp(6, 9.5, k));
  return pose({ sword: a, hand: h, front: k > 0.05, frontK: k, squat: 2 * k, tilt: -4 * k, tx: -k, legF: [3, 0, 2], legB: [-3, 0, -2], mouth: k > 0.5 ? 'grit' : 'bored', ears: [4 + 22 * k, 4 + 24 * k], tail: -10 * k, free: [3 * k, -4 * k] });
}

const DOING = { swing: spinning, slam: slamming, flick: flicking, cast: casting, howl: howling, ward: warding };

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
  const t = a ? world.now - a.t0 : 0;
  // What she's doing, and her pose for it.
  let doing;
  let p;
  if (body.rope) {
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
    p = DOING[a.kind](t);
  } else if (s.moving) {
    // Her stride is in her own (smaller) body px: about 20 px a cycle plodding, 34 running.
    const run = s.hurry || (a?.kind === 'go');
    st.phase = (st.phase + (Math.abs(s.vx) * dt) / ((run ? 34 : 20) * SCALE)) % 1;
    doing = run ? 'run' : 'walk';
    p = run ? running(st.phase, time) : plodding(st.phase, time);
  } else {
    doing = 'stand';
    p = standing(time);
  }
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
    face: { brows: P.brows, extra: P.extras },
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
  drawPosed(ctx, look, x, y, rig, { scale: SCALE, facing, under: over ? null : drawBlade, over: over ? drawBlade : null });
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
