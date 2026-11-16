// Melee combos: basic attacks chain through a weapon's steps into a finisher, blows land as the
// blade cuts (not when the key is pressed), launchers pop monsters up, the warrior's combo skills
// carry on step by step, and once a blow lands you can move or cut in with a skill.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createWorld, updateWorld, loadMap, hurtPlayer } from '../src/world/world.js';
import { createCharacter, gainExp, advanceJob } from '../src/core/character.js';
import { makeEquip } from '../src/core/items.js';
import { spawnMob } from '../src/world/mobs.js';
import { COMBOS, PATH_COMBOS, PATH_VARIANTS, planCombo, MAX_STOP } from '../src/world/melee.js';
import { MOVES, moveAt } from '../src/render/moves.js';
import { cast } from '../src/world/combat.js';
import { addItem } from '../src/core/inventory.js';

const DT = 1 / 60;
const idle = { held: new Set(), pressed: new Set(), locked: false };

// A level 25 warrior in Mossy Woods with a row of very sturdy boars in front.
function arena(weapon = 'sword_20') {
  const c = createCharacter('W', {});
  gainExp(c, 4e6);
  advanceJob(c, 'warrior');
  c.equipment.weapon = makeEquip(weapon, {});
  const w = createWorld(c);
  loadMap(w, 'woods', 'west');
  w.god = true;
  w.spawner.slots = [];
  w.mobs = [];
  for (const x of [330, 350, 370]) {
    const m = spawnMob(w.map, { mob: 'boarlet', x, y: w.map.groundY });
    m.def = { ...m.def, hp: 1e9, eva: 0, aggro: false, speed: 0 };
    m.hp = 1e9;
    w.mobs.push(m);
  }
  Object.assign(w.body, { x: 300, y: w.map.groundY, facing: 1, onGround: true });
  for (let i = 0; i < 10; i++) updateWorld(w, DT, idle);
  return w;
}

const run = (w, seconds, input = idle) => {
  for (let i = 0; i < seconds * 60; i++) updateWorld(w, DT, input);
};

// Waits out the move in play and its beat of recovery (no cooldowns: never more than a moment).
const settle = (w) => {
  let i = 0;
  for (; i < 300 && w.now < Math.max(w.skillReadyAt ?? 0, w.basicReadyAt ?? 0); i++) updateWorld(w, DT, idle);
  assert.ok(i < 300, 'free again within five seconds');
};

test("holding attack with a sword chains the Warrior's own combo, ending in the finisher", () => {
  const w = arena();
  const seen = [];
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  for (let i = 0; i < 160; i++) {
    updateWorld(w, DT, hold);
    if (w.pose && seen.at(-1) !== w.pose.kind) seen.push(w.pose.kind);
  }
  // Each step plays one of its swings, and the last is a finisher.
  const steps = PATH_VARIANTS.warrior;
  seen.slice(0, steps.length).forEach((move, i) => assert.ok(steps[i].some((s) => s.move === move), `step ${i + 1}: ${move}`));
  assert.ok(steps.at(-1).every((s) => s.finisher), 'every last swing is a finisher');
});

test('bare hands mix their blows too, and every new swing and shot is drawn', () => {
  const fists = PATH_VARIANTS.fists.flat().map((s) => s.move);
  for (const m of ['headbutt', 'flyingkick', 'haymaker', 'cartwheel']) assert.ok(fists.includes(m), `${m} is a bare-handed blow`);
  const all = Object.values(PATH_VARIANTS).flat(2).map((s) => s.move);
  for (const m of ['tgbash', 'bwshove', 'bwcage', 'tpturn']) assert.ok(all.includes(m), `${m} is in a pool`);
  for (const m of all) assert.ok(MOVES[m], `${m} is drawn`);
});

test("the Warrior's combo mixes its swings: a fresh string each time, never the same one twice", () => {
  const steps = PATH_VARIANTS.warrior;
  assert.equal(steps.length, PATH_COMBOS.warrior.length);
  for (const [i, choices] of steps.entries()) {
    assert.equal(choices[0], PATH_COMBOS.warrior[i], 'the first choice is the plain combo');
    for (const s of choices) assert.ok(MOVES[s.move], `${s.move} is drawn`);
  }
  const fresh = steps.flat().map((s) => s.move).filter((m) => !PATH_COMBOS.warrior.some((s) => s.move === m));
  assert.equal(new Set(fresh).size, 8, `eight new swings (${fresh})`);
  // Heavier swings land harder: within each step, a longer swing deals more in all and pushes
  // further (the quick ones trade power for speed).
  for (const choices of steps) {
    const total = (s) => s.strikes.reduce((n, st) => n + st.pct * (st.targets ?? 1), 0);
    const byLength = [...choices].sort((a, b) => a.dur - b.dur);
    const quick = byLength[0];
    const heavy = byLength.at(-1);
    if (heavy.dur - quick.dur < 0.15) continue;
    assert.ok(total(heavy) > total(quick), `${heavy.move} outhits ${quick.move}`);
    assert.ok(Math.max(...heavy.strikes.map((st) => st.knock ?? 0)) > Math.max(...quick.strikes.map((st) => st.knock ?? 0)), `${heavy.move} throws harder than ${quick.move}`);
  }
  // Never the same string twice in a row, even with dice that keep rolling the same.
  let last = null;
  for (let i = 0; i < 200; i++) {
    const plan = planCombo(steps, last, i % 3 ? Math.random : () => 0);
    if (last) assert.notDeepEqual(plan, last);
    last = plan;
  }
  // Played out (with fixed dice): over a minute and a half of combos every new swing shows up.
  const w = arena();
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  const seen = new Set();
  const random = Math.random;
  let seed = 11;
  Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  try {
    for (let i = 0; i < 60 * 90; i++) {
      updateWorld(w, DT, hold);
      if (w.pose) seen.add(w.pose.kind);
    }
  } finally {
    Math.random = random;
  }
  for (const m of fresh) assert.ok(seen.has(m), `${m} came up`);
});

