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

// A foliage clump: overlapping round leaf masses, a darker underside, and lit tops toward the
// upper left. `sway` leans the top a little.
function clump(ctx, x, y, r, c, seed, sway = 0) {
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

// Out-of-focus leaves drifting past in front of the player at the top corners and along the
// bottom, darker and cooler than the play space, swaying.
export function drawPaintedForestFront(ctx, t, cam, width, height, time) {
  const base = mix(shade(t.mid, -22), '#2a3a4a', 0.35);
  const c = { base, lit: mix(base, t.sun ?? '#fff6dc', 0.12), glint: mix(base, '#ffffff', 0.12), shadow: shade(base, -8) };
  ctx.save();
  ctx.filter = 'blur(2.2px)';
  ctx.globalAlpha = 0.82;
  repeat(cam.x, 1.25, 520, width, (i, x) => {
    const sw = Math.sin(time * 0.7 + i * 1.7) * 3;
    if (hash(i + 61) < 0.55) {
      const y = -8 - cam.y * 0.02;
      clump(ctx, x + hash(i + 62) * 200, y, 30 + hash(i + 63) * 14, c, i + 700, sw);
      clump(ctx, x + hash(i + 62) * 200 + 34, y + 10, 22, c, i + 701, sw);
    }
    if (hash(i + 64) < 0.45) {
      const by = height + 18;
      clump(ctx, x + 260 + hash(i + 65) * 160, by, 26 + hash(i + 66) * 10, c, i + 800, sw * 0.6);
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

// Squirrels living on the woods' branches: each scampers along its branch, stops, sits up to
// nibble with a flick of the tail, then runs on, turning at the ends. Songbirds flit across
// between the trees in bounding flight (a few beats, then a glide). Each critter's timing comes
// from its own index, so they never move in step.
export function drawWoodlandLife(ctx, map, cam, width, height, time) {
  const branches = (map.platforms ?? []).filter((p) => p.w >= 200 && p.y < map.groundY - 60);
  branches.forEach((b, i) => {
    if (hash(i * 7.7 + 1) < 0.45) return;
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
  for (let i = 0; i < 3; i++) {
    const period = 11 + hash(i + 40) * 6;
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
