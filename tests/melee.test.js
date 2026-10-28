// Melee combos: basic attacks chain through a weapon's steps into a finisher, blows land as the
// blade cuts (not when the key is pressed), launchers pop monsters up, the warrior's combo skills
// carry on step by step, and once a blow lands you can move or cut in with a skill.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { createCharacter, gainExp, advanceJob } from '../src/core/character.js';
import { makeEquip } from '../src/core/items.js';
import { spawnMob } from '../src/world/mobs.js';
import { PATH_COMBOS, PATH_VARIANTS, planCombo, MAX_STOP } from '../src/world/melee.js';
import { MOVES } from '../src/render/moves.js';
import { cast } from '../src/world/combat.js';
import { addItem } from '../src/core/inventory.js';

const DT = 1 / 60;
const idle = { held: new Set(), pressed: new Set(), locked: false };

// A level 25 warrior in Mossy Woods with a row of very sturdy boars in front.
function arena(weapon = 'sword_20') {
  const c = createCharacter('W', {});
  gainExp(c, 1e6);
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

test("the Warrior's combo mixes its swings: a fresh string each time, never the same one twice", () => {
  const steps = PATH_VARIANTS.warrior;
  assert.equal(steps.length, PATH_COMBOS.warrior.length);
  for (const [i, choices] of steps.entries()) {
    assert.equal(choices[0], PATH_COMBOS.warrior[i], 'the first choice is the plain combo');
    for (const s of choices) assert.ok(MOVES[s.move], `${s.move} is drawn`);
  }
  const fresh = steps.flat().map((s) => s.move).filter((m) => !PATH_COMBOS.warrior.some((s) => s.move === m));
  assert.equal(new Set(fresh).size, 10, `ten new swings (${fresh})`);
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
  assert.equal(w.pose.kind, 'rising', 'the launcher');
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
  assert.equal(w.pose.kind, 'plunge', 'the slam');
  run(w, 0.7);
  assert.ok(m.hp < before, 'it lands');
});

test('Titan Breaker needs full Valor, spends it, and lands its crash and its aftershock', () => {
  const w = arena('axe_20');
  w.char.skills.titanbreak = 10;
  w.char.mp = 999;
  const m = w.mobs[0];
  w.valor = 90;
  assert.equal(cast(w, 'titanbreak').reason, 'gauge:valor', 'waits for full Valor');
  w.valor = 100;
  assert.ok(cast(w, 'titanbreak').ok);
  assert.equal(w.valor, 0, 'spends all of it');
  const marks = [];
  let last = m.hp;
  for (let i = 0; i < 100; i++) {
    updateWorld(w, DT, idle);
    if (m.hp < last) marks.push(i);
    last = m.hp;
  }
  assert.equal(marks.length, 2, `two blows (at frames ${marks})`);
  assert.ok(marks[0] > 50, 'the crash lands after the leap, not on the press');
  assert.equal(w.valor ?? 0, 0, 'it does not refill Valor');
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
  // Whirlwind: the combo's finisher catches all three boars, so it always spins on.
  const w = arena();
  w.char.skills.whirlwind = 10;
  w.combo = PATH_COMBOS.warrior.length - 2;
  w.comboUntil = w.now + 1;
  updateWorld(w, DT, { held: new Set(), pressed: new Set(['KeyZ']), locked: false });
  const s = stops(w, 120);
  const spin = s.slice(1);
  assert.equal(spin.length, 5, `five blows after the cleave (${s.length} in all)`);
  assert.ok(spin[0].stop > 0 && spin[4].stop > 0, 'first and last stop');
  for (const mid of spin.slice(1, 4)) assert.equal(mid.stop, 0, 'the middle blows flow');
});

test('no freeze runs past MAX_STOP: the heaviest blows add slow motion instead', () => {
  const w = arena('axe_20');
  w.char.skills.titanbreak = 10;
  w.char.mp = 999;
  w.valor = 100;
  assert.ok(cast(w, 'titanbreak').ok);
  const s = stops(w, 100);
  assert.equal(s.length, 2);
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
  w.char.skills.shouldercharge = 5;
  w.char.mp = 999;
  updateWorld(w, DT, { held: new Set(), pressed: new Set(['KeyZ']), locked: false });
  run(w, 0.05);
  const x = w.body.x;
  updateWorld(w, DT, { held: new Set(['ArrowLeft']), pressed: new Set(), locked: false });
  assert.ok(w.attackTimer > 0, 'still winding up: no cancel before the blow');
  run(w, 0.2);
  assert.equal(cast(w, 'shouldercharge').ok, true, 'a skill cuts into the recovery');
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
  assert.ok(w.body.x < x, 'hopped back while shooting');
});

test('the finishing arrow pierces the whole line', () => {
  const w = range();
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  for (let i = 0; i < 150; i++) updateWorld(w, DT, hold);
  assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 3, 'all three in the line got hit');
});

