// Gathering and mining spots (world/gathering.js), drawn as props in the game's own style (the prop
// kit's hue-shifted ramps, one upper-left light, outlines in a darker shade of each part's own
// colour; render/propkit.js): a herb clump, a flower, a little fruit tree, a straw hive with its
// bees, a rock seamed with ore, a tree to chop, a tuft of fibre. Each tier's material has its own
// look (copper, iron, silver and mithril ore; oak, maple, cedar and skywood; cotton, silkmoss,
// lotus fibre and cloud cotton; the herbs, flowers and fruit of each region).
//
// Everything has idle life, phased by the spot's own world x (never its place on screen): leaves
// and crowns sway in the map's wind, fruit bobs on its stem, bees circle, ore veins glint, cotton
// bobs. A worked spot reacts (the rock jolts and the tree shudders with each blow, render/life.js),
// shows what's left once it's used, and grows back through a few stages, each easing into the next.
// The "▲ Gather" hint shows over the one you're at, and the finds pop out of it when you're done.

import { R, E, T, F, mix, snap, blit } from './pixel.js';
import { art, place } from './scenery.js';
import { ramp, foliage, bark, crystal, hash, lean } from './propkit.js';
import { text, box, COLORS } from '../ui/kit.js';
import { nodesOf, nodeReady, nodeHere, nodeOpen } from '../world/gathering.js';
import { KINDS } from '../data/gathering.js';
import { ITEMS } from '../data/items.js';
import { itemIcon } from './icons.js';
import { spotHit, lifePose } from './life.js';

const TAU = Math.PI * 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const soft = (t) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t));

// ---------- Tiers ----------

// A spot's tier: its own `tier`, or what it gives (the plan's materials), or its region.
const TIER_OF_ITEM = {
  copper_ore: 1, iron_ore: 2, silver_ore: 3, mithril_ore: 4,
  oak_log: 1, maple_log: 2, cedar_log: 3, skywood_log: 4,
  cotton: 1, silkmoss: 2, lotus_fiber: 3, cloud_cotton: 4,
  rose_quartz: 1, amethyst: 2, sapphire: 3, starstone: 4,
};
const TIER_OF_MAP = {
  meadow1: 1, meadow2: 1, trainfield: 1, canyon: 1, dawnbeach: 1,
  woods: 2, glade: 2, hollow_gate: 2, ruins: 2,
  shrine: 3, ridge: 3, cave: 3, springs: 3, tea: 3,
  peak: 4, sky: 4, starfall: 4, bossroom: 4,
};
function tierOf(n, mapId) {
  if (n.tier) return Math.max(1, Math.min(4, n.tier));
  for (const id of Object.keys(n.pool ?? {})) if (TIER_OF_ITEM[id]) return TIER_OF_ITEM[id];
  return TIER_OF_MAP[mapId] ?? 1;
}
// The colour of what a spot gives (for herbs, flowers and fruit the builders may name new ones).
const findColor = (n, fallback) => {
  const id = Object.entries(n.pool ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0];
  return ITEMS[id]?.color ?? fallback;
};
const GEMS = { rose_quartz: '#ffb3d1', amethyst: '#c9a2ff', sapphire: '#86aaff', starstone: '#ffe680' };

// ---------- Small shared shapes ----------

// A prop drawn bigger by `k`: its shapes are re-rendered at that size (never a stretched bitmap).
function scaled(shapes, k) {
  return shapes.filter(Boolean).map((sh) => {
    const o = { ...sh, x: sh.x * k, y: sh.y * k };
    if (sh.w != null) Object.assign(o, { w: sh.w * k, h: sh.h * k });
    if (sh.rx != null) Object.assign(o, { rx: sh.rx * k, ry: sh.ry * k });
    if (sh.pts) o.pts = sh.pts.map(([x, y]) => [x * k, y * k]);
    return o;
  });
}
const big = (key, w, h, k, build, lit = true) => art(key, Math.ceil(w * k), Math.ceil(h * k), () => scaled(build(), k), lit);

// The game's curvy four-point sparkle: concave sides, a white core.
function sparkleShape(x, y, r, c) {
  const pts = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU - Math.PI / 2;
    const b = a + TAU / 8;
    pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
    pts.push([x + Math.cos(b) * r * 0.22, y + Math.sin(b) * r * 0.22]);
  }
  return [F(T(pts, c)), F(E(x, y, r * 0.22, r * 0.22, '#ffffff'))];
}
const sparkleArt = (c) => art(`spot|sparkle|${c}`, 9, 9, () => sparkleShape(4.5, 4.5, 4, c), false);

// A twinkle that pops in, holds, and fades, on its own beat (phase from the spot's world x).
function twinkle(ctx, x, y, time, seed, c = '#fff6c8', size = 1, every = 2.6) {
  const u = (((time + hash(seed) * every) / every) % 1 + 1) % 1;
  if (u > 0.32) return;
  const k = Math.sin((u / 0.32) * Math.PI);
  const s = sparkleArt(c);
  const sc = (0.45 + 0.55 * k) * size;
  ctx.save();
  ctx.globalAlpha = Math.min(1, k * 1.6);
  blit(ctx, s, x - (s.w / 2) * sc, y - (s.h / 2) * sc, { scale: sc });
  ctx.restore();
}

// Leaf: a pointed oval along angle `a` (radians, 0 = right), from its base.
function leaf(x, y, len, w, a, c) {
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const at = (u, v) => [x + ca * u - sa * v, y + sa * u + ca * v];
  return T([at(0, 0), at(len * 0.3, -w), at(len * 0.75, -w * 0.7), at(len, 0), at(len * 0.75, w * 0.7), at(len * 0.3, w)], c);
}
// A round leaf (clover): a disc made of a heart-ish notch.
const roundLeaf = (x, y, r, c) => E(x, y, r, r * 0.85, c);
const stem = (x0, y0, x1, y1, w, c) => {
  const nx = -(y1 - y0);
  const ny = x1 - x0;
  const l = Math.hypot(nx, ny) || 1;
  const k = w / 2 / l;
  return T([[x0 + nx * k, y0 + ny * k], [x1 + nx * k * 0.6, y1 + ny * k * 0.6], [x1 - nx * k * 0.6, y1 - ny * k * 0.6], [x0 - nx * k, y0 - ny * k]], c);
};
// A soil mound under a plant, in the ground's own warm tones.
const soil = (cx, gy, w, c = '#c99a7a') => [T([[cx - w, gy + 0.6], [cx - w * 0.6, gy - 1.6], [cx + w * 0.5, gy - 1.8], [cx + w, gy + 0.6]], c), F(T([[cx - w * 0.5, gy - 1.2], [cx + w * 0.3, gy - 1.5], [cx + w * 0.1, gy - 0.6], [cx - w * 0.4, gy - 0.4]], ramp(c).hi))];

// ---------- Herbs ----------

// Tier looks: round clover, pointed mint, silvery sage with a violet spike, teal star anise with gold
// star pods. Stage 0 is cut stubs, 1 a sprout, 2 half grown, 3 ready.
const HERBS = [
  { leaf: '#7fd07a', shape: 'round' },
  { leaf: '#86dcae', shape: 'point' },
  { leaf: '#b0cfa0', shape: 'oval', spike: '#b9a0f0' },
  { leaf: '#6fd0c4', shape: 'point', pods: '#ffd36a' },
];
function herbArt(tier, stage, c) {
  const h = HERBS[tier - 1];
  const leafC = h.leaf;
  return big(`spot|herb|${tier}|${stage}|${c}`, 26, 24, 1.3, () => {
    const r = ramp(leafC);
    const gy = 23;
    const out = [...soil(13, gy, 8)];
    if (stage === 0) {
      for (const dx of [-3, 0, 3]) out.push(R(13 + dx - 0.6, gy - 2.6, 1.2, 2.4, r.sh), F(R(13 + dx - 0.6, gy - 2.8, 1.2, 0.6, r.hi)));
      return out;
    }
    const k = [0, 0.45, 0.75, 1][stage];
    const sprigs = [[-6, 10, -0.5], [6, 11, 0.5], [-1, 16, -0.1], [2.5, 13.5, 0.25], [-3.5, 12.5, -0.3]].slice(0, stage === 1 ? 2 : stage === 2 ? 4 : 5);
    for (const [dx, hh, tilt] of sprigs) {
      const x0 = 13 + dx * 0.3;
      const x1 = 13 + dx * k + tilt * 2;
      const y1 = gy - hh * k;
      out.push(stem(x0, gy - 1, x1, y1, 1, r.sh));
      if (h.shape === 'round') {
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * TAU + 0.4;
          out.push(roundLeaf(x1 + Math.cos(a) * 2 * k, y1 + Math.sin(a) * 1.6 * k, 1.9 * k + 0.4, i % 2 ? r.base : mix(r.base, r.hi, 0.35)));
        }
        out.push(F(E(x1, y1, 0.5, 0.5, r.hi)));
      } else {
        const len = (h.shape === 'oval' ? 4.6 : 5.6) * k + 1;
        const w = (h.shape === 'oval' ? 1.8 : 1.4) * k + 0.4;
        out.push(leaf(x1, y1, len, w, -Math.PI / 2 - 0.9 + tilt, r.base), leaf(x1, y1, len, w, -Math.PI / 2 + 0.9 + tilt, mix(r.base, r.sh, 0.4)), leaf(x1, y1 + 1, len * 0.9, w, -Math.PI / 2 + tilt, mix(r.base, r.hi, 0.3)));
        out.push(F(T([[x1, y1 + 0.8], [x1 + 0.3, y1 - len * 0.7], [x1 + 0.7, y1 + 0.6]], r.hi)));
      }
    }
    if (stage === 3 && h.spike) {
      const sr = ramp(h.spike);
      for (let i = 0; i < 4; i++) out.push(E(13.5 + i * 0.3, gy - 18 - i * 2, 1.4 - i * 0.2, 1.2, i % 2 ? sr.base : sr.hi));
    }
    if (stage === 3 && h.pods) {
      for (const [px, py] of [[7, gy - 11], [18, gy - 13]]) out.push(...sparkleShape(px, py, 2.6, h.pods));
    }
    // The find's own colour in the clump's heart (a herb named by the region's builder).
    if (stage === 3 && c && h.shape !== 'round') out.push(F(E(13, gy - 7, 1.2, 1, c)));
    return out;
  });
}

// ---------- Flowers ----------

