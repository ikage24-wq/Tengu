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
    // (Your own island is reached by its Home Shell or by boat, not by road.)
    if (m.dungeon || m.voyage || m.private || m.id.startsWith('daw') || ['trainfield', 'dock'].includes(m.id)) continue;
    assert.ok(routeBetween('sprout', m.id), `to ${m.id}`);
    assert.ok(routeBetween(m.id, 'sprout'), `from ${m.id}`);
  }
  const path = routeBetween('sprout', 'glade');
  assert.equal(path.length, 5, 'the shortest way round the ring');
  assert.equal(path.at(-1).to, 'glade');
  assert.ok(path.every((p, i) => i === 0 || MAPS[path[i - 1].to].portals.includes(p)), 'each step leaves from the last');
  assert.equal(nextStep('sprout', 'glade').left, 5);
  assert.equal(levelRange(MAPS.meadow1), 'Lv 1-3');
  // Each map has one road to each neighbour (no doubled portals; a homestone is a shortcut, not a road).
  for (const m of Object.values(MAPS)) {
    const to = m.portals.filter((p) => !p.hidden && !p.homestone && p.to).map((p) => p.to);
    assert.equal(new Set(to).size, to.length, `${m.id} has two roads to one place`);
  }
});

test('every big hunting map has a homestone at its far end, one way back to its town', () => {
  for (const m of Object.values(MAPS)) {
    if (m.isTown || m.dungeon || !m.town || m.width < 2000) continue;
    const stones = m.portals.filter((p) => p.homestone);
    assert.equal(stones.length, 1, `${m.id} has a homestone`);
    const s = stones[0];
    assert.equal(s.to, m.town, `${m.id}'s homestone goes to its town`);
    assert.ok(MAPS[m.town].portals.some((p) => p.id === s.toPortal), `${m.id}: the town has somewhere to arrive`);
    assert.ok(m.platforms.some((p) => !p.drift && s.y === p.y && s.x > p.x + 10 && s.x < p.x + p.w - 10), `${m.id}: it stands on a ledge`);
    assert.ok(!(m.ropes ?? []).some((r) => Math.abs(r.x - s.x) < 40 && s.y >= r.top && s.y <= r.bottom), `${m.id}: clear of ropes`);
    assert.ok(!m.portals.some((p) => p !== s && Math.abs(p.x - s.x) < 80 && Math.abs(p.y - s.y) < 8), `${m.id}: clear of other portals`);
  }
  // The guide never sends you through one (it's one way).
  assert.ok(!routeBetween('sprout', 'starfall').some((p) => p.homestone));
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
  char.quests.snail_trouble = { state: 'done' };
  acceptQuest(char, 'pip_parcel');
  assert.equal(questTarget(char, 'pip_parcel'), 'harbor', 'the parcel goes to Rook at the harbor');
});
