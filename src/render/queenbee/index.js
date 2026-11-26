// The Queen Bee on screen (2026-11-25, remade as Little Queen Honeybun, the player's pick "C" of
// three): Petal Meadow's field boss. The hive's brand-new queen is a toddler, and she rules from a
// royal flying honey pot: a round cream pot with a glossy glaze, a honeycomb band, a heart label with
// her crown on it and fat honey drips over its rim, buzzing along on four little sugar-glass wings.
// She sits in it up to her middle (her legs are in the pot) in a fuzzy bee-onesie hood with plum
// bands, a plush rim round her face and two heart-pompom feelers; a gold crown far too big for her
// perched on top; cocoa pigtail puffs with pink bobbles poking out; a cherry-pink capelet with a
// fluffy trim; her sceptre a big honey-swirl lollipop. Huge round clover-green toddler eyes (three
// glints and a star, two chunky lashes, a pink lower lid). Bossy, pouty, giggly, prone to tantrums:
// "Her Majesty is NOT amused" is a full-on toddler meltdown.
// She moves on her own copy of the kid base's rig (kidrig.js: its bones, sway and springs; the
// base's own moves left out), drawn big for a boss. She always flies: the game counts a flyer as
// always moving, so her act and her flight go by her own travel speed.
//   idle    a 35 s act while she hovers still (eased beats, her face changing with each):
//           - a lick of her lollipop... it sticks to her cheek; a tug, a tug; a tantrum, fists
//             drumming the rim; POP, it comes off; a sniff;
//           - counting her honey: a peer into the pot, a finger of honey held up, a greedy giggle;
//           - a tiny Pollen Post courier bee buzzes up; she points it off on an errand; it salutes
//             and zips away;
//           - her crown slips down over her eyes; pushed back up with both hands, chin up, haughty;
//           - a doze in the pot (z's, nodding off), a jolt awake, a blink about;
//           - a royal wave to her subjects;
//           - a lean over the rim to lick a honey drip off the pot.
//   flying  the pot tipped into its travel, the wings a blur, her cape and feelers streaming.
//   fight   the slam, "Royal Tantrum" (m.special: through its warning the pot rises and she stands
//           up in it wailing and drumming her fists; it drops like a stone, a honey splash, her crown
//           popping off and wobbling back down); a bump up close, a BONK of the lollipop; the co-op
//           "Royal Honey Bomb" (m.coop's split ring, or a named m.cast): a great glob of honey scooped
//           on the lollipop, whirled overhead and flung; cross (aggro, a warning): a puffed-cheek
//           pout; hurt: a teary flinch, the crown knocked crooked; low on health: a sweat drop and a
//           worried pout, the wings buzzing harder; after landing a hit: a giggle behind her hand;
//           beaten: her crown falls off, she bawls, the pot tips over and honey pools under it.
//   entrance  woken at the giant hive (world/nest.js, m.nested, her first moments): the pot pops up
//           out of a burst of honey, she pops up out of the pot, her crown drops onto her head with
//           a bounce, a haughty little ta-da.
// Everything drawn here from scratch, live, outer outline only (an outline pass, then a fill pass).
import { dressRig } from './kidrig.js';
import { E, T, F } from '../mobs/kit.js';
import { band, curve, blob } from '../mobs/kidbase.js';
import { makeFringe } from '../mobs/fringe.js';
import { CHAR_LINE } from '../pixel.js';

const TAU = Math.PI * 2;
const D2R = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, u) => a + (b - a) * u;
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
// (a beat's weight: 0 before t0, eased up to 1 by t1, held to t2, eased back to 0 by t3)
const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
};
const hexRgb = (hex) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
// (the hit flash lifts every colour toward white)
const tone = (a, c, al = 1) => {
  const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
  const [r, g, b] = hexRgb(c).map((v) => Math.round(v + (255 - v) * k));
  return al >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${al})`;
};
const pen = (ctx, col, w) => {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
};
function sparkle(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x, y, x + s, y);
  ctx.quadraticCurveTo(x, y, x, y + s);
  ctx.quadraticCurveTo(x, y, x - s, y);
  ctx.quadraticCurveTo(x, y, x, y - s);
  ctx.fill();
}
function heartPath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.7, y - s * 1.2, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.7, y - s * 1.2, x + s * 1.4, y - s * 0.1, x, y + s * 0.9);
  ctx.closePath();
}
function glow(ctx, x, y, r, col, al) {
  if (al <= 0.01 || r <= 0.05) return;
  const [cr, cg, cb] = hexRgb(col);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${cr},${cg},${cb},${al})`);
  g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function hexPath(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const q = (i * TAU) / 6;
    const p = [x + Math.cos(q) * r, y + Math.sin(q) * r];
    if (i) ctx.lineTo(...p);
    else ctx.moveTo(...p);
  }
  ctx.closePath();
}
// A path filled (mode 'fill') or outlined in her soft ink (mode 'line').
function paint(ctx, a, mode, col, w) {
  if (mode === 'line') {
    ctx.strokeStyle = INK;
    ctx.lineWidth = w;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, col);
    ctx.fill();
  }
}
// Shape lists (kit.js E / T / F, kidbase band / curve / blob) drawn live: mode 'line' outlines every
// shape not marked F; 'fill' fills them all.
function drawShapes(ctx, a, mode, list, lw) {
  for (const s of list) {
    if (mode === 'line' && s.f) continue;
    ctx.beginPath();
    if (s.t === 'e') ctx.ellipse(s.x, s.y, Math.max(0.01, s.rx), Math.max(0.01, s.ry), 0, 0, TAU);
    else if (s.t === 'p') {
      const ox = s.x ?? 0;
      const oy = s.y ?? 0;
      s.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + ox, y + oy) : ctx.moveTo(x + ox, y + oy)));
      ctx.closePath();
    } else continue;
    if (mode === 'line') {
      ctx.strokeStyle = INK;
      ctx.lineWidth = lw;
      ctx.lineJoin = 'round';
      ctx.stroke();
    } else {
      ctx.fillStyle = tone(a, s.c);
      ctx.fill();
    }
  }
}

// ---------- Her colours (her outline the skin's own soft plum ink) ----------
const INK = CHAR_LINE;
const SKIN = { lt: '#fff6ee', base: '#ffe4d4', sh: '#f6c2ac', deep: '#e4a08c' };
const HAIR = ['#eab892', '#c67e50', '#9a5632', '#6e3820'];
const HOOD = ['#fff6c0', '#ffd84a', '#f0b42a', '#c88a1e'];
const PLUM = '#7a4460';
const GOLD = ['#fff4c0', '#ffd25a', '#f0aa2a', '#c47e1a'];
const CAPE = ['#ffd6e4', '#ff8ab4', '#e0588e', '#b83a70'];
const POT = ['#fffcf4', '#fbe8cc', '#ecc89e', '#c8966a'];
const HONEY = ['#fff3a8', '#ffc838', '#f0a020', '#c87810'];
const LASH = '#4a2030';
// (drawn big, for a boss: about the old Royal Bumble's height)
const BIG = 1.2;
// (the outline: 2 game px, in the base's units, a third of a game px each)
const LW = 6;

