import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MAPS } from '../src/data/maps.js';
import { createBody, stepBody } from '../src/world/physics.js';
import { createCharacter, gainExp, learnSkill, advanceJob } from '../src/core/character.js';
import { cast } from '../src/world/combat.js';
import { createWorld, updateWorld, loadMap, respawn, hops, travelTo, travelCost, dropItem } from '../src/world/world.js';
import { addItem, countItem } from '../src/core/inventory.js';
import { makeEquip } from '../src/core/items.js';
import { TOWNS } from '../src/data/maps.js';
import { spawnMob } from '../src/world/mobs.js';

const DT = 1 / 60;
const idle = { held: new Set(), pressed: new Set() };
const keys = (held = [], pressed = []) => ({ held: new Set(held), pressed: new Set(pressed) });
const run = (body, map, intent, seconds) => {
  for (let i = 0; i < seconds * 60; i++) stepBody(body, map, intent, DT);
};

// A small map for movement: flat ground at 440, a ledge at x 180-420 (y 360), and a rope at
// x 1100 from a ledge at 210 down to the ground.
const FIELD = {
  width: 1600, height: 480, groundY: 440,
  platforms: [{ x: 180, y: 360, w: 240 }, { x: 1000, y: 210, w: 200 }],
  ropes: [{ x: 1100, top: 210, bottom: 440 }],
};

test('jumping returns to the ground and can land on a ledge above', () => {
  const map = FIELD;
  const body = createBody(300, map.groundY);
  run(body, map, { jump: true }, 0.05);
  run(body, map, {}, 1);
  assert.equal(body.y, 360, 'jumped from the ground onto the ledge overhead');
  assert.equal(body.onGround, true);
});

