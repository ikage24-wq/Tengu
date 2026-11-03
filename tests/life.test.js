// Life-skill levels in play (core/life.js): the EXP curve, level ups, the spots a level opens, what
// levels and tools do, the character EXP of the alternate path (and its balance against hunting),
// and saves.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MAPS } from '../src/data/maps.js';
import { MOBS } from '../src/data/mobs.js';
import { ITEMS } from '../src/data/items.js';
import { NODES, KINDS } from '../src/data/gathering.js';
import { SPOTS, BITE_WAIT, FISH_BY_ID } from '../src/data/fishing.js';
import { DISHES } from '../src/data/cooking.js';
import { createCharacter } from '../src/core/character.js';
import { addItem, countItem } from '../src/core/inventory.js';
import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { startGathering, tickGathering } from '../src/world/gathering.js';
import { startFishing } from '../src/world/fishing.js';
import { cook, dishTier } from '../src/ui/cooking.js';
import { saveGame, loadGame } from '../src/core/save.js';
import {
  LIFE_SKILLS, LIFE_MAX, TIER_LEVEL, KILL_SECS, lifeLevel, lifeExp, lifeExpToNext, addLifeExp, charExpFor, lifeExpFor, tierOf,
  perksAt, lifePerks, toolFor, needFor, lifeAction, withExtra,
} from '../src/core/life.js';

const DT = 1 / 60;
const idle = { held: new Set(), pressed: new Set() };

function meadowWorld(name = 'Picker') {
  const w = createWorld(createCharacter(name, {}));
  loadMap(w, 'meadow1', 'west');
  w.mobs = [];
  w.spawner.slots = [];
  w.log = () => {};
  return w;
}
const standAt = (w, n) => Object.assign(w.body, { x: n.x, y: n.y, onGround: true, vx: 0, vy: 0 });
const setLevel = (char, skill, level) => ((char.life ??= {})[skill] = { level, exp: 0 });

test('the life EXP curve climbs smoothly to the cap, and a skill takes hours, not days', () => {
  let total = 0;
  for (let lv = 1; lv < LIFE_MAX; lv++) {
    assert.ok(lifeExpToNext(lv) > 0 && Number.isFinite(lifeExpToNext(lv)));
    if (lv > 1) assert.ok(lifeExpToNext(lv) > lifeExpToNext(lv - 1), `Lv ${lv} needs more than Lv ${lv - 1}`);
    // A skill trained at its own tier's spots, a gathering action at a time.
    total += lifeExpToNext(lv) / lifeExpFor(tierOf(lv), 'gather', lv);
  }
  assert.equal(lifeExpToNext(LIFE_MAX), Infinity);
  const hours = (total * 9) / 3600;
  assert.ok(hours > 2 && hours < 12, `about ${hours.toFixed(1)} hours from 1 to ${LIFE_MAX}`);
  // A tier's own spots pay more than the ones below it.
  assert.ok(lifeExpFor(2, 'gather', 15) > lifeExpFor(1, 'gather', 15));
  assert.ok(lifeExpFor(1, 'gather', 30) < lifeExpFor(1, 'gather', 5), 'old spots pay less once you have moved on');
});

test('addLifeExp levels a skill up, says so, and stops at the cap', () => {
  const w = meadowWorld();
  const logs = [];
  w.log = (s) => logs.push(s);
  assert.equal(lifeLevel(w.char, 'mining'), 1);
  const gained = addLifeExp(w, 'mining', lifeExpToNext(1) + lifeExpToNext(2) + 5);
  assert.equal(gained, 2);
  assert.equal(lifeLevel(w.char, 'mining'), 3);
  assert.equal(lifeExp(w.char, 'mining'), 5);
  assert.ok(w.events.some((e) => e.type === 'lifelevel' && e.skill === 'mining' && e.level === 3));
  assert.ok(w.fx.some((f) => f.kind === 'lifelevel' && f.skill === 'mining'), 'a burst on the hero');
  assert.ok(logs.some((l) => /Mining is now Lv 3/.test(l)));
  // Reaching a tier's level says what it opened.
  setLevel(w.char, 'mining', TIER_LEVEL[2] - 1);
  addLifeExp(w, 'mining', lifeExpToNext(TIER_LEVEL[2] - 1));
  assert.ok(logs.some((l) => /Tier 2/.test(l)));
  addLifeExp(w, 'mining', 1e9);
  assert.equal(lifeLevel(w.char, 'mining'), LIFE_MAX);
  assert.equal(lifeExp(w.char, 'mining'), 0);
  // Other skills untouched; every skill starts at 1.
  for (const s of LIFE_SKILLS.filter((s) => s !== 'mining')) assert.equal(lifeLevel(w.char, s), 1);
});

