// Side-quest audit (quest rework part 3, 2026-11-21): every side quest the playthrough does, with how
// long it takes at a normal player's pace and what it pays against hunting those same minutes on
// the best map for the quest's own level (x1 = the same as hunting). The rule set that day (the
// player's call, "Match hunting"): from level 10 a side quest pays at least about what hunting
// would, but never more than about 80% of a level at its own level (so one quest can't fling you
// past your content); below 10, the opening hour keeps its hand-tuned pay.
// `node tools/quest-audit.mjs [--all] [--family mage]` (--all lists the fine ones too; --family plays as
// another job: warrior, mage, thief or archer).
import { measure, playthrough, FAMILY } from './playthrough.mjs';
import { QUESTS } from '../src/data/quests.js';
import { expToNext } from '../src/core/exp.js';

const kpm = measure(150);
const run = playthrough(kpm, 'player');
const all = process.argv.includes('--all');
const flagsOf = (a) => {
  const expX = (a.killExp + a.rewardExp) / Math.max(1, a.huntExp);
  const goldX = (a.killGold + a.rewardGold) / Math.max(1, a.huntGold);
  const capped = a.rewardExp >= 0.75 * expToNext(a.level);
  const f = [];
  if (a.level < 10) return { expX, goldX, f };
  if (a.min > 30) f.push(`long ${Math.round(a.min)} min`);
  if (expX < 0.6 && !capped) f.push(`EXP low x${expX.toFixed(1)}`);
  if (expX > 2.5) f.push(`EXP high x${expX.toFixed(1)}`);
  if (goldX < 0.6 && !capped) f.push(`gold low x${goldX.toFixed(1)}`);
  if (goldX > 5) f.push(`gold high x${goldX.toFixed(1)}`);
  if (a.rewardExp > 1.2 * expToNext(a.level)) f.push(`over a level (${Math.round((a.rewardExp / expToNext(a.level)) * 100)}%)`);
  return { expX, goldX, f };
};
const byGiver = {};
for (const a of run.audit) if (!a.story) (byGiver[a.giver] ??= []).push(a);
let flagged = 0;
for (const [giver, list] of Object.entries(byGiver)) {
  const lines = [];
  for (const a of list) {
    const { expX, goldX, f } = flagsOf(a);
    if (f.length) flagged++;
    if (f.length || all) lines.push(`  ${a.id.padEnd(22)} lv ${String(a.level).padStart(2)}  ${String(Math.round(a.min)).padStart(3)} min  EXP x${expX.toFixed(1)}  gold x${goldX.toFixed(1)} (${a.rewardExp} EXP, ${a.rewardGold} gold)${a.items ? '  + ' + a.items : ''}${f.length ? '   <- ' + f.join(', ') : ''}`);
  }
  if (lines.length) console.log(`${giver} (${list.length} quests)\n${lines.join('\n')}`);
}
const done = new Set(run.audit.map((a) => a.id));
const missed = Object.values(QUESTS).filter((q) => !q.daily && !q.story && q.giver && !done.has(q.id));
console.log(`\n${run.audit.filter((a) => !a.story).length} side quests timed, ${flagged} flagged. Not reached by the ${FAMILY} playthrough (other jobs, or locked): ${missed.length}`);
if (all) console.log('  ' + missed.map((q) => q.id).join(', '));
