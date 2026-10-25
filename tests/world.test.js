import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MAPS } from '../src/data/maps.js';
import { createBody, stepBody } from '../src/world/physics.js';
import { createCharacter, gainExp, learnSkill, advanceJob } from '../src/core/character.js';
import { cast } from '../src/world/combat.js';
import { addItem } from '../src/core/inventory.js';
import { makeEquip } from '../src/core/items.js';
import { equipFromBag } from '../src/core/character.js';
import { createWorld, updateWorld, loadMap, respawn } from '../src/world/world.js';
import { spawnMob } from '../src/world/mobs.js';

const DT = 1 / 60;
const idle = { held: new Set(), pressed: new Set() };
const keys = (held = [], pressed = []) => ({ held: new Set(held), pressed: new Set(pressed) });
const run = (body, map, intent, seconds) => {
  for (let i = 0; i < seconds * 60; i++) stepBody(body, map, intent, DT);
};

test('jumping returns to the ground and can land on a ledge above', () => {
  const map = MAPS.meadow1; // ledge at x 180-420, y 360; ground 440
  const body = createBody(300, map.groundY);
  run(body, map, { jump: true }, 0.05);
  run(body, map, {}, 1);
  assert.equal(body.y, 360, 'jumped from the ground onto the ledge overhead');
  assert.equal(body.onGround, true);
});

test('walking off a ledge falls, and Down+Jump drops through one', () => {
  const map = MAPS.meadow1;
  const body = createBody(400, 360);
  run(body, map, {}, 0.1);
  assert.equal(body.y, 360);
  run(body, map, { right: true }, 0.6);
  run(body, map, {}, 1);
  assert.equal(body.y, map.groundY, 'walked off the end of the ledge');
  const b2 = createBody(300, 360);
  run(b2, map, {}, 0.1);
  run(b2, map, { down: true, jump: true }, 0.05);
  run(b2, map, {}, 1);
  assert.equal(b2.y, map.groundY, 'dropped through the ledge');
});

test('ropes climb up onto the ledge and back down', () => {
  const map = MAPS.meadow1; // rope x 1100 from 210 to 440
  const body = createBody(1100, map.groundY);
  run(body, map, { up: true }, 4);
  assert.equal(body.y, 210);
  assert.equal(body.rope, null);
  assert.equal(body.onGround, true, 'stepped off onto the top ledge');
  run(body, map, { down: true }, 4);
  assert.equal(body.y, map.groundY);
});

function newWorld() {
  const c = createCharacter('W', { hairStyle: 'bob' });
  addItem(c.inventory, makeEquip('sword_0'));
  equipFromBag(c, 0);
  return createWorld(c);
}

test('a new world starts in Sprout Village and portals travel with Up', () => {
  const w = newWorld();
  assert.equal(w.map.id, 'sprout');
  const east = w.map.portals.find((p) => p.id === 'east');
  w.body.x = east.x;
  w.body.y = east.y;
  updateWorld(w, DT, keys([], ['ArrowUp']));
  assert.equal(w.map.id, 'meadow1');
  assert.ok(Math.abs(w.body.x - 40) < 1, 'arrived at the matching portal');
});

test('Up next to an NPC raises a talk event', () => {
  const w = newWorld();
  w.body.x = 360;
  updateWorld(w, DT, keys([], ['ArrowUp']));
  assert.ok(w.events.some((e) => e.type === 'talk' && e.npc === 'mira'));
});

test('attacking a monster kills it, gives EXP, and drops gold you can pick up', () => {
  const w = newWorld();
  loadMap(w, 'meadow1', 'west');
  w.mobs = [];
  w.spawner.slots = [];
  const m = spawnMob(w.map, { mob: 'puffle', x: w.body.x + 30, y: w.map.groundY });
  m.def = { ...m.def, eva: 0 };
  w.mobs.push(m);
  w.body.facing = 1;
  for (let i = 0; i < 600 && m.hp > 0; i++) updateWorld(w, DT, keys(['KeyZ']));
  assert.equal(m.hp, 0, 'puffle defeated');
  assert.ok(w.char.exp > 0 || w.char.level > 1, 'EXP gained');
  for (let i = 0; i < 60; i++) updateWorld(w, DT, idle);
  assert.ok(w.drops.length >= 1, 'loot dropped');
  const gold = w.drops.find((d) => d.kind === 'gold');
  w.body.x = gold.x;
  const before = w.char.gold;
  for (let i = 0; i < 30; i++) updateWorld(w, DT, keys(['KeyX']));
  assert.ok(w.char.gold > before, 'picked up the gold');
});