// ---------- Her head (head units: eyes at y 10, the face's edges at ±33, chin 32, skull top -50) ----------
const HS = 0.74;
const HX = 82;
const HY = 83 - 31 * HS;
const tbl = (pts, w0, w1, c) => band(curve(pts, 3), w0, w1, c, true);
const arc = (pts, w, c) => tbl(pts, w, w, c);
// Her eye: huge and round, a clover-green iris (a deep green rim, leaf green, a mint glow at the
// bottom), three glints and a star, two chunky lashes at the outer corner, a pink lower lid.
// Kinds: open (look: where it looks; lid: a lid lowered, cross or smug), shut ones (blink, happy
// arcs, squeezed hurt, sleep), greedy (gold coins of light), startled (small pupils, wide).
function eye(x, y, o, mood) {
  const out = [];
  const P = (u, v) => [x + u * o, y + v];
  const rx = 9.6;
  const ry = 11.2;
  const corner = (lid) => [
    ...tbl([P(rx * 0.86, -ry * 0.55 + lid * 0.5), P(rx * 1.3, -ry * 0.82 + lid * 0.4), P(rx * 1.42, -ry * 1.08 + lid * 0.3)], 2.2, 0.8, LASH),
    ...tbl([P(rx * 0.95, -ry * 0.2 + lid * 0.3), P(rx * 1.38, -ry * 0.3 + lid * 0.2), P(rx * 1.6, -ry * 0.5 + lid * 0.1)], 1.8, 0.7, LASH),
  ];
  if (mood === 'happy' || mood === 'giggle') {
    out.push(...tbl([P(-rx, 2.4), P(0, -7.4), P(rx, 2.4)], 2.8, 2.8, LASH), ...tbl([P(rx * 0.8, 0), P(rx * 1.25, -2.6), P(rx * 1.42, -4.8)], 2, 0.7, LASH));
    return out;
  }
  if (mood === 'hurt' || mood === 'wail' || mood === 'bawl') {
    // squeezed shut, tears welling (bawling: streams down her cheeks)
    out.push(...tbl([P(-rx, -3.4), P(-1.6, 1), P(rx * 0.9, -0.6)], 2.4, 3, LASH), ...tbl([P(-rx * 0.8, 4.4), P(rx * 0.9, 0.6)], 1.6, 2.2, LASH));
    out.push(F(blob([P(-2, 5), P(-6.4, 12), P(-3, 18), P(2, 15), P(1, 8)], '#c4eaff', 2)), F(E(x - 3 * o, y + 13, 1.4, 2, '#ffffff')));
    if (mood === 'bawl') out.push(F(blob([P(-6, 6), P(-9, 14), P(-9.6, 26), P(-6.6, 30), P(-5.4, 18), P(-3, 9)], '#b8e4ff', 2)), F(E(x - 7.6 * o, y + 24, 0.9, 2.4, '#ffffff')));
    return out;
  }
  if (mood === 'blink' || mood === 'sleep') {
    out.push(...tbl([P(-rx, 0.4), P(0, mood === 'sleep' ? 6.4 : 5), P(rx, 0.4)], 2.4, 2.4, LASH), ...tbl([P(rx * 0.8, 1), P(rx * 1.3, 0.2), P(rx * 1.55, -1.4)], 1.8, 0.7, LASH));
    return out;
  }
  const lid = mood === 'angry' || mood === 'bossy' ? 5.6 : mood === 'smug' ? 6.6 : mood === 'worried' ? 2.4 : 0;
  const wide = mood === 'startled' ? 1.08 : 1;
  out.push(E(x, y, rx * wide, ry * wide, '#ffffff'));
  const look = mood === 'lick' ? [-1.6, 3.4] : mood === 'up' ? [0.4, -4] : mood === 'down' || mood === 'greedy' ? [0.8, 3.6] : mood === 'side' ? [3.4, 0.6] : [1.2, 0.6];
  const ix = x + look[0] * o + 0.6;
  const iy = y + look[1];
  const ir = mood === 'startled' ? 0.8 : 1;
  out.push(F(E(ix, iy, rx * 0.84 * ir, ry * 0.86 * ir, '#1e6a4a')), F(E(ix, iy + 0.8, rx * 0.72 * ir, ry * 0.74 * ir, '#3aae6a')), F(E(ix, iy - ry * 0.34 * ir, rx * 0.66 * ir, ry * 0.34 * ir, '#228050')), F(E(ix, iy + ry * 0.5 * ir, rx * 0.52 * ir, ry * 0.3 * ir, '#9af0b8')));
  out.push(...arc([[ix - rx * 0.62 * ir, iy + ry * 0.3 * ir], [ix, iy + ry * 0.78 * ir], [ix + rx * 0.62 * ir, iy + ry * 0.3 * ir]], 0.8, '#d8ffe4'));
  if (mood === 'greedy') {
    // gold coins of light where her pupils were: honey on her mind
    out.push(F(E(ix, iy + 0.4, rx * 0.42, ry * 0.42, '#ffc838')), F(E(ix, iy + 0.4, rx * 0.28, ry * 0.28, '#fff3a8')), F(E(ix - 1.4, iy - 1.2, 1.4, 1.4, '#ffffff')));
  } else out.push(F(E(ix, iy + 0.6, rx * 0.36 * (mood === 'startled' ? 0.55 : 1), ry * 0.36 * (mood === 'startled' ? 0.55 : 1), '#0e3424')));
  out.push(F(E(ix - 3.4 * o, iy - 4.2, 3.4 * ir, 3.0 * ir, '#ffffff')), F(E(ix + 3.6 * o, iy + 4.6, 1.6, 1.6, '#ffffff')), F(E(ix - 0.4 * o, iy + 5.6, 0.9, 0.9, '#ffffff')));
  const sx = ix + 3.2 * o;
  const sy = iy - 4.6;
  out.push(F(T([[sx, sy - 2.6], [sx + 0.7, sy - 0.7], [sx + 2.6, sy], [sx + 0.7, sy + 0.7], [sx, sy + 2.6], [sx - 0.7, sy + 0.7], [sx - 2.6, sy], [sx - 0.7, sy - 0.7]], '#ffffff')));
  if (lid > 0) {
    // a lid down over the top: cross, it slants in; smug, it lies level and heavy; worried, out
    const inner = mood === 'angry' || mood === 'bossy' ? lid + 2.6 : mood === 'worried' ? lid - 2 : lid;
    const outer = mood === 'angry' || mood === 'bossy' ? lid - 3 : mood === 'worried' ? lid + 2 : lid;
    out.push(F(blob([P(-rx - 2, -ry - 3), P(rx + 2, -ry - 3), P(rx + 2, -ry + outer), P(0, -ry + (inner + outer) / 2 + 0.6), P(-rx - 2, -ry + inner)], SKIN.base, 1)));
    out.push(...tbl([P(-rx - 0.4, -ry + inner + 0.4), P(0, -ry + (inner + outer) / 2 + 0.6), P(rx + 0.4, -ry + outer + 0.4)], 2.8, 2.8, LASH));
  } else out.push(...tbl([P(-rx * 0.96, -2.6), P(-rx * 0.5, -ry * 0.98 * wide), P(rx * 0.4, -ry * 1.02 * wide), P(rx * 0.98, -2.4)], 2.2, 3.0, LASH));
  out.push(...corner(lid));
  out.push(...arc([P(-rx * 0.7, ry * 0.78), P(0, ry * 1.04), P(rx * 0.7, ry * 0.78)], 1.0, '#ff9ab8'));
  return out;
}
// Her face by mood: the eyes, little brows, the cheeks (puffed when cross), the mouth.
function face(mood) {
  const out = [];
  out.push(blob([[-33, -14], [-35, 6], [-31, 21], [-19, 30], [1, 33], [21, 30], [32, 20], [35, 5], [33, -14], [0, -30]], SKIN.base, 4));
  out.push(F(blob([[-33, -4], [-32, 14], [-26, 23], [-29, 8]], SKIN.sh, 2)));
  const puffed = mood === 'angry' || mood === 'wail' || mood === 'shout';
  const red = puffed || mood === 'bawl' ? '#ff8a9a' : '#ffbcc4';
  for (const cx of [-21, 24]) {
    out.push(F(E(cx, 19, puffed ? 10 : 8.4, puffed ? 7 : 5.6, red)));
    for (let i = 0; i < 3; i++) out.push(...arc([[cx + (i - 1) * 3 - 0.8, 20.6], [cx + (i - 1) * 3 + 0.8, 18.4]], 0.6, '#fff0f0'));
  }
  const eyeMood = { calm: 'open', talk: 'open', sad: 'worried', shout: 'angry', greedyGiggle: 'greedy', yawn: 'blink' }[mood] ?? mood;
  out.push(...eye(-13, 9, -1, eyeMood), ...eye(16, 9, 1, eyeMood));
  // little brows, tilted with her mood
  const brow = { angry: [4.4, -2], bossy: [3.6, -1.4], wail: [4, -2], shout: [4.4, -2], bawl: [-3.4, 2.4], hurt: [-3, 2], sad: [-3, 2], worried: [-3.4, 2.2], up: [-2.6, 0], startled: [-4, -3], smug: [-1.4, 1], greedy: [-1, 1.4] }[mood] ?? [0, 0];
  for (const o of [-1, 1]) {
    const cx = o < 0 ? -13 : 16;
    out.push(...tbl([[cx - 5 * o, -8 + brow[0]], [cx + 5 * o, -9 + brow[1]]], 2.6, 2.0, HAIR[3]));
  }
  // the mouth
  const M = (pts) => blob(pts, '#a02a44', 2);
  if (mood === 'wail' || mood === 'shout' || mood === 'bawl') {
    out.push(M([[-4, 20], [3, 19], [10, 20.4], [9, 28], [3, 31], [-3, 28]]), F(E(3, 28, 4.4, 2.2, '#ff8aa0')), F(blob([[-2.4, 20.8], [8.6, 21], [8, 22.6], [-1.8, 22.6]], '#ffffff', 1)));
  } else if (mood === 'angry' || mood === 'bossy') {
    // a pout: lip pushed out (bossy: one side, a smirk of command)
    if (mood === 'bossy') out.push(...tbl([[-1, 24.4], [3, 25], [7.4, 23.4]], 2.2, 2.2, '#b03a56'));
    else out.push(...tbl([[-1, 25.4], [3, 23.4], [7, 25.4]], 2.2, 2.2, '#b03a56'), F(E(3, 26.6, 2.6, 1.2, '#ff9ab0')));
  } else if (mood === 'hurt' || mood === 'worried' || mood === 'sad') {
    out.push(...tbl([[-3, 25], [-0.5, 23], [2, 25], [4.5, 23], [7, 25], [9.5, 23.4]], 1.6, 1.6, '#a02a44'));
  } else if (mood === 'happy' || mood === 'giggle' || mood === 'greedyGiggle' || mood === 'greedy') {
    out.push(M([[-4, 21], [3, 22], [10, 21], [8, 26.6], [3, 28.4], [-2, 26.6]]), F(E(3, 26, 3.6, 1.8, '#ff8aa0')));
  } else if (mood === 'smug') {
    out.push(...tbl([[-2, 23.6], [3, 24.8], [7.6, 22.4]], 2, 1.6, '#a02a44'));
  } else if (mood === 'lick') {
    out.push(M([[-1, 21], [3, 20.6], [7, 21.2], [6, 24.6], [3, 25.4], [0, 24.6]]), blob([[0.4, 23], [5.6, 23], [5.4, 28.4], [3, 29.6], [0.6, 28.4]], '#ff7a96', 2), F(E(2.4, 26, 0.9, 1.6, '#ffb0c0')));
  } else if (mood === 'startled' || mood === 'talk') {
    out.push(M([[0, 22], [3, 21], [6, 22], [6, 26], [3, 27.4], [0, 26]]), F(E(3, 25.4, 1.8, 1.0, '#ff8aa0')));
  } else if (mood === 'sleep' || mood === 'yawn') {
    out.push(M([[1, 23], [3, 22.4], [5, 23], [5, 25.6], [3, 26.4], [1, 25.6]]));
  } else if (mood === 'up') {
    out.push(...tbl([[0, 24.6], [3, 23.6], [6, 24.6]], 1.8, 1.8, '#a02a44'));
  } else {
    // a little cat smile
    out.push(...tbl([[-2, 22.4], [0.6, 24.4], [3, 22.8], [5.4, 24.4], [8, 22.4]], 1.6, 1.6, '#a02a44'));
  }
  return out;
}
// The hood's back: a fuzzy round bee hood with plum bands round the back of her head, a soft light
// on its crown; her pigtail puffs poking out at the sides, each tied with a pink bobble.
function hoodBack() {
  const out = [];
  for (const o of [-1, 1]) {
    out.push(E(47 * o, 15, 11.6, 12.6, HAIR[2]), F(E(46 * o, 12, 8.6, 8.6, HAIR[1])), F(E(44 * o, 8.6, 3.6, 2.6, HAIR[0])));
    out.push(...arc([[43 * o, 5], [52 * o, 15], [46 * o, 25]], 1.1, HAIR[3]), ...arc([[41 * o, 10], [47 * o, 19]], 0.8, HAIR[2]));
  }
  out.push(blob([[-46, 8], [-50, -26], [-36, -56], [0, -66], [36, -56], [50, -26], [46, 8], [36, 28], [0, 40], [-36, 28]], HOOD[1], 4));
  out.push(F(blob([[-44, 6], [-46, -24], [-36, -46], [-38, -14], [-34, 14]], HOOD[2], 3)));
  for (const [y, w] of [[-44, 4.4], [-24, 4.8]]) out.push(F(blob([[-49, y + 4], [-30, y - 6], [0, y - 9], [30, y - 6], [49, y + 4], [48, y + 4 + w * 2], [30, y + w * 2 - 4], [0, y + w * 2 - 7], [-30, y + w * 2 - 4], [-48, y + 4 + w * 2]], PLUM, 2)));
  out.push(F(E(-14, -54, 15, 5.4, HOOD[0])), F(E(-22, -50, 5, 2.4, '#ffffff')));
  // the bobbles on her puffs, over the hood's edge
  for (const o of [-1, 1]) out.push(E(39 * o, 6, 4.6, 4.6, CAPE[1]), F(E(38 * o, 4.6, 1.8, 1.4, CAPE[0])));
  return out;
}
// The plush rim round her face: soft fat scallops, each lit on top, sitting over the face's edge.
function hoodRim() {
  const out = [];
  const N = 15;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const q = Math.PI * 0.93 + (i / (N - 1)) * Math.PI * 1.14;
    pts.push([Math.cos(q) * 36.4, -4 + Math.sin(q) * 36]);
  }
  out.push(...tbl(pts, 13, 13, HOOD[1]));
  for (const [x, y] of pts) out.push(F(E(x, y, 6.4, 6.2, HOOD[1])));
  for (const [x, y] of pts) out.push(F(E(x - 1.2, y - 1.8, 3.4, 2.2, HOOD[0])));
  out.push(...arc(pts.map(([x, y]) => [x * 0.86, y * 0.86 - 0.6]), 1.2, HOOD[2]));
  return out;
}
const heads = {};
let FRINGE = null;
function headShapes(mood) {
  if (heads[mood]) return heads[mood];
  FRINGE ??= makeFringe({ C: HAIR, skinSh: SKIN.sh, seed: 5, style: 'cute', sides: 18 });
  const fr = FRINGE;
  return (heads[mood] = [...hoodBack(), ...face(mood), ...fr.shadow, ...fr.back, ...fr.front, ...fr.sides, ...hoodRim()]);
}

