// The Mochi Show (2026-11-15, the player's garden list): a dress-up and talent contest in the show
// tent on the Mochi Market's terrace (world/mochi-show.js runs it, render/show.js draws it,
// ui/mochi-show.js enters it). Four Mochi take their turn on the runway - yours and three rivals -
// and three judges each hold up a card, 1 to 10, for what they judge:
//   Style   Hayate, the Mochi Queen (head judge): how well it's dressed - a whole costume, or its
//           pieces (data/mochi-wardrobe.js), the finer and the more complete the better, a little
//           more for an outfit that keeps to one tier
//   Charm   Kinako, the Garden Keeper: how it carries itself - its personality, and how close it is
//           to you (its bond)
//   Talent  Maestro Mugi, a grand old Mochi in a top hat: its act - its best trick (the tricks it
//           knows, taught by sweets: data/mochi-raise.js TRICK_OF), or a turn of its own (ACTS:
//           singing, the taiko drum, dancing, acting, mime, magic), as good as its stat for it and
//           how much it loves doing it
// Each judge's card wobbles a point either way, seeded by the show, so the same show always plays
// the same. Ranks open by winning the one before, like the races; a top-three finish wins a ribbon
// kept on the Mochi and a cup for the nursery's trophy shelf.

import { newRecord, styleOf, pathFor } from './mochi-raise.js';
import { rollMochi, seededRandom, STATS, PERSONALITIES } from './mochi-genes.js';
import { DRESS } from './mochi-dress.js';
import { pieceOf, wearFor, TIERS } from './mochi-wardrobe.js';
import { RIVAL_NAMES } from './mochi-race.js';

export const SHOW_RANKS = {
  beginner: { name: 'Beginner', rival: [0.04, 0.36], prize: [600, 300, 150], rest: 60 },
  challenge: { name: 'Challenge', rival: [0.34, 0.68], prize: [2500, 1200, 500], rest: 200 },
  master: { name: 'Master', rival: [0.66, 1], prize: [10000, 5000, 2000], rest: 600 },
};
export const SHOW_ORDER = Object.keys(SHOW_RANKS);
export const showPrize = (rank, place) => SHOW_RANKS[rank].prize[place - 1] ?? SHOW_RANKS[rank].rest;
// (Beginner is open from the start; each rank after, by winning the one before: `char.showWins`.)
export function showOpen(char, rank) {
  const i = SHOW_ORDER.indexOf(rank);
  if (i < 0) return false;
  return i === 0 || Boolean(char.showWins?.[SHOW_ORDER[i - 1]]);
}

export const JUDGES = [
  { id: 'hayate', name: 'Hayate', title: 'the Mochi Queen', judges: 'style', word: 'Style' },
  { id: 'kinako', name: 'Kinako', title: 'the Garden Keeper', judges: 'charm', word: 'Charm' },
  { id: 'mugi', name: 'Maestro Mugi', title: 'the Talent Judge', judges: 'talent', word: 'Talent' },
];

const clamp10 = (v) => Math.max(1, Math.min(10, v));
// (How fine each tier of piece is, and how much a whole costume is worth by what it costs to get.)
const TIER_PTS = { beginner: 1, mid: 2, end: 3.1, elite: 4.4 };
const costumeWorth = (id) => {
  const d = DRESS[id];
  if (!d) return 0;
  if (d.free) return 3.2;
  if (d.stage) return 5.4;
  return 5 + Math.min(4.2, (d.price ?? 20000) / 30000);
};

// Style, 1-10: a whole costume by its worth, or its pieces - how fine (their tiers), how complete
// (something on top and bottom, shoes, a few touches), and a little more for keeping to one tier.
export function styleScore(rec) {
  if (DRESS[rec.dress] && !DRESS[rec.dress].free) return clamp10(costumeWorth(rec.dress) + (rec.wear?.hat ? 0.4 : 0));
  const worn = Object.values(rec.wear ?? {}).map((id) => pieceOf(id)).filter(Boolean);
  if (!worn.length) return DRESS[rec.dress] ? 3 : 1.5;
  const fine = worn.reduce((sum, p) => sum + (TIER_PTS[p.tier] ?? 1), 0) / worn.length;
  const w = rec.wear;
  const body = w.dress || (w.top && w.bottom) ? 1.4 : w.top || w.bottom ? 0.6 : 0;
  const touches = Math.min(3, ['hat', 'eyes', 'face', 'over', 'hands'].filter((s) => w[s]).length) * 0.45 + (w.shoes ? 0.5 : 0);
  const one = new Set(worn.map((p) => p.tier)).size === 1 && worn.length >= 3 ? 0.9 : 0;
  return clamp10(1 + fine * 1.45 + body + touches + one);
}

