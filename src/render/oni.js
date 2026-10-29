// The Onmyoji's oni (docs/design/spirit-mage-paths.md): a big, cheerful red brute of the yokai
// troupe, built on the player character (hero.js drawPosed) with new clothes (jobgear/troupe.js),
// new hair (hair.js TROUPE_HAIR), horns and fangs, drawn much bigger than the Onmyoji (the whole
// figure scaled, never stretched), with a huge studded iron club (a kanabo).
//
// Her designs (tools/troupe-designs.html) led to her look, ONI_LOOK; her rig and animations are
// at the end of this file (world/oni.js runs her).

import { drawPosed } from './hero.js';
import { ONI_MOVES } from '../world/oni.js';

export const ONI_SCALE = 2;

// Her look, as the player picked it (2026-10-29): the "sleepy menace" with red skin and her bored
// face (tools/oni-bored.html no. 1): a jagged silver bob, droopy heavy-lidded gold eyes, a flat
// bored mouth with one fang poking out, a dark-and-gold diamond on her brow, crimson horns, her
// black battle kimono and the crimson club. Her other bored faces (side-eye, gum, toothpick, kiseru,
// deadpan, sigh, unimpressed) are her idle moods.
export const ONI_LOOK = {
  hairStyle: 'onibob', hairColor: '#eceaf2', skinTone: '#e4604e', eyeColor: '#ffd23a', eyeStyle: 'onitare', browStyle: 'sharp', earStyle: 'pointed',
  outfit: 'onibattle', outfitColor: '#ffffff', mouth: 'bored', marks: ['foremark', 'onifang'], lid: 0.45,
};
export const ONI_BROWS = [[0.05, 0.15], [0.05, 0.15]];

// His designs: each a look on the hero's body.
export const ONI_DESIGNS = {
  battle: {
    name: 'Cute and badass',
    club: 'crimson',
    look: {
      hairStyle: 'onisilver', hairColor: '#eceaf2', skinTone: '#ffe6da', eyeColor: '#ffb02a', eyeStyle: 'big', browStyle: 'sharp', face: 'smug',
      earStyle: 'pointed', outfit: 'onibattle', outfitColor: '#ffffff', marks: ['onifang'],
    },
  },
  battlered: {
    name: 'Cute and badass (red skin)',
    club: 'crimson',
    look: {
      hairStyle: 'onisilver', hairColor: '#eceaf2', skinTone: '#e4604e', eyeColor: '#ffc23a', eyeStyle: 'big', browStyle: 'sharp', face: 'smug',
      earStyle: 'pointed', outfit: 'onibattle', outfitColor: '#ffffff', marks: ['onifang'],
    },
  },
  crimson: {
    name: 'Crimson oni',
    club: 'crimson',
    look: {
      hairStyle: 'onisilver', hairColor: '#eceaf2', hairTip: '#f4d2d2', skinTone: '#d9483a', eyeColor: '#ffc23a', eyeStyle: 'cat', browStyle: 'sharp', face: 'smug',
      earStyle: 'pointed', outfit: 'onicrimson', outfitColor: '#ffffff', marks: ['onifangs', 'oniglow'],
    },
  },
  classic: {
    name: 'Classic red oni',
    look: {
      hairStyle: 'onimane', hairColor: '#2a2028', hairTip: '#a8321e', skinTone: '#e2533e', eyeColor: '#ffd23a', eyeStyle: 'round', browStyle: 'thick', face: 'grin',
      earStyle: 'pointed', outfit: 'oniclassic', outfitColor: '#ffffff', marks: ['onifangs'],
    },
  },
  festival: {
    name: 'Festival drummer',
    look: {
      hairStyle: 'onitopknot', hairColor: '#1e1a2a', skinTone: '#e2533e', eyeColor: '#ffcc33', eyeStyle: 'round', browStyle: 'thick', face: 'grin',
      earStyle: 'pointed', outfit: 'onifestival', outfitColor: '#ffffff', marks: ['onifangs'],
    },
  },
  warrior: {
    name: 'Blue war oni',
    look: {
      hairStyle: 'oniwhite', hairColor: '#f2f0f6', hairTip: '#b8c4e8', skinTone: '#5a78d6', eyeColor: '#ffd23a', eyeStyle: 'round', browStyle: 'thick', face: 'determined',
      earStyle: 'pointed', outfit: 'oniwarrior', outfitColor: '#ffffff', marks: ['onifangs'],
    },
  },
};

