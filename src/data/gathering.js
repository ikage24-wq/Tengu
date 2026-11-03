// Gathering and mining (world/gathering.js): every map has spots that fit it, worth visiting
// alongside hunting. Stand at one and press Up: the hero gathers (or mines, or chops) for a moment
// and comes away with its finds, and the spot rests a while before it's ready again.
//
// KINDS: how each kind of spot works: the hero's move, how long it takes, the hint over it.
// NODES: per map, the spots: { x, y (the floor you stand on), kind, tier (the region's tier, 1-4),
// lv (the Gathering or Mining level it needs, TIER_LV of its tier), pool (item id -> weight), rare
// (an item and its chance, rolled on top: on ore, the region's gem), night (only there at night,
// world/daytime.js) }. Maps laid out with data/climb.js list their spots per zone instead (`nodes`
// on each zone, made with SPOT below) and climb()/lay() place them on that zone's floors.
// What the finds are for: cooking (data/cooking.js), crafting at a town craft bench (ore, gems,
// wood and fibre: docs/design/life-skills.md), polishing at Tora's (each region's ore
// and gem make a try likelier to take, core/items.js), and selling.

export const KINDS = {
  herb: { verb: 'Gather', move: 'gather', secs: 1.1, rest: 75, count: [1, 2] },
  honey: { verb: 'Gather', move: 'gather', secs: 1.3, rest: 90, count: [1, 1] },
  fruit: { verb: 'Pick', move: 'pluck', secs: 1.1, rest: 90, count: [1, 2] },
  ore: { verb: 'Mine', move: 'mine', secs: 1.5, rest: 100, count: [1, 2] },
  // A tree to chop: logs for the craft bench.
  wood: { verb: 'Chop', move: 'chop', secs: 1.6, rest: 100, count: [1, 2] },
  // Fibre plants (cotton bolls, silk moss, lotus stems, cloud cotton): thread for the craft bench.
  fiber: { verb: 'Gather', move: 'pluck', secs: 1.2, rest: 80, count: [1, 2] },
};

export const NODE_REACH = 22;

// The skill level each tier's spots need (the same as core/life.js TIER_LEVEL; kept here so data
// files need no core imports, tests/lifespots.test.js checks they match).
export const TIER_LV = [0, 1, 12, 24, 36];

// The regions (docs/design/life-skills.md): each map's tier. Towns take the tier of the fields
// round them.
export const MAP_TIER = {
  meadow1: 1, meadow2: 1, trainfield: 1, canyon: 1, dawnbeach: 1,
  woods: 2, glade: 2, hollow_gate: 2, ruins: 2,
  shrine: 3, ridge: 3, cave: 3, springs: 3,
  peak: 4, sky: 4, starfall: 4, bossroom: 4,
  sprout: 1, harbor: 1, crag: 1, grove: 2,
};

// Each tier's crafting materials and its night-only rare.
export const TIER_FINDS = [
  null,
  { ore: 'copper_ore', gem: 'rose_quartz', wood: 'oak_log', fiber: 'cotton', night: 'moonpetal' },
  { ore: 'iron_ore', gem: 'amethyst', wood: 'maple_log', fiber: 'silkmoss', night: 'duskcap' },
  { ore: 'silver_ore', gem: 'sapphire', wood: 'cedar_log', fiber: 'lotus_fiber', night: 'foxfire_lily' },
  { ore: 'mithril_ore', gem: 'starstone', wood: 'skywood_log', fiber: 'cloud_cotton', night: 'starbloom' },
];
// A gem's chance on each strike of its tier's ore (a spot may ask for more: deeper, rarer veins).
const GEM_CHANCE = [0, 0.08, 0.1, 0.12, 0.14];

