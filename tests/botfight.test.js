// How bots fight (world/botfight.js): their job's real kit at a human pace, the finisher on a full
// gauge, stepping out of a heavy wind-up and a marked patch, the tank holding aggro and turning the
// boss, the healer keeping you up, and callouts that go through the chat gate and never repeat.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { makeBotCharacter, createBots, recruitBot, updateBots } from '../src/world/bots.js';
import { createWorld, loadMap, updateWorld } from '../src/world/world.js';
import { joinParty, partyMembers, botSkills, updateParty } from '../src/world/party.js';
import { startRun, groupOf, addZone, dangerFor } from '../src/world/dungeon.js';
import { chooseSkill, commandFor, evade, callout, placeInGroup, catchable, focusOf, shapeOf } from '../src/world/botfight.js';
import { navOf } from '../src/world/nav.js';
import { computeStats } from '../src/core/stats.js';
import { shape } from '../src/world/chatlog.js';

function seeded(n) {
  return () => {
    n = (n * 1664525 + 1013904223) % 4294967296;
    return n / 4294967296;
  };
}

function heroAt(rng, level, jobs, mapId = 'hollow_gate') {
  const char = makeBotCharacter(rng, { name: 'Tester', pro: false, level, jobs });
  char.mapId = mapId;
  const world = createWorld(char);
  world.bots = createBots(world, rng, { clock: () => new Date(2026, 9, 28, 20, 0) });
  const lines = [];
  world.log = (text) => lines.push(text);
  return { world, lines };
}

function member(world, level, jobs) {
  const bot = recruitBot(world.bots, world, { level, jobs });
  joinParty(world.bots, bot, world);
  return bot;
}

test('a party member fights with their real skills and finisher, at a human pace', () => {
  const rng = seeded(7);
  const { world } = heroAt(rng, 40, ['warrior', 'stormwall']);
  loadMap(world, 'woods', 'start');
  const bot = member(world, 38, ['warrior', 'stormwall']);
  // Their kit: the moves of their own skills and finisher.
  bot.stats = computeStats(bot.char);
  const skills = botSkills(bot.char);
  const skillMoves = new Set(skills.filter((s) => !s.full).flatMap((s) => s.steps.map((st) => st.move)));
  const finMoves = new Set(skills.filter((s) => s.full).flatMap((s) => s.steps.map((st) => st.move)));
  assert.ok(skillMoves.size && finMoves.size, 'a Stormwall has attack skills and a finisher');
  const starts = [];
  let last = null;
  for (let i = 0; i < 60 * 90; i++) {
    world.now += 1 / 60;
    for (const m of world.mobs) m.hp = m.def.hp;
    if (bot.hp != null) bot.hp = bot.stats.maxHp;
    updateParty(world.bots, world, 1 / 60);
    if (bot.attack && bot.attack !== last && bot.attack.fighting) starts.push({ t: world.now, pose: bot.attack.pose });
    last = bot.attack;
  }
  const used = starts.filter((s) => skillMoves.has(s.pose));
  const fins = starts.filter((s) => finMoves.has(s.pose));
  assert.ok(starts.length > 40, `they fought (${starts.length} moves)`);
  assert.ok(used.length >= 2, `they used their skills (${used.length})`);
  assert.ok(fins.length >= 1, 'and their finisher, once the gauge filled');
  // No spam: every move waits out the one before, and skills come at most every couple of seconds.
  for (let i = 1; i < starts.length; i++) assert.ok(starts[i].t - starts[i - 1].t >= 0.2, `a beat between moves (${starts[i - 1].pose} -> ${starts[i].pose})`);
  assert.ok((used.length + fins.length) / 90 < 0.5, 'skills at a human pace');
});

