// The capsule machines (gacha): one in each town, each with its own themed set of looks you can't
// get anywhere else (never sold in the Cash Shop). A pull costs a Gacha Ticket, earned by playing;
// every look is cosmetic only. Each machine's lineup builds one living set: the pieces move and
// glow (render/gacha.js draws their effects), and wearing the whole set adds its own bonus effect.
// Rarity: 'common', 'rare', or 'star' (the machine's prize). Each entry is drawn by
// src/render/jobgear/gacha.js, which looks entries up by key (keep the order: an entry's index is
// its design number). Same fields as outfits-fun.js, plus `machine`, `rarity` and `fx` (its effect).

export const GACHA_MACHINES = {
  sprout: { name: 'Sprout Village Capsules', town: 'sprout', set: 'Spring Spirit', theme: 'The spirit of spring: blossoms, dew and fireflies', colors: ['#7fd17a', '#ffd23f', '#ff9ec0'] },
  crag: { name: 'Ember Crag Capsules', town: 'crag', set: 'Forge God', theme: 'The god of the forge: obsidian and gold, lava in the veins, a hammer that floats', colors: ['#2a2232', '#ffcf4a', '#ff5a1a'] },
  coinbridge: { name: 'Coinbridge Capsules', town: 'coinbridge', set: 'Wandering Peddler', theme: 'The legendary peddler of the far roads: a whole market on your back, and wonders in it', colors: ['#6a5a3a', '#ffcf4a', '#c8502a'] },
  grove: { name: 'Moonleaf Grove Capsules', town: 'grove', set: 'Moon Moth Empress', theme: 'The empress of the night moths: wings of moonlight, silver silk, a full moon at her back', colors: ['#2a2c6a', '#7ae8ff', '#e8f0ff'] },
  harbor: { name: 'Pastel Harbor Capsules', town: 'harbor', set: 'Lighthouse Keeper', theme: 'Keeping the light on a stormy night: a beam, an oilskin, a lantern and a gull', colors: ['#e8484a', '#ffd23f', '#2e4a7a'] },
};

