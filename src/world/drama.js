// Server life in town: the goings-on that make it feel like a busy, silly server.
//
//   - Duels: two players square off and spar with their real moves; a crowd gathers and cheers.
//   - Legends: once in a long while a famous top player logs in. Chat goes wild and a few fans
//     follow them around until they leave.
//   - Guilds: recruiting shouts, a recruiter who asks you to join (right-click them: Join guild),
//     guild meetups, guild chat once you're in one, and now and then someone storming out.
//   - AFK: someone goes afk somewhere silly (right on a portal), and people notice.
//   - The clock: how many players are on, and what they talk about, follows the real time of day
//     and the day of the week (night owls at 3am, kids home from school, the weekend rush).

import { COMBOS } from './melee.js';
import { WEAPON_TYPES } from '../core/formulas.js';
import { computeStats } from '../core/stats.js';

const pick = (list, rng) => list[Math.floor(rng() * list.length)];
const between = (a, b, rng) => a + rng() * (b - a);
const WALK = 46;

// ---------- The clock ----------

export function serverTime(date) {
  const h = date.getHours();
  const day = date.getDay();
  const phase = h < 5 ? 'latenight' : h < 8 ? 'early' : h < 15 ? 'day' : h < 18 ? 'afterschool' : h < 23 ? 'evening' : 'latenight';
  return { h, phase, weekend: day === 0 || day === 6 };
}

// How many players are on: fewest late at night, most in the evening and at the weekend.
export function onlineCount(time) {
  const base = { latenight: 13, early: 15, day: 19, afterschool: 23, evening: 26 }[time.phase];
  return base + (time.weekend ? 4 : 0);
}

const TIME_LINES = {
  latenight: ['its 3am why am i still here', 'one more level then bed', 'cant sleep lol', 'night grind gang', 'shh everyone is asleep', 'my mom thinks im asleep', 'gn... jk one more map'],
  early: ['gm everyone', 'morning grind before school', 'coffee + mobs', 'up early to grind'],
  day: ['lunch break grind', 'should be working lol', 'skipped class for this jk', 'quiet today huh'],
  afterschool: ['just got home from school!!', 'homework can wait', 'school was sooo long', 'finally free'],
  evening: ['dinner then grind', 'prime time!', 'so many ppl on tonight', 'evening grind time'],
  weekend: ['weekend grind!!', 'no school tmrw :D', 'all day grind', 'saturday vibes'],
};

export function timeLine(time, rng) {
  return pick(time.weekend && rng() < 0.5 ? TIME_LINES.weekend : TIME_LINES[time.phase], rng);
}

// ---------- Moving people about ----------

// One step toward x; true once there.
function walk(bot, x, dt) {
  const d = x - bot.x;
  if (Math.abs(d) < 3) return true;
  bot.facing = Math.sign(d);
  bot.x += Math.sign(d) * Math.min(Math.abs(d), WALK * 1.3 * dt);
  bot.moving = true;
  return false;
}

const free = (b) => b.state === 'idle' && !b.shop && !b.party && !b.hunter && !b.legend && !b.drama;

function settle(bot, rng) {
  bot.drama = null;
  bot.state = 'idle';
  bot.timer = between(2, 5, rng);
}

// ---------- Duels ----------

// A player's moves, for sparring: their weapon's combo (the job's own pool would need a body).
function sparMoves(bot) {
  const w = (bot.stats ??= computeStats(bot.char)).weaponType;
  const steps = COMBOS[w] ?? (WEAPON_TYPES[w]?.ranged ? COMBOS.bow : COMBOS.none);
  return steps.map((s) => s.move);
}

const DUEL = {
  challenge: ['duel me!!', 'u vs me, right now', 'bet i can beat u', 'spar?'],
  accept: ['ur on', 'oh its ON', 'prepare to lose', 'ok but no crying after'],
  win: ['gg ez', 'gg wp!', 'too easy', 'GG :D', 'better luck next time'],
  lose: ['gg, rematch??', 'LAG!!', 'i let u win', 'gg wp', 'nooo'],
  crowd: (a, b) => [`go ${a}!!`, `${b} u got this`, 'fight fight fight', 'ooh that hit', 'this is so close', 'who do u think wins', '+1 for drama'],
};

