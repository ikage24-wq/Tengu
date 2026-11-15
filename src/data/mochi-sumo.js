// Mochi Sumo (2026-11-15, the player's garden list: "a sumo ring, a Power contest in a little
// dohyo"). The sumo hall stands on the Mochi Market's lane (world/mochi-sumo.js runs a tournament,
// render/sumo.js draws the hall, ui/mochi-sumo.js enters it). Your Mochi wrestles three rivals in a
// row, each a little stronger than the last; Power decides it most, its Stamina keeps it pushing,
// and a good start helps - press at "Hakkeyoi!" as the referee calls it. Three wins and it's the
// champion; ranks open by winning the one before, like the races and the show; a champion's cup
// stands on the nursery's trophy shelf.
//
// How a bout is won - the finishing move - goes by the winner's Power (data/mochi-raise.js
// STYLE_POINTS, a move for each range), and a cheeky one now and then ducks the charge instead.

import { newRecord, styleOf, pathFor } from './mochi-raise.js';
import { rollMochi, seededRandom, STATS, PERSONALITIES } from './mochi-genes.js';
import { RIVAL_NAMES } from './mochi-race.js';
import { wearFor, TIERS } from './mochi-wardrobe.js';

// The prizes are the show's (data/mochi-show.js): 1st, 2nd and 3rd - three wins, two, one - and a
// little something for trying.
export const SUMO_RANKS = {
  beginner: { name: 'Beginner', rival: [0.06, 0.34], prize: [600, 300, 150], rest: 60 },
  challenge: { name: 'Challenge', rival: [0.34, 0.66], prize: [2500, 1200, 500], rest: 200 },
  master: { name: 'Master', rival: [0.64, 0.98], prize: [10000, 5000, 2000], rest: 600 },
};
export const SUMO_ORDER = Object.keys(SUMO_RANKS);
export const BOUTS = 3;
export const sumoPrize = (rank, wins) => SUMO_RANKS[rank].prize[BOUTS - wins] ?? SUMO_RANKS[rank].rest;
export function sumoOpen(char, rank) {
  const i = SUMO_ORDER.indexOf(rank);
  if (i < 0) return false;
  return i === 0 || Boolean(char.sumoWins?.[SUMO_ORDER[i - 1]]);
}

// The finishing moves, one for each range of the winner's Power, and the duck (the cheeky ones').
export const KIMARITE = [
  { id: 'belly', name: 'Tummy Bump' },
  { id: 'thrust', name: 'Palm Thrusts' },
  { id: 'push', name: 'Push-Out' },
  { id: 'drive', name: 'Grip and Drive' },
  { id: 'lift', name: 'Lift-Out' },
  { id: 'throw', name: 'Over-arm Throw' },
];
export const DUCK = { id: 'duck', name: 'Duck and Trip' };
const SNEAKY = new Set(['cheeky', 'mischief', 'sneaky', 'clumsy']);

// How strong it is in the ring, 0-1: its Power most, its Stamina, how it feels; a baby Mochiko is
// lighter on its feet.
const pts = (rec, st) => rec.stats?.[st]?.points ?? 0;
export function sumoStrength(rec) {
  const power = Math.min(1, pts(rec, 'power') / 2400);
  const stamina = Math.min(1, pts(rec, 'stamina') / 2400);
  return 0.66 * power + 0.2 * stamina + 0.06 * ((rec.mood ?? 60) / 100) + (rec.stage === 'mochiko' ? -0.05 : 0) + (['brave', 'sporty'].includes(rec.personality) ? 0.02 : 0);
}
// A good start ("Hakkeyoi!"): how close to the call you pressed - 'perfect', 'good', 'soon' (too
// early) or null (not at all).
export const START_BOOST = { perfect: 0.08, good: 0.04, soon: 0, late: 0.01 };
export function startOf(dt) {
  if (dt == null) return null;
  if (dt < -0.12) return 'soon';
  if (dt <= 0.1) return 'perfect';
  if (dt <= 0.3) return 'good';
  return 'late';
}

// Its three opponents at `rank` this hour, each a bit stronger than the last.
export function sumoRivals(rank, hour) {
  const rng = seededRandom(Math.floor(hour) * 173 + SUMO_ORDER.indexOf(rank) * 1009 + 11);
  const [lo, hi] = SUMO_RANKS[rank].rival;
  const names = [...RIVAL_NAMES];
  const out = [];
  for (let k = 0; k < BOUTS; k++) {
    const q = lo + ((hi - lo) * (k + 0.3 + 0.5 * rng())) / BOUTS;
    const rec = newRecord(rollMochi(Math.floor(rng() * 1e9)));
    rec.personality = PERSONALITIES[Math.floor(rng() * PERSONALITIES.length)];
    if (q > 0.24) {
      rec.path = pathFor(rec);
      rec.stage = rec.path === 'angel' ? 'amamochi' : 'karamochi';
    } else rec.stage = 'mochiko';
    for (const st of STATS) {
      const p = Math.round(80 + 2300 * q * (st === 'power' ? 1 : 0.6 + 0.4 * rng()));
      Object.assign(rec.stats[st], { points: p, level: Math.max(1, Math.min(99, Math.round(p / 21))) });
    }
    rec.mood = 60 + Math.round(40 * rng());
    rec.wear = wearFor(Math.floor(rng() * 1e9), TIERS[Math.min(3, Math.floor(q * 4))]);
    out.push({ rec, name: names.splice(Math.floor(rng() * names.length), 1)[0], q });
  }
  return out;
}

// A bout between `a` (yours) and `b`: who wins, with what, and how the push goes - the point where
// they meet, from the middle of the ring (+ toward b's side), over the struggle. `start`: your start
// (startOf). Seeded, so the same bout always plays the same.
export function boutOf(a, b, seed, start = null) {
  const rng = seededRandom(seed * 7 + 3);
  const sa = sumoStrength(a) + (START_BOOST[start] ?? 0) + (rng() - 0.5) * 0.14;
  const sb = sumoStrength(b) + (rng() - 0.5) * 0.14;
  const youWin = sa >= sb;
  const win = youWin ? a : b;
  const gap = Math.abs(sa - sb);
  // (A close one is a long, swaying struggle; a mismatch is over in a moment.)
  const close = 1 - Math.min(1, gap / 0.3);
  const len = 1.3 + 3.4 * close;
  const sways = Math.round(1 + 3 * close);
  const side = youWin ? 1 : -1;
  const path = [[0, 0]];
  for (let i = 1; i <= sways; i++) {
    // (Back and forth, the loser holding its own a while, then giving way.)
    const k = i / (sways + 1);
    const toward = i % 2 ? -side : side;
    path.push([len * k, toward * (6 + 16 * close * rng()) + side * 14 * k]);
  }
  path.push([len, side * 34]);
  let move = KIMARITE[styleOf(pts(win, 'power'))];
  if (SNEAKY.has(win.personality) && rng() < 0.35) move = DUCK;
  return { youWin, move, len: move === DUCK ? 0 : len, path: move === DUCK ? [[0, 0]] : path, sa, sb };
}
// Where the push has got to `t` seconds in (eased between its points).
export function pushAt(bout, t) {
  const p = bout.path;
  if (t <= 0 || p.length < 2) return p[0][1];
  for (let i = 1; i < p.length; i++) {
    if (t <= p[i][0]) {
      const k = (t - p[i - 1][0]) / Math.max(1e-6, p[i][0] - p[i - 1][0]);
      const e = k * k * (3 - 2 * k);
      return p[i - 1][1] + (p[i][1] - p[i - 1][1]) * e;
    }
  }
  return p[p.length - 1][1];
}
