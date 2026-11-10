// Portals: a little gateway in each region's own style, standing on the ground with a soft swirl
// of the region's colour turning inside it. A flowery trellis in the meadows, a lantern gate in
// towns, a mossy root arch in the woods, a cracked stone arch in the ruins, crystal in the cave, a
// cloud ring in the sky, a small torii on the shrine path, an icy arch on the peak, and so on.
// Drawn like the rest of the scenery (outlined pastel shapes lit from the upper left); the swirl
// is a short loop of drawings, not a code-drawn glow.

import { R, E, T, F, mix } from './pixel.js';
import { ramp, bark, stones, crystal, foliage } from './propkit.js';
import { art, place } from './scenery.js';

const W = 60;
const H = 82;
// The doorway the swirl fills: centered at (30, 48), 34 wide and 52 tall.
const SW = 34;
const SH = 52;
const FRAMES = 8;

// Each style: the gateway's art, and the swirl's colours (outer, middle, inner).
export const PORTAL_STYLES = {
  meadow: { swirl: ['#ffb3cf', '#ffd6e6', '#fff4f9'], arch: flowerArch },
  town: { swirl: ['#c9a6ff', '#e2d4ff', '#fbf6ff'], arch: lanternGate },
  forest: { swirl: ['#7fd6a8', '#c4f2d6', '#f4fff8'], arch: rootArch },
  grove: { swirl: ['#9a8ae8', '#c9bcff', '#f2eeff'], arch: (v) => rootArch(v, true) },
  hollow: { swirl: ['#7fe6d6', '#c4f6ee', '#f4fffd'], arch: rootArch },
  ruins: { swirl: ['#b48cff', '#dccaff', '#f8f2ff'], arch: stoneArch },
  cave: { swirl: ['#7fd0ff', '#c4ecff', '#f2fbff'], arch: crystalArch },
  sky: { swirl: ['#ffc6e8', '#e2eaff', '#ffffff'], arch: cloudRing },
  crag: { swirl: ['#ffb07a', '#ffd9b8', '#fff6ec'], arch: bannerGate },
  harbor: { swirl: ['#8fb8ff', '#cddcff', '#f4f8ff'], arch: dockGate },
  shrine: { swirl: ['#ff9a8a', '#ffd0c4', '#fff4ef'], arch: toriiGate },
  ridge: { swirl: ['#8fa6ff', '#cdd6ff', '#f4f6ff'], arch: logArch },
  springs: { swirl: ['#7fdcd0', '#c4f2ec', '#f2fffd'], arch: bambooGate },
  tea: { swirl: ['#9fd88a', '#d8f0c0', '#f6fff0'], arch: bambooGate },
  snow: { swirl: ['#a8d4ff', '#dcefff', '#ffffff'], arch: iceArch },
  mochi: { swirl: ['#ffb3cf', '#ffe2ee', '#fff8fb'], arch: mochiGate },
};

// Which style a map's portals take: its own (`look.portal`), its theme's, or the meadow's.
export function portalStyleOf(map) {
  const key = map.look?.portal ?? (map.dungeon ? 'hollow' : map.theme);
  return PORTAL_STYLES[key] ? key : 'meadow';
}

// Draws one portal with its base centered on (x, y), the ground line (`own`: a portal's own style,
// over its map's).
export function drawPortalGate(ctx, map, x, y, time, seed = 0, own = null) {
  const key = own && PORTAL_STYLES[own] ? own : portalStyleOf(map);
  const style = PORTAL_STYLES[key];
  const f = Math.floor(time * 10 + seed) % FRAMES;
  place(ctx, swirlArt(key, style.swirl, f), x, y - (H - 48 - SH / 2));
  place(ctx, archArt(key, style), x, y + 2);
}

function archArt(key, style) {
  return art(`portal|${key}`, W, H, () => style.arch(key).filter(Boolean));
}

