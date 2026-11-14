// Dressing your Mochi (ui/mochi-closet.js) from the clothes stall (world/garden-life.js): a piece
// bought is kept with the garden, so every hero in the save file can dress the Mochi in it, and is
// only ever bought once; and putting things on follows the wardrobe's rules: a dress takes the
// place of a top and a bottom, a top or a bottom takes a dress off, a piece clicked twice comes off,
// and a prize costume and the pieces never show at once.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCharacter } from '../src/core/character.js';
import { createWorld, loadMap } from '../src/world/world.js';
import { rollMochi } from '../src/data/mochi-genes.js';
import { newRecord } from '../src/data/mochi-raise.js';
import { stallClothes, buyStallWear, ownsWear } from '../src/world/garden-life.js';
import { changed } from '../src/ui/mochi-closet.js';

function garden() {
  const char = createCharacter('Mina', { hairStyle: 'bob' });
  const rec = newRecord(rollMochi(901, { coat: null }));
  char.garden = { back: null, mochi: [rec], eggs: [], unlocked: {} };
  char.gold = 100000;
  const w = createWorld(char);
  w.log = () => {};
  loadMap(w, 'garden', 'start');
  return { w, char, rec };
}

test('a piece from the stall is kept with the garden, and bought once', () => {
  const { w, char } = garden();
  const model = stallClothes(char)[0];
  const piece = model.pieces[0];
  const gold = char.gold;
  assert.equal(buyStallWear(w, 0, piece.kind), null);
  assert.ok(char.garden.wardrobe.includes(piece.id), 'it lives with the garden');
  assert.ok(ownsWear(char, piece.id));
  assert.equal(char.gold, gold - piece.price);
  assert.match(buyStallWear(w, 0, piece.kind), /already/);
  assert.equal(char.gold, gold - piece.price, 'not charged twice');
});

test('dressing: a dress replaces a top and a bottom, and the other way round', () => {
  const rec = { wear: { top: 'tee', bottom: 'shorts', hat: 'beret' }, dress: null };
  const a = changed(rec, 'dress', 'nightie');
  assert.deepEqual(a.wear, { hat: 'beret', dress: 'nightie' });
  const b = changed({ wear: a.wear, dress: null }, 'top', 'tee');
  assert.deepEqual(b.wear, { hat: 'beret', top: 'tee' });
});

test('dressing: a piece it has on comes off when picked again', () => {
  const rec = { wear: { hat: 'beret', shoes: 'clogs' }, dress: null };
  assert.deepEqual(changed(rec, 'hat', 'beret').wear, { shoes: 'clogs' });
});

test('dressing: a costume covers the pieces, and a piece takes the costume off', () => {
  const rec = { wear: { hat: 'beret' }, dress: null };
  const on = changed(rec, 'costume', 'daifuku');
  assert.equal(on.dress, 'daifuku');
  assert.deepEqual(on.wear, { hat: 'beret' }, 'the pieces are kept for later');
  const piece = changed({ wear: on.wear, dress: 'daifuku' }, 'hat', 'beret');
  assert.equal(piece.dress, null);
  assert.deepEqual(piece.wear, { hat: 'beret' }, 'picking the hidden hat puts it back on rather than off');
  assert.equal(changed({ wear: on.wear, dress: 'daifuku' }, 'costume', 'daifuku').dress, null);
});
