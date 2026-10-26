// Animation timing: a monster's impact frame is on screen the instant its blow lands (the strike
// plays at the end of the wind-up), attack frames are timed unevenly (a held impact), and the
// hair and cape springs behave the same at any frame rate.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { framesOf, attackTiming, attackFrame } from '../src/render/monsters.js';
import { springStep, walkBob } from '../src/render/animator.js';
import { MOBS } from '../src/data/mobs.js';

const arts = [...new Set(Object.values(MOBS).map((m) => m.art))].filter((a) => framesOf(a).attack);

test('every attacking monster has one timing per frame after its wind-up', () => {
  assert.ok(arts.length > 30);
  for (const art of arts) {
    const ms = attackTiming(art);
    assert.equal(ms.length, framesOf(art).attack - 1, art);
    assert.ok(ms.every((v) => v >= 30 && v <= 1000), art);
    // Pose to pose, not even: the strike is quick, the impact (or its settle) held well past it.
    assert.ok(Math.max(...ms.slice(1)) >= ms[0] * 2.5, `${art} holds its impact`);
  }
});

test('the impact frame shows the moment the blow lands', () => {
  for (const art of arts) {
    const ms = attackTiming(art);
    // Winding up: the wind-up pose, then the strike in its last moments.
    assert.equal(attackFrame(ms, 0.3, -1, false), 0, art);
    assert.equal(attackFrame(ms, (ms[0] - 10) / 1000, -1, false), 1, art);
    // The blow lands (since = 0) on the impact frame and it holds there.
    assert.equal(attackFrame(ms, 0, 0, true), 2, art);
    assert.equal(attackFrame(ms, 0, (ms[1] - 10) / 1000, true), 2, art);
    // Then the follow-through plays out and the attack ends.
    const rest = ms.slice(1).reduce((a, b) => a + b, 0) / 1000;
    assert.equal(attackFrame(ms, 0, rest - 0.005, true), ms.length, art);
    assert.equal(attackFrame(ms, 0, rest + 0.005, true), -1, art);
    // A touch attack with no wind-up flicks through the strike first.
    assert.equal(attackFrame(ms, 0, 0, false), 1, art);
    assert.equal(attackFrame(ms, 0, (ms[0] + 5) / 1000, false), 2, art);
  }
});

test('springs land in the same place at 30, 60 and 144 fps, and never blow up', () => {
  const run = (hz, secs) => {
    let [x, v] = [0, 0];
    for (let i = 0; i < Math.round(hz * secs); i++) [x, v] = springStep(x, v, 3, 140, 11, 1 / hz);
    return x;
  };
  for (const secs of [1 / 6, 1 / 3, 0.5]) {
    const a = run(30, secs);
    assert.ok(Math.abs(a - run(60, secs)) < 1e-6 && Math.abs(a - run(144, secs)) < 1e-6, `${secs}s`);
  }
  // A long hitch (a tenth of a second at a time) still settles on the target.
  let [x, v] = [5, 40];
  for (let i = 0; i < 30; i++) [x, v] = springStep(x, v, 0, 140, 11, 0.1);
  assert.ok(Math.abs(x) < 1e-3 && Math.abs(v) < 1e-2);
});

test('the walk bob bottoms out just after each foot lands and peaks at the pass', () => {
  assert.ok(walkBob(0.04) < 0.01 && walkBob(0.54) < 0.01);
  assert.ok(walkBob(0.29) > 0.99 && walkBob(0.79) > 0.99);
});
