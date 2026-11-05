// Hunting pace: a hero of a job and level hunts a real hunting map for a stretch of game time,
// steered by the same pathfinding the dungeon autopilot uses (world/nav.js): it walks, climbs and
// jumps to the nearest monster, fights it with its basic combo, its buffs, its finisher and its
// attack skills, drinks a potion when low, and moves on. Counts kills and EXP, so the EXP curve can
// be set from how fast levelling really goes (docs/design/main-story.md, "Pacing").
//
// Usage: node tools/hunt-rate.mjs [secs] [--json]       every band, each on its best-fitting map
//        node tools/hunt-rate.mjs 300 30 berserker cave    one level, job and map

import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { expToNext } from '../src/core/exp.js';
import { computeStats } from '../src/core/stats.js';
import { cast, castBlocker } from '../src/world/combat.js';
import { navOf, surfaceOf, surfaceBelow, findPath, followPath } from '../src/world/nav.js';
import { MAPS } from '../src/data/maps.js';
import { MOBS } from '../src/data/mobs.js';
import { SKILLS } from '../src/data/skills.js';
import { balanceChar } from './balance.mjs';

const DT = 1 / 60;

const kind = (id) => {
  const s = SKILLS[id];
  if (!s || s.job === 'novice' || s.type === 'passive' || s.type === 'revive' || s.type === 'blink' || s.movement) return null;
  if (s.type === 'buff') return 'buff';
  if (s.fullGauge) return 'finisher';
  if (s.type === 'heal') return null;
  return 'attack';
};

// The hunting maps and the levels of their monsters.
export function huntingMaps() {
  const out = [];
  for (const [id, m] of Object.entries(MAPS)) {
    if (m.dungeon || m.isTown || !m.spawns?.length) continue;
    const lv = m.spawns.map((s) => MOBS[s.mob]).filter((d) => d && !d.boss).map((d) => d.level);
    if (lv.length < 6) continue;
    out.push({ id, name: m.name, lo: Math.min(...lv), hi: Math.max(...lv), mid: lv.reduce((a, b) => a + b, 0) / lv.length });
  }
  return out;
}

const total = (level, exp) => {
  let t = exp;
  for (let l = 1; l < level; l++) t += expToNext(l);
  return t;
};

