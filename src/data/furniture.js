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
//           catch, a Hard crown, your mount, your best dungeon grade, your derby ribbon, or (`tank`)
//           the `fish` rarest fish you've caught, swimming

export const FURN_SETS = {
  sea: { name: 'Seaside Cottage', color: '#5fb8d8' },
  bake: { name: 'Sweet Bakery', color: '#ff9ec0' },
  star: { name: 'Starry Night', color: '#8f7fe0' },
  trophy: { name: 'Trophies and Catches', color: '#e0a52f' },
  // (Bought from Kinako in the Mochi Market, not made: for your Mochi Garden, 2026-11-15.)
  garden: { name: 'Mochi Garden', color: '#8fd0a0' },
};

const F = (id, name, set, layer, w, h, needs, o = {}) => ({ id, name, set, layer, w, h, needs, where: 'any', level: 1, stage: 1, ...o });
// (A garden piece: bought, not made, and only for the garden.)
const G = (id, name, layer, w, h, price, use, desc) => F(id, name, 'garden', layer, w, h, null, { where: 'garden', price, use, desc });
// (A festival's own pieces: not sold, won at its stall for its tokens - world/garden-festival.js.)
const GF = (festival, tokens, id, name, layer, w, h, use, desc) => F(id, name, 'garden', layer, w, h, null, { where: 'garden', price: null, festival, tokens, use, desc });
export const GARDEN_DECOR = () => FURNITURE.filter((f) => f.where === 'garden');
// (The garden's own pieces, 2026-11-15: there from the start, and yours to move about or put away in
// Decorate - never sold or made, only the ones the garden came with. Drawn by render/garden.js as
// `kind` (with `extra`); `w` is the ground one takes (its middle `ox` off the piece's own) - room for
// the Mochi using it too: the well's crank, the bed's sniffing spot, under a tree - `base` what has
// to be flat under it, `pick` the box you click to pick it up. 'back' pieces (the fences,
// the lantern string) stand behind everything and only mind their own kind.)
const GB = (id, name, kind, layer, w, h, o, desc) => F(id, name, 'garden', layer, w, h, null, { where: 'garden', price: null, builtin: true, kind, desc, ...o });
export const GARDEN_BUILTINS = () => FURNITURE.filter((f) => f.builtin);

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
  // Your catches, swimming: the rarest fish you've landed, each at a size from your record one.
  F('trophy_tank', 'Home Aquarium', 'trophy', 'floor', 64, 50, { oak_log: 4, shell: 3, rose_quartz: 2 }, { level: 6, show: 'tank', fish: 4, desc: 'A glass tank on a wooden stand. Four of the rarest fish you have caught swim in it.' }),
  F('trophy_grandtank', 'Grand Aquarium', 'trophy', 'floor', 112, 66, { maple_log: 6, amethyst: 3, sea_kelp: 4, shell: 4 }, { level: 18, stage: 2, show: 'tank', fish: 8, desc: 'A great tank with a coral garden. Eight of the rarest fish you have caught swim in it.' }),
  F('trophy_ribbon', 'Derby Ribbon', 'trophy', 'wall', 18, 28, { cotton: 2 }, { where: 'in', level: 3, show: 'derby', desc: 'A rosette that shows how many Fishing Derbies you have won.' }),
  // ----- Mochi Garden: set out in your garden, and your Mochi use them (world/garden-life.js) -----
  // (`price` in gold from Kinako; `use`: what the Mochi do with it.)
  G('garden_bench', 'Garden Bench', 'floor', 40, 22, 1200, 'sit', 'A little bench painted cream and pink. Two Mochi can sit on it together, swinging their feet.'),
  G('garden_parasol', 'Sun Parasol', 'floor', 34, 44, 1500, 'shade', 'A frilly sunshade on a pole. A Mochi likes a nap in its shade.'),
  G('garden_fountain', 'Little Fountain', 'floor', 38, 30, 6000, 'gaze', 'Two stone basins and a sparkling spout. The Mochi come to watch the water play.'),
  G('garden_picnic', 'Picnic Blanket', 'rug', 48, 16, 800, 'picnic', 'A checked blanket with a basket of dango on it. Mochi stop by for a snack together.'),
  G('garden_arch', 'Rose Arch', 'floor', 44, 52, 2500, null, 'An arch of trellis climbed by pink roses, to walk through.'),
  G('garden_lantern', 'Stone Lantern', 'floor', 16, 30, 1800, null, 'A little stone lantern. It glows warm when the evening comes.'),
  G('garden_pinwheels', 'Pinwheel Planter', 'floor', 26, 22, 900, 'sniff', 'A planter of flowers with three pinwheels in it, spinning in the breeze.'),
  G('garden_statue', 'Mochi Statue', 'floor', 22, 30, 12000, null, 'A stone Mochi on a pedestal, its sprout up high. Very grand.'),
  // ----- The Moon Viewing festival's prizes (ui/festival-stall.js), for Moon Tokens -----
  GF('moon', 3, 'garden_pampas', 'Pampas Vase', 'floor', 16, 34, 'sniff', 'A tall indigo vase of silver pampas grass, nodding in the breeze.'),
  GF('moon', 5, 'garden_moonlantern', 'Moon Lantern', 'floor', 16, 36, null, 'A round paper lantern with a gold moon on it, on a little wooden post. It glows at dusk.'),
  GF('moon', 8, 'garden_offering', 'Moon Offering', 'floor', 32, 30, 'gaze', 'A little stand laid with a pyramid of white dango and a sprig of pampas, for the moon. The Mochi come to admire it.'),
  // ----- The Snow Lantern Festival's prizes, for Snow Tokens -----
  GF('snow', 3, 'garden_snowlantern', 'Snow Lantern', 'floor', 18, 18, null, 'A little lantern of packed snow with a candle inside. It glows at dusk, and never melts.'),
  GF('snow', 5, 'garden_camellia', 'Winter Camellia', 'floor', 22, 30, 'sniff', 'A glazed pot of glossy leaves and red camellias, a cap of snow on top.'),
  // ----- Blossom Day's prizes, for Blossom Tokens -----
  GF('blossom', 3, 'garden_bonbori', 'Bonbori Lantern', 'floor', 12, 34, null, 'A pink-and-white paper lantern on a slim red post. It glows at dusk.'),
  GF('blossom', 5, 'garden_hanamimat', 'Hanami Mat', 'rug', 50, 14, 'picnic', 'A red picnic mat with a stacked lunch box on it. Mochi stop by for a snack together.'),
  GF('blossom', 8, 'garden_sakura', 'Little Sakura', 'floor', 44, 56, 'shade', 'A young cherry tree in full pink bloom. A Mochi likes a nap in its shade.'),
  // ----- Lantern Night's prizes, for Lantern Tokens -----
  GF('lantern', 3, 'garden_furin', 'Wind Chime', 'floor', 14, 32, null, 'A glass wind chime on a little wooden stand, its paper strip swinging in the breeze.'),
  GF('lantern', 5, 'garden_chochin', 'Festival Lantern', 'floor', 20, 36, null, 'A red paper lantern hung from a wooden frame. It glows at dusk.'),
  GF('lantern', 8, 'garden_asagao', 'Morning Glory Trellis', 'floor', 26, 40, 'sniff', 'A bamboo trellis climbed by blue and purple morning glories.'),
  GF('snow', 8, 'garden_snowmochi', 'Snow-Mochi', 'floor', 22, 28, 'gaze', 'A round snow Mochi in a red scarf and a knitted hat, twig arms out for a hug. It never melts.'),
  // ----- The garden's own pieces (GB): what the garden came with, to move or put away -----
  GB('garden_mailbox', 'Mailbox', 'mg_mailbox', 'floor', 38, 38, { ox: 7, base: 24 }, 'The garden\'s mailbox. Its little flag goes up when there\'s post for you.'),
  GB('garden_cropbed', 'Vegetable Bed', 'mg_cropbed', 'floor', 122, 50, { ox: -9, base: 104, pick: { w: 104 } }, 'Rice, beans and peppers in a bed of dark soil. Pick them when they\'re ripe; a Mochi comes to water it.'),
  GB('garden_beanframe', 'Bean Frame', 'mg_beanframe', 'floor', 64, 96, { pick: { w: 72 } }, 'A bamboo frame climbed by runner beans.'),
  GB('garden_flowerbed_pink', 'Pink Flower Bed', 'mg_flowerbed', 'floor', 108, 36, { extra: 0, ox: -6, base: 96, pick: { w: 100 } }, 'A bed of pink, cream and gold flowers that close up at dusk. Mochi like a roll about in it.'),
  GB('garden_flowerbed_blue', 'Blue Flower Bed', 'mg_flowerbed', 'floor', 114, 36, { extra: 1, ox: 9, base: 96, pick: { w: 100 } }, 'A bed of blue, lilac and lemon flowers that close up at dusk. Mochi like a nap among them.'),
  GB('garden_well', 'Well', 'mg_well', 'floor', 74, 84, { ox: 9, base: 56, pick: { w: 68 } }, 'A stone well with a bucket on a winch. A Mochi likes to wind the bucket up.'),
  GB('garden_lamp', 'Garden Lantern', 'mg_lantern', 'floor', 22, 64, { extra: 1, pick: { w: 26 }, lamp: [8, -44] }, 'A paper lantern on a wooden post. It glows at dusk.'),
  GB('garden_seesaw', 'See-Saw', 'mg_seesaw', 'floor', 76, 26, { base: 30, pick: { w: 56 } }, 'A see-saw for two. One Mochi sits on an end and waits for a friend.'),
  GB('garden_peachtree', 'Peach Tree', 'mg_fruittree', 'floor', 40, 150, { extra: 0, base: 22, pick: { w: 96 } }, 'A peach tree. Shake it (Up) for fruit when it\'s ripe; a Mochi shelters under it in the rain.'),
  GB('garden_plumtree', 'Plum Tree', 'mg_fruittree', 'floor', 40, 150, { extra: 2, base: 22, pick: { w: 96 } }, 'A plum tree. Shake it (Up) for fruit when it\'s ripe; a Mochi shelters under it in the rain.'),
  GB('garden_toybox', 'Toy Box', 'mg_toybox', 'floor', 44, 52, { base: 30, pick: { w: 64 } }, 'A toy box with a pinwheel on top: the ball, the kite, the bubble wand and the spinning top live in it.'),
  GB('garden_bigtree', 'Big Old Tree', 'mg_bigtree', 'floor', 135, 236, { ox: 42.5, base: 40, pick: { w: 260 }, lamp: [-52, -148] }, 'The garden\'s great old tree, with a swing on its branch and a lantern in its leaves. Mochi nap in its shade.'),
  GB('garden_slide', 'Slide', 'mg_slide', 'floor', 104, 60, { ox: 6, pick: { w: 100 } }, 'A slide with a ladder up the back. Whee!'),
  GB('garden_mushroom', 'Bouncy Mushroom', 'mg_mushroom', 'floor', 68, 44, { ox: 1, pick: { w: 60 } }, 'A big springy mushroom cap to bounce on.'),
  GB('garden_fence', 'Picket Fence', 'mg_fence', 'back', 624, 28, {}, 'A long low picket fence with roses climbing it. It stands at the back, behind everything.'),
  GB('garden_fence_short', 'Short Picket Fence', 'mg_fence', 'back', 192, 28, {}, 'A short run of picket fence with roses climbing it. It stands at the back, behind everything.'),
  GB('garden_lanternstring', 'Lantern String', 'mg_lanternline', 'back', 544, 88, { flat: true, extra: { h: 82 } }, 'Paper lanterns strung between two poles, lit at dusk. The Mochi gather under them before bed.'),
];
export const FURNITURE_BY_ID = Object.fromEntries(FURNITURE.map((f) => [f.id, f]));
export const LAYERS = ['back', 'rug', 'wall', 'hang', 'floor', 'surface'];
// How many pieces each map holds.
export const PLACED_MAX = 60;
// The placement grid (px); hold Shift for free placement.
export const GRID = 4;
