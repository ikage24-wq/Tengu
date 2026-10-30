// Checks the role rule at many levels: a tank or a healer never outdoes any damage job, on one
// target or on five. Prints each job's damage against the damage jobs' average.
// Usage: node tools/rolecheck.mjs [levels...]
import { JOBS } from '../src/data/jobs.js';
import { measure, BALANCE_JOBS } from './balance.mjs';

const levels = process.argv.slice(2).map(Number);
let ok = true;
for (const level of levels.length ? levels : [20, 28, 35, 40, 45, 50, 55, 60]) {
  const tier = level < 30 ? 1 : 2;
  const rows = BALANCE_JOBS.filter((j) => JOBS[j].tier === tier).map((j) => measure(j, level, { secs: 30 }));
  const dps = rows.filter((r) => r.role === 'dps');
  const s = dps.reduce((a, r) => a + r.single, 0) / dps.length;
  const p = dps.reduce((a, r) => a + r.pack, 0) / dps.length;
  const minS = Math.min(...dps.map((r) => r.single));
  const minP = Math.min(...dps.map((r) => r.pack));
  const bad = rows.filter((r) => r.role !== 'dps' && (r.single >= minS || r.pack >= minP)).map((r) => r.job);
  if (bad.length) ok = false;
  console.log(`Lv ${level}: ${rows.map((r) => `${r.job} ${Math.round((r.single / s) * 100)}/${Math.round((r.pack / p) * 100)}`).join('  ')}${bad.length ? `   BREAKS THE RULE: ${bad.join(', ')}` : ''}`);
}
console.log(ok ? 'Role rule holds.' : 'Role rule broken.');
