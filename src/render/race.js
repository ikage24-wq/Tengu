// The Mochi Race Stadium's and courses' pieces (world/stadium.js), and the racers themselves
// (world/mochi-race.js).
//
//   mr_stands   wooden stands under a striped awning, a crowd of little Mochi on the benches, bobbing
//               and now and then waving (`extra.w` wide, from its x)
//   mr_board    the race board: a roofed board with the stages' cards pinned up, a pennant on top
//   mr_arch     an arch over the course: `extra.kind` 'start' (sakura banner), 'finish' (chequered
//               banner and a chequered line on the ground) or 'gate' (the stadium's way out to the
//               courses)
//   mr_marker   a pennant post marking a quarter of the way (`extra` 1 to 3: how many quarters)
//   mr_bunting  a string of little flags between two poles (from its x, `extra.w` apart, `extra.h` tall)
//   mr_wall     a climbing wall: grey stones in their mortar, coloured holds, a wooden rail down
//               its edge and a flag on top (its right edge at x, from `extra.bottom` up to
//               `extra.top`)
//   mr_launch   a little wooden kicker at a glide's edge (its lip at x), with a pennant
//   mr_clouds   the cloud fluff along the ground (from its x, `extra.w` long): big soft puffs
//               behind, and (drawn with the racers) low wisps over the feet of anyone wading

import { R, E, T, F, snap } from './pixel.js';
import { ramp, planks, gable, hash, lean } from './propkit.js';
import { limb } from './figure.js';
import { art, place } from './scenery.js';
import { groundAt } from '../world/physics.js';
import { drawMochiAnim, GAITS, SWIMS, FLIES, CLIMBS, runStyle } from './mochi-anim.js';
import { LANE_RISE, runSpeed } from '../world/mochi-race.js';
import { CANT_POINTS } from '../data/mochi-raise.js';
import { HAIR_COLORS } from '../data/mochi-genes.js';

const TAU = Math.PI * 2;
const WOOD = '#c8945a';
const WOOD_DK = '#9a6a40';
const SAKURA = '#ffb3c8';
const PAPER = '#fff6ea';
const FLAGS = ['#ff9ec0', '#ffd75e', '#8fd3ff', '#9fe0a0', '#c8a8f0', '#ffffff'];
const CROWD_HAIR = Object.values(HAIR_COLORS);
const DOUGH = ['#fbf6f0', '#ffe8e0', '#f6e6d6', '#fff0f4'];

// ---------- The stands ----------
const standsArt = (w) => art(`mr-stands|${w}`, w, 96, () => {
  const wd = ramp(WOOD);
  const out = [];
  // Three tiers of benches, stepping back and up, on their posts.
  for (const [i, y] of [[0, 46], [1, 62], [2, 78]].reverse()) {
    const inset = (2 - i) * 6;
    out.push(R(inset, y, w - inset * 2, 18, wd.sh), F(R(inset, y, w - inset * 2, 3, wd.hi)), F(R(inset, y + 3, w - inset * 2, 1, wd.deep)));
  }
  for (let x = 8; x < w - 4; x += 48) out.push(R(x, 46, 4, 50, WOOD_DK));
  // The awning, striped, with a scalloped edge, on two tall poles.
  out.push(R(2, 4, 4, 92, WOOD_DK), R(w - 6, 4, 4, 92, WOOD_DK));
  for (let x = 0, k = 0; x < w; x += 16, k++) {
    out.push(R(x, 6, Math.min(16, w - x), 16, k % 2 ? '#ffffff' : SAKURA));
    out.push(E(x + 8, 22, 8, 4, k % 2 ? '#ffffff' : SAKURA));
  }
  out.push(F(R(0, 6, w, 2, ramp(SAKURA).hi)));
  return out;
});
// The crowd: a little Mochi in each seat, its own colours, bobbing to the cheering, now and then
// throwing its paws up.
function crowd(ctx, x0, y0, w, time, wx) {
  for (const [row, y, inset] of [[2, 44, 12], [1, 60, 6], [0, 76, 0]]) {
    for (let sx = inset + 12, k = 0; sx < w - inset - 8; sx += 17, k++) {
      const h = hash(wx * 0.37 + row * 13.1 + k * 7.7);
      const bob = Math.sin(time * (5 + h * 3) + h * 20) * 1.1;
      const cx = x0 + sx + (h - 0.5) * 4;
      const cy = y0 + y - 7 + bob;
      const hair = CROWD_HAIR[Math.floor(h * CROWD_HAIR.length)];
      ctx.fillStyle = DOUGH[Math.floor(h * 7) % DOUGH.length];
      ctx.beginPath();
      ctx.ellipse(cx, cy, 6, 5.4, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 2.6, 6.3, 3.4, 0, Math.PI, TAU);
      ctx.fill();
      ctx.fillStyle = '#3a2a3a';
      ctx.fillRect(cx - 2.6, cy - 0.2, 1.2, 1.4);
      ctx.fillRect(cx + 1.4, cy - 0.2, 1.2, 1.4);
      // (Paws up, cheering, a beat at a time.)
      const wave = Math.sin(time * 1.7 + h * 40);
      if (wave > 0.55) {
        const up = (wave - 0.55) * 8;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(cx - 6, cy - 4 - up, 1.8, 1.8, 0, 0, TAU);
        ctx.ellipse(cx + 6, cy - 4 - up, 1.8, 1.8, 0, 0, TAU);
        ctx.fill();
      }
    }
  }
}

