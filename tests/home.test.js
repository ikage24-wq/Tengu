// Your island (data/home.js, world/home.js): the deed, the Home Shell there and back, Shelly
// building it up a stage at a time, and what each stage adds.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createCharacter } from '../src/core/character.js';
import { createWorld, updateWorld, loadMap, useItem } from '../src/world/world.js';
import { QUESTS } from '../src/data/quests.js';
import { NPCS } from '../src/data/npcs.js';
import { HOME_STAGES, HOME_MAX } from '../src/data/home.js';
import { homeMap, buildNext, nextStageNeeds } from '../src/world/home.js';
import { acceptQuest, completeQuest } from '../src/core/quests.js';
import { addItem, countItem } from '../src/core/inventory.js';
import { waterAt } from '../src/world/physics.js';

const DT = 1 / 60;
const keys = (held = [], pressed = []) => ({ held: new Set(held), pressed: new Set(pressed) });

function islander() {
  const char = createCharacter('Isla', { hairStyle: 'bob' });
  char.level = 12;
  const w = createWorld(char);
  w.log = () => {};
  acceptQuest(char, 'island_deed');
  completeQuest(char, 'island_deed');
  return w;
}

test("Captain Rook's deed gives you the island and a Home Shell", () => {
  assert.ok(NPCS.rook.quests.includes('island_deed'));
  assert.equal(QUESTS.island_deed.rewards.island, true);
  const w = islander();
  assert.equal(w.char.home.stage, 1);
  assert.equal(countItem(w.char.inventory, 'home_shell'), 1);
});

test('the Home Shell takes you home and back where you were, and is never used up', () => {
  const w = islander();
  loadMap(w, 'meadow1', 'west');
  w.body.x = 600;
  assert.ok(useItem(w, 'home_shell'));
  assert.equal(w.map.id, 'home');
  assert.ok(useItem(w, 'home_shell'));
  assert.equal(w.map.id, 'meadow1');
  assert.ok(Math.abs(w.body.x - 600) < 2);
  assert.equal(countItem(w.char.inventory, 'home_shell'), 1);
  // Without an island it does nothing.
  const none = createWorld(createCharacter('N', { hairStyle: 'bob' }));
  none.log = () => {};
  addItem(none.char.inventory, 'home_shell', 1);
  assert.equal(useItem(none, 'home_shell'), false);
});

test('every stage adds something to do, and the island grows', () => {
  let last = 0;
  for (let s = 1; s <= HOME_MAX; s++) {
    const { map, spots } = homeMap(s);
    assert.ok(map.width >= last, `stage ${s} is no smaller`);
    last = map.width;
    assert.ok(map.private && map.home && map.npcs.some((n) => n.id === 'shelly'));
    assert.equal(map.spawns.length, 0, 'no monsters at home');
    const things = spots.length + map.nodes.length + map.ropes.length + map.townPieces.length;
    if (s > 1) {
      const prev = homeMap(s - 1);
      assert.ok(things > prev.spots.length + prev.map.nodes.length + prev.map.ropes.length + prev.map.townPieces.length, `stage ${s} adds something`);
    }
  }
  assert.equal(homeMap(2).spots.length, 2, 'the pond has its own fishing');
  assert.ok(waterAt(homeMap(2).map, 1100) != null);
  assert.equal(homeMap(3).map.nodes.length, 3, 'an ore rock and a herb patch');
  assert.ok(homeMap(4).map.ropes.length && homeMap(5).map.townPieces.some(([k]) => k === 'terrace'));
});