const FLOWERS = [
  { petal: '#ffffff', heart: '#ffd84a', kind: 'daisy' },
  { petal: '#9ab4ff', heart: '#e8f0ff', kind: 'bell' },
  { petal: '#ffb3d1', heart: '#ffe9a6', kind: 'lotus' },
  { petal: '#ffe680', heart: '#fff8d8', kind: 'star' },
];
// The bloom itself, drawn on its own so it can bob on the stem.
function bloomArt(tier, stage, c) {
  const f = FLOWERS[tier - 1];
  const petal = stage === 3 ? (c && tier !== 1 && tier !== 4 ? c : f.petal) : '#c8e8b0';
  return big(`spot|bloom|${tier}|${stage}|${petal}`, 16, 14, 1.35, () => {
    const r = ramp(petal, 0.8);
    const cx = 8;
    const cy = 7;
    if (stage < 3) {
      // A closed bud, swelling stage by stage.
      const s = [0, 1.2, 1.8][stage];
      if (!s) return [];
      return [E(cx, cy + 2, s, s * 1.4, '#9ad88f'), F(E(cx - s * 0.3, cy + 1.4, s * 0.4, s * 0.8, '#c8f0b0')), F(T([[cx - s, cy + 3], [cx, cy + 4.6], [cx + s, cy + 3]], '#6cc46c'))];
    }
    const out = [];
    if (f.kind === 'daisy') {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU;
        out.push(E(cx + Math.cos(a) * 3.2, cy + Math.sin(a) * 2.6, 2, 1, i % 3 === 0 ? r.sh : r.base));
      }
      out.push(E(cx, cy, 2, 1.8, f.heart), F(E(cx - 0.5, cy - 0.5, 0.8, 0.7, '#fff6c8')));
    } else if (f.kind === 'bell') {
      for (const [dx, dy, s] of [[-3.4, 1, 1], [0.6, -1, 1.15], [3.6, 2, 0.9]]) {
        const x = cx + dx;
        const y = cy + dy;
        out.push(T([[x - 2 * s, y + 2.4 * s], [x - 1.6 * s, y - 1.2 * s], [x, y - 2 * s], [x + 1.6 * s, y - 1.2 * s], [x + 2 * s, y + 2.4 * s], [x + 1, y + 1.8 * s], [x, y + 2.6 * s], [x - 1, y + 1.8 * s]], r.base));
        out.push(F(T([[x - 1.4 * s, y + 1.6 * s], [x - 1.1 * s, y - 0.8 * s], [x - 0.2, y - 1.4 * s], [x - 0.4, y + 1.2 * s]], r.hi)));
      }
    } else if (f.kind === 'lotus') {
      for (const [a, len, w, cc] of [[-2.4, 5, 2, r.sh], [-0.7, 5, 2, r.sh], [-1.9, 5.6, 2, r.base], [-1.2, 5.6, 2, r.base], [-1.57, 6, 2.2, mix(r.base, r.hi, 0.5)]]) out.push(leaf(cx, cy + 3, len, w, a, cc));
      out.push(F(E(cx, cy + 1.4, 1.2, 0.7, f.heart)));
    } else {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU - Math.PI / 2;
        out.push(leaf(cx, cy, 5.4, 1.8, a, i % 2 ? r.base : mix(r.base, r.hi, 0.4)));
      }
      out.push(E(cx, cy, 1.6, 1.6, f.heart), ...sparkleShape(cx, cy, 2, '#ffffff'));
    }
    return out;
  });
}
function flowerStemArt(tier, stage) {
  return big(`spot|fstem|${tier}|${stage}`, 20, 22, 1.35, () => {
    const r = ramp('#7cc878');
    const gy = 21;
    const out = [...soil(10, gy, 6)];
    const h = [3, 7, 11, 13][stage];
    out.push(stem(10, gy - 1, 10.5, gy - h, 1.1, r.sh));
    const lk = [0.4, 0.7, 1, 1][stage];
    out.push(leaf(10, gy - 2, 6 * lk, 1.8 * lk, -2.5, r.base), leaf(10.4, gy - 3, 6.5 * lk, 1.8 * lk, -0.6, mix(r.base, r.hi, 0.3)));
    if (tier === 3) out.push(E(10, gy - 0.4, 8, 1.6, '#7fd0a8'), F(E(8, gy - 0.9, 4, 0.6, '#b8f0d0')));
    return out;
  });
}

// ---------- Fruit ----------

// A little fruit tree (cherry blossom, apple bush, peach tree, sky starfruit), the crown at about
// the height she reaches up to, the fruit hanging under it on their own stems.
const FRUITS = [
  { crown: '#ffc8de', bark: '#b98a6e', fruit: '#ff4f6e', blossom: '#ffffff' },
  { crown: '#86d27e', bark: '#a87a5a', fruit: '#ff6464' },
  { crown: '#9ed890', bark: '#b48a6a', fruit: '#ffb08a' },
  { crown: '#b4e2ff', bark: '#cdbbe8', fruit: '#ffe36b', star: true },
];
// Where the fruit hang, from the tree's base (x, y): dx, dy of each stem's top.
const FRUIT_AT = [[9, -43], [-14, -42], [-6, -39]];
function fruitTreeArt(tier, part, stage) {
  const f = FRUITS[tier - 1];
  return art(`spot|ftree|${tier}|${part}|${stage}`, 64, 66, () => {
    const cx = 32;
    const gy = 65;
    if (part === 'trunk') {
      const br = ramp(f.bark);
      return [...soil(cx, gy, 9, '#c4a080'), ...bark([[cx, gy], [cx - 0.6, gy - 18], [cx + 0.8, gy - 40]], (u) => 3 - 1.2 * u, br, tier, 3), ...bark([[cx, gy - 26], [cx + 10, gy - 40]], (u) => 1.3 - 0.5 * u, br, tier + 3, 0), ...bark([[cx, gy - 30], [cx - 11, gy - 41]], (u) => 1.2 - 0.4 * u, br, tier + 5, 0)];
    }
    const cr = ramp(f.crown);
    const out = [...foliage(cx, gy - 51, 22, 12, cr, tier * 1.7), ...foliage(cx - 14, gy - 44, 11, 7, cr, tier * 2.3, { tips: 1 }), ...foliage(cx + 14, gy - 45, 11, 7, cr, tier * 3.1, { tips: 1 })];
    if (f.blossom && stage === 3) for (let i = 0; i < 6; i++) out.push(...sparkleShape(cx - 18 + hash(i * 3.1) * 36, gy - 58 + hash(i * 7.7) * 14, 1.6, f.blossom));
    return out;
  });
}
function fruitArt(tier, stage, c) {
  const f = FRUITS[tier - 1];
  const col = c ?? f.fruit;
  return art(`spot|fruit|${tier}|${stage}|${col}`, 10, 18, () => {
    const s = [0, 0.45, 0.7, 1][stage];
    if (!s) return [];
    const r = ramp(stage === 3 ? col : mix(col, '#9ad88f', stage === 1 ? 0.7 : 0.35));
    const cx = 5;
    const cy = 11 + 3 * s;
    const out = [stem(cx, 0.5, cx + 0.3, cy - 2.4 * s, 0.8, '#6aa86a')];
    if (f.star && stage === 3) {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU - Math.PI / 2;
        const rr = i % 2 ? 1.5 : 3.4;
        pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
      }
      out.push(T(pts, r.base), F(T(pts.slice(5, 9).concat([[cx, cy]]), r.sh)));
    } else {
      out.push(E(cx, cy, 2.9 * s + 0.3, 2.7 * s + 0.3, r.base), F(E(cx + 0.9 * s, cy + 0.8 * s, 1.6 * s, 1.5 * s, r.sh)));
    }
    // Glossy: a hard white catchlight high on the lit side.
    if (stage === 3) out.push(F(E(cx - 1.1, cy - 1.1, 0.9, 0.7, '#ffffff')), F(E(cx - 0.4, cy - 1.6, 0.4, 0.3, r.hi)));
    out.push(leaf(cx + 0.3, 1.4, 3.2 * Math.max(0.6, s), 1.1, 0.3, '#86d27e'));
    return out;
  });
}

// ---------- Honey ----------

// A straw skep hanging from a bent post, rings of woven straw, a dark doorway, honey welling at the
// lip; bees circle it (drawn live). Taken, the comb inside shows pale and the bees are fewer.
function hiveArt(stage) {
  return art(`spot|hive|${stage}`, 34, 46, () => {
    const gy = 45;
    const post = ramp('#b48a6a');
    const out = [...soil(9, gy, 5, '#c4a080'), ...bark([[9, gy], [9.4, gy - 30], [12, gy - 38], [20, gy - 40]], (u) => 1.8 - 0.7 * u, post, 2, 1)];
    const st = ramp('#f2c06c');
    const cx = 21;
    const top = gy - 38;
    out.push(R(cx - 0.4, top - 1.8, 0.8, 3.4, '#a87a5a'));
    // The rings of the skep, widest at the bottom.
    const rings = [[3.4, 3.2], [5.6, 3.4], [7.4, 3.4], [8.4, 3.4], [8.2, 3.2]];
    let y = top + 1;
    rings.forEach(([w, hh], i) => {
      out.push(E(cx, y + hh / 2, w, hh * 0.72, i % 2 ? st.base : mix(st.base, st.hi, 0.25)));
      out.push(F(E(cx + w * 0.38, y + hh * 0.6, w * 0.5, hh * 0.42, st.sh)));
      out.push(F(R(cx - w * 0.6, y + hh * 0.85, w * 1.2, 0.5, st.deep)));
      y += hh - 0.4;
    });
    out.push(E(cx, y - 0.6, 7.6, 1.6, st.sh));
    // The doorway, and honey at its lip (gone while it refills). Ready, it's brimming: a big golden
    // drip runs down the skep from the doorway and a glossy honey drop hangs off the bottom, with a
    // wedge of comb peeking out, so it reads as ready at a glance; taken, the doorway shows an empty
    // pale comb and the straw is a little dull.
    out.push(F(E(cx - 1.6, y - 4.4, 1.8, 1.4, '#7a4a3a')));
    if (stage === 3) {
      const hy = ramp('#ffb020');
      out.push(F(T([[cx - 4.2, y - 4.6], [cx + 0.8, y - 4.6], [cx + 0.2, y - 2], [cx - 0.6, y + 1.6], [cx - 1.6, y + 4.2], [cx - 2.8, y + 1.4], [cx - 3.6, y - 1.6]], hy.base)));
      out.push(F(T([[cx - 3.4, y - 4], [cx - 1.8, y - 4], [cx - 2.2, y - 1], [cx - 2.6, y + 1]], hy.hi)));
      out.push(E(cx - 1.6, y + 5, 1.6, 1.8, hy.base), F(E(cx - 2.1, y + 4.5, 0.6, 0.6, '#fff6d8')));
      // A wedge of comb at the doorway, its cells lit.
      out.push(F(T([[cx + 1.6, y - 6.4], [cx + 5, y - 6], [cx + 4.6, y - 3], [cx + 1.6, y - 3.6]], '#ffd36a')));
      for (const [dx, dy] of [[2.6, -5.4], [4, -5.2], [3.3, -4.2]]) out.push(F(E(cx + dx, y + dy, 0.45, 0.4, '#e8a23a')));
    } else if (stage > 0) out.push(F(E(cx - 1.6, y - 3.2, 0.7 + 0.9 * stage, 0.5 + 0.35 * stage, '#ffc83a')));
    else out.push(F(E(cx - 1.6, y - 4.2, 1.2, 0.8, '#e8dcc8')), F(E(cx - 1.3, y - 4.4, 0.35, 0.3, '#c8b8a0')));
    return out;
  });
}
function beeArt(wing) {
  return art(`spot|bee|${wing}`, 7, 6, () => [
    F(E(3.6, wing ? 1.6 : 2.2, 1.4, wing ? 1.2 : 0.8, '#ffffff')),
    E(3.4, 3.6, 2.2, 1.5, '#ffd24a'), F(R(3, 2.2, 0.7, 2.8, '#5a4060')), F(R(4.2, 2.3, 0.6, 2.6, '#5a4060')),
    F(E(1.6, 3.6, 0.7, 0.7, '#5a4060')),
  ], false);
}

