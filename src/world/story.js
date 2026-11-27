// The main story in the world (data/story.js): cutscenes, the regions it opens, and the queens.
//
//   - Scenes: `playScene` starts one (world.scene); the cutscene window (ui/cutscene.js) shows it
//     and steps through it, and the world ignores the controls while it plays.
//   - Locks: a portal on the way to a region the story hasn't reached yet stays shut.
//   - Queens: in her trial arena a queen waits for the hero sent there; on her region's map she
//     comes back now and then, after her trial, for a rematch. Either way she fights with moves of
//     her own, each shown on the ground (or as a beam) a moment before it lands, so it can be read
//     and dodged: step out, jump, get up on a ledge.

import { groundAt } from './physics.js';
import { QUESTS } from '../data/quests.js';
import { SCENES, STORY_LOCKS, TRIALS } from '../data/story.js';
import { MOBS } from '../data/mobs.js';
import { questState } from '../core/quests.js';
import { spawnMob } from './mobs.js';
import { startCine, skipScene, endScene, isStaging } from './director.js';
import { escortOnMap } from './escort.js';
import { countItem, removeItem } from '../core/inventory.js';
import { GRAND_KETTLE } from './grandkettle.js';
import { CRYSTAL_THRONE, DARK_THRONE } from './prismaris.js';
import { REVEILLE } from './reveille.js';

// ---------- Scenes ----------

// `vars` fill in a line's {job} (and {name} is always the hero).
// A scene with steps that play only once some quests are done (`when`: an id or a list of them),
// only while one isn't yet (`unless`), or only on one map (`onMap`: where the scene starts), is
// played as its own copy holding just the steps this hero has earned.
const done = (char, when) => [when].flat().every((q) => char.quests?.[q]?.state === 'done');
function sceneFor(char, id, mapId = null) {
  const steps = SCENES[id];
  const keep = (st) => (!st.when || done(char, st.when)) && (!st.unless || !done(char, st.unless)) && (!st.onMap || st.onMap === mapId);
  const picky = (st) => st.when || st.unless || st.onMap;
  if (!steps.some((st) => picky(st) || st.together?.some(picky))) return id;
  const out = steps.filter(keep).map((st) => (st.together ? { ...st, together: st.together.filter(keep) } : st)).filter((st) => !st.together || st.together.length);
  const key = `${id}~${mapId}~${out.length}~${steps.map((st, i) => (keep(st) ? 1 : 0) + (st.together ? st.together.map((x) => (keep(x) ? 1 : 0)).join('') : '')).join('')}`;
  SCENES[key] ??= out;
  return key;
}

export function playScene(world, id, vars = {}) {
  if (!id || !SCENES[id]) return;
  id = sceneFor(world.char, id, world.map?.id ?? null);
  world.scene = { id, i: 0, t: 0, vars: { name: world.char.name, ...vars } };
  // The hero stops where they stand: no sliding on, no swing frozen halfway through.
  if (world.body) world.body.vx = 0;
  world.pose = null;
  startCine(world);
}

// A line or card's words with its {name} and {job} filled in.
export const fillScene = (world, words) => (words ?? '').replace(/\{(\w+)\}/g, (m, k) => world.scene?.vars?.[k] ?? m);

export function sceneStep(world) {
  const sc = world.scene;
  return sc ? SCENES[sc.id][sc.i] : null;
}

// Moves the scene on a line; past the last one it ends. `all` skips the rest (its staging plays
// out at once, so everyone ends up where the scene leaves them: world/director.js).
export function advanceScene(world, all = false) {
  const sc = world.scene;
  if (!sc) return;
  if (all) return skipScene(world);
  sc.i += 1;
  sc.t = 0;
  if (sc.i >= SCENES[sc.id].length) endScene(world);
}

export { isStaging };

// ---------- Locks ----------

// Why a portal won't open yet (the story hasn't got there), or null.
export function storyLock(world, map, portal) {
  const lock = STORY_LOCKS[`${map.id}.${portal.id}`];
  if (!lock) return null;
  return world.char.quests[lock.quest] ? null : lock.note;
}

// ---------- Queens ----------

// Each queen's moves: what they're called, how often, and what they put on the ground. Damage is
// a share of the queen's own slam (`special.damage`). Colours tint the warnings; `fx` is the effect
// that bursts where a move lands.
// How far above or below her own floor a queen notices the hero (a floor or so).
const NOTICE_DY = 150;

