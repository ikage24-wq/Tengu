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
      // (Cheering only while hers is still running: once it's home, Up skips to the results.)
      const running = B.race?.racers?.[B.race.me]?.done == null;
      net.as('B', (w) => updateWorld(w, 1 / 60, keys(running && f % 30 === 0 ? ['ArrowUp'] : [])));
      net.deliver();
    }
    assert.equal(A.race.phase, 'done');
    assert.equal(B.race.phase, 'done');
    assert.ok(A.race.racers[1].cheers > 3, `Bea's cheers reached Ann's game: ${A.race.racers[1].cheers}`);
    // The same race on both screens: Bea's Mochi in the place Ann's game gave it, and where Ann's
    // game has it. (Her screen ends a few seconds after hers is home, so the ones still running then
    // are ranked by how far along they were.)
    assert.equal(B.race.racers[1].place, A.race.racers[1].place);
    assert.deepEqual([...B.race.racers.map((r) => r.place)].sort(), [...A.race.racers.map((r) => r.place)].sort());
    assert.ok(Math.abs(B.race.racers[1].done - A.race.racers[1].done) < 0.3, 'home at the same time on both screens');
    // Bea's own Mochi got her own prize and medal.
    const place = B.race.racers[1].place;
    // (Less today's race goal, if racing was one of them: world/garden-life.js noteDaily.)
    const goal = B.char.garden.daily?.goals.some((x) => x.kind === 'race') ? 300 : 0;
    assert.equal(B.char.gold - goldB - goal, prizeOf('sprint', 'beginner', place));
    if (place <= 3) assert.ok(recB.medals?.['sprint|beginner']);
    // Up after the results: Bea goes back where she was.
    for (let f = 0; f < 60 * 6.2; f++) net.as('B', (w) => updateWorld(w, 1 / 60, keys()));
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

test('a party race on the Grand Tour: a friend picks their way at the river fork, and luck shows on both screens', () => {
  const recA = mochi(60, 1800);
  const recB = mochi(61, 1800);
  const A = player('Ann', recA);
  const B = player('Bea', recB);
  A.char.raceWins = Object.fromEntries(['sprint', 'swim', 'climb', 'glide', 'hills', 'grand'].map((s) => [`${s}|beginner`, true]));
  loadMap(A, 'mochi_stadium', 'board');
  loadMap(B, 'sprout', 'start');
  const net = room({ A, B });
  try {
    net.as('A', (w) => inviteParty(w, recA, 'tour', 'beginner'));
    net.deliver();
    net.as('B', (w) => answerInvite(w, recB));
    net.deliver();
    net.as('A', (w) => startPartyRace(w));
    net.deliver();
    assert.equal(B.map.id, 'mrace_tour');
    const forkLeg = A.map.race.legs.findIndex((l) => l.alt);
    const before = Boolean(A.race.racers[1].alt?.[forkLeg]);
    let flipped = false;
    let luckSeen = false;
    for (let f = 0; f < 60 * 200 && !(A.race?.phase === 'done' && B.race?.phase === 'done'); f++) {
      net.as('A', (w) => updateWorld(w, 1 / 60, keys()));
      net.deliver();
      const you = B.race?.racers[1];
      // (Near the fork, Bea presses Down once.)
      const press = !flipped && you && B.race.phase === 'run' && you.x > 1500 && you.x < 2080;
      if (press) flipped = true;
      net.as('B', (w) => updateWorld(w, 1 / 60, keys(press ? ['ArrowDown'] : [])));
      net.deliver();
      if (B.race?.racers.some((r) => r.luckKind)) luckSeen = true;
    }
    assert.ok(flipped, 'Bea reached the fork');
    assert.equal(Boolean(A.race.racers[1].alt?.[forkLeg]), !before, "Bea's choice reached Ann's game");
    const hostLuck = A.race.racers.some((r) => r.luckKind);
    if (hostLuck) assert.ok(luckSeen, "a trip or tailwind on Ann's screen showed on Bea's");
  } finally {
    net.done();
  }
});

test("ghost races: your best run is kept; a friend in your room gets it and races your ghost, which runs just as you did", async () => {
  const { startRace, leaveRace } = await import('../src/world/mochi-race.js');
  const { askGhost } = await import('../src/net/mochi-race.js');
  const recA = mochi(70, 1200);
  const recB = mochi(71, 1200);
  const A = player('Ann', recA);
  const B = player('Bea', recB);
  loadMap(A, 'mochi_stadium', 'board');
  loadMap(B, 'mochi_stadium', 'board');
  const net = room({ A, B });
  try {
    // Ann races: her time, and her run, are kept as her best.
    net.as('A', (w) => startRace(w, recA, 'sprint', 'beginner'));
    for (let f = 0; f < 60 * 120 && A.race.phase !== 'done'; f++) net.as('A', (w) => updateWorld(w, 1 / 60, keys()));
    const best = A.char.raceBests?.['sprint|beginner'];
    assert.ok(best && best.track.length > 20, 'her best run is kept');
    assert.equal(best.time, Math.round(A.race.racers[0].done * 100) / 100);
    // Bea asks for it: Ann's game sends it, Bea keeps it.
    assert.ok(net.as('B', (w) => askGhost(w, 'A', 'sprint|beginner')));
    net.deliver();
    const kept = B.char.ghosts?.['Ann|sprint|beginner'];
    assert.ok(kept, 'Bea has Ann\'s ghost');
    // Bea races it: Ann's Mochi, see-through, home at Ann's time.
    net.as('B', (w) => startRace(w, recB, 'sprint', 'beginner', { ghost: kept }));
    const g = B.race.racers.find((r) => r.ghost);
    assert.ok(g && /Ann's ghost/.test(g.name));
    for (let f = 0; f < 60 * 120 && B.race.phase !== 'done'; f++) net.as('B', (w) => updateWorld(w, 1 / 60, keys()));
    assert.ok(g.done != null && Math.abs(g.done - best.time) < 1, `the ghost came home at ${g.done?.toFixed(1)}s, Ann's ${best.time}s`);
    void leaveRace;
  } finally {
    net.done();
  }
});
