// The Star Observatory's rooms (world/observatory.js runs them), in the scenery's outlined chibi
// style: the star lamps (and the constellation lines joining the puzzle's five), the eclipse's
// sunlit and shadowed halves, and Folio's bookcases sliding in. (x, y) is the bottom center on the
// floor; `time` (seconds) animates.

import { R, E, T, F, mix } from './pixel.js';
import { art, place } from './scenery.js';

const TAU = Math.PI * 2;

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
function star(cx, cy, r, c) {
  return T(Array.from({ length: 10 }, (_, i) => {
    const rr = i % 2 ? r * 0.45 : r;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  }), c);
}

// A star lamp: a brass stand holding a glass globe with a star inside, dark or shining.
function lampArt(lit) {
  return art(`obs-lamp|${lit}`, 26, 50, () => [
    E(13, 48, 8, 2, '#8a6a3a'), R(11.6, 22, 2.8, 26, '#c8902a'), F(R(11.6, 22, 1, 26, '#ffd36b')),
    E(13, 14, 10, 10, lit ? '#fff6d8' : '#5a5a8a'), F(E(9.6, 10.4, 3, 3, lit ? '#ffffff' : '#7a7aa8')),
    star(13, 14, 6, lit ? '#ffd36b' : '#8a8ab8'), R(8, 22, 10, 3, '#c8902a'),
  ]);
}
function drawLamp(ctx, x, y, lit, time, id, pressedAt, now) {
  if (lit) glow(ctx, x, y - 36, 34 + Math.sin(time * 2 + id) * 4, '#fff3a6', 0.5);
  // A flick of light when it's pressed.
  const since = now - (pressedAt ?? -9);
  if (since < 0.4) glow(ctx, x, y - 36, 50 * since + 10, '#ffffff', 0.6 * (1 - since / 0.4));
  place(ctx, lampArt(lit), x, y);
  if (lit) for (let k = 0; k < 2; k++) {
    const u = (time * 0.5 + k * 0.5 + id * 0.2) % 1;
    ctx.globalAlpha = Math.sin(u * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(x - 6 + k * 12 + Math.sin(u * 6) * 3), Math.round(y - 50 - u * 16), 2, 2);
    ctx.globalAlpha = 1;
  }
}

export function drawObsBack(ctx, world, cam, time) {
  const room = world.dungeon.room;
  const map = world.map;
  if (map.dungeon !== 'observatory') return;
  // The constellation: faint lines joining its lamps, glowing gold where both ends shine.
  const lamps = room.objects.filter((o) => o.kind === 'starlamp');
  for (const [a, b] of map.constellation ?? []) {
    const p = lamps[a];
    const q = lamps[b];
    if (!p || !q) continue;
    const on = p.lit && q.lit;
    ctx.save();
    ctx.strokeStyle = on ? '#fff3a6' : '#8a8ab8';
    ctx.globalAlpha = on ? 0.8 : 0.35;
    ctx.lineWidth = on ? 2 : 1;
    ctx.setLineDash(on ? [] : [4, 4]);
    ctx.lineDashOffset = -time * 10;
    ctx.beginPath();
    ctx.moveTo(p.x - cam.x, p.y - 36 - cam.y);
    ctx.lineTo(q.x - cam.x, q.y - 36 - cam.y);
    ctx.stroke();
    ctx.restore();
  }
  // The eclipse: the sunlit half washed gold, the shadowed half deep blue.
  const e = room.eclipse;
  if (e) {
    const mid = map.width / 2 - cam.x;
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = '#ffd36b';
    if (e.lightLeft) ctx.fillRect(-10, 0, mid + 10, 600);
    else ctx.fillRect(mid, 0, 700, 600);
    ctx.fillStyle = '#1a1a5a';
    ctx.globalAlpha = 0.22;
    if (e.lightLeft) ctx.fillRect(mid, 0, 700, 600);
    else ctx.fillRect(-10, 0, mid + 10, 600);
    ctx.restore();
    ctx.fillStyle = '#fff3a6';
    ctx.fillRect(Math.round(mid) - 1, 0, 2, 600);
  }
}

export function drawObsFront(ctx, world, cam, time) {
  const room = world.dungeon.room;
  const map = world.map;
  if (map.dungeon !== 'observatory' || !room.walls) return;
  // Folio's bookcases sliding in from both ends.
  const gy = map.groundY - cam.y;
  for (const [edge, dir] of [[room.walls.l, -1], [room.walls.r, 1]]) {
    const x = edge - cam.x;
    const x0 = dir < 0 ? -10 : x;
    const w = dir < 0 ? x + 10 : 660 - x;
    ctx.fillStyle = '#5a3a4a';
    ctx.fillRect(x0, -10, w, gy + 20);
    for (let r = 0; r < 8; r++) {
      const sy = gy - 20 - r * 34;
      ctx.fillStyle = '#3a2430';
      ctx.fillRect(x0, sy, w, 4);
      for (let b = 0; b < Math.ceil(w / 8); b++) {
        const h = 16 + ((b * 7 + r * 3) % 9);
        ctx.fillStyle = ['#7a3a5a', '#3a5a8a', '#5a7a4a', '#8a6a3a'][(b + r) % 4];
        ctx.fillRect(x0 + 2 + b * 8, sy - h, 6, h);
      }
    }
    ctx.fillStyle = '#ffd36b';
    ctx.fillRect(Math.round(x) - 1, -10, 3, gy + 20);
  }
}

export function drawObsObject(ctx, o, x, y, time, now) {
  if (o.kind === 'starlamp') drawLamp(ctx, x, y, Boolean(o.lit), time, o.id, o.pressedAt, now);
  else if (o.kind === 'starlamp1') drawLamp(ctx, x, y, Boolean(o.done), time, o.id, null, now);
  else return false;
  return true;
}
export const OBS_HINT = { starlamp: '▲ Light', starlamp1: '▲ Light' };
