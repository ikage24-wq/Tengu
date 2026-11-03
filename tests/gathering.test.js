// Gathering and mining (world/gathering.js, data/gathering.js) and what the finds are for.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MAPS } from '../src/data/maps.js';
import { ITEMS } from '../src/data/items.js';
import { NODES, KINDS, GATHERED } from '../src/data/gathering.js';
import { DISHES } from '../src/data/cooking.js';
import { MOVES } from '../src/render/moves.js';
import { createCharacter } from '../src/core/character.js';
import { addItem, countItem } from '../src/core/inventory.js';
import { makeEquip, polish, oreFor, ORE_USE, boostedChance, polishChance } from '../src/core/items.js';
import { surfacesOf } from '../src/world/physics.js';
import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { nodeReady } from '../src/world/gathering.js';

const DT = 1 / 60;
const press = (k) => ({ held: new Set(), pressed: new Set(k ? [k] : []) });
const step = (w, secs, k = null) => {
  for (let i = 0; i < secs * 60; i++) updateWorld(w, DT, press(i === 0 ? k : null));
};

test('every spot stands on something, its finds are items, and each kind has a move', () => {
  for (const [map, nodes] of Object.entries(NODES)) {
    assert.ok(MAPS[map], map);
    for (const n of nodes) {
      assert.ok(surfacesOf(MAPS[map]).some((f) => n.x >= f.x1 && n.x <= f.x2 && Math.abs(f.yAt(n.x) - n.y) < 2), `${map} ${n.kind} at ${n.x} stands on something`);
      assert.ok(KINDS[n.kind] && MOVES[KINDS[n.kind].move], `${n.kind} has a move`);
      for (const id of [...Object.keys(n.pool), ...(n.rare ? [n.rare[0]] : [])]) assert.ok(ITEMS[id]?.gathered, `${map} gives ${id}`);
    }
  }
  // Every find is good for something: a dish, the craft bench or Tora's forge, and a shop buys it.
  for (const [id] of GATHERED) {
    const cooked = DISHES.some((d) => d.needs[id]);
    assert.ok(cooked || /forge|craft bench/.test(ITEMS[id].desc), `${id} has a use`);
    assert.ok(ITEMS[id].price > 0, `${id} sells`);
  }
});

test('Up at a spot gathers its finds, then it rests until it grows back', () => {
  const w = createWorld(createCharacter('Picker', {}));
  loadMap(w, 'meadow1', 'west');
  w.mobs = [];
  w.spawner.slots = [];
  const i = NODES.meadow1.findIndex((n) => n.kind === 'herb');
  const n = NODES.meadow1[i];
  Object.assign(w.body, { x: n.x, y: n.y, onGround: true, vx: 0, vy: 0 });
  step(w, 0.1, 'ArrowUp');
  assert.ok(w.gathering, 'gathering');
  assert.equal(w.pose?.kind, 'gather');
  step(w, KINDS.herb.secs + 0.2);
  assert.equal(w.gathering, null);
  assert.ok(countItem(w.char.inventory, 'clover') >= 1, 'got clover');
  assert.ok(!nodeReady(w, i), 'resting');
  const had = countItem(w.char.inventory, 'clover');
  step(w, 0.1, 'ArrowUp');
  assert.ok(!w.gathering, 'nothing to pick while it grows back');
  assert.equal(countItem(w.char.inventory, 'clover'), had);
  step(w, KINDS.herb.rest);
  assert.ok(nodeReady(w, i), 'grown back');
});

test('walking off stops gathering with nothing', () => {
  const w = createWorld(createCharacter('Quitter', {}));
  loadMap(w, 'meadow1', 'west');
  w.mobs = [];
  w.spawner.slots = [];
  const n = NODES.meadow1.find((q) => q.kind === 'ore');
  Object.assign(w.body, { x: n.x, y: n.y, onGround: true, vx: 0, vy: 0 });
  step(w, 0.1, 'ArrowUp');
  assert.equal(w.pose?.kind, 'mine');
  for (let k = 0; k < 10; k++) updateWorld(w, DT, { held: new Set(['ArrowRight']), pressed: new Set() });
  step(w, KINDS.ore.secs);
  assert.equal(w.gathering, null);
  assert.equal(countItem(w.char.inventory, 'copper_ore'), 0);
});

