// The whole playthrough, timed: one hero from level 1 to the story's ending at 50, doing every
// story and side quest open to their path as soon as it unlocks (story first), hunting on the best
// map for their level whenever nothing is open. Built from real parts of the game:
//   - kill speed on every hunting map, measured by the hunting autopilot (tools/hunt-rate.mjs)
//     playing the real map with a hero of that map's level;
//   - every quest's real objectives, drop rates, monsters, rewards and scenes (data/quests.js,
//     data/mobs.js, data/maps.js, data/story.js), and the real EXP curve (core/exp.js).
// Between quests it hunts on whichever map that suits its level pays best. What it can't play itself (dungeon runs with a group, trial fights, fishing, walking between
// towns, reading scenes) is timed with fixed allowances, listed below.
//
// Two paces: `perfect` (the autopilot's measured kill speed and short allowances) and `player` (a
// normal player: half the autopilot's kill speed, longer allowances, and a tenth more time on the
// rest of the game: shops, the bag, the odd death).
//
// Usage: node tools/playthrough.mjs [--json]

import { QUESTS } from '../src/data/quests.js';
import { MOBS } from '../src/data/mobs.js';
import { MAPS } from '../src/data/maps.js';
import { SCENES, TRIALS } from '../src/data/story.js';
import { QUEST_SCENES } from '../src/data/scenes.js';
import { expToNext, MAX_LEVEL } from '../src/core/exp.js';
import { DUNGEONS } from '../src/data/dungeons.js';
import { hunt, huntingMaps } from './hunt-rate.mjs';

const FAMILY = 'warrior';
const JOB_AT = (level) => (level < 30 ? 'warrior' : 'berserker');

const PACES = {
  perfect: { kill: 1, travel: 1.5, talk: 0.75, visit: 1, fish: 5, dungeon: 10, trial: 3, job: 3, gather: 0.5, extra: 1 },
  player: { kill: 0.5, travel: 3, talk: 1.5, visit: 2, fish: 8, dungeon: 15, trial: 5, job: 5, gather: 1, extra: 1.1 },
};

// ---------- What the game is made of ----------

const maps = huntingMaps();
const mapOfMob = {};
for (const m of maps) for (const s of MAPS[m.id].spawns) if (MOBS[s.mob] && !MOBS[s.mob].boss) mapOfMob[s.mob] ??= m.id;
const share = (mapId, mob) => {
  const sp = MAPS[mapId].spawns.filter((s) => MOBS[s.mob] && !MOBS[s.mob].boss);
  return sp.filter((s) => s.mob === mob).length / sp.length;
};
const avgExp = (mapId) => {
  const sp = MAPS[mapId].spawns.filter((s) => MOBS[s.mob] && !MOBS[s.mob].boss);
  return sp.reduce((a, s) => a + MOBS[s.mob].exp, 0) / sp.length;
};
const dungeonBoss = new Set();
for (const d of Object.values(DUNGEONS)) for (const r of d.rooms ?? []) for (const s of MAPS[r]?.spawns ?? []) if (MOBS[s.mob]?.boss) dungeonBoss.add(s.mob);
for (const [id, m] of Object.entries(MAPS)) if (m.dungeon) for (const s of m.spawns ?? []) if (MOBS[s.mob]?.boss) dungeonBoss.add(s.mob);
const trialBoss = new Set(Object.values(TRIALS).map((t) => t.boss));
const dropper = (item) => {
  let best = null;
  for (const [id, m] of Object.entries(MOBS)) {
    if (m.boss || !mapOfMob[id]) continue;
    const d = (m.drops ?? []).find((x) => x.id === item);
    if (d && (!best || d.chance * share(mapOfMob[id], id) > best.chance * share(mapOfMob[best.mob], best.mob))) best = { mob: id, chance: d.chance };
  }
  return best;
};

// Kill speed on every hunting map, measured (kills a minute), with a hero of the map's level.
function measure(secs) {
  const out = {};
  for (const m of maps) {
    const level = Math.max(10, Math.min(49, Math.round(m.mid)));
    // (The middle of three runs from different starts, so one run where the autopilot gets stuck
    // chasing a flyer doesn't stand for the map.)
    const runs = [7, 11, 23].map((seed) => hunt(JOB_AT(level), level, m.id, { secs, seed }).killsPerMin).sort((p, q) => p - q);
    out[m.id] = runs[1];
  }
  return out;
}

const sceneLines = (qid) => {
  const q = QUESTS[qid];
  const ids = Object.values({ ...(q.scenes ?? {}), ...(QUEST_SCENES[qid] ?? {}) });
  return ids.reduce((a, id) => a + (SCENES[id]?.filter((st) => typeof st.text === 'string' || st.card).length ?? 0), 0);
};

// ---------- The playthrough ----------

