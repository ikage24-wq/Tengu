// Animation timing: a monster's impact frame is on screen the instant its blow lands (the strike
// plays at the end of the wind-up), attack frames are timed unevenly (a held impact), and the
// hair and cape springs behave the same at any frame rate.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { framesOf, attackTiming, attackFrame } from '../src/render/monsters.js';
import { springStep, walkBob } from '../src/render/animator.js';
import { MOBS } from '../src/data/mobs.js';

const arts = [...new Set(Object.values(MOBS).map((m) => m.art))].filter((a) => framesOf(a).attack);

test('every attacking monster has one timing per frame after its wind-up', () => {
  assert.ok(arts.length > 30);
  for (const art of arts) {
    const ms = attackTiming(art);
    assert.equal(ms.length, framesOf(art).attack - 1, art);
    assert.ok(ms.every((v) => v >= 30 && v <= 1000), art);
    // Pose to pose, not even: the strike is quick, the impact (or its settle) held well past it.
    assert.ok(Math.max(...ms.slice(1)) >= ms[0] * 2.5, `${art} holds its impact`);
  }
});

test('the impact frame shows the moment the blow lands', () => {
  for (const art of arts) {
    const ms = attackTiming(art);
    // Winding up: the wind-up pose, then the strike in its last moments.
    assert.equal(attackFrame(ms, 0.3, -1, false), 0, art);
    assert.equal(attackFrame(ms, (ms[0] - 10) / 1000, -1, false), 1, art);
    // The blow lands (since = 0) on the impact frame and it holds there.
    assert.equal(attackFrame(ms, 0, 0, true), 2, art);
    assert.equal(attackFrame(ms, 0, (ms[1] - 10) / 1000, true), 2, art);
    // Then the follow-through plays out and the attack ends.
    const rest = ms.slice(1).reduce((a, b) => a + b, 0) / 1000;
    assert.equal(attackFrame(ms, 0, rest - 0.005, true), ms.length, art);
    assert.equal(attackFrame(ms, 0, rest + 0.005, true), -1, art);
    // A touch attack with no wind-up flicks through the strike first.
    assert.equal(attackFrame(ms, 0, 0, false), 1, art);
    assert.equal(attackFrame(ms, 0, (ms[0] + 5) / 1000, false), 2, art);
  }
});

test('springs land in the same place at 30, 60 and 144 fps, and never blow up', () => {
  const run = (hz, secs) => {
    let [x, v] = [0, 0];
    for (let i = 0; i < Math.round(hz * secs); i++) [x, v] = springStep(x, v, 3, 140, 11, 1 / hz);
    return x;
  };
  for (const secs of [1 / 6, 1 / 3, 0.5]) {
    const a = run(30, secs);
    assert.ok(Math.abs(a - run(60, secs)) < 1e-6 && Math.abs(a - run(144, secs)) < 1e-6, `${secs}s`);
  }
  // A long hitch (a tenth of a second at a time) still settles on the target.
  let [x, v] = [5, 40];
  for (let i = 0; i < 30; i++) [x, v] = springStep(x, v, 0, 140, 11, 0.1);
  assert.ok(Math.abs(x) < 1e-3 && Math.abs(v) < 1e-2);
});

test('the walk bob bottoms out just after each foot lands and peaks at the pass', () => {
  assert.ok(walkBob(0.04) < 0.01 && walkBob(0.54) < 0.01);
  assert.ok(walkBob(0.29) > 0.99 && walkBob(0.79) > 0.99);
});

test('every monster walks and idles through clean in-between poses', async () => {
  const { ARTS } = await import('../src/render/mobs/index.js');
  const nums = (o, out = []) => {
    if (typeof o === 'number') out.push(o);
    else if (Array.isArray(o)) o.forEach((x) => nums(x, out));
    else if (o && typeof o === 'object') Object.values(o).forEach((x) => nums(x, out));
    return out;
  };
  for (const [art, a] of Object.entries(ARTS)) {
    for (const pose of ['walk', 'idle']) {
      const n = a[pose] ?? (pose === 'walk' ? 4 : 2);
      for (let f = 0; f < n; f += 0.25) {
        const { shapes } = a.draw(pose, f, 'idle');
        assert.ok(nums(shapes).every(Number.isFinite), `${art} ${pose} ${f}`);
      }
    }
  }
});

