// The Moon Viewing festival (world/garden-festival.js): when it comes round, the garden through a
// festival day - bows at the offering, two pounding mochi at the mortar in time - and its night, the
// Mochi up late in a row watching the moon instead of going to bed; its pieces making way for yours;
// and its stall in the Mochi Market, with Dango Stack and the prizes.

import { startOf } from '../src/world/calendar.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCharacter } from '../src/core/character.js';
import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { rollMochi, STATS } from '../src/data/mochi-genes.js';
import { newRecord } from '../src/data/mochi-raise.js';
import { festivalAt, nextFestivalIn, EVERY, OFFERING, MORTAR, festStallUp } from '../src/world/garden-festival.js';
import { DAY_MINUTES } from '../src/world/daytime.js';
import { STACK, newStack, tickStack, dropDango, tokensFor } from '../src/world/dango-stack.js';
import { FURNITURE, GARDEN_DECOR } from '../src/data/furniture.js';
import { placePiece } from '../src/world/decor.js';
import { addItem } from '../src/core/inventory.js';
import { groundAt } from '../src/world/physics.js';
import { MARKET } from '../src/world/market.js';

const keys = (pressed = []) => ({ held: new Set(), pressed: new Set(pressed) });
const DAY_MS = DAY_MINUTES * 60000;
function festGarden(n = 6, festival = { eve: 0, hour: 12 }) {
  const char = createCharacter('Mina', { hairStyle: 'bob' });
  const recs = Array.from({ length: n }, (_, i) => {
    const rec = newRecord(rollMochi(8100 + i * 41, { coat: null }));
    for (const st of STATS) Object.assign(rec.stats[st], { points: 400 + i * 300, level: 40 });
    Object.assign(rec, { stage: 'amamochi', personality: ['playful', 'chatty', 'gentle', 'sweet', 'brave', 'dreamy', 'shy', 'hyper'][i], name: `M${i}`, bond: 300 });
    rec.needs = { energy: 70, fun: 30, social: 30, curious: 60, hunger: 70 };
    return rec;
  });
  for (const a of recs) for (const b of recs) if (a !== b) (a.friends ??= {})[b.seed] = 40;
  char.garden = { back: null, mochi: recs, eggs: [], unlocked: {} };
  const w = createWorld(char);
  w.log = () => {};
  w.forceWeather = {};
  w.forceFestival = festival;
  w.forceNight = 0;
  w.dayClock = () => new Date(2026, 9, 10, 12, 0);
  let now = 1.8e12;
  const real = Date.now;
  Date.now = () => now;
  loadMap(w, 'garden', 'start');
  const run = (secs, step = 0.1, each = null) => {
    for (let t = 0; t < secs; t += step) {
      now += step * 1000;
      updateWorld(w, step, keys());
      each?.();
    }
  };
  return { w, char, recs, run, done: () => (Date.now = real) };
}

test('a festival every fourth game day, each season its own: dressed through the day, the moon up from dusk', () => {
  // (A day in October, then one in June.)
  const oct = Date.UTC(2026, 9, 10);
  const days = [];
  for (let d = 0; d < 12; d++) {
    const day = Math.floor(oct / DAY_MS) + d;
    const noon = new Date(day * DAY_MS + DAY_MS / 2);
    if (festivalAt(noon)) days.push(day % EVERY);
  }
  assert.ok(days.length === 3 && days.every((r) => r === 1), `${days}`);
  const day = Math.ceil(oct / DAY_MS / EVERY) * EVERY + 1;
  const at = (hour) => festivalAt(new Date(day * DAY_MS + (hour / 24) * DAY_MS));
  assert.equal(at(12).id, 'moon');
  assert.equal(at(12).k, 1);
  assert.equal(at(12).eve, 0);
  assert.ok(at(3) == null || at(3).k === 0, 'not up in the small hours');
  assert.ok(at(20.5).eve > 0.9, 'the moon up at night');
  const june = Math.ceil(Date.UTC(2026, 5, 10) / DAY_MS / EVERY) * EVERY + 1;
  assert.equal(festivalAt(new Date(june * DAY_MS + DAY_MS / 2)).id, 'lantern', 'each season its own');
  assert.ok(nextFestivalIn(new Date(oct)) <= EVERY * DAY_MS);
});

