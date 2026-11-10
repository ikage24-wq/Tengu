// Mochi racing (world/mochi-race.js): through the Garden's stadium gate to the Race Stadium, Up at
// the board, a race run with real key presses (Up cheers), the results and the prize, and back.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCharacter } from '../src/core/character.js';
import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { MAPS } from '../src/data/maps.js';
import { rollMochi, STATS } from '../src/data/mochi-genes.js';
import { newRecord } from '../src/data/mochi-raise.js';
import { startRace, rivalsFor, raceHour, PODIUM, podiumSpot } from '../src/world/mochi-race.js';
import { groundAt, waterAt } from '../src/world/physics.js';

const keys = (pressed = []) => ({ held: new Set(), pressed: new Set(pressed) });
const mochi = (seed, points, personality = 'stoic') => {
  const rec = newRecord(rollMochi(seed, { coat: null }));
  rec.personality = personality;
  for (const st of STATS) Object.assign(rec.stats[st], { points, level: Math.max(1, Math.round(points / 16)) });
  return rec;
};
// (Every stage's Beginner race won already, so every stage is open.)
function racer(...recs) {
  const char = createCharacter('Mina', { hairStyle: 'bob' });
  char.garden = { back: null, mochi: recs, eggs: [], unlocked: {} };
  char.raceWins = Object.fromEntries(['sprint', 'swim', 'climb', 'glide', 'hills'].map((s) => [s + '|beginner', true]));
  const w = createWorld(char);
  w.log = () => {};
  loadMap(w, 'mochi_stadium', 'board');
  return w;
}
// Runs the race to its end (cheering on every frame if asked); returns the race.
function run(w, cheering = false) {
  const R = w.race;
  for (let k = 0; k < 60 * 200 && R.phase !== 'done'; k++) updateWorld(w, 1 / 60, keys(cheering ? ['ArrowUp'] : []));
  return R;
}

test('the stadium gate at the top of the garden leads to the Race Stadium; Up at its board opens it', () => {
  assert.ok(MAPS.garden.portals.some((p) => p.to === 'mochi_stadium'));
  const w = racer(mochi(1, 300));
  assert.equal(w.map.id, 'mochi_stadium');
  Object.assign(w.body, { x: w.map.raceBoard });
  updateWorld(w, 1 / 60, keys(['ArrowUp']));
  assert.ok(w.events.some((e) => e.type === 'race'));
});

test('a race: the countdown, everyone home or out of time, six places, a prize for a top finish', () => {
  const rec = mochi(2, 2400);
  const w = racer(rec);
  const gold = w.char.gold;
  assert.ok(startRace(w, rec, 'sprint'));
  assert.equal(w.map.id, 'mrace_sprint');
  assert.equal(w.race.phase, 'ready');
  // The opening plays (the camera sweeps the course, each racer's card); Up skips it to the countdown.
  for (let k = 0; k < 60; k++) updateWorld(w, 1 / 60, keys());
  assert.equal(w.race.shot, 'sweep');
  updateWorld(w, 1 / 60, keys(['ArrowUp']));
  for (let k = 0; k < 60 * 3.1; k++) updateWorld(w, 1 / 60, keys());
  assert.equal(w.race.phase, 'run');
  const R = run(w);
  assert.equal(R.phase, 'done');
  assert.deepEqual(R.results.map((r) => r.place), [1, 2, 3, 4, 5, 6]);
  assert.equal(R.racers[0].place, 1, 'a strong Mochi wins a Beginner race');
  assert.equal(w.char.gold, gold + 500);
  assert.ok(rec.mood > 60, 'a win cheers it up');
  // The podium: the top three up on their blocks (the winner on the tallest), cheering.
  // (Up straight away doesn't skip it; a moment in, it does, to the results.)
  updateWorld(w, 1 / 60, keys(['ArrowUp']));
  assert.ok(w.race && w.race.t < PODIUM.secs);
  for (let k = 0; k < 60 * 3; k++) updateWorld(w, 1 / 60, keys());
  const win = R.results[0];
  assert.equal(win.x, podiumSpot(w.map.race, 1).x);
  assert.ok(Math.abs(win.y - (groundAt(w.map, win.x) - podiumSpot(w.map.race, 1).h)) < 0.01, 'on the top block');
  assert.equal(w.race.shot, 'podium');
  updateWorld(w, 1 / 60, keys(['ArrowUp']));
  assert.ok(w.race.t >= PODIUM.secs, 'on to the results');
  // Up takes you back to the stadium (not straight away: the results stay up a moment).
  updateWorld(w, 1 / 60, keys(['ArrowUp']));
  assert.ok(w.race);
  for (let k = 0; k < 60 * 1.1; k++) updateWorld(w, 1 / 60, keys());
  updateWorld(w, 1 / 60, keys(['ArrowUp']));
  assert.equal(w.race, null);
  assert.equal(w.map.id, 'mochi_stadium');
});

