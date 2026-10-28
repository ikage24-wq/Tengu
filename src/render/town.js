// Towns: the buildings behind each NPC (market stalls, guild halls, an info kiosk), houses along
// the street, a fountain on the plaza, townsfolk and other "players" walking about and chatting,
// and each NPC's own idle routine. Everything is drawn from time alone, so nothing here keeps
// state; layouts are seeded so they never jitter.

import { drawArenaBooth } from './arena.js';
import { wornGear } from '../core/character.js';
import { settings } from '../core/settings.js';
import { R, E, T, F, mix, snap, footShadow, slopeAt } from './pixel.js';
import { ramp, planks, stones, windowPane, lightUL, leanFrame, swing, pivoted, wallShade, beam, gable } from './propkit.js';
import { art, place, houseArt, mushHouseArt, treehouseArt, tentArt, hitsLedge } from './scenery.js';
import { drawHero, HAIR_STYLES, PICKABLE_EYE_STYLES, OUTFIT_STYLES, BROW_STYLES } from './hero.js';
import { createAnim, stepAnim } from './animator.js';
import { drawBubble } from '../ui/chat.js';
import { text, box } from '../ui/kit.js';
import { NPCS } from '../data/npcs.js';
import { groundAt } from '../world/physics.js';
import { ITEMS } from '../data/items.js';

const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const pick = (list, seed) => list[Math.floor(seed * list.length) % list.length];
const TAU = Math.PI * 2;

// ---------- Shared building parts ----------
// Buildings are shaded by hand with the prop kit's ramps under the one world light from the upper
// left (no automatic shade, which cut a hard strip down every wall): eaves cast a soft band on
// the wall below, a facade turns away only in a thin edge on the right, posts are lit on the left.
// Cloth (awnings, banners, notices) hangs as chains that ride the shared wind, cached in a few
// poses.

const POSES = 5;
// The cached wind pose (0 ... POSES - 1) at world x, and the lean (-0.6 ... 0.9) it stands for.
const windPose = (time, wx, lag = 0, seed = 0) => leanFrame(time, wx, POSES, lag, seed);
const poseLean = (p) => (p / (POSES - 1)) * 1.5 - 0.6;

// A round wooden post: lit left, shaded right, a grain stroke.
function post(x, y, w, h, wood) {
  const r = ramp(wood);
  return [R(x, y, w, h, r.base), F(R(x, y, w * 0.3, h, r.hi)), F(R(x + w * 0.66, y, w * 0.34, h, r.sh)), F(R(x + w * 0.42, y + h * 0.3, 0.5, h * 0.22, r.sh))];
}

// A cloth banner hanging from a rod as a chain: each segment swings out a little more than the
// one above it under the wind's lean `s`, and a ripple `ph` (0 ... 1) runs down it. Swallowtail
// foot, the right third in shade.
function banner(x, y, w, h, s, ph, c, rod) {
  const r = ramp(c, 0.8);
  const L = [];
  const Rt = [];
  const n = 5;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const dx = s * 2.4 * u * u + Math.sin(u * 3.2 - ph * TAU) * 0.6 * u;
    L.push([x + dx, y + h * u]);
    Rt.push([x + w + dx - Math.max(0, s) * 0.8 * u, y + h * u - s * 0.8 * u]);
  }
  const notch = [(L[n][0] + Rt[n][0]) / 2, (L[n][1] + Rt[n][1]) / 2 - 4];
  const mid = L.map(([lx, ly], i) => [lx + (Rt[i][0] - lx) * 0.64, ly + (Rt[i][1] - ly) * 0.64]);
  return [
    T([...L, notch, ...[...Rt].reverse()], c),
    F(T([...mid.slice(0, n), notch, ...Rt.slice(0, n).reverse()], r.sh)),
    F(T([L[0], Rt[0], [Rt[1][0], Rt[1][1] - 1], [L[1][0], L[1][1] - 1]], r.hi)),
    ...beam(x - 1.2, y - 1.4, w + 2.4, 2, rod),
  ];
}

// ---------- Stalls ----------
// A market stall: posts, a striped scalloped awning, a cloth back, and a counter with goods.

const potion = (x, c) => [R(x - 1.2, 37, 2.4, 3, c), R(x - 1.7, 35.4, 3.4, 1.8, '#c99a6b'), E(x, 43.4, 3.4, 4, c), F(E(x - 1.2, 42.4, 0.9, 1.4, '#ffffff'))];
const star = (x, y, r, c) => F(T([[x, y - r], [x + r * 0.3, y - r * 0.3], [x + r, y], [x + r * 0.3, y + r * 0.3], [x, y + r], [x - r * 0.3, y + r * 0.3], [x - r, y], [x - r * 0.3, y - r * 0.3]], c));

const STALLS = {
  goods: {
    awning: ['#ff9ec0', '#ffffff'], back: '#fff1f6', wood: '#c99a6b', cloth: '#ffc2d6',
    goods: () => [
      R(14, 31, 60, 2, '#c99a6b'), E(20, 29, 2.6, 2.6, '#ffe36b'), E(30, 29, 2.6, 2.6, '#8fd3ff'), E(58, 29, 2.6, 2.6, '#9be08f'), E(68, 29, 2.6, 2.6, '#ff9ec0'),
      ...potion(18, '#ff6b8a'), ...potion(27, '#ffab5c'), ...potion(36, '#6fb8ff'), ...potion(52, '#ff6b8a'), ...potion(61, '#c9a6ff'),
      R(67, 44, 12, 4, '#fff3d6'), E(67, 46, 1.6, 2, '#e6d2a8'), E(79, 46, 1.6, 2, '#e6d2a8'),
    ],
  },
  forge: {
    awning: ['#e0504d', '#4a4466'], back: '#5a5470', wood: '#8a6040', cloth: '#7a5238',
    goods: () => [
      // Tools hanging on the back wall.
      R(20, 28, 1.6, 12, '#8a6040'), R(16.5, 27, 8.6, 4, '#aeb9cf'),
      R(32, 28, 1.4, 14, '#e6edf7'), R(29, 40, 7.4, 1.6, '#ffd66b'),
      R(58, 28, 1.4, 14, '#e6edf7'), R(55, 40, 7.4, 1.6, '#ffd66b'),
      T([[68, 28], [74, 30], [74, 38], [68, 42], [62, 38], [62, 30]], '#e0a93b'), F(R(67.4, 31, 1.2, 8, '#ffffff')), F(R(64, 34, 8, 1.2, '#ffffff')),
      // A helmet and a sword on the counter.
      E(26, 45, 6, 5, '#c7ced9'), R(20, 45, 12, 3, '#c7ced9'), F(R(25.4, 41, 1.2, 6, '#8d95a5')),
      R(40, 44.4, 20, 2, '#e6edf7'), R(58, 43, 2, 5, '#ffd66b'), R(60, 44.4, 5, 2, '#7a5238'),
    ],
  },
  magic: {
    awning: ['#9a72e0', '#3b2f6e'], back: '#4a3f86', wood: '#7a5238', cloth: '#7a5cc8',
    goods: (f) => [
      star(20, 32, 3, '#ffe36b'), star(66, 30, 2.4, '#ffffff'), star(50, 28, 1.8, '#ffe36b'), F(E(32, 34, 2.4, 2.4, '#ffe36b')), F(E(33, 33.4, 2.4, 2.4, '#4a3f86')),
      R(15, 42, 13, 3.2, '#ff9ec0'), R(16, 39, 11, 3.2, '#8fd3ff'), R(15, 36, 12, 3.2, '#ffd66b'),
      R(38, 46, 14, 3, '#7a5238'), E(45, 40, 7, 7, '#bfe6ff'), F(E(43, 37.5, 2, 2.4, '#ffffff')), F(E(47, 42, 1.4, 1.2, '#c9a6ff')),
      R(64, 38, 3.4, 10, '#fff6e6'), F(E(65.7, 36 - (f % 2) * 0.6, 1.5, 2.4, '#ffcf3b')), F(E(65.7, 36.6, 0.7, 1.2, '#ffffff')),
    ],
  },
  cart: {
    awning: ['#5fd3a0', '#ffffff'], back: '#e9fbf2', wood: '#c99a6b', cloth: '#9fe0c4',
    goods: () => [
      // Fish hanging from the awning.
      ...[30, 40, 50].flatMap((x) => [R(x - 0.3, 24, 0.6, 4, '#7a5238'), T([[x, 28], [x + 2.6, 32], [x, 36], [x - 2.6, 32]], '#8fd3ff'), T([[x, 35], [x + 2, 38], [x - 2, 38]], '#8fd3ff'), F(E(x - 0.8, 30.6, 0.6, 0.6, '#3a2d4f'))]),
      R(12, 39, 22, 9, '#c99a6b'), F(R(12, 43, 22, 0.8, '#a8764a')),
      ...[15, 20, 25, 30].map((x, i) => E(x, 38, 2.8, 2.6, i % 2 ? '#ff6b6b' : '#ff8a7a')),
      R(54, 39, 22, 9, '#c99a6b'), F(R(54, 43, 22, 0.8, '#a8764a')),
      ...[57, 62, 67, 72].map((x) => E(x, 38, 2.8, 2.6, '#ffb03b')),
      E(44, 44, 6, 5, '#e6d2a8'), F(R(41, 39, 6, 1.2, '#c9a878')),
    ],
  },
  salon: {
    awning: ['#ff8fc1', '#ffffff'], back: '#fff1f8', wood: '#e6c9a0', cloth: '#ffd6ea',
    goods: (f) => [
      E(44, 35, 12, 11, '#ffd66b'), E(44, 35, 10, 9, '#d6f0ff'), F(T([[38, 31], [41, 29], [44, 35], [41, 37]], '#ffffff')),
      ...[18, 23, 66, 71].map((x, i) => [R(x - 1.6, 40, 3.2, 8, ['#ff9ec0', '#c9a6ff', '#8fd3ff', '#ffe36b'][i]), R(x - 0.8, 38, 1.6, 2, '#ffffff')]).flat(),
      R(30, 46, 10, 1.6, '#c9a6ff'), ...[0, 2, 4, 6, 8].map((d) => F(R(30.4 + d, 47.4, 0.8, 1.6, '#c9a6ff'))),
      E(58, 45, 3, 3, '#ffffff'), F(E(57 + (f % 2), 41, 2, 2, '#ff9ec0')), F(E(60, 42, 1.6, 1.6, '#ffe36b')),
    ],
  },
};

