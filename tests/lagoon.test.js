// Lantern Lagoon (data/maps.js lagoon): the voyage on the Sea Biscuit (world/voyage.js), big fish
// you reel in (world/fishing.js), the hourly Fishing Derby (world/derby.js), and Old Lumen at the
// end of Granny Kelp's story (world/lumen.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MAPS } from '../src/data/maps.js';
import { FISH_BY_ID, SPOTS } from '../src/data/fishing.js';
import { createCharacter } from '../src/core/character.js';
import { addItem } from '../src/core/inventory.js';
import { acceptQuest, objectivesMet } from '../src/core/quests.js';
import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { setSail, hasSailed } from '../src/world/voyage.js';
import { tickDerby, weighIn, standings, PRIZES } from '../src/world/derby.js';
import { bossFish } from '../src/world/lumen.js';
import { routeBetween } from '../src/world/routes.js';

const DT = 1 / 60;
const press = (k, held = []) => ({ held: new Set(held), pressed: new Set(k ? [k] : []) });
const step = (w, secs, k = null, held = []) => {
  for (let i = 0; i < secs * 60; i++) updateWorld(w, DT, press(i === 0 ? k : null, held));
};
const at = (h, m, s = 0) => () => new Date(2026, 10, 3, h, m, s);

test('Captain Bobbin sails you to the lagoon the long way, then straight there; no monsters anywhere', () => {
  const w = createWorld(createCharacter('Sailor', {}));
  loadMap(w, 'harbor', 'ferry');
  assert.ok(!hasSailed(w.char));
  assert.ok(setSail(w));
  assert.equal(w.map.id, 'voyage_out');
  step(w, MAPS.voyage_out.voyage.dur - 1);
  assert.equal(w.map.id, 'voyage_out', 'still at sea');
  step(w, 1.5);
  assert.equal(w.map.id, 'lagoon', 'docked at the cove');
  assert.ok(hasSailed(w.char));
  // Home again, straight there this time.
  setSail(w, { quick: true });
  assert.equal(w.map.id, 'harbor');
  for (const id of ['lagoon', 'voyage_out', 'voyage_home']) assert.equal(MAPS[id].spawns.length, 0, `${id} has no monsters`);
  // The guide knows the sea road.
  assert.ok(routeBetween('sprout', 'lagoon'), 'the lagoon is on the guide');
});

test('a big fish fights: hold to reel it in between its runs, or hold through a run and the line snaps', (t) => {
  let seed = 3;
  t.mock.method(Math, 'random', () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648));
  const hook = (w) => {
    step(w, 0.1, 'ArrowUp');
    w.fishing.fish = FISH_BY_ID.fish_dorado;
    for (let i = 0; i < 60 * 30 && w.fishing?.phase !== 'bite'; i++) updateWorld(w, DT, press());
    w.fishing.fish = FISH_BY_ID.fish_dorado;
    step(w, 0.02, 'KeyZ');
    assert.equal(w.fishing.phase, 'reel');
  };
  const char = createCharacter('Angler', {});
  addItem(char.inventory, 'fishing_rod', 1);
  const w = createWorld(char);
  loadMap(w, 'lagoon', 'pier');
  const spot = SPOTS.lagoon[0];
  Object.assign(w.body, { x: spot.x, y: spot.y, onGround: true });
  // Played well: reel while it rests, let go while it runs.
  hook(w);
  for (let i = 0; i < 60 * 40 && w.fishing?.phase === 'reel'; i++) {
    const r = w.fishing.reel;
    updateWorld(w, DT, press(null, r.run > 0 || r.tension > 0.7 ? [] : ['KeyZ']));
  }
  assert.ok(char.fishBook.fish_dorado?.n === 1, 'landed it');
  assert.ok(char.fishBook.fish_dorado.best >= 60, 'with its length on the Fish page');
  step(w, 2);
  // Played badly: holding on through everything snaps the line.
  hook(w);
  for (let i = 0; i < 60 * 40 && w.fishing?.phase === 'reel'; i++) updateWorld(w, DT, press(null, ['KeyZ']));
  assert.equal(w.fishing.phase, 'miss');
  assert.equal(char.fishBook.fish_dorado.n, 1, 'no second one');
});

