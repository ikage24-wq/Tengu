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
  // (No festival unless a test asks for one: they come round by the real clock.)
  w.forceFestival = null;
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
  // (No festival unless a test asks for one: they come round by the real clock.)
  none.forceFestival = null;
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
  Object.assign(w.body, { x: 130, y: 1228, onGround: true });
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
  // (The Mochi Garden's own pieces are bought from Kinako instead: ui/garden-decor-shop.js.)
  for (const f of FURNITURE.filter((x) => x.where !== 'garden')) {
    const r = RECIPES.find((x) => x.makes === f.id);
    assert.ok(r && r.cat === 'home', f.id);
    assert.ok(['floor', 'rug', 'surface', 'wall', 'hang'].includes(f.layer));
  }
  // (Or, a festival's own, won at its stall for its tokens: ui/festival-stall.js.)
  // (Or the garden's own, there from the start: never bought.)
  for (const f of FURNITURE.filter((x) => x.where === 'garden')) assert.ok((f.builtin ? f.price == null : f.festival ? f.tokens > 0 : f.price > 0) && !RECIPES.some((x) => x.makes === f.id), `${f.id} is bought, won or the garden's own`);
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
  assert.match(placeAt(w.map, w.char, 'sea_chair', 1046, 1270).why, /wet/);
  assert.equal(typeof placePiece(w.map, w.char, 'sea_hammock', 1600, 1230), 'object');
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

// ---------- The tall island (the 2026-11-21 rework) ----------
import { TIER_Y, TIER_X, PLOT_X, CRATE_X, IN, ZIP, plant, plotGrowth, plantables, settleHome, G as BEACH } from '../src/world/home.js';
import { PLANTABLE, GROW_SECS, HOME_REST } from '../src/data/home.js';
import { ropeTop } from '../src/world/physics.js';
import { wakeAtInn } from '../src/world/inn.js';
import { expToNext } from '../src/core/exp.js';
import { ITEMS } from '../src/data/items.js';

const run = (w, secs, held = [], pressed = []) => {
  for (let t = 0; t < secs; t += DT) updateWorld(w, DT, keys(held, t === 0 ? pressed : []));
};

test('the island is tall: each stage opens a tier up the rock, every ladder reaching its top', () => {
  const tops = (s) => homeMap(s).map.platforms.filter((p) => p.bare && !p.bridge).map((p) => p.y);
  assert.deepEqual(tops(1), [TIER_Y.garden], 'the garden terrace from the start');
  assert.ok(tops(3).includes(TIER_Y.rise) && !tops(2).includes(TIER_Y.rise), 'the rise opens at 3');
  assert.ok(tops(5).includes(TIER_Y.summit) && !tops(4).includes(TIER_Y.summit), 'the summit at 5');
  for (let s = 1; s <= HOME_MAX; s++) {
    const { map } = homeMap(s);
    assert.equal(map.height, homeMap(1).map.height, 'the same size every stage: tiers open, the island stays put');
    for (const r of map.ropes) assert.ok(ropeTop(map, r), `stage ${s}: the ladder at ${r.x} reaches a floor`);
    assert.equal(map.masses.length, 5, 'the rock is all there, open or wild');
  }
  assert.equal(homeMap(5).map.ziplines.length, 1);
  assert.equal(homeMap(4).map.ziplines.length, 0);
});

test('the clam bounces you up onto the garden terrace', () => {
  const w = islander();
  loadMap(w, 'home', 'dock');
  Object.assign(w.body, { x: 944, y: BEACH, onGround: true, vx: 0, vy: 0 });
  run(w, 2);
  assert.equal(w.body.y, TIER_Y.garden);
  assert.ok(w.body.onGround);
});

test('the zip line takes you from the summit down to the dock', () => {
  const w = islander();
  w.char.home.stage = 5;
  loadMap(w, 'home', 'dock');
  Object.assign(w.body, { x: ZIP.x1 + 6, y: TIER_Y.summit, onGround: true, vx: 0, vy: 0 });
  run(w, 0.1, ['ArrowUp'], ['ArrowUp']);
  assert.ok(w.body.zip, 'Up at the post takes hold of the handle');
  let peak = 0;
  for (let t = 0; t < 8 && w.body.zip; t += DT) {
    updateWorld(w, DT, keys());
    peak = Math.max(peak, w.body.zip?.v ?? 0);
  }
  assert.equal(w.body.zip, null, 'off at the bottom');
  assert.ok(w.body.onGround && Math.abs(w.body.y - (BEACH - 12)) < 1 && Math.abs(w.body.x - ZIP.x2) < 2, 'standing on the dock');
  assert.ok(peak > 300, 'it picks up speed on the way');
});

