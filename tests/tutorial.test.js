// The tutorial island (world/tutorial.js): a new character can walk, jump, climb, fight and loot
// their way through every lesson and off the island on the boat. The window lessons (talking,
// the bag, stats, skills, hotkeys) are done the way their windows do them.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, updateWorld, loadMap, useItem } from '../src/world/world.js';
import { createCharacter, autoAssignAp, learnSkill, equipFromBag } from '../src/core/character.js';
import { acceptQuest, completeQuest, questState, trackedQuests } from '../src/core/quests.js';
import { addItem, countItem } from '../src/core/inventory.js';
import { settings } from '../src/core/settings.js';
import { LESSONS, currentLesson, ISLAND_LESSONS, skipLesson } from '../src/world/tutorial.js';
import { advanceScene } from '../src/world/story.js';
import { celebrateLevels } from '../src/world/levelup.js';
import { MAPS } from '../src/data/maps.js';
import { placeLessonCard, LESSON_BANNERS } from '../src/ui/hud.js';

const DT = 1 / 60;
const keys = (...k) => ({ held: new Set(k), pressed: new Set(k), locked: false });
const idle = keys();
const run = (w, input, secs) => {
  for (let i = 0; i < secs * 60; i++) updateWorld(w, DT, typeof input === 'function' ? input(i) : input);
};
const step = (w) => w.char.tutorial.step;
// The number on the lesson card each tick, as the player sees it change.
const watchNumbers = (w) => {
  const seen = [];
  const note = () => {
    const l = currentLesson(w.char);
    if (l && seen.at(-1)?.n !== l.n) seen.push({ n: l.n, of: l.of, step: l.step });
  };
  return { seen, note };
};
// A character on the dock with the practice done, at the last lessons.
function atDock(name) {
  const c = createCharacter(name, {});
  Object.assign(c, { mapId: 'dock', portal: 'west', tutorial: { step: 14 } });
  c.quests.tut_hello = { state: 'done' };
  c.quests.tut_practice = { state: 'done' };
  return c;
}
const boatOf = () => MAPS.dock.portals.find((p) => p.to === 'sprout');

