// Co-op life skills (docs/design/coop.md part 4): working a spot together, the party feast, and
// crafting for a friend. It all works the same with online friends (the world.net hooks, carried
// by net/together.js) and with bot party members (world/party.js).
//
// Working together: when two or more of the party work the same vein, tree, herb patch or fishing
// nook at once (or within TOGETHER_WINDOW seconds of each other), your pick or catch gets more
// finds, a better rare chance and a little more life EXP, with a "Together!" pop and a mint
// sparkle over the spot. When you start working a spot, bot party members on the map sometimes
// come over to help: they stand beside you and work it with the same moves, but never take it or
// use it up (only your own work rests a spot). Online, starting (and keeping on) working a spot
// sends a 'work' message, so a party friend on the same map at the same spot gets the bonus too.
//
//   spotKey(world, kind, i)        the key for a spot: kind 'node' (index into nodesOf) or 'fish'
//   startedWork(world, where, rng) you began working a spot: bots may come help, friends hear it
//   keepWorking(world)             each tick while you work: tells friends again now and then
//   workersAt(world, key)          { count (you included), names } working that spot now
//   togetherBonus(world, key, x,y) null when you're alone; else { helpers, extra, rare, life }
//   tickHelpers(bots, world, dt)   the bot helpers walk over, work beside you, and leave after
//   friendWorking(world, id, name, msg)  an online friend's 'work' message (net/together.js)
//
// The party feast and crafting for a friend are further down.

import { ITEMS } from '../data/items.js';
import { MAPS } from '../data/maps.js';
import { FEAST_BY_ID } from '../data/cooking.js';
import { addItem, removeItem, countItem } from '../core/inventory.js';
import { computeStats } from '../core/stats.js';
import { equipBlocker } from '../core/character.js';
import { addLifeExp, lifeAction, lifeLevel, needFor, LIFE_COLOR } from '../core/life.js';
import { botChat } from './chatlog.js';
import { remember } from './botmemory.js';
import { navOf, surfaceBelow } from './nav.js';

export const TOGETHER_WINDOW = 6;
// How likely each bot party member is to come over, and how many at most.
export const HELP_CHANCE = 0.55;
export const MAX_HELPERS = 2;
// How long a bot keeps helping after you stop.
const HELP_LINGER = 2.5;
const RESEND = 3;

const pick = (list, rng) => list[Math.floor(rng() * list.length)];

export const spotKey = (world, kind, i) => `${kind}:${world.map.id}:${i}`;

// Bot party members who are here and up for something.
export function partyBotsHere(world) {
  return (world.bots?.list ?? []).filter((b) => b.party && b.body && b.map === world.map.id && !b.down && !b.away);
}

// What the spot gives, in words, for the bots' lines.
function findName(where) {
  if (where.kind === 'fish') return null;
  const id = Object.keys(where.node?.pool ?? {})[0];
  return id ? ITEMS[id]?.name ?? null : null;
}

function helpLine(bot, where, world, rng) {
  const map = MAPS[world.map.id]?.name ?? 'here';
  if (where.kind === 'fish') {
    return pick([`fishing together at ${map}? say less`, `ill sit with u, two lines bite better`, `ooh ${map} nook, scoot over`], rng);
  }
  const find = findName(where);
  const what = where.node?.kind === 'ore' || where.node?.kind === 'gem' ? 'mine' : where.node?.kind === 'wood' ? 'chop' : 'pick';
  return pick([
    find ? `ill help ${what} the ${find.toLowerCase()}` : `ill help ${what} this one`,
    find ? `two of us on ${find.toLowerCase()} = more ${find.toLowerCase()}` : 'teamwork makes it go faster',
    `brb helping ${what} :3`,
  ], rng);
}

