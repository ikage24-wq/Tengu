// 16x16 icons for items and skills, drawn from shapes and cached like every other sprite.

import { ITEMS, variantsFor } from '../data/items.js';
import { SKILLS } from '../data/skills.js';
import { R, E, P, F, sprite, blit, shade } from './pixel.js';
import { weaponIcon } from './weapons.js';
import { pieceOf, JOB_GEAR } from './jobgear/index.js';
import { topShapes, sleeveColor, shoulderShapes, legLook, legShapes, hipShapes, skirtShapes, hatShapes, hatBackShapes, handShapes, capeShapes, capeFrontShapes, earringShapes, limb } from './gear.js';
import { SCHOOL_COLORS } from './spells.js';
import { ITEM_ART } from './icons/items.js';
import './icons/food.js';
import './icons/craft.js';
import './icons/finds.js';
import './icons/gacha.js';
import './icons/mochi.js';
import { sweetIcon } from './mochi-sweets.js';
import { SKILL_ART, skillTone } from './icons/skills.js';

export { skillTone };

const GOLD = '#ffd66b';

// Icons for specific designs, so the bag shows the same look you'll wear.
function designShapes(def, c, l, d) {
  const W = '#ffffff';
  const PINK = '#ffc2d6';
  switch (def.design) {
    case 'beanie': return [E(8, 9, 7, 5, c), R(1, 10, 14, 3, d), E(8, 3, 2, 2, l)];
    case 'sunhat': return [E(8, 11, 8, 2.5, c), E(8, 8, 5, 4, c), R(3, 9, 10, 2, '#ff9ec0')];
    case 'cap': return [E(7, 9, 6, 4.5, c), R(10, 11, 6, 2, d), R(4, 7, 2, 1, '#8fd3ff')];
    case 'helmet': return [E(8, 9, 7, 6, '#dfe6f5'), R(1, 10, 2, 5, '#dfe6f5'), R(13, 10, 2, 5, '#dfe6f5'), R(7, 1, 2, 5, '#ff9ec0'), P(5, 6, W)];
    case 'witch': return [E(8, 13, 8, 2, c), R(4, 8, 8, 5, c), R(6, 4, 5, 4, c), R(9, 1, 4, 3, c), R(4, 11, 8, 1, GOLD)];
    case 'circlet': return [R(2, 8, 12, 2, GOLD), E(8, 8.5, 2, 2, '#c9a6ff'), R(0, 5, 3, 2, W), R(13, 5, 3, 2, W)];
    case 'bunny': return [E(8, 11, 6, 4.5, W), R(4, 1, 3, 9, W), R(9, 0, 3, 10, W), R(5, 2, 1, 6, PINK), R(10, 1, 1, 7, PINK)];
    case 'kitty': return [R(2, 9, 12, 2, c), R(2, 4, 3, 5, c), R(11, 4, 3, 5, c), R(3, 6, 1, 3, PINK), R(12, 6, 1, 3, PINK)];
    case 'flowers': return [R(1, 9, 14, 2, '#7fd17a'), E(3, 8, 2, 2, '#ff9ec0'), E(8, 7, 2, 2, '#ffe36b'), E(13, 8, 2, 2, '#c9a6ff')];
    case 'crown': return [R(2, 8, 12, 5, GOLD), R(2, 4, 2, 4, '#8fe3ff'), R(7, 2, 2, 6, '#c9f2ff'), R(12, 4, 2, 4, '#8fe3ff'), E(8, 10, 1.5, 1.5, '#ff9ec0')];
    case 'beret': return [E(8, 9, 7, 4, c), E(5, 8, 2, 1.5, l), R(8, 4, 2, 2, d), P(12, 8, GOLD)];
    case 'stripes': return [R(4, 4, 8, 10, c), R(1, 4, 3, 6, c), R(12, 4, 3, 6, c), R(4, 7, 8, 1, d), R(4, 10, 8, 1, d)];
    case 'vest': return [R(4, 4, 8, 10, '#fff6ec'), R(4, 4, 3, 10, c), R(9, 4, 3, 10, c), R(1, 4, 3, 6, '#fff6ec'), R(12, 4, 3, 6, '#fff6ec')];
    case 'plate': return [R(4, 4, 8, 10, '#dfe6f5'), E(8, 8, 3, 2.5, c), E(3, 5, 2.5, 2, l), E(13, 5, 2.5, 2, l)];
    case 'starrobe': case 'celestial': return [R(4, 4, 8, 10, c), R(2, 10, 12, 4, l), R(1, 4, 3, 6, c), R(12, 4, 3, 6, c), R(4, 4, 8, 1, GOLD), R(7, 6, 2, 3, GOLD)];
    case 'kimono': return [R(4, 4, 8, 10, c), R(1, 4, 3, 7, c), R(12, 4, 3, 7, c), R(6, 4, 2, 5, W), R(4, 9, 8, 2, '#ff6b8a')];
    case 'sailor': return [R(4, 4, 8, 10, W), R(1, 4, 3, 6, W), R(12, 4, 3, 6, W), R(4, 4, 8, 2, c), E(8, 7, 2, 1.5, '#ff6b8a'), R(4, 12, 8, 2, c)];
    case 'hoodie': return [R(4, 4, 8, 10, c), R(1, 4, 3, 7, c), R(12, 4, 3, 7, c), R(5, 9, 6, 3, d), R(6, 4, 1, 4, W), R(9, 4, 1, 4, W)];
    case 'shorts': return [R(4, 4, 8, 4, c), R(4, 8, 3, 3, c), R(9, 8, 3, 3, c)];
    case 'greaves': return [R(4, 3, 8, 4, '#dfe6f5'), R(4, 7, 3, 8, '#dfe6f5'), R(9, 7, 3, 8, '#dfe6f5'), R(4, 9, 3, 1, W), R(9, 9, 3, 1, W)];
    case 'starskirt': case 'celestialskirt': return [R(5, 3, 6, 3, c), R(3, 6, 10, 6, c), R(3, 11, 10, 1, GOLD), P(6, 8, GOLD), P(10, 9, GOLD)];
    case 'sabatons': return [R(2, 8, 6, 6, '#dfe6f5'), R(9, 8, 6, 6, '#dfe6f5'), R(2, 13, 6, 1, '#b8c2d6'), R(9, 13, 6, 1, '#b8c2d6')];
    case 'wingboots': return [R(3, 9, 5, 5, c), R(10, 9, 5, 5, c), R(1, 8, 2, 3, W), R(8, 8, 2, 3, W)];
    case 'fairy': return [E(5, 6, 4, 5, '#c9f2ff'), E(11, 6, 4, 5, '#c9f2ff'), E(5, 12, 3, 3, '#ffd0ec'), E(11, 12, 3, 3, '#ffd0ec'), R(8, 5, 1, 8, '#ffffff')];
    case 'angel': return [E(5, 8, 4.5, 6, W), E(11, 8, 4.5, 6, W), R(1, 10, 3, 1, '#e6ebff'), R(12, 10, 3, 1, '#e6ebff')];
    case 'starcape': return [R(4, 2, 8, 3, d), R(3, 5, 10, 10, c), P(6, 8, '#ffe36b'), P(10, 11, W), P(7, 13, W), R(3, 14, 10, 1, GOLD)];
    case 'royal': return [R(4, 2, 8, 3, W), R(3, 5, 10, 10, c), R(3, 13, 10, 2, GOLD)];
    case 'gauntlet': return [R(4, 6, 8, 8, '#dfe6f5'), R(4, 3, 2, 4, '#dfe6f5'), R(7, 2, 2, 5, '#dfe6f5'), R(10, 3, 2, 4, '#dfe6f5'), R(4, 12, 8, 2, c)];
    case 'drop': return [E(5, 10, 2, 2.5, c), E(11, 10, 2, 2.5, c), R(5, 4, 1, 4, GOLD), R(11, 4, 1, 4, GOLD)];
    // Shoes, side on and in pairs; gloves and studs as a pair (the basic sets and the starters).
    case 'sneakers': return [0, 8].flatMap((x) => [R(x + 0.5, 9, 4, 4, c), E(x + 4.6, 11.2, 2.6, 1.9, c), R(x + 0.5, 12.6, 7, 1.8, W), R(x + 0.5, 14.2, 7, 0.6, '#d8d0e8'), R(x + 1.5, 8.4, 2.4, 1, l), P(x + 2.5, 10.4, W), P(x + 4, 10, W)]);
    case 'boots': case 'leatherboots': case 'starboots': {
      const extra = { boots: (x) => [R(x + 1, 4, 4, 1.2, l)], leatherboots: (x) => [R(x + 0.4, 3.4, 5.2, 2.2, d), R(x + 1, 8.6, 4, 0.9, d), P(x + 3.6, 8.6, GOLD)], starboots: (x) => [R(x + 0.6, 3.6, 4.8, 1.4, GOLD), E(x + 3, 8.6, 1.3, 1.3, GOLD), P(x + 2.6, 8.2, W)] }[def.design];
      return [0, 8].flatMap((x) => [R(x + 1, 4, 4, 9, c), E(x + 5, 12.4, 2.4, 1.8, c), R(x + 1, 12.4, 6, 1.8, c), R(x + 1, 14, 6.6, 1, d), R(x + 1.6, 5, 1, 7, l), ...extra(x)]);
    }
    case 'mitten': return [0, 8].flatMap((x) => [E(x + 4, 7.4, 3, 3.6, c), E(x + 1, 8.4, 1.3, 1.8, c), R(x + 1.4, 10.4, 5.4, 3.4, l), R(x + 1.4, 11.4, 5.4, 0.8, d), P(x + 3, 6, l)]);
    case 'cuffed': return [0, 8].flatMap((x) => [R(x + 1.4, 5.4, 4.4, 5, c), R(x + 1.4, 2.6, 1.1, 3.4, c), R(x + 2.8, 2, 1.1, 3.8, c), R(x + 4.2, 2.6, 1.1, 3.4, c), E(x + 0.9, 7.6, 1, 1.6, c), R(x + 0.6, 10.2, 6, 3.6, l), R(x + 0.6, 13, 6, 0.8, d)]);
    case 'starter': return def.slot === 'shoes' ? [0, 8].flatMap((x) => [E(x + 4, 11.4, 3.4, 2.4, c), R(x + 0.6, 11.4, 6.8, 2.4, c), R(x + 0.6, 13.4, 7, 1, d), E(x + 2.6, 10.6, 1.6, 0.8, shade(c, -30)), R(x + 4.4, 10, 1.6, 0.8, l)]) : null;
    case 'stud': return [4.5, 11.5].flatMap((x) => [E(x, 9, 2.6, 2.6, c), E(x - 0.8, 8.2, 1, 1, l), P(x - 1, 8, W), R(x - 0.5, 4.6, 1, 2.2, GOLD)]);
    case 'star': return [R(3, 10, 5, 1, c), R(5, 8, 1, 5, c), R(9, 10, 5, 1, c), R(11, 8, 1, 5, c), R(5, 4, 1, 4, GOLD), R(11, 4, 1, 4, GOLD)];
    default: return null;
  }
}

