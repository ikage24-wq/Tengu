import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ITEMS, GEAR_LEVELS, GEAR_FAMILIES, JOB_SLOTS, VARIANTS, GEMS, variantsFor, jobGearId } from '../src/data/items.js';
import { NPCS, shopStock } from '../src/data/npcs.js';
import { makeEquip, itemName, rollVariant, variantStats, variantPrice } from '../src/core/items.js';
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

test('every job has its own set every 5 levels in every armor slot, and earrings for everyone', () => {
  for (const family of GEAR_FAMILIES) {
    for (const slot of JOB_SLOTS) {
      let last = -1;
      for (const L of GEAR_LEVELS) {
        const def = ITEMS[`${family}_${slot}_${L}`];
        assert.ok(def, `${family} ${slot} ${L}`);
        assert.equal(def.family, family);
        assert.equal(def.reqLevel, L);
        assert.ok(def.stats.wdef > last, `${def.id} defends better than the set below`);
        last = def.stats.wdef;
      }
    }
  }
  for (const L of GEAR_LEVELS) assert.equal(ITEMS[`ear_${L}`].family, null);
  assert.equal(new Set(GEAR_LEVELS.map((L) => ITEMS[`warrior_hat_${L}`].name)).size, 20, 'every set has its own name');
});

test('jobs lean their own way: warriors tank, mages bring magic, archers and thieves are quick', () => {
  const at = (f, s) => ITEMS[`${f}_${s}_50`].stats;
  assert.ok(at('warrior', 'top').wdef > at('mage', 'top').wdef);
  assert.ok(at('warrior', 'top').hp > 0);
  assert.ok(at('mage', 'top').int > 0 && at('mage', 'gloves').matk > 0);
  assert.ok(at('thief', 'shoes').speed > at('warrior', 'shoes').speed);
  assert.ok(at('archer', 'gloves').acc > 0);
});

test('only the right job wears a set, and a Novice can wear the starter sets', () => {
  const warrior = hero('warrior', 30);
  assert.equal(equipBlocker(warrior, { id: 'warrior_top_30' }), null);
  assert.match(equipBlocker(warrior, { id: 'mage_top_30' }), /mages only/);
  assert.match(equipBlocker(warrior, { id: 'warrior_top_35' }), /level 35/);
  const novice = hero('novice', 6);
  assert.equal(equipBlocker(novice, { id: 'mage_hat_5' }), null);
  assert.match(equipBlocker(novice, { id: 'mage_hat_10' }), /level 10|mages only/);
});

test('color variants add the right stats and names', () => {
  const dark = makeEquip('warrior_top_50', { variant: 'dark' });
  const white = makeEquip('warrior_top_50', { variant: 'white' });
  const base = ITEMS.warrior_top_50.stats;
  assert.ok(dark.stats.str > (base.str ?? 0), 'dark gives the main stat');
  assert.ok(white.stats.dex > 0, 'white gives the second stat');
  assert.ok(makeEquip('mage_gloves_40', { variant: 'crimson' }).stats.matk > ITEMS.mage_gloves_40.stats.matk, 'crimson gives a mage magic');
  assert.ok(makeEquip('sword_40', { variant: 'crimson' }).stats.watk > ITEMS.sword_40.stats.watk);
  assert.ok(makeEquip('archer_hat_20', { variant: 'azure' }).stats.hp > 0);
  assert.equal(itemName(dark), `Dark ${ITEMS.warrior_top_50.name}`);
  const ruby = makeEquip('ear_30', { variant: 'ruby' });
  assert.ok(ruby.stats.str > 0);
  assert.equal(itemName(ruby), `Ruby ${ITEMS.ear_30.name}`);
  // Things without variants never get one.
  assert.equal(makeEquip('hoodie', { variant: 'dark' }).variant, undefined);
  assert.equal(variantsFor(ITEMS.red_potion), null);
  assert.equal(variantsFor(ITEMS.ear_5), GEMS);
  assert.equal(variantsFor(ITEMS.thief_cape_5), VARIANTS);
  // Bigger bonuses at higher levels; gilded costs most.
  assert.ok(variantStats(ITEMS.warrior_top_100, 'dark').str > variantStats(ITEMS.warrior_top_10, 'dark').str);
  assert.ok(variantPrice(ITEMS.warrior_top_50, 'gilded') > variantPrice(ITEMS.warrior_top_50, 'dark'));
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

test('shops sell gear for your own job at their levels, and a Novice sees every starter set', () => {
  const warrior = shopStock(NPCS.tora, hero('warrior', 20));
  assert.ok(warrior.includes('warrior_hat_25'));
  assert.ok(!warrior.some((id) => id.startsWith('mage_')));
  assert.ok(!warrior.includes('wand_20'), 'no weapons the job cannot use');
  const novice = shopStock(NPCS.pip, hero('novice', 3));
  for (const f of GEAR_FAMILIES) assert.ok(novice.includes(`${f}_top_5`), f);
  for (const n of Object.values(NPCS)) for (const id of shopStock(n, hero('thief', 30))) assert.ok(ITEMS[id], `${n.id} ${id}`);
});

test('quest gear rewards fit the hero who earns them', () => {
  const r = { id: 'warrior_gloves_15', qty: 1, forJob: true };
  assert.equal(rewardId(hero('archer', 15), r), 'archer_gloves_15');
  assert.equal(rewardId(hero('thief', 15), r), 'thief_gloves_15');
  assert.equal(jobGearId('thief', 'earring', 33), 'ear_30');
});

test('old weapon tiers become the new weapon of the same level', () => {
  const char = { equipment: { weapon: { uid: 1, id: 'sword_2' } }, inventory: { equip: [{ uid: 2, id: 'bow_4' }], use: [], etc: [] }, hotkeys: {} };
  dropRetiredItems(char);
  assert.equal(char.equipment.weapon.id, 'sword_20');
  assert.equal(char.inventory.equip[0].id, 'bow_40');
});

test('drops lean toward your own job and come in colors', () => {
  const rng = seeded(9);
  const fits = (d) => !d.family || d.family === 'thief';
  let own = 0;
  let other = 0;
  let colored = 0;
  for (let i = 0; i < 400; i++) {
    for (const l of rollLoot(MOBS.crystalking, rng, fits)) {
      if (!l.inst) continue;
      const def = ITEMS[l.inst.id];
      if (def.family === 'thief') own++;
      else if (def.family) other++;
      if (l.inst.variant) colored++;
    }
  }
  assert.ok(own > other / 2, `own ${own} vs other ${other}`);
  assert.ok(colored > 0);
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