// ---------- The race board ----------
const boardArt = () => art('mr-board', 100, 104, () => {
  const wd = ramp(WOOD);
  return [
    R(12, 30, 5, 74, WOOD_DK), R(83, 30, 5, 74, WOOD_DK),
    ...gable(2, 98, 32, 6, '#d0705a', 5),
    R(10, 30, 80, 54, wd.base), F(R(10, 30, 80, 2, wd.hi)), F(R(10, 82, 80, 2, wd.deep)),
    // Three stage cards pinned up, and the ribbon of the next race across the top.
    R(16, 38, 20, 26, PAPER), R(40, 38, 20, 26, PAPER), R(64, 38, 20, 26, PAPER),
    F(E(26, 46, 5, 4.4, '#fbf6f0')), F(E(26, 44, 5.2, 2.8, SAKURA)), F(R(19, 56, 14, 2, '#ff9ec0')),
    F(E(50, 47, 6, 3, '#8fd3ff')), F(R(43, 56, 14, 2, '#8fd3ff')),
    F(T([[66, 54], [74, 42], [82, 54]], '#b8a8f0')), F(R(67, 58, 14, 2, '#b8a8f0')),
    ...[26, 50, 74].map((x) => F(E(x, 39, 1.4, 1.4, '#e8485e'))),
    R(14, 68, 72, 10, PAPER), F(R(18, 72, 40, 2, '#d8c0a8')), F(R(62, 72, 20, 2, '#ff9ec0')),
  ];
});

// ---------- Arches ----------
const archArt = (kind) => art(`mr-arch|${kind}`, 150, 132, () => {
  const post = ramp('#e8d8c0');
  const banner = kind === 'finish' ? '#3a3040' : kind === 'gate' ? '#8fc8f0' : SAKURA;
  const out = [
    R(10, 30, 12, 102, post.base), F(R(10, 30, 3, 102, post.hi)), R(128, 30, 12, 102, post.base), F(R(128, 30, 3, 102, post.hi)),
    E(16, 30, 9, 5, post.sh), E(134, 30, 9, 5, post.sh),
    // The banner: a gentle curve across the top.
    T([[14, 22], [75, 10], [136, 22], [136, 42], [75, 30], [14, 42]], banner),
    F(T([[14, 22], [75, 10], [136, 22], [136, 26], [75, 14], [14, 26]], ramp(banner).hi)),
  ];
  if (kind === 'finish') {
    // Chequered: white squares along the banner, and a chequered line across the course.
    for (let i = 0; i < 12; i++) {
      const x = 18 + i * 10;
      const y = 22 + Math.abs(75 - (x + 4)) * 0.2;
      if (i % 2 === 0) out.push(F(R(x, y, 5, 5, '#ffffff')), F(R(x + 5, y + 5, 5, 5, '#ffffff')));
      else out.push(F(R(x + 5, y, 5, 5, '#ffffff')), F(R(x, y + 5, 5, 5, '#ffffff')));
    }
    for (let i = 0; i < 6; i++) out.push(R(69 + (i % 2) * 6, 126 - i * 1, 6, 6, i % 2 ? '#3a3040' : '#ffffff'));
  } else {
    // Blossoms (or, the gate's, little white clouds) dotted along it.
    for (let i = 0; i < 6; i++) {
      const x = 26 + i * 20;
      const y = 26 + Math.abs(75 - x) * 0.2;
      out.push(F(E(x, y, 3.4, 3, '#ffffff')), F(E(x, y, 1.4, 1.2, kind === 'gate' ? '#d8eeff' : '#ff8fb0')));
    }
  }
  return out;
});
// The chequered finish line on the ground (drawn flat on the course).
function finishLine(ctx, x, gy) {
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? '#3a3040' : '#ffffff';
    ctx.fillRect(snap(x - 4), snap(gy - 2 + i * 1.5), 4, 1.5);
    ctx.fillStyle = i % 2 ? '#ffffff' : '#3a3040';
    ctx.fillRect(snap(x), snap(gy - 2 + i * 1.5), 4, 1.5);
  }
}

