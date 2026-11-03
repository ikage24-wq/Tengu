// Crafting (data/crafting.js, core/crafting.js, world/crafting.js): the bench in every town, the
// recipes, the Artisan gear against shop and drop gear, quality odds, tools and polishing stones.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MAPS, TOWNS } from '../src/data/maps.js';
import { ITEMS, GEAR_FAMILIES, JOB_SLOTS, EQUIP_SLOTS } from '../src/data/items.js';
import { NPCS } from '../src/data/npcs.js';
import { RECIPES, RECIPE_BY_ID, ARTISAN_LEVELS, FAMILY_WEAPONS, TIER_LEVEL as CRAFT_TIER_LEVEL, TOOL_KINDS, TOOL_SLOTS, artisanId, artisanWeaponId, toolId } from '../src/data/crafting.js';
import { TIER_LEVEL, lifeLevel } from '../src/core/life.js';
import { createCharacter } from '../src/core/character.js';
import { addItem, countItem, removeItem } from '../src/core/inventory.js';
import { makeEquip, polish, boostedChance, polishChance } from '../src/core/items.js';
import { recipesIn, craftBlocker, qualityOdds, rollQuality, craft, makeCrafted, equipTool, lifeTool, toolEquipped } from '../src/core/crafting.js';
import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { startCrafting, benchHere } from '../src/world/crafting.js';
import { groundAt } from '../src/world/physics.js';
import { rollLoot } from '../src/world/drops.js';
import { MOBS } from '../src/data/mobs.js';
import { hasRod } from '../src/world/fishing.js';

const DT = 1 / 60;
const idle = (keys = []) => ({ held: new Set(keys), pressed: new Set() });

function worldAt(town = 'sprout', job = 'warrior', level = 30) {
  const char = createCharacter('Hana', {});
  Object.assign(char, { job, level });
  const w = createWorld(char);
  loadMap(w, town, 'west');
  w.god = true;
  w.log = () => {};
  Object.assign(w.body, { x: w.map.bench, y: groundAt(w.map, w.map.bench), vx: 0, vy: 0, onGround: true });
  return w;
}
const giveNeeds = (char, r, k = 1) => {
  for (const [id, n] of Object.entries(r.needs)) addItem(char.inventory, id, n * k);
};
const setCraft = (char, level) => ((char.life ??= {}).crafting = { level, exp: 0 });

test('every recipe is real: its materials and result are items, its level fits its tier', () => {
  assert.deepEqual(CRAFT_TIER_LEVEL, TIER_LEVEL, 'the catalogue keeps the same tier levels as the life core');
  assert.ok(RECIPES.length > 100);
  assert.equal(new Set(RECIPES.map((r) => r.id)).size, RECIPES.length, 'recipe ids are unique');
  for (const r of RECIPES) {
    assert.ok(ITEMS[r.makes], `${r.id} makes ${r.makes}`);
    assert.ok(Object.keys(r.needs).length, `${r.id} needs something`);
    for (const [id, n] of Object.entries(r.needs)) assert.ok(ITEMS[id] && n > 0, `${r.id} needs ${id}`);
    assert.ok(r.tier >= 1 && r.tier <= 4, `${r.id} tier`);
    assert.ok(r.level >= TIER_LEVEL[r.tier] && r.level <= 50, `${r.id} level ${r.level} fits tier ${r.tier}`);
    assert.ok(r.qty >= 1);
  }
  // The shared materials, exactly by the plan's ids.
  for (const id of ['copper_ore', 'iron_ore', 'silver_ore', 'mithril_ore', 'rose_quartz', 'amethyst', 'sapphire', 'starstone', 'oak_log', 'maple_log', 'cedar_log', 'skywood_log', 'cotton', 'silkmoss', 'lotus_fiber', 'cloud_cotton']) {
    assert.equal(ITEMS[id]?.type, 'etc', `${id} is a material`);
    assert.ok(RECIPES.some((r) => r.needs[id]), `${id} is used in a recipe`);
  }
  // Every category has something to make from the first tier.
  for (const cat of ['gear', 'accessory', 'tool', 'potion', 'stone']) assert.ok(RECIPES.some((r) => r.cat === cat && r.tier === 1), cat);
});

