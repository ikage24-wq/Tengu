// Day and night follow the game's own clock (the player's call, 2026-11-01): a game day lasts
// DAY_MINUTES real minutes (a game hour is a real minute), worked out from the real time, so every
// player sees the same hour and it carries on across reloads. `nightOf` is how dark it is, 0 (day)
// to 1 (full night): dusk falls 18:30-21:00, full night until 4:30, dawn breaks by 6:30. The world
// keeps it in world.night (and on the map, map.night, for the renderer); maps under a roof (caves,
// the sea palace) keep their own light.
//
// At night: the sky darkens to stars and the moon, warm lights glow round you, the ways out and a
// map's `lamps`, fireflies come out, some gathering spots only open (`night: true` in
// data/gathering.js), and some monsters sleep (world/habits.js).

const DUSK = [18.5, 21];
const DAWN = [4.5, 6.5];

export const DAY_MINUTES = 24;
// The game's hour (0-24) at a real moment.
export const gameHour = (date) => ((date.getTime() / 60000) % DAY_MINUTES) * (24 / DAY_MINUTES);

export function nightOf(date) {
  const h = gameHour(date);
  if (h >= DUSK[1] || h < DAWN[0]) return 1;
  if (h >= DUSK[0]) return (h - DUSK[0]) / (DUSK[1] - DUSK[0]);
  if (h < DAWN[1]) return 1 - (h - DAWN[0]) / (DAWN[1] - DAWN[0]);
  return 0;
}

// Under a roof: a room with a ceiling, a cave, the Hollow, the sea palace under the waves, or a
// place with its own fixed light (`ownLight`: the manor's moonlit garden, Lilith's grotto). Open-air
// dungeon rooms and the queens' arenas follow the clock like any field.
export const indoors = (map) => Boolean(map.indoor || map.ownLight || map.look?.ceiling || map.theme === 'cave' || map.theme === 'hollow' || map.theme === 'aquarium');

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
// Whether it's night by the clock, roof or no roof (what a night-only flower in a cave goes by).
export const clockNight = (world) => (world.night ?? 0) >= 0.5;
