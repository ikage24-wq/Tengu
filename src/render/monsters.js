// Monster art, in the same outlined chibi style as the heroes. Every design faces right, has two
// animation frames (feet, wings, flames, or tails), and a face that shows how it feels:
//   idle   big round eyes and a small smile (with blinks and happy squints)
//   angry  fierce brows and a fang grin while it chases you (or a boss winds up)
//   hurt   squeezed >< eyes and an "o" mouth for a moment after each hit
//   dead   x eyes as it poofs away
// Little emote bubbles (!, anger marks, sweat, music notes, z's) float over their heads.

import { R, E, T, F, sprite, blit, shade } from './pixel.js';

const INK = '#3a2d4f';
const BLUSH = '#ff9fb8';
const MOUTH = '#b2506c';

// ---------- Shape helpers ----------

function arc(cx, cy, rx, ry, a0, a1, th, c) {
  const outer = [];
  const inner = [];
  for (let i = 0; i <= 6; i++) {
    const a = ((a0 + ((a1 - a0) * i) / 6) * Math.PI) / 180;
    outer.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    inner.push([cx + (rx - th) * Math.cos(a), cy + (ry - th) * Math.sin(a)]);
  }
  return F(T([...outer, ...inner.reverse()], c));
}

// A polyline drawn as thin quads.
function stroke(pts, th, c, flat = true) {
  const quad = (a, b) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = (-(b[1] - a[1]) / len) * th * 0.5;
    const ny = ((b[0] - a[0]) / len) * th * 0.5;
    const t = T([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], c);
    return flat ? F(t) : t;
  };
  const out = [];
  for (let i = 1; i < pts.length; i++) out.push(quad(pts[i - 1], pts[i]));
  return out;
}

// The face. (cx, cy) is between the eyes; k scales everything.
function face(cx, cy, k, mood, { gap = 3.4, eye = INK, ink = INK, mouth = true, blush = true } = {}) {
  const out = [];
  const g = gap * k;
  for (const s of [-1, 1]) {
    const ex = cx + s * g * 0.5;
    switch (mood) {
      case 'blink':
        out.push(arc(ex, cy - 0.2 * k, 1 * k, 0.8 * k, 20, 160, 0.5 * k, ink));
        break;
      case 'happy':
        out.push(arc(ex, cy + 0.6 * k, 1 * k, 0.9 * k, 200, 340, 0.5 * k, ink));
        break;
      case 'hurt':
        out.push(...stroke([[ex - s * 0.9 * k, cy - 0.9 * k], [ex + s * 0.7 * k, cy], [ex - s * 0.9 * k, cy + 0.9 * k]], 0.55 * k, ink));
        break;
      case 'dead':
        out.push(...stroke([[ex - 0.8 * k, cy - 0.8 * k], [ex + 0.8 * k, cy + 0.8 * k]], 0.5 * k, ink), ...stroke([[ex - 0.8 * k, cy + 0.8 * k], [ex + 0.8 * k, cy - 0.8 * k]], 0.5 * k, ink));
        break;
      default: {
        const ry = mood === 'angry' ? 1 : 1.3;
        out.push(F(E(ex, cy, 0.95 * k, ry * k, eye)), F(E(ex - 0.3 * k, cy - 0.45 * k, 0.4 * k, 0.4 * k, '#ffffff')));
        if (mood === 'angry') {
          // Fierce brows slanting down toward the middle.
          out.push(...stroke([[ex + s * 1.4 * k, cy - 2.2 * k], [ex - s * 1.1 * k, cy - 1.2 * k]], 0.6 * k, ink));
        }
      }
    }
    if (blush && mood !== 'dead') out.push(F(E(ex + s * 1.2 * k, cy + 1.6 * k, 0.9 * k, 0.45 * k, BLUSH)));
  }
  if (!mouth) return out;
  const my = cy + 1.6 * k;
  switch (mood) {
    case 'angry':
      out.push(F(T([[cx - 1.2 * k, my - 0.2 * k], [cx + 1.2 * k, my - 0.2 * k], [cx + 0.6 * k, my + 1 * k], [cx - 0.6 * k, my + 1 * k]], MOUTH)), F(T([[cx + 0.1 * k, my - 0.2 * k], [cx + 0.9 * k, my - 0.2 * k], [cx + 0.5 * k, my + 0.7 * k]], '#ffffff')));
      break;
    case 'hurt':
      out.push(F(E(cx, my + 0.3 * k, 0.6 * k, 0.75 * k, MOUTH)));
      break;
    case 'dead':
      out.push(...stroke([[cx - 0.9 * k, my + 0.3 * k], [cx - 0.3 * k, my], [cx + 0.3 * k, my + 0.3 * k], [cx + 0.9 * k, my]], 0.4 * k, ink));
      break;
    case 'happy':
      out.push(F(T([[cx - 1 * k, my - 0.2 * k], [cx + 1 * k, my - 0.2 * k], [cx, my + 1 * k]], MOUTH)));
      break;
    default:
      out.push(arc(cx, my - 0.3 * k, 0.8 * k, 0.7 * k, 25, 155, 0.4 * k, ink));
  }
  return out;
}

