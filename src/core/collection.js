// The Monster Book and achievements (data/achievements.js). Every monster you defeat (or help your
// party or friends defeat) goes in your book: its card fills on the first one, and it's mastered
// at 100 (5 for a boss). Cards are for collecting (no hidden stat bonuses). Achievements are
// checked now and then; each one reached unlocks a title.

import { MOBS } from '../data/mobs.js';
import { ACHIEVEMENTS } from '../data/achievements.js';

export const masteryAt = (mobId) => (MOBS[mobId]?.boss ? 5 : 100);

// Counts a defeated monster. Returns 'card' for a new card, 'master' when it's just mastered.
export function recordBook(char, mobId) {
  char.book ??= {};
  const n = (char.book[mobId] ?? 0) + 1;
  char.book[mobId] = n;
  return n === 1 ? 'card' : n === masteryAt(mobId) ? 'master' : null;
}

// Achievements reached since the last check (and marks them earned).
export function newAchievements(char) {
  char.achievements ??= {};
  const out = [];
  for (const a of ACHIEVEMENTS) {
    if (char.achievements[a.id] || !a.check(char)) continue;
    char.achievements[a.id] = true;
    out.push(a);
  }
  return out;
}

export const titleOf = (char) => ACHIEVEMENTS.find((a) => a.id === char.title && char.achievements?.[a.id])?.title ?? null;