test("a spot from a richer region needs the skill's level first, and says so kindly", () => {
  const w = meadowWorld();
  const n = NODES.meadow1.find((x) => x.kind === 'ore');
  const was = { tier: n.tier, lv: n.lv };
  try {
    n.tier = 2;
    delete n.lv;
    assert.equal(needFor(n), TIER_LEVEL[2]);
    standAt(w, n);
    const why = startGathering(w);
    assert.match(why, /Mining Lv 12/);
    assert.match(why, /Lv 1\b/);
    assert.ok(!w.gathering, 'no gathering');
    setLevel(w.char, 'mining', 12);
    assert.equal(startGathering(w), null);
    assert.equal(w.gathering.skill, 'mining');
    // A spot's own `lv` wins over its tier.
    w.gathering = null;
    n.lv = 15;
    assert.match(startGathering(w), /Mining Lv 15/);
  } finally {
    Object.assign(n, was);
    if (was.tier == null) delete n.tier;
    if (was.lv == null) delete n.lv;
  }
  // Fishing spots too.
  const spot = SPOTS.meadow1[0];
  const fw = meadowWorld();
  addItem(fw.char.inventory, 'fishing_rod', 1);
  standAt(fw, spot);
  spot.tier = 3;
  try {
    assert.match(startFishing(fw), /Fishing Lv 24/);
    setLevel(fw.char, 'fishing', 24);
    assert.equal(startFishing(fw), null);
  } finally {
    delete spot.tier;
  }
});

test('gathering and mining give life EXP and character EXP, shown over the hero', () => {
  const w = meadowWorld();
  const n = NODES.meadow1.find((x) => x.kind === 'ore');
  standAt(w, n);
  const exp0 = w.char.exp;
  assert.equal(startGathering(w), null);
  for (let i = 0; i < 200 && w.gathering; i++) tickGathering(w, DT, new Set(), new Set(), () => 0.5);
  assert.ok(lifeExp(w.char, 'mining') > 0, 'Mining EXP');
  assert.equal(lifeExp(w.char, 'gathering'), 0, 'ore trains Mining, not Gathering');
  assert.ok(w.char.exp > exp0, 'character EXP');
  assert.ok(w.numbers.some((x) => /^\+\d+ EXP$/.test(x.text)));
  assert.ok(w.numbers.some((x) => /Mining/.test(x.text)));
  // A herb trains Gathering.
  const h = NODES.meadow1.find((x) => x.kind === 'herb' && !x.night);
  standAt(w, h);
  assert.equal(startGathering(w), null);
  for (let i = 0; i < 200 && w.gathering; i++) tickGathering(w, DT, new Set(), new Set(), () => 0.5);
  assert.ok(lifeExp(w.char, 'gathering') > 0);
});

test('character level ups from life EXP are celebrated like a hunt', () => {
  const w = meadowWorld();
  w.char.exp = 0;
  const lv = w.char.level;
  const logs = [];
  w.log = (s) => logs.push(s);
  addLifeExp(w, 'fishing', 1, { charExp: 10000 });
  assert.ok(w.char.level > lv);
  assert.ok(w.events.some((e) => e.type === 'levelup'));
  assert.ok(w.fx.some((f) => f.kind === 'levelup'));
  assert.ok(logs.some((l) => /Level up!/.test(l)));
  // The world picks it up (stats refresh) on the next tick.
  updateWorld(w, DT, idle);
  assert.equal(w.char.hp, w.stats.maxHp);
});

