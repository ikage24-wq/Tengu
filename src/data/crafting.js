// Crafting (docs/design/life-skills.md): a craft bench in every town (the map's `bench`, near the
// plaza). Pick a recipe your Crafting level has reached, have its materials (mined ore and gems,
// logs and fibre from gathering, herbs, monster drops), and the bench makes it (core/crafting.js).
//
// What it makes:
//   gear       the Artisan line for every job at Lv 10, 20, 30, 40, 50: a little better than the
//              shop and drop gear of its level, with a quality roll (Fine, Superb, Masterwork)
//              whose odds rise with your Crafting level (the alternate path's best-in-slot)
//   accessory  rings, earrings and charms with useful stats (also quality-rolled)
//   potion     tonics brewed from herbs, a batch at a time
//   stone      polishing stones for Tora's forge (core/items.js: a polish likelier to take)
//   tool       fishing rods, pickaxes, sickles and woodaxes in four tiers, each with `life`:
//              { skill, slot, speed, yield, rare }. Equipped into `char.lifeTools[slot]`.
//
// RECIPES: { id, cat, name, tier (1-4), level (the Crafting level it needs), needs { item: qty },
// makes (an item id), qty, family (gear: whose), quality (rolls a quality) }.
//
// Shared material ids (every life builder uses these; see the plan). Any that aren't already in
// the catalogue are registered here (data/items.js adds them only when missing).

// The skill level each tier needs (core/life.js TIER_LEVEL; kept here too so the item catalogue
// can load this without the character code, and tests/crafting.test.js checks they match).
export const TIER_LEVEL = [0, 1, 12, 24, 36];

export const CRAFT_MATERIALS = [
  ['copper_ore', 'Copper Ore', 10, '#e0915a', 'Mined from cliffs and caves on the meadow side of the island. Craft it at a bench, or bring it to Tora\'s forge.'],
  ['iron_ore', 'Iron Ore', 18, '#a8aab8', 'Grey ore from the woods and ruins. Craft it into gear, tools and polishing stones at a bench.'],
  ['silver_ore', 'Silver Ore', 22, '#c8d0e0', 'Bright ore from the shrine hills and caves. Craft it at a bench, or bring it to Tora\'s forge.'],
  ['mithril_ore', 'Mithril Ore', 40, '#9fe6e0', 'Light, cool ore from the peaks and the sky. The finest crafts need it.'],
  ['rose_quartz', 'Rose Quartz', 80, '#ffb3d1', 'A rare pink crystal found in copper veins. Set into rings and earrings at a bench.'],
  ['amethyst', 'Amethyst', 120, '#b48cff', 'A rare violet crystal found in iron veins. Set into rings and earrings at a bench.'],
  ['sapphire', 'Sapphire', 170, '#6f9cff', 'A rare blue gem found in silver veins. Set into rings and earrings at a bench.'],
  ['starstone', 'Starstone', 260, '#ffe9a6', 'A rare gem with a star caught inside, found in mithril veins. The heart of Starforged crafts.'],
  ['oak_log', 'Oak Log', 8, '#c99a6b', 'Sturdy oak from the meadows. Handles, rods and bows are made from it at a bench.'],
  ['maple_log', 'Maple Log', 15, '#d98a5a', 'Red-grained maple from the woods. Craft it into tools and gear at a bench.'],
  ['cedar_log', 'Cedar Log', 24, '#b0705a', 'Fragrant cedar from the shrine hills. Craft it into tools and gear at a bench.'],
  ['skywood_log', 'Skywood Log', 38, '#cfe0ff', 'Pale, feather-light wood from the sky isles. The finest handles are made from it.'],
  ['cotton', 'Cotton', 7, '#fff4f8', 'Soft cotton bolls from the meadows. Spun into cloth for gear and charms at a bench.'],
  ['silkmoss', 'Silkmoss', 14, '#b8e0a8', 'A fine, silky moss from the woods. Woven into gear and charms at a bench.'],
  ['lotus_fiber', 'Lotus Fiber', 22, '#ffc6e0', 'Fibre drawn from the lotus by the springs. Woven into gear and charms at a bench.'],
  ['cloud_cotton', 'Cloud Cotton', 36, '#f4f8ff', 'Cotton as light as a cloud, from the sky isles. Woven into the finest gear.'],
];

