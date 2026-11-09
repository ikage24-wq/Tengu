// The weapon art kit: the looks of each progression tier and endgame theme, small shape builders
// shared between weapon types (horns, skulls, wings, saw blades, neon), and `pack`, which turns
// a weapon drawn around its grip into a sprite definition.
//
// Weapons are drawn in local coordinates with the grip at (0, 0) and the weapon pointing toward
// -y; forward (the cutting edge, a bow's belly) is +x.

import { R, E, P, T, F, mix } from './pixel.js';

export const WHITE = '#ffffff';
export const GOLD = '#ffd66b';
export const GOLD_DARK = '#e0a93b';
export const IVORY = '#fff6e6';
export const FEATHER = '#e8eeff';
export const STRING = '#fff6fb';
export const GEM = '#ff9ec0';
export const STONE = { blade: '#c4bdb0', bladeDark: '#968e81', edge: '#e2ddd3' };

// Progression tiers: a training weapon (0), then one material every 5 levels (1-20). `rank`
// (one per weapon noun, every 4 tiers) grows the weapon; the rest of a tier's flair comes from
// `ornaments` below. `rune` is the glow of engraved runes, `motif` the material's crowning
// ornament (see the forms), `fx` its live effect (see weapon-fx.js).
const MATERIALS = [
  { name: 'wood', blade: '#e9c48f', bladeDark: '#c4925a', edge: '#f8e2bb', trim: '#a8743f', trimDark: '#7f5530', handle: '#c98e55', handleDark: '#9c6a3c', grip: '#e6d2a8', gem: GEM },
  { name: 'copper', blade: '#eba477', bladeDark: '#c06d43', edge: '#ffd9bd', trim: '#c06d43', trimDark: '#8f4a2c', handle: '#8a6040', handleDark: '#6a4630', grip: '#6b4a35', gem: GEM },
  { name: 'bronze', blade: '#dcae62', bladeDark: '#a97a3c', edge: '#f8e2a8', trim: '#a97a3c', trimDark: '#7a5226', handle: '#7a5238', handleDark: '#5a3a28', grip: '#8a3a3a', gem: GEM },
  { name: 'iron', blade: '#b9bfc9', bladeDark: '#80879a', edge: '#e4e8ee', trim: '#6d7484', trimDark: '#4f5564', handle: '#6a4630', handleDark: '#4f3424', grip: '#4a3a35', gem: GEM },
  { name: 'steel', blade: '#dae1ec', bladeDark: '#9ea9bc', edge: WHITE, trim: '#8d95a5', trimDark: '#5f6676', handle: '#5a3a28', handleDark: '#40291c', grip: '#4f5fa8', gem: GEM, fx: 'glint' },
  { name: 'silver', blade: '#f1f3f8', bladeDark: '#bcc2d1', edge: WHITE, trim: '#c9ced8', trimDark: '#9097a8', handle: '#5a3a5a', handleDark: '#40283f', grip: '#8a5fc8', gem: '#ff6b8a', fx: 'glint' },
  { name: 'mithril', blade: '#e1f3ff', bladeDark: '#a2c8ea', edge: WHITE, trim: '#bfe6ff', trimDark: '#7fb2e0', handle: '#dbeeff', handleDark: '#a8c8e8', grip: '#3f6fb8', gem: '#5fe0ff', fx: 'shimmer' },
  { name: 'cobalt', blade: '#5f8be6', bladeDark: '#3a5cb4', edge: '#b8d4ff', trim: '#d8e0f0', trimDark: '#9aa6c4', handle: '#2f3f7a', handleDark: '#1f2a58', grip: '#24306a', gem: '#ffd23b', fx: 'shimmer' },
  { name: 'crystal', blade: '#c4f4ff', bladeDark: '#7fd4ee', edge: WHITE, trim: '#9fe2f8', trimDark: '#5fb4d6', handle: '#e6faff', handleDark: '#a8d8ea', grip: '#5fb4d6', gem: '#ff9ee8', fx: 'frost' },
  { name: 'runic', blade: '#6c7192', bladeDark: '#474b66', edge: '#a3a9cc', trim: '#3d3756', trimDark: '#2a2540', handle: '#3d3756', handleDark: '#2a2540', grip: '#2a2540', gem: '#b48cff', rune: '#7ffcff', fx: 'runes' },
  { name: 'starsteel', blade: '#46529a', bladeDark: '#2c3570', edge: '#d8e4ff', trim: '#e8eefc', trimDark: '#9aa6c8', handle: '#2c3570', handleDark: '#1d2350', grip: '#1d2350', gem: '#fff3a6', rune: '#fff3a6', motif: 'star', fx: 'stars' },
  { name: 'moonsilver', blade: '#eceaff', bladeDark: '#b6b4e6', edge: WHITE, trim: '#a3a6e6', trimDark: '#6f72b8', handle: '#4a4f8a', handleDark: '#33376a', grip: '#4a4f8a', gem: '#bfe6ff', rune: '#bfe6ff', motif: 'moon', fx: 'frost' },
  { name: 'sunforged', blade: '#ffd56b', bladeDark: '#f0a030', edge: '#fff6c8', trim: '#ff8a3c', trimDark: '#c85a1c', handle: '#8a3a1c', handleDark: '#62260f', grip: '#d8402a', gem: '#ff4a2a', rune: '#fff3a6', motif: 'sun', fx: 'embers' },
  { name: 'dragonbone', blade: '#f6ecd2', bladeDark: '#cdb98e', edge: '#fffaf0', trim: '#9a2a32', trimDark: '#661a22', handle: '#e2d2ab', handleDark: '#b9a57c', grip: '#661a22', gem: '#ff2b3b', rune: '#ff6b4a', motif: 'horns', fx: 'embers' },
  { name: 'obsidian', blade: '#2e2640', bladeDark: '#18131f', edge: '#c08aff', trim: '#433858', trimDark: '#271f36', handle: '#2e2640', handleDark: '#18131f', grip: '#5a3a8a', gem: '#c08aff', rune: '#c08aff', motif: 'shards', fx: 'edge' },
  { name: 'adamant', blade: '#8fdcb8', bladeDark: '#4f9e80', edge: '#e4fff2', trim: '#2f6a5a', trimDark: '#1f4a40', handle: '#2f4a44', handleDark: '#1f3430', grip: '#1f4a40', gem: '#ffd23b', rune: '#a8ffd8', motif: 'crown', fx: 'runes' },
  { name: 'phoenix', blade: '#ffb44f', bladeDark: '#f2662a', edge: '#fff2a0', trim: '#e0402a', trimDark: '#a02a1c', handle: '#7a2a1c', handleDark: '#561a10', grip: '#ffcf3b', gem: '#fff06b', rune: '#fff3a6', motif: 'feathers', fx: 'flames' },
  { name: 'abyssal', blade: '#4e2c70', bladeDark: '#2c1844', edge: '#c47bff', trim: '#2c1844', trimDark: '#1a0e2a', handle: '#2c1844', handleDark: '#1a0e2a', grip: '#1a0e2a', gem: '#e6ff5a', rune: '#c47bff', motif: 'eye', fx: 'void' },
  { name: 'astral', blade: '#2f40a0', bladeDark: '#1e286c', edge: '#a8d4ff', trim: '#e8eeff', trimDark: '#9fb0e0', handle: '#1e286c', handleDark: '#141a4c', grip: '#4562d8', gem: '#fff3a6', rune: '#cfe6ff', motif: 'orbit', fx: 'stars' },
  { name: 'celestial', blade: '#fffaf0', bladeDark: '#ecd9a8', edge: WHITE, trim: GOLD, trimDark: GOLD_DARK, handle: IVORY, handleDark: '#eadfc8', grip: '#7fc8ff', gem: '#7fd0ff', rune: GOLD, motif: 'halo', fx: 'radiant' },
  { name: 'genesis', blade: '#fdfaff', bladeDark: '#ddd2f4', edge: WHITE, trim: '#ffe28a', trimDark: '#f0b04a', handle: '#fff6fb', handleDark: '#e8d8f0', grip: '#ff9ee8', gem: '#ffffff', rune: '#ffffff', motif: 'genesis', fx: 'prism' },
];

