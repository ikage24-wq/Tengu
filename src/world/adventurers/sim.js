// The guild's life, run on the game clock (a game hour is five real minutes, a day two real hours).
// Every adventurer lives all the time, on every map, whether you're there or not: when you're away
// from the game the guild catches up on what it missed (up to three game days, six real hours), so
// you come back to news.
//
//   tickGuild(guild, now, { playerLevel })   advance to `now` (game hours)
//   youDid(guild, kind, data, now)           what you did, as they see it (levels, bosses, parties,
//                                            talks, gifts), so they react and learn from you
//   whereIs(guild, id) / at(guild, place)    for the game's bodies: who's where doing what
import { ADVENTURERS, ADVENTURER_BY_ID } from '../../data/adventurers.js';
import { MOBS } from '../../data/mobs.js';
import { bosses, huntingMaps, bossById } from './catalog.js';
import { rand } from './state.js';
import { liveHours, decide, durationOf, chooseGoal, GUILD } from './mind.js';
import { hunt, fightBoss, shop, pickWalls, wallOf, injure } from './grow.js';
import { learnValue, practise, teach, copyYou, bossKnow } from './learn.js';
import { remember, chat, notice, shift, nameOf } from './social.js';
import { roleOf } from './catalog.js';

export const CATCHUP_HOURS = 72;
const STEP = 0.5;
const defOf = (s) => ADVENTURER_BY_ID[s.id];
const awake = (s) => s.act.kind !== 'sleep';
const needSum = (s) => Object.values(s.needs).reduce((a, v) => a + v, 0);

export function initGuild(guild) {
  const all = bosses();
  for (const s of Object.values(guild.adv)) {
    pickWalls(s, all);
    s.goal ??= chooseGoal(guild, s);
    s.seen ??= {};
    // (they last went home some days ago, each a different number)
    s.homeT ??= guild.clock - rand(s) * 120;
    // (and a veteran last went at their wall a few days back)
    if (ADVENTURER_BY_ID[s.id].rank === 'veteran') s.lastBossT ??= guild.clock - rand(s) * 120;
  }
  if (!guild.bounties) postBounties(guild, guild.clock);
  // (the guild has a history: the bosses well below you were beaten by somebody long ago)
  guild.firsts ??= {};
  for (const b of all) if (b.level < guild.playerLevel - 3) guild.firsts[b.id] ??= { t: -1, who: [] };
  return guild;
}

export function tickGuild(guild, now, ctx = {}) {
  if (ctx.playerLevel) guild.playerLevel = ctx.playerLevel;
  if (now - guild.clock > CATCHUP_HOURS) guild.clock = now - CATCHUP_HOURS;
  while (guild.clock < now - 1e-9) {
    const h = Math.min(STEP, now - guild.clock);
    stepGuild(guild, guild.clock, h);
    guild.clock += h;
  }
}

function stepGuild(g, t, h) {
  const week = Math.floor(t / 168);
  if (week !== g.week) {
    g.week = week;
    weekly(g, t);
  }
  const at = {};
  for (const s of Object.values(g.adv)) if (awake(s)) (at[s.place] ??= []).push(s.id);
  for (const s of Object.values(g.adv)) {
    const here = (at[s.place] ?? []).filter((id) => id !== s.id);
    liveHours(s, s.act.kind, h, here.length);
    // (people in the same room talk: whoever they like best, or whoever's nearest to hand)
    if (awake(s) && here.length && ['social', 'eat', 'mentor', 'rest', 'hobby', 'home'].includes(s.act.kind) && rand(s) < h * 0.9) {
      const other = pickCompany(s, here);
      if (other && other > s.id) chat(g, s.id, other, t);
      else if (other) chat(g, other, s.id, t);
    }
  }
  for (const s of Object.values(g.adv)) {
    if (t + h < s.act.until) continue;
    if (s.act.kind === 'boss' && s.act.lead !== s.id) continue;
    finish(g, s, t + h);
  }
  for (const s of Object.values(g.adv)) if (t + h >= s.act.until && !s.act.held) begin(g, s, t + h);
}

