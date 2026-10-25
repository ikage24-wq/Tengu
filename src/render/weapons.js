// Comically oversized weapons. Every type has its own silhouette per tier (a training sword grows
// into a cleaver, a rune blade, a crystal blade, a flame blade, a holy blade, and finally a
// lightning blade), and the fanciest designs animate over 4 frames: flickering flames, crackling
// lightning, pulsing runes, swirling orbs, sparkling crystals.
//
// Weapons point straight up with the grip near the bottom; the hero rotates them around the grip.

import { R, E, P, shade } from './pixel.js';

const GOLD = '#ffd66b';
const GOLD_D = '#d9a440';
const WOOD = '#a0703f';
const WOOD_D = '#7a5238';
const STEEL = '#dfe6f5';
const WHITE = '#ffffff';
const FIRE = ['#ff4b2b', '#ff8a2b', '#ffd23b'];
const ZAP = '#5ff3ff';

export const FRAMES = 4;

// ---------- Small builders ----------

// Rows of width going from w1 (at y1) to w2 (at y2), centered on cx.
function taper(cx, y1, y2, w1, w2, c) {
  const out = [];
  const n = Math.max(1, y2 - y1);
  for (let i = 0; i <= y2 - y1; i++) {
    const w = Math.max(1, Math.round(w1 + ((w2 - w1) * i) / n));
    out.push(R(cx - Math.floor(w / 2), y1 + i, w, 1, c));
  }
  return out;
}

const diamond = (cx, y, h, w, c) => [...taper(cx, y, y + Math.round(h * 0.6), 1, w, c), ...taper(cx, y + Math.round(h * 0.6), y + h, w, 1, c)];

function flames(cx, y1, y2, spread, f, n = 6) {
  const out = [];
  for (let k = 0; k < n; k++) {
    const side = k % 2 ? -1 : 1;
    const jig = ((k + f) % 3) - 1;
    const y = y2 - ((y2 - y1) * k) / (n - 1);
    out.push(E(cx + side * spread * (0.4 + ((k + f) % 2) * 0.3) + jig, y, 2.5 + (k % 2), 3.5, FIRE[(k + f) % 3]));
  }
  out.push(E(cx, y2 - 2, spread * 0.5, 3, '#fff3a6'));
  // Embers drifting up.
  out.push(P(cx + ((f * 3) % 7) - 3, y1 - 2 - f, FIRE[2]), P(cx - ((f * 5) % 5) + 2, y1 - 5 - ((f + 2) % 4), FIRE[1]));
  return out;
}

// Gem with a shine; `eye` adds a pupil that blinks on frame 3.
function gem(cx, cy, r, c, f, eye = false) {
  const out = [E(cx, cy, r + 1, r + 1, GOLD), E(cx, cy, r, r, c), P(cx - Math.ceil(r / 2), cy - Math.ceil(r / 2), WHITE)];
  if (eye) out.push(f === 3 ? R(cx - r + 1, cy, r * 2 - 1, 1, '#3a2d4f') : E(cx, cy, 1, 1.5, '#3a2d4f'));
  return out;
}

// ---------- Swords and daggers (blade, guard, grip, pommel) ----------