// Job gear and jewels have no hand-drawn icon: the icon is the piece itself, drawn with the same
// shapes the character wears and fitted into the 16x16 cell.
function wornShapes(def, variant) {
  const pc = pieceOf(def, variant);
  const skin = '#fff0e6';
  switch (def.slot) {
    case 'hat': case 'face': return [...hatBackShapes(def.design, pc.color, pc), ...hatShapes(def.design, pc.color, pc)];
    case 'top': {
      const sleeve = sleeveColor(def.design, pc.color, pc) === 'skin' ? skin : sleeveColor(def.design, pc.color, pc);
      const arms = [[10.4, 7.6], [20.8, 23.6]].flatMap(([sx, hx]) => [limb(sx, 28.2, hx, 35.6, 4.2, 3.4, sleeve), ...offset(shoulderShapes(pc, sx < 15 ? -1 : 1), sx, 28.2)]);
      return [...arms, ...topShapes(def.design, pc.color, pc)];
    }
    case 'bottom': {
      const legs = legLook(def.design, pc.color, skin, pc);
      const bare = { design: 'none', color: legs.low };
      return [...legShapes(11.4, legs, bare, false), ...legShapes(16.6, legs, bare, false), ...hipShapes(legs), ...(skirtShapes(def.design, pc.color, pc) ?? [])];
    }
    case 'shoes': return [...legShapes(9, { top: 'none', low: 'none' }, pc, false).slice(3), ...legShapes(17, { top: 'none', low: 'none' }, pc, false).slice(3)];
    case 'gloves': return [...handShapes(11, 31, pc, skin, 10, 26), ...handShapes(17.5, 31, pc, skin, 18.5, 26)];
    case 'cape': return [...capeShapes(def.design, pc.color, 0, 0, pc), ...capeFrontShapes(def.design, pc.color, pc)];
    case 'earring': return [...earringShapes(def.design, pc.color, pc), ...offset(earringShapes(def.design, pc.color, pc), 8, 0)];
    default: return [];
  }
}

