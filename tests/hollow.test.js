// Rootwood Hollow's rooms and bosses (world/hollow.js) and the end of a run (grade, Hard, the daily
// bonus, the Rootwood set).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { createBots, makeBotCharacter, recruitBot } from '../src/world/bots.js';
import { joinParty } from '../src/world/party.js';
import { startRun, gradeOf, noteHit, HARD } from '../src/world/dungeon.js';
import { MOBS } from '../src/data/mobs.js';

const DT = 1 / 60;
const idle = { held: new Set(), pressed: new Set(), locked: false };
function seeded(n) {
  return () => {
    n = (n * 1664525 + 1013904223) % 4294967296;
    return n / 4294967296;
  };
}
function run(opts = {}) {
  const rng = seeded(5);
  const char = makeBotCharacter(rng, { name: 'Tester', pro: false, level: 12, jobs: ['tidemage'] });
  char.mapId = 'hollow_gate';
  const w = createWorld(char);
  w.bots = createBots(w, rng, { clock: () => new Date(2026, 9, 28, 20, 0) });
  w.god = true;
  // (Hard mode is party-only: data/coop.js.)
  if (opts.hard) joinParty(w.bots, recruitBot(w.bots, w, { level: 12, jobs: ['warrior'] }), w);
  assert.equal(startRun(w, 'hollow', opts), null);
  return w;
}
const step = (w, secs) => {
  for (let i = 0; i < secs * 60; i++) {
    updateWorld(w, DT, idle);
    if (w.scene) w.scene = null;
  }
};

test('Tuskar charging into a stone pillar is dazed, and the pillar comes down', () => {
  const w = run();
  loadMap(w, 'hollow4', 'west');
  const room = w.dungeon.room;
  assert.equal(room.pillars.length, 2);
  const tuskar = w.mobs.find((m) => m.def.id === 'tuskar');
  tuskar.engaged = true;
  tuskar.threat = { you: 10 };
  tuskar.x = 700;
  tuskar.charging = { dir: -1, hit: new Set() };
  step(w, 1);
  assert.equal(room.pillars[0].up, false, 'the pillar at 420 fell');
  assert.ok(tuskar.frozenUntil > w.now, 'dazed');
});

test('the sap floods the Root Gate floor now and then, and only the floor', () => {
  const w = run();
  loadMap(w, 'hollow5', 'west');
  const f = w.dungeon.room.flood;
  f.t = 0.01;
  step(w, 0.1);
  assert.equal(f.state, 'rising');
  step(w, w.map.flood.warn + 0.2);
  assert.equal(f.state, 'flooded');
  w.god = false;
  const hp = w.char.hp;
  step(w, 1.2);
  assert.ok(w.char.hp < hp, 'the sap stings on the floor');
  // On a ledge it can't reach you.
  Object.assign(w.body, { x: 500, y: 300, onGround: true, vy: 0 });
  const up = w.char.hp;
  step(w, 1.1);
  assert.ok(w.char.hp >= up - 1);
});

test('Gnarlroot says a word with every move, hugs from 60%, and at a third holds on until the tendrils are cut', () => {
  const w = run();
  loadMap(w, 'hollow6', 'west');
  const g = w.mobs.find((m) => m.def.id === 'gnarlroot');
  g.engaged = true;
  g.threat = { you: 10 };
  // Each move comes with the next word of his sentence, crawling out over its wind-up.
  let said = null;
  for (let k = 0; k < 120 && !said; k++) {
    step(w, 0.1);
    said = g.saying;
  }
  assert.ok(said && said.word === 'long' && said.dur >= 2, 'his first word, slowly');
  assert.ok(w.dungeon.zones.some((z) => !z.hit), 'and its move is warned on the floor');
  // From 60% the hug: the floor all round but one gap.
  g.hp = g.def.hp * 0.55;
  step(w, 0.1);
  assert.ok(g.mech.hugs);
  // Blows can't take him below a third...
  g.hp = g.def.hp * 0.31;
  const dealt = noteHit(w, g, { damage: 99999, party: null });
  assert.ok(g.hp - dealt >= g.def.hp * 0.3 - 1, 'no lower than a third');
  g.hp -= dealt;
  step(w, 0.1);
  // ...where he holds on to Elder Yomogi, and the Root Tendrils come up round him.
  assert.ok(g.mech.untangle && g.swaying);
  const tendrils = w.dungeon.room.adds.filter((a) => a.def.id === 'sapling');
  assert.equal(tendrils.length, 4);
  // Cut them all and he lets go: calmed, not beaten.
  for (const t of tendrils) t.hp = 0;
  step(w, 0.1);
  assert.ok(g.yomogiFree);
  assert.ok(g.hp <= 0, 'the fight is over');
});

test('the Myconid Queen puts the lights out at 70%, and every freed Sprout cheers the group on', () => {
  const w = run();
  loadMap(w, 'hollow2', 'west');
  const q = w.mobs.find((m) => m.def.id === 'mothercapper');
  q.engaged = true;
  q.threat = { you: 10 };
  q.hp = q.def.hp * 0.65;
  step(w, 0.1);
  assert.ok(w.dungeon.room.darkUntil > w.now, 'lights out');
  const plain = noteHit(w, q, { damage: 100, party: null });
  w.dungeon.cheer = 4;
  const cheered = noteHit(w, q, { damage: 100, party: null });
  assert.equal(cheered, Math.round(plain * 1.16));
});

test('Hard mode toughens the Hollow, and a run is graded', () => {
  const w = run({ hard: true });
  const imp = w.mobs.find((m) => m.def.id === 'rootling');
  assert.equal(imp.def.hp, Math.round(MOBS.rootling.hp * HARD.hp));
  assert.equal(gradeOf(9 * 60, 0, 1), 'S');
  assert.equal(gradeOf(14 * 60, 0, 5), 'A');
  assert.equal(gradeOf(20 * 60, 1, 5), 'B');
  assert.equal(gradeOf(20 * 60, 3, 9), 'C');
});