// ---------- Ore ----------

// A rock mound in the world's lavender stone, its seams of ore in the tier's own metal:
// copper nuggets, iron in dark blue seams with rust, silver in bright bands, mithril as teal crystal.
// A gem-bearing rock shows a faceted gem. Mined, it's a broken stump that fills back in.
const ORES = [
  { stone: '#c8b4c8', ore: '#f0a070', style: 'nugget' },
  { stone: '#b4aac4', ore: '#8e9cc0', rust: '#d88a64', style: 'seam' },
  { stone: '#aca4c8', ore: '#eef4ff', style: 'band' },
  { stone: '#a49ac4', ore: '#7ff0e4', style: 'crystal' },
];
function rockArt(tier, stage, gem) {
  const o = ORES[tier - 1];
  return big(`spot|rock|${tier}|${stage}|${gem}`, 36, 26, 1.35, () => {
    const s = ramp(o.stone);
    const m = ramp(o.ore);
    const cx = 18;
    const gy = 25;
    const k = [0.5, 0.7, 0.85, 1][stage];
    const out = [];
    // The mound: three lumps with lit top-left planes and a deep base.
    const lump = (x, y, rx, ry) => [T([[x - rx, y + ry * 0.8], [x - rx * 0.9, y - ry * 0.3], [x - rx * 0.45, y - ry], [x + rx * 0.4, y - ry * 0.95], [x + rx, y - ry * 0.1], [x + rx * 0.95, y + ry * 0.8]], s.base),
      F(T([[x - rx * 0.8, y - ry * 0.2], [x - rx * 0.4, y - ry * 0.85], [x + rx * 0.2, y - ry * 0.85], [x - rx * 0.1, y - ry * 0.3]], s.hi)),
      F(T([[x + rx * 0.3, y - ry * 0.5], [x + rx, y - ry * 0.05], [x + rx * 0.95, y + ry * 0.8], [x + rx * 0.2, y + ry * 0.8]], s.sh))];
    out.push(...lump(cx + 6, gy - 5 * k, 8 * k + 1, 6 * k), ...lump(cx - 6, gy - 5 * k, 8 * k + 1, 5.4 * k), ...lump(cx, gy - 9 * k, 9 * k + 1, 8 * k));
    out.push(F(R(cx - 15 * k, gy - 1.2, 30 * k, 1.4, s.deep)));
    if (stage === 0) {
      // Broken: a jagged fresh face and a crack.
      out.push(F(T([[cx - 4, gy - 8], [cx - 1, gy - 10], [cx + 3, gy - 8.6], [cx + 1, gy - 6.4], [cx - 2.4, gy - 6]], s.hi)), F(T([[cx - 2, gy - 6], [cx, gy - 3.6], [cx + 1.6, gy - 5.2], [cx + 0.6, gy - 3]], s.deep)));
      for (const [dx, dy] of [[-12, -1], [11, -1.4], [14, -0.8]]) out.push(E(cx + dx, gy + dy, 1.6, 1.1, s.sh));
      return out;
    }
    const vis = stage / 3;
    let seamFull = () => {};
    if (o.style === 'nugget') {
      for (const [dx, dy, r] of [[-5, -10, 2.2], [3, -13, 1.8], [7, -7, 2], [-9, -5, 1.6], [0, -6, 1.4]].slice(0, Math.ceil(5 * vis))) {
        out.push(E(cx + dx * k, gy + dy * k, r, r * 0.8, m.base), F(E(cx + dx * k + r * 0.3, gy + dy * k + r * 0.25, r * 0.6, r * 0.5, m.sh)), F(E(cx + dx * k - r * 0.35, gy + dy * k - r * 0.3, r * 0.4, r * 0.3, m.hi)));
      }
    } else if (o.style === 'seam') {
      const seam = (pts, w) => out.push(T([...pts.map(([x, y]) => [cx + x * k, gy + y * k - w]), ...pts.slice().reverse().map(([x, y]) => [cx + x * k, gy + y * k + w])], m.sh), F(T([...pts.map(([x, y]) => [cx + x * k, gy + y * k - w]), ...pts.slice().reverse().map(([x, y]) => [cx + x * k, gy + y * k - w * 0.2])], m.base)));
      seam([[-11, -5], [-6, -9], [-1, -8], [4, -12]], 1.1 * vis + 0.3);
      if (stage >= 2) seam([[2, -5], [7, -7], [11, -5]], 0.9);
      seamFull = () => seam([[-9, -12], [-4, -14], [2, -15.5]], 1.3);
      for (const [dx, dy] of [[-6, -8], [6, -6.6]].slice(0, stage)) out.push(F(E(cx + dx * k, gy + dy * k, 1, 0.8, o.rust)));
    } else if (o.style === 'band') {
      for (const [y0, y1, w] of [[-12, -9, 1.3], [-6, -4, 1]].slice(0, stage >= 2 ? 2 : 1)) {
        out.push(T([[cx - 8 * k, gy + y0 * k], [cx + 1 * k, gy + (y0 - 2) * k], [cx + 9 * k, gy + (y1 - 1) * k], [cx + 9 * k, gy + (y1 + w) * k], [cx + 1 * k, gy + (y0 - 2 + w * 1.6) * k], [cx - 8 * k, gy + (y0 + w * 1.4) * k]], m.base));
        out.push(F(R(cx - 5 * k, gy + (y0 - 0.6) * k, 5 * k, 0.6, '#ffffff')));
      }
    } else {
      const mr = ramp(o.ore);
      for (const [dx, w, hgt, lean] of [[-4, 3.6, 9, -1.6], [1, 4.4, 12, 0.6], [6, 3.2, 8, 2]].slice(0, stage)) out.push(...crystal(cx + dx * k, w, gy - 8 * k - hgt * 0.4, gy - 8 * k - hgt, gy - 7 * k, mr, lean));
    }
    // Fully grown back, the ore swells out of the rock: a fat extra vein and a bright glint over it,
    // so a ready rock reads apart from one still filling in.
    if (stage === 3) {
      if (o.style === 'seam') seamFull();
      else if (o.style === 'band') out.push(T([[cx - 6 * k, gy - 1 * k], [cx + 7 * k, gy - 3 * k], [cx + 7 * k, gy - 1.6 * k], [cx - 6 * k, gy + 0.4 * k]], m.base));
      else if (o.style === 'nugget') out.push(E(cx + 10 * k, gy - 11 * k, 2.6, 2.1, m.base), F(E(cx + 9.3 * k, gy - 11.7 * k, 1, 0.8, m.hi)));
      out.push(...sparkleShape(cx + 3 * k, gy - 17.5 * k, 2.6, '#ffffff'), ...sparkleShape(cx - 8 * k, gy - 11 * k, 1.5, m.hi));
    }
    if (gem && stage === 3) {
      const gr = ramp(gem);
      out.push(...crystal(cx + 10 * k, 3, gy - 11 * k, gy - 15 * k, gy - 8 * k, gr, 1.2));
    }
    return out;
  });
}

// ---------- Wood ----------

// A tree to chop: oak (a round green crown), maple (coral-red lobed crown), cedar (a tall dark
// teal cone, reddish bark), skywood (pale lilac bark, a crown of soft sky cloud). Chopped, a stump
// with its rings, a sapling coming up beside it that grows back into the tree.
const WOODS = [
  { bark: '#b48464', crown: '#8ed27a', shape: 'round' },
  { bark: '#a8745e', crown: '#ff9a72', shape: 'lobed' },
  { bark: '#c47e62', crown: '#5fb8a0', shape: 'cone' },
  { bark: '#d8c6f2', crown: '#c4e6ff', shape: 'cloud' },
];
function treeArt(tier, part, stage) {
  const w = WOODS[tier - 1];
  return art(`spot|tree|${tier}|${part}|${stage}`, 60, 74, () => {
    const cx = 30;
    const gy = 73;
    const br = ramp(w.bark);
    const cr = ramp(w.crown);
    const k = [0, 0.4, 0.7, 1][stage];
    if (part === 'trunk') {
      const out = [...soil(cx, gy, 11, '#c4a080')];
      if (stage === 0) {
        // The stump: bark round a cut face of rings, chips at its foot.
        out.push(...bark([[cx, gy], [cx, gy - 9]], () => 4.6, br, tier, 1));
        out.push(E(cx, gy - 9, 4.6, 1.6, '#f0d4a8'), F(E(cx, gy - 9, 3, 1, '#e0b884')), F(E(cx, gy - 9, 1.4, 0.5, '#c4955e')));
        for (const [dx, dy] of [[-8, -0.6], [7, -0.4], [10, -1]]) out.push(E(cx + dx, gy + dy, 1.4, 0.7, '#f0d4a8'));
        return out;
      }
      const top = gy - 54 * k;
      out.push(...bark([[cx, gy], [cx - 0.6, gy - 20 * k], [cx + 0.4, top]], (u) => (4.4 - 1.8 * u) * (0.5 + 0.5 * k), br, tier, 3));
      if (k > 0.6) out.push(...bark([[cx, gy - 30 * k], [cx + 9 * k, gy - 42 * k]], (u) => 1.6 - 0.6 * u, br, tier + 2, 0), ...bark([[cx, gy - 34 * k], [cx - 9 * k, gy - 45 * k]], (u) => 1.4 - 0.5 * u, br, tier + 4, 0));
      // Roots flaring into the ground.
      out.push(T([[cx - 7, gy + 0.4], [cx - 3, gy - 3], [cx - 2, gy + 0.4]], br.base), T([[cx + 7, gy + 0.4], [cx + 3, gy - 3], [cx + 2, gy + 0.4]], br.sh));
      return out;
    }
    if (stage === 0) {
      // A sapling by the stump.
      return [stem(cx + 9, gy - 1, cx + 9.4, gy - 8, 1, br.sh), leaf(cx + 9.4, gy - 8, 4, 1.5, -2.4, cr.base), leaf(cx + 9.4, gy - 8, 4, 1.5, -0.7, cr.hi)];
    }
    const cy = gy - 56 * k;
    if (w.shape === 'cone') {
      const out = [];
      for (let i = 0; i < 4; i++) {
        const y0 = cy + 14 * k - i * 9 * k;
        const hw = (15 - i * 3.2) * k;
        out.push(T([[cx - hw, y0], [cx - hw * 0.3, y0 - 9 * k], [cx, y0 - 13 * k], [cx + hw * 0.3, y0 - 9 * k], [cx + hw, y0], [cx + hw * 0.5, y0 - 1.4], [cx, y0 + 0.6], [cx - hw * 0.5, y0 - 1.4]], i % 2 ? cr.base : mix(cr.base, cr.sh, 0.3)));
        out.push(F(T([[cx - hw * 0.8, y0 - 0.6], [cx - hw * 0.25, y0 - 9 * k], [cx - hw * 0.05, y0 - 6 * k], [cx - hw * 0.4, y0 - 1]], cr.hi)));
      }
      return out;
    }
    if (w.shape === 'cloud') {
      const out = [];
      for (const [dx, dy, rx, ry] of [[0, 0, 16, 10], [-11, 5, 9, 7], [11, 4, 10, 7], [-5, -7, 9, 7], [6, -8, 8, 6]]) {
        out.push(E(cx + dx * k, cy + dy * k, rx * k, ry * k, cr.base), F(E(cx + dx * k - rx * 0.2 * k, cy + dy * k - ry * 0.25 * k, rx * 0.7 * k, ry * 0.6 * k, cr.hi)));
      }
      for (let i = 0; i < 4; i++) out.push(...sparkleShape(cx - 12 * k + hash(i * 5.3) * 24 * k, cy - 6 * k + hash(i * 2.1) * 12 * k, 1.6, '#fff6c8'));
      return out;
    }
    const lobed = w.shape === 'lobed';
    return [
      ...foliage(cx, cy, 18 * k, 13 * k, cr, tier * 1.3 + 0.5, { n: lobed ? 9 : 14 }),
      ...foliage(cx - 12 * k, cy + 7 * k, 9 * k, 7 * k, cr, tier * 2.7, { tips: 1, n: lobed ? 6 : 9 }),
      ...foliage(cx + 12 * k, cy + 6 * k, 10 * k, 7 * k, cr, tier * 3.9, { tips: 1, n: lobed ? 6 : 9 }),
    ];
  });
}