// ---------- Climbing walls, the launch, the cloud fluff ----------
const HOLDS = ['#ff8fb0', '#ffd75e', '#8fd3ff', '#9fe0a0', '#c8a8f0', '#ffa64d'];
const wallArt = (h) => art(`mr-wall|${h}`, 52, h + 6, () => {
  const st = ramp('#c8c0c8');
  const out = [R(2, 6, 44, h, st.sh), R(4, 6, 42, h, st.base)];
  // Stones in rows, each a shade of its own, the mortar between.
  for (let y = 8, row = 0; y < h + 2; y += 12, row++) {
    for (let x = 4 + (row % 2) * 7, k = 0; x < 44; x += 14, k++) {
      const v = hash(row * 7.3 + k * 3.1);
      out.push(F(R(x + 1, y + 1, Math.min(12, 45 - x), 10, v < 0.33 ? st.hi : v < 0.66 ? st.base : '#bcb2bc')));
    }
  }
  // The holds, scattered up it in bright colours.
  for (let y = 14, k = 0; y < h - 2; y += 9, k++) {
    const x = 10 + hash(k * 5.7 + h) * 28;
    out.push(E(x, y, 2.4, 1.8, HOLDS[k % HOLDS.length]), F(E(x - 0.6, y - 0.6, 1, 0.6, '#ffffff')));
  }
  // A wooden rail down its edge, a cap along the top, a flag.
  out.push(R(44, 4, 6, h + 2, WOOD), F(R(44, 4, 2, h + 2, ramp(WOOD).hi)), R(0, 2, 52, 5, WOOD_DK), F(R(0, 2, 52, 1.5, ramp(WOOD_DK).hi)));
  return out;
});
const launchArt = () => art('mr-launch', 50, 16, () => {
  const wd = ramp(WOOD);
  return [T([[2, 15], [46, 15], [46, 6], [2, 13]], wd.base), F(T([[2, 13], [46, 6], [46, 8], [2, 14.4]], wd.hi)), R(40, 6, 6, 9, WOOD_DK), R(8, 12, 4, 3, WOOD_DK)];
});
const PUFF = '#ffffff';
const PUFF_SH = '#e4eefc';
const cloudsArt = (w) => art(`mr-clouds|${w}`, w, 40, () => {
  const out = [];
  for (let x = 6, k = 0; x < w - 6; x += 26, k++) {
    const r = 14 + hash(k * 3.3 + w) * 9;
    out.push(E(x + 8, 40 - r * 0.7, r, r * 0.75, PUFF_SH));
  }
  for (let x = 0, k = 0; x < w; x += 22, k++) {
    const r = 10 + hash(k * 7.1 + w * 0.3) * 8;
    out.push(F(E(x + 10, 40 - r * 0.6, r, r * 0.66, PUFF)), F(E(x + 6, 40 - r * 0.9, r * 0.4, r * 0.24, '#ffffff')));
  }
  return out;
});
// Low wisps of fluff drifting over the ground, over the feet of anyone wading through.
function fluff(ctx, map, cam, from, to, time) {
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  // (Every 16 px along it, on the ground there: the first a little way in from its start.)
  for (let gx = Math.ceil(Math.max(from, cam.x - 20) / 16) * 16 + 8; gx < Math.min(to, cam.x + 700); gx += 16) {
    const k = gx / 16;
    const sx = gx - cam.x + Math.sin(time * 0.8 + k) * 2;
    const gy = groundAt(map, gx) - cam.y;
    ctx.beginPath();
    ctx.ellipse(sx, gy - 1, 11 + (k % 3) * 2, 5, 0, 0, TAU);
    ctx.fill();
  }
}

