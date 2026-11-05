// Easy grouping (world/grouping.js, net/together.js): asking to join a party (a friend online's,
// or one of the players here, who answers in character), pings that the party sees and acts on,
// party chat that only the party hears, quick emotes for the party, and quest progress shared
// with the party.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createWorld, loadMap, updateWorld } from '../src/world/world.js';
import { createCharacter } from '../src/core/character.js';
import { makeBotCharacter, updateBots, createBots } from '../src/world/bots.js';
import { joinParty, partyMembers } from '../src/world/party.js';
import { spawnMob } from '../src/world/mobs.js';
import { acceptQuest } from '../src/core/quests.js';
import { countItem, removeItem } from '../src/core/inventory.js';
import { EMOTES } from '../src/ui/emotes.js';
import {
  askToJoin, joinBlocker, dropPing, smartPing, pingFor, partySay, partyEmote, shareGather, partyGathered, updateGrouping, PING_GAP, PING_LIFE,
} from '../src/world/grouping.js';
import { online } from '../src/net/online.js';
import { handleTogether, togetherApi, askJoinParty, answerJoinParty, leaderOf, joinPartyBlocker } from '../src/net/together.js';

function seeded(n) {
  return () => {
    n = (n * 1664525 + 1013904223) % 4294967296;
    return n / 4294967296;
  };
}

function setup(level = 20) {
  const world = createWorld(createCharacter('Me', {}));
  const lines = [];
  const log = world.log.bind(world);
  world.log = (t, c) => {
    lines.push(t);
    log(t, c);
  };
  loadMap(world, 'meadow1', 'west');
  world.char.level = level;
  world.mobs = [];
  const bots = { list: [], memory: new Set(), names: new Set(), rng: seeded(5) };
  world.bots = bots;
  return { world, bots, lines };
}

function make(world, name, level, extra = {}) {
  const char = makeBotCharacter(seeded(level + name.length), { name, level });
  char.level = level;
  const bot = { id: name, name, char, level, style: {}, map: world.map.id, x: world.body.x + 40, facing: 1, state: 'idle', session: 999, stay: 999, nextLine: 999, appear: 0, ...extra };
  world.bots.list.push(bot);
  return bot;
}

// Runs the grouping (and only it) for a while.
function tick(world, secs) {
  for (let t = 0; t < secs; t += 0.1) {
    world.now += 0.1;
    updateGrouping(world, 0.1);
  }
}

test('asking to join a player here: they think it over and answer in character, by level and room', () => {
  const { world, bots, lines } = setup(20);
  const near = make(world, 'Mochi', 23);
  assert.equal(askToJoin(world, near), null);
  assert.equal(joinBlocker(world, near), 'Waiting for an answer');
  tick(world, 3);
  assert.ok(near.party, 'they took you in');
  assert.equal(bots.partyLead, near.id, 'and they lead the party');
  assert.ok(lines.some((l) => l.startsWith('Mochi:')), 'they said yes in their own words');
  assert.ok(lines.includes("You joined Mochi's party!"));

  // Too high for you: a no, with where they hunt and when to come back.
  const { world: w2 } = setup(10);
  const high = make(w2, 'Bram', 30);
  askToJoin(w2, high);
  tick(w2, 3);
  assert.ok(!high.party);
  assert.ok(w2.messages.some((m) => /lv25|flatten|rough|hits hard/.test(m.text)), 'the no says why');
  // Someone minding their shop says no too.
  const shop = make(w2, 'Tavi', 10, { shop: { items: [] } });
  askToJoin(w2, shop);
  tick(w2, 3);
  assert.ok(!shop.party);
  // Already in a party: leave it first.
  const { world: w3 } = setup(20);
  joinParty(w3.bots, make(w3, 'Pal', 20), w3);
  assert.equal(joinBlocker(w3, make(w3, 'Other', 20)), 'Leave your party first');
});

function goOnline(world) {
  const sent = [];
  Object.assign(online, { status: 'on', id: 'me', link: { send: (m) => sent.push(m) }, party: null, rosters: null, joinAsk: null, joinAsked: null });
  online.ghosts.clear();
  const ghost = (id, name) => {
    const g = { id, name, map: world.map.id, body: { x: world.body.x + 20, y: world.body.y }, level: 20, job: 'warrior', seen: performance.now() / 1000 };
    online.ghosts.set(id, g);
    return g;
  };
  return { sent, ghost };
}