// Each region tier's materials, and the monster drops of its maps that go into its crafts.
export const TIER_MATS = [
  null,
  { ore: 'copper_ore', gem: 'rose_quartz', wood: 'oak_log', fibre: 'cotton', drops: ['fluff', 'shell', 'mushcap'] },
  { ore: 'iron_ore', gem: 'amethyst', wood: 'maple_log', fibre: 'silkmoss', drops: ['tusk', 'leaf_fragment', 'stinger'] },
  { ore: 'silver_ore', gem: 'sapphire', wood: 'cedar_log', fibre: 'lotus_fiber', drops: ['bone_shard', 'crystal_gel', 'bat_wing'] },
  { ore: 'mithril_ore', gem: 'starstone', wood: 'skywood_log', fibre: 'cloud_cotton', drops: ['feather', 'wool', 'shade_cloth'] },
];

// The quality a crafted piece comes out at, and how much it lifts the piece's stats; Superb and
// Masterwork pieces also add to the wearer's main stat.
export const QUALITIES = [
  { key: 'fine', name: 'Fine', mult: 1, main: 0, color: '#6fa86a' },
  { key: 'superb', name: 'Superb', mult: 1.08, main: 2, color: '#4f8fd8' },
  { key: 'masterwork', name: 'Masterwork', mult: 1.18, main: 4, color: '#d9902a' },
];
// How much better a Fine Artisan piece is than the shop and drop piece of its level.
export const ARTISAN_EDGE = 1.12;

// The Artisan line: one material look per level, each a little set of its own colours (worn over
// the job's own gear shapes, with a brass trim accent that marks it as bench-made).
export const ARTISAN_LEVELS = [10, 20, 30, 40, 50];
export const ARTISAN = [
  { level: 10, tier: 1, name: 'Copperstitch', forged: 'Copperforged', color: '#e0a07a', accent: '#8fe0c0', craft: 5 },
  { level: 20, tier: 2, name: 'Ironweave', forged: 'Ironheart', color: '#9fb0c8', accent: '#ffcf7a', craft: 15 },
  { level: 30, tier: 3, name: 'Silverwork', forged: 'Silverwork', color: '#dfe6f5', accent: '#ff9ec0', craft: 27 },
  { level: 40, tier: 4, name: 'Mithril', forged: 'Mithril', color: '#9fe6e0', accent: '#ffe36b', craft: 39 },
  { level: 50, tier: 4, name: 'Starforged', forged: 'Starforged', color: '#ffe6a8', accent: '#b48cff', craft: 47 },
];
// The weapons each gear family crafts (data/jobs.js: the jobs' own weapons).
export const FAMILY_WEAPONS = {
  warrior: ['sword', 'axe', 'spear'],
  archer: ['bow', 'crossbow'],
  mage: ['wand', 'staff'],
  thief: ['dagger', 'gauntlet'],
};
const FAMILIES = Object.keys(FAMILY_WEAPONS);
const SLOTS = ['hat', 'top', 'bottom', 'shoes', 'gloves', 'cape'];
const MAIN = { warrior: 'str', archer: 'dex', mage: 'int', thief: 'luk' };
export const familyMain = (family) => MAIN[family] ?? 'str';

// Accessories: a ring, an earring and a charm per region tier.
export const ACCESSORY_LEVELS = [10, 20, 30, 40];
const GEM_NAMES = ['', 'Rose', 'Amethyst', 'Sapphire', 'Starstone'];
const METAL_NAMES = ['', 'Copper', 'Iron', 'Silver', 'Mithril'];
const WOOD_NAMES = ['', 'Oak', 'Maple', 'Cedar', 'Skywood'];
const GEM_COLORS = ['', '#ffb3d1', '#b48cff', '#6f9cff', '#ffe9a6'];
const METAL_COLORS = ['', '#e0a07a', '#a8aab8', '#dfe6f5', '#9fe6e0'];
const WOOD_COLORS = ['', '#c99a6b', '#d98a5a', '#b0705a', '#cfe0ff'];

