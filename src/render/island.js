// Your island's pieces (world/home.js townPieces) and your hut's rooms inside. Drawn like the rest
// of the scenery: outlined pastel shapes lit from the upper left, shaded by hand with the prop kit,
// and every part has a little life of its own (a bobbing skiff, smoke from the chimney, Shelly's
// sign swinging, the crops nodding, the falls pouring, the lighthouse's beam at night). Phases come
// from the piece's place in the world, never the screen.
//
//   skiff       the little sailboat at the dock, bobbing, its sail furled and a pennant flying
//   crate       the sell crate at the foot of the dock: a slatted crate, a chalk sign, a lantern
//   conch       Shelly's workshop: a giant pink conch shell with a door, a round window and a
//               swinging sign
//   plots       the garden terrace's plots (world/home.js PLOT_X), each a raised bed, and in it
//               whatever you planted, grown as far as it has (`map.plots`)
//   wild        overgrowth on a tier Shelly hasn't opened yet (extra: its height)
//   seep        (stage 1) the damp, mossy streak down the headland where the spring will open
//   grotto      the grotto's mouth at the foot of the headland, half behind the falls
//   waterfall   the falls, pouring off the summit's shoulder into the pond, foam and spray
//   hut         your beach hut on stilts; it gains a window box, a porch rail, a second porthole
//               and a star as the island grows (extra: the stage)
//   ropebridge  planks on ropes from the rise out to the sea stack, sagging, swaying a little
//   islethut    a tiny shack on the sea stack, a hammock between it and a palm
//   tierpalm    a palm on a tier (extra: its height)
//   terrace     the summit's boardwalk, railing and bunting: the place for your trophies
//   isle_lighthouse  the summit's lighthouse; at night its lamp burns and its beam sweeps the sea
//   zipline     the cable from the summit's post down to the dock's, the trolley on it
//   hutroom     the hut inside: the main room (bed nook, trunk), then the kitchen nook (2), the
//               loft (3) and the sunroom (4) (extra: the stage)
//   grottopool  the grotto's glowing pool, crystals round it

import { R, E, T, F, mix, snap } from './pixel.js';
import { ramp, planks, hash } from './propkit.js';
import { art, place } from './scenery.js';
import { groundAt } from '../world/physics.js';
import { drawAfloat } from './water.js';
import { ITEMS } from '../data/items.js';
import { PLOT_X, TIER_Y, TIER_X, G, IN, roomWidth, plotGrowth } from '../world/home.js';

const TAU = Math.PI * 2;
const WOOD = '#c89a6a';

function glow(ctx, x, y, r, color, alpha) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
function smoke(ctx, x, y, time, seed) {
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const k = (time * 0.32 + i / 4 + seed) % 1;
    ctx.globalAlpha = (1 - k) * 0.55;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + Math.sin(k * 5 + seed) * 4 + k * 8, y - k * 34, 2.5 + k * 4, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
// A pennant on a pole top, its tail stirring.
function pennant(ctx, x, y, time, len, c, seed) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x, y);
  const n = 5;
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    ctx.lineTo(x + u * len, y + 2 * u + Math.sin(time * 4 + u * 3 + seed) * 1.6 * u);
  }
  for (let i = n; i >= 0; i--) {
    const u = i / n;
    ctx.lineTo(x + u * len, y + 2 * u + 5 * (1 - u) + Math.sin(time * 4 + u * 3 + seed) * 1.6 * u);
  }
  ctx.closePath();
  ctx.fill();
}

// ---------- The pieces' art ----------

function skiffArt() {
  return art('isle-skiff', 92, 60, () => {
    const hull = ramp('#ffffff', 0.7);
    const band = ramp('#5fb8d8', 0.8);
    const wood = ramp(WOOD, 0.8);
    return [
      // the hull: a white skiff with a sky-blue band and a little cabin of a bow
      T([[4, 40], [88, 40], [80, 54], [14, 54]], hull.base), F(T([[14, 54], [80, 54], [84, 47], [10, 47]], hull.sh)),
      F(R(6, 41, 80, 3, band.base)), F(R(6, 41, 80, 1, band.hi)),
      // the mast, the boom and the furled sail
      R(44, 4, 2.4, 37, wood.base), F(R(44, 4, 0.8, 37, wood.hi)),
      R(20, 34, 44, 2, wood.sh),
      T([[22, 32], [62, 32], [60, 35], [24, 35]], '#fff6ea'), F(T([[22, 34], [62, 34], [60, 35], [24, 35]], '#e8dccc')),
      // rope coils and a fender
      E(70, 38, 4, 1.6, '#e8c890'), E(14, 46, 2.6, 3.2, '#ff8a8a'), F(E(13.4, 45, 1, 1.4, '#ffc8c8')),
      // its name painted on the bow in a little heart
      F(E(76, 48, 2.2, 2, '#ff9ec0')),
    ];
  }, false);
}

// The sell crate: a slatted crate of driftwood on the sand, a few things poking out of it (a fish's
// tail, a cotton boll, a cherry), a chalk sign on a stake with a coin drawn on it, and a lantern.
function crateArt() {
  return art('isle-crate', 70, 62, () => {
    const wood = ramp('#d2a674', 0.8);
    const dark = ramp('#a87a52', 0.8);
    const out = [];
    // What's in it, behind the front slats.
    out.push(T([[18, 30], [24, 20], [30, 30]], '#8fd8ff'), F(T([[22, 26], [24, 21], [26, 26]], '#c8f0ff')));
    out.push(E(38, 28, 6, 5, '#fff6ea'), F(E(36, 26, 2.4, 2, '#ffffff')));
    out.push(E(48, 29, 3.4, 3.4, '#ff6b8a'), F(E(47, 28, 1, 1, '#ffd0dc')), F(R(48, 21, 0.8, 6, '#6fae5a')));
    // The crate: three slats on two corner posts, a darker inside rim.
    out.push(R(10, 30, 46, 4, dark.sh));
    for (const y of [32, 40, 48]) out.push(R(10, y, 46, 7, wood.base), F(R(10, y, 46, 1.4, wood.hi)), F(R(10, y + 5.6, 46, 1.4, wood.sh)));
    for (const x of [8, 54]) out.push(R(x, 30, 5, 28, dark.base), F(R(x, 30, 1.4, 28, dark.hi)));
    // Nail heads.
    for (const x of [10.5, 56.5]) for (const y of [35, 43, 51]) out.push(F(E(x, y, 0.8, 0.8, '#6a5a6a')));
    // The chalk sign on its stake: a little slate with a coin and an arrow into the crate.
    out.push(R(61, 22, 2.4, 36, dark.base), R(56, 10, 14, 13, '#5a5a6e'), F(R(57, 11, 12, 11, '#6e6e84')));
    out.push(F(E(62, 16.5, 3, 3, '#ffe08a')), F(E(62, 16.5, 1.6, 1.6, '#ffd05a')));
    return out;
  });
}

