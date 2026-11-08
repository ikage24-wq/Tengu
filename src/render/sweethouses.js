// The Sweethearts' own houses (data/sweethearts.js `house`): six new buildings in their towns, each
// one's idea in its shape, and a room inside decorated in their style. Drawn like the rest of the
// scenery (outlined pastel shapes lit from the upper left), and every one alive: chimneys puff,
// lamps glow at night, Celeste's telescope turns, Lark's lamp beams, lanterns sway.
//
// Outside:
//   swhouse_poppy    a bakery cottage with a bread-roll roof dripping icing, a striped awning over
//                    a shop window of cakes, a strawberry-red door, a chimney puffing
//   swhouse_lark     a tall, narrow keeper's cottage, sky-blue and white, portholes, a little lamp
//                    tower on top that glows and beams, poems pinned by the door, a wind chime
//   swhouse_rowan    a stone-and-timber knight's lodge with an extra-tall door, a shield crest,
//                    window boxes overflowing with daisies, a banner stirring
//   swhouse_yuzu     a little shrine house: a curved red roof, a round moon window, paper lanterns
//                    swaying, a fox-tail weathervane
//   swhouse_celeste  an observatory cottage: indigo walls with stars, a dome with a slit and a
//                    telescope that turns, a crescent-moon door
//   swhouse_marlowe  an upturned boat for a roof over a cabin, portholes, an anchor by the door, a
//                    rope ladder and a flag on the keel
// Inside (swroom_<id>, 640 x 360, like your hut): each one's own room.

import { R, E, T, F, mix } from './pixel.js';
import { ramp, planks, stones, hash } from './propkit.js';
import { art, place } from './scenery.js';
import { groundAt } from '../world/physics.js';
import { ROOM, ROOM_H, roomLife } from './sweetrooms.js';

export { ROOM_H };