function blade(style, cx, top, base, bw, c, f) {
  const half = Math.floor(bw / 2);
  const tipH = half + 1;
  const len = base - top;
  const light = shade(c, 25);
  const dark = shade(c, -20);
  const plain = (col, hi, lo) => [
    ...taper(cx, top, top + tipH, 1, bw, col),
    R(cx - half, top + tipH, bw, len - tipH, col),
    R(cx, top + tipH - 1, 1, len - tipH, hi),
    R(cx + bw - half - 1, top + tipH, 1, len - tipH, lo),
  ];
  switch (style) {
    case 'wood': return [E(cx + 0.5, top + half + 0.5, half + 0.5, half + 0.5, c), R(cx - half, top + half, bw, len - half, c), R(cx, top + 2, 1, len - 3, light), R(cx - half, base - 4, bw, 1, dark)];
    case 'cleaver': return [
      ...taper(cx, top, top + 3, bw - 4, bw, c), R(cx - half, top + 3, bw, len - 3, c),
      R(cx - half, top + 3, 2, len - 3, light), R(cx + half - 1, top + 2, 2, len - 2, dark),
      R(cx + half - 2, top + Math.round(len * 0.3), 3, 3, 'none'), E(cx, top + Math.round(len * 0.6), 1.5, 1.5, 'none'),
      R(cx - half, base - 3, bw, 2, GOLD_D),
    ];
    case 'rune': {
      const glow = ['#8fe3ff', '#c9f2ff', WHITE, '#c9f2ff'][f];
      const out = [...plain('#4b4675', '#6d6799', '#3a3560'), R(cx - half, top + tipH, 1, len - tipH, STEEL), R(cx + bw - half - 1, top + tipH, 1, len - tipH, STEEL), ...taper(cx, top, top + tipH, 1, 1, STEEL)];
      for (let y = top + tipH + 2; y < base - 3; y += 5) out.push(R(cx - 1, y, 3, 1, glow), P(cx, y + 1, glow), P(cx - 1 + ((y + f) % 3), y + 2, glow));
      return out;
    }
    case 'crystal': {
      const out = [...plain('#2b3a6b', '#3f5aa8', '#1f2a52'), R(cx - 1, top + tipH + 1, 3, len - tipH - 9, '#3f7bff')];
      for (let y = top + tipH + 2; y < base - 10; y += 4) out.push(P(cx, y, (y + f * 2) % 8 < 4 ? ZAP : '#c9f2ff'));
      const cl = ['#8fd3ff', '#5aa8ff', '#c9f2ff'];
      [[-3, -4], [3, -4], [0, -6], [-4, -1], [4, -1], [0, -2]].forEach(([dx, dy], i) => out.push(E(cx + dx, base + dy, 2.5, 3.5, cl[i % 3])));
      out.push(P(cx - 3 + (f % 2) * 6, base - 6 + (f >> 1), WHITE), P(cx + 1, base - 3, WHITE));
      return out;
    }
    case 'flame': return [...plain(STEEL, WHITE, '#b8c2d6'), ...flames(cx, top + Math.round(len * 0.45), base - 1, bw * 0.9, f, 7)];
    case 'holy': return [
      ...taper(cx, top - 2, top + tipH, 1, bw + 2, GOLD), R(cx - half - 1, top + tipH, bw + 2, len - tipH, GOLD),
      ...taper(cx, top, top + tipH, 1, bw - 1, WHITE), R(cx - half, top + tipH, bw - 1, len - tipH, WHITE),
      R(cx - 1, top + tipH + 2, 1, len - tipH - 4, '#fff3a6'), P(cx, top - 3, '#ffb3c6'), P(cx, top - 5 - (f % 2), '#ff9ec0'),
    ];
    case 'lightning': {
      const out = [...plain(WHITE, WHITE, '#c9f2ff'), R(cx - 1, top + 3, 2, len - 4, '#4b5a8f')];
      for (let y = top + tipH + 1, k = 0; y < base - 2; y += 4, k++) {
        const sl = 2 + ((k + f) % 3);
        const sr = 2 + ((k + f + 1) % 3);
        out.push(R(cx - half - sl, y, sl + 1, 2, ZAP), P(cx - half - sl - 1, y - 1, WHITE));
        out.push(R(cx + bw - half - 1, y + 2, sr + 1, 2, ZAP), P(cx + bw - half + sr, y + 1, WHITE));
      }
      out.push(P(cx - half - 4 + f * 2, top + 2 + f * 3, ZAP), P(cx + half + 3 - f, top + 8 + f * 2, WHITE));
      return out;
    }
    case 'curved': return [
      ...taper(cx + 2, top, top + 6, 1, bw - 1, c), R(cx - half + 1, top + 6, bw - 1, len - 6, c), R(cx - half, top + Math.round(len / 2), bw, Math.round(len / 2), c),
      R(cx - half + 1, top + 6, 1, len - 7, light),
    ];
    case 'heart': return [...plain('#ffc2d6', WHITE, '#ff9ec0'), E(cx - 1.5, top + len * 0.55, 2, 2, '#ff6b8a'), E(cx + 1.5, top + len * 0.55, 2, 2, '#ff6b8a'), ...taper(cx, top + len * 0.55 + 1, top + len * 0.55 + 4, 6, 1, '#ff6b8a')];
    case 'candy': {
      const out = [R(cx - half, top + 6, bw, len - 6, WHITE), R(cx - half, top + 2, bw, 4, WHITE), R(cx + half - bw - 3, top, bw + 4, bw, WHITE), R(cx - half - bw - 2, top + 2, bw, 8, WHITE)];
      for (let y = top + 4; y < base; y += 5) out.push(R(cx - half, y + (f % 2), bw, 2, '#ff6b8a'));
      out.push(R(cx - half - bw - 2, top + 6, bw, 2, '#ff6b8a'), R(cx - half - 1, top, 3, bw, '#ff6b8a'));
      return out;
    }
    default: return plain(c, light, dark);
  }
}

