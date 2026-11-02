// The Dream Theatre's rooms (world/theatre.js runs them), in the scenery's outlined chibi style:
// the velvet valance framing every room, the lobby's sweeping spotlights and lost tickets, the
// pirate act's painted wave rollers rocking with the deck, the forest act's cue lamps (lit in turn
// while the sequence plays), and footlights along the stage in the boss rooms.
// (x, y) is the bottom center on the floor; `time` (seconds) animates.

import { R, E, T, F } from './pixel.js';
import { art, place } from './scenery.js';
import { cueShowing } from '../world/theatre.js';

const TAU = Math.PI * 2;
export const CUE_C = { rose: '#ff7aa8', gold: '#ffd36b', mint: '#8ff0c8', violet: '#b89aff' };
const BOSS_ROOMS = new Set(['theatre4', 'theatre5', 'theatre6']);
// The cue lamp lit right now (set each frame by drawTheatreBack, read by drawTheatreObject).
let lit = null;
let litAt = 0;

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

function ticketArt() {
  return art('theatre-ticket', 26, 18, () => [
    T([[2, 4], [24, 2], [25, 14], [3, 16]], '#ffd36b'), F(T([[2, 4], [24, 2], [24, 5], [2, 7]], '#fff0b0')),
    F(E(3, 10, 2, 2, '#c99a3b')), F(E(24.5, 8, 2, 2, '#c99a3b')),
    F(R(8, 8, 10, 1.4, '#9a2040')), F(R(9, 11, 7, 1, '#c99a3b')),
  ]);
}
function lampArt(colour, on) {
  return art(`theatre-cue|${colour}|${on}`, 26, 50, () => {
    const c = CUE_C[colour];
    return [
      E(13, 49, 9, 1.6, '#3a2a3a'), R(11, 22, 4, 26, '#5a4a5a'), F(R(11, 22, 1.4, 26, '#8a7a8a')), R(6, 44, 14, 4, '#3a2e3e'),
      // A brass stage lamp with a coloured gel on its face.
      T([[3, 10], [21, 6], [23, 20], [5, 22]], '#c99a3b'), F(T([[3, 10], [21, 6], [21, 9], [3, 13]], '#ffe08a')),
      E(13, 14, 7, 6, on ? '#ffffff' : c), F(E(13, 14, 5, 4, on ? c : '#4a3a4a')), F(E(11, 12, 1.6, 1.4, '#ffffff')),
    ];
  });
}

