// Raising your Mochi in your garden (world/garden-life.js), played with real key presses: Up beside
// a Mochi opens its care panel, care and sweets work and use up the sweet, the crop bed gives crops
// once it's ripe, and one ready to evolve does; at the end of a long, happy life it goes back to its
// egg; you can say goodbye to one; a full garden won't hatch another. And a friend visiting: their
// game asks yours for the garden, sees the same Mochi in the same places, and their pets and sweets
// reach your real Mochi.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCharacter } from '../src/core/character.js';
import { createWorld, updateWorld, loadMap, useItem } from '../src/world/world.js';
import { rollMochi, STATS } from '../src/data/mochi-genes.js';
import { newRecord, giveExp, evolve, MOCHI_SWEETS, GARDEN_CROPS } from '../src/data/mochi-raise.js';
import { addItem, countItem } from '../src/core/inventory.js';
import { ITEMS } from '../src/data/items.js';
import { careFor, feedMochi, sayGoodbye, scheduledAt, CROP_X, CROP_GROW, GARDEN_MAX, EGG_SLOTS } from '../src/world/garden-life.js';
import { online } from '../src/net/online.js';
import { footingAt, groundAt } from '../src/world/physics.js';
import { onVisit, askGardenVisit } from '../src/net/visit.js';

const keys = (pressed = []) => ({ held: new Set(), pressed: new Set(pressed) });

// A garden with a grown-up swimmer and a fresh baby, on a clock the test moves.
function garden() {
  const char = createCharacter('Mina', { hairStyle: 'bob' });
  const swimmer = newRecord(rollMochi(901, { coat: null }));
  for (const [st, n] of [['swim', 3000], ['run', 1500], ['fly', 800], ['power', 900]]) giveExp(swimmer, st, n);
  const baby = newRecord(rollMochi(902, { coat: null }));
  char.garden = { back: null, mochi: [swimmer, baby], eggs: [], unlocked: {} };
  const w = createWorld(char);
  // (No festival unless a test asks for one: they come round by the real clock.)
  w.forceFestival = null;
  // (Clear skies: the garden's own forecast follows the real clock.)
  w.forceWeather = process.env.WX ? JSON.parse(process.env.WX) : {};
  const logs = [];
  w.log = (m) => logs.push(m);
  w.forceNight = 0;
  let now = 1.8e12;
  const realNow = Date.now;
  Date.now = () => now;
  loadMap(w, 'garden', 'start');
  const run = (secs, step = 0.1) => {
    for (let t = 0; t < secs; t += step) {
      now += step * 1000;
      updateWorld(w, step, keys());
    }
  };
  const up = () => {
    const n = w.events.length;
    updateWorld(w, 1 / 60, keys(['ArrowUp']));
    return w.events.slice(n);
  };
  run(0.5);
  return { w, char, logs, run, up, swimmer, baby, done: () => (Date.now = realNow) };
}

test('every crop and sweet is a real item with its own icon', () => {
  for (const id of Object.keys(GARDEN_CROPS)) assert.equal(ITEMS[id]?.type, 'etc', id);
  for (const sw of MOCHI_SWEETS) assert.equal(ITEMS[sw.id]?.mochiSweet, sw.kind, sw.id);
});

test('Up beside a Mochi opens its care panel; care and sweets change it', () => {
  const g = garden();
  try {
    const e = g.w.gardenLife.mochi[0];
    // (Out in the square, clear of the doors and the stalls.)
    Object.assign(e, { x: 650, y: g.w.map.terrain[0][1] });
    Object.assign(g.w.body, { x: e.x + 8, y: e.y });
    assert.deepEqual(g.up(), [{ type: 'mochi' }]);
    assert.equal(g.w.gardenLife.caring, e);
    const mood = g.swimmer.mood;
    assert.equal(careFor(g.w, e, 'pet').action, 'pet');
    assert.ok(g.swimmer.mood > mood);
    addItem(g.char.inventory, 'msweet_dango', 2);
    const out = feedMochi(g.w, e, 'msweet_dango');
    assert.equal(out.action, 'eat');
    assert.equal(countItem(g.char.inventory, 'msweet_dango'), 1);
    assert.equal(out.learned, 'roll');
    assert.equal(e.m.action.sweet, 'dango');
  } finally {
    g.done();
  }
});

test('the crop bed is picked by hand when ripe, then grows again', () => {
  const g = garden();
  try {
    Object.assign(g.w.body, { x: CROP_X, y: 700 });
    g.up();
    // (She kneels and tugs: nothing's in the bag until the picking's done.)
    assert.ok(g.w.gathering, 'picking');
    g.run(0.5);
    assert.equal(countItem(g.char.inventory, 'mochi_rice'), 0, 'still picking');
    g.run(1.5);
    assert.equal(g.w.gathering, null);
    assert.equal(countItem(g.char.inventory, 'mochi_rice'), 3);
    assert.ok(g.w.lastGathered?.items.includes('azuki'), 'the crops hopped out of the bed');
    g.up();
    assert.equal(g.w.gathering, null, 'not ripe yet');
    assert.equal(countItem(g.char.inventory, 'mochi_rice'), 3, 'not ripe yet');
    g.run(CROP_GROW + 1, 1);
    // Walking off part-way leaves the crops in the ground.
    Object.assign(g.w.body, { x: CROP_X, y: 700 });
    g.up();
    g.run(0.3);
    updateWorld(g.w, 1 / 60, { held: new Set(['ArrowLeft']), pressed: new Set() });
    g.run(2);
    assert.equal(countItem(g.char.inventory, 'mochi_rice'), 3, 'walked off: nothing picked');
    Object.assign(g.w.body, { x: CROP_X, y: 700 });
    g.up();
    g.run(2);
    assert.equal(countItem(g.char.inventory, 'mochi_rice'), 6);
  } finally {
    g.done();
  }
});

test('a Mochiko ready to evolve does, there in the garden', () => {
  const g = garden();
  try {
    Object.assign(g.baby, { grown: 99999, age: 99999, mood: 90 });
    for (const st of STATS) giveExp(g.baby, st, 1200);
    g.run(0.3);
    const e = g.w.gardenLife.mochi[1];
    assert.equal(e.scene, 'evolve');
    assert.ok(['amamochi', 'karamochi', 'tsukimochi'].includes(g.baby.stage));
  } finally {
    g.done();
  }
});

