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
//   mr_wall     a climbing crag: garden stone built out from a cliff face (render/garden.js
//               cragArt), coloured holds bolted in, a mossy top, a pennant where they come over
//               (the cliff face at x, from `extra.bottom` up to `extra.top`)
//   mr_launch   a little wooden kicker at a glide's edge (its lip at x), with a pennant
//   mr_clouds   the cloud fluff along the ground (from its x, `extra.w` long): big soft puffs
//               behind, and (drawn with the racers) low wisps over the feet of anyone wading

import { R, E, T, F, snap } from './pixel.js';
import { ramp, planks, gable, hash, lean } from './propkit.js';
import { limb } from './figure.js';
import { art, place } from './scenery.js';
import { cragArt, CRAG_FACE_AT } from './garden.js';
import { groundAt } from '../world/physics.js';
import { drawMochiAnim, drawSpectator, GAITS, SWIMS, FLIES, CLIMBS, runStyle } from './mochi-anim.js';
import { runSpeed } from '../world/mochi-race.js';
import { CANT_POINTS, newRecord } from '../data/mochi-raise.js';
import { rollMochi } from '../data/mochi-genes.js';

const TAU = Math.PI * 2;
const WOOD = '#c8945a';
const WOOD_DK = '#9a6a40';
const SAKURA = '#ffb3c8';
const PAPER = '#fff6ea';
const FLAGS = ['#ff9ec0', '#ffd75e', '#8fd3ff', '#9fe0a0', '#c8a8f0', '#ffffff'];

// ---------- The stands ----------
// The stands, `w` wide: a painted back wall under a striped awning on two poles, and three benches
// stepping up toward the back (TIERS: the top of each bench below the stands' top, and how far it's
// set in), each drawn over the Mochi seated behind it so only their tops show, as in real stands.
const STAND_H = 106;
const TIERS = [[58, 14], [74, 7], [90, 0]];
const standsBackArt = (w) => art(`mr-standsback|${w}`, w, STAND_H, () => {
  const out = [];
  // The back wall: soft painted boards, a rail along the top, a little shadow under the awning.
  // (Flat: one long board lit from the corner would darken toward its far end.)
  out.push(F(R(5, 26, w - 10, STAND_H - 26, '#f8e6d6')), F(R(5, 26, w - 10, 5, '#ecd2bc')));
  for (let x = 22, k = 0; x < w - 12; x += 26, k++) out.push(F(R(x, 32, 1, STAND_H - 34, '#efd8c4')));
  // The poles, and the awning: striped, a scalloped edge, a shine along the front.
  out.push(R(1, 4, 5, STAND_H - 4, WOOD_DK), F(R(1, 4, 1.6, STAND_H - 4, ramp(WOOD_DK).hi)), R(w - 6, 4, 5, STAND_H - 4, WOOD_DK), F(R(w - 6, 4, 1.6, STAND_H - 4, ramp(WOOD_DK).hi)));
  for (let x = 0, k = 0; x < w; x += 16, k++) {
    out.push(R(x, 6, Math.min(16, w - x), 16, k % 2 ? '#ffffff' : SAKURA));
    out.push(E(x + 8, 22, 8, 4.4, k % 2 ? '#ffffff' : SAKURA));
  }
  out.push(F(R(0, 6, w, 2, ramp(SAKURA).hi)), F(R(-1, 2, w + 2, 5, WOOD_DK)), F(R(-1, 2, w + 2, 1.4, ramp(WOOD_DK).hi)));
  return out;
});
const benchArt = (w, i) => art(`mr-bench|${w}|${i}`, w, 17, () => {
  const inset = TIERS[i][1];
  const wd = ramp(WOOD);
  const bw = w - inset * 2;
  const out = [F(R(inset, 0, bw, 16, wd.base)), F(R(inset, 0, bw, 3, wd.hi)), F(R(inset, 3, bw, 1, wd.deep)), F(R(inset, 15, bw, 1, wd.deep)), F(R(inset, 0, 1, 16, wd.deep)), F(R(inset + bw - 1, 0, 1, 16, wd.deep))];
  // The boards' joins, and a little pennant painted on the front one.
  for (let x = inset + 30; x < w - inset - 10; x += 52) out.push(F(R(x, 4, 1, 11, wd.sh)));
  if (i === 2) for (let x = inset + 56; x < w - inset - 30; x += 104) out.push(F(T([[x, 6], [x + 12, 6], [x + 6, 13]], FLAGS[(x / 104) % FLAGS.length | 0])));
  return out;
});
// The crowd: little Mochi (CROWD: a dozen of every kind, made once) seated along each bench, each
// its own and facing its own way, swaying, and every few seconds cheering: paws up, flung high, a
// shout, and down again (faster on a course, where there's a race to cheer). Each drawing is the
// real Mochi's, painted once and then only placed (render/mochi-anim.js drawSpectator).
let CROWD = null;
const crowdOf = () => (CROWD ??= Array.from({ length: 16 }, (_, i) => newRecord(rollMochi(7100 + i * 131, { coat: null }))));
const CHEER_SEQ = [1, 2, 3, 3, 2, 1];
function crowdRow(ctx, x0, top, w, i, time, wx, racing) {
  const [ty, inset] = TIERS[i];
  const pool = crowdOf();
  for (let sx = inset + 14, k = 0; sx < w - inset - 10; sx += 22, k++) {
    const h = hash(wx * 0.37 + i * 13.1 + k * 7.7);
    // (A seat or two free here and there.)
    if (hash(wx * 0.53 + i * 3.7 + k * 11.3) < 0.12) continue;
    const g = pool[Math.floor(hash(wx * 0.11 + i * 5.3 + k * 2.9) * pool.length)];
    const facing = h < 0.5 ? -1 : 1;
    // Every few seconds, a cheer (a second long, on its own beat); between, a gentle sway.
    const period = (racing ? 2.6 : 5.5) + h * 2.5;
    const u = ((time + h * 17) % period) / period;
    const into = u * period;
    const beat = into < 1 ? CHEER_SEQ[Math.min(CHEER_SEQ.length - 1, Math.floor(into * CHEER_SEQ.length))] : 0;
    const hop = into < 1 ? Math.sin(Math.PI * into) * 1.6 : 0;
    const sway = Math.sin(time * (1.6 + h) + h * 20) * 0.5;
    drawSpectator(ctx, g, x0 + sx + (h - 0.5) * 6 + sway, top + ty + 3 - hop, beat, facing, `crowd|${wx}|${i}|${k}`);
  }
}

