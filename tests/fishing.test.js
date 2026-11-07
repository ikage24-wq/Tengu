// Fishing and cooking (world/fishing.js, ui/cooking.js, data/fishing.js, data/cooking.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MAPS } from '../src/data/maps.js';
import { ITEMS } from '../src/data/items.js';
import { FISH, SPOTS } from '../src/data/fishing.js';
import { DISHES } from '../src/data/cooking.js';
import { createCharacter } from '../src/core/character.js';
import { addItem, countItem } from '../src/core/inventory.js';
import { surfacesOf } from '../src/world/physics.js';
import { createWorld, updateWorld, loadMap, useItem } from '../src/world/world.js';
import { cook, knownRecipes } from '../src/ui/cooking.js';

const DT = 1 / 60;
const press = (k) => ({ held: new Set(), pressed: new Set(k ? [k] : []) });
const step = (w, secs, k = null) => {
  for (let i = 0; i < secs * 60; i++) updateWorld(w, DT, press(i === 0 ? k : null));
};

test('every fishing spot is somewhere you can stand, its fish real, every fish and dish an item', () => {
  for (const [map, spots] of Object.entries(SPOTS)) {
    assert.ok(MAPS[map], map);
    for (const s of spots) {
      assert.ok(surfacesOf(MAPS[map]).some((f) => s.x >= f.x1 && s.x <= f.x2 && Math.abs(f.yAt(s.x) - s.y) < 2), `${map} spot stands on something`);
      for (const id of Object.keys(s.pool)) assert.ok(ITEMS[id]?.fish, `${map} has ${id}`);
    }
  }
  for (const f of FISH) assert.ok(f.boss || Object.values(SPOTS).flat().some((s) => s.pool[f.id]), `${f.id} lives somewhere`);
  for (const d of DISHES) {
    assert.ok(ITEMS[d.id]?.effect?.food, d.id);
    for (const id of Object.keys(d.needs)) assert.ok(ITEMS[id], `${d.id} needs ${id}`);
  }
  for (const t of ['sprout', 'harbor', 'crag', 'grove']) assert.ok(MAPS[t].stove != null, `${t} has a stove`);
});

test('cast, wait for the bite, hook it: a fish, its count, and its recipe', (t) => {
  let seed = 7;
  t.mock.method(Math, 'random', () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648));
  const char = createCharacter('Hana', {});
  // (The glade's pond is a tier 2 spot: it needs Fishing Lv 12.)
  char.life = { fishing: { level: 12, exp: 0 } };
  const w = createWorld(char);
  loadMap(w, 'glade', 'west');
  w.god = true;
  const spot = SPOTS.glade[0];
  Object.assign(w.body, { x: spot.x, y: spot.y, onGround: true });
  step(w, 0.1, 'ArrowUp');
  assert.equal(w.fishing, null, 'no rod, no fishing');
  addItem(char.inventory, 'fishing_rod', 1);
  step(w, 0.1, 'ArrowUp');
  assert.ok(w.fishing, 'casting');
  // Hooking too early scares it off.
  step(w, 0.8);
  assert.equal(w.fishing.phase, 'wait');
  step(w, 0.05, 'KeyZ');
  assert.equal(w.fishing.phase, 'miss');
  step(w, 1.2);
  assert.equal(w.fishing, null);
  // Wait for the bite this time, then hook.
  step(w, 0.1, 'ArrowUp');
  for (let i = 0; i < 60 * 30 && w.fishing?.phase !== 'bite'; i++) updateWorld(w, DT, press());
  assert.equal(w.fishing.phase, 'bite');
  const fish = w.fishing.fish;
  step(w, 0.05, 'KeyZ');
  // (Now and then a second one comes up with it: world/fishing.js.)
  assert.ok([1, 2].includes(countItem(char.inventory, fish.id)), 'the catch is in the bag');
  assert.equal(char.fishBook[fish.id].n, 1);
  const learned = DISHES.find((d) => d.learn === fish.id);
  if (learned) assert.ok(char.recipes.includes(learned.id));
  // Walking off stops fishing.
  step(w, 2);
  step(w, 0.1, 'ArrowUp');
  updateWorld(w, DT, { held: new Set(['ArrowLeft']), pressed: new Set() });
  assert.equal(w.fishing, null);
});

