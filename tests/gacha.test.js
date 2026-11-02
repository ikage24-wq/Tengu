import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ITEMS } from '../src/data/items.js';
import { CASH_ITEMS } from '../src/data/cash.js';
import { GACHA_LOOKS, GACHA_MACHINES } from '../src/data/outfits-gacha.js';
import { MAPS } from '../src/data/maps.js';
import { MOBS } from '../src/data/mobs.js';
import { QUESTS } from '../src/data/quests.js';
import { createCharacter, wearOutfit, wornGear } from '../src/core/character.js';
import { addItem, countItem } from '../src/core/inventory.js';
import { rollLoot } from '../src/world/drops.js';
import { pull, pickLook, machineLooks, ownsLook } from '../src/ui/gacha.js';
import { outfitFx } from '../src/render/gacha.js';

const fresh = () => createCharacter('Tester', {});

test('capsule looks only come out of the machines, never the Cash Shop', () => {
  for (const e of GACHA_LOOKS) {
    const def = ITEMS[`cash_gacha_${e.key}`];
    assert.ok(def, e.key);
    assert.equal(def.gacha, e.machine);
    assert.ok(!CASH_ITEMS.includes(def.id), `${e.key} is not sold`);
  }
});

test('every machine stands in its town', () => {
  for (const id of Object.keys(GACHA_MACHINES)) {
    const map = MAPS[GACHA_MACHINES[id].town];
    assert.ok(map?.gacha != null, `${id} has a spot`);
    assert.ok(Math.abs(map.gacha - map.plaza) <= 700, 'a short walk from the plaza');
    assert.ok(machineLooks(id).length > 0);
  }
});

test('a pull spends a ticket, gives something new each time, and stops when the set is done', () => {
  const char = fresh();
  assert.equal(pull(char, 'sprout').why, 'You need a Capsule Ticket.');
  const n = machineLooks('sprout').length;
  addItem(char.inventory, 'gacha_ticket', n + 2);
  const got = new Set();
  for (let i = 0; i < n; i++) {
    const r = pull(char, 'sprout');
    assert.ok(r.look, r.why);
    assert.ok(!got.has(r.look.key), 'never a repeat');
    got.add(r.look.key);
  }
  assert.equal(countItem(char.inventory, 'gacha_ticket'), 2);
  assert.equal(pull(char, 'sprout').why, 'You have the whole set!');
  assert.equal(countItem(char.inventory, 'gacha_ticket'), 2, 'no ticket spent on a complete set');
  assert.equal(pickLook(char, 'sprout'), null);
});

test('rarer pieces come up less often', () => {
  const counts = {};
  const char = fresh();
  let seed = 1;
  const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 4000; i++) {
    const e = pickLook(char, 'sprout', rng);
    counts[e.rarity] = (counts[e.rarity] ?? 0) + 1;
  }
  const per = (r) => counts[r] / GACHA_LOOKS.filter((e) => e.machine === 'sprout' && e.rarity === r).length;
  assert.ok(per('common') > per('rare') && per('rare') > per('star'));
});

test('wearing a piece carries its effect; the whole set adds its bonus', () => {
  const char = fresh();
  addItem(char.inventory, 'gacha_ticket', 6);
  for (let i = 0; i < 6; i++) pull(char, 'sprout');
  while (char.inventory.cash.some((i) => ITEMS[i.id].gacha)) wearOutfit(char, char.inventory.cash.findIndex((i) => ITEMS[i.id].gacha));
  for (const e of machineLooks('sprout')) assert.ok(ownsLook(char, e), `${e.key} still counts as had when worn`);
  const worn = outfitFx(wornGear(char));
  for (const e of machineLooks('sprout')) if (e.fx) assert.ok(worn.fx.has(e.fx), e.fx);
  assert.ok(worn.sets.has('springglow'));
  assert.equal(outfitFx(wornGear(fresh())), null);
});

test('tickets are earned by playing: dailies and bosses give them', () => {
  const dailies = Object.values(QUESTS).filter((q) => q.daily);
  assert.ok(dailies.length);
  for (const q of dailies) assert.ok(q.rewards.items.some((r) => r.id === 'gacha_ticket'), q.id);
  for (const def of Object.values(MOBS).filter((m) => m.boss)) assert.ok(rollLoot(def).some((l) => l.id === 'gacha_ticket'), def.id);
});