test('a blow lands when the blade cuts, and you step into it', () => {
  const w = arena();
  const m = w.mobs[0];
  const x = w.body.x;
  updateWorld(w, DT, { held: new Set(), pressed: new Set(['KeyZ']), locked: false });
  assert.equal(m.hp, 1e9, 'nothing yet, still winding up');
  run(w, 0.25);
  assert.ok(m.hp < 1e9, 'the cut landed');
  assert.ok(w.body.x > x, 'stepped forward');
});

test('pauses reset the combo, and taps mid-swing are remembered', () => {
  const w = arena();
  const tap = { held: new Set(), pressed: new Set(['KeyZ']), locked: false };
  updateWorld(w, DT, tap);
  run(w, 0.1);
  updateWorld(w, DT, tap); // mid-swing: buffered
  run(w, 0.5);
  assert.equal(w.combo, 1, 'the buffered tap became the second step');
  run(w, 1.5);
  updateWorld(w, DT, tap);
  assert.equal(w.combo, 0, 'a long pause starts over');
});

test('up + attack launches monsters into the air, and down + attack slams the ground', () => {
  const w = arena();
  updateWorld(w, DT, { held: new Set(['ArrowUp', 'KeyZ']), pressed: new Set(['KeyZ']), locked: false });
  assert.equal(w.pose.kind, 'tgskyward', 'the launcher');
  let air = 0;
  for (let i = 0; i < 40; i++) {
    updateWorld(w, DT, idle);
    air = Math.max(air, ...w.mobs.map((m) => m.air ?? 0));
  }
  assert.ok(air > 30, `launched (${Math.round(air)}px)`);
  run(w, 2);
  const m = w.mobs[0];
  const before = m.hp;
  updateWorld(w, DT, { held: new Set(['ArrowDown', 'KeyZ']), pressed: new Set(['KeyZ']), locked: false });
  assert.equal(w.pose.kind, 'tgslam', 'the slam');
  run(w, 0.7);
  assert.ok(m.hp < before, 'it lands');
});

test('Thunderfall needs a full Charge, spends it, and lands its bolt, its clap and the bolts after', () => {
  const w = arena('axe_20');
  w.char.skills.thunderfall = 10;
  w.char.mp = 999;
  const m = w.mobs[0];
  w.volt = 90;
  assert.equal(cast(w, 'thunderfall').reason, 'gauge:volt', 'waits for a full Charge');
  w.volt = 100;
  assert.ok(cast(w, 'thunderfall').ok);
  assert.equal(w.volt, 0, 'spends all of it');
  const marks = [];
  let last = m.hp;
  for (let i = 0; i < 100; i++) {
    updateWorld(w, DT, idle);
    if (m.hp < last) marks.push(i);
    last = m.hp;
  }
  assert.equal(marks.length, 4, `four blows (at frames ${marks})`);
  assert.ok(marks[0] > 50, 'the bolt lands after the leap, not on the press');
  assert.equal(w.volt ?? 0, 0, 'it does not refill the Charge');
});

// Records the hit-stop each blow asks for (tests never spend it, so it's read and cleared every tick).
function stops(w, frames) {
  const seen = [];
  const m = w.mobs[0];
  let last = m.hp;
  const random = Math.random;
  Math.random = () => 0.99; // always hit, never crit
  try {
    for (let i = 0; i < frames; i++) {
      w.hitstop = 0;
      updateWorld(w, DT, idle);
      if (m.hp < last) seen.push({ stop: w.hitstop, slowmo: w.slowmo ?? 0 });
      last = m.hp;
      w.slowmo = 0;
    }
  } finally {
    Math.random = random;
  }
  return seen;
}

test('only the first and last blows of a flurry stop the world', () => {
  // Cyclone Edge: five cuts as he spins, then the thunderclap.
  const w = arena();
  w.char.skills.cycloneedge = 10;
  w.char.mp = 999;
  assert.ok(cast(w, 'cycloneedge').ok);
  const spin = stops(w, 120);
  assert.equal(spin.length, 6, `six blows (${spin.length})`);
  assert.ok(spin[0].stop > 0 && spin[5].stop > 0, 'first and last stop');
  for (const mid of spin.slice(1, 5)) assert.equal(mid.stop, 0, 'the middle blows flow');
});

