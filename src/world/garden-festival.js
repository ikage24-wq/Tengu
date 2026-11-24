// The Mochi Garden's festivals (2026-11-15, the player's garden list: "seasonal festivals ... with
// stalls and games"). Each season has its own, held every EVERY game days (world/daytime.js: a game
// day is DAY_MINUTES real minutes), the same day for everyone, like the weather. Built one season at
// a time; each has its stall in the Mochi Market with a game of its own, its prizes the season's own
// garden pieces, won for its tokens (ui/festival-stall.js):
//
//   Moon Viewing (September to November): through the day the garden is dressed for it - silver
//   pampas grass along the fences, a string of round moon lanterns over the orchard, a table in the
//   orchard laid with a pyramid of white dango and a vase of pampas, facing the cliff where the moon
//   will rise; maple leaves drifting down; a wooden mortar in the square where two Mochi at a time
//   pound mochi, one swinging the mallet and one turning it between strikes. At dusk a great golden
//   moon rises over Moonmortar Cliff, and instead of going to bed the Mochi sit in a row before the
//   offering with a skewer of dango, watching it, until late. In the Mochi Market a festival stall
//   opens for the day with its game, Dango Stack.
//
//   Snow Lantern Festival (December to February): snow lies over the garden, the big snow-Mochi
//   stands by the square, and little snow lanterns - mounds of snow with a window and a candle in -
//   line the paths; warm lanterns strung over the orchard, a few flakes drifting down. By day the
//   Mochi have snowball fights, two at a time; at dusk each goes round lighting a snow lantern, and
//   they sit up late beside them, paws held out to the glow. The stall's game: Snowball Toss.
//
//   Blossom Day (March to May): the hills round the garden pink with cherry trees in bloom, petals
//   drifting through everything, pink-and-white lanterns strung over the orchard, and a red picnic
//   mat laid out in the square with a stacked lunch box. The Mochi have a picnic on it with skewers
//   of three-colour dango, and chase petals on the breeze; at dusk the lanterns light up and they
//   stay out on the mat under the blossom. The stall's game: Petal Catch.
//
//   Lantern Night (June to August): red-and-white paper lanterns strung over the orchard, wind chimes
//   tinkling on their poles. By day the Mochi sit in the shade fanning themselves; at dusk each sets
//   a little paper lantern boat afloat on the lily pond, and the boats drift glowing across it; at
//   night fireworks burst over the cliff and the Mochi sit out with sparklers, watching. The stall's
//   game: Ring Toss.
//
// festivalAt(date) -> { id, day, k (0-1: how far the garden's dressed for it), eve (0-1: the moon
//   up), hour } or null. `world.forceFestival` (a test, a film) sets it outright - null for none.

import { DAY_MS, gameHour } from './daytime.js';
import { monthOf } from './calendar.js';
export const FESTIVALS = {
  moon: { name: 'Moon Viewing', months: [8, 9, 10], token: 'Moon Token', game: 'dango', stall: 'Moon Viewing Stall' },
  snow: { name: 'Snow Lantern Festival', months: [11, 0, 1], token: 'Snow Token', game: 'snowball', stall: 'Snow Lantern Stall' },
  blossom: { name: 'Blossom Day', months: [2, 3, 4], token: 'Blossom Token', game: 'petal', stall: 'Blossom Day Stall' },
  lantern: { name: 'Lantern Night', months: [5, 6, 7], token: 'Lantern Token', game: 'ring', stall: 'Lantern Night Stall' },
};
// (Every fourth game day: once every eight real hours, for the two hours of its day.)
export const EVERY = 4;
const smooth = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
// The painter's copy (render/garden-festival.js), like the weather's SKY.
export const FEST = { now: null };

