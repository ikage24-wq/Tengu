import { ownsSkin } from '../src/data/cosmetics.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ITEMS } from '../src/data/items.js';
import { CASH_ITEMS } from '../src/data/cash.js';
import { GACHA_LOOKS, GACHA_MACHINES, GACHA_PRIZES } from '../src/data/outfits-gacha.js';
import { MAPS } from '../src/data/maps.js';
import { MOBS } from '../src/data/mobs.js';
import { QUESTS } from '../src/data/quests.js';
import { createCharacter, wearOutfit, wornGear } from '../src/core/character.js';
import { addItem, countItem } from '../src/core/inventory.js';
import { rollLoot } from '../src/world/drops.js';
import { pull, pickLook, machineLooks, ownsLook, albumOf, albumSlots, albumFull, sealAlbum } from '../src/ui/gacha.js';
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
    assert.ok(map.gacha > 40 && map.gacha < map.width - 40, 'on the town map');
    assert.ok(machineLooks(id).length > 0);
  }
});

test('a pull spends a ticket and always gives something: a piece or a skin never twice, else the bundle', () => {
  const char = fresh();
  const n = machineLooks('sprout').length + (GACHA_PRIZES.sprout ?? []).filter((z) => z.kind !== 'bundle').length;
  addItem(char.inventory, 'gacha_ticket', 60);
  const got = new Set();
  let bundles = 0;
  for (let i = 0; i < 60; i++) {
    const r = pull(char, 'sprout');
    assert.ok(r.look || r.prize, r.why);
    if (r.prize?.kind === 'bundle') {
      bundles++;
      continue;
    }
    const key = r.look ? `look:${r.look.key}` : `${r.prize.kind}:${r.prize.key}`;
    assert.ok(!got.has(key), `never a repeat (${key})`);
    got.add(key);
  }
  assert.equal(got.size, n, 'every piece and skin comes out in the end');
  assert.ok(bundles > 0);
  assert.equal(countItem(char.inventory, 'gacha_ticket'), 0, 'each pull spends a ticket');
  assert.equal(pickLook(char, 'sprout'), null, 'the set is complete');
  // A complete machine still takes tickets: it gives the bundle.
  addItem(char.inventory, 'gacha_ticket', 1);
  assert.equal(pull(char, 'sprout').prize?.kind, 'bundle');
  assert.ok(countItem(char.inventory, 'clover') > 0, 'the bundle lands in the bag');
  assert.ok(char.cosmetics.owned.includes('bubble:blossom') && char.cosmetics.using.dmg === 'petalpop', 'skins are yours, and on');
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
  addItem(char.inventory, 'gacha_ticket', 80);
  for (let i = 0; i < 80 && pickLook(char, 'sprout'); i++) pull(char, 'sprout');
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

test('the album keeps each find with the pull it came on, and a full page seals for its own skin', () => {
  const char = fresh();
  assert.equal(sealAlbum(char, 'sprout'), false, 'an empty page cannot be sealed');
  addItem(char.inventory, 'gacha_ticket', 80);
  for (let i = 0; i < 80 && !albumFull(char, 'sprout'); i++) {
    pull(char, 'sprout');
  }
  const a = albumOf(char, 'sprout');
  assert.ok(albumFull(char, 'sprout'));
  const nums = Object.values(a.got);
  assert.equal(nums.length, albumSlots('sprout').length, 'a pull number for every slot');
  assert.equal(new Set(nums).size, nums.length, 'each from its own pull');
  assert.ok(nums.every((n) => n >= 1 && n <= a.pulls));
  assert.equal(a.pulls, nums.length + a.bundles);
  // A piece sold later stays in the album.
  char.inventory.cash = char.inventory.cash.filter((e) => e.id !== 'cash_gacha_dewwings');
  assert.ok(albumFull(char, 'sprout'));
  assert.ok(!ownsSkin(char, 'tag', 'springseal'));
  assert.equal(sealAlbum(char, 'sprout'), true);
  assert.ok(ownsSkin(char, 'tag', 'springseal') && char.cosmetics.using.tag === 'springseal');
  assert.equal(sealAlbum(char, 'sprout'), false, 'only once');
  // The album's skin never comes out of a machine.
  assert.ok(!GACHA_PRIZES.sprout.some((z) => z.key === 'springseal'));
});
