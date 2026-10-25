// The weapon art kit: the looks of each progression tier and endgame theme, small shape builders
// shared between weapon types (horns, skulls, wings, saw blades, neon), and `pack`, which turns
// a weapon drawn around its grip into a sprite definition.
//
// Weapons are drawn in local coordinates with the grip at (0, 0) and the weapon pointing toward
// -y; forward (the cutting edge, a bow's belly) is +x.

import { R, E, P, T, F } from './pixel.js';

export const WHITE = '#ffffff';
export const GOLD = '#ffd66b';
export const GOLD_DARK = '#e0a93b';
export const IVORY = '#fff6e6';
export const FEATHER = '#e8eeff';
export const STRING = '#fff6fb';
export const GEM = '#ff9ec0';
export const STONE = { blade: '#c4bdb0', bladeDark: '#968e81', edge: '#e2ddd3' };

// Progression tiers, from a training weapon to a rune-carved one. `rank` grows the weapon.
export const TIERS = [
  { tier: 0, rank: 0, blade: '#e9c48f', bladeDark: '#c4925a', edge: '#f8e2bb', trim: '#a8743f', trimDark: '#7f5530', handle: '#c98e55', handleDark: '#9c6a3c', grip: '#e6d2a8', gem: null },
  { tier: 1, rank: 1, blade: '#c7ced9', bladeDark: '#8d95a5', edge: '#eef2f7', trim: '#858d9d', trimDark: '#5f6676', handle: '#8a6040', handleDark: '#6a4630', grip: '#6b4a35', gem: null },
  { tier: 2, rank: 2, blade: '#e6edf7', bladeDark: '#aeb9cf', edge: WHITE, trim: GOLD, trimDark: GOLD_DARK, handle: '#7a5238', handleDark: '#5a3a28', grip: '#4f5fa8', gem: '#ff6b8a' },
  { tier: 3, rank: 3, blade: '#e6f7ff', bladeDark: '#9fcdef', edge: WHITE, trim: '#bfe6ff', trimDark: '#7fb2e0', handle: '#dbeeff', handleDark: '#a8c8e8', grip: '#3f6fb8', gem: '#5fe0ff' },
  { tier: 4, rank: 4, blade: '#6c7192', bladeDark: '#474b66', edge: '#a3a9cc', trim: '#3d3756', trimDark: '#2a2540', handle: '#3d3756', handleDark: '#2a2540', grip: '#2a2540', gem: '#b48cff', rune: '#7ffcff' },
];

// Endgame themes. Laser weapons color their beams per type.
export const THEMES = {
  holy: { blade: '#fdfbff', bladeDark: '#e3dcf6', edge: WHITE, trim: GOLD, trimDark: GOLD_DARK, handle: IVORY, handleDark: '#eadfc8', grip: '#ffe9a8', gem: GEM },
  demonic: { blade: '#3b2434', bladeDark: '#24141f', edge: '#ff4a5a', trim: '#5c1d2c', trimDark: '#3a1019', handle: '#2c1a24', handleDark: '#1d1018', grip: '#5a1424', gem: '#ff2b3b', hot: '#ff3b2b', ember: '#ffb03b' },
  bone: { blade: '#f3e9cf', bladeDark: '#c9b48a', edge: '#fffaf0', trim: '#c9b48a', trimDark: '#8a7450', handle: '#e2d2ab', handleDark: '#b9a57c', grip: '#4f4238', gem: '#6bff9a', soul: '#6bff9a' },
  laser: { blade: '#dfe6f2', bladeDark: '#7c869a', edge: WHITE, trim: '#cfd8e6', trimDark: '#7c869a', handle: '#a9b4c8', handleDark: '#6b7488', grip: '#2f3548', gem: '#5ff3ff' },
  chainsaw: { blade: '#b8c0cc', bladeDark: '#7d8696', edge: '#eef2f7', trim: '#ff8a1f', trimDark: '#c25a0c', handle: '#3a3a46', handleDark: '#26262f', grip: '#26262f', gem: '#ffd23b' },
  cyber: { blade: '#2a2738', bladeDark: '#1a1824', edge: '#3bf0ff', trim: '#4a4660', trimDark: '#2e2b3d', handle: '#33304a', handleDark: '#211f30', grip: '#1a1824', gem: '#ff3bd4', neon: ['#3bf0ff', '#ff3bd4'] },
};

export const BEAMS = { sword: '#4fd8ff', axe: '#ff4f6b', spear: '#7dff6b', wand: '#ff6bf0', staff: '#b48cff', bow: '#5ff3ff', crossbow: '#ffcf4f', dagger: '#ff4f6b', claw: '#7dff6b' };