test('a newborn who can only scoot comes last', () => {
  const rec = mochi(3, 0, 'sleepy');
  const w = racer(rec);
  startRace(w, rec, 'sprint');
  const R = run(w);
  assert.equal(R.racers[0].place, 6);
});

test('cheering speeds it up (every couple of seconds, not every frame), and costs it stamina', () => {
  const times = [];
  for (const cheering of [false, true]) {
    const rec = mochi(4, 900);
    rec.stats.stamina.points = 2400;
    const w = racer(rec);
    startRace(w, rec, 'sprint');
    const R = run(w, cheering);
    times.push(R.racers[0].done);
    if (cheering) assert.ok(R.racers[0].cheers > 3 && R.racers[0].cheers < R.racers[0].done / 2, `${R.racers[0].cheers} cheers`);
  }
  assert.ok(times[1] < times[0] - 1, `cheered ${times[1].toFixed(1)}s vs ${times[0].toFixed(1)}s`);
  // A Mochi with little stamina tires sooner when cheered all the way.
  const rec = mochi(5, 900);
  rec.stats.stamina.points = 0;
  const w = racer(rec);
  startRace(w, rec, 'sprint');
  for (let k = 0; k < 60 * 6; k++) updateWorld(w, 1 / 60, keys(['ArrowUp']));
  assert.ok(w.race.racers[0].m.tired > 0.5 || w.race.racers[0].m.rest);
});

test('the rivals are the same for everyone in the same hour, and new the next', () => {
  const h = raceHour();
  const a = rivalsFor('sprint', 'beginner', h).map((r) => r.name + r.rec.seed);
  const b = rivalsFor('sprint', 'beginner', h).map((r) => r.name + r.rec.seed);
  const c = rivalsFor('sprint', 'beginner', h + 1).map((r) => r.name + r.rec.seed);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
});

test('a course without a race (say, from a save) puts you at the stadium', () => {
  const w = racer(mochi(6, 300));
  loadMap(w, 'mrace_sprint', 'start');
  assert.equal(w.map.id, 'mochi_stadium');
});

test('every stage runs to the end; each one is won by the Mochi strong in what it tests', () => {
  const STAT = { swim: 'swim', climb: 'power', glide: 'fly', hills: 'stamina' };
  const time = (rec, stage) => {
    const w = racer(rec);
    assert.ok(startRace(w, rec, stage), stage);
    const R = run(w);
    assert.deepEqual(R.results.map((r) => r.place), [1, 2, 3, 4, 5, 6], stage);
    return R.racers[0].done;
  };
  for (const [stage, stat] of Object.entries(STAT)) {
    const spec = mochi(20, 300);
    spec.stats[stat].points = 1600;
    const runner = mochi(20, 300);
    runner.stats.run.points = 1600;
    const [a, b] = [time(spec, stage), time(runner, stage)];
    assert.ok(a < b, `${stage}: the ${stat} Mochi ${a.toFixed(0)}s, the runner ${b.toFixed(0)}s`);
  }
  assert.ok(time(mochi(21, 900), 'grand') > 0);
});