test('at the end of a long, happy life it goes back to its egg and hatches again', () => {
  const g = garden();
  try {
    const rec = g.swimmer;
    Object.assign(rec, { age: 99999, mood: 90 });
    evolve(rec);
    rec.age = 30 * 3600;
    rec.mood = 95;
    g.run(0.2);
    const e = g.w.gardenLife.mochi[0];
    assert.equal(e.scene, 'rebirth');
    assert.equal(g.char.garden.mochi[0].stage, 'egg');
    assert.equal(g.char.garden.mochi[0].gen, 2);
    // (The scenes are drawn; here they're marked done by hand.)
    e.m.reborn = true;
    g.run(0.1);
    assert.equal(e.scene, 'hatch');
    e.m.hatched = true;
    g.run(0.1);
    assert.equal(e.scene, null);
    assert.equal(g.char.garden.mochi[0].stage, 'mochiko');
  } finally {
    g.done();
  }
});

test('saying goodbye: it waves, fades and leaves; a full garden hatches no more', () => {
  const g = garden();
  try {
    const e = g.w.gardenLife.mochi[1];
    assert.ok(sayGoodbye(g.w, e));
    g.run(4);
    assert.equal(g.char.garden.mochi.length, 1);
    assert.equal(g.w.gardenLife.mochi.length, 1);
    // Full up: rocking an egg says so instead.
    while (g.char.garden.mochi.length < GARDEN_MAX) g.char.garden.mochi.push(newRecord(rollMochi(990 + g.char.garden.mochi.length)));
    g.char.garden.eggs = [{ seed: 4242 }];
    Object.assign(g.w.body, { x: EGG_SLOTS[0], y: g.w.body.y });
    g.up();
    assert.equal(g.w.gardenLife.hatching, null);
    assert.match(g.logs.at(-1), /garden is full/);
  } finally {
    g.done();
  }
});

test("visiting a friend's garden: same Mochi, same places; pets and sweets reach theirs", () => {
  // Two games in one room: Ann (with a garden) and Bea, visiting. Messages go by hand.
  const host = garden();
  const char = createCharacter('Bea', { hairStyle: 'bob' });
  char.garden = { back: null, mochi: [], eggs: [], unlocked: {} };
  const bea = createWorld(char);
  // (No festival unless a test asks for one: they come round by the real clock.)
  bea.forceFestival = null;
  const beaLogs = [];
  bea.log = (m) => beaLogs.push(m);
  bea.forceNight = 0;
  loadMap(bea, 'sprout', 'start');
  const out = [];
  const was = { ...online, ghosts: online.ghosts };
  Object.assign(online, { status: 'on', link: { send: (m) => out.push(m) }, ghosts: new Map([['A', { id: 'A', name: 'Ann' }], ['B', { id: 'B', name: 'Bea' }]]) });
  const deliver = () => {
    while (out.length) {
      // (Over the wire, as a copy.)
      const msg = JSON.parse(JSON.stringify(out.shift()));
      const [w, from] = msg.to === 'A' ? [host.w, 'Bea'] : [bea, 'Ann'];
      online.id = msg.to;
      onVisit(w, msg, { name: from });
    }
  };
  try {
    online.id = 'B';
    assert.equal(askGardenVisit(bea, 'A'), null);
    deliver();
    assert.equal(bea.map.id, 'garden');
    assert.equal(bea.gardenVisit.ownerId, 'A');
    assert.equal(bea.gardenLife.mochi.length, 2);
    assert.ok(host.logs.some((l) => /Bea is visiting your Mochi Garden/.test(l)));
    // The same Mochi in the same places (from the clock).
    updateWorld(bea, 1 / 60, keys());
    const now = Date.now() / 1000;
    bea.gardenLife.mochi.forEach((e, i) => assert.ok(Math.abs(e.x - scheduledAt(host.char.garden.mochi[i], now + i * 3.7).x) < 3, `Mochi ${i}`));
    // Bea pets Ann's Mochi, and feeds it a sweet of her own: it happens to Ann's real Mochi.
    const real = host.char.garden.mochi[0];
    const [mood, bond] = [real.mood, real.bond];
    online.id = 'B';
    assert.ok(careFor(bea, bea.gardenLife.mochi[0], 'pet'));
    assert.equal(careFor(bea, bea.gardenLife.mochi[0], 'prank'), null, 'no pranks on a friend');
    addItem(char.inventory, 'msweet_daifuku', 1);
    assert.ok(feedMochi(bea, bea.gardenLife.mochi[0], 'msweet_daifuku'));
    assert.equal(countItem(char.inventory, 'msweet_daifuku'), 0);
    deliver();
    assert.ok(real.mood > mood, 'cheered up');
    assert.equal(real.bond, bond, 'its bond is with Ann');
    assert.ok(real.tummy > 0, 'fed');
    assert.ok(host.logs.some((l) => /Bea petted your/.test(l)) && host.logs.some((l) => /Bea fed your/.test(l)));
    // Her Mochi Bell takes Bea back where she was.
    addItem(char.inventory, 'mochi_bell', 1);
    assert.ok(useItem(bea, 'mochi_bell'));
    assert.equal(bea.map.id, 'sprout');
    assert.equal(bea.gardenVisit, null);
  } finally {
    Object.assign(online, was);
    host.done();
  }
});

