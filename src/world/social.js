// Shops, luck, groups and standing among the other players.
//
//   - Haggling: in a player's shop, Haggle for a lower price. Friends and regulars give you a deal;
//     strangers counter, or take offence at a lowball and won't haggle for a while.
//   - Lucky drops: a rare piece dropping by other players gets a reaction ("how?? i farmed for 3
//     hours").
//   - Dungeon groups: players shout for the role their group is missing ("LF healer for Rootwood
//     Hollow"). When it's yours, right-click them (Join their group) and they take you in.
//   - The hall of fame: the server's top players (you among them) by level, kills and raids.

import { ITEMS, RARITIES } from '../data/items.js';
import { DUNGEONS, roleOf, ROLES } from '../data/dungeons.js';
import { JOBS } from '../data/jobs.js';
import { itemName } from '../core/items.js';
import { joinParty, partyMembers } from './party.js';
import { startRun } from './dungeon.js';
import { isBuddy } from './buddies.js';
import { botChat } from './chatlog.js';

const pick = (list, rng) => list[Math.floor(rng() * list.length)];
const between = (a, b, rng) => a + rng() * (b - a);

// (What drives the moment: an announcement, a vow, a winner. It skips chat's wait.)
function shout(world, bot, line) {
  botChat(world, bot, line, { important: true });
}

const g = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${n}`);

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
  // (Their group has its other seats: you come alone, not with a party of your own.)
  if (partyMembers(bots).length || world.dungeon) {
    const why = world.dungeon ? "You're already in a dungeon." : 'Leave your party first: their group only has room for you.';
    world.log(why, '#ffb3c6');
    return why;
  }
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

export function updateSocial(bots, world, dt) {
  const rng = bots.rng;
  const M = (bots.social ??= { lfgIn: 200 });
  const tick = (key, lo, hi, fn) => {
    M[key] -= dt;
    if (M[key] > 0) return;
    M[key] = between(lo, hi, rng);
    fn();
  };
  tick('lfgIn', 240, 480, () => !world.dungeon && lookingForGroup(M, bots, world));
  for (const b of bots.list) if (b.lfg && world.now > b.lfg.until) b.lfg = null;
}
