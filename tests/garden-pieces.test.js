// The Mochi Garden's own pieces (world/garden-layout.js, 2026-11-15): the see-saw, the trees, the well,
// the beds, the fences... are yours to move about and put away in Decorate, and the Mochi's play
// follows them wherever they stand.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCharacter } from '../src/core/character.js';
import { createWorld, updateWorld, loadMap, dropItem } from '../src/world/world.js';
import { rollMochi } from '../src/data/mochi-genes.js';
import { newRecord, giveExp } from '../src/data/mochi-raise.js';
import { countItem } from '../src/core/inventory.js';
import { ITEMS } from '../src/data/items.js';
import { FURNITURE_BY_ID, GARDEN_BUILTINS } from '../src/data/furniture.js';
import { groundAt } from '../src/world/physics.js';
import { placeAt, placePiece, pickUpPiece, putAway, pieceAt } from '../src/world/decor.js';
import { GARDEN_START, LAYOUT } from '../src/world/garden-layout.js';
import { refreshGarden } from '../src/world/garden.js';
import { clickTargets } from '../src/world/clicks.js';
import * as life from '../src/world/garden-life.js';

const keys = (held = []) => ({ held: new Set(held), pressed: new Set(held) });

function garden() {
  const char = createCharacter('Mina', { hairStyle: 'bob' });
  const recs = [903, 904].map((s) => {
    const rec = newRecord(rollMochi(s, { coat: null }));
    for (const st of ['run', 'fly', 'power', 'stamina', 'swim']) giveExp(rec, st, 1500);
    return rec;
  });
  char.garden = { back: null, mochi: recs, eggs: [], unlocked: {} };
  const w = createWorld(char);
  w.forceFestival = null;
  w.forceWeather = {};
  w.forceNight = 0;
  w.log = () => {};
  let now = 1.8e12;
  const realNow = Date.now;
  Date.now = () => now;
  loadMap(w, 'garden', 'start');
  const run = (secs, step = 0.1) => {
    for (let t = 0; t < secs; t += step) {
      now += step * 1000;
      updateWorld(w, step, keys());
    }
  };
  run(0.3);
  const piece = (id) => char.garden.placed.find((p) => p.id === id);
  // Moves a piece the way Decorate does: picked up, set down at x.
  const move = (id, x) => {
    const p = piece(id);
    assert.equal(pickUpPiece(char, p), p);
    const q = placePiece(w.map, char, id, x, groundAt(w.map, x), { free: true, carried: true });
    if (typeof q !== 'object') {
      char.garden.placed.push(p);
      assert.fail(`${id} at ${x}: ${q}`);
    }
    return q;
  };
  return { w, char, run, piece, move, done: () => (Date.now = realNow) };
}

test('a garden starts with its own pieces where they always stood, each fitting its own spot', () => {
  const g = garden();
  try {
    const { w, char } = g;
    assert.equal(char.garden.pieces, 1);
    assert.equal(GARDEN_BUILTINS().length, GARDEN_START.length);
    for (const [id, x] of GARDEN_START) {
      const p = g.piece(id);
      assert.ok(p && p.x === x, `${id} at ${x}`);
      // (Picked up, it could go straight back where it was.)
      const i = char.garden.placed.indexOf(p);
      char.garden.placed.splice(i, 1);
      assert.equal(placeAt(w.map, char, id, x, p.y, { free: true }).why, null, `${id} fits its own spot`);
      char.garden.placed.splice(i, 0, p);
    }
    // Drawn as the garden always was.
    const drawn = w.map.townPieces.map(([k, x]) => `${k}@${x}`);
    for (const k of ['mg_seesaw@1468', 'mg_bigtree@1660', 'mg_well@790', 'mg_fence@248', 'mg_fence@1092', 'mg_lanternline@318', 'mg_nursery@990', 'mg_moonmortar@2960']) assert.ok(drawn.includes(k), k);
    assert.equal(life.SEESAW.x, 1468);
    assert.equal(life.CROP_X, 440);
    assert.equal(life.TOY_X, 1582);
    // (Only once: a garden that has them keeps them.)
    refreshGarden(char);
    assert.equal(char.garden.placed.length, GARDEN_START.length);
  } finally {
    g.done();
  }
});

