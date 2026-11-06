// Co-op life skills (world/coop-life.js): working a spot together, the party feast, and crafting
// for a friend, with bot party members and online party friends (through the world.net hooks).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createWorld, loadMap, useItem } from '../src/world/world.js';
import { createCharacter } from '../src/core/character.js';
import { addItem, countItem } from '../src/core/inventory.js';
import { computeStats } from '../src/core/stats.js';
import { makeBotCharacter } from '../src/world/bots.js';
import { joinParty, updateParty } from '../src/world/party.js';
import { NODES, KINDS } from '../src/data/gathering.js';
import { FEASTS, FEAST_BY_ID } from '../src/data/cooking.js';
import { RECIPES } from '../src/data/crafting.js';
import { nodeReady, startGathering, tickGathering } from '../src/world/gathering.js';
import { startCrafting, tickCrafting } from '../src/world/crafting.js';
import { lifeExp, lifeLevel } from '../src/core/life.js';

const lifeTotal = (char, skill) => lifeLevel(char, skill) * 1e6 + lifeExp(char, skill);
import { ITEMS } from '../src/data/items.js';
import { itemTooltip } from '../src/ui/tooltips.js';
import {
  spotKey, startedWork, workersAt, togetherBonus, friendWorking, cookFeast, serveFeast, friendFeast, craftTargets, deliverCraft, TOGETHER_WINDOW,
} from '../src/world/coop-life.js';

const seeded = (seed) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

function setup(mapId = 'meadow1') {
  const world = createWorld(createCharacter('Me', {}));
  world.log = () => {};
  loadMap(world, mapId, 'west');
  world.mobs = [];
  world.spawner.slots = [];
  const bots = { list: [], memory: new Set(), names: new Set(), rng: seeded(7) };
  world.bots = bots;
  return { world, bots };
}

function partyBot(world, bots, name, level = 12) {
  const char = makeBotCharacter(seeded(level + name.length), { name });
  char.level = level;
  const bot = { id: name, name, char, level, style: {}, map: world.map.id, x: world.body.x + 40, facing: 1, state: 'idle', session: 999, stay: 999, nextLine: 999, appear: 0 };
  bots.list.push(bot);
  joinParty(bots, bot, world);
  return bot;
}

function atHerb(world) {
  const i = NODES.meadow1.findIndex((n) => n.kind === 'herb');
  const n = NODES.meadow1[i];
  Object.assign(world.body, { x: n.x, y: n.y, onGround: true, vx: 0, vy: 0 });
  return { i, n };
}

// Picks the herb to the end with a fixed roll; returns how many finds came out.
// (Finds go in the Materials pocket, odd ones in Etc: both count.)
const finds = (inv) => [...(inv.etc ?? []), ...(inv.mats ?? [])].reduce((k, e) => k + e.qty, 0);
function pickHerb(world, rng) {
  const before = finds(world.char.inventory);
  assert.equal(startGathering(world), null);
  tickGathering(world, KINDS.herb.secs * 2, new Set(), new Set(), rng);
  return finds(world.char.inventory) - before;
}

test('the together bonus only comes when two or more work the same spot', () => {
  const { world, bots } = setup();
  const { i, n } = atHerb(world);
  const key = spotKey(world, 'node', i);
  assert.equal(workersAt(world, key).count, 1);
  assert.equal(togetherBonus(world, key, n.x, n.y), null, 'alone: no bonus');
  const alone = pickHerb(world, () => 0.5);
  assert.ok(!world.events.some((e) => e.type === 'together'));

  // A friend working a different spot doesn't count; one at this spot does.
  friendWorking(world, 'f1', 'Mochi', { map: world.map.id, key: spotKey(world, 'node', i + 1) });
  assert.equal(workersAt(world, key).count, 1);
  friendWorking(world, 'f1', 'Mochi', { map: world.map.id, key });
  assert.equal(workersAt(world, key).count, 2);
  // ...but not once they've been gone for longer than the window.
  world.now += TOGETHER_WINDOW + 1;
  assert.equal(workersAt(world, key).count, 1);

  // A bot party member helping at this very spot.
  const bot = partyBot(world, bots, 'Kumo');
  bot.lifeHelp = { key, worked: world.now, at: world.now, idle: 0, pose: 'gather', secs: 2, x: n.x + 16, y: n.y, spotX: n.x };
  world.nodeRest = {};
  const lifeBefore = lifeTotal(world.char, 'gathering');
  const together = pickHerb(world, () => 0.5);
  assert.ok(world.events.some((e) => e.type === 'together' && e.count === 2), 'together bonus');
  assert.ok(together > alone, `more finds together (${together} vs ${alone})`);
  assert.ok(lifeTotal(world.char, 'gathering') > lifeBefore, 'life EXP');
  assert.ok(world.numbers.some((x) => x.text === 'Together!'), 'the pop');
  assert.ok(world.fx.some((f) => f.kind === 'together'), 'the sparkle');
});