test("ore at Tora's makes a polish likelier to take, and is used up", () => {
  const c = createCharacter('Smith', {});
  c.gold = 1e6;
  const inst = makeEquip(Object.keys(ITEMS).find((id) => ITEMS[id].slot && ITEMS[id].slot !== 'weapon' && (ITEMS[id].reqLevel ?? 0) <= 20), {});
  inst.polish = 6;
  assert.equal(oreFor(inst)?.id, 'copper_ore');
  assert.ok(boostedChance(inst, 'copper_ore') > polishChance(inst));
  assert.ok(boostedChance(inst, 'rose_quartz') > boostedChance(inst, 'copper_ore'));
  assert.equal(polish(c, inst, () => 0.5, 'copper_ore').why, 'ore', 'no ore, no boosted try');
  addItem(c.inventory, 'copper_ore', ORE_USE);
  const r = polish(c, inst, () => 0.99 * boostedChance(inst, 'copper_ore'), 'copper_ore');
  assert.ok(r.ok, 'a roll that only the boost makes good takes');
  assert.equal(countItem(c.inventory, 'copper_ore'), 0);
});

test('night follows the game clock, and night spots only open in the dark', async () => {
  const { nightOf, DAY_MINUTES } = await import('../src/world/daytime.js');
  // (A game hour is a real minute: game hour h at h real minutes past a whole game day.)
  const hourAt = (h, m = 0) => new Date((h + m / 60) * 60000 * (DAY_MINUTES / 24));
  const at = (h, m = 0) => nightOf(hourAt(h, m));
  assert.equal(at(12), 0);
  assert.equal(at(23), 1);
  assert.equal(at(2), 1);
  assert.ok(at(19, 45) > 0 && at(19, 45) < 1, 'dusk falls gradually');
  assert.ok(at(5, 30) > 0 && at(5, 30) < 1, 'dawn breaks gradually');
  const w = createWorld(createCharacter('Owl', {}));
  loadMap(w, 'meadow1', 'west');
  w.mobs = [];
  w.spawner.slots = [];
  const n = NODES.meadow1.find((q) => q.night);
  Object.assign(w.body, { x: n.x, y: n.y, onGround: true, vx: 0, vy: 0 });
  w.dayClock = () => hourAt(12);
  step(w, 1.2);
  step(w, 0.1, 'ArrowUp');
  assert.ok(!w.gathering, 'closed by day');
  w.dayClock = () => hourAt(23);
  step(w, 1.2);
  step(w, 0.1, 'ArrowUp');
  assert.ok(w.gathering, 'open at night');
});

test('a map calms as you hunt, pays more EXP when calm, and sours when left alone', async () => {
  const { calmOf, CALM, SOUR } = await import('../src/world/calm.js');
  const { killMob } = await import('../src/world/world.js');
  const { spawnMob } = await import('../src/world/mobs.js');
  const w = createWorld(createCharacter('Calmer', {}));
  w.log = () => {};
  loadMap(w, 'meadow1', 'west');
  w.mobs = [];
  w.spawner.slots = [];
  const before = calmOf(w);
  const fell = () => {
    const m = spawnMob(w.map, { mob: 'puffle', x: 600, y: 1000 });
    m.hp = 0;
    const exp = w.char.exp;
    killMob(w, m);
    return w.char.exp - exp;
  };
  const plain = fell();
  assert.ok(calmOf(w) > before, 'a kill calms it');
  while (calmOf(w) < CALM) fell();
  const calmExp = fell();
  assert.ok(calmExp > plain, `a calm map pays more (${calmExp} vs ${plain})`);
  w.now += 3600;
  assert.ok(calmOf(w) < SOUR, 'an hour alone sours it');
});

