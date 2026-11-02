// Rootwood Hollow's rooms on screen (world/hollow.js): the bounce mushrooms, Tuskar's stone
// pillars, the sap flooding the Root Gate, Gnarlroot's closing root walls and his open heart, the
// roots dropping from the tunnel ceiling, the Sprouts cheering behind the group, and the dark (the
// Hollow Entrance, and the Myconid Queen's lights-out) with light only around the group, the lit
// glowcaps, the warnings, and the doors.

import { R, E, T, F, mix } from './pixel.js';
import { ramp, stones } from './propkit.js';
import { art, place, face } from './scenery.js';
import { sproutArt } from './dungeon.js';
import { groupOf } from '../world/dungeon.js';

const TAU = Math.PI * 2;

function glow(ctx, x, y, r, color, alpha) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

// ---------- Behind the group ----------

// A giant bounce mushroom: a wide springy cap on a short stalk, with a sleepy face. `squash` (0..2)
// is how far down the cap is pressed after a bounce.
function bounceArt(squash) {
  return art(`hl-bounce|${squash}`, 48, 40, () => {
    const cap = ramp('#ff9ec8', 0.85);
    const st = ramp('#fff1dc', 0.7);
    const d = squash * 3;
    return [
      E(24, 39, 14, 2, st.sh), R(18, 22 + d, 12, 17 - d, st.base), F(R(26, 22 + d, 4, 17 - d, st.sh)),
      T([[2, 24 + d], [6, 12 + d * 1.4], [16, 5 + d * 1.6], [24, 4 + d * 1.6], [32, 5 + d * 1.6], [42, 12 + d * 1.4], [46, 24 + d]], cap.base),
      F(T([[30, 6 + d * 1.6], [42, 12 + d * 1.4], [46, 24 + d], [36, 24 + d]], cap.sh)), F(T([[6, 16 + d], [14, 8 + d * 1.6], [22, 6 + d * 1.6], [12, 12 + d]], cap.hi)),
      F(E(24, 24 + d, 21, 2.4, cap.deep)), F(E(12, 14 + d, 3, 2, '#ffffff')), F(E(30, 10 + d, 3.4, 2, '#ffffff')), F(E(38, 17 + d, 2.4, 1.6, '#ffffff')),
      ...face(24, 30 + d * 0.4, 3, squash ? 'happy' : 'closed', squash ? 'o' : 'smile'),
    ];
  }, false);
}

// A stone pillar holding up the den's roof, or its tumbled pieces once Tuskar has hit it.
function pillarArt(broken) {
  return art(`hl-pillar|${broken}`, 44, 120, () => {
    const st = ramp('#b8a8c8', 0.75);
    if (broken) {
      return [...stones(4, 96, 36, 24, st, 7, { rowH: 8, blockW: 12 }), T([[8, 96], [14, 84], [22, 90], [30, 82], [36, 96]], st.base), F(T([[22, 90], [30, 82], [36, 96], [26, 96]], st.sh)),
        F(E(10, 118, 4, 1.4, '#a6dca2')), F(E(34, 118, 3, 1.2, '#a6dca2'))];
    }
    return [...stones(8, 8, 28, 108, st, 3, { rowH: 12, blockW: 14 }), R(4, 0, 36, 8, st.base), F(R(4, 6, 36, 2, st.sh)), R(4, 112, 36, 8, st.base), F(R(30, 112, 10, 8, st.sh)),
      F(E(14, 60, 4, 2, '#a6dca2')), F(E(30, 92, 3.4, 1.8, '#a6dca2')), F(T([[20, 30], [24, 44], [21, 52]], st.deep))];
  }, false);
}

export function drawHollowBack(ctx, world, cam, time) {
  const run = world.dungeon;
  const room = run.room;
  const map = world.map;
  const gy = map.groundY - cam.y;
  for (const pad of map.bouncers ?? []) {
    const age = time - (pad.drawnAt ?? -9);
    if (pad.at && pad.at !== pad.seen) {
      pad.seen = pad.at;
      pad.drawnAt = time;
    }
    // The cap springs down and back up with a wobble after each bounce.
    const squash = age < 0.12 ? 2 : age < 0.3 ? 1 : 0;
    glow(ctx, pad.x - cam.x, gy - 18, 30, '#ffc6e0', 0.35 + 0.15 * Math.sin(time * 3));
    place(ctx, bounceArt(squash), pad.x - cam.x, gy + 2);
  }
  for (const p of room.pillars ?? []) {
    const x = p.x - cam.x;
    if (p.up) place(ctx, pillarArt(false), x, gy + 2);
    else {
      // It tumbles over in a heap, with a puff of dust.
      const since = world.now - (p.fellAt ?? -9);
      place(ctx, pillarArt(true), x, gy + 2);
      if (since < 0.8) glow(ctx, x, gy - 20, 50 * since + 10, '#e6dcf0', 0.6 * (1 - since / 0.8));
    }
  }
  // Roots about to drop: a root tip lowering from the ceiling over its shadow.
  for (const z of run.zones) {
    if (!z.root || z.hit) continue;
    const p = Math.min(1, z.t / z.warn);
    const x = z.x - cam.x;
    const tip = (z.y - cam.y) * p * 0.4;
    ctx.save();
    ctx.strokeStyle = '#8f6a66';
    ctx.lineWidth = 6 - p * 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, -4);
    ctx.quadraticCurveTo(x + Math.sin(time * 6) * 3, tip * 0.5, x, tip);
    ctx.stroke();
    ctx.restore();
  }
}

