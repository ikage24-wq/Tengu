// Water you can wade into (a map's `water`: [{ x1, x2, y, kind }], physics.js waterAt): a pool or the
// sea shallows sunk into the ground, its surface below the ground line and its bed the terrain's own
// floor, so it sits in the land between real banks instead of lying on top of it. Drawn twice: the
// body behind everyone (`drawWaterBack`: the water, light on the bed, the region's bank life) and a
// see-through skin over the legs of anyone in it with the foam line, ripples round them and the
// region's life over the water (`drawWaterFront`). Each region has its own water (`kind`):
//   pond    a meadow lily pond: green-teal, lily pads and blossoms, reeds, fireflies at night
//   spring  a clear mountain pool: bright blue, pebbles on the bed, glints, reeds
//   hot     a hot spring: milky turquoise, steam curling off it, bubbles rising
//   cave    an underground lake: deep blue lit from below, crystals in its banks, motes
//   star    a pool of night sky in the clouds: indigo, stars twinkling in it
//   cloud   a gap in the cloud sea: the open sky below, white billows rolling through it
//   sea     the lagoon's turquoise shallows (the default)
// (A map with lilies and reeds of its own turns the pond's off: `lilies: false`, `reeds: false`.)
// Everything moves on time from the water's place in the world, never the screen. Also here: the
// sea along a quay (`drawQuaySea`) and a boat afloat in it (`drawAfloat`): the hull sinks to its
// waterline, its reflection darkens the water under it, and it bobs with the swell.

import { groundAt } from '../world/physics.js';

const TAU = Math.PI * 2;
export const WATERS = {
  sea: { top: '#8fe6dc', mid: '#5cc6cc', deep: '#3f94b8', foam: '#f4fffc', glint: '#d8fff8' },
  pond: { top: '#a6e8c4', mid: '#62bfa8', deep: '#3d8a9a', foam: '#f2fff0', glint: '#e6fff0' },
  spring: { top: '#b0eeff', mid: '#6ccbe8', deep: '#3f86c4', foam: '#ffffff', glint: '#e8faff' },
  hot: { top: '#d4f6ee', mid: '#94dcd2', deep: '#5aaabc', foam: '#ffffff', glint: '#ffffff' },
  cave: { top: '#8fe4ff', mid: '#4f9ed8', deep: '#33438e', foam: '#d8f6ff', glint: '#bff4ff' },
  star: { top: '#8a7ad8', mid: '#4a3f9c', deep: '#1d1b52', foam: '#e6dcff', glint: '#fff6c8' },
  cloud: { top: '#d6ecff', mid: '#a6ccff', deep: '#7c9ee8', foam: '#ffffff', glint: '#ffffff' },
  // Lily Lake (the Mochi race's, its redraw 2026-11-13): a clear summer lake, turquoise over sand;
  // its lilies, lotus and waterweed are the course's own (render/courseart.js, WATER_BED/WATER_LIFE).
  lotus: { top: '#a8f0e6', mid: '#4fc4cc', deep: '#2d8cb4', foam: '#ffffff', glint: '#f0fffc' },
  // The Grand Mochi Course's pond at dusk (its redraw, 2026-11-13): the evening sky in it, violet
  // going deep; its floating lanterns are the course's own (render/courseart.js).
  dusk: { top: '#b0b4ea', mid: '#7074c4', deep: '#3e3c8c', foam: '#ffffff', glint: '#ffe4b0' },
  // The Mochi Grand Tour's castle moat (its redraw, 2026-11-13): deep still green water under the
  // walls; its boats and drawbridge are the course's own (render/courseart.js).
  moat: { top: '#86c8b4', mid: '#3f9a90', deep: '#255e64', foam: '#f0fffa', glint: '#d8fff0' },
};
// A map's own life in its water, registered by the code that draws it (the Mochi race courses:
// render/courseart.js): WATER_BED (ctx, map, w, cam, time, x0, x1) under the surface, in the
// water's body; WATER_LIFE (ctx, map, w, cam, time, x0, x1, at) on top of it, over the skin, with
// `at(x)` the surface's height there on screen.
export const WATER_BED = [];
export const WATER_LIFE = [];
const pal = (w) => WATERS[w.kind] ?? WATERS.sea;
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const calm = (w) => (w.kind === 'cloud' ? 0.6 : w.kind === 'hot' || w.kind === 'cave' ? 0.7 : 1);
export const swell = (x, time, k = 1) => (Math.sin(x * 0.045 + time * 1.6) * 1.4 + Math.sin(x * 0.11 - time * 2.3) * 0.6) * k;

