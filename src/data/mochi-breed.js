// Breeding Mochi (docs/design/mochi.md step 9): feed a grown Mochi a Heart Mochi (cooked at the
// Garden's kitchen) and flowers bloom round it for a while (data/mochi-raise.js BLOOM); two blooming
// Mochi find each other in the Garden, nuzzle and dance, and leave an egg by the gate
// (world/garden-life.js). The egg holds the baby's genes, bred here.
//
// Each part of the baby comes from one parent or the other, with now and then something new
// (FRESH: rolled as any egg would). Its talents are its parents' grades averaged, with a chance to
// step up. A parent's coat passes on at odds by how rare it is (COAT_PASS; twice as likely when
// both parents have it); otherwise the baby rolls its own, as any egg. It knows its parents.

import { rollMochi, STATS, COATS } from './mochi-genes.js';
import { GRADES } from './mochi-raise.js';

// The parts a baby takes from one parent or the other.
export const INHERITED = ['hair', 'fringe', 'hairColor', 'hairTip', 'eyes', 'eyeColor', 'eyeColor2', 'pupil', 'mouth', 'brows', 'cheek', 'dough', 'smock', 'personality', 'loves', 'hates', 'voice', 'sprout'];
// How often a part is something new instead; how often a talent steps up from the parents' average.
export const FRESH = 0.08;
export const STEP_UP = 0.25;
// The odds a parent's coat passes on, by how rare it is.
export const COAT_PASS = { rare: 1 / 3, epic: 1 / 6, legendary: 1 / 12, mythic: 1 / 25, mutation: 1 / 50 };
const tierOf = (coat) => COATS.find(([name]) => name === coat)?.[2] ?? null;

// The genes of a baby bred from records `a` and `b` (the egg's seed `seed`).
export function breedGenes(a, b, seed, rng = Math.random) {
  const force = { parents: [{ name: a.name ?? null, seed: a.seed }, { name: b.name ?? null, seed: b.seed }] };
  for (const part of INHERITED) {
    if (rng() < FRESH) continue;
    const from = rng() < 0.5 ? a : b;
    force[part] = from[part] && typeof from[part] === 'object' ? { ...from[part] } : from[part] ?? null;
  }
  // (Loves and hates from different parents can clash: then it hates something else.)
  if (force.loves && force.loves === force.hates) delete force.hates;
  force.talents = {};
  for (const st of STATS) {
    const ga = GRADES.indexOf(a.stats?.[st]?.grade ?? a.talents?.[st] ?? 'E');
    const gb = GRADES.indexOf(b.stats?.[st]?.grade ?? b.talents?.[st] ?? 'E');
    let g = Math.round((Math.max(0, ga) + Math.max(0, gb)) / 2);
    if (rng() < STEP_UP) g += 1;
    force.talents[st] = GRADES[Math.min(GRADES.length - 1, g)];
  }
  // A coat passes on (the rarer, the harder; both parents with it, twice as likely).
  const coats = [...new Set([a.coat, b.coat].filter(Boolean))];
  for (const coat of coats.sort((x, y) => (COAT_PASS[tierOf(y)] ?? 0) - (COAT_PASS[tierOf(x)] ?? 0))) {
    const both = a.coat === coat && b.coat === coat;
    if (rng() < (COAT_PASS[tierOf(coat)] ?? 0) * (both ? 2 : 1)) {
      force.coat = coat;
      if (coat === 'candied') force.candy = (a.coat === coat ? a : b).candy;
      if (coat === 'twoflavour') force.hairTip = (a.coat === coat ? a : b).hairTip;
      break;
    }
  }
  return rollMochi(seed, force);
}