test('Shelly builds the next stage from what you bring her', () => {
  const w = islander();
  assert.match(String(buildNext(w.char)), /don't have/);
  const n = nextStageNeeds(w.char);
  for (const it of n.items) addItem(w.char.inventory, it.id, it.need);
  w.char.gold += n.gold;
  const gold = w.char.gold;
  assert.equal(buildNext(w.char), 2);
  assert.equal(w.char.gold, gold - HOME_STAGES[2].gold);
  for (const it of n.items) assert.equal(countItem(w.char.inventory, it.id), 0);
  loadMap(w, 'home', 'dock');
  assert.equal(w.map.stage, 2);
});

test('the hut door goes inside and back out; the skiff sails you to the harbor', () => {
  const w = islander();
  loadMap(w, 'home', 'dock');
  const door = w.map.portals.find((p) => p.id === 'hut');
  Object.assign(w.body, { x: door.x, y: door.y, onGround: true });
  updateWorld(w, DT, keys([], ['ArrowUp']));
  assert.equal(w.map.id, 'home_in');
  Object.assign(w.body, { x: 320, y: 360, onGround: true });
  updateWorld(w, DT, keys([], ['ArrowUp']));
  assert.equal(w.map.id, 'home');
  loadMap(w, 'home', 'dock');
  Object.assign(w.body, { x: 130, y: 528, onGround: true });
  updateWorld(w, DT, keys([], ['ArrowUp']));
  assert.ok(w.map.voyage, 'at sea');
  assert.equal(w.map.voyage.to, 'harbor');
});

// ---------- Furniture and decorating (data/furniture.js, world/decor.js) ----------
import { FURNITURE, FURNITURE_BY_ID, PLACED_MAX } from '../src/data/furniture.js';
import { RECIPES } from '../src/data/crafting.js';
import { craftBlocker } from '../src/core/crafting.js';
import { placeAt, placePiece, pickUpPiece, putAway, pieceAt } from '../src/world/decor.js';
import { MAPS } from '../src/data/maps.js';

function decorator(stage = 5) {
  const w = islander();
  w.char.home.stage = stage;
  for (const f of FURNITURE) addItem(w.char.inventory, f.id, 3);
  loadMap(w, 'home_in', 'door');
  return w;
}

test('every piece of furniture is craftable at a bench, once you have an island', () => {
  for (const f of FURNITURE) {
    const r = RECIPES.find((x) => x.makes === f.id);
    assert.ok(r && r.cat === 'home', f.id);
    assert.ok(['floor', 'rug', 'surface', 'wall', 'hang'].includes(f.layer));
  }
  const none = createCharacter('N', { hairStyle: 'bob' });
  assert.equal(craftBlocker(none, RECIPES.find((x) => x.makes === 'sea_table')), 'island');
  const w = islander();
  assert.equal(craftBlocker(w.char, RECIPES.find((x) => x.makes === 'bake_table')), 'stage', 'the bakery set opens with the pond');
});

test('pieces snap to where they belong, and say why not', () => {
  const w = decorator();
  const map = w.map;
  assert.equal(placeAt(map, w.char, 'sea_table', 200, 330).y, map.groundY, 'a table lands on the floor');
  assert.match(placeAt(map, w.char, 'sea_lamp', 200, 330).why, /table or a shelf/);
  assert.equal(placeAt(map, w.char, 'sea_lamp', 120, 250).y, 262, 'a lamp sits on the wall shelf');
  assert.match(placeAt(map, w.char, 'sea_hammock', 300, 330).why, /outside/);
  const t = placePiece(map, w.char, 'sea_table', 200, 330);
  assert.equal(typeof t, 'object');
  const lamp = placePiece(map, w.char, 'sea_lamp', 200, 330);
  assert.equal(lamp.y, map.groundY - FURNITURE_BY_ID.sea_table.top, 'onto the table top');
  assert.match(placeAt(map, w.char, 'sea_chair', 205, 330).why, /bumps into/);
  assert.match(String(pickUpPiece(w.char, t)), /off it first/, "a table with something on it stays put");
  assert.equal(pieceAt(w.char, map.id, 200, map.groundY - 25), lamp);
  assert.ok(putAway(w.char, lamp));
  assert.equal(pickUpPiece(w.char, t), t);
  // Outside: never in the water.
  loadMap(w, 'home', 'dock');
  assert.match(placeAt(w.map, w.char, 'sea_chair', 1120, 560).why, /wet/);
  assert.equal(typeof placePiece(w.map, w.char, 'sea_hammock', 430, 530), 'object');
  // A cap per map.
  assert.ok(PLACED_MAX >= 40);
});

test("a visitor sees their friend's island, not their own", () => {
  const w = islander();
  w.visiting = { ownerId: 'f1', name: 'Kai', home: { stage: 4, placed: [{ id: 'sea_table', map: 'home', x: 500, y: 540 }] } };
  loadMap(w, 'home', 'dock');
  assert.equal(w.map.stage, 4);
  assert.equal(w.map.guestOf.name, 'Kai');
  assert.match(w.map.name, /Kai/);
  loadMap(w, 'harbor', 'ferry');
  assert.equal(w.visiting, null, 'leaving ends the visit');
  loadMap(w, 'home', 'dock');
  assert.equal(w.map.guestOf, undefined);
  assert.equal(w.map.stage, 1);
});
