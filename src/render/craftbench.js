// The town craft bench (data/crafting.js, world/crafting.js): a sturdy oak workbench with a little
// anvil on one end, a pegboard of tools behind it, and a crate of ore and a log underneath. Drawn
// on the prop kit like the stove (hue-shifted ramps, lit from the upper left, outlines in each
// part's own darker shade), with each town's own touch: Sprout's flower pot and rose apron,
// the Harbor's rope coil and sea-blue apron, the Crag's stone-footed anvil, ember apron and a
// glowing coal pan, the Grove's moon rune and a glowing crystal.
//
// Idle life, drawn live over the sprite: the tools on the pegboard sway on their pegs a moment
// after the wind (the saw heavier and slower, the tongs swinging most), a glint slides over the
// anvil now and then, and a few sparks hop off it and fade; while someone works at the bench the
// sparks come with every hammer blow.

import { R, E, T, F, mix } from './pixel.js';
import { ramp, planks, stones, swing, pivoted, flicker, hash } from './propkit.js';
import { art, place } from './scenery.js';

const W = 76;
const H = 64;
// Each town's colours and touch.
const STYLES = {
  town: { apron: '#ff9ec0', wood: '#c99a6b', touch: 'flowers' },
  harbor: { apron: '#6fb0e0', wood: '#b88a64', touch: 'rope' },
  crag: { apron: '#e0703a', wood: '#b07c58', touch: 'coal' },
  grove: { apron: '#9f8ae0', wood: '#a88a78', touch: 'rune' },
};
export const benchStyle = (theme) => STYLES[theme] ?? STYLES.town;

// Where things sit, relative to the sprite's bottom centre (for the live parts).
const ANVIL = { x: 15, y: -36 };
const PEGS = [[-24, -53, 'hammer'], [-12, -54, 'saw'], [0, -53, 'tongs'], [10, -52, 'file']];

