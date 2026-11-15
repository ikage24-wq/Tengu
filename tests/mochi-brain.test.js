// A Mochi's own mind (world/mochi-brain.js): its needs and its personality decide what it does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { choose, wantOf, needsOf, drainNeeds, satisfy } from '../src/world/mochi-brain.js';

const OPTS = [
  { id: 'rest', kind: 'rest', x: 500, gains: { energy: 25 } },
  { id: 'slide', kind: 'ride', x: 500, gains: { fun: 50 } },
  { id: 'sniff', kind: 'explore', x: 500, gains: { curious: 30 } },
  { id: 'friend', kind: 'social', x: 500, gains: { social: 45 } },
];
const mochi = (personality, needs) => ({ seed: 42, personality, stats: {}, needs: { energy: 80, fun: 80, social: 80, curious: 80, hunger: 80, ...needs } });

test('what it does comes from what it needs most', () => {
  assert.equal(choose(mochi('gentle', { energy: 10 }), OPTS, 500, []).id, 'rest');
  assert.equal(choose(mochi('gentle', { fun: 5 }), OPTS, 500, []).id, 'slide');
  assert.equal(choose(mochi('gentle', { social: 5 }), OPTS, 500, []).id, 'friend');
  assert.equal(choose(mochi('gentle', { curious: 5 }), OPTS, 500, []).id, 'sniff');
});

test('its personality leans it: a sleepy one rests, a playful one plays, a shy one keeps to itself', () => {
  const tired = { energy: 45, fun: 45, social: 45, curious: 45 };
  assert.equal(choose(mochi('sleepy', tired), OPTS, 500, []).id, 'rest');
  assert.equal(choose(mochi('playful', tired), OPTS, 500, []).id, 'slide');
  assert.notEqual(choose(mochi('shy', { social: 40, curious: 40 }), OPTS, 500, []).id, 'friend');
  assert.equal(choose(mochi('bossy', { social: 40, curious: 40 }), OPTS, 500, []).id, 'friend');
});

test('it does not do the same thing over and over, and further off is less tempting', () => {
  const m = mochi('gentle', { fun: 30, curious: 35 });
  const first = choose(m, OPTS, 500, []).id;
  assert.notEqual(choose(m, OPTS, 500, [first, first, first]).id, first, 'a change after doing it again and again');
  const near = { id: 'a', kind: 'ride', x: 520, gains: { fun: 50 } };
  const far = { id: 'b', kind: 'ride', x: 2400, gains: { fun: 50 } };
  assert.ok(wantOf(m, near, 500, []) > wantOf(m, far, 500, []));
});

test('needs run down with time and come back up with what meets them, between 0 and 100', () => {
  const m = { seed: 1 };
  const n = needsOf(m);
  const fun = n.fun;
  drainNeeds(m, 60);
  assert.ok(m.needs.fun < fun);
  drainNeeds(m, 1e5);
  assert.equal(m.needs.fun, 0);
  satisfy(m, { fun: 1000 });
  assert.equal(m.needs.fun, 100);
});

test('friends: playing together brings two closer, a best friend is sought out, a rival kept away from', async () => {
  const { befriend, bestFriend, isRival } = await import('../src/world/mochi-brain.js');
  const a = mochi('gentle', {});
  const b = { ...mochi('playful', {}), seed: 7 };
  const c = { ...mochi('grumpy', {}), seed: 9 };
  for (let i = 0; i < 9; i++) befriend(a, b, 4);
  befriend(a, c, -20);
  assert.equal(a.friends[7], 36);
  assert.equal(b.friends[42], 36, 'both ways');
  assert.equal(bestFriend(a, [{ rec: b }, { rec: c }])?.rec, b);
  assert.ok(isRival(a, c) && !isRival(a, b));
});

test('it learns what it likes: needed and done, it comes to love it, and is keener on it after', async () => {
  const { learn, enjoyment, favourite } = await import('../src/world/mochi-brain.js');
  const m = mochi('gentle', { fun: 10 });
  const swim = { id: 'swim', kind: 'play', like: 'swim', x: 500, gains: { fun: 45 } };
  const before = wantOf(m, swim, 500, []);
  for (let i = 0; i < 40; i++) learn(m, 'swim', enjoyment(m, swim.gains));
  assert.ok(m.likes.swim > 0.4, `likes swimming (${m.likes.swim})`);
  assert.equal(favourite(m), 'swim');
  assert.ok(wantOf(m, swim, 500, []) > before * 1.2);
  // (Done when it didn't need it at all, it goes off it a little.)
  const full = mochi('gentle', { fun: 100 });
  learn(full, 'swim', enjoyment(full, swim.gains));
  assert.ok(full.likes.swim < 0);
});