function conchArt() {
  return art('isle-conch', 150, 132, () => {
    const pink = ramp('#ffc2d4', 0.75);
    const lip = ramp('#fff0e6', 0.6);
    const out = [];
    // The shell's whorls, a spiral of bulges rising to a point.
    const whorls = [[74, 92, 58, 38], [70, 58, 44, 30], [68, 32, 30, 20], [66, 14, 16, 11]];
    for (const [cx, cy, rx, ry] of whorls) out.push(E(cx, cy, rx, ry, pink.base));
    for (const [cx, cy, rx, ry] of whorls) out.push(F(E(cx + rx * 0.18, cy + ry * 0.35, rx * 0.8, ry * 0.45, pink.sh)), F(E(cx - rx * 0.35, cy - ry * 0.42, rx * 0.42, ry * 0.22, pink.hi)));
    // Spines along the whorls.
    for (const [cx, cy, rx, ry] of whorls.slice(0, 3)) for (const a of [-2.3, -1.6, -0.9]) {
      const x = cx + Math.cos(a) * rx * 0.95;
      const y = cy + Math.sin(a) * ry * 0.95;
      out.push(T([[x - 3, y + 1], [x + 3, y + 1], [x, y - 7]], pink.hi));
    }
    // The flared lip at the base, creamy and glossy.
    out.push(T([[18, 126], [130, 126], [140, 108], [118, 96], [40, 98], [10, 110]], lip.base), F(T([[18, 126], [130, 126], [128, 118], [24, 118]], lip.sh)));
    // The round door and window.
    out.push(E(60, 108, 15, 18, '#a8605a'), F(E(60, 112, 12, 15, '#7a4a52')), F(E(66, 112, 1.6, 1.6, '#ffd36b')));
    out.push(E(98, 70, 9, 9, '#fff8ea'), E(98, 70, 7, 7, '#5a4a6a'), F(E(98, 71, 6, 5, '#ffe08a')), F(E(96, 68, 2, 2, '#fff8d6')));
    return out;
  }, false);
}

const HUT_W = 136;
function hutArt(stage) {
  return art(`isle-hut|${stage}`, HUT_W, 170, () => {
    const wall = ramp('#ffe6c8', 0.7);
    const trim = ramp('#ffffff', 0.6);
    const thatch = ramp('#e8c07a', 0.85);
    const wood = ramp(WOOD, 0.8);
    const out = [];
    const H = 170;
    const floor = H - 22;
    // Stilts and the steps up.
    for (const x of [16, 52, 84, 120]) out.push(R(x, floor, 5, 22, wood.sh), F(R(x, floor, 1.6, 22, wood.base)));
    out.push(...planks(8, floor - 4, HUT_W - 16, 6, wood, 6, 3));
    // Walls of driftwood boards.
    out.push(R(16, floor - 70, HUT_W - 32, 70, wall.base));
    for (let x = 20; x < HUT_W - 18; x += 10) out.push(F(R(x, floor - 70, 1, 70, wall.sh)));
    out.push(F(R(HUT_W - 30, floor - 70, 14, 70, mix(wall.base, wall.sh, 0.6))));
    // A thatched roof with a fringe, and its chimney.
    out.push(R(96, floor - 132, 12, 30, '#d9a088'), F(R(96, floor - 132, 3, 30, '#f2c0a8')));
    out.push(T([[0, floor - 64], [HUT_W / 2, floor - 120], [HUT_W, floor - 64]], thatch.base), F(T([[HUT_W / 2, floor - 120], [HUT_W, floor - 64], [HUT_W / 2, floor - 64]], thatch.sh)), F(T([[18, floor - 72], [HUT_W / 2, floor - 112], [44, floor - 76]], thatch.hi)));
    for (let x = 2; x < HUT_W - 2; x += 6) out.push(F(R(x, floor - 66, 3.4, 5 + hash(x * 7.3) * 4, thatch.sh)));
    // The door (arched, mint) and a porthole window.
    out.push(T([[52, floor], [52, floor - 40], [58, floor - 48], [78, floor - 48], [84, floor - 40], [84, floor]], trim.base));
    out.push(T([[55, floor], [55, floor - 39], [60, floor - 45], [76, floor - 45], [81, floor - 39], [81, floor]], '#8fd8c0'), F(R(67.4, floor - 45, 1.2, 45, '#6fb8a0')), E(77, floor - 20, 1.6, 1.6, '#ffd36b'));
    out.push(E(32, floor - 40, 11, 11, trim.base), E(32, floor - 40, 8.4, 8.4, '#5a4a6a'), F(E(32, floor - 39, 7, 6, '#ffe08a')), F(E(29.5, floor - 42.5, 2.4, 2.4, '#fff8d6')));
    // As the island grows: a window box of flowers (2), a porch rail and a hanging shell chime (3),
    // a second porthole and a welcome mat (4), a star on the roof's peak (5).
    if (stage >= 2) {
      out.push(R(20, floor - 28, 24, 5, wood.base), F(R(20, floor - 28, 24, 1.4, wood.hi)));
      for (let k = 0; k < 5; k++) out.push(E(23 + k * 4.6, floor - 30, 2.2, 2.2, ['#ff9ec0', '#ffe36b', '#c9a6ff', '#ffffff', '#ff8a8a'][k]), F(E(22 + k * 4.6, floor - 29, 1.4, 1, '#6fc890')));
    }
    if (stage >= 3) {
      for (const x of [92, 104, 116]) out.push(R(x, floor - 18, 2.4, 14, '#ffffff'));
      out.push(R(88, floor - 20, 34, 2.4, '#ffffff'));
    }
    if (stage >= 4) out.push(E(100, floor - 44, 7, 7, trim.base), E(100, floor - 44, 5.2, 5.2, '#5a4a6a'), F(E(100, floor - 43.5, 4.2, 3.6, '#ffe08a')), R(56, floor - 1, 24, 2.4, '#ff9ec0'), F(R(58, floor - 1, 20, 0.8, '#ffd2e6')));
    if (stage >= 5) out.push(T([[HUT_W / 2, floor - 134], [HUT_W / 2 + 4, floor - 124], [HUT_W / 2 + 13, floor - 123], [HUT_W / 2 + 6, floor - 117], [HUT_W / 2 + 9, floor - 108], [HUT_W / 2, floor - 113], [HUT_W / 2 - 9, floor - 108], [HUT_W / 2 - 6, floor - 117], [HUT_W / 2 - 13, floor - 123], [HUT_W / 2 - 4, floor - 124]], '#ffe36b'));
    return out;
  }, false);
}

// A garden plot: a raised bed of planks round dark, furrowed soil, a little name stake at one end.
const BED_W = 66;
function bedArt() {
  return art('isle-plotbed', BED_W + 6, 22, () => {
    const wood = ramp('#c89a6a', 0.8);
    const soil = ramp('#9a6a4a', 0.8);
    const out = [R(3, 8, BED_W, 10, soil.base), F(R(3, 8, BED_W, 2.4, soil.sh))];
    for (let x = 8; x < BED_W; x += 11) out.push(F(E(x + 3, 12, 4, 1.1, soil.hi)));
    // The plank frame, front and ends.
    out.push(R(1, 14, BED_W + 4, 7, wood.base), F(R(1, 14, BED_W + 4, 1.6, wood.hi)), F(R(1, 19.6, BED_W + 4, 1.4, wood.sh)));
    out.push(R(0, 8, 4, 13, wood.sh), R(BED_W + 2, 8, 4, 13, wood.sh));
    for (const x of [18, 36, 54]) out.push(F(R(x, 14.6, 0.8, 5.6, wood.sh)));
    return out;
  });
}