test('swimming, climbing and gliding: the racer moves the way the leg does', () => {
  const rec = mochi(22, 900);
  const w = racer(rec);
  startRace(w, rec, 'grand');
  const seen = new Set();
  for (let k = 0; k < 60 * 120 && w.race.phase !== 'done'; k++) {
    updateWorld(w, 1 / 60, keys());
    seen.add(w.race.racers[0].m.mode);
    if (w.race.racers[0].m.mode === 'swim') assert.ok(w.race.racers[0].m.inWater);
  }
  assert.deepEqual([...seen].sort(), ['climb', 'fly', 'run', 'swim']);
});

test('ranks: a win opens the next rank; the Grand course after three Beginner wins; medals and prizes by rank', async () => {
  const { rankOpen, prizeOf } = await import('../src/data/mochi-race.js');
  const rec = mochi(30, 2400);
  const w = racer(rec);
  w.char.raceWins = {};
  assert.ok(rankOpen(w.char, 'sprint', 'beginner'));
  assert.ok(!rankOpen(w.char, 'sprint', 'challenge'));
  assert.ok(!rankOpen(w.char, 'grand', 'beginner'));
  assert.equal(startRace(w, rec, 'sprint', 'challenge'), false, 'not open yet');
  // Win the Sprint, Swim and Climb Beginner races: their Challenge opens, and so does the Grand course.
  for (const stage of ['sprint', 'swim', 'climb']) {
    assert.ok(startRace(w, rec, stage));
    const R = run(w);
    assert.equal(R.racers[0].place, 1, stage);
    assert.equal(R.medal.medal, 'gold');
    for (let k = 0; k < 60 * 6.2; k++) updateWorld(w, 1 / 60, keys());
    updateWorld(w, 1 / 60, keys(['ArrowUp']));
  }
  assert.equal(rec.medals['sprint|beginner'], 'gold');
  assert.ok(rankOpen(w.char, 'sprint', 'challenge'));
  assert.ok(!rankOpen(w.char, 'sprint', 'master'));
  assert.ok(rankOpen(w.char, 'grand', 'beginner'));
  // Prizes grow by rank; the Grand course pays half again.
  assert.ok(prizeOf('sprint', 'master', 1) > prizeOf('sprint', 'challenge', 1));
  assert.ok(prizeOf('sprint', 'challenge', 1) > prizeOf('sprint', 'beginner', 1));
  assert.equal(prizeOf('grand', 'beginner', 1), 750);
  // A worse finish later doesn't take its gold away.
  const slow = mochi(31, 0);
  slow.medals = { 'sprint|beginner': 'gold' };
  const w2 = racer(slow);
  startRace(w2, slow, 'sprint');
  run(w2);
  assert.equal(slow.medals['sprint|beginner'], 'gold');
});

test('rivals get stronger rank by rank', () => {
  const avg = (rank) => {
    const rs = rivalsFor('sprint', rank, raceHour());
    return rs.reduce((s, r) => s + r.rec.stats.run.points, 0) / rs.length;
  };
  assert.ok(avg('beginner') < avg('challenge') && avg('challenge') < avg('master'));
});

test('the first Master win on a stage brings a Star Egg (only the first)', async () => {
  const { countItem } = await import('../src/core/inventory.js');
  const rec = mochi(40, 2600);
  const w = racer(rec);
  w.char.raceWins = { 'sprint|beginner': true, 'sprint|challenge': true };
  for (const k of [1, 2]) {
    assert.ok(startRace(w, rec, 'sprint', 'master'));
    const R = run(w);
    assert.equal(R.racers[0].place, 1);
    assert.equal(Boolean(R.starEgg), k === 1);
    for (let f = 0; f < 60 * 6.2; f++) updateWorld(w, 1 / 60, keys());
    updateWorld(w, 1 / 60, keys(['ArrowUp']));
  }
  assert.equal(countItem(w.char.inventory, 'mochi_egg_star'), 1);
});