// `pose` the wind pose, `ph` (0 ... 3) the ripple running along the valance.
function stallArt(kind, pose, ph) {
  const S = STALLS[kind];
  return art(`stall|${kind}|${pose}|${ph}`, 88, 74, () => {
    const s = poseLean(pose);
    const back = ramp(S.back, 0.6);
    const cloth = ramp(S.cloth, 0.8);
    const wood = ramp(S.wood);
    // The cloth back in soft folds, in the awning's shadow at the top.
    const out = [R(10, 24, 68, 28, S.back)];
    for (let i = 0; i < 5; i++) out.push(F(R(17 + i * 13, 27, 1.2, 24, back.sh)), F(R(18.2 + i * 13, 27, 0.8, 24, back.hi)));
    out.push(F(R(10, 24, 68, 5, back.sh)), F(R(10, 29, 68, 1.2, mix(S.back, back.sh, 0.5))));
    out.push(...post(7, 12, 4, 62, S.wood), ...post(77, 12, 4, 62, S.wood));
    // The awning slope in stripes, each lit along its top.
    const edge = (i, y) => { const v = (y - 8) / 16; return 10 + i * 8.5 + (2 + i * 10.5 - 10 - i * 8.5) * v; };
    for (let i = 0; i < 8; i++) {
      const c = S.awning[i % 2];
      const r = ramp(c, 0.7);
      out.push(T([[edge(i, 24), 24], [edge(i, 8), 8], [edge(i + 1, 8), 8], [edge(i + 1, 24), 24]], c));
      out.push(F(T([[edge(i, 11), 11], [edge(i, 8.6), 8.6], [edge(i + 1, 8.6), 8.6], [edge(i + 1, 11), 11]], r.hi)));
      out.push(F(T([[edge(i, 24), 24], [edge(i, 21.6), 21.6], [edge(i + 1, 21.6), 21.6], [edge(i + 1, 24), 24]], r.sh)));
    }
    out.push(...beam(8, 5, 72, 4, ramp(S.awning[0]).sh));
    // The valance: scallops hanging off the awning's edge, a chain the wind lifts and ripples,
    // those further along a beat later.
    for (let i = 0; i < 8; i++) {
      const c = S.awning[i % 2];
      const r = ramp(c, 0.7);
      const dx = s * 1.3 + 0.55 * Math.sin(i * 0.9 - (ph * Math.PI) / 2);
      const dy = -Math.max(0, s) * 1.1 + 0.35 * Math.cos(i * 0.9 - (ph * Math.PI) / 2);
      const cx = 7.25 + i * 10.5 + dx * 0.6;
      out.push(T([[cx - 5.25, 23.4], [cx + 5.25, 23.4], [cx + 5 + dx * 0.4, 25 + dy], [cx + dx * 0.4, 27.6 + dy], [cx - 5 + dx * 0.4, 25 + dy]], c));
      out.push(F(T([[cx + 1 + dx * 0.4, 26.6 + dy], [cx + 4.4 + dx * 0.4, 25 + dy], [cx + 5.25, 23.4], [cx + 3, 24.6 + dy * 0.5]], r.sh)));
    }
    out.push(...lightUL(S.goods(ph % 2), 0.8));
    // The counter: boards with the lit top, a cloth panel in the top's shadow.
    out.push(...planks(4, 50, 80, 24, wood, 6, kind.length, true), ...beam(2, 48, 84, 4, mix(S.wood, wood.hi, 0.4)), R(10, 56, 68, 14, S.cloth));
    out.push(F(R(10, 56, 68, 1.6, cloth.sh)));
    for (let i = 0; i < 6; i++) out.push(F(E(15.6 + i * 11.3, 56.6, 5.6, 2.4, cloth.sh)), F(R(12.6 + i * 11.3, 60, 0.8, 9, cloth.hi)));
    return out;
  }, false);
}

// ---------- Guild halls ----------

const HALLS = {
  archer: { wall: '#f0d6a8', trim: '#c99a6b', roof: '#7fd1a8', banner: '#5fbf7a', door: '#8a6040' },
  warrior: { wall: '#f2d0a0', trim: '#c97f4f', roof: '#d9a46b', banner: '#e0504d', door: '#7a5238' },
  mage: { wall: '#ece4ff', trim: '#b9a7ff', roof: '#7f8cff', banner: '#9a72e0', door: '#6a52b4' },
  thief: { wall: '#5d5285', trim: '#3b3650', roof: '#2e2a44', banner: '#8f6cb0', door: '#2a2540' },
};

function emblem(kind, cx, cy) {
  switch (kind) {
    case 'archer': return [E(cx, cy, 6, 6, '#ffffff'), F(E(cx, cy, 4.4, 4.4, '#ff6b8a')), F(E(cx, cy, 2.8, 2.8, '#ffffff')), F(E(cx, cy, 1.3, 1.3, '#ff6b8a')), F(R(cx - 7, cy - 0.4, 12, 0.8, '#8a6040')), F(T([[cx + 5, cy], [cx + 2.6, cy - 1.6], [cx + 2.6, cy + 1.6]], '#e6edf7'))];
    case 'warrior': return [T([[cx - 5.5, cy - 6], [cx + 5.5, cy - 6], [cx + 5.5, cy + 1], [cx, cy + 6.5], [cx - 5.5, cy + 1]], '#5a6fb0'), F(R(cx - 0.9, cy - 7, 1.8, 9, '#ffffff')), F(T([[cx - 0.9, cy - 7], [cx, cy - 9], [cx + 0.9, cy - 7]], '#ffffff')), F(R(cx - 3.6, cy + 2, 7.2, 1.4, '#ffd66b')), F(R(cx - 0.7, cy + 3.4, 1.4, 3, '#7a5238'))];
    case 'mage': return [E(cx, cy, 6.4, 6.4, '#3b2f6e'), star(cx, cy, 4.8, '#ffe36b'), F(E(cx + 2.6, cy - 3, 0.8, 0.8, '#ffffff'))];
    default: return [E(cx, cy, 6.4, 6.4, '#2a2540'), F(E(cx - 1, cy, 4.4, 4.4, '#fff3a6')), F(E(cx + 1, cy - 1, 3.8, 3.8, '#2a2540')), F(T([[cx + 3, cy + 5], [cx + 5, cy - 4], [cx + 6, cy - 4], [cx + 4.6, cy + 5]], '#e6edf7'))];
  }
}

