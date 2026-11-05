import { test } from 'node:test';
import assert from 'node:assert/strict';

import { expToNext, MAX_LEVEL } from '../src/core/exp.js';
import { physicalRange, magicRange, hitChance, levelGapFactor, deathExpLoss, rollHit } from '../src/core/formulas.js';
import {
  createCharacter, gainExp, advanceJob, autoAssignAp, learnSkill, maxSkill, equipFromBag, stats, usePotion, applyDeath,
} from '../src/core/character.js';
import { addItem, countItem, removeItem, STACK_MAX, sortTab, createInventory, moveItem } from '../src/core/inventory.js';
import { makeEquip } from '../src/core/items.js';
import { ITEMS } from '../src/data/items.js';

const fresh = () => createCharacter('Tester', {});

test('EXP curve: quick first levels, then a steady climb to about 30 hours at 50', () => {
  assert.equal(expToNext(1), 60);
  assert.equal(expToNext(10), 3900);
  assert.equal(expToNext(30), 380000);
  // Every level asks more than the one before, never a sudden wall.
  for (let l = 2; l < MAX_LEVEL; l++) {
    assert.ok(expToNext(l) > expToNext(l - 1), `level ${l} asks more than ${l - 1}`);
    if (l > 10) assert.ok(expToNext(l) / expToNext(l - 1) < 1.5, `level ${l} is a step, not a wall`);
  }
  // About 21 million EXP from 1 to 50 (the 30-hour pace, docs/design/main-story.md).
  let total = 0;
  for (let l = 1; l < MAX_LEVEL; l++) total += expToNext(l);
  assert.ok(total > 20e6 && total < 22e6, `total ${total}`);
  assert.equal(expToNext(MAX_LEVEL), Infinity);
});

test('damage ranges grow with stats and keep min below max', () => {
  const base = { str: 4, dex: 4, int: 4, luk: 4, watk: 14, matk: 0, mastery: 0.1 };
  const low = physicalRange(base, 'sword');
  const high = physicalRange({ ...base, str: 100 }, 'sword');
  assert.ok(low.min < low.max);
  assert.ok(high.max > low.max);
  const mlow = magicRange({ ...base, int: 20, matk: 10 }, 150);
  const mhigh = magicRange({ ...base, int: 100, matk: 10 }, 150);
  assert.ok(mhigh.max > mlow.max && mlow.min <= mlow.max);
});

test('mastery lifts minimum damage only', () => {
  const s = { str: 80, dex: 20, int: 4, luk: 4, watk: 40, matk: 0, mastery: 0.1 };
  const a = physicalRange(s, 'sword');
  const b = physicalRange({ ...s, mastery: 0.6 }, 'sword');
  assert.equal(a.max, b.max);
  assert.ok(b.min > a.min);
});

test('hit chance is a probability and drops against stronger monsters', () => {
  const easy = hitChance(40, 10, { level: 5, eva: 2 });
  const hard = hitChance(40, 10, { level: 30, eva: 40 });
  assert.ok(easy >= 0 && easy <= 1 && hard >= 0 && hard <= 1);
  assert.ok(easy > hard);
  assert.equal(hitChance(10, 10, { level: 15, eva: 99 }), 1, 'up to five levels above you is never missed');
  assert.equal(levelGapFactor(10, 5), 1);
  assert.ok(levelGapFactor(10, 15) < 1);
});

test('rollHit respects defense and reports crits', () => {
  const s = { critRate: 1, critDamage: 0 };
  const hit = rollHit({ min: 100, max: 100 }, s, { level: 1, def: 0 }, 1, () => 0.5);
  assert.equal(hit.crit, true);
  assert.equal(hit.damage, 150, 'a crit deals +50%');
  const armored = rollHit({ min: 100, max: 100 }, { critRate: -1, critDamage: 0 }, { level: 1, def: 100 }, 1, () => 0.5);
  assert.equal(armored.damage, 50);
});

test('leveling gives AP, novice SP up to level 10, and HP growth', () => {
  const c = fresh();
  gainExp(c, 1e9);
  assert.equal(c.level, MAX_LEVEL);
  assert.equal(c.sp, 9, 'novices only earn SP up to level 10');
  assert.equal(c.ap, 9 + 5 * (MAX_LEVEL - 1));
  assert.ok(c.baseHp > 50);
});

