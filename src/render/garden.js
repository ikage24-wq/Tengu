// The Mochi Garden's pieces (world/garden.js townPieces: `mg_*`), and the nursery's room inside.
// Moonmortar Garden: soft wagashi colours (mochi white, sakura pink, matcha, kinako gold, azuki),
// warm wood and pale stone, drawn like the rest of the scenery: outlined pastel shapes lit from the
// upper left. Everything has a little life of its own (lanterns swinging, steam from the kitchen,
// the noren curtain stirring, the swing on the big tree, lily pads bobbing, the waterfall pouring,
// the windsock), phased by its place in the world, never the screen.
//
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
//   mg_rockface    a cliff faced with rock: warm garden stone stacked up the face, rough and mossed,
//                  a few stones set into the soil behind (flip: the land to the left); the race
//                  courses use it too, and their climbing crags are the same stone (cragArt)
//   mg_boulders    the climbing rocks on the ledge, mossy, with a knotted rope
//   mg_glide       the windsock on the cliff top by the glide launch, and its sign
//   mg_moonmortar  the Moonmortar: a great stone mortar with its wooden mallet, a sacred rope and
//                  paper streamers round it, a crescent carved in its side, softly lit at night
//   mg_stadium     the stadium gate at the top of the cliff, its doors open onto the Race Stadium
//   mg_nurseryroom the nursery inside: plaster walls under a timber dome, the hearth, the eggs'
//                  mortars, basket beds, a round window, a rug, a toy shelf

import { R, E, T, F, snap } from './pixel.js';
import { ramp, planks, foliage, bark, gable, hash, swing, pivoted, flicker, lean } from './propkit.js';
import { limb } from './figure.js';
import { art, place, BEHIND_GROUND } from './scenery.js';
import { groundAt } from '../world/physics.js';
import { drawMochiAnim } from './mochi-anim.js';
import { drawHatch, drawEvolve, drawRebirth } from './mochi-life.js';
import { drawMochiEgg } from './wagashi.js';
import { rollMochi } from '../data/mochi-genes.js';
import { EGG_SLOTS, NURSERY_BEDS, cropGrowth } from '../world/garden-life.js';

