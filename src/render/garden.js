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
//   mg_flowerbed   a bed of flowers in the garden square, each clump swaying on its own (extra:
//                  which colours)
//   mg_well        the stone well in the square, under a little pink roof, its bucket swinging
//   mg_flagline    the Mochi Market's flags strung from one stall to the next
//   mg_mushroom    the bouncy mushroom in the play meadow, its cap giving as a Mochi lands
//   mg_slide       the slide in the play meadow
//   mg_nurseryroom the nursery inside: plaster walls under a timber dome, the hearth, the eggs'
//                  mortars, basket beds, a round window, a rug, a toy shelf

import { R, E, T, F, snap, mix } from './pixel.js';
import { ramp, planks, foliage, bark, band, gable, hash, swing, pivoted, flicker, lean } from './propkit.js';
// (Eased 0 to 1: slow out, slow in.)
const smooth = (u) => u * u * (3 - 2 * u);
import { limb } from './figure.js';
import { art, place, BEHIND_GROUND, zoneAt } from './scenery.js';
import { groundAt } from '../world/physics.js';
import { drawMochiAnim } from './mochi-anim.js';
import { drawHatch, drawEvolve, drawRebirth } from './mochi-life.js';
import { drawMochiEgg } from './wagashi.js';
import { rollMochi } from '../data/mochi-genes.js';
import { EGG_SLOTS, EGG_BACK, NURSERY_BEDS, cropGrowth, stallOnShow, HARVEST_FREE, EGG_HOP, eggHopSecs } from '../world/garden-life.js';
import { drawSweet } from './mochi-sweets.js';
import { SWEET_BY_ID } from '../data/mochi-raise.js';
import { drawShopModel } from './shopmodel.js';
import { stallWear } from '../data/mochi-wardrobe.js';
// The valley behind it all (its backdrop registers itself).
import './gardenart.js';
import { signText, signBoard } from './signfont.js';

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
function steam(ctx, x, y, time, seed, n = 3, rise = 24, k = 1) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const u = (time * 0.32 + i / n + seed) % 1;
    ctx.globalAlpha = 0.5 * k * Math.sin(Math.PI * u);
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
    R(16, 22, 5, 76, WOOD_DK), R(111, 22, 5, 76, WOOD_DK),
    F(R(14, 94, 9, 4, '#6b4f3a')), F(R(109, 94, 9, 4, '#6b4f3a')),
    // Cross-braces at the top of each post, so the awning has something holding it up.
    F(limb(21, 30, 34, 24, 1.6, 1.2, WOOD_DK)), F(limb(111, 30, 98, 24, 1.6, 1.2, WOOD_DK)),
    ...planks(12, 60, 108, 30, w, 6, 3),
    F(R(12, 60, 108, 3, w.hi)), F(R(12, 87, 108, 3, w.deep)),
    // A sakura cloth hung along the front of the counter.
    F(R(12, 63, 108, 7, SAKURA)), F(R(12, 63, 108, 1.6, '#ffd9e4')),
    ...Array.from({ length: 9 }, (_, i) => F(T([[12 + i * 12, 70], [24 + i * 12, 70], [18 + i * 12, 74]], SAKURA))),
    // The eggs on the counter, each in its little mortar.
    ...[[36, '#ffe4ec'], [62, MOCHI], [88, '#dff4e2']].flatMap(([x, c]) => [R(x - 8, 52, 16, 9, WOOD), F(R(x - 8, 52, 16, 1.6, ramp(WOOD).hi)), E(x, 48, 7, 6.4, c), F(E(x - 2.4, 45.4, 2, 1.2, '#ffffff')), F(limb(x, 42, x + 0.4, 39, 0.5, 0.4, '#5aa04a')), F(E(x + 1.8, 39, 1.6, 0.9, MATCHA))]),
    // Two baskets of straw at the ends of the counter, where the eggs are packed.
    ...[22, 102].flatMap((x) => [
      ...[0, 1, 2, 3, 4].map((i) => F(limb(x - 8 + i * 1.2, 44 - i * 0.6, x + 2 + i * 1.2, 40 - i * 0.9, 0.7, 0.6, i % 2 ? '#e8cf96' : '#d8bc78'))),
      T([[x - 9, 50], [x + 9, 50], [x + 7, 59], [x - 7, 59]], '#c89a62'),
      F(T([[x - 9, 50], [x + 9, 50], [x + 8.6, 52], [x - 8.6, 52]], '#e0b682')),
      ...[0, 1, 2].map((i) => F(R(x - 8 + i * 5.6, 53 + i * 0.3, 4.4, 1.4, '#a8783f')))]),
  ];
  // The awning: stripes of sakura and cream with a scalloped hem.
  for (let i = 0; i < 9; i++) {
    const x0 = 8 + i * 13;
    out.push(T([[x0, 12], [x0 + 13, 12], [x0 + 13, 28], [x0 + 6.5, 32], [x0, 28]], i % 2 ? '#fff4ea' : SAKURA));
  }
  out.push(R(6, 8, 120, 5, ramp(SAKURA).sh), F(R(6, 8, 120, 1.6, '#ffd9e4')));
  // The shade the awning throws back onto the counter's top.
  out.push(F(R(14, 60, 104, 2.4, ramp('#d8a46a').sh)));
  return out;
});

// ---------- The clothes stall ----------
// Four things out each day on dress forms (render/dressform.js), under a mint-striped awning, with
// a rail of empty hangers behind them and a folded pile at each end. The forms themselves are
// drawn live, because what they are wearing changes with the day (drawGardenPiece mg_wearstall).
const WEAR_STALL_W = 176;
// Where the four stand on the counter, out from the middle, and how high that counter is.
// A string of little flags between two points, sagging in the middle, each flag turning on its own
// thread so the line ripples instead of swinging as one board.
function bunting(ctx, x0, x1, y, time, wx, colors) {
  const n = Math.max(3, Math.round((x1 - x0) / 13));
  const sag = 7;
  ctx.strokeStyle = '#c9a97e';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const px = x0 + (x1 - x0) * u;
    const py = y + Math.sin(u * Math.PI) * sag;
    if (i) ctx.lineTo(snap(px), snap(py));
    else ctx.moveTo(snap(px), snap(py));
  }
  ctx.stroke();
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n;
    const px = x0 + (x1 - x0) * u;
    const py = y + Math.sin(u * Math.PI) * sag;
    const t = Math.sin(time * 1.9 + i * 0.9 + wx * 0.02) * 0.2;
    ctx.save();
    ctx.translate(snap(px), snap(py));
    ctx.rotate(t);
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(-3.6, 0);
    ctx.lineTo(3.6, 0);
    ctx.lineTo(0, 7.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
export const WEAR_HOOKS = [-57, -19, 19, 57];
export const WEAR_COUNTER = 34;
const wearStallArt = () => art('mg-wearstall', WEAR_STALL_W, 104, () => {
  const w = ramp('#d8a46a');
  const mint = '#8fd8c0';
  const out = [
    R(18, 24, 5, 80, WOOD_DK), R(153, 24, 5, 80, WOOD_DK),
    F(R(16, 100, 9, 4, '#6b4f3a')), F(R(151, 100, 9, 4, '#6b4f3a')),
    // The back board, with a row of empty hangers on it.
    R(26, 36, 124, 34, '#f6e4cc'), F(R(26, 36, 124, 2.4, '#fff4e4')), F(R(26, 68, 124, 2, w.deep)),
    ...[42, 66, 110, 134].flatMap((x) => [
      F(limb(x, 42, x, 46, 0.5, 0.5, '#b08a5c')),
      F(limb(x - 5, 50, x + 5, 50, 0.6, 0.6, '#c9a97e')),
      F(limb(x - 5, 50, x, 46, 0.5, 0.5, '#c9a97e')),
      F(limb(x + 5, 50, x, 46, 0.5, 0.5, '#c9a97e')),
    ]),
    // The counter, planked, a mint cloth along its top.
    ...planks(14, 70, 148, 26, w, 6, 3),
    F(R(14, 70, 148, 3, mint)), F(R(14, 73, 148, 1.2, '#6fc0a8')), F(R(14, 94, 148, 3, w.deep)),
    // A folded pile at each end of the counter, and the price card on its front.
    ...[[26, '#ffd0e0', '#ff9ec0'], [150, '#cfe4ff', '#9fc8ee']].flatMap(([x, c, d]) => [
      R(x - 9, 64, 18, 4, d), F(R(x - 9, 64, 18, 1.4, c)),
      R(x - 8, 60, 16, 4, c), F(R(x - 8, 60, 16, 1.4, '#ffffff')),
    ]),
  ];
  // The awning: stripes of mint and cream with a scalloped hem.
  for (let i = 0; i < 12; i++) {
    const x0 = 10 + i * 13;
    out.push(T([[x0, 8], [x0 + 13, 8], [x0 + 13, 26], [x0 + 6.5, 30], [x0, 26]], i % 2 ? '#fff4ea' : mint));
  }
  out.push(R(8, 4, 160, 5, ramp(mint).sh));
  return out;
});

// ---------- The orchard's working end ----------
// A valley that grows its own food has the gear for it standing about: a bean frame with the vines
// up it, a wash line between two posts, and crates of picked fruit waiting to go up to the square.
const beanFrameArt = () => art('mg-beanframe', 72, 96, () => {
  const out = [R(10, 10, 3.4, 86, '#b9a070'), R(58, 10, 3.4, 86, '#b9a070'), R(34, 4, 3.4, 92, '#c8ae7c')];
  // The three canes crossed at the top and the rails between them.
  out.push(F(limb(11, 12, 36, 4, 1.4, 1.2, '#cdb485')), F(limb(60, 12, 36, 4, 1.4, 1.2, '#b9a070')));
  for (let r = 0; r < 4; r++) out.push(F(R(10, 26 + r * 18, 52, 2.2, '#c8ae7c')));
  // The vines winding up them, their leaves and a few flowers.
  for (let i = 0; i < 26; i++) {
    const u = i / 25;
    const x = 36 + Math.sin(u * 9.2) * 24;
    const y = 92 - u * 84;
    out.push(F(E(x, y, 2.4, 1.8, i % 3 ? '#5f9a56' : '#76b267')));
    if (i % 4 === 1) out.push(F(E(x + 5, y - 2, 3.4, 2.4, '#8ac477')), F(E(x + 5, y - 2.8, 1.6, 1, '#a8d892')));
    if (i % 7 === 3) out.push(F(E(x - 5, y + 1, 1.6, 1.6, '#ffe8a0')));
    if (i % 9 === 5) out.push(F(limb(x, y, x - 2, y + 7, 0.8, 0.5, '#4f8a4c')));
  }
  out.push(F(E(36, 95, 22, 3, '#6f9a52')));
  return out;
});
const crateStackArt = () => art('mg-crates', 76, 62, () => {
  const crate = (x, y, w, h, c, d) => [R(x, y, w, h, c), F(R(x, y, w, 2.2, ramp(c).hi)), F(R(x, y + h - 2.6, w, 2.6, d)),
    F(R(x + 3, y + 3, 2.4, h - 7, d)), F(R(x + w - 6, y + 3, 2.4, h - 7, d))];
  return [
    ...crate(4, 34, 34, 26, '#c8945a', '#9a6a40'),
    ...crate(40, 30, 32, 30, '#d8a46a', '#a8763f'),
    ...crate(10, 10, 30, 25, '#c8945a', '#9a6a40'),
    // The fruit in the top one, heaped over the rim.
    ...[[16, 10, '#ff9ea8'], [24, 8, '#ffd083'], [32, 10, '#ff9ea8'], [20, 6, '#ffb8c0'], [28, 6, '#ffe0a0']]
      .flatMap(([x, y, c]) => [F(E(x, y, 5, 4.4, c)), F(E(x - 1.6, y - 1.6, 1.8, 1.2, '#ffffff')), F(limb(x, y - 4, x + 1, y - 7, 0.7, 0.5, '#6f9a52'))]),
    F(E(38, 60, 32, 3, '#6f9a52')),
  ];
});

// ---------- The garden square (2026-11-15) ----------
// With the shops gone out to the Mochi Market, the square inside the gate is a garden: the vegetable
// patch (the crop bed and the bean frame, up from the orchard), two flower beds the Mochi roll and
// nap in, and a stone well under a little pink roof like the nursery's.
// Each bed's flowers: pink, cream and gold; blue, lilac and lemon (a colour and its shade).
const FLOWER_SETS = [
  [['#ffb3c8', '#ff8fb1'], ['#fff6ea', '#ffd9e4'], ['#ffd27a', '#f6b04e']],
  [['#a8c8ff', '#7fa6f0'], ['#e3c8ff', '#c49cf0'], ['#fff1a0', '#f2d35a']],
];
// The bed: a low mound of dark soil with a border of round stones along its front.
const flowerBedArt = () => art('mg-flowerbed', 100, 20, () => {
  const out = [E(50, 11, 47, 7, '#7a5a3e'), F(E(50, 9.6, 43, 4.4, '#8f6a48')), F(E(50, 8.8, 37, 2.4, '#a07a52'))];
  // (Flat, grey and of mixed sizes, half sunk in the grass: pale round ones read as a row of eggs.)
  for (let i = 0; i < 13; i++) {
    const x = 6 + i * 7.3 + Math.sin(i * 2.3) * 1.2;
    const rx = 3.2 + ((i * 7) % 3) * 0.6;
    const c = ['#b9b0a2', '#a89e90', '#c4bbad'][i % 3];
    out.push(E(x, 15.2, rx, 2.2, c), F(E(x - 0.8, 14.3, rx * 0.5, 0.7, mix(c, '#ffffff', 0.25))));
  }
  out.push(F(E(50, 19, 46, 1.4, '#6f9a52')));
  return out;
});
// One clump of flowers: leaves at its foot and three stems, each with a five-petal flower. Drawn
// once each and swayed whole (drawGardenPiece mg_flowerbed), so the breeze never repaints them.
const flowerClumpArt = (set, i) => art(`mg-flowers|${set}|${i}`, 22, 30, () => {
  const [a, b] = FLOWER_SETS[set][i % 3];
  const h = [22, 17, 25, 19, 23][i % 5];
  const out = [F(E(7, 28, 5, 2.2, '#5f9a56')), F(E(15, 28, 5, 2.2, '#6faa5f')), F(E(11, 27, 4, 2.6, '#7fbf6a'))];
  for (const [dx, k] of [[-5, 0.75], [0, 1], [5, 0.85]]) {
    const tx = 11 + dx * 1.15;
    const ty = 30 - h * k;
    out.push(F(limb(11 + dx * 0.4, 30, tx, ty, 0.7, 0.5, '#5f9a56')), F(E(tx - 1.6, ty + 4, 1.6, 0.8, '#76b267')));
    for (let p = 0; p < 5; p++) {
      const an = (p / 5) * Math.PI * 2 - Math.PI / 2;
      out.push(F(E(tx + Math.cos(an) * 2, ty + Math.sin(an) * 1.7, 1.7, 1.5, p % 2 ? a : b)));
    }
    out.push(F(E(tx, ty, 1, 1, '#ffe8a0')));
  }
  return out;
});
// The well: a round wall of stones about the shaft, the rim lit along its top and dark water just
// showing, two posts with a winch across them and a crank, and a little pink-tiled roof over all.
// (Its bucket hangs from the winch and swings: drawn live, mg_well.)
const WELL_H = 84;
const WELL_WINCH = 33;
const wellArt = () => art('mg-well', 68, WELL_H, () => {
  const s = ramp(STONE);
  const out = [R(12, 18, 4, 44, WOOD), R(52, 18, 4, 44, WOOD)];
  out.push(T([[2, 22], [34, 4], [66, 22], [62, 25], [34, 9], [6, 25]], '#e88aa0'));
  out.push(F(T([[6, 22.4], [34, 6.4], [62, 22.4], [60, 23.4], [34, 8], [8, 23.4]], '#f6b0c0')));
  out.push(F(R(14, 30, 40, 3.4, WOOD_DK)), F(R(28, 29.4, 12, 4.6, '#d8c49a')), F(R(28, 29.4, 12, 1.2, '#e8d8b4')));
  out.push(F(limb(56, 31.5, 61, 35, 1, 1, WOOD_DK)), F(limb(61, 35, 61, 39, 1, 1, WOOD_DK)));
  out.push(R(8, 52, 52, 28, STONE));
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      const x = 13 + c * 10.5 + (r % 2) * 5;
      const y = 58 + r * 8;
      if (x < 58) out.push(F(E(x, y, 4.6, 3.3, (r + c) % 2 ? s.sh : STONE)), F(E(x - 1, y - 1.2, 2, 1, s.hi)));
    }
  }
  out.push(E(34, 52, 28, 6.4, s.hi), F(E(34, 52, 23, 4.2, '#4f6f7a')), F(E(34, 51, 20, 2.6, '#6f93a0')));
  out.push(F(E(34, 82, 30, 2.4, '#6f9a52')));
  return out;
});
const bucketArt = () => art('mg-bucket', 12, 16, () => [F(limb(6, 0, 6, 8, 0.5, 0.5, '#cdb485')), R(2, 8, 8, 7, WOOD),
  F(R(2, 8, 8, 1.6, ramp(WOOD).hi)), F(R(2, 12.6, 8, 1.4, WOOD_DK)), F(limb(2.4, 9, 6, 6.4, 0.4, 0.4, '#8a8a8a')), F(limb(9.6, 9, 6, 6.4, 0.4, 0.4, '#8a8a8a'))]);

