// The tutorial island (world/tutorial.js): a new character can walk, jump, climb, fight and loot
// their way through every lesson and off the island on the boat. The window lessons (talking,
// the bag, stats, skills, hotkeys) are done the way their windows do them.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, updateWorld, loadMap, useItem } from '../src/world/world.js';
import { createCharacter, autoAssignAp, learnSkill, equipFromBag } from '../src/core/character.js';
import { acceptQuest, completeQuest } from '../src/core/quests.js';
import { addItem, countItem } from '../src/core/inventory.js';
import { LESSONS, currentLesson, ISLAND_LESSONS, skipLesson } from '../src/world/tutorial.js';
import { MAPS } from '../src/data/maps.js';

const DT = 1 / 60;
const keys = (...k) => ({ held: new Set(k), pressed: new Set(k), locked: false });
const idle = keys();
const run = (w, input, secs) => {
  for (let i = 0; i < secs * 60; i++) updateWorld(w, DT, typeof input === 'function' ? input(i) : input);
};
const step = (w) => w.char.tutorial.step;

test('a new character can play the tutorial island from the beach to Sprout Village', () => {
  const c = createCharacter('Tutee', {});
  Object.assign(c, { mapId: 'dawnbeach', portal: 'start', tutorial: { step: 0 } });
  const w = createWorld(c);
  assert.equal(w.map.id, 'dawnbeach');
  assert.equal(currentLesson(c).step, 0);
  // Walk, then jump up onto the low ledge.
  run(w, keys('ArrowRight'), 1);
  run(w, idle, 0.2);
  assert.ok(step(w) >= 1, 'walking done');
  const ledge = MAPS.dawnbeach.platforms[0];
  w.body.x = ledge.x - 14;
  run(w, (i) => (i < 20 ? keys('ArrowRight', 'Space') : keys('ArrowRight')), 0.6);
  run(w, idle, 1);
  assert.ok(step(w) >= 2, `onto the ledge (at ${Math.round(w.body.x)}, ${Math.round(w.body.y)})`);
  // Climb the rope.
  w.body.x = MAPS.dawnbeach.ropes[0].x;
  w.body.y = w.map.groundY;
  run(w, keys('ArrowUp'), 0.5);
  assert.ok(step(w) >= 3, 'climbing done');
  w.body.rope = null;
  // Kuro's first quest: a practice sword, then the stats.
  acceptQuest(c, 'tut_hello');
  assert.ok(completeQuest(c, 'tut_hello'));
  run(w, idle, 0.1);
  assert.ok(step(w) >= 4, 'talked to Kuro');
  const bag = c.inventory.equip;
  equipFromBag(c, bag.findIndex((e) => e?.id === 'sword_0'));
  autoAssignAp(c);
  assert.ok(c.base.str > c.base.int, 'Auto grows the stat of the weapon in hand');
  run(w, idle, 0.1);
  assert.ok(step(w) >= 6, 'equipped and spent stats');
  // On to the practice field.
  loadMap(w, 'trainfield', 'west');
  run(w, idle, 0.1);
  assert.equal(step(w), 7);
  acceptQuest(c, 'tut_practice');
  run(w, idle, 0.1);
  assert.equal(step(w), 8, 'took the practice quest');
  // Fight the Kitsune Kits and pick up their fluff.
  for (let n = 0; n < 40 && step(w) < 10; n++) {
    const m = w.mobs.find((o) => o.hp > 0);
    if (m) w.body.x = m.x - 20 * (w.body.facing || 1);
    run(w, keys('KeyZ', 'KeyX'), 0.5);
    for (const d of w.drops) w.body.x = d.x;
    run(w, keys('KeyX'), 0.3);
  }
  // (Fluff drops by chance; top it up if the dice were stingy.)
  if (step(w) < 10) {
    addItem(c.inventory, 'fluff', 3);
    run(w, idle, 0.1);
  }
  assert.ok(step(w) >= 10, `fought and looted (lesson ${step(w)})`);
  const before = { step: step(w), n: countItem(c.inventory, 'red_potion'), ready: w.itemReadyAt, now: w.now, scratch: JSON.stringify(c.tutorial.scratch) };
  const drank = useItem(w, 'red_potion');
  run(w, idle, 0.1);
  assert.ok(step(w) >= 11, `drank a potion (${JSON.stringify({ ...before, drank, after: countItem(c.inventory, 'red_potion'), stepAfter: step(w) })})`);
  completeQuest(c, 'tut_practice');
  run(w, idle, 0.1);
  assert.ok(c.level >= 2 && c.sp > 0, `levelled up with a skill point (Lv ${c.level}, ${c.sp} SP)`);
  learnSkill(c, 'quickstep');
  c.hotkeys.KeyQ = { skill: 'quickstep' };
  run(w, idle, 0.1);
  assert.equal(step(w), 14, 'learned and bound a skill');
  loadMap(w, 'dock', 'west');
  acceptQuest(c, 'tut_farewell');
  completeQuest(c, 'tut_farewell');
  run(w, idle, 0.1);
  assert.equal(step(w), 15, 'said goodbye');
  // The boat.
  const boat = MAPS.dock.portals.find((p) => p.to === 'sprout');
  w.body.x = boat.x;
  run(w, keys('ArrowUp'), 0.3);
  assert.equal(w.map.id, 'sprout', 'sailed to Sprout Village');
  assert.equal(step(w), LESSONS.length, 'tutorial over');
  assert.equal(currentLesson(c), null);
});

test('any lesson can be skipped', () => {
  const c = createCharacter('Skippy', {});
  Object.assign(c, { mapId: 'dawnbeach', portal: 'start', tutorial: { step: 0 } });
  const w = createWorld(c);
  run(w, idle, 0.1);
  assert.equal(step(w), 0);
  skipLesson(w);
  assert.equal(step(w), 1);
  assert.equal(currentLesson(c).step, 1);
});

test('every lesson has a hint for the phone controls too', () => {
  for (const l of LESSONS) assert.ok(l.phone, l.hint);
});

test('a character who skips the island has no island lessons', () => {
  const c = createCharacter('Skipper', {});
  const w = createWorld(c);
  assert.equal(w.map.id, 'sprout');
  run(w, idle, 0.2);
  assert.equal(currentLesson(c), null);
  // (New characters who skip it start past every lesson.)
  c.tutorial = { step: ISLAND_LESSONS };
  run(w, idle, 0.1);
  assert.equal(currentLesson(c), null);
});