// The water's outline: its rolling surface, then back along the bed (a little below it, so the
// bed's grassy lip is under the water too), so it fills the pool's shape between its banks.
function surfacePath(ctx, map, w, cam, time, x0, x1, down) {
  const k = calm(w);
  ctx.beginPath();
  ctx.moveTo(x0 - cam.x, w.y - cam.y + swell(x0, time, k));
  for (let x = x0; x <= x1; x += 4) ctx.lineTo(x - cam.x, w.y - cam.y + swell(x, time, k));
  ctx.lineTo(x1 - cam.x, w.y - cam.y + swell(x1, time, k));
  for (let x = x1; x >= x0; x -= 4) ctx.lineTo(x - cam.x, Math.min(w.y + down, Math.max(w.y, groundAt(map, x) + (w.sunk === false ? 0 : 10))) - cam.y);
  ctx.closePath();
}

const span = (w, cam, width) => [Math.max(w.x1, cam.x - 8), Math.min(w.x2, cam.x + width + 8)];

export function drawWaterBack(ctx, map, cam, width, time) {
  for (const w of map.water ?? []) {
    const [x0, x1] = span(w, cam, width);
    if (x1 <= x0) continue;
    if (w.kind === 'ice') {
      drawIce(ctx, w, cam, time, x0, x1);
      continue;
    }
    const C = pal(w);
    // Deepest point of the bed in view, for the bands.
    let bed = w.y + 8;
    for (let x = x0; x <= x1; x += 16) bed = Math.max(bed, groundAt(map, x));
    const depth = bed - w.y + 12;
    const g = ctx.createLinearGradient(0, w.y - cam.y, 0, w.y - cam.y + depth);
    g.addColorStop(0, C.top);
    g.addColorStop(0.35, C.mid);
    g.addColorStop(1, C.deep);
    ctx.save();
    ctx.globalAlpha = w.kind === 'cloud' ? 0.96 : 0.92;
    ctx.fillStyle = g;
    surfacePath(ctx, map, w, cam, time, x0, x1, depth);
    ctx.fill();
    ctx.clip();
    // The banks shade the water where it meets them, so it reads as held in the ground.
    for (const [ex, dir] of [[w.x1, 1], [w.x2, -1]]) {
      const sx = ex - cam.x;
      const eg = ctx.createLinearGradient(sx, 0, sx + dir * 14, 0);
      eg.addColorStop(0, C.deep);
      eg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = eg;
      ctx.fillRect(Math.min(sx, sx + dir * 14), w.y - cam.y - 4, 14, depth + 8);
    }
    bedLife(ctx, map, w, C, cam, time, x0, x1);
    for (const hook of WATER_BED) hook(ctx, map, w, cam, time, x0, x1);
    ctx.restore();
    bankLife(ctx, map, w, C, cam, time);
  }
}