test('no freeze runs past MAX_STOP: the heaviest blows add slow motion instead', () => {
  const w = arena('axe_20');
  w.char.skills.thunderfall = 10;
  w.char.mp = 999;
  w.volt = 100;
  assert.ok(cast(w, 'thunderfall').ok);
  const s = stops(w, 100);
  assert.equal(s.length, 4);
  for (const b of s) assert.ok(b.stop <= MAX_STOP, `stop ${b.stop}`);
  assert.ok(s[0].slowmo > 0, 'the crushing blow eases into slow motion');
  assert.equal(s[1].slowmo, 0, 'the lighter aftershock does not');
});

test('a blow that hits many monsters stops once, not once per monster', () => {
  const w = arena();
  for (let i = 0; i < 3; i++) updateWorld(w, DT, idle);
  w.combo = 1;
  w.comboUntil = w.now + 1;
  const s = stops(w, 1);
  assert.equal(s.length, 0);
  updateWorld(w, DT, { held: new Set(), pressed: new Set(['KeyZ']), locked: false });
  const hit = stops(w, 60);
  assert.ok(hit.length >= 1);
  assert.ok(hit[0].stop <= MAX_STOP, 'the cleave over three boars stops for its own length');
});

test('once a blow lands, moving cuts the follow-through short and skills can cut in', () => {
  const w = arena();
  w.char.skills.thunderrush = 5;
  w.char.mp = 999;
  updateWorld(w, DT, { held: new Set(), pressed: new Set(['KeyZ']), locked: false });
  run(w, 0.05);
  const x = w.body.x;
  updateWorld(w, DT, { held: new Set(['ArrowLeft']), pressed: new Set(), locked: false });
  assert.ok(w.attackTimer > 0, 'still winding up: no cancel before the blow');
  run(w, 0.2);
  assert.equal(cast(w, 'thunderrush').ok, true, 'a skill cuts into the recovery');
  run(w, 0.6);
  // The charge carried you on past where you started; from there, you walk back.
  const after = w.body.x;
  assert.ok(after > x, 'the charge carried you forward');
  for (let i = 0; i < 20; i++) updateWorld(w, DT, { held: new Set(['ArrowLeft']), pressed: new Set(), locked: false });
  assert.ok(w.body.x < after, 'walking away after the blows');
});

// A Novice with a bow in Mossy Woods, sturdy boars a little way off.
function range(weapon = 'bow_20') {
  const w = arena(weapon);
  w.mobs.forEach((m, i) => (m.x = 420 + i * 30));
  return w;
}

test('bow shots chain into a combo, fly to their target, and land when they arrive', () => {
  const w = range();
  const m = w.mobs[0];
  const x = w.body.x;
  const seen = [];
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  let firstHit = null;
  for (let i = 0; i < 120; i++) {
    updateWorld(w, DT, hold);
    if (w.pose && seen.at(-1)?.step !== w.combo) seen.push({ step: w.combo, move: w.pose.kind });
    if (firstHit == null && m.hp < 1e9) firstHit = i;
  }
  assert.deepEqual(seen.slice(0, 3).map((s) => s.move), COMBOS.bow.map((s) => s.move));
  assert.ok(firstHit > 16, `the arrow took time to arrive (frame ${firstHit})`);
});

test('the finishing arrow pierces the whole line', () => {
  const w = range();
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  for (let i = 0; i < 150; i++) updateWorld(w, DT, hold);
  assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 3, 'all three in the line got hit');
});

test("skills can't be spammed back to back, even by moving, but basic attacks still flow into them", () => {
  const w = arena('sword_20');
  w.char.job = 'warrior';
  w.char.skills.thunderrush = 10;
  w.char.mp = 9999;
  assert.ok(cast(w, 'thunderrush').ok);
  run(w, 0.2);
  assert.equal(cast(w, 'thunderrush').reason, 'busy', 'still rushing');
  const left = { held: new Set(['ArrowLeft']), pressed: new Set(), locked: false };
  for (let i = 0; i < 3; i++) updateWorld(w, DT, left);
  assert.equal(cast(w, 'thunderrush').reason, 'busy', 'walking cuts the follow-through, not the wait');
  run(w, 1.2);
  assert.ok(cast(w, 'thunderrush').ok, 'free once the motion is done');
  // A basic swing flows straight into a skill once its blow has landed.
  run(w, 1.5);
  updateWorld(w, DT, { held: new Set(), pressed: new Set(['KeyZ']), locked: false });
  run(w, 0.35);
  assert.ok(cast(w, 'thunderrush').ok, 'weaved in after the swing');
});

test('the same no-spam rule holds for every job, spells and thief skills included', () => {
  for (const [job, weapon, skill] of [['warrior', 'sword_20', 'thunderrush']]) {
    const w = arena(weapon);
    w.char.job = job;
    w.char.skills[skill] = 10;
    w.char.mp = 9999;
    assert.ok(cast(w, skill).ok, `${skill} goes off`);
    run(w, 0.15);
    for (let i = 0; i < 3; i++) updateWorld(w, DT, { held: new Set(['ArrowLeft']), pressed: new Set(), locked: false });
    assert.equal(cast(w, skill).reason, 'busy', `${skill} can't be recast mid-motion, even after moving`);
    run(w, 1);
    assert.ok(cast(w, skill).ok, `${skill} is free again once its motion is done`);
  }
});