function pickCompany(s, here) {
  let best = null;
  let bs = -Infinity;
  for (const id of here) {
    const sc = (s.ops[id]?.aff ?? 0) + rand(s) * 0.5;
    if (sc > bs) {
      bs = sc;
      best = id;
    }
  }
  return best;
}

// The end of an activity: what came of it, and what they learn about doing it.
function finish(g, s, t) {
  const a = s.act;
  const hours = t - a.since;
  const def = defOf(s);
  let outcome = (needSum(s) - (a.n0 ?? needSum(s))) * 0.6 + (s.mood.v - (a.v0 ?? s.mood.v)) * 1.2;
  switch (a.kind) {
    case 'hunt':
    case 'bounty':
    case 'explore': {
      const map = huntingMaps().find((m) => m.id === a.place);
      if (!map) break;
      (s.seen ??= {})[map.id] = true;
      const r = hunt(g, s, map, hours, t);
      outcome += r.ups * 0.5 + (r.hurt ? -0.8 : 0.15);
      if (a.kind === 'bounty' && a.bounty && !r.hurt) {
        const b = g.bounties.find((x) => x.id === a.bounty);
        if (b && !b.done) {
          b.done = s.id;
          s.gold += b.reward;
          outcome += 0.5 + def.traits.greed * 0.3;
          remember(s, t, 'bounty', `brought in the ${b.name} bounty`, { feel: 0.6, sal: 0.5 });
          notice(g, t, `${def.name} brought in the bounty on ${b.name} at ${map.name}.`, [s.id], 'bounty');
        }
      }
      if (a.kind === 'explore') {
        outcome += 0.3 * def.traits.curiosity;
        remember(s, t, 'explore', `went to see ${map.name}`, { feel: 0.4, sal: 0.3 });
      }
      break;
    }
    case 'boss': {
      const boss = bossById(a.target);
      if (!boss) break;
      const ids = a.party ?? [s.id];
      const r = fightBoss(g, boss, ids, t);
      for (const id of ids) {
        const m = g.adv[id];
        m.lastBossT = t;
        learnValue(m, 'boss', r.won ? 0.9 : -0.4);
        m.goal = chooseGoal(g, m);
        m.act.until = t;
        m.act.held = false;
      }
      s.goal = chooseGoal(g, s);
      return;
    }
    case 'train':
      practise(s, hours, a.target ?? null);
      outcome += 0.15 * def.traits.drive;
      break;
    case 'mentor': {
      const learner = g.adv[a.with];
      if (learner) {
        teach(s, learner, hours, wallOf(learner)?.id ?? null);
        shift(learner, s.id, { aff: 0.05, res: 0.05, trust: 0.05 });
        shift(s, learner.id, { aff: 0.04 });
        remember(learner, t, 'taught', `got some pointers from ${def.name}`, { who: [s.id], feel: 0.5, sal: 0.4 });
        outcome += 0.3 * def.traits.warmth;
      }
      break;
    }
    case 'shop': {
      const r = shop(g, s, t);
      if (r.bought) {
        outcome += 0.6;
        notice(g, t, `${def.name} has a new ${r.bought} set.`, [s.id], 'gear');
      }
      break;
    }
    case 'eat':
      s.gold = Math.max(0, s.gold - Math.round(20 + rand(s) * 40));
      break;
    case 'hobby':
      s.gold += Math.round((20 + rand(s) * 60) * (1 + s.level / 20));
      s.hobbyN = (s.hobbyN ?? 0) + 1;
      if (rand(s) < 0.08) remember(s, t, 'hobby', hobbyStory(def, s), { feel: 0.6, sal: 0.45 });
      break;
    case 'home':
      s.homeT = t;
      remember(s, t, 'home', `went home to ${def.home} for a bit`, { feel: 0.4, sal: 0.25 });
      break;
  }
  learnValue(s, a.kind, Math.max(-1, Math.min(1, outcome)));
  if (a.kind !== 'sleep' && a.kind !== 'eat') s.goal = chooseGoal(g, s);
}