// ---------- Markers and bunting ----------
const markerArt = (n) => art(`mr-marker|${n}`, 24, 44, () => [R(4, 6, 3, 38, WOOD_DK), E(5.5, 43, 5, 1.6, '#c8b8a8'), ...Array.from({ length: n }, (_, i) => F(E(5.5, 30 - i * 6, 1.6, 1.6, '#ffffff')))]);
function pennant(ctx, x, y, time, wx, color) {
  const a = (lean(time, wx) + 0.4) * 0.5;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 14, y + 4 + a * 2);
  ctx.lineTo(x, y + 9);
  ctx.closePath();
  ctx.fill();
}
function bunting(ctx, x, gy, w, h, time, wx) {
  ctx.fillStyle = WOOD_DK;
  ctx.fillRect(snap(x - 1), snap(gy - h), 3, h);
  ctx.fillRect(snap(x + w - 1), snap(gy - h), 3, h);
  const top = gy - h + 4;
  const sag = Math.min(18, w * 0.06);
  ctx.strokeStyle = '#a88a6a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.quadraticCurveTo(x + w / 2, top + sag * 2, x + w, top);
  ctx.stroke();
  const n = Math.floor(w / 18);
  for (let i = 1; i < n; i++) {
    const u = i / n;
    const fx = x + w * u;
    const fy = top + sag * 4 * u * (1 - u);
    const sway = Math.sin(time * 2.2 + i * 0.9 + wx * 0.01) * 1.4;
    ctx.fillStyle = FLAGS[i % FLAGS.length];
    ctx.beginPath();
    ctx.moveTo(fx - 4, fy);
    ctx.lineTo(fx + 4, fy);
    ctx.lineTo(fx + sway * 0.6, fy + 9);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawRacePiece(ctx, map, kind, wx, extra, cam, width, time) {
  if (!map.mochiRace || !kind.startsWith('mr_')) return false;
  const w = extra?.w ?? 0;
  const x = wx - cam.x;
  if (x + w < -220 || x > width + 220) return true;
  const gy = groundAt(map, wx) - cam.y;
  switch (kind) {
    case 'mr_stands':
      place(ctx, standsArt(w), snap(x + w / 2), gy + 2);
      crowd(ctx, snap(x), gy + 2 - 96, w, time, wx);
      return true;
    case 'mr_board':
      place(ctx, boardArt(), snap(x), gy + 2);
      pennant(ctx, x + 1, gy - 112, time, wx, '#ff9ec0');
      ctx.fillStyle = WOOD_DK;
      ctx.fillRect(snap(x), snap(gy - 112), 2, 14);
      return true;
    case 'mr_arch':
      place(ctx, archArt(extra?.kind ?? 'start'), snap(x), gy + 2);
      if (extra?.kind === 'finish') finishLine(ctx, x, gy);
      return true;
    case 'mr_marker':
      place(ctx, markerArt(extra ?? 1), snap(x), gy + 2);
      pennant(ctx, x - 6, gy - 40, time, wx, '#ff9ec0');
      return true;
    case 'mr_bunting':
      bunting(ctx, x, gy, w, extra?.h ?? 90, time, wx);
      return true;
    case 'mr_wall': {
      const h = extra.bottom - extra.top;
      place(ctx, wallArt(h), snap(x - 24), extra.bottom - cam.y + 2);
      pennant(ctx, x - 2, extra.top - cam.y - 22, time, wx, '#ff9ec0');
      ctx.fillStyle = WOOD_DK;
      ctx.fillRect(snap(x - 3), snap(extra.top - cam.y - 24), 2, 22);
      return true;
    }
    case 'mr_launch':
      place(ctx, launchArt(), snap(x - 24), gy + 2);
      pennant(ctx, x - 46, gy - 30, time, wx, '#8fd3ff');
      ctx.fillStyle = WOOD_DK;
      ctx.fillRect(snap(x - 47), snap(gy - 30), 2, 30);
      return true;
    case 'mr_clouds':
      place(ctx, cloudsArt(w), snap(x + w / 2), gy + 8);
      return true;
    default:
      return true;
  }
}

// ---------- The racers ----------
// Back lanes first, so the nearer ones run in front; your Mochi with a little heart over it, and
// hearts bursting off it while a cheer lasts.
function heart(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.4, y - s * 0.2, x - s * 0.6, y - s * 1.2, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 0.6, y - s * 1.2, x + s * 1.4, y - s * 0.2, x, y + s * 0.9);
  ctx.fill();
}
// While the countdown runs, each racer's whole running cycle is asked for ahead, at every step of
// tiredness, for the sprite worker to paint in the background, so Go never stutters: one racer and
// one step of tiredness a frame, the most tired first (the newest asked is painted first, so the
// fresh ones, wanted at Go, come out first).
// (Swimming, climbing and gliding as well, where the course has them: once each, unwearied.)
const TIRED_STEPS = [1, 0.75, 0.5, 0.25, 0];
const SAMPLES = 32;
// Each way of moving: its stat, its styles (for the stride), what it is when it can't yet (a scoot
// steps with the distance; a flail and a drop go by the clock).
const MOVES = {
  run: { stat: 'run', table: GAITS, cant: CANT_POINTS.run, cantStride: 7 },
  swim: { stat: 'swim', table: SWIMS, cant: CANT_POINTS.swim, cantStride: 0 },
  climb: { stat: 'power', table: CLIMBS, cant: 0, cantStride: 0 },
  fly: { stat: 'fly', table: FLIES, cant: CANT_POINTS.fly, cantStride: 0 },
};
function aheadJobs(R, course) {
  const kinds = new Set(course.legs.map((l) => (l.kind === 'glide' ? 'fly' : l.kind)));
  const jobs = [];
  for (const kind of ['climb', 'fly', 'swim']) if (kinds.has(kind)) for (const r of R.racers) jobs.push([r, kind, 0]);
  for (const tired of TIRED_STEPS) for (const r of R.racers) jobs.push([r, 'run', tired]);
  return jobs;
}
function paintAhead(ctx, R, course, time) {
  R.aheadJobs ??= aheadJobs(R, course);
  const job = R.aheadJobs.shift();
  if (!job) return;
  const [r, kind, tired] = job;
  const mv = MOVES[kind];
  const pts = r.rec.stats[mv.stat].points;
  const cant = pts < mv.cant;
  const s = r.m.size === 'baby' ? 0.5 : 0.6;
  const stride = (cant ? mv.cantStride : mv.table[runStyle(pts)].stride) * (s / 0.6);
  const probe = (r.probes ??= {})[kind] ??= { genes: r.rec, dir: 1, size: r.m.size, mode: kind, inWater: kind === 'swim', ahead: true };
  ctx.save();
  ctx.translate(-5000, -5000);
  // (Each sample a moment after the drawing has eased into moving, a third of a second, so it's the
  // moving pose itself; one that can't yet goes by the clock, so its samples are spread in time.)
  for (let i = -1; i < SAMPLES; i++) {
    const k = (Math.max(0, i) + 0.5) / SAMPLES;
    Object.assign(probe, { speed: kind === 'run' ? runSpeed(pts) : 40, dist: stride ? k * stride : 0, tired, rest: false });
    drawMochiAnim(ctx, probe, 0, 0, i < 0 ? time : time + 0.4 + (stride ? i * 0.001 : k * 2.4));
  }
  ctx.restore();
}
export function drawRace(ctx, world, cam, time) {
  const R = world.race;
  const map = world.map;
  if (R.phase === 'ready') paintAhead(ctx, R, map.race, time);
  for (const r of [...R.racers].sort((a, b) => b.lane - a.lane)) {
    const x = r.x - cam.x;
    // (On a wall each lane has its own spot along it: no rise.)
    const y = r.y - (r.m.mode === 'climb' ? 0 : r.lane * LANE_RISE) - cam.y;
    drawMochiAnim(ctx, r.m, x, y, time);
    if (!r.you) continue;
    const top = y - (r.m.size === 'baby' ? 36 : 44);
    heart(ctx, x, top + Math.sin(time * 4) * 1.2, 3.2, '#ff6f9a');
    const left = R.phase === 'run' ? r.cheerUntil - R.clock : 0;
    if (left > 0) {
      const k = 1 - left / 1.2;
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + (i - 1) * 0.7;
        ctx.globalAlpha = Math.max(0, 1 - k);
        heart(ctx, x + Math.cos(a) * (8 + k * 16), top + 6 + Math.sin(a) * (8 + k * 16), 2.4, i === 1 ? '#ff8fb0' : '#ffd0dc');
      }
      ctx.globalAlpha = 1;
    }
  }
  // The cloud fluff's low wisps, over the feet of anyone wading through it.
  for (const [from, to] of map.race.slow ?? []) fluff(ctx, map, cam, from, to, time);
}