test("a festival day: each Mochi bows at the offering, and two at a time pound mochi at the mortar, in time", () => {
  const g = festGarden(6);
  try {
    const L = g.w.gardenLife;
    let paired = 0;
    let both = 0;
    g.run(420, 0.1, () => {
      for (const d of L.duos ?? []) {
        if (d.kind !== 'pound') continue;
        paired += 1;
        // (Both at the mortar, the mallet at its left, the turner kneeling at its right, each at its own move.)
        if (Math.abs(d.a.x - (d.mortar - 22)) < 1.5 && Math.abs(d.b.x - (d.mortar + 13)) < 1.5 && d.a.m.action?.name?.startsWith('pound') && d.b.m.action?.name === 'festturn') both += 1;
      }
    });
    assert.ok(L.festBowed.seen.size >= 4, `${L.festBowed.seen.size} bowed`);
    assert.ok(paired > 0, 'some pounded mochi');
    assert.ok(both > 20, `both at it together (${both})`);
    assert.ok(g.char.garden.diary.at(-1).notes.some((n) => n.k === 'pound'), 'in the diary');
  } finally {
    g.done();
  }
});

test("a festival night: nobody goes to bed - they sit out watching the moon (and on any other night they're asleep)", () => {
  const g = festGarden(6, { eve: 1, hour: 20.5 });
  try {
    g.w.forceNight = 0.9;
    g.run(60);
    const L = g.w.gardenLife;
    const out = L.mochi.filter((e) => !e.hidden);
    assert.equal(out.length, 6, 'all up');
    const gazing = out.filter((e) => e.m.action?.name === 'moonsit' || e.brain?.plan?.id === 'moongaze');
    assert.ok(gazing.length >= 4, `${gazing.length} watching the moon`);
    for (const e of gazing.filter((q) => q.m.action?.name === 'moonsit')) assert.equal(e.m.dir, 1, 'facing the moon');
    const note = g.char.garden.diary.at(-1).notes.find((n) => n.k === 'moon');
    assert.ok(note && note.who.length >= 3, 'all together in one line of the diary');
    // The same night with no festival: to bed (but the night owls).
    g.w.forceFestival = null;
    g.run(40);
    assert.ok(L.mochi.filter((e) => !e.hidden).length <= 2);
  } finally {
    g.done();
  }
});

test("the festival's own pieces move along for something of yours set out where they'd stand", async () => {
  const { festivalSpots } = await import('../src/world/garden-life.js');
  const g = festGarden(2);
  try {
    const L = g.w.gardenLife;
    assert.equal(festivalSpots(L).offering, OFFERING.x);
    assert.equal(festivalSpots(L).mortar, MORTAR.x);
    addItem(g.char.inventory, 'garden_bench', 1);
    const p = placePiece(g.w.map, g.char, 'garden_bench', MORTAR.x, groundAt(g.w.map, MORTAR.x));
    assert.equal(typeof p, 'object', String(p));
    const m = festivalSpots(L).mortar;
    assert.notEqual(m, MORTAR.x);
    assert.ok(Math.abs(m - p.x) >= 34, `clear of the bench (${m} vs ${p.x})`);
  } finally {
    g.done();
  }
});

