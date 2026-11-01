// Gathering and mining (world/gathering.js, data/gathering.js) and what the finds are for.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MAPS } from '../src/data/maps.js';
import { ITEMS } from '../src/data/items.js';
import { NODES, KINDS, GATHERED } from '../src/data/gathering.js';
import { DISHES } from '../src/data/cooking.js';
import { MOVES } from '../src/render/moves.js';
import { createCharacter } from '../src/core/character.js';
import { addItem, countItem } from '../src/core/inventory.js';
import { makeEquip, polish, oreFor, ORE_USE, boostedChance, polishChance } from '../src/core/items.js';
import { surfacesOf } from '../src/world/physics.js';
import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { nodeReady } from '../src/world/gathering.js';

const DT = 1 / 60;
const press = (k) => ({ held: new Set(), pressed: new Set(k ? [k] : []) });
const step = (w, secs, k = null) => {
  for (let i = 0; i < secs * 60; i++) updateWorld(w, DT, press(i === 0 ? k : null));
};

test('every spot stands on something, its finds are items, and each kind has a move', () => {
  for (const [map, nodes] of Object.entries(NODES)) {
    assert.ok(MAPS[map], map);
    for (const n of nodes) {
      assert.ok(surfacesOf(MAPS[map]).some((f) => n.x >= f.x1 && n.x <= f.x2 && Math.abs(f.yAt(n.x) - n.y) < 2), `${map} ${n.kind} at ${n.x} stands on something`);
      assert.ok(KINDS[n.kind] && MOVES[KINDS[n.kind].move], `${n.kind} has a move`);
      for (const id of [...Object.keys(n.pool), ...(n.rare ? [n.rare[0]] : [])]) assert.ok(ITEMS[id]?.gathered, `${map} gives ${id}`);
    }
  }
  // Every find is good for something: a dish, Tora's forge, or at least a shop.
  for (const [id] of GATHERED) {
    const cooked = DISHES.some((d) => d.needs[id]);
    assert.ok(cooked || /forge/.test(ITEMS[id].desc), `${id} has a use`);
    assert.ok(ITEMS[id].price > 0, `${id} sells`);
  }
});

test('Up at a spot gathers its finds, then it rests until it grows back', () => {
  const w = createWorld(createCharacter('Picker', {}));
  loadMap(w, 'meadow1', 'west');
  w.mobs = [];
  w.spawner.slots = [];
  const i = NODES.meadow1.findIndex((n) => n.kind === 'herb');
  const n = NODES.meadow1[i];
  Object.assign(w.body, { x: n.x, y: n.y, onGround: true, vx: 0, vy: 0 });
  step(w, 0.1, 'ArrowUp');
  assert.ok(w.gathering, 'gathering');
  assert.equal(w.pose?.kind, 'gather');
  step(w, KINDS.herb.secs + 0.2);
  assert.equal(w.gathering, null);
  assert.ok(countItem(w.char.inventory, 'clover') >= 1, 'got clover');
  assert.ok(!nodeReady(w, i), 'resting');
  const had = countItem(w.char.inventory, 'clover');
  step(w, 0.1, 'ArrowUp');
  assert.ok(!w.gathering, 'nothing to pick while it grows back');
  assert.equal(countItem(w.char.inventory, 'clover'), had);
  step(w, KINDS.herb.rest);
  assert.ok(nodeReady(w, i), 'grown back');
});

test('walking off stops gathering with nothing', () => {
  const w = createWorld(createCharacter('Quitter', {}));
  loadMap(w, 'meadow1', 'west');
  w.mobs = [];
  w.spawner.slots = [];
  const n = NODES.meadow1.find((q) => q.kind === 'ore');
  Object.assign(w.body, { x: n.x, y: n.y, onGround: true, vx: 0, vy: 0 });
  step(w, 0.1, 'ArrowUp');
  assert.equal(w.pose?.kind, 'mine');
  for (let k = 0; k < 10; k++) updateWorld(w, DT, { held: new Set(['ArrowRight']), pressed: new Set() });
  step(w, KINDS.ore.secs);
  assert.equal(w.gathering, null);
  assert.equal(countItem(w.char.inventory, 'copper_ore'), 0);
});

test("ore at Tora's makes a polish likelier to take, and is used up", () => {
  const c = createCharacter('Smith', {});
  c.gold = 1e6;
  const inst = makeEquip(Object.keys(ITEMS).find((id) => ITEMS[id].slot && ITEMS[id].slot !== 'weapon' && (ITEMS[id].reqLevel ?? 0) <= 20), {});
  inst.polish = 6;
  assert.equal(oreFor(inst)?.id, 'copper_ore');
  assert.ok(boostedChance(inst, 'copper_ore') > polishChance(inst));
  assert.ok(boostedChance(inst, 'rose_quartz') > boostedChance(inst, 'copper_ore'));
  assert.equal(polish(c, inst, () => 0.5, 'copper_ore').why, 'ore', 'no ore, no boosted try');
  addItem(c.inventory, 'copper_ore', ORE_USE);
  const r = polish(c, inst, () => 0.99 * boostedChance(inst, 'copper_ore'), 'copper_ore');
  assert.ok(r.ok, 'a roll that only the boost makes good takes');
  assert.equal(countItem(c.inventory, 'copper_ore'), 0);
});
