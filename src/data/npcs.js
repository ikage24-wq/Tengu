// NPCs. Roles: guide (quests), shop, stylist (change your look for gold), instructor (job advancement).
// `look` uses the same appearance fields as the player, so NPCs are drawn by the hero renderer;
// an NPC can also carry `gear` (same shape as the player's equipment) to show it off. In towns,
// `building` is the stall or hall drawn behind them (see render/town.js) and `sign` its name.

import { ITEMS, GEAR_FAMILIES, JOB_SLOTS, jobGearId } from './items.js';
import { JOBS } from './jobs.js';

const armor = (t) => ['hat', 'top', 'bottom', 'shoes', 'gloves', 'cape', 'earring'].map((s) => `${s}_${t}`);
// Weapons of the given types from level `from` to `to`. Higher ones and the endgame designs only drop.
const arms = (from, to, ...types) => types.flatMap((w) => Array.from({ length: (to - from) / 5 + 1 }, (_, i) => `${w}_${from + i * 5}`));
// An outfit from one job's set at a level, for NPCs to show off.
const outfit = (family, level, variant = null) => Object.fromEntries(JOB_SLOTS.map((s) => [s, { id: jobGearId(family, s, level), variant }]));

export const NPCS = {
  mira: {
    id: 'mira', name: 'Mira', title: 'Village Guide', role: 'guide',
    building: 'kiosk', sign: 'Info',
    look: { hairStyle: 'candy', hairColor: '#ff9ec0', skinTone: '#fff0e6', eyeColor: '#5aa8ff', outfitColor: '#bff0dc', eyeStyle: 'sparkle' },
    greeting: 'Welcome to Sprout Village! Press I for your bag, K for skills, C for stats, and M for the world map.',
    quests: ['story_1_1', 'story_1_2', 'story_1_3', 'story_1_4', 'story_7_1', 'story_7_2', 'first_steps', 'fluffy', 'sprout_sweep', 'mira_letter', 'daily_meadow'],
  },
  // Kuro, a young tengu who keeps Dawnlight Isle, the tutorial island: he shows new adventurers
  // the ropes and sees them onto the boat to Sprout Village.
  kuro: {
    id: 'kuro', name: 'Kuro', title: 'Island Keeper', role: 'guide',
    look: { hairStyle: 'spiky', hairColor: '#2a2440', skinTone: '#fbd9bf', eyeColor: '#d8343a', eyeStyle: 'round', outfitColor: '#3a3550', face: 'grin' },
    greeting: "Morning! You washed up on Dawnlight Isle. Don't worry, I'll show you the ropes, then the boat will take you to Sprout Village.",
    quests: ['tut_hello', 'tut_practice', 'tut_farewell'],
  },
  pip: {
    id: 'pip', name: 'Pip', title: 'General Store', role: 'shop',
    building: 'goods', sign: "Pip's Goods",
    look: { hairStyle: 'pixie', hairColor: '#f5c95c', skinTone: '#fbd9bf', eyeColor: '#7a4a2b', outfitColor: '#ffd66b', eyeStyle: 'round', face: 'grin' },
    greeting: 'Tonics, starter gear, and homeward scrolls. Take a look!',
    shop: ['red_potion', 'orange_potion', 'blue_potion', 'return_scroll', 'star_pebble', 'mochi_snack', 'mochi_feather', 'mochi_clover', 'mochi_bun', 'mochi_gem', ...arms(0, 10, 'sword', 'axe', 'spear', 'wand', 'staff', 'bow', 'crossbow', 'dagger', 'gauntlet'), ...armor(0), 'ear_5', 'ear_10'],
    // Job gear for your own job (a Novice sees every job's starter set), by level.
    stockLevels: [5, 10],
    quests: ['snail_trouble', 'pip_parcel'],
  },
  lulu: {
    id: 'lulu', name: 'Lulu', title: 'Stylist', role: 'stylist',
    quests: ['lulu_gossip', 'lulu_runway', 'lulu_winter'],
    building: 'salon', sign: "Lulu's Salon",
    look: { hairStyle: 'odango', hairColor: '#c9a6ff', skinTone: '#fff0e6', eyeColor: '#9b6cff', outfitColor: '#ffc2d6', eyeStyle: 'sparkle', face: 'excited' },
    greeting: 'New hair? New clothes? A fresh look is 500 gold, and my boutique has the cutest outfits!',
    styleCost: 500,
    shop: ['denim_jacket', 'cozy_sweater', 'overalls', 'sundress', 'school_blazer', 'puffer_jacket', 'maid_dress', 'pleated_skirt', 'blue_jeans', 'cargo_pants', 'long_skirt', 'hoodie', 'sailor_top'],
  },
  brann: {
    id: 'brann', name: 'Brann', title: 'Warrior Instructor', role: 'instructor', family: 'warrior',
    building: 'warrior', sign: 'Warrior Hall', gear: { weapon: { id: 'sword_50', variant: 'crimson' }, ...outfit('warrior', 50) },
    quests: ['brann_stand', 'brann_howl', 'warrior_trial', 'daily_crag'], showJob: 'paladin',
    look: { hairStyle: 'cloud', hairColor: '#7a5238', skinTone: '#e7b48f', eyeColor: '#3b3650', outfitColor: '#ff9b7a', eyeStyle: 'round', face: 'cool' },
    greeting: 'Welcome to Ember Crag! Strong arms, steady heart. Warriors stand in front so others can shine.',
  },
  elowen: {
    id: 'elowen', name: 'Elowen', title: 'Mage Instructor', role: 'instructor', family: 'mage',
    building: 'mage', sign: 'Mage Tower', gear: { weapon: { id: 'staff_50' }, ...outfit('mage', 50) },
    look: { hairStyle: 'hime', hairColor: '#e9ebfa', skinTone: '#fff0e6', eyeColor: '#9b6cff', outfitColor: '#b8a6ff', eyeStyle: 'sleepy', face: 'smug' },
    quests: ['story_3_1', 'story_3_2', 'story_6_1', 'story_6_2', 'story_6_3', 'elowen_dance', 'elowen_foxfire', 'spiritmage_trial'], showJob: 'spiritmage',
    greeting: 'Moonleaf Grove welcomes you. Magic here is a dance with the spirits: they strike for you and they mend for you. Shall we begin?',
  },
  kestrel: {
    id: 'kestrel', name: 'Kestrel', title: 'Archer Instructor', role: 'instructor', family: 'archer',
    building: 'archer', sign: 'Archer Lodge', gear: { weapon: { id: 'bow_50' }, ...outfit('archer', 50) },
    quests: ['kestrel_targets', 'kestrel_wings', 'archer_trial'], showJob: 'beastmaster',
    look: { hairStyle: 'ponytail', hairColor: '#9be08f', skinTone: '#fbd9bf', eyeColor: '#2f6b3a', outfitColor: '#8ee3a6', eyeStyle: 'round', face: 'cat' },
    greeting: 'Sprout Village is archer country! Keep your distance and your aim true.',
  },
  vex: {
    id: 'vex', name: 'Vex', title: 'Thief Instructor', role: 'instructor', family: 'thief',
    building: 'thief', sign: "Thieves' Den", gear: { weapon: { id: 'dagger_50', variant: 'dark' }, ...outfit('thief', 50) },
    quests: ['story_4_1', 'story_4_2', 'story_4_3', 'vex_rumor', 'vex_shadows', 'vex_miko', 'thief_trial'], showJob: 'shinobi',
    look: { hairStyle: 'swoop', hairColor: '#3b3650', skinTone: '#c98e66', eyeColor: '#e8a23c', outfitColor: '#5d5285', eyeStyle: 'sleepy', face: 'smug' },
    greeting: 'The harbor is ours after dark. Fast hands, light feet. Luck favors the bold.',
  },
  tora: {
    id: 'tora', name: 'Tora', title: 'Blacksmith', role: 'shop',
    quests: ['tora_handles', 'tora_cores'],
    // She polishes gear at her forge (ui/polish.js).
    polish: true,
    building: 'forge', sign: "Tora's Forge", gear: { weapon: { id: 'axe_25' }, gloves: { id: 'warrior_gloves_25' } },
    look: { hairStyle: 'wolf', hairColor: '#ff8a5c', skinTone: '#e7b48f', eyeColor: '#c0462f', outfitColor: '#7a5238', outfit: 'overalls', eyeStyle: 'round', face: 'grin' },
    greeting: 'Fresh off the anvil! Blades, axes, spears, and armor that can take a hit.',
    shop: ['red_potion', 'orange_potion', 'white_potion', 'blue_potion', 'return_scroll', 'scroll_watk_100', 'scroll_def_100', 'star_steel', 'star_mint', ...arms(10, 30, 'sword', 'axe', 'spear'), 'ear_15', 'ear_20', 'ear_25'],
    stockLevels: [10, 30],
  },
  nim: {
    id: 'nim', name: 'Nim', title: 'Spell Shop', role: 'shop',
    quests: ['story_5_1', 'story_5_2', 'story_5_3', 'nim_chimes', 'nim_candles', 'nim_stardust'],
    building: 'magic', sign: "Nim's Spells",
    look: { hairStyle: 'hime', hairColor: '#b9a7ff', skinTone: '#fff0e6', eyeColor: '#5aa8ff', outfitColor: '#c9b8ff', outfit: 'sweater', eyeStyle: 'star', face: 'shy' },
    greeting: 'W-welcome... wands, staves, moonberry tonics, and charmed earrings. Mind the floating candles.',
    shop: ['blue_potion', 'mana_elixir', 'red_potion', 'orange_potion', 'return_scroll', ...arms(25, 50, 'wand', 'staff'), 'ear_30', 'ear_35', 'ear_40', 'ear_45', 'ear_50'],
    stockLevels: [30, 50],
  },
  rook: {
    id: 'rook', name: 'Captain Rook', title: 'Harbor Captain', role: 'guide',
    building: 'office', sign: 'Harbor Office',
    look: { hairStyle: 'spiky', hairColor: '#e9ebfa', skinTone: '#e7b48f', eyeColor: '#5aa8ff', outfitColor: '#7fb8ff', eyeStyle: 'round', face: 'grin' },
    greeting: 'The harbor needs brave folks. Got time for a job?',
    quests: ['story_2_1', 'canyon_eggs', 'canyon_stingers', 'canyon_lookout', 'mush_menace', 'leaf_samples', 'restless_ruins', 'crystal_heart', 'rook_harpies', 'rook_stars', 'daily_harbor'],
  },
  bramble: {
    id: 'bramble', name: 'Bramble', title: 'Hollow Warden', role: 'dungeon', dungeon: 'hollow',
    look: { hairStyle: 'wolf', hairColor: '#8fbf7a', skinTone: '#e7b48f', eyeColor: '#7a4a2b', outfitColor: '#b08860', eyeStyle: 'round', face: 'grin' },
    greeting: "Rootwood Hollow is no place to wander alone. Bring a warrior to tank, a mage to heal, and two fighters, or I'll find you some.",
    shop: ['red_potion', 'orange_potion', 'white_potion', 'blue_potion', 'return_scroll'],
    quests: ['story_2_2', 'hollow_heart'],
  },
  marlo: {
    id: 'marlo', name: 'Marlo', title: 'Merchant', role: 'shop',
    building: 'cart', sign: "Marlo's Wares",
    look: { hairStyle: 'fluffybob', hairColor: '#ffb38a', skinTone: '#fbd9bf', eyeColor: '#1f7a6b', outfitColor: '#ffd66b', eyeStyle: 'sparkle', face: 'sassy' },
    greeting: 'Finest goods on the coast. Bows, blades, armor, tonics, and charms!',
    shop: [
      'red_potion', 'orange_potion', 'white_potion', 'blue_potion', 'mana_elixir', 'return_scroll', 'mochi_snack', 'mochi_feather', 'mochi_clover', 'mochi_bun', 'mochi_gem', 
      'scroll_watk_100', 'scroll_def_100', 'star_pebble', 'star_steel', 'star_mint', 'star_moon',
      ...arms(15, 40, 'bow', 'crossbow', 'dagger', 'gauntlet'),
      'hoodie', 'kitty_ears', 'sailor_top',
    ],
    stockLevels: [15, 40],
    quests: ['marlo_scales', 'tusk_trader', 'marlo_spa'],
  },
};

