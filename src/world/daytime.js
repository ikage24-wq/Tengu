// Day and night follow the real clock (the player's map rule). `nightOf` is how dark it is, 0 (day)
// to 1 (full night): dusk falls 18:30-21:00, full night until 4:30, dawn breaks by 6:30. The world
// keeps it in world.night (and on the map, map.night, for the renderer); maps under a roof (caves,
// dungeons, arenas) stay as they are.
//
// At night: the sky darkens to stars and the moon, warm lights glow round you, the ways out and a
// map's `lamps`, fireflies come out, some gathering spots only open (`night: true` in
// data/gathering.js), and some monsters sleep (world/habits.js).

const DUSK = [18.5, 21];
const DAWN = [4.5, 6.5];

export function nightOf(date) {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h >= DUSK[1] || h < DAWN[0]) return 1;
  if (h >= DUSK[0]) return (h - DUSK[0]) / (DUSK[1] - DUSK[0]);
  if (h < DAWN[1]) return 1 - (h - DAWN[0]) / (DAWN[1] - DAWN[0]);
  return 0;
}

export const indoors = (map) => Boolean(map.dungeon || map.trial || map.look?.ceiling || map.theme === 'cave' || map.theme === 'hollow');

// Once a second is plenty: the light changes over hours.
export function tickDaytime(world, dt) {
  world.dayT = (world.dayT ?? 1) + dt;
  if (world.dayT >= 1) {
    world.dayT = 0;
    world.night = world.forceNight ?? nightOf((world.dayClock ?? (() => new Date()))());
  }
  world.map.night = indoors(world.map) ? 0 : world.night ?? 0;
}

export const isNight = (world) => (world.map?.night ?? 0) >= 0.5;
