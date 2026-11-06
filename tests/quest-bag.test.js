// Quests and the bag (core/quests.js): what a quest hands you to carry, what it takes back, and
// rewards that need room, so a full tab or two quests sharing an item never lock a story.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createCharacter } from '../src/core/character.js';
import { acceptQuest, acceptBlocker, completeQuest, completeBlocker, noteTalk, questState } from '../src/core/quests.js';
import { addItem, countItem, removeItem, TAB_SIZE } from '../src/core/inventory.js';
import { ITEMS } from '../src/data/items.js';

// A hero with every quest before `ids` done and the level for them.
function hero(level = 20) {
  const char = createCharacter('Tester', {});
  char.level = level;
  return char;
}
const done = (char, ...ids) => ids.forEach((id) => (char.quests[id] = { state: 'done' }));

// Fills a tab with single stacks of other items (never the ones the test is about).
function fill(char, tab, keepFree = 0, not = ['home_shell', 'parcel', 'letter']) {
  const ids = Object.values(ITEMS).filter((i) => i.type === tab && !i.quest && !not.includes(i.id)).map((i) => i.id);
  for (const id of ids) {
    if (char.inventory[tab].length >= TAB_SIZE - keepFree) break;
    if (!countItem(char.inventory, id)) addItem(char.inventory, id, 1);
  }
}

test('two quests carrying the same parcel: finishing one leaves the other its parcel', () => {
  const char = hero(13);
  done(char, 'snail_trouble', 'story_2_2');
  assert.ok(acceptQuest(char, 'pip_parcel'));
  assert.ok(acceptQuest(char, 'story_root'));
  assert.equal(countItem(char.inventory, 'parcel'), 2, 'one parcel each');
  // Pip's parcel goes to Rook, and the quest is handed in.
  noteTalk(char, 'rook');
  assert.equal(questState(char, 'pip_parcel'), 'ready');
  assert.ok(completeQuest(char, 'pip_parcel'));
  assert.equal(countItem(char.inventory, 'parcel'), 1, "Bramble's scroll is still there");
  // The story step can still be delivered.
  char.quests.story_root.kills = { scorpip: 15 };
  noteTalk(char, 'elowen');
  assert.equal(questState(char, 'story_root'), 'ready');
});

test('a delivery is never taken empty-handed: a full Etc tab says so instead', () => {
  const char = hero(13);
  done(char, 'snail_trouble');
  fill(char, 'etc');
  assert.equal(char.inventory.etc.length, TAB_SIZE);
  assert.match(acceptBlocker(char, 'pip_parcel') ?? '', /Etc/);
  assert.equal(acceptQuest(char, 'pip_parcel'), false);
  assert.equal(questState(char, 'pip_parcel'), 'available', 'still there to take later');
  // Room made: it goes, with its parcel.
  removeItem(char.inventory, char.inventory.etc[0].id, 99);
  assert.equal(acceptBlocker(char, 'pip_parcel'), null);
  assert.ok(acceptQuest(char, 'pip_parcel'));
  assert.equal(countItem(char.inventory, 'parcel'), 1);
});

test('a reward that needs room in a full tab waits, and nothing is lost', () => {
  const char = hero(12);
  char.quests.island_deed = { state: 'active', kills: {}, marks: {} };
  fill(char, 'use');
  assert.equal(char.inventory.use.length, TAB_SIZE);
  const gold = char.gold;
  assert.match(completeBlocker(char, 'island_deed') ?? '', /Use/);
  assert.equal(completeQuest(char, 'island_deed'), null);
  assert.equal(char.gold, gold, 'nothing paid out');
  assert.equal(questState(char, 'island_deed'), 'ready', 'still ready to hand in');
  removeItem(char.inventory, char.inventory.use[0].id, 99);
  assert.ok(completeQuest(char, 'island_deed'));
  assert.equal(countItem(char.inventory, 'home_shell'), 1, 'the Home Shell arrived');
});