function hallArt(kind, pose, ph) {
  const S = HALLS[kind];
  const W = 116;
  const H = 104;
  return art(`hall|${kind}|${pose}|${ph}`, W, H, () => {
    const out = [];
    const top = kind === 'mage' ? 40 : 36;
    const wr = ramp(S.wall, 0.7);
    const rr = ramp(S.roof, 0.8);
    // Walls: dressed stone for the warrior and mage halls, boards for the lodge and the den.
    if (kind === 'warrior' || kind === 'mage') out.push(...stones(12, top, W - 24, H - top, wr, kind.length, { rowH: 8, blockW: 15 }));
    else out.push(...planks(12, top, W - 24, H - top, wr, 9, kind.length));
    out.push(...wallShade(12, top + 2, W - 24, H - top - 2, wr, 3.4));
    out.push(...beam(10, top - 2, W - 20, 4, S.trim), ...beam(10, H - 4, W - 20, 4, S.trim));
    // Roof by style.
    if (kind === 'warrior') {
      out.push(R(8, top - 10, W - 16, 10, S.roof), F(R(8, top - 10, W - 16, 1.2, rr.hi)), F(R(8, top - 3, W - 16, 3, rr.sh)));
      for (let x = 8; x < W - 10; x += 12) out.push(R(x, top - 16, 7, 7, S.roof), F(R(x, top - 16, 7, 1.2, rr.hi)), F(R(x, top - 16, 1.2, 7, rr.hi)), F(R(x + 5.4, top - 14.8, 1.6, 5.8, rr.sh)), F(R(x + 1, top - 9, 7, 1.4, rr.sh)));
    } else if (kind === 'mage') {
      out.push(...gable(4, W - 4, top + 2, 2, S.roof, 3));
      out.push(star(W / 2, 22, 5, '#ffe36b'), star(30, top - 6, 2, '#ffffff'), star(86, top - 8, 2.4, '#ffffff'));
    } else {
      out.push(...gable(2, W - 2, top + 4, top - 30, S.roof, kind.length));
    }
    // The door, open and warmly lit: the left jamb inside in shade, light spilling on the step.
    const dx = W / 2;
    out.push(R(dx - 14, H - 40, 28, 40, S.trim), E(dx, H - 40, 14, 10, S.trim), F(R(dx - 14, H - 40, 1.4, 40, ramp(S.trim).hi)));
    out.push(R(dx - 11, H - 38, 22, 38, '#5a3f2a'), E(dx, H - 38, 11, 8, '#5a3f2a'));
    out.push(F(R(dx - 9, H - 36, 18, 36, '#ffcf7a')), F(E(dx, H - 36, 9, 6.4, '#ffcf7a')), F(E(dx + 1, H - 18, 7, 14, '#ffe6a8')), F(R(dx - 9, H - 36, 2.4, 36, '#e8a560')), F(E(dx, H - 36, 9, 2.4, '#e8a560')));
    out.push(F(R(dx - 12, H - 4, 24, 1.4, '#ffe6a8')));
    // Windows, lit from inside, with flower boxes.
    for (const wx of [24, W - 24]) {
      out.push(...windowPane(wx - 6, top + 14, 12, 12, S.trim, '#ffcf7a', '#fff3c4'));
      out.push(...beam(wx - 9, top + 28, 18, 3, ramp(S.trim).sh), F(R(wx - 9, top + 31, 18, 1.4, wr.sh)));
      out.push(F(E(wx - 4, top + 27.4, 1.6, 1.6, '#ff9ec0')), F(E(wx, top + 27, 1.6, 1.6, '#ffe36b')), F(E(wx + 4, top + 27.4, 1.6, 1.6, '#9be08f')));
    }
    // Banners either side of the door, swinging in the wind.
    const s = poseLean(pose);
    for (const [k, bx] of [dx - 24, dx + 18].entries()) out.push(...banner(bx, top + 5, 6, 19, s * (k ? 0.85 : 1), (ph + k) / 4, S.banner, S.trim));
    // The guild emblem over the door.
    out.push(E(dx, H - 56, 9, 9, '#ffffff'), E(dx, H - 56, 8, 8, S.banner), F(E(dx + 1.6, H - 54.4, 6, 6, ramp(S.banner).sh)), F(E(dx - 0.6, H - 56.6, 6.6, 6.6, S.banner)), ...emblem(kind, dx, H - 56));
    return out;
  }, false);
}

// ---------- Small buildings ----------

function kioskArt(pose) {
  return art(`kiosk|${pose}`, 70, 76, () => {
    const s = poseLean(pose);
    const board = ramp('#f0d6a8', 0.7);
    const out = [...post(6, 20, 3.4, 56, '#c99a6b'), ...post(61, 20, 3.4, 56, '#c99a6b'), ...gable(0, 70, 22, 4, '#7fd1a8', 7), ...beam(4, 22, 62, 4, '#5fbf8a')];
    out.push(...planks(10, 28, 50, 32, board, 5, 3, true), F(R(10, 28, 50, 2.4, board.sh)), ...beam(9, 27, 52, 2, '#c99a6b'), ...beam(9, 59, 52, 2, '#c99a6b'));
    // Notices and a little map pinned to the board; the loose corner of one lifts in a gust.
    out.push(...lightUL([
      R(13, 31, 12, 10, '#ffffff'), F(R(15, 33, 8, 0.8, '#c9a6ff')), F(R(15, 35, 6, 0.8, '#c9a6ff')), F(E(19, 31, 1, 1, '#ff6b8a')),
      R(28, 30, 18, 14, '#d6f0ff'), F(E(33, 36, 3, 2.4, '#9be08f')), F(E(40, 39, 3.4, 2.4, '#9be08f')), F(R(34, 37, 6, 0.8, '#ffffff')), F(E(37, 30, 1, 1, '#ffe36b')),
      R(49, 32, 9, 12, '#fff3a6'), F(R(51, 35, 5, 0.8, '#ffab5c')), F(E(53.5, 32, 1, 1, '#5aa8ff')),
      R(14, 46, 14, 9, '#ffd6ea'), F(R(16, 49, 10, 0.8, '#ff8fc1')), F(E(21, 46, 1, 1, '#9be08f')),
      R(32, 47, 24, 9, '#ffffff'), F(R(34, 50, 18, 0.8, '#9c86b8')), F(R(34, 52.4, 12, 0.8, '#9c86b8')), F(E(44, 47, 1, 1, '#ff6b8a')),
    ], 0.5));
    const lift = Math.max(0, s + 0.2) * 3;
    out.push(F(T([[56, 56], [56, 56 - 2 - lift], [52 - lift * 0.4, 56]], '#e6e0f4')), F(T([[56, 56 - 2 - lift], [56 + lift * 0.5, 54.4 - lift], [54.6, 56 - lift * 0.5]], '#ffffff')));
    return out;
  }, false);
}