// Spot makers, so a map lists what grows where in a word: SPOT.ore(2), SPOT.herb(1, 'clover').
const at = (tier, kind, pool, more = {}) => ({ kind, tier, lv: TIER_LV[tier], pool, ...more });
export const SPOT = {
  ore: (t, { gem = GEM_CHANCE[t], ...more } = {}) => at(t, 'ore', { [TIER_FINDS[t].ore]: 1 }, { rare: [TIER_FINDS[t].gem, gem], ...more }),
  wood: (t, more) => at(t, 'wood', { [TIER_FINDS[t].wood]: 1 }, more),
  fiber: (t, more) => at(t, 'fiber', { [TIER_FINDS[t].fiber]: 1 }, more),
  herb: (t, id, more) => at(t, 'herb', { [id]: 1 }, more),
  fruit: (t, id, more) => at(t, 'fruit', { [id]: 1 }, more),
  honey: (t, more) => at(t, 'honey', { honeycomb: 1 }, more),
  // The region's night-only rare (the moonpetal keeps its own drawing).
  night: (t, more) => at(t, 'herb', { [TIER_FINDS[t].night]: 1 }, { night: true, ...(t === 1 ? { look: 'moonpetal' } : {}), ...more }),
};

const CRAFT = 'Used in crafting at a town craft bench';
// The finds themselves: [id, name, price, color, what it's for, tier].
export const GATHERED = [
  // Tier 1: Petal Meadow, Clover Hills, Windy Canyon, Dawnlight Isle.
  ['clover', 'Lucky Clover', 8, '#7fd07a', 'A four-leaf clover. Brewed into Clover Tea at a town stove; shops buy it.', 1],
  ['honeycomb', 'Honeycomb', 14, '#ffc83a', 'Golden comb from the giant hive. Sweetens tea and tarts at a town stove; shops buy it.', 1],
  ['cherry', 'Blossom Cherry', 12, '#ff6b8a', 'A plump cherry off the great tree. Baked into tarts at a town stove; shops buy it.', 1],
  ['wild_strawberry', 'Wild Strawberry', 12, '#ff5a6e', 'A sweet little berry from the Clover Hills fields. Baked into shortcake at a town stove; shops buy it.', 1],
  ['prickle_pear', 'Prickle Pear', 14, '#ff8fb8', 'A pink cactus fruit off the canyon mesas, cool and juicy inside. Churned into sorbet at a town stove; shops buy it.', 1],
  ['sea_kelp', 'Sea Kelp', 10, '#5aae7a', 'Salty kelp washed up on Dawnlight Beach. Simmered into soup at a town stove; shops buy it.', 1],
  ['moonpetal', 'Moonpetal', 40, '#c9c4ff', 'A flower that only opens at night, glowing softly. Steeped into Moonpetal Tea at a town stove; shops buy it.', 1],
  ['copper_ore', 'Copper Ore', 10, '#e0915a', `${CRAFT} (tier 1). At Tora's forge, ore makes a polish more likely to take (gear up to Lv 19).`, 1],
  ['rose_quartz', 'Rose Quartz', 80, '#ffb3d1', `A rare pink crystal from copper veins. ${CRAFT} (tier 1); at Tora's forge it makes a polish much more likely to take.`, 1],
  ['oak_log', 'Oak Log', 8, '#b8865a', `A sturdy log from the meadow oaks. ${CRAFT} (tier 1).`, 1],
  ['cotton', 'Cotton Boll', 8, '#fff6ea', `A soft white boll from the field cotton. ${CRAFT} (tier 1).`, 1],
  // Tier 2: Mossy Woods, Whispering Glade, Hollow Gate, Twilight Ruins.
  ['chanterelle', 'Moss Chanterelle', 20, '#ffb347', 'A golden mushroom from the mossy forest floor. Stirred into risotto at a town stove; shops buy it.', 2],
  ['whisperberry', 'Whisperberry', 22, '#9f8cff', 'A violet berry that hums in the breeze of the Whispering Glade. Baked into scones at a town stove; shops buy it.', 2],
  ['temple_mint', 'Temple Mint', 18, '#7fe0b0', 'Cool mint growing wild through the old temple stones. Brewed into tea at a town stove; shops buy it.', 2],
  ['duskcap', 'Duskcap', 70, '#7fe6d6', 'A mushroom that glows only after dark. Simmered into Night Soup at a town stove; shops buy it.', 2],
  ['iron_ore', 'Iron Ore', 16, '#9a9aaa', `${CRAFT} (tier 2). At Tora's forge, ore makes a polish more likely to take (gear Lv 20 to 29).`, 2],
  ['amethyst', 'Amethyst', 140, '#b07ae0', `A rare violet gem from iron veins. ${CRAFT} (tier 2). At Tora's forge it makes a polish much more likely to take.`, 2],
  ['maple_log', 'Maple Log', 14, '#d0704a', `A red-grained log from the woodland maples. ${CRAFT} (tier 2).`, 2],
  ['silkmoss', 'Silkmoss', 14, '#a8d88a', `Long silky moss, spun into thread. ${CRAFT} (tier 2).`, 2],
  // Tier 3: Fox Shrine Path, Moonlit Ridge, Crystal Cave, Serpent Springs.
  ['shrine_plum', 'Shrine Plum', 30, '#e05a7a', 'A tart red plum from the trees by the fox shrine. Pressed into onigiri at a town stove; shops buy it.', 3],
  ['moon_thyme', 'Moon Thyme', 28, '#b8c8f0', 'A silvery thyme that grows on the moonlit ridge. Baked into herb bread at a town stove; shops buy it.', 3],
  ['crystal_truffle', 'Crystal Truffle', 34, '#c8e8ff', 'A rare truffle that grows round cave crystals, faintly sparkling. Baked into a gratin at a town stove; shops buy it.', 3],
  ['steam_ginger', 'Steam Ginger', 28, '#ffc88a', 'Warm ginger root from the hot-spring banks. Simmered into broth at a town stove; shops buy it.', 3],
  ['foxfire_lily', 'Foxfire Lily', 110, '#ffa86b', 'A lily lit by a little foxfire flame, only open at night. Steeped into tea at a town stove; shops buy it.', 3],
  ['silver_ore', 'Silver Ore', 22, '#c8d0e0', `${CRAFT} (tier 3). At Tora's forge, ore makes a polish more likely to take (gear Lv 30 to 44).`, 3],
  ['sapphire', 'Sapphire', 220, '#4f7ae0', `A rare deep-blue gem from silver veins. ${CRAFT} (tier 3). At Tora's forge it makes a polish much more likely to take.`, 3],
  ['cedar_log', 'Cedar Log', 22, '#c89a6a', `A fragrant log from the old shrine cedars. ${CRAFT} (tier 3).`, 3],
  ['lotus_fiber', 'Lotus Fibre', 22, '#ffc8dc', `Fine thread drawn from lotus stems by the water. ${CRAFT} (tier 3).`, 3],
  // Tier 4: Frozen Peak, Sky Garden, Starfall Heights, the Crystal Throne.
  ['snow_peach', 'Snow Peach', 44, '#ffd8d0', 'A frosted peach from the hardy trees of the peak, sweet as ice cream. Stewed into compote at a town stove; shops buy it.', 4],
  ['cloudberry', 'Cloudberry', 46, '#ffc06b', 'An amber berry that only ripens above the clouds. Whipped into pavlova at a town stove; shops buy it.', 4],
  ['star_anise', 'Star Anise', 48, '#e0a85a', 'A star-shaped spice pod from Starfall, warm and sweet. Simmered into stew at a town stove; shops buy it.', 4],
  ['starbloom', 'Starbloom', 160, '#fff0a0', 'A flower that holds a fallen star, only open at night. Pressed into nectar at a town stove; shops buy it.', 4],
  ['mithril_ore', 'Mithril Ore', 40, '#a8e0e8', `Light, shining ore from the highest veins. ${CRAFT} (tier 4). At Tora's forge, ore makes a polish more likely to take (gear Lv 45 and up).`, 4],
  ['starstone', 'Starstone', 350, '#ffe9a6', `A rare gem with a star caught inside, from mithril veins. ${CRAFT} (tier 4). At Tora's forge it makes a polish far more likely to take.`, 4],
  ['skywood_log', 'Skywood Log', 34, '#e8d8ff', `A pale log from the trees that grow on clouds, light as a feather. ${CRAFT} (tier 4).`, 4],
  ['cloud_cotton', 'Cloud Cotton', 34, '#f4f8ff', `A puff of cloud you can spin into thread. ${CRAFT} (tier 4).`, 4],
];
export const FIND_TIER = Object.fromEntries(GATHERED.map((g) => [g[0], g[5]]));