// ---------- Fibre ----------

// Cotton bolls on brown stalks; silkmoss tufts on a stone with silk threads; lotus fibre on a
// little pad of water; cloud cotton puffs floating over pale stalks (they bob, drawn live).
const FIBRES = [
  { puff: '#ffffff', stalk: '#b08460', kind: 'cotton' },
  { puff: '#a8e09a', stalk: '#9a90b8', kind: 'moss' },
  { puff: '#ffd8ea', stalk: '#7fc4a0', kind: 'lotus' },
  { puff: '#eef4ff', stalk: '#b4c4ee', kind: 'cloud' },
];
function fibreArt(tier, stage) {
  const f = FIBRES[tier - 1];
  return big(`spot|fibre|${tier}|${stage}`, 28, 24, 1.3, () => {
    const cx = 14;
    const gy = 23;
    const pr = ramp(f.puff, 0.7);
    const sr = ramp(f.stalk);
    const out = [];
    if (f.kind === 'moss') {
      out.push(...soil(cx, gy, 9, '#b4aac4'), E(cx, gy - 2.4, 9, 3.6, '#b4aac4'), F(E(cx - 2, gy - 3.6, 5, 1.6, '#d4cce0')));
      const k = [0.3, 0.55, 0.8, 1][stage];
      for (const [dx, r] of [[-5, 3.4], [0.5, 4.2], [5.5, 3]]) out.push(...foliage(cx + dx, gy - 4 - r * k * 0.8, r * k + 0.6, r * k * 0.8 + 0.4, pr, dx + tier, { tips: 1, n: 8 }));
      if (stage === 3) for (const dx of [-3, 3]) out.push(F(R(cx + dx, gy - 11, 0.4, 6, '#f4fff0')));
      return out;
    }
    if (f.kind === 'lotus') out.push(E(cx, gy - 0.6, 12, 2.2, '#86d0e8'), F(E(cx - 3, gy - 1, 6, 0.8, '#c4f0ff')));
    else out.push(...soil(cx, gy, 8));
    const stalks = [[-6, 11, -0.2], [0, 15, 0.05], [6, 12, 0.25]];
    for (const [dx, h, a] of stalks) {
      const x1 = cx + dx + a * 4;
      const y1 = gy - h;
      out.push(stem(cx + dx * 0.4, gy - 1, x1, y1, 1, sr.sh));
      if (f.kind === 'lotus') out.push(leaf(cx + dx * 0.4, gy - 3, 5, 1.6, dx < 0 ? -2.6 : -0.5, '#86d27e'));
      if (stage === 0) continue;
      // The boll: a calyx, then fluff bursting out of it as it ripens.
      out.push(T([[x1 - 2, y1 + 1], [x1, y1 + 2.6], [x1 + 2, y1 + 1]], sr.base));
      const k = [0, 0.4, 0.7, 1][stage];
      if (f.kind === 'cloud' && stage === 3) continue;
      for (const [ox, oy, r] of [[-1.4, -0.6, 1.8], [1.4, -0.6, 1.8], [0, -2, 2]]) out.push(E(x1 + ox * k, y1 + oy * k, r * k + 0.4, r * 0.9 * k + 0.4, pr.base));
      out.push(F(E(x1 - 0.8 * k, y1 - 1.6 * k, 1 * k, 0.8 * k, '#ffffff')));
    }
    return out;
  });
}
function cloudPuffArt() {
  return big('spot|cloudpuff', 12, 9, 1.3, () => {
    const r = ramp('#eef4ff', 0.7);
    return [E(6, 5, 4.6, 3, r.base), E(3.6, 5, 2.6, 2.2, r.base), E(8.4, 4.6, 2.8, 2.4, r.base), F(E(5, 3.6, 2.6, 1.4, '#ffffff')), F(R(2.2, 7, 7.6, 0.8, r.sh))];
  });
}

// ---------- Moonpetal (the night flower) ----------

function moonArt(stage) {
  return big(`spot|moon|${stage}`, 18, 22, 1.3, () => {
    const gy = 21;
    const out = [...soil(9, gy, 5), stem(9, gy - 1, 9.4, gy - 12, 1, '#5a9a80'), leaf(9, gy - 3, 5, 1.6, -2.6, '#6aa88a')];
    const r = ramp('#e6e2ff', 0.7);
    if (stage < 3) return [...out, E(9.4, gy - 13, 1.6, 2.4, r.sh)];
    for (let i = 0; i < 6; i++) out.push(leaf(9.4, gy - 13, 5, 1.8, (i / 6) * TAU, i % 2 ? r.base : r.hi));
    out.push(E(9.4, gy - 13, 1.6, 1.6, '#fff2b8'));
    return out;
  });
}

// ---------- Drawing ----------

// Stage 0 (just used) to 3 (ready), from how far it has grown back (0-1), each stage easing into
// the next over the last part of its span.
function staged(ctx, g, draw) {
  if (g >= 1) return draw(3, 1);
  const f = g * 3;
  const i = Math.floor(f);
  const u = f - i;
  draw(i, 1);
  if (u > 0.7) draw(Math.min(3, i + 1), soft((u - 0.7) / 0.3));
}
function placeA(ctx, s, x, y, alpha) {
  if (alpha >= 0.999) return place(ctx, s, x, y);
  ctx.save();
  ctx.globalAlpha *= alpha;
  place(ctx, s, x, y);
  ctx.restore();
}
function rotated(ctx, px, py, a, draw) {
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(a);
  ctx.translate(-px, -py);
  draw();
  ctx.restore();
}
// The jolt of the last blow on this spot (render/life.js): a decaying shiver.
function jolted(n, now) {
  const h = spotHit();
  if (h.x !== n.x) return 0;
  const e = now - h.at;
  if (e < 0 || e > 0.4) return 0;
  return Math.sin(e * 60) * (h.big ? 1.6 : 1) * (1 - e / 0.4) ** 2;
}