function startDuel(d, bots, world, a, b) {
  const rng = bots.rng;
  const cx = Math.max(160, Math.min(world.map.width - 160, (a.x + b.x) / 2));
  const duel = { a, b, cx, hp: new Map([[a, 100], [b, 100]]), phase: 'meet', next: 0, turn: a, crowd: [], cheerAt: world.now + 3 };
  for (const p of [a, b]) {
    p.state = 'duel';
    p.drama = duel;
    p.timer = 0;
  }
  d.shout(a, `${pick(DUEL.challenge, rng)} @${b.name}`);
  // Anyone standing around comes to watch.
  const watchers = bots.list.filter((o) => o.map === world.map.id && free(o) && Math.abs(o.x - cx) < 520).slice(0, 5);
  watchers.forEach((o, i) => {
    o.state = 'watch';
    o.drama = duel;
    o.spot = cx + (i % 2 ? 1 : -1) * (75 + Math.floor(i / 2) * 26);
    duel.crowd.push(o);
  });
  d.duels.push(duel);
  world.log?.(`${a.name} challenged ${b.name} to a duel!`, '#ffd6f0');
}

function tickDuel(duel, d, bots, world, dt) {
  const rng = bots.rng;
  const { a, b, cx } = duel;
  // A duelist called away (logging out, leaving town): it's off.
  if (a.drama !== duel || b.drama !== duel || a.state !== 'duel' || b.state !== 'duel') {
    for (const o of [a, b, ...duel.crowd]) if (o.drama === duel) settle(o, rng);
    return false;
  }
  const here = world.map.id === a.map;
  for (const o of duel.crowd) {
    if (o.drama !== duel) continue;
    if (walk(o, o.spot, dt)) o.facing = Math.sign(cx - o.x) || 1;
  }
  if (duel.phase === 'meet') {
    const ok = walk(a, cx - 36, dt) & walk(b, cx + 36, dt);
    if (ok) {
      a.facing = 1;
      b.facing = -1;
      duel.phase = 'fight';
      duel.next = world.now + 1.2;
      d.say(b, pick(DUEL.accept, rng));
    }
    return true;
  }
  if (duel.phase === 'fight') {
    if (world.now >= duel.next) {
      const atk = duel.turn;
      const def = atk === a ? b : a;
      const move = pick(sparMoves(atk), rng);
      atk.emote = { pose: move, t: 0, dur: 0.5 };
      const dodge = rng() < 0.15;
      const crit = !dodge && rng() < 0.15;
      const dmg = dodge ? 0 : Math.round(between(9, 20, rng) * (crit ? 1.7 : 1));
      duel.hp.set(def, Math.max(0, duel.hp.get(def) - dmg));
      def.hitAt = world.now + 0.22;
      if (here) world.numbers.push({ x: def.x, y: world.map.groundY - 50, text: dodge ? 'MISS' : `${dmg}`, color: dodge ? '#d4cbe8' : crit ? '#ffb347' : '#fff6fb', t: 0, small: !crit, crit });
      if (!dodge) def.emote = { pose: 'guard', t: 0, dur: 0.4 };
      // Usually they trade blows; a hot streak keeps the turn.
      duel.turn = rng() < 0.7 ? def : atk;
      duel.next = world.now + between(0.6, 0.95, rng);
      if (duel.hp.get(def) <= 0) {
        duel.phase = 'end';
        duel.next = world.now + 1;
        duel.winner = atk;
        duel.loser = def;
      }
    }
    if (world.now >= duel.cheerAt && duel.crowd.length) {
      duel.cheerAt = world.now + between(2, 4, rng);
      const o = pick(duel.crowd, rng);
      o.emote = { pose: 'cheer', t: 0, dur: 1 };
      if (!o.bubble) d.say(o, pick(DUEL.crowd(pick([a, b], rng).name, pick([a, b], rng).name), rng));
    }
    return true;
  }
  if (world.now < duel.next) return true;
  const { winner, loser } = duel;
  winner.emote = { pose: 'cheer', t: 0, dur: 1.4 };
  loser.emote = { pose: 'pray', t: 0, dur: 1.4 };
  d.shout(winner, pick(DUEL.win, rng));
  d.say(loser, pick(DUEL.lose, rng));
  world.log?.(`${winner.name} won the duel against ${loser.name}!`, '#ffd6f0');
  for (const o of duel.crowd) {
    if (o.drama !== duel) continue;
    o.emote = { pose: 'cheer', t: 0, dur: 1.2 };
    settle(o, rng);
  }
  settle(a, rng);
  settle(b, rng);
  return false;
}

// ---------- Legends ----------

