// Server life in town: the goings-on that make it feel like a busy, silly server.
//
//   - Duels: two players square off and spar with their real moves; a crowd gathers and cheers.
//   - The clock: what players talk about follows the real time of day and the day of the week
//     (night owls at 3am, kids home from school, the weekend rush).

import { COMBOS } from './melee.js';
import { WEAPON_TYPES } from '../core/formulas.js';
import { computeStats } from '../core/stats.js';
import { happened } from './chatter.js';

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

// How many players are on: always a full server (an emptier one late at night only made it duller).
export const ONLINE = 26;

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

const free = (b) => b.state === 'idle' && !b.shop && !b.party && !b.hunter && !b.drama && !b.event && !b.life;

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
  happened(bots, world, `${winner.name} beating ${loser.name} in that duel`);
  for (const o of duel.crowd) {
    if (o.drama !== duel) continue;
    o.emote = { pose: 'cheer', t: 0, dur: 1.2 };
    settle(o, rng);
  }
  settle(a, rng);
  settle(b, rng);
  return false;
}

// ---------- Each frame ----------

export function createDrama(bots, rng) {
  return { duels: [], duelIn: between(40, 120, rng) };
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
  // Anything left hanging (a duelist logging out): back to normal.
  for (const o of bots.list) {
    if ((o.state === 'duel' || o.state === 'watch') && !d.duels.includes(o.drama)) settle(o, rng);
  }
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
    // A challenge starts where people are standing about, so a crowd can gather to watch.
    const near = (o) => here.filter((p) => p !== o && Math.abs(p.x - o.x) < 520).length;
    const most = Math.max(0, ...here.map(near));
    const a = pick(here.filter((o) => near(o) >= most * 0.6), rng);
    const b = a && here.filter((o) => o !== a && Math.abs(o.x - a.x) < 400).sort((x, y) => Math.abs(x.level - a.level) - Math.abs(y.level - a.level))[0];
    if (a && b) startDuel(d, bots, world, a, b);
  });
}