test('a garden plot: plant something you gathered, it grows while you wait, and you pick more back', () => {
  const w = islander();
  loadMap(w, 'home', 'dock');
  addItem(w.char.inventory, 'clover', 1);
  addItem(w.char.inventory, 'starbloom', 1);
  assert.ok(PLANTABLE.every((id) => ITEMS[id]?.gathered), 'only gathered things grow');
  assert.deepEqual(plantables(w.char).map((p) => [p.id, p.ok]), [['clover', true], ['starbloom', false]]);
  assert.match(plant(w.char, 0, 'starbloom'), /Gathering Lv/, 'a rare one needs the level');
  assert.match(plant(w.char, 5, 'clover'), /no plot/, 'two plots to start');
  assert.equal(plant(w.char, 0, 'clover'), null);
  assert.equal(countItem(w.char.inventory, 'clover'), 0);
  assert.ok(plotGrowth(w.char.home.plots[0]) < 0.01);
  // Up at it while it grows only says how long.
  Object.assign(w.body, { x: PLOT_X[0], y: TIER_Y.garden, onGround: true });
  run(w, 2, [], ['ArrowUp']);
  assert.equal(countItem(w.char.inventory, 'clover'), 0);
  // Ripe (it grew while you were away), it's picked by hand: three back for the one.
  w.char.home.plots[0].at -= GROW_SECS + 5;
  run(w, 2.5, [], ['ArrowUp']);
  assert.equal(countItem(w.char.inventory, 'clover'), 3);
  assert.equal(w.char.home.plots[0], null, 'and the plot is free again');
});

test("the beach's sell crate and the hut's trunk open their windows; a visitor can't use them", () => {
  const w = islander();
  loadMap(w, 'home', 'dock');
  Object.assign(w.body, { x: CRATE_X, y: BEACH, onGround: true });
  updateWorld(w, DT, keys([], ['ArrowUp']));
  assert.ok(w.events.some((e) => e.type === 'sellcrate'));
  loadMap(w, 'home_in', 'door');
  w.events.length = 0;
  Object.assign(w.body, { x: IN.trunk, y: 360, onGround: true });
  updateWorld(w, DT, keys([], ['ArrowUp']));
  assert.ok(w.events.some((e) => e.type === 'trunk'));
  assert.ok(typeof w.map.stove === 'number', 'a stove in the hut');
  assert.equal(homeMap(1).map.bench > 0, true, "Shelly's craft bench on the beach");
  // A friend's island: look, don't touch.
  w.visiting = { ownerId: 'f1', name: 'Kai', home: { stage: 2, placed: [] } };
  loadMap(w, 'home', 'dock');
  w.events.length = 0;
  Object.assign(w.body, { x: CRATE_X, y: BEACH, onGround: true });
  updateWorld(w, DT, keys([], ['ArrowUp']));
  assert.ok(!w.events.some((e) => e.type === 'sellcrate'));
});

test('a night in your own hut rests you, at half the inn\'s rate', () => {
  const char = createCharacter('Isla', { hairStyle: 'bob' });
  char.level = 20;
  char.home = { stage: 1, placed: [], plots: [], layout: 2 };
  const inn = { ...structuredClone(char), inn: { checkedIn: true }, mapId: 'coin_inn', savedAt: Date.now() - 4 * 3600000, rested: 0 };
  const hut = { ...structuredClone(char), mapId: 'home_in', savedAt: Date.now() - 4 * 3600000, rested: 0 };
  const field = { ...structuredClone(char), mapId: 'meadow1', savedAt: Date.now() - 4 * 3600000, rested: 0 };
  const a = wakeAtInn(inn);
  const b = wakeAtInn(hut);
  assert.ok(a > 0 && Math.abs(b - a * HOME_REST) <= 1, `${b} is half of ${a}`);
  assert.equal(wakeAtInn(field), 0);
  assert.ok(b < expToNext(20), 'a small rest, never a level');
});

test('an island from before the rework moves in: outdoor furniture back to the bag, the hut untouched', () => {
  const char = createCharacter('Isla', { hairStyle: 'bob' });
  char.home = { stage: 3, back: null, bag: {}, placed: [{ uid: 1, id: 'sea_table', map: 'home', x: 500, y: 540 }, { uid: 2, id: 'sea_lamp', map: 'home_in', x: 200, y: 262 }] };
  assert.equal(settleHome(char), 1);
  assert.equal(countItem(char.inventory, 'sea_table'), 1);
  assert.deepEqual(char.home.placed.map((p) => p.id), ['sea_lamp']);
  assert.equal(char.home.layout, 2);
  assert.equal(settleHome(char), 0, 'only once');
});

