// The Mochi Garden's festivals (2026-11-15, the player's garden list: "seasonal festivals ... with
// stalls and games"). Each season has its own, held every EVERY game days (world/daytime.js: a game
// day is DAY_MINUTES real minutes), the same day for everyone, like the weather. Built one season at
// a time; autumn's first:
//
//   Moon Viewing (September to November): through the day the garden is dressed for it - silver
//   pampas grass along the fences, a string of round moon lanterns over the orchard, a table in the
//   orchard laid with a pyramid of white dango and a vase of pampas, facing the cliff where the moon
//   will rise; maple leaves drifting down; a wooden mortar in the square where two Mochi at a time
//   pound mochi, one swinging the mallet and one turning it between strikes. At dusk a great golden
//   moon rises over Moonmortar Cliff, and instead of going to bed the Mochi sit in a row before the
//   offering with a skewer of dango, watching it, until late. In the Mochi Market a festival stall
//   opens for the day with its game, Dango Stack (ui/festival-stall.js), its prizes the season's own
//   garden pieces.
//
// festivalAt(date) -> { id, day, k (0-1: how far the garden's dressed for it), eve (0-1: the moon
//   up), hour } or null. `world.forceFestival` (a test, a film) sets it outright - null for none.

import { DAY_MINUTES, gameHour } from './daytime.js';

const DAY_MS = DAY_MINUTES * 60000;
export const FESTIVALS = {
  moon: { name: 'Moon Viewing', months: [8, 9, 10] },
};
// (Every fourth game day: about once every hour and a half, for 24 minutes.)
export const EVERY = 4;
const smooth = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
// The painter's copy (render/garden-festival.js), like the weather's SKY.
export const FEST = { now: null };

export function festivalAt(date) {
  const day = Math.floor(date.getTime() / DAY_MS);
  if (((day % EVERY) + EVERY) % EVERY !== 1) return null;
  const id = Object.keys(FESTIVALS).find((f) => FESTIVALS[f].months.includes(date.getMonth()));
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
    if (((d % EVERY) + EVERY) % EVERY === 1 && Object.values(FESTIVALS).some((f) => f.months.includes(at.getMonth()))) return d * DAY_MS - ms;
  }
  return null;
}
export function festivalTick(world) {
  const date = (world.dayClock ?? (() => new Date()))();
  const F = world.forceFestival !== undefined ? (world.forceFestival ? { id: 'moon', k: 1, eve: 0, hour: 12, day: 0, ...world.forceFestival } : null) : festivalAt(date);
  world.gardenFestival = F;
  FEST.now = F;
  // (Its moon up in the sky over the garden, the sky's own little one stays away.)
  if (world.map?.garden && !world.map.indoor) world.map.look.noFace = Boolean(F && F.eve > 0.05 && (world.night ?? 0) >= 0.4);
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
// Whether the garden's up late for it: from teatime till half past ten, no bed for anyone.
export const stayUp = (F) => Boolean(F && F.k > 0.5 && F.hour >= 16 && F.hour < 22.5);

// Where the festival's own pieces stand - the offering table in the orchard, facing the cliff; the
// mortar in the square by the nursery - moved along to the nearest clear spot if something of yours
// is set out there. `why(x, w)`: world/garden-life.js gardenSpotWhy.
export const OFFERING = { x: 1908, w: 30 };
export const MORTAR = { x: 1073, w: 30 };
export function festivalSpot(pref, placed, why, widthOf) {
  const clear = (x) => !why(x, pref.w) && !placed.some((p) => p.map === 'garden' && Math.abs(p.x - x) < (pref.w + (widthOf(p) ?? 20)) / 2 + 2);
  for (let d = 0; d < 400; d += 4) for (const s of d ? [1, -1] : [1]) if (clear(pref.x + s * d)) return pref.x + s * d;
  return pref.x;
}