const HOBBY_STORIES = {
  fishing: ['caught a fish nearly as long as an arm', 'saw a glowing fish at the lagoon and just missed it'],
  cooking: ['made a stew everyone went back for', 'burned the rice and blamed the stove'],
  crafting: ['finished a little charm worth being proud of', 'sold a whole set of bowls at the market'],
  gathering: ['found a patch of rare herbs nobody else knows about', 'got lost picking berries and found a waterfall'],
  drawing: ['finished a drawing that went up in the guild hall', 'drew a monster that actually sat still'],
};
const hobbyStory = (def, s) => {
  const list = HOBBY_STORIES[def.hobby] ?? ['had a quiet good day'];
  return list[Math.floor(rand(s) * list.length)];
};

// Choosing and starting the next activity (and, for a group boss, gathering the group).
function begin(g, s, t) {
  const hour = ((t % 24) + 24) % 24;
  const o = decide(g, s, { hour, t });
  s.act = { kind: o.kind, since: t, until: t + durationOf(s, o.kind, hour), place: o.place, why: o.why, n0: needSum(s), v0: s.mood.v };
  s.place = o.place;
  if (o.map) s.act.map = o.map.id;
  if (o.bounty) {
    s.act.bounty = o.bounty.id;
    o.bounty.taken = s.id;
  }
  if (o.with) s.act.with = o.with;
  if (o.boss) s.act.target = o.boss.id;
  if (o.kind === 'boss') gather(g, s, o.boss, t);
  s.log.push({ t, kind: o.kind, why: o.why, place: o.place });
  if (s.log.length > 30) s.log.splice(0, s.log.length - 30);
}

// A boss attempt: they ask round for a group. Whoever's free, able and willing comes: friends
// first, the roles the group lacks (tank, healer), people near the boss's level; nobody comes who
// doesn't like or trust the asker, and the timid often decline.
function gather(g, lead, boss, t) {
  lead.act.lead = lead.id;
  const party = [lead.id];
  // (a group boss always takes a group; for the rest they ask once they've lost to it, the proud
  // holding out a few tries longer, or sooner if they're the kind who likes company anyway)
  const tries = bossKnow(lead, boss.id).tries;
  if (boss.group || tries >= 1 + Math.round(defOf(lead).traits.pride * 3) || rand(lead) < 0.4 * defOf(lead).traits.warmth) {
    const have = new Set([roleOf(lead.job)]);
    const cands = Object.values(g.adv)
      .filter((o) => o.id !== lead.id && awake(o) && o.injured <= 0.5 && !['boss', 'party'].includes(o.act.kind) && o.level >= boss.level - 4 && o.needs.energy > 0.35)
      // (a veteran only comes down to a small boss for someone who's lost to it twice: a favour)
      .filter((o) => o.level <= boss.level + 8 || (defOf(o).rank === 'veteran' && bossKnow(lead, boss.id).tries >= 2 && (o.ops[lead.id]?.aff ?? 0) > 0.25))
      .map((o) => {
        const op = o.ops[lead.id] ?? { aff: 0, trust: 0 };
        const role = roleOf(o.job);
        const need = (role === 'tank' && !have.has('tank') ? 0.6 : 0) + (role === 'healer' && !have.has('healer') ? 0.7 : 0);
        const ownWall = wallOf(o)?.id === boss.id ? 0.5 : 0;
        // (someone who's beaten it already comes for a friend, not for themselves)
        const done = o.beaten[boss.id] ? 0.35 : 0;
        return { o, sc: op.aff * 0.8 + op.trust * 0.6 + need + ownWall + defOf(o).traits.bravery * 0.3 + rand(o) * 0.3 - done };
      })
      .sort((a, b) => b.sc - a.sc);
    for (const { o, sc } of cands) {
      if (party.length >= 4) break;
      if (sc < 0.45) continue;
      party.push(o.id);
      have.add(roleOf(o.job));
    }
  }
  lead.act.party = party;
  for (const id of party.slice(1)) {
    const o = g.adv[id];
    o.act = { kind: 'boss', since: t, until: lead.act.until, place: lead.act.place, why: 'asked', target: boss.id, lead: lead.id, held: true, n0: needSum(o), v0: o.mood.v };
    o.place = lead.act.place;
    o.log.push({ t, kind: 'boss', why: `with ${defOf(lead).name}`, place: o.place });
  }
}