// ---------- The kanabo ----------
// A huge iron club: a wrapped grip with a red cord, a long octagonal shaft of dark iron
// thickening toward the head, bound with iron bands and studded with rows of steel spikes, a
// rounded iron cap. Drawn from her hand along `ang` (0 up, + forward), held near its butt, in
// body px scaled by `k`.
const LEN = 46;
const IRON = '#4a4652';
const IRON_LT = '#7a7486';
const IRON_DK = '#26232c';
const STUD = '#d8dce6';
export function paintKanabo(c, hand, flip, ang, k, style = 'iron', time = 0) {
  if (style === 'crimson') return paintCrimsonKanabo(c, hand, flip, ang, k, time);
  c.save();
  c.translate(hand[0], hand[1]);
  if (flip) c.scale(-1, 1);
  c.rotate(ang);
  c.scale(k, k);
  const bot = 6;
  const top = -LEN + bot;
  // The grip, wrapped, and its cord.
  c.fillStyle = '#5a3a2a';
  c.fillRect(-1.3, -2, 2.6, bot + 2);
  c.strokeStyle = '#d8352c';
  c.lineWidth = 0.5;
  for (let y = -1.5; y < bot; y += 1.2) {
    c.beginPath();
    c.moveTo(-1.3, y);
    c.lineTo(1.3, y + 0.6);
    c.stroke();
  }
  c.fillStyle = IRON_DK;
  c.fillRect(-1.6, bot - 0.4, 3.2, 1.2);
  // The shaft: widening from the grip to the head.
  const w = (u) => 1.6 + 2.6 * u;
  c.beginPath();
  c.moveTo(-w(0), -2);
  c.lineTo(-w(1), top + 4);
  c.quadraticCurveTo(0, top - 1.6, w(1), top + 4);
  c.lineTo(w(0), -2);
  c.closePath();
  c.fillStyle = IRON;
  c.fill();
  c.strokeStyle = IRON_DK;
  c.lineWidth = 0.6;
  c.stroke();
  // A light edge down one side.
  c.strokeStyle = IRON_LT;
  c.lineWidth = 0.7;
  c.beginPath();
  c.moveTo(-w(0) + 0.6, -3);
  c.lineTo(-w(1) + 0.8, top + 5);
  c.stroke();
  // Iron bands and rows of studs.
  for (const u of [0.18, 0.5, 0.82]) {
    const y = -2 + (top + 4 + 2) * u;
    c.fillStyle = IRON_DK;
    c.fillRect(-w(u) - 0.3, y - 0.6, 2 * w(u) + 0.6, 1.2);
  }
  c.fillStyle = STUD;
  for (let row = 0; row < 7; row++) {
    const u = 0.28 + row * 0.1;
    const y = -2 + (top + 4 + 2) * u;
    for (const s of [-1, 0, 1]) {
      const x = s * w(u) * 0.6;
      c.beginPath();
      c.moveTo(x - 0.6, y + 0.5);
      c.lineTo(x + 0.6, y + 0.5);
      c.lineTo(x, y - 0.9);
      c.closePath();
      c.fill();
    }
    // Spikes standing out from each edge.
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(s * w(u), y - 0.6);
      c.lineTo(s * (w(u) + 1.4), y);
      c.lineTo(s * w(u), y + 0.6);
      c.closePath();
      c.fill();
    }
  }
  c.restore();
}