const TAU = Math.PI * 2;
const WOOD = '#c8945a';
const WOOD_DK = '#9a6a40';
const STONE = '#ddd4c8';
const MOCHI = '#fbf6ee';
const SAKURA = '#f6a8c0';
const MATCHA = '#9fcf7a';
const KINAKO = '#e8c87a';
const AZUKI = '#9a4a56';

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
// (Its frame ends at the dome's foot, so the dome stands on the ground, a soft shadow at its foot.)
const nurseryArt = () => art('mg-nursery', 184, 144, () => {
  const dome = [];
  for (let i = 0; i <= 20; i++) {
    const a = Math.PI + (Math.PI * i) / 20;
    dome.push([92 + Math.cos(a) * 80, 142 + Math.sin(a) * 96]);
  }
  const out = [
    F(E(92, 142.5, 86, 2, '#c9b8a8')),
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

// ---------- The crop bed ----------
// A raised bed in the orchard (world/garden-life.js harvestCrops): mochi rice, red beans, soy (for
// kinako) and fire peppers, from seedlings (stage 0) to ripe (3) between pickings.
const cropBedArt = () => art('mg-cropbed', 104, 20, () => {
  const w = ramp('#c89a64');
  return [E(52, 9, 48, 4.6, '#6e4a30'), ...planks(4, 9, 96, 10, w, 4, 5), F(R(4, 9, 96, 2, w.hi)), F(R(4, 17, 96, 2, w.deep)), F(E(52, 9.4, 45, 2.4, '#8a6040'))];
});
const RICE = ['#9fd07a', '#8cc45a', '#c8cf6a', '#ecc65e'];
function sprouts(cx, base, c) {
  return [-5, 0, 5].flatMap((dx, i) => [F(limb(cx + dx, base, cx + dx, base - 3 - (i % 2), 0.45, 0.35, c)), F(E(cx + dx - 1.2, base - 3.4 - (i % 2), 1.3, 0.7, c)), F(E(cx + dx + 1.2, base - 3.6 - (i % 2), 1.3, 0.7, c))]);
}
const cropsArt = (stage) => art(`mg-crops|${stage}`, 104, 42, () => {
  const base = 42;
  const out = [];
  if (stage === 0) {
    for (const cx of [16, 40, 64, 88]) out.push(...sprouts(cx, base, cx === 16 ? RICE[0] : '#7fbf62'));
    return out;
  }
  // Mochi rice: a clump of stalks, gold and drooping with grain when ripe.
  const rh = [0, 13, 21, 24][stage];
  for (let i = 0; i < 6; i++) {
    const bx = 9 + i * 2.8;
    const tip = bx + (i - 2.5) * 0.9 + (stage === 3 ? 2.4 : 0);
    const top = base - rh + (i % 2) * 2;
    out.push(F(limb(bx, base, tip, top, 0.55, 0.35, i % 2 ? RICE[stage] : ramp(RICE[stage]).sh)));
    if (stage >= 2) for (let k = 0; k < 4; k++) out.push(F(E(tip + k * (stage === 3 ? 0.9 : 0.3), top + 1 + k * 1.7, 0.9, 1.2, stage === 3 ? '#f6dc8a' : '#c6d888')));
  }
  out.push(F(limb(12, base, 6, base - rh * 0.5, 0.5, 0.3, '#7fb850')), F(limb(22, base, 27, base - rh * 0.45, 0.5, 0.3, '#7fb850')));
  // Red beans and soy: low leafy bushes; flowers, then pods.
  for (const [cx, leaf, flower, pod] of [[40, '#6fae4a', '#ffe36b', '#7a2434'], [64, '#8cc45a', '#c8a8f0', '#d9c27a']]) {
    const h = [0, 9, 13, 14][stage];
    out.push(...foliage(cx, base - h * 0.55, 8 + stage * 1.6, h * 0.55, ramp(leaf), cx * 0.37 + stage));
    if (stage === 2) for (const [dx, dy] of [[-5, -8], [3, -10], [7, -4], [-1, -4]]) out.push(F(E(cx + dx, base + dy, 1.1, 1.1, flower)));
    if (stage === 3) for (const [dx, dy] of [[-7, -6], [-3, -9], [2, -5], [6, -8], [9, -3]]) out.push(F(limb(cx + dx, base + dy, cx + dx + 1, base + dy + 3.4, 0.9, 0.7, pod)));
  }
  // Fire peppers: a little bush on a stem, white flowers, then red peppers hanging.
  const ph = [0, 12, 17, 18][stage];
  out.push(F(limb(88, base, 88, base - ph * 0.6, 0.7, 0.5, '#5a8a3a')));
  out.push(...foliage(88, base - ph * 0.7, 6 + stage * 1.2, ph * 0.35, ramp('#5f9e48'), 4.1 + stage));
  if (stage === 2) for (const [dx, dy] of [[-4, -13], [3, -15], [5, -10]]) out.push(F(E(88 + dx, base + dy, 1.1, 1.1, '#ffffff')));
  if (stage === 3) for (const [dx, dy] of [[-5, -10], [-1, -8], [3, -11], [6, -7]]) out.push(F(limb(88 + dx, base + dy, 88 + dx - 0.6, base + dy + 5, 1.1, 0.4, '#e8483a')));
  return out;
});

// ---------- Fruit trees ----------
const FRUIT = [
  { name: 'peach', leaf: '#8fcf72', fruit: '#ffb08a', blossom: '#ffd0dc', lean: -3, h: 118 },
  { name: 'persimmon', leaf: '#7fbf62', fruit: '#ff8a3a', blossom: null, lean: 4, h: 128 },
  { name: 'plum', leaf: '#86c46e', fruit: '#b866b0', blossom: '#ffffff', lean: -5, h: 112 },
  { name: 'loquat', leaf: '#74b25c', fruit: '#ffc84a', blossom: null, lean: 3, h: 124 },
];
const fruitTreeArt = (v) => art(`mg-ftree3|${v}`, 120, 150, () => {
  const f = FRUIT[v % FRUIT.length];
  const top = 150 - f.h;
  const trunk = [[60, 150], [59, 120], [60 + f.lean * 0.5, 96], [60 + f.lean, top + 40]];
  // (Planted: two roots flaring into the ground and the trunk widening at its foot; its shadow and the
  // grass round it are drawn along the ground itself, drawGardenPiece, so they sit on a slope too.)
  const out = [];
  out.push(...bark([[58, 145], [46, 149.6]], (u) => 4 - u * 2.6, ramp('#a87850'), v + 2, 1));
  out.push(...bark([[62, 145], [75, 149.6]], (u) => 4 - u * 2.6, ramp('#a87850'), v + 3, 1));
  out.push(...bark(trunk, (u) => 11.5 - u * 5.5, ramp('#a87850'), v * 3.1, 2));
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
    // (Floating on the surface, not under it: the water's skin is laid over everything below it.)
    const py = waterY - ry * 0.55 + bob;
    // (A deep leaf green, so the pads read against the pond's green-teal.)
    ctx.fillStyle = '#3f7f48';
    ctx.beginPath();
    ctx.ellipse(px + 0.4, py + 0.6, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#56a35e';
    ctx.beginPath();
    ctx.ellipse(px, py, rx, ry, 0, 0.35, TAU - 0.05);
    ctx.lineTo(px, py);
    ctx.fill();
    ctx.fillStyle = '#8fd07a';
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
  // The stream from its end: a rope of water, a deeper edge and a bright core, widening as it falls,
  // ripples of light running down it.
  const fx = sx1 - 2;
  const stream = (c, l0, r0, l1, r1) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(fx + l0, sy1);
    ctx.quadraticCurveTo(fx + l0 - 8, sy1 + 30, fx + l1, pond);
    ctx.lineTo(fx + r1, pond);
    ctx.quadraticCurveTo(fx + r0 - 7, sy1 + 28, fx + r0, sy1);
    ctx.fill();
  };
  stream('#6fb0dc', -1.5, 4.5, -12, -3);
  stream('#9fd4f0', -0.8, 3.6, -11, -4.4);
  stream('#e2f4fc', 0.6, 1.8, -8.4, -6.6);
  for (let i = 0; i < 4; i++) {
    const u = (time * 1.1 + i / 4) % 1;
    const k = u * u;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(snap(fx + 1 - 10 * k), snap(sy1 + (pond - sy1) * k), 2, 5);
  }
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

// ---------- The rock ----------
// Warm garden stone, the same family as the soil it's set in (one stone for the Garden's cliff and the
// race walls).
const GARDEN_STONE = ['#d2c8ba', '#c6bbac', '#ddd3c5'];
// Stone stacked up from the bottom (`h` tall): blocks each their own height, shade and set (one
// juts a little, the next sits back), from `x0` (less its jut) to somewhere between `x1` and `x1 +
// spread`; lit from above, a crack across a few, moss along the top of a few of the ledges they
// make. `holds`: climbing holds bolted into the part out from the face (left of `face`).
function stackedRock(h, seed, { x0, x1, spread, jut = 5, holds = null, face = 0 }) {
  const out = [];
  const moss = [];
  for (let y = h, i = 0; y > 0.5; i++) {
    const bh = Math.min(y, 15 + hash(seed * 3.1 + i * 1.7) * 19);
    const top = y - bh;
    const a = x0 - hash(seed * 5.3 + i * 2.9) * jut;
    const b = x1 + hash(seed * 7.7 + i * 1.3) * spread;
    const c = GARDEN_STONE[Math.floor(hash(seed + i * 4.1) * 3)];
    // (Each block its own rough shape: corners worn away by different amounts, sides bulging.)
    const r = (n) => hash(seed * 1.3 + i * 6.7 + n * 2.1);
    const k = Math.min(5, bh * 0.3);
    out.push(T([[a + k * r(1), top + k * r(2) * 0.5], [b - k * (0.4 + r(3)), top], [b + 2 * r(4), top + bh * (0.3 + 0.3 * r(5))], [b - k * r(6), y], [a + k * r(7) * 0.6, y], [a - 2 * r(8), top + bh * (0.4 + 0.3 * r(9))]], c));
    if (hash(seed * 9.1 + i) < 0.4) {
      const cy = top + bh * (0.35 + hash(seed + i * 7.7) * 0.3);
      out.push(F(limb(a + 5, cy, a + 12, cy + 2.5, 0.7, 0.5, ramp(c).deep)), F(limb(a + 12, cy + 2.5, a + 17, cy + 1.5, 0.6, 0.4, ramp(c).deep)));
    }
    if (hash(seed * 2.3 + i * 5.1) < 0.32 && top > 4) moss.push(F(E(a + 10, top + 1, 8, 1.8, '#9fcf7a')), F(E(a + 6, top + 0.4, 3.4, 1.1, '#bfe596')));
    if (holds) {
      for (let k2 = 0; k2 < 2; k2++) {
        const hx = a + 4 + hash(seed * 4.7 + i * 3.3 + k2) * Math.max(4, face - a - 10);
        const hy = top + 4 + hash(seed * 6.1 + i * 2.1 + k2) * Math.max(2, bh - 8);
        const col = holds[Math.floor(hash(seed + i * 1.9 + k2 * 5) * holds.length)];
        moss.push(E(hx, hy, 2.4, 1.8, col), F(E(hx - 0.6, hy - 0.7, 0.9, 0.5, '#ffffff')));
      }
    }
    y = top + 0.5;
  }
  return [...out, ...moss];
}
// A cliff faced with rock, `h` tall: the face at x 6 of the drawing, the land to its right.
export const ROCK_FACE_AT = 6;
// (A few loose stones set into the soil behind it, so the rock grows out of the land.)
const rockFaceArt = (h, seed) => art(`mg-rockface|${h}|${seed}`, 66, h, () => [
  ...stackedRock(h, seed, { x0: ROCK_FACE_AT, x1: 24, spread: 26 }),
  ...Array.from({ length: Math.floor(h / 70) }, (_, i) => {
    const sy = 20 + hash(seed * 8.3 + i * 3.9) * (h - 40);
    const sx = 46 + hash(seed * 2.9 + i * 5.3) * 14;
    const rr = 3 + hash(seed + i * 9.1) * 3;
    return E(sx, sy, rr * 1.3, rr, GARDEN_STONE[i % 3]);
  }),
]);
// A climbing crag against a cliff, `h` tall: rock built out from the face (at x 50 of the drawing)
// into the air, holds bolted into it, its top flat and mossed where the climbers come over.
export const CRAG_FACE_AT = 50;
export const cragArt = (h, seed, holds) => art(`mg-crag|${h}|${seed}`, 66, h, () => [
  ...stackedRock(h, seed, { x0: 4, x1: CRAG_FACE_AT + 4, spread: 8, jut: 3, holds, face: CRAG_FACE_AT }),
  // The top: a mossy lip all along it.
  F(R(2, 0, 58, 3, '#9fcf7a')), F(R(4, 0, 50, 1.2, '#bfe596')), ...[8, 22, 36, 50].map((x) => F(E(x, 3.5, 4, 1.6, '#8cc46a'))),
]);
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
    // Leaves all down it (more the longer it hangs), two greens, and on every third strand a tiny
    // blossom near its tip.
    const leaves = Math.max(3, Math.round(l / 8));
    for (let k = 1; k <= leaves; k++) {
      const t = k / (leaves + 0.5);
      ctx.fillStyle = k % 3 ? '#8fcf72' : '#7cbf64';
      ctx.beginPath();
      ctx.ellipse(vx + Math.sin(a) * l * t * t + (k % 2 ? 2.2 : -2.2), y + l * t, 2.4, 1.4, k % 2 ? 0.5 : -0.5, 0, TAU);
      ctx.fill();
    }
    if (i % 3 === 1) {
      const fx = vx + Math.sin(a) * l * 0.72;
      const fy = y + l * 0.85;
      ctx.fillStyle = '#ffd0dc';
      for (let k = 0; k < 5; k++) {
        ctx.beginPath();
        ctx.arc(fx + Math.cos((k / 5) * TAU) * 1.6, fy + Math.sin((k / 5) * TAU) * 1.6, 1.1, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = '#ffe680';
      ctx.fillRect(fx - 0.5, fy - 0.5, 1, 1);
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
// The glide board: planks from the ledge's left end to the lip, a stone weighting the back end.
const GLIDE_BOARD = { x: 2946, y: 380, w: 70 };
const glideBoardArt = () => art('mg-glideboard', GLIDE_BOARD.w + 14, 12, () => {
  const w = ramp('#d8a46a');
  const L = GLIDE_BOARD.w + 14;
  return [...planks(0, 0, L, 4, w, 3, 11), F(R(0, 0, L, 1, w.hi)), F(R(0, 3.4, L, 0.6, w.deep)), F(R(1.2, 1.6, 1.4, 1, w.deep)),
    E(L - 8, 7, 7, 4.6, STONE), F(E(L - 9.4, 5.6, 4, 2, ramp(STONE).hi)), F(R(L - 13, 9, 10, 1.4, ramp(STONE).sh))];
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
// The Moonmortar: the Garden's great mochi mortar, a fat wooden tub on a mossy stone, a gold crescent
// carved on its front, the sacred rope twisted round its waist with zigzag paper streamers, and in
// it a big soft mochi, smiling, its sprout up; the pounding mallet leans beside it.
const moonmortarArt = () => art('mg-moonmortar', 210, 176, () => {
  const wood = ramp('#d8a46a');
  const out = [
    // The stone it stands on, moss along its edge.
    E(105, 170, 82, 7, '#cfc4b6'), F(E(105, 167, 78, 3, '#ddd4c8')), F(E(52, 166, 12, 2.4, '#9fcf7a')), F(E(156, 167, 10, 2, '#9fcf7a')),
    // The tub: round-bellied, a rim at the top, its grain.
    T([[44, 82], [166, 82], [172, 104], [168, 136], [158, 164], [52, 164], [42, 136], [38, 104]], wood.base),
    F(T([[140, 82], [166, 82], [172, 104], [168, 136], [158, 164], [136, 164], [148, 120]], wood.sh)),
    ...[62, 84, 106, 128].map((x) => F(R(x, 92, 1.4, 68, wood.deep))),
    E(105, 82, 64, 12, wood.hi), E(105, 82, 56, 9, '#b07a44'),
    // The gold crescent on its front.
    F(E(104, 138, 11, 11, '#ffd75e')), F(E(109, 135, 9.6, 9.6, wood.base)),
    // The sacred rope, twisted, round its waist, and its zigzag paper streamers.
    F(limb(38, 106, 172, 106, 5, 5, '#c8a868')), F(limb(38, 104.6, 172, 104.6, 1.6, 1.6, '#f0dca0')),
    ...[46, 60, 74, 88, 102, 116, 130, 144, 158].map((x) => F(limb(x, 102.6, x + 7, 109.4, 1.3, 1.3, '#9a7a48'))),
  ];
  for (const x of [62, 104, 146]) {
    out.push(F(T([[x - 4, 110], [x + 4, 110], [x + 4, 116], [x, 116], [x + 4, 122], [x + 4, 128], [x - 4, 128], [x - 4, 122], [x, 122], [x - 4, 116]], '#ffffff')), F(R(x - 4, 115.6, 8, 0.8, '#e6e0f0')), F(R(x - 4, 121.6, 8, 0.8, '#e6e0f0')));
  }
  // The mochi in it: a soft round mound over the rim, smiling, rosy, a sprout on top.
  out.push(
    E(105, 74, 50, 24, '#fffaf4'), F(E(92, 62, 24, 8, '#ffffff')),
    F(E(96, 72, 1.8, 2.4, '#5a3a48')), F(E(114, 72, 1.8, 2.4, '#5a3a48')), F(E(95.4, 71, 0.7, 0.8, '#ffffff')), F(E(113.4, 71, 0.7, 0.8, '#ffffff')),
    F(E(88, 77, 4, 2, '#ffccd8')), F(E(122, 77, 4, 2, '#ffccd8')),
    F(E(103.4, 77.6, 1.6, 1, '#d0507a')), F(E(106.6, 77.6, 1.6, 1, '#d0507a')),
    F(limb(105, 51, 106, 40, 1.4, 1.2, '#6fae52')), E(100, 41, 5, 2.6, '#8fd16f'), E(112, 39, 5, 2.6, '#7cc060'),
  );
  // The mallet leaning on it: its long handle, and the barrel head up top.
  out.push(
    F(limb(186, 170, 160, 52, 3.4, 3.4, WOOD_DK)), F(limb(186, 170, 160, 52, 1.2, 1.2, ramp(WOOD_DK).hi)),
    T([[142, 38], [174, 30], [180, 50], [148, 58]], '#c8945a'), F(T([[142, 38], [174, 30], [175, 34], [143, 42]], '#e2b880')), E(145, 48, 4, 10, '#b07a44'), E(177, 40, 4, 10, '#e2b880'),
  );
  return out;
});
const stadiumArt = () => art('mg-stadium', 184, 160, () => {
  const out = [
    R(14, 40, 22, 120, '#e8d8c0'), R(148, 40, 22, 120, '#e8d8c0'), F(R(14, 40, 4, 120, '#fff4e4')), F(R(148, 40, 4, 120, '#fff4e4')),
    T([[4, 40], [92, 10], [180, 40], [172, 46], [92, 20], [12, 46]], '#d0705a'), F(T([[92, 10], [180, 40], [172, 46], [92, 20]], ramp('#d0705a').sh)),
    R(30, 46, 124, 10, WOOD), F(R(30, 46, 124, 2, ramp(WOOD).hi)),
    // The doorway, open: a glimpse of the sunny stadium (its stands and bunting), the lattice doors
    // folded back against the posts; and the plaque with a racing mochi on it.
    R(36, 60, 112, 100, '#cfe6ff'), F(R(36, 118, 112, 42, '#bfe0ac')), F(R(36, 116, 112, 3, '#9fd07a')),
    F(R(46, 92, 92, 24, '#d8a46a')), ...[0, 1, 2, 3, 4, 5].map((i) => F(R(46 + i * 16, 86, 8, 6, i % 2 ? '#ffffff' : SAKURA))),
    ...[56, 72, 88, 104, 120].map((x, i) => F(E(x, 98 + (i % 2) * 6, 4, 3.4, ['#fbf6f0', '#ffe8e0', '#fff0f4'][i % 3]))),
    ...[[64, 72], [84, 76], [104, 72], [124, 76]].map(([x, y], i) => F(T([[x - 4, y], [x + 4, y], [x, y + 7]], i % 2 ? '#8fd3ff' : '#ffd75e'))),
    T([[36, 60], [46, 66], [46, 154], [36, 160]], '#a87850'), T([[148, 60], [138, 66], [138, 154], [148, 160]], '#a87850'),
    ...[80, 104, 128].map((y) => F(R(37, y, 9, 2, '#7a5438'))), ...[80, 104, 128].map((y) => F(R(138, y, 9, 2, '#7a5438'))),
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
    // The basket beds (world/garden-life.js NURSERY_BEDS), each with its own blanket: the back of the
    // basket and the blanket inside (the front of the rim is drawn over whoever's asleep in it).
    ...NURSERY_BEDS.flatMap((x, i) => [E(x, 352, 34, 4, '#d8a86a'), F(E(x, 351, 33, 1.2, '#ecc890')), E(x, 353, 31, 2.4, '#a8784a'), E(x, 354, 29, 2.6, BED_BLANKETS[i % BED_BLANKETS.length]), F(E(x - 14, 353, 7, 1.2, '#ffffff'))]),
    // The toy shelf (its ledge is a platform): a ball, a little drum, blocks.
    R(520, 262, 150, 8, WOOD), F(R(520, 262, 150, 2, ramp(WOOD).hi)),
    E(546, 252, 8, 8, '#ff9ab0'), F(E(543, 249, 3, 2, '#ffffff')), R(572, 246, 14, 14, '#9fc8f0'), F(E(579, 246, 7, 2, '#cfe6ff')), R(600, 250, 10, 10, KINAKO), R(612, 252, 8, 8, MATCHA), R(606, 242, 8, 8, SAKURA),
  ];
  return out;
});
const BED_BLANKETS = ['#c8e6f8', '#ffe4ec', '#e2f4d8', '#fff0c4'];
// The front of a basket bed's rim, woven, drawn in front of the Mochi asleep in it (its middle at x,
// sitting on the floor).
const bedFrontArt = () => art('mg-bedfront', 72, 16, () => [
  E(36, 11, 34, 4, '#d8a86a'), F(E(36, 7.6, 33, 1.2, '#ecc890')),
  ...[-24, -16, -8, 0, 8, 16, 24].map((dx) => F(R(36 + dx, 9, 1, 4 - Math.abs(dx) / 12, '#c08a52'))),
  F(R(8, 14, 56, 1, '#b88850')),
]);
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
      drawMochiEgg(ctx, ex - cam.x, groundAt(map, ex) - cam.y, egg.genes ?? genesOf(egg.seed), time, GARDEN_EGG);
    });
  }
  for (const e of life.mochi) {
    if (e.hidden || e.x == null) continue;
    const [x, y] = [e.x - cam.x, e.y - cam.y];
    // (Saying goodbye, it fades away.)
    if (e.fade != null) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, e.fade));
    }
    const bloom = e.rec.bloom > 0 && !e.scene;
    if (bloom) bloomFlowers(ctx, x, y, time, e.rec.seed, false);
    if (e.scene === 'evolve') drawEvolve(ctx, e.m, x, y, time);
    else if (e.scene === 'rebirth') drawRebirth(ctx, e.m, x, y, time);
    else if (e.scene === 'hatch') drawHatch(ctx, e.m, x, y, time);
    else drawMochiAnim(ctx, e.m, x, y, time);
    if (bloom) bloomFlowers(ctx, x, y, time, e.rec.seed, true);
    if (e.fade != null) ctx.restore();
  }
  // In the nursery: the front of each basket bed, over whoever's curled up asleep in it.
  if (map.indoor) for (const bx of NURSERY_BEDS) place(ctx, bedFrontArt(), snap(bx - cam.x), groundAt(map, bx) + 4 - cam.y);
  // A moment between two Mochi (world/garden-life.js): a little bubble over the one who started it.
  const mo = life.moment;
  if (mo && !mo.a.hidden && mo.a.x != null) {
    const t = world.now - mo.t0;
    if (t < 1.8) {
      const fade = Math.min(1, t * 4, (1.8 - t) * 3);
      momentBubble(ctx, mo.a.x - cam.x, mo.a.y - cam.y - (mo.a.m.size === 'baby' ? 40 : 48) - Math.sin(t * 5) * 1, mo.kind, fade);
    }
  }
  // A pair that's met: hearts rising between them as they dance.
  const pair = life.pairing;
  if (pair?.met) {
    const mx = (pair.a.x + pair.b.x) / 2 - cam.x;
    const my = Math.min(pair.a.y, pair.b.y) - cam.y - 30;
    for (let i = 0; i < 3; i++) {
      const k = (time * 0.7 + i / 3) % 1;
      ctx.globalAlpha = Math.sin(Math.PI * k);
      heart(ctx, mx + Math.sin(k * 6 + i * 2) * 6, my - k * 22, 2.6 + i * 0.4, i === 1 ? '#ff6f9a' : '#ffb3c8');
    }
    ctx.globalAlpha = 1;
  }
}
// Flowers blooming round a Mochi that's had a Heart Mochi: five little blossoms circling at its feet
// (the back ones drawn behind it, the front ones in front), each gently opening and closing.
const BLOOMS = ['#ffb3c8', '#ffffff', '#ffd6e4', '#fff2a8', '#ffc2d4'];
function bloomFlowers(ctx, x, y, time, seed, front) {
  for (let i = 0; i < 5; i++) {
    const a = time * 0.5 + i * ((Math.PI * 2) / 5) + (seed % 7);
    if ((Math.sin(a) > 0) !== front) continue;
    const fx = x + Math.cos(a) * 15;
    const fy = y - 3 + Math.sin(a) * 3.5;
    const r = 1.8 + 0.5 * Math.sin(time * 2 + i);
    ctx.fillStyle = BLOOMS[i];
    for (let p = 0; p < 5; p++) {
      const pa = p * ((Math.PI * 2) / 5) + time * 0.3;
      ctx.beginPath();
      ctx.arc(fx + Math.cos(pa) * r, fy - 3 + Math.sin(pa) * r * 0.8, r * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd25a';
    ctx.beginPath();
    ctx.arc(fx, fy - 3, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7fbf62';
    ctx.fillRect(fx - 0.4, fy - 1.5, 0.8, 3);
  }
}
// A little speech bubble with what the moment is: ! a chase, ? hiding, a note a parade, z a nap, a
// scribble a huff, a heart a chat, ... a snub.
function momentBubble(ctx, x, y, kind, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e8c8d8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y, 7.5, 6, 0, 0, Math.PI * 2);
  ctx.moveTo(x - 2, y + 5);
  ctx.lineTo(x - 1, y + 9);
  ctx.lineTo(x + 2, y + 5);
  ctx.fill();
  ctx.stroke();
  if (kind === 'chat') heart(ctx, x, y - 0.5, 2.6, '#ff6f9a');
  else if (kind === 'huff') {
    ctx.strokeStyle = '#7a5a7a';
    ctx.beginPath();
    ctx.moveTo(x - 4, y + 1);
    for (let i = 0; i < 5; i++) ctx.lineTo(x - 3 + i * 2, y + (i % 2 ? -2 : 1.5));
    ctx.stroke();
  } else {
    const mark = { chase: '!', hide: '?', parade: '♪', nap: 'z', snub: '...' }[kind] ?? '!';
    ctx.fillStyle = kind === 'nap' ? '#8a9ad8' : kind === 'snub' ? '#a88a9e' : '#ff6f9a';
    ctx.font = 'bold 8px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(mark, x, y + 3);
  }
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

// A tree's shadow, a soft band of darker grass along the ground under it, `r` either side.
function treeShadow(ctx, map, wx, cam, r) {
  ctx.fillStyle = '#7cc06c';
  ctx.beginPath();
  for (let d = -r; d <= r; d += 4) {
    const t = 1 - (d / r) ** 2;
    ctx.lineTo(wx + d - cam.x, groundAt(map, wx + d) - cam.y - 0.6 - t * 1.4);
  }
  for (let d = r; d >= -r; d -= 4) {
    const t = 1 - (d / r) ** 2;
    ctx.lineTo(wx + d - cam.x, groundAt(map, wx + d) - cam.y + 0.4 + t * 1.6);
  }
  ctx.closePath();
  ctx.fill();
}
// Grass tufts round a tree's foot, each standing on the ground where it is.
const TUFTS = [[-18, 5, '#7cc86e'], [-13, 7, '#94d884'], [-8, 4, '#7cc86e'], [9, 6, '#94d884'], [14, 4, '#7cc86e'], [19, 6, '#94d884']];
function treeTufts(ctx, map, wx, cam) {
  for (const [d, h, c] of TUFTS) {
    const gx = wx + d - cam.x;
    const gy = groundAt(map, wx + d) - cam.y + 0.6;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(gx - 1.6, gy);
    ctx.lineTo(gx + 0.4, gy - h);
    ctx.lineTo(gx + 1.6, gy);
    ctx.closePath();
    ctx.fill();
  }
}

// The fruit trees, drawn before the ground so its grassy lip covers the foot of the trunk: each
// grows up out of the ground. Set on the lower side of the ground under its trunk, so on a slope
// none stands on air.
function fruitTreesBehind(ctx, map, cam, width, time) {
  if (!(map.garden || map.mochiRace)) return;
  for (const [kind, wx, extra] of map.townPieces ?? []) {
    if (kind !== 'mg_fruittree') continue;
    const x = wx - cam.x;
    if (x < -280 || x > width + 280) continue;
    const foot = Math.max(groundAt(map, wx - 9), groundAt(map, wx + 9)) - cam.y;
    const a = (lean(time, wx) + 0.45) * 0.02;
    pivoted(ctx, x, foot, a, () => place(ctx, fruitTreeArt(extra ?? 0), snap(x), foot + 5));
  }
}
BEHIND_GROUND.push(fruitTreesBehind);

// ---------- Drawing ----------
export function drawGardenPiece(ctx, map, kind, wx, extra, cam, width, time) {
  // (The race stadium and courses borrow the trees and lanterns: world/stadium.js.)
  if (!(map.garden || map.mochiRace) || !kind.startsWith('mg_')) return false;
  const x = wx - cam.x;
  if (x < -280 && kind !== 'mg_falls') return true;
  if (x > width + 280 && kind !== 'mg_falls') return true;
  const gy = groundAt(map, wx) - cam.y;
  const night = map.night ?? 0;
  switch (kind) {
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
      ctx.textAlign = 'left';
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
      // (The tree itself is drawn behind the ground's edge, fruitTreesBehind; here, in front: the
      // shade on the grass at its foot and the tufts growing round it.)
      treeShadow(ctx, map, wx, cam, 22);
      treeTufts(ctx, map, wx, cam);
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
    case 'mg_cropbed': {
      // (How grown it is comes from when you last picked it: four stages, so it never repaints.)
      const grow = cropGrowth(map.gardenData, Date.now() / 1000);
      const stage = grow >= 1 ? 3 : grow >= 0.66 ? 2 : grow >= 0.33 ? 1 : 0;
      place(ctx, cropBedArt(), snap(x), gy + 2);
      const a = (lean(time, wx) + 0.4) * 0.03;
      pivoted(ctx, x, gy - 10, a, () => place(ctx, cropsArt(stage), snap(x), gy - 9));
      return true;
    }
    case 'mg_reeds': {
      reeds(ctx, x, (map.water?.[0]?.y ?? gy + cam.y) - cam.y + 2, time, wx, extra ?? 0);
      return true;
    }
    case 'mg_falls':
      falls(ctx, map, x, cam, time);
      return true;
    case 'mg_rockface': {
      // A cliff faced with rock, from `extra.top` down to `extra.bottom`, its face at x (`flip`: the
      // land to the left, the face looking right). A little below the top, so the grass lip and its
      // vines hang over it.
      const h = extra.bottom - extra.top - 4;
      const s = rockFaceArt(h, extra.seed ?? 1);
      const cx = extra.flip ? x + ROCK_FACE_AT - s.w / 2 : x - ROCK_FACE_AT + s.w / 2;
      place(ctx, s, snap(cx), extra.bottom - cam.y, { flip: Boolean(extra.flip) });
      // (Ivy hanging down over the face from its grassy lip, swaying: `extra.vines` strands.)
      if (extra.vines) vines(ctx, extra.flip ? x - 4 - extra.vines * 9 : x - 4, extra.top - cam.y + 2, time, wx, extra.vines, extra.vineLen ?? 50);
      return true;
    }
    case 'mg_boulders':
      place(ctx, bouldersArt(), snap(x), gy + 2);
      return true;
    case 'mg_glide': {
      // The glide board out over the top of the falls (its ledge is in world/garden.js), held down
      // on the lip by a stone; and the windsock.
      const bx = x + (GLIDE_BOARD.x + GLIDE_BOARD.w / 2 + 7 - wx);
      place(ctx, glideBoardArt(), snap(bx), GLIDE_BOARD.y + 12 - cam.y);
      windsock(ctx, x, gy, time, wx);
      return true;
    }
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