const DRAW = {
  herb(ctx, x, y, s) {
    const a = 0.05 * lean(s.time, s.wx) + 0.03 * s.jolt;
    staged(ctx, s.g, (st, al) => rotated(ctx, x, y, a * (st / 3), () => placeA(ctx, herbArt(s.tier, st, s.color), x, y + 1, al)));
    if (s.ready) twinkle(ctx, x + 7, y - 18, s.time, s.wx, '#fff6c8');
  },
  flower(ctx, x, y, s) {
    const a = 0.08 * lean(s.time, s.wx, 0.2) + 0.04 * s.jolt;
    staged(ctx, s.g, (st, al) => {
      placeA(ctx, flowerStemArt(s.tier, st), x, y + 1, al);
      const h = [3, 7, 11, 13][st];
      rotated(ctx, x, y, a, () => placeA(ctx, bloomArt(s.tier, st, s.color), x + 0.7, y - h * 1.35 + 10.5, al));
    });
    if (s.ready) twinkle(ctx, x + 6, y - 26, s.time, s.wx, s.tier === 4 ? '#ffe680' : '#fff6c8');
  },
  moonpetal(ctx, x, y, s) {
    staged(ctx, s.g, (st, al) => placeA(ctx, moonArt(st), x, y + 1, al));
    if (s.ready) {
      twinkle(ctx, x + 6, y - 23, s.time, s.wx, '#e6e2ff', 1.2, 1.8);
      twinkle(ctx, x - 5, y - 12, s.time + 0.9, s.wx + 3, '#fff2b8', 0.8, 2.2);
    }
  },
  fruit(ctx, x, y, s) {
    const a = 0.025 * lean(s.time, s.wx, 0.3) + 0.02 * s.jolt;
    staged(ctx, Math.min(1, s.g + 0.67), (st, al) => placeA(ctx, fruitTreeArt(s.tier, 'trunk', st), x, y + 1, al));
    rotated(ctx, x, y, a, () => staged(ctx, Math.max(0.67, s.g), (st, al) => placeA(ctx, fruitTreeArt(s.tier, 'crown', st), x, y + 1, al)));
    // Each fruit hangs from the crown and swings on its own stem a beat after the branch.
    FRUIT_AT.forEach(([dx, dy], i) => {
      // The one she's picking comes away in her hand.
      if (s.picked && i === 2) return;
      const fx = x + dx + a * dy;
      const fy = y + dy;
      const sw = 0.12 * Math.sin(s.time * 1.7 + s.wx * 0.05 + i * 1.9) + 0.1 * lean(s.time, s.wx, 0.5 + i * 0.1);
      rotated(ctx, fx, fy, sw, () => staged(ctx, s.g, (st, al) => placeA(ctx, fruitArt(s.tier, st, s.color), fx, fy + 17, al)));
    });
    if (s.ready) twinkle(ctx, x + 12, y - 30, s.time, s.wx);
  },
  honey(ctx, x, y, s) {
    staged(ctx, s.g, (st, al) => placeA(ctx, hiveArt(st), x, y + 1, al));
    // Bees on their loops round the hive, wings beating; fewer while it refills.
    const n = s.ready ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const t = s.time * (1.1 + 0.2 * i) + i * 2.1 + s.wx * 0.01;
      const bx = x + 4 + Math.cos(t) * (10 + 2 * i) + Math.sin(t * 2.3) * 2;
      const by = y - 24 + Math.sin(t * 1.3) * 7 + Math.cos(t * 3.1) * 1.5;
      const b = beeArt(Math.floor(s.time * 24 + i) % 2);
      ctx.save();
      if (Math.sin(t) < 0) {
        ctx.translate(bx * 2, 0);
        ctx.scale(-1, 1);
      }
      blit(ctx, b, bx - 3.5, by - 3, {});
      ctx.restore();
    }
    // A drop of honey welling and falling from the lip.
    if (s.ready) {
      const d = ((s.time * 0.5 + s.wx * 0.013) % 1 + 1) % 1;
      const r = ramp('#ffb020');
      ctx.fillStyle = r.base;
      ctx.beginPath();
      if (d < 0.7) ctx.ellipse(x + 3.4, y - 13.6 + d * 1.6, 0.9 + d, 1 + d * 1.4, 0, 0, TAU);
      else ctx.ellipse(x + 3.4, y - 12 + (d - 0.7) * 40, 1.1, 1.6, 0, 0, TAU);
      ctx.fill();
    }
  },
  ore(ctx, x, y, s) {
    const dx = s.jolt * 1.2;
    staged(ctx, s.g, (st, al) => placeA(ctx, rockArt(s.tier, st, st === 3 ? s.gem : null), x + dx, y + 1, al));
    if (!s.ready) return;
    // The metal glints in three steps along a vein, each on its own beat.
    const c = { 1: '#ffe0c4', 2: '#eef2ff', 3: '#ffffff', 4: '#c8fffa' }[s.tier];
    twinkle(ctx, x - 7, y - 15, s.time, s.wx, c, 0.9, 2.4);
    twinkle(ctx, x + 4, y - 19, s.time + 0.25, s.wx, c, 0.7, 2.4);
    if (s.tier >= 3) twinkle(ctx, x + 9, y - 11, s.time + 1.1, s.wx + 5, c, 0.8, 3);
    if (s.gem) twinkle(ctx, x + 13.5, y - 20, s.time + 0.6, s.wx + 9, s.gem, 1.1, 1.9);
  },
  wood(ctx, x, y, s) {
    // The tree shudders at each chop, its crown swaying in the wind a beat after the trunk.
    const sh = 0.03 * s.jolt;
    const a = 0.015 * lean(s.time, s.wx, 0.1) + sh;
    if (s.fell > 0) {
      // The last chop: it creaks, leans, then topples away from her (slow, then fast) and is gone,
      // leaving the stump.
      placeA(ctx, treeArt(s.tier, 'trunk', 0), x, y + 1, 1);
      const k = s.fell * s.fell;
      ctx.save();
      ctx.globalAlpha *= 1 - soft((s.fell - 0.6) / 0.4);
      rotated(ctx, x + s.dir * 3, y - 8, s.dir * k * 1.35, () => {
        placeA(ctx, treeArt(s.tier, 'trunk', 3), x, y + 1, 1);
        placeA(ctx, treeArt(s.tier, 'crown', 3), x, y + 1, 1);
      });
      ctx.restore();
      return;
    }
    rotated(ctx, x, y, sh * 0.4, () => staged(ctx, s.g, (st, al) => placeA(ctx, treeArt(s.tier, 'trunk', st), x, y + 1, al)));
    rotated(ctx, x, y, a + 0.012 * lean(s.time, s.wx, 0.5), () => staged(ctx, s.g, (st, al) => placeA(ctx, treeArt(s.tier, 'crown', st), x, y + 1, al)));
    if (s.ready && s.tier === 4) twinkle(ctx, x - 8, y - 62, s.time, s.wx, '#fff6c8');
  },
  fiber(ctx, x, y, s) {
    const a = 0.05 * lean(s.time, s.wx, 0.15) + 0.04 * s.jolt;
    staged(ctx, s.g, (st, al) => rotated(ctx, x, y, a * 0.6, () => placeA(ctx, fibreArt(s.tier, st), x, y + 1, al)));
    if (s.tier === 4 && s.g >= 1) {
      // Cloud cotton floats over its stalks, each puff bobbing on its own.
      for (const [dx, h, i] of [[-6, 12, 0], [0.2, 16, 1], [7, 13, 2]]) {
        const by = y - h * 1.3 - 2 + 1.2 * Math.sin(s.time * 1.6 + i * 2 + s.wx * 0.02);
        place(ctx, cloudPuffArt(), x + dx * 1.3 + a * 8, by + 5);
      }
    }
    if (s.ready) twinkle(ctx, x + 8, y - 22, s.time, s.wx, FIBRES[s.tier - 1].puff === '#ffffff' ? '#fff6c8' : FIBRES[s.tier - 1].puff);
  },
};
DRAW.gem = DRAW.ore;
DRAW.mushroom = DRAW.herb;

// ---------- Cute spots (Petal Meadow's art pass, 2026-11-11) ----------

// A map with `look.spots: 'cute'` draws its spots as round, chubby little characters to match its
// puffy ground: each has a face that blinks (dozing while it grows back), and a ready spot is
// bouncy, on its own beat from its world x: the clover, the rock, the hive and the moonpetal hop,
// the trees give a happy wiggle of their crowns. Never squashed or stretched: hops, tilts and
// sways only. Each drawing is a picture per stage and blink (never per moment).
const INK = '#3a2d4f';
const BLUSH = '#ff9fb8';
function arcBand(cx, cy, rx, ry, a0, a1, th, c) {
  const outer = [];
  const inner = [];
  for (let i = 0; i <= 6; i++) {
    const a = ((a0 + ((a1 - a0) * i) / 6) * Math.PI) / 180;
    outer.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    inner.push([cx + (rx - th) * Math.cos(a), cy + (ry - th) * Math.sin(a)]);
  }
  return F(T([...outer, ...inner.reverse()], c));
}
// A little face: open eyes with a shine, happy arcs, or shut (dozing / blinking); blush; a smile.
function cuteFace(cx, cy, gap, mood, k = 1, mouth = 'smile') {
  const out = [];
  const th = 0.45 * k;
  for (const sd of [-1, 1]) {
    const ex = cx + sd * gap;
    if (mood === 'open') out.push(F(E(ex, cy, 0.62 * k, 0.82 * k, INK)), F(E(ex - 0.2 * k, cy - 0.32 * k, 0.24 * k, 0.24 * k, '#ffffff')));
    else if (mood === 'happy') out.push(arcBand(ex, cy + 0.45 * k, 0.8 * k, 0.75 * k, 200, 340, th, INK));
    else out.push(arcBand(ex, cy - 0.3 * k, 0.8 * k, 0.62 * k, 20, 160, th, INK));
    out.push(F(E(ex + sd * 0.9 * k, cy + 1.25 * k, 0.75 * k, 0.4 * k, BLUSH)));
  }
  if (mouth === 'smile') out.push(arcBand(cx, cy + 0.55 * k, 0.72 * k, 0.72 * k, 25, 155, th, INK));
  else if (mouth === 'o') out.push(F(E(cx, cy + 1.3 * k, 0.42 * k, 0.48 * k, INK)));
  else if (mouth === 'cat') {
    out.push(arcBand(cx - 0.45 * k, cy + 0.7 * k, 0.48 * k, 0.5 * k, 20, 160, th * 0.9, INK));
    out.push(arcBand(cx + 0.45 * k, cy + 0.7 * k, 0.48 * k, 0.5 * k, 20, 160, th * 0.9, INK));
  }
  return out;
}
const blinkAt = (time, wx) => (((time * 0.33 + hash(wx) * 7.3) % 1) + 1) % 1 < 0.045;
const moodOf = (stage, blink) => (stage < 3 ? 'shut' : blink ? 'shut' : 'open');
// A hop every `every` seconds: up and down in a soft arc, then a little settle. Returns [dy, tilt].
function hopOf(time, wx, every = 3.4, h = 3) {
  const u = (((time + hash(wx * 1.3) * every) / every) % 1 + 1) % 1;
  const t = u * every;
  if (t < 0.36) {
    const k = t / 0.36;
    return [-Math.sin(k * Math.PI) * h, Math.sin(k * Math.PI * 2) * 0.06];
  }
  if (t < 0.6) return [-Math.sin(((t - 0.36) / 0.24) * Math.PI) * h * 0.22, 0];
  return [0, 0];
}
// A happy wiggle for trees: a quick decaying sway of the crown every so often.
function wiggleOf(time, wx, every = 4.2) {
  const t = ((((time + hash(wx * 2.1) * every) / every) % 1 + 1) % 1) * every;
  return t < 0.9 ? Math.sin(t * 14) * 0.05 * (1 - t / 0.9) ** 2 : 0;
}
// A chubby heart leaf pointing along angle a from its tip at (x, y).
function heartLeaf(x, y, r, a, c) {
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const cx = x + dx * r * 1.05;
  const cy = y + dy * r * 1.05;
  return [
    T([[x, y], [cx - dy * r * 0.9, cy + dx * r * 0.9], [cx + dy * r * 0.9, cy - dx * r * 0.9]], c),
    E(cx - dy * r * 0.5 + dx * r * 0.2, cy + dx * r * 0.5 + dy * r * 0.2, r * 0.62, r * 0.62, c),
    E(cx + dy * r * 0.5 + dx * r * 0.2, cy - dx * r * 0.5 + dy * r * 0.2, r * 0.62, r * 0.62, c),
  ];
}
const mound = (cx, gy, w) => [E(cx, gy - 0.6, w, 2.6, '#d39c7e'), F(E(cx - w * 0.2, gy - 1.6, w * 0.55, 1, '#e8b894'))];