// The crimson oni's club: a great crimson kanabo, thick and heavy, its head ringed with big
// crimson spikes, white swirls of light burned into it and a row of round holes glowing white
// down its face; the light pulses (`time`).
const CR = '#b0202a';
const CR_DK = '#5a0c14';
const CR_LT = '#e8503e';
function paintCrimsonKanabo(c, hand, flip, ang, k, time) {
  c.save();
  c.translate(hand[0], hand[1]);
  if (flip) c.scale(-1, 1);
  c.rotate(ang);
  c.scale(k, k);
  const bot = 6;
  const top = -LEN - 2 + bot;
  // The grip, bound in black, a gold cord.
  c.fillStyle = '#1e1418';
  c.fillRect(-1.4, -2, 2.8, bot + 2);
  c.strokeStyle = '#f2c94c';
  c.lineWidth = 0.4;
  for (let y = -1.6; y < bot; y += 1.3) {
    c.beginPath();
    c.moveTo(-1.4, y);
    c.lineTo(1.4, y + 0.7);
    c.stroke();
  }
  const w = (u) => 1.8 + 3.4 * Math.min(1, u * 1.3);
  const yAt = (u) => -2 + (top + 4 + 2) * u;
  // Big spikes along both edges of the head.
  c.fillStyle = CR_DK;
  for (let i = 0; i < 6; i++) {
    const u = 0.38 + i * 0.11;
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(s * w(u), yAt(u) - 1.4);
      c.lineTo(s * (w(u) + 3.4), yAt(u) - 2.8);
      c.lineTo(s * w(u), yAt(u) + 0.6);
      c.closePath();
      c.fill();
    }
  }
  // The body of the club.
  c.beginPath();
  c.moveTo(-w(0), -2);
  c.lineTo(-w(1), top + 4);
  c.quadraticCurveTo(0, top - 2, w(1), top + 4);
  c.lineTo(w(0), -2);
  c.closePath();
  c.fillStyle = CR;
  c.fill();
  c.strokeStyle = CR_DK;
  c.lineWidth = 0.7;
  c.stroke();
  c.strokeStyle = CR_LT;
  c.lineWidth = 0.7;
  c.beginPath();
  c.moveTo(-w(0) + 0.6, -3);
  c.lineTo(-w(1) + 0.9, top + 5);
  c.stroke();
  // Dark ridges across it.
  c.fillStyle = CR_DK;
  for (const u of [0.22, 0.36]) c.fillRect(-w(u) - 0.3, yAt(u) - 0.6, 2 * w(u) + 0.6, 1.2);
  // The white swirls of light burned into it, and the glowing holes, pulsing.
  const glow = 0.75 + 0.25 * Math.sin(time * 4);
  c.save();
  c.shadowColor = `rgba(255, 220, 220, ${glow})`;
  c.shadowBlur = 8;
  c.strokeStyle = `rgba(255, 244, 244, ${glow})`;
  c.lineWidth = 0.55;
  for (let i = 0; i < 3; i++) {
    const y = yAt(0.48 + i * 0.16);
    const r = 1.8;
    c.beginPath();
    c.arc(-1.2, y, r, Math.PI * 0.2, Math.PI * 1.6);
    c.stroke();
    c.beginPath();
    c.arc(1.4, y - 1.6, r * 0.8, Math.PI * 1.1, Math.PI * 2.4);
    c.stroke();
  }
  c.fillStyle = `rgba(255, 250, 250, ${glow})`;
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.ellipse(0, yAt(0.42 + i * 0.16), 1, 1.3, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  c.restore();
}

// ======================================================================================
// Her rig and animations (world/oni.js runs her). On the player character (hero.js drawPosed),
// in her own look (ONI_LOOK), drawn ONI_SCALE times as big, with poses and acting of her own:
//   - her bearing: bored by everything. She slouches with the club resting on her shoulder and
//     a fist on her hip, heavy-lidded, and strolls along lazily; when she's left behind she
//     stomps after the Onmyoji at a run with the club trailing;
//   - her blows: each a big, committed swing of a very heavy club (on world/oni.js's heavy clock),
//     her whole body thrown into it, her face waking up for it (a grin, shark teeth) and going
//     straight back to bored;
//   - her moods: a sulk when she hits nothing (the club dropped, a pout, a kick at the ground), a
//     smug smirk when what she was hitting goes down;
//   - her idle moods, every few seconds standing about: blowing a gum bubble, chewing a toothpick,
//     her kiseru pipe, a side-eye, a sigh, a deadpan stare, an unimpressed brow, a yawn, tapping
//     the club on her shoulder, scratching her head;
//   - and under it all a layer of life: breath, a slow sway, her hair stirring, springs on every
//     number of a pose so nothing ever snaps.

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const soft = (t) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t));
const lerp = (a, b, t) => a + (b - a) * t;
const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const add2 = (...ps) => ps.reduce((s, p) => [s[0] + p[0], s[1] + p[1]], [0, 0]);
const mul2 = (p, k) => [p[0] * k, p[1] * k];
const bump = (p, a, b) => (p < a || p > b ? 0 : Math.sin(((p - a) / (b - a)) * Math.PI));
const overshoot = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2);
const TAU = Math.PI * 2;
export { ONI_MOVES };

