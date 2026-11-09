// Other "players": generated characters who log in, walk around towns, chat, travel between
// towns, open shops to sell their loot, wave at you now and then, and eventually log out for good.
// In town they also cook at the stove, craft at the bench, pick the town's own spot and fish a
// street-side nook (world/botlife.js), stop to chat with each other, and emote;
// they wear titles and gear sets. They talk back to you (hellos, questions answered from the
// game's own data, cheers when you level up or land a rare fish, emotes returned). A few hunt the
// field map you're on (never taking the monsters by you, and rushing in when a queen comes back;
// now and then working a life spot on the way, and a keen life-skiller or two going round the
// map's spots: world/botlife.js),
// and now and then the server shares news of someone's big moment.
// Each one is built like a real character (level, job, stat build, rolled gear), so you can click
// them to see their stats and gear. Nobody comes back after logging out, and no name repeats.
//
// About 22 are online (never under 20), spread over the towns by level so each town has a handful.
// This runs alongside the world (main.js calls updateBots), not inside updateWorld, so the game
// rules stay deterministic for tests.

import { MAX_LEVEL } from '../core/exp.js';
import { createCharacter, gainExp, advanceJob, spendAp, STAT_KEYS } from '../core/character.js';
import { computeStats } from '../core/stats.js';
import { expToNext } from '../core/exp.js';
import { makeEquip, makeCash, rollRarity, itemName } from '../core/items.js';
import { CASH_ITEMS } from '../data/cash.js';
import { ITEMS, EQUIP_SLOTS } from '../data/items.js';
import { JOBS, FAMILY_STATS, FIRST_JOB_LEVEL } from '../data/jobs.js';
import { MAPS, TOWNS } from '../data/maps.js';
import { HAIR_STYLES, PICKABLE_EYE_STYLES, OUTFIT_STYLES, FACE_STYLES, BROW_STYLES } from '../render/hero.js';
import { speak, moodFor, makeStyle, price as priceText, reply, answer, conversation, voiced, contextOf } from './chatter.js';
import { updateParty, tickHunter, fieldDownOver } from './party.js';
import { updateBuddies, thanked, buddiesOf } from './buddies.js';
import { updateRaids, raidBoss, gather } from './raids.js';
import { isQueen } from './story.js';
import { updateDrama, serverTime, ONLINE, timeLine } from './drama.js';
import { updateEvents } from './events.js';
import { updateLives } from './lives.js';
import { updateSocial, luckyDrop } from './social.js';
import { botChat, stale, sayOver, sayOneOf } from './chatlog.js';
import { SETS, SET_SLOTS, setPieceId } from '../data/sets.js';
import { dungeonForLevel } from '../data/dungeons.js';
import { GEAR_FAMILIES } from '../data/items.js';
import { FISH } from '../data/fishing.js';
import { MOBS } from '../data/mobs.js';
import { createBody } from './physics.js';
import { navOf, surfaceBelow } from './nav.js';
import { rollLife, fitLifer, fieldLife, fieldLifeAfter, nightTip, townPastime, tickTownLife, stopTown } from './botlife.js';
import { nodesOf } from './gathering.js';
import { SPOTS } from '../data/fishing.js';
import { updateSouls, populationAt, soulLine, moodVoice, moodEmote, walkSpeed, befriend, soulRng, arriveTogether } from './botsoul.js';
import { updateMemory, remember, rememberedNames, wantsToGreet } from './botmemory.js';

const pick = (list, rng = Math.random) => list[Math.floor(rng() * list.length)];
const between = (a, b, rng = Math.random) => a + rng() * (b - a);

// Players online across all towns (counting those between towns): it follows the game's day
// (world/botsoul.js: busiest in the evening, around ONLINE on average), never fewer than two under
// it: someone logging out is soon replaced. (`daily`: the game passes it; tests that don't keep a
// steady crowd.)
const onlineNow = (bots) => (bots?.daily ? populationAt(bots.clock()) : ONLINE);
const PER_TOWN = 8; // most in one town at once

// Where players of each level hang out, following the hunting grounds around each town: Sprout
// Village for beginners, Ember Crag and Pastel Harbor in the middle, Moonleaf Grove for the
// high-level maps and the Crystal King.
// (Coinbridge, the trading town, draws traders of every level to its market.)
const TOWN_LEVELS = { sprout: [1, 12], coinbridge: [8, 99], crag: [10, 25], harbor: [15, 35], grove: [30, 99], lagoon: [15, 99] };
// The towns players hang out in: the four, and Lantern Lagoon across the sea, where anglers go
// (a smaller crowd, mostly there to fish its nooks and the derby), and Coinbridge, the trading town
// (traders of every level in its market). `PULL` weighs how often a town
// is picked against the others.
const BOT_TOWNS = [...TOWNS, 'lagoon', 'coinbridge'];
const CROWD = { lagoon: 5 };
const PULL = { lagoon: 0.5 };
const capOf = (t) => CROWD[t] ?? PER_TOWN;
// Where town players stroll in a map (`walkSpan` keeps them off a town's cliff), and the ways in
// and out they use: the town's paths and its ferry, never someone's front door.
const spanOf = (map) => map.walkSpan ?? [140, map.width - 140];
const waysOf = (map) => {
  const [a, b] = spanOf(map);
  return map.portals.filter((p) => (p.ferry || !p.hidden) && !p.door && p.x >= a - 20 && p.x <= b + 20);
};
const WALK = 46;
const PRO_RATE = 0.05;

// ---------- Names ----------

const SYL = ['mo', 'chi', 'ka', 'ri', 'to', 'lu', 'na', 'mi', 'ko', 'sa', 'yu', 'ra', 'pi', 'ne', 'zu', 'ki', 'ta', 'ru', 'po', 'fi', 'la', 'shi', 'ren', 'ha', 'so', 'yo', 'rin', 'kai', 'ao', 'mei', 'nyo', 'bun', 'pom', 'ta', 'koi', 'el', 'vi', 'xa', 'ly', 'ze'];
const WORDS = ['Star', 'Moon', 'Petal', 'Cloud', 'Bunny', 'Pudding', 'Mochi', 'Dragon', 'Shadow', 'Sun', 'Frost', 'Blade', 'Kitty', 'Tea', 'Honey', 'Pixel', 'Nova', 'Sky', 'Berry', 'Fox', 'Owl', 'Ghost', 'Candy', 'Lily', 'Storm', 'Ember', 'Noodle', 'Biscuit', 'Crystal', 'Maple', 'Cocoa', 'Sprout', 'Comet', 'Raven', 'Peach', 'Dumpling', 'Waffle', 'Luna', 'Sakura', 'Clover', 'Neon', 'Velvet'];
const TAILS = ['chan', 'kun', 'sama', 'uwu', 'xd', 'qt', 'pls', 'irl', 'gg', 'tv'];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