// You started working a spot. `where`: { key, kind: 'node' | 'fish', x, y, node?, pose, secs }.
export function startedWork(world, where, rng = Math.random) {
  world.coopSpot = { ...where, at: world.now, sent: world.now };
  world.net?.working?.(world, where.key);
  let helpers = partyBotsHere(world).filter((b) => b.lifeHelp?.key === where.key).length;
  for (const bot of partyBotsHere(world)) {
    if (bot.lifeHelp || helpers >= MAX_HELPERS || world.dungeon) continue;
    // (Only those near enough to come over: not someone off on the far side of the map.)
    if (Math.abs(bot.body.x - where.x) > 480 || Math.abs(bot.body.y - where.y) > 170) continue;
    // A member in the middle of a fight finishes it first.
    if (bot.brain?.target && bot.brain.target.hp > 0 && rng() < 0.6) continue;
    if (rng() >= HELP_CHANCE) continue;
    const side = helpers % 2 ? -1 : 1;
    const gx = Math.max(24, Math.min(world.map.width - 24, where.x + side * (26 + 12 * helpers)));
    const nav = navOf(world.map);
    bot.lifeHelp = { key: where.key, kind: where.kind, x: gx, y: where.y, spotX: where.x, pose: where.pose, secs: where.secs ?? 2, at: world.now, worked: -99, idle: 0, surface: surfaceBelow(nav, gx, where.y - 4) };
    helpers += 1;
    botChat(world, bot, helpLine(bot, where, world, rng), { prefix: '[Party] ', color: '#9fe0b0' });
  }
}

export function keepWorking(world) {
  const s = world.coopSpot;
  if (!s || world.now - s.sent < RESEND) return;
  s.sent = world.now;
  world.net?.working?.(world, s.key);
}

export function friendWorking(world, id, name, msg) {
  if (msg.map !== world.map.id || typeof msg.key !== 'string') return;
  (world.coopWork ??= {})[id] = { key: msg.key, at: world.now, name };
}

// Who's working spot `key` now (you count as one).
export function workersAt(world, key) {
  const names = [];
  for (const bot of partyBotsHere(world)) if (bot.lifeHelp?.key === key && world.now - bot.lifeHelp.worked <= TOGETHER_WINDOW) names.push(bot.name);
  for (const w of Object.values(world.coopWork ?? {})) if (w.key === key && world.now - w.at <= TOGETHER_WINDOW) names.push(w.name);
  return { count: 1 + names.length, names };
}

// The bonus for a finished pick or catch at `key`, with its pop over the spot (x, y), or null.
export function togetherBonus(world, key, x, y) {
  const { count, names } = workersAt(world, key);
  if (count < 2) return null;
  const helpers = Math.min(2, count - 1);
  const b = world.body;
  world.numbers?.push({ x: b.x, y: b.y - (b.h ?? 40) - 40, text: 'Together!', color: LIFE_COLOR, t: -0.2 });
  world.fx?.push({ kind: 'together', x, y, t: 0, dur: 1.2, n: count });
  world.log?.(`Working together with ${names.join(' and ')}: extra finds!`, LIFE_COLOR);
  world.events?.push({ type: 'together', key, count });
  // Helpers who worked it cheer a little.
  // (They'll remember working it with you: world/botmemory.js.)
  for (const bot of partyBotsHere(world)) {
    if (bot.lifeHelp?.key !== key) continue;
    bot.lifeHelp.cheer = 0.9;
    const h = bot.lifeHelp;
    remember(world.char, bot, 'life', h.kind === 'fish' ? 'Fishing' : h.pose === 'mine' ? 'Mining' : 'Gathering', world.map.id);
  }
  return { helpers, extra: helpers, rare: 1 + 0.5 * helpers, life: 1 + 0.25 * helpers };
}

const stillWorking = (world, key) => world.coopSpot?.key === key && Boolean(world.gathering || world.fishing);

// The bot helpers, each frame (world/party.js calls it after moving them): once at their place
// beside the spot they work it in a loop with the spot's own move; they stay a beat after you
// stop, then go back to what they were doing.
export function tickHelpers(bots, world, dt) {
  for (const bot of bots?.list ?? []) {
    const h = bot.lifeHelp;
    if (!h) continue;
    if (!bot.party || bot.map !== world.map.id || !bot.body || bot.down || bot.away || !h.key.includes(`:${world.map.id}:`)) {
      endHelp(bot);
      continue;
    }
    h.idle = stillWorking(world, h.key) ? 0 : h.idle + dt;
    if (h.idle > HELP_LINGER || world.now - h.at > 90) {
      endHelp(bot);
      continue;
    }
    const body = bot.body;
    const there = body.onGround && Math.abs(body.x - h.x) < 10 && Math.abs(body.y - h.y) < 14;
    if (!there) continue;
    body.vx *= 0.5;
    body.facing = h.spotX >= body.x ? 1 : -1;
    h.worked = world.now;
    if (h.cheer > 0) {
      h.cheer -= dt;
      if (!bot.attack || bot.attack.pose !== 'cheer') bot.attack = { pose: 'cheer', t: 0, dur: 0.9 };
    } else if (!bot.attack || bot.attack.pose !== h.pose) bot.attack = { pose: h.pose, t: 0, dur: h.secs };
  }
}

