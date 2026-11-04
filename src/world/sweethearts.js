// Sweethearts (data/sweethearts.js; docs/design/sweethearts.md): hearts with each of the six,
// kept on the character as `char.hearts[id]`:
//   { pts (0-1000), talked (the day you last chatted), gifted (the day of your last gift),
//     seen { 2: true, ... } (heart scenes played), romance (sweethearts), dates (how many) }
// and `char.partner` (the one you're dating, or living with once `char.livingWith` is set too).
// One sweetheart at a time; breaking up is gentle: hearts drop a little, and you can make up later.

import { SWEETHEARTS, HEART, MAX_HEARTS, BOUQUET_AT, GIFT_PTS, TALK_PTS, BOUQUET, RING } from '../data/sweethearts.js';
import { ITEMS } from '../data/items.js';
import { removeItem } from '../core/inventory.js';
import { today } from '../core/quests.js';

export const heartsOf = (char, id) => ((char.hearts ??= {})[id] ??= { pts: 0, talked: null, gifted: null, seen: {}, romance: false, dates: 0 });
export const heartLevel = (char, id) => Math.min(MAX_HEARTS, Math.floor((char.hearts?.[id]?.pts ?? 0) / HEART));
export const isPartner = (char, id) => char.partner === id;
export const livesWith = (char, id) => char.livingWith === id;

function addPts(char, id, n) {
  const h = heartsOf(char, id);
  h.pts = Math.max(0, Math.min(MAX_HEARTS * HEART, h.pts + n));
  return h.pts;
}
// (For dates and tests.)
export const addHearts = addPts;

// Which of their talk lines fit now: by hearts, then as sweethearts, then living together.
function tierOf(char, id) {
  if (livesWith(char, id)) return 5;
  if (isPartner(char, id)) return 4;
  const lv = heartLevel(char, id);
  return lv >= 9 ? 3 : lv >= 6 ? 2 : lv >= 3 ? 1 : 0;
}
const pick = (list, seed) => list[Math.abs(Math.floor(seed)) % list.length];

// A heart scene that's due (reached its hearts, not yet seen), or null: its key in their scenes.
export function dueScene(char, id) {
  const s = SWEETHEARTS[id];
  const h = heartsOf(char, id);
  const lv = heartLevel(char, id);
  for (const at of [2, 4, 6, 8, 10]) {
    if (lv < at || h.seen[at]) continue;
    const key = at >= 8 && isPartner(char, id) && s.scenes[`${at}r`] ? `${at}r` : String(at);
    return { at, key, lines: s.scenes[key] };
  }
  return null;
}
export function markSeen(char, id, at) {
  heartsOf(char, id).seen[at] = true;
}

// A chat: once a day it brings you closer. Returns { line, gained, scene }.
export function talkTo(world, id, day = today()) {
  const char = world.char;
  const s = SWEETHEARTS[id];
  const h = heartsOf(char, id);
  let gained = 0;
  if (h.talked !== day) {
    h.talked = day;
    gained = TALK_PTS;
    addPts(char, id, gained);
  }
  const lines = s.talk[tierOf(char, id)];
  const line = pick(lines, (h.pts + day.length * 7 + (world.now ?? 0)) / 3).replace(/\{name\}/g, char.name);
  return { line, gained, scene: dueScene(char, id) };
}

// How they feel about a gift: 'love', 'like', 'dislike' or 'neutral'.
export function giftKind(id, itemId) {
  const s = SWEETHEARTS[id];
  return s.loves.includes(itemId) ? 'love' : s.likes.includes(itemId) ? 'like' : s.dislikes.includes(itemId) ? 'dislike' : 'neutral';
}

// Why you can't give them something now, or null.
export function giftBlocker(char, id, itemId, day = today()) {
  const def = ITEMS[itemId];
  if (!def) return 'Pick something from your bag.';
  if (def.type === 'equip' || def.type === 'cash' || def.keep) return "That's not something to give away.";
  if (itemId === BOUQUET) {
    if (char.partner && char.partner !== id) return `You're already with ${SWEETHEARTS[char.partner].name}.`;
    if (isPartner(char, id)) return "You're already sweethearts!";
    if (heartLevel(char, id) < BOUQUET_AT) return `Get closer first (${BOUQUET_AT} hearts).`;
    return null;
  }
  if (itemId === RING) {
    if (!isPartner(char, id)) return 'Only for your sweetheart.';
    if (livesWith(char, id)) return 'You already live together!';
    if (heartLevel(char, id) < MAX_HEARTS) return `Grow even closer first (${MAX_HEARTS} hearts).`;
    if (!char.home) return 'You need a home to share first: ask Captain Rook about an island.';
    return null;
  }
  if (heartsOf(char, id).gifted === day) return 'One gift a day. Come back tomorrow!';
  return null;
}

// Gives a gift. Returns { kind, line, gained, scene } or { why }.
export function giveGift(world, id, itemId, day = today()) {
  const char = world.char;
  const why = giftBlocker(char, id, itemId, day);
  if (why) return { why };
  if (removeItem(char.inventory, itemId, 1) < 1) return { why: "You don't have one." };
  const s = SWEETHEARTS[id];
  const h = heartsOf(char, id);
  if (itemId === BOUQUET) {
    h.romance = true;
    char.partner = id;
    addPts(char, id, 60);
    return { kind: 'bouquet', line: s.gift.love[0], gained: 60, scene: dueScene(char, id) };
  }
  if (itemId === RING) {
    char.livingWith = id;
    return { kind: 'ring', line: "Yes. Yes! Of course yes. When do I move in? Is now too soon?", gained: 0, scene: null };
  }
  h.gifted = day;
  const kind = giftKind(id, itemId);
  const gained = GIFT_PTS[kind];
  addPts(char, id, gained);
  const line = pick(s.gift[kind], h.pts / 7 + itemId.length);
  return { kind, line, gained, scene: dueScene(char, id) };
}

// A gentle goodbye: no longer sweethearts (and they move back to town). Hearts drop a little; you
// can make up later with another bouquet.
export function breakUp(world, id) {
  const char = world.char;
  if (char.partner !== id) return false;
  char.partner = null;
  if (char.livingWith === id) char.livingWith = null;
  const h = heartsOf(char, id);
  h.romance = false;
  addPts(char, id, -150);
  return true;
}