test('bot party members come to help, work beside you, and never use the spot up', () => {
  const { world, bots } = setup();
  const { i, n } = atHerb(world);
  const key = spotKey(world, 'node', i);
  const bot = partyBot(world, bots, 'Kumo');
  bot.body.x = n.x + 60;
  // They're asked when you start (every roll says yes here).
  startedWork(world, { key, kind: 'node', node: n, x: n.x, y: n.y, pose: 'gather', secs: 2 }, () => 0);
  assert.ok(bot.lifeHelp && bot.lifeHelp.key === key, 'coming to help');
  world.gathering = { node: n, i, kind: KINDS.herb, skill: 'gathering', secs: 999, t: 0 };
  world.coopSpot.key = key;
  for (let k = 0; k < 120; k++) {
    world.now += 0.05;
    updateParty(bots, world, 0.05);
  }
  assert.ok(Math.abs(bot.body.x - bot.lifeHelp.x) < 10, `beside the spot (${bot.body.x} vs ${bot.lifeHelp.x})`);
  assert.equal(bot.attack?.pose, 'gather', 'working it with the spot\'s move');
  assert.equal(workersAt(world, key).count, 2);
  assert.ok(nodeReady(world, i), 'their work leaves the spot ready');
  assert.ok(!Object.keys(world.nodeRest ?? {}).length, 'nothing rested');
  // You stop: they leave it after a beat.
  world.gathering = null;
  for (let k = 0; k < 80; k++) {
    world.now += 0.05;
    updateParty(bots, world, 0.05);
  }
  assert.equal(bot.lifeHelp, null, 'gone back to their own thing');
});

test('a party feast feeds the whole party: you, bot members and online friends', () => {
  const { world, bots } = setup();
  const f = FEASTS[0];
  assert.equal(FEASTS.length, 4);
  assert.deepEqual(FEASTS.map((x) => x.tier), [1, 2, 3, 4], 'one per tier');
  for (const x of FEASTS) assert.ok(ITEMS[x.id]?.effect?.feast === x.id, `${x.id} is an item`);
  assert.equal(cookFeast(world, f), 0, 'needs its ingredients');
  for (const [id, q] of Object.entries(f.needs)) addItem(world.char.inventory, id, q);
  assert.equal(cookFeast(world, f), 1);
  assert.equal(countItem(world.char.inventory, f.id), 1);
  for (const id of Object.keys(f.needs)) assert.equal(countItem(world.char.inventory, id), 0, 'the batch is used');

  const a = partyBot(world, bots, 'Kumo');
  const b = partyBot(world, bots, 'Hana');
  const hpBefore = computeStats(a.char, world.now).maxHp;
  const sent = [];
  world.net = { feast: (w, fe) => (sent.push(fe.id), ['Mochi']) };
  const cookExp = lifeTotal(world.char, 'cooking');
  assert.ok(useItem(world, f.id));
  assert.equal(countItem(world.char.inventory, f.id), 0);
  for (const who of [world.char, a.char, b.char]) assert.ok(who.buffs[`feast:${f.id}`], 'buffed');
  assert.ok(a.stats.maxHp > hpBefore, 'the bot\'s stats take the buff');
  assert.deepEqual(sent, [f.id], 'friends hear about it');
  assert.ok(lifeTotal(world.char, 'cooking') > cookExp, 'serving gives life EXP');
  assert.equal(serveFeast(world, f.id), 0, 'none left');

  // The other side: a party friend's feast reaches you.
  const { world: other } = setup();
  assert.ok(friendFeast(other, 'Me', f.id));
  assert.ok(other.char.buffs[`feast:${f.id}`]);
  assert.equal(FEAST_BY_ID[f.id], f);
});

