// What the other players remember of you (docs/design/coop.md part 6): every run, every hour in a
// party, a trade at their shop, a gift, the time they saved you, a boss you beat together, a hand
// with a life skill. It's saved with your character (char.botMemory, by their name, with how they
// looked so they can come back), and it shapes how they treat you:
//
//   - now and then (rarely: once every quarter hour or so at most, each) they bring something up,
//     by its real name and when it was ("that Rootwood Hollow run last night was wild");
//   - the more you've done together, the warmer they are: someone you know comes over to say hi
//     when they see you in town, a good pal asks you along to hunt, and a close one now and then
//     hands you something small of theirs (potions, a material from their own life skill);
//   - someone you've spent real time with logs back in now and then, as themselves.
//
// Everything they say goes through the chat gate (world/chatlog.js). Cheap: the bookkeeping is a
// few numbers per player you've met, and the checks run a few times a minute.

import { DUNGEONS } from '../data/dungeons.js';
import { MAPS } from '../data/maps.js';
import { ITEMS } from '../data/items.js';
import { addItem } from '../core/inventory.js';
import { botChat } from './chatlog.js';
import { snapshot, remake, isBuddy } from './buddies.js';
import { partyMembers, PARTY_MAX, LEVEL_GAP, mayAskAlong, askAlong } from './party.js';
import { soulRng } from './botsoul.js';

const pick = (list, rng) => list[Math.floor(rng() * list.length)];
const between = (a, b, rng) => a + rng() * (b - a);

const KEEP = 40; // players remembered at most (the least known are forgotten first)
const RECALL_GAP = 900; // seconds between one player's memories out loud
const GIFT_GAP = 40 * 60 * 1000; // real time between gifts from the same player
const COMEBACK_GAP = 20 * 60 * 1000; // real time before someone you know logs back in

// How much each thing you did together counts toward how warm they are.
const WORTH = { run: 3, boss: 3, saved: 3, revive: 3, gift: 2, trade: 1, life: 2, quest: 3 };

export const memoryOf = (char) => (char.botMemory ??= {});

// The record of one player, made on first meeting.
function entry(char, bot) {
  const mem = memoryOf(char);
  const e = (mem[bot.name] ??= { met: Date.now(), partySecs: 0, counts: {}, last: [], maps: {} });
  e.seen = Date.now();
  e.snap = snapshot(bot);
  return e;
}

// How warm they are toward you: 0 (a stranger) and up.
export function warmth(char, name) {
  const e = memoryOf(char)[name];
  if (!e) return 0;
  let w = e.partySecs / 300;
  for (const [k, n] of Object.entries(e.counts)) w += (WORTH[k] ?? 1) * n;
  return w;
}

// 'stranger', 'familiar' (said hi, partied a bit), 'pal' (a few runs), 'close'.
export function standing(char, name) {
  const w = warmth(char, name);
  return w >= 20 ? 'close' : w >= 8 ? 'pal' : w >= 3 ? 'familiar' : 'stranger';
}

// Something you did with `bot`: kind (run, boss, saved, revive, gift, trade, life, quest) and what
// it was, by its real name (the dungeon, the boss, the item, the life skill). `where`: the map.
export function remember(char, bot, kind, what = null, where = null) {
  if (!bot?.name || !char) return;
  const e = entry(char, bot);
  e.counts[kind] = (e.counts[kind] ?? 0) + 1;
  e.last = [{ kind, what, where, at: Date.now() }, ...e.last.filter((x) => !(x.kind === kind && x.what === what))].slice(0, 6);
  trim(char);
}

// Time spent in a party together (and on which maps), counted as it goes.
export function partyTime(char, bot, secs, mapId) {
  const e = entry(char, bot);
  e.partySecs += secs;
  if (mapId && MAPS[mapId] && !MAPS[mapId].isTown) e.maps[mapId] = (e.maps[mapId] ?? 0) + secs;
}

function trim(char) {
  const mem = memoryOf(char);
  const names = Object.keys(mem);
  if (names.length <= KEEP) return;
  names.sort((a, b) => warmth(char, a) - warmth(char, b));
  for (const n of names.slice(0, names.length - KEEP)) delete mem[n];
}

// When it was, the way a person says it.
export function whenSaid(at, now = Date.now()) {
  const h = (now - at) / 3.6e6;
  if (h < 1) return 'earlier';
  if (h < 12) return 'today';
  if (h < 30) return 'last night';
  if (h < 72) return 'the other day';
  return 'a while back';
}

const mapName = (id) => MAPS[id]?.name ?? null;

