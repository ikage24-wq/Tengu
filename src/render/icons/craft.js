// Icons for crafting (data/crafting.js): the shared life materials (ore lumps, faceted gems, logs,
// fibre), the bench-made tools (rods, pickaxes, sickles, woodaxes, each in its tier's wood or
// metal), polishing stones, rings, knot charms and the bench's own tonics. Same kit and style as
// the drop icons (icons/items.js): flat parts lit from the top left, a white glint, the sprite's
// own outline. Added to ITEM_ART only where an item has no drawing yet.

import { ITEMS } from '../../data/items.js';
import { CRAFT_MATERIALS, STONES, TONICS } from '../../data/crafting.js';
import { ITEM_ART, hi, lt, sh, dk, S, oval, bez3, ball, tube, glint, twinkle, bevel, framed, W } from './items.js';

const ROCK = '#a99cb4';
const lump = (r, cx, cy, j, seed = 0, rx = 1.08) => Array.from({ length: 18 }, (_, i) => {
  const a = (i / 18) * Math.PI * 2;
  const rr = r * (1 + j * Math.sin(i * 2.7 + seed) * 0.6 + j * Math.cos(i * 1.3 + seed) * 0.4);
  return [cx + Math.cos(a) * rr * rx, cy + Math.sin(a) * rr];
});

// A lump of rock with nuggets of the ore in it.
const oreArt = (c) => () => {
  const out = [...ball(lump(6.4, 8, 9, 0.12), ROCK, { k: 1.1, glow: 0.7 })];
  for (const [x, y, r, s] of [[5.6, 7.4, 2.4, 1], [10.6, 9.4, 2.1, 2], [7.6, 12, 1.6, 3]]) out.push(...ball(lump(r, x, y, 0.15, s), c, { glow: 1.1 }));
  out.push(S(oval(12.4, 12.6, 0.5, 0.35, 20, 8), dk(ROCK)), S(oval(3.6, 11.6, 0.45, 0.3, 0, 8), dk(ROCK)));
  out.push(...glint(4.6, 6.2, 0.5));
  return out;
};

// A cut gem: a beveled hexagon with a bright table and a twinkle.
const gemArt = (c) => () => {
  const hex = (r, cx, cy) => Array.from({ length: 6 }, (_, i) => [cx + Math.cos((i / 6) * Math.PI * 2 + Math.PI / 6) * r, cy + Math.sin((i / 6) * Math.PI * 2 + Math.PI / 6) * r * 0.92]);
  return [...bevel(hex(7, 8, 8.4), hex(3.8, 7.6, 8), c, lt(c)), S(oval(6.4, 6.8, 1.4, 1, -30, 10), hi(c)), twinkle(11.4, 4.4, 2.2), ...glint(6, 7, 0.45)];
};

// A log lying on a slant: bark down its length, the cut end with its rings.
const logArt = (c) => () => {
  const bark = c;
  const body = tube([[3.4, 12.4], [12.6, 4.2]], 6.4);
  const out = [S(body, sh(bark)), S(tube([[3, 11.4], [12, 3.4]], 3.4), bark), S(tube([[2.8, 10.6], [11.4, 2.9]], 1.2), lt(bark))];
  for (const [x, y] of [[6, 10.6], [8.6, 7], [10.2, 6.4]]) out.push(S(tube([[x, y], [x + 1.6, y - 1.5]], 0.5), dk(bark)));
  const end = oval(3.6, 12.4, 3.1, 3.3, 38, 24);
  out.push(S(end, '#f4dcb4'), S(oval(3.6, 12.4, 2.1, 2.2, 38, 20), '#e8c69a'), S(oval(3.6, 12.4, 1, 1.1, 38, 14), '#d8a878'), S(oval(3.1, 11.8, 0.4, 0.4, 0, 8), '#fff4dc'));
  out.push(...glint(9.4, 4.2, 0.45));
  return out;
};

