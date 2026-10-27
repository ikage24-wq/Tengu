// Throwing stars: a gauntlet throws stars from your bag, one per throw. Sets stack to 500, the
// stars add their attack, better stars need a higher level, and shops recharge used sets.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { createCharacter, gainExp, advanceJob } from '../src/core/character.js';
import { makeEquip } from '../src/core/items.js';
import { computeStats } from '../src/core/stats.js';
import { addItem, activeStar, rechargePrice } from '../src/core/inventory.js';
import { ITEMS } from '../src/data/items.js';
import { spawnMob } from '../src/world/mobs.js';
import { cast } from '../src/world/combat.js';
import { giveFirstStars } from '../src/core/save.js';

const DT = 1 / 60;
const idle = { held: new Set(), pressed: new Set(), locked: false };
const run = (w, seconds) => {
  for (let i = 0; i < seconds * 60; i++) updateWorld(w, DT, idle);
};
const stars = (c) => c.inventory.use.filter((e) => ITEMS[e.id].star).reduce((n, e) => n + e.qty, 0);

function thief(level = 25) {
  const c = createCharacter('T', {});
  gainExp(c, 1e6);
  c.level = level;
  advanceJob(c, 'thief');
  c.equipment.weapon = makeEquip('gauntlet_20', {});
  return c;
}

function arena(c) {
  const w = createWorld(c);
  loadMap(w, 'woods', 'west');
  w.god = true;
  w.spawner.slots = [];
  w.mobs = [];
  const m = spawnMob(w.map, { mob: 'boarlet', x: 400, y: w.map.groundY });
  m.def = { ...m.def, hp: 1e9, eva: 0, aggro: false, speed: 0 };
  m.hp = 1e9;
  w.mobs.push(m);
  Object.assign(w.body, { x: 300, y: w.map.groundY, facing: 1, onGround: true });
  run(w, 0.2);
  return w;
}

test('new thieves start with a full set of Pebble Stars', () => {
  const c = thief();
  assert.deepEqual(c.inventory.use.filter((e) => ITEMS[e.id].star), [{ id: 'star_pebble', qty: 500 }]);
});

test('older thief saves get their first set once', () => {
  const c = thief();
  c.inventory.use = [];
  delete c.gotStars;
  giveFirstStars(c);
  assert.equal(stars(c), 500);
  c.inventory.use = [];
  giveFirstStars(c);
  assert.equal(stars(c), 0, 'only once');
});

test('star sets stack to 500', () => {
  const c = thief();
  c.inventory.use = [];
  addItem(c.inventory, 'star_steel', 600);
  assert.deepEqual(c.inventory.use.map((e) => e.qty), [500, 100]);
});

test('stars add their attack to a gauntlet, and only stars your level allows are thrown', () => {
  const c = thief(15);
  const withPebble = computeStats(c).watk;
  c.inventory.use = [];
  assert.equal(withPebble - computeStats(c).watk, 15);
  addItem(c.inventory, 'star_mint', 500);
  assert.equal(activeStar(c), null, 'Mint Stars need level 20');
  addItem(c.inventory, 'star_steel', 500);
  assert.equal(activeStar(c).id, 'star_steel');
  c.level = 20;
  assert.equal(activeStar(c).id, 'star_mint', 'the top set goes first');
});

test('every throw uses up stars, and with none left you cannot throw', () => {
  const w = arena(thief());
  const c = w.char;
  updateWorld(w, DT, { held: new Set(), pressed: new Set(['KeyZ']), locked: false });
  run(w, 1);
  assert.ok(stars(c) < 500, 'a basic throw used a star');
  const before = stars(c);
  c.skills.luckyseven = 10;
  c.mp = 9999;
  assert.ok(cast(w, 'luckyseven').ok);
  assert.equal(before - stars(c), 0, 'the stars leave on the throw, not the press');
  run(w, 0.4);
  assert.equal(before - stars(c), 2, "Lucky Seven's first part throws two");
  run(w, 1.5);
  c.inventory.use = [];
  assert.equal(cast(w, null).reason, 'stars');
  assert.equal(cast(w, 'luckyseven').reason, 'stars');
});

test('recharging a set costs what its missing stars are worth', () => {
  assert.equal(rechargePrice(ITEMS.star_pebble, 250), 250);
  assert.equal(rechargePrice(ITEMS.star_moon, 499), 24);
  assert.equal(rechargePrice(ITEMS.star_moon, 500), 0);
});