// The player's standing rule: the character never squashes, stretches or narrows. Moves may lift,
// lunge, lean and crouch it, but whatever a move asks for, it's drawn at its own width and height
// (a spin flips it cleanly), and jumping and landing show in the pose alone.
test('the character keeps its shape: no squash, stretch or narrowing in any move', async () => {
  const { MOVES, moveAt } = await import('../src/render/moves.js');
  const { rigid } = await import('../src/render/hero.js');
  const { createAnim, stepAnim } = await import('../src/render/animator.js');
  for (const kind of Object.keys(MOVES)) {
    for (let i = 0; i <= 40; i++) {
      const mv = rigid(moveAt(kind, i / 40, 0.6));
      assert.equal(Math.abs(mv.turn), 1, `${kind} at ${i / 40}: turned only as a flip`);
      assert.equal(mv.stretch, 1, `${kind} at ${i / 40}: no stretch`);
    }
  }
  // A jump and a hard landing leave the animator with no squash or stretch to apply.
  const a = createAnim();
  stepAnim(a, { vx: 0, vy: -500, onGround: false, rope: false, facing: 1, y: 0 }, 1 / 60);
  stepAnim(a, { vx: 0, vy: 600, onGround: false, rope: false, facing: 1, y: 0 }, 1 / 60);
  stepAnim(a, { vx: 0, vy: 0, onGround: true, rope: false, facing: 1, y: 0 }, 1 / 60);
  assert.ok(a.land > 0, 'the landing still shows (in the pose)');
  assert.equal(a.sqx, undefined);
  assert.equal(a.sqy, undefined);
});

// With the figure flipping cleanly instead of squeezing, a spinning blade must keep sweeping round
// the body as seen: never jumping across or running backwards when the body flips.
test('a spinning blade sweeps smoothly round through every flip', async () => {
  const { MOVES, moveAt } = await import('../src/render/moves.js');
  const { rigid } = await import('../src/render/hero.js');
  const seen = (kind, p, dur) => {
    const mv = rigid(moveAt(kind, p, dur));
    return { a: mv.turn * mv.weapon, orbit: mv.orbit };
  };
  for (const [kind, dur] of [['spin', 0.9], ['spin', 0.5], ['gyre', 0.55], ['eclipse', 1.6], ['spinback', 0.46], ['cleave', 0.62], ['axehurl', 0.62]]) {
    assert.ok(MOVES[kind]);
    let last = null;
    for (let i = 0; i <= 400; i++) {
      const now = seen(kind, i / 400, dur);
      if (last && now.orbit && last.orbit) {
        // The same direction on screen: the shortest way from the last angle to this one.
        const step = ((((now.a - last.a) % 360) + 540) % 360) - 180;
        assert.ok(Math.abs(step) < 45, `${kind} at ${(i / 400).toFixed(3)}: the blade jumps ${Math.round(step)} degrees`);
        assert.ok(step >= -1, `${kind} at ${(i / 400).toFixed(3)}: the blade runs backwards (${Math.round(step)})`);
      }
      last = now;
    }
  }
});