export const GACHA_LOOKS = [
  // Sprout Village: the Spring Spirit set.
  { key: 'bloomcrown', name: 'Bloom Crown', slot: 'hat', machine: 'sprout', rarity: 'rare', color: '#7fd17a', colors: false, fx: 'pollen' },
  { key: 'petaldress', name: 'Petal Dress', slot: 'top', machine: 'sprout', rarity: 'rare', color: '#ffb7d3', covers: ['bottom'], fx: 'petals' },
  { key: 'vinebracers', name: 'Vine Bracers', slot: 'gloves', machine: 'sprout', rarity: 'common', color: '#7fd17a', colors: false },
  { key: 'rootsandals', name: 'Root Sandals', slot: 'shoes', machine: 'sprout', rarity: 'common', color: '#7fd17a', colors: false, fx: 'blooms' },
  { key: 'dewsparkle', name: 'Dew Sparkle', slot: 'face', machine: 'sprout', rarity: 'common', color: '#a8e8ff', colors: false, fx: 'glints' },
  { key: 'dewwings', name: 'Dewdrop Wings', slot: 'cape', machine: 'sprout', rarity: 'star', color: '#c8f6e0', colors: false, fx: 'fireflies' },
  // Pastel Harbor: the Lighthouse Keeper set.
  { key: 'lighthousecap', name: 'Lighthouse Cap', slot: 'hat', machine: 'harbor', rarity: 'star', color: '#e8484a', colors: false, fx: 'beam' },
  { key: 'oilskin', name: 'Oilskin Raincoat', slot: 'top', machine: 'harbor', rarity: 'rare', color: '#ffd23f', covers: ['bottom'], fx: 'drips' },
  { key: 'knitmitts', name: 'Fisher Knit Mitts', slot: 'gloves', machine: 'harbor', rarity: 'common', color: '#2e4a7a', colors: false },
  { key: 'puddleboots', name: 'Puddle Boots', slot: 'shoes', machine: 'harbor', rarity: 'common', color: '#ffd23f', colors: false, fx: 'puddles' },
  { key: 'bubblepipe', name: 'Bubble Pipe', slot: 'face', machine: 'harbor', rarity: 'common', color: '#a86a3a', colors: false, fx: 'pipe' },
  { key: 'stormlantern', name: "Keeper's Lantern", slot: 'cape', machine: 'harbor', rarity: 'rare', color: '#2e4a7a', colors: false, fx: 'lantern' },
  // Ember Crag: the Forge God set.
  { key: 'moltencrown', name: 'Molten Crown', slot: 'hat', machine: 'crag', rarity: 'rare', color: '#ffcf4a', colors: false, fx: 'crown' },
  { key: 'forgeplate', name: 'Obsidian Forgeplate', slot: 'top', machine: 'crag', rarity: 'rare', color: '#2a2232', covers: ['bottom'], fx: 'veins' },
  { key: 'magmagauntlets', name: 'Magma Gauntlets', slot: 'gloves', machine: 'crag', rarity: 'common', color: '#2a2232', colors: false, fx: 'magma' },
  { key: 'obsidiangreaves', name: 'Obsidian Greaves', slot: 'shoes', machine: 'crag', rarity: 'common', color: '#2a2232', colors: false, fx: 'cinders' },
  { key: 'runemarks', name: 'Forge Runes', slot: 'face', machine: 'crag', rarity: 'common', color: '#ffcf4a', colors: false, fx: 'runes' },
  { key: 'godhammer', name: 'Godforge Hammer', slot: 'cape', machine: 'crag', rarity: 'star', color: '#6a1420', colors: false, fx: 'hammer' },
  // Coinbridge: the Wandering Peddler set.
  { key: 'trinkethat', name: "Wayfarer's Compass Clip", slot: 'hat', machine: 'coinbridge', rarity: 'rare', color: '#d8a440', colors: false, fx: 'charms' },
  { key: 'merchantcoat', name: "Wanderer's Cloak", slot: 'top', machine: 'coinbridge', rarity: 'rare', color: '#6a5a3a', covers: ['bottom'], fx: 'purse' },
  { key: 'coingloves', name: 'Road Gloves', slot: 'gloves', machine: 'coinbridge', rarity: 'common', color: '#8a5a3a', colors: false, fx: 'coinwalk' },
  { key: 'wayfarerboots', name: 'Road-Worn Boots', slot: 'shoes', machine: 'coinbridge', rarity: 'common', color: '#5a3a2a', colors: false, fx: 'dust' },
  { key: 'appraisermonocle', name: "Appraiser's Round Glasses", slot: 'face', machine: 'coinbridge', rarity: 'common', color: '#ffcf4a', colors: false, fx: 'appraise' },
  { key: 'marketpack', name: 'The Wandering Market', slot: 'cape', machine: 'coinbridge', rarity: 'star', color: '#8a5a3a', colors: false, fx: 'market' },
  // Moonleaf Grove: the Moon Moth Empress set.
  { key: 'mothtiara', name: 'Moth Antenna Tiara', slot: 'hat', machine: 'grove', rarity: 'rare', color: '#e0e4f0', colors: false, fx: 'antennae' },
  { key: 'mothsilkgown', name: 'Moth-Silk Tailcoat', slot: 'top', machine: 'grove', rarity: 'rare', color: '#2a2c6a', covers: ['bottom'], fx: 'mothdust', fx2: 'furmane' },
  { key: 'moonsilkgloves', name: 'Moonsilk Gloves', slot: 'gloves', machine: 'grove', rarity: 'common', color: '#2a2c6a', colors: false, fx: 'moonglow' },
  { key: 'moonstepslippers', name: 'Moonstep Slippers', slot: 'shoes', machine: 'grove', rarity: 'common', color: '#e8e4f8', colors: false, fx: 'moonsteps' },
  { key: 'moondustblush', name: 'Moon-Dust Blush', slot: 'face', machine: 'grove', rarity: 'common', color: '#e8e4f8', colors: false, fx: 'moondust' },
  { key: 'moonmothwings', name: 'Moon Moth Wings', slot: 'cape', machine: 'grove', rarity: 'star', color: '#2a2c6a', colors: false, fx: 'mothwings' },
];

