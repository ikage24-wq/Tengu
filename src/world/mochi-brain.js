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
// (`tiring`: how hard its getting about is - crawling wears a little one out sooner.)
export function drainNeeds(rec, dt, active = true, tiring = 1) {
  const n = needsOf(rec);
  for (const k of NEEDS) n[k] = clamp(n[k] - DRAIN[k] * dt * (k === 'energy' ? (active ? tiring : 0.4) : 1));
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
// boost? }. `at`: where it is; `memory`: the ids of what it did last (most recent last); `dir`, the
// way it's facing.
export function wantOf(rec, o, at, memory, tick = 0, dir = 0) {
  const n = needsOf(rec);
  let want = 0;
  // (A need badly run down counts for much more than one a little low.)
  for (const [k, g] of Object.entries(o.gains)) want += g * ((100 - n[k]) / 100) ** 1.5;
  want *= LEANS[rec.personality]?.[o.kind] ?? 1;
  // (Good at it, likes it: up to twice as keen.)
  if (o.stat) want *= 0.8 + Math.min(0.8, (rec.stats?.[o.stat]?.points ?? 0) / 1500);
  if (o.boost) want *= o.boost;
  // (What it has learned to love, it's keener on; what it's gone off, less: part 3.)
  want *= 1 + 0.7 * (rec.likes?.[o.like ?? o.kind] ?? 0);
  // (Each time it's done it lately makes it a little less keen to do it again: it likes a change.)
  for (const id of memory) if (id === o.id) want *= 0.55;
  // (Further off, a little less tempting: the far end of the garden still gets its visits.)
  want /= 1 + Math.abs(o.x - at) / 1500;
  // (Turning straight back the way it came takes a better reason: without this a slow one went to
  // and fro, crawling right, then left, then right again, and looked stuck.)
  if (dir && Math.sign(o.x - at) === -Math.sign(dir) && Math.abs(o.x - at) > 40) want *= 0.55;
  // (A little whim, so two alike don't move as one.)
  want *= 0.85 + 0.3 * hash(rec.seed * 0.131 + tick * 1.7 + o.x * 0.013);
  return want;
}
// The option it wants most, or null.
export function choose(rec, options, at, memory, tick = 0, dir = 0) {
  let best = null;
  let bestWant = -1;
  for (const o of options) {
    const w = wantOf(rec, o, at, memory, tick, dir);
    if (w > bestWant) {
      bestWant = w;
      best = o;
    }
  }
  return best;
}
// ---------- Part 2: friends ----------
// How it gets on with each of the others (by their seeds): -50, keeps well away, to 100, best
// friends. Playing together and meeting up bring two closer; a snub or a huff sets them back.
export const friendsOf = (rec) => (rec.friends ??= {});
export function befriend(a, b, by) {
  for (const [x, y] of [[a, b], [b, a]]) {
    const f = friendsOf(x);
    f[y.seed] = Math.max(-50, Math.min(100, (f[y.seed] ?? 0) + by));
  }
}
// Its best friend among `others` (garden entries), if it has one yet (30 and up).
export function bestFriend(rec, others) {
  let best = null;
  let score = 29;
  for (const o of others) {
    const s = friendsOf(rec)[o.rec.seed] ?? 0;
    if (s > score) [best, score] = [o, s];
  }
  return best;
}
export const isRival = (rec, other) => (friendsOf(rec)[other.seed] ?? 0) <= -15;

// ---------- Part 3: what it learns to like ----------
// Each sort of thing it does (an option's `like`: swim, ride, run, play, chore, explore, social,
// rest, snack) it likes a little more each time it does it when it really wanted to, and a little
// less when it didn't need it at all; a race well run teaches it to love running. -0.5 to 1, and
// the more it likes a thing the keener it is on it (wantOf). So two of the same personality grow
// apart: one becomes a swimmer, the other a little daredevil on the glide.
export const likesOf = (rec) => (rec.likes ??= {});
// (Slowly: a liking takes days of garden time to grow, not an afternoon.)
export function learn(rec, like, enjoyed, rate = 0.015) {
  const l = likesOf(rec);
  // (Doing a thing it half-needed still warms it to it a little - what it does most it comes to
  // like; doing it with no need for it at all puts it off.)
  l[like] = Math.max(-0.5, Math.min(1, (l[like] ?? 0) + rate * Math.max(-1, Math.min(1, enjoyed - 0.5))));
}
// How much it enjoyed doing something now: how badly it needed what it did, against how much it
// needed things at all (above 1, it met what it needed most; below, it had other things on its mind).
export function enjoyment(rec, gains) {
  const n = needsOf(rec);
  let sum = 0;
  let w = 0;
  for (const [k, g] of Object.entries(gains ?? {})) {
    sum += g * ((100 - n[k]) / 100);
    w += g;
  }
  const mean = NEEDS.reduce((a, k) => a + (100 - n[k]) / 100, 0) / NEEDS.length;
  return w ? sum / w / (mean + 0.05) : 0;
}
// What it likes doing best, once it truly loves something (0.4 and up), or null.
export function favourite(rec) {
  const [k, v] = Object.entries(likesOf(rec)).sort((a, b) => b[1] - a[1])[0] ?? [];
  return v >= 0.4 ? k : null;
}

// The need an option is mostly for (its thought bubble).
export const mainNeed = (gains) => Object.entries(gains ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'curious';