// The clover: a chubby clump of heart leaves round a big round front leaf with a face, a lucky
// four-leaf sprig on top. Growing back: stubs, a two-leaf sprout, a dozing small clump.
function cuteCloverArt(stage, blink) {
  return art(`spot|cute|clover|${stage}|${blink ? 1 : 0}`, 40, 36, () => {
    const cx = 20;
    const gy = 35;
    const g = ramp('#86d97e');
    const out = [...mound(cx, gy, 11)];
    if (stage === 0) {
      for (const dx of [-4, 0, 4]) out.push(R(cx + dx - 0.7, gy - 4, 1.4, 4, '#6fb86a'));
      return out;
    }
    if (stage === 1) {
      out.push(stem(cx, gy - 1, cx, gy - 9, 1.4, '#5fae66'));
      out.push(...heartLeaf(cx, gy - 9, 4, -2.4, g.base), ...heartLeaf(cx, gy - 9, 4, -0.75, g.hi));
      return out;
    }
    const k = stage === 2 ? 0.78 : 1;
    const by = gy - 11 * k;
    out.push(...heartLeaf(cx - 2, by - 2 * k, 8 * k, -2.55, g.sh), ...heartLeaf(cx + 2, by - 2 * k, 8 * k, -0.6, g.sh));
    out.push(...heartLeaf(cx, by - 4 * k, 7.5 * k, -Math.PI / 2, g.base));
    // The round front leaf, its face, a pale chevron on each side leaf.
    out.push(E(cx, by + 1.5 * k, 10 * k, 8.6 * k, g.base), F(E(cx - 3 * k, by - 2 * k, 4.5 * k, 2.6 * k, g.hi)));
    out.push(...cuteFace(cx, by + 1.6 * k, 3.2 * k, moodOf(stage, blink), 1.9 * k));
    for (const sd of [-1, 1]) out.push(F(arcBand(cx + sd * 12 * k, by - 7 * k, 2.4 * k, 2 * k, 200, 340, 0.7 * k, g.hi)));
    if (stage === 3) {
      // The lucky sprig.
      out.push(stem(cx + 1, by - 13, cx + 3, by - 18, 1, '#5fae66'));
      for (let i = 0; i < 4; i++) out.push(E(cx + 3 + Math.cos((i * TAU) / 4 + 0.4) * 1.7, by - 19 + Math.sin((i * TAU) / 4 + 0.4) * 1.7, 1.5, 1.5, '#5fd06a'));
    }
    return out;
  });
}

// The rock: a round lavender boulder with copper nuggets, a rose quartz crystal sprouting on top
// like a bow, and a sleepy-happy face. Mined: a flat stub and rubble, then a pebble growing back.
function cuteRockArt(stage, gem, blink) {
  return art(`spot|cute|rock|${stage}|${gem ?? ''}|${blink ? 1 : 0}`, 40, 34, () => {
    const cx = 20;
    const gy = 33;
    const st = ramp('#c3b4dc');
    const cu = ramp('#ee9a5e');
    const out = [];
    if (stage === 0) {
      out.push(E(cx, gy - 3, 11, 4, st.sh), F(E(cx - 2, gy - 4.6, 7, 1.8, st.base)));
      for (const [dx, r] of [[-12, 1.8], [11, 2.2], [14, 1.3]]) out.push(E(cx + dx, gy - r * 0.8, r, r * 0.8, st.base));
      return out;
    }
    const k = [0, 0.55, 0.78, 1][stage];
    const cy = gy - 11 * k;
    out.push(E(cx + 8 * k, cy - 4 * k, 7.5 * k, 6.5 * k, st.sh));
    out.push(E(cx, cy, 14 * k, 11 * k, st.base), F(E(cx - 4.5 * k, cy - 5 * k, 6 * k, 3 * k, st.hi)));
    for (const [dx, dy, r] of [[-9, 3, 2.2], [9, 1, 2.6], [5, 7, 1.6], [-4, -7, 1.5]]) {
      out.push(E(cx + dx * k, cy + dy * k, r * k, r * 0.85 * k, cu.base), F(E(cx + (dx - r * 0.3) * k, cy + (dy - r * 0.35) * k, r * 0.4 * k, r * 0.3 * k, '#fff0dc')));
    }
    out.push(...cuteFace(cx - 1 * k, cy + 1 * k, 3.4 * k, stage < 3 || blink ? 'shut' : 'happy', 2 * k, 'cat'));
    if (stage === 3 && gem) {
      const r = ramp(gem);
      out.push(...crystal(cx + 7, 4, cy - 12, cy - 19, cy - 8, r, 1.5), ...crystal(cx + 11, 3, cy - 10, cy - 15, cy - 7, r, 2.5));
    }
    return out;
  });
}

// The honey hive: a round straw skep on a little stump, with a face over its doorway and honey
// running down its side when it's full.
function cuteHiveArt(stage, blink) {
  return art(`spot|cute|hive|${stage}|${blink ? 1 : 0}`, 38, 44, () => {
    const cx = 19;
    const gy = 43;
    const wd = ramp('#c8935f');
    const st = ramp('#f6c86e');
    const out = [...mound(cx, gy, 10)];
    out.push(T([[cx - 7, gy], [cx - 6, gy - 8], [cx + 6, gy - 8], [cx + 7, gy]], wd.base), E(cx, gy - 8, 6, 1.8, '#f0cf9a'), F(E(cx, gy - 8, 3.2, 0.9, wd.sh)));
    // The skep's rings, widest at the bottom, each lit on top.
    const rings = [[11.5, 5.6], [11, 5.4], [9.4, 5], [6.8, 4.6], [3.6, 3.6]];
    let y = gy - 10;
    for (const [w, h] of rings) {
      out.push(E(cx, y - h / 2, w, h * 0.66, st.base), F(E(cx - w * 0.25, y - h * 0.68, w * 0.6, h * 0.22, st.hi)), F(arcBand(cx, y - h / 2, w, h * 0.66, 20, 160, 0.7, st.sh)));
      y -= h - 0.6;
    }
    out.push(F(E(cx, y + 1, 1, 1.6, '#a87a5a')));
    // The doorway, and the face over it.
    const dy = gy - 13.5;
    out.push(F(T([[cx - 3, dy + 2], [cx - 2.6, dy - 1.2], [cx, dy - 2.4], [cx + 2.6, dy - 1.2], [cx + 3, dy + 2]], '#6a3e34')));
    out.push(...cuteFace(cx, gy - 21, 3.4, moodOf(stage, blink), 1.8, stage === 3 ? 'smile' : null));
    const hy = ramp('#ffb020');
    if (stage === 3) {
      out.push(F(T([[cx + 4, gy - 22], [cx + 8, gy - 21], [cx + 8.6, gy - 15], [cx + 7.4, gy - 10.5], [cx + 6, gy - 14], [cx + 4.6, gy - 18]], hy.base)));
      out.push(F(E(cx + 7.4, gy - 10, 1.8, 2.1, hy.base)), F(E(cx + 6.9, gy - 10.6, 0.6, 0.6, '#fff6d8')), F(E(cx + 6, gy - 19, 0.8, 1.6, hy.hi)));
    } else if (stage > 0) out.push(F(E(cx, dy + 0.8, 0.8 + 0.7 * stage, 0.5 + 0.3 * stage, '#ffc83a')));
    return out;
  });
}

// The chopping tree: a chubby trunk with a face, a crown of round puffs with blossoms. Felled: a
// dozing stump; growing back, a sapling.
function cuteTreeArt(part, stage, blink) {
  return art(`spot|cute|tree|${part}|${stage}|${blink ? 1 : 0}`, 64, 78, () => {
    const cx = 32;
    const gy = 77;
    const br = ramp('#c88f62');
    const cr = ramp('#8ad884');
    const k = [0.3, 0.45, 0.72, 1][stage];
    if (part === 'trunk') {
      const out = [...mound(cx, gy, 13)];
      if (stage === 0) {
        out.push(T([[cx - 8, gy], [cx - 7, gy - 10], [cx + 7, gy - 10], [cx + 8, gy]], br.base), E(cx, gy - 10, 7, 2.4, '#f2d3a2'), F(arcBand(cx, gy - 10, 4.2, 1.4, 0, 360, 0.5, '#d9a874')));
        out.push(...cuteFace(cx, gy - 5.4, 2.8, 'shut', 1.5));
        return out;
      }
      const top = gy - 34 * k;
      const w = 9 * Math.max(0.45, k);
      out.push(T([[cx - w - 2.5, gy], [cx - w, gy - 3], [cx - w * 0.75, top], [cx + w * 0.75, top], [cx + w, gy - 3], [cx + w + 2.5, gy]], br.base));
      out.push(F(T([[cx + w * 0.2, gy - 2], [cx + w * 0.35, top], [cx + w * 0.75, top], [cx + w, gy - 3], [cx + w + 1.5, gy - 0.5]], br.sh)));
      out.push(F(R(cx - w * 0.55, top + 3, 1, Math.max(2, 34 * k - 8), br.hi)));
      if (stage >= 2) out.push(...cuteFace(cx, gy - 14 * k, 3.6 * k, moodOf(stage, blink), 2.4 * k));
      return out;
    }
    if (stage === 0) return [];
    const cy = gy - 34 * k - 14 * k;
    const out = [];
    for (const [dx, dy, rx, ry, c] of [[-14, 5, 11, 9, cr.sh], [14, 4, 12, 9, cr.sh], [0, 0, 21, 15, cr.base], [-8, -11, 11, 9, cr.base], [8, -12, 12, 10, cr.base]]) {
      out.push(E(cx + dx * k, cy + dy * k, rx * k, ry * k, c));
    }
    out.push(F(E(cx - 7 * k, cy - 13 * k, 6 * k, 3.6 * k, cr.hi)), F(E(cx - 15 * k, cy + 2 * k, 4 * k, 2.6 * k, mix(cr.base, cr.hi, 0.5))));
    if (stage === 3) {
      for (let i = 0; i < 7; i++) {
        const bx = cx - 18 + hash(i * 3.1 + 2) * 36;
        const by = cy - 12 + hash(i * 7.7 + 1) * 20;
        for (let j = 0; j < 5; j++) out.push(F(E(bx + Math.cos((j * TAU) / 5) * 1.3, by + Math.sin((j * TAU) / 5) * 1.3, 1, 1, '#ffc6dc')));
        out.push(F(E(bx, by, 0.7, 0.7, '#ffe36b')));
      }
    }
    return out;
  });
}

