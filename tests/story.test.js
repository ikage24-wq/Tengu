// The main story (data/story.js, world/story.js): its quests chain, the regions it opens, the
// queens' trials and their return as field bosses, and the cutscenes.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { QUESTS } from '../src/data/quests.js';
import { NPCS } from '../src/data/npcs.js';
import { MAPS } from '../src/data/maps.js';
import { SCENES, STORY_LOCKS, TRIALS, STORY_QUESTS } from '../src/data/story.js';
import { createCharacter, gainExp } from '../src/core/character.js';
import { acceptQuest, questState, completeQuest } from '../src/core/quests.js';
import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { playScene, advanceScene, storyLock } from '../src/world/story.js';

const DT = 1 / 60;
const idle = { held: new Set(), pressed: new Set() };
const run = (w, secs) => {
  for (let i = 0; i < secs * 60; i++) updateWorld(w, DT, idle);
};

test('the story chains from Mira at level 1 to the Crystal King, every step real', () => {
  const ids = Object.keys(STORY_QUESTS);
  assert.ok(ids.length >= 15);
  for (const id of ids) {
    const q = QUESTS[id];
    assert.ok(q.story && q.chapter >= 1 && q.chapter <= 7, id);
    assert.ok(NPCS[q.giver].quests.includes(id), `${q.giver} offers ${id}`);
    for (const k of ['accept', 'done', 'win']) if (q.scenes?.[k]) assert.ok(SCENES[q.scenes[k]], `${id} scene ${q.scenes[k]}`);
    if (q.prereq) assert.ok(STORY_QUESTS[q.prereq], `${id} follows another story step`);
  }
  // One unbroken line: each step but the first follows exactly one other.
  const firsts = ids.filter((id) => !QUESTS[id].prereq);
  assert.deepEqual(firsts, ['story_1_1']);
  for (const id of ids) assert.ok(ids.filter((o) => QUESTS[o].prereq === id).length <= 1, `${id} branches`);
  for (const sc of Object.values(SCENES)) for (const st of sc) assert.ok(st.card || typeof st.text === 'string', 'every step is a card or a line');
});

test('the regions open with the story', () => {
  for (const key of Object.keys(STORY_LOCKS)) {
    const [map, portal] = key.split('.');
    assert.ok(MAPS[map]?.portals.some((p) => p.id === portal), `${key} is a real portal`);
  }
  const w = createWorld(createCharacter('Hana', {}));
  const door = MAPS.woods.portals.find((p) => p.id === 'glade');
  assert.ok(storyLock(w, MAPS.woods, door), 'the glade is shut at first');
  w.char.quests.story_3_1 = { state: 'active', kills: {}, marks: {} };
  assert.equal(storyLock(w, MAPS.woods, door), null, 'open once chapter 3 starts');
});

test("a queen waits in her arena for her trial, and comes back to her region after it", () => {
  const char = createCharacter('Hana', {});
  gainExp(char, 1e6);
  char.tutorial = null;
  const w = createWorld(char);
  w.god = true;
  loadMap(w, 'bower', 'west');
  assert.ok(!w.mobs.some((m) => m.def.id === 'sylvana'), 'no queen without the trial');
  for (const id of ['story_1_1', 'story_1_2', 'story_1_3', 'story_1_4', 'story_2_1', 'story_2_2', 'story_3_1']) char.quests[id] = { state: 'done' };
  assert.ok(acceptQuest(char, 'story_3_2'));
  loadMap(w, 'bower', 'west');
  const queen = w.mobs.find((m) => m.def.id === 'sylvana');
  assert.ok(queen, 'Sylvana waits in her bower');
  // She uses her moves: warnings go on the ground before they land.
  w.body.x = queen.x - 120;
  run(w, 8);
  assert.ok(w.callout || w.zones.length, 'she called out a move');
  // Felled, she speaks, and the trial is done.
  queen.hp = 1;
  w.pending.push({ mob: queen, damage: 10, fromX: w.body.x, at: w.now, stack: 0 });
  run(w, 0.1);
  assert.equal(w.scene?.id, 'ch3_win');
  advanceScene(w, true);
  assert.equal(questState(char, 'story_3_2'), 'ready');
  assert.ok(completeQuest(char, 'story_3_2'));
  // In the glade she now comes back now and then.
  loadMap(w, 'glade', 'west');
  assert.ok(w.mobs.some((m) => m.def.id === 'sylvana'), 'her rematch on the field');
  const fresh = createWorld(createCharacter('Kai', {}));
  loadMap(fresh, 'glade', 'west');
  assert.ok(!fresh.mobs.some((m) => m.def.id === 'sylvana'), 'not before her trial');
});

test('a scene holds the world still and steps through its lines', () => {
  const w = createWorld(createCharacter('Hana', {}));
  playScene(w, 'ch1_open');
  const x = w.body.x;
  updateWorld(w, DT, { held: new Set(['ArrowRight']), pressed: new Set() });
  assert.equal(w.body.x, x, 'nobody moves during a scene');
  for (let i = 0; i < SCENES.ch1_open.length; i++) advanceScene(w);
  assert.equal(w.scene, null);
  for (const t of Object.values(TRIALS)) assert.ok(MAPS[t.field] && QUESTS[t.quest]?.trial, `${t.boss} trial`);
});

test('important side quests and every job advancement have scenes, naming real speakers', async () => {
  const { QUEST_SCENES, JOB_SCENES } = await import('../src/data/scenes.js');
  const { MOBS } = await import('../src/data/mobs.js');
  const { JOBS } = await import('../src/data/jobs.js');
  for (const [id, sc] of Object.entries(QUEST_SCENES)) {
    assert.ok(QUESTS[id], `${id} is a quest`);
    for (const k of Object.values(sc)) assert.ok(SCENES[k], `${id}: scene ${k}`);
  }
  for (const j of Object.values(JOBS).filter((j) => j.tier === 1)) assert.ok(JOB_SCENES[j.id], `${j.id} has a scene`);
  for (const [id, sc] of Object.entries(SCENES)) {
    for (const st of sc) if (st.who && st.who !== 'player' && st.who !== 'hayate') assert.ok(NPCS[st.who] || MOBS[st.who], `${id}: who is ${st.who}?`);
  }
  // {name} and {job} fill in.
  const w = createWorld(createCharacter('Hana', {}));
  playScene(w, 'job_path', { job: 'Paladin' });
  const { fillScene } = await import('../src/world/story.js');
  assert.equal(fillScene(w, SCENES.job_path[2].text), 'I am a Paladin now.');
});
