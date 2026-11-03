// The main story (data/story.js, world/story.js): its quests chain, the regions it opens, the
// queens' trials and their return as field bosses, and the cutscenes.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { QUESTS } from '../src/data/quests.js';
import { NPCS } from '../src/data/npcs.js';
import { MOBS } from '../src/data/mobs.js';
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
  // Every step is a card, a line, or staging (world/director.js) that names real people and known
  // emotes and bursts.
  const STAGING = ['cam', 'walk', 'face', 'jump', 'emote', 'say', 'wait', 'fade', 'flash', 'shake', 'fx', 'spawn', 'leave', 'act', 'mood', 'spot', 'together'];
  const EMOTES = ['!', '?', 'heart', 'note', 'sweat', 'anger', 'zzz', 'sparkle', 'idea'];
  const BURSTS = ['sparkle', 'hearts', 'petals', 'leaves', 'wind', 'confetti', 'spores', 'dust', 'rubble', 'notes', 'china', 'bubbles', 'ink', 'gears', 'pages', 'starfall', 'sparks', 'caramel', 'crumbs', 'shout', 'feathers'];
  // People, and monsters (a boss acts in its own entrance); only people step in and out.
  const actor = (who) => who === 'player' || Boolean(NPCS[who]) || Boolean(MOBS[who]);
  const check = (st) => {
    if (st.card || (typeof st.text === 'string' && st.say === undefined)) return;
    const kind = STAGING.find((k) => st[k] !== undefined);
    assert.ok(kind, `a staging step of a known kind: ${JSON.stringify(st)}`);
    if (kind === 'together') return st.together.forEach(check);
    for (const k of ['act', 'mood']) if (st[k] !== undefined) assert.ok(MOBS[st[k]], `${k} names a real monster: ${st[k]}`);
    for (const k of ['walk', 'face', 'jump', 'emote', 'say', 'away']) if (st[k] !== undefined) assert.ok(actor(st[k]), `${k} names a real actor: ${st[k]}`);
    for (const k of ['spawn', 'leave']) if (st[k] !== undefined) assert.ok(st[k] === 'player' || NPCS[st[k]], `${k} names a real person: ${st[k]}`);
    if (st.spot) assert.ok(actor(st.spot), `spot follows a real actor: ${st.spot}`);
    if (Array.isArray(st.cam)) for (const w of st.cam) assert.ok(actor(w), `cam frames a real actor: ${w}`);
    if (typeof st.to === 'string') assert.ok(actor(st.to), `to a real person: ${st.to}`);
    if (st.emote) assert.ok(EMOTES.includes(st.kind ?? '!'), `a known emote: ${st.kind}`);
    if (st.fx) assert.ok(BURSTS.includes(st.fx), `a known burst: ${st.fx}`);
    if (st.say !== undefined) assert.equal(typeof st.text, 'string', 'a bubble has words');
  };
  for (const sc of Object.values(SCENES)) for (const st of sc) check(st);
});

test('the story is optional: every region is open, only its arenas wait for it', () => {
  for (const key of Object.keys(STORY_LOCKS)) {
    const [map, portal] = key.split('.');
    assert.ok(MAPS[map]?.portals.some((p) => p.id === portal), `${key} is a real portal`);
  }
  const w = createWorld(createCharacter('Hana', {}));
  assert.equal(storyLock(w, MAPS.woods, MAPS.woods.portals.find((p) => p.id === 'glade')), null, 'the glade is open from the start');
  const bower = MAPS.glade.portals.find((p) => p.id === 'bower');
  assert.ok(storyLock(w, MAPS.glade, bower), "Sylvana's bower waits for the story");
  w.char.quests.story_3_2 = { state: 'active', kills: {}, marks: {} };
  assert.equal(storyLock(w, MAPS.glade, bower), null, 'open once the story gets there');
});

test("a queen waits in her arena for her trial, and roams her region as a field boss", () => {
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
  assert.ok(fresh.mobs.some((m) => m.def.id === 'sylvana'), 'she roams her region as a field boss from the start');
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