// ---------- Her poses ----------
// lean, lunge, lift (her body); club (its angle, 0 up, + forward); hand (her club hand), free (the
// other) from rest; legF / legB [ahead, up, tilt]; squat; tx, by (hips, bob); hx, hy, tilt (head);
// cloth; and her face: mouth, eyes, brows, lid, glance, props (bored props on her face).
const HAND = [1.5, -8];
const FREE = [-1, -2.4];
const REST = {
  lean: -0.02, lunge: 0, lift: 0, club: -0.55, hand: HAND, free: FREE, legF: [3.6, 0, 8], legB: [-3.8, 0, -8], squat: 0,
  tx: 0, by: 0, hx: 0.4, hy: 0.2, tilt: 4, cloth: 0, mouth: 'bored', eyes: null, brows: 'bored', lid: 0.45, glance: 0, props: [],
};
const pose = (o) => ({ ...REST, ...o });
const BROWS = { bored: [[0.05, 0.15], [0.05, 0.15]], angry: [[-0.4, 0.95], [-0.4, 0.95]], smug: [[0.1, -0.1], [0.35, -0.35]], sad: [[0.4, -0.45], [0.4, -0.45]], raised: [[0.4, -0.45], [-0.15, 0.35]], flat: [[0, 0], [0, 0]] };

// Her slouch: the club resting on her shoulder, a fist on her hip, weight on one leg, head tipped.
const standing = () => pose({});
// A lazy stroll: short heavy steps, the club bobbing on her shoulder, the other arm swinging loose,
// her head nodding with each step.
function walking(ph) {
  const s = Math.sin(ph);
  const c = Math.cos(ph);
  return pose({
    legF: [2.6 + 2.8 * s, -1.2 * Math.max(0, c), 10 * s], legB: [-2.6 - 2.8 * s, -1.2 * Math.max(0, -c), -10 * s], by: -0.5 * Math.abs(c), tx: 0.5 * s,
    club: -0.55 + 0.06 * Math.abs(c), hand: [1.5, -8 + 0.5 * Math.abs(c)], free: [0.4 - 2 * s, 2.2], hy: 0.2 + 0.3 * Math.abs(c), tilt: 4 + 1.5 * s, cloth: -1.2 * s, eyes: 'half',
  });
}
// Stomping after the Onmyoji: big strides, leaning in, the club dragged low behind her.
function running(ph) {
  const s = Math.sin(ph);
  const c = Math.cos(ph);
  return pose({
    legF: [2.4 + 5 * s, -2.6 * Math.max(0, c), 24 * s], legB: [-2.4 - 5 * s, -2.6 * Math.max(0, -c), -24 * s], by: -0.9 * Math.abs(c), lift: 1.4 * Math.abs(c), lean: 0.22,
    club: -2.1, hand: [-3, 2], free: [2.4 * s, -1 - 1.4 * Math.max(0, s)], cloth: -3, mouth: 'frown', brows: 'angry', lid: 0.3, tilt: 0,
  });
}