// ---------- The island's crops, rain, your helper, and the hut's rooms (2026-11-21) ----------
import { roomsOf, roomNeeds, buildRoom, homeTick, helperPicks, stargaze, homeInside } from '../src/world/home.js';
import { ISLAND_CROPS, HOME_ROOMS, RAIN_GROW, HOME_REST_BEDROOM } from '../src/data/home.js';
import { DISHES } from '../src/data/cooking.js';

test("Shelly's island seeds grow only in your plots, each from its stage, into a top dish of its tier", () => {
  assert.deepEqual(NPCS.shelly.shop, ISLAND_CROPS.map((c) => c.seed.id), 'she sells the seeds');
  for (const c of ISLAND_CROPS) {
    const dish = DISHES.find((d) => d.needs[c.id]);
    assert.ok(dish && dish.tier === c.tier, `${c.name} cooks into a tier ${c.tier} dish`);
    assert.ok(ITEMS[c.seed.id].price >= 100, 'seeds cost something');
  }
  const w = islander();
  w.char.life = { gathering: { level: 30, exp: 0 } };
  addItem(w.char.inventory, 'seed_seamelon', 2);
  addItem(w.char.inventory, 'seed_sunpine', 1);
  assert.match(plant(w.char, 0, 'seed_sunpine'), /Rocky Rise/, 'a pineapple wants the rise built');
  assert.equal(plant(w.char, 0, 'seed_seamelon'), null);
  assert.equal(w.char.home.plots[0].id, 'sea_melon');
  w.char.home.plots[0].at -= GROW_SECS + 5;
  loadMap(w, 'home', 'dock');
  Object.assign(w.body, { x: PLOT_X[0], y: TIER_Y.garden, onGround: true });
  run(w, 2.5, [], ['ArrowUp']);
  assert.equal(countItem(w.char.inventory, 'sea_melon'), 3);
});

test('rain on the island fills the pond and waters the garden, so it ripens sooner', () => {
  const w = islander();
  w.char.home.stage = 2;
  plant(w.char, 0, (addItem(w.char.inventory, 'clover', 1), 'clover'));
  loadMap(w, 'home', 'dock');
  const pond = w.map.water.find((x) => x.kind === 'spring');
  const dry = pond.y;
  w.weather = 'rain';
  for (let t = 0; t < 10; t += DT) homeTick(w, DT);
  assert.ok(pond.y < dry - 4, 'the pond rises');
  assert.ok(w.char.home.plots[0].wet, 'the plot got watered');
  const at = w.char.home.plots[0].at;
  assert.equal(plotGrowth(w.char.home.plots[0], at + GROW_SECS * RAIN_GROW), 1, 'ripe sooner');
  w.weather = null;
  for (let t = 0; t < 20; t += DT) homeTick(w, DT);
  assert.ok(Math.abs(pond.y - dry) < 0.5, 'and drains again');
  assert.ok(homeMap(2).spots[1].pool.fish_rainbow, 'a rain fish in the pond');
});

test('whoever lives with you picks your ripe crops into the trunk while you were away', () => {
  const w = islander();
  addItem(w.char.inventory, 'clover', 2);
  plant(w.char, 0, 'clover');
  plant(w.char, 1, 'clover');
  w.char.home.plots[0].at -= GROW_SECS + 5;
  const world = { storage: { equip: [], use: [], etc: [] } };
  assert.deepEqual(helperPicks(w.char, world), [], 'nobody lives here yet');
  w.char.livingWith = 'poppy';
  assert.deepEqual(helperPicks(w.char, world), [{ id: 'clover', n: 3 }]);
  assert.equal(world.storage.etc.find((e) => e.id === 'clover').qty, 3);
  assert.equal(w.char.home.plots[0], null, 'picked');
  assert.ok(w.char.home.plots[1], 'the one still growing is left');
});

