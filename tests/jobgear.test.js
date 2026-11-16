import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ITEMS, GEAR_LEVELS, GEAR_FAMILIES, JOB_SLOTS, VARIANTS, GEMS, variantsFor, jobGearId } from '../src/data/items.js';
import { NPCS, shopStock } from '../src/data/npcs.js';
import { makeEquip, itemName, rollVariant } from '../src/core/items.js';
import { createCharacter, advanceJob, gainExp, equipBlocker } from '../src/core/character.js';
import { expToNext } from '../src/core/exp.js';
import { rewardId } from '../src/core/quests.js';
import { dropRetiredItems } from '../src/core/save.js';
import { rollLoot } from '../src/world/drops.js';
import { makeBotCharacter } from '../src/world/bots.js';
import { MOBS } from '../src/data/mobs.js';

const seeded = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
function hero(job, level) {
  const char = createCharacter('Me', {});
  while (char.level < level) gainExp(char, expToNext(char.level));
  if (job !== 'novice') advanceJob(char, job);
  return char;
}

test('the job sets are retired: every piece a look with no stats, and earrings for everyone stay', () => {
  // (Every piece of armour was retired, 2026-11-16, to make way for new gear: the job sets stay only
  // as looks, for the Cash costumes and the NPCs dressed in them.)
  for (const family of GEAR_FAMILIES) {
    for (const slot of JOB_SLOTS) {
      for (const L of GEAR_LEVELS) {
        const def = ITEMS[`${family}_${slot}_${L}`];
        assert.ok(def?.retiredGear, `${family} ${slot} ${L}`);
        assert.equal(def.type, 'look');
        assert.equal(def.stats, undefined);
      }
    }
  }
  for (const L of GEAR_LEVELS) {
    assert.equal(ITEMS[`ear_${L}`].type, 'equip');
    assert.equal(ITEMS[`ear_${L}`].family, null);
  }
});


test('a retired piece is never worn, by any job', () => {
  const warrior = hero('warrior', 30);
  assert.equal(equipBlocker(warrior, { id: 'warrior_top_30' }), 'not equipment');
  assert.equal(equipBlocker(warrior, { id: 'sword_25' }), 'not equipment');
  assert.equal(equipBlocker(warrior, { id: 'sword_30' }), null, 'the ladder weapon of its level is');
  assert.equal(equipBlocker(warrior, { id: 'sword_0' }), null, 'the plain weapon still is');
  assert.equal(equipBlocker(hero('novice', 6), { id: 'mage_hat_5' }), 'not equipment');
});

test('colors are a look only: a name and a recolor, never stats', () => {
  const ruby = makeEquip('ear_30', { variant: 'ruby' });
  assert.deepEqual(ruby.stats, makeEquip('ear_30').stats, 'no extra stats');
  assert.equal(itemName(ruby), `Ruby ${ITEMS.ear_30.name}`);
  // Things without variants never get one.
  assert.equal(makeEquip('hoodie', { variant: 'dark' }).variant, undefined);
  assert.equal(variantsFor(ITEMS.red_potion), null);
  assert.equal(variantsFor(ITEMS.mage_cape_5), VARIANTS);
  // Drops are the same piece every time (no random stat rolls).
  assert.deepEqual(makeEquip('sword_0', { rng: seeded(1) }).stats, makeEquip('sword_0', { rng: seeded(2) }).stats);
});

test('variant rolls favor the common colors and sometimes give none', () => {
  const rng = seeded(4);
  const counts = {};
  for (let i = 0; i < 2000; i++) {
    const v = rollVariant(ITEMS.mage_top_30, rng) ?? 'none';
    counts[v] = (counts[v] ?? 0) + 1;
  }
  assert.ok(counts.none > 300 && counts.none < 700);
  assert.ok(counts.dark > counts.gilded * 2);
});

test('shops sell no armour, only the new ladder weapons a job can use', () => {
  const novice = shopStock(NPCS.pip, hero('novice', 3));
  for (const type of ['sword', 'axe', 'spear', 'wand', 'staff', 'bow', 'crossbow', 'dagger', 'gauntlet']) assert.ok(novice.includes(`${type}_0`), type);
  const warrior = shopStock(NPCS.pip, hero('warrior', 20));
  assert.ok(warrior.includes('sword_0') && !warrior.includes('wand_0'), 'no weapons the job cannot use');
  for (const n of Object.values(NPCS)) {
    for (const id of shopStock(n, hero('tidemage', 30))) {
      assert.ok(ITEMS[id], `${n.id} ${id}`);
      assert.ok(!ITEMS[id].retiredGear, `${n.id} sells no retired ${id}`);
      if (ITEMS[id].type === 'equip' && ITEMS[id].slot === 'weapon') assert.ok(id.endsWith('_0') || ITEMS[id].ladder, `${n.id} ${id} is a starter or a ladder weapon`);
    }
  }
});