function makeName(taken, rng) {
  const syl = () => pick(SYL, rng);
  const word = () => pick(WORDS, rng);
  const n = () => `${Math.floor(rng() * (rng() < 0.5 ? 100 : 10000))}`;
  const patterns = [
    () => cap(syl() + syl()), () => cap(syl() + syl() + syl()), () => `${syl()}${syl()}_${pick(TAILS, rng)}`, () => word() + word(),
    () => `xX${word()}Xx`, () => word() + n(), () => `${syl()}_${word().toLowerCase()}`, () => `Sir${word()}`, () => `${word().toLowerCase()}${pick(TAILS, rng)}`,
    () => `Dark${word()}`, () => `${word()}${pick(['Girl', 'Boy', 'Kun', 'Chan', 'Main', 'Fan'], rng)}`, () => `${word().toLowerCase()}_${word().toLowerCase()}`,
    () => `its${word()}`, () => `xx_${syl()}${syl()}_xx`, () => `${word()}4ever`, () => `The${word()}`, () => `${cap(syl() + syl())}${n()}`, () => `lil${word()}`,
  ];
  for (let i = 0; i < 40; i++) {
    const name = pick(patterns, rng)();
    if (name.length <= 14 && !taken.has(name.toLowerCase())) {
      taken.add(name.toLowerCase());
      return name;
    }
  }
  const fallback = `Player${Math.floor(rng() * 1e6)}`;
  taken.add(fallback.toLowerCase());
  return fallback;
}

const GUILDS = ['Moonlight', 'Petal Squad', 'Cozy Corner', 'Stardust', 'Mochi Club', 'Nightfall', 'Cloud Nine', 'Sugar Rush', 'Kitty Cult', 'Legends', 'Bun Brigade', 'Daydreamers', 'Tea Party', 'Starfall', 'Honeybees', 'Lucky Clovers'];

// ---------- Characters ----------

const HAIR = ['#e9ebfa', '#ff9ec0', '#f5c95c', '#b9a7ff', '#7a5238', '#3b3650', '#9be08f', '#ffb38a', '#8fd3ff', '#ff6b6b', '#ffffff'];
const SKIN = ['#fff0e6', '#fbd9bf', '#e7b48f', '#c98e66', '#8a5a3c'];
const EYES = ['#4fcfb8', '#9b6cff', '#5aa8ff', '#e8a23c', '#7a4a2b', '#ff6b8a', '#3f9f5f'];
const CLOTHES = ['#ffc2d6', '#bfe0ff', '#bff0dc', '#fff3a6', '#e0cfff', '#ffd0a8', '#ffffff', '#5d5285', '#3b3650', '#ff9b7a'];

function makeLook(rng) {
  return {
    hairStyle: pick(HAIR_STYLES, rng), hairColor: pick(HAIR, rng), skinTone: pick(SKIN, rng), eyeColor: pick(EYES, rng),
    eyeStyle: pick(PICKABLE_EYE_STYLES, rng), face: pick(FACE_STYLES, rng), outfit: pick(OUTFIT_STYLES, rng), outfitColor: pick(CLOTHES, rng),
    // About one player in five plays an elf.
    browStyle: pick(BROW_STYLES, rng), earStyle: rng() < 0.2 ? pick(['elf', 'long'], rng) : 'round',
  };
}

// (Pros are at the level cap, 50, in endgame gear.)
function rollLevel(pro, rng) {
  if (pro) return MAX_LEVEL;
  const r = rng();
  if (r < 0.3) return Math.floor(between(1, 12, rng));
  if (r < 0.8) return Math.floor(between(12, 40, rng));
  return Math.floor(between(40, MAX_LEVEL, rng));
}

// The job path a character of this level would be on. Warriors, archers and thieves advance to a
// level 30 path; the Tide Mage (the new Mage, 2026-11-09) to the Maelstrom or the Tidecaller.
function jobPath(level, rng) {
  if (level < FIRST_JOB_LEVEL) return ['novice'];
  const first = pick(['warrior', 'archer', 'thief', 'tidemage'], rng);
  if (first === 'warrior' && level >= 30) return [first, pick(['paladin', 'berserker'], rng)];
  if (first === 'archer' && level >= 30) return [first, pick(['beastmaster', 'stormcaller'], rng)];
  if (first === 'thief' && level >= 30) return [first, pick(['shinobi', 'kitsune'], rng)];
  if (first === 'tidemage' && level >= 30) return [first, pick(['maelstrom', 'tidecaller'], rng)];
  return [first];
}

const BUILDS = [
  { id: 'standard', weight: 0.6 },
  { id: 'pure', weight: 0.25 },
  { id: 'hybrid', weight: 0.15 },
];

function spendBuild(char, build, rng) {
  const { primary, secondary } = FAMILY_STATS[JOBS[char.job].family];
  if (char.job === 'novice') {
    while (char.ap > 0) spendAp(char, pick(STAT_KEYS, rng));
    return;
  }
  const need = build === 'pure' ? 4 + Math.floor(char.level * 0.35) : build === 'hybrid' ? Math.floor(char.level * 2.2) : 4 + Math.floor(char.level * 0.8);
  while (char.ap > 0) spendAp(char, char.base[secondary] < need ? secondary : primary);
}

export function buildLabel(char) {
  if (char.job === 'novice') return 'Beginner';
  const { primary, secondary } = FAMILY_STATS[JOBS[char.job].family];
  const p = char.base[primary];
  const s = char.base[secondary];
  if (s <= 4 + char.level * 0.4) return `Pure ${primary.toUpperCase()}`;
  if (s >= p * 0.6) return `${primary.toUpperCase()} / ${secondary.toUpperCase()} hybrid`;
  return `${primary.toUpperCase()} main`;
}

// The best few items a character could wear in a slot, picked with some luck: their own job's
// set at their level, a weapon they can use, or now and then a unique outfit. `variant` is the
// color they're going for (most players match their outfit).
// (The item list by slot, worked out once: a new player showing up on the map rolls a full set,
// and going through every item for each slot made that a visible hitch.)
let bySlot = null;
function itemsIn(slot) {
  if (!bySlot) {
    bySlot = new Map();
    for (const d of Object.values(ITEMS)) if (d.slot) (bySlot.get(d.slot) ?? bySlot.set(d.slot, []).get(d.slot)).push(d);
  }
  return bySlot.get(slot) ?? [];
}

function gearFor(char, slot, pro, rng, variant) {
  const job = JOBS[char.job];
  const weapons = job.weapons ?? [];
  const wearable = (d) => !d.legacy && !d.crafted && (!d.family || d.family === job.family || (d.starter && char.job === 'novice'));
  let pool = itemsIn(slot).filter((d) => d.reqLevel <= char.level && wearable(d) && (slot !== 'weapon' || weapons.includes(d.weaponType)));
  if (!pro) pool = pool.filter((d) => !d.endgame);
  else if (slot === 'weapon' && rng() < 0.75 && pool.some((d) => d.endgame)) pool = pool.filter((d) => d.endgame);
  if (!pool.length) return null;
  pool.sort((a, b) => b.reqLevel - a.reqLevel);
  // Uniques show up now and then for flair.
  const uniques = pool.filter((d) => d.unique);
  const def = uniques.length && rng() < 0.2 ? pick(uniques, rng) : pick(pool.slice(0, 2), rng);
  const rarity = pro ? Math.max(2, rollRarity(rng)) : rollRarity(rng);
  const own = def.slot === 'earring' ? 'roll' : rng() < 0.7 ? variant : 'roll';
  return makeEquip(def.id, { rng, rarity, variant: own });
}

