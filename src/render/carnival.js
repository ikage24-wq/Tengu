// The Clockwork Carnival's rooms (world/carnival.js runs them), in the scenery's outlined chibi style:
// the Midway's music boxes to wind, the Funhouse's prize balloons, the coaster car and its rail
// lights, the workshop's conveyor belts, gear saws, the Big Top's trapezes, and Madame Marionette's
// strings on the player she has marked. (x, y) is the bottom center on the floor; `time` (seconds)
// animates.

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

// ---------- Music boxes ----------

function windboxArt(wound, open) {
  return art(`fair-windbox|${wound}|${open}`, 34, 34, () => {
    const c = wound ? '#9a7ad8' : '#8a84a8';
    const out = [R(3, 16, 28, 16, c), F(R(3, 16, 28, 3, mix(c, '#ffffff', 0.3))), R(3, 30, 28, 2, '#ffd36b'), R(3, 19, 28, 1, '#ffd36b')];
    // The lid, open with a tiny dancer turning on top once it's wound.
    if (open) out.push(T([[4, 16], [30, 16], [27, 4], [7, 6]], mix(c, '#ffffff', 0.2)), F(T([[9, 14], [25, 14], [23, 7], [11, 8]], '#dff6ff')));
    else out.push(R(2, 12, 30, 5, mix(c, '#ffffff', 0.2)));
    for (const x of [10, 17, 24]) out.push(F(E(x, 25, 1.4, 1.4, '#ffd36b')));
    return out;
  });
}
function drawWindbox(ctx, x, y, wound, time, id) {
  if (wound) glow(ctx, x, y - 18, 30, '#ffe2a0', 0.4 + 0.1 * Math.sin(time * 3 + id));
  place(ctx, windboxArt(wound, wound), x, y);
  // Its crank: still while unwound, turning once wound; notes float up from a wound box.
  const a = wound ? time * 4 : 0.6;
  ctx.strokeStyle = '#c8902a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + 15, y - 9);
  ctx.lineTo(x + 19, y - 9);
  ctx.lineTo(x + 19 + Math.cos(a) * 3, y - 9 + Math.sin(a) * 3);
  ctx.stroke();
  if (wound) {
    for (let k = 0; k < 2; k++) {
      const u = (time * 0.6 + k * 0.5 + id * 0.3) % 1;
      ctx.globalAlpha = Math.sin(u * Math.PI);
      ctx.fillStyle = k ? '#ff7aa8' : '#7fd8ff';
      const nx = x - 4 + k * 8 + Math.sin(u * 6) * 3;
      const ny = y - 34 - u * 18;
      ctx.beginPath();
      ctx.ellipse(nx, ny, 2, 1.5, -0.3, 0, TAU);
      ctx.fill();
      ctx.fillRect(nx + 1.4, ny - 6, 1, 6);
      ctx.globalAlpha = 1;
    }
  }
}

// ---------- Prize balloons ----------

function prizeArt(c) {
  return art(`fair-prize|${c}`, 24, 40, () => [
    E(12, 12, 10, 11.5, c), F(E(8.6, 7.4, 3, 3.6, mix(c, '#ffffff', 0.55))), T([[10.6, 23], [13.4, 23], [12, 26]], c),
    F(T([[12, 6], [13.4, 10], [17.6, 10.2], [14.2, 12.6], [15.4, 16.8], [12, 14.4], [8.6, 16.8], [9.8, 12.6], [6.4, 10.2], [10.6, 10]], '#ffffff')),
  ]);
}
function drawPrize(ctx, x, y, o, time, now) {
  if (o.done) {
    // Popped: a burst of confetti for a moment.
    const since = now - (o.poppedAt ?? now);
    if (since < 0.8) for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU;
      ctx.fillStyle = ['#ff7aa8', '#ffd36b', '#7fd8ff'][k % 3];
      ctx.globalAlpha = 1 - since / 0.8;
      ctx.fillRect(x + Math.cos(a) * since * 50, y - 40 + Math.sin(a) * since * 50 + since * since * 30, 3, 2);
    }
    ctx.globalAlpha = 1;
    return;
  }
  const c = ['#ff7aa8', '#ffd36b', '#7fd8ff', '#9ae6a8', '#c9a6ff'][o.id % 5];
  const bob = Math.sin(time * 1.6 + o.id) * 3;
  // Tied down by a ribbon to a little weight, bobbing in a breeze.
  ctx.strokeStyle = '#f2ecff';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x, y - 2);
  ctx.quadraticCurveTo(x + Math.sin(time * 2 + o.id) * 4, y - 12, x + Math.sin(time * 1.6 + o.id) * 2, y - 16 + bob);
  ctx.stroke();
  ctx.fillStyle = '#c8902a';
  ctx.fillRect(x - 2, y - 3, 4, 3);
  place(ctx, prizeArt(c), x + Math.sin(time * 1.6 + o.id) * 2, y - 16 + bob);
}

