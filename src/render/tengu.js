// The Onmyoji's tengu (docs/design/spirit-mage-paths.md): the last of her yokai troupe, a
// handsome, smug mountain goblin, built on the player character (hero.js drawPosed) in new parts
// of his own (jobgear/troupe.js tenguyamabushi, hair.js tengupart, hero.js's tengu eyes, brows
// and smirks), a little taller than the Onmyoji, with black crow wings, a feather fan and a sword
// of his own drawn here.
//
// His look, from how tengu are drawn (the yamabushi's tokin cap and pompom yuigesa, the feather
// fan, one-toothed geta, crow wings, the red long-nosed mask) and the player's brief (smug, parted
// black hair, very handsome).
import { drawPosed, posedPoint } from './hero.js';
import { keys, overshoot } from './oni.js';
import { TENGU_MOVES } from '../world/tengu.js';

export const TENGU_SCALE = 1.2;
export const TENGU_LOOK = {
  hairStyle: 'tengupart', hairColor: '#1a1822', hairTip: '#3a4a7a', skinTone: '#fbeee4', eyeColor: '#e8a83a', eyeStyle: 'tengusmug', browStyle: 'tengu', earStyle: 'round',
  outfit: 'tenguyamabushi', outfitColor: '#ffffff', mouth: 'tengusmirk', marks: [], blush: 0, lid: 0.25,
};
export { TENGU_MOVES };