// `level` and `jobs` (the job path, first job on) pick them instead of rolling. `life` ('keen' or
// 'casual') picks how much they're into life skills (world/botlife.js; rolled otherwise).
export function makeBotCharacter(rng = Math.random, { pro = rng() < PRO_RATE, name, level = rollLevel(pro, rng), jobs = null, life = null } = {}) {
  const char = createCharacter(name, makeLook(rng));
  while (char.level < Math.min(level, MAX_LEVEL)) gainExp(char, expToNext(char.level));
  for (const job of jobs ?? jobPath(char.level, rng)) {
    if (job === 'novice') continue;
    // Anyone past a job's trial has passed it.
    if (JOBS[job].trial) char.quests[JOBS[job].trial] = { state: 'done', kills: {} };
    advanceJob(char, job);
  }
  let r = rng();
  const build = BUILDS.find((b) => (r -= b.weight) < 0)?.id ?? 'standard';
  spendBuild(char, build, rng);
  // An outfit color: some go plain, most pick a color, and top players love Gilded and Dark.
  const variant = pro ? pick(['gilded', 'dark', 'dark', 'white', 'crimson', null], rng) : pick([null, null, 'dark', 'white', 'crimson', 'azure', 'gilded'], rng);
  for (const slot of EQUIP_SLOTS) {
    if (!pro && slot !== 'weapon' && rng() < (char.level < 15 ? 0.35 : 0.1)) continue;
    char.equipment[slot] = gearFor(char, slot, pro, rng, variant);
  }
  // Some players dress up in cash outfits (top players most of all), often in one color.
  if (rng() < (pro ? 0.75 : 0.3)) {
    const color = pick([null, 'dark', 'white', 'crimson', 'azure', 'gilded'], rng);
    const count = 1 + Math.floor(rng() * (pro ? 6 : 3));
    for (let i = 0; i < count; i++) {
      const def = ITEMS[pick(CASH_ITEMS, rng)];
      char.outfit[def.slot] = makeCash(def.id, def.slot === 'earring' ? null : color);
    }
  }
  // Plenty of players past level 15 wear pieces of a gear set (the top ones the whole thing).
  const family = JOBS[char.job].family;
  const sets = Object.entries(SETS).filter(([, set]) => set.level <= char.level);
  if (GEAR_FAMILIES.includes(family) && sets.length && rng() < (pro ? 0.8 : 0.4)) {
    const [key] = rng() < 0.6 ? sets.sort((a, b) => b[1].level - a[1].level)[0] : pick(sets, rng);
    const n = pro || rng() < 0.45 ? 4 : 2 + Math.floor(rng() * 2);
    for (const slot of [...SET_SLOTS].sort(() => rng() - 0.5).slice(0, n)) char.equipment[slot] = makeEquip(setPieceId(key, family, slot), { rng, rarity: rollRarity(rng) });
  }
  // Life skill levels of their own (a few keen ones, most casual).
  rollLife(char, life);
  const s = computeStats(char);
  char.hp = s.maxHp;
  char.mp = s.maxMp;
  return char;
}

// ---------- Shops ----------

// ---------- Population ----------

// `clock`: the real time by default (tests pin it).
// `alts`: the other heroes in your save file, who walk the towns as themselves (see addAlts).
export function createBots(world, rng = Math.random, { clock = () => new Date(), daily = false, alts = [] } = {}) {
  const bots = { daily, list: [], names: new Set(), memory: new Set(), spawnIn: 6, waveIn: between(70, 140, rng), newsIn: between(40, 90, rng), replies: [], rng, clock };
  // Your friends' names are theirs: nobody else turns up with them.
  for (const b of buddiesOf(world.char)) bots.names.add(b.name.toLowerCase());
  // (And so are the players who remember you: world/botmemory.js.)
  for (const n of rememberedNames(world.char)) bots.names.add(n.toLowerCase());
  // (Saves from when there were rivals drop theirs.)
  delete world.char.rival;
  // (Saves from before the cleanup drop their regulars, photos and fake guild.)
  delete world.char.regulars;
  delete world.char.photos;
  delete world.char.guild;
  // Everyone's already around when you log in.
  const total = onlineNow(bots);
  for (let i = 0; i < total; i++) spawn(bots, world, { quiet: true });
  addAlts(bots, world, alts);
  return bots;
}

// Your other heroes in this world are out and about too, as they were when you last played them:
// their own look, gear, job and level, in the town they were last in (or one that suits their
// level), with "Your hero" under their name. They stay all session. (A copy of each, without the
// world's shared island and book, so nothing they do touches yours.)
export function addAlts(bots, world, alts) {
  for (const a of alts) {
    if (!a || bots.names.has(a.name.toLowerCase())) continue;
    const char = structuredClone({ ...a, home: null, book: null });
    const at = MAPS[a.mapId]?.isTown && BOT_TOWNS.includes(a.mapId) ? { map: a.mapId } : null;
    const bot = spawn(bots, world, { quiet: true, who: { name: a.name, char, guild: null, style: makeStyle(bots.rng) }, at });
    if (!bot) continue;
    bot.alt = true;
    bot.title = 'Your hero';
    bot.session = Infinity;
  }
}

// A town for a player of this level: usually one whose band fits them (the emptier, the likelier),
// sometimes anywhere, as people do.
function townFor(bots, level, not = null) {
  const rng = bots.rng;
  const counts = townCounts(bots);
  const open = BOT_TOWNS.filter((t) => t !== not && counts[t] < capOf(t));
  if (!open.length) return null;
  const fits = open.filter((t) => level >= TOWN_LEVELS[t][0] && level <= TOWN_LEVELS[t][1]);
  const pool = fits.length && rng() < 0.9 ? fits : open;
  // Weighted toward the town with fewer people so nowhere piles up.
  const weights = pool.map((t) => (PULL[t] ?? 1) / (1 + counts[t]));
  let r = rng() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) if ((r -= weights[i]) <= 0) return pool[i];
  return pool[pool.length - 1];
}

function townCounts(bots) {
  const counts = Object.fromEntries(BOT_TOWNS.map((t) => [t, 0]));
  // (Special visitors, the merchant, a GM, don't take anyone's place.)
  for (const b of bots.list) if (!b.party && !b.hunter && !b.merchant && !b.gm && counts[b.map] != null) counts[b.map]++;
  return counts;
}

function freeX(map, bots, rng) {
  for (let i = 0; i < 20; i++) {
    const x = between(...spanOf(map), rng);
    const clear = !map.npcs.some((n) => Math.abs(n.x - x) < 60) && !map.portals.some((p) => Math.abs(p.x - x) < 60)
      && Math.abs((map.plaza ?? -999) - x) > 50 && !bots.list.some((b) => b.map === map.id && Math.abs(b.x - x) < 50);
    if (clear) return x;
  }
  return between(...spanOf(map), rng);
}

// `who` logs in someone you know (a friend) as they are; now and then in the town you're in
// (always, with `here`). `at` ({ map, x }) puts them somewhere in particular (a GM hiding).
function spawn(bots, world, { quiet = false, who = null, here = false, at = null } = {}) {
  const rng = bots.rng;
  const name = who?.name ?? makeName(bots.names, rng);
  bots.names.add(name.toLowerCase());
  const char = who?.char ?? makeBotCharacter(rng, { name });
  // (Someone you know always gets in, even with every town at its usual crowd.)
  const town = at?.map ?? (who && world.map.isTown && !world.map.private && (here || rng() < 0.5) ? world.map.id : townFor(bots, char.level) ?? (who ? pick(TOWNS, rng) : null));
  if (!town) return null;
  const map = MAPS[town];
  const bot = {
    id: `bot${bots.names.size}-${Math.floor(rng() * 1e6)}`, name, char, level: char.level, pro: char.level >= MAX_LEVEL,
    guild: who ? who.guild : rng() < 0.4 ? pick(GUILDS, rng) : null, style: who?.style ?? makeStyle(rng), title: null,
    map: town, x: freeX(map, bots, rng), facing: rng() < 0.5 ? 1 : -1, state: 'idle', timer: between(1, 4, rng),
    session: between(150, 480, rng), stay: between(70, 200, rng), nextLine: between(4, 30, rng), bubble: null,
    waved: false, shop: null, appear: quiet ? 0 : 1,
  };
  if (at?.x != null) bot.x = at.x;
  bots.list.push(bot);
  return bot;
}

