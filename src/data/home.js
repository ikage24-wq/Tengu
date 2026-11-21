// Your island (docs/design/home-island.md; research home-mounts.md): a little tropical island of
// your own in the sea off Pastel Harbor. Captain Rook hands you its deed (the quest `island_deed`),
// and with it a Home Shell: use it anywhere to go home, and again on the island to go back where
// you were. Or sail out from the harbor's quay with Captain Bobbin, the slow and pretty way.
//
// The island is tall (the 2026-11-21 rework): a beach along the bottom, with the rock tiers rising
// behind it, the garden terrace, the rocky rise, the summit and a sea stack off the end. Shelly, a
// hermit crab carpenter who came with the island, opens it up a tier at a time from what you bring
// her (things you find in play, never one item ground out). Everything you use often is on the
// beach where you land; the climbs lead to gathering, fishing, the secret and the view.
//   1  Shell Beach: the dock (and the sell crate), Shelly's workshop and her craft bench, your hut
//      (bed, the trunk onto your storage, a stove), sea fishing, and the garden terrace's first plots
//   2  Tide Pond: the spring opens, a waterfall falls into a pond on the beach with a jetty to fish
//      from, and behind the falls a little grotto (the island's secret)
//   3  The Rocky Rise: a ladder up to the rise, with an ore vein, a herb patch and a fruit tree
//   4  Coral Islet: a rope bridge from the rise out to the sea stack, cherries and cotton on top
//   5  Sunset Summit: the climb to the top, the lighthouse, a terrace for your trophies, and the
//      zip line straight back down to the dock
// The hut's other rooms Shelly builds one at a time, each for its own price (HOME_ROOMS below).
// The island never replaces the hunting maps: its spots are small and refill like any other's.
// Nothing withers while you're away and there's nothing to pay upkeep on.

export const HOME_STAGES = [
  null,
  { name: 'Shell Beach', about: 'Your dock, the beach, your hut, Shelly\'s workshop and two garden plots.', needs: {}, gold: 0 },
  { name: 'Tide Pond', about: 'The spring opens: a waterfall, a pond to fish, the grotto behind it, and a third plot.', needs: { oak_log: 10, cotton: 6, shell: 6 }, gold: 3000 },
  { name: 'The Rocky Rise', about: 'A ladder up to the rise: ore, herbs and a fruit tree, and a fourth plot.', needs: { copper_ore: 12, maple_log: 8, clover: 10 }, gold: 8000 },
  { name: 'Coral Islet', about: 'A rope bridge out to the sea stack: cotton and prickly pears, and a fifth plot.', needs: { maple_log: 20, iron_ore: 10, silkmoss: 8, hollow_acorn: 6 }, gold: 20000 },
  { name: 'Sunset Summit', about: 'The climb to the top: a lighthouse, a terrace for your trophies, a zip line home, and a sixth plot.', needs: { cedar_log: 15, silver_ore: 10, lotus_fiber: 8 }, gold: 50000 },
];
export const HOME_MAX = HOME_STAGES.length - 1;

// The garden terrace's plots, how many at each stage.
export const PLOTS_AT = [0, 2, 3, 4, 5, 6];

// What grows in a plot: the herbs, fruit and fibre you gather (not ore, logs, gems, honey or kelp).
// Plant one and it grows into GROW_YIELD (the night-only rares into NIGHT_YIELD) in GROW_SECS,
// real time, so it grows while you're away too; ripe, it waits for you for ever. Planting needs
// the Gathering level of the plant's tier (data/gathering.js TIER_LV), like picking it wild.
export const PLANTABLE = [
  'clover', 'cherry', 'wild_strawberry', 'prickle_pear', 'cotton', 'moonpetal',
  'chanterelle', 'whisperberry', 'temple_mint', 'silkmoss', 'duskcap',
  'shrine_plum', 'moon_thyme', 'crystal_truffle', 'steam_ginger', 'lotus_fiber', 'foxfire_lily',
  'snow_peach', 'cloudberry', 'star_anise', 'cloud_cotton', 'starbloom',
];
export const NIGHT_PLANTS = ['moonpetal', 'duskcap', 'foxfire_lily', 'starbloom'];
export const GROW_SECS = 24 * 60;
export const GROW_YIELD = 3;
export const NIGHT_YIELD = 2;
// Rain on the island waters what's growing: a plot that's been rained on ripens in this much of
// the time (world/home.js homeTick).
export const RAIN_GROW = 0.75;

