// Sound effects made straight from professional recordings (2026-11-03): the Sonniss GDC 2026
// bundle (royalty free, no credit needed; assets/audio/SOURCES.md), cut, layered and trimmed into
// finished sounds (assets/audio/rec), each blow from its impact so nothing lags. These replace the
// recipe of the same name (recipes.js), which still sets the sound's level, pitch spread, gap and
// voice cap; `trim` (dB) matches each one's loudness to the recipe it replaces, and `takes` is how
// many versions there are (one is picked at random each time).

export const RECORDED = {
  swing: { trim: -1.1 },
  swingHeavy: { trim: -1.6 },
  hit: { takes: 4, trim: 3.5 },
  hitHeavy: { takes: 4, trim: 1.4 },
  hitFist: { takes: 4, trim: 2.6 },
  hitSpear: { takes: 4, trim: 4.4 },
  arrowHit: { trim: 4.4 },
  crit: { trim: 2.9 },
  poof: { trim: 3.4 },
  cast: { trim: 4.5 },
  castFire: { trim: -2.9 },
  fireHit: { trim: -2 },
  castIce: { trim: 5.2 },
  iceHit: { trim: -9.6 },
  zapHit: { trim: -6.6 },
  waterHit: { trim: -0.3 },
  castHoly: { trim: -2 },
  holyHit: { trim: 8.2 },
  darkHit: { trim: -0.6 },
  windHit: { trim: -3.9 },
};

// The files for a sound: assets/audio/rec/<name>.mp3, or <name>1.mp3, <name>2.mp3... for takes.
export const recFiles = (name) => {
  const n = RECORDED[name]?.takes ?? 1;
  return n > 1 ? [...Array(n)].map((_, i) => `assets/audio/rec/${name}${i + 1}.mp3`) : [`assets/audio/rec/${name}.mp3`];
};
