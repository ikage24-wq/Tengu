// Server events and celebrations: the big shared moments that come round now and then.
//
//   - GM events: a Game Master (GM Momo) logs in and runs one: Double EXP for a while, a Mochi
//     Rain (treats and coins pouring out of the sky), or Hide and Seek (GM Momo hides on a map
//     nearby, chat trades hints, and whoever finds them first wins a prize; right-click them).
//   - Invasions: monsters pour into the town you're in. The players there take up arms and fight
//     them off with you, chat in a panic, and cheer when the town's safe.
//   - Festivals: by the real calendar (Spooky Night in October, the Snow Festival in December...),
//     towns celebrate: players dress in the festival's colour, dance, and fireworks go up.
//   - The wandering merchant: once in a long while a peddler sets up in a town for a few minutes
//     with odd wares at odd prices; word spreads and players race there.
//   - Training dummies: players beat on the dummies in Ember Crag and compare their damage.
//   - The fashion show: a host calls one in town; a few players (and you, if you enter: right-
//     click the host) walk the runway in turn, the crowd votes, and the best dressed wins.
//   - Memes: now and then a phrase catches on in chat; everyone says it for a while, then it's over.
//   - Weddings: two players get married in town. Guests gather, the couple meets in the middle,
//     hearts and confetti, and someone catches the bouquet (maybe you).

import { MOBS } from '../data/mobs.js';
import { ITEMS } from '../data/items.js';
import { spawnMob } from './mobs.js';
import { spawnDrops } from './drops.js';
import { createBody } from './physics.js';
import { computeStats } from '../core/stats.js';
import { addItem } from '../core/inventory.js';
import { COMBOS } from './melee.js';

const pick = (list, rng) => list[Math.floor(rng() * list.length)];
const between = (a, b, rng) => a + rng() * (b - a);
const WALK = 46;

function walk(bot, x, dt) {
  const d = x - bot.x;
  if (Math.abs(d) < 3) return true;
  bot.facing = Math.sign(d);
  bot.x += Math.sign(d) * Math.min(Math.abs(d), WALK * 1.3 * dt);
  bot.moving = true;
  return false;
}

// Town folk free to be pulled into something.
const free = (b, world) => b.map === world.map.id && b.state === 'idle' && !b.shop && !b.party && !b.hunter && !b.legend && !b.drama && !b.event;

function release(bot, rng) {
  bot.event = null;
  bot.state = 'idle';
  bot.timer = between(2, 5, rng);
}

const GM = 'GM Momo';

// ---------- GM events ----------

function gmSays(world, text) {
  world.log?.(`[GM] ${GM}: ${text}`, '#ffd24f');
}

function doubleExp(ev, bots, world) {
  const mins = 5;
  ev.gm = { kind: 'exp', until: world.now + mins * 60 };
  world.expEvent = 2;
  gmSays(world, `DOUBLE EXP for the next ${mins} minutes! Go go go!`);
  world.callout = { title: 'Double EXP!', sub: `${mins} minutes, everyone on the server`, color: '#ffd24f', at: world.now };
  chatter(bots, world, ['DOUBLE EXP LETS GOOO', 'gm momo best gm', 'grind time!!', 'everyone to the fields!']);
}

function mochiRain(ev, bots, world) {
  ev.gm = { kind: 'rain', until: world.now + 18, next: world.now };
  gmSays(world, `Mochi Rain on ${world.map.name}! Look up!`);
  world.callout = { title: 'Mochi Rain!', sub: 'Catch what falls!', color: '#ffc2d8', at: world.now };
  chatter(bots, world, ['MOCHI RAIN', 'its raining treats!!', 'mine mine mine', 'yummy']);
}

