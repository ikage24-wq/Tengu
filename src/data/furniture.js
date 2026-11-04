// Furniture for your island and your hut (docs/design/home-island.md; research home-mounts.md).
// Just for looks: no stat, no bonus (the player's choice). Crafted at any bench (the Home tab)
// from what you gather, mine, fish and hunt. Placed and moved in Decorate mode (ui/decorate.js,
// world/decor.js), drawn by render/furniture.js.
//
//   layer   where it goes, in side view (research: MapleStory M, Terraria, FFXIV):
//     floor    stands on the ground or a ledge
//     rug      lies flat on the ground, under everything else
//     surface  sits on top of a table, a shelf, or the hut's wall shelves
//     wall     hangs on the hut's back wall (inside only)
//     hang     hangs from the hut's ceiling beam or under a ledge
//   w, h    its size in world px (the hero is 46 tall); `top` for tables and shelves: how high
//           above its base things can sit on it
//   where   'in' (the hut only), 'out' (the island only) or 'any'
//   level   the Crafting level its recipe needs; `stage` the island stage it opens at
//   show    what a trophy shows (render/furniture.js reads it from your character): your biggest
//           catch, a Hard crown, your mount, your best dungeon grade, your derby ribbon

export const FURN_SETS = {
  sea: { name: 'Seaside Cottage', color: '#5fb8d8' },
  bake: { name: 'Sweet Bakery', color: '#ff9ec0' },
  star: { name: 'Starry Night', color: '#8f7fe0' },
  trophy: { name: 'Trophies and Catches', color: '#e0a52f' },
};

const F = (id, name, set, layer, w, h, needs, o = {}) => ({ id, name, set, layer, w, h, needs, where: 'any', level: 1, stage: 1, ...o });