// ---------- The roster, region by region ----------

const ART = {
  // Petal Meadow: a dandelion puff and a snail with a flower on its shell.
  puffle: (f, mood) => {
    const b = f ? 1 : 0;
    const out = [E(9, 22.4 - b, 2.6, 1.6, '#ffd6a5'), E(18, 22.4 - (1 - b), 2.6, 1.6, '#ffd6a5')];
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (0.95 + (i / 8) * 1.1);
      out.push(E(14 + Math.cos(a) * 10.6, 13.5 + b * 0.4 + Math.sin(a) * 8.4, 3.2, 3, '#fffaf0'));
    }
    out.push(E(14, 13.5 + b * 0.4, 11, 9, '#fffaf0'), F(E(10, 9, 3, 1.6, '#ffffff')),
      ...stroke([[14, 5], [14.6, 1.4]], 0.9, '#7fd17a', false), E(16.4, 1.6, 2, 1.1, '#9be08f'), E(12.4, 2.4, 1.8, 1, '#9be08f'),
      ...face(16, 14 + b * 0.4, 1.46, mood));
    return { w: 28, h: 24, shapes: out };
  },
  snailbun: (f, mood) => {
    const st = f ? 0.8 : 0;
    const out = [E(16 + st, 20.4, 13, 3.4, '#ffe9c4'), E(26 + st, 15, 4.6, 5.6, '#ffe9c4'),
      ...stroke([[25 + st, 10.6], [24 + st, 6]], 1, '#ffe9c4', false), ...stroke([[28 + st, 10.6], [29.6 + st, 6.4]], 1, '#ffe9c4', false),
      E(24 + st, 5.8, 1.2, 1.2, '#ff9ec0'), E(29.8 + st, 6.2, 1.2, 1.2, '#ff9ec0'),
      E(12, 12, 9, 8.6, '#ff9ec0'), arc(12.4, 12.4, 5.4, 5, 0, 300, 1.1, '#ffd0e0'), F(E(12.6, 12.6, 1.6, 1.6, '#ffd0e0'))];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      out.push(E(12 + Math.cos(a) * 1.8, 3.4 + Math.sin(a) * 1.8, 1.4, 1.4, '#ffffff'));
    }
    out.push(F(E(12, 3.4, 1, 1, '#ffe36b')), ...face(27 + st, 15.4, 1.21, mood, { gap: 3.2 }));
    return { w: 34, h: 24, shapes: out };
  },
  // Clover Hills: a radish sprout, a mushroom, and a piglet with a bow.
  sproutling: (f, mood) => {
    const s = f ? 1 : -1;
    const out = [...stroke([[9, 26], [7.6, 29]], 1, '#e8a0b8', false), ...stroke([[15, 26], [16.4, 29]], 1, '#e8a0b8', false),
      T([[12 + s * 0.4, 1], [9, 6], [12, 10]], '#7fd17a'), T([[12, 10], [4.6 + s, 3.6], [8, 9.4]], '#9be08f'), T([[12, 10], [19.4 + s, 3.4], [16, 9.4]], '#9be08f'),
      E(12, 18.6, 8.6, 9.2, '#ffd6e6'), E(12, 13.4, 7.6, 4, '#ff9ec0'), T([[9.6, 26], [14.4, 26], [12, 30]], '#ffd6e6'),
      E(3.8, 19 - s * 0.6, 1.8, 1.4, '#ffd6e6'), E(20.2, 19 + s * 0.6, 1.8, 1.4, '#ffd6e6'), ...face(13, 19, 1.4, mood)];
    return { w: 24, h: 30, shapes: out };
  },
  mushkin: (f, mood) => {
    const b = f ? 1 : 0;
    const out = [E(10, 30.4 - b, 3, 1.6, '#e8d0b0'), E(20, 30.4 - (1 - b), 3, 1.6, '#e8d0b0'),
      R(8.6, 15, 13, 14, '#fff1dc'), E(15, 28.6, 6.6, 2, '#fff1dc'), E(6.8, 22 + b * 0.6, 1.8, 1.6, '#fff1dc'), E(23.2, 22 - b * 0.6, 1.8, 1.6, '#fff1dc'),
      T([[1, 16 + b * 0.4], [3.4, 8], [15, 1.6 + b * 0.4], [26.6, 8], [29, 16 + b * 0.4]], '#ff7a7a'), R(2, 14.6 + b * 0.4, 26, 2.4, '#e8646a'),
      F(E(8, 8, 2.4, 1.8, '#ffffff')), F(E(17, 5, 2.6, 1.8, '#ffffff')), F(E(24, 10.4, 1.8, 1.4, '#ffffff')), F(E(13, 11, 1.4, 1, '#ffffff')),
      ...face(16.4, 21.4, 1.46, mood)];
    return { w: 30, h: 32, shapes: out };
  },
  piglet: (f, mood) => {
    const a = f ? 1 : 0;
    const out = [R(8, 20, 3.4, 5 - a, '#ff8fab'), R(13.4, 20, 3.4, 4 + a, '#ff8fab'), R(19, 20, 3.4, 5 - a, '#ff8fab'), R(24, 20, 3.4, 4 + a, '#ff8fab'),
      ...stroke([[4.6, 12], [2.4, 10.6], [3, 8.4], [4.6, 9.4]], 1, '#ff8fab', false),
      E(16, 14.6, 12, 8.4, '#ffc2d6'), E(25, 11.4, 7, 6.6, '#ffc2d6'), T([[20, 6.4], [21, 1.6], [24, 5]], '#ff8fab'), T([[26.6, 5], [29.4, 2], [29.6, 7]], '#ff8fab'),
      E(31, 13.4, 2.8, 2.2, '#ff8fab'), F(E(30.2, 13.4, 0.5, 0.7, INK)), F(E(31.8, 13.4, 0.5, 0.7, INK)),
      T([[16, 5], [13, 3], [13.4, 7.4]], '#ff6b9a'), T([[16, 5], [19, 3], [18.6, 7.4]], '#ff6b9a'), F(E(16, 5, 1, 1, '#ff4d85')),
      ...face(25.4, 10.4, 1.21, mood, { gap: 3.6, mouth: false })];
    if (mood === 'angry' || mood === 'hurt') out.push(F(E(28.6, 16.6, 0.7, 0.5, MOUTH)));
    return { w: 34, h: 26, shapes: out };
  },
  // Windy Canyon: a pebble with a headband and a little scorpion with a heart stinger.
  pebblet: (f, mood) => {
    const b = f ? 1 : 0;
    const out = [E(8, 22.6 - b, 3, 1.6, '#a8997f'), E(18, 22.6 - (1 - b), 3, 1.6, '#a8997f'),
      E(2.6, 15 + b, 2.6, 2.4, '#b8ad9a'), E(23.4, 15 - b, 2.6, 2.4, '#b8ad9a'),
      T([[3, 21], [1.6, 13], [5, 5], [13, 2.4], [21, 4.4], [24.6, 12], [23.4, 21]], '#cfc4b2'),
      F(T([[7, 17], [9, 15], [8.4, 18.6]], '#b8ad9a')), F(E(18, 18.6, 1.6, 0.8, '#b8ad9a')),
      R(2.6, 7.4, 21.2, 2.6, '#ff6b6b'), T([[2.6, 8], [0.4, 6], [0.6, 10.6]], '#ff6b6b'), T([[2.6, 9], [0.4, 11.6], [1.6, 12.6]], '#ff6b6b'),
      ...face(15, 13.4, 1.4, mood)];
    return { w: 26, h: 24, shapes: out };
  },
  scorpip: (f, mood) => {
    const a = f ? 1 : -1;
    const c = '#ffa66b';
    const out = [];
    for (const lx of [10, 14, 18]) out.push(...stroke([[lx, 20], [lx - 2, 24 + (lx === 14 ? a : -a) * 0.6]], 1, '#e88a54', false));
    out.push(E(13, 17.6, 9, 5.6, c), F(R(8, 16, 1, 4, '#e88a54')), F(R(12, 15.4, 1, 5, '#e88a54')),
      ...stroke([[6, 16], [2.4, 11], [3.4, 5], [9, 2.6]], 3.4, c, false), E(9.4, 2.6, 2, 2, c),
      F(E(11.2, 3.8 - a * 0.3, 1.4, 1.4, '#ff6b9a')), F(E(13, 3.8 - a * 0.3, 1.4, 1.4, '#ff6b9a')), F(T([[10, 4.2 - a * 0.3], [14.2, 4.2 - a * 0.3], [12.1, 6.6 - a * 0.3]], '#ff6b9a')),
      E(23, 15.4, 6, 5.4, c), E(31.4, 18 + a * 0.4, 3.6, 2.8, c), T([[33, 16.6 + a * 0.4], [35.6, 15 + a * 0.4], [34, 18 + a * 0.4]], '#fff4e6'),
      ...face(24.4, 14.6, 1.27, mood, { gap: 3 }));
    return { w: 36, h: 25, shapes: out };
  },
  // Mossy Woods: a leaf fox, a boar with a leaf, and a mossy stone golem.
  leafling: (f, mood) => {
    const b = f ? 1 : 0;
    const out = [T([[9, 26], [-0.4, 15 - b], [2, 24], [8, 30]], '#7fd17a'), F(T([[8, 27], [2, 18 - b], [7, 26]], '#b6eeb0')),
      E(11, 32.4 - b, 2.4, 1.4, '#7fd17a'), E(19, 32.4 - (1 - b), 2.4, 1.4, '#7fd17a'),
      E(15, 24.6, 8, 7.4, '#9fe0a0'), F(E(16, 26, 4, 4, '#e8ffe0')),
      T([[11, 9], [11.4, 1 + b * 0.5], [16, 7]], '#7fd17a'), T([[19, 7], [24, 1.4 + b * 0.5], [23.6, 10]], '#7fd17a'),
      E(18, 14, 8.6, 7.4, '#9fe0a0'), E(23, 17, 4, 3, '#e8ffe0'), F(E(25.8, 15.8, 1, 0.8, INK)),
      ...face(19, 13.6, 1.4, mood, { gap: 3.6 })];
    return { w: 30, h: 34, shapes: out };
  },
  boarlet: (f, mood) => {
    const a = f ? 1 : 0;
    const fur = '#c49a7a';
    const out = [R(9, 24, 3.6, 6 - a, shade(fur, -14)), R(15, 24, 3.6, 5 + a, shade(fur, -14)), R(23, 24, 3.6, 6 - a, shade(fur, -14)), R(28, 24, 3.6, 5 + a, shade(fur, -14)),
      E(19, 18, 15, 9.6, fur), E(15, 10.6, 8, 3, shade(fur, -16)), E(32, 16.4, 8, 7.4, fur), E(38, 18.6, 3.2, 2.6, '#e8b8a0'),
      F(E(37.4, 18.6, 0.5, 0.7, INK)), F(E(39, 18.6, 0.5, 0.7, INK)),
      T([[35, 21], [36.6, 15.4], [37.4, 21]], '#fffaf0'), T([[28, 10], [30, 4], [31.6, 10]], shade(fur, -10)),
      E(31, 7.6, 3, 1.6, '#7fd17a'), F(R(30.6, 6.4, 0.8, 2.4, '#5fb878')),
      ...face(32.6, 14.6, 1.4, mood, { gap: 3.6, mouth: false })];
    return { w: 42, h: 31, shapes: out };
  },
  mossgolem: (f, mood) => {
    const b = f ? 1 : 0;
    const stone = '#b5b0a6';
    const out = [R(14, 42, 7, 8, shade(stone, -12)), R(28, 42, 7, 8, shade(stone, -12)),
      E(6.4, 30 + b, 6, 9, shade(stone, -6)), E(41.6, 30 - b, 6, 9, shade(stone, -6)), E(6.4, 37.6 + b, 4.4, 3.4, '#8fd39a'),
      E(24, 31, 18.6, 15, stone), E(24, 17, 14, 11.6, stone), E(24, 7.6, 13, 5, '#8fd39a'), E(12, 12, 3, 2.4, '#8fd39a'), E(35.6, 22, 3.4, 2.4, '#8fd39a'),
      F(E(19, 5, 1.2, 1.2, '#ff9ec0')), F(E(28, 4.6, 1.2, 1.2, '#ffe36b')), F(E(16, 34, 2.4, 1.6, shade(stone, -10))), F(E(31, 38, 2, 1.4, shade(stone, -10))),
      ...face(26, 18.4, 2.16, mood, { gap: 4 })];
    return { w: 48, h: 50, shapes: out };
  },
  // Twilight Ruins: a candle ghost, a little bat, and a skeleton knight.
  wisp: (f, mood) => {
    const w = f ? 1 : -1;
    const out = [T([[4, 16], [6, 6], [15, 2.6], [24, 6], [26, 16], [25, 27], [21, 24 + w], [17, 29], [13, 24 - w], [9, 29], [5, 26]], '#e6f6ff'),
      F(E(10, 10, 3, 2, '#ffffff')), R(12.6, -0.4, 4.8, 4.6, '#fff4e0'), E(15, 0, 2.4, 0.8, '#fff4e0'),
      E(15, -3 - (f ? 0.4 : 0), 1.8, 2.8 + (f ? 0.4 : 0), '#ffb35a'), F(E(15, -2.4, 0.8, 1.4, '#fff6c9')),
      E(4, 18 + w, 2, 1.4, '#e6f6ff'), E(26, 18 - w, 2, 1.4, '#e6f6ff'),
      ...face(16, 14, 1.46, mood)];
    return { w: 30, h: 34, shapes: out.map((s) => ({ ...s, y: s.y + 4 })) };
  },
  gloombat: (f, mood) => {
    const up = f ? -4 : 3;
    const wing = '#7a62c4';
    const out = [T([[11, 12], [1, 6 + up], [0, 14 + up], [3, 13 + up * 0.5], [4, 17 + up * 0.4], [7, 15], [10, 18]], wing),
      T([[23, 12], [33, 6 + up], [34, 14 + up], [31, 13 + up * 0.5], [30, 17 + up * 0.4], [27, 15], [24, 18]], wing),
      E(17, 14, 7.6, 7, '#9b86d6'), T([[11.4, 9], [11, 1.6], [15.4, 7.4]], '#9b86d6'), T([[18.6, 7.4], [23, 1.6], [22.6, 9]], '#9b86d6'),
      F(T([[12.4, 7.4], [12.2, 4], [14, 6.6]], '#ffc2e6')), F(T([[20, 6.6], [21.8, 4], [21.6, 7.4]], '#ffc2e6')),
      E(14.6, 21, 1.2, 1, '#7a62c4'), E(19.4, 21, 1.2, 1, '#7a62c4'),
      ...face(18, 13.6, 1.33, mood, { gap: 3.4 })];
    if (mood !== 'angry') out.push(F(T([[18.6, 16.4], [19.6, 16.4], [19.1, 17.6]], '#ffffff')));
    return { w: 34, h: 24, shapes: out };
  },
  boneknight: (f, mood) => {
    const a = f ? 1 : 0;
    const bone = '#fffaf0';
    const out = [R(11.6, 34, 3, 10 - a, bone), R(18.6, 34, 3, 9 + a, bone), E(13, 44 - a, 2.6, 1.4, '#c9d6ff'), E(20, 44 - (1 - a), 2.6, 1.4, '#c9d6ff'),
      E(6, 28, 5, 7, '#9fb8ff'), F(T([[6, 24], [7.6, 28], [6, 32], [4.4, 28]], '#ffe36b')),
      R(11, 22, 12, 13, '#c9d6ff'), F(R(13, 25, 8, 1, '#a8b8e8')), F(R(13, 28.4, 8, 1, '#a8b8e8')), F(R(13, 31.6, 8, 1, '#a8b8e8')),
      ...stroke([[23, 24], [27, 29 - a]], 2.2, bone, false), R(26.4, 12 - a, 2, 18, '#dfe6f5'), R(24.4, 27 - a, 6, 1.6, '#ffd66b'),
      E(17, 12.6, 9, 8.6, bone), T([[8, 10], [10, 3], [17, 0.6], [24, 3], [26, 10]], '#c9d6ff'), R(8, 9, 18, 2.2, '#a8b8e8'),
      E(17, 0.6, 2.4, 2, '#ff9ec0'), F(R(16.6, 16.6, 0.6, 2, '#d9cde6')), F(R(19, 16.6, 0.6, 2, '#d9cde6')),
      ...face(19, 13.4, 1.46, mood, { gap: 3.8, eye: '#5a3f7a' })];
    return { w: 32, h: 46, shapes: out.map((s) => ({ ...s, y: s.y + 1 })) };
  },
  // Crystal Cave: a gem slime, a geode golem, and a hooded shade.
  crystalslime: (f, mood) => {
    const sq = f ? 1 : 0;
    const out = [T([[9, 7 + sq], [11, 1 + sq], [13, 7 + sq]], '#e0b8ff'), T([[15, 5 + sq], [18, -1 + sq], [21, 5 + sq]], '#c9f2ff'), T([[22, 7 + sq], [25, 2 + sq], [26, 8 + sq]], '#e0b8ff'),
      E(18, 18 + sq, 16 + sq, 11 - sq, '#9fe8ff'), R(2 + sq * 0.4, 18, 32 - sq * 0.8, 9.6, '#9fe8ff'),
      F(E(10, 12 + sq, 4, 2.2, '#e6fbff')), F(E(8, 24, 1.6, 1.6, '#c9f2ff')), F(E(29, 23, 1.2, 1.2, '#c9f2ff')),
      ...face(20, 18.6 + sq, 1.59, mood)];
    return { w: 36, h: 28, shapes: out };
  },
  rockgolem: (f, mood) => {
    const b = f ? 1 : 0;
    const rock = '#a898c8';
    const out = [R(14, 46, 9, 10, shade(rock, -12)), R(32, 46, 9, 10, shade(rock, -12)),
      E(7, 34 + b, 7, 11, shade(rock, -6)), E(47, 34 - b, 7, 11, shade(rock, -6)), E(7, 44 + b, 6, 5, shade(rock, -16)), E(47, 44 - b, 6, 5, shade(rock, -16)),
      E(27, 35, 20, 17, rock), E(27, 19, 14, 12, shade(rock, 6)),
      T([[8, 24], [10, 13], [14, 22]], '#a8e8ff'), T([[12, 24], [15, 16], [18, 24]], '#e0b8ff'), T([[38, 22], [42, 11], [45, 24]], '#a8e8ff'), T([[36, 25], [38, 18], [41, 26]], '#ffc6e6'),
      F(E(27, 37, 5, 4, '#c9b6ff')), F(T([[27, 33], [30, 37], [27, 41], [24, 37]], '#e0b8ff')),
      ...face(29, 19.6, 2.16, mood, { gap: 4 })];
    return { w: 54, h: 56, shapes: out };
  },
  shade: (f, mood) => {
    const w = f ? 1 : -1;
    const cloak = '#5d5285';
    const out = [T([[6, 16], [9, 4], [16, 0.6], [23, 4], [26, 16], [28, 36], [24, 33 + w], [20, 38], [16, 34 - w], [12, 38], [8, 33 + w], [4, 36]], cloak),
      E(16, 15, 7, 6.6, '#2e2650'), R(8, 22, 16, 3, '#ff8fa8'), T([[22, 23], [27, 30 + w], [24, 31 + w]], '#ff8fa8'),
      ...face(16.6, 14.6, 1.4, mood, { gap: 3.6, eye: '#ffe36b', ink: '#ffe36b', blush: false, mouth: mood === 'angry' || mood === 'hurt' })];
    return { w: 32, h: 40, shapes: out.map((s) => ({ ...s, y: s.y + 1 })) };
  },
  // Sky Garden: a cloud ram, a breezy bird, and a little star.
  cloudsheep: (f, mood) => {
    const a = f ? 1 : 0;
    const out = [R(10, 24, 3, 7 - a, '#7a6a8a'), R(16, 24, 3, 6 + a, '#7a6a8a'), R(24, 24, 3, 7 - a, '#7a6a8a'), R(29, 24, 3, 6 + a, '#7a6a8a')];
    for (const [x, y, r] of [[8, 17, 6], [14, 11, 7], [22, 10, 7], [28, 15, 6], [12, 21, 6], [22, 21, 7]]) out.push(E(x, y, r, r * 0.9, '#ffffff'));
    out.push(E(33, 16, 6, 6.4, '#fff0e0'), arc(30, 12, 3.4, 3.4, 150, 420, 1.6, '#ffd6a5'), E(35, 9.6, 3.6, 2.6, '#ffffff'),
      ...face(34.4, 16, 1.27, mood, { gap: 3.4 }));
    return { w: 42, h: 32, shapes: out };
  },
  windbird: (f, mood) => {
    const up = f ? -5 : 3;
    const out = [T([[4, 18], [-1, 14], [0, 22], [4, 21]], '#7fbfff'), E(20, 17, 11, 10, '#9fd8ff'), F(E(21, 21, 6.6, 5, '#e6f6ff')),
      T([[16, 14], [6, 6 + up], [4, 14 + up * 0.5], [10, 18]], '#7fbfff'),
      ...stroke([[20, 7.4], [21, 3], [24, 2.4], [24.4, 4.4]], 1.4, '#7fbfff', false),
      T([[29.6, 16], [34.4, 17.4], [29.6, 19.4]], '#ffd66b'), R(17, 26, 1.4, 4, '#ffb347'), R(22, 26, 1.4, 4, '#ffb347'),
      ...face(25.6, 15, 1.27, mood, { gap: 3.4, mouth: false })];
    return { w: 36, h: 30, shapes: out };
  },
  starspirit: (f, mood) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? 7.6 : 16;
      pts.push([18 + Math.cos(a) * r, 20 + Math.sin(a) * r]);
    }
    const out = [T(pts, '#ffe36b'), F(E(14, 14, 3.4, 2, '#fff6c9')), ...face(19, 21, 1.65, mood)];
    if (f) out.push(F(E(3, 6, 1, 1, '#ffffff')), F(E(33, 8, 1, 1, '#ffffff')));
    return { w: 36, h: 38, shapes: out };
  },
  // The Crystal King: a crystal golem king with a crown, a cape, and a glowing gem heart.
  crystalking: (f, mood) => {
    const b = f ? 2 : 0;
    const out = [T([[22, 44], [90, 44], [104, 104], [90, 100], [76, 106], [56, 100], [36, 106], [22, 100], [8, 104]], '#7f6ad0'),
      R(32, 96, 18, 16, '#8f7cc4'), R(62, 96, 18, 16, '#8f7cc4'),
      E(14, 68 + b, 12, 20, '#a58cff'), E(98, 68 - b, 12, 20, '#a58cff'), T([[4, 84 + b], [14, 74 + b], [24, 84 + b], [14, 98 + b]], '#c9f2ff'), T([[88, 84 - b], [98, 74 - b], [108, 84 - b], [98, 98 - b]], '#c9f2ff'),
      E(56, 74, 38, 30, '#b8a6ff'), E(56, 66, 26, 18, '#c9b6ff'), T([[56, 62], [64, 72], [56, 84], [48, 72]], '#ff9ec0'), F(T([[56, 66], [59, 72], [56, 78], [53, 72]], '#ffd6e6')),
      E(56, 38 + b, 26, 22, '#c9b6ff'),
      T([[34, 20 + b], [38, 2 + b], [44, 14 + b], [50, -2 + b], [56, 12 + b], [62, -2 + b], [68, 14 + b], [74, 2 + b], [78, 20 + b]], '#ffd66b'),
      F(E(56, 12 + b, 3, 3, '#ff9ec0')), F(E(44, 16 + b, 2, 2, '#8fe3ff')), F(E(68, 16 + b, 2, 2, '#8fe3ff')),
      // Crystal pauldrons and a scepter topped with a heart gem.
      T([[22, 52], [28, 40], [36, 50]], '#c9f2ff'), T([[30, 52], [34, 44], [40, 54]], '#e0b8ff'), T([[90, 52], [84, 40], [76, 50]], '#c9f2ff'), T([[82, 52], [78, 44], [72, 54]], '#e0b8ff'),
      R(104, 30 - b, 3, 50, '#ffd66b'), E(105.5, 28 - b, 5, 5, '#ff9ec0'), F(E(104, 26.4 - b, 1.6, 1.6, '#ffffff')),
      ...face(58, 40 + b, 4.6, mood, { gap: 4.4 })];
    return { w: 114, h: 112, shapes: out.map((s) => ({ ...s, y: s.y + 2 })) };
  },
};

