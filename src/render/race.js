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
import { ramp, planks, gable, hash, lean, pivoted, swing } from './propkit.js';
import { limb } from './figure.js';
import { art, place } from './scenery.js';
import { cragArt, CRAG_FACE_AT } from './garden.js';
import { groundAt } from '../world/physics.js';
import { drawMochiAnim, drawSpectator, drawMallet, SPECTATOR_BEATS, GAITS, SWIMS, FLIES, CLIMBS, runStyle } from './mochi-anim.js';
import { runSpeed, lineupOffset, PODIUM, podiumSpot, INTRO, introLen, standings, progressOf, boulderX, JUMP_H, JUMP_PHASE, ballStart, ballEnd, ballRadius, ROLL_R, standX, STACK_REACH, STACK_TUB, STACK_FLY } from '../world/mochi-race.js';
import { drawKagamiPiece, KAGAMI } from './mochi-stack-acts.js';
import { VW, VH } from '../input.js';
import { CANT_POINTS, newRecord } from '../data/mochi-raise.js';
import { rollMochi } from '../data/mochi-genes.js';
import { CHEER } from '../data/mochi-race.js';
import { drawCoursePiece, noteRace, drawRaceBehind, drawRaceFront, archDango } from './courseart.js';

const TAU = Math.PI * 2;
const smooth01 = (k) => k * k * (3 - 2 * k);
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
  const n = Math.max(1, Math.round(w / 16));
  const sw = w / n;
  for (let k = 0; k < n; k++) {
    out.push(R(k * sw, 6, sw, 16, k % 2 ? '#ffffff' : SAKURA));
    out.push(E(k * sw + sw / 2, 22, sw / 2, 4.4, k % 2 ? '#ffffff' : SAKURA));
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
  out.push(E(50, 8, 6, 5, '#fff8f2'), F(E(47.6, 8.4, 0.7, 1, '#4a3040')), F(E(52.4, 8.4, 0.7, 1, '#4a3040')), F(E(45.8, 9.8, 1.3, 0.7, '#ffbccb')), F(E(54.2, 9.8, 1.3, 0.7, '#ffbccb')), F(R(49.6, 1, 0.8, 2.4, '#6fae52')), F(E(48.2, 1.4, 1.8, 0.9, '#8fd16f')), F(E(51.8, 1, 1.8, 0.9, '#8fd16f')));
  return out;
});

