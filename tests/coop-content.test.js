// Co-op content (docs/design/coop.md, part 2): party quests with shared progress (your kills and
// finds, your party members', and online friends'), the two-person boss mechanics (and bots playing
// them), solo still winnable, and Hard mode needing a party and paying more.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createWorld, updateWorld, loadMap, killMob } from '../src/world/world.js';
import { createCharacter } from '../src/core/character.js';
import { createBots, updateBots, makeBotCharacter, recruitBot } from '../src/world/bots.js';
import { joinParty, partyMembers } from '../src/world/party.js';
import { spawnMob } from '../src/world/mobs.js';
import { countItem } from '../src/core/inventory.js';
import { startRun, hardBlocker, dungeonInteract, groupOf, noteHit } from '../src/world/dungeon.js';
import { boardOffers, takePartyQuest, pqGather, onPartyQuestMsg, buyWithTokens } from '../src/world/partyquest.js';
import { armBoss, coopHit, tickCoopBosses, mechOf, mechsFor, inRing, onSeal } from '../src/world/coopboss.js';
import { CHEST_TOKENS, COOP_MECHS, HARD_MECHS, PQ_KINDS } from '../src/data/coop.js';
import { MOBS } from '../src/data/mobs.js';
import { NPCS } from '../src/data/npcs.js';
import { MAPS } from '../src/data/maps.js';
import { navOf, surfaceBelow } from '../src/world/nav.js';

const DT = 1 / 60;
const idle = { held: new Set(), pressed: new Set(), locked: false };
function seeded(n) {
  return () => {
    n = (n * 1664525 + 1013904223) % 4294967296;
    return n / 4294967296;
  };
}
const CLOCK = () => new Date(2026, 10, 3, 15, 0).getTime();

// You (a level `level` Archer) on `mapId`, with `n` bot party members beside you.
function field(mapId, { level = 8, n = 1, seed = 7, jobs = ['archer'] } = {}) {
  const rng = seeded(seed);
  const char = makeBotCharacter(rng, { name: 'Tester', pro: false, level, jobs });
  char.mapId = mapId;
  const world = createWorld(char);
  world.clock = CLOCK;
  world.log = () => {};
  world.bots = createBots(world, rng, { clock: () => new Date(2026, 10, 3, 15, 0) });
  loadMap(world, mapId, MAPS[mapId].portals[0].id);
  for (let i = 0; i < n; i++) {
    const bot = recruitBot(world.bots, world, { level, jobs: [i % 2 ? 'warrior' : 'thief'] });
    joinParty(world.bots, bot, world);
  }
  return world;
}
const step = (world, secs, input = idle) => {
  for (let i = 0; i < secs * 60; i++) {
    updateWorld(world, DT, input);
    updateBots(world.bots, world, DT);
    if (world.scene) world.scene = null;
  }
};
// A floor spot under (x, y): { x, y }.
function floorAt(world, x, y) {
  const nav = navOf(world.map);
  const s = nav.surfaces[surfaceBelow(nav, x, y - 4)];
  return { x, y: s.yAt ? s.yAt(x) : s.y };
}
function place(body, at) {
  Object.assign(body, { x: at.x, y: at.y, vx: 0, vy: 0, onGround: true, rope: null });
}

// ---------- The board ----------

test('every town has a Party Board in its plaza, offering a hunt, a gather and a defend', () => {
  assert.equal(NPCS.posy.role, 'board');
  for (const id of ['sprout', 'harbor', 'crag', 'grove']) {
    const map = MAPS[id];
    const posy = map.npcs.find((n) => n.id === 'posy');
    assert.ok(posy, `${id} has Posy`);
    assert.ok(Math.abs(posy.x - map.plaza) <= 700, `${id}: the board is near the plaza`);
    const world = field(id, { n: 0, level: { sprout: 6, harbor: 14, crag: 26, grove: 34 }[id] });
    const offers = boardOffers(world);
    assert.deepEqual(offers.map((q) => q.kind), ['hunt', 'gather', 'defend'], id);
    for (const q of offers) {
      assert.ok(MAPS[q.map], `${id}: ${q.map}`);
      assert.ok(q.reward.exp > 0 && q.reward.tokens > 0);
    }
    // The same board for everyone at the same time; a new one a couple of hours later.
    assert.deepEqual(boardOffers(world).map((q) => q.key), offers.map((q) => q.key));
    world.clock = () => CLOCK() + 2.1 * 3600e3;
    assert.notDeepEqual(boardOffers(world).map((q) => q.key), offers.map((q) => q.key));
  }
});

