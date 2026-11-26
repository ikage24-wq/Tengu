// Monsters walk at their own pace (2026-11-25, after the Tanuki Picker sprinted everywhere: his short
// legs could only walk 17 px a second, he roamed at 54, so his gait ran flat out, high kicks and all;
// and drawn bigger than his rig, his planted feet slid). Checked for every monster on the blank
// bases' gait, drawn on a stand-in screen:
//   - at its own roaming speed it walks (it may run only faster, chasing);
//   - its steps come no quicker than about three a second each foot (no blur of legs);
//   - a rig drawn scaled up or down tells its gait so (`a.gaitScale`), so its feet keep still;
//   - marks over a rig's head (emotes, dizzy stars, z's) go by its drawn body, not its roomy box.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const { installFakeScreen, fakeCanvas } = await import('./support/fake-screen.js');
installFakeScreen();
const { ARTS } = await import('../src/render/mobs/index.js');
const { MOBS } = await import('../src/data/mobs.js');

// Walks a monster for two seconds at `speed` and returns what its gait did (null: not on the gait).
function walk(def, speed) {
  const rig = ARTS[def.art]?.rig;
  if (!rig) return null;
  const ctx = fakeCanvas(300, 300).getContext('2d');
  const m = { def, hp: def.hp, uid: 1, x: 0, y: 0, dir: 1, state: 'walk', attackAt: -99, gloatAt: -99, aggroUntil: 0, odo: 0, flash: 0, phase: 0 };
  const a = { t: 0, now: 0, dt: 1 / 20, mood: 'calm', moving: true, mo: {}, hurtAgo: 9, flip: false, flash: 0, alpha: 1 };
  for (let i = 0; i < 40; i++) {
    m.odo += speed / 20;
    a.t = a.now = i / 20;
    ctx.setTransform?.(1, 0, 0, 1, 150, 250);
    rig.draw(ctx, m, a);
    if (i === 0 && !a.gait) return null;
  }
  return a.gait;
}

const ON_GAIT = Object.values(MOBS)
  .filter((d) => d.speed > 0)
  .map((d) => [d, walk(d, d.speed)])
  .filter(([, g]) => g);

test('the gait check finds the monsters on the blank bases', () => {
  assert.ok(ON_GAIT.length >= 10, `only ${ON_GAIT.length} found`);
  assert.ok(ON_GAIT.some(([d]) => d.id === 'tanukipicker'));
});

test('at its own roaming speed a monster walks, never runs', () => {
  const bad = ON_GAIT.filter(([, g]) => g.run > 0.05).map(([d, g]) => `${d.id} (runs ${g.run.toFixed(2)} at ${d.speed})`);
  assert.deepEqual(bad, []);
});

test('no blur of legs: at most about three steps a second each foot', () => {
  const bad = ON_GAIT.filter(([, g]) => g.cadence > 3.2).map(([d, g]) => `${d.id} (${g.cadence.toFixed(2)} a second)`);
  assert.deepEqual(bad, []);
});

// Every rig drawn through a scale (ctx.scale(BIG, BIG) around its draw) passes the scale on.
function files(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.js') ? [p] : [];
  });
}
test('a rig drawn scaled tells its gait, so its planted feet never slide', () => {
  const bad = [];
  for (const f of files('src/render')) {
    const s = readFileSync(f, 'utf8');
    const re = /ctx\.scale\((\w+), \1\);\n((?:[^\n]*\n){0,3}?)\s*draw0\(ctx, m, a\)/g;
    for (const [, k, between] of s.matchAll(re)) if (!between.includes(`a.gaitScale = ${k}`)) bad.push(f);
  }
  assert.deepEqual(bad, []);
});

test('marks over a rig’s head go by its drawn body, not its box', () => {
  const s = readFileSync('src/render/monsters.js', 'utf8');
  assert.ok(s.includes('function rigTop('));
  assert.ok(!/y - s\.h \* sy/.test(s), 'a head mark still placed at the top of the box');
  assert.ok(!/\(s\.h \* sy\)/.test(s), 'a mark still sized or placed by the box');
});
