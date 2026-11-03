// Other players at their life skills (docs/design/life-skills.md), the world side: the render side
// is render/life.js botLifePose (the same moves and tools the hero uses).
//
//   - Every generated character has life levels (rollLife): most are casual (a skill or two picked
//     up along the way), some are keen life-skillers with high levels and bench-made tools.
//   - Out on a field, a hunter now and then stops at a ready spot on their floor or nearby (one
//     their own levels can work), walks there over the ledges and ropes, works it with the right
//     move and tool, and moves on. Their work never uses a spot up for you (the player's rule): it
//     stays ready for you, and only rests for the other players (world.botRest). Keen
//     life-skillers (`bot.lifer`) mostly go round the map's spots in a loop, spread over its floors
//     (they pick spots away from everyone else), and sit at fishing nooks for a while.
//   - A spot the player is using, standing near or walking toward is never taken, and a bot at one
//     steps off it the moment the player starts on it or comes over.
//   - In town, players cook at the stove, craft at the bench, pick the town's own spot and fish a
//     town nook that's on the street.
//   - What they say about it goes through the chat gate (world/chatlog.js) and is about what just
//     happened to them, by its real name: a rare find, a life level, a craft's quality, the
//     material their next craft needs (another player may know where it's found), and at night,
//     where the map's night-only find is open.
//
// Cheap by design: a bot only looks for a spot every so often (never every frame), only the map
// you're on runs any of it (hunters exist only there; town players elsewhere just come and go), and
// the pose is worked out only for the ones drawn.
//
// bot.life (also what drama/events/lives check to leave a busy player alone):
//   { kind: 'node' | 'fish' | 'cook' | 'craft', phase: 'walk' | 'work' | fishing phases, goal (field:
//     where to stand, for party.js), t, secs, i (a spot's index), node, spot, find, ... }

import { nodesOf, nodeOpen, nodeReady } from './gathering.js';
import { KINDS, NODE_REACH, NODES, TIER_FINDS } from '../data/gathering.js';
import { SPOTS, SPOT_REACH, FISH_BY_ID, BITE_WAIT } from '../data/fishing.js';
import { RECIPES, QUALITIES, TOOL_KINDS, toolId } from '../data/crafting.js';
import { DISHES } from '../data/cooking.js';
import { ITEMS } from '../data/items.js';
import { MAPS } from '../data/maps.js';
import { MOBS } from '../data/mobs.js';
import { JOBS } from '../data/jobs.js';
import { lifeExpFor, lifeExpToNext, perksAt, needFor, skillOfKind, lifeLevel, LIFE_NAMES, LIFE_MAX, TIER_LEVEL, tierOf } from '../core/life.js';
import { qualityOdds, rollQuality } from '../core/crafting.js';
import { isNight } from './daytime.js';
import { groundAt } from './physics.js';
import { navOf, surfaceBelow, surfaceOf, findPath } from './nav.js';
import { botChat, stale, shape } from './chatlog.js';
import { voiced } from './chatter.js';
import { LIFE_POSE_SECS } from './lifepose.js';
import { CRAFT_SECS } from './crafting.js';
import { partyGathered } from './grouping.js';

const pick = (list, rng) => list[Math.floor(rng() * list.length)];
const between = (a, b, rng) => a + rng() * (b - a);
const name = (id) => ITEMS[id]?.name ?? FISH_BY_ID[id]?.name ?? id;
const lower = (s) => s.toLowerCase();

const GATHER_SKILLS = ['gathering', 'mining', 'fishing'];
const ALL = ['fishing', 'gathering', 'mining', 'cooking', 'crafting'];
const KEEN_RATE = 0.15;

// ---------- Life levels for a generated character ----------

// A little seeded random of its own (from the character's name), so rolling life levels doesn't
// shift the rest of a character's rolls.
function ownRng(seed) {
  let n = 0;
  for (const c of String(seed)) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  n = n || 1;
  return () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 4294967296;
  };
}

