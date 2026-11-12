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
// TIER_LV[tier] in data/gathering.js), and what bites there (`pool`: fish id -> weight). The sea's
// spots (`sea`: Lantern Lagoon and the voyage) each keep their own tier, cove to deep water. Every
// spot is a quiet nook: a dock or a ledge of its own no monster walks to (the map rules).
// A spot can be a stretch of water (`span`: [x1, x2], fish from anywhere along it; `x` is where
// the other players stand to fish it): the bobber lands as far out from you as it does from `x`,
// or always at `bx` with `fixed`; `anyFace` casts whichever way you're facing (off a boardwalk).

export const FISH = [
  { id: 'fish_minnow', name: 'Sunny Minnow', color: '#ffd66b', fin: '#ffab5a', pattern: 'plain', price: 5, rarity: 1, react: 1.2, tier: 1 },
  { id: 'fish_carp', name: 'Pink Carp', color: '#ffb3cf', fin: '#ff8fb0', pattern: 'spots', price: 11, rarity: 1, react: 1.1, tier: 1 },
  { id: 'fish_trout', name: 'Mint Trout', color: '#9fe0c0', fin: '#5fb88a', pattern: 'spots', price: 15, rarity: 2, react: 0.95, tier: 1 },
  { id: 'fish_sardine', name: 'Silver Sardine', color: '#d6e4ff', fin: '#9fb8e8', pattern: 'stripes', price: 9, rarity: 1, react: 1.1, tier: 1 },
  { id: 'fish_mackerel', name: 'Tide Mackerel', color: '#8fb8ff', fin: '#5a7ad0', pattern: 'stripes', price: 20, rarity: 2, react: 0.9, tier: 1 },
  { id: 'fish_puffer', name: 'Puff-Puff', color: '#fff1c4', fin: '#ffd66b', pattern: 'spots', price: 30, rarity: 3, react: 0.75, tier: 1 },
  { id: 'fish_koi', name: 'Moon Koi', color: '#ffffff', fin: '#ff8a5c', pattern: 'spots', price: 55, rarity: 3, react: 0.7, tier: 2 },
  { id: 'fish_eel', name: 'Glow Eel', color: '#7fe6d6', fin: '#c9b6ff', pattern: 'stripes', price: 45, rarity: 3, react: 0.7, tier: 2 },
  { id: 'fish_hotfish', name: 'Steamfin', color: '#ff9a8a', fin: '#ffd0c4', pattern: 'plain', price: 38, rarity: 2, react: 0.85, tier: 3 },
  { id: 'fish_icefish', name: 'Frostfin', color: '#cfe8ff', fin: '#8fc8ff', pattern: 'stripes', price: 50, rarity: 3, react: 0.7, tier: 4 },
  { id: 'fish_starfish', name: 'Wishing Starfish', color: '#ffe36b', fin: '#ff9ec0', pattern: 'star', price: 100, rarity: 4, react: 0.55, tier: 1 },
  { id: 'fish_seraph', name: 'Seraph Angelfish', color: '#e6dcff', fin: '#ffe9a6', pattern: 'stripes', price: 125, rarity: 4, react: 0.55, tier: 4 },
  { id: 'fish_whale', name: 'Baby Cloud Whale', color: '#f4f8ff', fin: '#b6c8ff', pattern: 'plain', price: 225, rarity: 4, react: 0.5, tier: 4 },
  // Tier 1: the meadows' ponds and the village duck pond.
  { id: 'fish_perch', name: 'Petal Perch', color: '#ffc6dc', fin: '#ff8fb8', pattern: 'stripes', price: 18, rarity: 2, react: 0.95, tier: 1 },
  // Tier 2: the Whispering Glade's waterfall pool.
  { id: 'fish_mossbass', name: 'Moss Bass', color: '#8fc88a', fin: '#5a9e6a', pattern: 'spots', price: 23, rarity: 1, react: 1, tier: 2 },
  { id: 'fish_catfish', name: 'Whisker Catfish', color: '#c8a888', fin: '#9a7a6a', pattern: 'plain', price: 35, rarity: 2, react: 0.85, tier: 2 },
  { id: 'fish_sylphfin', name: 'Sylph Butterflyfish', color: '#d8f0ff', fin: '#b89cff', pattern: 'stripes', price: 65, rarity: 3, react: 0.7, tier: 2 },
  // Tier 3: the cave's glowing pool and the serpent's hot spring.
  { id: 'fish_cavefish', name: 'Lantern Cavefish', color: '#b8c8ff', fin: '#7fe6d6', pattern: 'spots', price: 43, rarity: 2, react: 0.85, tier: 3 },
  { id: 'fish_char', name: 'Sapphire Char', color: '#6f9ae8', fin: '#ffb3a6', pattern: 'spots', price: 75, rarity: 3, react: 0.68, tier: 3 },
  { id: 'fish_dragonkoi', name: 'Dragon Koi', color: '#ffd66b', fin: '#ff6b5a', pattern: 'stripes', price: 190, rarity: 4, react: 0.5, tier: 3 },
  // Tier 4: the frozen lake, the cloud sea and the star pool.
  { id: 'fish_auroratrout', name: 'Aurora Trout', color: '#9fe8d0', fin: '#c9a6ff', pattern: 'stripes', price: 65, rarity: 2, react: 0.8, tier: 4 },
  { id: 'fish_cloudcarp', name: 'Cloud Carp', color: '#f4f6ff', fin: '#a8c8ff', pattern: 'spots', price: 60, rarity: 2, react: 0.8, tier: 4 },
  { id: 'fish_comet', name: 'Comet Tetra', color: '#ffe9a6', fin: '#7f9cff', pattern: 'star', price: 70, rarity: 2, react: 0.75, tier: 4 },
  { id: 'fish_nebularay', name: 'Nebula Ray', color: '#6a5ac8', fin: '#ff9ec7', pattern: 'star', price: 150, rarity: 3, react: 0.6, tier: 4 },
  // Lantern Lagoon and the open sea on the way there (the sea tier: its spots need no level past
  // their region's, so anyone can fish the cove, the boardwalk and the voyage). `big` ones fight:
  // you reel them in (world/fishing.js).
  { id: 'fish_goby', name: 'Lantern Goby', color: '#ffd27a', fin: '#ff8a6a', pattern: 'spots', price: 8, rarity: 1, react: 1.2, tier: 1, size: [4, 10] },
  { id: 'fish_clown', name: 'Ribbon Clownfish', color: '#ff9e5a', fin: '#ffffff', pattern: 'stripes', price: 28, rarity: 2, react: 0.95, tier: 1, size: [6, 13] },
  { id: 'fish_seapony', name: 'Sea Pony', color: '#ffb0c8', fin: '#ff8fb0', pattern: 'plain', price: 38, rarity: 3, react: 0.75, tier: 1, size: [5, 16] },
  { id: 'fish_flying', name: 'Flying Fish', color: '#c8e8ff', fin: '#ffffff', pattern: 'stripes', price: 14, rarity: 1, react: 1.05, tier: 1, size: [18, 36] },
  { id: 'fish_dorado', name: 'Rainbow Dorado', color: '#7fe0a0', fin: '#ffd66b', pattern: 'spots', price: 48, rarity: 2, react: 0.85, tier: 1, size: [60, 140], big: true },
  { id: 'fish_parrot', name: 'Parrotfish', color: '#7fe0c8', fin: '#ff9ec0', pattern: 'spots', price: 21, rarity: 1, react: 1.05, tier: 2, size: [25, 60] },
  { id: 'fish_grouper', name: 'Coral Grouper', color: '#ff8a7a', fin: '#ffc8a0', pattern: 'spots', price: 38, rarity: 2, react: 0.9, tier: 2, size: [40, 95], big: true },
  { id: 'fish_lagoonray', name: 'Lagoon Ray', color: '#a8b8e8', fin: '#6a8ac0', pattern: 'spots', price: 45, rarity: 2, react: 0.85, tier: 2, size: [50, 130], big: true },
  { id: 'fish_angler', name: 'Lantern Angler', color: '#5a4a8a', fin: '#ffe08a', pattern: 'star', price: 85, rarity: 3, react: 0.7, tier: 2, size: [20, 48] },
  { id: 'fish_tuna', name: 'Sailfin Tuna', color: '#6a8ad8', fin: '#ffe08a', pattern: 'stripes', price: 70, rarity: 2, react: 0.8, tier: 3, size: [80, 190], big: true },
  { id: 'fish_mola', name: 'Sunny Mola', color: '#e8ecff', fin: '#ffd66b', pattern: 'plain', price: 115, rarity: 3, react: 0.7, tier: 3, size: [100, 260], big: true },
  { id: 'fish_oarfish', name: 'Ribbon Oarfish', color: '#e8f0ff', fin: '#ff6b8a', pattern: 'stripes', price: 140, rarity: 3, react: 0.65, tier: 3, size: [200, 520], big: true },
  { id: 'fish_marlin', name: 'Golden Marlin', color: '#ffd66b', fin: '#4f7ad0', pattern: 'stripes', price: 325, rarity: 4, react: 0.5, tier: 3, size: [180, 420], big: true },
  // The lighthouse's own: Old Lumen, the great lantern fish under the point, caught only at the end
  // of Granny Kelp's story (world/fishing.js, the boss reel) and let go again.
  { id: 'fish_lumen', name: 'Old Lumen', color: '#fff3a6', fin: '#8fe8ff', pattern: 'star', price: 0, rarity: 4, react: 1.2, tier: 3, size: [640, 820], big: true, boss: true, pull: 1.5 },
  // ---------- The second catch (2026-11-07): 62 more, for 100 ----------
  // `when`: some only bite at a time of day or in some weather ('night', 'day', 'dawn', 'dusk',
  // 'rain', 'snow'; data/fishing.js bitesNow). `legend`: one rumoured giant per region, told of by
  // someone nearby (the Fish page shows the rumour), and a title for the first one you land.
  // Tier 1: the ponds, the village, the harbor and the beach.
  { id: 'fish_goldfish', name: 'Bubble Goldfish', color: '#ffa04a', fin: '#ffd08a', pattern: 'plain', price: 8, rarity: 1, react: 1.2, tier: 1, size: [5, 14] },
  { id: 'fish_loach', name: 'Pond Loach', color: '#d0b080', fin: '#a88a5a', pattern: 'spots', price: 7, rarity: 1, react: 1.15, tier: 1, size: [8, 20] },
  { id: 'fish_bluegill', name: 'Bluegill', color: '#8fb0e0', fin: '#7a8ac8', pattern: 'stripes', price: 10, rarity: 1, react: 1.1, tier: 1, size: [8, 24] },
  { id: 'fish_shiner', name: 'Dusk Shiner', color: '#e8d8ff', fin: '#ffb0d0', pattern: 'plain', price: 16, rarity: 2, react: 0.95, tier: 1, when: 'dusk', size: [6, 15] },
  { id: 'fish_firefly', name: 'Firefly Minnow', color: '#e0ff9a', fin: '#a8e86a', pattern: 'spots', price: 18, rarity: 2, react: 0.95, tier: 1, when: 'night', size: [4, 10] },
  { id: 'fish_rainbow', name: 'Rainbow Trout', color: '#b8d8e8', fin: '#8ab0c8', pattern: 'spots', price: 22, rarity: 2, react: 0.9, tier: 1, when: 'rain', size: [25, 60] },
  { id: 'fish_pike', name: 'Grass Pike', color: '#9ac07a', fin: '#c8a85a', pattern: 'spots', price: 26, rarity: 2, react: 0.9, tier: 1, size: [40, 95], big: true },
  { id: 'fish_flounder', name: 'Sand Flounder', color: '#dcc49c', fin: '#c0a478', pattern: 'spots', price: 12, rarity: 1, react: 1.1, tier: 1, size: [15, 40] },
  { id: 'fish_bream', name: 'Harbor Bream', color: '#d4dcec', fin: '#a8b4cc', pattern: 'plain', price: 12, rarity: 1, react: 1.1, tier: 1, size: [15, 40] },
  { id: 'fish_moonjelly', name: 'Moon Jelly', color: '#e8dcff', fin: '#ffc8e8', pattern: 'plain', price: 20, rarity: 2, react: 1, tier: 1, when: 'night', size: [8, 30] },
  { id: 'fish_darter', name: 'Daybreak Darter', color: '#ffd0a0', fin: '#ff8a7a', pattern: 'stripes', price: 18, rarity: 2, react: 0.9, tier: 1, when: 'dawn', size: [5, 12] },
  { id: 'fish_petalking', name: 'Petal King', color: '#ffb8d4', fin: '#fff0f6', pattern: 'spots', price: 650, rarity: 4, react: 0.5, tier: 1, when: 'rain', size: [90, 160], big: true, legend: { title: 'Pond Royalty', rumor: 'Clover swears a carp as big as a door lives in the Clover Hills pond, and only comes up to sip the rain.' } },
  // Tier 2: the Whispering Glade.
  { id: 'fish_dace', name: 'Fern Dace', color: '#b0e0a8', fin: '#7ac08a', pattern: 'stripes', price: 24, rarity: 1, react: 1, tier: 2, size: [8, 20] },
  { id: 'fish_guppy', name: 'Sprite Guppy', color: '#ffc8e8', fin: '#9ab8ff', pattern: 'spots', price: 26, rarity: 1, react: 1, tier: 2, size: [3, 7] },
  { id: 'fish_betta', name: 'Glade Betta', color: '#6a7aff', fin: '#ff7ab8', pattern: 'plain', price: 40, rarity: 2, react: 0.85, tier: 2, size: [5, 9] },
  { id: 'fish_wisptetra', name: 'Wisp Tetra', color: '#d0fff4', fin: '#8fe8d8', pattern: 'star', price: 44, rarity: 2, react: 0.85, tier: 2, when: 'night', size: [4, 9] },
  { id: 'fish_mistgar', name: 'Mist Gar', color: '#b8ccc0', fin: '#8aa898', pattern: 'spots', price: 46, rarity: 2, react: 0.85, tier: 2, when: 'dawn', size: [50, 120], big: true },
  { id: 'fish_raincarp', name: 'Raindrop Carp', color: '#90b0e0', fin: '#c8dcff', pattern: 'spots', price: 42, rarity: 2, react: 0.85, tier: 2, when: 'rain', size: [30, 70] },
  { id: 'fish_sturgeon', name: 'Old Sturgeon', color: '#8e9cac', fin: '#6a7a8a', pattern: 'plain', price: 90, rarity: 3, react: 0.7, tier: 2, size: [80, 200], big: true },
  { id: 'fish_arowana', name: 'Sylvan Arowana', color: '#d8ffd8', fin: '#ffe07a', pattern: 'stripes', price: 750, rarity: 4, react: 0.5, tier: 2, when: 'night', size: [80, 140], big: true, legend: { title: 'Glade Whisperer', rumor: 'Posy says the glade pool glows green some nights, when the old guardian fish rises to look at the moon.' } },
  // Tier 3: the cave pool and Serpent Springs.
  { id: 'fish_blindfish', name: 'Pale Blindfish', color: '#f2e8f2', fin: '#e0c8e0', pattern: 'plain', price: 40, rarity: 1, react: 1, tier: 3, size: [6, 16] },
  { id: 'fish_crystaltetra', name: 'Crystal Tetra', color: '#c8f0ff', fin: '#a8d8ff', pattern: 'star', price: 50, rarity: 2, react: 0.85, tier: 3, size: [4, 10] },
  { id: 'fish_geode', name: 'Geode Puffer', color: '#b098d0', fin: '#e0c8ff', pattern: 'spots', price: 55, rarity: 2, react: 0.8, tier: 3, size: [10, 30] },
  { id: 'fish_spiritfish', name: 'Lantern Spiritfish', color: '#c0eaff', fin: '#ffffff', pattern: 'star', price: 110, rarity: 3, react: 0.7, tier: 3, when: 'night', size: [15, 40] },
  { id: 'fish_onsengoby', name: 'Onsen Goby', color: '#ffc8b0', fin: '#ff9a8a', pattern: 'spots', price: 42, rarity: 1, react: 1, tier: 3, size: [5, 12] },
  { id: 'fish_snapper', name: 'Ruby Snapper', color: '#e85060', fin: '#ff9aa8', pattern: 'plain', price: 60, rarity: 2, react: 0.8, tier: 3, size: [30, 70] },
  { id: 'fish_embereel', name: 'Ember Eel', color: '#ff7a4a', fin: '#ffd04a', pattern: 'stripes', price: 95, rarity: 3, react: 0.7, tier: 3, when: 'night', size: [60, 150], big: true },
  { id: 'fish_jadeserpent', name: 'Jade Serpentfish', color: '#5ad8a0', fin: '#ffe07a', pattern: 'stripes', price: 900, rarity: 4, react: 0.45, tier: 3, when: 'rain', size: [300, 600], big: true, legend: { title: 'Serpent Tamer', rumor: 'The bath keepers whisper that when it rains on Serpent Springs, a jade serpent swims up out of the deep hot water.' } },
  // Tier 4: the frozen lake, the cloud sea and Starfall's star pool.
  { id: 'fish_smelt', name: 'Snow Smelt', color: '#e8f4ff', fin: '#b8d8f0', pattern: 'plain', price: 55, rarity: 1, react: 0.95, tier: 4, size: [8, 20] },
  { id: 'fish_glacierpike', name: 'Glacier Pike', color: '#a8d0f0', fin: '#e8f4ff', pattern: 'spots', price: 80, rarity: 2, react: 0.8, tier: 4, size: [50, 120], big: true },
  { id: 'fish_cod', name: 'Blizzard Cod', color: '#c8d0dc', fin: '#9aa8b8', pattern: 'spots', price: 75, rarity: 2, react: 0.8, tier: 4, when: 'snow', size: [40, 100], big: true },
  { id: 'fish_aurorajelly', name: 'Aurora Jelly', color: '#c8b8ff', fin: '#8fffd8', pattern: 'plain', price: 130, rarity: 3, react: 0.7, tier: 4, when: 'night', size: [15, 45] },
  { id: 'fish_breeze', name: 'Breeze Minnow', color: '#dcf2ff', fin: '#ffffff', pattern: 'stripes', price: 60, rarity: 1, react: 0.95, tier: 4, size: [5, 12] },
  { id: 'fish_cloudkoi', name: 'Rainbow Cloudkoi', color: '#ffffff', fin: '#ffc8e8', pattern: 'spots', price: 140, rarity: 3, react: 0.7, tier: 4, when: 'dusk', size: [40, 90] },
  { id: 'fish_sunangel', name: 'Sunrise Angelfish', color: '#ffc890', fin: '#ff8a7a', pattern: 'stripes', price: 140, rarity: 3, react: 0.7, tier: 4, when: 'dawn', size: [15, 35] },
  { id: 'fish_twinkle', name: 'Twinkle Guppy', color: '#ffe8a0', fin: '#a8b8ff', pattern: 'star', price: 85, rarity: 2, react: 0.8, tier: 4, when: 'night', size: [3, 8] },
  { id: 'fish_moonfish', name: 'Moonfish', color: '#f0f0ff', fin: '#c8c8f0', pattern: 'plain', price: 150, rarity: 3, react: 0.65, tier: 4, when: 'night', size: [40, 110] },
  { id: 'fish_polaris', name: 'Polaris Koi', color: '#fff8e0', fin: '#a8c8ff', pattern: 'star', price: 1000, rarity: 4, react: 0.45, tier: 4, when: 'night', size: [90, 150], big: true, legend: { title: 'Star Catcher', rumor: 'Professor Lumen has seen a koi made of starlight in the Starfall pool, but only ever in the dead of night.' } },
  // The sea: Lantern Lagoon and the voyage.
  { id: 'fish_tang', name: 'Blue Tang', color: '#4a8aff', fin: '#ffe06a', pattern: 'plain', price: 24, rarity: 1, react: 1, tier: 1, size: [12, 28] },
  { id: 'fish_coralsnapper', name: 'Coral Snapper', color: '#ff7a6a', fin: '#ffc8a0', pattern: 'plain', price: 26, rarity: 1, react: 1, tier: 1, size: [20, 50] },
  { id: 'fish_lanternjelly', name: 'Lantern Jelly', color: '#ffe8a0', fin: '#ffb87a', pattern: 'plain', price: 36, rarity: 2, react: 0.9, tier: 1, when: 'night', size: [10, 35] },
  { id: 'fish_seadragon', name: 'Leafy Seadragon', color: '#c8e080', fin: '#ffc870', pattern: 'plain', price: 95, rarity: 3, react: 0.7, tier: 1, when: 'dawn', size: [15, 35] },
  { id: 'fish_butterfly', name: 'Sunny Butterflyfish', color: '#fff0a0', fin: '#ffffff', pattern: 'stripes', price: 34, rarity: 2, react: 0.9, tier: 2, size: [10, 20] },
  { id: 'fish_lionfish', name: 'Frilled Lionfish', color: '#ff9a7a', fin: '#fff0e8', pattern: 'stripes', price: 70, rarity: 3, react: 0.7, tier: 2, when: 'night', size: [20, 40] },
  { id: 'fish_moray', name: 'Spotted Moray', color: '#d0c060', fin: '#a89840', pattern: 'spots', price: 46, rarity: 2, react: 0.85, tier: 2, size: [60, 160], big: true },
  { id: 'fish_squid', name: 'Ink Squid', color: '#ffd0e0', fin: '#ff9ab8', pattern: 'spots', price: 40, rarity: 2, react: 0.85, tier: 1, when: 'night', size: [20, 50] },
  { id: 'fish_barracuda', name: 'Barracuda', color: '#b0bccc', fin: '#7a8898', pattern: 'spots', price: 60, rarity: 2, react: 0.8, tier: 1, size: [60, 150], big: true },
  { id: 'fish_shark', name: 'Reef Shark Pup', color: '#a0acbc', fin: '#7a8898', pattern: 'plain', price: 120, rarity: 3, react: 0.65, tier: 3, size: [80, 180], big: true },
  { id: 'fish_manta', name: 'Moonlight Manta', color: '#4a5a9a', fin: '#e8f0ff', pattern: 'star', price: 1200, rarity: 4, react: 0.45, tier: 3, when: 'night', size: [300, 550], big: true, legend: { title: 'Manta Rider', rumor: 'Mister Brine has seen a manta wide as his shop glide under Lighthouse Point on moonlit nights.' } },
  // Tidepool Pier (Fishing Lv 30): over the deep water by the Sunken Aquarium.
  { id: 'fish_wrasse', name: 'Pier Wrasse', color: '#7ae0d0', fin: '#ffb0d0', pattern: 'stripes', price: 70, rarity: 1, react: 0.95, tier: 3, size: [10, 30] },
  { id: 'fish_trigger', name: 'Trigger Fish', color: '#e8c870', fin: '#4a6ad0', pattern: 'spots', price: 90, rarity: 2, react: 0.8, tier: 3, size: [20, 45] },
  { id: 'fish_glassfish', name: 'Glassfish', color: '#e8f8ff', fin: '#c8e8ff', pattern: 'plain', price: 95, rarity: 2, react: 0.8, tier: 3, when: 'night', size: [4, 10] },
  { id: 'fish_seabass', name: 'Pier Seabass', color: '#90a8c8', fin: '#6a80a8', pattern: 'plain', price: 100, rarity: 2, react: 0.8, tier: 3, size: [40, 100], big: true },
  { id: 'fish_cuttle', name: 'Rainbow Cuttlefish', color: '#ff9ac8', fin: '#a8e8ff', pattern: 'spots', price: 160, rarity: 3, react: 0.65, tier: 3, when: 'rain', size: [15, 45] },
  { id: 'fish_gramma', name: 'Royal Gramma', color: '#b85aff', fin: '#ffd23a', pattern: 'plain', price: 150, rarity: 3, react: 0.65, tier: 3, when: 'dawn', size: [5, 10] },
  { id: 'fish_goliath', name: 'Goliath Grouper', color: '#9a8a64', fin: '#7a6a48', pattern: 'spots', price: 220, rarity: 3, react: 0.65, tier: 3, size: [100, 250], big: true },
  // Cloudcatch Pier (Fishing Lv 42): the cloud sea beside the Sky Whale.
  { id: 'fish_nimbusminnow', name: 'Nimbus Minnow', color: '#f8fbff', fin: '#c8dcff', pattern: 'plain', price: 110, rarity: 1, react: 0.9, tier: 4, size: [5, 14] },
  { id: 'fish_skymanta', name: 'Sky Manta', color: '#b8d0ff', fin: '#ffffff', pattern: 'spots', price: 170, rarity: 2, react: 0.75, tier: 4, size: [80, 200], big: true },
  { id: 'fish_rainbowfin', name: 'Rainbowfin', color: '#ffd8f0', fin: '#a8f0ff', pattern: 'stripes', price: 160, rarity: 2, react: 0.75, tier: 4, when: 'dawn', size: [15, 35] },
  { id: 'fish_sunflyer', name: 'Sunbeam Flyer', color: '#ffe8a0', fin: '#fff8e0', pattern: 'stripes', price: 150, rarity: 2, react: 0.75, tier: 4, when: 'day', size: [25, 45] },
  { id: 'fish_thundereel', name: 'Thunder Eel', color: '#6a7ad8', fin: '#ffe86a', pattern: 'stripes', price: 260, rarity: 3, react: 0.6, tier: 4, when: 'night', size: [80, 200], big: true },
  { id: 'fish_driftjelly', name: 'Drift Jelly', color: '#e0f0ff', fin: '#ffd8f0', pattern: 'plain', price: 240, rarity: 3, react: 0.6, tier: 4, when: 'dusk', size: [20, 60] },
];