test('the stall opens on festival days in the market; Dango Stack: perfect drops stack straight, misses cost a heart, a lean topples it; tokens for the prizes', () => {
  const char = createCharacter('Mina', { hairStyle: 'bob' });
  char.garden = { back: null, mochi: [], eggs: [], unlocked: {} };
  const w = createWorld(char);
  w.log = () => {};
  w.forceFestival = null;
  loadMap(w, 'mochi_market', 'start');
  w.body.x = MARKET.fest;
  updateWorld(w, 0.1, keys());
  assert.ok(!festStallUp(w), 'no stall without a festival');
  w.forceFestival = { eve: 0, hour: 12 };
  updateWorld(w, 0.1, keys());
  assert.ok(festStallUp(w));
  assert.ok(w.events.some((e) => e.type === 'feststall'));
  // The game.
  const step = (g, secs) => {
    for (let t = 0; t < secs; t += 1 / 60) tickStack(g, 1 / 60);
  };
  const dropAt = (g, x) => {
    for (let k = 0; k < 2000 && Math.abs(g.x - x) > 1.2; k++) tickStack(g, 1 / 240);
    dropDango(g);
    step(g, STACK.fall + 0.05);
  };
  const g = newStack();
  for (let i = 0; i < 6; i++) dropAt(g, 0);
  assert.equal(g.n, 6);
  assert.ok(g.perfects >= 5, 'right on top: perfect');
  assert.ok(Math.abs(g.lean) < 1);
  dropAt(g, 40);
  assert.equal(g.lives, STACK.lives - 1, 'off the edge: a miss');
  assert.equal(g.n, 6);
  // (Off-centre each time, the same way: it leans, and over it goes.)
  for (let i = 0; i < 6 && g.phase !== 'topple'; i++) dropAt(g, g.topX + 6);
  assert.equal(g.phase, 'topple');
  step(g, 2);
  assert.equal(g.phase, 'done');
  assert.equal(tokensFor(g.score), Math.floor(g.score / 4));
  // A full skewer.
  const f = newStack();
  for (let i = 0; i < STACK.max; i++) dropAt(f, f.topX);
  assert.equal(f.phase, 'done');
  assert.equal(f.last, 'full');
  assert.equal(f.score, STACK.max + Math.floor(STACK.max / 5), 'the golden ones count double');
  // The prizes: the festival's own, for tokens, never in Kinako's shop.
  const prizes = FURNITURE.filter((x) => x.festival === 'moon');
  assert.equal(prizes.length, 3);
  assert.ok(prizes.every((x) => x.tokens > 0 && x.price == null && x.where === 'garden'));
  assert.ok(GARDEN_DECOR().filter((x) => x.price != null).every((x) => !x.festival));
});

test("the turning keeps time with the mallet: hands well out of the mortar as each strike lands", async () => {
  const { ACTIONS: A0, IDLE_BITS } = await import('../src/render/mochi-anim.js');
  const ACTIONS = new Proxy({}, { get: (_, k) => A0[k] ?? IDLE_BITS[k] });
  const turn = ACTIONS.festturn;
  for (let tier = 0; tier < 6; tier++) assert.deepEqual(ACTIONS[`pound${tier}`].loop, turn.loop, `pound${tier} on the same beat`);
  // (At the strike, 0.5 in, its paws are back by its body; between strikes they're in the mortar.)
  const keyAt = (t) => turn.keys.find(([kt]) => Math.abs(kt - t) < 1e-9)[1];
  assert.ok(keyAt(0.5).front[0] <= 2, 'hands back at the strike');
  assert.ok(keyAt(0.72).front[0] >= 6, 'in, folding, between');
  for (const name of ['moonsit', 'offerbow', 'festturn']) {
    const ts = ACTIONS[name].keys.map(([t]) => t);
    assert.ok(ts.every((t, i) => !i || t > ts[i - 1]) && ts.at(-1) === ACTIONS[name].dur, name);
  }
});

test('winter: the Snow Lantern Festival in Winter - snowball fights by day, lanterns lit at dusk, sat by them at night', async () => {
  const { snowLanterns, litLanterns } = await import('../src/world/garden-life.js');
  // (a festival day in the game's winter: world/calendar.js)
  const dec = Math.ceil(startOf(3, 5, 1) / DAY_MS / EVERY) * EVERY + 1;
  assert.equal(festivalAt(new Date(dec * DAY_MS + DAY_MS / 2)).id, 'snow');
  const g = festGarden(6, { id: 'snow', eve: 0, hour: 12 });
  try {
    const L = g.w.gardenLife;
    // (Snow lying deep all day, whatever the weather.)
    g.run(1);
    assert.ok(g.w.gardenWeather.snow > 0.8);
    let fights = 0;
    let thrown = 0;
    g.run(300, 0.1, () => {
      for (const d of L.duos ?? []) {
        if (d.kind !== 'snowball') continue;
        fights += 1;
        if (d.a.m.action?.name === 'snowthrow' || d.b.m.action?.name === 'snowthrow') thrown += 1;
      }
    });
    assert.ok(fights > 0 && thrown > 0, `snowball fights (${fights}, ${thrown})`);
    assert.ok(g.char.garden.diary.at(-1).notes.some((n) => n.k === 'snowball'));
    // Dusk: off round the lanterns, lighting them; then sat by them, warm.
    g.w.forceFestival = { id: 'snow', eve: 0.6, hour: 18.8 };
    g.w.forceNight = 0.4;
    g.run(60);
    const lit = litLanterns(L, g.w.gardenFestival);
    assert.ok(lit.size >= 4, `${lit.size} of ${snowLanterns(L).length} lit`);
    g.w.forceFestival = { id: 'snow', eve: 1, hour: 20.5 };
    g.w.forceNight = 0.9;
    g.run(60);
    assert.equal(L.mochi.filter((e) => !e.hidden).length, 6, 'up late');
    const warm = L.mochi.filter((e) => e.m.action?.name === 'warmsit' || e.brain?.plan?.id === 'warmsit');
    assert.ok(warm.length >= 3, `${warm.length} warming by the lanterns`);
    assert.ok(g.char.garden.diary.at(-1).notes.some((n) => n.k === 'litlantern' && n.who.length >= 2));
  } finally {
    g.done();
  }
});