const QUEENS = {
  sylvana: {
    color: '#ff7fb6', light: '#ffe0ef',
    moves: [
      { id: 'petals', name: 'Petal Storm', sub: 'Step out of the circles', every: 6, make: (q, p) => [-80, 0, 80].map((dx) => ({ kind: 'circle', x: p.x + dx, w: 64, warn: 1.4, k: 0.8, fx: 'celleaves' })) },
      { id: 'roots', name: 'Root Wave', sub: 'Jump, or get up on a ledge!', every: 11, make: () => [{ kind: 'floor', warn: 1.8, k: 1, fx: 'celfissure' }] },
      { id: 'vines', name: 'Vine Lash', sub: 'Get out of the lane', every: 8, make: (q, p) => [lane(q, p, 420, 1.3, 0.9, 'celwindspin')] },
    ],
    adds: { at: [0.5], mob: 'blossomfairy', n: 2, line: 'Fairies, to me!' },
  },
  tamamo: {
    color: '#ffa65a', light: '#ffe2bf',
    moves: [
      { id: 'foxfire', name: 'Fox Fire', sub: 'Find the gaps between the flames', every: 6.5, make: (q, p, map) => spread(map, 5).map((x) => ({ kind: 'circle', x, w: 70, warn: 1.5, k: 0.8, fx: 'celfoxfire' })) },
      { id: 'tails', name: 'Nine-Tail Sweep', sub: 'Get away from her!', every: 9, make: (q) => [{ kind: 'lane', x: q.x - 280, w: 260, warn: 1.1, k: 1, fx: 'celfoxtail' }, { kind: 'lane', x: q.x + 20, w: 260, warn: 1.1, k: 1, fx: 'celfoxtail' }] },
    ],
    adds: { at: [0.6, 0.3], mob: 'nekomata', n: 2, line: 'Which one is the real me?', blink: true },
  },
  lilith: {
    color: '#ff6f9e', light: '#ffd0e0',
    moves: [
      { id: 'kiss', name: 'Kiss of Night', sub: 'Keep moving!', every: 7, chase: 3, make: (q, p) => [{ kind: 'circle', x: p.x, w: 60, warn: 1, k: 0.7, fx: 'celshadowhit' }] },
      { id: 'thorns', name: 'Rose Thorns', sub: 'Jump, or get up on a ledge!', every: 10, make: () => [{ kind: 'floor', warn: 1.8, k: 1, fx: 'celfissurered' }] },
      { id: 'petals', name: 'Night Petals', sub: 'Dodge the falling petals', every: 8, make: (q, p, map) => [p.x, ...spread(map, 3)].map((x) => ({ kind: 'pillar', x, w: 54, warn: 1.4, k: 0.8, fx: 'celpillarrage' })) },
    ],
    adds: { at: [0.4], mob: 'lamia', n: 2, line: 'My dears, entertain our guest!' },
  },
  selene: {
    color: '#a8c4ff', light: '#eef4ff',
    moves: [
      { id: 'beams', name: 'Moonbeam', sub: 'Step out of the light', every: 6, make: (q, p, map) => [p.x, ...spread(map, 2)].map((x) => ({ kind: 'pillar', x, w: 58, warn: 1.3, k: 0.8, fx: 'celmoonbeam' })) },
      { id: 'crescent', name: 'Crescent Wave', sub: 'Jump over it!', every: 8.5, make: (q, p, map) => [{ kind: 'lane', x: p.x < q.x ? 0 : q.x, w: p.x < q.x ? q.x : map.width - q.x, warn: 1.2, k: 1, fx: 'cellunarcrescent', low: true }] },
      { id: 'stars', name: 'Starfall', sub: 'Ledges! Now!', every: 12, from: 0.5, make: (q, p, map) => [{ kind: 'floor', warn: 2, k: 1.1, fx: 'celquakegold' }, ...spread(map, 4).map((x) => ({ kind: 'circle', x, w: 60, warn: 2, k: 0.6, fx: 'celcomet', high: true }))] },
    ],
    adds: { at: [], mob: null },
    enrage: 0.25,
  },
  // Madame Reveille (Chapter 10's finale, rebuilt 2026-11-27): the Queen's alarm clock as a brisk
  // morning governess, a set rotation of named casts in three phases (world/reveille.js; rotationTurn below).
  alarm: REVEILLE,
  // Prismaris (rebuilt 2026-11-27): the Crystal Throne's field boss and his Chapter 10 trial, each a
  // set rotation of named casts (world/prismaris.js; rotationTurn below).
  crystalking: CRYSTAL_THRONE,
  nightking: DARK_THRONE,
  // The Grand Kettle, the Tea Terraces' area boss: a set rotation of named casts in three phases,
  // each on his cast bar, in his own looks (world/grandkettle.js; rotationTurn below).
  grandkettle: GRAND_KETTLE,
};