test('the garden\'s own pieces: picked up by their crown, never flipped, never sold or thrown away', () => {
  const g = garden();
  try {
    const { w, char } = g;
    // (High in the big tree's crown picks up the tree; down by the toy box, the toy box.)
    assert.equal(pieceAt(char, 'garden', 1700, groundAt(w.map, 1700) - 180)?.id, 'garden_bigtree');
    assert.equal(pieceAt(char, 'garden', 1582, groundAt(w.map, 1582) - 10)?.id, 'garden_toybox');
    const lamp = g.piece('garden_lamp');
    assert.equal(pickUpPiece(char, lamp), lamp);
    const q = placePiece(w.map, char, 'garden_lamp', 1240, groundAt(w.map, 1240), { flip: true, carried: true, free: true });
    assert.equal(typeof q, 'object');
    assert.equal(q.flip, false, 'never flipped');
    assert.ok(ITEMS.garden_seesaw.keep && ITEMS.garden_bigtree.keep, 'kept');
    assert.ok(putAway(char, g.piece('garden_seesaw')));
    const at = char.inventory.etc.findIndex((e) => e.id === 'garden_seesaw');
    assert.equal(dropItem(w, 'etc', at), false, 'not dropped');
    assert.equal(countItem(char.inventory, 'garden_seesaw'), 1);
  } finally {
    g.done();
  }
});

test('the see-saw moved: drawn where it stands, and the Mochi ride it there', () => {
  const g = garden();
  try {
    const { w, run } = g;
    g.move('garden_seesaw', 1064);
    run(0.2);
    assert.ok(w.map.townPieces.some(([k, x]) => k === 'mg_seesaw' && x === 1064));
    assert.equal(life.SEESAW.x, 1064);
    const [a, b] = w.gardenLife.mochi;
    a.x = 1064 - 40;
    b.x = 1064 + 40;
    assert.ok(life.startRide(w, a, 'seesaw'));
    assert.ok(life.startRide(w, b, 'seesaw'));
    run(2, 1 / 20);
    for (const e of [a, b]) assert.ok(e.ride?.kind === 'seesaw' && Math.abs(e.x - 1064) < 30, 'on the board where it stands');
  } finally {
    g.done();
  }
});

test('put away, a piece\'s play waits: no toy box, no toys; no big tree, no swing and no shelter', () => {
  const g = garden();
  try {
    const { w, char, run } = g;
    assert.ok(putAway(char, g.piece('garden_toybox')));
    assert.ok(putAway(char, g.piece('garden_bigtree')));
    assert.ok(putAway(char, g.piece('garden_mushroom')));
    run(0.2);
    assert.equal(life.TOY_X, null);
    assert.equal(countItem(char.inventory, 'garden_toybox'), 1, 'in the bag');
    assert.ok(!clickTargets(w).some((c) => c.label === 'Toy box'));
    w.body.x = 1582;
    assert.equal(life.tossBall(w), false, 'no ball to toss');
    const e = w.gardenLife.mochi[0];
    assert.equal(life.startRide(w, e, 'swing'), false);
    assert.equal(life.startRide(w, e, 'bounce'), false);
    assert.ok(!life.SHELTERS.some(([x]) => x === 1660));
    // A good while of garden life: nobody tries a ride that isn't there, and nothing breaks.
    run(40, 0.25);
    for (const m of w.gardenLife.mochi) {
      assert.ok(!['swing', 'bounce'].includes(m.ride?.kind));
      assert.ok(Number.isFinite(m.x), 'stood somewhere real');
    }
    // Set out again, it's all back.
    assert.equal(typeof placePiece(w.map, char, 'garden_toybox', 1582, groundAt(w.map, 1582), { free: true }), 'object');
    run(0.2);
    assert.equal(life.TOY_X, 1582);
  } finally {
    g.done();
  }
});