// The cherry tree: the same chubby trunk (no face), a round crown, and its cherries in pairs with
// little faces, each pair swinging on its stem.
function cuteCherryTreeArt(part, stage) {
  return art(`spot|cute|ctree|${part}|${stage}`, 64, 66, () => {
    const cx = 32;
    const gy = 65;
    if (part === 'trunk') {
      const br = ramp('#c08a66');
      return [...mound(cx, gy, 11), T([[cx - 7, gy], [cx - 4.6, gy - 4], [cx - 3.4, gy - 34], [cx + 3.4, gy - 34], [cx + 4.6, gy - 4], [cx + 7, gy]], br.base), F(T([[cx + 0.6, gy - 2], [cx + 1, gy - 34], [cx + 3.4, gy - 34], [cx + 4.6, gy - 4], [cx + 6, gy - 0.5]], br.sh)), F(R(cx - 2.4, gy - 30, 0.9, 22, br.hi))];
    }
    const cr = ramp('#8ad884');
    const out = [];
    for (const [dx, dy, rx, ry, c] of [[-15, 7, 11, 8.5, cr.sh], [15, 6, 11, 8.5, cr.sh], [0, 0, 22, 14, cr.base], [-9, -9, 11, 8.5, cr.base], [9, -10, 12, 9, cr.base]]) out.push(E(cx + dx, gy - 50 + dy, rx, ry, c));
    out.push(F(E(cx - 7, gy - 62, 6, 3.4, cr.hi)));
    if (stage === 3) for (let i = 0; i < 6; i++) out.push(F(E(cx - 18 + hash(i * 3.1) * 36, gy - 60 + hash(i * 7.7) * 14, 1.4, 1.2, '#ffc6dc')));
    return out;
  });
}
function cuteCherryArt(stage, blink) {
  return art(`spot|cute|cherry|${stage}|${blink ? 1 : 0}`, 16, 18, () => {
    if (stage === 0) return [];
    const k = [0, 0.55, 0.78, 1][stage];
    const c = ramp(stage === 3 ? '#ff5a78' : stage === 2 ? '#ff9a8a' : '#a6dc7e');
    const out = [stem(8, 0.5, 4.6, 17 - 3.6 * k * 2, 0.8, '#6aa060'), stem(8, 0.5, 11.4, 17 - 3.6 * k * 2, 0.8, '#6aa060'), leaf(8, 1, 4, 1.4, -0.3, '#7fd07a')];
    for (const sd of [-1, 1]) {
      const fx = 8 + sd * 3.4;
      const fy = 17 - 3.6 * k;
      out.push(E(fx, fy, 3.6 * k, 3.6 * k, c.base), F(E(fx - 1.2 * k, fy - 1.3 * k, 1.1 * k, 0.8 * k, '#ffffff')));
      if (stage === 3) out.push(...cuteFace(fx + 0.2, fy + 0.4, 1.1, blink ? 'shut' : 'open', 0.95, null));
    }
    return out;
  });
}

// The moonpetal: a round sleepy flower whose petals open at night, a soft glow round it.
function cuteMoonArt(stage, blink) {
  return art(`spot|cute|moon|${stage}|${blink ? 1 : 0}`, 28, 34, () => {
    const cx = 14;
    const gy = 33;
    const out = [...mound(cx, gy, 7), stem(cx, gy - 1, cx, gy - 15, 1.4, '#5a9a80'), ...heartLeaf(cx, gy - 5, 3.4, -2.6, '#6aa88a'), ...heartLeaf(cx, gy - 7, 3.4, -0.5, '#6aa88a')];
    const r = ramp('#e2deff', 0.7);
    const hy = gy - 19;
    if (stage < 3) return [...out, E(cx, hy + 2, 2 + stage, 3 + stage, r.sh), F(E(cx - 0.8, hy, 0.8, 1.6, r.hi))];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU - Math.PI / 2;
      out.push(E(cx + Math.cos(a) * 5.4, hy + Math.sin(a) * 5.4, 3.6, 3.6, i % 2 ? r.base : r.hi));
    }
    out.push(E(cx, hy, 4.4, 4.2, '#fff2b8'), ...cuteFace(cx, hy - 0.2, 1.7, blink ? 'shut' : 'happy', 1.15));
    return out;
  });
}

// The strawberry patch: a low round bush of three-lobed leaves, a little white flower, and
// strawberries peeping out at the front with tiny faces (seeds and a leafy cap each). Picked:
// leaves only; growing back: green berries, then blushing ones.
function cuteStrawArt(stage, blink) {
  return art(`spot|cute|straw|${stage}|${blink ? 1 : 0}`, 40, 30, () => {
    const cx = 20;
    const gy = 29;
    const g = ramp('#7fd07a');
    const out = [...mound(cx, gy, 13)];
    const k = stage === 0 ? 0.7 : 1;
    for (const [dx, dy, r, c] of [[-8, -6, 6, g.sh], [8, -6, 6, g.sh], [0, -9, 7, g.base], [-6, -4, 5.4, g.base], [6, -4, 5.4, g.base]]) out.push(E(cx + dx * k, gy + dy * k, r * k, r * 0.86 * k, c));
    out.push(F(E(cx - 2, gy - 12 * k, 3.4 * k, 1.8 * k, g.hi)));
    for (const s2 of [-1, 1]) out.push(F(arcBand(cx + s2 * 6 * k, gy - 8 * k, 2 * k, 1.6 * k, 200, 340, 0.6, g.hi)));
    if (stage >= 2) {
      // The little white flower.
      for (let i = 0; i < 5; i++) out.push(E(cx + 8 + Math.cos((i * TAU) / 5) * 1.4, gy - 13 + Math.sin((i * TAU) / 5) * 1.4, 1.1, 1.1, '#ffffff'));
      out.push(F(E(cx + 8, gy - 13, 0.8, 0.8, '#ffe36b')));
    }
    if (stage === 0) return out;
    const c = stage === 3 ? '#ff5a6e' : stage === 2 ? '#ffa08a' : '#b8e08a';
    const r = ramp(c);
    for (const [dx, dy, sz, face] of [[-7, -1.5, 1, false], [1, -0.5, 1.15, true], [8.5, -2, 0.95, false]]) {
      const x = cx + dx;
      const y = gy + dy;
      const w = 3.2 * sz * (stage === 1 ? 0.7 : 1);
      out.push(T([[x - w, y - w * 0.9], [x + w, y - w * 0.9], [x + w * 0.7, y + w * 0.2], [x, y + w * 1.1], [x - w * 0.7, y + w * 0.2]], r.base), E(x, y - w * 0.85, w, w * 0.5, r.base));
      out.push(F(E(x - w * 0.35, y - w * 0.6, w * 0.35, w * 0.25, r.hi)));
      for (const [sx, sy] of [[-0.45, -0.2], [0.4, -0.3], [0, 0.35], [-0.2, -0.65], [0.5, 0.2]]) out.push(F(E(x + sx * w, y + sy * w, 0.28, 0.36, stage === 3 ? '#ffe08a' : '#f0f8d0')));
      out.push(leaf(x, y - w * 0.8, w * 0.9, w * 0.35, -2.6, '#5fae5c'), leaf(x, y - w * 0.8, w * 0.9, w * 0.35, -0.55, '#5fae5c'), leaf(x, y - w * 0.8, w * 0.7, w * 0.3, -Math.PI / 2, '#6cc46c'));
      if (face && stage === 3) out.push(...cuteFace(x, y - 0.2, 1.1, blink ? 'shut' : 'open', 0.9));
    }
    return out;
  });
}

// The cotton plant: a few slim stems with leaves, three fluffy bolls on top, the biggest with a
// sleepy smile. Picked: bare stems; growing back: green buds, then opening bolls.
function cuteCottonArt(stage, blink) {
  return art(`spot|cute|cotton|${stage}|${blink ? 1 : 0}`, 34, 38, () => {
    const cx = 17;
    const gy = 37;
    const out = [...mound(cx, gy, 9)];
    const tops = [[-6, -20], [6, -22], [0, -28]];
    for (const [dx, dy] of tops) out.push(stem(cx + dx * 0.3, gy - 1, cx + dx, gy + dy * (stage === 0 ? 0.5 : 1) + 3, 1.2, '#7ab86a'));
    out.push(leaf(cx - 1, gy - 9, 6, 2, -2.6, '#7fd07a'), leaf(cx + 1, gy - 12, 6, 2, -0.55, '#6cc46c'));
    if (stage === 0) return out;
    tops.forEach(([dx, dy], i) => {
      const x = cx + dx;
      const y = gy + dy;
      if (stage === 1) return out.push(E(x, y + 1, 2.2, 2.6, '#8fcf86'));
      const k = stage === 2 ? 0.7 : 1;
      const R = (i === 2 ? 5.2 : 4.2) * k;
      out.push(leaf(x, y + R * 0.6, R * 0.9, R * 0.35, 2.6, '#6a9a5a'), leaf(x, y + R * 0.6, R * 0.9, R * 0.35, 0.55, '#6a9a5a'));
      for (const [ox, oy] of [[-0.5, 0.1], [0.5, 0.1], [0, -0.45], [0, 0.35]]) out.push(E(x + ox * R, y + oy * R, R * 0.62, R * 0.58, '#fffaf4'));
      out.push(F(E(x - R * 0.3, y - R * 0.4, R * 0.35, R * 0.22, '#ffffff')));
      if (i === 2 && stage === 3) out.push(...cuteFace(x, y + 0.2, 1.5, blink ? 'shut' : 'happy', 1.1));
    });
    return out;
  });
}

