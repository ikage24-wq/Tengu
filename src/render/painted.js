// Painted backdrops (the map redraw, 2026-11): soft storybook layers in place of the flat
// silhouettes, picked by a theme's `painted` key. Each is a few planes that fade into the air with
// distance (paler, softer, nearer the sky's colour, a haze at each foot), lit from the upper left
// with a warm rim on the sides facing the light, and alive: crowns sway, light shafts shimmer,
// motes drift in the light. A matching front layer drifts out of focus in front of the player.
//
// Everything is seeded from a tree's own index, so nothing jitters as the camera moves, and motion
// runs on time from each thing's own place in the world.

import { mix, shade } from './pixel.js';

const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const hexA = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;

// Things spaced `spacing` apart along a plane that scrolls at `factor` of the camera.
function repeat(camX, factor, spacing, width, draw) {
  const off = camX * factor;
  const first = Math.floor(off / spacing) - 2;
  const count = Math.ceil(width / spacing) + 5;
  for (let k = 0; k < count; k++) draw(first + k, (first + k) * spacing - off);
}

// A foliage clump, drawn once into a little picture of its own (at the screen's density) and
// placed each frame, its sway applied as a lean of the whole clump, top moving most: the same
// look, one drawing instead of dozens of curves every frame.
const clumpCache = new Map();
const CLUMP_MAX = 500;
function clump(ctx, x, y, r, c, seed, sway = 0) {
  if (typeof document === 'undefined') return clumpLive(ctx, x, y, r, c, seed, sway);
  const m = ctx.getTransform();
  const scale = Math.round(Math.hypot(m.a, m.b) * 100) / 100 || 1;
  // (Its middle sits on a whole screen pixel of the picture, and the picture is placed on whole
  // screen pixels at one to one, so it never blurs or shimmers as the camera moves.)
  const hw = Math.round((r * 1.5 + 4) * scale) / scale;
  const hh = Math.round((r * 1.35 + 5) * scale) / scale;
  const k = `${seed}|${r.toFixed(2)}|${c.base}|${c.lit}|${c.shadow}|${c.glint}|${scale}`;
  let s = clumpCache.get(k);
  if (s) {
    clumpCache.delete(k);
    clumpCache.set(k, s);
  } else {
    s = document.createElement('canvas');
    s.width = Math.ceil(hw * 2 * scale);
    s.height = Math.ceil(hh * 2 * scale);
    const g = s.getContext('2d');
    g.setTransform(scale, 0, 0, scale, hw * scale, hh * scale);
    clumpLive(g, 0, 0, r, c, seed, 0);
    clumpCache.set(k, s);
    if (clumpCache.size > CLUMP_MAX) clumpCache.delete(clumpCache.keys().next().value);
  }
  ctx.save();
  ctx.translate(Math.round((x + sway * 0.3) * scale) / scale, Math.round(y * scale) / scale);
  if (sway) ctx.transform(1, 0, -(sway * 0.7) / r, 1, 0, 0);
  ctx.drawImage(s, -hw, -hh, s.width / scale, s.height / scale);
  ctx.restore();
}

// A foliage clump: overlapping round leaf masses, a darker underside, and lit tops toward the
// upper left. `sway` leans the top a little.
function clumpLive(ctx, x, y, r, c, seed, sway = 0) {
  const n = 5;
  const blobs = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + seed * 6;
    const d = r * (0.42 + 0.2 * hash(seed * 31 + i));
    blobs.push([x + Math.cos(a) * d + sway * (0.5 - Math.sin(a) * 0.5), y + Math.sin(a) * d * 0.72, r * (0.5 + 0.22 * hash(seed * 17 + i))]);
  }
  const fill = (col, dx, dy, k = 1) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    for (const [bx, by, br] of blobs) {
      ctx.moveTo(bx + dx + br * k, by + dy);
      ctx.arc(bx + dx, by + dy, br * k, 0, Math.PI * 2);
    }
    ctx.moveTo(x + r * 0.62 + sway * 0.5, y);
    ctx.arc(x + sway * 0.5, y, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
  };
  fill(c.shadow, 1.5, 3);
  fill(c.lit, -1.5, -1.5);
  fill(c.base, 0.6, 0.6, 0.97);
  // A few bright leaf highlights on the top left.
  ctx.fillStyle = c.glint;
  for (let i = 0; i < 3; i++) {
    const [bx, by, br] = blobs[i];
    if (by > y) continue;
    ctx.beginPath();
    ctx.ellipse(bx - br * 0.35, by - br * 0.45, br * 0.32, br * 0.18, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// A trunk from (x, base) up to `top`, `w` wide at the foot, flaring into roots, with bark lines
// and a lit left edge.
function trunk(ctx, x, base, top, w, c, seed, roots = true) {
  const lean = (hash(seed + 3) - 0.5) * 6;
  ctx.fillStyle = c.bark;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.36 + lean, top);
  ctx.bezierCurveTo(x - w * 0.42 + lean * 0.6, (top + base) / 2, x - w * 0.5, base - 18, x - w * (roots ? 1.05 : 0.55), base + 2);
  ctx.lineTo(x + w * (roots ? 1.05 : 0.55), base + 2);
  ctx.bezierCurveTo(x + w * 0.5, base - 18, x + w * 0.42 + lean * 0.6, (top + base) / 2, x + w * 0.36 + lean, top);
  ctx.closePath();
  ctx.fill();
  // The lit side and the shaded side.
  ctx.fillStyle = c.barkLit;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.36 + lean, top);
  ctx.bezierCurveTo(x - w * 0.42 + lean * 0.6, (top + base) / 2, x - w * 0.5, base - 18, x - w * (roots ? 0.9 : 0.5), base + 2);
  ctx.lineTo(x - w * 0.3, base + 2);
  ctx.bezierCurveTo(x - w * 0.24, base - 20, x - w * 0.2 + lean * 0.6, (top + base) / 2, x - w * 0.14 + lean, top);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = c.barkDark;
  ctx.lineWidth = Math.max(1, w * 0.07);
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const bx = x + (hash(seed * 7 + i) - 0.4) * w * 0.5;
    const y0 = top + (base - top) * (0.15 + 0.25 * i);
    ctx.beginPath();
    ctx.moveTo(bx + lean * 0.5, y0);
    ctx.quadraticCurveTo(bx + 2 + lean * 0.3, y0 + 18, bx - 1 + lean * 0.2, y0 + 34);
    ctx.stroke();
  }
}

