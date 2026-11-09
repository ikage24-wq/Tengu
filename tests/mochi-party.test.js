// Mochi with friends, played as two games in one room (every message passed across by hand, as a
// copy, the way the network does): a party race (net/mochi-race.js) from invite to results, and the
// way into the Mochi Garden asking whose garden.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCharacter } from '../src/core/character.js';
import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { rollMochi, STATS } from '../src/data/mochi-genes.js';
import { newRecord } from '../src/data/mochi-raise.js';
import { prizeOf } from '../src/data/mochi-race.js';
import { online } from '../src/net/online.js';
import { handleTogether } from '../src/net/together.js';
import { inviteParty, answerInvite, startPartyRace } from '../src/net/mochi-race.js';

const keys = (pressed = []) => ({ held: new Set(), pressed: new Set(pressed) });
const mochi = (seed, points) => {
  const rec = newRecord(rollMochi(seed, { coat: null }));
  rec.personality = 'stoic';
  for (const st of STATS) Object.assign(rec.stats[st], { points, level: Math.max(1, Math.round(points / 16)) });
  return rec;
};
function player(name, rec) {
  const char = createCharacter(name, { hairStyle: 'bob' });
  char.garden = { back: null, mochi: rec ? [rec] : [], eggs: [], unlocked: {} };
  const w = createWorld(char);
  w.logs = [];
  w.log = (m) => w.logs.push(m);
  w.forceNight = 0;
  return w;
}
// The room: Ann (A) and Bea (B), in a party; `as(id, fn)` acts as one of them; `deliver()` hands
// every message sent to whoever it's for.
function room(worlds) {
  const out = [];
  const was = { ...online };
  Object.assign(online, {
    status: 'on', link: { send: (m) => out.push(m) },
    ghosts: new Map([['A', { id: 'A', name: 'Ann', garden: true }], ['B', { id: 'B', name: 'Bea', garden: true }]]),
    party: { leader: 'A', members: ['A', 'B'] }, raceInvite: null, raceWait: null,
  });
  const as = (id, fn) => {
    online.id = id;
    return fn(worlds[id]);
  };
  const deliver = () => {
    while (out.length) {
      const msg = JSON.parse(JSON.stringify(out.shift()));
      if (!worlds[msg.to]) continue;
      online.id = msg.to;
      handleTogether(worlds[msg.to], msg, online.ghosts.get(msg.id));
    }
  };
  return { as, deliver, done: () => Object.assign(online, was) };
}

test('a party race: invite, join with your own Mochi, race together, cheer, and each gets their own prize', () => {
  const recA = mochi(50, 900);
  const recB = mochi(51, 2400);
  const A = player('Ann', recA);
  const B = player('Bea', recB);
  loadMap(A, 'mochi_stadium', 'board');
  loadMap(B, 'sprout', 'start');
  const net = room({ A, B });
  try {
    assert.equal(net.as('A', (w) => inviteParty(w, recA, 'sprint', 'beginner')), null);
    net.deliver();
    assert.ok(online.raceInvite && B.events.some((e) => e.type === 'raceinvite'), 'Bea is invited');
    net.as('B', (w) => answerInvite(w, recB));
    net.deliver();
    assert.ok(A.raceLobby.joined.B, 'Bea is in');
    assert.ok(net.as('A', (w) => startPartyRace(w)));
    net.deliver();
    assert.equal(B.map.id, 'mrace_sprint', 'Bea is brought to the course');
    assert.equal(B.race.me, 1);
    assert.equal(A.race.racers[1].owner, 'B');
    const goldB = B.char.gold;
    // Race on: both games a frame at a time, Bea cheering now and then.
    for (let f = 0; f < 60 * 120 && !(A.race?.phase === 'done' && B.race?.phase === 'done'); f++) {
      net.as('A', (w) => updateWorld(w, 1 / 60, keys()));
      net.deliver();
      net.as('B', (w) => updateWorld(w, 1 / 60, keys(f % 30 === 0 ? ['ArrowUp'] : [])));
      net.deliver();
    }
    assert.equal(A.race.phase, 'done');
    assert.equal(B.race.phase, 'done');
    assert.ok(A.race.racers[1].cheers > 3, `Bea's cheers reached Ann's game: ${A.race.racers[1].cheers}`);
    // The same race on both screens: the same places, and Bea's Mochi where Ann's game has it.
    assert.deepEqual(B.race.racers.map((r) => r.place), A.race.racers.map((r) => r.place));
    assert.ok(Math.abs(B.race.racers[1].x - A.race.racers[1].x) < 30);
    // Bea's own Mochi got her own prize and medal.
    const place = B.race.racers[1].place;
    assert.equal(B.char.gold - goldB, prizeOf('sprint', 'beginner', place));
    if (place <= 3) assert.ok(recB.medals?.['sprint|beginner']);
    // Up after the results: Bea goes back where she was.
    for (let f = 0; f < 60 * 3.2; f++) net.as('B', (w) => updateWorld(w, 1 / 60, keys()));
    net.as('B', (w) => updateWorld(w, 1 / 60, keys(['ArrowUp'])));
    assert.equal(B.race, null);
    assert.equal(B.map.id, 'sprout');
  } finally {
    net.done();
  }
});

test('the way into the Mochi Garden asks whose garden when a friend online has one', () => {
  const A = player('Ann', mochi(52, 300));
  loadMap(A, 'sprout', 'start');
  const gate = A.map.portals.find((p) => p.to === 'garden');
  const net = room({ A });
  try {
    Object.assign(A.body, { x: gate.x, y: gate.y });
    net.as('A', (w) => updateWorld(w, 1 / 60, keys(['ArrowUp'])));
    assert.equal(A.map.id, 'sprout', 'it asks first');
    assert.ok(A.events.some((e) => e.type === 'gardenpick'));
  } finally {
    net.done();
  }
  // With no one online, straight in.
  const C = player('Cid', mochi(53, 300));
  loadMap(C, 'sprout', 'start');
  Object.assign(C.body, { x: gate.x, y: gate.y });
  updateWorld(C, 1 / 60, keys(['ArrowUp']));
  assert.equal(C.map.id, 'garden');
});