test('skills fit the fight: area skills on a pack, the finisher saved for a boss, the launcher then an air combo', () => {
  const rng = seeded(9);
  const { world } = heroAt(rng, 40, ['warrior', 'stormwall']);
  loadMap(world, 'woods', 'start');
  const bot = member(world, 38, ['warrior', 'stormwall']);
  bot.stats = computeStats(bot.char);
  bot.ai = { special: 1, weapon: { ranged: false, reach: 42 } };
  bot.body = { x: 400, y: world.map.groundY, vx: 0, onGround: true, facing: 1 };
  bot.fight = { skills: botSkills(bot.char), gauge: 0 };
  const base = world.mobs[0];
  const one = { ...base, x: 430, y: world.map.groundY, hp: base.def.hp };
  const pack = [0, 20, 40, 60, 80].map((d) => ({ ...base, x: 430 + d, y: world.map.groundY, hp: base.def.hp }));
  bot.ai.special = 0.2;
  const count = (mobs, target) => {
    world.mobs = mobs;
    let n = 0;
    for (let i = 0; i < 400; i++) if (chooseSkill(bot, world, target, false, rng)) n++;
    return n;
  };
  assert.ok(count(pack, pack[0]) > count([one], one) * 1.5, 'skills come out more on a pack');
  // Of two skills, the area one is picked for a pack.
  const area = { id: 'a', steps: [{ dur: 0.5, strikes: [{ at: 0.5, pct: 100, reach: 80, around: true, targets: 6 }] }] };
  const single = { id: 's', steps: [{ dur: 0.5, strikes: [{ at: 0.5, pct: 300, reach: 60, targets: 1 }] }] };
  assert.ok(shapeOf(area).aoe && !shapeOf(single).aoe);
  const real = bot.fight.skills;
  bot.fight.skills = [area, single];
  bot.ai.special = 1;
  world.mobs = pack;
  let aoe = 0;
  for (let i = 0; i < 200; i++) {
    bot.fight.lastSkill = null;
    if (chooseSkill(bot, world, pack[0], false, rng) === area) aoe++;
  }
  assert.ok(aoe > 130, `the area skill on a pack (${aoe}/200)`);
  bot.fight.skills = real;
  bot.ai.special = 1;
  // A full gauge on a boss: the finisher, every time.
  const boss = { ...base, def: { ...base.def, boss: true, name: 'Big One' }, x: 430, y: world.map.groundY, hp: 9999 };
  world.mobs = [boss];
  const fin = chooseSkill(bot, world, boss, true, rng);
  assert.ok(fin?.full, 'the finisher on the boss');
  // The launcher, then up after it with the air combo.
  world.mobs = [one];
  const steps = commandFor(bot, world, one, () => 0);
  assert.ok(steps && steps[0].strikes.some((k) => k.launch > 0), 'a launcher');
  assert.ok(steps.slice(1).length >= 2 && steps.slice(1).every((s) => s.air), 'then an air combo');
  // A monster someone else threw up: they jump after it (a team catch).
  one.air = 60;
  one.botLaunch = null;
  assert.equal(catchable(bot, world), one);
  const caught = commandFor(bot, world, one, () => 0.99);
  assert.ok(caught[0].hop > 0 && caught.slice(1).every((s) => s.air), 'catching it in the air');
});

test('your target (or your ping) is the one they focus', () => {
  const rng = seeded(4);
  const { world } = heroAt(rng, 30, ['archer'], 'woods');
  const [a, b] = world.mobs;
  world.youHit = { mob: a, at: world.now };
  assert.equal(focusOf(world), a);
  world.pings = [{ x: b.x, y: b.y, until: world.now + 5 }];
  assert.equal(focusOf(world), b, 'a ping beats your last hit');
  world.pings = [];
  world.now += 10;
  assert.equal(focusOf(world), null, 'an old hit is forgotten');
});

test('bots step out of a heavy wind-up and out of a marked patch', () => {
  const rng = seeded(11);
  const { world } = heroAt(rng, 11, ['archer']);
  assert.equal(startRun(world), null);
  const dps = partyMembers(world.bots).find((b) => world.dungeon.roles[b.id] === 'dps');
  updateBots(world.bots, world, 1 / 60);
  const body = dps.body;
  const boss = { ...world.mobs[0], hp: 100, x: body.x + 30, windup: 0.8, swingAt: dps.id, swingMul: 2.3, def: { ...world.mobs[0].def, boss: true, fight: { reach: 20 } } };
  world.mobs.push(boss);
  const intent = { left: false, right: false, jump: false, up: false, down: false };
  assert.ok(evade(dps, world, intent, () => 0, 'dps'), 'they see it coming');
  assert.ok(intent.left && !intent.right, 'and step back away from it');
  world.mobs.pop();
  // A patch about to burst under them: they walk out of it before it goes off.
  addZone(world, { kind: 'circle', x: body.x, y: body.y, w: 66, warn: 1.7, damage: 1, from: null });
  const random = Math.random;
  Math.random = rng;
  try {
    for (let i = 0; i < 90; i++) {
      updateWorld(world, 1 / 60, { held: new Set(), pressed: new Set(), locked: false });
      updateBots(world.bots, world, 1 / 60);
    }
  } finally {
    Math.random = random;
  }
  assert.equal(dangerFor(world, dps.body), null, 'out of the patch');
});

