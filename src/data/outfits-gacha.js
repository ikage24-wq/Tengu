// The capsule machines (gacha): one in each town, each with its own themed set of looks you can't
// get anywhere else (never sold in the Cash Shop). A pull costs a Gacha Ticket, earned by playing;
// every look is cosmetic only. Each machine's lineup builds one living set: the pieces move and
// glow (render/gacha.js draws their effects), and wearing the whole set adds its own bonus effect.
// Rarity: 'common', 'rare', or 'star' (the machine's prize). Each entry is drawn by
// src/render/jobgear/gacha.js, which looks entries up by key (keep the order: an entry's index is
// its design number). Same fields as outfits-fun.js, plus `machine`, `rarity` and `fx` (its effect).

export const GACHA_MACHINES = {
  sprout: { name: 'Sprout Village Capsules', town: 'sprout', set: 'Spring Spirit', theme: 'The spirit of spring: blossoms, dew and fireflies', colors: ['#7fd17a', '#ffd23f', '#ff9ec0'] },
};

export const GACHA_LOOKS = [
  // Sprout Village: the Spring Spirit set.
  { key: 'bloomcrown', name: 'Bloom Crown', slot: 'hat', machine: 'sprout', rarity: 'rare', color: '#7fd17a', colors: false, fx: 'pollen' },
  { key: 'petaldress', name: 'Petal Dress', slot: 'top', machine: 'sprout', rarity: 'rare', color: '#ffb7d3', covers: ['bottom'], fx: 'petals' },
  { key: 'vinebracers', name: 'Vine Bracers', slot: 'gloves', machine: 'sprout', rarity: 'common', color: '#7fd17a', colors: false },
  { key: 'rootsandals', name: 'Root Sandals', slot: 'shoes', machine: 'sprout', rarity: 'common', color: '#7fd17a', colors: false, fx: 'blooms' },
  { key: 'dewsparkle', name: 'Dew Sparkle', slot: 'face', machine: 'sprout', rarity: 'common', color: '#a8e8ff', colors: false, fx: 'glints' },
  { key: 'dewwings', name: 'Dewdrop Wings', slot: 'cape', machine: 'sprout', rarity: 'star', color: '#c8f6e0', colors: false, fx: 'fireflies' },
];

// Wearing every piece of a machine's set.
export const GACHA_SETS = { sprout: { name: 'Spring Spirit', fx: 'springglow' } };