// Genesis's rainbow, for its prismatic gems, inlays, and wings.
export const PRISM = ['#ff9ec0', '#ffc98a', '#fff08a', '#9ff0b8', '#8fd0ff', '#c8a8ff'];

// Ornaments grow with the tier: gems from Silver (one more every rank), spikes, fins, and
// engraved runes from Runic.
function ornaments(t) {
  return { gems: t < 5 ? 0 : t < 9 ? 1 : t < 13 ? 2 : 3, spikes: t >= 9 };
}

// Variant recolors: the blade (or a bow's limbs, a staff's shaft) takes the variant's color while
// the trim, gems and ornaments keep the material's.
const VARIANT_LOOKS = {
  dark: { blade: '#3e3854', bladeDark: '#27223a', edge: '#b44cff', glow: '#b44cff' },
  white: { blade: '#f7f2e8', bladeDark: '#d9cfbc', edge: WHITE, trim: GOLD, trimDark: GOLD_DARK },
  crimson: { blade: '#dc4a5e', bladeDark: '#a02a40', edge: '#ffb8c2' },
  azure: { blade: '#4f8fe8', bladeDark: '#2f60b4', edge: '#c4f4ff' },
  gilded: { blade: '#f4c443', bladeDark: '#cc931e', edge: WHITE, trim: '#fff6dc', trimDark: '#e0c890' },
};
// Types whose shaft or wood (not a blade) carries most of the color.
const WOODEN = new Set(['bow', 'crossbow', 'wand', 'staff', 'spear']);