// ---------- The play meadow (2026-11-15) ----------
// The bouncy mushroom: a fat cream stem with a sleepy little face, and a pink cap with white spots
// that the Mochi bounce on (the cap is drawn on its own, so it can give under them: mg_mushroom).
const mushStemArt = () => art('mg-mushstem', 24, 26, () => [
  E(12, 23.5, 10, 3, '#f3e2c8'), R(5, 2, 14, 22, '#fff1de'), F(R(14.5, 3, 3.5, 20, '#f2dcc2')), F(R(6, 3, 2, 18, '#fffaf2')),
  F(E(9, 11, 1, 1.4, '#5a3a3a')), F(E(15, 11, 1, 1.4, '#5a3a3a')), F(E(9.3, 10.4, 0.4, 0.4, '#ffffff')), F(E(15.3, 10.4, 0.4, 0.4, '#ffffff')),
  F(E(7, 14, 1.8, 1, '#ffb7c2')), F(E(17, 14, 1.8, 1, '#ffb7c2')), F(E(12, 13.6, 1.3, 0.8, '#c86a6a')),
  F(E(12, 25.2, 11, 1.4, '#6f9a52')),
]);
const mushCapArt = () => art('mg-mushcap', 60, 22, () => [
  E(30, 18, 29, 16, '#ff8fb0'), F(E(30, 19, 26, 3.4, '#f9c4d2')), F(E(24, 7, 9, 3, '#ffb3c8')),
  ...[[16, 10, 4, 3], [33, 5.5, 5, 3.2], [47, 11, 4, 3], [26, 15, 2.6, 2], [41, 16, 2.4, 1.8]].map(([x, y, rx, ry]) => F(E(x, y, rx, ry, '#fff6fa'))),
]);
// The slide: a little wooden ladder up to a pink deck, and the pink chute curving down to a lip on
// the grass, a post under it (a Mochi climbs up, sits, and whooshes down: world/garden-life.js).
const slideArt = () => art('mg-slide', 100, 60, () => {
  const out = [R(8, 8, 2.4, 52, WOOD), R(17, 8, 2.4, 52, WOOD)];
  for (let k = 0; k < 6; k++) out.push(F(R(8, 15 + k * 8, 11, 2, WOOD_DK)));
  out.push(R(58, 32, 3, 28, WOOD), F(R(58, 32, 1, 28, ramp(WOOD).hi)));
  out.push(R(6, 7, 26, 5, '#f6a8bc'), F(R(6, 7, 26, 1.6, '#ffd0dc')));
  out.push(limb(26, 13, 92, 54, 4, 4, '#ff9ec0'), F(limb(27, 11, 92, 52, 1.4, 1.4, '#ffd0dc')), F(limb(28, 9, 90, 49, 0.8, 0.8, '#e07a98')));
  out.push(R(86, 52, 12, 5, '#ff9ec0'), F(R(86, 52, 12, 1.4, '#ffd0dc')));
  out.push(F(E(52, 59, 46, 1.6, '#6f9a52')));
  return out;
});

// ---------- Kinako's shop ----------
// The Garden Keeper's little wagashi shop on the square: a cream front under a pink-tiled roof,
// shelves of sweet jars in the window, a counter with a noren hung over it, and beside it a stand
// showing one of her costumes (a strawberry hood). Its name board is drawn live; at night a purple
// lantern lights by the door for her secret stall (drawGardenPiece mg_shop).
const SHOP_W = 168;
const shopArt = () => art('mg-shop', SHOP_W, 124, () => {
  const wall = '#fbe6cc';
  const out = [
    R(14, 46, 124, 78, wall), F(R(14, 46, 124, 3, ramp(wall).hi)),
    // The eaves throw a band of shade down the wall; the light falls down its left side and the
    // far corner sits back in shadow, so the front has some depth to it.
    F(R(14, 49, 124, 7, ramp(wall).sh)),
    F(R(14, 49, 8, 75, ramp(wall).hi)),
    F(R(128, 49, 10, 75, ramp(wall).sh)),
    R(12, 44, 5, 80, WOOD_DK), R(135, 44, 5, 80, WOOD_DK), F(R(14, 110, 124, 3, WOOD_DK)),
    ...gable(0, 152, 48, 8, '#e88aa8', 11),
    // A ridge tile along the top of the roof and a lit under-edge at the eaves.
    F(R(70, 20, 12, 4, '#f0a8c0')), F(R(0, 45, 152, 2, '#ffc2d8')),
    // The window: shelves of jars, each with sweets of its own colour.
    R(24, 58, 74, 34, '#7a5444'), F(R(24, 58, 74, 4, '#9a6e58')),
    F(R(26, 72, 70, 2, WOOD)), F(R(26, 86, 70, 2, WOOD)),
    ...[[32, 66, '#ffb3c8'], [44, 66, '#c8e8a8'], [56, 66, '#ffe08a'], [68, 66, '#c8b4f0'], [80, 66, '#ffc8a0'], [90, 66, '#a8dcf0'],
      [36, 80, '#ffd0dc'], [50, 80, '#e8c88a'], [64, 80, '#b8e0c8'], [78, 80, '#ffb0b8'], [90, 80, '#fff2c0']].flatMap(([x, y, c]) => [
      // A round sweet jar: glass, the sweets settled in the bottom of it, a shine, a wooden lid.
      F(E(x, y, 4.3, 4.5, '#e8f4f8')), F(E(x, y + 1.3, 3.5, 3.1, c)),
      F(E(x - 1.5, y - 1.7, 1.2, 1.9, '#ffffff')),
      F(R(x - 3.6, y - 5.4, 7.2, 2.4, WOOD)), F(R(x - 3.6, y - 5.4, 7.2, 0.9, ramp(WOOD).hi))]),
    // The counter, planked, a sakura cloth along its top.
    ...planks(18, 92, 84, 22, ramp('#d8a46a'), 6, 3), F(R(18, 92, 84, 3, '#ffc4d6')), F(R(18, 95, 84, 1.2, '#f0a0b8')),
    // The door (the noren hangs over it).
    R(108, 64, 24, 56, '#8a5a44'), F(R(110, 66, 2, 52, '#a8705a')), F(E(127, 94, 1.2, 1.2, '#f2c94c')),
    // A swept stone step at the door with a woven mat on it, and a crate of her boxed sweets
    // waiting to go out, with one lid left open.
    R(102, 116, 36, 6, STONE), F(R(102, 116, 36, 1.6, ramp(STONE).hi)),
    R(106, 112, 24, 5, '#c8a06a'), F(R(106, 112, 24, 1.4, '#e0bc8a')),
    ...[0, 1, 2].map((i) => F(R(108 + i * 7, 113.4, 4, 2.4, '#b08a58'))),
  ];
  // The noren over the window: four pink panels, each with a white mochi crest.
  for (let i = 0; i < 4; i++) {
    const x0 = 24 + i * 18.5;
    out.push(T([[x0, 50], [x0 + 17.5, 50], [x0 + 17.5, 62], [x0, 62]], i % 2 ? '#ff9ec0' : '#ffb3cf'), F(E(x0 + 8.75, 56, 2.6, 2.4, '#ffffff')));
  }
  out.push(R(22, 48, 78, 3, WOOD_DK));
  // The costume stand: a little post with a strawberry hood on top.
  out.push(R(151, 70, 3, 52, WOOD_DK), E(152.5, 122, 7, 2, WOOD_DK),
    E(152.5, 62, 10, 9.4, '#fffaf4'), F(E(152.5, 63.4, 6.6, 6, '#f6e8dc')), E(152.5, 52.6, 4.6, 4.2, '#ff6b84'),
    F(E(151, 51.6, 1, 0.8, '#ffffff')), F(E(154, 53.2, 0.5, 0.5, '#ffe08a')), F(E(151.4, 54, 0.5, 0.5, '#ffe08a')),
    F(T([[150, 48.6], [152.5, 47], [155, 48.6], [152.5, 49.6]], '#86c96e')));
  return out;
});

