// EXP curve, levels 1-100. The shape follows the classic side-scroller curve: quick early levels,
// a steady climb through the 20s-40s, then a long grind toward the cap.

export const MAX_LEVEL = 100;

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
