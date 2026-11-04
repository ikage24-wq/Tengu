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

// ---------- Dates (world/dates.js) ----------
import { startDate, tickDate, finishDate, DATES } from '../src/world/dates.js';
import { loadMap } from '../src/world/world.js';
import { FISH } from '../src/data/fishing.js';

test('a date is a shared activity: done together it brings you much closer, once a day', () => {
  const w = player();
  loadMap(w, 'grove', 'start');
  w.forceNight = 1;
  addHearts(w.char, 'celeste', 3 * HEART);
  assert.equal(startDate(w, 'celeste', 'stars'), null);
  assert.ok(w.date);
  // Wish on every star as it crosses the middle.
  w.rng = () => 0.5;
  for (let i = 0; i < 60 * 40 && w.date; i++) {
    const d = w.date;
    const ready = d.stars.some((s) => s.got == null && Math.abs((d.t - s.t0) / 1.6 - 0.5) < 0.05);
    tickDate(w, 1 / 60, ready ? new Set(['Space']) : new Set());
  }
  assert.equal(w.date, null);
  assert.equal(w.dateEnded.rating, 'great');
  assert.ok(heartsOf(w.char, 'celeste').pts >= 3 * HEART + 120, 'stargazing is her favourite, so even more');
  assert.match(startDate(w, 'celeste', 'stars'), /today/);
});

test('a fishing date counts the fish you catch together; a cooking date the dish you make', () => {
  const w = player();
  addHearts(w.char, 'marlowe', 3 * HEART);
  w.char.lifeTools = { rod: { id: 'rod_1' } };
  assert.equal(startDate(w, 'marlowe', 'fish'), null);
  for (let i = 0; i < 3; i++) {
    w.now += 5;
    w.fishCaught = { fish: FISH[i], size: 20, at: w.now };
    tickDate(w, 1 / 60);
  }
  assert.equal(w.date, null);
  assert.ok(w.dateEnded.gained > 0);
  addHearts(w.char, 'poppy', 3 * HEART);
  assert.equal(startDate(w, 'poppy', 'cook'), null);
  w.now += 3;
  w.lastCooked = { id: SWEETHEARTS.poppy.loves.find((x) => x.startsWith('dish_')), at: w.now };
  tickDate(w, 1 / 60);
  assert.equal(w.dateEnded.id, 'poppy');
  assert.equal(w.dateEnded.rating, 'great', 'a dish she loves');
});

test('every date has a time limit, and running out still ends it kindly', () => {
  const w = player();
  addHearts(w.char, 'yuzu', 3 * HEART);
  startDate(w, 'yuzu', 'dance');
  for (let i = 0; i < 60 * (DATES.dance.time + 2) && w.date; i++) tickDate(w, 1 / 60);
  assert.equal(w.date, null);
  assert.ok(w.dateEnded.gained > 0, 'even a clumsy dance is a nice time');
});

// ---------- Living together ----------
import { moveIn, welcomeHome, bringAlong, movedAway } from '../src/world/sweethearts.js';
import { AT_HOME } from '../src/data/sweethearts.js';
import { createBots } from '../src/world/bots.js';
import { partyMembers } from '../src/world/party.js';

test('moving in: they live on your island, bring their own piece, and greet you with a dish', () => {
  const w = player();
  w.char.home = { stage: 2, placed: [], bag: {} };
  addHearts(w.char, 'rowan', 10 * HEART);
  moveIn(w.char, 'rowan');
  assert.ok(movedAway(w.char, 'rowan'));
  assert.ok(w.char.home.placed.some((p) => p.id === AT_HOME.rowan.piece && p.theirs === 'rowan'));
  loadMap(w, 'home', 'dock');
  assert.ok(w.map.npcs.some((n) => n.id === 'rowan'), 'on the island');
  const dishes = AT_HOME.rowan.dish.reduce((n, id) => n + countItem(w.char.inventory, id), 0);
  assert.equal(dishes, 1, 'a dish when you come home');
  assert.equal(welcomeHome(w), null, 'once a day');
  breakUp(w, 'rowan');
  assert.ok(!w.char.home.placed.some((p) => p.theirs === 'rowan'), 'they take their piece back to town');
});