function guard(style, cx, y, c, f) {
  switch (style) {
    case 'curve': return [R(cx - 6, y, 13, 2, GOLD), R(cx - 7, y - 2, 2, 3, GOLD), R(cx + 6, y - 2, 2, 3, GOLD)];
    case 'wings': return [
      R(cx - 8, y, 17, 2, GOLD), ...taper(cx - 9, y - 6, y, 1, 3, GOLD), ...taper(cx + 9, y - 6, y, 1, 3, GOLD),
      R(cx - 12, y - 4, 3, 2, shade(c, -10)), R(cx + 10, y - 4, 3, 2, shade(c, -10)), E(cx + 0.5, y + 1, 2, 2, c),
    ];
    case 'eye': return [
      R(cx - 9, y, 19, 2, GOLD_D), R(cx - 11, y - 3, 3, 3, GOLD_D), R(cx + 9, y - 3, 3, 3, GOLD_D),
      ...gem(cx + 0.5, y + 1, 3, '#ff6b8a', f, true),
    ];
    case 'antler': return [
      R(cx - 5, y, 11, 3, '#5a4632'), R(cx - 10, y - 2, 5, 2, '#7a6248'), R(cx + 6, y - 2, 5, 2, '#7a6248'),
      R(cx - 11, y - 6, 2, 4, '#7a6248'), R(cx + 10, y - 6, 2, 4, '#7a6248'), R(cx - 13, y - 4, 2, 2, '#7a6248'), R(cx + 12, y - 4, 2, 2, '#7a6248'),
    ];
    case 'heart': return [R(cx - 5, y, 11, 2, '#ff6b8a'), E(cx - 1.5, y + 2, 2.5, 2.5, '#ff6b8a'), E(cx + 2.5, y + 2, 2.5, 2.5, '#ff6b8a')];
    case 'small': return [R(cx - 3, y, 7, 2, GOLD)];
    default: return [R(cx - 5, y, 11, 2, GOLD), P(cx - 5, y - 1, GOLD), P(cx + 5, y - 1, GOLD)];
  }
}

const SWORDS = [
  { len: 22, bw: 7, blade: 'wood', guard: 'bar' },
  { len: 26, bw: 7, blade: 'plain', guard: 'bar' },
  { len: 30, bw: 9, blade: 'plain', guard: 'curve' },
  { len: 34, bw: 12, blade: 'cleaver', guard: 'bar' },
  { len: 36, bw: 10, blade: 'rune', guard: 'wings' },
  { len: 38, bw: 12, blade: 'crystal', guard: 'antler' },
  { len: 40, bw: 11, blade: 'flame', guard: 'curve' },
  { len: 42, bw: 11, blade: 'holy', guard: 'eye' },
  { len: 46, bw: 11, blade: 'lightning', guard: 'wings' },
];

const DAGGERS = [
  { len: 13, bw: 6, blade: 'plain', guard: 'small' },
  { len: 15, bw: 7, blade: 'curved', guard: 'small' },
  { len: 17, bw: 7, blade: 'plain', guard: 'bar' },
  { len: 18, bw: 9, blade: 'cleaver', guard: 'small' },
  { len: 20, bw: 8, blade: 'rune', guard: 'curve' },
  { len: 21, bw: 9, blade: 'crystal', guard: 'small' },
  { len: 22, bw: 8, blade: 'flame', guard: 'bar' },
  { len: 23, bw: 8, blade: 'holy', guard: 'eye' },
  { len: 25, bw: 9, blade: 'lightning', guard: 'curve' },
];

function bladed(spec, c, f) {
  const W = 30;
  const cx = 15;
  const top = 7;
  const base = top + spec.len;
  const gripY = base + 2;
  const gripLen = spec.len > 20 ? 8 : 6;
  const shapes = [
    ...blade(spec.blade, cx, top, base, spec.bw, c, f),
    R(cx - 1, gripY, 3, gripLen, WOOD_D), ...Array.from({ length: gripLen >> 1 }, (_, i) => R(cx - 1, gripY + i * 2, 3, 1, WOOD)),
    ...guard(spec.guard, cx, base, c, f),
    E(cx + 0.5, gripY + gripLen + 1.5, 2, 2, GOLD),
  ];
  return { w: W, h: gripY + gripLen + 4, grip: [cx, gripY + Math.floor(gripLen / 2)], shapes };
}