export function playthrough(kpm, paceName) {
  const pace = PACES[paceName];
  const st = { level: 1, exp: 0, min: 0, done: new Set(), log: [], reached: {}, hunting: 0, questing: 0 };
  const gain = (exp) => {
    st.exp += exp;
    while (st.level < MAX_LEVEL && st.exp >= expToNext(st.level)) {
      st.exp -= expToNext(st.level);
      st.level += 1;
      st.reached[st.level] = st.min;
    }
    if (st.level >= MAX_LEVEL) st.exp = 0;
  };
  const rate = (mapId) => Math.max(0.5, kpm[mapId] * pace.kill);
  const open = (q) => !q.daily && !st.done.has(q.id) && q.minLevel <= st.level && (!q.prereq || st.done.has(q.prereq)) && (!q.family || q.family === FAMILY)
    && QUESTS[q.id].giver;
  const order = (a, b) => (b.story ? 1 : 0) - (a.story ? 1 : 0) || a.minLevel - b.minLevel;
  let guard = 0;
  while (!st.done.has('story_wind') && guard++ < 100000) {
    const q = Object.values(QUESTS).filter(open).sort(order)[0];
    if (!q) {
      // Nothing open: a minute's hunting on the best map for this level.
      // (Like a player, it hunts wherever pays best among the maps that suit its level.)
      const fits = maps.filter((m) => st.level >= m.lo - 3 && st.level <= m.hi + 4);
      const map = fits.sort((a, b) => rate(b.id) * avgExp(b.id) - rate(a.id) * avgExp(a.id))[0] ?? maps.at(-1);
      st.min += 1;
      st.hunting += 1;
      gain(rate(map.id) * avgExp(map.id));
      continue;
    }
    let t = pace.travel;
    let exp = 0;
    const kills = {};
    for (const o of q.objectives) {
      if (o.type === 'kill') {
        if (dungeonBoss.has(o.mob)) t += pace.dungeon;
        else if (trialBoss.has(o.mob)) t += pace.trial;
        else kills[o.mob] = Math.max(kills[o.mob] ?? 0, o.count);
      } else if (o.type === 'collect') {
        const d = dropper(o.item);
        if (d) kills[d.mob] = Math.max(kills[d.mob] ?? 0, Math.ceil(o.count / d.chance));
        else t += o.count * pace.gather;
      } else if (o.type === 'talk' || o.type === 'deliver') t += pace.talk;
      else if (o.type === 'visit') t += pace.visit;
      else if (o.type === 'catch') t += pace.fish;
      else if (o.type === 'job') t += pace.job;
    }
    for (const [mob, n] of Object.entries(kills)) {
      const map = mapOfMob[mob];
      if (!map) continue;
      // Hunting one kind on a mixed map, you fell the others in its way too (and earn their EXP).
      const all = n / Math.max(0.1, share(map, mob));
      t += all / rate(map);
      exp += all * avgExp(map);
    }
    t += (sceneLines(q.id) * 4) / 60;
    st.min += t;
    st.questing += t;
    gain(exp + (q.rewards.exp ?? 0));
    st.done.add(q.id);
    if (q.story) st.log.push({ id: q.id, name: q.name, chapter: q.chapter, level: st.level, hours: +(st.min / 60).toFixed(1) });
  }
  const h = (m) => +((m * pace.extra) / 60).toFixed(1);
  return {
    pace: paceName,
    hours: h(st.min),
    reached: Object.fromEntries([10, 20, 30, 40, 50].map((l) => [l, h(st.reached[l] ?? NaN)])),
    huntingHours: h(st.hunting),
    questHours: h(st.questing),
    quests: st.done.size,
    chapters: Object.values(st.log.reduce((a, x) => ((a[x.chapter] = x), a), {})).map((x) => ({ chapter: x.chapter, ends: x.name, level: x.level, hours: +(x.hours * pace.extra).toFixed(1) })),
  };
}

if (typeof process !== 'undefined' && import.meta.url === (await import('node:url')).pathToFileURL(process.argv[1]).href) {
  const kpm = measure(150);
  const out = { killsPerMin: kpm, runs: [playthrough(kpm, 'perfect'), playthrough(kpm, 'player')] };
  if (process.argv.includes('--json')) console.log(JSON.stringify(out, null, 1));
  else {
    console.log('Kills a minute (autopilot):', Object.entries(kpm).map(([k, v]) => `${k} ${v}`).join(', '));
    for (const r of out.runs) {
      console.log(`\n${r.pace}: ${r.hours} h to the ending (${r.quests} quests; ${r.questHours} h questing, ${r.huntingHours} h hunting between)`);
      console.log('  reached level', Object.entries(r.reached).map(([l, hh]) => `${l} at ${hh} h`).join(', '));
      for (const c of r.chapters) console.log(`  chapter ${c.chapter} done at level ${c.level}, ${c.hours} h (${c.ends})`);
    }
  }
}