test('walking off a ledge falls, and Down+Jump drops through one', () => {
  const map = FIELD;
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
  const map = FIELD;
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
  w.body.x = w.map.npcs.find((n) => n.id === 'mira').x;
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

test('monsters respawn near their spawn point after a few seconds', () => {
  const w = newWorld();
  loadMap(w, 'meadow1', 'west');
  const count = w.mobs.length;
  assert.equal(count, MAPS.meadow1.spawns.length * 2, 'two monsters per spawn point');
  const fallen = w.mobs[0];
  fallen.hp = 0;
  for (let i = 0; i < 60 * 5; i++) updateWorld(w, DT, idle);
  assert.equal(w.mobs.filter((m) => m.hp > 0).length, count - 1, 'not back yet');
  for (let i = 0; i < 60 * 6; i++) updateWorld(w, DT, idle);
  assert.equal(w.mobs.filter((m) => m.hp > 0).length, count);
  const back = w.mobs.find((m) => m.hp > 0 && m.uid > fallen.uid && m.def === fallen.def);
  assert.ok(back && Math.abs(back.spawn.x - fallen.spawn.x) <= 90 && back.spawn.y === fallen.spawn.y, 'back on the same ledge, near its spot');
});

test("a monster doesn't respawn on top of you", () => {
  const w = newWorld();
  loadMap(w, 'meadow1', 'west');
  const m = w.mobs.find((o) => !o.def.fly);
  const last = Math.max(...w.mobs.map((o) => o.uid));
  m.hp = 0;
  // Stand right where it fell the whole time.
  for (let i = 0; i < 60 * 12; i++) {
    w.body.x = m.spawn.x;
    w.body.y = m.spawn.y;
    updateWorld(w, DT, idle);
  }
  for (const o of w.mobs) {
    if (o.uid <= last) continue;
    assert.ok(Math.abs(o.spawn.x - w.body.x) >= 100 || Math.abs(o.spawn.y - w.body.y) >= 70, `respawned at ${Math.round(o.spawn.x)} with you at ${Math.round(w.body.x)}`);
  }
});

test('skills spend MP and buffs raise stats', () => {
  const w = newWorld();
  gainExp(w.char, 200);
  learnSkill(w.char, 'quickstep');
  const speed = w.stats.speed;
  w.char.mp = 100;
  w.char.hotkeys = { KeyQ: { skill: 'quickstep' } };
  updateWorld(w, DT, keys([], ['KeyQ']));
  for (let i = 0; i < 40; i++) updateWorld(w, DT, idle);
  assert.ok(w.stats.speed > speed);
  assert.ok(w.char.mp < 100);
});

test('dying costs EXP and respawns you in town', () => {
  const w = newWorld();
  loadMap(w, 'meadow2', 'west');
  gainExp(w.char, 500);
  w.char.exp = 50;
  w.char.hp = 1;
  const m = spawnMob(w.map, { mob: 'piglet', x: w.body.x, y: w.body.y });
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
  gainExp(w.char, 3e7);
  loadMap(w, 'bossroom', 'west');
  const boss = w.mobs.find((m) => m.def.boss);
  assert.ok(boss);
  w.body.x = boss.x - 150;
  w.invuln = 0;
  const hp = w.char.hp;
  let wound = false;
  for (let i = 0; i < 60 * 9; i++) {
    updateWorld(w, DT, idle);
    wound ||= boss.special.warn > 0;
  }
  assert.ok(w.char.hp < hp, 'took slam damage');
  assert.ok(wound && boss.attackAt > 0, 'the slam is wound up, then played as an attack');
});

test('a monster plays its attack when it hits you on touch', () => {
  const w = newWorld();
  loadMap(w, 'meadow1', 'west');
  const m = w.mobs[0];
  w.invuln = 0;
  w.body.x = m.x;
  w.body.y = m.y;
  updateWorld(w, DT, idle);
  assert.equal(m.attackAt, w.now);
});

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

test('every town connects to every other town by road', () => {
  for (const a of TOWNS) for (const b of TOWNS) assert.ok(Number.isFinite(hops(a, b)), `${a} -> ${b}`);
  for (const t of TOWNS) assert.ok(MAPS[t].isTown && MAPS[t].job, `${t} is a job's home town`);
  assert.deepEqual(new Set(TOWNS.map((t) => MAPS[t].job)), new Set(['archer', 'thief', 'warrior', 'mage']));
});

test('fast travel flies for free from a town to any place on the map, and only from a town', () => {
  const w = newWorld();
  w.char.gold = 0;
  assert.equal(travelCost('sprout', 'grove'), 0);
  assert.equal(travelTo(w, 'grove'), null);
  assert.equal(w.map.id, 'grove');
  // To a field (landing on its homestone) and to a dungeon's gate.
  assert.equal(travelTo(w, 'ruins'), null);
  assert.equal(w.map.id, 'ruins');
  assert.ok(travelTo(w, 'sprout'), 'no flights from the field');
  assert.equal(w.map.id, 'ruins');
  loadMap(w, 'harbor', 'start');
  assert.equal(travelTo(w, 'manor_gate'), null);
  assert.equal(w.map.id, 'manor_gate');
  // Never straight into a dungeon room.
  loadMap(w, 'harbor', 'start');
  assert.ok(travelTo(w, 'manor2'));
  assert.equal(w.map.id, 'harbor');
  // Every place on the map can be flown to from a town and lands on solid ground.
  for (const m of Object.values(MAPS)) {
    if (!m.world || m.trial || m.isTown) continue;
    loadMap(w, 'sprout', 'start');
    assert.equal(travelTo(w, m.id), null, m.id);
    assert.equal(w.map.id, m.id);
  }
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
  gmCommand(w, 'level', ['37']);
  assert.equal(w.char.level, 37);
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

test('skills never go on cooldown: a spell is free again a beat after its motion ends', async () => {
  const { setJob, setLevel, gmCommand } = await import('../src/world/gm.js');
  const w = newWorld();
  setJob(w.char, 'thief');
  setLevel(w.char, 40);
  w.char.equipment.weapon = makeEquip('dagger_20', {});
  w.char.skills.pirouette = 10;
  w.char.baseMp = 5000;
  gmCommand(w, 'heal', []);
  updateWorld(w, DT, idle);
  assert.equal(cast(w, 'pirouette').ok, true);
  assert.equal(cast(w, 'pirouette').reason, 'busy', 'not while she spins away');
  for (let i = 0; i < 28; i++) updateWorld(w, DT, idle);
  assert.equal(cast(w, 'pirouette').reason, 'busy', 'a beat of recovery after the motion, so it cannot be mashed');
  for (let i = 0; i < 30; i++) updateWorld(w, DT, idle);
  assert.equal(cast(w, 'pirouette').ok, true, 'usable again right after that beat: no cooldown');
});

test("a GM job swap forgets skills from outside the new job's line and gives their SP back", async () => {
  const { setJob } = await import('../src/world/gm.js');
  const { SKILLS } = await import('../src/data/skills.js');
  const w = newWorld();
  const c = w.char;
  setJob(c, 'shinobi');
  const thiefSkill = Object.values(SKILLS).find((s) => s.job === 'thief' && s.type !== 'passive').id;
  const shinobiSkill = Object.values(SKILLS).find((s) => s.job === 'shinobi' && s.type !== 'passive').id;
  c.skills[thiefSkill] = 3;
  c.skills[shinobiSkill] = 2;
  c.hotkeys = { KeyQ: { skill: thiefSkill }, KeyW: { skill: shinobiSkill }, KeyE: { item: 'potion_red' } };
  const sp = c.sp;
  setJob(c, 'kitsune');
  assert.equal(c.skills[thiefSkill], 3, 'the shared Thief skills stay');
  assert.equal(c.skills[shinobiSkill], undefined, "the Shinobi's own skills are gone");
  assert.equal(c.sp, sp + 2);
  assert.deepEqual(c.hotkeys, { KeyQ: { skill: thiefSkill }, KeyE: { item: 'potion_red' } });
  setJob(c, 'gamemaster');
  const spAsGm = c.sp;
  setJob(c, 'warrior');
  assert.equal(c.sp, spAsGm, 'the free GM skills give no SP');
  assert.ok(Object.keys(c.skills).every((id) => ['novice', 'warrior'].includes(SKILLS[id].job)));
});

test("the Star Witch branches two ways at 30, the Starlight Idol and the Astronomer, after Elowen's trial", async () => {
  const { nextJobs, jobChain } = await import('../src/data/jobs.js');
  const { QUESTS } = await import('../src/data/quests.js');
  assert.deepEqual(nextJobs('mage', 30).map((j) => j.id).sort(), ['cleric', 'sorcerer']);
  assert.deepEqual(nextJobs('mage', 30, {}).map((j) => j.id), [], 'not before the trial');
  assert.deepEqual(nextJobs('mage', 30, { mage_trial: { state: 'done' } }).map((j) => j.id).sort(), ['cleric', 'sorcerer']);
  assert.equal(QUESTS.mage_trial.giver, 'elowen');
  for (const path of ['cleric', 'sorcerer']) assert.ok(jobChain(path).includes('mage'), `${path} keeps the Spirit Mage's kit`);
});

test('the warrior, the archer and the thief branch two ways at 30; the Spirit Mage is the magic class', async () => {
  const { nextJobs, JOBS } = await import('../src/data/jobs.js');
  const { SKILLS } = await import('../src/data/skills.js');
  assert.deepEqual(nextJobs('novice', 10).map((j) => j.id).sort(), ['archer', 'mage', 'thief', 'warrior']);
  for (const first of ['warrior', 'archer', 'thief', 'mage']) {
    assert.ok(Object.values(SKILLS).some((k) => k.job === first && (k.type === 'blink' || k.movement)), `${first} has a movement skill`);
  }
  assert.deepEqual(nextJobs('warrior', 30).map((j) => j.id).sort(), ['berserker', 'paladin'], 'warrior has two paths at 30');
  assert.deepEqual(nextJobs('archer', 30).map((j) => j.id).sort(), ['beastmaster', 'stormcaller'], 'archer has two paths at 30');
  assert.deepEqual(nextJobs('thief', 30).map((j) => j.id).sort(), ['kitsune', 'shinobi'], 'thief has two paths at 30');
});

test('a shoulder charge dashes forward and hits the monsters it passes through', () => {
  const w = newWorld();
  gainExp(w.char, 3e5);
  assert.equal(advanceJob(w.char, 'warrior'), true);
  w.char.skills.shouldercharge = 10;
  w.char.mp = 999;
  crowd(w, 4, 'cloudsheep');
  w.body.facing = 1;
  const x = w.body.x;
  assert.equal(cast(w, 'shouldercharge').ok, true);
  for (let i = 0; i < 40; i++) updateWorld(w, DT, idle);
  assert.ok(w.body.x > x + 60, 'moved forward');
  assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 4, 'hit everything it passed');
});

test('old saves move to the renamed jobs and get SP back for removed skills', async () => {
  const { updateRetiredJobs } = await import('../src/core/save.js');
  const c = { job: 'infernosage', sp: 0, skills: { petalbolt: 10, overload: 5, shadowcross: 3, fireball: 20 }, hotkeys: { KeyQ: { skill: 'overload' }, KeyW: { skill: 'petalbolt' } } };
  updateRetiredJobs(c);
  assert.equal(c.job, 'novice', 'the Mage and her old paths were removed: back to the Novice');
  assert.equal(c.sp, 38, 'every one of the old skills gives its points back');
  assert.deepEqual(c.skills, {});
  assert.equal(c.hotkeys.KeyQ, null);
  assert.equal(c.hotkeys.KeyW, null);
  // The Mage line's old ids move to their new ones, and the trial's record moves with them.
  for (const [was, now] of [['spiritmage', 'mage'], ['onmyoji', 'sorcerer'], ['shrinemaiden', 'cleric']]) {
    const r = { job: was, sp: 0, skills: {}, hotkeys: {}, quests: { spiritmage_trial: { state: 'done' } } };
    updateRetiredJobs(r);
    assert.equal(r.job, now, was);
    assert.equal(r.quests.mage_trial?.state, 'done', `${was}: the trial stays done`);
    assert.ok(!r.quests.spiritmage_trial, 'under its new name');
  }
  // The Ranger and Sniper were remade as the Beastmaster and the Stormcaller; a job that exists
  // today stays, even if an old retired job once had its id (the Beastmaster).
  for (const [was, now] of [['ranger', 'beastmaster'], ['sniper', 'stormcaller'], ['beastmaster', 'beastmaster']]) {
    const r = { job: was, sp: 0, skills: { galevolley: 10, twinshot: 5 }, hotkeys: {} };
    updateRetiredJobs(r);
    assert.equal(r.job, now, was);
    assert.equal(r.sp, 15, `${was}: the old skills' points come back`);
  }
  // The Assassin and the Night Lord were removed: they become the Shinobi and the Kitsune (the
  // new paths for the same weapons), with their old skills' points given back.
  for (const [was, now] of [['assassin', 'shinobi'], ['nightlord', 'kitsune']]) {
    const r = { job: was, sp: 0, skills: { ribbonlash: 10, crowcombo: 7, galaxyfall: 3 }, hotkeys: { KeyQ: { skill: 'crowcombo' } } };
    updateRetiredJobs(r);
    assert.equal(r.job, now, was);
    assert.equal(r.sp, 10, `${was}: the old skills' points come back`);
    assert.deepEqual(r.skills, { ribbonlash: 10 });
    assert.equal(r.hotkeys.KeyQ, null);
  }
});

test('auto-loot picks up drops without holding X', async () => {
  const { spawnDrops } = await import('../src/world/drops.js');
  const w = newWorld();
  w.drops.push(...spawnDrops([{ kind: 'gold', amount: 25 }], w.body.x, w.body.y));
  for (let i = 0; i < 90; i++) updateWorld(w, DT, idle);
  assert.equal(w.char.gold, 0, 'nothing picked up by default');
  w.settings = { autoLoot: true };
  for (let i = 0; i < 10; i++) updateWorld(w, DT, idle);
  assert.equal(w.char.gold, 25);
});

test('bag items dropped in the world land in front of you and only come back with the loot key', () => {
  const w = newWorld();
  w.settings = { autoLoot: true };
  const before = countItem(w.char.inventory, 'red_potion');
  addItem(w.char.inventory, 'red_potion', 5);
  const i = w.char.inventory.use.findIndex((e) => e.id === 'red_potion');
  assert.ok(dropItem(w, 'use', i, 2));
  assert.equal(countItem(w.char.inventory, 'red_potion'), before + 3);
  const d = w.drops.at(-1);
  assert.equal(d.qty, 2);
  assert.ok(d.dropped);
  // It falls and lands; auto-loot leaves it alone.
  for (let t = 0; t < 90; t++) updateWorld(w, DT, keys([]));
  assert.ok(d.landed);
  assert.equal(countItem(w.char.inventory, 'red_potion'), before + 3);
  // Walking back onto it and pressing X picks it up.
  w.body.x = d.x;
  for (let t = 0; t < 10; t++) updateWorld(w, DT, keys(['KeyX']));
  assert.equal(countItem(w.char.inventory, 'red_potion'), before + 5);

  // Equipment drops whole; Cash items can't be dropped.
  addItem(w.char.inventory, makeEquip('hat_0'));
  const n = w.char.inventory.equip.length;
  assert.ok(dropItem(w, 'equip', n - 1));
  assert.equal(w.char.inventory.equip.length, n - 1);
  assert.equal(w.drops.at(-1).inst.id, 'hat_0');
  w.char.inventory.cash.push(makeEquip('hat_0'));
  assert.equal(dropItem(w, 'cash', 0), false);
});

test('out of a fight you heal a share of your max HP every second; stat points place themselves', async () => {
  const { settings } = await import('../src/core/settings.js');
  const w = newWorld();
  loadMap(w, 'meadow1', 'west');
  w.mobs = [];
  w.spawner.slots = [];
  const idle = { held: new Set(), pressed: new Set(), locked: false };
  const max = w.stats.maxHp;
  w.char.hp = Math.round(max / 2);
  w.hurtAt = w.now;
  for (let i = 0; i < 60 * 2; i++) updateWorld(w, 1 / 60, idle);
  assert.ok(w.char.hp <= Math.round(max / 2) + 1, 'not right after a hit');
  for (let i = 0; i < 60 * 5; i++) updateWorld(w, 1 / 60, idle);
  assert.ok(w.char.hp >= Math.round(max / 2) + Math.round(max * 0.02) * 2, `heals once the fight is over (${w.char.hp}/${max})`);
  // A level up's stat points go straight where they're needed (on by default).
  assert.equal(settings.autoStats, true);
  gainExp(w.char, 5000);
  updateWorld(w, 1 / 60, idle);
  assert.equal(w.char.ap, 0);
});

test('potions heal a share of your max as well as a flat amount, so they keep up', async () => {
  const { usePotion } = await import('../src/core/character.js');
  const { addItem } = await import('../src/core/inventory.js');
  const { computeStats } = await import('../src/core/stats.js');
  const c = createCharacter('Drinker', {});
  c.baseHp = 3000;
  const max = computeStats(c).maxHp;
  c.hp = 1;
  addItem(c.inventory, 'white_potion', 1);
  usePotion(c, 'white_potion');
  assert.equal(c.hp, 1 + 300 + Math.round(max * 0.3));
});

test('the stat-only skills grow by themselves and give their SP back; a replaced skill hands its hotkey over', async () => {
  const { updateRetiredJobs } = await import('../src/core/save.js');
  const { canLearn } = await import('../src/core/character.js');
  const c = { job: 'cleric', level: 35, sp: 0, skills: { manamastery: 12, shrinemastery: 4, blessing: 7, grandblessing: 2, cozyrest: 3 }, hotkeys: { KeyQ: { skill: 'blessing' } } };
  updateRetiredJobs(c);
  assert.equal(c.sp, 12 + 4 + 7 + 3, 'the masteries, the replaced Blessing and the cut Cozy Rest give their points back');
  assert.deepEqual(c.skills, { grandblessing: 2 });
  assert.equal(c.hotkeys.KeyQ.skill, 'grandblessing', "Blessing's key now casts Grand Blessing");
  c.sp = 5;
  assert.ok(!canLearn(c, 'manamastery'), 'a mastery is not learned with SP');
  assert.ok(!canLearn(c, 'blessing'), 'nor is a replaced skill');
  const { grownLevel } = await import('../src/core/stats.js');
  const { SKILLS } = await import('../src/data/skills.js');
  assert.equal(grownLevel(c, SKILLS.manamastery), 20, 'a first-job mastery is full by 30');
  assert.equal(grownLevel(c, SKILLS.shrinemastery), 6, 'a second-job mastery grows from 30');
  assert.equal(grownLevel({ ...c, level: 50 }, SKILLS.shrinemastery), 20, 'and is full by 50');
});
