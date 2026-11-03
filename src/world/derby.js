// The Fishing Derby at Lantern Lagoon (Nori's, data/npcs.js): five minutes at the top of every real
// hour. Every fish caught at the lagoon in that time is weighed in by its length; the biggest
// catch wins. The other anglers on the server fish it too (each derby's field is rolled from the
// hour, so everyone sees the same names and catches), Nori among them, and a live board shows the
// standings (ui/derby.js, and the board on Lantern Square). At the end, prizes: the top three, and
// a little something for everyone who caught anything.

import { addItem } from '../core/inventory.js';
import { FISH } from '../data/fishing.js';

export const DERBY = { mins: 5, warn: 1 };
// Prizes: gold and lantern bait for the top three, and for everyone who entered.
export const PRIZES = [
  { gold: 2500, bait: 5, medal: true },
  { gold: 1500, bait: 3 },
  { gold: 800, bait: 2 },
];
export const ENTRY_PRIZE = { gold: 200, bait: 1 };

const clockOf = (world) => (world.dayClock ?? (() => new Date()))();
// The derby an hour's top belongs to: its key, and how far into it we are (seconds).
function slot(date) {
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
  return { key, secs: date.getMinutes() * 60 + date.getSeconds() };
}

// A tiny seeded random, so a derby's field is the same for everyone that hour.
function seeded(key) {
  let h = 2166136261;
  for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const NAMES = ['Kairin', 'Mochi_uwu', 'SirBiscuit', 'lilPetal', 'TheNoodle', 'Rinko', 'BerryBoy', 'kokomi', 'HoneyFox', 'xXTunaXx', 'Lumi', 'Pomchi'];
// The fish the other anglers land, and how big (Nori fishes the point and lands bigger).
const SEA = FISH.filter((f) => f.size && !f.boss);
function rollField(key) {
  const rng = seeded(key);
  const n = 4 + Math.floor(rng() * 4);
  const names = [...NAMES].sort(() => rng() - 0.5).slice(0, n);
  const field = [...names.map((name) => ({ name })), { name: 'Nori', nori: true }];
  for (const e of field) {
    e.catches = [];
    const k = 2 + Math.floor(rng() * 4);
    for (let i = 0; i < k; i++) {
      const fish = SEA[Math.floor(rng() ** (e.nori ? 0.6 : 1.4) * SEA.length)];
      const [lo, hi] = fish.size;
      e.catches.push({ at: 20 + rng() * (DERBY.mins * 60 - 30), fish: fish.name, size: Math.round(lo + (hi - lo) * rng() ** (e.nori ? 0.8 : 1.6)) });
    }
    e.catches.sort((a, b) => a.at - b.at);
  }
  return field;
}

// The standings `secs` into the derby: everyone's best catch so far, biggest first.
export function standings(d, secs) {
  const rows = [];
  for (const e of d.field) {
    const best = e.catches.filter((c) => c.at <= secs).reduce((m, c) => (!m || c.size > m.size ? c : m), null);
    if (best) rows.push({ name: e.name, size: best.size, fish: best.fish, nori: e.nori });
  }
  if (d.mine) rows.push({ name: 'You', size: d.mine.size, fish: d.mine.fish, you: true });
  return rows.sort((a, b) => b.size - a.size);
}

// Whether a derby is on now, and how long is left (s), or how long till the next (s).
export function derbyClock(world) {
  const { secs } = slot(clockOf(world));
  const len = DERBY.mins * 60;
  return secs < len ? { on: true, left: len - secs } : { on: false, next: 3600 - secs };
}

// Each frame: starts and ends the derby on the hour, calls it out at the lagoon, and keeps the
// board on Lantern Square up to date.
export function tickDerby(world) {
  const { key, secs } = slot(clockOf(world));
  const len = DERBY.mins * 60;
  const here = world.map.id === 'lagoon';
  const say = (text) => {
    world.log(`Nori: ${text}`, '#ffd27a');
    if (here) (world.bubbles ??= {}).nori = { text, t: 5 };
  };
  let d = world.derby;
  if (secs < len) {
    if (d?.key !== key) {
      d = world.derby = { key, field: rollField(key), mine: null, done: false };
      if (here) say("It's derby time! Five minutes, biggest catch wins. GO GO GO!");
    }
    d.secs = secs;
  } else if (d && !d.done) {
    d.done = true;
    finish(world, d, say);
  } else if (here && secs >= 3600 - DERBY.warn * 60 && world.derbyWarned !== key) {
    world.derbyWarned = key;
    say('The Fishing Derby starts in a minute! Get your rods ready!');
  }
  // The board on Lantern Square.
  const lagoon = world.map.id === 'lagoon' ? world.map : null;
  if (lagoon) {
    const live = d && !d.done ? standings(d, secs).slice(0, 3) : null;
    lagoon.derbyLines = live?.length ? live.map((r, i) => `${i + 1}. ${r.name} ${r.size}cm`) : d?.done && d.results ? ['Last winner:', d.results[0]?.name ?? '-', `${d.results[0]?.size ?? 0} cm`, 'Next: on the hour!'] : null;
  }
}

// A fish landed: if it's derby time and you're at the lagoon, it's weighed in (your best counts).
export function weighIn(world, fish, size) {
  const d = world.derby;
  if (!d || d.done || world.map.id !== 'lagoon' || !derbyClock(world).on) return;
  const first = !d.mine;
  if (first || size > d.mine.size) {
    d.mine = { size, fish: fish.name };
    const place = standings(d, d.secs ?? 0).findIndex((r) => r.you) + 1;
    world.log(first ? `Entered in the derby: a ${size} cm ${fish.name}! You're in place ${place}.` : `A new derby best: ${size} cm! You're in place ${place}.`, '#ffd27a');
  }
}

function finish(world, d, say) {
  const rows = standings(d, DERBY.mins * 60);
  d.results = rows;
  const place = rows.findIndex((r) => r.you);
  if (world.map.id === 'lagoon') say(`That's time! The winner is ${rows[0]?.name ?? 'nobody'} with ${rows[0]?.size ?? 0} cm!${rows[0]?.nori ? ' Me! Obviously.' : ''}`);
  if (place < 0) return;
  const prize = PRIZES[place] ?? ENTRY_PRIZE;
  const char = world.char;
  char.gold += prize.gold;
  addItem(char.inventory, 'lantern_bait', prize.bait);
  if (prize.medal) {
    addItem(char.inventory, 'derby_medal', 1);
    char.derbyWins = (char.derbyWins ?? 0) + 1;
  }
  world.log(place < 3 ? `Fishing Derby: you came ${['1st', '2nd', '3rd'][place]}! +${prize.gold} gold and ${prize.bait} Lantern Bait${prize.medal ? ', and a Derby Medal' : ''}.` : `Fishing Derby: thanks for fishing! +${prize.gold} gold and a Lantern Bait.`, '#ffe36b');
  world.derbyPrize = { place, at: world.now };
}
