// Raising a Mochi (data/mochi-raise.js): levels and points by grade, sweets and care,
// the lean, evolving and rebirth.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rollMochi, STATS } from '../src/data/mochi-genes.js';
import { TRICKS, TRICK_OF, CANT_POINTS, canDo, rescue, canAscend, ASCEND, trendOf, HUNGER, TREND, TUMMY, styleOf, STYLE_POINTS, newRecord, giveExp, expToNext, GRADE_POINTS, MAX_LEVEL, feed, care, tick, leanOf, canEvolve, evolve, EVOLVE, canRebirth, rebirth, REBIRTH, MOCHI_SWEETS, SWEET_BY_ID, GARDEN_CROPS, totalLevels, bestStat, CARE_EXP_EVERY } from '../src/data/mochi-raise.js';
import { SWEET_KINDS } from '../src/render/mochi-sweets.js';
import { ITEMS } from '../src/data/items.js';
import { runStyle, CANT, IDLE_BITS } from '../src/render/mochi-anim.js';

const half = () => 0.5; // (no give or take on level-up points)
const fresh = (seed = 7, force = {}) => newRecord(rollMochi(seed, { coat: null, ...force }));

test('a fresh Mochiko: Lv 1 everywhere at its talent grades, content', () => {
  const r = fresh();
  assert.equal(r.stage, 'mochiko');
  for (const s of STATS) {
    assert.equal(r.stats[s].level, 1);
    assert.equal(r.stats[s].grade, r.talents[s]);
    assert.equal(r.stats[s].points, 0);
  }
  assert.equal(r.mood, 60);
  assert.equal(r.lean, 0);
});

test('each level adds its grade\'s points, and Lv 99 is where it stops', () => {
  for (const grade of Object.keys(GRADE_POINTS)) {
    const r = fresh();
    r.stats.run.grade = grade;
    giveExp(r, 'run', 1e7, half);
    assert.equal(r.stats.run.level, MAX_LEVEL);
    assert.equal(r.stats.run.points, (MAX_LEVEL - 1) * GRADE_POINTS[grade]);
    assert.equal(giveExp(r, 'run', 500, half), 0);
  }
  // An S stat at Lv 99 reaches the top running style; an E one the steady run.
  const s = fresh();
  s.stats.run.grade = 'S';
  giveExp(s, 'run', 1e7, half);
  assert.equal(runStyle(s.stats.run.points), 5);
  const e = fresh();
  e.stats.run.grade = 'E';
  giveExp(e, 'run', 1e7, half);
  assert.equal(runStyle(e.stats.run.points), 2);
});

test('levels take a little more exp each time', () => {
  const r = fresh();
  giveExp(r, 'swim', expToNext(1) - 1, half);
  assert.equal(r.stats.swim.level, 1);
  giveExp(r, 'swim', 1, half);
  assert.equal(r.stats.swim.level, 2);
  assert.ok(expToNext(50) > expToNext(10));
});

test('a happy Mochi learns faster than a glum one', () => {
  const happy = fresh();
  const glum = fresh();
  happy.mood = 100;
  glum.mood = 0;
  feed(happy, 'msweet_ohagi', half);
  feed(glum, 'msweet_ohagi', half);
  assert.ok(happy.grown > glum.grown * 2);
});

test('its favourite trains more and delights it; the one it hates trains less and sulks it', () => {
  const g = rollMochi(11, { coat: null });
  const loved = MOCHI_SWEETS.find((s) => s.kind === g.loves);
  const hated = MOCHI_SWEETS.find((s) => s.kind === g.hates);
  const a = newRecord(g);
  const b = newRecord(g);
  const ra = feed(a, loved.id, half);
  const rb = feed(b, hated.id, half);
  assert.equal(ra.action, 'eat');
  assert.ok(ra.loved);
  assert.equal(rb.action, 'hated');
  assert.ok(a.mood > 60 && b.mood < 60);
  const exp = (sw, r) => Object.keys(sw.trains).reduce((n, s) => n + r.stats[s].exp + (r.stats[s].level - 1) * 30, 0);
  assert.ok(exp(loved, a) > exp(hated, b));
});

test('sweet treats lean it angel and spicy ones demon; the sprout shows it past the line', () => {
  const r = fresh();
  for (let i = 0; i < 15; i++) {
    r.tummy = 0;
    feed(r, 'msweet_dango', half);
  }
  assert.equal(leanOf(r), 'angel');
  const d = fresh();
  for (let i = 0; i < 8; i++) {
    d.tummy = 0;
    feed(d, 'msweet_senbei', half);
  }
  assert.equal(leanOf(d), 'demon');
  for (let i = 0; i < 8; i++) care(d, 'prank', half);
  assert.ok(d.lean < -0.6);
});

