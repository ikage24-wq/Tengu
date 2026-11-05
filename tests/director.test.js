// The cutscene director (world/director.js): scenes staged in the world itself. People walk, the
// camera pans, emotes and bubbles show, the world's own clock stays paused, Esc plays the rest out
// at once, and afterwards everyone is back where they belong.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SCENES } from '../src/data/story.js';
import { createCharacter } from '../src/core/character.js';
import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { playScene, advanceScene } from '../src/world/story.js';

const DT = 1 / 60;
const idle = { held: new Set(), pressed: new Set() };
const run = (w, secs) => {
  for (let i = 0; i < secs * 60 && w.scene; i++) updateWorld(w, DT, idle);
};

function inSprout() {
  const w = createWorld(createCharacter('Hana', {}));
  loadMap(w, 'sprout', 'start');
  w.body.x = 700;
  return w;
}

test('a staged scene walks people over, pans the camera and pops emotes, with the world paused', () => {
  SCENES.__walk = [
    { emote: 'mira', kind: '!' },
    { walk: 'mira', to: 'player', gap: 30 },
    { cam: 'player', dur: 0.5 },
    { say: 'mira', text: 'Hello!' },
  ];
  const w = inSprout();
  const mira = w.map.npcs.find((n) => n.id === 'mira');
  const home = mira.x;
  const now = w.now;
  playScene(w, '__walk');
  run(w, 0.2);
  assert.equal(w.cine.emotes[0]?.kind, '!', 'the emote is up');
  run(w, 8);
  assert.ok(Math.abs(mira.x - (700 - 30)) < 1, `she walked up to you (${mira.x})`);
  assert.ok(w.cine.cam, 'the scene holds the camera');
  assert.equal(w.cine.say?.text, 'Hello!', 'her bubble waits for a press');
  assert.equal(w.now, now, "the world's own clock stays paused");
  w.cine.go = true;
  run(w, 0.1);
  w.cine && (w.cine.go = true);
  run(w, 0.1);
  assert.equal(w.scene, null, 'the scene is over');
  assert.equal(mira.x, home, 'she went back to her place');
  assert.equal(mira.cine, undefined);
  delete SCENES.__walk;
});

test('skipping plays the rest out at once: the hero ends where the scene puts them, visitors leave', () => {
  SCENES.__skip = [
    { spawn: 'rook', x: 900 },
    { walk: 'player', to: 1000 },
    { who: 'rook', text: 'A line nobody has to read.' },
    { fade: 'out', dur: 2 },
    { walk: 'player', by: 40 },
  ];
  const w = inSprout();
  const count = w.map.npcs.length;
  playScene(w, '__skip');
  run(w, 0.1);
  assert.equal(w.map.npcs.length, count + 1, 'Rook came for the scene');
  advanceScene(w, true);
  assert.equal(w.scene, null);
  assert.equal(w.body.x, 1040, 'the hero walked all the way, at once');
  assert.equal(w.map.npcs.length, count, 'the visitor left with the scene');
  assert.equal(w.cine, null);
  delete SCENES.__skip;
});

test('a step naming someone who is not here is passed over, never stuck', () => {
  SCENES.__missing = [{ walk: 'kestrel', to: 'player' }, { emote: 'tora', kind: 'heart' }, { jump: 'nobody' }];
  const w = inSprout();
  // Kestrel is in Sprout, but Tora and "nobody" are not.
  playScene(w, '__missing');
  run(w, 30);
  assert.equal(w.scene, null, 'the scene played through');
  delete SCENES.__missing;
});

test('the real story scenes play through on their own staging and presses', () => {
  for (const id of ['ch1_open', 'ch1_hello', 'ch1_end']) {
    const w = inSprout();
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
  }
});

// The instructors' story chains play at their camp, where the people in them stand.
test("Brann's shield story plays through at Ember Crag", () => {
  for (const id of ['brann_stand_done', 'brann_ruins_done', 'brann_forge_done', 'brann_howl_done']) {
    const w = createWorld(createCharacter('Hana', {}));
    loadMap(w, 'crag', 'west');
    const brann = w.map.npcs.find((n) => n.id === 'brann');
    w.body.x = brann.x + 60;
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
  }
});

test("Kestrel's arrow story plays through in Sprout Village", () => {
  for (const id of ['kestrel_targets_done', 'kestrel_canyon_done', 'kestrel_glade_done', 'kestrel_wings_done']) {
    const w = inSprout();
    const kestrel = w.map.npcs.find((n) => n.id === 'kestrel');
    w.body.x = kestrel.x + 60;
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
  }
});