// ---------- The coaster, saws, belts, trapezes ----------

function coasterArt() {
  return art('fair-coaster', 100, 46, () => [
    T([[4, 38], [96, 38], [92, 12], [72, 6], [8, 8]], '#ff7aa8'), F(T([[8, 12], [90, 14], [88, 20], [8, 18]], '#ffd0e0')),
    R(0, 36, 100, 4, '#ffd36b'), E(18, 40, 6, 6, '#3a3466'), E(50, 40, 6, 6, '#3a3466'), E(82, 40, 6, 6, '#3a3466'),
    F(E(18, 40, 2, 2, '#c8c4e2')), F(E(50, 40, 2, 2, '#c8c4e2')), F(E(82, 40, 2, 2, '#c8c4e2')),
    E(92, 18, 4, 4, '#fff2b0'), F(E(91, 17, 1.4, 1.4, '#ffffff')),
    ...[20, 40, 60].map((x) => F(E(x, 10, 5, 4, '#7fd8ff'))),
  ]);
}
function sawArt(f) {
  return art(`fair-saw|${f}`, 40, 40, () => {
    const pts = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TAU + (f / 4) * (TAU / 12);
      const r = i % 2 ? 19 : 15;
      pts.push([20 + Math.cos(a) * r, 20 + Math.sin(a) * r]);
    }
    return [T(pts, '#d8e2f6'), E(20, 20, 8, 8, '#ffd36b'), F(E(20, 20, 3, 3, '#c8902a'))];
  });
}

export function drawCarnivalBack(ctx, world, cam, time) {
  const room = world.dungeon.room;
  const map = world.map;
  if (map.dungeon !== 'carnival') return;
  const gy = map.groundY - cam.y;
  // The trapezes swinging high over the ring.
  for (const tx of map.trapezes ?? []) {
    const x = tx - cam.x;
    const sw = Math.sin(time * 1.2 + tx) * 0.25;
    ctx.strokeStyle = '#f2ecff';
    ctx.lineWidth = 1;
    const bx = x + Math.sin(sw) * 60;
    const by = 20 + Math.cos(sw) * 60;
    ctx.beginPath();
    ctx.moveTo(x - 12, 20);
    ctx.lineTo(bx - 12, by);
    ctx.moveTo(x + 12, 20);
    ctx.lineTo(bx + 12, by);
    ctx.stroke();
    ctx.fillStyle = '#ffd36b';
    ctx.fillRect(bx - 14, by - 1.5, 28, 3);
  }
  // The coaster's rail along the ground: its lights chase while the coaster comes.
  const c = room.coaster;
  if (c) {
    const warn = c.state === 'warning' || c.state === 'running';
    ctx.fillStyle = '#c8b4e6';
    ctx.fillRect(0, gy - 3, 640, 2);
    for (let k = 0; k < 24; k++) {
      const wx = ((k * 40 - cam.x) % 960 + 960) % 960 - 160;
      const on = warn && (Math.floor(time * 12) + k * (c.dir > 0 ? -1 : 1)) % 3 === 0;
      ctx.fillStyle = on ? '#ff4d6d' : '#8a7aa8';
      ctx.beginPath();
      ctx.arc(wx, gy - 2, on ? 2.4 : 1.6, 0, TAU);
      ctx.fill();
      if (on) glow(ctx, wx, gy - 2, 10, '#ff8a8a', 0.5);
    }
  }
  // Conveyor belts: stripes rolling along the floor they run on.
  for (const cv of map.conveyors ?? []) {
    const y = cv.y - cam.y;
    const x1 = cv.x1 - cam.x;
    const x2 = cv.x2 - cam.x;
    ctx.fillStyle = '#4a3a5a';
    ctx.fillRect(Math.max(-10, x1), y - 4, Math.min(660, x2) - Math.max(-10, x1), 4);
    ctx.fillStyle = '#ffd36b';
    const off = ((time * 55 * cv.dir) % 16 + 16) % 16;
    for (let x = Math.floor((Math.max(-10, x1) - off) / 16) * 16 + off; x < Math.min(660, x2); x += 16) if (x > x1) ctx.fillRect(x, y - 3.4, 6, 1.6);
  }
}

