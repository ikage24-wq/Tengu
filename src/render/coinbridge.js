// Coinbridge, the canal trading town under Sprout Village (data/maps.js coinbridge, coin_inn).
//
// A merchant port climbing a hillside in four terraces: the Canal Docks at the water (cargo
// cranes, crates, a moored barge), the Market Canals (the domed Auction House, striped stalls,
// a canal with gondolas under an arched bridge), the Lantern Terraces (the Gilded Kettle inn,
// its balcony strung with lights) and Guild Heights (the Adventurers' Guild keep and the Trade
// Hall office, and the bell tower over the whole town). Warm Venetian stucco, terracotta roofs,
// pale limestone and gold, teal canal water. Drawn like the rest of the scenery: outlined pastel
// shapes lit from the upper left. Pieces are `cb_*` town pieces: [kind, x, extra].
//
// Inside the inn (coin_inn, 640 x 480 like the Sweethearts' rooms): the bar with its bottles and
// taps, the fireplace with the great kettle, tables, the card table under its lamp, and the stair
// up to the rooms.

import { drawItemIcon } from './icons.js';
import { R, E, T, F, mix, snap } from './pixel.js';
import { ramp, planks, stones, windowPane, wallShade, beam, hash } from './propkit.js';
import { art, place } from './scenery.js';
import { groundAt } from '../world/physics.js';

const TAU = Math.PI * 2;
const WHITE = '#ffffff';
const GOLD = '#ffd36b';
const STONE = '#efe4d2';
const ROOF = '#e8866a';
const WATER = { top: '#8fe0d8', mid: '#5fc4c4', deep: '#3f98b0', foam: '#f2fffc' };
const STUCCO = ['#ffd9b0', '#ffe8cc', '#f8c4b0', '#ffe0a8', '#f6d0c8'];
const SHUTTERS = ['#6fc0b0', '#8fa8e8', '#e88aa8', '#7fcf9a'];
const BLOOMS = ['#ff8fb0', '#ffe36b', '#ffffff', '#c9a6ff', '#ff9a6a'];
const pick = (list, seed) => list[Math.floor(hash(seed) * list.length) % list.length];

function glow(ctx, x, y, r, color, alpha) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
function puffs(ctx, x, y, time, seed, n = 3, rise = 26) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const u = (time * 0.35 + i / n + seed) % 1;
    ctx.globalAlpha = 0.55 * (1 - u);
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(x + Math.sin(time + i) * 3 - u * 8, y - u * rise, 2.5 + u * 5, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Parts ----------

// An arched window: limestone surround, the pane lit warm, a sill.
function archWindow(x, y, w, h, frame = STONE, lit = true) {
  const r = ramp(frame, 0.7);
  return [
    R(x - 2, y + w / 2 - 1, w + 4, h - w / 2 + 3, r.base), E(x + w / 2, y + w / 2, w / 2 + 2, w / 2 + 2, r.base),
    R(x, y + w / 2, w, h - w / 2, '#5a6a9a'), E(x + w / 2, y + w / 2, w / 2, w / 2, '#5a6a9a'),
    ...(lit ? [F(R(x + 1, y + w / 2, w - 2, h - w / 2 - 1, '#ffd98a')), F(E(x + w / 2, y + w / 2, w / 2 - 1, w / 2 - 1, '#ffd98a')), F(R(x + 1.5, y + w / 2 - 1, w * 0.3, h - w / 2 - 2, '#fff3c4'))] : []),
    F(R(x + w / 2 - 0.5, y + 1, 1, h - 1, r.sh)), F(R(x, y + h * 0.6, w, 1, r.sh)),
    R(x - 3, y + h + 1, w + 6, 2.4, r.base), F(R(x - 3, y + h + 1, w + 6, 0.8, r.hi)),
  ];
}
// Shutters either side of a window, folded open.
function shutters(x, y, w, h, c) {
  const s = ramp(c, 0.8);
  const out = [];
  for (const sx of [x - 6, x + w + 1]) {
    out.push(R(sx, y + 2, 5, h - 2, s.base), F(R(sx, y + 2, 5, 1, s.hi)));
    for (let k = 1; k < 5; k++) out.push(F(R(sx + 0.6, y + 2 + k * (h - 2) / 5, 3.8, 0.8, s.sh)));
  }
  return out;
}
// A flower box under a window, flowers nodding over its rim.
function flowerBox(x, y, w, seed) {
  const out = [R(x, y, w, 4, '#a8704a'), F(R(x, y, w, 1, '#c89060'))];
  for (let k = 0; k < Math.floor(w / 4); k++) out.push(F(E(x + 2 + k * 4, y - 1, 1.6, 1.5, pick(BLOOMS, seed + k * 2.3))));
  out.push(F(E(x + w * 0.3, y - 0.4, 1.4, 0.8, '#7fcf8a')), F(E(x + w * 0.7, y - 0.4, 1.4, 0.8, '#7fcf8a')));
  return out;
}
// A little balcony: a stone slab on corbels and a balustrade of fat little posts.
function balcony(x, y, w) {
  const r = ramp(STONE, 0.7);
  const out = [R(x, y, w, 3, r.base), F(R(x, y, w, 1, r.hi)), T([[x + 3, y + 3], [x + 7, y + 3], [x + 5, y + 8]], r.sh), T([[x + w - 7, y + 3], [x + w - 3, y + 3], [x + w - 5, y + 8]], r.sh)];
  out.push(R(x, y - 10, w, 2, r.base));
  for (let px = x + 2; px < x + w - 1; px += 4) out.push(E(px + 1, y - 4, 1.4, 3.2, r.base), F(E(px + 0.6, y - 5, 0.5, 1.6, r.hi)));
  return out;
}
// A terracotta roof over `x0..x1` from `base` up to `peak`, tiles in rows.
function tiledRoof(x0, x1, base, peak, c = ROOF) {
  const r = ramp(c, 0.8);
  const mid = (x0 + x1) / 2;
  const out = [T([[x0 - 4, base], [mid, peak], [x1 + 4, base]], r.base), F(T([[mid, peak], [x1 + 4, base], [mid + 2, base]], r.sh))];
  for (let y = peak + 5; y < base; y += 5) {
    const u = (y - peak) / (base - peak);
    const half = (x1 - x0 + 8) / 2 * u;
    out.push(F(R(mid - half, y, half * 2, 1, r.sh)));
  }
  out.push(R(x0 - 5, base, x1 - x0 + 10, 3, r.sh));
  return out;
}

// ---------- Buildings ----------

// A Venetian canal house, 96 wide: a limestone ground floor with an arched door, two storeys of
// warm stucco with arched windows (shutters, flower boxes, a balcony), a terracotta roof and a
// bell-mouthed chimney. `seed` picks its colours and details.
export function palazzoArt(seed) {
  const wallC = pick(STUCCO, seed);
  const shC = pick(SHUTTERS, seed * 3.1);
  const tall = hash(seed * 7.7) > 0.5;
  const H = tall ? 178 : 150;
  return art(`cb-palazzo|${wallC}|${shC}|${tall}`, 96, H, () => {
    const W = 96;
    const wall = ramp(wallC, 0.6);
    const stone = ramp(STONE, 0.7);
    const top = 34;
    const out = [];
    // The chimney behind the roof.
    out.push(R(66, 8, 9, 24, '#d8907a'), T([[62, 4], [79, 4], [76, 10], [65, 10]], '#c87a64'));
    out.push(...tiledRoof(6, 90, top, 10));
    // The walls.
    out.push(R(6, top, 84, H - top, wall.base), ...wallShade(6, top + 2, 84, H - top - 2, wall, 2.4));
    // A string course between each floor.
    const floors = tall ? [top + 44, top + 86] : [top + 50];
    for (const y of floors) out.push(...beam(4, y, 88, 3, STONE));
    // Upstairs windows.
    const rows = tall ? [top + 8, top + 52] : [top + 12];
    rows.forEach((y, i) => {
      for (const x of [18, 42, 66]) out.push(...archWindow(x, y, 12, 26), ...shutters(x, y + 6, 12, 20, shC), ...flowerBox(x - 2, y + 29, 16, seed + x + i));
      if (i === 0 && hash(seed * 2.2) > 0.4) out.push(...balcony(36, y + 33, 24));
    });
    // The limestone ground floor: an arched door, a window, steps down to the street.
    const gf = H - 46;
    out.push(R(6, gf, 84, 46, stone.base), ...stones(6, gf + 2, 84, 42, stone, seed * 5));
    out.push(R(16, H - 40, 24, 40, '#7a5a5a'), E(28, H - 40, 12, 10, '#7a5a5a'), R(18, H - 38, 20, 38, '#a8704a'), E(28, H - 38, 10, 8, '#a8704a'));
    out.push(...planks(19, H - 38, 18, 37, ramp('#a8704a', 0.8), 3, seed), F(E(34, H - 18, 1.2, 1.2, GOLD)));
    out.push(...archWindow(56, H - 40, 20, 26, '#e0d4c0'));
    out.push(R(12, H - 3, 32, 3, stone.sh));
    return out;
  }, false);
}

// The Auction House, 300 wide and 236 tall: steps up to a portico of four limestone columns, a
// pediment with a gold coin in it, a drum with a clock face, and a gold dome with a lantern on
// top; long banners between the columns, the great doors open and lit.
export const AUCTION = { w: 300, h: 236 };
export function auctionArt() {
  return art('cb-auction', AUCTION.w, AUCTION.h, () => {
    const W = AUCTION.w;
    const H = AUCTION.h;
    const stone = ramp(STONE, 0.7);
    const gold = ramp(GOLD, 0.7);
    const wall = ramp('#ffe8cc', 0.6);
    const out = [];
    // The dome and its lantern.
    out.push(E(W / 2, 74, 62, 52, gold.base), F(E(W / 2 + 14, 80, 46, 44, gold.sh)), F(E(W / 2 - 22, 52, 16, 18, gold.hi)));
    for (let k = -2; k <= 2; k++) out.push(F(T([[W / 2 + k * 22 - 1, 30], [W / 2 + k * 26 - 1.5, 76], [W / 2 + k * 26 + 1.5, 76], [W / 2 + k * 22 + 1, 30]], gold.sh)));
    out.push(R(W / 2 - 8, 6, 16, 18, stone.base), E(W / 2, 6, 9, 6, gold.base), R(W / 2 - 1, -4, 2, 8, gold.base), F(E(W / 2, -5, 2.4, 2.4, gold.hi)));
    out.push(...archWindow(W / 2 - 4, 9, 8, 12, STONE));
    // The drum under the dome, with its clock.
    out.push(R(W / 2 - 70, 74, 140, 30, stone.base), ...stones(W / 2 - 70, 76, 140, 26, stone, 3));
    out.push(E(W / 2, 89, 13, 13, gold.base), E(W / 2, 89, 11, 11, WHITE));
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      out.push(F(R(W / 2 + Math.cos(a) * 9 - 0.5, 89 + Math.sin(a) * 9 - 0.5, 1, 1, '#5a4a6a')));
    }
    // The hall behind the portico.
    out.push(R(14, 104, W - 28, H - 104, wall.base), ...wallShade(14, 106, W - 28, H - 106, wall, 2.6));
    // The pediment and the coin in it.
    out.push(T([[4, 130], [W / 2, 100], [W - 4, 130]], stone.base), F(T([[W / 2, 100], [W - 4, 130], [W / 2 + 4, 130]], stone.sh)), R(2, 130, W - 4, 8, stone.base), F(R(2, 130, W - 4, 1.4, stone.hi)), F(R(2, 136, W - 4, 2, stone.sh)));
    out.push(E(W / 2, 120, 10, 8, gold.base), E(W / 2, 120, 7, 5.5, gold.hi), F(R(W / 2 - 0.8, 116, 1.6, 8, gold.sh)), F(R(W / 2 - 3, 117, 6, 1.2, gold.sh)), F(R(W / 2 - 3, 122, 6, 1.2, gold.sh)));
    // Four columns, fluted, on bases under capitals.
    for (const cx of [44, 108, 192, 256]) {
      out.push(R(cx - 10, 138, 20, 6, stone.base), R(cx - 8, 144, 16, H - 160, stone.base), F(R(cx - 8, 144, 4, H - 160, stone.hi)), F(R(cx + 4, 144, 4, H - 160, stone.sh)));
      for (let k = -1; k <= 1; k++) out.push(F(R(cx + k * 3.6 - 0.4, 146, 0.8, H - 164, stone.sh)));
      out.push(R(cx - 11, H - 18, 22, 6, stone.base), F(R(cx - 11, H - 18, 22, 1, stone.hi)));
    }
    // The great doors, open, the hall warm inside.
    out.push(R(W / 2 - 26, 160, 52, H - 178, '#6a4a5a'), E(W / 2, 160, 26, 18, '#6a4a5a'), R(W / 2 - 22, 162, 44, H - 180, '#ffd98a'), E(W / 2, 162, 22, 15, '#ffd98a'), F(R(W / 2 - 20, 166, 8, H - 186, '#fff3c4')));
    out.push(R(W / 2 - 30, 168, 6, H - 186, '#a8704a'), R(W / 2 + 24, 168, 6, H - 186, '#a8704a'));
    // Windows in the hall either side.
    for (const x of [66, 214]) out.push(...archWindow(x, 158, 18, 34));
    // The steps.
    for (let k = 0; k < 3; k++) out.push(R(30 - k * 8, H - 12 + k * 4, W - 60 + k * 16, 4, k % 2 ? stone.base : stone.hi), F(R(30 - k * 8, H - 9 + k * 4, W - 60 + k * 16, 1, stone.sh)));
    // The sign over the door.
    out.push(R(W / 2 - 40, 142, 80, 12, '#7a3a5a'), F(R(W / 2 - 40, 142, 80, 1.2, '#a85a7a')), R(W / 2 - 38, 144, 76, 8, '#8a4a6a'));
    return out;
  }, false);
}

