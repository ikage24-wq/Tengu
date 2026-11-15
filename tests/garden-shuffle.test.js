// The shuffle test (2026-11-15): the Mochi Garden's own pieces set out at random, packed close, and the
// garden lived in - by day, in the rain and the snow, at every festival - to catch anything that only
// goes wrong once things are moved: a Mochi stood inside the well, a ride away from its piece, the
// festival's offering on top of the vegetable bed, a piece that vanishes as the camera passes it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCharacter } from '../src/core/character.js';
import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { rollMochi, PERSONALITIES } from '../src/data/mochi-genes.js';
import { newRecord, giveExp } from '../src/data/mochi-raise.js';
import { FURNITURE_BY_ID } from '../src/data/furniture.js';
import { groundAt } from '../src/world/physics.js';
import { placeAt, placePiece, putAway } from '../src/world/decor.js';
import { GARDEN_START, LAYOUT, footOf } from '../src/world/garden-layout.js';
import { refreshGarden } from '../src/world/garden.js';
import * as life from '../src/world/garden-life.js';

const keys = () => ({ held: new Set(), pressed: new Set() });
// The solid part of each piece, either side of its x: what you'd see a Mochi stood inside.
const BODY = { mg_mailbox: [-10, 10], mg_cropbed: [-48, 48], mg_beanframe: [-28, 28], mg_flowerbed: [-44, 44], mg_well: [-27, 27], mg_seesaw: [-22, 22], mg_toybox: [-26, 26], mg_slide: [-30, 48], mg_mushroom: [-26, 26] };
// (Where a Mochi may stand inside one: doing what it's for.)
const OWN = { crank: 'mg_well', water: 'mg_cropbed', sniff: 'mg_flowerbed', roll: 'mg_flowerbed', nap: 'mg_flowerbed', peek: 'mg_mailbox', play: 'mg_toybox' };
const RIDE_PIECE = { swing: 'mg_bigtree', slide: 'mg_slide', bounce: 'mg_mushroom', seesaw: 'mg_seesaw' };

// Sets out every piece at random (half the tries hugging one already out), seeded.
function shuffle(map, char, seed, set = (id, x) => placePiece(map, char, id, x, groundAt(map, x))) {
  let rs = seed * 7919;
  const rnd = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
  const out = [];
  for (const [id] of [...GARDEN_START].sort(() => rnd() - 0.5)) {
    for (let k = 0; k < 400; k++) {
      let x = 210 + rnd() * 1882;
      if (out.length && rnd() < 0.5) {
        const [a, b] = footOf(out[Math.floor(rnd() * out.length)]);
        const d = FURNITURE_BY_ID[id];
        x = rnd() < 0.5 ? b + d.w / 2 - (d.ox ?? 0) + 2 : a - d.w / 2 - (d.ox ?? 0) - 2;
      }
      const p = set(id, x);
      if (typeof p === 'object') {
        out.push(p);
        break;
      }
    }
  }
  return out;
}

function shuffledGarden(seed) {
  const char = createCharacter('Mina', { hairStyle: 'bob' });
  const recs = [0, 1, 2, 3, 4].map((i) => {
    const rec = newRecord(rollMochi(8000 + seed * 31 + i, { coat: null }));
    for (const st of ['run', 'fly', 'power', 'stamina', 'swim']) giveExp(rec, st, 1500);
    Object.assign(rec, { personality: PERSONALITIES[(seed * 5 + i) % PERSONALITIES.length], name: `M${i}` });
    return rec;
  });
  char.garden = { back: null, mochi: recs, eggs: [], unlocked: {}, mail: [{ kind: 'sweet', id: 'mochi_daifuku' }] };
  const w = createWorld(char);
  Object.assign(w, { forceFestival: null, forceWeather: {}, forceNight: 0, log: () => {} });
  let now = 1.8e12 + seed * 1e7;
  const realNow = Date.now;
  Date.now = () => now;
  loadMap(w, 'garden', 'start');
  const run = (secs, each) => {
    for (let t = 0; t < secs; t += 0.1) {
      now += 100;
      updateWorld(w, 0.1, keys());
      each?.();
    }
  };
  run(0.3);
  for (const p of [...char.garden.placed]) if (FURNITURE_BY_ID[p.id].builtin) putAway(char, p);
  shuffle(w.map, char, seed);
  run(0.3);
  return { w, char, run, done: () => (Date.now = realNow) };
}