// The swirl: rings of the region's colour toward a bright heart, and three arms turning (one
// drawing per eighth of a turn).
function swirlArt(key, [c0, c1, c2], f) {
  return art(`portalswirl|${key}|${f}`, SW, SH, () => {
    const cx = SW / 2;
    const cy = SH / 2;
    const out = [E(cx, cy, SW / 2 - 0.5, SH / 2 - 0.5, c0), F(E(cx, cy, SW / 2 - 4, SH / 2 - 6, c1)), F(E(cx, cy, SW / 2 - 9, SH / 2 - 14, c2)), F(E(cx - 1, cy - 2, 3.4, 5, '#ffffff'))];
    for (let k = 0; k < 3; k++) {
      const arm = [];
      const back = [];
      for (let i = 0; i <= 8; i++) {
        const u = i / 8;
        const a = (f / FRAMES) * Math.PI * 2 + (k * Math.PI * 2) / 3 + u * 3.2;
        const r = (1 - u * 0.82) * 0.5;
        const w = 1.6 * (1 - u * 0.8);
        arm.push([cx + Math.cos(a) * SW * r + Math.cos(a + 1.57) * w, cy + Math.sin(a) * SH * r + Math.sin(a + 1.57) * w]);
        back.push([cx + Math.cos(a) * SW * r - Math.cos(a + 1.57) * w, cy + Math.sin(a) * SH * r - Math.sin(a + 1.57) * w]);
      }
      out.push(F(T([...arm, ...back.reverse()], k === 0 ? '#ffffff' : mix(c1, '#ffffff', 0.5))));
    }
    // A few glints round the rim.
    for (let k = 0; k < 4; k++) {
      const a = (f / FRAMES) * Math.PI * 2 * -0.5 + k * 1.57;
      out.push(F(E(cx + Math.cos(a) * (SW / 2 - 3), cy + Math.sin(a) * (SH / 2 - 4), 1, 1, '#ffffff')));
    }
    return out;
  }, false);
}

// ---------- The gateways (60 x 82, the doorway open in the middle) ----------

const bloom = (x, y, r, c) => [...[0, 1, 2, 3, 4].map((k) => F(E(x + Math.cos(k * 1.26) * r, y + Math.sin(k * 1.26) * r, r * 0.8, r * 0.8, c))), F(E(x, y, r * 0.55, r * 0.55, c === '#ffe36b' ? '#ff9f5a' : '#ffe36b'))];
// Points along the arch's curve (from the left post's top over to the right's), `r` out from the
// doorway's middle.
const archPts = (r, n = 10, top = 22) => Array.from({ length: n + 1 }, (_, i) => {
  const a = Math.PI + (i / n) * Math.PI;
  return [30 + Math.cos(a) * r, top + Math.sin(a) * r * 0.75];
});

// Meadow: a white trellis wound with vines and flowers.
function flowerArch() {
  const wood = ramp('#fff4ea', 0.7);
  const leaf = ramp('#8fdc9a');
  const out = [R(7, 22, 6, 60, wood.base), F(R(11, 22, 2, 60, wood.sh)), R(47, 22, 6, 60, wood.base), F(R(51, 22, 2, 60, wood.sh))];
  out.push(...bark(archPts(22), () => 2.6, wood, 1, 0));
  for (const [x, y, k] of [[10, 30, 0], [50, 40, 1], [10, 56, 2], [50, 66, 3]]) out.push(...foliage(x, y, 5, 4, leaf, k, { flat: true }));
  archPts(23, 8).forEach(([x, y], i) => {
    out.push(...foliage(x, y, 4.4, 3.4, leaf, i, { flat: true }));
    if (i % 2 === 0) out.push(...bloom(x, y - 1, 1.6, ['#ff9ec0', '#ffffff', '#ffe36b', '#c9a6ff'][i % 4]));
  });
  out.push(...bloom(9, 44, 1.5, '#ff9ec0'), ...bloom(51, 54, 1.5, '#ffffff'), ...bloom(9, 72, 1.3, '#ffe36b'));
  out.push(E(10, 81, 7, 1.6, '#8fdc9a'), E(50, 81, 7, 1.6, '#8fdc9a'));
  return out;
}

