// How an adventurer decides what to do: needs that run down through the day, a mood that rises and
// falls with what happens, a goal they're working toward, their personality, what they've learned
// pays off, who's around, the hour, and a little of their own unpredictability. Every option gets a
// score from all of that and they pick the best; the reasons behind the pick are kept (`why`), so
// what they say about it is true.
//
// Needs (0 empty .. 1 full): energy (sleep, rest), food (meals), social (company), fun (hobbies,
// exploring, play), purpose (progress: hunting, training, bosses, teaching).
// Mood: valence v (-1 down .. 1 happy) and arousal a (0 calm .. 1 fired up); it drifts back to their
// own baseline (warm, patient people sit higher).
import { ADVENTURER_BY_ID } from '../../data/adventurers.js';
import { bestHunt, huntingMaps } from './catalog.js';
import { rand } from './state.js';
import { valueOf, mapValue, bossKnow } from './learn.js';
import { wallOf, savingFor, winChance, blockedBy } from './grow.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const defOf = (s) => ADVENTURER_BY_ID[s.id];

// Where things happen. The guild (Coinbridge) has its hall, kitchen (the tea corner), training yard
// and bunks; everything else is a town or a map id.
export const GUILD = { hall: 'guild:hall', kitchen: 'guild:kitchen', yard: 'guild:yard', bunks: 'guild:bunks' };
const TOWNS = new Set(['sprout', 'harbor', 'crag', 'grove', 'lagoon', 'coinbridge']);
const HOBBY_PLACE = { fishing: 'lagoon', cooking: GUILD.kitchen, crafting: 'coinbridge', drawing: null, gathering: null };

