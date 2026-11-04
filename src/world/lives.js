// Players with lives of their own.
//
//   - Asking for help: now and then a player is stuck on a quest and asks around. Right-click
//     them (Help) and they join your party; hunt their monsters together and they thank you with a
//     gift (and remember it).
//   - Weather: rain or snow comes and goes on each map.

import { remember } from './botmemory.js';
import { MOBS } from '../data/mobs.js';
import { MAPS } from '../data/maps.js';
import { joinParty, partyMembers, PARTY_MAX } from './party.js';
import { addItem } from '../core/inventory.js';
import { botChat } from './chatlog.js';

const pick = (list, rng) => list[Math.floor(rng() * list.length)];
const between = (a, b, rng) => a + rng() * (b - a);

const free = (b, world) => b.map === world.map.id && b.state === 'idle' && !b.shop && !b.party && !b.hunter && !b.drama && !b.event && !b.life;

// (What drives the moment: an announcement, a vow, a winner. It skips chat's wait.)
function shout(world, bot, line) {
  botChat(world, bot, line, { important: true });
}

// ---------- Asking for help ----------

const ASK = (mob, n) => [`can someone help me kill ${n} ${mob}s? for my quest`, `stuck on a quest... need ${n} ${mob}s, anyone?`, `help pls, ${mob}s are too strong for me`, `lf help with ${mob}s!! will pay`];

function askForHelp(L, bots, world) {
  const rng = bots.rng;
  if (L.ask || partyMembers(bots).length >= PARTY_MAX) return;
  const bot = pick(bots.list.filter((b) => free(b, world) && b.level >= 10 && b.level <= world.char.level + 5), rng);
  if (!bot) return;
  // A monster from a field near their level.
  const kinds = Object.values(MOBS).filter((d) => !d.boss && d.atk > 0 && Math.abs(d.level - bot.level) <= 6 && Object.values(MAPS).some((m) => !m.isTown && !m.dungeon && (m.spawns ?? []).some((s) => s.mob === d.id)));
  if (!kinds.length) return;
  const def = pick(kinds, rng);
  const n = 6 + Math.floor(rng() * 6);
  L.ask = { bot, mob: def.id, n, until: world.now + 90 };
  bot.helpAsk = L.ask;
  shout(world, bot, pick(ASK(def.name, n), rng));
  world.log?.(`(Right-click ${bot.name} to help them.)`, '#bff0dc');
}

// You said yes: they join your party, and you hunt their monsters together.
export function helpOut(bots, world, bot) {
  const ask = bot.helpAsk;
  if (!ask || bot.party) return null;
  // (Your party may have filled up since they asked.)
  if (partyMembers(bots).length >= PARTY_MAX) {
    world.log('Your party is full.', '#ffb3c6');
    return 'Your party is full';
  }
  joinParty(bots, bot, world);
  bot.helpAsk = null;
  bots.lives.ask = null;
  bot.quest = { mob: ask.mob, n: ask.n, got: 0 };
  bot.bubble = { text: pick(['omg thank u!!', 'ur the best', 'yay lets go!'], bots.rng), t: 4 };
  world.log(`${bot.name} joined your party: help them hunt ${ask.n} ${MOBS[ask.mob].name}s.`, '#bff0dc');
}

// Their monsters going down (yours or theirs).
export function questKill(bots, world, m) {
  for (const b of partyMembers(bots)) {
    const q = b.quest;
    if (!q || q.mob !== m.def.id || q.done) continue;
    q.got += 1;
    if (q.got === Math.ceil(q.n / 2)) b.bubble = { text: `${q.got}/${q.n}! halfway`, t: 3 };
    if (q.got < q.n) continue;
    q.done = true;
    b.helped = true;
    remember(world.char, b, 'quest', MOBS[q.mob]?.name ?? null, world.map.id);
    const gold = 300 + b.level * 40;
    world.char.gold += gold;
    addItem(world.char.inventory, 'elixir', 1);
    b.bubble = { text: pick(['QUEST DONE!! thank u so much', 'finally!! ur a lifesaver', 'done!! here, take this'], bots.rng), t: 5 };
    world.log(`${b.name} finished their quest! They give you ${gold} gold and an Elixir as thanks.`, '#ffe36b');
    world.juice.push({ type: 'confetti', x: b.body?.x ?? world.body.x, y: (b.body?.y ?? world.body.y) - 60, w: 80, count: 24 });
  }
}