// Town: a little wooden gate with a pink tiled roof and a paper lantern on each post.
function lanternGate() {
  const wood = ramp('#c99a6a', 0.8);
  const roof = ramp('#ff9ec0', 0.8);
  const out = [R(6, 18, 6, 64, wood.base), F(R(10, 18, 2, 64, wood.sh)), R(48, 18, 6, 64, wood.base), F(R(52, 18, 2, 64, wood.sh)), R(4, 20, 52, 4, wood.base), F(R(4, 23, 52, 1, wood.sh))];
  out.push(T([[0, 18], [30, 4], [60, 18], [56, 20], [30, 8], [4, 20]], roof.base), F(T([[30, 4], [60, 18], [56, 20], [30, 8]], roof.sh)), F(T([[6, 16], [30, 5.6], [22, 10]], roof.hi)));
  out.push(E(30, 10, 3, 3, '#fff3a6'), F(E(30, 10, 1.6, 1.6, '#ffffff')));
  for (const x of [9, 51]) out.push(R(x - 0.4, 28, 0.8, 4, '#7a6a8a'), E(x, 36, 4, 5, '#ffd6a0'), F(E(x + 1.2, 37, 2.4, 3.8, '#ffc07a')), F(R(x - 3.6, 31.4, 7.2, 1, '#ff8fb0')), F(R(x - 3.6, 40, 7.2, 1, '#ff8fb0')));
  return out;
}

// The Mochi Garden's (and every way into it): a ring of hanami dango round the doorway, pink, white and
// matcha green, standing on two little stones; and a round mochi sat on top of it, smiling, rosy,
// its sprout up.
const DANGO = ['#b8e09c', '#fff6ee', '#ffb7cf'];
function mochiGate() {
  const out = [];
  const bead = (x, y, c, r = 6.4) => out.push(E(x, y, r, r * 0.94, c), F(E(x - r * 0.32, y - r * 0.4, r * 0.32, r * 0.2, '#ffffff')));
  // The two stones it stands on.
  for (const x of [9.5, 50.5]) out.push(E(x, 79, 7.5, 3.6, '#e4d8d2'), F(E(x - 2, 77.6, 3, 1, '#f6eeea')));
  // Up each side and round the top, the colours mirrored either side.
  const side = [[9.5, 70], [9.5, 59], [9.5, 48], [12.4, 37.4], [19.8, 29.4]];
  side.forEach(([x, y], i) => {
    bead(x, y, DANGO[i % 3]);
    bead(60 - x, y, DANGO[i % 3]);
  });
  // The mochi on top.
  out.push(E(30, 19, 11.5, 9.8, '#fff8f2'), F(E(26.4, 14.6, 4.4, 2, '#ffffff')));
  out.push(F(E(25.8, 19.4, 1.2, 1.7, '#4a3040')), F(E(34.2, 19.4, 1.2, 1.7, '#4a3040')), F(E(25.4, 18.6, 0.5, 0.6, '#ffffff')), F(E(33.8, 18.6, 0.5, 0.6, '#ffffff')));
  out.push(F(E(22.6, 22, 2.4, 1.3, '#ffbccb')), F(E(37.4, 22, 2.4, 1.3, '#ffbccb')));
  out.push(F(E(29.1, 22.4, 1, 0.7, '#d0507a')), F(E(30.9, 22.4, 1, 0.7, '#d0507a')));
  // Its sprout.
  out.push(F(R(29.5, 5.6, 1.1, 4.4, '#6fae52')), E(26.6, 6.2, 3.4, 1.8, '#8fd16f'), E(33.4, 5.4, 3.4, 1.8, '#8fd16f'));
  return out;
}

