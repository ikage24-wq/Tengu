// Tunes finishers (data/skills.js `dmg`) so spending a full gauge always pays: with the finisher
// in the rotation a job does at least `GAIN` more damage over 30 s, on one target and on five,
// than holding its gauge full. A first job's finisher is tuned on the first job (level 28), a
// path's own on the path (level 50, with the inherited one left out).
// Usage: node tools/tune-skills.mjs
import { JOBS } from '../src/data/jobs.js';
import { SKILLS } from '../src/data/skills.js';
import { run, measure, balanceChar, BALANCE_JOBS, WEAPON } from './balance.mjs';
import { ITEMS } from '../src/data/items.js';
const WEAPON_OF = (job) => WEAPON[job];

const GAIN = 0.06;
const out = {};
for (const job of BALANCE_JOBS) {
  const tier = JOBS[job].tier;
  const level = tier === 1 ? 28 : 50;
  const c = balanceChar(job, level);
  const extras = Object.keys(c.skills).filter((id) => SKILLS[id].job !== 'novice' && (SKILLS[id].type === 'buff' || SKILLS[id].fullGauge));
  const own = extras.filter((id) => SKILLS[id].fullGauge && SKILLS[id].job === job && (!SKILLS[id].weapons || SKILLS[id].weapons.includes(WEAPON_OF(job))));
  const m = measure(job, level, { secs: 12 });
  for (const id of own) {
    const others = extras.filter((e) => e !== id);
    const gain = () => {
      const g1 = run(job, level, { n: 1, secs: 30, main: m.singleSkill, skip: others }).dps / run(job, level, { n: 1, secs: 30, main: m.singleSkill, skip: extras }).dps - 1;
      const g5 = run(job, level, { n: 5, secs: 30, main: m.packSkill, skip: others }).dps / run(job, level, { n: 5, secs: 30, main: m.packSkill, skip: extras }).dps - 1;
      return Math.min(g1, g5);
    };
    let g = gain();
    let tries = 0;
    while (g < GAIN && tries++ < 12) {
      SKILLS[id].dmg = Math.round((SKILLS[id].dmg ?? 1) * 1.2 * 100) / 100;
      g = gain();
    }
    out[id] = SKILLS[id].dmg ?? 1;
    console.log(`${job.padEnd(13)} ${id.padEnd(16)} dmg ${out[id]}  gain ${Math.round(g * 100)}%${tries > 12 ? '  (no effect: check how it deals damage)' : ''}`);
  }
}
console.log(JSON.stringify(out));
