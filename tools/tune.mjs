// Finds each job's damage tuning (data/jobs.js): `power` (everything it hits) from one-target
// damage, and `spread` (its hits on the monsters past the first) from five-target damage, so the
// roles land where they should at the job's own stage (first jobs at levels 20 and 28, paths at 40, 50 and
// 50), each against the damage jobs' average:
//   melee damage jobs   108% (first jobs 106%)    ranged damage jobs  96% (first jobs 94%)
//   support (tanks and healers)  88%, a bit under the ranged ones
// each damage job keeping its own lean (one target or crowds) up to +-5%, on one target and on a
// crowd alike (the player's rule, 2026-11-07: melee hits hardest, then ranged, then support), so a
// tank or healer never outdoes a damage job. Prints the numbers to put in.
// Usage: node tools/tune.mjs [rounds]

import { JOBS } from '../src/data/jobs.js';
import { measure, BALANCE_JOBS } from './balance.mjs';
import { roleOf } from '../src/data/dungeons.js';

const TARGET = { tank: 0.88, healer: 0.88 };
// The damage jobs that fight up close (the rest shoot, cast or throw from range).
const MELEE = new Set(['thief', 'berserker', 'kitsune']);
const DPS = { 1: { melee: 1.06, ranged: 0.94 }, 2: { melee: 1.08, ranged: 0.96 } };
const LEAN = 0.05;
const STAGES = { 1: [20, 28], 2: [40, 45, 50] };
const rounds = Number(process.argv[2] ?? 4);
const role = (j) => roleOf(j, JOBS[j].family);

// One-target and five-target damage against the damage jobs' average, over the tier's stages.
function rel(tier) {
  const jobs = BALANCE_JOBS.filter((j) => JOBS[j].tier === tier);
  const out = Object.fromEntries(jobs.map((j) => [j, { single: 0, pack: 0 }]));
  for (const level of STAGES[tier]) {
    const rows = jobs.map((j) => measure(j, level, { secs: 30 }));
    const dps = rows.filter((r) => r.role === 'dps');
    const s = dps.reduce((a, r) => a + r.single, 0) / dps.length;
    const p = dps.reduce((a, r) => a + r.pack, 0) / dps.length;
    for (const r of rows) {
      out[r.job].single += r.single / s / STAGES[tier].length;
      out[r.job].pack += r.pack / p / STAGES[tier].length;
    }
  }
  return out;
}

const lean = {};
for (let i = 0; i < rounds; i++) {
  for (const tier of [1, 2]) {
    const r = rel(tier);
    // A damage job's own lean, from how it plays now (kept within LEAN, and centred so the damage
    // jobs still average out level).
    if (!Object.keys(lean).some((j) => JOBS[j].tier === tier)) {
      const dps = Object.keys(r).filter((j) => role(j) === 'dps');
      for (const j of dps) lean[j] = Math.max(-LEAN, Math.min(LEAN, (r[j].pack - r[j].single) / 2));
      const mean = dps.reduce((a, j) => a + lean[j], 0) / dps.length;
      for (const j of dps) lean[j] -= mean;
    }
    for (const [j, v] of Object.entries(r)) {
      const base = DPS[tier][MELEE.has(j) ? 'melee' : 'ranged'];
      const want = role(j) === 'dps' ? { single: base - lean[j], pack: base + lean[j] } : { single: TARGET[role(j)], pack: TARGET[role(j)] };
      const p0 = JOBS[j].power ?? 1;
      const p1 = Math.round(p0 * (want.single / v.single) * 100) / 100;
      const s1 = Math.round(Math.max(0.2, Math.min(2, (JOBS[j].spread ?? 1) * (want.pack / v.pack) / (p1 / p0))) * 100) / 100;
      JOBS[j].power = p1;
      JOBS[j].spread = s1;
      console.log(`round ${i + 1}  ${j.padEnd(13)} single ${v.single.toFixed(2)} pack ${v.pack.toFixed(2)} -> power ${p1} spread ${s1}`);
    }
  }
}
console.log(JSON.stringify(Object.fromEntries(BALANCE_JOBS.map((j) => [j, { power: JOBS[j].power ?? 1, spread: JOBS[j].spread ?? 1 }]))));