export function hunt(job, level, mapId, { secs = 300, seed = 7 } = {}) {
  let r = seed;
  const real = Math.random;
  Math.random = () => ((r = (r * 1664525 + 1013904223) % 4294967296) / 4294967296);
  try {
    const c = balanceChar(job, level);
    const w = createWorld(c);
    w.log = () => {};
    loadMap(w, mapId, 'start' in Object.fromEntries((MAPS[mapId].portals ?? []).map((p) => [p.id, 1])) ? 'start' : MAPS[mapId].portals[0].id);
    const nav = navOf(w.map);
    const skills = Object.keys(c.skills).filter((id) => kind(id));
    const buffs = skills.filter((id) => kind(id) === 'buff');
    const finishers = skills.filter((id) => kind(id) === 'finisher');
    const attacks = skills.filter((id) => kind(id) === 'attack');
    const tried = {};
    const start = total(c.level, c.exp);
    let kills = 0;
    let potions = 0;
    let t = 0;
    let target = null;
    let path = null;
    let stuck = 0;
    let lastX = w.body.x;
    let ai = 0;
    const alive = new Set();
    while (t < secs) {
      const b = w.body;
      const held = new Set();
      const pressed = new Set();
      const live = w.mobs.filter((m) => m.hp > 0 && !m.def.boss);
      // A new target when the old one is gone (or we've been stuck on it a while).
      if (!target || target.hp <= 0 || stuck > 4) {
        // (A player goes for what they can reach: a flyer hovering high over its floor waits.)
        const hover = (m) => {
          if (!m.def.fly) return 0;
          const k = surfaceBelow(nav, m.x, m.y + 4);
          return k >= 0 ? Math.max(0, nav.surfaces[k].y - m.y) : 999;
        };
        const cost = (m) => Math.abs(m.x - b.x) + Math.abs(m.y - b.y) * 4 + (hover(m) > 70 ? 3000 : 0);
        target = live.sort((p, q) => cost(p) - cost(q))[stuck > 4 ? Math.min(1, live.length - 1) : 0] ?? null;
        path = null;
        stuck = 0;
      }
      if (target) {
        // (A flyer hovers over the floor it patrols: close enough when it's within a swing's height.)
        const same = Math.abs(target.y - b.y) < (target.def.fly ? 70 : 12) && !b.rope;
        const dx = target.x - b.x;
        if (same && Math.abs(dx) < 70) {
          b.facing = Math.sign(dx) || b.facing;
          held.add('KeyZ');
          const ready = (id) => !castBlocker(w, id) && !(tried[id] > w.now);
          const want = buffs.find((id) => !(c.buffs[id]?.until > w.now) && ready(id)) ?? finishers.find(ready) ?? attacks[ai % Math.max(1, attacks.length)];
          if (want && ready(want)) {
            const ok = cast(w, want).ok;
            if (!ok) tried[want] = w.now + 2;
            if (attacks.includes(want)) ai++;
            if (buffs.includes(want) && ok) tried[want] = w.now + 15;
          }
        } else {
          const here = surfaceOf(nav, b);
          if (here >= 0 && !path) path = findPath(nav, here, b.x, surfaceBelow(nav, target.x, target.y - 4), target.x);
          if (path) {
            const { intent, lost } = followPath(nav, b, path, target.x, 30);
            if (lost) path = null;
            if (intent.left) held.add('ArrowLeft');
            if (intent.right) held.add('ArrowRight');
            if (intent.up) held.add('ArrowUp');
            if (intent.down) held.add('ArrowDown');
            if (intent.jump) held.add('Space');
          } else {
            held.add(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
            if (b.rope) held.add(target.y > b.y ? 'ArrowDown' : 'ArrowUp');
          }
        }
      }
      for (const m of w.mobs) if (m.hp > 0) alive.add(m);
      updateWorld(w, DT, { held, pressed, locked: false });
      for (const m of [...alive]) if (m.hp <= 0) {
        alive.delete(m);
        if (!m.def.boss) kills++;
      }
      // A potion when low (a moment lost drinking it), MP topped up the same way.
      const st = computeStats(c);
      if (c.hp < st.maxHp * 0.4 || w.dead) {
        c.hp = st.maxHp;
        w.dead = false;
        potions++;
        t += 0.6;
      }
      if (c.mp < st.maxMp * 0.2) {
        c.mp = st.maxMp;
        potions++;
        t += 0.6;
      }
      if (process.env.TRACE && Math.round(t * 60) % 300 === 0) console.log(t.toFixed(0), 'me', Math.round(b.x), Math.round(b.y), b.rope ? 'rope' : '', 'target', target && target.def.id, target && Math.round(target.x), target && Math.round(target.y), 'path', path ? path.length : null, 'stuck', stuck.toFixed(1), 'kills', kills);
      stuck = Math.abs(b.x - lastX) < 0.5 && !held.has('KeyZ') ? stuck + DT : 0;
      lastX = b.x;
      t += DT;
    }
    const exp = total(c.level, c.exp) - start;
    return { job, level, map: mapId, secs, kills, killsPerMin: +(kills / (secs / 60)).toFixed(1), expPerHour: Math.round((exp / secs) * 3600), hoursPerLevel: +(expToNext(level) / ((exp / secs) * 3600)).toFixed(2), potions };
  } finally {
    Math.random = real;
  }
}

// The map a hero of this level would hunt on: the one whose monsters sit nearest its level.
export function mapFor(level) {
  return huntingMaps().filter((m) => level >= m.lo - 2 && level <= m.hi + 2).sort((a, b) => Math.abs(a.mid - level) - Math.abs(b.mid - level))[0]?.id;
}

if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const nums = args.filter((a) => /^\d+$/.test(a)).map(Number);
  const words = args.filter((a) => !/^\d+$/.test(a) && a !== '--json');
  const secs = nums[0] ?? 240;
  const rows = [];
  if (nums.length > 1) rows.push(hunt(words[0] ?? 'warrior', nums[1], words[1] ?? mapFor(nums[1]), { secs }));
  else {
    for (const level of [12, 17, 22, 27, 32, 37, 42, 47]) {
      const jobs = level < 30 ? ['warrior', 'archer'] : ['berserker', 'beastmaster'];
      for (const job of jobs) rows.push(hunt(job, level, mapFor(level), { secs }));
    }
  }
  if (json) console.log(JSON.stringify(rows, null, 1));
  else for (const r of rows) console.log(`Lv ${String(r.level).padStart(2)} ${r.job.padEnd(12)} ${r.map.padEnd(9)} ${String(r.killsPerMin).padStart(5)} kills/min  ${String(r.expPerHour).padStart(8)} EXP/h  ${String(r.hoursPerLevel).padStart(6)} h/level  potions ${r.potions}`);
}
