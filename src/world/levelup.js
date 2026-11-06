// The hero's level up, however the EXP came (a kill, a dungeon clear, a life action): a word in the
// log, the level-up burst at their feet (render/effects.js), the jingle (audio/listen.js hears the
// level change), and a note when a new job is ready, naming who teaches it and where they are.

import { nextJobs } from '../data/jobs.js';
import { NPCS } from '../data/npcs.js';
import { MAPS } from '../data/maps.js';

export function celebrateLevels(world, levels) {
  if (!(levels > 0)) return;
  const char = world.char;
  world.events?.push({ type: 'levelup', level: char.level });
  if (world.body) world.fx?.push({ kind: 'levelup', x: world.body.x, y: world.body.y, t: 0, dur: 1.6 });
  world.log?.(`Level up! You are now level ${char.level}.`, '#ffe36b');
  for (const line of jobNote(char, world.map?.id)) world.log?.(line, '#ffe36b');
}

// Each job family's instructor and the town they teach in (the first map they stand on).
function teacherOf(family) {
  const npc = Object.values(NPCS).find((n) => n.role === 'instructor' && n.family === family);
  const town = npc && Object.values(MAPS).find((m) => m.npcs?.some((n) => n.id === npc.id));
  return npc && town ? { npc, town } : null;
}

// What the log says when a new job opens at this level (nothing when none does): who to see and
// where, a line per two teachers so each fits the log.
export function jobNote(char, here = null) {
  const jobs = nextJobs(char.job, char.level).filter((j) => j.level === char.level);
  if (!jobs.length) return [];
  const where = (t) => (t.town.id === here ? `right here in ${t.town.name}` : `in ${t.town.name}`);
  const teachers = [];
  for (const j of jobs) {
    const t = teacherOf(j.family);
    if (!t) continue;
    const had = teachers.find((o) => o.npc === t.npc);
    if (had) had.jobs.push(j);
    else teachers.push({ ...t, jobs: [j] });
  }
  if (!teachers.length) return ['A new job is ready! Visit your instructor (M opens the world map).'];
  // A path past your first job: your own instructor, and a trial first.
  if (teachers.length === 1) {
    const t = teachers[0];
    const paths = t.jobs.map((j) => j.name);
    const or = paths.length > 1 ? `${paths.slice(0, -1).join(', ')} or ${paths.at(-1)}` : paths[0];
    return [
      `A new job is ready! ${t.npc.name} is waiting for you ${where(t)} (M opens the world map).`,
      t.jobs.some((j) => j.trial) ? `Pass ${t.npc.name}'s trial and you're a ${or}. No pressure. (Some pressure.)` : `Say the word and you're a ${or}.`,
    ];
  }
  // The first job: every instructor wants you, and is pretending not to.
  const count = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'][teachers.length] ?? 'All the';
  const lines = [`A new job is ready! ${count} instructors are pretending they aren't waiting for you (M opens the world map):`];
  for (let i = 0; i < teachers.length; i += 2) {
    lines.push(teachers.slice(i, i + 2).map((t) => `${t.npc.name} the ${t.jobs[0].name} ${where(t)}`).join(', ') + (i + 2 < teachers.length ? ',' : '.'));
  }
  return lines;
}
