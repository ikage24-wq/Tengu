// The other players as people (docs/design/coop.md parts 6 and 7): what each one is working toward,
// how they feel, who they hang out with, and the little things real players do.
//
//   - Goals: each has one, from the game's real data: a set piece they farm (the boss or dungeon that
//     drops it), a level they chase (and the map they grind it on), a craft they're saving
//     materials for, a life-skill level. It moves along as they play (a few numbers ticked every
//     few seconds, on or off your map), they talk about it now and then, and when it's done they
//     say so (a set piece goes on, and they show it off), and pick the next one.
//   - Moods: cheerful, tired, focused or chill. A death tires them, a goal done or a rare find
//     cheers them up, a long session wears them out, a grind focuses them, an idle stretch in town
//     calms them. It shows on their face now and then, in the emotes they pick and in how they type.
//   - Friends and their own parties: players who hang out (a chat in town, a hunt side by side) get
//     to be friends, and friends on the same map team up: in town they walk about together, out on
//     a field they hunt as a group (the others keep close to the leader), talk to each other, and
//     now and then ask you to join them.
//   - Real-player feel: walking eases in and out with a pause now and then to look around and a hop
//     for fun, they go AFK in town (sat down, dozing, an AFK tag), show off new gear with a twirl,
//     change outfits, cheer when a boss falls, and log in and out over the game's day (the server
//     is busiest in the evening).
//
// Everything said goes through the chat gate (world/chatlog.js). Cheap: only the map you're on does
// any moving; elsewhere it's a few numbers every few seconds.

import { MAPS } from '../data/maps.js';
import { MOBS } from '../data/mobs.js';
import { ITEMS, GEAR_FAMILIES } from '../data/items.js';
import { JOBS } from '../data/jobs.js';
import { SETS, SET_SLOTS, setPieceId } from '../data/sets.js';
import { DUNGEONS } from '../data/dungeons.js';
import { RECIPES } from '../data/crafting.js';
import { CASH_ITEMS } from '../data/cash.js';
import { lifeLevel, LIFE_NAMES, LIFE_MAX } from '../core/life.js';
import { gainExp, autoAssignAp } from '../core/character.js';
import { expToNext, MAX_LEVEL } from '../core/exp.js';
import { makeEquip, makeCash } from '../core/items.js';
import { computeStats } from '../core/stats.js';
import { botChat } from './chatlog.js';
import { botLifeExp } from './botlife.js';
import { gameHour } from './daytime.js';
import { navOf, surfaceOf, surfaceBelow } from './nav.js';
import { partyMembers, joinParty, PARTY_MAX, LEVEL_GAP, mayAskAlong, askAlong } from './party.js';

const pick = (list, rng) => list[Math.floor(rng() * list.length)];
const between = (a, b, rng) => a + rng() * (b - a);

export const MOODS = ['cheerful', 'tired', 'focused', 'chill'];

// A random of its own (seeded, so tests repeat), so all of this never shifts the rolls of the rest
// of the bots' lives.
export function soulRng(bots) {
  if (!bots.srng) {
    let n = 2654435761 >>> 0;
    bots.srng = () => {
      n = (n * 1664525 + 1013904223) >>> 0;
      return n / 4294967296;
    };
  }
  return bots.srng;
}

// ---------- Who's online over the day ----------

// How many players are on at a game hour (world/daytime.js: a 24-minute day): busiest at 6pm when
// everyone's home (30), fewest at dawn (22), the usual crowd (26) at noon and midnight; never under
// 22, so never under 20 with a couple between logins.
export function populationAt(date) {
  const h = gameHour(date);
  return Math.round(26 + 4 * Math.cos((2 * Math.PI * (h - 18)) / 24));
}

// ---------- The soul: kept on the character, so it lasts through a death and a log back in ----------

export function soulOf(bot, rng = Math.random) {
  const c = bot.char;
  if (!c.soul) {
    c.soul = { mood: pick(['cheerful', 'chill', 'chill', 'focused'], rng), moodAt: 0, goal: null, online: 0, pace: between(0.85, 1.15, rng), done: [] };
    c.soul.goal = rollGoal(c, rng);
  }
  return c.soul;
}

export function setMood(bot, mood, world) {
  const s = soulOf(bot);
  if (s.mood === mood) return;
  s.mood = mood;
  s.moodAt = world?.now ?? 0;
  // A flash of it on their face.
  bot.moodFace = { face: MOOD_FACE[mood], t: 3 };
}

