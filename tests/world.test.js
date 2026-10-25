import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MAPS } from '../src/data/maps.js';
import { createBody, stepBody } from '../src/world/physics.js';
import { createCharacter, gainExp, learnSkill, advanceJob } from '../src/core/character.js';
import { cast } from '../src/world/combat.js';
import { createWorld, updateWorld, loadMap, respawn, hops, travelTo, travelCost } from '../src/world/world.js';
import { TOWNS } from '../src/data/maps.js';
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
  return createWorld(createCharacter('W', { hairStyle: 'bob' }));
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
  assert.equal(count, MAPS.meadow1.spawns.length * 2, 'two monsters per spawn point');
  w.mobs[0].hp = 0;
  for (let i = 0; i < 60 * 5; i++) updateWorld(w, DT, idle);
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
  // Monster hits cap at 98%, and a miss grants 0.5s of invulnerability, so pin the roll to a hit.
  const random = Math.random;
  Math.random = () => 0;
  try {
    for (let i = 0; i < 10 && !w.dead; i++) updateWorld(w, DT, idle);
  } finally {
    Math.random = random;
  }
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
  return jobAt50('mage', second, third);
}

function jobAt50(first, second, third) {
  const w = newWorld();
  gainExp(w.char, 3e7);
  assert.ok(w.char.level >= 50);
  assert.equal(advanceJob(w.char, third), false, 'third job needs the second job first');
  advanceJob(w.char, first);
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

const THIRD_JOBS = [
  ['mage', 'cleric', 'bishop', 'judgment'], ['mage', 'fpwizard', 'fparchmage', 'meteor'], ['mage', 'ilwizard', 'ilarchmage', 'tempest'],
  ['warrior', 'blademaster', 'swordsaint', 'thousandblades'], ['warrior', 'lancer', 'dragonknight', 'dragonroar'], ['warrior', 'guardian', 'paladin', 'heavenshammer'],
  ['archer', 'ranger', 'windwalker', 'arrowstorm'], ['archer', 'marksman', 'deadeye', 'finalshot'], ['archer', 'hunter', 'beastmaster', 'wildhunt'],
  ['thief', 'duelist', 'bladedancer', 'bladefury'], ['thief', 'shadow', 'nightstalker', 'shurikentempest'], ['thief', 'trickster', 'phantomthief', 'jackpot'],
];
for (const [first, second, third, ult] of THIRD_JOBS) {
  test(`${third}: the ultimate hits 15 of 20 monsters twice`, () => {
    const w = jobAt50(first, second, third);
    w.char.skills[ult] = 20;
    crowd(w, 20);
    const result = cast(w, ult);
    assert.equal(result.ok, true);
    assert.equal(result.targets, 15);
    assert.equal(w.pending.length, 30, '15 targets x 2 hits');
  });
}

test('summons attack nearby monsters on their own', () => {
  const w = mageAt50('cleric', 'bishop');
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

test('every town connects to every other town by road', () => {
  for (const a of TOWNS) for (const b of TOWNS) assert.ok(Number.isFinite(hops(a, b)), `${a} -> ${b}`);
  for (const t of TOWNS) assert.ok(MAPS[t].isTown && MAPS[t].job, `${t} is a job's home town`);
  assert.deepEqual(new Set(TOWNS.map((t) => MAPS[t].job)), new Set(['archer', 'thief', 'warrior', 'mage']));
});

test('fast travel flies between towns for gold, and only from a town', () => {
  const w = newWorld();
  w.char.gold = 1000;
  const cost = travelCost('sprout', 'grove');
  assert.ok(cost > 0);
  assert.equal(travelTo(w, 'grove'), null);
  assert.equal(w.map.id, 'grove');
  assert.equal(w.char.gold, 1000 - cost);
  loadMap(w, 'ruins', 'west');
  assert.ok(travelTo(w, 'sprout'), 'no flights from the field');
  assert.equal(w.map.id, 'ruins');
});

test('chat sends a message, shows a bubble, and emoticons set a face', async () => {
  const { createChat, chatInput } = await import('../src/ui/chat.js');
  const w = newWorld();
  w.body.x = 360; // next to Mira
  const chat = createChat();
  const frame = (pressed = [], typed = []) => chatInput(chat, w, { pressed: new Set(pressed), held: new Set(['ArrowRight']), typed });
  assert.equal(frame(['Enter']), true, 'Enter opens the chat bar');
  assert.equal(frame([], [...'hello :D']), true);
  frame(['Enter']);
  assert.equal(chat.typing, null);
  assert.ok(w.messages.some((m) => m.text === 'W: hello :D'));
  assert.equal(w.bubbles.player.text, 'hello :D');
  assert.equal(w.emote.face, 'excited');
  assert.ok(chat.pending.some((p) => p.who === 'mira'), 'Mira says hi back');
});

test('the Game Master stays locked without the passphrase, and its tools work once unlocked', async () => {
  const { isGm, unlockGm, gmCommand } = await import('../src/world/gm.js');
  const w = newWorld();
  assert.equal(isGm(w.char), false);
  assert.equal(await unlockGm(w.char, 'password123'), false, 'a wrong passphrase is rejected');
  assert.equal(isGm(w.char), false);
  w.char.gm = true; // what a correct passphrase does
  gmCommand(w, 'job', ['gamemaster']);
  assert.equal(w.char.job, 'gamemaster');
  assert.ok(w.char.skills.gmsmite, 'GM skills come with the job');
  gmCommand(w, 'level', ['77']);
  assert.equal(w.char.level, 77);
  gmCommand(w, 'give', ['hat_5', '1']);
  assert.ok(w.char.inventory.equip.some((e) => e.id === 'hat_5'));
  gmCommand(w, 'tp', ['sky']);
  assert.equal(w.map.id, 'sky');
  gmCommand(w, 'god', []);
  const hp = w.char.hp;
  gmCommand(w, 'spawn', ['starspirit', '3']);
  for (let i = 0; i < 120; i++) updateWorld(w, DT, idle);
  assert.equal(w.char.hp, hp, 'god mode takes no damage');
  gmCommand(w, 'killall', []);
  assert.ok(w.mobs.every((m) => m.hp === 0));
});

test('big skills root you for a short wind-up and never go on cooldown', async () => {
  const { setJob, setLevel, gmCommand } = await import('../src/world/gm.js');
  const w = newWorld();
  setJob(w.char, 'fparchmage');
  setLevel(w.char, 120);
  w.char.skills.meteor = 1;
  w.char.baseMp = 5000;
  gmCommand(w, 'heal', []);
  updateWorld(w, DT, idle);
  assert.equal(cast(w, 'meteor').ok, true);
  assert.ok(w.lockTimer > 1, 'the cast plants you');
  const x = w.body.x;
  for (let i = 0; i < 30; i++) updateWorld(w, DT, keys(['ArrowRight']));
  assert.equal(w.body.x, x, "can't walk during the lock");
  assert.equal(cast(w, null).reason, 'busy', 'no attacks during the lock');
  for (let i = 0; i < 60; i++) updateWorld(w, DT, idle);
  assert.equal(w.lockTimer, 0);
  assert.equal(cast(w, 'meteor').ok, true, 'usable again as soon as the lock ends');
});

test('every class branches three ways at 30, and each branch has one third job with an ultimate', async () => {
  const { nextJobs, JOBS } = await import('../src/data/jobs.js');
  const { SKILLS } = await import('../src/data/skills.js');
  for (const first of ['warrior', 'mage', 'archer', 'thief']) {
    const seconds = nextJobs(first, 30);
    assert.equal(seconds.length, 3, `${first} has three branches`);
    for (const second of seconds) {
      const thirds = nextJobs(second.id, 50);
      assert.equal(thirds.length, 1, `${second.id} has one third job`);
      const skills = Object.values(SKILLS).filter((k) => k.job === thirds[0].id);
      assert.equal(skills.filter((k) => k.ultimate).length, 1, `${thirds[0].id} has one ultimate`);
      assert.ok(skills.some((k) => k.type === 'passive'), `${thirds[0].id} has a mastery`);
    }
    assert.ok(Object.values(SKILLS).some((k) => k.job === first && k.type === 'blink'), `${first} has a movement skill`);
  }
  assert.ok(JOBS.mage.hp < JOBS.warrior.hp && JOBS.mage.hp < JOBS.archer.hp, 'mages are the most fragile');
});

test('stuns stop monsters with stars, and bleeding ticks like poison', () => {
  const w = jobAt50('warrior', 'guardian', 'paladin');
  w.char.skills.shieldbash = 20;
  crowd(w, 2, 'cloudsheep');
  w.body.facing = 1;
  assert.equal(cast(w, 'shieldbash').ok, true);
  for (let i = 0; i < 20; i++) updateWorld(w, DT, idle);
  const m = w.mobs[0];
  assert.equal(m.hold, 'stun');
  assert.ok(m.frozenUntil > w.now);

  const h = jobAt50('archer', 'hunter', 'beastmaster');
  h.char.skills.thorntrap = 20;
  crowd(h, 2, 'cloudsheep');
  h.body.facing = 1;
  assert.equal(cast(h, 'thorntrap').ok, true);
  for (let i = 0; i < 30; i++) updateWorld(h, DT, idle);
  const b = h.mobs[0];
  assert.equal(b.poison?.kind, 'bleed');
  const hp = b.hp;
  for (let i = 0; i < 60 * 2.2; i++) updateWorld(h, DT, idle);
  assert.ok(b.hp < hp, 'took bleed damage over time');
});

test('a charge dashes forward and hits the monsters it passes through', () => {
  const w = jobAt50('warrior', 'guardian', 'paladin');
  w.char.skills.holycharge = 20;
  crowd(w, 4, 'cloudsheep');
  w.body.facing = 1;
  const x = w.body.x;
  const r = cast(w, 'holycharge');
  assert.equal(r.ok, true);
  assert.ok(w.body.x > x + 100, 'moved forward');
  assert.equal(r.targets, 4, 'hit everything it passed');
});

test('ice freezes monsters in place, and they can\'t hurt you while frozen', () => {
  const w = mageAt50('ilwizard', 'ilarchmage');
  w.char.skills.icespire = 20;
  crowd(w, 3, 'cloudsheep');
  w.body.facing = 1;
  assert.equal(cast(w, 'icespire').ok, true);
  for (let i = 0; i < 30; i++) updateWorld(w, DT, idle);
  const m = w.mobs[0];
  assert.ok(m.frozenUntil > w.now, 'frozen');
  const x = m.x;
  m.state = 'walk';
  for (let i = 0; i < 60; i++) updateWorld(w, DT, idle);
  assert.equal(m.x, x, "a frozen monster doesn't move");
});

test('poison keeps damaging monsters after the hit', () => {
  const w = mageAt50('fpwizard', 'fparchmage');
  w.char.skills.poisonmist = 20;
  crowd(w, 2, 'cloudsheep');
  w.body.facing = 1;
  assert.equal(cast(w, 'poisonmist').ok, true);
  for (let i = 0; i < 30; i++) updateWorld(w, DT, idle);
  const m = w.mobs[0];
  assert.ok(m.poison, 'poisoned');
  const hp = m.hp;
  for (let i = 0; i < 60 * 2.2; i++) updateWorld(w, DT, idle);
  assert.ok(m.hp < hp, 'took poison damage over time');
});

test('chain lightning leaps through several monsters, one after another', () => {
  const w = mageAt50('ilwizard', 'ilarchmage');
  w.char.skills.chainlightning = 20;
  crowd(w, 8, 'cloudsheep');
  w.body.facing = 1;
  const r = cast(w, 'chainlightning');
  assert.equal(r.targets, 6);
  const times = w.pending.map((h) => h.at);
  assert.ok(times.every((t, i) => i === 0 || t > times[i - 1]), 'each hop lands after the last');
  assert.ok(w.fx.some((f) => f.kind === 'chainbolt' && f.points.length === 7));
});

test('Blink teleports the mage forward', () => {
  const w = newWorld();
  gainExp(w.char, 1e5);
  advanceJob(w.char, 'mage');
  w.char.skills.blink = 10;
  updateWorld(w, DT, idle);
  w.body.facing = 1;
  const x = w.body.x;
  assert.equal(cast(w, 'blink').ok, true);
  assert.equal(w.body.x, x + 150);
});

test('old saves move to the renamed jobs and get SP back for removed skills', async () => {
  const { updateRetiredJobs } = await import('../src/core/save.js');
  const c = { job: 'infernosage', sp: 0, skills: { meteor: 10, overload: 5, shadowcross: 3, fireball: 20 }, hotkeys: { KeyQ: { skill: 'overload' }, KeyW: { skill: 'meteor' } } };
  updateRetiredJobs(c);
  assert.equal(c.job, 'fparchmage');
  assert.equal(c.sp, 8);
  assert.deepEqual(c.skills, { meteor: 10, fireball: 20 });
  assert.equal(c.hotkeys.KeyQ, null);
  assert.deepEqual(c.hotkeys.KeyW, { skill: 'meteor' });
});