// The look for a weapon: a progression tier (0-4) or an endgame theme.
export function lookFor(type, tier, theme) {
  if (theme && THEMES[theme]) return { ...THEMES[theme], theme, rank: 5, tier: 5, beam: BEAMS[type] };
  return { ...TIERS[Math.max(0, Math.min(4, tier | 0))], theme: null };
}

// ---------- Packing ----------

function bounds(s) {
  if (s.t === 'r') return [s.x, s.y, s.x + s.w, s.y + s.h];
  if (s.t === 'e') return [s.x - s.rx, s.y - s.ry, s.x + s.rx, s.y + s.ry];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [px, py] of s.pts) {
    x0 = Math.min(x0, px + s.x); y0 = Math.min(y0, py + s.y);
    x1 = Math.max(x1, px + s.x); y1 = Math.max(y1, py + s.y);
  }
  return [x0, y0, x1, y1];
}

// Moves a weapon drawn around its grip onto a sprite canvas. `reach` lists extra points the
// canvas must cover (energy blades drawn live), so swing trails know the weapon's real length.
export function pack(shapes, { blade, reach = [], live = null, anchors = null }) {
  let x0 = 0, y0 = 0, x1 = 1, y1 = 1;
  for (const s of shapes) {
    const [a, b, c, d] = bounds(s);
    x0 = Math.min(x0, a); y0 = Math.min(y0, b); x1 = Math.max(x1, c); y1 = Math.max(y1, d);
  }
  for (const [x, y] of reach) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  const ox = Math.ceil(-x0);
  const oy = Math.ceil(-y0);
  const moved = shapes.map((s) => ({ ...s, x: s.x + ox, y: s.y + oy }));
  return {
    w: Math.ceil(x1) + ox + 1, h: Math.ceil(y1) + oy + 1, grip: [ox, oy],
    blade: [blade[0] + oy, blade[1] + oy], shapes: moved, live, anchors,
  };
}

// ---------- Shape builders ----------

// A pair of horns rising from (x, y), curling out and up.
export function horns(x, y, size, c, sides = [-1, 1]) {
  return sides.map((sd) => T([
    [x + sd * 0.5, y + 1], [x + sd * size * 0.7, y + 0.2], [x + sd * size * 1.1, y - size * 0.5],
    [x + sd * size * 1.05, y - size * 1.3], [x + sd * size * 0.8, y - size * 0.6], [x + sd * size * 0.45, y - size * 0.25], [x + sd * 0.5, y - 1.5],
  ], c));
}

// A demon's eye, wide open; the live layer blinks it.
export function demonEye(x, y, r) {
  return [
    E(x, y, r * 1.6, r, '#1a0a10'),
    F(E(x, y, r * 1.35, r * 0.75, '#ffcf3b')),
    F(E(x, y, r * 0.8, r * 0.7, '#ff3b2b')),
    F(R(x - 0.5, y - r * 0.6, 1, r * 1.2, '#1a0a10')),
  ];
}

// A little skull with glowing eye sockets. Returns shapes and where the eyes are.
export function skull(x, y, r, eye, bone = '#f3e9cf', dark = '#a08a62') {
  const ex = r * 0.42;
  return {
    shapes: [
      E(x, y, r, r * 0.9, bone),
      R(x - r * 0.62, y + r * 0.35, r * 1.24, r * 0.75, bone),
      F(E(x - ex, y + r * 0.1, r * 0.3, r * 0.34, eye)),
      F(E(x + ex, y + r * 0.1, r * 0.3, r * 0.34, eye)),
      F(P(x - 0.5, y + r * 0.5, dark)),
      F(R(x - r * 0.45, y + r * 0.85, r * 0.9, 0.5, dark)),
    ],
    eyes: [[x - ex, y + r * 0.1], [x + ex, y + r * 0.1]],
  };
}

