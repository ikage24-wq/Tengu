// How the adventurers learn, from their own experience (not a canned script, not a neural net):
//   What pays: every activity they do is scored afterwards (how it went for their needs, their goal
//     and their mood) and that score folds into what they expect from it next time. Someone whose
//     fishing trips keep cheering them up goes fishing more; someone who keeps getting hurt on
//     hunts above their level stops picking them. How fast they update is their curiosity; how
//     hard a bad outcome stings is their patience.
//   Where to hunt: each map's real pay (EXP an hour against what their level expects) is learned
//     per map, so each grows their own favourite grounds.
//   Bosses: every try at a boss teaches them its patterns (mastery 0..1): a loss teaches more than a
//     win, a patient mind learns more from a loss, a healer and a tank in the group help them see
//     more. Mastery is what wins boss fights, as much as levels do.
//   Copying you: when they fight beside you, or hear what you did, they learn from it (a boss you
//     beat becomes one they believe they can beat; a map you like gets a look).
//   Teaching: a veteran passes on what they know of a boss to whoever they train.
import { ADVENTURER_BY_ID } from '../../data/adventurers.js';

const clamp = (v, a = -1, b = 1) => Math.max(a, Math.min(b, v));
const traitsOf = (s) => ADVENTURER_BY_ID[s.id].traits;

// What they expect from an activity (learned; starts at nothing either way).
export const valueOf = (s, kind) => s.know.value[kind] ?? 0;
// Folds an outcome (-1 bad .. 1 good) into what they expect.
export function learnValue(s, kind, outcome) {
  const t = traitsOf(s);
  const felt = outcome < 0 ? outcome * (1.25 - t.patience * 0.6) : outcome;
  const rate = 0.12 + t.curiosity * 0.1;
  s.know.value[kind] = clamp(valueOf(s, kind) + (felt - valueOf(s, kind)) * rate);
}

// A map's pay, against what their level expects: above 0 pays better than they thought.
export const mapValue = (s, id) => s.know.map[id] ?? 0;
export function learnMap(s, id, ratio) {
  const t = traitsOf(s);
  const rate = 0.2 + t.curiosity * 0.1;
  s.know.map[id] = clamp(mapValue(s, id) + (clamp(ratio - 1, -1, 1) - mapValue(s, id)) * rate);
}

// What they know of a boss: tries, wins, mastery.
export const bossKnow = (s, id) => (s.know.boss[id] ??= { tries: 0, wins: 0, mastery: 0 });
export function learnBoss(s, id, { won, healer = false, tank = false, withYou = false }) {
  const t = traitsOf(s);
  const k = bossKnow(s, id);
  k.tries += 1;
  if (won) k.wins += 1;
  // (a loss shows you more of the fight; patience turns it into lessons; good company helps)
  let gain = (won ? 0.06 : 0.16 + t.patience * 0.1) * (1 + (healer ? 0.2 : 0) + (tank ? 0.2 : 0) + (withYou ? 0.3 : 0));
  k.mastery = Math.min(1, k.mastery + gain * (1 - k.mastery));
  return k;
}

// Training at the guild's yard: general fight sense (tactics) and, if they're stuck on a boss, a bit
// of that boss's patterns worked through on the dummy.
export function practise(s, hours, bossId = null) {
  const t = traitsOf(s);
  s.know.tactics = Math.min(1, s.know.tactics + hours * 0.0025 * (0.5 + t.drive) * (1 - s.know.tactics));
  if (bossId) {
    const k = bossKnow(s, bossId);
    k.mastery = Math.min(0.6, k.mastery + hours * 0.015 * (0.4 + t.patience));
  }
}

// A veteran teaching someone: their fight sense and what they know of the learner's wall.
export function teach(teacher, learner, hours, bossId = null) {
  const tt = traitsOf(teacher);
  const lt = traitsOf(learner);
  const k = 0.006 * hours * (0.5 + tt.patience) * (0.5 + lt.patience * 0.5 + lt.curiosity * 0.5);
  learner.know.tactics = Math.min(1, learner.know.tactics + k * Math.max(0.1, teacher.know.tactics + 0.4 - learner.know.tactics));
  if (bossId) {
    const from = teacher.know.boss[bossId]?.mastery ?? 0.3;
    const to = bossKnow(learner, bossId);
    to.mastery = Math.min(0.7, to.mastery + k * Math.max(0.15, from + 0.2 - to.mastery));
  }
  teacher.know.taught += hours;
}

// Watching or hearing what you did. kind: 'beat' (you beat a boss), 'map' (you hunted a map),
// 'party' (they fought beside you on a map: they learn its pay from you).
export function copyYou(s, kind, { boss = null, map = null, near = false } = {}) {
  const t = traitsOf(s);
  const strength = (near ? 1 : 0.4) * (0.4 + t.curiosity * 0.4 + Math.max(0, s.ops.you?.res ?? 0) * 0.4);
  if (kind === 'beat' && boss) {
    const k = bossKnow(s, boss);
    k.mastery = Math.min(0.8, k.mastery + 0.08 * strength);
    k.sawYou = true;
  }
  if ((kind === 'map' || kind === 'party') && map) s.know.map[map] = clamp(mapValue(s, map) + 0.12 * strength);
}
