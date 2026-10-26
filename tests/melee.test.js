// Melee combos: basic attacks chain through a weapon's steps into a finisher, blows land as the
// blade cuts (not when the key is pressed), launchers pop monsters up, the warrior's combo skills
// carry on step by step, and once a blow lands you can move or cut in with a skill.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { createCharacter, gainExp, advanceJob } from '../src/core/character.js';
import { makeEquip } from '../src/core/items.js';
import { spawnMob } from '../src/world/mobs.js';
import { COMBOS } from '../src/world/melee.js';
import { cast } from '../src/world/combat.js';

const DT = 1 / 60;
const idle = { held: new Set(), pressed: new Set(), locked: false };

// A level 25 warrior in Mossy Woods with a row of very sturdy boars in front.
function arena(weapon = 'sword_20') {
  const c = createCharacter('W', {});
  gainExp(c, 1e6);
  advanceJob(c, 'warrior');
  c.equipment.weapon = makeEquip(weapon, {});
  const w = createWorld(c);
  loadMap(w, 'woods', 'west');
  w.god = true;
  w.spawner.slots = [];
  w.mobs = [];
  for (const x of [330, 350, 370]) {
    const m = spawnMob(w.map, { mob: 'boarlet', x, y: w.map.groundY });
    m.def = { ...m.def, hp: 1e9, eva: 0, aggro: false, speed: 0 };
    m.hp = 1e9;
    w.mobs.push(m);
  }
  Object.assign(w.body, { x: 300, y: w.map.groundY, facing: 1, onGround: true });
  for (let i = 0; i < 10; i++) updateWorld(w, DT, idle);
  return w;
}

const run = (w, seconds, input = idle) => {
  for (let i = 0; i < seconds * 60; i++) updateWorld(w, DT, input);
};

test('holding attack with a sword chains the whole combo, ending in the finisher', () => {
  const w = arena();
  const seen = [];
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  for (let i = 0; i < 120; i++) {
    updateWorld(w, DT, hold);
    if (w.pose && seen.at(-1) !== w.pose.kind) seen.push(w.pose.kind);
  }
  assert.deepEqual(seen.slice(0, 4), COMBOS.sword.map((s) => s.move));
});

test('a blow lands when the blade cuts, and you step into it', () => {
  const w = arena();
  const m = w.mobs[0];
  const x = w.body.x;
  updateWorld(w, DT, { held: new Set(), pressed: new Set(['KeyZ']), locked: false });
  assert.equal(m.hp, 1e9, 'nothing yet, still winding up');
  run(w, 0.25);
  assert.ok(m.hp < 1e9, 'the cut landed');
  assert.ok(w.body.x > x, 'stepped forward');
});

test('pauses reset the combo, and taps mid-swing are remembered', () => {
  const w = arena();
  const tap = { held: new Set(), pressed: new Set(['KeyZ']), locked: false };
  updateWorld(w, DT, tap);
  run(w, 0.1);
  updateWorld(w, DT, tap); // mid-swing: buffered
  run(w, 0.5);
  assert.equal(w.combo, 1, 'the buffered tap became the second step');
  run(w, 1.5);
  updateWorld(w, DT, tap);
  assert.equal(w.combo, 0, 'a long pause starts over');
});

test('finishers and launchers knock monsters up into the air', () => {
  const w = arena();
  w.char.skills.powerslash = 10;
  w.char.mp = 999;
  const hits = (id) => {
    w.attackTimer = 0;
    w.lockTimer = 0;
    w.skillReadyAt = 0;
    assert.ok(cast(w, id).ok);
  };
  hits('powerslash'); // cross-cut
  run(w, 0.5);
  hits('powerslash'); // launcher
  let air = 0;
  for (let i = 0; i < 40; i++) {
    updateWorld(w, DT, idle);
    air = Math.max(air, ...w.mobs.map((m) => m.air ?? 0));
  }
  assert.ok(air > 30, `launched (${Math.round(air)}px)`);
  assert.equal(w.chains.powerslash.i, 1);
  hits('powerslash'); // the dive
  assert.equal(w.pose.kind, 'plunge');
});

test('Titan Breaker lands three heavy blows in one go', () => {
  const w = arena('axe_20');
  w.char.skills.titanbreaker = 10;
  w.char.mp = 999;
  const m = w.mobs[0];
  assert.ok(cast(w, 'titanbreaker').ok);
  const marks = [];
  let last = m.hp;
  for (let i = 0; i < 90; i++) {
    updateWorld(w, DT, idle);
    if (m.hp < last) marks.push(i);
    last = m.hp;
  }
  assert.equal(marks.length, 3, `three blows (at frames ${marks})`);
});

