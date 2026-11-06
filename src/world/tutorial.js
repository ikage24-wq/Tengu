// The tutorial: a list of small lessons, one at a time, each with a hint shown on screen
// (ui/hud.js; `phone` is the hint for the touch controls) and a check that says when it's done.
// A new character who chose the island starts with `char.tutorial = { step: 0 }`; the lessons
// follow what the player actually does, so any order of doing them works out (a lesson already
// done is skipped), and any lesson can be skipped. The lessons end with the boat to Sprout Village.
//
// Kuro's quests are handed in to Kuro, and Kuro never leaves Dawnlight Isle, so none of them is
// ever left hanging once you sail: head for the boat with his goodbye unsaid and he runs over to
// say it, and one still open off the island (an older save) is settled by a note from him.

import { countItem } from '../core/inventory.js';
import { questState, acceptQuest, completeQuest } from '../core/quests.js';
import { settings } from '../core/settings.js';
import { keyName, physOf } from '../core/keys.js';
import { QUESTS } from '../data/quests.js';
import { ITEMS } from '../data/items.js';
import { SCENES } from '../data/story.js';
import { playScene } from './story.js';
import { celebrateLevels } from './levelup.js';

// Each lesson: the hint (keys in [brackets] are drawn as keycaps), where it happens, and when it's
// done. `t` is the lesson's own scratch state (set up by `start` when the lesson begins). `now`
// swaps in a hint for where the player is partway through it (a quest taken but not yet handed
// in); `when` leaves a lesson out altogether while it doesn't apply (it isn't shown or counted).
export const LESSONS = [
  { hint: 'Walk with [←] and [→].', phone: 'Push the [stick] left and right to walk.', start: (w, t) => { t.x = w.body.x; }, done: (w, t) => Math.abs(w.body.x - t.x) > 90 },
  { hint: 'Jump with [Space]. Hop up onto the ledge!', phone: 'Tap [Jump]. Hop up onto the ledge!', done: (w, t) => (t.jumped ||= !w.body.onGround && w.body.vy < 0) && w.body.onGround && w.body.y < w.map.groundY - 20 },
  { hint: 'Stand by the rope and hold [↑] to climb it.', phone: 'Stand by the rope and push the [stick] up to climb it.', done: (w) => Boolean(w.body.rope) },
  // (Done once his gifts are in your bag: the sword the next lesson has you hold comes with them.)
  { hint: 'Walk up to Kuro and press [↑] to talk. Accept his quest.', phone: 'Tap Kuro (or stand by him and push up) to talk. Accept his quest.', done: (w) => questState(w.char, 'tut_hello') === 'done', now: (c) => (questState(c, 'tut_hello') === 'ready' ? { hint: "Press Complete to take Kuro's gifts. (Closed it? Walk up to him and press [↑].)", phone: "Tap Complete to take Kuro's gifts. (Closed it? Tap Kuro again.)" } : null) },
  { hint: 'Open your bag with [I] and double-click your weapon to hold it.', phone: 'Tap the [bag] on the menu bar, then double-tap your weapon to hold it.', done: (w) => Boolean(w.char.equipment.weapon) },
  // (With Auto stats on, the points place themselves the moment they arrive: nothing to teach.)
  { hint: 'You have stat points! Open Stats with [C] and press Auto (or the + buttons).', phone: 'You have stat points! Tap [Stats] on the menu bar and press Auto.', when: () => settings.autoStats === false, done: (w) => w.char.ap === 0 },
  { hint: 'Head east to the Practice Field: stand in the glowing portal and press [↑].', phone: 'Head east to the Practice Field: stand in the glowing portal and push up.', done: (w) => w.map.id !== 'dawnbeach' },
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
  { hint: 'You got a skill point! Open Skills with [K] and learn Quick Step.', phone: 'You got a skill point! Tap [Skills] on the menu bar and learn Quick Step.', done: (w) => (w.char.skills.quickstep ?? 0) > 0 },
  // (Learning it drops it on the first free hotkey: this one has you use it from there.)
  { hint: 'Drag Quick Step from the Skills window onto an empty hotkey, then press that key.', phone: 'Drag Quick Step onto an empty hotkey bubble, then tap it.', now: (c) => {
    const key = keyFor(c, 'quickstep');
    return key ? { hint: `Quick Step landed on your [${key}] hotkey. Press it for a spring in your step!`, phone: 'Quick Step landed on a hotkey bubble by the attack button. Tap it for a spring in your step!' } : null;
  }, done: (w) => Boolean(w.char.buffs?.quickstep) },
  // (Done once it's handed in: Set Sail asks nothing, but it still waits for its Complete.)
  { hint: 'Go east to Sunny Dock and talk to Kuro one last time.', phone: 'Go east to Sunny Dock and tap Kuro one last time.', done: (w) => questState(w.char, 'tut_farewell') === 'done', now: (c) => (questState(c, 'tut_farewell') === 'ready' ? { hint: 'Press Complete to say goodbye to Kuro. (Closed it? Walk up to him and press [↑].)', phone: 'Tap Complete to say goodbye to Kuro. (Closed it? Tap Kuro again.)' } : null) },
  { hint: 'Board the boat at the end of the dock with [↑]. Off to Sprout Village!', phone: 'Board the boat at the end of the dock (push up). Off to Sprout Village!', done: (w) => w.map.id === 'sprout' },
];