test('levels make the work quicker, the finds more and rarer, and the rest shorter', () => {
  const p1 = perksAt(1);
  const p30 = perksAt(30);
  const p50 = perksAt(50);
  assert.equal(p1.time, 1);
  assert.equal(p1.extra, 0);
  assert.equal(p1.rare, 1);
  assert.equal(p1.rest, 1);
  for (const [a, b] of [[p1, p30], [p30, p50]]) {
    assert.ok(b.time < a.time && b.extra > a.extra && b.rare > a.rare && b.rest < a.rest && b.react > a.react);
  }
  assert.ok(p50.time > 0.55 && p50.rest >= 0.5, 'never silly-fast');
  // In play: a Lv 30 miner swings quicker and the vein rests less.
  const w = meadowWorld();
  const i = NODES.meadow1.findIndex((x) => x.kind === 'ore');
  const n = NODES.meadow1[i];
  setLevel(w.char, 'mining', 30);
  standAt(w, n);
  startGathering(w);
  assert.ok(Math.abs(w.gathering.secs - KINDS.ore.secs * p30.time) < 1e-9);
  assert.equal(w.pose.dur, w.gathering.secs, 'the motion fits the quicker work');
  for (let k = 0; k < 200 && w.gathering; k++) tickGathering(w, DT, new Set(), new Set(), () => 0.99);
  const rest = w.nodeRest[`meadow1:${i}`] - w.now;
  assert.ok(Math.abs(rest - KINDS.ore.rest * p30.rest) < 0.01);
  // More finds: on average, a share `extra` of one more.
  let sum = 0;
  let seed = 7;
  const rng = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let z = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
  for (let k = 0; k < 4000; k++) sum += withExtra(1, p30, rng);
  assert.ok(Math.abs(sum / 4000 - (1 + p30.extra)) < 0.03);
});

test('a tool adds its speed, yield and rare chance to its own skill only', () => {
  const char = createCharacter('Tinker', {});
  ITEMS.__test_pick = { id: '__test_pick', name: 'Test Pick', type: 'etc', life: { skill: 'mining', speed: 0.2, yield: 0.15, rare: 0.3 } };
  try {
    assert.equal(toolFor(char, 'mining'), null, 'no tools to start');
    char.lifeTools = { mining: '__test_pick', gathering: '__test_pick', fishing: 'no_such_item' };
    assert.equal(toolFor(char, 'mining'), ITEMS.__test_pick);
    assert.equal(toolFor(char, 'gathering'), null, "a pick isn't a sickle");
    assert.equal(toolFor(char, 'fishing'), null, 'an unknown item is ignored');
    const p = lifePerks(char, 'mining');
    assert.ok(Math.abs(p.time - 1 / 1.2) < 1e-9);
    assert.ok(Math.abs(p.extra - 0.15) < 1e-9);
    assert.ok(Math.abs(p.rare - 1.3) < 1e-9);
    // Held as an instance works too.
    char.lifeTools.mining = { id: '__test_pick', uid: 1 };
    assert.equal(toolFor(char, 'mining'), ITEMS.__test_pick);
  } finally {
    delete ITEMS.__test_pick;
  }
});

test('cooking with the world gives Cooking EXP, and a skilled cook sometimes serves one more', () => {
  const w = meadowWorld();
  const d = DISHES.find((x) => x.id === 'dish_skewer');
  addItem(w.char.inventory, 'fish_sardine', 4);
  addItem(w.char.inventory, 'shell', 2);
  assert.equal(cook(w.char, d, w, () => 0.99), 2);
  assert.ok(lifeExp(w.char, 'cooking') > 0);
  setLevel(w.char, 'cooking', 50);
  assert.equal(cook(w.char, d, w, () => 0), 3, 'one extra serving');
  assert.equal(countItem(w.char.inventory, 'dish_skewer'), 5);
  for (const dd of DISHES) assert.ok(dishTier(dd) >= 1 && dishTier(dd) <= 4);
  // A dish of a richer region needs the level.
  const rich = { ...d, id: 'dish_skewer', tier: 3 };
  const c2 = createCharacter('Cook', {});
  addItem(c2.inventory, 'fish_sardine', 2);
  addItem(c2.inventory, 'shell', 1);
  assert.equal(cook(c2, rich), 0);
});

test('life levels save and load; a save from before life skills starts every skill at 1', () => {
  const store = new Map();
  const had = globalThis.localStorage;
  globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) };
  try {
    const char = createCharacter('Saver', {});
    char.slot = 3;
    setLevel(char, 'fishing', 17);
    char.life.fishing.exp = 42;
    char.lifeTools = { fishing: 'fishing_rod' };
    assert.ok(saveGame(char));
    const back = loadGame(3);
    assert.equal(lifeLevel(back, 'fishing'), 17);
    assert.equal(lifeExp(back, 'fishing'), 42);
    assert.deepEqual(back.lifeTools, { fishing: 'fishing_rod' });
    // An old save: no `life` at all.
    const old = JSON.parse(store.get('twzt-save-v1-3'));
    delete old.life;
    delete old.lifeTools;
    store.set('twzt-save-v1-3', JSON.stringify(old));
    const oldBack = loadGame(3);
    for (const s of LIFE_SKILLS) assert.equal(lifeLevel(oldBack, s), 1);
    assert.deepEqual(oldBack.life, {});
  } finally {
    globalThis.localStorage = had;
  }
});