// ---------- Hafted weapons: axes, spears, wands, staves ----------

function axeHead(style, cx, y, s, c, f) {
  const light = shade(c, 25);
  const wedge = (dir) => [R(dir > 0 ? cx : cx - s, y - Math.round(s * 0.45), s, Math.round(s * 0.9), c), E(cx + dir * s * 1.05, y, s * 0.75, s * 1.15, c), E(cx + dir * s * 1.55, y, s * 0.3, s * 1.0, light)];
  switch (style) {
    case 'double': return [...wedge(1), ...wedge(-1)];
    case 'crescent': return [E(cx + s, y, s * 1.2, s * 1.5, c), E(cx + s * 1.9, y, s * 0.35, s * 1.3, light), E(cx + s * 0.1, y, s * 0.8, s * 1.1, 'none'), R(cx - 4, y - s - 3, 3, 4, c)];
    case 'bearded': return [...wedge(1), E(cx + s * 0.8, y + s * 0.9, s * 0.6, s * 0.8, c), ...taper(cx, y - s - 5, y - s, 1, 3, STEEL), R(cx - 4, y - 1, 3, 3, c)];
    case 'crystal': return [...diamond(cx + s, y - s, s * 2, s + 2, '#8fd3ff'), ...diamond(cx - s, y - s + 2, s * 2 - 2, s, '#5aa8ff'), ...diamond(cx, y - s - 5, s + 2, 4, '#c9f2ff'), P(cx + s - 1, y - s + 3 + f, WHITE)];
    case 'flame': return [...wedge(1), ...wedge(-1), ...flames(cx, y - s - 4, y + s * 0.6, s * 1.8, f, 6)];
    case 'heart': return [E(cx + s * 0.9, y - s * 0.4, s * 0.6, s * 0.6, c), E(cx + s * 0.9, y + s * 0.4, s * 0.6, s * 0.6, c), ...taper(cx + Math.round(s * 1.5), y - s, y + s, 1, 1, c), E(cx + s * 1.2, y, s * 0.7, s * 0.9, c), E(cx - s * 0.9, y - s * 0.4, s * 0.6, s * 0.6, c), E(cx - s * 0.9, y + s * 0.4, s * 0.6, s * 0.6, c), E(cx - s * 1.2, y, s * 0.7, s * 0.9, c), ...gem(cx + 0.5, y, 2, '#ff6b8a', f)];
    case 'star': return [E(cx + s, y, s * 1.2, s * 1.5, c), E(cx + s * 0.1, y, s * 0.8, s * 1.1, 'none'), E(cx - s, y, s * 1.2, s * 1.5, c), E(cx - s * 0.1, y, s * 0.8, s * 1.1, 'none'), ...star(cx, y - s - 3, 4, GOLD, f)];
    default: return wedge(1);
  }
}

function star(cx, cy, s, c, f) {
  const k = f % 2;
  return [R(cx - 1, cy - s - k, 3, s * 2 + 1 + k * 2, c), R(cx - s - k, cy - 1, s * 2 + 1 + k * 2, 3, c), E(cx + 0.5, cy + 0.5, s * 0.55, s * 0.55, c), P(cx, cy, WHITE)];
}