// ---------- In front of the group ----------

export function drawHollowFront(ctx, world, cam, time) {
  const run = world.dungeon;
  const room = run.room;
  const map = world.map;
  const gy = map.groundY - cam.y;
  // The sap: bubbling on the floor as it comes, then a sticky amber flood.
  const f = room.flood;
  if (f && f.state !== 'calm') {
    const def = map.flood;
    const level = f.state === 'rising' ? (f.since / def.warn) * 6 : f.t < 1 ? 14 * f.t : 14;
    const sea = def.color === 'sea';
    const melt = def.color === 'caramel';
    ctx.save();
    ctx.globalAlpha = sea ? 0.6 : 0.72;
    ctx.fillStyle = sea ? '#3a8ab0' : melt ? '#d8803a' : '#e8a24a';
    ctx.beginPath();
    ctx.moveTo(0, gy + 10);
    for (let x = 0; x <= 640; x += 16) ctx.lineTo(x, gy - level + Math.sin(time * 2 + (x + cam.x) * 0.05) * 2);
    ctx.lineTo(640, gy + 10);
    ctx.fill();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = sea ? '#bfeeff' : '#ffd68a';
    for (let x = 0; x <= 640; x += 16) ctx.fillRect(x, gy - level - 1 + Math.sin(time * 2 + (x + cam.x) * 0.05) * 2, 9, 2);
    // Bubbles popping up through it.
    for (let k = 0; k < 10; k++) {
      const u = (time * 0.7 + k * 0.37) % 1;
      const bx = ((k * 97 - cam.x) % 640 + 640) % 640;
      ctx.globalAlpha = (1 - u) * 0.8;
      ctx.strokeStyle = sea ? '#ffffff' : '#fff1c4';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(bx, gy - u * (level + 6), 2 + u * 2, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }
  // Gnarlroot's root walls closing in from both sides (the Archive's are bookcases, drawn there).
  if (room.walls && map.dungeon !== 'observatory') {
    for (const [edge, dir] of [[room.walls.l, -1], [room.walls.r, 1]]) {
      const x = edge - cam.x;
      ctx.save();
      ctx.fillStyle = '#5a3f4c';
      ctx.beginPath();
      ctx.moveTo(x, -10);
      for (let y = -10; y <= gy + 10; y += 12) ctx.lineTo(x + Math.sin(y * 0.08 + time * 1.5) * 6, y);
      ctx.lineTo(dir < 0 ? -10 : 650, gy + 10);
      ctx.lineTo(dir < 0 ? -10 : 650, -10);
      ctx.fill();
      // Thorns along its face.
      ctx.fillStyle = '#8f6a66';
      for (let y = 10; y < gy; y += 26) {
        const tx = x + Math.sin(y * 0.08 + time * 1.5) * 6;
        ctx.beginPath();
        ctx.moveTo(tx, y - 5);
        ctx.lineTo(tx - dir * 12, y);
        ctx.lineTo(tx, y + 5);
        ctx.fill();
      }
      ctx.restore();
    }
  }
  // Gnarlroot's open heart, glowing above him.
  const heart = world.mobs.find((m) => m.heartOpen && m.hp > 0);
  if (heart) {
    const x = heart.x - cam.x;
    const y = heart.y - heart.def.h - 30 - cam.y;
    const beat = 1 + 0.12 * Math.max(0, Math.sin(time * 6));
    glow(ctx, x, y, 46 * beat, '#ff9ec0', 0.6);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(beat, beat);
    ctx.fillStyle = '#ff6f9e';
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.bezierCurveTo(-16, -2, -10, -16, 0, -6);
    ctx.bezierCurveTo(10, -16, 16, -2, 0, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.ellipse(-5, -5, 3, 2, -0.5, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  // The Sprouts you've freed, cheering along behind you; once the Heart is calm, dancing round
  // the chest with little hearts.
  const n = Math.min(4, run.cheer ?? 0);
  const b = world.body;
  const chest = room.cleared && room.objects.find((o) => o.kind === 'chest');
  for (let k = 0; k < n; k++) {
    if (chest) {
      const a = time * 1.6 + (k / n) * TAU;
      const sx = chest.x + Math.cos(a) * 40 - cam.x;
      const hop = Math.abs(Math.sin(time * 7 + k)) * 10;
      place(ctx, sproutArt(true, Math.floor(time * 6 + k) % 2), sx, gy - hop);
      const u = (time * 0.8 + k / n) % 1;
      ctx.save();
      ctx.globalAlpha = 1 - u;
      ctx.fillStyle = '#ff8fb0';
      const hx = sx + Math.sin(u * 6 + k) * 4;
      const hy = gy - 26 - u * 30;
      ctx.beginPath();
      ctx.moveTo(hx, hy + 3);
      ctx.bezierCurveTo(hx - 4, hy, hx - 3, hy - 3, hx, hy - 1);
      ctx.bezierCurveTo(hx + 3, hy - 3, hx + 4, hy, hx, hy + 3);
      ctx.fill();
      ctx.restore();
      continue;
    }
    const sx = b.x - b.facing * (24 + k * 14) - cam.x;
    const hop = Math.abs(Math.sin(time * 6 + k * 1.3)) * 4;
    place(ctx, sproutArt(true, Math.floor(time * 4 + k) % 2), sx, b.y - cam.y - hop);
  }
}

// ---------- The dark ----------

// How dark the room is right now (0 light, 1 pitch black), easing in and out.
function darkness(world) {
  const room = world.dungeon.room;
  if (world.map.dark) return room.cleared ? 0.45 : 0.9;
  const left = (room.darkUntil ?? 0) - world.now;
  if (left <= 0) return 0;
  return 0.86 * Math.min(1, left / 0.6, (10 - Math.min(10, left)) / 0.6 + 0.1);
}

// Darkness over the world with soft holes of light: around everyone in the group, the lit
// glowcaps (and a faint glimmer from the dozing ones), the warnings about to go off, and the doors.
export function drawDarkness(ctx, world, cam, time) {
  const k = darkness(world);
  if (k <= 0) return;
  const W = 640;
  const H = 360;
  const c = (drawDarkness.canvas ??= document.createElement('canvas'));
  if (c.width !== W || c.height !== H) {
    c.width = W;
    c.height = H;
  }
  const g = c.getContext('2d');
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, W, H);
  // A room can grow darker with depth (`darkDepth`: [top, bottom] shares of the darkness): moonlight
  // reaches the canopy, the trunk floor below is pitch black.
  const dd = world.map.darkDepth;
  if (dd) {
    const top = 120 - cam.y;
    const bot = world.map.groundY - cam.y;
    const gr = g.createLinearGradient(0, top, 0, bot);
    gr.addColorStop(0, `rgba(14,8,26,${k * dd[0]})`);
    gr.addColorStop(1, `rgba(14,8,26,${k * dd[1]})`);
    g.fillStyle = gr;
  } else g.fillStyle = `rgba(14,8,26,${k})`;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, a = 1) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(0,0,0,${a})`);
    gr.addColorStop(0.6, `rgba(0,0,0,${a * 0.8})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const flick = 1 + 0.04 * Math.sin(time * 9);
  for (const m of groupOf(world)) hole(m.body.x - cam.x, m.body.y - 24 - cam.y, (m.bot ? 62 : 80) * flick);
  const room = world.dungeon.room;
  for (const o of room.objects) {
    if (o.kind !== 'glowcap') continue;
    hole(o.x - cam.x, (o.y ?? world.map.groundY) - 24 - cam.y, o.done ? 190 * flick : 34, o.done ? 1 : 0.6);
  }
  for (const z of world.dungeon.zones) if (!z.hit && z.kind === 'circle') hole(z.x - cam.x, z.y - cam.y, z.w / 2 + 26, 0.8);
  for (const p of world.map.portals) if (!p.hidden) hole(p.x - cam.x, p.y - 30 - cam.y, 60, 0.7);
  // The Myconid Queen's eyes glint in the dark.
  for (const m of world.mobs) {
    if (m.hp <= 0) continue;
    const x = m.x - cam.x;
    const y = m.y - m.def.h * 0.7 - cam.y;
    if (m.def.boss) hole(x, y, 40, 0.5);
  }
  ctx.save();
  ctx.drawImage(c, 0, 0, W, H);
  ctx.restore();
}
