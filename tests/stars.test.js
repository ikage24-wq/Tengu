// Throwing stars: a gauntlet throws its own stars (better ones the higher its level), which add
// their attack and never run out; there are no star items to buy or carry.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { createCharacter, gainExp, advanceJob } from '../src/core/character.js';
import { makeEquip, thrownStars } from '../src/core/items.js';
import { computeStats } from '../src/core/stats.js';
import { ITEMS, gauntletStars } from '../src/data/items.js';
import { spawnMob } from '../src/world/mobs.js';
import { cast } from '../src/world/combat.js';

const DT = 1 / 60;
const idle = { held: new Set(), pressed: new Set(), locked: false };
const run = (w, seconds) => {
  for (let i = 0; i < seconds * 60; i++) updateWorld(w, DT, idle);
};

function thief(level = 25, weapon = 'gauntlet_20') {
  const c = createCharacter('T', {});
  gainExp(c, 1e6);
  c.level = level;
  advanceJob(c, 'thief');
  c.equipment.weapon = makeEquip(weapon, {});
  return c;
}

test('no star items: they are not sold, dropped or given', () => {
  assert.ok(!Object.values(ITEMS).some((d) => d.star), 'no star items');
  assert.ok(!thief().inventory.use.some((e) => e.id.startsWith('star_')), 'new thieves get none');
});

test('a gauntlet throws its own stars, better the higher its level, and they add their attack', () => {
  assert.equal(gauntletStars(0).key, 'pebble');
  assert.equal(gauntletStars(20).key, 'mint');
  assert.equal(gauntletStars(85).key, 'starlight');
  const c = thief(25, 'gauntlet_20');
  assert.equal(thrownStars(c).key, 'mint');
  const withStars = computeStats(c).watk;
  const plain = ITEMS.gauntlet_20.stats.watk;
  assert.ok(withStars >= plain + 19, 'the stars add their attack');
  c.equipment.weapon = makeEquip('dagger_20', {});
  assert.equal(thrownStars(c), null, 'only a gauntlet throws stars');
});

