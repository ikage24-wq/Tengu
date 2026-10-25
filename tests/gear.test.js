import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ITEMS, UNIQUE_IDS, RARITIES } from '../src/data/items.js';
import { NPCS } from '../src/data/npcs.js';
import { makeEquip, rollRarity } from '../src/core/items.js';
import { rollLoot } from '../src/world/drops.js';
import { MOBS } from '../src/data/mobs.js';
import { topShapes, legLook, legShapes, hatShapes, capeShapes, handShapes, earringShapes } from '../src/render/gear.js';
import { weaponShapes } from '../src/render/weapons.js';

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
      case 'weapon': shapes = weaponShapes(def.weaponType, c, def.tier, def.special)?.shapes; break;
      case 'hat': shapes = hatShapes(def.design, c); break;
      case 'top': shapes = topShapes(def.design, c); break;
      case 'bottom': shapes = legShapes(11, legLook(def.design, c, '#ffffff'), { design: 'sneakers', color: c }, false); break;
      case 'shoes': shapes = legShapes(11, legLook('pants', c, '#ffffff'), { design: def.design, color: c }, false); break;
      case 'gloves': shapes = handShapes(10, 30, { design: def.design, color: c }, '#ffffff'); break;
      case 'cape': shapes = capeShapes(def.design, c, 0, false); break;
      case 'earring': shapes = earringShapes(def.design, c); break;
    }
    assert.ok(shapes?.length, `${def.id} draws something`);
    if (def.slot !== 'weapon') assert.ok(def.design, `${def.id} has a design`);
  }
});

test('higher armor tiers look different from lower ones', () => {
  for (const slot of ['hat', 'top', 'bottom', 'shoes']) {
    const designs = new Set([0, 1, 2, 3, 4, 5].map((t) => ITEMS[`${slot}_${t}`].design));
    assert.equal(designs.size, 6, `${slot} has six looks`);
  }
});

test('unique gear exists for several slots and some is sold in shops', () => {
  assert.ok(UNIQUE_IDS.length >= 15);
  const slots = new Set(UNIQUE_IDS.map((id) => ITEMS[id].slot));
  for (const s of ['weapon', 'hat', 'top', 'cape']) assert.ok(slots.has(s), `unique ${s}`);
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
  const normal = makeEquip('sword_4', { rarity: 0, rng: () => 0.5 });
  const rare = makeEquip('sword_4', { rarity: 1, rng: () => 0.5 });
  const legend = makeEquip('sword_4', { rarity: 3, rng: () => 0.5 });
  assert.ok(rare.stats.watk > normal.stats.watk);
  assert.ok(legend.stats.watk > rare.stats.watk);
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
  for (const g of gear) assert.ok(g.inst.rarity >= 1);
});

test('weapons grow with tier and every animation frame builds', () => {
  for (const type of ['sword', 'axe', 'spear', 'wand', 'staff', 'bow', 'crossbow', 'dagger', 'claw']) {
    const low = weaponShapes(type, '#ffffff', 0);
    const high = weaponShapes(type, '#ffffff', 8);
    assert.ok(high.w * high.h > low.w * low.h, `${type} gets bigger`);
    for (let f = 0; f < 4; f++) {
      const w = weaponShapes(type, '#ffffff', 8, null, f);
      assert.ok(w.shapes.length && w.grip[1] < w.h, `${type} frame ${f}`);
    }
  }
  // Top-tier swords are taller than the 48px hero.
  assert.ok(weaponShapes('sword', '#ffffff', 8).h > 48);
});

test('the sword path climbs four steps, then splits into five elements', () => {
  const path = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((t) => ITEMS[`sword_${t}`]);
  for (let t = 1; t < 4; t++) assert.ok(path[t].stats.watk > path[t - 1].stats.watk && path[t].reqLevel > path[t - 1].reqLevel);
  const ends = path.slice(4);
  assert.deepEqual(ends.map((d) => d.element), ['holy', 'cosmic', 'storm', 'fire', 'water']);
  for (const d of ends) {
    assert.equal(d.reqLevel, 45);
    assert.ok(d.stats.watk > path[3].stats.watk);
  }
  const sold = Object.values(NPCS).flatMap((n) => n.shop ?? []);
  for (const d of ends) assert.ok(!sold.includes(d.id), `${d.id} is drop-only`);
  // Elemental swords animate: their frames differ.
  const a = weaponShapes('sword', '#fff', 7, null, 0).shapes;
  const b = weaponShapes('sword', '#fff', 7, null, 2).shapes;
  assert.notDeepEqual(a, b);
});