// Charm, 1-10: some just shine on a stage, some are shy of it; and the closer it is to you, the more
// it shines for you; and a grown Mochi carries itself better than a little one.
const STAGE_PRESENCE = {
  showoff: 3.4, dramatic: 3.2, bubbly: 3, cheeky: 2.8, playful: 2.8, sweet: 2.8, sassy: 2.8, cool: 2.8, chatty: 2.6, proud: 2.6,
  hyper: 2.6, artsy: 2.6, polite: 2.6, clumsy: 2.4, brave: 2.4, gentle: 2.4, clingy: 2.4, mischief: 2.4, bossy: 2.2, curious: 2.2,
  nosy: 2.2, dreamy: 2.2, sporty: 2.2, foodie: 2.2, sneaky: 1.8, timid: 1.8, shy: 1.8, stoic: 1.6, sleepy: 1.6, lazy: 1.6, grumpy: 1.4, loner: 1.4,
};
export function charmScore(rec) {
  const presence = STAGE_PRESENCE[rec.personality] ?? 2.2;
  const bond = Math.min(1, (rec.bond ?? 0) / 700) * 4;
  const grown = rec.stage === 'mochiko' ? 0 : 1;
  const mood = Math.max(0, Math.min(1, ((rec.mood ?? 60) - 40) / 50));
  return clamp10(1 + presence + bond + grown * 0.8 + mood);
}

// Its act on the stage (2026-11-15): its best trick, or one of six turns of its own, picked in the
// show's window (`rec.showAct`). How good it is at one: the stat it takes (a singer's breath is its
// Stamina, a drummer's arms its Power...; acting, how well it knows your heart: its bond), whether
// its personality loves it (or, quiet ones, shies from a loud one), a little stage experience from
// the tricks it knows, and being grown. Three ways each is done, by that skill
// (render/mochi-show-acts.js): 0 wobbly (it tries its best), 1 good, 2 dazzling.
export const ACTS = {
  trick: { name: 'Trick', short: 'Trick' },
  sing: { name: 'Singing', short: 'Sing', stat: 'stamina', word: 'Stamina', loves: ['chatty', 'sweet', 'bubbly', 'dramatic', 'dreamy', 'showoff'] },
  drum: { name: 'Taiko drum', short: 'Drum', stat: 'power', word: 'Power', loves: ['brave', 'sporty', 'bossy', 'hyper', 'grumpy', 'proud'] },
  dance: { name: 'Dancing', short: 'Dance', stat: 'run', word: 'Run', loves: ['playful', 'sassy', 'showoff', 'hyper', 'cheeky', 'bubbly'] },
  act: { name: 'Acting', short: 'Act', stat: null, word: 'bond', loves: ['dramatic', 'proud', 'clingy', 'artsy', 'polite', 'sweet'] },
  mime: { name: 'Mime', short: 'Mime', stat: 'swim', word: 'Swim', loves: ['shy', 'timid', 'sneaky', 'stoic', 'loner', 'cool'], quiet: true },
  magic: { name: 'Magic', short: 'Magic', stat: 'fly', word: 'Fly', loves: ['curious', 'mischief', 'cheeky', 'nosy', 'dreamy', 'gentle'] },
};
export const ACT_ORDER = Object.keys(ACTS);
const SHY = new Set(['shy', 'timid', 'loner']);
// How long each way of each act runs (s): render/mochi-show-acts.js keys them to exactly this.
export const ACT_LEN = [4.4, 4.6, 4.8];
export const actOf = (rec) => (ACTS[rec?.showAct] ? rec.showAct : 'trick');
export function actSkill(rec, act) {
  const A = ACTS[act];
  if (!A || act === 'trick') return trickScore(rec);
  const g = A.stat ? styleOf(rec.stats?.[A.stat]?.points ?? 0) / 5 : Math.min(1, (rec.bond ?? 0) / 700);
  const fit = A.loves.includes(rec.personality) ? 2.4 : !A.quiet && SHY.has(rec.personality) ? -1.2 : 0;
  const n = rec.tricks?.length ?? 0;
  const stage = 1.5 * (1 - 0.8 ** n);
  const grown = rec.stage === 'mochiko' ? 0 : 0.6;
  return clamp10(1.4 + g * 5 + fit + stage + grown);
}
// Which way it does it: wobbly below 4.5, dazzling from 7.5.
export const actTier = (skill) => (skill < 4.5 ? 0 : skill < 7.5 ? 1 : 2);
// (Its best act, for a rival choosing its own.)
export const bestAct = (rec) => ACT_ORDER.reduce((b, a) => (actSkill(rec, a) > actSkill(rec, b) ? a : b), 'trick');