test('cooking makes two dishes, no stirring; eating heals, and different dishes add up', () => {
  const char = createCharacter('Hana', {});
  assert.ok(knownRecipes(char).length >= 3, 'the basics from the start');
  const d = DISHES.find((x) => x.id === 'dish_skewer');
  addItem(char.inventory, 'fish_sardine', 2);
  addItem(char.inventory, 'shell', 1);
  assert.equal(cook(char, d), 2);
  assert.equal(countItem(char.inventory, 'fish_sardine'), 0);
  const w = createWorld(char);
  w.god = true;
  const atk = w.stats.watk;
  char.hp = 1;
  assert.ok(useItem(w, 'dish_skewer'));
  updateWorld(w, DT, press());
  assert.ok(char.hp > 1);
  assert.equal(w.stats.watk, atk + 6);
  // A second, different dish adds its bonus on top.
  addItem(char.inventory, 'dish_ricebowl', 1);
  w.itemReadyAt = 0;
  assert.ok(useItem(w, 'dish_ricebowl'));
  updateWorld(w, DT, press());
  assert.equal(w.stats.watk, atk + 16, 'both bonuses at once');
  assert.equal(cook(char, d), 0, 'nothing left to cook with');
});

test("a reworked map's fishing spots are quiet nooks no monster reaches", async () => {
  const { MOBS } = await import('../src/data/mobs.js');
  // The maps rebuilt to the new map rules so far (the others get this when they're reworked).
  for (const id of ['meadow1', 'meadow2', 'glade', 'springs', 'peak', 'starfall']) {
    const m = MAPS[id];
    for (const sp of SPOTS[id]) {
      const surf = surfacesOf(m).find((s) => sp.x >= s.x1 && sp.x <= s.x2 && Math.abs(s.yAt(sp.x) - sp.y) < 2);
      for (const s of m.spawns) {
        if (MOBS[s.mob].fly) assert.ok(Math.abs(s.x - sp.x) >= 240 || Math.abs(s.y - sp.y) >= 120, `${id}: a ${s.mob} flies near the spot`);
        else assert.ok(!(s.x >= surf.x1 && s.x <= surf.x2 && Math.abs(surf.yAt(s.x) - s.y) < 4), `${id}: a ${s.mob} walks the spot's floor`);
      }
    }
  }
});

test('some fish only bite at their hour or in their weather, and every region has a rumoured legend', async () => {
  const { FISH, SPOTS, bitingPool, bitesNow } = await import('../src/data/fishing.js');
  const noon = { night: 0, hour: 12, weather: null };
  const midnight = { night: 1, hour: 1, weather: null };
  const ids = (now) => bitingPool(SPOTS.meadow1[0].pool, now).map(([id]) => id);
  assert.ok(!ids(noon).includes('fish_firefly') && ids(midnight).includes('fish_firefly'), 'the Firefly Minnow only comes out at night');
  assert.ok(bitesNow(FISH.find((f) => f.id === 'fish_rainbow'), { ...noon, weather: 'rain' }) && !bitesNow(FISH.find((f) => f.id === 'fish_rainbow'), noon), 'the Rainbow Trout bites in the rain');
  assert.ok(bitesNow(FISH.find((f) => f.id === 'fish_darter'), { ...noon, hour: 5 }) && !bitesNow(FISH.find((f) => f.id === 'fish_darter'), noon), 'the Daybreak Darter bites at dawn');
  assert.ok(FISH.length >= 100, 'a hundred fish to find');
  const legends = FISH.filter((f) => f.legend);
  assert.equal(legends.length, 5);
  for (const f of legends) assert.ok(f.legend.title && f.legend.rumor && Object.values(SPOTS).flat().some((s) => s.pool[f.id]), `${f.name} has a title, a rumour and a home`);
});

