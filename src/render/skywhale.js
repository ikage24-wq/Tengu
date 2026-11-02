// The Sky Whale's rooms (world/skywhale.js runs them), in the scenery's outlined chibi style: the
// docks' moorings (a bollard with a coil of rope, lashed tight once tied), the tail-flip warning, the
// market's blowholes (bubbling, then a spout), gust streaks, the lungs' glowing ribs that swell and
// settle with each breath, and the air-blooms that open on the breath out.
// (x, y) is the bottom center on the floor; `time` (seconds) animates.

import { R, E, T, F } from './pixel.js';
import { art, place } from './scenery.js';
import { breathOf } from '../world/skywhale.js';

const TAU = Math.PI * 2;
// The breath right now (set each frame by drawWhaleBack, read by drawWhaleObject).
let breath = null;

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

function mooringArt(tied) {
  return art(`whale-mooring|${tied}`, 30, 30, () => [
    E(15, 29, 11, 1.6, '#3a4a6a'),
    R(9, 12, 12, 17, '#5a6a8a'), F(R(9, 12, 4, 17, '#7a8aaa')), E(15, 12, 8, 3, '#7a8aaa'), F(E(13, 11, 4, 1.4, '#9aaacc')),
    ...(tied
      ? [R(8, 17, 14, 3, '#e8c890'), F(R(8, 17, 14, 1, '#fff0c8')), R(8, 22, 14, 3, '#c8a070')]
      : [E(24, 26, 6, 3, '#e8c890'), F(E(24, 25, 4, 1.6, '#fff0c8')), E(24, 26, 2, 1, '#c8a070')]),
  ]);
}
function bloomArt(open) {
  // An air-bloom: a glass-blue bulb on a stem; open, its petals spread round a glowing heart.
  return art(`whale-bloom|${open}`, 30, 40, () => {
    const out = [R(14, 18, 2, 22, '#5ab88a'), T([[15, 30], [6, 24], [9, 30]], '#5ab88a'), T([[15, 34], [24, 28], [21, 34]], '#5ab88a')];
    if (!open) return [...out, E(15, 14, 6, 8, '#9fd0ff'), F(T([[15, 6], [11, 14], [15, 20]], '#c8e8ff')), F(E(13, 11, 1.4, 2.4, '#ffffff'))];
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU - Math.PI / 2;
      out.push(E(15 + Math.cos(a) * 8, 14 + Math.sin(a) * 7, 4.4, 3.4, k % 2 ? '#9fd0ff' : '#c8e8ff'));
    }
    out.push(E(15, 14, 4, 4, '#fff3a6'), F(E(14, 13, 1.6, 1.4, '#ffffff')));
    return out;
  });
}