const LEGENDS = ['Seraphine', 'KuroHime', 'Aurelion', 'Nyxie', 'RoninZero', 'Starweaver', 'Mochizuki', 'Lumina', 'Tsukiyo', 'Valkyra'];
const FAN = (n) => [`OMG ITS ${n.toUpperCase()}`, `${n} is online!!`, `can i have ur autograph ${n}`, `${n} senpai notice me`, 'wait is that THE legend??', 'i cant believe its really them', 'everyone act cool', `${n} pls carry me`];
const LEGEND_SAYS = ['hi everyone :)', 'no autographs pls lol', 'gl on ur grind!', 'just here for pots', 'u guys are sweet <3', 'see u at the top'];

function legendIn(d, bots, world, hooks) {
  const rng = bots.rng;
  const name = LEGENDS.find((n) => !bots.names.has(n)) ?? null;
  if (!name) return;
  bots.names.add(name);
  const char = hooks.makeChar(rng, { name, level: 70, pro: true });
  const bot = hooks.logIn({ name, char, guild: 'Legends', style: hooks.makeStyle(), title: '★ Legend' }, { here: true });
  if (!bot) return;
  bot.legend = true;
  bot.pro = true;
  bot.appear = 1;
  bot.session = between(150, 260, rng);
  bot.stay = 999;
  bot.legendLine = world.now + 6;
  world.log?.(`★ The legendary ${name} has logged in!`, '#ffe36b');
  // The town loses it, and a few fans start following them about.
  const here = bots.list.filter((o) => o.map === bot.map && o !== bot && !o.shop && !o.party && !o.hunter && !o.legend);
  here.slice(0, 4).forEach((o, i) => {
    o.sayAt = world.now + 1 + i * 1.3;
    o.sayLine = pick(FAN(name), rng);
    o.sayShout = true;
  });
  here.filter((o) => free(o) && o.level < 40).slice(0, 2 + Math.floor(rng() * 3)).forEach((o, i) => {
    o.state = 'follow';
    o.drama = { legend: bot, off: (i % 2 ? 1 : -1) * (30 + Math.floor(i / 2) * 22) };
  });
  d.legend = bot;
}

function tickLegend(d, bots, world, dt) {
  const L = d.legend;
  const rng = bots.rng;
  if (!L) return;
  if (L.gone || L.state === 'transit' || L.map == null) {
    for (const o of bots.list) if (o.state === 'follow' && o.drama?.legend === L) {
      settle(o, rng);
      if (!o.bubble && rng() < 0.5) d.say(o, pick(['nooo come back', 'they left :(', 'best day ever'], rng));
    }
    d.legend = null;
    return;
  }
  for (const o of bots.list) {
    if (o.state !== 'follow' || o.drama?.legend !== L) continue;
    if (o.map !== L.map) {
      settle(o, rng);
      continue;
    }
    if (walk(o, L.x + o.drama.off, dt)) o.facing = Math.sign(L.x - o.x) || o.facing;
  }
  if (world.now >= L.legendLine && !L.bubble) {
    L.legendLine = world.now + between(18, 35, rng);
    const near = L.map === world.map.id && Math.abs(L.x - world.body.x) < 200;
    d.shout(L, near && rng() < 0.4 ? `hi ${world.char.name}!` : pick(LEGEND_SAYS, rng));
  }
}

// ---------- Guilds ----------

const RECRUIT = (g, lv) => [`<${g}> recruiting! lv ${lv}+ welcome`, `${g} is looking for chill ppl, pm me`, `join ${g}!! we do guild runs every night`, `<${g}> needs healers and dps!`];
const MEET = ['guild meeting time!', 'who brought snacks', 'lets do a guild run later', 'guild photo!!', 'welcome new members :D', 'whos leading tonight'];
const STORM_OFF = (g) => [`im leaving ${g}. u know what u did`, `bye ${g}, its been real`, `${g} is dead to me`, `quitting ${g}, too much drama`];
const STORM_REPLY = ['wait what happened', 'drama lol', 'nooo come back', 'good riddance', 'here we go again', '*grabs popcorn*'];
const GUILD_CHAT = ['anyone wanna run a dungeon?', 'gz on the level!', 'who needs pots', 'guild meetup this weekend?', 'gn guild <3', 'lol same', 'whos on'];

function recruit(d, bots, world) {
  const rng = bots.rng;
  const here = bots.list.filter((o) => o.map === world.map.id && o.guild && free(o));
  if (!here.length) return;
  const bot = pick(here, rng);
  d.shout(bot, pick(RECRUIT(bot.guild, 5 * Math.max(1, Math.floor(world.char.level / 10))), rng));
  // Not in a guild yet: now and then they come over and ask.
  if (!world.char.guild && rng() < 0.5) {
    bot.state = 'approach';
    bot.waved = true;
    bot.guildOffer = bot.guild;
    bot.hello = pick([`hey wanna join ${bot.guild}? :)`, `${world.char.name}! join ${bot.guild}?`, `we have room in ${bot.guild} if u want`], rng);
  }
}