// ---------- In a bone's frame, in the base's own units (a third of a game px) ----------
function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const o = D.base(bone, [0, 0]);
  ctx.translate(o[0], o[1]);
  ctx.scale(1 / 3, 1 / 3);
}
// Her head frame, in head units.
function headFrame(ctx, a, D) {
  enter(ctx, a, D, 'head');
  ctx.translate(HX, HY);
  ctx.scale(HS, HS);
}
// Where a head-units point of hers is now (rig space).
function headAt(a, D, [u, v]) {
  return D.at(a, 'head', D.base('head', [HX + u * HS, HY + v * HS]));
}

// The feelers: stalks from the hood's crown, each ending in a heart pompom; they sway on their own,
// stream back in flight, droop when she's sad and spring up when startled.
function feelers(ctx, a, mode) {
  const q = a.qb ?? {};
  const t = a.t ?? 0;
  for (const o of [-1, 1]) {
    const root = [16 * o, -56];
    const sway = (q.antSway ?? 0) + Math.sin(t * 3.1 + o) * 0.08;
    const up = q.antUp ?? 0;
    const tip = [root[0] + o * 16 + Math.sin(sway) * 16, root[1] - 26 - up * 8 + Math.abs(sway) * 6 + (q.antDroop ?? 0) * 18];
    const mid = [root[0] + o * 4 + sway * 6, root[1] - 16 - up * 3];
    ctx.beginPath();
    ctx.moveTo(...root);
    ctx.quadraticCurveTo(...mid, ...tip);
    if (mode === 'line') pen(ctx, INK, 5 + LW / HS);
    else pen(ctx, tone(a, PLUM), 5);
    ctx.stroke();
    heartPath(ctx, tip[0], tip[1] - 1, 7);
    paint(ctx, a, mode, CAPE[1], LW / HS);
    if (mode === 'fill') {
      ell(ctx, tip[0] - 2.4, tip[1] - 3.6, 2.2, 1.6);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }
}
// The crown: gold, three gem points and a heart, far too big for her, perched crooked. `slip`
// slides it down over her eyes; `pop` sends it up off her head and `off` leaves it off (drawn on the
// ground by the fx when she's beaten); `drop` brings it down from above (her entrance).
function crownShape(ctx, a, mode) {
  ctx.beginPath();
  ctx.moveTo(-17, 4);
  ctx.lineTo(-19, -14);
  ctx.quadraticCurveTo(-12, -6, -9, -9);
  ctx.lineTo(0, -21);
  ctx.lineTo(9, -9);
  ctx.quadraticCurveTo(12, -6, 19, -14);
  ctx.lineTo(17, 4);
  ctx.quadraticCurveTo(0, 8, -17, 4);
  ctx.closePath();
  if (mode === 'line') {
    paint(ctx, a, 'line', null, LW / HS);
    for (const [x, y] of [[-19, -15], [0, -22], [19, -15]]) {
      ell(ctx, x, y, 3.6, 3.6);
      paint(ctx, a, 'line', null, LW / HS);
    }
    return;
  }
  ctx.fillStyle = tone(a, GOLD[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, -6, -8, 12, GOLD[0], 0.95);
  glow(ctx, 10, 4, 11, GOLD[3], 0.5);
  ctx.fillStyle = tone(a, GOLD[2]);
  ctx.fillRect(-20, 0.6, 40, 3);
  ctx.restore();
  for (const [x, y, c] of [[-19, -15, CAPE[1]], [0, -22, '#5ad0ff'], [19, -15, CAPE[1]]]) {
    ell(ctx, x, y, 3.6, 3.6);
    ctx.fillStyle = tone(a, c);
    ctx.fill();
    ell(ctx, x - 1, y - 1.1, 1.3, 1.2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  heartPath(ctx, 0, -1.6, 4.6);
  ctx.fillStyle = tone(a, CAPE[2]);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  sparkle(ctx, -9, -6, 1.8);
}
function crown(ctx, a, mode) {
  const q = a.qb ?? {};
  if (q.crownOff) return;
  ctx.save();
  const slip = q.crownSlip ?? 0;
  const lift = (q.crownPop ?? 0) * 46 + (q.crownDrop ?? 0) * 120;
  ctx.translate(4 - slip * 4, -62 + slip * 74 - lift);
  ctx.rotate(0.22 - slip * 0.3 + (q.crownPop ?? 0) * 1.1 + (q.crownDrop ?? 0) * 2.2 + (q.crownTip ?? 0) + (q.crownWob ?? 0));
  ctx.scale(1 + slip * 0.3, 1 + slip * 0.3);
  crownShape(ctx, a, mode);
  ctx.restore();
}
// Her lollipop stuck to her cheek (head units), or a honey smear where it was.
function stuckLolly(ctx, a, mode) {
  const q = a.qb ?? {};
  if ((q.smear ?? 0) > 0.02 && mode === 'fill') {
    ctx.globalAlpha = q.smear;
    ell(ctx, -24, 24, 6, 4.6, 0.3);
    ctx.fillStyle = tone(a, HONEY[1]);
    ctx.fill();
    ell(ctx, -25.4, 22.6, 2, 1.2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (!q.stuck) return;
  ctx.save();
  // (the candy flat on her near cheek, its stick out and down past her chin)
  ctx.translate(25 + (q.tug ?? 0) * 3, 19);
  ctx.rotate(-0.75 + (q.tug ?? 0) * 0.15);
  ctx.scale(0.8 / HS, 0.8 / HS);
  ctx.translate(0, 40);
  lollyShape(ctx, a, mode, 0);
  ctx.restore();
}
function head(ctx, a, mode, D) {
  headFrame(ctx, a, D);
  feelers(ctx, a, mode);
  drawShapes(ctx, a, mode, headShapes(a.qb?.face ?? 'calm'), LW / HS);
  stuckLolly(ctx, a, mode);
  crown(ctx, a, mode);
}

// ---------- Her clothes (kid units) ----------
// The cape: cherry pink over her shoulders, the back of it flaring out behind her (streaming as she
// flies), the front a capelet with a fluffy white trim, little hearts on it, a gold heart clasp.
function cape(ctx, a, mode, D, front) {
  enter(ctx, a, D, 'chest');
  const fly = a.qb?.fly ?? 0;
  const t = a.t ?? 0;
  if (!front) {
    const fl = Math.sin(t * 9) * fly * 2;
    ctx.beginPath();
    ctx.moveTo(70, 86);
    ctx.quadraticCurveTo(56 - fly * 10, 98 + fl, 50 - fly * 16, 112 - fly * 8 + fl);
    ctx.quadraticCurveTo(64, 118, 84, 110);
    ctx.lineTo(92, 88);
    ctx.closePath();
    paint(ctx, a, mode, CAPE[2], LW);
    if (mode === 'fill') glow(ctx, 62, 100, 10, CAPE[3], 0.5);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(66, 88);
  ctx.quadraticCurveTo(80, 80, 96, 88);
  ctx.quadraticCurveTo(99, 96, 96, 100);
  ctx.quadraticCurveTo(81, 104, 66, 100);
  ctx.quadraticCurveTo(63, 96, 66, 88);
  ctx.closePath();
  if (mode === 'line') return paint(ctx, a, 'line', null, LW);
  ctx.fillStyle = tone(a, CAPE[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, 76, 86, 9, CAPE[0], 0.8);
  glow(ctx, 70, 100, 8, CAPE[3], 0.4);
  ctx.restore();
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    ell(ctx, 66 + u * 30, 100 + Math.sin(u * Math.PI) * 2.6, 2.7, 2.5);
    ctx.fillStyle = tone(a, '#ffffff');
    ctx.fill();
  }
  for (const x of [71, 80, 89]) {
    heartPath(ctx, x, 101, 0.9);
    ctx.fillStyle = tone(a, CAPE[2]);
    ctx.fill();
  }
  ell(ctx, 81, 88, 3, 3);
  ctx.fillStyle = tone(a, GOLD[1]);
  ctx.fill();
  heartPath(ctx, 81, 88.4, 1.8);
  ctx.fillStyle = tone(a, CAPE[2]);
  ctx.fill();
}
// The onesie over her body: honey yellow with a plum band (no outline of its own: inside her).
function onesie(ctx, a, mode, D) {
  if (mode === 'line') return;
  enter(ctx, a, D, 'chest');
  ctx.beginPath();
  ctx.moveTo(66.4, 88);
  ctx.quadraticCurveTo(81, 84, 95.6, 88);
  ctx.lineTo(95.6, 100);
  ctx.quadraticCurveTo(96, 106, 92, 110);
  ctx.lineTo(70, 110);
  ctx.quadraticCurveTo(66, 106, 66.4, 100);
  ctx.closePath();
  ctx.fillStyle = tone(a, HOOD[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = tone(a, PLUM);
  ctx.beginPath();
  ctx.moveTo(60, 102);
  ctx.quadraticCurveTo(81, 106, 102, 102);
  ctx.lineTo(102, 107);
  ctx.quadraticCurveTo(81, 111, 60, 107);
  ctx.closePath();
  ctx.fill();
  glow(ctx, 88, 92, 8, HOOD[0], 0.6);
  ctx.restore();
}
// Fuzzy yellow sleeves over her arms, a white cuff at each wrist (upper arm and forearm frames).
function sleeve(ctx, a, mode, D, k) {
  for (const [bone, from, to, w0, w1] of [[`arm${k}u`, `sh${k}`, `el${k}`, 9.8, 8.6], [`arm${k}f`, `el${k}`, `wr${k}`, 8.6, 7.6]]) {
    ctx.save();
    D.frame(ctx, a, bone);
    const p0 = D.loc(from, bone);
    const p1 = D.loc(to, bone);
    const sc = 1 / 3;
    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    const L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L;
    const ny = dx / L;
    ctx.beginPath();
    ctx.moveTo(p0[0] + nx * w0 * 0.5 * sc, p0[1] + ny * w0 * 0.5 * sc);
    ctx.lineTo(p1[0] + nx * w1 * 0.5 * sc, p1[1] + ny * w1 * 0.5 * sc);
    ctx.arc(p1[0], p1[1], w1 * 0.5 * sc, Math.atan2(ny, nx), Math.atan2(-ny, -nx));
    ctx.lineTo(p0[0] - nx * w0 * 0.5 * sc, p0[1] - ny * w0 * 0.5 * sc);
    ctx.arc(p0[0], p0[1], w0 * 0.5 * sc, Math.atan2(-ny, -nx), Math.atan2(ny, nx));
    ctx.closePath();
    if (mode === 'line') paint(ctx, a, 'line', null, 2);
    else {
      ctx.fillStyle = tone(a, k === 'N' ? HOOD[1] : HOOD[2]);
      ctx.fill();
      if (bone.endsWith('f')) {
        ctx.fillStyle = tone(a, '#ffffff');
        ell(ctx, p1[0] - (dx / L) * 0.5, p1[1] - (dy / L) * 0.5, w1 * 0.64 * sc, w1 * 0.64 * sc);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
// The honey-swirl lollipop (its own frame, kid units: the grip at 0, 0, the stick up -y): a cream
// stick, a pink ribbon bow, a golden swirl of honey candy with a gold sugar rim, a glossy shine;
// `glob` a great dollop of honey gathering on it (the Honey Bomb).
function lollyShape(ctx, a, mode, glob) {
  const stick = () => {
    ctx.beginPath();
    ctx.moveTo(-1.7, 8);
    ctx.lineTo(-1.7, -30);
    ctx.arc(0, -30, 1.7, Math.PI, 0);
    ctx.lineTo(1.7, 8);
    ctx.arc(0, 8, 1.7, 0, Math.PI);
    ctx.closePath();
  };
  stick();
  paint(ctx, a, mode, '#fff8f0', LW);
  if (glob > 0.02) {
    // the honey glob, swelling round the candy and hanging in a fat drip
    const r = 13 + glob * 9;
    ctx.beginPath();
    ctx.moveTo(-r, -40);
    ctx.bezierCurveTo(-r, -40 - r * 1.3, r, -40 - r * 1.3, r, -40);
    ctx.bezierCurveTo(r, -40 + r * 0.8, r * 0.3, -40 + r * 0.9 + glob * 6, 0, -40 + r * 1.05 + glob * 8);
    ctx.bezierCurveTo(-r * 0.3, -40 + r * 0.9 + glob * 6, -r, -40 + r * 0.8, -r, -40);
    ctx.closePath();
    if (mode === 'line') return paint(ctx, a, 'line', null, LW);
  } else ell(ctx, 0, -40, 13, 13);
  if (mode === 'line') return paint(ctx, a, 'line', null, LW);
  if (glob > 0.02) {
    ctx.fillStyle = tone(a, HONEY[1]);
    ctx.fill();
    glow(ctx, -5, -48 - glob * 4, 10 + glob * 4, HONEY[0], 0.9);
    glow(ctx, 6, -32, 10, HONEY[3], 0.4);
    ell(ctx, -6, -50 - glob * 5, 3.4, 2.2, -0.5);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    return;
  }
  ctx.fillStyle = tone(a, HONEY[1]);
  ctx.fill();
  pen(ctx, tone(a, HONEY[0]), 3.2);
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    const r = 11 * u;
    const an = u * TAU * 2.3;
    if (i) ctx.lineTo(Math.cos(an) * r, -40 + Math.sin(an) * r);
    else ctx.moveTo(0, -40);
  }
  ctx.stroke();
  pen(ctx, tone(a, GOLD[2]), 1.6);
  ctx.beginPath();
  ctx.arc(0, -40, 12, 0, TAU);
  ctx.stroke();
  glow(ctx, -4, -45, 6, '#ffffff', 0.85);
  for (const s of [-1, 1]) {
    ell(ctx, s * 4.8, -26, 4.6, 2.9, s * 0.4);
    ctx.fillStyle = tone(a, CAPE[1]);
    ctx.fill();
  }
  ell(ctx, 0, -26, 2.1, 2.1);
  ctx.fillStyle = tone(a, CAPE[2]);
  ctx.fill();
}
// In her near hand, held upright whatever the arm does (then tipped by lollyR); slid up through her
// fist by `grip` (so the candy comes close to her mouth for a lick).
function lolly(ctx, a, mode, D, S) {
  const q = a.qb ?? {};
  if (q.stuck) return;
  enter(ctx, a, D, 'handN');
  ctx.translate(95, 113);
  const rot = (q.lollyR ?? 0) - ((S.shN ?? 0) + (S.elN ?? 0) + (S.hwN ?? 0) + (S.tilt ?? 0) * 0.65 + (S.waist ?? 0) * 0.45) * D2R;
  ctx.rotate(rot);
  ctx.translate(0, q.grip ?? 0);
  // (where the candy is, in the hand's frame, for the honey stream)
  const k = (-40 + (q.grip ?? 0)) / 3;
  const p0 = D.base('handN', [95, 113]);
  if (a.mo) a.mo.qbCandy = [p0[0] - Math.sin(rot) * k, p0[1] + Math.cos(rot) * k];
  // (straight down, in the lollipop's own frame: it is held upright whatever her arm does)
  const L = q.lollyR ?? 0;
  const down = [Math.sin(L), Math.cos(L)];
  const goo = Math.max(q.strand ?? 0, q.glob ?? 0);
  if (goo > 0.05) {
    // honey hanging off the candy: a long strand drawn up out of the pot, or drips off the glob
    const len = (q.strand ?? 0) > 0.05 ? 34 * q.strand : 10 + 8 * Math.sin((a.t ?? 0) * 3) ** 2;
    const tip = [down[0] * (len + 12), -40 + down[1] * (len + 12)];
    ctx.beginPath();
    ctx.moveTo(-down[1] * 3, -40 + down[0] * 3);
    ctx.quadraticCurveTo(tip[0] * 0.6, -40 + (tip[1] + 40) * 0.6, tip[0], tip[1]);
    ctx.quadraticCurveTo(tip[0] * 0.6 + down[1] * 1.2, -40 + (tip[1] + 40) * 0.6, down[1] * 3, -40 - down[0] * 3);
    ctx.closePath();
    paint(ctx, a, mode, HONEY[1], LW);
    ell(ctx, tip[0], tip[1], 2.4, 2.4);
    paint(ctx, a, mode, HONEY[1], LW);
  }
  lollyShape(ctx, a, mode, q.glob ?? 0);
}

// ---------- The royal honey pot (rig space: its middle under her hips, upright on its own tilt) ----------
const PS = 0.6;
const PW = 17;
const PH = 15;
function potAt(a, S, D) {
  const q = a.qb ?? {};
  const hip = D.K.rel('hip');
  return { c: [hip[0] + (S.x ?? 0), hip[1] - (S.hop ?? 0) + 6.6 + (q.potDrop ?? 0)], tilt: q.potTilt ?? 0 };
}
// Its four little wings, two a side, sugar-glass: a pearly teardrop each with a vein; they buzz on a
// beat kept running (its phase never jumps as the beat quickens), a soft blur over their sweep.
function potWings(ctx, a, mode, far) {
  const q = a.qb ?? {};
  const ph = q.wingPh ?? 0;
  const amp = q.wingAmp ?? 0.24;
  for (const o of [-1, 1]) {
    for (const [L, W, base, lag] of [[17, 8, -0.75, 0], [12, 6, -0.2, 0.4]]) {
      const beat = Math.sin(ph - lag - (far ? 0.6 : 0));
      const mid = (o < 0 ? Math.PI - base : base) - o * 0.6 + (far ? o * 0.2 : 0);
      const ang = mid - o * beat * amp;
      const root = [o * PW * 0.82, -PH * 0.35];
      if (mode === 'fill' && amp > 0.2) {
        ctx.save();
        ctx.globalAlpha *= Math.min(0.3, amp * 0.6);
        ctx.beginPath();
        ctx.moveTo(...root);
        ctx.arc(root[0], root[1], L * 0.95, mid - amp - 0.12, mid + amp + 0.12);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      }
      ctx.save();
      ctx.translate(...root);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(L * 0.3, -W, L * 0.95, -W * 0.9, L, 0);
      ctx.bezierCurveTo(L * 0.95, W * 0.7, L * 0.3, W * 0.6, 0, 0);
      ctx.closePath();
      if (mode === 'line') paint(ctx, a, 'line', null, 2 / PS);
      else {
        const g = ctx.createLinearGradient(0, 0, L, 0);
        g.addColorStop(0, tone(a, '#ffe6f2'));
        g.addColorStop(0.5, tone(a, far ? '#eef2ff' : '#fbfcff'));
        g.addColorStop(1, tone(a, far ? '#e2eaff' : '#eef4ff'));
        ctx.fillStyle = g;
        ctx.fill();
        glow(ctx, L * 0.6, -W * 0.2, L * 0.4, '#ffffff', 0.9);
        pen(ctx, tone(a, '#c8d4f0'), 0.6);
        ctx.beginPath();
        ctx.moveTo(L * 0.1, 0);
        ctx.quadraticCurveTo(L * 0.5, -W * 0.25, L * 0.88, -W * 0.05);
        ctx.moveTo(L * 0.35, W * 0.05);
        ctx.quadraticCurveTo(L * 0.55, W * 0.28, L * 0.78, W * 0.3);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}
function potBack(ctx, a, mode, S, D) {
  const { c, tilt } = potAt(a, S, D);
  ctx.translate(...c);
  ctx.rotate(tilt);
  ctx.scale(PS, PS);
  potWings(ctx, a, mode, true);
  // the back of the rim and the honey inside, catching the light
  ell(ctx, 0, -PH * 0.92, PW * 0.86, 4.2);
  if (mode === 'line') return paint(ctx, a, 'line', null, 2 / PS);
  ctx.fillStyle = tone(a, POT[2]);
  ctx.fill();
  ell(ctx, 0, -PH * 0.86, PW * 0.74, 3.2);
  ctx.fillStyle = tone(a, HONEY[1]);
  ctx.fill();
  glow(ctx, -4, -PH * 0.92, 5, '#fff8d0', 0.85);
}
// The pot's body (pot units): a round belly narrowing to a short neck under the rim.
function potBody(ctx) {
  ctx.beginPath();
  ctx.moveTo(-PW * 0.8, -PH * 0.9);
  ctx.bezierCurveTo(-PW * 1.28, -PH * 0.5, -PW * 1.22, PH * 0.78, -PW * 0.55, PH);
  ctx.quadraticCurveTo(0, PH * 1.1, PW * 0.55, PH);
  ctx.bezierCurveTo(PW * 1.22, PH * 0.78, PW * 1.28, -PH * 0.5, PW * 0.8, -PH * 0.9);
  ctx.quadraticCurveTo(0, -PH * 0.7, -PW * 0.8, -PH * 0.9);
  ctx.closePath();
}
function potRim(ctx) {
  ctx.beginPath();
  ctx.ellipse(0, -PH * 0.86, PW * 0.94, 3.8, 0, 0, Math.PI);
  ctx.ellipse(0, -PH * 0.86 - 0.4, PW * 0.94, 2.4, 0, Math.PI, 0, true);
  ctx.closePath();
}
// The fat honey drips over its rim (pot units): [x, length, width].
const DRIPS = [[-9.6, 4.6, 2.3], [-1.2, 9.6, 2.8], [8.4, 6.2, 2.4]];
function potFront(ctx, a, mode, S, D) {
  const q = a.qb ?? {};
  const t = a.t ?? 0;
  const { c, tilt } = potAt(a, S, D);
  ctx.translate(...c);
  ctx.rotate(tilt);
  ctx.scale(PS, PS);
  potWings(ctx, a, mode, false);
  if (mode === 'line') {
    potBody(ctx);
    paint(ctx, a, 'line', null, 2 / PS);
    potRim(ctx);
    paint(ctx, a, 'line', null, 2 / PS);
    return;
  }
  potBody(ctx);
  ctx.fillStyle = tone(a, POT[1]);
  ctx.fill();
  ctx.save();
  potBody(ctx);
  ctx.clip();
  // the glaze: lit cream on the left, warm shade round the right and under the belly
  glow(ctx, -PW * 0.45, -PH * 0.15, PW * 0.8, POT[0], 0.95);
  glow(ctx, PW * 0.8, PH * 0.55, PW * 0.85, POT[3], 0.55);
  glow(ctx, 0, PH * 1.2, PW * 0.9, POT[3], 0.45);
  // the honeycomb band round its belly: amber cells with lighter rims, bowed with the belly
  const bandY = (x) => PH * 0.2 + 0.0026 * x * x * 6;
  ctx.fillStyle = tone(a, HONEY[2]);
  ctx.beginPath();
  ctx.moveTo(-PW * 1.3, bandY(-PW * 1.3) - 0.6);
  for (let x = -PW * 1.3; x <= PW * 1.3; x += 2) ctx.lineTo(x, bandY(x) - 0.6);
  for (let x = PW * 1.3; x >= -PW * 1.3; x -= 2) ctx.lineTo(x, bandY(x) + 5.6);
  ctx.closePath();
  ctx.fill();
  for (let i = -5; i <= 5; i++) {
    const x = i * 3.3;
    const y = bandY(x) + 2.5 + (i % 2 ? 1.2 : -1.2) * 0.5;
    hexPath(ctx, x, y, 1.7);
    ctx.fillStyle = tone(a, i % 3 ? HONEY[1] : HONEY[0]);
    ctx.fill();
  }
  ctx.fillStyle = tone(a, GOLD[3]);
  for (const dy of [-0.8, 5.6]) {
    ctx.beginPath();
    for (let x = -PW * 1.3; x <= PW * 1.3; x += 2) (x === -PW * 1.3 ? ctx.moveTo.bind(ctx) : ctx.lineTo.bind(ctx))(x, bandY(x) + dy);
    for (let x = PW * 1.3; x >= -PW * 1.3; x -= 2) ctx.lineTo(x, bandY(x) + dy + 0.7);
    ctx.closePath();
    ctx.fill();
  }
  // honey over the rim: a soft band round the neck, the fat drips hanging from it
  ctx.fillStyle = tone(a, HONEY[1]);
  ctx.beginPath();
  ctx.moveTo(-PW * 0.92, -PH * 0.92);
  const top = -PH * 0.78;
  for (const [x, len, w] of DRIPS) {
    const l = len + Math.sin(t * 1.1 + x) * 0.9 - (q.lickDrip && x === DRIPS[2][0] ? q.lickDrip * len * 0.8 : 0);
    ctx.lineTo(x - w, top);
    ctx.bezierCurveTo(x - w * 0.85, top + l * 0.5, x - w * 1.1, top + l * 0.8, x - w, top + l);
    ctx.arc(x, top + l, w, Math.PI, 0, true);
    ctx.bezierCurveTo(x + w * 1.1, top + l * 0.8, x + w * 0.85, top + l * 0.5, x + w, top);
  }
  ctx.lineTo(PW * 0.92, -PH * 0.92);
  ctx.closePath();
  ctx.fill();
  for (const [x, len, w] of DRIPS) {
    ell(ctx, x - w * 0.35, top + len - w * 0.2, w * 0.3, w * 0.45);
    ctx.fillStyle = '#fff8d0';
    ctx.fill();
  }
  // the glaze's gleam: a long soft streak down its lit side, a little star of light
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-PW * 0.72, PH * 0.05, 1.4, PH * 0.42, 0.18, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  sparkle(ctx, -PW * 0.6, -PH * 0.42, 1.8);
  ctx.restore();
  // the heart label with her crown on it
  heartPath(ctx, 1.4, PH * 0.0, 5.2);
  ctx.fillStyle = tone(a, '#ffffff');
  ctx.fill();
  heartPath(ctx, 1.4, PH * 0.0, 4.0);
  ctx.fillStyle = tone(a, CAPE[1]);
  ctx.fill();
  ctx.fillStyle = tone(a, GOLD[1]);
  ctx.beginPath();
  ctx.moveTo(-1.2, -0.6);
  ctx.lineTo(-1.6, -2.8);
  ctx.lineTo(-0.2, -1.6);
  ctx.lineTo(1.4, -3.4);
  ctx.lineTo(3.0, -1.6);
  ctx.lineTo(4.4, -2.8);
  ctx.lineTo(4.0, -0.6);
  ctx.closePath();
  ctx.fill();
  // the rim over everything at its front, its lip lit
  potRim(ctx);
  ctx.fillStyle = tone(a, POT[0]);
  ctx.fill();
  pen(ctx, tone(a, POT[2]), 0.6);
  ctx.beginPath();
  ctx.ellipse(0, -PH * 0.86 + 1.4, PW * 0.88, 2.2, 0, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
}

// ---------- A tiny Pollen Post courier bee (rig space, its size `s` px): a round yellow bee, two
// plum bands, a blue post cap, eager blue eyes; `salute` its front foot up to its cap ----------
function courier(ctx, a, x, y, s, dir, salute, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * s / 10, s / 10);
  // wings buzzing (a soft blur)
  for (const [wx, wy, r] of [[-2, -5.6, 0.5], [-4.6, -4.4, 0.9]]) {
    ctx.save();
    ctx.translate(wx, wy);
    ctx.rotate(-0.6 + Math.sin(t * 50 + r) * 0.35);
    ell(ctx, 0, -2.6, 2.4, 4, 0);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(160,190,230,0.9)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();
  }
  // the body and head
  ell(ctx, -1.6, 0.4, 5.4, 4.6);
  ctx.strokeStyle = '#8a6a3a';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ell(ctx, 3.6, -1.2, 4, 4);
  ctx.stroke();
  ell(ctx, -1.6, 0.4, 5.4, 4.6);
  ctx.fillStyle = tone(a, '#ffd23e');
  ctx.fill();
  ctx.save();
  ell(ctx, -1.6, 0.4, 5.4, 4.6);
  ctx.clip();
  ctx.fillStyle = tone(a, '#8a5a3c');
  ctx.fillRect(-4.6, -6, 1.6, 12);
  ctx.fillRect(-1.6, -6, 1.6, 12);
  ctx.restore();
  ell(ctx, 3.6, -1.2, 4, 4);
  ctx.fillStyle = tone(a, '#ffd23e');
  ctx.fill();
  // the cap
  ctx.fillStyle = tone(a, '#5a8ad8');
  ctx.beginPath();
  ctx.ellipse(3.4, -3.4, 3.8, 2.2, 0, Math.PI, TAU);
  ctx.lineTo(7.8, -3.2);
  ctx.lineTo(3.4, -3.0);
  ctx.closePath();
  ctx.fill();
  ell(ctx, 3.4, -4.6, 0.6, 0.6);
  ctx.fillStyle = '#ffc848';
  ctx.fill();
  // eyes and a smile
  ctx.fillStyle = '#1e4a9a';
  ell(ctx, 4.6, -1.2, 0.75, 1.05);
  ctx.fill();
  ell(ctx, 6.4, -1.3, 0.55, 0.9);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ell(ctx, 4.4, -1.6, 0.3, 0.3);
  ctx.fill();
  pen(ctx, '#6a2a22', 0.4);
  ctx.beginPath();
  ctx.arc(5.6, 0.6, 0.8, 0.2, Math.PI - 0.2);
  ctx.stroke();
  // a front foot: dangling, or up at its cap in a salute
  pen(ctx, '#8a6a3a', 1.6);
  ctx.beginPath();
  ctx.moveTo(1.6, 3.4);
  ctx.quadraticCurveTo(lerp(2.4, 4.6, salute), lerp(5.4, 0.4, salute), lerp(2.2, 6.6, salute), lerp(6.6, -3.4, salute));
  ctx.stroke();
  pen(ctx, tone(a, '#ffd23e'), 0.9);
  ctx.stroke();
  ctx.restore();
}

// ---------- Her act, her flight, her fight (on the base's channels: x, lift, hop in heights) ----------
const CYCLE = 35;
// (the act's beats, seconds into its cycle)
const ACT = {
  lick: [0.4, 0.9, 2.0, 2.3], stick: [2.0, 2.2, 6.4, 6.5], tug: [2.4, 2.6, 3.8, 4.0], tantrum: [3.9, 4.1, 5.9, 6.2], pop: 6.3, sniff: [6.4, 6.6, 7.4, 7.8],
  peer: [8.6, 9.0, 10.2, 10.5], finger: [10.3, 10.7, 12.6, 13.0], giggle: [10.9, 11.1, 12.6, 12.9],
  bee: [13.8, 14.6, 17.6, 18.6], point: [14.6, 14.9, 16.2, 16.6], salute: [15.6, 15.8, 16.8, 17.0],
  slip: [19.2, 19.5, 21.0, 21.3], fix: [20.6, 20.9, 21.5, 21.8], haughty: [21.6, 21.9, 23.0, 23.4],
  doze: [24.0, 25.0, 26.8, 26.85], jolt: [26.8, 26.9, 27.4, 27.8], look: [27.6, 27.9, 28.8, 29.2],
  wave: [29.6, 29.9, 31.4, 31.8], lean: [32.0, 32.4, 34.2, 34.7], lickDrip: [32.6, 32.8, 33.8, 34.0],
};
const W = (lu, k, w) => win(lu, ...ACT[k]) * w;

function pose(m, a, out, c) {
  const q = { face: null, fly: 0, lollyR: 0.42, grip: 0, glob: 0, potTilt: 0, potDrop: 0, crownSlip: 0, crownPop: 0, crownDrop: 0, crownTip: 0, crownWob: 0, crownOff: false, antSway: 0, antUp: 0, antDroop: 0, smear: 0, stuck: false, tug: 0, lickDrip: 0, sweat: -1, zz: 0, bee: null, hearts: -1, slamHit: -1, splashUp: -1, burst: -1, fling: -1, bonk: -1, puddle: 0, deadT: -1, popT: -1, sparkles: 0, wingAmp: 0.24, wingPh: 0 };
  a.qb = q;
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const mood = m.cine?.mood ?? a.mood;
  const go = (p, k) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const say = (f, k) => {
    if (k > 0.4) q.face = f;
  };
  // (flying: by her own speed, as a flyer is always "moving" to the game)
  if (dt > 0) {
    const vx = st.qbX == null ? 0 : (m.x - st.qbX) / dt;
    st.qbV = lerp(st.qbV ?? 0, Math.abs(vx), Math.min(1, dt * 6));
  }
  st.qbX = m.x;
  const fly = sstep(((st.qbV ?? 0) - 4) / 26);
  q.fly = fly;
  const low = m.hp > 0 && m.hp < m.def.hp * 0.25 && !m.cine;
  // (the floor she hovers over, m.spawn.y, the one her slam strikes; in her own drawn px and heights)
  const floorPx = clamp((m.spawn?.y ?? m.y ?? 0) - (m.y ?? 0), 0, 160) / BIG;
  const drop = floorPx / c.H;
  q.floor = floorPx;
  // Hovering in her pot: bobbing, the pot rocking a little, the lollipop held up proudly beside her,
  // her free hand on the rim; every channel set, so nothing of the base's walk shows through.
  const bob = Math.sin(t * 2.4) * 0.02 + Math.sin(t * 0.9 + 1) * 0.01;
  go({ x: 0, hop: 0.34 + bob, lift: 0, drop: 0, tilt: 0, pelvis: 0, waist: Math.sin(t * 1.3) * 2, chest: 0, head: Math.sin(t * 0.8) * 3, neckR: 0, shN: -48, elN: -12, hwN: 0, shF: 18, elF: -30, hwF: 0, shrugN: 1, shrugF: 1, reachN: 0, reachF: 0, turnC: 0, turnP: 0, fxN: 0, fxF: 0, fyN: 0, fyF: 0, toeN: 0, toeF: 0 }, 1);
  q.potTilt = Math.sin(t * 1.5) * 0.05;
  q.antSway = Math.sin(t * 1.7) * 0.1;
  // Flying: the pot tipped into her travel, her leaning over its rim, the cape and feelers streaming.
  go({ tilt: 14, head: -8, shF: 40, elF: -20, hop: 0.38 }, fly);
  q.lollyR -= fly * 0.35;
  q.potTilt += fly * 0.2;
  q.antSway -= fly * 0.35;
  let buzz = 1 + fly * 0.6 + (low ? 0.5 : 0);
  // The fight. A slam's warning (m.special.warn) or a wind-up (m.windup), 0..1 through it.
  const total = m.def.special?.warn ?? 1.3;
  const rem = Math.max(m.special?.warn > 0 ? m.special.warn : 0, m.windup > 0 ? m.windup : 0);
  const wind = rem > 0 ? clamp(1 - rem / total, 0, 1) : 0;
  if (wind > 0) st.qbWindAt = now;
  const since = now - (m.attackAt ?? -9);
  const slamming = since >= 0 && since < 1.4 && now - (st.qbWindAt ?? -9) < since + 0.25;
  // The co-op Royal Honey Bomb (a split ring on her m.coop), or a named cast (m.cast): 0..1 through it.
  const ring = m.coop?.mechs?.find((s) => s.def.kind === 'split' && s.ring)?.ring;
  const castU = ring ? ring.t / ring.warn : m.cast ? (now - m.cast.t0) / m.cast.dur : -1;
  const entrance = m.nested && (m.age ?? 9) < 2.8 && m.hp > 0 ? m.age : -1;
  const busy = wind > 0 || slamming || castU >= 0 || entrance >= 0 || m.hp <= 0;
  // A face for the moment, under the fight's own: cross while she hunts you, worried when low.
  if (mood === 'angry' || (now < (m.aggroUntil ?? 0) && m.hp > 0)) {
    q.face = 'angry';
    q.antSway -= 0.3;
  }
  if (low) {
    q.face = q.face === 'angry' ? 'worried' : 'worried';
    q.sweat = (t * 0.6) % 1;
    q.potTilt += Math.sin(t * 7) * 0.03;
  }
  if (mood === 'sad') {
    q.face = 'sad';
    q.antDroop = 0.7;
    go({ head: 12 }, 1);
  } else if (mood === 'happy' && m.cine) q.face = 'happy';
  else if (mood === 'talk') q.face = 'talk';
  else if (mood === 'sleep') {
    q.face = 'sleep';
    q.zz = 1;
    go({ head: 18, neckR: 4 }, 1);
  }
  // Hurt: a teary flinch, the crown knocked crooked, the pot jolted back.
  const hurtK = m.hp > 0 && !busy ? Math.max(sstep(1 - (a.hurtAgo ?? 9) / 0.5), mood === 'hurt' ? 1 : 0, m.qbHurt > 0 ? 1 : 0) : 0;
  if (hurtK > 0.01) {
    go({ tilt: -14, head: 12, neckR: 4, shN: -30, elN: -130, shF: 30, elF: -110 }, hurtK);
    q.crownTip -= 0.5 * hurtK;
    q.potTilt -= 0.14 * hurtK;
    q.antDroop = Math.max(q.antDroop, 0.6 * hurtK);
    say('hurt', hurtK);
  }
  // After landing a hit: a giggle behind her hand, little hearts.
  const gl = now - (m.gloatAt ?? -9);
  if (gl >= 0 && gl < 1.0 && m.hp > 0 && !busy) {
    const k = win(gl, 0, 0.12, 0.8, 1.0);
    go({ shF: 30, elF: -150, head: -6, chest: Math.sin(gl * 30) * 3 }, k);
    say('giggle', k);
    q.hearts = gl;
  }
  // A bump up close (an attack with no warning before it): a BONK of the lollipop.
  if (since >= 0 && since < 0.55 && !slamming && m.hp > 0 && castU < 0) {
    const up = since < 0.06 ? 1 - since / 0.06 : 0;
    const k = win(since, 0, 0.05, 0.25, 0.55);
    go({ shN: -110, elN: 20, tilt: 8, head: 6 }, k);
    go({ shN: -160, elN: -40, tilt: -6 }, up);
    q.lollyR = lerp(q.lollyR, 1.4, k);
    q.bonk = since;
    say('shout', k);
  }
  // The slam, "Royal Tantrum": through the warning the pot rises and she stands up in it, wailing,
  // fists drumming; at its end it drops like a stone...
  if (wind > 0 && m.hp > 0) {
    const rise = sstep(wind / 0.7);
    const drum = Math.sin(now * 30);
    const shake = sstep((wind - 0.4) / 0.3);
    go({ hop: 0.62, lift: 0.1, tilt: -6, head: -10, shN: -150 + drum * 22, elN: -40, shF: 150 - drum * 22, elF: 40, hwN: 0 }, rise);
    const fall = sstep((wind - 0.86) / 0.14);
    go({ hop: 0.02 - drop, lift: -0.04, tilt: 6, head: 10 }, fall);
    q.potTilt += Math.sin(now * 46) * 0.07 * shake * (1 - fall);
    q.lollyR = lerp(q.lollyR, -0.3, rise);
    q.antSway += drum * 0.3 * rise;
    q.antUp = rise;
    q.face = wind < 0.15 ? 'angry' : 'wail';
    buzz = 1.8;
  }
  // ...and lands: a honey splash, her crown popping off and wobbling back down, then up again.
  if (slamming && m.hp > 0) {
    const sit = 1 - sstep((since - 0.45) / 0.6);
    go({ hop: 0.02 - drop, lift: -0.06, tilt: 6, head: 10, shN: -60, elN: -60, shF: 60, elF: 60 }, sit);
    q.slamHit = since;
    q.crownPop = since < 0.7 ? Math.sin(Math.PI * (since / 0.7)) : 0;
    q.crownWob = since >= 0.7 ? Math.sin((since - 0.7) * 22) * 0.35 * (1 - sstep((since - 0.7) / 0.6)) : 0;
    q.potDrop = since < 0.12 ? -Math.sin(Math.PI * (since / 0.12)) * 0.8 : 0;
    q.face = since < 0.5 ? 'shout' : 'smug';
    q.antUp = Math.max(0, 1 - since * 2);
  }
  // The Royal Honey Bomb: the lollipop dunked in the pot, lifted high with a great glob of honey
  // swelling on it and whirled round; then flung.
  if (castU >= 0 && castU < 1.15 && m.hp > 0) {
    const lift = win(castU, 0, 0.12, 0.8, 0.88);
    const fling = win(castU, 0.8, 0.86, 0.95, 1.1);
    q.stream = win(castU, 0.1, 0.2, 0.62, 0.74);
    const whirl = Math.sin(now * 8) * sstep((castU - 0.55) / 0.15) * lift;
    go({ shN: -104 + whirl * 14, elN: -36 + whirl * 20, shF: 40, elF: -40, tilt: -6, head: -10, hop: 0.42 }, lift);
    q.lollyR = lerp(q.lollyR, 0.35 + whirl * 0.4, lift);
    go({ shN: -60, elN: -10, tilt: 14, head: 6, hop: 0.36 }, fling);
    q.lollyR = lerp(q.lollyR, 1.0, fling);
    q.glob = castU < 0.86 ? sstep((castU - 0.12) / 0.6) : 0;
    q.fling = castU >= 0.86 ? (castU - 0.86) / 0.2 : -1;
    q.face = castU < 0.3 ? 'greedy' : castU < 0.86 ? 'shout' : 'smug';
    q.antUp = lift;
    buzz = 1.5;
  }
  // Beaten: her crown falls off, she bawls, the pot tips over on the ground and honey pools out.
  if (m.hp <= 0) {
    st.qbDeadAt ??= now;
    const d = now - st.qbDeadAt;
    const tip = sstep((d - 0.3) / 0.8);
    go({ hop: lerp(0.34, 0.06 - drop, sstep(d / 0.5)), lift: -0.05, tilt: 10 + tip * 12, head: 14, neckR: 6, shN: -40 + Math.sin(now * 14) * 10, elN: -150, shF: 40 - Math.sin(now * 14) * 10, elF: 150 }, 1);
    q.potTilt = 0.15 + tip * 0.55;
    q.crownOff = d > 0.15;
    q.crownPop = d < 0.15 ? d / 0.15 : 0;
    q.deadT = d;
    q.puddle = sstep(d / 1.6);
    q.face = 'bawl';
    q.antDroop = 1;
    buzz = 0.2;
  } else st.qbDeadAt = undefined;
  // Her entrance, woken at the hive: the pot pops up out of a burst of honey, she pops up out of
  // the pot, her crown drops onto her head with a bounce, a haughty little ta-da.
  if (entrance >= 0) {
    const e = entrance;
    const potUp = sstep(e / 0.45);
    go({ hop: lerp(-0.2 - drop, 0.36, potUp), lift: lerp(-0.4, 0, sstep((e - 0.45) / 0.25)) }, 1);
    const pop = win(e, 0.45, 0.62, 0.8, 1.0);
    go({ lift: 0.12, shN: -150, elN: -20, shF: 150, elF: 20, head: -8 }, pop);
    q.crownDrop = e < 1.5 ? 1 - sstep((e - 0.8) / 0.7) : 0;
    q.crownWob = e >= 1.5 && e < 2.1 ? Math.sin((e - 1.5) * 24) * 0.3 * (1 - (e - 1.5) / 0.6) : 0;
    const tada = win(e, 1.6, 1.8, 2.5, 2.8);
    go({ shN: -110, elN: -30, shF: 60, elF: -60, head: -10, tilt: -4 }, tada);
    q.burst = e < 1.2 ? e : -1;
    q.popT = e;
    q.face = e < 0.5 ? 'startled' : e < 1.0 ? 'happy' : e < 1.5 ? 'up' : 'smug';
    q.antUp = pop;
  }
  // Her act: only while she hovers still and calm (never in the fight, a scene or just after a hit).
  const still = 1 - fly;
  const w = m.hp > 0 && !busy && !m.cine && (a.hurtAgo ?? 9) > 2 && !(m.qbHurt > 0) && !(now < (m.aggroUntil ?? 0)) && !(gl >= 0 && gl < 1) && !(since >= 0 && since < 0.6) ? still : 0;
  if (w > 0.01) {
    const lu = (t + 33.5) % CYCLE;
    // 1. a lick of her lollipop... it sticks to her cheek; tug, tug; a tantrum; POP; a sniff
    const lick = W(lu, 'lick', w);
    go({ shN: -78, elN: 128, hwN: 0, head: 10, neckR: 3 }, lick);
    q.grip = lerp(q.grip, 22, lick);
    q.lollyR = lerp(q.lollyR, -0.55, lick);
    say('lick', lick);
    const stuck = W(lu, 'stick', w);
    q.stuck = stuck > 0.5;
    const tug = W(lu, 'tug', w);
    go({ shN: -70, elN: 140, shF: 70, elF: -140, head: 8, neckR: 6 }, tug);
    const yank = Math.max(0, Math.sin(lu * 9));
    out.head += tug * yank * 10;
    q.tug = tug * yank;
    say('up', tug);
    const tantrum = W(lu, 'tantrum', w);
    const beat = Math.sin(lu * 22);
    go({ shN: -40 + beat * 30, elN: -40, shF: 40 - beat * 30, elF: 40, head: -6, tilt: beat * 2 }, tantrum);
    q.potTilt += tantrum * beat * 0.05;
    q.antSway += tantrum * beat * 0.4;
    say('wail', tantrum);
    if (lu >= ACT.pop && lu < ACT.pop + 0.5) q.popT = lu - ACT.pop;
    q.smear = (lu >= ACT.pop ? 1 - sstep((lu - 12) / 1) : 0) * w;
    const sniff = W(lu, 'sniff', w);
    go({ head: 10 }, sniff);
    say('sad', sniff);
    // 2. counting her honey: a peer into the pot, a finger of honey held up, a greedy giggle
    const peer = W(lu, 'peer', w);
    go({ tilt: 16, head: 24, shF: -8, elF: -70, neckR: 2 }, peer);
    say('down', peer);
    const finger = W(lu, 'finger', w);
    go({ shF: 30, elF: -150, hwF: 0, head: -4 }, finger);
    q.finger = finger;
    const gig = W(lu, 'giggle', w);
    out.chest += gig * Math.sin(lu * 28) * 3;
    out.head += gig * Math.sin(lu * 28 + 1) * 2;
    say('greedyGiggle', gig);
    q.sparkles = gig;
    // 3. a tiny courier bee buzzes up; she points it off on an errand; it salutes and zips away
    const beeK = W(lu, 'bee', w);
    if (beeK > 0.01 || (lu > ACT.bee[0] && lu < ACT.bee[3])) {
      const u = clamp((lu - ACT.bee[0]) / (ACT.bee[3] - ACT.bee[0]), 0, 1);
      q.bee = { u, salute: W(lu, 'salute', w) };
    }
    // (she points it off with her lollipop, like a sceptre)
    const point = W(lu, 'point', w);
    go({ shN: -105, elN: -15, head: -8, tilt: -3 }, point);
    q.lollyR = lerp(q.lollyR, 1.25 + Math.sin(lu * 10) * 0.12, point);
    say('bossy', point);
    say('happy', W(lu, 'salute', w) * 0.9);
    // 4. her crown slips down over her eyes; pushed back up with both hands; chin up, haughty
    const slip = W(lu, 'slip', w);
    q.crownSlip = slip * (1 - sstep((lu - 20.9) / 0.5));
    say('startled', slip);
    const fix = W(lu, 'fix', w);
    go({ shN: -150, elN: 150, shF: 150, elF: -150, head: -4 }, fix);
    const haughty = W(lu, 'haughty', w);
    go({ head: -16, neckR: -4, tilt: -4 }, haughty);
    say('smug', haughty);
    // 5. a doze in the pot, a jolt awake, a blink about
    const doze = W(lu, 'doze', w);
    const nod = doze * (0.6 + 0.4 * Math.sin(lu * 2.2));
    go({ head: 22 * nod, neckR: 6 * nod, tilt: 4 * nod, hop: 0.3, shN: -20, elN: -20 }, doze);
    q.lollyR = lerp(q.lollyR, 0.9, doze);
    q.zz = doze;
    q.antDroop = Math.max(q.antDroop, doze * 0.8);
    say('sleep', doze);
    const jolt = W(lu, 'jolt', w);
    go({ head: -12, hop: 0.4, shN: -70, shF: 70 }, jolt);
    q.antUp = Math.max(q.antUp, jolt);
    say('startled', jolt);
    const look = W(lu, 'look', w);
    out.neckR += look * Math.sin((lu - 27.6) * 3.2) * 8;
    out.head += look * 4;
    say(Math.sin((lu - 27.6) * 3.2) > 0 ? 'side' : 'blink', look * 0.9);
    // 6. a royal wave to her subjects
    const wave = W(lu, 'wave', w);
    go({ shN: -150, elN: -10, head: -4, tilt: -2 }, wave);
    q.lollyR = lerp(q.lollyR, Math.sin(lu * 7) * 0.45, wave);
    out.elN += wave * Math.sin(lu * 7) * 18;
    say('happy', wave);
    // 7. a lean over the rim to lick a honey drip off the pot
    const lean = W(lu, 'lean', w);
    go({ tilt: 15, head: 14, neckR: 3, shF: -10, elF: -60, shN: -30, elN: -40 }, lean);
    const ld = W(lu, 'lickDrip', w);
    q.lickDrip = ld;
    say('lick', ld);
    say('happy', win(lu, 33.9, 34.0, 34.4, 34.7) * w);
  }
  // the wings: a beat kept running, quicker when she hurries or panics
  st.qbWing = ((st.qbWing ?? 0) + dt * TAU * (9 + 7 * (buzz - 1))) % (TAU * 1000);
  q.wingPh = st.qbWing;
  q.wingAmp = 0.2 + 0.12 * clamp(buzz - 0.6, 0, 1.4);
  if (!q.face) q.face = (t + 0.9) % 4.2 < 0.13 ? 'blink' : 'calm';
}

// ---------- Live extras ----------
// Under everything: honey on the ground (the slam's splash, her honey pool when beaten, the burst
// she wakes in).
function under2(ctx, m, a, S, matOf, D) {
  const q = a.qb ?? {};
  const { c } = potAt(a, S, D);
  const pool = (x, rx, al) => {
    ctx.save();
    ctx.translate(x, (q.floor ?? 0) - 0.3);
    ctx.scale(1, 0.3);
    ctx.globalAlpha = al;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const an = (i / 24) * TAU;
      const r = rx * (1 + Math.sin(an * 5 + 1) * 0.07);
      if (i) ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r);
      else ctx.moveTo(Math.cos(an) * r, Math.sin(an) * r);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,220,110,0.6)';
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(240,160,40,0.55)';
    ctx.stroke();
    ell(ctx, -rx * 0.3, -rx * 0.25, rx * 0.35, rx * 0.12);
    ctx.fillStyle = 'rgba(255,250,220,0.8)';
    ctx.fill();
    ctx.restore();
  };
  if (q.slamHit >= 0 && q.slamHit < 1.4) {
    const k = q.slamHit / 1.4;
    const e = 1 - (1 - Math.min(1, q.slamHit / 0.35)) ** 3;
    pool(c[0], 10 + e * 12, 1 - sstep((k - 0.5) / 0.5));
    ctx.save();
    ctx.translate(c[0], (q.floor ?? 0) - 0.3);
    ctx.scale(1, 0.3);
    ctx.globalAlpha = (1 - e) * 0.9;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.4;
    ell(ctx, 0, 0, 12 + e * 22, 12 + e * 22);
    ctx.stroke();
    ctx.restore();
  }
  if (q.puddle > 0) pool(c[0] + 6 * q.puddle, 6 + q.puddle * 13, 0.95);
  // the Honey Bomb gathering: honey welling up out of the pot in a stream to her lollipop (behind
  // her, so it never crosses her face; the candy's place from the last frame)
  const ch = a.mo?.qbCandy;
  if ((q.stream ?? 0) > 0.02 && ch) {
    const M = matOf('handN');
    const cp = [M[0] * ch[0] + M[2] * ch[1] + M[4], M[1] * ch[0] + M[3] * ch[1] + M[5]];
    const from = [c[0] + 10, c[1] - 7];
    const t = a.t ?? 0;
    const sw = Math.sin(t * 6) * 3;
    const mid = [(from[0] + cp[0]) / 2 + sw, (from[1] + cp[1]) / 2];
    const nx = cp[1] - from[1];
    const ny = from[0] - cp[0];
    const L = Math.hypot(nx, ny) || 1;
    const w0 = 2.6 * q.stream;
    const w1 = 1.2 * q.stream;
    ctx.beginPath();
    ctx.moveTo(from[0] + (nx / L) * w0, from[1] + (ny / L) * w0);
    ctx.quadraticCurveTo(mid[0] + (nx / L) * w1, mid[1] + (ny / L) * w1, cp[0], cp[1]);
    ctx.quadraticCurveTo(mid[0] - (nx / L) * w1, mid[1] - (ny / L) * w1, from[0] - (nx / L) * w0, from[1] - (ny / L) * w0);
    ctx.closePath();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = HONEY[1];
    ctx.fill();
    // light running up it
    for (let i = 0; i < 3; i++) {
      const u = ((t * 1.4 + i / 3) % 1);
      const x = (1 - u) * (1 - u) * from[0] + 2 * (1 - u) * u * mid[0] + u * u * cp[0];
      const y = (1 - u) * (1 - u) * from[1] + 2 * (1 - u) * u * mid[1] + u * u * cp[1];
      ell(ctx, x, y, 0.7, 1.1);
      ctx.fillStyle = HONEY[0];
      ctx.fill();
    }
    for (let i = 0; i < 4; i++) {
      const an = (i / 4) * TAU + t * 3;
      ctx.fillStyle = i % 2 ? '#ffffff' : '#ffe680';
      sparkle(ctx, cp[0] + Math.cos(an) * 8, cp[1] + Math.sin(an) * 6, 1.3);
    }
  }

  if (q.burst >= 0) pool(c[0], 8 + sstep(q.burst / 0.4) * 10, 1 - sstep((q.burst - 0.8) / 0.4));
}
function fx(ctx, m, a, S, matOf, D) {
  const q = a.qb ?? {};
  const t = a.t ?? 0;
  const { c } = potAt(a, S, D);
  const hc = headAt(a, D, [0, 0]);
  ctx.save();
  // her lollipop's POP off her cheek: a little ring of sparkles
  if (q.popT >= 0 && q.popT < 0.5 && !m.nested) {
    const p = headAt(a, D, [-34, 20]);
    const e = sstep(q.popT / 0.5);
    ctx.globalAlpha = 1 - e;
    for (let i = 0; i < 6; i++) {
      const an = (i / 6) * TAU;
      ctx.fillStyle = i % 2 ? '#ffffff' : '#ffe27a';
      sparkle(ctx, p[0] + Math.cos(an) * (1.5 + e * 5), p[1] + Math.sin(an) * (1.5 + e * 4), 1.3 * (1 - e * 0.5));
    }
    ctx.globalAlpha = 1;
  }
  // honey on her finger (counting her honey), golden sparkles as she giggles
  if ((q.finger ?? 0) > 0.3) {
    const M = matOf('handF');
    const p = [M[4], M[5]];
    ctx.globalAlpha = sstep((q.finger - 0.3) / 0.4);
    ell(ctx, p[0], p[1] - 1.8, 1.6, 2.0);
    ctx.fillStyle = HONEY[1];
    ctx.fill();
    ell(ctx, p[0] - 0.5, p[1] - 2.4, 0.5, 0.6);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (q.sparkles > 0.05) {
    for (let i = 0; i < 4; i++) {
      const u = ((t * 0.9 + i / 4) % 1);
      ctx.globalAlpha = q.sparkles * Math.sin(Math.PI * u);
      ctx.fillStyle = i % 2 ? '#fff3a8' : '#ffd25a';
      sparkle(ctx, hc[0] + (i - 1.5) * 6, hc[1] - 10 - u * 8, 1.6);
    }
    ctx.globalAlpha = 1;
  }
  // the courier bee: up from her side, hovering before her, a salute, zipping off
  if (q.bee) {
    const u = q.bee.u;
    const into = sstep(u / 0.2);
    const off = sstep((u - 0.82) / 0.18);
    const x = hc[0] + lerp(30, 17, into) + off * 12 + Math.sin(t * 5) * 0.8;
    const y = hc[1] + lerp(-14, 2, into) - off * 18 + Math.sin(t * 7) * 0.8;
    ctx.globalAlpha = 1 - sstep((u - 0.92) / 0.08);
    courier(ctx, a, x, y, 7, -1 + off * 2, q.bee.salute, t);
    ctx.globalAlpha = 1;
  }
  // dozing: soft z's rising from her
  if (q.zz > 0.05) {
    ctx.font = 'bold 5px sans-serif';
    for (let i = 0; i < 2; i++) {
      const u = ((t * 0.5 + i * 0.5) % 1);
      ctx.globalAlpha = q.zz * Math.sin(Math.PI * u);
      ctx.fillStyle = '#9a7ad8';
      ctx.fillText('z', hc[0] + 10 + u * 4, hc[1] - 10 - u * 7);
    }
    ctx.globalAlpha = 1;
  }
  // low on health: a sweat drop sliding down her hood
  if (q.sweat >= 0) {
    const p = headAt(a, D, [44, -24 + q.sweat * 20]);
    ctx.globalAlpha = 1 - sstep((q.sweat - 0.7) / 0.3);
    ctx.fillStyle = '#bfe6ff';
    ctx.beginPath();
    ctx.moveTo(p[0], p[1] - 2.4);
    ctx.quadraticCurveTo(p[0] + 1.8, p[1] + 0.4, p[0], p[1] + 1.4);
    ctx.quadraticCurveTo(p[0] - 1.8, p[1] + 0.4, p[0], p[1] - 2.4);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // a giggle: little hearts bubbling up beside her face
  if (q.hearts >= 0) {
    for (let i = 0; i < 2; i++) {
      const u = clamp(q.hearts / 0.9 - i * 0.2, 0, 1);
      ctx.globalAlpha = Math.sin(Math.PI * u);
      heartPath(ctx, hc[0] + 12 + i * 5, hc[1] - 2 - u * 10, 1.6);
      ctx.fillStyle = '#ff7aa8';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // the slam's honey sloshed up out of the pot and raining down round it
  if (q.slamHit >= 0 && q.slamHit < 1.2) {
    const rimY = c[1] - 8;
    const u = Math.min(1, q.slamHit / 0.9);
    ctx.globalAlpha = sstep(q.slamHit / 0.06) * (1 - q.slamHit / 1.2);
    for (let i = 0; i < 6; i++) {
      // (each its own: thrown a little later, higher or lower, nearer or farther)
      const side = i % 2 ? 1 : -1;
      const sp = [0.5, 0.9, 1.3][i >> 1];
      const ui = clamp((q.slamHit - (i >> 1) * 0.07) / 0.9, 0, 1);
      const x = c[0] + side * (9 + ui * 18 * sp);
      const y = rimY - Math.sin(Math.min(1, ui * 1.3) * Math.PI) * (16 - 5 * sp) + ui * ui * 10 * sp;
      const an = side * (0.6 - ui);
      ctx.fillStyle = HONEY[1];
      ell(ctx, x, y, 1.6, 2.1, an);
      ctx.fill();
      ctx.fillStyle = '#fff8d0';
      ell(ctx, x - 0.5, y - 0.7, 0.5, 0.5);
      ctx.fill();
    }
    for (let i = 0; i < 5; i++) {
      const an = -Math.PI * (0.15 + 0.7 * (i / 4));
      ctx.fillStyle = i % 2 ? '#ffffff' : '#ffe680';
      sparkle(ctx, c[0] + Math.cos(an) * (12 + u * 12), (q.floor ?? 0) + Math.sin(an) * (6 + u * 10) - 3, 1.8 * (1 - u * 0.5));
    }
    ctx.globalAlpha = 1;
  }
  // the lollipop's BONK: a star where it lands
  if (q.bonk >= 0 && q.bonk < 0.4) {
    const p = headAt(a, D, [70, 10]);
    const e = sstep(q.bonk / 0.4);
    ctx.globalAlpha = 1 - e;
    ctx.fillStyle = '#ffe680';
    sparkle(ctx, p[0], p[1], 3 + e * 3);
    ctx.fillStyle = '#ffffff';
    sparkle(ctx, p[0], p[1], 1.6 + e * 1.4);
    ctx.globalAlpha = 1;
  }
  // the Honey Bomb flung: the glob flying off ahead in an arc, trailing drops
  if (q.fling >= 0 && q.fling < 1) {
    const u = q.fling;
    const x = hc[0] + 8 + u * 60;
    const y = hc[1] - 16 - Math.sin(u * Math.PI) * 14 + u * 30;
    ctx.globalAlpha = 1 - sstep((u - 0.8) / 0.2);
    for (let i = 1; i <= 3; i++) {
      ctx.fillStyle = HONEY[1];
      ell(ctx, x - i * 4, y + i * 1.2 - Math.sin(u * Math.PI) * i * 0.6, 1.4 - i * 0.25, 1.4 - i * 0.25);
      ctx.fill();
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ell(ctx, x, y, 5.6, 5);
    ctx.stroke();
    ctx.fillStyle = HONEY[1];
    ctx.fill();
    glow(ctx, x - 1.6, y - 1.8, 4, HONEY[0], 0.9);
    ell(ctx, x - 2, y - 2, 1.4, 0.9, -0.5);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // beaten: her crown on the ground beside the tipped pot, rocking to a stop
  if (q.crownOff) {
    const d = q.deadT;
    const k = sstep((d - 0.15) / 0.6);
    const x = c[0] - 16 * k;
    const y = lerp(hc[1] - 14, (q.floor ?? 0) - 2.2, k) - Math.sin(Math.PI * k) * 6;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.4 + k * 0.1 + Math.sin(d * 8) * 0.15 * (1 - sstep((d - 0.8) / 1.2)));
    ctx.scale(HS / 3, HS / 3);
    crownShape(ctx, a, 'line');
    crownShape(ctx, a, 'fill');
    ctx.restore();
  }
  // her entrance: honey bursting up round the pot as it pops out
  if (q.burst >= 0) {
    const u = clamp(q.burst / 0.9, 0, 1);
    ctx.globalAlpha = 1 - u;
    for (let i = 0; i < 9; i++) {
      const an = -Math.PI * (0.1 + 0.8 * (i / 8));
      const x = c[0] + Math.cos(an) * (6 + u * 18);
      const y = c[1] - 4 + Math.sin(an) * (8 + u * 16) + u * u * 14;
      ctx.fillStyle = i % 3 ? HONEY[1] : '#ffffff';
      if (i % 3) {
        ell(ctx, x, y, 1.8, 2.3, an);
        ctx.fill();
      } else sparkle(ctx, x, y, 2);
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

const DRESS = {
  skin: SKIN,
  liveHead: true,
  noMoves: true,
  hide: ['legF', 'footFskin', 'legN', 'footNskin'],
  under2,
  under: {
    armF: (ctx, a, mode, S, D) => {
      ctx.save();
      cape(ctx, a, mode, D, false);
      ctx.restore();
      potBack(ctx, a, mode, S, D);
    },
  },
  over: {
    handFskin: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'F'),
    torsoSkin: (ctx, a, mode, S, D) => {
      ctx.save();
      onesie(ctx, a, mode, D);
      ctx.restore();
      potFront(ctx, a, mode, S, D);
    },
    neckSkin: (ctx, a, mode, S, D) => cape(ctx, a, mode, D, true),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
    armN: (ctx, a, mode, S, D) => {
      ctx.save();
      sleeve(ctx, a, mode, D, 'N');
      ctx.restore();
      lolly(ctx, a, mode, D, S);
    },
  },
  pose,
  fx,
};

const R = dressRig(DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  draw0(ctx, m, a);
  ctx.restore();
  // (her legs are in the pot: she never steps, so she is on no gait)
  a.gait = null;
};
rig.w = Math.round(rig.w * BIG * 1.3);
rig.h = Math.round(rig.h * BIG * 1.5);
// (noHop: no little happy hops from the monster drawer; her own bob carries her motion)
export const QUEENBEE_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true };
export const QUEENBEE_SIZE = { w: 52, h: 64 };