test('job advancement needs the level and adds HP, MP, and SP', () => {
  const c = fresh();
  assert.equal(advanceJob(c, 'warrior'), false);
  gainExp(c, 110000);
  assert.ok(c.level >= 10);
  const hpBefore = c.baseHp;
  const spBefore = c.sp;
  assert.equal(advanceJob(c, 'ilwizard'), false, 'second job needs the first');
  assert.equal(advanceJob(c, 'warrior'), true);
  assert.equal(c.baseHp, hpBefore + 350);
  assert.equal(c.sp, spBefore + 1);
  const lv = c.level;
  gainExp(c, 4000000);
  assert.equal(c.sp, spBefore + 1 + 3 * (c.level - lv), 'three SP per level after advancing');
});

test('a Novice\'s first job gives back every stat point spent', () => {
  const c = fresh();
  gainExp(c, 110000);
  autoAssignAp(c);
  assert.ok(c.base.str > 4, 'a Novice with a sword (or nothing) grows STR');
  const spent = c.ap;
  assert.equal(spent, 0);
  const total = Object.values(c.base).reduce((a, b) => a + b, 0);
  advanceJob(c, 'spiritmage');
  assert.deepEqual(c.base, { str: 4, dex: 4, int: 4, luk: 4 });
  assert.equal(c.ap, total - 16, 'all of it back to spend');
  autoAssignAp(c);
  assert.ok(c.base.int > c.base.str);
  // Later jobs keep what's spent.
  const before = { ...c.base };
  gainExp(c, 30000000);
  c.quests = {};
  for (const j of ['shrinemaiden', 'onmyoji']) if (advanceJob(c, j)) break;
  for (const k of Object.keys(before)) assert.ok(c.base[k] >= before[k]);
});

test('auto-assign spends every AP into the family stats', () => {
  const c = fresh();
  gainExp(c, 110000);
  advanceJob(c, 'thief');
  autoAssignAp(c);
  assert.equal(c.ap, 0);
  assert.ok(c.base.luk > c.base.str);
  assert.ok(c.base.dex > 4);
});

test('skills: learning needs SP and the right job, and binds a hotkey', () => {
  const c = fresh();
  gainExp(c, 160);
  assert.ok(c.sp >= 1);
  assert.equal(learnSkill(c, 'bladerush'), false, 'warrior skill locked for novices');
  assert.equal(learnSkill(c, 'pebble'), true);
  assert.equal(c.skills.pebble, 1);
  assert.deepEqual(c.hotkeys.KeyQ, { skill: 'pebble' });
});

test('max puts every point a skill can take in at once, stopping when SP runs out', async () => {
  const { SKILLS } = await import('../src/data/skills.js');
  const c = fresh();
  c.sp = 100;
  assert.equal(maxSkill(c, 'pebble'), SKILLS.pebble.maxLevel);
  assert.equal(c.skills.pebble, SKILLS.pebble.maxLevel);
  assert.equal(c.sp, 100 - SKILLS.pebble.maxLevel);
  assert.equal(maxSkill(c, 'pebble'), 0, 'nothing more once mastered');
  c.sp = 2;
  const other = Object.values(SKILLS).find((s) => s.job === 'novice' && s.id !== 'pebble' && s.maxLevel > 2).id;
  assert.equal(maxSkill(c, other), 2);
  assert.equal(c.skills[other], 2);
  assert.equal(c.sp, 0);
  assert.equal(maxSkill(c, 'bladerush'), 0, 'not for another job');
});

test('equipping checks level', () => {
  const c = fresh();
  addItem(c.inventory, makeEquip('top_0'));
  addItem(c.inventory, makeEquip('top_2'));
  assert.equal(equipFromBag(c, 1), false, 'a leather vest needs level 20');
  assert.equal(equipFromBag(c, 0), true);
  assert.equal(c.equipment.top.id, 'top_0');
  assert.ok(stats(c).wdef >= 5);
});

test('inventory stacks consumables and removes them', () => {
  const c = fresh();
  addItem(c.inventory, 'red_potion', STACK_MAX + 5);
  assert.equal(c.inventory.use.length, 2);
  assert.equal(countItem(c.inventory, 'red_potion'), STACK_MAX + 5);
  assert.equal(removeItem(c.inventory, 'red_potion', 10), 10);
  assert.equal(countItem(c.inventory, 'red_potion'), STACK_MAX - 5);
});

