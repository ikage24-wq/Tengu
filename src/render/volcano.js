// The Candy Volcano's rooms (world/volcano.js runs them), in the scenery's outlined chibi style:
// the valley's sugar crystals and sticky taffy, the mine's hot caramel pit, the kitchen's dispensers
// and cauldron (with the recipe on its chalkboard), the forge's pools of hot caramel and bellows.
// (x, y) is the bottom center on the floor; `time` (seconds) animates.

import { R, E, T, F, mix } from './pixel.js';
import { art, place } from './scenery.js';

const TAU = Math.PI * 2;
const CANDY_C = { red: '#ff5a6a', yellow: '#ffd36b', green: '#9ae66a', blue: '#7fd8ff' };

function glow(ctx, x, y, r, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
// A wobbling caramel surface along y from x0 to x1 (screen), its own colour and gloss.
function caramel(ctx, x0, x1, y, depth, time, wx, c = '#e8a040', lit = '#ffd08a') {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x0, y + depth);
  for (let x = x0; x <= x1; x += 8) ctx.lineTo(x, y + Math.sin(time * 2 + (x + wx) * 0.06) * 1.5);
  ctx.lineTo(x1, y + depth);
  ctx.fill();
  ctx.fillStyle = lit;
  for (let x = x0; x <= x1; x += 22) ctx.fillRect(x, y - 1 + Math.sin(time * 2 + (x + wx) * 0.06) * 1.5, 8, 1.5);
}

function crystalArt(got) {
  return art(`candy-crystal|${got}`, 26, 34, () => [
    E(13, 32, 9, 2, '#c8a0b8'),
    T([[6, 32], [9, 10], [13, 2], [17, 10], [20, 32]], got ? '#ffd0ec' : '#ff9ad8'), F(T([[9, 10], [13, 2], [13, 30], [8, 30]], '#ffe0f2')), F(T([[17, 10], [20, 32], [15, 32]], '#e070b0')),
    T([[2, 32], [4, 20], [7, 26], [8, 32]], '#9fd8ff'), T([[19, 32], [22, 18], [25, 24], [24, 32]], '#ffd36b'),
  ]);
}
function dispenserArt(colour, used) {
  return art(`candy-disp|${colour}|${used}`, 28, 48, () => {
    const c = CANDY_C[colour];
    return [
      R(8, 28, 12, 18, '#e0304e'), F(R(8, 28, 12, 3, '#ff7a8a')), R(6, 44, 16, 4, '#a81a36'), R(12, 34, 4, 5, '#3a2a3a'),
      E(14, 16, 12, 13, '#dff6ff'), F(E(10, 11, 4, 4, '#ffffff')),
      ...[0, 1, 2, 3, 4, 5].map((k) => E(9 + (k % 3) * 5, 14 + Math.floor(k / 3) * 7, 2.4, 2.4, c)),
      E(14, 4, 4, 2, '#e0304e'),
    ];
  });
}
function cauldronArt() {
  return art('candy-cauldron', 70, 56, () => [
    E(35, 54, 30, 3, '#3a2a3a'), T([[6, 20], [64, 20], [58, 48], [12, 48]], '#4a3a5a'), F(T([[6, 20], [16, 20], [18, 46], [12, 48]], '#6a5a7a')),
    E(35, 20, 30, 6, '#5a4a6a'), E(35, 20, 26, 4, '#ff9ad8'), F(E(28, 19, 8, 1.6, '#ffd0ec')),
    R(12, 48, 4, 6, '#3a2a3a'), R(54, 48, 4, 6, '#3a2a3a'),
  ]);
}