// Woods, grove and the Hollow: two roots twisting up into an arch, mossy, with a glowcap or two
// (and moonlit lanterns in the grove).
function rootArch(key, grove = false) {
  const wood = ramp(grove ? '#9a7ec0' : '#b98e78', 0.85);
  const moss = ramp(grove ? '#9fe0b0' : '#a6dca2');
  const out = [];
  out.push(...bark([[10, 82], [8, 60], [11, 40], [14, 26], [22, 14], [30, 11]], (u) => 5 - u * 1.6, wood, 2));
  out.push(...bark([[50, 82], [52, 62], [49, 42], [46, 26], [38, 14], [30, 11]], (u) => 5 - u * 1.6, wood, 3));
  out.push(...foliage(16, 20, 6, 4, moss, 1, { flat: true }), ...foliage(44, 24, 6, 4, moss, 2, { flat: true }), ...foliage(30, 10, 7, 4, moss, 3, { flat: true }));
  const cap = grove ? '#c9b6ff' : '#7fe6d6';
  for (const [x, y] of [[6, 66], [54, 50]]) out.push(R(x - 1, y, 2, 6, '#fff1dc'), E(x, y, 4, 2.6, cap), F(E(x - 1, y - 0.6, 1.4, 0.8, '#ffffff')));
  if (grove) out.push(R(29.6, 12, 0.8, 6, '#7a6a8a'), E(30, 21, 3.4, 4, '#ffe9a6'), F(E(31, 22, 1.8, 3, '#ffd27a')));
  return out;
}

// Ruins: an arch of old stone blocks, one cracked, ivy trailing down.
function stoneArch() {
  const st = ramp('#d6cbf5', 0.75);
  const out = [...stones(4, 26, 12, 56, st, 2, { rowH: 8, blockW: 12 }), ...stones(44, 26, 12, 56, st, 5, { rowH: 8, blockW: 12 })];
  const pts = archPts(22, 6);
  pts.slice(0, -1).forEach(([x, y], i) => {
    const [x2, y2] = pts[i + 1];
    out.push(T([[x - 1, y - 4], [x2 + 1, y2 - 4], [x2 + 1, y2 + 5], [x - 1, y + 5]], i % 2 ? st.base : mix(st.base, st.hi, 0.4)), F(T([[x - 1, y + 3], [x2 + 1, y2 + 3], [x2 + 1, y2 + 5], [x - 1, y + 5]], st.sh)));
  });
  out.push(R(26, 2, 8, 8, st.base), F(R(31, 2, 3, 8, st.sh)), F(E(30, 6, 1.6, 1.6, '#b48cff')));
  out.push(F(T([[46, 40], [49, 46], [47, 52]], st.deep)));
  const ivy = ramp('#9be08f');
  for (const [x, y] of [[8, 30], [8, 38], [52, 30], [10, 46]]) out.push(...foliage(x, y, 3, 2.4, ivy, x + y, { flat: true }));
  return out;
}

// Crystal Cave: two crystal clusters for posts, an arch of shards over the top.
function crystalArch() {
  const c = ramp('#9fdcff');
  const p = ramp('#d4b4ff');
  const out = [];
  out.push(...crystal(10, 9, 40, 22, 82, c, -1), ...crystal(5, 6, 66, 56, 82, p, -2), ...crystal(15, 5, 70, 62, 82, c, 1));
  out.push(...crystal(50, 9, 40, 22, 82, c, 1), ...crystal(55, 6, 64, 54, 82, p, 2), ...crystal(45, 5, 72, 64, 82, p, -1));
  archPts(21, 6).forEach(([x, y], i) => out.push(...crystal(x, 6, y - 2, y - 10, y + 6, i % 2 ? p : c, (x - 30) * 0.15)));
  out.push(E(10, 82, 9, 2, '#7563b6'), E(50, 82, 9, 2, '#7563b6'));
  return out;
}

