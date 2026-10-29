// The queens' moves on screen (world/story.js): each warning drawn on the ground (or as a column
// of light) in the queen's own colour, filling up as it counts down and pulsing faster near the
// end, then her effect bursting where it lands; and the move's name called out under her health
// bar. The bursts are Tengu's own effect art (fxSprite); the warnings are simple marks, like a
// dungeon boss's.

import { fxSprite } from './fx-sprites.js';
import { text } from '../ui/kit.js';

const TAU = Math.PI * 2;

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

// Behind everyone: the warnings counting down.
export function drawZonesBack(ctx, world, cam, time) {
  for (const z of world.zones ?? []) {
    if (z.hit) continue;
    const p = Math.min(1, z.t / z.warn);
    const pulse = 0.5 + 0.5 * Math.sin(time * (8 + p * 14));
    const y = z.y - cam.y;
    ctx.save();
    if (z.kind === 'pillar') {
      const x = z.x - cam.x;
      const g = ctx.createLinearGradient(0, 0, 0, y);
      g.addColorStop(0, rgba(z.light, 0));
      g.addColorStop(1, rgba(z.color, 0.18 + 0.22 * p));
      ctx.fillStyle = g;
      ctx.fillRect(x - z.w / 2, 0, z.w, y);
      ctx.fillStyle = rgba(z.light, 0.35 + 0.35 * p * pulse);
      ctx.fillRect(x - (z.w / 2) * p, 0, z.w * p, y);
      ctx.strokeStyle = rgba(z.color, 0.6 + 0.4 * pulse);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - z.w / 2, -2, z.w, y + 2);
      ground(ctx, x, y, z.w, p, pulse, z);
    } else if (z.kind === 'circle') {
      ground(ctx, z.x - cam.x, y, z.w, p, pulse, z);
    } else {
      const x0 = z.kind === 'floor' ? 0 : z.x - cam.x;
      const w = z.kind === 'floor' ? 640 : z.w;
      ctx.fillStyle = rgba(z.color, 0.14 + 0.2 * p);
      ctx.fillRect(x0, y - (z.kind === 'floor' ? 10 : 30), w, z.kind === 'floor' ? 14 : 34);
      ctx.fillStyle = rgba(z.light, 0.25 + 0.4 * p * pulse);
      ctx.fillRect(x0, y - 3, w, 5);
      // Little marks running along it, all pointing the same way, so it reads as one move.
      ctx.fillStyle = rgba(z.color, 0.55 + 0.45 * pulse);
      for (let sx = x0 + ((time * 40) % 24); sx < x0 + w; sx += 24) {
        ctx.beginPath();
        ctx.moveTo(sx, y - 8);
        ctx.lineTo(sx + 6, y - 4);
        ctx.lineTo(sx, y);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

// A warning patch on the ground: an outline, and a fill growing to the edge as it counts down.
function ground(ctx, x, y, w, p, pulse, z) {
  ctx.fillStyle = rgba(z.color, 0.16);
  ctx.beginPath();
  ctx.ellipse(x, y, w / 2, 7, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(z.light, 0.3 + 0.35 * pulse);
  ctx.beginPath();
  ctx.ellipse(x, y, (w / 2) * p, 7 * p, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgba(z.color, 0.7 + 0.3 * pulse);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x, y, w / 2, 7, 0, 0, TAU);
  ctx.stroke();
}

// On top: each move bursting where it lands, and the queens' own flourishes (a puff of smoke).
export function drawZonesFront(ctx, world, cam, time) {
  for (const z of world.zones ?? []) {
    if (!z.hit || !z.fx) continue;
    const p = Math.min(1, z.after / 0.6);
    const y = z.y - cam.y;
    if (z.kind === 'floor') {
      for (let x = 40; x < 640; x += 120) fxSprite(ctx, z.fx, x + ((cam.x * 0) % 120), y, { p, scale: 0.9 });
    } else if (z.kind === 'lane') {
      for (let x = z.x + 40; x < z.x + z.w; x += 90) fxSprite(ctx, z.fx, x - cam.x, y - 14, { p, scale: 0.8 });
    } else if (z.kind === 'pillar') {
      fxSprite(ctx, z.fx, z.x - cam.x, y, { p, scale: 1 });
    } else {
      fxSprite(ctx, z.fx, z.x - cam.x, y - 10, { p, scale: 0.9 });
    }
  }
  for (const f of world.fx) {
    if (f.kind !== 'trialfx') continue;
    fxSprite(ctx, f.name, f.x - cam.x, f.y - cam.y, { p: f.t / f.dur });
  }
}

// The move's name under the boss bar, in the queen's colour, for a couple of seconds.
export function drawCallout(ctx, world) {
  const c = world.callout;
  if (!c) return;
  const age = world.now - c.at;
  if (age > 2.4) {
    world.callout = null;
    return;
  }
  const a = age < 0.15 ? age / 0.15 : age > 1.9 ? (2.4 - age) / 0.5 : 1;
  const pop = age < 0.15 ? 1.3 - (age / 0.15) * 0.3 : 1;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(320, 92);
  ctx.scale(pop, pop);
  text(ctx, c.title, 0, 0, { size: 14, bold: true, align: 'center', color: '#ffffff', outline: c.color });
  if (c.sub) text(ctx, c.sub, 0, 13, { size: 8, bold: true, align: 'center', color: '#ffffff', outline: 'rgba(58,45,79,0.8)' });
  ctx.restore();
}
