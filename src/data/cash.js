// Cash outfits: cosmetic pieces bought with Cash in the Cash Shop. Worn in the outfit slots, they
// cover the look of your real gear (which keeps all its stats); an outfit piece has no stats of
// its own. The shop sells only looks you can't find: the casual, swim and funny lines. Costumes of
// things that drop (job sets, the unique outfits and clothes, jewel earrings, endgame and top
// material weapon covers) are no longer sold, but stay defined so pieces already bought still
// work (`retired`). Most come in the same colors as gear.
//
// A cash item: { type: 'cash', slot, skin (the item whose look it wears) or cover
// ({ theme } or { tier }), cash (price) }. Instances: { uid, id, variant }.

import { ITEMS, GEAR_FAMILIES, JOB_SLOTS, ENDGAME_THEMES, UNIQUE_IDS } from './items.js';
import { CASUAL_LOOKS } from './outfits-casual.js';
import { FUN_LOOKS } from './outfits-fun.js';
import { GACHA_LOOKS } from './outfits-gacha.js';
import { COSTUME_LOOKS } from './outfits-costume.js';
import { ACC_LOOKS } from './outfits-acc.js';

// `face` is an outfit-only slot (glasses, masks, stickers), so they can be worn under any hat.
export const OUTFIT_SLOTS = ['hat', 'face', 'top', 'bottom', 'shoes', 'gloves', 'cape', 'earring', 'weapon'];
// Shop styles: everyday clothes, beachwear, silly stuff, full outfits, and fancy accessories.
export const OUTFIT_STYLES = ['casual', 'swim', 'funny', 'costume', 'fancy'];

// Cash a hero starts with, and earns per level and per quest.
export const STARTING_CASH = 5000;
export const CASH_PER_LEVEL = 250;
export const CASH_PER_QUEST = 300;

export const CASH_ITEMS = [];

function add(def) {
  ITEMS[def.id] = { type: 'cash', price: 0, ...def };
  // (Capsule machine looks are never sold: they only come out of the machines.)
  if (!def.retired && !def.gacha) CASH_ITEMS.push(def.id);
}

// The pieces a whole-body costume is split into, and each one's share of the set's price.
const SPLIT = { bottom: { name: 'Bottom', share: 0.25 }, hat: { name: 'Hat', share: 0.25 }, shoes: { name: 'Shoes', share: 0.15 } };

// The casual, swim, and funny lines. Each piece wears a hidden "look" item per slot it dresses
// (its own, plus any it covers, like a onesie's legs), drawn by that line's module with the
// entry's index as its design.
for (const [family, list] of [['casual', CASUAL_LOOKS], ['fun', FUN_LOOKS], ['gacha', GACHA_LOOKS], ['costume', COSTUME_LOOKS], ['acc', ACC_LOOKS]]) {
  list.forEach((e, t) => {
    const look = (slot) => {
      const id = `look_${family}_${e.key}_${slot}`;
      ITEMS[id] = { id, name: e.name, type: 'look', slot, design: 'job', family, tier: t, color: e.color, colors: e.colors };
      return id;
    };
    // (A draft is drawn but not sold yet.)
    const base = { id: `cash_${family}_${e.key}`, name: e.name, slot: e.slot, style: e.style, cash: e.cash, color: e.color, ...(e.draft || e.unsold ? { retired: true } : {}), ...(e.machine ? { gacha: e.machine, rarity: e.rarity } : {}) };
    if (e.slot === 'weapon') add({ ...base, cover: { fun: family, t } });
    else if (e.covers?.includes('hat')) {
      // A whole-body costume or onesie is sold in pieces (the player's call, 2026-11-01): its top
      // (with any gloves and cape it has), and its bottom, hat and shoes each on their own, so
      // they mix and match. The full set is kept, unsold, for anyone who bought it before.
      add({ ...base, retired: true, skin: look(e.slot), covers: Object.fromEntries(e.covers.map((s) => [s, look(s)])) });
      const rest = e.covers.filter((s) => !SPLIT[s]);
      add({ ...base, id: `${base.id}_top`, name: `${e.name} Top`, cash: Math.round(e.cash * 0.45 / 10) * 10, skin: look(e.slot), ...(rest.length ? { covers: Object.fromEntries(rest.map((s) => [s, look(s)])) } : {}) });
      for (const s of e.covers.filter((c) => SPLIT[c])) add({ ...base, id: `${base.id}_${s}`, name: `${e.name} ${SPLIT[s].name}`, slot: s, cash: Math.round(e.cash * SPLIT[s].share / 10) * 10, skin: look(s) });
    } else add({ ...base, skin: look(e.slot), ...(e.covers?.length ? { covers: Object.fromEntries(e.covers.map((s) => [s, look(s)])) } : {}) });
  });
}

