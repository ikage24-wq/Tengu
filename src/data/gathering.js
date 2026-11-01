// Gathering and mining (world/gathering.js): every map has spots that fit it, worth visiting
// alongside hunting. Stand at one and press Up: the hero gathers (or mines) for a moment and
// comes away with its finds, and the spot rests a while before it's ready again.
//
// KINDS: how each kind of spot works: the hero's move, how long it takes, the hint over it.
// NODES: per map, the spots: { x, y (the floor you stand on), kind, pool (item id -> weight),
// rare (an item and its chance, rolled on top), night (only there at night, world/daytime.js) }.
// What the finds are for: cooking (data/cooking.js), polishing at Tora's (ore makes a try likelier
// to take, core/items.js), and selling.

export const KINDS = {
  herb: { verb: 'Gather', move: 'gather', secs: 1.1, rest: 75, count: [1, 2] },
  honey: { verb: 'Gather', move: 'gather', secs: 1.3, rest: 90, count: [1, 1] },
  fruit: { verb: 'Pick', move: 'pluck', secs: 1.1, rest: 90, count: [1, 2] },
  ore: { verb: 'Mine', move: 'mine', secs: 1.5, rest: 100, count: [1, 2] },
};

export const NODE_REACH = 22;

// The finds themselves: [id, name, price, color, what it's for].
export const GATHERED = [
  ['clover', 'Lucky Clover', 8, '#7fd07a', 'A four-leaf clover. Brewed into Clover Tea at a town stove; shops buy it.'],
  ['honeycomb', 'Honeycomb', 14, '#ffc83a', 'Golden comb from the giant hive. Sweetens tea and tarts at a town stove; shops buy it.'],
  ['cherry', 'Blossom Cherry', 12, '#ff6b8a', 'A plump cherry off the great tree. Baked into tarts at a town stove; shops buy it.'],
  ['copper_ore', 'Copper Ore', 10, '#e0915a', "Bring it to Tora's forge: ore makes a polish more likely to take (gear up to Lv 29)."],
  ['silver_ore', 'Silver Ore', 22, '#c8d0e0', "Bring it to Tora's forge: ore makes a polish more likely to take (gear Lv 30 to 49)."],
  ['moonpetal', 'Moonpetal', 40, '#c9c4ff', 'A flower that only opens at night, glowing softly. Steeped into Moonpetal Tea at a town stove; shops buy it.'],
  ['rose_quartz', 'Rose Quartz', 80, '#ffb3d1', "A rare pink crystal. At Tora's forge it makes a polish much more likely to take."],
];

export const NODES = {
  // Petal Meadow: clover in the fields, ore in the hill, honey at the hive, cherries off the tree.
  meadow1: [
    { x: 470, y: 1000, kind: 'herb', pool: { clover: 1 } },
    { x: 1700, y: 920, kind: 'herb', pool: { clover: 1 } },
    { x: 860, y: 976, kind: 'ore', pool: { copper_ore: 1 }, rare: ['rose_quartz', 0.08] },
    { x: 1260, y: 680, kind: 'honey', pool: { honeycomb: 1 } },
    { x: 1120, y: 440, kind: 'fruit', pool: { cherry: 1 } },
    { x: 1290, y: 440, kind: 'fruit', pool: { cherry: 1 } },
    // Up in the clouds, a moonpetal opens at night.
    { x: 620, y: 280, kind: 'herb', pool: { moonpetal: 1 }, night: true, look: 'moonpetal' },
  ],
  // Windy Canyon: copper in the riverbed and on the ledges, clover on the floor, a moonpetal on the
  // lookout at night.
  canyon: [
    { x: 1000, y: 1060, kind: 'ore', pool: { copper_ore: 1 }, rare: ['rose_quartz', 0.1] },
    { x: 1000, y: 740, kind: 'ore', pool: { copper_ore: 1 }, rare: ['rose_quartz', 0.1] },
    { x: 1850, y: 980, kind: 'herb', pool: { clover: 1 } },
    { x: 1150, y: 260, kind: 'herb', pool: { moonpetal: 1 }, night: true, look: 'moonpetal' },
  ],
  // Clover Hills: clover in the rows, copper in the hill, honey from the barnyard hive, a
  // moonpetal on the lookout at night.
  meadow2: [
    { x: 1000, y: 800, kind: 'herb', pool: { clover: 1 } },
    { x: 2100, y: 880, kind: 'herb', pool: { clover: 1 } },
    { x: 1150, y: 930, kind: 'ore', pool: { copper_ore: 1 }, rare: ['rose_quartz', 0.08] },
    { x: 300, y: 720, kind: 'honey', pool: { honeycomb: 1 } },
    { x: 1300, y: 320, kind: 'herb', pool: { moonpetal: 1 }, night: true, look: 'moonpetal' },
  ],
};
