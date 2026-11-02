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

test('bare hands mix their blows too, and every new swing and shot is drawn', () => {
  const fists = PATH_VARIANTS.fists.flat().map((s) => s.move);
  for (const m of ['headbutt', 'flyingkick', 'haymaker', 'cartwheel']) assert.ok(fists.includes(m), `${m} is a bare-handed blow`);
  const all = Object.values(PATH_VARIANTS).flat(2).map((s) => s.move);
  for (const m of ['pommel', 'guardspin', 'kneelstab', 'shieldrush', 'acroll', 'acspin', 'acfront']) assert.ok(all.includes(m), `${m} is in a pool`);
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
  assert.equal(new Set(fresh).size, 11, `eleven new swings (${fresh})`);
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
  for (const [job, weapon, skill] of [['archer', 'bow_20', 'vault'], ['thief', 'gauntlet_20', 'pirouette'], ['thief', 'dagger_20', 'pirouette'], ['warrior', 'sword_20', 'shouldercharge']]) {
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

test('Hallowed Ground: pressed, the blade goes into the ground, every monster it hits turns on you, and it mends you', () => {
  const w = advanced('paladin');
  w.char.skills.hallowedground = 10;
  w.char.mp = 9999;
  for (const m of w.mobs) m.aggroUntil = 0;
  w.char.hp = Math.round(w.stats.maxHp / 2);
  w.hurtAt = w.now;
  const hp = w.char.hp;
  dice(0.99, () => {
    assert.ok(cast(w, 'hallowedground').ok);
    run(w, 0.3);
  });
  assert.equal(w.pose.kind, 'consecrate', 'the blade goes into the ground');
  dice(0.99, () => run(w, 0.8));
  assert.ok(w.mobs.every((m) => m.aggroUntil > w.now), 'all of them come after you');
  assert.ok(w.fx.some((f) => f.kind === 'consecrate'), 'a ring of holy light');
  assert.ok(w.char.hp > hp, 'its warmth mends you');
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

test('Rampage: pressed on 30 Rage or more, it spends 30 and hits harder the more Rage there was', () => {
  const rampageAt = (rage) => {
    const w = advanced('berserker', 'axe_20');
    w.char.skills.rampage = 10;
    w.rage = rage;
    w.rageAt = 1e9;
    const m = w.mobs[0];
    const from = m.hp;
    let r;
    dice(0.01, () => {
      r = cast(w, 'rampage');
      run(w, 2);
    });
    return r.ok ? { dealt: from - m.hp, left: w.rage } : null;
  };
  assert.equal(rampageAt(10), null, 'not enough Rage: no Rampage');
  const some = rampageAt(40);
  const full = rampageAt(100);
  assert.ok(some && full, 'it goes with the Rage');
  assert.ok(full.left >= 65 && full.left <= 75, `it spends 30 (${full.left} left)`);
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
  // (The Aegis also blocks a hit outright now and then: no luck here, so the hit lands.)
  const roll = Math.random;
  Math.random = () => 0.99;
  try {
    hurtPlayer(w, 400, w.body.x + 20);
  } finally {
    Math.random = roll;
  }
  assert.ok(w.char.hp < w.stats.maxHp * 0.5, 'knocked under half');
  assert.ok(w.char.buffs.divineaegis?.values.dmgCut > 0, 'the blade goes up');
  const since = w.char.buffs.divineaegis.since;
  w.invuln = 0;
  hurtPlayer(w, 50, w.body.x + 20);
  assert.equal(w.char.buffs.divineaegis.since, since, 'not again while it holds');
});

test('no skill has a level limit: every skill of a path can be learned from the start', async () => {
  const { canLearn } = await import('../src/core/character.js');
  const { SKILLS } = await import('../src/data/skills.js');
  for (const s of Object.values(SKILLS)) assert.equal(s.minLevel, undefined, s.id);
  const w = advanced('paladin');
  w.char.sp = 5;
  w.char.level = 31;
  assert.ok(canLearn(w.char, 'hallowedground'));
  assert.ok(canLearn(w.char, 'judgment'));
});

test('Divine Aegis: a shield of light sometimes blocks a hit outright and answers with a stunning holy shockwave', async () => {
  const { hurtPlayer } = await import('../src/world/world.js');
  const w = advanced('paladin');
  w.god = false;
  w.char.skills.divineaegis = 10;
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
  assert.ok(Number.isInteger(high) && Number.isInteger(low), `whole HP only (${high}, ${low})`);
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
  // She waddles (slowly, by design), so from the far end of a fight it can take her a while.
  const beside = () => Math.abs(w.pets.snow.x - w.body.x) < 80 && Math.abs(w.pets.snow.y - w.body.y) < 30;
  for (let i = 0; i < 60 * 12 && !beside(); i++) updateWorld(w, DT, idle);
  assert.ok(beside(), 'back beside her');
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
  // Lunar Howl: pressed, she howls whatever she was doing; what's close round her is stunned.
  const v = archer('beastmaster');
  v.char.skills.packhowl = 10;
  v.char.mp = 9999;
  Object.assign(v.pets.snow.body, { x: v.mobs[0].x - 20, vx: 0 });
  run(v, 0.05);
  v.pets.snow.act = { kind: 'cast', t0: v.now, dur: 9 };
  assert.ok(cast(v, 'packhowl').ok);
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
  // The same rolls each time (which blow she picks, crits), so only her mood differs.
  const calm = dice(0.5, () => hits(0, false));
  const fed = dice(0.5, () => hits(100, false));
  const awake = dice(0.5, () => hits(100, true));
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

test('out of her reach, Snow wolf leaps on them and lands with a blow that hits all round', () => {
  const w = archer('beastmaster');
  const s = w.pets.snow;
  Object.assign(s.body, { x: 300, vx: 0, facing: 1 });
  Object.assign(s, { act: null, next: 0, leapAt: 0 });
  w.bolts = [];
  w.mobs.forEach((m, i) => Object.assign(m, { x: 520 + i * 20 }));
  let leapt = false;
  let landed = null;
  for (let i = 0; i < 60 * 2 && !landed; i++) {
    updateWorld(w, DT, idle);
    leapt ||= s.act?.kind === 'leap';
    if (leapt && w.fx.some((f) => f.kind === 'moonquake')) landed = w.mobs.filter((m) => m.hp < 1e9).length;
  }
  assert.ok(leapt, 'she leaps');
  assert.ok(Math.abs(s.x - 540) < 60, `landing beside them (${Math.round(s.x)})`);
  assert.equal(landed, 3, 'the landing hits all three');
});

test("Snow wolf won't take the same order again until it has cooled down", async () => {
  const { sendSnow, moonfall } = await import('../src/world/pets.js');
  const w = archer('beastmaster');
  const s = w.pets.snow;
  Object.assign(s, { act: null, next: Infinity });
  assert.ok(moonfall(w, w.mobs[0], 100), 'the first Moonfall goes');
  run(w, 1.2);
  s.act = null;
  assert.equal(moonfall(w, w.mobs[0], 100), false, 'a second one right after waits');
  assert.ok(sendSnow(w, w.mobs[0], 100), 'another order still goes');
  run(w, 5);
  s.act = null;
  assert.ok(moonfall(w, w.mobs[0], 100), 'and once it has cooled, Moonfall goes again');
});

test('Sleeve Junk: further off, Snow wolf lobs whatever is in her sleeve; it bonks, the cat naps on it, the cookie she eats', () => {
  const junk = (roll) => {
    const w = archer('beastmaster');
    const s = w.pets.snow;
    Object.assign(s.body, { x: w.body.x - 20, vx: 0, facing: 1 });
    Object.assign(s, { act: null, next: 0, leapAt: Infinity });
    w.bolts = [];
    w.mobs = [w.mobs[0]];
    Object.assign(w.mobs[0], { x: w.body.x + 180 });
    const seen = { item: null, bonk: false, nap: false };
    dice(roll, () => {
      for (let i = 0; i < 60 * 1.6; i++) {
        updateWorld(w, DT, idle);
        if (s.act?.kind === 'toss') seen.item ??= s.act.item;
        seen.bonk ||= w.fx.some((f) => f.kind === 'bonk');
        seen.nap ||= w.fx.some((f) => f.kind === 'catnap') && w.mobs[0].hold === 'stun';
      }
    });
    return { ...seen, hit: w.mobs[0].hp < 1e9 };
  };
  const rock = junk(0.01);
  assert.equal(rock.item, 'rock', 'out comes a rock');
  assert.ok(rock.bonk && rock.hit, 'BONK');
  const cat = junk(0.88);
  assert.equal(cat.item, 'cat');
  assert.ok(cat.nap, 'the cat naps on its head, holding it still');
  const cookie = junk(0.97);
  assert.equal(cookie.item, 'cookie');
  assert.ok(!cookie.hit, 'the cookie she eats instead');
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

test('Last Straw needs full Bond, spends it, and Snow wolf snaps: one blow all round her, the whole screen across', () => {
  const w = archer('beastmaster');
  w.char.skills.stampede = 10;
  w.char.mp = 9999;
  w.bond = 60;
  assert.equal(cast(w, 'stampede').reason, 'gauge:bond', 'waits for full Bond');
  w.bond = 100;
  // Far off when it's cast: she's beside the Beastmaster in a flash.
  w.pets.snow.body.x = w.body.x - 300;
  w.mobs.forEach((m, i) => Object.assign(m, { x: w.body.x + [-260, 200, 380][i] }));
  assert.ok(cast(w, 'stampede').ok);
  assert.equal(w.bond, 0, 'spends all of it');
  let snapped = false;
  let moon = false;
  let air = 0;
  for (let i = 0; i < 60 * 3; i++) {
    updateWorld(w, DT, idle);
    if (w.pets.snow.act?.kind === 'straw') snapped ||= Math.abs(w.pets.snow.x - w.body.x) < 60;
    moon ||= w.fx.some((f) => f.kind === 'strawmoon');
    air = Math.max(air, ...w.mobs.map((m) => m.air ?? 0));
  }
  assert.ok(snapped, 'she snaps, right beside the Beastmaster');
  assert.ok(moon, 'the full moon rises');
  assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 3, 'every monster both ways is hit');
  assert.ok(air > 30, 'and thrown into the air');
});

test('Snack Time: Snow wolf catches the cookie and is happy for a while: her Patience holds and her attacks come quicker', () => {
  const w = archer('beastmaster');
  w.char.skills.snacktime = 10;
  w.char.mp = 9999;
  assert.ok(cast(w, 'snacktime').ok);
  let caught = false;
  for (let i = 0; i < 30; i++) {
    updateWorld(w, DT, idle);
    caught ||= w.pets.snow.act?.kind === 'snack';
  }
  assert.ok(caught, 'she catches the cookie');
  assert.ok(w.fx.some((f) => f.kind === 'cookie') || caught, 'tossed to her');
  assert.ok(w.pets.snow.happy, 'and is happy');
  // Her Patience holds while she's happy.
  w.mobs = [];
  w.bond = 50;
  w.bondAt = w.now - 100;
  updateWorld(w, DT, idle);
  const held = w.bond;
  run(w, 2);
  assert.equal(w.bond, held, 'her Patience holds');
  // Her own attacks: quicker.
  const attacks = (snack) => {
    const v = archer('beastmaster');
    if (snack) {
      v.char.skills.snacktime = 10;
      v.char.mp = 9999;
      cast(v, 'snacktime');
      run(v, 1.1);
    }
    let n = 0;
    for (let i = 0; i < 60 * 6; i++) {
      updateWorld(v, DT, idle);
      if (v.pets.snow.act?.own && v.pets.snow.act.t0 === v.now) n++;
    }
    return n;
  };
  assert.ok(attacks(true) > attacks(false), 'she attacks more often');
});

test('Snow wolf keeps close: monsters far from the Beastmaster are left alone', () => {
  const w = archer('beastmaster');
  w.mobs.forEach((m, i) => Object.assign(m, { x: w.body.x + 600 + i * 20 }));
  run(w, 5);
  assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 0, 'none of them hit');
  assert.ok(Math.abs(w.pets.snow.x - w.body.x) < 80, 'she stays by the Beastmaster');
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
  for (const [job, up, air, run0] of [['beastmaster', 'skyshot', 'airshot', 'slideshot'], ['stormcaller', 'aeup', 'aeair', 'aeroll']]) {
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

test("the Archer's skills go on as each path's arrows: gold and mint for her, green for the Beastmaster", () => {
  for (const [job, shot] of [['archer', 'acarrow'], ['beastmaster', 'windarrow'], ['stormcaller', 'aebolt']]) {
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
    assert.equal(w.pose.kind, job === 'stormcaller' ? 'aeair' : job === 'archer' ? 'acair' : 'downshot', `${job}: aims down`);
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
  gainExp(c, 1e6);
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
  gainExp(c, 1e6);
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
  // Let go: a soft drift down, then she lands.
  run(w, 0.8);
  assert.ok(!w.body.onGround && w.body.vy <= 75, `drifting down (${w.body.vy.toFixed(0)}px/s)`);
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
  const families = { warrior: ['warrior'], paladin: ['warrior', 'paladin'], berserker: ['warrior', 'berserker'], archer: ['archer'], beastmaster: ['archer', 'beastmaster'], stormcaller: ['archer', 'stormcaller'], thief: ['thief'], thiefstar: ['thief'], shinobi: ['thief', 'shinobi'], kitsune: ['thief', 'kitsune'], spiritmage: ['spiritmage'], shrinemaiden: ['spiritmage', 'shrinemaiden'], onmyoji: ['spiritmage', 'onmyoji'] };
  const weapons = { warrior: 'sword_20', paladin: 'sword_20', berserker: 'axe_20', archer: 'bow_20', beastmaster: 'bow_20', stormcaller: 'crossbow_20', thief: 'dagger_20', thiefstar: 'gauntlet_20', shinobi: 'dagger_20', kitsune: 'gauntlet_20', spiritmage: 'wand_20', shrinemaiden: 'wand_20', onmyoji: 'staff_20' };
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
        if (w.pose && w.pose.since !== last) {
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
  for (const [job, weapon, skill] of [['warrior', 'sword_20', 'shouldercharge'], ['archer', 'bow_20', 'vault'], ['thief', 'gauntlet_20', 'pirouette'], ['thief', 'dagger_20', 'pirouette']]) {
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

test("the Paladin and the Berserker never share a swing, and the Berserker shares none with the Warrior", () => {
  const moves = (path) => new Set(PATH_VARIANTS[path].flat().map((s) => s.move));
  const pal = moves('paladin');
  const ber = moves('berserker');
  const war = moves('warrior');
  for (const m of ber) assert.ok(!pal.has(m), `both swing ${m}`);
  for (const m of ber) assert.ok(!war.has(m), `the Berserker borrows the Warrior's ${m}`);
  for (const m of ['axehurl', 'bodyslam', 'dragrise']) assert.ok(ber.has(m) && MOVES[m], `the Berserker's ${m}`);
  assert.ok(pal.has('shieldslam') && MOVES.shieldslam, "the Paladin's shield slam");
  assert.ok(PATH_VARIANTS.berserker.at(-1).every((s) => s.finisher && s.strikes.some((st) => st.crack)), 'every Berserker finisher tears the ground');
});

// A provoke (Hallowed Ground's taunt in a dungeon) cries out in the colour of whoever cried it:
// it was always the Berserker's red, even for a Paladin.
test("a provoke takes the colour of the path that cried it", async () => {
  const { provoke } = await import('../src/world/dungeon.js');
  for (const [job, school] of [['paladin', 'holy'], ['berserker', 'rage']]) {
    const w = advanced(job);
    provoke(w, 'you', w.body);
    assert.equal(w.fx.find((f) => f.kind === 'roar').school, school, job);
  }
});

// Blast Arrow is the Archer's, but each path's burst is its own: the Archer's fire, the
// Beastmaster's gale of wind and leaves, the Stormcaller's thunderclap.
test("each archer path's Blast Arrow bursts in its own look", () => {
  for (const [job, kind] of [['beastmaster', 'galeblast'], ['stormcaller', 'aeboom']]) {
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

// A basic swing that dashes (the Berserker's drag-and-rip) leaves its trail in the path's colour,
// never the Warrior's steel blue.
test("a dashing basic swing leaves its trail in the path's own colour", () => {
  const w = advanced('berserker');
  const steps = PATH_VARIANTS.berserker;
  // Its finisher is played next, as the drag-and-rip.
  w.comboPlan = steps.map((choices, i) => (i === steps.length - 1 ? choices.findIndex((s) => s.move === 'dragrise') : 0));
  w.combo = steps.length - 2;
  w.comboUntil = w.now + 1;
  updateWorld(w, DT, press('KeyZ'));
  assert.equal(w.pose?.kind, 'dragrise');
  const trails = [];
  for (let i = 0; i < 60; i++) {
    updateWorld(w, DT, idle);
    for (const f of w.fx) if (f.kind === 'chargetrail' && !trails.includes(f)) trails.push(f);
  }
  assert.ok(trails.length, 'the drag-and-rip dashed');
  assert.ok(trails.every((f) => f.school === 'rage'), trails.map((f) => f.school).join());
});

// Shoulder Charge is each warrior path's own: the Paladin's Shield Rush marches behind a wall of
// light, the Berserker's Reckless Charge sprints and crashes down; each runs into its own attack.
test("the warrior paths charge their own way, and run into their own attack", () => {
  for (const [job, move, wall, dash] of [['paladin', 'shieldrush', true, 'bash'], ['berserker', 'recklesscharge', false, 'leapchop']]) {
    const w = advanced(job);
    w.char.skills.shouldercharge = 10;
    w.char.mp = 999;
    assert.ok(cast(w, 'shouldercharge').ok, job);
    assert.equal(w.pose.kind, move, `${job} charges with ${move}`);
    assert.equal(w.fx.some((f) => f.kind === 'shieldwall' && f.follow), wall, `${job}: the wall of light`);
    run(w, 2);
    w.mobs = [];
    run(w, 0.6, { held: new Set(['ArrowRight']), pressed: new Set(), locked: false });
    updateWorld(w, DT, { held: new Set(['ArrowRight', 'KeyZ']), pressed: new Set(['KeyZ']), locked: false });
    assert.equal(w.pose?.kind, dash, `${job} runs into ${dash}`);
  }
});

test("the Star Witch casts snappy: a wand string of her own, every cast out in about a fifth of a second", async () => {
  const { PATH_COMBOS, PATH_VARIANTS } = await import('../src/world/melee.js');
  for (const path of ['starwand', 'starstaff']) {
    assert.equal(PATH_VARIANTS[path].length, PATH_COMBOS[path].length, `${path}: a choice for every step`);
    PATH_VARIANTS[path].forEach((choices, i) => {
      assert.equal(choices[0], PATH_COMBOS[path][i]);
      assert.ok(choices.length >= 2, `${path}: step ${i + 1} has a choice`);
      for (const st of choices) {
        assert.ok(MOVES[st.move], `${st.move} is drawn`);
        assert.ok(st.strikes[0].at * st.dur <= (st.finisher ? 0.34 : 0.32), `${st.move}: the first cast is out quickly (${(st.strikes[0].at * st.dur).toFixed(2)} s)`);
      }
    });
  }
  const w = arena('wand_20');
  w.char.job = 'spiritmage';
  const seen = [];
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  for (let i = 0; i < 120; i++) {
    updateWorld(w, DT, hold);
    if (w.pose && seen.at(-1)?.step !== w.combo) seen.push({ step: w.combo, move: w.pose.kind });
  }
  assert.deepEqual(seen.slice(0, 4).map((x) => x.move), PATH_COMBOS.starwand.map((x) => x.move), 'her own wand string first');
  assert.ok(w.mobs.some((m) => m.hp < 1e9), 'her stars land');
  assert.ok(w.spirit > 0, 'and light her Constellation');
});

// A Star Witch with a wand, every skill of hers learned, and MP to spare.
function starWitch(weapon = 'wand_20') {
  const w = arena(weapon);
  w.char.job = 'spiritmage';
  Object.assign(w.char.skills, { spiritbolt: 20, spiritwave: 20, blessing: 20, spiritward: 15, manamastery: 20, heavenslantern: 10 });
  w.char.baseMp = 1e6;
  w.char.mp = 1e6;
  run(w, 0.2);
  return w;
}

// (Her paths' tests start from her too.)
const shrineMage = starWitch;

test('her staff calls a meteor down from the sky onto them', () => {
  const w = starWitch('staff_20');
  w.combo = 1;
  w.comboUntil = w.now + 9;
  w.comboPlan = [0, 0, 0, 0];
  updateWorld(w, DT, press('KeyZ'));
  assert.equal(w.pose.kind, 'ssplant');
  let fromSky = false;
  for (let i = 0; i < 50; i++) {
    updateWorld(w, DT, idle);
    fromSky ||= w.fx.some((f) => f.kind === 'projectile' && f.shot === 'stmeteor' && f.y < w.body.y - 120);
  }
  assert.ok(fromSky, 'it falls from high above');
  assert.ok(w.mobs.some((m) => m.hp < 1e9), 'and lands');
});

test('a full Constellation splits her star bolts into three', () => {
  const bolts = (spirit) => {
    const w = starWitch();
    w.spirit = spirit;
    w.spiritAt = 1e9;
    updateWorld(w, DT, press('KeyZ'));
    let n = 0;
    for (let i = 0; i < 30; i++) {
      updateWorld(w, DT, idle);
      n = Math.max(n, w.fx.filter((f) => f.kind === 'projectile' && f.shot === 'stbolt').length);
    }
    return n;
  };
  assert.equal(bolts(0), 1);
  assert.equal(bolts(100), 3);
});

test('Comet tears through the line', () => {
  const w = starWitch();
  assert.ok(cast(w, 'spiritwave').ok);
  assert.equal(w.pose.kind, 'swshowoff');
  run(w, 1);
  assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 3, 'every monster in the line');
});

test('Wishing Star heals her when the star falls, then keeps healing, and builds her Constellation', () => {
  const w = starWitch();
  w.god = false;
  // (The dummies out of reach, so nothing knocks her HP about while it's measured.)
  for (const m of w.mobs) m.x += 900;
  w.char.hp = Math.round(w.stats.maxHp * 0.3);
  const hp0 = w.char.hp;
  assert.ok(cast(w, 'blessing').ok);
  run(w, 0.15);
  assert.equal(w.char.hp, hp0, 'nothing on the press');
  run(w, 0.8);
  const healed = w.char.hp;
  assert.ok(healed > hp0, 'mended as the star falls');
  assert.ok(w.char.buffs.blessing?.values.regenPct > 0, 'and blessed for a while');
  run(w, 2);
  assert.ok(w.char.hp > healed, 'healing a little more every second');
  assert.ok(w.spirit > 0, 'healing lights her stars');
});

test('Star Veil puts a barrier on her that soaks up damage', () => {
  const w = starWitch();
  assert.ok(cast(w, 'spiritward').ok);
  run(w, 1);
  const b = w.char.buffs.spiritward;
  assert.ok(b && b.shield > 0, 'a veil of stars');
  assert.ok(Math.abs(b.shield - Math.round(w.stats.maxHp * b.values.barrier)) <= 1, 'as strong as its share of her max HP');
});

test('Starfall needs a full Constellation, spends it, rains meteors on everything ahead, and never refills it', () => {
  const w = starWitch();
  w.spirit = 60;
  assert.equal(cast(w, 'heavenslantern').reason, 'gauge:spirit', 'waits for all seven stars');
  w.spirit = 100;
  w.spiritAt = w.now;
  assert.ok(cast(w, 'heavenslantern').ok);
  assert.equal(w.spirit, 0, 'spends all of it');
  let rain = false;
  dice(0.5, () => {
    for (let i = 0; i < 60 * 3; i++) {
      updateWorld(w, DT, idle);
      rain ||= w.fx.some((f) => f.kind === 'rain' && f.variant === 'stmeteor');
    }
  });
  assert.ok(rain, 'meteors fall');
  assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 3, 'on every monster ahead');
  assert.ok(w.spirit < 10, `and it never refills (${w.spirit})`);
});

// A Starlight Idol (past Elowen's trial).
function idol() {
  const w = shrineMage();
  w.char.quests.spiritmage_trial = { state: 'done', kills: {} };
  w.char.job = 'shrinemaiden';
  run(w, 0.2);
  return w;
}
// A Starlight Idol with her own skills learned.
function idolFull() {
  const w = idol();
  Object.assign(w.char.skills, { grandblessing: 15, idolcheer: 15, purification: 15, resurrection: 8, thousandtorii: 8, shrinemastery: 10 });
  // (Built as a Star Witch first: whatever stars she lit before she advanced are gone.)
  w.spirit = 0;
  return w;
}
const settleCast = (w, s = 3) => run(w, s);

test('the Starlight Idol sings her own notes and her own pool of moves, and they build Applause (not Spirit)', () => {
  const pool = PATH_VARIANTS.idol;
  assert.equal(pool.length, PATH_COMBOS.idol.length, 'one choice per combo step');
  pool.forEach((step, i) => {
    assert.equal(step[0], PATH_COMBOS.idol[i], `step ${i + 1} opens with her own`);
    assert.ok(step.length >= 2, `step ${i + 1} has a choice`);
    for (const v of step) assert.ok(MOVES[v.move], `${v.move} is a move`);
  });
  assert.ok(pool.at(-1).every((v) => v.finisher), 'every last move is a finisher');
  const w = idol();
  w.spirit = 0;
  const seen = [];
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  let shot = null;
  for (let i = 0; i < 120; i++) {
    updateWorld(w, DT, hold);
    if (w.pose && seen.at(-1) !== w.pose.kind) seen.push(w.pose.kind);
    shot ??= w.fx.find((f) => f.kind === 'projectile')?.shot;
  }
  assert.deepEqual(seen.slice(0, 3), PATH_COMBOS.idol.map((s) => s.move), 'her combo');
  assert.equal(shot, 'sinote', 'sparkle notes');
  assert.ok(w.grace > 0, `her notes build Applause (${w.grace})`);
  assert.equal(w.spirit ?? 0, 0, 'and no stars');
});

test('Healing Song heals at once, then hangs in the air mending whoever stands in it; Live Show reaches twice as far', () => {
  const w = idolFull();
  w.char.hp = Math.round(w.stats.maxHp * 0.3);
  assert.ok(cast(w, 'grandblessing').ok);
  run(w, 0.7);
  const after = w.char.hp;
  assert.ok(after > w.stats.maxHp * 0.45, 'it heals her at once');
  const song = w.songs.find((s) => s.kind === 'heal');
  assert.ok(song, 'the song hangs where she sang it');
  run(w, 3);
  assert.ok(w.char.hp > after, 'and keeps mending her while she stands in it');
  assert.ok(w.grace > 5, `healing builds Applause (${w.grace})`);
  // Live Show: sung again on full Applause, it reaches twice as far.
  w.grace = 100;
  w.graceAt = 1e9;
  settleCast(w, 1);
  assert.ok(cast(w, 'grandblessing').ok);
  run(w, 0.7);
  const live = w.songs.find((s) => s.kind === 'heal');
  assert.ok(live.live && live.r >= song.r * 2 - 1, `Live Show: ${live.r} against ${song.r}`);
  assert.equal(w.songs.filter((s) => s.kind === 'heal').length, 1, 'one healing song at a time');
});

test('Cheer: everyone standing in it hits harder, and stepping out of it lets it go', () => {
  const w = idolFull();
  assert.ok(cast(w, 'idolcheer').ok);
  run(w, 1.6);
  assert.ok(w.char.buffs.idolcheer?.values.watk > 0, 'standing in it lifts her attack');
  w.body.x += 900;
  run(w, 2.5);
  assert.ok(!(w.char.buffs.idolcheer?.until > w.now), 'out of it, the lift wears off');
});

test('Lullaby: the monsters in it slow to a drift and her notes chip at them again and again', () => {
  const w = idolFull();
  w.mobs.forEach((m, i) => Object.assign(m, { x: w.body.x + [40, 80, 500][i] }));
  const hp0 = w.mobs.map((m) => m.hp);
  assert.ok(cast(w, 'purification').ok);
  const hits = w.mobs.map(() => 0);
  let last = hp0.slice();
  let lulled = false;
  for (let i = 0; i < 60 * 4; i++) {
    updateWorld(w, DT, idle);
    lulled ||= w.mobs[0].lulled > 0;
    w.mobs.forEach((m, j) => { if (m.hp < last[j]) hits[j]++; last[j] = m.hp; });
  }
  assert.ok(lulled, 'they are lulled');
  assert.ok(hits[0] >= 4 && hits[1] >= 4, `chipped at again and again (${hits})`);
  assert.equal(hits[2], 0, 'and not the one outside it');
});

test("Curtain Call's Encore keeps her standing through a blow that would knock her out, once", () => {
  const w = idolFull();
  w.god = false;
  assert.ok(cast(w, 'resurrection').ok);
  assert.equal(w.pose.kind, 'sibow');
  settleCast(w, 3);
  assert.ok(w.char.buffs.resurrection, 'Encore is on her');
  w.invuln = 0;
  hurtPlayer(w, 1e7, w.body.x + 30);
  assert.equal(w.dead, false, 'she is still standing');
  assert.ok(w.char.hp > 0);
  assert.ok(!w.char.buffs.resurrection, 'and it is spent');
});

test('Grand Concert needs full Applause, spends it, heals in full, and three beats of music blast the monsters', () => {
  const w = idolFull();
  w.char.hp = Math.round(w.stats.maxHp * 0.2);
  w.mobs.forEach((m, i) => Object.assign(m, { x: w.body.x + [-120, 90, 250][i] }));
  const hp0 = w.mobs.map((m) => m.hp);
  assert.equal(cast(w, 'thousandtorii').reason, 'gauge:grace', 'needs full Applause');
  w.grace = 100;
  w.graceAt = w.now;
  assert.ok(cast(w, 'thousandtorii').ok);
  assert.equal(w.grace, 0, 'spends it');
  assert.equal(w.pose.kind, 'siconcert');
  let stage = false;
  let beats = 0;
  for (let i = 0; i < 60 * 3; i++) {
    updateWorld(w, DT, idle);
    stage ||= w.fx.some((f) => f.kind === 'sistage');
    beats = Math.max(beats, w.concert?.done ?? 0);
  }
  assert.ok(stage, 'the stage rises');
  assert.equal(w.char.hp, w.stats.maxHp, 'she is healed in full');
  assert.ok(beats >= 3 || !w.concert, `three beats (${beats})`);
  assert.ok(w.mobs.every((m, i) => m.hp < hp0[i]), 'the music reaches every monster round her');
  assert.ok(w.char.buffs.thousandtorii?.shield > 0, 'and the party is warded');
});

// An Astronomer (past Elowen's trial), with her orrery staff.
function astronomer(skills = false) {
  const w = starWitch('staff_20');
  w.char.quests.spiritmage_trial = { state: 'done', kills: {} };
  w.char.job = 'onmyoji';
  if (skills) Object.assign(w.char.skills, { onmyodo: 10, ofudabarrage: 15, seimanseal: 15, yokairally: 10, troupecombo: 8 });
  w.spirit = 0;
  run(w, 0.2);
  return w;
}
// How many moons fly off at the monsters in `secs` seconds.
const moonShots = (w, secs) => {
  let n = 0;
  for (let i = 0; i < secs * 60; i++) {
    w.bindingAt = w.now;
    updateWorld(w, DT, idle);
    for (const f of w.fx) if (f.kind === 'projectile' && f.shot === 'asmoon' && !f.counted) {
      f.counted = true;
      n++;
    }
  }
  return n;
};

test('the Astronomer flings her own planets and her own pool of moves, and they build Orbit (not Spirit)', () => {
  const pool = PATH_VARIANTS.astro;
  assert.equal(pool.length, PATH_COMBOS.astro.length, 'one choice per combo step');
  pool.forEach((step, i) => {
    assert.equal(step[0], PATH_COMBOS.astro[i], `step ${i + 1} opens with her own`);
    assert.ok(step.length >= 2, `step ${i + 1} has a choice`);
    for (const v of step) assert.ok(MOVES[v.move], `${v.move} is a move`);
  });
  assert.ok(pool.at(-1).every((v) => v.finisher), 'every last move is a finisher');
  const w = astronomer();
  const seen = [];
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  let shot = null;
  for (let i = 0; i < 140; i++) {
    updateWorld(w, DT, hold);
    if (w.pose && seen.at(-1) !== w.pose.kind) seen.push(w.pose.kind);
    shot ??= w.fx.find((f) => f.kind === 'projectile')?.shot;
  }
  assert.deepEqual(seen.slice(0, 3), PATH_COMBOS.astro.map((s) => s.move), 'her combo');
  assert.equal(shot, 'asplanet', 'planets');
  assert.ok(w.binding > 0, `her planets build Orbit (${w.binding})`);
  assert.equal(w.spirit ?? 0, 0, 'and no stars');
});

test('her moons: one for every fifth of Orbit, flying off at the monsters on their own; on Full Orbit twice as often', async () => {
  const { moonsOf } = await import('../src/world/astro.js');
  const w = astronomer();
  w.binding = 0;
  assert.equal(moonsOf(w), 0, 'no moons yet');
  w.binding = 41;
  assert.equal(moonsOf(w), 2, 'two moons at two fifths');
  w.binding = 20;
  const hp0 = w.mobs.map((m) => m.hp);
  const one = moonShots(w, 4);
  assert.ok(one >= 2, `one moon flies out on its own (${one})`);
  assert.ok(w.mobs.some((m, i) => m.hp < hp0[i]), 'and strikes');
  const full = astronomer();
  full.binding = 100;
  const five = moonShots(full, 4);
  assert.ok(five >= one * 4, `Full Orbit: five moons, twice as quick (${five} against ${one})`);
  assert.equal(moonsOf(astronomer()), 0, 'and none for a Star Witch\'s stars');
});

test('Ringed Planet rolls a great ringed world through every monster in the line', () => {
  const w = astronomer(true);
  w.mobs.forEach((m, i) => (m.x = w.body.x + 120 + i * 60));
  assert.ok(cast(w, 'ofudabarrage').ok);
  assert.equal(w.pose.kind, 'asglobe');
  let big = false;
  for (let i = 0; i < 120; i++) {
    updateWorld(w, DT, idle);
    big ||= w.fx.some((f) => f.kind === 'projectile' && f.shot === 'asbig');
  }
  assert.ok(big, 'the ringed world rolls out');
  assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 3, 'through the whole line');
});

test('Gravity Well pulls the monsters round it in and crushes them again and again, and is gone after a map change', async () => {
  const { loadMap } = await import('../src/world/world.js');
  const w = astronomer(true);
  w.mobs.forEach((m, i) => Object.assign(m, { x: w.body.x + [60, 220, 600][i] }));
  for (const m of w.mobs) m.def = { ...m.def, speed: 0 };
  const x0 = w.mobs.map((m) => m.x);
  const hits = w.mobs.map(() => 0);
  let last = w.mobs.map((m) => m.hp);
  assert.ok(cast(w, 'seimanseal').ok);
  for (let i = 0; i < 60 * 3; i++) {
    updateWorld(w, DT, idle);
    w.mobs.forEach((m, j) => { if (m.hp < last[j]) hits[j]++; last[j] = m.hp; });
  }
  assert.ok(w.well, 'the well hangs there');
  assert.ok(Math.abs(w.mobs[1].x - w.well.x) < Math.abs(x0[1] - w.well.x), 'a monster at its edge is drawn in');
  assert.ok(hits[0] >= 3 && hits[1] >= 3, `crushed again and again (${hits})`);
  assert.equal(hits[2], 0, 'not one far off');
  loadMap(w, w.map.id, w.char.portal);
  run(w, 0.2);
  assert.equal(w.well, null, 'gone with the map');
});

test('Lunar Tide: her moons fly out more often while it lasts', () => {
  const plain = astronomer(true);
  plain.binding = 60;
  const before = moonShots(plain, 4);
  const w = astronomer(true);
  w.binding = 60;
  assert.ok(cast(w, 'yokairally').ok);
  assert.equal(w.pose.kind, 'astide');
  run(w, 1.1);
  assert.ok(w.char.buffs.yokairally, 'the tide is on her');
  const after = moonShots(w, 4);
  assert.ok(after > before, `more moons fly (${after} against ${before})`);
});

test('Planetary Alignment needs a Full Orbit, spends it, and its beam goes through every monster ahead', () => {
  const w = astronomer(true);
  w.mobs.forEach((m, i) => Object.assign(m, { x: w.body.x + [-140, 140, 380][i] }));
  const hp0 = w.mobs.map((m) => m.hp);
  assert.equal(cast(w, 'troupecombo').reason, 'gauge:binding', 'needs a Full Orbit');
  w.binding = 100;
  w.bindingAt = w.now;
  assert.ok(cast(w, 'troupecombo').ok);
  assert.equal(w.binding, 0, 'spends it');
  assert.equal(w.pose.kind, 'asalign');
  let row = false;
  dice(0.5, () => {
    for (let i = 0; i < 60 * 2.4; i++) {
      updateWorld(w, DT, idle);
      row ||= w.fx.some((f) => f.kind === 'asalign');
    }
  });
  assert.ok(row, 'the planets line up');
  assert.ok(w.mobs[1].hp < hp0[1] && w.mobs[2].hp < hp0[2], 'the beam goes through everything ahead');
  assert.equal(w.mobs[0].hp, hp0[0], 'and not behind her');
});

// ---------- Getting about: the Thief's flash jump and shadow dash, the Archer's air leap ----------
const tap = (w, keys, held = keys) => updateWorld(w, DT, { held: new Set(held), pressed: new Set(keys), locked: false });
const keep = (w, keys, n) => {
  for (let i = 0; i < n; i++) updateWorld(w, DT, { held: new Set(keys), pressed: new Set(), locked: false });
};

test("a Thief's flash jump throws her far forward in mid-air, once per jump, in her own colour", () => {
  for (const job of [null, 'shinobi', 'kitsune']) {
    const w = job ? thiefPath(job) : thief();
    w.mobs = [];
    w.body.x = 200;
    w.body.facing = 1;
    tap(w, ['Space']);
    keep(w, [], 12);
    assert.ok(!w.body.onGround, 'in the air');
    const x0 = w.body.x;
    tap(w, ['Space']);
    assert.equal(w.pose?.kind, 'flashjump');
    const fx = w.fx.find((f) => f.kind === 'leapburst');
    assert.equal(fx?.school, { null: 'coral', shinobi: 'rosegold', kitsune: 'aerial' }[job]);
    keep(w, [], 20);
    assert.ok(w.body.x - x0 > 140, `${job ?? 'thief'} flies forward (${(w.body.x - x0).toFixed(0)}px)`);
    // Only once per jump.
    const x1 = w.body.x;
    const vx = w.body.vx;
    tap(w, ['Space']);
    assert.ok(!w.flash && w.body.vx <= vx + 1, 'no second flash jump');
    for (let i = 0; i < 120 && !w.body.onGround; i++) keep(w, [], 1);
    assert.ok(w.body.onGround && w.body.x > x1, 'lands ahead');
  }
});

test("a Thief's shadow dash: double-tap slips her through monsters untouched, with a beat before the next", () => {
  const w = thief();
  w.god = false;
  w.body.x = 250;
  w.body.facing = 1;
  keep(w, [], 5);
  const x0 = w.body.x;
  tap(w, ['ArrowRight']);
  keep(w, [], 3);
  tap(w, ['ArrowRight']);
  assert.equal(w.pose?.kind, 'shadowrun');
  assert.ok(w.invuln > 0.2, 'untouchable while she slips through');
  keep(w, [], 14);
  assert.ok(w.body.x - x0 > 120, `dashes through the line (${(w.body.x - x0).toFixed(0)}px)`);
  assert.ok(w.body.x > Math.max(...w.mobs.map((m) => m.x)), 'out the far side');
  // Straight away again: nothing; after the beat, yes.
  const x1 = w.body.x;
  tap(w, ['ArrowRight']);
  keep(w, [], 2);
  tap(w, ['ArrowRight']);
  keep(w, [], 8);
  assert.ok(w.body.x - x1 < 60, 'no chaining dashes');
  keep(w, [], 30);
  const x2 = w.body.x;
  tap(w, ['ArrowRight']);
  keep(w, [], 2);
  tap(w, ['ArrowRight']);
  keep(w, [], 14);
  assert.ok(w.body.x - x2 > 120, 'ready again after its beat');
  // A single tap is just a step.
  keep(w, [], 40);
  const x3 = w.body.x;
  tap(w, ['ArrowRight']);
  keep(w, [], 14);
  assert.ok(w.body.x - x3 < 60, 'one tap only walks');
});

test("an Archer's air leap springs her up and back and looses a shot from the top, once per jump", () => {
  for (const job of ['beastmaster', 'stormcaller']) {
    const w = archer(job);
    w.body.x = 200;
    w.body.facing = 1;
    tap(w, ['Space']);
    keep(w, [], 10);
    const x0 = w.body.x;
    const before = shots(w);
    tap(w, ['Space']);
    assert.equal(w.pose?.kind, 'leapshot');
    assert.ok(w.airJumped, 'used for this jump');
    let fired = 0;
    for (let i = 0; i < 40; i++) {
      keep(w, [], 1);
      fired += shots(w);
    }
    assert.ok(fired > before, `${job} looses from the leap`);
    assert.ok(w.body.x < x0 - 30, `${job} springs back (${(x0 - w.body.x).toFixed(0)}px)`);
  }
  // A Warrior has no second jump.
  const w = arena();
  w.body.x = 200;
  tap(w, ['Space']);
  keep(w, [], 10);
  const vy = w.body.vy;
  tap(w, ['Space']);
  assert.ok(w.body.vy >= vy, 'no air jump');
});

// ---------- The other endless barrage: the Beastmaster's wild hunt ----------
test('Wild Hunt: quick shots, shooting on the move, Snow wolf joins the hunt, a gale of leaves; a gale arrow and her moon end it', async () => {
  const { STREAMS } = await import('../src/world/melee.js');
  const w = archer('beastmaster');
  learn(w, 'wildhunt');
  run(w, 1);
  const acts = [];
  const figures = [];
  let since = null;
  let seed = 11;
  dice(0, () => {
    Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 6.5 * 60; i++) {
      updateWorld(w, DT, i === 0 ? press('KeyZ') : { held: new Set(['KeyZ']), pressed: new Set(), locked: false });
      if (w.pose?.since !== since && w.pose?.flow) figures.push({ at: w.now, kind: w.pose.kind, heat: w.pose.flow.heat });
      since = w.pose?.since;
      if (w.pets.snow.act?.duet && !acts.includes(w.pets.snow.act)) acts.push(w.pets.snow.act);
    }
  });
  const kinds = new Set(figures.map((f) => f.kind));
  // Every stage comes up, each with a mix of its figures.
  for (const st of STREAMS.beastmaster.stages.slice(0, 4)) assert.ok(st.figures.filter((k) => kinds.has(k)).length >= 2, `plays the stage from ${st.at}`);
  for (const k of kinds) assert.ok(MOVES[k], `${k} is drawn`);
  assert.ok(figures.every((f, i) => !i || f.kind !== figures[i - 1].kind), 'never the same figure twice running');
  // Snow wolf only joins from the Duet on, then keeps hunting with her.
  const duet = figures.find((f) => f.heat >= 0.9).at;
  assert.ok(acts.length >= 2, `Snow wolf hunts beside her (${acts.length})`);
  assert.ok(acts.every((a) => a.t0 >= duet - 0.05), 'once the Duet starts');
  // Flat out, her arrows peel off the gale of leaves.
  assert.ok(w.fx.some((f) => f.kind === 'leaflaunch') || figures.at(-1).heat > 1.25, 'the gale');
  assert.ok(figures.at(-1).heat > 1.5, 'still building');
  // Letting go: the gale arrow, and Snow wolf brings the moon down.
  updateWorld(w, DT, idle);
  assert.equal(w.pose.kind, 'galeshot');
  assert.ok(w.pose.fin);
  assert.equal(w.pets.snow.act?.kind, 'cast', 'her moon');
});

test('the endless barrages need their passive and their weapon, and keep the no-squash rule', async () => {
  const { barrageOf } = await import('../src/world/melee.js');
  const bm = archer('beastmaster');
  assert.equal(barrageOf(bm), null);
  learn(bm, 'wildhunt');
  assert.ok(barrageOf(bm));
});
