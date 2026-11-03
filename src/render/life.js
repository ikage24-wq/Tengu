// The hero at her life skills, render side: which move she plays at a spot (the kind of spot picks
// it, render/life-moves.js), her pose through each fishing phase with blends between them, the find
// held up in her hand, where the rod's tip is for the fishing line, and the beats of each move
// (sparks off the rock, chips off the trunk, leaves, fluff, steam, a splash) as particles. Nothing
// here changes the game: world/gathering.js and world/fishing.js keep the timing.

import { LIFE_MOVES } from './life-moves.js';
import { itemIcon } from './icons.js';
import { blit } from './pixel.js';
import { ITEMS } from '../data/items.js';
import { addParticle, sparks, dust, shake as shakeScreen } from './particles.js';
import { groundAt } from '../world/physics.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// The move for each kind of spot (a spot's `look` first: a moonpetal is still picked by hand).
export const LIFE_BY_KIND = { herb: 'gather', flower: 'gather', moonpetal: 'gather', mushroom: 'gather', fruit: 'pluck', honey: 'pluck', fiber: 'reap', ore: 'mine', gem: 'mine', wood: 'chop' };
export const LIFE_POSES = new Set(Object.keys(LIFE_MOVES));

const secsOf = (g) => g.secs ?? g.kind?.secs ?? 1.2;

// Fishing, phase by phase (world/fishing.js): the cast, the wait (sat on the bank, perking up at
// each nibble), the bite, the catch, the miss.
export function fishingPose(f) {
  if (f.phase === 'cast') return { pose: 'fishcast', progress: clamp01(f.t / 0.5), dur: 0.5 };
  if (f.phase === 'wait') {
    const n = f.nibbles?.find((at) => f.t >= at - 0.05 && f.t < at + 0.55);
    if (n != null) return { pose: 'fishperk', progress: clamp01((f.t - n + 0.05) / 0.6), dur: 0.6 };
    const dur = Math.max(f.wait ?? 3, f.t + 0.01);
    return { pose: 'fishwait', progress: clamp01(f.t / dur), dur };
  }
  if (f.phase === 'bite') {
    const dur = f.fish?.react ?? 1;
    return { pose: 'fishbite', progress: clamp01(f.t / dur), dur };
  }
  if (f.phase === 'catch') return { pose: 'fishcatch', progress: clamp01(f.t / 1.4), dur: 1.4 };
  return { pose: 'fishmiss', progress: clamp01(f.t / 0.9), dur: 0.9 };
}

// One phase flows into the next: when the move changes, the new one eases out of where the old
// one was over a few frames (render/hero.js blends them).
const BLEND = 0.18;
const track = { kind: null, since: 0, last: null, from: null };
function blended(world, p) {
  if (p.pose !== track.kind) {
    track.from = track.last && track.last.pose !== p.pose ? { kind: track.last.pose, progress: track.last.progress, dur: track.last.dur } : null;
    track.kind = p.pose;
    track.since = world.now;
  }
  track.last = p;
  const blend = (world.now - track.since) / BLEND;
  return track.from && blend < 1 ? { ...p, from: track.from, blend } : p;
}

// The pose while she works a spot or fishes, or null.
export function lifePose(world) {
  const g = world.gathering;
  if (g) {
    const kind = LIFE_BY_KIND[g.node.look] ?? LIFE_BY_KIND[g.node.kind] ?? world.pose?.kind ?? 'gather';
    return blended(world, { pose: LIFE_MOVES[kind] ? kind : 'gather', progress: clamp01(g.t / secsOf(g)), dur: secsOf(g) });
  }
  if (world.fishing) return blended(world, fishingPose(world.fishing));
  track.kind = null;
  track.last = null;
  return null;
}

// A friend fishing (online: only the phase comes over): the same moves, run on the clock.
export function friendFishPose(f, time) {
  if (f.phase === 'wait' || f.phase === 'cast') return { pose: 'fishwait', progress: (time % 30) / 30, dur: 30 };
  if (f.phase === 'bite') return { pose: 'fishbite', progress: 0.5 + 0.5 * ((time * 0.7) % 1), dur: 1 };
  if (f.phase === 'catch') return { pose: 'fishcatch', progress: 0.8, dur: 1.4 };
  return { pose: 'fishmiss', progress: 1, dur: 0.9 };
}

