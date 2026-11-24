// How the adventurers grow: real EXP from the real maps they hunt (their monsters' own EXP and
// gold), the player's own level curve, and the five growth rules the player approved:
//   1. a spread of ranks: veterans (45-50) never level, they grow in skill and stories
//   2. growth tied to yours: peers grow at a hunter's pace, slow to a crawl two levels above you and
//      stop at three (they never run off and leave you); rookies grow faster until they reach you
//   3. boss walls: the next boss at their level stops them until they learn to beat it
//   4. level sync in groups: a boss fight counts everyone at no more than 3 above the boss
//   5. moving on: a rookie who catches you up becomes a peer
// Time is in game hours (five real minutes each, world/daytime.js). A hunt kills about 10 monsters a
// real minute (the rate the EXP curve was set by), so 50 a game hour, less on monsters above them.
import { ADVENTURER_BY_ID } from '../../data/adventurers.js';
import { bestHunt, bossById, expNeed, jobAt, MAX_LEVEL, tierFor, tierIndex, TIERS, roleOf } from './catalog.js';
import { rand } from './state.js';
import { GAME_HOUR_MS } from '../daytime.js';
import { remember, notice, together, shift } from './social.js';
import { learnBoss, learnMap, mapValue, bossKnow } from './learn.js';

const defOf = (s) => ADVENTURER_BY_ID[s.id];
export const KILLS_PER_HOUR = (10 * GAME_HOUR_MS) / 60000;

// How fast EXP comes to them now, by the growth rules. They hunt only part of their day (they eat,
// sleep, rest, see friends), where your play time is mostly adventuring, so a hunt of theirs counts
// for more (PACE); then it scales by where they stand against you: a peer slows two levels above you
// and stops at three, and the further behind you anyone falls the faster they catch up.
export const PACE = 2.6;
export function growthRate(s, playerLevel) {
  const def = defOf(s);
  if (def.rank === 'veteran' || s.level >= MAX_LEVEL) return 0;
  const gap = s.level - playerLevel;
  if (gap >= 3) return 0;
  if (gap >= 2) return PACE * 0.25;
  if (gap >= 1) return PACE * 0.6;
  // (a rookie stays a step behind you until they've grown into a peer)
  const behind = def.rank === 'rookie' && !s.grown ? Math.max(0, -gap - 2) : Math.max(0, -gap - 1);
  return PACE * Math.min(6, 1 + behind * 0.6) * (def.rank === 'rookie' && !s.grown && gap < -2 ? 1.25 : 1);
}

// The boss standing in their way (their wall): a veteran's own, or the next boss at their level they
// haven't beaten. While a wall stands they can't pass the level just above it.
export function wallOf(s) {
  const def = defOf(s);
  if (def.rank === 'veteran') return def.wall && !s.beaten[def.wall] ? bossById(def.wall) : null;
  const ahead = s.walls ?? [];
  return ahead.map(bossById).find((b) => b && !s.beaten[b.id] && b.level <= s.level + 1) ?? null;
}
// Their wall list: a handful of bosses along their road, picked once by their seed so each has
// their own (not every boss is a wall for everyone).
export function pickWalls(s, allBosses) {
  if (s.walls) return s.walls;
  // (bosses below where they stood when you met are behind them already)
  const solo = allBosses.filter((b) => b.level >= Math.max(6, s.level - 1) && b.level < 50);
  const out = [];
  let lastLevel = -10;
  for (const b of solo) {
    if (b.level - lastLevel < 5) continue;
    if (rand(s) < 0.55) {
      out.push(b.id);
      lastLevel = b.level;
    }
  }
  s.walls = out;
  return out;
}
export const blockedBy = (s) => {
  const w = wallOf(s);
  return w && s.level >= w.level + 1 ? w : null;
};

