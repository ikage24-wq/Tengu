// EXP curve, levels 1-50, set so reaching 50 takes about 30 hours for a player who does the story
// and some side stories (the player's call, 2026-11-05; docs/design/main-story.md, "Pacing").
// Each level's EXP is what a player earns in its share of those hours at about 10 kills a minute
// on the monsters of that level (tools/hunt-rate.mjs measures real hunting; its autopilot, with
// every skill maxed and ideal gear, kills 15-40 a minute), smoothed so every level is a steady
// step up from the last. The first levels stay quick (a few minutes); then about 15-25 minutes a
// level in the 10s, 30-40 in the 20s, 50-60 in the 30s and an hour or more in the 40s:
// about 1 h to level 10, 4.5 h to 20, 10.5 h to 30, 20 h to 40 and 30 h to 50.
// The cap is 50 for now (where the story ends); past it the curve grows 5.48% a level.

export const MAX_LEVEL = 50;

// table[level] = EXP needed to go from `level` to `level + 1`.
const table = [
  0,
  160, 240, 420, 750, 1300, 2200, 3700, 5900, 8900, 13000,
  18000, 24000, 32000, 39000, 47000, 57000, 70000, 86000, 100000, 120000,
  140000, 150000, 170000, 190000, 220000, 240000, 270000, 300000, 340000, 380000,
  420000, 460000, 500000, 540000, 590000, 640000, 690000, 760000, 830000, 900000,
  970000, 1000000, 1100000, 1200000, 1300000, 1400000, 1500000, 1600000, 1700000,
];
for (let level = table.length; level < MAX_LEVEL; level++) table[level] = Math.floor(table[level - 1] * 1.0548);

export function expToNext(level) {
  if (level >= MAX_LEVEL) return Infinity;
  return table[level];
}
