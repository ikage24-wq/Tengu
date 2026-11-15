// Mochi Sumo (world/mochi-sumo.js, data/mochi-sumo.js): Up by the sumo hall on the Mochi Market's
// lane, a tournament played through with real key presses - three bouts, each from coming on to the
// bow, the start pressed at "Hakkeyoi!", the loser over the bales and onto the floor - the prize, the
// champion's cup and the next ring opening, and back out to the hall's door. And the moves: a
// finishing move for each range of Power, each wrestler's moves leading smoothly into the next.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCharacter } from '../src/core/character.js';
import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { rollMochi, STATS } from '../src/data/mochi-genes.js';
import { newRecord, STYLE_POINTS } from '../src/data/mochi-raise.js';
import { startSumo, sumoHallUp, RING, STEP } from '../src/world/mochi-sumo.js';
import { sumoOpen, sumoStrength, boutOf, pushAt, startOf, sumoRivals, sumoPrize, KIMARITE, DUCK, BOUTS } from '../src/data/mochi-sumo.js';
import { sumoCupOf } from '../src/world/garden.js';
import { MARKET } from '../src/world/market.js';

const keys = (pressed = []) => ({ held: new Set(), pressed: new Set(pressed) });
const mochi = (seed, { stage = 'amamochi', personality = 'brave', points = 600 } = {}) => {
  const rec = newRecord(rollMochi(seed, { coat: null }));
  Object.assign(rec, { stage, personality, mood: 80, name: 'Puff' });
  for (const st of STATS) Object.assign(rec.stats[st], { points, level: Math.round(points / 21) });
  return rec;
};
function atHall(...recs) {
  const char = createCharacter('Mina', { hairStyle: 'bob' });
  char.garden = { back: null, mochi: recs, eggs: [], unlocked: {} };
  const w = createWorld(char);
  w.log = () => {};
  loadMap(w, 'mochi_market', 'start');
  w.body.x = MARKET.sumo;
  return w;
}

test('Power decides it most: the stronger wins, a good start helps, the same bout always goes the same way', () => {
  const weak = mochi(1, { points: 200 });
  const strong = mochi(2, { points: 2200 });
  assert.ok(sumoStrength(strong) > sumoStrength(weak) + 0.4);
  for (let s = 0; s < 20; s++) assert.ok(boutOf(strong, weak, s).youWin, 'the strong one always beats the weak');
  assert.deepEqual(boutOf(weak, strong, 7), boutOf(weak, strong, 7), 'seeded');
  // (Between two alike, a perfect start wins more of them.)
  const a = mochi(3, { points: 900 });
  const b = mochi(4, { points: 900 });
  const wins = (start) => Array.from({ length: 200 }, (_, s) => boutOf(a, b, s, start).youWin).filter(Boolean).length;
  assert.ok(wins('perfect') > wins(null) + 20, `${wins('perfect')} vs ${wins(null)}`);
  assert.equal(startOf(0.02), 'perfect');
  assert.equal(startOf(0.2), 'good');
  assert.equal(startOf(-0.3), 'soon');
  assert.equal(startOf(null), null);
  // (A close bout is a long sway back and forth; a mismatch is over quickly. Either way it ends with
  // the loser pushed to its own side.)
  const close = boutOf(a, b, 5);
  const quick = boutOf(strong, weak, 5);
  assert.ok(close.len > quick.len, `${close.len} > ${quick.len}`);
  for (const bt of [close, quick]) assert.equal(pushAt(bt, bt.len + 1), bt.youWin ? 34 : -34);
});

test('a finishing move for each range of Power, and the cheeky ones sometimes duck instead', () => {
  const opp = mochi(9, { points: 60 });
  STYLE_POINTS.forEach((p, i) => {
    const rec = mochi(20 + i, { points: p + 20 });
    // (A bout it wins: the move is the winner's.)
    const b = Array.from({ length: 30 }, (_, s) => boutOf(rec, opp, s)).find((x) => x.youWin);
    assert.ok(b, `${p} Power wins one`);
    assert.equal(b.move.id, KIMARITE[i].id, `${p} Power: ${KIMARITE[i].name}`);
  });
  assert.equal(new Set(KIMARITE.map((k) => k.id)).size, 6);
  const cheeky = mochi(30, { personality: 'cheeky', points: 1500 });
  const ducks = Array.from({ length: 60 }, (_, s) => boutOf(cheeky, opp, s).move).filter((m) => m === DUCK).length;
  assert.ok(ducks > 5 && ducks < 40, `${ducks} ducks`);
  assert.ok(Array.from({ length: 60 }, (_, s) => boutOf(mochi(31, { points: 1500 }), opp, s).move).every((m) => m !== DUCK), 'a brave one never ducks');
});