// One soft beam from the rigging down onto the floor at x (screen).
function beam(ctx, x, top, floor, w, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createLinearGradient(0, top, 0, floor);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(1, color);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - 8, top);
  ctx.lineTo(x + 8, top);
  ctx.lineTo(x + w / 2, floor);
  ctx.lineTo(x - w / 2, floor);
  ctx.fill();
  ctx.globalAlpha = alpha * 1.6;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, floor, w / 2, w * 0.1, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawTheatreBack(ctx, world, cam, time) {
  const map = world.map;
  if (map.dungeon !== 'theatre') return;
  const room = world.dungeon.room;
  lit = cueShowing(room, world.now);
  // The lobby's spotlights sweep the floor (a monster caught in one takes more).
  for (const s of room.spots ?? []) {
    const x = s.x - cam.x;
    if (x < -60 || x > 700) continue;
    beam(ctx, x, -cam.y + map.groundY - 380, map.groundY - cam.y, 80, '#fff2c0', 0.32);
  }
  // The pirate act: painted wave rollers along the front of the stage, turning with the roll.
  if (map.rocking) {
    const roll = room.rock?.roll ?? 0;
    for (let row = 0; row < 2; row++) {
      ctx.fillStyle = row ? '#4a8ad8' : '#6ab0f0';
      ctx.strokeStyle = '#2a4a8a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const y0 = map.groundY - cam.y - 4 + row * 6;
      ctx.moveTo(-10, y0 + 14);
      for (let x = -10; x <= 670; x += 6) ctx.lineTo(x, y0 - 6 - Math.sin((x + cam.x) * 0.035 + time * (2 + row) + roll * 2 * (row ? -1 : 1)) * 5);
      ctx.lineTo(670, y0 + 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    // A mast and a painted sail over every mast ledge, leaning with the roll; a lantern swinging under it.
    for (const p of map.platforms ?? []) {
      if (!p.mast) continue;
      const x = p.x + p.w / 2 - cam.x;
      const y = p.y - cam.y + 4;
      const a = roll * 0.5;
      const lean = roll * 0.05;
      ctx.save();
      ctx.translate(x, y - 4);
      ctx.rotate(lean);
      ctx.fillStyle = '#8a5a3a';
      ctx.fillRect(-2.5, -96, 5, 96);
      ctx.fillStyle = '#c88a5a';
      ctx.fillRect(-1, -96, 1.5, 96);
      const belly = 6 + roll * 4;
      ctx.fillStyle = '#fff6ee';
      ctx.strokeStyle = '#c8a8b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-30, -88);
      ctx.quadraticCurveTo(-30 + belly, -60, -30, -34);
      ctx.lineTo(30, -34);
      ctx.quadraticCurveTo(30 + belly, -60, 30, -88);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ff7aa8';
      ctx.beginPath();
      ctx.arc(-4 + belly * 0.3, -64, 5, Math.PI, 0);
      ctx.arc(4 + belly * 0.3, -64, 5, Math.PI, 0);
      ctx.lineTo(belly * 0.3, -54);
      ctx.fill();
      ctx.fillStyle = '#ff7aa8';
      ctx.beginPath();
      ctx.moveTo(2, -96);
      ctx.lineTo(18 + Math.sin(time * 4) * 3, -92);
      ctx.lineTo(2, -88);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#5a3a2a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.sin(a) * 18, y + Math.cos(a) * 18);
      ctx.stroke();
      glow(ctx, x + Math.sin(a) * 18, y + Math.cos(a) * 22, 14, '#ffd36b', 0.6);
      ctx.fillStyle = '#ffd36b';
      ctx.fillRect(x + Math.sin(a) * 18 - 3, y + Math.cos(a) * 18, 6, 7);
    }
  }
  // The cue lamps' sequence, flashed one by one; a wrong cue flushes them all rose for a beat.
  if (room.cues && lit != null) litAt = world.now;
}

export function drawTheatreFront(ctx, world, cam, time) {
  const map = world.map;
  if (map.dungeon !== 'theatre') return;
  const room = world.dungeon.room;
  // Footlights along the stage edge in the boss rooms, each with a soft breathing glow.
  if (BOSS_ROOMS.has(map.id)) {
    const y = map.groundY - cam.y + 6;
    for (let x = 30 - (cam.x % 60); x < 660; x += 60) {
      glow(ctx, x, y - 4, 22, '#ffe8a0', 0.3 + 0.08 * Math.sin(time * 2 + (x + cam.x) * 0.05));
      ctx.fillStyle = '#c99a3b';
      ctx.fillRect(x - 6, y - 3, 12, 5);
      ctx.fillStyle = '#fff6d0';
      ctx.fillRect(x - 4, y - 4, 8, 2);
    }
  }
  // A wrong cue: the stage flushes rose for a moment.
  if (room.cues?.wrongAt != null && world.now - room.cues.wrongAt < 0.6) {
    ctx.fillStyle = '#ff7aa8';
    ctx.globalAlpha = 0.25 * (1 - (world.now - room.cues.wrongAt) / 0.6);
    ctx.fillRect(0, 0, 640, 420);
    ctx.globalAlpha = 1;
  }
  // The velvet valance framing every room: swags with gold fringe, swaying a little.
  for (let k = -1; k < 8; k++) {
    const x = k * 96 - (cam.x * 0.2) % 96;
    const sag = 18 + Math.sin(time * 0.8 + k) * 1.5;
    ctx.fillStyle = '#9a2040';
    ctx.strokeStyle = '#5a1028';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, -2);
    ctx.quadraticCurveTo(x + 48, sag * 2, x + 96, -2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#ffd36b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 4, 2);
    ctx.quadraticCurveTo(x + 48, sag * 2 - 2, x + 92, 2);
    ctx.stroke();
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath();
    ctx.arc(x, 3, 3, 0, TAU);
    ctx.fill();
  }
}

export function drawTheatreObject(ctx, o, x, y, time, now) {
  if (o.kind === 'ticket') {
    if (o.done) return true;
    const bob = Math.sin(time * 2.4 + o.id) * 3;
    glow(ctx, x, y - 18 + bob, 22, '#ffd36b', 0.4 + 0.1 * Math.sin(time * 3 + o.id));
    ctx.save();
    ctx.translate(x, y - 10 + bob);
    ctx.rotate(Math.sin(time * 1.7 + o.id) * 0.25);
    place(ctx, ticketArt(), 0, 0);
    ctx.restore();
  } else if (o.kind === 'cue') {
    const on = lit === o.id || now - (o.pressedAt ?? -9) < 0.35 || o.done;
    if (on) glow(ctx, x, y - 36, 40, CUE_C[o.colour], o.done ? 0.35 + 0.1 * Math.sin(time * 2 + o.id) : 0.8);
    place(ctx, lampArt(o.colour, on), x, y);
    if (lit === o.id) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = CUE_C[o.colour];
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 36);
      ctx.lineTo(x + 6, y - 36);
      ctx.lineTo(x + 30, y);
      ctx.lineTo(x - 30, y);
      ctx.fill();
      ctx.restore();
    }
  } else return false;
  return true;
}
export const THEATRE_HINT = { ticket: '▲ Pick up', cue: '▲ Cue' };