// What a plant looks like as it grows (the item's own colour on what ripens). Five steps: a
// seedling, a sprout, leafy, budding, ripe.
const LOOKS = {
  berry: ['cherry', 'wild_strawberry', 'prickle_pear', 'shrine_plum', 'snow_peach', 'cloudberry', 'whisperberry'],
  flower: ['moonpetal', 'foxfire_lily', 'starbloom'],
  shroom: ['chanterelle', 'duskcap', 'crystal_truffle'],
  boll: ['cotton', 'cloud_cotton'],
  reed: ['silkmoss', 'lotus_fiber'],
};
const lookOf = (id) => Object.keys(LOOKS).find((k) => LOOKS[k].includes(id)) ?? 'herb';
function plantArt(look, color, step) {
  return art(`isle-plant|${look}|${color}|${step}`, 34, 40, () => {
    const leaf = ramp('#7fd38a', 0.8);
    const fruit = ramp(color, 0.75);
    const out = [];
    const base = 38;
    if (step === 0) {
      // A seedling: two round leaves on a short stem.
      out.push(R(16.4, base - 7, 1.2, 7, leaf.sh), E(14, base - 8, 3, 1.8, leaf.base), E(20, base - 8, 3, 1.8, leaf.base));
      return out;
    }
    const h = [0, 12, 20, 26, 28][step];
    if (look === 'shroom') {
      // Caps pushing up out of the soil, wider and fuller as they grow.
      const caps = [[17, 1], [10, 0.7], [24, 0.8]].slice(0, step >= 3 ? 3 : step >= 2 ? 2 : 1);
      for (const [cx, k] of caps) {
        const ch = h * 0.55 * k + 4;
        out.push(R(cx - 1.6, base - ch, 3.2, ch, '#fff4e4'), E(cx, base - ch, 6 * k + 2, 4 * k + 1.4, step >= 4 ? fruit.base : mix(fruit.base, '#e8d8c8', 0.5)), F(E(cx - 2 * k, base - ch - 1.4 * k, 2.4 * k, 1.2 * k, fruit.hi)));
      }
      return out;
    }
    if (look === 'reed') {
      for (const [dx, k] of [[-5, 0.8], [0, 1], [5, 0.9], [9, 0.7]]) out.push(R(17 + dx, base - h * k, 1.6, h * k, k > 0.85 ? leaf.base : leaf.sh));
      if (step >= 3) for (const dx of [-5, 0, 5]) out.push(E(17.8 + dx, base - h * (dx ? 0.85 : 1) - 2, 1.8, 3.6, step >= 4 ? fruit.base : mix(fruit.base, '#a8d88a', 0.6)));
      return out;
    }
    // A stem and leaves for the rest.
    out.push(R(16.2, base - h, 1.6, h, leaf.sh));
    const pairs = Math.min(3, step + 1);
    for (let k = 0; k < pairs; k++) {
      const y = base - 6 - k * (h / (pairs + 0.5));
      out.push(E(12.5, y, 4.4, 2, k % 2 ? leaf.base : leaf.hi), E(21, y - 2, 4.4, 2, k % 2 ? leaf.hi : leaf.base));
    }
    if (look === 'herb') {
      // A leafy tuft that fills out; ripe, it's thick and tinted with its colour.
      out.push(E(17, base - h, 7 + step, 5 + step * 0.6, step >= 4 ? mix(leaf.base, color, 0.45) : leaf.base), F(E(15, base - h - 2, 3, 1.6, leaf.hi)));
      if (step >= 4) for (const [dx, dy] of [[-5, 1], [4, -2], [0, 3]]) out.push(E(17 + dx, base - h + dy, 2, 2, fruit.base));
    } else if (look === 'flower') {
      if (step >= 3) {
        const open = step >= 4 ? 1 : 0.5;
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * TAU - Math.PI / 2;
          out.push(E(17 + Math.cos(a) * 3.6 * open, base - h + Math.sin(a) * 3.2 * open, 2.8 * open + 1, 2.2 * open + 1, fruit.base));
        }
        out.push(F(E(17, base - h, 1.8, 1.8, fruit.hi)));
      }
    } else if (look === 'boll') {
      if (step >= 3) for (const [dx, dy] of [[-5, 4], [0, 0], [5, 3]]) out.push(E(17 + dx, base - h + dy, step >= 4 ? 4 : 2.2, step >= 4 ? 3.4 : 2.2, step >= 4 ? '#ffffff' : '#c8e8a8'), ...(step >= 4 ? [F(E(16 + dx, base - h + dy - 1, 1.6, 1.2, '#ffffff'))] : []));
    } else {
      // A bush hung with fruit: green buds, then ripe in its colour.
      out.push(E(17, base - h + 4, 9 + step, 7 + step * 0.4, leaf.base), F(E(14, base - h + 1, 4, 2.4, leaf.hi)));
      if (step >= 3) for (const [dx, dy] of [[-6, 4], [5, 1], [0, 7], [7, 8], [-3, -1]]) out.push(E(17 + dx, base - h + 4 + dy, 2.4, 2.4, step >= 4 ? fruit.base : '#b8e08a'), ...(step >= 4 ? [F(E(16.4 + dx, base - h + 3.4 + dy, 0.8, 0.8, fruit.hi))] : []));
    }
    return out;
  });
}

// Overgrowth on a tier not open yet: round bushes, tall grass and a fallen log across the way.
function wildArt() {
  return art('isle-wild', 220, 48, () => {
    const bush = ramp('#7fc88a', 0.8);
    const dark = ramp('#5fae74', 0.8);
    const log = ramp('#b8865a', 0.8);
    const out = [];
    out.push(R(70, 34, 78, 10, log.base), F(R(70, 34, 78, 2, log.hi)), E(148, 39, 5, 5, log.sh), F(E(148, 39, 3, 3, '#e8c89a')));
    for (const [cx, cy, r] of [[28, 30, 17], [52, 34, 12], [104, 26, 19], [168, 30, 16], [196, 34, 12], [134, 36, 10]]) {
      out.push(E(cx, cy, r, r * 0.8, r > 14 ? bush.base : dark.base), F(E(cx - r * 0.3, cy - r * 0.35, r * 0.45, r * 0.25, bush.hi)));
    }
    for (let k = 0; k < 14; k++) {
      const x = 8 + k * 15 + hash(k * 3.1) * 6;
      out.push(T([[x - 1.6, 46], [x + 1.6, 46], [x + hash(k) * 4 - 2, 30 - hash(k * 7.7) * 10]], k % 2 ? bush.sh : dark.base));
    }
    return out;
  });
}

function islethutArt() {
  return art('isle-islethut', 92, 96, () => {
    const wall = ramp('#c8e8ff', 0.7);
    const roof = ramp('#ff9a8a', 0.8);
    const wood = ramp(WOOD, 0.8);
    return [
      R(10, 40, 72, 56, wall.base), ...[16, 28, 40, 52, 64, 76].map((x) => F(R(x, 40, 1, 56, wall.sh))),
      T([[0, 44], [46, 8], [92, 44]], roof.base), F(T([[46, 8], [92, 44], [46, 44]], roof.sh)),
      ...[6, 18, 30, 42, 54, 66, 78].map((x) => F(R(x, 42, 4, 5, roof.sh))),
      R(34, 62, 22, 34, wood.base), F(R(34, 62, 22, 3, wood.hi)), E(52, 80, 1.4, 1.4, '#ffd36b'),
      E(70, 60, 7, 7, '#ffffff'), E(70, 60, 5, 5, '#5a4a6a'), F(E(70, 60.5, 4, 3.4, '#ffe08a')),
    ];
  }, false);
}

