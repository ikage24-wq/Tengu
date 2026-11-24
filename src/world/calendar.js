// The game's calendar (2026-11-24, the player: "a calendar date system, 30 days, 4 seasons"). Every
// game day (world/daytime.js: two real hours, an hour of sun and an hour of night) is a date: thirty
// days to a season, Spring, Summer, Autumn and Winter, so a year is 120 days (ten real days). Like
// the clock it's worked out from the real time, the same date for every player, carrying on across
// reloads. Year 1 began on Spring 1, 2026-11-24.
//
//   dateOf(ms)    -> { year, season (0-3), seasonId, seasonName, day (1-30), dayOfYear (0-119),
//                      gameDay, hour (0-24), minute }
//   dateText(d)   "Spring 12, Year 1"     timeText(d)  "6:45 pm"
//   seasonOf(ms)  'spring' | 'summer' | 'autumn' | 'winter'
//   HOLIDAYS      the year's festivals, each on its own days (world/events.js holds them)
import { DAY_MS, gameHour } from './daytime.js';

export const DAYS_PER_SEASON = 30;
export const SEASONS = [
  { id: 'spring', name: 'Spring', color: '#ff9ec4', icon: 'blossom' },
  { id: 'summer', name: 'Summer', color: '#ffc94a', icon: 'sun' },
  { id: 'autumn', name: 'Autumn', color: '#f0874a', icon: 'leaf' },
  { id: 'winter', name: 'Winter', color: '#8fc8f0', icon: 'snow' },
];
export const DAYS_PER_YEAR = DAYS_PER_SEASON * SEASONS.length;
const EPOCH_DAY = Math.floor(Date.UTC(2026, 10, 24) / DAY_MS);

export function dateOf(ms) {
  const gameDay = Math.floor(ms / DAY_MS) - EPOCH_DAY;
  const year = Math.floor(gameDay / DAYS_PER_YEAR) + 1;
  const dayOfYear = ((gameDay % DAYS_PER_YEAR) + DAYS_PER_YEAR) % DAYS_PER_YEAR;
  const season = Math.floor(dayOfYear / DAYS_PER_SEASON);
  const hour = gameHour(new Date(ms));
  return { year, season, seasonId: SEASONS[season].id, seasonName: SEASONS[season].name, day: (dayOfYear % DAYS_PER_SEASON) + 1, dayOfYear, gameDay, hour, minute: Math.floor((hour % 1) * 60) };
}
export const seasonOf = (ms) => dateOf(ms).seasonId;
// The game's month, for the things that think in months (the garden's festivals and weather): each
// third of a season, Spring 1-10 is March (2) ... Winter 21-30 is February (1).
export function monthOf(ms) {
  const d = dateOf(ms);
  return ([2, 5, 8, 11][d.season] + Math.floor((d.day - 1) / 10)) % 12;
}
export const dateText = (d) => `${d.seasonName} ${d.day}, Year ${d.year}`;
// (a clock that reads like a person says it: every five minutes, "6:45 pm")
export function timeText(d) {
  const h = Math.floor(d.hour);
  const m = Math.floor(d.minute / 5) * 5;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}
// When a given date starts (real ms): this year's, or `year`'s.
export function startOf(season, day, year) {
  return (EPOCH_DAY + (year - 1) * DAYS_PER_YEAR + season * DAYS_PER_SEASON + day - 1) * DAY_MS;
}
// How long until the next day starts (real ms).
export const toNextDay = (ms) => DAY_MS - (((ms % DAY_MS) + DAY_MS) % DAY_MS);

// The year's festivals, each on its own days of its season. (The made-up players' old festivals by
// the real month, now on the game's calendar: world/events.js.)
export const HOLIDAYS = [
  { id: 'newyear', name: 'New Year Festival', season: 0, from: 1, to: 3 },
  { id: 'sweet', name: 'Sweet Day', season: 0, from: 14, to: 14 },
  { id: 'blossom', name: 'Blossom Festival', season: 0, from: 20, to: 24 },
  { id: 'beach', name: 'Summer Beach Days', season: 1, from: 10, to: 20 },
  { id: 'spooky', name: 'Spooky Night', season: 2, from: 26, to: 30 },
  { id: 'snow', name: 'Snow Festival', season: 3, from: 21, to: 30 },
];
export const holidayOn = (d) => HOLIDAYS.find((h) => h.season === d.season && d.day >= h.from && d.day <= h.to) ?? null;
