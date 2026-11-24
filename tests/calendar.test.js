// The game's clock and calendar (world/daytime.js, world/calendar.js): a day is two real hours, an
// hour of sun and an hour of night; 30-day seasons, four to a year; the hour's colour filter.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { DAY_MINUTES, DAY_MS, GAME_HOUR_MS, gameHour, nightOf } from '../src/world/daytime.js';
import { dateOf, dateText, timeText, seasonOf, monthOf, startOf, holidayOn, HOLIDAYS, DAYS_PER_YEAR } from '../src/world/calendar.js';
import { timeTints } from '../src/render/post.js';
import { festivalOn } from '../src/world/events.js';

test('a day is two real hours: an hour of sun, an hour of night', () => {
  assert.equal(DAY_MINUTES, 120);
  assert.equal(GAME_HOUR_MS, 5 * 60000);
  const base = Math.floor(Date.UTC(2026, 11, 1) / DAY_MS) * DAY_MS;
  const at = (h) => new Date(base + h * GAME_HOUR_MS);
  assert.ok(Math.abs(gameHour(at(13.25)) - 13.25) < 1e-9);
  let sun = 0;
  for (let h = 0; h < 24; h += 0.25) if (nightOf(at(h)) < 0.5) sun += 0.25;
  assert.ok(Math.abs(sun - 12.5) <= 1.5, `about half the day in the sun (${sun} game hours)`);
  assert.equal(nightOf(at(12)), 0);
  assert.equal(nightOf(at(0)), 1);
});

test('the calendar: 30 days a season, four seasons, then a new year', () => {
  const d = dateOf(startOf(0, 1, 1) + 1);
  assert.deepEqual([d.year, d.seasonName, d.day], [1, 'Spring', 1]);
  assert.equal(dateText(dateOf(startOf(2, 17, 3) + DAY_MS / 2)), 'Autumn 17, Year 3');
  assert.equal(dateOf(startOf(3, 30, 1) + DAY_MS - 1).day, 30);
  assert.equal(dateText(dateOf(startOf(3, 30, 1) + DAY_MS)), 'Spring 1, Year 2');
  assert.equal(DAYS_PER_YEAR, 120);
  assert.equal(seasonOf(startOf(1, 12, 1) + 1), 'summer');
  // (each third of a season reads as a month for the garden: Winter 25 is February)
  assert.equal(monthOf(startOf(3, 25, 1) + 1), 1);
  assert.equal(monthOf(startOf(0, 1, 1) + 1), 2);
  // (the clock says it like a person: every five minutes)
  assert.equal(timeText({ hour: 18.79, minute: 47 }), '6:45 pm');
  assert.equal(timeText({ hour: 0.5, minute: 30 }), '12:30 am');
});

test('festivals fall on their own days, and the old ones follow the calendar', () => {
  for (const h of HOLIDAYS) {
    const d = dateOf(startOf(h.season, h.from, 1) + DAY_MS / 2);
    assert.equal(holidayOn(d).id, h.id);
    assert.equal(festivalOn(new Date(startOf(h.season, h.from, 1) + DAY_MS / 2))?.name.split(' ')[0], (h.id === 'beach' ? 'Summer' : h.name.split(' ')[0]));
  }
  assert.equal(holidayOn(dateOf(startOf(1, 2, 1) + 1)), null);
});

test("the hour's colour: rosy dawn, golden afternoon, violet dusk, blue night, nothing at noon", () => {
  const col = (h, n = 0) => timeTints(h, n).map(([c]) => c);
  assert.deepEqual(col(12), []);
  assert.ok(col(5.6).includes('#ff9a8a'));
  assert.ok(col(17.2).includes('#ff9a30'));
  assert.ok(col(18.8, 0.5).includes('#c46ad8'));
  assert.ok(col(23, 1).includes('#4a66c8'));
});
