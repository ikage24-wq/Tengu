// The Mochi Garden's pieces (world/garden.js townPieces: `mg_*`), and the nursery's room inside.
// Moonmortar Garden: soft wagashi colours (mochi white, sakura pink, matcha, kinako gold, azuki),
// warm wood and pale stone, drawn like the rest of the scenery: outlined pastel shapes lit from the
// upper left. Everything has a little life of its own (lanterns swinging, steam from the kitchen,
// the noren curtain stirring, the swing on the big tree, lily pads bobbing, the waterfall pouring,
// the windsock), phased by its place in the world, never the screen.
//
//   mg_gate        the gate from Sprout Village: two posts, a beam with upturned ends, crossed mochi
//                  mallets on top, a hanging sign with a little mochi on it, paper lanterns
//   mg_lantern     a paper lantern on a post (extra: which one, so no two are alike)
//   mg_eggstall    the egg stall: a striped awning over a counter of eggs in their little mortars
//   mg_kitchen     the sweet kitchen: a tiled cottage with a serving window, a pot steaming on the
//                  counter, a noren curtain at the door, a chimney
//   mg_nursery     the nursery: a round white dome like a big mochi, blushing, a thatch cap and a
//                  sprout on top, a round door, round windows
//   mg_track       the running track's start and finish posts, pennants, chalk lines
//   mg_fruittree   a fruit tree (extra: peach, persimmon, plum, loquat), each its own shape
//   mg_bigtree     the big old tree on its rise, a swing hung from its long bough
//   mg_lilies      lily pads on the pond (and a lotus), bobbing
//   mg_reeds       reeds and cattails at the water's edge, swaying
//   mg_falls       the waterfall down the upper cliff into a rock basin on the ledge, and a bamboo
//                  spout carrying the water on out over the pond
//   mg_boulders    the climbing rocks on the ledge, mossy, with a knotted rope
//   mg_glide       the windsock on the cliff top by the glide launch, and its sign
//   mg_moonmortar  the Moonmortar: a great stone mortar with its wooden mallet, a sacred rope and
//                  paper streamers round it, a crescent carved in its side, softly lit at night
//   mg_stadium     the stadium gate at the top of the cliff (closed until racing opens), banners
//   mg_nurseryroom the nursery inside: plaster walls under a timber dome, the hearth, the eggs'
//                  mortars, basket beds, a round window, a rug, a toy shelf

import { R, E, T, F, snap } from './pixel.js';
import { ramp, planks, foliage, bark, gable, hash, swing, pivoted, flicker, lean } from './propkit.js';
import { limb } from './figure.js';
import { art, place } from './scenery.js';
import { groundAt } from '../world/physics.js';
import { drawMochiAnim } from './mochi-anim.js';
import { drawHatch } from './mochi-life.js';
import { drawMochiEgg } from './wagashi.js';
import { rollMochi } from '../data/mochi-genes.js';
import { EGG_SLOTS } from '../world/garden-life.js';

const TAU = Math.PI * 2;
const WOOD = '#c8945a';
const WOOD_DK = '#9a6a40';
const STONE = '#ddd4c8';
const MOCHI = '#fbf6ee';
const SAKURA = '#f6a8c0';
const MATCHA = '#9fcf7a';
const KINAKO = '#e8c87a';
const AZUKI = '#9a4a56';
const INK = '#5a3a48';

function glow(ctx, x, y, r, color, alpha) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
function steam(ctx, x, y, time, seed, n = 3, rise = 24) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const u = (time * 0.32 + i / n + seed) % 1;
    ctx.globalAlpha = 0.5 * Math.sin(Math.PI * u);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + Math.sin(time * 0.9 + i * 2) * 2.5 - u * 5, y - u * rise, 2 + u * 4, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
