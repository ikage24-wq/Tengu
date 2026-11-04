// Sweethearts (data/sweethearts.js; docs/design/sweethearts.md): hearts with each of the six,
// kept on the character as `char.hearts[id]`:
//   { pts (0-1000), talked (the day you last chatted), gifted (the day of your last gift),
//     seen { 2: true, ... } (heart scenes played), romance (sweethearts), dates (how many) }
// and `char.partner` (the one you're dating, or living with once `char.livingWith` is set too).
// One sweetheart at a time; breaking up is gentle: hearts drop a little, and you can make up later.

import { SWEETHEARTS, HEART, MAX_HEARTS, BOUQUET_AT, GIFT_PTS, TALK_PTS, BOUQUET, RING, AT_HOME } from '../data/sweethearts.js';
import { ITEMS } from '../data/items.js';
import { removeItem, addItem } from '../core/inventory.js';
import { today } from '../core/quests.js';
import { SCENES } from '../data/story.js';
import { recruitBot } from './bots.js';
import { joinParty, partyMembers } from './party.js';

// Their heart scenes join the game's cutscenes as sw_<id>_<key> (world/story.js playScene).
export const sceneId = (id, key) => `sw_${id}_${key}`;
for (const s of Object.values(SWEETHEARTS)) for (const [key, lines] of Object.entries(s.scenes)) SCENES[sceneId(s.id, key)] = lines;

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
    moveIn(char, id);
    return { kind: 'ring', line: "Yes. Yes! Of course yes. When do I move in? Is now too soon?", gained: 0, scene: null };
  }
  h.gifted = day;
  const kind = giftKind(id, itemId);
  // (You remember how they took it: the gift page shows it next time.)
  (h.known ??= {})[itemId] = kind;
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
  if (char.livingWith === id) {
    char.livingWith = null;
    // (They take their own piece back to town with them.)
    if (char.home) char.home.placed = char.home.placed.filter((p) => p.theirs !== id);
  }
  const h = heartsOf(char, id);
  h.romance = false;
  addPts(char, id, -150);
  return true;
}

// ---------- Living together ----------

// Moving in: they live on your island from now on, and bring a piece of their own into the hut
// (on a shelf or the floor, wherever there's room; it's theirs, so it isn't in your bag).
export function moveIn(char, id) {
  char.livingWith = id;
  char.partner = id;
  const own = AT_HOME[id];
  char.home ??= { stage: 1, back: null, placed: [], bag: {} };
  if (own?.piece && !char.home.placed.some((p) => p.theirs === id)) {
    const spots = { surface: [[150, 262], [490, 262]], wall: [[150, 200], [500, 200]], floor: [[560, 360], [90, 360]] };
    const layer = { bake_cake: 'surface', star_globe: 'surface', sea_net: 'wall', trophy_plaque: 'wall', star_lamp: 'floor', bake_stool: 'floor' }[own.piece];
    const [x, y] = (spots[layer] ?? spots.floor).find(([sx]) => !char.home.placed.some((p) => p.map === 'home_in' && Math.abs(p.x - sx) < 24)) ?? spots.floor[0];
    char.home.placed.push({ uid: 9000 + Object.keys(SWEETHEARTS).indexOf(id), id: own.piece, map: 'home_in', x, y, flip: false, theirs: id });
  }
}

// Whether a townsperson is out of town because they live with you now (they're on your island).
export const movedAway = (char, npcId) => Boolean(SWEETHEARTS[npcId] && char.livingWith === npcId);

// Coming home: a welcome, and once a day a dish they cooked for you. Returns what they said, or null.
export function welcomeHome(world, day = today()) {
  const char = world.char;
  const id = char.livingWith;
  if (!id || !world.map.home || world.map.guestOf) return null;
  const h = heartsOf(char, id);
  const s = SWEETHEARTS[id];
  if (h.fedDay === day) return null;
  h.fedDay = day;
  const own = AT_HOME[id];
  const dish = own.dish[(day.length + h.pts) % own.dish.length];
  const ok = ITEMS[dish] && addItem(char.inventory, dish, 1);
  const line = s.talk[5][(day.length + 1) % s.talk[5].length];
  world.log?.(`${s.name}: ${line}`, '#ffc2dc');
  if (ok) world.log?.(`${s.name} made you ${ITEMS[dish].name}!`, '#ffd6a0');
  return { line, dish: ok ? dish : null };
}

// Adventuring together: your sweetheart joins your party (in their own job and outfit) and fights
// beside you; ask again to send them home. Returns a reason, or null.
export function bringAlong(world) {
  const char = world.char;
  const id = char.partner;
  if (!id || !world.bots) return 'Only your sweetheart can come along.';
  const there = partyMembers(world.bots).find((b) => b.sweetheart === id);
  if (there) {
    there.sweetheart = null;
    there.leaving = true;
    there.session = 0;
    return null;
  }
  if (partyMembers(world.bots).length >= 5) return 'Your party is full.';
  const s = SWEETHEARTS[id];
  const bot = recruitBot(world.bots, world, { level: Math.max(10, char.level), jobs: [AT_HOME[id].job] });
  Object.assign(bot, { name: s.name, sweetheart: id, finder: null, session: 99999, stay: 99999 });
  bot.char.name = s.name;
  bot.char.appearance = { ...s.look };
  bot.char.outfit = { top: { id: `cash_costume_${s.outfit}`, variant: null } };
  joinParty(world.bots, bot, world);
  world.log?.(`${s.name} is coming along! Ask again to send them home.`, '#ff8fc4');
  return null;
}
export const alongside = (world) => Boolean(world.bots && partyMembers(world.bots).some((b) => b.sweetheart && b.sweetheart === world.char.partner));
