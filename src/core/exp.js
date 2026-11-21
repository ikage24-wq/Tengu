// EXP curve, levels 1-50, set so reaching 50 takes about 34 hours for a player who does the story
// and the side stories (the player's call: 30 hours on 2026-11-05, then 34 approved 2026-11-07;
// levels 30-49 raised up to 42% on 2026-11-21 to keep 34 once the pace tool measured the
// level 30+ jobs properly; docs/design/main-story.md, "Pacing").
// Each level's EXP is what a player earns in its share of those hours at about 10 kills a minute
// on the monsters of that level (tools/hunt-rate.mjs measures real hunting; its autopilot, with
// every skill maxed and ideal gear, kills 15-40 a minute), smoothed so every level is a steady
// step up from the last. The first levels are quick (a few minutes each) so the opening hour
// carries you to your first job; the climb steepens through the teens, then about 30-40 minutes a
// level in the 20s, 50-60 in the 30s and an hour or more in the 40s. Timed with the whole quest
// list (tools/playthrough.mjs): see docs/design/main-story.md, "Pacing".
// The cap is 50 for now (where the story ends); past it the curve grows 5.48% a level.

export const MAX_LEVEL = 50;

// table[level] = EXP needed to go from `level` to `level + 1`.
const table = [
  0,
  60, 100, 160, 250, 400, 640, 1000, 1600, 2500, 3900,
  5800, 8600, 12800, 19000, 28000, 41000, 60000, 86000, 100000, 120000,
  140000, 150000, 170000, 190000, 220000, 240000, 270000, 300000, 340000, 400000,
  465000, 530000, 605000, 680000, 775000, 875000, 980000, 1080000, 1180000, 1280000,
  1370000, 1460000, 1560000, 1700000, 1850000, 1990000, 2130000, 2270000, 2410000,
];
for (let level = table.length; level < MAX_LEVEL; level++) table[level] = Math.floor(table[level - 1] * 1.0548);

export function expToNext(level) {
  if (level >= MAX_LEVEL) return Infinity;
  return table[level];
}