// `style`: 'keen' (a life-skiller: two or three skills high, close to their own level, and tools
// bench-made for them) or 'casual' (a skill or two picked up along the way, the rest barely
// touched). Rolled when left out: most are casual.
export function rollLife(char, style = null, rng = ownRng(`${char.name}|${char.level}|${char.job}`)) {
  style ??= rng() < KEEN_RATE ? 'keen' : 'casual';
  const keen = style === 'keen';
  const lv = char.level;
  const order = [...ALL].sort(() => rng() - 0.5);
  const mains = order.slice(0, keen ? 2 + Math.floor(rng() * 2) : 1 + Math.floor(rng() * 2));
  const life = {};
  for (const skill of ALL) {
    const main = mains.includes(skill);
    const base = keen ? (main ? between(0.75, 1.1, rng) * lv + 4 : between(0.3, 0.6, rng) * lv) : main ? between(0.25, 0.6, rng) * lv : between(0, 0.18, rng) * lv;
    const level = Math.max(1, Math.min(LIFE_MAX, Math.round(base) + 1));
    life[skill] = { level, exp: Math.floor(rng() * 0.9 * Math.min(1e6, lifeExpToNext(level))) };
  }
  char.life = life;
  char.lifeStyle = style;
  char.lifeMains = mains;
  // A keen one carries tools made for their main skills, of the tier those skills have reached.
  if (keen) {
    char.lifeTools ??= {};
    for (const [kind, k] of Object.entries(TOOL_KINDS)) {
      if (!mains.includes(k.skill)) continue;
      const id = toolId(kind, tierOf(life[k.skill].level));
      if (ITEMS[id]) char.lifeTools[k.slot] = id;
    }
  }
  return char;
}

// A keen life-skiller sent out to a map: their gathering skills good enough for its spots.
export function fitLifer(char, map, rng) {
  rollLife(char, 'keen', rng);
  const need = Math.max(1, ...[...(NODES[map.id] ?? map.nodes ?? []), ...(SPOTS[map.id] ?? [])].map((s) => needFor(s)));
  for (const skill of GATHER_SKILLS) {
    const s = char.life[skill];
    if (s.level < need + 2) s.level = Math.min(LIFE_MAX, need + 2 + Math.floor(rng() * 8));
  }
  // (Their tools follow the levels they ended up with.)
  for (const [kind, k] of Object.entries(TOOL_KINDS)) {
    if (!char.lifeMains.includes(k.skill)) continue;
    const id = toolId(kind, tierOf(char.life[k.skill].level));
    if (ITEMS[id]) char.lifeTools[k.slot] = id;
  }
  return char;
}

const perksOf = (char, skill, slot = skill) => {
  const held = char.lifeTools?.[slot];
  const def = held ? ITEMS[held] : null;
  return perksAt(lifeLevel(char, skill), def?.life ? def : null);
};

// One finished action's life EXP for a bot. Returns the new level when it went up, or 0.
export function botLifeExp(char, skill, tier, kind) {
  const s = ((char.life ??= {})[skill] ??= { level: 1, exp: 0 });
  if (s.level >= LIFE_MAX) return 0;
  s.exp += lifeExpFor(tier, kind, s.level);
  let up = 0;
  while (s.level < LIFE_MAX && s.exp >= lifeExpToNext(s.level)) {
    s.exp -= lifeExpToNext(s.level);
    s.level += 1;
    up = s.level;
  }
  return up;
}

// ---------- Talking about it ----------

// A line of their own, in their voice, through the chat gate, at most one a minute or so (on top
// of the gate's own rules: never a repeat, never more than one a half minute).
// (Names are kept as they are: no typos or stretched vowels in an item or a map. And the line
// itself, before their own way of typing it, counts as said: nobody says it again with a different
// emoticon on the end.)
function lifeSay(world, bot, line, rng, { chance = 1, important = false } = {}) {
  if (!line || rng() > chance) return false;
  if (world.now - (bot.lifeChatAt ?? -999) < 70 || stale(world, line)) return false;
  const text = voiced(line, {}, { ...(bot.style ?? {}), typos: false, stretch: false }, rng);
  if (!botChat(world, bot, text, { important })) return false;
  bot.lifeChatAt = world.now;
  world.chatGate.said.set(shape(line, [world.char?.name, bot.name]), world.now);
  return true;
}

// "a Sapphire", "an Amethyst".
const an = (s) => `${/^[aeiou]/i.test(s) ? 'an' : 'a'} ${s}`;

const KIND_WORD = { ore: 'vein', wood: 'tree', fiber: 'patch', herb: 'patch', fruit: 'tree', honey: 'hive' };

// A rare find just came out of a spot.
function rareLine(bot, world, id, node, rng) {
  const item = name(id);
  const map = world.map.name;
  if (node?.kind === 'ore') {
    const ore = lower(name(Object.keys(node.pool)[0]));
    return pick([`got ${an(item)} out of the ${ore} vein!`, `${item}!! first one today`, `ooh ${an(item)}, the ${ore} on ${map} is generous today`, `${item} from that vein, finally`], rng);
  }
  if (node?.night) return pick([`first ${item} of the night {emote}`, `picked ${an(item)} while its open`, `${item}s only open at night, got one`], rng);
  return pick([`${item}!! out of ${an(KIND_WORD[node?.kind] ?? 'spot')} on ${map}`, `lucky ${item} just now`], rng);
}

function fishLine(bot, world, fish, rng) {
  return pick([`${fish.name}!! off ${world.map.name} of all places`, `just pulled ${an(fish.name)} out, my arms`, `${an(fish.name)}!! this nook is the best`, `${fish.name} on the line, finally`], rng);
}