// The rest of each machine's capsules (the fodder): cosmetic skins (data/cosmetics.js), each once,
// and a bundle of the region's materials, which can come up any number of times, so a ticket always
// brings something, even once the set is complete. `rarity` as above.
export const GACHA_PRIZES = {
  sprout: [
    { kind: 'bubble', key: 'blossom', rarity: 'common' },
    { kind: 'tag', key: 'sproutvine', rarity: 'common' },
    { kind: 'dmg', key: 'petalpop', rarity: 'rare' },
    { kind: 'bundle', key: 'springbundle', name: 'Spring Bundle', rarity: 'common', items: [['clover', 3], ['sprout_leaf', 4], ['honeycomb', 2], ['moonpetal', 1]] },
  ],
  crag: [
    { kind: 'bubble', key: 'molten', rarity: 'common' },
    { kind: 'tag', key: 'forgerune', rarity: 'common' },
    { kind: 'dmg', key: 'hammerfall', rarity: 'rare' },
    { kind: 'bundle', key: 'forgebundle', name: 'Forge Bundle', rarity: 'common', items: [['iron_ore', 4], ['copper_ore', 4], ['meteorite', 1]] },
  ],
  coinbridge: [
    { kind: 'bubble', key: 'pricetag', rarity: 'common' },
    { kind: 'tag', key: 'shopsign', rarity: 'common' },
    { kind: 'dmg', key: 'coinburst', rarity: 'rare' },
    { kind: 'bundle', key: 'peddlerbundle', name: "Peddler's Bundle", rarity: 'common', items: [['rose_quartz', 1], ['sea_glass', 2], ['silkmoss', 3], ['honeycomb', 2]] },
  ],
  grove: [
    { kind: 'bubble', key: 'moonlit', rarity: 'common' },
    { kind: 'tag', key: 'mothwing', rarity: 'common' },
    { kind: 'dmg', key: 'moondust', rarity: 'rare' },
    { kind: 'bundle', key: 'moonbundle', name: 'Moonlit Bundle', rarity: 'common', items: [['silver_ore', 3], ['wisp_flame', 2], ['stardust', 1]] },
  ],
  harbor: [
    { kind: 'bubble', key: 'logbook', rarity: 'common' },
    { kind: 'tag', key: 'anchor', rarity: 'common' },
    { kind: 'dmg', key: 'beam', rarity: 'rare' },
    { kind: 'bundle', key: 'tidebundle', name: 'Tide Bundle', rarity: 'common', items: [['sea_kelp', 4], ['sea_glass', 2], ['barnacle_shell', 1]] },
  ],
};

// The capsule album (ui/album.js): a page for each machine, every look and skin in its slot. Fill
// a page and it's sealed with this, a skin that only the album gives.
export const GACHA_ALBUM = { sprout: { kind: 'tag', key: 'springseal' }, crag: { kind: 'tag', key: 'godseal' }, coinbridge: { kind: 'tag', key: 'ledgerseal' }, grove: { kind: 'tag', key: 'fullmoonseal' }, harbor: { kind: 'tag', key: 'beaconseal' } };

// Wearing every piece of a machine's set.
export const GACHA_SETS = {
  sprout: { name: 'Spring Spirit', fx: 'springglow', bonus: 'a spring bloom, a butterfly, and light at your feet' },
  crag: { name: 'Forge God', fx: 'forgegod', bonus: 'a molten rune circle at your feet, a storm of embers, and the hammer white-hot' },
  coinbridge: { name: 'Wandering Peddler', fx: 'peddlerglow', bonus: 'a coin hops out with every step, and standing still your wares light up and the sign comes out' },
  grove: { name: 'Moon Moth Empress', fx: 'mothmoon', bonus: 'a full moon rising at your back, moths of light circling it, and the wings shining' },
  harbor: { name: 'Lighthouse Keeper', fx: 'keeperglow', bonus: 'sea fog rolling round your feet and a stronger, longer beam' },
};
