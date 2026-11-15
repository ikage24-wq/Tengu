// Mochi Sumo, drawn (world/mochi-sumo.js runs it): the sumo hall on the Mochi Market's lane, and
// inside it the hall itself - its wooden walls hung with banners, the crowd on the tiers behind the
// ring and down in front, the raised clay ring with its straw bales and two white lines, the roof
// hanging over it with its purple drape and a big tassel at each corner (green, red, white, black),
// the referee, the two wrestlers; the dust off the clay, the salt, the thump where they meet; and on
// the screen, the words: the bout, the names, "Hakkeyoi!" and its timing ring, the winning move, the
// results.

import { mix } from './pixel.js';
import { BACKDROPS } from './scenery.js';
import { drawMochiAnim } from './mochi-anim.js';
import { signText } from './signfont.js';
import { say, confetti, audienceMochi } from './show.js';
import { RING, SUMO_HALL, STEP } from '../world/mochi-sumo.js';
import { BOUTS, startOf } from '../data/mochi-sumo.js';
import { styleOf } from '../data/mochi-raise.js';
import { VW, VH } from '../input.js';

const TAU = Math.PI * 2;
const hash = (n) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const MID = RING.mid;
const TOP = SUMO_HALL.y0;
const PASTEL = ['#ffd6e4', '#fff1c8', '#d6f0ff', '#e0f5d8', '#eadcff', '#ffe2cc', '#ffffff'];