function officeArt() {
  return art('office', 90, 82, () => {
    const wall = ramp('#e8f4ff', 0.6);
    const out = [...planks(8, 24, 74, 58, wall, 10, 7, true), ...wallShade(8, 25, 74, 57, wall, 3.4), ...gable(2, 88, 26, 4, '#6f9cff', 5)];
    // The door, lit inside.
    out.push(R(32, 50, 26, 32, '#4f6fae'), F(R(32, 50, 1.2, 32, '#7f9cd8')), F(R(34, 52, 22, 30, '#ffcf7a')), F(R(34, 52, 2.4, 30, '#e8a560')), F(R(34, 52, 22, 2, '#e8a560')), F(E(46, 70, 6, 10, '#ffe6a8')));
    // A life ring and an anchor sign.
    out.push(...lightUL([E(18, 50, 7, 7, '#ff6b6b')], 0.6), E(18, 50, 4, 4, '#ffffff'), F(E(18.6, 50.6, 3.4, 3.4, wall.sh)), F(R(12, 49, 2.4, 2.4, '#ffffff')), F(R(21.6, 49, 2.4, 2.4, '#ffffff')), F(R(17, 43.4, 2.4, 2.2, '#ffffff')), F(R(17, 54.6, 2.4, 2.2, '#ffffff')));
    out.push(...lightUL([E(45, 37, 8, 8, '#ffffff')], 0.6), F(R(44.4, 31, 1.4, 11, '#4f6fae')), F(R(41, 33, 8.4, 1.4, '#4f6fae')), F(T([[39.6, 39], [45, 43.4], [50.4, 39], [49, 38.6], [45, 41.6], [41, 38.6]], '#4f6fae')));
    out.push(...windowPane(66, 42, 8, 8, '#ffffff', '#ffcf7a', '#fff3c4'), ...beam(64, 51, 12, 2, '#ffffff'));
    return out;
  }, false);
}

function anvilArt() {
  return art('anvil', 24, 18, () => [
    T([[2, 4], [22, 4], [20, 8], [15, 9], [15, 14], [19, 18], [5, 18], [9, 14], [9, 9], [4, 8]], '#6d7484'),
    F(R(4, 4, 16, 1.4, '#aeb9cf')),
  ]);
}

// A flat-roofed adobe house: soft rounded stucco, beam ends casting little shadows, a deep-set door.
function adobeArt(seed) {
  const wall = pick(['#f2c48d', '#f6d3a8', '#e8b07a'], seed);
  return art(`adobe|${wall}`, 76, 62, () => {
    const r = ramp(wall, 0.7);
    const out = [R(8, 18, 60, 44, wall), E(14, 19, 6, 4, wall), E(62, 19, 6, 4, wall), R(6, 16, 64, 4, wall), F(R(6, 16, 64, 1.2, r.hi)), F(E(12.6, 17.6, 4, 2, r.hi))];
    out.push(...wallShade(8, 20, 60, 42, r, 2.2));
    // Plaster patches and a hairline crack.
    for (let i = 0; i < 5; i++) out.push(F(E(14 + hash(seed * 9 + i) * 48, 26 + hash(seed * 5 + i * 3) * 30, 2.6, 1.4, i % 2 ? mix(wall, r.hi, 0.5) : mix(wall, r.sh, 0.4))));
    out.push(F(T([[60, 40], [61, 44], [59.6, 47], [60.2, 47], [61.6, 44], [60.6, 40]], r.sh)));
    // Beam ends: lit on top, a shadow falling down and to the right of each.
    for (const x of [14, 26, 50, 62]) out.push(F(T([[x + 1, 23], [x + 3, 23], [x + 4.4, 26.4], [x + 2.4, 26.4]], r.sh)), R(x, 20, 3, 3, '#8a5a3c'), F(R(x, 20, 3, 0.9, '#b98058')), F(R(x + 1.2, 21.4, 0.8, 0.8, '#5e3a24')));
    // The door set deep in the wall: the left jamb and the arch in shade.
    out.push(R(30, 36, 16, 26, '#b5784a'), E(38, 36, 8, 6, '#b5784a'), F(R(32, 38, 12, 24, '#7a4a2b')), F(E(38, 38, 6, 4, '#7a4a2b')), F(R(32, 38, 2.2, 24, '#5e3820')), F(E(38, 36.6, 5, 2, '#5e3820')));
    out.push(...windowPane(15.4, 31.4, 7.2, 7.2, '#5fb8d8', '#ffcf7a', '#fff3c4'), ...windowPane(53.4, 31.4, 7.2, 7.2, '#5fb8d8', '#ffcf7a', '#fff3c4'));
    // A cloth awning over the door, its shadow on the wall.
    out.push(F(T([[27, 34], [49, 34], [50.4, 37], [28.4, 37]], r.sh)), T([[26, 34], [38, 28], [50, 34]], '#e0504d'), F(T([[26, 34], [32, 31], [32, 34]], '#ffd66b')), F(T([[38, 28], [50, 34], [44, 34]], '#b8363e')));
    out.push(...lightUL([E(68, 57, 4, 4, '#8fbf6a'), R(66, 58, 4, 4, '#c97f4f')], 0.6), F(R(67.6, 53.6, 0.8, 1.4, '#ffe36b')));
    return out;
  }, false);
}

// The plaza fountain: a stone basin and a column with a bowl on top. `f` (0 ... 5) steps the rings
// spreading on the basin water; the falling water itself is drawn live over it.
const FOUNTAIN_FRAMES = 6;
function fountainArt(f) {
  return art(`fountain|${f}`, 72, 42, () => {
    const st = ramp('#d6cce6', 0.7);
    const out = [E(36, 36, 34, 6, st.sh), ...stones(2, 26, 68, 10, st, 4, { rowH: 5, blockW: 9 }), F(R(2, 26, 3, 10, st.hi)), F(E(36, 37.4, 30, 3, st.deep))];
    // The rim and the water inside, darker under the far rim.
    out.push(E(36, 26, 34, 6, st.hi), F(E(36, 26.4, 31.4, 4.8, st.base)), F(E(36, 26.8, 30, 4.2, '#8fd3ff')), F(E(36, 25.2, 28, 2.2, '#6fbbe8')), F(E(36, 27.4, 26, 2.8, '#8fd3ff')));
    for (let k = 0; k < 2; k++) {
      const u = (f / FOUNTAIN_FRAMES + k / 2) % 1;
      const rx = 8 + u * 18;
      out.push(F(E(36, 27, rx, rx * 0.15 + 0.6, u > 0.7 ? '#bfe6ff' : '#d6f0ff')), F(E(36, 27.2, rx - 1.2, rx * 0.15, '#8fd3ff')));
    }
    out.push(F(E(22 + (f % 3) * 3, 27.6, 3, 0.6, '#ffffff')), F(E(50 - (f % 2) * 4, 26.6, 2, 0.5, '#ffffff')));
    // The column, round: lit left, shaded right, a band near the top.
    out.push(R(31, 8, 10, 18, st.base), F(R(31, 8, 3, 18, st.hi)), F(R(38.4, 8, 2.6, 18, st.sh)), F(R(31, 12, 10, 1, st.sh)), F(R(31, 24, 10, 2, st.deep)));
    // The top bowl, brimming.
    out.push(E(36, 9, 9.4, 3, st.sh), E(36, 7, 9, 2.4, st.hi), F(E(36, 7.2, 7.4, 1.6, '#8fd3ff')), F(E(34, 6.8, 3, 0.6, '#d6f0ff')), E(36, 4, 1.8, 2, st.base), F(E(35.4, 3.4, 0.8, 0.8, st.hi)));
    return out;
  }, false);
}

// ---------- The street ----------

const STREET = {
  town: [],
  harbor: ['house', 'house'],
  crag: ['adobe', 'tent', 'adobe'],
  grove: ['treehouse', 'mushhouse'],
};

// The stall or hall art for this moment: its wind pose at world x `wx` and the ripple frame.
function buildingArt(kind, time, wx = 0) {
  const pose = windPose(time, wx);
  const ph = Math.floor(time * 4) % 4;
  if (STALLS[kind]) return stallArt(kind, pose, ph);
  if (HALLS[kind]) return hallArt(kind, pose, ph);
  if (kind === 'kiosk') return kioskArt(windPose(time, wx, 0.2));
  if (kind === 'office') return officeArt();
  return null;
}