test('one press of a skill key casts it once, even held a moment or pressed mid-swing', () => {
  for (const midSwing of [false, true]) {
    const w = arena();
    w.char.skills.thunderrush = 10;
    w.char.hotkeys.KeyA = { skill: 'thunderrush' };
    w.char.baseMp = 99999;
    w.char.mp = 99999;
    let casts = 0;
    let last = w.char.mp;
    const tick = (input) => {
      updateWorld(w, DT, input);
      if (w.char.mp < last - 1) casts++;
      last = w.char.mp;
    };
    if (midSwing) tick({ held: new Set(), pressed: new Set(['KeyZ']), locked: false });
    tick({ held: new Set(['KeyA']), pressed: new Set(['KeyA']), locked: false });
    for (let i = 0; i < 15; i++) tick({ held: new Set(['KeyA']), pressed: new Set(), locked: false });
    for (let i = 0; i < 120; i++) tick(idle);
    assert.equal(casts, 1, `one cast${midSwing ? ' (pressed mid-swing)' : ''}`);
  }
});

// ---------- The warrior's level 30 paths ----------

// The arena's warrior, raised to 30 and advanced to `job` (Brann's trial done first).
function advanced(job, weapon = 'sword_20') {
  const w = arena(weapon);
  w.char.quests.warrior_trial = { state: 'done', kills: {} };
  assert.ok(advanceJob(w.char, job), `advanced to ${job}`);
  w.char.mp = 9999;
  w.char.baseMp = 99999;
  return w;
}

test("both warrior paths wait on Brann's trial", async () => {
  const { acceptQuest, questState } = await import('../src/core/quests.js');
  const w = arena();
  assert.equal(advanceJob(w.char, 'stormwall'), false, 'no path before the trial');
  assert.equal(questState(w.char, 'warrior_trial'), 'available');
  assert.ok(acceptQuest(w.char, 'warrior_trial'));
  w.char.quests.warrior_trial.state = 'done';
  assert.ok(advanceJob(w.char, 'tempest'));
  const mage = createCharacter('M', {});
  gainExp(mage, 4e6);
  advanceJob(mage, 'mage');
  assert.equal(questState(mage, 'warrior_trial'), 'locked', 'only warriors take it');
});

// The warrior paths' skills are procs too (see data/skills.js). Runs `fn` with fixed dice: low
// rolls make every proc go off (and every blow hit and crit), high ones none.
function dice(value, fn) {
  const random = Math.random;
  Math.random = () => value;
  try {
    return fn();
  } finally {
    Math.random = random;
  }
}
// Plays the path's combo finisher (the first combo is always the path's own).
function finisher(w) {
  w.combo = PATH_VARIANTS[w.char.job].length - 2;
  w.comboUntil = w.now + 1;
  updateWorld(w, DT, press('KeyZ'));
}

test('no skill has a level limit: every skill of a path can be learned from the start', async () => {
  const { canLearn } = await import('../src/core/character.js');
  const { SKILLS } = await import('../src/data/skills.js');
  for (const s of Object.values(SKILLS)) assert.equal(s.minLevel, undefined, s.id);
  const w = advanced('stormwall');
  w.char.sp = 5;
  w.char.level = 31;
  assert.ok(canLearn(w.char, 'lightningcage'));
  assert.ok(canLearn(w.char, 'fortress'));
});

// ---------- Command combos, the hit counter, Links and finishers ----------

const press = (code) => ({ held: new Set([code]), pressed: new Set([code]), locked: false });

test('Up + attack is a launcher that throws them up and hops you after them', () => {
  const w = arena();
  const y = w.body.y;
  updateWorld(w, DT, { held: new Set(['ArrowUp', 'KeyZ']), pressed: new Set(['KeyZ']), locked: false });
  assert.equal(w.pose.kind, 'tgskyward');
  let air = 0;
  let top = y;
  for (let i = 0; i < 40; i++) {
    updateWorld(w, DT, idle);
    air = Math.max(air, ...w.mobs.map((m) => m.air ?? 0));
    top = Math.min(top, w.body.y);
  }
  assert.ok(air > 30, 'launched them');
  assert.ok(top < y - 20, 'and hopped up after them');
});

test('attacking in the air plays an air combo that hangs you up, ending in a slam on landing', () => {
  const w = arena();
  w.body.y -= 60; // under the ledge above this spot
  w.body.onGround = false;
  w.body.vy = 0;
  updateWorld(w, DT, press('KeyZ'));
  assert.equal(w.pose.kind, 'tgaircut');
  const y0 = w.body.y;
  run(w, 0.25);
  assert.ok(w.body.y - y0 < 20, `hung in the air, not falling (free fall is ~47px) (${(w.body.y - y0).toFixed(1)}px)`);
  updateWorld(w, DT, press('KeyZ'));
  run(w, 0.3);
  updateWorld(w, DT, press('KeyZ'));
  assert.equal(w.pose.kind, 'tgplunge');
  const before = w.mobs.map((m) => m.hp);
  let landed = false;
  for (let i = 0; i < 60 && !landed; i++) {
    updateWorld(w, DT, idle);
    landed = w.body.onGround;
  }
  assert.ok(landed, 'dove to the ground');
  run(w, 0.05);
  assert.equal(w.pose?.kind, 'landslam');
  assert.ok(w.mobs.some((m, i) => m.hp < before[i]), 'the slam hit on touchdown');
  assert.ok(w.fx.some((f) => f.kind === 'tgbolt'), 'and a bolt struck where he landed');
});