function benchArt(theme) {
  const st = benchStyle(theme);
  return art(`craftbench|${theme}`, W, H, () => {
    const wood = ramp(st.wood, 0.8);
    const dark = ramp(mix(st.wood, '#6a4a5a', 0.35), 0.8);
    const cloth = ramp(st.apron, 0.7);
    const steel = ramp('#b8c0d8', 0.8);
    const out = [];
    // The pegboard behind, on two posts, with its pegs.
    out.push(R(13, 6, 3, 26, dark.base), F(R(13, 6, 1, 26, dark.hi)), R(52, 6, 3, 26, dark.base), F(R(52, 6, 1, 26, dark.hi)));
    out.push(...planks(10, 9, 48, 19, ramp(mix(st.wood, '#fff4e6', 0.25), 0.7), 5, 7));
    out.push(F(R(10, 9, 48, 1.2, wood.hi)), F(R(10, 27, 48, 1, wood.deep)));
    for (const [dx, dy] of PEGS) out.push(F(E(W / 2 + dx, H + dy, 1.2, 1.2, dark.sh)), F(E(W / 2 + dx - 0.3, H + dy - 0.3, 0.5, 0.5, wood.hi)));
    // The town's touch on the board.
    if (st.touch === 'flowers') {
      out.push(T([[48, 9], [49, 4.6], [56, 4.6], [57, 9]], '#e0956a'), F(R(48.4, 4.4, 8.2, 1.4, '#f2b48a')));
      for (const [x, y, c] of [[50, 2.8, '#ff9ec0'], [53, 2, '#ffe36b'], [55.6, 3, '#ffffff']]) out.push(E(x, y, 1.8, 1.6, c), F(E(x, y, 0.6, 0.6, '#ffe9a6')));
      out.push(F(E(51.6, 4.2, 1.4, 0.7, '#8fdc9a')), F(E(54.8, 4.4, 1.2, 0.6, '#8fdc9a')));
    } else if (st.touch === 'rope') {
      for (let k = 0; k < 3; k++) out.push(E(50, 14 + k * 0.4, 5.6 - k * 1.6, 4.4 - k * 1.2, k % 2 ? '#e8d2a0' : '#d8bc84'));
      out.push(F(E(50, 14.6, 1.4, 1.1, dark.sh)));
    } else if (st.touch === 'rune') {
      out.push(F(E(19, 15, 4.4, 4.4, '#d8ccff')), F(E(20.6, 14.2, 3.6, 3.8, mix(st.wood, '#fff4e6', 0.25))), F(E(17.4, 17.4, 0.7, 0.7, '#ffffff')));
    }
    // The bench top: a thick slab, lit on its top edge, end grain at the sides.
    out.push(R(2, 32, 72, 6, wood.base), F(R(2, 32, 72, 1.4, wood.hi)), F(R(2, 36.6, 72, 1.4, wood.sh)));
    out.push(F(E(4.6, 35, 1.2, 1.6, wood.deep)), F(E(71.4, 35, 1.2, 1.6, wood.deep)), F(R(24, 33.8, 14, 0.6, wood.sh)), F(R(44, 34.6, 10, 0.6, wood.sh)));
    // The apron hanging off the front, scalloped, with a pocket.
    const scal = [];
    for (let k = 0; k <= 8; k++) scal.push([10 + k * 7, 44 + (k % 2 ? 1.6 : 0)]);
    out.push(T([[10, 38], [66, 38], ...scal.reverse()], cloth.base), F(R(10, 38, 56, 1.2, cloth.sh)));
    out.push(F(R(30, 40, 12, 3.4, cloth.hi)), F(R(30, 43, 12, 0.6, cloth.sh)), F(R(35.6, 40, 0.8, 3.4, cloth.sh)));
    // Legs and the low brace.
    out.push(R(6, 38, 5, 26, wood.base), F(R(6, 38, 1.4, 26, wood.hi)), F(R(9.6, 38, 1.4, 26, wood.sh)));
    out.push(R(65, 38, 5, 26, wood.base), F(R(65, 38, 1.4, 26, wood.hi)), F(R(68.6, 38, 1.4, 26, wood.sh)));
    out.push(R(11, 55, 54, 3, dark.base), F(R(11, 55, 54, 0.8, dark.hi)));
    // Under the bench: a crate of ore (copper, iron, a pink crystal) and a log.
    out.push(...planks(14, 50, 20, 14, ramp('#d8b088', 0.7), 3, 3, true));
    for (const [x, y, c] of [[18, 49.4, '#e0915a'], [23, 48.6, '#a8aab8'], [28.4, 49.4, '#e0915a']]) {
      const r = ramp(c, 0.8);
      out.push(E(x, y, 3, 2.4, r.base), F(E(x - 0.8, y - 0.8, 1.2, 0.9, r.hi)));
    }
    out.push(T([[25, 46.2], [26.6, 42.6], [28.4, 46.4]], '#ffb3d1'), F(T([[26.6, 42.6], [28.4, 46.4], [27, 46.4]], '#e889b4')));
    out.push(R(40, 58, 22, 6, wood.base), F(R(40, 58, 22, 1.2, wood.hi)), E(62, 61, 2.4, 3, '#e8c69a'), F(E(62, 61, 1.2, 1.6, wood.sh)), F(E(62, 61, 0.5, 0.6, '#e8c69a')));
    // The anvil on the right end: a stone or wood foot, the waist, the face and the horn.
    const ax = W / 2 + ANVIL.x;
    const ay = H + ANVIL.y;
    if (st.touch === 'coal') out.push(...stones(ax - 8, ay - 1, 16, 5, ramp('#d8b49a', 0.8), 2, { rowH: 2.5, blockW: 5 }));
    else out.push(R(ax - 7, ay, 14, 4, dark.base), F(R(ax - 7, ay, 14, 0.8, dark.hi)));
    out.push(T([[ax - 4, ay], [ax - 2.4, ay - 4], [ax + 2.4, ay - 4], [ax + 4, ay]], steel.sh));
    out.push(T([[ax - 8, ay - 4], [ax - 8, ay - 8], [ax + 6, ay - 8], [ax + 12, ay - 7], [ax + 6, ay - 5.4], [ax + 5, ay - 4]], steel.base));
    out.push(F(R(ax - 8, ay - 8, 14, 1, steel.hi)), F(T([[ax - 8, ay - 5.2], [ax + 5, ay - 5.2], [ax + 5, ay - 4], [ax - 8, ay - 4]], steel.sh)));
    // On the bench: a half-made blade and a chisel by a wood block.
    out.push(T([[18, 32], [22, 29.6], [34, 29.6], [36, 31], [34, 32]], '#dfe6f5'), F(R(22, 29.6, 12, 0.6, '#ffffff')), R(14, 30.4, 4, 1.8, wood.sh));
    out.push(R(4, 26, 8, 6, ramp('#e8c69a', 0.8).base), F(R(4, 26, 8, 1, '#fff1d4')), F(E(8, 26.5, 2.4, 0.5, '#d8b088')));
    if (st.touch === 'coal') out.push(E(ax - 18, ay + 2, 5, 1.6, '#6a5a6a'), F(E(ax - 18, ay + 1.4, 3.6, 1, '#ff9a5a')), F(E(ax - 19, ay + 1, 1.2, 0.5, '#ffe36b')));
    if (st.touch === 'rune') out.push(T([[ax - 19, ay + 2], [ax - 17, ay - 4], [ax - 15, ay + 2]], '#bfe6ff'), F(T([[ax - 17, ay - 4], [ax - 15, ay + 2], [ax - 16.4, ay + 2]], '#8fb8ff')));
    return out;
  }, false);
}

