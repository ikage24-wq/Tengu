// The Mochi Garden's weather (2026-11-15, "weather days"): rain showers with puddles and a rainbow
// after, breezy spells, and in the winter months snow. Like the garden's clock it's the same for
// everyone: each game day (world/daytime.js, DAY_MINUTES real minutes) has its own forecast, worked
// out from which day it is, so a friend visiting sees the same shower at the same time.
//
// A day has no spells, one or two: a shower of rain (snow from December to February), or a breezy
// spell. Each comes on gently over RAMP game hours and eases off again - never a switch flipped. The
// ground stays wet a while after rain (the puddles fill as it rains and dry up slowly after), and
// after a shower in daylight a rainbow comes out for a while; snow lies on the ground, deepening as
// it falls, and melts away after it stops.
//
// weatherAt(ms) -> { kind: 'rain' | 'snow' | 'wind' | null, k (0-1, how hard), rainbow (0-1),
//   wet (0-1, how full the puddles are), snow (0-1, how deep it lies) }
// The garden keeps it in world.gardenWeather (and SKY.now, for the painter); `world.forceWeather`
// (a test, a scene) sets it outright.

import { DAY_MINUTES } from './daytime.js';
import { seededRandom } from '../data/mochi-genes.js';

const DAY_MS = DAY_MINUTES * 60000;
// (Game hours to come on and to ease off.)
export const RAMP = 0.6;
// (How long the puddles take to fill once it rains, and to dry once it stops; how long snow takes
// to lie deep, and to melt; game hours.)
const FILL = 1;
const DRY = 2.5;
const SETTLE = 1.5;
const MELT = 3;
// (The rainbow: from just before a shower ends to a little over an hour after, in daylight.)
const BOW = [-0.3, 0.2, 0.9, 1.3];
const LIGHT = [7, 18.5];
const smooth = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
const winterOf = (month) => month === 11 || month <= 1;

// What day `day` holds: its spells, in game hours from its midnight. (Kept to the hours the
// garden's up: 6 to 23.)
export function forecast(day, month) {
  const rng = seededRandom(day * 7919 + 13);
  const n = rng() < 0.38 ? 0 : rng() < 0.7 ? 1 : 2;
  const out = [];
  let from = 6 + rng() * 2;
  for (let i = 0; i < n; i++) {
    const r = rng();
    const wet = winterOf(month) ? 'snow' : 'rain';
    const kind = r < 0.68 ? wet : 'wind';
    const len = 2 + rng() * 3;
    const at = from + rng() * 5;
    if (at + len > 23) break;
    out.push({ kind, from: at, to: at + len });
    from = at + len + 1.5;
  }
  return out;
}

// How hard a spell from `a` to `b` is at hour `h`: easing on and off.
const strength = (h, a, b) => (h <= a || h >= b ? 0 : smooth(Math.min((h - a) / RAMP, (b - h) / RAMP, 1)));

export function weatherAt(ms, month = new Date(ms).getMonth()) {
  const day = Math.floor(ms / DAY_MS);
  const h = ((ms - day * DAY_MS) / DAY_MS) * 24;
  const out = { kind: null, k: 0, rainbow: 0, wet: 0, snow: 0 };
  // (Yesterday's too: a late shower's puddles and a night's snow carry on past midnight.)
  for (const [d, off] of [[day - 1, -24], [day, 0]]) {
    for (const s of forecast(d, month)) {
      const a = s.from + off;
      const b = s.to + off;
      const k = strength(h, a, b);
      if (k > out.k) {
        out.kind = s.kind;
        out.k = k;
      }
      if (s.kind === 'rain') {
        const full = smooth(Math.min(1, (Math.min(h, b) - a) / FILL));
        if (h > a) out.wet = Math.max(out.wet, h <= b ? full : full * smooth(1 - (h - b) / DRY));
        const hour = ((b % 24) + 24) % 24;
        if (hour >= LIGHT[0] && hour <= LIGHT[1]) {
          const u = h - b;
          const bow = u < BOW[0] || u > BOW[3] ? 0 : u < BOW[1] ? smooth((u - BOW[0]) / (BOW[1] - BOW[0])) : u < BOW[2] ? 1 : smooth(1 - (u - BOW[2]) / (BOW[3] - BOW[2]));
          out.rainbow = Math.max(out.rainbow, bow);
        }
      }
      if (s.kind === 'snow' && h > a) {
        const deep = smooth(Math.min(1, (Math.min(h, b) - a) / SETTLE));
        out.snow = Math.max(out.snow, h <= b ? deep : deep * smooth(1 - (h - b) / MELT));
      }
    }
  }
  return out;
}

// What the painter reads (render/garden-weather.js): the garden's weather as it is this frame.
export const SKY = { now: null };

// The garden's weather now, kept on the world (world/garden-life.js tickGarden calls it).
export function gardenWeatherTick(world) {
  const date = (world.dayClock ?? (() => new Date()))();
  const W = world.forceWeather ? { kind: null, k: 0, rainbow: 0, wet: 0, snow: 0, ...world.forceWeather } : weatherAt(date.getTime(), date.getMonth());
  world.gardenWeather = W;
  SKY.now = W;
  // (A grey sky dims the garden a little, like the start of dusk - in steps, as the light does, so the
  // backdrop isn't repainted every frame - and the lanterns glow faintly through a downpour.)
  const grey = W.kind === 'rain' || W.kind === 'snow' ? W.k : 0;
  if (world.map?.garden && !world.map.indoor) world.map.dusk = Math.round(grey * 0.22 * 16) / 16;
  return W;
}