// A life skill went up: what it opens, if anything, by name.
function levelLine(bot, skill, level, rng) {
  const S = LIFE_NAMES[skill];
  const tier = TIER_LEVEL.indexOf(level);
  if (tier > 1) {
    const f = TIER_FINDS[tier];
    if (skill === 'mining') return pick([`${S} ${level}!! ${lower(name(f.ore))} veins here i come`, `finally ${lower(S)} ${level}, ${name(f.ore)} time`], rng);
    if (skill === 'gathering') return pick([`${S} ${level}!! i can chop ${lower(name(f.wood))}s now`, `${lower(S)} ${level}, ${name(f.fiber)} is open to me now`], rng);
    if (skill === 'fishing') {
      const where = Object.entries(SPOTS).find(([, list]) => list.some((s) => s.tier === tier))?.[0];
      return where ? pick([`${S} ${level}!! ${MAPS[where].name} waters here i come`, `${lower(S)} ${level}, finally allowed to fish ${MAPS[where].name}`], rng) : null;
    }
  }
  if (skill === 'crafting') {
    const family = JOBS[bot.char.job]?.family;
    const r = RECIPES.find((x) => x.level === level && (!x.family || x.family === family));
    if (r) return pick([`${S} ${level}!! i can make ${name(r.makes)} now`, `${lower(S)} ${level}, ${name(r.makes)} unlocked {emote}`], rng);
  }
  if (skill === 'cooking') {
    const d = DISHES.find((x) => TIER_LEVEL[x.tier] === level);
    if (d) return `${lower(S)} ${level}!! ${d.name} is open to me now`;
  }
  return pick([`${S} ${level} {emote}`, `${lower(S)} lv ${level}!`, `ding ${lower(S)} ${level}`, `${lower(S)} ${level} finally`], rng);
}

// Where a material comes from, by name: the spots that give it, a fishing nook, or the monsters
// that drop it and where they live. Null when it's nowhere (so nobody makes something up).
export function whereFrom(id) {
  const fields = Object.values(MAPS).filter((m) => !m.dungeon);
  const spotsOn = (m) => NODES[m.id] ?? m.nodes ?? [];
  const gives = (x) => x.pool?.[id] || x.rare?.[0] === id;
  // (Fields first: a town's one little spot is no place to send someone.)
  const maps = fields.filter((m) => spotsOn(m).some(gives)).sort((a, b) => Number(Boolean(a.isTown)) - Number(Boolean(b.isTown)));
  if (maps.length) {
    const n = spotsOn(maps[0]).find(gives);
    const at = maps.slice(0, 2).map((m) => m.name).join(' and ');
    const item = name(id);
    if (n.rare?.[0] === id) return `${item} comes out of ${lower(name(Object.keys(n.pool)[0]))} veins, try ${at}`;
    if (n.night) return `${item} only opens at night, on ${at}`;
    if (n.kind === 'ore') return `${item}: mine the veins on ${at}`;
    if (n.kind === 'wood') return `${item}: chop the trees on ${at}`;
    return `${item} grows on ${at}`;
  }
  const fishAt = Object.entries(SPOTS).filter(([, list]) => list.some((s) => s.pool[id])).map(([m]) => MAPS[m].name);
  if (fishAt.length) return `${name(id)} bites at ${fishAt.slice(0, 2).join(' and ')}`;
  const mob = Object.values(MOBS).find((m) => !m.boss && (m.drops ?? []).some((d) => d.id === id) && fields.some((map) => (map.spawns ?? []).some((s) => s.mob === m.id)));
  if (mob) {
    const map = fields.find((m) => (m.spawns ?? []).some((s) => s.mob === mob.id));
    return `${mob.name}s drop ${name(id)}, on ${map.name}`;
  }
  return null;
}

// "up and to the right of u": where something is from the player.
function direction(world, x, y) {
  const dx = x - world.body.x;
  const dy = y - world.body.y;
  const side = Math.abs(dx) < 120 ? null : dx > 0 ? 'right' : 'left';
  const vert = dy < -60 ? 'up' : dy > 60 ? 'down' : null;
  if (vert && side) return `${vert} and to the ${side} of u`;
  if (side) return `to the ${side} of u`;
  if (vert) return vert === 'up' ? 'right above u' : 'right below u';
  return 'right by u';
}

// ---------- Spots ----------

const keyOf = (L) => (L.kind === 'node' ? `n${L.i}` : L.kind === 'fish' ? `f${L.si}` : L.kind);
const restKey = (world, i) => `${world.map.id}:${i}`;