// ---------- The sumo hall, out on the market lane (render/garden.js: 'mg_sumohall') ----------
// A little wooden hall: a curved tiled roof with gold ridge ends, a dark doorway hung with an indigo
// curtain (a white ring on it), a drum on a stand beside the door, and two tall banners either side.
export function drawSumoHall(ctx, x, gy, time, wx) {
  const L = x - 34;
  const R = x + 34;
  // Its walls: pale wood, dark posts at the corners.
  ctx.fillStyle = '#e8cfa0';
  ctx.fillRect(L, gy - 40, 68, 40);
  ctx.fillStyle = '#d4b480';
  for (let i = 0; i < 6; i++) ctx.fillRect(L + 4 + i * 11.4, gy - 40, 0.8, 40);
  ctx.fillStyle = '#6a4628';
  ctx.fillRect(L - 2, gy - 42, 5, 42);
  ctx.fillRect(R - 3, gy - 42, 5, 42);
  ctx.fillRect(L, gy - 3, 68, 3);
  // The doorway, its curtain in three panels lifting a little at the hem.
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(x - 13, gy - 30, 26, 30);
  for (let i = 0; i < 3; i++) {
    const sway = Math.sin(time * 1.6 + wx * 0.01 + i) * 0.6;
    ctx.fillStyle = i === 1 ? '#3a4a8a' : '#34437e';
    ctx.beginPath();
    ctx.moveTo(x - 13 + i * 8.8, gy - 30);
    ctx.lineTo(x - 13 + (i + 1) * 8.8 - 0.4, gy - 30);
    ctx.lineTo(x - 13 + (i + 1) * 8.8 - 0.4 + sway, gy - 14);
    ctx.lineTo(x - 13 + i * 8.8 + sway, gy - 14);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, gy - 23, 3.6, 0, TAU);
  ctx.stroke();
  // The roof: dark grey-green tiles, curving up at the eaves, a gold cap at each ridge end.
  ctx.fillStyle = '#4a5a4c';
  ctx.beginPath();
  ctx.moveTo(L - 12, gy - 38);
  ctx.quadraticCurveTo(L + 2, gy - 42, L + 8, gy - 58);
  ctx.lineTo(R - 8, gy - 58);
  ctx.quadraticCurveTo(R - 2, gy - 42, R + 12, gy - 38);
  ctx.lineTo(R + 8, gy - 36);
  ctx.lineTo(L - 8, gy - 36);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5e7060';
  ctx.lineWidth = 0.8;
  for (let i = 1; i < 4; i++) {
    const yy = gy - 58 + i * 5;
    ctx.beginPath();
    ctx.moveTo(L + 8 - i * 4, yy);
    ctx.lineTo(R - 8 + i * 4, yy);
    ctx.stroke();
  }
  ctx.fillStyle = '#34403a';
  ctx.fillRect(L + 6, gy - 61, 56, 4);
  ctx.fillStyle = '#e2b04a';
  ctx.fillRect(L + 4, gy - 62, 4, 6);
  ctx.fillRect(R - 8, gy - 62, 4, 6);
  // The sign over the door.
  ctx.fillStyle = '#fff6ea';
  ctx.fillRect(x - 22, gy - 36 + 1, 44, 8);
  ctx.fillStyle = '#b8402e';
  ctx.fillRect(x - 22, gy - 36 + 1, 44, 1);
  signText(ctx, 'SUMO', x, gy - 33.5, { align: 'center', color: '#b8402e' });
  // The drum by the door: a fat taiko on its wooden stand, its head to us, a ring of gold tacks
  // round it, and its two sticks resting across the top.
  const dx = R + 12;
  const dy = gy - 15;
  ctx.fillStyle = '#6a4628';
  ctx.beginPath();
  ctx.moveTo(dx - 8, gy);
  ctx.lineTo(dx - 6.6, gy);
  ctx.lineTo(dx - 2, dy + 2);
  ctx.lineTo(dx - 3.4, dy + 2);
  ctx.closePath();
  ctx.moveTo(dx + 8, gy);
  ctx.lineTo(dx + 6.6, gy);
  ctx.lineTo(dx + 2, dy + 2);
  ctx.lineTo(dx + 3.4, dy + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(dx - 6, gy - 4, 12, 1.2);
  ctx.fillStyle = '#8a2e22';
  ctx.beginPath();
  ctx.ellipse(dx, dy, 8.6, 8, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#b8402e';
  ctx.beginPath();
  ctx.ellipse(dx, dy, 7.6, 7.2, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f4e6c8';
  ctx.beginPath();
  ctx.arc(dx, dy, 5.4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e8d4ac';
  ctx.beginPath();
  ctx.arc(dx + 1, dy + 1, 3.6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e2b04a';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    ctx.fillRect(dx + Math.cos(a) * 6.3 - 0.5, dy + Math.sin(a) * 6.3 - 0.5, 1, 1);
  }
  ctx.strokeStyle = '#d8b07a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(dx - 7, dy - 9.6);
  ctx.lineTo(dx + 4, dy - 7.2);
  ctx.moveTo(dx - 4, dy - 10.4);
  ctx.lineTo(dx + 7, dy - 8);
  ctx.stroke();
  // The two tall banners, on bamboo poles, stirring.
  const flags = [['#ff9ec0', L - 13], ['#8fc8f0', R + 26]];
  flags.forEach(([c, fx], i) => {
    ctx.fillStyle = '#b8a060';
    ctx.fillRect(fx, gy - 64, 1.4, 64);
    const s = Math.sin(time * 2 + wx * 0.02 + i * 2) * 1.2;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(fx + 1.4, gy - 60);
    ctx.lineTo(fx + 10, gy - 60);
    ctx.lineTo(fx + 10 + s, gy - 22);
    ctx.lineTo(fx + 1.4 + s * 0.6, gy - 22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(fx + 5.8 + s * 0.3, gy - 50, 2.6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = mix(c, '#000000', 0.25);
    ctx.fillRect(fx + 4.4 + s * 0.4, gy - 42, 3, 14);
    ctx.fillRect(fx + 1.4, gy - 61, 9.6, 1.4);
  });
}

// ---------- The hall ----------
// (The camera never looks outside the hall's box, world/mochi-sumo.js SUMO_HALL.)
const BEAM = 196;
const TIERS = [
  { y: 222, r: 5.2, step: 13, dim: 0.3 },
  { y: 236, r: 5.8, step: 14, dim: 0.2 },
  { y: 250, r: 6.4, step: 15, dim: 0.1 },
];
// One of the crowd on the tiers, facing the ring (and us): round and pastel, two dot eyes, pink
// cheeks, a sprout; cheering, it bounces with its paws up and its mouth open.
function fanMochi(ctx, x, y, r, body, cheering, time, h) {
  const hop = cheering ? Math.abs(Math.sin(time * 8 + h * 9)) * r * 0.3 : 0;
  y -= hop;
  if (cheering) {
    ctx.fillStyle = body;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(x + side * r * 0.95, y - r * 0.9, r * 0.24, r * 0.34, side * 0.4, 0, TAU);
      ctx.fill();
    }
  }
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.86, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.3, y - r * 0.42, r * 0.36, r * 0.2, -0.3, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#3a2418';
  const ey = y - r * 0.05;
  ctx.fillRect(x - r * 0.42, ey - r * 0.14, r * 0.2, r * 0.3);
  ctx.fillRect(x + r * 0.22, ey - r * 0.14, r * 0.2, r * 0.3);
  ctx.fillStyle = 'rgba(255,120,150,0.5)';
  ctx.fillRect(x - r * 0.72, ey + r * 0.22, r * 0.3, r * 0.14);
  ctx.fillRect(x + r * 0.42, ey + r * 0.22, r * 0.3, r * 0.14);
  ctx.fillStyle = '#7a3a3a';
  if (cheering) ctx.fillRect(x - r * 0.12, ey + r * 0.28, r * 0.24, r * 0.2);
  else ctx.fillRect(x - r * 0.1, ey + r * 0.32, r * 0.2, r * 0.07);
  // Its sprout.
  const sw = Math.sin(time * 1.8 + h * 6) * 0.25;
  ctx.strokeStyle = '#6ab86a';
  ctx.lineWidth = Math.max(0.8, r * 0.13);
  ctx.beginPath();
  ctx.moveTo(x, y - r * 0.84);
  ctx.lineTo(x + sw * r * 0.3, y - r * 1.24);
  ctx.stroke();
  ctx.fillStyle = '#8fd88a';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + sw * r * 0.3 + side * r * 0.22, y - r * 1.28, r * 0.24, r * 0.12, side * -0.5 + sw, 0, TAU);
    ctx.fill();
  }
}
// Its back wall: dark wood, a beam along the top, banners hanging, round lanterns glowing, and the
// box seats rising behind the ring, full of Mochi.
function hallBack(ctx, t, cam, width, y0, time) {
  ctx.save();
  ctx.translate(-cam.x, -cam.y);
  const g = ctx.createLinearGradient(0, TOP, 0, RING.floor);
  g.addColorStop(0, '#2a1810');
  g.addColorStop(0.55, '#432a1c');
  g.addColorStop(1, '#5a3824');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 640, RING.floor + 2);
  // Planks.
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let x = 4; x < 640; x += 22) ctx.fillRect(x, TOP, 1, BEAM - TOP);
  // The beams: along the top, and across under the banners.
  ctx.fillStyle = '#1e120a';
  ctx.fillRect(0, TOP, 640, 7);
  ctx.fillStyle = '#3a2416';
  ctx.fillRect(0, TOP + 7, 640, 2);
  // Banners down the walls, either side of the roof: pastel, a white ring with a little Mochi face.
  const banners = [146, 172, 198, 442, 468, 494];
  banners.forEach((bx, i) => {
    const c = ['#ff9ec0', '#8fd3a0', '#8fc8f0', '#ffd27a', '#c8a8f0', '#ffb08a'][i];
    const s = Math.sin(time * 1.1 + i * 1.7) * 0.8;
    ctx.fillStyle = '#c8a060';
    ctx.fillRect(bx - 1, TOP + 9, 18, 1.6);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(bx, TOP + 10);
    ctx.lineTo(bx + 16, TOP + 10);
    ctx.lineTo(bx + 16 + s, TOP + 66);
    ctx.lineTo(bx + 8 + s, TOP + 61);
    ctx.lineTo(bx + s, TOP + 66);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = mix(c, '#ffffff', 0.35);
    ctx.fillRect(bx, TOP + 10, 16, 2);
    const fx = bx + 8 + s * 0.3;
    const fy = TOP + 26;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(fx, fy, 5.6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = mix(c, '#3a2418', 0.45);
    ctx.fillRect(fx - 2.4, fy - 0.8, 1.2, 1.4);
    ctx.fillRect(fx + 1.2, fy - 0.8, 1.2, 1.4);
    ctx.fillRect(fx - 1, fy + 1.4, 2, 0.8);
    ctx.fillStyle = mix(c, '#3a2418', 0.3);
    for (let k = 0; k < 3; k++) ctx.fillRect(fx - 4 + k * 3.6 + s * 0.2, fy + 10 + k * 7, 1.2, 4);
  });
  // Round paper lanterns, glowing warm.
  for (const [lx, ly] of [[226, TOP + 30], [414, TOP + 30], [160, TOP + 86], [480, TOP + 86]]) {
    const glow = ctx.createRadialGradient(lx, ly, 1, lx, ly, 22);
    glow.addColorStop(0, 'rgba(255,214,150,0.32)');
    glow.addColorStop(1, 'rgba(255,214,150,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(lx - 22, ly - 22, 44, 44);
    ctx.fillStyle = '#3a2416';
    ctx.fillRect(lx - 0.5, ly - 14, 1, 7);
    ctx.fillStyle = '#ffe2b0';
    ctx.beginPath();
    ctx.ellipse(lx, ly, 5.4, 6.4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e05050';
    ctx.fillRect(lx - 3.6, ly - 7, 7.2, 1.6);
    ctx.fillRect(lx - 3.6, ly + 5.4, 7.2, 1.6);
    ctx.strokeStyle = 'rgba(200,120,60,0.45)';
    ctx.lineWidth = 0.5;
    for (const dy of [-3, 0, 3]) {
      ctx.beginPath();
      ctx.moveTo(lx - 5, ly + dy);
      ctx.lineTo(lx + 5, ly + dy);
      ctx.stroke();
    }
  }
  // The beam the box seats begin under, and the seats: rows of Mochi on cushions, each row in its
  // wooden box, the nearer rows a little lower and lit by the ring.
  ctx.fillStyle = '#2a1a10';
  ctx.fillRect(0, BEAM, 640, 4);
  const cheering = cheerOf(live, time);
  TIERS.forEach((row, ri) => {
    ctx.fillStyle = mix('#5a3824', '#1e120a', 0.4 - ri * 0.1);
    ctx.fillRect(0, row.y - row.r * 1.6, 640, row.r * 2.4);
    for (let x = 130 + (ri % 2) * row.step * 0.5, i = 0; x < 520; x += row.step, i++) {
      const h = hash(ri * 31 + i * 7.3);
      fanMochi(ctx, x + (h - 0.5) * 3, row.y, row.r, mix(PASTEL[Math.floor(h * PASTEL.length)], '#5a3824', row.dim), cheering && h > 0.3, time, h);
    }
    ctx.fillStyle = '#7a4a2c';
    ctx.fillRect(0, row.y + row.r * 0.6, 640, 1.6);
    ctx.fillStyle = '#e05050';
    for (let x = 136 + ri * 9; x < 520; x += 46) ctx.fillRect(x, row.y + row.r * 0.6 + 1.6, 18, 1.2);
  });
  // Thick posts at the corners of the hall.
  for (const px of [134, 500]) {
    ctx.fillStyle = '#2e1c12';
    ctx.fillRect(px, TOP, 8, RING.floor - TOP);
    ctx.fillStyle = '#4a2e1e';
    ctx.fillRect(px + 1, TOP, 2, RING.floor - TOP);
  }
  ctx.restore();
  return true;
}
BACKDROPS.push({
  far: (ctx, t, cam, width, y0, time) => (t.skyline === 'course:sumohall' ? hallBack(ctx, t, cam, width, y0, time) : false),
});
// (The crowd cheers as a bout's won, and all through the results: the bout on now, `live`.)
let live = null;
function cheerOf(S, time) {
  if (!S) return false;
  if (S.phase === 'results' || S.phase === 'done') return true;
  return ['fall', 'dazed'].includes(S.step);
}

// ---------- The ring ----------
const TOPBAND = 9;
function drawRing(ctx, time) {
  const y = RING.y;
  // The hall's floor round the ring, swept sand.
  ctx.fillStyle = '#8a6038';
  ctx.fillRect(0, y - 4, 640, 4);
  const fl = ctx.createLinearGradient(0, y, 0, 360);
  fl.addColorStop(0, '#9a6e44');
  fl.addColorStop(1, '#6a4428');
  ctx.fillStyle = fl;
  ctx.fillRect(0, y, 640, 120);
  ctx.fillStyle = 'rgba(255,230,190,0.08)';
  for (let x = 0; x < 640; x += 30) ctx.fillRect(x, RING.floor + 6, 18, 0.8);
  // Its shadow on the floor.
  ctx.fillStyle = 'rgba(30,16,8,0.35)';
  ctx.beginPath();
  ctx.ellipse(MID, RING.floor + 1, RING.foot + 10, 4, 0, 0, TAU);
  ctx.fill();
  // The clay mound: sloping sides, layers of tamped clay along its face.
  ctx.fillStyle = '#c89464';
  ctx.beginPath();
  ctx.moveTo(MID - RING.top, y);
  ctx.lineTo(MID + RING.top, y);
  ctx.lineTo(MID + RING.foot, RING.floor);
  ctx.lineTo(MID - RING.foot, RING.floor);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#b07e52';
  for (const k of [0.35, 0.7]) {
    const yy = y + (RING.floor - y) * k;
    const half = RING.top + (RING.foot - RING.top) * k;
    ctx.fillRect(MID - half, yy, half * 2, 1);
  }
  ctx.fillStyle = '#d8a874';
  ctx.fillRect(MID - RING.top, y, RING.top * 2, 1.4);
  // Little steps cut into either slope, where they hop up.
  ctx.fillStyle = '#a87448';
  for (const side of [-1, 1]) {
    for (let s = 0; s < 2; s++) {
      const sx = MID + side * (RING.top + 3 + s * 5);
      ctx.fillRect(side < 0 ? sx - 5 : sx, y + 6 + s * 6, 5, 1.6);
    }
  }
  // Its top: smoothed sand, seen a little from above.
  ctx.fillStyle = '#ead2a2';
  ctx.beginPath();
  ctx.moveTo(MID - RING.top + 3, y - TOPBAND);
  ctx.lineTo(MID + RING.top - 3, y - TOPBAND);
  ctx.lineTo(MID + RING.top, y);
  ctx.lineTo(MID - RING.top, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(MID - RING.top + 6, y - TOPBAND + 1, (RING.top - 6) * 2, 1);
  // The straw bales round the fighting circle: the far ones a thin line, the near ones a row of
  // fat bound bundles along the front.
  ctx.fillStyle = '#d8c07a';
  ctx.fillRect(MID - RING.bales + 4, y - TOPBAND + 1.2, (RING.bales - 4) * 2, 1.6);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(MID + side * RING.bales, y - TOPBAND * 0.5, 2, TOPBAND * 0.5, 0, 0, TAU);
    ctx.fill();
  }
  const n = 12;
  for (let i = 0; i < n; i++) {
    const bx = MID - RING.bales + 2 + (i + 0.5) * ((RING.bales * 2 - 4) / n);
    ctx.fillStyle = '#e8d08a';
    ctx.beginPath();
    ctx.ellipse(bx, y - 1, (RING.bales * 2 - 4) / n / 2 + 0.3, 1.9, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#b89a58';
    ctx.fillRect(bx - 2.4, y - 2.6, 0.7, 3.2);
    ctx.fillRect(bx + 1.7, y - 2.6, 0.7, 3.2);
  }
  // The two white lines.
  ctx.fillStyle = '#ffffff';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(MID + side * 10, y - TOPBAND + 2);
    ctx.lineTo(MID + side * 10 + 1.4, y - TOPBAND + 2);
    ctx.lineTo(MID + side * 10 + 2, y - 2.6);
    ctx.lineTo(MID + side * 10 + 0.6, y - 2.6);
    ctx.closePath();
    ctx.fill();
  }
  // A water bucket and its ladle at the foot of either side.
  for (const side of [-1, 1]) {
    const bx = MID + side * (RING.foot + 44);
    const by = RING.floor;
    ctx.fillStyle = '#b8864e';
    ctx.beginPath();
    ctx.moveTo(bx - 5, by - 9);
    ctx.lineTo(bx + 5, by - 9);
    ctx.lineTo(bx + 4.2, by);
    ctx.lineTo(bx - 4.2, by);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a2416';
    ctx.fillRect(bx - 4.8, by - 7, 9.6, 1);
    ctx.fillRect(bx - 4.4, by - 2.6, 8.8, 1);
    ctx.fillStyle = '#8fc8e8';
    ctx.fillRect(bx - 4.4, by - 9.6, 8.8, 1.2);
    ctx.strokeStyle = '#d8b07a';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(bx - side * 2, by - 9);
    ctx.lineTo(bx + side * 6, by - 17);
    ctx.stroke();
  }
}

// The roof hanging over the ring: its cables, the tiles curving up at the eaves, the gold-trimmed
// gable at the front, the purple drape, and the four great tassels swaying under its corners.
const TASSELS = [
  { x: -78, c: '#f4efe4', back: true },
  { x: 78, c: '#2e2a2e', back: true },
  { x: -98, c: '#3caa86' },
  { x: 98, c: '#e05050' },
];
function drawRoof(ctx, time) {
  const eave = 152;
  ctx.strokeStyle = '#1a100a';
  ctx.lineWidth = 1;
  for (const dx of [-56, 56]) {
    ctx.beginPath();
    ctx.moveTo(MID + dx, TOP);
    ctx.lineTo(MID + dx, 124);
    ctx.stroke();
  }
  // The far tassels first, behind the drape.
  for (const T of TASSELS.filter((q) => q.back)) tassel(ctx, MID + T.x, eave + 10, T.c, 0.8, time, T.x);
  // Tiles.
  ctx.fillStyle = '#3e4c40';
  ctx.beginPath();
  ctx.moveTo(MID - 110, eave);
  ctx.quadraticCurveTo(MID - 84, eave - 3, MID - 66, 126);
  ctx.lineTo(MID + 66, 126);
  ctx.quadraticCurveTo(MID + 84, eave - 3, MID + 110, eave);
  ctx.lineTo(MID + 104, eave + 4);
  ctx.lineTo(MID - 104, eave + 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#56685a';
  ctx.lineWidth = 0.7;
  for (let i = 1; i < 5; i++) {
    const k = i / 5;
    const yy = 126 + (eave - 126) * k;
    const half = 66 + (104 - 66) * k * k;
    ctx.beginPath();
    ctx.moveTo(MID - half, yy);
    ctx.lineTo(MID + half, yy);
    ctx.stroke();
  }
  // The ridge, gold caps at its ends.
  ctx.fillStyle = '#2a342c';
  ctx.fillRect(MID - 70, 119, 140, 8);
  ctx.fillStyle = '#e2b04a';
  ctx.fillRect(MID - 74, 117, 6, 11);
  ctx.fillRect(MID + 68, 117, 6, 11);
  ctx.fillStyle = '#fff0b0';
  ctx.fillRect(MID - 73, 118, 1.4, 4);
  ctx.fillRect(MID + 69, 118, 1.4, 4);
  // The eaves' wood.
  ctx.fillStyle = '#6a4628';
  ctx.fillRect(MID - 104, eave + 3, 208, 5);
  // The curved gable over the front, gold-edged, a gold crest in its middle.
  ctx.fillStyle = '#7a5232';
  ctx.beginPath();
  ctx.moveTo(MID - 36, eave + 3);
  ctx.quadraticCurveTo(MID - 22, eave - 1, MID - 12, eave - 14);
  ctx.quadraticCurveTo(MID, eave - 22, MID + 12, eave - 14);
  ctx.quadraticCurveTo(MID + 22, eave - 1, MID + 36, eave + 3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e2b04a';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = '#f2c94c';
  ctx.beginPath();
  ctx.arc(MID, eave - 8, 3.6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#b8862e';
  ctx.beginPath();
  ctx.arc(MID, eave - 8, 1.6, 0, TAU);
  ctx.fill();
  // The purple drape, in three swags, a white crest where they're caught up.
  const dy = eave + 8;
  ctx.fillStyle = '#7a4ab0';
  ctx.beginPath();
  ctx.moveTo(MID - 104, dy);
  ctx.lineTo(MID + 104, dy);
  for (let i = 3; i > 0; i--) {
    const x1 = MID - 104 + (i * 208) / 3;
    const x0 = MID - 104 + ((i - 1) * 208) / 3;
    ctx.lineTo(x1, dy + 7);
    ctx.quadraticCurveTo((x0 + x1) / 2, dy + 15, x0, dy + 7);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#9a6ad0';
  ctx.fillRect(MID - 104, dy, 208, 2);
  for (let i = 0; i <= 3; i++) {
    const cx = MID - 104 + (i * 208) / 3;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, dy + 5, 2.6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#7a4ab0';
    ctx.beginPath();
    ctx.arc(cx, dy + 5, 1, 0, TAU);
    ctx.fill();
  }
  // The near tassels.
  for (const T of TASSELS.filter((q) => !q.back)) tassel(ctx, MID + T.x, dy + 4, T.c, 1, time, T.x);
}
// A great tassel: a cord down from the corner, a knot, and the fluffy fringe, swaying.
function tassel(ctx, x, y, color, s, time, seed) {
  const sw = Math.sin(time * 1.1 + seed) * 0.05;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(sw);
  ctx.scale(s, s);
  const edge = mix(color, '#000000', 0.25);
  const lite = mix(color, '#ffffff', 0.3);
  ctx.fillStyle = edge;
  ctx.fillRect(-0.8, 0, 1.6, 16);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 17, 3.2, 2.6, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = edge;
  ctx.fillRect(-3, 19.4, 6, 1.4);
  // The fringe: a fat bell of strands.
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-3.4, 20.6);
  ctx.quadraticCurveTo(-7, 30, -6.4, 38);
  ctx.lineTo(6.4, 38);
  ctx.quadraticCurveTo(7, 30, 3.4, 20.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = lite;
  ctx.fillRect(-1.6, 22, 1.2, 15);
  ctx.fillStyle = edge;
  for (let k = -5; k <= 5; k += 2.5) ctx.fillRect(k - 0.3, 31, 0.6, 7);
  ctx.restore();
}

// ---------- The show ----------
export function drawSumo(ctx, world, cam, time, layer) {
  const S = world.sumo;
  if (!S) return;
  // (The hall's backdrop asks after the bout, for the crowd's cheering.)
  live = S;
  ctx.save();
  ctx.translate(-cam.x, -cam.y);
  if (layer === 'back') {
    drawRing(ctx, time);
    drawRoof(ctx, time);
    drawFx(ctx, S, time, false);
    // The referee, a step back on the ring; then the rival, then yours (nearest).
    const ref = S.ref;
    ref.m.anchors = {};
    drawMochiAnim(ctx, ref.m, ref.x, ref.y - 2, time);
    const r = S.rivals[S.k];
    for (const c of [r, S.you]) {
      if (!c || c.out) continue;
      c.m.anchors = {};
      drawMochiAnim(ctx, c.m, c.x, c.y, time);
    }
    drawFx(ctx, S, time, true);
  } else drawFront(ctx, S, time);
  ctx.restore();
}
// The near crowd, down in front: the backs of their heads, paws up when they cheer.
function drawFront(ctx, S, time) {
  const cheering = cheerOf(S, time);
  const y = 318;
  ctx.fillStyle = '#2a1a10';
  ctx.fillRect(0, y - 4, 640, 60);
  for (let x = 120, i = 0; x < 530; x += 19, i++) {
    const h = hash(i * 3.7 + 1);
    audienceMochi(ctx, x + (h - 0.5) * 4, y + (i % 2) * 2, 8.4, PASTEL[Math.floor(h * PASTEL.length)], 0.3, cheering && h > 0.25, time, h);
  }
}
// Dust off the clay, the salt flying, the thump where they meet (behind them, or `front`).
function drawFx(ctx, S, time, front) {
  for (const f of S.fx) {
    const a = Math.max(0, (S.ft ?? 0) - f.t0);
    if (f.kind === 'dust' && !front) {
      for (let i = 0; i < f.n * 2; i++) {
        const h = hash(f.t0 * 13 + i);
        const k = Math.min(1, a / (0.6 + h * 0.4));
        const dx = (h - 0.5) * 22 * k + (i % 2 ? 1 : -1) * 4 * k;
        const r = 1.6 + 3.4 * k;
        ctx.fillStyle = `rgba(232,206,160,${0.55 * (1 - k)})`;
        ctx.beginPath();
        ctx.ellipse(f.x + dx, f.y - 1 - 5 * k * (0.4 + h * 0.6), r, r * 0.7, 0, 0, TAU);
        ctx.fill();
      }
    } else if (f.kind === 'salt' && front) {
      for (let i = 0; i < f.n * 2; i++) {
        const h = hash(f.t0 * 7 + i * 1.3);
        const vx = f.dir * (20 + h * 30);
        const vy = -40 - hash(i * 3.1 + f.t0) * 30;
        const yy = f.y + vy * a + 70 * a * a;
        if (yy > RING.y) continue;
        const k = Math.min(1, a / 1.2);
        ctx.fillStyle = `rgba(255,255,255,${0.95 * (1 - k)})`;
        ctx.fillRect(f.x + vx * a - 0.6, yy - 0.6, 1.2, 1.2);
      }
    } else if (f.kind === 'thump' && front) {
      const k = Math.min(1, a / 0.35);
      if (k >= 1) continue;
      ctx.strokeStyle = `rgba(255,240,200,${0.9 * (1 - k)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(f.x, f.y, 4 + 14 * k * f.n, 3 + 10 * k * f.n, 0, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,226,140,${1 - k})`;
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * TAU + 0.3;
        const r0 = 5 + 10 * k * f.n;
        ctx.save();
        ctx.translate(f.x + Math.cos(ang) * r0, f.y + Math.sin(ang) * r0 * 0.8);
        ctx.rotate(ang);
        ctx.fillRect(-2.4, -0.6, 4.8, 1.2);
        ctx.restore();
      }
    }
  }
}

// ---------- On the screen ----------
const pips = (rec) => '●'.repeat(styleOf(rec.stats?.power?.points ?? 0) + 1) + '○'.repeat(5 - styleOf(rec.stats?.power?.points ?? 0));
export function drawSumoScreen(ctx, S, cam, time) {
  const mid = VW / 2;
  const z = S.zoom ?? 1;
  const sx = (wx) => (wx - cam.x) * z;
  const sy = (wy) => (wy - cam.y) * z;
  const tally = () => {
    for (let k = 0; k < BOUTS; k++) {
      const r = S.results[k];
      ctx.fillStyle = r ? (r.win ? '#ffd24a' : '#8a7a8a') : 'rgba(255,255,255,0.35)';
      ctx.strokeStyle = '#5a3a1a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mid - 16 + k * 16, 22, 5, 0, TAU);
      ctx.stroke();
      ctx.fill();
    }
  };
  if (S.phase === 'intro') {
    const a = Math.min(1, S.t / 0.5, (STEP.intro - S.t) / 0.5);
    say(ctx, 'Mochi Sumo!', mid, 120, { size: 26, alpha: a, edge: '#b8402e' });
    say(ctx, `${['Beginner', 'Challenge', 'Master'][['beginner', 'challenge', 'master'].indexOf(S.rank)]} ring · win all three bouts!`, mid, 144, { size: 13, alpha: a, edge: '#7a4a2c' });
    say(ctx, 'Down: skip to the results', mid, 164, { size: 10, alpha: a * 0.75, edge: '#5a3a1a' });
    return;
  }
  if (S.phase === 'bout') {
    const r = S.rivals[S.k];
    tally();
    // The bout, and who's in it, as they come in and stamp.
    if (['enter', 'shiko', 'salt', 'mark'].includes(S.step)) {
      const a = S.step === 'enter' ? Math.min(1, S.st / 0.4) : S.step === 'mark' ? Math.max(0, 1 - S.st / 0.5) : 1;
      say(ctx, `Bout ${S.k + 1} of ${BOUTS}`, mid, 52, { size: 16, alpha: a, edge: '#b8402e' });
      say(ctx, `${S.you.name}  vs  ${r.name}`, mid, 74, { size: 13, alpha: a, edge: '#7a4a2c' });
      if (S.step !== 'enter') {
        for (const c of [S.you, r]) {
          say(ctx, `Power ${pips(c.rec)}`, sx(c.x), sy(c.y - 44), { size: 9, alpha: a, edge: c.you ? '#e0408a' : '#5a3a6a' });
        }
      }
    }
    // The crouch: the timing ring closing in on the call.
    if (S.step === 'crouch') {
      const cx = mid;
      const cy = sy(RING.y - 52);
      const k = Math.max(0, 1 - S.st / STEP.call);
      const pressed = S.pressAt != null;
      if (S.k === 0 || !pressed) say(ctx, 'Press Space at "Hakkeyoi!"', mid, 52, { size: 12, alpha: Math.min(1, S.st / 0.3), edge: '#5a3a1a' });
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, TAU);
      ctx.stroke();
      if (!pressed && k > 0) {
        ctx.strokeStyle = '#ffd24a';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(cx, cy, 10 + 46 * k, 0, TAU);
        ctx.stroke();
      }
      if (S.st >= STEP.call) {
        const p = Math.min(1, (S.st - STEP.call) / 0.18);
        say(ctx, 'Hakkeyoi!', cx, cy + 6, { size: 22 * (1 + Math.sin(p * Math.PI) * 0.25), alpha: 1, edge: '#b8402e' });
      }
      if (pressed) {
        const st = startOf(S.pressAt - STEP.call);
        const words = { perfect: 'Perfect start!', good: 'Good start!', soon: 'Too soon!', late: 'A bit slow!' }[st];
        const pa = Math.min(1, (S.st - S.pressAt) / 0.15);
        if (S.st >= STEP.call || st === 'soon') say(ctx, words, cx, cy + 30, { size: 13, alpha: pa, edge: st === 'perfect' ? '#d8a03a' : st === 'soon' ? '#7a5a8a' : '#4a8a6a' });
      }
    }
    // The winning move, and who won.
    if (['fall', 'dazed', 'back'].includes(S.step) && S.bout) {
      const t0 = S.step === 'fall' ? S.st : S.step === 'dazed' ? STEP.fall + S.st : 9;
      const p = Math.min(1, t0 / 0.25);
      const pop = 1 + Math.sin(Math.min(1, t0 / 0.3) * Math.PI) * 0.22;
      const W = S.bout.youWin ? S.you : r;
      say(ctx, `${S.bout.move.name}!`, mid, 56, { size: 20 * pop, alpha: p, edge: '#b8402e' });
      say(ctx, S.bout.youWin ? `${W.name} wins!` : `${W.name} wins this one`, mid, 80, { size: 14, alpha: Math.min(1, (t0 - 0.3) / 0.25), edge: S.bout.youWin ? '#e0408a' : '#5a3a6a' });
    }
    return;
  }
  // The results.
  const t = S.phase === 'done' ? 9 : S.t;
  tally();
  if (S.wins === BOUTS && t > 1) confetti(ctx, t - 1, time);
  const head = S.wins === BOUTS ? `${S.you.name} is the champion!` : S.wins ? `${S.you.name} won ${S.wins} of ${BOUTS}!` : 'A good try!';
  const pop = 1 + Math.sin(Math.min(1, t / 0.35) * Math.PI) * 0.18;
  say(ctx, head, mid, 60, { size: 20 * pop, alpha: Math.min(1, t / 0.4), edge: S.wins === BOUTS ? '#d8a03a' : '#b8402e' });
  say(ctx, `+${S.prize.toLocaleString()} gold`, mid, 84, { size: 14, alpha: Math.min(1, (t - 0.5) / 0.4), edge: '#7a4a2c' });
  if (S.opened) say(ctx, `The ${S.opened} ring is open!`, mid, 104, { size: 12, alpha: Math.min(1, (t - 0.9) / 0.4), edge: '#d8a03a' });
  if (S.phase === 'done') say(ctx, 'Up: back to the market', mid, VH - 16, { size: 13, edge: '#4a2a1a', alpha: Math.min(1, (S.t - 0.4) / 0.4) * (0.8 + 0.2 * Math.sin(time * 3)) });
}