function offline() {
  Object.assign(online, { status: 'off', id: null, link: null, party: null, rosters: null, joinAsk: null, joinAsked: null });
  online.ghosts.clear();
}

test('online: one click asks a friend\'s party leader to let you in, and the leader can', () => {
  const { world } = setup(20);
  const { sent, ghost } = goOnline(world);
  try {
    const lea = ghost('lea', 'Lea');
    const bo = ghost('bo', 'Bo');
    // Lea's party (with Bo) was shared with the room.
    handleTogether(world, { t: 'party', op: 'roster', id: 'lea', leader: 'lea', members: ['lea', 'bo'] }, lea);
    assert.equal(leaderOf('bo'), 'lea');
    assert.equal(joinPartyBlocker(bo), null);
    assert.equal(askJoinParty(world, 'bo'), null);
    assert.deepEqual(sent.at(-1), { t: 'party', to: 'lea', op: 'join', name: 'Me', id: 'me' }, 'the ask goes to the leader');
    // She lets you in: her new roster has you on it.
    handleTogether(world, { t: 'party', op: 'roster', id: 'lea', leader: 'lea', members: ['lea', 'bo', 'me'] }, lea);
    assert.deepEqual(online.party, { leader: 'lea', members: ['lea', 'bo', 'me'] });
    assert.equal(online.joinAsked, null);

    // The other way round: you lead, and a friend asks to join.
    online.party = null;
    const kai = ghost('kai', 'Kai');
    handleTogether(world, { t: 'party', op: 'join', id: 'kai', to: 'me', name: 'Kai' }, kai);
    assert.equal(online.joinAsk, 'kai');
    answerJoinParty(world, true);
    assert.deepEqual(online.party.members, ['me', 'kai']);
    assert.equal(sent.at(-1).op, 'roster');
    assert.deepEqual(sent.at(-1).members, ['me', 'kai']);
  } finally {
    offline();
  }
});

test('pings: the party sees them, acts on them (focus, help, come), and friends online get them', () => {
  const { world, lines } = setup(20);
  const a = make(world, 'Mochi', 20);
  const b = make(world, 'Pip', 21);
  joinParty(world.bots, a, world);
  joinParty(world.bots, b, world);
  const mob = spawnMob(world.map, { mob: 'snailbun', x: world.body.x + 90 * world.body.facing, y: world.map.groundY });
  world.mobs.push(mob);
  // Facing a monster: the ping is "Attack this!" on it.
  assert.equal(pingFor(world).kind, 'attack');
  const p = smartPing(world);
  assert.equal(p.kind, 'attack');
  assert.equal(p.mob, mob);
  for (const bot of [a, b]) assert.equal(bot.brain.target, mob, `${bot.name} focuses the pinged monster`);
  assert.ok(lines.some((l) => l.startsWith('[Party] Me: Attack this!')));
  // Not spammable: a beat between pings.
  assert.equal(dropPing(world, 'here'), null);
  tick(world, 2.5);
  assert.ok(world.messages.some((m) => /^\[Party\] (Mochi|Pip): /.test(m.text)), 'a member answers the call');
  // The focus holds while it lives.
  a.brain.target = null;
  tick(world, 0.2);
  assert.equal(a.brain.target, mob);
  // Low on HP: "Help!", and they come running.
  world.char.hp = 1;
  const h = smartPing(world);
  assert.equal(h.kind, 'help');
  assert.ok(a.helping > world.now && b.helping > world.now);
  // Pings fade after a few seconds.
  tick(world, PING_LIFE + 0.5);
  assert.equal(world.pings.length, 0);
  assert.ok(PING_GAP > 0.5);

  // Online: a party friend's ping shows here; yours goes out to the room.
  const { sent, ghost } = goOnline(world);
  try {
    const kai = ghost('kai', 'Kai');
    online.party = { leader: 'me', members: ['me', 'kai'] };
    handleTogether(world, { t: 'ping', id: 'kai', kind: 'help', map: world.map.id, x: 300, y: 200, mob: null }, kai);
    assert.ok(world.pings.some((q) => q.from === 'kai' && q.kind === 'help' && q.name === 'Kai'));
    // Someone outside your party: ignored.
    const zed = ghost('zed', 'Zed');
    handleTogether(world, { t: 'ping', id: 'zed', kind: 'here', map: world.map.id, x: 300, y: 200 }, zed);
    assert.ok(!world.pings.some((q) => q.from === 'zed'));
    world.net = togetherApi;
    world.now += 5;
    dropPing(world, 'here');
    assert.equal(sent.at(-1).t, 'ping');
    assert.equal(sent.at(-1).kind, 'here');
  } finally {
    world.net = null;
    offline();
  }
});