export function drawWhaleBack(ctx, world, cam, time) {
  const map = world.map;
  if (map.dungeon !== 'skywhale') return;
  const room = world.dungeon.room;
  breath = breathOf(world);
  // The lungs' ribs: great arches of glowing bone that swell on the breath in and settle on the out.
  if (map.breath) {
    const v = breath?.v ?? 0;
    const swell = 1 - v * 0.06;
    for (let k = 0; k < 7; k++) {
      const wx = k * 260 + 80;
      const x = wx - cam.x * 0.85;
      if (x < -160 || x > 800) continue;
      const cy = map.groundY - cam.y + 10;
      ctx.strokeStyle = '#c8e8f6';
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.ellipse(x, cy, 110 * swell, 250 * swell, 0, Math.PI, TAU);
      ctx.stroke();
      ctx.strokeStyle = '#9fe8ff';
      ctx.globalAlpha = 0.35 + 0.15 * Math.sin(time * 1.5 + k);
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // The air itself moving: motes drifting in toward the middle, or out from it.
    for (let k = 0; k < 24; k++) {
      const u = (time * 0.2 + k / 24) % 1;
      const side = k % 2 ? 1 : -1;
      const out = v > 0 ? u : 1 - u;
      const x = map.width / 2 + side * (60 + out * 700) - cam.x;
      const y = map.groundY - cam.y - 20 - ((k * 37) % 220);
      ctx.fillStyle = '#eaf6ff';
      ctx.globalAlpha = 0.5 * Math.sin(u * Math.PI);
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
  // The blowholes: a ring in the deck that bubbles before it blows, then a tall spout of spray.
  for (const g of room.geysers ?? []) {
    const x = g.x - cam.x;
    if (x < -80 || x > 720) continue;
    const y = map.groundY - cam.y;
    ctx.fillStyle = '#3a5488';
    ctx.beginPath();
    ctx.ellipse(x, y + 1, g.w / 2, 5, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#8aa8d8';
    ctx.lineWidth = 2;
    ctx.stroke();
    const left = g.next - world.now;
    if (left < 1.6) for (let k = 0; k < 5; k++) {
      const u = (time * 2 + k * 0.2) % 1;
      ctx.strokeStyle = '#eaf6ff';
      ctx.globalAlpha = 1 - u;
      ctx.beginPath();
      ctx.arc(x - g.w / 3 + ((k * 13) % g.w) * 0.66, y - u * 10, 2 + u * 2, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const since = world.now - g.at;
    if (since < 1.4) {
      const h = Math.sin(Math.min(1, since / 1.4) * Math.PI) * (g.up + 40);
      glow(ctx, x, y - h / 2, g.w, '#eaf6ff', 0.4);
      ctx.fillStyle = '#eaf6ff';
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(x - g.w / 2 + 6, y);
      ctx.quadraticCurveTo(x - g.w / 3, y - h * 0.6, x - 8, y - h);
      ctx.quadraticCurveTo(x, y - h - 14, x + 8, y - h);
      ctx.quadraticCurveTo(x + g.w / 3, y - h * 0.6, x + g.w / 2 - 6, y);
      ctx.fill();
      ctx.globalAlpha = 1;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI + Math.PI;
        const r = 10 + since * 40;
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 1 - since / 1.4;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * r, y - h + Math.sin(a) * r * 0.6, 3, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }
}

export function drawWhaleFront(ctx, world, cam, time) {
  const map = world.map;
  if (map.dungeon !== 'skywhale') return;
  const room = world.dungeon.room;
  // A gust: long streaks of wind racing across the screen the way it blows.
  const gu = room.gust;
  if (gu && world.now < gu.until) {
    const k = Math.min(1, (gu.until - world.now) / 0.5, (world.now - (gu.until - (map.gusts?.dur ?? 2.2))) / 0.4);
    for (let i = 0; i < 18; i++) {
      const u = (time * 1.4 + i * 0.137) % 1;
      const x = gu.dir > 0 ? -60 + u * 760 : 700 - u * 760;
      const y = 30 + ((i * 53) % 300);
      ctx.globalAlpha = 0.5 * k * Math.sin(u * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, gu.dir * 40, 2);
    }
    ctx.globalAlpha = 1;
  }
  // The tail flipping: arrows along the floor pointing the way it will tip, then the slide.
  const fl = room.flip;
  if (fl && (fl.warned || world.now < fl.until)) {
    const y = map.groundY - cam.y - 6;
    for (let i = 0; i < 6; i++) {
      const x = 60 + i * 110 + ((time * 120 * fl.dir) % 110);
      ctx.fillStyle = '#ffd36b';
      ctx.globalAlpha = 0.5 + 0.4 * Math.sin(time * 10);
      ctx.beginPath();
      ctx.moveTo(x + fl.dir * 12, y);
      ctx.lineTo(x - fl.dir * 6, y - 8);
      ctx.lineTo(x - fl.dir * 6, y + 8);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

export function drawWhaleObject(ctx, o, x, y, time, now) {
  if (o.kind === 'mooring') {
    place(ctx, mooringArt(o.done), x, y);
    if (!o.done) glow(ctx, x, y - 14, 20, '#ffd36b', 0.3 + 0.1 * Math.sin(time * 3 + o.id));
  } else if (o.kind === 'airbloom') {
    const open = o.done || breath?.out;
    if (open) glow(ctx, x, y - 26, 26, '#9fe8ff', o.done ? 0.35 : 0.55 + 0.1 * Math.sin(time * 3));
    place(ctx, bloomArt(Boolean(open)), x, y);
  } else return false;
  return true;
}
export const WHALE_HINT = { mooring: '▲ Tie', airbloom: '▲ Tend' };