// Each week: new bounties on the guild board, old requests closed.
function weekly(g, t) {
  postBounties(g, t);
  for (const r of g.requests ?? []) if (t - r.t > 168 * 2) r.open = false;
}
function postBounties(g, t) {
  const maps = huntingMaps();
  const levels = Object.values(g.adv).map((s) => s.level);
  const list = [];
  const r = { rng: Math.floor(t * 977) | 0 };
  for (let i = 0; i < 5; i++) {
    const lv = levels[Math.floor(rand(r) * levels.length)];
    const near = maps.filter((m) => Math.abs(m.level - lv) <= 3);
    if (!near.length) continue;
    const m = near[Math.floor(rand(r) * near.length)];
    const mob = m.mobs[Math.floor(rand(r) * m.mobs.length)];
    list.push({ id: `b${Math.floor(t)}-${i}`, map: m.id, mob, name: MOBS[mob]?.name ?? mob, level: Math.round(m.level), reward: Math.round(m.level * m.level * 8 + 200), taken: false, done: null, t });
  }
  g.bounties = list;
}

// What you did, as they see it.
//   level  { level }                 you levelled (your rival notices)
//   job    { job }
//   beat   { boss, with: [ids] }     you beat a boss (alone or with some of them)
//   party  { ids, map, hours }       they spent time adventuring with you
//   talk   { id }                    you talked to one of them
//   gift   { id, liked: -1..1 }
export function youDid(g, kind, data, t) {
  if (kind === 'level') {
    g.playerLevel = data.level;
    for (const s of Object.values(g.adv)) {
      const def = defOf(s);
      if (def.rival === 'you' && data.level > s.level) {
        s.mood.a = Math.min(1, s.mood.a + 0.3);
        s.needs.purpose = Math.max(0, s.needs.purpose - 0.3);
        remember(s, t, 'rival', `you got ahead of me (level ${data.level})`, { who: ['you'], feel: -0.2, sal: 0.6 });
      }
    }
  }
  if (kind === 'beat') {
    const boss = bossById(data.boss);
    const near = new Set(data.with ?? []);
    for (const s of Object.values(g.adv)) {
      copyYou(s, 'beat', { boss: data.boss, near: near.has(s.id) });
      shift(s, 'you', { res: near.has(s.id) ? 0.1 : 0.02 });
    }
    if (boss) notice(g, t, `You beat ${boss.name}.`, ['you', ...near], 'you');
    if (data.with?.length) fightBossWithYou(g, data, t);
  }
  if (kind === 'party') {
    for (const id of data.ids ?? []) {
      const s = g.adv[id];
      if (!s) continue;
      s.met = true;
      s.bond = Math.min(100, s.bond + (data.hours ?? 1) * 2);
      shift(s, 'you', { aff: 0.04 * (data.hours ?? 1), trust: 0.05 * (data.hours ?? 1) });
      if (data.map) copyYou(s, 'party', { map: data.map, near: true });
      remember(s, t, 'party', 'adventured with you', { who: ['you'], feel: 0.5, sal: 0.4 });
    }
  }
  if (kind === 'talk') {
    const s = g.adv[data.id];
    // (talking to someone asleep isn't meeting them)
    if (!s || s.act.kind === 'sleep') return;
    const first = !s.met;
    s.met = true;
    if (first) remember(s, t, 'met', 'met you', { who: ['you'], feel: 0.3, sal: 0.7 });
    if ((s.talkT ?? -1e9) < t - 6) shift(s, 'you', { aff: 0.02 + defOf(s).traits.warmth * 0.02 });
    s.talkT = t;
    s.needs.social = Math.min(1, s.needs.social + 0.08);
  }
  if (kind === 'gift') {
    const s = g.adv[data.id];
    if (!s) return;
    shift(s, 'you', { aff: 0.08 * (data.liked ?? 0.5) });
    s.bond = Math.min(100, s.bond + 3 * Math.max(0, data.liked ?? 0.5));
    s.mood.v = Math.min(1, s.mood.v + 0.15 * (data.liked ?? 0.5));
    remember(s, t, 'gift', 'got a present from you', { who: ['you'], feel: data.liked ?? 0.5, sal: 0.5 });
  }
}
// (a boss you beat with some of them is their win too)
function fightBossWithYou(g, data, t) {
  const boss = bossById(data.boss);
  if (!boss) return;
  for (const id of data.with) {
    const s = g.adv[id];
    if (!s) continue;
    bossKnow(s, boss.id).wins += 1;
    const first = !s.beaten[boss.id];
    s.beaten[boss.id] = t;
    s.mood.v = Math.min(1, s.mood.v + (first ? 0.45 : 0.15));
    shift(s, 'you', { aff: 0.1, res: 0.12, trust: 0.12 });
    remember(s, t, 'beat', `beat ${boss.name.split(',')[0]} with you`, { who: ['you', ...data.with.filter((x) => x !== id)], feel: 0.95, sal: 0.95 });
    if (defOf(s).wall === boss.id) s.story = Math.max(s.story, 4);
    s.goal = chooseGoal(g, s);
  }
}