test('a new character can play the tutorial island from the beach to Sprout Village', () => {
  const c = createCharacter('Tutee', {});
  Object.assign(c, { mapId: 'dawnbeach', portal: 'start', tutorial: { step: 0 } });
  const w = createWorld(c);
  assert.equal(w.map.id, 'dawnbeach');
  assert.equal(currentLesson(c).step, 0);
  // (Every tick of the play-through notes the number on the lesson card.)
  const nums = watchNumbers(w);
  const real = updateWorld;
  const run = (w2, input, secs) => {
    for (let i = 0; i < secs * 60; i++) {
      real(w2, DT, typeof input === 'function' ? input(i) : input);
      nums.note();
    }
  };
  // Walk, then jump up onto the low ledge.
  run(w, keys('ArrowRight'), 1);
  run(w, idle, 0.2);
  assert.ok(step(w) >= 1, 'walking done');
  const ledge = MAPS.dawnbeach.platforms[0];
  w.body.x = ledge.x - 14;
  run(w, (i) => (i < 20 ? keys('ArrowRight', 'Space') : keys('ArrowRight')), 0.6);
  run(w, idle, 1);
  assert.ok(step(w) >= 2, `onto the ledge (at ${Math.round(w.body.x)}, ${Math.round(w.body.y)})`);
  // Climb the rope.
  w.body.x = MAPS.dawnbeach.ropes[0].x;
  w.body.y = w.map.groundY;
  run(w, keys('ArrowUp'), 0.5);
  assert.ok(step(w) >= 3, 'climbing done');
  w.body.rope = null;
  // Kuro's first quest: a practice sword, then the stats.
  acceptQuest(c, 'tut_hello');
  assert.ok(completeQuest(c, 'tut_hello'));
  run(w, idle, 0.1);
  assert.ok(step(w) >= 4, 'talked to Kuro');
  const bag = c.inventory.equip;
  equipFromBag(c, bag.findIndex((e) => e?.id === 'sword_0'));
  autoAssignAp(c);
  assert.ok(c.base.str > c.base.int, 'Auto grows the stat of the weapon in hand');
  run(w, idle, 0.1);
  assert.ok(step(w) >= 6, 'equipped and spent stats');
  // On to the practice field.
  loadMap(w, 'trainfield', 'west');
  run(w, idle, 0.1);
  assert.equal(step(w), 7);
  acceptQuest(c, 'tut_practice');
  run(w, idle, 0.1);
  assert.equal(step(w), 8, 'took the practice quest');
  // Fight the Kitsune Kits and pick up their fluff.
  for (let n = 0; n < 40 && step(w) < 10; n++) {
    const m = w.mobs.find((o) => o.hp > 0);
    if (m) w.body.x = m.x - 20 * (w.body.facing || 1);
    run(w, keys('KeyZ', 'KeyX'), 0.5);
    for (const d of w.drops) w.body.x = d.x;
    run(w, keys('KeyX'), 0.3);
  }
  // (Fluff drops by chance; top it up if the dice were stingy.)
  if (step(w) < 10) {
    addItem(c.inventory, 'fluff', 3);
    run(w, idle, 0.1);
  }
  assert.ok(step(w) >= 10, `fought and looted (lesson ${step(w)})`);
  const before = { step: step(w), n: countItem(c.inventory, 'red_potion'), ready: w.itemReadyAt, now: w.now, scratch: JSON.stringify(c.tutorial.scratch) };
  const drank = useItem(w, 'red_potion');
  run(w, idle, 0.1);
  assert.ok(step(w) >= 11, `drank a potion (${JSON.stringify({ ...before, drank, after: countItem(c.inventory, 'red_potion'), stepAfter: step(w) })})`);
  completeQuest(c, 'tut_practice');
  run(w, idle, 0.1);
  assert.ok(c.level >= 2 && c.sp > 0, `levelled up with a skill point (Lv ${c.level}, ${c.sp} SP)`);
  learnSkill(c, 'quickstep');
  run(w, idle, 0.1);
  assert.equal(step(w), 13, 'learned a skill');
  // (It went onto the first free hotkey by itself; the card names that key.)
  const key = Object.keys(c.hotkeys).find((k) => c.hotkeys[k]?.skill === 'quickstep');
  assert.ok(key, 'Quick Step is on a hotkey');
  assert.ok(currentLesson(c).hint.includes(`[${key.replace(/^Key|^Digit/, '')}]`), currentLesson(c).hint);
  run(w, idle, 1);
  run(w, keys(key), 0.1);
  run(w, idle, 0.6);
  assert.ok(c.buffs.quickstep, 'cast it from the hotkey');
  assert.equal(step(w), 14, 'learned and used a skill');
  loadMap(w, 'dock', 'west');
  acceptQuest(c, 'tut_farewell');
  completeQuest(c, 'tut_farewell');
  run(w, idle, 0.1);
  assert.equal(step(w), 15, 'said goodbye');
  // The boat.
  const boat = MAPS.dock.portals.find((p) => p.to === 'sprout');
  w.body.x = boat.x;
  run(w, keys('ArrowUp'), 0.3);
  assert.equal(w.map.id, 'sprout', 'sailed to Sprout Village');
  assert.equal(step(w), LESSONS.length, 'tutorial over');
  assert.equal(currentLesson(c), null);
  // Played through for real, the card counted 1, 2, 3... to the end, out of the same total.
  const ns = nums.seen.map((x) => x.n);
  assert.deepEqual(ns, ns.map((_, i) => i + 1), `no gaps (${ns})`);
  assert.ok(nums.seen.every((x) => x.of === nums.seen[0].of), `a steady total (${JSON.stringify(nums.seen)})`);
  assert.equal(ns.at(-1), nums.seen[0].of);
});