// What she holds up: the spot's main find, the cooked dish, the crafted piece.
export function lifeFind(world) {
  const g = world.gathering;
  if (g) {
    const pool = Object.entries(g.node.pool ?? {}).sort((a, b) => b[1] - a[1]);
    return pool[0]?.[0] ?? null;
  }
  if (world.pose && LIFE_POSES.has(world.pose.kind)) return world.pose.find ?? null;
  return null;
}

// Draws the find in her weapon hand (as the move shows it, `find` 0-1: it pops in with a little
// overshoot), just in front of and above the fingers so the hand still reads holding it.
export function holdFind(id) {
  if (!id || !ITEMS[id]) return null;
  return (ctx, front, back, dir, scale, mv) => {
    const k = mv?.find ?? 0;
    if (k <= 0.02) return;
    const icon = itemIcon(id);
    const pop = k < 1 ? k * (1 + 0.35 * Math.sin(k * Math.PI)) : 1;
    const s = 0.62 * scale * pop;
    const w = (icon.canvas.width / (icon.res ?? 1)) * s;
    const h = (icon.canvas.height / (icon.res ?? 1)) * s;
    blit(ctx, icon, front[0] + dir * 4.5 * scale - w / 2, front[1] - 3.5 * scale - h / 2, { scale: s });
  };
}

// The rod's tip on the canvas this frame (render/hero.js reports it as it draws the rod).
let tip = null;
export const rodTip = () => tip;
export const onRodTip = (pt) => { tip = pt; };
export const clearRodTip = () => { tip = null; };

// The last blow on a spot, so the spot can shudder with it (render/gathering.js).
let lastHit = { x: null, at: -9, big: false };
export const spotHit = () => lastHit;

// ---- The beats ----

const ORE_SPARK = { copper_ore: ['#ffd0a0', '#ff9a5a', '#ffffff'], iron_ore: ['#eef2ff', '#b8c4e8', '#ffffff'], silver_ore: ['#ffffff', '#dfe8ff', '#c8d4ff'], mithril_ore: ['#bffcff', '#7fe6ee', '#ffffff'] };
const WOOD_CHIP = { oak_log: '#e0b47a', maple_log: '#f0a070', cedar_log: '#d8906a', skywood_log: '#c8d8ff' };
const FIBRE = { cotton: '#ffffff', silkmoss: '#c8f0b0', lotus_fiber: '#ffd6ea', cloud_cotton: '#eef4ff' };
const poolHas = (node, table) => Object.keys(node?.pool ?? {}).find((id) => table[id]);

function bits(fx, x, y, n, make) {
  for (let i = 0; i < n; i++) addParticle(fx, make(i));
}