test('the Fishing Derby: on the hour for five minutes, your best catch at the lagoon counts, prizes at the end', () => {
  const w = createWorld(createCharacter('Derby', {}));
  loadMap(w, 'lagoon', 'start');
  w.dayClock = at(14, 58);
  tickDerby(w);
  assert.equal(w.derby, undefined, 'nothing before the hour');
  w.dayClock = at(15, 1);
  tickDerby(w);
  assert.ok(w.derby && !w.derby.done, 'on at the top of the hour');
  weighIn(w, FISH_BY_ID.fish_goby, 8);
  weighIn(w, FISH_BY_ID.fish_marlin, 9000);
  assert.equal(w.derby.mine.size, 9000, 'your best counts');
  assert.equal(standings(w.derby, 290)[0].name, 'You');
  // The same field for everyone that hour.
  const other = createWorld(createCharacter('Other', {}));
  loadMap(other, 'lagoon', 'start');
  other.dayClock = at(15, 2);
  tickDerby(other);
  assert.deepEqual(other.derby.field.map((e) => e.name), w.derby.field.map((e) => e.name));
  const gold = w.char.gold;
  w.dayClock = at(15, 6);
  tickDerby(w);
  assert.ok(w.derby.done);
  assert.equal(w.char.gold, gold + PRIZES[0].gold, 'first prize');
  assert.equal(w.char.derbyWins, 1);
  // A catch away from the lagoon, or after the bell, doesn't count.
  const late = w.derby.mine;
  weighIn(w, FISH_BY_ID.fish_goby, 99999);
  assert.equal(w.derby.mine, late);
});

test("Granny Kelp's story ends with Old Lumen at the point: reeled in, counted, let go", () => {
  const char = createCharacter('Kelp', {});
  for (const id of ['kelp_1', 'kelp_2', 'kelp_3', 'kelp_4']) char.quests[id] = { state: 'done' };
  const w = createWorld(char);
  loadMap(w, 'lagoon', 'start');
  const deep = SPOTS.lagoon.find((s) => s.deep);
  assert.equal(bossFish(w, deep), null, 'not before the quest');
  assert.ok(acceptQuest(char, 'kelp_5'));
  assert.equal(bossFish(w, deep)?.id, 'fish_lumen', 'he bites at the deep water');
  assert.equal(bossFish(w, SPOTS.lagoon[0]), null, 'only there');
  // Hooked and landed (the boss reel), he counts for the quest and isn't kept.
  addItem(char.inventory, 'fishing_rod', 1);
  char.life = { fishing: { level: 30, exp: 0 } };
  Object.assign(w.body, { x: deep.x, y: deep.y, onGround: true });
  step(w, 0.1, 'ArrowUp');
  for (let i = 0; i < 60 * 30 && w.fishing?.phase !== 'bite'; i++) updateWorld(w, DT, press());
  assert.equal(w.fishing.fish.id, 'fish_lumen');
  step(w, 0.02, 'KeyZ');
  w.fishing.reel.got = 0.999;
  w.fishing.reel.run = 0;
  w.fishing.reel.next = 9;
  step(w, 0.1, null, ['KeyZ']);
  assert.ok(objectivesMet(char, 'kelp_5'));
  assert.ok(![...char.inventory.etc, ...char.inventory.mats].some((e) => e.id === 'fish_lumen'), 'let go');
  assert.equal(bossFish(w, deep), null, 'once');
});

test('the boardwalk is fishable end to end, off whichever side you face, but not at the stove', async () => {
  const { spotHere } = await import('../src/world/fishing.js');
  const w = createWorld(createCharacter('Edge', {}));
  loadMap(w, 'lagoon', 'start');
  const put = (x, facing) => Object.assign(w.body, { x, y: 620, onGround: true, facing });
  for (const x of [700, 1000, 1300, 1800]) {
    put(x, 1);
    const s = spotHere(w);
    assert.ok(s, `fish at ${x}`);
    assert.ok(s.bx > x, 'the line goes out in front');
    put(x, -1);
    assert.ok(spotHere(w).bx < x, 'and the other way when you turn');
  }
  put(MAPS.lagoon.stove, 1);
  assert.equal(spotHere(w), null, 'the stove is for cooking');
});

test("Granny Kelp says which Fishing level each of her steps needs", async () => {
  const { QUESTS } = await import('../src/data/quests.js');
  const { TIER_LV } = await import('../src/data/gathering.js');
  // The Fishing level a fish of the lagoon needs: the easiest of its spots there (Old Lumen bites
  // only at the point's deep water).
  const need = (fish) => {
    const tiers = SPOTS.lagoon.filter((s) => (fish === 'fish_lumen' ? s.deep : s.pool[fish])).map((s) => s.tier);
    return TIER_LV[Math.min(...tiers)];
  };
  let asked = 0;
  for (const id of ['kelp_1', 'kelp_2', 'kelp_3', 'kelp_4', 'kelp_5']) {
    const q = QUESTS[id];
    for (const o of q.objectives) {
      const fish = o.type === 'catch' ? o.fish : o.type === 'collect' && FISH_BY_ID[o.item] ? o.item : null;
      if (!fish) continue;
      const lv = need(fish);
      if (lv <= 1) continue;
      asked++;
      assert.ok(q.text.includes(`Fishing ${lv}`), `${id} says it wants Fishing ${lv} for ${fish}`);
      if (o.place) assert.ok(o.place.includes(`Fishing ${lv}`), `${id}'s hint in the quest log says so too`);
    }
  }
  assert.equal(asked, 3, 'the anglers, the tuna and Old Lumen');
});