const MOOD_FACE = { cheerful: 'excited', tired: 'sleepy', focused: 'determined', chill: 'smile' };

// What happened to them: 'died', 'rare' (a rare find), 'goal' (a goal done).
export function moodEvent(bot, what, world) {
  if (what === 'died') setMood(bot, 'tired', world);
  else setMood(bot, 'cheerful', world);
}

// How they type it in their mood: tired is lowercase and trails off, cheerful gets excited.
export function moodVoice(bot, text, rng = Math.random) {
  if (!text || !bot.char?.soul) return text;
  const m = bot.char.soul.mood;
  if (m === 'tired') return `${text.toLowerCase().replace(/!+/g, '').replace(/\s*:D$/, '')}${rng() < 0.4 ? '...' : ''}`;
  if (m === 'cheerful' && rng() < 0.3 && !/[!?]$|:D$|<3$/.test(text)) return `${text}${pick([' :D', '!!', ' ^^'], rng)}`;
  if (m === 'chill' && rng() < 0.2 && !/[!?~]$/.test(text)) return `${text} ~`;
  return text;
}

// The emote they pick in their mood (town pastimes).
export function moodEmote(bot, rng) {
  const m = bot.char?.soul?.mood ?? 'chill';
  const list = { cheerful: ['cheer', 'flip', 'emdance', 'showoff'], tired: ['pray', 'lookaround'], focused: ['roar', 'cheer'], chill: ['emdance', 'pray', 'lookaround'] }[m];
  return pick(list, rng);
}

// ---------- Goals ----------

// The best hunting map for a level, and one of its monsters.
function grindMap(level) {
  let best = null;
  for (const m of Object.values(MAPS)) {
    if (m.isTown || m.dungeon || m.trial || !m.spawns?.length) continue;
    const mobs = m.spawns.map((s) => MOBS[s.mob]).filter((d) => d && !d.boss);
    if (!mobs.length) continue;
    const mid = (Math.min(...mobs.map((d) => d.level)) + Math.max(...mobs.map((d) => d.level))) / 2;
    const score = Math.abs(mid - level - 1);
    if (!best || score < best.score) best = { m, mob: mobs[Math.floor(mobs.length / 2)], score };
  }
  return best;
}

// Who drops a set: a queen or the Crystal King by name, or clearing Rootwood Hollow.
function setSource(key) {
  const dungeon = Object.values(DUNGEONS).find((d) => d.set === key);
  if (dungeon) return dungeon.name;
  return MOBS[key]?.name.split(',')[0] ?? null;
}

// A goal for this character, from the game's own data.
export function rollGoal(char, rng = Math.random, not = null) {
  const options = [];
  const family = JOBS[char.job]?.family;
  const lv = char.level;
  // A set piece: a set for their level that they're missing a piece of.
  if (GEAR_FAMILIES.includes(family)) {
    const sets = Object.entries(SETS).filter(([, s]) => s.level <= lv && s.level >= lv - 16);
    for (const [key, set] of sets) {
      const slot = SET_SLOTS.find((s) => char.equipment[s]?.id !== setPieceId(key, family, s));
      const item = slot && setPieceId(key, family, slot);
      const from = setSource(key);
      if (item && ITEMS[item] && from) options.push(() => ({ kind: 'set', set: key, slot, item, setName: set.name, from, need: 3 + Math.floor(rng() * 5), got: 0 }));
    }
  }
  // A level: the job advancement at 30 when close, or the next level or two, on the map for it.
  if (lv < MAX_LEVEL) {
    const to = lv >= 24 && lv < 30 ? 30 : Math.min(MAX_LEVEL, lv + 1 + (rng() < 0.4 ? 1 : 0));
    const g = grindMap(lv);
    if (g) options.push(() => ({ kind: 'level', to, map: g.m.id, mapName: g.m.name, mob: g.mob.name }));
  }
  // A craft: a recipe they can make, saving up one of its materials.
  const craftLv = lifeLevel(char, 'crafting');
  const recipes = RECIPES.filter((r) => r.level <= craftLv && r.level >= craftLv - 14 && (!r.family || r.family === family) && ITEMS[r.makes] && r.needs);
  if (recipes.length) {
    options.push(() => {
      const r = pick(recipes, rng);
      const [mat, n] = pick(Object.entries(r.needs), rng);
      return ITEMS[mat] ? { kind: 'craft', makes: r.makes, item: ITEMS[r.makes].name, mat, matName: ITEMS[mat].name, n: Math.max(2, n), got: 0 } : null;
    });
  }
  // A life level: their best gathering skill, one up.
  const skill = ['fishing', 'gathering', 'mining'].sort((a, b) => lifeLevel(char, b) - lifeLevel(char, a))[0];
  if (lifeLevel(char, skill) < LIFE_MAX && lifeLevel(char, skill) > 1) options.push(() => ({ kind: 'life', skill, to: lifeLevel(char, skill) + 1 }));
  const fresh = options.map((f) => f()).filter((g) => g && !(not && g.kind === not.kind && (g.item ?? g.to) === (not.item ?? not.to)));
  return fresh.length ? pick(fresh, rng) : null;
}