// ---------- The race board ----------
// The race board: a little roofed board on two posts, framed in wood, cork inside, three stage cards
// pinned up (a blossom for the sprint, a drop for the lake, a mountain and its flag for the climb),
// today's race times on a paper strip under them, and a small mochi sat on the roof's peak.
const boardArt = () => art('mr-board', 100, 104, () => {
  const wd = ramp(WOOD);
  const out = [
    // The posts and their feet.
    R(13, 30, 5, 72, WOOD_DK), R(82, 30, 5, 72, WOOD_DK), E(15.5, 102, 6, 2, '#d8ccc4'), E(84.5, 102, 6, 2, '#d8ccc4'),
    // The roof, and the mochi on its peak.
    ...gable(2, 98, 32, 7, '#d0705a', 5), F(R(2, 31, 96, 2, '#a8503e')),
    // The frame, the cork, a shadow under the eaves.
    R(9, 34, 82, 54, wd.base), F(R(9, 34, 82, 2, wd.hi)), F(R(9, 86, 82, 2, wd.deep)),
    F(R(13, 38, 74, 46, '#e8c89a')), F(R(13, 38, 74, 3, '#d4b080')),
    ...[[20, 46], [34, 70], [58, 44], [76, 72], [44, 80], [70, 58]].map(([x, y]) => F(E(x, y, 0.7, 0.5, '#c8a070'))),
  ];
  // The three cards, each tilted its own way a little, pinned at the top.
  const card = (cx, tilt, pin) => {
    out.push(T([[cx - 10, 41 + tilt], [cx + 10, 41 - tilt], [cx + 10, 64 - tilt], [cx - 10, 64 + tilt]], PAPER), F(E(cx, 42, 1.6, 1.6, pin)), F(E(cx - 0.4, 41.6, 0.6, 0.6, '#ffffff')));
  };
  card(25, 0.8, '#e8485e');
  card(50, -0.6, '#4a9ae0');
  card(75, 0.5, '#9a7ad8');
  // A blossom.
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
    out.push(F(E(25 + Math.cos(a) * 3.4, 52 + Math.sin(a) * 3.4, 2.6, 2.6, SAKURA)));
  }
  out.push(F(E(25, 52, 1.6, 1.6, '#ffd75e')), F(R(19, 59, 12, 1.4, '#ff9ec0')));
  // A drop of water.
  out.push(F(T([[46.4, 53], [50, 45.6], [53.6, 53]], '#8fd3ff')), F(E(50, 54, 4, 3.8, '#8fd3ff')), F(E(51.2, 55.4, 2, 1.6, '#6ab8f0')), F(E(48.4, 53.4, 0.9, 1.5, '#ffffff')), F(R(44, 59.6, 12, 1.4, '#8fd3ff')));
  // A mountain with its flag.
  out.push(F(T([[67, 58], [75, 46], [83, 58]], '#b8a8f0')), F(T([[75, 46], [78, 50.6], [76.6, 51.6], [75, 50], [73.6, 51.4], [72.2, 50.4]], '#ffffff')), F(R(74.6, 42.4, 0.8, 4, '#7a6a8a')), F(T([[75.4, 42.4], [79, 43.4], [75.4, 44.6]], '#ff8fb0')), F(R(69, 59.6, 12, 1.4, '#b8a8f0')));
  // Today's times on a paper strip.
  out.push(R(17, 68, 66, 13, PAPER), F(E(19.5, 69.5, 1.2, 1.2, '#ffd75e')), F(E(80.5, 69.5, 1.2, 1.2, '#ffd75e')));
  for (let k = 0; k < 2; k++) out.push(F(R(21, 72 + k * 4, 30 - k * 6, 1.2, '#d8c0a8')), F(R(58, 72 + k * 4, 18, 1.2, k ? '#9fe0a0' : '#ff9ec0')));
  // The mochi on the peak, its sprout up.
  out.push(E(50, 6, 6, 5, '#fff8f2'), F(E(47.6, 6.4, 0.7, 1, '#4a3040')), F(E(52.4, 6.4, 0.7, 1, '#4a3040')), F(E(45.8, 7.8, 1.3, 0.7, '#ffbccb')), F(E(54.2, 7.8, 1.3, 0.7, '#ffbccb')), F(R(49.6, -1, 0.8, 2.4, '#6fae52')), F(E(48.2, -0.6, 1.8, 0.9, '#8fd16f')), F(E(51.8, -1, 1.8, 0.9, '#8fd16f')));
  return out;
});