// ---------- Shared progress ----------

test('a hunt quest counts your kills, your party members\' and online friends\', and pays everyone', () => {
  const world = field('meadow1', { n: 2 });
  const q = { ...boardOffers(world, 'sprout').find((o) => o.kind === 'hunt'), map: 'meadow1', mob: 'snailbun' };
  assert.equal(takePartyQuest(world, q), null);
  const pq = world.char.partyQuest;
  const kill = (byParty) => {
    const m = spawnMob(world.map, { mob: 'snailbun', x: world.body.x + 40, y: world.body.y });
    world.mobs.push(m);
    m.hp = 0;
    killMob(world, m, byParty);
  };
  kill(false);
  kill(true);
  kill(true);
  assert.equal(pq.have, 3, 'yours and the bots\' kills count');
  // A monster a friend's game felled is counted by their game (it tells you), not twice.
  const m = spawnMob(world.map, { mob: 'snailbun', x: world.body.x, y: world.body.y });
  m.byNet = true;
  killMob(world, m);
  assert.equal(pq.have, 3);
  onPartyQuestMsg(world, { op: 'add', key: pq.key, n: 4 }, 'Friend');
  assert.equal(pq.have, 7, 'a friend\'s kills count');
  onPartyQuestMsg(world, { op: 'add', key: 'some other quest', n: 4 }, 'Friend');
  assert.equal(pq.have, 7);
  // Done: you and every member are paid.
  const gold = world.char.gold;
  const botExp = partyMembers(world.bots).map((b) => b.char.exp + b.char.level * 1e9);
  while (world.char.partyQuest) kill(true);
  assert.ok(world.char.gold >= gold + q.reward.gold);
  assert.equal(countItem(world.char.inventory, 'party_token'), q.reward.tokens);
  partyMembers(world.bots).forEach((b, i) => assert.ok(b.char.exp + b.char.level * 1e9 > botExp[i], `${b.name} got EXP`));
  // Tokens trade at the board.
  world.char.inventory.etc.find((s) => s.id === 'party_token').qty = 10;
  assert.equal(buyWithTokens(world, 0), null);
  assert.equal(countItem(world.char.inventory, 'party_token'), 4);
});

test('a friend taking a party quest shares it with you', () => {
  const world = field('meadow1', { n: 0 });
  const q = boardOffers(world, 'sprout')[1];
  onPartyQuestMsg(world, { op: 'take', q }, 'Friend');
  assert.equal(world.char.partyQuest.key, q.key);
});

test('a gather quest counts your finds and party members gather for it too', () => {
  const world = field('meadow1', { n: 2 });
  const q = { ...boardOffers(world, 'sprout').find((o) => o.kind === 'gather'), map: 'meadow1', item: 'clover', need: PQ_KINDS.gather.need };
  takePartyQuest(world, q);
  pqGather(world, { clover: 2, cherry: 1 });
  assert.equal(world.char.partyQuest.have, 2);
  // Out of the way (no spot of yours), the party goes gathering.
  place(world.body, floorAt(world, 60, world.map.groundY));
  world.god = true;
  for (let t = 0; t < 90 && world.char.partyQuest && world.char.partyQuest.have <= 2; t++) step(world, 1);
  assert.ok(!world.char.partyQuest || world.char.partyQuest.have > 2, 'a party member gathered clover for the party');
});