const TERRACE_W = 180;
function terraceArt() {
  return art('isle-terrace', TERRACE_W, 70, () => {
    const wood = ramp(WOOD, 0.8);
    // A boardwalk along the summit with a white railing at the front.
    const out = [...planks(2, 58, TERRACE_W - 4, 8, wood, 12, 9)];
    for (let x = 6; x < TERRACE_W - 4; x += 14) out.push(R(x, 40, 2.6, 18, '#ffffff'), F(R(x + 1.6, 40, 1, 18, '#e8dcec')));
    out.push(R(2, 38, TERRACE_W - 4, 3.4, '#ffffff'), F(R(2, 40.4, TERRACE_W - 4, 1, '#e8dcec')));
    return out;
  }, false);
}

// The lighthouse: a stone plinth, a tapering white tower in two red bands, a little door and a
// window, the gallery and its railing, the lamp room's glass and a red cap with a weather vane.
const LH_W = 64;
const LH_H = 214;
function lighthouseArt() {
  return art('isle-lighthouse', LH_W, LH_H, () => {
    const white = ramp('#fffaf2', 0.6);
    const red = ramp('#ff8a8a', 0.8);
    const stone = ramp('#d8c8b8', 0.75);
    const out = [];
    const b = LH_H;
    // The plinth.
    out.push(R(6, b - 16, 52, 16, stone.base), F(R(6, b - 16, 52, 3, stone.hi)), F(R(6, b - 4, 52, 4, stone.sh)));
    for (const x of [16, 30, 44]) out.push(F(R(x, b - 13, 1, 9, stone.sh)));
    // The tower, tapering, lit from the left.
    const tower = (y0, y1, c) => {
      const w0 = 22 - ((b - 16 - y0) / 150) * 7;
      const w1 = 22 - ((b - 16 - y1) / 150) * 7;
      return T([[32 - w0, y0], [32 + w0, y0], [32 + w1, y1], [32 - w1, y1]], c);
    };
    out.push(tower(b - 16, b - 166, white.base));
    out.push(tower(b - 70, b - 92, red.base), tower(b - 126, b - 146, red.base));
    out.push(F(T([[40, b - 16], [54, b - 16], [47, b - 166], [38, b - 166]], mix(white.base, white.sh, 0.7))));
    out.push(F(T([[40, b - 70], [53, b - 70], [51, b - 92], [39.5, b - 92]], red.sh)), F(T([[39.5, b - 126], [50.5, b - 126], [49, b - 146], [39, b - 146]], red.sh)));
    // The door and a window.
    out.push(T([[26, b - 16], [26, b - 36], [32, b - 42], [38, b - 36], [38, b - 16]], '#8fd8c0'), F(R(31.4, b - 40, 1.2, 24, '#6fb8a0')));
    out.push(E(32, b - 108, 4.4, 5.4, '#5a4a6a'), F(E(32, b - 107.5, 3.2, 4.2, '#ffe08a')));
    // The gallery: a deck round the top on brackets, its railing.
    out.push(R(10, b - 172, 44, 6, red.base), F(R(10, b - 172, 44, 1.6, red.hi)));
    for (const x of [14, 22, 30, 38, 46]) out.push(R(x, b - 184, 1.6, 12, '#ffffff'));
    out.push(R(10, b - 186, 44, 2.4, '#ffffff'));
    // The lamp room: glass panes, the lamp inside.
    out.push(R(20, b - 196, 24, 24, '#d8f0ff'), F(R(20, b - 196, 24, 24, '#c0e4f8')), F(R(31.2, b - 196, 1.6, 24, '#ffffff')), F(R(20, b - 186, 24, 1.4, '#ffffff')));
    out.push(F(E(32, b - 184, 5, 6, '#ffe08a')), F(E(31, b - 186, 2, 2.4, '#fff8d6')));
    // The cap and the vane.
    out.push(T([[16, b - 196], [48, b - 196], [32, b - 210]], red.base), F(T([[32, b - 210], [48, b - 196], [32, b - 196]], red.sh)));
    out.push(R(31.4, b - 214, 1.2, 6, '#8a7a9a'), T([[32.6, b - 214], [38, b - 212], [32.6, b - 211]], '#ffe36b'));
    return out;
  });
}

// The hut inside. The main room is the old one (plank walls, beams, the round window onto the sea,
// the mint door, the rug, two wall shelves) with its built-ins: the bed nook by the left wall
// (log off in here and you wake up rested) and the trunk under the right shelf (your storage).
function roomArt() {
  return art('isle-hutroom', 640, 480, () => {
    const wall = ramp('#ffe8d0', 0.6);
    const floor = ramp('#d8a878', 0.8);
    const beam = ramp('#b8865a', 0.8);
    const out = [R(0, 0, 640, 480, wall.base)];
    for (let x = 0; x < 640; x += 22) out.push(F(R(x, 0, 1.2, 300, wall.sh)), F(R(x + 6, 40 + hash(x) * 120, 6, 1, wall.hi)));
    // Wainscot and skirting.
    out.push(R(0, 250, 640, 50, mix(wall.base, '#ffc8b0', 0.35)), F(R(0, 250, 640, 3, wall.hi)), F(R(0, 296, 640, 4, beam.sh)));
    // The floor boards.
    out.push(...planks(0, 300, 640, 180, floor, 16, 21));
    // Ceiling beams.
    out.push(R(0, 0, 640, 16, beam.base), F(R(0, 14, 640, 2, beam.sh)));
    for (const x of [40, 230, 410, 600]) out.push(R(x - 6, 0, 12, 300, beam.base), F(R(x - 6, 0, 3, 300, beam.hi)), F(R(x + 3, 0, 3, 300, beam.sh)));
    // A big round window onto the sea.
    out.push(E(320, 130, 62, 62, '#ffffff'), E(320, 130, 54, 54, '#9fd8ff'), F(E(320, 150, 54, 22, '#5fb8d8')), F(E(320, 156, 54, 12, '#4fa0c8')), F(E(300, 108, 18, 8, '#e2f4ff')), F(R(318, 76, 4, 108, '#ffffff')), F(R(266, 128, 108, 4, '#ffffff')));
    // The door out, mint like the outside, with its little window and knob.
    out.push(T([[294, 300], [294, 236], [300, 226], [340, 226], [346, 236], [346, 300]], '#ffffff'));
    out.push(T([[298, 300], [298, 238], [303, 230], [337, 230], [342, 238], [342, 300]], '#8fd8c0'), F(R(319.4, 230, 1.2, 70, '#6fb8a0')), E(334, 268, 1.8, 1.8, '#ffd36b'), E(320, 246, 6, 6, '#ffffff'), F(E(320, 246, 4.4, 4.4, '#bfe8ff')));
    // The two wall shelves (the room's `shelf` ledges, y 262): boards on curly brackets.
    for (const sx of [70, 420]) {
      out.push(...planks(sx, 262, 150, 5, beam, 6, sx), F(R(sx, 262, 150, 1.2, beam.hi)));
      for (const bx of [sx + 14, sx + 136]) out.push(T([[bx - 2, 267], [bx + 2, 267], [bx + 2, 280], [bx - 8, 267]], beam.sh));
    }
    // The bed nook (world/home.js IN.bed): a boxed bed against the left wall under the shelf, a
    // patchwork quilt, a fat pillow, a little curtain tied back.
    const bx = IN.bed;
    const quilt = ramp('#ffb3cf', 0.75);
    out.push(R(bx - 46, 316, 92, 44, beam.base), F(R(bx - 46, 316, 92, 3, beam.hi)), R(bx - 50, 286, 8, 74, beam.sh), R(bx + 42, 304, 8, 56, beam.sh));
    out.push(R(bx - 42, 312, 84, 14, quilt.base), F(R(bx - 42, 312, 84, 3, quilt.hi)));
    for (let k = 0; k < 4; k++) out.push(F(R(bx - 40 + k * 21, 315, 19, 10, ['#ffd2e6', '#c8e8ff', '#fff0b8', '#d8f5d0'][k])));
    out.push(E(bx - 30, 306, 12, 7, '#ffffff'), F(E(bx - 32, 304, 6, 3, '#fff8f0')));
    out.push(T([[bx - 50, 282], [bx - 34, 282], [bx - 40, 300], [bx - 50, 312]], '#c8e8ff'), F(R(bx - 44, 298, 6, 3, '#ff9ec0')));
    // The trunk (IN.trunk): a sea chest of planks with brass corners, its lid a little rounded.
    const tx = IN.trunk;
    const chest = ramp('#c88a5a', 0.8);
    out.push(R(tx - 22, 330, 44, 30, chest.base), F(R(tx - 22, 330, 44, 2, chest.hi)), F(R(tx - 22, 356, 44, 4, chest.sh)));
    out.push(T([[tx - 23, 332], [tx - 22, 322], [tx - 14, 316], [tx + 14, 316], [tx + 22, 322], [tx + 23, 332]], chest.base), F(T([[tx - 14, 318], [tx + 14, 318], [tx + 18, 322], [tx - 18, 322]], chest.hi)));
    for (const x of [tx - 23, tx + 19]) out.push(R(x, 322, 4, 38, '#e8c070'), F(R(x, 322, 1.2, 38, '#fff0b0')));
    out.push(R(tx - 3, 328, 6, 8, '#e8c070'), F(E(tx, 333, 1.2, 1.6, '#7a5a3a')));
    // A round rug.
    out.push(E(320, 354, 124, 16, '#ffb3cf'), F(E(320, 354, 104, 12, '#ffd2e6')), F(E(320, 354, 62, 7, '#ffb3cf')));
    return out;
  }, false);
}

