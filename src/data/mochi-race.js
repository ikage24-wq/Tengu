// Mochi racing (docs/design/mochi.md step 5): the stages, the ranks, the rivals' names, how each
// personality runs a race, and the prizes. The race itself runs in world/mochi-race.js; the stadium
// and the courses are in world/stadium.js.
//
// You watch and cheer: your Mochi runs on its own stats and personality against five rivals, and a
// cheer gives it a burst of speed that costs it stamina.

// The stages: one per stat, then the Grand course. Each is its own course map (world/stadium.js);
// `stat` is the one it tests (null: all of them), `tab` its name on the race board's tabs.
export const RACE_STAGES = {
  sprint: { name: 'Sakura Sprint', tab: 'Sprint', stat: 'run', map: 'mrace_sprint', about: 'A dash down a blossom meadow, over little hills. All about Run, and a little Stamina.' },
  swim: { name: 'Lily Lake Swim', tab: 'Swim', stat: 'swim', map: 'mrace_swim', about: 'A dash to the shore, then right across a lily lake. All about Swim.' },
  climb: { name: 'Mortar Cliff Climb', tab: 'Climb', stat: 'power', map: 'mrace_climb', about: 'Up two climbing walls, a ledge between and a sprint along the top. All about Power.' },
  glide: { name: 'Cloud Glide', tab: 'Glide', stat: 'fly', map: 'mrace_glide', about: 'Off a high cliff and down over the cloud fluff: the further it glides, the less fluff to wade. All about Fly.' },
  hills: { name: 'Long Hill Run', tab: 'Hills', stat: 'stamina', map: 'mrace_hills', about: 'A long way over big hills: uphill slows and tires it. All about Stamina.' },
  grand: { name: 'Grand Mochi Course', tab: 'Grand', stat: null, map: 'mrace_grand', about: 'The meadow, the lake, a wall, a glide over the clouds and home over the hills. Everything.', prizeMul: 1.5, needs: 3 },
  tour: { name: 'Mochi Grand Tour', tab: 'Tour', stat: null, map: 'mrace_tour', about: 'A whole day: meadow, river, cliffs, a sunset glide and the lantern hills home. Stamina most of all.', prizeMul: 2.5, needs: 6 },
};

// The ranks, in order: how strong the rivals are (stat points, from and to; how many of them are
// grown) and the prizes for 1st, 2nd and 3rd (gold: the money scale), with a little something for
// everyone else who finishes. The Grand course pays half again (`prizeMul`).
// Unlocking: a stage's Beginner race is open from the start (the Grand course's once you've won
// `needs` Beginner races); winning a rank opens the next rank of that stage.
export const RACE_RANKS = {
  // (For a Mochi just hatched: rivals that can only just walk, a small purse for everyone who runs.)
  hatchling: { name: 'Hatchling', rivals: [30, 100], grown: 0, prize: [300, 150, 80], rest: 40, tail: 45, speedUp: 2.2 },
  beginner: { name: 'Beginner', rivals: [120, 620], grown: 0.45, prize: [500, 250, 100], rest: 20 },
  challenge: { name: 'Challenge', rivals: [650, 1400], grown: 0.8, prize: [2000, 1000, 400], rest: 80 },
  master: { name: 'Master', rivals: [1300, 2100], grown: 1, prize: [8000, 4000, 1500], rest: 300 },
};
export const RANK_ORDER = Object.keys(RACE_RANKS);
export const prizeOf = (stageId, rank, place) => {
  const r = RACE_RANKS[rank];
  return Math.round((r.prize[place - 1] ?? r.rest) * (RACE_STAGES[stageId]?.prizeMul ?? 1));
};
// Medals: a top-three finish wins one, kept on the Mochi that won it (its best for each stage and
// rank); `MEDAL_COLOR` for drawing them.
export const MEDALS = ['gold', 'silver', 'bronze'];
export const MEDAL_COLOR = { gold: '#f2c94c', silver: '#c8d0dc', bronze: '#d89060' };
export const medalKey = (stageId, rank) => `${stageId}|${rank}`;

