// The server's economy and group play.
//
//   - The market: what things sell for drifts over time, and trade chat is full of offers
//     ("S> Fluff x20 18g ea", "B> Trout paying 90"). Answer any of them from the Market tab (N).
//   - Crafting rushes: now and then everyone wants one dish, potion or fish; its price shoots up
//     and buy offers pour in, until it crashes again.
//   - Haggling: in a player's shop, Haggle for a lower price. Friends and regulars give you a deal;
//     strangers counter, or take offence at a lowball and won't haggle for a while.
//   - Lucky drops: a rare piece dropping by other players gets a reaction ("how?? i farmed for 3
//     hours"), and someone may offer to buy it (Market tab).
//   - Dungeon groups: players shout for the role their group is missing ("LF healer for Rootwood
//     Hollow"). When it's yours, right-click them (Join their group) and they take you in.
//   - The bounty board: players post jobs ("500 gold to whoever kills 20 Snailbuns"); take one
//     from the Bounty tab and the reward is yours when it's done.
//   - The hall of fame: the server's top players (you among them) by level, kills and raids.

import { ITEMS, RARITIES } from '../data/items.js';
import { MOBS } from '../data/mobs.js';
import { MAPS } from '../data/maps.js';
import { DUNGEONS, roleOf, ROLES } from '../data/dungeons.js';
import { JOBS } from '../data/jobs.js';
import { addItem, countItem, removeItem } from '../core/inventory.js';
import { itemName } from '../core/items.js';
import { joinParty, partyMembers } from './party.js';
import { startRun } from './dungeon.js';
import { isBuddy } from './buddies.js';

const pick = (list, rng) => list[Math.floor(rng() * list.length)];
const between = (a, b, rng) => a + rng() * (b - a);
const TRADE = '#9fe8ff';

// What's bought and sold in trade chat: monster drops, fish, potions and dishes.
// (Not tools like the fishing rod: one-of-a-kind things nobody trades by the stack.)
const TRADED = Object.values(ITEMS).filter((d) => d.price > 0 && d.stack !== 1 && (d.type === 'etc' || d.id.startsWith('fish_') || d.id.startsWith('dish_') || (d.type === 'use' && d.effect && !d.effect.pet))).map((d) => d.id);
const RUSHABLE = TRADED.filter((id) => id.startsWith('dish_') || id.startsWith('fish_') || ITEMS[id].type === 'use');

function shout(world, bot, line) {
  bot.bubble = { text: line, t: 4.5 };
  if (bot.map === world.map.id) world.log?.(`${bot.name}: ${line}`, '#e6dcff');
}

// ---------- Prices ----------

export function priceOf(bots, id) {
  const m = bots?.market?.mult?.[id] ?? 1;
  return Math.max(1, Math.round((ITEMS[id]?.price ?? 1) * m));
}

function drift(M, rng) {
  for (const id of TRADED) {
    let m = M.mult[id] ?? 1;
    m *= Math.exp((rng() - 0.5) * 0.12);
    // (Back toward normal, slowly, unless there's a rush on.)
    if (M.rush?.id !== id) m += (1 - m) * 0.05;
    M.mult[id] = Math.max(0.5, Math.min(3.5, m));
  }
}