export const FURNITURE = [
  // ----- Seaside Cottage: driftwood, rope, shells and sea-blue -----
  F('sea_table', 'Driftwood Table', 'sea', 'floor', 44, 24, { oak_log: 4, shell: 2 }, { top: 22, desc: 'Sea-smoothed boards on stout legs. Put things on top of it.' }),
  F('sea_chair', 'Driftwood Chair', 'sea', 'floor', 20, 28, { oak_log: 2, cotton: 1 }, { desc: 'A little chair with a striped cushion.' }),
  F('sea_bed', 'Wave Quilt Bed', 'sea', 'floor', 64, 30, { cotton: 6, oak_log: 4 }, { where: 'in', level: 4, desc: 'A low bed under a quilt stitched with waves. The pillow is fluffed every morning.' }),
  F('sea_lamp', 'Shell Lamp', 'sea', 'surface', 12, 18, { shell: 3, copper_ore: 1 }, { level: 3, desc: 'A scallop shell that glows warm at night.' }),
  F('sea_hammock', 'Rope Hammock', 'sea', 'floor', 70, 34, { cotton: 5, oak_log: 2 }, { where: 'out', level: 5, desc: 'Strung between two posts. It sways in the sea breeze.' }),
  F('sea_net', 'Fishing Net', 'sea', 'wall', 40, 30, { cotton: 3, shell: 2 }, { where: 'in', level: 2, desc: 'An old net hung on the wall with cork floats and a starfish caught in it.' }),
  // ----- Sweet Bakery: cream, strawberry pink, icing and sprinkles -----
  F('bake_table', 'Cake Stand Table', 'bake', 'floor', 40, 26, { maple_log: 3, honeycomb: 2 }, { top: 24, level: 12, stage: 2, desc: 'A round table iced like a cake. Things sit on top of it.' }),
  F('bake_stool', 'Macaron Stool', 'bake', 'floor', 16, 18, { cotton: 2, cherry: 1 }, { level: 12, stage: 2, desc: 'A stool you could almost eat.' }),
  F('bake_lamp', 'Cupcake Lamp', 'bake', 'surface', 12, 20, { copper_ore: 1, cherry: 2 }, { level: 13, stage: 2, desc: 'A cupcake with a glowing cherry on top.' }),
  F('bake_rug', 'Strawberry Rug', 'bake', 'rug', 70, 6, { cotton: 4, cherry: 2 }, { where: 'in', level: 12, stage: 2, desc: 'A round rug with seeds stitched on.' }),
  F('bake_shelf', 'Bakery Shelf', 'bake', 'wall', 50, 30, { maple_log: 3 }, { where: 'in', top: 4, level: 14, stage: 2, desc: 'A scalloped wall shelf, lined with doilies. Things sit on it.' }),
  F('bake_cake', 'Cake Under Glass', 'bake', 'surface', 18, 22, { cherry: 3, honeycomb: 2 }, { level: 15, stage: 2, desc: 'A three-tier cake under a glass dome. Nobody is allowed to eat it.' }),
  // ----- Starry Night: midnight blue, gold stars and silver moons -----
  F('star_bed', 'Crescent Moon Bed', 'star', 'floor', 66, 34, { silkmoss: 6, maple_log: 4 }, { where: 'in', level: 16, stage: 3, desc: 'A bed curled in a sleeping crescent moon.' }),
  F('star_lights', 'Star String Lights', 'star', 'hang', 90, 16, { copper_ore: 2, silkmoss: 2 }, { level: 14, stage: 3, desc: 'Little stars on a string. They twinkle, and glow at night.' }),
  F('star_scope', 'Brass Telescope', 'star', 'floor', 30, 40, { copper_ore: 3, iron_ore: 2 }, { level: 18, stage: 3, desc: 'A little telescope on a tripod. It turns slowly to follow the stars.' }),
  F('star_globe', 'Planet Globe', 'star', 'surface', 16, 20, { iron_ore: 2, amethyst: 1 }, { level: 17, stage: 3, desc: 'A ringed planet that spins on its stand.' }),
  F('star_lamp', 'Moon Floor Lamp', 'star', 'floor', 18, 44, { iron_ore: 2, silkmoss: 1 }, { level: 16, stage: 3, desc: 'A tall lamp with a crescent moon for a shade.' }),
  F('star_clock', 'Star Clock', 'star', 'wall', 26, 26, { iron_ore: 2, maple_log: 1 }, { where: 'in', level: 18, stage: 3, desc: "A clock with a star for every hour. It keeps the island's own time." }),
  // ----- Trophies and Catches: they show what you've really done -----
  F('trophy_plaque', 'Record Catch Plaque', 'trophy', 'wall', 40, 22, { oak_log: 2, shell: 1 }, { where: 'in', level: 2, show: 'fish', desc: 'Shows the biggest fish you have ever caught, with its size.' }),
  F('trophy_figure', 'Mount Figurine', 'trophy', 'surface', 18, 18, { oak_log: 1, cotton: 1 }, { level: 2, show: 'mount', desc: 'A little carved figure of the mount you ride.' }),
  F('trophy_cup', 'Dungeon Cup', 'trophy', 'surface', 16, 22, { copper_ore: 2, silver_ore: 1 }, { level: 24, stage: 3, show: 'grade', desc: 'Engraved with the best grade you have ever earned in a dungeon.' }),
  F('trophy_crown', 'Crown Cushion', 'trophy', 'surface', 18, 18, { hollow_acorn: 3, cotton: 2 }, { level: 14, stage: 4, show: 'crown', desc: 'A velvet cushion for a crown. A Hard dungeon clear puts one on it.' }),
  F('trophy_ribbon', 'Derby Ribbon', 'trophy', 'wall', 18, 28, { cotton: 2 }, { where: 'in', level: 3, show: 'derby', desc: 'A rosette that shows how many Fishing Derbies you have won.' }),
];
export const FURNITURE_BY_ID = Object.fromEntries(FURNITURE.map((f) => [f.id, f]));
export const LAYERS = ['rug', 'wall', 'hang', 'floor', 'surface'];
// How many pieces each map holds.
export const PLACED_MAX = 60;
// The placement grid (px); hold Shift for free placement.
export const GRID = 4;
