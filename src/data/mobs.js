// Monster roster. Stats scale with level. EXP is tuned so levels 1-10 take roughly ten minutes;
// monsters level 10 and up give double EXP so the middle game keeps moving.
// `drops` is the monster's own loot table, in three tiers; the world adds potions and a little
// gear by level (world/drops.js):
//   common (about half the time): its own material, for quests, crafts and selling;
//   uncommon (about 8%): a crafting material (in a dungeon, the dungeon's token);
//   rare (1%): its signature prize, the reason to hunt it. Either a one-of-a-kind outfit piece by
//   id, or `gear: slot`: your own job's piece for that slot at the monster's level. Both come
//   Rare quality or better.
//
// Fields: level, hp, atk (touch damage), def, acc, eva, exp, gold [min, max], speed (px/s),
// w/h (hitbox), fly (hovers instead of walking), aggro (chases when hit), art (renderer key), and
// gait: how it moves at that speed — steady (the default), bound (leaps, then lands and gathers),
// dart (quick short dashes and sudden stops), or stalk (creeps slowly, then breaks into a run).

const mob = (def) => ({ fly: false, aggro: true, boss: false, ...def });

export const MOBS = {
  puffle: mob({
    id: 'puffle', name: 'Blossom Kit', level: 1, hp: 12, atk: 6, def: 0, acc: 8, eva: 0, exp: 8, gold: [1, 2],
    // (Speed 18 with no dart: it ambles the fox base's own walk and eases into a playful trot when it
    // gives chase; a creep-then-run gait makes a four-legged base flip between gaits.)
    speed: 18, w: 33, h: 32, art: 'puffle', aggro: false, drops: [{ id: 'fluff', chance: 0.6 }, { id: 'cotton', chance: 0.08 }, { id: 'kitty_ears', chance: 0.01 }],
  }),
  snailbun: mob({
    id: 'snailbun', name: 'Bud Snail', level: 2, hp: 22, atk: 8, def: 0, acc: 10, eva: 0, exp: 12, gold: [1, 2],
    // (Speed 7, the shell crawler snail's own glide (render/budsnail/): its foot's ripples run from
    // the distance it glides, so any faster and they blur into a scuttle; no 'dart' gait, a snail
    // never bursts. Moves: the runaway-bun roll, the bun bonk, the icing splat.)
    speed: 7, w: 32, h: 29, art: 'snailbun', aggro: false, moves: ['spin', 'bonk', 'splat'], drops: [{ id: 'shell', chance: 0.55 }, { id: 'copper_ore', chance: 0.08 }, { id: 'hoodie', chance: 0.01 }],
  }),
  // Petal Meadow's hive and clouds (render/mobs/bees.js).
  bumble: mob({
    id: 'bumble', name: 'Puffbee', level: 2, hp: 20, atk: 8, def: 0, acc: 10, eva: 1, exp: 13, gold: [1, 2],
    // (Speed 24 with no 'dart': the round bug base's bee leans into its travel up to 34 px a second,
    // so at 24 it drifts at an easy lean with its hover bob still showing; a dart's quick 1.7x bursts
    // and short pauses snapped its lean about and never left it hovering long enough for its act.
    // Moves: the letter dart, the satchel swing, the special delivery.)
    speed: 24, w: 24, h: 24, art: 'bumble', fly: true, moves: ['letter', 'satchel', 'buzz'], drops: [{ id: 'bee_fuzz', chance: 0.55 }, { id: 'honeycomb', chance: 0.08 }, { id: 'cozy_sweater', chance: 0.01 }],
  }),
  petalsprite: mob({
    id: 'petalsprite', name: 'Dandelion Puff', level: 3, hp: 30, atk: 10, def: 1, acc: 12, eva: 2, exp: 17, gold: [1, 3],
    speed: 30, w: 24, h: 42, art: 'petalsprite', fly: true, aggro: false, drops: [{ id: 'sprite_petal', chance: 0.55 }, { id: 'rose_quartz', chance: 0.08 }, { id: 'pleated_skirt', chance: 0.01 }],
  }),
  // Petal Meadow's area boss: she bursts out of the giant hive once enough of the meadow has been
  // hunted (world/nest.js), and every few seconds brings her honey dipper down in a splash that
  // hits anyone on her floor near her.
  queenbee: mob({
    id: 'queenbee', name: 'The Queen Bee', level: 6, hp: 1800, atk: 26, def: 4, acc: 20, eva: 1, exp: 900, gold: [75, 120],
    speed: 40, w: 60, h: 64, art: 'queenbee', fly: true, boss: true,
    drops: [{ id: 'royal_jelly', chance: 1, qty: 3 }, { id: 'honeycomb', chance: 1, qty: 4 }, { id: 'bee_fuzz', chance: 1, qty: 5 }],
    special: { kind: 'slam', every: 6, warn: 1.3, damage: 60, range: 170 },
  }),
  // Clover Hills' farm folk (render/mobs/farm.js), one more in each zone.
  strawhog: mob({
    id: 'strawhog', name: 'Strawhog', level: 5, hp: 70, atk: 15, def: 4, acc: 15, eva: 3, exp: 30, gold: [1, 4],
    // (Speed 24 with no 'dart': the bunny base's own hop (render/strawhog/), each hop's phase from the
    // distance hopped, carries it about 24.9 px a second at an easy hop; any faster and it breaks into
    // long running leaps, and a dart's bursts would blur its hops. Moves: the Boo, the hat boomerang,
    // the thump.)
    speed: 24, w: 23, h: 28, art: 'strawhog', moves: ['boo', 'hatthrow', 'thump'], drops: [{ id: 'hay_quill', chance: 0.5 }, { id: 'cotton', chance: 0.06 }, { id: 'cozy_sweater', chance: 0.01 }],
  }),
  brownie: mob({
    id: 'brownie', name: 'Chickling', level: 7, hp: 105, atk: 22, def: 5, acc: 20, eva: 3, exp: 48, gold: [2, 5],
    speed: 34, w: 22, h: 33, art: 'brownie', moves: ['peck', 'wingSlap', 'call'], drops: [{ id: 'brownie_crumb', chance: 0.5 }, { id: 'honeycomb', chance: 0.08 }, { id: 'maid_dress', chance: 0.01 }],
  }),
  harvmouse: mob({
    id: 'harvmouse', name: 'Harvest Mouse', level: 9, hp: 148, atk: 27, def: 7, acc: 24, eva: 6, exp: 72, gold: [2, 7],
    speed: 36, w: 26, h: 23, art: 'harvmouse', moves: ['bite', 'chitter', 'tailWhip'], drops: [{ id: 'woven_nest', chance: 0.45 }, { id: 'oak_log', chance: 0.08 }],
  }),
  // Clover Hills' area boss (world/nest.js): the farm's grumpy old foreman bursts out of the big
  // barn once enough of the hills has been hunted, and every few seconds stomps the ground,
  // hurting anyone on his floor near him.
  // (Big Barnaby the Clydesdale since 2026-11-25, render/macgoblin/: speed 24, his own heavy walk on
  // his chibi copy of the brute base, about 24 px a second, so at his roaming pace he plods and
  // never jogs; w/h his drawn body. The slam is his Clover Quake, his touches the Hay Bale Heave
  // and the Lucky Shoe in turn.)
  macgoblin: mob({
    id: 'macgoblin', name: 'Old MacGoblin', level: 10, hp: 3200, atk: 40, def: 8, acc: 26, eva: 1, exp: 1600, gold: [110, 170],
    speed: 24, w: 56, h: 88, art: 'macgoblin', boss: true,
    drops: [{ id: 'mushcap', chance: 1, qty: 6 }, { id: 'clover', chance: 1, qty: 5 }, { id: 'orange_potion', chance: 1, qty: 8 }],
    special: { kind: 'slam', every: 6, warn: 1.3, damage: 90, range: 180 },
  }),
  sproutling: mob({
    id: 'sproutling', name: 'Turnip Tot', level: 4, hp: 45, atk: 13, def: 2, acc: 14, eva: 1, exp: 22, gold: [1, 3],
    // (Speed 10, the veggie critter base's own waddle (render/turniptot/): each foot's step comes from
    // the distance walked on an 8 px stride, so any faster and its stubby legs blur into a scurry.
    // Moves: the sneeze blast, the scarf whip, the bonk.)
    speed: 10, w: 20, h: 33, art: 'sproutling', moves: ['achoo', 'scarfwhip', 'bonk'], drops: [{ id: 'sprout_leaf', chance: 0.5 }, { id: 'clover', chance: 0.08 }, { id: 'overalls', chance: 0.01 }],
  }),
  pumpgob: mob({
    id: 'pumpgob', name: 'Pumpkin Goblin', level: 6, hp: 88, atk: 18, def: 5, acc: 18, eva: 3, exp: 40, gold: [2, 5],
    // (Honkers the guard goose since 2026-11-25. Speed 12 with no 'dart': the bird base's own waddle
    // (render/pumpgob/), each step from the distance walked on a 9 px stride, about 1.3 steps a second
    // each foot; any faster and its short legs blur, and it never takes off. Moves: the honk blast,
    // the neck-out charge, the wing slap.)
    speed: 12, w: 26, h: 34, art: 'pumpgob', moves: ['honk', 'charge', 'wingSlap'], drops: [{ id: 'pumpkin_seed', chance: 0.5 }, { id: 'clover', chance: 0.08 }],
  }),
  lambkin: mob({
    id: 'lambkin', name: 'Hayloft Tortoise', level: 8, hp: 130, atk: 24, def: 7, acc: 21, eva: 4, exp: 56, gold: [2, 6],
    // (Loftle, the hayloft-barn tortoise, since 2026-11-25. Speed 9, the shell crawler tortoise's own
    // plod (render/lambkin/): each stubby foot planted from the distance walked, so any faster and the
    // feet slide and blur; slow is part of him, and he never darts. Moves: the barn bash, the hay-bale
    // toss, the weathervane spin.)
    speed: 9, w: 34, h: 30, art: 'lambkin', moves: ['bash', 'toss', 'whirl'], drops: [{ id: 'curly_wool', chance: 0.45 }, { id: 'honeycomb', chance: 0.08 }, { gear: 'earring', chance: 0.01 }],
  }),
  // Windy Canyon (the Manticore Cub remade from scratch 2026-11-18, render/mobs/manticorerig.js).
  // The Rockhound Kid (2026-11-22, replacing the Basilisk Hatchling; the id stays for saves and
  // quests): since 2026-11-25 Yodel, a cliff goat kid in a woven sunset poncho with a brass bell who
  // yodels and listens for the canyon's echo (render/pebblet/, its own copy of the hoofed base).
  // (Speed 19 with no 'dart': the goat kid's own walk runs about 23 px a second and it breaks into a
  // trot from about 28, so at 19 it ambles, and chasing (x1.35, about 26) it still walks, a little
  // brisker, never flipping between walk and trot; each hoof is planted from the distance walked, so
  // a dart's bursts would blur its legs. Moves: the headbutt, the yodel blast, the buck.)
  pebblet: mob({
    id: 'pebblet', name: 'Rockhound Kid', level: 9, hp: 150, atk: 28, def: 9, acc: 24, eva: 3, exp: 72, gold: [2, 7],
    speed: 19, w: 29, h: 37, art: 'rockhound', moves: ['headbutt', 'yodel', 'buck'], drops: [{ id: 'pebble', chance: 0.5 }, { id: 'copper_ore', chance: 0.08 }],
  }),
  // The Sunset Manticub (2026-11-25): a chubby lion cub with a sunset ruff, little bat wings it can't fly
  // with yet and a scorpion tail tipped with a heart (its "stinger"). Speed 16 with no creep-and-run:
  // it walks the cat base's own walk at that pace, chasing too (faster, the walk, trot and bound swap
  // about and the legs tangle).
  scorpip: mob({
    id: 'scorpip', name: 'Manticore Cub', level: 12, hp: 250, atk: 37, def: 10, acc: 30, eva: 5, exp: 190, gold: [3, 9],
    speed: 16, w: 32, h: 42, art: 'scorpip', moves: ['swipe', 'stalk', 'bite'], drops: [{ id: 'stinger', chance: 0.45 }, { id: 'iron_ore', chance: 0.08 }, { id: 'cargo_pants', chance: 0.01 }],
  }),
  leafling: mob({
    // (the Rootling Dryad, 2026-11-24: the Root Tendril's dryad as a field monster, on the serpent base;
    // her attacks in turn: vine lash, petal gust, root snare)
    id: 'leafling', name: 'Rootling Dryad', level: 11, hp: 210, atk: 33, def: 8, acc: 28, eva: 4, exp: 168, gold: [3, 8],
    speed: 44, w: 30, h: 56, art: 'leafling', moves: ['vineLash', 'petalGust', 'rootSnare'], fight: { every: 1.6, reach: 30, windup: 0.5 }, drops: [{ id: 'leaf_fragment', chance: 0.5 }, { id: 'maple_log', chance: 0.08 }, { id: 'sundress', chance: 0.01 }],
  }),
  // Mossy Woods' canopy (new 2026-11-12; since 2026-11-26 the Blossom Red Panda, remade from scratch:
  // a dozy, flower-loving red panda with hay fever, a hibiscus behind his ear, on his own copy of the
  // rodent base: render/redpanda/). He pads about slowly and stands for `rest` seconds between walks,
  // long enough for a piece of his act (world/mobs.js); his attacks in turn: Big Scary, Pollen Sneeze,
  // Tail Swish.
  redpanda: mob({
    id: 'redpanda', name: 'Blossom Red Panda', level: 18, hp: 620, atk: 58, def: 18, acc: 42, eva: 6, exp: 420, gold: [6, 15],
    speed: 32, rest: [11, 18], w: 35, h: 38, art: 'redpanda', moves: ['scary', 'sneeze', 'swish'], drops: [{ id: 'panda_fluff', chance: 0.45 }, { id: 'maple_log', chance: 0.08 }],
  }),
  // Mossy Woods' branches (new 2026-11-12): since 2026-11-25 the Leaf Cloak Owlet, a snowy owlet in a
  // maple-leaf cloak, on its own copy of the owl base (render/owlet/); moving, it takes off and glides.
  mossowlet: mob({
    id: 'mossowlet', name: 'Moss Owlet', level: 11, hp: 220, atk: 33, def: 8, acc: 29, eva: 7, exp: 168, gold: [3, 8],
    speed: 38, w: 22, h: 35, art: 'mossowlet', moves: ['swoop', 'wingSlap', 'call'], drops: [{ id: 'owl_down', chance: 0.5 }, { id: 'silkmoss', chance: 0.08 }],
  }),
  // Mossy Woods' forest floor (new 2026-11-12; since 2026-11-26 Tumble the Moss Piglet, a cuddly
  // tardigrade with a moss cushion on its back, on its own copy of the veggie base: render/mosstort/).
  // Tough and slow: it curls into its hard "tun" to drop on you. (Speed 20: its own waddle.)
  mosstort: mob({
    id: 'mosstort', name: 'Moss Piglet', level: 14, hp: 380, atk: 40, def: 17, acc: 33, eva: 3, exp: 240, gold: [4, 10],
    speed: 20, w: 30, h: 31, art: 'mosstort', moves: ['tundrop', 'flurry', 'snoutbump'], drops: [{ id: 'moss_scute', chance: 0.45 }, { id: 'silkmoss', chance: 0.08 }],
  }),
  boarlet: mob({
    id: 'boarlet', name: 'Warg', level: 14, hp: 330, atk: 43, def: 12, acc: 34, eva: 5, exp: 240, gold: [4, 10],
    speed: 26, w: 48, h: 43, art: 'boarlet', drops: [{ id: 'tusk', chance: 0.45 }, { id: 'silkmoss', chance: 0.08 }, { id: 'puffer_jacket', chance: 0.01 }],
    // (Tuskar calls them into his den in Rootwood Hollow, where they fight like its own.)
    // (Speed 26, a steady walk with no creep-and-run: it walks the wolf base's own walk at that pace,
    // chasing too, 2026-11-25; faster, it trots and gallops in a tangle of legs.)
    fight: { every: 1.6, reach: 30, windup: 0.4 },
  }),
  // Whispering Glade's tanukis in disguise (2026-11-13): little folk who are really tanukis, and go up
  // in a puff of smoke leaving a leaf when beaten (`leafPoof`). A puddle-mad rain kid in a raincoat
  // with a lily-pad umbrella on the floor (since 2026-11-26 remade on her own copy of the kid base,
  // render/puddlekid/: `rest` long enough for a piece of her idle act; moves: Puddle Stomp, Lily Pad
  // Swat, Splash Kick), and a prankster flower fairy in the air (since 2026-11-26 remade on her own
  // copy of the kid base, render/blossomfairy/: `rest` for a piece of her act; moves: Petal Flurry,
  // Pollen Bomb, Wing Gust).
  puddlekid: mob({
    id: 'puddlekid', name: 'Puddle Kid', level: 18, hp: 620, atk: 58, def: 20, acc: 40, eva: 4, exp: 420, gold: [6, 15],
    speed: 30, rest: [8, 13], w: 26, h: 41, art: 'puddlekid', moves: ['stomp', 'swat', 'kick'], leafPoof: true, drops: [{ id: 'moss_stone', chance: 0.75 }, { id: 'maple_log', chance: 0.08 }],
  }),
  blossomfairy: mob({
    id: 'blossomfairy', name: 'Blossom Fairy', level: 21, hp: 700, atk: 64, def: 14, acc: 48, eva: 12, exp: 500, gold: [7, 17],
    speed: 60, rest: [8, 13], w: 28, h: 42, art: 'blossomfairy', fly: true, moves: ['flurry', 'pollen', 'gust'], leafPoof: true, drops: [{ id: 'sylph_feather', chance: 0.45 }, { id: 'silkmoss', chance: 0.08 }, { id: 'fairy_wings', chance: 0.01 }],
  }),
  // The Ruin Acolyte (2026-11-22, replacing the Will-o'-Wisp; since 2026-11-26 rebuilt on her own copy
  // of the kid base, render/acolyte/): a little hooded temple girl who floats through the halls she
  // tends, a censer on a chain with a wisp living in it. `rest` long enough for a piece of her idle
  // act; moves: Censer Swing, Wisp Shot, Incense Cloud.
  wisp: mob({
    id: 'wisp', name: 'Ruin Acolyte', level: 20, hp: 660, atk: 62, def: 18, acc: 46, eva: 7, exp: 480, gold: [7, 16],
    speed: 34, rest: [8, 13], w: 26, h: 40, art: 'acolyte', fly: true, moves: ['swing', 'wisp', 'cloud'], drops: [{ id: 'wisp_flame', chance: 0.45 }, { id: 'amethyst', chance: 0.08 }],
  }),
  // The Gargoyle Kid (2026-11-22, replacing the Imp; since 2026-11-26 rebuilt on her own copy of the
  // kid base, render/gargoyle/): an impish little gargoyle from the temple's gutters, flying on heavy
  // stone wings (two beats, then a sinking glide), who freezes into a statue for fun. A steady flier,
  // easy to follow (the Imp's darting made it the slowest hunt in the game). `rest` long enough for a
  // piece of her idle act; moves: Horn Dive, Gutter Spout, Stone Drop.
  gloombat: mob({
    id: 'gloombat', name: 'Gargoyle Kid', level: 22, hp: 740, atk: 67, def: 15, acc: 50, eva: 8, exp: 540, gold: [7, 18],
    speed: 50, rest: [8, 13], w: 28, h: 38, art: 'gargoyle', fly: true, moves: ['dive', 'spout', 'drop'], drops: [{ id: 'bat_wing', chance: 0.65 }, { id: 'silver_ore', chance: 0.08 }],
  }),
  // The Pangolin Sentry (2026-11-26, replacing the Dullahan; render/pangolin/, on its own copy of the
  // creature base): the old Moon Guard's mascot pangolins, still on patrol in the Sunken Crypt in their
  // dented helmets because nobody told them the war ended. A short-legged waddle at its own pace;
  // `rest` long enough for a piece of its idle act; moves: Helmet Bash, Rubble Fling, Tail Sweep.
  boneknight: mob({
    id: 'boneknight', name: 'Pangolin Sentry', level: 24, hp: 1120, atk: 78, def: 30, acc: 54, eva: 6, exp: 700, gold: [9, 21],
    speed: 22, rest: [9, 13], w: 30, h: 49, art: 'boneknight', moves: ['bash', 'dig', 'tail'], drops: [{ id: 'bone_shard', chance: 0.5 }, { id: 'silver_ore', chance: 0.08 }],
  }),
  crystalslime: mob({
    id: 'crystalslime', name: 'Gem Mimic', level: 27, hp: 1320, atk: 88, def: 28, acc: 58, eva: 8, exp: 800, gold: [10, 23],
    // (the Chest Hermit, 2026-11-24: render/hermit/; it bites and slams its chest's lid)
    speed: 40, w: 28, h: 33, art: 'crystalslime', moves: ['hermitChomp', 'lidSlam'], drops: [{ id: 'crystal_gel', chance: 0.5 }, { id: 'sapphire', chance: 0.08 }, { gear: 'earring', chance: 0.01 }],
  }),
  // The Geode Turtle (2026-11-27, new in the Geode Bear's place; render/geodeturtle/, on its own copy of
  // the shell crawler base's sea turtle): an old cave-lake turtle, its stone shell cracked open on top like
  // a geode, amethyst crystals glowing out of it (the Geode Cores). It rows along on its flippers at a
  // sea turtle's slow pace (8); `rest` long enough for a piece of its idle act; moves: a flipper slap, a
  // snap, a shell spin.
  rockgolem: mob({
    id: 'rockgolem', name: 'Geode Turtle', level: 32, hp: 2450, atk: 112, def: 45, acc: 66, eva: 6, exp: 1280, gold: [13, 30],
    speed: 8, rest: [9, 13], w: 41, h: 26, art: 'rockgolem', moves: ['slap', 'snap', 'spin'], drops: [{ id: 'rock_core', chance: 0.45 }, { id: 'silver_ore', chance: 0.08 }],
  }),
  shade: mob({
    // (the Steam Capybara, 2026-11-26, replacing the Wraith: render/steamcapybara/, on its own copy of
    // the creature base; it floats in its own bath-cloud of steam, on Serpent Springs (since 2026-11-27
    // no longer in the Crystal Cave); `rest` for a piece of its idle act; moves: Steam Jet, Towel Snap, Bubble Burst)
    id: 'shade', name: 'Steam Capybara', level: 35, hp: 2650, atk: 126, def: 35, acc: 72, eva: 12, exp: 1440, gold: [14, 33],
    speed: 56, rest: [8, 13], w: 28, h: 46, art: 'shade', fly: true, moves: ['jet', 'snap', 'bubble'], drops: [{ id: 'shade_cloth', chance: 0.45 }, { id: 'starstone', chance: 0.08 }],
  }),
  // The Snowpuff Hare (2026-11-27, new in the Whistledown Marmot's place, render/snowhare/): a snow-white
  // hare of the Cloud Meadows (and Frozen Peak's lake shore) whose winter coat comes in as cloud, a cloud
  // ruff and a big cloud-puff tail; it turns its ears into the wind and nibbles cloud like clover. (Speed
  // 30, an easy lope on the hare's own long legs; `rest` for a piece of its idle act. Moves: a bonk, a
  // hind-foot thump, a nibble.)
  cloudsheep: mob({
    id: 'cloudsheep', name: 'Snowpuff Hare', level: 38, hp: 3250, atk: 136, def: 40, acc: 76, eva: 11, exp: 1720, gold: [15, 38],
    speed: 30, rest: [9, 14], w: 34, h: 40, art: 'cloudsheep', moves: ['bonk', 'thump', 'nibble'], drops: [{ id: 'wool', chance: 0.5 }, { id: 'cloud_cotton', chance: 0.08 }, { id: 'angel_wings', chance: 0.01 }],
  }),
  // The Windsock Albatross (2026-11-27, the Sky Harpy remade from scratch, render/albatross/): a chibi
  // albatross in a knitted windsock cap, gliding the winds round the Windsock Roost and Starfall Heights' rims.
  // (Speed 54, an easy glide with a lazy stroke now and then; `rest` for a piece of its idle act. Moves:
  // Stoop, Wing Buffet, Bill Clack.)
  windbird: mob({
    id: 'windbird', name: 'Windsock Albatross', level: 43, hp: 4250, atk: 160, def: 45, acc: 84, eva: 15, exp: 2240, gold: [18, 43],
    speed: 54, rest: [9, 14], w: 34, h: 34, art: 'windbird', fly: true, moves: ['dive', 'buffet', 'clack'], drops: [{ id: 'feather', chance: 0.45 }, { id: 'skywood_log', chance: 0.08 }],
  }),
  // The Comet Goldfish (2026-11-27, the Star Seraph remade from scratch, render/goldfish/): a plump fancy
  // goldfish that swims the night sky over the Starlit Terrace and Starfall Heights, its long double tail
  // streaming like a comet's; it snacks on falling stars. (Speed 26, the round fish's own slow swim, its
  // beat from the distance swum; `rest` for a piece of its idle act. Moves: Comet Swish, Wish Bubble,
  // Shooting Star.)
  starspirit: mob({
    id: 'starspirit', name: 'Comet Goldfish', level: 48, hp: 5650, atk: 186, def: 55, acc: 92, eva: 16, exp: 2880, gold: [20, 50],
    speed: 26, rest: [9, 14], w: 32, h: 30, art: 'starspirit', fly: true, moves: ['swish', 'bubble', 'dash'], drops: [{ id: 'stardust', chance: 0.45 }, { id: 'starstone', chance: 0.08 }, { id: 'star_cape', chance: 0.01 }],
  }),

  // Spirit maidens out of myth, living on the mid and late maps: Nekomata and Kitsune Miko on the
  // Fox Shrine Path, Lupina on Moonlit Ridge, Lamia at Serpent Springs, Yuki-onna on Frozen Peak.
  nekomata: mob({
    id: 'nekomata', name: 'Nekomata', level: 23, hp: 820, atk: 76, def: 16, acc: 54, eva: 14, exp: 600, gold: [8, 19],
    speed: 74, gait: 'dart', w: 24, h: 46, art: 'nekomata', drops: [{ id: 'nekomata_bell', chance: 0.45 }, { id: 'lotus_fiber', chance: 0.08 }, { gear: 'earring', chance: 0.01 }],
  }),
  kitsunemiko: mob({
    id: 'kitsunemiko', name: 'Kitsune Miko', level: 27, hp: 1250, atk: 86, def: 24, acc: 58, eva: 10, exp: 790, gold: [10, 23],
    speed: 40, w: 24, h: 48, art: 'kitsunemiko', drops: [{ id: 'wisp_flame', chance: 0.45 }, { id: 'cedar_log', chance: 0.08 }, { id: 'kimono', chance: 0.01 }],
  }),
  // The Tanuki Tea Terraces (render/mobs/tea.js): the pickers on the upper rows, the kettles on the
  // steps, the lanterns down in the misty hollow (and out at night).
  tanukipicker: mob({
    id: 'tanukipicker', name: 'Tanuki Picker', level: 24, hp: 900, atk: 78, def: 18, acc: 55, eva: 12, exp: 640, gold: [9, 20],
    speed: 36, w: 26, h: 36, art: 'tanukipicker', moves: ['teaSplash', 'tailWhip'], drops: [{ id: 'tea_leaf', chance: 0.45 }, { id: 'cedar_log', chance: 0.08 }],
  }),
  // (the Kettle Tanuki, rebuilt 2026-11-26 on its own copy of the creature base, render/kettletanuki/:
  // a tanuki stuck halfway into a copper kettle; `rest` for a piece of his act; moves: Steam Whistle,
  // Lid Toss, Belly Bonk)
  kettletanuki: mob({
    id: 'kettletanuki', name: 'Kettle Tanuki', level: 26, hp: 1150, atk: 82, def: 26, acc: 56, eva: 6, exp: 740, gold: [10, 22],
    speed: 22, rest: [9, 13], w: 32, h: 48, art: 'kettletanuki', moves: ['steam', 'lid', 'bonk'], drops: [{ id: 'kettle_lid', chance: 0.45 }, { id: 'tea_leaf', chance: 0.12 }],
  }),
  // (the Lantern Tanuki, rebuilt 2026-11-26 on its own copy of the creature base,
  // render/lantertanuki/: the hollow's night watchman with a paper lantern on a pole; `rest` for a
  // piece of his act; moves: Lantern Swing, Foxfire, Belly Drum)
  lantertanuki: mob({
    id: 'lantertanuki', name: 'Lantern Tanuki', level: 28, hp: 1220, atk: 92, def: 22, acc: 60, eva: 12, exp: 840, gold: [11, 24],
    speed: 22, rest: [9, 13], w: 32, h: 52, art: 'lantertanuki', moves: ['swing', 'foxfire', 'drum'], drops: [{ id: 'lantern_paper', chance: 0.45 }, { id: 'lotus_fiber', chance: 0.08 }, { gear: 'earring', chance: 0.01 }],
  }),
  lupina: mob({
    id: 'lupina', name: 'Lupina', level: 29, hp: 1500, atk: 96, def: 28, acc: 62, eva: 10, exp: 900, gold: [11, 25],
    speed: 50, gait: 'stalk', w: 24, h: 50, art: 'lupina', drops: [{ id: 'moon_fang', chance: 0.45 }, { id: 'lotus_fiber', chance: 0.08 }],
  }),
  lamia: mob({
    id: 'lamia', name: 'Lamia', level: 33, hp: 2500, atk: 116, def: 40, acc: 68, eva: 8, exp: 1320, gold: [13, 31],
    speed: 36, w: 28, h: 50, art: 'lamia', drops: [{ id: 'lamia_scale', chance: 0.5 }, { id: 'sapphire', chance: 0.08 }],
  }),
  yukionna: mob({
    id: 'yukionna', name: 'Yuki-onna', level: 36, hp: 2800, atk: 128, def: 36, acc: 74, eva: 12, exp: 1520, gold: [14, 34],
    speed: 32, w: 30, h: 50, art: 'yukionna', drops: [{ id: 'snow_gem', chance: 0.45 }, { id: 'starstone', chance: 0.08 }, { gear: 'earring', chance: 0.01 }],
  }),

  // Rootwood Hollow (the Lv 10 dungeon). In a dungeon monsters don't hurt on touch: they swing at
  // whoever they're angriest at (`fight`: every seconds, reach px, wind-up seconds; ranged ones
  // spit from `range` away). Bosses add their own moves (`mech`, see world/dungeon.js).
  rootling: mob({
    id: 'rootling', name: 'Root Imp', level: 10, hp: 300, atk: 36, def: 8, acc: 30, eva: 3, exp: 130, gold: [3, 7],
    // (Plotter the garden crab since 2026-11-25, on the crab base (render/rootimp/). Speed 20 with no
    // 'dart': its own sideways scuttle, each step from the distance walked on an 11 px stride, its
    // feet planted; about one step a second each foot as it potters about a room, three chasing.
    // Moves: Snip, Prune Prune; its burrow digs in backwards, only its garden gliding over the floor.)
    speed: 20, w: 34, h: 29, art: 'rootling', moves: ['snip', 'prune'], drops: [{ id: 'oak_log', chance: 0.4 }, { id: 'hollow_acorn', chance: 0.12 }],
    fight: { every: 1.5, reach: 28, windup: 0.35, move: { kind: 'burrow', every: 9, first: 2.2, warn: 0.8, w: 48, mul: 1.5 } },
  }),
  sporecap: mob({
    id: 'sporecap', name: 'Myconid Shaman', level: 10, hp: 240, atk: 30, def: 5, acc: 30, eva: 2, exp: 120, gold: [3, 7],
    // (Jaxby the blue jay since 2026-11-26, on the bird base (render/shaman/). Speed 28, its own hop,
    // each hop from the distance walked. Moves: Acorn Flick from afar (its shot an acorn), Peck up
    // close; its own move, Feather Flurry, lands blue and white feathers on its target's spot.)
    speed: 28, w: 40, h: 38, art: 'sporecap', moves: ['flick', 'peck'], drops: [{ id: 'mushcap', chance: 0.4 }, { id: 'hollow_acorn', chance: 0.08 }],
    fight: { every: 2.2, reach: 26, windup: 0.5, range: 170, shot: 'acorn', move: { kind: 'cloud', every: 11, first: 2.6, warn: 1.6, w: 70, mul: 1.4, look: 'feathers' } },
  }),
  thornback: mob({
    id: 'thornback', name: 'Bramble Bear', level: 12, hp: 900, atk: 52, def: 14, acc: 34, eva: 3, exp: 420, gold: [5, 13],
    // (Varro the moss-stone guardian since 2026-11-26, on the dog base (render/thornback/). Speed 27,
    // the base's own walk, each step from the distance walked, its ball dribbled by the same distance.
    // Moves: Stone Paw and Mane Butt in turn; its own move, Temple Ball, rides its ball along the floor.)
    speed: 27, w: 54, h: 48, art: 'thornback', moves: ['pound', 'butt'], drops: [{ id: 'hollow_acorn', chance: 0.4 }, { id: 'bramble_claw', chance: 0.4 }, { id: 'silkmoss', chance: 0.08 }],
    fight: { every: 1.8, reach: 32, windup: 0.45, move: { kind: 'roll', every: 10, first: 3, warn: 0.9, dist: 200, speed: 260, mul: 1.6 } },
  }),
  sporeling: mob({
    id: 'sporeling', name: 'Spore Mite', level: 10, hp: 160, atk: 22, def: 2, acc: 28, eva: 4, exp: 40, gold: [1, 2],
    speed: 72, gait: 'dart', w: 22, h: 20, art: 'sporeling', drops: [],
    fight: { every: 1.2, reach: 22, windup: 0.25 },
  }),
  sapling: mob({
    id: 'sapling', name: 'Root Tendril', level: 12, hp: 700, atk: 0, def: 10, acc: 0, eva: 0, exp: 160, gold: [1, 3],
    speed: 0, w: 30, h: 56, art: 'sapling', drops: [],
    // Saplings don't fight: they feed their life to Gnarlroot.
    fight: { mender: true },
  }),
  mothercapper: mob({
    // (Health sized from a live run, 2026-11-19: a level-13 group does about 220 a second to her;
    // 18k is a fight of about a minute and a half.)
    // (Hazel Hoardwell the Pantry Hamster since 2026-11-26, on the rodent base (render/mothercapper/):
    // sat up she's 90 x 100 as drawn; she scurries on all fours at 44, her steps from the distance
    // walked, about 1.3 a second each foot. Her swings in turn: Nibble, Hoard Toss, Seed Spit, Bowl Roll.)
    id: 'mothercapper', name: 'Myconid Queen', level: 12, hp: 18000, atk: 84, def: 16, acc: 40, eva: 2, exp: 3000, gold: [120, 190],
    speed: 44, w: 90, h: 100, art: 'mothercapper', boss: true,
    drops: [{ id: 'hollow_acorn', chance: 1, qty: 2 }, { id: 'orange_potion', chance: 1, qty: 10 }],
    fight: { every: 1.8, reach: 52, windup: 0.5 }, mech: 'capper',
  }),
  tuskar: mob({
    // (Health sized from a live run, 2026-11-19: about 215 a second from a level-14 group, his
    // dizzy spells included; 20k is a fight of about a minute and a half.)
    // (Tuskar the woolly mammoth calf since 2026-11-26, on the creature base (render/tuskar/):
    // standing he's 80 x 107 as drawn; he walks at his base's own pace, 28, his steps from the
    // distance walked; the Charge is 520 (world/dungeon.js). His swings in turn: Tusk Toss, Trunk
    // Slap, Shoulder Barge; the Gore a two-tusk lunge.)
    id: 'tuskar', name: 'Tuskar the Behemoth', level: 13, hp: 20000, atk: 94, def: 18, acc: 42, eva: 2, exp: 4500, gold: [150, 240],
    speed: 28, w: 80, h: 107, art: 'tuskar', boss: true,
    drops: [{ id: 'hollow_acorn', chance: 1, qty: 3 }, { id: 'white_potion', chance: 1, qty: 10 }],
    fight: { every: 2, reach: 56, windup: 0.5 }, mech: 'boar',
  }),
  gnarlroot: mob({
    // (Health sized from a live run, 2026-11-19: 16k took a level-14 group about 55 s, ten of them
    // cutting Yomogi free; 32k is a fight of about a minute and three quarters, the Hollow's last.)
    id: 'gnarlroot', name: 'Gnarlroot, the Oldest Tree', level: 14, hp: 32000, atk: 98, def: 20, acc: 44, eva: 2, exp: 9000, gold: [240, 360],
    speed: 16, w: 100, h: 150, art: 'gnarlroot', boss: true, moves: ['rootSlam', 'branchSweep'],
    drops: [{ id: 'hollow_acorn', chance: 1, qty: 5 }],
    fight: { every: 2, reach: 74, windup: 0.55 }, mech: 'gnarl',
  }),


  // ---------- Moonlit Manor (levels 15-20, docs/design/moonlit-manor.md) ----------
  // (Pinsworth, the pincushion duellist, 2026-11-26: a velvet pincushion in a china thimble fencing
  // with a sewing needle, on its own copy of the veggie base: render/porcelaindoll/. Its box is its
  // drawn body and thimble; the needle reaches past it.)
  porcelaindoll: mob({
    id: 'porcelaindoll', name: 'Porcelain Doll', level: 15, hp: 640, atk: 58, def: 18, acc: 46, eva: 4, exp: 240, gold: [5, 11],
    speed: 34, w: 25, h: 30, art: 'porcelaindoll', moves: ['lunge', 'flurry', 'cut'], drops: [{ id: 'porcelain_shard', chance: 0.4 }, { id: 'moonlit_ribbon', chance: 0.08 }],
    fight: { every: 1.9, reach: 38, windup: 0.45 },
  }),
  // (Lacey, the moon-jelly parlourmaid, 2026-11-26: a moon jellyfish whose frilled bell is her lace mob
  // cap, a feather duster and a silver service bell in her ribbon arms, on her own copy of the
  // jellyfish: render/ghostmaid/. She floats a hand's height over the floor and keeps to it, like the
  // Lantern Wisp (not a flyer: she fights on the manor's floors with her pack). Her box is her bell and
  // the ribbons under it.)
  ghostmaid: mob({
    id: 'ghostmaid', name: 'Ghost Maid', level: 15, hp: 520, atk: 52, def: 10, acc: 48, eva: 8, exp: 220, gold: [5, 10],
    speed: 52, w: 26, h: 38, art: 'ghostmaid', moves: ['swat', 'bell', 'lash'], drops: [{ id: 'shade_cloth', chance: 0.3 }, { id: 'moonlit_ribbon', chance: 0.06 }],
    fight: { every: 1.5, reach: 34, windup: 0.3 },
  }),
  candlebride: mob({
    id: 'candlebride', name: 'Candle Bride', level: 17, hp: 760, atk: 62, def: 12, acc: 50, eva: 5, exp: 300, gold: [6, 13],
    // (the Candelabra Bride, 2026-11-24: her candelabra, render/bride/; a slow, stately walk)
    speed: 16, w: 26, h: 46, art: 'candlebride', drops: [{ id: 'candle_wax', chance: 0.4 }, { id: 'moonlit_ribbon', chance: 0.08 }, { id: 'long_skirt', chance: 0.01 }],
    moves: ['candleThrust', 'candleSweep'], fight: { every: 2.3, reach: 30, windup: 0.55, range: 170, shot: 'flame' },
  }),
  // The Topiary Hedgehog (2026-11-26, remade from scratch as Topsy, the hedge-hog: a round little
  // hedgehog whose prickles are a clipped box hedge, on his own copy of the rodent base:
  // render/topiarydryad/). He rolls about in quick dashes like a topiary ball, and between them stands
  // for `rest` seconds, long enough for a piece of his act (world/mobs.js).
  topiarydryad: mob({
    id: 'topiarydryad', name: 'Topiary Hedgehog', level: 15, hp: 600, atk: 56, def: 14, acc: 46, eva: 6, exp: 230, gold: [5, 11],
    speed: 46, gait: 'dart', rest: [9, 13], w: 34, h: 26, art: 'topiarydryad', moves: ['snip', 'roll', 'shake'], drops: [{ id: 'leaf_fragment', chance: 0.4 }, { id: 'moonlit_ribbon', chance: 0.06 }, { id: 'flower_crown', chance: 0.01 }],
    fight: { every: 1.6, reach: 36, windup: 0.3 },
  }),
  lanternghost: mob({
    id: 'lanternghost', name: 'Lantern Wisp', level: 16, hp: 540, atk: 58, def: 8, acc: 50, eva: 9, exp: 250, gold: [5, 11],
    // (the Lamplighter Wisp, 2026-11-24: her pole and lantern, render/wisp/)
    speed: 40, w: 26, h: 44, art: 'lanternghost', drops: [{ id: 'wisp_flame', chance: 0.35 }, { id: 'moonlit_ribbon', chance: 0.06 }, { gear: 'earring', chance: 0.01 }],
    moves: ['lanternFling', 'emberVolley'], fight: { every: 2.1, reach: 30, windup: 0.5, range: 150 },
  }),
  // The Teacup Hermit (2026-11-26, the Tea Party Hatter remade from scratch as Pemberton, the teacup
  // hermit crab: a little rose-pink hermit crab living in a fine porcelain teacup, monocle and
  // moustache and all, on his own copy of the crab base: render/teahatter/). From afar he lobs the
  // sugar cube off his cup (`shot`, render/teahatter/index.js sugarShot); close up, a pinch and a
  // clonk of his cup. Between walks he stands for `rest` seconds, long enough for a piece of his act.
  teahatter: mob({
    id: 'teahatter', name: 'Teacup Hermit', level: 17, hp: 820, atk: 64, def: 14, acc: 50, eva: 6, exp: 320, gold: [7, 14],
    speed: 44, rest: [9, 14], w: 36, h: 31, art: 'teahatter', moves: ['sugarLob', 'tongPinch', 'cupClonk'], drops: [{ id: 'moonlit_ribbon', chance: 0.1 }, { id: 'orange_potion', chance: 0.3 }],
    fight: { every: 1.9, reach: 32, windup: 0.4, range: 120, shot: 'sugarcube' },
  }),
  // Lady Marigold's butler (remade 2026-11-26 as Humphrey, the Basset Butler, render/pumpkinbutler/;
  // the id kept): she rings, and he brings her the next course, a pumpkin tart under his silver
  // cloche; if he reaches her she eats it and feels better (world/manor.js, `mech: 'butler'`). Short
  // legs: he walks at his own unhurried pace. Between walks he stands for `rest` seconds, long enough
  // for a piece of his act.
  pumpkinbutler: mob({
    id: 'pumpkinbutler', name: 'Basset Butler', level: 19, hp: 1400, atk: 72, def: 22, acc: 54, eva: 4, exp: 460, gold: [8, 16],
    speed: 24, rest: [9, 14], w: 34, h: 44, art: 'pumpkinbutler', drops: [{ id: 'moonlit_ribbon', chance: 0.12 }],
    fight: { every: 2, reach: 36, windup: 0.5 }, mech: 'butler',
  }),
  // The Ballroom's pair: Dame Rondo and Dame Minuet, the Mirror Twins (2026-11-28, remade from scratch
  // as twin ghost ladies: render/twins/; their fight: world/twins.js). One on the floor, one hanging
  // from the ceiling; only the one on the floor is in reach, and they trade places when time stops.
  // (Health sized from a logged run, 2026-11-28, a level-18 group on the tests' autopilot: with only the
  // floor twin in reach, 46k and 42k took three minutes; 32k and 29k about a minute and a half.)
  // (Health sized from a run, 2026-11-26, the fight's own patterns and a level-17/18 group on the
  // same autopilot as tests/dungeon.test.js: 50k between them went down in 53-66 s, the pair close
  // together for most of it (hand in hand, and in each other's splash); 46k and 42k make it a dance of
  // about a minute and a half to two: 83 and 91 s for two level-18 groups, 117 s for a level-17 one.)
  waltzrondo: mob({
    id: 'waltzrondo', name: 'Dame Rondo, the Mirror Twin', level: 17, hp: 32000, atk: 112, def: 24, acc: 54, eva: 3, exp: 5200, gold: [170, 250],
    speed: 40, w: 46, h: 96, art: 'waltzrondo', boss: true,
    drops: [{ id: 'moonlit_ribbon', chance: 1, qty: 2 }, { id: 'white_potion', chance: 1, qty: 8 }],
    fight: { every: 1.9, reach: 46, windup: 0.5, look: 'twNote' }, mech: 'twins',
  }),
  waltzminuet: mob({
    id: 'waltzminuet', name: 'Dame Minuet, the Upside-down Twin', level: 17, hp: 29000, atk: 104, def: 22, acc: 54, eva: 4, exp: 5200, gold: [170, 250],
    speed: 40, w: 46, h: 96, art: 'waltzminuet', boss: true,
    drops: [{ id: 'moonlit_ribbon', chance: 1, qty: 2 }, { id: 'orange_potion', chance: 1, qty: 8 }],
    fight: { every: 1.7, reach: 44, windup: 0.45, look: 'twPuff' }, mech: 'twins',
  }),
  // (Health sized from a live run, 2026-11-19: about 435 a second from a level-18 group, tea and
  // bells included; 40k is a fight of about a minute and a half.)
  // (2026-11-28, her new fight in her own hall: at 40k a level-19 autopilot group beat her in 71 s, no
  // wipes; sized up for about a minute and a half to two)
  velvet: mob({
    id: 'velvet', name: 'Madame Velvet, the Head Housekeeper', level: 18, hp: 56000, atk: 118, def: 24, acc: 56, eva: 3, exp: 8000, gold: [220, 330],
    speed: 30, w: 70, h: 100, art: 'velvet', boss: true,
    drops: [{ id: 'moonlit_ribbon', chance: 1, qty: 3 }, { id: 'white_potion', chance: 1, qty: 10 }],
    fight: { every: 2, reach: 70, windup: 0.5 }, mech: 'velvet',
  }),
  // Lady Marigold, remade 2026-11-26 (render/marigold/: a ghost hostess on the spirit base) with a new
  // fight (world/manor.js: Welcome, Guests!, Second Helpings with her Basset Butlers, Midnight).
  // (Health sized from runs of that fight, 2026-11-26, on the same autopilot as tests/dungeon.test.js:
  // 42k went down in 58-84 s for level-19/20 groups, never out of reach now; at 58k it took 75, 108,
  // 123 and 126 s for four groups, no wipes, the butlers reaching her 0-1 times; a slow level-19 group
  // led by its tank took 206 s.)
  marigold: mob({
    id: 'marigold', name: 'Lady Marigold, the Eternal Hostess', level: 20, hp: 58000, atk: 128, def: 28, acc: 60, eva: 4, exp: 16000, gold: [340, 520],
    speed: 26, w: 70, h: 110, art: 'marigold', boss: true,
    drops: [{ id: 'moonlit_ribbon', chance: 1, qty: 5 }],
    fight: { every: 2, reach: 72, windup: 0.55 }, mech: 'marigold',
  }),


  // ---------- Sunken Aquarium Palace (levels 20-25, docs/design/aquarium-palace.md) ----------
  // The Sea Bunny Bellhop (2026-11-26, the Jelly Belle remade from scratch: Queen Coralie's bellhop
  // who runs the bubble lifts at the Coral Gate, a fluffy sea bunny slug in the palace's coral cap, on
  // its own copy of the snail with the shell taken off: render/seabunny/). It glides on its foot (the
  // ripples run from the distance glided), and between glides stands for `rest` seconds, long enough
  // for a piece of its act. Its box is its body and head (its ears and cap reach above it).
  jellymaid: mob({
    id: 'jellymaid', name: 'Sea Bunny Bellhop', level: 20, hp: 980, atk: 76, def: 16, acc: 60, eva: 9, exp: 420, gold: [8, 16],
    speed: 32, rest: [8, 13], w: 30, h: 25, art: 'jellymaid', moves: ['whap', 'bump', 'capflip'], drops: [{ id: 'jelly_ribbon', chance: 0.4 }, { id: 'tide_pearl', chance: 0.06 }, { id: 'sailor_top', chance: 0.01 }],
    fight: { every: 1.9, reach: 40, windup: 0.4 },
  }),
  // The Sailfish Fencer (2026-11-26, the Seahorse Squire remade from scratch, the id kept: a chubby
  // sailfish, the fencing master of Queen Coralie's palace guard, vain and terribly proper; his own
  // rounded bill is his épée, a pearl fencing button on its tip; his sail of a dorsal rises for "En
  // garde!"; a coral sash with a pearl clasp; on his own copy of the fish base's round fish,
  // render/sailfish/). The tank of the household, with the longest reach: Lunge, Flèche and
  // Parry-Riposte (`moves`, in turn). He floats a hand's height over the floor; between swims he rests
  // for `rest` seconds, long enough for a piece of his act. His box is his body, wider than tall (his
  // bill and sail reach past it).
  seahorseknight: mob({
    id: 'seahorseknight', name: 'Sailfish Fencer', level: 21, hp: 1500, atk: 84, def: 30, acc: 62, eva: 4, exp: 540, gold: [9, 19],
    speed: 40, rest: [8, 13], w: 34, h: 23, art: 'seahorseknight', moves: ['lunge', 'fleche', 'parry'], drops: [{ id: 'sea_glass', chance: 0.4 }, { id: 'tide_pearl', chance: 0.08 }],
    fight: { every: 2.1, reach: 46, windup: 0.5 },
  }),
  // The Dumbo Lamplighter (2026-11-26, the Lantern Angler remade from scratch, the id kept: one of Lady
  // Abyssia's "darlings", a tiny dumbo octopus who carries a violet sea-glass lantern down into the Ink
  // Abyss for her, and is scared of the dark; on its own copy of the tentacle base's octopus, render/
  // dumbo/). Not on the maps: Lady Abyssia calls two in her fight. It hovers a hand's height over the
  // floor on its ear fins (not a flyer); between swims it rests for `rest` seconds, long enough for a
  // piece of its act. Moves: Glare, Lantern Bonk, Ear Slap (in turn). Its box is its body.
  anglerlamp: mob({
    id: 'anglerlamp', name: 'Dumbo Lamplighter', level: 22, hp: 1200, atk: 92, def: 18, acc: 64, eva: 8, exp: 560, gold: [9, 20],
    speed: 48, rest: [8, 13], w: 28, h: 34, art: 'anglerlamp', moves: ['glare', 'bonk', 'earslap'], drops: [{ id: 'wisp_flame', chance: 0.35 }, { id: 'tide_pearl', chance: 0.08 }],
    fight: { every: 2, reach: 36, windup: 0.55 },
  }),
  // The Beluga Lifeguard (2026-11-26, the Pearl Otter remade from scratch, the id kept: a chubby beluga
  // calf, Queen Coralie's palace lifeguard, very much on duty at the bottom of the sea; a coral rescue
  // float on a strap with a pearl clasp, a whistle, a sun visor; on its own copy of the fish base's whale
  // calf, render/beluga/). From afar it blows a bubble ring like a life ring (`shot`, render/beluga/
  // index.js bubbleRingShot); close up, a bonk with its float and a whistle blast. It floats a hand's
  // height over the floor and keeps to it (not a flyer). Between swims it rests for `rest` seconds, long
  // enough for a piece of its act. Its box is its body, wider than tall.
  pearldiver: mob({
    id: 'pearldiver', name: 'Beluga Lifeguard', level: 21, hp: 1050, atk: 80, def: 16, acc: 62, eva: 8, exp: 500, gold: [9, 18],
    speed: 44, rest: [8, 13], w: 35, h: 25, art: 'pearldiver', moves: ['rescueRing', 'buoyBonk', 'whistleBlast'], drops: [{ id: 'sea_glass', chance: 0.35 }, { id: 'tide_pearl', chance: 0.1 }, { gear: 'earring', chance: 0.01 }],
    fight: { every: 2.2, reach: 30, windup: 0.45, range: 160, shot: 'bubblering' },
  }),
  // The Sea Angel (2026-11-26, the Star Twirler remade from scratch, the id kept: a little sea angel,
  // a soprano in Queen Coralie's palace choir, flying on two wing-flaps, her coral-pink heart glowing in
  // her chest, a halo of bubbles over her head, the palace's coral ribbon collar with a pearl; on her own
  // copy of the fish base's seahorse, render/seaangel/). She floats a hand's height over the floor and
  // keeps to it (not a flyer). Between swims she rests for `rest` seconds, long enough for a piece of
  // her act. Moves: Wing Slap, Heart Swoop, High C (all close up, quick to match her fast swings).
  stardancer: mob({
    id: 'stardancer', name: 'Sea Angel', level: 20, hp: 1000, atk: 78, def: 18, acc: 60, eva: 10, exp: 440, gold: [8, 17],
    speed: 50, rest: [8, 13], w: 24, h: 38, art: 'stardancer', moves: ['slap', 'swoop', 'highC'], drops: [{ id: 'sea_glass', chance: 0.3 }, { id: 'tide_pearl', chance: 0.06 }],
    fight: { every: 1.7, reach: 38, windup: 0.35 },
  }),
  // The Axolotl Librarian (2026-11-26, the Octo Scholar remade from scratch, the id kept: a chubby pink
  // axolotl, Queen Coralie's prim palace librarian, who shushes everyone and secretly adores loud
  // adventure stories; a coral cardigan with pearl buttons, half-moon glasses, a soggy book; on its own
  // copy of the creature base, render/axolotl/). From afar it tears out a page, folds it into a paper
  // boat and tosses it (`shot`, render/axolotl/index.js paperBoatShot); close up, a Book Slam and a
  // stern Shush. A slow little waddle. Between walks it rests for `rest` seconds, long enough for a
  // piece of its act.
  octoscholar: mob({
    id: 'octoscholar', name: 'Axolotl Librarian', level: 23, hp: 1350, atk: 88, def: 20, acc: 66, eva: 6, exp: 600, gold: [10, 21],
    speed: 30, rest: [8, 13], w: 34, h: 40, art: 'octoscholar', moves: ['paperBoat', 'bookSlam', 'shush'], drops: [{ id: 'tide_pearl', chance: 0.1 }, { id: 'white_potion', chance: 0.3 }, { id: 'school_blazer', chance: 0.01 }],
    fight: { every: 2.3, reach: 32, windup: 0.5, range: 150, shot: 'paperboat' },
  }),
  // The Twin Morays, Murri and Ena (remade 2026-11-26 from scratch as two chibi moray eel sisters,
  // render/moray/, with a new fight, world/aquarium.js: Peekaboo, Tangle Time, Not Fair!).
  // (Health sized from runs of that fight, 2026-11-26, on the same autopilot as tests/dungeon.test.js:
  // 24k each went in 55 s for a level-22 group; at 56k each, 83-118 s over six groups (103 s on
  // average), no wipes; the autopilot never stands the picked two together on purpose, so a group
  // that tangles the sisters (half again from every blow for 7 s) is a little quicker.)
  moraymurri: mob({
    id: 'moraymurri', name: 'Murri, the Twin Moray', level: 22, hp: 56000, atk: 138, def: 30, acc: 70, eva: 5, exp: 9000, gold: [240, 340],
    speed: 44, w: 80, h: 40, art: 'moraymurri', boss: true,
    drops: [{ id: 'tide_pearl', chance: 1, qty: 2 }, { id: 'white_potion', chance: 1, qty: 10 }],
    fight: { every: 1.8, reach: 64, windup: 0.5 }, mech: 'moray',
  }),
  morayena: mob({
    id: 'morayena', name: 'Ena, the Twin Moray', level: 22, hp: 56000, atk: 138, def: 30, acc: 70, eva: 5, exp: 9000, gold: [240, 340],
    speed: 44, w: 80, h: 40, art: 'morayena', boss: true,
    drops: [{ id: 'tide_pearl', chance: 1, qty: 2 }, { id: 'orange_potion', chance: 1, qty: 10 }],
    fight: { every: 1.8, reach: 64, windup: 0.5 }, mech: 'moray',
  }),
  // Lady Abyssia, the Sea Witch (remade 2026-11-26 from scratch as a little octopus sea witch, render/
  // abyssia/, with a new fight, world/aquarium.js: Lights Out!, her darlings' lanterns, the lanterns
  // adrift). She floats; her box is her body under her hat.
  // (Health sized from runs of that fight, 2026-11-26, on the same autopilot as tests/dungeon.test.js:
  // her old 50k went in 52 s for a level-23 group, 100k in 90-101 s; at 110k, 92-122 s over six groups
  // (102 s on average), her darlings called in each time, no wipes.)
  abyssia: mob({
    id: 'abyssia', name: 'Lady Abyssia, the Sea Witch', level: 23, hp: 110000, atk: 146, def: 32, acc: 72, eva: 4, exp: 14000, gold: [270, 410],
    speed: 26, w: 64, h: 124, art: 'abyssia', boss: true,
    drops: [{ id: 'tide_pearl', chance: 1, qty: 3 }, { id: 'mana_elixir', chance: 1, qty: 5 }],
    fight: { every: 2.1, reach: 80, windup: 0.55 }, mech: 'abyssia',
  }),
  // Queen Coralie's Keepsake Bubble: it drifts after someone and keeps them till it's popped
  // (world/aquarium.js); it never strikes.
  keepsake: mob({
    id: 'keepsake', name: 'Keepsake Bubble', level: 25, hp: 900, atk: 1, def: 6, acc: 60, eva: 0, exp: 0, gold: [0, 0],
    speed: 30, w: 36, h: 44, art: 'keepsake', drops: [],
    fight: { every: 999, reach: 0, windup: 0.5 },
  }),
  // Queen Coralie, the Drowned Queen (remade 2026-11-26 from scratch as a young mermaid queen in her
  // own livery, render/coralie/, with a new fight, world/aquarium.js: Display Cases, the Royal Portrait,
  // Glass Walls). She floats; her box is her body under her crown.
  // (Health sized from runs of that fight, 2026-11-26, on the same autopilot as tests/dungeon.test.js:
  // the old 62k went in 35-42 s for a level-25 group without her old untouchable tank phase, 160k in
  // 81-99 s; at 200k, 102-126 s over six groups (109 s on average), no wipes: the palace's last, a little
  // longer than the mid bosses.)
  coralie: mob({
    id: 'coralie', name: 'Queen Coralie, the Drowned Queen', level: 25, hp: 200000, atk: 160, def: 36, acc: 76, eva: 5, exp: 24000, gold: [440, 650],
    speed: 30, w: 60, h: 124, art: 'coralie', boss: true,
    drops: [{ id: 'tide_pearl', chance: 1, qty: 5 }],
    fight: { every: 2, reach: 84, windup: 0.55 }, mech: 'coralie',
  }),


  // ---------- Clockwork Carnival (levels 25-30, docs/design/clockwork-carnival.md) ----------
  // The Giraffe Ballerina (2026-11-26, the Music Box Ballerina remade as a new creature; render/
  // musicballerina/, on her own copy of the creature base): Clara, the wind-up prima of the Midway's
  // music box. A dainty walker (her own pace on her long legs); `rest` long enough for a piece of her
  // act; moves: Grand Jeté, Fouetté, Arabesque Headbutt.
  musicballerina: mob({
    id: 'musicballerina', name: 'Giraffe Ballerina', level: 25, hp: 1500, atk: 98, def: 22, acc: 74, eva: 10, exp: 700, gold: [11, 23],
    speed: 22, rest: [9, 14], w: 28, h: 56, art: 'musicballerina', moves: ['jete', 'fouette', 'arabesque'], drops: [{ id: 'music_cylinder', chance: 0.35 }, { id: 'golden_ticket', chance: 0.06 }],
    fight: { every: 1.9, reach: 40, windup: 0.4 },
  }),
  // The Cymbal Monkey (2026-11-26, the Tin Drummer remade as a new creature; render/tindrummer/, on his
  // own copy of the creature base): Bingo, the carnival band's wind-up cymbal man. His own marching
  // pace; `rest` long enough for a piece of his act; from afar a CRASH that rolls a ring of sound at
  // you (`clang`), up close Cymbal Clap and Cymbal Spin.
  tindrummer: mob({
    id: 'tindrummer', name: 'Cymbal Monkey', level: 26, hp: 1800, atk: 104, def: 30, acc: 76, eva: 5, exp: 800, gold: [12, 24],
    speed: 16, rest: [9, 14], w: 28, h: 42, art: 'tindrummer', moves: ['crash', 'clap', 'spin'], drops: [{ id: 'tin_spring', chance: 0.4 }, { id: 'golden_ticket', chance: 0.08 }],
    fight: { every: 2.1, reach: 36, windup: 0.5, range: 140, shot: 'clang' },
  }),
  // The Boxing Kangaroo (2026-11-26, the Jack-in-the-Box remade as a new creature; render/jackbox/, on
  // her own copy of the creature base): Jacky, the Funhouse's bouncer, and her joey who pops out of
  // her pouch like a jack-in-the-box. Her own bouncing pace; `rest` long enough for a piece of her
  // act; moves: One-Two, Tail Kick, Pop Goes the Joey.
  jackbox: mob({
    id: 'jackbox', name: 'Boxing Kangaroo', level: 26, hp: 1650, atk: 108, def: 24, acc: 76, eva: 8, exp: 780, gold: [12, 24],
    speed: 26, rest: [9, 14], w: 30, h: 48, art: 'jackbox', moves: ['onetwo', 'kick', 'joey'], drops: [{ id: 'tin_spring', chance: 0.4 }, { id: 'golden_ticket', chance: 0.08 }],
    fight: { every: 2, reach: 48, windup: 0.5 },
  }),
  // The Harlequin Puppet (2026-11-26, the Marionette Dancer remade as a new character; render/
  // marionette/, on her own copy of the blank kid base): Dot, one of Madame Marionette's wooden
  // harlequins, danced on strings from a floating cross (the Madame cuts her loose on the belts). Her
  // own puppet's pace; `rest` long enough for a piece of her act; moves: String Kick, Pirouette Slap,
  // Bell Bonk.
  marionette: mob({
    id: 'marionette', name: 'Harlequin Puppet', level: 27, hp: 1600, atk: 110, def: 22, acc: 78, eva: 12, exp: 820, gold: [12, 25],
    speed: 20, rest: [9, 14], w: 28, h: 46, art: 'marionette', moves: ['kick', 'spin', 'bells'], drops: [{ id: 'music_cylinder', chance: 0.3 }, { id: 'golden_ticket', chance: 0.08 }],
    fight: { every: 1.7, reach: 40, windup: 0.35 },
  }),
  // The Hippo Strongman (2026-11-26, Teddy Strongbear remade as a new creature; render/teddystrong/, on
  // his own copy of the creature base): Hugo, the carnival's strongman, a barbell across his shoulders.
  // A heavy proud plod; `rest` long enough for a piece of his act; moves: Barbell Slam, Belly Bump,
  // Big Yawn.
  teddystrong: mob({
    id: 'teddystrong', name: 'Hippo Strongman', level: 28, hp: 2600, atk: 122, def: 36, acc: 78, eva: 3, exp: 1050, gold: [14, 28],
    speed: 16, rest: [9, 14], w: 38, h: 48, art: 'teddystrong', moves: ['slam', 'bump', 'yawn'], drops: [{ id: 'tin_spring', chance: 0.5 }, { id: 'golden_ticket', chance: 0.12 }],
    fight: { every: 2.4, reach: 52, windup: 0.7 },
  }),
  // The Koala Balloonist (2026-11-26, the Balloon Seller remade as a new creature; render/balloonseller/,
  // on her own copy of the creature base): Mabel, the Midway's sleepy balloon seller. Short legs: her
  // own plodding pace; `rest` long enough for a piece of her act; from afar she lets a balloon go at
  // you (`balloon`), up close Bunch Bonk and Dozy Headbutt.
  balloonseller: mob({
    id: 'balloonseller', name: 'Koala Balloonist', level: 25, hp: 1400, atk: 96, def: 18, acc: 74, eva: 12, exp: 680, gold: [11, 22],
    speed: 14, rest: [9, 14], w: 30, h: 44, art: 'balloonseller', moves: ['pop', 'bonk', 'nod'], drops: [{ id: 'golden_ticket', chance: 0.08 }, { id: 'white_potion', chance: 0.3 }],
    fight: { every: 2.2, reach: 30, windup: 0.45, range: 160, shot: 'balloon' },
  }),
  // Leonie, the Lioness Acrobat (redrawn from scratch 2026-11-27 as the wind-up lioness acrobat, head of
  // Queen Gearheart's troupe, render/leonie/, with a new fight, world/carnival.js: the Warm-Up, the
  // Trapeze, the Grand Finale).
  // (Health sized from runs of that fight, 2026-11-27, on the same autopilot as tests/dungeon.test.js:
  // the old 88k went in 57-72 s for a level-27 group; at 150k, 100-120 s over four groups, no wipes.)
  leonie: mob({
    id: 'leonie', name: 'Leonie, the Lioness Acrobat', level: 27, hp: 150000, atk: 170, def: 38, acc: 82, eva: 6, exp: 20000, gold: [380, 550],
    speed: 20, w: 50, h: 84, art: 'leonie', boss: true,
    drops: [{ id: 'golden_ticket', chance: 1, qty: 3 }, { id: 'white_potion', chance: 1, qty: 12 }],
    fight: { every: 1.7, reach: 62, windup: 0.45 }, mech: 'leonie',
  }),
  // Madame Marionette (redrawn from scratch 2026-11-27 as the troupe's porcelain puppeteer, the first of
  // the Workshop's harlequins, render/marionetta/, with a new fight, world/carnival.js: the Rehearsal,
  // the Puppet Show, Dance for Me!).
  // (Health sized from runs of that fight, 2026-11-27, on the same autopilot as tests/dungeon.test.js:
  // the old 95k went in 70 s for a level-28 group; at 145k, 92-120 s over four groups, no wipes.)
  marionetta: mob({
    id: 'marionetta', name: 'Madame Marionette', level: 28, hp: 145000, atk: 176, def: 40, acc: 84, eva: 5, exp: 24000, gold: [410, 600],
    speed: 22, w: 46, h: 104, art: 'marionetta', boss: true,
    drops: [{ id: 'golden_ticket', chance: 1, qty: 3 }, { id: 'mana_elixir', chance: 1, qty: 6 }],
    fight: { every: 2, reach: 76, windup: 0.5 }, mech: 'marionetta',
  }),
  // One of Queen Gearheart's Brass Moles (redrawn from scratch 2026-11-27 as a tin wind-up mole,
  // render/gearmole/): called up out of the plaza's holes by her Wind Me Up! to wind her, for a few
  // seconds; never strikes (world/carnival.js).
  gearmole: mob({
    id: 'gearmole', name: 'Brass Mole', level: 30, hp: 450, atk: 1, def: 10, acc: 60, eva: 0, exp: 0, gold: [0, 0],
    speed: 0, w: 28, h: 36, art: 'gearmole', drops: [],
    fight: { every: 999, reach: 0, windup: 0.5 },
  }),
  // Queen Gearheart (redrawn from scratch 2026-11-27 as a tin wind-up mouse queen, the one who winds the
  // whole troupe, render/gearheart/, with a new fight, world/carnival.js: Wind-Up, the Music Box, the Last
  // Waltz, her Brass Moles winding her).
  // (Health sized from runs of that fight, 2026-11-27, on the same autopilot as tests/dungeon.test.js:
  // the old 115k went in 90 s for a level-30 group; at 175k, 100-115 s over four groups, no wipes.)
  gearheart: mob({
    id: 'gearheart', name: 'Queen Gearheart, the Grand Automaton', level: 30, hp: 175000, atk: 190, def: 44, acc: 88, eva: 5, exp: 36000, gold: [570, 830],
    speed: 20, w: 48, h: 100, art: 'gearheart', boss: true,
    drops: [{ id: 'golden_ticket', chance: 1, qty: 5 }],
    fight: { every: 2, reach: 82, windup: 0.55 }, mech: 'gearheart',
  }),


  // ---------- Star Observatory (levels 30-35, docs/design/star-observatory.md) ----------
  // The Star Glider (2026-11-26, the Comet Courier remade from scratch, render/glider/): a sugar glider
  // of the Starlit Stair who catches the falling stars in its pouch. It roams at a little critter's
  // walk (44: quicker steps were a blur of short legs) and dashes in its Glide Swoop; `rest` long
  // enough for a piece of its idle act. (The id stays for saves.)
  cometcourier: mob({
    id: 'cometcourier', name: 'Star Glider', level: 30, hp: 2300, atk: 124, def: 30, acc: 90, eva: 14, exp: 1150, gold: [15, 30],
    speed: 44, rest: [8, 13], w: 28, h: 44, art: 'cometcourier', moves: ['swoop', 'toss', 'twirl'], drops: [{ id: 'stardust', chance: 0.35 }, { id: 'astral_shard', chance: 0.06 }],
    fight: { every: 1.8, reach: 42, windup: 0.4 },
  }),
  // The Nebula Knitter (2026-11-26, the Nebula Witch remade from scratch, render/alpaca/): an alpaca
  // whose fleece is a star nursery; she knits the night sky and throws her ball of nebula yarn (`shot`).
  // (The star beret she drops is her own knitted beret. The id stays for saves.)
  nebulawitch: mob({
    id: 'nebulawitch', name: 'Nebula Knitter', level: 31, hp: 2200, atk: 132, def: 26, acc: 94, eva: 10, exp: 1200, gold: [16, 31],
    speed: 34, rest: [8, 13], w: 32, h: 60, art: 'nebulawitch', moves: ['yarn', 'needle', 'fluff'], drops: [{ id: 'stardust', chance: 0.4 }, { id: 'astral_shard', chance: 0.08 }, { id: 'star_beret', chance: 0.01 }],
    fight: { every: 2.3, reach: 30, windup: 0.55, range: 170, shot: 'nebulayarn' },
  }),
  // The Constellation Starfish (2026-11-27, new in the Spyglass Loris's place, render/constellation/): a
  // little star that fell into the observatory and stayed to chart the sky, its tips glowing gold; it
  // tiptoes and cartwheels, and flicks a little gold star at you ('starglint'). (The id stays for saves.)
  starcarto: mob({
    id: 'starcarto', name: 'Constellation Starfish', level: 31, hp: 2400, atk: 128, def: 30, acc: 92, eva: 10, exp: 1220, gold: [16, 31],
    speed: 20, rest: [8, 13], w: 34, h: 38, art: 'starcarto', moves: ['slap', 'grab', 'spin'], drops: [{ id: 'astral_shard', chance: 0.08 }, { id: 'white_potion', chance: 0.3 }, { id: 'encore_rose', chance: 0.06 }],
    fight: { every: 2.1, reach: 30, windup: 0.5, range: 150, shot: 'starglint' },
  }),
  // The Raven Scribe (2026-11-26, the Owl Librarian remade from scratch, render/raven/): the Archive's
  // copyist, a raven who copies the star records out in starlight ink (Folio calls them to her). It
  // walks with a raven's swagger (32: quicker and its little legs blurred). Its drop is its own Starlit
  // Quill. (The id stays for saves and quest counts.)
  mothlibrarian: mob({
    id: 'mothlibrarian', name: 'Raven Scribe', level: 32, hp: 2500, atk: 134, def: 28, acc: 94, eva: 12, exp: 1300, gold: [16, 32],
    speed: 32, rest: [8, 13], w: 30, h: 44, art: 'mothlibrarian', moves: ['quill', 'ink', 'pages'], drops: [{ id: 'moth_scale', chance: 0.4 }, { id: 'astral_shard', chance: 0.08 }],
    fight: { every: 1.9, reach: 38, windup: 0.4 },
  }),
  // The Meteor Maiden (2026-11-22, replacing the Meteor Golem; rebuilt 2026-11-26 to today's standard on
  // her own copy of the kid base, render/meteormaiden/): a fallen-star tomboy with rock gauntlets and a
  // comet for a ponytail. She strolls (an unhurried 22: her legs are short and quick steps looked
  // frantic), and fights with a Meteor Smash, a Shooting Star uppercut and a Comet Combo; `rest` long
  // enough for a piece of her idle act. (The id stays for saves and quests.)
  meteorgolem: mob({
    id: 'meteorgolem', name: 'Meteor Maiden', level: 33, hp: 3800, atk: 150, def: 46, acc: 94, eva: 4, exp: 1600, gold: [18, 35],
    speed: 22, rest: [8, 13], w: 28, h: 44, art: 'meteormaiden', moves: ['smash', 'uppercut', 'combo'], drops: [{ id: 'meteorite', chance: 0.45 }, { id: 'astral_shard', chance: 0.12 }],
    // (Her smash winds up long and slow: the gauntlet raised high, sparks gathering.)
    fight: { every: 2.4, reach: 46, windup: 0.65 },
  }),
  geminighosts: mob({
    id: 'geminighosts', name: 'Gemini Ghosts', level: 30, hp: 2100, atk: 120, def: 22, acc: 90, eva: 16, exp: 1100, gold: [15, 30],
    // (the Mirror Twins, 2026-11-24: render/gemini/; a star clap and a star dash)
    speed: 48, w: 34, h: 48, art: 'geminighosts', moves: ['starClap', 'starDash'], drops: [{ id: 'astral_shard', chance: 0.06 }, { id: 'mana_elixir', chance: 0.3 }, { gear: 'earring', chance: 0.01 }],
    fight: { every: 1.7, reach: 40, windup: 0.35 },
  }),
  // (Folio, the Twins and Astraea fight a fixed FFXIV-style rotation now, world/observatory.js:
  // their health raised on 2026-11-18 so a group sees every phase's whole rotation: a live run with
  // a level 34 group took Folio down in 35 s, the Twins in 30 s and Astraea's last two phases in
  // 12 s each, without a cast; now about 1.5 to 2 minutes of fighting each.)
  // Folio, the Archivist (remade 2026-11-27 from scratch as a prim young snowy owl of a librarian,
  // render/folio/, with a new fight, world/observatory.js: Toppling Stacks and the Reading Nook, Noted, Top
  // Shelf / Bottom Shelf, Closing Time). Her box is her body under her bun.
  // (Health sized from runs of that fight, 2026-11-27, on the same autopilot as tests/dungeon.test.js:
  // the old 350k went in 83 s for a level-32 group; at 440k, 86-127 s over six groups (101 s on average), no
  // wipes.)
  folio: mob({
    id: 'folio', name: 'Folio, the Archivist', level: 32, hp: 440000, atk: 200, def: 46, acc: 98, eva: 6, exp: 30000, gold: [490, 700],
    speed: 32, w: 56, h: 112, art: 'folio', boss: true,
    drops: [{ id: 'astral_shard', chance: 1, qty: 3 }, { id: 'white_potion', chance: 1, qty: 14 }],
    fight: { every: 2, reach: 70, windup: 0.5 }, mech: 'folio',
  }),
  // Sol and Luna, the Eclipse Twins (remade 2026-11-27 from scratch as a fox-eared sun girl and a
  // rabbit-eared moon girl, render/eclipse/, with a new duo fight, world/observatory.js: Opposition,
  // Conjunction, Crossing, Moon Mallet, Share the Mochi; one alone fights on for both).
  // (Health sized from runs of that fight, 2026-11-27, on the same autopilot as tests/dungeon.test.js:
  // the old 210k each went in 91 s for a level-33 group, 250k in 93-157 s; at 220k each, 82-134 s over six
  // groups (102 s on average: the slower groups' sisters dash further from their damage dealers), no wipes.)
  eclipsesol: mob({
    id: 'eclipsesol', name: 'Sol, the Eclipse Twin', level: 33, hp: 220000, atk: 196, def: 44, acc: 98, eva: 6, exp: 18000, gold: [360, 520],
    speed: 36, w: 46, h: 96, art: 'eclipsesol', boss: true,
    drops: [{ id: 'astral_shard', chance: 1, qty: 2 }, { id: 'elixir', chance: 1, qty: 2 }],
    fight: { every: 1.9, reach: 62, windup: 0.5 }, mech: 'eclipse',
  }),
  eclipseluna: mob({
    id: 'eclipseluna', name: 'Luna, the Eclipse Twin', level: 33, hp: 220000, atk: 196, def: 44, acc: 98, eva: 6, exp: 18000, gold: [360, 520],
    speed: 36, w: 44, h: 90, art: 'eclipseluna', boss: true,
    drops: [{ id: 'astral_shard', chance: 1, qty: 2 }, { id: 'mana_elixir', chance: 1, qty: 6 }],
    fight: { every: 1.9, reach: 62, windup: 0.5 }, mech: 'eclipse',
  }),
  // Astraea, the Star Keeper (remade 2026-11-27 from scratch as a small, gentle star keeper in a night-sky
  // cloak with her star abacus, render/astraea/, with a new fight, world/observatory.js: Tally, Head Count,
  // Catch a Falling Star, A Thousand Lights; Star Charts; Let Them Fall). Her box is her body under her hair.
  // (Health sized from runs of that fight, 2026-11-27, on the same autopilot as tests/dungeon.test.js, a
  // level-35 group: the old 680k went in 136-210 s, 440k in 87-135 s (the quickest never saw the last
  // phase's whole rotation); at 480k, 99-151 s over six groups (121 s on average, every phase's key casts
  // seen even by the quickest), no wipes.)
  astraea: mob({
    id: 'astraea', name: 'Astraea, the Star Keeper', level: 35, hp: 480000, atk: 214, def: 50, acc: 104, eva: 6, exp: 52000, gold: [720, 1000],
    speed: 30, w: 56, h: 118, art: 'astraea', boss: true,
    drops: [{ id: 'astral_shard', chance: 1, qty: 5 }],
    fight: { every: 2, reach: 72, windup: 0.55 }, mech: 'astraea',
  }),


  // ---------- Candy Volcano (levels 35-40, docs/design/candy-volcano.md) ----------
  // The Strawberry Calf (2026-11-27, the Gummy Bear Brawler remade from scratch, render/calf/): a
  // strawberry-milk calf of the Gumdrop Hills with a gumdrop for a cowbell. It ambles (30: a calf's
  // unhurried walk, its head nodding with each step) and fights with a Head Butt, a Hoof Stamp and a
  // Bell Clang; `rest` long enough for a piece of its idle act. (The id stays for saves.)
  gummybear: mob({
    id: 'gummybear', name: 'Strawberry Calf', level: 35, hp: 3600, atk: 160, def: 40, acc: 110, eva: 10, exp: 1700, gold: [20, 38],
    speed: 30, rest: [8, 13], w: 30, h: 47, art: 'gummybear', moves: ['butt', 'stamp', 'clang'], drops: [{ id: 'taffy_twist', chance: 0.4 }, { id: 'sugar_gem', chance: 0.06 }],
    fight: { every: 1.7, reach: 40, windup: 0.35 },
  }),
  // The Floss Chinchilla (2026-11-27, the Cotton Candy Sheep remade from scratch, render/chinchilla/): a
  // chinchilla whose fur is spun sugar; it bathes in powdered sugar and blows puffs of candy floss
  // (`shot`). It scurries (28: little steps). (The id stays for saves.)
  cottoncandy: mob({
    id: 'cottoncandy', name: 'Floss Chinchilla', level: 35, hp: 3000, atk: 156, def: 30, acc: 112, eva: 16, exp: 1650, gold: [20, 37],
    speed: 28, rest: [8, 13], w: 30, h: 46, art: 'cottoncandy', moves: ['puff', 'pop', 'shake'], drops: [{ id: 'taffy_twist', chance: 0.35 }, { id: 'sugar_gem', chance: 0.06 }],
    fight: { every: 2.2, reach: 30, windup: 0.5, range: 160, shot: 'flosspuff' },
  }),
  // The Swirl Chameleon (2026-11-27, the Lollipop Witch remade from scratch, render/chameleon/): a
  // chameleon with a swirl lollipop for a tail and candy stripes that ripple from colour to colour; its
  // sticky tongue flings gumdrops (`shot`). It walks a chameleon's slow rocking step (24). (The id
  // stays for saves.)
  lollipopwitch: mob({
    id: 'lollipopwitch', name: 'Swirl Chameleon', level: 36, hp: 3200, atk: 166, def: 32, acc: 114, eva: 12, exp: 1750, gold: [20, 38],
    speed: 24, rest: [8, 13], w: 30, h: 45, art: 'lollipopwitch', moves: ['fling', 'snap', 'whip'], drops: [{ id: 'sugar_gem', chance: 0.08 }, { id: 'mana_elixir', chance: 0.3 }],
    fight: { every: 2.3, reach: 30, windup: 0.55, range: 170, shot: 'gumdrop' },
  }),
  // The Mint Wrapper (2026-11-25 on the kid base, render/mintwrap/; rebuilt where it fell short
  // 2026-11-27: even blunt bangs, clean lashes, its idle act in pieces that fit `rest`, its own marks, a
  // third move, the Crinkle Clap). A cheeky kid of the bakery still in their sweet wrapper; a calmer
  // walk (30). (The id stays for saves.)
  peppermint: mob({
    id: 'peppermint', name: 'Mint Wrapper', level: 37, hp: 3400, atk: 170, def: 34, acc: 116, eva: 16, exp: 1850, gold: [21, 40],
    speed: 30, rest: [8, 13], w: 28, h: 33, art: 'peppermint', moves: ['mintSpin', 'mintFlick', 'mintClap'], drops: [{ id: 'sugar_gem', chance: 0.08 }, { id: 'taffy_twist', chance: 0.3 }],
    fight: { every: 1.8, reach: 44, windup: 0.35 },
  }),
  // The Truffle Ladybug (2026-11-27, new in the Cocoa Badger's place, render/trufflebug/): a ladybug whose
  // shell is a chocolate truffle, pink icing and a cherry on top (the cocoa beans it drops); it tiptoes at a
  // ladybug's pace (20) and flies when it hurries. Moves: a shell bash, a tumble, a hop-and-slam. (The id
  // stays for saves.)
  chocoknight: mob({
    id: 'chocoknight', name: 'Truffle Ladybug', level: 38, hp: 5200, atk: 184, def: 56, acc: 116, eva: 4, exp: 2300, gold: [24, 45],
    speed: 20, rest: [8, 13], w: 30, h: 26, art: 'chocoknight', moves: ['bash', 'spin', 'slam'], drops: [{ id: 'cocoa_bean', chance: 0.45 }, { id: 'sugar_gem', chance: 0.12 }],
    fight: { every: 2.3, reach: 50, windup: 0.6 },
  }),
  // The Gummy Caterpillar (2026-11-27, new in the Jelly Bean Meerkat's place, render/gummypillar/): a
  // caterpillar of fruit gummies, a flavour to each segment; it slurps licorice laces and flicks jelly
  // beans at you ('jellybean'). It crawls at a caterpillar's pace (15). (The id stays for saves.)
  jellyninja: mob({
    id: 'jellyninja', name: 'Gummy Caterpillar', level: 37, hp: 3100, atk: 172, def: 30, acc: 120, eva: 20, exp: 1800, gold: [21, 39],
    speed: 15, rest: [8, 13], w: 43, h: 24, art: 'jellyninja', moves: ['bonk', 'roll', 'slam'], drops: [{ id: 'sugar_gem', chance: 0.08 }, { id: 'white_potion', chance: 0.3 }],
    fight: { every: 2, reach: 30, windup: 0.4, range: 150, shot: 'jellybean' },
  }),
  // (The Candy Volcano's bosses: health raised on 2026-11-19 so a group fights each for about a
  // minute and a half (a live run at level 37 took Toffee down in 25 s, her moves barely seen).)
  // Toffee (2026-11-27, remade from scratch: a caramel salamander smith with a hard-crack caramel
  // hammer and her anvil on her back, render/toffee/; her new fight in world/volcano.js: Soft Ball, Hard
  // Ball, Hard Crack).
  // (Health sized from runs of that fight, 2026-11-27, on the same autopilot as tests/dungeon.test.js, a
  // level-37 group: at 500k, 89-134 s over six groups (106 s on average, every phase's buster, spread,
  // stack and raid-wide seen even by the quickest), no wipes.)
  toffee: mob({
    id: 'toffee', name: 'Toffee, the Caramel Smith', level: 37, hp: 500000, atk: 236, def: 56, acc: 120, eva: 6, exp: 42000, gold: [620, 870],
    speed: 26, w: 58, h: 89, art: 'toffee', boss: true,
    drops: [{ id: 'sugar_gem', chance: 1, qty: 3 }, { id: 'white_potion', chance: 1, qty: 16 }],
    fight: { every: 2.1, reach: 70, windup: 0.6 }, mech: 'toffee',
  }),
  // Gretel (2026-11-27, remade from scratch: a living gingerbread cookie knight in mint fondant armour with
  // an icing spatula and a heart cookie cutter, render/gretel/; her new fight in world/volcano.js: Rolled
  // Out, Cut Out, Into the Oven!).
  // (Health sized from runs of that fight, 2026-11-27, on the same autopilot as tests/dungeon.test.js, a
  // level-38 group: 520k went in 93-141 s (111 s on average, past Queen Bonbon's 84-119 s); at 500k,
  // 90-141 s over six groups (109 s on average, the cutters' in-out-in seen even by the quickest), no wipes.)
  gretel: mob({
    id: 'gretel', name: 'Gretel, the Gingerbread Knight', level: 38, hp: 500000, atk: 240, def: 60, acc: 122, eva: 6, exp: 46000, gold: [650, 920],
    speed: 32, w: 52, h: 89, art: 'gretel', boss: true,
    drops: [{ id: 'sugar_gem', chance: 1, qty: 3 }, { id: 'mana_elixir', chance: 1, qty: 8 }],
    fight: { every: 1.9, reach: 80, windup: 0.5 }, mech: 'gretel',
  }),
  bonbon: mob({
    id: 'bonbon', name: 'Queen Bonbon', level: 40, hp: 400000, atk: 252, def: 62, acc: 126, eva: 6, exp: 72000, gold: [870, 1200],
    // (the Strawberry Shortcake Queen, 2026-11-25, on the queen base; her own attacks with her spoon)
    speed: 26, w: 70, h: 109, art: 'bonbon', boss: true, moves: ['spoonBonk', 'spoonSweep'],
    drops: [{ id: 'sugar_gem', chance: 1, qty: 5 }],
    fight: { every: 2, reach: 86, windup: 0.55 }, mech: 'bonbon',
  }),
  // ---------- Dream Theatre (levels 40-45, docs/design/dream-theatre.md) ----------
  // The Masquerade Diva (the Understudy Ghost, remade 2026-11-25 and rebuilt to today's standard
  // 2026-11-27, render/diva/): a little ghost in the leading lady's borrowed gown, mask on a stick, playing
  // the star to an empty house. A stately glide (30). (The id stays for saves.)
  understudy: mob({
    id: 'understudy', name: 'Masquerade Diva', level: 40, hp: 4200, atk: 190, def: 40, acc: 126, eva: 16, exp: 2400, gold: [24, 44],
    speed: 30, rest: [9, 14], w: 30, h: 48, art: 'understudy', moves: ['divaAria', 'maskSwat', 'swoon'], drops: [{ id: 'script_page', chance: 0.4 }, { id: 'encore_rose', chance: 0.06 }],
    fight: { every: 1.9, reach: 42, windup: 0.4 },
  }),
  // The Ticket Lop (2026-11-27, new for the Grand Lobby in the Usher Otter's place; render/ticketlop/,
  // its own copy of the bunny base's lop): the lobby's usher, a caramel lop in a red usher's cap with a
  // ticket stub in its band and a bow tie. (The id stays for saves.)
  chorusgirl: mob({
    id: 'chorusgirl', name: 'Ticket Lop', level: 41, hp: 4400, atk: 196, def: 40, acc: 128, eva: 18, exp: 2500, gold: [25, 45],
    speed: 30, rest: [9, 14], w: 30, h: 32, art: 'chorusgirl', moves: ['bonk', 'thump'], drops: [{ id: 'sequin', chance: 0.4 }, { id: 'encore_rose', chance: 0.06 }],
    fight: { every: 1.7, reach: 44, windup: 0.35 },
  }),
  // The Curtain Octopus (2026-11-27, new for the Grand Lobby in the Backdrop Beaver's place;
  // render/curtain/, its own copy of the tentacle base): the theatre's stagehand, a rose octopus in a red
  // velvet curtain hood with a gold fringe and a headset. (The id stays for saves.)
  stagehand: mob({
    id: 'stagehand', name: 'Curtain Octopus', level: 40, hp: 4000, atk: 192, def: 46, acc: 124, eva: 14, exp: 2350, gold: [24, 43],
    speed: 16, rest: [9, 14], w: 32, h: 34, art: 'stagehand', moves: ['slap', 'grab', 'ink'], drops: [{ id: 'script_page', chance: 0.3 }, { id: 'white_potion', chance: 0.3 }, { id: 'encore_rose', chance: 0.06 }],
    fight: { every: 1.8, reach: 38, windup: 0.35 },
  }),
  // (Chapter 9, 2026-11-19: the train and the office are the Queen's old life. The ids stay, for
  // saves and Monster Book cards; the monsters were remade from scratch on 2026-11-27, each in its own
  // folder: render/pigeon/, snoozesnail/, fiddler/, sprout/.)
  // The Paperclip Fiddler (2026-11-27, new for Act II: The Office in the Red-Tape Raccoon's place;
  // render/fiddler/, its own copy of the crab base): a coral office fiddler crab with a red stapler for a
  // big claw, a paperclip and a sticky note on its shell; it still shoots red tape. (The id stays.)
  primadonna: mob({
    id: 'primadonna', name: 'Paperclip Fiddler', level: 42, hp: 5200, atk: 204, def: 44, acc: 130, eva: 8, exp: 2800, gold: [26, 48],
    speed: 24, rest: [9, 14], w: 34, h: 30, art: 'primadonna', moves: ['snap', 'pinch'], drops: [{ id: 'sequin', chance: 0.45 }, { id: 'encore_rose', chance: 0.1 }, { id: 'crystal_crown', chance: 0.01 }],
    fight: { every: 2.4, reach: 30, windup: 0.6, range: 180, shot: 'redtape' },
  }),
  // The Commuter Pigeon (2026-11-27, new for Act I: The Morning Train in the Toast-Dash Stoat's place:
  // the player wanted the late regulars to be new creatures that fit their place, each on its own base;
  // render/pigeon/, its own copy of the songbird base): a round chibi city pigeon in a coral scarf, its
  // ticket in its beak, the morning paper under its wing. (The id stays for saves.)
  paperdragon: mob({
    id: 'paperdragon', name: 'Commuter Pigeon', level: 43, hp: 6400, atk: 212, def: 52, acc: 130, eva: 10, exp: 3100, gold: [28, 50],
    speed: 40, rest: [9, 14], w: 26, h: 30, art: 'paperdragon', moves: ['peck', 'wingSlap', 'call'], drops: [{ id: 'script_page', chance: 0.4 }, { id: 'encore_rose', chance: 0.12 }],
    fight: { every: 2.1, reach: 44, windup: 0.5 },
  }),
  // The Snooze Snail (2026-11-27, new for Act I: The Morning Train in the Travel-Pillow Sloth's place;
  // render/snoozesnail/, its own copy of the shell crawler base): a sleepy lavender snail whose shell is its
  // ringing alarm clock; every morning it hits snooze. (The id stays for saves.)
  sleepysheep: mob({
    id: 'sleepysheep', name: 'Snooze Snail', level: 41, hp: 4800, atk: 198, def: 46, acc: 126, eva: 10, exp: 2600, gold: [25, 46],
    speed: 12, rest: [10, 15], w: 34, h: 30, art: 'sleepysheep', moves: ['glide', 'bonk', 'spin'], drops: [{ id: 'wool', chance: 0.4 }, { id: 'script_page', chance: 0.3 }, { id: 'encore_rose', chance: 0.06 }],
    fight: { every: 2, reach: 40, windup: 0.55 },
  }),
  // The Sticky-Note Sprout (2026-11-27, new for Act II: The Office in the Intern Quokka's place;
  // render/sprout/, its own copy of the veggie critter base): the office desk plant come alive, a coffee
  // mug of a body, sticky notes for seed-leaves; it still throws paper planes. (The id stays.)
  prompter: mob({
    id: 'prompter', name: 'Sticky-Note Sprout', level: 42, hp: 4300, atk: 200, def: 38, acc: 132, eva: 16, exp: 2700, gold: [25, 47],
    speed: 22, rest: [9, 14], w: 24, h: 34, art: 'prompter', moves: ['seedspit', 'leafslap'], drops: [{ id: 'script_page', chance: 0.45 }, { id: 'mana_elixir', chance: 0.2 }, { gear: 'earring', chance: 0.01 }],
    fight: { every: 2.2, reach: 30, windup: 0.5, range: 170, shot: 'paperplane' },
  }),
  // (Health sized from a live run, 2026-11-19: a level-43 group does about 6.5k a second to her,
  // her harder Comedy and softer Tragedy evened out; 600k is a fight of about a minute and a half.)
  persona: mob({
    id: 'persona', name: 'Persona, the Two-Faced Muse', level: 42, hp: 600000, atk: 262, def: 62, acc: 132, eva: 8, exp: 62000, gold: [740, 1000],
    speed: 34, w: 60, h: 100, art: 'persona', boss: true,
    drops: [{ id: 'encore_rose', chance: 1, qty: 3 }, { id: 'white_potion', chance: 1, qty: 18 }],
    fight: { every: 1.9, reach: 74, windup: 0.5 }, mech: 'persona',
  }),
  // (Health sized from a live run, 2026-11-19: about 6.2k a second from a level-43 group; 650k is
  // a fight of about a minute and three quarters.)
  directrice: mob({
    id: 'directrice', name: 'Madame Directrice', level: 43, hp: 650000, atk: 268, def: 64, acc: 134, eva: 6, exp: 66000, gold: [770, 1100],
    speed: 32, w: 64, h: 100, art: 'directrice', boss: true,
    drops: [{ id: 'encore_rose', chance: 1, qty: 3 }, { id: 'mana_elixir', chance: 1, qty: 9 }],
    fight: { every: 2, reach: 76, windup: 0.55 }, mech: 'directrice',
  }),
  // (Health sized from a live run, 2026-11-19: about 4k a second from the group against his
  // tougher hide; 480k is a final act of about two minutes.)
  playwright: mob({
    id: 'playwright', name: 'The Phantom Playwright', level: 45, hp: 480000, atk: 280, def: 68, acc: 138, eva: 8, exp: 96000, gold: [1000, 1400],
    speed: 28, w: 70, h: 120, art: 'playwright', boss: true,
    drops: [{ id: 'encore_rose', chance: 1, qty: 5 }],
    fight: { every: 2, reach: 88, windup: 0.55 }, mech: 'playwright',
  }),
  // The Queen's dream's own (Chapter 9, 2026-11-19; all three remade from scratch 2026-11-27 with new fights:
  // render/manager/, render/noodle/, render/monday/),
  // standing in for the three above in the theatre's last acts: her manager at Overtime, the
  // all-night snack at the 2 a.m. store, and Monday in her flat. (Health carried over from the acts
  // they replace, to be checked in a live run.)
  // (The Queen's dream's bosses, 2026-11-19: sized for about 1.5-2 minutes at the level-43 group's
  // ~6.5k a second (the bots alone do about half that); Monday's last 12% is the ending scene.)
  // The Night Manager (remade 2026-11-27 from scratch on his own copy of the grown-up base, render/manager/,
  // with a new fight, world/theatre.js: Nine to Five, Overtime, One More Thing: Quick Sync, Delegate, Circle
  // Back (in, then out), Reply All, Team Huddle, Clock Watching (TICK, then TOCK), Just One More Thing).
  // (Health sized from runs of that fight, 2026-11-27, on the same autopilot as tests/dungeon.test.js: the
  // old 620k went in about 100 s for a level-43 group; at 700k, 92-146 s over four groups, no wipes.)
  mugboss: mob({
    id: 'mugboss', name: 'The Night Manager', level: 42, hp: 700000, atk: 262, def: 62, acc: 132, eva: 8, exp: 62000, gold: [740, 1000],
    speed: 34, w: 60, h: 132, art: 'mugboss', boss: true,
    drops: [{ id: 'encore_rose', chance: 1, qty: 3 }, { id: 'white_potion', chance: 1, qty: 18 }],
    fight: { every: 1.9, reach: 74, windup: 0.5 }, mech: 'mugboss',
  }),
  // The Cup-Noodle Dragon (remade 2026-11-27 from scratch on his own copy of the serpent base, render/noodle/:
  // rising out of his own cup of noodles, his noodle tail looping out of it; a new fight, world/theatre.js: Just
  // Add Water, Three Minutes, Extra Spicy: Chopstick Pinch, SLUUURP (pulled in, then a burp), Noodle Toss,
  // Soup's On, Flavour Packet, Chopstick Drop, Lid Flip, Bottomless Bowl, Seconds). His three swings (the
  // chopstick jab, the pinch, the noodle lash) are his rig's own.
  // (Health sized from runs of that fight, 2026-11-27, on the same autopilot as tests/dungeon.test.js: at 680k,
  // 98-142 s over four groups, no wipes.)
  noodledragon: mob({
    id: 'noodledragon', name: 'The Cup-Noodle Dragon', level: 43, hp: 680000, atk: 268, def: 64, acc: 134, eva: 6, exp: 66000, gold: [770, 1100],
    speed: 32, w: 80, h: 128, art: 'noodledragon', boss: true,
    drops: [{ id: 'encore_rose', chance: 1, qty: 3 }, { id: 'mana_elixir', chance: 1, qty: 9 }],
    fight: { every: 2, reach: 80, windup: 0.55 }, mech: 'noodledragon',
  }),
  // Monday (remade 2026-11-27 from scratch on her own copy of the kid base, render/monday/: the Weekend-Eating
  // Baku, her giant red pen and the last of Saturday's cookie; a new fight, world/theatre.js: Good Morning, Rush
  // Hour, Always Monday: SEE ME, Unread, the Calendar (This Week, Next Week, No Weekends: stand on the weekend),
  // Wake-Up Call, All-Hands Meeting, Strikethrough, Snooze; at 12% the ending scene).
  // (Health sized from runs of that fight, 2026-11-27, on the same autopilot as tests/dungeon.test.js: at 740k,
  // 99-162 s to her 12% over four groups, no wipes; the dungeon's final boss runs a little longer.)
  monday: mob({
    id: 'monday', name: 'Monday', level: 45, hp: 740000, atk: 280, def: 68, acc: 138, eva: 8, exp: 96000, gold: [1000, 1400],
    speed: 28, w: 62, h: 138, art: 'monday', boss: true,
    drops: [{ id: 'encore_rose', chance: 1, qty: 5 }],
    fight: { every: 2, reach: 92, windup: 0.6 }, mech: 'monday',
  }),
  // ---------- Sky Whale's Back (levels 45-50, docs/design/sky-whale.md) ----------
  // The Sky Seahorse (2026-11-27, new in the Kite Pika's place, render/skyhorse/): a seahorse that swims
  // the sky over the great whale's back, a cloud mane and a sunrise belly; it whistles through its snout and
  // blows rings of cloud. It hovers a hand's height up at a seahorse's unhurried pace (18). Moves: a bubble,
  // a tail whip, a ram. (The id stays for saves.)
  kiterider: mob({
    id: 'kiterider', name: 'Sky Seahorse', level: 45, hp: 5200, atk: 220, def: 46, acc: 140, eva: 20, exp: 3300, gold: [28, 50],
    speed: 18, rest: [9, 14], w: 18, h: 44, art: 'kiterider', moves: ['bubble', 'tailWhip', 'ram'], drops: [{ id: 'sky_silk', chance: 0.4 }, { id: 'sky_scale', chance: 0.06 }],
    fight: { every: 1.8, reach: 44, windup: 0.35 },
  }),
  // The Airbloom Lamb (2026-11-27, new in the Cloudherd Samoyed's place, render/bloomlamb/): a lamb from the
  // whale's Lung Gardens whose fleece grew little air-blooms that open each time it breathes out, in time
  // with the whale; it grazes Starfall Heights' rim too, where the whale swims low. It trots at a lamb's
  // pace (22). Moves: a headbutt, a buck, a rear. (The id stays for saves.)
  shepherdess: mob({
    id: 'shepherdess', name: 'Airbloom Lamb', level: 45, hp: 5400, atk: 216, def: 46, acc: 138, eva: 14, exp: 3300, gold: [28, 50],
    speed: 22, rest: [9, 14], w: 34, h: 36, art: 'shepherdess', moves: ['headbutt', 'buck', 'rear'], drops: [{ id: 'sky_silk', chance: 0.45 }, { id: 'sky_scale', chance: 0.06 }],
    fight: { every: 1.9, reach: 46, windup: 0.4 },
  }),
  // Blunderpuss (2026-11-27, the Sky Pirate Gunner remade from scratch, render/blunderpuss/): Captain Gale's
  // youngest crew, a ginger kitten in a sailor's shirt with a brass blunderbuss it loads with cloud.
  gunner: mob({
    id: 'gunner', name: 'Blunderpuss', level: 46, hp: 5000, atk: 226, def: 44, acc: 144, eva: 14, exp: 3400, gold: [29, 53],
    speed: 26, rest: [9, 14], w: 26, h: 41, art: 'gunner', moves: ['blast', 'bonk', 'bat'], drops: [{ id: 'sky_scale', chance: 0.08 }, { id: 'white_potion', chance: 0.3 }, { id: 'encore_rose', chance: 0.06 }],
    fight: { every: 2.3, reach: 30, windup: 0.55, range: 190, shot: 'cloudball' },
  }),
  // The Turtle Squire (2026-11-27, the Barnacle Knight remade from scratch, render/turtlesquire/): one of
  // the Barnacle Matriarch's squires, a young sea turtle in a surcoat and a scallop helm, barnacles on its
  // shell like medals; it fights with its scallop shield and its own shell.
  barnacleknight: mob({
    id: 'barnacleknight', name: 'Turtle Squire', level: 48, hp: 8200, atk: 240, def: 66, acc: 144, eva: 6, exp: 4200, gold: [31, 56],
    speed: 20, rest: [9, 14], w: 32, h: 47, art: 'barnacleknight', moves: ['shove', 'shell', 'stomp'], drops: [{ id: 'barnacle_shell', chance: 0.45 }, { id: 'sky_scale', chance: 0.12 }],
    fight: { every: 2.3, reach: 56, windup: 0.6 },
  }),
  // The Stormsong Frog (2026-11-27, the Storm Harpist remade from scratch, render/treefrog/): a tree frog
  // busker in a rain slicker with a golden harp; frogs sing before a storm, and these sing the storms in.
  harpist: mob({
    id: 'harpist', name: 'Stormsong Frog', level: 47, hp: 5200, atk: 232, def: 42, acc: 148, eva: 16, exp: 3700, gold: [30, 54],
    speed: 24, rest: [9, 14], w: 28, h: 43, art: 'harpist', moves: ['strum', 'croak', 'leap'], drops: [{ id: 'sky_silk', chance: 0.4 }, { id: 'mana_elixir', chance: 0.2 }, { gear: 'earring', chance: 0.01 }],
    fight: { every: 2.4, reach: 30, windup: 0.55, range: 180, shot: 'stormnote' },
  }),
  // The Bell-Cap Monk (2026-11-27, new in the Mantra Lemur's place, render/bellcap/): a little mushroom monk
  // of the whale's gardens whose cap grew in the shape of a temple bell; the monks ring them softly to wake
  // the sleeping whale (some keep watch from Starfall Heights' rim). It waddles at a mushroom's pace (14).
  // Moves: a spore puff, a bonk, a burrow. (The id stays for saves.)
  monk: mob({
    id: 'monk', name: 'Bell-Cap Monk', level: 47, hp: 6000, atk: 230, def: 52, acc: 148, eva: 18, exp: 3800, gold: [30, 54],
    speed: 14, rest: [9, 14], w: 22, h: 34, art: 'monk', moves: ['spore', 'bonk', 'burrow'], drops: [{ id: 'sky_silk', chance: 0.4 }, { id: 'sky_scale', chance: 0.1 }],
    fight: { every: 1.7, reach: 46, windup: 0.35 },
  }),
  // Captain Gale (remade 2026-11-27): a young sky-pirate captain who makes her own wind with a ship's
  // bellows, render/gale/; her new fight in world/skywhale.js: Fair Winds, Squall (shelter behind her sails
  // from the Full Gale), Full Gale (the wind from either end). Health from live autopilot runs (2026-11-27, a level-47 group:
  // 520k took 101.6 s and 540k 98.9 s; 580k took 105.8 s, phases at 34 s and 72 s, so the faster
  // finale gets time for its whole rotation).
  gale: mob({
    id: 'gale', name: 'Captain Gale', level: 46, hp: 580000, atk: 290, def: 70, acc: 150, eva: 10, exp: 84000, gold: [1100, 1400],
    speed: 36, w: 44, h: 100, art: 'gale', boss: true,
    drops: [{ id: 'sky_scale', chance: 1, qty: 3 }, { id: 'white_potion', chance: 1, qty: 20 }],
    fight: { every: 1.9, reach: 64, windup: 0.6 }, mech: 'gale',
  }),
  // The Barnacle Matriarch (remade 2026-11-27): a grand old walrus dowager the barnacles took for their
  // mother, render/matriarch/; her new fight in world/skywhale.js: Low Tide, Rising Tide (Find the Pearl:
  // shelter in the pearl's clam from the tide), Spring Tide. Health from live autopilot runs (2026-11-27, a level-47 group: 500k took 73 s;
  // 700k took 110 s, phases at 35 s and 73 s, every rotation seen).
  matriarch: mob({
    id: 'matriarch', name: 'The Barnacle Matriarch', level: 47, hp: 700000, atk: 296, def: 74, acc: 152, eva: 6, exp: 90000, gold: [1100, 1500],
    speed: 20, w: 60, h: 92, art: 'matriarch', boss: true,
    drops: [{ id: 'sky_scale', chance: 1, qty: 3 }, { id: 'mana_elixir', chance: 1, qty: 10 }],
    fight: { every: 2.1, reach: 66, windup: 0.6 }, mech: 'matriarch',
  }),
  // (Health sized from a live run, 2026-11-19: a level-50 group does about 4k a second to her;
  // 440k is a fight of about a minute and three quarters, the dungeon's last.)
  whaledream: mob({
    id: 'whaledream', name: "The Whale's Dream", level: 50, hp: 440000, atk: 310, def: 76, acc: 156, eva: 8, exp: 130000, gold: [1300, 1700],
    speed: 24, w: 90, h: 90, art: 'whaledream', boss: true,
    drops: [{ id: 'sky_scale', chance: 1, qty: 6 }],
    fight: { every: 2.1, reach: 92, windup: 0.6 }, mech: 'whaledream',
  }),
  // The Sulk (Chapter 10, 2026-11-19): the storm cloud of the whale's sadness, now the brow's boss
  // (she sleeps behind it); since 2026-11-25 the Blanket Sulk (render/sulk/). His fight rebuilt 2026-11-27
  // (world/skywhale.js): Grumpy, Five More Minutes (Pillow Fight!), Sunshower, with his Mood Swing (read his
  // face: sad, get close; cross, get away); three swings in turn (Duvet Slap, Plush Bop, Tantrum Flail).
  // Health from live autopilot runs (2026-11-27, a level-47 group, the same stage as Gale and the Matriarch):
  // 440k took 96.6 s (too short for the Sunshower's whole rotation); 600k took 138.8 s (phases at 35 s and
  // 94 s, every rotation seen) and 142.5 s without god mode, no wipe: the dungeon's last fight, a little longer.
  whalestorm: mob({
    id: 'whalestorm', name: 'The Sulk', level: 50, hp: 600000, atk: 310, def: 76, acc: 156, eva: 8, exp: 130000, gold: [1300, 1700],
    speed: 22, w: 68, h: 91, art: 'whalestorm', boss: true, moves: ['duvetSlap', 'plushBop', 'flail'],
    drops: [{ id: 'sky_scale', chance: 1, qty: 6 }],
    fight: { every: 2.1, reach: 96, windup: 0.6 }, mech: 'whalestorm',
  }),

  crystalking: mob({
    // (Level 38, the player's call 2026-11-07: the Crystal Cave's own monsters are 27-35 and the quest
    // opens at 35, so a level-45 king was a ten-level wall. Sized beside Lilith, the other level-38 queen.)
    id: 'crystalking', name: 'Prismaris, the Crystal King', level: 38, hp: 460000, atk: 226, def: 50, acc: 96, eva: 12, exp: 95000,
    gold: [600, 950], speed: 36, rest: [9, 12], w: 52, h: 106, art: 'crystalking', boss: true, moves: ['tap', 'stomp', 'gleam'],
    drops: [
      { id: 'king_crystal', chance: 1 },
      { id: 'seraphim_staff', chance: 0.08 },
      { id: 'elixir', chance: 1, qty: 5 },
    ],
    // (Rebuilt 2026-11-27, render/prismaris/: no slam now; he holds court by a rotation of named casts in
    // two phases and a faster finale (world/prismaris.js CRYSTAL_THRONE, run by world/story.js), `rest`
    // for a piece of his act between, his three swings at whoever touches him. Health sized like the
    // Grand Kettle's, by live autopilot fights (tools/bossfair.mjs's hero, a lv 38 of each job in its gear
    // tier, on the Crystal Throne): 420k took 1.4 to 1.7 minutes, every cast of both phases seen; 460k
    // aims at about 1.5 to 1.9, a gathered group quicker.)
  }),
  // His story trial (Chapter 10, 2026-11-19): the same Prismaris at level 49, alone in his dark
  // throne room with the Queen's alarm clock (world/story.js QUEENS.nightking). Health beside
  // Selene's, the trial before.
  nightking: mob({
    // (Health raised 2026-11-21: tools/bossfair.mjs had a player at this level's gear down its in
    // under a minute, too short to see all its moves; now about a minute for it, two for most players.)
    id: 'nightking', name: 'Prismaris, the Crystal King', level: 49, hp: 480000, atk: 286, def: 64, acc: 116, eva: 12, exp: 140000,
    gold: [800, 1150], speed: 36, rest: [9, 12], w: 52, h: 106, art: 'crystalking', boss: true, setOf: 'crystalking', moves: ['tap', 'stomp', 'gleam'],
    drops: [{ id: 'king_crystal', chance: 1 }, { id: 'elixir', chance: 1, qty: 5 }],
    // (Rebuilt 2026-11-27: his trial is a rotation of named casts in three phases and a faster finale,
    // the third echoing every cast (world/prismaris.js DARK_THRONE). The same intent kept: tools/bossfair.mjs
    // at 430k won in 0.9 to 1.2 minutes for every job (lowest HP 32-46%), so 480k for about a minute or a
    // little over, every phase reached, two for most players.)
  }),
  // The finale (Chapter 10, 2026-11-19): the Queen's alarm clock grown into Madame Reveille, ringing to send her
  // back to Monday. A solo trial at dawn by the palace (world/story.js QUEENS.alarm). Remade 2026-11-27 from scratch
  // (render/reveille/: a brisk morning governess with the clock's bells on her bonnet, a handbell and a rooster's
  // bustle) with a new fight (world/reveille.js): no slam and no snoozes now; her rotation of named casts in three
  // phases (Morning Bell, Ring-a-Ding, The Snooze Button, Rise and Shine!; Cock-a-Doodle-Doo!, Five More Minutes?,
  // Snooze Again?!; First Light), `rest` for a piece of her idle act before you come.
  alarm: mob({
    // (Health raised 2026-11-21: tools/bossfair.mjs had a player at this level's gear down its in
    // under a minute, too short to see all its moves; now about a minute for it, two for most players.)
    // (2026-11-27, her new fight: at the old 275k tools/bossfair.mjs won in 0.9-1.1 min, too short for her three
    // phases' rotations (about 80 s to see each once); at 540k 1.3-1.6 min over the four job families (warrior
    // 1.6, mage 1.6, thief 1.3, archer 1.6), 1-4 potions, lowest HP 40-48%, no faints; the finale's last trial,
    // a little over Prismaris's before it.)
    id: 'alarm', name: 'Madame Reveille', level: 50, hp: 540000, atk: 300, def: 68, acc: 120, eva: 10, exp: 200000,
    gold: [1000, 1500], speed: 32, rest: [9, 13], w: 60, h: 122, art: 'alarm', boss: true,
    drops: [{ id: 'elixir', chance: 1, qty: 10 }],
  }),

  // Queens out of myth: field bosses (Sylvana in Whispering Glade, Tamamo on the Fox Shrine Path,
  // Lilith at Serpent Springs, Selene at Starfall Heights; each also has a story fight). Each winds up a big attack every
  // few seconds that hits anyone on the floor near her.
  sylvana: mob({
    id: 'sylvana', name: 'Sylvana, the Dryad Queen', level: 22, hp: 40000, atk: 110, def: 26, acc: 60, eva: 6, exp: 30000,
    gold: [310, 490], speed: 26, w: 64, h: 122, art: 'sylvana', boss: true,
    drops: [{ id: 'leaf_fragment', chance: 1, qty: 10 }, { id: 'moss_stone', chance: 1, qty: 5 }, { id: 'elixir', chance: 1, qty: 2 }],
    special: { kind: 'slam', every: 6.5, warn: 1.3, damage: 200, range: 340 },
  }),
  tamamo: mob({
    id: 'tamamo', name: 'Tamamo, the Nine-Tailed Empress', level: 30, hp: 70000, atk: 170, def: 38, acc: 78, eva: 10, exp: 60000,
    gold: [440, 700], speed: 30, w: 70, h: 118, art: 'tamamo', boss: true,
    drops: [{ id: 'fluff', chance: 1, qty: 20 }, { id: 'wisp_flame', chance: 1, qty: 5 }, { id: 'elixir', chance: 1, qty: 3 }],
    special: { kind: 'slam', every: 6, warn: 1.2, damage: 290, range: 380 },
  }),
  // The Tea Terraces' area boss (world/nest.js): wakes in the giant teapot hut. Rebuilt 2026-11-26
  // (render/grandkettle/): no slam now; he fights by his rotation of named casts in three phases
  // (world/grandkettle.js, run by world/story.js), `rest` for a piece of his act between. Health
  // sized by a live autopilot fight (as tools/bossfair.mjs, a lv 28 hero of each job in its gear
  // tier): about 1.3 to 2.6 minutes, 1.7 on average; his touch softened to 110, since his casts are
  // the fight now.
  grandkettle: mob({
    id: 'grandkettle', name: 'The Grand Kettle', level: 28, hp: 95000, atk: 110, def: 30, acc: 70, eva: 2, exp: 22000,
    gold: [420, 640], speed: 26, rest: [9, 13], w: 70, h: 99, art: 'grandkettle', boss: true, moves: ['swing'],
    drops: [{ id: 'grand_brew', chance: 1, qty: 1 }, { id: 'tea_leaf', chance: 1, qty: 8 }, { id: 'kettle_lid', chance: 1, qty: 4 }, { id: 'white_potion', chance: 1, qty: 6 }],
  }),
  lilith: mob({
    // (Health raised 2026-11-21: tools/bossfair.mjs had a player at this level's gear down her in
    // under a minute, too short to see all her moves; now about a minute for it, two for most players.)
    id: 'lilith', name: 'Lilith, the Succubus Queen', level: 38, hp: 250000, atk: 220, def: 48, acc: 94, eva: 12, exp: 90000,
    gold: [570, 920], speed: 36, w: 62, h: 120, art: 'lilith', boss: true,
    drops: [{ id: 'bat_wing', chance: 1, qty: 20 }, { id: 'shade_cloth', chance: 1, qty: 5 }, { id: 'elixir', chance: 1, qty: 4 }],
    special: { kind: 'slam', every: 6, warn: 1.1, damage: 360, range: 400 },
  }),
  selene: mob({
    // (Health raised 2026-11-21: tools/bossfair.mjs had a player at this level's gear down her in
    // under a minute, too short to see all her moves; now about a minute for it, two for most players.)
    id: 'selene', name: 'Selene, the Moon Valkyrie', level: 50, hp: 300000, atk: 290, def: 66, acc: 118, eva: 14, exp: 150000,
    gold: [810, 1200], speed: 40, w: 62, h: 122, art: 'selene', boss: true,
    drops: [{ id: 'stardust', chance: 1, qty: 20 }, { id: 'moon_plume', chance: 0.5 }, { id: 'elixir', chance: 1, qty: 5 }],
    special: { kind: 'slam', every: 5.5, warn: 1.2, damage: 480, range: 440 },
  }),
};

// Steady fights: monster HP grew faster than a hero's damage (an at-level monster took about 6
// basic hits at level 12 but over 30 by level 48), so from level 18 up field monsters have their
// HP brought down to keep a kill at about 8-11 hits all the way. EXP comes down less than HP
// (by its square root), so a level takes a little less time than before, not a lot. And from
// level 20 up they hit a bit harder (3% more a level), so gear and healing matter out there.
// Bosses keep their own numbers.
for (const m of Object.values(MOBS)) {
  if (m.boss) continue;
  const hits = 6.2 + 0.69 * (m.level - 12);
  if (hits > 10) {
    const k = 10 / hits;
    m.hp = Math.round(m.hp * k);
    m.exp = Math.round(m.exp * Math.sqrt(k));
  }
  if (m.level > 20) m.atk = Math.round(m.atk * (1 + 0.03 * (m.level - 20)));
}