const offset = (shapes, dx, dy) => shapes.map((sh) => ({ ...sh, x: sh.x + dx, y: sh.y + dy }));

// Scales shapes about their bounding box to fill a size x size cell (keeping proportions).
function fitShapes(shapes, size = 16, pad = 1) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const grow = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  const list = shapes.filter((sh) => sh && sh.c !== 'none');
  for (const sh of list) {
    if (sh.t === 'r') { grow(sh.x, sh.y); grow(sh.x + sh.w, sh.y + sh.h); }
    else if (sh.t === 'e') { grow(sh.x - sh.rx, sh.y - sh.ry); grow(sh.x + sh.rx, sh.y + sh.ry); }
    else for (const [px, py] of sh.pts) grow(sh.x + px, sh.y + py);
  }
  if (!list.length) return [];
  const k = (size - pad * 2) / Math.max(x1 - x0, y1 - y0, 1);
  const ox = pad + (size - pad * 2 - (x1 - x0) * k) / 2;
  const oy = pad + (size - pad * 2 - (y1 - y0) * k) / 2;
  const X = (x) => ox + (x - x0) * k;
  const Y = (y) => oy + (y - y0) * k;
  return shapes.filter(Boolean).map((sh) => {
    if (sh.t === 'r') return { ...sh, x: X(sh.x), y: Y(sh.y), w: sh.w * k, h: sh.h * k };
    if (sh.t === 'e') return { ...sh, x: X(sh.x), y: Y(sh.y), rx: sh.rx * k, ry: sh.ry * k };
    return { ...sh, x: 0, y: 0, pts: sh.pts.map(([px, py]) => [X(sh.x + px), Y(sh.y + py)]) };
  });
}