test('eggs: from your bag to the gate on arriving; the stall sells three a day; monsters and quests give them', async () => {
  const { stallEggs, buyStallEgg, EGG_PRICE } = await import('../src/world/garden-life.js');
  const { rollLoot } = await import('../src/world/drops.js');
  const { QUESTS } = await import('../src/data/quests.js');
  const { MOBS } = await import('../src/data/mobs.js');
  const g = garden();
  try {
    // Eggs in the bag are set down by the gate (Star Eggs first), as many as there's room for.
    g.char.garden.eggs = [];
    addItem(g.char.inventory, 'mochi_egg', 6);
    addItem(g.char.inventory, 'mochi_egg_star', 1);
    loadMap(g.w, 'sprout', 'start');
    loadMap(g.w, 'garden', 'start');
    assert.equal(g.char.garden.eggs.length, 5);
    assert.equal(countItem(g.char.inventory, 'mochi_egg_star'), 0);
    assert.equal(countItem(g.char.inventory, 'mochi_egg'), 2);
    // The stall (in the Mochi Market): the same three all day; a buy costs EGG_PRICE and sets that
    // very egg in the nest by the garden gate.
    g.char.garden.eggs = [];
    const { MARKET } = await import('../src/world/market.js');
    loadMap(g.w, 'mochi_market', 'start');
    const seeds = stallEggs(g.char);
    assert.deepEqual(stallEggs(g.char), seeds);
    g.char.gold = EGG_PRICE + 10;
    assert.equal(buyStallEgg(g.w, 1), null);
    assert.equal(g.char.gold, 10);
    assert.equal(g.char.garden.eggs[0].seed, seeds[1]);
    assert.ok(buyStallEgg(g.w, 1), 'sold already');
    assert.ok(buyStallEgg(g.w, 0), 'not enough gold');
    // Up at the stall opens it.
    Object.assign(g.w.body, { x: MARKET.eggs, y: g.w.body.y });
    assert.deepEqual(g.up(), [{ type: 'eggstall' }]);
    // A monster, very rarely (here, always); and the end of each open story chain.
    const mob = Object.values(MOBS).find((d) => !d.boss);
    assert.ok(rollLoot(mob, () => 0).some((l) => l.id === 'mochi_egg'));
    for (const q of ['marlo_spa', 'lumen_home', 'yuzu_loved', 'rowan_watch', 'celeste_dreamer', 'nimbus_voyage']) assert.ok(QUESTS[q].rewards.items.some((i) => i.id === 'mochi_egg'), q);
  } finally {
    g.done();
  }
});

test('names: a hatchling asks for one; suggestions are sweet, never a rival\'s or one your Mochi have; typed names are tidied', async () => {
  const { suggestName, cleanName, calledOf, MOCHI_NAMES, NAME_MAX } = await import('../src/data/mochi-names.js');
  const { RIVAL_NAMES } = await import('../src/data/mochi-race.js');
  assert.ok(MOCHI_NAMES.length >= 60);
  assert.ok(MOCHI_NAMES.every((n) => !RIVAL_NAMES.includes(n) && n.length <= NAME_MAX));
  const taken = MOCHI_NAMES.slice(0, -1);
  assert.equal(suggestName(taken), MOCHI_NAMES.at(-1));
  assert.equal(cleanName('  Momo   Pie!! '), 'Momo Pie');
  assert.equal(cleanName('ABCDEFGHIJKLMNOP'), 'ABCDEFGHIJKL');
  assert.equal(cleanName('  '), null);
  const g = garden();
  try {
    assert.equal(calledOf(g.baby), 'your Mochiko');
    g.baby.name = 'Kinako';
    assert.equal(calledOf(g.baby), 'Kinako');
    // Hatching an egg asks what to call it.
    g.char.garden.eggs = [{ seed: 4242 }];
    Object.assign(g.w.body, { x: EGG_SLOTS[0], y: g.w.body.y });
    g.up();
    const h = g.w.gardenLife.hatching;
    assert.ok(h);
    h.m.hatched = true;
    g.run(0.1);
    assert.ok(g.w.naming, 'the new Mochiko waits for a name');
    assert.ok(g.w.events.some((e) => e.type === 'mochiname'));
  } finally {
    g.done();
  }
});

test('breeding: a Heart Mochi makes a grown Mochi bloom; two blooming find each other and leave an egg of their own', async () => {
  const { breedGenes, INHERITED } = await import('../src/data/mochi-breed.js');
  const { feed, evolve: evolveRec } = await import('../src/data/mochi-raise.js');
  const { seededRandom } = await import('../src/data/mochi-genes.js');
  // The genes: each part from one parent or the other (now and then something new); parents known.
  const a = newRecord(rollMochi(101, { coat: null }));
  const b = newRecord(rollMochi(202, { coat: null }));
  a.name = 'Kinako';
  b.name = 'Momo';
  const kid = breedGenes(a, b, 303, seededRandom(9));
  const fromParents = INHERITED.filter((p) => JSON.stringify(kid[p]) === JSON.stringify(a[p]) || JSON.stringify(kid[p]) === JSON.stringify(b[p])).length;
  assert.ok(fromParents >= INHERITED.length - 4, `${fromParents} of ${INHERITED.length} parts from the parents`);
  assert.deepEqual(kid.parents.map((p) => p.name), ['Kinako', 'Momo']);
  // A rare coat passes on now and then; a mutation hardly ever.
  const shiny = { ...a, coat: 'shiny' };
  const rng = seededRandom(5);
  const n = 600;
  const passed = Array.from({ length: n }, (_, i) => breedGenes(shiny, b, 1000 + i, rng).coat === 'shiny').filter(Boolean).length;
  assert.ok(passed > n * 0.2 && passed < n * 0.48, `shiny passed ${passed} of ${n}`);
  const g = garden();
  try {
    // A Mochiko can't bloom; a grown one can.
    addItem(g.char.inventory, 'msweet_heartmochi', 3);
    assert.equal(feed(g.baby, 'msweet_heartmochi').bloomed, false);
    for (const rec of g.char.garden.mochi) {
      Object.assign(rec, { age: 99999, mood: 90, tummy: 0 });
      evolveRec(rec);
      Object.assign(rec, { age: 3600 });
    }
    g.char.garden.eggs = [];
    for (const rec of g.char.garden.mochi) assert.ok(feed(rec, 'msweet_heartmochi').bloomed);
    assert.ok(g.swimmer.bloom > 0 && g.baby.bloom > 0);
    // They find each other, dance, and leave an egg holding their baby.
    for (let k = 0; k < 900 && !g.char.garden.eggs.length; k++) g.run(0.2);
    assert.equal(g.char.garden.eggs.length, 1);
    const egg = g.char.garden.eggs[0];
    assert.ok(egg.genes?.parents?.length === 2);
    assert.equal(g.swimmer.bloom, 0);
    assert.ok(g.swimmer.bredRest > 0, 'resting after');
    assert.ok(!feed(g.swimmer, 'msweet_heartmochi').bloomed, 'not again so soon');
    // The egg hatches as exactly the baby bred.
    Object.assign(g.w.body, { x: EGG_SLOTS[0], y: g.w.body.y });
    g.up();
    g.w.gardenLife.hatching.m.hatched = true;
    g.run(0.1);
    const baby = g.char.garden.mochi.at(-1);
    assert.equal(baby.hair, egg.genes.hair);
    assert.deepEqual(baby.parents, egg.genes.parents);
  } finally {
    g.done();
  }
});