// ---------- Balance: an hour of life skills vs an hour of hunting, per region tier ----------
// The hunter downs a monster every KILL_SECS (the same pace charExpFor assumes). The life player
// works their tier's spots at that tier's middle skill level, walking WALK seconds between spots;
// a fisher casts, waits (the real bite wait, quicker with level), hooks most bites and recasts.
const TIER_MAPS = { 1: ['meadow1', 'meadow2', 'trainfield', 'canyon'], 2: ['woods', 'glade', 'ruins'], 3: ['shrine', 'ridge', 'cave', 'springs'], 4: ['peak', 'sky', 'starfall'] };
const WALK = 7;
const HOOK_RATE = 0.85;

function hourOf(tier, skill, charLevel) {
  const lv = TIER_LEVEL[tier] + 6;
  const p = perksAt(lv);
  const w = { char: createCharacter('Sim', {}), events: [], log: () => {} };
  w.char.level = charLevel;
  if (skill === 'fishing') {
    const pool = Object.keys(SPOTS.glade[0].pool).map((id) => FISH_BY_ID[id]);
    const rarity = pool.reduce((n, f) => n + f.rarity, 0) / pool.length;
    const secs = (0.5 + ((BITE_WAIT[0] + BITE_WAIT[1]) / 2 + (rarity - 1) * 1.2) * p.time + 0.4 + 1.4 + 0.3) / HOOK_RATE;
    return (3600 / secs) * charExpFor(tier, 'fish', charLevel) * (1 + (rarity - 1) * 0.25);
  }
  if (skill === 'cooking') {
    // Gather three ingredients, then cook them.
    const secs = 3 * (KINDS.herb.secs * p.time + WALK) + 2;
    return (3600 / secs) * (3 * charExpFor(tier, 'gather', charLevel) + charExpFor(tier, 'cook', charLevel));
  }
  const kind = skill === 'mining' ? KINDS.ore : KINDS.herb;
  return (3600 / (kind.secs * p.time + WALK)) * charExpFor(tier, skill === 'mining' ? 'mine' : 'gather', charLevel);
}

test('an hour of life skills levels a character about as fast as an hour of hunting there', () => {
  const report = [];
  for (const [tier, maps] of Object.entries(TIER_MAPS)) {
    // Each monster on the tier's maps, hunted by a hero of its level, against life actions there by
    // a hero of that level.
    const spawns = maps.flatMap((id) => MAPS[id].spawns.filter((s) => !MOBS[s.mob].boss)).map((s) => MOBS[s.mob]);
    assert.ok(spawns.length > 10, `tier ${tier} has monsters`);
    const hunt = spawns.reduce((n, m) => n + (3600 / KILL_SECS) * m.exp, 0) / spawns.length;
    for (const skill of ['gathering', 'mining', 'fishing', 'cooking']) {
      const life = spawns.reduce((n, m) => n + hourOf(Number(tier), skill, m.level), 0) / spawns.length;
      const ratio = life / hunt;
      report.push(`T${tier} ${skill} ${ratio.toFixed(2)}`);
      if (!process.env.LIFE_REPORT) assert.ok(ratio >= 0.6 && ratio <= 1.2, `tier ${tier} ${skill}: ${Math.round(life)} vs hunting ${Math.round(hunt)} an hour (${ratio.toFixed(2)}x)`);
    }
  }
  if (process.env.LIFE_REPORT) console.log(report.join('\n'));
});

test('life actions done by the world pay the same as the model', () => {
  const w = meadowWorld();
  w.char.level = 10;
  const got = lifeAction(w, 'gathering', { tier: 1, kind: 'gather' });
  assert.equal(got.char, charExpFor(1, 'gather', 10));
  assert.equal(got.life, lifeExpFor(1, 'gather', 1));
  // A higher character than the tier earns only the tier's top, so the next region pays better.
  assert.equal(charExpFor(1, 'gather', 45), charExpFor(1, 'gather', 12));
  assert.ok(charExpFor(2, 'gather', 45) > charExpFor(1, 'gather', 45));
});
