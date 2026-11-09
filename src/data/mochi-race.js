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
  grand: { name: 'Grand Mochi Course', tab: 'Grand', stat: null, map: 'mrace_grand', about: 'The meadow, the lake, a wall, a glide over the clouds and home over the hills. Everything.' },
};

// The ranks: how strong the rivals are (stat points, from and to) and the prizes for 1st, 2nd and
// 3rd (gold: the money scale), with a little something for everyone else who finishes.
export const RACE_RANKS = {
  beginner: { name: 'Beginner', rivals: [120, 620], prize: [500, 250, 100], rest: 20 },
};

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
export const CHEER = { boost: 1.4, secs: 1.2, cost: 1.4, every: 2.5 };
// The race ends this long after the first one home (the rest are placed by how far they got), or
// at this time at the latest.
export const RACE_TAIL = 15;
export const RACE_MAX = 120;