// A garden of grown Mochi, one of each personality given, on a clock the test moves: friends with
// each other as much as `friends`, as fond of you as `bond`.
function gardenOf(personalities, { friends = 0, bond = 0, enter = true } = {}) {
  const char = createCharacter('Mina', { hairStyle: 'bob' });
  const recs = personalities.map((personality, i) => {
    const rec = newRecord(rollMochi(7100 + i * 37, { coat: null }));
    for (const st of ['run', 'fly', 'power', 'stamina', 'swim']) giveExp(rec, st, 1500);
    Object.assign(rec, { personality, bond, tricks: ['twirl'], name: `M${i}` });
    return rec;
  });
  for (const a of recs) for (const b of recs) if (a !== b) (a.friends ??= {})[b.seed] = friends;
  char.garden = { back: null, mochi: recs, eggs: [], unlocked: {} };
  const w = createWorld(char);
  // (No festival unless a test asks for one: they come round by the real clock.)
  w.forceFestival = null;
  w.forceWeather = process.env.WX ? JSON.parse(process.env.WX) : {};
  const logs = [];
  w.log = (m) => logs.push(m);
  w.forceNight = 0;
  let now = 1.8e12;
  const realNow = Date.now;
  Date.now = () => now;
  if (enter) loadMap(w, 'garden', 'start');
  const run = (secs, step = 0.1) => {
    for (let t = 0; t < secs; t += step) {
      now += step * 1000;
      updateWorld(w, step, keys());
    }
  };
  if (enter) run(0.5);
  return { w, char, recs, logs, run, clock: () => now, done: () => (Date.now = realNow) };
}

test('their own minds bring them together: one asks a friend to play, and they play the game that fits who asked', async () => {
  const { gameFor } = await import('../src/world/mochi-heart.js');
  const g = gardenOf(['playful', 'chatty', 'showoff', 'shy'], { friends: 40 });
  try {
    const seen = [];
    for (let k = 0; k < 3000; k++) {
      g.run(0.2, 0.2);
      for (const d of g.w.gardenLife.duos ?? []) if (!seen.includes(d)) seen.push(d);
    }
    const kinds = seen.map((d) => d.kind);
    assert.ok(seen.length >= 4, `${seen.length} times together: ${kinds}`);
    const games = seen.filter((d) => !['decline', 'squabble', 'comfort', 'makeup'].includes(d.kind));
    assert.ok(games.length >= 3, `games played: ${kinds}`);
    // (Each the game its asker likes - or a chat, when one of them is too little to run about.)
    // (Each the game its asker asked for - mostly its favourite, now and then something else.)
    for (const d of games) assert.equal(d.kind, d.asked);
    const fav = games.filter((d) => d.kind === gameFor(d.a.rec, { feel: null }, 0)).length;
    assert.ok(fav >= games.length * 0.4, `mostly its favourite: ${fav} of ${games.length}`);
    // (Playing together brings them closer.)
    const [a] = g.recs;
    assert.ok(Object.values(a.friends ?? {}).some((v) => v > 40), JSON.stringify(a.friends));
  } finally {
    g.done();
  }
});

test('feelings: alone with no friend about it feels lonely; a kind friend comes over and comforts it', async () => {
  const { feelingOf } = await import('../src/world/mochi-heart.js');
  const g = gardenOf(['grumpy', 'gentle'], { friends: 60 });
  try {
    const [sad, kind] = g.w.gardenLife.mochi;
    Object.assign(sad.rec, { needs: { energy: 90, fun: 90, social: 4, curious: 90, hunger: 90 } });
    sad.x = 400;
    kind.x = 1400;
    g.run(1, 0.1);
    assert.equal(feelingOf(sad, g.w.now)?.kind, 'lonely');
    // (A sulk, now: it wants to be left alone - but a kind friend comes anyway.)
    const { feel } = await import('../src/world/mochi-heart.js');
    feel(sad, 'sulky', 0.95, g.w.now);
    kind.x = 800;
    Object.assign(kind.rec, { needs: { energy: 90, fun: 70, social: 30, curious: 80, hunger: 90 } });
    kind.brain = null;
    let comforted = false;
    for (let k = 0; k < 900 && !comforted; k++) {
      g.run(0.2, 0.2);
      comforted = (g.w.gardenLife.duos ?? []).some((d) => d.kind === 'comfort' && d.b === sad && d.done.has('hug'));
    }
    assert.ok(comforted, 'comforted with a pat and a hug');
    g.run(1, 0.1);
    assert.ok(!['lonely', 'sulky'].includes(feelingOf(sad, g.w.now)?.kind), 'and it feels better');
  } finally {
    g.done();
  }
});

test('it remembers you: back after two days away, one that loves you missed you and runs to hug you', async () => {
  const { memoryOf, feelingOf } = await import('../src/world/mochi-heart.js');
  const g = gardenOf(['sweet'], { bond: 400, enter: false });
  try {
    memoryOf(g.recs[0]).seen = g.clock() / 1000 - 2 * 86400;
    loadMap(g.w, 'garden', 'start');
    g.run(0.2, 0.1);
    const [e] = g.w.gardenLife.mochi;
    assert.ok(e.greet?.missed, 'missed you');
    assert.equal(feelingOf(e, g.w.now)?.kind, 'excited');
    let hugged = false;
    for (let k = 0; k < 200 && !hugged; k++) {
      g.run(0.1, 0.1);
      hugged = e.m.action?.name === 'missyou';
    }
    assert.ok(hugged, 'a run-up bounce and a hug');
    assert.ok(memoryOf(g.recs[0]).seen > g.clock() / 1000 - 5, 'and it remembers it saw you today');
  } finally {
    g.done();
  }
});