export const isQueen = (m) => Boolean(QUEENS[m?.def?.id]);
export const queenStyle = (id) => QUEENS[id];

// A lane from the queen toward the hero, `w` long.
function lane(q, p, w, warn, k, fx) {
  const dir = Math.sign(p.x - q.x) || 1;
  return { kind: 'lane', x: dir > 0 ? q.x : q.x - w, w, warn, k, fx };
}
// `n` spots spread over the floor, a little jittered.
function spread(map, n) {
  const step = (map.width - 160) / n;
  return Array.from({ length: n }, (_, i) => 80 + step * (i + 0.5) + (Math.random() - 0.5) * step * 0.5);
}

// Puts the queen in her arena if the hero has her trial to do.
export function onStoryMap(world) {
  world.zones = [];
  // The little Mochi you're bringing home, if it's here (world/escort.js).
  escortOnMap(world);
  // A cake for the Queen (`story_2_cake`): in with a shortcake and she eats it in her sleep.
  const cake = world.char.quests?.story_2_cake;
  if (world.map.id === 'royal_bed' && cake?.state === 'active' && !cake.marks?.[0]) {
    if (countItem(world.char.inventory, 'dish_shortcake') > 0) {
      removeItem(world.char.inventory, 'dish_shortcake', 1);
      (cake.marks ??= {})[0] = true;
      playScene(world, 'queen_cake');
    } else world.log("The Royal Snore Translator eyes your empty hands. \"No cake, no audience.\"", '#ffc2d4');
  }
  // The Queen's Bedchamber, the first time you come to say hello (`story_1_queen`).
  const hello = world.char.quests?.story_1_queen;
  if (world.map.id === 'royal_bed' && hello?.state === 'active' && !hello.saw) {
    hello.saw = true;
    playScene(world, 'queen_visit');
  }
  const t = TRIALS[world.map.trial];
  if (!t) return;
  if (questState(world.char, t.quest) !== 'active') return;
  const m = spawnMob(world.map, { mob: t.boss, x: t.x, y: groundAt(world.map, t.x) });
  m.trialOf = world.map.trial;
  m.aggroUntil = Infinity;
  world.mobs.push(m);
  world.trial = { key: world.map.trial, queen: m, won: false };
  // (A trial with an entrance of its own plays it the first time you come in.)
  const q = world.char.quests[t.quest];
  if (t.intro && !q.introSeen) {
    q.introSeen = true;
    playScene(world, t.intro);
  }
}

// Whether a field boss slot may fill: a queen only comes back once you've passed her trial.
export function spawnAllowed(world, spawn) {
  return !spawn.after || world.char.quests[spawn.after]?.state === 'done';
}

// Every tick: queens on this map use their moves, warnings count down and go off.
export function tickStory(world, dt, hurt) {
  world.zones ??= [];
  const mirrored = Boolean(world.net?.mirrored(world));
  if (!mirrored && !world.dungeon) {
    for (const m of world.mobs) {
      const style = QUEENS[m.def.id];
      if (!style || m.hp <= 0) continue;
      // Only once she's in the fight (hurt, or the hero close: near her along her floor and no
      // more than a floor or so above or below it, so someone fishing or passing on a
      // ledge of their own high over her isn't picked out).
      const near = m.aggroUntil > world.now || (Math.abs(world.body.x - m.x) <= 420 && Math.abs(world.body.y - m.y) <= NOTICE_DY);
      // (A boss with a set rotation runs it, finishing a cast even if you step away.)
      if (style.rotation) {
        rotationTurn(world, m, style, dt, near);
        continue;
      }
      if (!near) continue;
      queenTurn(world, m, style, dt);
    }
  }
  for (const z of world.zones) {
    z.t += dt;
    // (A marker follows its member until a beat before it lands: Prismaris's, world/prismaris.js.)
    if (z.follow && !z.hit && z.t < z.warn - (z.lock ?? 0.6)) {
      z.x = world.body.x;
      if (world.body.onGround) z.y = world.body.y;
    }
    if (z.hit) {
      z.after += dt;
      continue;
    }
    if (z.t < z.warn) continue;
    z.hit = true;
    if (z.from && z.from.hp <= 0) continue;
    // (A stack's hit is shared by everyone standing in it.)
    if (z.stack) {
      const n = (inZone(world, z, world.body) ? 1 : 0) + (world.bots?.list ?? []).filter((b) => (b.hunter || b.party) && !b.gone && !b.down && b.body && b.map === world.map.id && inZone(world, z, b.body)).length;
      z.damage = Math.round(z.damage / Math.max(1, n));
    }
    world.juice.push({ type: 'shake', mag: z.kind === 'floor' ? 7 : 3, dur: z.kind === 'floor' ? 0.6 : 0.25 });
    if (!world.dead && inZone(world, z, world.body)) hurt(world, z.damage, z.from?.x ?? z.x);
    // (The other players fighting her get caught too: world/raids.js.)
    world.onZoneHit?.(z);
  }
  world.zones = world.zones.filter((z) => !z.hit || z.after < (z.hold ?? 0.6));
  // A queen's trial won: her words, then back to whoever sent you.
  const tr = world.trial;
  if (tr && !tr.won && tr.queen.hp <= 0) {
    tr.won = true;
    world.zones = [];
    // (Her last move's name goes too: the clock stops for the scene, so it would hang over it.)
    world.callout = null;
    // Her helpers slip away with her.
    for (const a of world.mobs) if (a.add && a.hp > 0) a.hp = 0;
    const q = QUESTS[TRIALS[tr.key].quest];
    // (Elder Shiratama goes home from Prismaris's: render/prologue.js.)
    const elder = TRIALS[tr.key].elder;
    if (elder) world.char.elders = { ...(world.char.elders ?? {}), [elder]: true };
    playScene(world, q.scenes?.win);
    world.log(`${tr.queen.def.name} is calm again. Report to ${q.giver[0].toUpperCase()}${q.giver.slice(1)}.`, '#ffe36b');
  }
}