// Tools: four kinds, four tiers. `slot` is where it's kept in char.lifeTools (the skill it serves,
// or 'chopping' for the woodaxe, which gathers wood); `speed` cuts the action's time by that
// share, `yield` is the chance of one more find, `rare` adds to a spot's rare chance.
export const TOOL_KINDS = {
  rod: { name: 'Fishing Rod', skill: 'fishing', slot: 'fishing', made: 'wood', color: '#c99a6b' },
  pickaxe: { name: 'Pickaxe', skill: 'mining', slot: 'mining', made: 'ore', color: '#a8aab8' },
  sickle: { name: 'Sickle', skill: 'gathering', slot: 'gathering', made: 'ore', color: '#9fd8a8' },
  woodaxe: { name: 'Woodaxe', skill: 'gathering', slot: 'chopping', made: 'ore', color: '#d98a5a' },
};
export const TOOL_SLOTS = ['fishing', 'mining', 'gathering', 'chopping'];
export const toolId = (kind, tier) => `${kind}_${(TOOL_KINDS[kind].made === 'wood' ? WOOD_NAMES : METAL_NAMES)[tier].toLowerCase()}`;
export const toolLife = (kind, tier) => ({ skill: TOOL_KINDS[kind].skill, slot: TOOL_KINDS[kind].slot, tier, speed: +(0.1 * tier).toFixed(2), yield: +(0.12 * tier).toFixed(2), rare: +(0.015 * tier).toFixed(3) });

// Polishing stones for Tora's forge: one stone in place of the ore, likelier to take, for gear up
// to its level (core/items.js POLISH_STONES).
export const STONES = [
  { id: 'polish_copper', name: 'Copper Polishing Stone', tier: 1, upTo: 24, boost: 0.2, color: '#e0a07a', craft: 2 },
  { id: 'polish_iron', name: 'Iron Polishing Stone', tier: 2, upTo: 39, boost: 0.2, color: '#a8aab8', craft: 13 },
  { id: 'polish_silver', name: 'Silver Polishing Stone', tier: 3, upTo: 64, boost: 0.2, color: '#dfe6f5', craft: 25 },
  { id: 'polish_mithril', name: 'Mithril Polishing Stone', tier: 4, upTo: 100, boost: 0.2, color: '#9fe6e0', craft: 37 },
  { id: 'polish_star', name: 'Starstone Polishing Gem', tier: 4, upTo: 100, boost: 0.32, color: '#ffe9a6', craft: 44 },
];

// Tonics brewed from herbs. Some make the shops' tonics (cheaper this way, a batch at a time),
// two are the bench's own.
export const TONICS = [
  { id: 'herb_salve', name: 'Clover Salve', effect: { hpPct: 0.25, mpPct: 0.15 }, price: 420, color: '#9fe0a0', desc: 'A cooling green salve. Restores 25% of your max HP and 15% of your max MP.' },
  { id: 'moon_draught', name: 'Moonpetal Draught', effect: { hpPct: 0.4, mpPct: 0.4 }, price: 1500, color: '#c9c4ff', desc: 'Moonpetal steeped with honey. Restores 40% of your max HP and MP.' },
  // One of each region's own, from its herbs (the player's pick: every herb has a use at the bench
  // as well as the stove), and a rare one from the night flowers.
  { id: 'meadow_cordial', name: 'Meadow Cordial', effect: { hpPct: 0.3, mpPct: 0.1 }, price: 260, color: '#ff8fa8', desc: 'Wild strawberries and prickle pear, pressed sweet. Restores 30% of your max HP and 10% of your max MP.' },
  { id: 'forest_brew', name: 'Forest Mint Brew', effect: { hpPct: 0.3, mpPct: 0.3 }, price: 700, color: '#8fe0b0', desc: 'Temple mint and chanterelle, brewed earthy and bright. Restores 30% of your max HP and MP.' },
  { id: 'shrine_infusion', name: 'Shrine Thyme Infusion', effect: { hpPct: 0.45, mpPct: 0.35 }, price: 1400, color: '#ffc8a0', desc: 'Moon thyme, steam ginger and a shrine plum, steeped warm. Restores 45% of your max HP and 35% of your max MP.' },
  { id: 'starlight_nectar', name: 'Starlight Nectar', effect: { hpPct: 0.6, mpPct: 0.5 }, price: 2600, color: '#ffe9a6', desc: 'Cloudberries and snow peach with a star of anise. Restores 60% of your max HP and half your max MP.' },
  { id: 'nightbloom_elixir', name: 'Nightbloom Elixir', effect: { hpPct: 1, mpPct: 1 }, price: 6000, color: '#c9a6ff', desc: 'Brewed from flowers that only open at night. Restores all your HP and MP.' },
];

// ---------- Recipes ----------

export const RECIPES = [];
const recipe = (r) => RECIPES.push({ qty: 1, quality: false, ...r });

