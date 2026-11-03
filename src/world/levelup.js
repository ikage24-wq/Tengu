// The hero's level up, however the EXP came (a kill, a dungeon chest, a life action): a word in the
// log, the level-up burst at their feet (render/effects.js), the jingle (audio/listen.js hears the
// level change), and a note when a new job is ready.

import { nextJobs } from '../data/jobs.js';

export function celebrateLevels(world, levels) {
  if (!(levels > 0)) return;
  const char = world.char;
  world.events?.push({ type: 'levelup', level: char.level });
  if (world.body) world.fx?.push({ kind: 'levelup', x: world.body.x, y: world.body.y, t: 0, dur: 1.6 });
  world.log?.(`Level up! You are now level ${char.level}.`, '#ffe36b');
  if (nextJobs(char.job, char.level).some((j) => j.level === char.level)) {
    world.log?.('A new job is ready! Visit your instructor in their home town (M opens the world map).', '#ffe36b');
  }
}
