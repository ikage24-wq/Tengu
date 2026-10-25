import { test } from 'node:test';
import assert from 'node:assert/strict';

import { expToNext, MAX_LEVEL } from '../src/core/exp.js';
import { physicalRange, magicRange, hitChance, levelGapFactor, deathExpLoss, rollHit } from '../src/core/formulas.js';
import {
  createCharacter, gainExp, advanceJob, autoAssignAp, learnSkill, equipFromBag, stats, usePotion, applyDeath,
} from '../src/core/character.js';
import { addItem, countItem, removeItem, STACK_MAX } from '../src/core/inventory.js';
import { makeEquip, applyScroll } from '../src/core/items.js';
import { ITEMS } from '../src/data/items.js';

const fresh = () => createCharacter('Tester', {});

test('EXP curve matches the classic shape', () => {
  assert.equal(expToNext(1), 15);
  assert.equal(expToNext(5), 135);
  assert.equal(expToNext(6), 372);
  assert.equal(expToNext(10), 1716);
  assert.equal(expToNext(20), 20216);
  assert.equal(expToNext(30), 95700);
  assert.ok(expToNext(60) > expToNext(50));
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
  assert.equal(levelGapFactor(10, 5), 1);
  assert.ok(levelGapFactor(10, 15) < 1);
});

test('rollHit respects defense and reports crits', () => {
  const s = { critRate: 1, critDamage: 0 };
  const hit = rollHit({ min: 100, max: 100 }, s, { level: 1, def: 0 }, 1, () => 0.5);
  assert.equal(hit.crit, true);
  assert.equal(hit.damage, 120);
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
  gainExp(c, 20000);
  assert.ok(c.level >= 10);
  const hpBefore = c.baseHp;
  const spBefore = c.sp;
  assert.equal(advanceJob(c, 'blademaster'), false, 'second job needs the first');
  assert.equal(advanceJob(c, 'warrior'), true);
  assert.equal(c.baseHp, hpBefore + 350);
  assert.equal(c.sp, spBefore + 1);
  const lv = c.level;
  gainExp(c, 1000000);
  assert.equal(c.sp, spBefore + 1 + 3 * (c.level - lv), 'three SP per level after advancing');
});

test('auto-assign spends every AP into the family stats', () => {
  const c = fresh();
  gainExp(c, 20000);
  advanceJob(c, 'mage');
  autoAssignAp(c);
  assert.equal(c.ap, 0);
  assert.ok(c.base.int > c.base.str);
  assert.ok(c.base.luk > 4);
});

test('skills: learning needs SP and the right job, and binds a hotkey', () => {
  const c = fresh();
  gainExp(c, 20);
  assert.ok(c.sp >= 1);
  assert.equal(learnSkill(c, 'powerslash'), false, 'warrior skill locked for novices');
  assert.equal(learnSkill(c, 'pebble'), true);
  assert.equal(c.skills.pebble, 1);
  assert.deepEqual(c.hotkeys.KeyQ, { skill: 'pebble' });
});

test('equipping checks level and job', () => {
  const c = fresh();
  addItem(c.inventory, makeEquip('sword_0'));
  addItem(c.inventory, makeEquip('sword_2'));
  assert.equal(equipFromBag(c, 1), false, 'iron sword needs level 15 and a warrior');
  assert.equal(equipFromBag(c, 0), true);
  assert.equal(c.equipment.weapon.id, 'sword_0');
  assert.ok(stats(c).watk >= 14);
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

test('scrolls spend a slot whether they pass or fail', () => {
  const sword = makeEquip('sword_1');
  const before = sword.stats.watk;
  const pass = applyScroll(sword, ITEMS.scroll_watk_60, () => 0.1);
  assert.equal(pass.ok, true);
  assert.equal(sword.stats.watk, before + 2);
  const fail = applyScroll(sword, ITEMS.scroll_watk_60, () => 0.9);
  assert.equal(fail.ok, false);
  assert.equal(sword.slotsLeft, 5);
  const hat = makeEquip('hat_0');
  assert.equal(applyScroll(hat, ITEMS.scroll_watk_60).used, false, 'weapon scroll does not fit a hat');
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