// Something they remember out loud, built from the real record, or null.
export function recallLine(char, name, rng, now = Date.now()) {
  const e = memoryOf(char)[name];
  if (!e) return null;
  const lines = [];
  for (const m of e.last) {
    const when = whenSaid(m.at, now);
    const where = mapName(m.where);
    if (m.kind === 'run' && m.what) lines.push(`that ${m.what} run ${when} was wild`, `still thinking about our ${m.what} run lol`, `${m.what} again sometime? ${when} was fun`);
    if (m.kind === 'boss' && m.what) lines.push(`cant believe we beat ${m.what} ${when}`, `${m.what} ${when}... we were so good`, `my hands were shaking on ${m.what} lol`);
    if (m.kind === 'saved') lines.push(where ? `remember when u almost went down on ${where} lol` : 'remember when ur hp was at like 2', `u owe me a pot from ${when} hehe`);
    if (m.kind === 'revive') lines.push(`thx again for picking me up ${when}`, where ? `i still owe u for ${where}` : 'still owe u for that revive');
    if (m.kind === 'trade' && m.what) lines.push(`hows the ${m.what} treating u?`, `u still using that ${m.what} i sold u?`);
    if (m.kind === 'gift' && m.what) lines.push(`did the ${m.what} help?`, `hope the ${m.what} came in handy`);
    if (m.kind === 'life' && m.what) lines.push(`ty for the ${m.what} help ${when}`, `${m.what} together was so chill ${when}`);
    if (m.kind === 'quest' && m.what) lines.push(`ty again for the ${m.what} quest`, `still cant believe how fast we did those ${m.what}s`);
  }
  const top = Object.entries(e.maps).sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] > 240) lines.push(`we've spent so long on ${mapName(top[0])} together lol`, `${mapName(top[0])} feels like our spot now`);
  const runs = e.counts.run ?? 0;
  if (runs >= 3) lines.push(`${runs} runs together now, we're a team`);
  return lines.length ? pick(lines, rng) : null;
}

// A hello for someone they know, warmer the more you've done together.
function helloFor(char, name, rng) {
  const s = standing(char, name);
  const you = char.name;
  if (s === 'close') return pick([`${you}!!! hiii`, `omg ${you} ur on :D`, `my fav person ${you}!!`, `${you}!! missed u`], rng);
  if (s === 'pal') return pick([`hey ${you}!`, `oh hi ${you} :D`, `${you}! o/`, `yo ${you}`], rng);
  return pick([`oh hey, ${you} right?`, `hi again ${you}`, `${you}! we partied before right?`], rng);
}

// Something small to give: a few potions for their level, or a little of what their best life
// skill brings in. A real item that's in the game.
function giftFor(bot, rng) {
  const lv = bot.char.level;
  const pots = lv >= 30 ? ['white_potion', 'blue_potion', 'elixir'] : lv >= 15 ? ['orange_potion', 'blue_potion'] : ['red_potion', 'blue_potion'];
  const id = pick(pots.filter((p) => ITEMS[p]), rng);
  const n = id === 'elixir' ? 1 : 5 + Math.floor(rng() * 6);
  return id ? { id, n } : null;
}

// ---------- Each frame (bots.js) ----------

// `hooks.logIn(who)` and `hooks.makeChar` bring someone back online (as world/buddies.js does).
export function updateMemory(bots, world, dt, hooks) {
  const char = world.char;
  if (!char) return;
  const rng = soulRng(bots);
  const M = (bots.mem ??= { tick: 0, greeted: new Set(), comebackIn: between(60, 140, rng), giftIn: between(120, 240, rng), inviteIn: between(150, 300, rng), dungeon: null, bosses: new Set() });
  const members = partyMembers(bots);
  // Party time, as it goes.
  for (const b of members) if (b.map === world.map.id) partyTime(char, b, dt, world.map.id);
  // A run with your party: remembered once it's cleared.
  const run = world.dungeon;
  if (run && !run.shared && run.done && M.dungeon !== run) {
    M.dungeon = run;
    for (const b of members) remember(char, b, 'run', DUNGEONS[run.id]?.name ?? null, world.map.id);
  }
  // A boss falling with them there.
  for (const m of world.mobs ?? []) {
    if (!m.def?.boss || m.hp > 0 || M.bosses.has(m)) continue;
    M.bosses.add(m);
    for (const b of members) if (b.map === world.map.id) remember(char, b, 'boss', m.def.name.split(',')[0], world.map.id);
  }
  if (M.bosses.size > 20) M.bosses = new Set([...M.bosses].slice(-10));
  // Someone who rushed over to save you (world/buddies.js helpers).
  for (const b of bots.list) if (b.helped && !b.memSaved) {
    b.memSaved = true;
    remember(char, b, 'saved', null, world.map.id);
  }
  M.tick -= dt;
  if (M.tick > 0) return;
  M.tick = 2;
  greetings(bots, world, M, rng);
  recalls(bots, world, rng);
  M.giftIn -= 2;
  if (M.giftIn <= 0) {
    M.giftIn = between(150, 300, rng);
    gifts(bots, world, rng);
  }
  M.inviteIn -= 2;
  if (M.inviteIn <= 0) {
    M.inviteIn = between(180, 360, rng);
    invites(bots, world, rng);
  }
  M.comebackIn -= 2;
  if (M.comebackIn <= 0) {
    M.comebackIn = between(90, 200, rng);
    comeback(bots, world, rng, hooks);
  }
}