// Endgame themes. Laser weapons color their beams per type.
export const THEMES = {
  holy: { blade: '#fdfbff', bladeDark: '#e3dcf6', edge: WHITE, trim: GOLD, trimDark: GOLD_DARK, handle: IVORY, handleDark: '#eadfc8', grip: '#ffe9a8', gem: GEM },
  demonic: { blade: '#3b2434', bladeDark: '#24141f', edge: '#ff4a5a', trim: '#5c1d2c', trimDark: '#3a1019', handle: '#2c1a24', handleDark: '#1d1018', grip: '#5a1424', gem: '#ff2b3b', hot: '#ff3b2b', ember: '#ffb03b' },
  bone: { blade: '#f3e9cf', bladeDark: '#c9b48a', edge: '#fffaf0', trim: '#c9b48a', trimDark: '#8a7450', handle: '#e2d2ab', handleDark: '#b9a57c', grip: '#4f4238', gem: '#6bff9a', soul: '#6bff9a' },
  laser: { blade: '#dfe6f2', bladeDark: '#7c869a', edge: WHITE, trim: '#cfd8e6', trimDark: '#7c869a', handle: '#a9b4c8', handleDark: '#6b7488', grip: '#2f3548', gem: '#5ff3ff' },
  chainsaw: { blade: '#b8c0cc', bladeDark: '#7d8696', edge: '#eef2f7', trim: '#ff8a1f', trimDark: '#c25a0c', handle: '#3a3a46', handleDark: '#26262f', grip: '#26262f', gem: '#ffd23b' },
  cyber: { blade: '#2a2738', bladeDark: '#1a1824', edge: '#3bf0ff', trim: '#4a4660', trimDark: '#2e2b3d', handle: '#33304a', handleDark: '#211f30', grip: '#1a1824', gem: '#ff3bd4', neon: ['#3bf0ff', '#ff3bd4'] },
};

export const BEAMS = { sword: '#4fd8ff', axe: '#ff4f6b', spear: '#7dff6b', wand: '#ff6bf0', staff: '#b48cff', bow: '#5ff3ff', crossbow: '#ffcf4f', dagger: '#ff4f6b', gauntlet: '#7dff6b' };