export function joinGuild(world, bot) {
  if (!bot.guildOffer) return;
  world.char.guild = bot.guildOffer;
  bot.guildOffer = null;
  bot.bubble = { text: pick(['welcome!!', 'yay new member :D', 'welcome to the family'], Math.random), t: 4 };
  world.log(`You joined <${world.char.guild}>!`, '#c9f2ff');
  world.log(`[Guild] ${bot.name}: everyone say hi to ${world.char.name}!!`, '#9fdcff');
}

export function leaveGuild(world) {
  const g = world.char.guild;
  if (!g) return;
  world.char.guild = null;
  world.log(`You left <${g}>.`, '#d4cbe8');
}

function meetup(d, bots, world) {
  const rng = bots.rng;
  const here = bots.list.filter((o) => o.map === world.map.id && free(o));
  if (here.length < 4) return;
  const g = world.char.guild && rng() < 0.5 ? world.char.guild : pick(here.filter((o) => o.guild), rng)?.guild;
  if (!g) return;
  const cx = Math.max(160, Math.min(world.map.width - 160, world.body.x + between(-220, 220, rng)));
  const meet = { g, cx, until: world.now + between(18, 28, rng), next: world.now + 3, people: [] };
  here.slice(0, 3 + Math.floor(rng() * 3)).forEach((o, i) => {
    o.guild = g;
    o.state = 'meet';
    o.drama = meet;
    o.spot = cx + (i - 2) * 24;
    meet.people.push(o);
  });
  d.meets.push(meet);
  if (world.char.guild === g) world.log?.(`[Guild] Meetup in ${world.map.name}!`, '#9fdcff');
}

function tickMeet(meet, d, bots, world, dt) {
  const rng = bots.rng;
  for (const o of meet.people) if (o.drama === meet && walk(o, o.spot, dt)) o.facing = Math.sign(meet.cx - o.x) || o.facing;
  if (world.now >= meet.next) {
    meet.next = world.now + between(3, 6, rng);
    const o = pick(meet.people.filter((p) => p.drama === meet), rng);
    if (o) {
      o.emote = { pose: pick(['cheer', 'flip', 'kagura'], rng), t: 0, dur: 1.1 };
      const line = pick(MEET, rng);
      d.say(o, line);
      if (world.char.guild === meet.g) world.log?.(`[Guild] ${o.name}: ${line}`, '#9fdcff');
    }
  }
  if (world.now < meet.until) return true;
  for (const o of meet.people) if (o.drama === meet) settle(o, rng);
  return false;
}

function stormOff(d, bots, world) {
  const rng = bots.rng;
  const here = bots.list.filter((o) => o.map === world.map.id && o.guild && free(o) && o.guild !== 'Legends');
  if (!here.length) return;
  const bot = pick(here, rng);
  const g = bot.guild;
  d.shout(bot, pick(STORM_OFF(g), rng));
  bot.guild = null;
  bot.emote = { pose: 'roar', t: 0, dur: 1 };
  const others = bots.list.filter((o) => o !== bot && o.map === world.map.id && !o.shop && !o.party && !o.hunter).slice(0, 2);
  others.forEach((o, i) => {
    o.sayAt = world.now + 1.5 + i * 1.8;
    o.sayLine = pick(STORM_REPLY, rng);
    o.sayShout = true;
  });
  if (world.char.guild === g) world.log?.(`[Guild] ${bot.name} has left the guild.`, '#9fdcff');
}

function guildChat(d, bots, world) {
  const g = world.char.guild;
  if (!g) return;
  const rng = bots.rng;
  const who = pick(bots.list.filter((o) => o.guild === g && !o.gone), rng)?.name ?? pick(['mochi_mama', 'Petalwing', 'xXBunXx', 'cocoa_bean', 'Starlit'], rng);
  world.log?.(`[Guild] ${who}: ${pick(GUILD_CHAT, rng)}`, '#9fdcff');
}

// ---------- AFK ----------

const AFK_SAYS = ['brb food', 'afk', 'brb', 'afk 5 min', 'brb mom'];
const AFK_NOTICE = (n) => [`is ${n} afk on the portal lol`, `someone poke ${n}`, `${n}?? hello??`, `${n} has been standing there forever`];