// The player is on it (or standing right by it): it's theirs.
// The player is at it, close to it, or walking toward it on its floor: it's theirs, and nobody
// stands on it or in their way.
function playerAt(world, x, y, reach = 120) {
  const b = world.body;
  if (world.dead) return false;
  const dx = x - b.x;
  if (Math.abs(b.y - y) > 60) return false;
  return Math.abs(dx) < reach || (Math.abs(dx) < 360 && Math.abs(b.vx) > 8 && Math.sign(b.vx) === Math.sign(dx));
}
function playerUsingNode(world, i, n, reach) {
  return world.gathering?.i === i || playerAt(world, n.x, n.y, reach);
}
function playerUsingSpot(world, s, reach) {
  return world.fishing?.spot === s || playerAt(world, s.x, s.y, reach);
}

// Players never use a spot up for you (the player's rule): a bot's work leaves it ready for you,
// and only keeps that bot and the others from working the same spot again for a while
// (world.botRest, apart from your world.nodeRest).
function botReady(world, i) {
  return nodeReady(world, i) && (world.botRest?.[restKey(world, i)] ?? -Infinity) <= world.now;
}

function claimed(world, bot, key) {
  return (world.bots?.list ?? []).some((b) => b !== bot && b.map === world.map.id && b.life && keyOf(b.life) === key);
}

// The spots a bot could go and work now, with how much they'd like each (lower is better).
function choices(bot, world, at, rng, { reach = null } = {}) {
  const out = [];
  const char = bot.char;
  const others = (world.bots?.list ?? []).filter((b) => b !== bot && b.map === world.map.id && b.state !== 'transit');
  const crowd = (x, y) => others.filter((o) => Math.abs((o.body?.x ?? o.x) - x) < 150 && Math.abs((o.body?.y ?? y) - y) < 60).length;
  const mains = char.lifeMains ?? [];
  nodesOf(world).forEach((n, i) => {
    const kind = KINDS[n.kind];
    if (!kind || !nodeOpen(world, n) || !botReady(world, i)) return;
    const skill = skillOfKind(n.kind, kind);
    if (lifeLevel(char, skill) < needFor(n) || playerUsingNode(world, i, n) || claimed(world, bot, `n${i}`)) return;
    const dx = Math.abs(n.x - at.x);
    const dy = Math.abs(n.y - at.y);
    if (reach && (dx > reach[0] || dy > reach[1])) return;
    out.push({ kind: 'node', i, node: n, x: n.x, y: n.y, skill, score: dx + dy * 2.5 + crowd(n.x, n.y) * 320 + (mains.includes(skill) ? 0 : 220) + rng() * 260 });
  });
  (SPOTS[world.map.id] ?? []).forEach((s, si) => {
    if (lifeLevel(char, 'fishing') < needFor(s) || playerUsingSpot(world, s) || claimed(world, bot, `f${si}`)) return;
    const dx = Math.abs(s.x - at.x);
    const dy = Math.abs(s.y - at.y);
    if (reach && (dx > reach[0] || dy > reach[1])) return;
    out.push({ kind: 'fish', si, spot: s, x: s.x, y: s.y, skill: 'fishing', score: dx + dy * 2.5 + crowd(s.x, s.y) * 320 + (mains.includes('fishing') ? -150 : 260) + rng() * 260 });
  });
  return out.sort((a, b) => a.score - b.score);
}

// Rolls what a spot gives (as the hero's gathering does), up front, so the find held up at the
// end of the move is the real one.
function rollFinds(n, perks, rng) {
  const [lo, hi] = KINDS[n.kind].count;
  const got = [];
  const pool = Object.entries(n.pool);
  const total = pool.reduce((s, [, w]) => s + w, 0);
  const k = lo + Math.floor(rng() * (hi - lo + 1)) + (rng() < perks.extra ? 1 : 0);
  for (let j = 0; j < k; j++) {
    let r = rng() * total;
    got.push((pool.find(([, w]) => (r -= w) < 0) ?? pool[0])[0]);
  }
  const rare = n.rare && rng() < n.rare[1] * perks.rare ? n.rare[0] : null;
  if (rare) got.push(rare);
  return { got, rare };
}

function startNode(bot, c, rng) {
  const n = c.node;
  const perks = perksOf(bot.char, c.skill, n.kind === 'wood' ? 'chopping' : c.skill);
  const { got, rare } = rollFinds(n, perks, rng);
  return { kind: 'node', i: c.i, node: n, skill: c.skill, phase: 'walk', t: 0, secs: KINDS[n.kind].secs * perks.time, perks, got, rare, find: rare ?? got[0], walked: 0 };
}

function startFish(bot, c, rng) {
  const perks = perksOf(bot.char, 'fishing');
  // Keen ones sit a good while; anyone else casts a few times.
  const sit = bot.lifer || bot.char.lifeMains?.includes('fishing') ? between(40, 110, rng) : between(18, 40, rng);
  return { kind: 'fish', si: c.si, spot: c.spot, skill: 'fishing', phase: 'walk', t: 0, perks, sit, walked: 0, casts: 0 };
}