// The kitchen nook (stage 2), right of the main room: a tiled wall, a window over the counter,
// a shelf of jars, pans on hooks; the stove (render/town.js, the map's `stove`) stands in it.
function kitchenArt() {
  return art('isle-kitchen', 260, 480, () => {
    const wall = ramp('#fff0dc', 0.6);
    const tile = ramp('#cfeee4', 0.6);
    const floor = ramp('#d8a878', 0.8);
    const beam = ramp('#b8865a', 0.8);
    const out = [R(0, 0, 260, 480, wall.base)];
    // The archway from the main room.
    out.push(R(0, 0, 10, 300, beam.base), F(R(0, 0, 3, 300, beam.hi)));
    // Tiles behind the counter and the stove.
    out.push(R(10, 180, 250, 120, tile.base));
    for (let y = 180; y < 300; y += 12) for (let x = 10 + ((y / 12) % 2) * 6; x < 260; x += 12) out.push(F(R(x, y, 11, 11, (x + y) % 24 ? tile.base : tile.hi)), F(R(x, y + 10.4, 11, 0.8, tile.sh)));
    // The window over the counter: the sea, a gingham curtain.
    out.push(R(32, 72, 92, 74, '#ffffff'), R(38, 78, 80, 62, '#9fd8ff'), F(R(38, 116, 80, 24, '#5fb8d8')), F(R(77, 78, 2, 62, '#ffffff')));
    out.push(T([[34, 70], [70, 70], [56, 112], [34, 128]], '#ff9ec0'), F(T([[40, 72], [64, 72], [54, 100]], '#ffd2e6')));
    // The counter, a chopping board, a bowl of fruit.
    out.push(R(20, 262, 120, 38, beam.base), F(R(20, 262, 120, 4, beam.hi)), R(24, 268, 112, 30, mix(beam.base, '#ffe8d0', 0.3)));
    out.push(R(36, 256, 34, 6, '#e8c89a'), E(104, 256, 14, 6, '#ffffff'), E(98, 251, 4, 4, '#ff6b8a'), E(107, 250, 4, 4, '#ffd05a'), E(112, 253, 3.4, 3.4, '#8fd06a'));
    // A shelf of jars and pans on hooks.
    out.push(...planks(150, 150, 100, 5, beam, 5, 7));
    for (const [x, c] of [[160, '#ffd05a'], [176, '#ff9ec0'], [192, '#8fd8ff'], [208, '#c9a6ff'], [226, '#9fe0a0']]) out.push(R(x - 5, 134, 10, 16, '#e8f4ff'), F(R(x - 4, 140, 8, 9, c)), R(x - 5, 131, 10, 4, '#c8a078'));
    for (const x of [170, 206, 238]) out.push(R(x - 0.6, 166, 1.2, 10, '#8a7a9a'), E(x, 186, 9, 9, '#a8a8c0'), F(E(x - 2, 183, 4, 3, '#d8d8e8')));
    // The floor and beams carry on.
    out.push(...planks(0, 300, 260, 180, floor, 16, 33));
    out.push(R(0, 0, 260, 16, beam.base), F(R(0, 14, 260, 2, beam.sh)), R(254, 0, 6, 300, beam.base));
    return out;
  }, false);
}

// The sunroom (stage 4), past the kitchen: tall arched windows onto the sea, a pale floor, potted
// palms, room for whatever you'd like to show off.
function sunroomArt() {
  return art('isle-sunroom', 280, 480, () => {
    const wall = ramp('#fff6ea', 0.6);
    const floor = ramp('#ecd2b0', 0.75);
    const beam = ramp('#c8986a', 0.8);
    const out = [R(0, 0, 280, 480, wall.base)];
    out.push(R(0, 0, 10, 300, beam.base), F(R(0, 0, 3, 300, beam.hi)), R(270, 0, 10, 300, beam.base));
    for (const cx of [72, 208]) {
      out.push(T([[cx - 46, 280], [cx - 46, 90], [cx - 30, 60], [cx, 50], [cx + 30, 60], [cx + 46, 90], [cx + 46, 280]], '#ffffff'));
      out.push(T([[cx - 40, 274], [cx - 40, 94], [cx - 26, 68], [cx, 58], [cx + 26, 68], [cx + 40, 94], [cx + 40, 274]], '#a8e0ff'));
      out.push(F(R(cx - 40, 200, 80, 74, '#6cc4e0')), F(R(cx - 40, 236, 80, 38, '#55aed0')), F(R(cx - 1, 58, 2, 216, '#ffffff')), F(R(cx - 40, 150, 80, 2, '#ffffff')));
      out.push(F(E(cx - 18, 110, 14, 5, '#ffffff')), F(E(cx + 12, 96, 9, 3.4, '#ffffff')));
    }
    out.push(...planks(0, 300, 280, 180, floor, 18, 47));
    out.push(R(0, 0, 280, 16, beam.base), F(R(0, 14, 280, 2, beam.sh)));
    // Potted palms in the corners.
    for (const [px, flip] of [[22, 1], [258, -1]]) {
      out.push(T([[px - 10, 300], [px + 10, 300], [px + 8, 280], [px - 8, 280]], '#e8a07a'), F(R(px - 9, 280, 18, 3, '#ffc8a0')));
      out.push(R(px - 1, 236, 2.4, 44, '#a8805a'));
      for (let f = 0; f < 5; f++) {
        const a = -Math.PI + (f / 4) * Math.PI;
        out.push(T([[px, 236], [px + Math.cos(a) * 18 * flip, 236 + Math.sin(a) * 9 + 6], [px + Math.cos(a) * 12 * flip, 236 + Math.sin(a) * 6 + 9]], f % 2 ? '#6fc890' : '#4fa878'));
      }
    }
    return out;
  }, false);
}