function goAfk(d, bots, world) {
  const rng = bots.rng;
  const portals = world.map.portals.filter((p) => !p.hidden);
  const bot = pick(bots.list.filter((o) => o.map === world.map.id && free(o)), rng);
  if (!bot || !portals.length) return;
  const p = pick(portals, rng);
  bot.state = 'afk';
  bot.drama = { x: p.x, until: world.now + between(40, 80, rng), noticed: false, at: false };
  d.say(bot, pick(AFK_SAYS, rng));
}

function tickAfk(bot, d, bots, world, dt) {
  const A = bot.drama;
  const rng = bots.rng;
  if (!A.at) {
    if (walk(bot, A.x, dt)) {
      A.at = true;
      bot.afkTag = true;
      A.noticeAt = world.now + between(8, 16, rng);
    }
    return;
  }
  if (!A.noticed && world.now >= A.noticeAt) {
    A.noticed = true;
    const o = pick(bots.list.filter((x) => x !== bot && x.map === bot.map && !x.shop && !x.party && !x.hunter && !x.drama), rng);
    if (o) d.shout(o, pick(AFK_NOTICE(bot.name), rng));
  }
  if (world.now < A.until) return;
  bot.afkTag = false;
  d.say(bot, pick(['back', 'back, what did i miss', 'im back lol', 'sorry was eating'], rng));
  settle(bot, rng);
}

// ---------- Each frame ----------

export function createDrama(bots, rng) {
  return { duels: [], meets: [], legend: null, duelIn: between(40, 120, rng), legendIn: between(600, 1500, rng), recruitIn: between(60, 180, rng), meetIn: between(200, 420, rng), stormIn: between(300, 800, rng), guildIn: between(60, 140, rng), afkIn: between(90, 240, rng) };
}

// `hooks` (from world/bots.js): say, shout, logIn, makeChar, makeStyle.
export function updateDrama(bots, world, dt, hooks) {
  const rng = bots.rng;
  const d = (bots.drama ??= createDrama(bots, rng));
  d.say = hooks.say;
  d.shout = hooks.shout;
  // Lines said a beat later.
  for (const o of bots.list) {
    if (o.sayAt == null || world.now < o.sayAt || o.hunter || o.party) continue;
    o.sayAt = null;
    if (o.gone) continue;
    if (o.sayShout && o.map === world.map.id) hooks.shout(o, o.sayLine);
    else hooks.say(o, o.sayLine);
    o.sayShout = false;
  }
  for (const o of bots.list) o.moving = false;
  d.duels = d.duels.filter((x) => !x.a.gone && !x.b.gone && tickDuel(x, d, bots, world, dt));
  d.meets = d.meets.filter((m) => tickMeet(m, d, bots, world, dt));
  tickLegend(d, bots, world, dt);
  for (const o of bots.list) if (o.state === 'afk' && !o.gone) tickAfk(o, d, bots, world, dt);
  // Anything left hanging (a duelist logging out, a meetup ended): back to normal.
  for (const o of bots.list) {
    const lost = (o.state === 'duel' || o.state === 'watch') && !d.duels.includes(o.drama);
    if (lost || (o.state === 'meet' && !d.meets.includes(o.drama))) settle(o, rng);
  }
  guildChatTick(d, bots, world, dt);
  if (!world.map.isTown) return;
  const tick = (key, lo, hi, fn) => {
    d[key] -= dt;
    if (d[key] > 0) return;
    d[key] = between(lo, hi, rng);
    fn();
  };
  tick('duelIn', 90, 200, () => {
    if (d.duels.length) return;
    const here = bots.list.filter((o) => o.map === world.map.id && free(o));
    const a = pick(here, rng);
    const b = a && here.filter((o) => o !== a && Math.abs(o.x - a.x) < 400).sort((x, y) => Math.abs(x.level - a.level) - Math.abs(y.level - a.level))[0];
    if (a && b) startDuel(d, bots, world, a, b);
  });
  tick('legendIn', 1200, 2400, () => {
    if (!d.legend) legendIn(d, bots, world, hooks);
  });
  tick('recruitIn', 120, 300, () => recruit(d, bots, world));
  tick('meetIn', 300, 600, () => {
    if (!d.meets.length) meetup(d, bots, world);
  });
  tick('stormIn', 400, 900, () => stormOff(d, bots, world));
  tick('afkIn', 150, 360, () => goAfk(d, bots, world));
}

function guildChatTick(d, bots, world, dt) {
  d.guildIn -= dt;
  if (d.guildIn > 0) return;
  d.guildIn = between(90, 200, bots.rng);
  guildChat(d, bots, world);
}
