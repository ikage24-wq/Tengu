// Speed: the game draws real frames on a stand-in screen (support/fake-screen.js) and counts what
// it has to paint afresh once it's warmed up (tools/perf-check.mjs does every map, job and window).
// Scenery, props and rooms are painted once and reused; people come round to frames already
// painted. Something painted again and again instead of once is what makes the game lag, so these
// fail as soon as anything new starts doing that.
import test from 'node:test';
import assert from 'node:assert/strict';

const { checkMaps, checkSkills, checkWindows, LIMITS } = await import('../tools/perf-check.mjs');
const { installFakeScreen, fakeCanvas } = await import('./support/fake-screen.js');
installFakeScreen();
const { balanceChar } = await import('../tools/balance.mjs');
const { createWorld, updateWorld, loadMap } = await import('../src/world/world.js');
const { createCamera, updateCamera, drawWorld } = await import('../src/render/scene.js');
const { setHd, nextFrame, paintStats, resetPaintStats } = await import('../src/render/pixel.js');

const show = (rows) => rows.filter((r) => r.bad).map((r) => `${r.name}: ${r.error ?? `characters ${r.characters}/s, other ${r.other}/s (${r.top}) ${r.example}`}`).join('\n');

test('towns, fields, dungeons and rooms: scenery is painted once, people come round again', () => {
  // (A town, the busiest fishing town, a field, a dungeon, a boss fight, an inn, a home.)
  const rows = checkMaps(['sprout', 'lagoon', 'woods', 'cave', 'bossroom', 'coin_inn', 'swh_poppy'], 600, 180);
  assert.equal(show(rows), '');
  for (const r of rows) assert.ok(r.other <= LIMITS.other, `${r.name}: scenery painted ${r.other}/s`);
});

test("every job's skills and effects don't repaint the scene", () => {
  const rows = checkSkills(undefined, 240, 240);
  assert.ok(rows.length >= 10);
  assert.equal(show(rows), '');
});

test('windows (the bag, the shop and the rest) are painted once, previews loop', () => {
  assert.equal(show(checkWindows(60, 180)), '');
});

test('walking alone: once warmed up, your own walk is drawn from frames already painted', () => {
  const ctx = fakeCanvas().getContext('2d');
  const w = createWorld(balanceChar('archer', 40));
  w.log = () => {};
  w.god = true;
  loadMap(w, 'woods', 'west');
  const cam = createCamera();
  let time = 0;
  for (let f = 0; f < 1500; f++) {
    if (f === 1200) resetPaintStats();
    // Walking steadily one way (turning is allowed a few new frames of its own).
    updateWorld(w, 1 / 60, { held: new Set(['ArrowRight']), pressed: new Set(), locked: false });
    if (w.body.x > w.map.width - 200) w.body.x = 200;
    updateCamera(cam, w, 1 / 60);
    nextFrame();
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    setHd(true, 2);
    drawWorld(ctx, w, cam, time);
    time += 1 / 60;
  }
  const hero = paintStats.kinds.hero?.n ?? 0;
  // (It used to be a new picture every frame: 300 in these 5 seconds.)
  assert.ok(hero <= 40, `your walk painted ${hero} new pictures in 5 s of walking`);
});