export function monsterSprite(art, frame, mood = 'idle') {
  return sprite(`mob|${art}|${frame}|${mood}`, () => ({ ...ART[art](frame, mood), res: 2, soft: 'cel', crisp: true }));
}

// How a monster feels right now.
function moodOf(m, t, now) {
  if (m.hp <= 0) return 'dead';
  if (m.flash > 0 || m.stagger > 0) return 'hurt';
  if (m.special?.warn > 0) return 'angry';
  if (now < m.aggroUntil && m.def.aggro) return 'angry';
  const cyc = (t * 0.3) % 1;
  if (cyc < 0.04) return 'blink';
  if (m.state === 'idle' && cyc > 0.55 && cyc < 0.75) return 'happy';
  return 'idle';
}

// Emote bubbles over the head: "!" right after it gets angry, a pulsing anger mark while it
// chases, a sweat drop when hit, and music notes or z's while it lazes about.
function drawEmote(ctx, m, mood, x, top, t, now) {
  ctx.save();
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  const hx = x + (m.dir < 0 ? -1 : 1) * m.def.w * 0.32;
  if (mood === 'angry' && m.aggroUntil - now > 5.4 && !m.def.boss) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ff5b7f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(hx, top - 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff5b7f';
    ctx.fillText('!', hx, top - 4.6);
  } else if (mood === 'angry') {
    const k = 1 + 0.25 * Math.max(0, Math.sin(t * 8));
    ctx.strokeStyle = '#ff4d6d';
    ctx.lineWidth = 1.4;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      ctx.beginPath();
      ctx.moveTo(hx + sx * 0.8 * k, top - 6 + sy * 2.6 * k);
      ctx.lineTo(hx + sx * 0.8 * k, top - 6 + sy * 0.8 * k);
      ctx.lineTo(hx + sx * 2.6 * k, top - 6 + sy * 0.8 * k);
      ctx.stroke();
    }
  } else if (mood === 'hurt') {
    ctx.fillStyle = '#9fdcff';
    ctx.beginPath();
    ctx.arc(hx, top + 2, 2.2, 0, Math.PI * 2);
    ctx.moveTo(hx - 2, top + 1.4);
    ctx.lineTo(hx, top - 2.6);
    ctx.lineTo(hx + 2, top + 1.4);
    ctx.fill();
  } else if (m.state === 'idle' && m.hp > 0) {
    const cyc = (t * 0.3) % 1;
    if (cyc > 0.55 && cyc < 0.8) {
      const u = (cyc - 0.55) / 0.25;
      ctx.globalAlpha = Math.sin(u * Math.PI);
      ctx.fillStyle = '#8f7cc4';
      ctx.fillText(m.uid % 3 === 0 ? 'z' : '♪', hx + u * 4, top - 2 - u * 8);
    }
  }
  ctx.restore();
}

