// Achievements: milestones across the game, each earning a title to wear under your name (picked
// in the Collection window). `check(char)` says whether it's been reached; `progress(char)` (when
// there's a count to show) gives [have, need]. Titles are just for show.

import { STORY_QUESTS } from './story.js';
import { SETS } from './sets.js';
import { MOBS } from './mobs.js';

const done = (char, id) => char.quests?.[id]?.state === 'done';
const kills = (char) => Object.values(char.book ?? {}).reduce((n, k) => n + k, 0);
const cards = (char) => Object.keys(char.book ?? {}).filter((id) => MOBS[id]).length;
// The monsters that count toward a full book: everything that roams the fields and dungeons.
export const BOOK_MOBS = Object.keys(MOBS);

const count = (have, need) => [Math.min(have, need), need];

export const ACHIEVEMENTS = [
  { id: 'hello', name: 'Hello, Island', desc: 'Meet your neighbors in Sprout Village.', title: 'Newcomer', check: (c) => done(c, 'story_1_1') },
  { id: 'lv10', name: 'A Path of Your Own', desc: 'Reach level 10.', title: 'Adventurer', check: (c) => c.level >= 10, progress: (c) => count(c.level, 10) },
  { id: 'lv30', name: 'Seasoned', desc: 'Reach level 30.', title: 'Veteran', check: (c) => c.level >= 30, progress: (c) => count(c.level, 30) },
  { id: 'lv50', name: 'Island Hero', desc: 'Reach level 50.', title: 'Hero of Tengu Island', check: (c) => c.level >= 50, progress: (c) => count(c.level, 50) },
  { id: 'k100', name: 'Monster Hunter', desc: 'Defeat 100 monsters.', title: 'Hunter', check: (c) => kills(c) >= 100, progress: (c) => count(kills(c), 100) },
  { id: 'k1000', name: 'Monster Slayer', desc: 'Defeat 1,000 monsters.', title: 'Slayer', check: (c) => kills(c) >= 1000, progress: (c) => count(kills(c), 1000) },
  { id: 'k5000', name: 'Legend of the Wild', desc: 'Defeat 5,000 monsters.', title: 'Legend', check: (c) => kills(c) >= 5000, progress: (c) => count(kills(c), 5000) },
  { id: 'cards10', name: 'Card Collector', desc: 'Fill 10 cards in the Monster Book.', title: 'Collector', check: (c) => cards(c) >= 10, progress: (c) => count(cards(c), 10) },
  { id: 'cards25', name: 'Naturalist', desc: 'Fill 25 cards in the Monster Book.', title: 'Naturalist', check: (c) => cards(c) >= 25, progress: (c) => count(cards(c), 25) },
  { id: 'cardsAll', name: 'Monster Scholar', desc: 'Fill every card in the Monster Book.', title: 'Monster Scholar', check: (c) => cards(c) >= BOOK_MOBS.length, progress: (c) => count(cards(c), BOOK_MOBS.length) },
  { id: 'gnarl', name: 'Lullaby', desc: 'Calm Gnarlroot, the Hollow Heart.', title: 'Root Whisperer', check: (c) => (c.book?.gnarlroot ?? 0) > 0 },
  { id: 'sylvana', name: 'Friend of the Glade', desc: "Pass Sylvana's trial.", title: 'Friend of the Glade', check: (c) => done(c, 'story_3_2') },
  { id: 'tamamo', name: "The Fox's Favorite", desc: "Pass Tamamo's trial.", title: 'Foxfire Friend', check: (c) => done(c, 'story_4_3') },
  { id: 'lilith', name: 'Guest of the Roses', desc: "Pass Lilith's trial.", title: 'Rose Garden Guest', check: (c) => done(c, 'story_5_3') },
  { id: 'selene', name: 'Moonlit Oath', desc: "Pass Selene's trial.", title: 'Moon-Blessed', check: (c) => done(c, 'story_6_3') },
  { id: 'story', name: 'Hayate Stirs', desc: 'Finish the story (chapter 7).', title: 'Wind Waker', check: (c) => done(c, 'story_7_2'), progress: (c) => count(Object.keys(STORY_QUESTS).filter((id) => done(c, id)).length, Object.keys(STORY_QUESTS).length) },
  { id: 'set', name: 'Dressed for the Part', desc: 'Wear all four pieces of a gear set.', title: 'Trendsetter', check: (c) => Object.keys(SETS).some((s) => Object.values(c.equipment ?? {}).filter((e) => e?.id.startsWith(`set_${s}_`)).length >= 4) },
  { id: 'polish', name: 'A Masterpiece', desc: 'Polish a piece of gear to +10.', title: 'Master Polisher', check: (c) => [...Object.values(c.equipment ?? {}), ...(c.inventory?.equip ?? [])].some((e) => (e?.polish ?? 0) >= 10) },
  { id: 'quests20', name: 'Helping Hand', desc: 'Finish 20 quests.', title: 'Good Neighbor', check: (c) => questsDone(c) >= 20, progress: (c) => count(questsDone(c), 20) },
  { id: 'dailies', name: 'Early Riser', desc: 'Finish 7 daily quests.', title: 'Early Riser', check: (c) => (c.dailiesDone ?? 0) >= 7, progress: (c) => count(c.dailiesDone ?? 0, 7) },
  { id: 'friends', name: 'Better Together', desc: 'Play online with a friend.', title: 'Party Pal', check: (c) => Boolean(c.playedOnline) },
  { id: 'mochi', name: 'Mochi Parent', desc: 'Adopt a Mochi.', title: 'Mochi Parent', check: (c) => Boolean(c.pet) },
  { id: 'rich', name: 'Moneybags', desc: 'Have 1,000,000 gold at once.', title: 'Moneybags', check: (c) => c.gold >= 1e6, progress: (c) => count(c.gold, 1e6) },
];

const questsDone = (c) => Object.values(c.quests ?? {}).filter((q) => q.state === 'done').length;