function queenTurn(world, m, style, dt) {
  const s = (m.moves ??= { next: {}, adds: [...(style.adds?.at ?? [])], chase: null });
  const frac = m.hp / m.def.hp;
  const fast = style.enrage && frac <= style.enrage ? 0.7 : frac <= 0.5 ? 0.85 : 1;
  const base = m.def.special?.damage ?? 200;
  // A chasing move (Lilith's kisses) keeps landing where the hero is now.
  if (s.chase) {
    s.chase.t -= dt;
    if (s.chase.t <= 0) {
      s.chase.left -= 1;
      s.chase.t = 0.7;
      addZones(world, m, s.chase.move.make(m, world.body, world.map), base);
      if (s.chase.left <= 0) s.chase = null;
    }
  }
  // Adds at their thresholds, with a word from the queen.
  if (s.adds.length && frac <= s.adds[0]) {
    s.adds.shift();
    if (style.adds.mob) {
      for (let i = 0; i < style.adds.n; i++) {
        // (On her own floor, beside her: a field queen's map has cliffs, rises and ledges.)
        const x = Math.max(m.x1 + 20, Math.min(m.x2 - 20, Math.max(60, Math.min(world.map.width - 60, m.x + (i % 2 ? 1 : -1) * (160 + i * 40)))));
        const a = spawnMob(world.map, { mob: style.adds.mob, x, y: m.def.fly ? groundAt(world.map, x) : m.y });
        a.aggroUntil = Infinity;
        a.add = true;
        world.mobs.push(a);
      }
    }
    if (style.adds.blink) {
      // Tamamo vanishes in a puff and reappears across the room.
      world.fx.push({ kind: 'trialfx', name: 'celsmokebomb', x: m.x, y: m.y - m.def.h / 2, t: 0, dur: 0.6 });
      m.x = m.x > world.map.width / 2 ? m.x1 + 120 : m.x2 - 120;
      world.fx.push({ kind: 'trialfx', name: 'celsmokebomb', x: m.x, y: m.y - m.def.h / 2, t: 0, dur: 0.6 });
    }
    callout(world, m, style.adds.line, '');
  }
  // One move at a time: wait until the last one has gone off.
  if (world.zones.some((z) => !z.hit && z.from === m)) return;
  for (const mv of style.moves) {
    if (mv.from && frac > mv.from) continue;
    s.next[mv.id] ??= mv.every * (0.4 + Math.random() * 0.5);
    s.next[mv.id] -= dt;
  }
  const ready = style.moves.filter((mv) => (!mv.from || frac <= mv.from) && s.next[mv.id] <= 0);
  if (!ready.length) return;
  const mv = ready[Math.floor(Math.random() * ready.length)];
  s.next[mv.id] = mv.every * fast;
  callout(world, m, mv.name, mv.sub);
  const zones = mv.make(m, world.body, world.map);
  addZones(world, m, zones, base);
  // (Which move she's casting and when it goes off, for her rig to act it out.)
  m.castMove = { id: mv.id, at: world.now, warn: Math.max(0.4, ...zones.map((z) => z.warn ?? 1)) };
  if (mv.chase) s.chase = { move: mv, left: mv.chase - 1, t: 0.8 };
}