test('your sweetheart can come adventuring in your party, in their own job and look', () => {
  const w = player();
  w.char.level = 20;
  w.bots = createBots(w, () => 0.4);
  addHearts(w.char, 'lark', 7 * HEART);
  addItem(w.char.inventory, BOUQUET, 1);
  giveGift(w, 'lark', BOUQUET);
  assert.equal(bringAlong(w), null);
  const bot = partyMembers(w.bots).find((b) => b.sweetheart === 'lark');
  assert.ok(bot);
  assert.equal(bot.name, 'Lark');
  assert.equal(bot.char.appearance.hairStyle, SWEETHEARTS.lark.look.hairStyle);
  assert.equal(bot.char.job, AT_HOME.lark.job);
});

// ---------- Going home at night (world/goinghome.js) ----------
import { ROOM_SPOT } from '../src/world/goinghome.js';
import { updateWorld } from '../src/world/world.js';
import { greetingFor } from '../src/ui/sweetheart.js';

test('the Sweethearts are home in their rooms at night, walking in through their own door, and out by day', () => {
  const w = player();
  loadMap(w, 'sprout', 'start');
  const inTown = (id, map) => MAPS[map].npcs.some((n) => n.id === id);
  const inRoom = (id) => MAPS[`swh_${id}`].npcs.find((n) => n.id === id);
  const tick = (s) => { for (let i = 0; i < s * 60; i++) updateWorld(w, 1 / 60, { held: new Set(), pressed: new Set(), locked: false }); };
  w.forceNight = 0;
  tick(1.2);
  assert.ok(inTown('poppy', 'sprout') && !inRoom('poppy'), 'in town by day');
  // Dusk while you're beside her: she walks to her door and goes in, fading through it.
  w.body.x = 1000;
  w.forceNight = 1;
  tick(1.2);
  const n = MAPS.sprout.npcs.find((q) => q.id === 'poppy');
  assert.ok(n?.going, 'on her way home');
  tick(6);
  assert.ok(!inTown('poppy', 'sprout'), 'gone in');
  assert.equal(inRoom('poppy')?.x, ROOM_SPOT.poppy, 'at her spot in the kitchen');
  // The others, off-screen, are simply home too.
  for (const id of ['lark', 'rowan', 'yuzu', 'celeste', 'marlowe']) assert.ok(inRoom(id), id);
  // Knock late and she has her own words for it.
  loadMap(w, 'swh_poppy', 'door');
  assert.ok(w.map.npcs.some((q) => q.id === 'poppy'));
  assert.ok(SWEETHEARTS.poppy.late.includes(greetingFor(w, 'poppy')));
  // Dawn while you're in her kitchen: she heads out of the door, and is back at her spot in town.
  w.forceNight = 0;
  tick(1.2);
  tick(8);
  assert.ok(!inRoom('poppy') && inTown('poppy', 'sprout'));
  assert.equal(MAPS.sprout.npcs.find((q) => q.id === 'poppy').x, SWEETHEARTS.poppy.x);
  // Whoever lives with you isn't in town or at their old house.
  w.char.livingWith = 'lark';
  w.forceNight = 1;
  tick(1.2);
  assert.ok(!inRoom('lark'));
  w.char.livingWith = null;
  w.forceNight = 0;
  loadMap(w, 'sprout', 'start');
});

test('indoors is indoors: rooms keep none of the outdoors (critters, drift, street life, weather)', async () => {
  const { roomLook } = await import('../src/render/scenery.js');
  const { THEMES } = await import('../src/render/scenery.js');
  const rooms = Object.values(MAPS).filter((m) => m.indoor);
  assert.ok(rooms.length >= 7, 'the hut and the six rooms');
  for (const m of rooms) {
    assert.ok(m.look?.ceiling, `${m.id} has a ceiling (so no weather or night sky)`);
    assert.equal(m.look?.floor, 'painted', `${m.id} walks on its own painted floor`);
    const t = roomLook(m, { ...(THEMES?.[m.theme] ?? {}), ...m.look });
    assert.deepEqual(t.critters, [], m.id);
    assert.equal(t.drift, null, m.id);
    assert.equal(t.painted, null, m.id);
  }
});
