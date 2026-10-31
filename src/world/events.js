// Server events and celebrations: the big shared moments that come round now and then.
//
//   - GM events: a Game Master (GM Momo) runs Double EXP for a while.
//   - Festivals: by the real calendar (Spooky Night in October, the Snow Festival in December...),
//     towns celebrate: players dress in the festival's colour, dance, and fireworks go up.
//   - The wandering merchant: once in a long while a peddler sets up in a town for a few minutes
//     with odd wares at odd prices; word spreads and players race there.

import { ITEMS } from '../data/items.js';
import { botChat } from './chatlog.js';
import { happened } from './chatter.js';

const pick = (list, rng) => list[Math.floor(rng() * list.length)];
const between = (a, b, rng) => a + rng() * (b - a);

// Town folk free to be pulled into something.
const free = (b, world) => b.map === world.map.id && b.state === 'idle' && !b.shop && !b.party && !b.hunter && !b.drama && !b.event && !b.life;

const GM = 'GM Momo';

// ---------- GM events ----------

function gmSays(world, text) {
  world.log?.(`[GM] ${GM}: ${text}`, '#ffd24f');
}

function doubleExp(ev, bots, world) {
  const mins = 5;
  ev.gm = { kind: 'exp', until: world.now + mins * 60 };
  happened(bots, world, 'the double exp');
  world.expEvent = 2;
  gmSays(world, `DOUBLE EXP for the next ${mins} minutes! Go go go!`);
  world.callout = { title: 'Double EXP!', sub: `${mins} minutes, everyone on the server`, color: '#ffd24f', at: world.now };
  chatter(bots, world, ['DOUBLE EXP LETS GOOO', 'gm momo best gm', 'grind time!!', 'everyone to the fields!']);
}

function endGm(ev, bots, world) {
  const g = ev.gm;
  ev.gm = null;
  if (g.kind === 'exp') {
    world.expEvent = 1;
    gmSays(world, 'Double EXP is over. Thanks for playing!');
  }
}

// ---------- Festivals ----------

const FESTIVALS = {
  0: { name: 'New Year Festival', color: 'gilded', fireworks: ['#ffd24f', '#ff6b6b', '#ffffff'], lines: ['happy new year!!', 'new year new grind', 'fireworks!!'] },
  1: { name: 'Sweet Day', color: 'crimson', fireworks: ['#ff8fc1', '#ff6b8a'], lines: ['happy sweet day <3', 'who wants chocolate', 'love is in the air'] },
  3: { name: 'Blossom Festival', color: 'white', fireworks: ['#ffc2d6', '#ffffff'], lines: ['the blossoms are so pretty', 'blossom festival!!', 'petals everywhere'] },
  6: { name: 'Summer Beach Day', color: 'azure', fireworks: ['#8fd3ff', '#ffe36b'], lines: ['beach day!!', 'its so hot lol', 'summer vibes'] },
  7: { name: 'Summer Beach Day', color: 'azure', fireworks: ['#8fd3ff', '#ffe36b'], lines: ['beach day!!', 'summer grind', 'summer vibes'] },
  9: { name: 'Spooky Night', color: 'dark', fireworks: ['#ff9b3a', '#9b6cff', '#7ee081'], lines: ['happy spooky night!!', 'trick or treat', 'boo!', 'nice costume', 'spooky season :3'] },
  11: { name: 'Snow Festival', color: 'white', fireworks: ['#bfe0ff', '#ffffff'], lines: ['snow festival!!', 'happy holidays', 'so cozy', 'who wants hot cocoa'] },
};

export const festivalOn = (date) => FESTIVALS[date.getMonth()] ?? null;

function festivalTick(ev, bots, world, dt, hooks) {
  const f = festivalOn(bots.clock());
  if (!f || !world.map.isTown) return;
  const rng = bots.rng;
  if (ev.festivalMap !== world.map.id) {
    ev.festivalMap = world.map.id;
    world.log?.(`${world.map.name} is celebrating the ${f.name}!`, '#ffe36b');
    ev.fireAt = world.now + 2;
  }
  // Everyone in town dresses for it, and some dance.
  for (const b of bots.list) {
    if (b.map !== world.map.id || b.festive === f.name) continue;
    b.festive = f.name;
    if (rng() < 0.6) hooks.dress(b, f.color);
  }
  ev.danceAt = (ev.danceAt ?? 0) - dt;
  if (ev.danceAt <= 0) {
    ev.danceAt = between(3, 7, rng);
    const b = pick(bots.list.filter((x) => free(x, world)), rng);
    if (b) {
      b.emote = { pose: pick(['kagura', 'cheer', 'flip'], rng), t: 0, dur: 1.2 };
      if (rng() < 0.3 && !b.bubble) shout(world, b, pick(f.lines, rng));
    }
  }
  if (world.now >= ev.fireAt) {
    ev.fireAt = world.now + between(4, 10, rng);
    for (let i = 0; i < 1 + Math.floor(rng() * 3); i++) {
      world.juice.push({ type: 'firework', x: world.body.x + between(-260, 260, rng), y: world.body.y - 60, rise: between(90, 150, rng), color: pick(f.fireworks, rng), delay: i * 0.35 });
    }
  }
}