// The Artisan gear: armor pieces for each family, then its weapons.
const ARMOR_NEEDS = {
  // [fibre, ore, wood, drop index, drops]
  hat: [2, 1, 0, 0, 2], top: [4, 1, 0, 1, 2], bottom: [3, 0, 0, 0, 2],
  shoes: [2, 0, 1, 2, 2], gloves: [2, 1, 0, 2, 1], cape: [4, 0, 0, 1, 2],
};
const SLOT_STEP = { hat: 0, top: 1, bottom: 0, shoes: 0, gloves: 1, cape: 1 };
export const artisanId = (family, slot, level) => `artisan_${family}_${slot}_${level}`;
export const artisanWeaponId = (type, level) => `artisan_${type}_${level}`;

function scaled(needs, k) {
  const out = {};
  for (const [id, n] of Object.entries(needs)) if (n > 0) out[id] = (out[id] ?? 0) + Math.max(1, Math.round(n * k));
  return out;
}

for (const a of ARTISAN) {
  const m = TIER_MATS[a.tier];
  const k = a.level === 50 ? 1.5 : 1;
  for (const family of FAMILIES) {
    for (const slot of SLOTS) {
      let [fibre, ore, wood, d, n] = ARMOR_NEEDS[slot];
      // Warriors wear plate: the metal and the cloth trade places.
      if (family === 'warrior' && slot !== 'cape' && slot !== 'bottom') [fibre, ore] = [Math.max(1, ore), fibre];
      const needs = scaled({ [m.fibre]: fibre, [m.ore]: ore, [m.wood]: wood, [m.drops[d]]: n }, k);
      if (a.level === 50) Object.assign(needs, { starstone: 1, stardust: 2 });
      recipe({ id: `craft_${artisanId(family, slot, a.level)}`, cat: 'gear', tier: a.tier, level: a.craft + SLOT_STEP[slot], needs, makes: artisanId(family, slot, a.level), family, quality: true });
    }
    for (const type of FAMILY_WEAPONS[family]) {
      const needs = scaled({ [m.ore]: 3, [m.wood]: 2, [m.drops[0]]: 1, ...(a.tier >= 3 ? { [m.gem]: 1 } : {}) }, k);
      if (a.level === 50) Object.assign(needs, { starstone: 1, stardust: 2 });
      recipe({ id: `craft_${artisanWeaponId(type, a.level)}`, cat: 'gear', tier: a.tier, level: a.craft + 2, needs, makes: artisanWeaponId(type, a.level), family, quality: true });
    }
  }
}

// Accessories.
export const ringId = (t) => `ring_${METAL_NAMES[t].toLowerCase()}`;
export const earringId = (t) => `earring_${GEM_NAMES[t].toLowerCase()}`;
export const charmId = (t) => `charm_${WOOD_NAMES[t].toLowerCase()}`;
ACCESSORY_LEVELS.forEach((L, i) => {
  const t = i + 1;
  const m = TIER_MATS[t];
  const base = TIER_LEVEL[t] + 3;
  recipe({ id: `craft_${ringId(t)}`, cat: 'accessory', tier: t, level: base, needs: { [m.ore]: 3, [m.gem]: 1 }, makes: ringId(t), quality: true });
  recipe({ id: `craft_${earringId(t)}`, cat: 'accessory', tier: t, level: base + 1, needs: { [m.ore]: 1, [m.gem]: 1, [m.drops[1]]: 2 }, makes: earringId(t), quality: true });
  recipe({ id: `craft_${charmId(t)}`, cat: 'accessory', tier: t, level: base + 2, needs: { [m.wood]: 2, [m.fibre]: 2, [m.drops[2]]: 1 }, makes: charmId(t), quality: true });
});

