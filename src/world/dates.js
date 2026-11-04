// Dates with a Sweetheart (data/sweethearts.js; docs/design/sweethearts.md): a shared activity in
// the game, with a small moment to get right. They come along wherever you are, walking (or riding)
// beside you, and the date is over when you've done it together or the time runs out. One date a
// day with each of them. `world.date` while one's on:
//   { id, kind, t, left, progress, goal, score, max, ...the moment's own }
// The kinds:
//   fish    catch three fish together (they fish beside you); a rare catch makes it special
//   ride    ride your mount a good way together (they ride a Puff Bun beside you); jumps together
//   stars   watch for shooting stars: press Space as each one crosses the middle of the sky to wish
//   cook    cook a dish together at a stove; one they love makes their day
//   dance   a lantern dance: press the arrow that comes round, on the beat

import { SWEETHEARTS } from '../data/sweethearts.js';
import { FISH_BY_ID } from '../data/fishing.js';
import { heartsOf, addHearts } from './sweethearts.js';
import { today } from '../core/quests.js';
import { indoors } from './daytime.js';

export const DATES = {
  fish: { name: 'Fishing date', goal: 3, max: 6, time: 240, hint: 'Find a fishing spot and catch 3 fish together' },
  ride: { name: 'Ride together', goal: 1100, max: 5, time: 150, hint: 'Ride your mount a good way together (H to ride)' },
  stars: { name: 'Stargazing', goal: 6, max: 6, time: 40, hint: 'Press Space as each shooting star crosses the middle', moment: true },
  cook: { name: 'Cooking date', goal: 1, max: 5, time: 240, hint: 'Cook a dish together at a town stove' },
  dance: { name: 'Lantern dance', goal: 10, max: 10, time: 30, hint: 'Press the arrow that comes round, on the beat', moment: true },
};
const BEAT = 0.8;
const ARROWS = ['ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight'];

// Why a date can't start now, or null.
export function dateBlocker(world, id, kind) {
  const char = world.char;
  const h = heartsOf(char, id);
  if (world.date) return "You're on a date already!";
  if (h.dated === today()) return `You've been out with ${SWEETHEARTS[id].name} today. Tomorrow!`;
  if (world.dungeon || world.trial || world.map.voyage) return 'Not here.';
  if (kind === 'ride' && !char.mounts?.length) return 'You need a mount for that (Clover in Sprout has Puff Buns).';
  if (kind === 'fish' && !Object.values(char.lifeTools ?? {}).some(Boolean) && !(char.inventory.etc ?? []).some((e) => e.id === 'fishing_rod')) return 'You need a fishing rod for that.';
  if (kind === 'stars' && indoors(world.map)) return 'You need the open sky for that.';
  return null;
}

export function startDate(world, id, kind) {
  const why = dateBlocker(world, id, kind);
  if (why) return why;
  const d = DATES[kind];
  const b = world.body;
  world.date = { id, kind, t: 0, left: d.time, progress: 0, goal: d.goal, score: 0, max: d.max, caughtAt: world.now, cookedAt: world.now, buddy: { x: b.x - 30 * (b.facing || 1), y: b.y, vx: 0, facing: b.facing || 1 }, notes: [], stars: [], next: 1.2 };
  world.log?.(`${d.name} with ${SWEETHEARTS[id].name}! ${d.hint}.`, '#ff8fc4');
  return null;
}

// A random number the moment can lean on (the world's own, or Math.random).
const rnd = (world) => (world.rng ?? Math.random)();