// The island's own crops (2026-11-21): seeds only Shelly has (her shop), that grow only in your
// plots, each opening with a stage and cooking into the best dish of its tier (data/cooking.js).
// { id (the crop), name, price (a shop pays), color, desc, tier (its dish's tier, the Gathering
//   level to plant it), stage (the island stage its seed needs), seed: { id, name, price } }.
export const ISLAND_CROPS = [
  { id: 'sea_melon', name: 'Sea Melon', price: 30, color: '#8fd8a8', tier: 1, stage: 1, desc: 'A striped melon that only grows on your island, sweet and salty at once. Churned into sorbet at a stove.', seed: { id: 'seed_seamelon', name: 'Sea Melon Seeds', price: 150 } },
  { id: 'sun_pineapple', name: 'Sun Pineapple', price: 70, color: '#ffd05a', tier: 2, stage: 3, desc: 'A golden pineapple ripened on the rocky rise\'s sun. Glazed onto skewers at a stove.', seed: { id: 'seed_sunpine', name: 'Sun Pineapple Crown', price: 400 } },
  { id: 'lantern_gourd', name: 'Lantern Gourd', price: 140, color: '#ffa86b', tier: 3, stage: 5, desc: 'A round gourd that glows softly from inside, like the lighthouse. Simmered into a hotpot at a stove.', seed: { id: 'seed_lantern', name: 'Lantern Gourd Seeds', price: 900 } },
];
export const CROP_BY_SEED = Object.fromEntries(ISLAND_CROPS.map((c) => [c.seed.id, c]));

// The farm on the beach's east end (2026-11-21, the player's "like Harvest Moon"): three buildings
// Shelly builds, each with its animals (the island look the player picked: tropical-crested hens,
// seafoam sheep in flower leis, strawberry-milk cows). They wander their yard, graze, and go to bed
// at night; nobody needs feeding or tending (the 2026-10-31 rule: no hungry-pet chores). Each makes
// its goods on its own, `count` every FARM_SECS, up to FARM_CAP batches waiting; Up at the building
// collects them (and whoever lives with you collects them into the trunk while you're away).
// { id, name, animal, count, good, about, needs, gold, stage, x (its building), yard: [x1, x2] }.
export const FARM_SECS = 24 * 60;
export const FARM_CAP = 3;
export const FARM = [
  { id: 'coop', name: 'Chicken Coop', animal: 'hen', count: 3, good: 'sunny_egg', about: 'Three tropical hens and their coop on stilts. They lay Sunny Eggs on their own.', needs: { oak_log: 15, cotton: 8 }, gold: 5000, stage: 1, x: 1540, yard: [1494, 1600] },
  { id: 'pen', name: 'Sheep Pen', animal: 'sheep', count: 2, good: 'seafoam_wool', about: 'Two seafoam sheep in a fenced pen with a shelter. Their wool grows on its own.', needs: { maple_log: 14, cotton: 12 }, gold: 9000, stage: 2, x: 1690, yard: [1626, 1756] },
  { id: 'barn', name: 'Cow Barn', animal: 'cow', count: 2, good: 'strawberry_milk', about: 'Two strawberry-milk cows and their little barn. They give Strawberry Milk on their own.', needs: { maple_log: 20, iron_ore: 8, cotton: 10 }, gold: 15000, stage: 3, x: 1840, yard: [1770, 1900] },
];
export const FARM_BY_ID = Object.fromEntries(FARM.map((f) => [f.id, f]));
// The farm's goods: eggs and milk for cooking, wool for the island furniture set (data/furniture.js).
export const FARM_GOODS = [
  { id: 'sunny_egg', name: 'Sunny Egg', price: 25, color: '#ffe07a', tier: 1, desc: 'A warm golden egg from your island\'s hens. Baked into tarts at a stove.' },
  { id: 'strawberry_milk', name: 'Strawberry Milk', price: 45, color: '#ffc8d8', tier: 2, desc: 'Pink, sweet milk from your island\'s cows (yes, it comes out like that). Set into pudding at a stove.' },
  { id: 'seafoam_wool', name: 'Seafoam Wool', price: 40, color: '#c8f0e8', tier: 2, desc: 'Soft sea-green wool from your island\'s sheep. Used in crafting at a town craft bench: the Island Keepsakes set.' },
];
// (The tier each of the island's own things cooks at: data/cooking.js.)
export const CROP_TIER = Object.fromEntries([...ISLAND_CROPS, ...FARM_GOODS].map((c) => [c.id, c.tier]));