// Tonics (a batch each).
recipe({ id: 'craft_red_potion', cat: 'potion', tier: 1, level: 1, needs: { clover: 1, fluff: 1 }, makes: 'red_potion', qty: 5 });
recipe({ id: 'craft_blue_potion', cat: 'potion', tier: 1, level: 3, needs: { clover: 1, sprite_petal: 1 }, makes: 'blue_potion', qty: 5 });
recipe({ id: 'craft_orange_potion', cat: 'potion', tier: 2, level: 12, needs: { cherry: 1, honeycomb: 1 }, makes: 'orange_potion', qty: 5 });
recipe({ id: 'craft_herb_salve', cat: 'potion', tier: 2, level: 16, needs: { clover: 2, honeycomb: 1, leaf_fragment: 1 }, makes: 'herb_salve', qty: 3 });
recipe({ id: 'craft_white_potion', cat: 'potion', tier: 3, level: 24, needs: { cherry: 2, moss_stone: 1 }, makes: 'white_potion', qty: 5 });
recipe({ id: 'craft_mana_elixir', cat: 'potion', tier: 3, level: 28, needs: { moonpetal: 1, crystal_gel: 1 }, makes: 'mana_elixir', qty: 5 });
recipe({ id: 'craft_moon_draught', cat: 'potion', tier: 4, level: 36, needs: { moonpetal: 2, honeycomb: 1, feather: 1 }, makes: 'moon_draught', qty: 3 });
recipe({ id: 'craft_elixir', cat: 'potion', tier: 4, level: 42, needs: { moonpetal: 2, honeycomb: 2, stardust: 1 }, makes: 'elixir', qty: 2 });
// Each region's own tonic, from its herbs; and the night flowers' elixir.
recipe({ id: 'craft_meadow_cordial', cat: 'potion', tier: 1, level: 6, needs: { wild_strawberry: 2, prickle_pear: 1 }, makes: 'meadow_cordial', qty: 3 });
recipe({ id: 'craft_forest_brew', cat: 'potion', tier: 2, level: 14, needs: { temple_mint: 2, chanterelle: 1, whisperberry: 1 }, makes: 'forest_brew', qty: 3 });
recipe({ id: 'craft_shrine_infusion', cat: 'potion', tier: 3, level: 27, needs: { moon_thyme: 2, steam_ginger: 1, shrine_plum: 1 }, makes: 'shrine_infusion', qty: 3 });
recipe({ id: 'craft_starlight_nectar', cat: 'potion', tier: 4, level: 39, needs: { cloudberry: 2, snow_peach: 1, star_anise: 1 }, makes: 'starlight_nectar', qty: 3 });
recipe({ id: 'craft_nightbloom_elixir', cat: 'potion', tier: 4, level: 44, needs: { duskcap: 1, foxfire_lily: 1, starbloom: 1 }, makes: 'nightbloom_elixir', qty: 2 });

// Polishing stones.
for (const s of STONES) {
  const m = TIER_MATS[s.tier];
  recipe({ id: `craft_${s.id}`, cat: 'stone', tier: s.tier, level: s.craft, needs: s.id === 'polish_star' ? { starstone: 1, [m.ore]: 2 } : { [m.ore]: 3 }, makes: s.id, qty: s.id === 'polish_star' ? 1 : 2 });
}

// Tools.
for (const [kind, k] of Object.entries(TOOL_KINDS)) {
  for (let t = 1; t <= 4; t++) {
    const m = TIER_MATS[t];
    const step = { rod: 0, pickaxe: 1, sickle: 0, woodaxe: 1 }[kind];
    const needs = kind === 'rod' ? { [m.wood]: 3, [m.fibre]: 2 } : kind === 'pickaxe' ? { [m.ore]: 3, [m.wood]: 1 } : kind === 'sickle' ? { [m.ore]: 2, [m.wood]: 1 } : { [m.ore]: 2, [m.wood]: 2 };
    if (t >= 2) needs[m.drops[0]] = 1;
    if (t === 4) needs[m.gem] = 1;
    recipe({ id: `craft_${toolId(kind, t)}`, cat: 'tool', tier: t, level: TIER_LEVEL[t] + step, needs, makes: toolId(kind, t), skill: k.skill });
  }
}

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
// The Kettle Racer's key (data/mounts.js): a mount you make yourself, from copper, iron and maple.
recipe({ id: 'craft_mount_kettle', cat: 'tool', tier: 2, level: 12, needs: { copper_ore: 10, iron_ore: 6, maple_log: 4 }, makes: 'mount_kettle' });

export const CATEGORIES = [
  { key: 'gear', name: 'Gear' },
  { key: 'accessory', name: 'Trinkets' },
  { key: 'tool', name: 'Tools' },
  { key: 'potion', name: 'Tonics' },
  { key: 'stone', name: 'Stones' },
];

// ---------- The items it makes ----------
// Built from the catalogue's own gear (data/items.js passes ITEMS in, and adds what this returns
// once its own gear is in): the Artisan pieces take the stats of the shop piece of their level,
// a little better.