// How far along they are, 0-1.
export function goalProgress(char, g) {
  if (!g) return 0;
  if (g.kind === 'set') return g.got / g.need;
  if (g.kind === 'craft') return g.got / g.n;
  if (g.kind === 'level') return char.level >= g.to ? 1 : 0.5;
  if (g.kind === 'life') return lifeLevel(char, g.skill) >= g.to ? 1 : 0.5;
  return 0;
}

const isDone = (char, g) => goalProgress(char, g) >= 1;

// EXP a second for someone hunting at this level the way a player does (about 10 kills a minute
// on monsters of their level), so the other players level at the pace you do (core/exp.js).
const HUNT_EXP = new Map();
function huntExp(level) {
  if (!HUNT_EXP.has(level)) {
    const near = Object.values(MOBS).filter((m) => !m.boss && m.exp > 0 && Math.abs(m.level - level) <= 2).map((m) => m.exp).sort((a, b) => a - b);
    HUNT_EXP.set(level, ((near[Math.floor(near.length / 2)] ?? expToNext(level) / 600) * 10) / 60);
  }
  return HUNT_EXP.get(level);
}

// A few seconds of play toward it (`secs`; `busy`: out hunting, so it goes faster).
export function workGoal(bot, secs, rng, { hunting = false } = {}) {
  const s = soulOf(bot, rng);
  const g = s.goal;
  if (!g) return false;
  const c = bot.char;
  const keen = (s.mood === 'focused' ? 1.5 : s.mood === 'tired' ? 0.6 : 1) * (hunting ? 1.6 : 1);
  if (g.kind === 'set' && rng() < 0.006 * secs * keen) g.got += 1;
  if (g.kind === 'craft' && rng() < 0.012 * secs * keen) g.got = Math.min(g.n, g.got + 1 + (rng() < 0.3 ? 1 : 0));
  if (g.kind === 'level' && !bot.party) {
    const before = c.level;
    gainExp(c, Math.ceil(huntExp(c.level) * secs * keen));
    if (c.level > before) {
      autoAssignAp(c);
      bot.level = c.level;
      bot.stats = computeStats(c);
    }
  }
  if (g.kind === 'life' && rng() < 0.015 * secs * keen) botLifeExp(c, g.skill, 1 + Math.floor(lifeLevel(c, g.skill) / 12), 'gather');
  return isDone(c, g);
}

// It's done: the set piece goes on, a line about it, a good mood, and on to the next.
function finishGoal(bot, bots, world, rng) {
  const s = soulOf(bot, rng);
  const g = s.goal;
  const c = bot.char;
  let line = null;
  let show = false;
  if (g.kind === 'set') {
    c.equipment[g.slot] = makeEquip(g.item, { rng, rarity: 1, variant: 'roll' });
    bot.stats = computeStats(c);
    line = pick([`FINALLY got the ${ITEMS[g.item].name}!!`, `${g.from} dropped my ${ITEMS[g.item].name} omg`, `${ITEMS[g.item].name} get!! after ${g.need} tries`], rng);
    show = true;
  } else if (g.kind === 'craft') line = pick([`made my ${g.item}!! saving ${g.matName} paid off`, `${g.item} done, crafting is so worth it`, `got enough ${g.matName}, ${g.item} crafted!`], rng);
  else if (g.kind === 'level') line = g.to === 30 ? pick(['30!! job advancement time', 'level 30 finally, off to advance'], rng) : pick([`lv ${c.level}!! ${g.mapName} grind done`, `ding ${c.level}`, `${c.level} :) ${g.mob}s were good exp`], rng);
  else if (g.kind === 'life') line = pick([`${LIFE_NAMES[g.skill]} ${lifeLevel(c, g.skill)}!`, `finally ${LIFE_NAMES[g.skill].toLowerCase()} lv ${lifeLevel(c, g.skill)}`], rng);
  s.done = [{ kind: g.kind, what: g.item ?? g.to, at: world.now }, ...s.done].slice(0, 4);
  moodEvent(bot, 'goal', world);
  const here = bot.map === world.map.id;
  // (In your log when they're near you or with you; over their head otherwise.)
  const close = here && (bot.party || Math.abs((bot.body?.x ?? bot.x) - world.body.x) < 450);
  if (line && here) botChat(world, bot, moodVoice(bot, line, rng), { prefix: bot.party ? '[Party] ' : '', log: Boolean(close) });
  if (show && here) showOff(bot);
  s.goal = rollGoal(c, rng, g);
}