// A pair of feathered wings spreading from `gap` either side of (x, y): long flight feathers
// fanning out and up, with soft rounded coverts over their roots. `flap` lifts the tips.
export function wings(x, y, size, flap = 0, sides = [-1, 1], gap = 0) {
  const out = [];
  for (const sd of sides) {
    const bx = x + sd * gap;
    [4, 24, 44, 64].forEach((deg, i) => {
      const a = (deg * Math.PI) / 180;
      const len = size * [1, 1, 0.9, 0.75][i];
      const tx = bx + sd * Math.cos(a) * len;
      const ty = y - Math.sin(a) * len + flap * (1 - i * 0.25);
      // The feather's lower edge, offset along its outward normal so it has some body.
      const nx = sd * Math.sin(a);
      const ny = Math.cos(a);
      out.push(T([[bx, y - 1.5], [tx, ty], [tx + nx * 2.4 - sd * Math.cos(a) * 1.2, ty + ny * 2.4 + Math.sin(a) * 1.2], [bx + nx * 3, y + ny * 3]], i % 2 ? '#d9e0fb' : WHITE));
    });
    out.push(E(bx + sd * size * 0.22, y - size * 0.12 + flap * 0.3, size * 0.26, size * 0.18, FEATHER));
    out.push(E(bx + sd * size * 0.12, y + flap * 0.2, size * 0.18, size * 0.15, WHITE));
  }
  return out;
}

// A halo ring.
export function halo(x, y, rx, ry = rx * 0.38) {
  return [E(x, y, rx, ry, GOLD), E(x, y, rx - 1.4, Math.max(0.4, ry - 1), 'none')];
}

// Black-and-yellow hazard stripes.
export function hazard(x, y, w, h) {
  const out = [R(x, y, w, h, '#ffd23b')];
  for (let i = 0; i * 2 < w; i += 2) out.push(F(R(x + i * 2 + 0.5, y, Math.min(1.5, w - i * 2 - 0.5), h, '#2a2a33')));
  return out;
}

// Chain teeth running along a straight edge from a to b, pointing to `side` (+1 right of travel).
// `shift` (0-1) slides the teeth along so the chain runs.
export function chain(a, b, side, shift, c, gap = 3) {
  const out = [];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ux = (b[0] - a[0]) / len;
  const uy = (b[1] - a[1]) / len;
  const nx = -uy * side;
  const ny = ux * side;
  for (let d = (shift % 1) * gap; d < len - 0.5; d += gap) {
    const px = a[0] + ux * d;
    const py = a[1] + uy * d;
    out.push(T([[px, py], [px + nx * 1.7 + ux * 1.2, py + ny * 1.7 + uy * 1.2], [px + ux * 1.8, py + uy * 1.8]], c));
  }
  return out;
}

// A circular saw blade, its teeth and vents turning with the frame.
export function sawDisc(x, y, r, frame, frames, look) {
  const out = [];
  const n = Math.max(8, Math.round(r * 1.6));
  const turn = ((frame % frames) / frames) * ((Math.PI * 2) / n);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + turn;
    const b = a + (Math.PI * 2) / n * 0.55;
    out.push(T([[x + Math.cos(a) * (r - 0.5), y + Math.sin(a) * (r - 0.5)], [x + Math.cos(a) * (r + 2), y + Math.sin(a) * (r + 2)], [x + Math.cos(b) * (r - 0.5), y + Math.sin(b) * (r - 0.5)]], look.edge));
  }
  out.push(E(x, y, r, r, look.blade));
  out.push(E(x, y, r * 0.72, r * 0.72, look.bladeDark));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + turn * 3;
    out.push(E(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45, r * 0.17, r * 0.17, 'none'));
  }
  out.push(E(x, y, r * 0.3, r * 0.3, look.trim));
  out.push(F(P(x - 0.5, y - 0.5, look.gem)));
  return out;
}

// A flat neon line (exact color, no shading).
export function neon(x, y, w, h, c) {
  return F(R(x, y, w, h, c));
}

// Bone vertebrae stacked along a shaft from y0 down to y1.
export function vertebrae(x, y0, y1, w, look) {
  const out = [R(x - w * 0.3, y0, w * 0.6, y1 - y0, look.handleDark)];
  for (let y = y0; y < y1 - 1; y += 3) out.push(E(x, y + 1.2, w / 2, 1.3, look.handle));
  return out;
}

// Rune glyphs: tiny 3x3 marks, lit in turn by the frame.
const GLYPHS = [
  [[0, 0], [1, 1], [2, 0], [1, 2]],
  [[0, 0], [0, 1], [0, 2], [1, 1], [2, 0]],
  [[1, 0], [0, 1], [2, 1], [1, 2]],
  [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  [[0, 2], [1, 0], [1, 1], [1, 2], [2, 2]],
];
export function runes(x, y0, y1, frame, lit, dim, step = 4) {
  const out = [];
  for (let y = y0, k = 0; y <= y1 - 2; y += step, k++) {
    const c = (k - frame + 60) % 3 === 0 ? lit : dim;
    for (const [gx, gy] of GLYPHS[k % GLYPHS.length]) out.push(F(P(x - 1 + gx, y + gy, c)));
  }
  return out;
}
