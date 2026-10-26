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
    drops: [{ id: 'hollow_acorn', chance: 1, qty: 2 }, { id: 'orange_potion', chance: 1, qty: 10 }, { id: 'scroll_watk_60', chance: 0.25 }],
    fight: { every: 1.8, reach: 52, windup: 0.5 }, mech: 'capper',
  }),
  tuskar: mob({
    id: 'tuskar', name: 'Tuskar the Behemoth', level: 13, hp: 9000, atk: 94, def: 18, acc: 42, eva: 2, exp: 4500, gold: [400, 800],
    speed: 44, w: 96, h: 72, art: 'tuskar', boss: true,
    drops: [{ id: 'hollow_acorn', chance: 1, qty: 3 }, { id: 'white_potion', chance: 1, qty: 10 }, { id: 'scroll_def_60', chance: 0.25 }],
    fight: { every: 2, reach: 56, windup: 0.5 }, mech: 'boar',
  }),
  gnarlroot: mob({
    id: 'gnarlroot', name: 'Gnarlroot, the Hollow Heart', level: 14, hp: 16000, atk: 98, def: 20, acc: 44, eva: 2, exp: 9000, gold: [800, 1500],
    speed: 16, w: 100, h: 150, art: 'gnarlroot', boss: true,
    drops: [{ id: 'hollow_acorn', chance: 1, qty: 5 }, { id: 'scroll_watk_60', chance: 0.5 }, { id: 'scroll_matk_60', chance: 0.5 }],
    fight: { every: 2, reach: 74, windup: 0.55 }, mech: 'gnarl',
  }),

  crystalking: mob({
    id: 'crystalking', name: 'Prismaris, the Crystal King', level: 45, hp: 160000, atk: 260, def: 60, acc: 110, eva: 12, exp: 120000,
    gold: [4000, 8000], speed: 34, w: 100, h: 130, art: 'crystalking', boss: true,
    drops: [
      { id: 'king_crystal', chance: 1 },
      { id: 'seraphim_staff', chance: 0.08 },
      { id: 'scroll_watk_10', chance: 0.5 },
      { id: 'scroll_matk_10', chance: 0.5 },
      { id: 'elixir', chance: 1, qty: 5 },
    ],
    // Every few seconds the king slams the ground; anyone standing on it takes heavy damage.
    special: { kind: 'slam', every: 6, warn: 1.2, damage: 420, range: 420 },
  }),
};