test('the tackle shops post three fish requests a day for the waters you reach, paid on handing in', async () => {
  const { fishRequests, handInRequest, noteRequestCatch, requestProgress } = await import('../src/world/fishrequests.js');
  const { FISH_BY_ID } = await import('../src/data/fishing.js');
  const world = createWorld(createCharacter('Reqs', {}));
  const char = world.char;
  const list = fishRequests(world);
  assert.equal(list.length, 3);
  assert.deepEqual(list.map((r) => r.kind), ['bring', 'size', 'rare']);
  // A beginner is only asked for the waters a beginner can fish.
  for (const r of list) assert.ok(FISH_BY_ID[r.fish].tier === 1, `${r.fish} is a beginner's fish`);
  char.life = { fishing: { level: 45, exp: 0 } };
  char.fishReq = null;
  assert.ok(fishRequests(world).some((r) => FISH_BY_ID[r.fish].tier >= 3), 'a master is asked for the far waters');
  char.life = {};
  char.fishReq = null;
  assert.deepEqual(fishRequests(world), list, 'the same all day');
  const bring = list[0];
  assert.ok(handInRequest(world, 0), 'nothing to hand in yet');
  addItem(char.inventory, bring.fish, bring.count);
  const gold = char.gold;
  assert.equal(handInRequest(world, 0), null);
  assert.equal(char.gold, gold + bring.gold);
  assert.equal(countItem(char.inventory, bring.fish), 0, 'the fish are handed over');
  // A size request counts only a catch at its size.
  const size = list[1];
  addItem(char.inventory, size.fish, 1);
  assert.ok(!requestProgress(char, size).ready, 'a fish from the bag does not count');
  noteRequestCatch(world, FISH_BY_ID[size.fish], size.size - 1);
  assert.ok(!size.got, 'too small');
  noteRequestCatch(world, FISH_BY_ID[size.fish], size.size);
  assert.equal(handInRequest(world, 1), null);
  assert.ok(list[0].gold >= 100 && list[2].gold < 5000, 'paid on the money scale');
});

test('a night at the Gilded Kettle wakes you well rested, a little: double EXP until a small pool runs out', async () => {
  const { checkIn, wakeAtInn, restedBonus, ROOM_GOLD } = await import('../src/world/inn.js');
  const { expToNext } = await import('../src/core/exp.js');
  const world = createWorld(createCharacter('Sleepy', {}));
  const char = world.char;
  char.gold = ROOM_GOLD;
  assert.equal(checkIn(world), null);
  assert.equal(char.gold, 0, 'a room costs its gold');
  // Logged off somewhere else: no rest.
  char.savedAt = Date.now() - 10 * 3600000;
  char.mapId = 'harbor';
  assert.equal(wakeAtInn(char), 0);
  char.inn = { checkedIn: true };
  char.mapId = 'coin_inn';
  const add = wakeAtInn(char);
  assert.ok(add > 0 && add <= expToNext(char.level) * 0.3, 'a long night is capped at under a third of a level');
  assert.equal(restedBonus(world, 5), 5, 'kills count double while it lasts');
  char.rested = 2;
  assert.equal(restedBonus(world, 5), 2, 'until it runs out');
  assert.equal(restedBonus(world, 5), 0);
});