// `who`: someone else at their life skills (another player: their body, spot and stove or bench),
// whose beats are the same but never shake your screen.
function beat(fx, world, kind, k, who = null) {
  const b = who?.body ?? world.body;
  const dir = b.facing < 0 ? -1 : 1;
  const node = who ? who.node : world.gathering?.node;
  const nx = node?.x ?? b.x + dir * 16;
  const ny = node?.y ?? b.y;
  const r = Math.random;
  const shake = who ? () => {} : shakeScreen;
  if (kind === 'mine') {
    const big = k > 0;
    const x = nx - dir * 9;
    const y = ny - 12;
    sparks(fx, x, y, big, -dir, ORE_SPARK[poolHas(node, ORE_SPARK)] ?? ORE_SPARK.iron_ore, true);
    dust(fx, x, ny, big ? 4 : 2, -dir, '#e8dcf0', '#c8b8d8');
    bits(fx, x, y, big ? 5 : 3, () => ({ x, y, vx: -dir * (30 + r() * 70), vy: -60 - r() * 70, g: 380, drag: 1, life: 0.5 + r() * 0.3, size: 1.2 + r(), shape: 'pixel', color: r() < 0.5 ? '#b8a8c8' : '#8f80a8' }));
    shake(fx, big ? 1.8 : 1.1, 0.14);
    lastHit = { x: nx, at: world.now, big };
  } else if (kind === 'chop') {
    const big = k > 0;
    const x = nx - dir * 5;
    const y = ny - 19;
    const c = WOOD_CHIP[poolHas(node, WOOD_CHIP)] ?? WOOD_CHIP.oak_log;
    bits(fx, x, y, big ? 7 : 5, () => ({ x, y, vx: -dir * (40 + r() * 80), vy: -50 - r() * 80, g: 300, drag: 1.4, life: 0.55 + r() * 0.3, size: 1.4 + r() * 0.8, shape: 'petal', spin: 8 + r() * 8, phase: r() * 6, color: r() < 0.6 ? c : '#fff0d8' }));
    // A leaf or two shaken loose from the crown.
    bits(fx, nx, ny - 44, big ? 3 : 1, () => ({ x: nx + (r() - 0.5) * 20, y: ny - 40 - r() * 12, vx: (r() - 0.5) * 20, vy: 10, g: 30, drag: 2, sway: 30, life: 1.2 + r() * 0.6, size: 1.6, shape: 'petal', spin: 3, phase: r() * 6, color: '#8edc86' }));
    shake(fx, big ? 1.4 : 0.9, 0.12);
    lastHit = { x: nx, at: world.now, big };
  } else if (kind === 'gather') {
    bits(fx, nx, ny - 4, 4, () => ({ x: nx + (r() - 0.5) * 8, y: ny - 4, vx: (r() - 0.5) * 50, vy: -50 - r() * 40, g: 160, drag: 2, life: 0.6 + r() * 0.3, size: 1.4, shape: 'petal', spin: 6, phase: r() * 6, color: r() < 0.5 ? '#8edc86' : '#6cc46c' }));
    lastHit = { x: nx, at: world.now, big: false };
  } else if (kind === 'pluck') {
    const y = ny - 40;
    bits(fx, nx, y, 3, () => ({ x: nx + (r() - 0.5) * 10, y, vx: (r() - 0.5) * 30, vy: -20, g: 60, drag: 2, sway: 25, life: 1 + r() * 0.5, size: 1.6, shape: 'petal', spin: 3, phase: r() * 6, color: r() < 0.5 ? '#8edc86' : '#ffd0e0' }));
    lastHit = { x: nx, at: world.now, big: false };
  } else if (kind === 'reap') {
    const c = FIBRE[poolHas(node, FIBRE)] ?? '#ffffff';
    bits(fx, nx, ny - 6, 6, () => ({ x: nx + (r() - 0.5) * 12, y: ny - 6 - r() * 6, vx: (r() - 0.5) * 30, vy: -18 - r() * 22, g: -4, drag: 1.5, sway: 20, life: 1.2 + r() * 0.8, size: 1 + r() * 0.8, color: c }));
    lastHit = { x: nx, at: world.now, big: false };
  } else if (kind === 'cook') {
    const st = world.map.stove ?? b.x + dir * 14;
    const gy = groundAt(world.map, st);
    bits(fx, st, gy - 40, 5, (i) => ({ x: st + (r() - 0.5) * 10, y: gy - 40, vx: (r() - 0.5) * 30, vy: -70 - r() * 40, g: 260, drag: 1, life: 0.45 + r() * 0.2, size: 1.3, color: ['#ffb35a', '#ffe9a6', '#ff8a7a', '#9fe08f'][i % 4] }));
    bits(fx, st, gy - 46, 2, () => ({ x: st + (r() - 0.5) * 8, y: gy - 46, vx: (r() - 0.5) * 10, vy: -20, drag: 2, life: 0.8, size: 4, grow: 6, shape: 'puff', color: '#ffffff', shade: '#efe8fb' }));
  } else if (kind === 'craft') {
    const x = ((who ? who.at : world.pose?.at) ?? b.x + dir * 16) - dir * 2;
    const y = groundAt(world.map, x) - 17;
    sparks(fx, x, y, k === 2, -dir, ['#ffe9a6', '#ffb35a', '#ffffff'], true);
  }
}