function rainTick(ev, bots, world) {
  const g = ev.gm;
  if (world.now < g.next) return;
  g.next = world.now + between(0.25, 0.5, bots.rng);
  const rng = bots.rng;
  const x = world.body.x + between(-300, 300, rng);
  const treat = rng() < 0.55 ? { kind: 'gold', amount: Math.round(between(20, 80, rng) * (1 + world.char.level / 10)) } : { kind: 'item', id: pick(['mochi_snack', 'white_potion', 'mochi_snack', 'elixir'].filter((id) => ITEMS[id]), rng), qty: 1 };
  const [d] = spawnDrops([treat], Math.max(30, Math.min(world.map.width - 30, x)), world.body.y - 220);
  d.vy = 0;
  world.drops.push(d);
}

// Somewhere near you GM Momo hides; hints go round, and the first to find them wins.
function hideAndSeek(ev, bots, world, hooks) {
  const rng = bots.rng;
  const maps = [world.map.id, ...world.map.portals.filter((p) => p.to && !p.dungeon && !p.hidden).map((p) => p.to)].filter((id, i, a) => a.indexOf(id) === i);
  const mapId = pick(maps, rng);
  const map = hooks.map(mapId);
  if (!map || map.trial || map.dungeon) return;
  const x = between(120, map.width - 120, rng);
  const bot = hooks.logIn({ name: GM, char: hooks.makeChar(rng, { name: GM, level: 70, pro: true }), guild: 'Staff', style: hooks.makeStyle(), title: '★ Game Master' }, { map: mapId, x });
  if (!bot) return;
  Object.assign(bot, { gm: true, state: 'hide', session: 600, stay: 9999, shop: null, waved: true });
  ev.gm = { kind: 'seek', until: world.now + 8 * 60, bot, map: mapId };
  gmSays(world, `Hide and Seek! I'm hiding somewhere near ${world.map.name}. First to find me wins a prize!`);
  world.callout = { title: 'Hide and Seek!', sub: `Find ${GM} nearby`, color: '#ffd24f', at: world.now };
  const name = map.name;
  ev.hints = [`i think gm is on ${name.split(' ')[0]}... something`, `someone said ${name}??`, `checked here, not here lol`, `gm momo where r u`, `it has to be ${name}`];
  ev.hintAt = world.now + 20;
}

function seekTick(ev, bots, world) {
  const g = ev.gm;
  const bot = g.bot;
  if (world.now >= ev.hintAt && ev.hints.length) {
    ev.hintAt = world.now + between(25, 45, bots.rng);
    chatter(bots, world, [ev.hints.shift()], 1);
  }
  // Found: walking right up to them.
  if (world.map.id === g.map && Math.abs(world.body.x - bot.x) < 34 && !world.dead) found(ev, bots, world);
}

export function found(ev, bots, world) {
  const g = ev.gm;
  if (!g || g.kind !== 'seek' || g.done) return;
  g.done = true;
  const gold = 1000 + world.char.level * 150;
  world.char.gold += gold;
  addItem(world.char.inventory, 'elixir', 3);
  world.char.cash = (world.char.cash ?? 0) + 300;
  g.bot.bubble = { text: 'you found me!!', t: 5 };
  g.bot.emote = { pose: 'cheer', t: 0, dur: 1.4 };
  world.juice.push({ type: 'confetti', x: g.bot.x, y: world.body.y - 60, w: 120 });
  gmSays(world, `${world.char.name} found me! Congrats! (+${gold} gold, 3 Elixirs, 300 Cash)`);
  chatter(bots, world, [`gz ${world.char.name}!!`, 'nooo i was so close', 'how did u find them', 'gg'], 2);
  g.until = world.now + 4;
}

function endGm(ev, bots, world) {
  const g = ev.gm;
  ev.gm = null;
  if (g.kind === 'exp') {
    world.expEvent = 1;
    gmSays(world, 'Double EXP is over. Thanks for playing!');
  } else if (g.kind === 'rain') gmSays(world, 'That\'s all the mochi! See you next time.');
  else if (g.kind === 'seek') {
    if (!g.done) gmSays(world, `Nobody found me! I was on ${g.bot.map ? 'the map with the ' : ''}... it's a secret.`);
    g.bot.state = 'logout';
    g.bot.timer = 0.6;
  }
}