test('crafting for a friend delivers the piece and tags it as made by you', () => {
  const { world, bots } = setup('town');
  world.char.level = 20;
  world.char.life = { crafting: { level: 20, exp: 0 } };
  const bot = partyBot(world, bots, 'Kumo', 20);
  const r = RECIPES.find((x) => x.id === 'craft_ring_copper');
  const stock = () => { for (const [id, q] of Object.entries(r.needs)) addItem(world.char.inventory, id, q); };
  Object.assign(world.body, { x: world.map.bench, onGround: true, vx: 0, vy: 0 });
  world.body.y = bot.body.y;
  assert.deepEqual(craftTargets(world).map((t) => t.name), ['Kumo']);

  // For a bot party member: it goes to them (worn if it suits them), tagged.
  stock();
  bot.char.equipment.ring = null;
  assert.equal(startCrafting(world, r), null);
  world.crafting.forWho = craftTargets(world)[0];
  for (let k = 0; k < 60 && world.crafting; k++) tickCrafting(world, 0.05, new Set(), new Set(), () => 0.5);
  assert.ok(world.lastCrafted.result.ok);
  assert.equal(world.char.inventory.equip.filter((e) => e.id === r.makes).length, 0, 'not in your bag');
  const got = bot.char.equipment.ring ?? bot.char.inventory.equip.find((e) => e.id === r.makes);
  assert.ok(got, 'they have it');
  assert.equal(got.madeBy, 'Me');
  assert.ok(itemTooltip(bot.char, got.id, got).some((l) => /Made by Me/.test(l.text)), 'the tooltip says so');

  // For an online party friend: through the gift message.
  stock();
  const gifts = [];
  world.net = { gift: (w, to, item) => (gifts.push({ to, item }), true), partyFriends: () => [{ id: 'f1', name: 'Mochi', map: world.map.id }] };
  assert.equal(startCrafting(world, r), null);
  world.crafting.forWho = { kind: 'friend', id: 'f1', name: 'Mochi' };
  for (let k = 0; k < 60 && world.crafting; k++) tickCrafting(world, 0.05, new Set(), new Set(), () => 0.5);
  assert.equal(gifts.length, 1);
  assert.equal(gifts[0].to, 'f1');
  assert.equal(gifts[0].item.inst.madeBy, 'Me');
  assert.equal(world.char.inventory.equip.filter((e) => e.id === r.makes).length, 0);

  // A friend who's left: it stays in your bag.
  stock();
  world.net.gift = () => false;
  assert.equal(startCrafting(world, r), null);
  world.crafting.forWho = { kind: 'friend', id: 'f2', name: 'Gone' };
  for (let k = 0; k < 60 && world.crafting; k++) tickCrafting(world, 0.05, new Set(), new Set(), () => 0.5);
  assert.equal(world.char.inventory.equip.filter((e) => e.id === r.makes).length, 1, 'kept');
  // Made for yourself, nothing is tagged.
  assert.equal(deliverCraft(world, null, world.lastCrafted.result, r), false);
});

test('together works the same for fishing side by side', async () => {
  const { SPOTS } = await import('../src/data/fishing.js');
  const { world } = setup();
  const spot = SPOTS.meadow1?.[0];
  assert.ok(spot, 'meadow has a nook');
  addItem(world.char.inventory, 'fishing_rod', 1);
  Object.assign(world.body, { x: spot.x, y: spot.y, onGround: true, vx: 0, vy: 0 });
  const sent = [];
  world.net = { working: (w, key) => sent.push(key) };
  const { startFishing } = await import('../src/world/fishing.js');
  assert.equal(startFishing(world), null);
  assert.deepEqual(sent, [spotKey(world, 'fish', 0)], 'friends hear you are fishing there');
  friendWorking(world, 'f1', 'Mochi', { map: world.map.id, key: sent[0] });
  assert.equal(workersAt(world, sent[0]).count, 2);
});