// What a shop offers this hero: its fixed stock, then job gear in its level range. Weapons a
// job can't use are left out (a Novice sees them all), and job sets show for the hero's own
// job, or every job's starter set for a Novice.
export function shopStock(npc, char) {
  const job = JOBS[char.job];
  const usable = (id) => ITEMS[id].slot !== 'weapon' || char.job === 'novice' || job.family === 'gm' || job.weapons.includes(ITEMS[id].weaponType);
  const out = (npc.shop ?? []).filter(usable);
  if (!npc.stockLevels) return out;
  const families = GEAR_FAMILIES.includes(job.family) ? [job.family] : GEAR_FAMILIES;
  for (let L = npc.stockLevels[0]; L <= npc.stockLevels[1]; L += 5) {
    for (const family of families) {
      if (char.job === 'novice' && L > 5) continue;
      for (const slot of JOB_SLOTS) out.push(jobGearId(family, slot, L));
    }
  }
  // Consumables first, then weapons, armor, and earrings, each by level.
  const rank = (d) => (d.type !== 'equip' ? 0 : d.slot === 'weapon' ? 1 : d.slot === 'earring' ? 3 : 2);
  const order = new Map(out.map((id, i) => [id, i]));
  return out.sort((a, b) => rank(ITEMS[a]) - rank(ITEMS[b]) || (rank(ITEMS[a]) ? ITEMS[a].reqLevel - ITEMS[b].reqLevel : 0) || order.get(a) - order.get(b));
}
