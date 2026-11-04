// Sweethearts (data/sweethearts.js, world/sweethearts.js): hearts from chats and gifts, their own
// loves and dislikes, heart scenes, friendship or romance, moving in, and a gentle goodbye.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createCharacter } from '../src/core/character.js';
import { createWorld } from '../src/world/world.js';
import { SWEETHEARTS, SWEETHEART_IDS, HEART, BOUQUET, RING } from '../src/data/sweethearts.js';
import { NPCS } from '../src/data/npcs.js';
import { MAPS } from '../src/data/maps.js';
import { ITEMS } from '../src/data/items.js';
import { SCENES } from '../src/data/story.js';
import { RECIPES } from '../src/data/crafting.js';
import { heartsOf, heartLevel, talkTo, giveGift, giftKind, dueScene, breakUp, addHearts, sceneId } from '../src/world/sweethearts.js';
import { addItem, countItem } from '../src/core/inventory.js';

function player() {
  const w = createWorld(createCharacter('Kai', { hairStyle: 'bob' }));
  w.log = () => {};
  return w;
}

test('six of them, each at home in a town, with their own tastes, lines and scenes', () => {
  assert.equal(SWEETHEART_IDS.length, 6);
  for (const id of SWEETHEART_IDS) {
    const s = SWEETHEARTS[id];
    assert.ok(NPCS[id] && NPCS[id].role === 'sweetheart', id);
    assert.ok(MAPS[s.map].isTown && MAPS[s.map].npcs.some((n) => n.id === id), `${id} lives in ${s.map}`);
    for (const it of [...s.loves, ...s.likes, ...s.dislikes]) assert.ok(ITEMS[it], `${id}: ${it}`);
    assert.equal(s.talk.length, 6);
    for (const k of ['2', '4', '6', '8', '8r', '10', '10r']) assert.ok(SCENES[sceneId(id, k)]?.length, `${id} scene ${k}`);
  }
  // Nobody shares a love with everyone: tastes differ.
  const loves = SWEETHEART_IDS.map((id) => SWEETHEARTS[id].loves.join());
  assert.equal(new Set(loves).size, 6);
});

test('a chat once a day brings you closer; a second one the same day does not', () => {
  const w = player();
  const a = talkTo(w, 'poppy', '2026-1-1');
  assert.equal(a.gained, 20);
  const b = talkTo(w, 'poppy', '2026-1-1');
  assert.equal(b.gained, 0);
  assert.ok(b.line.length > 0);
  assert.equal(talkTo(w, 'poppy', '2026-1-2').gained, 20);
});

test('gifts: loves beat likes, dislikes cost you, one a day', () => {
  const w = player();
  const s = SWEETHEARTS.lark;
  addItem(w.char.inventory, s.loves[0], 2);
  addItem(w.char.inventory, s.dislikes[0], 1);
  assert.equal(giftKind('lark', s.loves[0]), 'love');
  const r = giveGift(w, 'lark', s.loves[0], '2026-1-1');
  assert.equal(r.kind, 'love');
  assert.equal(heartsOf(w.char, 'lark').pts, 80);
  assert.match(giveGift(w, 'lark', s.loves[0], '2026-1-1').why, /tomorrow/);
  const d = giveGift(w, 'lark', s.dislikes[0], '2026-1-2');
  assert.equal(d.kind, 'dislike');
  assert.equal(heartsOf(w.char, 'lark').pts, 60);
  assert.equal(heartsOf(w.char, 'lark').known[s.loves[0]], 'love', 'you remember how they took it');
});

test('heart scenes come due as you grow closer, as friends or as sweethearts', () => {
  const w = player();
  addHearts(w.char, 'rowan', 2 * HEART);
  assert.equal(dueScene(w.char, 'rowan').key, '2');
  for (const at of [2, 4, 6]) heartsOf(w.char, 'rowan').seen[at] = true;
  addHearts(w.char, 'rowan', 6 * HEART);
  assert.equal(dueScene(w.char, 'rowan').key, '8', 'a friend gets the friendship scene');
  w.char.partner = 'rowan';
  assert.equal(dueScene(w.char, 'rowan').key, '8r', 'a sweetheart gets the romance one');
});

test('a bouquet starts romance (one sweetheart at a time); a ring at ten hearts means moving in', () => {
  const w = player();
  assert.ok(RECIPES.some((r) => r.makes === BOUQUET) && RECIPES.some((r) => r.makes === RING));
  addItem(w.char.inventory, BOUQUET, 2);
  addItem(w.char.inventory, RING, 1);
  assert.match(giveGift(w, 'yuzu', BOUQUET).why, /6 hearts/);
  addHearts(w.char, 'yuzu', 6 * HEART);
  assert.equal(giveGift(w, 'yuzu', BOUQUET).kind, 'bouquet');
  assert.equal(w.char.partner, 'yuzu');
  addHearts(w.char, 'celeste', 7 * HEART);
  assert.match(giveGift(w, 'celeste', BOUQUET).why, /already with Yuzu/);
  assert.match(giveGift(w, 'yuzu', RING).why, /10 hearts/);
  addHearts(w.char, 'yuzu', 10 * HEART);
  assert.match(giveGift(w, 'yuzu', RING).why, /island/, 'a home to share first');
  w.char.home = { stage: 1, placed: [], bag: {} };
  assert.equal(giveGift(w, 'yuzu', RING).kind, 'ring');
  assert.equal(w.char.livingWith, 'yuzu');
  assert.equal(countItem(w.char.inventory, RING), 0);
});

test('saying goodbye is gentle: hearts dip a little, and you can make up', () => {
  const w = player();
  addHearts(w.char, 'marlowe', 8 * HEART);
  addItem(w.char.inventory, BOUQUET, 2);
  giveGift(w, 'marlowe', BOUQUET);
  const before = heartLevel(w.char, 'marlowe');
  assert.ok(breakUp(w, 'marlowe'));
  assert.equal(w.char.partner, null);
  assert.ok(heartLevel(w.char, 'marlowe') >= before - 2);
  assert.equal(giveGift(w, 'marlowe', BOUQUET).kind, 'bouquet', 'made up');
});
