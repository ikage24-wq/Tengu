// NPCs. Roles: guide (quests), shop, stylist (change your look for gold), instructor (job advancement).
// `look` uses the same appearance fields as the player, so NPCs are drawn by the hero renderer;
// an NPC can also carry `gear` (same shape as the player's equipment) to show it off. In towns,
// `building` is the stall or hall drawn behind them (see render/town.js) and `sign` its name.

const armor = (t) => ['hat', 'top', 'bottom', 'shoes', 'gloves', 'cape', 'earring'].map((s) => `${s}_${t}`);
// Weapons of the given types for tiers 1 to 3. Tier 4 and the endgame designs only drop.
const arms = (...types) => types.flatMap((w) => [1, 2, 3].map((t) => `${w}_${t}`));

export const NPCS = {
  mira: {
    id: 'mira', name: 'Mira', title: 'Village Guide', role: 'guide',
    building: 'kiosk', sign: 'Info',
    look: { hairStyle: 'twintails', hairColor: '#ff9ec0', skinTone: '#fff0e6', eyeColor: '#5aa8ff', outfitColor: '#bff0dc', eyeStyle: 'sparkle' },
    greeting: 'Welcome to Sprout Village! Press I for your bag, K for skills, C for stats, and M for the world map.',
    quests: ['first_steps', 'fluffy', 'sprout_sweep'],
  },
  pip: {
    id: 'pip', name: 'Pip', title: 'General Store', role: 'shop',
    building: 'goods', sign: "Pip's Goods",
    look: { hairStyle: 'short', hairColor: '#f5c95c', skinTone: '#fbd9bf', eyeColor: '#7a4a2b', outfitColor: '#ffd66b', eyeStyle: 'round', face: 'grin' },
    greeting: 'Tonics, starter gear, and homeward scrolls. Take a look!',
    shop: ['red_potion', 'orange_potion', 'blue_potion', 'return_scroll', ...['sword', 'axe', 'spear', 'wand', 'staff', 'bow', 'crossbow', 'dagger', 'claw'].map((w) => `${w}_0`), ...armor(0)],
    quests: ['snail_trouble'],
  },
  lulu: {
    id: 'lulu', name: 'Lulu', title: 'Stylist', role: 'stylist',
    building: 'salon', sign: "Lulu's Salon",
    look: { hairStyle: 'bun', hairColor: '#c9a6ff', skinTone: '#fff0e6', eyeColor: '#9b6cff', outfitColor: '#ffc2d6', eyeStyle: 'sparkle', face: 'excited' },
    greeting: 'New hair? New clothes? A fresh look is 500 gold, and my boutique has the cutest outfits!',
    styleCost: 500,
    shop: ['denim_jacket', 'cozy_sweater', 'overalls', 'sundress', 'school_blazer', 'puffer_jacket', 'maid_dress', 'pleated_skirt', 'blue_jeans', 'cargo_pants', 'long_skirt', 'hoodie', 'sailor_top'],
  },
  brann: {
    id: 'brann', name: 'Brann', title: 'Warrior Instructor', role: 'instructor', family: 'warrior',
    building: 'warrior', sign: 'Warrior Hall', gear: { weapon: { id: 'sword_2' } },
    look: { hairStyle: 'curly', hairColor: '#7a5238', skinTone: '#e7b48f', eyeColor: '#3b3650', outfitColor: '#ff9b7a', eyeStyle: 'round', face: 'cool' },
    greeting: 'Welcome to Ember Crag! Strong arms, steady heart. Warriors stand in front so others can shine.',
  },
  elowen: {
    id: 'elowen', name: 'Elowen', title: 'Mage Instructor', role: 'instructor', family: 'mage',
    building: 'mage', sign: 'Mage Tower', gear: { weapon: { id: 'staff_3' } },
    showJob: 'bishop',
    look: { hairStyle: 'long', hairColor: '#e9ebfa', skinTone: '#fff0e6', eyeColor: '#9b6cff', outfitColor: '#b8a6ff', eyeStyle: 'sleepy', face: 'smug' },
    greeting: 'Moonleaf Grove welcomes you. Magic is patience and a lot of MP. Shall we begin?',
  },
  kestrel: {
    id: 'kestrel', name: 'Kestrel', title: 'Archer Instructor', role: 'instructor', family: 'archer',
    building: 'archer', sign: 'Archer Lodge', gear: { weapon: { id: 'bow_2' } },
    look: { hairStyle: 'ponytail', hairColor: '#9be08f', skinTone: '#fbd9bf', eyeColor: '#2f6b3a', outfitColor: '#8ee3a6', eyeStyle: 'round', face: 'cat' },
    greeting: 'Sprout Village is archer country! Keep your distance and your aim true.',
  },
  vex: {
    id: 'vex', name: 'Vex', title: 'Thief Instructor', role: 'instructor', family: 'thief',
    building: 'thief', sign: "Thieves' Den", gear: { weapon: { id: 'dagger_2' } },
    look: { hairStyle: 'short', hairColor: '#3b3650', skinTone: '#c98e66', eyeColor: '#e8a23c', outfitColor: '#5d5285', eyeStyle: 'sleepy', face: 'smug' },
    greeting: 'The harbor is ours after dark. Fast hands, light feet. Luck favors the bold.',
  },
  tora: {
    id: 'tora', name: 'Tora', title: 'Blacksmith', role: 'shop',
    building: 'forge', sign: "Tora's Forge", gear: { weapon: { id: 'axe_1' } },
    look: { hairStyle: 'wolf', hairColor: '#ff8a5c', skinTone: '#e7b48f', eyeColor: '#c0462f', outfitColor: '#7a5238', outfit: 'overalls', eyeStyle: 'round', face: 'grin' },
    greeting: 'Fresh off the anvil! Blades, axes, spears, and armor that can take a hit.',
    shop: ['red_potion', 'orange_potion', 'white_potion', 'blue_potion', 'return_scroll', 'scroll_watk_100', 'scroll_def_100', ...arms('sword', 'axe', 'spear'), ...armor(1), ...armor(2)],
  },
  nim: {
    id: 'nim', name: 'Nim', title: 'Spell Shop', role: 'shop',
    building: 'magic', sign: "Nim's Spells",
    look: { hairStyle: 'hime', hairColor: '#b9a7ff', skinTone: '#fff0e6', eyeColor: '#5aa8ff', outfitColor: '#c9b8ff', outfit: 'sweater', eyeStyle: 'star', face: 'shy' },
    greeting: 'W-welcome... wands, staves, moonberry tonics, and charmed earrings. Mind the floating candles.',
    shop: ['blue_potion', 'mana_elixir', 'red_potion', 'orange_potion', 'return_scroll', ...arms('wand', 'staff'), 'earring_1', 'earring_2', 'earring_3'],
  },
  rook: {
    id: 'rook', name: 'Captain Rook', title: 'Harbor Captain', role: 'guide',
    building: 'office', sign: 'Harbor Office',
    look: { hairStyle: 'short', hairColor: '#e9ebfa', skinTone: '#e7b48f', eyeColor: '#5aa8ff', outfitColor: '#7fb8ff', eyeStyle: 'round', face: 'grin' },
    greeting: 'The harbor needs brave folks. Got time for a job?',
    quests: ['mush_menace', 'leaf_samples', 'restless_ruins', 'crystal_heart'],
  },
  marlo: {
    id: 'marlo', name: 'Marlo', title: 'Merchant', role: 'shop',
    building: 'cart', sign: "Marlo's Wares",
    look: { hairStyle: 'bob', hairColor: '#ffb38a', skinTone: '#fbd9bf', eyeColor: '#1f7a6b', outfitColor: '#ffd66b', eyeStyle: 'sparkle', face: 'sassy' },
    greeting: 'Finest goods on the coast. Bows, blades, armor, tonics, and charms!',
    shop: [
      'red_potion', 'orange_potion', 'white_potion', 'blue_potion', 'mana_elixir', 'return_scroll',
      'scroll_watk_100', 'scroll_def_100',
      ...arms('bow', 'crossbow', 'dagger', 'claw'),
      ...armor(1), ...armor(2), ...armor(3),
      'hoodie', 'kitty_ears', 'sailor_top',
    ],
    quests: ['tusk_trader'],
  },
};