// The loft (stage 3): a gallery over the main room on brackets, plank deck, a railing.
function loftArt() {
  const w = IN.loft[1] - IN.loft[0];
  return art(`isle-loft|${w}`, w + 8, 90, () => {
    const wood = ramp('#c89a6a', 0.8);
    const out = [...planks(4, 64, w, 8, wood, 10, 5)];
    for (let x = 10; x < w; x += 16) out.push(R(x, 44, 2.4, 20, '#ffffff'));
    out.push(R(4, 42, w, 3, '#ffffff'));
    for (const x of [16, w - 12]) out.push(T([[x - 3, 72], [x + 3, 72], [x + 3, 88], [x - 9, 72]], wood.sh));
    return out;
  }, false);
}

// The grotto's pool: a rim of pale stones round it, teal crystals growing from the rock, the light
// from the water playing on them (the water itself: render/water.js, kind 'cave').
function grottoArt() {
  return art('isle-grotto', 420, 120, () => {
    const crys = ramp('#8ff0e0', 0.7);
    const rock = ramp('#5a8a96', 0.75);
    const out = [];
    for (const [cx, h, w, lean] of [[24, 46, 10, -0.2], [40, 30, 8, 0.15], [370, 54, 12, 0.2], [392, 34, 8, -0.1], [350, 26, 7, -0.25]]) {
      const tip = cx + lean * h;
      out.push(T([[cx - w / 2, 118], [cx + w / 2, 118], [tip + w * 0.2, 118 - h], [tip - w * 0.2, 118 - h - 4]], crys.base), F(T([[cx - w / 2 + 1, 118], [cx - 0.5, 118], [tip - w * 0.2, 118 - h - 3]], crys.hi)));
    }
    for (const [cx, r] of [[12, 10], [60, 7], [336, 9], [408, 11]]) out.push(E(cx, 116, r, r * 0.6, rock.base), F(E(cx - r * 0.3, 113, r * 0.4, r * 0.2, rock.hi)));
    return out;
  });
}

// ---------- Drawing ----------

// A palm (on a tier, at its own height): its trunk ringed and leaning, its fronds stirring.
function palm(ctx, x, gy, lean, time, seed) {
  ctx.strokeStyle = '#a8805a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, gy + 2);
  ctx.quadraticCurveTo(x + lean * 8, gy - 46, x + lean * 20, gy - 92);
  ctx.stroke();
  const tx = x + lean * 20;
  const ty = gy - 92;
  for (let f = 0; f < 7; f++) {
    const a = -Math.PI + (f / 6) * Math.PI + Math.sin(time * 1.1 + f + seed) * 0.06;
    const len = 26 + (f % 2) * 7;
    ctx.strokeStyle = f % 2 ? '#4fa878' : '#6fc890';
    ctx.lineWidth = 4.4;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + Math.cos(a) * len * 0.6, ty + Math.sin(a) * len * 0.6 - 7, tx + Math.cos(a) * len, ty + Math.sin(a) * len * 0.5 + 9);
    ctx.stroke();
  }
  ctx.fillStyle = '#8a6a3a';
  for (const [dx, dy] of [[-3, 4], [3, 5], [0, 8]]) {
    ctx.beginPath();
    ctx.arc(tx + dx, ty + dy, 2.6, 0, TAU);
    ctx.fill();
  }
}

// Pieces that reach far from where they're placed are culled by their own span.
const WIDE = new Set(['plots', 'zipline', 'waterfall', 'seep', 'ropebridge', 'hutroom']);

