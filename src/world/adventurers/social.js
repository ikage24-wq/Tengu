// What the adventurers remember and how they feel about each other and you.
//   Memory: each keeps the moments that mattered (a boss beaten, a hard loss, a new job, a save, a
//   gift, a fight beside you), each with how it felt and how much it mattered (salience); the small
//   ones fade, the big ones stay. They bring them up, gossip about them, and they colour opinions.
//   Opinions: affinity, respect and trust (-1..1) of everyone, moved by what actually happens.
//   The notice board: the guild's weekly page of who did what, in place of fake server news.
import { ADVENTURER_BY_ID } from '../../data/adventurers.js';
import { rand } from './state.js';

const clamp = (v, a = -1, b = 1) => Math.max(a, Math.min(b, v));
export const nameOf = (id) => (id === 'you' ? 'you' : ADVENTURER_BY_ID[id]?.name ?? id);

// A moment remembered. kind: beat, lost, job, level, gear, save, gift, party, rival, taught, met,
// rested, upgrade...; feel -1..1; sal 0..1 (how much it mattered).
export function remember(s, t, kind, text, { who = [], feel = 0, sal = 0.4, about = null } = {}) {
  // (the same thing again within a couple of days adds up in one memory: "beat it three times")
  const again = s.mem.find((m) => !m.heard && m.kind === kind && m.text === text && t - m.t < 48);
  if (again) {
    again.n = (again.n ?? 1) + 1;
    again.t = t;
    again.sal = Math.min(1, Math.max(again.sal, sal) + 0.05);
    for (const w of who) if (!again.who.includes(w)) again.who.push(w);
    return again;
  }
  s.mem.push({ t, kind, text, who, feel, sal, about, of: s.id });
  // (memories fade by how much they mattered: keep the 40 that matter most now)
  if (s.mem.length > 60) {
    s.mem.sort((a, b) => b.sal * Math.exp(-(t - b.t) / 400) - a.sal * Math.exp(-(t - a.t) / 400));
    s.mem.length = 40;
    s.mem.sort((a, b) => a.t - b.t);
  }
}
// The memory most worth bringing up now (recent and big, optionally about someone).
export function topMemory(s, t, about = null) {
  let best = null;
  let bs = 0;
  for (const m of s.mem) {
    if (about && !m.who.includes(about) && m.about !== about) continue;
    const sc = m.sal * Math.exp(-(t - m.t) / 72);
    if (sc > bs) {
      bs = sc;
      best = m;
    }
  }
  return best;
}

// Moves one opinion.
export function shift(s, other, { aff = 0, res = 0, trust = 0 }) {
  const op = (s.ops[other] ??= { aff: 0, res: 0.1, trust: 0 });
  op.aff = clamp(op.aff + aff);
  op.res = clamp(op.res + res);
  op.trust = clamp(op.trust + trust);
}

// Something that happened to a group together (a win, a loss, a run), felt by each member in their
// own way: a win bonds everyone; a loss bonds the patient and sours the proud on whoever they blame.
export function together(guild, ids, t, kind, text, feel, also = []) {
  for (const a of ids) {
    const s = guild.adv[a];
    if (!s) continue;
    const def = ADVENTURER_BY_ID[a];
    for (const b of ids) {
      if (a === b) continue;
      if (feel > 0) shift(s, b, { aff: 0.06, res: 0.05, trust: 0.07 });
      else if (def.traits.pride > 0.7 && rand(s) < 0.4) shift(s, b, { aff: -0.03, trust: -0.03 });
      else shift(s, b, { aff: 0.03, trust: 0.02 });
    }
    remember(s, t, kind, text, { who: [...ids.filter((x) => x !== a), ...also], feel, sal: Math.abs(feel) * 0.7 + 0.2 });
  }
}

// Two adventurers spending time together: their liking grows by how warm they both are, and each
// passes on a memory worth telling (gossip), which shifts the listener's view of whoever it's about.
export function chat(guild, a, b, t) {
  const sa = guild.adv[a];
  const sb = guild.adv[b];
  const da = ADVENTURER_BY_ID[a];
  const db = ADVENTURER_BY_ID[b];
  const warm = (da.traits.warmth + db.traits.warmth) / 2;
  shift(sa, b, { aff: 0.02 + warm * 0.04, trust: 0.015 });
  shift(sb, a, { aff: 0.02 + warm * 0.04, trust: 0.015 });
  for (const [teller, listener] of [[sa, sb], [sb, sa]]) {
    const m = topMemory(teller, t);
    if (!m || rand(teller) > 0.6) continue;
    // (news about a third person, or you, reaches the listener)
    for (const w of m.who) {
      if (w === listener.id) continue;
      shift(listener, w, { aff: m.feel * 0.03, res: m.kind === 'beat' ? 0.04 : 0 });
    }
    if (!listener.mem.some((x) => x.t === m.t && x.kind === m.kind && x.heard === teller.id)) {
      listener.mem.push({ ...m, sal: m.sal * 0.4, heard: teller.id, of: m.of ?? teller.id });
    }
  }
}

// A line on the guild's notice board (the weekly page): what happened, to whom, when.
export function notice(guild, t, text, who = [], kind = 'news') {
  guild.board.push({ t, week: guild.week, text, who, kind });
  if (guild.board.length > 120) guild.board.splice(0, guild.board.length - 120);
}