test('any lesson can be skipped', () => {
  const c = createCharacter('Skippy', {});
  Object.assign(c, { mapId: 'dawnbeach', portal: 'start', tutorial: { step: 0 } });
  const w = createWorld(c);
  run(w, idle, 0.1);
  assert.equal(step(w), 0);
  skipLesson(w);
  assert.equal(step(w), 1);
  assert.equal(currentLesson(c).step, 1);
});

test('every lesson has a hint for the phone controls too', () => {
  for (const l of LESSONS) assert.ok(l.phone, l.hint);
});

test('a character who skips the island has no island lessons', () => {
  const c = createCharacter('Skipper', {});
  const w = createWorld(c);
  assert.equal(w.map.id, 'sprout');
  run(w, idle, 0.2);
  assert.equal(currentLesson(c), null);
  // (New characters who skip it start past every lesson.)
  c.tutorial = { step: ISLAND_LESSONS };
  run(w, idle, 0.1);
  assert.equal(currentLesson(c), null);
});

test('leaving the island partway through ends the lessons without a hitch', () => {
  const c = createCharacter('Leaver', {});
  Object.assign(c, { mapId: 'dawnbeach', portal: 'start', tutorial: { step: 2 } });
  const w = createWorld(c);
  run(w, idle, 0.1);
  loadMap(w, 'meadow1', 'west');
  run(w, idle, 0.2);
  assert.equal(currentLesson(c), null);
});

test('the lessons count up 1, 2, 3... with no gaps, and Kuro\'s gifts come before the bag lesson', () => {
  const c = createCharacter('Counter', {});
  Object.assign(c, { mapId: 'dawnbeach', portal: 'start', tutorial: { step: 0 } });
  const w = createWorld(c);
  const nums = watchNumbers(w);
  const tick = (secs = 0.1) => {
    for (let i = 0; i < secs * 60; i++) {
      updateWorld(w, DT, idle);
      nums.note();
    }
  };
  tick();
  for (let i = 0; i < 3; i++) {
    skipLesson(w);
    tick();
  }
  assert.equal(step(w), 3, 'at Kuro');
  // Taking Washed Ashore isn't the end of it: its gifts (the sword) come with Complete.
  acceptQuest(c, 'tut_hello');
  tick();
  assert.equal(step(w), 3, "the bag lesson waits for Kuro's sword");
  assert.match(currentLesson(c).hint, /Complete/, 'the card says to press Complete');
  assert.ok(completeQuest(c, 'tut_hello'));
  tick();
  assert.equal(step(w), 4, 'now the bag');
  assert.ok(c.inventory.equip.some((e) => e?.id === 'sword_0'), 'with the sword in it');
  equipFromBag(c, c.inventory.equip.findIndex((e) => e?.id === 'sword_0'));
  tick();
  // (Auto stats is on: the points placed themselves, so the stats lesson never shows.)
  assert.equal(step(w), 6, 'straight on to the portal');
  // Skipping on from here (a lesson already done on the way is passed over, and drops out of
  // the total rather than leaving a hole in the numbers).
  for (let i = 0; i < 20 && currentLesson(c); i++) {
    skipLesson(w);
    tick();
  }
  assert.equal(currentLesson(c), null);
  const ns = nums.seen.map((x) => x.n);
  assert.deepEqual(ns, ns.map((_, i) => i + 1), `numbers run on without a gap (${ns})`);
  assert.equal(nums.seen.at(-1).n, nums.seen.at(-1).of, 'the last lesson is the last number');
  assert.equal(nums.seen[0].of, LESSONS.length - 1, 'the stats lesson is left out of the count');
});

