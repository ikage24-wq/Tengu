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
