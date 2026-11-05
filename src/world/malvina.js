// Malvina's daily curse: once her first quest is done, she lays a "curse" on you once a real day.
// Every curse is a blessing in a terrible name: half an hour of a small, useful boost. Which one
// you get is the day's (the same all day, a different one tomorrow), so it's something to come
// back for rather than reroll.

import { today } from '../core/quests.js';

export const CURSE_SECS = 30 * 60;

export const CURSES = [
  { id: 'ignorance', name: 'Hex of Ignorance', values: { expPct: 0.1 }, about: '+10% EXP', line: "I curse you to forget everything you know! ...You'll have to learn it all again. Faster, probably." },
  { id: 'slowness', name: 'Curse of Crippling Slowness', values: { speed: 12, jump: 6 }, about: 'Faster and bouncier', line: 'I curse your legs to be SLOW! ...Hm. They look rather springy, actually. Never mind.' },
  { id: 'frailty', name: 'Malediction of Frailty', values: { maxHpPct: 0.1, wdef: 10 }, about: '+10% max HP, +10 defence', line: 'I curse you with FRAILTY! May you crumble like a biscuit! A big, sturdy biscuit.' },
  { id: 'clumsiness', name: 'Doom of Clumsiness', values: { critRate: 0.05, acc: 8 }, about: '+5% critical rate, +8 accuracy', line: 'I curse your hands to FUMBLE! May every swing go astray! ...Directly into a weak spot.' },
  { id: 'lethargy', name: 'Blight of Lethargy', values: { regenPct: 0.5, maxMpPct: 0.1 }, about: 'Faster HP and MP regen, +10% max MP', line: 'I curse you to be SLEEPY! So sleepy! May you feel wonderfully rested! ...Wait.' },
  { id: 'weakness', name: 'Hex of Wobbling Weakness', values: { watk: 8, matk: 8 }, about: '+8 attack and magic', line: 'I curse your arms to go all WOBBLY! Like noodles! Strong noodles. Very strong noodles.' },
];

// The day's curse (the same one all day).
export function curseOfDay(date = new Date()) {
  const key = today(date);
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CURSES[h % CURSES.length];
}

// Whether she'll curse you: her first quest done, and not cursed yet today.
export const canCurse = (char, date = new Date()) => char.quests?.malv_minion?.state === 'done' && char.malvinaDay !== today(date);

// Lays the day's curse: a half-hour buff. Returns the curse, or null if not today.
export function layCurse(char, now, date = new Date()) {
  if (!canCurse(char, date)) return null;
  const c = curseOfDay(date);
  char.malvinaDay = today(date);
  char.buffs ??= {};
  char.buffs.malvina = { name: c.name, since: now, until: now + CURSE_SECS, values: { ...c.values }, curse: c.id, icon: 'vial_of_despair', about: c.about };
  return c;
}