// Sky: a ring of puffy clouds round the doorway, little wings at the sides.
function cloudRing() {
  const cl = ramp('#ffffff', 0.6);
  const out = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const x = 30 + Math.cos(a) * 21;
    const y = 50 + Math.sin(a) * 30;
    out.push(E(x, y, 7, 6, cl.sh), F(E(x - 1, y - 1, 6, 5, cl.base)), F(E(x - 2.4, y - 2.4, 2.4, 1.6, cl.hi)));
  }
  for (const s of [-1, 1]) {
    const bx = 30 + s * 28;
    out.push(T([[bx, 44], [bx + s * 10, 36], [bx + s * 6, 46], [bx + s * 10, 50], [bx, 52]], '#fffaf0'), F(T([[bx, 50], [bx + s * 10, 50], [bx, 52]], '#e6dcff')));
  }
  return out;
}

// Ember Crag: sandstone posts with a striped cloth banner strung between them.
function bannerGate() {
  const st = ramp('#f2c48d', 0.8);
  const cloth = ramp('#ff8a5c', 0.85);
  const out = [...stones(5, 18, 10, 64, st, 1, { rowH: 10, blockW: 10 }), ...stones(45, 18, 10, 64, st, 4, { rowH: 10, blockW: 10 })];
  out.push(R(3, 14, 14, 5, st.base), F(R(3, 17, 14, 2, st.sh)), R(43, 14, 14, 5, st.base), F(R(43, 17, 14, 2, st.sh)));
  out.push(T([[15, 18], [45, 18], [42, 28], [30, 32], [18, 28]], cloth.base), F(T([[30, 18], [45, 18], [42, 28], [30, 32]], cloth.sh)));
  for (const x of [20, 26, 32, 38]) out.push(F(R(x, 19, 2, 9, '#ffd66b')));
  for (const x of [10, 50]) out.push(R(x - 0.6, 4, 1.2, 10, '#7a5238'), T([[x, 4], [x + 6, 6], [x, 8]], '#ffd66b'));
  return out;
}

// Pastel Harbor: two dock posts with rope coiled round them and a lantern hung on a crossbeam.
function dockGate() {
  const wood = ramp('#a88a6a', 0.85);
  const rope = '#e8d29a';
  const out = [R(7, 14, 7, 68, wood.base), F(R(11, 14, 3, 68, wood.sh)), R(46, 14, 7, 68, wood.base), F(R(50, 14, 3, 68, wood.sh)), R(3, 14, 54, 5, wood.base), F(R(3, 17, 54, 2, wood.sh))];
  for (const x of [7, 46]) for (const y of [30, 34, 60, 64]) out.push(F(R(x, y, 7, 2, rope)));
  out.push(R(29.6, 19, 0.8, 5, '#3a2d4f'), E(30, 28, 4, 5, '#fff3a6'), F(E(31, 29, 2.4, 3.6, '#ffe08a')), F(R(26, 23, 8, 1.4, '#5a4a6a')), F(R(26, 32.4, 8, 1.4, '#5a4a6a')));
  out.push(T([[3, 14], [0, 10], [8, 10]], wood.base), T([[57, 14], [60, 10], [52, 10]], wood.base));
  return out;
}

// Fox Shrine Path: a small vermilion torii.
function toriiGate() {
  const r = ramp('#ff6f61', 0.85);
  const ink = ramp('#4a3a5c', 0.8);
  const out = [];
  for (const x of [9, 45]) out.push(T([[x, 82], [x + 1, 20], [x + 6, 20], [x + 7, 82]], r.base), F(T([[x + 4.6, 82], [x + 5, 20], [x + 6, 20], [x + 7, 82]], r.sh)), R(x - 1.5, 76, 9, 6, ink.base));
  out.push(R(3, 26, 54, 4, r.base), F(R(3, 29, 54, 1, r.sh)), R(5, 15, 50, 5, r.base), F(R(5, 19, 50, 1, r.sh)));
  out.push(T([[0, 6], [6, 10], [30, 11], [54, 10], [60, 6], [58, 15], [30, 16], [2, 15]], ink.base), F(T([[2, 13], [30, 14.4], [58, 13], [58, 15], [30, 16], [2, 15]], ink.deep)));
  out.push(R(26, 18, 8, 9, '#3a2d4f'), F(R(27.4, 19.4, 5.2, 6.2, '#ffe9a6')));
  for (const x of [16, 24, 34, 42]) out.push(T([[x, 31], [x + 3, 31], [x + 1.5, 35], [x + 3.4, 38], [x + 0.4, 38]], '#ffffff'));
  return out;
}