// A twirl to show something off (town players as an emote, the others as a move of their body).
export function showOff(bot) {
  if (bot.body) bot.attack ??= { pose: 'showoff', t: 0, dur: 1.3 };
  else if (!bot.afk) bot.emote = { pose: 'showoff', t: 0, dur: 1.3 };
}

// What they say about their goal, by its real names.
export function goalLine(bot, rng) {
  const s = bot.char?.soul;
  const g = s?.goal;
  if (!g) return null;
  const c = bot.char;
  if (g.kind === 'set') return pick([`farming ${g.from} for the ${g.setName} ${g.slot}, ${g.got}/${g.need} tries so far`, `still no ${ITEMS[g.item].name}... ${g.from} hates me`, `need the ${g.slot} for my ${g.setName} set`], rng);
  if (g.kind === 'level') return pick([`${g.to - c.level} more level${g.to - c.level === 1 ? '' : 's'} to ${g.to}${g.to === 30 ? ' then job advance' : ''}`, `grinding ${g.mob}s at ${g.mapName} till ${g.to}`, `${g.mapName} is the best exp for me rn`], rng);
  if (g.kind === 'craft') return pick([`saving ${g.matName} for my ${g.item}, ${g.got}/${g.n}`, `need ${g.n - g.got} more ${g.matName} then i can make the ${g.item}`], rng);
  if (g.kind === 'life') return pick([`almost ${LIFE_NAMES[g.skill].toLowerCase()} ${g.to}`, `${LIFE_NAMES[g.skill].toLowerCase()} grind, ${lifeLevel(c, g.skill)} to ${g.to}`], rng);
  return null;
}

// A line of their own (goal or mood) for bots.js talk, or null to say something else.
export function soulLine(bot, rng) {
  const s = soulOf(bot, rng);
  const r = rng();
  if (r < 0.28) return goalLine(bot, rng);
  if (r < 0.36 && s.mood === 'tired') return pick(['so sleepy', 'been on way too long', 'one more hour then bed', 'my eyes hurt lol'], rng);
  if (r < 0.36 && s.mood === 'focused') return pick(['grind mode', 'no breaks today', 'must. level.'], rng);
  return null;
}

// ---------- Friends among the players, and their own parties ----------

export const tiesOf = (bots) => (bots.ties ??= new Map());
export function befriend(bots, a, b) {
  const t = tiesOf(bots);
  (t.get(a.name) ?? t.set(a.name, new Set()).get(a.name)).add(b.name);
  (t.get(b.name) ?? t.set(b.name, new Set()).get(b.name)).add(a.name);
}
export const friends = (bots, a, b) => Boolean(tiesOf(bots).get(a.name)?.has(b.name));

const CREW_COLORS = ['#ffb3d9', '#b3e6ff', '#c9f7b8', '#ffe6a3', '#d9c2ff', '#ffc9a8'];

// Players who came to a field together: the others stand by the first, and they're a group.
export function arriveTogether(bots, members) {
  const [a, ...rest] = members;
  if (!a?.body || !rest.length) return null;
  rest.forEach((b, i) => {
    b.body.x = a.body.x + (i % 2 ? 1 : -1) * (22 + 14 * i);
    b.body.y = a.body.y;
    b.x = b.body.x;
  });
  return teamUp(bots, members);
}

// A group of their own (also how a test or a scene puts one together).
export const teamUp = (bots, members, rng = soulRng(bots)) => formCrew(bots, members, rng);