// ---------- The wandering merchant ----------

const ODD_WARES = ['elixir', 'mana_elixir', 'white_potion', 'mochi_feather', 'mochi_clover'];

function merchant(ev, bots, world, hooks) {
  const rng = bots.rng;
  const towns = hooks.towns();
  const town = world.map.isTown && rng() < 0.4 ? world.map.id : pick(towns, rng);
  const map = hooks.map(town);
  const bot = hooks.logIn({ name: 'Wandering Pip', char: hooks.makeChar(rng, { name: 'Wandering Pip', level: 45, pro: false }), guild: null, style: hooks.makeStyle(), title: '★ Wandering Merchant' }, { map: town, x: map.plaza ?? map.width / 2 });
  if (!bot) return;
  const items = ODD_WARES.filter((id) => ITEMS[id]).map((id) => ({ id, qty: Math.floor(between(3, 12, rng)), price: Math.max(10, Math.round(ITEMS[id].price * between(0.4, 0.8, rng))) }));
  const rare = Object.values(ITEMS).filter((d) => d.type === 'equip' && d.unique && !d.legacy && d.reqLevel <= world.char.level + 5);
  if (rare.length) items.push(hooks.equipFor(pick(rare, rng)));
  Object.assign(bot, { merchant: true, shop: { title: 'Curious Wares (today only!)', items }, state: 'shop', session: 240, stay: 9999, waved: true });
  ev.merchant = { bot, until: world.now + 240 };
  world.log?.(`★ The Wandering Merchant has set up shop in ${map.name}! Odd wares, low prices, a few minutes only.`, '#ffe36b');
  // Word spreads, and some players race there.
  chatter(bots, world, [`MERCHANT IN ${map.name.toUpperCase()}`, 'the wandering merchant is here!!', 'run run run', `${map.name}!! go go`], 2);
  if (town !== world.map.id) for (const b of bots.list.filter((x) => free(x, world)).slice(0, 2)) hooks.travel(b, town);
}

// ---------- Helpers ----------

// (What drives the moment: an announcement, a vow, a winner. It skips chat's wait.)
function shout(world, bot, line) {
  botChat(world, bot, line, { important: true });
}

// Something said a moment from now, in the chat too.
function later(bot, at, line) {
  bot.sayAt = at;
  bot.sayLine = line;
  bot.sayShout = true;
}

// A few people on your map say something, a beat apart.
function chatter(bots, world, lines, n = 2) {
  const rng = bots.rng;
  bots.list.filter((b) => b.map === world.map.id && !b.gone && !b.party).sort(() => rng() - 0.5).slice(0, n)
    .forEach((b, i) => later(b, world.now + 0.8 + i * between(0.8, 1.6, rng), pick(lines, rng)));
}

// ---------- Each frame ----------

// `hooks` (from world/bots.js): logIn(who, { map, x }), makeChar, makeStyle, map(id), towns(),
// townLevels(id), dress(bot, colour), travel(bot, town), equipFor(def).
export function updateEvents(bots, world, dt, hooks) {
  const rng = bots.rng;
  const ev = (bots.events ??= { gmIn: between(240, 480, rng), merchantIn: between(900, 1800, rng) });
  world.expEvent ??= 1;
  const tick = (key, lo, hi, ok, fn) => {
    ev[key] -= dt;
    if (ev[key] > 0 || !ok) return;
    ev[key] = between(lo, hi, rng);
    fn();
  };
  // GM events.
  if (ev.gm) {
    if (world.now >= ev.gm.until) endGm(ev, bots, world);
  } else tick('gmIn', 900, 1800, !world.dungeon, () => doubleExp(ev, bots, world));
  festivalTick(ev, bots, world, dt, hooks);
  // The merchant.
  if (ev.merchant && (world.now >= ev.merchant.until || ev.merchant.bot.gone)) {
    if (!ev.merchant.bot.gone) Object.assign(ev.merchant.bot, { state: 'logout', timer: 0.6, shop: null });
    ev.merchant = null;
  } else if (!ev.merchant) tick('merchantIn', 1500, 3000, !world.dungeon, () => merchant(ev, bots, world, hooks));
}