// EXP in: levels up (one at a time, the player's curve), changes job on the way, notes the moment.
export function gainExp(guild, s, amount, t) {
  const def = defOf(s);
  if (amount <= 0 || s.level >= MAX_LEVEL) return 0;
  if (blockedBy(s)) {
    // (held at the wall: EXP piles up only to the brink of the next level)
    s.exp = Math.min(expNeed(s.level) - 1, s.exp + amount);
    return 0;
  }
  s.exp += amount;
  let ups = 0;
  while (s.exp >= expNeed(s.level) && s.level < MAX_LEVEL && !blockedBy(s)) {
    s.exp -= expNeed(s.level);
    s.level += 1;
    ups += 1;
    s.mood.v = Math.min(1, s.mood.v + 0.15);
    remember(s, t, 'level', `reached level ${s.level}`, { feel: 0.5, sal: s.level % 5 === 0 ? 0.6 : 0.25 });
    const job = jobAt(def, s.level);
    if (job !== s.job) {
      const from = s.job;
      s.job = job;
      remember(s, t, 'job', `became a ${job}`, { feel: 0.9, sal: 0.95, about: from });
      notice(guild, t, `${def.name} became a ${job} today.`, [s.id], 'job');
      s.mood.v = Math.min(1, s.mood.v + 0.3);
    }
    if (s.level % 10 === 0) notice(guild, t, `${def.name} reached level ${s.level}.`, [s.id], 'level');
  }
  if (blockedBy(s)) s.exp = Math.min(s.exp, expNeed(s.level) - 1);
  // (a rookie who has caught you up stands with the peers now)
  if (def.rank === 'rookie' && !s.grown && s.level >= guild.playerLevel - 1 && s.level >= 10) {
    s.grown = true;
    remember(s, t, 'grown', 'got moved up the guild board', { feel: 0.8, sal: 0.8 });
    notice(guild, t, `${def.name} isn't a rookie any more: Halvard moved their name up the board.`, [s.id], 'rank');
  }
  return ups;
}

// A hunt of `hours` on a map: kills, EXP, gold, loot to sell, what they learn of the map, and the
// chance of coming back hurt if they pushed above their level (braver ones push more).
export function hunt(guild, s, map, hours, t) {
  const def = defOf(s);
  const tr = def.traits;
  const gap = map.level - s.level;
  const luck = 0.8 + rand(s) * 0.4;
  const pace = Math.max(0.3, Math.min(1.15, 1 - Math.max(0, gap) * 0.15 + Math.max(0, -gap) * 0.02)) * (0.8 + tr.drive * 0.3) * (1 + s.know.tactics * 0.25);
  const kills = Math.round(KILLS_PER_HOUR * hours * pace * luck);
  // (monsters far below give little: the game's EXP falls off for big gaps)
  const fall = gap < -5 ? Math.max(0.2, 1 + (gap + 5) * 0.12) : 1;
  const exp = Math.round(kills * map.exp * fall * growthRate(s, guild.playerLevel));
  // (half the coin they pick up goes on potions, repairs and the inn)
  const gold = Math.round(kills * map.gold * 0.5);
  s.gold += gold;
  s.loot += Math.round(kills * map.gold * 0.4);
  s.kills = (s.kills ?? 0) + kills;
  const ups = gainExp(guild, s, exp, t);
  // (what it paid against what they'd expect at their level from the best map for it)
  const ref = bestHunt(s.level);
  learnMap(s, map.id, (kills * map.exp * fall) / Math.max(1, KILLS_PER_HOUR * hours * ref.exp));
  let hurt = 0;
  if (gap > 0.5 && rand(s) < gap * 0.07 * (0.6 + tr.bravery * 0.6) * (1 - s.know.tactics * 0.5)) {
    hurt = 2 + rand(s) * 4;
    injure(guild, s, hurt, t, `got knocked about at ${map.name}`);
  }
  return { kills, exp, gold, ups, hurt };
}

// Hurt (nobody dies, the player's rule): hours of rest at the guild before they hunt again.
export function injure(guild, s, hours, t, why) {
  s.injured = Math.max(s.injured, hours);
  s.mood.v = Math.max(-1, s.mood.v - 0.2 * (1.2 - defOf(s).traits.patience));
  remember(s, t, 'hurt', why, { feel: -0.5, sal: 0.45 });
}

// The chance a group beats a boss: their levels (synced to 3 above it), what they know of its
// patterns, their fight sense, who's with them, and whether it takes a group. A veteran's own wall
// is the hardest fight in the world: without you there it almost never falls.
export function winChance(guild, boss, ids, { withYou = false } = {}) {
  const ss = ids.map((id) => guild.adv[id]);
  const eff = ss.reduce((a, s) => a + Math.min(s.level, boss.level + 3), 0) / ss.length - boss.level;
  const mastery = ss.reduce((a, s) => Math.max(a, bossKnow(s, boss.id).mastery), 0) * 0.6 + (ss.reduce((a, s) => a + bossKnow(s, boss.id).mastery, 0) / ss.length) * 0.4;
  const tactics = ss.reduce((a, s) => a + s.know.tactics, 0) / ss.length;
  const roles = new Set(ss.map((s) => roleOf(s.job)));
  const n = ss.length + (withYou ? 1 : 0);
  let x = eff * 0.45 + mastery * 3.4 + tactics * 0.9 - 1.1;
  if (boss.group) x += (n - 3) * 0.45 + (roles.has('tank') ? 0.5 : -0.4) + (roles.has('healer') ? 0.6 : -0.5);
  else x += (n - 1) * 0.35;
  if (withYou) x += 0.6;
  let p = 1 / (1 + Math.exp(-x));
  const vetWall = ss.some((s) => defOf(s).rank === 'veteran' && defOf(s).wall === boss.id);
  if (vetWall && !withYou) p = Math.min(p, 0.04);
  return Math.min(0.95, p);
}