// Watches every Mochi while the garden runs: returns what went wrong.
function watch(g) {
  const bad = [];
  const pieces = () => LAYOUT.pieces.map((p) => ({ id: p.id, kind: FURNITURE_BY_ID[p.id].kind, x: p.x }));
  const check = () => {
    const list = pieces();
    for (const e of g.w.gardenLife.mochi) {
      if (e.x == null) continue;
      if (!Number.isFinite(e.x) || !Number.isFinite(e.y)) bad.push(`${e.rec.name} at ${e.x},${e.y}`);
      if (e.ride) {
        const p = list.find((q) => q.kind === RIDE_PIECE[e.ride.kind]);
        if (RIDE_PIECE[e.ride.kind] && (!p || e.x < p.x - 90 || e.x > p.x + 160)) bad.push(`${e.rec.name} on the ${e.ride.kind} at ${Math.round(e.x)}, its piece at ${p?.x}`);
        continue;
      }
      if (e.hidden || e.scene || Math.abs(e.vx ?? 0) > 1 || e.m.mode !== 'run' || Math.abs(e.y - groundAt(g.w.map, e.x)) > 3) {
        e.inside = null;
        continue;
      }
      const act = e.m.action?.name;
      const plan = e.brain?.plan?.id ?? '';
      const p = list.find((q) => BODY[q.kind] && e.x > q.x + BODY[q.kind][0] + 6 && e.x < q.x + BODY[q.kind][1] - 6 && OWN[act] !== q.kind && !(/^p\d+$|^toy$/.test(plan) && Object.values(OWN).includes(q.kind)) && !(e.duo?.kind === 'hide' && q.kind === 'mg_flowerbed'));
      // (Only if it stays there: not a step on its way past.)
      if (!p || e.inside?.id !== p.id) {
        e.inside = p ? { id: p.id, n: 0 } : null;
        continue;
      }
      if (++e.inside.n === 10) bad.push(`${e.rec.name} ${act ?? 'stood'} inside the ${p.id.replace('garden_', '')} at ${Math.round(e.x)} (plan ${plan || '-'})`);
    }
  };
  return { bad, check };
}

test('shuffled gardens: no Mochi stands inside a piece, and every ride is on its own piece', () => {
  for (const seed of [1, 2, 3, 4]) {
    const g = shuffledGarden(seed);
    try {
      const v = watch(g);
      g.run(150, v.check);
      assert.deepEqual(v.bad, [], `layout ${seed}`);
    } finally {
      g.done();
    }
  }
});

test('shuffled gardens in the rain, the snow and every festival: nobody inside a piece, nothing on one', () => {
  for (const seed of [5, 6]) {
    const g = shuffledGarden(seed);
    try {
      const v = watch(g);
      const phases = [
        [{ kind: 'rain', k: 1, wet: 1 }, null, 0], [{ kind: 'snow', k: 1, snow: 1 }, null, 0],
        ...['moon', 'snow', 'blossom', 'lantern'].flatMap((id) => [[{}, { id, eve: 0, hour: 12, k: 1 }, 0], [{}, { id, eve: 1, hour: 20.5, k: 1 }, 0.9]]),
      ];
      for (const [weather, festival, night] of phases) {
        Object.assign(g.w, { forceWeather: weather, forceFestival: festival, forceNight: night });
        g.run(0.3);
        // The festival's own things, and the snow-Mochi: on the grass, never on a piece.
        const on = (x, half) => LAYOUT.pieces.find((p) => FURNITURE_BY_ID[p.id].layer !== 'back' && x + half > footOf(p)[0] + 1 && x - half < footOf(p)[1] - 1)?.id;
        const sp = life.festivalSpots(g.w.gardenLife);
        for (const [what, x, half] of [['offering', sp.offering, 15], ['mortar', sp.mortar, 15], ['mat', sp.mat, 28], ['snow-Mochi', life.SNOWMAN_X, 18], ...life.snowLanterns(g.w.gardenLife).map((x) => ['snow lantern', x, 9])]) {
          assert.equal(on(x, half), undefined, `layout ${seed}: the ${what} at ${x}`);
        }
        g.run(30, v.check);
      }
      assert.deepEqual(v.bad, [], `layout ${seed}`);
    } finally {
      g.done();
    }
  }
});