// ---------- The toy box ----------
// A little wooden chest in the orchard, its lid propped open: a ball on top, blocks, a drum and a
// paper pinwheel sticking out (the pinwheel turns in the breeze: drawGardenPiece mg_toybox).
const toyBoxArt = () => art('mg-toybox', 64, 46, () => {
  const w = ramp('#e2a86a');
  return [
    // The lid, propped open behind.
    T([[10, 18], [54, 18], [58, 4], [14, 6]], w.sh), F(T([[12, 16], [52, 16], [55, 6], [15, 7.6]], w.base)),
    // What's inside, peeking out: blocks, a drum, the ball.
    R(16, 14, 9, 9, '#9fd0f0'), F(R(16, 14, 9, 2, '#c8e6f8')), R(27, 12, 8, 8, '#ffd27a'), F(R(27, 12, 8, 2, '#fff0b8')),
    E(43, 17, 7, 4, '#ff9ab0'), R(36, 17, 14, 5, '#ff9ab0'), F(E(43, 16.6, 6, 2.6, '#ffe4ec')),
    E(24, 9, 5.4, 5.4, '#ff8a6a'), F(E(22.6, 7.6, 1.8, 1.4, '#ffffff')), F(R(18.8, 8.6, 10.4, 0.9, '#fff4ea')),
    // The box, planked, a heart painted on its front.
    ...planks(8, 20, 48, 24, w, 6, 2), F(R(8, 20, 48, 2.4, w.hi)), F(R(8, 41.6, 48, 2.4, w.deep)),
    R(6, 19, 3, 25, WOOD_DK), R(55, 19, 3, 25, WOOD_DK),
    F(E(29.4, 30, 3, 3, '#ff8fb0')), F(E(34.6, 30, 3, 3, '#ff8fb0')), F(T([[26.6, 31], [37.4, 31], [32, 36.6]], '#ff8fb0')),
  ];
});