// The little pink star that marks a cash outfit piece.
const CASH_BADGE = [E(13.2, 2.8, 2.8, 2.8, '#ff8fc1'), F(R(12.7, 1, 1, 3.6, '#ffffff')), F(R(11.4, 2.3, 3.6, 1, '#ffffff'))];

function itemShapes(def, variant = null) {
  if (def.type === 'cash') {
    if (def.cover?.fun) return [...fitShapes(JOB_GEAR[def.cover.fun].cover(def.cover.t).shapes), ...CASH_BADGE];
    // A look whose worn piece is too small or spread out to read in a cell has a drawing of its own.
    if (def.skin && ITEM_ART[def.skin]) return [...ITEM_ART[def.skin](), ...CASH_BADGE];
    const look = def.cover ? weaponIcon('sword', def.cover.theme ? 21 : def.cover.tier, def.cover.theme ?? null, def.cover.theme ? null : variant) : itemShapes(ITEMS[def.skin], variant);
    return [...look, ...CASH_BADGE];
  }
  const c = variant ? variantsFor(def)?.[variant]?.main ?? def.color : def.color;
  const l = shade(c, 22);
  const d = shade(c, -18);
  if (def.slot === 'weapon') {
    const icon = weaponIcon(def.weaponType, def.tier, def.theme ?? null, variant);
    if (icon) return icon;
  }
  if (def.design === 'job' || def.design === 'jewel') return fitShapes(wornShapes(def, variant));
  // Bench-made trinkets with no worn look (rings, charms) are drawn like the drops (icons/craft.js).
  if (def.type === 'equip' && !def.design && ITEM_ART[def.id]) return ITEM_ART[def.id]();
  const designed = def.type === 'equip' ? designShapes(def, c, l, d) : null;
  if (designed) return designed;
  // Everyday clothes and basic gear (Lulu's jackets and dresses, the starter and cotton-to-leather
  // sets) are drawn from how they look worn, like job gear, so no two share a stock shape.
  if (wornIcon(def)) {
    const worn = fitShapes(wornShapes(def, variant));
    if (worn.length) return worn;
  }
  if (def.type === 'equip') {
    switch (def.slot) {
      case 'hat': return [E(8, 9, 7, 5, c), R(1, 10, 14, 3, d), P(5, 6, l)];
      case 'top': return [R(4, 4, 8, 10, c), R(1, 4, 3, 6, c), R(12, 4, 3, 6, c), R(6, 4, 4, 2, l)];
      case 'bottom': return [R(4, 3, 8, 4, c), R(4, 7, 3, 8, c), R(9, 7, 3, 8, c), R(4, 3, 8, 1, d)];
      case 'shoes': return [R(2, 9, 6, 5, c), R(9, 9, 6, 5, c), R(2, 13, 6, 1, d), R(9, 13, 6, 1, d)];
      case 'gloves': return [R(4, 6, 8, 8, c), R(4, 3, 2, 4, c), R(7, 2, 2, 5, c), R(10, 3, 2, 4, c), R(4, 12, 8, 2, d)];
      case 'cape': return [R(4, 2, 8, 3, d), R(3, 5, 10, 10, c), R(5, 6, 1, 8, l)];
      case 'earring': return [E(5, 9, 3, 3, c), E(11, 9, 3, 3, c), R(5, 4, 1, 3, GOLD), R(11, 4, 1, 3, GOLD), P(4, 8, '#ffffff'), P(10, 8, '#ffffff')];
      default: return [R(4, 4, 8, 8, c)];
    }
  }
  if (ITEM_ART[def.id]) return ITEM_ART[def.id]();
  // A Mochi sweet: the sweet itself, as a Mochi holds it (render/mochi-sweets.js).
  if (def.mochiSweet) return sweetIcon(def.mochiSweet);
  if (def.effect?.returnTown) return [R(3, 3, 10, 11, '#fff4e0'), R(2, 2, 12, 2, '#e6c9a0'), R(2, 13, 12, 2, '#e6c9a0'), R(6, 6, 4, 5, c), R(5, 6, 6, 1, d)];
  // Throwing stars: a little pile of shuriken in the set's color.
  if (def.star) {
    const ink = shade(c, -45);
    return [
      R(3, 1, 2, 7, d), R(0, 3, 7, 2, d), R(2, 2, 4, 4, d),
      R(9, 3, 3, 13, ink), R(4, 8, 13, 3, ink), R(7, 6, 7, 7, ink),
      R(10, 4, 1, 11, c), R(5, 9, 11, 1, c), R(8, 7, 5, 5, c), R(8, 7, 2, 2, l), E(10.5, 9.5, 1, 1, ink),
    ];
  }
  if (def.type === 'use') return [R(6, 1, 4, 3, '#c99a6b'), R(5, 4, 6, 2, '#ffffff'), E(8, 10, 5, 5, c), E(6, 8, 1.5, 1.5, '#ffffff')];
  // Etc: a little gem-like bauble in the item's color.
  return [E(8, 9, 5, 5, c), E(6, 7, 2, 2, l), P(10, 12, d)];
}