function formCrew(bots, members, rng) {
  const crew = { id: `crew${(bots.crewN = (bots.crewN ?? 0) + 1)}`, color: pick(CREW_COLORS, rng), lead: members[0], members, talkIn: between(20, 50, rng), asked: false };
  for (const m of members) m.crew = crew;
  for (let i = 0; i < members.length; i++) for (let j = i + 1; j < members.length; j++) befriend(bots, members[i], members[j]);
  return crew;
}

function dropCrew(bot) {
  const crew = bot.crew;
  if (!crew) return;
  bot.crew = null;
  crew.members = crew.members.filter((m) => m !== bot);
  if (crew.members.length < 2) for (const m of crew.members) m.crew = null;
  else if (crew.lead === bot) crew.lead = crew.members[0];
}

const crewOk = (b, world) => !b.gone && !b.party && !b.shop && !b.drama && b.map === world.map.id && !['logout', 'leave', 'transit', 'afk'].includes(b.state) && !b.leaving;

// Out on a field, a crew member strays: where to be, near the leader (party.js hunt and wander
// ask). Null when they're close enough, or lead the crew themselves.
export function crewGoal(bot, world, rng, { wander = false } = {}) {
  const lead = bot.crew?.lead;
  if (!lead || lead === bot || !lead.body || !bot.body || !crewOk(lead, world)) return null;
  const dx = lead.body.x - bot.body.x;
  const dy = lead.body.y - bot.body.y;
  if (!wander && Math.abs(dx) < 200 && Math.abs(dy) < 60) return null;
  // (The same spot while the leader stays about there, so their path holds.)
  const kept = bot.crewSpot;
  if (kept && Math.abs(kept.lx - lead.body.x) < 70 && Math.abs(kept.ly - lead.body.y) < 50) return kept.goal;
  const nav = navOf(world.map);
  // (The ledge under them, even mid-jump.)
  let s = surfaceOf(nav, lead.body);
  if (s < 0) s = surfaceBelow(nav, lead.body.x, lead.body.y - 4);
  if (s == null || s < 0 || !nav.surfaces[s]) return null;
  const surf = nav.surfaces[s];
  const side = (bot.crew.members.indexOf(bot) % 2 ? 1 : -1) * between(24, 70, rng);
  const x = Math.max(surf.x1 + 10, Math.min(surf.x2 - 10, lead.body.x + side));
  const goal = { x, y: surf.yAt(x), mode: 'wander', surface: s };
  bot.crewSpot = { goal, lx: lead.body.x, ly: lead.body.y };
  return goal;
}

