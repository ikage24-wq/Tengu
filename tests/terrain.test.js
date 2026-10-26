// Terrain: the ground follows a map's `terrain` line, with slopes you walk up and down, small
// steps you walk over, and cliff walls that block you until you jump or climb. Monsters, drops,
// and party members' pathfinding all follow it.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createBody, stepBody, groundAt, surfacesOf } from '../src/world/physics.js';
import { navOf, findPath, followPath, surfaceOf } from '../src/world/nav.js';
import { spawnMob, updateMob } from '../src/world/mobs.js';
import { updateDrops } from '../src/world/drops.js';

const DT = 1 / 60;
// Flat, then a slope up, a plateau, a small step down, a cliff wall down, and a cliff wall up.
const MAP = {
  width: 1400, height: 600, groundY: 560, platforms: [{ x: 1150, y: 410, w: 120 }], ropes: [],
  terrain: [[0, 560], [300, 560], [450, 480], [700, 480], [700, 490], [800, 490], [800, 560], [1000, 560], [1000, 480], [1400, 480]],
};
const idle = { left: false, right: false, up: false, down: false, jump: false };
const walk = (body, dir, seconds) => {
  for (let i = 0; i < seconds * 60; i++) stepBody(body, MAP, { ...idle, right: dir > 0, left: dir < 0 }, DT);
};

test('the ground follows the terrain line, slopes included', () => {
  assert.equal(groundAt(MAP, 100), 560);
  assert.equal(groundAt(MAP, 375), 520);
  assert.equal(groundAt(MAP, 600), 480);
  assert.equal(groundAt(MAP, 750), 490);
  assert.equal(groundAt(MAP, 1200), 480);
  // Walls split the ground into pieces you walk along.
  assert.equal(surfacesOf(MAP).filter((s) => s.ground).length, 4);
});

test('walking keeps your feet on slopes and small steps, and walls block you', () => {
  const b = createBody(100, 560);
  walk(b, 1, 3);
  // Up the slope and along the plateau, down the small step, then off the cliff to the bottom.
  assert.ok(b.onGround);
  for (let i = 0; i < 400; i++) {
    stepBody(b, MAP, { ...idle, right: true }, DT);
    if (b.onGround) assert.ok(Math.abs(b.y - groundAt(MAP, b.x)) < 0.5, `feet on the ground at x ${b.x.toFixed(0)}`);
  }
  // The 80px wall at x 1000 stops you.
  assert.ok(b.x < 1000 && b.x > 980, `stopped at the wall (${b.x.toFixed(0)})`);
  assert.equal(b.y, 560);
  // A jump clears it.
  stepBody(b, MAP, { ...idle, right: true, jump: true }, DT);
  walk(b, 1, 1.5);
  assert.ok(b.x > 1000 && b.y === 480, 'up on the cliff');
});

test('nothing ends up inside the ground', () => {
  const b = createBody(375, 300);
  for (let i = 0; i < 120; i++) stepBody(b, MAP, idle, DT);
  assert.ok(b.onGround);
  assert.ok(Math.abs(b.y - 520) < 0.5);
});

test('party members find their way up a cliff wall and onto a ledge', () => {
  const nav = navOf(MAP);
  const b = createBody(100, 560);
  const from = surfaceOf(nav, b);
  const to = nav.surfaces.findIndex((s) => !s.ground);
  const path = findPath(nav, from, b.x, to, 1210);
  assert.ok(path, 'there is a way');
  for (let i = 0; i < 60 * 30 && surfaceOf(nav, b) !== to; i++) {
    const { intent, lost } = followPath(nav, b, path, 1210);
    if (lost) path.splice(0, path.length, ...findPath(nav, surfaceOf(nav, b), b.x, to, 1210));
    stepBody(b, MAP, intent, DT);
  }
  assert.equal(surfaceOf(nav, b), to, 'made it onto the ledge');
});

test('monsters walk up and down slopes on their piece of ground', () => {
  const m = spawnMob(MAP, { mob: 'leafling', x: 350, y: groundAt(MAP, 350) });
  for (let i = 0; i < 60 * 20; i++) {
    updateMob(m, { x: 0, y: 0 }, DT, i * DT);
    assert.ok(Math.abs(m.y - groundAt(MAP, m.x)) < 0.5);
    assert.ok(m.x >= 0 && m.x <= 700, 'stays on its piece');
  }
});

test('loot lands on sloped ground', () => {
  const drops = [{ x: 400, y: 300, vy: -200, landed: false, age: 0 }];
  for (let i = 0; i < 120; i++) updateDrops(drops, MAP, DT);
  assert.ok(drops[0].landed);
  assert.ok(Math.abs(drops[0].y - groundAt(MAP, 400)) < 0.5);
});

test('on every field map, party members can travel between any two surfaces', async () => {
  const { MAPS } = await import('../src/data/maps.js');
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const map of Object.values(MAPS).filter((m) => !m.isTown && !m.dungeon)) {
    const surfaces = surfacesOf(map);
    const nav = navOf(map);
    for (let trial = 0; trial < 12; trial++) {
      const a = Math.floor(rnd() * surfaces.length);
      const b = Math.floor(rnd() * surfaces.length);
      const sa = surfaces[a];
      const sb = surfaces[b];
      const x0 = sa.x1 + 12 + rnd() * (sa.x2 - sa.x1 - 24);
      const tx = sb.x1 + 12 + rnd() * (sb.x2 - sb.x1 - 24);
      const body = createBody(x0, sa.yAt(x0));
      body.surface = sa;
      let path = findPath(nav, a, x0, b, tx);
      assert.ok(path, `${map.id}: a way from ${a} to ${b}`);
      let t = 0;
      for (; t < 60 * 40 && !(surfaceOf(nav, body) === b && Math.abs(body.x - tx) < 8); t++) {
        const { intent, lost } = followPath(nav, body, path, tx);
        if (lost && surfaceOf(nav, body) >= 0) path = findPath(nav, surfaceOf(nav, body), body.x, b, tx) ?? [];
        stepBody(body, map, intent, DT);
      }
      assert.ok(t < 60 * 40, `${map.id}: from (${Math.round(x0)}, ${sa.yAt(x0)}) to (${Math.round(tx)}, ${sb.yAt(tx)}), stuck at (${Math.round(body.x)}, ${Math.round(body.y)})`);
    }
  }
});