// A wooden sign hanging from two chains, with the building's name, swinging from its hooks in the
// wind a moment after the gusts pass.
function hangingSign(ctx, x, y, label, time, wx = x) {
  ctx.font = 'bold 7px "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  const w = Math.round(ctx.measureText(label).width + 12);
  const r = ramp('#f0cf9a', 0.8);
  pivoted(ctx, x, y - 6, swing(time, wx, 1.3, x * 0.01), () => {
    const bx = Math.round(x - w / 2);
    // Chains of small links from the hooks.
    for (const cx of [bx + 4, bx + w - 5]) {
      ctx.fillStyle = '#8a6a4a';
      for (let k = 0; k < 3; k++) ctx.fillRect(cx, y - 6 + k * 2, 1, 1.4);
      ctx.fillStyle = '#c9a676';
      ctx.fillRect(cx, y - 7, 1, 1);
    }
    // The board: lit top edge, shaded foot, a grain line or two.
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(bx, y, w, 11, 3);
    ctx.fillStyle = r.base;
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = r.hi;
    ctx.fillRect(bx, y, w, 1.6);
    ctx.fillStyle = r.sh;
    ctx.fillRect(bx, y + 8.6, w, 2.4);
    ctx.fillRect(bx + 3, y + 3, w * 0.22, 0.6);
    ctx.fillRect(bx + w * 0.6, y + 7, w * 0.25, 0.6);
    ctx.restore();
    ctx.strokeStyle = r.deep;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx + 0.5, y + 0.5, w - 1, 10, 3);
    ctx.stroke();
    text(ctx, label, x, y + 8, { size: 7, bold: true, align: 'center', color: '#6a4a2b' });
  });
}

// Water spilling from the fountain's top bowl into the basin, flowing (dashes running down each
// sheet), a bubbling jet at the top, and splashes where the sheets land.
function fountainWater(ctx, x, gy, time) {
  ctx.save();
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + side * 8, gy - 35);
    ctx.quadraticCurveTo(x + side * 13, gy - 35, x + side * 15, gy - 17);
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = '#8fd3ff';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.globalAlpha = 0.9;
    ctx.setLineDash([3, 5]);
    ctx.lineDashOffset = -time * 26;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
    const u = (time * 3 + (side > 0 ? 0.5 : 0)) % 1;
    ctx.globalAlpha = 0.8 * (1 - u);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(x + side * (15 + u * 3)), Math.round(gy - 18 - Math.sin(u * Math.PI) * 3), 1, 1);
    ctx.fillRect(Math.round(x + side * (15 - u * 2)), Math.round(gy - 18 - Math.sin(u * Math.PI) * 2), 1, 1);
  }
  for (let k = 0; k < 4; k++) {
    const u = (time * 1.4 + k / 4) % 1;
    ctx.globalAlpha = 0.9 * (1 - u * 0.6);
    ctx.fillStyle = k % 2 ? '#bfe6ff' : '#ffffff';
    ctx.fillRect(Math.round(x + (k - 1.5) * u * 4), Math.round(gy - 40 - Math.sin(u * Math.PI) * 5), 1.5, 1.5);
  }
  ctx.restore();
}

// Draws houses, NPC buildings, and the fountain along the street. Called from the scenery, after
// the ground and before ledges and props.
export function drawStreet(ctx, map, cam, width, time) {
  if (!map.isTown) return;
  const ground = (wx) => snap(groundAt(map, wx) - cam.y);
  const theme = map.theme;
  // Houses fill the gaps between NPCs, portals, and the plaza.
  const kinds = STREET[theme] ?? [];
  if (kinds.length) {
    for (let wx = 120, i = 0; wx < map.width - 100; wx += 150, i++) {
      if (map.npcs.some((n) => Math.abs(n.x - wx) < 110) || map.portals.some((p) => Math.abs(p.x - wx) < 70) || Math.abs((map.plaza ?? -999) - wx) < 90) continue;
      // Houses stand on level ground, clear of the town's landmarks.
      if (Math.abs(groundAt(map, wx - 36) - groundAt(map, wx + 36)) > 2) continue;
      if ((map.deco ?? []).some(([, dx, , dy]) => dy == null && Math.abs(dx - wx) < 90)) continue;
      const x = wx - cam.x;
      if (x < -60 || x > width + 60) continue;
      const seed = hash(wx * 0.13 + map.width);
      const kind = pick(kinds, seed);
      const s = kind === 'house' ? houseArt(seed) : kind === 'adobe' ? adobeArt(seed) : kind === 'tent' ? tentArt(pick(['#e0504d', '#ffab5c', '#5fb8d8'], seed)) : kind === 'treehouse' ? treehouseArt(seed) : mushHouseArt(seed);
      // Never under a ledge it would run up into (a roof or cap through the planks).
      if (hitsLedge(map, wx, s.w, groundAt(map, wx), s.h)) continue;
      const hy = ground(wx);
      place(ctx, s, snap(x), hy);
      if (kind === 'house' || kind === 'adobe') chimneySmoke(ctx, x + (kind === 'house' ? 17 : -24), hy - (kind === 'house' ? 84 : 46), time, seed);
    }
  }
  // The plaza fountain, with water arcing from the spout.
  if (map.plaza != null) {
    const x = snap(map.plaza - cam.x);
    const gy = ground(map.plaza);
    if (x > -60 && x < width + 60) {
      place(ctx, fountainArt(Math.floor(time * 5) % FOUNTAIN_FRAMES), x, gy);
      fountainWater(ctx, x, gy, time);
    }
  }
  // Each NPC's stall or hall, with its sign.
  for (const n of map.npcs) {
    const npc = NPCS[n.id];
    if (!npc.building) continue;
    const x = snap(n.x - cam.x);
    if (x < -80 || x > width + 80) continue;
    // The Boss Rush booth is drawn live (neon, chasing bulbs, spotlights).
    if (npc.building === 'arena') {
      drawArenaBooth(ctx, x, ground(n.x), time);
      continue;
    }
    const s = buildingArt(npc.building, time, n.x);
    if (!s) continue;
    const gy = ground(n.x);
    place(ctx, s, x, gy);
    if (npc.building === 'forge') forgeGlow(ctx, x, gy, time);
    if (npc.sign) hangingSign(ctx, x, gy - s.h - 10, npc.sign, time, n.x);
  }
}