function rollFish(spot, rng, rare) {
  const entries = Object.entries(spot.pool).map(([id, w]) => [id, w * (1 + (rare - 1) * ((FISH_BY_ID[id]?.rarity ?? 1) - 1))]);
  let r = rng() * entries.reduce((s, [, w]) => s + w, 0);
  for (const [id, w] of entries) if ((r -= w) < 0) return FISH_BY_ID[id];
  return FISH_BY_ID[entries[0][0]];
}

// Fishing, phase by phase (as world/fishing.js runs the hero's), ending after a sit. Returns false
// once they're done.
function tickFish(bot, world, L, dt, rng) {
  L.t += dt;
  L.sat = (L.sat ?? 0) + dt;
  if (L.phase === 'cast' && L.t >= 0.5) {
    L.phase = 'wait';
    L.t = 0;
    L.fish = rollFish(L.spot, rng, L.perks.rare);
    L.wait = (BITE_WAIT[0] + rng() * (BITE_WAIT[1] - BITE_WAIT[0]) + (L.fish.rarity - 1) * 1.2) * L.perks.time * between(1, 2.2, rng);
    L.nibbles = [0.3, 0.6].map((u) => L.wait * u + rng() * 0.4);
  } else if (L.phase === 'wait' && L.t >= L.wait) {
    L.phase = 'bite';
    L.t = 0;
    L.hookAt = L.fish.react * L.perks.react * between(0.35, 0.8, rng);
    L.hooks = rng() < 0.82 + 0.004 * L.perks.level;
  } else if (L.phase === 'bite' && L.t >= L.hookAt) {
    L.phase = L.hooks ? 'catch' : 'miss';
    L.t = 0;
    if (L.hooks) {
      L.find = L.fish.id;
      const up = botLifeExp(bot.char, 'fishing', L.spot.tier ?? 1, 'fish');
      if (L.fish.rarity >= 3) lifeSay(world, bot, fishLine(bot, world, L.fish, rng), rng, { chance: L.fish.rarity >= 4 ? 0.9 : 0.5 });
      else if (up) lifeSay(world, bot, levelLine(bot, 'fishing', up, rng), rng, { chance: 0.5 });
    }
  } else if ((L.phase === 'catch' && L.t >= 1.4) || (L.phase === 'miss' && L.t >= 0.9)) {
    L.find = null;
    if (L.sat >= L.sit) return false;
    L.phase = 'cast';
    L.t = 0;
    L.casts += 1;
  }
  return true;
}

// The spot's work is done: its finds, its rest for everyone, the life EXP, and maybe a word.
function finishNode(bot, world, L, rng) {
  const n = L.node;
  world.botRest ??= {};
  world.botRest[restKey(world, L.i)] = world.now + KINDS[n.kind].rest * L.perks.rest;
  // (The finds hop out of the spot, as yours do: render/gathering.js.)
  world.botPops = [...(world.botPops ?? []).filter((p) => world.now - p.at < 1), { x: n.x, y: n.y, items: [...new Set(L.got)], at: world.now }];
  const up = botLifeExp(bot.char, L.skill, n.tier ?? 1, L.skill === 'mining' ? 'mine' : 'gather');
  bot.lifeDone = (bot.lifeDone ?? 0) + 1;
  // A party member's finds count for your quests (world/grouping.js).
  if (bot.party) for (const id of L.got) partyGathered(world, bot, id, 1);
  if (L.rare || n.night) lifeSay(world, bot, rareLine(bot, world, L.rare ?? L.got[0], n, rng), rng, { chance: L.rare ? 0.85 : 0.35 });
  else if (up) lifeSay(world, bot, levelLine(bot, L.skill, up, rng), rng, { chance: 0.55 });
}

// ---------- Out on a field (hunters and keen life-skillers with bodies) ----------

function stopField(bot, rng, { skip = false } = {}) {
  if (skip && bot.life) (bot.lifeSkip ??= {})[keyOf(bot.life)] = bot.lifeAt ?? 0;
  bot.life = null;
  if (bot.brain) {
    bot.brain.goal = null;
    bot.brain.path = null;
  }
  bot.lifeIn = bot.lifer ? between(0.6, 2.5, rng) : between(45, 120, rng);
}

// Where to stand to work a spot, on its own floor.
function standGoal(world, c, from) {
  const nav = navOf(world.map);
  const dir = Math.sign(c.x - from) || 1;
  const off = c.kind === 'fish' ? 0 : 10;
  const x = c.x - dir * off;
  const surface = surfaceBelow(nav, x, c.y);
  return { x, y: c.y, mode: 'life', surface };
}

