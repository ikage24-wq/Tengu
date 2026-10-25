// Monster roster. Stats scale with level; EXP is tuned so levels 1-10 take roughly ten minutes.
// `drops` lists the monster's own items; the world adds potions, scrolls, and gear by level.
//
// Fields: level, hp, atk (touch damage), def, acc, eva, exp, gold [min, max], speed (px/s),
// w/h (hitbox), fly (hovers instead of walking), aggro (chases when hit), art (renderer key).

const mob = (def) => ({ fly: false, aggro: true, boss: false, ...def });

export const MOBS = {
  puffle: mob({
    id: 'puffle', name: 'Puffle', level: 1, hp: 12, atk: 6, def: 0, acc: 8, eva: 0, exp: 8, gold: [1, 6],
    speed: 30, w: 26, h: 22, art: 'puffle', aggro: false, drops: [{ id: 'fluff', chance: 0.6 }],
  }),
  snailbun: mob({
    id: 'snailbun', name: 'Snailbun', level: 2, hp: 22, atk: 8, def: 0, acc: 10, eva: 0, exp: 12, gold: [2, 8],
    speed: 24, w: 30, h: 22, art: 'snailbun', aggro: false, drops: [{ id: 'shell', chance: 0.55 }],
  }),
  sproutling: mob({
    id: 'sproutling', name: 'Sproutling', level: 4, hp: 45, atk: 13, def: 2, acc: 14, eva: 2, exp: 22, gold: [4, 12],
    speed: 40, w: 24, h: 30, art: 'sproutling', drops: [{ id: 'sprout_leaf', chance: 0.5 }],
  }),
  mushkin: mob({
    id: 'mushkin', name: 'Mushkin', level: 6, hp: 85, atk: 19, def: 4, acc: 18, eva: 4, exp: 40, gold: [6, 18],
    speed: 44, w: 30, h: 32, art: 'mushkin', drops: [{ id: 'mushcap', chance: 0.5 }],
  }),
  piglet: mob({
    id: 'piglet', name: 'Piglet', level: 8, hp: 125, atk: 25, def: 6, acc: 22, eva: 5, exp: 56, gold: [8, 24],
    speed: 55, w: 32, h: 26, art: 'piglet', drops: [{ id: 'ribbon', chance: 0.45 }],
  }),
  leafling: mob({
    id: 'leafling', name: 'Leafling', level: 11, hp: 210, atk: 33, def: 8, acc: 28, eva: 8, exp: 84, gold: [12, 32],
    speed: 50, w: 28, h: 34, art: 'leafling', drops: [{ id: 'leaf_fragment', chance: 0.5 }],
  }),
  boarlet: mob({
    id: 'boarlet', name: 'Boarlet', level: 14, hp: 330, atk: 43, def: 12, acc: 34, eva: 9, exp: 120, gold: [16, 40],
    speed: 70, w: 40, h: 30, art: 'boarlet', drops: [{ id: 'tusk', chance: 0.45 }],
  }),
  mossgolem: mob({
    id: 'mossgolem', name: 'Moss Golem', level: 18, hp: 620, atk: 58, def: 20, acc: 40, eva: 6, exp: 210, gold: [24, 60],
    speed: 32, w: 46, h: 48, art: 'mossgolem', drops: [{ id: 'moss_stone', chance: 0.45 }],
  }),
  wisp: mob({
    id: 'wisp', name: 'Wisp', level: 20, hp: 660, atk: 62, def: 18, acc: 46, eva: 16, exp: 240, gold: [26, 64],
    speed: 48, w: 28, h: 30, art: 'wisp', fly: true, drops: [{ id: 'wisp_flame', chance: 0.45 }],
  }),
  gloombat: mob({
    id: 'gloombat', name: 'Gloom Bat', level: 22, hp: 740, atk: 67, def: 15, acc: 50, eva: 22, exp: 270, gold: [28, 70],
    speed: 80, w: 32, h: 24, art: 'gloombat', fly: true, drops: [{ id: 'bat_wing', chance: 0.45 }],
  }),
  boneknight: mob({
    id: 'boneknight', name: 'Bone Knight', level: 24, hp: 1120, atk: 78, def: 30, acc: 54, eva: 14, exp: 350, gold: [34, 84],
    speed: 46, w: 30, h: 44, art: 'boneknight', drops: [{ id: 'bone_shard', chance: 0.5 }],
  }),
  crystalslime: mob({
    id: 'crystalslime', name: 'Crystal Slime', level: 27, hp: 1320, atk: 88, def: 28, acc: 58, eva: 15, exp: 400, gold: [38, 92],
    speed: 42, w: 34, h: 28, art: 'crystalslime', drops: [{ id: 'crystal_gel', chance: 0.5 }],
  }),
  rockgolem: mob({
    id: 'rockgolem', name: 'Rock Golem', level: 32, hp: 2450, atk: 112, def: 45, acc: 66, eva: 12, exp: 640, gold: [50, 120],
    speed: 30, w: 52, h: 54, art: 'rockgolem', drops: [{ id: 'rock_core', chance: 0.45 }],
  }),
  shade: mob({
    id: 'shade', name: 'Shade', level: 35, hp: 2650, atk: 126, def: 35, acc: 72, eva: 30, exp: 720, gold: [54, 130],
    speed: 64, w: 30, h: 40, art: 'shade', fly: true, drops: [{ id: 'shade_cloth', chance: 0.45 }],
  }),
  cloudsheep: mob({
    id: 'cloudsheep', name: 'Cloud Sheep', level: 38, hp: 3250, atk: 136, def: 40, acc: 76, eva: 25, exp: 860, gold: [60, 150],
    speed: 44, w: 40, h: 32, art: 'cloudsheep', drops: [{ id: 'wool', chance: 0.5 }],
  }),
  windbird: mob({
    id: 'windbird', name: 'Windbird', level: 43, hp: 4250, atk: 160, def: 45, acc: 84, eva: 40, exp: 1120, gold: [70, 170],
    speed: 90, w: 38, h: 30, art: 'windbird', fly: true, drops: [{ id: 'feather', chance: 0.45 }],
  }),
  starspirit: mob({
    id: 'starspirit', name: 'Star Spirit', level: 48, hp: 5650, atk: 186, def: 55, acc: 92, eva: 45, exp: 1440, gold: [80, 200],
    speed: 60, w: 34, h: 36, art: 'starspirit', fly: true, drops: [{ id: 'stardust', chance: 0.45 }],
  }),

  crystalking: mob({
    id: 'crystalking', name: 'Crystal King', level: 45, hp: 160000, atk: 260, def: 60, acc: 110, eva: 30, exp: 60000,
    gold: [4000, 8000], speed: 34, w: 110, h: 110, art: 'crystalking', boss: true,
    drops: [
      { id: 'king_crystal', chance: 1 },
      { id: 'scroll_watk_10', chance: 0.5 },
      { id: 'scroll_matk_10', chance: 0.5 },
      { id: 'elixir', chance: 1, qty: 5 },
    ],
    // Every few seconds the king slams the ground; anyone standing on it takes heavy damage.
    special: { kind: 'slam', every: 6, warn: 1.2, damage: 420, range: 420 },
  }),
};