function chimneySmoke(ctx, x, y, time, seed) {
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const u = (time * 0.3 + i / 3 + seed) % 1;
    ctx.globalAlpha = 0.45 * (1 - u);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + Math.sin(time + i) * 3 + u * 6, y - u * 24, 2.5 + u * 4, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function forgeGlow(ctx, x, gy, time) {
  ctx.save();
  const g = ctx.createRadialGradient(x, gy - 34, 2, x, gy - 34, 40);
  g.addColorStop(0, 'rgba(255,170,80,0.35)');
  g.addColorStop(1, 'rgba(255,170,80,0)');
  ctx.globalAlpha = 0.7 + 0.3 * Math.sin(time * 5);
  ctx.fillStyle = g;
  ctx.fillRect(x - 40, gy - 74, 80, 80);
  ctx.restore();
}

// ---------- NPC routines ----------
// Each NPC has their own idle loop: a pose (a move and its progress), a face, sometimes a fixed
// facing or a float, and extras drawn around them (juggled potions, sparks off the anvil, an
// arrow, a floating book...). `t` is the time in seconds.

function cycle(t, period, seed = 0) {
  return ((t + seed) % period + period) % period;
}

const ROUTINES = {
  mira(t) {
    const c = cycle(t, 5);
    return c < 1.1 ? { pose: 'cheer', progress: c / 1.1, face: 'grin' } : { face: 'smile' };
  },
  pip(t) {
    return {
      face: cycle(t, 6) < 2 ? 'excited' : 'grin',
      extra(ctx, x, y, tt) {
        const colors = ['#ff6b8a', '#6fb8ff', '#ffab5c'];
        for (let i = 0; i < 3; i++) {
          const u = (tt * 0.9 + i / 3) % 1;
          const px = x + Math.cos(u * TAU) * 8;
          const py = y - 44 - Math.abs(Math.sin(u * Math.PI)) * 14;
          ctx.fillStyle = colors[i];
          ctx.beginPath();
          ctx.arc(px, py, 2.6, 0, TAU);
          ctx.fill();
          ctx.fillStyle = '#c99a6b';
          ctx.fillRect(px - 1, py - 4, 2, 1.6);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px - 1.2, py - 1.2, 1, 1);
        }
      },
    };
  },
  lulu(t) {
    const c = cycle(t, 6);
    const twirl = c < 1;
    return {
      pose: twirl ? 'castspin' : null, progress: c, face: twirl ? 'excited' : 'sassy',
      extra(ctx, x, y, tt) {
        if (twirl) {
          for (let i = 0; i < 5; i++) {
            const a = c * TAU * 2 + (i / 5) * TAU;
            sparkle(ctx, x + Math.cos(a) * 14, y - 20 + Math.sin(a) * 5, 2, i % 2 ? '#ff9ec0' : '#ffffff');
          }
          return;
        }
        // Little scissors snipping by her hand.
        const snip = Math.abs(Math.sin(tt * 8)) * 0.5;
        ctx.save();
        ctx.translate(x + 9, y - 18);
        ctx.strokeStyle = '#8d96a8';
        ctx.lineWidth = 1.2;
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(-1.2 + s * snip) * 7, Math.sin(-1.2 + s * snip) * 7);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(Math.cos(1.9 + s * 0.4) * 2.6, Math.sin(1.9 + s * 0.4) * 2.6, 1.4, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
      },
    };
  },
  kestrel(t) {
    const c = cycle(t, 3.6);
    const drawing = c < 1;
    return {
      pose: drawing ? 'draw' : null, progress: Math.min(1, c), facing: 1, face: drawing ? 'cool' : 'smile',
      extra(ctx, x, y) {
        if (c < 0.6 || c > 1.3) return;
        const u = (c - 0.6) / 0.7;
        const ax = x + 12 + u * 70;
        ctx.globalAlpha = 1 - Math.max(0, u - 0.8) * 5;
        ctx.strokeStyle = '#8a6040';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(ax - 8, y - 22);
        ctx.lineTo(ax, y - 22);
        ctx.stroke();
        ctx.fillStyle = '#e6edf7';
        ctx.beginPath();
        ctx.moveTo(ax + 3, y - 22);
        ctx.lineTo(ax, y - 24);
        ctx.lineTo(ax, y - 20);
        ctx.fill();
        ctx.globalAlpha = 1;
      },
    };
  },
  brann(t) {
    const c = cycle(t, 3);
    const moves = [['slash', 0, 0.5], ['slash2', 0.8, 1.3], ['thrust', 1.7, 2.2]];
    const m = moves.find(([, a, b]) => c >= a && c < b);
    return m ? { pose: m[0], progress: (c - m[1]) / (m[2] - m[1]), face: 'angry' } : { face: 'cool' };
  },
  tora(t) {
    const c = cycle(t, 1.2);
    const swing = c < 0.6;
    return {
      pose: swing ? 'overhead' : null, progress: c / 0.6, facing: 1, face: 'grin',
      extra(ctx, x, y) {
        place(ctx, anvilArt(), x + 18, y);
        const hit = c - 0.42;
        if (hit < 0 || hit > 0.35) return;
        const u = hit / 0.35;
        for (let i = 0; i < 7; i++) {
          const a = -Math.PI / 2 + (i - 3) * 0.45;
          ctx.globalAlpha = 1 - u;
          ctx.fillStyle = i % 2 ? '#ffe36b' : '#ff8a3c';
          ctx.fillRect(x + 18 + Math.cos(a) * u * 14, y - 18 + Math.sin(a) * u * 14 + u * u * 8, 1.6, 1.6);
        }
        ctx.globalAlpha = 1;
      },
    };
  },
  elowen(t) {
    return {
      pose: 'pray', progress: 0.5, lift: 4 + Math.sin(t * 1.6) * 2, face: 'smile',
      extra(ctx, x, y, tt) {
        for (let i = 0; i < 4; i++) {
          const a = tt * 1.2 + (i / 4) * TAU;
          ctx.globalAlpha = 0.5 + 0.5 * Math.sin(a);
          sparkle(ctx, x + Math.cos(a) * 15, y - 24 + Math.sin(a) * 4, 1.8, '#fff3a6');
        }
        ctx.globalAlpha = 1;
      },
    };
  },
  nim(t) {
    const c = cycle(t, 7);
    const cast = c < 1;
    return {
      pose: cast ? 'castup' : null, progress: c, face: cast ? 'excited' : 'shy',
      extra(ctx, x, y, tt) {
        if (cast) {
          for (let i = 0; i < 6; i++) sparkle(ctx, x + Math.cos(i + c * 6) * 10, y - 40 - c * 20 + Math.sin(i * 2) * 6, 1.8, i % 2 ? '#c9a6ff' : '#ffffff');
          return;
        }
        // A spellbook floating open in front of her, its pages turning.
        const bx = x + 12;
        const by = y - 24 + Math.sin(tt * 2) * 1.5;
        ctx.fillStyle = '#7a5cc8';
        ctx.fillRect(bx - 7, by - 1, 14, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx - 6, by - 2, 5.6, 6);
        ctx.fillRect(bx + 0.4, by - 2, 5.6, 6);
        const flip = (tt * 0.8) % 1;
        if (flip < 0.3) {
          ctx.fillStyle = '#f3e8ff';
          const w = Math.cos((flip / 0.3) * Math.PI) * 5.6;
          ctx.fillRect(bx + 0.4 + Math.min(0, w), by - 2.6, Math.abs(w), 6);
        }
        ctx.fillStyle = '#c9a6ff';
        ctx.fillRect(bx - 5, by, 3.6, 0.6);
        ctx.fillRect(bx + 1.4, by + 1.4, 3.6, 0.6);
      },
    };
  },
  vex(t) {
    const c = cycle(t, 3);
    const flick = c < 0.4;
    return {
      pose: flick ? 'throw' : null, progress: c / 0.4, face: 'smug',
      extra(ctx, x, y) {
        if (c < 0.4 || c > 1.4) return;
        const u = (c - 0.4) / 1;
        const px = x + 8;
        const py = y - 26 - Math.sin(u * Math.PI) * 24;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(u * TAU * 3);
        ctx.fillStyle = '#e6edf7';
        ctx.fillRect(-0.8, -6, 1.6, 7);
        ctx.fillStyle = '#ffd66b';
        ctx.fillRect(-2.4, 1, 4.8, 1.2);
        ctx.fillStyle = '#7a5238';
        ctx.fillRect(-0.8, 2.2, 1.6, 3);
        ctx.restore();
      },
    };
  },
  rook(t) {
    const c = cycle(t, 8);
    const looking = c > 2 && c < 6;
    return {
      facing: looking ? (c < 4 ? 1 : -1) : null, face: looking ? 'cool' : 'grin',
      extra(ctx, x, y, tt, dir) {
        if (!looking) return;
        // A spyglass raised to his eye.
        ctx.save();
        ctx.translate(x + dir * 6, y - 31);
        ctx.rotate(dir * -0.15);
        ctx.fillStyle = '#c99a1f';
        ctx.fillRect(dir > 0 ? 0 : -14, -1.6, 14, 3.2);
        ctx.fillStyle = '#ffd66b';
        ctx.fillRect(dir > 0 ? 10 : -14, -2.2, 4, 4.4);
        ctx.fillStyle = '#bfe6ff';
        ctx.fillRect(dir > 0 ? 13.4 : -14, -1.4, 0.8, 2.8);
        ctx.restore();
      },
    };
  },
  marlo(t) {
    const c = cycle(t, 2.2);
    return {
      face: cycle(t, 8) < 1.2 ? 'excited' : 'smug', pose: cycle(t, 8) < 1.2 ? 'cheer' : null, progress: cycle(t, 8) / 1.2,
      extra(ctx, x, y) {
        if (c > 1) return;
        const py = y - 26 - Math.sin(c * Math.PI) * 18;
        const w = Math.abs(Math.cos(c * TAU * 3)) * 2.6 + 0.4;
        ctx.fillStyle = '#ffc94f';
        ctx.beginPath();
        ctx.ellipse(x + 9, py, w, 2.6, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 8.6, py - 1.4, 0.8, 1.4);
      },
    };
  },
};

export function npcRoutine(id, t) {
  return ROUTINES[id]?.(t) ?? {};
}

function sparkle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

// ---------- Townsfolk and other players ----------
// Villagers stroll up and down the street (drawn from time alone). Other players come from the
// bot population (world/bots.js): they walk, chat, run shops, wave, and come and go.