// ---------- Invasions ----------

const PANIC = ['MONSTERS IN TOWN', 'defend the town!!', 'where are the guards??', 'everyone fight!', 'my shop!!!', 'protect the newbies'];

function invade(ev, bots, world, hooks) {
  const rng = bots.rng;
  const map = world.map;
  const [lo, hi] = hooks.townLevels(map.id);
  const kinds = Object.values(MOBS).filter((d) => !d.boss && d.level >= lo && d.level <= hi + 4 && d.atk > 0 && !d.fight?.mender);
  if (!kinds.length) return;
  const n = 9 + Math.floor(rng() * 5);
  const mobs = [];
  for (let i = 0; i < n; i++) {
    const def = pick(kinds, rng);
    const x = Math.max(80, Math.min(map.width - 80, world.body.x + (i % 2 ? 1 : -1) * between(180, 700, rng)));
    const m = spawnMob(map, { mob: def.id, x, y: map.groundY });
    m.invader = true;
    m.aggroUntil = Infinity;
    mobs.push(m);
  }
  world.mobs.push(...mobs);
  // The players in town take up arms: they're out fighting in it now, with bodies of their own.
  const fighters = bots.list.filter((b) => free(b, world) && b.level >= 10).slice(0, 5);
  world.invading = true;
  for (const b of fighters) {
    b.event = 'defend';
    b.hunter = true;
    b.raid = true;
    b.helping = Infinity;
    b.body = createBody(b.x, map.groundY);
    b.stats = computeStats(b.char);
    b.state = 'hunt';
  }
  ev.invasion = { map: map.id, mobs, fighters, panicAt: world.now + 1 };
  world.log?.(`★ Monsters are invading ${map.name}! Defend the town!`, '#ff9eb8');
  world.callout = { title: 'Invasion!', sub: `Monsters in ${map.name}`, color: '#ff6b8a', at: world.now };
  world.juice.push({ type: 'shake', mag: 3, dur: 0.4 });
}

