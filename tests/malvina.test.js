// Malvina Grimsworth: the would-be villainess (data/npcs.js), her four-step story, her shop of
// "evil" goods, her daily curse (world/malvina.js) and her rounds of the other towns.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { NPCS } from '../src/data/npcs.js';
import { QUESTS } from '../src/data/quests.js';
import { ITEMS } from '../src/data/items.js';
import { MAPS } from '../src/data/maps.js';
import { SCENES } from '../src/data/story.js';
import { QUEST_SCENES } from '../src/data/scenes.js';
import { TOWNSFOLK } from '../src/data/townsfolk.js';
import { MOVES } from '../src/render/moves.js';
import { createCharacter } from '../src/core/character.js';
import { CURSES, CURSE_SECS, curseOfDay, canCurse, layCurse } from '../src/world/malvina.js';

test('she lives in her tower in Sprout Village and sells her "evil" goods', () => {
  const m = NPCS.malvina;
  assert.equal(m.building, 'villaintower');
  assert.ok(MAPS.sprout.npcs.some((n) => n.id === 'malvina'));
  for (const id of m.shop) assert.ok(ITEMS[id], `${id} exists`);
  assert.ok(m.shop.every((id) => ITEMS[id].type === 'use'), 'everything she sells is useful');
});

test('her quests are one story of four, each with a scene at her tower', () => {
  const chain = NPCS.malvina.quests;
  assert.equal(chain.length, 4);
  chain.forEach((id, i) => {
    const q = QUESTS[id];
    assert.equal(q.giver, 'malvina');
    if (i) assert.equal(q.prereq, chain[i - 1], `${id} follows the one before`);
    const scene = QUEST_SCENES[id]?.done;
    assert.ok(SCENES[scene]?.length, `${id} has its scene`);
  });
  assert.equal(QUESTS.malv_diary.rewards.title, 'Minion of Malvina');
  // Every move her scenes play is one of hers.
  for (const id of chain) {
    for (const step of SCENES[QUEST_SCENES[id].done].flatMap((s) => s.together ?? [s])) if (step.perform) assert.ok(MOVES[step.move], step.move);
  }
});

test('the daily curse: only after her first quest, once a real day, a half-hour blessing', () => {
  const char = createCharacter('Hana', {});
  const day = new Date(2026, 10, 5, 10);
  assert.equal(canCurse(char, day), false, 'not before you are her minion');
  char.quests.malv_minion = { state: 'done' };
  assert.equal(canCurse(char, day), true);
  const c = layCurse(char, 100, day);
  assert.equal(c, curseOfDay(day));
  assert.equal(char.buffs.malvina.until, 100 + CURSE_SECS);
  assert.deepEqual(char.buffs.malvina.values, c.values);
  assert.equal(layCurse(char, 200, new Date(2026, 10, 5, 22)), null, 'once a day');
  assert.ok(layCurse(char, 300, new Date(2026, 10, 6, 9)), 'again tomorrow');
  // Every curse is a real boost in stats the game reads.
  const KEYS = ['str', 'dex', 'int', 'luk', 'watk', 'matk', 'wdef', 'mdef', 'acc', 'eva', 'hp', 'mp', 'speed', 'jump', 'maxHpPct', 'maxMpPct', 'critRate', 'critDamage', 'attackSpeed', 'expPct', 'regenPct'];
  for (const k of CURSES) for (const [key, v] of Object.entries(k.values)) assert.ok(KEYS.includes(key) && v > 0, `${k.name}: ${key}`);
  // Different days bring different curses.
  const seen = new Set(Array.from({ length: 30 }, (_, i) => curseOfDay(new Date(2026, 10, 1 + i)).id));
  assert.ok(seen.size >= 4);
});

test('she makes the rounds: a few hours of each game day in each other town, never two at once', () => {
  const visits = Object.entries(TOWNSFOLK).flatMap(([town, folk]) => folk.filter((p) => p.look?.hairStyle === 'villainess').map((p) => ({ town, ...p })));
  assert.ok(visits.length >= 3);
  for (const v of visits) {
    assert.ok(v.when, `${v.id} has her hours`);
    for (const [move] of v.act.moves) assert.ok(MOVES[move], move);
  }
  for (const a of visits) for (const b of visits) if (a !== b) assert.ok(a.when[1] <= b.when[0] || b.when[1] <= a.when[0], `${a.id} and ${b.id} don't overlap`);
});