test('dress-up: the Daifuku hood from the start; each other costume with a first Beginner win on its stage', async () => {
  const { DRESS, dressOpen } = await import('../src/data/mochi-dress.js');
  const { lookOf } = await import('../src/render/wagashi.js');
  const rec = mochi(60, 2400);
  const w = racer(rec);
  w.char.raceWins = {};
  assert.ok(dressOpen(w.char, 'daifuku'));
  assert.ok(!dressOpen(w.char, 'dango'));
  for (const k of [1, 2]) {
    assert.ok(startRace(w, rec, 'sprint'));
    const R = run(w);
    assert.equal(R.racers[0].place, 1);
    assert.equal(R.dressWon ?? null, k === 1 ? DRESS.dango.name : null, 'only the first win');
    for (let f = 0; f < 60 * 6.2; f++) updateWorld(w, 1 / 60, keys());
    updateWorld(w, 1 / 60, keys(['ArrowUp']));
  }
  assert.ok(dressOpen(w.char, 'dango'));
  // Worn, it's the Mochi's outfit.
  assert.equal(lookOf(rec).outfit, 'mochismock');
  rec.dress = 'dango';
  assert.equal(lookOf(rec).outfit, DRESS.dango.outfit);
  // Every costume is won on a real stage.
  for (const d of Object.values(DRESS)) assert.ok(d.free || ['sprint', 'swim', 'climb', 'glide', 'hills'].includes(d.stage));
});

test('every racer, every frame, on every course: on the ground, in the water, on its wall or gliding over the ground, never on air', () => {
  for (const stage of ['sprint', 'swim', 'climb', 'glide', 'hills', 'grand']) {
    for (const pts of [0, 700, 2400]) {
      const rec = mochi(40 + pts, pts);
      const w = racer(rec);
      assert.ok(startRace(w, rec, stage, 'beginner'));
      const R = w.race;
      const course = w.map.race;
      for (let k = 0; k < 60 * 200 && R.phase !== 'done'; k++) {
        updateWorld(w, 1 / 60, keys());
        for (const r of R.racers) {
          const where = `${stage} (${pts}): ${r.name} at ${r.x.toFixed(1)},${r.y.toFixed(1)} ${r.m.mode}`;
          // (Smoothly: never a jump from one frame to the next.)
          if (r.lastAt) assert.ok(Math.abs(r.x - r.lastAt[0]) < 8 && Math.abs(r.y - r.lastAt[1]) < 8, `${where}: jumped from ${r.lastAt.map((v) => v.toFixed(1))}`);
          r.lastAt = [r.x, r.y];
          const leg = course.legs[r.leg];
          const ground = groundAt(w.map, r.x);
          if (r.m.mode === 'swim') assert.ok(waterAt(w.map, r.x) === r.y, `${where}: swimming at the surface`);
          else if (r.m.mode === 'climb') assert.ok(leg.kind === 'climb' && r.x > leg.x - 48 && r.x < leg.x && r.y <= leg.from && r.y >= leg.to, `${where}: on its wall`);
          else if (r.m.mode === 'fly') assert.ok(r.y <= ground + 0.01, `${where}: above the ground`);
          else if (leg.kind === 'climb') assert.ok(r.x > leg.x - 48 && (r.y === leg.to || Math.abs(r.y - ground) < 0.01), `${where}: at the foot of its wall or over the top`);
          else assert.ok(Math.abs(r.y - ground) < 0.01, `${where}: on the ground`);
        }
      }
      assert.equal(R.phase, 'done', `${stage} ends`);
    }
  }
});

test('a race has its own music: the race, the final-lap mix from the final stretch, the win jingle at the end', async () => {
  const { songFor } = await import('../src/audio/listen.js');
  const { trackFor } = await import('../src/audio/tracks.js');
  const rec = mochi(3, 2400);
  const w = racer(rec);
  assert.ok(startRace(w, rec, 'sprint'));
  assert.equal(songFor(w.map, w), 'race');
  w.race.finalAt = 1;
  assert.equal(songFor(w.map, w), 'raceclimax');
  run(w);
  assert.equal(songFor(w.map, w), 'racewin');
  for (const k of ['race', 'raceclimax', 'racewin']) assert.ok(trackFor(k)?.file.endsWith('.mp3'), k);
});