const near = (bot, world, d = 300) => bot.map === world.map.id && Math.abs((bot.body?.x ?? bot.x) - world.body.x) < d;
const busy = (b) => b.gone || b.shop || b.afk || b.life || ['transit', 'leave', 'logout', 'chat', 'chatwait', 'duel', 'approach', 'wave'].includes(b.state);

// Someone who knows you, nearby in town, who hasn't said hi yet this session: they come over first
// rather than getting caught up in small talk.
export const wantsToGreet = (bots, world, b) => world.map.isTown && !bots.mem?.greeted.has(b.name) && near(b, world, 420) && standing(world.char, b.name) !== 'stranger';

// Someone you know sees you in town: they come over and say hi, once a session.
function greetings(bots, world, M, rng) {
  if (!world.map.isTown || world.dead) return;
  for (const b of bots.list) {
    if (b.party || b.hunter || M.greeted.has(b.name) || busy(b) || !near(b, world, 420)) continue;
    if (standing(world.char, b.name) === 'stranger') continue;
    M.greeted.add(b.name);
    b.state = 'approach';
    b.waved = true;
    // (Their hello goes through the gate when they get there: bots.js approach.)
    b.hello = helloFor(world.char, b.name, rng);
    return;
  }
}

// Now and then, a memory out loud: rare, near you or in your party.
function recalls(bots, world, rng) {
  const char = world.char;
  for (const b of bots.list) {
    if (b.gone || !(b.party || near(b, world, 260)) || ['transit', 'leave', 'logout'].includes(b.state)) continue;
    const e = memoryOf(char)[b.name];
    if (!e || world.now < (b.recallAt ?? 0)) continue;
    b.recallAt = world.now + RECALL_GAP * between(0.8, 1.4, rng);
    if (rng() > 0.35) continue;
    const line = recallLine(char, b.name, rng);
    if (line && botChat(world, b, line, { prefix: b.party ? '[Party] ' : '', color: b.party ? '#9fe0b0' : '#e6dcff', important: Boolean(b.party) })) return;
  }
}

// A close one near you hands over something small of theirs.
function gifts(bots, world, rng) {
  const char = world.char;
  const now = Date.now();
  for (const b of bots.list) {
    if (b.gone || busy(b) || !(b.party || near(b, world, 200))) continue;
    const e = memoryOf(char)[b.name];
    if (!e || standing(char, b.name) === 'stranger' || warmth(char, b.name) < 8 || now - (e.giftAt ?? 0) < GIFT_GAP) continue;
    const g = giftFor(b, rng);
    if (!g || !addItem(char.inventory, g.id, g.n)) return;
    e.giftAt = now;
    const name = ITEMS[g.id].name;
    const line = pick([`here, take these ${name}s, i had extra`, `have some ${name}s! for later`, `catch!! ${name}s for u`], rng);
    botChat(world, b, g.n > 1 ? line : `here, a ${name} for u :)`, { important: true, prefix: b.party ? '[Party] ' : '' });
    world.log?.(`${b.name} gives you ${g.n > 1 ? `${g.n} ` : 'a '}${name}${g.n > 1 ? 's' : ''}.`, '#ffe36b');
    if (b.body) b.attack ??= { pose: 'cheer', t: 0, dur: 1 };
    else b.emote = { pose: 'cheer', t: 0, dur: 1.1 };
    return;
  }
}

// A good pal online (not with you) asks you along.
function invites(bots, world, rng) {
  const char = world.char;
  if (!mayAskAlong(bots, world) || world.dungeon || partyMembers(bots).length >= PARTY_MAX) return;
  const pals = bots.list.filter((b) => !b.gone && !b.party && !b.buddy && !b.shop && !b.afk && b.state !== 'logout' && b.level <= char.level + LEVEL_GAP && warmth(char, b.name) >= 8);
  const b = pals.length ? pick(pals, rng) : null;
  if (!b) return;
  askAlong(bots, world, b);
  const where = MAPS[b.map]?.name;
  world.log?.(`[Whisper] ${b.name}: ${pick([`wanna hunt again? like last time`, where ? `im at ${where}, come hunt?` : 'come hunt with me?', `party up ${char.name}?`], rng)} (N to answer)`, '#ffc8f0');
}

// Someone you've spent real time with (not a friend: those log in on their own) comes back online.
function comeback(bots, world, rng, hooks) {
  const char = world.char;
  if (!hooks?.logIn) return;
  const now = Date.now();
  const mem = memoryOf(char);
  const known = Object.entries(mem).filter(([name, e]) => e.snap && warmth(char, name) >= 3 && !isBuddy(char, name) && now - (e.seen ?? 0) > COMEBACK_GAP && !bots.list.some((b) => b.name === name));
  if (!known.length || rng() > 0.5) return;
  const [name, e] = pick(known, rng);
  const snap = e.snap;
  const who = { name, char: remake(snap, hooks.makeChar, rng), guild: snap.guild, style: snap.style, title: snap.title };
  const bot = hooks.logIn(who);
  if (bot) {
    e.seen = now;
    bot.known = true;
  }
}

// The names of everyone remembered (nobody new turns up with one).
export const rememberedNames = (char) => Object.keys(memoryOf(char));