test('a defend quest sends waves at the calm stone, and holding them off counts', () => {
  const world = field('meadow1', { n: 1 });
  const q = { ...boardOffers(world, 'sprout').find((o) => o.kind === 'defend'), map: 'meadow1', pool: ['snailbun'] };
  takePartyQuest(world, q);
  step(world, 4);
  const d = world.pqDefend;
  assert.ok(d?.spot && d.mobs.length >= 5, 'the first wave came');
  for (const m of d.mobs) {
    m.hp = 0;
    killMob(world, m);
  }
  step(world, 0.2);
  assert.equal(world.char.partyQuest.have, 1);
});

// ---------- Boss mechanics ----------

test('every area boss and dungeon boss has a co-op mechanic, and Hard adds one more', () => {
  for (const id of ['queenbee', 'macgoblin', 'mothercapper', 'tuskar', 'gnarlroot']) assert.ok(COOP_MECHS[id]?.length, id);
  for (const id of ['mothercapper', 'tuskar', 'gnarlroot']) {
    assert.ok(HARD_MECHS[id], id);
    assert.ok(!COOP_MECHS[id].some((d) => d.kind === HARD_MECHS[id].kind), `${id}: Hard's is a different one`);
  }
  for (const n of Object.values(MAPS).filter((m) => m.nest)) assert.ok(COOP_MECHS[n.nest.mob], n.nest.mob);
});

function bossOn(world, mob, x) {
  const at = floorAt(world, x, world.body.y);
  const m = spawnMob(world.map, { mob, x: at.x, y: at.y });
  world.mobs.push(m);
  armBoss(world, m);
  return m;
}

test("the Queen Bee's honey bomb is shared by everyone in the ring, and bots crowd in", () => {
  const world = field('meadow1', { n: 1, level: 9 });
  world.mobs = [];
  const bot = partyMembers(world.bots)[0];
  const at = floorAt(world, 700, world.map.groundY);
  place(world.body, at);
  place(bot.body, { x: at.x + 110, y: at.y });
  const queen = bossOn(world, 'queenbee', at.x + 420);
  const s = mechOf(queen, 'split');
  s.next = 0;
  tickCoopBosses(world, DT);
  assert.ok(s.ring, 'the ring is marked');
  // Move the ring under you so the test is about the bot walking into it.
  s.ring.x = at.x;
  s.ring.y = at.y;
  const hp = world.char.hp;
  bot.hp = bot.stats.maxHp;
  for (let i = 0; i < 60 * 4 && s.ring; i++) {
    world.body.x = at.x;
    updateWorld(world, DT, idle);
    updateBots(world.bots, world, DT);
  }
  assert.ok(world.coopFx.some((f) => f.kind === 'split' && f.n >= 2), 'the bot stood in the ring with you as it landed');
  const took = hp - world.char.hp;
  const full = MOBS.queenbee.atk * s.def.hit;
  assert.ok(took > 0 && took < full * 0.7, `you took a share (${took} of ${full})`);
  assert.ok(bot.hp < bot.stats.maxHp, 'the bot took its share');
});