export function festivalAt(date) {
  const day = Math.floor(date.getTime() / DAY_MS);
  if (((day % EVERY) + EVERY) % EVERY !== 1) return null;
  // (the game's own seasons: world/calendar.js)
  const id = Object.keys(FESTIVALS).find((f) => FESTIVALS[f].months.includes(monthOf(date.getTime())));
  if (!id) return null;
  const hour = gameHour(date);
  // (Dressed by breakfast, taken down at midnight; the moon up over the cliff from dusk.)
  const k = smooth((hour - 5.5) / 1.5) * (1 - smooth((hour - 23.3) / 0.7));
  const eve = smooth((hour - 17.4) / 2.2) * (1 - smooth((hour - 23) / 1));
  return { id, day, k, eve, hour };
}
// How long until the next festival day starts (real ms), for the market's notice board.
export function nextFestivalIn(date) {
  const ms = date.getTime();
  const day = Math.floor(ms / DAY_MS);
  for (let d = day + 1; d < day + 60; d++) {
    const at = new Date(d * DAY_MS);
    if (((d % EVERY) + EVERY) % EVERY === 1 && Object.values(FESTIVALS).some((f) => f.months.includes(monthOf(at.getTime())))) return d * DAY_MS - ms;
  }
  return null;
}
export function festivalTick(world) {
  const date = (world.dayClock ?? (() => new Date()))();
  const F = world.forceFestival !== undefined ? (world.forceFestival ? { id: 'moon', k: 1, eve: 0, hour: 12, day: 0, ...world.forceFestival } : null) : festivalAt(date);
  world.gardenFestival = F;
  FEST.now = F;
  // (Its moon up in the sky over the garden - and over the Mochi Market, under the same sky - the
  // sky's own little one stays away.)
  if ((world.map?.garden || world.map?.mochiTown) && !world.map.indoor) world.map.look.noFace = Boolean(F && F.eve > 0.05 && (world.night ?? 0) >= 0.4);
  return F;
}
// Up by the festival stall in the Mochi Market (`map.festStall`), on a festival day: its window
// (ui/festival-stall.js).
export function festStallUp(world) {
  const at = world.map.festStall;
  if (at == null || !FEST.now || FEST.now.k < 0.3 || world.gardenVisit || !world.char.garden || Math.abs(world.body.x - at) > 40) return false;
  world.events.push({ type: 'feststall' });
  return true;
}
// The festival's own weather on top of the day's (after world/garden-weather.js has its say): for
// the Snow Lantern Festival, snow lying deep over the garden all day, whatever's falling.
export function festivalWeather(world) {
  const F = world.gardenFestival;
  const W = world.gardenWeather;
  if (F?.id !== 'snow' || !W || F.k <= 0) return;
  world.gardenWeather = { ...W, snow: Math.max(W.snow ?? 0, 0.9 * F.k) };
}
// Whether the garden's up late for it: from teatime till half past ten, no bed for anyone.
export const stayUp = (F) => Boolean(F && F.k > 0.5 && F.hour >= 16 && F.hour < 22.5);

// Where the festival's own pieces stand - the offering table in the orchard, facing the cliff; the
// mortar in the square by the nursery - moved along to the nearest clear spot if something of yours
// is set out there. `why(x, w)`: world/garden-life.js gardenSpotWhy.
export const OFFERING = { x: 1908, w: 30 };
export const MORTAR = { x: 1073, w: 30 };
// The Snow Lantern Festival's lanterns, along the square and the orchard's flat (each a spot to stand
// beside and light it; one with a piece of yours on it is left out).
export const SNOW_LANTERNS = [380, 650, 840, 1110, 1480, 1600, 1780, 1900, 2040];
// Blossom Day's picnic mat, in the square by the nursery (where Moon Viewing's mortar stands).
export const MAT = { x: 1073, w: 56 };
// Lantern Night: the shade the Mochi fan themselves in (the big tree's), and where the lantern boats
// are set afloat - the lily pond's near bank.
export const SHADE = [1600, 1700];
export const LAUNCH = 2068;
// (Anywhere in the garden if it must; null if there's nowhere at all - a garden packed full.)
export function festivalSpot(pref, placed, why, widthOf) {
  const clear = (x) => !why(x, pref.w) && !placed.some((p) => p.map === 'garden' && Math.abs(p.x - x) < (pref.w + (widthOf(p) ?? 20)) / 2 + 2);
  for (let d = 0; d < 2000; d += 4) for (const s of d ? [1, -1] : [1]) if (clear(pref.x + s * d)) return pref.x + s * d;
  return null;
}
