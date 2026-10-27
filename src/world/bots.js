// Other "players": generated characters who log in, walk around towns, chat, travel between
// towns, open shops to sell their loot, wave at you now and then, and eventually log out for good.
// Each one is built like a real character (level, job, stat build, rolled gear), so you can click
// them to see their stats and gear. Nobody comes back after logging out, and no name repeats.
//
// About 22 are online (never under 20), spread over the towns by level so each town has a handful.
// This runs alongside the world (main.js calls updateBots), not inside updateWorld, so the game
// rules stay deterministic for tests.

import { createCharacter, gainExp, advanceJob, spendAp, STAT_KEYS } from '../core/character.js';
import { computeStats } from '../core/stats.js';
import { expToNext } from '../core/exp.js';
import { makeEquip, makeCash, rollRarity, variantPrice, itemName } from '../core/items.js';
import { CASH_ITEMS } from '../data/cash.js';
import { ITEMS, EQUIP_SLOTS } from '../data/items.js';
import { JOBS, FAMILY_STATS } from '../data/jobs.js';
import { MAPS, TOWNS } from '../data/maps.js';
import { HAIR_STYLES, PICKABLE_EYE_STYLES, OUTFIT_STYLES, FACE_STYLES, BROW_STYLES } from '../render/hero.js';
import { speak, moodFor, makeStyle, price as priceText } from './chatter.js';
import { updateParty } from './party.js';

const pick = (list, rng = Math.random) => list[Math.floor(rng() * list.length)];
const between = (a, b, rng = Math.random) => a + rng() * (b - a);

const TOTAL = 22; // players online across all towns, counting those between towns
const MIN_ONLINE = 20; // never fewer: someone logging out is soon replaced
const PER_TOWN = 8; // most in one town at once

// Where players of each level hang out, following the hunting grounds around each town: Sprout
// Village for beginners, Ember Crag and Pastel Harbor in the middle, Moonleaf Grove for the
// high-level maps and the Crystal King.
const TOWN_LEVELS = { sprout: [1, 12], crag: [10, 25], harbor: [15, 35], grove: [30, 99] };
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

function rollLevel(pro, rng) {
  if (pro) return Math.floor(between(56, 71, rng));
  const r = rng();
  if (r < 0.3) return Math.floor(between(1, 12, rng));
  if (r < 0.8) return Math.floor(between(12, 40, rng));
  return Math.floor(between(40, 56, rng));
}