test('attacking out of a run is a dash attack', () => {
  const w = arena();
  w.body.x = 200;
  for (let i = 0; i < 30; i++) updateWorld(w, DT, { held: new Set(['ArrowRight']), pressed: new Set(), locked: false });
  updateWorld(w, DT, { held: new Set(['ArrowRight', 'KeyZ']), pressed: new Set(['KeyZ']), locked: false });
  assert.equal(w.pose.kind, 'tgflash');
});

test('the hit counter climbs with every hit you land and drops after a pause', () => {
  const w = arena();
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  run(w, 2, hold);
  assert.ok(w.hits >= 5, `counted (${w.hits})`);
  run(w, 3.5);
  assert.equal(w.hits, 0, 'dropped');
});

test('a skill started right after a finisher connects is a Link, and hits harder', () => {
  const damage = (link) => {
    const w = advanced('stormwall');
    w.char.skills.thunderrush = 10;
    const random = Math.random;
    Math.random = () => 0.5;
    try {
      if (link) w.finisherAt = { at: w.now, key: 'basic3' };
      assert.ok(cast(w, 'thunderrush').ok);
      const m = w.mobs[0];
      run(w, 0.4);
      return { dealt: 1e9 - m.hp, said: w.numbers.some((n) => n.text === 'LINK!') };
    } finally {
      Math.random = random;
    }
  };
  const plain = damage(false);
  const linked = damage(true);
  assert.ok(linked.said && !plain.said, 'says LINK!');
  assert.ok(linked.dealt > plain.dealt * 1.15, `${plain.dealt} -> ${linked.dealt}`);
});

test("each warrior path's finisher needs its gauge full, spends it, and lands its big blow", () => {
  for (const [job, weapon, skill, gauge] of [['stormwall', 'sword_20', 'fortress', 'bulwark'], ['tempest', 'sword_20', 'redthunder', 'gale']]) {
    const w = advanced(job, weapon);
    w.char.skills[skill] = 10;
    w[gauge] = 80;
    w[`${gauge}At`] = w.now;
    assert.equal(cast(w, skill).reason, `gauge:${gauge}`, `${skill} waits for full ${gauge}`);
    w[gauge] = 100;
    assert.ok(cast(w, skill).ok, `${skill} goes off at full ${gauge}`);
    assert.equal(w[gauge], 0, `spending the ${gauge}`);
    const m = w.mobs[0];
    const before = m.hp;
    run(w, 1.8);
    assert.ok(before - m.hp > 0, 'it hits');
    // The no-spam rule holds for finishers too.
    settle(w);
    w[gauge] = 100;
    assert.ok(cast(w, skill).ok);
    run(w, 0.3);
    w[gauge] = 100;
    assert.equal(cast(w, skill).reason, 'busy', `${skill} can't be recast mid-motion`);
  }
});

// ---------- Weight, Rage power, and Faith ----------


const shots = (w) => w.fx.filter((f) => f.kind === 'projectile' && f.t < 0.02).length;


test('an arrow flies at the monster it hits, and follows it as it moves', () => {
  // A shot heads for where its monster is now.
  const v = arena('bow_20');
  updateWorld(v, DT, press('KeyZ'));
  let arrow = null;
  for (let i = 0; i < 60 && !arrow; i++) {
    updateWorld(v, DT, idle);
    arrow = v.fx.find((f) => f.kind === 'projectile' && f.mob);
  }
  assert.ok(arrow, 'an arrow flies at a monster');
  arrow.mob.x += 40;
  updateWorld(v, DT, idle);
  assert.equal(Math.round(arrow.tx), Math.round(arrow.mob.x), 'it follows the monster');
});

// ---------- The Thunderguard's Charge ----------

test("the Thunderguard's blows build Charge, faster the more monsters one blow catches; hits taken build it; it drains", async () => {
  const { hurtPlayer } = await import('../src/world/world.js');
  const gain = (n) => {
    const w = arena();
    w.mobs = w.mobs.slice(0, n);
    w.mobs.forEach((m) => (m.x = 340));
    const random = Math.random;
    Math.random = () => 0.5;
    try {
      // The combo's finisher, which catches up to four.
      w.combo = PATH_COMBOS.warrior.length - 2;
      w.comboUntil = w.now + 1;
      updateWorld(w, DT, press('KeyZ'));
      run(w, 0.7);
    } finally {
      Math.random = random;
    }
    return w;
  };
  const one = gain(1);
  const three = gain(3);
  assert.ok(one.volt > 0, 'a blow builds it');
  assert.ok(three.volt >= one.volt * 1.8, `a blow on three builds it faster (${one.volt} vs ${three.volt})`);
  run(three, 9);
  assert.equal(three.volt, 0, 'drained once the fighting stopped');
  const w = arena();
  w.god = false;
  w.char.hp = 99999;
  hurtPlayer(w, 10, w.body.x + 30);
  assert.ok(w.volt > 0, 'a hit taken builds it too');
});