test('the Auction House: buy outright, bid and win or be outbid, and list your own to sell', async () => {
  const A = await import('../src/world/auction.js');
  const world = createWorld(createCharacter('Trader', {}));
  const char = world.char;
  let now = Date.UTC(2026, 10, 7, 12, 0, 0);
  world.dayClock = () => new Date(now);
  char.level = 30;
  char.gold = 1e6;
  const list = A.listings(world);
  assert.ok(list.length >= 30, 'a market full of listings');
  assert.deepEqual(A.listings(world).map((l) => l.key), list.map((l) => l.key), 'the same all hour');
  for (const c of ['weapon', 'armour', 'material', 'fish']) assert.ok(list.some((l) => A.counterOf(l.id) === c), `something at the ${c} counter`);
  // Buy one outright.
  const buy = list[0];
  const gold = char.gold;
  assert.equal(A.buyNow(world, buy.key), null);
  assert.equal(char.gold, gold - buy.price);
  assert.ok(!A.listings(world).some((l) => l.key === buy.key), 'it is gone from the market');
  // Bid on the rest until it ends: every bid ends won or outbid, and either way the gold or the
  // goods wait in the collection box.
  for (const l of A.listings(world).slice(0, 12)) A.placeBid(world, l.key);
  const held = Object.keys(char.auction.bids).length;
  assert.ok(held >= 10);
  now += 3600000;
  A.tickAuction(world);
  assert.equal(Object.keys(char.auction.bids).length, 0);
  assert.equal(char.auction.box.length, held);
  // List a stack at a bargain: it sells within the hour and the gold comes in, less the fee.
  addItem(char.inventory, 'fish_carp', 10);
  const value = A.marketValue(world, 'fish_carp') * 10;
  assert.equal(A.listItem(world, { id: 'fish_carp', qty: 10 }, value * 0.8), null);
  assert.equal(countItem(char.inventory, 'fish_carp'), 0);
  now += 40 * 60000;
  A.tickAuction(world);
  const sold = char.auction.box.find((e) => e.why?.startsWith('Sold'));
  assert.ok(sold && sold.gold < value * 0.8, 'sold, less the fee');
  // Far too dear: it comes back unsold.
  addItem(char.inventory, 'fish_carp', 1);
  A.listItem(world, { id: 'fish_carp', qty: 1 }, A.marketValue(world, 'fish_carp') * 3);
  now += 50 * 60000;
  A.tickAuction(world);
  assert.ok(char.auction.box.some((e) => e.why === 'Unsold' && e.id === 'fish_carp'));
  const before = char.gold;
  A.collectAll(world);
  assert.ok(char.gold > before && char.auction.box.length === 0, 'everything collected');
  assert.equal(countItem(char.inventory, 'fish_carp'), 1);
});

test('guild bounties: join, take one, its elite turns up on its map, bring it down, hand it in, rank up', async () => {
  const B = await import('../src/world/bounties.js');
  const { RANKS } = await import('../src/data/bounties.js');
  const { killMob } = await import('../src/world/world.js');
  const world = createWorld(createCharacter('Hunter', {}));
  const char = world.char;
  char.level = 20;
  assert.ok(B.joinGuild(world), 'joining makes you Copper');
  assert.equal(char.title, RANKS[0].title);
  assert.ok(char.inventory.equip.some((e) => e.id === 'cape_guild_copper'), 'with the Copper cape');
  const board = B.bountyBoard(world);
  assert.equal(board.length, 3);
  assert.equal(new Set(board.map((b) => b.map)).size, 3, 'three different fields');
  for (let n = 0; n < 3; n++) {
    const b = B.bountyBoard(world).find((x) => x.state === 'open') ?? (() => { char.guild.board = null; return B.bountyBoard(world)[0]; })();
    assert.equal(B.takeBounty(world, b.id), null);
    loadMap(world, b.map, 'west');
    for (let i = 0; i < 300 && !world.mobs.some((m) => m.bounty === b.id); i++) B.tickBounties(world, 0.1);
    const elite = world.mobs.find((m) => m.bounty === b.id);
    assert.ok(elite, 'the elite turns up');
    assert.ok(elite.def.hp >= MOBS_HP(b.mob) * RANKS[0].hp, 'far tougher than its kind');
    elite.hp = 0;
    killMob(world, elite);
    assert.equal(b.state, 'slain');
    const gold = char.gold;
    assert.equal(B.turnIn(world, b.id), null);
    assert.equal(char.gold, gold + b.gold);
  }
  assert.equal(char.guild.rank, 1, 'three bounties: Silver');
  assert.equal(char.title, RANKS[1].title);
  assert.ok(char.inventory.equip.some((e) => e.id === 'cape_guild_silver'));
});
const MOBS_HP = (id) => MOBS_REF[id].hp;
const { MOBS: MOBS_REF } = await import('../src/data/mobs.js');