// A try at a boss with a group: win or lose, everyone learns, everyone remembers it together.
export function fightBoss(guild, boss, ids, t, { withYou = false } = {}) {
  const lead = guild.adv[ids[0]];
  const p = winChance(guild, boss, ids, { withYou });
  const won = rand(lead) < p;
  const roles = new Set(ids.map((id) => roleOf(guild.adv[id].job)));
  const names = ids.map((id) => defOf(guild.adv[id]).name);
  for (const id of ids) {
    const s = guild.adv[id];
    const def = defOf(s);
    learnBoss(s, boss.id, { won, healer: roles.has('healer'), tank: roles.has('tank'), withYou });
    if (won) {
      const first = !s.beaten[boss.id];
      s.beaten[boss.id] = t;
      s.gold += Math.round(boss.level * boss.level * 6);
      s.streak = Math.max(0, s.streak) + 1;
      s.mood.v = Math.min(1, s.mood.v + (first ? 0.45 : 0.15));
      s.mood.a = Math.min(1, s.mood.a + 0.3);
      if (first && def.wall === boss.id) s.story = Math.max(s.story, 4);
    } else {
      s.streak = Math.min(0, s.streak) - 1;
      s.mood.v = Math.max(-1, s.mood.v - 0.25 * (1.2 - def.traits.patience));
      injure(guild, s, 1 + rand(s) * 2 * (0.5 + def.traits.bravery), t, `took a beating from ${boss.name.split(',')[0]}`);
    }
    if (withYou) shift(s, 'you', won ? { aff: 0.1, res: 0.12, trust: 0.12 } : { aff: 0.04, trust: 0.05 });
  }
  const who = withYou ? [...ids, 'you'] : ids;
  // (in their own words a boss goes by its short name: "Lady Marigold", not her whole title)
  const short = boss.name.split(',')[0];
  together(guild, ids, t, won ? 'beat' : 'lost', won ? `beat ${short}` : `lost to ${short}`, won ? 0.9 : -0.6, withYou ? ['you'] : []);
  if (won) {
    const firstHere = !guild.firsts?.[boss.id];
    (guild.firsts ??= {})[boss.id] ??= { t, who };
    notice(guild, t, `${listOf(names, withYou)} beat ${boss.name}${firstHere ? ' (a first for the guild!)' : ''}.`, who, 'beat');
  } else if (ids.some((id) => bossKnow(guild.adv[id], boss.id).tries === 3)) {
    // (three losses in, they ask for help on the board: a request you can answer)
    notice(guild, t, `${names[0]} is looking for help with ${boss.name}.`, ids, 'request');
    (guild.requests ??= []).push({ t, by: ids[0], boss: boss.id, open: true });
  }
  return { won, p };
}
const listOf = (names, withYou) => {
  const all = withYou ? [...names, 'you'] : names;
  return all.length === 1 ? all[0] : `${all.slice(0, -1).join(', ')} and ${all.at(-1)}`;
};

// At the shops: loot sold, then the next set of gear if they can afford it (the greedy keep a bigger
// cushion before they spend; nobody spends their last coin).
export function shop(guild, s, t) {
  const def = defOf(s);
  const sold = s.loot;
  s.gold += sold;
  s.loot = 0;
  const want = tierFor(s.level);
  let bought = null;
  if (want && tierIndex(want.id) > tierIndex(s.tier)) {
    const cushion = 1 + def.traits.greed * 0.6;
    if (s.gold >= want.cost * cushion) {
      s.gold -= want.cost;
      s.tier = want.id;
      bought = want.id;
      s.mood.v = Math.min(1, s.mood.v + 0.2);
      remember(s, t, 'gear', `bought a ${want.id} set`, { feel: 0.6, sal: 0.55 });
    }
  }
  return { sold, bought };
}
// The next set they're saving toward (or null).
export function savingFor(s) {
  const want = tierFor(s.level);
  return want && tierIndex(want.id) > tierIndex(s.tier) ? want : null;
}
export { TIERS, mapValue };
