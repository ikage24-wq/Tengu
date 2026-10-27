// The effect sprite strips (assets/fx/, from effect packs): every strip the game lists exists and
// is the size the list says, every strip named in the effect code is listed, and the packs are
// credited.
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
    const { w, h } = pngSize(`assets/fx/${name}.png`);
    assert.equal(w, s.w * s.n, `${name} is ${s.n} frames of ${s.w} wide`);
    assert.equal(h, s.h, `${name} height`);
    assert.ok(s.fps > 0 && s.n > 0, `${name} plays`);
  }
});

test('every effect strip the code uses is listed, and the packs are credited', () => {
  const dir = new URL('src/render/', root);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const src = readFileSync(new URL(file, dir), 'utf8');
    for (const [, name] of src.matchAll(/fx(?:Sprite|Pulse)\(ctx, '([a-z]+)'/g)) assert.ok(FX_SHEETS[name], `${file} uses "${name}"`);
    // HD strips are often picked by school or path (`ringOf`, a ternary): every HD name the code
    // mentions must exist.
    for (const [, name] of src.matchAll(/'(hd[a-z]+)'/g)) assert.ok(FX_SHEETS[name], `${file} names "${name}"`);
  }
  const credits = readFileSync(new URL('assets/fx/CREDITS.md', root), 'utf8');
  assert.match(credits, /PVFX Foundry/);
  assert.match(credits, /CodeManu/);
  assert.match(credits, /Brackeys/);
  assert.match(credits, /Sinestesia/);
  assert.match(credits, /Cethiel/);
});