function endHelp(bot) {
  if (bot.attack && bot.attack.pose === bot.lifeHelp?.pose) bot.attack = null;
  bot.lifeHelp = null;
}

// Where a helping bot should head (party.js asks this when they think), or null.
export function helpGoal(bot) {
  const h = bot.lifeHelp;
  return h ? { x: h.x, y: h.y, surface: h.surface, mode: 'help' } : null;
}

// ---------- The party feast ----------
// A Feast (data/cooking.js FEASTS: one per region tier, cooked at a town stove from a bigger batch
// of that tier's dish ingredients) is eaten by one and shared by the whole party on the map: you,
// your bot party members (their stats take the buff) and your online party friends here (a net
// message). Each one fed gives you a little Cooking EXP for having served it.

export const FEAST_SERVE_EXP = 6;

const feastBuff = (f, now) => ({ name: f.name, since: now, until: now + f.secs, values: { ...f.values }, food: f.id, feast: true });

export const feastSkilled = (char, f) => lifeLevel(char, 'cooking') >= needFor(f);
export const feastReady = (char, f) => feastSkilled(char, f) && Object.entries(f.needs).every(([id, n]) => countItem(char.inventory, id) >= n);

// Cooks feast `f` at the stove: uses the bigger batch, makes one feast pot. A big pot is worth
// more Cooking EXP than a dish. Returns 1, or 0 when it can't be made.
export function cookFeast(world, f) {
  const char = world.char;
  if (!feastReady(char, f)) return 0;
  for (const [id, n] of Object.entries(f.needs)) removeItem(char.inventory, id, n);
  addItem(char.inventory, f.id, 1);
  lifeAction(world, 'cooking', { tier: f.tier, kind: 'cook', scale: 2.5 });
  return 1;
}

// Gives feast `f`'s buff to one character (yours or a bot's).
export function feastChar(char, f, now) {
  (char.buffs ??= {})[`feast:${f.id}`] = feastBuff(f, now);
}

// You eat feast `id` (from the bag: world.js useItem). Returns how many were fed, or 0.
export function serveFeast(world, id) {
  const f = FEAST_BY_ID[id];
  if (!f || removeItem(world.char.inventory, id, 1) < 1) return 0;
  const now = world.now;
  world.char.hp = Math.min(world.stats?.maxHp ?? Infinity, world.char.hp + f.heal);
  feastChar(world.char, f, now);
  const fed = [];
  for (const bot of partyBotsHere(world)) {
    feastChar(bot.char, f, now);
    bot.stats = computeStats(bot.char, now);
    bot.hp = Math.min(bot.stats.maxHp, (bot.hp ?? bot.stats.maxHp) + f.heal);
    fed.push(bot.name);
    world.fx?.push({ kind: 'potion', x: bot.body.x, y: bot.body.y, t: 0, dur: 0.5, color: f.colors[0] });
    botChat(world, bot, pick([`${f.name.toLowerCase()} hits different`, `thank u for the ${f.name.toLowerCase()}!!`, `${f.about.toLowerCase()} for ${Math.round(f.secs / 60)} min, nice`], Math.random), { prefix: '[Party] ', color: '#9fe0b0' });
  }
  const friends = world.net?.feast?.(world, f) ?? [];
  fed.push(...friends);
  world.log?.(`You served the ${f.name}${fed.length ? ` to ${fed.join(', ')}` : ''}! ${f.about} for ${Math.round(f.secs / 60)} minutes.`, '#ffd6a0');
  world.fx?.push({ kind: 'together', x: world.body.x, y: world.body.y, t: 0, dur: 1.2, n: 1 + fed.length });
  if (fed.length) addLifeExp(world, 'cooking', FEAST_SERVE_EXP * f.tier * fed.length);
  return 1 + fed.length;
}

// A party friend served a feast (net/together.js): you get its buff too.
export function friendFeast(world, name, id) {
  const f = FEAST_BY_ID[id];
  if (!f) return false;
  feastChar(world.char, f, world.now);
  world.log?.(`${name} served the party a ${f.name}! ${f.about} for ${Math.round(f.secs / 60)} minutes.`, '#ffd6a0');
  world.fx?.push({ kind: 'together', x: world.body.x, y: world.body.y, t: 0, dur: 1.2, n: 2 });
  return true;
}