// Moonlit Ridge: an arch lashed together from pine logs.
function logArch() {
  const wood = ramp('#8a7a9a', 0.85);
  const out = [];
  out.push(...bark([[10, 82], [10, 16]], () => 4, wood, 1), ...bark([[50, 82], [50, 16]], () => 4, wood, 2), ...bark([[2, 18], [58, 14]], () => 3.4, wood, 3), ...bark([[6, 26], [54, 24]], () => 2.4, wood, 4));
  for (const x of [10, 50]) out.push(F(R(x - 4, 22, 8, 2, '#e8d29a')), F(R(x - 4, 26, 8, 1.4, '#e8d29a')));
  out.push(T([[26, 12], [30, 4], [34, 12]], '#5f9e98'), T([[24, 14], [30, 8], [36, 14]], '#4f8f8a'));
  return out;
}

// Serpent Springs: a bamboo frame with a paper charm hanging in the middle.
function bambooGate() {
  const g = ramp('#7fcf9a', 0.85);
  const out = [];
  for (const x of [8, 13, 47, 52]) {
    out.push(R(x - 2, 14, 4, 68, g.base), F(R(x + 0.6, 14, 1.4, 68, g.sh)));
    for (let y = 24; y < 80; y += 14) out.push(F(R(x - 2, y, 4, 1.2, g.deep)));
  }
  out.push(R(2, 16, 56, 4, g.base), F(R(2, 19, 56, 1, g.sh)), R(4, 26, 52, 3, g.base), F(R(4, 28, 52, 1, g.sh)));
  out.push(R(29.6, 20, 0.8, 4, '#e8d29a'), R(26, 24, 8, 12, '#fffaf0'), F(R(27.4, 26, 5.2, 1.2, '#ff8a8a')), F(R(27.4, 29, 5.2, 0.8, '#ff8a8a')), F(R(27.4, 31.4, 5.2, 0.8, '#ff8a8a')));
  return out;
}

// Frozen Peak: blocks of ice in an arch, a cap of snow and icicles hanging from it.
function iceArch() {
  const ice = ramp('#cfe8ff', 0.7);
  const out = [];
  for (const x0 of [3, 45]) for (let y = 26; y < 82; y += 11) out.push(R(x0, y, 12, 10, ice.base), F(R(x0 + 8, y, 4, 10, ice.sh)), F(R(x0 + 1, y + 1, 3, 1, '#ffffff')));
  const pts = archPts(22, 6);
  pts.slice(0, -1).forEach(([x, y], i) => {
    const [x2, y2] = pts[i + 1];
    out.push(T([[x - 1, y - 4], [x2 + 1, y2 - 4], [x2 + 1, y2 + 5], [x - 1, y + 5]], ice.base), F(T([[x - 1, y + 3], [x2 + 1, y2 + 3], [x2 + 1, y2 + 5], [x - 1, y + 5]], ice.sh)));
  });
  out.push(...archPts(23, 8).map(([x, y]) => E(x, y - 5, 5, 3, '#fbfdff')));
  for (const [x, y, l] of [[14, 22, 6], [22, 12, 5], [38, 12, 7], [46, 22, 5]]) out.push(T([[x - 1.4, y], [x + 1.4, y], [x, y + l]], '#e6f4ff'));
  return out;
}