// The Gilded Kettle, 220 wide and 204 tall: a stone ground floor with big round warm windows and
// a double door, a timber-framed upper floor with a balcony along it, a steep terracotta roof with
// two dormers and a chimney; the kettle sign hangs from its iron arm (drawn swinging, alive).
export const INN = { w: 220, h: 204, door: 110, sign: [190, 96] };
export function kettleInnArt() {
  return art('cb-inn', INN.w, INN.h, () => {
    const W = INN.w;
    const H = INN.h;
    const stone = ramp('#e4d6c0', 0.7);
    const wall = ramp('#fff0d8', 0.6);
    const timber = ramp('#8a5a44', 0.8);
    const out = [];
    out.push(R(160, 6, 18, 40, '#b8806a'), F(R(160, 6, 4, 40, '#d0987e')), R(156, 2, 26, 6, '#a8705a'));
    out.push(...tiledRoof(8, W - 8, 70, 12, '#d8705a'));
    for (const dx of [62, 146]) out.push(R(dx - 13, 42, 26, 28, wall.base), T([[dx - 16, 44], [dx, 30], [dx + 16, 44]], '#c8604a'), ...archWindow(dx - 6, 48, 12, 18));
    // The timbered upper floor.
    out.push(R(8, 70, W - 16, 56, wall.base), ...wallShade(8, 72, W - 16, 52, wall, 2.4));
    for (const x of [8, 60, 110, 160, W - 14]) out.push(R(x, 70, 6, 56, timber.base), F(R(x, 70, 1.4, 56, timber.hi)));
    out.push(R(8, 70, W - 16, 5, timber.base), R(8, 120, W - 16, 6, timber.base));
    for (const [a, b] of [[14, 60], [114, 160]]) out.push(F(T([[a, 76], [a + 4, 76], [b, 118], [b - 4, 118]], timber.sh)));
    for (const x of [74, 124, 172]) out.push(...windowPane(x, 82, 18, 22, WHITE, '#ffd98a', '#fff6c9'), ...flowerBox(x - 2, 105, 22, x));
    out.push(...windowPane(26, 82, 22, 22, WHITE, '#ffd98a', '#fff6c9'), ...flowerBox(24, 105, 26, 7));
    // The balcony rail along the upper floor (string lights are drawn alive).
    out.push(R(4, 126, W - 8, 4, timber.base), F(R(4, 126, W - 8, 1, timber.hi)));
    for (let x = 8; x < W - 6; x += 7) out.push(R(x, 130, 2, 8, timber.base));
    out.push(R(4, 136, W - 8, 3, timber.sh));
    // The stone ground floor: round windows either side of the double door.
    out.push(R(8, 139, W - 16, H - 139, stone.base), ...stones(8, 141, W - 16, H - 143, stone, 9));
    for (const cx of [44, 176]) out.push(E(cx, 168, 20, 20, '#6a4a5a'), E(cx, 168, 17, 17, '#ffc870'), F(E(cx - 4, 163, 8, 8, '#ffe3a0')), F(R(cx - 0.6, 151, 1.2, 34, '#8a5a44')), F(R(cx - 17, 167.4, 34, 1.2, '#8a5a44')));
    out.push(R(INN.door - 22, 150, 44, H - 150, '#5a3a3a'), E(INN.door, 150, 22, 14, '#5a3a3a'));
    for (const s of [-1, 1]) out.push(...planks(INN.door + (s < 0 ? -20 : 1), 152, 19, H - 152, ramp('#b8784a', 0.8), 3, s + 4));
    out.push(F(E(INN.door - 4, 178, 1.6, 1.6, GOLD)), F(E(INN.door + 4, 178, 1.6, 1.6, GOLD)));
    // The sign's iron arm.
    out.push(R(INN.sign[0] - 24, INN.sign[1] - 2, 30, 2.4, '#4a4a5a'), T([[INN.sign[0] + 4, INN.sign[1] - 2], [INN.sign[0] + 6, INN.sign[1] - 2], [INN.sign[0] - 6, INN.sign[1] + 10], [INN.sign[0] - 8, INN.sign[1] + 10]], '#4a4a5a'));
    return out;
  }, false);
}
// The kettle sign: a gold kettle on a board, hanging from two chains.
function kettleSignArt() {
  return art('cb-kettlesign', 30, 34, () => {
    const g = ramp(GOLD, 0.7);
    return [
      R(6, 0, 1, 8, '#5a5a6a'), R(23, 0, 1, 8, '#5a5a6a'), R(2, 8, 26, 24, '#7a4a3a'), R(4, 10, 22, 20, '#a8704a'),
      E(15, 22, 8, 6, g.base), F(E(13, 20, 3, 2, g.hi)), R(12, 14, 6, 3, g.base), E(15, 13, 2, 1.4, g.base),
      T([[22, 20], [27, 16], [26, 19], [23, 23]], g.base), T([[7, 18], [4, 21], [7, 25]], g.sh),
    ];
  }, false);
}