function orbHead(style, cx, cy, s, c, f) {
  const light = shade(c, 30);
  switch (style) {
    case 'knot': return [E(cx + 0.5, cy, s * 0.8, s, WOOD), E(cx - 1, cy - 2, s * 0.4, s * 0.4, '#c99a6b'), E(cx + 0.5, cy - 1, 2, 2, c)];
    case 'orb': {
      const sw = [[-1, -1], [1, -1], [1, 1], [-1, 1]][f];
      return [E(cx + 0.5, cy, s, s, c), E(cx + 0.5, cy, s * 0.6, s * 0.6, light), P(cx + sw[0] * 2, cy + sw[1] * 2, WHITE), P(cx - Math.round(s / 2), cy - Math.round(s / 2), WHITE)];
    }
    case 'ring': return [E(cx + 0.5, cy, s + 1, s + 1, GOLD), E(cx + 0.5, cy, s - 1, s - 1, 'none'), ...orbHead('orb', cx, cy, s * 0.55, c, f)];
    case 'star': return [...star(cx, cy, s, c, f), ...star(cx, cy, Math.max(2, s - 3), light, f)];
    case 'heart': return [E(cx - s * 0.45, cy - s * 0.25, s * 0.6, s * 0.6, c), E(cx + 1 + s * 0.45, cy - s * 0.25, s * 0.6, s * 0.6, c), ...taper(cx, cy, cy + s, s * 2, 1, c), P(cx - Math.round(s * 0.5), cy - Math.round(s * 0.5), WHITE)];
    case 'crescent': return [E(cx + 0.5, cy, s + 1, s + 1, c), E(cx + 0.5 + s * 0.55, cy - s * 0.35, s * 0.85, s * 0.85, 'none'), ...star(cx + Math.round(s * 0.5), cy - Math.round(s * 0.2), 2, WHITE, f)];
    case 'crystal': return [...diamond(cx, cy - s, s * 2, s, '#8fd3ff'), ...diamond(cx - Math.round(s * 0.7), cy - s * 0.3, s, s * 0.6, '#5aa8ff'), ...diamond(cx + Math.round(s * 0.7), cy - s * 0.3, s, s * 0.6, '#c9f2ff'), P(cx, cy - s + 3 + f, WHITE)];
    case 'sun': {
      const out = [];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + (f * Math.PI) / 16;
        out.push(E(cx + 0.5 + Math.cos(a) * s * 1.2, cy + Math.sin(a) * s * 1.2, 1.5, 1.5, GOLD));
      }
      return [...out, E(cx + 0.5, cy, s * 0.85, s * 0.85, GOLD), E(cx + 0.5, cy, s * 0.6, s * 0.6, c), P(cx - 1, cy - 2, WHITE)];
    }
    case 'wings': return [...wingPair(cx, cy + 1, s, f), ...orbHead('orb', cx, cy - 1, s * 0.6, c, f)];
    case 'flower': return [E(cx - s * 0.6, cy - 1, s * 0.55, s * 0.4, '#7fd17a'), E(cx + 1 + s * 0.6, cy - 1, s * 0.55, s * 0.4, '#7fd17a'), ...[0, 1, 2, 3, 4].map((i) => E(cx + 0.5 + Math.cos(i * 1.257 + f * 0.1) * s * 0.55, cy - 3 + Math.sin(i * 1.257) * s * 0.55, s * 0.4, s * 0.4, c)), E(cx + 0.5, cy - 3, 1.5, 1.5, GOLD)];
    case 'eye': return [...wingPair(cx, cy + 2, s + 1, f), E(cx + 0.5, cy, s, s * 0.8, WHITE), E(cx + 0.5, cy, s * 0.5, s * 0.6, c), f === 3 ? R(cx - s + 1, cy, s * 2, 1, '#3a2d4f') : E(cx + 0.5, cy, 1, 1.5, '#3a2d4f'), ...star(cx, cy - s - 4, 2, GOLD, f)];
    case 'lollipop': return [E(cx + 0.5, cy, s + 1, s + 1, '#ff9ec0'), E(cx + 0.5, cy, s - 1, s - 1, WHITE), E(cx + 0.5, cy, s - 3, s - 3, '#ff9ec0'), E(cx + 0.5, cy, s - 5, s - 5, WHITE), P(cx - 3 + f, cy - s + 1, WHITE), R(cx - s, cy + s - 2, 4, 3, '#8fd3ff'), R(cx + s - 3, cy + s - 2, 4, 3, '#8fd3ff')];
    case 'moon': return [E(cx + 0.5, cy, s + 2, s + 2, '#fff3a6'), E(cx + 3 + s * 0.5, cy - 2, s, s, 'none'), ...star(cx + 4, cy + 2, 2 + (f % 2), WHITE, 0), P(cx + s, cy - s - 2 + (f % 2), WHITE), E(cx - s, cy + s, 1.5, 1.5, '#c9a6ff')];
    default: return [E(cx + 0.5, cy, s, s, c)];
  }
}

function wingPair(cx, cy, s, f) {
  const up = f % 2 ? -1 : 0;
  const one = (dir) => [
    E(cx + dir * (s + 2), cy - 1 + up, s * 0.9, s * 0.55, WHITE),
    R(cx + (dir > 0 ? s + 2 : -s * 2 - 2), cy + 1 + up, s, 2, '#e6ebff'),
    R(cx + (dir > 0 ? s + 1 : -s * 2), cy + 3 + up, s - 2, 2, '#e6ebff'),
  ];
  return [...one(1), ...one(-1)];
}