test('with Auto stats off, the stats lesson shows after the weapon and is counted', () => {
  const was = settings.autoStats;
  settings.autoStats = false;
  try {
    const c = createCharacter('Manual', {});
    Object.assign(c, { mapId: 'dawnbeach', portal: 'start', tutorial: { step: 4 } });
    c.quests.tut_hello = { state: 'done' };
    addItem(c.inventory, 'sword_0', 1);
    const w = createWorld(c);
    run(w, idle, 0.1);
    assert.equal(currentLesson(c).of, LESSONS.length);
    equipFromBag(c, c.inventory.equip.findIndex((e) => e?.id === 'sword_0'));
    run(w, idle, 0.1);
    assert.ok(c.ap > 0, 'the points are waiting');
    assert.equal(step(w), 5, 'the stats lesson');
    const n = currentLesson(c).n;
    autoAssignAp(c);
    run(w, idle, 0.1);
    assert.equal(step(w), 6);
    assert.equal(currentLesson(c).n, n + 1);
  } finally {
    settings.autoStats = was;
  }
});

test('Set Sail never strands you: close it without Complete, head for the boat, and Kuro runs over to say goodbye', () => {
  const c = atDock('Hasty');
  const w = createWorld(c);
  run(w, idle, 0.1);
  assert.equal(step(w), 14);
  assert.ok(acceptQuest(c, 'tut_farewell'));
  run(w, idle, 0.1);
  assert.equal(questState(c, 'tut_farewell'), 'ready');
  assert.equal(step(w), 14, 'the goodbye lesson waits for Complete');
  assert.match(currentLesson(c).hint, /Complete/);
  // (The window closed, the hero makes for the boat.)
  w.body.x = 900;
  for (let i = 0; i < 600 && !w.scene; i++) updateWorld(w, DT, keys('ArrowRight'));
  assert.equal(w.scene?.id, 'tut_bye_boat', 'Kuro catches you before the boat');
  assert.ok(Math.abs(w.body.x - boatOf().x) > 22, 'out of the boat\'s reach when he does');
  assert.equal(questState(c, 'tut_farewell'), 'done', 'and the quest is handed in');
  const gold = c.gold;
  // The scene plays: Kuro comes over and stands beside you.
  const kuro = w.map.npcs.find((n) => n.id === 'kuro');
  for (let i = 0; i < 60 * 8 && w.scene; i++) {
    updateWorld(w, DT, idle);
    if (w.cine?.say || w.scene?.i > 3) break;
  }
  run(w, idle, 3);
  advanceScene(w, true);
  run(w, idle, 0.5);
  assert.equal(w.scene, null, 'the scene ends');
  assert.equal(kuro.x, 760, 'Kuro goes back to his spot');
  assert.equal(step(w), 15, 'on to the boat');
  w.body.x = boatOf().x;
  run(w, keys('ArrowUp'), 0.3);
  assert.equal(w.map.id, 'sprout');
  assert.equal(currentLesson(c), null);
  assert.equal(c.gold, gold, 'paid once, not twice');
  assert.ok(!trackedQuests(c).includes('tut_farewell'), 'nothing left in the quest log');
});

test('never even talking to Kuro on the dock, he still catches you at the boat for his goodbye', () => {
  const c = atDock('Skipper');
  const w = createWorld(c);
  run(w, idle, 0.1);
  w.body.x = 1000;
  for (let i = 0; i < 300 && !w.scene; i++) updateWorld(w, DT, keys('ArrowRight'));
  assert.equal(w.scene?.id, 'tut_bye_boat');
  assert.equal(questState(c, 'tut_farewell'), 'done');
});

