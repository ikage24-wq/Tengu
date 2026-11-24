// The adventurers in the world you see. Their minds (sim.js) say where each one is and what they're
// doing; this gives them a body there, using the game's own people machinery (world/bots.js for
// walking a town, world/party.js for fighting a field or a dungeon at your side):
//   in a town (home, the shops, their hobby): walking near what they're doing there
//   at the guild (Coinbridge, by Halvard): the hall, the tea corner, the training yard (asleep in the
//     bunks they're indoors, out of sight)
//   out hunting the map you're on: fighting its monsters (their hits never shake your screen)
//   with you: a party member, until you let them go
//   in a dungeon group: the finder calls on whoever fits the seat and is free
// They come and go through the map's ways like anyone, and never sparkle in or out.
//
// The guild is saved on your character (char.adventurers) and runs on the game clock: a game hour
// is five real minutes (world/daytime.js), so their days pass with yours.
import { ADVENTURERS, ADVENTURER_BY_ID, WEAPON_OF, FAMILY_OF } from '../../data/adventurers.js';
import { MAPS } from '../../data/maps.js';
import { ITEMS } from '../../data/items.js';
import { jobChain } from '../../data/jobs.js';
import { makeEquip } from '../../core/items.js';
import { computeStats } from '../../core/stats.js';
import { makeBotCharacter, addHunter, goToPortal } from '../bots.js';
import { joinParty } from '../party.js';
import { newGuild, loadGuild, saveGuild } from './state.js';
import { initGuild, tickGuild, youDid, joinYou, leaveYou, willJoin, injure } from './sim.js';
import { gainExp, growthRate, PACE } from './grow.js';
import { botChat } from '../chatlog.js';
import { lineFor, fightLine } from './talk.js';
import { remember } from './social.js';
import { roleOf, TIERS } from './catalog.js';
import { GUILD } from './mind.js';
import { GAME_HOUR_MS } from '../daytime.js';

const TOWNS = new Set(['sprout', 'harbor', 'crag', 'grove', 'lagoon', 'coinbridge']);
// (where in Coinbridge each part of the guild is, along its terrace (flat from 3500 to the east
// edge): the tea corner at the top of the stairs, the hall by the door beside Halvard (3570), the
// training yard at the east end past Penny (3808))
const GUILD_X = { [GUILD.kitchen]: 3540, [GUILD.hall]: 3680, [GUILD.yard]: 3870 };
const GUILD_W = { [GUILD.kitchen]: 50, [GUILD.hall]: 170, [GUILD.yard]: 140 };
const TERRACE = [3505, 3945];
// (each has their own place in a spot, so a crowd spreads out instead of standing in one pile)
const spread = (id, w) => (([...id].reduce((a, c) => a * 33 + c.charCodeAt(0), 5) >>> 0) % 1000 / 1000 - 0.5) * w;
const RANK_TITLE = { veteran: 'Guild Veteran', peer: 'Adventurer', rookie: 'Guild Rookie' };

// (the game's own hours: five real minutes each, world/daytime.js)
export const nowHours = (bots) => (bots?.clock?.() ?? new Date()).getTime() / GAME_HOUR_MS;

// Their character for the body: their own look (and signature hair), their level and job line, and
// the gear ladder's set they own, worn without the hat so the hair shows.
const CHARS = new Map();
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
export function advChar(s, level = s.level) {
  const key = `${s.id}:${level}:${s.job}:${s.tier}`;
  if (CHARS.has(key)) return CHARS.get(key);
  const def = ADVENTURER_BY_ID[s.id];
  const rng = seeded(key);
  const char = makeBotCharacter(rng, { name: def.name, pro: false, level, jobs: jobChain(s.job).slice(1), life: 'keen' });
  char.appearance = { ...char.appearance, ...def.look, earStyle: def.look.earStyle ?? 'round' };
  char.outfit = {};
  for (const slot of Object.keys(char.equipment)) char.equipment[slot] = null;
  const tier = TIERS.find((t) => t.id === s.tier);
  const weapon = `${WEAPON_OF[s.job] ?? 'sword'}_${tier?.level ?? 0}`;
  if (ITEMS[weapon]) char.equipment.weapon = makeEquip(weapon, { rng, rarity: 1 });
  const family = FAMILY_OF[s.job] ?? 'warrior';
  if (tier) for (const slot of ['top', 'bottom', 'shoes', 'gloves', 'cape']) {
    const id = `${tier.id}_${family}_${slot}`;
    if (ITEMS[id]) char.equipment[slot] = makeEquip(id, { rng, rarity: 1 });
  }
  const st = computeStats(char);
  char.hp = st.maxHp;
  char.mp = st.maxMp;
  CHARS.set(key, char);
  return char;
}

