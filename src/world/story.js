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

// ---------- Scenes ----------

// `vars` fill in a line's {job} (and {name} is always the hero).
// A scene with steps that play only once some quests are done (`when`: an id or a list of them),
// or only on one map (`onMap`: where the scene starts), is played as its own copy holding just the
// steps this hero has earned.
const done = (char, when) => [when].flat().every((q) => char.quests?.[q]?.state === 'done');
function sceneFor(char, id, mapId = null) {
  const steps = SCENES[id];
  const keep = (st) => (!st.when || done(char, st.when)) && (!st.onMap || st.onMap === mapId);
  const picky = (st) => st.when || st.onMap;
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
  // The Alarm (Chapter 10's finale): the Queen's clock grown giant, ringing her back to Monday. A
  // ring round it, the clock hands slamming down, a bell clang along the floor, and after its
  // first snooze "IT'S MONDAY!" on the whole lawn. Three snoozes (snoozeTurn), louder each time.
  alarm: {
    color: '#ffc94a', light: '#fff6d8',
    snooze: { at: [0.75, 0.5, 0.25], dur: 5, back: ["RIIING! It's back!", 'RIIIIING! Even louder!', 'RIIIIIIIIING!!!'] },
    moves: [
      { id: 'ring', name: 'Wake-Up Ring', sub: 'Get away from it!', every: 7, make: (q) => { q.ringSoon = 1.5; return [{ kind: 'circle', x: q.x, w: 240 + 40 * (q.loud ?? 0), warn: 1.5, k: 1, high: true, fx: 'celquakegold' }]; } },
      { id: 'hands', name: 'Tick, Tock', sub: 'The clock hands come down: move!', every: 6, make: (q, p, map) => [p.x, ...spread(map, 2 + (q.loud ?? 0))].map((x) => ({ kind: 'pillar', x, w: 54, warn: 1.3, k: 0.8, fx: 'celpillarrage' })) },
      { id: 'clang', name: 'Bell Clang', sub: 'Jump it!', every: 8, make: (q, p) => [{ ...lane(q, p, 560, 1.1, 0.9, 'celfissure'), low: true }] },
      { id: 'monday', name: "IT'S MONDAY!", sub: 'Ledges! Now!', every: 12, loud: 1, make: (q, p, map) => [{ kind: 'floor', warn: 2, k: 1.1, fx: 'celquakegold' }, ...spread(map, 2 + (q.loud ?? 0)).map((x) => ({ kind: 'circle', x, w: 60, warn: 2, k: 0.8, high: true, fx: 'celfissure' }))] },
    ],
    adds: { at: [], mob: null },
    enrage: 0,
  },
  // Prismaris in his trial (Chapter 10): scared of the dark, hugging the Queen's alarm clock.
  // Crystal spikes under you, his nightlight flaring round him, his tail swept along the floor,
  // and from two thirds down, Lights Out: the room goes dark but for three pools of light.
  nightking: {
    color: '#b8a8ff', light: '#f4f0ff',
    moves: [
      { id: 'spikes', name: 'Crystal Spikes', sub: 'Step off the glowing cracks', every: 6, make: (q, p, map) => [p.x, ...spread(map, 3)].map((x) => ({ kind: 'circle', x, w: 64, warn: 1.3, k: 0.8, fx: 'celfissure' })) },
      { id: 'flare', name: 'Nightlight Flare', sub: 'His light flares: get away from him', every: 9, make: (q) => [{ kind: 'circle', x: q.x, w: 260, warn: 1.5, k: 1, high: true, fx: 'celquakegold' }] },
      { id: 'sweep', name: 'Tail Sweep', sub: 'Jump it!', every: 8, make: (q, p) => [{ ...lane(q, p, 520, 1.1, 0.9, 'celfissure'), low: true }] },
      { id: 'dark', name: 'Lights Out!', sub: 'Stand in a pool of light!', every: 15, from: 0.66, make: (q, p, map) => lightsOut(map) },
    ],
    adds: { at: [], mob: null },
    enrage: 0.25,
  },
};

