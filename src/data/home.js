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
// The hut grows inside too: a kitchen nook (2), a loft (3) and a sunroom (4).
// The island never replaces the hunting maps: its spots are small and refill like any other's.
// Nothing withers while you're away and there's nothing to pay upkeep on.

export const HOME_STAGES = [
  null,
  { name: 'Shell Beach', about: 'Your dock, the beach, your hut, Shelly\'s workshop and two garden plots.', needs: {}, gold: 0 },
  { name: 'Tide Pond', about: 'The spring opens: a waterfall, a pond to fish, a kitchen in the hut, and a third plot.', needs: { oak_log: 10, cotton: 6, shell: 6 }, gold: 3000 },
  { name: 'The Rocky Rise', about: 'A ladder up to the rise: ore, herbs and a fruit tree. A loft in the hut, and a fourth plot.', needs: { copper_ore: 12, maple_log: 8, clover: 10 }, gold: 8000 },
  { name: 'Coral Islet', about: 'A rope bridge out to the sea stack, cherries and cotton. A sunroom, and a fifth plot.', needs: { maple_log: 20, iron_ore: 10, silkmoss: 8, hollow_acorn: 6 }, gold: 20000 },
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

// Sleeping at home (log off inside your hut): rested EXP like a night at the Gilded Kettle
// (world/inn.js), at half its rate, so a room at the inn is still the better night.
export const HOME_REST = 0.5;

// The island's own fish (data/fishing.js pools): the sea off the beach's far end, the pond under
// the falls, and the grotto's glowing pool behind them (where the island's legend lives).
export const HOME_SEA_POOL = { fish_goby: 6, fish_clown: 3, fish_sardine: 3, fish_seapony: 1, fish_shellwrasse: 3 };
export const HOME_POND_POOL = { fish_minnow: 5, fish_carp: 4, fish_perch: 2, fish_koi: 0.6, fish_fallsdace: 3 };
export const HOME_GROTTO_POOL = { fish_fallsdace: 4, fish_koi: 1.2, fish_glowloach: 3, fish_lampkoi: 0.15 };
