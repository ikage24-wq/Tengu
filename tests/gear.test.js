import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ITEMS, UNIQUE_IDS, RARITIES } from '../src/data/items.js';
import { NPCS } from '../src/data/npcs.js';
import { makeEquip, rollRarity } from '../src/core/items.js';
import { rollLoot } from '../src/world/drops.js';
import { MOBS } from '../src/data/mobs.js';
import { topShapes, legLook, legShapes, hatShapes, capeShapes, handShapes, earringShapes } from '../src/render/gear.js';
import { dropRetiredItems } from '../src/core/save.js';

const seq = (...values) => {
  let i = 0;
  return () => values[i++ % values.length];
};

test('every equip has a design the renderer draws', () => {
  for (const def of Object.values(ITEMS)) {
    if (def.type !== 'equip') continue;
    const c = def.color;
    let shapes;
    switch (def.slot) {
      case 'hat': shapes = hatShapes(def.design, c); break;
      case 'top': shapes = topShapes(def.design, c); break;
      case 'bottom': shapes = legShapes(11, legLook(def.design, c, '#ffffff'), { design: 'sneakers', color: c }, false); break;
      case 'shoes': shapes = legShapes(11, legLook('pants', c, '#ffffff'), { design: def.design, color: c }, false); break;
      case 'gloves': shapes = handShapes(10, 30, { design: def.design, color: c }, '#ffffff'); break;
      case 'cape': shapes = capeShapes(def.design, c, 0, false); break;
      case 'earring': shapes = earringShapes(def.design, c); break;
    }
    assert.ok(shapes?.length, `${def.id} draws something`);
    assert.ok(def.design, `${def.id} has a design`);
  }
});

test('higher armor tiers look different from lower ones', () => {
  for (const slot of ['hat', 'top', 'bottom', 'shoes']) {
    const designs = new Set([0, 1, 2, 3, 4, 5].map((t) => ITEMS[`${slot}_${t}`].design));
    assert.equal(designs.size, 6, `${slot} has six looks`);
  }
});

test('unique outfits exist for several slots and some are sold in shops', () => {
  assert.ok(UNIQUE_IDS.length >= 10);
  const slots = new Set(UNIQUE_IDS.map((id) => ITEMS[id].slot));
  for (const s of ['hat', 'top', 'cape']) assert.ok(slots.has(s), `unique ${s}`);
  const sold = Object.values(NPCS).flatMap((n) => n.shop ?? []);
  assert.ok(UNIQUE_IDS.some((id) => sold.includes(id)));
  for (const id of sold) assert.ok(ITEMS[id], `shop item ${id} exists`);
});

test('rarity rolls from the chance table', () => {
  assert.equal(rollRarity(() => 0.5), 0);
  assert.equal(rollRarity(() => 0.1), 1);
  assert.equal(rollRarity(() => 0.03), 2);
  assert.equal(rollRarity(() => 0.001), 3);
  assert.equal(RARITIES.length, 4);
});

test('rarer gear has better stats and bonus main stats', () => {
  const normal = makeEquip('top_4', { rarity: 0, rng: () => 0.5 });
  const rare = makeEquip('top_4', { rarity: 1, rng: () => 0.5 });
  const legend = makeEquip('top_4', { rarity: 3, rng: () => 0.5 });
  assert.ok(rare.stats.wdef > normal.stats.wdef);
  assert.ok(legend.stats.wdef > rare.stats.wdef);
  const mains = (s) => ['str', 'dex', 'int', 'luk'].filter((k) => s.stats[k]).length;
  assert.equal(mains(normal), 0);
  assert.equal(mains(rare), 1);
  assert.equal(mains(legend), 4);
  assert.equal(legend.rarity, 3);
});

test('bosses always drop at least Rare gear', () => {
  const loot = rollLoot(MOBS.crystalking, seq(0.9, 0.5, 0.3, 0.7));
  const gear = loot.filter((l) => l.inst);
  assert.equal(gear.length, 3);
  for (const g of gear) assert.notEqual(ITEMS[g.inst.id].slot, 'weapon');
  for (const g of gear) assert.ok(g.inst.rarity >= 1);
});

test('old saves lose weapons that no longer exist instead of breaking', () => {
  const char = {
    equipment: { weapon: { uid: 1, id: 'lollipop_wand' }, hat: { uid: 2, id: 'hat_0' } },
    inventory: { equip: [{ uid: 3, id: 'moon_staff' }, { uid: 4, id: 'sword_2' }], use: [{ id: 'red_potion', qty: 2 }], etc: [] },
    hotkeys: { Digit1: { item: 'red_potion' } },
  };
  dropRetiredItems(char);
  assert.equal(char.equipment.weapon, null);
  assert.equal(char.equipment.hat.id, 'hat_0');
  assert.deepEqual(char.inventory.equip.map((e) => e.id), [], 'the old weapon lines are gone too');
  assert.equal(char.hotkeys.Digit1.item, 'red_potion');
});