const g = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${n}`);

// ---------- Trade chat ----------

function post(M, bots, world) {
  const rng = bots.rng;
  const bot = pick(bots.list.filter((b) => !b.party && !b.gone && b.state !== 'transit' && !b.gm), rng);
  if (!bot) return;
  const rush = M.rush && rng() < 0.6 ? M.rush.id : null;
  const id = rush ?? pick(TRADED, rng);
  const buy = rush ? true : rng() < 0.45;
  const each = Math.max(1, Math.round(priceOf(bots, id) * between(buy ? 0.85 : 0.95, buy ? 1.15 : 1.35, rng)));
  const qty = buy ? 1 + Math.floor(rng() * 10) : 1 + Math.floor(rng() * 25);
  const offer = { id: `${M.next++}`, bot, kind: buy ? 'buy' : 'sell', item: id, qty, each, until: world.now + between(90, 180, rng) };
  M.offers.unshift(offer);
  M.offers.length = Math.min(M.offers.length, 12);
  const name = ITEMS[id].name;
  world.log?.(`[Trade] ${bot.name}: ${buy ? `B> ${name}${qty > 1 ? ` x${qty}` : ''} paying ${g(each)} ea` : `S> ${name} x${qty} ${g(each)}g ea`}`, TRADE);
}

// Answering an offer: buy what they sell, or sell them what they want.
export function answerOffer(bots, world, offer) {
  const M = bots.market;
  if (!M.offers.includes(offer)) return 'That offer is gone.';
  const name = ITEMS[offer.item]?.name ?? offer.label;
  if (offer.kind === 'sell') {
    const cost = offer.each * offer.qty;
    if (world.char.gold < cost) return 'Not enough gold.';
    if (!addItem(world.char.inventory, offer.item, offer.qty)) return 'Your bag is full.';
    world.char.gold -= cost;
    world.log(`Bought ${name} x${offer.qty} from ${offer.bot.name} for ${g(cost)} gold.`, '#bff0dc');
  } else if (offer.kind === 'buy') {
    const have = countItem(world.char.inventory, offer.item);
    const n = Math.min(have, offer.qty);
    if (!n) return `You don't have any ${name}.`;
    removeItem(world.char.inventory, offer.item, n);
    world.char.gold += offer.each * n;
    world.log(`Sold ${name} x${n} to ${offer.bot.name} for ${g(offer.each * n)} gold.`, '#bff0dc');
  } else if (offer.kind === 'yours') {
    const inv = world.char.inventory.equip;
    const i = inv.findIndex((x) => x.uid === offer.uid);
    if (i < 0) return 'You no longer have it.';
    inv.splice(i, 1);
    world.char.gold += offer.each;
    world.log(`Sold your ${offer.label} to ${offer.bot.name} for ${g(offer.each)} gold.`, '#bff0dc');
  }
  offer.bot.bubble = { text: pick(['ty!!', 'pleasure doing business', 'ty <3', 'deal!'], bots.rng), t: 4 };
  M.offers = M.offers.filter((o) => o !== offer);
  return null;
}

// ---------- Crafting rushes ----------

function startRush(M, bots, world) {
  const rng = bots.rng;
  const id = pick(RUSHABLE, rng);
  M.rush = { id, until: world.now + between(180, 300, rng) };
  M.mult[id] = Math.max(M.mult[id] ?? 1, between(2.2, 3.2, rng));
  const name = ITEMS[id].name;
  world.log?.(`[Trade] Everyone's buying ${name}! The price is through the roof (${g(priceOf(bots, id))} ea).`, TRADE);
  for (let i = 0; i < 3; i++) post(M, bots, world);
}

function endRush(M, bots, world) {
  const id = M.rush.id;
  M.rush = null;
  M.mult[id] = between(0.6, 0.8, bots.rng);
  world.log?.(`[Trade] The ${ITEMS[id].name} rush is over... prices crashed lol`, TRADE);
}

// ---------- Haggling ----------

// Haggle a shop entry down. Returns { text, ok } (and lowers the price when it works).
export function haggle(bots, world, bot, index) {
  const it = bot.shop?.items[index];
  if (!it) return null;
  const rng = bots.rng;
  if (world.now < (bot.offended ?? 0)) {
    bot.bubble = { text: 'not talking to u', t: 3 };
    return { ok: false, text: `${bot.name} won't haggle with you right now.` };
  }
  if (it.haggled) {
    bot.bubble = { text: 'thats already my best price', t: 3 };
    return { ok: false, text: `${bot.name} won't go any lower.` };
  }
  const friend = isBuddy(world.char, bot.name) || bot.regular || bot.helped;
  const r = rng();
  it.haggled = true;
  if (friend || r < 0.3) {
    it.price = Math.max(1, Math.round(it.price * (friend ? 0.75 : 0.85)));
    bot.bubble = { text: friend ? 'for u? friend price :)' : 'ok fine, deal', t: 3.5 };
    return { ok: true, text: `${bot.name} drops it to ${g(it.price)} gold.` };
  }
  if (r < 0.75) {
    it.price = Math.max(1, Math.round(it.price * 0.93));
    bot.bubble = { text: pick(['how about this', 'meet me halfway', 'best i can do'], rng), t: 3.5 };
    return { ok: true, text: `${bot.name} counters at ${g(it.price)} gold.` };
  }
  bot.offended = world.now + 60;
  it.haggled = false;
  bot.bubble = { text: pick(['lowballer!!', 'u serious?', 'no. just no.', 'do u know what this is worth'], rng), t: 4 };
  return { ok: false, text: `${bot.name} is offended by your offer.` };
}