// ---------- His things ----------
// Drawn in body px (scaled by `k`) from where they're held or worn.
const FEATHER = '#17151f';
const FEATHER_FAR = '#0c0a12';
const SHEEN = '#3a4a7a';
const COVERT = '#24222e';
// A crow wing from its root at the upper back: `side` which way it reaches on screen, `spread`
// from folded down his back (0) to thrown wide and up (1), `flap` turning it on top of that.
// Long primaries fan from the wrist, shorter secondaries along the arm, coverts over them, a blue
// sheen down each feather.
function paintWing(c, root, side, spread, flap, k, far = false) {
  c.save();
  c.translate(root[0], root[1]);
  // (Folded, it lies smaller and closer along his back, its tips at his hips.)
  const f = 0.58 + 0.42 * spread;
  c.scale(side * k * f, k * f);
  c.rotate(1.5 - 2.15 * spread + flap);
  const L = 13;
  const col = far ? FEATHER_FAR : FEATHER;
  // Primaries (longest at the tip) and secondaries, from the trailing edge of the arm.
  for (let i = 7; i >= 0; i--) {
    const t = i / 7;
    const ox = L * (0.15 + 0.85 * t);
    const oy = -1.4 * Math.sin(Math.PI * t);
    const len = 8 + 9 * t ** 1.4;
    const a = 1.7 - 1.15 * t - 0.25 * spread * t;
    const ex = ox + Math.cos(a) * len;
    const ey = oy + Math.sin(a) * len;
    const nx = -Math.sin(a) * 1.6;
    const ny = Math.cos(a) * 1.6;
    c.beginPath();
    c.moveTo(ox - nx, oy - ny);
    c.quadraticCurveTo(ox + Math.cos(a) * len * 0.6 - nx * 1.1, oy + Math.sin(a) * len * 0.6 - ny * 1.1, ex, ey);
    c.quadraticCurveTo(ox + Math.cos(a) * len * 0.6 + nx * 0.9, oy + Math.sin(a) * len * 0.6 + ny * 0.9, ox + nx, oy + ny);
    c.closePath();
    c.fillStyle = col;
    c.fill();
    c.strokeStyle = far ? '#1c2440' : SHEEN;
    c.lineWidth = 0.35;
    c.beginPath();
    c.moveTo(ox - nx * 0.5, oy - ny * 0.5);
    c.lineTo(ox + Math.cos(a) * len * 0.85 - nx * 0.3, oy + Math.sin(a) * len * 0.85 - ny * 0.3);
    c.stroke();
  }
  // The arm, with its coverts.
  c.beginPath();
  c.moveTo(-1, 1.6);
  c.quadraticCurveTo(L * 0.45, -3.4, L + 1, -0.6);
  c.quadraticCurveTo(L * 0.6, 3.6, -1, 4.4);
  c.closePath();
  c.fillStyle = far ? '#14121a' : COVERT;
  c.fill();
  c.strokeStyle = far ? '#1c2440' : SHEEN;
  c.lineWidth = 0.45;
  c.beginPath();
  c.moveTo(0, 1.4);
  c.quadraticCurveTo(L * 0.45, -3, L + 0.6, -0.6);
  c.stroke();
  c.restore();
}
// The hauchiwa: a feather fan, nine white feathers tipped black spread in a broad leaf from a
// crimson lacquer handle with a gold cap and a red tassel. `ang` (0 up, + forward) from the hand;
// `twirl` turns the head of it face-on to edge-on (a flick).
function paintFan(c, hand, flip, ang, k, twirl = 0) {
  c.save();
  c.translate(hand[0], hand[1]);
  if (flip) c.scale(-1, 1);
  c.rotate(ang);
  c.scale(k, k);
  c.fillStyle = '#a8241e';
  c.fillRect(-0.7, -5.4, 1.4, 7.4);
  c.fillStyle = '#f2c94c';
  c.fillRect(-0.9, -6, 1.8, 1);
  c.fillStyle = '#d8352c';
  c.beginPath();
  c.moveTo(0, 2);
  c.quadraticCurveTo(1.6, 3.6, 0.6, 5.4);
  c.lineTo(-0.4, 5.2);
  c.quadraticCurveTo(0.4, 3.6, 0, 2);
  c.fill();
  c.translate(0, -6);
  c.scale(Math.max(0.25, Math.cos(twirl)), 1);
  for (let i = 0; i < 9; i++) {
    const a = (i - 4) * 0.2;
    const len = 9.6 - Math.abs(i - 4) * 0.5;
    c.save();
    c.rotate(a);
    c.beginPath();
    c.moveTo(-0.9, 0);
    c.quadraticCurveTo(-1.9, -len * 0.6, 0, -len);
    c.quadraticCurveTo(1.9, -len * 0.6, 0.9, 0);
    c.closePath();
    c.fillStyle = '#f6f4ee';
    c.fill();
    c.beginPath();
    c.moveTo(-1.5, -len * 0.72);
    c.quadraticCurveTo(0, -len * 1.04, 1.5, -len * 0.72);
    c.quadraticCurveTo(0, -len * 0.82, -1.5, -len * 0.72);
    c.fillStyle = '#26222e';
    c.fill();
    c.strokeStyle = '#c8c0b4';
    c.lineWidth = 0.25;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(0, -len * 0.75);
    c.stroke();
    c.restore();
  }
  c.fillStyle = '#f2c94c';
  c.beginPath();
  c.arc(0, 0, 1, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
// His tachi: a black-wrapped grip, a gold guard, a long gently curved blade. `ang` (0 up, +
// forward) from the hand.
function paintSword(c, hand, flip, ang, k) {
  c.save();
  c.translate(hand[0], hand[1]);
  if (flip) c.scale(-1, 1);
  c.rotate(ang);
  c.scale(k, k);
  c.fillStyle = '#1a1620';
  c.fillRect(-0.75, -1.4, 1.5, 5.6);
  c.fillStyle = '#f4f2ee';
  for (let y = -0.8; y < 4; y += 1.3) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(0.6, y + 0.6);
    c.lineTo(0, y + 1.2);
    c.lineTo(-0.6, y + 0.6);
    c.fill();
  }
  c.fillStyle = '#f2c94c';
  c.beginPath();
  c.ellipse(0, -1.8, 2, 0.7, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(-0.85, -2.3);
  c.quadraticCurveTo(-0.6, -14, 1.6, -24);
  c.lineTo(0.9, -23.6);
  c.quadraticCurveTo(0.7, -14, 0.85, -2.3);
  c.closePath();
  c.fillStyle = '#dfe6f0';
  c.fill();
  c.strokeStyle = '#ffffff';
  c.lineWidth = 0.4;
  c.beginPath();
  c.moveTo(0.6, -3);
  c.quadraticCurveTo(0.7, -14, 1.4, -23);
  c.stroke();
  c.restore();
}
// The scabbard at his hip, swept back: black lacquer with gold fittings; sheathed, the hilt shows.
function paintSaya(c, hip, flip, k, sheathed) {
  c.save();
  c.translate(hip[0], hip[1]);
  if (flip) c.scale(-1, 1);
  c.rotate(-1.95);
  c.scale(k, k);
  c.fillStyle = '#16131c';
  c.beginPath();
  c.moveTo(-0.9, 0);
  c.quadraticCurveTo(-1, 12, 0.8, 22);
  c.lineTo(1.9, 21.6);
  c.quadraticCurveTo(1, 12, 0.9, 0);
  c.closePath();
  c.fill();
  c.fillStyle = '#f2c94c';
  c.fillRect(-1.1, 0.4, 2.2, 0.8);
  c.fillRect(-1, 8, 2.1, 0.6);
  c.fillRect(0.4, 20.6, 1.6, 1.2);
  if (sheathed) {
    c.fillStyle = '#f2c94c';
    c.beginPath();
    c.ellipse(0, -0.4, 2, 0.7, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#1a1620';
    c.fillRect(-0.75, -6, 1.5, 5.4);
    c.fillStyle = '#f4f2ee';
    for (let y = -5.4; y < -1; y += 1.3) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(0.6, y + 0.6);
      c.lineTo(0, y + 1.2);
      c.lineTo(-0.6, y + 0.6);
      c.fill();
    }
  }
  c.restore();
}

// ======================================================================================
// His rig and animations (world/tengu.js runs him). On the player character, in TENGU_LOOK, drawn
// TENGU_SCALE times as big, with poses and acting of his own:
//   - his bearing: pleased with himself. He stands with his weight on one hip, chin up, looking
//     down his nose, the fan held lazily before his chest; he strolls after the Onmyoji fanning
//     himself; and when the way is long or up a ledge he spreads his wings and flies;
//   - his moves (world/tengu.js): a lightning iai past the monster and a slow, insolent sheathe;
//     the Kurama blade (rising, cross and down cuts, a dash clean through); the fan swept round in
//     a gust; the fan twirled overhead for a whirlwind; his wings thrown wide for a storm of
//     feathers; a careless flick of the fan at the sky for the stones; a swoop, a carry and a
//     hurl for Spirited Away. Quick and sharp: snapping blows, then a held, showy pose;
//   - his moods: a grin and a snap of the fan when he wins, a 'tch' when he misses;
//   - his idle moods: fanning himself, flicking his hair back, setting his mask straight,
//     preening a wing, a scoff at the Onmyoji, admiring himself in his half-drawn blade;
//   - and a layer of life: breath, a slow sway, hair and robe on springs, his wings settling.

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const soft = (t) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t));
const lerp = (a, b, t) => a + (b - a) * t;
const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const bump = (p, a, b) => (p < a || p > b ? 0 : Math.sin(((p - a) / (b - a)) * Math.PI));
const TAU = Math.PI * 2;