// The Adventurers' Guild, 250 wide and 268 tall: a stone keep with a crenellated top and corner
// turrets, a tall arched door under a crest (a compass and a sword), arrow-slit windows, and the
// rank banners (copper, silver, gold, mithril) hanging down its face.
export const GUILD = { w: 250, h: 268 };
export function guildArt() {
  return art('cb-guild', GUILD.w, GUILD.h, () => {
    const W = GUILD.w;
    const H = GUILD.h;
    const stone = ramp('#d8d0c8', 0.7);
    const dark = ramp('#b8a8a8', 0.7);
    const out = [];
    // Turrets with cone roofs.
    for (const tx of [22, W - 22]) {
      out.push(R(tx - 20, 40, 40, H - 40, dark.base), ...stones(tx - 20, 42, 40, H - 44, dark, tx));
      out.push(T([[tx - 24, 42], [tx, -2], [tx + 24, 42]], '#6a7ad0'), F(T([[tx, -2], [tx + 24, 42], [tx + 2, 42]], '#5060b0')), R(tx - 1, -10, 2, 10, '#5a5a6a'), T([[tx + 1, -10], [tx + 12, -7], [tx + 1, -4]], '#ff8a6a'));
      for (const y of [80, 140]) out.push(R(tx - 2, y, 4, 16, '#3a3a5a'));
    }
    // The keep and its battlements.
    out.push(R(40, 50, W - 80, H - 50, stone.base), ...stones(40, 52, W - 80, H - 54, stone, 2));
    for (let x = 40; x < W - 40; x += 18) out.push(R(x, 38, 12, 14, stone.base), F(R(x, 38, 12, 1.4, stone.hi)));
    // The crest: a shield with a compass rose and a sword.
    out.push(T([[W / 2 - 22, 70], [W / 2 + 22, 70], [W / 2 + 22, 96], [W / 2, 112], [W / 2 - 22, 96]], '#6a7ad0'), T([[W / 2 - 18, 74], [W / 2 + 18, 74], [W / 2 + 18, 94], [W / 2, 107], [W / 2 - 18, 94]], '#8fa8ff'));
    out.push(R(W / 2 - 1.5, 76, 3, 28, '#e8eef8'), R(W / 2 - 7, 84, 14, 2.4, GOLD), E(W / 2, 90, 7, 7, GOLD), E(W / 2, 90, 5, 5, '#8fa8ff'), T([[W / 2, 83], [W / 2 + 2, 90], [W / 2, 97], [W / 2 - 2, 90]], '#ff8a6a'));
    // Arrow slits and the great door.
    for (const x of [72, W - 76]) for (const y of [120, 170]) out.push(R(x, y, 4, 18, '#3a3a5a'), F(R(x, y, 1, 18, '#5a5a7a')));
    out.push(R(W / 2 - 28, 150, 56, H - 150, '#4a3a4a'), E(W / 2, 150, 28, 22, '#4a3a4a'), R(W / 2 - 24, 152, 48, H - 152, '#8a5a3a'), E(W / 2, 152, 24, 19, '#8a5a3a'));
    out.push(...planks(W / 2 - 24, 152, 48, H - 152, ramp('#8a5a3a', 0.8), 4, 7));
    for (const y of [178, 220]) out.push(R(W / 2 - 24, y, 48, 4, '#5a5a6a'), E(W / 2 - 18, y + 2, 1.6, 1.6, '#9a9aaa'), E(W / 2 + 18, y + 2, 1.6, 1.6, '#9a9aaa'));
    out.push(E(W / 2 + 12, 210, 4, 4, '#5a5a6a'), E(W / 2 + 12, 210, 2.4, 2.4, GOLD));
    // Rank banners down the face.
    [['#d8905a', 58], ['#c8d0e0', 90], ['#ffd36b', W - 98], ['#a8f0ff', W - 66]].forEach(([c, x]) => {
      const r = ramp(c, 0.7);
      out.push(R(x - 2, 56, 20, 2, '#5a5a6a'), T([[x, 58], [x + 16, 58], [x + 16, 104], [x + 8, 96], [x, 104]], r.base), F(T([[x + 10, 58], [x + 16, 58], [x + 16, 104], [x + 10, 99]], r.sh)), F(E(x + 8, 72, 3, 3, r.hi)));
    });
    out.push(R(W / 2 - 34, H - 6, 68, 6, stone.sh));
    return out;
  }, false);
}

// The Trade Hall office, 104 wide and 196 tall: a narrow tall townhouse of rose stucco with a
// clock in its gable and a hanging sign of golden scales.
export function officeArt() {
  return art('cb-office', 104, 196, () => {
    const W = 104;
    const H = 196;
    const wall = ramp('#f8c8c0', 0.6);
    const stone = ramp(STONE, 0.7);
    const out = [];
    out.push(T([[6, 52], [W / 2, 6], [W - 6, 52]], stone.base), F(T([[W / 2, 6], [W - 6, 52], [W / 2 + 2, 52]], stone.sh)));
    out.push(E(W / 2, 34, 12, 12, GOLD), E(W / 2, 34, 10, 10, WHITE), F(R(W / 2 - 0.5, 27, 1, 7, '#4a4a5a')), F(R(W / 2, 33.5, 6, 1, '#4a4a5a')));
    out.push(R(10, 52, W - 20, H - 52, wall.base), ...wallShade(10, 54, W - 20, H - 54, wall, 2.4));
    for (const y of [64, 110]) for (const x of [24, 64]) out.push(...archWindow(x, y, 14, 28), ...flowerBox(x - 2, y + 31, 18, x + y));
    out.push(...beam(8, 100, W - 16, 3, STONE), ...beam(8, 146, W - 16, 3, STONE));
    out.push(R(36, H - 44, 32, 44, '#5a4a5a'), E(52, H - 44, 16, 12, '#5a4a5a'), R(39, H - 42, 26, 42, '#6a8ad0'), E(52, H - 42, 13, 10, '#6a8ad0'), F(R(51.4, H - 50, 1.2, 50, '#4a6ab0')), F(E(48, H - 22, 1.2, 1.2, GOLD)), F(E(56, H - 22, 1.2, 1.2, GOLD)));
    // The scales sign.
    out.push(R(W - 20, 150, 22, 2, '#4a4a5a'), R(W - 4, 152, 1, 6, '#6a6a7a'), R(W - 14, 158, 20, 14, '#7a4a5a'), R(W - 12, 160, 16, 10, '#a8704a'));
    out.push(F(R(W - 4.5, 161, 1, 7, GOLD)), F(R(W - 10, 162, 11, 0.8, GOLD)), F(E(W - 9, 166, 2.4, 1, GOLD)), F(E(W + 0.4, 166, 2.4, 1, GOLD)));
    return out;
  }, false);
}

// The bell tower, 56 wide and 300 tall: a slim brick campanile with a loggia of arches at the top
// where the bell hangs (drawn swinging), and a pointed copper roof.
export const TOWER = { w: 56, h: 300, bell: [28, 56] };
export function campanileArt() {
  return art('cb-tower', TOWER.w, TOWER.h, () => {
    const W = TOWER.w;
    const H = TOWER.h;
    const brick = ramp('#e8a088', 0.7);
    const stone = ramp(STONE, 0.7);
    const out = [];
    out.push(T([[4, 34], [W / 2, -2], [W - 4, 34]], '#5fb8a0'), F(T([[W / 2, -2], [W - 4, 34], [W / 2 + 2, 34]], '#4a9a88')), R(W / 2 - 1, -10, 2, 10, GOLD), E(W / 2, -11, 2.4, 2.4, GOLD));
    out.push(R(2, 34, W - 4, 6, stone.base), F(R(2, 34, W - 4, 1, stone.hi)));
    out.push(R(4, 40, W - 8, 36, stone.base));
    for (const x of [8, 30]) out.push(R(x, 46, 18, 30, '#4a5a8a'), E(x + 9, 46, 9, 7, '#4a5a8a'));
    out.push(R(2, 76, W - 4, 5, stone.base), F(R(2, 76, W - 4, 1, stone.hi)));
    out.push(R(6, 81, W - 12, H - 81, brick.base), ...wallShade(6, 83, W - 12, H - 83, brick, 2));
    for (let y = 88; y < H - 4; y += 7) out.push(F(R(6, y, W - 12, 0.8, brick.sh)));
    for (const y of [110, 170, 230]) out.push(R(W / 2 - 3, y, 6, 14, '#4a5a8a'), E(W / 2, y, 3, 3, '#4a5a8a'));
    out.push(R(2, H - 10, W - 4, 10, stone.base));
    return out;
  }, false);
}

// A market stall, 64 wide: a striped awning on two poles over a counter of its goods (fruit,
// cloth bolts, pots, or lanterns), a little price board.
// The stall that can be yours: the same awning and counter in gold and cream, bare, for your goods.
function bareStallArt() {
  return art('cb-stall-yours', 64, 62, () => {
    const wood = ramp('#b8845a', 0.8);
    const out = [R(4, 14, 3, 48, wood.base), R(57, 14, 3, 48, wood.base)];
    for (let k = 0; k < 8; k++) out.push(T([[k * 8, 8], [k * 8 + 8, 8], [k * 8 + 8, 18], [k * 8 + 4, 21], [k * 8, 18]], k % 2 ? '#fff6dc' : GOLD));
    out.push(R(0, 6, 64, 3, '#c8902a'));
    out.push(R(4, 40, 56, 22, wood.base), ...planks(4, 42, 56, 20, wood, 4, 7), R(2, 38, 60, 4, wood.hi));
    return out;
  }, false);
}

