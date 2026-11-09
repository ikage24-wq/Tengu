// Mochi names (docs/design/mochi.md step 7): you name your Mochi when it hatches (ui/mochi-name.js),
// and can rename it any time from its care panel. A cute name is suggested from these sweet-themed
// ones (never one a race rival goes by, nor one your other Mochi already have), and you can roll
// another or type your own.

import { RIVAL_NAMES } from './mochi-race.js';
import { STAGES } from './mochi-genes.js';

export const NAME_MAX = 12;
// Letters, numbers, spaces, apostrophes and hyphens.
export const NAME_CHAR = /^[A-Za-z0-9 '-]$/;

const JAPANESE = ['Anko', 'Kinako', 'Mitsu', 'Warabi', 'Daifuku', 'Monaka', 'Yokan', 'Ohagi', 'Kuzu', 'Matcha', 'Hoji', 'Genmai', 'Shiratama',
  'Dango', 'Ichigo', 'Mikan', 'Sakura', 'Sumomo', 'Biwa', 'Kaki', 'Nashi', 'Ringo', 'Imo', 'Goma', 'Wasanbon', 'Amazake', 'Kasutera',
  'Senbei', 'Arare', 'Konpeito', 'Higashi', 'Manju', 'Taiyaki', 'Dorayaki', 'Kakigori', 'Mizuame', 'Kurumi', 'Shiso', 'Yomogi', 'Sudachi'];
const WESTERN = ['Sugar', 'Honey', 'Maple', 'Toffee', 'Praline', 'Sprinkle', 'Pudding', 'Custard', 'Waffle', 'Muffin', 'Bonbon', 'Truffle',
  'Nougat', 'Caramel', 'Meringue', 'Mallow', 'Fudge', 'Crumble', 'Cocoa', 'Taffy', 'Jelly', 'Gumdrop', 'Scone', 'Cupcake', 'Cookie',
  'Brownie', 'Cinnamon', 'Nutmeg', 'Peaches', 'Plum', 'Cherry', 'Berry', 'Lemon', 'Vanilla', 'Butter', 'Cream', 'Tart', 'Bun',
  'Sesame', 'Churro', 'Pretzel', 'Macaron', 'Eclair', 'Sorbet', 'Parfait', 'Cobbler', 'Shortcake', 'Biscotti', 'Pistachio', 'Hazel'];
export const MOCHI_NAMES = [...JAPANESE, ...WESTERN].filter((n) => !RIVAL_NAMES.includes(n));

// A name to suggest: one none of `taken` have.
export function suggestName(taken = [], rng = Math.random) {
  const free = MOCHI_NAMES.filter((n) => !taken.includes(n));
  const pool = free.length ? free : MOCHI_NAMES;
  return pool[Math.floor(rng() * pool.length)];
}
// What to call it in words: its name, or (not named yet) "your Mochiko" and the like.
export const calledOf = (rec, own = 'your') => rec.name ?? `${own} ${STAGES[rec.stage] ?? 'Mochi'}`;
// A typed name tidied up (spaces trimmed, at most NAME_MAX letters), or null if nothing's left.
export function cleanName(s) {
  const out = [...String(s ?? '')].filter((ch) => NAME_CHAR.test(ch)).join('').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
  return out || null;
}