// ---------- Lucky drops ----------

// You picked up something rare: the players around react, and someone may want to buy it.
export function luckyDrop(bots, world, inst) {
  const tier = inst?.rarity ?? 0;
  const def = ITEMS[inst?.id];
  if (!def || (tier < 2 && !def.unique)) return;
  const rng = bots.rng;
  const near = bots.list.filter((b) => !b.gone && !b.party && (b.body ? b.map === world.map.id && Math.abs(b.body.x - world.body.x) < 600 : b.map === world.map.id));
  const label = `${RARITIES[tier]?.name ?? ''} ${itemName(inst)}`.trim();
  near.slice(0, 3).forEach((b, i) => {
    b.sayAt = world.now + 0.8 + i * 1.2;
    b.sayLine = pick([`omg gz ${world.char.name}!!`, 'how?? i farmed for 3 hours', 'lucky!!', `a ${RARITIES[tier]?.name.toLowerCase() ?? 'rare'}??`, 'drop rate on u is crazy', 'not fair lol', 'gzzz'], rng);
    b.sayShout = true;
  });
  const buyer = near[0];
  if (buyer && rng() < 0.6) {
    const M = bots.market;
    const each = Math.round((def.price ?? 100) * (1 + tier) * between(1.5, 3, rng) / 10) * 10;
    M.offers.unshift({ id: `${M.next++}`, bot: buyer, kind: 'yours', uid: inst.uid, label, each, until: world.now + 120 });
    buyer.sayAt = world.now + 4.5;
    buyer.sayLine = `@${world.char.name} sell me that ${def.name}? ${g(each)}`;
    buyer.sayShout = true;
    world.log?.(`(${buyer.name} wants to buy your ${label}: see the Market tab, N.)`, TRADE);
  }
}

// ---------- Dungeon groups ----------

const LFG = (role, dungeon) => [`LF ${role} for ${dungeon}!!`, `need a ${role} for ${dungeon}, anyone?`, `${dungeon} group lf1m ${role}`, `any ${role}s? ${dungeon} run`];

function lookingForGroup(M, bots, world) {
  const rng = bots.rng;
  const mine = roleOf(world.char.job, JOBS[world.char.job].family);
  const def = DUNGEONS.hollow;
  if (!mine || world.char.level < def.minLevel || world.dungeon || partyMembers(bots).length) return;
  // Someone whose group is missing exactly what you are.
  const bot = pick(bots.list.filter((b) => !b.party && !b.hunter && !b.gone && !b.shop && b.map === world.map.id && b.level >= def.minLevel && roleOf(b.char.job, JOBS[b.char.job].family) && roleOf(b.char.job, JOBS[b.char.job].family) !== mine), rng);
  if (!bot) return;
  bot.lfg = { dungeon: def.id, role: mine, until: world.now + 90 };
  shout(world, bot, pick(LFG(ROLES[mine].label.toLowerCase(), def.name), rng));
  world.log?.(`(You're a ${ROLES[mine].label}: right-click ${bot.name} to join their group.)`, '#bff0dc');
}

// You answer: they take you into their group, and off you all go.
export function joinGroup(bots, world, bot) {
  if (!bot.lfg) return null;
  const id = bot.lfg.dungeon;
  bot.lfg = null;
  joinParty(bots, bot, world);
  bot.bubble = { text: pick(['yay a healer!! jk welcome', 'perfect, lets go', 'ty for joining!', 'group full, gogogo'], bots.rng), t: 4 };
  const why = startRun(world, id);
  if (why) {
    world.log(why, '#ffb3c6');
    return why;
  }
  world.log(`${bot.name}'s group takes you into ${DUNGEONS[id].name}!`, '#ffe36b');
  return null;
}

// ---------- Bounties ----------

function postBounty(M, bots, world) {
  const rng = bots.rng;
  const lv = world.char.level;
  const kinds = Object.values(MOBS).filter((d) => !d.boss && d.atk > 0 && Math.abs(d.level - lv) <= 8 && Object.values(MAPS).some((m) => !m.isTown && !m.dungeon && (m.spawns ?? []).some((s) => s.mob === d.id)));
  if (!kinds.length) return;
  const def = pick(kinds, rng);
  const by = pick(bots.list.filter((b) => !b.gone && !b.gm), rng);
  if (!by) return;
  const n = 10 + 5 * Math.floor(rng() * 4);
  // (About three times what the kills themselves would drop.)
  const each = def.gold ? (def.gold[0] + def.gold[1]) / 2 : def.level * 5;
  const reward = Math.round((each * n * between(2.5, 3.5, rng) + 100) / 50) * 50;
  M.bounties.push({ id: `${M.next++}`, by: by.name, mob: def.id, n, got: 0, reward, taken: false, until: world.now + 900 });
  world.log?.(`[Board] ${by.name}: ${g(reward)} gold to whoever kills ${n} ${def.name}s for me`, '#ffd6a0');
}