export function stallArt(seed) {
  const aw = pick(['#ff8fb0', '#8fb8ff', '#7fd1a8', '#ffb36b', '#c9a6ff'], seed);
  const goods = Math.floor(hash(seed * 4.3) * 4);
  return art(`cb-stall|${aw}|${goods}`, 64, 62, () => {
    const wood = ramp('#b8845a', 0.8);
    const out = [R(4, 14, 3, 48, wood.base), R(57, 14, 3, 48, wood.base)];
    for (let k = 0; k < 8; k++) out.push(T([[k * 8, 8], [k * 8 + 8, 8], [k * 8 + 8, 18], [k * 8 + 4, 21], [k * 8, 18]], k % 2 ? WHITE : aw));
    out.push(R(0, 6, 64, 3, mix(aw, '#3a2a4a', 0.2)));
    out.push(R(4, 40, 56, 22, wood.base), ...planks(4, 42, 56, 20, wood, 4, seed), R(2, 38, 60, 4, wood.hi));
    if (goods === 0) for (let k = 0; k < 9; k++) out.push(E(10 + k * 5.4, 35 - (k % 2) * 2, 3, 3, pick(['#ff6b6b', '#ffb03a', '#ffe36b', '#8fdc6a'], seed + k)));
    if (goods === 1) for (let k = 0; k < 5; k++) out.push(R(8 + k * 10, 26, 9, 12, pick(['#ff9ec0', '#8fb8ff', '#ffe08a', '#a8e8c8', '#c9a6ff'], seed + k)), F(R(8 + k * 10, 26, 2, 12, WHITE)));
    if (goods === 2) for (let k = 0; k < 4; k++) out.push(E(14 + k * 12, 32, 5, 6, pick(['#d8805a', '#5fb8a0', '#e8c070', '#8fa8e8'], seed + k)), R(12 + k * 12, 24, 4, 3, '#a8704a'));
    if (goods === 3) for (let k = 0; k < 4; k++) out.push(R(16 + k * 10, 20, 1, 8, '#5a5a6a'), E(16.5 + k * 10, 31, 3.6, 4.4, pick(['#ff9a6a', '#ffe36b', '#ff8fb0'], seed + k)), F(E(15.5 + k * 10, 30, 1.2, 1.6, '#fff6c4')));
    out.push(R(44, 44, 12, 9, '#4a5a4a'), F(R(46, 46, 8, 1, WHITE)), F(R(46, 49, 6, 1, WHITE)));
    return out;
  }, false);
}

// The dockside crane: a timber tower with a jib out over the water (the rope and its crate are
// drawn swinging).
export const CRANE = { w: 90, h: 170, tip: [84, 10] };
function craneArt() {
  return art('cb-crane', CRANE.w, CRANE.h, () => {
    const wood = ramp('#a87a52', 0.8);
    const out = [R(6, 30, 10, 140, wood.base), R(30, 30, 10, 140, wood.base), F(R(6, 30, 2, 140, wood.hi)), F(R(30, 30, 2, 140, wood.hi))];
    for (let y = 46; y < 166; y += 26) out.push(F(T([[8, y], [12, y], [38, y + 22], [34, y + 22]], wood.sh)), R(6, y, 34, 4, wood.base));
    out.push(T([[2, 32], [88, 6], [88, 12], [8, 40]], wood.base), F(T([[2, 32], [88, 6], [88, 8], [4, 34]], wood.hi)), R(14, 18, 18, 14, '#c86a5a'), T([[12, 18], [23, 10], [34, 18]], '#a8504a'));
    out.push(E(23, 60, 9, 9, '#6a6a7a'), E(23, 60, 6, 6, '#9a9aaa'), F(R(22.4, 52, 1.2, 16, '#5a5a6a')));
    return out;
  }, false);
}
// Crates, barrels and sacks stacked on the quay.
function cratesArt(seed) {
  return art(`cb-crates|${Math.floor(seed) % 3}`, 72, 52, () => {
    const wood = ramp('#c8925a', 0.8);
    const out = [];
    const crate = (x, y, w, h) => {
      out.push(R(x, y, w, h, wood.base), ...planks(x + 1, y + 1, w - 2, h - 2, wood, 3, x + y), F(T([[x + 2, y + 2], [x + 5, y + 2], [x + w - 2, y + h - 5], [x + w - 2, y + h - 2], [x + w - 5, y + h - 2], [x + 2, y + 5]], wood.sh)), R(x, y, w, 2, wood.hi));
    };
    crate(2, 22, 30, 30);
    crate(10, 0, 22, 22);
    out.push(E(46, 38, 11, 14, '#a8704a'), F(R(36, 30, 20, 2, '#6a5a5a')), F(R(36, 44, 20, 2, '#6a5a5a')), F(E(43, 32, 3, 5, '#c89060')));
    out.push(E(64, 46, 8, 6, '#e8d8b0'), E(64, 41, 5, 3, '#d8c8a0'), F(R(63, 38, 2, 3, '#a89870')));
    return out;
  }, false);
}
// The town gate at the docks: a limestone arch with the town's name in gold, lanterns either side.
function townGateArt() {
  return art('cb-gate', 120, 140, () => {
    const stone = ramp(STONE, 0.7);
    const out = [R(4, 30, 22, 110, stone.base), R(94, 30, 22, 110, stone.base), ...stones(4, 32, 22, 108, stone, 1), ...stones(94, 32, 22, 108, stone, 2)];
    out.push(R(0, 14, 120, 20, stone.base), F(R(0, 14, 120, 2, stone.hi)), F(R(0, 31, 120, 3, stone.sh)), T([[26, 34], [60, 50], [94, 34]], stone.base));
    out.push(R(22, 18, 76, 12, '#7a3a5a'), R(24, 20, 72, 8, '#8a4a6a'), E(60, 8, 10, 8, GOLD), F(E(60, 8, 7, 5, '#fff0a8')), R(56, 0, 8, 4, stone.base));
    return out;
  }, false);
}

// A terrace's retaining wall, `w` wide and 250 tall from the street down: honey limestone laid in
// courses under a coping stone the street's edge rests on, buttresses standing out from it, and
// between them the town's storage vaults dug into the hill (arched openings with barrels and crates
// inside, or a cellar's double doors, one lit by a lantern). Rain spouts with moss streaks under
// them, iron rings, ivy and flowers trailing over the coping, more ivy climbing from the foot.
const WALL_H = 250;
function terraceWallArt(w) {
  return art(`cb-wall|${w}`, w, WALL_H, () => {
    const ash = ramp('#e8d4b4', 0.7);
    const cap = ramp(STONE, 0.7);
    const out = [R(0, 0, w, WALL_H, ash.base), ...stones(0, 10, w, WALL_H - 10, ash, w * 0.13)];
    // Bays between buttresses.
    const bays = Math.max(1, Math.round(w / 112));
    const bw = w / bays;
    for (let i = 0; i < bays; i++) {
      const bx = i * bw;
      const cx = bx + bw / 2;
      const seed = w * 0.37 + i * 3.7;
      const kind = hash(seed * 2.3);
      // A vault dug into the hill at the foot.
      const vw = 44;
      const vt = WALL_H - 74;
      out.push(R(cx - vw / 2 - 4, vt + vw / 2 - 2, vw + 8, WALL_H - vt - vw / 2 + 2, cap.base), E(cx, vt + vw / 2, vw / 2 + 4, vw / 2 + 4, cap.base));
      for (let k = 0; k < 7; k++) {
        const a = Math.PI + (k / 6) * Math.PI;
        out.push(F(R(cx + Math.cos(a) * (vw / 2 + 2) - 0.5, vt + vw / 2 + Math.sin(a) * (vw / 2 + 2), 1, 3, cap.sh)));
      }
      out.push(R(cx - vw / 2, vt + vw / 2, vw, WALL_H - vt - vw / 2, '#4a3a48'), E(cx, vt + vw / 2, vw / 2, vw / 2, '#4a3a48'));
      if (kind < 0.4) {
        // A cellar's double doors, planked, with iron bands.
        const wood = ramp('#9a6a44', 0.8);
        out.push(R(cx - vw / 2 + 3, vt + vw / 2, vw - 6, WALL_H - vt - vw / 2, wood.base), E(cx, vt + vw / 2, vw / 2 - 3, vw / 2 - 3, wood.base), ...planks(cx - vw / 2 + 3, vt + vw / 2, vw - 6, WALL_H - vt - vw / 2, wood, 6, seed));
        out.push(F(R(cx - 0.6, vt + 4, 1.2, WALL_H - vt - 4, wood.sh)));
        for (const y of [vt + 34, vt + 58]) out.push(R(cx - vw / 2 + 3, y, vw - 6, 2.4, '#5a5a6a'));
        out.push(F(E(cx - 4, vt + 48, 1.4, 1.4, GOLD)), F(E(cx + 4, vt + 48, 1.4, 1.4, GOLD)));
      } else {
        // An open store: barrels and crates in the dark.
        out.push(E(cx - 10, WALL_H - 12, 9, 12, '#a8704a'), F(R(cx - 19, WALL_H - 18, 18, 1.6, '#5a4a4a')), F(R(cx - 19, WALL_H - 8, 18, 1.6, '#5a4a4a')));
        out.push(R(cx + 2, WALL_H - 24, 18, 24, '#c8925a'), F(R(cx + 2, WALL_H - 24, 18, 2, '#e0aa70')), F(T([[cx + 4, WALL_H - 22], [cx + 7, WALL_H - 22], [cx + 18, WALL_H - 4], [cx + 15, WALL_H - 4]], '#a8703a')));
        if (kind > 0.75) out.push(R(cx + 4, WALL_H - 38, 14, 14, '#c8925a'), F(R(cx + 4, WALL_H - 38, 14, 1.6, '#e0aa70')));
      }
      // A rain spout high on the wall, a moss streak under it.
      if (hash(seed * 4.1) > 0.35) {
        const sx = cx + (hash(seed) - 0.5) * 30;
        out.push(R(sx - 3, 22, 6, 5, cap.base), F(R(sx - 3, 22, 6, 1, cap.hi)), R(sx - 1.6, 27, 3.2, 2, '#5a4a48'));
        out.push(F(T([[sx - 2, 29], [sx + 2, 29], [sx + 3.6, 90], [sx - 3.6, 90]], mix(ash.base, '#7fa88a', 0.35))));
      }
      // An iron ring set in the stone.
      if (hash(seed * 6.7) > 0.5) out.push(E(cx + 24, 118, 3.4, 3.4, '#5a5a6a'), E(cx + 24, 118, 2, 2, ash.base));
      // Ivy climbing from the foot, or a hanging basket of flowers on a bracket.
      if (hash(seed * 5.1) > 0.5) for (let k = 0; k < 10; k++) out.push(F(E(bx + 10 + hash(seed + k) * 12, WALL_H - 6 - k * 10, 3.6, 3.2, k % 2 ? '#7fcf8a' : '#5fb070')));
      else {
        const hx = cx - 30;
        out.push(R(hx, 60, 10, 1.6, '#4a4a5a'), R(hx + 8, 61, 1, 6, '#6a6a7a'), E(hx + 8.5, 70, 6, 4, '#a8704a'));
        for (let k = 0; k < 6; k++) out.push(F(E(hx + 4 + k * 1.8, 66 + (k % 2) * 2, 1.8, 1.7, pick(BLOOMS, seed + k))), F(E(hx + 3 + k * 2, 74 + k * 1.4, 1.2, 2, '#7fcf8a')));
      }
      // The buttress at the bay's left edge: standing out, its sloped top, its shaded side.
      if (i > 0 || bays === 1) {
        const px = i === 0 ? 2 : bx - 9;
        out.push(R(px, 34, 18, WALL_H - 34, cap.base), ...stones(px, 40, 18, WALL_H - 40, cap, seed * 9), T([[px, 34], [px + 18, 34], [px + 18, 26], [px, 30]], cap.hi), F(R(px + 14, 34, 4, WALL_H - 34, cap.sh)));
      }
    }
    // The coping the street rests on: an overhanging cap with a shadow line under it, and ivy and
    // flowers spilling over it here and there.
    out.push(R(0, 0, w, 9, cap.base), F(R(0, 0, w, 2, cap.hi)), F(R(0, 8, w, 3, mix(ash.base, '#3a2a4a', 0.25))));
    for (let x = 6; x < w - 6; x += 22) {
      const v = hash(x * 0.7 + w);
      if (v < 0.45) continue;
      const len = 3 + Math.floor(v * 5);
      for (let k = 0; k < len; k++) out.push(F(E(x + Math.sin(k * 1.3) * 2, 10 + k * 6, 3.2, 2.8, k % 2 ? '#7fcf8a' : '#5fb070')));
      if (v > 0.75) out.push(F(E(x + 2, 12, 1.8, 1.6, pick(BLOOMS, x))), F(E(x - 2, 20, 1.6, 1.5, pick(BLOOMS, x + 1))));
    }
    return out;
  }, false);
}