test('a save already stuck with Set Sail open off the island is settled when it loads', () => {
  const c = createCharacter('Stuck', {});
  Object.assign(c, { mapId: 'sprout', portal: 'start', tutorial: { step: ISLAND_LESSONS } });
  c.quests.tut_hello = { state: 'done' };
  c.quests.tut_practice = { state: 'done' };
  c.quests.tut_farewell = { state: 'active', kills: {}, marks: {} };
  const gold = c.gold;
  const w = createWorld(c);
  run(w, idle, 0.1);
  assert.equal(questState(c, 'tut_farewell'), 'done', 'handed in from afar');
  assert.equal(c.gold, gold + 30, 'with its pay');
  assert.ok(w.messages.some((m) => /Kuro/.test(m.text)), 'and a note from Kuro');
  assert.ok(!trackedQuests(c).includes('tut_farewell'));
  // An older quest of his left unfinished is let go rather than left hanging.
  const d = createCharacter('Stuck2', {});
  Object.assign(d, { mapId: 'meadow1', portal: 'west', tutorial: { step: ISLAND_LESSONS } });
  d.quests.tut_hello = { state: 'done' };
  d.quests.tut_practice = { state: 'active', kills: {}, marks: {} };
  const w2 = createWorld(d);
  run(w2, idle, 0.1);
  assert.equal(questState(d, 'tut_practice'), 'done');
  assert.ok(!trackedQuests(d).includes('tut_practice'));
  // ...and his goodbye, never offered while the practice hung open, doesn't turn up afterwards in
  // a town Kuro isn't in: it's settled with its pay and his note.
  assert.equal(questState(d, 'tut_farewell'), 'done', 'Set Sail is not left available off the island');
  assert.ok(w2.messages.some((m) => /paper crane/.test(m.text)), "Kuro's note");
  for (const id of ['tut_hello', 'tut_practice', 'tut_farewell']) assert.notEqual(questState(d, id), 'available', id);
});

test('arriving in Sprout Village mid-lesson ends the island lessons with a welcome', () => {
  const c = atDock('Early');
  const w = createWorld(c);
  run(w, idle, 0.1);
  // (A scene had the stage, say: no catch, straight onto the boat.)
  loadMap(w, 'sprout', 'start');
  run(w, idle, 0.1);
  assert.equal(currentLesson(c), null);
  assert.ok(w.messages.some((m) => /Tutorial complete/.test(m.text)));
});

test('the level 5 note names each instructor and their town, and a path later names your own', () => {
  const c = createCharacter('Five', {});
  const w = createWorld(c);
  c.level = 5;
  celebrateLevels(w, 1);
  const said = w.messages.map((m) => m.text).join(' ');
  for (const [who, job, town] of [['Brann', 'Warrior', 'Ember Crag'], ['Elowen', 'Star Witch', 'Moonleaf Grove'], ['Kestrel', 'Acrobat Archer', 'Sprout Village'], ['Vex', 'Wind Dancer', 'Pastel Harbor']]) {
    assert.ok(said.includes(`${who} the ${job}`) && said.includes(town), `${who} in ${town}: ${said}`);
  }
  assert.ok(/right here in Sprout Village/.test(said), 'the one where you stand is "right here"');
  assert.ok(w.messages.every((m) => m.text.length <= 110), 'each line fits the log');
  // At 30 the Warrior's paths are both Brann's, after his trial.
  const d = createCharacter('Thirty', {});
  const w2 = createWorld(d);
  Object.assign(d, { job: 'warrior', level: 30 });
  celebrateLevels(w2, 1);
  const said2 = w2.messages.map((m) => m.text).join(' ');
  assert.ok(/Brann/.test(said2) && /Ember Crag/.test(said2) && /Paladin/.test(said2) && /Berserker/.test(said2), said2);
  assert.ok(!/Vex|Kestrel|Elowen/.test(said2));
  // No job opening: no note.
  const e = createCharacter('Six', {});
  const w3 = createWorld(e);
  e.level = 6;
  celebrateLevels(w3, 1);
  assert.ok(!w3.messages.some((m) => /job/.test(m.text)));
});