// The guild, from your save (or new), caught up to now, with its hooks into the people machinery.
export function attachGuild(world, bots) {
  const char = world.char;
  const now = nowHours(bots);
  const g = initGuild(loadGuild(char.adventurers, char.level, now));
  // (anyone who was with you when you last stopped playing has gone home since)
  for (const s of Object.values(g.adv)) if (s.act.kind === 'party') leaveYou(g, s.id, now);
  Object.defineProperty(g, 'toJSON', { value() { return saveGuild(this); }, enumerable: false });
  char.adventurers = g;
  tickGuild(g, now, { playerLevel: char.level });
  bots.guild = g;
  world.guild = g;
  g.seenLevel = char.level;
  const you = () => world.char.name;
  // Something they say aloud now and then (their activity, a thought, something on their mind).
  bots.advLine = (bot, { aloud = true } = {}) => lineFor(g, bot.adv, nowHours(bots), { youName: you(), aloud })?.text ?? null;
  // Asked to join your party: a real yes or no.
  bots.advAnswer = (bot) => {
    const r = willJoin(g, bot.adv);
    const line = lineFor(g, bot.adv, nowHours(bots), { youName: you(), asked: r.yes ? 'yes' : 'no', why: r.why })?.text;
    if (r.yes) joinYou(g, bot.adv, nowHours(bots));
    return { yes: r.yes, line };
  };
  bots.advLeft = (bot) => leaveYou(g, bot.adv, nowHours(bots), world.map.id);
  bots.advDown = (bot) => {
    const s = g.adv[bot.adv];
    if (s) injure(g, s, 3 + Math.random() * 3, nowHours(bots), `got knocked out at ${world.map.name ?? 'a fight'}`);
  };
  bots.advRecruit = (opts) => recruitAdventurer(world, bots, g, opts);
  // EXP from fighting at your side goes to their own life, by the growth rules (their usual pace
  // counts their part-time hunting, so a kill with you counts as one kill); a new level shows on
  // their body at once.
  bots.advExp = (bot, exp) => {
    const s = g.adv[bot.adv];
    if (!s) return;
    const ups = gainExp(g, s, Math.round((exp * growthRate(s, world.char.level)) / PACE), nowHours(bots));
    if (!ups) return;
    const char = advChar(s);
    Object.assign(bot, { char, level: s.level, stats: computeStats(char) });
    world.fx.push({ kind: 'levelup', x: bot.body?.x ?? bot.x, y: bot.body?.y ?? world.body.y, t: 0, dur: 1.6 });
    world.log(`${bot.name} reached level ${s.level}!`, '#ffe36b');
    botChat(world, bot, fightLine(g, s.id, 'levelup'), { prefix: '[Party] ', color: '#9fe0b0', important: true, voiced: true });
  };
  // (in a fight, in their own words)
  bots.advFight = (bot, kind, ctx = {}) => fightLine(g, bot.adv, kind, { you: world.char.name, ...ctx });
  // (answering a call for help on the guild board: they come to you)
  bots.advSummon = (id) => {
    const here = bots.list.find((b) => b.adv === id && !b.gone && b.map === world.map.id);
    if (here) return here;
    for (const b of bots.list) if (b.adv === id) b.gone = true;
    return bodyAtYou(world, bots, g.adv[id]);
  };
  bots.advJoined = (bot) => joinYou(g, bot.adv, nowHours(bots));
  // A boss falls with some of them in your party: their win as much as yours, and anyone who asked
  // the board for help with it got it.
  world.onBossKill = (m) => {
    const now = nowHours(bots);
    const ids = bots.list.filter((b) => b.party && b.adv).map((b) => b.adv);
    youDid(g, 'beat', { boss: m.def.id, with: ids }, now);
    for (const r of g.requests ?? []) {
      if (!r.open || r.boss !== m.def.id || !ids.includes(r.by)) continue;
      r.open = false;
      const s = g.adv[r.by];
      s.bond = Math.min(100, s.bond + 10);
      s.ops.you.aff = Math.min(1, s.ops.you.aff + 0.15);
      s.ops.you.trust = Math.min(1, s.ops.you.trust + 0.2);
      remember(s, now, 'saved', 'got past my wall because you came when I asked', { who: ['you'], feel: 1, sal: 1 });
    }
  };
  return g;
}