test('a "Here!" ping brings the party to the marker, not to wherever you go next', () => {
  const { world } = setup(20);
  // (A real crowd's state, so the bots' own update can run.)
  world.bots = createBots(world, seeded(5), { clock: () => new Date(2026, 9, 28, 20, 0) });
  world.bots.list.length = 0;
  world.mobs = [];
  const a = make(world, 'Mochi', 20);
  joinParty(world.bots, a, world);
  tick(world, 0.5);
  // (A monster by them, where you were: before, they'd stop to fight it instead of coming.)
  const mob = spawnMob(world.map, { mob: 'snailbun', x: world.body.x + 30, y: world.map.groundY });
  mob.def = { ...mob.def, hp: 1e9, atk: 0 };
  mob.hp = 1e9;
  world.mobs.push(mob);
  const mark = { x: world.body.x + 400, y: world.body.y };
  Object.assign(world.body, { x: mark.x, vx: 0 });
  assert.ok(dropPing(world, 'here'), 'pinged');
  // You walk off the other way at once; they still come to the marker.
  Object.assign(world.body, { x: mark.x - 700 });
  let reached = false;
  const you = world.body.x;
  for (let t = 0; t < 15 && !reached; t += 1 / 30) {
    world.now += 1 / 30;
    updateGrouping(world, 1 / 30);
    updateBots(world.bots, world, 1 / 30);
    world.body.x = you;
    reached = Math.abs((a.body?.x ?? a.x) - mark.x) < 70;
  }
  assert.ok(reached, `came to the marker (at ${Math.round(a.body.x)}, marker ${mark.x})`);
});

test('party chat goes to the party only; members answer it, and quick emotes, in character', () => {
  const { world } = setup(20);
  // No party: nothing to send to.
  assert.equal(partySay(world, 'hi'), false);
  const a = make(world, 'Mochi', 20);
  joinParty(world.bots, a, world);
  const heard = world.heard;
  assert.equal(partySay(world, 'ready to go?'), true);
  assert.equal(world.heard, heard, 'the players around you don\'t hear party chat');
  assert.ok(world.partyLog.some((m) => m.text === '[Party] Me: ready to go?'), 'it shows on the Party tab');
  tick(world, 2.5);
  const said = world.partyLog.filter((m) => m.text.startsWith('[Party] Mochi: '));
  assert.equal(said.length, 1, 'Mochi answers once');
  // A quick emote: over your head, and a member may answer it.
  world.now += 40;
  let answered = false;
  for (let i = 0; i < 6 && !answered; i++) {
    world.now += 40;
    assert.ok(partyEmote(world, EMOTES.find((e) => e.id === 'cheer')));
    assert.equal(world.emote.face, 'excited');
    tick(world, 2.5);
    answered = world.partyLog.filter((m) => m.text.startsWith('[Party] Mochi: ')).length > 1;
  }
  assert.ok(answered, 'a member answers the emote');
  // And nothing repeats: every line Mochi said is different.
  const all = world.partyLog.filter((m) => m.text.startsWith('[Party] Mochi: ')).map((m) => m.text);
  assert.equal(new Set(all).size, all.length);

  // Online: party chat reaches party friends, and only theirs shows as party chat here.
  const { sent, ghost } = goOnline(world);
  try {
    const kai = ghost('kai', 'Kai');
    online.party = { leader: 'me', members: ['me', 'kai'] };
    world.net = togetherApi;
    partySay(world, 'brb');
    assert.deepEqual(sent.at(-1), { t: 'pchat', text: 'brb', id: 'me' });
    handleTogether(world, { t: 'pchat', id: 'kai', text: 'ok!' }, kai);
    assert.ok(world.partyLog.some((m) => m.text === '[Party] Kai: ok!'));
    const zed = ghost('zed', 'Zed');
    handleTogether(world, { t: 'pchat', id: 'zed', text: 'sneaky' }, zed);
    assert.ok(!world.partyLog.some((m) => m.text.includes('sneaky')));
  } finally {
    world.net = null;
    offline();
  }
});