test('the tank holds aggro, and turns the boss away from the group', () => {
  const random = Math.random;
  const rng = seeded(13);
  Math.random = rng;
  try {
    const { world } = heroAt(rng, 11, ['archer']);
    assert.equal(startRun(world), null);
    const tank = partyMembers(world.bots).find((b) => world.dungeon.roles[b.id] === 'tank');
    world.god = true;
    let on = 0;
    let fights = 0;
    for (let i = 0; i < 60 * 40; i++) {
      updateWorld(world, 1 / 60, { held: new Set(), pressed: new Set(), locked: false });
      updateBots(world.bots, world, 1 / 60);
      for (const m of world.mobs) {
        if (m.hp <= 0 || !m.engaged || !m.target) continue;
        fights++;
        if (m.target === tank.id) on++;
      }
      // (You tag along behind the tank.)
      const b = world.body;
      if (Math.abs(b.x - tank.body.x) > 200 && b.onGround && tank.body.onGround) Object.assign(b, { x: tank.body.x - 100, y: tank.body.y, vx: 0, vy: 0, surface: tank.body.surface });
    }
    assert.ok(fights > 200, `fights happened (${fights})`);
    assert.ok(on / fights > 0.6, `the monsters were on the tank (${Math.round((on / fights) * 100)}%)`);
    // A boss: the tank takes the side the group isn't on.
    const group = groupOf(world);
    const boss = { x: 600, y: world.map.groundY, hp: 100, threat: {}, def: { id: 'big', name: 'Big One', boss: true, w: 40, h: 40, hp: 100, fight: { reach: 20 } } };
    for (const g of group) if (g.bot !== tank) g.body.x = 700;
    world.body.x = 700;
    const nav = navOf(world.map);
    tank.brain.target = boss;
    tank.brain.tankSide = null;
    tank.brain.goal = { x: 650, y: world.map.groundY, mode: 'fight', surface: 0 };
    tank.brain.goal.surface = nav.surfaces.findIndex((s) => s.ground);
    placeInGroup(tank, world, 'tank', nav);
    assert.ok(tank.brain.goal.x < boss.x, 'the tank faces it from the far side');
  } finally {
    Math.random = random;
  }
});

test('the healer keeps you up, and says so', () => {
  const random = Math.random;
  const rng = seeded(21);
  Math.random = rng;
  try {
    const { world, lines } = heroAt(rng, 11, ['archer']);
    assert.equal(startRun(world), null);
    const healer = partyMembers(world.bots).find((b) => world.dungeon.roles[b.id] === 'healer');
    assert.ok(healer);
    // (A moment into the run: they've had time to look round.)
    updateBots(world.bots, world, 1 / 60);
    healer.brain.healIn = 0.3;
    world.char.hp = Math.round(world.stats.maxHp * 0.3);
    const before = world.char.hp;
    for (let i = 0; i < 60 * 4; i++) {
      updateWorld(world, 1 / 60, { held: new Set(), pressed: new Set(), locked: false });
      updateBots(world.bots, world, 1 / 60);
    }
    assert.ok(world.char.hp > before + world.stats.maxHp * 0.15, 'healed');
    assert.ok(lines.some((l) => l.startsWith(`[Party] ${healer.name}:`) && /heal|patch|got you/i.test(l)), 'a callout');
  } finally {
    Math.random = random;
  }
});

test('callouts go through the chat gate, never repeat, and never turn into chatter', () => {
  const rng = seeded(5);
  const { world, lines } = heroAt(rng, 11, ['archer']);
  assert.equal(startRun(world), null);
  const [a, b] = partyMembers(world.bots);
  const said = [];
  for (let i = 0; i < 12; i++) {
    world.now += 7;
    if (callout(world, a, 'slam', { boss: 'Gnarlroot' })) said.push(a.bubble.text);
  }
  assert.ok(said.length >= 3, 'called');
  assert.equal(new Set(said.map((t) => shape(t))).size, said.length, 'never the same line twice');
  assert.ok(said.length < 12, 'and they run out rather than repeat');
  // Through the gate: another member can't say one that was just said.
  world.now += 7;
  const n = lines.length;
  callout(world, b, 'slam', { boss: 'Gnarlroot' });
  for (const l of lines.slice(n)) assert.ok(!said.some((t) => l.endsWith(t)), 'no repeats across the group');
  // Not chatter: a second call straight after the first is held back.
  world.now += 30;
  assert.ok(callout(world, a, 'drink'));
  assert.equal(callout(world, a, 'heal'), false, 'one call every few seconds');
});