test('potions heal and are consumed', () => {
  const c = fresh();
  c.hp = 10;
  addItem(c.inventory, 'red_potion', 1);
  assert.equal(usePotion(c, 'red_potion'), true);
  assert.equal(c.hp, 50);
  assert.equal(usePotion(c, 'red_potion'), false);
});

test('death costs some EXP but never a level', () => {
  const c = fresh();
  gainExp(c, 5000);
  const lvl = c.level;
  c.exp = 1;
  applyDeath(c);
  assert.equal(c.level, lvl);
  assert.equal(c.exp, 0);
  assert.ok(deathExpLoss(10, 4) > deathExpLoss(10, 100));
});

test('sorting a bag tab merges split stacks and orders gear by slot and level', () => {
  const inv = createInventory();
  inv.use.push({ id: 'blue_potion', qty: 5 }, { id: 'red_potion', qty: 150 }, { id: 'red_potion', qty: 120 }, { id: 'blue_potion', qty: 3 });
  sortTab(inv, 'use');
  assert.equal(countItem(inv, 'red_potion'), 270);
  assert.equal(countItem(inv, 'blue_potion'), 8);
  assert.deepEqual(inv.use.filter((e) => e.id === 'red_potion').map((e) => e.qty), [STACK_MAX, 70]);
  assert.equal(inv.use.filter((e) => e.id === 'blue_potion').length, 1);

  const gear = Object.values(ITEMS).filter((d) => d.type === 'equip');
  const hat = gear.filter((d) => d.slot === 'hat').sort((a, b) => a.reqLevel - b.reqLevel);
  const weapon = gear.find((d) => d.slot === 'weapon');
  inv.equip.push(makeEquip(hat[0].id), makeEquip(weapon.id), makeEquip(hat.at(-1).id));
  sortTab(inv, 'equip');
  assert.deepEqual(inv.equip.map((e) => e.id), [weapon.id, hat.at(-1).id, hat[0].id]);
});

test('moving bag items swaps, merges stacks, and moves past the end', () => {
  const inv = createInventory();
  inv.use.push({ id: 'red_potion', qty: 150 }, { id: 'blue_potion', qty: 5 }, { id: 'red_potion', qty: 120 });
  assert.ok(moveItem(inv, 'use', 0, 1));
  assert.deepEqual(inv.use.map((e) => e.id), ['blue_potion', 'red_potion', 'red_potion']);
  // Same item: the dragged stack tops up the other and keeps what's left.
  moveItem(inv, 'use', 2, 1);
  assert.deepEqual(inv.use.map((e) => e.qty), [5, STACK_MAX, 70]);
  moveItem(inv, 'use', 0, 30);
  assert.deepEqual(inv.use.map((e) => e.id), ['red_potion', 'red_potion', 'blue_potion']);
  assert.equal(moveItem(inv, 'use', 5, 0), false);
  assert.equal(countItem(inv, 'red_potion'), 270);
});

test('Sell junk sells monster drops, but keeps what quests and known recipes need', async () => {
  const { junkOf, sellJunk } = await import('../src/ui/shop.js');
  const { createCharacter } = await import('../src/core/character.js');
  const { addItem: add, countItem: count } = await import('../src/core/inventory.js');
  const c = createCharacter('Seller', {});
  add(c.inventory, 'bone_shard', 7);
  add(c.inventory, 'sprout_leaf', 4);
  add(c.inventory, 'fish_minnow', 2);
  add(c.inventory, 'fishing_rod', 1);
  assert.deepEqual(junkOf(c).map((o) => o.id), ['bone_shard'], 'the leaf goes in a recipe; fish and the rod are not junk');
  const gold = c.gold;
  const got = sellJunk(c);
  assert.equal(got, ITEMS.bone_shard.price * 7);
  assert.equal(c.gold, gold + got);
  assert.equal(count(c.inventory, 'bone_shard'), 0);
  assert.equal(count(c.inventory, 'sprout_leaf'), 4);
  assert.equal(count(c.inventory, 'fish_minnow'), 2);
});
