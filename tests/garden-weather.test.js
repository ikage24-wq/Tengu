import { test } from 'node:test';
import assert from 'node:assert/strict';
import { forecast, weatherAt, RAMP } from '../src/world/garden-weather.js';
import { DAY_MINUTES } from '../src/world/daytime.js';

const DAY = DAY_MINUTES * 60000;
const HOUR = DAY / 24;
// (A day, by its index, and the hour on it, as real time.)
const at = (day, h) => day * DAY + h * HOUR;

test('the garden weather is the same for everyone: a day forecast from the day alone', () => {
  for (let d = 1000; d < 1040; d++) assert.deepEqual(forecast(d, 6), forecast(d, 6));
  const a = weatherAt(at(1234, 13.5), 6);
  const b = weatherAt(at(1234, 13.5), 6);
  assert.deepEqual(a, b);
});

test('a spell comes on gently and eases off - never switched on or off at once', () => {
  let found = 0;
  for (let d = 2000; d < 2200 && found < 12; d++) {
    for (const s of forecast(d, 6)) {
      found += 1;
      const before = weatherAt(at(d, s.from - 0.05), 6);
      const start = weatherAt(at(d, s.from + RAMP * 0.25), 6);
      const mid = weatherAt(at(d, (s.from + s.to) / 2), 6);
      const end = weatherAt(at(d, s.to - RAMP * 0.25), 6);
      assert.ok(before.k < 0.05 || before.kind !== s.kind, 'nothing just before');
      assert.ok(start.k > 0 && start.k < 0.5, `easing on: ${start.k}`);
      assert.ok(mid.k > 0.95 && mid.kind === s.kind, `full in the middle: ${mid.kind} ${mid.k}`);
      assert.ok(end.k > 0 && end.k < 0.5, `easing off: ${end.k}`);
    }
  }
  assert.ok(found >= 12, 'plenty of spells to look at');
});

test('after rain the puddles dry up slowly, and a daytime shower leaves a rainbow', () => {
  let rains = 0;
  let bows = 0;
  for (let d = 3000; d < 3400; d++) {
    const day = forecast(d, 6);
    for (const s of day.filter((x) => x.kind === 'rain')) {
      rains += 1;
      const wetEnd = weatherAt(at(d, s.to), 6).wet;
      const later = weatherAt(at(d, s.to + 1), 6).wet;
      const dry = weatherAt(at(d, s.to + 3), 6).wet;
      assert.ok(wetEnd > 0.6 && later < wetEnd && later > 0.1, `drying: ${wetEnd} -> ${later}`);
      // (Unless another shower's come along since.)
      if (!day.some((x) => x.kind === 'rain' && x.from > s.to && x.from < s.to + 3)) assert.ok(dry < 0.05, `dry again: ${dry}`);
      const bow = weatherAt(at(d, s.to + 0.5), 6).rainbow;
      if (s.to >= 7 && s.to <= 18.5) {
        bows += 1;
        assert.ok(bow > 0.9, `a rainbow after a daytime shower: ${bow}`);
      } else assert.equal(bow, 0, 'no rainbow in the dark');
    }
  }
  assert.ok(rains > 40 && bows > 20, `${rains} showers, ${bows} rainbows`);
});

test('snow falls only in the winter months, and lies a while after', () => {
  let snows = 0;
  for (let d = 5000; d < 5300; d++) {
    for (const s of forecast(d, 0)) {
      assert.notEqual(s.kind, 'rain', 'no rain in January');
      if (s.kind !== 'snow') continue;
      snows += 1;
      const lying = weatherAt(at(d, s.to + 1), 0).snow;
      assert.ok(lying > 0.3, `still lying an hour on: ${lying}`);
    }
    for (const s of forecast(d, 6)) assert.notEqual(s.kind, 'snow', 'no snow in July');
  }
  assert.ok(snows > 30, `${snows} snowy spells`);
});
