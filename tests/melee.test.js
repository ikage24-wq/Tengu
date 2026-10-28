// Melee combos: basic attacks chain through a weapon's steps into a finisher, blows land as the
// blade cuts (not when the key is pressed), launchers pop monsters up, the warrior's combo skills
// carry on step by step, and once a blow lands you can move or cut in with a skill.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { createCharacter, gainExp, advanceJob } from '../src/core/character.js';
import { makeEquip } from '../src/core/items.js';
import { spawnMob } from '../src/world/mobs.js';
import { PATH_COMBOS, MAX_STOP } from '../src/world/melee.js';
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
  assert.deepEqual(seen.slice(0, PATH_COMBOS.warrior.length), PATH_COMBOS.warrior.map((s) => s.move));
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

test("the archer's skills: Double Shot, Arrow Fan, Arrow Rain, Backflip Shot", () => {
  const w = range();
  Object.assign(w.char.skills, { twinshot: 10, arrowfan: 10, arrowshower: 10, flipshot: 5 });
  w.char.mp = 9999;
  const go = (id) => {
    w.attackTimer = 0;
    w.lockTimer = 0;
    w.skillReadyAt = 0;
    w.recoverAt = null;
    assert.ok(cast(w, id).ok, id);
  };
  const hurt = () => w.mobs.filter((m) => m.hp < 1e9).length;
  go('arrowfan');
  assert.equal(w.fx.filter((f) => f.kind === 'projectile').length, 0, 'the fan leaves on the release, not the press');
  run(w, 0.8);
  assert.equal(hurt(), 3, 'one arrow for each monster');
  w.mobs.forEach((m) => (m.hp = 1e9));
  go('arrowshower');
  run(w, 1.3);
  assert.equal(hurt(), 3, 'the rain fell on all of them');
  w.mobs.forEach((m) => (m.hp = 1e9));
  go('twinshot');
  run(w, 0.5);
  go('twinshot');
  assert.equal(w.chains.twinshot.i, 1, 'two presses, two parts');
  run(w, 1);
  assert.equal(hurt(), 3, 'the heavy pair tore through the line');
  const x = w.body.x;
  go('flipshot');
  assert.ok(w.invuln > 0, 'untouchable mid-flip');
  run(w, 0.5);
  assert.ok(w.body.x < x - 60, 'flipped back');
});