// The lesson card (ui/hud.js) steps out from under a window it talks about, and never into the
// middle of the screen where the quest moments play (ui/questfx.js) while a lesson shows.
test('the lesson card stays readable beside the windows the lessons open, clear of the quest moments', () => {
  // Words and keycaps at about their drawn widths (8.5 px bold).
  const tokens = (hint) => {
    const out = [];
    for (const p of hint.split(/(\[[^\]]+\])/).filter(Boolean)) {
      if (p.startsWith('[')) out.push({ key: p.slice(1, -1), w: (p.length - 2) * 4.8 + 10, space: 0 });
      else for (const word of p.split(/(?<= )/)) out.push({ text: word, w: word.length * 4.6, space: word.endsWith(' ') ? 2.2 : 0 });
    }
    return out;
  };
  const area = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  // Windows where the game opens them (as cardSpot passes them: 3 px of room round each).
  const win = (x, y, w, h) => ({ x: x - 3, y: y - 3, w: w + 6, h: h + 6 });
  const BAG = win(300, 56, 332, 264);
  const SKILLS = win(180, 52, 336, 236);
  const QUESTS = win(300, 52, 312, 240);
  const minimap = { x: 4, y: 4, w: 162, h: 62, weight: 1 };
  const tracker = { x: 496, y: 6, w: 138, h: 44, weight: 1 };
  // The quest moments under the card's band: the reward card, "Quest ready!" and its line, the
  // NEW QUEST card, the cheers.
  const moments = [{ x: 195, y: 84, w: 250, h: 82 }, { x: 170, y: 86, w: 300, h: 40 }, { x: 215, y: 82, w: 210, h: 70 }, { x: 245, y: 140, w: 150, h: 40 }];
  const hint = (i, phone) => (phone ? LESSONS[i].phone : LESSONS[i].hint);
  const bagLesson = LESSONS.findIndex((l) => /bag/.test(l.hint) && /weapon/.test(l.hint));
  const skillLesson = LESSONS.findIndex((l) => /learn Quick Step/.test(l.hint));
  const hotkeyLesson = LESSONS.findIndex((l) => /Drag Quick Step/.test(l.hint));
  const lootLesson = LESSONS.findIndex((l) => /Fox Fluff/.test(l.hint));
  const cases = [
    [bagLesson, BAG, [minimap]],
    [bagLesson, BAG, [minimap, tracker]],
    [skillLesson, SKILLS, [minimap]],
    [hotkeyLesson, SKILLS, [minimap]],
    [lootLesson, BAG, [minimap, tracker]],
    [lootLesson, QUESTS, [minimap]],
  ];
  for (const [i, w, soft] of cases) {
    for (const phone of [false, true]) {
      const words = hint(i, phone);
      const home = placeLessonCard(tokens(words), [], { soft });
      assert.equal(home.y, 54, 'with no window up, the card sits in its usual spot');
      assert.ok(Math.abs(home.x + home.w / 2 - 320) < 1, 'in the middle');
      assert.ok(area(home, w) > 0, `the window covers it there (${words})`);
      const c = placeLessonCard(tokens(words), [w], { soft });
      const at = `${words} -> ${Math.round(c.x)},${c.y} ${Math.round(c.w)}x${c.h}`;
      assert.equal(area(c, w), 0, `the card steps out from under the window: ${at}`);
      for (const m of moments) assert.equal(area(c, m), 0, `and keeps out of the quest moments' middle: ${at}`);
      assert.equal(area(c, LESSON_BANNERS), 0, at);
      assert.ok(c.x >= 4 && c.x + c.w <= 636 && c.y >= 4 && c.y + c.h <= 210, `on screen, in its top part: ${at}`);
      for (const r of soft) assert.equal(area(c, r), 0, `off the minimap and the tracker: ${at}`);
      assert.ok(c.lines.length <= 4, `a few lines at most: ${at}`);
    }
  }
  // Above the bag, one line, when there's the room.
  const up = placeLessonCard(tokens(hint(bagLesson)), [BAG], { soft: [minimap] });
  assert.ok(up.pill && up.y + up.h <= BAG.y, 'the bag lesson goes along the top, above the bag');
  // Where it sits is kept while it stays clear and nearly as good, so it doesn't hop about.
  const nudged = placeLessonCard(tokens(hint(bagLesson)), [BAG], { soft: [minimap, { x: 300, y: 20, w: 40, h: 2, weight: 1 }] }, up);
  assert.equal(nudged, up);
  // But never under a window: a window over its spot moves it again.
  const moved = placeLessonCard(tokens(hint(bagLesson)), [BAG, win(150, 4, 300, 40)], { soft: [minimap] }, up);
  assert.notEqual(moved, up);
  assert.equal(area(moved, win(150, 4, 300, 40)), 0);
});
