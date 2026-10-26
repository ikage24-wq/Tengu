// Towns: the buildings behind each NPC (market stalls, guild halls, an info kiosk), houses along
// the street, a fountain on the plaza, townsfolk and other "players" walking about and chatting,
// and each NPC's own idle routine. Everything is drawn from time alone, so nothing here keeps
// state; layouts are seeded so they never jitter.

import { wornGear } from '../core/character.js';
import { settings } from '../core/settings.js';
import { R, E, T, F, shade, snap, footShadow, slopeAt } from './pixel.js';
import { art, place, houseArt, mushHouseArt, treehouseArt, tentArt } from './scenery.js';
import { drawHero, HAIR_STYLES, PICKABLE_EYE_STYLES, OUTFIT_STYLES } from './hero.js';
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

function stallArt(kind, frame) {
  const S = STALLS[kind];
  return art(`stall|${kind}|${frame}`, 88, 74, () => {
    const out = [R(10, 24, 68, 28, S.back), R(7, 12, 4, 62, S.wood), R(77, 12, 4, 62, S.wood)];
    out.push(T([[2, 24], [10, 8], [78, 8], [86, 24]], S.awning[0]));
    for (let i = 1; i < 8; i += 2) out.push(T([[2 + i * 10.5, 24], [10 + i * 8.5, 8], [10 + (i + 1) * 8.5, 8], [2 + (i + 1) * 10.5, 24]], S.awning[1]));
    for (let i = 0; i < 8; i++) out.push(E(7.25 + i * 10.5, 24, 5.25, 3.6, S.awning[i % 2]));
    out.push(R(8, 5, 72, 4, shade(S.awning[0], -12)));
    out.push(...S.goods(frame));
    out.push(R(4, 50, 80, 24, S.wood), R(2, 48, 84, 4, shade(S.wood, 12)), R(10, 56, 68, 14, S.cloth));
    for (let i = 0; i < 6; i++) out.push(F(E(15.6 + i * 11.3, 56, 5.6, 2.4, shade(S.cloth, -8))));
    return out;
  });
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

function hallArt(kind, frame) {
  const S = HALLS[kind];
  const W = 116;
  const H = 104;
  return art(`hall|${kind}|${frame}`, W, H, () => {
    const out = [];
    const top = kind === 'mage' ? 40 : 36;
    // Walls, with plank or block lines.
    out.push(R(12, top, W - 24, H - top, S.wall));
    for (let y = top + 8; y < H - 4; y += 9) out.push(F(R(12, y, W - 24, 0.8, shade(S.wall, -6))));
    out.push(R(10, top - 2, W - 20, 4, S.trim), R(10, H - 4, W - 20, 4, S.trim));
    // Roof by style.
    if (kind === 'warrior') {
      out.push(R(8, top - 10, W - 16, 10, S.roof));
      for (let x = 8; x < W - 10; x += 12) out.push(R(x, top - 16, 7, 7, S.roof));
    } else if (kind === 'mage') {
      out.push(T([[4, top + 2], [W / 2, 2], [W - 4, top + 2]], S.roof), F(T([[14, top], [W / 2, 8], [W - 14, top], [W - 14, top + 1.4], [W / 2, 9.6], [14, top + 1.4]], shade(S.roof, 14))));
      out.push(star(W / 2, 22, 5, '#ffe36b'), star(30, top - 6, 2, '#ffffff'), star(86, top - 8, 2.4, '#ffffff'));
    } else {
      out.push(T([[2, top + 4], [W / 2, top - 30], [W - 2, top + 4]], S.roof), F(T([[10, top + 1], [W / 2, top - 24], [W - 10, top + 1], [W - 10, top + 3], [W / 2, top - 22], [10, top + 3]], shade(S.roof, 14))));
    }
    // The door, open and warmly lit.
    const dx = W / 2;
    out.push(R(dx - 14, H - 40, 28, 40, S.trim), E(dx, H - 40, 14, 10, S.trim));
    out.push(R(dx - 11, H - 38, 22, 38, '#5a3f2a'), E(dx, H - 38, 11, 8, '#5a3f2a'));
    out.push(F(R(dx - 9, H - 36, 18, 36, '#ffcf7a')), F(E(dx, H - 36, 9, 6.4, '#ffcf7a')), F(E(dx, H - 18, 7, 14, '#ffe6a8')));
    // Windows, lit.
    for (const wx of [24, W - 24]) {
      out.push(R(wx - 8, top + 12, 16, 16, S.trim), F(R(wx - 6, top + 14, 12, 12, '#fff3a6')), F(R(wx - 0.5, top + 14, 1, 12, S.trim)), F(R(wx - 6, top + 19.5, 12, 1, S.trim)));
      out.push(R(wx - 9, top + 28, 18, 3, shade(S.trim, -8)));
      out.push(F(E(wx - 4, top + 27.4, 1.6, 1.6, '#ff9ec0')), F(E(wx, top + 27, 1.6, 1.6, '#ffe36b')), F(E(wx + 4, top + 27.4, 1.6, 1.6, '#9be08f')));
    }
    // Banners either side of the door, waving a little.
    const wave = [0, 1, 0, -1][frame % 4];
    for (const bx of [dx - 24, dx + 18]) out.push(R(bx, top + 4, 6, 1.4, S.trim), T([[bx, top + 5], [bx + 6, top + 5], [bx + 6 + wave * 0.3, top + 24], [bx + 3 + wave * 0.5, top + 20], [bx + wave * 0.3, top + 24]], S.banner));
    // The guild emblem over the door.
    out.push(E(dx, H - 56, 9, 9, '#ffffff'), E(dx, H - 56, 8, 8, S.banner), ...emblem(kind, dx, H - 56));
    return out;
  });
}

// ---------- Small buildings ----------

function kioskArt() {
  return art('kiosk', 70, 76, () => [
    R(6, 20, 3.4, 56, '#c99a6b'), R(61, 20, 3.4, 56, '#c99a6b'),
    T([[0, 22], [35, 4], [70, 22]], '#7fd1a8'), F(T([[6, 20], [35, 8], [64, 20], [64, 21.4], [35, 9.4], [6, 21.4]], '#bff0dc')),
    R(4, 22, 62, 4, '#5fbf8a'),
    R(10, 28, 50, 32, '#f0d6a8'), R(9, 27, 52, 2, '#c99a6b'), R(9, 59, 52, 2, '#c99a6b'),
    // Notices and a little map pinned to the board.
    R(13, 31, 12, 10, '#ffffff'), F(R(15, 33, 8, 0.8, '#c9a6ff')), F(R(15, 35, 6, 0.8, '#c9a6ff')), F(E(19, 31, 1, 1, '#ff6b8a')),
    R(28, 30, 18, 14, '#d6f0ff'), F(E(33, 36, 3, 2.4, '#9be08f')), F(E(40, 39, 3.4, 2.4, '#9be08f')), F(R(34, 37, 6, 0.8, '#ffffff')), F(E(37, 30, 1, 1, '#ffe36b')),
    R(49, 32, 9, 12, '#fff3a6'), F(R(51, 35, 5, 0.8, '#ffab5c')), F(E(53.5, 32, 1, 1, '#5aa8ff')),
    R(14, 46, 14, 9, '#ffd6ea'), F(R(16, 49, 10, 0.8, '#ff8fc1')), F(E(21, 46, 1, 1, '#9be08f')),
    R(32, 47, 24, 9, '#ffffff'), F(R(34, 50, 18, 0.8, '#9c86b8')), F(R(34, 52.4, 12, 0.8, '#9c86b8')), F(E(44, 47, 1, 1, '#ff6b8a')),
  ]);
}

function officeArt() {
  return art('office', 90, 82, () => {
    const out = [R(8, 24, 74, 58, '#e8f4ff')];
    for (let x = 8; x < 82; x += 7) out.push(F(R(x, 24, 0.8, 58, '#c9dcf0')));
    out.push(T([[2, 26], [45, 4], [88, 26]], '#6f9cff'), F(T([[10, 24], [45, 8], [80, 24], [80, 25.6], [45, 9.6], [10, 25.6]], '#a8c8ff')));
    out.push(R(32, 50, 26, 32, '#4f6fae'), F(R(34, 52, 22, 30, '#ffcf7a')));
    // A life ring and an anchor sign.
    out.push(E(18, 50, 7, 7, '#ff6b6b'), E(18, 50, 4, 4, 'none'), F(R(12, 49, 2.4, 2.4, '#ffffff')), F(R(21.6, 49, 2.4, 2.4, '#ffffff')));
    out.push(E(45, 37, 8, 8, '#ffffff'), F(R(44.4, 31, 1.4, 11, '#4f6fae')), F(R(41, 33, 8.4, 1.4, '#4f6fae')), F(T([[39.6, 39], [45, 43.4], [50.4, 39], [49, 38.6], [45, 41.6], [41, 38.6]], '#4f6fae')));
    out.push(R(64, 40, 12, 12, '#ffffff'), F(R(66, 42, 8, 8, '#fff3a6')), F(R(69.6, 42, 0.8, 8, '#ffffff')));
    return out;
  });
}

function anvilArt() {
  return art('anvil', 24, 18, () => [
    T([[2, 4], [22, 4], [20, 8], [15, 9], [15, 14], [19, 18], [5, 18], [9, 14], [9, 9], [4, 8]], '#6d7484'),
    F(R(4, 4, 16, 1.4, '#aeb9cf')),
  ]);
}

function adobeArt(seed) {
  const wall = pick(['#f2c48d', '#f6d3a8', '#e8b07a'], seed);
  return art(`adobe|${wall}`, 76, 62, () => [
    R(8, 18, 60, 44, wall), E(14, 20, 6, 4, wall), E(62, 20, 6, 4, wall), R(6, 16, 64, 4, shade(wall, -8)),
    ...[14, 26, 50, 62].map((x) => R(x, 20, 3, 3, '#8a5a3c')),
    R(30, 36, 16, 26, '#b5784a'), E(38, 36, 8, 6, '#b5784a'), F(R(32, 38, 12, 24, '#7a4a2b')), F(E(38, 38, 6, 4, '#7a4a2b')),
    R(14, 30, 10, 10, '#5fb8d8'), F(R(15.4, 31.4, 7.2, 7.2, '#fff3a6')), R(52, 30, 10, 10, '#5fb8d8'), F(R(53.4, 31.4, 7.2, 7.2, '#fff3a6')),
    T([[26, 34], [38, 28], [50, 34]], '#e0504d'), F(T([[26, 34], [32, 31], [32, 34]], '#ffd66b')),
    E(68, 58, 4, 4, '#8fbf6a'), R(66, 58, 4, 4, '#c97f4f'),
  ]);
}

function fountainArt() {
  return art('fountain', 72, 42, () => [
    E(36, 36, 34, 6, '#c9bedc'), R(2, 26, 68, 10, '#c9bedc'), E(36, 26, 34, 6, '#ece4ff'), E(36, 26, 30, 4.4, '#8fd3ff'), F(E(28, 25.4, 8, 1.4, '#d6f0ff')),
    R(31, 8, 10, 18, '#ece4ff'), E(36, 8, 9, 3, '#c9bedc'), E(36, 7, 7, 2, '#8fd3ff'), E(36, 2, 3, 3, '#ffffff'),
    F(R(4, 30, 64, 0.8, '#b9aed0')),
  ]);
}

// ---------- The street ----------

const STREET = {
  town: [],
  harbor: ['house', 'house'],
  crag: ['adobe', 'tent', 'adobe'],
  grove: ['treehouse', 'mushhouse'],
};

function buildingArt(kind, time) {
  const frame = Math.floor(time * 4) % 4;
  if (STALLS[kind]) return stallArt(kind, frame % 2);
  if (HALLS[kind]) return hallArt(kind, frame);
  if (kind === 'kiosk') return kioskArt();
  if (kind === 'office') return officeArt();
  return null;
}

// A wooden sign hanging from two chains, with the building's name.
function hangingSign(ctx, x, y, label, time) {
  ctx.font = 'bold 7px "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  const w = ctx.measureText(label).width + 12;
  const sway = Math.sin(time * 1.6 + x * 0.01) * 0.8;
  ctx.strokeStyle = '#8a6a4a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - w / 2 + 4, y - 6);
  ctx.lineTo(x - w / 2 + 4 + sway, y);
  ctx.moveTo(x + w / 2 - 4, y - 6);
  ctx.lineTo(x + w / 2 - 4 + sway, y);
  ctx.stroke();
  box(ctx, x - w / 2 + sway, y, w, 11, { fill: '#f6dfb8', edge: '#a8764a', r: 3, width: 1.2 });
  text(ctx, label, x + sway, y + 8, { size: 7, bold: true, align: 'center', color: '#6a4a2b' });
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
      place(ctx, fountainArt(), x, gy);
      ctx.save();
      for (let i = 0; i < 10; i++) {
        const u = (time * 0.9 + i / 10) % 1;
        const side = i % 2 ? 1 : -1;
        const px = x + side * u * 22;
        const py = gy - 40 - Math.sin(u * Math.PI) * 10 + u * 22;
        ctx.globalAlpha = 0.8 * (1 - u * 0.5);
        ctx.fillStyle = i % 3 ? '#bfe6ff' : '#ffffff';
        ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
      }
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(time * 3);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x, gy - 16, 8 + ((time * 10) % 12), 1.6, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }
  // Each NPC's stall or hall, with its sign.
  for (const n of map.npcs) {
    const npc = NPCS[n.id];
    if (!npc.building) continue;
    const x = snap(n.x - cam.x);
    if (x < -80 || x > width + 80) continue;
    const s = buildingArt(npc.building, time);
    if (!s) continue;
    const gy = ground(n.x);
    place(ctx, s, x, gy);
    if (npc.building === 'forge') forgeGlow(ctx, x, gy, time);
    if (npc.sign) hangingSign(ctx, x, gy - s.h - 10, npc.sign, time);
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
  const by = gy - 74 + Math.sin(time * 2 + x * 0.01) * 1;
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
    // Fallen in a dungeon: lying on the floor, with a little ghost bobbing over them.
    ctx.save();
    ctx.translate(x, y - 5);
    ctx.rotate(-facing * Math.PI / 2);
    drawHero(ctx, { ...look, face: 'pout' }, wornGear(bot.char), 0, 0, { ...state, pose: 'idle', ready: false, hurt: false, down: true, alpha: 0.75 });
    ctx.restore();
    const bob = Math.sin(time * 3 + seed) * 2;
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y - 26 + bob, 5, Math.PI, 0);
    ctx.lineTo(x + 5, y - 20 + bob);
    ctx.lineTo(x + 2, y - 22 + bob);
    ctx.lineTo(x, y - 20 + bob);
    ctx.lineTo(x - 2, y - 22 + bob);
    ctx.lineTo(x - 5, y - 20 + bob);
    ctx.fill();
    ctx.fillStyle = '#3a2d4f';
    ctx.fillRect(x - 2.5, y - 27 + bob, 1.2, 1.6);
    ctx.fillRect(x + 1.3, y - 27 + bob, 1.2, 1.6);
    ctx.restore();
  } else drawHero(ctx, look, wornGear(bot.char), x, y, state, anim);
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