// ---------- The Night Market ----------
// How far into the night it is, eased (0 by day, 1 in full dark): the market fades in at dusk and
// out at dawn, never popping.
const dark = (map) => {
  const n = Math.max(0, Math.min(1, ((map.night ?? 0) - 0.25) / 0.6));
  return n * n * (3 - 2 * n);
};
// A night trader's stall, 70 wide: a canopy of deep cloth on carved poles, paper lanterns hanging
// from its edge (drawn glowing, alive), and its counter heaped with night things: crystals,
// little bottles, masks, moon charms.
function nightStallArt(seed) {
  const cloth = pick(['#5a3a8a', '#2f5a7a', '#7a3a5a'], seed);
  return art(`cb-nightstall|${cloth}`, 70, 70, () => {
    const wood = ramp('#7a5a4a', 0.8);
    const c = ramp(cloth, 0.8);
    const out = [R(4, 12, 3, 58, wood.base), R(63, 12, 3, 58, wood.base), E(5.5, 12, 3, 3, GOLD), E(64.5, 12, 3, 3, GOLD)];
    out.push(T([[0, 16], [35, 4], [70, 16], [70, 22], [0, 22]], c.base), F(T([[35, 4], [70, 16], [70, 22], [36, 22]], c.sh)));
    for (let k = 0; k < 7; k++) out.push(T([[k * 10, 22], [k * 10 + 10, 22], [k * 10 + 5, 28]], k % 2 ? c.sh : c.base), F(E(k * 10 + 5, 23, 1, 1, GOLD)));
    out.push(R(4, 46, 62, 24, wood.base), ...planks(4, 48, 62, 22, wood, 4, seed), R(2, 44, 66, 4, wood.hi));
    // The goods.
    for (let k = 0; k < 4; k++) out.push(T([[10 + k * 4, 44], [12 + k * 4, 34 - (k % 2) * 4], [14 + k * 4, 44]], pick(['#c8b0ff', '#8fe8ff', '#ffb0e0'], seed + k)));
    for (let k = 0; k < 3; k++) out.push(R(30 + k * 6, 37, 4, 7, pick(['#ff8fb0', '#8fffd0', '#ffe36b'], seed + k * 2)), R(31 + k * 6, 35, 2, 2, '#e8e0f0'));
    out.push(E(56, 39, 6, 4, '#f0f0ff'), F(E(53.5, 38.5, 1.2, 1, '#2a2340')), F(E(58.5, 38.5, 1.2, 1, '#2a2340')), F(T([[52, 36], [56, 33], [60, 36]], '#c9a6ff')));
    return out;
  }, false);
}
function paperLantern(ctx, x, y, c, time, k, a) {
  ctx.globalAlpha = a;
  const sway = Math.sin(time * 1.3 + k) * 1.2;
  ctx.fillStyle = '#5a4a5a';
  ctx.fillRect(Math.round(x + sway * 0.3), Math.round(y - 3), 1, 3);
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(x + sway, y + 3, 3, 4, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff6d0';
  ctx.fillRect(Math.round(x + sway - 1), Math.round(y + 1), 2, 4);
  ctx.globalAlpha = 1;
  glow(ctx, x + sway, y + 3, 14, c, a * (0.45 + 0.15 * Math.sin(time * 3 + k)));
}
const LANTERN_C = ['#ffb04a', '#ff6b8a', '#ffe36b', '#c9a6ff', '#8fe8d8'];

// ---------- The canals ----------

// A canal between two stone embankments (`w` wide, its floor `depth` below the street): its walls,
// the water with a rippling rim and glints, a mooring post, and a gondola riding it.
function canalWater(ctx, x0, w, gy, depth, time, wx) {
  const top = gy + 6;
  const bottom = gy + depth + 40;
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, WATER.top);
  g.addColorStop(0.4, WATER.mid);
  g.addColorStop(1, WATER.deep);
  ctx.fillStyle = g;
  ctx.fillRect(snap(x0), snap(top), Math.ceil(w), Math.ceil(bottom - top));
  ctx.fillStyle = WATER.foam;
  for (let x = 0; x < w; x += 4) ctx.fillRect(snap(x0 + x), snap(top + Math.sin((x + wx) * 0.07 + time * 2) * 1.1), 4, 1.4);
  ctx.globalAlpha = 0.45;
  for (let k = 0; k < w / 22; k++) {
    const gx = x0 + ((k * 22 + time * 9 + hash(k + wx) * 22) % w);
    ctx.fillRect(snap(gx), snap(top + 8 + hash(k * 3.1 + wx) * (depth + 10)), 6, 1);
  }
  ctx.globalAlpha = 1;
  // The embankment walls either side.
  for (const [ex, ew] of [[x0 - 8, 8], [x0 + w, 8]]) {
    ctx.fillStyle = '#d8ccb8';
    ctx.fillRect(snap(ex), snap(gy), ew, depth + 46);
    ctx.fillStyle = '#efe4d2';
    ctx.fillRect(snap(ex), snap(gy), ew, 3);
    ctx.fillStyle = '#b8a890';
    for (let y = gy + 10; y < gy + depth + 40; y += 9) ctx.fillRect(snap(ex), snap(y), ew, 1);
  }
}
// A gondola, bobbing: a black lacquer hull with its curled prow, a red cushion seat, a lantern.
function gondola(ctx, x, y, time, wx, dir = 1) {
  const bob = Math.sin(time * 1.6 + wx * 0.01) * 1.2;
  const tilt = Math.sin(time * 1.3 + wx * 0.02) * 0.03;
  ctx.save();
  ctx.translate(snap(x), snap(y + bob));
  ctx.rotate(tilt);
  ctx.scale(dir, 1);
  ctx.fillStyle = '#3a3050';
  ctx.beginPath();
  ctx.moveTo(-30, -4);
  ctx.quadraticCurveTo(0, 7, 30, -4);
  ctx.lineTo(34, -12);
  ctx.quadraticCurveTo(38, -16, 35, -18);
  ctx.lineTo(28, -6);
  ctx.quadraticCurveTo(0, 1, -26, -6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5a4a7a';
  ctx.fillRect(-26, -6, 52, 1.5);
  ctx.fillStyle = '#ffd36b';
  ctx.fillRect(30, -17, 5, 2);
  ctx.fillStyle = '#e85a6a';
  ctx.fillRect(-8, -9, 14, 4);
  ctx.fillStyle = '#ff8a9a';
  ctx.fillRect(-8, -9, 14, 1.2);
  ctx.fillStyle = '#5a5a6a';
  ctx.fillRect(-22, -20, 1, 14);
  ctx.fillStyle = '#ffc870';
  ctx.fillRect(-24, -24, 5, 5);
  ctx.restore();
}

// ---------- Drawing ----------

// Draws a Coinbridge piece; returns false for anything that isn't one.
export function drawCoinPiece(ctx, map, kind, wx, extra, cam, width, time) {
  if (!kind.startsWith('cb_')) return false;
  const x = wx - cam.x;
  const night = map.night ?? 0;
  if (kind === 'cb_innroom') {
    place(ctx, innRoomArt(), Math.round(x), Math.round(480 - cam.y));
    innRoomLife(ctx, x - 320, -cam.y, time, night);
    return true;
  }
  const reach = kind === 'cb_stairs' ? 460 : kind === 'cb_canal' || kind === 'cb_wall' ? (extra?.w ?? 120) + 60 : 340;
  if (x < -reach || x > width + reach + (kind === 'cb_wall' ? 0 : 0)) return true;
  const gy = snap(groundAt(map, wx) - cam.y);
  if (kind === 'cb_palazzo') {
    const s = palazzoArt(extra ?? wx);
    place(ctx, s, snap(x), gy + 2);
    glow(ctx, x, gy - s.h * 0.55, 34, '#ffd98a', night * 0.35);
  } else if (kind === 'cb_auction') {
    place(ctx, auctionArt(), snap(x), gy + 4);
    const top = gy + 4 - AUCTION.h;
    // The clock's hands keep the town's hour; the doors glow; banners stir.
    const hr = ((time / 60) % 12) * (TAU / 12);
    ctx.strokeStyle = '#4a3a5a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, top + 89);
    ctx.lineTo(x + Math.sin(hr) * 6, top + 89 - Math.cos(hr) * 6);
    ctx.moveTo(x, top + 89);
    ctx.lineTo(x + Math.sin(time * 0.1) * 8, top + 89 - Math.cos(time * 0.1) * 8);
    ctx.stroke();
    for (const [bx, c] of [[-74, '#e85a7a'], [-42, '#ffd36b'], [42, '#ffd36b'], [74, '#e85a7a']]) {
      const sway = Math.sin(time * 1.4 + bx * 0.1) * 1.6;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(x + bx - 6, top + 140);
      ctx.lineTo(x + bx + 6, top + 140);
      ctx.lineTo(x + bx + 6 + sway, top + 186);
      ctx.lineTo(x + bx + sway, top + 180);
      ctx.lineTo(x + bx - 6 + sway, top + 186);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(x + bx - 1 + sway * 0.4, top + 150, 2, 2);
    }
    glow(ctx, x, top + 190, 46, '#ffd98a', 0.18 + night * 0.4);
    // The name over the door.
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '800 6px Nunito, "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AUCTION HOUSE', x, top + 150.6);
    ctx.textAlign = 'left';
  } else if (kind === 'cb_inn') {
    place(ctx, kettleInnArt(), snap(x), gy + 2);
    const left = x - INN.w / 2;
    const top = gy + 2 - INN.h;
    puffs(ctx, left + 169, top + 4, time, wx * 0.01, 3, 30);
    // String lights along the balcony, twinkling.
    for (let k = 0; k < 14; k++) {
      const lx = left + 10 + k * 15;
      const ly = top + 126 + Math.sin((k / 13) * Math.PI) * 5;
      ctx.globalAlpha = 0.55 + 0.45 * Math.sin(time * 2.4 + k * 1.3);
      ctx.fillStyle = k % 3 === 0 ? '#ffe36b' : k % 3 === 1 ? '#ff9ec0' : '#9fe8ff';
      ctx.fillRect(snap(lx), snap(ly), 2, 2);
    }
    ctx.globalAlpha = 1;
    // The kettle sign swinging on its arm.
    const [sx, sy] = INN.sign;
    const a = Math.sin(time * 1.2 + wx * 0.01) * 0.12;
    ctx.save();
    ctx.translate(left + sx - 12, top + sy);
    ctx.rotate(a);
    place(ctx, kettleSignArt(), 0, 34);
    ctx.restore();
    puffs(ctx, left + sx - 6, top + sy + 12, time * 0.8, 0.4, 2, 12);
    for (const cx of [44, 176]) glow(ctx, left + cx, top + 168, 26, '#ffc870', 0.25 + night * 0.45);
  } else if (kind === 'cb_guild') {
    place(ctx, guildArt(), snap(x), gy + 2);
    const top = gy + 2 - GUILD.h;
    // The turret pennants flutter.
    for (const tx of [22, GUILD.w - 22]) {
      const fx = x - GUILD.w / 2 + tx + 1;
      const f = Math.sin(time * 4 + tx) * 1.4;
      ctx.fillStyle = '#ff8a6a';
      ctx.beginPath();
      ctx.moveTo(fx, top - 10);
      ctx.lineTo(fx + 12, top - 7 + f);
      ctx.lineTo(fx, top - 4);
      ctx.fill();
    }
    glow(ctx, x, top + 90, 30, '#a8c0ff', 0.1 + night * 0.25);
  } else if (kind === 'cb_office') {
    place(ctx, officeArt(), snap(x), gy + 2);
  } else if (kind === 'cb_tower') {
    place(ctx, campanileArt(), snap(x), gy + 2);
    const top = gy + 2 - TOWER.h;
    // The bell rocks in its loggia.
    const a = Math.sin(time * 0.9) * 0.22;
    ctx.save();
    ctx.translate(x, top + 48);
    ctx.rotate(a);
    ctx.fillStyle = '#d8a84a';
    ctx.beginPath();
    ctx.moveTo(-6, 4);
    ctx.quadraticCurveTo(-6, 18, -10, 22);
    ctx.lineTo(10, 22);
    ctx.quadraticCurveTo(6, 18, 6, 4);
    ctx.quadraticCurveTo(0, -2, -6, 4);
    ctx.fill();
    ctx.fillStyle = '#ffe08a';
    ctx.fillRect(-4, 6, 2, 12);
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(-1, 22, 2, 3);
    ctx.restore();
  } else if (kind === 'cb_wall') {
    // `extra.w`: the wall runs from wx to the right, under the street at wx.
    const w = extra?.w ?? 200;
    const s = terraceWallArt(w);
    // (`extra.drop`: starts that far down, under a canal's basin.)
    place(ctx, s, snap(x + w / 2), gy + (extra?.drop ?? 0) + WALL_H + 2);
    // A lantern over one cellar door glows at night.
    const bays = Math.max(1, Math.round(w / 112));
    for (let i = 0; i < bays; i++) if (hash(w * 0.37 + i * 3.7 + 11) > 0.6) glow(ctx, x + (i + 0.5) * (w / bays), gy + 2 + WALL_H - 70, 24, '#ffc870', 0.1 + night * 0.4);
  } else if (kind === 'cb_stairs') {
    // A grand stair up the hillside from wx to `extra.to`: the honey stone it's built of down to
    // the foot of the map, each step's tread and riser along the slope, a stone rail on its outer
    // edge.
    const x1 = extra?.to ?? wx + 390;
    const y0 = groundAt(map, wx) - cam.y;
    const y1 = groundAt(map, x1) - cam.y;
    const sx1 = x1 - cam.x;
    const bottom = Math.max(y0, y1) + 400;
    ctx.fillStyle = '#e8d4b4';
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(sx1, y1);
    ctx.lineTo(sx1, bottom);
    ctx.lineTo(x, bottom);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.clip();
    // The stone courses, laid in the world (not the screen), so they stay put as you walk.
    ctx.fillStyle = '#d4bc98';
    const wTop = Math.min(y0, y1) + cam.y;
    for (let wy = Math.floor(wTop / 12) * 12; wy - cam.y < bottom; wy += 12) {
      const y = wy - cam.y;
      ctx.fillRect(x, snap(y), sx1 - x, 1);
      const row = Math.round(wy / 12);
      for (let bwx = wx + (row % 2 ? 0 : 14); bwx < wx + (sx1 - x); bwx += 28) ctx.fillRect(snap(bwx - cam.x), snap(y), 1, 12);
    }
    ctx.restore();
    // The steps: a lit tread and a shaded riser every few pixels up.
    const run = sx1 - x;
    const rise = y0 - y1;
    const n = Math.max(1, Math.round(Math.abs(rise) / 10));
    for (let i = 0; i < n; i++) {
      const ax = x + (run * i) / n;
      const ay = y0 - (rise * i) / n;
      ctx.fillStyle = '#c8b090';
      ctx.fillRect(snap(ax), snap(ay - rise / n), Math.ceil(run / n) + 1, Math.ceil(rise / n) + 1);
      ctx.fillStyle = '#f4e8d4';
      ctx.fillRect(snap(ax), snap(ay - rise / n), Math.ceil(run / n) + 1, 2);
    }
    // The rail along the outer edge: a coping and fat little balusters.
    ctx.fillStyle = '#efe4d2';
    for (let i = 0; i <= n; i += 1) {
      const bx = x + (run * i) / n;
      const by = y0 - (rise * i) / n;
      ctx.beginPath();
      ctx.ellipse(bx + 2, by - 6, 1.6, 5, 0, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = '#efe4d2';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x, y0 - 13);
    ctx.lineTo(sx1, y1 - 13);
    ctx.stroke();
    ctx.strokeStyle = '#c8b8a0';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y0 - 11.6);
    ctx.lineTo(sx1, y1 - 11.6);
    ctx.stroke();
  } else if (kind === 'cb_lamp') {
    // A wrought-iron street lamp: a fluted post on a stone foot, a scroll arm and a lantern that
    // glows warm (brighter at night), a moth circling it after dark.
    const r = ramp('#4a4a5a', 0.8);
    ctx.fillStyle = '#d8ccb8';
    ctx.fillRect(snap(x - 4), gy - 5, 8, 5);
    ctx.fillStyle = r.base;
    ctx.fillRect(snap(x - 1.2), gy - 40, 2.4, 35);
    ctx.fillStyle = r.hi;
    ctx.fillRect(snap(x - 1.2), gy - 40, 0.8, 35);
    ctx.fillStyle = r.base;
    ctx.fillRect(snap(x - 3), gy - 42, 6, 2);
    ctx.fillStyle = '#ffc870';
    ctx.fillRect(snap(x - 3), gy - 50, 6, 8);
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(snap(x - 2), gy - 49, 1.6, 6);
    ctx.fillStyle = r.base;
    ctx.beginPath();
    ctx.moveTo(x - 4.4, gy - 50);
    ctx.lineTo(x, gy - 55);
    ctx.lineTo(x + 4.4, gy - 50);
    ctx.fill();
    glow(ctx, x, gy - 46, 18, '#ffd98a', 0.25 + night * 0.55);
    if (night > 0.5) {
      const a = time * 3 + wx;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(snap(x + Math.cos(a) * 8), snap(gy - 46 + Math.sin(a * 1.3) * 5), 1.4, 1.4);
    }
  } else if (kind === 'cb_gondola') {
    // A gondola moored in a canal, bobbing a little at its post, in front of the bridge.
    const street = snap(groundAt(map, wx - (extra?.w ?? 118) / 2 - 20) - cam.y);
    const gx = x + Math.sin(time * 0.4 + wx) * 4;
    gondola(ctx, gx, street + 18, time, wx, extra?.dir ?? 1);
    // At night on the docks it's the lantern boat: lanterns on poles fore and aft.
    if (extra?.lanterns) {
      const a = dark(map);
      const bob = Math.sin(time * 1.6 + wx * 0.01) * 1.2;
      if (a > 0.01) for (const [dx, k] of [[-16, 0], [0, 2], [16, 4]]) paperLantern(ctx, gx + dx, street + 4 + bob - (k === 2 ? 4 : 0), LANTERN_C[k], time, k, a);
    }
  } else if (kind === 'cb_stall' && extra === 'yours') {
    // Your stall (world/stall.js): your goods on the counter and your name on its board, or a
    // "For rent" board until you have a licence.
    place(ctx, bareStallArt(), snap(x), gy + 2);
    const mine = map.myStall;
    const top = gy + 2 - 62;
    (mine?.ids ?? []).slice(0, 6).forEach((id, i) => drawItemIcon(ctx, id, snap(x - 30 + (i % 3) * 18 + (i >= 3 ? 9 : 0)), snap(top + 22 - (i >= 3 ? 10 : 0)), 1));
    ctx.fillStyle = '#4a5a4a';
    ctx.fillRect(snap(x + 12), top + 44, 18, 10);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 3.6px Nunito, "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(mine?.licensed ? (mine.name ?? '').slice(0, 9) : 'FOR RENT', x + 21, top + 50.6);
    ctx.textAlign = 'left';
  } else if (kind === 'cb_stall') {
    place(ctx, stallArt(extra ?? wx), snap(x), gy + 2);
  } else if (kind === 'cb_crane') {
    place(ctx, craneArt(), snap(x), gy + 2);
    const tx = x - CRANE.w / 2 + CRANE.tip[0];
    const ty = gy + 2 - CRANE.h + CRANE.tip[1];
    const sway = Math.sin(time * 0.8 + wx) * 0.12;
    const len = 70 + Math.sin(time * 0.3) * 16;
    const ex = tx + Math.sin(sway) * len;
    const ey = ty + Math.cos(sway) * len;
    ctx.strokeStyle = '#6a5a5a';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(sway * 0.5);
    ctx.fillStyle = '#c8925a';
    ctx.fillRect(-9, 2, 18, 16);
    ctx.fillStyle = '#a8703a';
    ctx.fillRect(-9, 2, 18, 2);
    ctx.fillRect(-1, 2, 2, 16);
    ctx.restore();
  } else if (kind === 'cb_crates') {
    // The day's cargo: cleared away for the Night Market.
    const a = 1 - dark(map);
    if (a > 0.01) {
      ctx.globalAlpha = a;
      place(ctx, cratesArt(extra ?? wx), snap(x), gy + 2);
      ctx.globalAlpha = 1;
    }
  } else if (kind === 'cb_nightstall') {
    const a = dark(map);
    if (a > 0.01) {
      ctx.globalAlpha = a;
      place(ctx, nightStallArt(extra ?? wx), snap(x), gy + 2);
      ctx.globalAlpha = 1;
      const top = gy + 2 - 70;
      for (let k = 0; k < 4; k++) paperLantern(ctx, x - 27 + k * 18, top + 28, LANTERN_C[(k + Math.round(wx)) % 5], time, k + wx, a);
      // The goods glimmer.
      for (let k = 0; k < 3; k++) {
        const u = (time * 0.8 + k / 3 + wx * 0.01) % 1;
        ctx.globalAlpha = a * Math.sin(u * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.round(x - 22 + k * 22), Math.round(top + 36 - u * 4), 1.4, 1.4);
      }
      ctx.globalAlpha = 1;
      glow(ctx, x, top + 44, 40, '#c9a6ff', a * 0.25);
    }
  } else if (kind === 'cb_lanterns') {
    // Paper lanterns strung across the docks at night, from wx to `extra.to`, sagging.
    const a = dark(map);
    if (a > 0.01) {
      const x1 = (extra?.to ?? wx + 200) - cam.x;
      const y0 = gy - (extra?.h ?? 70);
      const y1 = snap(groundAt(map, extra?.to ?? wx + 200) - cam.y) - (extra?.h ?? 70);
      ctx.globalAlpha = a;
      ctx.strokeStyle = '#4a3a4a';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      const n = Math.max(4, Math.round((x1 - x) / 20));
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const px = x + (x1 - x) * u;
        const py = y0 + (y1 - y0) * u + Math.sin(Math.PI * u) * 14;
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      for (let i = 1; i < n; i++) {
        const u = i / n;
        paperLantern(ctx, x + (x1 - x) * u, y0 + (y1 - y0) * u + Math.sin(Math.PI * u) * 14, LANTERN_C[(i + Math.round(wx)) % 5], time, i * 1.7 + wx, a);
      }
    }
  } else if (kind === 'cb_fireflies') {
    // Fireflies over the docks at night, drifting, each blinking on its own beat.
    const a = dark(map);
    for (let k = 0; a > 0.01 && k < 10; k++) {
      const fx = x + ((k * 73 + time * 6 * (k % 2 ? 1 : -1)) % (extra?.w ?? 600) + (extra?.w ?? 600)) % (extra?.w ?? 600);
      const fy = gy - 30 - ((k * 37) % 60) + Math.sin(time * 1.2 + k) * 8;
      const blink = Math.max(0, Math.sin(time * 2 + k * 1.9));
      ctx.globalAlpha = a * blink;
      ctx.fillStyle = '#f4ffb0';
      ctx.fillRect(Math.round(fx), Math.round(fy), 1.6, 1.6);
      glow(ctx, fx, fy, 6, '#f4ffb0', a * blink * 0.5);
    }
    ctx.globalAlpha = 1;
  } else if (kind === 'cb_gate') {
    place(ctx, townGateArt(), snap(x), gy + 2);
    const top = gy + 2 - 140;
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '800 7px Nunito, "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('COINBRIDGE', x, top + 27);
    ctx.textAlign = 'left';
    for (const lx of [-54, 54]) {
      ctx.fillStyle = '#4a4a5a';
      ctx.fillRect(snap(x + lx - 1), top + 34, 2, 8);
      ctx.fillStyle = '#ffc870';
      ctx.fillRect(snap(x + lx - 3), top + 42, 6, 8);
      glow(ctx, x + lx, top + 46, 14, '#ffd98a', 0.3 + night * 0.5);
    }
  } else if (kind === 'cb_canal') {
    // `extra`: { w, depth } (the dip in the street the water sits in; its gondola is cb_gondola).
    const w = extra?.w ?? 120;
    const depth = extra?.depth ?? 30;
    const street = snap(groundAt(map, wx - w / 2 - 20) - cam.y);
    canalWater(ctx, x - w / 2, w, street, depth, time, wx);
  } else if (kind === 'cb_bridge') {
    // An arched stone bridge over a canal, `extra.w` wide, its deck at the street (the walkable
    // platform is the map's own).
    const w = extra?.w ?? 140;
    const street = snap(groundAt(map, wx - w / 2 - 20) - cam.y);
    const l = snap(x - w / 2);
    ctx.fillStyle = '#e4d8c4';
    ctx.beginPath();
    ctx.moveTo(l, street - 2);
    ctx.lineTo(l + w, street - 2);
    ctx.lineTo(l + w, street + 22);
    ctx.quadraticCurveTo(l + w / 2, street - 4, l, street + 22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f4ecdc';
    ctx.fillRect(l, street - 2, w, 3);
    ctx.fillStyle = '#c8b8a0';
    ctx.fillRect(l, street + 1, w, 1);
    // Its balustrade.
    ctx.fillStyle = '#efe4d2';
    ctx.fillRect(l, street - 16, w, 2.4);
    for (let px = l + 3; px < l + w - 2; px += 6) {
      ctx.beginPath();
      ctx.ellipse(px + 1, street - 8, 1.6, 5.6, 0, 0, TAU);
      ctx.fill();
    }
    for (const lx of [l + 2, l + w - 6]) {
      ctx.fillStyle = '#d8ccb8';
      ctx.fillRect(lx, street - 22, 5, 20);
      ctx.fillStyle = '#4a4a5a';
      ctx.fillRect(lx + 2, street - 32, 1, 10);
      ctx.fillStyle = '#ffc870';
      ctx.fillRect(lx, street - 36, 5, 5);
      glow(ctx, lx + 2.5, street - 33, 12, '#ffd98a', 0.25 + night * 0.5);
    }
  }
  return true;
}

// ---------- Inside the Gilded Kettle ----------
// What's where (x; the wall is y 0-300, the floor from 300): the door out 60, the stair up to the
// rooms 110-200 (the card table in front of it at 168, Tilly), the fireplace and the great kettle
// 230-350, the bar 380-620 (Juniper behind it at 492, Wendell on a stool at 412).

const WALL_TOP = 40;
function innRoomArt() {
  return art('cb-innroom', 640, 480, () => {
    const out = [];
    const plaster = ramp('#ffe8cc', 0.6);
    const wood = ramp('#9a6a4a', 0.8);
    const floor = ramp('#b8845a', 0.8);
    // The ceiling and its beams.
    out.push(R(0, 0, 640, WALL_TOP + 12, '#7a5a44'));
    for (let x = 20; x < 640; x += 120) out.push(R(x, 0, 16, WALL_TOP + 12, '#5a3a2a'), F(R(x, 0, 3, WALL_TOP + 12, '#7a5a44')));
    // Plaster above, panelling below.
    out.push(R(0, WALL_TOP + 12, 640, 160, plaster.base), ...wallShade(0, WALL_TOP + 12, 640, 160, plaster, 3));
    out.push(R(0, 210, 640, 90, wood.base), R(0, 206, 640, 6, wood.hi));
    for (let x = 8; x < 640; x += 46) out.push(F(R(x, 218, 36, 64, mix(wood.base, wood.hi, 0.3))), F(R(x + 35, 218, 1, 64, wood.sh)));
    out.push(R(0, 290, 640, 11, wood.sh));
    // The floor, painted all the way down.
    out.push(R(0, 300, 640, 180, floor.base), ...planks(0, 301, 640, 179, floor, 10, 3, true), F(R(0, 301, 640, 6, mix(floor.base, '#3a2a4a', 0.28))));
    // The door out, with a round window, and a mat.
    out.push(R(32, 170, 56, 130, '#5a3a3a'), E(60, 170, 28, 22, '#5a3a3a'), R(36, 174, 48, 126, '#a8704a'), E(60, 174, 24, 19, '#a8704a'), ...planks(37, 176, 46, 124, ramp('#a8704a', 0.8), 3, 5));
    out.push(E(60, 196, 9, 9, '#5a3a3a'), E(60, 196, 7, 7, '#9fd8ff'), F(E(58, 194, 2.4, 2.4, WHITE)), F(E(78, 240, 2, 2, GOLD)), R(26, 298, 68, 6, '#d86a5a'), F(R(26, 298, 68, 1.4, '#f08a7a')));
    // The stair up to the rooms, its banister and a "Rooms" sign.
    for (let k = 0; k < 8; k++) out.push(R(110 + k * 11, 290 - k * 26, 96 - k * 11, 10, floor.hi), F(R(110 + k * 11, 298 - k * 26, 96 - k * 11, 2, floor.sh)));
    out.push(T([[110, 290], [200, 82], [204, 86], [114, 294]], wood.base));
    for (let k = 0; k < 8; k++) out.push(R(116 + k * 11, 260 - k * 26, 2, 30, wood.base));
    out.push(R(150, 92, 40, 16, '#7a4a3a'), F(R(152, 94, 36, 12, '#a8704a')));
    // The fireplace and its mantel, the great copper kettle hung over the fire.
    const st = ramp('#d8c8b8', 0.7);
    out.push(R(230, 120, 120, 180, st.base), ...stones(230, 122, 120, 176, st, 4), R(222, 112, 136, 12, wood.base), F(R(222, 112, 136, 2, wood.hi)));
    out.push(R(252, 190, 76, 110, '#3a2a2a'), E(290, 190, 38, 24, '#3a2a2a'));
    out.push(R(289, 150, 2, 52, '#3a3a4a'), E(290, 222, 22, 18, '#d8885a'), F(E(284, 216, 8, 6, '#f8b080')), R(280, 200, 20, 5, '#b8683a'), T([[310, 218], [324, 208], [322, 214], [312, 226]], '#c8784a'), T([[268, 214], [262, 222], [270, 228]], '#a8583a'));
    out.push(R(258, 268, 64, 8, '#6a4a3a'), R(264, 262, 14, 10, '#8a5a3a'), R(296, 262, 16, 10, '#8a5a3a'));
    // Things on the mantel: a clock, a little gold coin trophy, candles.
    out.push(R(244, 92, 16, 20, '#a8704a'), E(252, 100, 5, 5, WHITE), E(330, 106, 7, 6, GOLD), R(327, 98, 6, 4, GOLD));
    // The bar: shelves of bottles behind it, the barrels, the counter, the taps, the stools.
    out.push(R(380, 70, 250, 130, '#7a5a44'));
    for (const y of [104, 150, 196]) {
      out.push(R(386, y, 238, 5, wood.hi), F(R(386, y + 4, 238, 1.4, wood.sh)));
      for (let k = 0; k < 18; k++) {
        const c = pick(['#7fcf9a', '#a8e0ff', '#ff9ec0', '#ffd36b', '#c9a6ff', '#e86a5a'], k * 3.1 + y);
        const bh = 18 + (k % 3) * 4;
        out.push(R(392 + k * 13, y - bh, 7, bh, c), R(394 + k * 13, y - bh - 5, 3, 5, c), F(R(393 + k * 13, y - bh + 2, 1.4, bh - 4, WHITE)));
      }
    }
    for (const bx of [604, 572]) out.push(E(bx, 268, 16, 22, '#a8704a'), F(R(bx - 16, 256, 32, 2, '#5a5a6a')), F(R(bx - 16, 280, 32, 2, '#5a5a6a')), E(bx, 268, 4, 4, '#8a5a3a'));
    out.push(R(376, 232, 210, 68, wood.base), ...planks(378, 236, 206, 62, wood, 8, 9), R(370, 224, 222, 10, '#c89060'), F(R(370, 224, 222, 2, '#e0b080')));
    for (const tx of [430, 470, 510]) out.push(R(tx - 2, 204, 4, 20, '#d8a84a'), E(tx, 202, 4, 3, GOLD), R(tx - 3, 212, 6, 3, pick(['#e85a6a', '#5fb8a0', '#6a8ad0'], tx)));
    for (const sx of [400, 450, 540]) out.push(E(sx, 262, 14, 4, '#c86a5a'), R(sx - 2, 266, 4, 34, '#5a3a2a'), R(sx - 9, 290, 18, 3, '#5a3a2a'));
    // The card table under its hanging lamp, cards laid out, two chairs.
    const TX = 168;
    out.push(R(TX - 1, 0, 2, 214, '#4a4a5a'), T([[TX - 16, 214], [TX + 16, 214], [TX + 10, 204], [TX - 10, 204]], '#5a8a6a'));
    out.push(E(TX, 266, 44, 9, '#2f6a4a'), E(TX, 264, 40, 7, '#3f8a5a'), R(TX - 4, 272, 8, 28, '#6a4a3a'), R(TX - 20, 296, 40, 4, '#5a3a2a'));
    for (const [cx, cy, a] of [[TX - 16, 262, -0.2], [TX - 6, 260, 0.1], [TX + 6, 263, 0.3], [TX + 16, 261, -0.1]]) out.push(T([[cx - 3, cy - 2 + a], [cx + 3, cy - 2 - a], [cx + 3, cy + 2], [cx - 3, cy + 2]], WHITE));
    out.push(E(TX, 256, 3, 2, GOLD), E(TX + 4, 257, 3, 2, GOLD));
    // Pictures on the wall: a ship, the town's bridge.
    out.push(R(408, 54, 60, 2, '#7a5a44'));
    for (const [fx, fy, w, h, bg] of [[214, 64, 46, 34, '#9fd8ff'], [476, 30, 0, 0, null]]) if (bg) out.push(R(fx - 3, fy - 3, w + 6, h + 6, GOLD), R(fx, fy, w, h, bg), T([[fx + 10, fy + 24], [fx + 36, fy + 24], [fx + 32, fy + 30], [fx + 14, fy + 30]], '#a8704a'), R(fx + 22, fy + 6, 2, 18, '#5a3a2a'), T([[fx + 24, fy + 8], [fx + 34, fy + 20], [fx + 24, fy + 20]], WHITE));
    // A rug by the fire where people warm their feet.
    out.push(E(290, 340, 90, 12, '#c84a5a'), E(290, 339, 84, 10, '#e86a6a'), E(290, 339, 66, 7, '#ffd36b'), E(290, 339, 60, 6, '#e86a6a'));
    return out;
  }, false);
}
// The room's life: the fire flickering under the kettle (steam off its spout), the lamp over the
// card table swaying a touch, candle glow, warm light on everything at night.
function innRoomLife(ctx, ox, oy, time, night) {
  const f = 0.6 + 0.4 * Math.sin(time * 9) * Math.sin(time * 5.3);
  for (let k = 0; k < 5; k++) {
    const fx = ox + 272 + k * 9;
    const h = 14 + Math.sin(time * 8 + k * 1.7) * 5;
    ctx.fillStyle = k % 2 ? '#ffb03a' : '#ff7a3a';
    ctx.beginPath();
    ctx.moveTo(fx - 4, oy + 266);
    ctx.quadraticCurveTo(fx, oy + 266 - h, fx + 4, oy + 266);
    ctx.fill();
  }
  glow(ctx, ox + 290, oy + 250, 70, '#ffb03a', 0.3 + f * 0.2);
  puffs(ctx, ox + 322, oy + 206, time, 0.2, 3, 30);
  const sway = Math.sin(time * 0.8) * 1.2;
  glow(ctx, ox + 168 + sway, oy + 216, 44, '#ffe9a6', 0.35 + night * 0.2);
  glow(ctx, ox + 500, oy + 150, 90, '#ffd98a', 0.12);
}
