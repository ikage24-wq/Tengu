// The effect sprite strips (assets/fx/, Tengu's own art): every strip the game lists exists and is
// the size the list says, and every strip named in the effect code is listed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { FX_SHEETS } from '../src/render/fx-sheets.js';

const root = new URL('../', import.meta.url);
const pngSize = (path) => {
  const b = readFileSync(new URL(path, root));
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};

test('every effect strip exists at the size its list says', () => {
  for (const [name, s] of Object.entries(FX_SHEETS)) {
    // A big version plays another strip larger.
    if (s.of) {
      assert.ok(FX_SHEETS[s.of] && !FX_SHEETS[s.of].of && s.k > 1, `${name} plays ${s.of} larger`);
      continue;
    }
    assert.ok(s.d >= 2, `${name} is drawn in HD`);
    const { w, h } = pngSize(`assets/fx/${name}.png`);
    assert.equal(w, s.w * s.n, `${name} is ${s.n} frames of ${s.w} wide`);
    assert.equal(h, s.h, `${name} height`);
    assert.ok(s.fps > 0 && s.n > 0, `${name} plays`);
  }
});

test('every effect strip the code uses is listed', () => {
  const dir = new URL('src/render/', root);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const src = readFileSync(new URL(file, dir), 'utf8');
    for (const [, name] of src.matchAll(/fxSprite\(ctx, '([a-z]+)'/g)) assert.ok(FX_SHEETS[name], `${file} uses "${name}"`);
    // Tengu's own strips are often picked by school or path (`ringOf`, a ternary): every one the
    // code names must exist.
    if (!src.includes("from './fx-sprites.js'")) continue;
    for (const [, name] of src.matchAll(/'(cel[a-z]+)'/g)) assert.ok(FX_SHEETS[name], `${file} names "${name}"`);
  }

});

test("every school has its ring and pillar of light in Tengu's own art", () => {
  for (const school of ['', 'holy', 'rage', 'ice', 'wind', 'shadow', 'hawk', 'night', 'bloom', 'crimson']) {
    assert.ok(FX_SHEETS[`celring${school}`], `ring ${school || 'steel'}`);
    assert.ok(FX_SHEETS[`celpillar${school}`], `pillar ${school || 'steel'}`);
  }
  for (const name of ['celslash', 'celslashgold', 'celslashred']) assert.ok(FX_SHEETS[name].r > 0, `${name} can follow a swing`);
});

test('every skill has its own drawn icon', async () => {
  const { SKILLS } = await import('../src/data/skills.js');
  const { SKILL_ART } = await import('../src/render/icons/skills.js');
  for (const id of Object.keys(SKILLS)) assert.ok(SKILL_ART[id], `${id} has its icon`);
});