// ---------- Arches ----------
// An arch over the course (`kind`: start, finish, or the stadium's gate out to the courses): two
// round posts on stone feet, three little dango stacked on top of each, a curved banner with a
// scalloped edge (sakura pink at the start, chequered at the finish, sky blue at the gate), and under
// it a garland draped between the posts: blossoms and leaves, or at the finish little pennants.
const ARCH_DANGO = ['#b8e09c', '#fff6ee', '#ffb7cf'];
// The Grand Tour's part arches, each in its part's colour (softened for the banner).
const PART_ARCH = ['#ffb3c8', '#9cccf4', '#f4bc88', '#ffa898', '#b8a0ec'];
// A part's sign: a little wooden board on two cords from the arch's garland, its number on a round
// plate in the part's colour, its name, its icon; swinging a touch in the breeze.
function partSign(ctx, x, y, n, part, time, wx) {
  const a = Math.sin(time * 1.3 + wx * 0.01) * 0.05;
  ctx.save();
  ctx.translate(x, y - 16);
  ctx.rotate(a);
  ctx.font = '800 7.5px Nunito, "Trebuchet MS", system-ui, sans-serif';
  const w = Math.max(70, ctx.measureText(part.name).width + 30);
  ctx.strokeStyle = '#9a6a40';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 8, 0);
  ctx.lineTo(-w / 2 + 12, 14);
  ctx.moveTo(w / 2 - 8, 0);
  ctx.lineTo(w / 2 - 12, 14);
  ctx.stroke();
  ctx.fillStyle = 'rgba(80,40,30,0.2)';
  ctx.fillRect(-w / 2 + 1, 15.5, w, 15);
  ctx.fillStyle = WOOD;
  ctx.fillRect(-w / 2, 14, w, 15);
  ctx.fillStyle = '#dcae74';
  ctx.fillRect(-w / 2, 14, w, 2);
  ctx.fillStyle = WOOD_DK;
  ctx.fillRect(-w / 2, 27.5, w, 1.5);
  ctx.fillStyle = '#fff6e8';
  ctx.fillRect(-w / 2 + 3, 16.5, w - 6, 10.5);
  ctx.fillStyle = part.color;
  ctx.beginPath();
  ctx.arc(-w / 2 + 10, 21.7, 4.4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '900 6px Nunito, "Trebuchet MS", system-ui, sans-serif';
  ctx.fillText(String(n), -w / 2 + 10, 23.9);
  ctx.font = '800 7.5px Nunito, "Trebuchet MS", system-ui, sans-serif';
  ctx.fillStyle = '#7a4a5a';
  ctx.fillText(part.name, 4, 24.4);
  ctx.textAlign = 'left';
  ctx.restore();
}
// A hot-air balloon: a round envelope in stripes (pink and cream, or mint and cream), a little
// highlight, its skirt, cords down to a wicker basket with a pennant.
const BALLOON_STRIPES = [['#ff9ec0', '#fff2ea'], ['#8fd8c0', '#fff6e8']];
const balloonArt = (v) => art(`mr-balloon|${v}`, 64, 96, () => {
  const [a, b] = BALLOON_STRIPES[v % BALLOON_STRIPES.length];
  const out = [];
  const cx = 32;
  const cy = 32;
  const env = (k) => {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = -Math.PI / 2 + (i / 24) * Math.PI * 2;
      const r = 28;
      const sx = Math.cos(t) * r * k;
      const sy = Math.sin(t) * r;
      // (A teardrop: the bottom draws in towards the skirt.)
      const pinch = Math.sin(t) > 0 ? 1 - Math.sin(t) * 0.42 : 1;
      pts.push([cx + sx * pinch, cy + sy * (Math.sin(t) > 0 ? 1.12 : 1)]);
    }
    return pts;
  };
  out.push(T(env(1), b));
  for (const k of [0.78, 0.34]) out.push(F(T(env(k), a)));
  out.push(F(T(env(0.12), b)));
  out.push(F(E(cx - 12, cy - 14, 5, 7, '#ffffff')));
  // The skirt and the cords.
  out.push(R(cx - 7, 62, 14, 4, a), F(R(cx - 7, 62, 14, 1.2, '#ffffff')));
  for (const dx of [-6, -2, 2, 6]) out.push(F(T([[cx + dx - 0.4, 66], [cx + dx + 0.4, 66], [cx + dx * 0.8 + 0.4, 80], [cx + dx * 0.8 - 0.4, 80]], '#9a6a40')));
  // The basket.
  out.push(R(cx - 8, 80, 16, 12, '#c8945a'), F(R(cx - 8, 80, 16, 2, '#9a6a40')), F(R(cx - 8, 85, 16, 1, '#dcae74')), F(R(cx - 8, 89, 16, 1, '#dcae74')));
  out.push(F(T([[cx + 6, 70], [cx + 6, 79], [cx + 12, 72]], a)));
  return out;
});
// A string of lights from one lantern post to the next, sagging between them, little bulbs in warm
// colours along it, each with a soft halo, twinkling (by the world clock, not repainted pictures).
const BULBS = ['#ffd27a', '#ff9ec0', '#fff2b0', '#b8e0ff'];
function stringLights(ctx, map, x1, x2, cam, time) {
  const ax = x1 + 2;
  const bx = x2 - 2;
  const ay = groundAt(map, x1) - 46;
  const by = groundAt(map, x2) - 46;
  if (bx - cam.x < -40 || ax - cam.x > VW + 40) return;
  const at = (k) => [ax + (bx - ax) * k - cam.x, ay + (by - ay) * k + Math.sin(Math.PI * k) * 22 - cam.y];
  ctx.strokeStyle = '#6a4a5a';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let i = 0; i <= 16; i++) {
    const [px, py] = at(i / 16);
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
  const n = Math.max(4, Math.round((bx - ax) / 16));
  for (let i = 1; i < n; i++) {
    const [px, py] = at(i / n);
    const c = BULBS[i % BULBS.length];
    const tw = 0.55 + 0.45 * Math.sin(time * 2.2 + i * 1.7 + x1 * 0.01);
    ctx.globalAlpha = 0.18 + 0.14 * tw;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(px, py + 2.6, 4.6, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(px, py + 2.6, 1.7, 0, TAU);
    ctx.fill();
  }
}
const archTop = (x) => 13 + 12 * ((x - 75) / 67) ** 2;
// (`bare`: without the dango on its posts, for a course that draws them live to bounce:
// render/courseart.js archDango.)
const archArt = (kind, color = null, bare = false) => art(`mr-arch|${kind}|${color}|${bare}`, 150, 132, () => {
  const post = ramp('#ecdcc4');
  const stone = '#e2d8d2';
  const banner = color ?? (kind === 'finish' ? '#3a3040' : kind === 'gate' ? '#8fc8f0' : SAKURA);
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
  if (!bare) for (const px of [16, 134]) ARCH_DANGO.forEach((c, k) => out.push(E(px, 25 - k * 7.4, 5.4, 5, c), F(E(px - 1.8, 23 - k * 7.4, 1.6, 1, '#ffffff'))));
  if (!bare) for (const px of [16, 134]) out.push(F(R(px - 0.6, 6, 1.2, 4, '#c8945a')));
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
// (Rounded off at both ends: the puffs grow smaller towards each end and stay inside the picture, so
// the bank closes in soft round puffs instead of being sliced off flat.)
const cloudsArt = (w) => art(`mr-clouds2|${w}`, w, 40, () => {
  const out = [];
  const taper = (cx) => Math.max(0.35, Math.min(1, Math.min(cx, w - cx) / 70));
  const puff = (cx, r, ry) => {
    const rr = r * taper(cx);
    const x = Math.max(rr + 1, Math.min(w - rr - 1, cx));
    return [x, rr, ry * taper(cx)];
  };
  for (let x = 6, k = 0; x < w - 6; x += 26, k++) {
    const r = 14 + hash(k * 3.3 + w) * 9;
    const [px, rr, ry] = puff(x + 8, r, r * 0.75);
    out.push(E(px, 40 - rr * 0.7, rr, ry, PUFF_SH));
  }
  for (let x = 0, k = 0; x < w; x += 22, k++) {
    const r = 10 + hash(k * 7.1 + w * 0.3) * 8;
    const [px, rr, ry] = puff(x + 10, r, r * 0.66);
    out.push(F(E(px, 40 - rr * 0.6, rr, ry, PUFF)), F(E(px - 4 * taper(x + 10), 40 - rr * 0.9, rr * 0.4, rr * 0.24, '#ffffff')));
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
  const w = extra?.w ?? (extra?.to ? extra.to - wx : 0);
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
    case 'mr_arch': {
      // (On a festival course, its dango bob and bounce at the big moments: render/courseart.js.)
      const kind = extra?.kind ?? 'start';
      const live = map.look?.festival && kind !== 'gate';
      place(ctx, archArt(kind, null, live), snap(x), gy + 2);
      if (live) archDango(ctx, map, x, gy, kind, time);
      if (kind === 'finish') finishLine(ctx, x, gy);
      return true;
    }
    case 'mr_checkpoint': {
      // A part of a long course (the Grand Tour): an arch in the part's colour, and hanging from its
      // garland a wooden sign with the part's number and name, swinging a little.
      const part = map.race?.parts?.[(extra?.part ?? 1) - 1];
      place(ctx, archArt('part', PART_ARCH[(extra?.part ?? 1) - 1] ?? SAKURA), snap(x), gy + 2);
      if (part) partSign(ctx, x, gy - 78, extra.part, part, time, wx);
      return true;
    }
    case 'mr_balloon':
      // A hot-air balloon drifting over the course, bobbing gently (`extra.y`: where its basket floats).
      place(ctx, balloonArt(extra?.color ?? 0), snap(x + Math.sin(time * 0.35 + wx) * 6), snap(extra.y - cam.y + Math.sin(time * 0.8 + wx * 0.01) * 4));
      return true;
    case 'mr_lights':
      // A string of little lights draped from this lantern post to the next, twinkling softly.
      stringLights(ctx, map, wx, extra.to, cam, time);
      return true;
    case 'mr_marker':
      // (A course with its own marker draws it: render/courseart.js.)
      if (map.look?.launchArt && drawCoursePiece(ctx, map, kind, wx, extra, cam, width, time)) return true;
      place(ctx, markerArt(extra ?? 1), snap(x), gy + 2);
      pennant(ctx, x - 6, gy - 40, time, wx, '#ff9ec0');
      return true;
    case 'mr_wall': {
      // (A course with its own cliffs draws them: render/courseart.js.)
      if (map.look?.wallArt && drawCoursePiece(ctx, map, kind, wx, extra, cam, width, time)) return true;
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
      if (map.look?.launchArt && drawCoursePiece(ctx, map, kind, wx, extra, cam, width, time)) return true;
      place(ctx, launchArt(), snap(x - 24), gy + 2);
      pennant(ctx, x - 46, gy - 30, time, wx, '#8fd3ff');
      ctx.fillStyle = WOOD_DK;
      ctx.fillRect(snap(x - 47), snap(gy - 30), 2, 30);
      return true;
    case 'mr_clouds':
      if (map.look?.launchArt && drawCoursePiece(ctx, map, kind, wx, extra, cam, width, time)) return true;
      place(ctx, cloudsArt(w), snap(x + w / 2), gy + 8);
      return true;
    default:
      // (The courses' own pieces, from their redraw: render/courseart.js.)
      drawCoursePiece(ctx, map, kind, wx, extra, cam, width, time);
      return true;
  }
}

// ---------- The racers ----------
// Back lanes first, so the nearer ones run in front; your Mochi with a little heart over it, and
// hearts bursting off it while a cheer lasts.
function youTag(ctx, x, y) {
  ctx.save();
  ctx.font = '800 6px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff6f9a';
  ctx.beginPath();
  ctx.roundRect(Math.round(x - 9), Math.round(y - 5), 18, 8, 4);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText('You', Math.round(x), Math.round(y + 1.2));
  ctx.restore();
}
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
// (Swimming, climbing and gliding as well, where the course has them: once each, unwearied. And
// for the end, everyone's cheer, for whoever makes the podium, and every face in the crowd at the
// finish, so the camera's cut to the podium never waits on a painting.)
const TIRED_STEPS = [1, 0.75, 0.5, 0.25, 0];
const SAMPLES = 32;
// Each way of moving: its stat, its styles (for the stride), what it is when it can't yet (a crawl
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
  for (const r of R.racers) jobs.push([r, 'cheer', 0]);
  crowdOf().forEach((g) => jobs.push([null, 'crowd', g]));
  return jobs;
}
const CHEER_SAMPLES = 40;
function paintAhead(ctx, R, course, time) {
  R.aheadJobs ??= aheadJobs(R, course);
  const job = R.aheadJobs.shift();
  if (!job) return;
  const [r, kind, tired] = job;
  if (kind === 'crowd') {
    for (let b = 0; b < SPECTATOR_BEATS; b++) drawSpectator(ctx, tired, 0, 0, b, 1, null, true);
    return;
  }
  if (kind === 'cheer') {
    const probe = (r.probes ??= {}).cheer ??= { genes: r.rec, dir: 1, size: r.m.size, mode: 'run', speed: 0, dist: 0, ahead: true };
    probe.action = { name: 'cheer', t0: time, hold: 30 };
    ctx.save();
    ctx.translate(-5000, -5000);
    for (let i = 0; i < CHEER_SAMPLES; i++) drawMochiAnim(ctx, probe, 0, 0, time + 0.4 + i / 24);
    ctx.restore();
    return;
  }
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
// ---------- The Power course's boulders (world/mochi-race.js, a 'smash' leg) ----------
// A huge snow-capped granite boulder in each lane, cracking a little more with every hit (four
// drawings). Polished 2026-11-15: each blow lands with a flash, jolts the boulder back on its heel to
// rock there a moment, throws chips of stone and snow back past the racer to bounce and lie in the
// snow, kicks stone dust off its face and shakes snow off its cap to sift down it; grit drops out as
// the cracks spread. The last blow lights the cracks up for a couple of frames, then it bursts -
// chunks thrown up and out, tumbling, bouncing and lying there; a cloud of dust and snow boiling up
// and thinning away, more rolling out along the ground - and a heap of rubble settles where it was.
const BOULDER_W = 58;
const BOULDER_H = 52;
// (How long the last blow's lit-up cracks show before it bursts.)
const BURST_AT = 0.07;
// (How big a racer's blows land, by its range of Power - the smash or pound it does, render/
// mochi-anim.js: a weak pat barely chips it, the strongest rock it right back.)
const FORCE = [0.55, 0.7, 0.85, 1, 1.18, 1.36];
// (Where a racer's fists meet its boulder, from the middle of the boulder's foot: the face it hits.)
const HIT_DX = -25;
const HIT_DY = -14;
// (Three shapes, and every other lane's turned round, so the row never reads as one boulder stamped
// six times: a round one, a tall one with a shoulder of rock, a broad flat one.)
const BOULDER_SHAPES = [
  [[29, 30, 27, 22], [26, 26, 22, 17], [20, 20, 10, 7], [38, 41, 16, 8], [28, 11, 18, 6]],
  [[28, 29, 23, 23], [25, 25, 18, 18], [21, 17, 8, 7], [40, 40, 14, 9], [26, 8, 14, 5]],
  [[30, 33, 28, 19], [27, 30, 23, 14], [19, 25, 11, 6], [41, 43, 15, 7], [30, 16, 20, 5]],
];
const CRACKS = [
  [[30, 16, 26, 30, 0.8, 0.6], [26, 30, 30, 40, 0.7, 0.5]],
  [[26, 30, 14, 34, 0.7, 0.5], [30, 22, 42, 28, 0.7, 0.5], [42, 28, 46, 38, 0.6, 0.4]],
  [[14, 34, 10, 44, 0.6, 0.4], [30, 40, 34, 49, 0.6, 0.4], [42, 28, 50, 22, 0.6, 0.4]],
];
const boulderArt = (crack, v = 0) => art(`mr-boulder|${crack}|${v}`, BOULDER_W, BOULDER_H, () => {
  const [body, lit, glint, dark, cap] = BOULDER_SHAPES[v % BOULDER_SHAPES.length];
  const out = [E(...body, '#8a93a6'), F(E(...lit, '#9aa3b6')), F(E(...glint, '#b3bccd')), F(E(...dark, '#767f92'))];
  if (v === 1) out.push(E(46, 36, 10, 12, '#838ca0'), F(E(44, 33, 7, 8, '#959eb2')));
  out.push(F(E(...cap, '#f4f8ff')), F(E(cap[0] - 6, cap[1] - 2, cap[2] / 2, cap[3] * 0.56, '#ffffff')), F(E(cap[0] + 12, cap[1] + 3, 6, 3, '#eaf0fb')));
  out.push(F(E(29, 51, 27, 1.4, '#c8d4e8')));
  // (Crack 4 is the last blow landing: every crack blazing with light from inside.)
  const lines = CRACKS.slice(0, Math.min(3, crack)).flat();
  if (crack >= 4) {
    for (const [x1, y1, x2, y2, w1, w2] of lines) out.push(F(limb(x1, y1, x2, y2, w1 * 2.4, w2 * 2.4, '#ffc977')));
    for (const [x1, y1, x2, y2, w1, w2] of lines) out.push(F(limb(x1, y1, x2, y2, w1 * 1.1, w2 * 1.1, '#fffbe8')));
    out.push(F(E(30, 30, 3.4, 3, '#fff3c4')));
  } else {
    for (const [x1, y1, x2, y2, w1, w2] of lines) out.push(F(limb(x1, y1, x2, y2, w1, w2, '#4f566a')));
    if (crack >= 3) out.push(F(E(30, 30, 2.4, 2, '#3a3f50')));
  }
  return out;
});
const chunkArt = (k) => art(`mr-chunk|${k % 3}`, 14, 12, () => [T([[1, 6], [5, 1], [12, 3], [13, 9], [6, 11]], ['#8a93a6', '#9aa3b6', '#767f92'][k % 3]), F(T([[4, 3], [9, 3], [6, 6]], '#b3bccd'))]);
const rubbleArt = () => art('mr-rubble', 40, 12, () => [E(10, 8, 7, 4, '#8a93a6'), E(22, 9, 8, 3.6, '#9aa3b6'), E(31, 8, 6, 4, '#767f92'), F(E(20, 4.6, 12, 2, '#f4f8ff')), F(E(20, 11.4, 18, 1, '#c8d4e8'))]);
// Where a piece thrown from (x0, y0) at (vx, vy) is `t` seconds on, under gravity `g`: one bounce off
// the ground at `floor` (a third of its speed back up, half along), then sliding to a stop and lying
// there. [x, y, lying still, when it first landed].
function thrown(t, x0, y0, vx, vy, g, floor) {
  const a = g / 2;
  const t1 = (-vy + Math.sqrt(Math.max(0, vy * vy - 4 * a * (y0 - floor)))) / (2 * a);
  if (t <= t1) return [x0 + vx * t, y0 + vy * t + a * t * t, false, t1];
  const x1 = x0 + vx * t1;
  const up = -(vy + g * t1) * 0.32;
  const side = vx * 0.5;
  const t2 = (-2 * up) / g;
  const u = t - t1;
  if (u <= t2) return [x1 + side * u, floor + up * u + a * u * u, false, t1];
  const v = Math.min(u - t2, 0.25);
  return [x1 + side * t2 + side * (v - v * v * 2), floor, v >= 0.25, t1];
}
// The flash where a blow lands: a jagged star, white at its heart, there for a few frames and gone.
function impactStar(ctx, x, y, u, size, seed) {
  if (u < 0 || u > 0.12) return;
  const k = u < 0.04 ? 1 : 1 - (u - 0.04) / 0.08;
  const turn = hash(seed) * 0.8;
  for (const [col, sc] of [['#fff1c2', 1], ['#ffffff', 0.5]]) {
    ctx.fillStyle = col;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = turn + (i * Math.PI) / 8;
      const r = (i % 2 ? 0.36 : 0.75 + 0.45 * hash(seed + i)) * size * sc * (0.55 + 0.45 * k);
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.globalAlpha = Math.min(1, k * 1.5);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
// A cloud of soft puffs - dust, snow, flour - `[x, y, r]` each: every puff's shaded round first,
// then every lit top over them, so they billow into one solid shape (as pixel art's clouds are,
// never see-through rounds showing through each other); each thins away by shrinking.
function cloud(ctx, puffs, col, lit) {
  ctx.fillStyle = col;
  for (const [x, y, r] of puffs) {
    if (r <= 0.3) continue;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = lit;
  for (const [x, y, r] of puffs) {
    if (r <= 0.6) continue;
    ctx.beginPath();
    ctx.arc(x - r * 0.15, y - r * 0.22, r * 0.74, 0, TAU);
    ctx.fill();
  }
}
// How big a puff is `q` seconds into its `life`: swelling quickly to `r`, holding, then shrinking
// away to nothing over the second half.
const puffR = (q, life, r) => (q < 0 || q > life ? 0 : r * Math.min(1, q / (life * 0.2)) ** 0.5 * (q < life / 2 ? 1 : 1 - ((q - life / 2) / (life / 2)) ** 1.5));
// A four-pointed twinkle, `r` to its points.
function twinkle(ctx, x, y, r) {
  if (r < 0.4) return;
  ctx.fillStyle = '#fff3a0';
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.28, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.28, y);
  ctx.closePath();
  ctx.moveTo(x - r, y);
  ctx.lineTo(x, y - r * 0.28);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
}
function drawBoulders(ctx, map, race, course, cam) {
  const leg = course.legs.find((l) => l.kind === 'smash');
  if (!leg) return;
  const at = course.legs.indexOf(leg);
  const C = race.clock;
  for (const r of [...race.racers].sort((a, b) => b.lane - a.lane)) {
    const wx = boulderX(leg, r);
    const x = wx - cam.x;
    if (x < -120 || x > VW + 120) continue;
    const gy = groundAt(map, wx) - cam.y;
    const rock = r.rock;
    // (A friend's ghost or a racer seen from afar has no boulder of its own here: past it, it's broken.)
    const broke = rock?.broke != null ? C - rock.broke : r.leg > at && !rock ? 9 : null;
    const hx = x + HIT_DX;
    const hy = gy + HIT_DY;
    const fx = (r.fx ??= { crack: 0, crackAt: -9 });
    const force = FORCE[rock?.tier ?? 3];
    if (broke == null || broke < BURST_AT) {
      const k = rock ? 1 - rock.hp / rock.max : 0;
      const crack = broke != null ? 4 : k <= 0 ? 0 : k < 0.34 ? 1 : k < 0.67 ? 2 : 3;
      if (crack < 4 && crack > fx.crack) Object.assign(fx, { crack, crackAt: C });
      const since = rock?.hits.length ? C - rock.hits[rock.hits.length - 1] : 9;
      // Each blow jolts it back on its heel, and it rocks there a moment, settling; the last one
      // sets it shuddering.
      const tipBack = since < 0.5 ? 0.045 * force ** 1.6 * Math.exp(-since * 8) * Math.sin(since * 28 + 1.3) : 0;
      const push = since < 0.3 ? 1.6 * force * Math.exp(-since * 14) : 0;
      const quake = broke != null ? (Math.floor(broke * 60) % 2 ? 1.5 : -1.5) : 0;
      pivoted(ctx, x + 22, gy + 2, tipBack, () => place(ctx, boulderArt(crack, r.lane), snap(x + push + quake), gy + 3, { flip: r.lane % 2 === 1 }));
      // (Grit and dust dropping out of the cracks as they spread.)
      const cu = C - fx.crackAt;
      if (cu < 0.8) {
        cloud(ctx, [0, 1, 2].map((i) => [x - 6 + i * 6, gy - 30 + i * 5 + 10 * cu, puffR(cu - i * 0.05, 0.75, 3.4)]), '#bfc6d2', '#dde2ea');
        ctx.fillStyle = '#767f92';
        for (let i = 0; i < 4; i++) {
          const py = gy - 28 + i * 4 + 140 * cu * cu;
          if (py < gy) ctx.fillRect(x - 5 + i * 4, py, 1.4, 1.4);
        }
      }
    } else {
      const b = broke - BURST_AT;
      const seed = r.seed * 7 + 3;
      // Rubble settling in where it stood, as the dust clears.
      place(ctx, rubbleArt(), snap(x), gy + 3, { alpha: Math.min(1, b / 0.35) });
      if (b < 1.6) {
        // Dust rolling out along the snow either side...
        if (b < 0.9) {
          for (const side of [-1, 1]) {
            const e = 1 - (1 - b / 0.9) ** 3;
            ctx.globalAlpha = 0.65 * (1 - b / 0.9);
            ctx.fillStyle = '#e6ebf3';
            ctx.beginPath();
            ctx.ellipse(x + side * (14 + 46 * e), gy - 2, 10 + 16 * e, 3.5 + 2 * e, 0, 0, TAU);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
        // ...a cloud of dust and snow boiling up and out where it stood, rising, spreading and
        // breaking up as it thins away...
        // (Rock dust, grey: big rounds low in its heart, smaller ones thrown out round its edge.)
        const puffs = [];
        for (let i = 0; i < 16; i++) {
          const edge = i >= 7;
          const q = b - (i % 4) * 0.025;
          const e = 1 - (1 - Math.min(1, Math.max(0, q) / 1.0)) ** 2;
          const a = Math.PI + ((i % 7) / 6) * Math.PI + (hash(seed + 60 + i) - 0.5) * 0.4;
          const d0 = (edge ? 12 : 4) + 6 * hash(seed + 70 + i);
          const reach = 1 + (edge ? 2.4 : 1.4) * e;
          puffs.push([x + Math.cos(a) * d0 * reach * 1.4, gy - 14 + Math.sin(a) * d0 * reach * 0.7 - 8 * e, puffR(q, edge ? 0.8 : 1.0, edge ? 3 + 2.5 * hash(seed + 80 + i) : 7 + 3 * hash(seed + 80 + i))]);
        }
        cloud(ctx, puffs, '#aeb6c4', '#d6dce6');
        // ...and the boulder thrown apart: chunks from all over it flung out from its heart and up,
        // tumbling, bouncing and lying there before they fade into the heap...
        const alpha = Math.min(1, (1.6 - b) / 0.4);
        for (let i = 0; i < 14; i++) {
          const a = Math.PI + ((i + 0.5) / 14) * Math.PI + (hash(seed + i) - 0.5) * 0.35;
          const d0 = 0.35 + 0.6 * hash(seed + 20 + i);
          const ox = Math.cos(a) * 20 * d0;
          const oy = Math.sin(a) * 16 * d0;
          const v = 60 + hash(seed * 3 + i) * 60;
          const [px, py, , t1] = thrown(b, x + ox, gy - 20 + oy, Math.cos(a) * v * 0.9, Math.sin(a) * v * 0.7 - 55, 340, gy + 1);
          if (i % 3 !== 2) {
            const turn = (Math.cos(a) > 0 ? 9 : -9) * (0.7 + hash(seed + 30 + i) * 0.6) * Math.min(b, t1 + 0.15);
            pivoted(ctx, px, py - 6, turn, () => place(ctx, chunkArt(i), snap(px), py, { alpha }));
          } else {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = i % 2 ? '#9aa3b6' : '#767f92';
            ctx.fillRect(px - 1.5, py - 3, 3, 3);
            ctx.globalAlpha = 1;
          }
        }
        // ...and its snow cap flung up in flakes, drifting down.
        for (let i = 0; i < 12; i++) {
          const a = -Math.PI / 2 + (i - 5.5) * 0.24;
          const v = 60 + hash(seed + 90 + i) * 50;
          const drag = (1 - Math.exp(-3 * b)) / 3;
          const py = gy - 40 + Math.sin(a) * v * drag + 22 * b * b;
          if (py > gy) continue;
          ctx.globalAlpha = Math.min(1, (1.6 - b) / 0.5);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + Math.cos(a) * v * drag + Math.sin(b * 4 + i) * 3, py, i % 2 ? 1.6 : 1.2, i % 2 ? 1.6 : 1.2);
        }
        ctx.globalAlpha = 1;
      }
    }
    // Every blow: the flash, stone dust off its face, chips flung back and snow shaken off its cap.
    for (const h of rock?.hits ?? []) {
      const u = C - h;
      if (u < 0 || u > 1.1) continue;
      const seed = r.seed * 13 + Math.round(h * 30);
      impactStar(ctx, hx, hy, u, 9 * force, seed);
      cloud(ctx, [0, 1, 2].map((i) => {
        const q = u - i * 0.03;
        return [hx - 3 - q * (14 + i * 6) * force, hy - 2 - q * (10 + i * 5) * force + i * 3, puffR(q, 0.55, (3.2 + i * 0.8) * force)];
      }), '#c3cad6', '#e3e7ef');
      ctx.globalAlpha = Math.min(1, (1.1 - u) / 0.3);
      for (let i = 0; i < Math.round(7 * force ** 1.4); i++) {
        const a = -Math.PI * (0.55 + 0.4 * hash(seed + i));
        const v = (45 + hash(seed * 3 + i) * 55) * (0.6 + 0.4 * force);
        const [px, py, lying] = thrown(u, hx, hy, Math.cos(a) * v, Math.sin(a) * v, 330, gy);
        const sz = i % 2 ? 2 : 1.4;
        ctx.fillStyle = i % 3 === 0 ? '#f4f8ff' : i % 3 === 1 ? '#9aa3b6' : '#767f92';
        ctx.fillRect(px - sz / 2, py - sz, sz, lying ? sz * 0.7 : sz);
      }
      ctx.globalAlpha = 1;
      for (let i = 0; i < Math.round(6 * force ** 1.4); i++) {
        const q = u - 0.03 - hash(seed + 40 + i) * 0.12;
        if (q < 0 || q > 0.9) continue;
        const sx = x - 15 + i * 6 + hash(seed + 50 + i) * 3;
        const py = gy - 44 + Math.abs(sx - x) * 0.35 + 18 * q + 50 * q * q;
        ctx.globalAlpha = Math.min(1, (0.9 - q) / 0.3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx + Math.sin(q * 9 + i) * 2, py, i % 2 ? 1.6 : 1.2, i % 2 ? 1.6 : 1.2);
      }
      ctx.globalAlpha = 1;
    }
  }
}

// The Power course's mortars (world/mochi-race.js, a 'pound' leg): a wooden usu in each lane with a
// lump of mochi in it, and the mallet leant against it, waiting. Polished 2026-11-15: each pound
// lands with a thump, jolts the mortar down into the snow and splats the mochi flat and wide, with
// rice flour puffing out either side and flecks of it flung up; as the mallet's tugged free the
// sticky mochi stretches up after it, lets go and wobbles back. It grows smoother and rounder as
// it's pounded - lumpy at first, a smooth shining dome when it's done, a glint sweeping across it
// and twinkles popping up as the mallet's put back.
// (Sized for a Mochi: about knee to waist on one, as a real mortar is on a person.)
const mortarArt = () => art('mr-usu', 26, 14, () => [
  T([[2, 3], [24, 3], [21, 13], [5, 13]], '#b07848'), F(T([[2, 3], [24, 3], [23.4, 4.6], [2.6, 4.6]], '#c8915a')),
  E(13, 3, 11, 2.4, '#c8915a'), F(E(13, 3, 9, 1.8, '#6a4428')),
  F(R(4, 7, 18, 1.4, '#8a5a34')), F(R(5, 10, 16, 1.4, '#8a5a34')), F(E(13, 13.6, 12, 1, '#c8d4e8')),
]);
// (Where the mallet's head comes down on the mochi, from the mortar's middle.)
const POUND_DX = 3;
// The mochi stretched up after the mallet, `h` tall: wide at its foot, pinched in the middle.
function strand(ctx, x, y, h, w, col) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x - 3.5 - w, y + 1);
  ctx.quadraticCurveTo(x - 0.8 - w, y - h * 0.5, x - 2.2 - w, y - h - w);
  ctx.lineTo(x + 2.2 + w, y - h - w);
  ctx.quadraticCurveTo(x + 0.8 + w, y - h * 0.5, x + 3.5 + w, y + 1);
  ctx.closePath();
  ctx.fill();
}
// Mochitsuki Mountain's snowballs (world/mochi-race.js 'roll', 2026-11-16), one in each lane: small at
// the foot of the slope, waiting; pushed up it, growing, turning as it goes - the pebbles, twigs and
// grass it has picked up going round with it - a packed track behind it, crumbs falling off its back;
// at the top, shoved into the drift with a puff of snow, and there it stays.
const snowballArt = (r) => art(`mr-snowball|${r}`, 2 * r + 4, 2 * r + 4, () => {
  const c = r + 2;
  return [
    E(c, c, r, r, '#f4f8ff'),
    F(E(c + r * 0.22, c + r * 0.26, r * 0.8, r * 0.74, '#d9e4f4')),
    F(E(c - r * 0.1, c - r * 0.12, r * 0.8, r * 0.8, '#f4f8ff')),
    F(E(c - r * 0.36, c - r * 0.4, r * 0.32, r * 0.22, '#ffffff')),
    // (Lumps of snow it has gathered.)
    ...[[0.55, -0.62, 0.2], [-0.62, 0.3, 0.18], [0.2, 0.7, 0.16], [0.75, 0.15, 0.15]].map(([dx, dy, k]) => F(E(c + dx * r, c + dy * r, r * k, r * k * 0.8, dy > 0.2 ? '#e2eaf6' : '#ffffff'))),
  ];
});
const SPECKS = [[0.62, 0.0, '#8a7a6a', 1.1], [0.42, 1.3, '#6a5040', 0.8], [0.72, 2.4, '#7aa86a', 0.9], [0.5, 3.6, '#8a7a6a', 0.9], [0.66, 4.8, '#6a5040', 0.7], [0.32, 5.6, '#7aa86a', 0.8]];
function drawSnowballs(ctx, map, race, course, cam, time) {
  const leg = course.legs.find((l) => l.kind === 'roll');
  if (!leg) return;
  const at = course.legs.indexOf(leg);
  const C = race.clock;
  for (const r of [...race.racers].sort((a, b) => b.lane - a.lane)) {
    const b = r.ball;
    // (A friend's ghost or a racer seen from afar has no snowball of its own here: past it, it's up top.)
    const bx = b ? b.x : r.leg > at ? ballEnd(leg, r) : ballStart(leg, r);
    const rad = b ? ballRadius(leg, r, b.x) : r.leg > at ? ROLL_R[1] : ROLL_R[0];
    const x = bx - cam.x;
    if (x < -60 || x > VW + 60) continue;
    const gy = groundAt(map, bx) - cam.y;
    // Its track behind it, where the snow it picked up was.
    if (b && b.x > ballStart(leg, r) + 2) {
      ctx.save();
      ctx.strokeStyle = 'rgba(150,172,206,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let tx = ballStart(leg, r); tx <= b.x; tx += 6) {
        const ty = groundAt(map, tx) - cam.y - 0.8;
        if (tx === ballStart(leg, r)) ctx.moveTo(tx - cam.x, ty);
        else ctx.lineTo(tx - cam.x, ty);
      }
      ctx.stroke();
      ctx.restore();
    }
    // Its shadow.
    ctx.fillStyle = 'rgba(110,130,175,0.22)';
    ctx.beginPath();
    ctx.ellipse(x, gy + 1, rad * 0.85, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // (A little nudge as each shove lands: the bigger the push, the more it rocks forward.)
    const R0 = Math.round(rad);
    const cy = gy - R0 + 1;
    place(ctx, snowballArt(R0), snap(x), cy + R0 + 2);
    // What it has picked up, going round as it turns.
    const spin = b?.spin ?? 0;
    for (const [k, a0, col, s] of SPECKS) {
      const a = a0 + spin;
      const sx = x + Math.cos(a) * rad * k;
      const sy = cy + Math.sin(a) * rad * k;
      ctx.fillStyle = col;
      ctx.fillRect(sx - s / 2, sy - s / 2, s, s * 0.8);
    }
    // Crumbs of snow falling off its back as it rolls.
    if (b && b.parked == null && b.slip == null && (b.v ?? 0) > 1) {
      ctx.fillStyle = '#ffffff';
      for (let k = 0; k < 3; k++) {
        const u = (spin * 0.35 + k / 3) % 1;
        ctx.globalAlpha = 1 - u;
        ctx.fillRect(x - rad * 0.75 - u * 5, cy + rad * 0.35 + u * u * rad * 0.6, 1.4, 1.4);
      }
      ctx.globalAlpha = 1;
    }
    // Shoved into the drift at the top: a puff of snow.
    const pu = b?.parked != null ? (C - b.parked) / 0.6 : 9;
    if (pu < 1) {
      ctx.save();
      ctx.globalAlpha = (1 - pu) * 0.9;
      ctx.fillStyle = '#ffffff';
      for (let k = 0; k < 6; k++) {
        const a = Math.PI * (1.05 + (k / 5) * 0.9);
        const d = rad * (0.9 + pu * 0.9);
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * d * 1.2, gy - 2 + Math.sin(a) * d * 0.5, 2.2 + pu * 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
// Mochitsuki Mountain's kagami-mochi (world/mochi-race.js 'stack', 2026-11-16), one in each lane: a
// little wooden offering stand - the same pale wood as the giant one at the summit - with its folded
// paper, a fern frond each side, and the pieces as they go on: each one flying from the racer's paws
// (gently for the weak, tossed in an arc by the strong, turning over for the show-off), landing with
// a little bounce and a puff of flour; the stack swaying when a weak one's wobbles, until it's held
// still; crowned with the orange, a glint and sparkles. (Its tub is drawn in front of the racer.)
const sanboArt = () => art('mr-sanbo', 14, 6, () => [
  R(3.2, 2.2, 7.6, 3.8, '#e8b070'), F(R(3.2, 2.2, 7.6, 0.6, '#f8d4a0')),
  F(R(5.8, 3.4, 2.4, 2.6, '#c88048')), F(E(7, 3.4, 1.2, 0.8, '#c88048')),
  R(1, 0.6, 12, 1.8, '#d89a5a'), F(R(1, 0.6, 12, 0.6, '#f0c080')),
  R(0.5, 0, 0.9, 2.2, '#c88048'), R(12.6, 0, 0.9, 2.2, '#c88048'),
]);
// (Where each piece sits on its stand: its bottom, up from the stand's top; the stand's top over the
// ground. Each sits a little down into the one under it.)
const SANBO_TOP = 5;
const SITS = [0, KAGAMI[0].h - 0.8, KAGAMI[0].h - 0.8 + KAGAMI[1].h - 0.6];
function drawStacks(ctx, map, race, course, cam, time) {
  const leg = course.legs.find((l) => l.kind === 'stack');
  if (!leg) return;
  const at = course.legs.indexOf(leg);
  const C = race.clock;
  for (const r of [...race.racers].sort((a, b) => b.lane - a.lane)) {
    const sx = standX(leg, r);
    const x = sx - cam.x;
    if (x < -30 || x > VW + 30) continue;
    const gy = groundAt(map, sx) - cam.y;
    const st = r.stack;
    // (A friend's ghost or a racer seen from afar has none of its own here: past it, it's built.)
    const landed = st ? st.landed : r.leg > at ? [-9, -9, -9] : [];
    // Its shadow, the stand, its paper hanging down the front, and a fern frond each side.
    ctx.fillStyle = 'rgba(110,130,175,0.22)';
    ctx.beginPath();
    ctx.ellipse(x, gy + 0.6, 7.5, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    const top = gy - SANBO_TOP;
    ctx.fillStyle = '#4f9a50';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(x + s * 5.4, top - 0.3, 2.6, 0.8, s * -0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    place(ctx, sanboArt(), snap(x), gy + 0.6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 5, top - 0.2, 10, 0.6);
    ctx.beginPath();
    ctx.moveTo(x - 1.6, top + 0.2);
    ctx.lineTo(x + 1.6, top + 0.2);
    ctx.lineTo(x, top + 2.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e04848';
    ctx.fillRect(x - 5.4, top - 0.2, 0.6, 0.6);
    ctx.fillRect(x + 4.8, top - 0.2, 0.6, 0.6);
    // (Swaying, a weak one's, from the moment the small one lands until it's held still.)
    const w = st?.steadyAt != null ? C - st.steadyAt : null;
    const env = w == null ? 0 : w < 0.12 ? w / 0.12 : w < 0.3 ? 1 : Math.max(0, 1 - (w - 0.3) / 0.5);
    const sway = env * 0.22 * Math.sin(2 * Math.PI * 2.4 * (w ?? 0));
    for (let i = 0; i < 3; i++) {
      if (landed[i] == null) {
        // On its way from its paws: the last place they held it, to its spot on the stack.
        const rel = st?.released[i];
        if (rel == null) continue;
        const u = Math.min(1, (C - rel) / STACK_FLY[st.tier]);
        const from = r.stackPaw ?? [sx - STACK_REACH + 5, groundAt(map, sx) - 9];
        r.stackFrom ??= [];
        r.stackFrom[i] ??= [from[0], from[1] + KAGAMI[i].h / 2];
        const [fx, fy] = r.stackFrom[i];
        const e = u * u * (3 - 2 * u);
        const ty = groundAt(map, sx) - SANBO_TOP - SITS[i];
        const arc = st.tier >= 4 ? 9 : st.tier === 3 ? 5 : 3;
        const px = fx + (sx - fx) * e - cam.x;
        const py = fy + (ty - fy) * u - arc * 4 * u * (1 - u) - cam.y;
        const turn = st.tier === 5 ? Math.PI * 2 * e : st.tier === 4 ? 0.35 * Math.sin(Math.PI * u) : 0;
        drawKagamiPiece(ctx, i, px, py, 1, 1, turn);
        continue;
      }
      // On the stack: a little bounce as it lands, and the sway.
      const v = (C - landed[i]) / 0.3;
      const hop = v >= 0 && v < 1 ? 1.1 * Math.sin(Math.PI * v) * (1 - v) : 0;
      const by = top - SITS[i] - hop;
      ctx.save();
      ctx.translate(x, top);
      ctx.rotate(sway * (i === 0 ? 0.45 : 1));
      ctx.translate(-x, -top);
      drawKagamiPiece(ctx, i, x + sway * (i === 2 ? 2 : 0), by, 1, 1, sway * (i === 1 ? 0.6 : 0));
      ctx.restore();
      // A puff of flour where it lands.
      const pu = (C - landed[i]) / 0.4;
      if (pu >= 0 && pu < 1) {
        ctx.save();
        ctx.globalAlpha = (1 - pu) * 0.85;
        ctx.fillStyle = '#ffffff';
        for (let k = 0; k < 4; k++) {
          const s = k < 2 ? -1 : 1;
          const d = KAGAMI[i].w / 2 + 0.6 + pu * 3 * (1 + (k % 2) * 0.6);
          ctx.beginPath();
          ctx.arc(x + s * d, top - SITS[i] - 0.6 - pu * 2 * (k % 2 ? 1.5 : 1), 0.7 + pu * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
    // Crowned: sparkles round the orange.
    const cu = st?.done != null ? (C - st.done) / 1.2 : 9;
    if (cu < 1) {
      const oy = top - SITS[2] - KAGAMI[2].h / 2;
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + cu * 2;
        const d = 4.5 + cu * 6;
        twinkle(ctx, x + Math.cos(a) * d, oy + Math.sin(a) * d * 0.7, 1.8 * (1 - cu) * (k % 2 ? 0.7 : 1));
      }
    }
  }
}
// A racer's tub (`world/mochi-race.js` STACK_TUB in front of its feet): a low wooden tub, two copper
// bands round it, with whichever pieces it hasn't lifted out yet nestled inside.
const tubArt = () => art('mr-oke', 12, 3, () => [E(6, 1.5, 5, 1.1, '#8a5a30')]);
const tubFrontArt = () => art('mr-oke-f', 12, 5, () => [
  T([[1, 0.5], [11, 0.5], [10.3, 4], [1.7, 4]], '#d8a868'),
  ...[3.6, 6, 8.4].map((sx) => F(R(sx, 1, 0.4, 2.8, '#c69252'))),
  F(R(1.2, 1.3, 9.6, 0.5, '#a87038')), F(R(1.6, 2.9, 8.8, 0.5, '#a87038')),
  F(R(1, 0.3, 10, 0.6, '#ecc490')),
]);
function drawStackTub(ctx, map, race, course, cam, r) {
  const leg = course.legs.find((l) => l.kind === 'stack');
  if (!leg) return;
  const at = course.legs.indexOf(leg);
  const sx = standX(leg, r) - STACK_REACH + STACK_TUB;
  const x = sx - cam.x;
  if (x < -20 || x > VW + 20) return;
  const gy = groundAt(map, sx) - cam.y;
  const st = r.stack;
  // (What's out of it: none before the stack, all three past it.)
  const out = st ? st.released.length + (r.m.stackHeld != null ? 1 : 0) : r.leg > at ? 3 : 0;
  ctx.fillStyle = 'rgba(110,130,175,0.22)';
  ctx.beginPath();
  ctx.ellipse(x, gy + 0.6, 6, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();
  const rim = gy - 3.2;
  place(ctx, tubArt(), snap(x), rim + 1.5);
  const SPOT = [[-0.8, rim + 2.2], [2.2, rim + 1.8], [-2.6, rim + 0.5]];
  for (let i = 0; i < 3; i++) if (i >= out) drawKagamiPiece(ctx, i, x + SPOT[i][0], SPOT[i][1]);
  place(ctx, tubFrontArt(), snap(x), gy + 1.2);
}
function drawMortars(ctx, map, race, course, cam) {
  const leg = course.legs.find((l) => l.kind === 'pound');
  if (!leg) return;
  const at = course.legs.indexOf(leg);
  const C = race.clock;
  for (const r of [...race.racers].sort((a, b) => b.lane - a.lane)) {
    const wx = boulderX(leg, r);
    const x = wx - cam.x;
    if (x < -60 || x > VW + 60) continue;
    const gy = groundAt(map, wx) - cam.y;
    const p = r.pound;
    const force = FORCE[p?.tier ?? 3];
    const k = p ? p.got / p.need : r.leg > at ? 1 : 0;
    const since = p?.hits.length ? C - p.hits[p.hits.length - 1] : 9;
    const jolt = since < 0.07 && force >= 0.7 ? 1 : 0;
    place(ctx, mortarArt(), snap(x), gy + 2 + jolt);
    // The mochi: splatted flat and wide by each pound, springing back up, and wobbling after the tug.
    const squash = since < 0.3 ? 1 - 0.4 * Math.min(1.2, force) * Math.sin((since / 0.3) * Math.PI) * (1 - since / 0.3) : 1;
    const wob = since > 0.3 && since < 0.6 ? 0.12 * Math.sin((since - 0.3) * 40) * (1 - (since - 0.3) / 0.3) : 0;
    const cy = gy - 9 + jolt;
    const ry = (2.4 + 2.2 * k) * squash * (1 + wob);
    const rx0 = 7 + 1 * k;
    const rx = rx0 * (2 - squash) ** 0.5 * (1 + (0.25 * (1 - squash)) / 0.4);
    // (Stuck to the mallet as it's tugged free, then letting go.)
    const pull = p && since >= 0.16 && since < 0.36 ? (since < 0.3 ? smooth01((since - 0.16) / 0.14) : 1 - (since - 0.3) / 0.06) : 0;
    const sx = x + POUND_DX;
    ctx.fillStyle = '#3a2d4f';
    ctx.beginPath();
    ctx.ellipse(x, cy, rx + 1, ry + 1, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    if (pull > 0) strand(ctx, sx, cy - ry, 6 * pull, 1, '#3a2d4f');
    ctx.fillStyle = '#fbf7f0';
    ctx.beginPath();
    ctx.ellipse(x, cy, rx, ry, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    if (pull > 0) strand(ctx, sx, cy - ry, 6 * pull, 0, '#fbf7f0');
    // (Lumpy until it's well pounded: a couple of knobs that smooth away.)
    if (k < 0.8) {
      ctx.fillStyle = '#eee6da';
      for (const [dx, r0] of [[-3.6, 2.2], [3, 1.9]]) {
        ctx.beginPath();
        ctx.arc(x + dx, cy - ry * 0.6, r0 * (1 - k), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(x - rx * 0.45), Math.round(cy - ry * 0.75), Math.max(1, Math.round(rx * 0.35)), 1);
    // Every pound: a thump, rice flour puffing out either side, flecks of it flung up.
    for (const h of p?.hits ?? []) {
      const u = C - h;
      if (u < 0 || u > 0.7) continue;
      const seed = r.seed * 11 + Math.round(h * 30);
      impactStar(ctx, sx, cy - ry - 1, u, 5 * force, seed);
      cloud(ctx, [0, 1, 2, 3].map((i) => {
        const q = u - (i >> 1) * 0.04;
        const e = 1 - (1 - Math.min(1, Math.max(0, q) / 0.6)) ** 2;
        return [sx + (i % 2 ? 1 : -1) * (rx0 + 1 + 9 * e * force + (i >> 1) * 3), cy - 3 - 8 * e * force - (i >> 1) * 3, puffR(q, 0.55, (2.6 + (i >> 1) * 0.6) * force)];
      }), '#ebe4d8', '#ffffff');
      ctx.globalAlpha = Math.min(1, (0.7 - u) / 0.25);
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < Math.round(6 * force ** 1.4); i++) {
        const a = -Math.PI * (0.15 + 0.7 * hash(seed + i));
        const v = (35 + hash(seed * 5 + i) * 35) * (0.6 + 0.4 * force);
        const fy = cy - 3 + Math.sin(a) * v * u + 160 * u * u;
        if (fy < gy) ctx.fillRect(sx + Math.cos(a) * v * u, fy, 1.2, 1.2);
      }
      ctx.globalAlpha = 1;
    }
    // Done: a glint sweeping across the smooth mochi, and twinkles popping up over it.
    const doneFor = p?.finished != null ? C - p.finished : null;
    if (doneFor != null && doneFor < 1) {
      if (doneFor < 0.4) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(x, cy, rx, ry, 0, Math.PI, Math.PI * 2);
        ctx.clip();
        const gx = x - rx - 3 + (2 * rx + 6) * (doneFor / 0.4);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(gx, cy - ry - 1);
        ctx.lineTo(gx + 2.5, cy - ry - 1);
        ctx.lineTo(gx + 0.5, cy + 1);
        ctx.lineTo(gx - 2, cy + 1);
        ctx.fill();
        ctx.restore();
      }
      for (let i = 0; i < 5; i++) {
        const q = doneFor - i * 0.08;
        if (q >= 0 && q < 0.6) twinkle(ctx, x - 9 + i * 4.5, cy - ry - 3 - (i % 3) * 3 - q * 8, Math.sin((q / 0.6) * Math.PI) * 3.2);
      }
    }
    // The mallet, leant against the mortar: waiting for its racer, and put back when it's done.
    // (Its head down in the snow by the mortar's foot, its handle up against the rim.)
    if (!p || p.finished != null) drawMallet(ctx, x - 13 + 21 * Math.sin(0.35), gy - 5.5 - 21 * Math.cos(0.35), 0.6, false, Math.PI + 0.35);
  }
}

// ---------- Tanabata Hurdles' hurdles (world/mochi-race.js, a 'hurdle' leg) ----------
// A bamboo hurdle across the track: two green posts on stone feet, lashed to a bamboo bar at its
// height, two wishes on paper strips hanging from the bar. A toe catching it shakes it; a racer going
// over it in a heap rocks it hard on its feet, and it settles. Around the racers: a puff of dust
// where each lands (more the higher it came from), a splat where one goes down, and little stars
// lifting off with one that was cheered into its jump.
const hurdleArt = (h) => art(`mr-hurdle|${h}`, 24, h + 8, () => {
  const foot = h + 8;
  const out = [];
  for (const px of [2.6, 18.8]) {
    out.push(R(px, 6, 2.6, foot - 7, '#5aa06a'), F(R(px + 0.4, 6, 0.9, foot - 7, '#7cc488')));
    for (let y = foot - 6; y > 9; y -= 6) out.push(F(R(px - 0.3, y, 3.2, 0.9, '#3f7a4c')));
  }
  out.push(R(0.5, 8, 23, 2.6, '#6ab078'), F(R(0.5, 8, 23, 0.9, '#8ed49a')), F(R(8, 8, 0.9, 2.6, '#3f7a4c')), F(R(15, 8, 0.9, 2.6, '#3f7a4c')));
  out.push(F(R(2.4, 7.6, 3, 3.4, '#d8c49a')), F(R(18.6, 7.6, 3, 3.4, '#d8c49a')));
  out.push(E(3.9, foot - 0.8, 3.4, 1.6, '#8a8ea8'), E(20.1, foot - 0.8, 3.4, 1.6, '#8a8ea8'));
  return out;
});
function drawHurdles(ctx, map, race, course, cam, time) {
  const C = race.clock;
  course.legs.forEach((leg, idx) => {
    if (leg.kind !== 'hurdle') return;
    const x = leg.x - cam.x;
    if (x < -40 || x > VW + 40) return;
    const gy = groundAt(map, leg.x) - cam.y;
    let rock = 0;
    for (const b of race.bars?.[idx] ?? []) {
      const u = C - b.at;
      if (u >= 0 && u < 1.6) rock += b.k * 0.09 * Math.exp(-u * 4) * Math.sin(u * 22);
    }
    pivoted(ctx, x, gy + 1, rock, () => {
      place(ctx, hurdleArt(leg.h), snap(x), gy + 1);
      for (const [dx, k] of [[-5, 0], [5, 1]]) {
        const px = x + dx;
        const py = gy - leg.h + 2.6;
        pivoted(ctx, px, py, swing(time, leg.x + k * 9, 1.4, k) - rock * 4, () => {
          ctx.fillStyle = TANZAKU_RACE[(idx + k) % TANZAKU_RACE.length];
          ctx.fillRect(px - 1.4, py + 1, 2.8, 6.5);
          ctx.fillStyle = 'rgba(80,60,90,0.35)';
          ctx.fillRect(px - 0.4, py + 2.2, 0.8, 4);
        });
      }
    });
  });
  for (const r of race.racers) {
    const x = r.x - cam.x;
    if (x < -40 || x > VW + 40) continue;
    const gy = groundAt(map, r.x) - cam.y;
    const land = r.landed;
    if (land && C - land.at < 0.45) {
      const u = C - land.at;
      const lx = land.x - cam.x;
      const size = 0.7 + land.k * 0.12;
      cloud(ctx, [[-1, -4], [1, 4]].map(([s, dx]) => [lx + dx + s * u * 14, gy - 2 - u * 4, puffR(u, 0.42, 2.4 * size)]), '#c8bcd0', '#ece4f0');
    }
    const j = r.jump;
    if (!j) continue;
    const e = C - j.from + (j.gain ?? 0);
    if (j.outcome === 'fall' && e > 0.52 && e < 1.1) {
      const u = e - 0.52;
      cloud(ctx, [-8, -2, 4, 10].map((dx, i) => [x + dx + (i % 2 ? 1 : -1) * u * 10, gy - 3 - u * 6 - (i % 2) * 2, puffR(u, 0.5, 3.4)]), '#c8bcd0', '#ece4f0');
    }
    // (Each range's own touch in the air: the scrambler's sweat flying off, the star jump's stars.)
    const air = (e - JUMP_PHASE.pre) / j.T;
    const h = air > 0 && air < 1 ? JUMP_H[j.tier] * 4 * air * (1 - air) : 0;
    if (j.outcome !== 'fall' && j.tier === 0 && air > 0.3 && air < 1) {
      const u = (air - 0.3) * j.T;
      ctx.fillStyle = '#8fd3ff';
      for (const [sx, sy] of [[-1, -1], [1, -0.6], [0.4, -1.3]]) ctx.fillRect(x + sx * (5 + u * 40), gy - h - 24 + sy * u * 30 + u * u * 160, 1.4, 1.8);
    }
    if (j.outcome !== 'fall' && j.tier === 3 && air > 0.4 && air < 0.95) {
      const u = (air - 0.4) / 0.55;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + 0.4;
        twinkle(ctx, x + Math.cos(a) * (8 + u * 14), gy - h - 14 + Math.sin(a) * (8 + u * 12), Math.sin(u * Math.PI) * 2.4);
      }
    }
    if (j.cheered && e < 0.4) {
      for (let i = 0; i < 4; i++) {
        const q = e - i * 0.05;
        if (q >= 0 && q < 0.3) twinkle(ctx, x - 6 + i * 4, gy - 2 - q * 30 - (i % 2) * 3, Math.sin((q / 0.3) * Math.PI) * 2.6);
      }
    }
  }
}
const TANZAKU_RACE = ['#ff8fb0', '#ffd75e', '#8fd3ff', '#9fe0a0', '#c8a8f0', '#ffffff'];

export function drawRace(ctx, world, cam, time) {
  const R = world.race;
  const map = world.map;
  const course = map.race;
  if (R.phase === 'ready') paintAhead(ctx, R, course, time);
  // (What the course's scenery reacts to: render/courseart.js.)
  noteRace(map, R, cam, time);
  drawRaceBehind(ctx, map, R, cam, time);
  // Behind everyone: the rush of speed when yours is flying along, and the podium.
  const you = R.racers[R.me];
  if (R.phase === 'run') onScreen(ctx, R, () => speedStreaks(ctx, you.m.speed ?? 0, time));
  if (R.phase === 'done') drawPodium(ctx, map, cam, R.t);
  const lead = R.phase === 'run' ? standings(R, course)[0] : null;
  noteEffects(R, course, time);
  // (The Power course: a boulder in each lane, behind everyone.)
  drawBoulders(ctx, map, R, course, cam);
  drawMortars(ctx, map, R, course, cam);
  drawSnowballs(ctx, map, R, course, cam, time);
  drawStacks(ctx, map, R, course, cam, time);
  drawHurdles(ctx, map, R, course, cam, time);
  for (const r of [...R.racers].sort((a, b) => b.lane - a.lane)) {
    // (On the line before Go, each lane a little apart: world/mochi-race.js lineupOffset.)
    const x = r.x + lineupOffset(R, r) - cam.x;
    // (Every lane on the ground, the water or the wall itself: the ground is an edge, not a field,
    // so a lane drawn higher would float. The back lanes are drawn first, behind.)
    // (GO!: each springs off the line, a little hop as it launches, staggered by lane.)
    const go = R.phase === 'run' ? (R.clock - (r.lane ?? 0) * 0.03) / 0.32 : -1;
    // (Over a wall's top: it pulls itself up and over with a little hop onto the ledge.)
    if (r.drawMode === 'climb' && r.m.mode !== 'climb') r.topAt = R.clock;
    r.drawMode = r.m.mode;
    const over = r.topAt != null ? (R.clock - r.topAt) / 0.36 : -1;
    const y = r.y - cam.y - (go > 0 && go < 1 ? Math.sin(go * Math.PI) * 7 : 0) - (over > 0 && over < 1 ? Math.sin(over * Math.PI) * 6 : 0);
    // (Yours, easy to find in the bunch: a soft pink ring at its feet. Up a wall or off in a glide
    // there's nothing under its feet for a ring to lie on, so it fades away and back.)
    const footed = (r.m.mode === 'run' || r.m.mode === 'swim') && !r.m.noShadow;
    // (The ground's slope under it: the ring at its feet lies along a hill, and running up one it
    // leans into the climb, sitting back a touch going down, eased in and out.)
    const sl = r.m.mode === 'run' && course.legs[r.leg ?? 0]?.y == null ? (groundAt(map, r.x + 6) - groundAt(map, r.x - 6)) / 12 : 0;
    const since = Math.min(0.1, Math.max(0, time - (r.ringAt ?? time)));
    r.ringAt = time;
    r.ringK = (r.ringK ?? 1) + ((footed ? 1 : 0) - (r.ringK ?? 1)) * (1 - Math.exp(-since * 9));
    if (r.you && R.phase !== 'done' && r.ringK > 0.02) {
      ctx.save();
      ctx.strokeStyle = '#ff6f9a';
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = (0.75 + 0.25 * Math.sin(time * 4)) * r.ringK;
      ctx.beginPath();
      ctx.ellipse(x, y + 1, 12, 3.4, Math.atan(sl), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // (A friend's ghost: see-through.)
    r.m.alpha = r.ghost ? 0.55 : null;
    r.m.floatUp = 5;
    r.m.glideLean = 0.4;
    const hill = R.phase === 'run' ? (sl < 0 ? Math.min(0.2, -sl * 0.5) : -Math.min(0.08, sl * 0.2)) : 0;
    r.hillLean = (r.hillLean ?? 0) + (hill - (r.hillLean ?? 0)) * (1 - Math.exp(-since * 5));
    r.m.hillLean = r.hillLean;
    r.m.groundTilt = Math.atan(sl);
    // (A smash, a pound and the "Yes!" after keep time with the race's own clock, so its blows land
    // just when the race counts them: started on its first drawing, one that came into view
    // mid-smash, or any stutter of the frames, would have swung out of step with its own hits.)
    const a = r.m.action;
    const beatFrom = !a ? null : a.name.startsWith('smash') ? r.rock?.from : a.name.startsWith('pound') ? r.pound?.from : a.name === 'roll_slip' ? r.ball?.slip : a.name.startsWith('roll') ? r.ball?.act : a.name === 'stack_steady' ? r.stack?.steadyAt : a.name.startsWith('stack') ? r.stack?.actFrom : a.name.startsWith('power_') ? r.pound?.finished ?? r.stack?.done ?? r.ball?.parked ?? r.rock?.broke : a.name === 'hurdle_stumble' ? r.jump?.landAt ?? null : a.name.startsWith('hurdle') && r.jump ? r.jump.from - (r.jump.gain ?? 0) : null;
    if (beatFrom != null) a.t0 = time - (R.clock - beatFrom);
    // (The two best jumpers leave a trail along their arc: where they were a moment ago.)
    const jj = r.jump;
    r.m.trail = null;
    if (jj && jj.outcome !== 'fall' && jj.tier >= 4) {
      const at = (dt) => {
        const u = (R.clock - jj.from - dt - JUMP_PHASE.pre) / jj.T;
        return u > 0 && u < 1 ? JUMP_H[jj.tier] * 4 * u * (1 - u) : 0;
      };
      const now = at(0);
      if (now > 2) r.m.trail = [[jj.v * 0.1, now - at(0.1), 0.14], [jj.v * 0.05, now - at(0.05), 0.28]];
    }
    // (Stacking: where the piece in its paws is drawn, so it can fly on from there.)
    const stacking = course.legs[r.leg ?? 0]?.kind === 'stack';
    if (stacking) r.m.anchors ??= {};
    drawMochiAnim(ctx, r.m, x, y, time);
    if (stacking) {
      const p = r.m.anchors.kagami;
      const t = ctx.getTransform?.();
      if (p && t) {
        const det = t.a * t.d - t.b * t.c;
        const px = p[0] - t.e;
        const py = p[1] - t.f;
        r.stackPaw = [(t.d * px - t.c * py) / det + cam.x, (t.a * py - t.b * px) / det + cam.y];
      }
      r.m.anchors.kagami = null;
    }
    // (Its tub in front of its feet, so it reaches down into it.)
    drawStackTub(ctx, map, R, course, cam, r);
    // (Swimming, it sits down in the water, so what floats over its head (its tag, heart, crown)
    // comes down with it, easing.)
    const sinkTo = r.m.mode === 'swim' ? 10 : 0;
    r.tagSink = (r.tagSink ?? sinkTo) + (sinkTo - (r.tagSink ?? sinkTo)) * (1 - Math.exp(-since * 8));
    const top = y - (r.m.size === 'baby' ? 36 : 44) + r.tagSink;
    // Up on the podium: its medal.
    if (R.phase === 'done' && r.place <= 3 && r.podCheer) podiumMedal(ctx, x, y - (r.m.size === 'baby' ? 4.5 : 6.5), r.place, time, r.m.size === 'baby' ? 0.6 : 0.72, r.m.size === 'baby' ? 2.5 : 3.5);
    // The leader's little crown (over yours, above its heart).
    if (r === lead && r.done == null) crown(ctx, x, top - (r.you ? 9 : 0) + Math.sin(time * 3) * 0.8);
    // Its card showing in the opening: a pink arrow bobbing over it.
    if (R.phase === 'ready' && R.t >= INTRO.sweep && R.t < introLen(R) && Math.floor((R.t - INTRO.sweep) / INTRO.card) === R.racers.indexOf(r)) {
      arrow(ctx, x, top - 10 + Math.abs(Math.sin(time * 6)) * -3);
    }
    // Cheered on: hearts fanning off it and fading. Yours three, five for a Perfect cheer, gold
    // among the pink; a rival's (its own trainer's cheer), two little pale ones.
    const left = R.phase === 'run' ? r.cheerUntil - R.clock : 0;
    if (left > 0) {
      const perfect = r.cheerKind === 'perfect';
      const k = Math.max(0, 1 - left / (perfect ? CHEER.perfect.secs : CHEER.secs));
      const n = r.you ? (perfect ? 5 : 3) : 2;
      const reach = r.you ? 8 + k * 16 : 6 + k * 10;
      ctx.globalAlpha = 1 - k;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i - (n - 1) / 2) * (n === 5 ? 0.5 : 0.7);
        const col = perfect ? (i % 2 ? '#ffd75e' : '#ff8fb0') : !r.you ? '#ffd9e4' : i === (n - 1) / 2 ? '#ff8fb0' : '#ffd0dc';
        heart(ctx, x + Math.cos(a) * reach, top + 6 + Math.sin(a) * reach, r.you ? (perfect ? 2.7 : 2.4) : 1.8, col);
      }
      ctx.globalAlpha = 1;
    }
    if (!r.you) continue;
    heart(ctx, x, top + Math.sin(time * 4) * 1.2, 3.2, '#ff6f9a');
    // ...and a little "You" tag over the heart while it runs.
    if (R.phase !== 'done') youTag(ctx, x, top - 9 - (r === lead && r.done == null ? 9 : 0) + Math.sin(time * 4) * 1.2);
  }
  drawRaceFront(ctx, map, R, cam, time);
  // The cloud fluff's low wisps, over the feet of anyone wading through it.
  for (const [from, to] of course.slow ?? []) fluff(ctx, map, cam, from, to, time);
  drawEffects(ctx, R, cam, time);
  if (R.phase === 'done') onScreen(ctx, R, () => confetti(ctx, R.t, time));
}

// ---------- The race's moments ----------
// What happens is noticed here from how the race stands (so a friend's game sees the same): a racer
// moving up a place ('pass': yours, or anyone taking the lead), and each change in how it's moving:
// into the water (a splash), onto a wall (a puff of chalk), off the edge (a whoosh), down from a
// glide (dust). Each lasts a moment.
const FX_LIFE = { pass: 1.1, splash: 0.7, chalk: 0.6, whoosh: 0.6, land: 0.6, finish: 1, emote: 1.3, luck: 1.2 };
// How a racer reacts to being overtaken, by personality: a cross puff (the hot-headed), a sweat drop
// (the nervous), or a startled "!" (everyone else). Getting past someone: a little note, pleased.
const HOT = new Set(['grumpy', 'bossy', 'proud', 'sassy', 'dramatic', 'brave', 'cool', 'stoic']);
const NERVY = new Set(['timid', 'shy', 'clumsy', 'clingy', 'sleepy', 'lazy', 'gentle', 'dreamy']);
const passedMark = (r) => (HOT.has(r.rec.personality) ? 'angry' : NERVY.has(r.rec.personality) ? 'sweat' : 'bang');
function emote(fx, r, mark, time) {
  if (time - (r.emoteAt ?? -9) < 1.6) return;
  r.emoteAt = time;
  fx.push({ kind: 'emote', r, mark, t0: time });
}
function noteEffects(R, course, time) {
  const fx = (R.fx ??= []);
  for (let i = fx.length - 1; i >= 0; i--) if (time - fx[i].t0 > FX_LIFE[fx[i].kind]) fx.splice(i, 1);
  if (R.phase !== 'run') return;
  const order = standings(R, course);
  if (R.order) {
    order.forEach((r, i) => {
      const was = R.order.indexOf(r);
      if (was > i && (r.you || i === 0) && R.clock > 2 && r.done == null && time - (r.passAt ?? -9) > 1.4) {
        r.passAt = time;
        fx.push({ kind: 'pass', r, t0: time, lead: i === 0 });
      }
    });
  }
  // (Overtakes: the one passed reacts, the one passing is pleased; only where yours is in it, or
  // near it, so the screen isn't full of them.)
  if (R.order && R.clock > 2) {
    const you = R.racers[R.me];
    order.forEach((r, i) => {
      const was = R.order.indexOf(r);
      if (was <= i || r.done != null) return;
      const beaten = R.order[i];
      if (!beaten || beaten === r) return;
      if (!r.you && !beaten.you && Math.abs(r.x - you.x) > 260) return;
      emote(fx, beaten, passedMark(beaten), time);
      emote(fx, r, 'note', time);
    });
  }
  R.order = order;
  // (Off the line: a puff of dust at everyone's feet.)
  if (!R.goFx) {
    R.goFx = true;
    for (const r of R.racers) fx.push({ kind: 'land', x: r.x, y: r.y, t0: time });
  }
  // (A trip or a tailwind, world/mochi-race.js: its word over it, and a puff or a gust.)
  for (const r of R.racers) {
    if (r.luckAt != null && r.luckSeen !== r.luckAt) {
      r.luckSeen = r.luckAt;
      fx.push({ kind: 'luck', r, word: r.luckKind === 'trip' ? 'Oops!' : 'Tailwind!', wind: r.luckKind === 'wind', t0: time });
      fx.push({ kind: r.luckKind === 'trip' ? 'land' : 'whoosh', x: r.x, y: r.y, t0: time });
      if (r.luckKind === 'trip') emote(fx, r, 'sweat', time);
    }
  }
  for (const r of R.racers) {
    // (Running on empty: a puff of tiredness. Into the water: a startled splash "!".)
    const worn = (r.m.tired ?? 0) > 0.9;
    if (worn && !r.fxRest) emote(fx, r, 'puff', time);
    r.fxRest = worn;
    if (r.m.mode === 'swim' && r.fxMode && r.fxMode !== 'swim') emote(fx, r, 'bang', time);
    const mode = r.m.mode;
    if (r.fxMode && r.fxMode !== mode) {
      const kind = mode === 'swim' ? 'splash' : mode === 'climb' ? 'chalk' : mode === 'fly' ? 'whoosh' : r.fxMode === 'fly' ? 'land' : null;
      if (kind) fx.push({ kind, x: r.x, y: r.y, t0: time });
    }
    r.fxMode = mode;
    if (r.done != null && !r.fxDone) {
      r.fxDone = true;
      if (r.place === 1) fx.push({ kind: 'finish', x: course.finish, y: r.y, t0: time });
    }
  }
}
// A reaction over a racer's head: a little white bubble that pops in with a bounce, floats up and
// fades, with its mark in it: "!", a cross puff, a sweat drop, a music note, a tired puff.
function drawEmote(ctx, x, y, mark, k) {
  const u = Math.min(1, k / 0.18);
  const s = 1 + 1.7 * (u - 1) ** 3 + 0.7 * (u - 1) ** 2;
  const a = Math.min(1, (1 - k) / 0.25);
  ctx.save();
  ctx.globalAlpha = Math.max(0, a);
  ctx.translate(x, y - k * 6);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(40,20,40,0.2)';
  ctx.beginPath();
  ctx.arc(0.6, 1, 7, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, TAU);
  ctx.moveTo(-4, 4);
  ctx.lineTo(-7, 9);
  ctx.lineTo(-1, 6);
  ctx.fill();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (mark === 'bang') {
    ctx.fillStyle = '#ff9a20';
    ctx.fillRect(-1.1, -4.5, 2.2, 5.5);
    ctx.beginPath();
    ctx.arc(0, 3, 1.2, 0, TAU);
    ctx.fill();
  } else if (mark === 'angry') {
    ctx.strokeStyle = '#ee4060';
    ctx.lineWidth = 1.4;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      ctx.beginPath();
      ctx.moveTo(sx * 1, sy * 3.6);
      ctx.quadraticCurveTo(sx * 1.2, sy * 1.2, sx * 3.6, sy * 1);
      ctx.stroke();
    }
  } else if (mark === 'sweat') {
    ctx.fillStyle = '#5ab4f0';
    ctx.beginPath();
    ctx.moveTo(0, -4.6);
    ctx.quadraticCurveTo(3.6, 0, 3, 2);
    ctx.arc(0, 1.6, 3, 0.1, Math.PI - 0.1);
    ctx.quadraticCurveTo(-3.6, 0, 0, -4.6);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(-1.6, 0, 1, 1.6);
  } else if (mark === 'note') {
    ctx.fillStyle = '#ff6f9a';
    ctx.strokeStyle = '#ff6f9a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(-1.6, 2.6, 2, 1.5, -0.4, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0.2, 2.4);
    ctx.lineTo(0.2, -4);
    ctx.quadraticCurveTo(2.4, -3, 3, -1);
    ctx.stroke();
  } else if (mark === 'puff') {
    ctx.fillStyle = '#b8a8c8';
    for (const [px, py, pr] of [[-2.4, 1, 2.2], [0.6, -1, 2.6], [2.8, 1.2, 1.8]]) {
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}
function drawEffects(ctx, R, cam, time) {
  for (const f of R.fx ?? []) {
    const k = (time - f.t0) / FX_LIFE[f.kind];
    const ease = 1 - (1 - k) ** 3;
    ctx.save();
    if (f.kind === 'luck') {
      const r = f.r;
      const x = r.x - cam.x;
      const y = r.y - cam.y - (r.m.size === 'baby' ? 50 : 58) - ease * 8;
      ctx.globalAlpha = Math.min(1, (1 - k) * 3);
      const s = 1 + 0.4 * (1 - Math.min(1, k * 5));
      ctx.translate(x, y);
      ctx.scale(s, s);
      ctx.font = '900 8px Nunito, "Trebuchet MS", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeText(f.word, 0, 0);
      ctx.fillStyle = f.wind ? '#4aa8e0' : '#a888c8';
      ctx.fillText(f.word, 0, 0);
      ctx.textAlign = 'left';
    } else if (f.kind === 'emote') {
      drawEmote(ctx, f.r.x - cam.x + 9, f.r.y - cam.y - (f.r.m.size === 'baby' ? 38 : 46), f.mark, k);
    } else if (f.kind === 'pass') {
      const r = f.r;
      const x = r.x - cam.x;
      const y = r.y - cam.y - (r.m.size === 'baby' ? 48 : 56) - ease * 10;
      ctx.globalAlpha = Math.min(1, (1 - k) * 3);
      const s = 1 + 0.5 * (1 - Math.min(1, k * 5));
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);
      ctx.font = '900 9px Nunito, "Trebuchet MS", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      const word = f.lead ? 'Lead!' : 'Pass!';
      ctx.strokeText(word, 0, 0);
      ctx.fillStyle = f.lead ? '#f0a020' : '#ff5f8f';
      ctx.fillText(word, 0, 0);
      ctx.restore();
      // A ring bursting round it.
      ctx.globalAlpha = (1 - k) * 0.8;
      ctx.strokeStyle = f.lead ? '#ffd75e' : '#ffb3c8';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(r.x - cam.x, r.y - cam.y - 12, 8 + ease * 16, 6 + ease * 12, 0, 0, TAU);
      ctx.stroke();
    } else if (f.kind === 'splash') {
      const x = f.x - cam.x;
      const y = f.y - cam.y;
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * (0.1 + 0.8 * (i / 6));
        const d = ease * 16;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * d, y - Math.sin(a) * d * 1.3 + k * k * 14, 1.6 * (1 - k * 0.5), 0, TAU);
        ctx.fill();
      }
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(x, y + 1, 6 + ease * 18, 1.5 + ease * 2, 0, 0, TAU);
      ctx.stroke();
    } else if (f.kind === 'chalk' || f.kind === 'land') {
      const x = f.x - cam.x;
      const y = f.y - cam.y - (f.kind === 'chalk' ? 14 : 1);
      ctx.globalAlpha = (1 - k) * 0.8;
      ctx.fillStyle = f.kind === 'chalk' ? '#ffffff' : '#f0e2d0';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU + 0.6;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * ease * 9, y + Math.sin(a) * ease * (f.kind === 'land' ? 3 : 7) - ease * 3, 2.6 + ease * 2.4, 0, TAU);
        ctx.fill();
      }
    } else if (f.kind === 'whoosh') {
      const x = f.x - cam.x;
      const y = f.y - cam.y - 10;
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x - 6 - ease * 22, y - 6 + i * 6);
        ctx.quadraticCurveTo(x - ease * 10, y - 8 + i * 6, x + 4, y - 6 + i * 6 + 2);
        ctx.stroke();
      }
    } else if (f.kind === 'finish') {
      // A burst of streamers off the finish line as the winner crosses.
      const x = f.x - cam.x;
      const y = f.y - cam.y - 30;
      for (let i = 0; i < 14; i++) {
        const a = -Math.PI / 2 + (i - 6.5) * 0.2;
        const d = ease * (40 + (i % 3) * 12);
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = FLAGS[i % FLAGS.length];
        ctx.fillRect(x + Math.cos(a) * d - 1.2, y + Math.sin(a) * d + k * k * 30, 2.4, 3.4);
      }
    }
    ctx.restore();
  }
}
// Draws in screen space, whatever the race camera's zoom (render/scene.js keeps the screen's own
// transform in `R.screenT`).
function onScreen(ctx, R, draw) {
  ctx.save();
  if (R.screenT) ctx.setTransform(R.screenT);
  try {
    draw();
  } finally {
    ctx.restore();
  }
}
// The rush of speed: thin streaks of air flying past, the faster yours goes the more of them.
function speedStreaks(ctx, speed, time) {
  const k = Math.max(0, Math.min(1, (speed - 100) / 90));
  if (k <= 0) return;
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const h = hash(i * 7.3);
    const len = 30 + h * 50;
    const x = VW + 60 - (((time * (520 + h * 300)) + h * 900) % (VW + 160));
    const y = 30 + hash(i * 3.1) * (VH - 90);
    ctx.globalAlpha = k * (0.18 + h * 0.2);
    ctx.lineWidth = 0.8 + h * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();
  }
  ctx.restore();
}
// The podium: three blocks rising out of the grass between the finish arch and the stands (the
// winner's tallest, in the middle), each cream with a top in its metal (gold, silver, bronze), a
// soft band of shade under the lip and its place on a round plate; behind it a rounded pink board
// with three gold stars, so the three on it stand out from the meadow behind.
const PODIUM_COLORS = [['#ffd75e', '#e0a830'], ['#e4e8f2', '#b4bacc'], ['#f2b88a', '#c88458']];
const POD_W = 150;
const POD_H = 88;
const BLOCK_W = 36;
const podiumArt = () => art('mr-podium2', POD_W, POD_H, () => {
  const c = POD_W / 2;
  const out = [
    // The board: pink edge, cream face, a blush band along its top.
    T([[8, POD_H - 6], [8, 30], [22, 12], [c, 3], [POD_W - 22, 12], [POD_W - 8, 30], [POD_W - 8, POD_H - 6]], '#ff9ec0'),
    F(T([[12, POD_H - 6], [12, 31], [25, 15.5], [c, 7.5], [POD_W - 25, 15.5], [POD_W - 12, 31], [POD_W - 12, POD_H - 6]], '#fff6ee')),
    F(T([[12, 31], [25, 15.5], [c, 7.5], [POD_W - 25, 15.5], [POD_W - 12, 31], [POD_W - 12, 34], [POD_W - 25, 18.5], [c, 10.5], [25, 18.5], [12, 34]], '#ffe0ea')),
  ];
  for (const [x, y, r] of [[c - 32, 21, 3.6], [c, 15, 5], [c + 32, 21, 3.6]]) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.46 : r;
      pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
    }
    out.push(T(pts, '#ffd75e'));
  }
  for (const place of [2, 3, 1]) {
    const [dx, h] = PODIUM.blocks[place - 1];
    const [top, deep] = PODIUM_COLORS[place - 1];
    const x0 = c + dx - BLOCK_W / 2;
    const y0 = POD_H - h;
    out.push(
      R(x0, y0, BLOCK_W, h, '#fffaf2'),
      F(R(x0, y0, BLOCK_W, 4, top)),
      F(R(x0, y0 + 4, BLOCK_W, 1.4, deep)),
      F(R(x0, y0 + 5.4, BLOCK_W, 2, '#f2e4d8')),
      F(R(x0, POD_H - 2.4, BLOCK_W, 2.4, '#ead6c6')),
      F(R(x0 + BLOCK_W - 2, y0 + 4, 2, h - 4, '#f0e2d4')),
    );
  }
  return out;
});
function drawPodium(ctx, map, cam, t) {
  const course = map.race;
  const cx = course.finish + PODIUM.x;
  const gy = groundAt(map, cx) - cam.y;
  const k = Math.max(0, Math.min(1, t / 0.6));
  const e = k * k * (3 - 2 * k);
  const rise = (1 - e) * POD_H;
  const base = gy + 1 + rise;
  ctx.save();
  ctx.beginPath();
  ctx.rect(cx - cam.x - POD_W / 2 - 2, gy - POD_H - 4, POD_W + 4, POD_H + 6);
  ctx.clip();
  place(ctx, podiumArt(), snap(cx - cam.x), base);
  // Each block's place on a round plate in its metal, white numeral.
  for (const p of [1, 2, 3]) {
    const [dx, h] = PODIUM.blocks[p - 1];
    const [top, deep] = PODIUM_COLORS[p - 1];
    const x = cx + dx - cam.x;
    const y = base - Math.max(h / 2 + 0.5, 6.5);
    ctx.fillStyle = deep;
    ctx.beginPath();
    ctx.arc(x, y + 0.8, 4.8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = top;
    ctx.beginPath();
    ctx.arc(x, y, 4.8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(x - 1.5, y - 1.7, 1.2, 0, TAU);
    ctx.fill();
    ctx.font = '900 6.5px Nunito, "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = deep;
    ctx.strokeText(String(p), x, y + 2.4);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(p), x, y + 2.4);
  }
  ctx.textAlign = 'left';
  ctx.restore();
}
// A medal on the chest of each of the three: a ribbon in two stripes from round its neck down to a
// round medal in its metal, a darker rim, a star pressed in it, a glint; swinging a little.
function podiumMedal(ctx, x0, y0, place, time, k = 1, neck = 6) {
  ctx.save();
  ctx.translate(x0, y0);
  ctx.scale(k, k);
  const x = 0;
  const y = 0;
  const [metal, rim] = PODIUM_COLORS[place - 1];
  const ribbon = [['#ff6f9a', '#ffd0de'], ['#5aa8e8', '#cfe6ff'], ['#5ab86a', '#cdeec8']][place - 1];
  const sway = Math.sin(time * 2.4 + place) * 0.8;
  const mx = x + sway;
  const my = y + 3;
  // The ribbon: a V from either side of the neck, each side two-tone.
  for (const side of [-1, 1]) {
    ctx.fillStyle = ribbon[0];
    ctx.beginPath();
    ctx.moveTo(x + side * 4.2, y - neck);
    ctx.lineTo(x + side * 1.8, y - neck);
    ctx.lineTo(mx, my - 2.6);
    ctx.lineTo(mx + side * 1.6, my - 1.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ribbon[1];
    ctx.beginPath();
    ctx.moveTo(x + side * 3.2, y - neck);
    ctx.lineTo(x + side * 2.6, y - neck);
    ctx.lineTo(mx + side * 0.6, my - 2.2);
    ctx.lineTo(mx + side * 1, my - 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(mx, my + 0.5, 4.4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = metal;
  ctx.beginPath();
  ctx.arc(mx, my, 4.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rim;
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? 1.1 : 2.5;
    pts.push([mx + Math.cos(a) * rr, my + 0.2 + Math.sin(a) * rr]);
  }
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillRect(mx - 2.6, my - 2.4, 1.2, 1.2);
  ctx.restore();
}
// The leader's crown: a little gold crown with three points and a pink jewel.
function crown(ctx, x, y) {
  ctx.fillStyle = '#ffcc3a';
  ctx.beginPath();
  ctx.moveTo(x - 5, y + 2);
  ctx.lineTo(x - 5, y - 3);
  ctx.lineTo(x - 2.5, y - 0.6);
  ctx.lineTo(x, y - 4.4);
  ctx.lineTo(x + 2.5, y - 0.6);
  ctx.lineTo(x + 5, y - 3);
  ctx.lineTo(x + 5, y + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff6f9a';
  ctx.fillRect(x - 0.9, y - 0.4, 1.8, 1.8);
  ctx.fillStyle = '#fff3b0';
  ctx.fillRect(x - 4.4, y - 2.6, 1, 1);
}
function arrow(ctx, x, y) {
  ctx.fillStyle = '#ff6f9a';
  ctx.beginPath();
  ctx.moveTo(x - 4.5, y - 5);
  ctx.lineTo(x + 4.5, y - 5);
  ctx.lineTo(x, y + 1);
  ctx.closePath();
  ctx.fill();
}
// Confetti over the podium: one shower of little papers in the flag colours, falling round the
// three (the camera's on them) and settling away, not the whole sky.
function confetti(ctx, t, time) {
  const k = (t - 1.2) / 3.2;
  if (k <= 0 || k >= 1) return;
  ctx.save();
  for (let i = 0; i < 26; i++) {
    const h = hash(i * 5.7);
    const age = t - 1.2 - hash(i * 3.1) * 0.8;
    if (age <= 0) continue;
    const y = VH * 0.18 + age * (34 + h * 22);
    const x = VW / 2 + (hash(i * 9.1) - 0.5) * 180 + Math.sin(time * (1.4 + h) + i) * 8;
    const flip = Math.abs(Math.sin(time * (3 + h * 3) + i));
    ctx.globalAlpha = Math.max(0, Math.min(1, age * 4, (1 - k) * 4)) * 0.9;
    ctx.fillStyle = FLAGS[i % FLAGS.length];
    ctx.fillRect(x - 1.5 * flip, y, 3 * flip + 0.4, 2.2);
  }
  ctx.restore();
}
