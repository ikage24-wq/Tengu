// Scenery for the regions between the Twilight Ruins and the Sky Garden: small props and the
// outlined pieces of their middle backdrops. The Fox Shrine Path's stone lanterns, little torii
// and tiered pagodas; the pines of Moonlit Ridge and Frozen Peak (snow-laden up on the peak); the
// reeds and bamboo round Serpent Springs; snow tufts. Drawn like the rest of the scenery (see
// scenery.js): pastel shapes, each part shaded by one light from the upper left.

import { R, E, T, F, mix, shade } from './pixel.js';
import { ramp, foliage, hash } from './propkit.js';
import { art } from './scenery.js';

const SNOW = '#fbfdff';
const SNOW_SH = '#d6e4ff';

// A pine: three tiers of drooping boughs on a short trunk. Up on the peak each tier carries a
// cap of snow. `f` leans it with the wind (0..4, 2 upright).
export function pineArt(seed, snowy = false, f = 2) {
  const tall = hash(seed * 7) > 0.5;
  const H = tall ? 76 : 62;
  const leaf = snowy ? '#6fa8a0' : pickOf(['#4f8f8a', '#5a9a7a', '#467f88'], seed);
  return art(`pine|${leaf}|${tall}|${snowy}|${f}`, 46, H, () => {
    const r = ramp(leaf, 0.9);
    const b = ramp('#a07a5c', 0.8);
    const d = (f - 2) * 0.6;
    const out = [R(20.5, H - 14, 5, 14, b.base), F(R(23.4, H - 14, 2.1, 14, b.sh))];
    // Tiers from the bottom up: each a wide skirt, scalloped along its hem.
    const tiers = tall ? [[H - 12, 21, 16], [H - 30, 17, 16], [H - 46, 13, 15], [H - 60, 8, 12]] : [[H - 12, 20, 15], [H - 28, 15, 15], [H - 44, 9, 13]];
    tiers.forEach(([base, half, h], i) => {
      const lean = d * (i + 1) * 0.5;
      const top = base - h;
      const hem = [];
      for (let k = 0; k <= 6; k++) {
        const u = k / 6;
        hem.push([23 - half + u * half * 2 + lean * 0.4, base + (k % 2 ? 2 : 0)]);
      }
      const body = [[23 + lean, top], ...hem.reverse()];
      out.push(T(body, r.base), F(T([[23 + lean, top], [23 + half + lean * 0.4, base], [23 + lean * 0.7, base]], r.sh)));
      out.push(F(T([[23 + lean, top + 1.5], [23 - half * 0.5 + lean * 0.6, base - h * 0.35], [23 - half * 0.25 + lean * 0.6, base - h * 0.35]], r.hi)));
      if (snowy) {
        // Snow sits on top of each tier, thick in the middle and running out along the boughs.
        out.push(T([[23 + lean, top - 1], [23 - half * 0.75 + lean * 0.5, base - h * 0.42], [23 - half * 0.5 + lean * 0.5, base - h * 0.32], [23 + lean * 0.8, base - h * 0.48], [23 + half * 0.55 + lean * 0.5, base - h * 0.3], [23 + half * 0.8 + lean * 0.5, base - h * 0.4]], SNOW));
        out.push(F(T([[23 + lean, base - h * 0.48], [23 + half * 0.55 + lean * 0.5, base - h * 0.3], [23 + half * 0.8 + lean * 0.5, base - h * 0.4]], SNOW_SH)));
      }
    });
    return out;
  }, false);
}

const pickOf = (list, seed) => list[Math.floor(hash(seed * 3.3) * list.length) % list.length];

// A stone lantern (toro): a stepped base, the light box with its window, and a curled roof cap.
// It glows warm after dark (`lit`).
export function stoneLampArt(lit) {
  return art(`stonelamp|${lit}`, 22, 34, () => {
    const s = ramp('#e2dcf0', 0.8);
    return [
      R(5, 30, 12, 4, s.base), F(R(13, 30, 4, 4, s.sh)),
      R(9, 21, 4, 9, s.base), F(R(11.6, 21, 1.4, 9, s.sh)),
      R(4, 18, 14, 3, s.base), F(R(14, 18, 4, 3, s.sh)),
      R(5.5, 10, 11, 8, s.base), F(R(13.5, 10, 3, 8, s.sh)),
      F(R(8, 11.5, 6, 5, lit ? '#ffe9a6' : '#7a6aa0')), lit ? F(R(8.6, 12, 2, 4, '#fff8dc')) : null,
      T([[1, 10.5], [11, 4], [21, 10.5], [19, 11], [11, 6.6], [3, 11]], s.base), F(T([[11, 4], [21, 10.5], [19, 11], [11, 6.6]], s.sh)),
      E(11, 3.6, 1.8, 1.6, s.base), F(E(11.5, 4, 1, 1, s.sh)),
      F(E(6, 31, 1.6, 0.8, '#9fe0b0')), F(E(16.6, 22, 1.2, 0.6, '#9fe0b0')),
    ];
  });
}

