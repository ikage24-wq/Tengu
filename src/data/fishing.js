// Fishing: a rod from Pip or Marlo, a quiet spot by the water, and patience. Stand at a fishing
// spot and press Up (or the Fish button on a phone) to cast; when the bobber dips, tap Attack
// (Z) before the fish lets go. Rarer fish bite less often and give you less time to react. Fish
// are cooking ingredients, sell well, and fill the Fish page of the Collection with their sizes.
//
// FISH: { id, name, color (body), fin, pattern ('plain' | 'stripes' | 'spots' | 'star'), size [cm
// lo, hi], price, rarity (1 common ... 4 legendary), react (seconds to tap after the bite), tier
// (the region it's first found in, 1-4: docs/design/life-skills.md) }.
// SPOTS: per map, where to stand ({ x, y }: the floor you stand on, `face` toward the water), where
// the bobber floats ({ bx, by }), the region's `tier` (1-4: the Fishing level it needs is
// TIER_LV[tier] in data/gathering.js), and what bites there (`pool`: fish id -> weight). Every
// spot is a quiet nook: a dock or a ledge of its own no monster walks to (the map rules).

export const FISH = [
  { id: 'fish_minnow', name: 'Sunny Minnow', color: '#ffd66b', fin: '#ffab5a', pattern: 'plain', price: 20, rarity: 1, react: 1.2, tier: 1 },
  { id: 'fish_carp', name: 'Pink Carp', color: '#ffb3cf', fin: '#ff8fb0', pattern: 'spots', price: 45, rarity: 1, react: 1.1, tier: 1 },
  { id: 'fish_trout', name: 'Mint Trout', color: '#9fe0c0', fin: '#5fb88a', pattern: 'spots', price: 60, rarity: 2, react: 0.95, tier: 1 },
  { id: 'fish_sardine', name: 'Silver Sardine', color: '#d6e4ff', fin: '#9fb8e8', pattern: 'stripes', price: 35, rarity: 1, react: 1.1, tier: 1 },
  { id: 'fish_mackerel', name: 'Tide Mackerel', color: '#8fb8ff', fin: '#5a7ad0', pattern: 'stripes', price: 80, rarity: 2, react: 0.9, tier: 1 },
  { id: 'fish_puffer', name: 'Puff-Puff', color: '#fff1c4', fin: '#ffd66b', pattern: 'spots', price: 120, rarity: 3, react: 0.75, tier: 1 },
  { id: 'fish_koi', name: 'Moon Koi', color: '#ffffff', fin: '#ff8a5c', pattern: 'spots', price: 220, rarity: 3, react: 0.7, tier: 2 },
  { id: 'fish_eel', name: 'Glow Eel', color: '#7fe6d6', fin: '#c9b6ff', pattern: 'stripes', price: 180, rarity: 3, react: 0.7, tier: 2 },
  { id: 'fish_hotfish', name: 'Steamfin', color: '#ff9a8a', fin: '#ffd0c4', pattern: 'plain', price: 150, rarity: 2, react: 0.85, tier: 3 },
  { id: 'fish_icefish', name: 'Frostfin', color: '#cfe8ff', fin: '#8fc8ff', pattern: 'stripes', price: 200, rarity: 3, react: 0.7, tier: 4 },
  { id: 'fish_starfish', name: 'Wishing Starfish', color: '#ffe36b', fin: '#ff9ec0', pattern: 'star', price: 400, rarity: 4, react: 0.55, tier: 1 },
  { id: 'fish_seraph', name: 'Seraph Angelfish', color: '#e6dcff', fin: '#ffe9a6', pattern: 'stripes', price: 500, rarity: 4, react: 0.55, tier: 4 },
  { id: 'fish_whale', name: 'Baby Cloud Whale', color: '#f4f8ff', fin: '#b6c8ff', pattern: 'plain', price: 900, rarity: 4, react: 0.5, tier: 4 },
  // Tier 1: the meadows' ponds and the village duck pond.
  { id: 'fish_perch', name: 'Petal Perch', color: '#ffc6dc', fin: '#ff8fb8', pattern: 'stripes', price: 70, rarity: 2, react: 0.95, tier: 1 },
  // Tier 2: the Whispering Glade's waterfall pool.
  { id: 'fish_mossbass', name: 'Moss Bass', color: '#8fc88a', fin: '#5a9e6a', pattern: 'spots', price: 90, rarity: 1, react: 1, tier: 2 },
  { id: 'fish_catfish', name: 'Whisker Catfish', color: '#c8a888', fin: '#9a7a6a', pattern: 'plain', price: 140, rarity: 2, react: 0.85, tier: 2 },
  { id: 'fish_sylphfin', name: 'Sylph Butterflyfish', color: '#d8f0ff', fin: '#b89cff', pattern: 'stripes', price: 260, rarity: 3, react: 0.7, tier: 2 },
  // Tier 3: the cave's glowing pool and the serpent's hot spring.
  { id: 'fish_cavefish', name: 'Lantern Cavefish', color: '#b8c8ff', fin: '#7fe6d6', pattern: 'spots', price: 170, rarity: 2, react: 0.85, tier: 3 },
  { id: 'fish_char', name: 'Sapphire Char', color: '#6f9ae8', fin: '#ffb3a6', pattern: 'spots', price: 300, rarity: 3, react: 0.68, tier: 3 },
  { id: 'fish_dragonkoi', name: 'Dragon Koi', color: '#ffd66b', fin: '#ff6b5a', pattern: 'stripes', price: 750, rarity: 4, react: 0.5, tier: 3 },
  // Tier 4: the frozen lake, the cloud sea and the star pool.
  { id: 'fish_auroratrout', name: 'Aurora Trout', color: '#9fe8d0', fin: '#c9a6ff', pattern: 'stripes', price: 260, rarity: 2, react: 0.8, tier: 4 },
  { id: 'fish_cloudcarp', name: 'Cloud Carp', color: '#f4f6ff', fin: '#a8c8ff', pattern: 'spots', price: 240, rarity: 2, react: 0.8, tier: 4 },
  { id: 'fish_comet', name: 'Comet Tetra', color: '#ffe9a6', fin: '#7f9cff', pattern: 'star', price: 280, rarity: 2, react: 0.75, tier: 4 },
  { id: 'fish_nebularay', name: 'Nebula Ray', color: '#6a5ac8', fin: '#ff9ec7', pattern: 'star', price: 600, rarity: 3, react: 0.6, tier: 4 },
];