const VILLAGERS = 3;
const HAIR = ['#e9ebfa', '#ff9ec0', '#f5c95c', '#b9a7ff', '#7a5238', '#3b3650', '#9be08f', '#ffb38a', '#8fd3ff'];
const SKIN = ['#fff0e6', '#fbd9bf', '#e7b48f', '#c98e66', '#8a5a3c'];
const CLOTHES = ['#ffc2d6', '#bfe0ff', '#bff0dc', '#fff3a6', '#e0cfff', '#ffd0a8', '#ffffff'];

// Eye colours that stand out against each hair colour (never green on green or pink on pink):
// the iris is the face's accent, so it sits well away from the hair's hue.
const EYES_FOR = {
  '#e9ebfa': ['#5aa8ff', '#9b6cff', '#ff6b8a', '#3f9f5f'],
  '#ff9ec0': ['#4fcfb8', '#5aa8ff', '#3f9f5f'],
  '#f5c95c': ['#4fcfb8', '#5aa8ff', '#9b6cff'],
  '#b9a7ff': ['#e8a23c', '#4fcfb8', '#ff6b8a'],
  '#7a5238': ['#4fcfb8', '#5aa8ff', '#3f9f5f'],
  '#3b3650': ['#e8a23c', '#ff6b8a', '#4fcfb8'],
  '#9be08f': ['#ff6b8a', '#9b6cff', '#e8a23c'],
  '#ffb38a': ['#4fcfb8', '#5aa8ff', '#9b6cff'],
  '#8fd3ff': ['#ff6b8a', '#e8a23c', '#9b6cff'],
};
// Each villager wears their own calm resting face (they grin when they stop to look around).
const CALM_FACES = ['smile', 'smile', 'smug', 'shy', 'cool', 'cat'];

function lookFor(seed) {
  const hairColor = pick(HAIR, hash(seed + 2));
  return {
    hairStyle: pick(HAIR_STYLES, hash(seed + 1)), hairColor, skinTone: pick(SKIN, hash(seed + 3)),
    eyeColor: pick(EYES_FOR[hairColor], hash(seed + 4)), eyeStyle: pick(PICKABLE_EYE_STYLES, hash(seed + 5)),
    outfit: pick(OUTFIT_STYLES, hash(seed + 6)), outfitColor: pick(CLOTHES, hash(seed + 7)), face: pick(CALM_FACES, hash(seed + 8)),
    // Villagers wear every brow, and now and then an elf passes through.
    browStyle: pick(BROW_STYLES, hash(seed + 9)), earStyle: hash(seed + 10) < 0.15 ? 'elf' : 'round',
  };
}

const villagerCache = new Map();
function villagersOf(map) {
  let list = villagerCache.get(map.id);
  if (list) return list;
  const seed = map.width * 0.1 + map.id.length * 7;
  list = [];
  for (let i = 0; i < VILLAGERS; i++) {
    const a = 140 + hash(seed + i * 3) * (map.width - 480);
    list.push({ look: lookFor(seed + i * 11), a, b: a + 160 + hash(seed + i * 5) * 120, seed: hash(seed + i * 9) * 20 });
  }
  villagerCache.set(map.id, list);
  return list;
}

// Where a villager is at time t: walking between a and b with a pause at each end.
function stroll(p, t) {
  const speed = 22;
  const walk = (p.b - p.a) / speed;
  const pause = 3 + (p.seed % 3);
  const c = (t + p.seed) % (2 * walk + 2 * pause);
  if (c < walk) return { x: p.a + c * speed, walking: true, facing: 1 };
  if (c < walk + pause) return { x: p.b, walking: false, facing: 1, pausedFor: c - walk };
  if (c < 2 * walk + pause) return { x: p.b - (c - walk - pause) * speed, walking: true, facing: -1 };
  return { x: p.a, walking: false, facing: -1, pausedFor: c - 2 * walk - pause };
}

// Walkers get their own animation state, stepped by how far they actually moved since the last
// frame, so their legs keep pace with their feet (like the player's) and hair and capes follow.
const anims = new Map();
// A fallen hero (a party member down in a dungeon, or you): knocked up and back on an arc,
// turning over as they go, one small bounce on landing, then lying on their back while a little
// ghost rises out and bobs over them. `since` is the time since the fall, in seconds.
// When each fallen party member went down (renderer-side, so the world state stays clean).
const fellAt = new WeakMap();
const FALL_UP = 0.34;
const FALL_BOUNCE = 0.2;
export function drawFallen(ctx, look, gear, x, y, state, since) {
  const facing = state.facing ?? 1;
  const s = Math.max(0, since);
  const k = Math.min(1, s / FALL_UP);
  const ease = 1 - (1 - k) ** 2;
  // Up and back on the arc, the body turning onto its back; then a bounce a third as high.
  const lift = s < FALL_UP ? 11 * Math.sin(Math.PI * k) : s < FALL_UP + FALL_BOUNCE ? 3 * Math.sin((Math.PI * (s - FALL_UP)) / FALL_BOUNCE) : 0;
  const turn = ease * (s < FALL_UP ? 1 : 1 + 0.06 * Math.sin((Math.PI * (s - FALL_UP)) / FALL_BOUNCE));
  ctx.save();
  ctx.translate(snap(x - facing * 7 * ease), snap(y - 10 * ease - lift));
  ctx.rotate((-facing * Math.PI) / 2 * turn);
  drawHero(ctx, { ...look, face: 'pout' }, gear, 0, 5 * ease, { ...state, pose: 'idle', ready: false, hurt: s < FALL_UP, down: s >= FALL_UP });
  ctx.restore();
  // The ghost floats up out of the body after the bounce, fading in, then bobs.
  const g = (s - FALL_UP - FALL_BOUNCE - 0.25) / 0.5;
  if (g <= 0) return;
  const gx = x - facing * 7;
  const rise = Math.min(1, g);
  const bob = Math.sin(state.time * 3 + (state.seed ?? 0)) * 2 * rise;
  const gy = y - 16 - 12 * (1 - (1 - rise) ** 2) + bob;
  ctx.save();
  ctx.globalAlpha = 0.8 * rise;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(gx, gy, 5, Math.PI, 0);
  ctx.lineTo(gx + 5, gy + 6);
  ctx.lineTo(gx + 2, gy + 4);
  ctx.lineTo(gx, gy + 6);
  ctx.lineTo(gx - 2, gy + 4);
  ctx.lineTo(gx - 5, gy + 6);
  ctx.fill();
  ctx.fillStyle = '#3a2d4f';
  ctx.fillRect(gx - 2.5, gy - 1, 1.2, 1.6);
  ctx.fillRect(gx + 1.3, gy - 1, 1.2, 1.6);
  ctx.restore();
}

function animFor(key, x, facing, time, body = null) {
  let a = anims.get(key);
  if (!a) {
    a = { anim: createAnim(), x, t: time };
    anims.set(key, a);
  }
  const dt = Math.max(0, Math.min(0.1, time - a.t));
  const vx = dt > 0 ? (x - a.x) / dt : 0;
  a.x = x;
  a.t = time;
  // A jump in position (arriving through a portal) isn't walking.
  // Party members have real bodies, so they also stretch on take-off and squash on landing.
  stepAnim(a.anim, { vx: Math.abs(vx) > 400 ? 0 : vx, vy: body?.vy ?? 0, onGround: body ? body.onGround : true, rope: body?.rope ?? false, facing, y: body?.y ?? 0 }, dt);
  if (anims.size > 200) anims.delete(anims.keys().next().value);
  return a.anim;
}

// A steady number per walker (their position changes, so it can't come from that).
function seedOf(id) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return h;
}

function shadow(ctx, x, y, slope = 0) {
  footShadow(ctx, x, y, 12, slope);
}

// How steep the ground is under someone at world x.
const groundSlope = (map, wx) => (groundAt(map, wx + 6) - groundAt(map, wx - 6)) / 12;