// ---------- His poses ----------
// lean, lunge, lift; hand (the front hand), free (the other); fan (its angle, 0 up, + forward),
// twirl; blade (the sword's angle), sword (0 sheathed, 1 drawn: the sword in his front hand, the
// fan in the other); wing (0 folded, 1 thrown wide), flap; legF / legB [ahead, up, tilt]; squat;
// tx, by; hx, hy, tilt (head); cloth; and his face: mouth, eyes, brows, lid, glance.
const HAND = [2.2, -8.6];
const FREE = [-0.4, -1.4];
const REST = {
  lean: -0.03, lunge: 0, lift: 0, hand: HAND, free: FREE, fan: -0.35, twirl: 0, blade: 0, sword: 0, wing: 0, flap: 0, legF: [3.4, 0, 6], legB: [-3.6, 0, -7], squat: 0,
  tx: 0.3, by: 0, hx: 0.3, hy: -0.2, tilt: -3, cloth: 0, mouth: 'tengusmirk', eyes: null, brows: 'smug', lid: 0.25, glance: 0,
};
const pose = (o) => ({ ...REST, ...o });
const BROWS = { smug: [[0.1, -0.1], [0.5, -0.45]], cool: [[-0.05, 0.15], [-0.05, 0.15]], focus: [[-0.3, 0.6], [-0.3, 0.6]], raised: [[0.55, -0.5], [0.55, -0.5]], annoyed: [[-0.2, 0.5], [0.3, -0.3]] };

const standing = () => pose({});
// A smug stroll: unhurried steps on his tall geta, chin up, fanning himself as he goes.
function walking(ph) {
  const s = Math.sin(ph);
  const c = Math.cos(ph);
  return pose({
    legF: [2.4 + 2.6 * s, -1.4 * Math.max(0, c), 9 * s], legB: [-2.4 - 2.6 * s, -1.4 * Math.max(0, -c), -9 * s], by: -0.4 * Math.abs(c), tx: 0.3 + 0.4 * s,
    fan: -0.35 + 0.35 * Math.sin(ph * 0.5), hand: [2.2 + 0.6 * Math.sin(ph * 0.5), -8.6], free: [0.2 - 1.6 * s, -1], cloth: -1.4 * s, tilt: -3 + 1.2 * s, eyes: 'half',
  });
}
// Flying: wings wide and beating to lift off, then a glide with the odd beat, leaning into it, legs
// trailing, robe and hair streaming; flaring to land.
function flying(s, t) {
  const beat = s < 0.3 || s > 0.85 ? 1 : 0.3;
  return pose({
    wing: 1, flap: 0.55 * Math.sin(t * 13) * beat, lean: 0.28 * (1 - soft(seg(s, 0.8, 1))) - 0.1 * soft(seg(s, 0.8, 1)), legF: [1.4, -2.6, 26], legB: [-3, -1.4, -18], cloth: -4,
    hand: [3, -7], fan: 0.6, free: [-2, -4], tilt: 2, mouth: 'tengusmirk', eyes: s > 0.3 && s < 0.8 ? 'half' : null,
  });
}

