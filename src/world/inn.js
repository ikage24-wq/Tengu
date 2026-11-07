// The Gilded Kettle (Coinbridge): Juniper's rooms, and Old Wendell's rumours.
//
// Rested EXP: check in with Juniper (a room costs ROOM_GOLD) and log off in the inn; when you come back,
// you wake well rested. For every hour away you rest REST_PER_HOUR of what your level needs, up to
// REST_CAP; while any is left, monsters give double EXP, the extra drawn from it. Small on purpose:
// a long night's rest is about a third of a level, so the pace to 50 holds (the player's pick).
// char.inn = { checkedIn: true } while you sleep there; char.rested = EXP left in the pool.

import { expToNext } from '../core/exp.js';
import { FISH } from '../data/fishing.js';

export const ROOM_GOLD = 300;
const REST_PER_HOUR = 0.04;
const REST_CAP = 0.3;

// Takes a room for the night. Returns why not, or null.
export function checkIn(world) {
  const char = world.char;
  if (char.inn?.checkedIn) return 'Your room is ready whenever you are. Sleep well!';
  if (char.gold < ROOM_GOLD) return `A room is ${ROOM_GOLD} gold a night, love.`;
  char.gold -= ROOM_GOLD;
  char.inn = { checkedIn: true };
  world.log(`You took a room at the Gilded Kettle. Log off here tonight and you'll wake up well rested (double EXP for a while).`, '#ffe9a6');
  return null;
}

// On loading a saved character (core/save.js gives `savedAt`): a night at the inn turns into rest.
export function wakeAtInn(char, now = Date.now()) {
  if (!char.inn?.checkedIn || !char.savedAt) return 0;
  // (Only if you logged off at the inn: anywhere else, the room went unslept in.)
  if (char.mapId !== 'coin_inn') {
    char.inn = null;
    return 0;
  }
  const hours = Math.max(0, (now - char.savedAt) / 3600000);
  const need = expToNext(char.level);
  const add = Math.round(Math.min(REST_CAP * need - (char.rested ?? 0), hours * REST_PER_HOUR * need));
  char.inn = null;
  if (add <= 0) return 0;
  char.rested = (char.rested ?? 0) + add;
  char.restedNews = true;
  return add;
}

// The extra EXP a kill gets from your rest (and spends it).
export function restedBonus(world, exp) {
  const char = world.char;
  if (!(char.rested > 0)) return 0;
  const bonus = Math.min(char.rested, exp);
  char.rested -= bonus;
  if (char.restedNews) {
    char.restedNews = false;
    world.log?.('You feel well rested! Double EXP from monsters until it wears off.', '#ffe9a6');
  }
  if (char.rested <= 0) {
    char.rested = 0;
    world.log?.('Your rest has worn off. The Gilded Kettle always has a room.', '#d4cbe8');
  }
  return bonus;
}

// Old Wendell's rumours: true hints at hidden things (the legendary fish, and a few secrets).
const RUMORS = [
  ...FISH.filter((f) => f.legend).map((f) => f.legend.rumor),
  'They say the Fishing Derby runs every hour on the hour at Lantern Lagoon. Biggest catch takes home a medal.',
  'A friend of a friend saw a sea turtle swim up to a fisher at sea and follow them home. Fishing at sea, mind.',
  'Fish that only bite at night, or in the rain. Ask anyone at the tackle shops what they want: they pay well.',
  'Some monsters sleep at night. Some only come out after dark. Watch the hours, and you see a different world.',
  "Up at the guild they're getting a bounty board ready. Old Halvard's been polishing his sword for a week.",
];
export function rumor(world) {
  const i = (world.char.rumorAt = ((world.char.rumorAt ?? -1) + 1) % RUMORS.length);
  return RUMORS[i];
}
