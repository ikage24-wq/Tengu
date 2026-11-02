// Job balance: plays every job in the real game (world/world.js, the same code the game runs)
// against practice dummies and measures what matters for its role:
//   single  damage per second on one dummy           pack  damage per second on five
//   mp      MP spent per second (and how long a full bar lasts)
//   survive seconds of standing in a pack of real monsters that hit back (no potions)
//   heal    HP restored per second by its heals (healers)
//
// Each job plays like a sensible player: buffs kept up, a full gauge spent on its finisher,
// summons out, and its best attack skill pressed whenever it may, with basic attacks woven in.
// Usage: node tools/balance.mjs [level] [jobs...]   (prints a table; --json for raw numbers)

import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { createCharacter, gainExp, advanceJob, autoAssignAp } from '../src/core/character.js';
import { expToNext } from '../src/core/exp.js';
import { makeEquip } from '../src/core/items.js';
import { addItem } from '../src/core/inventory.js';
import { spawnMob } from '../src/world/mobs.js';
import { cast, castBlocker } from '../src/world/combat.js';
import { barrageOf } from '../src/world/melee.js';
import { computeStats } from '../src/core/stats.js';
import { JOBS } from '../src/data/jobs.js';
import { SKILLS, skillAt } from '../src/data/skills.js';
import { MOBS } from '../src/data/mobs.js';
import { roleOf } from '../src/data/dungeons.js';
import { GEAR_LEVELS } from '../src/data/items.js';

export const WEAPON = { warrior: 'sword', paladin: 'sword', berserker: 'axe', archer: 'bow', beastmaster: 'bow', stormcaller: 'crossbow', thief: 'dagger', shinobi: 'dagger', kitsune: 'gauntlet', spiritmage: 'wand', shrinemaiden: 'wand', onmyoji: 'wand' };
export const BALANCE_JOBS = Object.keys(WEAPON);
const DT = 1 / 60;
// How hard the monsters in the survival test hit (their attack times this, plus 3 a level).
export const FIGHT = { k: 25 };

// A character of `job` at `level`: its job line, Auto stats, every skill of its line maxed, its
// own job's gear and weapon at the level.
export function balanceChar(job, level) {
  const chain = [];
  for (let j = JOBS[job]; j; j = JOBS[j.parent]) chain.unshift(j.id);
  const c = createCharacter('Tester', {});
  const up = () => gainExp(c, expToNext(c.level) - c.exp);
  for (const id of chain.slice(1)) {
    while (c.level < JOBS[id].level) up();
    if (JOBS[id].trial) c.quests[JOBS[id].trial] = { state: 'done', kills: {} };
    advanceJob(c, id);
  }
  while (c.level < level) up();
  autoAssignAp(c);
  for (const [id, s] of Object.entries(SKILLS)) if (chain.includes(s.job)) c.skills[id] = s.maxLevel;
  const gl = Math.max(...GEAR_LEVELS.filter((l) => l <= level));
  const family = JOBS[job].family;
  c.equipment.weapon = makeEquip(`${WEAPON[job]}_${gl}`, { variance: 0 });
  for (const slot of ['hat', 'top', 'bottom', 'shoes', 'gloves', 'cape']) c.equipment[slot] = makeEquip(`${family}_${slot}_${gl}`, { variance: 0 });
  const s = computeStats(c);
  c.hp = s.maxHp;
  c.mp = s.maxMp;
  return c;
}

// A monster of about this level, to borrow its defense and avoid from.
function mobNear(level) {
  return Object.values(MOBS).filter((m) => !m.boss && !m.fly).sort((a, b) => Math.abs(a.level - level) - Math.abs(b.level - level))[0];
}

const kind = (id) => {
  const s = SKILLS[id];
  // (A Novice's pebble is left behind once a job is chosen.)
  if (!s || s.job === 'novice' || s.type === 'passive' || s.type === 'revive' || s.type === 'blink') return null;
  if (s.type === 'buff') return 'buff';
  if (s.fullGauge) return 'finisher';
  if (s.type === 'heal') return 'heal';
  if (s.movement) return null;
  return 'attack';
};