// Before a hunter's own tick (world/party.js tickHunter): decide, walk, work. `hunters` are the
// others with bodies on the map.
export function fieldLife(bot, world, dt, rng) {
  bot.lifeAt = world.now;
  const body = bot.body;
  const L = bot.life;
  if (!L) {
    bot.lifeIn ??= bot.lifer ? between(0.5, 3, rng) : between(15, 90, rng);
    bot.lifeIn -= dt;
    if (bot.lifeIn > 0 || bot.leaving || bot.down || !body.onGround) return;
    bot.lifeIn = bot.lifer ? between(1.5, 4, rng) : between(30, 100, rng);
    // A hunter in the middle of a fight mostly finishes it first.
    if (!bot.lifer && bot.brain?.target && rng() < 0.5) return;
    const chance = bot.lifer ? 1 : bot.char.lifeStyle === 'keen' ? 0.75 : 0.45;
    if (rng() > chance) return;
    const nav = navOf(world.map);
    const here = surfaceOf(nav, body);
    if (here < 0) return;
    // A hunter stops at one on their floor or nearby; a life-skiller goes anywhere on the map.
    const skip = bot.lifeSkip ?? {};
    for (const c of choices(bot, world, body, rng, { reach: bot.lifer ? null : [520, 170] }).slice(0, 4)) {
      const key = c.kind === 'node' ? `n${c.i}` : `f${c.si}`;
      if (world.now - (skip[key] ?? -999) < 60) continue;
      const goal = standGoal(world, c, body.x);
      if (!findPath(nav, here, body.x, goal.surface, goal.x)) continue;
      bot.life = c.kind === 'node' ? startNode(bot, c, rng) : startFish(bot, c, rng);
      bot.life.goal = goal;
      if (bot.brain) bot.brain.settled = false;
      return;
    }
    return;
  }
  // Knocked about, leaving, or down: it waits for another time.
  if (bot.leaving || bot.down || bot.hurt > 0) return stopField(bot, rng);
  if (L.phase === 'walk') {
    L.walked += dt;
    const n = L.node ?? L.spot;
    const gone = L.kind === 'node' ? !nodeReady(world, L.i) || !nodeOpen(world, n) || playerUsingNode(world, L.i, n, 90) : playerUsingSpot(world, n, 90);
    if (gone || L.walked > 45) return stopField(bot, rng, { skip: L.walked > 45 });
    const reach = L.kind === 'node' ? NODE_REACH - 4 : SPOT_REACH - 6;
    const there = body.onGround && Math.abs(body.x - n.x) < reach && Math.abs(body.y - n.y) < 6;
    // (Stopped where they meant to be, and it isn't the spot: that one's out of their way.)
    if (!there && bot.brain?.settled && L.walked > 3) return stopField(bot, rng, { skip: true });
    if (there) {
      L.phase = L.kind === 'node' ? 'work' : 'cast';
      L.t = 0;
      body.vx = 0;
      body.facing = L.kind === 'fish' ? n.face : n.x >= body.x ? 1 : -1;
      L.goal = { x: body.x, y: body.y, mode: 'life', surface: surfaceOf(navOf(world.map), body) };
      bot.attack = null;
    }
    return;
  }
  body.facing = L.kind === 'fish' ? L.spot.face : L.node.x >= body.x ? 1 : -1;
  if (L.kind === 'node') {
    // You started on it, or you're coming over: it's yours, and they step off it.
    if (playerUsingNode(world, L.i, L.node, 90)) return stopField(bot, rng);
    L.t += dt;
    if (L.t >= L.secs) {
      finishNode(bot, world, L, rng);
      stopField(bot, rng);
    }
    return;
  }
  // You came to fish the same nook: they reel in and leave it to you.
  if (playerUsingSpot(world, L.spot, 90)) {
    lifeSay(world, bot, pick(['oh go ahead, its all yours', 'ill let u have this nook', 'all yours, they bite good today'], rng), rng, { chance: 0.6, important: true });
    return stopField(bot, rng);
  }
  if (!tickFish(bot, world, L, dt, rng)) stopField(bot, rng);
}

// After the hunter's tick: a path that couldn't be found (party.js drops the goal) is given up on.
// And one hit off it (a monster, a shove) ends the work there and then.
export function fieldLifeAfter(bot, rng) {
  const L = bot.life;
  if (!L) return;
  if (L.phase === 'walk' && !bot.brain?.goal) stopField(bot, rng, { skip: true });
  else if (L.phase !== 'walk') {
    const at = L.node ?? L.spot;
    if (bot.hurt > 0 || !bot.body.onGround || Math.abs(bot.body.x - at.x) > 30 || Math.abs(bot.body.y - at.y) > 6) stopField(bot, rng);
  }
}