// Taking one of them along (a companion) and letting them go again.
export function joinYou(g, id, t) {
  const s = g.adv[id];
  if (!s) return false;
  s.act = { kind: 'party', since: t, until: Infinity, place: 'you', why: 'with you', n0: needSum(s), v0: s.mood.v, held: true };
  s.place = 'you';
  return true;
}
export function leaveYou(g, id, t, map = null) {
  const s = g.adv[id];
  if (!s || s.act.kind !== 'party') return;
  const hours = t - s.act.since;
  youDid(g, 'party', { ids: [id], map, hours }, t);
  s.act.until = t;
  s.act.held = false;
}

// Would they come along with you now? (Their mood, needs, what they think of you, their goal.)
export function willJoin(g, id) {
  const s = g.adv[id];
  if (!s) return { yes: false, why: 'gone' };
  if (s.act.kind === 'sleep') return { yes: false, why: 'asleep' };
  if (s.injured > 0.5) return { yes: false, why: 'hurt' };
  if (s.act.kind === 'boss') return { yes: false, why: 'busy' };
  if (s.needs.energy < 0.25) return { yes: false, why: 'tired' };
  if (s.needs.food < 0.2) return { yes: false, why: 'hungry' };
  const op = s.ops.you ?? { aff: 0, trust: 0 };
  const t = defOf(s).traits;
  const want = 0.35 + op.aff * 0.6 + op.trust * 0.4 + t.warmth * 0.2 + (1 - s.needs.purpose) * 0.2 - (s.act.kind === 'hobby' ? 0.15 : 0);
  return want > 0.4 ? { yes: true } : { yes: false, why: 'not yet' };
}

// Where they are and what they're doing (for the game's bodies and the guild screen).
export const whereIs = (g, id) => g.adv[id]?.place ?? null;
export const at = (g, place) => Object.values(g.adv).filter((s) => s.place === place);
export { GUILD, nameOf, injure };
