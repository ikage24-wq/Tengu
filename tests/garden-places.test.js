// The places your Mochi go to use in the garden (world/garden-life.js PLACES): the turns come by
// the clock and the Mochi's seed, so a visitor sees the same; by day the tree, the fruit trees and
// (a swimmer only) the pond's bank, after dark the lantern; and a place's move is a real one.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rollMochi } from '../src/data/mochi-genes.js';
import { newRecord } from '../src/data/mochi-raise.js';
import { placeTime } from '../src/world/garden-life.js';
import { ACTIONS, IDLE_BITS } from '../src/render/mochi-anim.js';

const rec = (seed, swim) => {
  const r = newRecord(rollMochi(seed, { coat: null }));
  r.stats.swim.points = swim;
  return r;
};
const turns = (r, night) => {
  const out = [];
  for (let h = 0; h < 300; h++) for (let s = 0; s < 60; s += 2) {
    const pl = placeTime(r, 1.8e9 + h * 60 + s, night);
    if (pl) out.push(pl);
  }
  return out;
};

test('the same Mochi at the same time is at the same place', () => {
  const a = rec(31, 0);
  for (let s = 0; s < 60 * 120; s += 7) assert.equal(placeTime(a, 1.8e9 + s, false), placeTime({ ...a }, 1.8e9 + s, false));
});

test('by day the tree and the fruit trees, a swimmer the bank too; after dark only the lantern', () => {
  const land = turns(rec(32, 0), false);
  const swim = turns(rec(32, 5000), false);
  const night = turns(rec(32, 0), true);
  assert.ok(land.length > 0 && night.length > 0);
  assert.ok(land.every((pl) => pl.act !== 'paddle'), 'only swimmers kick their feet on the bank');
  assert.ok(swim.some((pl) => pl.act === 'paddle'));
  assert.ok(night.every((pl) => pl.act === 'meditate'));
  for (const pl of [...land, ...swim, ...night]) assert.ok(ACTIONS[pl.act] ?? IDLE_BITS[pl.act], pl.act);
});