// Prismaris's Lights Out: the floor everywhere but three pools of light. Each lane carries the pools
// (render/trial.js darkens the room round them).
function lightsOut(map) {
  const pools = spread(map, 3);
  const r = 52;
  const cuts = [0, ...pools.flatMap((x) => [x - r, x + r]), map.width];
  const out = [];
  for (let k = 0; k < cuts.length; k += 2) if (cuts[k + 1] - cuts[k] > 8) out.push({ kind: 'lane', x: cuts[k], w: cuts[k + 1] - cuts[k], warn: 3, k: 1.3, fx: 'celshadowhit', dark: true, pools });
  return out;
}

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
      if (!(m.aggroUntil > world.now) && (Math.abs(world.body.x - m.x) > 420 || Math.abs(world.body.y - m.y) > NOTICE_DY)) continue;
      // (The Alarm's snoozes: knocked quiet a while, then back louder.)
      if (style.snooze && snoozeTurn(world, m, style)) continue;
      queenTurn(world, m, style, dt);
      if (m.ringSoon) {
        m.ringAt = world.now + m.ringSoon;
        m.ringSoon = 0;
      }
    }
  }
  for (const z of world.zones) {
    z.t += dt;
    if (z.hit) {
      z.after += dt;
      continue;
    }
    if (z.t < z.warn) continue;
    z.hit = true;
    if (z.from && z.from.hp <= 0) continue;
    world.juice.push({ type: 'shake', mag: z.kind === 'floor' ? 7 : 3, dur: z.kind === 'floor' ? 0.6 : 0.25 });
    if (!world.dead && inZone(world, z, world.body)) hurt(world, z.damage, z.from?.x ?? z.x);
    // (The other players fighting her get caught too: world/raids.js.)
    world.onZoneHit?.(z);
  }
  world.zones = world.zones.filter((z) => !z.hit || z.after < 0.6);
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
    if (mv.loud && (m.loud ?? 0) < mv.loud) continue;
    s.next[mv.id] ??= mv.every * (0.4 + Math.random() * 0.5);
    s.next[mv.id] -= dt;
  }
  const ready = style.moves.filter((mv) => (!mv.from || frac <= mv.from) && (!mv.loud || (m.loud ?? 0) >= mv.loud) && s.next[mv.id] <= 0);
  if (!ready.length) return;
  const mv = ready[Math.floor(Math.random() * ready.length)];
  // (Louder after each snooze: quicker too.)
  s.next[mv.id] = mv.every * fast * (1 - 0.1 * (m.loud ?? 0));
  callout(world, m, mv.name, mv.sub);
  addZones(world, m, mv.make(m, world.body, world.map), base);
  if (mv.chase) s.chase = { move: mv, left: mv.chase - 1, t: 0.8 };
}

// The Alarm's snoozes (Chapter 10's finale): at each mark it's knocked quiet for a few seconds
// (nothing takes it lower, it does nothing, its warnings are called off), then it comes back louder:
// bigger rings, more clock hands, quicker, and from the first snooze on, "IT'S MONDAY!".
function snoozeTurn(world, m, style) {
  const s = (m.snooze ??= { at: [...style.snooze.at], until: 0 });
  if (s.until) {
    if (world.now < s.until) return true;
    s.until = 0;
    m.minHp = 0;
    m.loud = (m.loud ?? 0) + 1;
    m.ringAt = world.now;
    callout(world, m, style.snooze.back[Math.min(style.snooze.back.length - 1, m.loud - 1)], "It's back, and LOUDER");
    world.juice.push({ type: 'shake', mag: 4, dur: 0.6 });
    return false;
  }
  if (s.at.length && m.hp / m.def.hp <= s.at[0]) {
    s.at.shift();
    s.until = world.now + style.snooze.dur;
    m.snoozeUntil = s.until;
    m.minHp = m.hp;
    world.zones = world.zones.filter((z) => z.from !== m || z.hit);
    callout(world, m, 'SNOOZE!', '...it drifts off. For now.');
    return true;
  }
  return false;
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
    const y = z.kind === 'circle' ? (z.high ? floor : world.body.onGround ? world.body.y : floor) : floor;
    world.zones.push({ t: 0, hit: false, after: 0, y, from: m, damage: Math.round(base * z.k), color: QUEENS[m.def.id].color, light: QUEENS[m.def.id].light, ...z });
  }
}

function callout(world, m, title, sub) {
  world.callout = { title, sub, color: QUEENS[m.def.id].color, at: world.now };
}

// Whether `body` is standing where zone `z` goes off.
export function inZone(world, z, body) {
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