// Sleeping at home (log off inside your hut): rested EXP like a night at the Gilded Kettle
// (world/inn.js), at half its rate, so a room at the inn is still the better night; with the
// bedroom built, three quarters of it.
export const HOME_REST = 0.5;
export const HOME_REST_BEDROOM = 0.75;

// The hut's rooms (2026-11-21: each built by Shelly for its own price, no longer free with the
// stages). The side rooms open off the main room to the right in the order you build them; the
// loft goes over the main room. `stage`: the island stage it needs first. `w`: its width.
export const HOME_ROOMS = [
  { id: 'kitchen', name: 'Kitchen Nook', about: 'The stove moves into a kitchen of its own: tiles, a counter, a window over the sea.', needs: { oak_log: 12, copper_ore: 8 }, gold: 4000, stage: 1, w: 260 },
  { id: 'loft', name: 'The Loft', about: 'A gallery over the main room, up a ladder: more room to decorate.', needs: { maple_log: 12, cotton: 10 }, gold: 6000, stage: 2 },
  { id: 'sunroom', name: 'Sunroom', about: 'Tall arched windows onto the sea and a bright floor for your best pieces.', needs: { maple_log: 16, silkmoss: 10, iron_ore: 6 }, gold: 12000, stage: 3, w: 280 },
  { id: 'bedroom', name: 'Bedroom', about: 'A proper bedroom: log off in your hut and you rest at three quarters of the inn\'s rate.', needs: { cedar_log: 12, lotus_fiber: 10, cotton: 12 }, gold: 25000, stage: 3, w: 260 },
  { id: 'aquarium', name: 'Aquarium Room', about: 'Tanks along the walls, with your biggest catch of each fish swimming in them.', needs: { iron_ore: 12, shell: 20, silver_ore: 6 }, gold: 30000, stage: 4, w: 300 },
  { id: 'observatory', name: 'Observatory', about: 'A telescope under a skylight: it tells you which night-only fish and flowers you still haven\'t found.', needs: { silver_ore: 12, cedar_log: 10, sapphire: 2 }, gold: 40000, stage: 5, w: 260 },
];
export const ROOM_BY_ID = Object.fromEntries(HOME_ROOMS.map((r) => [r.id, r]));

// The island's own fish (data/fishing.js pools): the sea off the beach's far end, the pond under
// the falls, and the grotto's glowing pool behind them (where the island's legend lives). The
// pond's rain fish only bite while it rains on the island.
export const HOME_SEA_POOL = { fish_goby: 6, fish_clown: 3, fish_sardine: 3, fish_seapony: 1, fish_shellwrasse: 3 };
export const HOME_POND_POOL = { fish_minnow: 5, fish_carp: 4, fish_perch: 2, fish_koi: 0.6, fish_fallsdace: 3, fish_rainbow: 3 };
export const HOME_GROTTO_POOL = { fish_fallsdace: 4, fish_koi: 1.2, fish_glowloach: 3, fish_lampkoi: 0.15 };
