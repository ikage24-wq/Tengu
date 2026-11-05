// Towns: the buildings behind each NPC (market stalls, guild halls, an info kiosk), houses along
// the street, a fountain on the plaza, townsfolk and other "players" walking about and chatting,
// and each NPC's own idle routine. Everything is drawn from time alone, so nothing here keeps
// state; layouts are seeded so they never jitter.

import { drawSweetHouse } from './sweethouses.js';
import { drawIslandPiece } from './island.js';
import { drawMount } from './mounts.js';
import { MOUNTS } from '../data/mounts.js';
import { tagFade } from './coop.js';
import { drawMachine } from './gacha.js';
import { wornGear } from '../core/character.js';
import { settings } from '../core/settings.js';
import { R, E, T, F, mix, snap, footShadow, slopeAt } from './pixel.js';
import { ramp, planks, stones, windowPane, lightUL, leanFrame, swing, pivoted, wallShade, beam, gable } from './propkit.js';
import { art, place, houseArt, mushHouseArt, treehouseArt, tentArt, hitsLedge } from './scenery.js';
import { drawHero } from './hero.js';
import { lookFor, drawTownLife } from './townlife.js';
import { createAnim, stepAnim } from './animator.js';
import { drawBubble } from '../ui/chat.js';
import { text, box } from '../ui/kit.js';
import { NPCS } from '../data/npcs.js';
import { groundAt } from '../world/physics.js';
import { hopLift } from '../world/botsoul.js';
import { LANDMARKS } from './landmarks.js';
import { starchimeTowerArt, chimeArt, moonCrystalArt, TOWER, TOWER_CHIMES, greatForgeArt, FORGE, fishStallArt, thatchCottageArt, gateArchArt, windmillTowerArt, windmillSailArt, WINDMILL, cottageArt, bungalowArt, townhouseArt, innArt, workshedArt, warehouseArt, adobeArcadeArt, mushHomeArt, plazaTreeArt, noticeboardArt, canalHouseArt, pierArt, adobeHouseArt, arenaArt, treeHomeArt, moonTreeArt, MOON_LANTERNS, stoveArt, stoveLidArt, stoveFlameArt } from './townhouses.js';
import { puff } from './fxkit.js';
import { ITEMS } from '../data/items.js';
import { drawCraftBench } from './craftbench.js';
import { botLifePose, holdFind } from './life.js';
import { drawFriendFishing } from './fishing.js';
import { drawQuayBack, drawQuayFront } from './quay.js';
import { drawLagoonGround, drawLagoonPiece, drawLagoonOverhead, drawVoyage, drawVoyageDeck } from './lagoon.js';

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