test('every job has an Artisan line at Lv 10 to 50: every armor slot and every weapon it uses', () => {
  for (const family of GEAR_FAMILIES) {
    for (const L of ARTISAN_LEVELS) {
      for (const slot of JOB_SLOTS) {
        const def = ITEMS[artisanId(family, slot, L)];
        assert.ok(def && def.family === family && def.reqLevel === L && def.design === 'job', `${family} ${slot} ${L}`);
        assert.ok(RECIPE_BY_ID[`craft_${def.id}`], `${def.id} has a recipe`);
      }
      for (const type of FAMILY_WEAPONS[family]) assert.ok(ITEMS[artisanWeaponId(type, L)]?.weaponType === type, `${type} ${L}`);
    }
  }
  // A warrior sees warrior gear; a Novice sees none yet.
  const c = createCharacter('Hana', {});
  assert.equal(recipesIn(c, 'gear').length, 0);
  c.job = 'warrior';
  assert.ok(recipesIn(c, 'gear').every((r) => r.family === 'warrior'));
  assert.ok(recipesIn(c, 'tool').length >= 16);
});

test('a Fine Artisan piece is a little better than the shop and drop piece of its level', () => {
  const total = (stats) => Object.values(stats).reduce((a, b) => a + b, 0);
  for (const family of GEAR_FAMILIES) {
    for (const L of ARTISAN_LEVELS) {
      for (const slot of JOB_SLOTS) {
        const shop = makeEquip(`${family}_${slot}_${L}`);
        const fine = makeCrafted(artisanId(family, slot, L), 0);
        for (const [k, v] of Object.entries(shop.stats)) assert.ok((fine.stats[k] ?? 0) >= v, `${fine.id} ${k}`);
        assert.ok(total(fine.stats) > total(shop.stats), `${fine.id} beats the shop piece`);
        assert.ok(total(fine.stats) < total(shop.stats) * 1.3, `${fine.id} only a little better`);
      }
      for (const type of FAMILY_WEAPONS[family]) {
        const shop = makeEquip(`${type}_${L}`);
        const fine = makeCrafted(artisanWeaponId(type, L), 0);
        assert.ok(fine.stats.watk > shop.stats.watk, `${fine.id} hits harder`);
      }
    }
  }
  // Better qualities are better again; never dropped, never on bots.
  const id = artisanId('archer', 'top', 30);
  const [f, s, m] = [0, 1, 2].map((q) => makeCrafted(id, q));
  assert.ok(f.stats.wdef <= s.stats.wdef && s.stats.wdef < m.stats.wdef);
  assert.ok((m.stats.dex ?? 0) > (f.stats.dex ?? 0), 'Masterwork adds to the main stat');
  assert.equal(m.quality, 2);
  for (const def of Object.values(MOBS)) {
    for (let i = 0; i < 20; i++) for (const l of rollLoot(def)) if (l.kind === 'item') assert.ok(!ITEMS[l.id ?? l.inst?.id]?.crafted, 'crafted gear never drops');
  }
});

test('quality odds rise with the Crafting level', () => {
  const c = createCharacter('Hana', {});
  const r = RECIPE_BY_ID[`craft_${artisanId('mage', 'hat', 20)}`];
  let last = null;
  for (let lv = r.level; lv <= 50; lv++) {
    setCraft(c, lv);
    const odds = qualityOdds(c, r);
    assert.ok(Math.abs(odds[0] + odds[1] + odds[2] - 1) < 1e-9);
    assert.ok(odds.every((p) => p >= 0));
    if (last) assert.ok(odds[2] >= last[2] && odds[1] >= last[1], `odds don't fall at ${lv}`);
    last = odds;
  }
  setCraft(c, r.level);
  const low = qualityOdds(c, r);
  assert.ok(last[2] > low[2] * 3, 'a master is much likelier to make a Masterwork');
  assert.equal(rollQuality([0.5, 0.3, 0.2], () => 0.1), 2);
  assert.equal(rollQuality([0.5, 0.3, 0.2], () => 0.4), 1);
  assert.equal(rollQuality([0.5, 0.3, 0.2], () => 0.9), 0);
  assert.deepEqual(qualityOdds(c, RECIPE_BY_ID.craft_red_potion), [1, 0, 0], 'tonics have no quality');
});