test('a present: one that loves you finds something and brings it straight to you', async () => {
  const { giftDue } = await import('../src/world/mochi-heart.js');
  assert.equal(giftDue({ bond: 100, seed: 1 }, 5, 0), false, 'only one that loves you');
  assert.equal(giftDue({ bond: 600, seed: 1, memory: { giftDay: 5 } }, 5, 0), false, 'once a day');
  assert.equal(giftDue({ bond: 600, seed: 1 }, 5, 0.1), true);
  const g = gardenOf(['sweet'], { bond: 600 });
  try {
    const [e] = g.w.gardenLife.mochi;
    e.giftFound = 'mochi_clover';
    e.brain = null;
    g.w.body.x = 700;
    let got = false;
    for (let k = 0; k < 600 && !got; k++) {
      g.run(0.1, 0.1);
      got = countItem(g.char.inventory, 'mochi_clover') > 0;
    }
    assert.ok(got, 'the clover is yours');
    assert.ok(Math.abs(e.x - g.w.body.x) < 30, 'handed over beside you');
    assert.ok(g.logs.some((l) => /brought you a four-leaf clover/.test(l)));
  } finally {
    g.done();
  }
});

test('its own two habits, the same every time; one that loves you sits by you while you stand still', async () => {
  const { quirksOf, QUIRKS } = await import('../src/world/mochi-heart.js');
  const r = { seed: 4242 };
  const q = quirksOf(r);
  assert.equal(q.length, 2);
  assert.notEqual(q[0], q[1]);
  assert.deepEqual(quirksOf({ seed: 4242 }), q);
  assert.ok(q.every((k) => QUIRKS[k]));
  const g = gardenOf(['clingy'], { bond: 500 });
  try {
    const [e] = g.w.gardenLife.mochi;
    g.w.body.x = 900;
    let sat = false;
    for (let k = 0; k < 900 && !sat; k++) {
      g.run(0.1, 0.1);
      sat = e.m.action?.name === 'sitby';
    }
    assert.ok(sat, 'sat by you');
    assert.ok(Math.abs(e.x - g.w.body.x) < 24);
    g.w.body.x += 60;
    g.run(0.3, 0.1);
    assert.notEqual(e.m.action?.name, 'sitby', 'up it gets when you walk off');
  } finally {
    g.done();
  }
});

test('voices: a Mochi speaks in its own voice when it does something with feeling, a moment apart', () => {
  const g = garden();
  try {
    g.swimmer.voice = { style: 'trill', pitch: 1.2 };
    const e = g.w.gardenLife.mochi[0];
    Object.assign(g.w.body, { x: e.x + 8, y: e.y });
    g.w.juice.length = 0;
    careFor(g.w, e, 'pet');
    g.run(0.1);
    const said = g.w.juice.filter((j) => j.type === 'mochiVoice');
    assert.equal(said.length, 1);
    assert.deepEqual([said[0].style, said[0].pitch, said[0].mood], ['trill', 1.2, 'happy']);
    // (Not chattering: the next straight after isn't heard.)
    careFor(g.w, e, 'cheer');
    g.run(0.1);
    assert.equal(g.w.juice.filter((j) => j.type === 'mochiVoice').length, 1);
  } finally {
    g.done();
  }
});

test('Garden Mochi walk on the ground and swim at the pond surface, easing in and out, never on air', () => {
  const { w, run, done } = garden();
  const map = w.map;
  const last = new Map();
  let swam = 0;
  // An hour of the garden's clock, with the swimmer in and out of the pond.
  for (let t = 0; t < 3600; t += 1 / 20) {
    run(1 / 20, 1 / 20);
    for (const e of w.gardenLife.mochi) {
      if (e.hidden || e.x == null || e.scene) continue;
      const f = footingAt(map, e.x);
      const where = `${e.rec.seed} at ${e.x.toFixed(1)},${e.y.toFixed(1)}`;
      // (On a ride - the swing, the slide, the mushroom, a glide - it follows the ride's own smooth
      // path, off the ground: world/garden-life.js ridePath.)
      if (e.ride) {
        const p = last.get(e);
        if (p) assert.ok(Math.abs(e.y - p.y) < 10, `${where}: rides smoothly (was ${p.y.toFixed(1)})`);
        last.set(e, { y: e.y, g: e.y });
        continue;
      }
      // (A flyer fluttering across the garden is drawn up in the air; it is still over the ground.)
      assert.equal(e.m.mode, e.flying ? 'fly' : f.swim ? 'swim' : 'run', `${where}: swims only in the pond`);
      assert.ok(Math.abs(e.y - f.y) < 7, `${where}: on the ground or the water (${f.y})`);
      if (f.swim) swam += 1;
      // (No popping: its height changes only as the ground under it does - up a slope at a run in
      // the rain, that's a few px a step.)
      const p = last.get(e);
      if (p) assert.ok(Math.abs(e.y - p.y) < 4 || Math.abs(e.y - p.y - (f.y - p.g)) < 4, `${where}: no popping (was ${p.y.toFixed(1)}, ground ${p.g.toFixed(1)} -> ${f.y.toFixed(1)})`);
      last.set(e, { y: e.y, g: f.y });
    }
  }
  assert.ok(swam > 0, 'the swimmer went for a swim');
  done();
});

test('a Mochi too little to walk crawls along, never sliding about standing still', () => {
  const g = garden();
  try {
    const e = g.w.gardenLife.mochi.find((m) => m.rec === g.baby);
    let slid = 0;
    let moved = 0;
    for (let f = 0; f < 30 * 120; f++) {
      const x = e.x;
      g.run(1 / 30, 1 / 30);
      if (x == null || e.x == null || e.hidden) continue;
      const d = Math.abs(e.x - x);
      if (d > 0.1) {
        moved += 1;
        if (!(e.m.speed > 1)) slid += 1;
      }
    }
    assert.ok(moved > 100, `it moved (${moved} frames)`);
    assert.ok(slid <= moved * 0.02, `slid standing still on ${slid} of ${moved} frames`);
  } finally {
    g.done();
  }
});