// Each step while on a date: the companion follows, and the activity counts up. `pressed` is this
// frame's fresh keys (for the moments).
export function tickDate(world, dt, pressed = new Set()) {
  const d = world.date;
  if (!d) return;
  d.t += dt;
  d.left -= dt;
  follow(world, d, dt);
  const kind = DATES[d.kind];
  switch (d.kind) {
    case 'fish': {
      const c = world.fishCaught;
      if (c && c.at > d.caughtAt) {
        d.caughtAt = c.at;
        d.progress += 1;
        d.score += (FISH_BY_ID[c.fish.id]?.rarity ?? 1) >= 2 ? 2 : 1;
      }
      break;
    }
    case 'cook': {
      const c = world.lastCooked;
      if (c && c.at > d.cookedAt) {
        d.cookedAt = c.at;
        d.progress = 1;
        const s = SWEETHEARTS[d.id];
        d.score = s.loves.includes(c.id) ? 5 : s.likes.includes(c.id) ? 4 : 3;
      }
      break;
    }
    case 'ride': {
      const b = world.body;
      if (world.riding) d.progress += Math.abs(b.x - (d.lastX ?? b.x));
      d.lastX = b.x;
      if (world.riding && !b.onGround && d.wasGround) d.score = Math.min(2, d.score + 1);
      d.wasGround = b.onGround;
      if (d.progress >= d.goal) d.score = Math.max(d.score, 3) + 0;
      break;
    }
    case 'stars': {
      // A star every couple of seconds, crossing from one side to the other in 1.6 s; the wish
      // lands while it's in the middle third.
      d.next -= dt;
      if (d.next <= 0 && d.stars.length < d.goal) {
        d.stars.push({ t0: d.t, dir: rnd(world) < 0.5 ? 1 : -1, h: 0.15 + rnd(world) * 0.3, got: null });
        d.next = 2.2 + rnd(world) * 1.4;
      }
      for (const s of d.stars) {
        const u = (d.t - s.t0) / 1.6;
        if (s.got == null && u > 1) s.got = false;
      }
      if (pressed.has('Space')) {
        const live = d.stars.find((s) => s.got == null && Math.abs((d.t - s.t0) / 1.6 - 0.5) < 1 / 6);
        if (live) {
          live.got = true;
          d.score += 1;
        } else {
          const miss = d.stars.find((s) => s.got == null && (d.t - s.t0) / 1.6 <= 1);
          if (miss) miss.got = false;
        }
      }
      d.progress = d.stars.filter((s) => s.got != null).length;
      break;
    }
    case 'dance': {
      // Arrows come round on the beat; each is hit if its key is pressed within a quarter beat.
      while (d.notes.length < d.goal && d.t >= 1 + d.notes.length * BEAT) d.notes.push({ at: 1 + d.notes.length * BEAT + BEAT, key: ARROWS[Math.floor(rnd(world) * 4)], got: null });
      for (const n of d.notes) if (n.got == null && d.t > n.at + BEAT * 0.3) n.got = false;
      for (const k of ARROWS) {
        if (!pressed.has(k)) continue;
        const n = d.notes.find((x) => x.got == null && Math.abs(d.t - x.at) <= BEAT * 0.3);
        if (n) {
          n.got = n.key === k;
          if (n.got) d.score += 1;
        }
      }
      d.progress = d.notes.filter((n) => n.got != null).length;
      break;
    }
    default:
  }
  if (d.progress >= d.goal || d.left <= 0) finishDate(world);
  return kind;
}

// The date's over: how it went, their words, and the hearts it brought.
export function finishDate(world) {
  const d = world.date;
  if (!d) return null;
  world.date = null;
  const s = SWEETHEARTS[d.id];
  const done = d.progress >= d.goal;
  const k = Math.min(1, d.score / d.max);
  const rating = !done && k < 0.3 ? 'okay' : k >= 0.75 ? 'great' : k >= 0.4 ? 'good' : 'okay';
  const fav = s.date === d.kind ? 1.25 : 1;
  const gained = Math.round((rating === 'great' ? 120 : rating === 'good' ? 80 : 45) * fav);
  const h = heartsOf(world.char, d.id);
  h.dated = today();
  h.dates = (h.dates ?? 0) + 1;
  addHearts(world.char, d.id, gained);
  const line = s.dateLines[rating];
  world.log?.(`${s.name}: ${line}`, '#ffc2dc');
  world.fx?.push({ kind: 'hearts', x: d.buddy.x, y: d.buddy.y - 40, t: 0, dur: 1.4, n: rating === 'great' ? 6 : 4 });
  world.dateEnded = { id: d.id, rating, gained, line, at: world.now };
  return world.dateEnded;
}

// The companion keeps beside you: a step behind, catching up on a soft spring, turning as you do.
function follow(world, d, dt) {
  const b = world.body;
  const bd = d.buddy;
  const want = b.x - 28 * (b.facing || 1);
  const k = Math.min(1, dt * 5);
  const nx = bd.x + (want - bd.x) * k;
  bd.vx = (nx - bd.x) / Math.max(dt, 1e-4);
  bd.x = nx;
  bd.y += (b.y - bd.y) * Math.min(1, dt * 8);
  if (Math.abs(bd.vx) > 6) bd.facing = Math.sign(bd.vx);
  else if (Math.abs(b.x - bd.x) > 4) bd.facing = Math.sign(b.x - bd.x);
}