export function craftedItemDefs(ITEMS, JOB_SETS, GEAR_LEVELS) {
  const out = [];
  // Each stat a share better (rounded), and the piece's lead stat (defense, or attack on a weapon)
  // always at least one better, so even small pieces come out ahead.
  const up = (stats, k = ARTISAN_EDGE) => {
    const out = Object.fromEntries(Object.entries(stats).map(([s, v]) => [s, Math.round(v * k)]));
    const lead = ['watk', 'wdef', 'matk', 'mp'].find((s) => s in stats);
    if (lead) out[lead] = Math.max(out[lead], stats[lead] + 1);
    return out;
  };
  for (const a of ARTISAN) {
    const t = GEAR_LEVELS.indexOf(a.level);
    for (const family of FAMILIES) {
      for (const slot of SLOTS) {
        const base = ITEMS[`${family}_${slot}_${a.level}`];
        out.push({
          id: artisanId(family, slot, a.level), name: `${a.name} ${JOB_SETS[family].nouns[slot](t)}`,
          type: 'equip', slot, design: 'job', family, tier: t, reqLevel: a.level, crafted: true, artisan: a.name, accent: a.accent,
          stats: up(base.stats), price: Math.round(base.price * 1.3), color: a.color,
        });
      }
      for (const type of FAMILY_WEAPONS[family]) {
        const base = ITEMS[`${type}_${a.level}`];
        out.push({
          id: artisanWeaponId(type, a.level), name: `${a.forged} ${base.name.split(' ').slice(1).join(' ')}`,
          type: 'equip', slot: 'weapon', weaponType: type, tier: base.tier, element: null, main: base.main, crafted: true, artisan: a.name,
          reqLevel: a.level, family: null, stats: up(base.stats), price: Math.round(base.price * 1.3), color: a.color,
        });
      }
    }
  }
  ACCESSORY_LEVELS.forEach((L, i) => {
    const t = i + 1;
    const n = Math.floor(L / 10);
    out.push({
      id: ringId(t), name: `${METAL_NAMES[t]} ${GEM_NAMES[t]} Ring`, type: 'equip', slot: 'ring', reqLevel: L, family: null, crafted: true, tier: t,
      stats: { watk: 1 + n, matk: 1 + n, str: n, dex: n, int: n, luk: n }, price: 400 + L * L * 2, color: METAL_COLORS[t], gem: GEM_COLORS[t],
    });
    const ear = ITEMS[`ear_${L}`];
    out.push({
      id: earringId(t), name: `${GEM_NAMES[t]} Drop Earrings`, type: 'equip', slot: 'earring', design: 'jewel', reqLevel: L, family: null, crafted: true, tier: ear.tier,
      stats: { ...up(ear.stats), hp: (ear.stats.hp ?? 0) + L * 2 }, price: Math.round(ear.price * 1.4), color: GEM_COLORS[t],
    });
    out.push({
      id: charmId(t), name: `${WOOD_NAMES[t]} Knot Charm`, type: 'equip', slot: 'charm', reqLevel: L, family: null, crafted: true, tier: t,
      stats: { hp: L * 3, mp: L * 2, wdef: Math.round(L * 0.6), mdef: Math.round(L * 0.6), speed: 1 + Math.floor(L / 20) }, price: 300 + L * L * 2, color: GEM_COLORS[t], wood: WOOD_COLORS[t],
    });
  });
  for (const s of STONES) {
    out.push({ id: s.id, name: s.name, type: 'etc', crafted: true, price: Math.round(40 * s.tier * s.tier + (s.id === 'polish_star' ? 400 : 0)), color: s.color, stone: true,
      desc: `Bring it to Tora's forge: one stone makes a polish ${Math.round(s.boost * 100)}% more likely to take (gear up to Lv ${s.upTo === 100 ? 'any' : s.upTo}).` });
  }
  for (const tn of TONICS) out.push({ id: tn.id, name: tn.name, type: 'use', crafted: true, price: tn.price, effect: tn.effect, color: tn.color, desc: tn.desc });
  for (const [kind, k] of Object.entries(TOOL_KINDS)) {
    for (let t = 1; t <= 4; t++) {
      const life = toolLife(kind, t);
      const made = (k.made === 'wood' ? WOOD_NAMES : METAL_NAMES)[t];
      const what = { fishing: 'fishing', mining: 'mining', gathering: 'gathering herbs, flowers and fruit', chopping: 'chopping wood' }[life.slot];
      out.push({
        id: toolId(kind, t), name: `${made} ${k.name}`, type: 'etc', stack: 1, crafted: true, tool: kind, life,
        price: 150 + t * t * 220, color: kind === 'rod' ? WOOD_COLORS[t] : METAL_COLORS[t],
        desc: `A tool for ${what}. Equip it (here or at a craft bench): ${Math.round(life.speed * 100)}% faster, ${Math.round(life.yield * 100)}% chance of one more find, +${(life.rare * 100).toFixed(1)}% rare finds.`,
      });
    }
  }
  return out;
}