test('care pleases it more if it likes that kind of thing, and sulks it if not', () => {
  const clingy = fresh(3, { personality: 'clingy' });
  const loner = fresh(3, { personality: 'loner' });
  const a = care(clingy, 'pet');
  const b = care(loner, 'pet');
  assert.equal(a.action, 'pet');
  assert.equal(b.action, 'sulk');
  assert.ok(clingy.mood > 70 && loner.mood < 60);
  // A prank on a mischief-maker is a laugh.
  assert.equal(care(fresh(4, { personality: 'mischief' }), 'prank').action, 'cheer');
});

test('mood drifts back to content over time, and it ages', () => {
  const r = fresh();
  r.mood = 100;
  tick(r, 3600);
  assert.ok(r.mood < 100 && r.mood >= 60);
  assert.equal(r.age, 3600);
});

test('it evolves once grown, old enough and happy, onto the path it leans, its best grade up', () => {
  const r = fresh(21);
  for (const s of STATS) r.stats[s].grade = 'C';
  assert.equal(canEvolve(r), false);
  for (let i = 0; i < 200; i++) {
    r.tummy = 0;
    feed(r, 'msweet_sakuramochi', half);
  }
  for (const s of STATS) giveExp(r, s, 500, half);
  r.age = EVOLVE.age;
  r.mood = 80;
  assert.ok(totalLevels(r) >= EVOLVE.levels);
  assert.equal(canEvolve(r), true);
  const best = bestStat(r);
  const out = evolve(r, () => 0.99);
  assert.equal(out.path, 'angel');
  assert.equal(r.stage, 'amamochi');
  assert.deepEqual(out.raised, [best]);
  assert.equal(r.stats[best].grade, 'B');
  assert.equal(canEvolve(r), false);
});

test('rebirth: back to an egg a generation on, grades up where it trained hard, bond kept', () => {
  const r = fresh(31);
  for (const s of STATS) r.stats[s].grade = 'D';
  giveExp(r, 'run', 1e7, half);
  giveExp(r, 'fly', 3000, half);
  evolve(r, () => 0.99);
  r.age = REBIRTH.age;
  r.mood = 90;
  r.bond = 400;
  const before = r.stats.run.grade;
  assert.equal(canRebirth(r), true);
  const { egg, raised } = rebirth(r, () => 0.99);
  assert.equal(egg.stage, 'egg');
  assert.equal(egg.gen, 2);
  assert.equal(egg.bond, 400);
  assert.equal(egg.path, null);
  assert.ok(raised.includes('run'));
  assert.equal(egg.stats.run.grade, ['E', 'D', 'C', 'B', 'A', 'S'][['E', 'D', 'C', 'B', 'A', 'S'].indexOf(before) + 1]);
  assert.equal(egg.stats.run.level, 1);
  assert.equal(egg.stats.run.points, Math.round(r.stats.run.points * 0.1));
  assert.equal(egg.hairStyle, r.hairStyle);
});

test('every sweet has a prop to hold, trains real stats, and is made from things that exist', () => {
  for (const sw of MOCHI_SWEETS) {
    assert.ok(SWEET_KINDS.includes(sw.kind), `${sw.name}: no prop "${sw.kind}"`);
    for (const s of Object.keys(sw.trains)) assert.ok(STATS.includes(s), `${sw.name}: ${s}`);
    for (const item of Object.keys(sw.needs)) assert.ok(ITEMS[item] || GARDEN_CROPS[item], `${sw.name}: no item ${item}`);
    assert.equal(SWEET_BY_ID[sw.id], sw);
  }
});

test('a full tummy says no; it empties again with time', () => {
  const r = fresh();
  for (let i = 0; i < 4; i++) assert.equal(feed(r, 'msweet_dango', half).refused, undefined);
  const out = feed(r, 'msweet_dango', half);
  assert.equal(out.refused, true);
  assert.equal(out.action, 'full');
  tick(r, TUMMY.empty / 2);
  assert.ok(!feed(r, 'msweet_dango', half).refused);
});