// The job path a character of this level would be on. Mages and warriors advance past their
// first job (warriors stop at their level 30 path for now).
function jobPath(level, rng) {
  if (level < 10) return ['novice'];
  const first = pick(['warrior', 'mage', 'archer', 'thief'], rng);
  if (first === 'warrior' && level >= 30) return [first, pick(['paladin', 'berserker'], rng)];
  if (first !== 'mage' || level < 30) return [first];
  const second = pick(['ilwizard', 'fpwizard', 'cleric'], rng);
  if (level < 50) return [first, second];
  return [first, second, { ilwizard: 'ilarchmage', fpwizard: 'fparchmage', cleric: 'bishop' }[second]];
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
function gearFor(char, slot, pro, rng, variant) {
  const job = JOBS[char.job];
  const weapons = job.weapons ?? [];
  const wearable = (d) => !d.legacy && (!d.family || d.family === job.family || (d.starter && char.job === 'novice'));
  let pool = Object.values(ITEMS).filter((d) => d.slot === slot && d.reqLevel <= char.level && wearable(d) && (slot !== 'weapon' || weapons.includes(d.weaponType)));
  if (!pro) pool = pool.filter((d) => !d.endgame);
  else if (slot === 'weapon' && rng() < 0.75 && pool.some((d) => d.endgame)) pool = pool.filter((d) => d.endgame);
  if (!pool.length) return null;
  pool.sort((a, b) => b.reqLevel - a.reqLevel);
  // Uniques show up now and then for flair.
  const uniques = pool.filter((d) => d.unique);
  const def = uniques.length && rng() < 0.2 ? pick(uniques, rng) : pick(pool.slice(0, 2), rng);
  const rarity = pro ? Math.max(2, rollRarity(rng)) : rollRarity(rng);
  const own = def.slot === 'earring' ? 'roll' : rng() < 0.7 ? variant : 'roll';
  return makeEquip(def.id, { variance: 0.12, rng, rarity, variant: own });
}

// `level` and `jobs` (the job path, first job on) pick them instead of rolling.
export function makeBotCharacter(rng = Math.random, { pro = rng() < PRO_RATE, name, level = rollLevel(pro, rng), jobs = null } = {}) {
  const char = createCharacter(name, makeLook(rng));
  while (char.level < level) gainExp(char, expToNext(char.level));
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
  const s = computeStats(char);
  char.hp = s.maxHp;
  char.mp = s.maxMp;
  return char;
}

// ---------- Shops ----------

const SHOP_TITLES = [
  (n) => `${n}'s Shop`, (n) => `${n}'s Bargains`, (n) => `${n}'s Treasures`, () => 'Cheap pots!!', () => 'Loot sale ~', () => 'Everything must go',
  () => 'Rare gear inside', () => '~Cute Shop~', (n) => `${n}'s Loot Pile`, () => 'WTS gear, good prices', () => 'Half price today!', () => 'Mystery bag of stuff',
  (n) => `${n}'s Corner`, () => 'Fresh from the Cave', () => 'Potions & more', () => 'Starter gear here',
];

function makeShop(bot, rng) {
  const char = bot.char;
  const items = [];
  const count = 4 + Math.floor(rng() * 4);
  const drops = Object.values(ITEMS).filter((d) => d.type === 'etc');
  const pots = Object.values(ITEMS).filter((d) => d.type === 'use' && d.effect);
  const gear = Object.values(ITEMS).filter((d) => d.type === 'equip' && !d.endgame && !d.legacy && Math.abs(d.reqLevel - char.level) <= 15);
  for (let i = 0; i < count; i++) {
    const r = rng();
    if (r < 0.45 && gear.length) {
      const def = pick(gear, rng);
      const inst = makeEquip(def.id, { variance: 0.12, rng, rarity: Math.max(rollRarity(rng), rng() < 0.3 ? 1 : 0), variant: 'roll' });
      const cost = Math.round((variantPrice(def, inst.variant) * (1 + inst.rarity * 0.9) * between(0.6, 1.5, rng)) / 10) * 10;
      items.push({ inst, id: def.id, qty: 1, price: Math.max(50, cost) });
    } else if (r < 0.75 && drops.length) {
      const def = pick(drops, rng);
      items.push({ id: def.id, qty: Math.floor(between(5, 40, rng)), price: Math.max(5, Math.round(def.price * between(0.9, 2, rng))) });
    } else {
      const def = pick(pots, rng);
      items.push({ id: def.id, qty: Math.floor(between(10, 80, rng)), price: Math.max(10, Math.round(def.price * between(0.7, 1.1, rng))) });
    }
  }
  // A pro might put up one endgame piece at an eye-watering price.
  if (bot.pro && rng() < 0.6) {
    const eg = Object.values(ITEMS).filter((d) => d.endgame);
    const def = pick(eg, rng);
    items.push({ inst: makeEquip(def.id, { rng, rarity: Math.max(1, rollRarity(rng)) }), id: def.id, qty: 1, price: Math.round(between(400, 1200, rng)) * 1000 });
  }
  // No two open shops share a name.
  let title = pick(SHOP_TITLES, rng)(bot.name).slice(0, 22);
  for (let i = 0; i < 8 && bot.taken?.has(title); i++) title = pick(SHOP_TITLES, rng)(bot.name).slice(0, 22);
  return { title, items };
}

// ---------- Population ----------

export function createBots(world, rng = Math.random) {
  const bots = { list: [], names: new Set(), memory: new Set(), spawnIn: 6, waveIn: between(70, 140, rng), rng };
  // Everyone's already around when you log in.
  for (let i = 0; i < TOTAL; i++) spawn(bots, world, { quiet: true });
  return bots;
}

// A town for a player of this level: usually one whose band fits them (the emptier, the likelier),
// sometimes anywhere, as people do.
function townFor(bots, level, not = null) {
  const rng = bots.rng;
  const counts = townCounts(bots);
  const open = TOWNS.filter((t) => t !== not && counts[t] < PER_TOWN);
  if (!open.length) return null;
  const fits = open.filter((t) => level >= TOWN_LEVELS[t][0] && level <= TOWN_LEVELS[t][1]);
  const pool = fits.length && rng() < 0.9 ? fits : open;
  // Weighted toward the town with fewer people so nowhere piles up.
  const weights = pool.map((t) => 1 / (1 + counts[t]));
  let r = rng() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) if ((r -= weights[i]) <= 0) return pool[i];
  return pool[pool.length - 1];
}

