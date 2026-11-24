import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCharacter } from '../src/core/character.js';
import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { playScene, advanceScene } from '../src/world/story.js';
import { skipScene } from '../src/world/director.js';
import { NPCS } from '../src/data/npcs.js';
import { QUESTS } from '../src/data/quests.js';
import { SCENES } from '../src/data/story.js';
import { FAWNELLE_QUESTS } from '../src/world/fawnelle.js';

// Fawnelle, the Moonlit Doe under Moonleaf Grove's moon tree (world/fawnelle.js).
const idle = { held: new Set(), pressed: new Set(), locked: false };
const TREE = 1110;
function grove(night, quests = 0) {
  const w = createWorld(createCharacter('Hana', {}));
  w.log = () => {};
  w.forceNight = night;
  w.char.level = 42;
  for (const q of FAWNELLE_QUESTS.slice(0, quests)) w.char.quests[q] = { state: 'done', kills: {}, marks: {} };
  loadMap(w, 'grove', 'start');
  w.body.x = 1400;
  return w;
}
const her = (w) => w.map.npcs.find((n) => n.id === 'fawnelle');
const run = (w, secs) => {
  for (let i = 0; i < secs * 60; i++) updateWorld(w, 1 / 60, idle);
};

test('Fawnelle hides behind the moon tree by day and comes out under its lanterns at night', () => {
  const day = grove(0);
  run(day, 2);
  assert.equal(day.fawnelle.mode, 'hide');
  assert.ok(Math.abs(her(day).x - TREE) < 14, `by day she stands behind the trunk (${her(day).x})`);
  const night = grove(1);
  run(night, 2);
  assert.equal(night.fawnelle.mode, 'out');
  assert.equal(her(night).x, 1162);
  // Dusk falls: she walks out, never jumping there.
  day.forceNight = 1;
  let last = her(day).x;
  for (let i = 0; i < 60 * 8; i++) {
    updateWorld(day, 1 / 60, idle);
    assert.ok(Math.abs(her(day).x - last) < 1, 'she walks out a little at a time');
    last = her(day).x;
  }
  assert.ok(Math.abs(her(day).x - 1162) < 1, `out under the lanterns by night (${her(day).x})`);
});

test('rushed at in the dark she darts behind the tree, flustered, and steps out again once you stand still', () => {
  const w = grove(1);
  run(w, 1);
  w.body.x = 1240;
  run(w, 1);
  const before = w.fawnelle.emote.seq;
  // (Walking straight at her.)
  for (let i = 0; i < 40 && w.fawnelle.mode === 'out'; i++) {
    w.body.vx = -110;
    w.body.x -= 110 / 60;
    updateWorld(w, 1 / 60, idle);
  }
  w.body.vx = 0;
  assert.equal(w.fawnelle.mode, 'hide');
  assert.ok(w.fawnelle.emote.seq > before && w.fawnelle.emote.name === 'flustered');
  run(w, 2);
  assert.ok(Math.abs(her(w).x - TREE) < 14, 'behind the trunk');
  run(w, 4);
  assert.equal(w.fawnelle.mode, 'out');
  assert.equal(w.fawnelle.emote.name === 'shy' || w.fawnelle.emote.name === 'glance', true);
});

test('once she has said her good evening she hides no more and is never startled', () => {
  const w = grove(0, 4);
  run(w, 3);
  assert.equal(w.fawnelle.mode, 'out');
  w.forceNight = 1;
  w.body.x = 1240;
  run(w, 1);
  for (let i = 0; i < 40; i++) {
    w.body.vx = -110;
    w.body.x -= 110 / 60;
    updateWorld(w, 1 / 60, idle);
  }
  assert.equal(w.fawnelle.mode, 'out');
});

test("her story is four steps, 39 to 42, each with its scene, and she isn't drawn on the hero's body", () => {
  assert.equal(NPCS.fawnelle.drawn, 'fawnelle');
  assert.equal(NPCS.fawnelle.look, undefined);
  assert.deepEqual(NPCS.fawnelle.quests, FAWNELLE_QUESTS);
  assert.deepEqual(FAWNELLE_QUESTS.map((q) => QUESTS[q].minLevel), [39, 40, 41, 42]);
  for (const q of FAWNELLE_QUESTS) assert.ok(SCENES[`${q}_done`]?.length, `${q} has its scene`);
});

test('her scenes play through, and after one she walks back to her place instead of jumping there', () => {
  for (const q of FAWNELLE_QUESTS) {
    const w = grove(1, FAWNELLE_QUESTS.indexOf(q));
    run(w, 1);
    playScene(w, `${q}_done`);
    assert.ok(w.scene, `${q}'s scene starts`);
    let steps = 0;
    for (let i = 0; i < 3000 && w.scene; i++) {
      updateWorld(w, 1 / 30, idle);
      if (w.scene && i % 20 === 19) advanceScene(w);
      steps = Math.max(steps, w.scene?.i ?? steps);
    }
    assert.ok(steps > 8, `${q}'s scene played its steps (${steps})`);
    if (w.scene) skipScene(w);
    assert.equal(w.scene, null, `${q}'s scene ends`);
    const at = her(w).x;
    updateWorld(w, 1 / 60, idle);
    assert.ok(Math.abs(her(w).x - at) < 1, `no jump after ${q}'s scene`);
  }
});