export function drawVolcanoBack(ctx, world, cam, time) {
  const room = world.dungeon.room;
  const map = world.map;
  if (map.dungeon !== 'volcano') return;
  // Sticky taffy pools: stretchy pink with strands lifting.
  for (const s of map.sticky ?? []) {
    const x0 = s.x1 - cam.x;
    const x1 = s.x2 - cam.x;
    if (x1 < -10 || x0 > 660) continue;
    caramel(ctx, x0, x1, s.y - cam.y - 2, 6, time, cam.x, '#ffb3cf', '#ffe0ec');
    for (let k = 0; k < (s.x2 - s.x1) / 40; k++) {
      const x = x0 + 20 + k * 40;
      const h = 3 + Math.abs(Math.sin(time * 1.5 + k)) * 5;
      ctx.strokeStyle = '#ffb3cf';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x - 3, s.y - cam.y - 2);
      ctx.quadraticCurveTo(x, s.y - cam.y - 2 - h, x + 3, s.y - cam.y - 2);
      ctx.stroke();
    }
  }
  // The mine's hot caramel pit, bubbling.
  for (const [a, b] of map.hotFloor ?? []) {
    const x0 = a - cam.x;
    const x1 = b - cam.x;
    if (x1 < -10 || x0 > 660) continue;
    const y = map.groundY - cam.y - 3;
    glow(ctx, (Math.max(-10, x0) + Math.min(660, x1)) / 2, y, 200, '#ffb06a', 0.25);
    caramel(ctx, Math.max(-10, x0), Math.min(660, x1), y, 10, time, cam.x);
    for (let k = 0; k < 8; k++) {
      const u = (time * 0.8 + k * 0.13) % 1;
      const bx = Math.max(-10, x0) + ((k * 97 + Math.floor(time * 0.8 + k * 0.13) * 53) % Math.max(1, Math.min(660, x1) - Math.max(-10, x0)));
      ctx.strokeStyle = '#ffd08a';
      ctx.globalAlpha = 1 - u;
      ctx.beginPath();
      ctx.arc(bx, y - u * 6, 1.5 + u * 2.5, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  // The smith's pools of hot caramel where her sparks landed, cooling as they fade.
  for (const p of room.pools ?? []) {
    const left = p.until - world.now;
    if (left > 9.5) continue;
    const x = p.x - cam.x;
    ctx.globalAlpha = Math.min(1, left / 1.5);
    caramel(ctx, x - p.w / 2, x + p.w / 2, p.y - cam.y - 2, 4, time, cam.x);
    ctx.globalAlpha = 1;
  }
  // The kitchen's cauldron with the recipe chalked on a board above it.
  if (map.cauldron && room.recipe) {
    const x = map.cauldron.x - cam.x;
    const y = map.groundY - cam.y;
    glow(ctx, x, y - 30, 60, '#ff9ad8', 0.3 + 0.1 * Math.sin(time * 3));
    place(ctx, cauldronArt(), x, y);
    for (let k = 0; k < 4; k++) {
      const u = (time * 0.7 + k * 0.25) % 1;
      ctx.fillStyle = '#ffe0ec';
      ctx.globalAlpha = 0.6 * (1 - u);
      ctx.beginPath();
      ctx.arc(x - 16 + k * 10 + Math.sin(u * 5 + k) * 4, y - 40 - u * 30, 4 + u * 6, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    const spoiled = world.now - (room.spoiledAt ?? -9) < 1.2;
    const entries = Object.entries(room.recipe.need);
    const bw = 24 + entries.length * 26;
    ctx.fillStyle = spoiled ? '#6a2a3a' : '#2a3a2e';
    ctx.fillRect(x - bw / 2, y - 112, bw, 30);
    ctx.strokeStyle = '#c99a6b';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - bw / 2, y - 112, bw, 30);
    entries.forEach(([c, n], i) => {
      const cx = x - bw / 2 + 18 + i * 26;
      const have = room.recipe.have[c] ?? 0;
      ctx.fillStyle = CANDY_C[c];
      ctx.beginPath();
      ctx.arc(cx, y - 97, 5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = have === n ? '#9ae66a' : '#ffffff';
      ctx.font = '800 8px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${have}/${n}`, cx + 7, y - 94);
    });
  }
}

export function drawVolcanoFront(ctx, world, cam, time) {
  const room = world.dungeon.room;
  const map = world.map;
  if (map.dungeon !== 'volcano') return;
  // The bellows' blast: streaks of hot air racing out from the smith.
  const w = room.bellows;
  if (w && world.now < w.until) {
    for (let k = 0; k < 16; k++) {
      const u = (time * 1.6 + k * 0.07) % 1;
      const s = k % 2 ? 1 : -1;
      ctx.globalAlpha = 0.5 * (1 - u);
      ctx.fillStyle = '#ffd08a';
      ctx.fillRect(w.x - cam.x + s * (30 + u * 300), map.groundY - cam.y - 10 - ((k * 17) % 70), s * 18, 2);
    }
    ctx.globalAlpha = 1;
  }
}

export function drawVolcanoObject(ctx, o, x, y, time, now) {
  if (o.kind === 'crystal') {
    if (o.done) return true;
    glow(ctx, x, y - 16, 26, '#ff9ad8', 0.35 + 0.1 * Math.sin(time * 3 + o.id));
    place(ctx, crystalArt(false), x, y);
  } else if (o.kind === 'dispenser') {
    const used = now - (o.usedAt ?? -9) < 0.3;
    place(ctx, dispenserArt(o.colour, used), x, y);
    if (used) glow(ctx, x, y - 30, 24, CANDY_C[o.colour], 0.6);
  } else return false;
  return true;
}
export const VOLCANO_HINT = { crystal: '▲ Gather', dispenser: '▲ Add' };