// ---------- His moves (TENGU_MOVES in world/tengu.js; `u` on his swift clock) ----------
// Iai (the cut at 0.36, dashing 0.28-0.34): a hand on the hilt, low and still; one flash forward
// and he's past, the blade high behind him; held there a beat, chin up; then the slow, insolent
// sheathe (the click at 0.82) and a grin.
function iai(u) {
  const ready = soft(seg(u, 0, 0.24));
  const out = u >= 0.28;
  const hold = soft(seg(u, 0.4, 0.6));
  const home = soft(seg(u, 0.6, 0.82));
  const back = soft(seg(u, 0.86, 1));
  return pose({
    sword: out && u < 0.82 ? 1 : 0,
    blade: keys(u, [[0.28, -2.2], [0.34, 1.6, 'snap'], [0.6, 1.2], [0.8, 2.2]]),
    hand: out ? keys(u, [[0.28, [-2, 1]], [0.34, [9, -6], 'snap'], [0.6, [7, -9]], [0.8, [-1.6, 1]], [0.9, HAND]]) : lerp2(HAND, [-1.8, 1.2], ready),
    free: out ? lerp2([-3, -3], FREE, back) : lerp2(FREE, [-1, 0.6], ready),
    squat: 2.6 * ready * (out ? 1 - hold : 1), lean: out ? keys(u, [[0.28, 0.3], [0.34, 0.42, 'snap'], [0.6, 0.02], [1, -0.03]]) : 0.18 * ready, lunge: out ? 4 * (1 - hold) : 0,
    legF: out ? [5 * (1 - hold) + 3.4 * hold, 0, 12] : [4.4, 0, 10], legB: out ? [-5.6 * (1 - hold) - 3.6 * hold, 0, -14] : [-4.6, 0, -12], cloth: out ? 5 * (1 - hold) : 0, wing: 0.2 * bump(u, 0.28, 0.5),
    tilt: out ? -3 - 4 * hold * (1 - back) : 3 * ready, mouth: u > 0.8 && u < 0.95 ? 'tengugrin' : 'tengusmirk', brows: out && u < 0.6 ? 'cool' : u > 0.8 ? 'raised' : 'focus', eyes: ready > 0.5 && !out ? 'half' : u > 0.4 && u < 0.8 ? 'blink' : null,
    lid: 0.3 + 0.1 * home,
  });
}
// The Kurama blade (cuts at 0.18, 0.34, 0.5; dashing through 0.66-0.74): drawn in a blink, a
// rising cut, a cut across, a cut down, stepping in; the blade cocked low behind him, a dash clean
// through, and a flourish and sheathe.
function kurama(u) {
  const back = soft(seg(u, 0.9, 1));
  const blade = keys(u, [[0, 0], [0.06, 2.4], [0.18, -0.4, 'snap'], [0.26, -1.7], [0.34, 1.7, 'snap'], [0.42, -0.5], [0.5, 2.6, 'snap'], [0.6, -2.2], [0.66, -2.3], [0.74, 1.5, 'snap'], [0.84, 1.1], [0.88, 3.4], [0.92, 2.2]]);
  const reach = clamp01((Math.cos(blade) + 1) / 2);
  const hand = lerp2(lerp2([7, 2], [5, -13], reach), HAND, back);
  return pose({
    sword: u > 0.04 && u < 0.92 ? 1 : 0, blade, hand: u < 0.06 ? lerp2(HAND, [-1.8, 1.2], soft(u / 0.06)) : hand, free: lerp2([-3, -2.6], FREE, back),
    lean: (0.1 + 0.2 * Math.sin(blade) + (u > 0.66 && u < 0.76 ? 0.25 : 0)) * (1 - back), squat: (1.6 + 1.2 * bump(u, 0.6, 0.78)) * (1 - back), lunge: 3 * (1 - back),
    legF: [4.6 + 1.4 * Math.sin(u * 30) * (1 - back), 0, 12], legB: [-5, 0, -14], cloth: 4 * Math.sin(blade) * (1 - back), tilt: 2 - 6 * back,
    mouth: u > 0.74 && u < 0.92 ? 'tengugrin' : 'tengusmirk', brows: u < 0.8 ? 'focus' : 'raised', lid: 0.15, wing: 0.15 * Math.abs(Math.sin(blade)),
  });
}
// Fan Gust (0.38): the fan drawn back over his shoulder, his weight going back, then swept round
// and out in a great arc as he steps into it, wings half open; held, then lowered.
function gust(u) {
  const back = soft(seg(u, 0.75, 1));
  return pose({
    fan: keys(u, [[0, -0.35], [0.3, -2.2], [0.38, 1.9, 'snap'], [0.6, 1.6], [1, -0.35]]), twirl: 0.3 * bump(u, 0.3, 0.5),
    hand: keys(u, [[0, HAND], [0.3, [-4, -12]], [0.38, [9, -2], 'snap'], [0.6, [8, -3]], [1, HAND]]), free: keys(u, [[0, FREE], [0.3, [3, -6]], [0.38, [-4, -6]], [1, FREE]]),
    lean: keys(u, [[0, -0.03], [0.3, -0.14], [0.38, 0.3, 'snap'], [0.6, 0.2], [1, -0.03]]), lunge: 4 * bump(u, 0.34, 0.8), squat: 1.4 * bump(u, 0.3, 0.8),
    legF: [4.4 + 2 * bump(u, 0.34, 0.8), 0, 12], legB: [-4.8, 0, -12], cloth: keys(u, [[0, 0], [0.3, 3], [0.4, -6, 'snap'], [1, 0]]), wing: 0.4 * bump(u, 0.25, 0.8),
    tilt: -3 + 5 * bump(u, 0.34, 0.7), mouth: u > 0.36 && u < 0.7 ? 'tengugrin' : 'tengusmirk', brows: u > 0.3 && u < 0.7 ? 'focus' : 'smug', lid: 0.2 * (1 - back) + 0.25 * back,
  });
}
// Tengu Wind (0.5): the fan raised overhead and twirled round and round, then thrust down at them;
// held as the whirlwind takes them.
function whirlwind(u) {
  const up = soft(seg(u, 0, 0.14));
  const spin = seg(u, 0.12, 0.46);
  const down = overshoot(seg(u, 0.46, 0.52));
  const back = soft(seg(u, 0.8, 1));
  const turn = spin * TAU * 2.5;
  const over = [2 + 1.6 * Math.sin(turn), -16 + 1.2 * Math.cos(turn)];
  return pose({
    hand: lerp2(lerp2(lerp2(HAND, over, up), [9.4, -6], down), HAND, back), fan: lerp(lerp(lerp(-0.35, -0.2 + turn, up), 1.5, down), -0.35, back) % TAU, twirl: up * (1 - down) * Math.sin(turn * 2) * 0.8,
    free: lerp2(lerp2(FREE, [-3, -5], up), FREE, back), lean: (-0.08 * up + 0.32 * down) * (1 - back), lunge: 4 * down * (1 - back), squat: 1.6 * down * (1 - back),
    legF: [4.2, 0, 10], legB: [-4.6, 0, -12], cloth: (2.4 * Math.sin(turn) * (1 - down) - 5 * down) * (1 - back), wing: 0.5 * up * (1 - back), flap: 0.1 * Math.sin(turn),
    tilt: -6 * up * (1 - down) + 4 * down * (1 - back) - 3 * back, mouth: down > 0.3 && back < 0.5 ? 'tengugrin' : 'tengusmirk', brows: 'focus', lid: 0.15, eyes: up > 0.5 && down < 0.3 ? 'half' : null,
  });
}
// Feather Storm (0.42): a crouch, then a spring up with his wings thrown wide and arms flung out,
// the feathers flying; he floats down folding his wings.
function feathers(u) {
  const crouch = soft(seg(u, 0, 0.3)) * (1 - soft(seg(u, 0.34, 0.42)));
  const burst = overshoot(seg(u, 0.36, 0.44));
  const fold = soft(seg(u, 0.62, 1));
  const on = burst * (1 - fold);
  return pose({
    wing: on + 0.2 * crouch, flap: -0.35 * crouch + 0.25 * bump(u, 0.4, 0.55), squat: 2.4 * crouch, lift: 6 * on * (1 - soft(seg(u, 0.5, 0.75))),
    hand: lerp2(lerp2(HAND, [1, -5], crouch), [7.6, -9.6], on), free: lerp2(lerp2(FREE, [1, -4], crouch), [-6.6, -9.6], on), fan: lerp(-0.35, 0.9, on),
    lean: 0.16 * crouch - 0.12 * on, legF: [3.6, -1.6 * on, 10 + 10 * on], legB: [-4, -1 * on, -10 - 8 * on], cloth: -3 * on, tilt: 3 * crouch - 7 * on,
    mouth: on > 0.3 ? 'tengugrin' : 'tengusmirk', brows: on > 0.3 ? 'raised' : 'focus', lid: 0.1, eyes: crouch > 0.5 ? 'half' : null,
  });
}
// Tengu Stones (0.4): he barely looks: a careless flick of the fan up at the sky, eyes half shut, a
// 'hah', and back to fanning himself.
function stones(u) {
  const flick = keys(u, [[0, 0], [0.3, -0.4], [0.4, 1, 'snap'], [0.65, 0.9], [1, 0]]);
  return pose({
    fan: lerp(-0.35, -1.2, Math.max(0, flick)) + 0.5 * Math.min(0, flick), hand: lerp2(HAND, [3.4, -15], Math.max(0, flick)), twirl: 0.6 * bump(u, 0.36, 0.5),
    tilt: -3 - 5 * Math.max(0, flick), hy: -0.2 - 0.4 * Math.max(0, flick), eyes: u > 0.2 && u < 0.8 ? 'half' : null, lid: 0.45, mouth: u > 0.38 && u < 0.7 ? 'tenguhah' : 'tengusmirk', brows: 'smug',
  });
}
// Spirited Away (the swoop 0.08-0.24, carried up 0.26-0.6, hurled at 0.68, landing 0.82-1): wings
// wide the whole way: leaning into a swoop, a hand thrust out to catch it, hauling it up under
// him, the hurl (both arms flung down), and the wings flaring to land.
function spirited(u, t) {
  const swoop = bump(u, 0.04, 0.28);
  const carry = soft(seg(u, 0.24, 0.3)) * (1 - soft(seg(u, 0.66, 0.7)));
  const hurl = overshoot(seg(u, 0.66, 0.72)) * (1 - soft(seg(u, 0.8, 0.9)));
  const land = bump(u, 0.82, 1);
  const wing = 1 - soft(seg(u, 0.92, 1));
  return pose({
    wing, flap: (0.5 * Math.sin(t * 12) * (carry + land) + 0.15 * Math.sin(t * 5)) * wing, lean: 0.5 * swoop + 0.05 * carry + 0.4 * hurl - 0.15 * land,
    hand: lerp2(lerp2(lerp2(HAND, [10, -3], swoop), [7, 3], carry), [10, 4], hurl), free: lerp2(lerp2(FREE, [-3, -6], swoop + carry), [6, 3], hurl), fan: 0.8,
    legF: [1.6 + 2 * land, -2.4 * (swoop + carry), 20 * (swoop + carry)], legB: [-3, -1.4 * (swoop + carry), -16 * (swoop + carry)], squat: 2 * land, cloth: -4 * (swoop + carry) + 3 * hurl,
    tilt: 2 + 6 * carry - 4 * hurl, mouth: carry > 0.3 ? 'tengugrin' : hurl > 0.3 ? 'tenguhah' : 'tengusmirk', brows: 'focus', lid: 0.15,
  });
}
const MOVES = { iai, kurama, gust, whirlwind, feathers, stones, spirited };