// Dresses a player for a festival: their outfit (or a piece of one) in its colour.
function dress(bot, color) {
  const rng = Math.random;
  const outfit = (bot.char.outfit ??= {});
  if (!Object.keys(outfit).length) {
    const def = ITEMS[pick(CASH_ITEMS, rng)];
    outfit[def.slot] = makeCash(def.id, def.slot === 'earring' ? null : color);
    return;
  }
  for (const [slot, inst] of Object.entries(outfit)) if (inst && slot !== 'earring') outfit[slot] = makeCash(inst.id, color);
}


// What world/buddies.js needs to bring people in.
function hooksFor(bots, world) {
  return {
    logIn: (who, { here = false, map = null, x = null } = {}) => spawn(bots, world, { who, here, at: map ? { map, x } : null }),
    map: (id) => MAPS[id],
    now: () => bots.clock().getTime(),
    towns: () => TOWNS,
    townLevels: (id) => TOWN_LEVELS[id] ?? [1, 99],
    dress,
    travel: (b, town) => {
      goToPortal(b, MAPS[b.map], 'travel');
      b.dest = town;
    },
    equipFor: (def) => {
      const inst = makeEquip(def.id, { rng: bots.rng, rarity: 1, variant: 'roll' });
      return { inst, id: def.id, qty: 1, price: Math.max(100, Math.round(def.price * 0.7 / 10) * 10) };
    },
    say: (b, text) => say(world, b, text),
    shout: (b, text) => shout(b, bots, world, text),
    addHunter: (who) => (huntable(world) ? addHunter(bots, world, true, who) : null),
    makeChar: makeBotCharacter,
    makeName: () => makeName(bots.names, bots.rng),
    makeStyle: () => makeStyle(bots.rng),
  };
}

// A player the group finder brings in: a level and job path to order, appearing right next to
// you. They aren't in your party until joined.
export function recruitBot(bots, world, { level, jobs }) {
  const rng = bots.rng;
  const name = makeName(bots.names, rng);
  const char = makeBotCharacter(rng, { name, pro: false, level, jobs });
  const bot = {
    id: `bot${bots.names.size}-${Math.floor(rng() * 1e6)}`, name, char, level: char.level, pro: false,
    guild: rng() < 0.4 ? pick(GUILDS, rng) : null, style: makeStyle(rng),
    map: world.map.id, x: world.body.x - 40 - rng() * 40, facing: 1, state: 'idle', timer: 2,
    session: 1800, stay: 600, nextLine: between(20, 50, rng), bubble: null, waved: true, shop: null, appear: 1,
  };
  bots.list.push(bot);
  return bot;
}

// Over their head, through the chat gate (world/chatlog.js): never a line said in the last ten
// minutes. `important` for an answer to you.
function say(world, bot, text, important = false) {
  if (text) sayOver(world, bot, text, { important });
}

// Advances everyone: comings and goings, walking, chatting, and the occasional wave.
export function updateBots(bots, world, dt) {
  if (!bots) return;
  bots.clock ??= () => new Date();
  const rng = bots.rng;
  const here = world.map.id;
  // Logins: right away if the server dips under its minimum, otherwise now and then up to the usual
  // number.
  bots.spawnIn -= dt;
  const online = bots.list.length;
  const total = onlineNow(bots);
  if (online < total - 2 || (bots.spawnIn <= 0 && online < total)) {
    bots.spawnIn = between(12, 30, rng);
    spawn(bots, world);
  }
  const crowd = Math.max(1, botsIn(bots, here).length / 3);
  const ctx = { player: world.char.name };
  for (const bot of bots.list) {
    bot.session -= dt;
    bot.stay -= dt;
    if (bot.bubble && (bot.bubble.t -= dt) <= 0) bot.bubble = null;
    if (bot.emote && (bot.emote.t += dt) >= bot.emote.dur) bot.emote = null;
    // Party members follow you instead (see party.js), and hunters fight (huntersHere).
    if (bot.party || bot.hunter) continue;
    if (bot.appear > 0) bot.appear = Math.max(0, bot.appear - dt * 1.5);
    if (bot.state === 'transit') {
      bot.timer -= dt;
      if (bot.timer <= 0) arrive(bot, bots, world);
      continue;
    }
    const map = MAPS[bot.map];
    if (bot.map !== here) {
      // Off screen, only the comings and goings matter.
      if (bot.session <= 0) bot.gone = true;
      else if (bot.stay <= 0) depart(bot, bots);
      continue;
    }
    // Leaving: log out with a sparkle, or walk out through a portal to another town.
    if (bot.session <= 0 && !['leave', 'logout'].includes(bot.state)) {
      if (rng() < 0.5) goToPortal(bot, map, 'logout');
      else {
        bot.state = 'logout';
        bot.timer = 0.6;
        if (rng() < 0.6) say(world, bot, speak(bots.memory, 'bye', ctx, bot.style, rng) ?? 'bye');
      }
    } else if (bot.stay <= 0 && !['leave', 'logout', 'approach', 'wave', 'duel', 'watch', 'meet', 'follow', 'afk', 'event', 'dummy', 'hide', 'life'].includes(bot.state)) {
      goToPortal(bot, map, 'travel');
    }
    behave(bot, bots, world, map, dt);
    // Chat, at a relaxed pace (not while in a chat of their own).
    bot.nextLine -= dt;
    if (bot.nextLine <= 0 && !bot.bubble && !bot.afk && !['logout', 'leave', 'chat', 'chatwait'].includes(bot.state)) {
      // The busier the town, the less each person talks, so chat stays readable.
      bot.nextLine = (bot.shop ? between(60, 120, rng) : between(70, 160, rng)) * crowd;
      // (Now and then, something about the time: a night owl, a kid home from school.)
      const line = rng() < 0.12 ? timeLine(serverTime(bots.clock()), rng) : talk(bot, bots, world, rng);
      botChat(world, bot, line);
    }
  }
  // Now and then someone comes over to say hi. Never often, and each player only once.
  bots.waveIn -= dt;
  if (bots.waveIn <= 0) {
    bots.waveIn = 25;
    const b = world.body;
    if (world.map.isTown && b.onGround && !world.dead) {
      const near = bots.list.filter((x) => x.map === here && !x.waved && !x.shop && !x.party && !x.life && ['idle', 'walk'].includes(x.state) && Math.abs(x.x - b.x) < 300);
      if (near.length) {
        const bot = pick(near, rng);
        bot.state = 'approach';
        bot.waved = true;
        bots.waveIn = between(160, 320, rng);
      }
    }
  }
  updateParty(bots, world, dt);
  huntersHere(bots, world, dt);
  updateBuddies(bots, world, dt, hooksFor(bots, world));
  updateRaids(bots, world);
  updateDrama(bots, world, dt, hooksFor(bots, world));
  updateEvents(bots, world, dt, hooksFor(bots, world));
  updateLives(bots, world, dt, hooksFor(bots, world));
  updateSocial(bots, world, dt);
  updateSouls(bots, world, dt);
  updateMemory(bots, world, dt, hooksFor(bots, world));
  world.onLoot = (inst) => luckyDrop(bots, world, inst);
  listen(bots, world);
  deliverReplies(bots, world);
  news(bots, world, dt);
  for (const b of bots.list) if (b.gone) {
    endChat(b);
    if (b.buddy && !b.hunter && !b.party && !b.quietGone) world.log?.(`[Friend] ${b.name} logged off.`, '#9c86b8');
  }
  bots.list = bots.list.filter((b) => !b.gone);
  // Whoever just logged out is replaced, so the server never dips under its minimum.
  for (let i = 0; i < 4 && bots.list.length < total - 2; i++) spawn(bots, world);
}