function spearHead(style, cx, top, s, c, f) {
  const leaf = (col) => [...taper(cx, top, top + s * 2, 1, s, col), ...taper(cx, top + s * 2, top + s * 3, s, 2, col), R(cx, top + 2, 1, s * 2, shade(col, 25))];
  const base = top + s * 3;
  switch (style) {
    case 'long': return [...taper(cx, top, top + s * 3, 1, s, c), ...taper(cx, top + s * 3, top + s * 4, s, 2, c), R(cx, top + 2, 1, s * 3, shade(c, 25))];
    case 'cross': return [...leaf(c), R(cx - s - 2, base - 2, s * 2 + 5, 2, GOLD), ...taper(cx - s - 2, base - 6, base - 2, 1, 2, c), ...taper(cx + s + 2, base - 6, base - 2, 1, 2, c)];
    case 'halberd': return [...leaf(STEEL), E(cx + s + 2, base, s, s * 1.3, c), E(cx + s * 2 + 1, base, s * 0.3, s * 1.1, shade(c, 25)), ...taper(cx - s, base - 2, base + 2, 1, 3, c)];
    case 'trident': return [...leaf(c), R(cx - s - 2, base + 1, s * 2 + 5, 2, c), ...taper(cx - s - 1, base - s * 2, base + 1, 1, 3, c), ...taper(cx + s + 1, base - s * 2, base + 1, 1, 3, c)];
    case 'crystal': return [...diamond(cx, top, s * 3 + 2, s + 2, '#8fd3ff'), ...diamond(cx - s, top + s * 2, s * 1.5, s * 0.8, '#5aa8ff'), ...diamond(cx + s, top + s * 2, s * 1.5, s * 0.8, '#c9f2ff'), P(cx, top + 4 + f * 2, WHITE)];
    case 'flame': return [...leaf(STEEL), ...flames(cx, top + s, base + 4, s * 1.6, f, 6)];
    case 'swirl': return [...leaf('#9be08f'), E(cx + 0.5, base + 3, s + 1, s + 1, '#5fb85a'), E(cx + 0.5, base + 3, s - 1, s - 1, 'none'), E(cx + 0.5, base + 3 - ((f % 2) * 2 - 1), 1.5, 1.5, '#d8ff8a')];
    case 'celestial': return [
      E(cx + 0.5, base, s * 2.2, s * 1.5, c), E(cx + 0.5, base + s * 0.6, s * 1.7, s * 1.4, 'none'),
      ...taper(cx, top - 2, top + s * 3, 1, s, WHITE), R(cx, top + 2, 1, s * 3 - 2, '#c9f2ff'), ...gem(cx + 0.5, base + 1, 2, '#8fe3ff', f),
      P(cx - s * 2 + f, base - 3, WHITE), P(cx + s * 2 - f, base - 3, WHITE),
    ];
    default: return leaf(c);
  }
}

// Shaft of `len` ending at the bottom of a `h`-tall sprite, with a cap.
function shaft(cx, y1, y2, c, cap = GOLD) {
  return [R(cx - 1, y1, 2, y2 - y1, c), R(cx - 1, y1, 2, 1, shade(c, 20)), E(cx, y2, 1.8, 1.8, cap)];
}

function ribbon(cx, y, f, c = '#ff9ec0') {
  const sw = f % 2 ? 1 : 0;
  return [R(cx + 1, y, 2, 2, c), R(cx + 2 + sw, y + 2, 2, 4, c), R(cx + 1 + sw * 2, y + 6, 2, 3, c)];
}

const AXES = [['wedge', 6, 22], ['wedge', 7, 24], ['double', 7, 26], ['crescent', 8, 28], ['bearded', 8, 30], ['crystal', 8, 32], ['flame', 8, 34], ['heart', 9, 36], ['star', 10, 38]];
const SPEARS = [['leaf', 4, 38], ['long', 4, 42], ['cross', 5, 44], ['halberd', 5, 46], ['trident', 5, 48], ['crystal', 6, 50], ['flame', 6, 52], ['swirl', 6, 54], ['celestial', 6, 58]];
const WANDS = [['knot', 5, 16], ['orb', 6, 17], ['star', 7, 18], ['heart', 8, 18], ['crescent', 8, 19], ['crystal', 8, 20], ['sun', 8, 20], ['wings', 9, 21], ['eye', 9, 22]];
const STAVES = [['knot', 6, 32], ['ring', 7, 34], ['orb', 8, 36], ['crescent', 9, 38], ['crystal', 9, 40], ['wings', 9, 42], ['flower', 10, 44], ['sun', 10, 46], ['eye', 11, 48]];