// Bot buffs run out (their stats are worked out without the clock elsewhere, so the feast is
// taken off when its time is up).
export function tickBotBuffs(bots, world) {
  for (const bot of bots?.list ?? []) {
    const buffs = bot.char?.buffs;
    if (!buffs) continue;
    let gone = false;
    for (const [k, b] of Object.entries(buffs)) if (b.feast && b.until <= world.now) {
      delete buffs[k];
      gone = true;
    }
    if (gone) bot.stats = computeStats(bot.char, world.now);
  }
}

// ---------- Crafting for a friend ----------
// The craft bench can make a piece for a party member: a bot party member here, or an online
// party friend. Gear made for someone else carries `madeBy` (your name) for its tooltip.

// Who you can craft for: [{ kind: 'bot' | 'friend', id, name }].
export function craftTargets(world) {
  const out = partyBotsHere(world).map((b) => ({ kind: 'bot', id: b.id, name: b.name }));
  for (const g of world.net?.partyFriends?.() ?? []) out.push({ kind: 'friend', id: g.id, name: g.name });
  return out;
}

const power = (inst) => Object.values(inst?.stats ?? {}).reduce((n, v) => n + v, 0);

// Sends what was just crafted (`result` from core/crafting.js craft, out of your bag) to `who`.
// Returns true when it reached them.
export function deliverCraft(world, who, result, recipe) {
  if (!who || !result?.ok) return false;
  const inv = world.char.inventory;
  let item;
  if (result.inst) {
    const i = inv.equip.indexOf(result.inst);
    if (i < 0) return false;
    inv.equip.splice(i, 1);
    result.inst.madeBy = world.char.name;
    item = { inst: result.inst };
  } else {
    const qty = result.qty ?? recipe.qty ?? 1;
    if (removeItem(inv, recipe.makes, qty) < qty) return false;
    item = { id: recipe.makes, qty };
  }
  const name = ITEMS[item.inst?.id ?? item.id].name;
  if (who.kind === 'friend') {
    if (!world.net?.gift?.(world, who.id, item)) {
      if (item.inst) addItem(inv, item.inst);
      else addItem(inv, item.id, item.qty);
      world.log?.(`${who.name} isn't here to take it: it's in your bag.`, '#ffb3c6');
      return false;
    }
    world.log?.(`You made ${name} for ${who.name} and sent it over!`, '#d8f5d0');
  } else {
    const bot = world.bots?.list.find((b) => b.id === who.id && b.party);
    if (!bot) {
      if (item.inst) addItem(inv, item.inst);
      else addItem(inv, item.id, item.qty);
      return false;
    }
    giveBot(world, bot, item, name);
    world.log?.(`You made ${name} for ${bot.name}!`, '#d8f5d0');
  }
  addLifeExp(world, 'crafting', 4);
  world.events?.push({ type: 'craftedFor', to: who.name, id: item.inst?.id ?? item.id });
  return true;
}

// A bot party member takes a piece: they wear it if it suits them and beats what they have, and
// thank you for it in their own way.
function giveBot(world, bot, item, name) {
  const c = bot.char;
  let wore = false;
  if (item.inst) {
    const def = ITEMS[item.inst.id];
    const worn = c.equipment?.[def.slot];
    if (!equipBlocker(c, item.inst) && power(item.inst) >= power(worn)) {
      if (worn) addItem(c.inventory, worn);
      c.equipment[def.slot] = item.inst;
      bot.stats = computeStats(c, world.now);
      wore = true;
    } else addItem(c.inventory, item.inst);
  } else addItem(c.inventory, item.id, item.qty);
  (bot.gifts ??= []).push({ id: item.inst?.id ?? item.id, from: world.char.name, at: world.now });
  remember(world.char, bot, 'gift', name, world.map.id);
  const low = name.toLowerCase();
  const line = wore
    ? pick([`omg wearing the ${low} rn, ty ${world.char.name}!!`, `${low} equipped!! made by u, thats special`, `look look new ${low} :D`], Math.random)
    : item.inst
      ? pick([`ty for the ${low}! ill wear it when i can`, `saving the ${low} for later, thank u!`], Math.random)
      : pick([`ty for the ${low}! perfect timing`, `${item.qty > 1 ? `${item.qty} ${low}` : low}? ur the best`], Math.random);
  botChat(world, bot, line, { prefix: '[Party] ', color: '#9fe0b0', important: true });
  if (wore) bot.attack = { pose: 'cheer', t: 0, dur: 0.9 };
  return wore;
}
