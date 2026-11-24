// An adventurer's living state (plain data, saved with your character): where they are and what
// they're doing, their level, gold and gear, their needs and mood, what they're working toward, what
// they've learned, what they think of everyone, and what they remember.
import { ADVENTURERS } from '../../data/adventurers.js';
import { tierFor, jobAt } from './catalog.js';

// A small seeded random source kept in the state, so every adventurer's life is reproducible.
export function rand(s) {
  let t = (s.rng = (s.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const seedOf = (id) => [...id].reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0), 2166136261);

// Their opinion of someone: affinity (do I like them), respect (are they good), trust (can I rely on
// them), each -1..1.
const opinion = (aff = 0.1, res = 0.15, trust = 0.1) => ({ aff, res, trust });

export function newAdventurer(def, playerLevel, now = 0) {
  const level = Math.max(1, Math.min(50, def.start.level ?? playerLevel + (def.start.rel ?? 0)));
  const ops = {};
  for (const o of ADVENTURERS) {
    if (o.id === def.id) continue;
    let op = opinion();
    if (o.id === def.friend || o.friend === def.id) op = opinion(0.6, 0.4, 0.55);
    else if (o.id === def.rival || o.rival === def.id) op = opinion(0.05, 0.45, 0.15);
    // (veterans are looked up to by the rest; rookies are looked after)
    if (o.rank === 'veteran' && def.rank !== 'veteran') op.res = Math.max(op.res, 0.6);
    if (o.rank === 'rookie' && def.rank === 'veteran') op.aff = Math.max(op.aff, 0.3 + def.traits.warmth * 0.3);
    ops[o.id] = op;
  }
  // (what they think of you before you've met: nothing much; a rival watches you from the start)
  ops.you = opinion(0, def.rival === 'you' ? 0.35 : 0.1, 0);
  const tier = tierFor(level)?.id ?? null;
  const s = {
    id: def.id,
    level,
    exp: 0,
    // (the job of their line at this level: a rookie past 5 has their first job already)
    job: jobAt(def, level),
    gold: Math.round(80 * level * level * (0.6 + def.traits.greed)),
    loot: 0,
    tier,
    needs: { energy: 0.8, food: 0.75, social: 0.6, fun: 0.6, purpose: 0.55 },
    mood: { v: 0.25, a: 0.35 },
    act: { kind: 'idle', target: null, since: now, until: now, place: 'guild' },
    place: 'guild',
    goal: null,
    know: { boss: {}, value: {}, map: {}, tactics: 0, taught: 0 },
    beaten: {},
    ops,
    mem: [],
    bond: 0,
    story: 0,
    injured: 0,
    streak: 0,
    met: false,
    log: [],
    rng: seedOf(def.id),
  };
  // (what they already know of bosses below them: a veteran has met them all; the rest a little)
  if (def.rank === 'veteran' && def.wall) s.know.boss[def.wall] = { tries: 3 + Math.floor(def.traits.drive * 6), wins: 0, mastery: 0.25 + def.traits.patience * 0.15 };
  return s;
}

// The whole guild: every adventurer, the notice board, the guild's clock.
export function newGuild(playerLevel, now = 0) {
  const adv = {};
  for (const def of ADVENTURERS) adv[def.id] = newAdventurer(def, playerLevel, now);
  return { v: 1, adv, board: [], clock: now, week: 0, playerLevel };
}

// (saving keeps everything but trims the logs, so a save never grows without end)
export function saveGuild(g) {
  const adv = {};
  for (const [id, s] of Object.entries(g.adv)) adv[id] = { ...s, mem: s.mem.slice(-40), log: s.log.slice(-20) };
  return { ...g, adv, board: g.board.slice(-60) };
}
export function loadGuild(data, playerLevel, now) {
  if (!data?.adv) return newGuild(playerLevel, now);
  const g = newGuild(playerLevel, now);
  for (const [id, s] of Object.entries(data.adv)) if (g.adv[id]) g.adv[id] = { ...g.adv[id], ...s };
  return { ...g, board: data.board ?? [], clock: data.clock ?? now, week: data.week ?? 0 };
}