function hafted(kind, spec, c, f, tier) {
  const [style, s, len] = spec;
  const W = 64;
  const cx = 32;
  const headH = kind === 'spear' ? s * 4 + 6 : s * 2 + 10;
  const top = 8;
  const shaftTop = kind === 'spear' ? top + s * 3 - 1 : top + headH - 4;
  const h = shaftTop + len + 4;
  const shapes = [];
  const sc = tier >= 7 ? '#f3edff' : tier >= 4 ? '#5d5285' : WOOD;
  if (kind === 'axe') shapes.push(...axeHead(style, cx, top + s + 4, s, c, f));
  if (kind === 'spear') shapes.push(...spearHead(style, cx, top, s, c, f));
  if (kind === 'wand' || kind === 'staff') shapes.push(...orbHead(style, cx, top + s + 3, s, c, f));
  shapes.push(...shaft(cx, shaftTop, shaftTop + len, sc));
  if (tier >= 2 && kind !== 'axe') shapes.push(R(cx - 3, shaftTop + 1, 6, 2, GOLD));
  if (tier >= 3 && kind === 'spear') shapes.push(...ribbon(cx, shaftTop + 3, f));
  // Grip wraps.
  const gy = shaftTop + Math.round(len * (kind === 'wand' ? 0.65 : 0.72));
  shapes.push(R(cx - 1, gy - 2, 2, 5, '#c25b78'));
  return { w: W, h, grip: [cx, gy], shapes };
}

// ---------- Bows, crossbows, claws ----------

function bow(tier, c, f, crystal = false) {
  const h = 30 + tier * 3;
  const W = 34;
  const top = 6;
  const bx = 18;
  const bend = 7 + tier * 0.5;
  const shapes = [];
  const col = crystal ? '#8fe3ff' : c;
  for (let i = 0; i <= h; i++) {
    const t = i / h;
    const x = Math.round(bx - bend * Math.sin(Math.PI * t));
    const thick = t > 0.4 && t < 0.6 ? 4 : t < 0.1 || t > 0.9 ? 2 : 3;
    shapes.push(R(x, top + i, thick, 1, i % 6 === 0 && tier >= 4 ? shade(col, 25) : col));
  }
  // Recurve tips and ornaments.
  shapes.push(R(bx + 1, top - 1, 2, 2, col), R(bx + 1, top + h, 2, 2, col));
  if (tier >= 2) shapes.push(R(bx + 2, top - 3, 2, 3, GOLD), R(bx + 2, top + h + 1, 2, 3, GOLD));
  const mid = top + Math.round(h / 2);
  const gx = Math.round(bx - bend);
  if (tier >= 4 || crystal) {
    // Feather wings near the tips.
    const fc = crystal ? '#c9f2ff' : tier >= 7 ? WHITE : '#9be8ff';
    const up = f % 2;
    for (const [y, dir] of [[top + 6, -1], [top + h - 6, 1]]) {
      shapes.push(R(gx - 4, y - up * dir, 5, 2, fc), R(gx - 7, y + 2 * dir - up * dir, 6, 2, fc), R(gx - 9, y + 4 * dir - up * dir, 6, 2, fc));
    }
  }
  if (tier >= 6 || crystal) shapes.push(...gem(gx + 2, mid, 3, crystal ? '#8fe3ff' : tier >= 8 ? '#c9a6ff' : '#ff9ec0', f));
  shapes.push(R(gx + 1, mid - 3, 3, 6, WOOD_D));
  // String.
  shapes.push(R(bx + 3, top + 1, 1, h - 1, '#fff6fb'));
  return { w: W, h: top + h + 6, grip: [gx + 2, mid], shapes };
}