const TAU = Math.PI * 2;
const WOOD = '#c89a6a';
const WHITE = '#ffffff';
const GOLD = '#ffd36b';
const star = (cx, cy, r, c) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return T(pts, c);
};
function glow(ctx, x, y, r, color, alpha) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
function puffs(ctx, x, y, time, seed, n = 4) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const k = (time * 0.32 + i / n + seed) % 1;
    ctx.globalAlpha = (1 - k) * 0.55;
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(x + Math.sin(k * 5 + seed) * 4 + k * 8, y - k * 34, 2.5 + k * 4, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
const win = (x, y, w, h, frame, warm = '#ffe08a') => [R(x - 1.5, y - 1.5, w + 3, h + 3, frame), R(x, y, w, h, '#5a4a6a'), F(R(x, y + 1, w, h - 1, warm)), F(R(x + w / 2 - 0.5, y, 1, h, frame)), F(R(x, y + h / 2 - 0.5, w, 1, frame)), F(R(x + 1, y + 1, w * 0.3, h * 0.3, '#fff8d6'))];
const porthole = (cx, cy, r, frame) => [E(cx, cy, r + 2, r + 2, frame), E(cx, cy, r, r, '#5a4a6a'), F(E(cx, cy + 0.6, r - 1, r - 1.4, '#ffe08a')), F(E(cx - r * 0.35, cy - r * 0.35, r * 0.3, r * 0.3, '#fff8d6'))];

// ---------- Outside ----------
export const HOUSE = {
  poppy: { w: 130, h: 150, door: [54, 76] },
  lark: { w: 92, h: 190, door: [32, 60] },
  rowan: { w: 150, h: 150, door: [56, 94] },
  yuzu: { w: 136, h: 130, door: [52, 84] },
  celeste: { w: 130, h: 168, door: [48, 82] },
  marlowe: { w: 150, h: 120, door: [62, 88] },
};

const EXT = {
  poppy: () => art('swh-poppy', 130, 150, () => {
    const wall = ramp('#fff2e0', 0.6);
    const crust = ramp('#e0a060', 0.85);
    const H = 150;
    const out = [];
    // Walls of cream plaster with a brick foot.
    out.push(R(10, 62, 110, H - 62, wall.base), F(R(100, 62, 20, H - 62, wall.sh)));
    for (let x = 10; x < 120; x += 10) out.push(F(R(x, H - 12, 9, 5, '#e8b8a0')), F(R(x + 5, H - 6, 9, 5, '#e0a890')));
    // The bread-roll roof: a big golden loaf with scored slashes and icing dripping over the edge.
    out.push(E(65, 60, 64, 34, crust.base), F(E(78, 70, 50, 20, crust.sh)), F(E(46, 44, 30, 10, crust.hi)));
    for (const x of [30, 52, 74, 96]) out.push(F(T([[x - 7, 46 + (x - 64) * 0.05], [x + 7, 40 + (x - 64) * 0.05], [x + 8, 43], [x - 6, 49]], '#ffe0a8')));
    out.push(T([[4, 66], [126, 66], [126, 72], [4, 72]], '#fff6ee'));
    for (let x = 6; x < 126; x += 9) out.push(E(x + 4, 72 + (hash(x) * 4), 3.4, 3 + hash(x + 1) * 3, '#fff6ee'));
    for (const [x, c] of [[20, '#ff8a8a'], [44, '#8fd8ff'], [70, GOLD], [98, '#9fe0a0'], [112, '#ff9ec0']]) out.push(F(R(x, 67, 2, 1, c)));
    // Chimney.
    out.push(R(92, 14, 12, 26, '#d98a6a'), F(R(92, 14, 3, 26, '#f2a888')), R(90, 12, 16, 4, '#b8705a'));
    // A striped awning over the shop window.
    for (let k = 0; k < 7; k++) out.push(T([[64 + k * 8, 84], [72 + k * 8, 84], [72 + k * 8, 92], [64 + k * 8, 92]], k % 2 ? WHITE : '#ff9ec0'));
    for (let k = 0; k < 7; k++) out.push(E(68 + k * 8, 92, 4, 2.6, k % 2 ? WHITE : '#ff9ec0'));
    out.push(...win(68, 96, 46, 26, '#ffffff', '#fff3d6'));
    // Cakes in the window.
    out.push(R(74, 112, 10, 8, '#ffc2d4'), R(76, 108, 6, 4, '#fff4ea'), E(79, 107, 1.4, 1.4, '#ff6b8a'), E(96, 116, 6, 4, '#e0a060'), E(106, 116, 4, 3, '#d8904a'));
    // The strawberry door, with a leafy top and a heart window.
    out.push(E(36, 106, 15, 16, '#e5485f'), R(21, 106, 30, H - 106 - 2, '#e5485f'), F(R(21, 106, 4, H - 108, '#ff6b7a')));
    for (const [x, y] of [[28, 112], [42, 110], [34, 124], [44, 130], [28, 134]]) out.push(F(E(x, y, 0.9, 1.3, '#ffe08a')));
    out.push(T([[26, 92], [36, 86], [46, 92], [42, 96], [36, 93], [30, 96]], '#5fbf7a'), E(46, 128, 1.6, 1.6, GOLD));
    return out;
  }, false),
  lark: () => art('swh-lark', 92, 190, () => {
    const wall = ramp('#e8f6ff', 0.6);
    const blue = ramp('#7fb8d8', 0.8);
    const H = 190;
    const out = [];
    // A tall narrow cottage, its walls in sky-blue and white bands.
    out.push(R(14, 56, 64, H - 56, wall.base), F(R(64, 56, 14, H - 56, wall.sh)));
    for (let y = 70; y < H - 10; y += 28) out.push(F(R(14, y, 64, 9, blue.base)), F(R(64, y, 14, 9, blue.sh)));
    // A pointed blue roof, and the little lamp tower on top.
    out.push(T([[6, 60], [46, 26], [86, 60]], blue.sh), F(T([[46, 26], [86, 60], [46, 60]], mix(blue.sh, '#4a6aa8', 0.4))), F(T([[10, 58], [46, 30], [30, 50]], blue.base)));
    out.push(R(38, 10, 16, 18, WHITE), R(36, 6, 20, 4, '#4a6aa8'), R(40, 12, 12, 12, '#ffe08a'), F(R(42, 13, 4, 10, '#fff8d6')), T([[34, 6], [46, -2], [58, 6]], '#4a6aa8'));
    // Portholes up the side, the door with a lifebuoy over it, poems pinned by the door.
    out.push(...porthole(46, 84, 8, WHITE), ...porthole(46, 124, 7, WHITE));
    out.push(R(30, 146, 30, H - 148, '#4a6aa8'), F(R(30, 146, 30, 3, '#6a8ac8')), E(54, 168, 1.6, 1.6, GOLD));
    out.push(E(45, 140, 7, 7, '#ff8a8a'), E(45, 140, 4, 4, wall.base), ...[0, 1, 2, 3].map((i) => F(R(45 + Math.cos(i * 1.57) * 5.5 - 1, 140 + Math.sin(i * 1.57) * 5.5 - 1, 2, 2, WHITE))));
    for (const [x, y] of [[66, 150], [70, 160], [64, 166]]) out.push(R(x, y, 8, 6, '#fffaf0'), F(R(x + 1, y + 1.5, 6, 0.6, '#a8a0c0')), F(R(x + 1, y + 3, 4, 0.6, '#a8a0c0')));
    return out;
  }, false),
  rowan: () => art('swh-rowan', 150, 150, () => {
    const stone = ramp('#d8d0c8', 0.7);
    const wd = ramp('#b8865a', 0.8);
    const roof = ramp('#8fb8e8', 0.8);
    const H = 150;
    const out = [];
    // Stone footing and timber-framed upper walls.
    out.push(...stones(6, 96, 138, H - 96, stone, 31));
    out.push(R(8, 50, 134, 48, '#fff4e6'), F(R(118, 50, 24, 48, '#f2e2d0')));
    for (const x of [8, 40, 74, 108, 138]) out.push(R(x, 50, 4, 48, wd.base));
    out.push(R(8, 50, 134, 4, wd.base), R(8, 72, 134, 3, wd.sh), F(T([[12, 54], [38, 72], [40, 70], [14, 52]], wd.sh)), F(T([[112, 54], [138, 72], [136, 74], [110, 56]], wd.sh)));
    // A steep slate roof in soft blue.
    out.push(T([[0, 54], [75, 4], [150, 54]], roof.base), F(T([[75, 4], [150, 54], [75, 54]], roof.sh)));
    for (let y = 16; y < 54; y += 8) out.push(F(R(75 - (y - 4) * 1.5 + 4, y, (y - 4) * 3 - 8, 0.8, roof.sh)));
    // The shield crest over the door, a banner, the extra-tall door.
    out.push(T([[64, 58], [86, 58], [86, 70], [75, 78], [64, 70]], '#5fb8d8'), F(T([[64, 58], [75, 58], [75, 78], [64, 70]], '#7fd0e8')), star(75, 66, 4, GOLD));
    out.push(R(56, 84, 38, H - 86, wd.sh), R(58, 86, 34, H - 88, wd.base), F(R(74.5, 86, 1, H - 88, wd.sh)), ...[96, 116, 136].map((y) => F(R(58, y, 34, 1.4, '#8a6a4a'))), E(88, 120, 2, 2, GOLD));
    // Window boxes overflowing with daisies.
    for (const wx of [18, 110]) {
      out.push(...win(wx, 58, 22, 16, wd.base));
      out.push(R(wx - 3, 76, 28, 6, wd.base));
      for (let i = 0; i < 6; i++) out.push(E(wx - 1 + i * 4.6, 75 - (i % 2) * 2, 2.2, 2.2, WHITE), F(E(wx - 1 + i * 4.6, 75 - (i % 2) * 2, 0.8, 0.8, GOLD)));
    }
    return out;
  }, false),
  yuzu: () => art('swh-yuzu', 136, 130, () => {
    const red = ramp('#e5485f', 0.8);
    const wall = ramp('#fff4e8', 0.6);
    const wd = ramp('#a8705a', 0.8);
    const H = 130;
    const out = [];
    // Raised on a wooden platform with steps.
    out.push(R(12, H - 16, 112, 14, wd.base), F(R(12, H - 16, 112, 3, wd.hi)), R(54, H - 4, 28, 4, wd.sh));
    for (const x of [16, 120]) out.push(R(x - 2, 52, 6, H - 66, red.base));
    // Shoji walls.
    out.push(R(20, 56, 96, H - 72, wall.base));
    for (let x = 20; x < 116; x += 12) out.push(F(R(x, 56, 1, H - 72, '#c8a888')));
    for (let y = 64; y < H - 16; y += 10) out.push(F(R(20, y, 96, 1, '#c8a888')));
    // The round moon window and the sliding door.
    out.push(E(36, 80, 13, 13, wd.sh), E(36, 80, 11, 11, '#5a4a6a'), F(E(36, 81, 10, 9, '#ffe8a0')), F(E(32, 76, 3, 3, '#fff8d6')));
    out.push(R(52, 74, 32, H - 90, '#fff8f0'), F(R(67.5, 74, 1, H - 90, '#c8a888')), ...[84, 94, 104].map((y) => F(R(52, y, 32, 0.8, '#c8a888'))));
    // The curved red roof, upturned at the ends, two tiers.
    out.push(T([[0, 54], [18, 46], [118, 46], [136, 54], [126, 58], [10, 58]], red.base), F(T([[10, 56], [126, 56], [126, 58], [10, 58]], red.sh)));
    out.push(T([[20, 46], [34, 26], [102, 26], [116, 46]], red.base), F(T([[68, 26], [102, 26], [116, 46], [68, 46]], red.sh)), T([[28, 28], [68, 10], [108, 28]], red.base), F(T([[68, 10], [108, 28], [68, 28]], red.sh)));
    out.push(E(68, 9, 3, 3, GOLD));
    return out;
  }, false),
  celeste: () => art('swh-celeste', 130, 168, () => {
    const wall = ramp('#4a4aa8', 0.75);
    const dome = ramp('#c8c8e8', 0.7);
    const H = 168;
    const out = [];
    // Indigo walls scattered with little stars.
    out.push(R(12, 70, 106, H - 70, wall.base), F(R(98, 70, 20, H - 70, wall.sh)));
    for (let i = 0; i < 14; i++) out.push(F(star(18 + hash(i * 3.1) * 94, 76 + hash(i * 7.7) * (H - 90), 1 + hash(i) * 1.2, i % 3 ? '#c8c8ff' : GOLD)));
    // A silver dome with its slit.
    out.push(E(65, 72, 56, 50, dome.base), F(E(80, 82, 40, 34, dome.sh)), F(E(46, 52, 18, 12, '#f2f2ff')));
    out.push(R(6, 68, 118, 8, '#8f8fc8'), F(R(6, 68, 118, 2, '#c8c8ff')));
    out.push(T([[60, 24], [72, 24], [72, 70], [60, 70]], '#2f2f68'));
    // Round window, crescent-moon door.
    out.push(...porthole(96, 100, 9, '#c8c8ff'));
    out.push(E(48, 128, 18, 20, '#2f2f68'), R(30, 128, 36, H - 130, '#2f2f68'), E(48, 128, 16, 18, '#5f5fb8'), R(32, 128, 32, H - 130, '#5f5fb8'));
    out.push(T([[40, 112], [52, 108], [58, 118], [52, 128], [44, 130], [50, 122], [50, 114]], GOLD), E(60, 146, 1.6, 1.6, GOLD));
    return out;
  }, false),
  marlowe: () => art('swh-marlowe', 150, 120, () => {
    const hull = ramp('#ff8a8a', 0.8);
    const wd = ramp(WOOD, 0.8);
    const H = 120;
    const out = [];
    // The cabin: planks under the hull.
    out.push(...planks(14, 48, 122, H - 48, wd, 7, 9));
    // The upturned boat for a roof: its hull curving over, a white stripe, the keel on top.
    out.push(T([[2, 52], [10, 30], [30, 16], [120, 16], [140, 30], [148, 52]], hull.base), F(T([[2, 52], [148, 52], [144, 42], [6, 42]], hull.sh)), F(R(12, 26, 126, 4, WHITE)), R(20, 12, 110, 5, wd.sh));
    // The mast as the flagpole, set in the keel.
    out.push(R(104, -6, 3, 20, wd.base));
    // Portholes and the door with a rope frame.
    out.push(...porthole(36, 74, 8, '#c8902a'), ...porthole(114, 74, 8, '#c8902a'));
    out.push(R(60, 62, 30, H - 64, '#5a3a2a'), R(62, 64, 26, H - 66, wd.base), F(R(75, 64, 1, H - 66, wd.sh)), E(84, 92, 1.8, 1.8, GOLD));
    for (let i = 0; i < 10; i++) out.push(F(E(58 + (i < 5 ? 0 : 34), 64 + (i % 5) * 11, 1.6, 1.6, '#e8c890')));
    // An anchor leaning by the door.
    out.push(R(100, 88, 3, 24, '#8a92a8'), T([[92, 108], [111, 108], [101.5, 116]], '#8a92a8'), E(101.5, 86, 3, 3, '#8a92a8'), E(101.5, 86, 1.6, 1.6, wd.base), R(96, 92, 11, 2, '#8a92a8'));
    return out;
  }, false),
};

// ---------- Inside ----------
// The rooms themselves are drawn in render/sweetrooms.js.

// The house's door, relative to where it's drawn (for the map's door portal).
export const doorOf = (id) => HOUSE[id];

export function drawSweetHouse(ctx, map, kind, wx, extra, cam, width, time) {
  if (!kind.startsWith('swhouse_') && !kind.startsWith('swroom_')) return false;
  const id = kind.split('_')[1];
  const x = wx - cam.x;
  const night = map.night ?? 0;
  if (kind.startsWith('swroom_')) {
    place(ctx, ROOM[id](), x, ROOM_H - cam.y);
    roomLife(ctx, id, x - 320, 360 - cam.y - 360, time);
    return true;
  }
  if (x < -200 || x > width + 200) return true;
  const gy = groundAt(map, wx) - cam.y;
  const s = EXT[id]();
  place(ctx, s, x, gy + 2);
  const left = x - s.w / 2;
  const top = gy + 2 - s.h;
  switch (id) {
    case 'poppy':
      puffs(ctx, left + 98, top + 10, time, wx * 0.01);
      glow(ctx, left + 91, top + 108, 26, '#ffe08a', 0.15 + night * 0.5);
      break;
    case 'lark': {
      // Her lamp glows; at night it beams out to sea, sweeping slowly.
      glow(ctx, left + 46, top + 18, 18, '#fff3a6', 0.35 + night * 0.4);
      if (night > 0.2) {
        const a = Math.sin(time * 0.6) * 0.8 + Math.PI;
        ctx.save();
        ctx.globalAlpha = night * 0.5;
        ctx.translate(left + 46, top + 18);
        ctx.rotate(a);
        const g = ctx.createLinearGradient(0, 0, 160, 0);
        g.addColorStop(0, 'rgba(255,243,166,0.6)');
        g.addColorStop(1, 'rgba(255,243,166,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.lineTo(160, -18);
        ctx.lineTo(160, 18);
        ctx.lineTo(0, 2);
        ctx.fill();
        ctx.restore();
      }
      // The wind chime swaying.
      for (let k = 0; k < 3; k++) {
        const sw = Math.sin(time * 2 + k) * 2;
        ctx.fillStyle = ['#ffd2e0', '#c8e8ff', '#fff0b0'][k];
        ctx.fillRect(Math.round(left + 18 + k * 4 + sw), Math.round(top + 152 + k * 3), 2, 6);
      }
      break;
    }
    case 'rowan': {
      // A banner stirring off the roof's peak.
      ctx.fillStyle = '#5fb8d8';
      ctx.beginPath();
      ctx.moveTo(left + 75, top + 2);
      for (let i = 0; i <= 6; i++) ctx.lineTo(left + 75 + i * 4, top - 12 + Math.sin(time * 3 + i * 0.6) * 1.6 * (i / 6));
      for (let i = 6; i >= 0; i--) ctx.lineTo(left + 75 + i * 4, top - 4 + Math.sin(time * 3 + i * 0.6) * 1.6 * (i / 6));
      ctx.fill();
      ctx.fillStyle = '#8a6a4a';
      ctx.fillRect(Math.round(left + 74), Math.round(top - 14), 2, 18);
      glow(ctx, left + 29, top + 66, 18, '#ffe08a', night * 0.5);
      glow(ctx, left + 121, top + 66, 18, '#ffe08a', night * 0.5);
      break;
    }
    case 'yuzu': {
      // Two paper lanterns swaying from the eaves, glowing; the fox-tail weathervane turning.
      for (const lx of [left + 14, left + 122]) {
        const sw = Math.sin(time * 1.6 + lx) * 0.12;
        ctx.save();
        ctx.translate(lx, top + 58);
        ctx.rotate(sw);
        ctx.fillStyle = '#5a4a6a';
        ctx.fillRect(-0.5, 0, 1, 6);
        ctx.fillStyle = '#ff7a4a';
        ctx.beginPath();
        ctx.ellipse(0, 12, 6, 7, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#ffd36b';
        ctx.fillRect(-5, 11, 10, 1.4);
        ctx.restore();
        glow(ctx, lx, top + 70, 14, '#ffb070', 0.25 + night * 0.5);
      }
      const v = Math.sin(time * 0.7 + wx) * 0.5;
      ctx.save();
      ctx.translate(left + 68, top + 6);
      ctx.scale(Math.cos(v) >= 0 ? 1 : -1, 1);
      ctx.fillStyle = '#ff9a4f';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(10, -10, 16, -2);
      ctx.quadraticCurveTo(10, -4, 4, 2);
      ctx.fill();
      ctx.fillStyle = '#fff4e0';
      ctx.beginPath();
      ctx.arc(15, -2, 2, 0, TAU);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'celeste': {
      // The telescope poking from the dome's slit, turning slowly to follow the stars.
      const a = -1.2 + Math.sin(time * 0.15 + wx) * 0.3;
      ctx.save();
      ctx.translate(left + 66, top + 40);
      ctx.rotate(a);
      ctx.fillStyle = '#e0b060';
      ctx.fillRect(-4, -4, 40, 8);
      ctx.fillStyle = '#ffe08a';
      ctx.fillRect(-4, -4, 40, 2);
      ctx.fillStyle = '#8a5a1a';
      ctx.fillRect(34, -5, 4, 10);
      ctx.restore();
      glow(ctx, left + 96, top + 100, 18, '#c8c8ff', 0.2 + night * 0.5);
      break;
    }
    case 'marlowe': {
      // A flag flying off the mast, gulls' favourite perch.
      ctx.fillStyle = '#2f5fb8';
      ctx.beginPath();
      ctx.moveTo(left + 107, top - 6);
      for (let i = 0; i <= 6; i++) ctx.lineTo(left + 107 + i * 3, top - 6 + Math.sin(time * 3.4 + i * 0.7) * 1.4 * (i / 6));
      for (let i = 6; i >= 0; i--) ctx.lineTo(left + 107 + i * 3, top + 3 + Math.sin(time * 3.4 + i * 0.7) * 1.4 * (i / 6));
      ctx.fill();
      ctx.fillStyle = WHITE;
      ctx.fillRect(Math.round(left + 113), Math.round(top - 3), 4, 3);
      glow(ctx, left + 36, top + 74, 14, '#ffe08a', night * 0.5);
      glow(ctx, left + 114, top + 74, 14, '#ffe08a', night * 0.5);
      // The rope ladder down the side, swaying.
      ctx.strokeStyle = '#e8c890';
      ctx.lineWidth = 1;
      const sw = Math.sin(time * 1.4) * 1.5;
      for (const dx of [140, 146]) {
        ctx.beginPath();
        ctx.moveTo(left + dx, top + 30);
        ctx.lineTo(left + dx + sw, top + 100);
        ctx.stroke();
      }
      for (let i = 0; i < 6; i++) ctx.fillRect(Math.round(left + 140 + sw * (i / 6)), Math.round(top + 38 + i * 11), 6, 1.4);
      break;
    }
    default:
  }
  return true;
}
