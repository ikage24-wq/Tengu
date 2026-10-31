// EXP curve, levels 1-50. The shape follows the classic side-scroller curve: quick early levels,
// then a steady climb through the 20s-40s to the cap. The cap is 50 for now (where the story and
// the world end); raise it when new areas arrive (the curve past 50 grows 5.48% a level).

export const MAX_LEVEL = 50;

const table = [0]; // table[level] = EXP needed to go from `level` to `level + 1`
for (let level = 1; level < MAX_LEVEL; level++) {
  if (level <= 5) {
    table[level] = (Math.floor((level * level) / 2) + 15) * level;
  } else if (level <= 50) {
    const q = Math.floor((level * level) / 3);
    table[level] = (q + 19) * q;
  } else {
    table[level] = Math.floor(table[level - 1] * 1.0548);
  }
}

export function expToNext(level) {
  if (level >= MAX_LEVEL) return Infinity;
  return table[level];
}