// How many lessons there are (a character who skipped the island starts past them).
export const ISLAND_LESSONS = LESSONS.length;
// Dawnlight Isle's maps, where Kuro is (Sprout Village, across the water, is where the boat goes).
const ISLE = ['dawnbeach', 'trainfield', 'dock'];
const shows = (l) => !l.when || l.when();
// The key a skill sits on (its keycap's label, after any rebinding), or null.
const keyFor = (char, skill) => {
  const code = Object.entries(char.hotkeys ?? {}).find(([, h]) => h?.skill === skill)?.[0];
  return code ? keyName(physOf(code)) : null;
};

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

// The lesson showing now (or null when there's no tutorial or it's over). Its number `n` counts
// the lessons the player has been shown, so one passed over (left out, or done before it came up)
// never leaves a gap; `of` is that plus the ones still to come.
export function currentLesson(char) {
  const t = char.tutorial;
  if (!t || t.step >= LESSONS.length) return null;
  const l = LESSONS[t.step];
  const n = t.seen === t.step && t.n ? t.n : LESSONS.slice(0, t.step).filter(shows).length + 1;
  return { ...l, ...l.now?.(char), step: t.step, n, of: n + LESSONS.slice(t.step + 1).filter(shows).length };
}

// Call every tick: finishes the lesson showing when its check passes, then any after it that are
// done already (or left out), and starts the next.
export function tickTutorial(world) {
  sendOff(world);
  const t = world.char.tutorial;
  if (!t || t.step >= LESSONS.length) return;
  // Sailed to Sprout Village: whatever lesson was showing, the island's done (the last lesson's
  // check sees it and says so). Off the island some other way (a skip, an old save): the lessons
  // are over.
  if (world.map.id === 'sprout') t.step = Math.max(t.step, LESSONS.length - 1);
  else if (!ISLE.includes(world.map.id)) {
    t.step = LESSONS.length;
    return;
  }
  t.scratch ??= {};
  if (!t.begun) {
    LESSONS[t.step].start?.(world, t.scratch);
    t.begun = true;
  }
  while (t.step < LESSONS.length && (!shows(LESSONS[t.step]) || LESSONS[t.step].done(world, t.scratch))) advance(world, t);
  // A lesson coming up on screen takes the next number.
  if (t.step < LESSONS.length && t.seen !== t.step) {
    t.n = (t.seen != null && t.n ? t.n : LESSONS.slice(0, t.step).filter(shows).length) + 1;
    t.seen = t.step;
  }
}

// ---------- Kuro's quests, on the way off the island ----------

// How near the boat Kuro catches you, if his goodbye is still unsaid (well before the boat's
// own reach, so he's always in time).
const CALL_BACK = 120;
const KURO = ['tut_hello', 'tut_practice', 'tut_farewell'];