test('Up by the sumo hall opens its window; a tournament runs bout by bout to the results, pays out, and back to the door', () => {
  const champ = mochi(77, { points: 1900 });
  const w = atHall(champ);
  assert.ok(sumoHallUp(w), 'Up by the hall');
  assert.ok(w.events.some((e) => e.type === 'sumo'), 'its window');
  assert.ok(!startSumo(w, champ, 'challenge'), 'Challenge is locked to start with');
  const gold0 = w.char.gold;
  assert.ok(startSumo(w, champ, 'beginner'));
  const S = w.sumo;
  assert.equal(w.map.id, 'mochi_sumo');
  assert.equal(S.rivals.length, BOUTS);
  const steps = new Set();
  let onFloor = 0;
  let pressed = 0;
  for (let t = 0; t < 150 && w.sumo && w.sumo.phase !== 'done'; t += 1 / 60) {
    // (Space as the referee calls it.)
    const call = S.step === 'crouch' && S.st >= STEP.call && S.pressAt == null;
    if (call) pressed += 1;
    updateWorld(w, 1 / 60, keys(call ? ['Space'] : []));
    steps.add(S.step);
    for (const c of [S.you, ...S.rivals, S.ref]) assert.ok(Number.isFinite(c.x) && Number.isFinite(c.y));
    // (The loser sat on the floor below the ring, beside it, never in it.)
    if (S.step === 'dazed') {
      const L = S.bout.youWin ? S.rivals[S.k] : S.you;
      assert.equal(L.y, RING.floor);
      assert.ok(Math.abs(L.x - RING.mid) > RING.foot, 'off the ring');
      onFloor += 1;
    }
  }
  assert.equal(S.phase, 'done');
  for (const st of ['enter', 'shiko', 'salt', 'mark', 'crouch', 'clash', 'push', 'finish', 'fall', 'dazed', 'back', 'bow', 'off']) assert.ok(steps.has(st), st);
  assert.ok(onFloor > 0);
  assert.equal(pressed, BOUTS, 'a start pressed each bout');
  assert.ok(S.results.every((r) => ['perfect', 'good'].includes(r.start)), 'pressed on the call');
  assert.equal(S.wins, BOUTS, `a strong one wins the Beginner ring: ${S.results.map((r) => r.win)}`);
  assert.equal(w.char.gold - gold0, sumoPrize('beginner', 3));
  assert.ok(sumoOpen(w.char, 'challenge'), 'the next ring opens');
  assert.equal(sumoCupOf(w.char), 'beginner', 'a cup for the shelf');
  assert.equal(w.char.garden.diary?.at(-1)?.notes.at(-1)?.k, 'sumoring', 'in the diary');
  // Up: back out to the hall's door.
  updateWorld(w, 1 / 60, keys(['ArrowUp']));
  assert.equal(w.sumo, null);
  assert.equal(w.map.id, 'mochi_market');
  assert.ok(Math.abs(w.body.x - MARKET.sumo) < 2);
});

test('Down skips to the results, the rest decided at once; a little one can wrestle too; a save in the hall loads in the market', () => {
  const tiny = mochi(5, { stage: 'mochiko', personality: 'shy', points: 120 });
  const w = atHall(tiny);
  assert.ok(startSumo(w, tiny, 'beginner'));
  for (let t = 0; t < 4; t += 1 / 60) updateWorld(w, 1 / 60, keys());
  updateWorld(w, 1 / 60, keys(['ArrowDown']));
  assert.equal(w.sumo.phase, 'results');
  assert.equal(w.sumo.results.length, BOUTS);
  for (let t = 0; t < 10 && w.sumo.phase !== 'done'; t += 1 / 60) updateWorld(w, 1 / 60, keys());
  assert.equal(w.sumo.phase, 'done');
  assert.ok(w.sumo.prize > 0, 'something for trying');
  updateWorld(w, 1 / 60, keys(['ArrowUp']));
  loadMap(w, 'mochi_sumo', 'start');
  assert.equal(w.map.id, 'mochi_market');
  // (This hour's rivals, stronger bout by bout.)
  const rv = sumoRivals('challenge', 12345);
  assert.equal(rv.length, BOUTS);
  assert.ok(rv[0].q < rv[1].q && rv[1].q < rv[2].q);
});

