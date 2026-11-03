// Team moves (world/teamwork.js): catching a partymate's launch, reviving by standing by, the
// side-by-side bonus and the Group Finisher, with bot party members.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createWorld, loadMap, updateWorld } from '../src/world/world.js';
import { createCharacter } from '../src/core/character.js';
import { computeStats } from '../src/core/stats.js';
import { createBody } from '../src/world/physics.js';
import { spawnMob } from '../src/world/mobs.js';
import { makeBotCharacter, updateBots } from '../src/world/bots.js';
import { joinParty } from '../src/world/party.js';
import { tickTeam, teamOf, nearCount, groupReady, CATCH_WINDOW, REVIVE_TIME, REVIVE_PCT, NEAR_MAX } from '../src/world/teamwork.js';

function seeded(n) {
  return () => {
    n = (n * 1664525 + 1013904223) % 4294967296;
    return n / 4294967296;
  };
}
const NONE = { held: new Set(), pressed: new Set() };
const DT = 1 / 30;

// You on the meadow with a sturdy dummy monster in front of you and `n` bot party members by you.
function scene(n = 1, { level = 40 } = {}) {
  const world = createWorld(createCharacter('Me', {}));
  const lines = [];
  world.log = (t) => lines.push(t);
  world.god = true;
  world.char.level = level;
  loadMap(world, 'meadow1', 'west');
  world.mobs = [];
  const m = spawnMob(world.map, { mob: 'snailbun', x: world.body.x + 50, y: world.body.y });
  m.def = { ...m.def, hp: 1e9, speed: 0, atk: 0 };
  m.hp = 1e9;
  world.mobs.push(m);
  const bots = { list: [], memory: new Set(), names: new Set(), rng: seeded(71), replies: [], spawnIn: 999, waveIn: 999, newsIn: 999 };
  world.bots = bots;
  for (let i = 0; i < n; i++) {
    const char = makeBotCharacter(seeded(8 + i), { name: `Pal${i}`, level, jobs: ['warrior', 'paladin'] });
    const pal = { id: `p${i}`, name: `Pal${i}`, char, level, party: true, style: {}, map: world.map.id, x: world.body.x - 20 - i * 10, facing: 1, state: 'idle', session: 9999, stay: 9999, nextLine: 999, appear: 0 };
    pal.body = createBody(pal.x, world.body.y);
    pal.stats = computeStats(char);
    pal.hp = pal.stats.maxHp;
    bots.list.push(pal);
  }
  return { world, m, bots, lines, pals: [...bots.list] };
}

// One blow landing now, through the world's queue (`party`: a member's).
function blow(world, m, damage, { party, launch = 0 } = {}) {
  world.pending.push({ at: world.now, mob: m, miss: false, damage, crit: false, fromX: world.body.x, stack: 0, knock: 0, launch, party });
  updateWorld(world, DT, NONE);
}

test('a Team Catch: a hit on a monster a partymate launched hits harder, juggles it and chains', () => {
  const { world, m, pals } = scene(1);
  const before = m.hp;
  // Your own launch, then your own follow-up: no catch (that's just your combo).
  blow(world, m, 100, { launch: 300 });
  blow(world, m, 100);
  assert.equal(world.team.catches, 0, 'your own launch is yours to follow');
  // Side by side with one member: +4%.
  assert.equal(before - m.hp, 208);
  for (let t = 0; t < 2; t += DT) updateWorld(world, DT, NONE);
  // Pal launches it; you catch it in the air.
  blow(world, m, 100, { party: pals[0].id, launch: 300 });
  assert.equal(m.lift.by, pals[0].id);
  let hp = m.hp;
  blow(world, m, 100);
  assert.equal(world.team.catches, 1);
  assert.equal(hp - m.hp, Math.round(100 * 1.04 * 1.25), 'the catch hits a quarter harder');
  assert.ok(world.numbers.some((n) => n.text === 'TEAM!'));
  assert.ok(world.fx.some((f) => f.kind === 'teamcatch'));
  assert.ok(m.airV > 0 || m.air > 0, 'and keeps it up');
  // Pal catches it back: a chain of two, a little harder again.
  hp = m.hp;
  blow(world, m, 100, { party: pals[0].id });
  assert.equal(world.team.catches, 2);
  assert.equal(hp - m.hp, Math.round(100 * 1.04 * 1.35));
  assert.ok(world.numbers.some((n) => n.text === 'TEAM! x2'));
  // Too late: once it's landed and the window has passed, nothing to catch.
  for (let t = 0; t < CATCH_WINDOW + 1; t += DT) updateWorld(world, DT, NONE);
  hp = m.hp;
  blow(world, m, 100);
  assert.equal(world.team.catches, 2);
  assert.equal(hp - m.hp, 104);
});

test('side by side: +4% damage for each member fighting near you, at most three', () => {
  const { world, m, pals } = scene(5);
  assert.equal(nearCount(teamOf(world), teamOf(world)[0]), NEAR_MAX);
  let hp = m.hp;
  blow(world, m, 100);
  assert.equal(hp - m.hp, 112, 'capped at three');
  // Walk away from them all: no bonus.
  for (const p of pals) p.body.x = world.body.x + 900;
  hp = m.hp;
  blow(world, m, 100);
  assert.equal(hp - m.hp, 100);
  tickTeam(world, DT);
  assert.equal(world.team.near, 0);
});