// A small vermilion torii for the backdrop: two posts, the tie beam, and the swept top beam.
export function smallToriiArt() {
  return art('smalltorii', 44, 40, () => {
    const r = ramp('#ff6f61', 0.85);
    return [
      R(8, 10, 4, 30, r.base), F(R(10.6, 10, 1.4, 30, r.sh)), R(32, 10, 4, 30, r.base), F(R(34.6, 10, 1.4, 30, r.sh)),
      R(5, 14, 34, 3, r.base), F(R(5, 16, 34, 1, r.sh)),
      T([[0, 5], [6, 7], [38, 7], [44, 5], [42, 9.6], [2, 9.6]], '#4a3a5c'), F(T([[2, 8.4], [42, 8.4], [42, 9.6], [2, 9.6]], '#3a2d4f')),
      R(19.5, 9.6, 5, 5, r.base), F(R(22.6, 9.6, 1.9, 5, r.sh)),
      R(6.6, 38, 6.8, 2, '#5a4a6a'), R(30.6, 38, 6.8, 2, '#5a4a6a'),
    ];
  });
}

// A tiered pagoda for the shrine's middle backdrop: three roofs narrowing up to a spire, the
// walls between them pale plaster, little lanterns under the eaves.
export function pagodaArt(seed) {
  const roof = pickOf(['#5a4a78', '#6a4a6e', '#4f4a80'], seed);
  return art(`pagoda|${roof}`, 64, 118, () => {
    const r = ramp(roof, 0.85);
    const wall = ramp('#fff4ec', 0.7);
    const wood = ramp('#ff6f61', 0.85);
    const out = [R(22, 96, 20, 22, wall.base), F(R(36, 96, 6, 22, wall.sh)), F(R(29, 104, 6, 14, '#b87a5c'))];
    const tiers = [[96, 30], [66, 24], [40, 18]];
    tiers.forEach(([y, half], i) => {
      if (i > 0) out.push(R(32 - half * 0.55, y, half * 1.1, 22 - i * 3, wall.base), F(R(32 + half * 0.25, y, half * 0.3, 22 - i * 3, wall.sh)), F(R(29.5, y + 6, 5, 6, '#ffe9a6')));
      out.push(T([[32 - half - 3, y + 1], [32 - half + 2, y - 4], [32, y - 11], [32 + half - 2, y - 4], [32 + half + 3, y + 1], [32 + half, y + 2], [32 - half, y + 2]], r.base));
      out.push(F(T([[32, y - 11], [32 + half - 2, y - 4], [32 + half + 3, y + 1], [32 + half, y + 2], [32, y + 2]], r.sh)), F(T([[32 - half + 3, y - 3.4], [32, y - 9.4], [32 - half * 0.2, y - 5.6]], r.hi)));
      out.push(F(R(32 - half + 1, y + 2, (half - 1) * 2, 1.4, wood.base)));
      // A paper lantern under each eave corner.
      out.push(F(E(32 - half + 3, y + 5, 1.6, 2, '#ffd6a0')), F(E(32 + half - 3, y + 5, 1.6, 2, '#ffd6a0')));
    });
    out.push(R(31, 12, 2, 20, '#e8c27a'), F(E(32, 18, 2.4, 1.2, '#e8c27a')), F(E(32, 23, 2.8, 1.2, '#e8c27a')), F(E(32, 11.6, 1.6, 1.6, '#ffe9a6')));
    return out;
  }, false);
}