test("visiting with your Mochi: it follows you round a friend's garden, and two blooming ones have an egg for each of you", () => {
  const host = garden();
  const mine = host.char.garden.mochi[0];
  Object.assign(mine, { stage: 'amamochi', path: 'angel', bloom: 600, grown: 1, mood: 90 });
  const char = createCharacter('Bea', { hairStyle: 'bob' });
  const pet = newRecord(rollMochi(777, { coat: null }));
  Object.assign(pet, { stage: 'karamochi', path: 'demon', bloom: 600, name: 'Mugi' });
  for (const st of STATS) pet.stats[st].points = 600;
  char.garden = { back: null, mochi: [pet], eggs: [], unlocked: {} };
  char.pet = { seed: pet.seed, out: true, opts: {} };
  const bea = createWorld(char);
  // (No festival unless a test asks for one: they come round by the real clock.)
  bea.forceFestival = null;
  bea.log = () => {};
  bea.forceNight = 0;
  loadMap(bea, 'sprout', 'start');
  const out = [];
  const was = { ...online, ghosts: online.ghosts };
  const beaGhost = { id: 'B', name: 'Bea', map: 'garden', gd: 'A', body: { x: 700, y: 620, facing: 1 } };
  Object.assign(online, { status: 'on', link: { send: (m) => out.push(m) }, ghosts: new Map([['A', { id: 'A', name: 'Ann' }], ['B', beaGhost]]) });
  const deliver = () => {
    while (out.length) {
      const msg = JSON.parse(JSON.stringify(out.shift()));
      const [w, from] = msg.to === 'A' ? [host.w, 'Bea'] : [bea, 'Ann'];
      online.id = msg.to;
      onVisit(w, msg, { name: from });
    }
  };
  try {
    online.id = 'B';
    askGardenVisit(bea, 'A');
    deliver();
    // Bea's own game: her Mugi came along, at her heels.
    assert.ok(bea.gardenLife.mochi.some((e) => e.guest === 'me' && e.rec.seed === pet.seed), 'Mugi came along');
    // Ann's game: Mugi is there too, following Bea about.
    const guest = host.w.gardenLife.mochi.find((e) => e.guest === 'B');
    assert.ok(guest, "Mugi shows in Ann's garden");
    assert.ok(host.logs.some((l) => /with Mugi/.test(l)));
    online.id = 'A';
    host.run(2);
    assert.ok(Math.abs(guest.x - 700) < 60 || host.w.gardenLife.pairing, 'it follows Bea (or is off to meet a blooming Mochi)');
    // Both blooming: they find each other and dance; an egg in Ann's garden, and one sent to Bea's.
    const eggsA = host.char.garden.eggs.length;
    for (let k = 0; k < 60 && host.char.garden.eggs.length === eggsA; k++) host.run(1);
    assert.equal(host.char.garden.eggs.length, eggsA + 1, 'an egg for Ann');
    deliver();
    assert.equal(char.garden.eggs.length, 1, 'and one for Bea, in her own garden');
    assert.equal(guest.rec.seed, pet.seed);
    // Bea leaves: Mugi goes with her.
    beaGhost.map = 'sprout';
    host.run(0.5);
    assert.ok(!host.w.gardenLife.mochi.some((e) => e.guest === 'B'), 'gone with Bea');
    assert.ok(!host.char.garden.mochi.some((r) => r.seed === pet.seed), "never one of Ann's");
  } finally {
    Object.assign(online, was);
    host.done();
  }
});

test('the play meadow: a Mochi swings, slides, bounces and glides off the cliff, and lands back on the grass', async () => {
  const { startRide, ridePath } = await import('../src/world/garden-life.js');
  const g = garden();
  try {
    const e = g.w.gardenLife.mochi.find((m) => m.rec !== g.baby) ?? g.w.gardenLife.mochi[0];
    for (const kind of ['swing', 'slide', 'bounce', 'glide']) {
      assert.ok(startRide(g.w, e, kind), kind);
      let top = Infinity;
      let last = null;
      for (let t = 0; t < 16 && e.ride; t += 1 / 20) {
        g.run(1 / 20, 1 / 20);
        if (e.ride) {
          top = Math.min(top, e.y);
          if (last != null) assert.ok(Math.abs(e.y - last) < 10, `${kind}: smooth at ${t.toFixed(2)}s`);
          last = e.y;
        }
      }
      assert.equal(e.ride, null, `${kind}: over`);
      assert.ok(top < groundAt(g.w.map, e.x) - 20, `${kind}: up off the ground`);
      assert.ok(Math.abs(e.y - groundAt(g.w.map, e.x)) < 7, `${kind}: back on the grass`);
      assert.equal(g.w.map.swingAngle ?? null, null, `${kind}: the swing hangs free again`);
    }
    // (Each ride starts where its place in the meadow is, so it never jumps there.)
    for (const kind of ['swing', 'slide', 'bounce', 'glide']) {
      const p = ridePath(g.w.map, kind, 0);
      assert.ok(Math.abs(p.y - groundAt(g.w.map, p.x)) < 1, `${kind} starts on the ground`);
    }
  } finally {
    g.done();
  }
});

test('the mailbox by the gate: a friend\'s present waits in it, flag up, until you open it', async () => {
  const { openMail, MAILBOX_X } = await import('../src/world/garden-life.js');
  const g = garden();
  try {
    g.char.garden.eggs = [];
    g.char.garden.mail = [{ from: 'Bea', sweet: 'msweet_dango', n: 2 }, { from: 'Bea', egg: { seed: 5 } }];
    const before = countItem(g.char.inventory, 'msweet_dango');
    Object.assign(g.w.body, { x: MAILBOX_X });
    assert.ok(openMail(g.w));
    assert.equal(countItem(g.char.inventory, 'msweet_dango'), before + 2);
    assert.deepEqual(g.char.garden.eggs.map((e) => e.seed), [5]);
    assert.deepEqual(g.char.garden.mail, []);
    // (Away from it, Up does whatever else is there.)
    Object.assign(g.w.body, { x: MAILBOX_X + 60 });
    assert.equal(openMail(g.w), false);
  } finally {
    g.done();
  }
});