// Every frame: the guild's clock (each second), what you did (your level), and bodies where they are.
export function updateAdventurers(world, bots, dt) {
  const g = bots?.guild;
  if (!g) return;
  bots.advTick = (bots.advTick ?? 0) - dt;
  if (bots.advTick > 0) return;
  bots.advTick = 0.5;
  const now = nowHours(bots);
  if (world.char.level !== g.seenLevel) {
    g.seenLevel = world.char.level;
    youDid(g, 'level', { level: world.char.level }, now);
  }
  tickGuild(g, now, { playerLevel: world.char.level });
  syncBodies(world, bots, g);
}

// Where each one's body should be on the map you're on: 'town' at an x, 'hunter', or nothing.
function wantHere(world, s) {
  const here = world.map.id;
  const place = s.place;
  if (!place || s.act.kind === 'party' || s.act.kind === 'sleep') return null;
  if (place.startsWith('guild:')) return here === 'coinbridge' && GUILD_X[place] ? { kind: 'town', x: Math.round(GUILD_X[place] + spread(s.id, GUILD_W[place])) } : null;
  if (place !== here) return null;
  if (TOWNS.has(place)) return { kind: 'town', x: null };
  if (world.map.isTown || world.dungeon) return null;
  // (a boss fight happens in the boss's own room, not out on the field)
  return ['hunt', 'bounty', 'explore', 'hobby'].includes(s.act.kind) ? { kind: 'hunter' } : null;
}

function syncBodies(world, bots, g) {
  const fresh = bots.advMap !== world.map.id;
  bots.advMap = world.map.id;
  const have = new Map(bots.list.filter((b) => b.adv && !b.gone).map((b) => [b.adv, b]));
  for (const s of Object.values(g.adv)) {
    const want = wantHere(world, s);
    const bot = have.get(s.id);
    if (bot?.party) continue;
    if (bot && (!want || (want.kind === 'hunter') !== Boolean(bot.hunter))) {
      // (off to do something else: they walk out through the nearest way)
      if (!bot.advGoing) {
        bot.advGoing = true;
        if (bot.hunter) bot.session = 0;
        else goToPortal(bot, MAPS[bot.map], 'logout');
      }
      continue;
    }
    if (bot) {
      if (want.kind === 'town' && want.x != null && bot.anchor !== want.x) {
        // (off to another part of the guild: they walk over)
        bot.anchor = want.x;
        if (['idle', 'walk'].includes(bot.state)) {
          bot.state = 'walk';
          bot.target = want.x;
        }
      }
      bot.advState = s.act.kind;
      continue;
    }
    if (!want) continue;
    const made = want.kind === 'hunter' ? addAdvHunter(world, bots, s, !fresh) : addAdvTown(world, bots, s, want.x, !fresh);
    if (made) made.advState = s.act.kind;
  }
  // (someone coming over to say hello greets you in their own words)
  for (const b of bots.list) {
    if (!b.adv || b.state !== 'approach' || b.hello != null) continue;
    b.hello = lineFor(g, b.adv, nowHours(bots), { youName: world.char.name, aloud: false })?.text ?? 'Hi!';
    // (and having said hello, you've met)
    youDid(g, 'talk', { id: b.adv }, nowHours(bots));
  }
}