test('a garden still as it came: the festival\'s things stand just where they always did', () => {
  // (A moment of garden life first: that's when the layout is taken in.)
  const char = createCharacter('Mina', { hairStyle: 'bob' });
  char.garden = { back: null, mochi: [], eggs: [], unlocked: {} };
  const w = createWorld(char);
  Object.assign(w, { forceFestival: null, forceWeather: {}, forceNight: 0, log: () => {} });
  loadMap(w, 'garden', 'start');
  updateWorld(w, 0.1, keys());
  assert.deepEqual(life.festivalSpots(w.gardenLife), { key: '', offering: 1908, mortar: 1073, mat: 1073 });
  assert.deepEqual(life.snowLanterns(w.gardenLife), [380, 650, 840, 1110, 1480, 1600, 1780, 1900, 2040]);
  assert.equal(life.SNOWMAN_X, 1240);
});

test('shuffled gardens: every piece is drawn whenever any of it is on screen', async () => {
  // (Drawn onto a stand-in canvas that only notes whether anything was drawn.)
  const stub = () => new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'width' || k === 'height' ? 64 : k === 'then' ? undefined : stub()), apply: () => stub(), construct: () => stub(), set: () => true });
  const saved = { document: globalThis.document, ImageData: globalThis.ImageData };
  globalThis.document = { createElement: () => stub() };
  globalThis.ImageData ??= function (w, h) {
    Object.assign(this, { width: w, height: h, data: new Uint8ClampedArray(Math.max(4, (w | 0) * (h | 0) * 4)) });
  };
  try {
    const { drawGardenPiece } = await import('../src/render/garden.js');
    const { BEHIND_GROUND } = await import('../src/render/scenery.js');
    let drew = 0;
    const DRAW = new Set(['drawImage', 'fill', 'fillRect', 'stroke', 'strokeRect', 'fillText']);
    const screen = new Proxy({ globalAlpha: 1 }, { get: (t, k) => (DRAW.has(k) ? () => drew++ : k in t ? t[k] : typeof k === 'string' ? () => stub() : undefined), set: (t, k, v) => ((t[k] = v), true) });
    const HALF = { mg_bigtree: 130, mg_fruittree: 60, mg_well: 34, mg_toybox: 32, mg_slide: 50, mg_mushroom: 30, mg_cropbed: 52, mg_beanframe: 36, mg_flowerbed: 50, mg_lantern: 13, mg_mailbox: 12, mg_seesaw: 28, mg_nursery: 90 };
    const W = 640;
    for (const seed of [1, 2, 3]) {
      const char = { name: 'x', inventory: { equip: [], use: [], etc: [] }, home: null, garden: { mochi: [], eggs: [], unlocked: {}, placed: [], pieces: 1 } };
      let map = refreshGarden(char);
      let uid = 1;
      shuffle(map, char, seed, (id, x) => {
        const r = placeAt(map, char, id, x, groundAt(map, x));
        if (r.why) return r.why;
        const p = { uid: uid++, id, map: 'garden', x: r.x, y: r.y, flip: false };
        char.garden.placed.push(p);
        return p;
      });
      map = refreshGarden(char);
      for (const t of map.townPieces) {
        const [kind, wx, extra] = t;
        if (!kind.startsWith('mg_')) continue;
        const long = typeof extra?.to === 'number';
        const x1 = long ? wx : wx - (HALF[kind] ?? 30);
        const x2 = long ? extra.to : wx + (HALF[kind] ?? 30);
        const solo = { ...map, townPieces: [t] };
        for (let cx = x1 - W - 40; cx < x2 + 40; cx += 12) {
          drew = 0;
          if (kind === 'mg_fruittree') for (const hook of BEHIND_GROUND) hook(screen, solo, { x: cx, y: 404 }, W, 1);
          drawGardenPiece(screen, map, kind, wx, extra, { x: cx, y: 404 }, W, 1);
          if (x2 - cx > 16 && x1 - cx < W - 16) assert.ok(drew > 0, `layout ${seed}: ${kind} ${Math.round(x1)}-${Math.round(x2)} not drawn with the camera at ${Math.round(cx)}`);
        }
      }
    }
  } finally {
    globalThis.document = saved.document;
    if (saved.ImageData === undefined) delete globalThis.ImageData;
    refreshGarden({});
  }
});
