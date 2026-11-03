// Online party play (src/net/online.js) between two games in one process, over the local
// BroadcastChannel link: each player's game loads its own copy of the online module.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createCharacter } from '../src/core/character.js';
import { makeEquip } from '../src/core/items.js';
import { createWorld, updateWorld, loadMap } from '../src/world/world.js';

globalThis.TENGU_NET_LOCAL = true;
const DT = 1 / 60;
const idle = { held: new Set(), pressed: new Set() };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function hero(name) {
  const char = createCharacter(name, {});
  Object.assign(char, { job: 'warrior', level: 30 });
  char.base.str = 160;
  char.base.dex = 70;
  char.equipment.weapon = makeEquip('sword_30');
  const world = createWorld(char);
  loadMap(world, 'woods', 'start');
  world.god = true;
  return world;
}

// Runs both games for a while, letting messages through between frames.
async function play(pairs, seconds) {
  for (let i = 0; i < seconds * 20; i++) {
    for (const [net, world] of pairs) {
      for (let k = 0; k < 3; k++) updateWorld(world, DT, idle);
      net.tickNet(world, DT * 3);
    }
    await wait(5);
  }
}

async function room() {
  const A = await import('../src/net/online.js?player=a' + Math.random());
  const B = await import('../src/net/online.js?player=b' + Math.random());
  const a = hero('Hana');
  const b = hero('Kai');
  A.hostRoom(a);
  await wait(20);
  B.joinRoom(b, A.online.code);
  await play([[A, a], [B, b]], 1);
  return { A, B, a, b, pairs: [[A, a], [B, b]] };
}

test('friends in a room see each other, and the monsters are the first arrival\'s', async () => {
  const { A, B, a, b, pairs } = await room();
  assert.equal(A.online.status, 'on');
  assert.equal(B.online.status, 'on');
  assert.deepEqual(B.online.order, A.online.order);
  assert.equal(A.othersHere(a)[0]?.name, 'Kai');
  assert.equal(B.othersHere(b)[0]?.name, 'Hana');
  // The host got there first: its game runs the monsters, the guest's shows the same ones.
  assert.equal(A.online.claim, 'woods');
  assert.equal(B.online.claim, null);
  assert.equal(b.mobs.length, a.mobs.length);
  assert.ok(b.mobs.every((m) => m.net?.startsWith(`${A.online.id}:`)), 'the guest shows the host\'s monsters');
  // Moving shows up on the other screen.
  b.body.x += 120;
  await play(pairs, 0.6);
  assert.ok(Math.abs(A.othersHere(a)[0].body.x - b.body.x) < 8);
  A.leaveRoom(a);
  B.leaveRoom(b);
});

test('a guest\'s blows land on the host\'s monster, and its fall is shared', async () => {
  const { A, B, a, b, pairs } = await room();
  const m = b.mobs.find((o) => o.hp > 0 && Math.abs(o.y - b.body.y) < 4 && !o.def.boss);
  const owned = a.mobs.find((o) => o.net === m.net || `${A.online.id}:${o.uid}` === m.net);
  assert.ok(owned, 'the same monster in both games');
  owned.hp = 30;
  await play(pairs, 0.3);
  const expA = a.char.exp;
  const expB = b.char.exp;
  for (let i = 0; i < 40 && owned.hp > 0; i++) {
    b.body.x = m.x - 28;
    b.body.facing = 1;
    updateWorld(b, DT, { held: new Set(['KeyZ']), pressed: new Set(['KeyZ']) });
    await play(pairs, 0.15);
  }
  assert.ok(owned.hp <= 0, 'the host\'s monster fell to the guest');
  await play(pairs, 0.3);
  assert.ok(b.char.exp > expB, 'the guest gets the EXP');
  assert.ok(a.char.exp > expA, 'the host on the same map gets a party share');
  assert.ok(b.char.exp - expB > a.char.exp - expA, 'the one who fought it gets more');
  A.leaveRoom(a);
  B.leaveRoom(b);
});

