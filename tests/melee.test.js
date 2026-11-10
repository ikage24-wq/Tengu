// Melee combos: basic attacks chain through a weapon's steps into a finisher, blows land as the
// blade cuts (not when the key is pressed), launchers pop monsters up, the warrior's combo skills
// carry on step by step, and once a blow lands you can move or cut in with a skill.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createWorld, updateWorld, loadMap, hurtPlayer } from '../src/world/world.js';
import { createCharacter, gainExp, advanceJob } from '../src/core/character.js';
import { makeEquip } from '../src/core/items.js';
import { spawnMob } from '../src/world/mobs.js';
import { PATH_COMBOS, PATH_VARIANTS, planCombo, MAX_STOP, addShadow } from '../src/world/melee.js';
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
  for (const m of ['tgbash', 'bwshove', 'bwcage', 'tpturn', 'acroll', 'acspin', 'acfront']) assert.ok(all.includes(m), `${m} is in a pool`);
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

// A level 25 archer in Mossy Woods with sturdy boars a little way off.
function range(weapon = 'bow_20') {
  const w = arena(weapon);
  w.char.job = 'archer';
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
  assert.deepEqual(seen.slice(0, 3).map((s) => s.move), PATH_COMBOS.archer.map((s) => s.move));
  assert.ok(firstHit > 16, `the arrow took time to arrive (frame ${firstHit})`);
  assert.ok(Math.abs(w.body.x - x) > 4, 'she moves about as she shoots (skips, flips and leaps)');
});

test('the finishing arrow pierces the whole line', () => {
  const w = range();
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  for (let i = 0; i < 150; i++) updateWorld(w, DT, hold);
  assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 3, 'all three in the line got hit');
});

test("the archer's tricks: Blast Arrow and Snare Arrow go off on their own, Spring Trap is pressed", () => {
  const w = range();
  Object.assign(w.char.skills, { blastarrow: 20, snarearrow: 20 });
  for (const id of ['blastarrow', 'snarearrow']) assert.equal(cast(w, id).reason, 'passive', `${id} is not a key to press`);
  // A lucky shot bursts on its target (catching the ones beside it) and nets it in place.
  let burst = false;
  dice(0.01, () => {
    updateWorld(w, DT, press('KeyZ'));
    for (let i = 0; i < 40; i++) {
      updateWorld(w, DT, idle);
      burst ||= w.fx.some((f) => f.kind === 'acfirework');
    }
  });
  assert.ok(burst, 'the arrow went off like a firework');
  assert.ok(w.mobs.filter((m) => m.hp < 1e9).length >= 2, 'catching the monsters beside its target');
  const netted = w.mobs.find((m) => m.hold === 'snare' && m.frozenUntil > w.now);
  assert.ok(netted, 'a net holds its target');
  assert.ok(netted.frozenUntil - w.now > 1.5, 'for a few seconds');
  // A netted monster takes more from her shots.
  const dealt = (held) => {
    const u = range();
    u.char.skills.snarearrow = 20;
    if (held) for (const m of u.mobs) Object.assign(m, { hold: 'snare', frozenUntil: 1e9 });
    dice(0.5, () => {
      updateWorld(u, DT, press('KeyZ'));
      run(u, 0.8);
    });
    return u.mobs.reduce((n, m) => n + 1e9 - m.hp, 0);
  };
  const free = dealt(false);
  const held = dealt(true);
  assert.ok(free > 0 && held > free * 1.2, `harder on a netted one (${free} -> ${held})`);
  // Spring Trap: pressed, a trap goes down ahead; a monster walking onto it is flung up.
  const v = range();
  v.char.skills.springtrap = 10;
  v.char.mp = 9999;
  assert.ok(cast(v, 'springtrap').ok);
  assert.ok(!v.traps?.length, 'not on the press: when she sets it down');
  run(v, 0.4);
  assert.equal(v.traps?.length, 1, 'a trap is set');
  const trap = v.traps[0];
  const m = v.mobs[2];
  m.x = trap.x + 60;
  m.hp = 1e9;
  for (let i = 0; i < 60 && v.traps.length; i++) {
    m.x -= 2;
    updateWorld(v, DT, idle);
  }
  assert.equal(v.traps.length, 0, 'it sprang');
  run(v, 0.3);
  assert.ok(m.hp < 1e9 && (m.air ?? 0) > 0, 'snapped and flung into the air');
});

test('Vault springs over the monster in front, lands behind it, and turns to shoot it', () => {
  const w = range();
  w.char.skills.vault = 10;
  w.char.mp = 9999;
  const m = w.mobs[0];
  w.body.x = m.x - 50;
  const x = w.body.x;
  assert.ok(cast(w, 'vault').ok);
  assert.ok(w.invuln > 0, 'untouchable mid-vault');
  run(w, 0.75);
  assert.ok(w.body.x > m.x, `landed past it (${Math.round(x)} -> ${Math.round(w.body.x)}, monster at ${Math.round(m.x)})`);
  assert.equal(w.body.facing, -1, 'turned round');
  run(w, 0.5);
  assert.ok(w.mobs.some((o) => o.hp < 1e9 && o.x < w.body.x), 'and shot back at them');
});

test("skills can't be spammed back to back, even by moving, but basic attacks still flow into them", () => {
  const w = range();
  w.char.skills.vault = 10;
  w.char.mp = 9999;
  assert.ok(cast(w, 'vault').ok);
  run(w, 0.2);
  assert.equal(cast(w, 'vault').reason, 'busy', 'still vaulting');
  const left = { held: new Set(['ArrowLeft']), pressed: new Set(), locked: false };
  for (let i = 0; i < 3; i++) updateWorld(w, DT, left);
  assert.equal(cast(w, 'vault').reason, 'busy', 'walking cuts the follow-through, not the wait');
  run(w, 0.8);
  assert.ok(cast(w, 'vault').ok, 'free once the motion is done');
  // A basic shot flows straight into a skill once its arrow is away.
  run(w, 1.5);
  updateWorld(w, DT, { held: new Set(), pressed: new Set(['KeyZ']), locked: false });
  run(w, 0.25);
  assert.ok(cast(w, 'vault').ok, 'weaved in after the arrow left');
});

