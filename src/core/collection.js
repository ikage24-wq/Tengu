// The Monster Book. Every monster you defeat (or help your party or friends defeat) goes in your
// book: its card fills on the first one, and it's mastered at 100 (5 for a boss). Cards are for
// collecting (no hidden stat bonuses).

import { MOBS } from '../data/mobs.js';

export const masteryAt = (mobId) => (MOBS[mobId]?.boss ? 5 : 100);

// Counts a defeated monster. Returns 'card' for a new card, 'master' when it's just mastered.
export function recordBook(char, mobId) {
  char.book ??= {};
  const n = (char.book[mobId] ?? 0) + 1;
  char.book[mobId] = n;
  return n === 1 ? 'card' : n === masteryAt(mobId) ? 'master' : null;
}