// Fibre: soft puffs on a little green calyx (cotton), or a skein for the woven ones.
const fibreArt = (c, skein) => () => {
  if (skein) {
    const out = [S(oval(8, 8.6, 6.4, 5, -20, 28), sh(c)), S(oval(7.6, 8, 5.4, 4, -20, 26), c)];
    for (const k of [-2, 0, 2]) out.push(S(tube(bez3([3.4 + k, 11], [6 + k, 6], [9 + k, 4.6], [12 + k * 0.4, 5.4], 10), 0.6), lt(c)));
    out.push(S(tube([[7.2, 3.6], [9.6, 13.6]], 1.6), dk(c)), ...glint(5.2, 6.4, 0.45));
    return out;
  }
  const out = [S([[6, 13.6], [8, 10.8], [10, 13.6], [8, 15]], '#8fd08a')];
  for (const [x, y, r] of [[5, 8.6, 3.4], [10.8, 8.4, 3.4], [8, 5.2, 3.6], [8, 10, 3.4]]) out.push(...ball(oval(x, y, r, r * 0.92, 0, 22), c, { glow: 0.9, shadow: sh(c) }));
  out.push(...glint(6.4, 4.4, 0.45));
  return out;
};

const handle = (from, to, wood = '#c99a6b') => [S(tube([from, to], 1.8), sh(wood)), S(tube([[from[0] - 0.3, from[1] - 0.3], [to[0] - 0.3, to[1] - 0.3]], 0.8), lt(wood))];

function toolArt(kind, c) {
  return () => {
    if (kind === 'rod') {
      const wood = c;
      return [S(tube([[2, 15], [14, 1.6]], 1.4, 0.6), wood), S(tube([[2.4, 14.4], [5.6, 10.8]], 2), lt(wood)), ...ball(oval(6.4, 11.6, 1.8, 1.8, 0, 12), '#9aa8c6'),
        S(tube([[14, 1.6], [14.6, 6], [13, 10]], 0.3), W), ...ball(oval(13, 11.6, 1.8, 1.8, 0, 12), '#5fd3a0'), S(oval(13, 11.6, 1.8, 0.6, 0, 12), W)];
    }
    if (kind === 'sickle') {
      // A short grip and a wide crescent blade curling up and over from its top.
      const arc = (cx, cy, r, a0, a1, n = 14) => Array.from({ length: n + 1 }, (_, i) => {
        const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
        return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
      });
      const blade = [...arc(9.8, 8.4, 6, 165, 380), ...arc(10.6, 9.6, 4.4, 380, 170)];
      return [...handle([3.4, 15.2], [6, 10]), ...ball(blade, c, { k: 1.1, glow: 0.9 }), S(tube(arc(9.8, 8.4, 5.2, 200, 290, 6), 0.45), hi(c)), ...glint(4.2, 13.4, 0.4)];
    }
    const out = [...handle([3, 14.6], [11.4, 4.2])];
    if (kind === 'pickaxe') {
      const head = [...bez3([1.6, 5.6], [5, 1.2], [10.4, 0.8], [15, 3.6], 10), ...bez3([15, 3.6], [11, 3.2], [6.4, 3.4], [1.6, 5.6], 10).slice(1)];
      out.push(...ball(head, c, { k: 1.2, glow: 0.8 }), S(oval(11.2, 3.6, 1.4, 1.2, 0, 10), sh(c)));
    } else {
      const head = [[9, 2.2], [13.6, 0.6], [15.4, 5.2], [13.6, 9.2], [10.4, 7]];
      out.push(...ball(head, c, { k: 1.1, glow: 0.9 }), S(tube([[14.2, 1.6], [15, 7.6]], 0.5), hi(c)));
    }
    out.push(...glint(4.4, 12.2, 0.4));
    return out;
  };
}