test('crafting uses the materials, makes the piece, and gives Crafting and character EXP', () => {
  const w = worldAt();
  const c = w.char;
  const r = RECIPE_BY_ID[`craft_${artisanId('warrior', 'top', 20)}`];
  giveNeeds(c, r);
  assert.equal(craftBlocker(c, r), 'level', 'needs the Crafting level');
  assert.equal(craft(w, r).ok, false);
  setCraft(c, r.level);
  assert.equal(craftBlocker(c, r), null);
  const exp = c.exp;
  const out = craft(w, r, () => 0.99);
  assert.ok(out.ok && out.inst.id === r.makes && out.quality === 0);
  for (const id of Object.keys(r.needs)) assert.equal(countItem(c.inventory, id), 0, `${id} used up`);
  assert.ok(c.inventory.equip.some((e) => e.id === r.makes && e.quality === 0));
  assert.ok(c.life.crafting.exp > 0 || c.life.crafting.level > r.level, 'Crafting EXP');
  assert.ok(c.exp > exp || c.level > 30, 'character EXP');
  assert.equal(craftBlocker(c, r), 'materials');
  // A batch of tonics.
  const t = RECIPE_BY_ID.craft_red_potion;
  giveNeeds(c, t);
  const before = countItem(c.inventory, 'red_potion');
  assert.ok(craft(w, t).ok);
  assert.equal(countItem(c.inventory, 'red_potion'), before + t.qty);
});

test('the crafting moment at the bench: the hero works, then it is made; walking away cancels', () => {
  const w = worldAt();
  const c = w.char;
  const r = RECIPE_BY_ID.craft_rod_oak;
  giveNeeds(c, r, 2);
  // Up at the bench opens the window.
  w.events.length = 0;
  updateWorld(w, DT, { held: new Set(), pressed: new Set(['ArrowUp']) });
  assert.ok(w.events.some((e) => e.type === 'craft'), 'Up at the bench opens the crafting window');
  assert.ok(benchHere(w));
  assert.equal(startCrafting(w, r, 'mine'), null);
  assert.ok(w.crafting && w.pose?.kind === 'mine');
  for (let i = 0; i < 30; i++) updateWorld(w, DT, idle());
  assert.equal(countItem(c.inventory, 'rod_oak'), 0, 'not yet');
  for (let i = 0; i < 120; i++) updateWorld(w, DT, idle());
  assert.equal(w.crafting, null);
  assert.equal(countItem(c.inventory, 'rod_oak'), 1, 'made');
  // Cancelled by walking off: nothing is used.
  const have = countItem(c.inventory, 'oak_log');
  assert.equal(startCrafting(w, r, 'mine'), null);
  for (let i = 0; i < 10; i++) updateWorld(w, DT, idle(['ArrowRight']));
  assert.equal(w.crafting, null);
  assert.equal(countItem(c.inventory, 'oak_log'), have);
  // Not away from a bench.
  w.body.x = w.map.bench + 400;
  for (let i = 0; i < 5; i++) updateWorld(w, DT, idle());
  assert.equal(startCrafting(w, r, 'mine'), 'bench');
});