test('shared quest progress: party kills count for your quests and show whose they were; gathers too', () => {
  const { world } = setup(5);
  const a = make(world, 'Mochi', 6);
  joinParty(world.bots, a, world);
  acceptQuest(world.char, 'snail_trouble');
  const mob = spawnMob(world.map, { mob: 'snailbun', x: world.body.x + 40, y: world.map.groundY });
  world.mobs.push(mob);
  world.pending.push({ at: 0, mob, miss: false, damage: 1e6, crit: false, fromX: 0, stack: 0, party: a.id });
  updateWorld(world, 1 / 60, { held: new Set(), pressed: new Set() });
  assert.equal(world.char.quests.snail_trouble.kills.snailbun, 1);
  assert.equal(world.partyCredit['snail_trouble|snailbun'].name, 'Mochi', 'the tracker knows it was Mochi\'s');
  assert.ok(world.messages.some((m) => /Tortoise Trouble: 1\/12 .*\(Mochi\)/.test(m.text)));

  // A gather by a party member here passes you what your quest still needs (no more).
  world.char.quests.fluffy = { state: 'active', kills: {} };
  assert.equal(partyGathered(world, a, 'fluff', 3), 3);
  assert.equal(countItem(world.char.inventory, 'fluff'), 3);
  assert.equal(shareGather(world, 'fluff', 20, 'Kai'), 5, 'only up to the 8 asked for');
  assert.equal(shareGather(world, 'fluff', 1, 'Kai'), 0);
  assert.equal(shareGather(world, 'tusk', 1, 'Kai'), 0, 'nothing for an item no quest wants');
  // Someone not in your party (or off on another map) doesn't share.
  const stranger = make(world, 'Zed', 5);
  assert.equal(partyGathered(world, stranger, 'fluff', 1), 0);

  // Online: a party friend's gather on your map comes in the same way.
  const { ghost } = goOnline(world);
  try {
    const kai = ghost('kai', 'Kai');
    online.party = { leader: 'me', members: ['me', 'kai'] };
    removeItem(world.char.inventory, 'fluff', 8);
    world.char.quests.tut_practice = { state: 'active', kills: {} };
    handleTogether(world, { t: 'gath', id: 'kai', map: world.map.id, items: ['fluff'] }, kai);
    assert.equal(countItem(world.char.inventory, 'fluff'), 1);
  } finally {
    offline();
  }
});

test('online: setting sail takes your party friends on the quay aboard with you, and a friend brings you aboard theirs', async () => {
  const { setSail } = await import('../src/world/voyage.js');
  const { world, lines } = setup(20);
  loadMap(world, 'harbor', 'ferry');
  const { sent, ghost } = goOnline(world);
  try {
    const kai = ghost('kai', 'Kai');
    const zed = ghost('zed', 'Zed');
    ghost('ivy', 'Ivy').map = 'sprout';
    online.party = { leader: 'me', members: ['me', 'kai', 'ivy'] };
    assert.ok(setSail(world));
    assert.equal(world.map.id, 'voyage_out');
    // Kai (in the party, on the quay) is asked aboard; Zed (not in it) and Ivy (in town) aren't.
    const asks = sent.filter((m) => m.t === 'sail');
    assert.deepEqual(asks.map((m) => m.to), ['kai']);
    assert.equal(asks[0].from, 'harbor');
    assert.ok(lines.some((l) => l.includes('Kai comes aboard')));

    // The other way round: Kai sets sail from the harbor, and you're on the quay.
    loadMap(world, 'harbor', 'ferry');
    world.voyage = null;
    handleTogether(world, { t: 'sail', id: 'kai', to: 'me', from: 'harbor', quick: false }, kai);
    assert.equal(world.map.id, 'voyage_out', 'brought aboard');
    // Someone outside your party, or a sailing from a port you're not at, takes no one.
    loadMap(world, 'harbor', 'ferry');
    handleTogether(world, { t: 'sail', id: 'zed', to: 'me', from: 'harbor', quick: false }, zed);
    assert.equal(world.map.id, 'harbor');
    handleTogether(world, { t: 'sail', id: 'kai', to: 'me', from: 'lagoon', quick: false }, kai);
    assert.equal(world.map.id, 'harbor');
    // Straight there with a friend who knows the way, even on your first trip.
    world.char.voyages = 0;
    handleTogether(world, { t: 'sail', id: 'kai', to: 'me', from: 'harbor', quick: true }, kai);
    assert.equal(world.map.id, 'lagoon');
  } finally {
    offline();
  }
});