// ---------- Her blows (ONI_MOVES in world/oni.js; `u` runs on her heavy clock) ----------
// Lazy Jab (0.42): she lets the club down off her shoulder to level, and shoves its head forward
// one-handed with a bored little lean, then hauls it back up.
function jab(u) {
  const set = soft(seg(u, 0, 0.26));
  const shove = overshoot(seg(u, 0.34, 0.44)) * (1 - soft(seg(u, 0.56, 0.84)));
  const back = soft(seg(u, 0.72, 1));
  const k = set * (1 - back);
  return pose({
    club: lerp(-0.55, 1.45, k), hand: add2(lerp2(HAND, [3, -2], k), [6 * shove, 0]), free: lerp2(FREE, [-1.4, -2.8], k),
    lean: 0.2 * shove, lunge: 5 * shove, legF: [3.6 + 2 * shove, 0, 8], eyes: 'half', mouth: shove > 0.5 ? 'onismirk' : 'bored',
  });
}
// The blend every big blow uses: from rest into its wind-up `w`, through its strike `s`, back to
// rest as `back` comes.
const blow = (rest, wound, struck, w, s, back) => add2(mul2(add2(mul2(lerp2(rest, wound, w), 1 - s), mul2(struck, s)), 1 - back), mul2(rest, back));
// Swat (0.5): she swings the club back and low behind her, both hands on it, coiling; then lets
// fly in one huge swing up and over and down through everything in front, her whole body after it,
// and follows through before she rests it back on her shoulder.
function swat(u) {
  const wind = soft(seg(u, 0, 0.36));
  const cut = overshoot(seg(u, 0.38, 0.52));
  const back = soft(seg(u, 0.72, 1));
  const on = 1 - back;
  return pose({
    club: (lerp(-0.55, -2, wind) * (1 - cut) + 2.15 * cut) * on - 0.55 * back,
    hand: blow(HAND, [-4, -3], [9, -1], wind, cut, back), free: blow(FREE, [-2, -6], [7, -1], wind, cut, back),
    lean: -0.16 * wind * (1 - cut) + 0.36 * cut * on, lunge: -2 * wind * (1 - cut) + 7 * cut * on, squat: 1.5 * wind * (1 - cut) + 2.2 * cut * on,
    legF: [3.6 + 3 * cut * on, 0, 8 + 4 * cut * on], legB: [-4 - 1.6 * cut * on, 0, -10 - 8 * cut * on], cloth: 3 * wind - 5 * cut * on, tilt: 4 - 6 * cut * on,
    mouth: cut > 0.3 && on > 0.5 ? 'onigrin' : wind > 0.3 ? 'onismirk' : 'bored', brows: cut > 0.2 && on > 0.5 ? 'angry' : 'bored', lid: wind > 0.3 ? 0.15 : 0.45,
  });
}
// Smash (0.52): she hauls the club up overhead in both hands, rising onto her toes, holds it there
// a breath; then brings it straight down in front of her with everything she has, sinking with it.
function smash(u) {
  const up = soft(seg(u, 0, 0.38));
  const chop = overshoot(seg(u, 0.4, 0.53));
  const back = soft(seg(u, 0.75, 1));
  const on = 1 - back;
  const high = up * (1 - chop);
  return pose({
    club: (lerp(-0.55, -0.9, up) * (1 - chop) + 1.95 * chop) * on - 0.55 * back,
    hand: blow(HAND, [0, -14], [8.5, 3.5], up, chop, back), free: blow(FREE, [2.5, -12], [6.5, 2.5], up, chop, back),
    lean: -0.12 * high + 0.45 * chop * on, lift: 2 * high, squat: 3.6 * chop * on, lunge: 7 * chop * on,
    legF: [3.6 + 2.6 * chop * on, -1.2 * high, 8 + 6 * chop * on], legB: [-4 - 1.6 * chop * on, 0, -10], cloth: -2 * high + 5 * chop * on, tilt: 4 - 8 * high + 6 * chop * on,
    mouth: chop > 0.3 && on > 0.5 ? 'onishark' : up > 0.5 ? 'onigrin' : 'bored', brows: up > 0.4 ? 'angry' : 'bored', lid: up > 0.4 ? 0.1 : 0.45,
  });
}
// Upswing (0.48): she sinks low with the club's head down in front of her, then rips it up and over
// her head, coming right up onto her toes after it.
function upper(u) {
  const low = soft(seg(u, 0, 0.34));
  const rip = overshoot(seg(u, 0.36, 0.5));
  const back = soft(seg(u, 0.74, 1));
  const on = 1 - back;
  return pose({
    club: (lerp(-0.55, 2.4, low) * (1 - rip) - 0.7 * rip) * on - 0.55 * back,
    hand: blow(HAND, [7, 4.5], [1.5, -14], low, rip, back), free: blow(FREE, [5, 3.5], [3, -12], low, rip, back),
    lean: 0.3 * low * (1 - rip) - 0.18 * rip * on, lunge: 3 * low * (1 - rip), lift: 7 * rip * on, squat: 3.4 * low * (1 - rip),
    legF: [3 + 1.4 * low, -2 * rip * on, 12], legB: [-3.4, -1.4 * rip * on, -12], cloth: 4 * rip * on, tilt: 4 - 10 * rip * on,
    mouth: rip > 0.3 && on > 0.5 ? 'onigrin' : 'bored', brows: low > 0.3 ? 'angry' : 'bored', lid: low > 0.3 ? 0.15 : 0.45,
  });
}
// Ground Pound (0.56): she raises the club high in both hands with a little hop, and drives it
// straight down into the ground right before her feet, sinking into a deep crouch as the shock
// goes out both ways; then wrenches it free.
function pound(u) {
  const raise = soft(seg(u, 0, 0.36));
  const hop = bump(u, 0.3, 0.52);
  const drive = overshoot(seg(u, 0.5, 0.58));
  const back = soft(seg(u, 0.78, 1));
  const on = 1 - back;
  return pose({
    club: (lerp(-0.55, -0.1, raise) * (1 - drive) + 2.75 * drive) * on - 0.55 * back,
    hand: blow(HAND, [1, -15], [5, 4], raise, drive, back), free: blow(FREE, [2.5, -14], [4, 4], raise, drive, back),
    lift: 6 * hop, squat: 4.6 * drive * on, lean: -0.1 * raise * (1 - drive) + 0.25 * drive * on,
    legF: [3.8 + 1.4 * drive * on, -1.6 * hop, 8 + 8 * drive * on], legB: [-4.2 - 1.4 * drive * on, -1.6 * hop, -10 - 8 * drive * on], cloth: -3 * hop + 5 * drive * on, tilt: 4 - 8 * raise * (1 - drive) + 6 * drive * on,
    mouth: drive > 0.3 && on > 0.5 ? 'onishark' : raise > 0.4 ? 'onigrin' : 'bored', brows: 'angry', lid: 0.1,
  });
}
const MOVES = { jab, swat, smash, upper, pound };