test('monsters live there: they nap at night (harmless), play chase by day, and run off when hurt', async () => {
  const { tickHabits, napping } = await import('../src/world/habits.js');
  const { spawnMob, hitMob } = await import('../src/world/mobs.js');
  const w = createWorld(createCharacter('Watcher', {}));
  loadMap(w, 'meadow1', 'west');
  w.spawner.slots = [];
  w.body.x = 100;
  // (Up on the clouds, away from their den, so they don't just head home.)
  const kits = [spawnMob(w.map, { mob: 'puffle', x: 600, y: 280 }), spawnMob(w.map, { mob: 'puffle', x: 700, y: 280 })];
  w.mobs = kits;
  w.map.night = 0;
  for (const m of kits) m.think = 0;
  tickHabits(w, 0.016, () => 0.2);
  assert.equal(kits[0].habit?.kind, 'play', 'kits play chase by day');
  assert.equal(kits[1].habit?.kind, 'play');
  w.map.night = 1;
  for (const m of kits) Object.assign(m, { think: 0, habit: null });
  tickHabits(w, 0.016, () => 0.2);
  assert.ok(napping(kits[0], w.now), 'and curl up at night');
  hitMob(kits[0], 1, kits[0].x - 20, w.now);
  assert.equal(kits[0].habit?.kind, 'flee', 'a hit wakes it and it runs off');
  assert.ok(kits[0].habit.x > kits[0].x, 'away from the blow');
});

test("the Queen Bee bursts out of the hive after enough hunting, and her honey slam hits her floor", async () => {
  const { killMob } = await import('../src/world/world.js');
  const { spawnMob } = await import('../src/world/mobs.js');
  const { nestBoss } = await import('../src/world/nest.js');
  const w = createWorld(createCharacter('Keeper', {}));
  w.log = () => {};
  loadMap(w, 'meadow1', 'west');
  w.mobs = [];
  w.spawner.slots = [];
  const nest = w.map.nest;
  for (let k = 0; k < nest.kills - 1; k++) {
    const m = spawnMob(w.map, { mob: 'bumble', x: 900, y: 680 });
    m.hp = 0;
    killMob(w, m);
  }
  assert.equal(nestBoss(w), null, 'not yet');
  const last = spawnMob(w.map, { mob: 'bumble', x: 900, y: 680 });
  last.hp = 0;
  killMob(w, last);
  const queen = nestBoss(w);
  assert.ok(queen && queen.def.id === 'queenbee', 'she wakes');
  assert.ok(Math.abs(queen.x - nest.x) < 2, 'at her hive');
  // Standing on her floor near her when the dipper lands hurts.
  Object.assign(w.body, { x: queen.x + 40, y: nest.y, onGround: true, vx: 0, vy: 0 });
  w.invuln = 0;
  w.god = false;
  const hp = w.char.hp;
  queen.special.timer = 0;
  step(w, queen.def.special.warn + 0.3);
  assert.ok(w.char.hp < hp, 'the honey slam lands');
  queen.hp = 0;
  killMob(w, queen);
  assert.equal(w.nestKills.meadow1, 0, 'the count starts again');
});

test('every area boss nest wakes a real boss, over a floor, with its own warnings', async () => {
  const { MOBS } = await import('../src/data/mobs.js');
  const { ARTS } = await import('../src/render/mobs/index.js');
  for (const m of Object.values(MAPS)) {
    if (!m.nest) continue;
    const def = MOBS[m.nest.mob];
    assert.ok(def?.boss && ARTS[def.art], `${m.id}: ${m.nest.mob} is a drawn boss`);
    assert.ok(surfacesOf(m).some((s) => m.nest.x >= s.x1 && m.nest.x <= s.x2 && Math.abs(s.yAt(m.nest.x) - m.nest.y) < 2), `${m.id}: the nest is over a floor`);
    assert.equal(m.nest.stirs?.length, 2, `${m.id}: two warnings`);
  }
});