// Draws a picture hopping: lifted by dy and tilted about its foot.
function hopped(ctx, x, y, dy, tilt, draw) {
  rotated(ctx, x, y + 1, tilt, () => {
    ctx.translate(0, snap(dy));
    draw();
  });
}
const CUTE = {
  herb(ctx, x, y, s) {
    const [dy, tilt] = s.ready ? hopOf(s.time, s.wx, 3.2, 3.2) : [0, 0];
    const a = 0.04 * lean(s.time, s.wx) + 0.03 * s.jolt + tilt;
    hopped(ctx, x, y, dy, a, () => staged(ctx, s.g, (st, al) => placeA(ctx, cuteCloverArt(st, s.blink), x, y + 1, al)));
    if (s.ready) twinkle(ctx, x + 4, y - 32 + dy, s.time, s.wx, '#fff6c8');
  },
  moonpetal(ctx, x, y, s) {
    if (s.ready) {
      // The glow, breathing.
      const k = 0.75 + 0.25 * Math.sin(s.time * 1.6 + s.wx * 0.03);
      const g = ctx.createRadialGradient(x, y - 19, 1, x, y - 19, 16);
      g.addColorStop(0, `rgba(226,222,255,${0.5 * k})`);
      g.addColorStop(1, 'rgba(226,222,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 16, y - 35, 32, 32);
    }
    const a = 0.05 * lean(s.time, s.wx, 0.2) + 0.03 * s.jolt + (s.ready ? 0.05 * Math.sin(s.time * 1.3 + s.wx * 0.02) : 0);
    staged(ctx, s.g, (st, al) => rotated(ctx, x, y, a, () => placeA(ctx, cuteMoonArt(st, s.blink), x, y + 1, al)));
    if (s.ready) {
      twinkle(ctx, x + 8, y - 28, s.time, s.wx, '#e6e2ff', 1.1, 1.8);
      twinkle(ctx, x - 7, y - 14, s.time + 0.9, s.wx + 3, '#fff2b8', 0.8, 2.2);
    }
  },
  ore(ctx, x, y, s) {
    const [dy, tilt] = s.ready ? hopOf(s.time, s.wx, 4, 2.4) : [0, 0];
    hopped(ctx, x + s.jolt * 1.2, y, dy, tilt, () => staged(ctx, s.g, (st, al) => placeA(ctx, cuteRockArt(st, st === 3 ? s.gem : null, s.blink), x + s.jolt * 1.2, y + 1, al)));
    if (!s.ready) return;
    twinkle(ctx, x - 9, y - 12 + dy, s.time, s.wx, '#ffe0c4', 0.9, 2.4);
    twinkle(ctx, x + 9, y - 10 + dy, s.time + 0.8, s.wx + 2, '#ffe0c4', 0.7, 2.4);
    if (s.gem) twinkle(ctx, x + 9, y - 30 + dy, s.time + 0.6, s.wx + 9, s.gem, 1.1, 1.9);
  },
  honey(ctx, x, y, s) {
    const [dy, tilt] = s.ready ? hopOf(s.time, s.wx, 3.8, 2.2) : [0, 0];
    hopped(ctx, x, y, dy, tilt, () => staged(ctx, s.g, (st, al) => placeA(ctx, cuteHiveArt(st, s.blink), x, y + 1, al)));
    const n = s.ready ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const t = s.time * (1.1 + 0.25 * i) + i * 2.6 + s.wx * 0.01;
      const bx = x + Math.cos(t) * (15 + 3 * i);
      const by = y - 30 + Math.sin(t * 1.3) * 6 + Math.cos(t * 3.1) * 1.5;
      const b = beeArt(Math.floor(s.time * 24 + i) % 2);
      ctx.save();
      if (Math.sin(t) < 0) {
        ctx.translate(bx * 2, 0);
        ctx.scale(-1, 1);
      }
      blit(ctx, b, bx - 3.5, by - 3, {});
      ctx.restore();
    }
  },
  fiber(ctx, x, y, s) {
    const [dy, tilt] = s.ready ? hopOf(s.time, s.wx, 3.9, 2) : [0, 0];
    const a = 0.05 * lean(s.time, s.wx, 0.15) + 0.04 * s.jolt + tilt;
    hopped(ctx, x, y, dy, a, () => staged(ctx, s.g, (st, al) => placeA(ctx, cuteCottonArt(st, s.blink), x, y + 1, al)));
    if (s.ready) twinkle(ctx, x + 8, y - 34 + dy, s.time, s.wx, '#fff6c8');
  },
  wood(ctx, x, y, s) {
    const sh = 0.03 * s.jolt;
    if (s.fell > 0) {
      placeA(ctx, cuteTreeArt('trunk', 0, true), x, y + 1, 1);
      const k = s.fell * s.fell;
      ctx.save();
      ctx.globalAlpha *= 1 - soft((s.fell - 0.6) / 0.4);
      rotated(ctx, x + s.dir * 3, y - 8, s.dir * k * 1.35, () => {
        placeA(ctx, cuteTreeArt('trunk', 3, true), x, y + 1, 1);
        placeA(ctx, cuteTreeArt('crown', 3, false), x, y + 1, 1);
      });
      ctx.restore();
      return;
    }
    const wig = s.ready ? wiggleOf(s.time, s.wx) : 0;
    const a = 0.015 * lean(s.time, s.wx, 0.1) + sh + wig;
    rotated(ctx, x, y, sh * 0.4 + wig * 0.3, () => staged(ctx, s.g, (st, al) => placeA(ctx, cuteTreeArt('trunk', st, s.blink), x, y + 1, al)));
    rotated(ctx, x, y - 20, a + 0.012 * lean(s.time, s.wx, 0.5), () => staged(ctx, s.g, (st, al) => placeA(ctx, cuteTreeArt('crown', st, false), x, y + 1, al)));
  },
  fruit(ctx, x, y, s) {
    if (s.find === 'wild_strawberry') {
      const [dy, tilt] = s.ready ? hopOf(s.time, s.wx, 3.6, 2.2) : [0, 0];
      const a = 0.03 * lean(s.time, s.wx) + 0.03 * s.jolt + tilt;
      hopped(ctx, x, y, dy, a, () => staged(ctx, s.g, (st, al) => placeA(ctx, cuteStrawArt(st, s.blink), x, y + 1, al)));
      if (s.ready) twinkle(ctx, x + 9, y - 22 + dy, s.time, s.wx);
      return;
    }
    const wig = s.ready ? wiggleOf(s.time, s.wx, 4.6) : 0;
    const a = 0.025 * lean(s.time, s.wx, 0.3) + 0.02 * s.jolt + wig;
    staged(ctx, Math.min(1, s.g + 0.67), (st, al) => placeA(ctx, cuteCherryTreeArt('trunk', st), x, y + 1, al));
    rotated(ctx, x, y - 30, a, () => staged(ctx, Math.max(0.67, s.g), (st, al) => placeA(ctx, cuteCherryTreeArt('crown', st), x, y + 1, al)));
    [[-16, -42], [14, -44], [-2, -37]].forEach(([dx, dy], i) => {
      if (s.picked && i === 2) return;
      const fx = x + dx + a * dy;
      const fy = y + dy;
      const sw = 0.14 * Math.sin(s.time * 1.7 + s.wx * 0.05 + i * 1.9) + 0.1 * lean(s.time, s.wx, 0.5 + i * 0.1) + wig * 3;
      rotated(ctx, fx, fy, sw, () => staged(ctx, s.g, (st, al) => placeA(ctx, cuteCherryArt(st, s.blink), fx, fy + 18, al)));
    });
    if (s.ready) twinkle(ctx, x + 12, y - 30, s.time, s.wx);
  },
};

// How high each kind's hint floats.
const HINT_Y = { fruit: 76, wood: 82, honey: 56, flower: 42, ore: 42, fiber: 40, herb: 36 };

function hint(ctx, x, y, label, on) {
  ctx.font = '800 8px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  const w = ctx.measureText(label).width + 12;
  ctx.globalAlpha = on ? 1 : 0.7;
  box(ctx, x - w / 2, y, w, 12, { fill: '#ffffff', edge: on ? COLORS.accent : COLORS.muted, r: 6 });
  text(ctx, label, x, y + 9, { size: 8, bold: true, align: 'center', color: on ? COLORS.accent : COLORS.muted });
  ctx.globalAlpha = 1;
}

// How far a spot has grown back (0 just used, 1 ready).
function growthOf(world, n, i) {
  if (nodeReady(world, i)) return 1;
  const until = world.nodeRest?.[`${world.map.id}:${i}`] ?? 0;
  const rest = KINDS[n.kind]?.rest ?? 90;
  return clamp01(1 - (until - world.now) / rest);
}

// Behind everyone: the spots, and the finds popping out of the last one you worked.
// Low plants she kneels at (herbs, flowers, fibre) are drawn in front of her while she works them,
// so her hands go in among the leaves instead of hiding the plant (drawNodesFront, after the hero).
const FRONT = new Set(['herb', 'flower', 'fiber', 'moonpetal', 'mushroom']);
const inFront = (world, n, i) => world.gathering?.i === i && FRONT.has(n.look ?? n.kind);

export function drawNodesFront(ctx, world, cam, time) {
  if (world.gathering) drawNodes(ctx, world, cam, time, true);
}

export function drawNodes(ctx, world, cam, time, front = false) {
  const here = !world.dead && !world.gathering ? nodeHere(world) : null;
  const work = world.gathering;
  const lp = work ? lifePose(world) : null;
  const cute = world.map.look?.spots === 'cute';
  nodesOf(world).forEach((n, i) => {
    if (inFront(world, n, i) !== front) return;
    const x = snap(n.x - cam.x);
    const y = snap(n.y - cam.y);
    if (x < -80 || x > 720 || y < -100 || y > 440 || !nodeOpen(world, n)) return;
    const kind = n.look ?? n.kind;
    let g = growthOf(world, n, i);
    // Being worked: once the find comes free (or the last blow lands) the spot shows it's taken.
    // (Other players' work never uses a spot up for you, so it only shudders under their blows.)
    const wlp = work && work.i === i ? lp : null;
    const worked = Boolean(wlp);
    if (worked) {
      const p = wlp.progress ?? 0;
      const at = { gather: 0.52, pluck: 0.62, reap: 0.66, mine: 0.84, chop: 0.8 }[wlp.pose] ?? 0.9;
      g = 1 - soft((p - at) / 0.16) * 0.67;
    }
    const facing = world.body.facing;
    const pool = Object.keys(n.pool ?? {});
    const gemId = n.rare && GEMS[n.rare[0]] ? n.rare[0] : pool.find((id) => GEMS[id]);
    const s = {
      time, wx: n.x, tier: tierOf(n, world.map.id), g, ready: g >= 1 && !worked, jolt: jolted(n, world.now),
      find: Object.entries(n.pool ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0], color: findColor(n, null), gem: gemId ? GEMS[gemId] : null, picked: worked && wlp.pose === 'pluck' && wlp.progress > 0.62,
      fell: worked && wlp.pose === 'chop' ? clamp01((wlp.progress - 0.78) / 0.22) : 0, dir: facing < 0 ? -1 : 1,
      blink: cute && blinkAt(time, n.x),
    };
    // Once the tree has fallen it's a stump until it grows back.
    if (n.kind === 'wood' && worked && s.fell >= 1) s.g = 0;
    ctx.save();
    const set = cute ? CUTE : DRAW;
    (set[kind] ?? set[n.kind] ?? DRAW[kind] ?? DRAW[n.kind] ?? DRAW.herb)(ctx, x, y, s);
    ctx.restore();
    if (here?.i === i) {
      const ready = nodeReady(world, i);
      hint(ctx, x, y - (HINT_Y[n.kind] ?? 30), ready ? `▲ ${KINDS[n.kind]?.verb ?? 'Gather'}` : 'Growing back...', ready);
    }
  });
  if (front) return;
  // The finds hop out of the spot, arc up and twinkle, then fade (yours, and other players').
  for (const pop of [world.lastGathered, ...(world.botPops ?? [])]) {
    const since = pop ? world.now - pop.at : 9;
    if (since < 1) {
      pop.items.forEach((id, k) => {
        if (!ITEMS[id]) return;
        const u = Math.min(1, since * 2.2);
        const x = pop.x - cam.x + (k - (pop.items.length - 1) / 2) * 12 * u;
        const y = pop.y - cam.y - 14 - 22 * Math.sin(u * Math.PI * 0.5) + 4 * Math.max(0, since - 0.6);
        const icon = itemIcon(id);
        ctx.save();
        ctx.globalAlpha = Math.min(1, (1 - since) * 3);
        const sc = 0.7 * (0.6 + 0.4 * soft(u));
        blit(ctx, icon, x - 9 * sc, y - 9 * sc, { scale: sc });
        ctx.restore();
        twinkle(ctx, x + 5, y - 5, time * 1.5, k + 1, '#fff6c8', 0.9, 1);
      });
    }
  }
}