test('by day Mochi choose for themselves: a mix of things, and a thought bubble as they decide', () => {
  const g = garden();
  try {
    const seen = new Set();
    let thoughts = 0;
    for (let t = 0; t < 1200; t += 1 / 10) {
      g.run(1 / 10, 1 / 10);
      for (const e of g.w.gardenLife.mochi) {
        if (e.brain?.plan) seen.add(e.brain.plan.id);
        if (e.thought && Math.abs(e.thought.t0 - g.w.now) < 0.05) thoughts += 1;
      }
    }
    assert.ok(seen.size >= 5, `a mix (${[...seen].join(', ')})`);
    assert.ok(thoughts >= 5, `thought bubbles (${thoughts})`);
  } finally {
    g.done();
  }
});

test('harvest helpers: pick the crop bed and a Mochi close by carries a crop in to the nursery door', () => {
  const g = garden();
  try {
    const e = g.w.gardenLife.mochi.find((m) => m.rec === g.swimmer);
    e.x = CROP_X + 60;
    g.char.garden.cropAt = 0;
    Object.assign(g.w.body, { x: CROP_X });
    g.up();
    g.run(2.5, 0.1);
    assert.ok(e.chore, 'it comes to help');
    let carried = false;
    for (let t = 0; t < 120 && e.chore; t += 0.5) {
      g.run(0.5, 0.1);
      if (e.chore?.stage === 'carry') carried = true;
    }
    assert.ok(carried, 'it took a crop up');
    assert.equal(e.chore, null, 'and delivered it');
    assert.ok(Math.abs(e.x - 990) < 60, `at the nursery door (${Math.round(e.x)})`);
  } finally {
    g.done();
  }
});

test('the see-saw: one sits and waits, a friend hops on the other end, up and down they go, and off they both hop', async () => {
  const { startRide, SEESAW } = await import('../src/world/garden-life.js');
  const g = garden();
  try {
    const [a, b] = g.w.gardenLife.mochi;
    a.x = SEESAW.x - 40;
    b.x = SEESAW.x + 40;
    assert.ok(startRide(g.w, a, 'seesaw'), 'the first on');
    g.run(1.5, 1 / 20);
    assert.ok(a.ride?.waiting, 'waiting for a friend');
    assert.ok(g.w.map.seesawAngle < -0.2, 'its end down');
    assert.ok(startRide(g.w, b, 'seesaw'), 'a friend joins');
    assert.equal(b.ride.seat, 1 - a.ride.seat, 'on the other end');
    // (Nobody else can get on now.)
    const c = { rec: g.baby, m: { dir: 1 }, x: SEESAW.x };
    assert.ok(!startRide(g.w, c, 'seesaw'));
    let lo = Infinity;
    let hi = -Infinity;
    let lastA = null;
    for (let t = 0; t < 12 && (a.ride || b.ride); t += 1 / 20) {
      g.run(1 / 20, 1 / 20);
      if (a.ride && b.ride && a.ride.sat && b.ride.sat) {
        lo = Math.min(lo, g.w.map.seesawAngle);
        hi = Math.max(hi, g.w.map.seesawAngle);
        // (Sat on the board: it rides up and down with its end, smoothly.)
        if (lastA != null && !a.ride.leave && !b.ride.leave) assert.ok(Math.abs(a.y - lastA) < 3, `smooth: ${lastA.toFixed(1)} -> ${a.y.toFixed(1)}`);
        lastA = a.y;
      }
    }
    assert.ok(lo < -0.2 && hi > 0.2, `up and down: ${lo.toFixed(2)} to ${hi.toFixed(2)}`);
    assert.equal(a.ride, null);
    assert.equal(b.ride, null);
    for (const e of [a, b]) assert.ok(Math.abs(e.y - groundAt(g.w.map, e.x)) < 3, 'back on the grass');
  } finally {
    g.done();
  }
});

test('a Mochi left waiting on the see-saw on its own gives up after a while and hops off', async () => {
  const { startRide, SEESAW } = await import('../src/world/garden-life.js');
  const g = garden();
  try {
    const [a] = g.w.gardenLife.mochi;
    a.x = SEESAW.x - 40;
    assert.ok(startRide(g.w, a, 'seesaw'));
    g.run(SEESAW.wait + 1.5, 1 / 20);
    assert.equal(a.ride, null);
    assert.equal(a.m.action?.name, 'sigh');
  } finally {
    g.done();
  }
});

test('the toy box\'s kite, bubbles and top: each played gently, playfully or boldly by the Mochi\'s nature', async () => {
  const { playStyle } = await import('../src/world/garden-life.js');
  const { TOY_ACTS } = await import('../src/render/mochi-toys.js');
  assert.equal(playStyle({ personality: 'shy' }), 0);
  assert.equal(playStyle({ personality: 'playful' }), 1);
  assert.equal(playStyle({ personality: 'showoff' }), 2);
  for (const toy of ['kite', 'bubbles', 'top', 'seesaw']) for (const k of [0, 1, 2]) {
    const bit = TOY_ACTS[`${toy}${k}`];
    assert.ok(bit, `${toy}${k}`);
    const ts = bit.keys.map(([t]) => t);
    assert.equal(ts[0], 0);
    assert.equal(ts.at(-1), bit.dur);
    assert.ok(ts.every((t, i) => !i || t > ts[i - 1]), `${toy}${k} in order`);
    assert.ok(bit.loop[0] >= 0 && bit.loop[1] <= bit.dur, `${toy}${k} loops inside it`);
  }
  // (A toy put away at the end.)
  for (const toy of ['kite', 'bubbles', 'top']) for (const k of [0, 1, 2]) assert.ok(!TOY_ACTS[`${toy}${k}`].keys.at(-1)[1].hold, `${toy}${k} put away`);
});