test('monsters respawn at their spawn point', () => {
  const w = newWorld();
  loadMap(w, 'meadow1', 'west');
  const count = w.mobs.length;
  assert.equal(count, MAPS.meadow1.spawns.length);
  w.mobs[0].hp = 0;
  for (let i = 0; i < 60 * 8; i++) updateWorld(w, DT, idle);
  assert.equal(w.mobs.filter((m) => m.hp > 0).length, count);
});

test('skills spend MP and buffs raise stats', () => {
  const w = newWorld();
  gainExp(w.char, 200);
  learnSkill(w.char, 'quickstep');
  const speed = w.stats.speed;
  w.char.mp = 100;
  w.char.hotkeys = { KeyQ: { skill: 'quickstep' } };
  updateWorld(w, DT, keys([], ['KeyQ']));
  updateWorld(w, DT, idle);
  assert.ok(w.stats.speed > speed);
  assert.ok(w.char.mp < 100);
});

test('dying costs EXP and respawns you in town', () => {
  const w = newWorld();
  loadMap(w, 'meadow2', 'west');
  gainExp(w.char, 500);
  w.char.exp = 50;
  w.char.hp = 1;
  const m = spawnMob(w.map, { mob: 'piglet', x: w.body.x, y: w.map.groundY });
  m.def = { ...m.def, acc: 9999 };
  w.mobs.push(m);
  for (let i = 0; i < 10 && !w.dead; i++) updateWorld(w, DT, idle);
  assert.equal(w.dead, true);
  respawn(w);
  assert.equal(w.map.id, 'harbor');
  assert.ok(w.char.exp < 50);
  assert.ok(w.char.hp > 0);
});

test('the boss slam hurts players standing on the floor', () => {
  const w = newWorld();
  gainExp(w.char, 1e7);
  loadMap(w, 'bossroom', 'west');
  const boss = w.mobs.find((m) => m.def.boss);
  assert.ok(boss);
  w.body.x = boss.x - 150;
  w.invuln = 0;
  const hp = w.char.hp;
  for (let i = 0; i < 60 * 9; i++) updateWorld(w, DT, idle);
  assert.ok(w.char.hp < hp, 'took slam damage');
});

function mageAt50(second, third) {
  const w = newWorld();
  gainExp(w.char, 3e7);
  assert.ok(w.char.level >= 50);
  assert.equal(advanceJob(w.char, third), false, 'third job needs the second job first');
  advanceJob(w.char, 'mage');
  advanceJob(w.char, second);
  assert.equal(advanceJob(w.char, third), true);
  w.char.base.int = 250;
  w.char.mp = 99999;
  w.char.baseMp = 99999;
  return w;
}

function crowd(w, count, type = 'starspirit') {
  loadMap(w, 'sky', 'west');
  w.spawner.slots = [];
  w.mobs = [];
  for (let i = 0; i < count; i++) {
    const m = spawnMob(w.map, { mob: type, x: w.body.x + 40 + i * 12, y: w.map.groundY });
    m.def = { ...m.def, eva: 0, fly: false, hp: 1e9 };
    m.hp = 1e9;
    m.y = w.map.groundY;
    w.mobs.push(m);
  }
}

for (const [second, third, ult] of [['cleric', 'seraph', 'judgment'], ['pyromancer', 'infernosage', 'meteor']]) {
  test(`${third}: the ultimate hits 15 of 20 monsters twice`, () => {
    const w = mageAt50(second, third);
    w.char.skills[ult] = 20;
    crowd(w, 20);
    const result = cast(w, ult);
    assert.equal(result.ok, true);
    assert.equal(result.targets, 15);
    assert.equal(w.pending.length, 30, '15 targets x 2 hits');
  });
}

test('summons attack nearby monsters on their own', () => {
  const w = mageAt50('cleric', 'seraph');
  w.char.skills.guardianangel = 10;
  w.char.hotkeys = { KeyQ: { skill: 'guardianangel' } };
  crowd(w, 3, 'cloudsheep');
  updateWorld(w, DT, keys([], ['KeyQ']));
  assert.ok(w.char.buffs.guardianangel?.summon, 'angel summoned');
  const before = w.mobs.reduce((n, m) => n + m.hp, 0);
  for (let i = 0; i < 60 * 3; i++) updateWorld(w, DT, idle);
  const after = w.mobs.reduce((n, m) => n + m.hp, 0);
  assert.ok(after < before, 'the angel dealt damage without the player attacking');
});