function goToPortal(bot, map, why) {
  const portals = waysOf(map);
  if (!portals.length) {
    bot.gone = why === 'logout';
    return;
  }
  const p = portals.reduce((a, c) => (Math.abs(c.x - bot.x) < Math.abs(a.x - bot.x) ? c : a));
  endChat(bot);
  stopTown(bot, map);
  bot.state = 'leave';
  bot.target = p.x;
  bot.why = why;
  bot.shop = null;
}

function depart(bot, bots) {
  const rng = bots.rng;
  bot.shop = null;
  if (rng() < 0.45) {
    bot.state = 'transit';
    bot.timer = between(15, 45, rng);
    bot.from = bot.map;
    bot.map = null;
  } else {
    bot.stay = between(60, 180, rng);
  }
}

function arrive(bot, bots, world) {
  const rng = bots.rng;
  // (Off to somewhere in particular: the wandering merchant's town.)
  const town = bot.session > 0 ? (bot.dest && townCounts(bots)[bot.dest] < capOf(bot.dest) ? bot.dest : townFor(bots, bot.level, bot.from)) : null;
  bot.dest = null;
  if (!town) {
    bot.gone = true;
    return;
  }
  const map = MAPS[town];
  bot.map = town;
  bot.stay = between(70, 200, rng);
  bot.waved = bot.waved && rng() < 0.7;
  // Walk in through a portal if you're there to see it.
  const portal = pick(waysOf(map), rng);
  if (town === world.map.id && portal) {
    bot.x = portal.x;
    bot.state = 'walk';
    bot.target = freeX(map, bots, rng);
  } else {
    bot.x = freeX(map, bots, rng);
    bot.state = 'idle';
    bot.timer = between(1, 3, rng);
  }
}

function behave(bot, bots, world, map, dt) {
  const rng = bots.rng;
  // (Eased in and out, with a pause now and then to look around: world/botsoul.js.)
  const walkTo = (target) => {
    const d = target - bot.x;
    if (!bot.pause) bot.facing = Math.sign(d) || bot.facing;
    const step = Math.min(Math.abs(d), walkSpeed(bot, d, dt, WALK, world.now) * dt);
    bot.x += Math.sign(d) * step;
    if (Math.abs(d) <= 1) bot.speed = 0;
    return Math.abs(d) <= 1;
  };
  // (Called away from the stove or bench by something else: a wave, a chat, a duel.)
  if (bot.life && !['life', 'walk'].includes(bot.state)) stopTown(bot, map);
  switch (bot.state) {
    case 'life':
      if (!tickTownLife(bot, bots, world, map, dt)) {
        stopTown(bot, map);
        bot.state = 'idle';
        bot.timer = between(2, 6, rng);
      }
      break;
    case 'shop':
      bot.facing = world.body.x < bot.x ? -1 : 1;
      break;
    case 'idle':
      bot.timer -= dt;
      if (bot.timer <= 0 && !pastime(bot, bots, world, map)) {
        bot.state = 'walk';
        bot.target = Math.max(spanOf(map)[0] - 20, Math.min(spanOf(map)[1] + 20, bot.x + between(-260, 260, rng)));
      }
      break;
    case 'walk':
      if (walkTo(bot.target)) {
        const then = bot.then;
        bot.then = null;
        bot.state = 'idle';
        bot.timer = between(2, 8, rng);
        then?.();
      }
      break;
    case 'chatwait':
      bot.timer -= dt;
      if (bot.timer <= 0 || !bot.chatWith || bot.chatWith.gone) endChat(bot);
      break;
    case 'chat':
      tickChat(bot, bots, world, dt);
      break;
    case 'leave':
      if (walkTo(bot.target)) {
        if (bot.why === 'logout') bot.gone = true;
        else {
          bot.state = 'transit';
          bot.timer = between(15, 45, rng);
          bot.from = bot.map;
          bot.map = null;
        }
      }
      break;
    case 'logout':
      bot.timer -= dt;
      if (bot.timer <= 0) bot.gone = true;
      break;
    case 'approach': {
      const px = world.body.x;
      const side = bot.x < px ? -1 : 1;
      if (walkTo(px + side * 44) || Math.abs(bot.x - px) < 46) {
        bot.facing = px < bot.x ? -1 : 1;
        bot.state = 'wave';
        bot.timer = 1.6;
        botChat(world, bot, bot.hello ?? speak(bots.memory, 'greet', { player: world.char.name }, bot.style, rng) ?? 'hi!', { important: true });
        bot.hello = null;
      }
      break;
    }
    case 'wave':
      bot.facing = world.body.x < bot.x ? -1 : 1;
      bot.timer -= dt;
      if (bot.timer <= 0) {
        bot.state = 'idle';
        bot.timer = between(3, 6, rng);
      }
      break;
  }
}

// ---------- Town life ----------

// Something to do instead of a stroll: go chat with someone, or a little emote. Returns whether they took one up.
function pastime(bot, bots, world, map) {
  const rng = bots.rng;
  const r = rng();
  const here = botsIn(bots, map.id);
  // Now and then: the stove, the craft bench, the town's own spot or its fishing nook.
  // (At Lantern Lagoon, the anglers are mostly there for its fishing.)
  if (r < (map.id === 'lagoon' ? 0.6 : 0.16) && townPastime(bot, bots, world, map)) return true;
  if (r < 0.5 && !wantsToGreet(bots, world, bot)) {
    // (Not round the stove or the bench: that's where people work.)
    const atWork = (x) => [map.stove, map.bench].some((w) => w != null && Math.abs(w - x) < 50);
    const mate = here.find((b) => b !== bot && b.state === 'idle' && !b.shop && Math.abs(b.x - bot.x) < 420 && Math.abs(b.x - world.body.x) > 30 && !atWork(b.x) && !wantsToGreet(bots, world, b) && (!b.crew || b.crew === bot.crew));
    if (mate) {
      mate.state = 'chatwait';
      mate.timer = 12;
      mate.chatWith = bot;
      bot.chatWith = mate;
      bot.state = 'walk';
      bot.target = mate.x + (bot.x < mate.x ? -30 : 30);
      bot.then = () => startChat(bot, mate, bots, world);
      return true;
    }
  }
  if (r < 0.65) {
    // (The emote fits their mood: world/botsoul.js.)
    const pose = moodEmote(bot, rng);
    bot.emote = { pose, t: 0, dur: pose === 'showoff' ? 1.3 : pose === 'lookaround' ? 1.4 : 1.2 };
    bot.timer = between(3, 7, rng);
    return true;
  }
  return false;
}

function startChat(bot, mate, bots, world) {
  if (mate.gone || mate.state !== 'chatwait' || mate.chatWith !== bot) {
    endChat(bot);
    return;
  }
  const lines = conversation(contextOf(bot, bots, world), bots.rng);
  // (Something just said by someone else isn't how a chat starts.)
  if (stale(world, lines[0])) {
    endChat(bot);
    return;
  }
  bot.facing = mate.x > bot.x ? 1 : -1;
  mate.facing = -bot.facing;
  bot.state = 'chat';
  mate.state = 'chat';
  // (Players who chat get to be friends now and then: world/botsoul.js.)
  if (soulRng(bots)() < 0.3) befriend(bots, bot, mate);
  bot.convo = { lines, i: 0, at: 0.4, lead: true };
  mate.convo = null;
}