export const NODES = {
  // Petal Meadow: clover and cotton in the fields, ore in the hill, an oak and the hive on the
  // banks, cherries off the great tree.
  meadow1: [
    { ...SPOT.herb(1, 'clover'), x: 520, y: 1000 },
    { ...SPOT.herb(1, 'clover'), x: 1700, y: 920 },
    { ...SPOT.ore(1), x: 910, y: 976 },
    { ...SPOT.fiber(1), x: 1150, y: 840 },
    { ...SPOT.wood(1), x: 1880, y: 680 },
    { ...SPOT.honey(1), x: 1260, y: 680 },
    { ...SPOT.fruit(1, 'cherry'), x: 1120, y: 440 },
    { ...SPOT.fruit(1, 'cherry'), x: 1290, y: 440 },
    // Up in the clouds, a moonpetal opens at night.
    { ...SPOT.night(1), x: 550, y: 280 },
  ],
  // The tutorial isle: kelp on the beach ledges, an oak above, copper in the rocks by the shore;
  // cotton and clover at the practice field's edges, an oak by its far gate.
  dawnbeach: [
    { ...SPOT.herb(1, 'sea_kelp'), x: 600, y: 432 },
    { ...SPOT.wood(1), x: 920, y: 360 },
    { ...SPOT.ore(1), x: 1260, y: 480 },
  ],
  trainfield: [
    { ...SPOT.herb(1, 'clover'), x: 170, y: 480 },
    { ...SPOT.fiber(1), x: 420, y: 480 },
    { ...SPOT.wood(1), x: 1410, y: 480 },
  ],
  // The Hollow Gate: a maple by the great tree, silk moss on the mound, chanterelles and (at
  // night) duskcaps on the ledge above.
  hollow_gate: [
    { ...SPOT.wood(2), x: 200, y: 380 },
    { ...SPOT.fiber(2), x: 430, y: 340 },
    { ...SPOT.herb(2, 'chanterelle'), x: 430, y: 260 },
    { ...SPOT.night(2), x: 530, y: 260 },
  ],
  // The Crystal Throne: a mithril vein in each side ledge, out of the fight's way.
  bossroom: [
    { ...SPOT.ore(4, { gem: 0.3 }), x: 180, y: 290 },
    { ...SPOT.ore(4, { gem: 0.3 }), x: 1020, y: 290 },
  ],
  // Towns: a cozy spot or two, never in the way. Sprout's Garden Corner has a flower bed by the
  // duck pond; Ember Crag a copper seam behind the forge; Moonleaf Grove chanterelles on Lantern
  // Lane and duskcaps in the Rune Garden at night.
  sprout: [{ ...SPOT.herb(1, 'clover'), x: 2400, y: 480 }],
  // Pastel Harbor: sea kelp washed up on the shore between the pier and the lighthouse.
  harbor: [{ ...SPOT.herb(1, 'sea_kelp'), x: 1990, y: 480 }],
  crag: [{ ...SPOT.ore(1), x: 1830, y: 480 }],
  grove: [
    { ...SPOT.herb(2, 'chanterelle'), x: 400, y: 480 },
    { ...SPOT.night(2), x: 2080, y: 480 },
  ],
};