test("the archer's tricks go off on their own: Blast Arrow bursts, Snare Arrow nets, Spring Trap snaps", () => {
  const w = range();
  Object.assign(w.char.skills, { blastarrow: 20, snarearrow: 20, springtrap: 20 });
  for (const id of ['blastarrow', 'snarearrow', 'springtrap']) assert.equal(cast(w, id).reason, 'passive', `${id} is not a key to press`);
  // A lucky shot bursts on its target (catching the ones beside it) and nets it in place.
  let burst = false;
  dice(0.01, () => {
    updateWorld(w, DT, press('KeyZ'));
    for (let i = 0; i < 40; i++) {
      updateWorld(w, DT, idle);
      burst ||= w.fx.some((f) => f.kind === 'blast');
    }
  });
  assert.ok(burst, 'the arrow burst on impact');
  assert.ok(w.mobs.filter((m) => m.hp < 1e9).length >= 2, 'catching the monsters beside its target');
  assert.ok(w.mobs.some((m) => m.hold === 'snare' && m.frozenUntil > w.now), 'a net holds its target');
  // Spring Trap: the combo's last shot drops a trap ahead; a monster walking onto it is flung up.
  const v = range();
  v.char.skills.springtrap = 20;
  dice(0.01, () => {
    finisher(v);
    run(v, 0.8);
  });
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
  for (const [job, weapon, skill] of [['mage', 'wand_20', 'petalbolt'], ['thief', 'gauntlet_20', 'luckyseven'], ['thief', 'dagger_20', 'twinfang'], ['warrior', 'sword_20', 'shouldercharge']]) {
    const w = arena(weapon);
    w.char.job = job;
    if (weapon.startsWith('gauntlet')) addItem(w.char.inventory, 'star_pebble', 500);
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
    w.char.skills.shouldercharge = 10;
    w.char.hotkeys.KeyA = { skill: 'shouldercharge' };
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
  assert.equal(advanceJob(w.char, 'paladin'), false, 'no path before the trial');
  assert.equal(questState(w.char, 'warrior_trial'), 'available');
  assert.ok(acceptQuest(w.char, 'warrior_trial'));
  w.char.quests.warrior_trial.state = 'done';
  assert.ok(advanceJob(w.char, 'berserker'));
  const mage = createCharacter('M', {});
  gainExp(mage, 1e6);
  advanceJob(mage, 'mage');
  assert.equal(questState(mage, 'warrior_trial'), 'locked', 'only warriors take it');
});

test('Paladins tank and Berserkers deal damage in a group', async () => {
  const { roleOf } = await import('../src/data/dungeons.js');
  assert.equal(roleOf('paladin', 'warrior'), 'tank');
  assert.equal(roleOf('berserker', 'warrior'), 'dps');
  assert.equal(roleOf('warrior', 'warrior'), 'tank');
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

test("Aegis Smite: a swing sometimes calls down a pillar of light that stuns, hit or miss", () => {
  const w = advanced('paladin');
  w.char.skills.aegissmite = 20;
  assert.equal(cast(w, 'aegissmite').reason, 'passive', 'not a key to press any more');
  const said = new Set();
  dice(0.01, () => {
    updateWorld(w, DT, press('KeyZ'));
    for (let i = 0; i < 40; i++) {
      updateWorld(w, DT, idle);
      for (const s of w.strikes) said.add(s.key);
    }
  });
  assert.ok(said.has('procaegissmite'), 'the pillar comes down');
  assert.ok(w.fx.some((f) => f.kind === 'pillar'), 'pillars of light on what it hit');
  assert.ok(w.mobs.some((m) => m.hold === 'stun' && m.frozenUntil > w.now), 'and they are stunned');
  // Swinging at nothing still calls it (a flare of light ahead, no pillars on anyone).
  const empty = advanced('paladin');
  empty.char.skills.aegissmite = 20;
  empty.mobs = [];
  dice(0.01, () => {
    updateWorld(empty, DT, press('KeyZ'));
    run(empty, 0.6);
  });
  assert.ok(empty.fx.some((f) => f.kind === 'aegis'), 'a flare of light ahead');
});

test('Hallowed Ground: the combo finisher drives the blade down and turns every monster it hits on you', () => {
  const w = advanced('paladin');
  w.char.skills.hallowedground = 10;
  for (const m of w.mobs) m.aggroUntil = 0;
  // The smite catches all three boars, so it always goes off (no lucky roll needed).
  dice(0.99, () => {
    finisher(w);
    run(w, 0.6);
  });
  assert.equal(w.pose.kind, 'consecrate', 'the blade goes into the ground');
  dice(0.99, () => run(w, 0.6));
  assert.ok(w.mobs.every((m) => m.aggroUntil > w.now), 'all of them come after you');
  assert.ok(w.fx.some((f) => f.kind === 'consecrate'), 'a ring of holy light');
});

test("a Berserker's blows build Rage (Ravage's cleaves more), which drains once the fighting stops", () => {
  const rageAfter = (ravage) => {
    const w = advanced('berserker', 'axe_20');
    if (ravage) w.char.skills.ravage = 20;
    dice(0.01, () => {
      updateWorld(w, DT, press('KeyZ'));
      run(w, 0.7);
    });
    return w;
  };
  const plain = rageAfter(false);
  const ravaged = rageAfter(true);
  assert.ok(plain.rage > 0, 'a basic blow builds a little');
  assert.ok(ravaged.rage > plain.rage + 5, `Ravage's cleaves build more (${plain.rage} -> ${ravaged.rage})`);
  assert.ok(ravaged.mobs.some((m) => m.poison?.kind === 'bleed'), 'and they bleed');
  const held = ravaged.rage;
  run(ravaged, 6);
  assert.equal(ravaged.rage, held, 'holds for a while');
  run(ravaged, 4);
  assert.ok(ravaged.rage < held, 'then drains away');
  // Other jobs never build it.
  const p = advanced('paladin');
  updateWorld(p, DT, press('KeyZ'));
  run(p, 0.5);
  assert.equal(p.rage, 0);
});

test('Rampage: with enough Rage the combo finisher flows into it, keeping the Rage, harder the more there was', () => {
  const rampageAt = (rage) => {
    const w = advanced('berserker', 'axe_20');
    w.char.skills.rampage = 20;
    w.rage = rage;
    w.rageAt = 1e9;
    const m = w.mobs[0];
    let from = null;
    let spent = null;
    dice(0.01, () => {
      finisher(w);
      for (let i = 0; i < 150; i++) {
        updateWorld(w, DT, idle);
        if (w.pose?.kind === 'rampage' && from == null) {
          from = m.hp;
          spent = w.rage;
        }
      }
    });
    return from == null ? null : { dealt: from - m.hp, spent };
  };
  assert.equal(rampageAt(10), null, 'not enough Rage: no Rampage');
  const some = rampageAt(40);
  const full = rampageAt(100);
  assert.ok(some && full, 'it goes off with the Rage');
  assert.ok(full.spent >= 95, 'it feeds on the Rage without spending it');
  assert.ok(full.dealt > some.dealt * 1.25, `full Rage hits much harder (${some.dealt} vs ${full.dealt})`);
});

test('Blood Frenzy: a critical hit sometimes sends you into a frenzy, with a quarter of your Rage', async () => {
  const { frenzyOnCrit } = await import('../src/world/combat.js');
  const w = advanced('berserker', 'axe_20');
  w.char.skills.bloodfrenzy = 10;
  assert.equal(cast(w, 'bloodfrenzy').reason, 'passive');
  frenzyOnCrit(w, () => 0.99);
  assert.ok(!w.char.buffs.bloodfrenzy, 'an unlucky roll: no frenzy');
  frenzyOnCrit(w, () => 0);
  assert.equal(w.rage, 25);
  assert.ok(w.char.buffs.bloodfrenzy.values.watk > 0);
  // From a real blow: low dice crit, and crits set it off.
  const b = advanced('berserker', 'axe_20');
  b.char.skills.bloodfrenzy = 10;
  dice(0.01, () => {
    updateWorld(b, DT, press('KeyZ'));
    run(b, 0.5);
  });
  assert.ok(b.char.buffs.bloodfrenzy, 'a crit set it off');
});

test('Divine Aegis: a hit that leaves the Paladin under half HP raises it, once at a time', async () => {
  const { hurtPlayer } = await import('../src/world/world.js');
  const w = advanced('paladin');
  w.god = false;
  w.char.skills.divineaegis = 10;
  w.char.hp = w.stats.maxHp;
  hurtPlayer(w, 1, w.body.x + 20);
  assert.ok(!w.char.buffs.divineaegis, 'not while healthy');
  w.invuln = 0;
  w.char.hp = Math.round(w.stats.maxHp * 0.55);
  hurtPlayer(w, 400, w.body.x + 20);
  assert.ok(w.char.hp < w.stats.maxHp * 0.5, 'knocked under half');
  assert.ok(w.char.buffs.divineaegis?.values.dmgCut > 0, 'the blade goes up');
  const since = w.char.buffs.divineaegis.since;
  w.invuln = 0;
  hurtPlayer(w, 50, w.body.x + 20);
  assert.equal(w.char.buffs.divineaegis.since, since, 'not again while it holds');
});

test('late skills open at their own level: Sacred Bulwark at 50, Judgment and Demon Form at 70', async () => {
  const { canLearn } = await import('../src/core/character.js');
  const w = advanced('paladin');
  w.char.sp = 5;
  w.char.level = 49;
  assert.equal(canLearn(w.char, 'sacredbulwark'), false, 'not yet at 49');
  w.char.level = 50;
  assert.ok(canLearn(w.char, 'sacredbulwark'), 'open at 50');
  assert.equal(canLearn(w.char, 'judgment'), false, 'Judgment waits for 70');
  w.char.level = 70;
  assert.ok(canLearn(w.char, 'judgment'));
});

test('Sacred Bulwark: a blocked hit does no damage and answers with a stunning holy shockwave', async () => {
  const { hurtPlayer } = await import('../src/world/world.js');
  const w = advanced('paladin');
  w.god = false;
  w.char.skills.sacredbulwark = 10;
  w.char.hp = w.stats.maxHp;
  dice(0.99, () => hurtPlayer(w, 300, w.body.x + 20));
  assert.ok(w.char.hp < w.stats.maxHp, 'an unlucky roll: the hit lands');
  w.invuln = 0;
  w.char.hp = w.stats.maxHp;
  dice(0.01, () => {
    hurtPlayer(w, 300, w.body.x + 20);
    assert.equal(w.char.hp, w.stats.maxHp, 'blocked outright');
    run(w, 0.4);
  });
  assert.ok(w.fx.some((f) => f.kind === 'aegis'), 'a shield of light flashes up');
  assert.ok(w.mobs.some((m) => m.hold === 'stun' && m.frozenUntil > w.now), 'the shockwave stuns');
});

test('Judgment: at full Faith every combo finisher rains holy swords and mends you', () => {
  const swordsAt = (faith) => {
    const w = advanced('paladin');
    w.char.skills.judgment = 10;
    w.faith = faith;
    w.faithAt = 1e9;
    w.char.hp = Math.round(w.stats.maxHp / 2);
    const hp = w.char.hp;
    dice(0.99, () => {
      finisher(w);
      run(w, 0.7);
    });
    return { rained: w.fx.some((f) => f.kind === 'rain' && f.variant === 'sword'), healed: w.char.hp > hp };
  };
  assert.deepEqual(swordsAt(50), { rained: false, healed: false }, 'not without full Faith');
  assert.deepEqual(swordsAt(100), { rained: true, healed: true }, 'swords fall, and their light mends');
});

test('Bloodlust: blows heal the Berserker, more the lower his HP', () => {
  const healed = (share) => {
    const w = advanced('berserker', 'axe_20');
    w.char.skills.bloodlust = 10;
    w.char.hp = Math.round(w.stats.maxHp * share);
    const hp = w.char.hp;
    dice(0.5, () => {
      updateWorld(w, DT, press('KeyZ'));
      run(w, 0.5);
    });
    return w.char.hp - hp;
  };
  const high = healed(0.9);
  const low = healed(0.1);
  assert.ok(high > 0, 'a blow heals a little');
  assert.ok(low > high * 1.3, `much more when low (${high} vs ${low})`);
});

test('Demon Form: when Rage fills, every swing strikes twice and Rage holds until it ends', async () => {
  const { addRage, inForm } = await import('../src/world/melee.js');
  const w = advanced('berserker', 'axe_20');
  w.char.skills.demonform = 10;
  addRage(w, 100);
  assert.ok(inForm(w), 'the demon takes him');
  assert.ok(w.char.buffs.demonform, 'shown as a buff');
  const m = w.mobs[0];
  const x = m.x;
  dice(0.5, () => {
    updateWorld(w, DT, press('KeyZ'));
    run(w, 0.6);
  });
  assert.ok(w.formSwing, 'his demon shadow strikes too');
  // And his cuts reach farther: a monster just out of a normal swing's reach is caught.
  const reachOf = (demon) => {
    const v = advanced('berserker', 'axe_20');
    v.char.skills.demonform = 10;
    if (demon) addRage(v, 100);
    v.mobs = v.mobs.slice(0, 1);
    v.mobs[0].x = v.body.x + 105;
    const hp = v.mobs[0].hp;
    dice(0.5, () => {
      updateWorld(v, DT, press('KeyZ'));
      run(v, 0.5);
    });
    return v.mobs[0].hp < hp;
  };
  assert.equal(reachOf(false), false, 'out of reach normally');
  assert.ok(reachOf(true), 'caught in Demon Form');
  assert.ok(w.numbers.filter((n) => /^\d+$/.test(n.text)).length >= 2, 'two hits from one swing');
  run(w, 8);
  assert.equal(w.rage, 100, 'Rage holds while he is the demon');
  w.now = w.formUntil + 0.1;
  w.rageAt = -99;
  run(w, 1);
  assert.ok(w.rage < 100, 'then drains once it ends');
  void x;
});

test("Judgment: when Faith fills the Paladin ascends, every swing strikes twice and Faith holds", async () => {
  const { addFaith, inForm } = await import('../src/world/melee.js');
  const w = advanced('paladin');
  w.char.skills.judgment = 10;
  addFaith(w, 100);
  assert.ok(inForm(w), 'she ascends');
  assert.ok(w.char.buffs.judgment, 'shown as a buff');
  let burst = false;
  dice(0.5, () => {
    updateWorld(w, DT, press('KeyZ'));
    for (let i = 0; i < 36; i++) {
      updateWorld(w, DT, idle);
      burst ||= w.fx.some((f) => f.kind === 'formburst' && f.school === 'holy');
    }
  });
  assert.ok(w.formSwing, 'her swings strike again');
  assert.ok(burst, 'swings burst with holy light');
  run(w, 8);
  assert.equal(w.faith, 100, 'Faith holds while she is ascended');
  // A Berserker's Demon Form never comes from a Paladin's skills, and the other way round.
  const b = advanced('berserker', 'axe_20');
  b.char.skills.judgment = 10;
  addFaith(b, 100);
  assert.ok(!inForm(b), 'no Faith, no Judgment');
});

test('the no-spam rule holds for the Paladin and the Berserker too', () => {
  for (const [job, weapon] of [['paladin', 'sword_20'], ['berserker', 'axe_20']]) {
    const w = advanced(job, weapon);
    w.char.skills.shouldercharge = 10;
    assert.ok(cast(w, 'shouldercharge').ok, `${job}: Shoulder Charge goes off`);
    run(w, 0.15);
    for (let i = 0; i < 3; i++) updateWorld(w, DT, { held: new Set(['ArrowLeft']), pressed: new Set(), locked: false });
    assert.equal(cast(w, 'shouldercharge').reason, 'busy', `${job}: can't be recast mid-motion, even after moving`);
    settle(w);
    assert.ok(cast(w, 'shouldercharge').ok, `${job}: free again once its motion is done`);
  }
});

// ---------- Command combos, the hit counter, Links and finishers ----------

const press = (code) => ({ held: new Set([code]), pressed: new Set([code]), locked: false });

test('Up + attack is a launcher that throws them up and hops you after them', () => {
  const w = arena();
  const y = w.body.y;
  updateWorld(w, DT, { held: new Set(['ArrowUp', 'KeyZ']), pressed: new Set(['KeyZ']), locked: false });
  assert.equal(w.pose.kind, 'rising');
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
  assert.equal(w.pose.kind, 'airslash');
  const y0 = w.body.y;
  run(w, 0.25);
  assert.ok(w.body.y - y0 < 20, `hung in the air, not falling (free fall is ~47px) (${(w.body.y - y0).toFixed(1)}px)`);
  updateWorld(w, DT, press('KeyZ'));
  run(w, 0.3);
  updateWorld(w, DT, press('KeyZ'));
  assert.equal(w.pose.kind, 'meteor');
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
  assert.ok(w.fx.some((f) => f.kind === 'crack'), 'and cracked the floor');
});

test('attacking out of a run is a dash attack', () => {
  const w = arena();
  w.body.x = 200;
  for (let i = 0; i < 30; i++) updateWorld(w, DT, { held: new Set(['ArrowRight']), pressed: new Set(), locked: false });
  updateWorld(w, DT, { held: new Set(['ArrowRight', 'KeyZ']), pressed: new Set(['KeyZ']), locked: false });
  assert.equal(w.pose.kind, 'dashstab');
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
    const w = advanced('paladin');
    w.char.skills.shouldercharge = 10;
    const random = Math.random;
    Math.random = () => 0.5;
    try {
      if (link) w.finisherAt = { at: w.now, key: 'basic3' };
      assert.ok(cast(w, 'shouldercharge').ok);
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
  for (const [job, weapon, skill, gauge] of [['paladin', 'sword_20', 'grandverdict', 'faith'], ['berserker', 'axe_20', 'crimsoneclipse', 'rage']]) {
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

test("a Paladin's blows and the hits she takes build Faith, and Faith softens hits", async () => {
  const { hurtPlayer } = await import('../src/world/world.js');
  const w = advanced('paladin');
  updateWorld(w, DT, press('KeyZ'));
  run(w, 0.4);
  assert.ok(w.faith > 0, 'blows build it');
  const taken = (faith) => {
    const p = advanced('paladin');
    p.god = false;
    p.invuln = 0;
    p.faith = faith;
    p.char.hp = p.stats.maxHp;
    const before = p.char.hp;
    const random = Math.random;
    Math.random = () => 0.5;
    try {
      hurtPlayer(p, 700, p.body.x + 20);
    } finally {
      Math.random = random;
    }
    return { lost: before - p.char.hp, faith: p.faith };
  };
  const none = taken(0);
  const full = taken(100);
  assert.ok(none.faith > 0, 'a hit taken builds it');
  assert.ok(full.lost < none.lost * 0.9, `full Faith takes less (${none.lost} vs ${full.lost})`);
});

test('Rage makes every Berserker blow hit harder, and his blows land heavier than a plain warrior', () => {
  const dealt = (rage) => {
    const w = advanced('berserker', 'axe_20');
    const random = Math.random;
    Math.random = () => 0.99;
    try {
      w.rage = rage;
      w.rageAt = 1e9;
      updateWorld(w, DT, press('KeyZ'));
      run(w, 0.4);
      return 1e9 - w.mobs[0].hp;
    } finally {
      Math.random = random;
    }
  };
  assert.ok(dealt(100) > dealt(0) * 1.15, 'full Rage hits harder');
  const stopOf = (w) => stops(w, 30)[0]?.stop ?? 0;
  const plain = arena('axe_20');
  const ber = advanced('berserker', 'axe_20');
  updateWorld(plain, DT, press('KeyZ'));
  updateWorld(ber, DT, press('KeyZ'));
  assert.ok(stopOf(ber) > stopOf(plain), 'longer hit-stop on his blows');
});

// ---------- The archer paths: the Ranger (bow, Gale) and the Sniper (crossbow, Focus) ----------

// A level 30+ archer on a path, in the woods with sturdy boars in a row ahead.
function archer(job, weapon = job === 'stormcaller' ? 'crossbow_20' : 'bow_20') {
  const w = arena(weapon);
  const c = createCharacter('A', {});
  gainExp(c, 1e6);
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
  gainExp(c, 1e6);
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

test('Snow wolf picks her own fights, and comes back to the Beastmaster when there are none', () => {
  const w = archer('beastmaster');
  assert.ok(w.pets?.snow?.body, 'Snow wolf is here, with a body of her own');
  // Without a shot fired she goes and cuts them herself.
  run(w, 5);
  assert.ok(w.mobs.some((m) => m.hp < 1e9), 'she fights on her own');
  assert.ok(w.bond > 0, 'wearing her Patience down');
  // Nothing left: she comes back and waits beside the Beastmaster, wherever she walks.
  w.mobs = [];
  run(w, 1.2, { held: new Set(['ArrowLeft']), pressed: new Set(), locked: false });
  run(w, 3);
  assert.ok(Math.abs(w.pets.snow.x - w.body.x) < 80 && Math.abs(w.pets.snow.y - w.body.y) < 30, 'back beside her');
});

test('Snow wolf finds her own way up onto a ledge to reach a monster', async () => {
  const { navOf, surfaceOf } = await import('../src/world/nav.js');
  const w = archer('beastmaster');
  const nav = navOf(w.map);
  // A ledge above the ground, a monster on it.
  const ledge = nav.surfaces.map((s, i) => [s, i]).filter(([s]) => !s.ground).sort(([a], [b]) => b.yAt(b.x1) - a.yAt(a.x1))[0];
  assert.ok(ledge, 'the map has a ledge');
  const [surf, i] = ledge;
  const x = (surf.x1 + surf.x2) / 2;
  w.mobs = [w.mobs[0]];
  Object.assign(w.mobs[0], { x, y: surf.yAt(x) });
  let up = false;
  for (let k = 0; k < 60 * 25 && w.mobs[0].hp === 1e9; k++) {
    updateWorld(w, DT, idle);
    up ||= surfaceOf(nav, w.pets.snow.body) === i;
    w.mobs[0].x = x;
    w.mobs[0].y = surf.yAt(x);
  }
  assert.ok(w.mobs[0].hp < 1e9, 'and cuts it');
  assert.ok(up || Math.abs(w.pets.snow.x - x) < 300, 'from its ledge, or with a crescent from in reach');
});

test("Fine, I'll Go, Moonfall and Lunar Howl make Snow wolf fight", () => {
  const w = archer('beastmaster');
  w.char.skills.wolfpounce = 20;
  const acts = new Set();
  dice(0.01, () => {
    updateWorld(w, DT, press('KeyZ'));
    for (let i = 0; i < 70; i++) {
      updateWorld(w, DT, idle);
      if (w.pets.snow.act) acts.add(w.pets.snow.act.kind);
    }
  });
  assert.ok(acts.has('go') || acts.has('flick'), `she goes after it (${[...acts]})`);
  // Moonfall: a beam of moonlight on the farthest monster.
  const u = archer('beastmaster');
  u.char.skills.hawkstrike = 20;
  let beam = false;
  dice(0.01, () => {
    updateWorld(u, DT, press('KeyZ'));
    for (let i = 0; i < 60; i++) {
      updateWorld(u, DT, idle);
      beam ||= u.fx.some((f) => f.kind === 'moonfall');
    }
  });
  assert.ok(beam, 'moonlight falls');
  // Lunar Howl: the combo's last shot with a crowd in front sets her howling; they're stunned.
  const v = archer('beastmaster');
  v.char.skills.packhowl = 20;
  const put = () => Object.assign(v.pets.snow.body, { x: v.mobs[0].x - 20, vx: 0 });
  put();
  v.pets.snow.act = null;
  dice(0.99, () => {
    finisher(v);
    for (let i = 0; i < 50 && v.pets.snow.act?.kind !== 'howl'; i++) {
      if (v.pets.snow.act?.kind !== 'howl') v.pets.snow.act = null;
      updateWorld(v, DT, idle);
    }
  });
  assert.equal(v.pets.snow.act?.kind, 'howl', 'she howls');
  dice(0.99, () => run(v, 0.5));
  assert.ok(v.mobs.some((m) => m.hold === 'stun' && m.frozenUntil > v.now), 'stunning what is close round her');
});

test("Fed Up (full Bond): Snow wolf hits harder and quicker, quicker still with Queen's Awakening", () => {
  const hits = (bond, alpha) => {
    const w = archer('beastmaster');
    w.char.level = 75;
    if (alpha) w.char.skills.alpha = 10;
    w.bond = bond;
    w.bondAt = 1e9;
    let n = 0;
    for (let i = 0; i < 60 * 6; i++) {
      updateWorld(w, DT, idle);
      if (w.pets.snow.act && w.pets.snow.act.t0 === w.now) n++;
    }
    return { n, dmg: w.mobs.reduce((t, m) => t + (1e9 - m.hp), 0) };
  };
  const calm = hits(0, false);
  const fed = hits(100, false);
  const awake = hits(100, true);
  assert.ok(fed.dmg > calm.dmg, `Fed Up she hits harder (${calm.dmg} -> ${fed.dmg})`);
  assert.ok(awake.n >= fed.n, 'awake, at least as often');
});

test("Snow wolf's sword cleaves: a swing cuts everything all round her, a slam everything ahead", () => {
  for (const kind of ['swing', 'slam']) {
    const w = archer('beastmaster');
    const s = w.pets.snow;
    Object.assign(s.body, { x: 600, vx: 0, facing: 1 });
    s.x = 600;
    s.dir = 1;
    const spots = kind === 'swing' ? [530, 600, 670] : [610, 650, 700];
    w.mobs.forEach((m, i) => Object.assign(m, { x: spots[i] }));
    s.act = { kind, own: true, t0: w.now, dur: 0.6, hitAt: 0.2, pct: 70, gauge: 2 };
    s.next = Infinity;
    w.bolts = [];
    run(w, 0.5);
    assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 3, `one ${kind} hits all three`);
  }
});

test('Moon Ward: Snow wolf plants her sword in front of a hit and answers it', async () => {
  const { hurtPlayer } = await import('../src/world/world.js');
  const w = archer('beastmaster');
  w.god = false;
  w.char.level = 75;
  w.char.skills.loyalguard = 10;
  w.char.hp = w.stats.maxHp;
  dice(0.01, () => {
    hurtPlayer(w, 400, w.body.x + 30);
    assert.equal(w.char.hp, w.stats.maxHp, 'the hit never reached her');
    assert.ok(w.pets.snow.x > w.body.x, 'Snow wolf stands between her and it');
    assert.equal(w.pets.snow.act?.kind, 'ward');
    assert.ok(w.fx.some((f) => f.kind === 'moonward'), 'behind a crescent of moonlight');
  });
});

test('Wrath of the Wolf Queen needs full Bond, spends it, and moonlight sweeps everything ahead', () => {
  const w = archer('beastmaster');
  w.char.skills.stampede = 10;
  w.char.mp = 9999;
  w.bond = 60;
  assert.equal(cast(w, 'stampede').reason, 'gauge:bond', 'waits for full Bond');
  w.bond = 100;
  assert.ok(cast(w, 'stampede').ok);
  assert.equal(w.bond, 0, 'spends all of it');
  let moon = false;
  let air = 0;
  for (let i = 0; i < 60 * 2; i++) {
    updateWorld(w, DT, idle);
    moon ||= w.fx.some((f) => f.kind === 'moonwrath');
    air = Math.max(air, ...w.mobs.map((m) => m.air ?? 0));
  }
  assert.ok(moon, 'the full moon rises');
  assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 3, 'over all of them');
  assert.ok(air > 30, 'throwing them into the air');
});

test("the Beastmaster has her own basic combo, and its shots land when they arrive", async () => {
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
    // Snow wolf sits this one out: only the shot may land.
    Object.assign(v.pets.snow, { next: Infinity, act: null });
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
  for (const [job, run0] of [['beastmaster', 'slideshot'], ['stormcaller', 'slideshot']]) {
    const w = archer(job);
    updateWorld(w, DT, { held: new Set(['ArrowUp', 'KeyZ']), pressed: new Set(['KeyZ']), locked: false });
    assert.equal(w.pose.kind, 'skyshot', `${job}: up + attack shoots up`);
    run(w, 1);
    w.body.vy = -500;
    w.body.onGround = false;
    updateWorld(w, DT, press('KeyZ'));
    assert.equal(w.pose.kind, 'airshot', `${job}: a shot from the air`);
    assert.ok(w.hangUntil > w.now, 'it holds you up');
    run(w, 1.5);
    Object.assign(w.body, { x: 200, facing: 1 });
    run(w, 0.5, { held: new Set(['ArrowRight']), pressed: new Set(), locked: false });
    updateWorld(w, DT, { held: new Set(['ArrowRight', 'KeyZ']), pressed: new Set(['KeyZ']), locked: false });
    assert.equal(w.pose.kind, run0, `${job}: a running shot`);
  }
});

test("the Archer's skills go on as each path's arrows: gold for her, green for the Beastmaster", () => {
  for (const [job, shot] of [['archer', 'hawkarrow'], ['beastmaster', 'windarrow'], ['stormcaller', 'hawkarrow']]) {
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

test('the Archer and the Beastmaster mix their own pools of shots, opening with their own combos', () => {
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

// ---------- The first jobs' gauges: the Warrior's Valor and the Archer's Momentum ----------

test("a Warrior's blows build Valor, faster the more monsters one blow catches, and it drains", () => {
  const gain = (n) => {
    const w = arena();
    w.mobs = w.mobs.slice(0, n);
    w.mobs.forEach((m) => (m.x = 340));
    const random = Math.random;
    Math.random = () => 0.5;
    try {
      // The combo's finisher, which catches up to three.
      w.combo = PATH_COMBOS.warrior.length - 2;
      w.comboUntil = w.now + 1;
      updateWorld(w, DT, press('KeyZ'));
      run(w, 0.6);
    } finally {
      Math.random = random;
    }
    return w;
  };
  const one = gain(1);
  const three = gain(3);
  assert.ok(one.valor > 0, 'a blow builds it');
  assert.ok(three.valor >= one.valor * 1.8, `a blow on three builds it faster (${one.valor} vs ${three.valor})`);
  run(three, 9);
  assert.equal(three.valor, 0, 'drained once the fighting stopped');
});

test('full Valor (Unbroken): nothing knocks the Warrior back, and his blows land heavier', async () => {
  const { hurtPlayer } = await import('../src/world/world.js');
  const knocked = (valor) => {
    const w = arena();
    w.god = false;
    w.char.hp = 99999;
    w.valor = valor;
    w.valorAt = 1e9;
    hurtPlayer(w, 10, w.body.x + 30);
    return Math.abs(w.body.vx);
  };
  assert.ok(knocked(0) > 0, 'a plain hit knocks him back');
  assert.equal(knocked(100), 0, 'Unbroken stands firm');
  const stopOf = (valor) => {
    const w = arena();
    w.valor = valor;
    w.valorAt = 1e9;
    w.combo = 1;
    w.comboUntil = w.now + 1;
    updateWorld(w, DT, press('KeyZ'));
    return stops(w, 40)[0]?.stop ?? 0;
  };
  assert.ok(stopOf(100) > stopOf(0), 'heavier blows while Unbroken');
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

test('full Momentum (Hawkeye): arrows fly faster and reach monsters above and below', () => {
  const speedOf = (momentum) => {
    const w = range();
    w.momentum = momentum;
    w.momentumAt = 1e9;
    updateWorld(w, DT, press('KeyZ'));
    let shot = null;
    for (let i = 0; i < 40 && !shot; i++) {
      updateWorld(w, DT, idle);
      shot = w.fx.find((f) => f.kind === 'projectile');
    }
    return Math.hypot(shot.tx - shot.x, shot.ty - shot.y) / shot.dur;
  };
  assert.ok(speedOf(100) > speedOf(0) * 1.3, 'faster under Hawkeye');
  // A monster up on a ledge above: a plain shot passes under it, a Hawkeye shot curves up to it.
  const above = (momentum) => {
    const w = range();
    w.mobs = [w.mobs[0]];
    const m = w.mobs[0];
    m.yAt = () => w.map.groundY - 75;
    m.y = m.baseY = w.map.groundY - 75;
    w.momentum = momentum;
    w.momentumAt = 1e9;
    updateWorld(w, DT, press('KeyZ'));
    run(w, 1);
    return w.mobs[0].hp < 1e9;
  };
  assert.equal(above(0), false, 'a plain shot misses the ledge');
  assert.equal(above(100), true, 'a Hawkeye shot finds it');
});

test('Comet Arrow needs full Momentum, spends it, and crashes down ahead, throwing everything into the air', () => {
  const w = range();
  w.char.skills.cometarrow = 10;
  w.char.mp = 9999;
  w.momentum = 70;
  assert.equal(cast(w, 'cometarrow').reason, 'gauge:momentum', 'waits for full Momentum');
  w.momentum = 100;
  assert.ok(cast(w, 'cometarrow').ok);
  assert.equal(w.momentum, 0, 'spends all of it');
  let high = 0;
  let fell = false;
  for (let i = 0; i < 60 * 0.8; i++) {
    updateWorld(w, DT, idle);
    high = Math.max(high, w.pose?.kind === 'comet' ? MOVES.comet((w.now - w.pose.since) / w.pose.dur).lift : 0);
    fell ||= w.fx.some((f) => f.kind === 'cometfall');
  }
  assert.ok(high > 50, `she leaps high (${Math.round(high)})`);
  assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 0, 'nothing lands before the comet does');
  let air = 0;
  for (let i = 0; i < 60 * 1.2; i++) {
    updateWorld(w, DT, idle);
    fell ||= w.fx.some((f) => f.kind === 'cometfall');
    air = Math.max(air, ...w.mobs.map((m) => m.air ?? 0));
  }
  assert.ok(fell, 'the comet falls');
  assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 3, 'it caught all of them');
  assert.ok(air > 30, 'and threw them into the air');
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
    assert.equal(w.pose.kind, 'downshot', `${job}: leans out and aims down`);
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
  assert.equal(w.pose.kind, 'skyshot', 'up + attack shoots up');
  run(w, 0.6);
  w.body.onGround = false;
  w.body.vy = -200;
  w.attackTimer = 0;
  w.lockTimer = 0;
  w.basicReadyAt = 0;
  updateWorld(w, DT, press('KeyZ'));
  assert.equal(w.pose.kind, 'airshot', 'shooting from the air');
});

test('War Cry goes off as Valor fills: the monsters turn on you and you take less damage', () => {
  const w = arena();
  w.char.skills.warcry = 10;
  w.mobs.forEach((m) => (m.aggroUntil = 0));
  assert.equal(cast(w, 'warcry').reason, 'passive', 'not a key to press any more');
  w.valor = 97;
  updateWorld(w, DT, press('KeyZ'));
  run(w, 0.5);
  assert.equal(w.valor, 100, 'the blow filled Valor');
  assert.ok(w.mobs.every((m) => m.aggroUntil > w.now), 'every monster around turns on you');
  assert.ok(w.char.buffs.warcry?.values.dmgCut > 0, 'and you take less damage');
  // Only on the fill: staying full doesn't shout again.
  const since = w.char.buffs.warcry.since;
  run(w, 1, press('KeyZ'));
  assert.equal(w.char.buffs.warcry.since, since);
});

test('Blade Rush sometimes rushes a blow on into an extra cross-cut, and proc cuts never chain', () => {
  const blows = (chance) => {
    const w = arena();
    w.char.skills.bladerush = 20;
    const m = w.mobs[0];
    let hits = 0;
    let last = m.hp;
    const random = Math.random;
    Math.random = () => (chance ? 0.01 : 0.99);
    try {
      updateWorld(w, DT, press('KeyZ'));
      for (let i = 0; i < 40; i++) {
        updateWorld(w, DT, idle);
        if (m.hp < last) hits++;
        last = m.hp;
      }
    } finally {
      Math.random = random;
    }
    return hits;
  };
  assert.equal(blows(false), 1, 'a plain blow');
  assert.equal(blows(true), 3, 'the blow, then the two cuts of the cross (and no more)');
});

test('Blade Rush and Whirlwind go off from the swing itself, even with nothing in reach', () => {
  const w = arena();
  w.mobs = [];
  w.char.skills.bladerush = 20;
  w.char.skills.whirlwind = 20;
  const said = new Set();
  const random = Math.random;
  Math.random = () => 0.01;
  try {
    // Swing through the whole combo at thin air.
    for (let i = 0; i < 240; i++) {
      updateWorld(w, DT, { held: new Set(['KeyZ']), pressed: new Set(), locked: false });
      for (const s of w.strikes) said.add(s.key);
    }
  } finally {
    Math.random = random;
  }
  assert.ok(said.has('procbladerush'), 'a swing at nothing still rushes on');
  assert.ok(said.has('procwhirlwind'), 'and the combo still spins into a Whirlwind');
});

test('Iron Guard braces against a hard hit, and the proc skills free their old hotkeys', async () => {
  const { hurtPlayer } = await import('../src/world/world.js');
  const { updateRetiredJobs } = await import('../src/core/save.js');
  const w = arena();
  w.god = false;
  w.char.skills.ironguard = 20;
  w.char.hp = w.stats.maxHp;
  const random = Math.random;
  Math.random = () => 0.01;
  try {
    hurtPlayer(w, 1, w.body.x - 10);
    assert.ok(!w.char.buffs.ironguard, 'a scratch is no reason to brace');
    w.char.hp = 1e7;
    hurtPlayer(w, 9999, w.body.x - 10);
    assert.ok(w.char.buffs.ironguard?.values.dmgCut > 0, 'a hard hit is');
  } finally {
    Math.random = random;
  }
  w.char.hotkeys.KeyA = { skill: 'ironguard' };
  w.char.hotkeys.KeyS = { skill: 'shouldercharge' };
  updateRetiredJobs(w.char);
  assert.equal(w.char.hotkeys.KeyA, null, 'a proc has no key');
  assert.deepEqual(w.char.hotkeys.KeyS, { skill: 'shouldercharge' }, 'a real skill keeps its key');
});

// ---------- The Thief: Shadow, Phantom, and a dagger or a gauntlet ----------

function thief(weapon = 'dagger_20') {
  const w = arena(weapon);
  w.char.job = 'thief';
  w.char.mp = 9999;
  w.char.baseMp = 99999;
  if (weapon.startsWith('gauntlet')) addItem(w.char.inventory, 'star_pebble', 500);
  if (weapon.startsWith('gauntlet')) w.mobs.forEach((m, i) => (m.x = 420 + i * 30));
  for (let i = 0; i < 5; i++) updateWorld(w, DT, idle);
  return w;
}

test('the Thief has her own basic combo with each weapon', () => {
  for (const [weapon, path] of [['dagger_20', 'thiefdagger'], ['gauntlet_20', 'thiefstar']]) {
    const w = thief(weapon);
    const seen = [];
    const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
    for (let i = 0; i < 90; i++) {
      updateWorld(w, DT, hold);
      if (w.pose && seen.at(-1)?.step !== w.combo) seen.push({ step: w.combo, move: w.pose.kind });
    }
    assert.deepEqual(seen.slice(0, 3).map((s) => s.move), PATH_COMBOS[path].map((s) => s.move), path);
    assert.ok(w.mobs.some((m) => m.hp < 1e9), `${weapon} hits`);
  }
});

test("a Thief's hits build Shadow, faster in a quick chain, and it fades once the fighting stops", () => {
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
  assert.ok(slow.chain === 0 || slow.chain === undefined, 'slow hits break the chain');
  assert.ok(slow.shadow < chained, `a broken chain builds less (${slow.shadow} vs ${chained})`);
  run(w, 10);
  assert.equal(w.shadow, 0, 'faded once the fighting stopped');
});

test('full Shadow (Phantom): a shadow copy repeats every attack a beat later, lighter', () => {
  const hits = (shadow) => {
    const w = thief();
    w.shadow = shadow;
    w.shadowAt = 1e9;
    let n = 0;
    let last = w.mobs[0].hp;
    updateWorld(w, DT, press('KeyZ'));
    for (let i = 0; i < 40; i++) {
      updateWorld(w, DT, idle);
      if (w.mobs[0].hp < last) n += 1;
      last = w.mobs[0].hp;
    }
    return { n, w };
  };
  assert.equal(hits(0).n, 1, 'one stab');
  const full = hits(100);
  assert.equal(full.n, 2, 'the stab and its shadow');
  assert.ok(full.w.phantom, 'the copy plays the move');
  // With a gauntlet the copy throws too, without using up stars.
  const w = thief('gauntlet_20');
  w.shadow = 100;
  w.shadowAt = 1e9;
  const stars = () => w.char.inventory.use.reduce((n, s) => n + (s?.qty ?? 0), 0);
  const before = stars();
  updateWorld(w, DT, press('KeyZ'));
  assert.ok(w.strikes.some((s) => s.phantom && s.shot), 'the copy throws a star of its own');
  run(w, 0.5);
  assert.equal(before - stars(), 1, 'the shadow star is not from your bag');
});

test('dagger skills need a dagger and gauntlet skills a gauntlet; shared skills work with both', () => {
  const d = thief();
  Object.assign(d.char.skills, { luckyseven: 5, twinfang: 5, shadowdash: 5, daggermastery: 20, gauntletmastery: 20 });
  assert.equal(cast(d, 'luckyseven').reason, 'weapon');
  assert.ok(cast(d, 'twinfang').ok);
  const g = thief('gauntlet_20');
  Object.assign(g.char.skills, { luckyseven: 5, twinfang: 5, shadowdash: 5 });
  assert.equal(cast(g, 'twinfang').reason, 'weapon');
  assert.ok(cast(g, 'luckyseven').ok);
  run(g, 1);
  const x = g.body.x;
  assert.ok(cast(g, 'shadowdash').ok, 'Shadow Step works with a gauntlet');
  assert.ok(g.invuln > 0, 'untouchable on the way');
  run(g, 0.5);
  assert.ok(g.body.x > x + 60, 'darted forward');
});

test('Backstab slips through, turns, and hits much harder on a monster facing away', () => {
  const dealt = (facing) => {
    const w = thief();
    w.mobs = [w.mobs[0]];
    w.mobs[0].dir = facing;
    w.char.skills.backstab = 10;
    const random = Math.random;
    Math.random = () => 0.5;
    try {
      const x = w.body.x;
      assert.ok(cast(w, 'backstab').ok);
      run(w, 0.7);
      assert.ok(w.body.x > w.mobs[0].x, 'came out the far side');
      assert.equal(w.body.facing, -1, 'turned round to stab');
      assert.ok(w.body.x > x);
      return 1e9 - w.mobs[0].hp;
    } finally {
      Math.random = random;
    }
  };
  // The monster faces the thief (-1) as she comes in, so once she's past it, its back is to her.
  assert.ok(dealt(-1) > dealt(1) * 1.4, 'from behind hits much harder');
});

test("each of the Thief's finishers needs full Shadow, spends it, and lands its big moment", () => {
  for (const [weapon, skill] of [['dagger_20', 'moonlitassassin'], ['gauntlet_20', 'fullmoonvolley']]) {
    const w = thief(weapon);
    w.char.skills[skill] = 10;
    w.shadow = 80;
    assert.equal(cast(w, skill).reason, 'gauge:shadow', `${skill} waits for full Shadow`);
    w.shadow = 100;
    assert.ok(cast(w, skill).ok);
    assert.equal(w.shadow, 0, 'spends all of it');
    run(w, 2);
    assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 3, `${skill} hits the whole line`);
    assert.ok((w.shadow ?? 0) < 100, 'and does not refill it');
    settle(w);
    w.shadow = 100;
    assert.ok(cast(w, skill).ok);
    run(w, 0.3);
    w.shadow = 100;
    assert.equal(cast(w, skill).reason, 'busy', `${skill} can't be recast mid-motion`);
  }
});

test("a weapon's own mastery only counts while that weapon is held", async () => {
  const { computeStats } = await import('../src/core/stats.js');
  const w = thief();
  const plain = computeStats(w.char, 0).watk;
  w.char.skills.daggermastery = 20;
  assert.ok(computeStats(w.char, 0).watk > plain, 'Dagger Mastery with a dagger');
  w.char.equipment.weapon = makeEquip('gauntlet_20', {});
  const g = computeStats(w.char, 0).watk;
  w.char.skills.daggermastery = 0;
  assert.equal(computeStats(w.char, 0).watk, g, 'nothing from it with a gauntlet');
});

// ---------- The Thief's paths: the Assassin (dagger) and the Night Lord (gauntlet) ----------

function thiefPath(job) {
  const weapon = job === 'assassin' ? 'dagger_20' : 'gauntlet_20';
  const w = arena(weapon);
  const c = createCharacter('T', {});
  gainExp(c, 1e6);
  advanceJob(c, 'thief');
  c.quests.thief_trial = { state: 'done', kills: {} };
  assert.ok(advanceJob(c, job), `advanced to ${job}`);
  c.equipment.weapon = makeEquip(weapon, {});
  c.mp = 9999;
  c.baseMp = 99999;
  if (job === 'nightlord') addItem(c.inventory, 'star_pebble', 500);
  w.char = c;
  if (job === 'nightlord') w.mobs.forEach((m, i) => (m.x = 420 + i * 30));
  for (let i = 0; i < 10; i++) updateWorld(w, DT, idle);
  return w;
}

test("both thief paths wait on Vex's trial, and each keeps to its own weapon", async () => {
  const { JOBS } = await import('../src/data/jobs.js');
  const c = createCharacter('T', {});
  gainExp(c, 1e6);
  advanceJob(c, 'thief');
  assert.equal(advanceJob(c, 'assassin'), false, 'not before the trial');
  assert.deepEqual(JOBS.assassin.weapons, ['dagger']);
  assert.deepEqual(JOBS.nightlord.weapons, ['gauntlet']);
});

test('each thief path has its own basic combo', () => {
  for (const job of ['assassin', 'nightlord']) {
    const w = thiefPath(job);
    const seen = [];
    const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
    for (let i = 0; i < 100; i++) {
      updateWorld(w, DT, hold);
      if (w.pose && seen.at(-1)?.step !== w.combo) seen.push({ step: w.combo, move: w.pose.kind });
    }
    assert.deepEqual(seen.slice(0, 3).map((s) => s.move), PATH_COMBOS[job].map((s) => s.move), job);
    assert.ok(w.mobs.some((m) => m.hp < 1e9), `${job} hits`);
  }
});

test("an Assassin's cuts build Killing Intent, far more from behind and on a marked monster", () => {
  const built = (facing, mark = false) => {
    const w = thiefPath('assassin');
    w.mobs = [w.mobs[0]];
    w.mobs[0].dir = facing;
    if (mark) {
      w.mobs[0].markedUntil = 1e9;
      w.mobs[0].markPower = 0.2;
    }
    const random = Math.random;
    Math.random = () => 0.9;
    try {
      updateWorld(w, DT, press('KeyZ'));
      run(w, 0.4);
    } finally {
      Math.random = random;
    }
    return w.killintent;
  };
  const front = built(-1);
  assert.ok(front > 0, 'a cut builds it');
  assert.ok(built(1) > front * 2, 'from behind builds it far faster');
  assert.ok(built(-1, true) > front * 1.5, 'a marked monster too');
});

test('full Killing Intent (Execution): the first cut on each monster crits, and a weakened one dies in it', () => {
  const w = thiefPath('assassin');
  w.killintent = 100;
  w.killintentAt = 1e9;
  const [weak, strong] = w.mobs;
  weak.hp = 1e9 * 0.2;
  const random = Math.random;
  Math.random = () => 0.9;
  try {
    updateWorld(w, DT, press('KeyZ'));
    run(w, 0.4);
  } finally {
    Math.random = random;
  }
  assert.ok(weak.hp <= 0, 'the weakened monster was executed');
  assert.ok(w.numbers.some((n) => n.crit), 'and the cut was a crit');
  assert.ok(w.executed?.has(weak), 'each monster gets its one sure cut');
  assert.ok(strong.hp === 1e9 || strong.hp > 0, 'a healthy one just takes the hit');
});

test("Mark for Death, Vanish and Poisoned Blade", () => {
  const w = thiefPath('assassin');
  Object.assign(w.char.skills, { markdeath: 10, vanish: 10, poisonblade: 10 });
  const ready = () => {
    w.attackTimer = 0;
    w.lockTimer = 0;
    w.skillReadyAt = 0;
  };
  assert.ok(cast(w, 'markdeath').ok);
  run(w, 0.5);
  assert.ok(w.mobs[0].markedUntil > w.now, 'the nearest monster is marked');
  ready();
  assert.ok(cast(w, 'vanish').ok);
  assert.ok(w.char.buffs.vanish, 'vanished');
  run(w, 0.2);
  updateWorld(w, DT, press('KeyZ'));
  run(w, 0.4);
  assert.equal(w.char.buffs.vanish, undefined, 'striking out of it spends it');
  ready();
  run(w, 1.2);
  assert.ok(cast(w, 'poisonblade').ok);
  settle(w);
  updateWorld(w, DT, press('KeyZ'));
  run(w, 0.5);
  assert.ok(w.mobs.some((x) => x.poison?.kind === 'bleed'), 'cuts make them bleed');
});

test("a Night Lord's stars build Starlight, more when they pile onto one monster", () => {
  const w = thiefPath('nightlord');
  w.mobs = [w.mobs[0]];
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  run(w, 1.4, hold);
  assert.ok(w.starlight > 0, 'stars build it');
  assert.ok(w.mobs[0].starHits > 2, 'they piled onto the one monster');
  run(w, 10);
  assert.equal(w.starlight, 0, 'it fades once the fighting stops');
});

test('full Starlight (Constellation): every star splits into three, the extra two free', () => {
  const thrown = (full) => {
    const w = thiefPath('nightlord');
    w.starlight = full ? 100 : 0;
    w.starlightAt = 1e9;
    const stars = () => w.char.inventory.use.reduce((n, s) => n + (s?.qty ?? 0), 0);
    const before = stars();
    updateWorld(w, DT, press('KeyZ'));
    run(w, 0.5);
    return { shots: w.fx.filter((f) => f.kind === 'projectile').length, used: before - stars() };
  };
  const plain = thrown(false);
  const full = thrown(true);
  assert.ok(full.shots >= plain.shots * 3, `three times the stars (${plain.shots} vs ${full.shots})`);
  assert.equal(full.used, plain.used, 'the split stars are free');
});

test('Giant Shuriken cuts the line going out and again coming back; Star Mark bursts a moment later', () => {
  const w = thiefPath('nightlord');
  Object.assign(w.char.skills, { giantshuriken: 10, starmark: 10, shadowshuriken: 10 });
  const counts = new Map(w.mobs.map((m) => [m, 0]));
  const last = new Map(w.mobs.map((m) => [m, m.hp]));
  assert.ok(cast(w, 'giantshuriken').ok);
  for (let i = 0; i < 120; i++) {
    updateWorld(w, DT, idle);
    for (const m of w.mobs) {
      if (m.hp < last.get(m)) counts.set(m, counts.get(m) + 1);
      last.set(m, m.hp);
    }
  }
  assert.ok([...counts.values()].every((n) => n >= 2), `each monster cut twice (${[...counts.values()]})`);
  w.mobs.forEach((m) => (m.hp = 1e9));
  w.attackTimer = 0;
  w.lockTimer = 0;
  w.skillReadyAt = 0;
  assert.ok(cast(w, 'starmark').ok);
  run(w, 0.7);
  assert.ok(w.fx.some((f) => f.kind === 'stuckstar'), 'the stars stuck');
  const hp = w.mobs.map((m) => m.hp);
  run(w, 1.2);
  assert.ok(w.mobs.some((m, i) => m.hp < hp[i]), 'and burst');
});

test("each thief path's finisher needs its gauge full, spends it, and lands its big moment", () => {
  for (const [job, skill, gauge] of [['assassin', 'bloodmoonrequiem', 'killintent'], ['nightlord', 'galaxyfall', 'starlight']]) {
    const w = thiefPath(job);
    w.char.skills[skill] = 10;
    w[gauge] = 80;
    assert.equal(cast(w, skill).reason, `gauge:${gauge}`, `${skill} waits for full ${gauge}`);
    w[gauge] = 100;
    assert.ok(cast(w, skill).ok);
    assert.equal(w[gauge], 0, 'spends all of it');
    run(w, 2);
    assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 3, `${skill} hits the whole line`);
    settle(w);
    w[gauge] = 100;
    assert.ok(cast(w, skill).ok);
    run(w, 0.3);
    w[gauge] = 100;
    assert.equal(cast(w, skill).reason, 'busy', `${skill} can't be recast mid-motion`);
  }
});

// ---------- The Mage: Bloom, Full Bloom, damage and healing ----------

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

test('the Mage has her own spell combo with a wand, and her spells hit with magic', () => {
  const w = mage();
  const seen = [];
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  for (let i = 0; i < 100; i++) {
    updateWorld(w, DT, hold);
    if (w.pose && seen.at(-1)?.step !== w.combo) seen.push({ step: w.combo, move: w.pose.kind });
  }
  assert.deepEqual(seen.slice(0, 3).map((s) => s.move), PATH_COMBOS.mage.map((s) => s.move));
  const dealt = (int) => {
    const x = mage();
    x.char.base.int = int;
    updateWorld(x, DT, idle);
    const random = Math.random;
    Math.random = () => 0.5;
    try {
      updateWorld(x, DT, press('KeyZ'));
      run(x, 1);
    } finally {
      Math.random = random;
    }
    return 1e9 - x.mobs[0].hp;
  };
  assert.ok(dealt(300) > dealt(50) * 1.5, 'INT makes her spells hit harder');
});

test("a Mage's spells and heals build Bloom, and it fades once the fighting stops", () => {
  const w = mage();
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  run(w, 1.5, hold);
  const fromSpells = w.bloom;
  assert.ok(fromSpells > 0, 'spells that land build it');
  w.char.skills.healingbloom = 10;
  w.char.hp = 10;
  w.attackTimer = 0;
  w.lockTimer = 0;
  w.skillReadyAt = 0;
  run(w, 0.6);
  assert.ok(cast(w, 'healingbloom').ok);
  assert.equal(w.char.hp, 10, 'the heal lands as the flower opens, not on the press');
  run(w, 0.6);
  assert.ok(w.char.hp > 10, 'healed');
  assert.ok(w.bloom > fromSpells, 'healing builds it too');
  run(w, 10);
  assert.equal(w.bloom, 0);
});

test('full Bloom: every damage spell also heals allies near where it lands', () => {
  const healed = (bloom) => {
    const w = mage();
    w.mobs.forEach((m) => (m.x = 340));
    w.char.hp = 10;
    w.bloom = bloom;
    w.bloomAt = 1e9;
    updateWorld(w, DT, press('KeyZ'));
    run(w, 1);
    return w.char.hp;
  };
  assert.equal(healed(0), 10, 'a plain bolt only hurts');
  assert.ok(healed(100) > 10, 'under Full Bloom the bolt landing nearby heals her');
});

test('Garden of Light needs full Bloom, spends it, hits the whole line and heals the party', () => {
  const w = mage();
  w.char.skills.gardenoflight = 10;
  w.bloom = 80;
  assert.equal(cast(w, 'gardenoflight').reason, 'gauge:bloom', 'waits for full Bloom');
  w.bloom = 100;
  w.char.hp = 10;
  assert.ok(cast(w, 'gardenoflight').ok);
  assert.equal(w.bloom, 0, 'spends all of it');
  run(w, 2);
  assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 3, 'hits the whole line');
  assert.ok(w.char.hp > 10, 'and heals');
  settle(w);
  w.bloom = 100;
  assert.ok(cast(w, 'gardenoflight').ok);
  run(w, 0.3);
  w.bloom = 100;
  assert.equal(cast(w, 'gardenoflight').reason, 'busy');
});

// ---------- Pace: nothing can be mashed ----------

test('no job can mash out its attacks: every skill plays its motion and a beat, basics keep a rhythm', async () => {
  const { SKILLS } = await import('../src/data/skills.js');
  const families = { warrior: ['warrior'], paladin: ['warrior', 'paladin'], berserker: ['warrior', 'berserker'], archer: ['archer'], beastmaster: ['archer', 'beastmaster'], stormcaller: ['archer', 'stormcaller'], thief: ['thief'], assassin: ['thief', 'assassin'], nightlord: ['thief', 'nightlord'], mage: ['mage'] };
  const weapons = { warrior: 'sword_20', paladin: 'sword_20', berserker: 'axe_20', archer: 'bow_20', beastmaster: 'bow_20', stormcaller: 'crossbow_20', thief: 'dagger_20', assassin: 'dagger_20', nightlord: 'gauntlet_20', mage: 'wand_20' };
  for (const [job, fam] of Object.entries(families)) {
    const weapon = weapons[job];
    const type = weapon.split('_')[0];
    const skills = Object.entries(SKILLS).filter(([, s]) => fam.includes(s.job) && ['attack', 'magic'].includes(s.type) && !s.fullGauge && !s.rageCost && (!s.weapons || s.weapons.includes(type)));
    for (const [id] of skills) {
      const w = arena(weapon);
      w.char.job = job;
      if (type === 'gauntlet') addItem(w.char.inventory, 'star_pebble', 5000);
      w.char.skills[id] = 20;
      w.char.hotkeys.KeyA = { skill: id };
      w.char.baseMp = 1e7;
      let casts = 0;
      let last = null;
      for (let i = 0; i < 6 * 60; i++) {
        w.char.mp = 1e7;
        updateWorld(w, DT, press('KeyA'));
        if (w.pose && w.pose.since !== last) {
          casts++;
          last = w.pose.since;
        }
      }
      assert.ok(casts / 6 <= 2, `${job} ${id}: ${(casts / 6).toFixed(2)} casts a second when mashed`);
    }
    const w = arena(weapon);
    w.char.job = job;
    if (type === 'gauntlet') addItem(w.char.inventory, 'star_pebble', 5000);
    let moves = 0;
    let last = null;
    for (let i = 0; i < 6 * 60; i++) {
      updateWorld(w, DT, press('KeyZ'));
      if (w.pose && w.pose.since !== last) {
        moves++;
        last = w.pose.since;
      }
    }
    assert.ok(moves / 6 <= 3.5, `${job}: ${(moves / 6).toFixed(2)} basic attacks a second when mashed`);
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
  assert.equal(w.pose?.kind, 'dashstab');
});

// The same for a held attack skill, every kind of job: you stay planted and keep casting it (the
// key repeats once held), turning with the direction, never walking off between casts.
test('holding an attack skill and a direction keeps casting it, planted, for every job', () => {
  for (const [job, weapon, skill] of [['warrior', 'sword_20', 'shouldercharge'], ['archer', 'bow_20', 'vault'], ['thief', 'gauntlet_20', 'luckyseven'], ['mage', 'wand_20', 'petalbolt']]) {
    const casts = (dir) => {
      const w = arena(weapon);
      w.char.job = job;
      if (weapon.startsWith('gauntlet')) addItem(w.char.inventory, 'star_pebble', 500);
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

test("the Paladin's and the Berserker's combos mix their own swing pools too", () => {
  for (const [job, weapon] of [['paladin', 'sword_20'], ['berserker', 'axe_20']]) {
    const steps = PATH_VARIANTS[job];
    assert.equal(steps.length, PATH_COMBOS[job].length, `${job}: a choice for every step`);
    steps.forEach((choices, i) => {
      assert.equal(choices[0], PATH_COMBOS[job][i], `${job}: the path's own swing comes first`);
      assert.ok(choices.length >= 2, `${job}: step ${i + 1} has a choice`);
      for (const s of choices) assert.ok(MOVES[s.move], `${job}: ${s.move} is drawn`);
    });
    assert.ok(steps.at(-1).every((s) => s.finisher), `${job}: every last swing is a finisher`);
    // Played out with fixed dice, every swing in the pool comes up.
    const w = advanced(job, weapon);
    const seen = new Set();
    let seed = 7;
    dice(0, () => {
      Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 60 * 60; i++) {
        updateWorld(w, DT, { held: new Set(['KeyZ']), pressed: new Set(), locked: false });
        if (w.pose) seen.add(w.pose.kind);
      }
    });
    for (const s of steps.flat()) assert.ok(seen.has(s.move), `${job}: ${s.move} came up`);
  }
});
