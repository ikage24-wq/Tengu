// Fishing and cooking (world/fishing.js, ui/cooking.js, data/fishing.js, data/cooking.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MAPS } from '../src/data/maps.js';
import { ITEMS } from '../src/data/items.js';
import { FISH, SPOTS } from '../src/data/fishing.js';
import { DISHES } from '../src/data/cooking.js';
import { createCharacter } from '../src/core/character.js';
import { addItem, countItem } from '../src/core/inventory.js';
import { surfacesOf } from '../src/world/physics.js';
import { createWorld, updateWorld, loadMap, useItem } from '../src/world/world.js';
import { cook, knownRecipes } from '../src/ui/cooking.js';

const DT = 1 / 60;
const press = (k) => ({ held: new Set(), pressed: new Set(k ? [k] : []) });
const step = (w, secs, k = null) => {
  for (let i = 0; i < secs * 60; i++) updateWorld(w, DT, press(i === 0 ? k : null));
};

test('every fishing spot is somewhere you can stand, its fish real, every fish and dish an item', () => {
  for (const [map, spots] of Object.entries(SPOTS)) {
    assert.ok(MAPS[map], map);
    for (const s of spots) {
      assert.ok(surfacesOf(MAPS[map]).some((f) => s.x >= f.x1 && s.x <= f.x2 && Math.abs(f.yAt(s.x) - s.y) < 2), `${map} spot stands on something`);
      for (const id of Object.keys(s.pool)) assert.ok(ITEMS[id]?.fish, `${map} has ${id}`);
    }
  }
  for (const f of FISH) assert.ok(Object.values(SPOTS).flat().some((s) => s.pool[f.id]), `${f.id} lives somewhere`);
  for (const d of DISHES) {
    assert.ok(ITEMS[d.id]?.effect?.food, d.id);
    for (const id of Object.keys(d.needs)) assert.ok(ITEMS[id], `${d.id} needs ${id}`);
  }
  for (const t of ['sprout', 'harbor', 'crag', 'grove']) assert.ok(MAPS[t].stove != null, `${t} has a stove`);
});

test('cast, wait for the bite, hook it: a fish, its count, and its recipe', (t) => {
  let seed = 7;
  t.mock.method(Math, 'random', () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648));
  const char = createCharacter('Hana', {});
  // (The glade's pond is a tier 2 spot: it needs Fishing Lv 12.)
  char.life = { fishing: { level: 12, exp: 0 } };
  const w = createWorld(char);
  loadMap(w, 'glade', 'west');
  w.god = true;
  const spot = SPOTS.glade[0];
  Object.assign(w.body, { x: spot.x, y: spot.y, onGround: true });
  step(w, 0.1, 'ArrowUp');
  assert.equal(w.fishing, null, 'no rod, no fishing');
  addItem(char.inventory, 'fishing_rod', 1);
  step(w, 0.1, 'ArrowUp');
  assert.ok(w.fishing, 'casting');
  // Hooking too early scares it off.
  step(w, 0.8);
  assert.equal(w.fishing.phase, 'wait');
  step(w, 0.05, 'KeyZ');
  assert.equal(w.fishing.phase, 'miss');
  step(w, 1.2);
  assert.equal(w.fishing, null);
  // Wait for the bite this time, then hook.
  step(w, 0.1, 'ArrowUp');
  for (let i = 0; i < 60 * 30 && w.fishing?.phase !== 'bite'; i++) updateWorld(w, DT, press());
  assert.equal(w.fishing.phase, 'bite');
  const fish = w.fishing.fish;
  step(w, 0.05, 'KeyZ');
  assert.equal(countItem(char.inventory, fish.id), 1);
  assert.equal(char.fishBook[fish.id].n, 1);
  const learned = DISHES.find((d) => d.learn === fish.id);
  if (learned) assert.ok(char.recipes.includes(learned.id));
  // Walking off stops fishing.
  step(w, 2);
  step(w, 0.1, 'ArrowUp');
  updateWorld(w, DT, { held: new Set(['ArrowLeft']), pressed: new Set() });
  assert.equal(w.fishing, null);
});

test('cooking makes two dishes, no stirring; eating heals, and different dishes add up', () => {
  const char = createCharacter('Hana', {});
  assert.ok(knownRecipes(char).length >= 3, 'the basics from the start');
  const d = DISHES.find((x) => x.id === 'dish_skewer');
  addItem(char.inventory, 'fish_sardine', 2);
  addItem(char.inventory, 'shell', 1);
  assert.equal(cook(char, d), 2);
  assert.equal(countItem(char.inventory, 'fish_sardine'), 0);
  const w = createWorld(char);
  w.god = true;
  const atk = w.stats.watk;
  char.hp = 1;
  assert.ok(useItem(w, 'dish_skewer'));
  updateWorld(w, DT, press());
  assert.ok(char.hp > 1);
  assert.equal(w.stats.watk, atk + 6);
  // A second, different dish adds its bonus on top.
  addItem(char.inventory, 'dish_ricebowl', 1);
  w.itemReadyAt = 0;
  assert.ok(useItem(w, 'dish_ricebowl'));
  updateWorld(w, DT, press());
  assert.equal(w.stats.watk, atk + 16, 'both bonuses at once');
  assert.equal(cook(char, d), 0, 'nothing left to cook with');
});

test("a reworked map's fishing spots are quiet nooks no monster reaches", async () => {
  const { MOBS } = await import('../src/data/mobs.js');
  // The maps rebuilt to the new map rules so far (the others get this when they're reworked).
  for (const id of ['meadow1', 'meadow2', 'glade', 'springs', 'peak', 'starfall']) {
    const m = MAPS[id];
    for (const sp of SPOTS[id]) {
      const surf = surfacesOf(m).find((s) => sp.x >= s.x1 && sp.x <= s.x2 && Math.abs(s.yAt(sp.x) - sp.y) < 2);
      for (const s of m.spawns) {
        if (MOBS[s.mob].fly) assert.ok(Math.abs(s.x - sp.x) >= 240 || Math.abs(s.y - sp.y) >= 120, `${id}: a ${s.mob} flies near the spot`);
        else assert.ok(!(s.x >= surf.x1 && s.x <= surf.x2 && Math.abs(surf.yAt(s.x) - s.y) < 4), `${id}: a ${s.mob} walks the spot's floor`);
      }
    }
  }
});