function sendOff(world) {
  const char = world.char;
  if (world.map.id === 'dock') {
    catchAtBoat(world);
    return;
  }
  // (Off the island it's looked at once a map, when you arrive or a game loads.)
  if (ISLE.includes(world.map.id) || world.sentOff === world.map) return;
  world.sentOff = world.map;
  // Off the island with one of his quests still open (sailed while a scene had the stage, or a
  // save from before he started running after people): a paper crane brings his last word.
  const crane = () => {
    world.log('A paper crane flaps over the water from Dawnlight Isle, with a note from Kuro:', '#bff0dc');
    world.log("\"You sailed before I could wave! Here's your pay. Tengu always find their friends.\"", '#ffffff');
  };
  for (const id of KURO) {
    const rec = char.quests[id];
    if (rec?.state === 'done') continue;
    // His goodbye never taken because you sailed before his practice was handed in: it's settled
    // here too, pay and all, so it never sits in the quest log waiting for a Kuro who's back on
    // the island. (Only for someone who took his practice: a hero who skipped the island never
    // met him and gets nothing of his.)
    if (!rec) {
      if (id === 'tut_farewell' && char.quests.tut_practice && acceptQuest(char, id) && questState(char, id) === 'ready' && handIn(world, id)) crane();
      continue;
    }
    if (rec.state !== 'active') continue;
    if (questState(char, id) === 'ready') {
      // (No room in the bag for his gifts yet: they wait for the next map.)
      if (handIn(world, id) && id === 'tut_farewell') crane();
      continue;
    }
    // Left unfinished (only his practice asks for anything): it's over, the island's behind you,
    // and Kuro's not one to hold a grudge.
    char.quests[id] = { state: 'done' };
    if (char.tracked) char.tracked = char.tracked.filter((q) => q !== id);
    world.log(`${QUESTS[id].name}: Kuro waves it off from the shore. "Petal Meadow's Kits love a chase too!"`, '#bff0dc');
  }
}

// On the dock, heading for the boat with Kuro's goodbye still unsaid (his quest never taken, or
// taken and its window closed before Complete): he calls you back, runs over and says it, and the
// quest is handed in, so nobody sails with it hanging.
function catchAtBoat(world) {
  const char = world.char;
  if (world.scene || world.dead || questState(char, 'tut_practice') !== 'done') return;
  const st = questState(char, 'tut_farewell');
  if (st !== 'ready' && st !== 'available') return;
  const boat = world.map.portals.find((p) => p.to === 'sprout');
  if (!boat || !world.map.npcs.some((n) => n.id === 'kuro') || Math.abs(world.body.x - boat.x) > CALL_BACK) return;
  if (st === 'available' && !acceptQuest(char, 'tut_farewell')) return;
  if (!handIn(world, 'tut_farewell')) return;
  playScene(world, boatScene(boat));
}

// Kuro's goodbye at the boat: he spots you, hurries over and stands beside you, then the farewell
// itself (data/scenes.js tut_bye). You step back to the open stretch of quay before the lamp posts
// by the gangway (x 990), and Kuro stops a step short of you, clear of the lamps either side.
function boatScene(boat) {
  SCENES.tut_bye_boat ??= [
    { together: [{ emote: 'kuro', kind: '!', dur: 1.2 }, { walk: 'player', to: boat.x - 190, speed: 110 }, { cam: ['player', 'kuro'], up: 20, dur: 0.8 }] },
    { together: [{ face: 'player', to: 'kuro' }, { face: 'kuro', to: 'player' }] },
    { who: 'kuro', text: "Wait wait WAIT! You can't just sail off! There's a goodbye scene. I've been practising it all week.", mood: 'happy' },
    { together: [{ walk: 'kuro', to: 'player', gap: 44, speed: 150 }, { cam: ['player', 'kuro'], up: 20, dur: 1.2 }] },
    { together: [{ face: 'kuro', to: 'player' }, { face: 'player', to: 'kuro' }, { jump: 'kuro' }] },
    ...SCENES.tut_bye,
  ];
  return 'tut_bye_boat';
}

// Hands one of Kuro's quests in where you stand, with the word in the log the window would give.
function handIn(world, id) {
  const r = completeQuest(world.char, id);
  if (!r) return null;
  world.log(`Quest complete: ${QUESTS[id].name}! +${r.exp} EXP, +${r.gold} gold`, '#ffe36b');
  for (const it of r.items) world.log(`Received ${ITEMS[it.id].name}${it.qty > 1 ? ` x${it.qty}` : ''}.`, ITEMS[it.id].color);
  celebrateLevels(world, r.levels);
  return r;
}
