// Co-op content (docs/design/coop.md, part 2): party quests from each town's Party Board, the
// two-person boss mechanics, and what Hard mode in a dungeon pays out. The runtime is in
// world/partyquest.js (the board) and world/coopboss.js (the bosses).

import { ITEMS } from './items.js';
import './cash.js';

// ---------- Party Tokens ----------
// Earned by every member when a party quest is done, and from dungeon chests (more on Hard).
// Spent at the Party Board on things worth having.
ITEMS.party_token = {
  id: 'party_token', name: 'Party Token', type: 'etc', price: 0, color: '#ffb0d8',
  desc: 'Earned together: party quests and dungeon chests. Trade them at any Party Board.',
};

// Hard mode's own cosmetic: only from the chest at the end of a Hard run (the first Hard clear
// always brings it). A crown of Gnarlroot's own leaves, worn in the hat slot.
ITEMS.cash_rootwood_crown = {
  id: 'cash_rootwood_crown', type: 'cash', price: 0, name: "Gnarlroot's Leaf Crown", slot: 'hat', style: 'fancy', cash: 0,
  retired: true, color: '#7fd1a0', skin: 'look_acc_flowercrown_hat', hardOnly: true,
};

// ---------- The Party Board ----------
// Each town's board offers three party quests at a time (a hunt, a gather and a defend), for
// the region around it and your level, and changes them every ROTATE_HOURS hours (the same board
// for everyone at the same time, so friends see the same quests).
export const ROTATE_HOURS = 2;
export const TOWN_REGIONS = {
  sprout: ['meadow1', 'meadow2', 'canyon'],
  harbor: ['meadow2', 'woods', 'ruins', 'glade'],
  crag: ['canyon', 'ridge', 'cave'],
  grove: ['shrine', 'springs', 'peak', 'starfall', 'sky'],
};
// How much each kind asks for (shared across the whole party) and pays (every member).
export const PQ_KINDS = {
  hunt: { label: 'Hunt together', need: 30, tokens: 3, verb: 'Defeat' },
  gather: { label: 'Gather together', need: 12, tokens: 3, verb: 'Gather' },
  defend: { label: 'Defend', need: 3, tokens: 4, verb: 'Hold off' },
};
// A defend quest: waves of the map's monsters come at a spot; WAVE_SIZE each, a breath between.
export const WAVE_SIZE = 5;
export const WAVE_GAP = 4;

// The reward for every member, by your level.
export const pqReward = (kind, level) => ({
  exp: Math.round((50 * level * level + 300) * (kind === 'defend' ? 1.3 : 1)),
  gold: Math.round((90 * level + 200) * (kind === 'defend' ? 1.3 : 1)),
  tokens: PQ_KINDS[kind].tokens,
});

// What the board trades for tokens.
export const TOKEN_SHOP = [
  { id: 'gacha_ticket', qty: 1, cost: 6, about: 'One turn of the capsule machine' },
  { id: 'elixir', qty: 3, cost: 4, about: 'Three Rainbow Elixirs' },
  { id: 'hollow_acorn', qty: 3, cost: 5, about: 'For Rootwood gear' },
];

// ---------- Two-person boss mechanics ----------
// Each area boss and each dungeon boss has one (and a Hard run adds one more to each dungeon
// boss). All of them can be beaten alone, more slowly; with two or more they're much easier.
//   split  a big blow marked by a gold ring: it's shared by everyone standing in it (alone you
//          take it all; nobody in it and it bursts wide)
//   sides  a guard that only breaks when it's struck from both sides at once
//   seal   a seal stone on the floor: while someone stands on it, the boss's armour is down
//   twins  a tethered pair of adds: one left standing long after the other brings it back
export const COOP_MECHS = {
  // Area bosses (world/nest.js).
  queenbee: [{ kind: 'split', name: 'Royal Honey Bomb', every: 14, first: 8, warn: 3.2, w: 130, hit: 6 }],
  macgoblin: [{ kind: 'sides', name: 'Barn-Door Guard', guard: 0.4, broken: 1.25, window: 1.6, open: 7 }],
  // Rootwood Hollow (world/dungeon.js).
  mothercapper: [{ kind: 'split', name: 'Spore Bloom', every: 16, first: 9, warn: 3.4, w: 130, hit: 4.6 }],
  tuskar: [{ kind: 'sides', name: 'Bark Hide', guard: 0.45, broken: 1.25, window: 1.8, open: 7 }],
  gnarlroot: [{ kind: 'seal', name: 'Root Seal', armour: 0.4, off: 170, move: 16 }],
};
// Hard mode's extra mechanic for each dungeon boss.
export const HARD_MECHS = {
  mothercapper: { kind: 'twins', name: 'Twin Puffballs', mob: 'sporeling', at: 0.6, revive: 4, hp: 3 },
  tuskar: { kind: 'split', name: 'Earthquake Stomp', every: 18, first: 12, warn: 3.4, w: 140, hit: 4.4 },
  gnarlroot: { kind: 'sides', name: 'Bark Ward', guard: 0.5, broken: 1.2, window: 1.8, open: 8 },
};
// Hard mode: you need a party of two or more (you and at least one member), and the chest pays
// more Party Tokens.
export const HARD_PARTY = 2;
export const CHEST_TOKENS = { normal: 2, hard: 6 };