// Bamboo for the springs: two or three jointed stalks with leaf sprays, leaning a little.
export function bambooArt(seed, f = 2) {
  const n = hash(seed * 5) > 0.5 ? 3 : 2;
  return art(`bamboo|${n}|${f}`, 40, 96, () => {
    const g = ramp('#7fcf9a', 0.85);
    const out = [];
    const d = (f - 2) * 1.2;
    for (let k = 0; k < n; k++) {
      const x = 10 + k * 10;
      const top = 8 + k * 9;
      const lean = d * (1 + k * 0.4);
      const pts = (u) => x + lean * (1 - u);
      out.push(T([[x - 2, 96], [x + 2, 96], [pts(0) + 1.6, top], [pts(0) - 1.6, top]], g.base), F(T([[x + 0.6, 96], [x + 2, 96], [pts(0) + 1.6, top], [pts(0) + 0.3, top]], g.sh)));
      for (let y = top + 12; y < 92; y += 13) out.push(F(R(x - 2 + lean * (1 - (y - top) / (96 - top)) * 0.9, y, 4, 1.2, g.deep)));
      // Leaf sprays off the upper joints.
      for (const [dy, s] of [[top + 10, 1], [top + 24, -1]]) {
        const lx = pts(0.5) + s * 2;
        out.push(T([[lx, dy], [lx + s * 12, dy - 3], [lx + s * 10, dy + 0.6]], g.hi), T([[lx, dy + 1], [lx + s * 11, dy + 4], [lx + s * 8, dy + 4.6]], g.base));
      }
    }
    return out;
  }, false);
}

// Reeds at the water's edge: blades and a couple of cattails, swaying with frame `f`.
export function reedArt(f) {
  return art(`reed|${f}`, 18, 26, () => {
    const g = ramp('#8fcf8a', 0.85);
    const d = (f - 2) * 0.8;
    const out = [];
    for (const [x, h, c] of [[5, 22, g.sh], [9, 26, g.base], [13, 19, g.hi], [7, 16, g.base]]) out.push(T([[x - 1, 26], [x + 1, 26], [x + d * (h / 20), 26 - h]], c));
    out.push(R(10 + d * 1.2, 2, 2.6, 7, '#b0785a'), F(R(11.4 + d * 1.2, 2, 1.2, 7, '#8f5c48')), R(4 + d * 0.8, 8, 2.2, 6, '#b0785a'));
    return out;
  }, false);
}

// A tuft of grass poking through snow, with a little drift heaped against it.
export function snowTuftArt(f) {
  return art(`snowtuft|${f}`, 18, 12, () => {
    const g = ramp('#8fc8b0', 0.85);
    const d = (f - 2) * 0.6;
    return [
      T([[5, 10], [7, 10], [6 + d, 2]], g.base), T([[8, 10], [10, 10], [9 + d * 1.3, 0]], g.hi), T([[11, 10], [13, 10], [12 + d, 3]], g.sh),
      E(9, 10.6, 8, 2.4, SNOW), F(E(11, 11.4, 5, 1.2, SNOW_SH)),
    ];
  }, false);
}

// Wind chimes hanging from a branch stub in the glade: tubes that sway on their strings.
export function chimeArt(f) {
  return art(`chime|${f}`, 20, 34, () => {
    const d = (f - 2) * 0.7;
    const out = [R(2, 2, 16, 2, '#b0785a'), F(R(2, 3.2, 16, 0.8, '#8f5c48'))];
    [4, 8, 12, 16].forEach((x, i) => {
      const len = 10 + (i % 2) * 5;
      const sx = x + d * (1 + i * 0.2);
      out.push(F(R(x, 4, 0.6, 6, '#7a6a8a')), R(sx - 1, 10, 2.2, len, i % 2 ? '#bfe8ff' : '#e6dcff'), F(R(sx + 0.4, 10, 0.8, len, shade(i % 2 ? '#bfe8ff' : '#e6dcff', -12))));
    });
    out.push(E(10 + d, 30, 2.6, 3, '#ffd6e6'), F(E(10.6 + d, 30.6, 1.4, 1.8, mix('#ffd6e6', '#ff9ec0', 0.4))));
    return out;
  }, false);
}

// The Starfall summit's moon-dial pedestal for the middle backdrop: a pale column topped by a
// crescent.
export function moonDialArt() {
  return art('moondial', 26, 58, () => {
    const s = ramp('#e8e2ff', 0.75);
    return [
      R(6, 52, 14, 6, s.base), F(R(15, 52, 5, 6, s.sh)), R(9, 18, 8, 34, s.base), F(R(14, 18, 3, 34, s.sh)), R(6, 14, 14, 4, s.base), F(R(15, 14, 5, 4, s.sh)),
      E(13, 7, 7, 7, '#fff3c4'), F(E(16, 5.6, 5.6, 6, mix('#e8e2ff', '#c9b6ff', 0.3))), F(E(10.6, 6, 1.2, 1.2, '#ffffff')),
      ...foliage(5, 50, 4, 3, ramp('#c4b6f2'), seed0, { flat: true }),
    ];
  }, false);
}
const seed0 = 0.3;
