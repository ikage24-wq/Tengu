// ---------- Per-path skills: the one mechanism (keep it here, and keep it generic) ----------
// A second job keeps its first job's skills (the same key, numbers and purpose), but each path plays
// them with its own move and effects, in its own colour and shapes (the player's pick, "own version
// per path": the Paladin's Titan Breaker is not the Warrior's). Shoulder Charge was the first.
//
// The data lives with each skill: its `at()` may return `paths`, keyed by job id (paladin,
// berserker, beastmaster, stormcaller, shinobi, kitsune, shrinemaiden, onmyoji, ...):
//   paths: { paladin: [ ...combo steps ] }           an array is the path's own combo (moves,
//                                                     timing, effects), in place of `combo`;
//   paths: { beastmaster: { anim: 'pthattrap', look: 'hat' } }   an object is laid over the
//                                                     skill's params (a skill that isn't a combo:
//                                                     its move `anim`, a trap's `look`, ...).
// The skill's numbers stay its own: a path's version should keep the same hits (pct, reach,
// targets, knock, launch) and only change how they are played. A skill's display name per path is
// `pathNames` on the skill itself (data/skills.js). Procs that play a move of their own (the
// Warrior's Whirlwind) pick their path's step in world/melee.js (`WHIRLS`).
//
// The deepest job in the character's line that has a version wins, so a later job can add its own
// on top of its path's.
import { jobChain } from './jobs.js';

export function pathParams(params, job) {
  if (!params?.paths || !job) return params;
  const chain = jobChain(job);
  for (let i = chain.length - 1; i >= 0; i--) {
    const own = params.paths[chain[i]];
    if (own) return Array.isArray(own) ? { ...params, combo: own } : { ...params, ...own };
  }
  return params;
}

// The move a skill plays for `job` (its combo's first step, or its own `anim`), for checks and tools.
export function pathMoves(skill, level, job) {
  const p = pathParams({ ...skill.at(level, skill.maxLevel) }, job);
  return p.combo ? p.combo.map((st) => st.move) : [p.anim ?? skill.anim].filter(Boolean);
}

// A skill's name as `job` plays it (Shoulder Charge is a Paladin's Shield Rush), from `pathNames`.
export function pathName(skill, job) {
  if (!skill?.pathNames || !job) return skill?.name;
  const chain = jobChain(job);
  for (let i = chain.length - 1; i >= 0; i--) if (skill.pathNames[chain[i]]) return skill.pathNames[chain[i]];
  return skill.name;
}