// One run: the job plays for `secs` against `n` targets (dummies, or real monsters that fight back
// when `fight`). `main` is the attack skill it leans on (null: basics only).
export function run(job, level, { secs = 30, ...opts } = {}) {
  const r = makeRun(job, level, opts);
  while (r.t < secs && !r.died) r.tick();
  return r.result(secs);
}

// A run to step a tick (1/60 s) at a time, for a stage to draw (tools/dps-stage.html) or `run` to
// finish. Its own seeded randomness is used only while it steps, so every run plays the same.
export function makeRun(job, level, { n = 1, main = null, fight = false, mpFree = true, seed = 1, skip = [] } = {}) {
  let r = seed;
  const rng = () => ((r = (r * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const seeded = (fn) => {
    const realRandom = Math.random;
    Math.random = rng;
    try {
      return fn();
    } finally {
      Math.random = realRandom;
    }
  };
  const S = seeded(() => {
    const c = balanceChar(job, level);
    const w = createWorld(c);
    w.log = () => {};
    loadMap(w, 'woods', 'west');
    w.spawner.slots = [];
    w.mobs = [];
    // Dummies never touch you (a bump would knock you out of your combo); in the survival test
    // the monsters do.
    w.god = !fight;
    const x0 = 360;
    Object.assign(w.body, { x: x0, y: w.map.groundY, vx: 0, vy: 0, facing: 1, onGround: true });
    const base = mobNear(level);
    const dummies = [];
    for (let i = 0; i < n; i++) {
      const m = spawnMob(w.map, { mob: base.id, x: x0 + 70 + i * 34, y: w.map.groundY });
      // (Fighting back, they hit hard: a pack a little above your level.)
      m.def = fight ? { ...m.def, hp: 1e9, atk: Math.round(m.def.atk * FIGHT.k + level * 3) } : { ...m.def, hp: 1e9, aggro: false, speed: 0, atk: 0 };
      m.hp = 1e9;
      if (fight) m.aggroUntil = 1e9;
      w.mobs.push(m);
      dummies.push(m);
    }
    const skills = Object.keys(c.skills).filter((id) => kind(id));
    return {
      c, w, x0, dummies,
      buffs: skills.filter((id) => kind(id) === 'buff' && !skip.includes(id)),
      finishers: skills.filter((id) => kind(id) === 'finisher' && !skip.includes(id)),
      heals: skills.filter((id) => kind(id) === 'heal' && SKILLS[id].type === 'heal' && !skillAt(id, c.skills[id]).combo?.[0]?.strikes?.[0]?.revive),
    };
  });
  const { c, w, x0, dummies, buffs, finishers, heals } = S;
  let mpSpent = 0;
  let healed = 0;
  let lastHp = c.hp;
  const tried = {};
  const input = { held: new Set(['KeyZ']), pressed: new Set(), locked: false };
  const out = {
    w, c, dummies, t: 0, died: false, diedAt: null, last: null, casts: {},
    damage: () => dummies.reduce((a, m) => a + (1e9 - Math.max(0, m.hp)), 0),
    tick: () => seeded(() => {
      // Keep facing the targets, in reach (a step back or a dash can't carry them off). (The Endless
      // Blade Dance blinks her through them and back: she turns to face them herself.)
      const blinking = w.barrage?.kind === 'shinobi' && Math.abs(w.body.x - dummies[0].x) < 120;
      if (!blinking) {
        if (w.body.x > dummies[0].x - 20) w.body.x = dummies[0].x - 40;
        if (w.body.x < dummies[0].x - 170) w.body.x = dummies[0].x - 120;
        w.body.facing = 1;
      }
      if (!fight) {
        for (const m of dummies) {
          m.x = Math.max(m.x, x0 + 40);
          m.knockVx = 0;
        }
      } else {
        // In the survival test they stay on you (nothing knocks them out of reach), so everyone
        // takes hits at the same pace.
        dummies.forEach((m, i) => {
          m.x = w.body.x + 14 + i * 3;
          m.y = w.body.y;
          m.knockVx = 0;
          m.air = 0;
          m.frozenUntil = 0;
          m.stagger = 0;
        });
      }
      // Pick what to press: a missing buff, a ready finisher, the main skill.
      // (A buff that didn't take, say one that needs summons out first, waits a while.)
      const ready = (id) => !castBlocker(w, id) && !(tried[id] > w.now);
      // (Hurt in a fight, a healer heals first.)
      const mend = fight && c.hp < computeStats(c).maxHp * 0.5 ? heals.find(ready) : null;
      const want = mend ?? buffs.find((id) => !(c.buffs[id]?.until > w.now) && ready(id)) ?? finishers.find(ready) ?? (main && ready(main) ? main : null);
      if (want) {
        const ok = cast(w, want).ok;
        if (ok) {
          out.last = want;
          out.lastAt = w.now;
          out.casts[want] = (out.casts[want] ?? 0) + 1;
        }
        // (One that didn't take waits a moment; one that works on the troupe rather than the hero,
        // like Yokai Rally, is recast when it runs out.)
        if (buffs.includes(want) && (!ok || !(c.buffs[want]?.until > w.now))) tried[want] = w.now + (ok ? (w.rally?.until ?? w.now + 20) - w.now : 5);
      }
      // An endless barrage (Endless Fox-Fire, Endless Blade Dance, Wild Hunt) is played the way it's
      // meant to be: held until it's flat out (its last stage), let go for the finisher, and held again.
      const barrage = barrageOf(w);
      if (barrage) {
        out.held = (out.held ?? 0) + DT;
        if (out.held > barrage.ramp + 3.3) {
          out.held = -0.1;
          input.held.delete('KeyZ');
        } else if (out.held >= 0) input.held.add('KeyZ');
      }
      updateWorld(w, DT, input);
      input.pressed.clear();
      if (c.hp > lastHp) healed += c.hp - lastHp;
      lastHp = c.hp;
      if (mpFree) {
        mpSpent += Math.max(0, computeStats(c).maxMp - c.mp);
        c.mp = computeStats(c).maxMp;
      }
      out.t += DT;
      if (fight && (w.dead || c.hp <= 0)) {
        out.died = true;
        out.diedAt = out.t;
      }
    }),
    result: (secs) => {
      const st = computeStats(c);
      return { dps: out.damage() / secs, mpPerSec: mpSpent / secs, maxMp: st.maxMp, maxHp: st.maxHp, healPerSec: healed / secs, diedAt: out.diedAt, hpLeft: c.hp };
    },
  };
  return out;
}

// The attack skill a job does the most single-target damage with (tried one at a time), and
// with it, its numbers.
export function measure(job, level = 50, { secs = 30 } = {}) {
  const c = balanceChar(job, level);
  const attacks = Object.keys(c.skills).filter((id) => kind(id) === 'attack' || kind(id) === 'heal');
  const extras = Object.keys(c.skills).filter((id) => kind(id) === 'buff' || kind(id) === 'finisher');
  // Ways to play: each attack skill (or basics alone) as the main one, with or without each buff
  // and finisher; the best wins (a sensible player finds it).
  const skips = [[], ...extras.map((e) => [e]), extras];
  // (Screened in short fights, the three best tried again over the whole fight.)
  const best = (n) => {
    const tried = [];
    for (const main of [null, ...attacks]) {
      for (const skip of skips) tried.push({ dps: run(job, level, { n, secs: 12, main, skip }).dps, main, skip });
    }
    tried.sort((a, b) => b.dps - a.dps);
    let top = { dps: -1 };
    for (const t of tried.slice(0, 3)) {
      const dps = run(job, level, { n, secs, main: t.main, skip: t.skip }).dps;
      if (dps > top.dps) top = { ...t, dps };
    }
    return top;
  };
  const b1 = best(1);
  const b5 = best(5);
  const single = run(job, level, { n: 1, secs, main: b1.main, skip: b1.skip });
  const pack = run(job, level, { n: 5, secs, main: b5.main, skip: b5.skip });
  const bestPack = { id: b5.main };
  const best1 = { id: b1.main };
  // (Surviving, every buff and heal is used: a ward matters more than a little damage.)
  const fight = run(job, level, { n: 4, secs: 300, main: bestPack.id, fight: true, mpFree: false });
  const heals = Object.keys(c.skills).filter((id) => kind(id) === 'heal');
  let heal = 0;
  for (const id of heals) {
    // (Healing measured on a hurt hero: kept low so every heal lands in full.)
    const h = healRun(job, level, id);
    heal = Math.max(heal, h);
  }
  return {
    job, role: roleOf(job, JOBS[job].family), level,
    single: Math.round(single.dps), singleSkill: best1.id, pack: Math.round(pack.dps), packSkill: bestPack.id, skipped: [...new Set([...b1.skip, ...b5.skip])], singleSkip: b1.skip, packSkip: b5.skip,
    mpPerSec: Math.round(single.mpPerSec * 10) / 10, mpLasts: single.mpPerSec > 0 ? Math.round(single.maxMp / single.mpPerSec) : Infinity,
    maxHp: single.maxHp, survive: fight.diedAt == null ? 300 : Math.round(fight.diedAt), heal: Math.round(heal),
  };
}

function healRun(job, level, id) {
  const c = balanceChar(job, level);
  const w = createWorld(c);
  w.log = () => {};
  loadMap(w, 'woods', 'west');
  w.spawner.slots = [];
  w.mobs = [];
  const input = { held: new Set(), pressed: new Set(), locked: false };
  let healed = 0;
  const secs = 20;
  for (let t = 0; t < secs; t += DT) {
    c.hp = 1;
    c.mp = computeStats(c).maxMp;
    if (!castBlocker(w, id)) cast(w, id);
    const before = c.hp;
    updateWorld(w, DT, input);
    healed += Math.max(0, c.hp - before);
    c.hp = 1;
  }
  return healed / secs;
}

// ---------- Command line ----------
if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const level = Number(args.find((a) => /^\d+$/.test(a)) ?? 50);
  const jobs = args.filter((a) => WEAPON[a]);
  // By default, each tier at its own stage: first jobs below 30, their paths from 30 on.
  const tier = (j) => JOBS[j].tier;
  const pool = jobs.length ? jobs : BALANCE_JOBS.filter((j) => (level < 30 ? tier(j) === 1 : tier(j) === 2));
  const rows = pool.map((j) => measure(j, level));
  if (json) console.log(JSON.stringify(rows, null, 1));
  else {
    const dps = rows.filter((r) => r.role === 'dps');
    const avg = (k) => dps.reduce((a, r) => a + r[k], 0) / Math.max(1, dps.length);
    const a1 = avg('single');
    const a5 = avg('pack');
    console.log(`Level ${level}   (single and pack as % of the damage jobs' average: ${Math.round(a1)} / ${Math.round(a5)})`);
    console.log('job           role    single (%)        pack (%)          mp/s  lasts  maxHp  survive  heal/s   skills');
    for (const r of rows) {
      const pc = (v, a) => `${v}`.padStart(7) + ` (${Math.round((v / a) * 100)}%)`.padEnd(8);
      console.log(`${r.job.padEnd(13)} ${String(r.role).padEnd(7)} ${pc(r.single, a1)} ${pc(r.pack, a5)}  ${String(r.mpPerSec).padStart(5)} ${String(r.mpLasts).padStart(5)}s ${String(r.maxHp).padStart(6)} ${String(r.survive).padStart(6)}s ${String(r.heal).padStart(6)}   ${r.singleSkill ?? 'basic'} / ${r.packSkill ?? 'basic'}${r.skipped.length ? `  (skips ${r.skipped.join(', ')})` : ''}`);
    }
  }
}
