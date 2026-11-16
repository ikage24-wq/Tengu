// The monsters' voices (src/audio/voices.js): every monster has a family, and every family's
// recordings are there (tools/build-voices.py), two takes of each moment.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { MOBS } from '../src/data/mobs.js';
import { VOICED, VOICE_FAMILIES, voiceOf } from '../src/audio/voices.js';
import { RECORDED, recFiles } from '../src/audio/recorded.js';
import { RECIPES } from '../src/audio/recipes.js';

test('every monster has a voice family of its own', () => {
  const missing = Object.keys(MOBS).filter((id) => !VOICED.includes(id));
  assert.deepEqual(missing, [], 'monsters with no voice family (add them to src/audio/voices.js)');
  for (const id of Object.keys(MOBS)) assert.ok(VOICE_FAMILIES.includes(voiceOf(id)));
});

test("every family's voices are recorded: spotting you, hurt and beaten, two takes each", () => {
  for (const fam of VOICE_FAMILIES) {
    for (const moment of ['Spot', 'Hurt', 'Die']) {
      const name = `mv${fam}${moment}`;
      assert.ok(RECIPES[name], `${name} has a recipe`);
      assert.equal(RECORDED[name]?.takes, 2, `${name} has two takes`);
      for (const f of recFiles(name)) assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), `${f} exists`);
    }
  }
});

test("every Mochi voice style is recorded, two takes each (tools/build-mochi-voices.py)", async () => {
  const { VOICES } = await import('../src/data/mochi-genes.js');
  for (const style of VOICES) {
    const name = `mochi${style[0].toUpperCase()}${style.slice(1)}`;
    assert.ok(RECIPES[name], `${name} has a recipe`);
    assert.equal(RECORDED[name]?.takes, 2, `${name} has two takes`);
    for (const f of recFiles(name)) assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), `${f} exists`);
  }
});

test('every recorded sound has its recipe (its level, gap and voice cap): without one it would never play', async () => {
  const { RECORDED } = await import('../src/audio/recorded.js');
  const { RECIPES } = await import('../src/audio/recipes.js');
  const missing = Object.keys(RECORDED).filter((k) => !RECIPES[k]);
  assert.deepEqual(missing, []);
});

test('snow sounds like snow: Frozen Peak and Cloud Glide have a winter wind (no birds), and steps there crunch in the snow', async () => {
  const { placeOf } = await import('../src/audio/ambience.js');
  const { MAPS } = await import('../src/data/maps.js');
  const { createCharacter } = await import('../src/core/character.js');
  const { createWorld, updateWorld, loadMap } = await import('../src/world/world.js');
  const { hearWorld } = await import('../src/audio/listen.js');
  assert.equal(placeOf(MAPS.peak), 'snow');
  assert.equal(placeOf(MAPS.mrace_glide), 'snow');
  const heard = [];
  const was = globalThis.__tengu;
  globalThis.__tengu = { onSound: (n, o) => heard.push([n, o]) };
  try {
    const w = createWorld(createCharacter('Mina', { hairStyle: 'bob' }));
    w.log = () => {};
    loadMap(w, 'peak');
    for (let t = 0; t < 3; t += 1 / 30) {
      updateWorld(w, 1 / 30, { held: new Set(t > 0.5 ? ['ArrowRight'] : []), pressed: new Set() });
      hearWorld(w, { x: w.body.x - 320, y: 0 });
    }
    const steps = heard.filter(([n]) => n === 'step');
    assert.ok(steps.length >= 3, `walked: ${steps.length}`);
    assert.ok(steps.every(([, o]) => o.ground === 'snow'));
  } finally {
    globalThis.__tengu = was;
  }
});

test("the garden's Mochi patter about near you: a soft little paw step as each walks", async () => {
  const { createCharacter } = await import('../src/core/character.js');
  const { createWorld, updateWorld, loadMap } = await import('../src/world/world.js');
  const { hearWorld } = await import('../src/audio/listen.js');
  const { rollMochi } = await import('../src/data/mochi-genes.js');
  const { newRecord } = await import('../src/data/mochi-raise.js');
  const heard = [];
  const was = globalThis.__tengu;
  globalThis.__tengu = { onSound: (n) => heard.push(n) };
  try {
    const char = createCharacter('Mina', { hairStyle: 'bob' });
    const recs = [1, 2, 3].map((s) => Object.assign(newRecord(rollMochi(500 + s, { coat: null })), { stage: 'amamochi' }));
    char.garden = { back: null, mochi: recs, eggs: [], unlocked: {} };
    const w = createWorld(char);
    w.log = () => {};
    w.forceWeather = {};
    loadMap(w, 'garden');
    updateWorld(w, 1 / 30, { held: new Set(), pressed: new Set() });
    // (One of them walking along by you - whatever it would have chosen to do - and one far off.)
    const [near, far] = w.gardenLife.mochi;
    Object.assign(near, { x: w.body.x + 40, held: false, ride: null });
    Object.assign(far, { x: w.body.x + 600, held: false, ride: null });
    for (let t = 0; t < 2; t += 1 / 30) {
      for (const e of [near, far]) {
        e.m.mode = 'run';
        e.m.dist += 2;
      }
      hearWorld(w, { x: w.body.x - 320, y: 0 });
    }
    const paws = heard.filter((n) => n === 'mochiStep').length;
    assert.ok(paws >= 8 && paws <= 14, `paws: ${paws}`);
  } finally {
    globalThis.__tengu = was;
  }
});