// ---------- Her moods and idle moods ----------
// Sulking (a blow hit nothing): the club dropped point-down, leaning on it, shoulders slumped, a
// pout, and a kick at the ground.
function sulking(t) {
  const kick = bump((t * 0.9) % 1, 0.2, 0.5);
  return pose({ club: 2.5, hand: [5, 3], free: [0.6, 2.6], by: 0.8, hy: 1, tilt: 8, lean: 0.06, legF: [3.6 + 2 * kick, -1.6 * kick, 8 + 14 * kick], mouth: 'pout', eyes: 'half', brows: 'sad', lid: 0.35 });
}
// Each idle mood: how long it lasts and the pose `u` (0-1) through it.
export const ONI_IDLES = {
  gum: [3, (u) => pose({ mouth: u > 0.25 && u < 0.78 ? 'pout' : u >= 0.78 && u < 0.86 ? 'open' : 'bored', props: u > 0.3 && u < 0.78 ? ['gumbubble'] : [], eyes: 'half', tilt: 6 })],
  toothpick: [3.4, (u) => pose({ props: ['toothpick'], tilt: 4 + 3 * Math.sin(u * TAU * 2), hx: 0.4 + 0.4 * Math.sin(u * TAU), lid: 0.5 })],
  kiseru: [4, (u) => pose({ props: ['kiseru'], mouth: 'flat', lid: 0.55, hy: -0.2, tilt: 2 + 2 * Math.sin(u * TAU) })],
  sideeye: [2.4, (u) => {
    const k = soft(seg(u, 0, 0.2)) * (1 - soft(seg(u, 0.8, 1)));
    return pose({ glance: k, hx: 0.4 - 1.2 * k, tilt: 4 - 3 * k, lid: 0.5 });
  }],
  sigh: [2.6, (u) => {
    const k = bump(u, 0.15, 0.85);
    return pose({ eyes: k > 0.3 ? 'blink' : null, props: u > 0.35 && u < 0.7 ? ['sighpuff'] : [], mouth: 'tiny', by: 0.7 * k, hy: 0.2 + 0.8 * k, free: [-0.6, -2 + 1.2 * k] });
  }],
  deadpan: [2.4, () => pose({ mouth: 'flat', lid: 0.62, brows: 'flat', tilt: 0 })],
  unimpressed: [2.4, (u) => pose({ mouth: 'frown', brows: 'raised', lid: 0.4, props: ['onifang'], tilt: 6 + 2 * bump(u, 0.2, 0.6) })],
  yawn: [2.6, (u) => {
    const k = bump(u, 0.15, 0.8);
    return pose({ mouth: k > 0.3 ? 'yawn' : 'bored', eyes: k > 0.3 ? 'blink' : null, hy: 0.2 - 0.8 * k, tilt: 4 - 6 * k, lean: -0.02 - 0.05 * k });
  }],
  shoulder: [2.4, (u) => {
    const tap = Math.max(0, Math.sin(u * TAU * 3)) * (1 - soft(seg(u, 0.8, 1)));
    return pose({ club: -0.55 - 0.25 * tap, hand: [1.5, -8 - 1.6 * tap], eyes: 'half', tilt: 4 + 2 * tap });
  }],
  scratch: [2.6, (u) => {
    const k = soft(seg(u, 0, 0.2)) * (1 - soft(seg(u, 0.78, 1)));
    return pose({ free: [lerp(-1, 3, k) + 0.6 * Math.sin(u * 40) * k, lerp(-2.4, -13, k)], tilt: 4 + 4 * k, lid: 0.55, mouth: 'tiny' });
  }],
};
const IDLE_KEYS = Object.keys(ONI_IDLES);

