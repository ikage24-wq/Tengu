// Town life: every resident lives in a real town, stands on something, holds real items, and
// does something the renderer knows how to draw.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { TOWNSFOLK } from '../src/data/townsfolk.js';
import { MAPS } from '../src/data/maps.js';
import { ITEMS } from '../src/data/items.js';
import { surfacesOf, groundAt } from '../src/world/physics.js';

const ACTS = new Set(['stroll', 'chase', 'shoot', 'train', 'spar', 'smith', 'cast', 'read', 'chat', 'nap', 'peck']);
const KINDS = new Set(['person', 'kid', 'cat', 'dog', 'chick']);

test('every town has residents, and each one is set up right', () => {
  const ids = new Set();
  for (const [town, folk] of Object.entries(TOWNSFOLK)) {
    const map = MAPS[town];
    assert.ok(map?.isTown, `${town} is a town`);
    assert.ok(folk.length >= 4, `${town} has a few residents`);
    for (const p of folk) {
      assert.ok(!ids.has(p.id), `${p.id} is unique`);
      ids.add(p.id);
      assert.ok(KINDS.has(p.kind), `${p.id} kind`);
      assert.ok(ACTS.has(p.act.type), `${p.id} act ${p.act.type}`);
      for (const piece of Object.values(p.gear ?? {})) assert.ok(ITEMS[piece.id], `${p.id} holds ${piece.id}`);
      // Everywhere they go is inside the map.
      for (const x of [p.act.x, p.act.a, p.act.b, ...(p.act.targets ?? [])].filter((v) => v != null)) assert.ok(x > 20 && x < map.width - 20, `${p.id} at ${x}`);
    }
  }
  for (const id of Object.keys(MAPS).filter((m) => MAPS[m].job)) assert.ok(TOWNSFOLK[id], `${id} has residents`);
});

test('residents stand on level ground, and pets on ledges sit on a real ledge', () => {
  for (const [town, folk] of Object.entries(TOWNSFOLK)) {
    const map = MAPS[town];
    const surfaces = surfacesOf(map);
    for (const p of folk) {
      if (p.act.y != null) {
        assert.ok(surfaces.some((s) => !s.ground && p.act.x >= s.x1 && p.act.x <= s.x2 && s.y === p.act.y), `${p.id} on a ledge at (${p.act.x}, ${p.act.y})`);
        continue;
      }
      // Standing spots, and both ends of a walk, are flat (no one hovers off a slope).
      for (const x of [p.act.x, p.act.a, p.act.b].filter((v) => v != null)) assert.equal(groundAt(map, x - 10), groundAt(map, x + 10), `${p.id} level at ${x}`);
    }
  }
});