test('Overcharge: nothing knocks the Thunderguard back, his blows land heavier and lightning jumps from them', async () => {
  const { hurtPlayer } = await import('../src/world/world.js');
  const knocked = (volt) => {
    const w = arena();
    w.god = false;
    w.char.hp = 99999;
    w.volt = volt;
    w.voltAt = 1e9;
    hurtPlayer(w, 10, w.body.x + 30);
    return Math.abs(w.body.vx);
  };
  assert.ok(knocked(0) > 0, 'a plain hit knocks him back');
  assert.equal(knocked(100), 0, 'Overcharged he stands firm');
  const stopOf = (volt) => {
    const w = arena();
    w.volt = volt;
    w.voltAt = 1e9;
    w.combo = 1;
    w.comboUntil = w.now + 1;
    updateWorld(w, DT, press('KeyZ'));
    return stops(w, 40)[0]?.stop ?? 0;
  };
  assert.ok(stopOf(100) > stopOf(0), 'heavier blows while Overcharged');
  // A blow on the first boar sends lightning on to the others.
  const w = arena();
  w.volt = 100;
  w.voltAt = 1e9;
  const [, b, c] = w.mobs;
  const before = [b.hp, c.hp];
  const random = Math.random;
  Math.random = () => 0.5;
  try {
    w.combo = -1;
    updateWorld(w, DT, press('KeyZ'));
    run(w, 0.6);
  } finally {
    Math.random = random;
  }
  assert.ok(w.fx.some((f) => f.kind === 'tgchain') || b.hp < before[0], 'a bolt jumped on');
  assert.ok(b.hp < before[0] && c.hp < before[1], 'the others were struck too');
});

test("the static shell shocks what hits the Overcharged Thunderguard", async () => {
  const { hurtPlayer } = await import('../src/world/world.js');
  const w = arena();
  w.god = false;
  w.char.hp = 99999;
  w.volt = 100;
  w.voltAt = 1e9;
  const m = w.mobs[0];
  const before = m.hp;
  hurtPlayer(w, 10, m.x);
  assert.ok(w.fx.some((f) => f.kind === 'tgchain'), 'a bolt jumped back at it');
  run(w, 0.3);
  assert.ok(m.hp < before, 'the one that hit him was shocked');
});

test('the proc skills free their old hotkeys, and a real skill keeps its key', async () => {
  const { updateRetiredJobs } = await import('../src/core/save.js');
  const w = advanced('stormwall');
  w.char.hotkeys.KeyA = { skill: 'bedrock' };
  w.char.hotkeys.KeyS = { skill: 'thunderrush' };
  updateRetiredJobs(w.char);
  assert.equal(w.char.hotkeys.KeyA, null, 'a proc has no key');
  assert.deepEqual(w.char.hotkeys.KeyS, { skill: 'thunderrush' }, 'a real skill keeps its key');
});





function mage() {
  const w = arena('wand_20');
  w.char.job = 'mage';
  w.char.base.int = 200;
  w.char.mp = 9999;
  w.char.baseMp = 99999;
  w.mobs.forEach((m, i) => (m.x = 420 + i * 30));
  for (let i = 0; i < 5; i++) updateWorld(w, DT, idle);
  return w;
}

test('no job can mash out its attacks: every skill plays its motion and a beat, basics keep a rhythm', async () => {
  const { SKILLS } = await import('../src/data/skills.js');
  // (Seeded, so a lucky run of quick swings can't make it flicker.)
  const random = Math.random;
  let seed = 11;
  Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  try {
  const families = { warrior: ['warrior'], stormwall: ['warrior', 'stormwall'], tempest: ['warrior', 'tempest'] };
  const weapons = { warrior: 'sword_20', stormwall: 'sword_20', tempest: 'sword_20' };
  for (const [label, fam] of Object.entries(families)) {
    const job = label;
    const weapon = weapons[label];
    const type = weapon.split('_')[0];
    const skills = Object.entries(SKILLS).filter(([, s]) => fam.includes(s.job) && ['attack', 'magic'].includes(s.type) && !s.fullGauge && !s.rageCost && (!s.weapons || s.weapons.includes(type)));
    for (const [id] of skills) {
      const w = arena(weapon);
      w.char.job = job;
      w.char.skills[id] = 20;
      w.char.hotkeys.KeyA = { skill: id };
      w.char.baseMp = 1e7;
      let casts = 0;
      let last = null;
      for (let i = 0; i < 6 * 60; i++) {
        w.char.mp = 1e7;
        updateWorld(w, DT, press('KeyA'));
        // (A dive's touchdown pose is the same cast landing, not another one.)
        if (w.pose && w.pose.since !== last && w.pose.kind !== 'landslam') {
          casts++;
          last = w.pose.since;
        }
      }
      assert.ok(casts / 6 <= 2, `${job} ${id}: ${(casts / 6).toFixed(2)} casts a second when mashed`);
    }
    const w = arena(weapon);
    w.char.job = job;
    let moves = 0;
    let last = null;
    for (let i = 0; i < 6 * 60; i++) {
      updateWorld(w, DT, press('KeyZ'));
      if (w.pose && w.pose.since !== last) {
        moves++;
        last = w.pose.since;
      }
    }
    // (Tempest is the speed path: its quick cuts chain at up to ~4.2 a second, by design, measured
    // over 40 rolls 2026-11-10. Everyone else keeps to 3.5.)
    const cap = label === 'tempest' ? 4.2 : 3.5;
    assert.ok(moves / 6 <= cap, `${job}: ${(moves / 6).toFixed(2)} basic attacks a second when mashed`);
  }
  } finally {
    Math.random = random;
  }
});