// ---------- His moods and idle moods ----------
// Pleased with himself: the fan snapped open before his mouth, a grin behind it, brows up.
const smug = () => pose({ hand: [1.4, -11], fan: 0.15, mouth: 'tengugrin', brows: 'raised', lid: 0.35, tilt: -5 });
// Missed: a 'tch', a glance aside, the fan tapped against his palm.
const tch = (t) => pose({ mouth: 'tengutch', brows: 'annoyed', glance: 1, hx: 0.9, fan: 0.6 + 0.3 * Math.max(0, Math.sin(t * 9)), hand: [3.4, -5], free: [2, -4], lid: 0.4, tilt: 4 });
export const TENGU_IDLES = {
  fanself: [3.2, (u) => {
    const k = soft(seg(u, 0, 0.15)) * (1 - soft(seg(u, 0.85, 1)));
    return pose({ hand: lerp2(HAND, [1.4, -12], k), fan: lerp(-0.35, -0.1 + 0.4 * Math.sin(u * TAU * 4), k), twirl: 0.3 * k, eyes: k > 0.5 ? 'half' : null, lid: 0.4, tilt: -3 - 2 * k });
  }],
  hairflick: [2.4, (u) => {
    const k = soft(seg(u, 0, 0.3)) * (1 - soft(seg(u, 0.7, 1)));
    const flick = soft(seg(u, 0.3, 0.45)) * (1 - soft(seg(u, 0.7, 1)));
    return pose({ free: lerp2(lerp2(FREE, [3.4, -15.6], k), [6.4, -15], flick), tilt: -3 - 6 * flick, hy: -0.2 - 0.3 * flick, eyes: flick > 0.4 && flick < 0.9 ? 'blink' : null, mouth: 'tengusmirk', brows: 'smug' });
  }],
  mask: [2.6, (u) => {
    const k = soft(seg(u, 0, 0.25)) * (1 - soft(seg(u, 0.75, 1)));
    return pose({ free: lerp2(FREE, [-3.4 + 0.5 * Math.sin(u * 30) * k, -17], k), tilt: -3 + 6 * k, glance: 0.6 * k, lid: 0.3 });
  }],
  preen: [3, (u) => {
    const k = bump(u, 0.05, 0.95);
    return pose({ wing: 0.55 * k, flap: 0.12 * Math.sin(u * 60) * k, glance: k > 0.3 ? 1 : 0, hx: 0.3 + 0.8 * k, tilt: -3 + 4 * k, eyes: k > 0.6 ? 'half' : null });
  }],
  scoff: [2.4, (u) => {
    const k = soft(seg(u, 0, 0.2)) * (1 - soft(seg(u, 0.8, 1)));
    return pose({ glance: -k, hx: 0.3 - 1 * k, tilt: -3 - 5 * k, hy: -0.2 - 0.4 * k, mouth: u > 0.3 && u < 0.55 ? 'tenguhah' : 'tengusmirk', brows: 'smug', lid: 0.45 });
  }],
  polish: [3.4, (u) => {
    const k = soft(seg(u, 0.1, 0.3)) * (1 - soft(seg(u, 0.75, 0.9)));
    const on = u > 0.18 && u < 0.86;
    return pose({ sword: on ? 1 : 0, blade: 0.25, hand: on ? lerp2([-1.6, 1], [3, -11], k) : lerp2(HAND, [-1.6, 1], soft(seg(u, 0, 0.18)) * (1 - soft(seg(u, 0.86, 1)))), free: [-1, -5], fan: 0.4, eyes: k > 0.5 ? 'half' : null, lid: 0.35, mouth: k > 0.5 ? 'tengugrin' : 'tengusmirk', brows: 'raised', tilt: -2 + 3 * k });
  }],
};
const IDLE_KEYS = Object.keys(TENGU_IDLES);