function crossbow(tier, c, f) {
  const len = 22 + tier * 2;
  const lim = 18 + tier * 2;
  const W = Math.round(len) + 8;
  const H = Math.round(lim) + 8;
  const cy = Math.round(H / 2);
  const front = Math.round(len) + 2;
  const shapes = [
    R(2, cy - 1, Math.round(len), 3, WOOD), R(2, cy + 2, 4, 4, WOOD_D),
    R(front - 2, 3, 3, Math.round(lim), c), R(front - 1, 4, 1, Math.round(lim) - 2, shade(c, 25)),
    R(front - 6, 3, 1, Math.round(lim), '#fff6fb'),
  ];
  if (tier >= 4) shapes.push(...gem(8, cy, 2, tier >= 7 ? '#ff9ec0' : '#8fe3ff', f));
  if (tier >= 6) shapes.push(...flames(front, 4, Math.round(lim), 3, f, 4).slice(0, 4));
  return { w: W, h: H, grip: [4, cy + 3], shapes };
}

function claw(tier, c, f, paw = false) {
  const bl = 10 + tier * 1.6;
  const W = 30;
  const H = Math.round(bl) + 18;
  const shapes = [];
  if (paw) {
    shapes.push(E(15, H - 9, 10, 8, '#ffc2d6'), E(15, H - 7, 5, 4, '#ff9ec0'), E(6, H - 18, 3, 3, '#ff9ec0'), E(15, H - 21, 3, 3, '#ff9ec0'), E(24, H - 18, 3, 3, '#ff9ec0'));
    shapes.push(...[6, 15, 24].map((x) => R(x, H - 26 - (f % 2), 1, 3, WHITE)));
    return { w: W, h: H, grip: [15, H - 7], shapes };
  }
  const col = tier >= 5 ? shade(c, 10) : STEEL;
  // Three talons that sweep forward as they rise.
  [8, 15, 22].forEach((x0, i) => {
    const len = Math.round(bl) - (i === 1 ? 0 : 3);
    for (let k = 0; k < len; k++) {
      const t = k / len;
      const w = Math.max(1, Math.round(4 * (1 - t)));
      const x = Math.round(x0 + Math.pow(t, 2) * 6) - Math.floor(w / 2);
      shapes.push(R(x, H - 13 - k, w, 1, k === len - 1 ? WHITE : col));
    }
    if (tier >= 6) shapes.push(P(x0 + 1 + ((f + i) % 3), H - 15 - ((f * 3 + i * 5) % len), WHITE));
  });
  shapes.push(R(3, H - 14, 24, 8, c), R(3, H - 14, 24, 2, shade(c, 25)), R(6, H - 6, 18, 5, WOOD_D), R(6, H - 4, 18, 1, WOOD));
  if (tier >= 3) shapes.push(...gem(15, H - 10, 2.5, tier >= 7 ? '#ff9ec0' : '#8fe3ff', f));
  return { w: W, h: H, grip: [15, H - 4], shapes };
}

// ---------- Public ----------

const ANIMATED_SWORD = new Set(['rune', 'crystal', 'flame', 'holy', 'lightning', 'candy']);

export function weaponShapes(type, color, tier = 0, special = null, frame = 0) {
  const f = frame % FRAMES;
  const t = Math.max(0, Math.min(8, tier));
  switch (special ?? type) {
    case 'lollipop': return hafted('wand', ['lollipop', 8, 18], color, f, 3);
    case 'moonstaff': return hafted('staff', ['moon', 9, 40], color, f, 7);
    case 'candycane': return bladed({ len: 34, bw: 6, blade: 'candy', guard: 'heart' }, color, f);
    case 'heartdagger': return bladed({ len: 20, bw: 7, blade: 'heart', guard: 'heart' }, color, f);
    case 'crystalbow': return bow(6, color, f, true);
    case 'pawclaw': return claw(4, color, f, true);
    case 'sword': return bladed(SWORDS[t], color, f);
    case 'dagger': return bladed(DAGGERS[t], color, f);
    case 'axe': return hafted('axe', AXES[t], color, f, t);
    case 'spear': return hafted('spear', SPEARS[t], color, f, t);
    case 'wand': return hafted('wand', WANDS[t], color, f, t);
    case 'staff': return hafted('staff', STAVES[t], color, f, t);
    case 'bow': return bow(t, color, f);
    case 'crossbow': return crossbow(t, color, f);
    case 'claw': return claw(t, color, f);
    default: return null;
  }
}

// Whether a weapon's own design moves (so the renderer knows to cycle frames).
export function weaponAnimated(type, tier = 0, special = null) {
  if (special) return true;
  const t = Math.max(0, Math.min(8, tier));
  if (type === 'sword' || type === 'dagger') return ANIMATED_SWORD.has((type === 'sword' ? SWORDS : DAGGERS)[t].blade);
  return t >= 4;
}