// ---------- The sweet kitchen ----------
const kitchenArt = () => art('mg-kitchen', 152, 124, () => {
  const wall = '#f3dcb4';
  const out = [
    R(14, 50, 124, 74, wall), F(R(14, 50, 124, 3, ramp(wall).hi)),
    F(R(14, 53, 124, 7, ramp(wall).sh)),
    F(R(14, 53, 8, 71, ramp(wall).hi)),
    F(R(128, 53, 10, 71, ramp(wall).sh)),
    // Timber frame.
    R(12, 48, 5, 76, WOOD_DK), R(135, 48, 5, 76, WOOD_DK), F(R(14, 104, 124, 3, WOOD_DK)),
    ...gable(2, 150, 52, 8, '#d0705a', 11),
    F(R(70, 24, 12, 4, '#e08a74')), F(R(2, 49, 148, 2, '#e8927c')),
    // The serving window: the warm dark of the kitchen, a counter, the pot.
    R(24, 64, 56, 32, '#6a4a3a'), F(R(24, 64, 56, 6, '#8a6048')), R(20, 94, 64, 5, WOOD), F(R(20, 94, 64, 1.2, ramp(WOOD).hi)),
    E(44, 92, 11, 6, '#5a5a6a'), F(E(41, 90, 4, 1.6, '#8a8aa0')), R(40, 84, 8, 3, '#4a4a58'), E(64, 92, 6, 4, MOCHI), E(70, 93, 4, 3, '#ffe4ec'),
    // The door (the noren hangs over it, drawn live).
    R(96, 62, 32, 58, '#7a5040'), F(R(98, 64, 2, 54, '#9a6a54')),
    // The chimney.
    R(114, 10, 11, 26, '#b08a78'), F(R(114, 10, 11, 3, '#c8a290')),
    // A sack of rice leaning on the wall, a stack of firewood beside the door, and a water barrel
    // under a split-bamboo gutter that runs off the eaves - the same water as the channel outside.
    E(142, 114, 6.4, 6.4, '#efe6d2'), F(E(140, 111, 2.6, 1.6, '#fbf6ea')), F(R(139, 106.5, 6, 2, '#c8b89a')),
    // (Both of these stood clear of the ground: their boxes ended at 120 and 116 while the art's
    // own floor is 124, so they hung in the air. They sit on it now, and the gutter was lengthened
    // to meet the barrel where it actually is.)
    R(16, 108, 22, 16, '#8a6a48'),
    ...[0, 1, 2, 3].flatMap((i) => [F(E(20 + (i % 2) * 11, 111 + Math.floor(i / 2) * 7, 4.6, 3.2, '#b08a60')),
      F(E(20 + (i % 2) * 11, 111 + Math.floor(i / 2) * 7, 2.4, 1.6, '#d8b288'))]),
    F(limb(135, 50, 135, 104, 1.8, 1.8, '#9ab06a')),
    R(126, 104, 18, 20, '#6f5a42'), F(R(126, 104, 18, 2.4, '#8a7254')),
    F(R(126, 110, 18, 1.6, '#9aa2a8')), F(R(126, 119, 18, 1.6, '#9aa2a8')),
    F(E(135, 106, 7, 2.4, '#7fb8cc')), F(E(133, 105.6, 3, 1, '#cfeef6')),
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
    // The dome is a mochi, so it takes the light like one: a crescent of shade hugging its far
    // edge and a lit sweep along the near shoulder, never a flat white lump.
    F(T([...dome.slice(12, 21), ...dome.slice(12, 21).map(([dx, dy]) => [92 + (dx - 92) * 0.9, 142 + (dy - 142) * 0.9]).reverse()], ramp(MOCHI).sh)),
    F(T([...dome.slice(3, 11), ...dome.slice(3, 11).map(([dx, dy]) => [92 + (dx - 92) * 0.88, 142 + (dy - 142) * 0.88]).reverse()], ramp(MOCHI).hi)),
    // Blush on its cheeks, like a mochi.
    F(E(38, 116, 10, 4, '#ffd0da')), F(E(146, 116, 10, 4, '#ffd0da')),
    // The thatch cap and the sprout on top.
    E(92, 52, 30, 12, KINAKO), F(E(84, 48, 14, 4, ramp(KINAKO).hi)), F(R(64, 56, 56, 2, ramp(KINAKO).sh)),
    F(limb(92, 42, 94, 20, 3, 2.4, '#5aa04a')),
    // The round door and its frame, a little window in it.
    T([[74, 142], [74, 116], [78, 104], [92, 98], [106, 104], [110, 116], [110, 142]], '#c8845a'), F(R(91, 100, 2, 42, '#a86a44')),
    F(E(92, 114, 4, 4, '#ffe6a8')), F(E(104, 124, 1.6, 1.6, '#ffe6a8')),
    // Round windows with warm light, and flower boxes under them.
    E(42, 96, 11, 11, WOOD), E(42, 96, 8, 8, '#ffe6a8'),
    // A little curtain drawn across the top of each, the way a nursery's would be.
    F(T([[34, 92], [50, 92], [49, 96], [42, 93.6], [35, 96]], '#ffd0da')), F(T([[34, 92], [50, 92], [50, 93.4], [34, 93.4]], '#ffe8ee')),
    F(R(41, 88, 2, 16, WOOD)), F(R(34, 95, 16, 2, WOOD)),
    E(142, 96, 11, 11, WOOD), E(142, 96, 8, 8, '#ffe6a8'),
    F(T([[134, 92], [150, 92], [149, 96], [142, 93.6], [135, 96]], '#ffd0da')), F(T([[134, 92], [150, 92], [150, 93.4], [134, 93.4]], '#ffe8ee')),
    F(R(141, 88, 2, 16, WOOD)), F(R(134, 95, 16, 2, WOOD)),
    R(30, 107, 24, 5, WOOD_DK), R(130, 107, 24, 5, WOOD_DK),
    ...[[33, SAKURA], [38, '#fff0a0'], [44, SAKURA], [50, '#ffffff'], [133, '#c8b4f0'], [139, SAKURA], [145, '#fff0a0'], [151, '#c8b4f0']].map(([x, c]) => F(E(x, 106, 2, 2, c))),
    // The doorstep, with flat stones trodden into the grass in front of it, and a little bell on a
    // bracket by the door for when a Mochi wants letting in.
    R(70, 140, 44, 4, STONE), F(R(70, 140, 44, 1.4, ramp(STONE).hi)),
    ...[[58, 141], [44, 142.4], [128, 141], [142, 142.4]].map(([sx, sy]) => F(E(sx, sy, 7, 2.4, STONE))),
    F(limb(112, 104, 119, 104, 1.4, 1.2, WOOD_DK)),
    F(E(119, 108, 3.4, 3.6, '#e8c470')), F(E(118, 106.6, 1.2, 1.2, '#fff0c0')), F(E(119, 111.4, 1, 1.6, '#b08a3a')),
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
// The landmark of the orchard, with the swing hung off its long bough. (Redrawn 2026-11-14: the
// player called it out of place, and it was - it was the one dark, saturated thing on a screen of
// pastels, and at this size its canopy came out as a single green cloud and its trunk as a flat
// brown slab beside the little fruit trees, which are the same helpers done small.) So: the same
// greens and browns as the fruit trees, only a shade deeper for its age; a canopy of many small
// clumps in a dome, lit along its top and open in two places so you see sky through it; a trunk
// that swells into three roots with gaps between them; and bark ridges up the trunk so its face
// has something to read at this size.
const BIG_LEAF = '#8ac96e';
const BIG_WOOD = '#a87850';
const bigTreeArt = () => art('mg-bigtree', 260, 236, () => {
  const r = ramp(BIG_WOOD);
  const out = [];
  // Three roots arching out of the ground, with earth showing between them, and the trunk swelling
  // into them: a tree this old is held down, not stood on a post.
  for (const [path, w0, seed] of [
    [[[128, 196], [104, 218], [84, 234]], 11, 1],
    [[[128, 196], [150, 216], [172, 234]], 11, 2],
    [[[128, 200], [120, 220], [112, 236]], 8, 7],
    [[[128, 200], [140, 222], [148, 236]], 7, 8],
  ]) out.push(...bark(path, (u) => w0 - u * (w0 - 3.5), r, seed, 1));
  // The trunk: wide at its foot, narrowing fast, then holding, with a slow lean out of true.
  out.push(...bark([[128, 232], [127, 200], [129, 168], [132, 136], [129, 112]], (u) => 30 - u * 15, r, 3, 4));
  // A broad band of sun down the left of the trunk, and the shade it turns into on the right: a
  // trunk this wide needs its round read across the whole face, not just at its two edges.
  out.push(F(band([[108, 230], [107, 190], [109, 150], [112, 118]], (u) => 7 - u * 3, mix(r.base, r.hi, 0.45))));
  out.push(F(band([[100, 228], [99, 192], [101, 158]], (u) => 3.4 - u * 1.4, mix(r.base, r.hi, 0.72))));
  out.push(F(band([[146, 228], [148, 190], [150, 150], [148, 120]], (u) => 6 - u * 2.6, mix(r.base, r.sh, 0.55))));
  // Bark ridges running up its face, each starting and stopping on its own, so the wood reads.
  for (const [i, [x0, y0, y1, w]] of [[116, 226, 132, 2.4], [124, 206, 120, 1.8], [136, 230, 150, 2.2], [142, 200, 128, 1.6], [130, 188, 140, 1.3], [152, 214, 170, 1.5]].entries()) {
    out.push(F(band([[x0, y0], [x0 + 1.5 + i * 0.4, (y0 + y1) / 2], [x0 + 1, y1]], (u) => w * Math.sin(Math.PI * (0.1 + u * 0.8)), mix(r.base, r.deep, 0.45 + (i % 3) * 0.14))));
  }
  // Two old growth seams low down, where the trunk has thickened over the years.
  for (const [cx, cy, rx] of [[126, 218, 15], [130, 204, 11]]) out.push(F(band([[cx - rx, cy], [cx, cy + 2.2], [cx + rx, cy - 0.6]], (u) => 1.1 * Math.sin(Math.PI * (0.1 + u * 0.8)), mix(r.base, r.deep, 0.4))));
  // The long bough out to the right that the swing hangs from, one up to the left, and a short one
  // between them, so the canopy has something holding it up.
  out.push(...bark([[132, 128], [170, 112], [214, 108], [236, 110]], (u) => 9 - u * 5, r, 4, 2));
  out.push(...bark([[124, 122], [92, 96], [70, 84]], (u) => 8 - u * 4, r, 5, 1));
  out.push(...bark([[130, 124], [146, 98], [152, 80]], (u) => 6 - u * 3, r, 6, 1));
  // The canopy: a dome of small clumps, the same size of leaf as the fruit trees so it belongs to
  // the same orchard, lit along the top and left where the light comes from.
  const leaf = ramp(BIG_LEAF);
  const lit = ramp(mix(BIG_LEAF, '#ffffff', 0.22));
  const CLUMPS = [
    [60, 88, 30, 21, 0], [96, 100, 28, 19, 0], [168, 96, 30, 20, 0], [206, 92, 28, 19, 0],
    [78, 62, 34, 23, 1], [128, 86, 34, 22, 0], [182, 64, 33, 22, 1],
    [108, 46, 36, 24, 1], [152, 44, 34, 23, 1], [130, 24, 30, 20, 1],
  ];
  for (const [i, [cx, cy, rx, ry, top]] of CLUMPS.entries()) out.push(...foliage(cx, cy, rx, ry, top ? lit : leaf, 11 + i * 3.1, { tips: 4 }));
  // A hollow in the trunk with a worn lip round it, and moss where the roots meet the ground.
  out.push(E(120, 176, 7, 10, mix(r.deep, '#ffffff', 0.18)));
  out.push(F(E(120, 177, 4.6, 7, '#4a3024')));
  out.push(F(E(118.6, 174.6, 2, 2.6, '#2e1c14')));
  for (const [mx, my, mr] of [[100, 226, 7], [156, 228, 6], [132, 232, 5]]) out.push(F(E(mx, my, mr, 2.4, '#7fc06a')), F(E(mx - mr * 0.3, my - 0.9, mr * 0.5, 1, '#a2d98a')));
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
  // The mist it throws up off the rock, drifting out from the face and thinning as it rises.
  for (let i = 0; i < 7; i++) {
    const u = ((time * 0.26 + i / 7) % 1);
    ctx.globalAlpha = 0.3 * (1 - u) * (0.5 + 0.5 * Math.sin(time + i));
    ctx.fillStyle = '#eaf8ff';
    ctx.beginPath();
    ctx.ellipse(x - 8 + Math.sin(time * 0.5 + i * 2) * 10 - u * 14, ledge - 10 - u * 46, 10 + u * 16, 5 + u * 7, 0, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
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
  // The trestle it stands on, down on the strip of shore at the foot of the cliff: two legs
  // splayed out, a brace across them, and a rope lashing where they take the pipe.
  const tx = x - 140;
  const tTop = ledge + 7;
  for (const [dx0, dx1] of [[-5, -17], [5, 17]]) {
    ctx.strokeStyle = WOOD_DK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(snap(tx + dx0), snap(tTop));
    ctx.lineTo(snap(tx + dx1), snap(pond));
    ctx.stroke();
    ctx.strokeStyle = WOOD;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(snap(tx + dx0 - 0.6), snap(tTop));
    ctx.lineTo(snap(tx + dx1 - 0.6), snap(pond));
    ctx.stroke();
  }
  // One tie across it and one diagonal brace: two rungs made it read as a step ladder.
  const legX = (k, side) => tx + side * (5 + 12 * k);
  const legY = (k) => tTop + (pond - tTop) * k;
  ctx.strokeStyle = WOOD_DK;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(snap(legX(0.62, -1)), snap(legY(0.62)));
  ctx.lineTo(snap(legX(0.62, 1)), snap(legY(0.62)));
  ctx.moveTo(snap(legX(0.62, -1)), snap(legY(0.62)));
  ctx.lineTo(snap(legX(0.26, 1)), snap(legY(0.26)));
  ctx.stroke();
  ctx.fillStyle = '#e8d8b8';
  ctx.fillRect(snap(tx - 8), snap(tTop - 3), 16, 3.4);
  ctx.fillStyle = '#cdbb94';
  ctx.fillRect(snap(tx - 8), snap(tTop - 3), 16, 1.2);
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
    // (Its prop is drawn live, in falls(): a stub in here ended in mid air, a long way above the
    // ground it was meant to be standing on.)
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
const GLIDE_BOARD = { x: 2706, y: 380, w: 70 };
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
    // The plaque: a racing mochi, and RACES lettered beside it (drawGardenPiece mg_stadium).
    R(62, 20, 60, 20, '#fff6ea'), F(R(62, 20, 60, 2, '#ffffff')), F(R(62, 38, 60, 2, '#e8d8c0')),
    F(E(74, 31, 5, 4, '#ffffff')), F(E(73, 30, 1, 1, '#5a4038')), F(E(76, 30, 1, 1, '#5a4038')), F(R(66, 30, 3, 1, '#9fd0f0')), F(R(65, 33, 4, 1, '#9fd0f0')),
  ];
  return out;
});

// ---------- The earth under the ledges ----------
// The inside of a high ledge, seen from below (by the pond, under the Moonmortar): instead of a
// plain sheet of dirt, gentle bands of rock laid down over the years, stones with moss on their
// tops, roots hanging from the grass above, and on the big one a little burrow where glowing
// mushrooms grow. `extra`: { left, right, top, bottom, seed, burrow }.
const earthWallArt = (e) => art(`mg-earthwall|${e.left}|${e.top}|${e.seed}`, e.right - e.left, e.bottom - e.top, () => {
  const W = e.right - e.left;
  const H = e.bottom - e.top;
  let s = e.seed ?? 1;
  const rnd = () => (s = hash(s * 1.37 + 0.71)) ;
  const out = [];
  // Rock bands, each a soft wave across, a lighter seam on top.
  // (At the same heights in the world on every piece, so the layers run on from one ledge's earth
  // into the next.)
  for (const [wy, th] of [[428, 12], [510, 16], [612, 12], [700, 18], [800, 12]]) {
    const depth = wy - e.top;
    if (depth < 10 || depth > H - 10) continue;
    const pts = [];
    for (let x = -4; x <= W + 4; x += 12) pts.push([x, depth + Math.sin((x + e.left) / 38 + wy) * 4]);
    const lower = [...pts].reverse().map(([x, y]) => [x, y + th + Math.sin((x + e.left) / 23 + wy) * 2]);
    out.push(F(T([...pts, ...lower], '#d2a47c')));
    out.push(F(T([...pts, ...pts.slice().reverse().map(([x, y]) => [x, y + 1.6])], '#efd2ae')));
  }
  // Stones set in the earth, the higher ones with a little moss.
  for (let i = 0; i < Math.round(W * H / 9000); i++) {
    const x = 10 + rnd() * (W - 20);
    const y = 24 + rnd() * (H - 40);
    const r = 4 + rnd() * 6;
    out.push(E(x, y, r * 1.3, r, '#c9b8a4'), F(E(x - r * 0.3, y - r * 0.35, r * 0.7, r * 0.4, '#ddd0c0')), F(E(x + r * 0.2, y + r * 0.5, r, r * 0.3, '#a8977f')));
    if (y < 120) out.push(F(E(x, y - r * 0.75, r * 1.05, r * 0.35, '#9fcf7a')));
  }
  // Roots trailing down from the grass above.
  for (let i = 0; i < Math.max(2, Math.round(W / 50)); i++) {
    let x = 12 + rnd() * (W - 24);
    let y = 6;
    const len = 18 + rnd() * 34;
    for (let k = 0; k < 4; k++) {
      const nx = x + (rnd() - 0.5) * 10;
      const ny = y + len / 4;
      out.push(F(limb(x, y, nx, ny, 1.4 - k * 0.25, 1.2 - k * 0.25, '#a2704a')));
      [x, y] = [nx, ny];
    }
  }
  // The burrow: a round den, its rim, and mushrooms glowing softly inside.
  if (e.burrow) {
    const [bx, by] = e.burrow;
    out.push(E(bx, by, 22, 15, '#6a4a38'), E(bx, by + 1, 18, 12, '#3e2a22'), F(E(bx, by - 9, 16, 4, '#8a6448')));
    for (const [mx, h, c] of [[-8, 7, '#ff9ab0'], [-1, 10, '#9fd0f0'], [7, 6, '#ffd75e']]) {
      out.push(F(R(bx + mx - 0.8, by + 12 - h, 1.6, h, '#fff6ea')), F(E(bx + mx, by + 12 - h, 3.6, 2.4, c)), F(E(bx + mx - 1, by + 11 - h, 1, 0.6, '#ffffff')));
    }
    out.push(F(E(bx, by + 10, 14, 2, '#6a4a38')));
  }
  return out;
});

// ---------- The nursery inside ----------
// (Two colours blended, for the room's shading.)
function mixWall(a, b, k) {
  const v = (c, i) => parseInt(c.slice(1 + i * 2, 3 + i * 2), 16);
  const t = Math.max(0, Math.min(1, k));
  return `#${[0, 1, 2].map((i) => Math.round(v(a, i) + (v(b, i) - v(a, i)) * t).toString(16).padStart(2, '0')).join('')}`;
}

// ---------- Inside the nursery ----------
// Drawn from scratch, 2026-11-14, to the art standard (CLAUDE.md): one light from the upper left,
// one big shape (the domed room itself), a few medium ones (hearth, window, the row of cots, the
// shelves) and small detail only where the eye should go. Everything rests on something and casts
// its own contact shadow; nothing is a flat cut-out and nothing is a stamped copy of its neighbour.
// The parts that move - the fire and its light, the kettle's steam, the bunting, the mobile over
// the cots, the dust in the window's beam - are NOT in this sprite: they are drawn live underneath,
// in nurseryLife, so the room breathes.
//
// The art is 1:1 with the map (760 x 400, floor at y 360), placed by its bottom centre.
const NUR = {
  plaster: '#fdf2e6',
  plasterSh: '#f3e0cc',
  plasterDeep: '#e8cdb4',
  beam: '#c69a6e',
  beamDk: '#a07249',
  beamLit: '#dfb98c',
  brick: '#cf9478',
  brickDk: '#b87a60',
  brickLit: '#e2ab8c',
  mortar: '#edd2bc',
  hearthDark: '#3c261f',
  floor: '#e9cba6',
  floorDk: '#d6b084',
  floorLit: '#f6e0bf',
  skirt: '#dcbb95',
  rug: '#f6bdcb',
  rugLit: '#ffd9e2',
  rugDeep: '#e5a2b6',
  cream: '#fdf6ea',
  iron: '#7d8a90',
  ironLit: '#aab8bd',
};
// Everything in the nursery that moves, drawn over the room (ox, oy is the art's top left on
// screen). The art standard asks that the world breathes: so the fire licks and throws its light
// about the brick, the kettle steams, the bunting sways each flag on its own beat, a mobile turns
// slowly over the cots, and the sun through the round window lays a soft beam across the floor with
// dust turning in it. Everything eases and is phased off its own position, so nothing moves in
// lockstep and nothing snaps.
function nurseryLife(ctx, ox, oy, time, night, heat = 0) {
  const N = NUR;
  const day = 1 - Math.min(1, night);
  // --- The bunting, strung from the ribs either side of the window. Each flag swings on its own
  // phase, the ones in the middle of a sag swinging widest.
  for (const [x0, x1, seed] of [[36, 300, 1], [520, 724, 2]]) {
    const n = Math.round((x1 - x0) / 30);
    ctx.strokeStyle = '#c8a888';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const px = ox + x0 + (x1 - x0) * u;
      const py = oy + 84 + Math.sin(u * Math.PI) * 22 + Math.sin(time * 0.7 + seed) * 1.6 * Math.sin(u * Math.PI);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n;
      const px = ox + x0 + (x1 - x0) * u;
      const py = oy + 84 + Math.sin(u * Math.PI) * 22 + Math.sin(time * 0.7 + seed) * 1.6 * Math.sin(u * Math.PI);
      const sway = Math.sin(time * 1.1 + i * 0.9 + seed) * 0.13 * Math.sin(u * Math.PI);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(sway);
      ctx.fillStyle = [SAKURA, '#a8dcc0', KINAKO, '#c8b4f0', '#9fd0f0'][(i + seed) % 5];
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 13);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(-8, 0, 16, 1.6);
      ctx.restore();
    }
  }

  // --- The sun through the round window: a soft beam down onto the floor, with dust turning in it.
  if (day > 0.05) {
    ctx.save();
    ctx.globalAlpha = day * (0.2 + 0.03 * Math.sin(time * 0.6));
    const g = ctx.createLinearGradient(0, oy + 150, 0, oy + 372);
    g.addColorStop(0, 'rgba(255,240,205,0.95)');
    g.addColorStop(1, 'rgba(255,238,200,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(ox + 344, oy + 158);
    ctx.lineTo(ox + 416, oy + 158);
    ctx.lineTo(ox + 470, oy + 372);
    ctx.lineTo(ox + 300, oy + 372);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    for (let i = 0; i < 14; i++) {
      const u = ((time * 0.055 + hash(i * 3.7)) % 1);
      const drift = Math.sin(time * 0.5 + i * 1.7) * 9;
      const mx = ox + 356 + hash(i * 5.3) * 52 + drift + u * 22;
      const my = oy + 164 + u * 200;
      ctx.globalAlpha = day * Math.sin(u * Math.PI) * 0.5;
      ctx.fillStyle = '#fff6d8';
      ctx.fillRect(mx, my, 1.4, 1.4);
    }
    ctx.globalAlpha = 1;
  }

  // --- The fire: its light on the brick and the floor first, then the flames themselves.
  const fx = ox + 210;
  const fy = oy + 352;
  const lick = flicker(time, 3);
  glow(ctx, fx, fy - 26, 86 + lick * 10, '#ffb070', 0.3 + 0.12 * lick);
  ctx.save();
  ctx.globalAlpha = 0.16 + 0.07 * lick;
  ctx.fillStyle = '#ffbe84';
  ctx.beginPath();
  ctx.ellipse(fx, oy + 368, 104, 13, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  hearthFire(ctx, fx, fy, time);

  // --- The kettle stands on the hearthstone (it is painted into the room), so what moves here is
  // its steam, curling up the face of the brick and thinning as it goes. (The hearth is the sweet
  // kitchen: while you cook at it, `heat`, the kettle comes up to a rolling steam.)
  const puffs = 4 + Math.round(4 * heat);
  for (let i = 0; i < puffs; i++) {
    const u = (time * (0.3 + 0.25 * heat) + i / puffs) % 1;
    const sx = ox + 278 + Math.sin(u * 5 + i * 1.6) * (2 + u * 8);
    const sy = oy + 328 - u * 56;
    ctx.globalAlpha = Math.min(1, u * 5) * (1 - u) ** 1.3 * 0.5;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sx, sy, 2.2 + u * 5, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // --- A mobile over the second cot, turning slowly: three little shapes on their own threads,
  // each swinging a beat after the one before it. Its cord runs right up to the dome overhead, so
  // you can see what holds it. (It used to start in mid air beside the shelves.)
  const mx0 = ox + 473;
  const my0 = oy + 80;
  const turn = Math.sin(time * 0.33);
  ctx.strokeStyle = '#c8a888';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(mx0, oy + 59);
  ctx.lineTo(mx0, my0 + 16);
  ctx.stroke();
  ctx.save();
  ctx.translate(mx0, my0 + 16);
  ctx.rotate(turn * 0.12);
  ctx.strokeStyle = '#c8a888';
  ctx.beginPath();
  ctx.moveTo(-26, 0);
  ctx.lineTo(26, 0);
  ctx.stroke();
  [[-26, SAKURA], [0, '#a8dcc0'], [26, KINAKO]].forEach(([dx, c], i) => {
    const hang = 12 + i * 4;
    const tilt = Math.sin(time * 0.33 + i * 0.8) * 0.2;
    ctx.save();
    ctx.translate(dx, 0);
    ctx.rotate(tilt);
    ctx.strokeStyle = '#c8a888';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, hang);
    ctx.stroke();
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(0, hang + 6, 7, 6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(-2.2, hang + 4.4, 2.4, 1.7, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}

const BED_BLANKETS = ['#bfe2f6', '#ffd9e6', '#d8f0c8', '#ffeeb8'];
// A contact shadow on the nursery's painted floor. It has to be a hex colour: the art pipeline
// shades and mixes everything it is given, and an rgba string comes out of that as bright magenta -
// which is what the first version of this room laid along its whole floor.
const SHADE_FLOOR = '#e3c7a6';

const nurseryRoomArt = () => art('mg-nurseryroom', 760, 400, () => {
  const N = NUR;
  const out = [];
  // ---- The shell: a round room. The wall curves in overhead, so the ceiling is an arc and the
  // corners fall away into shade. This is the one big shape everything else sits inside.
  // (F: flat. The light pass shades a shape in cel steps, and on a shape this size that is one
  // hard edge straight down the wall - the seam that used to cut the room in two. The wall's
  // shading is all painted by hand below: the dome's band, and the corners falling away.)
  out.push(F(R(0, 0, 760, 400, N.plaster)));
  const dome = [];
  for (let i = 0; i <= 28; i++) {
    const u = i / 28;
    const x = u * 760;
    dome.push([x, 118 - Math.sin(u * Math.PI) * 64]);
  }
  out.push(F(T([[0, 0], [760, 0], ...dome.slice().reverse()], N.plasterDeep)));
  out.push(F(T([[0, 0], [230, 0], [120, 86], [0, 116]], mixWall(N.plasterDeep, '#c49a7c', 0.52))));
  out.push(F(T([[530, 0], [760, 0], [760, 116], [640, 86]], mixWall(N.plasterDeep, '#c49a7c', 0.52))));
  // The ceiling's ribs, radiating from the crown to the wall: timber, lit on their left.
  for (const u of [0.12, 0.3, 0.5, 0.7, 0.88]) {
    const x0 = 380 + (u - 0.5) * 120;
    const x1 = u * 760;
    const y1 = 96 - Math.sin(u * Math.PI) * 78;
    out.push(F(limb(x0, 6, x1, y1 + 4, 5, 3.4, N.beam)));
    out.push(F(limb(x0 - 1.2, 6, x1 - 1.2, y1 + 4, 1.6, 1, N.beamLit)));
  }
  out.push(F(E(380, 8, 26, 9, N.beamDk)), F(E(380, 6, 22, 7, N.beam)), F(E(374, 4, 9, 3, N.beamLit)));

  // (The map paints its own floor from the ground line down, so nothing is drawn below y 360 here:
  // the first try put boards and a rug down there and none of it could be seen.)
  // The skirting the wall sits on.
  out.push(F(R(0, 344, 760, 14, N.skirt)), F(R(0, 344, 760, 2.4, mixWall(N.skirt, '#ffffff', 0.5))));
  out.push(F(R(0, 356, 760, 2, mixWall(N.skirt, '#000000', 0.12))));

  // ---- The hearth, left of centre: the room's warm heart and its second big shape. Everything
  // around it rests on the hearthstone or on the floor - nothing is left hanging off the brick.
  const HX = 210;
  out.push(F(E(HX, 361, 104, 8, SHADE_FLOOR)));
  // The breast, in brick courses; the mortar shows between them, and the left face catches the light.
  out.push(F(R(HX - 62, 198, 124, 160, N.mortar)));
  for (let r = 0; r < 11; r++) {
    const y = 202 + r * 14;
    for (let c = 0; c < 7; c++) {
      const bw = 18;
      const bx = HX - 60 + ((r % 2) * bw) / 2 + c * bw;
      if (bx + 2 > HX + 60) continue;
      const w = Math.min(bw - 3, HX + 60 - bx);
      if (w < 4) continue;
      out.push(F(R(bx, y, w, 11, (r + c) % 3 === 0 ? N.brickDk : N.brick)));
      out.push(F(R(bx, y, w, 2.4, (r + c) % 3 === 0 ? N.brick : N.brickLit)));
    }
  }
  // Its mouth: an arch, dark inside, with a stone lintel over it and a hearthstone in front.
  out.push(R(HX - 34, 272, 68, 86, N.hearthDark), E(HX, 272, 34, 26, N.hearthDark));
  out.push(F(E(HX, 274, 29, 21, mixWall(N.hearthDark, '#000000', 0.35))), F(R(HX - 29, 286, 58, 72, mixWall(N.hearthDark, '#000000', 0.35))));
  out.push(F(R(HX - 44, 238, 88, 9, '#d8c6b2')), F(R(HX - 44, 238, 88, 2.4, '#efe2d2')));
  out.push(F(R(HX - 70, 350, 140, 10, '#cfc2b0')), F(R(HX - 70, 350, 140, 2.6, '#e8ddcd')));
  // The mantel shelf, with a candle, a jar of sweets and a framed photo on it.
  out.push(R(HX - 74, 186, 148, 11, N.beam), F(R(HX - 74, 186, 148, 2.6, N.beamLit)), F(R(HX - 74, 195, 148, 2, N.beamDk)));
  // (A cream candle on a cream wall was invisible: only its flame showed, as a yellow bead in the
  // air. It stands in a brass candlestick now, and the candle itself is outlined.)
  out.push(F(E(HX - 50, 186, 7.5, 2.6, '#d8ae62')), F(E(HX - 50, 184.6, 7.5, 1.4, '#efcb8c')));
  out.push(F(R(HX - 52, 179, 4, 7, '#e8c07a')), F(E(HX - 50, 179, 5, 1.8, '#efcb8c')));
  out.push(R(HX - 52.6, 167, 5.2, 13, '#fdf6ea'), F(R(HX - 52.6, 167, 1.8, 13, '#ffffff')));
  out.push(F(E(HX - 50, 163.4, 2.2, 3.6, '#ffc46a')), F(E(HX - 50, 164, 1.1, 1.9, '#fff3c8')));
  out.push(F(R(HX + 20, 164, 20, 22, '#cfe6f2')), F(R(HX + 20, 164, 20, 3, '#eaf6fb')), F(R(HX + 18, 160, 24, 5, N.beamDk)));
  for (const [dx, dy, c] of [[26, 174, SAKURA], [33, 178, MATCHA], [30, 170, KINAKO]]) out.push(F(E(HX + dx, dy, 4, 3.4, c)));
  out.push(F(R(HX - 20, 162, 26, 24, '#a98059')), F(R(HX - 17, 165, 20, 18, N.cream)));
  out.push(F(E(HX - 7, 174, 7, 6, SAKURA)), F(E(HX - 9.4, 172.6, 2, 1.5, '#ffffff')));
  // The fire iron leans on the left cheek of the brick and stands on the hearthstone.
  out.push(F(limb(HX - 48, 302, HX - 40, 349, 2.2, 1.6, N.iron)));
  out.push(F(E(HX - 48, 298, 4.4, 4.4, N.iron)), F(E(HX - 48, 298, 2.2, 2.2, N.brick)), F(E(HX - 49.4, 296.6, 1.4, 1.2, N.ironLit)));
  // The kettle, sitting on the hearthstone to the right of the fire. (It used to hang from a hook
  // bolted to thin air just past the brick, which is what made it read as floating.) Its steam is
  // drawn live, rising up the face of the brick.
  out.push(F(E(HX + 50, 340, 13, 10.5, '#bcdcee')), F(E(HX + 50, 345.5, 11, 5, '#9bc4da')));
  out.push(F(E(HX + 46, 335, 4.6, 3, '#e6f4fc')));
  out.push(F(limb(HX + 60, 334, HX + 71, 327, 4.6, 2.2, '#9bc4da')), F(E(HX + 71, 326.4, 2.6, 2, '#cfe6f2')));
  out.push(F(R(HX + 43, 325.6, 14, 4.6, '#bcdcee')), F(R(HX + 43, 325.6, 14, 1.6, '#e6f4fc')));
  out.push(F(E(HX + 50, 323.6, 3, 2.2, N.cream)));
  out.push(F(limb(HX + 40, 327, HX + 44, 317, 1.8, 1.6, N.iron)), F(limb(HX + 44, 317, HX + 56, 317, 1.6, 1.6, N.iron)), F(limb(HX + 56, 317, HX + 60, 327, 1.6, 1.8, N.iron)));
  // A basket of split logs beyond the hearthstone, standing on the floor. The logs lean up out of
  // it, so they read as firewood: stacked end-on they came out looking like a basket of buns.
  const BX = HX + 100;
  out.push(E(BX, 350, 22, 11, '#b2854f'));
  for (const [x0, x1, y1, lw, c] of [[BX - 9, BX - 17, 327, 5.4, '#c2945f'], [BX - 2, BX - 5, 319, 5.8, '#ab7f4e'], [BX + 5, BX + 11, 323, 5.2, '#d3a469'], [BX + 11, BX + 19, 331, 4.6, '#b98a58']]) {
    out.push(F(limb(x0, 345, x1, y1, lw, lw * 0.94, c)));
    out.push(F(E(x1, y1 + 0.6, lw * 0.5, lw * 0.44, '#e6c69a')));
  }
  out.push(F(E(BX, 347, 21, 9, '#d3a469')));
  for (let i = 0; i < 7; i++) out.push(F(R(BX - 18 + i * 6, 343, 2, 10, '#bb8c53')));
  out.push(F(E(BX, 342, 20, 3, '#e0b67c')));

  // ---- The round window, dead centre: the room's one cool note and the eye's rest.
  const WX = 380;
  out.push(E(WX, 150, 70, 70, N.beamDk), F(E(WX, 150, 64, 64, N.beam)), F(E(WX, 150, 58, 58, '#2a3a44')));
  // (The glass itself is painted live: nurseryWindow.)
  out.push(F(R(WX - 4, 92, 8, 116, N.beam)), F(R(WX - 60, 146, 120, 8, N.beam)));
  out.push(F(R(WX - 4, 92, 2.4, 116, N.beamLit)), F(R(WX - 60, 146, 120, 2.4, N.beamLit)));
  // Its sill, with a potted sprout and a folded cloth on it.
  out.push(R(WX - 70, 212, 140, 10, N.beam), F(R(WX - 70, 212, 140, 2.6, N.beamLit)), F(R(WX - 64, 222, 128, 4, N.beamDk)));
  out.push(F(R(WX + 30, 196, 18, 16, '#dd8f5c')), F(R(WX + 28, 193, 22, 4, '#eb9d68')), F(R(WX + 30, 196, 18, 2, '# efb184'.replace(' ', ''))));
  out.push(F(E(WX + 34, 188, 7, 5.6, '#8fc46a')), F(E(WX + 44, 186, 7, 6, '#a3d47d')), F(E(WX + 39, 181, 5.6, 5, '#8fc46a')), F(R(WX + 38.6, 184, 1.6, 10, '#6aa84a')));
  out.push(F(R(WX - 50, 204, 26, 8, '#cfe6f2')), F(R(WX - 50, 204, 26, 2.4, '#eaf6fb')), F(R(WX - 50, 208, 26, 1.4, '#b7d6e6')));

  // ---- The right of the room: two shelves on the wall, and the toy chest in the far corner where
  // the floor is clear of the cots. (The chest used to stand on top of the last two cots.)
  const SX = 596;
  out.push(R(SX - 100, 196, 200, 9, N.beam), F(R(SX - 100, 196, 200, 2.4, N.beamLit)), F(R(SX - 100, 203, 200, 2, N.beamDk)));
  out.push(F(T([[SX - 92, 205], [SX - 84, 205], [SX - 88, 219]], N.beamDk)), F(T([[SX + 84, 205], [SX + 92, 205], [SX + 88, 219]], N.beamDk)));
  out.push(R(SX - 100, 262, 200, 9, N.beam), F(R(SX - 100, 262, 200, 2.4, N.beamLit)), F(R(SX - 100, 269, 200, 2, N.beamDk)));
  out.push(F(T([[SX - 92, 271], [SX - 84, 271], [SX - 88, 285]], N.beamDk)), F(T([[SX + 84, 271], [SX + 92, 271], [SX + 88, 285]], N.beamDk)));
  // On the top shelf: a row of trophies is drawn live, so only a plaque is painted in.
  out.push(F(R(SX - 28, 205, 56, 12, '#e8c890')), F(R(SX - 28, 205, 56, 1.6, '#f6dcae')), F(R(SX - 25, 214, 50, 1.2, '#c8a060')));
  // On the lower shelf: a ball, a stacking tower, a little drum and a picture book, each different.
  out.push(F(E(SX - 72, 252, 10, 10, '#ff9ab0')), F(E(SX - 75, 249, 3.6, 2.6, '#ffd3de')), F(E(SX - 72, 261, 9, 2, SHADE_FLOOR)));
  for (const [i, c] of [KINAKO, MATCHA, SAKURA].entries()) out.push(F(R(SX - 40 + i * 2, 253 - i * 9, 22 - i * 4, 9, c)), F(R(SX - 40 + i * 2, 253 - i * 9, 22 - i * 4, 2, '#ffffff')));
  out.push(F(R(SX + 6, 244, 24, 18, '#e8b06a')), F(R(SX + 6, 244, 24, 3, '#f6c88a')), F(R(SX + 6, 250, 24, 2, '#c08848')), F(E(SX + 18, 243, 12, 3, N.cream)));
  out.push(F(R(SX + 44, 240, 7, 22, '#9fc8f0')), F(R(SX + 51, 242, 7, 20, '#ffc2d4')), F(R(SX + 58, 244, 7, 18, '#cfe8b8')));
  // The toy chest in the corner, lid shut, standing on the floor on its own two feet.
  const CX = 722;
  out.push(F(E(CX, 361, 36, 7, SHADE_FLOOR)));
  // The box, its front panelled, with a foot under each end.
  out.push(R(CX - 30, 312, 60, 46, '#b07c4c'), F(R(CX - 30, 312, 60, 45, '#c08b57')));
  out.push(F(R(CX - 24, 318, 48, 33, '#cb9a66')), F(R(CX - 24, 318, 48, 2, '#dcae7d')), F(R(CX - 24, 349, 48, 2, '#a7753f')));
  out.push(F(R(CX - 28, 356, 9, 4, '#8c5f33')), F(R(CX + 19, 356, 9, 4, '#8c5f33')));
  // The lid, overhanging the box and rounded along its back.
  out.push(F(R(CX - 33, 303, 66, 11, '#c08b57')), F(E(CX, 303, 33, 5.4, '#cb9a66')));
  out.push(F(R(CX - 33, 300.6, 66, 2.4, '#dcae7d')), F(R(CX - 33, 311, 66, 3, '#a7753f')));
  // An iron strap round each corner, and the latch between them.
  for (const dx of [-26, 26]) out.push(F(R(CX + dx - 2.4, 299, 4.8, 21, N.iron)), F(R(CX + dx - 2.4, 299, 1.4, 21, N.ironLit)));
  out.push(F(R(CX - 3.6, 309, 7.2, 9, '#e8c890')), F(R(CX - 3.6, 309, 7.2, 1.6, '#f6dcae')), F(E(CX, 317, 3, 2.4, '#c8a060')));
  // Three mochi painted across the front panel.
  for (const [i] of [0, 1, 2].entries()) out.push(F(E(CX - 14 + i * 14, 338, 5.6, 4.8, [SAKURA, MATCHA, KINAKO][i])), F(E(CX - 15.8 + i * 14, 336.6, 1.8, 1.3, '#fffaf2')), F(R(CX - 14.6 + i * 14, 332, 1.3, 3.6, '#9fcf7a')));

  // ---- The cots, along the floor where the Mochi sleep. Woven baskets, each with a mattress, a
  // turned-down blanket and a pillow; the front of the rim is drawn over whoever is asleep inside.
  for (const [i, x] of NURSERY_BEDS.entries()) {
    const blanket = BED_BLANKETS[i % BED_BLANKETS.length];
    out.push(F(E(x, 361, 42, 6, SHADE_FLOOR)));
    // The basket: a woven back wall with a rolled rim along the top of it.
    out.push(E(x, 357, 38, 11, '#a97a49'));
    out.push(F(E(x, 354, 37, 9, '#cf9f63')));
    for (let k = 0; k < 11; k++) out.push(F(R(x - 33 + k * 6.6, 346, 2.4, 14, '#b9884f')));
    out.push(F(E(x, 346.6, 36, 3.4, '#dcae73')), F(E(x, 345.4, 36, 1.5, '#edc893')));
    // The mattress, the blanket turned down over it, and the pillow at the near end.
    out.push(F(E(x + 2, 348.4, 30, 3.6, N.cream)));
    out.push(F(E(x + 5, 349.4, 26, 3.4, blanket)));
    out.push(F(E(x + 5, 347.8, 26, 1.6, mixWall(blanket, '#ffffff', 0.55))));
    out.push(F(E(x - 19, 347.8, 10, 3.2, N.cream)), F(E(x - 19, 346.6, 10, 1.4, '#ffffff')));
  }

  // ---- The way out, on the left: an arched door in a timber frame, with a mat in front of it.
  out.push(R(48, 288, 64, 72, N.beamDk), E(80, 288, 32, 26, N.beamDk));
  out.push(F(R(54, 293, 52, 67, '#b47f4e')), F(E(80, 293, 26, 21, '#b47f4e')));
  out.push(F(R(58, 296, 44, 62, '#c7925c')), F(E(80, 296, 22, 18, '#c7925c')));
  out.push(F(R(79, 282, 2.4, 78, '#9a6b3c')));
  out.push(F(E(95, 326, 3.4, 3.4, '#f0c768')), F(E(94.2, 325, 1.2, 1.2, '#fff1c8')));
  out.push(F(E(80, 362, 34, 6, '#cfa9c2')), F(E(80, 361, 30, 4.6, '#e8c6dc')));

  // (A big oval rag rug used to lie across this floor. It ran over the hearthstone, the door mat
  // and the first two cots at once, so the floor read as a heap of overlapping shapes: it is gone,
  // and every piece on the floor now has clear ground of its own.)

  // ---- A peg rail over the door with the babies' things on it, a knitted cap and a bib. (It used
  // to hang between the window and the shelves, where it ran straight into the shelf and its
  // bracket; the wall over the door was the one big bare stretch in the room.)
  out.push(R(34, 230, 86, 7, N.beam), F(R(34, 230, 86, 2, N.beamLit)), F(R(34, 235, 86, 1.6, N.beamDk)));
  for (const px of [56, 98]) out.push(F(R(px - 1.6, 237, 3.2, 7, N.beamDk)), F(E(px, 245, 3, 2.6, N.beam)));
  // A little knitted jumper, sleeves out, with a ribbed collar and hem.
  out.push(F(T([[48, 246], [64, 246], [65.4, 263], [46.6, 263]], '#ffc2d4')));
  out.push(F(R(39, 247, 10, 5.4, '#ffc2d4')), F(R(63, 247, 10, 5.4, '#ffc2d4')));
  out.push(F(R(39, 250.4, 10, 2, '#ffd9e4')), F(R(63, 250.4, 10, 2, '#ffd9e4')));
  out.push(F(R(51.4, 243.6, 9.2, 3.4, '#ffd9e4')), F(E(56, 245.4, 4, 1.6, '#ff9fbb')));
  out.push(F(R(46.6, 258.6, 18.8, 4.4, '#ffd9e4')));
  for (let i = 0; i < 6; i++) out.push(F(R(47.6 + i * 3.2, 259.4, 1.1, 3, '#ffc2d4')));
  // The bib, with its tie over the peg.
  out.push(F(T([[90, 246], [106, 246], [108, 264], [88, 264]], '#cfe6f2')), F(E(98, 246, 9, 3, '#eaf6fb')), F(E(98, 252, 4, 3.4, '#ffffff')));

  // ---- A framed drawing on the wall over the toy chest: somebody small has drawn their house,
  // with a heart over the roof and a stripe of sky above it.
  out.push(R(698, 236, 52, 58, '#a98059'), F(R(701, 239, 46, 52, N.cream)));
  out.push(F(T([[724, 256], [714, 245], [718.6, 241], [724, 245.6], [729.4, 241], [734, 245]], '#ff8fb0')));
  out.push(F(T([[710, 271], [738, 271], [724, 259]], '#ff9a8c')), F(T([[710, 271], [738, 271], [724, 268]], '#ffb6a6')));
  out.push(F(R(713, 271, 22, 14, '#ffe2b8')), F(R(713, 271, 22, 2, '#fff2d8')));
  out.push(F(R(721, 277, 6, 8, '#c88a5a')), F(E(725.4, 281, 0.9, 0.9, '#8c5f33')));
  out.push(F(R(707, 286, 34, 1.8, '#9fd0f0')));

  // (The wall over the cots is left plain on purpose. It has carried a row of painted mochi and
  // then a painted border, and both read as a rail with things perched on it rather than as paint:
  // at this size anything on that line looks like an object standing on nothing.)
  return out;
});
// The round window's glass, drawn under the room's picture (which cuts the window's round hole
// with its frame): blue sky and a cloud by day, deep blue with stars and the moon by night, eased
// between at dusk and dawn. (cx, cy): its centre on screen.
function nurseryWindow(ctx, cx, cy, night, time) {
  const mixc = (a, b, t) => {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const [x, y] = [p(a), p(b)];
    return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`;
  };
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 54, 0, TAU);
  ctx.clip();
  ctx.fillStyle = mixc('#cfe8ff', '#2e3468', night);
  ctx.fillRect(cx - 56, cy - 56, 112, 112);
  if (night < 0.6) {
    ctx.globalAlpha = 1 - night / 0.6;
    ctx.fillStyle = '#ffffff';
    const drift = ((time * 2) % 140) - 70;
    for (const [dx, dy, r] of [[0, -16, 9], [10, -14, 7], [-9, -13, 6]]) {
      ctx.beginPath();
      ctx.arc(cx + drift + dx, cy + dy, r, 0, TAU);
      ctx.fill();
    }
  }
  if (night > 0.3) {
    ctx.globalAlpha = Math.min(1, (night - 0.3) / 0.4);
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(cx + 22, cy - 20, 9, 0, TAU);
    ctx.fill();
    ctx.fillStyle = mixc('#cfe8ff', '#2e3468', night);
    ctx.beginPath();
    ctx.arc(cx + 26, cy - 23, 8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    for (const [dx, dy, k] of [[-30, -18, 0], [-14, -34, 1], [-36, 8, 2], [6, -40, 3], [34, 14, 4], [-20, 24, 5]]) {
      ctx.globalAlpha = Math.min(1, (night - 0.3) / 0.4) * (0.55 + 0.45 * Math.sin(time * 2 + k * 1.7));
      ctx.fillRect(Math.round(cx + dx), Math.round(cy + dy), 1.6, 1.6);
    }
  }
  // The glass's shine, and the window's cross bars over it.
  ctx.globalAlpha = 0.35 * (1 - night * 0.7);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(cx - 14, cy - 14, 30, 26, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = WOOD;
  ctx.fillRect(Math.round(cx - 2), Math.round(cy - 54), 4, 108);
  ctx.fillRect(Math.round(cx - 54), Math.round(cy - 2), 108, 4);
  ctx.restore();
}
// The hearth's flames: three tongues swaying and stretching, gold inside orange.
function hearthFire(ctx, x, y, time) {
  ctx.save();
  for (const [dx, h, ph, c] of [[-10, 18, 0, '#ff8a4a'], [8, 20, 1.7, '#ff8a4a'], [-1, 26, 0.8, '#ff9a5a'], [-1, 15, 2.4, '#ffd27a'], [6, 11, 3.1, '#ffe8a0']]) {
    const sway = Math.sin(time * 5 + ph) * 2.4;
    const hh = h * (0.85 + 0.15 * Math.sin(time * 7 + ph * 2));
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x + dx - 7, y);
    ctx.quadraticCurveTo(x + dx - 6, y - hh * 0.6, x + dx + sway, y - hh);
    ctx.quadraticCurveTo(x + dx + 6, y - hh * 0.6, x + dx + 7, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
// The trophy shelf's cups (world/garden.js trophiesOf): one for each course, in the metal of the
// best rank won there (bronze Beginner, silver Challenge, gold Master), a faint ring where one's
// still to win; a glint now and then on the gold. (ox, oy): where the room's picture starts.
const CUP = { beginner: ['#e0a070', '#b8784a'], challenge: ['#e4e8f2', '#a8b0c4'], master: ['#ffd75e', '#d8a030'] };
function trophyShelf(ctx, cups, ox, oy, time) {
  ctx.font = '800 5px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8a5a34';
  ctx.fillText('TROPHIES', snap(ox + 595), snap(oy + 213));
  ctx.textAlign = 'left';
  cups.forEach((c, i) => {
    const x = ox + 530 + i * 22;
    const y = oy + 196;
    if (!c.rank) {
      ctx.strokeStyle = 'rgba(160,120,90,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x, y - 1, 5, 1.6, 0, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }
    const [m, dk] = CUP[c.rank];
    const big = c.rank === 'master' ? 1.2 : c.rank === 'challenge' ? 1.08 : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(big, big);
    // Base, stem, the bowl with its two handles, its shine.
    ctx.fillStyle = dk;
    ctx.fillRect(-4.5, -3, 9, 3);
    ctx.fillRect(-1.2, -7, 2.4, 4);
    ctx.strokeStyle = dk;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(-5.4, -12.6, 2.4, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(5.4, -12.6, 2.4, Math.PI * 1.5, Math.PI * 0.5);
    ctx.stroke();
    ctx.fillStyle = m;
    ctx.beginPath();
    ctx.moveTo(-5.4, -16);
    ctx.lineTo(5.4, -16);
    ctx.quadraticCurveTo(5.2, -8.4, 0, -7.2);
    ctx.quadraticCurveTo(-5.2, -8.4, -5.4, -16);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(-3.4, -15, 1.2, 5);
    ctx.fillStyle = dk;
    ctx.fillRect(-5.4, -16, 10.8, 1);
    if (c.rank === 'master') {
      const g = (Math.sin(time * 1.6 + i * 1.3) + 1) / 2;
      ctx.globalAlpha = g * 0.9;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2.2, -14.6, 1, 3);
      ctx.fillRect(1.2, -13.6, 3, 1);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  });
}
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
// Sleepy z's from (x, y): `n` of them at a time (up to three), each rising a little to the right,
// growing, swaying and fading, a beat apart.
function sleepyZs(ctx, x, y, time, k, n) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 0; i < n; i++) {
    const u = (time * 0.24 + i / n) % 1;
    const s = 3.2 + u * 3.8;
    const zx = x + u * 20 + Math.sin(u * 6 + i * 2) * 2.5;
    const zy = y - u * 46;
    ctx.globalAlpha = k * Math.min(1, u * 5) * (1 - u) ** 1.2;
    // (A dusky edge under a pale stroke, so it reads on the white dome and on the night sky.)
    for (const [c, lw] of [['#5a4c9c', 2.4 + u * 0.4], ['#f4f0ff', 1.1 + u * 0.3]]) {
      ctx.strokeStyle = c;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(zx - s / 2, zy - s / 2);
      ctx.lineTo(zx + s / 2, zy - s / 2);
      ctx.lineTo(zx - s / 2, zy + s / 2);
      ctx.lineTo(zx + s / 2, zy + s / 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}
// A bought egg on its way from the stall to its place in the nest (world/garden-life.js
// buyStallEgg): it waits on the counter while you pay, hops down off it, and hops on along the
// grass in little eased hops, leaning into each one and back as it lands, its shadow shrinking
// under it as it rises; the last hop is a small one, settling into the nest. Returns false once
// it's home.
const COUNTER = 24;
function hopHome(ctx, map, cam, time, arr, ex, back, genes) {
  const dist = ex - arr.from;
  const n = Math.max(3, Math.round(Math.abs(dist) / EGG_HOP));
  const u = (time - arr.t0) / eggHopSecs(dist);
  if (u >= 1) return false;
  let x = arr.from;
  let up = COUNTER;
  let tilt = 0;
  let sink = 0;
  if (u >= 0) {
    const f = u * n;
    const hop = Math.min(n - 1, Math.floor(f));
    const v = f - hop;
    x = arr.from + (dist * (hop + smooth(v))) / n;
    up = Math.sin(Math.PI * v) * (hop === n - 1 ? 3.5 : 7) + (hop === 0 ? COUNTER * (1 - smooth(v)) : 0);
    tilt = Math.sign(dist) * 0.24 * Math.sin(Math.PI * 2 * v);
    sink = back * 13 * smooth(Math.min(1, u * 1.15));
  }
  const gy = groundAt(map, x) - cam.y;
  const k = GARDEN_EGG * (1 - back * 0.2 * Math.max(0, u));
  // (Its shadow stays on the grass, shrinking as it rises; the counter's own, while it waits up there.)
  const floor = up > COUNTER - 1 ? COUNTER : 0;
  ctx.fillStyle = 'rgba(70,50,40,0.18)';
  ctx.beginPath();
  ctx.ellipse(x - cam.x, gy - sink - floor, Math.max(3, 11 * k - (up - floor) * 0.45), Math.max(0.8, 2.2 * k - (up - floor) * 0.1), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(x - cam.x, gy - sink - up);
  ctx.rotate(tilt);
  drawMochiEgg(ctx, 0, 0, genes, time, k, { shadow: false });
  ctx.restore();
  return true;
}
// Paying at a garden stall (world/garden-life.js handOver): three coins hop from you onto the
// counter one after another, each giving a glint as it lands; then what you bought, wrapped in its
// tier's colour and tied with a ribbon, hops back over into your arms with a little sparkle.
function arc(a, b, h, u) {
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - Math.sin(Math.PI * u) * h];
}
function glint(ctx, x, y, r, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = '#fff8d0';
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.28, y - r * 0.28);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + r * 0.28, y + r * 0.28);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.28, y + r * 0.28);
  ctx.lineTo(x - r, y);
  ctx.lineTo(x - r * 0.28, y - r * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
function handOff(ctx, map, cam, time, h, body) {
  const s = time - h.t0;
  if (s < 0 || s > 2) return;
  const counter = [h.to - cam.x, groundAt(map, h.to) - cam.y - 30];
  const you = [h.from - cam.x, h.y - cam.y - 20];
  for (let k = 0; k < 3; k++) {
    const u = (s - k * 0.09) / 0.42;
    const land = [counter[0] + (k - 1) * 4, counter[1]];
    if (u >= 0 && u < 1) {
      const [x, y] = arc(you, land, 16, smooth(u));
      ctx.fillStyle = '#c98a1a';
      ctx.beginPath();
      ctx.arc(x, y, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd24a';
      ctx.beginPath();
      ctx.arc(x - 0.3, y - 0.3, 1.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff4c0';
      ctx.fillRect(x - 1.2, y - 1.4, 1, 1);
    } else if (u >= 1 && u < 1.5) glint(ctx, land[0], land[1] - 1, 3.2 * (1.5 - u) * 2, 1 - (u - 1) * 2);
  }
  if (!h.parcel) return;
  const u = (s - 0.5) / 0.55;
  const to = [body.x - cam.x, body.y - cam.y - 16];
  if (u >= 0 && u < 1) {
    const [x, y] = arc(counter, to, 22, smooth(u));
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(u * Math.PI * 2) * 0.35);
    ctx.fillStyle = 'rgba(70,40,60,0.25)';
    ctx.fillRect(-4, -2.5, 9, 7);
    ctx.fillStyle = h.parcel;
    ctx.fillRect(-4.5, -3.5, 9, 7);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(-4.5, -3.5, 9, 1.5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-0.6, -3.5, 1.2, 7);
    ctx.fillRect(-4.5, -0.6, 9, 1.2);
    ctx.fillStyle = '#ff6f9a';
    ctx.beginPath();
    ctx.ellipse(-1.8, -4.4, 1.8, 1.1, -0.5, 0, Math.PI * 2);
    ctx.ellipse(1.8, -4.4, 1.8, 1.1, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (u >= 1 && u < 1.6) {
    const a = 1 - (u - 1) / 0.6;
    glint(ctx, to[0] - 6, to[1] - 4, 3.6 * a, a);
    glint(ctx, to[0] + 6, to[1] - 7, 2.6 * a, a);
  }
}

export function drawGardenLife(ctx, world, cam, time, layer = 'back') {
  const life = world.gardenLife;
  const map = world.map;
  const h = life.hatching;
  if (layer === 'front') {
    if (h && !map.indoor) drawHatch(ctx, h.m, h.x - cam.x, groundAt(map, h.x) - cam.y, time);
    return;
  }
  if (map.garden && !map.indoor) {
    const eggs = life.owner?.garden?.eggs ?? [];
    // The two set back up the grass are drawn first, so the front three lap over them and the
    // clutch reads in depth: they used to be drawn last, which put the far ones in front.
    const order = eggs.map((_, i) => i).sort((a, b) => (EGG_BACK[b] ?? 0) - (EGG_BACK[a] ?? 0));
    for (const i of order) {
      const egg = eggs[i];
      if (life.hatching?.egg === egg) continue;
      const ex = EGG_SLOTS[i];
      if (ex == null) continue;
      // The back row sits further up the grass and smaller, so the five read as a clutch in a bed
      // rather than as a line of bollards.
      const back = EGG_BACK[i] ?? 0;
      const genes = egg.genes ?? genesOf(egg.seed);
      const arr = life.arrivals?.get(egg);
      if (arr && hopHome(ctx, map, cam, time, arr, ex, back, genes)) continue;
      if (arr) life.arrivals.delete(egg);
      drawMochiEgg(ctx, ex - cam.x, groundAt(map, ex) - cam.y - back * 13, genes, time, GARDEN_EGG * (1 - back * 0.2));
    }
  }
  for (const h of life.handoffs ?? []) handOff(ctx, map, cam, time, h, world.body);
  // Sweets you have put down, waiting to be found: each one sits in the grass with its own shadow,
  // breathing where it lies, and bouncing on the spot once one of them is on its way over to it.
  for (const d of life.drops ?? []) {
    const dy = groundAt(map, d.x) - cam.y;
    const dx = d.x - cam.x;
    if (dx < -40 || dx > 1200) continue;
    const hop = d.until != null ? 0 : d.taken ? Math.abs(Math.sin(time * 5.5)) * 3.4 : Math.sin(time * 1.8 + d.x * 0.1) * 0.9;
    ctx.fillStyle = 'rgba(70,50,40,0.2)';
    ctx.beginPath();
    ctx.ellipse(dx, dy - 1.5, 7 - hop * 0.5, 2.4 - hop * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    drawSweet(ctx, SWEET_BY_ID[d.id]?.kind ?? 'dango', dx, dy + 1 - hop, 0.72, 0);
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
  if (!(map.garden || map.mochiRace || map.mochiTown)) return;
  for (const [kind, wx, extra] of map.townPieces ?? []) {
    if (kind !== 'mg_fruittree') continue;
    const x = wx - cam.x;
    if (x < -280 || x > width + 280) continue;
    const foot = Math.max(groundAt(map, wx - 9), groundAt(map, wx + 9)) - cam.y;
    // (A breath of wind through it; just shaken, it sways hard and settles.)
    const k = time - (map.shook?.[wx] ?? -9);
    const a = (lean(time, wx) + 0.45) * 0.02 + (k >= 0 && k < 0.9 ? Math.sin(k * 26) * 0.07 * (1 - k / 0.9) : 0);
    pivoted(ctx, x, foot, a, () => place(ctx, fruitTreeArt(extra ?? 0), snap(x), foot + 5));
  }
}
BEHIND_GROUND.push(fruitTreesBehind);

// ---------- Drawing ----------
export function drawGardenPiece(ctx, map, kind, wx, extra, cam, width, time) {
  // (The race stadium and courses borrow the trees and lanterns: world/stadium.js; the Mochi Market
  // has the shop and the stalls: world/market.js.)
  if (!(map.garden || map.mochiRace || map.mochiTown) || !kind.startsWith('mg_')) return false;
  const x = wx - cam.x;
  if (x < -280 && kind !== 'mg_falls') return true;
  if (x > width + 280 && kind !== 'mg_falls') return true;
  const gy = groundAt(map, wx) - cam.y;
  // (Night, or a part of a long course at dusk, `look.glow`: lanterns lit.)
  const night = Math.max(map.night ?? 0, zoneAt(map, 0, wx)?.look?.glow ?? 0);
  switch (kind) {
    case 'mg_flowerbed': {
      place(ctx, flowerBedArt(), snap(x), gy + 2);
      // Five clumps along it, each nodding on its own beat in the breeze.
      for (let i = 0; i < 5; i++) {
        const cx = x - 36 + i * 18;
        const a = (lean(time, wx + i * 37, 0.3 * i, i) + 0.3) * 0.06;
        pivoted(ctx, cx, gy - 7, a, () => place(ctx, flowerClumpArt(extra ?? 0, i), snap(cx), gy - 7));
      }
      return true;
    }
    case 'mg_well': {
      place(ctx, wellArt(), snap(x), gy + 2);
      // The bucket on its rope, swinging gently under the winch.
      const py = gy + 2 - WELL_H + WELL_WINCH;
      pivoted(ctx, x, py, Math.sin(time * 0.9 + wx * 0.01) * 0.06, () => place(ctx, bucketArt(), snap(x), py + 16));
      return true;
    }
    case 'mg_mushroom': {
      place(ctx, mushStemArt(), snap(x), gy + 2);
      // (Pressed down as a Mochi lands on it, `map.mushDip` 0-1, and springing back up: a gentle
      // nod in the breeze otherwise.)
      const dip = (map.mushDip ?? 0) * 3 + Math.sin(time * 1.1 + wx * 0.02) * 0.3;
      place(ctx, mushCapArt(), snap(x), Math.round(gy - 18 + dip));
      return true;
    }
    case 'mg_slide':
      place(ctx, slideArt(), snap(x), gy + 2);
      return true;
    case 'mg_flagline': {
      // A string of little flags strung across from one stall's eave to the next (the Mochi
      // Market's lane: world/market.js), each turning on its own thread like the shop's.
      bunting(ctx, x, extra.to - cam.x, gy - extra.h, time, wx, ['#ffb3cf', '#fff4ea', '#c8e8a8', '#ffd9e4', '#a8d8f0']);
      return true;
    }
    case 'mg_lantern': {
      const v = extra ?? 0;
      place(ctx, lanternPostArt(v), snap(x), gy + 2);
      const h = 46 + (v % 3) * 3;
      paperLantern(ctx, x + 8, gy + 2 - h + 1, time, wx, LANTERN_BANDS[v % LANTERN_BANDS.length], night);
      return true;
    }
    case 'mg_toybox': {
      place(ctx, toyBoxArt(), snap(x), gy + 2);
      // The pinwheel on its stick, turning with the breeze.
      const px = x + 16;
      const py = gy - 46;
      ctx.fillStyle = WOOD_DK;
      ctx.fillRect(snap(px - 0.5), snap(py), 1, 22);
      const a = time * (2 + lean(time, wx) * 3);
      const cols = ['#ff9ec0', '#9fd0f0', '#ffd27a', '#a8dc94'];
      for (let k = 0; k < 4; k++) {
        const t = a + (k * Math.PI) / 2;
        ctx.fillStyle = cols[k];
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(t) * 6, py + Math.sin(t) * 6);
        ctx.lineTo(px + Math.cos(t + 0.9) * 4, py + Math.sin(t + 0.9) * 4);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 1.2, 0, TAU);
      ctx.fill();
      return true;
    }
    case 'mg_shop': {
      place(ctx, shopArt(), snap(x - 8), gy + 2);
      // The name board up on the roof's front, and at night the secret stall's lantern.
      ctx.fillStyle = WOOD;
      ctx.fillRect(snap(x - 44), snap(gy - 98), 72, 14);
      ctx.fillStyle = '#fff6ea';
      ctx.fillRect(snap(x - 42), snap(gy - 96), 68, 10);
      signText(ctx, "Kinako's", x - 8, gy - 95, { align: 'center', color: AZUKI, shadow: '#f0d8c4' });
      // (Hung under the left eave, clear of the costume stand.)
      ctx.fillStyle = WOOD_DK;
      ctx.fillRect(snap(x - 89), snap(gy - 78), 1, 6);
      paperLantern(ctx, x - 89, gy - 72, time, wx - 89, night > 0.3 ? '#b89af0' : '#e8d8f6', night);
      if (night > 0.3) glow(ctx, x - 89, gy - 64, 26, '#c8a8ff', 0.45 * night * flicker(time, wx));
      // A string of little flags hung across the front under the eaves, every one of them
      // turning on its own thread in the breeze.
      bunting(ctx, x - 76, x + 44, gy - 76, time, wx, ['#ffb3cf', '#fff4ea', '#ffd9e4', '#c8e8a8']);
      return true;
    }
    case 'mg_wearstall': {
      place(ctx, wearStallArt(), snap(x), gy + 2);
      // (Measured off the sprite: the counter is centred on the stall's own x, so the board is too.)
      signBoard(ctx, 'CLOTHES', x, gy - 24, { color: AZUKI, rim: '#c08a52' });
      // Today's four models, each dressed head to paws and standing on the counter, plainest on
      // the left and the elite one on the right.
      // (Before today's four have been worked out even once - a dev sheet, a first frame - the
      // stall still has models on it rather than standing bare.)
      const stall = stallOnShow() ?? { stock: stallWear('you', Math.floor(Date.now() / 864e5)) };
      (stall.stock ?? []).forEach((model, i) => {
        drawShopModel(ctx, snap(x + WEAR_HOOKS[i]), snap(gy + 2 - WEAR_COUNTER), model.wear ?? {}, 0.85);
      });
      return true;
    }
    case 'mg_beanframe':
      place(ctx, beanFrameArt(), snap(x), gy + 2);
      return true;
    case 'mg_crates':
      place(ctx, crateStackArt(), snap(x), gy + 2);
      return true;
    case 'mg_washline': {
      // Two posts and a line between them, with the day's washing pegged out: each cloth bellies
      // and lifts on its own, a beat behind the one before it.
      const span = 90;
      ctx.fillStyle = WOOD_DK;
      ctx.fillRect(snap(x - span / 2), snap(gy - 72), 3, 74);
      ctx.fillRect(snap(x + span / 2), snap(gy - 72), 3, 74);
      ctx.fillStyle = '#6f9a52';
      ctx.beginPath();
      ctx.ellipse(snap(x - span / 2 + 1.5), gy + 1, 7, 2.4, 0, 0, Math.PI * 2);
      ctx.ellipse(snap(x + span / 2 + 1.5), gy + 1, 7, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9a97e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 12; i++) {
        const u = i / 12;
        const px = x - span / 2 + span * u;
        const py = gy - 70 + Math.sin(u * Math.PI) * 6;
        if (i) ctx.lineTo(snap(px), snap(py));
        else ctx.moveTo(snap(px), snap(py));
      }
      ctx.stroke();
      const cloths = ['#fff0f4', '#bfe0ee', '#ffe0a8', '#d8c8f0'];
      for (let i = 0; i < 4; i++) {
        const u = (i + 0.6) / 4.4;
        const px = x - span / 2 + span * u;
        const py = gy - 70 + Math.sin(u * Math.PI) * 6;
        const lift = Math.sin(time * 1.4 + i * 1.1 + wx * 0.02);
        const belly = 4 + lift * 3.5;
        ctx.fillStyle = cloths[i];
        ctx.beginPath();
        ctx.moveTo(snap(px - 7), snap(py));
        ctx.lineTo(snap(px + 7), snap(py));
        ctx.quadraticCurveTo(px + 8 + belly, py + 14, px + 5 + belly, py + 26);
        ctx.quadraticCurveTo(px + belly * 0.6, py + 22, px - 5 + belly * 0.4, py + 26);
        ctx.quadraticCurveTo(px - 8 + belly * 0.2, py + 14, px - 7, py);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(120,96,130,0.14)';
        ctx.beginPath();
        ctx.moveTo(snap(px + 2), snap(py));
        ctx.lineTo(snap(px + 7), snap(py));
        ctx.quadraticCurveTo(px + 8 + belly, py + 14, px + 5 + belly, py + 26);
        ctx.quadraticCurveTo(px + 2 + belly * 0.7, py + 16, px + 2, py);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#8a6a48';
        ctx.fillRect(snap(px - 5), snap(py - 2), 1.6, 4);
        ctx.fillRect(snap(px + 4), snap(py - 2), 1.6, 4);
      }
      return true;
    }
    case 'mg_eggstall': {
      place(ctx, eggStallArt(), snap(x), gy + 2);
      signBoard(ctx, 'EGGS', x, gy - 20, { color: AZUKI, rim: '#c08a52' });
      // A price tag hung off the end of the awning, swinging.
      const sw = Math.sin(time * 1.5 + wx * 0.03) * 0.16;
      const tx = x + 34;
      const ty = gy - 64;
      ctx.strokeStyle = WOOD_DK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(snap(tx), snap(ty));
      ctx.lineTo(snap(tx + Math.sin(sw) * 9), snap(ty + Math.cos(sw) * 9));
      ctx.stroke();
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(sw);
      ctx.fillStyle = '#fff6ea';
      ctx.fillRect(-7, 9, 14, 11);
      ctx.fillStyle = SAKURA;
      ctx.fillRect(-7, 9, 14, 2.4);
      signText(ctx, '3K', 0, 13, { align: 'center', color: AZUKI });
      ctx.restore();
      return true;
    }
    case 'mg_kitchen': {
      place(ctx, kitchenArt(), snap(x), gy + 2);
      if (night > 0.2) glow(ctx, x - 24, gy - 44, 30, '#ffc87a', 0.5 * night);
      steam(ctx, x - 32, gy - 36, time, wx * 0.01, 3, 20);
      steam(ctx, x + 43, gy - 116, time * 0.8, wx * 0.02 + 0.5, 3, 30);
      // While someone cooks at the pot (map.stoveBusy: world/world.js) it comes up to a rolling
      // boil: more steam, rising higher, easing in and back out. (Its own steady pace, so the puffs
      // never jump.)
      map.stoveHeat = (map.stoveHeat ?? 0) + ((map.stoveBusy ? 1 : 0) - (map.stoveHeat ?? 0)) * 0.05;
      if (map.stoveHeat > 0.02) {
        steam(ctx, x - 31, gy - 38, time * 1.35, wx * 0.01 + 0.37, 4, 34, map.stoveHeat);
        steam(ctx, x - 35, gy - 37, time * 1.1, wx * 0.01 + 0.71, 3, 26, map.stoveHeat * 0.8);
      }
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
      // The sprout on its roof, nodding: the two leaves turn on the stem, a beat apart.
      const nod = Math.sin(time * 0.9 + wx * 0.01) * 0.11;
      const leaf = (dir, lean, c) => {
        ctx.save();
        ctx.translate(snap(x + 2), snap(gy - 122));
        ctx.rotate(lean);
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.quadraticCurveTo(dir * 9, -7, dir * 25, -4);
        ctx.quadraticCurveTo(dir * 11, 6, 0, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };
      leaf(-1, -nod * 1.2, '#86c96e');
      leaf(1, nod, MATCHA);
      if (night > 0.2) {
        glow(ctx, x - 50, gy - 56, 18, '#ffe08a', 0.55 * night);
        glow(ctx, x + 50, gy - 56, 18, '#ffe08a', 0.55 * night);
      }
      // Mochi asleep inside (map.sleepers: world/garden-life.js): sleepy z's drift up out of the
      // round window one after another, growing and swaying as they rise, and fade away.
      if (night > 0.3 && map.sleepers > 0) sleepyZs(ctx, x + 50, gy - 62, time, Math.min(1, (night - 0.3) / 0.4), Math.min(3, map.sleepers + 1));
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
      // (A Mochi on it: the ropes follow its ride, `map.swingAngle`; empty, it sways in the breeze.)
      pivoted(ctx, bx, by, map.swingAngle ?? Math.sin(time * 1.3 + wx * 0.01) * 0.12, () => {
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
      // Being picked (world/garden-life.js harvestCrops): the crops shiver harder and harder as
      // she tugs, then come up out of the bed and fade as the seedlings fade in behind them.
      const h = map.harvest;
      if (h && (h.quit || h.t >= h.secs)) map.harvest = null;
      else if (h && stage === 3) {
        const p = Math.min(1, h.t / h.secs);
        const tug = smooth(Math.min(1, Math.max(0, (p - 0.24) / (HARVEST_FREE - 0.24))));
        const out = smooth(Math.min(1, Math.max(0, (p - HARVEST_FREE) / 0.22)));
        const shiver = Math.sin(h.t * 34) * tug * (1 - out);
        // (place() takes its fade as `alpha`: it sets the canvas's own.)
        if (out > 0) place(ctx, cropsArt(0), snap(x), gy - 9, { alpha: out });
        if (out < 1) pivoted(ctx, x, gy - 10, a + shiver * 0.05, () => place(ctx, cropsArt(3), snap(x), Math.round(gy - 9 - tug * 1.2 * Math.abs(shiver) - out * 8), { alpha: 1 - out }));
        return true;
      }
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
      signText(ctx, 'RACES', x + 8, gy - 134, { align: 'center', color: '#e0659f', shadow: '#ffe0ee' });
      return true;
    case 'mg_earthwall':
      place(ctx, earthWallArt(extra), snap(x), extra.bottom - cam.y);
      return true;
    case 'mg_nurseryroom': {
      // The room's art is exactly as wide as the map, but the view is wider than that, so past its
      // edges the town's outdoor backdrop showed through down a hard vertical seam. The wall is
      // carried right across the view first, in the colours the art's own edges end on.
      const top = gy - 360;
      ctx.fillStyle = '#d5b297';
      ctx.fillRect(0, top - 160, width, 278);
      ctx.fillStyle = NUR.plaster;
      ctx.fillRect(0, top + 118, width, 226);
      ctx.fillStyle = NUR.skirt;
      ctx.fillRect(0, top + 344, width, 16);
      place(ctx, nurseryRoomArt(), snap(x), gy + 40);
      // The sky in the round window: the garden's day or night (map.outsideNight: world/daytime.js).
      nurseryWindow(ctx, x, gy + 40 - 400 + 150, map.outsideNight ?? 0, time);
      // Everything in the room that moves.
      map.stoveHeat = (map.stoveHeat ?? 0) + ((map.stoveBusy ? 1 : 0) - (map.stoveHeat ?? 0)) * 0.05;
      nurseryLife(ctx, x - 380, gy + 40 - 400, time, map.outsideNight ?? 0, map.stoveHeat);
      trophyShelf(ctx, map.trophies ?? [], x - 380, gy - 360, time);
      return true;
    }
    default:
      return true;
  }
}