function townCounts(bots) {
  const counts = Object.fromEntries(TOWNS.map((t) => [t, 0]));
  for (const b of bots.list) if (!b.party && counts[b.map] != null) counts[b.map]++;
  return counts;
}

function freeX(map, bots, rng) {
  for (let i = 0; i < 20; i++) {
    const x = between(140, map.width - 140, rng);
    const clear = !map.npcs.some((n) => Math.abs(n.x - x) < 60) && !map.portals.some((p) => Math.abs(p.x - x) < 60)
      && Math.abs((map.plaza ?? -999) - x) > 50 && !bots.list.some((b) => b.map === map.id && Math.abs(b.x - x) < 50);
    if (clear) return x;
  }
  return between(140, map.width - 140, rng);
}

function spawn(bots, world, { quiet = false } = {}) {
  const rng = bots.rng;
  const name = makeName(bots.names, rng);
  const char = makeBotCharacter(rng, { name });
  const town = townFor(bots, char.level);
  if (!town) return null;
  const map = MAPS[town];
  const bot = {
    id: `bot${bots.names.size}-${Math.floor(rng() * 1e6)}`, name, char, level: char.level, pro: char.level >= 56,
    guild: rng() < 0.4 ? pick(GUILDS, rng) : null, style: makeStyle(rng),
    map: town, x: freeX(map, bots, rng), facing: rng() < 0.5 ? 1 : -1, state: 'idle', timer: between(1, 4, rng),
    session: between(150, 480, rng), stay: between(70, 200, rng), nextLine: between(4, 30, rng), bubble: null,
    waved: false, shop: null, appear: quiet ? 0 : 1,
  };
  if (rng() < 0.28) openShop(bot, map, bots);
  bots.list.push(bot);
  return bot;
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

function openShop(bot, map, bots) {
  bot.taken = new Set(bots.list.filter((b) => b.shop).map((b) => b.shop.title));
  bot.shop = makeShop(bot, bots.rng);
  delete bot.taken;
  bot.state = 'shop';
  bot.x = freeX(map, { list: bots.list.filter((b) => b !== bot) }, bots.rng);
}

function say(bot, text) {
  bot.bubble = { text, t: 4.5 };
}

// Advances everyone: comings and goings, walking, chatting, and the occasional wave.
export function updateBots(bots, world, dt) {
  if (!bots) return;
  const rng = bots.rng;
  const here = world.map.id;
  // Logins: right away if the server dips under its minimum, otherwise now and then up to the usual
  // number.
  bots.spawnIn -= dt;
  const online = bots.list.length;
  if (online < MIN_ONLINE || (bots.spawnIn <= 0 && online < TOTAL)) {
    bots.spawnIn = between(12, 30, rng);
    spawn(bots, world);
  }
  const crowd = Math.max(1, botsIn(bots, here).length / 3);
  const ctx = { player: world.char.name };
  for (const bot of bots.list) {
    bot.session -= dt;
    bot.stay -= dt;
    if (bot.bubble && (bot.bubble.t -= dt) <= 0) bot.bubble = null;
    // Party members follow you instead (see party.js).
    if (bot.party) continue;
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
        if (rng() < 0.6) say(bot, speak(bots.memory, 'bye', ctx, bot.style, rng) ?? 'bye');
      }
    } else if (bot.stay <= 0 && !['leave', 'logout', 'approach', 'wave'].includes(bot.state)) {
      goToPortal(bot, map, 'travel');
    }
    behave(bot, bots, world, map, dt);
    // Chat, at a relaxed pace.
    bot.nextLine -= dt;
    if (bot.nextLine <= 0 && !bot.bubble && !['logout', 'leave'].includes(bot.state)) {
      // The busier the town, the less each person talks, so chat stays readable.
      bot.nextLine = (bot.shop ? between(25, 50, rng) : between(30, 75, rng)) * crowd;
      const line = speak(bots.memory, moodFor(bot, rng), ctx, bot.style, rng);
      if (line) {
        say(bot, line);
        world.log?.(`${bot.name}: ${line}`, '#e6dcff');
      }
    }
  }
  // Now and then someone comes over to say hi. Never often, and each player only once.
  bots.waveIn -= dt;
  if (bots.waveIn <= 0) {
    bots.waveIn = 25;
    const b = world.body;
    if (world.map.isTown && b.onGround && !world.dead) {
      const near = bots.list.filter((x) => x.map === here && !x.waved && !x.shop && !x.party && ['idle', 'walk'].includes(x.state) && Math.abs(x.x - b.x) < 300);
      if (near.length) {
        const bot = pick(near, rng);
        bot.state = 'approach';
        bot.waved = true;
        bots.waveIn = between(160, 320, rng);
      }
    }
  }
  updateParty(bots, world, dt);
  bots.list = bots.list.filter((b) => !b.gone);
  // Whoever just logged out is replaced, so the server never dips under its minimum.
  for (let i = 0; i < 4 && bots.list.length < MIN_ONLINE; i++) spawn(bots, world);
}

