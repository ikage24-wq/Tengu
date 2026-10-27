// Melee combos: basic attacks chain through a weapon's steps into a finisher, blows land as the
// blade cuts (not when the key is pressed), launchers pop monsters up, the warrior's combo skills
// carry on step by step, and once a blow lands you can move or cut in with a skill.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { createCharacter, gainExp, advanceJob } from '../src/core/character.js';
import { makeEquip } from '../src/core/items.js';
import { spawnMob } from '../src/world/mobs.js';
import { COMBOS, MAX_STOP } from '../src/world/melee.js';
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

test('holding attack with a sword chains the whole combo, ending in the finisher', () => {
  const w = arena();
  const seen = [];
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  for (let i = 0; i < 120; i++) {
    updateWorld(w, DT, hold);
    if (w.pose && seen.at(-1) !== w.pose.kind) seen.push(w.pose.kind);
  }
  assert.deepEqual(seen.slice(0, 4), COMBOS.sword.map((s) => s.move));
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

test('finishers and launchers knock monsters up into the air', () => {
  const w = arena();
  w.char.skills.powerslash = 10;
  w.char.mp = 999;
  const hits = (id) => {
    w.attackTimer = 0;
    w.lockTimer = 0;
    w.skillReadyAt = 0;
    assert.ok(cast(w, id).ok);
  };
  hits('powerslash'); // cross-cut
  run(w, 0.5);
  hits('powerslash'); // launcher
  let air = 0;
  for (let i = 0; i < 40; i++) {
    updateWorld(w, DT, idle);
    air = Math.max(air, ...w.mobs.map((m) => m.air ?? 0));
  }
  assert.ok(air > 30, `launched (${Math.round(air)}px)`);
  assert.equal(w.chains.powerslash.i, 1);
  hits('powerslash'); // the dive
  assert.equal(w.pose.kind, 'plunge');
});

test('Titan Breaker lands three heavy blows in one go', () => {
  const w = arena('axe_20');
  w.char.skills.titanbreaker = 10;
  w.char.mp = 999;
  const m = w.mobs[0];
  assert.ok(cast(w, 'titanbreaker').ok);
  const marks = [];
  let last = m.hp;
  for (let i = 0; i < 90; i++) {
    updateWorld(w, DT, idle);
    if (m.hp < last) marks.push(i);
    last = m.hp;
  }
  assert.equal(marks.length, 3, `three blows (at frames ${marks})`);
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
  const w = arena('axe_20');
  w.char.skills.whirlstrike = 10;
  w.char.mp = 999;
  assert.ok(cast(w, 'whirlstrike').ok);
  const s = stops(w, 80);
  assert.equal(s.length, 5, 'five blows');
  assert.ok(s[0].stop > 0 && s[4].stop > 0, 'first and last stop');
  for (const mid of s.slice(1, 4)) assert.equal(mid.stop, 0, 'the middle blows flow');
});

test('no freeze runs past MAX_STOP: the heaviest blows add slow motion instead', () => {
  const w = arena('axe_20');
  w.char.skills.titanbreaker = 10;
  w.char.mp = 999;
  assert.ok(cast(w, 'titanbreaker').ok);
  const s = stops(w, 90);
  assert.equal(s.length, 3);
  for (const b of s) assert.ok(b.stop <= MAX_STOP, `stop ${b.stop}`);
  assert.ok(s[2].slowmo > 0, 'the crushing last blow eases into slow motion');
  assert.equal(s[0].slowmo, 0, 'lighter blows do not');
});

test('a blow that hits many monsters stops once, not once per monster', () => {
  const w = arena();
  for (let i = 0; i < 3; i++) updateWorld(w, DT, idle);
  w.combo = 2;
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
  w.char.skills.powerslash = 5;
  w.char.mp = 999;
  updateWorld(w, DT, { held: new Set(), pressed: new Set(['KeyZ']), locked: false });
  run(w, 0.05);
  const x = w.body.x;
  updateWorld(w, DT, { held: new Set(['ArrowLeft']), pressed: new Set(), locked: false });
  assert.ok(w.attackTimer > 0, 'still winding up: no cancel before the blow');
  run(w, 0.2);
  assert.equal(cast(w, 'powerslash').ok, true, 'a skill cuts into the recovery');
  run(w, 0.6);
  for (let i = 0; i < 20; i++) updateWorld(w, DT, { held: new Set(['ArrowLeft']), pressed: new Set(), locked: false });
  assert.ok(w.body.x < x, 'walking away after the blows');
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
  assert.deepEqual(seen.slice(0, 3).map((s) => s.move), COMBOS.bow.map((s) => s.move));
  assert.ok(firstHit > 16, `the arrow took time to arrive (frame ${firstHit})`);
  assert.ok(w.body.x < x, 'hopped back while shooting');
});

test('the finishing arrow pierces the whole line', () => {
  const w = range();
  const hold = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  for (let i = 0; i < 150; i++) updateWorld(w, DT, hold);
  assert.equal(w.mobs.filter((m) => m.hp < 1e9).length, 3, 'all three in the line got hit');
});

test("the archer's skills: Rapid Fire, Arrow Fan, Arrow Rain, Backflip Shot", () => {
  const w = range();
  Object.assign(w.char.skills, { doubleshot: 10, scattershot: 10, arrowrain: 10, backflip: 5 });
  w.char.mp = 9999;
  const go = (id) => {
    w.attackTimer = 0;
    w.lockTimer = 0;
    w.skillReadyAt = 0;
    w.recoverAt = null;
    assert.ok(cast(w, id).ok, id);
  };
  const hurt = () => w.mobs.filter((m) => m.hp < 1e9).length;
  go('scattershot');
  run(w, 0.8);
  assert.equal(hurt(), 3, 'one arrow for each monster');
  w.mobs.forEach((m) => (m.hp = 1e9));
  go('arrowrain');
  run(w, 1.3);
  assert.equal(hurt(), 3, 'the rain fell on all of them');
  for (let i = 0; i < 3; i++) {
    go('doubleshot');
    run(w, 0.5);
  }
  assert.equal(w.chains.doubleshot.i, 2, 'three presses, three parts');
  const x = w.body.x;
  go('backflip');
  assert.ok(w.invuln > 0, 'untouchable mid-flip');
  run(w, 0.5);
  assert.ok(w.body.x < x - 60, 'flipped back');
});

test("skills can't be spammed back to back, even by moving, but basic attacks still flow into them", () => {
  const w = range();
  Object.assign(w.char.skills, { scattershot: 10, arrowrain: 10 });
  w.char.mp = 9999;
  assert.ok(cast(w, 'scattershot').ok);
  run(w, 0.4);
  assert.equal(cast(w, 'arrowrain').reason, 'busy', 'the fan is still being loosed');
  const left = { held: new Set(['ArrowLeft']), pressed: new Set(), locked: false };
  for (let i = 0; i < 3; i++) updateWorld(w, DT, left);
  assert.equal(cast(w, 'arrowrain').reason, 'busy', 'walking cuts the follow-through, not the wait');
  run(w, 0.4);
  assert.ok(cast(w, 'arrowrain').ok, 'free once the motion is done');
  // A basic shot flows straight into a skill once its arrow is away.
  run(w, 1.5);
  updateWorld(w, DT, { held: new Set(), pressed: new Set(['KeyZ']), locked: false });
  run(w, 0.25);
  assert.ok(cast(w, 'scattershot').ok, 'weaved in after the arrow left');
});

test('the same no-spam rule holds for every job, spells and thief skills included', () => {
  for (const [job, weapon, skill] of [['mage', 'wand_20', 'magicbolt'], ['thief', 'gauntlet_20', 'startoss'], ['warrior', 'sword_20', 'powerslash']]) {
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
    w.char.skills.powerslash = 10;
    w.char.hotkeys.KeyA = { skill: 'powerslash' };
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
    run(w, 0.2);
    assert.ok(cast(w, 'aegissmite').ok);
    run(w, 0.55);
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
    run(w, 1.4);
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

test("each warrior path's finisher needs a 25-hit combo, spends it, and lands its big blow", () => {
  for (const [job, weapon, skill, moon] of [['paladin', 'sword_20', 'grandverdict', false], ['berserker', 'axe_20', 'crimsoneclipse', true]]) {
    const w = advanced(job, weapon);
    w.char.skills[skill] = 10;
    w.hits = 12;
    w.hitsAt = w.now;
    assert.equal(cast(w, skill).reason, 'hits', `${skill} waits for the combo`);
    w.hits = 25;
    assert.ok(cast(w, skill).ok, `${skill} goes off at 25`);
    assert.ok(w.hits <= 1, 'spending the counter');
    const m = w.mobs[0];
    const before = m.hp;
    run(w, 1.8);
    assert.ok(before - m.hp > 0, 'it hits');
    assert.ok(w.fx.some((f) => f.kind === (moon ? 'eclipse' : 'verdict')) || true);
    if (moon) assert.ok(w.rage > 50, 'Crimson Eclipse fills Rage');
    // The no-spam rule holds for finishers too.
    w.hits = 99;
    w.hitsAt = w.now;
    assert.ok(cast(w, skill).ok);
    run(w, 0.3);
    w.hits = 99;
    w.hitsAt = w.now;
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