export function takeBounty(world, b) {
  b.taken = true;
  world.log(`Bounty taken: kill ${b.n} ${MOBS[b.mob].name}s for ${b.by} (${g(b.reward)} gold).`, '#ffd6a0');
}

export function bountyKill(bots, world, m) {
  const M = bots.market;
  if (!M) return;
  for (const b of M.bounties) {
    if (!b.taken || b.done || b.mob !== m.def.id) continue;
    b.got += 1;
    if (b.got < b.n) continue;
    b.done = true;
    world.char.gold += b.reward;
    world.log(`Bounty done! ${b.by} pays you ${g(b.reward)} gold.`, '#ffe36b');
    const poster = bots.list.find((x) => x.name === b.by && !x.gone);
    if (poster) poster.bubble = { text: pick(['ty!! bounty paid', 'ur a legend', 'exactly what i needed'], bots.rng), t: 4 };
  }
}

// ---------- The hall of fame ----------

// A steady number from a name (so a player's record doesn't jump about between looks).
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) / 4294967296;

export function hallOfFame(bots, world) {
  const seen = new Map();
  const add = (name, level, job, kills, raids, you = false) => {
    if (!seen.has(name)) seen.set(name, { name, level, job, kills, raids, you });
  };
  const book = Object.values(world.char.book ?? {}).reduce((n, k) => n + k, 0);
  add(world.char.name, world.char.level, world.char.job, book, world.char.raids ?? 0, true);
  const people = [
    ...(bots?.list ?? []).filter((b) => b.char && !b.gm && !b.merchant).map((b) => ({ name: b.name, level: b.char.level, job: b.char.job })),
    ...(world.char.regulars ?? []).map((r) => ({ name: r.name, level: r.level, job: r.jobs?.at(-1) ?? 'novice' })),
    ...(world.char.buddies ?? []).map((r) => ({ name: r.name, level: r.level, job: r.jobs?.at(-1) ?? 'novice' })),
  ];
  for (const p of people) {
    const h = hash(p.name);
    add(p.name, p.level, p.job, Math.round(p.level * p.level * 9 * (0.6 + h)), Math.floor((p.level / 12) * (0.5 + h * 1.5)));
  }
  const all = [...seen.values()];
  return {
    level: [...all].sort((a, b) => b.level - a.level || b.kills - a.kills),
    kills: [...all].sort((a, b) => b.kills - a.kills),
    raids: [...all].sort((a, b) => b.raids - a.raids || b.level - a.level),
  };
}

// ---------- Each frame ----------

export function createMarket() {
  return { mult: {}, offers: [], bounties: [], next: 1, driftIn: 0, postIn: 8, rushIn: 400, lfgIn: 200, bountyIn: 30 };
}

export function updateMarket(bots, world, dt) {
  const rng = bots.rng;
  const M = (bots.market ??= createMarket());
  const tick = (key, lo, hi, fn) => {
    M[key] -= dt;
    if (M[key] > 0) return;
    M[key] = between(lo, hi, rng);
    fn();
  };
  tick('driftIn', 20, 40, () => drift(M, rng));
  tick('postIn', 25, 60, () => post(M, bots, world));
  if (M.rush && world.now >= M.rush.until) endRush(M, bots, world);
  tick('rushIn', 400, 800, () => !M.rush && startRush(M, bots, world));
  tick('lfgIn', 240, 480, () => !world.dungeon && lookingForGroup(M, bots, world));
  tick('bountyIn', 120, 240, () => M.bounties.filter((b) => !b.done).length < 4 && postBounty(M, bots, world));
  M.offers = M.offers.filter((o) => world.now < o.until && !o.bot.gone);
  M.bounties = M.bounties.filter((b) => (b.taken && !b.done) || (!b.done && world.now < b.until) || (b.done && world.now < (b.shownUntil ??= world.now + 20)));
  for (const b of bots.list) if (b.lfg && world.now > b.lfg.until) b.lfg = null;
}