// Talent, 1-10: its act (`act`, or the one picked for it) - a trick by the tricks it knows (each a
// little less than the last) and how far along its stats are; a turn of its own by its skill at it.
export function talentScore(rec, act = actOf(rec)) {
  return act === 'trick' ? trickScore(rec) : actSkill(rec, act);
}
function trickScore(rec) {
  const n = rec.tricks?.length ?? 0;
  const tricks = 6.2 * (1 - 0.82 ** n);
  const stats = STATS.reduce((sum, st) => sum + styleOf(rec.stats?.[st]?.points ?? 0), 0) / (STATS.length * 5);
  return clamp10(1 + tricks + stats * 2.8);
}
export const SCORES = { style: styleScore, charm: charmScore, talent: talentScore };

// Each judge's card for Mochi `rec` in show `seed`: what it's worth, give or take a point, whole.
export function cardsFor(rec, seed) {
  const rng = seededRandom(Math.floor(seed * 7919) + (rec.seed ?? 1) * 31);
  return JUDGES.map((j) => {
    const r = rng();
    const wobble = r < 0.2 ? -1 : r > 0.8 ? 1 : 0;
    return clamp10(Math.round(SCORES[j.judges](rec) + wobble));
  });
}

// The show's three rivals at `rank` in hour `hour`: rolled Mochi, dressed and taught for their rank
// (how strong they are: SHOW_RANKS.rival, from none of it to all of it).
export function showRivals(rank, hour) {
  const rng = seededRandom(Math.floor(hour) * 131 + SHOW_ORDER.indexOf(rank) * 977 + 5);
  const [lo, hi] = SHOW_RANKS[rank].rival;
  const names = [...RIVAL_NAMES];
  const out = [];
  for (let k = 0; k < 3; k++) {
    const q = lo + (hi - lo) * rng();
    const rec = newRecord(rollMochi(Math.floor(rng() * 1e9)));
    rec.personality = PERSONALITIES[Math.floor(rng() * PERSONALITIES.length)];
    // (Grown on its own path: an angel's Amamochi, a little devil's Karamochi.)
    if (q > 0.3) {
      rec.path = pathFor(rec);
      rec.stage = rec.path === 'angel' ? 'amamochi' : 'karamochi';
    } else rec.stage = 'mochiko';
    for (const st of STATS) {
      const p = Math.round(100 + 2000 * q * (0.7 + 0.3 * rng()));
      Object.assign(rec.stats[st], { points: p, level: Math.max(1, Math.min(99, Math.round(p / 21))) });
    }
    rec.bond = Math.round(700 * q * (0.6 + 0.4 * rng()));
    rec.mood = 60 + Math.round(40 * rng());
    const tier = TIERS[Math.min(3, Math.floor(q * 4))];
    rec.wear = wearFor(Math.floor(rng() * 1e9), tier);
    // (The best of them in a whole costume now and then.)
    if (q > 0.6 && rng() < 0.4) rec.dress = ['disco', 'starry', 'cloud', 'artist', 'bee'][Math.floor(rng() * 5)];
    const tricks = ['roll', 'twirl', 'clap', 'hops', 'wave', 'shuffle', 'backflip', 'flaps', 'chestbeat', 'boxing', 'hum'];
    rec.tricks = [];
    const nTricks = Math.round(q * 7 * (0.6 + 0.4 * rng()));
    for (let i = 0; i < nTricks; i++) rec.tricks.push(tricks.splice(Math.floor(rng() * tricks.length), 1)[0]);
    // (It puts on what it does best.)
    rec.showAct = bestAct(rec);
    out.push({ rec, name: names.splice(Math.floor(rng() * names.length), 1)[0] });
  }
  return out;
}