test("Old MacGoblin's guard only breaks when he's struck from both sides, and bots take the other side", () => {
  const world = field('meadow2', { n: 1, level: 11 });
  world.mobs = [];
  world.god = true;
  const bot = partyMembers(world.bots)[0];
  const at = floorAt(world, 900, world.map.groundY);
  place(world.body, { x: at.x - 60, y: at.y });
  place(bot.body, { x: at.x - 90, y: at.y });
  const mac = bossOn(world, 'macgoblin', at.x);
  const s = mechOf(mac, 'sides');
  // Hits from one side only stay guarded.
  const left = coopHit(world, mac, { damage: 100, fromX: mac.x - 50 });
  assert.equal(left, 40);
  world.now += 0.4;
  assert.equal(coopHit(world, mac, { damage: 100, fromX: mac.x - 50 }), 40);
  assert.ok(s.guard);
  world.now += 0.4;
  coopHit(world, mac, { damage: 100, fromX: mac.x + 50 });
  assert.ok(!s.guard, 'struck from both sides: broken');
  assert.equal(coopHit(world, mac, { damage: 100, fromX: mac.x - 50 }), 125);
  // It forms again after a while; the bot goes round to the side you're not on.
  world.now += s.def.open + 0.1;
  s.planAt = 0;
  let round = false;
  let broke = false;
  for (let i = 0; i < 60 * 8 && !broke; i++) {
    world.body.x = mac.x - 60;
    updateWorld(world, DT, idle);
    updateBots(world.bots, world, DT);
    if (s.guard) round ||= bot.body.x > mac.x;
    // (You keep striking from your side.)
    if (i % 30 === 0) coopHit(world, mac, { damage: 1, fromX: mac.x - 60 });
    broke = !s.guard;
  }
  assert.equal(s.side[bot.id], 1, 'the bot was sent to the far side');
  assert.ok(round, 'the bot went round');
  assert.ok(broke, 'together you broke the guard');
});

test('solo still wins against a guarded boss, just slower', () => {
  const world = field('meadow2', { n: 0, level: 11 });
  world.mobs = [];
  const mac = bossOn(world, 'macgoblin', 900);
  let hits = 0;
  while (mac.hp > 0 && hits < 1000) {
    mac.hp -= coopHit(world, mac, { damage: 100, fromX: mac.x - 50 });
    world.now += 0.5;
    hits++;
  }
  assert.ok(mac.hp <= 0, 'beaten alone');
  assert.ok(hits <= Math.ceil(MOBS.macgoblin.hp / 40) + 1);
  // And a lone player in the honey ring takes the whole blow but lives through it at the level.
  const w2 = field('meadow1', { n: 0, level: 8 });
  w2.mobs = [];
  const at = floorAt(w2, 700, w2.map.groundY);
  place(w2.body, at);
  const q = bossOn(w2, 'queenbee', at.x + 60);
  const s = mechOf(q, 'split');
  s.next = 0;
  tickCoopBosses(w2, DT);
  Object.assign(s.ring, { x: at.x, y: at.y, t: s.ring.warn });
  w2.char.hp = w2.stats.maxHp;
  tickCoopBosses(w2, DT);
  assert.ok(w2.char.hp > 0 && w2.char.hp < w2.stats.maxHp, 'took it all and lived');
});

// A run of Rootwood Hollow with a bot party, jumped to a boss room.
function hollowAt(room, { hard = false } = {}) {
  const rng = seeded(5);
  const char = makeBotCharacter(rng, { name: 'Tester', pro: false, level: 12, jobs: ['archer'] });
  char.mapId = 'hollow_gate';
  const world = createWorld(char);
  world.log = () => {};
  world.bots = createBots(world, rng, { clock: () => new Date(2026, 9, 28, 20, 0) });
  world.god = true;
  joinParty(world.bots, recruitBot(world.bots, world, { level: 12, jobs: ['warrior'] }), world);
  assert.equal(startRun(world, 'hollow', { hard }), null);
  loadMap(world, room, 'west');
  return world;
}

test("Gnarlroot's armour is down only while someone holds the Root Seal, and a bot takes it", () => {
  const world = hollowAt('hollow6');
  const boss = world.mobs.find((m) => m.def.id === 'gnarlroot');
  noteHit(world, boss, { damage: 1 });
  armBoss(world, boss);
  const s = mechOf(boss, 'seal');
  tickCoopBosses(world, DT);
  assert.ok(s.x != null, 'the seal is down');
  assert.equal(coopHit(world, boss, { damage: 100, fromX: boss.x - 40 }), 40);
  let held = false;
  for (let i = 0; i < 60 * 12 && !held; i++) {
    updateWorld(world, DT, idle);
    updateBots(world.bots, world, DT);
    if (world.scene) world.scene = null;
    held = Boolean(s.heldBy && s.heldBy !== 'you');
  }
  assert.ok(s.holder && s.holder !== 'you', 'a party member was sent to the seal');
  assert.ok(held, 'a party member stands on the seal');
  const g = groupOf(world).find((o) => o.id === s.heldBy);
  assert.ok(onSeal(s, g.body));
  assert.ok(world.mobs.find((m) => m.def.id === 'gnarlroot').coop === boss.coop);
  assert.equal(coopHit(world, boss, { damage: 100, fromX: boss.x - 40 }), 100);
});