test("potions can't be chugged by mashing their key", () => {
  const w = arena();
  addItem(w.char.inventory, 'red_potion', 50);
  w.char.hotkeys.Digit1 = { item: 'red_potion' };
  const count = () => w.char.inventory.use.filter((s) => s.id === 'red_potion').reduce((a, s) => a + s.qty, 0);
  const before = count();
  for (let i = 0; i < 60; i++) updateWorld(w, DT, press('Digit1'));
  assert.ok(before - count() <= 3, `${before - count()} potions in one second`);
  assert.ok(before - count() >= 2, 'but they still go down quickly');
});

// Holding attack and a direction together: you stay planted and keep swinging (the direction only
// turns the next swing round), instead of every swing being cut short into a burst of running.
test('holding attack and a direction swings on smoothly, planted, turning with the direction', () => {
  const w = arena();
  const hold = (dir) => ({ held: new Set(['KeyZ', dir]), pressed: new Set(), locked: false });
  updateWorld(w, DT, { held: new Set(['KeyZ', 'ArrowRight']), pressed: new Set(['KeyZ']), locked: false });
  // Between swings you stand your ground (the only beat out of a swing is the pause after a
  // finisher, standing still): never a step of walking, let alone a run.
  let walked = 0;
  for (let i = 0; i < 60 * 3; i++) {
    updateWorld(w, DT, hold('ArrowRight'));
    if (Math.abs(w.body.vx) > 8) walked++;
  }
  assert.equal(walked, 0, 'no walking or running between swings');
  // Turning round mid-combo: the next swing faces the other way, and stays facing it.
  const flips = [];
  for (let i = 0; i < 60 * 2; i++) {
    updateWorld(w, DT, hold('ArrowLeft'));
    if (flips.at(-1) !== w.body.facing) flips.push(w.body.facing);
  }
  assert.deepEqual(flips, [1, -1], `turned once, and stayed turned (${flips})`);
  // Letting go of attack, you walk off at once.
  const x = w.body.x;
  for (let i = 0; i < 30; i++) updateWorld(w, DT, { held: new Set(['ArrowLeft']), pressed: new Set(), locked: false });
  assert.ok(w.body.x < x - 20, 'walking away once attack is let go');
});

test('attacking out of a run is still a dash attack', () => {
  const w = arena();
  Object.assign(w.body, { x: 120 });
  for (let i = 0; i < 30; i++) updateWorld(w, DT, { held: new Set(['ArrowRight']), pressed: new Set(), locked: false });
  updateWorld(w, DT, { held: new Set(['ArrowRight', 'KeyZ']), pressed: new Set(['KeyZ']), locked: false });
  assert.equal(w.pose?.kind, 'tgflash');
});

// The same for a held attack skill, every kind of job: you stay planted and keep casting it (the
// key repeats once held), turning with the direction, never walking off between casts.
test('holding an attack skill and a direction keeps casting it, planted, for every job', () => {
  for (const [job, weapon, skill] of [['warrior', 'sword_20', 'thunderrush']]) {
    const casts = (dir) => {
      const w = arena(weapon);
      w.char.job = job;
      w.char.skills[skill] = 10;
      w.char.hotkeys.KeyA = { skill };
      w.char.baseMp = 99999;
      w.char.mp = 99999;
      let n = 0;
      let walked = 0;
      let last = w.char.mp;
      for (let i = 0; i < 60 * 3; i++) {
        updateWorld(w, DT, { held: new Set(['KeyA', ...(dir ? [dir] : [])]), pressed: i === 0 ? new Set(['KeyA']) : new Set(), locked: false });
        if (w.char.mp < last - 0.5) n++;
        last = w.char.mp;
        if (w.body.onGround && Math.abs(w.body.vx) > 8) walked++;
      }
      return { n, walked, facing: w.body.facing };
    };
    const alone = casts(null);
    const left = casts('ArrowLeft');
    assert.ok(alone.n >= 3, `${skill} repeats when held (${alone.n})`);
    assert.equal(left.walked, 0, `${job}: no walking between ${skill} casts`);
    assert.equal(left.n, alone.n, `${job}: as many casts with a direction held`);
    assert.equal(left.facing, -1, `${job}: turned to face the way held`);
  }
});


