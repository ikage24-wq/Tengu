// Fishing: a rod from Pip or Marlo, a quiet spot by the water, and patience. Stand at a fishing
// spot and press Up (or the Fish button on a phone) to cast; when the bobber dips, tap Attack
// (Z) before the fish lets go. Rarer fish bite less often and give you less time to react. Fish
// are cooking ingredients, sell well, and fill the Fish page of the Collection with their sizes.
//
// FISH: { id, name, color (body), fin, pattern ('plain' | 'stripes' | 'spots' | 'star'), size [cm
// lo, hi], price, rarity (1 common ... 4 legendary), react (seconds to tap after the bite) }.
// SPOTS: per map, where to stand ({ x, y }: the floor you stand on, `face` toward the water), where
// the bobber floats ({ bx, by }), and what bites there (`pool`: fish id -> weight).

export const FISH = [
  { id: 'fish_minnow', name: 'Sunny Minnow', color: '#ffd66b', fin: '#ffab5a', pattern: 'plain', price: 20, rarity: 1, react: 1.2 },
  { id: 'fish_carp', name: 'Pink Carp', color: '#ffb3cf', fin: '#ff8fb0', pattern: 'spots', price: 45, rarity: 1, react: 1.1 },
  { id: 'fish_trout', name: 'Mint Trout', color: '#9fe0c0', fin: '#5fb88a', pattern: 'spots', price: 60, rarity: 2, react: 0.95 },
  { id: 'fish_sardine', name: 'Silver Sardine', color: '#d6e4ff', fin: '#9fb8e8', pattern: 'stripes', price: 35, rarity: 1, react: 1.1 },
  { id: 'fish_mackerel', name: 'Tide Mackerel', color: '#8fb8ff', fin: '#5a7ad0', pattern: 'stripes', price: 80, rarity: 2, react: 0.9 },
  { id: 'fish_puffer', name: 'Puff-Puff', color: '#fff1c4', fin: '#ffd66b', pattern: 'spots', price: 120, rarity: 3, react: 0.75 },
  { id: 'fish_koi', name: 'Moon Koi', color: '#ffffff', fin: '#ff8a5c', pattern: 'spots', price: 220, rarity: 3, react: 0.7 },
  { id: 'fish_eel', name: 'Glow Eel', color: '#7fe6d6', fin: '#c9b6ff', pattern: 'stripes', price: 180, rarity: 3, react: 0.7 },
  { id: 'fish_hotfish', name: 'Steamfin', color: '#ff9a8a', fin: '#ffd0c4', pattern: 'plain', price: 150, rarity: 2, react: 0.85 },
  { id: 'fish_icefish', name: 'Frostfin', color: '#cfe8ff', fin: '#8fc8ff', pattern: 'stripes', price: 200, rarity: 3, react: 0.7 },
  { id: 'fish_starfish', name: 'Wishing Starfish', color: '#ffe36b', fin: '#ff9ec0', pattern: 'star', price: 400, rarity: 4, react: 0.55 },
  { id: 'fish_seraph', name: 'Seraph Angelfish', color: '#e6dcff', fin: '#ffe9a6', pattern: 'stripes', price: 500, rarity: 4, react: 0.55 },
  { id: 'fish_whale', name: 'Baby Cloud Whale', color: '#f4f8ff', fin: '#b6c8ff', pattern: 'plain', price: 900, rarity: 4, react: 0.5 },
];

export const FISH_BY_ID = Object.fromEntries(FISH.map((f) => [f.id, f]));
export const RARITY_NAMES = ['', 'Common', 'Uncommon', 'Rare', 'Legendary'];
export const RARITY_COLORS = ['', '#9c86b8', '#3f9f5f', '#4f95e0', '#e0a52f'];

// Seconds of waiting before a bite (a random wait between these), and a little longer for rare ones.
export const BITE_WAIT = [2.5, 6];

export const SPOTS = {
  dawnbeach: [{ x: 380, y: 480, face: -1, bx: 300, by: 478, pool: { fish_minnow: 6, fish_sardine: 4, fish_puffer: 1 } }],
  meadow1: [{ x: 2272, y: 952, face: -1, bx: 2215, by: 998, pool: { fish_minnow: 6, fish_carp: 4 } }],
  meadow2: [{ x: 168, y: 912, face: 1, bx: 230, by: 958, pool: { fish_minnow: 5, fish_carp: 5, fish_trout: 2 } }],
  harbor: [{ x: 2230, y: 426, face: 1, bx: 2300, by: 466, pool: { fish_sardine: 5, fish_mackerel: 4, fish_puffer: 2, fish_starfish: 0.3 } }],
  glade: [{ x: 1985, y: 832, face: 1, bx: 2045, by: 878, pool: { fish_carp: 4, fish_trout: 4, fish_koi: 1.2, fish_eel: 0.8 } }],
  springs: [{ x: 2200, y: 832, face: 1, bx: 2260, by: 870, pool: { fish_hotfish: 6, fish_koi: 1.5, fish_eel: 1.5 } }],
  peak: [{ x: 1920, y: 1072, face: 1, bx: 2030, by: 1118, ice: true, pool: { fish_icefish: 6, fish_trout: 2, fish_seraph: 0.4 } }],
  starfall: [{ x: 830, y: 752, face: 1, bx: 905, by: 796, sky: true, pool: { fish_seraph: 3, fish_starfish: 2, fish_whale: 0.5 } }],
};

// How close you must stand to a spot to cast.
export const SPOT_REACH = 30;