const WORN_SLOTS = new Set(['top', 'bottom', 'shoes', 'gloves', 'cape', 'earring']);
const wornIcon = (def) => def.type === 'equip' && def.design && WORN_SLOTS.has(def.slot) && !ITEM_ART[def.id] && !designShapes(def, def.color, def.color, def.color);

// Worn-shape icons rasterize at twice the detail so small parts survive the shrink; hand-drawn
// drops and tonics at three times, with a crisp inked outline.
export function itemIcon(id, variant = null) {
  const def = ITEMS[id];
  const look = def.type === 'cash' && def.skin ? ITEMS[def.skin] : def;
  const fine = look.design === 'job' || look.design === 'jewel' || wornIcon(look);
  const art = def.type !== 'cash' ? ITEM_ART[id] : def.skin && ITEM_ART[def.skin];
  const detail = art ? { res: id.startsWith('fish_') ? 4 : 3, soft: 'cel', crisp: true } : fine || def.mochiSweet ? { res: def.mochiSweet ? 4 : 2, soft: 'cel' } : {};
  const gear = look.type === 'equip';
  return sprite(`icon|${id}|${variant}`, () => ({ w: 16, h: 16, shapes: gear ? itemShapes(def, variant).map(lifted) : itemShapes(def, variant), ...detail }));
}