// The look for a weapon: a progression tier (0-20), maybe recolored by a variant, or an endgame
// theme (themes ignore variants).
export function lookFor(type, tier, theme, variant = null) {
  if (theme && THEMES[theme]) return { ...THEMES[theme], theme, rank: 5, tier: 21, beam: BEAMS[type] };
  const t = Math.max(0, Math.min(20, tier | 0));
  const base = MATERIALS[t];
  // `step` (0-3) is the tier's place within its rank: each material is a little longer and
  // broader than the last, so the ladder grows tier by tier, not only every fourth.
  const look = { ...base, ...ornaments(t), tier: t, rank: Math.ceil(t / 4), step: t ? (t - 1) % 4 : 0, theme: null, variant: null };
  if (look.rune) look.runeDim = mix(base.bladeDark, base.rune, 0.3);
  if (base.name === 'genesis') look.prism = PRISM;
  const v = t > 0 && VARIANT_LOOKS[variant];
  if (!v) return look;
  Object.assign(look, v, { variant });
  if (WOODEN.has(type) && !v.handle) Object.assign(look, { handle: v.blade, handleDark: v.bladeDark });
  if (look.runeDim) look.runeDim = mix(look.bladeDark, look.rune, 0.3);
  return look;
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
// fanning out and up, with soft rounded coverts over their roots. `flap` lifts the tips; `cols`
// colors the four flight feathers and then the two coverts.
const WING = [WHITE, '#d9e0fb', WHITE, '#d9e0fb', FEATHER, WHITE];
export function wings(x, y, size, flap = 0, sides = [-1, 1], gap = 0, cols = WING) {
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
      out.push(T([[bx, y - 1.5], [tx, ty], [tx + nx * 2.4 - sd * Math.cos(a) * 1.2, ty + ny * 2.4 + Math.sin(a) * 1.2], [bx + nx * 3, y + ny * 3]], cols[i]));
    });
    out.push(E(bx + sd * size * 0.22, y - size * 0.12 + flap * 0.3, size * 0.26, size * 0.18, cols[4]));
    out.push(E(bx + sd * size * 0.12, y + flap * 0.2, size * 0.18, size * 0.15, cols[5]));
  }
  return out;
}

// A halo ring.
export function halo(x, y, rx, ry = rx * 0.38, c = GOLD) {
  return [E(x, y, rx, ry, c), E(x, y, rx - 1.4, Math.max(0.4, ry - 1), 'none')];
}

// A four-pointed star.
export function star(x, y, r, c) {
  const k = r * 0.3;
  return T([[x, y - r], [x + k, y - k], [x + r, y], [x + k, y + k], [x, y + r], [x - k, y + k], [x - r, y], [x - k, y - k]], c);
}

// A crescent moon opening to the right.
export function crescent(x, y, r, c) {
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const a = -Math.PI / 2 - (i / 8) * Math.PI;
    pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
  }
  for (let i = 8; i >= 0; i--) {
    const a = -Math.PI / 2 - (i / 8) * Math.PI;
    pts.push([x + r * 0.35 + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.78]);
  }
  return T(pts, c);
}

// Sun rays fanning around (x, y), to sit behind a disc.
export function sunburst(x, y, r, c, n = 8) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const w = 0.5;
    out.push(T([[x + Math.cos(a - w) * r * 0.55, y + Math.sin(a - w) * r * 0.55], [x + Math.cos(a) * r, y + Math.sin(a) * r], [x + Math.cos(a + w) * r * 0.55, y + Math.sin(a + w) * r * 0.55]], c));
  }
  return out;
}

// A little three-pointed crown with a band.
export function crown(x, y, w, c, jewel) {
  const h = w * 0.55;
  return [
    T([[x - w / 2, y], [x - w / 2, y - h], [x - w / 4, y - h * 0.5], [x, y - h * 1.15], [x + w / 4, y - h * 0.5], [x + w / 2, y - h], [x + w / 2, y]], c),
    F(P(x - 0.5, y - h * 0.45, jewel)),
  ];
}

// A tendril curling out from (x, y) toward `sd` and up, swaying with `sway`.
export function tendril(x, y, len, sd, sway, c) {
  const pts = [];
  const back = [];
  for (let i = 0; i <= 6; i++) {
    const u = i / 6;
    const a = u * 2.6;
    const px = x + sd * (Math.sin(a) * len * 0.45 + u * len * 0.3) + Math.sin(u * 3 + sway) * u * 1.2;
    const py = y - u * len * 0.8 + (1 - Math.cos(a)) * len * 0.12;
    const w = 1.1 * (1 - u) + 0.2;
    pts.push([px - w, py]);
    back.unshift([px + w, py]);
  }
  return T([...pts, ...back], c);
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