test('Snowball Toss: hit a head while it is up for a point (a golden one two), miss it and it is a splat; thirty seconds', async () => {
  const { TOSS, newToss, tickToss, throwToss, tossTokens, isUp } = await import('../src/world/snowball-toss.js');
  const g = newToss(77);
  let hits = 0;
  let gold = 0;
  for (let t = 0; t < TOSS.time + 1; t += 1 / 60) {
    const out = tickToss(g, 1 / 60);
    if (out === 'hit') hits += 1;
    if (out === 'gold') gold += 1;
    // (Thrown whenever the aim's over a head that will still be up when the ball gets there.)
    const q = g.targets.find((p) => isUp(p, g.t) && p.until - g.t > TOSS.fly && Math.abs(p.hole - g.x) < 6);
    if (q) throwToss(g);
  }
  assert.equal(g.phase, 'done');
  assert.ok(hits + gold >= 6, `${hits} hits, ${gold} golden`);
  assert.equal(g.score, hits + gold * 2);
  assert.equal(tossTokens(g.score), Math.min(5, Math.floor(g.score / 4)));
  // Thrown at nothing: a splat, no score.
  const m = newToss(5);
  throwToss(m);
  let out = null;
  for (let t = 0; t < 0.5 && !out; t += 1 / 60) out = tickToss(m, 1 / 60);
  assert.equal(out, 'miss');
  assert.equal(m.score, 0);
  // Its prizes.
  const prizes = FURNITURE.filter((x) => x.festival === 'snow');
  assert.equal(prizes.length, 3);
  assert.ok(prizes.every((x) => x.tokens > 0 && x.price == null));
});

test('spring and summer: Blossom Day in April (a picnic on the mat), Lantern Night in July (boats at dusk, fireworks and sparklers at night)', () => {
  const at = (y, m) => festivalAt(new Date((Math.ceil(Date.UTC(y, m, 10) / DAY_MS / EVERY) * EVERY + 1) * DAY_MS + DAY_MS / 2)).id;
  assert.equal(at(2026, 3), 'blossom');
  assert.equal(at(2026, 6), 'lantern');
  // A festival for every month of the year now.
  for (let m = 0; m < 12; m++) assert.ok(at(2026, m), `month ${m + 1}`);
  const b = festGarden(6, { id: 'blossom', eve: 0, hour: 12 });
  try {
    b.run(240);
    const L = b.w.gardenLife;
    assert.ok(b.char.garden.diary.at(-1).notes.some((n) => n.k === 'hanami'), 'a picnic');
    b.w.forceFestival = { id: 'blossom', eve: 1, hour: 20 };
    b.w.forceNight = 0.9;
    b.run(50);
    const out = L.mochi.filter((e) => !e.hidden);
    assert.equal(out.length, 6, 'up late under the lanterns');
    assert.ok(out.filter((e) => e.m.action?.name === 'hanamisit' || e.brain?.plan?.id === 'hanami').length >= 4);
  } finally {
    b.done();
  }
  const s = festGarden(6, { id: 'lantern', eve: 0.6, hour: 18.8 });
  try {
    s.w.forceNight = 0.4;
    s.run(70);
    const L = s.w.gardenLife;
    assert.ok(L.festBoats?.boats.length >= 4, `${L.festBoats?.boats.length} boats afloat`);
    s.w.forceFestival = { id: 'lantern', eve: 1, hour: 20.5 };
    s.w.forceNight = 0.9;
    s.run(50);
    assert.ok(L.mochi.filter((e) => e.m.action?.name === 'sparklesit' || e.brain?.plan?.id === 'hanabi').length >= 4, 'out with sparklers');
    assert.ok(s.char.garden.diary.at(-1).notes.some((n) => n.k === 'boat' && n.who.length >= 3));
  } finally {
    s.done();
  }
});