// At night, someone near you points out where the map's night-only find is open (once a night on
// each map).
export function nightTip(bots, world, hunters, rng) {
  if (!isNight(world)) {
    bots.nightTold = null;
    return;
  }
  bots.nightTold ??= new Set();
  if (bots.nightTold.has(world.map.id)) return;
  const list = nodesOf(world);
  const i = list.findIndex((n, k) => n.night && nodeOpen(world, n) && nodeReady(world, k));
  if (i < 0) return;
  const n = list[i];
  const near = hunters.filter((b) => !b.down && !b.leaving && b.body && Math.abs(b.body.x - world.body.x) < 700 && Math.abs(b.body.y - world.body.y) < 320);
  const who = near.find((b) => b.char.lifeStyle === 'keen') ?? near[0];
  if (!who) return;
  const item = name(Object.keys(n.pool)[0]);
  const where = direction(world, n.x, n.y);
  const line = pick([`psst, the ${item} spot is open tonight, ${where}`, `its night, ${item}s are out! theres one ${where}`, `if u gather, the ${item} ${where} only opens at night`], rng);
  if (lifeSay(world, who, line, rng)) bots.nightTold.add(world.map.id);
}

// ---------- In town (players without bodies, on the street) ----------

const STAND = 18;

// Something to do at the town's stove, bench or spots. Returns whether they took one up.
export function townPastime(bot, bots, world, map) {
  const rng = bots.rng;
  const char = (bot.char.life ? bot.char : rollLife(bot.char));
  const opts = [];
  const free = (key) => !claimed(world, bot, key);
  const away = (x) => Math.abs(world.body.x - x) > 44 || world.map.id !== map.id;
  if (map.stove != null && free('cook') && away(map.stove) && !(world.pose?.kind === 'cook')) opts.push(['cook', 1 + lifeLevel(char, 'cooking') / 10]);
  if (map.bench != null && free('craft') && away(map.bench) && !world.crafting && JOBS[char.job]?.family) opts.push(['craft', 1 + lifeLevel(char, 'crafting') / 10]);
  const ground = (s) => Math.abs(groundAt(map, s.x) - s.y) < 4;
  const nodes = choices(bot, world, { x: bot.x, y: groundAt(map, bot.x) }, rng).filter((c) => ground(c) && c.kind === 'node');
  if (nodes.length) opts.push(['node', 0.6]);
  const fish = (SPOTS[map.id] ?? []).map((s, si) => ({ s, si })).filter(({ s, si }) => ground(s) && lifeLevel(char, 'fishing') >= needFor(s) && free(`f${si}`) && !playerUsingSpot(world, s));
  if (fish.length) opts.push(['fish', 1 + lifeLevel(char, 'fishing') / 12]);
  if (!opts.length) return false;
  let r = rng() * opts.reduce((s, [, w]) => s + w, 0);
  const kind = (opts.find(([, w]) => (r -= w) < 0) ?? opts[0])[0];
  let L;
  let at;
  if (kind === 'cook') {
    const lv = lifeLevel(char, 'cooking');
    const dishes = DISHES.filter((d) => TIER_LEVEL[d.tier] <= lv);
    L = { kind: 'cook', phase: 'walk', t: 0, secs: LIFE_POSE_SECS.cook, reps: 2 + Math.floor(rng() * 3), dish: pick(dishes, rng), skill: 'cooking' };
    L.find = L.dish.id;
    at = map.stove;
  } else if (kind === 'craft') {
    const r0 = craftPick(char, rng);
    if (!r0) return false;
    L = { kind: 'craft', phase: 'walk', t: 0, secs: Math.max(LIFE_POSE_SECS.craft, CRAFT_SECS[r0.cat] ?? 1.6), reps: 1 + Math.floor(rng() * 3), recipe: r0, find: r0.makes, skill: 'crafting' };
    at = map.bench;
  } else if (kind === 'node') {
    L = startNode(bot, nodes[0], rng);
    at = nodes[0].x;
  } else {
    const { s, si } = pick(fish, rng);
    L = startFish(bot, { si, spot: s }, rng);
    at = s.x;
  }
  L.at = at;
  bot.life = L;
  const side = kind === 'fish' ? 0 : bot.x < at ? -1 : 1;
  bot.state = 'walk';
  bot.target = Math.max(60, Math.min(map.width - 60, at + side * (kind === 'node' ? 10 : STAND)));
  bot.then = () => {
    if (bot.life !== L) return;
    bot.state = 'life';
    L.phase = kind === 'fish' ? 'cast' : 'work';
    L.t = 0;
    bot.facing = kind === 'fish' ? L.spot.face : at >= bot.x ? 1 : -1;
    // (Maybe a word about what their next craft is missing, before they start.)
    if (kind === 'craft' && rng() < 0.4) askFor(bot, bots, world, char, rng);
  };
  return true;
}