test('Merchant Rep: good turns raise your standing, lower the fee, and a Merchant Friend gets a stall that sells while away', async () => {
  const R = await import('../src/world/rep.js');
  const S = await import('../src/world/stall.js');
  const A = await import('../src/world/auction.js');
  const world = createWorld(createCharacter('Merchant', {}));
  const char = world.char;
  let now = Date.UTC(2026, 10, 7, 12, 0, 0);
  world.dayClock = () => new Date(now);
  assert.equal(R.repTier(char).name, 'Stranger');
  assert.equal(R.auctionFee(char), 0.05);
  assert.ok(S.stockStall(world, { id: 'fish_carp', qty: 1 }, 50), 'no stall before a licence');
  R.addRep(world, char, R.REP[3].need);
  assert.equal(R.repTier(char).name, 'Merchant Friend');
  assert.ok(R.auctionFee(char) < 0.05 && R.auctionSlots(char) > 5, 'a lower fee, more slots');
  // Stock the stall at a fair price, log off, come back: it sold, gold in the till, a little rep.
  addItem(char.inventory, 'fish_carp', 10);
  const price = Math.round(A.marketValue(world, 'fish_carp') * 10);
  assert.equal(S.stockStall(world, { id: 'fish_carp', qty: 10 }, price), null);
  assert.equal(countItem(char.inventory, 'fish_carp'), 0);
  const rep = R.repPoints(char);
  S.settleStall(char, now + 8 * 3600000);
  assert.equal(char.stall.items.length, 0, 'sold while you were away');
  assert.equal(char.stall.till, Math.round(price / 5) * 5);
  assert.ok(R.repPoints(char) > rep);
  const gold = char.gold;
  S.collectTill(world);
  assert.ok(char.gold > gold && char.stall.till === 0);
  // Far too dear never sells, and comes back when you take it off.
  addItem(char.inventory, 'fish_carp', 1);
  S.stockStall(world, { id: 'fish_carp', qty: 1 }, A.marketValue(world, 'fish_carp') * 4);
  S.settleStall(char, now + 99 * 3600000);
  assert.equal(char.stall.items.length, 1);
  assert.equal(S.unstock(world, char.stall.items[0].key), null);
  assert.equal(countItem(char.inventory, 'fish_carp'), 1);
});

test('the Night Market: the Masked Moth is only there after dark, with an oddity and three one-offs a night', async () => {
  const N = await import('../src/world/nightmarket.js');
  const world = createWorld(createCharacter('Owl', {}));
  const char = world.char;
  char.level = 30;
  char.gold = 1e6;
  const moth = { id: 'moth', x: 430 };
  world.night = 0;
  assert.ok(N.awayNow(world, moth), 'not there by day');
  assert.ok(!N.awayNow(world, { id: 'ledger', x: 1552 }), 'everyone else is');
  assert.ok(N.buyNight(world, 'x'), 'and nothing for sale by day');
  world.night = 1;
  assert.ok(!N.awayNow(world, moth), 'there at night');
  const goods = N.tonight(world);
  assert.equal(goods.length, 4);
  for (const g of goods) assert.ok(g.price >= 5);
  const gold = char.gold;
  assert.equal(N.buyNight(world, goods[1].key), null);
  assert.equal(char.gold, gold - goods[1].price);
  assert.ok(N.buyNight(world, goods[1].key), 'once each');
});