// Malvina Grimsworth's tower (data/npcs.js `villaintower`): a would-be villain's lair in the middle
// of the prettiest village on the island. Purple stone, a steep witch's-hat roof with a bat for a
// weathervane, a round window glowing violet, two lanterns burning lilac, an arched door under the
// KEEP OUT sign (the sign is the NPC's) and, in front of it, a pink welcome mat with a heart; a box
// of flowers on the sill, because she can't help herself.
function towerArt(pose) {
  return art(`villaintower|${pose}`, 74, 112, () => {
    const s = poseLean(pose);
    const stone = ramp('#8a6aa8', 0.7);
    const out = [...stones(16, 38, 42, 74, stone, 7, { rowH: 7, blockW: 11 }), ...wallShade(16, 38, 42, 74, stone, 3)];
    // The flared base, a course of darker stones.
    out.push(...stones(13, 100, 48, 12, ramp('#6a4a88', 0.7), 3, { rowH: 6, blockW: 12 }));
    out.push(...gable(9, 65, 42, 6, '#4e3460', 4));
    // The bat weathervane, its wings tipping with the wind.
    const tip = s * 1.2;
    out.push(F(R(36.4, 0.6, 1.2, 6, '#3a2648')), T([[37, 2.6], [31.4, 0.2 - tip], [32.4, 2.4], [30.6, 3.4], [33.6, 3.6], [37, 4]], '#2e1e3e'), T([[37, 2.6], [42.6, 0.2 + tip], [41.6, 2.4], [43.4, 3.4], [40.4, 3.6], [37, 4]], '#2e1e3e'));
    // The round window, glowing violet, with a sill and its flower box.
    out.push(E(37, 58, 8.4, 8.4, '#3a2648'), F(E(37, 58, 7, 7, '#c8a0ff')), F(E(35.4, 56.4, 4, 4, '#ecdcff')), F(R(36.4, 51, 1.2, 14, '#3a2648')), F(R(30, 57.4, 14, 1.2, '#3a2648')));
    out.push(...beam(28, 66, 18, 2.4, '#c8a888'), R(29, 68.4, 16, 4, '#a8794e'));
    for (const [fx, fc] of [[31, '#ff8fc1'], [35, '#ffd66b'], [39, '#ff8fc1'], [43, '#ffffff']]) out.push(F(E(fx, 67, 1.6, 1.6, fc)), F(E(fx, 67, 0.6, 0.6, '#ffe36b')));
    // The arched door and its gold ring; two lilac lanterns either side.
    out.push(E(37, 86, 10, 7, '#3a2648'), R(27, 86, 20, 26, '#3a2648'), F(E(37, 87, 8.6, 6, '#6a2a48')), F(R(28.4, 87, 17.2, 25, '#6a2a48')), F(R(36.6, 82, 0.8, 30, '#4a1e34')));
    out.push(F(E(41.4, 99, 1.4, 1.4, '#ffd66b')), F(E(41.4, 99, 0.6, 0.6, '#6a2a48')));
    for (const lx of [21, 53]) out.push(F(R(lx - 0.5, 82, 1, 4, '#3a2648')), E(lx, 89, 2.6, 3.4, '#3a2648'), F(E(lx, 89, 1.8, 2.6, '#e6c8ff')), F(E(lx - 0.5, 88, 0.8, 1.2, '#ffffff')));
    // The welcome mat (pink, a heart in the middle), right under the KEEP OUT sign.
    out.push(F(R(25, 109.4, 24, 2.6, '#ff9ec8')), F(R(25, 109.4, 24, 0.6, '#ffc2dc')), F(E(37, 110.6, 1.4, 1, '#ff4f86')));
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
  town: ['treehouse', 'house', 'treehouse'],
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
  if (kind === 'villaintower') return towerArt(windPose(time, wx, 0.2));
  return null;
}

// A wooden sign hanging from two chains, with the building's name, swinging from its hooks in the
// wind a moment after the gusts pass.
function hangingSign(ctx, x, y, label, time, wx = x) {
  ctx.font = '800 7px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  const w = Math.round(ctx.measureText(label).width + 12);
  const r = ramp('#f0cf9a', 0.8);
  pivoted(ctx, x, y - 6, swing(time, wx, 1.3, wx * 0.01), () => {
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
// `hero`: { wind, name } (the wind back on the island for this hero, at the story's end: the
// windmill turns, the chimes ring, the forge roars, and the plaque under the windmill bears its name).
export function drawStreet(ctx, map, cam, width, time, hero = {}) {
  const wind = Boolean(hero.wind);
  // The Sea Biscuit's deck at sea (render/lagoon.js): the sea, her hull and her deck.
  if (map.voyage) {
    drawVoyage(ctx, map, cam, width, 360, time, map.voyageAt ?? 0);
    drawVoyageDeck(ctx, map, cam, width, time);
    return;
  }
  // A quay's sea and the boats riding in it (render/quay.js); its kerb goes in front, below.
  drawQuayBack(ctx, map, cam, width, time);
  if (!map.isTown) {
    drawQuayFront(ctx, map, cam, width, time);
    return;
  }
  const ground = (wx) => snap(groundAt(map, wx) - cam.y);
  // Lantern Lagoon: the water under the boardwalk, the surf, the point's rock (render/lagoon.js).
  if (map.lagoon) drawLagoonGround(ctx, map, cam, width, 360, time);
  const theme = map.theme;
  // Decks on posts: a town ledge standing on the street (`posts`), its timber legs and braces.
  for (const p of map.platforms) {
    if (!p.posts) continue;
    const x0 = p.x - cam.x;
    if (x0 + p.w < -20 || x0 > width + 20) continue;
    const r = ramp('#c99a6b', 0.8);
    const top = p.y + 12 - cam.y;
    for (const px of [p.x + 10, p.x + p.w - 16, ...(p.w > 130 ? [p.x + p.w / 2 - 3] : [])]) {
      const x = snap(px - cam.x);
      const bottom = ground(px);
      ctx.fillStyle = r.base;
      ctx.fillRect(x, top, 6, bottom - top);
      ctx.fillStyle = r.hi;
      ctx.fillRect(x, top, 1.5, bottom - top);
      ctx.fillStyle = r.sh;
      ctx.fillRect(x + 4, top, 2, bottom - top);
      ctx.fillStyle = r.deep;
      ctx.fillRect(x - 1, bottom - 3, 8, 3);
    }
    // A cross brace between the outer legs.
    ctx.strokeStyle = r.sh;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(snap(p.x + 13 - cam.x), top + 6);
    ctx.lineTo(snap(p.x + p.w - 13 - cam.x), Math.min(ground(p.x + p.w - 13), top + 70));
    ctx.stroke();
  }
  // A redesigned town lays out its own two-storey cottages, set back a step behind the street.
  // Each town's own kind of home (`homeStyle`): Sprout's cottages, the harbor's canal houses, the
  // crag's flat-roofed sandstone houses, the grove's tree homes.
  // An entry is a place, or [place, kind] for one of the street's other buildings (the bungalow,
  // the townhouse, the inn), so a street mixes tall, low and wide buildings.
  for (const entry of map.cottages ?? []) {
    const [wx, kind] = Array.isArray(entry) ? entry : [entry, null];
    const x = wx - cam.x;
    if (x < -130 || x > width + 130) continue;
    const seed = hash(wx * 0.11 + 3);
    const style = kind ?? map.homeStyle ?? 'cottage';
    const s = style === 'thatch' ? thatchCottageArt(seed) : style === 'farmhouse' ? thatchCottageArt(seed, true) : style.startsWith('canal') ? canalHouseArt(seed, style.split('-')[1] ?? pick(['step', 'bell', 'neck'], seed)) : style === 'warehouse' ? warehouseArt() : style === 'arcade' ? adobeArcadeArt(seed) : style === 'mushhome' ? mushHomeArt(seed) : style === 'adobe' ? adobeHouseArt(seed) : style === 'treehome' ? treeHomeArt(seed) : style === 'bungalow' ? bungalowArt(seed) : style === 'townhouse' ? townhouseArt(seed) : style === 'inn' ? innArt() : cottageArt(seed);
    const hy = ground(wx);
    place(ctx, s, snap(x), hy + 2);
    if (style === 'cottage') chimneySmoke(ctx, x + (hash(seed * 3) > 0.5 ? -32 : 32), hy - 136, time, seed);
    else if (style === 'thatch') chimneySmoke(ctx, x + 27, hy - 128, time, seed);
    else if (style === 'farmhouse') chimneySmoke(ctx, x + 53, hy - 118, time, seed);
    else if (style === 'bungalow') chimneySmoke(ctx, x + 40, hy - 100, time, seed);
    else if (style === 'inn') glowSoft(ctx, x + 25, hy - 40, 18, '#ffe9a6', 0.3 + 0.06 * Math.sin(time * 1.7));
    // Lit windows breathe a little light at night.
    if (style.startsWith('canal') || style === 'treehome' || style === 'mushhome') glowSoft(ctx, x, hy - s.h * 0.55, 46, '#ffe9a6', 0.16 + 0.04 * Math.sin(time * 1.3 + seed * 9));
  }
  // The town stove: the fire licking in its arch (three drawings flowing one into the next), the
  // pot's lid rattling on the boil now and then, and cel puffs of steam curling up and tearing
  // apart. Every beat is phased from the stove's own place in town.
  if (map.stove != null) {
    const x = snap(map.stove - cam.x);
    const gy = ground(map.stove);
    if (x > -60 && x < width + 60) {
      const ph = map.stove * 0.017;
      glowSoft(ctx, x, gy - 8, 24, '#ffb35a', 0.45 + 0.12 * Math.sin(time * 7 + ph) + 0.06 * Math.sin(time * 13.7));
      place(ctx, stoveArt(), x, gy + 2);
      const f = (time * 7 + ph) % 3;
      const i = Math.floor(f);
      place(ctx, stoveFlameArt(i), x, gy + 0.6);
      ctx.save();
      ctx.globalAlpha = f - i;
      place(ctx, stoveFlameArt((i + 1) % 3), x, gy + 0.6);
      ctx.restore();
      // The lid: still most of the time, then a burst of rattling as the pot boils up.
      const boil = Math.max(0, Math.sin(time * 0.9 + ph)) ** 6;
      const rattle = boil * Math.sin(time * 38) * 1.1;
      const lift = boil * Math.abs(Math.sin(time * 19)) * 1.4;
      ctx.save();
      ctx.translate(x, gy - 46);
      ctx.rotate(rattle * 0.05);
      place(ctx, stoveLidArt(), 0, 2 - lift);
      ctx.restore();
      for (let k = 0; k < 4; k++) {
        const u = (((time * (0.5 + 0.25 * boil) + k / 4 + ph) % 1) + 1) % 1;
        const sx = x - 5 + k * 3.5 + Math.sin(u * 5 + k * 1.7 + time * 0.8) * (2 + u * 4);
        const sy = gy - 50 - u * 30;
        ctx.save();
        ctx.globalAlpha = Math.min(1, u * 5) * (1 - u) ** 1.4 * 0.9;
        puff(ctx, sx, sy, 2.2 + u * 4.5, '#ffffff', '#ece6fa', u > 0.55 ? (u - 0.55) / 0.45 : 0, k * 0.37);
        ctx.restore();
      }
    }
  }
  // The town's craft bench: its tools sway on their pegs, sparks hop off the anvil (more while
  // someone works there: map.benchWork, set by world/crafting.js).
  if (map.bench != null) {
    const x = snap(map.bench - cam.x);
    if (map.workshed && x > -70 && x < width + 70) place(ctx, workshedArt(), x, ground(map.bench) + 2);
    if (x > -60 && x < width + 60) drawCraftBench(ctx, map.theme, x, ground(map.bench), time, map.bench, map.benchWork ?? null);
  }
  // The town's capsule machine: its capsules rattle now and then, a glint slides over the globe,
  // and its crank turns while someone pulls (map.gachaTurn, set by the machine's window).
  if (map.gacha != null) {
    const x = map.gacha - cam.x;
    if (x > -60 && x < width + 60) {
      const gy = ground(map.gacha);
      const turn = performance.now() / 1000 - (map.gachaTurn ?? -99);
      const pulling = turn >= 0 && turn < 0.75;
      const rattle = pulling ? Math.floor(turn * 14) % 2 === 0 : (time % 6.5) < 0.3 && Math.floor(time * 12) % 2 === 0;
      ctx.save();
      ctx.translate(snap(x), gy + 2);
      ctx.scale(0.75, 0.75);
      drawMachine(ctx, 0, 0, { crank: pulling ? Math.floor(turn * 10) : 0, shake: rattle });
      ctx.restore();
      const u = (time / 4.2) % 1;
      if (u < 0.3) {
        const g = Math.sin((Math.PI * u) / 0.3);
        sparkleAt(ctx, x - 14 + u * 40, gy - 62 + u * 8, 3 * g, '#ffffff', g);
      }
    }
  }
  for (const [kind, wx, extra] of map.townPieces ?? []) {
    // Lantern Lagoon's own buildings, and the harbor's quay for the Sea Biscuit (render/lagoon.js).
    if (drawLagoonPiece(ctx, map, kind, wx, extra, cam, width, time)) continue;
    // Your island's own pieces (render/island.js).
    if (drawIslandPiece(ctx, map, kind, wx, extra, cam, width, time)) continue;
    // A Sweetheart's house, and their room inside (render/sweethouses.js).
    if (drawSweetHouse(ctx, map, kind, wx, extra, cam, width, time)) continue;
    const x = wx - cam.x;
    if (x < -160 || x > width + 160) continue;
    const gy = ground(wx);
    if (kind === 'plazatree') place(ctx, plazaTreeArt(0), snap(x), gy + 3);
    else if (kind === 'starchime') {
      // The Starchime Tower: its moon crystal breathing softly, its chimes hanging all but still
      // (no wind to ring them), now and then a faint sway and a sparkle, as if a breeze almost came.
      place(ctx, starchimeTowerArt(), snap(x), gy + 2);
      const left = x - TOWER.w / 2;
      const top = gy + 2 - TOWER.h;
      const [kx, ky] = TOWER.crystal;
      const [ccx, ccy, ccr] = TOWER.crown;
      glowSoft(ctx, left + kx, top + ky + 16, 40, '#bfe6ff', 0.25 + 0.12 * (0.5 + 0.5 * Math.sin(time * 1.1 + wx * 0.01)));
      place(ctx, moonCrystalArt(), snap(left + kx), top + ky + 22 + Math.sin(time * 0.9) * 1.2);
      // (With the wind back, they swing and ring all the time.)
      const nudge = wind ? 0.75 + 0.25 * Math.sin(time * 0.7) : Math.max(0, Math.sin(time * 0.5)) ** 10;
      for (const [cx, len] of TOWER_CHIMES) {
        const a = Math.sin(time * (wind ? 3.1 : 2.2) + cx * 0.3) * (0.015 + (wind ? 0.16 : 0.09) * nudge);
        const ay = top + ccy + 18 - Math.sqrt(Math.max(0, 1 - ((cx - ccx) / ccr) ** 2)) * 14;
        ctx.save();
        ctx.translate(left + cx, ay);
        ctx.rotate(a);
        place(ctx, chimeArt(len), 0, len + 4);
        ctx.restore();
        if (nudge > 0.6) sparkleAt(ctx, left + cx + Math.sin(time * 5 + cx) * 2, ay + len, 1.4 * nudge, '#e8f4ff', nudge);
      }
    } else if (kind === 'greatforge') {
      // The Great Forge: its fire breathing low (the bellows have no wind), a thin rope of smoke
      // from the chimney, a spark now and then.
      const s = greatForgeArt();
      place(ctx, s, snap(x), gy + 2);
      const left = x - FORGE.w / 2;
      const top = gy + 2 - FORGE.h;
      // (With the wind back, the bellows fill: the fire roars bright and the sparks fly thick.)
      glowSoft(ctx, left + FORGE.mouth[0], gy - 12, wind ? 64 : 46, '#ff8a3a', (wind ? 0.42 : 0.28) + 0.08 * Math.sin(time * (wind ? 2.6 : 1.4) + wx * 0.01));
      chimneySmoke(ctx, left + (FORGE.chimney[0] + FORGE.chimney[1]) / 2, top - 4, time, wx * 0.01);
      for (let k = 0; k < (wind ? 3 : 1); k++) {
        const u = (time * (wind ? 0.9 : 0.5) + k / 3) % 1;
        if (u < 0.5) sparkleAt(ctx, left + FORGE.mouth[0] + Math.sin(time * 3 + k * 2) * 12, gy - 10 - u * 50, 1.6 * (1 - u * 2), '#ffd36b', 1 - u * 2);
      }
    } else if (kind === 'fishstall') place(ctx, fishStallArt(), snap(x), gy + 2);
    else if (kind === 'gatearch') {
      place(ctx, gateArchArt(), snap(x), gy + 2);
      hangingSign(ctx, x, gy - 118, map.name, time, wx);
    } else if (kind === 'windmill') {
      // The great windmill: its sails turn so slowly they barely move (the wind has stopped), a
      // creak of a nudge now and then, as if a breeze had almost come back.
      const s = windmillTowerArt();
      place(ctx, s, snap(x), gy + 2);
      const hx = x - WINDMILL.w / 2 + WINDMILL.hub[0];
      const hy = gy + 2 - WINDMILL.h + WINDMILL.hub[1];
      // (With the wind back, the sails turn properly, a steady sweep that gusts a little.)
      const nudge = Math.max(0, Math.sin(time * 0.6)) ** 8 * 0.25;
      const a = wind ? time * 0.7 + Math.sin(time * 0.4) * 0.3 + wx * 0.01 : time * 0.05 + nudge + wx * 0.01;
      const sail = windmillSailArt();
      for (let k = 0; k < 4; k++) {
        ctx.save();
        ctx.translate(hx, hy);
        ctx.rotate(a + (k * Math.PI) / 2);
        place(ctx, sail, 0, 0);
        ctx.restore();
      }
      ctx.fillStyle = '#8a5a3a';
      ctx.beginPath();
      ctx.arc(hx, hy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd36b';
      ctx.beginPath();
      ctx.arc(hx, hy, 2.6, 0, Math.PI * 2);
      ctx.fill();
      // The plaque at its foot, with the name of the one who brought the wind back.
      if (wind && hero.name) {
        ctx.font = '800 6px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
        const label = `${hero.name}, the One Who Showed Up`;
        const pw = ctx.measureText(label).width + 12;
        box(ctx, x - pw / 2, gy - 34, pw, 12, { fill: '#c9a46a', edge: '#7a5a34', r: 3, width: 1.5 });
        text(ctx, label, x, gy - 25.5, { size: 6, bold: true, align: 'center', color: '#4a3220' });
      }
    }
    else if (kind === 'noticeboard') place(ctx, noticeboardArt(), snap(x), gy + 3);
    else if (kind === 'arena') place(ctx, arenaArt(), snap(x), gy + 4);
    else if (kind === 'pier') place(ctx, pierArt(), snap(x), gy + 3); else if (kind === 'moontree') {
      place(ctx, moonTreeArt(), snap(x), gy + 3);
      // Its lanterns, swaying a little and glowing.
      for (const [dx, dy] of MOON_LANTERNS) {
        const sw = Math.sin(time * 1.2 + dx * 0.05) * 2;
        const lx = x + dx + sw;
        const ly = gy + dy;
        glowSoft(ctx, lx, ly, 20, '#ffd27a', 0.45 + 0.1 * Math.sin(time * 2 + dx));
        ctx.fillStyle = '#ffe9a6';
        ctx.beginPath();
        ctx.ellipse(lx, ly, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff9ec0';
        ctx.fillRect(lx - 4, ly - 5, 8, 1.4);
        ctx.fillRect(lx - 4, ly + 3.6, 8, 1.4);
      }
    }
  }
  drawQuayFront(ctx, map, cam, width, time);
  // The lagoon's lantern strings over the boardwalk.
  drawLagoonOverhead(ctx, map, cam, width, time);
  // Houses fill the gaps between NPCs, portals, and the plaza (in towns not yet laid out with
  // cottages of their own).
  const kinds = map.cottages ? [] : STREET[theme] ?? [];
  if (kinds.length) {
    for (let wx = 120, i = 0; wx < map.width - 100; wx += 150, i++) {
      if (map.npcs.some((n) => Math.abs(n.x - wx) < 110) || map.portals.some((p) => Math.abs(p.x - wx) < 70) || Math.abs((map.plaza ?? -999) - wx) < 90) continue;
      // Houses stand on level ground, clear of the town's landmarks.
      if (Math.abs(groundAt(map, wx - 36) - groundAt(map, wx + 36)) > 2) continue;
      // Wide landmarks (a ship, a rune circle) keep them back by their own half-width.
      if ((map.deco ?? []).some(([kind, dx, , dy]) => dy == null && Math.abs(dx - wx) < Math.max(90, (LANDMARKS[kind]?.w ?? 0) / 2 + 40))) continue;
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
  // The plaza fountain, with water arcing from the spout (Lantern Lagoon's square has its lantern
  // pole instead: `fountain: false`).
  if (map.plaza != null && map.fountain !== false) {
    const fx = map.fountain ?? map.plaza;
    const x = snap(fx - cam.x);
    const gy = ground(fx);
    if (x > -60 && x < width + 60) {
      place(ctx, fountainArt(Math.floor(time * 5) % FOUNTAIN_FRAMES), x, gy);
      fountainWater(ctx, x, gy, time);
    }
  }
  // Each NPC's stall or hall, with its sign.
  for (const n of map.npcs) {
    const npc = NPCS[n.id];
    if (!npc.building) continue;
    // Someone a cutscene brings over from another map leaves their stall at home, and someone
    // walking about in one leaves theirs where it stands.
    if (n.cine?.spawned) continue;
    const hx = n.cine?.homeX ?? n.x;
    const x = snap(hx - cam.x);
    if (x < -80 || x > width + 80) continue;
    const s = buildingArt(npc.building, time, hx);
    if (!s) continue;
    const gy = ground(hx);
    place(ctx, s, x, gy);
    if (npc.building === 'forge') forgeGlow(ctx, x, gy, time);
    if (npc.sign) hangingSign(ctx, x, gy - s.h - 10, npc.sign, time, hx);
  }
}

// A soft round glow (lit windows, lanterns).
function glowSoft(ctx, x, y, r, color, alpha) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
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
// Each NPC has a few idle bits, played in turn with a breather between them: a rig (where their
// hands are, a lean, the head), sometimes a move (a swing, a cheer) and a face, a fixed facing or
// a float, and the props they handle drawn in their hands, wherever those really are (`hands`,
// called from the hero's drawing with both hands on screen). Nothing appears out of nowhere: a
// prop comes out of a pocket, a belt or a sleeve, or grows where the hand is. `t` is the time in
// seconds; everything is drawn from it alone.

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const ease = (t) => 1 - (1 - t) ** 3;
const soft = (t) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t));
const bump = (p, a, b) => (p < a || p > b ? 0 : Math.sin(((p - a) / (b - a)) * Math.PI));
const lerp = (a, b, k) => a + (b - a) * k;
// Rig offsets snap to half a body pixel (so a bit doesn't build a new sprite every frame).
const h = (v) => Math.round(v * 2) / 2;
const arm = (x, y) => [h(x), h(y)];

function cycle(t, period, seed = 0) {
  return ((t + seed) % period + period) % period;
}
// The bit playing at `t` from a list of [name, seconds], each followed by a breather of `rest`
// seconds: { kind, u (0-1 through it) }, or null while resting.
function bitAt(t, list, rest = 2.4) {
  const period = list.reduce((n, [, d]) => n + d + rest, 0);
  let c = cycle(t, period);
  for (const [kind, d] of list) {
    if (c < d) return { kind, u: c / d, s: c };
    c -= d + rest;
    if (c < 0) return null;
  }
  return null;
}
// A bit's in and out: 0 at its ends, 1 through the middle (the hands ease there and back).
const inOut = (u, a = 0.12, b = 0.88) => soft(seg(u, 0, a)) * (1 - soft(seg(u, b, 1)));

// ---------- Little props, drawn at a hand ----------
function heldPotion(ctx, x, y, color, k = 1) {
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, 2.6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c99a6b';
  ctx.fillRect(-1, -4, 2, 1.6);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-1.2, -1.2, 1, 1);
  ctx.restore();
}
function coin(ctx, x, y, spin) {
  const w = Math.abs(Math.cos(spin)) * 2.4 + 0.4;
  ctx.fillStyle = '#ffc94f';
  ctx.beginPath();
  ctx.ellipse(x, y, w, 2.4, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 0.4, y - 1.4, 0.8, 1.2);
}

// Shelly's shell, on her back: a big pink spiral conch she's grown into, riding on her shoulders
// (it bobs a beat after her and tips as she leans). Drawn behind her (the routine's `back`).
function shellyShell(ctx, x, y, time, facing, lean = 0) {
  const bob = Math.sin(time * 2.1 - 0.5) * 0.6;
  ctx.save();
  ctx.translate(x - facing * 13, y - 19 + bob);
  ctx.rotate(facing * (-0.25 + lean * 0.4));
  ctx.scale(facing * 1.15, 1.15);
  const tone = (r, c) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(r[0], r[1], r[2], r[3], 0, 0, TAU);
    ctx.fill();
  };
  tone([0, 0, 14.5, 12.5], '#a85a7a');
  tone([0, 0, 13.5, 11.5], '#ffc2d4');
  tone([3, 3, 9, 7], '#f2a0bc');
  tone([-3, -4, 5, 3], '#ffe0ea');
  // its spiral, winding in to a point
  ctx.strokeStyle = '#d07a9a';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const a = i * 0.42;
    const r = 11 * (1 - i / 44);
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r * 0.85;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
  // a few spines along the top
  ctx.fillStyle = '#ffe0ea';
  for (const a of [-2.4, -1.8, -1.2]) {
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 12 - 2, Math.sin(a) * 10.5);
    ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 15);
    ctx.lineTo(Math.cos(a) * 12 + 2, Math.sin(a) * 10.5);
    ctx.fill();
  }
  ctx.restore();
}
// Her coral crab-claw mittens, on her hands; `snap` closes them (0 open, 1 shut).
function crabClaw(ctx, x, y, facing, snap = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.fillStyle = '#c8506a';
  ctx.beginPath();
  ctx.ellipse(0, 0, 3.4, 3, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff8a8a';
  ctx.beginPath();
  ctx.ellipse(0, -0.2, 2.8, 2.4, 0, 0, TAU);
  ctx.fill();
  const open = 0.7 * (1 - snap);
  for (const sgn of [-1, 1]) {
    ctx.save();
    ctx.rotate(sgn * open);
    ctx.fillStyle = '#ff8a8a';
    ctx.beginPath();
    ctx.ellipse(3.2, sgn * 1.1, 2.6, 1.2, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
// A little wooden mallet in a claw.
function mallet(ctx, x, y, a) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.fillStyle = '#a8805a';
  ctx.fillRect(-0.8, -11, 1.6, 11);
  ctx.fillStyle = '#e8c890';
  ctx.fillRect(-4, -15, 8, 5);
  ctx.fillStyle = '#c89a6a';
  ctx.fillRect(-4, -11, 8, 1);
  ctx.restore();
}

const cloverBun = {};
// Little props for the Sweethearts' bits, drawn at their hands.
function prop(ctx, kind, x, y, k = 1, time = 0) {
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  if (kind === 'dough') {
    ctx.fillStyle = '#fff0d8';
    ctx.beginPath();
    ctx.ellipse(0, 0, 4, 2.6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -1.6, 1.4, 0.8);
  } else if (kind === 'tart') {
    ctx.fillStyle = '#e0a060';
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.6, 1.4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ff6b8a';
    ctx.beginPath();
    ctx.arc(0, -1, 1, 0, TAU);
    ctx.fill();
  } else if (kind === 'notebook') {
    ctx.fillStyle = '#5a7ab8';
    ctx.fillRect(-4, -3, 8, 6);
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(-3.4, -2.4, 6.8, 4.8);
    ctx.strokeStyle = '#a8a0c0';
    ctx.lineWidth = 0.4;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-2.6, -1.2 + i * 1.3);
      ctx.lineTo(2.6 - (i === 2 ? (Math.sin(time * 3) + 1) * 1.2 : 0), -1.2 + i * 1.3);
      ctx.stroke();
    }
  } else if (kind === 'cloth') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.6, 1.8, 0.4, 0, TAU);
    ctx.fill();
  } else if (kind === 'daisy') {
    ctx.strokeStyle = '#5fbf7a';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -5);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(Math.cos((i / 6) * TAU) * 1.4, -5 + Math.sin((i / 6) * TAU) * 1.4, 0.9, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath();
    ctx.arc(0, -5, 0.8, 0, TAU);
    ctx.fill();
  } else if (kind === 'spyglass') {
    ctx.fillStyle = '#c8902a';
    ctx.fillRect(-1, -1.2, 9, 2.4);
    ctx.fillStyle = '#ffd36b';
    ctx.fillRect(-1, -1.2, 9, 0.8);
    ctx.fillStyle = '#8a5a1a';
    ctx.fillRect(7, -1.6, 2, 3.2);
  } else if (kind === 'rope') {
    ctx.strokeStyle = '#e8c890';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 2.2, 0, TAU * 0.85 + Math.sin(time * 4) * 0.4);
    ctx.stroke();
  }
  ctx.restore();
}
// Celeste dozing: z's drifting up and fading.
function zzz(ctx, x, y, time) {
  for (let i = 0; i < 3; i++) {
    const k = (time * 0.5 + i / 3) % 1;
    ctx.save();
    ctx.globalAlpha = (1 - k) * 0.9;
    ctx.fillStyle = '#c9b6ff';
    ctx.font = `800 ${5 + k * 3}px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif`;
    ctx.fillText('z', x + 8 + k * 8, y - 44 - k * 14);
    ctx.restore();
  }
}

const ROUTINES = {
  // Malvina Grimsworth: scheming over a plan, a burst of "ohohoho!", pointing at nobody in
  // particular, a swirl of her cape for no audience at all (render/villain-moves.js).
  malvina(t) {
    const b = bitAt(t, [['vscheme', 4.4], ['vohoho', 2.2], ['vpoint', 2], ['vswirl', 1.8]], 3.2);
    if (!b) return { face: 'scheme' };
    const face = { vscheme: 'scheme', vohoho: 'ohoho', vpoint: 'scheme', vswirl: 'smug' }[b.kind];
    return { pose: b.kind, progress: b.u, face };
  },
  // ----- The Sweethearts (data/sweethearts.js) -----
  // Poppy: kneading dough on the counter, sneaking a taste of a tart, a happy twirl.
  poppy(t) {
    const b = bitAt(t, [['knead', 3], ['taste', 2.2], ['twirl', 1.4]], 2);
    if (!b) return { face: 'grin' };
    const k = inOut(b.u);
    if (b.kind === 'knead') {
      const push = Math.abs(Math.sin(b.s * 5));
      return { face: 'determined', rig: { frontArm: arm(3 * k, (1 + push * 2) * k), backArm: arm(3.6 * k, (1 + push * 2) * k), tilt: (4 + push * 3) * k, hy: h(push * 0.6 * k) }, hands: (ctx, f) => prop(ctx, 'dough', f[0] + 1, f[1] + 1, k) };
    }
    if (b.kind === 'taste') {
      const bite = bump(b.u, 0.45, 0.6);
      return { face: bite > 0.2 ? 'love' : 'excited', rig: { frontArm: arm(1.6 * k, -7 * k), hy: h(-0.4 * k) }, hands: (ctx, f) => prop(ctx, 'tart', f[0], f[1] - 1, k * (1 - bump(b.u, 0.5, 0.95) * 0.4)) };
    }
    return { pose: 'cheer', progress: b.u, face: 'grin' };
  },
  // Lark: writing a line in her notebook (head down), looking out to sea with a hand on her scarf,
  // hiding shyly behind her sleeves.
  lark(t) {
    const b = bitAt(t, [['write', 3.4], ['gaze', 3], ['hide', 1.8]], 2.4);
    if (!b) return { face: 'shy' };
    const k = inOut(b.u);
    if (b.kind === 'write') return { face: 'lookdown', rig: { frontArm: arm(2.4 * k, -2.6 * k), backArm: arm(2.6 * k, -2.4 * k), hy: h(0.8 * k), tilt: 3 * k }, hands: (ctx, f, bk) => prop(ctx, 'notebook', (f[0] + bk[0]) / 2, (f[1] + bk[1]) / 2 - 1, k, b.s) };
    if (b.kind === 'gaze') return { facing: -1, face: 'smile', rig: { backArm: arm(1.4 * k, -6 * k), hy: h(-0.5 * k), tilt: -2 * k } };
    return { face: 'shy', rig: { frontArm: arm(1.2 * k, -9 * k), backArm: arm(1.6 * k, -9 * k), squat: Math.round(k), hy: h(1 * k) } };
  },
  // Rowan: polishing his sword's guard with a cloth, a big stretch, stopping to smell a daisy.
  rowan(t) {
    const b = bitAt(t, [['polish', 3], ['stretch', 2], ['sniff', 2.4]], 2.2);
    if (!b) return { face: 'smile' };
    const k = inOut(b.u);
    if (b.kind === 'polish') {
      const rub = Math.sin(b.s * 9);
      return { facing: 1, face: 'determined', rig: { frontArm: arm((4 + rub * 1.4) * k, -3 * k), tilt: 4 * k }, hands: (ctx, f) => prop(ctx, 'cloth', f[0], f[1], k) };
    }
    if (b.kind === 'stretch') return { face: 'sleepy', rig: { frontArm: arm(1 * k, -13 * k), backArm: arm(-1 * k, -13 * k), hy: h(-1.2 * k), tilt: -4 * k } };
    return { face: 'love', rig: { frontArm: arm(1.4 * k, -7 * k), hy: h(0.4 * k), tilt: 3 * k }, hands: (ctx, f) => prop(ctx, 'daisy', f[0] + 0.4, f[1], k) };
  },
  // Yuzu: crouching to pounce (and a little hop), peeking out with a grin, chasing her own tail.
  yuzu(t) {
    const b = bitAt(t, [['pounce', 1.6], ['peek', 2], ['tail', 1.8]], 1.8);
    if (!b) return { face: 'playful' };
    const k = inOut(b.u, 0.1, 0.9);
    if (b.kind === 'pounce') {
      const hop = bump(b.u, 0.55, 0.85);
      return { face: hop > 0.1 ? 'excited' : 'smugcat', lift: hop * 10, rig: { squat: hop > 0.1 ? 0 : Math.round(2 * k), frontArm: arm(3 * k, (-1 - hop * 6) * k), backArm: arm(3 * k, (-1 - hop * 6) * k), tilt: 6 * k } };
    }
    if (b.kind === 'peek') return { face: 'bleh', rig: { tilt: -8 * k, hx: h(-1.2 * k), backArm: arm(2 * k, -6 * k) } };
    // Round and round after her tail: a clean flip each half turn.
    return { facing: Math.floor(b.s * 4) % 2 ? -1 : 1, face: 'excited', rig: { squat: 1, tilt: 4 * k } };
  },
  // Celeste: dozing off on her feet (z's), squinting through a curled hand like a telescope, counting
  // stars with a finger.
  celeste(t) {
    const b = bitAt(t, [['doze', 3.6], ['scope', 2.4], ['count', 2.6]], 2.4);
    if (!b) return { face: 'sleepy', extra: (ctx, x, y, time) => zzz(ctx, x, y, time) };
    const k = inOut(b.u);
    if (b.kind === 'doze') return { face: 'sleepy', rig: { tilt: 7 * k, hx: h(0.6 * k), hy: h(1 * k) }, extra: (ctx, x, y, time) => zzz(ctx, x, y, time) };
    if (b.kind === 'scope') return { face: 'excited', rig: { frontArm: arm(2 * k, -9.5 * k), hy: h(-0.6 * k), tilt: -5 * k } };
    const point = Math.floor(b.s * 2.4) % 3;
    return { face: 'smile', rig: { frontArm: arm((1 + point * 1.4) * k, -12 * k), hy: h(-0.4 * k), tilt: -4 * k } };
  },
  // Marlowe: scanning the sea with his spyglass, a swagger with his hands on his hips, tying a knot.
  marlowe(t) {
    const b = bitAt(t, [['spy', 2.8], ['swagger', 2], ['knot', 2.6]], 2);
    if (!b) return { face: 'smug' };
    const k = inOut(b.u);
    if (b.kind === 'spy') return { facing: -1, face: 'excited', rig: { frontArm: arm(2.4 * k, -9 * k), tilt: -3 * k }, hands: (ctx, f) => prop(ctx, 'spyglass', f[0], f[1] - 1, k) };
    if (b.kind === 'swagger') return { face: 'toldyou', rig: { frontArm: arm(-1.6 * k, 1 * k), backArm: arm(-1.6 * k, 1 * k), tilt: -4 * k, hy: h(-0.6 * k) } };
    return { face: 'determined', rig: { frontArm: arm(2.6 * k, -2 * k), backArm: arm(2.8 * k, -2 * k), hy: h(0.6 * k), tilt: 4 * k }, hands: (ctx, f, bk) => prop(ctx, 'rope', (f[0] + bk[0]) / 2, (f[1] + bk[1]) / 2, k, t) };
  },
  // Shelly, the hermit crab carpenter on your island: tapping away with her mallet, measuring with
  // her claws held apart and squinting, and (shy, when it's quiet) tucking down into her shell and
  // peeking out again. Her claws click now and then.
  shelly(t) {
    const b = bitAt(t, [['tap', 2.6], ['measure', 2.2], ['tuck', 2.4]], 2.2);
    const back = (lean) => (ctx, x, y, time, facing) => shellyShell(ctx, x, y, time, facing, lean);
    const clawsAt = (snapF, malletA = null) => (ctx, front, backHand) => {
      if (malletA != null) mallet(ctx, front[0], front[1], malletA);
      crabClaw(ctx, front[0], front[1], 1, snapF(0));
      crabClaw(ctx, backHand[0], backHand[1], -1, snapF(1));
    };
    if (!b) {
      const click = Math.max(0, Math.sin(t * 7)) ** 8;
      return { face: 'smile', back: back(0), hands: clawsAt(() => click) };
    }
    if (b.kind === 'tap') {
      const k = inOut(b.u);
      const beat = Math.abs(Math.sin(b.s * 7));
      return { face: 'determined', back: back(0.15 * k), rig: { frontArm: arm(3 * k, (-6 + beat * 4) * k), tilt: 4 * k, hy: h(0.6 * k) }, hands: clawsAt(() => 0.3, -1.2 + beat * 0.9 * k) };
    }
    if (b.kind === 'measure') {
      const k = inOut(b.u);
      const wide = 1 + Math.sin(b.s * 3) * 0.4;
      return { face: 'mmhm', back: back(0), rig: { frontArm: arm(4 * k * wide, -4 * k), backArm: arm(-1 * k, -4 * k), hy: h(0.5 * k) }, hands: clawsAt(() => 0) };
    }
    const k = inOut(b.u, 0.2, 0.8);
    return { face: k > 0.5 ? 'shy' : 'smile', back: back(0.4 * k), rig: { squat: Math.round(2 * k), hy: h(2 * k), tilt: -3 * k, frontArm: arm(-1 * k, -2 * k), backArm: arm(1 * k, -2 * k) }, hands: clawsAt(() => k) };
  },
  // Clover, the Puff Bun keeper: a bun hops round her feet; she kneels to pat it, and laughs when it
  // nuzzles her.
  clover(t) {
    const b = bitAt(t, [['pat', 2.4], ['laugh', 1.6]], 2.4);
    const bun = (ctx, x, y, time, facing) => {
      const hop = (time * 0.9) % 1;
      const bx = x + 18 + Math.sin(time * 0.45) * 10;
      cloverBun.x = bx;
      drawMount(ctx, cloverBun, 'bun', bx, y, time, { facing: Math.cos(time * 0.45) >= 0 ? 1 : -1, speed: hop < 0.5 ? 0.4 : 0 });
    };
    if (!b) return { face: 'smile', extra: bun };
    const k = inOut(b.u);
    if (b.kind === 'pat') return { facing: 1, face: 'excited', extra: bun, rig: { squat: Math.round(2 * k), hy: h(1.5 * k), tilt: 6 * k, frontArm: arm(4 * k, (2 + Math.sin(b.s * 9) * 1.2) * k) } };
    return { face: 'grin', extra: bun, rig: { hy: h(-0.5 * k), tilt: -4 * k, backArm: arm(2 * k, -5 * k) } };
  },
  // Mira, the guide: a wave hello, a little cheer, and pointing the way east.
  mira(t) {
    const b = bitAt(t, [['wave', 1.8], ['cheer', 1.1], ['point', 1.8]], 2);
    if (!b) return { face: 'smile' };
    const k = inOut(b.u);
    if (b.kind === 'wave') return { rig: { frontArm: arm(lerp(0, 2.4, k) + 1.6 * Math.sin(b.s * 14) * k, lerp(0, -11, k)), tilt: -3 * k, hy: h(-0.5 * k) }, face: 'grin' };
    if (b.kind === 'cheer') return { pose: 'cheer', progress: b.u, face: 'grin' };
    return { facing: 1, rig: { frontArm: arm(lerp(0, 7, k), lerp(0, -6, k)), tilt: 4 * k, tx: h(k) }, face: 'excited' };
  },
  // Pip, the shopkeeper: juggling three potions (taken from her apron pocket and put back), counting
  // coins from one hand into the other, and holding a potion up to the light.
  pip(t) {
    const b = bitAt(t, [['juggle', 3.4], ['coins', 2.6], ['light', 2.4]], 2);
    if (!b) return { face: 'grin' };
    if (b.kind === 'juggle') {
      const k = inOut(b.u, 0.14, 0.86);
      const toss = b.s * 2.6;
      const up = Math.sin(toss * TAU);
      // Out of the pocket at the start (the back hand down at her hip), back in at the end.
      const pocket = bump(b.u, 0, 0.16) + bump(b.u, 0.84, 1);
      return {
        rig: { frontArm: arm(2.6 * k, (-3 - 1.6 * Math.max(0, up)) * k), backArm: arm(2 * k - 2 * pocket, (-3 - 1.6 * Math.max(0, -up)) * k + 3 * pocket), hy: h(-0.5 * k) }, face: 'excited',
        hands(ctx, front, back) {
          const out = ease(seg(b.u, 0.08, 0.2)) * (1 - ease(seg(b.u, 0.8, 0.92)));
          for (let i = 0; i < 3; i++) {
            const ph = (((toss + i * (2 / 3)) / 2) % 1 + 1) % 1;
            const s = (ph * 2) % 1;
            const [a, c] = ph < 0.5 ? [front, back] : [back, front];
            const px = lerp(a[0], c[0], s);
            const py = lerp(a[1], c[1], s) - 14 * Math.sin(s * Math.PI) - 2;
            const g = clamp01(out * 1.4 - i * 0.2);
            heldPotion(ctx, lerp(back[0], px, g), lerp(back[1], py, g), ['#ff6b8a', '#6fb8ff', '#ffab5c'][i], g);
          }
        },
      };
    }
    if (b.kind === 'coins') {
      const k = inOut(b.u);
      return {
        rig: { frontArm: arm(3 * k, -4 * k), backArm: arm(2.4 * k, -1.5 * k), hx: h(0.6 * k), hy: h(0.8 * k) }, face: 'excited',
        hands(ctx, front, back) {
          if (k < 0.5) return;
          // One coin at a time slips from the top hand into the cupped one below.
          const u = (b.s * 2.2) % 1;
          coin(ctx, lerp(front[0], back[0], u), lerp(front[1] - 1, back[1] - 1, u * u), u * 6);
          coin(ctx, back[0], back[1] - 1.5, 0.3);
          coin(ctx, front[0], front[1] - 2, 0.2);
        },
      };
    }
    const k = inOut(b.u, 0.2, 0.8);
    return {
      rig: { frontArm: arm(2 * k, -11 * k), hx: h(0.4 * k), hy: h(-1 * k), tilt: -4 * k }, face: k > 0.5 ? 'excited' : 'grin',
      hands(ctx, front) {
        heldPotion(ctx, front[0], front[1] - 3, '#6fb8ff', 1);
        if (k > 0.7) sparkle(ctx, front[0] + 3, front[1] - 6, 1.6, '#ffffff');
      },
    };
  },
  // Lulu, the stylist: snipping the air with her scissors (out of her pocket), a twirl, and fixing
  // her hair in a hand mirror.
  lulu(t) {
    const b = bitAt(t, [['snip', 2.6], ['twirl', 1], ['mirror', 3]], 1.8);
    if (!b) return { face: 'sassy' };
    if (b.kind === 'twirl') {
      return {
        pose: 'castspin', progress: b.u, face: 'excited',
        extra(ctx, x, y) {
          for (let i = 0; i < 5; i++) {
            const a = b.u * TAU * 2 + (i / 5) * TAU;
            sparkle(ctx, x + Math.cos(a) * 14, y - 20 + Math.sin(a) * 5, 2, i % 2 ? '#ff9ec0' : '#ffffff');
          }
        },
      };
    }
    if (b.kind === 'snip') {
      const k = inOut(b.u, 0.18, 0.82);
      const pocket = bump(b.u, 0, 0.2) + bump(b.u, 0.8, 1);
      return {
        rig: { frontArm: arm(4 * k, -6 * k + 2 * pocket), tilt: 3 * k }, face: 'sassy',
        hands(ctx, front, back, dir) {
          const snip = k > 0.6 ? Math.abs(Math.sin(b.s * 9)) * 0.5 : 0;
          scissors(ctx, front[0], front[1], dir, snip, clamp01(k * 2));
        },
      };
    }
    const k = inOut(b.u, 0.16, 0.84);
    const pat = k > 0.7 ? Math.abs(Math.sin(b.s * 7)) : 0;
    return {
      rig: { backArm: arm(3.4 * k, -8 * k), frontArm: arm(1.6 * k, (-12 + 1.4 * pat) * k), hx: h(-0.4 * k), tilt: -3 * k }, face: k > 0.5 ? 'excited' : 'sassy',
      hands(ctx, front, back, dir) { handMirror(ctx, back[0], back[1], dir, clamp01(k * 2)); },
    };
  },
  // Kestrel, the archer: a shot at a target off down the range, shading her eyes to look after
  // it, and checking an arrow's fletching (drawn from the quiver at her back).
  kestrel(t) {
    const b = bitAt(t, [['shoot', 1.3], ['shade', 2.2], ['fletch', 2.4]], 1.6);
    if (!b) return { face: 'smile', facing: 1 };
    if (b.kind === 'shoot') {
      const c = b.s;
      return {
        pose: c < 1 ? 'draw' : null, progress: Math.min(1, c), facing: 1, face: 'cool',
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
    }
    if (b.kind === 'shade') {
      const k = inOut(b.u);
      return { facing: 1, rig: { backArm: arm(4 * k, -12 * k), hx: h(0.6 * k), hy: h(-0.6 * k), tilt: -2 * k }, face: 'cool' };
    }
    const k = inOut(b.u, 0.22, 0.8);
    // The hand goes back over her shoulder to the quiver, comes round with an arrow, and puts it back.
    const reach = bump(b.u, 0, 0.26) + bump(b.u, 0.74, 1);
    return {
      facing: 1, rig: { backArm: arm(lerp(3 * k, -3, reach), lerp(-6 * k, -11, reach)), hx: h(0.5 * k), hy: h(0.8 * k) }, face: 'smile',
      hands(ctx, front, back, dir) {
        if (b.u < 0.16 || b.u > 0.84) return;
        ctx.strokeStyle = '#8a6040';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(back[0] - dir * 6, back[1] + 1);
        ctx.lineTo(back[0] + dir * 6, back[1] - 1);
        ctx.stroke();
        ctx.fillStyle = '#ff8fb0';
        ctx.fillRect(back[0] - dir * 6 - 1, back[1] - 0.4, 2.4, 2);
      },
    };
  },
  // Brann, the warrior: a drill of three cuts, flexing an arm, and resting the blade on his
  // shoulder to wipe his brow.
  brann(t) {
    const b = bitAt(t, [['drill', 2.2], ['flex', 1.8], ['wipe', 2]], 1.6);
    if (!b) return { face: 'cool' };
    if (b.kind === 'drill') {
      const c = b.s;
      const moves = [['slash', 0, 0.5], ['slash2', 0.8, 1.3], ['thrust', 1.7, 2.2]];
      const m = moves.find(([, a, e]) => c >= a && c < e);
      return m ? { pose: m[0], progress: (c - m[1]) / (m[2] - m[1]), face: 'angry' } : { face: 'angry' };
    }
    const k = inOut(b.u);
    if (b.kind === 'flex') return { rig: { backArm: arm(-1 * k, -9 * k), tilt: -3 * k, hy: h(-0.4 * k) }, face: k > 0.5 ? 'grin' : 'cool' };
    return { rig: { backArm: arm(3 * k + 1.2 * Math.sin(b.s * 8) * k, -12.5 * k), hy: h(0.6 * k) }, face: 'smile' };
  },
  // Elowen, the Mage Tower's: praying afloat, raising her staff to a light, and a slow nod as she
  // listens to the spirits.
  elowen(t) {
    const b = bitAt(t, [['pray', 4], ['raise', 2.4], ['listen', 2.4]], 0.6);
    const float = 4 + Math.sin(t * 1.6) * 2;
    if (!b || b.kind === 'pray') {
      return {
        pose: 'pray', progress: 0.5, lift: float, face: 'smile',
        extra(ctx, x, y, tt) {
          for (let i = 0; i < 4; i++) {
            const a = tt * 1.2 + (i / 4) * TAU;
            ctx.globalAlpha = 0.5 + 0.5 * Math.sin(a);
            sparkle(ctx, x + Math.cos(a) * 15, y - 24 + Math.sin(a) * 4, 1.8, '#fff3a6');
          }
          ctx.globalAlpha = 1;
        },
      };
    }
    const k = inOut(b.u);
    if (b.kind === 'raise') {
      return {
        lift: float, rig: { frontArm: arm(1.4 * k, -10 * k), backArm: arm(1 * k, -4 * k), tilt: -3 * k, hy: h(-0.6 * k) }, face: k > 0.5 ? 'excited' : 'smile',
        hands(ctx, front) {
          if (k < 0.3) return;
          const g = k * (0.7 + 0.3 * Math.sin(b.s * 6));
          ctx.globalAlpha = g;
          sparkle(ctx, front[0], front[1] - 18, 3.4, '#fff3a6');
          for (let i = 0; i < 3; i++) sparkle(ctx, front[0] + Math.cos(b.s * 2 + i * 2) * 7, front[1] - 18 + Math.sin(b.s * 2 + i * 2) * 4, 1.4, '#ffffff');
          ctx.globalAlpha = 1;
        },
      };
    }
    return { lift: float, rig: { hy: h(0.8 * Math.max(0, Math.sin(b.s * 3)) * k), hx: h(-0.5 * k), tilt: 3 * k }, face: 'smile' };
  },
  // Nim, the scholar: reading her floating spellbook, casting a sparkle upward, and a big stretch
  // and yawn. The book opens out of the air and folds away again round the other two.
  nim(t) {
    const b = bitAt(t, [['read', 4.4], ['cast', 1], ['stretch', 2]], 0.8);
    const kind = b?.kind ?? 'read';
    const u = b?.u ?? 0;
    const bookK = kind === 'read' ? soft(seg(u, 0, 0.12)) * (1 - soft(seg(u, 0.9, 1))) : 0;
    const book = (ctx, x, y, tt) => {
      if (bookK <= 0.02) return;
      const bx = x + 12;
      const by = y - 24 + Math.sin(tt * 2) * 1.5;
      ctx.save();
      ctx.translate(bx, by);
      ctx.scale(bookK, bookK);
      ctx.fillStyle = '#7a5cc8';
      ctx.fillRect(-7, -1, 14, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-6, -2, 5.6, 6);
      ctx.fillRect(0.4, -2, 5.6, 6);
      const flip = (tt * 0.8) % 1;
      if (flip < 0.3) {
        ctx.fillStyle = '#f3e8ff';
        const w = Math.cos((flip / 0.3) * Math.PI) * 5.6;
        ctx.fillRect(0.4 + Math.min(0, w), -2.6, Math.abs(w), 6);
      }
      ctx.fillStyle = '#c9a6ff';
      ctx.fillRect(-5, 0, 3.6, 0.6);
      ctx.fillRect(1.4, 1.4, 3.6, 0.6);
      ctx.restore();
    };
    if (kind === 'cast') {
      return {
        pose: 'castup', progress: u, face: 'excited',
        extra(ctx, x, y) { for (let i = 0; i < 6; i++) sparkle(ctx, x + Math.cos(i + u * 6) * 10, y - 40 - u * 20 + Math.sin(i * 2) * 6, 1.8, i % 2 ? '#c9a6ff' : '#ffffff'); },
      };
    }
    if (kind === 'stretch') {
      const k = inOut(u, 0.25, 0.75);
      return { rig: { frontArm: arm(1 * k, -12 * k), backArm: arm(1 * k, -12 * k), hy: h(-0.8 * k), tilt: -4 * k, by: h(-0.6 * k) }, face: k > 0.6 ? 'sleepy' : 'shy' };
    }
    const k = inOut(u);
    return { rig: { frontArm: arm(3 * k, -3 * k), hy: h(0.6 * k), hx: h(0.5 * k) }, face: 'shy', extra: book };
  },
  // Vex, the thief: a smug look round, picking at a nail with the dagger's point, and tossing a
  // coin up and catching it (from her belt and back).
  vex(t) {
    const b = bitAt(t, [['look', 2.6], ['nails', 2.4], ['coin', 2]], 1.6);
    if (!b) return { face: 'smug' };
    const k = inOut(b.u);
    if (b.kind === 'look') return { facing: b.u < 0.5 ? 1 : -1, rig: { hx: h(0.8 * k), tilt: -2 * k }, face: 'smug' };
    if (b.kind === 'nails') return { rig: { backArm: arm(3 * k, -5 * k), frontArm: arm(2 * k, -5 * k), hy: h(0.8 * k) }, face: 'smug' };
    const flip = seg(b.u, 0.25, 0.75);
    return {
      rig: { backArm: arm(2.6 * k, (-4 - 2 * bump(b.u, 0.22, 0.3)) * k) }, face: flip > 0.9 ? 'grin' : 'smug',
      hands(ctx, front, back) {
        if (b.u < 0.12 || b.u > 0.9) return;
        coin(ctx, back[0], back[1] - 2 - Math.sin(flip * Math.PI) * 24, flip * TAU * 3);
      },
    };
  },
  // Tora, the smith: hammering at the anvil, wiping her brow, and holding a blade up to check its
  // edge.
  tora(t) {
    const b = bitAt(t, [['hammer', 3.6], ['wipe', 1.8], ['check', 2.2]], 1.2);
    const anvil = (ctx, x, y) => place(ctx, anvilArt(), x + 18, y);
    if (!b || b.kind === 'hammer') {
      const c = cycle(t, 1.2);
      const swing = b && c < 0.6;
      return {
        pose: swing ? 'overhead' : null, progress: c / 0.6, facing: 1, face: 'grin',
        extra(ctx, x, y) {
          anvil(ctx, x, y);
          const hit = c - 0.42;
          if (!swing || hit < 0 || hit > 0.35) return;
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
    }
    const k = inOut(b.u);
    if (b.kind === 'wipe') return { facing: 1, rig: { backArm: arm(3.4 * k + 1.4 * Math.sin(b.s * 9) * k, -12.5 * k), tilt: -3 * k }, face: 'grin', extra: anvil };
    return { facing: 1, rig: { frontArm: arm(3 * k, -8 * k), hy: h(-0.8 * k), hx: h(0.6 * k) }, face: 'cool', extra: anvil };
  },
  // Captain Rook: his spyglass drawn from his belt and pulled out to its length to look out to sea
  // one way and then the other, a salute, and a stretch of the back.
  rook(t) {
    const b = bitAt(t, [['spy', 4], ['salute', 1.4], ['stretch', 1.8]], 2.4);
    if (!b) return { face: 'grin' };
    const k = inOut(b.u);
    if (b.kind === 'salute') return { rig: { frontArm: arm(1.4 * k, -12 * k), tilt: -2 * k, hy: h(-0.4 * k) }, face: 'grin' };
    if (b.kind === 'stretch') return { rig: { backArm: arm(-2 * k, 1 * k), frontArm: arm(-2 * k, 1 * k), tilt: -6 * k, tx: h(-0.8 * k) }, face: 'smile' };
    const raised = soft(seg(b.u, 0.06, 0.2)) * (1 - soft(seg(b.u, 0.84, 0.96)));
    const ext = soft(seg(b.u, 0.18, 0.28)) * (1 - soft(seg(b.u, 0.78, 0.86)));
    return {
      facing: b.u < 0.52 ? 1 : -1, rig: { backArm: arm(lerp(-1, 4, raised), lerp(1, -13, raised)), hx: h(0.6 * raised), hy: h(-0.5 * raised) }, face: raised > 0.5 ? 'cool' : 'grin',
      hands(ctx, front, back, dir) {
        // Held in the hand at the belt, up at the eye; its draw-tube slides out to full length.
        const len = 7 + 6 * ext;
        ctx.save();
        ctx.translate(back[0], back[1] - 3 * raised);
        ctx.rotate(dir * -0.12 * raised + (1 - raised) * dir * 1.2);
        ctx.fillStyle = '#c99a1f';
        ctx.fillRect(dir > 0 ? -2 : 2 - 7, -1.6, 7, 3.2);
        ctx.fillStyle = '#e0b53a';
        ctx.fillRect(dir > 0 ? 4 : -4 - (len - 6), -1.2, len - 6, 2.4);
        ctx.fillStyle = '#ffd66b';
        ctx.fillRect(dir > 0 ? len - 4 : -len, -2, 3, 4);
        ctx.fillStyle = '#bfe6ff';
        ctx.fillRect(dir > 0 ? len - 1.6 : -len, -1.2, 0.8, 2.4);
        ctx.restore();
      },
    };
  },
  // Mr. Pumpkins, the manor's old groundskeeper: a lantern always in his hand, held up to peer at
  // the manor's dark windows, a big yawn (he's been up a hundred years of nights), and a jingle of
  // the gate keys on his belt.
  pumpkins(t) {
    const b = bitAt(t, [['peer', 3.2], ['yawn', 1.8], ['jingle', 1.6]], 2.2);
    const k = b ? inOut(b.u) : 0;
    const lift = b?.kind === 'peer' ? k : 0;
    const lantern = (ctx, front, back, dir) => {
      const [lx, ly] = back;
      const sw = Math.sin(t * 2.2) * 1.2 * (1 - lift);
      ctx.save();
      ctx.translate(lx, ly - 2 * lift);
      ctx.rotate(sw * 0.1);
      ctx.fillStyle = '#4a3a6a';
      ctx.fillRect(-0.5, 0, 1, 2);
      ctx.fillRect(-2.6, 2, 5.2, 1);
      ctx.fillStyle = '#ffe2a0';
      ctx.fillRect(-2.2, 3, 4.4, 4.6);
      ctx.fillStyle = '#ffb35a';
      ctx.fillRect(-0.8, 4.2 + Math.sin(t * 9) * 0.3, 1.6, 2.2);
      ctx.fillStyle = '#4a3a6a';
      ctx.fillRect(-2.6, 7.6, 5.2, 1);
      ctx.restore();
    };
    if (!b) return { face: 'smile', hands: lantern };
    if (b.kind === 'peer') return { facing: 1, rig: { backArm: arm(4 * k, -10 * k), hx: h(0.6 * k), tilt: -2 * k }, face: 'cool', hands: lantern };
    if (b.kind === 'yawn') return { rig: { frontArm: arm(1 * k, -9 * k), tilt: -4 * k, hy: h(-0.4 * k) }, face: k > 0.4 ? 'sleepy' : 'smile', hands: lantern };
    return { rig: { frontArm: arm(2 * k + Math.sin(b.s * 22) * 0.6 * k, -3 * k) }, face: 'grin', hands: lantern };
  },
  // Bramble, the Hollow's warden: leaning on nothing with his arms folded, a look down the road for
  // anyone coming, and counting the party on his fingers.
  bramble(t) {
    const b = bitAt(t, [['fold', 3], ['lookout', 2.4], ['count', 2.4]], 1.6);
    if (!b) return { face: 'grin' };
    const k = inOut(b.u);
    if (b.kind === 'fold') return { rig: { frontArm: arm(-1.4 * k, -4 * k), backArm: arm(3.4 * k, -4 * k), tilt: -2 * k }, face: 'cool' };
    if (b.kind === 'lookout') return { facing: 1, rig: { backArm: arm(4 * k, -12 * k), hx: h(0.6 * k) }, face: 'cool' };
    const n = Math.min(4, 1 + Math.floor(seg(b.u, 0.15, 0.85) * 4));
    return { rig: { frontArm: arm(3 * k, -6 * k), backArm: arm(2 * k, -6 * k + (n % 2) * 0.5), hy: h(0.6 * k) }, face: n === 4 ? 'grin' : 'smile' };
  },
  // Posy, keeper of the Party Board: reaching up to pin a fresh quest note (a pink slip with a
  // heart), waving passers-by over to the board, and a little hop of a cheer when a party heads out.
  posy(t) {
    const b = bitAt(t, [['pin', 2.6], ['wave', 2], ['cheer', 1.1]], 1.8);
    if (!b) return { face: 'smile' };
    if (b.kind === 'cheer') return { pose: 'cheer', progress: b.u, face: 'excited' };
    const k = inOut(b.u);
    if (b.kind === 'wave') {
      const sway = Math.sin(b.s * 9) * 2.4 * k;
      return { facing: -1, rig: { frontArm: arm(3 * k + sway, -13 * k), tilt: -2 * k }, face: 'grin' };
    }
    // Up on tiptoe to the board, the note pressed flat, a tap to pin it, back down.
    const up = soft(seg(b.u, 0.08, 0.3)) * (1 - soft(seg(b.u, 0.8, 0.95)));
    const tap = Math.max(0, Math.sin(seg(b.u, 0.45, 0.6) * Math.PI)) * 1.5;
    return {
      facing: 1, rig: { frontArm: arm(4 * up + tap, -12 * up), hy: h(-0.8 * up), tilt: -3 * up }, face: up > 0.5 ? 'cool' : 'smile',
      hands(ctx, front) {
        if (up < 0.15) return;
        ctx.save();
        ctx.translate(front[0] + 1, front[1] - 2);
        ctx.globalAlpha = Math.min(1, up * 2);
        ctx.fillStyle = '#ffd6ea';
        ctx.fillRect(-2.6, -3.2, 5.2, 5.6);
        ctx.fillStyle = '#ff8fc1';
        ctx.beginPath();
        ctx.arc(-0.7, -0.8, 0.9, 0, TAU);
        ctx.arc(0.7, -0.8, 0.9, 0, TAU);
        ctx.moveTo(-1.6, -0.5);
        ctx.lineTo(0, 1.3);
        ctx.lineTo(1.6, -0.5);
        ctx.fill();
        ctx.restore();
      },
    };
  },
  // Marlo, the merchant: flipping a coin from her thumb and catching it, a cheer for a sale, and a
  // pitch with both arms spread over her wares.
  marlo(t) {
    const b = bitAt(t, [['flip', 2.2], ['cheer', 1.2], ['pitch', 2]], 1.6);
    if (!b) return { face: 'smug' };
    if (b.kind === 'cheer') return { pose: 'cheer', progress: b.u, face: 'excited' };
    const k = inOut(b.u);
    if (b.kind === 'pitch') return { rig: { frontArm: arm(5 * k, -5 * k), backArm: arm(-4 * k, -5 * k), tilt: -3 * k }, face: 'excited' };
    const c = seg(b.u, 0.25, 0.7);
    return {
      rig: { frontArm: arm(3 * k, (-4 - 2 * bump(b.u, 0.22, 0.3)) * k) }, face: c >= 1 ? 'grin' : 'smug',
      hands(ctx, front) {
        if (k < 0.4) return;
        coin(ctx, front[0], front[1] - 2 - Math.sin(c * Math.PI) * 20, c * TAU * 3);
      },
    };
  },
};

// Lulu's scissors: two blades opening and closing about a pin, held at the hand.
function scissors(ctx, x, y, dir, snip, k) {
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * k, k);
  ctx.strokeStyle = '#8d96a8';
  ctx.lineWidth = 1.2;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(-0.6 + s * snip) * 7, Math.sin(-0.6 + s * snip) * 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(Math.cos(2.5 + s * 0.4) * 2.6, Math.sin(2.5 + s * 0.4) * 2.6, 1.4, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}
// Lulu's hand mirror: a pink oval with a glint, on a short handle.
function handMirror(ctx, x, y, dir, k) {
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * k, k);
  ctx.fillStyle = '#ff9ec0';
  ctx.fillRect(-0.8, -3, 1.6, 4);
  ctx.beginPath();
  ctx.ellipse(0, -6.4, 3.4, 4, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e6f4ff';
  ctx.beginPath();
  ctx.ellipse(0, -6.4, 2.4, 3, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-1.4, -8.4, 0.8, 2);
  ctx.restore();
}

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
// Each town's own residents go about their day (render/townlife.js), and a couple of passers-by
// stroll up and down the street (both drawn from time alone). Other players come from the bot
// population (world/bots.js): they walk, chat, run shops, wave, and come and go.

const VILLAGERS = 2;

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

// A player who died out in the field gets a little tombstone dropped on them from the sky: it
// falls in a beat after they do, thuds into the ground with a puff of dust and a bounce, and
// wobbles to a stop, a flower on top.
const TOMB_AT = 0.7;
const TOMB_FALL = 0.28;
function drawTomb(ctx, x, y, since) {
  const s = since - TOMB_AT;
  if (s <= 0) return;
  const k = Math.min(1, s / TOMB_FALL);
  const land = s - TOMB_FALL;
  const drop = (1 - k * k) * 90;
  const bounce = land > 0 && land < 0.22 ? 4 * Math.sin((Math.PI * land) / 0.22) : 0;
  const wobble = land > 0 ? Math.sin(land * 22) * Math.exp(-land * 6) * 0.18 : 0;
  ctx.save();
  ctx.translate(snap(x), snap(y - drop - bounce));
  ctx.rotate(wobble);
  ctx.fillStyle = '#5d5285';
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(-8, -12);
  ctx.arc(0, -12, 8, Math.PI, 0);
  ctx.lineTo(8, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e4def3';
  ctx.beginPath();
  ctx.moveTo(-6.6, -1);
  ctx.lineTo(-6.6, -12);
  ctx.arc(0, -12, 6.6, Math.PI, 0);
  ctx.lineTo(6.6, -1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c4bcdc';
  ctx.fillRect(2.5, -14, 4.1, 13);
  ctx.fillStyle = '#7a6fa3';
  ctx.font = '800 5px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('RIP', 0, -9);
  ctx.fillRect(-0.6, -7, 1.2, 4.5);
  ctx.fillRect(-2.2, -5.8, 4.4, 1.1);
  // The flower on top.
  ctx.fillStyle = '#ff9ec0';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(2 + Math.cos(a) * 1.6, -20.5 + Math.sin(a) * 1.6, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#fff3a6';
  ctx.fillRect(1.4, -21.1, 1.2, 1.2);
  ctx.restore();
  // A puff of dust where it lands.
  if (land > 0 && land < 0.5) {
    const u = land / 0.5;
    ctx.save();
    ctx.globalAlpha = 0.6 * (1 - u);
    ctx.fillStyle = '#efe7da';
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(x + d * (8 + 10 * u), y - 2 - 3 * u, 2.5 + 2 * u, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function animFor(key, x, facing, time, body = null) {
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

// The wandering merchant's shop: a picnic rug with a few wares, and their shop's name on a board above them.
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
  ctx.font = '800 7px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  const w = Math.max(48, ctx.measureText(bot.shop.title).width + 14);
  const by = gy - 74 + Math.sin(time * 2 + bot.x * 0.01) * 1;
  box(ctx, x - w / 2, by, w, 14, { fill: hovered ? '#fff6c9' : '#ffffff', edge: '#ff9ec0', r: 5, width: 1.5 });
  box(ctx, x - w / 2 + 2, by + 2, 10, 10, { fill: '#ff9ec0', edge: null, r: 3 });
  text(ctx, '$', x - w / 2 + 7, by + 10, { size: 7, bold: true, align: 'center', color: '#ffffff' });
  text(ctx, bot.shop.title, x + 5, by + 10, { size: 7, bold: true, align: 'center', color: '#a8467a' });
}

const ITEM_COLORS = (id) => ITEMS[id]?.color ?? '#ffffff';

export function drawTownsfolk(ctx, map, cam, width, time, bots = [], hoverId = null, player = null) {
  if (!map.isTown || !settings.showCrowd) return;
  drawTownLife(ctx, map, cam, width, time, player);
  // (Nobody strolls through your own island: it is yours.)
  for (const p of map.private ? [] : villagersOf(map)) {
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
  const tags = [];
  for (const bot of bots) {
    const x = snap(bot.x - cam.x);
    if (x < -60 || x > width + 60) continue;
    const gy = snap(groundAt(map, bot.x) - cam.y);
    if (bot.shop) shopBooth(ctx, x, gy, bot, time, hoverId === bot.id);
    // Name tags further than a few steps away fade back, so a busy street stays readable.
    const far = player && Math.abs(bot.x - player.x) > 150;
    drawBot(ctx, bot, x, gy, time, hoverId === bot.id, said, groundSlope(map, bot.x), far, tags);
  }
  if (settings.chatBubbles) for (const [x, y, b] of said) drawBubble(ctx, x, y, b.text, Math.min(1, b.t * 2));
}

// One player: login shimmer, shadow, the character in their pose, and their name tag (gold for
// pros, green with a heart for party members, a title in gold and the guild underneath).
const afkAt = new WeakMap();

function drawBot(ctx, bot, x, y, time, hovered, said, slope = 0, far = false, tags = null) {
  const fade = bot.state === 'logout' ? Math.max(0, bot.timer / 0.6) : 1 - bot.appear;
  if (bot.appear > 0 || bot.state === 'logout') {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + time * 3;
      ctx.globalAlpha = 1 - fade;
      sparkle(ctx, x + Math.cos(a) * 12, y - 20 + Math.sin(a) * 18, 2.2, i % 2 ? '#ffe36b' : '#ffffff');
    }
    ctx.globalAlpha = 1;
  }
  const body = bot.body ?? null;
  if (!body || body.onGround) shadow(ctx, x, y, body ? slopeAt(body.surface, body.x) : slope);
  const waving = bot.state === 'wave';
  // (Town walking eases in and out: standing still mid-stroll, they stand.)
  const strolling = ['walk', 'leave', 'approach'].includes(bot.state) && (bot.speed == null || bot.speed > 4);
  let pose = waving ? 'cheer' : strolling || bot.moving ? 'walk' : 'idle';
  let progress = waving ? (1.6 - bot.timer) / 1.6 : 0;
  let dur = 0.5;
  // A hop for the fun of it (up over the street and down: world/botsoul.js).
  const hop = !body ? hopLift(bot) : 0;
  if (hop > 0) {
    pose = 'jump';
    y -= hop;
  }
  // A little emote, or a cheer at a catch.
  if (!body && bot.emote && !waving) {
    pose = bot.emote.pose;
    progress = bot.emote.t / bot.emote.dur;
    dur = bot.emote.dur;
  }
  // AFK: sat on the street, dozing, for as long as they're away.
  if (!body && bot.afk) {
    if (!afkAt.has(bot)) afkAt.set(bot, time);
    pose = 'afk';
    progress = 1;
    dur = Math.max(0.01, time - afkAt.get(bot));
  } else afkAt.delete(bot);
  if (body) {
    if (bot.attack) {
      pose = bot.attack.pose;
      progress = bot.attack.t / bot.attack.dur;
    } else if (body.rope) pose = 'climb';
    else if (!body.onGround) pose = 'jump';
    else pose = Math.abs(body.vx) > 8 ? 'walk' : 'idle';
  }
  // At a life spot, the stove or the bench, or fishing: the same moves and tools as yours, the
  // find held up in their hand (render/life.js).
  const life = bot.down ? null : botLifePose(bot, time);
  if (life) {
    pose = life.pose;
    progress = life.progress;
  }
  const own = bot.char.appearance;
  // (Their mood shows on their face now and then: world/botsoul.js.)
  const look = bot.bubble ? { ...own, face: /:D|!!|xD|<3/.test(bot.bubble.text) ? 'excited' : /uwu|:3|owo/.test(bot.bubble.text) ? 'cat' : 'grin' } : bot.moodFace && !bot.afk ? { ...own, face: bot.moodFace.face } : own;
  const gear = wornGear(bot.char);
  const seed = seedOf(bot.id);
  const facing = body ? body.facing : bot.facing;
  const anim = animFor(bot.id, body ? body.x : bot.x, facing, time, body);
  const state = {
    pose, progress, dur, vy: body ? body.vy : hop > 0 ? (bot.hop.t / bot.hop.dur < 0.5 ? -200 : 200) : undefined, time: time + seed * 0.37, seed, facing, job: bot.char.job, alpha: fade,
    // Party members fighting nearby stand on guard between swings.
    ready: Boolean(bot.party && bot.brain?.target), hurt: bot.hurt > 0,
  };
  let tip = null;
  if (life) {
    Object.assign(state, { dur: life.dur, from: life.from, blend: life.blend, ready: false, onHands: holdFind(life.find) });
    if (bot.life.kind === 'fish') state.onTool = (pt) => { tip = pt; };
  }
  if (bot.down) {
    if (!fellAt.has(bot)) fellAt.set(bot, time);
    drawFallen(ctx, look, wornGear(bot.char), x, y, { ...state, alpha: 0.75 }, time - fellAt.get(bot));
    if (bot.tomb) drawTomb(ctx, x + facing * 11, y, time - fellAt.get(bot));
  } else {
    fellAt.delete(bot);
    // Riding (world/botride.js): their mount, moving as they do.
    if (bot.riding && body && !body.rope && MOUNTS[bot.riding]) {
      const top = 125 * (MOUNTS[bot.riding].speed / 100);
      if (body.onGround && bot.rideAir) bot.rideLand = time;
      bot.rideAir = !body.onGround;
      drawMount(ctx, bot, bot.riding, x, y, time, { facing, speed: Math.abs(body.vx) / top, air: !body.onGround, vy: body.vy, landAt: bot.rideLand ?? -9 }, { look });
    } else drawHero(ctx, look, gear, x, y, state, anim);
    // Their line out on the water, to the float (where it is from where they're drawn).
    if (life && bot.life.kind === 'fish') {
      const s = bot.life.spot;
      const wx = body ? body.x : bot.x;
      const wy = body ? body.y : s.y;
      drawFriendFishing(ctx, { face: s.face, bx: s.bx, by: s.by, phase: bot.life.phase }, x, y, { x: wx - x, y: wy - y }, time, tip);
    }
  }
  ctx.save();
  if (far && !hovered && !bot.party) ctx.globalAlpha = 0.3;
  ctx.globalAlpha *= tagFade(x, y);
  ctx.font = '800 7px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  const label = `Lv${bot.level} ${bot.name}`;
  const pad = bot.pro || bot.party ? 18 : 10;
  const w = ctx.measureText(label).width + pad;
  // A friend's tag is sky blue.
  const fill = hovered ? '#ff8fc1' : bot.party ? 'rgba(40,120,80,0.8)' : bot.buddy ? 'rgba(50,110,190,0.8)' : bot.pro ? 'rgba(120,80,10,0.75)' : 'rgba(40,36,60,0.6)';
  // (A group of their own: the tag edged in their group's colour, so you can tell who's together.)
  const crewEdge = !bot.party && bot.crew ? bot.crew.color : null;
  // Tags of people standing together don't pile into an unreadable run: one that would land on
  // a tag already drawn steps down a row (once), and past that it's left off.
  let ty = y;
  const th = 12 + (bot.inDungeon ? 6 : (bot.title ? 8 : 0) + (bot.guild ? 8 : 0));
  if (tags) {
    for (let k = 0; k < 2 && ty != null; k++) {
      const hit = tags.find((o) => x - w / 2 < o.x1 + 2 && o.x0 < x + w / 2 + 2 && ty < o.y + o.h && o.y < ty + th);
      if (!hit) break;
      ty = k < 1 ? hit.y + hit.h : null;
    }
  }
  if (ty == null && !hovered) {
    ctx.restore();
    if (bot.bubble) said.push([x, y - (bot.shop ? 80 : 62), bot.bubble]);
    return;
  }
  ty ??= y;
  tags?.push({ x0: x - w / 2, x1: x + w / 2, y: ty, h: th });
  box(ctx, x - w / 2, ty + 2, w, 10, { fill, edge: bot.pro ? '#ffd66b' : bot.party ? '#bff0dc' : crewEdge ?? (bot.buddy ? '#cfe8ff' : hovered ? '#ffffff' : null), r: 5, width: crewEdge ? 1.5 : 1 });
  if (crewEdge) {
    ctx.fillStyle = crewEdge;
    ctx.beginPath();
    ctx.arc(x + w / 2 + 4, ty + 7, 2, 0, TAU);
    ctx.arc(x + w / 2 + 8.5, ty + 7, 2, 0, TAU);
    ctx.fill();
  }
  // Away from the keyboard: a little AFK tag that breathes over their head.
  if (bot.afk) {
    const a = 0.75 + 0.25 * Math.sin(time * 2.2 + seed);
    const was = ctx.globalAlpha;
    ctx.globalAlpha = a * fade;
    box(ctx, x - 11, y - 52 + Math.sin(time * 1.6 + seed) * 1.2, 22, 9, { fill: 'rgba(90,82,120,0.85)', edge: '#d9d0f0', r: 4.5, width: 1 });
    text(ctx, 'AFK', x, y - 45.5 + Math.sin(time * 1.6 + seed) * 1.2, { size: 6, bold: true, align: 'center', color: '#f2ecff' });
    ctx.globalAlpha = was;
  }

  if (bot.party) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 6, ty + 10);
    ctx.bezierCurveTo(x - w / 2 + 1, ty + 6.5, x - w / 2 + 3.5, ty + 3.5, x - w / 2 + 6, ty + 5.8);
    ctx.bezierCurveTo(x - w / 2 + 8.5, ty + 3.5, x - w / 2 + 11, ty + 6.5, x - w / 2 + 6, ty + 10);
    ctx.fill();
  } else if (bot.pro) sparkle(ctx, x - w / 2 + 6, ty + 7, 2.6, '#ffd66b');
  text(ctx, label, x + (pad > 10 ? 4 : 0), ty + 9.5, { size: 7, bold: true, align: 'center', color: bot.party ? '#e6ffee' : bot.pro ? '#ffe9a0' : '#fff6c9' });
  // In a dungeon, everyone's HP shows under their name.
  if (bot.inDungeon && bot.hp != null) {
    const f = Math.max(0, bot.hp / bot.stats.maxHp);
    box(ctx, x - 16, ty + 13, 32, 4, { fill: 'rgba(58,45,79,0.6)', edge: null, r: 2 });
    if (f > 0) box(ctx, x - 16, ty + 13, Math.max(2, 32 * f), 4, { fill: f < 0.3 ? '#ff6b8a' : '#7ee081', edge: null, r: 2 });
  } else {
    // The title they wear (gold), then their guild.
    if (bot.title) text(ctx, bot.title, x, ty + 20, { size: 6, bold: true, align: 'center', color: '#ffe08a', outline: 'rgba(60,40,20,0.7)' });
    if (bot.guild) text(ctx, `<${bot.guild}>`, x, ty + (bot.title ? 28 : 20), { size: 6, bold: true, align: 'center', color: '#c9f2ff', outline: 'rgba(40,36,60,0.7)' });
  }
  ctx.restore();
  if (bot.bubble) said.push([x, y - (bot.shop ? 80 : 62), bot.bubble]);
}

// Your party, on any map, wherever they are.
export function drawParty(ctx, members, cam, width, time, hoverId = null) {
  const said = [];
  const tags = [];
  for (const bot of members) {
    if (!bot.body) continue;
    const x = snap(bot.body.x - cam.x);
    if (x < -60 || x > width + 60) continue;
    drawBot(ctx, bot, x, snap(bot.body.y - cam.y), time, hoverId === bot.id, said, 0, false, tags);
  }
  if (settings.chatBubbles) for (const [x, y, b] of said) drawBubble(ctx, x, y, b.text, Math.min(1, b.t * 2));
}

// A little four-point sparkle (the glint on the capsule machine's globe).
function sparkleAt(ctx, x, y, r, c, a) {
  if (r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha = a;
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