test('revive by standing by: a ring fills round them, broken by a hard hit or walking off', () => {
  const { world, pals } = scene(1);
  const pal = pals[0];
  Object.assign(pal, { down: true, tomb: true, downAt: world.now, hp: 0, brain: { think: 99 } });
  pal.body.x = world.body.x + 20;
  const run = (secs) => {
    for (let t = 0; t < secs; t += DT) {
      world.now += DT;
      tickTeam(world, DT);
    }
  };
  run(1.2);
  assert.ok(world.team.revive[pal.id].t > 1, 'filling');
  // Walk off: it's lost.
  world.body.x += 120;
  run(0.1);
  assert.equal(world.team.revive[pal.id].t, 0);
  world.body.x -= 120;
  run(1.2);
  // A hard hit breaks it.
  world.char.hp -= Math.round(world.stats.maxHp * 0.2);
  run(DT);
  assert.equal(world.team.revive[pal.id].t, 0);
  run(REVIVE_TIME + 0.1);
  assert.equal(pal.down, false, 'back on their feet');
  assert.equal(pal.hp, Math.round(pal.stats.maxHp * REVIVE_PCT));
  assert.ok(world.fx.some((f) => f.kind === 'teamrevive'));
});

test('bots in your party walk over and get you up, and each other', () => {
  const { world, bots, pals } = scene(2);
  for (const p of pals) joinParty(bots, p, world);
  for (let t = 0; t < 2; t += DT) {
    world.now += 0; // (updateWorld moves the clock)
    updateWorld(world, DT, NONE);
    updateBots(bots, world, DT);
  }
  world.mobs = [];
  // You fall, with one of them a way off.
  world.dead = true;
  world.char.hp = 0;
  for (const p of pals) p.body.x = world.body.x + 160;
  let up = false;
  for (let t = 0; t < 12 && !up; t += DT) {
    updateWorld(world, DT, NONE);
    updateBots(bots, world, DT);
    up = !world.dead;
  }
  assert.ok(up, 'a party member came over and got you up');
  assert.ok(world.char.hp >= Math.round(world.stats.maxHp * REVIVE_PCT) && world.char.hp < world.stats.maxHp * 0.5, 'with some HP');
  // One of them falls; the other gets them up.
  const [a, b] = pals;
  Object.assign(a, { down: true, tomb: true, downAt: world.now, hp: 0 });
  b.body.x = a.body.x + 140;
  world.body.x = a.body.x + 400;
  let back = false;
  for (let t = 0; t < 12 && !back; t += DT) {
    updateWorld(world, DT, NONE);
    updateBots(bots, world, DT);
    back = !a.down && !a.away;
  }
  assert.ok(back, `${b.name} got ${a.name} up before they had to go back to town`);
});

test('bots catch your launches', () => {
  const { world, bots, m, pals } = scene(2);
  for (const p of pals) joinParty(bots, p, world);
  let t = 0;
  for (; t < 30 && !world.team?.catches; t += DT) {
    if (Math.round(t / DT) % 45 === 0) world.pending.push({ at: world.now, mob: m, miss: false, damage: 1, crit: false, fromX: world.body.x, stack: 0, knock: 0, launch: 400 });
    updateWorld(world, DT, NONE);
    updateBots(bots, world, DT);
  }
  assert.ok(world.team.catches > 0, 'a party member caught one');
});

test('a Group Finisher needs another full gauge, spends it, and ends in a shared burst', () => {
  const { world, bots, pals, lines } = scene(1);
  const pal = pals[0];
  joinParty(bots, pal, world);
  for (let t = 0; t < 6; t += DT) {
    updateWorld(world, DT, NONE);
    updateBots(bots, world, DT);
  }
  assert.ok(pal.fight, 'they were fighting');
  // Their gauge not full: your finisher is a plain party combo.
  pal.fight.gauge = 60;
  assert.equal(groupReady(world), false);
  world.finisherCast = { at: world.now, id: 'grandverdict' };
  updateBots(bots, world, DT);
  assert.ok(!lines.some((l) => /Group Finisher/.test(l)));
  assert.ok(!world.team.burst);
  for (let t = 0; t < 4; t += DT) {
    updateWorld(world, DT, NONE);
    updateBots(bots, world, DT);
  }
  // Full: a Group Finisher.
  pal.body.x = world.body.x + 30;
  pal.fight.gauge = 100;
  assert.equal(groupReady(world), true);
  world.finisherCast = { at: world.now, id: 'grandverdict' };
  updateBots(bots, world, DT);
  assert.ok(lines.some((l) => /Group Finisher! Pal0/.test(l)));
  assert.ok(world.team.burst);
  let burst = false;
  let slow = false;
  let fin = false;
  for (let t = 0; t < 3; t += DT) {
    updateWorld(world, DT, NONE);
    updateBots(bots, world, DT);
    burst ||= world.fx.some((f) => f.kind === 'teamburst');
    slow ||= world.slowmo > 0;
    fin ||= pal.attack?.pose === 'plverdict';
  }
  assert.ok(fin, 'their finisher went off');
  assert.ok(pal.fight.gauge < 100, 'and spent their gauge');
  assert.ok(burst && slow, 'a shared burst with a moment of slow motion');
});
