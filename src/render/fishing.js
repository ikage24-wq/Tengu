// Fishing and cooking in the world (world/fishing.js): each fishing spot's ripples and little
// sign (an ice hole up on the peak, a pool of stars at Starfall), the rod in your hands with its
// line curving down to the bobber, the bobber bobbing, then dipping with a "!" when a fish bites,
// and the catch leaping out in a sparkle. Plus the "▲ Fish" and "▲ Cook" hints.

import { SPOTS } from '../data/fishing.js';
import { itemIcon } from './icons.js';
import { blit } from './pixel.js';
import { text, box, COLORS } from '../ui/kit.js';
import { spotHere } from '../world/fishing.js';
import { groundAt } from '../world/physics.js';

const TAU = Math.PI * 2;

function hint(ctx, x, y, label) {
  ctx.font = 'bold 8px sans-serif';
  const w = ctx.measureText(label).width + 12;
  box(ctx, x - w / 2, y, w, 12, { fill: '#ffffff', edge: COLORS.accent, r: 6 });
  text(ctx, label, x, y + 9, { size: 8, bold: true, align: 'center', color: COLORS.accent });
}

// Behind everyone: the spots.
export function drawSpots(ctx, world, cam, time) {
  for (const s of SPOTS[world.map.id] ?? []) {
    const x = s.bx - cam.x;
    const y = s.by - cam.y;
    if (x < -60 || x > 700) continue;
    ctx.save();
    if (s.ice) {
      // A round hole cut in the snow, dark blue water in it.
      ctx.fillStyle = '#eef4ff';
      ctx.beginPath();
      ctx.ellipse(x, y + 2, 22, 6, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#4f7ac8';
      ctx.beginPath();
      ctx.ellipse(x, y + 2, 16, 4, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#8fb8ff';
      ctx.fillRect(x - 8, y + 1, 7, 1);
    } else if (s.sky) {
      // A little pool of night sky in the cloud, stars twinkling in it.
      ctx.fillStyle = '#e6e0fa';
      ctx.beginPath();
      ctx.ellipse(x, y + 2, 26, 7, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#2a2266';
      ctx.beginPath();
      ctx.ellipse(x, y + 2, 20, 5, 0, 0, TAU);
      ctx.fill();
      for (let k = 0; k < 5; k++) {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 3 + k * 1.7);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 14 + k * 7, y + ((k * 3) % 4), 1.4, 1.4);
      }
      ctx.globalAlpha = 1;
    }
    // Rings spreading on the water now and then: fish about.
    for (let k = 0; k < 2; k++) {
      const u = (time * 0.45 + k * 0.5) % 1;
      ctx.globalAlpha = (1 - u) * 0.7;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x + (k ? 8 : -6), y, 3 + u * 12, 1 + u * 3, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    // A little wooden sign by where you stand, a fish painted on it.
    const sx = s.x - s.face * 18 - cam.x;
    const sy = s.y - cam.y;
    ctx.fillStyle = '#a07a54';
    ctx.fillRect(sx - 1, sy - 22, 2.4, 22);
    box(ctx, sx - 10, sy - 30, 20, 12, { fill: '#e8c69a', edge: '#a07a54', r: 2, width: 1 });
    ctx.fillStyle = '#5aa8ff';
    ctx.beginPath();
    ctx.ellipse(sx + 1, sy - 24, 5, 2.6, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx - 4, sy - 24);
    ctx.lineTo(sx - 8, sy - 27);
    ctx.lineTo(sx - 8, sy - 21);
    ctx.fill();
  }
}

// In front of the hero: the rod and line while fishing, the bite and the catch, and the hints.
export function drawFishing(ctx, world, cam, time, hx, hy) {
  const f = world.fishing;
  const b = world.body;
  if (!f) {
    if (spotHere(world) && !world.dead) hint(ctx, hx, hy - 70, '▲ Fish');
    const st = world.map.stove;
    if (st != null && Math.abs(st - b.x) < 30 && Math.abs(groundAt(world.map, st) - b.y) < 6) hint(ctx, st - cam.x, groundAt(world.map, st) - cam.y - 78, '▲ Cook');
    return;
  }
  const dir = f.spot.face;
  const hand = [hx + dir * 7, hy - 20];
  const flex = f.phase === 'bite' ? Math.sin(time * 40) * 3 + 4 : 0;
  const tip = [hx + dir * 34, hy - 50 + flex];
  ctx.save();
  // The rod.
  ctx.strokeStyle = '#a07a54';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hand[0], hand[1]);
  ctx.quadraticCurveTo(hand[0] + dir * 14, hand[1] - 20, tip[0], tip[1]);
  ctx.stroke();
  ctx.fillStyle = '#9aa8c6';
  ctx.beginPath();
  ctx.arc(hand[0] + dir * 3, hand[1] - 3, 2, 0, TAU);
  ctx.fill();
  // The bobber: flying out while casting, bobbing while waiting, pulled under at a bite.
  const bx0 = f.spot.bx - cam.x;
  const by0 = f.spot.by - cam.y;
  let bx = bx0;
  let by = by0 - 2 + Math.sin(time * 2.4) * 1;
  if (f.phase === 'cast') {
    const u = Math.min(1, f.t / 0.5);
    bx = tip[0] + (bx0 - tip[0]) * u;
    by = tip[1] + (by0 - tip[1]) * u - Math.sin(u * Math.PI) * 30;
  } else if (f.phase === 'wait' && f.nibbles?.some((n) => Math.abs(f.t - n) < 0.15)) by += 2;
  else if (f.phase === 'bite') by += 4 + Math.sin(time * 30) * 1.5;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(tip[0], tip[1]);
  ctx.quadraticCurveTo((tip[0] + bx) / 2, Math.max(tip[1], by) + (f.phase === 'bite' ? 0 : 14), bx, by - 3);
  ctx.stroke();
  if (f.phase !== 'catch') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bx, by, 3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ff6b8a';
    ctx.beginPath();
    ctx.arc(bx, by, 3, Math.PI, TAU);
    ctx.fill();
  }
  if (f.phase === 'bite') {
    // The splash and a big "!" over your head: now!
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    for (let k = 0; k < 2; k++) {
      ctx.beginPath();
      ctx.ellipse(bx, by0, 6 + k * 6 + (time * 30) % 6, 2 + k * 2, 0, 0, TAU);
      ctx.stroke();
    }
    const pop = 1 + 0.2 * Math.sin(time * 20);
    text(ctx, '!', hx, hy - 68, { size: 18 * pop, bold: true, align: 'center', color: '#ff6b8a', outline: '#ffffff' });
  }
  if (f.phase === 'catch' && world.fishCaught) {
    // The fish leaps out of the water in an arc to you, twinkling.
    const u = Math.min(1, f.t / 0.6);
    const fx = bx0 + (hx - bx0) * u;
    const fy = by0 + (hy - 70 - by0) * u - Math.sin(u * Math.PI) * 40;
    const icon = itemIcon(world.fishCaught.fish.id);
    blit(ctx, icon, fx - 12, fy - 12, { scale: 1.5 });
    for (let k = 0; k < 4; k++) {
      ctx.globalAlpha = 1 - u;
      ctx.fillStyle = k % 2 ? '#ffffff' : '#9fe8ff';
      ctx.fillRect(fx + Math.cos(k * 1.6 + time * 4) * 12, fy + Math.sin(k * 1.6 + time * 4) * 8, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
  if (f.phase === 'wait') text(ctx, 'Wait for the bite... (Z to hook)', hx, hy - 66, { size: 7, bold: true, align: 'center', color: '#ffffff', outline: 'rgba(58,45,79,0.7)' });
  ctx.restore();
}