test('the same no-spam rule holds for every job, spells and thief skills included', () => {
  for (const [job, weapon, skill] of [['archer', 'bow_20', 'vault'], ['thief', 'gauntlet_20', 'pirouette'], ['thief', 'dagger_20', 'pirouette'], ['warrior', 'sword_20', 'thunderrush']]) {
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

// ---------- The archer paths: the Ranger (bow, Gale) and the Sniper (crossbow, Focus) ----------

// A level 30+ archer on a path, in the woods with sturdy boars in a row ahead.
function archer(job, weapon = job === 'stormcaller' ? 'crossbow_20' : 'bow_20') {
  const w = arena(weapon);
  const c = createCharacter('A', {});
  gainExp(c, 4e6);
  advanceJob(c, 'archer');
  c.quests.archer_trial = { state: 'done', kills: {} };
  assert.ok(advanceJob(c, job), `advanced to ${job}`);
  c.equipment.weapon = makeEquip(weapon, {});
  c.mp = 9999;
  c.baseMp = 99999;
  w.char = c;
  for (let i = 0; i < 10; i++) updateWorld(w, DT, idle);
  return w;
}
// Adds to an archer's gauge the way a landed arrow does.
const addAimFor = (w, n) => {
  w.momentum = Math.min(100, (w.momentum ?? 0) + n);
  w.momentumAt = w.now;
};
const shots = (w) => w.fx.filter((f) => f.kind === 'projectile' && f.t < 0.02).length;

test("both archer paths wait on Kestrel's trial, and each keeps to its own weapon", async () => {
  const { acceptQuest, questState } = await import('../src/core/quests.js');
  const { JOBS } = await import('../src/data/jobs.js');
  const { roleOf } = await import('../src/data/dungeons.js');
  const c = createCharacter('A', {});
  gainExp(c, 4e6);
  advanceJob(c, 'archer');
  assert.equal(advanceJob(c, 'beastmaster'), false, 'no path before the trial');
  assert.equal(questState(c, 'archer_trial'), 'available');
  assert.ok(acceptQuest(c, 'archer_trial'));
  c.quests.archer_trial.state = 'done';
  assert.ok(advanceJob(c, 'stormcaller'));
  assert.deepEqual(JOBS.beastmaster.weapons, ['bow']);
  assert.deepEqual(JOBS.stormcaller.weapons, ['crossbow']);
  assert.equal(roleOf('beastmaster', 'archer'), 'dps');
  assert.equal(roleOf('stormcaller', 'archer'), 'dps');
});

// ---------- The Phantom Trickster (the Acrobat Archer's bow path) ----------
const trickster = (skills = {}) => {
  const w = archer('beastmaster');
  Object.assign(w.char.skills, skills);
  w.char.mp = 9999;
  return w;
};
const looses = (w, secs, kinds) => {
  let n = 0;
  for (let i = 0; i < secs * 60; i++) {
    w.bondAt = w.now;
    updateWorld(w, DT, { held: new Set(['KeyZ']), pressed: new Set(), locked: false });
    for (const f of w.fx) if (f.kind === 'projectile' && kinds.includes(f.shot) && !f.counted) {
      f.counted = true;
      n++;
    }
  }
  return n;
};

test('her copies: one at half Illusion, two when full (three with Hall of Mirrors), and they shoot with her', async () => {
  const { copiesOf } = await import('../src/world/phantom.js');
  const w = trickster();
  w.bond = 20;
  assert.equal(copiesOf(w), 0, 'none yet');
  w.bond = 55;
  assert.equal(copiesOf(w), 1, 'one at half');
  w.bond = 100;
  assert.equal(copiesOf(w), 2, 'two when full');
  w.char.skills.alpha = 5;
  assert.equal(copiesOf(w), 3, 'three with Hall of Mirrors');
  const alone = trickster();
  alone.bond = 0;
  const a = looses(alone, 3, ['ptarrow', 'ptbig']);
  const full = trickster();
  full.bond = 100;
  const b = looses(full, 3, ['ptarrow', 'ptbig']);
  assert.ok(b >= a * 2.5, `the copies loose beside her (${b} against ${a})`);
});

test("Vanishing Arrow, Dove Arrow and Card Trick go off from her shots on their own", () => {
  const w = trickster({ wildhunt: 10, wolfpounce: 10, hawkstrike: 10 });
  w.mobs.forEach((m, i) => (m.x = w.body.x + 140 + i * 30));
  const seen = new Set();
  dice(0.01, () => {
    updateWorld(w, DT, press('KeyZ'));
    for (let i = 0; i < 90; i++) {
      updateWorld(w, DT, idle);
      for (const f of w.fx) seen.add(f.kind === 'projectile' ? f.shot : f.kind);
    }
  });
  assert.ok(seen.has('ptsmoke'), 'an arrow vanishes in smoke and comes back');
  assert.ok(seen.has('ptdove'), 'doves fly on');
  assert.ok(seen.has('ptcard'), 'cards fly');
  assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 3, 'reaching all of them');
});

test('Smoke Bomb stuns everything close round her and loses them; Mirror Dodge lets a copy take the hit', async () => {
  const { hurtPlayer } = await import('../src/world/world.js');
  const w = trickster({ packhowl: 10 });
  w.mobs.forEach((m, i) => Object.assign(m, { x: w.body.x + [30, 60, 500][i], aggroUntil: 1e9 }));
  assert.ok(cast(w, 'packhowl').ok);
  assert.equal(w.pose.kind, 'ptbomb');
  run(w, 0.4);
  assert.ok(w.mobs[0].frozenUntil > w.now && w.mobs[1].frozenUntil > w.now, 'the near ones are stunned');
  assert.ok(w.mobs[0].aggroUntil < w.now, 'and lose her');
  assert.equal(w.mobs[2].hp, 1e9, 'not the far one');
  const d = trickster({ loyalguard: 10 });
  d.god = false;
  d.bond = 100;
  d.bondAt = 1e9;
  const hp = d.char.hp;
  dice(0, () => hurtPlayer(d, 50, d.body.x + 20));
  assert.equal(d.char.hp, hp, 'a copy took it');
  assert.ok(d.copyGone?.some((t) => t > d.now), 'and popped');
});

test('Showstopper makes her copies hit harder for a while', () => {
  const hitBy = (show) => {
    const w = trickster({ snacktime: 10 });
    w.bond = 100;
    w.bondAt = 1e9;
    if (show) {
      assert.ok(cast(w, 'snacktime').ok);
      run(w, 1.2);
    }
    const hp = w.mobs.map((m) => m.hp);
    dice(0.5, () => looses(w, 2, ['ptarrow', 'ptbig']));
    return w.mobs.reduce((s, m, i) => s + hp[i] - m.hp, 0);
  };
  assert.ok(hitBy(true) > hitBy(false), 'harder');
});

test('Grand Illusion needs full Illusion, spends it, hides her, and a ring of copies all loose at once', () => {
  const w = trickster({ stampede: 8 });
  w.mobs.forEach((m, i) => Object.assign(m, { x: w.body.x + [-160, 120, 260][i] }));
  const hp0 = w.mobs.map((m) => m.hp);
  w.bond = 50;
  assert.equal(cast(w, 'stampede').reason, 'gauge:bond', 'waits for full Illusion');
  w.bond = 100;
  assert.ok(cast(w, 'stampede').ok);
  assert.equal(w.bond, 0, 'spends it');
  assert.equal(w.pose.kind, 'ptillusion');
  let spots = 0;
  let smoke = false;
  dice(0.5, () => {
    for (let i = 0; i < 60 * 2.6; i++) {
      updateWorld(w, DT, idle);
      spots = Math.max(spots, w.illusion?.spots.length ?? 0);
      smoke ||= w.fx.some((f) => f.kind === 'ptillusion');
    }
  });
  assert.ok(smoke && spots >= 8, `she vanishes and ${spots} copies appear`);
  assert.ok(w.mobs.every((m, i) => m.hp < hp0[i]), 'their arrows reach every monster round her, both sides');
  assert.equal(w.illusion, null, 'and she is back');
});

test("the Phantom Trickster has her own basic combo, and its shots land when they arrive", async () => {
  const { PATH_COMBOS } = await import('../src/world/melee.js');
  for (const job of ['beastmaster']) {
    const w = archer(job);
    const seen = [];
    const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
    for (let i = 0; i < 160; i++) {
      updateWorld(w, DT, hold);
      if (w.pose && seen.at(-1) !== w.pose.kind) seen.push(w.pose.kind);
    }
    assert.deepEqual(seen.slice(0, 3), PATH_COMBOS[job].map((s) => s.move), `${job} combo`);
    const v = archer(job);
    v.bolts = [];
    const m = v.mobs[0];
    updateWorld(v, DT, press('KeyZ'));
    run(v, 0.15);
    assert.equal(m.hp, 1e9, `${job}: nothing on the press`);
    run(v, 0.6);
    assert.ok(m.hp < 1e9, `${job}: the shot arrives and hits`);
  }
});

test('the archer paths have command shots: up at flyers, from the air, and on the run', () => {
  for (const [job, up, air, run0] of [['beastmaster', 'ptup', 'ptair', 'ptdash'], ['stormcaller', 'aeup', 'aeair', 'aeroll']]) {
    const w = archer(job);
    updateWorld(w, DT, { held: new Set(['ArrowUp', 'KeyZ']), pressed: new Set(['KeyZ']), locked: false });
    assert.equal(w.pose.kind, up, `${job}: up + attack shoots up`);
    run(w, 1);
    w.body.vy = -500;
    w.body.onGround = false;
    updateWorld(w, DT, press('KeyZ'));
    assert.equal(w.pose.kind, air, `${job}: a shot from the air`);
    assert.ok(w.hangUntil > w.now, 'it holds you up');
    run(w, 1.5);
    Object.assign(w.body, { x: 200, facing: 1 });
    run(w, 0.5, { held: new Set(['ArrowRight']), pressed: new Set(), locked: false });
    updateWorld(w, DT, { held: new Set(['ArrowRight', 'KeyZ']), pressed: new Set(['KeyZ']), locked: false });
    assert.equal(w.pose.kind, run0, `${job}: a running shot`);
  }
});

test("the Archer's skills go on as each path's arrows: gold and mint for her, plum for the Phantom Trickster", () => {
  for (const [job, shot] of [['archer', 'acarrow'], ['beastmaster', 'ptarrow'], ['stormcaller', 'aebolt']]) {
    const w = job === 'archer' ? range() : archer(job);
    w.char.skills.vault = 10;
    w.char.mp = 9999;
    assert.ok(cast(w, 'vault').ok, `${job} vaults`);
    let loosed = null;
    for (let i = 0; i < 70 && !loosed; i++) {
      updateWorld(w, DT, idle);
      loosed = w.fx.find((f) => f.kind === 'projectile')?.shot ?? null;
    }
    assert.equal(loosed, shot, `${job} looses ${shot}`);
  }
});

test('the Archer and the Phantom Trickster mix their own pools of shots, opening with their own combos', () => {
  for (const path of ['archer', 'beastmaster']) {
    const pool = PATH_VARIANTS[path];
    assert.equal(pool.length, PATH_COMBOS[path].length, `${path}: one choice per combo step`);
    pool.forEach((step, i) => {
      assert.equal(step[0], PATH_COMBOS[path][i], `${path} step ${i + 1} opens with the path's own`);
      assert.ok(step.length >= 2, `${path} step ${i + 1} has a choice`);
      for (const v of step) assert.ok(MOVES[v.move], `${path}: ${v.move} is a move`);
    });
    assert.ok(pool.at(-1).every((v) => v.finisher), `${path}: every last shot is a finisher`);
  }
});

test('arrows and bolts fly at the monster they hit, and follow it as it moves', () => {
  // From the air, a Stormcaller's bolts angle down at the monster below instead of flying straight
  // on over its head.
  const w = archer('stormcaller');
  w.body.vy = -500;
  w.body.onGround = false;
  run(w, 0.15);
  updateWorld(w, DT, press('KeyZ'));
  let shot = null;
  for (let i = 0; i < 60 && !shot; i++) {
    updateWorld(w, DT, idle);
    shot = w.fx.find((f) => f.kind === 'projectile');
  }
  assert.ok(shot, 'a bolt flies');
  assert.ok(shot.ty > shot.y + 5, `it angles down at the monster (${shot.y} -> ${shot.ty})`);
  // A shot heads for where its monster is now.
  const v = archer('beastmaster');
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

// ---------- The first jobs' gauges: the Thunderguard's Charge and the Archer's Momentum ----------

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

test("an Archer's shots build Momentum, more in a row; a hit knocks half of it away", async () => {
  const { hurtPlayer } = await import('../src/world/world.js');
  const w = range();
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  run(w, 1.2, hold);
  const built = w.momentum;
  assert.ok(built > 0, 'landing shots builds it');
  assert.ok(w.streak > 0, 'shots landing in a row keep a streak');
  w.god = false;
  w.char.hp = 99999;
  hurtPlayer(w, 10, w.body.x + 30);
  assert.ok(Math.abs(w.momentum - built / 2) < 0.01, 'a hit knocks half of it away');
  assert.equal(w.streak, 0, 'and breaks the streak');
  run(w, 9);
  assert.equal(w.momentum, 0, 'it fades once the fighting stops');
});

test('Showtime (full Combo): every shot splits into three arrows, and her flips keep the Combo from fading', () => {
  const arrows = (momentum) => {
    const w = range();
    w.momentum = momentum;
    w.momentumAt = 1e9;
    updateWorld(w, DT, press('KeyZ'));
    let n = 0;
    for (let i = 0; i < 40; i++) {
      updateWorld(w, DT, idle);
      n = Math.max(n, w.fx.filter((f) => f.kind === 'projectile').length);
    }
    return n;
  };
  assert.equal(arrows(0), 1, 'one arrow');
  assert.equal(arrows(100), 3, 'three under Showtime');
  // Mid-flip, the Combo holds; standing about, it fades.
  const w = range();
  w.momentum = 60;
  w.momentumAt = w.now;
  run(w, 4.5);
  const idleK = w.momentum;
  const f = range();
  f.momentum = 60;
  f.momentumAt = f.now;
  for (let i = 0; i < 60 * 4.5; i++) {
    if (!f.pose || f.pose.kind !== 'acflip') f.pose = { kind: 'acflip', since: f.now, dur: 9 };
    updateWorld(f, DT, idle);
  }
  assert.ok(f.momentum > idleK, `her flips keep it going (${Math.round(f.momentum)} against ${Math.round(idleK)})`);
});

test('Grand Somersault needs a full Combo, spends it, leaps high, and rains golden arrows on everything round her', () => {
  const w = range();
  w.char.skills.cometarrow = 10;
  w.char.mp = 9999;
  w.momentum = 70;
  assert.equal(cast(w, 'cometarrow').reason, 'gauge:momentum', 'waits for a full Combo');
  w.momentum = 100;
  assert.ok(cast(w, 'cometarrow').ok);
  assert.equal(w.momentum, 0, 'spends all of it');
  assert.equal(w.pose.kind, 'acsomersault');
  let high = 0;
  let burst = false;
  let rain = false;
  for (let i = 0; i < 60 * 2.4; i++) {
    updateWorld(w, DT, idle);
    if (w.pose?.kind === 'acsomersault') high = Math.max(high, MOVES.acsomersault((w.now - w.pose.since) / w.pose.dur).lift);
    burst ||= w.fx.some((f) => f.kind === 'acburst');
    rain ||= w.fx.some((f) => f.kind === 'rain' && f.variant === 'acarrow');
  }
  assert.ok(high > 50, `she leaps high (${Math.round(high)})`);
  assert.ok(burst && rain, 'a ring bursts round her and the arrows rain down');
  assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 3, 'on all of them');
  // The no-spam rule holds.
  w.momentum = 100;
  assert.ok(cast(w, 'cometarrow').ok);
  run(w, 0.3);
  w.momentum = 100;
  assert.equal(cast(w, 'cometarrow').reason, 'busy');
});

test('Down + attack shoots down at whatever is below, for every archer path', () => {
  for (const job of ['archer', 'beastmaster', 'stormcaller']) {
    const w = job === 'archer' ? range() : archer(job);
    // One monster on a ledge below, nothing in front.
    w.mobs = w.mobs.slice(0, 1);
    const m = w.mobs[0];
    m.x = w.body.x + 90;
    m.y = w.body.y + 100;
    updateWorld(w, DT, { held: new Set(['ArrowDown', 'KeyZ']), pressed: new Set(['KeyZ']), locked: false });
    assert.equal(w.pose.kind, job === 'stormcaller' ? 'aeair' : job === 'archer' ? 'acair' : 'ptair', `${job}: aims down`);
    let hit = false;
    for (let i = 0; i < 60; i++) {
      updateWorld(w, DT, idle);
      hit ||= w.pending.some((h) => h.mob === m) || m.hp < 1e9;
    }
    assert.ok(hit, `${job}: the shot finds the monster below`);
  }
});

test('the Archer has command shots too: up at fliers, from the air, and on the run', () => {
  const w = range();
  updateWorld(w, DT, { held: new Set(['ArrowUp']), pressed: new Set(['KeyZ']), locked: false });
  assert.equal(w.pose.kind, 'acup', 'up + attack: a backbend shot up');
  run(w, 0.6);
  w.body.onGround = false;
  w.body.vy = -200;
  w.attackTimer = 0;
  w.lockTimer = 0;
  w.basicReadyAt = 0;
  updateWorld(w, DT, press('KeyZ'));
  assert.equal(w.pose.kind, 'acair', 'shooting from the air');
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

// ---------- The Thief: Shadow, Phantom, and a dagger or a gauntlet ----------

function thief(weapon = 'dagger_20') {
  const w = arena(weapon);
  w.char.job = 'thief';
  w.char.mp = 9999;
  w.char.baseMp = 99999;
  if (weapon.startsWith('gauntlet')) w.mobs.forEach((m, i) => (m.x = 420 + i * 30));
  for (let i = 0; i < 5; i++) updateWorld(w, DT, idle);
  return w;
}

test('the Wind Dancer has her own four-blow string with each weapon, and every blow lands fast', () => {
  for (const [weapon, path] of [['dagger_20', 'thiefdagger'], ['gauntlet_20', 'thiefstar']]) {
    assert.equal(PATH_COMBOS[path].length, 4, `${path}: four blows`);
    assert.ok(PATH_COMBOS[path].at(-1).finisher, `${path}: a finish`);
    for (const st of PATH_COMBOS[path].map((x) => x.strikes[0].at * x.dur)) assert.ok(st <= 0.26, `${path}: lands in about a fifth of a second (${st.toFixed(2)})`);
    const w = thief(weapon);
    const seen = [];
    const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
    for (let i = 0; i < 150; i++) {
      updateWorld(w, DT, hold);
      if (w.pose && seen.at(-1)?.step !== w.combo) seen.push({ step: w.combo, move: w.pose.kind });
    }
    assert.deepEqual(seen.slice(0, 4).map((x) => x.move), PATH_COMBOS[path].map((x) => x.move), path);
    assert.ok(w.mobs.some((m) => m.hp < 1e9), `${weapon} hits`);
  }
});
test("the Wind Dancer's strings mix her own pools of swings, and every one comes up", () => {
  for (const [weapon, path] of [['dagger_20', 'thiefdagger'], ['gauntlet_20', 'thiefstar']]) {
    const steps = PATH_VARIANTS[path];
    assert.equal(steps.length, PATH_COMBOS[path].length, `${path}: a choice for every step`);
    steps.forEach((choices, i) => {
      assert.equal(choices[0], PATH_COMBOS[path][i], `${path}: her own swing comes first`);
      assert.ok(choices.length >= 2, `${path}: step ${i + 1} has a choice`);
      for (const x of choices) assert.ok(MOVES[x.move], `${path}: ${x.move} is drawn`);
    });
    assert.ok(steps.at(-1).every((x) => x.finisher), `${path}: every last swing is a finisher`);
    const w = thief(weapon);
    const seen = new Set();
    let seed = 11;
    dice(0, () => {
      Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 60 * 60; i++) {
        w.char.mp = 9999;
        if (!w.pose) w.body.x = Math.max(w.body.x, 300);
        updateWorld(w, DT, { held: new Set(['KeyZ']), pressed: new Set(), locked: false });
        if (w.pose) seen.add(w.pose.kind);
      }
    });
    for (const x of steps.flat()) assert.ok(seen.has(x.move), `${path}: ${x.move} came up`);
  }
});
test("a Thief's hits build Shadow, faster in a quick chain, and it fades once the fighting stops", (t) => {
  // Crits and the basic combo's swings are random: a fixed sequence keeps the comparison fair
  // (and the test steady).
  let seed = 8080;
  t.mock.method(Math, 'random', () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648));
  const w = thief();
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  run(w, 1.5, hold);
  assert.ok(w.shadow > 0, 'hits build it');
  assert.ok(w.chain > 2, 'quick hits keep a chain going');
  const chained = w.shadow;
  // The same hits spread out (the chain broken each time) build less.
  const slow = thief();
  for (let i = 0; i < 4; i++) {
    updateWorld(slow, DT, press('KeyZ'));
    run(slow, 1.2);
  }
  // (An opener can be a two-stab burst, a chain of its own, but nothing carries between presses.)
  assert.ok((slow.chain ?? 0) <= 1, 'slow hits break the chain');
  assert.ok(slow.shadow < chained, `a broken chain builds less (${slow.shadow} vs ${chained})`);
  run(w, 10);
  assert.equal(w.shadow, 0, 'faded once the fighting stopped');
});

test('full Encore (Standing Ovation): every attack strikes twice, with chakrams or gloves', () => {
  for (const weapon of ['dagger_20', 'gauntlet_20']) {
    const hits = (encore) => {
      const w = thief(weapon);
      w.shadow = encore;
      w.shadowAt = 1e9;
      let n = 0;
      let last = w.mobs[0].hp;
      updateWorld(w, DT, press('KeyZ'));
      for (let i = 0; i < 40; i++) {
        updateWorld(w, DT, idle);
        if (w.mobs[0].hp < last) n += 1;
        last = w.mobs[0].hp;
      }
      return n;
    };
    assert.equal(hits(100), hits(0) * 2, `${weapon}: each blow lands twice`);
  }
});
test("the Wind Dancer's masteries count only with their own weapon; Pirouette works with both", () => {
  for (const weapon of ['dagger_20', 'gauntlet_20']) {
    const w = thief(weapon);
    w.char.skills.pirouette = 10;
    const x = w.body.x;
    assert.ok(cast(w, 'pirouette').ok, `Pirouette with ${weapon}`);
    assert.ok(w.invuln > 0, 'untouchable on the way');
    run(w, 0.6);
    assert.ok(w.body.x > x + 60, 'spun forward');
  }
});
test('Grand Finale needs full Encore, spends it, and lands on the whole line with either weapon', () => {
  for (const weapon of ['dagger_20', 'gauntlet_20']) {
    const w = thief(weapon);
    w.char.skills.grandfinale = 10;
    w.shadow = 80;
    assert.equal(cast(w, 'grandfinale').reason, 'gauge:shadow', 'waits for full Encore');
    w.shadow = 100;
    assert.ok(cast(w, 'grandfinale').ok);
    assert.equal(w.shadow, 0, 'spends all of it');
    assert.ok(w.fx.some((f) => f.kind === 'wdfinale') || w.strikes.some((x) => x.burst === 'wdfinale'), 'the spotlight drops');
    run(w, 2);
    assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 3, 'hits the whole line');
    assert.ok((w.shadow ?? 0) < 100, 'and does not refill it');
  }
});

test('Ribbon Lash whirls on from her swings, Gust Line flies from the last blow of a string', () => {
  const w = thief();
  w.char.skills.ribbonlash = 20;
  w.char.skills.gustline = 20;
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  const keys = new Set();
  for (let i = 0; i < 60 * 6; i++) {
    updateWorld(w, DT, hold);
    for (const x of w.strikes) keys.add(x.key);
  }
  assert.ok(keys.has('procribbonlash'), 'a lash of ribbons');
  assert.ok(keys.has('procgustline'), 'a gust down the line');
});

test('Spotlight: Encore filling dazzles everything around her and speeds up the party', () => {
  const w = thief();
  w.char.skills.spotlight = 10;
  w.shadow = 99;
  w.shadowAt = w.now;
  addShadow(w, 10);
  assert.ok(w.char.buffs.spotlight, 'the buff');
  assert.ok(w.strikes.some((x) => x.key === 'procspotlight' && x.stun), 'the dazzle');
});

test('Light Feet: a hit on her sometimes sets her dancing out of reach', async () => {
  const { danceOnHit } = await import('../src/world/combat.js');
  const w = thief();
  w.char.skills.lightfeet = 20;
  w.invuln = 0;
  danceOnHit(w, () => 0);
  assert.ok(w.invuln > 0.5, 'untouchable a moment');
  assert.ok(w.char.buffs.lightfeet, 'and harder to hit');
  const before = w.char.buffs.lightfeet.until;
  danceOnHit(w, () => 0);
  assert.equal(w.char.buffs.lightfeet.until, before, 'not again while it is up');
});
test("a weapon's own mastery only counts while that weapon is held, and grows with your level", async () => {
  const { passiveBonus } = await import('../src/core/stats.js');
  const w = thief();
  w.char.level = 12;
  const early = passiveBonus(w.char).watk ?? 0;
  w.char.level = 28;
  const later = passiveBonus(w.char).watk ?? 0;
  assert.ok(early > 0 && later > early, `Dagger Mastery with a dagger, growing (${early} -> ${later})`);
  w.char.equipment.weapon = makeEquip('gauntlet_20', {});
  assert.equal(passiveBonus(w.char).watk ?? 0, 0, 'nothing from it with a gauntlet');
});

// ---------- The dancer's paths: the Blade Dancer (chakrams, Ricochet) and the Sky Dancer (gloves, Tailwind) ----------

function thiefPath(job) {
  const weapon = job === 'shinobi' ? 'dagger_20' : 'gauntlet_20';
  const w = arena(weapon);
  const c = createCharacter('T', {});
  gainExp(c, 4e6);
  advanceJob(c, 'thief');
  c.quests.thief_trial = { state: 'done', kills: {} };
  assert.ok(advanceJob(c, job), `advanced to ${job}`);
  c.equipment.weapon = makeEquip(weapon, {});
  c.mp = 9999;
  c.baseMp = 99999;
  w.char = c;
  if (job === 'kitsune') w.mobs.forEach((m, i) => (m.x = 420 + i * 30));
  for (let i = 0; i < 10; i++) updateWorld(w, DT, idle);
  return w;
}
const learn = (w, id, lv = 10) => (w.char.skills[id] = lv);
const castNow = (w, id) => {
  w.char.mp = 9999;
  return cast(w, id);
};

test("both thief paths wait on Vex's trial, and each keeps to its own weapon", async () => {
  const { JOBS } = await import('../src/data/jobs.js');
  const c = createCharacter('T', {});
  gainExp(c, 4e6);
  advanceJob(c, 'thief');
  assert.equal(advanceJob(c, 'shinobi'), false, 'not before the trial');
  assert.deepEqual(JOBS.shinobi.weapons, ['dagger']);
  assert.deepEqual(JOBS.kitsune.weapons, ['gauntlet']);
});

test('each thief path has its own basic combo, and mixes its own pool of swings or throws', () => {
  for (const job of ['shinobi', 'kitsune']) {
    const steps = PATH_VARIANTS[job];
    assert.equal(steps.length, PATH_COMBOS[job].length, `${job}: a choice for every step`);
    steps.forEach((choices, i) => {
      assert.equal(choices[0], PATH_COMBOS[job][i], `${job}: her own comes first`);
      assert.ok(choices.length >= 2, `${job}: step ${i + 1} has a choice`);
      for (const st of choices) assert.ok(MOVES[st.move], `${job}: ${st.move} is drawn`);
    });
    assert.ok(steps.at(-1).every((st) => st.finisher), `${job}: every last one is a finisher`);
    const w = thiefPath(job);
    const seen = [];
    const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
    for (let i = 0; i < 120; i++) {
      updateWorld(w, DT, hold);
      if (w.pose && seen.at(-1)?.step !== w.combo) seen.push({ step: w.combo, move: w.pose.kind });
    }
    assert.deepEqual(seen.slice(0, PATH_COMBOS[job].length).map((x) => x.move), PATH_COMBOS[job].map((x) => x.move), job);
    assert.ok(w.mobs.some((m) => m.hp < 1e9), `${job} hits`);
  }
});

test("a Blade Dancer's ring bounces on from monster to monster, then flies home to her hand", () => {
  const w = thiefPath('shinobi');
  w.mobs.forEach((m, i) => (m.x = 360 + i * 70));
  const start = w.mobs.map((m) => m.hp);
  const seen = new Set();
  let home = false;
  updateWorld(w, DT, press('KeyZ'));
  assert.equal(w.pose.kind, 'bdflick', 'her flick throw');
  dice(0, () => {
    for (let i = 0; i < 60; i++) {
      updateWorld(w, DT, idle);
      for (const f of w.fx) {
        seen.add(f.kind);
        if (f.kind === 'projectile' && f.shot === 'ring' && f.home && f.t > 0) home = true;
      }
    }
  });
  assert.ok(w.mobs.filter((m, i) => m.hp < start[i]).length >= 2, 'it hits one and bounces on to another');
  assert.ok(seen.has('bdbounce'), 'a spark where it ricochets');
  assert.ok(home, 'and it flies home to her hand');
});

test("Ricochet builds from her rings landing and bouncing, and fades once the fighting stops", () => {
  const w = thiefPath('shinobi');
  run(w, 1.5, { held: new Set(['KeyZ']), pressed: new Set(), locked: false });
  assert.ok(w.ki > 0, 'her rings build it');
  for (const m of w.mobs) Object.assign(m, { x: w.body.x + 2000, aggroUntil: 0 });
  run(w, 12);
  assert.equal(w.ki, 0, 'faded');
});

test('full Ricochet (Carousel): two rings orbit her and cut whatever comes close, on their own', () => {
  const cut = (ki) => {
    const w = thiefPath('shinobi');
    w.ki = ki;
    w.kiAt = 1e9;
    const hp = w.mobs[0].hp;
    dice(0, () => run(w, 1));
    return hp - w.mobs[0].hp;
  };
  assert.equal(cut(0), 0, 'nothing without it');
  assert.ok(cut(100) > 0, 'the rings cut the monster beside her');
});

test('Rebound sends a ring bouncing further, and Twin Rings sends a second after it', () => {
  const throwOnce = (skills) => {
    const w = thiefPath('shinobi');
    for (const id of skills) learn(w, id);
    w.mobs = [];
    for (let i = 0; i < 6; i++) {
      const m = spawnMob(w.map, { mob: 'boarlet', x: 360 + i * 60, y: w.map.groundY });
      m.def = { ...m.def, hp: 1e9, eva: 0, aggro: false, speed: 0 };
      m.hp = 1e9;
      w.mobs.push(m);
    }
    let twins = 0;
    dice(0, () => {
      updateWorld(w, DT, press('KeyZ'));
      for (let i = 0; i < 70; i++) {
        updateWorld(w, DT, idle);
        twins = Math.max(twins, w.fx.filter((f) => f.kind === 'projectile' && f.twin).length);
      }
    });
    return { hit: w.mobs.filter((m) => m.hp < 1e9).length, twins };
  };
  const plain = throwOnce([]);
  assert.equal(plain.hit, 2, 'the flick bounces once');
  assert.equal(plain.twins, 0);
  assert.ok(throwOnce(['rebound']).hit >= 4, 'Rebound: two or three bounces more');
  assert.ok(throwOnce(['twinrings']).twins > 0, 'Twin Rings: a second ring');
});

test("a Sky Dancer's every blow lifts her: she stays up while she attacks, and drifts down softly when she stops", () => {
  const w = thiefPath('kitsune');
  const ground = w.body.y;
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  updateWorld(w, DT, press('KeyZ'));
  assert.equal(w.pose.kind, 'sdpalm', 'her palm push');
  run(w, 0.3, hold);
  assert.ok(!w.body.onGround && ground - w.body.y > 20, `the first blow hops her up (${(ground - w.body.y).toFixed(0)}px)`);
  let low = Infinity;
  let high = 0;
  for (let i = 0; i < 3 * 60; i++) {
    updateWorld(w, DT, hold);
    low = Math.min(low, ground - w.body.y);
    high = Math.max(high, ground - w.body.y);
  }
  assert.ok(low > 10, `she stays up while she keeps attacking (lowest ${low.toFixed(0)}px)`);
  assert.ok(high < 130, `but never flies off (highest ${high.toFixed(0)}px)`);
  assert.ok(w.mobs.some((m) => m.hp < 1e9), 'her gusts land');
  // Let go: a soft drift down, then she lands. (She hovers about 55-65 px up, so at the drift's
  // 70 px/s she's still on her way down half a second later; let go in the middle of a diving
  // chop, the dive carries her to the ground first.)
  let dove = false;
  for (let i = 0; i < 0.5 * 60; i++) {
    updateWorld(w, DT, idle);
    if (w.body.onGround && i < 20) dove = true;
  }
  assert.ok(dove || (!w.body.onGround && w.body.vy <= 75), `drifting down (${w.body.vy.toFixed(0)}px/s)`);
  run(w, 4);
  assert.ok(w.body.onGround, 'and lands');
});

test('Tailwind builds faster in the air, fades once the fighting stops, and full, she flies freely', () => {
  const w = thiefPath('kitsune');
  run(w, 1.5, { held: new Set(['KeyZ']), pressed: new Set(), locked: false });
  assert.ok(w.tails > 0, 'her hits build it');
  for (const m of w.mobs) Object.assign(m, { x: w.body.x + 2000, aggroUntil: 0 });
  run(w, 14);
  assert.equal(w.tails, 0, 'faded');
  const v = thiefPath('kitsune');
  v.tails = 100;
  v.tailsAt = 1e9;
  updateWorld(v, DT, press('KeyZ'));
  run(v, 0.5);
  const y0 = v.body.y;
  run(v, 0.6, { held: new Set(['ArrowUp']), pressed: new Set(), locked: false });
  assert.ok(v.body.y < y0 - 40, `Up flies her higher (${(y0 - v.body.y).toFixed(0)}px)`);
  const y1 = v.body.y;
  run(v, 1);
  assert.ok(Math.abs(v.body.y - y1) < 12, 'and she hovers there');
});

// Every Sky Dancer move lifts her off the ground, so a skill's step has to carry her through the air
// (her Pirouette drifts her across like a leaf on the wind, as the Blade Dancer's promenade does).
test("the Sky Dancer's Pirouette carries her through the air and hits what she passes", () => {
  const w = thiefPath('kitsune');
  w.mobs.forEach((m, i) => Object.assign(m, { x: w.body.x + 110 + i * 40, hp: 1e9 }));
  w.char.skills.pirouette = 10;
  const x0 = w.body.x;
  assert.ok(cast(w, 'pirouette').ok);
  run(w, 1);
  assert.ok(w.body.x - x0 > 100, `she travels (${(w.body.x - x0).toFixed(0)}px)`);
  assert.ok(w.mobs.some((m) => m.hp < 1e9), 'and her whirl hits');
});

test('Updraft throws them up in a rising whirl, and Zephyr sends a second gust in the air', () => {
  const gusts = (skills) => {
    const w = thiefPath('kitsune');
    for (const id of skills) learn(w, id);
    let n = 0;
    let launched = false;
    let up = false;
    dice(0, () => {
      updateWorld(w, DT, press('KeyZ'));
      for (let i = 0; i < 40; i++) {
        updateWorld(w, DT, idle);
        n = Math.max(n, w.fx.filter((f) => f.kind === 'projectile' && f.shot?.startsWith('skygust')).length);
        launched ||= w.mobs.some((m) => (m.air ?? 0) > 20);
        up ||= w.fx.some((f) => f.kind === 'skyupdraft');
      }
    });
    return { n, launched, up };
  };
  const plain = gusts([]);
  assert.equal(plain.n, 1, 'one gust');
  assert.equal(plain.up, false);
  const u = gusts(['updraft']);
  assert.ok(u.up && u.launched, 'Updraft: a rising whirl throws them up');
  assert.ok(gusts(['zephyr']).n >= 2, 'Zephyr: a second gust');
});

test("each thief path's finisher needs its gauge full, spends it, and lands its big moment", () => {
  for (const [job, skill, gauge, burst] of [['shinobi', 'goldencarousel', 'ki', 'bdcarousel'], ['kitsune', 'skywaltz', 'tails', 'skytornado']]) {
    const w = thiefPath(job);
    learn(w, skill);
    w[gauge] = 50;
    assert.equal(castNow(w, skill).reason, `gauge:${gauge}`, `${skill} waits for a full gauge`);
    w[gauge] = 100;
    w[`${gauge}At`] = w.now;
    assert.ok(castNow(w, skill).ok, `${skill} goes off`);
    assert.equal(w[gauge], 0, `${skill} spends it`);
    run(w, 2);
    assert.ok(w.fx.some((f) => f.kind === burst) || w.mobs.some((m) => m.hp < 1e9), `${skill} lands`);
    assert.ok(w[gauge] < 100, `${skill} doesn't refill it`);
  }
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
  const families = { warrior: ['warrior'], stormwall: ['warrior', 'stormwall'], tempest: ['warrior', 'tempest'], archer: ['archer'], beastmaster: ['archer', 'beastmaster'], stormcaller: ['archer', 'stormcaller'], thief: ['thief'], thiefstar: ['thief'], shinobi: ['thief', 'shinobi'], kitsune: ['thief', 'kitsune'] };
  const weapons = { warrior: 'sword_20', stormwall: 'sword_20', tempest: 'sword_20', archer: 'bow_20', beastmaster: 'bow_20', stormcaller: 'crossbow_20', thief: 'dagger_20', thiefstar: 'gauntlet_20', shinobi: 'dagger_20', kitsune: 'gauntlet_20' };
  for (const [label, fam] of Object.entries(families)) {
    // (A Thief fights with either weapon: `thiefstar` is her with a gauntlet.)
    const job = label === 'thiefstar' ? 'thief' : label;
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
  for (const [job, weapon, skill] of [['warrior', 'sword_20', 'thunderrush'], ['archer', 'bow_20', 'vault'], ['thief', 'gauntlet_20', 'pirouette'], ['thief', 'dagger_20', 'pirouette']]) {
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

// ---------- The Stormcaller (crossbow, Charge) ----------

test('the Arbalist Engineer fights with her own brass bolts and her own pool of shots, and they build Pressure', () => {
  const pool = PATH_VARIANTS.stormcaller;
  assert.equal(pool.length, PATH_COMBOS.stormcaller.length, 'one choice per combo step');
  pool.forEach((step, i) => {
    assert.equal(step[0], PATH_COMBOS.stormcaller[i], `step ${i + 1} opens with her own`);
    assert.ok(step.length >= 2, `step ${i + 1} has a choice`);
    for (const v of step) assert.ok(MOVES[v.move], `${v.move} is a move`);
  });
  assert.ok(pool.at(-1).every((v) => v.finisher), 'every last shot is a finisher');
  const w = archer('stormcaller');
  const seen = [];
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  let shot = null;
  for (let i = 0; i < 160; i++) {
    updateWorld(w, DT, hold);
    if (w.pose && seen.at(-1) !== w.pose.kind) seen.push(w.pose.kind);
    shot ??= w.fx.find((f) => f.kind === 'projectile')?.shot;
  }
  assert.deepEqual(seen.slice(0, 4), PATH_COMBOS.stormcaller.map((s) => s.move), 'her combo');
  assert.equal(shot, 'aebolt', 'brass bolts');
  assert.ok(w.charge > 0, `her bolts build Pressure (${w.charge})`);
  const before = w.charge;
  run(w, 8);
  assert.ok(w.charge < before, 'and it fades');
});

test('Overdrive (full Pressure): every shot fires a second bolt', () => {
  const bolts = (charge) => {
    const w = archer('stormcaller');
    w.charge = charge;
    w.chargeAt = 1e9;
    updateWorld(w, DT, press('KeyZ'));
    let n = 0;
    for (let i = 0; i < 30; i++) {
      updateWorld(w, DT, idle);
      n = Math.max(n, w.fx.filter((f) => f.kind === 'projectile').length);
    }
    return n;
  };
  assert.equal(bolts(0), 1);
  assert.equal(bolts(100), 2);
});

test('Sticky Bolt sticks and bursts a moment later on everything close; Cluster Bolt splits the last bolt into bomblets', () => {
  const w = archer('stormcaller');
  w.char.skills.stickybolt = 20;
  w.mobs.forEach((m, i) => (m.x = w.body.x + 120 + i * 20));
  const seen = new Set();
  dice(0, () => {
    updateWorld(w, DT, press('KeyZ'));
    for (let i = 0; i < 90; i++) {
      updateWorld(w, DT, idle);
      for (const f of w.fx) seen.add(f.kind);
    }
  });
  assert.ok(seen.has('aestick') && seen.has('aeboom'), 'it sticks, then bursts');
  assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 3, 'catching the monsters close by');
  const c = archer('stormcaller');
  c.char.skills.clusterbolt = 20;
  c.combo = 2;
  c.comboUntil = c.now + 9;
  c.comboPlan = [0, 0, 0, 0];
  let booms = 0;
  dice(0, () => {
    updateWorld(c, DT, press('KeyZ'));
    for (let i = 0; i < 90; i++) {
      updateWorld(c, DT, idle);
      booms = Math.max(booms, c.fx.filter((f) => f.kind === 'aeboom' && f.small).length);
    }
  });
  assert.ok(booms >= 3, `the finisher's bolt splits into bomblets (${booms})`);
});

test('Steam Vent: a hit she takes is softened, and the steam throws the monster back', async () => {
  const { hurtPlayer } = await import('../src/world/world.js');
  const taken = (vent) => {
    const w = archer('stormcaller');
    w.god = false;
    if (vent) w.char.skills.steamvent = 10;
    const m = w.mobs[0];
    m.x = w.body.x + 30;
    const hp = w.char.hp;
    let lost = 0;
    dice(0, () => {
      hurtPlayer(w, 300, m.x);
      lost = hp - w.char.hp;
      run(w, 0.3);
    });
    return { lost, struck: m.hp < 1e9, steam: w.fx.some((f) => f.kind === 'aesteam') };
  };
  const plain = taken(false);
  const vent = taken(true);
  assert.ok(vent.lost < plain.lost, `softened (${vent.lost} < ${plain.lost})`);
  assert.ok(vent.struck && vent.steam && !plain.struck, 'the steam hits the monster that hit her');
});

test('Deploy Turret: she sets a turret down, it fires at the monsters on its own, and packs away when its time is up', () => {
  const w = archer('stormcaller');
  w.char.skills.deployturret = 10;
  assert.ok(cast(w, 'deployturret').ok);
  assert.equal(w.pose.kind, 'aedeploy');
  run(w, 0.6);
  assert.ok(w.turret, 'a turret stands in front of her');
  const hp = w.mobs.map((m) => m.hp);
  let shots = 0;
  for (let i = 0; i < 60 * 3; i++) {
    const before = w.turret?.firedAt;
    updateWorld(w, DT, idle);
    if (w.turret && w.turret.firedAt !== before) shots++;
  }
  assert.ok(shots >= 4, `it fires on its own (${shots})`);
  assert.ok(w.mobs.some((m, i) => m.hp < hp[i]), 'and its bolts land');
  run(w, 35);
  assert.equal(w.turret, null, 'packed away');
});

test('Overclock: her next few bolts go out heavy and piercing, then it ends', () => {
  const w = archer('stormcaller');
  w.char.skills.overclock = 10;
  assert.ok(cast(w, 'overclock').ok);
  run(w, 1.2);
  const shots = w.char.buffs.overclock.values.shots;
  const seen = [];
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  dice(0.5, () => {
    for (let i = 0; i < 60 * 8; i++) {
      updateWorld(w, DT, hold);
      for (const f of w.fx) if (f.kind === 'projectile' && !f.counted) {
        f.counted = true;
        seen.push(f.shot);
      }
    }
  });
  assert.equal(seen.slice(0, shots).filter((s) => s === 'aebig').length, shots, `the first ${shots} are heavy`);
  assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 3, 'tearing through the whole line');
});

test('Big Bertha needs full Pressure, spends it, and its enormous bolt blasts through everything', () => {
  const w = archer('stormcaller');
  w.char.skills.bigbertha = 10;
  w.charge = 50;
  assert.equal(cast(w, 'bigbertha').reason, 'gauge:charge', 'waits for full Pressure');
  w.charge = 100;
  w.chargeAt = w.now;
  assert.ok(cast(w, 'bigbertha').ok);
  assert.equal(w.charge, 0, 'spends it');
  let ballista = false;
  let bertha = false;
  dice(0.5, () => {
    for (let i = 0; i < 60 * 2.5; i++) {
      updateWorld(w, DT, idle);
      ballista ||= w.fx.some((f) => f.kind === 'aeballista');
      bertha ||= w.fx.some((f) => f.kind === 'projectile' && f.shot === 'aebertha');
    }
  });
  assert.ok(ballista && bertha, 'the ballista unfolds and fires');
  assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 3, 'through every monster ahead');
  assert.ok(w.charge < 10, `and it never refills (${w.charge})`);
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

// Blast Arrow is the Archer's, but each path's burst is its own: the Archer's fire, the
// Beastmaster's gale of wind and leaves, the Stormcaller's thunderclap.
test("each archer path's Blast Arrow bursts in its own look", () => {
  for (const [job, kind] of [['beastmaster', 'ptsmoke'], ['stormcaller', 'aeboom']]) {
    const w = archer(job);
    w.char.skills.blastarrow = 20;
    const seen = new Set();
    dice(0.01, () => {
      updateWorld(w, DT, press('KeyZ'));
      for (let i = 0; i < 60; i++) {
        updateWorld(w, DT, idle);
        for (const f of w.fx) seen.add(f.kind);
      }
    });
    assert.ok(seen.has(kind), `${job}'s arrow bursts as ${kind}`);
    assert.ok(!seen.has('blast'), `${job}'s arrow isn't the Archer's fire`);
  }
});

// Every path's buff rises in its own pillar, ring and emblem (the Stormcaller's once came up in the
// Warrior's steel blue, and neither archer path had an emblem).
test("the archer paths' buffs rise in their own colours with their own emblems", async () => {
  const { pillarSprite, ringOf } = await import('../src/render/warrior-fx.js');
  const { FX_SHEETS } = await import('../src/render/fx-sheets.js');
  assert.equal(pillarSprite('storm'), 'celpillarstorm');
  assert.equal(ringOf('storm'), 'celringstorm');
  assert.equal(pillarSprite('wind'), 'celpillarwind');
  for (const name of ['celpillarstorm', 'celringstorm', 'celembstorm', 'celembwind', 'celgaleblast', 'celthunderblast']) assert.ok(FX_SHEETS[name], name);
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