test("skills can't be spammed back to back, even by moving, but basic attacks still flow into them", () => {
  const w = range();
  Object.assign(w.char.skills, { arrowfan: 10, arrowshower: 10 });
  w.char.mp = 9999;
  assert.ok(cast(w, 'arrowfan').ok);
  run(w, 0.4);
  assert.equal(cast(w, 'arrowshower').reason, 'busy', 'the fan is still being loosed');
  const left = { held: new Set(['ArrowLeft']), pressed: new Set(), locked: false };
  for (let i = 0; i < 3; i++) updateWorld(w, DT, left);
  assert.equal(cast(w, 'arrowshower').reason, 'busy', 'walking cuts the follow-through, not the wait');
  run(w, 0.4);
  assert.ok(cast(w, 'arrowshower').ok, 'free once the motion is done');
  // A basic shot flows straight into a skill once its arrow is away.
  run(w, 1.5);
  updateWorld(w, DT, { held: new Set(), pressed: new Set(['KeyZ']), locked: false });
  run(w, 0.25);
  assert.ok(cast(w, 'arrowfan').ok, 'weaved in after the arrow left');
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

test("Aegis Smite's shove stuns, and its smite calls pillars of light", () => {
  const w = advanced('paladin');
  w.char.skills.aegissmite = 10;
  const random = Math.random;
  Math.random = () => 0.5;
  try {
    assert.ok(cast(w, 'aegissmite').ok);
    run(w, 0.4);
    assert.ok(w.mobs.some((m) => m.hold === 'stun' && m.frozenUntil > w.now), 'the shove stunned');
    assert.ok(w.fx.some((f) => f.kind === 'aegis'), 'a shield of light flared');
    settle(w);
    assert.ok(cast(w, 'aegissmite').ok);
    settle(w);
    assert.ok(cast(w, 'aegissmite').ok);
    assert.equal(w.pose.kind, 'smite');
    let pillars = 0;
    for (let i = 0; i < 50; i++) {
      updateWorld(w, DT, idle);
      pillars = Math.max(pillars, w.fx.filter((f) => f.kind === 'pillar').length);
    }
    assert.ok(pillars >= 2, `pillars of light on the monsters hit (${pillars})`);
  } finally {
    Math.random = random;
  }
});

test('Hallowed Ground turns every monster it hits on you', () => {
  const w = advanced('paladin');
  w.char.skills.hallowedground = 10;
  for (const m of w.mobs) m.aggroUntil = 0;
  assert.ok(cast(w, 'hallowedground').ok);
  run(w, 0.3);
  assert.ok(w.mobs.every((m) => !m.aggroUntil), 'nothing until the blade hits the ground');
  run(w, 0.3);
  assert.ok(w.mobs.every((m) => m.aggroUntil > w.now), 'all of them come after you');
  assert.ok(w.fx.some((f) => f.kind === 'consecrate'), 'a ring of holy light');
});

test("a Berserker's blows build Rage, which drains once the fighting stops", () => {
  const w = advanced('berserker', 'axe_20');
  w.char.skills.ravage = 10;
  assert.equal(w.rage, 0);
  const tap = { held: new Set(), pressed: new Set(['KeyZ']), locked: false };
  updateWorld(w, DT, tap);
  run(w, 0.5);
  assert.ok(w.rage > 0, 'a basic blow builds a little');
  const after = w.rage;
  assert.ok(cast(w, 'ravage').ok);
  run(w, 0.6);
  assert.ok(w.rage > after + 5, `Ravage builds more (${after} -> ${w.rage})`);
  const held = w.rage;
  run(w, 3);
  assert.equal(w.rage, held, 'holds for a moment');
  run(w, 4);
  assert.ok(w.rage < held, 'then drains away');
  // Other jobs never build it.
  const p = advanced('paladin');
  updateWorld(p, DT, tap);
  run(p, 0.5);
  assert.equal(p.rage, 0);
});

test('Rampage needs Rage, spends all of it, and hits harder the more there was', () => {
  const damageAt = (rage) => {
    const w = advanced('berserker', 'axe_20');
    w.char.skills.rampage = 10;
    const random = Math.random;
    Math.random = () => 0.5;
    try {
      w.rage = rage;
      w.rageAt = w.now;
      const r = cast(w, 'rampage');
      if (!r.ok) return r.reason;
      assert.equal(w.rage, 0, 'spent it all');
      const m = w.mobs[0];
      const marks = [];
      let last = m.hp;
      for (let i = 0; i < 100; i++) {
        updateWorld(w, DT, idle);
        if (m.hp < last) marks.push(i);
        last = m.hp;
      }
      assert.equal(marks.length, 4, `three chops and the dive (at frames ${marks})`);
      return 1e9 - m.hp;
    } finally {
      Math.random = random;
    }
  };
  assert.equal(damageAt(10), 'rage');
  const some = damageAt(30);
  const full = damageAt(100);
  assert.ok(full > some * 1.4, `full Rage hits much harder (${some} vs ${full})`);
});

test('Blood Frenzy raises attack and gives a quarter of your Rage', () => {
  const w = advanced('berserker', 'axe_20');
  w.char.skills.bloodfrenzy = 10;
  assert.ok(cast(w, 'bloodfrenzy').ok);
  assert.equal(w.rage, 25);
  assert.ok(w.char.buffs.bloodfrenzy.values.watk > 0);
});

test('the no-spam rule holds for the Paladin and the Berserker too', () => {
  for (const [job, weapon, skill, rage] of [['paladin', 'sword_20', 'aegissmite'], ['paladin', 'sword_20', 'hallowedground'], ['berserker', 'axe_20', 'ravage'], ['berserker', 'axe_20', 'rampage', true]]) {
    const w = advanced(job, weapon);
    w.char.skills[skill] = 10;
    if (rage) w.rage = 100;
    assert.ok(cast(w, skill).ok, `${skill} goes off`);
    run(w, 0.15);
    if (rage) w.rage = 100;
    for (let i = 0; i < 3; i++) updateWorld(w, DT, { held: new Set(['ArrowLeft']), pressed: new Set(), locked: false });
    assert.equal(cast(w, skill).reason, 'busy', `${skill} can't be recast mid-motion, even after moving`);
    settle(w);
    if (rage) w.rage = 100;
    assert.ok(cast(w, skill).ok, `${skill} is free again once its motion is done`);
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
    w.char.skills.aegissmite = 10;
    const random = Math.random;
    Math.random = () => 0.5;
    try {
      if (link) w.finisherAt = { at: w.now, key: 'basic3' };
      assert.ok(cast(w, 'aegissmite').ok);
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
  w.char.skills.aegissmite = 10;
  assert.ok(cast(w, 'aegissmite').ok);
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
function archer(job, weapon = job === 'sniper' ? 'crossbow_20' : 'bow_20') {
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
const shots = (w) => w.fx.filter((f) => f.kind === 'projectile' && f.t < 0.02).length;

test("both archer paths wait on Kestrel's trial, and each keeps to its own weapon", async () => {
  const { acceptQuest, questState } = await import('../src/core/quests.js');
  const { JOBS } = await import('../src/data/jobs.js');
  const { roleOf } = await import('../src/data/dungeons.js');
  const c = createCharacter('A', {});
  gainExp(c, 1e6);
  advanceJob(c, 'archer');
  assert.equal(advanceJob(c, 'ranger'), false, 'no path before the trial');
  assert.equal(questState(c, 'archer_trial'), 'available');
  assert.ok(acceptQuest(c, 'archer_trial'));
  c.quests.archer_trial.state = 'done';
  assert.ok(advanceJob(c, 'sniper'));
  assert.deepEqual(JOBS.ranger.weapons, ['bow']);
  assert.deepEqual(JOBS.sniper.weapons, ['crossbow']);
  assert.equal(roleOf('ranger', 'archer'), 'dps');
  assert.equal(roleOf('sniper', 'archer'), 'dps');
});

test("each archer path has its own basic combo, and its shots land when they arrive", async () => {
  const { PATH_COMBOS } = await import('../src/world/melee.js');
  for (const job of ['ranger', 'sniper']) {
    const w = archer(job);
    const seen = [];
    const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
    for (let i = 0; i < 160; i++) {
      updateWorld(w, DT, hold);
      if (w.pose && seen.at(-1) !== w.pose.kind) seen.push(w.pose.kind);
    }
    assert.deepEqual(seen.slice(0, 3), PATH_COMBOS[job].map((s) => s.move), `${job} combo`);
    const v = archer(job);
    const m = v.mobs[0];
    updateWorld(v, DT, press('KeyZ'));
    run(v, 0.15);
    assert.equal(m.hp, 1e9, `${job}: nothing on the press`);
    run(v, 0.6);
    assert.ok(m.hp < 1e9, `${job}: the shot arrives and hits`);
  }
});

test("a Ranger's Gale builds as arrows land, quickens her shots, and full looses twin arrows", async () => {
  const { GALE_MAX } = await import('../src/world/melee.js');
  const w = archer('ranger');
  updateWorld(w, DT, press('KeyZ'));
  const slow = w.pose.dur;
  run(w, 1);
  assert.ok(w.gale > 0, 'arrows that land build Gale');
  run(w, 8);
  assert.equal(w.gale, 0, 'it blows out once the fighting stops');
  w.gale = GALE_MAX;
  w.galeAt = w.now;
  w.combo = -1;
  w.comboUntil = -9;
  updateWorld(w, DT, press('KeyZ'));
  assert.ok(w.pose.dur < slow * 0.85, `faster at full Gale: ${slow} -> ${w.pose.dur}`);
  let most = 0;
  let spirits = 0;
  for (let i = 0; i < 40; i++) {
    updateWorld(w, DT, idle);
    most = Math.max(most, shots(w));
    spirits = Math.max(spirits, w.fx.filter((f) => f.kind === 'projectile' && f.shot === 'wisp').length);
  }
  assert.ok(most >= 2, 'a twin arrow goes with the shot');
  assert.ok(spirits >= 2, `two wind spirits swoop out with it (${spirits})`);
});

test("a Sniper's Focus builds standing still, bleeds away running, and full makes every bolt a Deadeye", async () => {
  const { FOCUS_MAX } = await import('../src/world/melee.js');
  const w = archer('sniper');
  updateWorld(w, DT, press('KeyZ'));
  run(w, 1);
  const after = w.focus;
  assert.ok(after > 0, 'bolts that land build Focus');
  run(w, 1);
  assert.ok(w.focus > after, 'standing still with a fight on builds it more');
  const held = w.focus;
  run(w, 0.8, { held: new Set(['ArrowLeft']), pressed: new Set(), locked: false });
  assert.ok(w.focus < held, 'running bleeds it away');
  // Full: every bolt always crits and tears through the line (Heartseeker is what spends it).
  Object.assign(w.body, { x: 300, facing: 1 });
  run(w, 0.3);
  w.focus = FOCUS_MAX;
  w.focusAt = w.now;
  w.combo = -1;
  w.comboUntil = -9;
  updateWorld(w, DT, press('KeyZ'));
  const crits = [];
  for (let i = 0; i < 60; i++) {
    for (const h of w.pending) if (!crits.includes(h)) crits.push(h);
    updateWorld(w, DT, idle);
  }
  assert.ok(w.numbers.some((n) => n.text === 'DEADEYE!'), 'says DEADEYE!');
  const dead = crits.filter((h) => !h.party);
  assert.ok(dead.length >= 3, `it tears through the line (${dead.length})`);
  assert.ok(dead.every((h) => h.crit && !h.miss), 'every hit a critical');
});

test('the archer paths have command shots: up at flyers, from the air, and on the run', () => {
  for (const [job, run0] of [['ranger', 'slideshot'], ['sniper', 'rollshot']]) {
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

test('the no-spam rule holds for the Ranger and the Sniper too', () => {
  for (const [job, skill] of [['ranger', 'galevolley'], ['ranger', 'cyclonearrow'], ['sniper', 'marksman'], ['sniper', 'glacierbolt']]) {
    const w = archer(job);
    w.char.skills[skill] = 10;
    assert.ok(cast(w, skill).ok, `${skill} goes off`);
    run(w, 0.15);
    for (let i = 0; i < 3; i++) updateWorld(w, DT, { held: new Set(['ArrowLeft']), pressed: new Set(), locked: false });
    assert.equal(cast(w, skill).reason, 'busy', `${skill} can't be recast mid-motion, even after moving`);
    run(w, 1.2);
    assert.ok(cast(w, skill).ok, `${skill} is free again once its motion is done`);
  }
});

test('Cyclone Arrow keeps cutting what it passes, and Glacier Bolt freezes the ones around its mark', () => {
  const w = archer('ranger');
  w.char.skills.cyclonearrow = 10;
  assert.ok(cast(w, 'cyclonearrow').ok);
  const hits = new Set();
  for (let i = 0; i < 120; i++) {
    for (const h of w.pending) hits.add(h);
    updateWorld(w, DT, idle);
  }
  assert.ok([...hits].filter((h) => h.mob === w.mobs[0]).length >= 4, 'the first boar is cut four times');
  const v = archer('sniper');
  v.char.skills.glacierbolt = 10;
  assert.ok(cast(v, 'glacierbolt').ok);
  run(v, 1);
  assert.ok(v.mobs.filter((m) => m.frozenUntil > v.now).length >= 2, 'the burst freezes its neighbours too');
});

test("Tailwind and Steady Aim fill half the gauge at once", () => {
  for (const [job, skill, gauge] of [['ranger', 'tailwind', 'gale'], ['sniper', 'steadyaim', 'focus']]) {
    const w = archer(job);
    w.char.skills[skill] = 10;
    assert.ok(cast(w, skill).ok);
    assert.equal(w[gauge], 50, `${skill} fills ${gauge}`);
    assert.ok(w.char.buffs[skill], `${skill} is on`);
  }
});

test("each archer path's finisher needs its gauge full, spends it, and lands its big blow", () => {
  for (const [job, skill, gauge] of [['ranger', 'stormvolley', 'gale'], ['sniper', 'heartseeker', 'focus']]) {
    const w = archer(job);
    w.char.skills[skill] = 10;
    w[gauge] = 60;
    w[`${gauge}At`] = w.now;
    assert.equal(cast(w, skill).reason, `gauge:${gauge}`, `${skill} waits for full ${gauge}`);
    w[gauge] = 100;
    w[`${gauge}At`] = w.now;
    assert.ok(cast(w, skill).ok, `${skill} goes off at full ${gauge}`);
    assert.equal(w[gauge], 0, `spending the ${gauge}`);
    if (skill === 'heartseeker') assert.ok(w.fx.some((f) => f.kind === 'reticle'), 'the sights lock on first');
    const m = w.mobs[0];
    const seen = new Set();
    for (let i = 0; i < 2 * 60; i++) {
      for (const h of w.pending) seen.add(h);
      updateWorld(w, DT, idle);
    }
    assert.ok(m.hp < 1e9, 'it hits');
    if (skill === 'heartseeker') assert.ok([...seen].filter((h) => h.via === 'heartbolt').every((h) => h.crit), 'the bolt always crits');
    settle(w);
    w[gauge] = 100;
    w[`${gauge}At`] = w.now;
    assert.ok(cast(w, skill).ok);
    run(w, 0.3);
    w[gauge] = 100;
    assert.equal(cast(w, skill).reason, 'busy', `${skill} can't be recast mid-motion`);
  }
});

test('arrows and bolts fly at the monster they hit, and follow it as it moves', () => {
  // From the air, a Sniper's piercing bolt angles down at the monster below instead of flying
  // straight on over its head.
  const w = archer('sniper');
  w.body.vy = -500;
  w.body.onGround = false;
  run(w, 0.15);
  updateWorld(w, DT, press('KeyZ'));
  let shot = null;
  for (let i = 0; i < 60 && !shot; i++) {
    updateWorld(w, DT, idle);
    shot = w.fx.find((f) => f.kind === 'projectile' && f.shot === 'heavybolt');
  }
  assert.ok(shot, 'a bolt flies');
  assert.ok(shot.ty > shot.y + 5, `it angles down at the monster (${shot.y} -> ${shot.ty})`);
  // A shot heads for where its monster is now.
  const v = archer('ranger');
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

test("every Sniper bolt pierces: the basic combo's three shots each pass through the line", () => {
  const w = archer('sniper');
  const struck = [];
  for (let step = 0; step < 3; step++) {
    const seen = new Set();
    updateWorld(w, DT, press('KeyZ'));
    for (let i = 0; i < 70; i++) {
      for (const h of w.pending) seen.add(h.mob);
      updateWorld(w, DT, idle);
    }
    struck.push(seen.size);
  }
  for (const [i, n] of struck.entries()) assert.ok(n >= 2, `shot ${i + 1} passes through ${n} monsters`);
  // Glacier Bolt pierces too, and still freezes those around the ones it passes.
  const v = archer('sniper');
  v.char.skills.glacierbolt = 10;
  const seen = new Set();
  assert.ok(cast(v, 'glacierbolt').ok);
  for (let i = 0; i < 70; i++) {
    for (const h of v.pending) seen.add(h.mob);
    updateWorld(v, DT, idle);
  }
  assert.ok(seen.size >= 3, `Glacier Bolt reaches ${seen.size}`);
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

test('Falcon Dive needs full Momentum, spends it, and its falcon dives through the whole line', () => {
  const w = range();
  w.char.skills.falcondive = 10;
  w.char.mp = 9999;
  w.momentum = 70;
  assert.equal(cast(w, 'falcondive').reason, 'gauge:momentum', 'waits for full Momentum');
  w.momentum = 100;
  assert.ok(cast(w, 'falcondive').ok);
  assert.equal(w.momentum, 0, 'spends all of it');
  run(w, 0.8);
  assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 0, 'nothing lands before the falcon is loosed');
  run(w, 1.4);
  assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 3, 'the falcon tore through all of them');
  assert.ok((w.momentum ?? 0) < 100, 'it does not refill Momentum');
  // The no-spam rule holds.
  w.momentum = 100;
  assert.ok(cast(w, 'falcondive').ok);
  run(w, 0.3);
  w.momentum = 100;
  assert.equal(cast(w, 'falcondive').reason, 'busy');
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
      for (const n of w.numbers) if (n.link) said.add(n.text);
    }
  } finally {
    Math.random = random;
  }
  assert.ok(said.has('BLADE RUSH!'), 'a swing at nothing still rushes on');
  assert.ok(said.has('WHIRLWIND!'), 'and the combo still spins into a Whirlwind');
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
  const families = { warrior: ['warrior'], paladin: ['warrior', 'paladin'], berserker: ['warrior', 'berserker'], archer: ['archer'], ranger: ['archer', 'ranger'], sniper: ['archer', 'sniper'], thief: ['thief'], assassin: ['thief', 'assassin'], nightlord: ['thief', 'nightlord'], mage: ['mage'] };
  const weapons = { warrior: 'sword_20', paladin: 'sword_20', berserker: 'axe_20', archer: 'bow_20', ranger: 'bow_20', sniper: 'crossbow_20', thief: 'dagger_20', assassin: 'dagger_20', nightlord: 'gauntlet_20', mage: 'wand_20' };
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
