// The two-person boss mechanics on screen (world/coopboss.js) and a defend quest's calm stone
// (world/partyquest.js), in the game's soft pastel shapes: a gold share-ring on the floor with a
// pip for each player standing in it, a seal stone with its rune circle and a ribbon of light to the
// boss while it's held, a guard shell round the boss whose two halves light as they're struck, and
// a tether between the twins. Everything eases in and out on time; nothing pops.

import { shock, starFlash, puff } from './fxkit.js';
import { coopBosses, inRing, membersHere } from '../world/coopboss.js';

const TAU = Math.PI * 2;
const GOLD = { core: '#fff6d0', light: '#ffe58a', main: '#ffc94f', dark: '#e0a52f', ink: '#9a6a12' };
const SEAL = { core: '#f2fff8', light: '#c8f5dc', main: '#7fd1a0', dark: '#4fae7e', ink: '#2a7f5c' };
const GUARD = { light: '#e8dcff', main: '#b48cff', dark: '#9068e0', ink: '#6a48ad' };
const TETHER = { main: '#ff9ec8', dark: '#e0659f', hot: '#ff5f80' };
const smooth = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));

function softGlow(ctx, x, y, r, color, a) {
  if (a <= 0.01) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

// A little curvy four-point sparkle star.
function twinkle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

// ---------- On the floor, under everyone ----------

export function drawCoopBack(ctx, world, cam, time) {
  for (const m of coopBosses(world)) {
    for (const s of m.coop.mechs) {
      if (s.def.kind === 'split' && s.ring) drawRing(ctx, world, s.ring, cam, time);
      if (s.def.kind === 'seal' && s.x != null) drawSealStone(ctx, s, cam, time, world);
    }
  }
  const d = world.pqDefend;
  if (d?.spot && world.map.id === world.char.partyQuest?.map) drawCalmStone(ctx, d, cam, time);
}

function drawRing(ctx, world, r, cam, time) {
  const p = Math.min(1, r.t / r.warn);
  const x = r.x - cam.x;
  const y = r.y - cam.y;
  const rx = r.w / 2;
  const ry = 8;
  const born = smooth(r.t / 0.35);
  const hot = p > 0.8 && Math.floor(time * 10) % 2 === 0;
  ctx.save();
  softGlow(ctx, x, y - 4, rx * 1.2, GOLD.light, 0.35 * born);
  // The fill gathering toward the middle as it nears.
  ctx.globalAlpha = (0.18 + p * 0.22) * born;
  ctx.fillStyle = GOLD.main;
  ctx.beginPath();
  ctx.ellipse(x, y, rx * born, ry * born, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = (0.3 + 0.4 * p) * born;
  ctx.fillStyle = GOLD.light;
  ctx.beginPath();
  ctx.ellipse(x, y, rx * (1 - p) * born + 2, ry * (1 - p) * born + 0.5, 0, 0, TAU);
  ctx.fill();
  // The rim: ink, gold, a white core line, slowly turning dashes on top.
  ctx.globalAlpha = born;
  shock(ctx, x, y, rx * born, ry * born, 2.4, hot ? '#fff1a8' : GOLD.main);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.9;
  ctx.setLineDash([5, 4]);
  ctx.lineDashOffset = -time * 14;
  ctx.beginPath();
  ctx.ellipse(x, y, rx * born, ry * born, 0, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  // Sparkles drifting up out of it.
  for (let k = 0; k < 5; k++) {
    const u = (time * 0.7 + k / 5) % 1;
    ctx.globalAlpha = Math.sin(u * Math.PI) * born;
    twinkle(ctx, x + (k - 2) * rx * 0.38, y - 4 - u * (14 + p * 10), 1.4 + p, k % 2 ? GOLD.core : GOLD.light);
  }
  // A pip over the ring for each player standing in it, so you see it filling up.
  const n = membersHere(world).filter((g) => inRing(r, g.body)).length;
  const pipY = y - 30 - Math.sin(time * 4) * 1.5;
  for (let i = 0; i < Math.max(1, n); i++) {
    const px = x + (i - (Math.max(1, n) - 1) / 2) * 9;
    ctx.globalAlpha = born * (n ? 1 : 0.45);
    starFlash(ctx, px, pipY, n ? 4.4 : 3.4, 4, time * 1.5 + i, n ? GOLD.main : '#d8cbe8', '#ffffff', 1.3);
  }
  ctx.restore();
}

function drawSealStone(ctx, s, cam, time, world) {
  const x = s.x - cam.x;
  const y = s.y - cam.y;
  const held = Boolean(s.heldBy);
  const k = (s.glow = (s.glow ?? 0) + ((held ? 1 : 0) - (s.glow ?? 0)) * 0.12);
  ctx.save();
  softGlow(ctx, x, y - 8, 34 + 10 * k, SEAL.light, 0.3 + 0.35 * k);
  // The rune circle on the floor, turning.
  ctx.globalAlpha = 0.55 + 0.35 * k;
  shock(ctx, x, y, 24, 6.5, 1.8, SEAL.main);
  ctx.strokeStyle = SEAL.core;
  ctx.lineWidth = 0.8;
  ctx.setLineDash([3, 3]);
  ctx.lineDashOffset = time * (6 + 18 * k);
  ctx.beginPath();
  ctx.ellipse(x, y, 18, 4.6, 0, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  // The stone: a rounded tablet with a leaf rune.
  ctx.globalAlpha = 1;
  const lift = Math.sin(time * 2) * 0.8;
  const top = y - 22 + lift;
  ctx.fillStyle = SEAL.ink;
  ctx.beginPath();
  ctx.roundRect(x - 9, top - 1, 18, 23, 7);
  ctx.fill();
  ctx.fillStyle = SEAL.dark;
  ctx.beginPath();
  ctx.roundRect(x - 8, top, 16, 21, 6);
  ctx.fill();
  ctx.fillStyle = SEAL.main;
  ctx.beginPath();
  ctx.roundRect(x - 8, top, 14, 19, 6);
  ctx.fill();
  ctx.fillStyle = k > 0.5 ? SEAL.core : SEAL.light;
  ctx.beginPath();
  ctx.ellipse(x - 1, top + 9, 3.2, 5.2, 0.5, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = SEAL.dark;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x - 3, top + 13);
  ctx.lineTo(x + 1, top + 5);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 6, top + 3, 1.2, 3);
  if (!held) {
    // Nobody on it: a little arrow bobbing over it, asking.
    const b = Math.sin(time * 5) * 2;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = SEAL.main;
    ctx.beginPath();
    ctx.moveTo(x - 4, top - 10 + b);
    ctx.lineTo(x + 4, top - 10 + b);
    ctx.lineTo(x, top - 4 + b);
    ctx.fill();
  }
  ctx.restore();
}

function drawCalmStone(ctx, d, cam, time) {
  const x = d.spot.x - cam.x;
  const y = d.spot.y - cam.y;
  const fight = d.mobs.some((m) => m.hp > 0);
  ctx.save();
  softGlow(ctx, x, y - 14, 40, fight ? '#ffd6ea' : '#d2f5e4', 0.45 + 0.1 * Math.sin(time * 3));
  ctx.fillStyle = '#6a48ad';
  ctx.beginPath();
  ctx.ellipse(x, y - 13, 9, 14, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e8dcff';
  ctx.beginPath();
  ctx.ellipse(x, y - 13, 7.6, 12.6, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = fight ? '#ff9ec8' : '#7fd1a0';
  ctx.beginPath();
  ctx.ellipse(x + 1, y - 12, 4.4, 7.4, 0, 0, TAU);
  ctx.fill();
  twinkle(ctx, x - 2, y - 18, 2.4, '#ffffff');
  for (let k = 0; k < 3; k++) {
    const u = (time * 0.5 + k / 3) % 1;
    ctx.globalAlpha = Math.sin(u * Math.PI) * 0.9;
    twinkle(ctx, x + Math.sin(k * 2.1 + time) * 14, y - 20 - u * 26, 1.6, fight ? '#ffd6ea' : '#d2f5e4');
  }
  ctx.restore();
}

// ---------- Over everyone (with the glow) ----------

export function drawCoopFront(ctx, world, cam, time) {
  for (const m of coopBosses(world)) {
    const bx = m.x - cam.x;
    const by = m.y - (m.air ?? 0) - cam.y;
    for (const s of m.coop.mechs) {
      if (s.def.kind === 'sides') drawGuard(ctx, world, m, s, bx, by, time);
      if (s.def.kind === 'seal' && s.x != null) drawSealBeam(ctx, s, bx, by - m.def.h * 0.55, cam, time);
      if (s.def.kind === 'twins' && s.pair && !s.done) drawTether(ctx, world, s, cam, time);
    }
  }
  for (const f of world.coopFx ?? []) {
    const p = f.t / f.dur;
    const x = f.x - cam.x;
    const y = f.y - cam.y;
    ctx.save();
    if (f.kind === 'split') {
      // The blow coming down: a gold star bursting, a ring going out, beads scattering.
      const n = Math.max(1, f.n);
      ctx.globalAlpha = 1 - smooth(p);
      shock(ctx, x, y, f.w / 2 + p * 60, 8 + p * 10, 3.6 * (1 - p) + 0.4, f.n > 1 ? GOLD.main : '#ff9ec8');
      starFlash(ctx, x, y - 26 - p * 10, 26 * (1 - p * 0.4) / Math.sqrt(n) + 8, 8, p * 2, f.n > 1 ? GOLD.main : '#ff9ec8');
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * TAU;
        twinkle(ctx, x + Math.cos(a) * (14 + p * 60), y - 20 + Math.sin(a) * (8 + p * 30) - p * 10, 2.4 * (1 - p) + 0.4, GOLD.light);
      }
    } else if (f.kind === 'crack') {
      // The guard breaking: shell shards flying off both sides, a lavender star.
      ctx.globalAlpha = 1 - smooth(p);
      starFlash(ctx, x, y, 30 * (0.5 + p), 6, p * 3, GUARD.main);
      for (let k = 0; k < 10; k++) {
        const side = k % 2 ? 1 : -1;
        const a = -0.9 + (k / 10) * 1.8;
        ctx.fillStyle = k % 3 ? GUARD.light : GUARD.main;
        ctx.beginPath();
        const sx = x + side * (f.w * 0.55 + p * 50 * Math.cos(a));
        const sy = y + Math.sin(a) * 30 * p + p * p * 30;
        ctx.ellipse(sx, sy, 4 * (1 - p) + 1, 2.4 * (1 - p) + 0.6, a + p * 4, 0, TAU);
        ctx.fill();
      }
    } else if (f.kind === 'seal') {
      ctx.globalAlpha = 1 - smooth(p);
      shock(ctx, x, y, 20 + p * 30, 5 + p * 6, 2.4 * (1 - p) + 0.3, SEAL.main);
      twinkle(ctx, x, y - 30 - p * 10, 5 * (1 - p) + 1, SEAL.core);
    } else if (f.kind === 'twins' || f.kind === 'revive') {
      ctx.globalAlpha = 1 - smooth(p);
      starFlash(ctx, x, y, 22 * (0.6 + p), 5, p * 2, f.kind === 'twins' ? TETHER.main : TETHER.hot);
      puff(ctx, x, y + 10, 10 * (1 - p) + 3, '#ffe2f0', '#e0b0d0');
    }
    ctx.restore();
  }
}

// The guard: two curved halves of a lavender shell round the boss. A half struck in the last beat
// glows bright; once broken it's gone (shards, above) until it forms again, easing back in.
function drawGuard(ctx, world, m, s, bx, by, time) {
  const k = (s.shell = (s.shell ?? 1) + ((s.guard ? 1 : 0) - (s.shell ?? 1)) * 0.1);
  if (k < 0.03) return;
  const cy = by - m.def.h * 0.5;
  const rx = m.def.w * 0.62 + 8;
  const ry = m.def.h * 0.62 + 6;
  for (const side of [-1, 1]) {
    const since = world.now - (s.hits[side] ?? -9);
    const lit = s.guard ? Math.max(0, 1 - since / s.def.window) : 0;
    ctx.save();
    ctx.globalAlpha = k * (0.55 + 0.45 * lit);
    const from = side > 0 ? -1.15 : Math.PI + 1.15;
    const to = side > 0 ? 1.15 : Math.PI - 1.15;
    for (const [w, c] of [[5.2, GUARD.ink], [3.6, lit > 0.2 ? '#ffffff' : GUARD.main], [1.2, GUARD.light]]) {
      ctx.strokeStyle = c;
      ctx.lineWidth = w * (0.8 + 0.2 * Math.sin(time * 3 + side));
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.ellipse(bx, cy, rx * (0.96 + 0.04 * k), ry, 0, from, to, side < 0);
      ctx.stroke();
    }
    // A sparkle on a struck half; a soft "!" of light on the half still waiting to be struck while
    // the other is lit.
    if (lit > 0) twinkle(ctx, bx + side * rx, cy - 4, 4 + 3 * lit, '#ffffff');
    else if (s.guard && world.now - (s.hits[-side] ?? -9) < s.def.window) {
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 14);
      twinkle(ctx, bx + side * (rx + 6), cy, 4, GUARD.light);
    }
    ctx.restore();
  }
}

// The seal held: a ribbon of mint light from the stone to the boss, rippling.
function drawSealBeam(ctx, s, bx, by, cam, time) {
  const k = s.glow ?? 0;
  if (k < 0.05) return;
  const x = s.x - cam.x;
  const y = s.y - cam.y - 24;
  ctx.save();
  ctx.globalAlpha = k * 0.9;
  ctx.lineCap = 'round';
  const mx = (x + bx) / 2;
  const my = Math.min(y, by) - 40;
  for (const [w, c] of [[4, SEAL.dark], [2.4, SEAL.main], [1, SEAL.core]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(mx, my + Math.sin(time * 4) * 6, bx, by);
    ctx.stroke();
  }
  for (let i = 0; i < 4; i++) {
    const u = (time * 0.8 + i / 4) % 1;
    const qx = (1 - u) * (1 - u) * x + 2 * u * (1 - u) * mx + u * u * bx;
    const qy = (1 - u) * (1 - u) * y + 2 * u * (1 - u) * (my + Math.sin(time * 4) * 6) + u * u * by;
    twinkle(ctx, qx, qy, 2.2, '#ffffff');
  }
  ctx.restore();
}

// The twins' tether: a pink ribbon between them; once one falls it frays red and shortens as its
// twin's call-back nears.
function drawTether(ctx, world, s, cam, time) {
  const [a, b] = s.pair;
  const ax = a.x - cam.x;
  const ay = a.y - a.def.h * 0.5 - cam.y;
  const bx = b.x - cam.x;
  const by = b.y - b.def.h * 0.5 - cam.y;
  const alone = s.alone != null ? Math.min(1, (world.now - s.alone) / s.def.revive) : 0;
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.lineCap = 'round';
  const sag = 20 + Math.sin(time * 3) * 4;
  for (const [w, c] of [[3.6, TETHER.dark], [2, alone ? TETHER.hot : TETHER.main], [0.8, '#ffffff']]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.setLineDash(alone ? [6 * (1 - alone) + 2, 3 + alone * 4] : []);
    ctx.lineDashOffset = -time * 20;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo((ax + bx) / 2, Math.max(ay, by) + sag, bx, by);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // Hearts sliding along it.
  for (let i = 0; i < 3; i++) {
    const u = (time * 0.4 + i / 3) % 1;
    const qx = (1 - u) * (1 - u) * ax + 2 * u * (1 - u) * ((ax + bx) / 2) + u * u * bx;
    const qy = (1 - u) * (1 - u) * ay + 2 * u * (1 - u) * (Math.max(ay, by) + sag) + u * u * by;
    twinkle(ctx, qx, qy, 2.4, alone ? TETHER.hot : '#ffd6ea');
  }
  ctx.restore();
}

