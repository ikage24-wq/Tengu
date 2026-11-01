import test from 'node:test';
import assert from 'node:assert/strict';
import { createBody, stepBody, surfacesOf, driftOffset } from '../src/world/physics.js';
import { MAPS } from '../src/data/maps.js';

const DT = 1 / 60;
const NONE = { left: false, right: false, up: false, down: false, jump: false };
const run = (body, map, intent, secs, opts = { rider: true }) => {
  for (let i = 0; i < secs * 60; i++) {
    map.clock = (map.clock ?? 0) + DT;
    stepBody(body, map, intent, DT, opts);
  }
};
const fresh = () => ({ ...MAPS.meadow1, clock: 0, springs: MAPS.meadow1.springs.map((s) => ({ ...s })) });

test('a bounce blossom throws you up onto the floor above', () => {
  const map = fresh();
  const sp = map.springs[1];
  const body = createBody(sp.x, sp.y);
  run(body, map, NONE, 2);
  assert.ok(body.onGround && body.y < sp.y - 100, `landed two floors up (at ${body.y})`);
  assert.ok(sp.firedAt != null, 'the blossom knows it fired, to play its bounce');
});

test('summons and monsters walk over a bounce blossom without being thrown', () => {
  const map = fresh();
  const sp = map.springs[0];
  const body = createBody(sp.x, sp.y);
  run(body, map, NONE, 1, {});
  assert.equal(body.y, sp.y);
});

test('Up in an updraft floats you to its top, and you hang there a while, then come down', () => {
  const map = fresh();
  const u = map.updrafts[0];
  const body = createBody(u.x, u.bottom);
  run(body, map, NONE, 0.5);
  assert.equal(body.y, u.bottom, 'standing in it does nothing until you press Up');
  run(body, map, { ...NONE, up: true }, 0.1);
  run(body, map, NONE, 1.6);
  assert.ok(Math.abs(body.y - u.top) < 20, `near the top (at ${body.y})`);
  run(body, map, NONE, 4);
  assert.ok(body.onGround, 'let down after hanging a few seconds');
});

test('a drifting cloud glides back and forth and carries you with it', () => {
  const map = fresh();
  const p = map.platforms.find((q) => q.drift);
  const s = surfacesOf(map).find((q) => q.drift === p);
  map.clock = 0;
  assert.equal(s.x1, p.x);
  map.clock = p.drift.period / 2;
  assert.equal(Math.round(s.x1), p.x + p.drift.dx, 'out at half a period');
  map.clock = 0;
  const body = createBody(p.x + 40, p.y);
  run(body, map, NONE, 0.3);
  const start = body.x;
  run(body, map, NONE, p.drift.period / 2 - 0.3);
  assert.ok(body.onGround && body.surface?.drift === p, 'still standing on it');
  assert.ok(Math.abs(body.x - start - (driftOffset(p, map.clock) - driftOffset(p, 0.3))) < 2, 'moved along with it');
});
