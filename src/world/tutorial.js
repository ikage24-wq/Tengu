// The tutorial on Dawnlight Isle: a list of small lessons, one at a time, each with a hint shown
// on screen (ui/hud.js) and a check that says when it's done. A new character who chose the
// island starts with `char.tutorial = { step: 0 }`; the lessons follow what the player actually
// does, so any order of doing them works out (a lesson already done is skipped). Reaching Sprout
// Village by the boat ends it; a character who skipped the island never has it.

import { countItem } from '../core/inventory.js';
import { questState } from '../core/quests.js';

// Each lesson: the hint (keys in [brackets] are drawn as keycaps), where it happens, and when it's
// done. `t` is the lesson's own scratch state (set up by `start` when the lesson begins).
export const LESSONS = [
  { hint: 'Walk with [←] and [→].', start: (w, t) => { t.x = w.body.x; }, done: (w, t) => Math.abs(w.body.x - t.x) > 90 },
  { hint: 'Jump with [Space]. Hop up onto the ledge!', done: (w, t) => (t.jumped ||= !w.body.onGround && w.body.vy < 0) && w.body.onGround && w.body.y < w.map.groundY - 20 },
  { hint: 'Stand by the rope and hold [↑] to climb it.', done: (w) => Boolean(w.body.rope) },
  { hint: 'Walk up to Kuro and press [↑] to talk. Accept his quest.', done: (w) => Boolean(w.char.quests.tut_hello) },
  { hint: 'Open your bag with [I] and double-click the sword to hold it.', done: (w) => Boolean(w.char.equipment.weapon) },
  { hint: 'You have stat points! Open Stats with [C] and press Auto (or the + buttons).', done: (w) => w.char.ap === 0 },
  { hint: 'Head east to the Practice Field: stand in the glowing portal and press [↑].', done: (w) => w.map.id !== 'dawnbeach' },
  { hint: 'Talk to Kuro with [↑] and take his practice quest.', done: (w) => Boolean(w.char.quests.tut_practice) },
  { hint: 'Attack the Kitsune Kits with [Z]. Defeat 3 of them.', done: (w) => (w.char.quests.tut_practice?.kills?.puffle ?? 0) >= 3 || questState(w.char, 'tut_practice') !== 'active' },
  { hint: 'Walk over what they dropped and press [X] to pick it up. Get 3 Fox Fluff.', done: (w) => countItem(w.char.inventory, 'fluff') >= 3 || questState(w.char, 'tut_practice') === 'done' },
  // (Potions picked up meanwhile raise the count it watches, so only drinking one counts.)
  { hint: 'Hurt? Press [1] to drink a red potion (it sits on that hotkey).', start: (w, t) => { t.n = countItem(w.char.inventory, 'red_potion'); }, done: (w, t) => {
    const n = countItem(w.char.inventory, 'red_potion');
    if (n > t.n) t.n = n;
    return n < t.n;
  } },
  { hint: 'Hand the quest in to Kuro: walk up and press [↑].', done: (w) => questState(w.char, 'tut_practice') === 'done' },
  { hint: 'You learned a skill point! Open Skills with [K] and learn Quick Step.', done: (w) => (w.char.skills.quickstep ?? 0) > 0 },
  { hint: 'Drag Quick Step from the Skills window onto an empty hotkey, then press that key.', done: (w) => Object.values(w.char.hotkeys).some((h) => h?.skill === 'quickstep') },
  { hint: 'Go east to Sunny Dock and talk to Kuro one last time.', done: (w) => Boolean(w.char.quests.tut_farewell) },
  { hint: 'Board the boat at the end of the dock with [↑]. Off to Sprout Village!', done: (w) => w.map.id === 'sprout' },
];

// The lesson showing now (or null when there's no tutorial or it's over).
export function currentLesson(char) {
  const t = char.tutorial;
  if (!t || t.step >= LESSONS.length) return null;
  return { ...LESSONS[t.step], step: t.step, of: LESSONS.length };
}

// Call every tick: finishes the lesson showing when its check passes, then any after it that are
// done already, and starts the next.
export function tickTutorial(world) {
  const t = world.char.tutorial;
  if (!t || t.step >= LESSONS.length) return;
  // Off the island some other way (a skip, an old save): the tutorial is over.
  if (!['dawnbeach', 'trainfield', 'dock'].includes(world.map.id) && world.map.id !== 'sprout') {
    t.step = LESSONS.length;
    return;
  }
  t.scratch ??= {};
  if (!t.begun) {
    LESSONS[t.step].start?.(world, t.scratch);
    t.begun = true;
  }
  let moved = false;
  while (t.step < LESSONS.length && LESSONS[t.step].done(world, t.scratch)) {
    t.step += 1;
    t.scratch = {};
    t.begun = false;
    moved = true;
    if (t.step < LESSONS.length) {
      LESSONS[t.step].start?.(world, t.scratch);
      t.begun = true;
    }
  }
  if (moved) {
    t.at = world.now;
    if (t.step >= LESSONS.length) world.log('Tutorial complete! Welcome to Sprout Village.', '#ffe36b');
  }
}