// A vine hanging from (x, y), `len` long, swaying from its root, little leaves along it.
function vine(ctx, x, y, len, c, time, seed) {
  const sw = Math.sin(time * 0.9 + seed * 5) * 4;
  ctx.strokeStyle = c.vine;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + sw * 0.4, y + len * 0.5, x + sw, y + len);
  ctx.stroke();
  ctx.fillStyle = c.leaf;
  for (let i = 1; i <= 4; i++) {
    const u = i / 4.4;
    const lx = x + sw * u * u;
    const ly = y + len * u;
    ctx.beginPath();
    ctx.ellipse(lx + (i % 2 ? 2.4 : -2.4), ly, 2.6, 1.4, i % 2 ? 0.6 : -0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

// A soft band of the air's colour at the foot of a plane, so it stands in haze.
function haze(ctx, c, width, y, k, h = 70) {
  const g = ctx.createLinearGradient(0, y - h, 0, y + 10);
  g.addColorStop(0, hexA(c, 0));
  g.addColorStop(1, hexA(c, k));
  ctx.fillStyle = g;
  ctx.fillRect(0, y - h, width, h + 400);
}

// ---------- The woods ----------

// The colours of one plane: the theme's foliage pulled toward the air by `k` (aerial perspective),
// lit toward the light's colour, its shadows toward violet.
function planeColors(t, base, air, k) {
  const b = mix(base, air, k);
  return {
    base: b, lit: mix(b, t.sun ?? '#fff6dc', 0.32), glint: mix(b, '#ffffff', 0.45 - k * 0.2), shadow: mix(shade(b, -10), '#6a5aa8', 0.12 * (1 - k)),
    bark: mix(mix('#8a6a58', base, 0.25), air, k), barkLit: mix(mix('#b8957a', base, 0.2), air, k), barkDark: mix(mix('#5e4438', base, 0.2), air, k),
    vine: mix(shade(base, -14), air, k), leaf: mix(shade(base, 6), air, k),
  };
}

export function drawPaintedForest(ctx, t, cam, width, height, time, layerY, air) {
  if (t.forestStyle === 'mossy') return drawPaintedMossy(ctx, t, cam, width, height, time, layerY, air);
  if (t.forestStyle === 'glade') return drawPaintedGlade(ctx, t, cam, width, height, time, layerY, air);
  // 1. The far tree line: a wall of soft round crowns deep in the mist.
  const farY = layerY(70, 0.04);
  const cf = planeColors(t, t.far, air, 0.58);
  repeat(cam.x, 0.08, 26, width, (i, x) => {
    const r = 18 + hash(i) * 14;
    const y = farY - 24 - hash(i + 11) * 26;
    ctx.fillStyle = cf.lit;
    ctx.beginPath();
    ctx.arc(x - 1.5, y - 1.5, r, 0, Math.PI * 2);
    ctx.fill();
  });
  repeat(cam.x, 0.08, 26, width, (i, x) => {
    const r = 18 + hash(i) * 14;
    const y = farY - 24 - hash(i + 11) * 26;
    ctx.fillStyle = cf.base;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - r, y, r * 2, 300);
  });
  haze(ctx, air, width, farY + 10, 0.55, 90);

  // 2. A middle row of slim trees, half in the mist.
  const midY = layerY(36, 0.07);
  const cm = planeColors(t, mix(t.far, t.mid, 0.5), air, 0.36);
  repeat(cam.x, 0.18, 74, width, (i, x) => {
    if (hash(i + 2) < 0.18) return;
    const h = 110 + hash(i) * 70;
    const xx = x + hash(i + 5) * 30;
    trunk(ctx, xx, midY, midY - h, 6 + hash(i + 7) * 4, cm, i, false);
    const sway = Math.sin(time * 0.6 + i * 1.3) * 1.5;
    clump(ctx, xx, midY - h - 6, 26 + hash(i + 9) * 10, cm, i, sway);
    clump(ctx, xx - 16, midY - h + 18, 18 + hash(i + 4) * 6, cm, i + 0.5, sway);
    clump(ctx, xx + 17, midY - h + 24, 17 + hash(i + 6) * 6, cm, i + 0.7, sway);
  });
  haze(ctx, air, width, midY + 6, 0.38, 80);

  // 3. Shafts of sunlight slanting down through the canopy, shimmering slowly, motes drifting in
  // them.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  repeat(cam.x, 0.25, 230, width, (i, x) => {
    if (hash(i + 21) < 0.35) return;
    const w = 26 + hash(i + 22) * 30;
    const a = (0.06 + 0.035 * Math.sin(time * 0.5 + i * 2.1)) * (0.7 + 0.6 * hash(i + 23));
    const x0 = x + hash(i + 24) * 120;
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, hexA(t.sun ?? '#fff6dc', a * 1.4));
    g.addColorStop(0.75, hexA(t.sun ?? '#fff6dc', a * 0.6));
    g.addColorStop(1, hexA(t.sun ?? '#fff6dc', 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0, -10);
    ctx.lineTo(x0 + w, -10);
    ctx.lineTo(x0 + w * 1.6 - 120, height);
    ctx.lineTo(x0 - 120, height);
    ctx.closePath();
    ctx.fill();
    for (let k = 0; k < 6; k++) {
      const u = (hash(i * 9 + k) + time * 0.03 * (0.5 + hash(k + i))) % 1;
      const mx = x0 + w * 0.5 - u * 110 + Math.sin(time * 0.8 + k * 2 + i) * 6;
      const my = u * height * 0.9;
      ctx.fillStyle = hexA('#fffbe8', 0.35 * Math.sin(u * Math.PI));
      ctx.beginPath();
      ctx.arc(mx, my, 1.1 + hash(k + i * 3) * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.restore();

  // 4. Big near trees: thick trunks with flaring roots, bark, crowns and hanging vines.
  const nearY = layerY(12, 0.1);
  const cn = planeColors(t, t.mid, air, 0.16);
  repeat(cam.x, 0.38, 190, width, (i, x) => {
    if (hash(i + 31) < 0.2) return;
    const xx = x + hash(i + 32) * 70;
    const w = 18 + hash(i + 33) * 10;
    const top = nearY - 210 - hash(i + 34) * 60;
    trunk(ctx, xx, nearY, top, w, cn, i + 100);
    const sway = Math.sin(time * 0.5 + (xx + cam.x * 0.38) * 0.01) * 2;
    for (let k = 0; k < 4; k++) clump(ctx, xx + (k - 1.5) * 26 + hash(i * 3 + k) * 10, top + (k % 2) * 16 - 4, 30 + hash(i * 5 + k) * 12, cn, i * 4 + k, sway);
    for (let k = 0; k < 3; k++) vine(ctx, xx + (k - 1) * 30 + hash(i + k) * 8, top + 26, 40 + hash(i * 7 + k) * 60, cn, time, i * 3 + k);
  });
  haze(ctx, air, width, nearY + 4, 0.22, 60);

  // 5. The canopy closing overhead: a band of leaf clumps hanging across the top of the view.
  const cc = planeColors(t, shade(t.mid, -4), air, 0.1);
  const topY = -cam.y * 0.04 - 6;
  if (topY > -80) {
    repeat(cam.x, 0.42, 44, width, (i, x) => {
      const r = 26 + hash(i + 41) * 16;
      clump(ctx, x, topY + hash(i + 42) * 14, r, cc, i + 300, Math.sin(time * 0.6 + i) * 1.5);
      if (hash(i + 43) > 0.55) vine(ctx, x + 6, topY + r * 0.6, 30 + hash(i + 44) * 50, cc, time, i + 500);
    });
  }
}

// Mossy Woods' own backdrop (redrawn 2026-11-12, the player's call: the round trees on hills read
// as a meadow). A wood of giant trees, like the ones you climb, seen deep into the mist: a warm
// glow far in among them; three rows of giant trunks behind the play, each mistier and bluer than
// the one before, a soft fog lying at each row's foot; a continuous leafy roof across the top with
// a scalloped, sun-rimmed underside and a few vines hanging from it; a few soft sunbeams falling
// through its gaps; near, dark ferns and grass along the bottom, framing it, swaying a little.
// Few, big shapes and clear planes, so the play reads in front of it.
function mossyTrunk(ctx, x, base, top, w, body, lit, seed) {
  // A giant trunk: tapering up, flaring into roots at its foot, lit down one side.
  const lean = (hash(seed + 3) - 0.5) * 4;
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(x - w * 1.25, base + 2);
  ctx.quadraticCurveTo(x - w * 0.62, base - w * 0.35, x - w * 0.5, base - w * 1.2);
  ctx.lineTo(x - w * 0.4 + lean, top);
  ctx.lineTo(x + w * 0.4 + lean, top);
  ctx.lineTo(x + w * 0.5, base - w * 1.2);
  ctx.quadraticCurveTo(x + w * 0.62, base - w * 0.35, x + w * 1.25, base + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = lit;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.5, base - w * 1.2);
  ctx.lineTo(x - w * 0.4 + lean, top);
  ctx.lineTo(x - w * 0.18 + lean, top);
  ctx.lineTo(x - w * 0.26, base - w * 1.2);
  ctx.closePath();
  ctx.fill();
}
function fogBand(ctx, width, y, h, c, k) {
  const g = ctx.createLinearGradient(0, y - h, 0, y + h * 0.4);
  g.addColorStop(0, hexA(c, 0));
  g.addColorStop(0.75, hexA(c, k));
  g.addColorStop(1, hexA(c, k));
  ctx.fillStyle = g;
  ctx.fillRect(0, y - h, width, h * 1.4 + 400);
}
// ---------- The Whispering Glade (its remake, 2026-11-12) ----------

// The valley's backdrop: a warm glow, pale misty cliffs far off with thin waterfalls of their own,
// then a band of round blossoming trees on soft meadow hills with mist at their feet, and a few
// soft sunbeams. No blurred leaves across the front: one calm, open view.
function gladeMassif(ctx, x, base, w, h, body, lit, seed) {
  // A far cliff: a rounded rock tower with a lumpy top, lit down its left side.
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, base + 400);
  ctx.lineTo(x - w / 2, base - h * 0.55);
  const bumps = 4;
  for (let k = 0; k <= bumps; k++) {
    const bx = x - w / 2 + (w * k) / bumps;
    const by = base - h - (k % 2 ? 6 : 0) - hash(seed + k) * 14;
    if (k === 0) ctx.quadraticCurveTo(x - w / 2, by, bx + w * 0.06, by);
    else ctx.quadraticCurveTo(bx - w / (bumps * 2), by - 12, bx, by);
  }
  ctx.quadraticCurveTo(x + w / 2, base - h, x + w / 2, base - h * 0.55);
  ctx.lineTo(x + w / 2, base + 400);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = lit;
  ctx.fillRect(x - w / 2, base - h * 0.55, w * 0.16, h * 0.55 + 400);
}
function drawPaintedGlade(ctx, t, cam, width, height, time, layerY, air) {
  const sun = t.sun ?? '#fff6dc';
  // 1. The warm glow of the morning over the valley.
  {
    const gx = width * 0.62 - ((cam.x * 0.02) % width) * 0.2;
    const gy = layerY(120, 0.03) - 140;
    const g = ctx.createRadialGradient(gx, gy, 10, gx, gy, Math.max(width, height) * 0.75);
    g.addColorStop(0, hexA(sun, 0.6));
    g.addColorStop(0.4, hexA(sun, 0.16));
    g.addColorStop(1, hexA(sun, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }
  // 2. Far cliffs in the mist, a thin waterfall down some of them.
  const farY = layerY(110, 0.03);
  const rock = mix('#9ec4c4', air, 0.55);
  const rockLit = mix(rock, sun, 0.3);
  repeat(cam.x, 0.04, 260, width, (i, x) => {
    if (hash(i + 3) < 0.25) return;
    const xx = x + hash(i + 4) * 90;
    const w = 90 + hash(i + 5) * 70;
    const h = 120 + hash(i + 6) * 90;
    gladeMassif(ctx, xx, farY, w, h, rock, rockLit, i);
    if (hash(i + 7) > 0.55) {
      // Its waterfall: a pale ribbon with soft streaks running down it.
      const fx = xx + (hash(i + 8) - 0.5) * w * 0.3;
      const top = farY - h + 16;
      const water = mix('#e8fbff', air, 0.35);
      ctx.fillStyle = hexA(water, 0.75);
      ctx.fillRect(fx - 3, top, 6, h + 40);
      ctx.fillStyle = hexA('#ffffff', 0.45);
      for (let k = 0; k < 4; k++) {
        const yy = top + (((time * 40 + k * (h / 4)) % (h + 40)) + h + 40) % (h + 40);
        ctx.fillRect(fx - 1.5, yy, 2, 14);
      }
    }
  });
  fogBand(ctx, width, farY, 70, air, 0.55);
  // 3. Round blossoming trees on soft hills, two rows, the far row mistier.
  const rows = [
    { f: 0.08, y: layerY(64, 0.06), gap: 70, r: [16, 24], c: '#7cc8a0', a: 0.45 },
    { f: 0.14, y: layerY(30, 0.1), gap: 96, r: [22, 32], c: '#62b88a', a: 0.26 },
  ];
  rows.forEach((row, ri) => {
    const crown = mix(row.c, air, row.a);
    const lit = mix(crown, sun, 0.3);
    const trunk = mix('#8a7060', air, row.a + 0.15);
    const blossom = mix('#ffc8dc', air, row.a * 0.8);
    // The hill they stand on.
    ctx.fillStyle = mix(mix(row.c, '#8fd090', 0.5), air, row.a);
    ctx.beginPath();
    ctx.moveTo(-4, row.y + 400);
    for (let sx = -4; sx <= width + 8; sx += 8) {
      const k = sx + cam.x * row.f;
      ctx.lineTo(sx, row.y - 6 - 8 * Math.sin(k * 0.006 + ri * 2) - 3 * Math.sin(k * 0.019 + ri));
    }
    ctx.lineTo(width + 8, row.y + 400);
    ctx.closePath();
    ctx.fill();
    repeat(cam.x, row.f, row.gap, width, (i, x) => {
      if (hash(i * 2.3 + ri * 19) < 0.18) return;
      const xx = x + hash(i + ri * 41) * row.gap * 0.4;
      const r = row.r[0] + hash(i * 5 + ri) * (row.r[1] - row.r[0]);
      const k = xx + cam.x * row.f;
      const gy = row.y - 6 - 8 * Math.sin(k * 0.006 + ri * 2) - 3 * Math.sin(k * 0.019 + ri);
      ctx.fillStyle = trunk;
      ctx.fillRect(xx - r * 0.1, gy - r * 1.2, r * 0.2, r * 1.2 + 4);
      const cy = gy - r * 1.5;
      ctx.fillStyle = crown;
      ctx.beginPath();
      ctx.ellipse(xx, cy, r, r * 0.86, 0, 0, Math.PI * 2);
      ctx.ellipse(xx - r * 0.6, cy + r * 0.25, r * 0.6, r * 0.52, 0, 0, Math.PI * 2);
      ctx.ellipse(xx + r * 0.62, cy + r * 0.22, r * 0.6, r * 0.52, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = lit;
      ctx.beginPath();
      ctx.ellipse(xx - r * 0.28, cy - r * 0.34, r * 0.5, r * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = blossom;
      for (let b = 0; b < 4; b++) {
        ctx.beginPath();
        ctx.arc(xx + (hash(i * 9 + b + ri) - 0.5) * r * 1.4, cy + (hash(i * 11 + b + ri) - 0.5) * r, 1.8 + ri * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    fogBand(ctx, width, row.y, 40 - ri * 8, air, 0.42 - ri * 0.1);
  });
  // 4. A few soft sunbeams slanting down into the valley.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  repeat(cam.x, 0.2, 380, width, (i, x) => {
    if (hash(i + 61) < 0.5) return;
    const w = 34 + hash(i + 62) * 24;
    const a = (0.045 + 0.02 * Math.sin(time * 0.3 + i * 1.9)) * (0.7 + 0.5 * hash(i + 63));
    const x0 = x + hash(i + 64) * 160;
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, hexA(sun, a * 1.3));
    g.addColorStop(0.8, hexA(sun, a * 0.3));
    g.addColorStop(1, hexA(sun, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0, -10);
    ctx.lineTo(x0 + w, -10);
    ctx.lineTo(x0 + w * 1.4 - 140, height);
    ctx.lineTo(x0 - 140, height);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
}

function drawPaintedMossy(ctx, t, cam, width, height, time, layerY, air) {
  const sun = t.sun ?? '#fff6dc';
  const rowY = [layerY(84, 0.03), layerY(52, 0.06), layerY(22, 0.1)];
  // 1. A warm glow far in among the trees.
  {
    const gx = width * 0.55 - ((cam.x * 0.02) % width) * 0.2;
    const gy = rowY[0] - 70;
    const g = ctx.createRadialGradient(gx, gy, 10, gx, gy, Math.max(width, height) * 0.7);
    g.addColorStop(0, hexA(sun, 0.55));
    g.addColorStop(0.35, hexA(sun, 0.18));
    g.addColorStop(1, hexA(sun, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }
  // 2. Three rows of giant trunks, far to near, each mistier the further it stands.
  const rows = [
    { f: 0.05, gap: 120, w: [9, 14], c: '#8cc4c0', a: 0.62 },
    { f: 0.12, gap: 190, w: [14, 20], c: '#76b4a6', a: 0.42 },
    { f: 0.2, gap: 280, w: [20, 28], c: '#5e9e88', a: 0.24 },
  ];
  rows.forEach((r, ri) => {
    const base = rowY[ri];
    const body = mix(r.c, air, r.a);
    const lit = mix(body, sun, 0.28);
    repeat(cam.x, r.f, r.gap, width, (i, x) => {
      if (hash(i * 3.1 + ri * 17) < 0.12) return;
      const xx = x + hash(i + ri * 31) * r.gap * 0.5;
      const w = r.w[0] + hash(i * 7 + ri) * (r.w[1] - r.w[0]);
      mossyTrunk(ctx, xx, base, -40, w, body, lit, i + ri * 100);
    });
    // The soft ground this row stands on, and the fog lying at its foot.
    ctx.fillStyle = mix(mix(r.c, '#6aa878', 0.4), air, r.a);
    ctx.beginPath();
    ctx.moveTo(-4, base + 400);
    for (let sx = -4; sx <= width + 8; sx += 8) {
      const k = sx + cam.x * r.f;
      ctx.lineTo(sx, base - 3 - 4 * Math.sin(k * 0.011 + ri * 2) - 2 * Math.sin(k * 0.027 + ri));
    }
    ctx.lineTo(width + 8, base + 400);
    ctx.closePath();
    ctx.fill();
    fogBand(ctx, width, base, 46 - ri * 8, air, 0.5 - ri * 0.12);
  });
  // 3. A few soft sunbeams falling through gaps in the leaves.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  repeat(cam.x, 0.22, 360, width, (i, x) => {
    if (hash(i + 21) < 0.45) return;
    const w = 30 + hash(i + 22) * 26;
    const a = (0.05 + 0.02 * Math.sin(time * 0.35 + i * 2.1)) * (0.7 + 0.5 * hash(i + 23));
    const x0 = x + hash(i + 24) * 160;
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, hexA(sun, a * 1.3));
    g.addColorStop(0.8, hexA(sun, a * 0.35));
    g.addColorStop(1, hexA(sun, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0, -10);
    ctx.lineTo(x0 + w, -10);
    ctx.lineTo(x0 + w * 1.5 - 120, height);
    ctx.lineTo(x0 - 120, height);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
  // 4. The leafy roof across the top: one mass with a scalloped underside lit by the sun, a few
  // vines hanging from it.
  const roofY = 34 - cam.y * 0.05 + 30;
  if (roofY > -60) {
    const leaf = mix('#4f9c6c', air, 0.2);
    const rim = mix(leaf, sun, 0.35);
    const edgeAt = (sx) => {
      const k = sx + cam.x * 0.26;
      const u = ((k % 64) + 64) % 64;
      return roofY + Math.sin((u / 64) * Math.PI) * 16 + Math.sin(k * 0.013) * 10;
    };
    for (const [c, dy] of [[rim, 3], [leaf, 0]]) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(-4, -60);
      for (let sx = -4; sx <= width + 6; sx += 3) ctx.lineTo(sx, edgeAt(sx) + dy);
      ctx.lineTo(width + 6, -60);
      ctx.closePath();
      ctx.fill();
    }
    // Leaf texture up in the roof: a few lighter clusters.
    ctx.fillStyle = mix(leaf, sun, 0.15);
    repeat(cam.x, 0.26, 52, width, (i, x) => {
      const yy = roofY - 22 - hash(i + 5) * 26;
      ctx.beginPath();
      ctx.ellipse(x + hash(i) * 20, yy, 14 + hash(i + 2) * 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    const cv = planeColors(t, leaf, air, 0);
    repeat(cam.x, 0.26, 150, width, (i, x) => {
      if (hash(i + 44) < 0.4) return;
      const vx = x + hash(i + 45) * 60;
      vine(ctx, vx, edgeAt(vx) - 2, 24 + hash(i + 46) * 40, cv, time, i + 500);
    });
  }
  // 5. Near: dark ferns and grass along the bottom, swaying a little.
  const nearY = layerY(-4, 0.14);
  const fern = mix('#3f7f58', air, 0.08);
  ctx.strokeStyle = fern;
  ctx.fillStyle = fern;
  ctx.lineCap = 'round';
  repeat(cam.x, 0.36, 46, width, (i, x) => {
    const fx = x + hash(i + 90) * 30;
    const sw = Math.sin(time * 0.9 + fx * 0.03) * 1.4;
    const h = 14 + hash(i + 91) * 14;
    if (hash(i + 92) > 0.45) {
      // A fern: fronds fanning out and arching over.
      ctx.lineWidth = 1.6;
      for (const d of [-1, -0.45, 0.45, 1]) {
        ctx.beginPath();
        ctx.moveTo(fx, nearY);
        ctx.quadraticCurveTo(fx + d * h * 0.5 + sw, nearY - h, fx + d * h * 0.9 + sw, nearY - h * 0.55);
        ctx.stroke();
      }
    } else {
      // A tuft of grass.
      ctx.lineWidth = 1.2;
      for (const d of [-3, -1, 1, 3]) {
        ctx.beginPath();
        ctx.moveTo(fx + d, nearY);
        ctx.lineTo(fx + d * 1.8 + sw, nearY - h * 0.6 - Math.abs(d));
        ctx.stroke();
      }
    }
  });
  ctx.fillRect(0, nearY - 1, width, height);
}

// Soft-focus sprites. The front layers' out-of-focus shapes are blurred once into small offscreen
// canvases (per shape and drawing scale) and drawn from there every frame, moved and leaned for
// their sway, instead of re-blurring each fill each frame (a canvas blur costs ~10 ms a fill
// without a GPU). Each fill is blurred and laid in at the layer's alpha just as on screen, and
// source-over stacks the same either way, so the sprite looks the same as drawing it live.
const softCache = new Map();
const SOFT_MAX = 72;
function softSprite(ctx, key, hw, hh, blur, alpha, paint) {
  const m = ctx.getTransform();
  const scale = Math.round(Math.hypot(m.a, m.b) * 100) / 100 || 1;
  const k = `${key}|${scale}`;
  let s = softCache.get(k);
  if (s) {
    softCache.delete(k);
    softCache.set(k, s);
    return s;
  }
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = Math.ceil(hw * 2 * scale);
  c.height = Math.ceil(hh * 2 * scale);
  const g = c.getContext('2d');
  g.setTransform(scale, 0, 0, scale, hw * scale, hh * scale);
  g.filter = `blur(${blur}px)`;
  g.globalAlpha = alpha;
  paint(g);
  s = { c, hw, hh, w: c.width / scale, h: c.height / scale };
  softCache.set(k, s);
  if (softCache.size > SOFT_MAX) softCache.delete(softCache.keys().next().value);
  return s;
}
const drawSoft = (ctx, s) => ctx.drawImage(s.c, -s.hw, -s.hh, s.w, s.h);

// A soft clump drawn from its sprite. Its sway moves each blob by sway * (0.5 - sin(a) / 2), which
// bends the clump's outline, so the sprite is kept at sway steps of 0.75 px and the rest of the
// way (under 0.4 px) is a lean: the middle moves half of it, the top all of it, the foot none.
// Clumps off the screen are skipped, so only the few in view hold sprites.
const SWAY_STEP = 0.75;
function softClump(ctx, x, y, r, c, seed, sway, blur, alpha, width, height) {
  const hw = r * 1.36 + 9;
  const hh = r * 1.17 + 10;
  if (x + hw + 4 < 0 || x - hw - 4 > width || y + hh < 0 || y - hh > height) return;
  const q = Math.round(sway / SWAY_STEP) * SWAY_STEP;
  const s = softSprite(ctx, `clump|${seed}|${r}|${q}|${c.base}|${c.lit}`, hw, hh, blur, alpha, (g) => clumpLive(g, 0, 0, r, c, seed, q));
  if (!s) return;
  const rest = sway - q;
  ctx.save();
  ctx.translate(x + rest * 0.5, y);
  ctx.transform(1, 0, (-rest * 0.5) / (0.72 * 0.52 * r), 1, 0, 0);
  drawSoft(ctx, s);
  ctx.restore();
}

// Out-of-focus leaves drifting past in front of the player at the top corners and along the
// bottom, darker and cooler than the play space, swaying.
export function drawPaintedForestFront(ctx, t, cam, width, height, time) {
  // (Mossy Woods keeps its view clear: no blurred leaves across the front, the player's taste for
  // one calm backdrop, 2026-11-11.)
  if (t.forestStyle === 'mossy' || t.forestStyle === 'glade') return;
  const base = mix(shade(t.mid, -22), '#2a3a4a', 0.35);
  const c = { base, lit: mix(base, t.sun ?? '#fff6dc', 0.12), glint: mix(base, '#ffffff', 0.12), shadow: shade(base, -8) };
  ctx.save();
  ctx.globalAlpha = 1;
  repeat(cam.x, 1.25, 520, width, (i, x) => {
    const sw = Math.sin(time * 0.7 + i * 1.7) * 3;
    if (hash(i + 61) < 0.55) {
      const y = -8 - cam.y * 0.02;
      softClump(ctx, x + hash(i + 62) * 200, y, 30 + hash(i + 63) * 14, c, i + 700, sw, 2.2, 0.82, width, height);
      softClump(ctx, x + hash(i + 62) * 200 + 34, y + 10, 22, c, i + 701, sw, 2.2, 0.82, width, height);
    }
    if (hash(i + 64) < 0.45) {
      const by = height + 18;
      softClump(ctx, x + 260 + hash(i + 65) * 160, by, 26 + hash(i + 66) * 10, c, i + 800, sw * 0.6, 2.2, 0.82, width, height);
    }
  });
  ctx.restore();
}

// ---------- Woodland life ----------

// A squirrel in profile facing right (flip for left): a round body, a big curled tail, a round
// head with an ear and a bright eye. `run` is the stride (0..1), `sit` how far it has sat up (0..1),
// `flick` the tail's flick, `nibble` its jaw.
function squirrel(ctx, x, y, dir, run, sit, flick, nibble) {
  const fur = '#c98a5a';
  const furDk = '#a46a44';
  const belly = '#f6dcc0';
  const ink = '#5a3a2c';
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * 1.25, 1.25);
  const bob = run > 0 ? -Math.abs(Math.sin(run * Math.PI * 2)) * 2.2 : 0;
  const lean = run > 0 ? 0.25 : -0.5 * sit;
  ctx.translate(0, bob);
  // The tail: a big S curl behind, lifting and flicking.
  const tl = -6 - sit * 1.5;
  ctx.fillStyle = furDk;
  ctx.beginPath();
  ctx.moveTo(-4, -2);
  ctx.bezierCurveTo(-13, -1 + flick, -15 + flick, -12, -9 + flick * 0.6, -15 + tl * 0.2);
  ctx.bezierCurveTo(-3 + flick, -17, -4, -9, -9 + flick * 0.4, -8);
  ctx.bezierCurveTo(-8, -6, -6, -4, -3, -4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.moveTo(-4, -3);
  ctx.bezierCurveTo(-12, -2 + flick, -13.5 + flick, -11.5, -9 + flick * 0.6, -14 + tl * 0.2);
  ctx.bezierCurveTo(-5 + flick, -15, -5.5, -9.5, -9 + flick * 0.4, -9);
  ctx.closePath();
  ctx.fill();
  // The body, leaning forward on the run, upright when sitting.
  ctx.save();
  ctx.rotate(lean);
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(0, -4, 5.4, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = belly;
  ctx.beginPath();
  ctx.ellipse(2, -3, 2.8, 3, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // The head.
  const hx = 4.6;
  const hy = -8 - sit * 1.5;
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(hx, hy, 3.6, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(hx - 1, hy - 3.4, 1.1, 1.8, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = belly;
  ctx.beginPath();
  ctx.ellipse(hx + 2.2, hy + 1 + nibble * 0.4, 1.4, 1.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.arc(hx + 1.4, hy - 0.8, 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(hx + 1.7, hy - 1.1, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff9fb8';
  ctx.beginPath();
  ctx.arc(hx + 0.6, hy + 0.8, 0.6, 0, Math.PI * 2);
  ctx.fill();
  // Paws held up to the mouth when sitting, or reaching on the run.
  ctx.fillStyle = furDk;
  if (sit > 0.5) {
    ctx.beginPath();
    ctx.ellipse(hx + 1.6, hy + 3 + nibble * 0.3, 1.2, 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // Feet: scampering pairs, or tucked under when sitting.
  ctx.fillStyle = furDk;
  const s = Math.sin(run * Math.PI * 2);
  ctx.beginPath();
  ctx.ellipse(-3 + (run > 0 ? s * 2 : 0), -0.6, 2, 1, 0, 0, Math.PI * 2);
  ctx.ellipse(2.6 - (run > 0 ? s * 2 : 0), -0.6, 1.6, 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// A songbird in flight: a round body and two wings beating (or folded in a glide).
function songbird(ctx, x, y, dir, beat, c) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  const w = Math.sin(beat * Math.PI * 2);
  ctx.fillStyle = shade(c, -14);
  ctx.beginPath();
  ctx.moveTo(-1, -1);
  ctx.quadraticCurveTo(-4, -2 - w * 6, -8, -1 - w * 7);
  ctx.quadraticCurveTo(-4, 0, -1, 0.5);
  ctx.fill();
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(0, 0, 3.6, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-3, 0);
  ctx.lineTo(-6.5, -1.2);
  ctx.lineTo(-6, 1.4);
  ctx.fill();
  ctx.fillStyle = '#ffe4c8';
  ctx.beginPath();
  ctx.ellipse(1.2, 0.8, 2, 1.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffb35a';
  ctx.beginPath();
  ctx.moveTo(3.4, -0.6);
  ctx.lineTo(5.4, -0.1);
  ctx.lineTo(3.4, 0.5);
  ctx.fill();
  ctx.fillStyle = '#3a2d4f';
  ctx.beginPath();
  ctx.arc(2, -0.8, 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shade(c, 8);
  ctx.beginPath();
  ctx.moveTo(1, -1);
  ctx.quadraticCurveTo(-2, -2 + w * 5, -6, -2 + w * 6);
  ctx.quadraticCurveTo(-2, 0, 1, 0);
  ctx.fill();
  ctx.restore();
}

// Mossy Woods' own ambience (2026-11-12, remade at the player's ask: calm, few, tied to its giant
// trees; no animals). By day, now and then a single leaf comes off a tree's crown and drifts down,
// fluttering and turning slowly, and fades before it lands (a couple across the map at a time); a
// few tiny golden specks of light float lazily in each crown. At night the specks give way to a few
// soft fireflies drifting round each trunk, glowing and fading. All of it from the clock and each
// one's own seed, so nothing moves in step.
export function drawMossyAmbience(ctx, map, cam, width, height, time) {
  const night = Math.min(1, Math.max(0, map.night ?? 0));
  const ground = map.groundY ?? 1000;
  const trees = (map.deco ?? []).filter(([kind]) => kind === 'woodtree');
  trees.forEach(([, tx], ti) => {
    const rise = 480;
    const crownY = ground - rise - 34;
    const sx0 = tx - cam.x;
    if (sx0 < -260 || sx0 > width + 260) return;
    // Falling leaves: two per tree, each on its own long cycle, out of sight most of it.
    for (let k = 0; k < 2; k++) {
      const id = ti * 7 + k;
      const T = 11 + hash(id + 1) * 6;
      const u = ((time / T + hash(id + 2)) % 1 + 1) % 1;
      if (u > 0.55) continue;
      const v = u / 0.55;
      const fall = v * 260;
      const x = tx + (hash(id + 3) - 0.5) * 200 + Math.sin(v * Math.PI * 2.2 + id) * 12 + v * 18 - cam.x;
      const y = crownY + 20 + fall - cam.y;
      const fade = Math.min(1, v / 0.12) * Math.min(1, (1 - v) / 0.25);
      ctx.save();
      ctx.globalAlpha *= fade * (1 - night * 0.5);
      leafShape(ctx, x, y, 1.15, v * 7 + id, Math.sin(v * 6 + id) * 0.7, k ? '#8fd678' : '#c4e88a', '#6cb860');
      ctx.restore();
    }
    // Specks of light in the crown by day, fireflies round the trunk by night.
    for (let k = 0; k < 4; k++) {
      const id = ti * 13 + k + 50;
      const ax = tx + (hash(id) - 0.5) * 180;
      const ay = crownY - 30 + hash(id + 1) * 70;
      const day = 1 - night;
      if (day > 0.05) {
        const x = ax + Math.sin(time * 0.35 + id) * 10 - cam.x;
        const y = ay + Math.sin(time * 0.27 + id * 1.7) * 7 - cam.y;
        ctx.fillStyle = hexA('#fff6c4', day * (0.35 + 0.35 * Math.sin(time * 0.9 + id * 2.3)));
        ctx.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
      }
    }
  });
  // (The fireflies' glow is the night's light, scene.js: here just their bright little cores.)
  for (const f of mossyFireflies(map, cam, width, time)) {
    ctx.fillStyle = hexA('#fbffe0', f.glow);
    ctx.fillRect(f.x - 0.8, f.y - 0.8, 1.6, 1.6);
  }
}

// Mossy Woods' fireflies at night (on screen): a few drifting round each giant tree's trunk, each
// glowing and fading on its own slow beat.
export function mossyFireflies(map, cam, width, time) {
  const night = Math.min(1, Math.max(0, map.night ?? 0));
  if (night < 0.05) return [];
  const ground = map.groundY ?? 1000;
  const out = [];
  (map.deco ?? []).filter(([kind]) => kind === 'woodtree').forEach(([, tx], ti) => {
    if (tx - cam.x < -260 || tx - cam.x > width + 260) return;
    const rise = 480;
    for (let k = 0; k < 4; k++) {
      const id = ti * 13 + k + 50;
      const glow = night * Math.max(0, Math.sin(time * 0.8 + id * 2.1)) ** 2;
      if (glow < 0.02) continue;
      out.push({
        x: tx + (hash(id + 5) - 0.5) * 220 + Math.sin(time * 0.4 + id) * 26 - cam.x,
        y: ground - 80 - hash(id + 6) * (rise - 120) + Math.sin(time * 0.31 + id * 1.3) * 18 - cam.y,
        glow,
      });
    }
  });
  return out;
}

// Squirrels living on the woods' branches: each scampers along its branch, stops, sits up to
// nibble with a flick of the tail, then runs on, turning at the ends. Songbirds flit across
// between the trees in bounding flight (a few beats, then a glide). Each critter's timing comes
// from its own index, so they never move in step.
export function drawWoodlandLife(ctx, map, cam, width, height, time) {
  // (Mossy Woods keeps its animals few, the player's call 2026-11-11: a squirrel on about one
  // branch in four, a single songbird now and then.)
  const few = map.look?.forestStyle === 'mossy';
  const branches = (map.platforms ?? []).filter((p) => p.w >= 200 && p.y < map.groundY - 60);
  branches.forEach((b, i) => {
    if (hash(i * 7.7 + 1) < (few ? 0.75 : 0.45)) return;
    const span = b.w - 40;
    const T = 9 + hash(i + 2) * 5;
    const u = ((time / T + hash(i + 3)) % 1 + 1) % 1;
    // Out and back along the branch: run, sit, run, sit.
    const leg = u < 0.5 ? u * 2 : (u - 0.5) * 2;
    const dir = u < 0.5 ? 1 : -1;
    const running = leg < 0.55;
    const ease = (v) => v * v * (3 - 2 * v);
    const p = running ? ease(leg / 0.55) : 1;
    const along = dir > 0 ? p : 1 - p;
    const wx = b.x + 20 + along * span;
    const sx = wx - cam.x;
    const sy = b.y - cam.y - 1;
    if (sx < -30 || sx > width + 30 || sy < -30 || sy > height + 30) return;
    const sitK = running ? 0 : Math.min(1, (leg - 0.55) / 0.08);
    const flick = running ? Math.sin(time * 9 + i) * 1.5 : Math.max(0, Math.sin(time * 5 + i)) ** 6 * 4;
    const nibble = running ? 0 : Math.max(0, Math.sin(time * 14 + i));
    squirrel(ctx, sx, sy, dir, running ? (leg / 0.55) * 6 % 1 : 0, sitK, flick, nibble);
  });
  for (let i = 0; i < (few ? 1 : 3); i++) {
    const period = (few ? 22 : 11) + hash(i + 40) * 6;
    const u = ((time / period + hash(i + 41)) % 1 + 1) % 1;
    if (u > 0.55) continue;
    const v = u / 0.55;
    const dir = hash(i + 42) > 0.5 ? 1 : -1;
    const x = dir > 0 ? -20 + v * (width + 40) : width + 20 - v * (width + 40);
    // Bounding flight: it rises on a burst of beats and dips through a glide.
    const phase = (v * 7) % 1;
    const beating = phase < 0.55;
    const y = height * (0.18 + hash(i + 43) * 0.3) + Math.sin(v * Math.PI * 7) * 5 - cam.y * 0.04;
    songbird(ctx, x, y, dir, beating ? (time * 9) % 1 : 0.22, ['#ffd6a5', '#bfe0ff', '#ffc6de'][i % 3]);
  }
}

// A falling leaf seen tumbling: it turns over as it falls, showing its lit face and its paler
// back in turn, a midrib down it.
export function leafShape(ctx, x, y, s, spin, tilt, face, back) {
  const turn = Math.cos(spin);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(Math.max(0.15, Math.abs(turn)), 1);
  ctx.fillStyle = turn > 0 ? face : back;
  ctx.beginPath();
  ctx.moveTo(-3.2 * s, 0);
  ctx.quadraticCurveTo(0, -2.2 * s, 3.2 * s, 0);
  ctx.quadraticCurveTo(0, 2.2 * s, -3.2 * s, 0);
  ctx.fill();
  ctx.strokeStyle = shade(face, -18);
  ctx.lineWidth = 0.5 * s;
  ctx.beginPath();
  ctx.moveTo(-2.8 * s, 0);
  ctx.lineTo(3 * s, 0);
  ctx.stroke();
  ctx.restore();
}

// ---------- The meadow ----------

// A rolling line of hills: a smooth crest from sums of slow waves, seeded by `seed`, filled down
// past the bottom of the view, with its lit crest a little lighter.
function hills(ctx, cam, factor, width, y, amp, seed, c, lit) {
  const crest = (sx) => {
    const k = sx + cam.x * factor;
    return y - amp * (0.55 * Math.sin(k * 0.006 + seed) + 0.3 * Math.sin(k * 0.013 + seed * 2.1) + 0.15 * Math.sin(k * 0.031 + seed * 3.7));
  };
  const path = (dy) => {
    ctx.beginPath();
    ctx.moveTo(-4, y + 400);
    for (let sx = -4; sx <= width + 8; sx += 6) ctx.lineTo(sx, crest(sx) + dy);
    ctx.lineTo(width + 8, y + 400);
    ctx.closePath();
  };
  ctx.fillStyle = lit;
  path(-1.6);
  ctx.fill();
  ctx.fillStyle = c;
  path(0.6);
  ctx.fill();
  return crest;
}

// A windmill on a hill: a round tower with a cap and four sails turning in the wind.
function windmill(ctx, x, y, s, c, time, seed) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = c.wall;
  ctx.beginPath();
  ctx.moveTo(-9, 0);
  ctx.lineTo(-6, -38);
  ctx.lineTo(6, -38);
  ctx.lineTo(9, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = c.wallLit;
  ctx.beginPath();
  ctx.moveTo(-9, 0);
  ctx.lineTo(-6, -38);
  ctx.lineTo(-2, -38);
  ctx.lineTo(-4, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = c.roof;
  ctx.beginPath();
  ctx.moveTo(-8.5, -37);
  ctx.quadraticCurveTo(0, -50, 8.5, -37);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = c.door;
  ctx.beginPath();
  ctx.roundRect(-2.4, -8, 4.8, 8, [2.4, 2.4, 0, 0]);
  ctx.fill();
  ctx.fillStyle = c.window;
  ctx.beginPath();
  ctx.arc(0, -24, 2, 0, Math.PI * 2);
  ctx.fill();
  // The sails.
  const a = time * 0.9 + seed;
  ctx.translate(0, -36);
  for (let k = 0; k < 4; k++) {
    ctx.save();
    ctx.rotate(a + (k * Math.PI) / 2);
    ctx.fillStyle = c.sailFrame;
    ctx.fillRect(-0.6, -26, 1.2, 26);
    ctx.fillStyle = c.sail;
    ctx.fillRect(0.6, -25, 5, 18);
    ctx.restore();
  }
  ctx.fillStyle = c.roof;
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// A cottage: a little house with a gable roof and a chimney.
function cottage(ctx, x, y, s, c) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = c.wall;
  ctx.fillRect(-10, -14, 20, 14);
  ctx.fillStyle = c.wallLit;
  ctx.fillRect(-10, -14, 6, 14);
  ctx.fillStyle = c.roof;
  ctx.beginPath();
  ctx.moveTo(-13, -13);
  ctx.lineTo(0, -25);
  ctx.lineTo(13, -13);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(5, -26, 3, 8);
  ctx.fillStyle = c.window;
  ctx.fillRect(3, -10, 4, 4);
  ctx.fillStyle = c.door;
  ctx.fillRect(-5, -8, 4, 8);
  ctx.restore();
}

// A round tree on a hill: a short trunk and a domed crown of clumps.
function roundTree(ctx, x, y, r, c, time, seed) {
  ctx.fillStyle = c.bark;
  ctx.fillRect(x - r * 0.12, y - r * 0.9, r * 0.24, r * 0.9);
  clump(ctx, x, y - r * 1.25, r, c, seed, Math.sin(time * 0.7 + seed) * r * 0.05);
}

// A cherry tree on a hill: a slim leaning trunk, two boughs, and a crown of soft pink clumps.
function blossomTree(ctx, x, y, r, c, pink, time, seed) {
  ctx.fillStyle = c.bark;
  const lean = (hash(seed + 9) - 0.5) * r * 0.3;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.1, y);
  ctx.quadraticCurveTo(x - r * 0.05 + lean * 0.5, y - r * 0.6, x + lean, y - r * 1.05);
  ctx.lineTo(x + lean + r * 0.1, y - r * 1.05);
  ctx.quadraticCurveTo(x + r * 0.08 + lean * 0.5, y - r * 0.6, x + r * 0.12, y);
  ctx.closePath();
  ctx.fill();
  const sw = Math.sin(time * 0.6 + seed) * r * 0.05;
  clump(ctx, x + lean - r * 0.45, y - r * 1.15, r * 0.7, pink, seed + 0.3, sw);
  clump(ctx, x + lean + r * 0.5, y - r * 1.2, r * 0.66, pink, seed + 0.6, sw);
  clump(ctx, x + lean, y - r * 1.45, r * 0.85, pink, seed, sw);
}

// Petal Meadow's own backdrop (2026-11-10, the art pass the player asked for): calm and clear, so
// the play floors read in front of it. Lavender mountains far off; a rolling green hillside with
// cherry trees in bloom and, now and then, Sprout Village's windmill and cottages together (one
// place, never sprinkled everywhere); near, soft green hills with a few clusters of flowers rather
// than a scatter of dots.
function drawPaintedPetal(ctx, t, cam, width, height, time, layerY, air) {
  const sun = t.sun ?? '#fff6dc';
  const green = mix(t.mid, '#6cbc74', 0.5);
  // 1. Lavender mountains in the haze.
  const farY = layerY(96, 0.03);
  const m1 = mix('#c8b4e6', air, 0.55);
  hills(ctx, cam, 0.04, width, farY - 34, 50, 1.3, m1, mix(m1, sun, 0.3));
  const m2 = mix('#b8c8e8', air, 0.4);
  hills(ctx, cam, 0.07, width, farY, 34, 4.1, m2, mix(m2, sun, 0.3));
  haze(ctx, air, width, farY + 16, 0.42, 70);

  // 2. The hillside: one long soft slope, cherry trees in bloom along it, and the village.
  const midY = layerY(58, 0.06);
  const hc = mix(green, air, 0.22);
  const crest = hills(ctx, cam, 0.16, width, midY - 16, 22, 2.7, hc, mix(hc, sun, 0.32));
  const cm = planeColors(t, shade(hc, -6), air, 0.04);
  const pinkMid = planeColors(t, '#ffb6d0', air, 0.2);
  const house = { wall: mix('#fff4e8', air, 0.2), wallLit: '#ffffff', roof: mix('#e8848a', air, 0.22), door: mix('#a8765a', air, 0.25), window: '#ffe9a0', sail: '#fffaf0', sailFrame: mix('#a8765a', air, 0.2) };
  repeat(cam.x, 0.16, 900, width, (i, x) => {
    // The village: a windmill with two cottages beside it.
    const vx = x + 300 + hash(i + 40) * 200;
    windmill(ctx, vx, crest(vx) + 2, 1, house, time, i);
    cottage(ctx, vx - 34, crest(vx - 34) + 2, 0.95, house);
    cottage(ctx, vx + 30, crest(vx + 30) + 2, 0.9, house);
  });
  repeat(cam.x, 0.16, 190, width, (i, x) => {
    if (hash(i + 3) < 0.4) return;
    const xx = x + hash(i + 2) * 90;
    // (Never on top of the village.)
    const local = ((xx + cam.x * 0.16) % 900 + 900) % 900;
    if (local > 230 && local < 560) return;
    blossomTree(ctx, xx, crest(xx) + 3, 13 + hash(i + 4) * 4, cm, pinkMid, time, i);
  });
  haze(ctx, air, width, midY + 8, 0.22, 60);

  // 3. Near: soft green rises with a few clusters of flowers and a cherry tree now and then.
  const nearY = layerY(16, 0.1);
  const nc = mix(shade(green, 6), air, 0.06);
  const near = hills(ctx, cam, 0.32, width, nearY - 6, 14, 5.9, nc, mix(nc, sun, 0.26));
  const blooms = ['#ffb3cf', '#fff3a6', '#ffffff'];
  repeat(cam.x, 0.32, 260, width, (i, x) => {
    if (hash(i + 90) < 0.35) return;
    const cx = x + hash(i + 91) * 120;
    const col = mix(blooms[((i % blooms.length) + blooms.length) % blooms.length], air, 0.1);
    for (let k = 0; k < 5; k++) {
      const fx = cx + (hash(i * 5 + k) - 0.5) * 26;
      const fy = near(fx) + 5 + hash(i * 7 + k) * 7;
      const sw = Math.sin(time * 1.6 + fx * 0.05) * 0.7;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(fx + sw, fy, 1.7 + hash(i * 3 + k) * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  const cn = planeColors(t, shade(green, -4), air, 0.03);
  const pinkNear = planeColors(t, '#ffaacb', air, 0.08);
  repeat(cam.x, 0.32, 420, width, (i, x) => {
    if (hash(i + 70) < 0.5) return;
    const xx = x + hash(i + 71) * 200;
    blossomTree(ctx, xx, near(xx) + 6, 20 + hash(i + 72) * 6, cn, pinkNear, time, i + 70);
  });
  haze(ctx, air, width, nearY + 4, 0.16, 40);
}

// A farmstead far off: a red gambrel-roofed barn, a round silo with a domed cap, and a farmhouse.
function farmstead(ctx, x, y, s, c) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // The silo, behind the barn.
  ctx.fillStyle = c.silo;
  ctx.fillRect(14, -34, 10, 34);
  ctx.fillStyle = c.siloLit;
  ctx.fillRect(14, -34, 3, 34);
  ctx.fillStyle = c.cap;
  ctx.beginPath();
  ctx.ellipse(19, -34, 5, 4, 0, Math.PI, 0);
  ctx.fill();
  // The barn: red walls, a white-trimmed gambrel roof, a big door with a white X.
  ctx.fillStyle = c.barn;
  ctx.fillRect(-14, -18, 28, 18);
  ctx.fillStyle = c.barnLit;
  ctx.fillRect(-14, -18, 7, 18);
  ctx.fillStyle = c.roof;
  ctx.beginPath();
  ctx.moveTo(-16, -17);
  ctx.lineTo(-12, -26);
  ctx.lineTo(0, -31);
  ctx.lineTo(12, -26);
  ctx.lineTo(16, -17);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = c.trim;
  ctx.fillRect(-5, -11, 10, 11);
  ctx.fillStyle = c.barn;
  ctx.fillRect(-4, -10, 8, 10);
  ctx.strokeStyle = c.trim;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-4, -10);
  ctx.lineTo(4, 0);
  ctx.moveTo(4, -10);
  ctx.lineTo(-4, 0);
  ctx.stroke();
  ctx.fillStyle = c.trim;
  ctx.fillRect(-2, -23, 4, 3);
  ctx.restore();
  cottage(ctx, x - 30 * s, y, 0.85 * s, c.house);
}

// Clover Hills' own backdrop (2026-11-11, its art pass, matching Petal Meadow's): calm and clear.
// Soft blue-green hills far off; a rolling hillside dotted with round trees, with one farmstead
// (barn, silo and farmhouse) now and then;
// near, clover hills with little white clover flowers and a run of fence here and there.
function drawPaintedClover(ctx, t, cam, width, height, time, layerY, air) {
  const sun = t.sun ?? '#fff6dc';
  const green = mix(t.mid, '#6cbc74', 0.4);
  // 1. Far hills in the haze.
  const farY = layerY(96, 0.03);
  const m1 = mix('#a8d4d8', air, 0.55);
  hills(ctx, cam, 0.04, width, farY - 30, 46, 1.7, m1, mix(m1, sun, 0.3));
  const m2 = mix('#9cd0a8', air, 0.42);
  hills(ctx, cam, 0.07, width, farY, 32, 4.6, m2, mix(m2, sun, 0.3));
  haze(ctx, air, width, farY + 16, 0.42, 70);

  // 2. The hillside.
  const midY = layerY(58, 0.06);
  const hc = mix(green, air, 0.22);
  const crest = hills(ctx, cam, 0.16, width, midY - 16, 22, 3.3, hc, mix(hc, sun, 0.32));
  // (No patchwork of field strips: the band read as a road across the hills and shimmered as you
  // walked, the player's call 2026-11-11. The hillside stays clean, as Petal Meadow's does.)
  const cm = planeColors(t, shade(hc, -10), air, 0.04);
  const farm = {
    barn: mix('#e8646a', air, 0.25), barnLit: mix('#f48a8a', air, 0.25), roof: mix('#a8544e', air, 0.25), trim: mix('#ffffff', air, 0.1),
    silo: mix('#d8dcea', air, 0.25), siloLit: '#ffffff', cap: mix('#a8b0c8', air, 0.25),
    house: { wall: mix('#fff4e8', air, 0.2), wallLit: '#ffffff', roof: mix('#7ab0e0', air, 0.22), door: mix('#a8765a', air, 0.25), window: '#ffe9a0' },
  };
  repeat(cam.x, 0.16, 1000, width, (i, x) => {
    const fx = x + 380 + hash(i + 50) * 200;
    farmstead(ctx, fx, crest(fx) + 3, 1, farm);
  });
  repeat(cam.x, 0.16, 170, width, (i, x) => {
    if (hash(i + 3) < 0.45) return;
    const xx = x + hash(i + 2) * 80;
    const local = ((xx + cam.x * 0.16) % 1000 + 1000) % 1000;
    if (local > 300 && local < 640) return;
    roundTree(ctx, xx, crest(xx) + 3, 9 + hash(i + 4) * 4, cm, time, i);
  });
  haze(ctx, air, width, midY + 8, 0.22, 60);

  // 3. Near: clover hills, white clover flowers in little patches, a run of fence now and then.
  const nearY = layerY(16, 0.1);
  const nc = mix(shade(green, 6), air, 0.06);
  const near = hills(ctx, cam, 0.32, width, nearY - 6, 14, 6.7, nc, mix(nc, sun, 0.26));
  repeat(cam.x, 0.32, 240, width, (i, x) => {
    if (hash(i + 90) < 0.35) return;
    const cx = x + hash(i + 91) * 120;
    for (let k = 0; k < 5; k++) {
      const fx = cx + (hash(i * 5 + k) - 0.5) * 26;
      const fy = near(fx) + 5 + hash(i * 7 + k) * 7;
      const sw = Math.sin(time * 1.6 + fx * 0.05) * 0.7;
      ctx.fillStyle = mix(k % 2 ? '#ffffff' : '#ffd8ea', air, 0.08);
      ctx.beginPath();
      ctx.arc(fx + sw, fy, 1.8 + hash(i * 3 + k) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  const post = mix('#c89a6a', air, 0.15);
  repeat(cam.x, 0.32, 520, width, (i, x) => {
    if (hash(i + 60) < 0.5) return;
    const x0 = x + hash(i + 61) * 200;
    ctx.strokeStyle = post;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const px = x0 + k * 16;
      ctx.moveTo(px, near(px) + 6);
      ctx.lineTo(px, near(px) - 4);
    }
    for (const dy of [-2.5, 1]) {
      ctx.moveTo(x0, near(x0) + dy);
      for (let k = 1; k < 5; k++) ctx.lineTo(x0 + k * 16, near(x0 + k * 16) + dy);
    }
    ctx.stroke();
  });
  const cn = planeColors(t, shade(green, -6), air, 0.03);
  repeat(cam.x, 0.32, 460, width, (i, x) => {
    if (hash(i + 70) < 0.55) return;
    const xx = x + hash(i + 71) * 200;
    roundTree(ctx, xx, near(xx) + 6, 16 + hash(i + 72) * 5, cn, time, i + 70);
  });
  haze(ctx, air, width, nearY + 4, 0.16, 40);
}

export function drawPaintedMeadow(ctx, t, cam, width, height, time, layerY, air) {
  if (t.meadowStyle === 'petal') return drawPaintedPetal(ctx, t, cam, width, height, time, layerY, air);
  if (t.meadowStyle === 'clover') return drawPaintedClover(ctx, t, cam, width, height, time, layerY, air);
  const sun = t.sun ?? '#fff6dc';
  // The map's own green, deepened toward a meadow green so hills and trees read clearly even
  // under a pastel sky.
  const green = mix(t.mid, '#5aae6a', 0.45);
  // 1. Far mountains in the haze, two ranges, the further nearly the sky.
  const farY = layerY(96, 0.03);
  const m1 = mix(t.far, air, 0.62);
  hills(ctx, cam, 0.04, width, farY - 30, 48, 1.3, m1, mix(m1, sun, 0.35));
  const m2 = mix(t.far, air, 0.42);
  hills(ctx, cam, 0.07, width, farY, 34, 4.1, m2, mix(m2, sun, 0.35));
  haze(ctx, air, width, farY + 16, 0.4, 70);

  // 2. Rolling hills in the middle distance: patchwork fields, hedgerows, round trees, a cottage
  // and a windmill turning.
  const midY = layerY(58, 0.06);
  const hc = mix(mix(green, t.far, 0.15), air, 0.14);
  const crest = hills(ctx, cam, 0.16, width, midY - 18, 26, 2.7, hc, mix(hc, sun, 0.3));
  // Field stripes following the slope, in alternating greens and gold.
  const fields = [shade(hc, 5), shade(hc, -4), mix(hc, '#f6e2a0', 0.3)];
  ctx.save();
  ctx.globalAlpha = 0.55;
  for (let sx = -20; sx < width + 20; sx += 3) {
    const k = Math.floor((sx + cam.x * 0.16) / 70);
    ctx.fillStyle = fields[((k % 3) + 3) % 3];
    const top = crest(sx) + 8;
    ctx.fillRect(sx, top, 3, 6 + (k % 2) * 3);
  }
  ctx.restore();
  const cm = planeColors(t, shade(hc, -8), air, 0.02);
  const house = { wall: mix('#fff4e8', air, 0.15), wallLit: '#ffffff', roof: mix('#e8848a', air, 0.18), door: mix('#a8765a', air, 0.2), window: '#ffe9a0', sail: '#fffaf0', sailFrame: mix('#a8765a', air, 0.15) };
  repeat(cam.x, 0.16, 160, width, (i, x) => {
    const xx = x + hash(i + 2) * 80;
    const gy = crest(xx) + 2;
    const s = hash(i + 3);
    if (s < 0.16) windmill(ctx, xx, gy, 1.05, house, time, i);
    else if (s < 0.3) cottage(ctx, xx, gy, 1.05, house);
    else if (s < 0.85) {
      roundTree(ctx, xx, gy, 12 + hash(i + 4) * 6, cm, time, i);
      if (hash(i + 5) > 0.5) roundTree(ctx, xx + 18, gy + 1, 9, cm, time, i + 0.4);
    }
  });
  haze(ctx, air, width, midY + 8, 0.2, 60);

  // 3. Near flowering hills: brighter green, dotted with wildflowers that sway, a big round tree
  // now and then.
  const nearY = layerY(16, 0.1);
  const nc = mix(shade(green, 4), air, 0.04);
  const near = hills(ctx, cam, 0.32, width, nearY - 8, 18, 5.9, nc, mix(nc, sun, 0.28));
  const blooms = ['#ffb3cf', '#fff3a6', '#ffffff', '#c9b6ff'];
  for (let i = 0; i < 70; i++) {
    const wx = hash(i * 1.37) * (width + 400);
    const sx = ((wx - cam.x * 0.32) % (width + 40) + width + 40) % (width + 40) - 20;
    const y = near(sx) + 4 + hash(i * 2.3) * 22;
    const sw = Math.sin(time * 1.8 + wx * 0.05) * 0.8;
    ctx.fillStyle = mix(blooms[i % blooms.length], air, 0.12);
    ctx.beginPath();
    ctx.arc(sx + sw, y, 1.4 + hash(i * 3.1) * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  const cn = planeColors(t, shade(green, -6), air, 0.02);
  repeat(cam.x, 0.32, 300, width, (i, x) => {
    if (hash(i + 70) < 0.45) return;
    const xx = x + hash(i + 71) * 160;
    roundTree(ctx, xx, near(xx) + 6, 18 + hash(i + 72) * 8, cn, time, i + 70);
  });
  haze(ctx, air, width, nearY + 4, 0.18, 40);
}

// Rabbits on the meadow floor and bees among the flowers. A rabbit hops a few times, sits with
// its ears twitching and nose wiggling, then hops on, turning now and then. Bees buzz in loops,
// wings a blur.
// A meadow bunny (redrawn 2026-11-11 to match the outlined art): a chubby round body, a big round
// head, long ears with pink insides, a cotton tail, a shining eye and a blush. It hops in soft arcs,
// nose up as it leaves the ground and nose down as it lands, ears streaming back; sitting, its nose
// twitches, an ear flicks and it blinks. Lifted and tilted only, never squashed or stretched.
function rabbit(ctx, x, y, dir, hop, sit, twitch, blink = false) {
  const fur = '#fffaf6';
  const shadeC = '#f0dde8';
  const line = '#b896b4';
  const up = hop > 0 ? Math.sin(hop * Math.PI) : 0;
  // A shadow that shrinks as it rises.
  ctx.fillStyle = 'rgba(90,50,90,0.16)';
  ctx.beginPath();
  ctx.ellipse(x, y, 7 - up * 2.5, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(x, y - up * 10);
  ctx.scale(dir, 1);
  ctx.rotate(hop > 0 ? (hop - 0.5) * 0.4 : 0);
  ctx.lineWidth = 1.1;
  ctx.strokeStyle = line;
  const blob = (cx, cy, rx, ry, c, a = 0) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, a, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
  // Back foot (kicked out behind mid-hop), the tail puff, the body.
  blob(-4 - up * 2.4, -1.3 + up * 0.4, 3.2, 1.5, shadeC, up * 0.3);
  blob(-7.6, -6.4, 2.6, 2.6, fur);
  blob(-1, -6, 7, 5.8, fur);
  ctx.fillStyle = shadeC;
  ctx.beginPath();
  ctx.ellipse(-1.6, -3.4, 5, 2.2, 0, 0, Math.PI);
  ctx.fill();
  // The front paw, tucked up in the air.
  blob(4 - up * 0.5, -1 - up * 1.4, 2, 1.3, fur);
  // Head and ears (behind the head first), the ears trailing back in a hop and flicking at rest.
  const hx = 5.2;
  const hy = -12.4 + sit * 0.4;
  for (const [ex, a0, back] of [[-1.4, -0.5, true], [1, -0.12, false]]) {
    ctx.save();
    ctx.translate(hx + ex, hy - 3.6);
    ctx.rotate(a0 - up * 0.5 - (back ? twitch * 0.35 : 0));
    blob(0, -4.8, 1.9, 5, back ? shadeC : fur);
    ctx.fillStyle = '#ffc2d6';
    ctx.beginPath();
    ctx.ellipse(0, -4.4, 0.85, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  blob(hx, hy, 5.4, 5, fur);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.ellipse(hx - 1.8, hy - 2.2, 1.8, 1, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // The face: an eye with a shine (shut in a blink), a blush, a twitching pink nose.
  ctx.fillStyle = '#3a2d4f';
  ctx.strokeStyle = '#3a2d4f';
  if (blink) {
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(hx + 2, hy - 0.4, 1.1, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.ellipse(hx + 2, hy - 0.6, 1.1, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(hx + 1.6, hy - 1.2, 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,140,170,0.65)';
  ctx.beginPath();
  ctx.ellipse(hx + 2.6, hy + 1.9, 1.4, 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff8fb0';
  ctx.beginPath();
  ctx.ellipse(hx + 5, hy + 0.6 + Math.sin(twitch * 20) * 0.25, 0.8, 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
// A bumblebee (remade 2026-11-11): a round fuzzy body with soft brown stripes, a round head with a
// shining eye and a blush, buzzing wings, bobbing as it flies.
function bee(ctx, x, y, dir, time, seed) {
  ctx.save();
  ctx.translate(x, y + Math.sin(time * 10 + seed) * 0.7);
  ctx.scale(dir, 1);
  const flap = Math.sin(time * 60 + seed) > 0;
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = '#8a6a50';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.ellipse(-0.8, -3.2, 2.2, flap ? 3 : 1.6, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffd34a';
  ctx.beginPath();
  ctx.ellipse(-0.6, 0, 3.4, 2.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#7a5a48';
  ctx.fillRect(-2.4, -3, 1.1, 6);
  ctx.fillRect(-0.2, -3, 1.1, 6);
  ctx.restore();
  ctx.stroke();
  ctx.fillStyle = '#ffe58a';
  ctx.beginPath();
  ctx.arc(2.8, -0.4, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#3a2d4f';
  ctx.beginPath();
  ctx.arc(3.5, -0.8, 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,140,170,0.7)';
  ctx.beginPath();
  ctx.ellipse(3.6, 0.6, 0.7, 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
export function drawMeadowLife(ctx, map, cam, width, height, time, groundAt) {
  // (A map can ask for fewer: `look.rabbits`, `look.bees`.)
  // (Or name where they live, `look.rabbitsAt`, so they keep clear of the gathering spots.)
  const at = map.look?.rabbitsAt;
  const n = at?.length ?? map.look?.rabbits ?? Math.ceil(map.width / 420);
  for (let i = 0; i < n; i++) {
    const home = at ? at[i] : 140 + hash(i * 4.7 + 9) * (map.width - 280);
    if (map.portals.some((p) => Math.abs(p.x - home) < 70) || map.npcs.some((q) => Math.abs(q.x - home) < 50)) continue;
    // A cycle: four hops one way, a sit, four hops back, a sit.
    const T = 7 + hash(i + 1) * 3;
    const u = ((time / T + hash(i + 2)) % 1 + 1) % 1;
    const half = u < 0.5 ? u * 2 : (u - 0.5) * 2;
    const dir = u < 0.5 ? 1 : -1;
    const hopping = half < 0.5;
    const hops = 4;
    const hp = hopping ? (half / 0.5) * hops : hops;
    const along = (dir > 0 ? hp : hops - hp) * 14 - 28;
    const wx = home + along;
    const sx = wx - cam.x;
    if (sx < -30 || sx > width + 30) continue;
    const gy = groundAt(map, wx) - cam.y;
    if (gy < -20 || gy > height + 30) continue;
    const blink = !hopping && ((time * 0.4 + hash(i + 5) * 3) % 1) < 0.05;
    rabbit(ctx, sx, gy, dir, hopping ? hp % 1 : 0, hopping ? 0 : 1, hopping ? 0 : Math.max(0, Math.sin(time * 6 + i * 3)) ** 8, blink);
  }
  for (let i = 0; i < (map.look?.bees ?? Math.ceil(map.width / 300)); i++) {
    const cx = 100 + hash(i * 6.1 + 3) * (map.width - 200);
    const sx = cx - cam.x;
    if (sx < -60 || sx > width + 60) continue;
    const a = time * (1.4 + hash(i + 4) * 0.8) + i * 2;
    const bx = sx + Math.sin(a) * 26;
    const by = groundAt(map, cx) - cam.y - 18 - Math.sin(a * 2) * 8 + Math.sin(time * 9 + i) * 1.2;
    bee(ctx, bx, by, Math.cos(a) >= 0 ? 1 : -1, time, i);
  }
}

// ---------- The village ----------

// Far behind the village: a painted hillside with a cluster of tiny rooftops in the haze, a clock
// tower, and round trees, the next valley's town seen from afar.
export function drawPaintedTownFar(ctx, t, cam, width, height, time, layerY, air) {
  const sun = t.sun ?? '#fff6dc';
  const farY = layerY(170, 0.03);
  const m1 = mix(t.far, air, 0.55);
  hills(ctx, cam, 0.04, width, farY - 20, 40, 2.2, m1, mix(m1, sun, 0.35));
  haze(ctx, air, width, farY + 10, 0.35, 60);
  const midY = layerY(128, 0.05);
  const hc = mix(mix('#9fd6a8', t.far, 0.3), air, 0.22);
  const crest = hills(ctx, cam, 0.1, width, midY, 22, 5.3, hc, mix(hc, sun, 0.3));
  const roofs = ['#f29ab4', '#9fb8f2', '#f6c27a', '#c4a6f2'].map((c) => mix(c, air, 0.4));
  const wall = mix('#fff4ec', air, 0.35);
  const ct = planeColors(t, mix('#7fc48c', air, 0.2), air, 0.3);
  repeat(cam.x, 0.1, 220, width, (i, x) => {
    const cx = x + hash(i + 1) * 80;
    const gy = crest(cx) + 4;
    // A huddle of houses climbing the slope.
    for (let k = 0; k < 4 + Math.floor(hash(i + 2) * 3); k++) {
      const hx = cx + (k - 2) * 12 + hash(i * 5 + k) * 4;
      const hy = gy - Math.abs(k - 2) * -2 + hash(i * 7 + k) * 3;
      const w = 9 + hash(i * 3 + k) * 4;
      const h = 7 + hash(i * 9 + k) * 5;
      ctx.fillStyle = wall;
      ctx.fillRect(hx - w / 2, hy - h, w, h);
      ctx.fillStyle = roofs[(((i + k) % roofs.length) + roofs.length) % roofs.length];
      ctx.beginPath();
      ctx.moveTo(hx - w / 2 - 1.5, hy - h + 0.5);
      ctx.lineTo(hx, hy - h - w * 0.55);
      ctx.lineTo(hx + w / 2 + 1.5, hy - h + 0.5);
      ctx.closePath();
      ctx.fill();
      if (hash(i * 11 + k) > 0.6) {
        ctx.fillStyle = mix('#ffe9a0', air, 0.2);
        ctx.fillRect(hx - 1.2, hy - h * 0.6, 2.4, 2.2);
      }
    }
    if (hash(i + 3) > 0.62) {
      // A clock tower above the roofs.
      const tx = cx + 34;
      const ty = crest(tx) + 2;
      ctx.fillStyle = wall;
      ctx.fillRect(tx - 5, ty - 40, 10, 40);
      ctx.fillStyle = roofs[0];
      ctx.beginPath();
      ctx.moveTo(tx - 7, ty - 39);
      ctx.lineTo(tx, ty - 54);
      ctx.lineTo(tx + 7, ty - 39);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = mix('#ffffff', air, 0.1);
      ctx.beginPath();
      ctx.arc(tx, ty - 32, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = mix('#7a6a8a', air, 0.3);
      ctx.lineWidth = 0.6;
      const a = time * 0.05;
      ctx.beginPath();
      ctx.moveTo(tx, ty - 32);
      ctx.lineTo(tx + Math.cos(a) * 2.2, ty - 32 + Math.sin(a) * 2.2);
      ctx.stroke();
    }
    for (let k = 0; k < 2; k++) {
      const tx = cx - 44 + k * 90 + hash(i * 13 + k) * 10;
      roundTree(ctx, tx, crest(tx) + 3, 8 + hash(i * 17 + k) * 4, ct, time, i * 2 + k);
    }
  });
  haze(ctx, air, width, midY + 8, 0.2, 50);
}

// A village cat strolling along the street: it pads along, stops, sits and licks a paw, then
// strolls back, tail swaying.
function strollCat(ctx, x, y, dir, step, sit, lick, tail, c) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * 1.2, 1.2);
  // Tail.
  ctx.strokeStyle = c.fur;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-5, -4 - sit * 1);
  ctx.quadraticCurveTo(-9, -6 + tail, -8 + tail * 0.5, -11 + tail * 0.3);
  ctx.stroke();
  // Body.
  ctx.fillStyle = c.fur;
  ctx.beginPath();
  ctx.ellipse(sit ? -1.5 : 0, -4 - sit * 1.2, sit ? 4.4 : 5.6, sit ? 4.4 : 3.2, sit ? -0.6 : 0, 0, Math.PI * 2);
  ctx.fill();
  // Legs.
  const s = Math.sin(step * Math.PI * 2);
  ctx.fillStyle = c.dark;
  if (!sit) {
    for (const [lx, ph] of [[-3.6, 1], [3.4, -1]]) {
      ctx.fillRect(lx + s * ph * 0.9 - 0.7, -2, 1.4, 2.2);
      ctx.fillRect(lx - s * ph * 0.9 + 0.6, -2, 1.4, 2.2);
    }
  }
  // Head, ears, face.
  const hx = sit ? 1.6 : 5;
  const hy = sit ? -9.5 + lick * 1.2 : -6.5;
  ctx.fillStyle = c.fur;
  ctx.beginPath();
  ctx.ellipse(hx, hy, 3, 2.7, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const ex of [-1.6, 1.2]) {
    ctx.beginPath();
    ctx.moveTo(hx + ex - 1, hy - 1.6);
    ctx.lineTo(hx + ex, hy - 4.2);
    ctx.lineTo(hx + ex + 1.2, hy - 1.8);
    ctx.fill();
  }
  ctx.fillStyle = '#3a2d4f';
  if (lick > 0.3) {
    ctx.fillRect(hx + 0.4, hy - 0.6, 1.4, 0.4);
  } else {
    ctx.beginPath();
    ctx.arc(hx + 1.2, hy - 0.4, 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ff9fb8';
  ctx.beginPath();
  ctx.arc(hx + 2.6, hy + 0.6, 0.45, 0, Math.PI * 2);
  ctx.fill();
  if (sit) {
    // A paw raised to the mouth.
    ctx.fillStyle = c.fur;
    ctx.beginPath();
    ctx.ellipse(hx + 2.2, hy + 2.4 - lick * 1.4, 1.1, 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
export function drawVillageLife(ctx, map, cam, width, height, time, groundAt) {
  const coats = [{ fur: '#f6c890', dark: '#d9a46a' }, { fur: '#ffffff', dark: '#e2d8ea' }, { fur: '#6a6080', dark: '#4a4260' }];
  for (let i = 0; i < Math.ceil(map.width / 900); i++) {
    const home = 200 + hash(i * 8.3 + 5) * (map.width - 400);
    if (map.portals.some((p) => Math.abs(p.x - home) < 80)) continue;
    const T = 16 + hash(i + 1) * 6;
    const u = ((time / T + hash(i + 2)) % 1 + 1) % 1;
    const half = u < 0.5 ? u * 2 : (u - 0.5) * 2;
    const dir = u < 0.5 ? 1 : -1;
    const walking = half < 0.6;
    const p = walking ? half / 0.6 : 1;
    const ease = (v) => v * v * (3 - 2 * v);
    const along = (dir > 0 ? ease(p) : 1 - ease(p)) * 160 - 80;
    const wx = home + along;
    const sx = wx - cam.x;
    if (sx < -30 || sx > width + 30) continue;
    const gy = groundAt(map, wx) - cam.y;
    const sitK = walking ? 0 : 1;
    const lick = walking ? 0 : Math.max(0, Math.sin(time * 5 + i)) ** 2;
    strollCat(ctx, sx, gy, dir, walking ? (time * 1.6) % 1 : 0, sitK, lick, Math.sin(time * 2 + i) * 2, coats[i % coats.length]);
  }
}

// A washing line strung between two houses: a sagging cord with clothes pegged along it (a shirt,
// socks, a dress, a towel), each swinging a beat behind the wind.
export function washingLine(ctx, x0, y0, x1, y1, time, seed, windAt) {
  const sag = 7;
  const at = (u) => [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + Math.sin(u * Math.PI) * sag];
  ctx.strokeStyle = '#a8949a';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag * 2, x1, y1);
  ctx.stroke();
  const colors = ['#ffb3c6', '#bfe0ff', '#fff3a6', '#c9b6ff', '#ffffff', '#b6f0d0'];
  const kinds = ['shirt', 'sock', 'dress', 'towel', 'sock'];
  for (let k = 0; k < 4; k++) {
    const u = 0.18 + k * 0.21;
    const [cx, cy] = at(u);
    const c = colors[Math.floor(hash(seed * 7 + k) * colors.length)];
    const kind = kinds[Math.floor(hash(seed * 3 + k) * kinds.length)];
    const w = windAt(time - k * 0.15, cx);
    const sw = Math.sin(time * 2.2 + k * 1.3 + seed) * 0.12 + w * 0.12;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(sw);
    ctx.fillStyle = c;
    ctx.strokeStyle = shade(c, -24);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    if (kind === 'shirt') {
      ctx.moveTo(-5, 0);
      ctx.lineTo(5, 0);
      ctx.lineTo(7, 3);
      ctx.lineTo(4.4, 4);
      ctx.lineTo(4, 10);
      ctx.lineTo(-4, 10);
      ctx.lineTo(-4.4, 4);
      ctx.lineTo(-7, 3);
    } else if (kind === 'dress') {
      ctx.moveTo(-3, 0);
      ctx.lineTo(3, 0);
      ctx.lineTo(3.4, 4);
      ctx.lineTo(6, 12);
      ctx.lineTo(-6, 12);
      ctx.lineTo(-3.4, 4);
    } else if (kind === 'towel') {
      ctx.rect(-4, 0, 8, 11);
    } else {
      ctx.moveTo(-1.4, 0);
      ctx.lineTo(1.4, 0);
      ctx.lineTo(1.4, 5);
      ctx.lineTo(3.4, 6.4);
      ctx.lineTo(2.6, 7.8);
      ctx.lineTo(-1.4, 6.6);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (kind === 'towel') {
      ctx.fillStyle = shade(c, -10);
      ctx.fillRect(-4, 8, 8, 1.2);
    }
    // The peg.
    ctx.fillStyle = '#c99a6b';
    ctx.fillRect(-0.6, -1.4, 1.2, 2.6);
    ctx.restore();
  }
}

// In front of the village street: soft out-of-focus hydrangea bushes drifting past now and then at
// the bottom corners.
export function drawPaintedTownFront(ctx, t, cam, width, height, time) {
  ctx.save();
  ctx.globalAlpha = 1;
  // The bush is one sprite and its row of blooms another, so the blooms sway across it as before.
  const body = softSprite(ctx, 'townbush', 58, 38, 2.4, 0.85, (g) => {
    g.fillStyle = '#6a9a78';
    g.beginPath();
    g.ellipse(0, 0, 46, 26, 0, 0, Math.PI * 2);
    g.fill();
  });
  repeat(cam.x, 1.25, 560, width, (i, x) => {
    if (hash(i + 90) < 0.4) return;
    const v = ((i % 3) + 3) % 3;
    const c = [['#f6a8c8', '#ffd0e2'], ['#a8c0f6', '#d0dcff'], ['#c8b0f2', '#e2d4ff']][v];
    const bx = x + hash(i + 91) * 300;
    const by = height + 10;
    const sw = Math.sin(time * 0.8 + i) * 2;
    const blooms = softSprite(ctx, `townblooms|${v}`, 51, 41, 2.4, 0.85, (g) => {
      for (let k = 0; k < 6; k++) {
        g.fillStyle = c[k % 2];
        g.beginPath();
        g.arc(-30 + k * 12, -14 - (k % 2) * 6, 9, 0, Math.PI * 2);
        g.fill();
      }
    });
    if (!body || !blooms) return;
    ctx.save();
    ctx.translate(bx, by);
    drawSoft(ctx, body);
    ctx.translate(sw, 0);
    drawSoft(ctx, blooms);
    ctx.restore();
  });
  ctx.restore();
}