// (x, y) is the monster's feet center in screen space; `now` is world time (for aggro).
// Walkers bounce along with a squash on every landing, everyone breathes while idle, new
// monsters pop in, hits squash them flat for a moment, and defeated ones shrink away.
export function drawMonster(ctx, m, x, y, time, now = time) {
  const flying = m.def.fly;
  const moving = (m.state === 'walk' && m.stagger <= 0) || flying;
  const t = time + m.uid * 0.37;
  const mood = moodOf(m, t, now);
  const fast = mood === 'angry' ? 1.5 : 1;
  const frame = moving ? Math.floor(t * (flying ? 6 : 4) * fast) % 2 : Math.floor(t * 1.2) % 2;
  const s = monsterSprite(m.def.art, frame, mood);
  let alpha = 1;
  let sx = 1;
  let sy = 1;
  let hop = 0;
  if (m.def.boss) {
    sy = 1 + Math.sin(t * 2) * 0.015;
    if (m.special?.warn > 0) {
      // Wind-up: crouch and tremble before the slam.
      sy = 0.9;
      sx = 1.08;
      x += Math.sin(time * 60) * 1.5;
    }
  } else if (moving && !flying) {
    const p = (t * 2.6 * fast) % 1;
    hop = Math.sin(p * Math.PI) * (mood === 'angry' ? 4 : 3);
    const squash = p < 0.12 || p > 0.9 ? 0.12 : 0;
    sx = 1 + squash - (hop > 2 ? 0.04 : 0);
    sy = 1 - squash + (hop > 2 ? 0.06 : 0);
  } else {
    sy = 1 + Math.sin(t * 3) * 0.03;
    sx = 1 - Math.sin(t * 3) * 0.02;
  }
  if (m.flash > 0) {
    sx *= 1.14;
    sy *= 0.86;
  }
  if (m.age < 0.3 && m.hp > 0) {
    // Spawn pop with a little overshoot.
    const k = m.age / 0.3;
    const pop = 1 + Math.sin(k * Math.PI) * 0.25;
    sx *= k * pop;
    sy *= k * pop;
    alpha = Math.min(1, k * 2);
  }
  if (m.hp <= 0) {
    alpha = Math.max(0, 1 - m.dying * 2.2);
    sx *= 1 + m.dying * 0.6;
    sy *= Math.max(0.05, 1 - m.dying * 1.8);
  }
  if (sx <= 0 || sy <= 0) return;
  if (!flying) {
    // Ground shadow; it shrinks a little at the top of each hop.
    ctx.save();
    ctx.globalAlpha = 0.16 * alpha;
    ctx.fillStyle = '#3a2d4f';
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(6, s.w * 0.36) * (1 - hop * 0.04), 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y - hop));
  ctx.scale(sx, sy);
  blit(ctx, s, -s.w / 2, -s.h, { flip: m.dir < 0, flash: m.flash, alpha });
  ctx.restore();
  if (alpha > 0.5) drawEmote(ctx, m, mood, x, y - hop - s.h * sy, t, now);
}