// Whether `char` can race `stageId` at `rank` (its race wins: char.raceWins, keyed like medals).
export function rankOpen(char, stageId, rank) {
  const wins = char.raceWins ?? {};
  const i = RANK_ORDER.indexOf(rank);
  if (i < 0 || !RACE_STAGES[stageId]) return false;
  // (Hatchling and Beginner are open from the start; each rank after, by winning the one before.)
  if (i > 1) return Boolean(wins[medalKey(stageId, RANK_ORDER[i - 1])]);
  const needs = RACE_STAGES[stageId].needs ?? 0;
  return Object.keys(RACE_STAGES).filter((id) => id !== stageId && wins[medalKey(id, 'beginner')]).length >= needs;
}
// What's still needed to open it, in words (null if it's open).
export function rankNeeds(char, stageId, rank) {
  if (rankOpen(char, stageId, rank)) return null;
  const i = RANK_ORDER.indexOf(rank);
  if (i > 1) return `Win ${RACE_STAGES[stageId].name} (${RACE_RANKS[RANK_ORDER[i - 1]].name}) to open it.`;
  return `Win ${RACE_STAGES[stageId].needs} Beginner races to open it.`;
}

// Rivals' names (Mochi don't have names of their own yet: step 7).
export const RIVAL_NAMES = ['Momo', 'Kinu', 'Azuki', 'Yuzu', 'Tofu', 'Sumi', 'Hana', 'Kiri', 'Mugi', 'Ume', 'Pom', 'Natsu', 'Koko', 'Rin',
  'Sora', 'Taro', 'Fuku', 'Chibi', 'Kuri', 'Nana', 'Biscuit', 'Hoshi', 'Puff', 'Dumpling'];

// How each personality runs: `early` and `late` (its pace in the first and last third), `tire` (how
// fast it wears out) and `wobble` (how much its pace wanders). A hyper one bolts and fades; a stoic
// one keeps an even pace; a lazy one starts slow and finds its feet.
const PACE = {
  hyper: { early: 1.12, late: 0.9, tire: 1.3, wobble: 0.08 },
  showoff: { early: 1.08, late: 0.95 },
  proud: { early: 1.06, late: 0.97 },
  bossy: { early: 1.05 },
  sporty: { early: 1.03, late: 1.03, tire: 0.85 },
  brave: { late: 1.06 },
  stoic: { wobble: 0.01 },
  cool: { wobble: 0.02, late: 1.02 },
  lazy: { early: 0.88, late: 1.06 },
  sleepy: { early: 0.9, wobble: 0.08 },
  timid: { early: 0.94, late: 1.05 },
  shy: { early: 0.96, late: 1.03 },
  dreamy: { wobble: 0.11 },
  clumsy: { wobble: 0.13 },
  foodie: { tire: 1.15 },
  dramatic: { early: 1.04, late: 1.04, tire: 1.1, wobble: 0.09 },
};
export const paceOf = (personality) => ({ early: 1, late: 1, tire: 1, wobble: 0.05, ...PACE[personality] });

// Cheering: a burst this much faster, for this long; it costs this many seconds of running's
// tiredness, and it can't be done again too soon.
// Cheering: a burst of speed (`boost` for `secs`, at most every `every` seconds) paid for out of its
// stamina: each cheer spends `cost[0]` of the stamina bar, less by `cost[1]` for each Stamina style
// (so a tireless Mochi cheers cheaper, never free); what's spent comes back `back[0]` a second,
// plus `back[1]` for each style. Spent all the way down, it has to stop and catch its breath.
export const CHEER = { boost: 1.4, secs: 1.2, every: 2.5, cost: [0.25, 0.025], back: [0.01, 0.003] };
// The race ends this long after the first one home (the rest are placed by how far they got), or
// at this time at the latest.
export const RACE_TAIL = 15;
export const RACE_MAX = 120;