// Every skill icon sets its own tile (and the palette its shadows use) before drawing on it, so
// any of them can be the first one drawn: a fresh game whose first hotkey is Shoulder Charge
// once crashed here, drawing its helmet before its tile.
test('every skill icon draws on its own, even as the first one drawn', async () => {
  const { SKILL_ART } = await import(`../src/render/icons/skills.js?fresh=${Date.now()}`);
  assert.ok(SKILL_ART.shouldercharge().length > 0, 'Shoulder Charge first, on a fresh palette');
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../src/render/icons/skills.js', import.meta.url), 'utf8');
  for (const [, name, body] of src.matchAll(/^function (\w+)\(\) \{\n([\s\S]*?)^\}/gm)) {
    const tileAt = body.search(/\btile\(/);
    const usedAt = body.search(/\b(solid|drop|facet)\(/);
    if (tileAt < 0 || usedAt < 0) continue;
    assert.ok(tileAt < usedAt, `${name} sets its tile before drawing on it`);
  }
  for (const [id, draw] of Object.entries(SKILL_ART)) assert.ok(draw().length > 0, `${id} draws`);
});

// Each weapon swings its own way, but the blow lands at the same moment (the hit is timed by the
// game, not the drawing), and the body leans into a swing while the feet stay planted.
test('every weapon keeps its blow on time and leans into it', async () => {
  const { moveAt, FEEL } = await import('../src/render/moves.js');
  for (const weapon of Object.keys(FEEL)) {
    for (const hit of [0.3, 0.45, 0.6]) {
      const plain = moveAt('slash', hit, 0.4);
      const felt = moveAt('slash', hit, 0.4, { weapon, hit });
      assert.ok(Math.abs(plain.weapon - felt.weapon) < 1e-6 || FEEL[weapon].over || FEEL[weapon].twirl, `${weapon}: the blade is where it was when the blow lands`);
    }
  }
  // Mid-cut the body leans forward into the slash; on the wind-up it rocks back.
  assert.ok(moveAt('slash', 0.44, 0.4).tilt > 0.1, 'leans into the cut');
  assert.ok(moveAt('slash', 0.2, 0.4).tilt < 0, 'rocks back on the wind-up');
  // A finisher bounces up off the blow, then settles back down.
  const fin = (p) => moveAt('slash', p, 0.4, { hit: 0.4, fin: true }).lift;
  assert.ok(fin(0.52) > 2 && fin(0.99) < 0.5, 'a finisher bounces, then rests');
});

test('every expression has its own idle loop', async () => {
  const { FACE_STYLES, faceFrame } = await import('../src/render/hero.js');
  const loop = (face) => Array.from({ length: 48 }, (_, i) => JSON.stringify(faceFrame(face, i / 8)));
  const seen = new Map();
  for (const face of FACE_STYLES) {
    const frames = loop(face);
    assert.ok(new Set(frames).size >= 2, `${face} moves`);
    const key = frames.join('|');
    assert.ok(!seen.has(key), `${face} loops like ${seen.get(key)}`);
    seen.set(key, face);
  }
});

test('the Warrior line swings round a fist kept under the chin, and nothing comes to rest before the face', async () => {
  const { moveAt, FIST_CAP } = await import('../src/render/moves.js');
  const { PATH_VARIANTS } = await import('../src/world/melee.js');
  const commands = ['rising', 'airslash', 'airslash2', 'meteor', 'dashstab', 'plunge', 'dash', 'titanbreak', 'ascend', 'plaircut', 'pldive', 'consecrate', 'bash', 'dragrise', 'bkairchop', 'bkdive', 'bkgore', 'bodyslam', 'shieldrush', 'verdict', 'recklesscharge', 'rampage', 'eclipse'];
  const moves = new Set(commands);
  for (const job of ['warrior', 'paladin', 'berserker']) for (const step of PATH_VARIANTS[job]) for (const s of step) moves.add(s.move);
  for (const weapon of ['sword', 'axe', 'spear']) {
    for (const kind of moves) {
      for (let i = 0; i <= 40; i++) {
        const mv = moveAt(kind, i / 40, 0.6, { weapon });
        assert.ok(mv, kind);
        assert.ok(mv.arm <= FIST_CAP + 0.01 || mv.arm >= 200, `${kind} with a ${weapon} raises the fist to ${mv.arm.toFixed(0)} at ${i / 40}`);
      }
      // The last pose: never the blade standing straight up in front of the face.
      const end = moveAt(kind, 1, 0.6, { weapon });
      const w = ((((end.weapon % 360) + 540) % 360) - 180);
      assert.ok(!(w > -20 && w < 40) || end.orbit, `${kind} with a ${weapon} ends with the blade up before the face (${w.toFixed(0)})`);
    }
  }
});

test("the Paladin and the Berserker swing none of the Warrior's swings", async () => {
  const { PATH_VARIANTS } = await import('../src/world/melee.js');
  const own = (job) => new Set(PATH_VARIANTS[job].flat().map((s) => s.move));
  const warrior = own('warrior');
  for (const job of ['paladin', 'berserker']) for (const m of own(job)) assert.ok(!warrior.has(m), `${job} borrows ${m}`);
});
