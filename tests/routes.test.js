// Getting around (world/routes.js): routes along the portals, the guide, quest targets, level ranges.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MAPS } from '../src/data/maps.js';
import { createCharacter } from '../src/core/character.js';
import { acceptQuest } from '../src/core/quests.js';
import { createWorld, loadMap } from '../src/world/world.js';
import { routeBetween, nextStep, questTarget, setRoute, checkArrival, levelRange } from '../src/world/routes.js';

test('every place on the island can be reached from Sprout Village, and back', () => {
  for (const m of Object.values(MAPS)) {
    if (m.dungeon || m.id.startsWith('daw') || ['trainfield', 'dock'].includes(m.id)) continue;
    assert.ok(routeBetween('sprout', m.id), `to ${m.id}`);
    assert.ok(routeBetween(m.id, 'sprout'), `from ${m.id}`);
  }
  const path = routeBetween('sprout', 'glade');
  assert.equal(path.length, 5, 'the shortest way round the ring');
  assert.equal(path.at(-1).to, 'glade');
  assert.ok(path.every((p, i) => i === 0 || MAPS[path[i - 1].to].portals.includes(p)), 'each step leaves from the last');
  assert.equal(nextStep('sprout', 'glade').left, 5);
  assert.equal(levelRange(MAPS.meadow1), 'Lv 1-3');
  // Each map has one road to each neighbour (no doubled portals).
  for (const m of Object.values(MAPS)) {
    const to = m.portals.filter((p) => !p.hidden && p.to).map((p) => p.to);
    assert.equal(new Set(to).size, to.length, `${m.id} has two roads to one place`);
  }
});

test('the guide leads to a place and stops on arrival; a quest knows where it wants you', () => {
  const char = createCharacter('Hana', {});
  char.level = 12;
  const w = createWorld(char);
  loadMap(w, 'sprout', 'start');
  setRoute(w, 'meadow2');
  assert.equal(w.route.to, 'meadow2');
  loadMap(w, 'meadow2', 'west');
  checkArrival(w);
  assert.equal(w.route, null);
  char.quests.first_steps = { state: 'done' };
  acceptQuest(char, 'fluffy');
  assert.equal(questTarget(char, 'fluffy'), 'meadow1', 'Fox Fluff comes from the Kitsune Kits in Petal Meadow');
  acceptQuest(char, 'pip_parcel');
  assert.equal(questTarget(char, 'pip_parcel'), 'harbor', 'the parcel goes to Rook at the harbor');
});