// A provoke (Hallowed Ground's taunt in a dungeon) cries out in the colour of whoever cried it:
// it was once always one path's colour, whoever cried it.
test("a provoke takes the colour of the path that cried it", async () => {
  const { provoke } = await import('../src/world/dungeon.js');
  for (const [job, school] of [['stormwall', 'indigo'], ['tempest', 'redstorm']]) {
    const w = advanced(job);
    provoke(w, 'you', w.body);
    assert.equal(w.fx.find((f) => f.kind === 'roar').school, school, job);
  }
});

// Each second job plays its first job's skills its own way (data/path-skills.js): the same skill and
// numbers, but its own move. A move belongs to the job whose skill or basic string plays it; no
// second job may play another job's move when it casts any skill it can cast.
test("no second job plays another job's move when casting any skill it can cast", async () => {
  const { SKILLS } = await import('../src/data/skills.js');
  const { JOBS, jobChain } = await import('../src/data/jobs.js');
  const { pathMoves } = await import('../src/data/path-skills.js');
  // (Still to get their own versions; take a job out as it's done.)
  const NOT_YET = new Set([]);
  const owners = new Map();
  const own = (move, job) => (owners.get(move) ?? owners.set(move, new Set()).get(move)).add(job);
  for (const s of Object.values(SKILLS)) {
    if (!JOBS[s.job] || s.type === 'passive') continue;
    for (const m of pathMoves({ ...s, at: (lv, max) => ({ ...s.at(lv, max), paths: undefined }) }, s.maxLevel, s.job)) own(m, s.job);
    for (const job of Object.keys(s.at(s.maxLevel, s.maxLevel).paths ?? {})) for (const m of pathMoves(s, s.maxLevel, job)) own(m, job);
  }
  for (const job of Object.keys(PATH_VARIANTS)) if (JOBS[job]) for (const step of PATH_VARIANTS[job]) for (const v of step) own(v.move, job);
  const second = Object.values(JOBS).filter((j) => j.tier === 2 && !j.hidden && !NOT_YET.has(j.id));
  assert.ok(second.length >= 4);
  for (const { id: job } of second) {
    const chain = jobChain(job);
    for (const s of Object.values(SKILLS)) {
      // (Everyone keeps the Novice's beginner skills as they are.)
      if (!chain.includes(s.job) || s.type === 'passive' || !(JOBS[s.job].tier >= 1)) continue;
      for (const m of pathMoves(s, s.maxLevel, job)) {
        const by = [...(owners.get(m) ?? [])].filter((j) => j !== job);
        assert.equal(by.length, 0, `${job} casting ${s.id} plays ${m}, ${by.join('/')}'s move`);
      }
    }
  }
});

// A level 40 Tidecaller with a staff, in the arena.
function tidecaller() {
  const w = arena('staff_50');
  const c = w.char;
  gainExp(c, 4e8);
  c.job = 'novice';
  assert.ok(advanceJob(c, 'tidemage'));
  c.quests.mage_trial = { state: 'done', kills: {} };
  assert.ok(advanceJob(c, 'tidecaller'));
  c.mp = 9999;
  c.baseMp = 99999;
  for (let i = 0; i < 5; i++) updateWorld(w, DT, idle);
  return w;
}

test('the Tidecaller builds Moonsong; full (Spring Tide), her heals leave bubbles and mend harder', async () => {
  const { healAround, gaugeOf, pathOf } = await import('../src/world/melee.js');
  const w = tidecaller();
  assert.equal(gaugeOf(w.char), 'moon');
  assert.equal(pathOf(w), 'tidecaller');
  const press = { held: new Set(['KeyZ']), pressed: new Set(['KeyZ']), locked: false };
  for (let i = 0; i < 120; i++) updateWorld(w, DT, i % 20 === 0 ? press : idle);
  assert.ok(w.moon > 0, 'her hits build it');
  // Healing at an empty Moonsong, then at a full one.
  const heal = (moon) => {
    w.moon = moon;
    w.moonAt = w.now;
    w.char.hp = 100;
    delete w.char.buffs.springbubble;
    healAround(w, w.body.x, w.body.y, 0.1, 200);
    return w.char.hp - 100;
  };
  const low = heal(0);
  const full = heal(100);
  assert.ok(full > low * 1.15, `a full Moonsong heals harder (${low} -> ${full})`);
  assert.ok(w.char.buffs.springbubble?.shield > 0, 'Spring Tide leaves a bubble');
});

test("at Spring Tide the Tidecaller's basic attacks drop healing on whoever is hurt", () => {
  const w = tidecaller();
  w.moon = 100;
  w.moonAt = w.now;
  w.char.hp = Math.round(w.stats.maxHp * 0.4);
  const before = w.char.hp;
  const press = { held: new Set(['KeyZ']), pressed: new Set(['KeyZ']), locked: false };
  for (let i = 0; i < 90; i++) updateWorld(w, DT, i % 20 === 0 ? press : idle);
  assert.ok(w.fx.some((f) => f.kind === 'tcdrop') || w.char.hp > before, 'a droplet fell');
  assert.ok(w.char.hp > before, 'and it mended her');
});