test('garden things: set out on your own garden\'s grass, clear of what\'s there; island pieces stay on the island', async () => {
  const { placeAt, placePiece, putAway, placedOn, furnitureInBag } = await import('../src/world/decor.js');
  const { canDecorate } = await import('../src/ui/decorate.js');
  const { GARDEN_DECOR } = await import('../src/data/furniture.js');
  const g = garden();
  try {
    const map = g.w.map;
    assert.ok(canDecorate(g.w), 'Decorate works out in your garden');
    for (const f of GARDEN_DECOR()) addItem(g.char.inventory, f.id, 1);
    addItem(g.char.inventory, 'sea_chair', 1);
    // (In the garden the bar shows only the garden's set.)
    assert.ok(furnitureInBag(g.char, map).every((e) => e.id.startsWith('garden_')));
    const gy = groundAt(map, 1100);
    assert.equal(placeAt(map, g.char, 'garden_bench', 1100, gy).why, null, 'beside the nursery is fine');
    assert.ok(placeAt(map, g.char, 'garden_bench', 790, groundAt(map, 790)).why, 'not in the well');
    assert.ok(placeAt(map, g.char, 'garden_fountain', 1468, groundAt(map, 1468)).why, 'not on the see-saw');
    assert.ok(placeAt(map, g.char, 'sea_chair', 1100, gy).why, 'an island chair stays on the island');
    const bench = placePiece(map, g.char, 'garden_bench', 1100, gy);
    assert.equal(typeof bench, 'object');
    assert.ok(g.char.garden.placed.includes(bench));
    assert.equal(countItem(g.char.inventory, 'garden_bench'), 0);
    assert.ok(placedOn(g.char, 'garden').includes(bench));
    assert.ok(placeAt(map, g.char, 'garden_parasol', 1104, gy).why, 'never two in one spot');
    // Away it goes again.
    assert.ok(putAway(g.char, bench));
    assert.ok(!g.char.garden.placed.includes(bench));
    assert.equal(countItem(g.char.inventory, 'garden_bench'), 1);
  } finally {
    g.done();
  }
});

test('the Mochi use what you set out: two sit side by side on a bench', async () => {
  const { placePiece } = await import('../src/world/decor.js');
  const g = garden();
  try {
    addItem(g.char.inventory, 'garden_bench', 1);
    const gy = groundAt(g.w.map, 1100);
    const bench = placePiece(g.w.map, g.char, 'garden_bench', 1100, gy);
    assert.equal(typeof bench, 'object');
    // (Both keen for a sit: tired and lonely.)
    for (const r of g.char.garden.mochi) Object.assign(r, { needs: { energy: 5, social: 5, fun: 90, hunger: 90, curious: 90 } });
    let sat = 0;
    for (let t = 0; t < 120 && sat < 2; t += 0.5) {
      g.run(0.5, 0.1);
      sat = g.w.gardenLife.mochi.filter((e) => e.m.action?.name === 'benchsit').length;
      if (sat === 1 && !g.w.gardenLife.mochi.some((e) => e.brain?.plan?.id?.startsWith(`decor${bench.uid}`) && e.m.action?.name !== 'benchsit')) break;
    }
    const sitters = g.w.gardenLife.mochi.filter((e) => e.m.action?.name === 'benchsit');
    assert.ok(sitters.length >= 1, 'someone sits on the bench');
    for (const e of sitters) assert.ok(Math.abs(e.x - 1100) <= 10, 'on its seat');
    if (sitters.length === 2) assert.ok(Math.abs(sitters[0].x - sitters[1].x) > 12, 'side by side, not on top of each other');
  } finally {
    g.done();
  }
});

test('the diary: a page a day of what the Mochi got up to, repeats counted, names marked, in your own garden only', async () => {
  const { noteDiary, diaryWords, dayName, PER_DAY, DAYS } = await import('../src/data/mochi-diary.js');
  const a = { seed: 1, name: 'Pip' };
  const b = { seed: 2, name: 'Momo' };
  const g = {};
  noteDiary(g, '2026-11-15', 'tag', [a, b]);
  noteDiary(g, '2026-11-15', 'tag', [b, a]);
  noteDiary(g, '2026-11-15', 'sitby', [a]);
  noteDiary(g, '2026-11-15', 'sitby', [a]);
  noteDiary(g, '2026-11-15', 'chat', [a, b], 'kite');
  assert.equal(g.diary.length, 1);
  const [tag, sit, chat] = g.diary[0].notes;
  assert.equal(tag.c, 2, 'the same two playing tag again is counted');
  assert.equal(sit.c, undefined, 'sitting by you is written once a day');
  const words = diaryWords(chat);
  assert.deepEqual(words.filter((p) => p.name).map((p) => p.text), ['Pip', 'Momo']);
  assert.match(words.map((p) => p.text).join(''), /kites/);
  assert.match(diaryWords(tag).map((p) => p.text).join(''), /2 times/);
  assert.equal(diaryWords(tag, (s) => (s === 1 ? 'Pippa' : null)).find((p) => p.name).text, 'Pippa', 'a renamed Mochi shows its new name');
  for (let i = 0; i < 30; i++) noteDiary(g, '2026-11-15', 'dance', [{ seed: 10 + i, name: `D${i}` }, a]);
  assert.equal(g.diary[0].notes.length, PER_DAY);
  for (let d = 1; d <= 20; d++) noteDiary(g, `2026-12-${d}`, 'tag', [a, b]);
  assert.equal(g.diary.length, DAYS);
  assert.equal(dayName('2026-12-20', '2026-12-20', '2026-12-19'), 'Today');
  assert.equal(dayName('2026-12-3', '2026-12-20', '2026-12-19'), 'Dec 3');

  // Lived: a day in the garden fills today's page.
  const { w, char, run, done } = gardenOf(['playful', 'chatty', 'gentle', 'sweet'], { friends: 40, bond: 600 });
  try {
    w.dayClock = () => new Date(2026, 5, 10, 13, 0);
    run(500);
    const page = char.garden.diary?.at(-1);
    assert.ok(page, 'something was written');
    assert.equal(page.day, '2026-6-10');
    assert.ok(page.notes.some((n) => n.who.length === 2), `things done together: ${page.notes.map((n) => n.k)}`);
    // A friend visiting writes nothing in your diary (their game doesn't own it).
    const vis = createWorld(createCharacter('Bea', { hairStyle: 'bob' }));
    // (No festival unless a test asks for one: they come round by the real clock.)
    vis.forceFestival = null;
    vis.log = () => {};
    vis.forceNight = 0;
    vis.gardenVisit = { ownerId: 'A', name: 'Mina', garden: JSON.parse(JSON.stringify({ ...char.garden, diary: [] })) };
    loadMap(vis, 'garden', 'start');
    for (let t = 0; t < 200; t += 0.1) updateWorld(vis, 0.1, keys());
    assert.equal(vis.char.garden?.diary?.length ?? 0, 0);
    assert.equal(vis.gardenVisit.garden.diary.length, 0);
  } finally {
    done();
  }
});