// ---------- Her rig ----------
// Every number of her pose rides a spring to its target: her club hand and the club stiff and
// heavy, her body slower, her free hand quick.
const SLOW = { k: 140, damp: 0.82 };
const QUICK = { k: 320, damp: 0.74 };
const HEAVY = { k: 200, damp: 0.95 };
const HEAVY_KEYS = new Set(['hand', 'club']);
const QUICK_KEYS = new Set(['free']);
function follow(st, target, dt) {
  if (!st.P) return (st.P = structuredClone(target));
  const n = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / n;
  const P = { ...target };
  for (const key of Object.keys(target)) {
    const { k, damp } = HEAVY_KEYS.has(key) ? HEAVY : QUICK_KEYS.has(key) ? QUICK : SLOW;
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

// `k.idle` (with `k.idleT0`) forces one idle mood, for the dev page (tools/oni.html).
export function drawOniCompanion(ctx, world, k, cam, time) {
  if (!k?.body) return;
  let st = STATE.get(k);
  if (!st) {
    st = { last: time, P: null, V: {}, walk: 0, vx: 0, idle: null, idleAt: time + 2 };
    STATE.set(k, st);
  }
  const dt = Math.max(0, Math.min(0.05, time - st.last));
  st.last = time;
  const a = k.act;
  // Her idle moods: every few seconds standing about, one of them (never the same twice).
  if (a || k.moving || k.mood) st.idleAt = Math.max(st.idleAt, time + 2);
  if (k.idle) st.idle = { kind: k.idle, t0: k.idleT0 ?? 0 };
  else if (!a && !k.moving && !k.mood && time >= st.idleAt) {
    const pick = IDLE_KEYS.filter((b) => b !== st.idle?.kind);
    st.idle = { kind: pick[Math.floor(Math.random() * pick.length)], t0: time };
    st.idleAt = time + ONI_IDLES[st.idle.kind][0] + 1.5 + Math.random() * 2;
  }
  if (!k.idle && st.idle && (a || k.moving || k.mood || time - st.idle.t0 > ONI_IDLES[st.idle.kind][0])) st.idle = null;
  let p;
  if (a && MOVES[a.kind]) p = MOVES[a.kind](clamp01((a.clock ?? world.now - a.t0) / a.dur));
  else if (k.moving) {
    st.walk += dt * Math.min(1.8, Math.abs(k.vx) / 58) * (k.running ? 9 : 4);
    p = k.running ? running(st.walk) : walking(st.walk);
  } else if (k.mood?.kind === 'sulk') p = sulking(time);
  else if (st.idle) p = ONI_IDLES[st.idle.kind][1](clamp01((time - st.idle.t0) / ONI_IDLES[st.idle.kind][0]));
  else p = standing();
  if (k.mood?.kind === 'smug' && !a) p = { ...p, mouth: 'onismirk', brows: 'smug', lid: 0.35 };
  // On an impact she's stopped dead (her hair and clothes swing on).
  const P = follow(st, p, a?.freeze > 0 ? 0 : dt);

  // The life layer.
  const calm = a ? 0.4 : 1;
  const breath = Math.sin(time * 1.1);
  const shift = Math.sin(time * 0.38);
  const breeze = Math.sin(time * 0.8) + 0.5 * Math.sin(time * 2.1 + 1);
  const dir = k.dir || 1;
  const ax = dt > 0 ? (k.vx - st.vx) / dt : 0;
  st.vx = k.vx;
  const v = (k.vx * dir) / 100;
  const surge = (ax * dir) / 600;
  const S = (name, to, kk, c) => {
    [st[name], st[name + 'V']] = spring(st[name] ?? to, st[name + 'V'] ?? 0, to, kk, c, dt);
    return st[name];
  };
  const hair = S('hair', -1.4 * v - 2 * surge + 0.5 * breeze + (P.lift > 2 ? -1 : 0), 55, 5.5);
  const tip = S('tip', hair + 0.4 * Math.sin(time * 1.7), 38, 4.2);
  const sway = S('sway', P.cloth + 0.8 * breeze * calm - 2 * v, 80, 7.5);
  const clubVel = st.clubWas == null ? 0 : (P.club - st.clubWas) / Math.max(dt, 1e-3);
  st.clubWas = P.club;
  const lean = S('lean', 0.14 * surge + 0.04 * v + Math.max(-0.12, Math.min(0.12, clubVel * 0.012)), 110, 11);

  const x = k.x - cam.x;
  const y = k.y - cam.y;
  const rig = {
    tx: q(P.tx + 0.35 * shift * calm), by: q(P.by + 0.3 * breath * calm), hx: q(P.hx + 0.2 * shift * calm), hy: q(P.hy + 0.22 * breath * calm), tilt: deg(P.tilt + 1.2 * shift * calm),
    frontArm: [q(P.hand[0]), q(P.hand[1] + 0.25 * breath * calm)], backArm: [q(P.free[0]), q(P.free[1] + 0.3 * breath * calm)], armSide: 1,
    frontLeg: [q(P.legF[0]), q(P.legF[1]), deg(P.legF[2])], backLeg: [q(P.legB[0]), q(P.legB[1]), deg(P.legB[2])], squat: q(P.squat), cape: q(sway),
    hair: q(Math.max(-3, Math.min(3, hair))), hairTip: q(Math.max(-4, Math.min(4, tip))), hairLift: Math.abs(hair) > 1.6 ? -1 : 0, hairWave: Math.floor((((time / 1.7) % 1) + 1) % 1 * 8),
    eyes: P.eyes ?? oniBlink(time), face: { brows: BROWS[P.brows] ?? BROWS.bored, glance: q(P.glance) },
  };
  // (Her fang pokes out over a closed mouth; an open one shows its own teeth.)
  const look = { ...ONI_LOOK, mouth: P.mouth, lid: q(P.lid), marks: [...ONI_LOOK.marks.filter((m) => m !== 'onifang' || P.mouth === 'bored' || P.mouth === 'flat'), ...P.props] };
  // The club goes behind her while it's resting back over her shoulder, in front when it swings.
  const ang = Math.atan2(Math.sin(P.club), Math.cos(P.club));
  const behind = ang < -0.3 && ang > -2.9;
  const club = (c, hand, flip) => paintKanabo(c, hand, flip, P.club, ONI_SCALE, 'crimson', time);
  drawPosed(ctx, look, Math.round(x * 4) / 4, Math.round(y * 4) / 4, rig, {
    scale: ONI_SCALE, facing: dir, under: behind ? club : null, over: behind ? null : club, hold: 'front',
    lean: { tilt: P.lean + lean + 0.012 * shift * calm, lunge: P.lunge, lift: P.lift },
  });
}
// Slow, lazy blinks.
function oniBlink(t) {
  const b = (t * 0.22) % 1;
  return b < 0.014 ? 'blink' : b < 0.03 ? 'half' : 'open';
}