// A paper lantern hanging at (x, y), swinging; `c` its band colour.
function paperLantern(ctx, x, y, time, wx, c, night) {
  pivoted(ctx, x, y, swing(time, wx, 1.2, wx * 0.01), () => {
    ctx.fillStyle = '#7a5a40';
    ctx.fillRect(snap(x - 0.5), snap(y), 1, 5);
    const ly = y + 13;
    ctx.fillStyle = '#fff6ea';
    ctx.beginPath();
    ctx.ellipse(x, ly, 6.5, 8, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = c;
    ctx.fillRect(snap(x - 6), snap(ly - 1.5), 12, 3);
    ctx.strokeStyle = 'rgba(160,120,100,0.45)';
    ctx.lineWidth = 0.6;
    for (const dx of [-3, 0, 3]) {
      ctx.beginPath();
      ctx.ellipse(x + dx * 0.4, ly, Math.abs(dx) + 0.6, 7.6, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = '#5a3a2a';
    ctx.fillRect(snap(x - 3.5), snap(ly - 9), 7, 2);
    ctx.fillRect(snap(x - 3.5), snap(ly + 7.5), 7, 2);
    if (night > 0.15) glow(ctx, x, ly, 22, '#ffd6a0', 0.55 * night * flicker(time, wx));
  });
}

// ---------- The gate ----------
const gateArt = () => art('mg-gate', 124, 134, () => {
  const w = ramp(WOOD);
  const out = [
    R(14, 120, 18, 14, STONE), R(92, 120, 18, 14, STONE),
    R(19, 34, 8, 88, WOOD), R(97, 34, 8, 88, WOOD), F(R(19, 34, 2, 88, w.hi)), F(R(97, 34, 2, 88, w.hi)),
    // The beam, its ends turned up, and the tie beam under it.
    T([[2, 30], [10, 26], [62, 23], [114, 26], [122, 30], [120, 34], [62, 31], [4, 34]], WOOD_DK), F(T([[10, 27], [62, 24], [114, 27], [114, 28.4], [62, 25.6], [10, 28.4]], ramp(WOOD_DK).hi)),
    R(14, 44, 96, 6, WOOD), F(R(14, 44, 96, 1.2, w.hi)),
    // The crossed mallets on top: their handles, and the barrel heads.
    F(limb(42, 6, 76, 22, 2, 2, WOOD_DK)), F(limb(82, 6, 48, 22, 2, 2, WOOD_DK)), E(40, 6, 6.5, 4.2, KINAKO), E(84, 6, 6.5, 4.2, KINAKO),
    F(R(36, 4, 3, 4, ramp(KINAKO).sh)), F(R(85, 4, 3, 4, ramp(KINAKO).sh)),
    // The sign, hung from the tie beam on two cords, with a little mochi on it.
    F(R(46, 50, 1, 6, '#7a5a40')), F(R(77, 50, 1, 6, '#7a5a40')),
    R(38, 56, 48, 28, MOCHI), F(R(38, 56, 48, 2, SAKURA)), F(R(38, 82, 48, 2, SAKURA)),
    E(62, 72, 8, 6.4, '#ffffff'), F(E(58, 74, 1.6, 1, '#ffb8c8')), F(E(66, 74, 1.6, 1, '#ffb8c8')), F(R(58.4, 70, 1.2, 1.6, INK)), F(R(64.4, 70, 1.2, 1.6, INK)),
    F(limb(62, 66, 62.6, 61, 0.7, 0.6, '#5aa04a')), F(E(64.4, 61.4, 2.2, 1.2, MATCHA)), F(E(60.4, 61.8, 2, 1.1, '#86c96e')),
  ];
  return out;
});

// ---------- Lantern posts ----------
const LANTERN_BANDS = [SAKURA, '#a8dcc0', KINAKO, '#c8b4f0', '#ffb8a0', '#9fd0f0'];
const lanternPostArt = (v) => art(`mg-lpost|${v}`, 26, 64, () => {
  const h = 46 + (v % 3) * 3;
  return [R(10, 64 - h, 4, h, WOOD_DK), R(10, 64 - h, 12, 2.6, WOOD_DK), E(12, 62, 6, 2.4, STONE)];
});

// ---------- The egg stall ----------
const eggStallArt = () => art('mg-eggstall', 132, 98, () => {
  const w = ramp('#d8a46a');
  const out = [
    R(16, 22, 5, 70, WOOD_DK), R(111, 22, 5, 70, WOOD_DK),
    ...planks(12, 60, 108, 30, w, 6, 3),
    F(R(12, 60, 108, 3, w.hi)), F(R(12, 87, 108, 3, w.deep)),
    // The eggs on the counter, each in its little mortar.
    ...[[36, '#ffe4ec'], [62, MOCHI], [88, '#dff4e2']].flatMap(([x, c]) => [R(x - 8, 52, 16, 9, WOOD), F(R(x - 8, 52, 16, 1.6, ramp(WOOD).hi)), E(x, 48, 7, 6.4, c), F(E(x - 2.4, 45.4, 2, 1.2, '#ffffff')), F(limb(x, 42, x + 0.4, 39, 0.5, 0.4, '#5aa04a')), F(E(x + 1.8, 39, 1.6, 0.9, MATCHA))]),
    // The sign on the counter's front.
    R(44, 66, 44, 16, '#fff6ea'), F(E(54, 74, 3.4, 4.2, '#ffe4ec')),
  ];
  // The awning: stripes of sakura and cream with a scalloped hem.
  for (let i = 0; i < 9; i++) {
    const x0 = 8 + i * 13;
    out.push(T([[x0, 12], [x0 + 13, 12], [x0 + 13, 28], [x0 + 6.5, 32], [x0, 28]], i % 2 ? '#fff4ea' : SAKURA));
  }
  out.push(R(6, 8, 120, 5, ramp(SAKURA).sh));
  return out;
});

// ---------- The sweet kitchen ----------
const kitchenArt = () => art('mg-kitchen', 152, 124, () => {
  const wall = '#f3dcb4';
  const out = [
    R(14, 50, 124, 70, wall), F(R(14, 50, 124, 3, ramp(wall).hi)),
    // Timber frame.
    R(12, 48, 5, 72, WOOD_DK), R(135, 48, 5, 72, WOOD_DK), F(R(14, 104, 124, 3, WOOD_DK)),
    ...gable(2, 150, 52, 8, '#d0705a', 11),
    // The serving window: the warm dark of the kitchen, a counter, the pot.
    R(24, 64, 56, 32, '#6a4a3a'), F(R(24, 64, 56, 6, '#8a6048')), R(20, 94, 64, 5, WOOD), F(R(20, 94, 64, 1.2, ramp(WOOD).hi)),
    E(44, 92, 11, 6, '#5a5a6a'), F(E(41, 90, 4, 1.6, '#8a8aa0')), R(40, 84, 8, 3, '#4a4a58'), E(64, 92, 6, 4, MOCHI), E(70, 93, 4, 3, '#ffe4ec'),
    // The door (the noren hangs over it, drawn live).
    R(96, 62, 32, 58, '#7a5040'), F(R(98, 64, 2, 54, '#9a6a54')),
    // The chimney.
    R(114, 10, 11, 26, '#b08a78'), F(R(114, 10, 11, 3, '#c8a290')),
    // A sack of rice and a crate of beans by the wall.
    E(146, 114, 7, 7, '#efe6d2'), F(R(143, 106, 6, 2, '#c8b89a')),
  ];
  return out;
});

// ---------- The nursery ----------
const nurseryArt = () => art('mg-nursery', 184, 152, () => {
  const dome = [];
  for (let i = 0; i <= 20; i++) {
    const a = Math.PI + (Math.PI * i) / 20;
    dome.push([92 + Math.cos(a) * 80, 142 + Math.sin(a) * 96]);
  }
  const out = [
    T(dome, MOCHI),
    // Blush on its cheeks, like a mochi.
    F(E(38, 116, 10, 4, '#ffd0da')), F(E(146, 116, 10, 4, '#ffd0da')),
    // The thatch cap and the sprout on top.
    E(92, 52, 30, 12, KINAKO), F(E(84, 48, 14, 4, ramp(KINAKO).hi)), F(R(64, 56, 56, 2, ramp(KINAKO).sh)),
    F(limb(92, 42, 94, 18, 3, 2.4, '#5aa04a')), T([[94, 22], [108, 10], [118, 14], [106, 26]], MATCHA), T([[93, 24], [80, 12], [70, 17], [82, 28]], '#86c96e'),
    // The round door and its frame, a little window in it.
    T([[74, 142], [74, 116], [78, 104], [92, 98], [106, 104], [110, 116], [110, 142]], '#c8845a'), F(R(91, 100, 2, 42, '#a86a44')),
    F(E(92, 114, 4, 4, '#ffe6a8')), F(E(104, 124, 1.6, 1.6, '#ffe6a8')),
    // Round windows with warm light, and flower boxes under them.
    E(42, 96, 11, 11, WOOD), E(42, 96, 8, 8, '#ffe6a8'), F(R(41, 88, 2, 16, WOOD)), F(R(34, 95, 16, 2, WOOD)),
    E(142, 96, 11, 11, WOOD), E(142, 96, 8, 8, '#ffe6a8'), F(R(141, 88, 2, 16, WOOD)), F(R(134, 95, 16, 2, WOOD)),
    R(30, 107, 24, 5, WOOD_DK), R(130, 107, 24, 5, WOOD_DK),
    ...[[33, SAKURA], [38, '#fff0a0'], [44, SAKURA], [50, '#ffffff'], [133, '#c8b4f0'], [139, SAKURA], [145, '#fff0a0'], [151, '#c8b4f0']].map(([x, c]) => F(E(x, 106, 2, 2, c))),
    // The doorstep.
    R(70, 140, 44, 4, STONE),
  ];
  return out;
});

// ---------- Fruit trees ----------
const FRUIT = [
  { name: 'peach', leaf: '#8fcf72', fruit: '#ffb08a', blossom: '#ffd0dc', lean: -3, h: 118 },
  { name: 'persimmon', leaf: '#7fbf62', fruit: '#ff8a3a', blossom: null, lean: 4, h: 128 },
  { name: 'plum', leaf: '#86c46e', fruit: '#b866b0', blossom: '#ffffff', lean: -5, h: 112 },
  { name: 'loquat', leaf: '#74b25c', fruit: '#ffc84a', blossom: null, lean: 3, h: 124 },
];
const fruitTreeArt = (v) => art(`mg-ftree|${v}`, 120, 150, () => {
  const f = FRUIT[v % FRUIT.length];
  const top = 150 - f.h;
  const trunk = [[60, 150], [59, 120], [60 + f.lean * 0.5, 96], [60 + f.lean, top + 40]];
  const out = [...bark(trunk, (u) => 10 - u * 4, ramp('#a87850'), v * 3.1, 2)];
  // A bough or two off the trunk.
  out.push(...bark([[60 + f.lean * 0.6, top + 58], [60 + f.lean * 0.6 - 22, top + 40]], (u) => 4 - u * 2, ramp('#a87850'), v + 5, 1));
  out.push(...bark([[60 + f.lean * 0.8, top + 50], [60 + f.lean + 20, top + 34]], (u) => 3.6 - u * 1.8, ramp('#a87850'), v + 9, 1));
  const r = ramp(f.leaf);
  const clumps = [[60 + f.lean, top + 26, 40, 26], [36 + f.lean, top + 40, 24, 18], [86 + f.lean, top + 38, 26, 19]];
  if (v % 2) clumps.push([62 + f.lean, top + 8, 24, 16]);
  for (const [i, [cx, cy, rx, ry]] of clumps.entries()) out.push(...foliage(cx, cy, rx, ry, r, v * 7 + i * 2.3));
  // Fruit hanging among the leaves (and a few blossoms), placed by the tree's own seed.
  for (let i = 0; i < 9; i++) {
    const [cx, cy, rx, ry] = clumps[i % clumps.length];
    const fx = cx + (hash(v * 31 + i * 3.7) - 0.5) * rx * 1.4;
    const fy = cy + (hash(v * 17 + i * 5.3) - 0.2) * ry * 0.9;
    out.push(F(E(fx, fy, 2.6, 2.8, f.fruit)), F(E(fx - 0.8, fy - 0.9, 0.8, 0.7, '#ffffff')));
    if (f.blossom && i % 3 === 0) out.push(F(E(fx + 4, fy - 6, 1.6, 1.6, f.blossom)));
  }
  return out;
});

// ---------- The big old tree ----------
const bigTreeArt = () => art('mg-bigtree', 260, 236, () => {
  const r = ramp('#9a6e48');
  const out = [
    // Roots spreading over the rise, and the great trunk.
    ...bark([[90, 236], [108, 226], [118, 214]], (u) => 8 - u * 4, r, 1, 1), ...bark([[168, 236], [150, 226], [140, 214]], (u) => 8 - u * 4, r, 2, 1),
    ...bark([[128, 236], [126, 196], [130, 150], [126, 110]], (u) => 26 - u * 10, r, 3, 3),
    // The long bough out to the right that the swing hangs from, and one up to the left.
    ...bark([[132, 128], [170, 112], [214, 108], [236, 110]], (u) => 9 - u * 5, r, 4, 2),
    ...bark([[124, 122], [92, 96], [70, 84]], (u) => 8 - u * 4, r, 5, 1),
  ];
  const leaf = ramp('#7cbf64');
  for (const [i, [cx, cy, rx, ry]] of [[128, 64, 74, 48], [70, 82, 42, 30], [190, 80, 46, 32], [130, 28, 46, 26], [222, 100, 26, 16]].entries()) out.push(...foliage(cx, cy, rx, ry, leaf, 11 + i * 3.1, { tips: 5 }));
  // A hollow in the trunk, and moss.
  out.push(E(122, 176, 6, 9, '#5a3a2a'), F(E(121, 174, 3, 5, '#3a2a20')), F(E(132, 206, 10, 3, '#8fcf72')));
  return out;
});

// ---------- The pond ----------
function lilies(ctx, x, waterY, time, wx, v) {
  const pads = v ? [[-30, 10, 3], [-6, 8, 2.4], [18, 11, 3.2], [40, 7, 2]] : [[-36, 9, 2.6], [-10, 12, 3.2], [16, 8, 2.4], [34, 10, 3]];
  pads.forEach(([dx, rx, ry], i) => {
    const bob = Math.sin(time * 0.9 + wx * 0.01 + i * 1.7) * 0.6;
    const px = x + dx;
    const py = waterY + 0.6 + bob;
    ctx.fillStyle = '#5f9a4e';
    ctx.beginPath();
    ctx.ellipse(px + 0.4, py + 0.6, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#7cc06a';
    ctx.beginPath();
    ctx.ellipse(px, py, rx, ry, 0, 0.35, TAU - 0.05);
    ctx.lineTo(px, py);
    ctx.fill();
    ctx.fillStyle = '#a8dc88';
    ctx.fillRect(snap(px - rx * 0.5), snap(py - ry * 0.5), rx * 0.6, 0.8);
  });
  // A lotus on one pad, opening and closing very slowly.
  const [lx] = pads[1];
  const ly = waterY - 1 + Math.sin(time * 0.9 + wx * 0.01 + 1.7) * 0.6;
  const open = 0.85 + 0.15 * Math.sin(time * 0.3 + wx);
  for (let k = -2; k <= 2; k++) {
    ctx.fillStyle = k === 0 ? '#ffd8e4' : '#ffb8cc';
    ctx.beginPath();
    ctx.ellipse(x + lx + k * 2.4 * open, ly - 3 - (2 - Math.abs(k)) * 1.2, 1.6, 3.6, k * 0.35 * open, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#ffe36b';
  ctx.fillRect(snap(x + lx - 1), snap(ly - 4), 2, 1.4);
}
function reeds(ctx, x, gy, time, wx, v) {
  const n = v ? 6 : 5;
  for (let i = 0; i < n; i++) {
    const h = 26 + ((i * 7 + v * 3) % 5) * 4;
    const bx = x - 10 + i * 4.4;
    const a = (lean(time, wx + i * 9, 0.1 * i, i) + 0.45) * 0.12 + (i - n / 2) * 0.04;
    const tx = bx + Math.sin(a) * h;
    const ty = gy - Math.cos(a) * h;
    ctx.strokeStyle = i % 2 ? '#6fae52' : '#5f9a44';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bx, gy);
    ctx.quadraticCurveTo(bx + Math.sin(a) * h * 0.4, gy - h * 0.6, tx, ty);
    ctx.stroke();
    if (i % 2 === 0) {
      ctx.fillStyle = '#8a5a3a';
      ctx.beginPath();
      ctx.ellipse(tx - Math.sin(a) * 4, ty + Math.cos(a) * 4, 1.6, 4.2, a, 0, TAU);
      ctx.fill();
    }
  }
}

// ---------- The waterfall, the basin, the bamboo spout ----------
function falls(ctx, map, x, cam, time) {
  const top = 380 - cam.y;
  const ledge = 560 - cam.y;
  const pond = 760 - cam.y;
  // The fall down the upper face: a sheet of water with streaks pouring down it.
  ctx.save();
  ctx.fillStyle = '#9fd4f0';
  ctx.fillRect(x - 16, top, 16, ledge - top - 6);
  ctx.fillStyle = '#6fb8e0';
  ctx.fillRect(x - 4, top, 4, ledge - top - 6);
  ctx.fillStyle = '#c8ecfa';
  ctx.fillRect(x - 16, top, 3, ledge - top - 6);
  for (let i = 0; i < 9; i++) {
    const u = (time * 0.9 + i / 9) % 1;
    const sx = x - 14 + ((i * 5) % 12);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(snap(sx), snap(top + u * (ledge - top - 22)), 1.4, 14);
  }
  // Foam where it spills over the lip.
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(x - 14 + i * 4.4, top + 1 + Math.sin(time * 5 + i) * 0.6, 2.6, 1.6, 0, 0, TAU);
    ctx.fill();
  }
  // Spray where it lands, in the basin.
  for (let i = 0; i < 4; i++) {
    const u = (time * 1.4 + i / 4) % 1;
    ctx.globalAlpha = 0.7 * (1 - u);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - 7 + (i - 1.5) * 4 * u * 2, ledge - 8 - u * 8, 2 + u * 3, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  // The rock basin on the ledge, brimming.
  place(ctx, basinArt(), snap(x - 22), ledge + 1);
  ctx.fillStyle = 'rgba(150,206,236,0.95)';
  ctx.fillRect(snap(x - 38), snap(ledge - 10), 30, 3);
  // The bamboo spout from the basin out over the pond, the water pouring from its end.
  const sx0 = x - 40;
  const sx1 = x - 178;
  const sy0 = ledge - 6;
  const sy1 = ledge + 12;
  place(ctx, spoutArt(), snap((sx0 + sx1) / 2), sy1 + 6);
  const fx = sx1 - 2;
  ctx.fillStyle = '#9fd4f0';
  ctx.beginPath();
  ctx.moveTo(fx, sy1);
  ctx.quadraticCurveTo(fx - 8, sy1 + 30, fx - 9, pond);
  ctx.lineTo(fx - 5, pond);
  ctx.quadraticCurveTo(fx - 4, sy1 + 28, fx + 3, sy1);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    const u = (time * 1.6 + i / 3) % 1;
    ctx.globalAlpha = 0.6 * (1 - u);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(fx - 7, pond - 1, 2 + u * 7, 1 + u * 1.6, 0, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  void sy0;
}
const basinArt = () => art('mg-basin', 44, 16, () => [E(22, 9, 21, 7, '#b8ae9e'), E(22, 7, 16, 4, '#8fc8e6'), F(E(16, 6, 6, 1.4, '#d6eefa')), F(E(30, 13, 8, 1.6, '#9fcf7a'))]);
const spoutArt = () => art('mg-spout', 150, 30, () => {
  const g = ramp('#a8c870');
  return [
    // The bamboo pipe, jointed, sloping down to its cut end over the pond; its prop post.
    F(limb(148, 4, 4, 22, 3.6, 3.4, g.base)), F(limb(148, 3, 4, 21, 1, 0.9, g.hi)),
    ...[30, 66, 102, 132].map((x) => F(R(x, 6 + (148 - x) * 0.125 - 2, 2, 5, g.deep))),
    F(limb(40, 18, 44, 30, 2.2, 2.4, WOOD_DK)), F(limb(36, 20, 48, 20, 1.6, 1.6, WOOD_DK)),
  ];
});

// ---------- The cliff faces ----------
// What grows on a cliff face, `h` tall (the soil face is the map's own): mossy stones set into it,
// ferns and flowers in its nooks, a little way in from the face, never in a row.
const faceArt = (h, seed) => art(`mg-face|${h}|${seed}`, 60, h, () => {
  const out = [];
  for (let i = 0, y = 14; y < h - 10; i++, y += 26 + hash(seed * 7 + i * 3.1) * 30) {
    const x = 8 + hash(seed * 11 + i * 2.3) * 34;
    const r = 5 + hash(seed * 5 + i) * 6;
    if (i % 3 !== 2) {
      out.push(E(x, y, r * 1.3, r, ['#cfc4b2', '#d8ccbc', '#c4b8a6'][i % 3]), F(E(x - r * 0.3, y - r * 0.8, r * 0.9, r * 0.32, '#9fcf7a')));
    } else {
      // A fern clump, a flower or two.
      for (let k = -2; k <= 2; k++) out.push(F(limb(x, y + 4, x + k * 4, y - 6 + Math.abs(k) * 2, 1.2, 0.5, k % 2 ? '#7cbf64' : '#8fcf72')));
      out.push(F(E(x + 6, y - 2, 1.6, 1.6, ['#ffd0dc', '#fff0a0', '#ffffff'][i % 3])));
    }
  }
  return out;
});
function vines(ctx, x, y, time, wx, n, len) {
  for (let i = 0; i < n; i++) {
    const vx = x + 6 + i * 9;
    const l = len * (0.6 + 0.4 * hash(wx + i * 3.7));
    const a = (lean(time, wx + i * 11, 0.2 * i, i) + 0.45) * 0.08;
    ctx.strokeStyle = i % 2 ? '#6fae52' : '#5f9a44';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(vx, y);
    ctx.quadraticCurveTo(vx + Math.sin(a) * l * 0.6, y + l * 0.6, vx + Math.sin(a) * l, y + l);
    ctx.stroke();
    ctx.fillStyle = '#8fcf72';
    for (let k = 1; k < 4; k++) {
      const t = k / 4;
      ctx.beginPath();
      ctx.ellipse(vx + Math.sin(a) * l * t + (k % 2 ? 2 : -2), y + l * t, 2, 1.2, k % 2 ? 0.5 : -0.5, 0, TAU);
      ctx.fill();
    }
  }
}

// ---------- The cliff top ----------
const bouldersArt = () => art('mg-boulders', 70, 60, () => {
  const r = ramp('#b8ae9e');
  return [
    E(24, 46, 22, 14, '#b8ae9e'), E(50, 50, 16, 10, '#c4baa8'), E(34, 24, 16, 13, '#aea392'),
    F(E(16, 40, 9, 3, '#9fcf7a')), F(E(30, 14, 7, 2.4, '#9fcf7a')), F(E(54, 44, 6, 2, '#9fcf7a')),
    // Handholds, and a knotted rope down the face.
    ...[[20, 50], [30, 38], [40, 28], [28, 22]].map(([x, y]) => F(E(x, y, 1.6, 1, r.deep))),
    F(limb(38, 12, 46, 58, 1, 1, '#d8b47a')), ...[24, 36, 48].map((y) => F(E(38 + (y - 12) * 0.17, y, 1.4, 1.4, '#c89a5a'))),
  ];
});
function windsock(ctx, x, gy, time, wx) {
  ctx.fillStyle = WOOD_DK;
  ctx.fillRect(snap(x - 1), snap(gy - 54), 2, 54);
  // The sock, filling and falling with the wind, in stripes.
  const w = 0.5 + 0.5 * (lean(time, wx) + 0.6);
  const n = 4;
  for (let i = 0; i < n; i++) {
    const a0 = -0.15 + (1 - w) * 0.9 * (i / n);
    const sx = x + 2 + i * 6 * Math.cos(a0);
    const sy = gy - 52 + i * 6 * Math.sin(a0) + (1 - w) * i * 2;
    ctx.fillStyle = i % 2 ? '#ffffff' : SAKURA;
    ctx.beginPath();
    ctx.ellipse(sx + 3, sy, 3.4, 3.4 - i * 0.5, a0, 0, TAU);
    ctx.fill();
  }
  // The sign: a little wing.
  ctx.fillStyle = '#fff6ea';
  ctx.fillRect(snap(x + 6), snap(gy - 26), 22, 13);
  ctx.strokeStyle = WOOD_DK;
  ctx.lineWidth = 1;
  ctx.strokeRect(snap(x + 6), snap(gy - 26), 22, 13);
  ctx.fillStyle = '#9fb8e8';
  ctx.beginPath();
  ctx.ellipse(x + 17, gy - 19.5, 6, 3, -0.3, 0, TAU);
  ctx.fill();
  ctx.fillStyle = WOOD_DK;
  ctx.fillRect(snap(x + 16), snap(gy - 13), 2, 13);
}
const moonmortarArt = () => art('mg-moonmortar', 210, 176, () => {
  const s = ramp('#cfc6b8');
  const bowl = [[30, 92], [180, 92], [172, 128], [160, 150], [150, 172], [60, 172], [50, 150], [38, 128]];
  return [
    // The base stone, the mortar itself, its hollow and lip, the carved band and crescent.
    R(40, 164, 130, 12, '#b8ae9e'),
    T(bowl, '#d6cebe'), F(T([[150, 92], [180, 92], [172, 128], [160, 150], [150, 172], [138, 172], [150, 130]], s.sh)),
    E(105, 92, 75, 14, '#cfc6b8'), E(105, 92, 62, 10, '#8a7e70'), F(E(98, 90, 40, 5, '#a89a8a')), F(E(80, 88, 16, 3, '#fbf6ee')),
    F(R(44, 118, 122, 3, s.deep)), F(R(48, 142, 114, 2, s.deep)),
    F(T([[95, 126], [104, 120], [100, 132], [104, 140], [95, 136], [92, 130]], '#fff4c8')),
    // The great wooden mallet leaning on it.
    F(limb(182, 168, 150, 40, 5, 5, WOOD_DK)), F(limb(182, 168, 150, 40, 1.6, 1.6, ramp(WOOD_DK).hi)),
    T([[132, 34], [150, 20], [172, 44], [154, 58]], KINAKO), F(T([[150, 20], [172, 44], [168, 48], [148, 25]], ramp(KINAKO).sh)),
    // The sacred rope round it, and its paper streamers.
    F(limb(36, 104, 174, 104, 4, 4, '#e8d8a8')), ...[52, 74, 96, 118, 140, 162].map((x) => F(R(x, 106, 2, 4, '#c8b888'))),
    ...[60, 104, 148].flatMap((x) => [F(T([[x, 108], [x + 6, 108], [x + 3, 116], [x + 7, 116], [x + 2, 126], [x + 3, 117], [x - 1, 117]], '#ffffff'))]),
  ];
});
const stadiumArt = () => art('mg-stadium', 184, 160, () => {
  const out = [
    R(14, 40, 22, 120, '#e8d8c0'), R(148, 40, 22, 120, '#e8d8c0'), F(R(14, 40, 4, 120, '#fff4e4')), F(R(148, 40, 4, 120, '#fff4e4')),
    T([[4, 40], [92, 10], [180, 40], [172, 46], [92, 20], [12, 46]], '#d0705a'), F(T([[92, 10], [180, 40], [172, 46], [92, 20]], ramp('#d0705a').sh)),
    R(30, 46, 124, 10, WOOD), F(R(30, 46, 124, 2, ramp(WOOD).hi)),
    // The closed lattice doors, and the plaque with a racing mochi on it.
    R(36, 60, 112, 100, '#a87850'), ...[48, 62, 76, 90, 104, 118, 132].map((x) => F(R(x, 60, 2, 100, '#7a5438'))), ...[80, 104, 128].map((y) => F(R(36, y, 112, 2, '#7a5438'))),
    F(R(91, 60, 2, 100, '#5a3a28')),
    R(66, 22, 52, 18, '#fff6ea'), F(E(84, 31, 5, 4, '#ffffff')), F(R(78, 30, 4, 1, '#9fd0f0')), F(R(76, 33, 5, 1, '#9fd0f0')), F(R(96, 28, 14, 2, SAKURA)), F(R(96, 32, 10, 2, SAKURA)),
  ];
  return out;
});

// ---------- The nursery inside ----------
const nurseryRoomArt = () => art('mg-nurseryroom', 760, 400, () => {
  const wall = '#fbefe4';
  const wr = ramp(wall);
  const out = [
    R(0, 0, 760, 400, wall), F(R(0, 0, 760, 30, wr.sh)),
    // Timber ribs of the dome, curving up the walls, and the wainscot.
    ...[90, 250, 510, 670].map((x) => F(T([[x - 4, 360], [x + 4, 360], [x + 4 + (x < 380 ? 40 : -40), 0], [x - 4 + (x < 380 ? 40 : -40), 0]], '#d8b088'))),
    F(R(0, 300, 760, 60, '#e8c8a8')), F(R(0, 300, 760, 3, '#f8dcc0')),
    // The round window onto the garden.
    E(380, 150, 62, 62, WOOD), E(380, 150, 54, 54, '#cfe8ff'), F(E(366, 136, 30, 26, '#e6f4ff')), F(R(378, 96, 4, 108, WOOD)), F(R(326, 148, 108, 4, WOOD)),
    F(E(352, 196, 18, 6, '#9fcf7a')), F(E(410, 194, 22, 7, '#8fc46a')), F(E(392, 120, 8, 6, '#ffd0dc')),
    // The hearth: stone, a fire glow, a kettle; and the eggs' mortars warming beside it.
    R(150, 214, 120, 146, '#cfc6b8'), F(R(150, 214, 120, 8, '#e0d8ca')), R(176, 280, 68, 80, '#5a4038'), F(E(210, 346, 24, 10, '#ff9a5a')), F(E(210, 342, 14, 6, '#ffd27a')),
    R(140, 206, 140, 10, WOOD), F(R(140, 206, 140, 2, ramp(WOOD).hi)),
    // The rug.
    E(380, 362, 150, 14, '#f6c0cc'), F(E(380, 362, 132, 10, '#ffd8e0')), F(E(380, 362, 112, 7, '#f6c0cc')),
    // Basket beds, each with its little blanket, along the right.
    ...[[560, '#c8e6f8'], [630, '#ffe4ec'], [700, '#e2f4d8']].flatMap(([x, c]) => [E(x, 352, 28, 10, '#d8a86a'), E(x, 346, 24, 6, c), F(E(x - 8, 344, 8, 3, '#ffffff')), F(R(x - 26, 352, 52, 2, '#b88850'))]),
    // The toy shelf (its ledge is a platform): a ball, a little drum, blocks.
    R(520, 262, 150, 8, WOOD), F(R(520, 262, 150, 2, ramp(WOOD).hi)),
    E(546, 252, 8, 8, '#ff9ab0'), F(E(543, 249, 3, 2, '#ffffff')), R(572, 246, 14, 14, '#9fc8f0'), F(E(579, 246, 7, 2, '#cfe6ff')), R(600, 250, 10, 10, KINAKO), R(612, 252, 8, 8, MATCHA), R(606, 242, 8, 8, SAKURA),
  ];
  return out;
});
const emptyMortarArt = () => art('mg-emptymortar', 40, 20, () => [R(6, 6, 28, 13, WOOD), F(R(6, 6, 28, 2, ramp(WOOD).hi)), E(20, 7, 12, 2.6, '#7a5438')]);

// ---------- The garden's life ----------
// The eggs waiting by the gate (each rolled from its seed, so it looks like what's inside), an egg
// hatching, and your Mochi wherever they are (world/garden-life.js).
// (In the world the eggs sit bigger than on the preview pages: knee-high to you.)
const GARDEN_EGG = 1;
const eggGenes = new Map();
const genesOf = (seed) => {
  if (!eggGenes.has(seed)) eggGenes.set(seed, rollMochi(seed));
  return eggGenes.get(seed);
};
export function drawGardenLife(ctx, world, cam, time, layer = 'back') {
  const life = world.gardenLife;
  const map = world.map;
  const h = life.hatching;
  if (layer === 'front') {
    if (h && !map.indoor) drawHatch(ctx, h.m, h.x - cam.x, groundAt(map, h.x) - cam.y, time);
    return;
  }
  if (!map.indoor) {
    (life.owner?.garden?.eggs ?? []).forEach((egg, i) => {
      if (life.hatching?.egg === egg) return;
      const ex = EGG_SLOTS[i];
      if (ex == null) return;
      drawMochiEgg(ctx, ex - cam.x, groundAt(map, ex) - cam.y, genesOf(egg.seed), time, GARDEN_EGG);
    });
  }
  for (const e of life.mochi) {
    if (e.hidden || e.x == null) continue;
    drawMochiAnim(ctx, e.m, e.x - cam.x, e.y - cam.y, time);
  }
}

// ---------- Drawing ----------
export function drawGardenPiece(ctx, map, kind, wx, extra, cam, width, time) {
  if (!map.garden || !kind.startsWith('mg_')) return false;
  const x = wx - cam.x;
  if (x < -280 && kind !== 'mg_falls') return true;
  if (x > width + 280 && kind !== 'mg_falls') return true;
  const gy = groundAt(map, wx) - cam.y;
  const night = map.night ?? 0;
  switch (kind) {
    case 'mg_gate': {
      place(ctx, gateArt(), snap(x), gy + 2);
      paperLantern(ctx, x - 52, gy - 102, time, wx - 52, SAKURA, night);
      paperLantern(ctx, x + 52, gy - 102, time, wx + 52, SAKURA, night);
      return true;
    }
    case 'mg_lantern': {
      const v = extra ?? 0;
      place(ctx, lanternPostArt(v), snap(x), gy + 2);
      const h = 46 + (v % 3) * 3;
      paperLantern(ctx, x + 8, gy + 2 - h + 1, time, wx, LANTERN_BANDS[v % LANTERN_BANDS.length], night);
      return true;
    }
    case 'mg_eggstall': {
      place(ctx, eggStallArt(), snap(x), gy + 2);
      ctx.fillStyle = AZUKI;
      ctx.font = '800 7px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EGGS', snap(x + 6), snap(gy - 21));
      return true;
    }
    case 'mg_kitchen': {
      place(ctx, kitchenArt(), snap(x), gy + 2);
      steam(ctx, x - 32, gy - 36, time, wx * 0.01, 3, 20);
      steam(ctx, x + 43, gy - 116, time * 0.8, wx * 0.02 + 0.5, 3, 30);
      // The noren over the door: three panels of indigo, each with a white mochi crest, stirring.
      const nx = x + 36;
      const ny = gy - 58;
      for (let i = 0; i < 3; i++) {
        pivoted(ctx, nx - 10 + i * 10, ny, swing(time, wx + i * 13, 0.7, i), () => {
          ctx.fillStyle = '#4a5aa0';
          ctx.fillRect(snap(nx - 15 + i * 10), snap(ny), 9.4, 22);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(nx - 10.3 + i * 10, ny + 12, i === 1 ? 2.6 : 1.4, 0, TAU);
          ctx.fill();
        });
      }
      ctx.fillStyle = WOOD_DK;
      ctx.fillRect(snap(nx - 17), snap(ny - 2), 34, 2);
      if (night > 0.2) glow(ctx, x - 24, gy - 46, 30, '#ffd27a', 0.5 * night * flicker(time, wx));
      return true;
    }
    case 'mg_nursery': {
      place(ctx, nurseryArt(), snap(x), gy + 2);
      if (night > 0.2) {
        glow(ctx, x - 50, gy - 56, 18, '#ffe08a', 0.55 * night);
        glow(ctx, x + 50, gy - 56, 18, '#ffe08a', 0.55 * night);
      }
      return true;
    }
    case 'mg_track': {
      // Start and finish posts with pennants; chalk lines across the path.
      for (const [px, c] of [[wx, '#ffffff'], [extra?.to ?? wx + 300, SAKURA]]) {
        const sx = px - cam.x;
        const sg = groundAt(map, px) - cam.y;
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(snap(sx - 1), snap(sg - 1), 3, 2);
        for (let k = 0; k < 4; k++) ctx.fillRect(snap(sx - 16 + k * 8), snap(sg - 0.6), 5, 1.2);
        ctx.fillStyle = WOOD_DK;
        ctx.fillRect(snap(sx + 12), snap(sg - 40), 2, 40);
        const flap = Math.sin(time * 3 + px * 0.01) * 2;
        ctx.fillStyle = c === '#ffffff' ? '#9fd0f0' : c;
        ctx.beginPath();
        ctx.moveTo(sx + 14, sg - 40);
        ctx.lineTo(sx + 26, sg - 36 + flap * 0.5);
        ctx.lineTo(sx + 14, sg - 31);
        ctx.fill();
      }
      return true;
    }
    case 'mg_fruittree': {
      // (A breath of wind through the canopy.)
      const a = (lean(time, wx) + 0.45) * 0.02;
      pivoted(ctx, x, gy - 40, a, () => place(ctx, fruitTreeArt(extra ?? 0), snap(x), gy + 3));
      return true;
    }
    case 'mg_bigtree': {
      place(ctx, bigTreeArt(), snap(x), gy + 4);
      // The swing on its ropes, swaying.
      const bx = x + 80;
      const by = gy - 126;
      pivoted(ctx, bx, by, Math.sin(time * 1.3 + wx * 0.01) * 0.12, () => {
        ctx.strokeStyle = '#d8b47a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx - 10, by);
        ctx.lineTo(bx - 10, by + 96);
        ctx.moveTo(bx + 10, by);
        ctx.lineTo(bx + 10, by + 96);
        ctx.stroke();
        ctx.fillStyle = WOOD;
        ctx.fillRect(snap(bx - 14), snap(by + 96), 28, 4);
        ctx.fillStyle = ramp(WOOD).hi;
        ctx.fillRect(snap(bx - 14), snap(by + 96), 28, 1);
      });
      paperLantern(ctx, x - 52, gy - 132, time, wx - 52, '#ffb8a0', night);
      return true;
    }
    case 'mg_lilies': {
      const wy = (map.water?.[0]?.y ?? gy) - cam.y;
      lilies(ctx, x, wy, time, wx, extra ?? 0);
      return true;
    }
    case 'mg_reeds': {
      reeds(ctx, x, (map.water?.[0]?.y ?? gy + cam.y) - cam.y + 2, time, wx, extra ?? 0);
      return true;
    }
    case 'mg_falls':
      falls(ctx, map, x, cam, time);
      return true;
    case 'mg_cliffface': {
      // What grows on a cliff face from `extra.top` down to `extra.bottom`, vines from its lip.
      const top = extra.top - cam.y;
      place(ctx, faceArt(extra.bottom - extra.top, extra.seed ?? 1), snap(x + 30), extra.bottom - cam.y);
      vines(ctx, x, top, time, wx, extra.vines ?? 3, 46);
      return true;
    }
    case 'mg_boulders':
      place(ctx, bouldersArt(), snap(x), gy + 2);
      return true;
    case 'mg_glide':
      windsock(ctx, x, gy, time, wx);
      return true;
    case 'mg_moonmortar': {
      place(ctx, moonmortarArt(), snap(x), gy + 2);
      // Streamers stirring, and at night a soft moonlit glow in the mortar.
      if (night > 0.1) glow(ctx, x, gy - 86, 46, '#fff4c8', 0.4 * night);
      return true;
    }
    case 'mg_stadium':
      place(ctx, stadiumArt(), snap(x), gy + 2);
      return true;
    case 'mg_nurseryroom': {
      place(ctx, nurseryRoomArt(), snap(x), gy + 40);
      // The fire in the hearth, flickering; the two eggs warming by it.
      glow(ctx, x - 170, gy - 30, 46, '#ffb070', 0.45 * flicker(time, 3));
      place(ctx, emptyMortarArt(), snap(x - 260), gy + 2);
      place(ctx, emptyMortarArt(), snap(x - 90), gy + 2);
      return true;
    }
    default:
      return true;
  }
}