export function drawCarnivalFront(ctx, world, cam, time) {
  const room = world.dungeon.room;
  const map = world.map;
  if (map.dungeon !== 'carnival') return;
  const gy = map.groundY - cam.y;
  const c = room.coaster;
  if (c?.state === 'running') {
    const x = c.x - cam.x;
    ctx.save();
    if (c.dir < 0) {
      ctx.translate(x, 0);
      ctx.scale(-1, 1);
      ctx.translate(-x, 0);
    }
    place(ctx, coasterArt(), x, gy + 2);
    ctx.restore();
    for (let k = 0; k < 3; k++) {
      ctx.globalAlpha = 0.4 - k * 0.12;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - c.dir * (60 + k * 14), gy - 30 + k * 8, -c.dir * 24, 2);
    }
    ctx.globalAlpha = 1;
  }
  for (const s of room.saws ?? []) {
    const x = s.x - cam.x;
    place(ctx, sawArt(Math.floor(time * 20) % 4), x, gy + 1);
    ctx.fillStyle = '#ffd36b';
    for (let k = 0; k < 3; k++) ctx.fillRect(x - s.dir * (10 + k * 7), gy - 2 - k, 2, 2);
  }
  // Madame Marionette's strings on the marked player, tightening as the yank comes.
  const y = room.yank;
  const m = world.mobs.find((o) => o.def.mech === 'marionetta' && o.hp > 0);
  if (y && m) {
    const g = (world.dungeon && [{ id: 'you', body: world.body }, ...(world.bots?.list ?? []).filter((b) => b.body).map((b) => ({ id: b.id, body: b.body }))]).find((o) => o.id === y.id);
    if (g) {
      const k = Math.max(0, Math.min(1, 1 - (y.at - world.now) / 2.6));
      ctx.strokeStyle = '#f2ecff';
      ctx.globalAlpha = 0.5 + 0.5 * k;
      ctx.lineWidth = 0.8 + k;
      for (let s = -1; s <= 1; s++) {
        ctx.beginPath();
        ctx.moveTo(m.x - cam.x, m.y - m.def.h * 0.7 - cam.y);
        ctx.quadraticCurveTo((m.x + g.body.x) / 2 - cam.x, Math.min(m.y, g.body.y) - 80 * (1 - k) - cam.y, g.body.x - cam.x + s * 4, g.body.y - 30 - cam.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }
}

export function drawCarnivalObject(ctx, o, x, y, time, now) {
  if (o.kind === 'windbox') drawWindbox(ctx, x, y, o.done, time, o.id);
  else if (o.kind === 'prize') {
    if (o.done && o.poppedAt == null) o.poppedAt = now;
    drawPrize(ctx, x, y, o, time, now);
  } else return false;
  return true;
}
export const CARNIVAL_HINT = { windbox: '▲ Wind', prize: '▲ Pop' };