// A player's shop: a picnic rug with a few wares, and their shop's name on a board above them.
function shopBooth(ctx, x, gy, bot, time, hovered) {
  const rugW = 46;
  ctx.fillStyle = '#ffd6ea';
  ctx.beginPath();
  ctx.ellipse(x, gy - 1, rugW / 2, 4, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#ff9ec0';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  ctx.stroke();
  ctx.setLineDash([]);
  bot.shop.items.slice(0, 3).forEach((it, i) => {
    const ix = x + (i === 0 ? -16 : i === 1 ? 14 : 20);
    ctx.fillStyle = ITEM_COLORS(it.id);
    ctx.beginPath();
    ctx.arc(ix, gy - 4, 3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ix - 1.2, gy - 5.6, 1, 1);
  });
  // The board, bobbing a touch.
  ctx.font = 'bold 7px "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  const w = Math.max(48, ctx.measureText(bot.shop.title).width + 14);
  const by = gy - 74 + Math.sin(time * 2 + bot.x * 0.01) * 1;
  box(ctx, x - w / 2, by, w, 14, { fill: hovered ? '#fff6c9' : '#ffffff', edge: '#ff9ec0', r: 5, width: 1.5 });
  box(ctx, x - w / 2 + 2, by + 2, 10, 10, { fill: '#ff9ec0', edge: null, r: 3 });
  text(ctx, '$', x - w / 2 + 7, by + 10, { size: 7, bold: true, align: 'center', color: '#ffffff' });
  text(ctx, bot.shop.title, x + 5, by + 10, { size: 7, bold: true, align: 'center', color: '#a8467a' });
}

const ITEM_COLORS = (id) => ITEMS[id]?.color ?? '#ffffff';

export function drawTownsfolk(ctx, map, cam, width, time, bots = [], hoverId = null) {
  if (!map.isTown || !settings.showCrowd) return;
  for (const p of villagersOf(map)) {
    const at = stroll(p, time);
    const x = snap(at.x - cam.x);
    const gy = snap(groundAt(map, at.x) - cam.y);
    if (x < -40 || x > width + 40) continue;
    const face = at.pausedFor != null && at.pausedFor < 1 ? 'grin' : p.look.face;
    shadow(ctx, x, gy, groundSlope(map, at.x));
    const anim = animFor(`v|${map.id}|${p.a}`, at.x, at.facing, time);
    drawHero(ctx, { ...p.look, face }, null, x, gy, { pose: at.walking ? 'walk' : 'idle', time: time + p.seed, seed: p.seed, facing: at.facing }, anim);
  }
  const said = [];
  for (const bot of bots) {
    const x = snap(bot.x - cam.x);
    if (x < -60 || x > width + 60) continue;
    const gy = snap(groundAt(map, bot.x) - cam.y);
    if (bot.shop) shopBooth(ctx, x, gy, bot, time, hoverId === bot.id);
    drawBot(ctx, bot, x, gy, time, hoverId === bot.id, said, groundSlope(map, bot.x));
  }
  if (settings.chatBubbles) for (const [x, y, b] of said) drawBubble(ctx, x, y, b.text, Math.min(1, b.t * 2));
}

// One player: login shimmer, shadow, the character in their pose, and their name tag (gold for
// pros, green with a heart for party members, guild underneath).
function drawBot(ctx, bot, x, y, time, hovered, said, slope = 0) {
  const fade = bot.state === 'logout' ? Math.max(0, bot.timer / 0.6) : 1 - bot.appear;
  if (bot.appear > 0 || bot.state === 'logout') {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + time * 3;
      ctx.globalAlpha = 1 - fade;
      sparkle(ctx, x + Math.cos(a) * 12, y - 20 + Math.sin(a) * 18, 2.2, i % 2 ? '#ffe36b' : '#ffffff');
    }
    ctx.globalAlpha = 1;
  }
  const body = bot.party ? bot.body : null;
  if (!body || body.onGround) shadow(ctx, x, y, body ? slopeAt(body.surface, body.x) : slope);
  const waving = bot.state === 'wave';
  let pose = waving ? 'cheer' : ['walk', 'leave', 'approach'].includes(bot.state) ? 'walk' : 'idle';
  let progress = waving ? (1.6 - bot.timer) / 1.6 : 0;
  if (body) {
    if (bot.attack) {
      pose = bot.attack.pose;
      progress = bot.attack.t / bot.attack.dur;
    } else if (body.rope) pose = 'climb';
    else if (!body.onGround) pose = 'jump';
    else pose = Math.abs(body.vx) > 8 ? 'walk' : 'idle';
  }
  const look = bot.bubble ? { ...bot.char.appearance, face: /:D|!!|xD|<3/.test(bot.bubble.text) ? 'excited' : /uwu|:3|owo/.test(bot.bubble.text) ? 'cat' : 'grin' } : bot.char.appearance;
  const seed = seedOf(bot.id);
  const facing = body ? body.facing : bot.facing;
  const anim = animFor(bot.id, body ? body.x : bot.x, facing, time, body);
  const state = {
    pose, progress, dur: 0.5, vy: body?.vy, time: time + seed * 0.37, seed, facing, job: bot.char.job, alpha: fade,
    // Party members fighting nearby stand on guard between swings.
    ready: Boolean(bot.party && bot.brain?.target), hurt: bot.hurt > 0,
  };
  if (bot.down) {
    if (!fellAt.has(bot)) fellAt.set(bot, time);
    drawFallen(ctx, look, wornGear(bot.char), x, y, { ...state, alpha: 0.75 }, time - fellAt.get(bot));
  } else {
    fellAt.delete(bot);
    drawHero(ctx, look, wornGear(bot.char), x, y, state, anim);
  }
  ctx.font = 'bold 7px sans-serif';
  const label = `Lv${bot.level} ${bot.name}`;
  const pad = bot.pro || bot.party ? 18 : 10;
  const w = ctx.measureText(label).width + pad;
  const fill = hovered ? '#ff8fc1' : bot.party ? 'rgba(40,120,80,0.8)' : bot.pro ? 'rgba(120,80,10,0.75)' : 'rgba(40,36,60,0.6)';
  box(ctx, x - w / 2, y + 2, w, 10, { fill, edge: bot.pro ? '#ffd66b' : bot.party ? '#bff0dc' : hovered ? '#ffffff' : null, r: 5, width: 1 });
  if (bot.party) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 6, y + 10);
    ctx.bezierCurveTo(x - w / 2 + 1, y + 6.5, x - w / 2 + 3.5, y + 3.5, x - w / 2 + 6, y + 5.8);
    ctx.bezierCurveTo(x - w / 2 + 8.5, y + 3.5, x - w / 2 + 11, y + 6.5, x - w / 2 + 6, y + 10);
    ctx.fill();
  } else if (bot.pro) sparkle(ctx, x - w / 2 + 6, y + 7, 2.6, '#ffd66b');
  text(ctx, label, x + (pad > 10 ? 4 : 0), y + 9.5, { size: 7, bold: true, align: 'center', color: bot.party ? '#e6ffee' : bot.pro ? '#ffe9a0' : '#fff6c9' });
  // In a dungeon, everyone's HP shows under their name.
  if (bot.inDungeon && bot.hp != null) {
    const f = Math.max(0, bot.hp / bot.stats.maxHp);
    box(ctx, x - 16, y + 13, 32, 4, { fill: 'rgba(58,45,79,0.6)', edge: null, r: 2 });
    if (f > 0) box(ctx, x - 16, y + 13, Math.max(2, 32 * f), 4, { fill: f < 0.3 ? '#ff6b8a' : '#7ee081', edge: null, r: 2 });
  } else if (bot.guild) text(ctx, `<${bot.guild}>`, x, y + 20, { size: 6, bold: true, align: 'center', color: '#c9f2ff', outline: 'rgba(40,36,60,0.7)' });
  if (bot.bubble) said.push([x, y - (bot.shop ? 80 : 62), bot.bubble]);
}

// Your party, on any map, wherever they are.
export function drawParty(ctx, members, cam, width, time, hoverId = null) {
  const said = [];
  for (const bot of members) {
    if (!bot.body) continue;
    const x = snap(bot.body.x - cam.x);
    if (x < -60 || x > width + 60) continue;
    drawBot(ctx, bot, x, snap(bot.body.y - cam.y), time, hoverId === bot.id, said);
  }
  if (settings.chatBubbles) for (const [x, y, b] of said) drawBubble(ctx, x, y, b.text, Math.min(1, b.t * 2));
}