test('it reports levels gained and each new way of moving, to celebrate', () => {
  const r = fresh();
  r.stats.swim.grade = 'S';
  giveExp(r, 'swim', 352, half); // (11 levels: 275 points, just short of the next style)
  const pts = r.stats.swim.points;
  assert.equal(styleOf(pts), 0);
  r.stats.swim.exp = 0;
  let out;
  do {
    r.tummy = 0;
    out = feed(r, 'msweet_taiyaki', half);
  } while (!out.styleUps.length);
  assert.ok(out.levels >= 1);
  assert.deepEqual(out.styleUps[0], { stat: 'swim', from: 0, to: 1 });
  assert.ok(r.stats.swim.points >= STYLE_POINTS[1]);
});

test('the movement styles here match the animations', () => {
  for (let p = 0; p < 2600; p += 50) assert.equal(styleOf(p), runStyle(p));
});

test('it grows into what it has been raised on lately; raised evenly, the plain form', () => {
  const r = fresh(41);
  for (let i = 0; i < 30; i++) giveExp(r, 'run', 100, half);
  tick(r, TREND.half * 6); // (long ago now)
  for (let i = 0; i < 10; i++) giveExp(r, 'swim', 100, half);
  assert.equal(trendOf(r).stat, 'swim');
  r.age = EVOLVE.age;
  r.mood = 80;
  const out = evolve(r, () => 0.99);
  assert.equal(out.form, 'swim');
  assert.deepEqual(out.raised, ['swim']);
  const even = fresh(42);
  for (const s of STATS) giveExp(even, s, 600, half);
  assert.equal(trendOf(even).plain, true);
  assert.equal(evolve(even, () => 0.99).form, 'plain');
});

test('an empty tummy for a while makes it hungry and glum; feeding it puts that right', () => {
  const r = fresh();
  tick(r, HUNGER.after + 60);
  assert.equal(r.hungry, true);
  const mood = r.mood;
  tick(r, 1800);
  assert.ok(r.mood < mood);
  feed(r, 'msweet_dango', half);
  assert.equal(r.hungry, false);
});

test('each sweet teaches a trick the first time, and every trick has its animation', () => {
  const r = fresh();
  const out = feed(r, 'msweet_dango', half);
  assert.equal(out.learned, 'roll');
  r.tummy = 0;
  assert.equal(feed(r, 'msweet_dango', half).learned, null);
  assert.deepEqual(r.tricks, ['roll']);
  for (const t of TRICKS) assert.ok(IDLE_BITS[t], `no animation for ${t}`);
  for (const id of Object.keys(TRICK_OF)) assert.ok(SWEET_BY_ID[id], `no sweet ${id}`);
});

test('a newborn cannot walk, swim or fly yet, until it trains a little; lifting it out of water pleases it', () => {
  const r = fresh();
  for (const s of ['run', 'swim', 'fly']) assert.equal(canDo(r, s), false);
  assert.deepEqual(CANT_POINTS, CANT);
  r.stats.swim.points = CANT_POINTS.swim;
  assert.equal(canDo(r, 'swim'), true);
  const mood = r.mood;
  rescue(r);
  assert.ok(r.mood > mood);
});

test('a third-life Mochi, very happy, every trick learned, raised evenly, becomes a Tsukimochi and lives forever', () => {
  const r = fresh(51);
  r.gen = ASCEND.gen;
  r.tricks = [...TRICKS];
  for (const s of STATS) giveExp(r, s, 900, half);
  r.age = EVOLVE.age;
  r.mood = 95;
  assert.equal(canAscend(r), true);
  const out = evolve(r, half);
  assert.equal(out.stage, 'tsukimochi');
  assert.equal(r.immortal, true);
  r.age = REBIRTH.age;
  assert.equal(canRebirth(r), false);
  // One trick short, or a second life, and it evolves as usual.
  const s2 = fresh(52);
  s2.gen = 2;
  s2.tricks = [...TRICKS];
  for (const s of STATS) giveExp(s2, s, 900, half);
  assert.equal(canAscend(s2), false);
});

test('raising is a grind: care teaches only now and then, and a tummy takes an hour to empty', () => {
  const r = newRecord(rollMochi(77, { coat: null }));
  for (let i = 0; i < 200; i++) care(r, 'play');
  const after = r.stats.run.points + r.stats.run.exp;
  assert.ok(after > 0, 'the first play teaches a little');
  for (let i = 0; i < 200; i++) care(r, 'play');
  assert.equal(r.stats.run.points + r.stats.run.exp, after, 'clicking away teaches nothing more');
  tick(r, CARE_EXP_EVERY);
  care(r, 'play');
  assert.ok(r.stats.run.points + r.stats.run.exp > after, 'ten minutes on, it learns again');
  assert.equal(TUMMY.empty, 3600);
});
