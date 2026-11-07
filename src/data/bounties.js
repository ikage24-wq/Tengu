// The Adventurers' Guild (Coinbridge, Guildmaster Halvard): ranks and their capes, and the names
// the guild gives the elite monsters it posts bounties on (world/bounties.js runs it).
//
// RANKS: in order; `need` is how many bounties you must have brought in. Each rank makes the
// bounties tougher (`hp` times a monster's health, `lv` levels above your own band) and pays more
// (`gold`, before the level scale), and gives its title and its cape when you reach it.

import { ITEMS } from './items.js';

export const RANKS = [
  { key: 'copper', name: 'Copper', need: 0, color: '#d8905a', hp: 8, lv: 0, gold: 1000, title: 'Copper Adventurer' },
  { key: 'silver', name: 'Silver', need: 3, color: '#c8d0e0', hp: 10, lv: 2, gold: 2000, title: 'Silver Adventurer' },
  { key: 'gold', name: 'Gold', need: 10, color: '#ffd36b', hp: 12, lv: 4, gold: 4000, title: 'Gold Adventurer' },
  { key: 'mithril', name: 'Mithril', need: 25, color: '#a8f0ff', hp: 14, lv: 6, gold: 8000, title: 'Mithril Adventurer' },
];

// The guild capes, one per rank, in its colour (worn like any cape, and a little better than a
// shop's of the same level). Yours to keep: not for the market.
export const GUILD_CAPES = {
  copper: { id: 'cape_guild_copper', name: 'Copper Guild Cape', design: 'long', reqLevel: 10, stats: { wdef: 8, mdef: 8, eva: 2 } },
  silver: { id: 'cape_guild_silver', name: 'Silver Guild Cape', design: 'long', reqLevel: 20, stats: { wdef: 12, mdef: 12, eva: 3 } },
  gold: { id: 'cape_guild_gold', name: 'Gold Guild Mantle', design: 'royal', reqLevel: 30, stats: { wdef: 16, mdef: 16, eva: 4, acc: 4 } },
  mithril: { id: 'cape_guild_mithril', name: 'Mithril Guild Mantle', design: 'royal', reqLevel: 40, stats: { wdef: 21, mdef: 21, eva: 5, acc: 6 } },
};
for (const r of RANKS) {
  const c = GUILD_CAPES[r.key];
  ITEMS[c.id] = { id: c.id, name: c.name, type: 'equip', slot: 'cape', design: c.design, tier: 0, reqLevel: c.reqLevel, family: null, stats: c.stats, price: 0, color: r.color, unique: true, legacy: false };
}

// What the guild calls an elite: a name of its own before the monster's.
export const EPITHETS = [
  'Old Grudge', 'Bigfoot', 'Thunderbelly', 'Grumbles', 'Lady Snaggle', 'Sir Chomps', 'Mossback', 'Ironhide', 'Bramble King', 'Madame Fang',
  'Stormpaw', 'Gloomtusk', 'Captain Crunch', 'Wobbles the Great', 'Nightshade', 'Rumbletum', 'Duchess Spike', 'Ol\' Scarface', 'Grand Grizzle', 'Puddingfist',
];