// ---------- His rig ----------
// Quick, light springs: his hands and props snappy (a snap stays sharp), his body a touch slower.
const SLOW = { k: 170, damp: 0.84 };
const QUICK = { k: 420, damp: 0.8 };
const QUICK_KEYS = new Set(['hand', 'free', 'blade', 'fan', 'twirl', 'flap']);
function follow(st, target, dt) {
  if (!st.P) return (st.P = structuredClone(target));
  const n = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / n;
  const P = { ...target };
  for (const key of Object.keys(target)) {
    const { k, damp } = QUICK_KEYS.has(key) ? QUICK : SLOW;
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
    // (The sword is in his hand or not: no springing between.)
    if (key === 'sword') P[key] = to;
    else if (typeof to === 'number' && typeof was === 'number') [P[key], st.V[key]] = step(was, st.V[key] ?? 0, to);
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

// `k.idle` (with `k.idleT0`) forces one idle mood, for recording.
export function drawTenguCompanion(ctx, world, k, cam, time) {
  if (!k?.body) return;
  let st = STATE.get(k);
  if (!st) {
    st = { last: time, P: null, V: {}, walk: 0, vx: 0, idle: null, idleAt: time + 2 };
    STATE.set(k, st);
  }
  const dt = Math.max(0, Math.min(0.05, time - st.last));
  st.last = time;
  const a = k.act;
  if (a || k.moving || k.flying || k.mood) st.idleAt = Math.max(st.idleAt, time + 2);
  if (k.idle) st.idle = { kind: k.idle, t0: k.idleT0 ?? 0 };
  else if (!a && !k.moving && !k.flying && !k.mood && time >= st.idleAt) {
    const pick = IDLE_KEYS.filter((b) => b !== st.idle?.kind);
    st.idle = { kind: pick[Math.floor(Math.random() * pick.length)], t0: time };
    st.idleAt = time + TENGU_IDLES[st.idle.kind][0] + 1.5 + Math.random() * 2;
  }
  if (!k.idle && st.idle && (a || k.moving || k.flying || k.mood || time - st.idle.t0 > TENGU_IDLES[st.idle.kind][0])) st.idle = null;
  let p;
  if (a && MOVES[a.kind]) p = MOVES[a.kind](clamp01((a.clock ?? world.now - a.t0) / a.dur), time);
  else if (k.flying && k.flight) p = flying(clamp01(k.flight.t / k.flight.dur), time);
  else if (k.moving) {
    st.walk += dt * Math.min(1.6, Math.abs(k.vx) / 60) * 5;
    p = walking(st.walk);
  } else if (k.mood?.kind === 'smug') p = smug();
  else if (k.mood?.kind === 'tch') p = tch(time);
  else if (st.idle) p = TENGU_IDLES[st.idle.kind][1](clamp01((time - st.idle.t0) / TENGU_IDLES[st.idle.kind][0]));
  else p = standing();
  // (A hairline stop on a hit holds him.)
  const P = follow(st, p, a?.freeze > 0 ? 0 : dt);

  // The life layer.
  const calm = a ? 0.4 : 1;
  const breath = Math.sin(time * 1.2);
  const shift = Math.sin(time * 0.45);
  const breeze = Math.sin(time * 0.8) + 0.5 * Math.sin(time * 2.1 + 1);
  const dir = k.dir || 1;
  const fvx = k.flying && k.flight ? (k.flight.x1 - k.flight.x0) / k.flight.dur : k.vx;
  const v = (fvx * dir) / 100;
  const S = (name, to, kk, c) => {
    [st[name], st[name + 'V']] = spring(st[name] ?? to, st[name + 'V'] ?? 0, to, kk, c, dt);
    return st[name];
  };
  const hair = S('hair', -1.2 * v + 0.5 * breeze + (k.flying ? -2 : 0) - 1.5 * P.wing * Math.sin(P.flap * 3), 55, 5.5);
  const tip = S('tip', hair + 0.4 * Math.sin(time * 1.7), 38, 4.2);
  const sway = S('sway', P.cloth + 0.8 * breeze * calm - 2 * v, 80, 7.5);
  // (His folded wings settle a beat behind the body.)
  const wingLag = S('wingLag', P.flap, 60, 6);

  const x = k.x - cam.x;
  const y = k.y - cam.y - (k.air ?? 0);
  const rig = {
    tx: q(P.tx + 0.35 * shift * calm), by: q(P.by + 0.3 * breath * calm), hx: q(P.hx + 0.2 * shift * calm), hy: q(P.hy + 0.22 * breath * calm), tilt: deg(P.tilt + 1.2 * shift * calm),
    frontArm: [q(P.hand[0]), q(P.hand[1] + 0.25 * breath * calm)], backArm: [q(P.free[0]), q(P.free[1] + 0.3 * breath * calm)], armSide: 1,
    frontLeg: [q(P.legF[0]), q(P.legF[1]), deg(P.legF[2])], backLeg: [q(P.legB[0]), q(P.legB[1]), deg(P.legB[2])], squat: q(P.squat), cape: q(sway),
    hair: q(Math.max(-3, Math.min(3, hair))), hairTip: q(Math.max(-4, Math.min(4, tip))), hairLift: Math.abs(hair) > 1.6 ? -1 : 0, hairWave: Math.floor((((time / 1.9) % 1) + 1) % 1 * 8),
    eyes: P.eyes ?? tenguBlink(time), face: { brows: BROWS[P.brows] ?? BROWS.smug, glance: q(P.glance) },
  };
  const look = { ...TENGU_LOOK, mouth: P.mouth, lid: q(P.lid) };
  const X = Math.round(x * 4) / 4;
  const Y = Math.round(y * 4) / 4;
  const opts = { scale: TENGU_SCALE, facing: dir, hold: 'front', lean: { tilt: P.lean + 0.012 * shift * calm, lunge: P.lunge, lift: P.lift } };
  // His wings, from between his shoulders, behind him: the far one first.
  const root = posedPoint(X, Y, rig, opts, [15.5, 27]);
  const spread = clamp01(P.wing);
  const flap = wingLag + 0.04 * breath * (1 - spread);
  paintWing(ctx, [root[0] - dir * 1.5, root[1]], -dir, spread, flap, TENGU_SCALE, true);
  paintWing(ctx, [root[0] + dir * 1.5, root[1]], dir, spread * 0.92, flap, TENGU_SCALE);
  const hip = posedPoint(X, Y, rig, opts, [12.6, 33.6]);
  const drawn = P.sword >= 0.5;
  paintSaya(ctx, hip, dir < 0, TENGU_SCALE, !drawn);
  // The fan goes to his other hand while the sword's out (behind him, in his far hand).
  const under = (c, hand, flip, other) => {
    if (drawn) paintFan(c, other, flip, P.fan * 0.6 - 0.2, TENGU_SCALE, P.twirl);
  };
  const over = (c, hand, flip) => {
    if (drawn) {
      // A fast blade leaves a pale arc behind it.
      st.trail = [P.blade, ...(st.trail ?? [])].slice(0, 5);
      const speed = st.trail[1] != null ? Math.abs(P.blade - st.trail[1]) / Math.max(dt, 1e-3) : 0;
      if (speed > 6) {
        c.save();
        for (let i = st.trail.length - 1; i >= 1; i--) {
          c.globalAlpha = 0.3 * (1 - i / st.trail.length) * Math.min(1, (speed - 6) / 8);
          paintSword(c, hand, flip, st.trail[i], TENGU_SCALE);
        }
        c.restore();
      }
      paintSword(c, hand, flip, P.blade, TENGU_SCALE);
    } else {
      st.trail = null;
      paintFan(c, hand, flip, P.fan, TENGU_SCALE, P.twirl);
    }
  };
  drawPosed(ctx, look, X, Y, rig, { ...opts, under, over });
}
// Unhurried blinks.
function tenguBlink(t) {
  const b = (t * 0.25) % 1;
  return b < 0.014 ? 'blink' : b < 0.03 ? 'half' : 'open';
}