test('the big tree moved: its swing, its lamp and its shade go with it', () => {
  const g = garden();
  try {
    const { w, char, run } = g;
    assert.ok(putAway(char, g.piece('garden_slide')));
    assert.equal(typeof placePiece(w.map, char, 'garden_slide', 40, groundAt(w.map, 40)), 'string', 'not off the grass');
    g.move('garden_bigtree', 1790);
    run(0.2);
    assert.equal(life.PLAY.swing, 1790);
    assert.ok(life.SHELTERS.some(([x]) => x === 1790));
    assert.ok(w.map.lamps.some((l) => l.x === 1790 - 52), 'its lantern lit where it hangs');
    const e = w.gardenLife.mochi[0];
    assert.ok(life.startRide(w, e, 'swing'));
    run(3, 1 / 20);
    assert.ok(Math.abs(e.x - (1790 + 80)) < 50, 'swinging under its branch');
  } finally {
    g.done();
  }
});

test('the vegetable bed moved: picked where it stands now, and the fruit tree shaken where it is', () => {
  const g = garden();
  try {
    const { w, char, run } = g;
    assert.ok(putAway(char, g.piece('garden_flowerbed_pink')));
    g.move('garden_cropbed', 680);
    run(0.2);
    assert.equal(life.CROP_X, 680);
    w.body.x = 680;
    assert.equal(life.harvestCrops(w), true);
    assert.ok(w.gathering, 'picking');
    // (A fruit tree goes by its own record, wherever it stands.)
    const t = g.move('garden_peachtree', 1060);
    run(0.2);
    w.body.x = 1060;
    assert.equal(life.shakeTree(w), true);
    assert.ok(char.garden.shaken[`t${t.uid}`] != null);
  } finally {
    g.done();
  }
});

test('Decorate leaves a ride a Mochi is on till it\'s done; a friend sees your garden as you laid it out', () => {
  const g = garden();
  try {
    const { w, char, run } = g;
    const e = w.gardenLife.mochi[0];
    e.x = 1830 - 37;
    assert.ok(life.startRide(w, e, 'slide'));
    run(0.3);
    assert.equal(life.busyPiece(w, g.piece('garden_slide')), e);
    assert.equal(life.busyPiece(w, g.piece('garden_well')), null);
    // A friend's garden, its see-saw moved: drawn where they put it.
    const friend = { name: 'Pal', garden: { mochi: [], eggs: [], unlocked: {}, pieces: 1, placed: char.garden.placed.map((p) => ({ ...p, x: p.id === 'garden_seesaw' ? 1064 : p.x })) } };
    const map = refreshGarden(char, friend);
    assert.ok(map.townPieces.some(([k, x]) => k === 'mg_seesaw' && x === 1064));
    // (And home again, as yours is.)
    const mine = refreshGarden(char);
    assert.ok(mine.townPieces.some(([k, x]) => k === 'mg_seesaw' && x === 1468));
    assert.equal(LAYOUT.seesaw, 1468);
    assert.ok(FURNITURE_BY_ID.garden_fence.layer === 'back');
  } finally {
    g.done();
  }
});

test('a save made carrying a piece keeps it; none of the garden pieces ever goes missing', () => {
  const g = garden();
  try {
    const { char } = g;
    assert.equal(pickUpPiece(char, g.piece('garden_bigtree'))?.id, 'garden_bigtree');
    // (Saved now, mid-move, and loaded again.)
    const loaded = JSON.parse(JSON.stringify(char));
    assert.ok(!loaded.garden.placed.some((p) => p.id === 'garden_bigtree'));
    createWorld(loaded);
    assert.ok(loaded.garden.placed.some((p) => p.id === 'garden_bigtree' && p.x === 1660), 'back where it was');
    assert.equal(loaded.carrying, undefined);
    // One gone missing some other way: back in the bag, to set out again.
    const lost = JSON.parse(JSON.stringify(loaded));
    lost.garden.placed = lost.garden.placed.filter((p) => p.id !== 'garden_well');
    refreshGarden(lost);
    assert.equal(countItem(lost.inventory, 'garden_well'), 1);
    refreshGarden(lost);
    assert.equal(countItem(lost.inventory, 'garden_well'), 1, 'only the once');
  } finally {
    refreshGarden(g.char);
    g.done();
  }
});