test('quest gear rewards fit the hero who earns them', () => {
  const r = { id: 'warrior_gloves_15', qty: 1, forJob: true };
  assert.equal(rewardId(hero('tidemage', 15), r), 'mage_gloves_15');
  assert.equal(rewardId(hero('warrior', 15), r), 'warrior_gloves_15');
  assert.equal(jobGearId('mage', 'earring', 33), 'ear_30');
});

test("the Archer's and the Thief's armour in an old save sells itself back", () => {
  const char = {
    gold: 0, cash: 0, hotkeys: {}, outfit: { top: { uid: 4, id: 'cash_thief_top_20' } },
    equipment: { top: { uid: 1, id: 'archer_top_30' }, weapon: { uid: 2, id: 'bow_0' } },
    inventory: { equip: [{ uid: 3, id: 'thief_gloves_50' }, { uid: 5, id: 'set_sylvana_archer_cape' }], use: [], etc: [], cash: [] },
  };
  dropRetiredItems(char);
  assert.equal(char.equipment.top, null);
  assert.equal(char.equipment.weapon.id, 'bow_0', 'the weapons stay');
  assert.deepEqual(char.inventory.equip, []);
  const shop = (id) => Math.floor(ITEMS[id].price * 0.1);
  assert.equal(char.gold, shop('warrior_top_30') + shop('warrior_gloves_50') + shop('set_sylvana_warrior_cape'));
  assert.equal(char.cash, ITEMS.cash_warrior_top_20.cash);
});

test('old weapon tiers become the weapon of the same level, which sells back for the plain one', () => {
  const char = { gold: 0, equipment: { weapon: { uid: 1, id: 'sword_25' } }, inventory: { equip: [{ uid: 2, id: 'bow_1' }, { uid: 3, id: 'bow_0' }, { uid: 4, id: 'sword_3' }], use: [], etc: [] }, hotkeys: {} };
  dropRetiredItems(char);
  // (The old tiers 1-4 were renamed to levels 10-40, since retired, 2026-11-16; levels 10 and 30
  // are the new ladder's Rootwood and Starglass now, so an old level-10 bow is a Rootwood Bow and
  // an old level-30 sword a Starglass Sword. Level 25 has no ladder weapon: it sells back.)
  assert.equal(char.equipment.weapon.id, 'sword_0');
  assert.deepEqual(char.inventory.equip.map((e) => e.id), ['bow_10', 'bow_0', 'sword_30']);
  assert.equal(ITEMS.bow_10.name, 'Rootwood Bow');
  assert.equal(ITEMS.sword_30.name, 'Starglass Sword');
  assert.equal(char.gold, Math.floor(ITEMS.sword_25.price * 0.1));
});

test('monsters drop no weapons and none of the retired armour: the new ladder armour, earrings and one-of-a-kind outfits', () => {
  const rng = seeded(9);
  const fits = (d) => !d.family || d.family === 'mage';
  let gear = 0;
  for (let i = 0; i < 400; i++) {
    for (const l of rollLoot(MOBS.crystalking, rng, fits)) {
      if (!l.inst) continue;
      const def = ITEMS[l.inst.id];
      gear++;
      assert.equal(def.type, 'equip', def.id);
      assert.ok(def.slot === 'earring' || def.unique || (def.ladder && def.slot !== 'weapon'), `${def.id} is ladder armour, an earring or a one-of-a-kind outfit`);
    }
  }
  assert.ok(gear > 0, 'a boss still drops some');
});

test('generated players wear their own job gear', () => {
  const rng = seeded(21);
  for (let i = 0; i < 40; i++) {
    const c = makeBotCharacter(rng, { name: `p${i}` });
    for (const inst of Object.values(c.equipment).filter(Boolean)) {
      assert.equal(equipBlocker(c, inst), null, `${c.job} ${c.level} wears ${inst.id}`);
      assert.ok(!ITEMS[inst.id].legacy || ITEMS[inst.id].starterOutfit, inst.id);
    }
  }
});