// No longer sold (they copy things that drop); kept for pieces already bought.
// Costumes of each job's sets, every fourth tier from Lv 20 up.
const COSTUME_TIERS = [3, 7, 11, 15, 19];
for (const family of GEAR_FAMILIES) {
  for (const t of COSTUME_TIERS) {
    for (const slot of JOB_SLOTS) {
      const skin = ITEMS[`${family}_${slot}_${(t + 1) * 5}`];
      add({ id: `cash_${skin.id}`, name: `${skin.name} Costume`, slot, skin: skin.id, family, retired: true, cash: 600 + t * 90 + (slot === 'top' ? 300 : 0), color: skin.color });
    }
  }
}

// One-of-a-kind outfits and everyday clothes.
const CLOTHES = ['denim_jacket', 'cozy_sweater', 'overalls', 'sundress', 'school_blazer', 'puffer_jacket', 'maid_dress', 'pleated_skirt', 'blue_jeans', 'cargo_pants', 'long_skirt'];
for (const id of [...new Set([...UNIQUE_IDS, ...CLOTHES])]) {
  const skin = ITEMS[id];
  add({ id: `cash_${id}`, name: `${skin.name} Costume`, slot: skin.slot, skin: id, retired: true, cash: skin.unique ? 1500 : 700, color: skin.color });
}

// Jewel earrings.
for (const L of [45, 65, 85, 100]) {
  const skin = ITEMS[`ear_${L}`];
  add({ id: `cash_${skin.id}`, name: `${skin.name} Charm`, slot: 'earring', skin: skin.id, retired: true, cash: 800 + L * 10, color: skin.color });
}

// Weapon covers: an endgame design, or one of the top materials.
const THEME_NAMES = { holy: 'Seraph', demonic: 'Hellfire', bone: 'Ossuary', laser: 'Photon', chainsaw: 'Ripper', cyber: 'Neon' };
for (const theme of ENDGAME_THEMES) add({ id: `cover_${theme}`, name: `${THEME_NAMES[theme]} Weapon Cover`, slot: 'weapon', cover: { theme }, retired: true, cash: 5000, color: ITEMS[`sword_${theme}`].color });
const MATERIAL_COVERS = { 8: 'Crystal', 10: 'Starsteel', 12: 'Sunforged', 13: 'Dragonbone', 16: 'Phoenix', 17: 'Abyssal', 18: 'Astral', 19: 'Celestial', 20: 'Genesis' };
for (const [t, name] of Object.entries(MATERIAL_COVERS)) {
  add({ id: `cover_${t}`, name: `${name} Weapon Cover`, slot: 'weapon', cover: { tier: Number(t) }, retired: true, cash: 1200 + t * 150, color: ITEMS[`sword_${t * 5}`].color });
}

// A cash item at a color costs a little more, and Gilded or Diamond a lot more.
export function cashPrice(def, variant) {
  if (!variant) return def.cash;
  return Math.round(def.cash * (variant === 'gilded' || variant === 'diamond' ? 1.6 : 1.2));
}
