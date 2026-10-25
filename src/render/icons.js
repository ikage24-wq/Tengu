// 16x16 icons for items and skills, drawn from shapes and cached like every other sprite.

import { ITEMS } from '../data/items.js';
import { SKILLS } from '../data/skills.js';
import { R, E, P, sprite, blit, shade } from './pixel.js';
import { weaponIcon } from './weapons.js';
import { SCHOOL_COLORS } from './spells.js';

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
    case 'star': return [R(3, 10, 5, 1, c), R(5, 8, 1, 5, c), R(9, 10, 5, 1, c), R(11, 8, 1, 5, c), R(5, 4, 1, 4, GOLD), R(11, 4, 1, 4, GOLD)];
    default: return null;
  }
}

function itemShapes(def) {
  const c = def.color;
  const l = shade(c, 22);
  const d = shade(c, -18);
  if (def.slot === 'weapon') {
    const icon = weaponIcon(def.weaponType, def.tier);
    if (icon) return icon;
  }
  const designed = def.type === 'equip' ? designShapes(def, c, l, d) : null;
  if (designed) return designed;
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
  if (def.scroll) return [R(3, 3, 10, 11, '#fff4e0'), R(2, 2, 12, 2, '#e6c9a0'), R(2, 13, 12, 2, '#e6c9a0'), E(8, 8, 3, 3, c), P(7, 7, '#ffffff')];
  if (def.effect?.returnTown) return [R(3, 3, 10, 11, '#fff4e0'), R(2, 2, 12, 2, '#e6c9a0'), R(2, 13, 12, 2, '#e6c9a0'), R(6, 6, 4, 5, c), R(5, 6, 6, 1, d)];
  if (def.type === 'use') return [R(6, 1, 4, 3, '#c99a6b'), R(5, 4, 6, 2, '#ffffff'), E(8, 10, 5, 5, c), E(6, 8, 1.5, 1.5, '#ffffff')];
  // Etc: a little gem-like bauble in the item's color.
  return [E(8, 9, 5, 5, c), E(6, 7, 2, 2, l), P(10, 12, d)];
}

export function itemIcon(id) {
  const def = ITEMS[id];
  return sprite(`icon|${id}`, () => ({ w: 16, h: 16, shapes: itemShapes(def) }));
}

export function drawItemIcon(ctx, id, x, y, scale = 1) {
  blit(ctx, itemIcon(id), x, y, { scale });
}

const SKILL_COLORS = {
  slash: '#ffb38a', spin: '#ffd66b', flurry: '#ff9ec0', pierce: '#a8e8ff', bolt: '#b8a6ff', burst: '#ffe36b',
  fire: '#ff8a6b', blaze: '#ff9b5c', holy: '#fff3a6', heal: '#9be08f', arrow: '#9be08f', bomb: '#ffb347', star: '#c9d6ff',
  pebble: '#ffd0e6', buff: '#ffe36b', shield: '#8fd3ff', passive: '#d4cbe8', meteor: '#ff9b5c', judgment: '#ffe36b',
  blink: '#c9a6ff', icebeam: '#8fe3ff', thunder: '#ffd84a', chain: '#7fc4ff', icespire: '#9fe3ff', tempest: '#6fa8d8',
  mist: '#8fd86b', toxicblaze: '#7de04f', shiningray: '#ffe36b', storm: '#ffd84a', sprite: '#bfe6ff', salamander: '#ff8a3c', angel: '#fff3a6',
  venom: '#b46bff',
};