test("each wrestler's moves lead smoothly into the next: every one starts leaning just as the last one ends", async () => {
  const { SUMO_ACTS } = await import('../src/render/mochi-sumo-acts.js');
  const leanAt = (name, end) => {
    const keysOf = SUMO_ACTS[name].keys;
    return (end ? keysOf.at(-1) : keysOf[0])[1].lean ?? 0;
  };
  // (A held move is left from its loop: the lean it holds there.)
  const looped = (name) => {
    const bit = SUMO_ACTS[name];
    return bit.keys.find(([t]) => t >= bit.loop[0])[1].lean ?? 0;
  };
  const same = (a, b, what) => {
    const d = Math.abs((((a - b) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI);
    assert.ok(d < 0.04, `${what}: ${a.toFixed(2)} then ${b.toFixed(2)}`);
  };
  for (const next of ['sumocharge', 'sumoduck', 'sumotrip']) same(looped('sumocrouch'), leanAt(next, false), `crouch into ${next}`);
  same(leanAt('sumocharge', true), leanAt('sumopush', false), 'charge into the push');
  for (const next of ['sumobrace', 'sumobelly', 'sumothrust', 'sumodrive', 'sumolift', 'sumothrow']) same(looped('sumopush'), leanAt(next, false), `push into ${next}`);
  for (const next of ['sumolifted', 'sumoflung', 'sumotumble']) same(looped('sumobrace'), leanAt(next, false), `giving way into ${next}`);
  same(leanAt('sumolifted', true), leanAt('sumotumble', false), 'set down, then over');
  same(leanAt('sumoflung', true), leanAt('sumotumble', false), 'rolled out, then over');
  same(leanAt('sumotumble', true), leanAt('sumodazed', false), 'landed, sat');
  same(leanAt('sumotrip', true), leanAt('sumodazed2', false), 'face down, then up');
  // (The winner's finish, and the dazed one getting up, end upright: straight on into walking.)
  for (const name of ['sumobelly', 'sumothrust', 'sumodrive', 'sumolift', 'sumothrow', 'sumoduck', 'sumopush', 'sumodazed', 'sumodazed2', 'sumowin', 'sumoshiko', 'sumosalt', 'sumohop']) {
    same(leanAt(name, true), 0, `${name} ends upright`);
    const last = SUMO_ACTS[name].keys.at(-1)[1];
    assert.ok(!last.tip && !last.sink && !last.lift, `${name} ends on its feet`);
  }
  for (const [name, bit] of Object.entries(SUMO_ACTS)) {
    const ts = bit.keys.map(([t]) => t);
    assert.equal(ts[0], 0, `${name} starts at 0`);
    assert.ok(Math.abs(ts.at(-1) - bit.dur) < 1e-9, `${name} ends on its last key`);
    assert.ok(ts.every((t, i) => !i || t > ts[i - 1]), `${name}'s keys in order`);
    assert.ok(bit.crisp && bit.fps === 48, `${name} crisp`);
  }
});

test('in the garden, two Mochi have a sumo match of their own: stamps, a shove, and the loser plops down on its bottom', async () => {
  const { startDuo } = await import('../src/world/garden-life.js');
  const char = createCharacter('Mina', { hairStyle: 'bob' });
  const strong = mochi(61, { personality: 'brave', points: 2100 });
  const weak = mochi(62, { personality: 'sporty', points: 150 });
  Object.assign(strong, { name: 'Taro' });
  Object.assign(weak, { name: 'Mame' });
  char.garden = { back: null, mochi: [strong, weak], eggs: [], unlocked: {} };
  const w = createWorld(char);
  w.log = () => {};
  w.forceFestival = null;
  w.forceWeather = {};
  w.forceNight = 0;
  w.dayClock = () => new Date(2026, 5, 10, 13, 0);
  loadMap(w, 'garden', 'start');
  for (let t = 0; t < 1; t += 0.1) updateWorld(w, 0.1, keys());
  const L = w.gardenLife;
  const [a, b] = L.mochi;
  // (Free of whatever they'd got up to in that first second - a game of their own, a ride.)
  for (const e of [a, b]) {
    if (e.duo) L.duos = L.duos.filter((q) => q !== e.duo);
    Object.assign(e, { duo: null, ride: null, hidden: false });
    e.m.action = null;
    if (e.brain) e.brain.plan = null;
  }
  a.x = 640;
  b.x = 700;
  startDuo(w, L, 'sumo', a, b);
  const d = L.duos.find((q) => q.kind === 'sumo');
  const seen = new Set();
  for (let t = 0; t < 14 && L.duos.includes(d); t += 1 / 30) {
    updateWorld(w, 1 / 30, keys());
    for (const e of [a, b]) if (e.m.action) seen.add(`${e === a ? 'a' : 'b'}:${e.m.action.name}`);
  }
  assert.ok(!L.duos.includes(d), 'over');
  assert.ok(d.aWins, 'the much stronger one wins');
  for (const k of ['a:sumoshiko', 'b:sumoshiko', 'a:sumocharge', 'a:sumopush', 'b:sumobrace', 'b:sumoplop', 'a:sumowin']) assert.ok(seen.has(k), `${k} (${[...seen]})`);
  const note = char.garden.diary.at(-1).notes.find((n) => n.k === 'sumo');
  assert.equal(note?.x, 'Taro', 'in the diary, with who won');
});