// Crews on your map: field hunters team up, town friends walk about together.
function crews(bots, world, rng) {
  const here = world.map.id;
  // You said yes to a crew: its others come along too.
  for (const b of partyMembers(bots)) {
    const crew = b.crew;
    if (!crew) continue;
    for (const m of crew.members) if (m !== b && !m.party && crewOk(m, world) && partyMembers(bots).length < PARTY_MAX) {
      joinParty(bots, m, world);
      world.log?.(`${m.name} joined your party too!`, '#bff0dc');
    }
    for (const m of [...crew.members]) m.crew = null;
  }
  // Break up crews whose members left (or one who can't find a way back to the others).
  for (const b of bots.list) {
    if (!b.crew) continue;
    const lead = b.crew.lead;
    const lost = b.body && lead?.body && lead !== b && (Math.abs(b.body.x - lead.body.x) > 420 || Math.abs(b.body.y - lead.body.y) > 200);
    b.lostFor = lost ? (b.lostFor ?? 0) + 2 : 0;
    if (!crewOk(b, world) || !b.crew.members.includes(b) || b.lostFor > 14) dropCrew(b);
  }
  const solo = bots.list.filter((b) => crewOk(b, world) && !b.crew && !b.shop && !b.afk && !b.helping && !b.merchant && !b.gm && !b.lfg && !b.life);
  const field = solo.filter((b) => b.hunter && b.body && !b.lifer);
  const town = world.map.isTown ? solo.filter((b) => !b.hunter && !b.body && ['idle', 'walk'].includes(b.state)) : [];
  for (const pool of [field, town]) {
    if (pool.length < 2) continue;
    const a = pick(pool, rng);
    // Friends first, then anyone near their level (on the same map, at the same grind).
    // (Near each other: down the street, or on the same stretch of the field.)
    const close = (b) => (pool === town ? Math.abs(b.x - a.x) < 420 : Math.abs(b.body.x - a.body.x) < 600 && Math.abs(b.body.y - a.body.y) < 40);
    const mates = pool.filter((b) => b !== a && close(b) && (friends(bots, a, b) || Math.abs(b.level - a.level) <= 8)).sort((x, y) => Number(friends(bots, a, y)) - Number(friends(bots, a, x)));
    if (!mates.length) continue;
    const odds = friends(bots, a, mates[0]) ? 0.7 : pool === field ? 0.45 : 0.2;
    if (rng() > odds) continue;
    const n = pool === field && mates.length >= 2 && rng() < 0.4 ? 2 : 1;
    const crew = formCrew(bots, [a, ...mates.slice(0, n)], rng);
    // Meeting up: in town the others walk over to the leader.
    if (pool === town) for (const m of crew.members.slice(1)) Object.assign(m, { state: 'walk', target: a.x + (m.x < a.x ? -26 : 26) });
    const mate = crew.members[1];
    botChat(world, mate, moodVoice(mate, pick([`${a.name}!! party?`, `${a.name} wanna team up?`, `oh ${a.name} ur here too`, `inv me ${a.name}`], rng), rng));
  }
  // Each crew: town followers keep by the leader; now and then a line between them, and a field
  // crew near you may ask you along.
  for (const crew of new Set(bots.list.filter((b) => b.crew).map((b) => b.crew))) {
    const lead = crew.lead;
    if (!lead.body && lead.map === here) {
      crew.members.slice(1).forEach((m, i) => {
        if (m.body || m.life || !['idle', 'walk'].includes(m.state)) return;
        const want = lead.x + (i % 2 ? 1 : -1) * (26 + 22 * Math.floor(i / 2));
        if (Math.abs(m.x - want) > 40) Object.assign(m, { state: 'walk', target: want });
        else if (m.state === 'idle') m.facing = lead.x < m.x ? -1 : 1;
      });
      // The leader idles a little longer so the others catch up.
      if (lead.state === 'walk' && crew.members.some((m) => Math.abs(m.x - lead.x) > 120)) Object.assign(lead, { state: 'idle', timer: 1.5 });
    }
    crew.talkIn -= 2;
    if (crew.talkIn <= 0) {
      crew.talkIn = between(50, 110, rng);
      crewTalk(bots, world, crew, rng);
    }
    if (!crew.asked && lead.hunter && lead.body && Math.abs(lead.body.x - world.body.x) < 380 && rng() < 0.08) askYouAlong(bots, world, crew, rng);
  }
}

function crewTalk(bots, world, crew, rng) {
  const a = pick(crew.members, rng);
  const mate = pick(crew.members.filter((m) => m !== a), rng);
  if (!mate) return;
  const map = MAPS[a.map];
  const mobs = (map?.spawns ?? []).map((s) => MOBS[s.mob]).filter((d) => d && !d.boss);
  const mob = mobs.length ? pick(mobs, rng).name : null;
  const lines = a.hunter
    ? [mob && `${mate.name} pull the ${mob}s over here`, `nice one ${mate.name}!`, `${mate.name} wanna go up a floor?`, `brb pots, ${mate.name} hold the spot`, mob && `${mob}s respawn so fast here`, `${mate.name} ur so strong now lol`]
    : [`${mate.name} wanna go hunt after?`, `wait for me ${mate.name}`, `${mate.name} look at that shop`, map && `${map.name} is so pretty at night`, `${mate.name} ur outfit is cute`];
  const line = pick(lines.filter(Boolean), rng);
  if (!botChat(world, a, moodVoice(a, line, rng))) return;
  // Their mate answers a moment later (through the gate, with its own wait).
  const back = pick(['ok!', 'yep', 'omw', 'haha ty', 'sure', 'kk'], rng);
  (bots.replies ??= []).push({ bot: mate, text: back, pose: null, at: world.now + between(2.5, 4.5, rng) });
}

function askYouAlong(bots, world, crew, rng) {
  crew.asked = true;
  const lead = crew.lead;
  if (!mayAskAlong(bots, world) || world.dungeon || partyMembers(bots).length + crew.members.length > PARTY_MAX || lead.level > world.char.level + LEVEL_GAP) return;
  const mobs = (world.map.spawns ?? []).map((s) => MOBS[s.mob]).filter((d) => d && !d.boss);
  const mob = mobs.length ? pick(mobs, rng).name : 'monsters';
  const others = crew.members.filter((m) => m !== lead).map((m) => m.name).join(' and ');
  if (!botChat(world, lead, `${world.char.name} wanna join us? ${others} and me are doing ${mob}s`, { important: true })) return;
  askAlong(bots, world, lead);
  world.log?.(`(${lead.name}'s group asks you along: N to answer.)`, '#bfe0ff');
}

