import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ITEMS } from '../src/data/items.js';
import { CASH_ITEMS, OUTFIT_SLOTS, STARTING_CASH, CASH_PER_LEVEL, cashPrice } from '../src/data/cash.js';
import { createCharacter, gainExp, wearOutfit, removeOutfit, wornGear } from '../src/core/character.js';
import { makeCash, makeEquip, itemName } from '../src/core/items.js';
import { addItem } from '../src/core/inventory.js';
import { computeStats } from '../src/core/stats.js';
import { expToNext } from '../src/core/exp.js';
import { loadGame } from '../src/core/save.js';
import { JOB_GEAR, pieceOf } from '../src/render/jobgear/index.js';
import { hatShapes, topShapes, skirtShapes, legLook, legShapes, handShapes, capeShapes, earringShapes } from '../src/render/gear.js';

test('the cash catalog covers every outfit slot with real looks', () => {
  // (Earrings only ever came as copies of dropped ones, which the shop no longer sells.)
  for (const slot of OUTFIT_SLOTS.filter((s) => s !== 'earring')) assert.ok(CASH_ITEMS.some((id) => ITEMS[id].slot === slot), slot);
  for (const id of CASH_ITEMS) {
    const def = ITEMS[id];
    assert.equal(def.type, 'cash');
    assert.ok(def.cash > 0, id);
    if (def.cover?.fun) assert.ok(JOB_GEAR[def.cover.fun].cover(def.cover.t).shapes.length, id);
    else if (def.cover) assert.ok(def.cover.theme || ITEMS[`sword_${def.cover.tier * 5}`], id);
    else assert.equal(ITEMS[def.skin].slot, def.slot, id);
    // Every slot a piece dresses has something to draw.
    for (const [slot, look] of Object.entries({ [def.slot]: def.skin, ...def.covers })) {
      if (!look) continue;
      const pc = pieceOf(ITEMS[look]);
      const shapes = { hat: () => hatShapes(pc.design, pc.color, pc), top: () => topShapes(pc.design, pc.color, pc), bottom: () => skirtShapes(pc.design, pc.color, pc) ?? [legLook(pc.design, pc.color, '#fff', pc)], shoes: () => legShapes(11, { top: '#fff', low: '#fff' }, pc, false), gloves: () => handShapes(10, 30, pc, '#fff'), cape: () => capeShapes(pc.design, pc.color, 0, 0, pc), earring: () => earringShapes(pc.design, pc.color, pc) }[slot]();
      assert.ok(shapes.length, `${id} draws its ${slot}`);
    }
  }
  assert.ok(cashPrice(ITEMS.cash_bunny_hood, null) < cashPrice(ITEMS.cash_mage_hat_100, 'gilded'));
});

test('an outfit covers the look of your gear but never its stats', () => {
  const char = createCharacter('Me', {});
  char.equipment.hat = makeEquip('warrior_hat_5');
  char.equipment.weapon = makeEquip('sword_10');
  const before = computeStats(char);
  addItem(char.inventory, makeCash('cash_mage_hat_100', 'dark'));
  addItem(char.inventory, makeCash('cover_holy'));
  assert.equal(char.inventory.cash.length, 2, 'cash items go in their own tab');
  wearOutfit(char, 0);
  wearOutfit(char, 0);
  const worn = wornGear(char);
  assert.deepEqual(worn.hat, { id: 'mage_hat_100', variant: 'dark' });
  assert.equal(worn.weapon.id, 'sword_10', 'the weapon you hold stays');
  assert.deepEqual(worn.weapon.cover, { theme: 'holy' });
  assert.deepEqual(computeStats(char), before);
  assert.equal(char.equipment.hat.id, 'warrior_hat_5');
  assert.equal(itemName(char.outfit.hat), `Dark ${ITEMS.cash_mage_hat_100.name}`);
  // Swapping puts the old piece back, and taking one off returns it to the Cash tab.
  addItem(char.inventory, makeCash('cash_bunny_hood'));
  wearOutfit(char, 0);
  assert.equal(char.outfit.hat.id, 'cash_bunny_hood');
  assert.equal(char.inventory.cash[0].id, 'cash_mage_hat_100');
  assert.ok(removeOutfit(char, 'hat'));
  assert.equal(wornGear(char).hat.id, 'warrior_hat_5');
  // Trying things on doesn't change what you wear.
  assert.equal(wornGear(char, { top: { id: 'cash_sundress' } }).top.id, 'sundress');
  assert.equal(char.outfit.top, undefined);
});

test('heroes start with Cash and earn more as they level', () => {
  const char = createCharacter('Me', {});
  assert.equal(char.cash, STARTING_CASH);
  gainExp(char, expToNext(1) + expToNext(2));
  assert.equal(char.cash, STARTING_CASH + 2 * CASH_PER_LEVEL);
});

test('saves from before outfits load with Cash and empty outfit slots', () => {
  const char = createCharacter('Old', {});
  delete char.outfit;
  delete char.cash;
  delete char.inventory.cash;
  const store = new Map([['twzt-save-v1', JSON.stringify(char)]]);
  globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) };
  const loaded = loadGame(0);
  assert.deepEqual(loaded.outfit, {});
  assert.equal(loaded.cash, STARTING_CASH);
  assert.deepEqual(loaded.inventory.cash, []);
});

test('a full-body outfit dresses every slot it covers, and wearing a piece that clashes takes it off', () => {
  const char = createCharacter('Me', {});
  const onesie = CASH_ITEMS.map((id) => ITEMS[id]).find((d) => d.covers?.bottom);
  if (!onesie) return;
  addItem(char.inventory, makeCash(CASH_ITEMS.find((id) => ITEMS[id].slot === 'bottom')));
  wearOutfit(char, 0);
  addItem(char.inventory, makeCash(onesie.id));
  wearOutfit(char, 0);
  assert.equal(char.outfit.bottom, null, 'the bottoms come off');
  assert.equal(wornGear(char).bottom.id, onesie.covers.bottom);
  assert.equal(char.inventory.cash.length, 1);
});

test('the Cash Shop never sells a costume of something that drops, but old ones still work', async () => {
  const { CASH_ITEMS } = await import('../src/data/cash.js');
  assert.ok(CASH_ITEMS.length > 50);
  for (const id of CASH_ITEMS) {
    const def = ITEMS[id];
    assert.ok(!def.retired, id);
    const looks = [def.skin, ...Object.values(def.covers ?? {})].filter(Boolean);
    assert.ok(looks.every((l) => ITEMS[l].type === 'look'), `${id} wears only its own line's looks`);
    assert.ok(!def.cover || def.cover.fun, `${id}: only the fun lines' weapon covers`);
  }
  for (const id of ['cash_mage_hat_100', 'cover_holy', 'cover_20', 'cash_bunny_hood', 'cash_sundress']) {
    assert.ok(ITEMS[id]?.retired && !CASH_ITEMS.includes(id), `${id} is off the shelf but still known`);
  }
});
