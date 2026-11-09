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

test('the crop bed gives crops when ripe, then grows again', () => {
  const g = garden();
  try {
    Object.assign(g.w.body, { x: CROP_X, y: 700 });
    g.up();
    assert.equal(countItem(g.char.inventory, 'mochi_rice'), 3);
    g.up();
    assert.equal(countItem(g.char.inventory, 'mochi_rice'), 3, 'not ripe yet');
    g.run(CROP_GROW + 1, 1);
    Object.assign(g.w.body, { x: CROP_X, y: 700 });
    g.up();
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
    // The stall: the same three all day; a buy costs EGG_PRICE and sets that very egg by the gate.
    g.char.garden.eggs = [];
    const seeds = stallEggs(g.char);
    assert.deepEqual(stallEggs(g.char), seeds);
    g.char.gold = EGG_PRICE + 10;
    assert.equal(buyStallEgg(g.w, 1), null);
    assert.equal(g.char.gold, 10);
    assert.equal(g.char.garden.eggs[0].seed, seeds[1]);
    assert.ok(buyStallEgg(g.w, 1), 'sold already');
    assert.ok(buyStallEgg(g.w, 0), 'not enough gold');
    // Up at the stall opens it.
    Object.assign(g.w.body, { x: 330, y: g.w.body.y });
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
    Object.assign(g.w.body, { x: 404, y: g.w.body.y });
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
    Object.assign(g.w.body, { x: 404, y: g.w.body.y });
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

test('personality in play: moments that fit who starts them, the same for a visitor', async () => {
  const { momentOf } = await import('../src/world/garden-life.js');
  const { PERSONALITIES } = await import('../src/data/mochi-genes.js');
  const KINDS = ['chase', 'hide', 'parade', 'nap', 'huff', 'chat'];
  assert.ok(PERSONALITIES.every((p) => KINDS.includes(momentOf(p))));
  // Two gardens of the same Mochi on the same clock: the owner's, and a visitor's.
  const g = garden();
  try {
    g.swimmer.personality = 'playful';
    g.baby.personality = 'sleepy';
    const visitor = createWorld(createCharacter('Bea', { hairStyle: 'bob' }));
    visitor.log = () => {};
    visitor.forceNight = 0;
    visitor.gardenVisit = { ownerId: 'A', name: 'Mina', garden: JSON.parse(JSON.stringify(g.char.garden)) };
    loadMap(visitor, 'garden', 'start');
    const seen = [];
    const seenV = [];
    const note = (w, list) => {
      const mo = w.gardenLife.moment;
      if (mo && list.at(-1)?.t0 !== mo.t0) list.push({ t0: Math.round(mo.t0), kind: mo.kind, who: mo.a.rec.personality });
    };
    for (let k = 0; k < 6000; k++) {
      g.run(0.2, 0.2);
      updateWorld(visitor, 0.2, keys());
      note(g.w, seen);
      note(visitor, seenV);
    }
    assert.ok(seen.length >= 3, `${seen.length} moments`);
    for (const m of seen) assert.ok(m.kind === momentOf(m.who) || m.kind === 'snub', JSON.stringify(m));
    assert.deepEqual(seenV.map((m) => [m.t0, m.kind, m.who]), seen.map((m) => [m.t0, m.kind, m.who]), 'the visitor sees the same');
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