test('tools: every kind in four tiers, equipped into lifeTools, better each tier', () => {
  for (const kind of Object.keys(TOOL_KINDS)) {
    let prev = null;
    for (let t = 1; t <= 4; t++) {
      const def = ITEMS[toolId(kind, t)];
      assert.ok(def?.life, `${kind} ${t}`);
      assert.ok(TOOL_SLOTS.includes(def.life.slot) && def.life.skill);
      if (prev) assert.ok(def.life.speed > prev.speed && def.life.yield > prev.yield && def.life.rare > prev.rare);
      prev = def.life;
      assert.ok(RECIPE_BY_ID[`craft_${def.id}`].level >= TIER_LEVEL[t]);
    }
  }
  const c = createCharacter('Hana', {});
  assert.equal(equipTool(c, 'pickaxe_iron'), false, "can't equip a tool you don't have");
  addItem(c.inventory, 'pickaxe_iron', 1);
  addItem(c.inventory, 'woodaxe_copper', 1);
  assert.ok(equipTool(c, 'pickaxe_iron'));
  assert.ok(equipTool(c, 'woodaxe_copper'));
  assert.equal(c.lifeTools.mining, 'pickaxe_iron');
  assert.equal(c.lifeTools.chopping, 'woodaxe_copper');
  assert.ok(toolEquipped(c, 'pickaxe_iron'));
  assert.equal(lifeTool(c, 'mining').speed, ITEMS.pickaxe_iron.life.speed);
  removeItem(c.inventory, 'pickaxe_iron', 1);
  assert.equal(lifeTool(c, 'mining'), null, 'a sold tool no longer counts');
  // A bench-made rod fishes.
  assert.equal(hasRod(c), false);
  addItem(c.inventory, 'rod_maple', 1);
  assert.ok(hasRod(c));
});

test("polishing stones help at Tora's forge, for gear up to their level", () => {
  const c = createCharacter('Hana', {});
  c.gold = 1e7;
  const inst = makeEquip('warrior_top_20');
  assert.ok(boostedChance(inst, 'polish_copper') > polishChance(inst));
  addItem(c.inventory, 'polish_copper', 1);
  const r = polish(c, inst, () => 0, 'polish_copper');
  assert.ok(r.ok);
  assert.equal(countItem(c.inventory, 'polish_copper'), 0, 'one stone a try');
  const high = makeEquip('warrior_top_40');
  addItem(c.inventory, 'polish_copper', 1);
  assert.equal(polish(c, high, () => 0, 'polish_copper').why, 'ore', "a copper stone is too soft for Lv 40 gear");
  addItem(c.inventory, 'polish_silver', 1);
  assert.ok(polish(c, high, () => 0, 'polish_silver').ok);
});

test('rings and charms are worn in their own slots', () => {
  assert.ok(EQUIP_SLOTS.includes('ring') && EQUIP_SLOTS.includes('charm'));
  const c = createCharacter('Hana', {});
  assert.ok('ring' in c.equipment && 'charm' in c.equipment);
  for (const r of RECIPES.filter((q) => q.cat === 'accessory')) {
    const def = ITEMS[r.makes];
    assert.ok(['ring', 'earring', 'charm'].includes(def.slot), r.id);
    assert.ok(Object.keys(def.stats).length >= 2, `${def.id} has useful stats`);
  }
});

test('a craft bench in every town, on the street a short walk from the plaza, clear of the rest', () => {
  for (const id of TOWNS) {
    const m = MAPS[id];
    assert.ok(m.bench != null, `${id} has a bench`);
    assert.ok(Math.abs(m.bench - m.plaza) <= 700, `${id}: the bench is ${Math.abs(m.bench - m.plaza)} from the plaza`);
    // On the ground floor (nothing important up a ladder), on level ground.
    assert.ok(Math.abs(groundAt(m, m.bench - 30) - groundAt(m, m.bench + 30)) < 1, `${id}: level ground`);
    // Clear of the NPCs (so Up opens the bench, not a chat), the stove, the capsule machine and portals.
    for (const n of m.npcs) assert.ok(Math.abs(n.x - m.bench) > 60, `${id}: clear of ${NPCS[n.id]?.name ?? n.id}`);
    for (const x of [m.stove, m.gacha, m.plaza].filter((v) => v != null)) assert.ok(Math.abs(x - m.bench) > 70, `${id}: clear of the stove, machine and fountain`);
    for (const p of m.portals) assert.ok(Math.abs(p.x - m.bench) > 80, `${id}: clear of the ${p.id} portal`);
    // Up at it opens the window.
    const w = worldAt(id);
    w.events.length = 0;
    updateWorld(w, DT, { held: new Set(), pressed: new Set(['ArrowUp']) });
    assert.ok(benchHere(w), `${id}: standing at the bench`);
    assert.ok(w.events.some((e) => e.type === 'craft'), `${id}: Up opens the crafting window`);
  }
  assert.ok(lifeLevel(createCharacter('Hana', {}), 'crafting') === 1);
});