// Their day: when they go to bed, by who they are (some are night owls), and how long they sleep.
export function rhythm(s) {
  const t = defOf(s).traits;
  const h = [...s.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const bed = 21 + (h % 5) * 0.6 + (t.curiosity > 0.8 ? 0.8 : 0) - (t.patience > 0.85 ? 0.6 : 0);
  return { bed: bed % 24, sleep: 6.5 + (1 - t.stamina) * 2 };
}
const hourDist = (a, b) => Math.min(Math.abs(a - b), 24 - Math.abs(a - b));
// How much the hour says "bed": 0 by day, up to 1 at their bedtime and through the night.
export function sleepiness(s, hour) {
  const { bed, sleep } = rhythm(s);
  const into = (hour - bed + 24) % 24;
  if (into < sleep) return 1;
  if (into > 24 - 1.5) return (into - 22.5) / 1.5;
  return 0;
}
const mealTime = (hour) => Math.max(0, 1 - Math.min(hourDist(hour, 7.5), hourDist(hour, 12.5), hourDist(hour, 18.5)));

// Needs and mood over `h` game hours of an activity.
const BASE = { energy: -0.042, food: -0.06, social: -0.035, fun: -0.03, purpose: -0.025 };
const ACT_NEEDS = {
  sleep: { energy: 0.17, food: -0.02 },
  eat: { food: 1.2, social: 0.06, fun: 0.04 },
  hunt: { energy: -0.025, purpose: 0.05, fun: 0.01 },
  bounty: { energy: -0.025, purpose: 0.07, fun: 0.02 },
  boss: { energy: -0.12, purpose: 0.15 },
  train: { energy: -0.025, purpose: 0.04 },
  shop: { fun: 0.05, purpose: 0.02 },
  hobby: { fun: 0.12, energy: 0.01 },
  social: { social: 0.2, fun: 0.04 },
  rest: { energy: 0.07, fun: 0.02 },
  explore: { fun: 0.11, purpose: 0.02, energy: -0.02 },
  mentor: { social: 0.1, purpose: 0.05 },
  home: { social: 0.08, fun: 0.06, energy: 0.02 },
  party: { purpose: 0.06, social: 0.08, fun: 0.04, energy: -0.03 },
};
export function liveHours(s, kind, h, company = 0) {
  const t = defOf(s).traits;
  const n = s.needs;
  const k = ACT_NEEDS[kind] ?? {};
  const drain = { energy: 1.3 - t.stamina * 0.6, food: 1, social: 0.4 + t.warmth, fun: 0.5 + t.curiosity * 0.7, purpose: 0.4 + t.drive };
  for (const need of Object.keys(n)) {
    const own = k[need] ?? 0;
    const base = kind === 'sleep' && need !== 'energy' ? 0 : BASE[need] * drain[need];
    n[need] = clamp01(n[need] + (own + base) * h);
  }
  // (company lifts the social need a little, in a town or at the guild; out hunting, less)
  const town = typeof s.place === 'string' && (s.place.startsWith('guild') || TOWNS.has(s.place));
  if (company > 0 && kind !== 'sleep') n.social = clamp01(n.social + (town ? 0.025 : 0.01) * Math.min(2, company) * h);
  if (s.injured > 0) s.injured = Math.max(0, s.injured - h * (kind === 'rest' || kind === 'sleep' ? 1 : 0.4));
  // (mood drifts home, and unmet needs pull it down)
  const home = 0.1 + t.warmth * 0.15 + t.patience * 0.1;
  const lack = Object.values(n).reduce((a, v) => a + Math.max(0, 0.3 - v), 0);
  s.mood.v = Math.max(-1, Math.min(1, s.mood.v + (home - s.mood.v) * 0.08 * h - lack * 0.12 * h));
  s.mood.a = clamp01(s.mood.a + (0.3 + t.bravery * 0.2 - s.mood.a) * 0.15 * h + (kind === 'sleep' ? -0.05 * h : 0));
}

// What they're working toward now (looked at again after anything big): back on their feet, their
// first job, a boss in the way, the next set of gear, or simply the next level; a veteran's is
// their wall and the rookies they look after.
export function chooseGoal(guild, s) {
  const def = defOf(s);
  if (s.injured > 0.5) return { kind: 'recover' };
  if (def.path && s.level < 5) return { kind: 'job', target: def.path };
  const wall = wallOf(s);
  if (wall && (def.rank === 'veteran' || s.level >= wall.level - 1)) return { kind: 'wall', target: wall.id };
  const save = savingFor(s);
  if (save && s.gold < save.cost * 1.3) return { kind: 'gear', target: save.id };
  if (def.rank === 'veteran') return { kind: 'mentor' };
  return { kind: 'level', target: s.level + 1 };
}

// Every option scored. ctx: { hour, here: ids at their place, guild, ... }.
export function options(guild, s, ctx) {
  const def = defOf(s);
  const t = def.traits;
  const n = s.needs;
  const goal = s.goal ?? { kind: 'level' };
  const night = sleepiness(s, ctx.hour);
  const hurt = s.injured > 0.5;
  const fired = s.mood.a;
  // (held at a wall: hunting earns them nothing now, and they know it)
  const held = blockedBy(s) && def.rank !== 'veteran';
  const low = Math.max(0, -s.mood.v);
  const out = [];
  const add = (kind, score, why, extra = {}) => out.push({ kind, score: score + valueOf(s, kind) * 0.45, why, ...extra });

  add('sleep', (1 - n.energy) ** 2 * 2.6 + night * 1.8 - (night === 0 ? 1.4 * n.energy : 0) + (hurt ? 0.3 : 0), night > 0.5 ? 'late' : 'tired', { place: GUILD.bunks });
  add('eat', (1 - n.food) ** 2 * 3 + mealTime(ctx.hour) * 0.5 * (1 - n.food) - (n.food > 0.85 ? 1 : 0), 'hungry', { place: GUILD.kitchen });
  if (!hurt && def.rank !== 'veteran' && !(def.rank === 'peer' && s.level - guild.playerLevel >= 3)) {
    const prefer = Object.fromEntries(huntingMaps().map((m) => [m.id, mapValue(s, m.id)]));
    const map = bestHunt(s.level, prefer);
    const goalFit = goal.kind === 'level' || goal.kind === 'job' ? 0.5 : goal.kind === 'gear' ? 0.35 : 0.15;
    add('hunt', 0.35 + t.drive * 0.55 + goalFit + (1 - n.purpose) * 0.7 + fired * 0.2 - (1 - n.energy) * 0.9 - low * 0.3 - night * 1.2, goal.kind === 'gear' ? 'saving' : 'levels', { place: map.id, map });
    out.at(-1).score -= (1 - n.energy) ** 2 * 1.2 + (held ? 0.9 : 0);
  }
  if (!hurt && def.rank === 'veteran') {
    // (veterans still go out: to keep sharp, for the gold, for the fun of it)
    const map = bestHunt(Math.max(1, s.level - 2 - Math.floor(rand(s) * 6)));
    add('hunt', 0.15 + t.drive * 0.35 + (1 - n.purpose) * 0.5 - (1 - n.energy) * 0.9 - night * 1.2, 'keep sharp', { place: map.id, map });
  }
  const bounty = !hurt && (guild.bounties ?? []).find((b) => !b.taken && Math.abs(b.level - s.level) <= 3);
  if (bounty) add('bounty', 0.4 + t.greed * 0.6 + t.drive * 0.25 + (1 - n.purpose) * 0.5 - (1 - n.energy) * 0.9 - night * 1.2, 'bounty', { place: bounty.map, bounty });
  if (!hurt && goal.kind === 'wall') {
    const boss = wallOf(s);
    if (boss) {
      const p = winChance(guild, boss, [s.id]);
      const know = bossKnow(s, boss.id);
      const ready = p + t.bravery * 0.25 + t.pride * 0.1 - 0.35;
      // (a veteran goes at their wall about once a week, whatever the odds: it's who they are)
      const vetTry = def.rank === 'veteran' && ctx.t - (s.lastBossT ?? ctx.t - 100) > 24 * (5 + (1 - t.drive) * 4) ? 1.1 : 0;
      // (held there, every day they don't try it weighs on them more: determination)
      // (a game day is two real hours, so this builds over a few of them)
      const stuck = held ? 0.7 + Math.min(0.8, (ctx.t - (s.lastBossT ?? ctx.t - 24)) / 12) : 0;
      add('boss', 0.3 + vetTry + stuck + ready * 1.6 + fired * 0.3 + (s.streak < -2 && !held ? -0.5 : 0) - (1 - n.energy) * 1.2 - night * 1.3 - (know.tries > 0 && s.lastBossT && ctx.t - s.lastBossT < 3 ? 1 : 0), 'wall', { place: boss.map ?? 'away', boss });
    }
  }
  const wall = wallOf(s);
  add('train', 0.2 + t.drive * 0.35 + t.patience * 0.2 + (goal.kind === 'wall' ? 0.45 : 0) + (held ? 0.4 : 0) + (1 - n.purpose) * 0.4 - (1 - n.energy) * 0.6 - night * 1.2 - (hurt ? 0.5 : 0), goal.kind === 'wall' ? 'wall' : 'sharpen', { place: GUILD.yard, boss: wall });
  const save = savingFor(s);
  const canBuy = save && s.gold + s.loot >= save.cost * (1 + t.greed * 0.6);
  add('shop', (s.loot > 400 + s.level * 120 ? 0.6 + t.greed * 0.5 : -0.5) + (canBuy ? 1.4 : 0) - night * 1.5, canBuy ? 'gear' : 'sell', { place: 'coinbridge' });
  const hobbyAt = HOBBY_PLACE[def.hobby] ?? bestHunt(Math.max(1, s.level - 4)).id;
  add('hobby', 0.25 + (1 - n.fun) * 1.3 + low * 0.4 - night * 0.8 + (ctx.hour > 16 && ctx.hour < 21 ? 0.2 : 0), def.hobby, { place: hobbyAt });
  const friendsAtGuild = Object.values(guild.adv).filter((o) => o.id !== s.id && o.place?.startsWith('guild') && o.act.kind !== 'sleep');
  const pull = friendsAtGuild.reduce((a, o) => a + Math.max(0, s.ops[o.id]?.aff ?? 0), 0);
  add('social', (1 - n.social) ** 1.4 * 1.8 * (0.4 + t.warmth) + Math.min(0.6, pull * 0.25) + low * 0.3 - night * 0.9 - (friendsAtGuild.length ? 0 : 0.6), 'company', { place: GUILD.hall });
  add('rest', (hurt ? 1.8 : 0) + low * 0.8 + (1 - n.energy) * 0.6 - 0.2, hurt ? 'hurt' : 'low', { place: GUILD.hall });
  const unseen = huntingMaps().filter((m) => m.level <= s.level + 1 && !(s.seen ?? {})[m.id]);
  if (unseen.length && !hurt) {
    const m = unseen[Math.floor(rand(s) * unseen.length)];
    add('explore', t.curiosity * 0.7 + (1 - n.fun) * 0.6 - night * 1.2 - (1 - n.energy) * 0.5, 'curious', { place: m.id, map: m });
  }
  if (def.rank === 'veteran' || s.grown) {
    const learner = friendsAtGuild.find((o) => ADVENTURER_BY_ID[o.id].rank !== 'veteran' && o.level < s.level - 8 && o.act.kind !== 'boss');
    if (learner) add('mentor', 0.2 + t.warmth * 0.7 + t.patience * 0.3 + (goal.kind === 'mentor' ? 0.4 : 0) - night * 1.2, 'teach', { place: GUILD.yard, with: learner.id });
  }
  const homeFor = ctx.t - (s.homeT ?? -1e9);
  add('home', -0.3 + Math.min(1.2, homeFor / (24 * 6)) * (0.3 + t.warmth * 0.5) - night * 0.5, 'homesick', { place: def.home });
  return out;
}

// The pick: the best-scoring option, with a little noise (the curious explore their choices more)
// and a nudge away from doing the same thing twice running. Returns the option and why.
export function decide(guild, s, ctx) {
  const t = defOf(s).traits;
  const opts = options(guild, s, ctx);
  const temp = 0.18 + t.curiosity * 0.22;
  let best = null;
  for (const o of opts) {
    o.score += (rand(s) - 0.5) * temp;
    if (o.kind === s.act.kind && o.kind !== 'sleep' && o.kind !== 'rest') o.score -= 0.25;
    if (!best || o.score > best.score) best = o;
  }
  return best;
}

// How long an activity runs (game hours).
const DUR = { sleep: null, eat: [0.6, 1.1], hunt: [2, 4], bounty: [2, 3.5], boss: [1, 1.8], train: [1, 2], shop: [0.4, 0.8], hobby: [1.5, 3], social: [0.8, 2], rest: [1, 2.5], explore: [1.5, 2.5], mentor: [1, 2], home: [3, 6], party: [1, 1] };
export function durationOf(s, kind, hour) {
  if (kind === 'sleep') {
    const { bed, sleep } = rhythm(s);
    const into = (hour - bed + 24) % 24;
    // (by day it's a nap; at night, until their morning)
    if (sleepiness(s, hour) <= 0) return 1 + rand(s) * 1.2;
    // (in bed a little before their hour: the whole night, then)
    return Math.max(1, (into < sleep ? sleep - into : 24 - into + sleep) + (1 - s.needs.energy) * 1.5);
  }
  const [a, b] = DUR[kind] ?? [1, 2];
  return a + rand(s) * (b - a);
}