// ---------- Town life: natural moves, AFK, outfits ----------

// Eases a town player's walking speed toward what they want (bots.js behave): starts and stops
// ease in and out, a stroll slows before it ends, and a pause to look around holds them still.
export function walkSpeed(bot, d, dt, base, now) {
  const s = bot.char?.soul;
  const pace = (s?.pace ?? 1) * (s?.mood === 'tired' ? 0.82 : s?.mood === 'cheerful' ? 1.08 : 1);
  const paused = bot.pause && now < bot.pause.until;
  const want = paused ? 0 : base * pace * Math.min(1, Math.abs(d) / 30 + 0.2);
  const v = bot.speed ?? 0;
  const rate = base * (want > v ? 3 : 5);
  bot.speed = want > v ? Math.min(want, v + rate * dt) : Math.max(want, v - rate * dt);
  bot.moving = bot.speed > 4;
  return bot.speed;
}

// How high a town player's hop is right now (pixels), for drawing.
export function hopLift(bot) {
  const h = bot.hop;
  if (!h) return 0;
  return 13 * Math.sin(Math.PI * Math.min(1, h.t / h.dur));
}

function townMoments(bot, bots, world, map, dt, rng) {
  // A hop, playing out.
  if (bot.hop && (bot.hop.t += dt) >= bot.hop.dur) bot.hop = null;
  if (bot.pause && world.now >= bot.pause.until) bot.pause = null;
  if (bot.pause && !bot.pause.turned && world.now > bot.pause.turnAt) {
    bot.pause.turned = true;
    bot.facing = -bot.facing;
  }
  if (bot.moodFace && (bot.moodFace.t -= dt) <= 0) bot.moodFace = null;
  // AFK: sat down until they're back (or log off).
  if (bot.afk) {
    if (bot.state !== 'afk') {
      bot.afk = null;
      return;
    }
    if (world.now >= bot.afk.until) {
      bot.afk = null;
      bot.chatAt = -99;
      bot.afkAgain = world.now + between(240, 480, rng);
      bot.state = 'idle';
      bot.timer = between(2, 4, rng);
      bot.emote = { pose: 'afkwake', t: 0, dur: 1.2 };
      setMood(bot, 'chill', world);
      if (rng() < 0.5) botChat(world, bot, pick(['back', 'ok back', 'sry was afk', 'back! what did i miss'], rng));
    }
    return;
  }
  bot.momentIn = (bot.momentIn ?? between(3, 8, rng)) - dt;
  if (bot.momentIn > 0) return;
  bot.momentIn = between(4, 9, rng);
  const s = soulOf(bot, rng);
  if (bot.state === 'walk' && !bot.crew) {
    // Mid-stroll: a look around, or a hop for the fun of it.
    const r = rng();
    if (r < 0.18) {
      bot.pause = { until: world.now + between(1.6, 2.6, rng), turnAt: world.now + 0.8, turned: rng() < 0.5 };
      bot.emote = { pose: 'lookaround', t: 0, dur: 1.4 };
    } else if (r < 0.3 && s.mood !== 'tired') bot.hop = { t: 0, dur: 0.55 };
    return;
  }
  if (bot.state === 'walk' && rng() < 0.12 && s.mood === 'cheerful') bot.hop = { t: 0, dur: 0.55 };
  if (bot.state !== 'idle' || bot.emote || bot.crew) return;
  const r = rng();
  // Going AFK (much likelier when tired), with a word first now and then.
  if (r < (s.mood === 'tired' ? 0.14 : 0.03) && world.now > (bot.afkAgain ?? 0) && Math.abs(bot.x - world.body.x) > 40) {
    if (rng() < 0.5) botChat(world, bot, pick(['brb', 'afk a sec', 'afk food', 'brb dinner', 'afk'], rng));
    bot.state = 'afk';
    bot.afk = { since: world.now, until: world.now + between(50, 200, rng) };
    return;
  }
  // A new outfit (a real one from the Cash Shop), with a twirl.
  if (r < 0.05) {
    const def = ITEMS[pick(CASH_ITEMS, rng)];
    if (!def || def.retired) return;
    bot.char.outfit ??= {};
    bot.char.outfit[def.slot] = makeCash(def.id, def.slot === 'earring' ? null : pick([null, 'dark', 'white', 'azure', 'crimson', 'gilded'], rng));
    bot.appear = Math.max(bot.appear ?? 0, 0.5);
    showOff(bot);
    if (rng() < 0.6) botChat(world, bot, moodVoice(bot, pick([`new ${def.name}, cute or no?`, `finally got the ${def.name}`, `trying on my ${def.name} :3`], rng), rng));
    return;
  }
  // Their mood on their face, now and then.
  if (r < 0.2) bot.moodFace = { face: MOOD_FACE[s.mood], t: 2.5 };
}