test('Hard mode: the Myconid Queen adds tethered twins that must fall together', () => {
  const normal = hollowAt('hollow2');
  const q0 = normal.mobs.find((m) => m.def.id === 'mothercapper');
  assert.ok(!mechsFor(normal, q0).some((d) => d.kind === 'twins'));
  const world = hollowAt('hollow2', { hard: true });
  const queen = world.mobs.find((m) => m.def.id === 'mothercapper');
  assert.ok(mechsFor(world, queen).some((d) => d.kind === 'twins'));
  noteHit(world, queen, { damage: 1 });
  armBoss(world, queen);
  queen.hp = queen.def.hp * 0.5;
  const s = mechOf(queen, 'twins');
  tickCoopBosses(world, DT);
  assert.equal(s.pair?.length, 2, 'the twins came');
  // One falls alone: its twin calls it back.
  s.pair[0].hp = 0;
  tickCoopBosses(world, DT);
  world.now += s.def.revive + 0.1;
  tickCoopBosses(world, DT);
  assert.ok(s.pair[0].hp > 0, 'called back');
  // Together: they stay down.
  s.pair[0].hp = 0;
  s.pair[1].hp = 0;
  tickCoopBosses(world, DT);
  world.now += s.def.revive + 1;
  tickCoopBosses(world, DT);
  assert.ok(s.done && s.pair.every((a) => a.hp <= 0));
});

// ---------- Hard mode ----------

test('Hard mode needs a party of two or more and pays more tokens, with its own crown', () => {
  const rng = seeded(9);
  const char = makeBotCharacter(rng, { name: 'Tester', pro: false, level: 12, jobs: ['archer'] });
  char.mapId = 'hollow_gate';
  char.dungeons = { hollow: { clears: 1, hardClears: 0, best: 'A', bestTime: 700, day: null } };
  const world = createWorld(char);
  world.log = () => {};
  world.bots = createBots(world, rng, { clock: () => new Date(2026, 9, 28, 20, 0) });
  assert.match(hardBlocker(world), /party/);
  assert.match(startRun(world, 'hollow', { hard: true }), /party/);
  joinParty(world.bots, recruitBot(world.bots, world, { level: 12, jobs: ['warrior'] }), world);
  assert.equal(hardBlocker(world), null);
  assert.equal(startRun(world, 'hollow', { hard: true }), null);
  // The chest at the end.
  loadMap(world, 'hollow6', 'west');
  world.dungeon.room.cleared = true;
  const chest = world.dungeon.room.objects.find((o) => o.kind === 'chest');
  Object.assign(world.body, { x: chest.x, y: chest.y, onGround: true });
  assert.ok(dungeonInteract(world));
  assert.equal(countItem(world.char.inventory, 'party_token'), CHEST_TOKENS.hard);
  assert.ok(world.char.inventory.cash.some((c) => c.id === 'cash_rootwood_crown'), 'the Hard-only crown');
  assert.ok(CHEST_TOKENS.hard >= CHEST_TOKENS.normal * 2);
});

test('the Party Board quests stay out of the way of a solo player in town', () => {
  const world = createWorld(createCharacter('Solo', {}));
  world.clock = CLOCK;
  loadMap(world, 'sprout', 'start');
  // No party quest taken: nothing ticks, nothing is drawn.
  updateWorld(world, DT, idle);
  assert.equal(world.char.partyQuest ?? null, null);
});