export function drawIslandPiece(ctx, map, kind, wx, extra, cam, width, time) {
  if (!map.home) return false;
  const x = wx - cam.x;
  if (!WIDE.has(kind) && (x < -260 || x > width + 260)) return true;
  const gy = groundAt(map, wx) - cam.y;
  switch (kind) {
    case 'skiff': {
      // Afloat at the dock at her waterline, bobbing and rocking on the swell, her reflection
      // under her (render/water.js).
      const sea = map.water?.[0]?.y ?? G + 12;
      drawAfloat(ctx, x, sea - cam.y, 50, 6, time, wx, (c) => {
        place(c, skiffArt(), 0, 6);
        pennant(c, 1.2, -48, time, 12, '#ff8a8a', wx);
      }, { bob: 1.6, roll: 0.03 });
      return true;
    }
    case 'crate': {
      place(ctx, crateArt(), snap(x), gy + 2);
      // Its lantern, hung on the sign's stake, lit at night.
      ctx.fillStyle = '#7a6a7a';
      ctx.fillRect(snap(x + 28), snap(gy - 38), 1, 5);
      ctx.fillStyle = '#ffe08a';
      ctx.fillRect(snap(x + 26), snap(gy - 33), 5, 6);
      if ((map.night ?? 0) > 0.2) glow(ctx, x + 28.5, gy - 30, 16, '#ffe08a', 0.55 * map.night);
      return true;
    }
    case 'conch': {
      place(ctx, conchArt(), snap(x), gy + 2);
      // Her sign on a post, swinging.
      const sx = x + 74;
      const sy = gy - 46;
      ctx.fillStyle = '#a8805a';
      ctx.fillRect(snap(sx - 1), snap(sy), 2, 48);
      ctx.save();
      ctx.translate(sx, sy + 2);
      ctx.rotate(Math.sin(time * 1.4 + wx) * 0.08);
      ctx.fillStyle = '#fff4e0';
      ctx.fillRect(-14, 2, 28, 13);
      ctx.strokeStyle = '#a8805a';
      ctx.strokeRect(-14, 2, 28, 13);
      ctx.fillStyle = '#d0608a';
      ctx.font = '800 6px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BUILDS', 0, 11);
      ctx.restore();
      // Lamp glow in her window at night.
      if ((map.night ?? 0) > 0.2) glow(ctx, x + 23, gy - 60, 18, '#ffe08a', 0.5 * map.night);
      return true;
    }
    case 'plots': {
      // Each plot on the garden terrace, and whatever's growing in it, swaying from its root (a
      // ripe crop wiggles a little more, ready to pick). The growth is in five steps, so the
      // picture only changes when a step comes round.
      const stage = extra ?? 1;
      const n = [0, 2, 3, 4, 5, 6][Math.max(1, Math.min(5, stage))];
      const ty = TIER_Y.garden - cam.y;
      const now = Date.now() / 1000;
      for (let i = 0; i < n; i++) {
        const px = PLOT_X[i] - cam.x;
        if (px < -60 || px > width + 60) continue;
        place(ctx, bedArt(), snap(px), ty + 4);
        const plot = map.plots?.[i];
        const k = plotGrowth(plot, now);
        if (k == null) continue;
        const step = k >= 1 ? 4 : k >= 0.7 ? 3 : k >= 0.4 ? 2 : k >= 0.12 ? 1 : 0;
        const color = ITEMS[plot.id]?.color ?? '#ff8fb0';
        const pic = plantArt(lookOf(plot.id), color, step);
        for (const dx of [-17, 0, 17]) {
          const sway = Math.sin(time * (step >= 4 ? 2.4 : 1.5) + i * 1.7 + dx * 0.11) * (step >= 4 ? 0.09 : 0.05);
          ctx.save();
          ctx.translate(snap(px + dx), ty - 2);
          ctx.rotate(sway);
          place(ctx, pic, 0, 0);
          ctx.restore();
        }
      }
      return true;
    }
    case 'wild': {
      const ty = (extra ?? TIER_Y.rise) - cam.y;
      place(ctx, wildArt(), snap(x), ty + 4);
      return true;
    }
    case 'seep': {
      // Stage 1: where the spring will break through, a damp dark streak down the headland, moss
      // along it and a slow drip or two.
      const top = TIER_Y.summit + 40 - cam.y;
      const bot = G - cam.y;
      if (x < -30 || x > width + 30 || bot < -10 || top > 400) return true;
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = '#7a5a4a';
      ctx.fillRect(snap(x - 5), top, 10, bot - top);
      ctx.restore();
      ctx.fillStyle = '#7fc88a';
      for (let k = 0; k < 8; k++) ctx.fillRect(snap(x - 6 + hash(k * 5.3) * 9), snap(top + 30 + k * ((bot - top - 40) / 8)), 4, 2);
      for (let k = 0; k < 2; k++) {
        const u = (time * 0.35 + k * 0.5) % 1;
        ctx.fillStyle = '#c8ecff';
        ctx.fillRect(snap(x - 1 + k * 2), snap(top + 20 + u * (bot - top - 20)), 1.6, 3);
      }
      return true;
    }
    case 'grotto': {
      // The mouth: a dark arch at the headland's foot, the pool's light inside, wet rock round it.
      const w = 46;
      const h = 62;
      ctx.fillStyle = '#7a6a7a';
      ctx.beginPath();
      ctx.moveTo(x - w / 2 - 6, gy + 2);
      ctx.quadraticCurveTo(x - w / 2 - 6, gy - h - 8, x, gy - h - 10);
      ctx.quadraticCurveTo(x + w / 2 + 6, gy - h - 8, x + w / 2 + 6, gy + 2);
      ctx.fill();
      ctx.fillStyle = '#1f4650';
      ctx.beginPath();
      ctx.moveTo(x - w / 2, gy + 2);
      ctx.quadraticCurveTo(x - w / 2, gy - h, x, gy - h - 2);
      ctx.quadraticCurveTo(x + w / 2, gy - h, x + w / 2, gy + 2);
      ctx.fill();
      // The pool's light coming out, breathing.
      glow(ctx, x + 4, gy - 10, 26, '#7fe6d6', 0.32 + 0.08 * Math.sin(time * 1.3));
      ctx.fillStyle = '#8ff0e0';
      for (const [dx, dy, s] of [[-12, -8, 3], [10, -14, 4], [16, -4, 2.4]]) {
        ctx.beginPath();
        ctx.moveTo(x + dx, gy + dy);
        ctx.lineTo(x + dx + s * 0.5, gy + dy - s * 2.4);
        ctx.lineTo(x + dx + s, gy + dy);
        ctx.fill();
      }
      return true;
    }
    case 'waterfall': {
      // Off the summit's shoulder, a ribbon of water pours down the headland into the pond: pale
      // and bright at the lip, deeper as it falls, streaks running down it, foam and spray where
      // it lands. (The streaks travel at a steady speed, like water does.)
      const top = TIER_Y.summit + 16 - cam.y;
      const bot = G + 12 - cam.y;
      if (x < -60 || x > width + 60 || bot < -20 || top > 400) return true;
      const w = 22;
      ctx.fillStyle = '#d8f6ff';
      ctx.beginPath();
      ctx.ellipse(x + 6, top + 2, 13, 5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(160, 222, 246, 0.9)';
      ctx.fillRect(snap(x - w / 2), top, w, bot - top);
      ctx.fillStyle = 'rgba(120, 196, 232, 0.55)';
      ctx.fillRect(snap(x + w / 2 - 6), top, 6, bot - top);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillRect(snap(x - w / 2 + 2), top, 3, bot - top);
      for (let k = 0; k < 7; k++) {
        const lane = x - w / 2 + 4 + ((k * 7) % (w - 6));
        const len = 16 + (k % 3) * 8;
        for (let s = 0; s < 3; s++) {
          const y = top + ((time * 210 + k * 53 + s * 140) % (bot - top + len)) - len;
          const y0 = Math.max(top, y);
          const y1 = Math.min(bot, y + len);
          if (y1 > y0) {
            ctx.fillStyle = k % 2 ? 'rgba(255,255,255,0.8)' : 'rgba(220,246,255,0.9)';
            ctx.fillRect(snap(lane), y0, 1.6, y1 - y0);
          }
        }
      }
      // Foam and spray at the foot, rising and fading.
      for (let k = 0; k < 7; k++) {
        const u = (time * 0.9 + k / 7) % 1;
        ctx.save();
        ctx.globalAlpha = (1 - u) * 0.85;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x - 14 + (k * 29) % 34 + Math.sin(k + time) * 2, bot - 2 - u * 16, 3 + u * 5, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      return true;
    }
    case 'hut': {
      const s = extra ?? 1;
      place(ctx, hutArt(s), snap(x), gy + 2);
      smoke(ctx, x + 34, gy - 140, time, wx * 0.01);
      if (s >= 3) {
        // A shell wind chime by the porch, swaying.
        for (let k = 0; k < 3; k++) {
          const sw = Math.sin(time * 2.2 + k * 0.9) * 2;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(snap(x + 26 + k * 4 + sw * 0.3), snap(gy - 44), 0.8, 8 + k * 2);
          ctx.fillStyle = ['#ffc2d4', '#fff0b0', '#c8e8ff'][k];
          ctx.beginPath();
          ctx.ellipse(x + 26 + k * 4 + sw, gy - 34 + k * 2, 1.8, 2.2, 0, 0, TAU);
          ctx.fill();
        }
      }
      if ((map.night ?? 0) > 0.2) glow(ctx, x - 36, gy - 60, 22, '#ffe08a', 0.55 * map.night);
      return true;
    }
    case 'reeds': {
      for (let k = 0; k < 6; k++) {
        const px = x - 8 + k * 3.4;
        const h = 18 + (k * 7) % 11;
        const sw = Math.sin(time * 1.5 + k + wx * 0.02) * 2.4;
        ctx.strokeStyle = k % 2 ? '#5faa6a' : '#7fc88a';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(px, gy + 2);
        ctx.quadraticCurveTo(px + sw * 0.3, gy - h * 0.5, px + sw, gy - h);
        ctx.stroke();
        if (k % 2 === 0) {
          ctx.fillStyle = '#a8705a';
          ctx.beginPath();
          ctx.ellipse(px + sw, gy - h - 3, 1.6, 3.6, sw * 0.05, 0, TAU);
          ctx.fill();
        }
      }
      return true;
    }
    case 'ropebridge': {
      // Planks hung between two posts on ropes that sag in the middle, swaying a little.
      const x0 = TIER_X.rise[1] - 4 - cam.x;
      const x1 = TIER_X.islet[0] + 4 - cam.x;
      if (x1 < -40 || x0 > width + 40) return true;
      const y = TIER_Y.rise - cam.y;
      const sag = 9 + Math.sin(time * 0.9) * 1.2;
      const yAt = (u) => y + Math.sin(Math.PI * u) * sag * 0.25;
      for (const px of [x0, x1]) {
        ctx.fillStyle = '#a8805a';
        ctx.fillRect(snap(px - 2), snap(y - 26), 4, 30);
      }
      ctx.strokeStyle = '#d8b890';
      ctx.lineWidth = 1.4;
      for (const dy of [-24, -14]) {
        ctx.beginPath();
        for (let i = 0; i <= 20; i++) {
          const u = i / 20;
          const px = x0 + (x1 - x0) * u;
          const py = y + dy + Math.sin(Math.PI * u) * sag;
          if (i) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        }
        ctx.stroke();
      }
      const n = Math.round((x1 - x0) / 10);
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n;
        const px = x0 + (x1 - x0) * u;
        ctx.fillStyle = i % 2 ? '#d8a878' : '#c89a6a';
        ctx.fillRect(snap(px - 4), snap(yAt(u)), 8, 3);
        ctx.fillStyle = '#d8b890';
        ctx.fillRect(snap(px), snap(y - 14 + Math.sin(Math.PI * u) * sag), 0.8, snap(yAt(u) - (y - 14 + Math.sin(Math.PI * u) * sag)));
      }
      return true;
    }
    case 'islethut': {
      const ty = TIER_Y.islet - cam.y;
      place(ctx, islethutArt(), snap(x), ty + 2);
      // A hammock slung to the palm beside it, swinging gently.
      const sw = Math.sin(time * 1.2 + wx) * 2;
      ctx.strokeStyle = '#ff9ec0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 44, ty - 40);
      ctx.quadraticCurveTo(x + 82 + sw, ty - 22, x + 116, ty - 46);
      ctx.stroke();
      return true;
    }
    case 'tierpalm': {
      palm(ctx, x, (extra ?? TIER_Y.islet) - cam.y, -1, time, wx * 0.01);
      return true;
    }
    case 'terrace': {
      const ty = TIER_Y.summit - cam.y;
      place(ctx, terraceArt(), snap(x), ty + 8);
      // Bunting across the terrace, stirring.
      for (let k = 0; k < 10; k++) {
        const u = k / 9;
        const px = x - TERRACE_W / 2 + 10 + u * (TERRACE_W - 20);
        const py = ty - 56 + Math.sin(Math.PI * u) * 9;
        ctx.fillStyle = ['#ff9ec0', '#ffe36b', '#8fd8ff', '#9fe0a0'][k % 4];
        ctx.beginPath();
        ctx.moveTo(px - 4, py);
        ctx.lineTo(px + 4, py);
        ctx.lineTo(px + Math.sin(time * 3 + k) * 0.8, py + 7);
        ctx.fill();
      }
      return true;
    }
    case 'isle_lighthouse': {
      const ty = TIER_Y.summit - cam.y;
      place(ctx, lighthouseArt(), snap(x), ty + 2);
      // At night the lamp burns and its beam sweeps round: a long fan of light out over the sea,
      // swinging from one side to the other as it turns (narrow as it points at you).
      const night = map.night ?? 0;
      if (night > 0.15) {
        const lx = x;
        const ly = ty - LH_H + 30;
        glow(ctx, lx, ly, 26, '#fff3a6', 0.75 * night);
        const a = time * 0.7 + wx * 0.001;
        const side = Math.cos(a);
        const len = 260 * Math.abs(side) + 30;
        const half = 14 + 10 * (1 - Math.abs(side));
        ctx.save();
        ctx.globalAlpha = 0.22 * night * (0.4 + 0.6 * Math.abs(side));
        ctx.fillStyle = '#fff6c0';
        ctx.beginPath();
        ctx.moveTo(lx, ly - 3);
        ctx.lineTo(lx + Math.sign(side || 1) * len, ly - half - 6);
        ctx.lineTo(lx + Math.sign(side || 1) * len, ly + half - 6);
        ctx.lineTo(lx, ly + 3);
        ctx.fill();
        ctx.restore();
      }
      return true;
    }
    case 'zipline': {
      // The cable from the summit's post down to the dock's, and its trolley: parked at the top,
      // or rolling down with whoever's riding it (physics sets the line's `rideD`).
      const z = map.ziplines?.[0];
      if (!z) return true;
      const ax = z.x1 - cam.x;
      const ay = z.y1 - cam.y;
      const bx = z.x2 - cam.x;
      const by = z.y2 - cam.y;
      if (Math.max(ax, bx) < -40 || Math.min(ax, bx) > width + 40) return true;
      // The posts, each with a crossbar and a pulley at its top.
      for (const [px, py, foot] of [[ax, ay, TIER_Y.summit - cam.y], [bx, by, G - 12 - cam.y]]) {
        ctx.fillStyle = '#a8805a';
        ctx.fillRect(snap(px - 2.5), snap(py - 6), 5, foot - py + 6);
        ctx.fillStyle = '#c8a07a';
        ctx.fillRect(snap(px - 2.5), snap(py - 6), 1.6, foot - py + 6);
        ctx.fillStyle = '#8a6a52';
        ctx.fillRect(snap(px - 9), snap(py - 8), 18, 4);
        ctx.fillStyle = '#d8d8e8';
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, TAU);
        ctx.fill();
      }
      ctx.strokeStyle = '#6a6a7e';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      // The trolley: two little wheels on the cable and a T handle hanging from them.
      const len = Math.hypot(z.x2 - z.x1, z.y2 - z.y1);
      const d = z.rideD ?? 14;
      const u = Math.max(0, Math.min(1, d / len));
      const tx = ax + (bx - ax) * u;
      const ty2 = ay + (by - ay) * u;
      ctx.fillStyle = '#ff8a8a';
      ctx.fillRect(snap(tx - 6), snap(ty2 - 2), 12, 5);
      ctx.fillStyle = '#ffffff';
      for (const dx of [-3.5, 3.5]) {
        ctx.beginPath();
        ctx.arc(tx + dx, ty2 - 1, 2, 0, TAU);
        ctx.fill();
      }
      // (The bar hangs where a rider's raised hands are: the line's `hang` below the cable is her
      // feet, her hands about 42 above them.)
      const drop = Math.max(8, z.hang - 44);
      ctx.fillStyle = '#8a7a9a';
      ctx.fillRect(snap(tx - 0.6), snap(ty2 + 3), 1.2, drop - 2);
      ctx.fillStyle = '#ffd36b';
      ctx.fillRect(snap(tx - 7), snap(ty2 + drop), 14, 3);
      return true;
    }
    case 'hutroom': {
      // (The floor runs past the bottom of the view: you walk on the hut's own boards.)
      const s = extra ?? 1;
      const by = 480 - cam.y;
      if (s >= 2) place(ctx, kitchenArt(), snap(640 + 130 - cam.x), by);
      if (s >= 4) place(ctx, sunroomArt(), snap(900 + 140 - cam.x), by);
      place(ctx, roomArt(), snap(x), by);
      if (s >= 3) place(ctx, loftArt(), snap((IN.loft[0] + IN.loft[1]) / 2 - cam.x), IN.loftY + 20 - cam.y);
      // (Past the last room, a plain wall, so a wide view never shows the void.)
      const end = roomWidth(s) - cam.x;
      if (end < width) {
        ctx.fillStyle = '#b8865a';
        ctx.fillRect(snap(end), 0, width - end + 2, 480);
      }
      return true;
    }
    case 'grottopool': {
      place(ctx, grottoArt(), snap(x), 420 + 60 - cam.y);
      // Light off the water playing over the crystals.
      glow(ctx, x, 440 - cam.y, 150, '#7fe6d6', 0.18 + 0.05 * Math.sin(time * 0.9));
      return true;
    }
    default:
      return false;
  }
}