function goToPortal(bot, map, why) {
  const portals = map.portals.filter((p) => !p.hidden);
  if (!portals.length) {
    bot.gone = why === 'logout';
    return;
  }
  const p = portals.reduce((a, c) => (Math.abs(c.x - bot.x) < Math.abs(a.x - bot.x) ? c : a));
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
  const town = bot.session > 0 ? townFor(bots, bot.level, bot.from) : null;
  if (!town) {
    bot.gone = true;
    return;
  }
  const map = MAPS[town];
  bot.map = town;
  bot.stay = between(70, 200, rng);
  bot.waved = bot.waved && rng() < 0.7;
  // Walk in through a portal if you're there to see it.
  const portal = pick(map.portals.filter((p) => !p.hidden), rng);
  if (town === world.map.id && portal) {
    bot.x = portal.x;
    bot.state = 'walk';
    bot.target = freeX(map, bots, rng);
  } else {
    bot.x = freeX(map, bots, rng);
    bot.state = 'idle';
    bot.timer = between(1, 3, rng);
  }
  if (rng() < 0.25) openShop(bot, map, bots);
}

function behave(bot, bots, world, map, dt) {
  const rng = bots.rng;
  const walkTo = (target) => {
    const d = target - bot.x;
    bot.facing = Math.sign(d) || bot.facing;
    const step = Math.min(Math.abs(d), WALK * dt);
    bot.x += Math.sign(d) * step;
    return Math.abs(d) <= 1;
  };
  switch (bot.state) {
    case 'shop':
      bot.facing = world.body.x < bot.x ? -1 : 1;
      break;
    case 'idle':
      bot.timer -= dt;
      if (bot.timer <= 0) {
        bot.state = 'walk';
        bot.target = Math.max(120, Math.min(map.width - 120, bot.x + between(-260, 260, rng)));
      }
      break;
    case 'walk':
      if (walkTo(bot.target)) {
        bot.state = 'idle';
        bot.timer = between(2, 8, rng);
      }
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
        say(bot, speak(bots.memory, 'greet', { player: world.char.name }, bot.style, rng) ?? 'hi!');
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
  if (!bot.shop.items.length) {
    bot.shop = null;
    bot.state = 'idle';
    bot.timer = 2;
  }
  return { ok: true, text: `Bought ${name}${entry.qty > 1 ? ` x${entry.qty}` : ''} from ${bot.name} for ${priceText(entry.price)} gold.` };
}

export function thank(bots, bot, playerName) {
  const line = speak(bots.memory, 'thanks', { player: playerName }, bot.style, bots.rng);
  if (line) say(bot, line);
}

// The players standing in a map right now (for drawing and clicking).
export function botsIn(bots, mapId) {
  return bots ? bots.list.filter((b) => b.map === mapId && b.state !== 'transit' && !b.party) : [];
}