test('Petal Catch: the basket under a petal catches it (a golden one two); Ring Toss: a throw right over a peg is a ringer for its points', async () => {
  const { PETAL, newCatch, tickCatch } = await import('../src/world/petal-catch.js');
  const g = newCatch(9);
  for (let t = 0; t < PETAL.time + 1; t += 1 / 60) {
    // (Steered under the lowest petal still falling.)
    const p = [...g.petals].sort((a, c) => c.y - a.y)[0];
    tickCatch(g, 1 / 60, { aim: p?.x ?? 0 });
  }
  assert.equal(g.phase, 'done');
  assert.ok(g.caught >= 20, `${g.caught} caught, ${g.missed} missed`);
  const idle = newCatch(9);
  for (let t = 0; t < PETAL.time + 1; t += 1 / 60) tickCatch(idle, 1 / 60, {});
  assert.ok(idle.caught < g.caught / 2, 'standing still catches few');
  const { RING, newRings, tickRings, throwRing, landAt } = await import('../src/world/ring-toss.js');
  const r = newRings();
  for (let i = 0; i < RING.rings; i++) {
    // (Thrown just as the meter's at the far peg.)
    const want = (RING.pegs[2][0] - 26) / (RING.reach - 26);
    for (let k = 0; k < 5000 && Math.abs(r.meter - want) > 0.004; k++) tickRings(r, 1 / 600);
    assert.ok(Math.abs(landAt(r.meter) - RING.pegs[2][0]) <= RING.ringer);
    throwRing(r);
    for (let t = 0; t < RING.fly + 0.05; t += 1 / 60) tickRings(r, 1 / 60);
  }
  assert.equal(r.phase, 'done');
  assert.equal(r.score, 30, 'ten ringers on the far peg');
  for (const id of ['blossom', 'lantern']) assert.equal(FURNITURE.filter((x) => x.festival === id).length, 3, id);
});

test('playing a stall game, its keys are the game\'s: Space or Up plays it, Left and Right steer, and you neither jump nor walk off', async () => {
  const { createUiState, routeInput } = await import('../src/ui/manager.js');
  const { newCatch } = await import('../src/world/petal-catch.js');
  const char = createCharacter('Mina', { hairStyle: 'bob' });
  char.garden = { back: null, mochi: [], eggs: [], unlocked: {} };
  const w = createWorld(char);
  w.log = () => {};
  w.forceFestival = { id: 'blossom', eve: 0, hour: 12 };
  loadMap(w, 'mochi_market', 'start');
  w.body.x = MARKET.fest;
  const state = createUiState();
  const fs = state.windows.feststall;
  const input = (held, pressed) => ({ held: new Set(held), pressed: new Set(pressed), mouse: { x: -9, y: -9 } });
  // (No game going: the keys are yours.)
  assert.ok(!routeInput(state, w, input(['ArrowLeft'], []), 1 / 60));
  Object.assign(fs, { open: true, game: newCatch(1) });
  const i1 = input(['ArrowLeft', 'Space'], ['Space']);
  assert.ok(routeInput(state, w, i1, 1 / 60), 'the world locked');
  assert.ok(fs.drop && fs.left && !fs.right);
  assert.ok(i1.held.has('ArrowLeft'), 'the arrow stays held, frame after frame');
  // The world, locked, takes no step or jump from them.
  const x0 = w.body.x;
  for (let k = 0; k < 30; k++) updateWorld(w, 1 / 60, { held: new Set(['ArrowLeft', 'Space']), pressed: new Set(['Space']), locked: true });
  assert.ok(Math.abs(w.body.x - x0) < 0.5 && w.body.vy >= -1, 'stood still');
  // Over: the keys are yours again.
  fs.game.phase = 'done';
  assert.ok(!routeInput(state, w, input(['ArrowLeft'], []), 1 / 60));
});