function invasionTick(ev, bots, world) {
  const inv = ev.invasion;
  const rng = bots.rng;
  if (world.now >= inv.panicAt) {
    inv.panicAt = world.now + between(4, 9, rng);
    const b = pick(bots.list.filter((x) => x.map === inv.map && !x.gone && (x.event === 'defend' || free(x, world))), rng);
    if (b && !b.bubble) shout(world, b, pick(PANIC, rng));
  }
  const left = inv.mobs.filter((m) => m.hp > 0 && world.mobs.includes(m)).length;
  if (left && world.map.id === inv.map) return;
  // Over: the town's safe (or you left it to its fate).
  ev.invasion = null;
  world.invading = false;
  for (const m of inv.mobs) if (m.hp > 0) m.hp = 0;
  for (const b of inv.fighters) {
    if (b.gone) continue;
    Object.assign(b, { hunter: false, raid: false, helping: null, body: null, down: false, tomb: false, attack: null, brain: null, fight: null, map: inv.map });
    release(b, rng);
    if (!left) b.emote = { pose: 'cheer', t: 0, dur: 1.2 };
  }
  if (!left) {
    world.log?.(`★ ${world.map.name} is safe! Everyone cheers.`, '#ffe36b');
    world.juice.push({ type: 'confetti', x: world.body.x, y: world.body.y - 120, w: 360, count: 60 });
    chatter(bots, world, ['WE DID IT', 'town saved!!', 'gg everyone', 'heroes of the day', 'my shop survived :D'], 3);
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

const ODD_WARES = ['elixir', 'mana_elixir', 'white_potion', 'mochi_snack', 'mochi_feather', 'mochi_clover'];

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

// ---------- Training dummies ----------

function dummies(ev, bots, world, dt) {
  const spots = (world.map.deco ?? []).filter((d) => d[0] === 'dummy').map((d) => d[1]);
  if (!spots.length) return;
  const rng = bots.rng;
  for (const x of spots) {
    let b = bots.list.find((o) => o.event === 'dummy' && o.dummyX === x && o.map === world.map.id);
    if (!b) {
      if (rng() > dt * 0.05) continue;
      b = pick(bots.list.filter((o) => free(o, world)), rng);
      if (!b) continue;
      Object.assign(b, { event: 'dummy', dummyX: x, state: 'dummy', dummyUntil: world.now + between(15, 30, rng), swingAt: 0, total: 0 });
    }
    if (b.gone || b.map !== world.map.id) continue;
    const spot = x - 26;
    if (!walk(b, spot, dt)) continue;
    b.facing = 1;
    if (world.now >= b.swingAt) {
      b.swingAt = world.now + between(0.55, 0.9, rng);
      const w = (b.stats ??= computeStats(b.char)).weaponType;
      b.emote = { pose: pick((COMBOS[w] ?? COMBOS.none).map((s) => s.move), rng), t: 0, dur: 0.45 };
      const hit = Math.round(between(0.8, 1.25, rng) * (20 + b.level * b.level * 0.6));
      b.total += hit;
      world.numbers.push({ x, y: world.map.groundY - 44, text: `${hit}`, color: '#fff6fb', t: 0, small: true });
    }
    if (world.now >= b.dummyUntil) {
      shout(world, b, pick([`${Math.round(b.total / 20)} dps, not bad`, `my dps is ${(b.total / 20 / 1000).toFixed(1)}k`, 'this dummy is tanky', 'new weapon feels good', `${b.total} total, beat that`], rng));
      release(b, rng);
    }
  }
}

// ---------- The fashion show ----------

function fashionShow(ev, bots, world) {
  const rng = bots.rng;
  const host = pick(bots.list.filter((b) => free(b, world)), rng);
  if (!host) return;
  const cx = Math.max(200, Math.min(world.map.width - 200, world.body.x + between(-150, 150, rng)));
  const models = bots.list.filter((b) => free(b, world) && b !== host).sort((a, b) => Object.keys(b.char.outfit ?? {}).length - Object.keys(a.char.outfit ?? {}).length).slice(0, 3);
  if (models.length < 2) return;
  const show = { host, cx, models, entries: [...models], i: -1, at: world.now + 25, phase: 'call', crowd: [] };
  host.event = 'host';
  host.showHost = show;
  host.state = 'event';
  for (const m of models) Object.assign(m, { event: 'model', state: 'event' });
  shout(world, host, `FASHION SHOW in ${world.map.name} in 25 sec! entries welcome (talk to me)`);
  world.log?.(`★ A fashion show is starting in ${world.map.name}! Right-click ${host.name} to enter.`, '#ffd6f0');
  ev.show = show;
}

export function enterShow(world, bot) {
  const show = bot.showHost;
  if (!show || show.phase !== 'call' || show.you) return;
  show.you = true;
  show.entries.push('you');
  bot.bubble = { text: `${world.char.name} is in! ooh`, t: 4 };
  world.log(`You entered the fashion show! Stand by ${bot.name} when it starts.`, '#ffd6f0');
}

// How good a look is: outfit pieces, set pieces, rarity, and a little luck.
function styleScore(char, rng) {
  const outfit = Object.values(char.outfit ?? {}).filter(Boolean).length;
  const gear = Object.values(char.equipment ?? {}).filter(Boolean);
  return outfit * 3 + gear.length + gear.reduce((n, g) => n + (g.rarity ?? 0), 0) + rng() * 6;
}

function showTick(ev, bots, world, dt) {
  const s = ev.show;
  const rng = bots.rng;
  const { cx, host } = s;
  walk(host, cx - 70, dt);
  if (s.phase === 'call') {
    s.models.forEach((m, i) => walk(m, cx + 70 + i * 22, dt));
    if (world.now < s.at) return;
    s.phase = 'walk';
    // A crowd to watch.
    s.crowd = bots.list.filter((b) => free(b, world) && Math.abs(b.x - cx) < 600).slice(0, 6);
    s.crowd.forEach((b, i) => Object.assign(b, { event: 'crowd', state: 'event', spot: cx + (i % 2 ? 1 : -1) * (40 + Math.floor(i / 2) * 22) }));
    shout(world, host, 'and the show begins!! first up...');
    s.next = world.now + 1;
  }
  for (const b of s.crowd) if (walk(b, b.spot, dt)) b.facing = Math.sign(cx - b.x) || 1;
  if (s.phase === 'walk') {
    if (world.now < s.next) {
      const m = s.entries[s.i];
      if (m && m !== 'you') walk(m, s.runTo, dt);
      return;
    }
    s.i += 1;
    const m = s.entries[s.i];
    if (!m) {
      s.phase = 'vote';
      s.next = world.now + 3;
      shout(world, host, 'ok everyone VOTE! who looked best?');
      return;
    }
    s.runTo = cx + (s.i % 2 ? -40 : 40);
    s.next = world.now + 4.5;
    if (m === 'you') {
      shout(world, host, `next: ${world.char.name}!! strike a pose`);
      return;
    }
    shout(world, host, `next: ${m.name}!`);
    m.emote = { pose: pick(['cheer', 'flip', 'kagura'], rng), t: 0, dur: 1.2 };
    const fan = pick(s.crowd, rng);
    if (fan) later(fan, world.now + 2, pick(['SLAY', 'the colors!!', 'ok thats cute', 'where did u get that', '10/10'], rng));
    return;
  }
  if (s.phase === 'vote' && world.now >= s.next) {
    const scores = s.entries.map((e) => ({ e, v: styleScore(e === 'you' ? world.char : e.char, rng) }));
    scores.sort((a, b) => b.v - a.v);
    const win = scores[0].e;
    const name = win === 'you' ? world.char.name : win.name;
    shout(world, host, `the winner is... ${name}!!!`);
    world.log?.(`★ ${name} won the fashion show!`, '#ffe36b');
    world.juice.push({ type: 'confetti', x: win === 'you' ? world.body.x : win.x, y: world.map.groundY - 120, w: 120 });
    if (win === 'you') {
      const prize = 800 + world.char.level * 60;
      world.char.gold += prize;
      world.log?.(`You won ${prize} gold for best dressed!`, '#ffe36b');
    } else win.emote = { pose: 'cheer', t: 0, dur: 1.4 };
    for (const b of [host, ...s.models, ...s.crowd]) release(b, rng);
    host.showHost = null;
    ev.show = null;
  }
}

// ---------- Memes ----------

const MEMES = [
  ['snail gang', ['snail gang', 'SNAIL GANG', 'snail gang forever', 'join snail gang']],
  ['skill issue', ['skill issue', 'sounds like a skill issue', 'skill issue tbh']],
  ['touch grass', ['touch grass', 'go touch grass', 'i touched grass once']],
  ['mochi > all', ['mochi > all', 'mochi supremacy', 'mochi > everything']],
  ['its free exp', ['its free exp', 'free exp!!', 'free exp tho']],
  ['potato', ['potato', 'POTATO', 'potato?', 'i am a potato']],
  ['ok but why', ['ok but why', 'but WHY', 'ok but why tho']],
];

// The meme going round now, if any: what bots say instead of their usual line now and then.
export function memeLine(bots, rng) {
  const m = bots.events?.meme;
  if (!m || m.over) return null;
  return rng() < 0.35 ? pick(m.lines, rng) : null;
}

function memeTick(ev, bots, world) {
  const rng = bots.rng;
  const m = ev.meme;
  if (!m) return;
  if (world.now >= m.until && !m.over) {
    m.over = true;
    const b = pick(bots.list.filter((x) => x.map === world.map.id && !x.party && !x.gone), rng);
    if (b) shout(world, b, pick([`ok the ${m.word} thing is over`, `can we stop with the ${m.word} now`, `${m.word} was funnier yesterday`], rng));
    ev.meme = null;
  }
}

function startMeme(ev, bots, world) {
  const rng = bots.rng;
  const [word, lines] = pick(MEMES, rng);
  ev.meme = { word, lines, until: world.now + between(150, 240, rng) };
  const b = pick(bots.list.filter((x) => x.map === world.map.id && !x.party && !x.gone), rng);
  if (b) shout(world, b, lines[0]);
}

// You say it too: they lose it.
export function heardMeme(bots, world, words) {
  const m = bots.events?.meme;
  if (!m || m.over || !words.toLowerCase().includes(m.word.split(' ')[0])) return false;
  chatter(bots, world, [`LMAO ${world.char.name} said it`, `${world.char.name} gets it`, `${m.word.toUpperCase()}`], 2);
  return true;
}

// ---------- Weddings ----------

function wedding(ev, bots, world) {
  const rng = bots.rng;
  const here = bots.list.filter((b) => free(b, world));
  if (here.length < 5) return;
  const [a, b] = here.sort(() => rng() - 0.5);
  const cx = Math.max(200, Math.min(world.map.width - 200, world.map.plaza ?? world.body.x));
  const guests = here.filter((g) => g !== a && g !== b).slice(0, 7);
  const w = { a, b, cx, guests, phase: 'gather', at: world.now + 10, kissAt: 0 };
  for (const p of [a, b, ...guests]) Object.assign(p, { event: 'wedding', state: 'event' });
  guests.forEach((g, i) => (g.spot = cx + (i % 2 ? 1 : -1) * (60 + Math.floor(i / 2) * 22)));
  world.log?.(`★ ${a.name} and ${b.name} are getting married in ${world.map.name}! Everyone's invited.`, '#ffd6f0');
  shout(world, a, `${b.name} and i are getting married!! come to ${world.map.name} :D`);
  ev.wedding = w;
}

function weddingTick(ev, bots, world, dt) {
  const w = ev.wedding;
  const rng = bots.rng;
  const { a, b, cx } = w;
  for (const g of w.guests) if (walk(g, g.spot, dt)) g.facing = Math.sign(cx - g.x) || 1;
  const ready = walk(a, cx - 14, dt) & walk(b, cx + 14, dt);
  if (ready) {
    a.facing = 1;
    b.facing = -1;
  }
  if (w.phase === 'gather' && world.now >= w.at && ready) {
    w.phase = 'vows';
    w.at = world.now + 5;
    shout(world, a, 'i do!!');
    later(b, world.now + 1.8, 'i do <3');
  } else if (w.phase === 'vows' && world.now >= w.at) {
    w.phase = 'kiss';
    w.at = world.now + 4;
    world.juice.push({ type: 'hearts', x: cx, y: world.map.groundY - 50, count: 14 });
    world.juice.push({ type: 'confetti', x: cx, y: world.map.groundY - 130, w: 260, count: 70 });
    for (const g of w.guests) {
      g.emote = { pose: 'cheer', t: 0, dur: 1.3 };
      if (rng() < 0.4) later(g, world.now + between(0.3, 2.5, rng), pick(['congrats!!', 'so cute', 'im not crying ur crying', 'kiss!!', 'best wedding ever', 'where is the cake'], rng));
    }
    world.log?.(`★ ${a.name} and ${b.name} are married!`, '#ffd6f0');
  } else if (w.phase === 'kiss' && world.now >= w.at) {
    // The bouquet: to a guest, or to you if you're there.
    const near = world.map.id === a.map && Math.abs(world.body.x - cx) < 260;
    const you = near && rng() < 0.5;
    const catcher = you ? null : pick(w.guests, rng);
    shout(world, b, 'bouquet toss!!');
    if (you) {
      addItem(world.char.inventory, 'elixir', 1);
      world.log?.('You caught the bouquet! (+1 Elixir, and good luck in love)', '#ffd6f0');
      world.juice.push({ type: 'hearts', x: world.body.x, y: world.body.y - 40, count: 6 });
    } else if (catcher) {
      later(catcher, world.now + 0.8, 'I CAUGHT IT');
    }
    for (const p of [a, b, ...w.guests]) release(p, rng);
    a.spouse = b.name;
    b.spouse = a.name;
    ev.wedding = null;
  }
}

// ---------- Helpers ----------

function shout(world, bot, line) {
  bot.bubble = { text: line, t: 4.5 };
  if (bot.map === world.map.id) world.log?.(`${bot.name}: ${line}`, '#e6dcff');
}

// Something said a moment from now, in the chat too.
function later(bot, at, line) {
  bot.sayAt = at;
  bot.sayLine = line;
  bot.sayShout = true;
}

// A few people on your map say something, a beat apart.
function chatter(bots, world, lines, n = 3) {
  const rng = bots.rng;
  bots.list.filter((b) => b.map === world.map.id && !b.gone && !b.party).sort(() => rng() - 0.5).slice(0, n)
    .forEach((b, i) => later(b, world.now + 0.8 + i * between(0.8, 1.6, rng), pick(lines, rng)));
}

// ---------- Each frame ----------

// `hooks` (from world/bots.js): logIn(who, { map, x }), makeChar, makeStyle, map(id), towns(),
// townLevels(id), dress(bot, colour), travel(bot, town), equipFor(def).
export function updateEvents(bots, world, dt, hooks) {
  const rng = bots.rng;
  const ev = (bots.events ??= { gmIn: between(240, 480, rng), invadeIn: between(600, 1200, rng), merchantIn: between(900, 1800, rng), showIn: between(500, 900, rng), memeIn: between(200, 500, rng), weddingIn: between(900, 1800, rng) });
  world.expEvent ??= 1;
  const tick = (key, lo, hi, ok, fn) => {
    ev[key] -= dt;
    if (ev[key] > 0 || !ok) return;
    ev[key] = between(lo, hi, rng);
    fn();
  };
  const town = world.map.isTown && !world.dungeon;
  // GM events.
  if (ev.gm) {
    if (ev.gm.kind === 'rain') rainTick(ev, bots, world);
    if (ev.gm.kind === 'seek') seekTick(ev, bots, world);
    if (world.now >= ev.gm.until) endGm(ev, bots, world);
  } else tick('gmIn', 900, 1800, !world.dungeon, () => pick([doubleExp, mochiRain, hideAndSeek], rng)(ev, bots, world, hooks));
  // Invasions.
  if (ev.invasion) invasionTick(ev, bots, world);
  else tick('invadeIn', 1200, 2400, town && !ev.show && !ev.wedding, () => invade(ev, bots, world, hooks));
  festivalTick(ev, bots, world, dt, hooks);
  // The merchant.
  if (ev.merchant && (world.now >= ev.merchant.until || ev.merchant.bot.gone)) {
    if (!ev.merchant.bot.gone) Object.assign(ev.merchant.bot, { state: 'logout', timer: 0.6, shop: null });
    ev.merchant = null;
  } else if (!ev.merchant) tick('merchantIn', 1500, 3000, !world.dungeon, () => merchant(ev, bots, world, hooks));
  if (town) dummies(ev, bots, world, dt);
  if (ev.show) showTick(ev, bots, world, dt);
  else tick('showIn', 900, 1600, town && !ev.invasion && !ev.wedding, () => fashionShow(ev, bots, world));
  memeTick(ev, bots, world);
  tick('memeIn', 400, 900, !ev.meme, () => startMeme(ev, bots, world));
  if (ev.wedding) weddingTick(ev, bots, world, dt);
  else tick('weddingIn', 1500, 2700, town && !ev.invasion && !ev.show, () => wedding(ev, bots, world));
  // Anyone pulled into something that's since ended goes back to normal.
  for (const b of bots.list) {
    if (b.event === 'model' || b.event === 'host' || b.event === 'crowd') if (!ev.show) release(b, rng);
    if (b.event === 'wedding' && !ev.wedding) release(b, rng);
  }
}