// The two take turns: each line from the one whose turn it is, a few seconds apart.
function tickChat(bot, bots, world, dt) {
  const c = bot.convo;
  const mate = bot.chatWith;
  if (!mate || mate.gone) return endChat(bot);
  if (!c) return;
  c.at -= dt;
  if (c.at > 0) return;
  if (c.i >= c.lines.length) {
    if (bots.rng() < 0.5) mate.emote = { pose: 'cheer', t: 0, dur: 1 };
    return endChat(bot);
  }
  const who = c.i % 2 ? mate : bot;
  // (The whole chat plays out; it's in your log when you're standing by them.)
  const near = who.map === world.map.id && Math.abs(who.x - world.body.x) < 350;
  botChat(world, who, c.lines[c.i], { repeat: true, important: near, log: near });
  c.i += 1;
  c.at = between(2.6, 4, bots.rng);
}

function endChat(bot) {
  const mate = bot.chatWith;
  bot.chatWith = null;
  bot.convo = null;
  if (['chat', 'chatwait'].includes(bot.state)) {
    bot.state = 'idle';
    bot.timer = 2 + Math.random() * 4;
  }
  if (mate?.chatWith === bot) endChat(mate);
}

// Something of their own to say, about who they are, where, and what's going on (world/chatter.js).
// Now and then it's their goal or their mood instead, and their mood shows in how they type it.
function talk(bot, bots, world, rng) {
  const own = soulLine(bot, soulRng(bots));
  if (own) return moodVoice(bot, own, soulRng(bots));
  const ctx = contextOf(bot, bots, world);
  return moodVoice(bot, speak(bots.memory, moodFor(bot, rng, ctx), ctx, bot.style, rng), soulRng(bots));
}

// Says a line (and, if you're on their map and chat has room, it shows in the chat log: see
// world/chatlog.js).
function shout(bot, bots, world, line) {
  return botChat(world, bot, line);
}

// ---------- Talking back to you ----------

const HELLO = /\b(hi+|hey+|hello|hiya|yo|howdy|sup|heya|hai|helo|gm|good morning|evening)\b/i;
const THANKS = /\b(ty|thx|thanks|thank you|tysm|tyvm)\b/i;
const LAUGH = /\b(lol|lmao|haha+|hehe+|xd|rofl)\b/i;

// Everyone on your map who could answer, nearest first.
function listeners(bots, world) {
  const b = world.body;
  return bots.list
    .filter((x) => x.map === world.map.id && x.state !== 'transit' && !x.afk && !['logout', 'leave'].includes(x.state) && !x.leaving && (x.party || x.hunter || world.map.isTown))
    .map((x) => ({ x, d: Math.abs((x.body?.x ?? x.x) - b.x) }))
    .sort((a, c) => a.d - c.d)
    .map((e) => e.x);
}

function queueReply(bots, world, bot, text, { pose = null, delay = 0 } = {}) {
  if (!text || bots.replies.some((r) => r.bot === bot)) return;
  bots.replies.push({ bot, text, pose, at: world.now + delay + 1 + bots.rng() * 1.8 + Math.min(2, text.length * 0.035) });
}

function deliverReplies(bots, world) {
  const due = bots.replies.filter((r) => r.at <= world.now);
  bots.replies = bots.replies.filter((r) => r.at > world.now && !r.bot.gone);
  for (const { bot, text, pose } of due) {
    if (bot.gone || bot.map !== world.map.id) continue;
    const bx = bot.body?.x ?? bot.x;
    if (bot.body) bot.body.facing = world.body.x < bx ? -1 : 1;
    else if (bot.state !== 'shop') bot.facing = world.body.x < bx ? -1 : 1;
    // (An answer to you: never held back, though never a repeat either.)
    if (!botChat(world, bot, text, { prefix: bot.party ? '[Party] ' : '', color: bot.party ? '#9fe0b0' : '#e6dcff', important: true })) continue;
    if (pose) {
      if (bot.body) bot.attack ??= { pose, t: 0, dur: 1 };
      else bot.emote = { pose, t: 0, dur: 1.1 };
    }
  }
}

// What you said or did, and who answers it.
function listen(bots, world) {
  const rng = bots.rng;
  const char = world.char;
  const ctx = (bot) => ({ player: char.name, level: bot.level, here: world.map.id, playerLevel: char.level, jobName: JOBS[char.job].name, fishName: world.lastCatch?.fish.name });
  const near = () => listeners(bots, world);
  // Chat and emotes.
  const h = world.heard;
  if (h && h.at > (bots.heardAt ?? -1)) {
    bots.heardAt = h.at;
    const all = near();
    if (all.length) {
      if (h.emote) {
        // (An emote from the party bar is your party's to answer, world/grouping.js: someone else
        // here may, but not a party member a second time.)
        const fromBar = world.now - (world.partyEmoteAt ?? -99) < 0.5;
        const bot = fromBar ? all.find((b) => !b.party) : all[0];
        if (bot && rng() < 0.65) queueReply(bots, world, bot, reply(bots.memory, 'emote', ctx(bot), bot.style, rng), { pose: pick(['cheer', 'flip', 'emdance'], rng) });
      } else {
        const words = h.words.toLowerCase();
        const named = all.find((b) => words.includes(b.name.toLowerCase()));
        const info = answer(h.words, ctx(all[0]));
        const asking = /\?|^(how|where|what|which|who|is|are|does|do|can|any)\b/.test(words);
        if (info && (asking || named)) {
          // The one you named answers, or whoever knows the most (the highest level nearby).
          const bot = named ?? [...all.slice(0, 5)].sort((a, c) => c.level - a.level)[0];
          queueReply(bots, world, bot, voiced(info, ctx(bot), { ...bot.style, typos: false, shout: false, stretch: false }, rng), { delay: 0.6 });
        } else if (named) queueReply(bots, world, named, reply(bots.memory, asking ? 'dunno' : 'name', ctx(named), named.style, rng));
        else if (HELLO.test(words)) {
          for (const bot of all.slice(0, rng() < 0.5 ? 2 : 1)) queueReply(bots, world, bot, reply(bots.memory, 'hi', ctx(bot), bot.style, rng), { pose: rng() < 0.4 ? 'cheer' : null, delay: rng() });
        } else if (asking) {
          if (rng() < 0.55) queueReply(bots, world, all[0], reply(bots.memory, 'dunno', ctx(all[0]), all[0].style, rng));
        } else if (THANKS.test(words)) {
          if (!thanked(bots, world) && rng() < 0.6) queueReply(bots, world, all[0], reply(bots.memory, 'thanks', ctx(all[0]), all[0].style, rng));
        } else if (LAUGH.test(words)) {
          if (rng() < 0.4) queueReply(bots, world, pick(all.slice(0, 3), rng), reply(bots.memory, 'laugh', ctx(all[0]), all[0].style, rng));
        } else if (rng() < 0.28) {
          const bot = pick(all.slice(0, 3), rng);
          queueReply(bots, world, bot, reply(bots.memory, 'chat', ctx(bot), bot.style, rng));
        }
      }
    }
  }
  // Your level ups, a new job, a good catch.
  bots.seenLevel ??= char.level;
  bots.seenJob ??= char.job;
  bots.seenCatch ??= world.lastCatch?.at ?? -1;
  let cheer = null;
  if (char.level > bots.seenLevel) cheer = 'level';
  if (char.job !== bots.seenJob) cheer = 'job';
  if (world.lastCatch && world.lastCatch.at > bots.seenCatch && world.lastCatch.fish.rarity >= 2) cheer = 'catch';
  bots.seenLevel = char.level;
  bots.seenJob = char.job;
  bots.seenCatch = world.lastCatch?.at ?? -1;
  if (cheer) {
    const all = near().slice(0, 6);
    const n = Math.min(all.length, cheer === 'catch' ? 1 + Math.floor(rng() * 2) : 1 + Math.floor(rng() * 3));
    for (const bot of all.sort(() => rng() - 0.5).slice(0, n)) queueReply(bots, world, bot, reply(bots.memory, cheer, ctx(bot), bot.style, rng), { pose: 'cheer', delay: rng() * 2 });
  }
}