// A boss with a set rotation (the Grand Kettle, world/grandkettle.js), the way the dungeon bosses
// fight: its entrance cast first, then each phase's casts in order, round and round, the phase
// changing at its health mark with a word from it. Each cast shows on its cast bar (m.cast) for its
// `dur`, its telegraphs laid out as it starts and landing as it ends; in the cast's last half second
// it winds up (m.windup) and lets fly as it ends (m.attackAt), `m.castPose` telling its rig which.
function rotationTurn(world, m, style, dt, near) {
  const R = style.rotation;
  const s = (m.rot ??= { phase: -1, i: 0, wait: 0.6, end: null, intro: false, step: null });
  if (s.end != null) {
    const left = s.end - world.now;
    m.windup = left > 0 && left < 0.5 ? left : 0;
    if (left > 0) return;
    m.cast = null;
    m.castPose = null;
    m.windup = 0;
    m.attackAt = world.now;
    s.end = null;
    s.wait = s.step.after ?? 1.6;
    if (s.step !== R.intro) s.i = (s.i + 1) % s.list.length;
    return;
  }
  if (!near) return;
  const frac = m.hp / m.def.hp;
  let ph = 0;
  R.phases.forEach((p, i) => {
    if (frac <= p.at) ph = i;
  });
  if (ph !== s.phase) {
    if (s.phase >= 0 && R.phases[ph].line) callout(world, m, R.phases[ph].line, R.phases[ph].lineSub);
    s.phase = ph;
    s.list = R.phases[ph].list;
    s.i = 0;
    s.wait = Math.max(s.wait, s.phase > 0 ? 1.4 : 0);
  }
  s.wait -= dt;
  if (s.wait > 0) return;
  const step = R.intro && !s.intro ? R.intro : s.list[s.i];
  s.intro = true;
  s.step = step;
  m.cast = { name: step.name, t0: world.now, dur: step.dur };
  m.castPose = step.pose ?? step.id;
  m.castMove = { id: step.id, at: world.now, warn: step.dur };
  callout(world, m, step.name, step.sub);
  const zones = step.make ? step.make(m, world.body, world.map) : [];
  addZones(world, m, zones.map((z) => ({ warn: step.dur, ...z })), style.damage ?? m.def.special?.damage ?? 200);
  s.end = world.now + step.dur;
}

function addZones(world, m, zones, base) {
  const before = world.zones.length;
  addZonesHere(world, m, zones, base);
  // Friends on her map see them coming too (and get hit by them in their own games).
  if (!world.map.trial) world.net?.zones?.(world, world.zones.slice(before), world.callout);
}

function addZonesHere(world, m, zones, base) {
  for (const z of zones) {
    // Circles land on whatever the hero is standing on; everything else on her own floor (a field
    // queen may walk a plateau or a crag, not the map's ground line).
    const floor = m.def.fly ? world.map.groundY : Math.round(m.y);
    const y = z.kind === 'circle' || z.kind === 'mark' ? (z.high ? floor : world.body.onGround ? world.body.y : floor) : floor;
    world.zones.push({ t: 0, hit: false, after: 0, y, from: m, damage: Math.round(base * z.k), color: QUEENS[m.def.id].color, light: QUEENS[m.def.id].light, ...z });
  }
}

function callout(world, m, title, sub) {
  world.callout = { title, sub, color: QUEENS[m.def.id].color, at: world.now };
}

// Whether `body` is standing where zone `z` goes off.
export function inZone(world, z, body) {
  // (the whole room: no dodging it; a member's marker: a column round them, no jumping it)
  if (z.kind === 'raid') return true;
  if (z.kind === 'mark') return Math.abs(body.x - z.x) < z.w / 2 + 6;
  if (z.kind === 'circle') return Math.abs(body.x - z.x) < z.w / 2 + 6 && Math.abs(body.y - z.y) < 16;
  const floor = z.y ?? world.map.groundY;
  if (z.kind === 'floor') return body.onGround && Math.abs(body.y - floor) < 2;
  if (z.kind === 'pillar') return Math.abs(body.x - z.x) < z.w / 2 + 4;
  // A lane hits along the floor (a low one only those on it; jumping clears it).
  if (z.low && !body.onGround) return false;
  return body.x >= z.x - 6 && body.x <= z.x + z.w + 6 && Math.abs(body.y - floor) < 34;
}

// The queen a trial arena is for (for the map's name card), or null.
export function trialQueen(mapTrial) {
  const t = TRIALS[mapTrial];
  return t ? MOBS[t.boss] : null;
}