const seen = { kind: null, p: 0 };
// Called once a frame (render/scene.js): fires each beat of the move that's playing as it passes.
export function lifeBeats(fx, world) {
  const lp = lifePose(world);
  const pose = lp ?? (world.pose && LIFE_POSES.has(world.pose.kind) ? { pose: world.pose.kind, progress: 1 - world.pose.t / world.pose.dur, dur: world.pose.dur } : null);
  // A splash where the line lands, and a big one when the fish comes out.
  const f = world.fishing;
  if (f && seen.fishPhase !== f.phase) {
    if (f.phase === 'wait' && seen.fishPhase === 'cast') splash(fx, f.spot.bx, f.spot.by, 0);
    if (f.phase === 'bite') splash(fx, f.spot.bx, f.spot.by, 1);
    if (f.phase === 'catch') splash(fx, f.spot.bx, f.spot.by, 2);
  }
  seen.fishPhase = f?.phase ?? null;
  if (!pose) {
    seen.kind = null;
    return;
  }
  const p = pose.progress ?? 0;
  if (pose.pose !== seen.kind || p < seen.p) {
    seen.kind = pose.pose;
    seen.p = 0;
  }
  const hits = LIFE_MOVES[pose.pose]?.(Math.min(1, p), pose.dur)?.hitAt ?? [];
  hits.forEach((h, k) => {
    if (seen.p < h && p >= h) beat(fx, world, pose.pose, k);
  });
  seen.p = p;
}

function splash(fx, x, y, size) {
  const r = Math.random;
  addParticle(fx, { x, y, vx: 0, vy: 0, life: 0.5 + 0.2 * size, size: 2, grow: 26 + 10 * size, shape: 'flatring', color: '#ffffff' });
  bits(fx, x, y, 3 + 3 * size, () => ({ x: x + (r() - 0.5) * 6, y, vx: (r() - 0.5) * (50 + 30 * size), vy: -60 - r() * (50 + 50 * size), g: 400, drag: 0.5, life: 0.5, size: 1 + 0.4 * size, color: r() < 0.5 ? '#ffffff' : '#bfe8ff' }));
}

// ---- Other players at their life skills (world/botlife.js) ----


// A player's pose at a spot, the stove or the bench, or fishing (the same moves and tools as
// yours), blended from phase to phase on the render clock; null while they walk there.
export function botLifePose(bot, time) {
  const L = bot.life;
  if (!L || L.phase === 'walk') return null;
  let p;
  if (L.kind === 'fish') p = fishingPose(L);
  else if (L.kind === 'node') {
    const kind = LIFE_BY_KIND[L.node.look] ?? LIFE_BY_KIND[L.node.kind] ?? 'gather';
    p = { pose: LIFE_MOVES[kind] ? kind : 'gather', progress: clamp01(L.t / L.secs), dur: L.secs };
  } else p = { pose: L.kind, progress: clamp01(L.t / L.secs), dur: L.secs };
  if (!LIFE_MOVES[p.pose]) return null;
  const tr = (L.track ??= { kind: null, since: 0, last: null, from: null });
  if (p.pose !== tr.kind) {
    tr.from = tr.last && tr.last.pose !== p.pose ? { kind: tr.last.pose, progress: tr.last.progress, dur: tr.last.dur } : null;
    tr.kind = p.pose;
    tr.since = time;
  }
  tr.last = p;
  const blend = (time - tr.since) / BLEND;
  return { ...(tr.from && blend < 1 ? { ...p, from: tr.from, blend } : p), find: L.find ?? null };
}

// The beats of their moves: sparks off their rock, chips off their tree, steam off the stove, a
// splash where their line lands. `bots`: the players drawn on screen.
export function botLifeBeats(fx, world, bots, time) {
  for (const bot of bots) {
    const L = bot.life;
    if (!L || L.phase === 'walk') continue;
    const body = bot.body ?? { x: bot.x, y: groundAt(world.map, bot.x), facing: bot.facing };
    const seen = (L.seen ??= { kind: null, p: 0, phase: null });
    if (L.kind === 'fish') {
      const s = L.spot;
      if (seen.phase !== L.phase) {
        if (L.phase === 'wait') splash(fx, s.bx, s.by, 0);
        if (L.phase === 'bite') splash(fx, s.bx, s.by, 1);
        if (L.phase === 'catch') splash(fx, s.bx, s.by, 2);
      }
      seen.phase = L.phase;
      continue;
    }
    const pose = botLifePose(bot, time);
    if (!pose) continue;
    const p = pose.progress ?? 0;
    if (pose.pose !== seen.kind || p < seen.p) {
      seen.kind = pose.pose;
      seen.p = 0;
    }
    const hits = LIFE_MOVES[pose.pose]?.(Math.min(1, p), pose.dur)?.hitAt ?? [];
    const who = { body, node: L.node ?? null, at: L.at ?? null };
    hits.forEach((h, k) => {
      if (seen.p < h && p >= h) beat(fx, world, pose.pose, k, who);
    });
    seen.p = p;
  }
}