// ---------- Reactions ----------

// A boss falls on your map: everyone around cheers, and someone says it.
function bossCheers(bots, world, M, rng) {
  for (const m of world.mobs ?? []) {
    if (!m.def?.boss || m.hp > 0 || M.cheered.has(m)) continue;
    M.cheered.add(m);
    const near = bots.list.filter((b) => !b.gone && b.map === world.map.id && !b.down && !b.afk && Math.abs((b.body?.x ?? b.x) - m.x) < 700);
    const name = m.def.name.split(',')[0];
    let said = false;
    near.slice(0, 5).forEach((b, i) => {
      setMood(b, 'cheerful', world);
      if (b.body) b.attack ??= { pose: 'cheer', t: 0, dur: 1 };
      else b.emote = { pose: 'cheer', t: 0, dur: 1.1 };
      if (!said && i < 3) said = botChat(world, b, pick([`${name} down!!`, `GG ${name}!`, 'we did it!!', `bye bye ${name} lol`, 'gg everyone!'], rng), { important: true, prefix: b.party ? '[Party] ' : '' });
    });
  }
  if (M.cheered.size > 20) M.cheered = new Set([...M.cheered].slice(-10));
}

// ---------- Each frame (bots.js) ----------

export function updateSouls(bots, world, dt) {
  const rng = soulRng(bots);
  const M = (bots.soul ??= { tick: 3, cheered: new Set(), popIn: 20 });
  // Town players on your map: their little moments, every frame (just the ones here).
  if (world.map.isTown) for (const b of bots.list) if (!b.party && !b.hunter && !b.body && b.map === world.map.id && b.state !== 'transit') townMoments(b, bots, world, MAPS[b.map], dt, rng);
  bossCheers(bots, world, M, rng);
  // A party member or hunter going down tires them.
  for (const b of bots.list) {
    if (b.down && !b.wasDown) moodEvent(b, 'died', world);
    b.wasDown = Boolean(b.down);
  }
  M.tick -= dt;
  if (M.tick > 0) return;
  const secs = 2 - M.tick;
  M.tick = 2;
  for (const b of bots.list) {
    if (b.gone || b.gm || b.merchant) continue;
    const s = soulOf(b, rng);
    s.online += secs;
    // Goals move along as they play.
    const hunting = Boolean(b.hunter || (b.party && !world.map.isTown));
    if (s.goal && workGoal(b, secs, rng, { hunting })) finishGoal(b, bots, world, rng);
    else if (!s.goal && rng() < 0.05) s.goal = rollGoal(b.char, rng);
    // Moods drift: a long session wears them out, a grind focuses them, town calms them, and a
    // strong feeling fades after a while.
    const since = world.now - s.moodAt;
    if (s.online > 420 && s.mood !== 'tired' && rng() < 0.01 * secs) setMood(b, 'tired', world);
    else if (hunting && s.mood === 'chill' && s.goal && since > 60 && rng() < 0.03 * secs) setMood(b, 'focused', world);
    else if (!hunting && MAPS[b.map]?.isTown && ['focused', 'cheerful'].includes(s.mood) && since > 120 && rng() < 0.02 * secs) setMood(b, 'chill', world);
    // Tired players don't stay on as long.
    if (s.mood === 'tired' && !b.party && b.session > 60 && b.session !== Infinity) b.session -= secs * 0.5;
  }
  crews(bots, world, rng);
  // Over the day: when the server's past its crowd for the hour, someone heads off.
  M.popIn -= secs;
  if (M.popIn <= 0 && bots.daily) {
    M.popIn = between(15, 30, rng);
    const want = populationAt(bots.clock());
    if (bots.list.length > want + 1) {
      const off = pick(bots.list.filter((b) => !b.party && !b.hunter && !b.buddy && !b.gm && !b.merchant && b.session > 20 && b.session !== Infinity), rng);
      if (off) off.session = Math.min(off.session, between(2, 15, rng));
    }
  }
}
