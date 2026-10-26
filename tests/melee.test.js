// Melee combos: basic attacks chain through a weapon's steps into a finisher, blows land as the
// blade cuts (not when the key is pressed), launchers pop monsters up, and the warrior's combo
// skills carry on step by step.
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

// A world with a pile of sturdy monsters around a hero of the given job, for the funny skills.
function funnyArena(jobs, weapon) {
  const w = arena(weapon);
  if (jobs) {
    w.char.job = 'novice';
    for (const j of jobs) w.char.job = j;
  }
  w.char.mp = 9999;
  for (const x of [400, 430, 460, 490, 520]) {
    const m = spawnMob(w.map, { mob: 'boarlet', x, y: w.map.groundY });
    m.def = { ...m.def, hp: 1e9, eva: 0, aggro: false, speed: 0 };
    m.hp = 1e9;
    w.mobs.push(m);
  }
  return w;
}

test('the funny skills: bonk, dance, flatten, quack, baguette, banana', () => {
  const w = funnyArena();
  Object.assign(w.char.skills, { bonk: 3, danceparty: 3, squeakyhammer: 10 });
  const go = (id) => {
    w.attackTimer = 0;
    w.lockTimer = 0;
    w.recoverAt = null;
    return cast(w, id);
  };
  // Bonk sends one monster to the moon.
  assert.ok(go('bonk').ok);
  let air = 0;
  for (let i = 0; i < 60; i++) {
    updateWorld(w, DT, idle);
    air = Math.max(air, ...w.mobs.map((m) => m.air ?? 0));
  }
  assert.ok(air > 150, `to the moon (${Math.round(air)}px)`);
  // Dance Party: everyone around dances.
  assert.ok(go('danceparty').ok);
  assert.ok(w.mobs.every((m) => m.hold === 'dance' && m.frozenUntil > w.now));
  run(w, 4);
  // Squeaky Hammer: pancakes.
  assert.ok(go('squeakyhammer').ok);
  run(w, 0.5);
  assert.ok(w.mobs.filter((m) => m.hold === 'flat' && m.frozenUntil > w.now).length >= 4, 'flattened');
});

test('the mage, archer, and thief have their funny skills too', () => {
  const mage = funnyArena(['mage'], 'wand_20');
  mage.char.skills.duckmeteor = 10;
  mage.lockTimer = 0;
  assert.ok(cast(mage, 'duckmeteor').ok);
  run(mage, 0.7);
  assert.ok(mage.mobs.some((m) => m.hold === 'stun' && m.frozenUntil > mage.now), 'seeing stars');
  const archer = funnyArena(['archer'], 'bow_20');
  archer.char.skills.baguette = 10;
  const r = cast(archer, 'baguette');
  assert.ok(r.ok && r.targets >= 7, `the baguette goes through everything (${r.targets})`);
  const thief = funnyArena(['thief'], 'dagger_20');
  thief.char.skills.bananapeel = 10;
  assert.ok(cast(thief, 'bananapeel').ok);
  run(thief, 0.6);
  assert.ok(thief.mobs.some((m) => (m.air ?? 0) > 0 || m.hold === 'stun'), 'slipped');
});