// Gear drawn in near-black (demonic, cyber, the shadowy thief sets, endgame weapons) melts into
// one dark blob in a 16 px bag slot. Icons only (the worn gear keeps its colours): every tone
// darker than LIFT is raised toward it on one monotone curve, so the order of the tones (and the
// planes that shade each material) is kept while the darkest reads as a deep hue instead of
// black; greys pick up a cool violet so they don't go flat.
const LIFT = 0.46;
const liftCache = new Map();
function liftTone(c) {
  if (typeof c !== 'string' || !c.startsWith('#') || c.length < 7) return c;
  let v = liftCache.get(c);
  if (v) return v;
  const n = parseInt(c.slice(1, 7), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => x / 255);
  const hi = Math.max(r, g, b);
  const lo = Math.min(r, g, b);
  const l = (hi + lo) / 2;
  if (l >= LIFT) v = c;
  else {
    const d = hi - lo;
    let s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    let h = d === 0 ? 0 : hi === r ? ((g - b) / d) % 6 : hi === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
    if (s < 0.12) [h, s] = [252, 0.2];
    s = Math.min(s, 0.5);
    const l2 = LIFT - (LIFT - l) * 0.5;
    const k = (1 - Math.abs(2 * l2 - 1)) * Math.min(1, s * 1.1);
    const x = k * (1 - Math.abs(((h / 60) % 2) - 1));
    const [r1, g1, b1] = h < 60 ? [k, x, 0] : h < 120 ? [x, k, 0] : h < 180 ? [0, k, x] : h < 240 ? [0, x, k] : h < 300 ? [x, 0, k] : [k, 0, x];
    const m = l2 - k / 2;
    v = `#${[r1, g1, b1].map((q) => Math.round((q + m) * 255).toString(16).padStart(2, '0')).join('')}${c.slice(7)}`;
  }
  liftCache.set(c, v);
  return v;
}
const lifted = (sh) => (sh && sh.c ? { ...sh, c: liftTone(sh.c) } : sh);

export function drawItemIcon(ctx, id, x, y, scale = 1, variant = null) {
  blit(ctx, itemIcon(id, variant ?? null), x, y, { scale });
}

// A plain tile in the skill's school colour, for a skill still waiting on its own icon.
// (Also for a buff that isn't a skill at all, such as an ally's mark: a plain pink tile, never a
// crash that stops the whole frame.)
function skillShapes(s) {
  const c = (s && s.type !== 'passive' && SCHOOL_COLORS[s.school]?.main) || '#ffc2d6';
  return [R(0, 0, 16, 16, shade(c, -30)), R(1, 1, 14, 14, shade(c, -12)), E(8, 8, 4, 4, '#ffffff'), E(8, 8, 2, 2, c)];
}

// Every skill has its own hand-drawn tile (res 3, crisp inked outline); a new one without its art
// yet shows a plain tile.
export function skillIcon(skillId) {
  const art = SKILL_ART[skillId];
  // (The icon redraw: a lighter outline, so the art reads softer and smoother, like the effects.)
  return sprite(`skill|${skillId}`, () => (art ? { w: 16, h: 16, shapes: art(), res: 3, soft: 'cel', crisp: false } : { w: 16, h: 16, shapes: skillShapes(SKILLS[skillId]) }));
}

export function drawSkillIcon(ctx, skillId, x, y, scale = 1) {
  blit(ctx, skillIcon(skillId), x, y, { scale });
}