test('Shelly builds each room of the hut for its own price; rooms open off the main room and stay put', () => {
  const w = islander();
  const char = w.char;
  assert.deepEqual(roomsOf(char.home), [], 'one room to start');
  assert.match(buildRoom(char, 'bedroom'), /Rocky Rise/, 'the bedroom waits for its stage');
  assert.match(buildRoom(char, 'kitchen'), /don't have/);
  const k = HOME_ROOMS.find((r) => r.id === 'kitchen');
  char.gold = k.gold + 10;
  for (const [id, n] of Object.entries(k.needs)) addItem(char.inventory, id, n);
  assert.equal(buildRoom(char, 'kitchen'), k.name);
  assert.equal(char.gold, 10, 'paid');
  assert.deepEqual(roomsOf(char.home), [{ id: 'kitchen', x: 640 }]);
  loadMap(w, 'home_in', 'door');
  assert.equal(w.map.width, 900);
  assert.ok(w.map.stove > 640, 'the stove moved into the kitchen');
  assert.ok(roomNeeds(char, 'kitchen').built);
  // An island from before rooms had prices keeps what its stages gave it.
  const old = { stage: 4 };
  assert.deepEqual(roomsOf(old).map((r) => r.id), ['kitchen', 'loft', 'sunroom']);
  assert.equal(homeInside(4, roomsOf(old)).width, 640 + 260 + 280);
});

test('the bedroom rests you better, and the telescope tells you what\'s out after dark', () => {
  const char = createCharacter('Isla', { hairStyle: 'bob' });
  char.level = 20;
  char.home = { stage: 3, placed: [], plots: [], rooms: [{ id: 'bedroom', x: 640 }], layout: 2 };
  const hut = { ...structuredClone(char), mapId: 'home_in', savedAt: Date.now() - 4 * 3600000, rested: 0 };
  const inn = { ...structuredClone(char), inn: { checkedIn: true }, mapId: 'coin_inn', savedAt: Date.now() - 4 * 3600000, rested: 0 };
  const b = wakeAtInn(hut);
  const a = wakeAtInn(inn);
  assert.ok(Math.abs(b - a * HOME_REST_BEDROOM) <= 1, `${b} is three quarters of ${a}`);
  const lines = stargaze(char);
  assert.match(lines.join(' '), /Firefly Minnow/);
  assert.match(lines.join(' '), /Moonpetal/);
});

// ---------- The farm, the Island Keepsakes, and inviting your party (2026-11-21) ----------
import { farmNeeds, buildFarm, farmReady, tickAnimal, refreshHome } from '../src/world/home.js';
import { FARM, FARM_SECS, FARM_CAP, FARM_GOODS } from '../src/data/home.js';
import { onVisit } from '../src/net/visit.js';
import { online } from '../src/net/online.js';

const payFor = (char, def) => {
  char.gold = (char.gold ?? 0) + def.gold;
  for (const [id, n] of Object.entries(def.needs)) addItem(char.inventory, id, n);
};

test('Shelly builds the farm a building at a time, its animals come with it, and they make their goods on their own', () => {
  const w = islander();
  const char = w.char;
  const coop = FARM.find((f) => f.id === 'coop');
  assert.match(buildFarm(char, 'pen'), /Tide Pond/, 'the pen waits for its stage');
  payFor(char, coop);
  assert.equal(buildFarm(char, 'coop'), coop.name);
  assert.ok(farmNeeds(char, 'coop').built);
  loadMap(w, 'home', 'dock');
  assert.equal(w.map.animals.filter((a) => a.kind === 'hen').length, coop.count, 'three hens');
  // Nothing yet, then a batch of eggs, collected at the coop.
  Object.assign(w.body, { x: coop.x, y: BEACH, onGround: true });
  updateWorld(w, DT, keys([], ['ArrowUp']));
  assert.equal(countItem(char.inventory, 'sunny_egg'), 0);
  char.home.farm.coop.at -= FARM_SECS * 10;
  assert.equal(farmReady(char.home.farm.coop, coop), FARM_CAP * coop.count, 'only so many wait');
  updateWorld(w, DT, keys([], ['ArrowUp']));
  assert.equal(countItem(char.inventory, 'sunny_egg'), FARM_CAP * coop.count);
  assert.equal(farmReady(char.home.farm.coop, coop), 0);
  // Whoever lives with you collects them into the trunk.
  char.home.farm.coop.at -= FARM_SECS;
  char.livingWith = 'poppy';
  const world = { storage: { etc: [] } };
  assert.deepEqual(helperPicks(char, world), [{ id: 'sunny_egg', n: coop.count }]);
  for (const g of FARM_GOODS) assert.ok(DISHES.some((d) => d.needs[g.id]) || /craft bench/.test(ITEMS[g.id].desc), `${g.name} has a use`);
});

test('the animals wander their own yard, and walk home to bed at night', () => {
  const w = islander();
  for (const f of FARM) {
    w.char.home.stage = 5;
    payFor(w.char, f);
    assert.equal(buildFarm(w.char, f.id), f.name);
  }
  loadMap(w, 'home', 'dock');
  const animals = w.map.animals;
  assert.equal(animals.length, FARM.reduce((n, f) => n + f.count, 0));
  for (let t = 0; t < 120; t += 0.1) for (const a of animals) tickAnimal(a, 0.1, false);
  for (const a of animals) assert.ok(a.x >= a.yard[0] - 1 && a.x <= a.yard[1] + 1, `${a.kind} stays in its yard`);
  assert.ok(animals.some((a) => a.walked > 20), 'they get about');
  for (let t = 0; t < 60; t += 0.1) for (const a of animals) tickAnimal(a, 0.1, true);
  for (const a of animals) assert.ok(a.state === 'sleep' && Math.abs(a.x - a.home) < 1, `${a.kind} asleep at home`);
});

test('the Island Keepsakes are made from the island\'s own things', () => {
  const isle = FURNITURE.filter((f) => f.set === 'isle');
  assert.equal(isle.length, 5);
  const used = new Set(isle.flatMap((f) => Object.keys(f.needs)));
  for (const id of ['seafoam_wool', 'sea_melon', 'lantern_gourd', 'fish_glowloach']) assert.ok(used.has(id), `${id} goes into one`);
  for (const f of isle) assert.ok(RECIPES.some((r) => r.makes === f.id), `${f.name} is made at a bench`);
});

test('your party can be asked over, and a visitor sees the island as it is', () => {
  const w = islander();
  const was = { id: online.id, party: online.party };
  online.id = 'me';
  online.party = { members: ['me', 'kai'] };
  w.events.length = 0;
  onVisit(w, { to: 'me', id: 'kai', op: 'invite', name: 'Kai' }, null);
  assert.ok(w.events.some((e) => e.type === 'islandinvite'));
  assert.equal(online.islandInvite.from, 'kai');
  online.islandInvite = null;
  onVisit(w, { to: 'me', id: 'stranger', op: 'invite', name: 'Who' }, null);
  assert.equal(online.islandInvite, null, 'only from your party');
  Object.assign(online, was);
  // A friend's island arrives with its rooms, crops and farm.
  refreshHome(w.char, { name: 'Kai', home: { stage: 3, layout: 2, placed: [], rooms: [{ id: 'kitchen', x: 640 }], plots: [{ id: 'clover', at: 0 }], farm: { coop: { at: 0 } } } });
  assert.equal(MAPS.home.farm.length, 1);
  assert.equal(MAPS.home.plots[0].id, 'clover');
  assert.equal(MAPS.home_in.width, 900);
  refreshHome(w.char);
});

// ---------- The island's sounds and Pastel Harbor's clock (2026-11-21) ----------
import { placeOf } from '../src/audio/ambience.js';
import { hearWorld } from '../src/audio/listen.js';

test('the island sounds like an island, its animals call from the farm, and the harbour clock tells the time', () => {
  const w = islander();
  const char = w.char;
  char.home.stage = HOME_MAX;
  for (const def of FARM) {
    payFor(char, def);
    assert.equal(buildFarm(char, def.id), def.name);
  }
  loadMap(w, 'home', 'dock');
  assert.equal(placeOf(w.map), 'isle', 'waves and gulls, no town chatter');
  assert.equal(placeOf(MAPS.home_cave ?? { amb: 'cave' }), 'cave');
  assert.equal(placeOf(MAPS.harbor), 'harbortown', 'the harbour keeps its port sounds, its tower rings the hour');
  // Each animal's call is heard once, from where it is.
  const heard = [];
  globalThis.__tengu = { onSound: (name) => heard.push(name) };
  try {
    w.body.x = 1700;
    for (const a of w.map.animals) a.call = 0.9;
    hearWorld(w);
    hearWorld(w);
    for (const call of ['henCluck', 'sheepBaa', 'cowMoo']) assert.ok(heard.includes(call), call);
    assert.equal(heard.filter((n) => n === 'henCluck').length, w.map.animals.filter((a) => a.kind === 'hen').length, 'once each, not every frame');
  } finally {
    delete globalThis.__tengu;
  }
  // The clock's time of day follows the player's clock, smoothly between readings.
  w.dayClock = () => new Date(2026, 10, 21, 15, 30, 0);
  loadMap(w, 'harbor', 'start');
  updateWorld(w, DT, keys());
  assert.ok(Math.abs(w.map.clockMin - 930) < 0.1, `half past three: ${w.map.clockMin}`);
});