test('when the player running a map leaves it, the next one takes its monsters over', async () => {
  const { A, B, a, b, pairs } = await room();
  loadMap(a, 'harbor', 'start');
  await play(pairs, 0.6);
  assert.equal(B.online.claim, 'woods', 'the guest runs the woods now');
  const alive = b.mobs.filter((m) => m.hp > 0).length;
  assert.ok(alive > 0);
  // Its monsters keep moving and come back when they fall, as in single player.
  const m = b.mobs.find((o) => o.hp > 0 && !o.def.boss);
  m.hp = 0;
  await play(pairs, 0.3);
  assert.ok(b.spawner.slots.some((s) => s.mob === m || s.mob?.hp === 0), 'the fallen one waits in its spawn slot');
  // Coming back, the host is shown the guest's monsters instead of its own.
  loadMap(a, 'woods', 'start');
  await play(pairs, 0.6);
  assert.equal(A.online.claim, null);
  assert.equal(B.online.claim, 'woods');
  assert.ok(a.mobs.length > 0 && a.mobs.every((o) => o.net?.startsWith(`${A.online.id}:`) || o.net?.startsWith(`${B.online.id}:`)));
  // Leaving the room, the host's game runs what it shows.
  A.leaveRoom(a);
  B.leaveRoom(b);
  assert.equal(a.mirror, null);
});


test('a boss\'s two-person mechanics reach friends on the map: the ring, who\'s in it, the guard and its break', async () => {
  const { spawnMob } = await import('../src/world/mobs.js');
  const { mechOf, coopHit } = await import('../src/world/coopboss.js');
  const { A, B, a, b, pairs } = await room();
  // The host runs the woods: a Queen Bee and Old MacGoblin turn up beside the two of them.
  const queen = spawnMob(a.map, { mob: 'queenbee', x: a.body.x + 60, y: a.body.y });
  const mac = spawnMob(a.map, { mob: 'macgoblin', x: a.body.x - 90, y: a.body.y });
  a.mobs.push(queen, mac);
  b.body.x = a.body.x + 10;
  await play(pairs, 0.6);
  const split = mechOf(queen, 'split');
  assert.ok(split, 'the host armed the queen');
  split.next = 0;
  await play(pairs, 0.6);
  const ring = split.ring;
  assert.ok(ring, 'a share ring is marked');
  const shown = b.mobs.find((m) => m.net === queen.net);
  assert.ok(shown?.coop, 'the guest\'s queen carries the mechanics');
  const seen = mechOf(shown, 'split').ring;
  assert.ok(seen && Math.abs(seen.x - ring.x) < 2 && seen.w === ring.w, 'the guest sees the same ring');
  assert.ok(seen.t > 0 && seen.t <= seen.warn, 'its countdown runs on the guest\'s screen too');
  assert.equal(typeof seen.n, 'number', 'with the count of who stands in it');
  // The guard: struck from both sides on the host, the guest sees it break.
  const macShown = b.mobs.find((m) => m.net === mac.net);
  assert.equal(mechOf(macShown, 'sides').guard, true, 'the guest sees the guard up');
  coopHit(a, mac, { damage: 100, fromX: mac.x - 50 });
  await play(pairs, 0.3);
  assert.ok(mechOf(macShown, 'sides').hits[-1] != null, 'the struck side shows lit');
  coopHit(a, mac, { damage: 100, fromX: mac.x + 50 });
  await play(pairs, 0.3);
  assert.equal(mechOf(macShown, 'sides').guard, false, 'broken on the guest\'s screen');
  assert.ok(b.coopFx.some((f) => f.kind === 'crack' && f.boss === 'macgoblin'), 'and the guest sees it shatter');
  // The bosses gone, the guest's screen clears.
  queen.hp = 0;
  mac.hp = 0;
  await play(pairs, 0.6);
  assert.ok(!b.mobs.some((m) => m.coop && m.hp > 0), 'no telegraphs left on the guest\'s screen');
  A.leaveRoom(a);
  B.leaveRoom(b);
});