// ---------- Arches ----------
// An arch over the course (`kind`: start, finish, or the stadium's gate out to the courses): two
// round posts on stone feet, three little dango stacked on top of each, a curved banner with a
// scalloped edge (sakura pink at the start, chequered at the finish, sky blue at the gate), and under
// it a garland draped between the posts: blossoms and leaves, or at the finish little pennants.
const ARCH_DANGO = ['#b8e09c', '#fff6ee', '#ffb7cf'];
const archTop = (x) => 13 + 12 * ((x - 75) / 67) ** 2;
const archArt = (kind) => art(`mr-arch|${kind}`, 150, 132, () => {
  const post = ramp('#ecdcc4');
  const stone = '#e2d8d2';
  const banner = kind === 'finish' ? '#3a3040' : kind === 'gate' ? '#8fc8f0' : SAKURA;
  const out = [];
  // The posts, a ribbon wound round each, their stone feet.
  for (const px of [16, 134]) {
    out.push(R(px - 6, 30, 12, 96, post.base), F(R(px - 6, 30, 3, 96, post.hi)), F(R(px + 4, 30, 2, 96, post.sh)));
    for (let y = 40; y < 118; y += 16) out.push(F(T([[px - 6, y + 4], [px + 6, y], [px + 6, y + 3], [px - 6, y + 7]], kind === 'finish' ? '#ff9ec0' : ramp(banner).hi)));
    out.push(R(px - 9, 122, 18, 10, stone), F(R(px - 9, 122, 18, 2, '#f2ece8')), E(px, 131, 11, 2, stone));
  }
  // The banner: a band curving over the top, its lower edge scalloped.
  const top = [];
  const bot = [];
  for (let x = 6; x <= 144; x += 6) {
    top.push([x, archTop(x)]);
    bot.push([x, archTop(x) + 17]);
  }
  out.push(T([...top, ...bot.reverse()], banner));
  for (let x = 9; x <= 141; x += 9) out.push(E(x, archTop(x) + 17, 4.6, 3.4, banner));
  out.push(F(T([...top, ...top.slice().reverse().map(([x, y]) => [x, y + 2.4])], ramp(banner).hi)));
  if (kind === 'finish') {
    // Chequered along the curve.
    for (let i = 0; i < 14; i++) {
      const x = 10 + i * 9.6;
      const y = archTop(x + 4.8) + 3;
      out.push(F(R(x + (i % 2) * 4.8, y, 4.8, 5.5, '#ffffff')), F(R(x + ((i + 1) % 2) * 4.8, y + 5.5, 4.8, 5.5, '#ffffff')));
    }
  } else {
    // Little blossoms (white clouds on the gate's) along it.
    for (let i = 0; i < 7; i++) {
      const x = 21 + i * 18;
      const y = archTop(x) + 8.5;
      if (kind === 'gate') out.push(F(E(x - 2, y + 0.6, 3.4, 2.4, '#ffffff')), F(E(x + 2, y, 3.8, 2.8, '#ffffff')));
      else out.push(F(E(x, y, 3.2, 3, '#ffffff')), F(E(x, y, 1.3, 1.2, '#ffd75e')));
    }
  }
  // The dango on the posts.
  for (const px of [16, 134]) ARCH_DANGO.forEach((c, k) => out.push(E(px, 25 - k * 7.4, 5.4, 5, c), F(E(px - 1.8, 23 - k * 7.4, 1.6, 1, '#ffffff'))));
  for (const px of [16, 134]) out.push(F(R(px - 0.6, 6, 1.2, 4, '#c8945a')));
  // The garland, draped between the posts.
  const sag = (x) => 46 + 12 * Math.sin((Math.PI * (x - 22)) / 106);
  for (let x = 22, k = 0; x <= 128; x += 7, k++) {
    const y = sag(x);
    if (kind === 'finish') out.push(F(T([[x - 3, y - 1], [x + 3, y - 1], [x, y + 6]], FLAGS[k % FLAGS.length])));
    else if (k % 2) out.push(F(E(x, y + 1, 2.6, 1.4, '#8fcf72')));
    else out.push(F(E(x, y, 3, 2.8, kind === 'gate' ? '#ffffff' : k % 4 ? '#ffd0dc' : '#ffffff')), F(E(x, y, 1.1, 1, '#ffd75e')));
  }
  if (kind === 'finish') for (let x = 22; x < 128; x += 2) out.push(F(R(x, sag(x) - 1.4, 2, 0.8, '#7a6a8a')));
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

// ---------- Markers ----------
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

// ---------- Climbing walls, the launch, the cloud fluff ----------
const HOLDS = ['#ff8fb0', '#ffd75e', '#8fd3ff', '#9fe0a0', '#c8a8f0', '#ffa64d'];
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

export function drawRacePiece(ctx, map, kind, wx, extra, cam, width, time) {
  if (!map.mochiRace || !kind.startsWith('mr_')) return false;
  const w = extra?.w ?? 0;
  const x = wx - cam.x;
  if (x + w < -220 || x > width + 220) return true;
  const gy = groundAt(map, wx) - cam.y;
  switch (kind) {
    case 'mr_stands': {
      const top = gy + 2 - STAND_H;
      place(ctx, standsBackArt(w), snap(x + w / 2), gy + 2);
      for (let i = 0; i < TIERS.length; i++) {
        crowdRow(ctx, snap(x), top, w, i, time, wx, Boolean(map.race));
        place(ctx, benchArt(w, i), snap(x + w / 2), top + TIERS[i][0] + 17);
      }
      return true;
    }
    case 'mr_board':
      place(ctx, boardArt(), snap(x), gy + 2);
      return true;
    case 'mr_arch':
      place(ctx, archArt(extra?.kind ?? 'start'), snap(x), gy + 2);
      if (extra?.kind === 'finish') finishLine(ctx, x, gy);
      return true;
    case 'mr_marker':
      place(ctx, markerArt(extra ?? 1), snap(x), gy + 2);
      pennant(ctx, x - 6, gy - 40, time, wx, '#ff9ec0');
      return true;
    case 'mr_wall': {
      // The climbing crag: built out from the cliff face at x, a pennant on top where they come over.
      const h = extra.bottom - extra.top;
      const s = cragArt(h, Math.round(wx * 0.37), HOLDS);
      place(ctx, s, snap(x - CRAG_FACE_AT + s.w / 2), extra.bottom - cam.y);
      pennant(ctx, x + 6, extra.top - cam.y - 22, time, wx, '#ff9ec0');
      ctx.fillStyle = WOOD_DK;
      ctx.fillRect(snap(x + 5), snap(extra.top - cam.y - 24), 2, 24);
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
    // (Every lane on the ground, the water or the wall itself: the ground is an edge, not a field,
    // so a lane drawn higher would float. The back lanes are drawn first, behind.)
    const y = r.y - cam.y;
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
