// The tutorial: a list of small lessons, one at a time, each with a hint shown on screen
// (ui/hud.js; `phone` is the hint for the touch controls) and a check that says when it's done.
// A new character who chose the island starts with `char.tutorial = { step: 0 }`; the lessons
// follow what the player actually does, so any order of doing them works out (a lesson already
// done is skipped), and any lesson can be skipped. The lessons end with the boat to Sprout Village.

import { countItem } from '../core/inventory.js';
import { questState } from '../core/quests.js';

// Each lesson: the hint (keys in [brackets] are drawn as keycaps), where it happens, and when it's
// done. `t` is the lesson's own scratch state (set up by `start` when the lesson begins).
export const LESSONS = [
  { hint: 'Walk with [←] and [→].', phone: 'Push the [stick] left and right to walk.', start: (w, t) => { t.x = w.body.x; }, done: (w, t) => Math.abs(w.body.x - t.x) > 90 },
  { hint: 'Jump with [Space]. Hop up onto the ledge!', phone: 'Tap [Jump]. Hop up onto the ledge!', done: (w, t) => (t.jumped ||= !w.body.onGround && w.body.vy < 0) && w.body.onGround && w.body.y < w.map.groundY - 20 },
  { hint: 'Stand by the rope and hold [↑] to climb it.', phone: 'Stand by the rope and push the [stick] up to climb it.', done: (w) => Boolean(w.body.rope) },
  { hint: 'Walk up to Kuro and press [↑] to talk. Accept his quest.', phone: 'Tap Kuro (or stand by him and push up) to talk. Accept his quest.', done: (w) => Boolean(w.char.quests.tut_hello) },
  { hint: 'Open your bag with [I] and double-click your weapon to hold it.', phone: 'Tap the [bag] on the menu bar, then double-tap your weapon to hold it.', done: (w) => Boolean(w.char.equipment.weapon) },
  { hint: 'You have stat points! Open Stats with [C] and press Auto (or the + buttons).', phone: 'You have stat points! Tap [Stats] on the menu bar and press Auto.', done: (w) => w.char.ap === 0 },
  { hint: 'Talk to Kuro again with [↑]: he has a job for you.', phone: 'Tap Kuro again: he has a job for you.', done: (w) => Boolean(w.char.quests.tut_lookout) },
  { hint: 'Climb the rope up onto the high ledge over the beach and look out to sea.', phone: 'Climb the rope up onto the high ledge over the beach and look out to sea.', done: (w) => Boolean(w.char.quests.tut_lookout?.marks?.[0]) || questState(w.char, 'tut_lookout') === 'done' },
  { hint: 'Head east to the Practice Field: stand in the glowing portal and press [↑].', phone: 'Head east to the Practice Field: stand in the glowing portal and push up.', done: (w) => w.map.id !== 'dawnbeach' },
  { hint: 'Tell Kuro what you saw from the lookout: talk to him with [↑].', phone: 'Tell Kuro what you saw from the lookout: tap him.', done: (w) => questState(w.char, 'tut_lookout') === 'done' },
  { hint: 'Talk to Kuro with [↑] and take his practice quest.', phone: 'Tap Kuro and take his practice quest.', done: (w) => Boolean(w.char.quests.tut_practice) },
  { hint: 'Attack the Kitsune Kits with [Z]. Defeat 3 of them.', phone: 'Attack the Kitsune Kits with the big [★] button. Defeat 3 of them.', done: (w) => (w.char.quests.tut_practice?.kills?.puffle ?? 0) >= 3 || questState(w.char, 'tut_practice') !== 'active' },
  { hint: 'Walk over what they dropped and press [X] to pick it up. Get 3 Fox Fluff.', phone: 'Walk over what they dropped and tap [Loot]. Get 3 Fox Fluff.', done: (w) => countItem(w.char.inventory, 'fluff') >= 3 || questState(w.char, 'tut_practice') === 'done' },
  // (Potions picked up meanwhile raise the count it watches, so only drinking one counts.)
  { hint: 'Hurt? Press [1] to drink a red potion (it sits on that hotkey).', phone: 'Hurt? Tap the red potion on your hotkey bar to drink it.', start: (w, t) => { t.n = countItem(w.char.inventory, 'red_potion'); }, done: (w, t) => {
    const n = countItem(w.char.inventory, 'red_potion');
    if (n > t.n) t.n = n;
    return n < t.n;
  } },
  { hint: 'Hand the quest in to Kuro: walk up and press [↑].', phone: 'Hand the quest in: tap Kuro.', done: (w) => questState(w.char, 'tut_practice') === 'done' },
  { hint: 'You learned a skill point! Open Skills with [K] and learn Quick Step.', phone: 'You got a skill point! Tap [Skills] on the menu bar and learn Quick Step.', done: (w) => (w.char.skills.quickstep ?? 0) > 0 },
  { hint: 'Drag Quick Step from the Skills window onto an empty hotkey, then press that key.', phone: 'Drag Quick Step onto an empty hotkey bubble. It shows up by the attack button!', done: (w) => Object.values(w.char.hotkeys).some((h) => h?.skill === 'quickstep') },
  { hint: 'Go east to Sunny Dock and talk to Kuro one last time.', phone: 'Go east to Sunny Dock and tap Kuro one last time.', done: (w) => Boolean(w.char.quests.tut_farewell) },
  { hint: 'Board the boat at the end of the dock with [↑]. Off to Sprout Village!', phone: 'Board the boat at the end of the dock (push up). Off to Sprout Village!', done: (w) => w.map.id === 'sprout' },
];

// How many lessons there are (a character who skipped the island starts past them).
export const ISLAND_LESSONS = LESSONS.length;
const ISLAND = ['dawnbeach', 'trainfield', 'dock', 'sprout'];

// Skips the lesson showing now (the Skip on its card).
export function skipLesson(world) {
  const t = world.char.tutorial;
  if (!t || t.step >= LESSONS.length) return;
  advance(world, t);
  tickTutorial(world);
}

function advance(world, t) {
  t.step += 1;
  t.scratch = {};
  t.begun = false;
  t.at = world.now;
  if (t.step < LESSONS.length) {
    LESSONS[t.step].start?.(world, t.scratch);
    t.begun = true;
  }
  if (t.step === LESSONS.length) world.log('Tutorial complete! Welcome to Sprout Village.', '#ffe36b');
}

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
  // Off the island some other way (a skip, an old save): the lessons are over.
  if (!ISLAND.includes(world.map.id)) {
    t.step = LESSONS.length;
    return;
  }
  t.scratch ??= {};
  if (!t.begun) {
    LESSONS[t.step].start?.(world, t.scratch);
    t.begun = true;
  }
  while (t.step < LESSONS.length && LESSONS[t.step].done(world, t.scratch)) advance(world, t);
}