// ---------- Hunters on your map ----------

const NO_HUNTERS = new Set(['dawnbeach', 'trainfield', 'dock']);

// The level band of a map's monsters, or null.
function bandOf(map) {
  const lv = (map.spawns ?? []).filter((s) => !MOBS[s.mob].boss).map((s) => MOBS[s.mob].level);
  return lv.length ? [Math.min(...lv), Math.max(...lv)] : null;
}

// (A boss's own room, like the Crystal Throne, is huntable while he's on it: players come to raid.)
function huntable(world) {
  const map = world.map;
  if (map.isTown || map.dungeon || map.trial || world.dungeon || NO_HUNTERS.has(map.id) || (!bandOf(map) && !raidBoss(world))) return false;
  // Online with friends here, the monsters are shared with real players instead.
  return !world.net?.bodies?.(world)?.length;
}

// How many players hunt a map at once: two on a small one, up to five on the biggest.
const huntCap = (map) => Math.max(2, Math.min(5, 1 + Math.floor(map.width / 700)));

// A player hunting here: built to the map's level, on a ledge away from you (walking in through
// a portal when `walkIn`). `who` is someone back from town after dying here, as they were.
function addHunter(bots, world, walkIn = false, who = null, { lifer = false } = {}) {
  const rng = bots.rng;
  const map = world.map;
  const boss = raidBoss(world);
  const band = bandOf(map) ?? (boss ? [Math.max(10, boss.def.level - 6), boss.def.level + 4] : null);
  if (!band) return null;
  const [lo, hi] = band;
  const name = who?.name ?? makeName(bots.names, rng);
  const char = who?.char ?? makeBotCharacter(rng, { name, pro: false, level: Math.max(10, Math.floor(between(lo, hi + 5, rng))) });
  if (char.job === 'novice') return null;
  // A keen life-skiller, out for the map's spots more than its monsters.
  if (lifer && !who) fitLifer(char, map, rng);
  const nav = navOf(map);
  let x;
  let y;
  const portal = walkIn ? pick(map.portals.filter((p) => !p.hidden && !p.dungeon && !p.homestone), rng) : null;
  if (portal) {
    x = portal.x;
    y = portal.y;
  } else {
    for (let i = 0; i < 12; i++) {
      const s = pick(nav.surfaces, rng);
      x = between(Math.max(40, s.x1 + 20), Math.min(map.width - 40, s.x2 - 20), rng);
      y = s.yAt(x);
      if (Math.abs(x - world.body.x) > 260) break;
    }
  }
  const bot = {
    id: `hunter${bots.names.size}-${Math.floor(rng() * 1e6)}`, name, char, level: char.level, pro: false, hunter: true,
    guild: who ? who.guild : rng() < 0.4 ? pick(GUILDS, rng) : null, style: who?.style ?? makeStyle(rng), title: null,
    map: map.id, x, facing: 1, state: 'hunt', body: createBody(x, y),
    session: between(90, 300, rng) * (lifer ? 1.5 : 1), stay: 999, nextLine: between(15, 50, rng), bubble: null, waved: true, shop: null, appear: 1,
    lifer: lifer || Boolean(who?.lifer),
  };
  bots.list.push(bot);
  return bot;
}

// How many life spots a map has (gathering and fishing), for its life-skillers.
const spotsOf = (world) => nodesOf(world).length + (SPOTS[world.map.id] ?? []).length;