// A recipe they'd make at the bench now: their own job's gear, a trinket, a tool or a tonic, near
// their Crafting level.
function craftPick(char, rng, not = null) {
  const lv = lifeLevel(char, 'crafting');
  const family = JOBS[char.job]?.family;
  const list = RECIPES.filter((r) => r !== not && r.level <= lv && r.level >= lv - 14 && (!r.family || r.family === family));
  return list.length ? pick(list, rng) : null;
}

// What their next craft still needs, asked out loud (by its real name); someone who knows may say
// where it's found.
function askFor(bot, bots, world, char, rng) {
  const next = craftPick(char, rng, bot.life?.recipe);
  if (!next) return;
  const [mat, n] = pick(Object.entries(next.needs), rng);
  const where = whereFrom(mat);
  // (Nobody asks about one that was just asked about.)
  bots.asked ??= {};
  if (!where || world.now - (bots.asked[mat] ?? -999) < 600) return;
  const item = name(next.makes);
  const line = pick([`anyone know where to find ${name(mat)}? need ${n} for my ${item}`, `where do u get ${name(mat)}? my ${item} needs it`, `lf ${name(mat)} x${n}, making ${item} next`], rng);
  if (!lifeSay(world, bot, line, rng)) return;
  bots.asked[mat] = world.now;
  if (stale(world, where)) return;
  // Someone on the street answers, now and then.
  const others = (bots.list ?? []).filter((b) => b !== bot && b.map === world.map.id && !b.party && !b.hunter && b.state !== 'transit' && !['leave', 'logout'].includes(b.state));
  const who = others.sort((a, b) => lifeLevel(b.char, 'crafting') - lifeLevel(a.char, 'crafting'))[0];
  if (who && rng() < 0.7 && !(bots.replies ?? []).some((r) => r.bot === who)) {
    (bots.replies ??= []).push({ bot: who, text: voiced(where, {}, { ...(who.style ?? {}), typos: false, shout: false, stretch: false }, rng), pose: null, at: world.now + between(3, 6, rng) });
  }
}

// One tick in town, while they're at it ('life' state). Returns false when they're done.
export function tickTownLife(bot, bots, world, map, dt) {
  const rng = bots.rng;
  const L = bot.life;
  if (!L) return false;
  if (L.kind === 'node') {
    if (!nodeReady(world, L.i) || playerUsingNode(world, L.i, L.node, 90)) return false;
    L.t += dt;
    if (L.t < L.secs) return true;
    finishNode(bot, world, L, rng);
    return false;
  }
  if (L.kind === 'fish') {
    if (playerUsingSpot(world, L.spot, 90)) return false;
    return tickFish(bot, world, L, dt, rng);
  }
  // (The bench's sparks fly with their work while you aren't at it: render/craftbench.js.)
  if (L.kind === 'craft' && !world.crafting) map.benchWork = Math.min(1, L.t / L.secs);
  L.t += dt;
  if (L.t < L.secs) return true;
  L.t = 0;
  L.reps -= 1;
  if (L.kind === 'cook') {
    const up = botLifeExp(bot.char, 'cooking', L.dish.tier ?? 1, 'cook');
    if (up) lifeSay(world, bot, levelLine(bot, 'cooking', up, rng), rng, { chance: 0.5 });
  } else {
    const r = L.recipe;
    const up = botLifeExp(bot.char, 'crafting', r.tier, 'craft');
    if (r.quality) {
      const q = rollQuality(qualityOdds(bot.char, r), rng);
      const piece = name(r.makes);
      if (q === 2) lifeSay(world, bot, pick([`Masterwork ${piece}, finally`, `MASTERWORK ${piece}!! the bench loves me`, `Masterwork ${piece} {emote}`], rng), rng);
      else if (q === 1) lifeSay(world, bot, pick([`Superb ${piece}, ill take it`, `${QUALITIES[1].name} ${piece} first try`], rng), rng, { chance: 0.4 });
      else if (up) lifeSay(world, bot, levelLine(bot, 'crafting', up, rng), rng, { chance: 0.5 });
    } else if (up) lifeSay(world, bot, levelLine(bot, 'crafting', up, rng), rng, { chance: 0.5 });
    // Another piece, maybe a different one.
    if (L.reps > 0 && rng() < 0.5) {
      const next = craftPick(bot.char, rng);
      if (next) {
        L.recipe = next;
        L.find = next.makes;
      }
    }
  }
  if (L.reps <= 0) {
    if (L.kind === 'craft' && !world.crafting) map.benchWork = null;
    return false;
  }
  return true;
}

// Done (or called away) in town.
export function stopTown(bot, map) {
  if (bot.life?.kind === 'craft' && map && map.benchWork != null) map.benchWork = null;
  bot.life = null;
}