function baseBot(s, char) {
  const def = ADVENTURER_BY_ID[s.id];
  return {
    id: `adv-${s.id}`, adv: s.id, name: def.name, char, level: char.level, pro: false,
    guild: "Adventurers' Guild", style: { caps: false, punct: true, emoji: false, typo: 0 }, title: RANK_TITLE[def.rank],
    facing: 1, state: 'idle', timer: 2, session: Infinity, stay: Infinity, nextLine: 20 + Math.random() * 40, bubble: null, waved: false, shop: null, appear: 0,
  };
}

function addAdvTown(world, bots, s, x, walkIn) {
  const map = world.map;
  const char = advChar(s);
  const anchor = x ?? spotFor(map, s.id);
  const bot = { ...baseBot(s, char), map: map.id, x: anchor, anchor, anchorSpan: x != null && map.id === 'coinbridge' ? TERRACE : null };
  if (walkIn) {
    const ways = (map.portals ?? []).filter((p) => !p.hidden && !p.homestone);
    const p = ways.sort((a, b) => Math.abs(a.x - anchor) - Math.abs(b.x - anchor))[0];
    if (p) {
      bot.x = p.x;
      bot.state = 'walk';
      bot.target = anchor;
    }
  }
  bots.list.push(bot);
  return bot;
}
// (a steady spot each in a town: their own corner of it)
function spotFor(map, id) {
  const h = [...id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  const lo = map.walkSpan?.[0] ?? 200;
  const hi = map.walkSpan?.[1] ?? map.width - 200;
  return lo + (h % 1000) / 1000 * (hi - lo);
}

function addAdvHunter(world, bots, s, walkIn) {
  const char = advChar(s);
  const def = ADVENTURER_BY_ID[s.id];
  const bot = addHunter(bots, world, walkIn, { name: def.name, char, guild: "Adventurers' Guild", style: baseBot(s, char).style, title: RANK_TITLE[def.rank] });
  if (!bot) return null;
  bot.adv = s.id;
  bot.id = `adv-${s.id}`;
  bot.session = Infinity;
  return bot;
}

// The dungeon finder asks the guild for someone to fill a seat: whoever's free and fits the role
// best (their own job's role first, near the dungeon's level). Level sync brings anyone below the
// seat's level up to it for the run.
const SEAT_ROLES = { tank: ['tank'], healer: ['healer'], dps: ['damage', 'control', 'support', 'novice'] };
function recruitAdventurer(world, bots, g, { role, lo, hi }) {
  const now = nowHours(bots);
  const inParty = new Set(bots.list.filter((b) => b.party && b.adv).map((b) => b.adv));
  const cands = Object.values(g.adv)
    .filter((s) => !inParty.has(s.id) && s.act.kind !== 'party')
    .map((s) => {
      const fits = SEAT_ROLES[role]?.includes(roleOf(s.job)) ? 2 : role === 'healer' && s.level < 30 && roleOf(s.job) === 'tank' ? 1 : 0;
      const free = willJoin(g, s.id).yes ? 1 : s.act.kind === 'sleep' ? -1.5 : 0;
      const near = -Math.abs(s.level - (lo + hi) / 2) * 0.08;
      return { s, sc: fits * 2 + free + near + (s.ops.you?.aff ?? 0) };
    })
    .sort((a, b) => b.sc - a.sc);
  const pick = cands[0]?.s;
  if (!pick) return null;
  for (const b of bots.list) if (b.adv === pick.id) b.gone = true;
  const bot = bodyAtYou(world, bots, pick, Math.max(pick.level, lo));
  joinYou(g, pick.id, now);
  return bot;
}
// A body for them right beside you (they've come to join you).
function bodyAtYou(world, bots, s, level = s.level) {
  const char = advChar(s, level);
  const bot = { ...baseBot(s, char), map: world.map.id, x: world.body.x - 40 - Math.random() * 40, waved: true, appear: 0 };
  bots.list.push(bot);
  return bot;
}
export { joinParty };