// The tools on the pegboard, each hanging from its top (drawn with their pivot at (4, 0)).
function toolArt(kind) {
  return art(`benchtool|${kind}`, 8, 16, () => {
    const wood = ramp('#c99a6b', 0.8);
    const steel = ramp('#c8d0e0', 0.8);
    const ring = [E(4, 1.2, 1.4, 1.2, steel.sh), F(E(4, 1.2, 0.6, 0.5, '#fff8ec'))];
    if (kind === 'hammer') return [...ring, R(3.2, 2, 1.6, 9, wood.base), F(R(3.2, 2, 0.6, 9, wood.hi)), R(0.6, 10.6, 6.8, 3.6, steel.base), F(R(0.6, 10.6, 6.8, 0.8, steel.hi)), F(R(0.6, 13.4, 6.8, 0.8, steel.sh))];
    if (kind === 'saw') return [...ring, R(2.4, 2, 3.2, 3.4, wood.base), F(R(2.4, 2, 1, 3.4, wood.hi)), T([[2.8, 5.4], [5.6, 5.4], [5.4, 15], [3.4, 15.4]], steel.base), F(T([[4.6, 5.4], [5.6, 5.4], [5.4, 15], [4.4, 15]], steel.sh)), ...[7, 9, 11, 13].map((y) => F(T([[2.6, y], [1.8, y + 0.9], [2.8, y + 1.6]], steel.sh)))];
    if (kind === 'tongs') return [...ring, T([[3.4, 2], [4.6, 2], [6.4, 14], [5.4, 14.4]], steel.sh), T([[3.4, 2], [4.6, 2], [2.6, 14.4], [1.6, 14]], steel.base), F(E(4, 5, 0.8, 0.8, steel.hi))];
    return [...ring, R(3.2, 2, 1.6, 4.4, '#ff9ec0'), F(R(3.2, 2, 0.6, 4.4, '#ffd0e2')), T([[3.4, 6.4], [4.6, 6.4], [4.4, 13.6], [4, 14.4], [3.6, 13.6]], steel.base), F(R(4.2, 6.4, 0.4, 7, steel.sh))];
  }, false);
}
// How each tool swings: the saw is heavy, the tongs swing most.
const SWING = { hammer: 1, saw: 0.6, tongs: 1.6, file: 1.2 };

function spark(ctx, x, y, r, c, a) {
  if (r <= 0.05 || a <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, a);
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
  ctx.restore();
}
function glow(ctx, x, y, r, color, alpha) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
const ease = (u) => u * u * (3 - 2 * u);

// Draws the bench with its bottom centre at (x, gy). `wx` is its place in the world (its sway and
// sparks run from it, never from the screen), `working` is how far into a craft someone at it is
// (0-1, or null).
export function drawCraftBench(ctx, theme, x, gy, time, wx, working = null) {
  const st = benchStyle(theme);
  // The Crag's coal pan and the Grove's crystal breathe a little light.
  if (st.touch === 'coal') glow(ctx, x + ANVIL.x - 18, gy + ANVIL.y + 1, 16, '#ffb35a', 0.4 * flicker(time, wx));
  if (st.touch === 'rune') glow(ctx, x + ANVIL.x - 17, gy + ANVIL.y - 1, 14, '#bfe6ff', 0.3 + 0.1 * Math.sin(time * 1.7 + wx));
  place(ctx, benchArt(theme), x, gy + 2);
  // The tools sway on their pegs, each a moment after the last.
  PEGS.forEach(([dx, dy, kind], i) => {
    const px = x + dx;
    const py = gy + 2 + dy;
    const a = swing(time, wx + dx, SWING[kind] * 1.4, i * 1.7);
    const s = toolArt(kind);
    pivoted(ctx, px, py, a, () => place(ctx, s, px, py - 1 + s.h));
  });
  // A glint slides over the anvil's face now and then.
  const ax = x + ANVIL.x;
  const ay = gy + 2 + ANVIL.y - 8;
  const period = 3.8 + hash(wx) * 1.4;
  const u = ((time + hash(wx * 3) * 5) % period) / 0.6;
  if (u < 1) {
    const g = Math.sin(Math.PI * u);
    spark(ctx, ax - 7 + ease(u) * 16, ay + 0.6, 2.6 * g, '#ffffff', g);
  }
  // Sparks hop off the anvil: a few now and then, idle; with every hammer blow while working.
  const beat = working != null ? 0.55 : 2.9 + hash(wx * 7);
  const k = Math.floor(time / beat);
  const since = time - k * beat;
  if (working != null || hash(k + wx) < 0.45) {
    for (let j = 0; j < (working != null ? 5 : 3); j++) {
      const v = since / (0.5 + 0.2 * hash(k * 3 + j));
      if (v >= 1) continue;
      const dir = (hash(k * 7 + j * 3 + wx) - 0.5) * 2;
      const sx = ax + 1 + dir * 12 * v;
      const sy = ay - 2 - (14 + 8 * hash(j + k)) * v + 26 * v * v;
      spark(ctx, sx, sy, 1.6 * (1 - v * 0.6), j % 2 ? '#ffe36b' : '#ffb35a', 1 - v);
    }
  }
}
