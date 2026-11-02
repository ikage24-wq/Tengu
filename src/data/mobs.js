// Monster roster. Stats scale with level. EXP is tuned so levels 1-10 take roughly ten minutes;
// monsters level 10 and up give double EXP so the middle game keeps moving.
// `drops` lists the monster's own items; the world adds potions, scrolls, and gear by level.
//
// Fields: level, hp, atk (touch damage), def, acc, eva, exp, gold [min, max], speed (px/s),
// w/h (hitbox), fly (hovers instead of walking), aggro (chases when hit), art (renderer key), and
// gait: how it moves at that speed — steady (the default), bound (leaps, then lands and gathers),
// dart (quick short dashes and sudden stops), or stalk (creeps slowly, then breaks into a run).

const mob = (def) => ({ fly: false, aggro: true, boss: false, ...def });

export const MOBS = {
  puffle: mob({
    id: 'puffle', name: 'Kitsune Kit', level: 1, hp: 12, atk: 6, def: 0, acc: 8, eva: 0, exp: 8, gold: [1, 6],
    speed: 46, gait: 'dart', w: 22, h: 20, art: 'puffle', aggro: false, drops: [{ id: 'fluff', chance: 0.6 }],
  }),
  snailbun: mob({
    id: 'snailbun', name: 'Moss Tortoise', level: 2, hp: 22, atk: 8, def: 0, acc: 10, eva: 0, exp: 12, gold: [2, 8],
    speed: 16, w: 32, h: 22, art: 'snailbun', aggro: false, drops: [{ id: 'shell', chance: 0.55 }],
  }),
  // Petal Meadow's hive and clouds (render/mobs/bees.js).
  bumble: mob({
    id: 'bumble', name: 'Bumble', level: 2, hp: 20, atk: 8, def: 0, acc: 10, eva: 1, exp: 13, gold: [2, 8],
    speed: 40, gait: 'dart', w: 24, h: 24, art: 'bumble', fly: true, drops: [{ id: 'bee_fuzz', chance: 0.55 }],
  }),
  petalsprite: mob({
    id: 'petalsprite', name: 'Petal Sprite', level: 3, hp: 30, atk: 10, def: 1, acc: 12, eva: 2, exp: 17, gold: [3, 10],
    speed: 30, w: 22, h: 32, art: 'petalsprite', fly: true, aggro: false, drops: [{ id: 'sprite_petal', chance: 0.55 }],
  }),
  // Petal Meadow's area boss: she bursts out of the giant hive once enough of the meadow has been
  // hunted (world/nest.js), and every few seconds brings her honey dipper down in a splash that
  // hits anyone on her floor near her.
  queenbee: mob({
    id: 'queenbee', name: 'The Queen Bee', level: 6, hp: 1800, atk: 26, def: 4, acc: 20, eva: 1, exp: 900, gold: [150, 300],
    speed: 40, w: 60, h: 64, art: 'queenbee', fly: true, boss: true,
    drops: [{ id: 'royal_jelly', chance: 1, qty: 3 }, { id: 'honeycomb', chance: 1, qty: 4 }, { id: 'bee_fuzz', chance: 1, qty: 5 }],
    special: { kind: 'slam', every: 6, warn: 1.3, damage: 60, range: 170 },
  }),
  // Clover Hills' farm folk (render/mobs/farm.js), one more in each zone.
  strawimp: mob({
    id: 'strawimp', name: 'Scarecrow Imp', level: 5, hp: 65, atk: 16, def: 3, acc: 16, eva: 2, exp: 30, gold: [5, 14],
    speed: 30, gait: 'bound', w: 22, h: 36, art: 'strawimp', drops: [{ id: 'straw_tuft', chance: 0.5 }],
  }),
  brownie: mob({
    id: 'brownie', name: 'Kitchen Brownie', level: 7, hp: 105, atk: 22, def: 5, acc: 20, eva: 3, exp: 48, gold: [7, 20],
    speed: 34, w: 22, h: 30, art: 'brownie', drops: [{ id: 'brownie_crumb', chance: 0.5 }],
  }),
  kamaitachi: mob({
    id: 'kamaitachi', name: 'Wind Ferret', level: 9, hp: 150, atk: 28, def: 7, acc: 24, eva: 5, exp: 72, gold: [9, 26],
    speed: 70, gait: 'dart', w: 34, h: 22, art: 'kamaitachi', drops: [{ id: 'wind_whisker', chance: 0.45 }],
  }),
  // Clover Hills' area boss (world/nest.js, render/mobs/farm.js): the Toadstool Goblins' grumpy
  // old farmer chief bursts out of the big barn once enough of the hills has been hunted, and
  // every few seconds slams his pitchfork down, hurting anyone on his floor near him.
  macgoblin: mob({
    id: 'macgoblin', name: 'Old MacGoblin', level: 10, hp: 3200, atk: 40, def: 8, acc: 26, eva: 1, exp: 1600, gold: [250, 500],
    speed: 30, w: 70, h: 84, art: 'macgoblin', boss: true,
    drops: [{ id: 'mushcap', chance: 1, qty: 6 }, { id: 'clover', chance: 1, qty: 5 }, { id: 'orange_potion', chance: 1, qty: 8 }],
    special: { kind: 'slam', every: 6, warn: 1.3, damage: 90, range: 180 },
  }),
  sproutling: mob({
    id: 'sproutling', name: 'Mandrake', level: 4, hp: 45, atk: 13, def: 2, acc: 14, eva: 1, exp: 22, gold: [4, 12],
    speed: 34, w: 18, h: 28, art: 'sproutling', drops: [{ id: 'sprout_leaf', chance: 0.5 }],
  }),
  mushkin: mob({
    id: 'mushkin', name: 'Toadstool Goblin', level: 6, hp: 85, atk: 19, def: 4, acc: 18, eva: 2, exp: 40, gold: [6, 18],
    speed: 40, w: 24, h: 34, art: 'mushkin', drops: [{ id: 'mushcap', chance: 0.5 }],
  }),
  piglet: mob({
    id: 'piglet', name: 'Jackalope', level: 8, hp: 125, atk: 25, def: 6, acc: 22, eva: 3, exp: 56, gold: [8, 24],
    speed: 66, gait: 'bound', w: 26, h: 24, art: 'piglet', drops: [{ id: 'ribbon', chance: 0.45 }],
  }),
  // Windy Canyon, on the road up to Ember Crag.
  pebblet: mob({
    id: 'pebblet', name: 'Basilisk Hatchling', level: 9, hp: 150, atk: 28, def: 9, acc: 24, eva: 3, exp: 72, gold: [9, 26],
    speed: 36, w: 28, h: 22, art: 'pebblet', drops: [{ id: 'pebble', chance: 0.5 }],
  }),
  scorpip: mob({
    id: 'scorpip', name: 'Manticore Cub', level: 12, hp: 250, atk: 37, def: 10, acc: 30, eva: 5, exp: 190, gold: [13, 34],
    speed: 58, gait: 'stalk', w: 32, h: 26, art: 'scorpip', drops: [{ id: 'stinger', chance: 0.45 }],
  }),
  leafling: mob({
    id: 'leafling', name: 'Dryad', level: 11, hp: 210, atk: 33, def: 8, acc: 28, eva: 4, exp: 168, gold: [12, 32],
    speed: 44, w: 20, h: 34, art: 'leafling', drops: [{ id: 'leaf_fragment', chance: 0.5 }],
  }),
  boarlet: mob({
    id: 'boarlet', name: 'Warg', level: 14, hp: 330, atk: 43, def: 12, acc: 34, eva: 5, exp: 240, gold: [16, 40],
    speed: 82, gait: 'stalk', w: 38, h: 26, art: 'boarlet', drops: [{ id: 'tusk', chance: 0.45 }],
    // (Tuskar calls them into his den in Rootwood Hollow, where they fight like its own.)
    fight: { every: 1.6, reach: 30, windup: 0.4 },
  }),
  mossgolem: mob({
    id: 'mossgolem', name: 'Treant', level: 18, hp: 620, atk: 58, def: 20, acc: 40, eva: 4, exp: 420, gold: [24, 60],
    speed: 22, w: 34, h: 58, art: 'mossgolem', drops: [{ id: 'moss_stone', chance: 0.45 }],
  }),
  wisp: mob({
    id: 'wisp', name: "Will-o'-Wisp", level: 20, hp: 660, atk: 62, def: 18, acc: 46, eva: 7, exp: 480, gold: [26, 64],
    speed: 40, w: 22, h: 26, art: 'wisp', fly: true, drops: [{ id: 'wisp_flame', chance: 0.45 }],
  }),
  gloombat: mob({
    id: 'gloombat', name: 'Imp', level: 22, hp: 740, atk: 67, def: 15, acc: 50, eva: 8, exp: 540, gold: [28, 70],
    speed: 86, gait: 'dart', w: 24, h: 26, art: 'gloombat', fly: true, drops: [{ id: 'bat_wing', chance: 0.45 }],
  }),
  boneknight: mob({
    id: 'boneknight', name: 'Dullahan', level: 24, hp: 1120, atk: 78, def: 30, acc: 54, eva: 6, exp: 700, gold: [34, 84],
    speed: 34, w: 26, h: 46, art: 'boneknight', drops: [{ id: 'bone_shard', chance: 0.5 }],
  }),
  crystalslime: mob({
    id: 'crystalslime', name: 'Gem Mimic', level: 27, hp: 1320, atk: 88, def: 28, acc: 58, eva: 8, exp: 800, gold: [38, 92],
    speed: 40, gait: 'bound', w: 28, h: 24, art: 'crystalslime', drops: [{ id: 'crystal_gel', chance: 0.5 }],
  }),
  rockgolem: mob({
    id: 'rockgolem', name: 'Crystal Golem', level: 32, hp: 2450, atk: 112, def: 45, acc: 66, eva: 6, exp: 1280, gold: [50, 120],
    speed: 20, w: 46, h: 60, art: 'rockgolem', drops: [{ id: 'rock_core', chance: 0.45 }],
  }),
  shade: mob({
    id: 'shade', name: 'Wraith', level: 35, hp: 2650, atk: 126, def: 35, acc: 72, eva: 12, exp: 1440, gold: [54, 130],
    speed: 56, w: 26, h: 40, art: 'shade', fly: true, drops: [{ id: 'shade_cloth', chance: 0.45 }],
  }),
  cloudsheep: mob({
    id: 'cloudsheep', name: 'Pegasus Foal', level: 38, hp: 3250, atk: 136, def: 40, acc: 76, eva: 11, exp: 1720, gold: [60, 150],
    speed: 52, w: 40, h: 32, art: 'cloudsheep', drops: [{ id: 'wool', chance: 0.5 }],
  }),
  windbird: mob({
    id: 'windbird', name: 'Sky Harpy', level: 43, hp: 4250, atk: 160, def: 45, acc: 84, eva: 15, exp: 2240, gold: [70, 170],
    speed: 96, w: 36, h: 30, art: 'windbird', fly: true, drops: [{ id: 'feather', chance: 0.45 }],
  }),
  starspirit: mob({
    id: 'starspirit', name: 'Star Seraph', level: 48, hp: 5650, atk: 186, def: 55, acc: 92, eva: 16, exp: 2880, gold: [80, 200],
    speed: 34, w: 34, h: 36, art: 'starspirit', fly: true, drops: [{ id: 'stardust', chance: 0.45 }],
  }),

  // Spirit maidens out of myth, living on the mid and late maps: Sylph in Whispering Glade, Nekomata
  // and Kitsune Miko on the Fox Shrine Path, Lupina on Moonlit Ridge, Lamia at Serpent Springs,
  // Yuki-onna on Frozen Peak.
  sylph: mob({
    id: 'sylph', name: 'Sylph', level: 21, hp: 700, atk: 64, def: 14, acc: 48, eva: 12, exp: 500, gold: [26, 66],
    speed: 70, w: 24, h: 46, art: 'sylph', fly: true, drops: [{ id: 'feather', chance: 0.45 }],
  }),
  nekomata: mob({
    id: 'nekomata', name: 'Nekomata', level: 23, hp: 820, atk: 76, def: 16, acc: 54, eva: 14, exp: 600, gold: [30, 74],
    speed: 74, gait: 'dart', w: 24, h: 46, art: 'nekomata', drops: [{ id: 'fluff', chance: 0.45 }],
  }),
  kitsunemiko: mob({
    id: 'kitsunemiko', name: 'Kitsune Miko', level: 27, hp: 1250, atk: 86, def: 24, acc: 58, eva: 10, exp: 790, gold: [38, 92],
    speed: 40, w: 24, h: 48, art: 'kitsunemiko', drops: [{ id: 'wisp_flame', chance: 0.45 }],
  }),
  lupina: mob({
    id: 'lupina', name: 'Lupina', level: 29, hp: 1500, atk: 96, def: 28, acc: 62, eva: 10, exp: 900, gold: [42, 100],
    speed: 50, gait: 'stalk', w: 24, h: 50, art: 'lupina', drops: [{ id: 'tusk', chance: 0.45 }],
  }),
  lamia: mob({
    id: 'lamia', name: 'Lamia', level: 33, hp: 2500, atk: 116, def: 40, acc: 68, eva: 8, exp: 1320, gold: [52, 124],
    speed: 36, w: 28, h: 50, art: 'lamia', drops: [{ id: 'pebble', chance: 0.5 }],
  }),
  yukionna: mob({
    id: 'yukionna', name: 'Yuki-onna', level: 36, hp: 2800, atk: 128, def: 36, acc: 74, eva: 12, exp: 1520, gold: [56, 136],
    speed: 32, w: 24, h: 50, art: 'yukionna', drops: [{ id: 'crystal_gel', chance: 0.45 }],
  }),

  // Rootwood Hollow (the Lv 10 dungeon). In a dungeon monsters don't hurt on touch: they swing at
  // whoever they're angriest at (`fight`: every seconds, reach px, wind-up seconds; ranged ones
  // spit from `range` away). Bosses add their own moves (`mech`, see world/dungeon.js).
  rootling: mob({
    id: 'rootling', name: 'Root Imp', level: 10, hp: 300, atk: 36, def: 8, acc: 30, eva: 3, exp: 130, gold: [10, 26],
    speed: 58, gait: 'dart', w: 22, h: 30, art: 'rootling', drops: [{ id: 'hollow_acorn', chance: 0.12 }],
    fight: { every: 1.5, reach: 28, windup: 0.35 },
  }),
  sporecap: mob({
    id: 'sporecap', name: 'Myconid Shaman', level: 10, hp: 240, atk: 30, def: 5, acc: 30, eva: 2, exp: 120, gold: [10, 26],
    speed: 28, w: 22, h: 34, art: 'sporecap', drops: [{ id: 'mushcap', chance: 0.4 }],
    fight: { every: 2.2, reach: 26, windup: 0.5, range: 170 },
  }),
  thornback: mob({
    id: 'thornback', name: 'Bramble Bear', level: 12, hp: 900, atk: 52, def: 14, acc: 34, eva: 3, exp: 420, gold: [20, 50],
    speed: 36, w: 46, h: 34, art: 'thornback', drops: [{ id: 'hollow_acorn', chance: 0.4 }, { id: 'tusk', chance: 0.4 }],
    fight: { every: 1.8, reach: 32, windup: 0.45 },
  }),
  sporeling: mob({
    id: 'sporeling', name: 'Spore Mite', level: 10, hp: 160, atk: 22, def: 2, acc: 28, eva: 4, exp: 40, gold: [2, 8],
    speed: 72, gait: 'dart', w: 18, h: 14, art: 'sporeling', drops: [],
    fight: { every: 1.2, reach: 22, windup: 0.25 },
  }),
  sapling: mob({
    id: 'sapling', name: 'Corrupted Sapling', level: 12, hp: 700, atk: 0, def: 10, acc: 0, eva: 0, exp: 160, gold: [4, 12],
    speed: 0, w: 18, h: 36, art: 'sapling', drops: [],
    // Saplings don't fight: they feed their life to Gnarlroot.
    fight: { mender: true },
  }),
  mothercapper: mob({
    id: 'mothercapper', name: 'Myconid Queen', level: 12, hp: 7000, atk: 84, def: 16, acc: 40, eva: 2, exp: 3000, gold: [300, 600],
    speed: 34, w: 70, h: 100, art: 'mothercapper', boss: true,
    drops: [{ id: 'hollow_acorn', chance: 1, qty: 2 }, { id: 'orange_potion', chance: 1, qty: 10 }],
    fight: { every: 1.8, reach: 52, windup: 0.5 }, mech: 'capper',
  }),
  tuskar: mob({
    id: 'tuskar', name: 'Tuskar the Behemoth', level: 13, hp: 9000, atk: 94, def: 18, acc: 42, eva: 2, exp: 4500, gold: [400, 800],
    speed: 44, w: 96, h: 72, art: 'tuskar', boss: true,
    drops: [{ id: 'hollow_acorn', chance: 1, qty: 3 }, { id: 'white_potion', chance: 1, qty: 10 }],
    fight: { every: 2, reach: 56, windup: 0.5 }, mech: 'boar',
  }),
  gnarlroot: mob({
    id: 'gnarlroot', name: 'Gnarlroot, the Hollow Heart', level: 14, hp: 16000, atk: 98, def: 20, acc: 44, eva: 2, exp: 9000, gold: [800, 1500],
    speed: 16, w: 100, h: 150, art: 'gnarlroot', boss: true,
    drops: [{ id: 'hollow_acorn', chance: 1, qty: 5 }],
    fight: { every: 2, reach: 74, windup: 0.55 }, mech: 'gnarl',
  }),


  // ---------- Moonlit Manor (levels 15-20, docs/design/moonlit-manor.md) ----------
  porcelaindoll: mob({
    id: 'porcelaindoll', name: 'Porcelain Doll', level: 15, hp: 640, atk: 58, def: 18, acc: 46, eva: 4, exp: 240, gold: [20, 44],
    speed: 34, w: 26, h: 66, art: 'porcelaindoll', drops: [{ id: 'porcelain_shard', chance: 0.4 }, { id: 'moonlit_ribbon', chance: 0.08 }],
    fight: { every: 1.9, reach: 38, windup: 0.45 },
  }),
  ghostmaid: mob({
    id: 'ghostmaid', name: 'Ghost Maid', level: 15, hp: 520, atk: 52, def: 10, acc: 48, eva: 8, exp: 220, gold: [18, 40],
    speed: 52, w: 26, h: 62, art: 'ghostmaid', drops: [{ id: 'shade_cloth', chance: 0.3 }, { id: 'moonlit_ribbon', chance: 0.06 }],
    fight: { every: 1.5, reach: 34, windup: 0.3 },
  }),
  candlebride: mob({
    id: 'candlebride', name: 'Candle Bride', level: 17, hp: 760, atk: 62, def: 12, acc: 50, eva: 5, exp: 300, gold: [24, 52],
    speed: 30, w: 28, h: 66, art: 'candlebride', drops: [{ id: 'candle_wax', chance: 0.4 }, { id: 'moonlit_ribbon', chance: 0.08 }],
    fight: { every: 2.3, reach: 30, windup: 0.55, range: 170 },
  }),
  topiarydryad: mob({
    id: 'topiarydryad', name: 'Topiary Dryad', level: 15, hp: 600, atk: 56, def: 14, acc: 46, eva: 6, exp: 230, gold: [20, 42],
    speed: 46, gait: 'dart', w: 26, h: 64, art: 'topiarydryad', drops: [{ id: 'leaf_fragment', chance: 0.4 }, { id: 'moonlit_ribbon', chance: 0.06 }],
    fight: { every: 1.6, reach: 36, windup: 0.3 },
  }),
  lanternghost: mob({
    id: 'lanternghost', name: 'Lantern Ghost', level: 16, hp: 540, atk: 58, def: 8, acc: 50, eva: 9, exp: 250, gold: [20, 44],
    speed: 40, w: 24, h: 56, art: 'lanternghost', drops: [{ id: 'wisp_flame', chance: 0.35 }, { id: 'moonlit_ribbon', chance: 0.06 }],
    fight: { every: 2.1, reach: 30, windup: 0.5, range: 150 },
  }),
  armourknight: mob({
    id: 'armourknight', name: 'Armour Knight', level: 18, hp: 1200, atk: 70, def: 26, acc: 52, eva: 3, exp: 420, gold: [30, 64],
    speed: 34, w: 28, h: 66, art: 'armourknight', drops: [{ id: 'bone_shard', chance: 0.3 }, { id: 'moonlit_ribbon', chance: 0.1 }],
    fight: { every: 2.1, reach: 44, windup: 0.55 },
  }),
  teahatter: mob({
    id: 'teahatter', name: 'Tea Party Hatter', level: 17, hp: 820, atk: 64, def: 14, acc: 50, eva: 6, exp: 320, gold: [26, 56],
    speed: 44, w: 28, h: 72, art: 'teahatter', drops: [{ id: 'moonlit_ribbon', chance: 0.1 }, { id: 'orange_potion', chance: 0.3 }],
    fight: { every: 1.9, reach: 32, windup: 0.4, range: 120 },
  }),
  waltzrondo: mob({
    id: 'waltzrondo', name: 'Dame Rondo, the Leading Armour', level: 17, hp: 15000, atk: 112, def: 24, acc: 54, eva: 3, exp: 5200, gold: [500, 900],
    speed: 40, w: 44, h: 112, art: 'waltzrondo', boss: true,
    drops: [{ id: 'moonlit_ribbon', chance: 1, qty: 2 }, { id: 'white_potion', chance: 1, qty: 8 }],
    fight: { every: 1.9, reach: 64, windup: 0.5 }, mech: 'waltz',
  }),
  waltzminuet: mob({
    id: 'waltzminuet', name: 'Dame Minuet, the Following Armour', level: 17, hp: 14000, atk: 104, def: 22, acc: 54, eva: 4, exp: 5200, gold: [500, 900],
    speed: 40, w: 48, h: 108, art: 'waltzminuet', boss: true,
    drops: [{ id: 'moonlit_ribbon', chance: 1, qty: 2 }, { id: 'orange_potion', chance: 1, qty: 8 }],
    fight: { every: 1.7, reach: 56, windup: 0.45 }, mech: 'waltz',
  }),
  velvet: mob({
    id: 'velvet', name: 'Madame Velvet, the Head Housekeeper', level: 18, hp: 26000, atk: 118, def: 24, acc: 56, eva: 3, exp: 8000, gold: [700, 1300],
    speed: 30, w: 50, h: 116, art: 'velvet', boss: true,
    drops: [{ id: 'moonlit_ribbon', chance: 1, qty: 3 }, { id: 'white_potion', chance: 1, qty: 10 }],
    fight: { every: 2, reach: 70, windup: 0.5 }, mech: 'velvet',
  }),
  marigold: mob({
    id: 'marigold', name: 'Lady Marigold, the Eternal Hostess', level: 20, hp: 46000, atk: 128, def: 28, acc: 60, eva: 4, exp: 16000, gold: [1400, 2600],
    speed: 26, w: 60, h: 128, art: 'marigold', boss: true,
    drops: [{ id: 'moonlit_ribbon', chance: 1, qty: 5 }],
    fight: { every: 2, reach: 72, windup: 0.55 }, mech: 'marigold',
  }),


  // ---------- Sunken Aquarium Palace (levels 20-25, docs/design/aquarium-palace.md) ----------
  jellymaid: mob({
    id: 'jellymaid', name: 'Jellyfish Maiden', level: 20, hp: 980, atk: 76, def: 16, acc: 60, eva: 9, exp: 420, gold: [30, 64],
    speed: 34, w: 26, h: 60, art: 'jellymaid', drops: [{ id: 'jelly_ribbon', chance: 0.4 }, { id: 'tide_pearl', chance: 0.06 }],
    fight: { every: 1.9, reach: 40, windup: 0.4 },
  }),
  seahorseknight: mob({
    id: 'seahorseknight', name: 'Seahorse Knight', level: 21, hp: 1500, atk: 84, def: 30, acc: 62, eva: 4, exp: 540, gold: [36, 76],
    speed: 40, w: 26, h: 62, art: 'seahorseknight', drops: [{ id: 'sea_glass', chance: 0.4 }, { id: 'tide_pearl', chance: 0.08 }],
    fight: { every: 2.1, reach: 46, windup: 0.5 },
  }),
  anglerlamp: mob({
    id: 'anglerlamp', name: 'Anglerfish Lamp Girl', level: 22, hp: 1200, atk: 92, def: 18, acc: 64, eva: 8, exp: 560, gold: [36, 80],
    speed: 48, w: 26, h: 62, art: 'anglerlamp', drops: [{ id: 'wisp_flame', chance: 0.35 }, { id: 'tide_pearl', chance: 0.08 }],
    fight: { every: 2, reach: 36, windup: 0.55 },
  }),
  pearldiver: mob({
    id: 'pearldiver', name: 'Pearl Diver', level: 21, hp: 1050, atk: 80, def: 16, acc: 62, eva: 8, exp: 500, gold: [34, 72],
    speed: 44, w: 30, h: 56, art: 'pearldiver', drops: [{ id: 'sea_glass', chance: 0.35 }, { id: 'tide_pearl', chance: 0.1 }],
    fight: { every: 2.2, reach: 30, windup: 0.45, range: 160 },
  }),
  stardancer: mob({
    id: 'stardancer', name: 'Starfish Dancer', level: 20, hp: 1000, atk: 78, def: 18, acc: 60, eva: 10, exp: 440, gold: [30, 66],
    speed: 50, w: 26, h: 62, art: 'stardancer', drops: [{ id: 'sea_glass', chance: 0.3 }, { id: 'tide_pearl', chance: 0.06 }],
    fight: { every: 1.7, reach: 38, windup: 0.35 },
  }),
  octoscholar: mob({
    id: 'octoscholar', name: 'Octopus Scholar', level: 23, hp: 1350, atk: 88, def: 20, acc: 66, eva: 6, exp: 600, gold: [40, 84],
    speed: 30, w: 30, h: 60, art: 'octoscholar', drops: [{ id: 'tide_pearl', chance: 0.1 }, { id: 'white_potion', chance: 0.3 }],
    fight: { every: 2.3, reach: 32, windup: 0.5, range: 150 },
  }),
  moraymurri: mob({
    id: 'moraymurri', name: 'Murri, the Twin Moray', level: 22, hp: 20000, atk: 138, def: 30, acc: 70, eva: 5, exp: 9000, gold: [800, 1400],
    speed: 44, w: 56, h: 100, art: 'moraymurri', boss: true,
    drops: [{ id: 'tide_pearl', chance: 1, qty: 2 }, { id: 'white_potion', chance: 1, qty: 10 }],
    fight: { every: 1.8, reach: 64, windup: 0.5 }, mech: 'moray',
  }),
  morayena: mob({
    id: 'morayena', name: 'Ena, the Twin Moray', level: 22, hp: 20000, atk: 138, def: 30, acc: 70, eva: 5, exp: 9000, gold: [800, 1400],
    speed: 44, w: 56, h: 100, art: 'morayena', boss: true,
    drops: [{ id: 'tide_pearl', chance: 1, qty: 2 }, { id: 'orange_potion', chance: 1, qty: 10 }],
    fight: { every: 1.8, reach: 64, windup: 0.5 }, mech: 'moray',
  }),
  abyssia: mob({
    id: 'abyssia', name: 'Lady Abyssia, the Sea Witch', level: 23, hp: 38000, atk: 146, def: 32, acc: 72, eva: 4, exp: 14000, gold: [1000, 1800],
    speed: 26, w: 70, h: 120, art: 'abyssia', boss: true,
    drops: [{ id: 'tide_pearl', chance: 1, qty: 3 }, { id: 'mana_elixir', chance: 1, qty: 5 }],
    fight: { every: 2.1, reach: 80, windup: 0.55 }, mech: 'abyssia',
  }),
  coralie: mob({
    id: 'coralie', name: 'Queen Coralie, the Drowned Queen', level: 25, hp: 62000, atk: 160, def: 36, acc: 76, eva: 5, exp: 24000, gold: [2000, 3600],
    speed: 30, w: 64, h: 130, art: 'coralie', boss: true,
    drops: [{ id: 'tide_pearl', chance: 1, qty: 5 }],
    fight: { every: 2, reach: 84, windup: 0.55 }, mech: 'coralie',
  }),


  // ---------- Clockwork Carnival (levels 25-30, docs/design/clockwork-carnival.md) ----------
  musicballerina: mob({
    id: 'musicballerina', name: 'Music Box Ballerina', level: 25, hp: 1500, atk: 98, def: 22, acc: 74, eva: 10, exp: 700, gold: [44, 90],
    speed: 34, w: 30, h: 70, art: 'musicballerina', drops: [{ id: 'music_cylinder', chance: 0.35 }, { id: 'golden_ticket', chance: 0.06 }],
    fight: { every: 1.9, reach: 40, windup: 0.4 },
  }),
  tindrummer: mob({
    id: 'tindrummer', name: 'Tin Drummer Girl', level: 26, hp: 1800, atk: 104, def: 30, acc: 76, eva: 5, exp: 800, gold: [48, 96],
    speed: 38, w: 26, h: 70, art: 'tindrummer', drops: [{ id: 'tin_spring', chance: 0.4 }, { id: 'golden_ticket', chance: 0.08 }],
    fight: { every: 2.1, reach: 36, windup: 0.5, range: 140 },
  }),
  jackbox: mob({
    id: 'jackbox', name: 'Jack-in-the-Box Jester', level: 26, hp: 1650, atk: 108, def: 24, acc: 76, eva: 8, exp: 780, gold: [46, 94],
    speed: 46, w: 30, h: 66, art: 'jackbox', drops: [{ id: 'tin_spring', chance: 0.4 }, { id: 'golden_ticket', chance: 0.08 }],
    fight: { every: 2, reach: 48, windup: 0.5 },
  }),
  marionette: mob({
    id: 'marionette', name: 'Marionette Dancer', level: 27, hp: 1600, atk: 110, def: 22, acc: 78, eva: 12, exp: 820, gold: [48, 98],
    speed: 44, w: 26, h: 64, art: 'marionette', drops: [{ id: 'music_cylinder', chance: 0.3 }, { id: 'golden_ticket', chance: 0.08 }],
    fight: { every: 1.7, reach: 40, windup: 0.35 },
  }),
  teddystrong: mob({
    id: 'teddystrong', name: 'Teddy Strongwoman', level: 28, hp: 2600, atk: 122, def: 36, acc: 78, eva: 3, exp: 1050, gold: [56, 110],
    speed: 30, w: 30, h: 64, art: 'teddystrong', drops: [{ id: 'tin_spring', chance: 0.5 }, { id: 'golden_ticket', chance: 0.12 }],
    fight: { every: 2.4, reach: 52, windup: 0.7 },
  }),
  balloonseller: mob({
    id: 'balloonseller', name: 'Balloon Seller', level: 25, hp: 1400, atk: 96, def: 18, acc: 74, eva: 12, exp: 680, gold: [42, 88],
    speed: 40, w: 28, h: 70, art: 'balloonseller', drops: [{ id: 'golden_ticket', chance: 0.08 }, { id: 'white_potion', chance: 0.3 }],
    fight: { every: 2.2, reach: 30, windup: 0.45, range: 160 },
  }),
  leonie: mob({
    id: 'leonie', name: 'Leonie, the Lioness Acrobat', level: 27, hp: 52000, atk: 170, def: 38, acc: 82, eva: 6, exp: 20000, gold: [1600, 2800],
    speed: 50, w: 50, h: 112, art: 'leonie', boss: true,
    drops: [{ id: 'golden_ticket', chance: 1, qty: 3 }, { id: 'white_potion', chance: 1, qty: 12 }],
    fight: { every: 1.7, reach: 62, windup: 0.45 }, mech: 'leonie',
  }),
  marionetta: mob({
    id: 'marionetta', name: 'Madame Marionette', level: 28, hp: 60000, atk: 176, def: 40, acc: 84, eva: 5, exp: 24000, gold: [1800, 3200],
    speed: 30, w: 56, h: 120, art: 'marionetta', boss: true,
    drops: [{ id: 'golden_ticket', chance: 1, qty: 3 }, { id: 'mana_elixir', chance: 1, qty: 6 }],
    fight: { every: 2, reach: 76, windup: 0.5 }, mech: 'marionetta',
  }),
  gearheart: mob({
    id: 'gearheart', name: 'Queen Gearheart, the Grand Automaton', level: 30, hp: 90000, atk: 190, def: 44, acc: 88, eva: 5, exp: 36000, gold: [3000, 5200],
    speed: 28, w: 64, h: 130, art: 'gearheart', boss: true,
    drops: [{ id: 'golden_ticket', chance: 1, qty: 5 }],
    fight: { every: 2, reach: 82, windup: 0.55 }, mech: 'gearheart',
  }),


  // ---------- Star Observatory (levels 30-35, docs/design/star-observatory.md) ----------
  cometcourier: mob({
    id: 'cometcourier', name: 'Comet Courier', level: 30, hp: 2300, atk: 124, def: 30, acc: 90, eva: 14, exp: 1150, gold: [60, 120],
    speed: 56, w: 30, h: 60, art: 'cometcourier', drops: [{ id: 'stardust', chance: 0.35 }, { id: 'astral_shard', chance: 0.06 }],
    fight: { every: 1.8, reach: 42, windup: 0.4 },
  }),
  nebulawitch: mob({
    id: 'nebulawitch', name: 'Nebula Witch', level: 31, hp: 2200, atk: 132, def: 26, acc: 94, eva: 10, exp: 1200, gold: [62, 124],
    speed: 34, w: 28, h: 68, art: 'nebulawitch', drops: [{ id: 'stardust', chance: 0.4 }, { id: 'astral_shard', chance: 0.08 }],
    fight: { every: 2.3, reach: 30, windup: 0.55, range: 170 },
  }),
  starcarto: mob({
    id: 'starcarto', name: 'Star-chart Cartographer', level: 31, hp: 2400, atk: 128, def: 30, acc: 92, eva: 10, exp: 1220, gold: [62, 124],
    speed: 40, w: 26, h: 66, art: 'starcarto', drops: [{ id: 'astral_shard', chance: 0.08 }, { id: 'white_potion', chance: 0.3 }],
    fight: { every: 2.1, reach: 30, windup: 0.45, range: 150 },
  }),
  mothlibrarian: mob({
    id: 'mothlibrarian', name: 'Moth Librarian', level: 32, hp: 2500, atk: 134, def: 28, acc: 94, eva: 12, exp: 1300, gold: [64, 128],
    speed: 44, w: 30, h: 66, art: 'mothlibrarian', drops: [{ id: 'moth_scale', chance: 0.4 }, { id: 'astral_shard', chance: 0.08 }],
    fight: { every: 1.9, reach: 38, windup: 0.4 },
  }),
  meteorgolem: mob({
    id: 'meteorgolem', name: 'Meteor Golem Girl', level: 33, hp: 3800, atk: 150, def: 46, acc: 94, eva: 4, exp: 1600, gold: [72, 140],
    speed: 30, w: 30, h: 64, art: 'meteorgolem', drops: [{ id: 'meteorite', chance: 0.45 }, { id: 'astral_shard', chance: 0.12 }],
    fight: { every: 2.4, reach: 46, windup: 0.65 },
  }),
  geminighosts: mob({
    id: 'geminighosts', name: 'Gemini Ghosts', level: 30, hp: 2100, atk: 120, def: 22, acc: 90, eva: 16, exp: 1100, gold: [58, 118],
    speed: 48, w: 32, h: 50, art: 'geminighosts', drops: [{ id: 'astral_shard', chance: 0.06 }, { id: 'mana_elixir', chance: 0.2 }],
    fight: { every: 1.7, reach: 40, windup: 0.35 },
  }),
  folio: mob({
    id: 'folio', name: 'Folio, the Archivist', level: 32, hp: 78000, atk: 200, def: 46, acc: 98, eva: 6, exp: 30000, gold: [2400, 4000],
    speed: 32, w: 54, h: 112, art: 'folio', boss: true,
    drops: [{ id: 'astral_shard', chance: 1, qty: 3 }, { id: 'white_potion', chance: 1, qty: 14 }],
    fight: { every: 2, reach: 70, windup: 0.5 }, mech: 'folio',
  }),
  eclipsesol: mob({
    id: 'eclipsesol', name: 'Sol, the Eclipse Twin', level: 33, hp: 48000, atk: 196, def: 44, acc: 98, eva: 6, exp: 18000, gold: [1500, 2600],
    speed: 36, w: 50, h: 112, art: 'eclipsesol', boss: true,
    drops: [{ id: 'astral_shard', chance: 1, qty: 2 }, { id: 'elixir', chance: 1, qty: 2 }],
    fight: { every: 1.9, reach: 62, windup: 0.5 }, mech: 'eclipse',
  }),
  eclipseluna: mob({
    id: 'eclipseluna', name: 'Luna, the Eclipse Twin', level: 33, hp: 48000, atk: 196, def: 44, acc: 98, eva: 6, exp: 18000, gold: [1500, 2600],
    speed: 36, w: 50, h: 112, art: 'eclipseluna', boss: true,
    drops: [{ id: 'astral_shard', chance: 1, qty: 2 }, { id: 'mana_elixir', chance: 1, qty: 6 }],
    fight: { every: 1.9, reach: 62, windup: 0.5 }, mech: 'eclipse',
  }),
  astraea: mob({
    id: 'astraea', name: 'Astraea, the Star Keeper', level: 35, hp: 130000, atk: 214, def: 50, acc: 104, eva: 6, exp: 52000, gold: [4200, 7000],
    speed: 30, w: 64, h: 130, art: 'astraea', boss: true,
    drops: [{ id: 'astral_shard', chance: 1, qty: 5 }],
    fight: { every: 2, reach: 84, windup: 0.55 }, mech: 'astraea',
  }),


  // ---------- Candy Volcano (levels 35-40, docs/design/candy-volcano.md) ----------
  gummybear: mob({
    id: 'gummybear', name: 'Gummy Bear Brawler', level: 35, hp: 3600, atk: 160, def: 40, acc: 110, eva: 10, exp: 1700, gold: [80, 150],
    speed: 48, w: 28, h: 64, art: 'gummybear', drops: [{ id: 'taffy_twist', chance: 0.4 }, { id: 'sugar_gem', chance: 0.06 }],
    fight: { every: 1.7, reach: 40, windup: 0.35 },
  }),
  cottoncandy: mob({
    id: 'cottoncandy', name: 'Cotton Candy Fairy', level: 35, hp: 3000, atk: 156, def: 30, acc: 112, eva: 16, exp: 1650, gold: [78, 148],
    speed: 42, w: 30, h: 64, art: 'cottoncandy', drops: [{ id: 'taffy_twist', chance: 0.35 }, { id: 'sugar_gem', chance: 0.06 }],
    fight: { every: 2.2, reach: 30, windup: 0.5, range: 160 },
  }),
  lollipopwitch: mob({
    id: 'lollipopwitch', name: 'Lollipop Witch', level: 36, hp: 3200, atk: 166, def: 32, acc: 114, eva: 12, exp: 1750, gold: [80, 152],
    speed: 36, w: 28, h: 72, art: 'lollipopwitch', drops: [{ id: 'sugar_gem', chance: 0.08 }, { id: 'mana_elixir', chance: 0.2 }],
    fight: { every: 2.3, reach: 30, windup: 0.55, range: 170 },
  }),
  peppermint: mob({
    id: 'peppermint', name: 'Peppermint Spinner', level: 37, hp: 3400, atk: 170, def: 34, acc: 116, eva: 16, exp: 1850, gold: [84, 158],
    speed: 52, w: 32, h: 64, art: 'peppermint', drops: [{ id: 'sugar_gem', chance: 0.08 }, { id: 'taffy_twist', chance: 0.3 }],
    fight: { every: 1.8, reach: 44, windup: 0.35 },
  }),
  chocoknight: mob({
    id: 'chocoknight', name: 'Chocolate Knight Girl', level: 38, hp: 5200, atk: 184, def: 56, acc: 116, eva: 4, exp: 2300, gold: [96, 180],
    speed: 32, w: 30, h: 66, art: 'chocoknight', drops: [{ id: 'cocoa_bean', chance: 0.45 }, { id: 'sugar_gem', chance: 0.12 }],
    fight: { every: 2.3, reach: 50, windup: 0.6 },
  }),
  jellyninja: mob({
    id: 'jellyninja', name: 'Jelly Bean Ninja', level: 37, hp: 3100, atk: 172, def: 30, acc: 120, eva: 20, exp: 1800, gold: [82, 156],
    speed: 60, w: 30, h: 58, art: 'jellyninja', drops: [{ id: 'sugar_gem', chance: 0.08 }, { id: 'white_potion', chance: 0.3 }],
    fight: { every: 2, reach: 30, windup: 0.4, range: 150 },
  }),
  toffee: mob({
    id: 'toffee', name: 'Toffee, the Caramel Smith', level: 37, hp: 110000, atk: 236, def: 56, acc: 120, eva: 6, exp: 42000, gold: [3400, 5600],
    speed: 30, w: 54, h: 112, art: 'toffee', boss: true,
    drops: [{ id: 'sugar_gem', chance: 1, qty: 3 }, { id: 'white_potion', chance: 1, qty: 16 }],
    fight: { every: 2.1, reach: 72, windup: 0.6 }, mech: 'toffee',
  }),
  gretel: mob({
    id: 'gretel', name: 'Gretel, the Gingerbread Knight', level: 38, hp: 120000, atk: 240, def: 60, acc: 122, eva: 6, exp: 46000, gold: [3600, 6000],
    speed: 40, w: 54, h: 112, art: 'gretel', boss: true,
    drops: [{ id: 'sugar_gem', chance: 1, qty: 3 }, { id: 'mana_elixir', chance: 1, qty: 8 }],
    fight: { every: 1.9, reach: 80, windup: 0.5 }, mech: 'gretel',
  }),
  bonbon: mob({
    id: 'bonbon', name: 'Queen Bonbon', level: 40, hp: 180000, atk: 252, def: 62, acc: 126, eva: 6, exp: 72000, gold: [5600, 9000],
    speed: 26, w: 70, h: 130, art: 'bonbon', boss: true,
    drops: [{ id: 'sugar_gem', chance: 1, qty: 5 }],
    fight: { every: 2, reach: 86, windup: 0.55 }, mech: 'bonbon',
  }),
  // ---------- Dream Theatre (levels 40-45, docs/design/dream-theatre.md) ----------
  understudy: mob({
    id: 'understudy', name: 'Understudy Ghost', level: 40, hp: 4200, atk: 190, def: 40, acc: 126, eva: 16, exp: 2400, gold: [96, 176],
    speed: 46, w: 26, h: 60, art: 'understudy', drops: [{ id: 'script_page', chance: 0.4 }, { id: 'encore_rose', chance: 0.06 }],
    fight: { every: 1.9, reach: 42, windup: 0.4 },
  }),
  chorusgirl: mob({
    id: 'chorusgirl', name: 'Chorus Girl', level: 41, hp: 4400, atk: 196, def: 40, acc: 128, eva: 18, exp: 2500, gold: [98, 180],
    speed: 54, w: 26, h: 68, art: 'chorusgirl', drops: [{ id: 'sequin', chance: 0.4 }, { id: 'encore_rose', chance: 0.06 }],
    fight: { every: 1.7, reach: 44, windup: 0.35 },
  }),
  stagehand: mob({
    id: 'stagehand', name: 'Stagehand Imp', level: 40, hp: 4000, atk: 192, def: 46, acc: 124, eva: 14, exp: 2350, gold: [94, 172],
    speed: 58, w: 26, h: 56, art: 'stagehand', drops: [{ id: 'script_page', chance: 0.3 }, { id: 'white_potion', chance: 0.3 }],
    fight: { every: 1.8, reach: 38, windup: 0.35 },
  }),
  primadonna: mob({
    id: 'primadonna', name: 'Prima Donna', level: 42, hp: 5200, atk: 204, def: 44, acc: 130, eva: 8, exp: 2800, gold: [104, 190],
    speed: 30, w: 34, h: 66, art: 'primadonna', drops: [{ id: 'sequin', chance: 0.45 }, { id: 'encore_rose', chance: 0.1 }],
    fight: { every: 2.4, reach: 30, windup: 0.6, range: 180 },
  }),
  paperdragon: mob({
    id: 'paperdragon', name: 'Paper Dragon Dancers', level: 43, hp: 6400, atk: 212, def: 52, acc: 130, eva: 10, exp: 3100, gold: [110, 200],
    speed: 50, w: 48, h: 50, art: 'paperdragon', drops: [{ id: 'script_page', chance: 0.4 }, { id: 'encore_rose', chance: 0.12 }],
    fight: { every: 2.1, reach: 54, windup: 0.5 },
  }),
  prompter: mob({
    id: 'prompter', name: 'Prompter', level: 42, hp: 4300, atk: 200, def: 38, acc: 132, eva: 16, exp: 2700, gold: [100, 186],
    speed: 40, w: 26, h: 64, art: 'prompter', drops: [{ id: 'script_page', chance: 0.45 }, { id: 'mana_elixir', chance: 0.2 }],
    fight: { every: 2.2, reach: 30, windup: 0.5, range: 170 },
  }),
  persona: mob({
    id: 'persona', name: 'Persona, the Two-Faced Muse', level: 42, hp: 160000, atk: 262, def: 62, acc: 132, eva: 8, exp: 62000, gold: [4400, 7200],
    speed: 34, w: 54, h: 112, art: 'persona', boss: true,
    drops: [{ id: 'encore_rose', chance: 1, qty: 3 }, { id: 'white_potion', chance: 1, qty: 18 }],
    fight: { every: 1.9, reach: 74, windup: 0.5 }, mech: 'persona',
  }),
  directrice: mob({
    id: 'directrice', name: 'Madame Directrice', level: 43, hp: 170000, atk: 268, def: 64, acc: 134, eva: 6, exp: 66000, gold: [4600, 7600],
    speed: 32, w: 54, h: 112, art: 'directrice', boss: true,
    drops: [{ id: 'encore_rose', chance: 1, qty: 3 }, { id: 'mana_elixir', chance: 1, qty: 9 }],
    fight: { every: 2, reach: 76, windup: 0.55 }, mech: 'directrice',
  }),
  playwright: mob({
    id: 'playwright', name: 'The Phantom Playwright', level: 45, hp: 240000, atk: 280, def: 68, acc: 138, eva: 8, exp: 96000, gold: [7000, 11000],
    speed: 28, w: 64, h: 130, art: 'playwright', boss: true,
    drops: [{ id: 'encore_rose', chance: 1, qty: 5 }],
    fight: { every: 2, reach: 88, windup: 0.55 }, mech: 'playwright',
  }),
  // ---------- Sky Whale's Back (levels 45-50, docs/design/sky-whale.md) ----------
  kiterider: mob({
    id: 'kiterider', name: 'Kite Rider', level: 45, hp: 5200, atk: 220, def: 46, acc: 140, eva: 20, exp: 3300, gold: [110, 200],
    speed: 60, w: 28, h: 64, art: 'kiterider', drops: [{ id: 'sky_silk', chance: 0.4 }, { id: 'sky_scale', chance: 0.06 }],
    fight: { every: 1.8, reach: 44, windup: 0.35 },
  }),
  shepherdess: mob({
    id: 'shepherdess', name: 'Cloud Shepherdess', level: 45, hp: 5400, atk: 216, def: 46, acc: 138, eva: 14, exp: 3300, gold: [110, 200],
    speed: 44, w: 28, h: 64, art: 'shepherdess', drops: [{ id: 'sky_silk', chance: 0.45 }, { id: 'sky_scale', chance: 0.06 }],
    fight: { every: 1.9, reach: 46, windup: 0.4 },
  }),
  gunner: mob({
    id: 'gunner', name: 'Sky Pirate Gunner', level: 46, hp: 5000, atk: 226, def: 44, acc: 144, eva: 14, exp: 3400, gold: [116, 210],
    speed: 46, w: 28, h: 66, art: 'gunner', drops: [{ id: 'sky_scale', chance: 0.08 }, { id: 'white_potion', chance: 0.3 }],
    fight: { every: 2.3, reach: 30, windup: 0.55, range: 190 },
  }),
  barnacleknight: mob({
    id: 'barnacleknight', name: 'Barnacle Knight', level: 48, hp: 8200, atk: 240, def: 66, acc: 144, eva: 6, exp: 4200, gold: [124, 224],
    speed: 32, w: 32, h: 68, art: 'barnacleknight', drops: [{ id: 'barnacle_shell', chance: 0.45 }, { id: 'sky_scale', chance: 0.12 }],
    fight: { every: 2.3, reach: 56, windup: 0.6 },
  }),
  harpist: mob({
    id: 'harpist', name: 'Storm Harpist', level: 47, hp: 5200, atk: 232, def: 42, acc: 148, eva: 16, exp: 3700, gold: [118, 214],
    speed: 38, w: 28, h: 64, art: 'harpist', drops: [{ id: 'sky_silk', chance: 0.4 }, { id: 'mana_elixir', chance: 0.2 }],
    fight: { every: 2.4, reach: 30, windup: 0.55, range: 180 },
  }),
  monk: mob({
    id: 'monk', name: 'Feather Monk', level: 47, hp: 6000, atk: 230, def: 52, acc: 148, eva: 18, exp: 3800, gold: [118, 214],
    speed: 52, w: 28, h: 64, art: 'monk', drops: [{ id: 'sky_silk', chance: 0.4 }, { id: 'sky_scale', chance: 0.1 }],
    fight: { every: 1.7, reach: 46, windup: 0.35 },
  }),
  gale: mob({
    id: 'gale', name: 'Captain Gale', level: 46, hp: 200000, atk: 290, def: 70, acc: 150, eva: 10, exp: 84000, gold: [7400, 11600],
    speed: 38, w: 54, h: 112, art: 'gale', boss: true,
    drops: [{ id: 'sky_scale', chance: 1, qty: 3 }, { id: 'white_potion', chance: 1, qty: 20 }],
    fight: { every: 1.8, reach: 80, windup: 0.5 }, mech: 'gale',
  }),
  matriarch: mob({
    id: 'matriarch', name: 'The Barnacle Matriarch', level: 47, hp: 220000, atk: 296, def: 74, acc: 152, eva: 6, exp: 90000, gold: [7800, 12200],
    speed: 26, w: 58, h: 120, art: 'matriarch', boss: true,
    drops: [{ id: 'sky_scale', chance: 1, qty: 3 }, { id: 'mana_elixir', chance: 1, qty: 10 }],
    fight: { every: 2.1, reach: 84, windup: 0.6 }, mech: 'matriarch',
  }),
  whaledream: mob({
    id: 'whaledream', name: "The Whale's Dream", level: 50, hp: 320000, atk: 310, def: 76, acc: 156, eva: 8, exp: 130000, gold: [10000, 15000],
    speed: 24, w: 70, h: 140, art: 'whaledream', boss: true,
    drops: [{ id: 'sky_scale', chance: 1, qty: 6 }],
    fight: { every: 2.1, reach: 92, windup: 0.6 }, mech: 'whaledream',
  }),

  crystalking: mob({
    id: 'crystalking', name: 'Prismaris, the Crystal King', level: 45, hp: 160000, atk: 260, def: 60, acc: 110, eva: 12, exp: 120000,
    gold: [4000, 8000], speed: 34, w: 100, h: 130, art: 'crystalking', boss: true,
    drops: [
      { id: 'king_crystal', chance: 1 },
      { id: 'seraphim_staff', chance: 0.08 },
      { id: 'elixir', chance: 1, qty: 5 },
    ],
    // Every few seconds the king slams the ground; anyone standing on it takes heavy damage.
    special: { kind: 'slam', every: 6, warn: 1.2, damage: 420, range: 420 },
  }),

  // Queens out of myth: field bosses (Sylvana in Whispering Glade, Tamamo on the Fox Shrine Path,
  // Lilith at Serpent Springs, Selene at Starfall Heights; each also has a story fight). Each winds up a big attack every
  // few seconds that hits anyone on the floor near her.
  sylvana: mob({
    id: 'sylvana', name: 'Sylvana, the Dryad Queen', level: 22, hp: 40000, atk: 110, def: 26, acc: 60, eva: 6, exp: 30000,
    gold: [1200, 2400], speed: 26, w: 64, h: 122, art: 'sylvana', boss: true,
    drops: [{ id: 'leaf_fragment', chance: 1, qty: 10 }, { id: 'moss_stone', chance: 1, qty: 5 }, { id: 'elixir', chance: 1, qty: 2 }],
    special: { kind: 'slam', every: 6.5, warn: 1.3, damage: 200, range: 340 },
  }),
  tamamo: mob({
    id: 'tamamo', name: 'Tamamo, the Nine-Tailed Empress', level: 30, hp: 70000, atk: 170, def: 38, acc: 78, eva: 10, exp: 60000,
    gold: [2000, 4000], speed: 30, w: 70, h: 118, art: 'tamamo', boss: true,
    drops: [{ id: 'fluff', chance: 1, qty: 20 }, { id: 'wisp_flame', chance: 1, qty: 5 }, { id: 'elixir', chance: 1, qty: 3 }],
    special: { kind: 'slam', every: 6, warn: 1.2, damage: 290, range: 380 },
  }),
  lilith: mob({
    id: 'lilith', name: 'Lilith, the Succubus Queen', level: 38, hp: 110000, atk: 220, def: 48, acc: 94, eva: 12, exp: 90000,
    gold: [3000, 6000], speed: 36, w: 62, h: 120, art: 'lilith', boss: true,
    drops: [{ id: 'bat_wing', chance: 1, qty: 20 }, { id: 'shade_cloth', chance: 1, qty: 5 }, { id: 'elixir', chance: 1, qty: 4 }],
    special: { kind: 'slam', every: 6, warn: 1.1, damage: 360, range: 400 },
  }),
  selene: mob({
    id: 'selene', name: 'Selene, the Moon Valkyrie', level: 50, hp: 190000, atk: 290, def: 66, acc: 118, eva: 14, exp: 150000,
    gold: [5000, 9000], speed: 40, w: 62, h: 122, art: 'selene', boss: true,
    drops: [{ id: 'stardust', chance: 1, qty: 20 }, { id: 'king_crystal', chance: 0.5 }, { id: 'elixir', chance: 1, qty: 5 }],
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