// ---------- Weather ----------

const SNOWY = (map) => /snow|frost|ice|winter/.test(`${map.theme} ${map.id} ${JSON.stringify(map.look?.props ?? [])} ${JSON.stringify(map.deco ?? [])}`);

// Weather by region (the map rules): what can fall where.
//   null       under a roof or underground, or above the clouds (no rain falls up there)
//   snowy      the peaks: snow all year
//   tropic     the lagoon, the islands and the open sea: rain, never snow
//   dry        the desert canyon, Ember Crag and the candy volcano: a rare shower, never snow
//   temperate  everywhere else: rain, and snow in December and January
const HIGH = new Set(['sky', 'starfall', 'terrace', 'cloudcatch_pier']);
const TROPIC = new Set(['lagoon', 'voyage_out', 'voyage_home', 'voyage_isle', 'dawnbeach', 'dock', 'trainfield', 'home']);
export function climate(map) {
  if (map.dungeon || map.indoor || map.ownLight || map.look?.ceiling || ['cave', 'hollow', 'aquarium'].includes(map.theme)) return null;
  if (HIGH.has(map.id) || map.theme === 'sky' || map.theme === 'skywhale') return null;
  if (SNOWY(map)) return 'snowy';
  if (TROPIC.has(map.id) || map.home) return 'tropic';
  if (map.theme === 'crag' || map.theme === 'candy') return 'dry';
  return 'temperate';
}

function weatherTick(L, bots, world, dt, hooks) {
  const rng = bots.rng;
  const map = world.map;
  const kind = climate(map);
  if (!kind) {
    world.weather = null;
    return;
  }
  if (L.weatherMap !== map.id) {
    L.weatherMap = map.id;
    L.weatherIn = 0;
  }
  L.weatherIn -= dt;
  if (L.weatherIn <= 0) {
    L.weatherIn = between(120, 300, rng);
    const month = hooks.now() ? new Date(hooks.now()).getMonth() : 0;
    const snow = kind === 'snowy' || (kind === 'temperate' && (month === 11 || month === 0));
    const was = world.weather;
    world.weather = rng() < (kind === 'dry' ? 0.08 : 0.3) ? (snow ? 'snow' : 'rain') : null;
    if (world.weather && world.weather !== was) world.log?.(world.weather === 'snow' ? `Snow starts to fall on ${map.name}.` : `It starts to rain on ${map.name}.`, '#bfe0ff');
    else if (!world.weather && was) world.log?.(`The ${was} stops.`, '#bfe0ff');
  }
}

// ---------- Each frame ----------

// `hooks` (from world/bots.js): logIn(who), makeChar, now() (real time, ms).
export function updateLives(bots, world, dt, hooks) {
  const rng = bots.rng;
  const L = (bots.lives ??= { askIn: between(120, 300, rng), weatherIn: 0 });
  // (A kill may count for someone you're helping.)
  world.onAnyKill = (m) => questKill(bots, world, m);
  weatherTick(L, bots, world, dt, hooks);
  if (L.ask && (world.now > L.ask.until || L.ask.bot.gone)) {
    if (L.ask.bot.helpAsk === L.ask) L.ask.bot.helpAsk = null;
    L.ask = null;
  }
  if (!world.map.isTown || world.dungeon) return;
  const tick = (key, lo, hi, fn) => {
    L[key] -= dt;
    if (L[key] > 0) return;
    L[key] = between(lo, hi, rng);
    fn();
  };
  tick('askIn', 240, 480, () => askForHelp(L, bots, world));
}
