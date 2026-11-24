// Day and night follow the game's own clock (the player's call, 2026-11-01): a game day lasts
// DAY_MINUTES real minutes, worked out from the real time, so every player sees the same hour and it
// carries on across reloads. Since 2026-11-24 (the player: "1 hour sun time and 1 hour night time
// real time") a day is two real hours: the sun is up from 6:00 to 18:00 (an hour), and night runs
// 18:00 to 6:00 (an hour); a game hour is five real minutes. The date (30-day seasons, four a year)
// is world/calendar.js. `nightOf` is how dark it is, 0 (day) to 1 (full night): dusk falls
// 18:00-19:30, full night until 4:30, dawn breaks by 6:00. The world keeps it in world.night (and on
// the map, map.night, for the renderer); maps under a roof (caves, the sea palace) keep their own
// light. The hour's colour (dawn, golden hour, dusk) is a filter over the scene (render/post.js
// drawTimeTint).
//
// At night: the sky darkens to stars and the moon, warm lights glow round you, the ways out and a
// map's `lamps`, fireflies come out, some gathering spots only open (`night: true` in
// data/gathering.js), and some monsters sleep (world/habits.js).

const DUSK = [18, 19.5];
const DAWN = [4.5, 6];

export const DAY_MINUTES = 120;
// One game hour in real milliseconds (five real minutes).
export const GAME_HOUR_MS = (DAY_MINUTES * 60000) / 24;
export const DAY_MS = DAY_MINUTES * 60000;
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
    // (In sixteenths: each new shade of dusk restyles every backdrop picture, so the light steps
    // through a few shades rather than a new one every second.)
    const date = (world.dayClock ?? (() => new Date()))();
    world.night = world.forceNight ?? Math.round(nightOf(date) * 16) / 16;
    // (The game's time of day in minutes, for a clock face: Pastel Harbor's tower, the HUD clock.)
    world.clockBase = gameHour(date) * 60;
  }
  // (Between the once-a-second readings it runs on, so a clock's hands move smoothly: a real second
  // is a fifth of a game minute.)
  world.map.clockMin = ((world.clockBase ?? 0) + (world.dayT * 1440) / (DAY_MINUTES * 60)) % 1440;
  // (A map set at dusk whatever the clock, `map.dusk`, is never lighter than that: the Grand Mochi
  // Course's summer festival.)
  world.map.night = indoors(world.map) ? 0 : Math.max(world.night ?? 0, world.map.dusk ?? 0);
  // (What it's like outside, for a room's window: render/garden.js nurseryWindow.)
  world.map.outsideNight = world.night ?? 0;
}

export const isNight = (world) => (world.map?.night ?? 0) >= 0.5;
// Whether it's night by the clock, roof or no roof (what a night-only flower in a cave goes by).
export const clockNight = (world) => (world.night ?? 0) >= 0.5;