export const FISH_BY_ID = Object.fromEntries(FISH.map((f) => [f.id, f]));
export const RARITY_NAMES = ['', 'Common', 'Uncommon', 'Rare', 'Legendary'];
export const RARITY_COLORS = ['', '#9c86b8', '#3f9f5f', '#4f95e0', '#e0a52f'];

// Seconds of waiting before a bite (a random wait between these), and a little longer for rare ones.
export const BITE_WAIT = [2.5, 6];

export const SPOTS = {
  // Tier 1: the beach, the meadows' ponds, and the towns' water.
  dawnbeach: [{ x: 380, y: 480, face: -1, bx: 300, by: 478, tier: 1, pool: { fish_minnow: 6, fish_sardine: 4, fish_puffer: 1 } }],
  meadow1: [{ x: 2272, y: 952, face: -1, bx: 2235, by: 998, tier: 1, pool: { fish_minnow: 6, fish_carp: 4, fish_perch: 1.5 } }],
  meadow2: [{ x: 60, y: 952, face: 1, bx: 125, by: 998, tier: 1, pool: { fish_minnow: 5, fish_carp: 5, fish_trout: 2, fish_perch: 1 } }],
  // Sprout Village's duck pond in the Garden Corner.
  sprout: [{ x: 2300, y: 480, face: -1, bx: 2232, by: 478, tier: 1, pool: { fish_minnow: 6, fish_carp: 3, fish_perch: 1 } }],
  harbor: [{ x: 2190, y: 426, face: 1, bx: 2260, by: 466, tier: 1, pool: { fish_sardine: 5, fish_mackerel: 4, fish_puffer: 2, fish_starfish: 0.3 } }],
  // Tier 2: the glade's waterfall pool.
  glade: [{ x: 880, y: 832, face: 1, bx: 945, by: 878, tier: 2, pool: { fish_mossbass: 5, fish_trout: 4, fish_catfish: 3, fish_koi: 1.2, fish_eel: 0.8, fish_sylphfin: 0.6 } }],
  // Tier 3: the glowing pool by the Crystal Throne's gate, and the serpent's hot spring.
  cave: [{ x: 1145, y: 1000, face: 1, bx: 1205, by: 998, tier: 3, pool: { fish_cavefish: 6, fish_eel: 2, fish_char: 1 } }],
  springs: [{ x: 2200, y: 832, face: 1, bx: 2260, by: 870, tier: 3, pool: { fish_hotfish: 6, fish_char: 2, fish_koi: 1.5, fish_eel: 1.5, fish_dragonkoi: 0.3 } }],
  // Tier 4: ice fishing on the frozen lake, the cloud sea off the Sky Garden's cloud dock, and the
  // star pool at Starfall.
  peak: [{ x: 1920, y: 1072, face: 1, bx: 2030, by: 1118, ice: true, tier: 4, pool: { fish_icefish: 6, fish_auroratrout: 4, fish_trout: 1, fish_seraph: 0.4 } }],
  sky: [{ x: 2838, y: 980, face: -1, bx: 2745, by: 1036, tier: 4, pool: { fish_cloudcarp: 6, fish_comet: 2, fish_nebularay: 0.6, fish_whale: 0.6 } }],
  starfall: [{ x: 830, y: 752, face: 1, bx: 905, by: 796, sky: true, tier: 4, pool: { fish_comet: 5, fish_seraph: 3, fish_starfish: 2, fish_nebularay: 0.8, fish_whale: 0.5 } }],
};

// How close you must stand to a spot to cast.
export const SPOT_REACH = 30;