function skillShapes(s) {
  const kind = s.type === 'passive' ? 'passive' : s.icon ?? (s.fx === 'rain' ? `rain-${s.variant}` : s.fx);
  const c = (s.type !== 'passive' && SCHOOL_COLORS[s.school]?.main) || SKILL_COLORS[kind] || '#ffc2d6';
  const bg = [R(0, 0, 16, 16, shade(c, -30)), R(1, 1, 14, 14, shade(c, -12))];
  const l = '#ffffff';
  switch (kind) {
    case 'slash': case 'spin': return [...bg, R(3, 11, 3, 3, l), R(5, 9, 3, 3, l), R(7, 7, 3, 3, l), R(9, 5, 3, 3, l), R(11, 3, 2, 2, c)];
    case 'flurry': return [...bg, R(3, 4, 8, 1, l), R(5, 7, 8, 1, l), R(3, 10, 8, 1, l), R(5, 13, 6, 1, c)];
    case 'pierce': case 'arrow': return [...bg, R(2, 7, 10, 2, l), R(11, 5, 2, 6, l), R(13, 7, 1, 2, l), R(2, 6, 2, 1, c), R(2, 9, 2, 1, c)];
    case 'bolt': case 'holy': return [...bg, R(8, 2, 3, 4, l), R(6, 6, 4, 3, l), R(7, 9, 3, 4, l), R(5, 12, 3, 2, l)];
    case 'burst': case 'bomb': return [...bg, E(8, 8, 4, 4, l), R(8, 1, 1, 3, l), R(8, 12, 1, 3, l), R(1, 8, 3, 1, l), R(12, 8, 3, 1, l)];
    case 'fire': case 'blaze': return [...bg, E(8, 10, 4, 4, l), E(8, 6, 2.5, 4, l), P(9, 2, l)];
    case 'meteor': return [...bg, E(10, 10, 4, 4, l), R(3, 3, 2, 2, l), R(5, 5, 2, 2, l), R(7, 7, 2, 2, l), P(10, 9, c)];
    case 'judgment': return [...bg, R(3, 1, 2, 12, l), R(7, 1, 2, 13, l), R(11, 1, 2, 12, l), R(2, 13, 12, 2, l)];
    case 'heal': return [...bg, R(6, 3, 4, 10, l), R(3, 6, 10, 4, l)];
    case 'star': case 'pebble': return [...bg, R(7, 2, 2, 12, l), R(2, 7, 12, 2, l), R(5, 5, 6, 6, l)];
    case 'shield': return [...bg, E(8, 7, 5, 5, l), R(5, 8, 6, 5, l), R(7, 12, 2, 2, l)];
    case 'buff': return [...bg, R(7, 3, 2, 10, l), R(4, 6, 8, 2, l), R(5, 5, 6, 1, l)];
    case 'blink': return [...bg, E(11, 8, 3, 5, l), R(2, 7, 6, 1, l), R(3, 4, 5, 1, c), R(3, 11, 5, 1, c), P(13, 3, l), P(5, 13, l)];
    case 'icebeam': return [...bg, R(2, 7, 9, 2, l), R(11, 6, 2, 4, l), R(13, 7, 2, 2, l), P(4, 4, l), P(7, 12, l), R(3, 3, 1, 3, c)];
    case 'thunder': case 'storm': return [...bg, R(9, 1, 3, 4, l), R(6, 5, 5, 2, l), R(8, 7, 3, 3, l), R(6, 10, 3, 2, l), R(4, 12, 3, 3, l)];
    case 'chain': return [...bg, R(2, 3, 3, 2, l), R(5, 5, 2, 3, l), R(7, 8, 3, 2, l), R(10, 6, 2, 3, l), R(11, 9, 3, 2, l), E(3, 3, 1.5, 1.5, c), E(13, 11, 2, 2, l)];
    case 'icespire': return [...bg, R(7, 2, 2, 12, l), R(6, 6, 4, 8, l), R(3, 8, 2, 6, l), R(11, 7, 2, 7, l), R(1, 14, 14, 1, l)];
    case 'tempest': return [...bg, R(2, 2, 2, 2, l), R(5, 6, 2, 2, l), R(11, 3, 2, 2, l), R(3, 11, 2, 2, l), R(9, 4, 2, 4, '#ffe86b'), R(7, 8, 3, 2, '#ffe86b'), R(8, 10, 2, 4, '#ffe86b')];
    case 'mist': return [...bg, E(5, 10, 3, 3, l), E(10, 9, 4, 4, l), E(8, 6, 3, 3, l), P(7, 9, c), P(10, 8, c), P(11, 10, c)];
    case 'toxicblaze': return [...bg, E(4, 11, 2.5, 4, l), E(8, 9, 3, 6, l), E(12, 11, 2.5, 4, l), P(8, 2, l), P(8, 10, c)];
    case 'shiningray': return [...bg, R(7, 1, 2, 14, l), R(1, 7, 14, 2, l), R(4, 4, 2, 2, l), R(10, 4, 2, 2, l), R(4, 10, 2, 2, l), R(10, 10, 2, 2, l)];
    case 'sprite': return [...bg, E(4, 7, 3, 4, l), E(12, 7, 3, 4, l), E(8, 6, 3, 3, l), R(6, 9, 4, 5, l), P(7, 6, c), P(9, 6, c)];
    case 'salamander': return [...bg, E(9, 10, 5, 3, l), E(4, 8, 3, 3, l), R(13, 7, 2, 3, '#ffe36b'), P(3, 7, c), P(5, 7, c)];
    case 'angel': return [...bg, E(4, 9, 3, 5, l), E(12, 9, 3, 5, l), E(8, 6, 2.5, 2.5, l), R(6, 9, 4, 5, l), E(8, 2, 3, 1, '#ffe36b')];
    case 'charge': return [...bg, R(2, 5, 6, 1, l), R(1, 8, 7, 1, l), R(2, 11, 6, 1, l), E(11, 8, 3, 5, l), R(13, 4, 2, 8, c)];
    case 'wave': return [...bg, E(9, 8, 5, 7, l), E(6, 8, 5, 6, c), R(1, 4, 3, 1, l), R(1, 11, 3, 1, l)];
    case 'vortex': return [...bg, E(8, 8, 6, 3, l), E(8, 8, 4, 2, c), E(8, 8, 2, 1, l), R(3, 3, 2, 2, l), R(11, 12, 2, 2, l)];
    case 'quake': return [...bg, R(1, 12, 14, 2, l), R(3, 8, 3, 4, l), R(7, 5, 2, 7, l), R(11, 9, 3, 3, l), P(5, 4, l), P(12, 5, l)];
    case 'beam': return [...bg, R(1, 6, 14, 4, l), R(1, 7, 14, 2, c), E(3, 8, 2.5, 3.5, l)];
    case 'smoke': return [...bg, E(6, 10, 4, 3, l), E(10, 9, 4, 4, l), E(8, 6, 3, 3, l), R(12, 3, 1, 1, '#ffe36b'), R(3, 4, 1, 1, '#ffe36b')];
    case 'bigarrow': return [...bg, R(2, 7, 10, 2, l), R(11, 5, 2, 6, l), R(13, 7, 2, 2, l), R(3, 4, 1, 8, c), R(6, 4, 1, 8, c)];
    case 'bigstar': case 'rain-star': return [...bg, R(7, 1, 2, 14, l), R(1, 7, 14, 2, l), R(5, 5, 6, 6, l), E(8, 8, 1.5, 1.5, c)];
    case 'coin': case 'rain-coin': return [...bg, E(8, 8, 5, 5, '#c98a2b'), E(8, 7.5, 4.5, 4.5, '#ffd66b'), R(7, 4, 2, 7, '#fff6c9')];
    case 'rain-sword': return [...bg, R(3, 2, 2, 9, l), R(7, 4, 2, 9, l), R(11, 1, 2, 9, l), R(2, 10, 4, 1, c), R(6, 12, 4, 1, c), R(10, 9, 4, 1, c)];
    case 'rain-arrow': return [...bg, R(2, 2, 2, 2, l), R(4, 4, 2, 2, l), R(6, 6, 2, 2, l), R(8, 8, 3, 3, l), R(9, 2, 2, 2, l), R(11, 4, 2, 2, l), R(13, 6, 2, 3, l)];
    case 'dragon': return [...bg, E(6, 8, 5, 4, l), R(9, 6, 6, 3, l), R(2, 2, 2, 4, '#ffe36b'), R(5, 1, 2, 4, '#ffe36b'), P(7, 7, c)];
    case 'hammer': return [...bg, R(3, 3, 10, 5, l), R(7, 8, 2, 7, l), R(4, 5, 8, 1, c)];
    case 'stampede': return [...bg, E(7, 9, 5, 3, l), E(12, 7, 3, 2.5, l), R(13, 4, 1, 2, l), R(4, 11, 1, 3, l), R(9, 11, 1, 3, l), R(1, 7, 3, 1, l)];
    case 'bladestorm': return [...bg, R(2, 13, 12, 1, l), R(3, 3, 1, 1, l), R(4, 4, 8, 1, l), R(2, 8, 12, 1, l), R(12, 2, 1, 12, c), R(5, 10, 6, 1, l)];
    case 'hawk': return [...bg, E(4, 7, 4, 2, l), E(12, 7, 4, 2, l), E(8, 9, 2.5, 3.5, l), E(8, 5, 2, 2, l), R(10, 5, 2, 1, '#ffd66b')];
    default: return [...bg, E(8, 8, 4, 4, l), E(8, 8, 2, 2, c)];
  }
}

export function drawSkillIcon(ctx, skillId, x, y, scale = 1) {
  const s = SKILLS[skillId];
  blit(ctx, sprite(`skill|${skillId}`, () => ({ w: 16, h: 16, shapes: skillShapes(s) })), x, y, { scale });
}