function huntersHere(bots, world, dt) {
  const rng = bots.rng;
  const map = world.map;
  // A new map: whoever was hunting the last one stays there (out of sight), and a few are here.
  if (bots.huntMap !== map.id) {
    for (const b of bots.list) if (b.hunter) b.gone = true;
    bots.huntMap = map.id;
    bots.arriveIn = between(30, 80, rng);
    bots.queenSeen = null;
    if (huntable(world)) {
      const cap = huntCap(map);
      // (A boss's own room fills up once the raid gathers.)
      const n = bandOf(map) ? 2 + Math.floor(rng() * (cap - 1)) : 0;
      // (A map with spots to work usually has a life-skiller or two among them.)
      const spots = spotsOf(world);
      const lifers = spots >= 6 ? 1 + (rng() < 0.4 ? 1 : 0) : spots >= 3 && rng() < 0.7 ? 1 : 0;
      for (let i = 0; i < n; i++) addHunter(bots, world, false, null, { lifer: i < Math.min(lifers, n - 1) });
      // (Often two or three of them came together: a group of their own, hunting side by side.)
      const free = bots.list.filter((b) => b.hunter && !b.gone && !b.lifer && b.body);
      if (free.length >= 2 && soulRng(bots)() < 0.6) arriveTogether(bots, free.slice(0, free.length >= 3 && soulRng(bots)() < 0.35 ? 3 : 2));
    }
  }
  const hunters = bots.list.filter((b) => b.hunter && !b.gone);
  if (!huntable(world)) {
    for (const b of hunters) b.gone = true;
    return;
  }
  world.onStrangerKill = (id, m) => {
    const bot = hunters.find((b) => b.id === id);
    if (bot) bot.kills = (bot.kills ?? 0) + 1;
    // (Now and then, about what they just took down.)
    if (bot && m && !bot.bubble && rng() < 0.03) {
      const n = m.def.name;
      shout(bot, bots, world, pick([`another ${n} down`, `${bot.kills} ${n}s so far`, `${n}s go down so fast now`, `that ${n} almost got me`, `${n}s give good exp here`], rng));
    }
  };
  // A boss here (a queen back for a rematch, the Crystal King on his throne): word gets around,
  // and people come running for the raid (world/raids.js).
  const queen = raidBoss(world);
  if (queen && bots.queenSeen !== queen) {
    bots.queenSeen = queen;
    gather(bots, world, queen, hooksFor(bots, world));
  }
  // At night, someone points you at the map's night-only find (a look every few seconds).
  bots.tipIn = (bots.tipIn ?? 4) - dt;
  if (bots.tipIn <= 0) {
    bots.tipIn = 5;
    nightTip(bots, world, hunters, rng);
  }
  if (world.botPops?.length) world.botPops = world.botPops.filter((p) => world.now - p.at < 1);
  // Now and then someone walks in.
  bots.arriveIn -= dt;
  const cap = huntCap(map) + (queen ? 2 : 0);
  if (bots.arriveIn <= 0) {
    bots.arriveIn = between(30, 80, rng);
    const lifers = hunters.filter((b) => b.lifer).length;
    if (hunters.length < cap) {
      const first = addHunter(bots, world, true, null, { lifer: spotsOf(world) >= 3 && lifers < 2 && rng() < 0.3 });
      // (Now and then with a friend in tow.)
      if (first && !first.lifer && hunters.length + 1 < cap && soulRng(bots)() < 0.3) {
        const mate = addHunter(bots, world, true);
        if (mate) arriveTogether(bots, [first, mate]);
      }
    }
  }
  // Someone who died here logs back in after a while and comes back for more.
  bots.returns = (bots.returns ?? []).filter((r) => world.now - r.at < 600);
  const back = bots.returns.find((r) => r.map === map.id && world.now >= r.at);
  if (back && hunters.length < cap + 1) {
    bots.returns = bots.returns.filter((r) => r !== back);
    const b = addHunter(bots, world, true, back.who);
    if (b) {
      b.appear = 1;
      sayOneOf(world, b, ['ok im back', 'round 2', 'bought 50 pots this time', 'that was so embarrassing', 'i have returned', 'revenge time'], rng);
    }
  }
  for (const bot of hunters) {
    if (bot.appear > 0) bot.appear = Math.max(0, bot.appear - dt * 1.5);
    // Done for the day: log out with a sparkle, or walk off through a portal.
    if (bot.session <= 0 && !bot.leaving && bot.state !== 'logout') {
      const nav = navOf(map);
      const p = rng() < 0.5 ? null : map.portals.filter((q) => !q.hidden && !q.dungeon).sort((a, c) => Math.abs(a.x - bot.body.x) - Math.abs(c.x - bot.body.x))[0];
      if (p) bot.leaving = { x: p.x, y: p.y, mode: 'leave', surface: surfaceBelow(nav, p.x, p.y - 4) };
      else {
        bot.state = 'logout';
        bot.timer = 0.6;
        if (rng() < 0.5) say(world, bot, speak(bots.memory, 'bye', {}, bot.style, rng) ?? 'bye');
      }
    }
    // Died here: a few seconds under the tombstone, then back to town (and back here later).
    if (fieldDownOver(bot, world) && bot.state !== 'logout') {
      bot.state = 'logout';
      bot.timer = 0.6;
      if (rng() < 0.5) sayOneOf(world, bot, ['brb', 'back to town...', 'ugh', 'this map is cursed'], rng);
      const char = bot.char;
      char.hp = computeStats(char).maxHp;
      bot.life = null;
      bots.returns = [...(bots.returns ?? []), { at: world.now + between(40, 100, rng), map: map.id, who: { name: bot.name, char, guild: bot.guild, style: bot.style, title: bot.title, lifer: bot.lifer } }];
    }
    if (bot.state === 'logout') {
      bot.timer -= dt;
      if (bot.timer <= 0) bot.gone = true;
      continue;
    }
    if (bot.leaving && Math.abs(bot.body.x - bot.leaving.x) < 12 && Math.abs(bot.body.y - bot.leaving.y) < 30) {
      bot.gone = true;
      continue;
    }
    // Now and then a life spot on the way (and a life-skiller's whole loop): world/botlife.js.
    fieldLife(bot, world, dt, rng);
    tickHunter(bot, world, hunters, dt, rng);
    fieldLifeAfter(bot, rng);
    bot.nextLine -= dt;
    if (bot.nextLine <= 0 && !bot.bubble) {
      bot.nextLine = between(90, 200, rng);
      const line = (queen ? pick(isQueen(queen) ? ['shes so strong', 'focus the queen!', 'keep going!', 'her moves are so pretty tho', 'almost there!!'] : ['hes so tanky', 'focus the boss!', 'keep going!', 'almost there!!', 'my pots are running low'], rng) : talk(bot, bots, world, rng));
      if (line) shout(bot, bots, world, line);
    }
  }
}

// ---------- Server news ----------

function news(bots, world, dt) {
  const rng = bots.rng;
  bots.newsIn -= dt;
  if (bots.newsIn > 0) return;
  bots.newsIn = between(80, 170, rng);
  const who = pick(bots.list.filter((b) => !b.party && !b.gone), rng);
  if (!who) return;
  const queens = ['Sylvana', 'Tamamo', 'Lilith', 'Selene'];
  const rare = FISH.filter((f) => f.rarity >= 3);
  const kinds = [
    () => {
      const f = pick(rare, rng);
      return `${who.name} caught a ${f.name}!`;
    },
    () => (who.level >= 20 ? `${who.name} reached level ${who.level}!` : null),
    () => (who.level >= 30 && who.char.job !== 'novice' ? `${who.name} became a ${JOBS[who.char.job].name}!` : null),
    () => {
      // (A dungeon their level runs, so the news names every one of them.)
      const d = dungeonForLevel(who.level - 2, rng);
      return d ? `${who.name}'s group cleared ${d.name}${who.level >= d.minLevel + 4 && rng() < 0.4 ? ' on Hard' : ''}!` : null;
    },
    () => (who.level >= 20 ? `${who.name} passed ${pick(queens, rng)}'s trial!` : null),
    () => (who.level >= 25 ? `${who.name} polished their gear to +10!` : null),
    () => (who.level >= 20 ? `${who.name} completed the ${pick(Object.values(SETS), rng).name} set!` : null),
    () => `${who.name} mastered the ${pick(Object.values(MOBS).filter((m) => !m.boss), rng).name} card!`,
  ];
  let line = null;
  for (let i = 0; i < 6 && !line; i++) line = pick(kinds, rng)();
  if (!line) return;
  world.log?.(`★ ${line}`, '#ffd6f0');
  // Someone around says well done.
  const all = listeners(bots, world).filter((b) => b !== who);
  if (all.length && rng() < 0.45) {
    const bot = pick(all.slice(0, 4), rng);
    queueReply(bots, world, bot, pick([`grats ${who.name}!!`, `gz ${who.name}`, `omg grats ${who.name}`, `${who.name} so lucky`, 'gratz!!', `ooh grats`], rng), { delay: 1.5 });
  }
}

// Buying from a player's shop. Returns a message for the log.
export function buyFromShop(bot, index, char, addItem) {
  const entry = bot.shop?.items[index];
  if (!entry) return null;
  if (char.gold < entry.price) return { ok: false, text: 'Not enough gold.' };
  const ok = entry.inst ? addItem(char.inventory, entry.inst) : addItem(char.inventory, entry.id, entry.qty);
  if (!ok) return { ok: false, text: 'Your bag is full.' };
  char.gold -= entry.price;
  bot.shop.items.splice(index, 1);
  bot.char.gold += entry.price;
  const name = itemName(entry.inst ?? entry.id);
  // (They remember who bought from them: world/botmemory.js.)
  remember(char, bot, 'trade', name, bot.map);
  if (!bot.shop.items.length) {
    bot.shop = null;
    bot.state = 'idle';
    bot.timer = 2;
  }
  return { ok: true, text: `Bought ${name}${entry.qty > 1 ? ` x${entry.qty}` : ''} from ${bot.name} for ${priceText(entry.price)} gold.` };
}

export function thank(bots, bot, world) {
  const line = speak(bots.memory, 'thanks', { player: world.char.name }, bot.style, bots.rng);
  if (line) say(world, bot, line, true);
}

// The players standing in a map right now (for drawing and clicking).
export function botsIn(bots, mapId) {
  return bots ? bots.list.filter((b) => b.map === mapId && b.state !== 'transit' && !b.party && !b.hunter) : [];
}

// Everyone on the map with a body of their own (party members and hunters), for drawing and clicks.
export function bodiedIn(bots, mapId) {
  return bots ? bots.list.filter((b) => (b.party || b.hunter) && b.body && b.map === mapId) : [];
}