// A frozen lake (`ice`): you stand on it. A sheet of pale ice over the lake's floor (`y` is its
// top), lit along its top, with cracks, a glint sliding across it now and then, and snow drifted
// up against both banks.
function drawIce(ctx, w, cam, time, x0, x1) {
  const top = w.y - cam.y;
  ctx.save();
  const g = ctx.createLinearGradient(0, top - 2, 0, top + 16);
  g.addColorStop(0, '#f4fbff');
  g.addColorStop(0.25, '#cfe8fa');
  g.addColorStop(1, '#9cc4ea');
  ctx.fillStyle = g;
  ctx.fillRect(x0 - cam.x, top - 1, x1 - x0, 17);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x0 - cam.x, top - 1, x1 - x0, 1.4);
  // Cracks, each its own zig-zag.
  ctx.strokeStyle = 'rgba(120,160,210,0.7)';
  ctx.lineWidth = 0.8;
  for (let x = Math.floor(w.x1 / 37) * 37 + 18; x < w.x2 - 8; x += 37) {
    if (x < x0 - 20 || x > x1 + 20) continue;
    const h = hash(x);
    ctx.beginPath();
    ctx.moveTo(x - cam.x, top + 2 + h * 3);
    ctx.lineTo(x - cam.x + 5 + h * 4, top + 6 + h * 2);
    ctx.lineTo(x - cam.x + 2 + h * 9, top + 11);
    ctx.stroke();
  }
  // A glint sliding along the ice.
  const u = (time * 0.18 + w.x1 * 0.001) % 1;
  const gx = w.x1 + (w.x2 - w.x1) * u - cam.x;
  ctx.globalAlpha = Math.sin(u * Math.PI) * 0.8;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(gx - 6, top + 9);
  ctx.lineTo(gx - 2, top + 2);
  ctx.lineTo(gx + 1, top + 2);
  ctx.lineTo(gx - 3, top + 9);
  ctx.fill();
  // Snow drifted against the banks.
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fbfdff';
  for (const [ex, dir] of [[w.x1, 1], [w.x2, -1]]) {
    ctx.beginPath();
    ctx.ellipse(ex - cam.x + dir * 8, top + 1, 12, 4, 0, Math.PI, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// What lies under the surface: light rippling on the bed, and the region's own bed.
function bedLife(ctx, map, w, C, cam, time, x0, x1) {
  ctx.globalAlpha = w.kind === 'star' ? 0.1 : 0.16;
  ctx.fillStyle = '#ffffff';
  for (let x = Math.floor(x0 / 22) * 22; x < x1; x += 22) {
    const k = Math.sin(x * 0.7 + time * 1.3);
    const by = groundAt(map, x) - cam.y - 3;
    ctx.beginPath();
    ctx.ellipse(x - cam.x + k * 3, by, 7 + k * 2, 1.4, 0, 0, TAU);
    ctx.fill();
  }
  if (w.kind === 'spring' || w.kind === 'pond') {
    // Pebbles on the bed, each its own soft colour.
    for (let x = Math.floor(x0 / 17) * 17; x < x1; x += 17) {
      const h = hash(x);
      if (h < 0.45) continue;
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = h > 0.8 ? '#c8d8e0' : h > 0.6 ? '#a8b8c8' : '#b8c8a8';
      ctx.beginPath();
      ctx.ellipse(x - cam.x + h * 8, groundAt(map, x) - cam.y - 2, 3 + h * 2, 1.8, 0, 0, TAU);
      ctx.fill();
    }
  }
  if (w.kind === 'cave') {
    // Lit from below: a soft glow welling up off the bed, breathing.
    for (let x = Math.floor(x0 / 60) * 60 + 30; x < x1; x += 60) {
      const a = 0.18 + 0.1 * Math.sin(time * 0.9 + x * 0.05);
      const gx = x - cam.x;
      const gy = groundAt(map, x) - cam.y - 4;
      const gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, 34);
      gg.addColorStop(0, `rgba(160,240,255,${a})`);
      gg.addColorStop(1, 'rgba(160,240,255,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = gg;
      ctx.fillRect(gx - 34, gy - 34, 68, 68);
    }
  }
  if (w.kind === 'star') {
    // Stars down in the pool, each twinkling on its own beat, and a soft moon's reflection.
    for (let x = Math.floor(x0 / 13) * 13; x < x1; x += 13) {
      const h = hash(x * 1.3);
      const tw = Math.max(0, Math.sin(time * (1.4 + h) + h * 9));
      ctx.globalAlpha = tw * 0.9;
      ctx.fillStyle = h > 0.7 ? '#fff0a0' : '#ffffff';
      const sx = x - cam.x + h * 9;
      const sy = w.y - cam.y + 5 + h * Math.max(4, groundAt(map, x) - w.y - 6);
      ctx.fillRect(sx - 0.5, sy - 1.5, 1, 3);
      ctx.fillRect(sx - 1.5, sy - 0.5, 3, 1);
    }
    const mx = (w.x1 + w.x2) / 2 - cam.x;
    ctx.globalAlpha = 0.35 + 0.08 * Math.sin(time * 0.8);
    ctx.fillStyle = '#f2ecff';
    ctx.beginPath();
    ctx.ellipse(mx + Math.sin(time * 0.7) * 2, w.y - cam.y + 6, 12, 2.4, 0, 0, TAU);
    ctx.fill();
  }
  if (w.kind === 'cloud') {
    // Billows rolling slowly by below the surface.
    for (let x = Math.floor(x0 / 30) * 30 - 30; x < x1 + 30; x += 30) {
      const h = hash(x * 0.7);
      const bx = x - cam.x + ((time * 6 + h * 30) % 30);
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bx, w.y - cam.y + 10 + h * 8, 8 + h * 6, 0, TAU);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// Life on the banks, behind everyone: reeds and cattails swaying (pond, spring), crystals growing
// out of the cave's banks, mossy stones on a hot spring's rim.
function bankLife(ctx, map, w, C, cam, time) {
  const banks = [[w.x1, 1], [w.x2, -1]].filter(([ex]) => !(w.open ?? []).includes(ex));
  for (const [ex, dir] of banks) {
    const sx = ex - cam.x;
    if (sx < -40 || sx > 700) continue;
    const top = Math.min(groundAt(map, ex - dir * 6), groundAt(map, ex + dir * 6));
    const gy = groundAt(map, ex - dir * 6) - cam.y;
    ctx.save();
    if ((w.kind === 'pond' || w.kind === 'spring') && w.reeds !== false) {
      // Reeds and a cattail or two at the water's edge, swaying in their own time.
      for (let i = 0; i < 5; i++) {
        const rx = sx + dir * (3 + i * 3.4);
        const h = 10 + hash(ex + i) * 9;
        const lean = Math.sin(time * 1.2 + i * 0.9 + ex * 0.01) * 1.6 * dir;
        const by = w.y - cam.y + 3;
        ctx.strokeStyle = i % 2 ? '#5aa868' : '#4f9a5e';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(rx, by);
        ctx.quadraticCurveTo(rx, by - h * 0.6, rx + lean, by - h);
        ctx.stroke();
        if (i === 1 || i === 4) {
          ctx.fillStyle = '#9a6a4a';
          ctx.beginPath();
          ctx.ellipse(rx + lean, by - h - 2, 1.4, 3, 0, 0, TAU);
          ctx.fill();
        }
      }
    } else if (w.kind === 'cave') {
      // Crystals growing out of the bank wall down into the water, glowing softly.
      for (let i = 0; i < 3; i++) {
        const cx = sx + dir * (4 + i * 7);
        const cy = w.y - cam.y + 2 - i * 3;
        const h = 9 + hash(ex * 0.3 + i) * 10;
        const glow = 0.6 + 0.3 * Math.sin(time * 1.4 + i + ex * 0.02);
        ctx.globalAlpha = glow;
        ctx.fillStyle = i % 2 ? '#bfe8ff' : '#a8a0ff';
        ctx.beginPath();
        ctx.moveTo(cx - 3, cy);
        ctx.lineTo(cx + dir * 1.5, cy - h);
        ctx.lineTo(cx + 3, cy);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = glow * 0.8;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 0.5, cy - h * 0.7, 1, h * 0.5);
      }
    } else if (w.kind === 'hot') {
      // Smooth stones round the rim of the spring.
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i % 2 ? '#a8a4b8' : '#bab6c8';
        ctx.beginPath();
        ctx.ellipse(sx + dir * (2 + i * 9), Math.min(gy, top - cam.y) + 1, 5, 3.2, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#d8d4e4';
        ctx.fillRect(sx + dir * (2 + i * 9) - 2, Math.min(gy, top - cam.y) - 1.5, 3, 1);
      }
    }
    ctx.restore();
  }
}

export function drawWaterFront(ctx, map, cam, width, time, waders = []) {
  for (const w of map.water ?? []) {
    const [x0, x1] = span(w, cam, width);
    if (x1 <= x0 || w.kind === 'ice') continue;
    const C = pal(w);
    const k = calm(w);
    ctx.save();
    // The skin over legs: a shallow band, see-through.
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = C.top;
    surfacePath(ctx, map, w, cam, time, x0, x1, 14);
    ctx.fill();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = C.mid;
    surfacePath(ctx, map, w, cam, time, x0, x1, 40);
    ctx.fill();
    // The foam line and drifting glints.
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = C.foam;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 3) {
      const y = w.y - cam.y + swell(x, time, k);
      if (x === x0) ctx.moveTo(x - cam.x, y);
      else ctx.lineTo(x - cam.x, y);
    }
    ctx.stroke();
    ctx.fillStyle = C.glint;
    for (let x = Math.floor(x0 / 30) * 30; x < x1; x += 30) {
      const tw = (Math.sin(x * 1.7 + time * 3) + 1) / 2;
      if (tw < 0.55) continue;
      const gx = x + ((time * 9 + x) % 30) - cam.x;
      ctx.globalAlpha = (tw - 0.55) * 2;
      ctx.fillRect(gx - 2, w.y - cam.y + swell(x, time, k) + 3, 4, 1);
    }
    // Ripples spreading round whoever's in the water.
    for (const b of waders) {
      if (b.x < w.x1 || b.x > w.x2 || b.y < w.y - 2) continue;
      for (let i = 0; i < 2; i++) {
        const u = (time * 0.9 + i / 2 + b.x * 0.01) % 1;
        ctx.globalAlpha = (1 - u) * 0.8;
        ctx.strokeStyle = C.foam;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(b.x - cam.x, w.y - cam.y + swell(b.x, time, k) + 1, 8 + u * 16, 1.6 + u * 2, 0, 0, TAU);
        ctx.stroke();
      }
    }
    surfaceLife(ctx, map, w, C, cam, time, x0, x1, k);
    ctx.globalAlpha = 1;
    for (const hook of WATER_LIFE) hook(ctx, map, w, cam, time, x0, x1, (x) => w.y - cam.y + swell(x, time, k));
    ctx.restore();
  }
}

// The region's life on and over the water.
function surfaceLife(ctx, map, w, C, cam, time, x0, x1, k) {
  const night = map.night ?? 0;
  const at = (x) => w.y - cam.y + swell(x, time, k);
  if (w.kind === 'pond') {
    // Lily pads bobbing (some with a blossom), and a petal drifting across now and then. (A map that
    // lays its own, `lilies: false`, has just the petal.)
    for (let x = Math.floor(w.x1 / 46) * 46 + 23; x < w.x2 - 10 && w.lilies !== false; x += 46) {
      if (x < x0 - 20 || x > x1 + 20 || x - w.x1 < 18) continue;
      const h = hash(x * 0.37);
      const px = x - cam.x + Math.sin(time * 0.4 + h * 6) * 2;
      const py = at(x) + 1.5;
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#5fb87a';
      ctx.beginPath();
      ctx.ellipse(px, py, 6, 1.9, 0, 0.35, TAU - 0.1);
      ctx.lineTo(px, py);
      ctx.fill();
      ctx.fillStyle = '#7fd08f';
      ctx.fillRect(px - 4, py - 1, 4, 0.8);
      if (h > 0.5) {
        ctx.fillStyle = h > 0.75 ? '#ffb8d8' : '#fff4fa';
        ctx.beginPath();
        ctx.ellipse(px + 1, py - 1.6, 2.2, 1.6, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#ffe680';
        ctx.fillRect(px + 0.5, py - 2.2, 1, 1);
      }
    }
    const u = (time * 0.06 + w.x1 * 0.001) % 1;
    const petalX = w.x1 + (w.x2 - w.x1) * u;
    if (petalX > x0 && petalX < x1) {
      ctx.globalAlpha = Math.sin(u * Math.PI);
      ctx.fillStyle = '#ffc8dc';
      ctx.beginPath();
      ctx.ellipse(petalX - cam.x, at(petalX) - 0.5, 2, 1, Math.sin(time) * 0.4, 0, TAU);
      ctx.fill();
    }
  }
  if ((w.kind === 'pond' || w.kind === 'spring') && night > 0.05) {
    // Fireflies over the water at night, each drifting its own loop.
    for (let i = 0; i < 6; i++) {
      const h = hash(w.x1 + i * 7.7);
      const fx = w.x1 + (w.x2 - w.x1) * ((h + Math.sin(time * 0.3 + i) * 0.12 + 1) % 1);
      const fy = w.y - 14 - h * 26 + Math.sin(time * 0.9 + i * 2) * 5;
      const glow = night * (0.5 + 0.5 * Math.sin(time * 2.2 + i * 1.9));
      const sx = fx - cam.x;
      const sy = fy - cam.y;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 6);
      g.addColorStop(0, `rgba(255,246,160,${0.55 * glow})`);
      g.addColorStop(1, 'rgba(255,246,160,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.fillRect(sx - 6, sy - 6, 12, 12);
      ctx.globalAlpha = glow;
      ctx.fillStyle = '#fffbd0';
      ctx.fillRect(sx - 0.7, sy - 0.7, 1.4, 1.4);
    }
  }
  if (w.kind === 'hot') {
    // Steam curling up off the spring, and bubbles rising to pop at the surface.
    for (let i = 0; i < Math.ceil((w.x2 - w.x1) / 26); i++) {
      const sx0 = w.x1 + 10 + i * 26;
      if (sx0 < x0 - 30 || sx0 > x1 + 30) continue;
      for (let j = 0; j < 2; j++) {
        const u = (time * 0.22 + hash(sx0 + j) + j * 0.5) % 1;
        const a = Math.sin(u * Math.PI) * 0.4;
        ctx.globalAlpha = a;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx0 - cam.x + Math.sin(time * 0.8 + i + u * 4) * 5, at(sx0) - 2 - u * 34, 3 + u * 6, 0, TAU);
        ctx.fill();
      }
      const b = (time * 0.7 + hash(sx0 * 2)) % 1;
      ctx.globalAlpha = 0.7 * (1 - b);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(sx0 + 9 - cam.x, at(sx0) + 6 - b * 6, 1.2, 0, TAU);
      ctx.stroke();
    }
  }
  if (w.kind === 'cave' || w.kind === 'star') {
    // Motes of light drifting up off the water.
    for (let i = 0; i < Math.ceil((w.x2 - w.x1) / 40); i++) {
      const mx = w.x1 + 20 + i * 40 + Math.sin(time * 0.5 + i) * 6;
      if (mx < x0 - 10 || mx > x1 + 10) continue;
      const u = (time * 0.18 + hash(mx * 0.2)) % 1;
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.8;
      ctx.fillStyle = w.kind === 'star' ? '#fff0a0' : '#bff4ff';
      ctx.fillRect(mx - cam.x, at(mx) - 4 - u * 40, 1.4, 1.4);
    }
  }
  if (w.kind === 'cloud') {
    // Wisps of cloud lifting off the cloud sea.
    for (let i = 0; i < Math.ceil((w.x2 - w.x1) / 34); i++) {
      const cx = w.x1 + 17 + i * 34;
      if (cx < x0 - 20 || cx > x1 + 20) continue;
      const u = (time * 0.12 + hash(cx)) % 1;
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.55;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cx - cam.x + u * 10, at(cx) - 2 - u * 16, 6 + u * 4, 2.4 + u, 0, 0, TAU);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// ---------- The sea along a quay, and boats afloat in it ----------

// The sea seen past a quay's far edge (screen coords): its surface at `top` (sea level, a little
// above the walkway's line because it lies further back), rolling, with glints, fading into the
// backdrop's own sea above. `wx0` is the world x of screen x 0, for the phases.
export function drawQuaySea(ctx, x0, x1, top, bottom, time, wx0, kind = 'sea', night = 0) {
  if (x1 <= x0 || bottom <= top) return;
  const C = WATERS[kind] ?? WATERS.sea;
  ctx.save();
  // Fades up into the far sea of the backdrop, so there's no hard top edge.
  const g = ctx.createLinearGradient(0, top - 14, 0, bottom);
  g.addColorStop(0, 'rgba(143,230,220,0)');
  g.addColorStop(0.3, C.top);
  g.addColorStop(0.6, C.mid);
  g.addColorStop(1, C.deep);
  ctx.fillStyle = g;
  ctx.fillRect(x0, top - 14, x1 - x0, bottom - top + 14);
  // At night the sea goes deep indigo, so only its foam and glints catch the light.
  if (night > 0) {
    const n = ctx.createLinearGradient(0, top - 14, 0, bottom);
    n.addColorStop(0, 'rgba(30,28,86,0)');
    n.addColorStop(0.3, `rgba(30,28,86,${0.55 * night})`);
    n.addColorStop(1, `rgba(24,22,70,${0.65 * night})`);
    ctx.fillStyle = n;
    ctx.fillRect(x0, top - 14, x1 - x0, bottom - top + 14);
  }
  // Swell lines rolling along, and glints.
  ctx.strokeStyle = C.foam;
  ctx.lineWidth = 1;
  for (let row = 0; row < 3; row++) {
    const ry = top + row * ((bottom - top) / 3) + 1;
    ctx.globalAlpha = 0.55 - row * 0.12;
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 4) {
      const y = ry + Math.sin((x + wx0) * 0.05 + time * (1.6 - row * 0.3) + row * 2) * (1.1 + row * 0.3);
      if (x === x0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.fillStyle = C.glint;
  for (let k = 0; k < (x1 - x0) / 24; k++) {
    const seed = Math.floor((wx0 + x0) / 24) + k;
    const gx = x0 + k * 24 + ((time * 7 + hash(seed) * 24) % 24);
    const gy = top + 3 + hash(seed * 3.1) * Math.max(3, bottom - top - 5);
    ctx.globalAlpha = Math.max(0, 0.3 + 0.4 * Math.sin(time * 2 + seed));
    ctx.fillRect(gx, gy, 4 + hash(seed) * 5, 1);
  }
  ctx.restore();
}

// A boat afloat (screen coords): `draw(ctx)` draws it with its keel at (0, 0), its waterline
// `line` px above the keel. It rides the swell (a slow bob and roll, from its place in the world),
// shows above the water down to the waterline, then its reflection, darkened and broken by
// ripples, and a foam line where the hull meets the sea. `waterY` is the sea level on screen.
export function drawAfloat(ctx, x, waterY, w, line, time, wx, draw, { roll = 0.006, bob = 1 } = {}) {
  const lift = Math.sin(time * 0.9 + wx * 0.013) * bob;
  const tilt = Math.sin(time * 0.7 + wx * 0.01) * roll;
  const keelY = waterY + line + lift;
  // Above the water.
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - w, -2000, w * 2, waterY + 2000 + 0.5);
  ctx.clip();
  ctx.translate(x, keelY);
  ctx.rotate(tilt);
  draw(ctx);
  ctx.restore();
  // Below: the reflection (mirrored at the waterline), dimmed and tinted with the sea, in slices
  // that sway apart a little with the ripples.
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - w, waterY + 0.5, w * 2, 40);
  ctx.clip();
  for (let s = 0; s < 8; s++) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - w, waterY + 0.5 + s * 3, w * 2, 3);
    ctx.clip();
    ctx.globalAlpha = 0.24 * (1 - s / 8);
    ctx.translate(x + Math.sin(time * 2 + s * 1.3 + wx * 0.02) * (0.6 + s * 0.25), waterY * 2 - keelY + 2 * line);
    ctx.scale(1, -1);
    ctx.rotate(-tilt);
    draw(ctx);
    ctx.restore();
  }
  ctx.restore();
  // The foam where the hull meets the sea.
  ctx.save();
  ctx.strokeStyle = '#f4fffc';
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  for (let i = -w * 0.86; i <= w * 0.86; i += 3) {
    const y = waterY + 0.5 + Math.sin(i * 0.2 + time * 3 + wx) * 0.6;
    if (i === -w * 0.86) ctx.moveTo(x + i, y);
    else ctx.lineTo(x + i, y);
  }
  ctx.stroke();
  ctx.restore();
}