// How long a fish can be (cm): its own range, or one from how rare it is.
export const sizeRange = (fish) => fish.size ?? [6 + fish.rarity * 6, 18 + fish.rarity * 22];
// A catch's length: most are middling, the giants rare.
export const rollSize = (fish, rng = Math.random) => {
  const [lo, hi] = sizeRange(fish);
  return Math.round(lo + (hi - lo) * rng() ** 1.7);
};

export const FISH_BY_ID = Object.fromEntries(FISH.map((f) => [f.id, f]));
export const RARITY_NAMES = ['', 'Common', 'Uncommon', 'Rare', 'Legendary'];
export const RARITY_COLORS = ['', '#9c86b8', '#3f9f5f', '#4f95e0', '#e0a52f'];

// Seconds of waiting before a bite (a random wait between these), and a little longer for rare ones.
export const BITE_WAIT = [2.5, 6];

export const SPOTS = {
  // Tier 1: the beach, the meadows' ponds, and the towns' water.
  dawnbeach: [{ x: 150, y: 474, face: -1, bx: 70, by: 494, tier: 1, pool: { fish_minnow: 6, fish_sardine: 4, fish_puffer: 1, fish_flounder: 4, fish_darter: 3, fish_moonjelly: 2 } }],
  meadow1: [{ x: 1500, y: 632, face: 1, bx: 1552, by: 651, tier: 1, pool: { fish_minnow: 6, fish_carp: 4, fish_perch: 1.5, fish_loach: 4, fish_shiner: 3, fish_firefly: 3 } }],
  meadow2: [{ x: 150, y: 992, face: -1, bx: 70, by: 1011, tier: 1, pool: { fish_minnow: 5, fish_carp: 5, fish_trout: 2, fish_perch: 1, fish_bluegill: 4, fish_loach: 2, fish_rainbow: 3, fish_pike: 1.5, fish_firefly: 2, fish_petalking: 0.12 } }],
  // Sprout Village's duck pond in the Garden Corner.
  sprout: [{ x: 2200, y: 480, face: 1, bx: 2258, by: 491, tier: 1, pool: { fish_minnow: 6, fish_carp: 3, fish_perch: 1, fish_goldfish: 5, fish_shiner: 2, fish_firefly: 2 } }],
  harbor: [{ x: 2190, y: 426, face: 1, bx: 2242, by: 451, tier: 1, pool: { fish_sardine: 5, fish_mackerel: 4, fish_puffer: 2, fish_starfish: 0.3, fish_bream: 4, fish_moonjelly: 2, fish_darter: 1.5 } }],
  // Tier 2: the glade's waterfall pool.
  glade: [{ x: 430, y: 900, face: 1, bx: 500, by: 914, tier: 2, pool: { fish_mossbass: 5, fish_trout: 4, fish_catfish: 3, fish_koi: 1.2, fish_eel: 0.8, fish_sylphfin: 0.6, fish_dace: 4, fish_guppy: 4, fish_betta: 2, fish_wisptetra: 2.5, fish_mistgar: 1.5, fish_raincarp: 2.5, fish_sturgeon: 0.6, fish_arowana: 0.12 } }],
  // Tier 3: the glowing pool by the Crystal Throne's gate, and the serpent's hot spring.
  cave: [{ x: 1330, y: 872, face: 1, bx: 1420, by: 901, tier: 3, pool: { fish_cavefish: 6, fish_eel: 2, fish_char: 1, fish_blindfish: 5, fish_crystaltetra: 3, fish_geode: 2, fish_spiritfish: 1.5 } }],
  tea: [{ x: 1640, y: 1000, face: 1, bx: 1700, by: 1052, tier: 3, pool: { fish_koi: 3, fish_char: 3, fish_eel: 2, fish_loach: 4, fish_carp: 4 } }],
  springs: [{ x: 2090, y: 872, face: 1, bx: 2180, by: 895, tier: 3, pool: { fish_hotfish: 6, fish_char: 2, fish_koi: 1.5, fish_eel: 1.5, fish_dragonkoi: 0.3, fish_onsengoby: 4, fish_snapper: 2.5, fish_embereel: 1.5, fish_jadeserpent: 0.1 } }],
  // Tier 4: ice fishing on the frozen lake, the cloud sea off the Sky Garden's cloud dock, and the
  // star pool at Starfall.
  peak: [{ x: 1960, y: 1136, face: 1, bx: 2036, by: 1136, ice: true, tier: 4, pool: { fish_icefish: 6, fish_auroratrout: 4, fish_trout: 1, fish_seraph: 0.4, fish_smelt: 5, fish_glacierpike: 1.5, fish_cod: 3, fish_aurorajelly: 1.2 } }],
  sky: [{ x: 2616, y: 1040, face: -1, bx: 2535, by: 1055, tier: 4, pool: { fish_cloudcarp: 6, fish_comet: 2, fish_nebularay: 0.6, fish_whale: 0.6, fish_breeze: 5, fish_cloudkoi: 1.5, fish_sunangel: 1.5 } }],
  starfall: [{ x: 870, y: 800, face: 1, bx: 925, by: 813, sky: true, tier: 4, pool: { fish_comet: 5, fish_seraph: 3, fish_starfish: 2, fish_nebularay: 0.8, fish_whale: 0.5, fish_twinkle: 3, fish_moonfish: 1.5, fish_polaris: 0.12 } }],
  // Lantern Lagoon: the cove's rock pools (anyone can fish them), the boardwalk's edges over the
  // lagoon, and the deep water off Lighthouse Point.
  lagoon: [
    // The cove's tide pool, sunk in the sand between its rocks.
    { x: 330, y: 700, face: 1, bx: 405, by: 705, sea: true, tier: 1, pool: { fish_goby: 6, fish_clown: 3, fish_seapony: 1, fish_starfish: 0.2, fish_lanternjelly: 2.5, fish_seadragon: 1 } },
    // The boardwalk, end to end: the west half over the shallows, the east half over the deeper
    // lagoon (a line off the edge, either side).
    { x: 900, y: 620, span: [650, 1150], anyFace: true, face: 1, bx: 946, by: 664, sea: true, tier: 1, pool: { fish_goby: 5, fish_clown: 3, fish_sardine: 3, fish_mackerel: 2, fish_seapony: 0.8, fish_tang: 4, fish_coralsnapper: 3, fish_lanternjelly: 1.5 } },
    { x: 1700, y: 620, span: [1240, 1850], anyFace: true, face: 1, bx: 1746, by: 664, sea: true, tier: 2, pool: { fish_parrot: 6, fish_grouper: 3, fish_lagoonray: 2, fish_angler: 0.8, fish_clown: 2, fish_butterfly: 3, fish_lionfish: 1.5, fish_moray: 1.5 } },
    // Off the cliff at the point, down into the deep water.
    { x: 2350, y: 440, span: [2270, 2392], fixed: true, face: 1, bx: 2385, by: 548, sea: true, deep: true, tier: 3, pool: { fish_tuna: 6, fish_mola: 2, fish_oarfish: 1.2, fish_marlin: 0.35, fish_grouper: 2, fish_shark: 1, fish_manta: 0.12 } },
  ],
  // The Sea Biscuit's stern and bow, both ways: the open sea.
  ...Object.fromEntries(['voyage_out', 'voyage_home', 'voyage_isle'].map((id) => [id, [
    { x: 40, y: 420, span: [18, 150], fixed: true, face: -1, bx: 12, by: 466, sea: true, tier: 1, pool: { fish_flying: 6, fish_sardine: 3, fish_mackerel: 3, fish_dorado: 2, fish_seapony: 0.4, fish_starfish: 0.15, fish_squid: 2.5, fish_barracuda: 1.5 } },
    { x: 720, y: 420, span: [600, 742], fixed: true, face: 1, bx: 748, by: 466, sea: true, tier: 1, pool: { fish_flying: 6, fish_sardine: 3, fish_mackerel: 3, fish_dorado: 2, fish_seapony: 0.4, fish_starfish: 0.15, fish_squid: 2.5, fish_barracuda: 1.5 } },
  ]])),
  // Tidepool Pier: a line over the rail into the deep water by the Sunken Aquarium (Fishing Lv 30).
  tidepool_pier: [{ x: 400, y: 380, span: [240, 560], anyFace: true, face: 1, bx: 440, by: 356, sea: true, tier: 3, lv: 30, pool: { fish_wrasse: 6, fish_trigger: 3, fish_glassfish: 2.5, fish_seabass: 2, fish_cuttle: 1.5, fish_gramma: 1, fish_goliath: 0.7 } }],
  // Cloudcatch Pier: a line over the rail into the cloud sea beside the Sky Whale (Fishing Lv 42).
  cloudcatch_pier: [{ x: 380, y: 380, span: [200, 560], anyFace: true, face: 1, bx: 420, by: 358, tier: 4, lv: 42, pool: { fish_nimbusminnow: 6, fish_skymanta: 2, fish_rainbowfin: 2.5, fish_sunflyer: 2.5, fish_thundereel: 1.2, fish_driftjelly: 1.2 } }],
};

// Whether a fish is biting now: `when` it comes out (none: any time). `now` is { night (0-1, by the
// clock), hour (0-24), weather ('rain' | 'snow' | null) }.
export const WHEN_NAMES = { night: 'at night', day: 'in the daytime', dawn: 'at dawn', dusk: 'at dusk', rain: 'in the rain', snow: 'in the snow' };
export function bitesNow(fish, now) {
  switch (fish.when) {
    case undefined: return true;
    case 'night': return (now.night ?? 0) >= 0.5;
    case 'day': return (now.night ?? 0) < 0.5;
    case 'dawn': return now.hour >= 4.5 && now.hour < 7.5;
    case 'dusk': return now.hour >= 17.5 && now.hour < 21;
    default: return now.weather === fish.when;
  }
}

// A spot's pool as it is now: only the fish biting at this hour and in this weather.
export function bitingPool(pool, now) {
  const live = Object.entries(pool).filter(([id]) => FISH_BY_ID[id] && bitesNow(FISH_BY_ID[id], now));
  return live.length ? live : Object.entries(pool).filter(([id]) => !FISH_BY_ID[id]?.when);
}

// How close you must stand to a spot to cast.
export const SPOT_REACH = 30;
