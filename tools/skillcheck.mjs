// Whether each job's finisher and buffs pay off: damage over 30 s (one target and five) with the
// skill in the rotation against without it, the rest played the job's best way.
// Usage: node tools/skillcheck.mjs [level] [jobs...]
import { JOBS } from '../src/data/jobs.js';
import { SKILLS } from '../src/data/skills.js';
import { run, measure, balanceChar, BALANCE_JOBS } from './balance.mjs';

const args = process.argv.slice(2);
const level = Number(args.find((a) => /^\d+$/.test(a)) ?? 60);
const jobs = args.filter((a) => JOBS[a]);
for (const job of jobs.length ? jobs : BALANCE_JOBS.filter((j) => JOBS[j].tier === (level < 30 ? 1 : 2))) {
  const m = measure(job, level, { secs: 12 });
  const c = balanceChar(job, level);
  const extras = Object.keys(c.skills).filter((id) => SKILLS[id].job !== 'novice' && (SKILLS[id].type === 'buff' || SKILLS[id].fullGauge));
  const line = [];
  for (const id of extras) {
    const others = extras.filter((e) => e !== id);
    const w1 = run(job, level, { n: 1, secs: 30, main: m.singleSkill, skip: others }).dps;
    const o1 = run(job, level, { n: 1, secs: 30, main: m.singleSkill, skip: extras }).dps;
    const w5 = run(job, level, { n: 5, secs: 30, main: m.packSkill, skip: others }).dps;
    const o5 = run(job, level, { n: 5, secs: 30, main: m.packSkill, skip: extras }).dps;
    line.push(`${id}${SKILLS[id].fullGauge ? '!' : ''} ${Math.round((w1 / o1 - 1) * 100)}%/${Math.round((w5 / o5 - 1) * 100)}%`);
  }
  console.log(`${job.padEnd(13)} ${line.join('  ')}`);
}
