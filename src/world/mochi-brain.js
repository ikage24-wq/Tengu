// A Mochi's mind (2026-11-15, part 1 of 3: the player asked for "an autonomous complex deep ai").
// By day each Mochi in the garden chooses what to do for itself instead of following the clock
// (world/garden-life.js asks it, `brainTarget`; at night they still go to bed).
//
// It has needs that run down as the day goes: energy, fun, friends (social), curiosity, and a
// little hunger it sees to itself, picking fruit. Every so often it weighs everything it could do -
// each place and play thing in the garden, a swim, a wander, a rest, going over to a friend or to
// you - by how much each would help what it needs most, leaned by its personality (a sleepy one
// rests, a curious one explores, a bossy one goes looking for company) and by what it's good at (a
// good runner loves running games, a flyer loves to glide), a little less for anything it has just
// done, and less the further away it is. The best of them is what it does next, and a thought
// bubble over it says why (render/garden.js). None of its needs is ever a job for you: what you do
// for it (petting, a sweet) is a treat on top.
//
// Pure rules (no world in here), so the choice can be tested on its own.

export const NEEDS = ['energy', 'fun', 'social', 'curious', 'hunger'];
// How fast each runs down, per second the garden is open (fun goes in about eight minutes; energy
// lasts the day).
const DRAIN = { energy: 0.07, fun: 0.2, social: 0.14, curious: 0.16, hunger: 0.06 };
const clamp = (v) => Math.max(0, Math.min(100, v));
// (Deterministic: the same Mochi in the same state chooses the same, so a visitor sees much the same.)
const hash = (n) => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

// Its needs (kept on its record, so they carry over between visits).
export function needsOf(rec) {
  rec.needs ??= { energy: 80, fun: 55, social: 60, curious: 60, hunger: 85 };
  return rec.needs;
}
// Time passing: everything runs down (energy slower while it stands about).
export function drainNeeds(rec, dt, active = true) {
  const n = needsOf(rec);
  for (const k of NEEDS) n[k] = clamp(n[k] - DRAIN[k] * dt * (k === 'energy' && !active ? 0.4 : 1));
}
// Doing something: the needs it meets go back up.
export function satisfy(rec, gains) {
  const n = needsOf(rec);
  for (const [k, v] of Object.entries(gains ?? {})) n[k] = clamp(n[k] + v);
}

// What each personality leans toward (by the kind of thing: rest, play, ride, explore, chore,
// snack, social). Anything not listed is 1.
const LEANS = {
  playful: { play: 1.6, ride: 1.3, rest: 0.7 },
  shy: { social: 0.5, chore: 1.3, rest: 1.1 },
  proud: { ride: 1.3, chore: 0.8 },
  sleepy: { rest: 1.9, play: 0.7, ride: 0.8 },
  curious: { explore: 1.8, ride: 1.1 },
  bossy: { social: 1.5, chore: 0.8 },
  gentle: { chore: 1.5, social: 1.2 },
  showoff: { ride: 1.6, play: 1.2 },
  clumsy: { play: 1.3, ride: 1.2 },
  brave: { ride: 1.6, explore: 1.2 },
  grumpy: { social: 0.5, rest: 1.3, chore: 1.1 },
  dreamy: { rest: 1.3, explore: 1.3 },
  cheeky: { play: 1.4, social: 1.2 },
  timid: { ride: 0.6, rest: 1.2, social: 0.8 },
};

// How much it wants option `o` now. An option: { id, kind, x, gains: { need: amount }, stat?,
// boost? }. `at`: where it is; `memory`: the ids of what it did last (most recent last).
export function wantOf(rec, o, at, memory, tick = 0) {
  const n = needsOf(rec);
  let want = 0;
  // (A need badly run down counts for much more than one a little low.)
  for (const [k, g] of Object.entries(o.gains)) want += g * ((100 - n[k]) / 100) ** 1.5;
  want *= LEANS[rec.personality]?.[o.kind] ?? 1;
  // (Good at it, likes it: up to twice as keen.)
  if (o.stat) want *= 0.8 + Math.min(0.8, (rec.stats?.[o.stat]?.points ?? 0) / 1500);
  if (o.boost) want *= o.boost;
  // (Each time it's done it lately makes it a little less keen to do it again: it likes a change.)
  for (const id of memory) if (id === o.id) want *= 0.55;
  // (Further off, a little less tempting: the far end of the garden still gets its visits.)
  want /= 1 + Math.abs(o.x - at) / 1500;
  // (A little whim, so two alike don't move as one.)
  want *= 0.85 + 0.3 * hash(rec.seed * 0.131 + tick * 1.7 + o.x * 0.013);
  return want;
}
// The option it wants most, or null.
export function choose(rec, options, at, memory, tick = 0) {
  let best = null;
  let bestWant = -1;
  for (const o of options) {
    const w = wantOf(rec, o, at, memory, tick);
    if (w > bestWant) {
      bestWant = w;
      best = o;
    }
  }
  return best;
}
// The need an option is mostly for (its thought bubble).
export const mainNeed = (gains) => Object.entries(gains ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'curious';