// A whetstone: a rounded block in the ore's colour, a polished streak across it.
const stoneArt = (c, star) => () => {
  const block = [...bez3([1.6, 10.6], [1.4, 6.4], [9, 3.4], [14.4, 4.6], 10), ...bez3([14.4, 4.6], [15, 8.6], [8, 12.6], [1.6, 10.6], 10).slice(1)];
  const out = [...ball(block, c, { k: 1.1 }), S(tube([[4.2, 8.6], [12.2, 5.6]], 1), hi(c))];
  if (star) out.push(twinkle(8.4, 7.4, 2.6, '#fff8d8'));
  out.push(twinkle(13.2, 2.2, 1.8), ...glint(4, 7.4, 0.4));
  return out;
};

// A ring: a band seen at a slant, a gem set on top.
const ringArt = (metal, gem) => () => {
  const out = [S(oval(8, 10.2, 6, 4.2, 0, 32), sh(metal))];
  out.push(S(oval(8, 9.8, 5.6, 3.8, 0, 32), metal), S(oval(8, 10.4, 4, 2.4, 0, 28), dk(metal)), S(oval(8, 10.9, 3.6, 2, 0, 28), sh(metal)));
  out.push(S(oval(4.4, 8.4, 1.6, 0.8, -20, 12), hi(metal)));
  out.push(...bevel(oval(8, 5, 3.2, 3, 0, 8), oval(7.8, 4.8, 1.6, 1.4, 0, 8), gem, lt(gem)), twinkle(11.6, 2.6, 1.6), ...glint(7, 4.2, 0.35));
  return out;
};

// A knot charm: a cord loop, a carved wood bead and a gem, a tassel underneath.
const charmArt = (gem, wood) => () => [
  S(tube(bez3([5, 4], [4, 0], [12, 0], [11, 4], 12), 0.9), '#ff9ec0'),
  ...ball(oval(8, 6.6, 3.4, 2.6, 0, 20), wood, { glow: 0.8 }),
  ...bevel(oval(8, 10.4, 2.8, 2.6, 45, 4), oval(8, 10.2, 1.4, 1.3, 45, 4), gem, lt(gem)),
  ...[6.6, 8, 9.4].map((x) => S(tube([[x, 12.6], [x + (x - 8) * 0.3, 15.4]], 0.8), '#ff9ec0')),
  ...glint(6.6, 5.6, 0.4),
];

// A little stoppered flask of the tonic.
const tonicArt = (c) => () => [
  S(tube([[8, 2], [8, 5.4]], 3), '#eaf4ff'), S([[6.2, 0.8], [9.8, 0.8], [9.6, 2.6], [6.4, 2.6]], '#c99a6b'),
  ...ball(oval(8, 10.2, 5.4, 5, 0, 30), '#eaf4ff', { glow: 0.6 }), S(oval(8, 11.2, 4.4, 3.6, 0, 26), c), S(oval(6.6, 10.4, 1.6, 1.2, 0, 12), lt(c)),
  twinkle(11.6, 5.4, 1.6), ...glint(5.4, 8.4, 0.5),
];

const set = (id, draw) => {
  if (ITEMS[id] && !ITEM_ART[id]) ITEM_ART[id] = framed(draw);
};
const GEMS = new Set(['rose_quartz', 'amethyst', 'sapphire', 'starstone']);
for (const [id, , , color] of CRAFT_MATERIALS) {
  const c = ITEMS[id]?.color ?? color;
  if (id.endsWith('_ore')) set(id, oreArt(c));
  else if (GEMS.has(id)) set(id, gemArt(c));
  else if (id.endsWith('_log')) set(id, logArt(c));
  else set(id, fibreArt(c, id === 'silkmoss' || id === 'lotus_fiber'));
}
for (const def of Object.values(ITEMS)) {
  if (!def.crafted) continue;
  if (def.tool) set(def.id, toolArt(def.tool, def.color));
  else if (def.slot === 'ring') set(def.id, ringArt(def.color, def.gem));
  else if (def.slot === 'charm') set(def.id, charmArt(def.color, def.wood));
}
for (const s of STONES) set(s.id, stoneArt(s.color, s.id === 'polish_star'));
for (const t of TONICS) set(t.id, tonicArt(t.color));