test('once a blow lands, moving cuts the follow-through short and skills can cut in', () => {
  const w = arena();
  w.char.skills.powerslash = 5;
  w.char.mp = 999;
  updateWorld(w, DT, { held: new Set(), pressed: new Set(['KeyZ']), locked: false });
  run(w, 0.05);
  const x = w.body.x;
  updateWorld(w, DT, { held: new Set(['ArrowLeft']), pressed: new Set(), locked: false });
  assert.ok(w.attackTimer > 0, 'still winding up: no cancel before the blow');
  run(w, 0.2);
  assert.equal(cast(w, 'powerslash').ok, true, 'a skill cuts into the recovery');
  run(w, 0.6);
  for (let i = 0; i < 20; i++) updateWorld(w, DT, { held: new Set(['ArrowLeft']), pressed: new Set(), locked: false });
  assert.ok(w.body.x < x, 'walking away after the blows');
});

// A level 25 archer in Mossy Woods with sturdy boars a little way off.
function range(weapon = 'bow_20') {
  const w = arena(weapon);
  w.char.job = 'archer';
  w.mobs.forEach((m, i) => (m.x = 420 + i * 30));
  return w;
}

test('bow shots chain into a combo, fly to their target, and land when they arrive', () => {
  const w = range();
  const m = w.mobs[0];
  const x = w.body.x;
  const seen = [];
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  let firstHit = null;
  for (let i = 0; i < 120; i++) {
    updateWorld(w, DT, hold);
    if (w.pose && seen.at(-1)?.step !== w.combo) seen.push({ step: w.combo, move: w.pose.kind });
    if (firstHit == null && m.hp < 1e9) firstHit = i;
  }
  assert.deepEqual(seen.slice(0, 3).map((s) => s.move), COMBOS.bow.map((s) => s.move));
  assert.ok(firstHit > 16, `the arrow took time to arrive (frame ${firstHit})`);
  assert.ok(w.body.x < x, 'hopped back while shooting');
});

test('the finishing arrow pierces the whole line', () => {
  const w = range();
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  for (let i = 0; i < 150; i++) updateWorld(w, DT, hold);
  assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 3, 'all three in the line got hit');
});

test("the archer's skills: Rapid Fire, Arrow Fan, Arrow Rain, Backflip Shot", () => {
  const w = range();
  Object.assign(w.char.skills, { doubleshot: 10, scattershot: 10, arrowrain: 10, backflip: 5 });
  w.char.mp = 9999;
  const go = (id) => {
    w.attackTimer = 0;
    w.lockTimer = 0;
    w.skillReadyAt = 0;
    w.recoverAt = null;
    assert.ok(cast(w, id).ok, id);
  };
  const hurt = () => w.mobs.filter((m) => m.hp < 1e9).length;
  go('scattershot');
  run(w, 0.8);
  assert.equal(hurt(), 3, 'one arrow for each monster');
  w.mobs.forEach((m) => (m.hp = 1e9));
  go('arrowrain');
  run(w, 1.3);
  assert.equal(hurt(), 3, 'the rain fell on all of them');
  for (let i = 0; i < 3; i++) {
    go('doubleshot');
    run(w, 0.5);
  }
  assert.equal(w.chains.doubleshot.i, 2, 'three presses, three parts');
  const x = w.body.x;
  go('backflip');
  assert.ok(w.invuln > 0, 'untouchable mid-flip');
  run(w, 0.5);
  assert.ok(w.body.x < x - 60, 'flipped back');
});

test("skills can't be spammed back to back, even by moving, but basic attacks still flow into them", () => {
  const w = range();
  Object.assign(w.char.skills, { scattershot: 10, arrowrain: 10 });
  w.char.mp = 9999;
  assert.ok(cast(w, 'scattershot').ok);
  run(w, 0.4);
  assert.equal(cast(w, 'arrowrain').reason, 'busy', 'the fan is still being loosed');
  const left = { held: new Set(['ArrowLeft']), pressed: new Set(), locked: false };
  for (let i = 0; i < 3; i++) updateWorld(w, DT, left);
  assert.equal(cast(w, 'arrowrain').reason, 'busy', 'walking cuts the follow-through, not the wait');
  run(w, 0.4);
  assert.ok(cast(w, 'arrowrain').ok, 'free once the motion is done');
  // A basic shot flows straight into a skill once its arrow is away.
  run(w, 1.5);
  updateWorld(w, DT, { held: new Set(), pressed: new Set(['KeyZ']), locked: false });
  run(w, 0.25);
  assert.ok(cast(w, 'scattershot').ok, 'weaved in after the arrow left');
});

test('the same no-spam rule holds for every job, spells and thief skills included', () => {
  for (const [job, weapon, skill] of [['mage', 'wand_20', 'magicbolt'], ['thief', 'claw_20', 'startoss'], ['warrior', 'sword_20', 'powerslash']]) {
    const w = arena(weapon);
    w.char.job = job;
    w.char.skills[skill] = 10;
    w.char.mp = 9999;
    assert.ok(cast(w, skill).ok, `${skill} goes off`);
    run(w, 0.15);
    for (let i = 0; i < 3; i++) updateWorld(w, DT, { held: new Set(['ArrowLeft']), pressed: new Set(), locked: false });
    assert.equal(cast(w, skill).reason, 'busy', `${skill} can't be recast mid-motion, even after moving`);
    run(w, 1);
    assert.ok(cast(w, skill).ok, `${skill} is free again once its motion is done`);
  }
});
