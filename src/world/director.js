// The cutscene director: stages a scene in the world itself. A scene (data/story.js SCENES) is a
// list of steps; title cards and spoken lines show in the cutscene window (ui/cutscene.js), and
// every other step is staging that plays out on the map while the world's own clock stays
// paused (no monster moves, no buff runs out):
//
//   { cam: target, dur }          pan the camera to an actor, 'player', { x, y }, or a list of
//                                 actors (it frames them all, between them) (eased)
//   { walk: actor, to, by, gap }  walk to a place, another actor (stopping `gap` short), or by dx
//   { walk: actor, away, by }     back off `by` px from another actor (whichever side they're on)
//   { face: actor, to }           turn to face another actor, or 1 / -1
//   { jump: actor }               a little hop
//   { emote: actor, kind, dur }   an emote pops over their head: ! ? heart note sweat anger zzz
//                                 sparkle idea
//   { say: actor, text }          a speech bubble in the world, waits for a press like a line
//   { wait: secs }
//   { fade: 'out' | 'in', dur, color }   the screen to a colour and back
//   { flash: color }  { shake: strength, dur }
//   { fx: kind, at, top }         a burst: sparkle hearts petals leaves wind confetti spores notes
//                                 china (shards of a plate or cup), dust
//                                 (puffs along the floor), rubble (falling from the ceiling); `top`
//                                 bursts from the top of the actor (a tree's crown)
//   { spawn: npc, x, facing }     an NPC steps into the scene ({ spawn, at: actor, by } too)
//   { leave: actor }              they fade out of it
//   { act: monster, move, dur }   a monster in the scene moves: 'attack' (its swing, once),
//                                 'windup' (gathers and trembles, pawing), 'sway' (rocks about its
//                                 feet, eased in and out; `amp` radians)
//   { mood: monster, as }         holds a face on a monster: blink (asleep), angry, sad, happy,
//                                 hurt (null lets it go)
//   { together: [steps] }         run several at once; done when all are
//   any step with async: true     starts and lets the scene carry on at once
//
// Actors are 'player', an NPC on the map (or one spawned for the scene), or a monster on the map
// (by its id: a boss can walk, hop, turn, emote and speak in its own entrance), by id. A step naming an
// actor who isn't there is passed over, so a scene never gets stuck. When the scene ends the
// camera eases back to you, NPCs who walked go back to their places and the ones who came for the
// scene leave. Skipping (Esc) plays the rest out at once, so everyone ends where the scene puts them.

import { SCENES } from '../data/story.js';
import { groundAt } from './physics.js';

const WALK = 72;
const easeInOut = (u) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);

// A step is staging (not a card or a spoken line) when it has no card and its words, if any, are a
// bubble (`say`).
export const isStaging = (step) => Boolean(step) && !step.card && (step.text === undefined || step.say !== undefined);

export function startCine(world) {
  world.cine = { step: -1, run: null, bg: [], cam: null, view: null, fade: { a: 0 }, flash: null, shake: null, emotes: [], bursts: [], say: null, go: false, fast: false, moved: new Map(), spawned: [] };
}

// A monster on the map taking part in a scene, by its id (the first one still standing).
export function mobActor(world, who) {
  const m = world.mobs?.find((q) => q.def.id === who && q.hp > 0);
  if (m) m.cine ??= {};
  return m ?? null;
}

// Where an actor stands (feet), or null if they aren't here.
function actorAt(world, who) {
  if (who === 'player') return { x: world.body.x, y: world.body.y, h: 52 };
  const n = world.map.npcs.find((q) => q.id === who);
  if (n) return { x: n.x, y: groundAt(world.map, n.x) - (n.cine?.lift ?? 0), h: 52 };
  const m = mobActor(world, who);
  return m ? { x: m.x, y: m.y - (m.cine.lift ?? 0), h: m.def.h } : null;
}

function npcOf(world, who) {
  const n = world.map.npcs.find((q) => q.id === who);
  if (!n) return null;
  n.cine ??= {};
  if (!world.cine.moved.has(n) && !n.cine.spawned) world.cine.moved.set(n, n.x);
  return n;
}

function setFacing(world, who, dir) {
  if (who === 'player') world.body.facing = dir;
  else if (mobActor(world, who) && !world.map.npcs.some((q) => q.id === who)) mobActor(world, who).dir = dir;
  else {
    const n = npcOf(world, who);
    if (n) n.cine.facing = dir;
  }
}

// Where a camera target is, as the point the camera centres on.
function camPoint(world, target, up = 0) {
  if (up) {
    const p = camPoint(world, target);
    return p && { x: p.x, y: p.y - up };
  }
  if (Array.isArray(target)) {
    const pts = target.map((t) => camPoint(world, t)).filter(Boolean);
    if (!pts.length) return null;
    return { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: Math.max(...pts.map((p) => p.y)) };
  }
  if (target && typeof target === 'object') return { x: target.x, y: target.y ?? groundAt(world.map, target.x) - 30 };
  const a = actorAt(world, target ?? 'player');
  return a ? { x: a.x, y: a.y - 30 } : null;
}

// ---------- The steps ----------

// Each step becomes a runner: update(dt, skip) returns true once it's done.
function runner(world, step) {
  const c = world.cine;
  if (step.together) {
    const parts = step.together.map((s) => runner(world, s));
    return (dt, skip) => parts.map((p) => p(dt, skip)).every(Boolean);
  }
  if (step.cam !== undefined) {
    const to = camPoint(world, step.cam, step.up ?? 0);
    if (!to) return () => true;
    const from = c.cam ?? c.view ?? to;
    const dur = step.dur ?? 1.4;
    let t = 0;
    return (dt, skip) => {
      t = skip ? dur : t + dt;
      const u = dur <= 0 ? 1 : easeInOut(Math.min(1, t / dur));
      c.cam = { x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u };
      return t >= dur;
    };
  }
  if (step.walk) {
    const who = step.walk;
    const start = actorAt(world, who);
    if (!start) return () => true;
    let target = step.to;
    if (typeof target === 'string') {
      const other = actorAt(world, target);
      if (!other) return () => true;
      const side = Math.sign(start.x - other.x) || 1;
      target = other.x + side * (step.gap ?? 30);
    } else if (step.away) {
      const other = actorAt(world, step.away);
      if (!other) return () => true;
      target = start.x + (Math.sign(start.x - other.x) || -1) * (step.by ?? 30);
    } else if (step.by != null) target = start.x + step.by;
    if (target == null) return () => true;
    target = Math.max(10, Math.min(world.map.width - 10, target));
    const speed = step.speed ?? WALK;
    const n = who === 'player' ? null : npcOf(world, who);
    const m = who === 'player' || n ? null : mobActor(world, who);
    return (dt, skip) => {
      const x = who === 'player' ? world.body.x : n ? n.x : m.x;
      const dir = Math.sign(target - x);
      const nx = skip || Math.abs(target - x) <= speed * dt ? target : x + dir * speed * dt;
      const done = nx === target;
      if (who === 'player') {
        const b = world.body;
        b.x = nx;
        // On the floor they follow its rise and fall (never stepping off a ledge onto it).
        const g = groundAt(world.map, nx);
        if (b.onGround && !b.rope && Math.abs(g - b.y) < 24) b.y = g;
        b.vx = done ? 0 : dir * speed;
        if (dir) b.facing = dir;
      } else if (m) {
        // A monster walks in its own gait; the floor carries it.
        m.x = nx;
        m.y = groundAt(world.map, nx);
        m.state = done ? 'idle' : 'walk';
        if (dir) m.dir = dir;
      } else {
        n.x = nx;
        n.cine.walk = !done;
        if (dir) n.cine.facing = dir;
      }
      return done;
    };
  }
  if (step.face) {
    const who = step.face;
    if (!actorAt(world, who)) return () => true;
    let dir = step.to;
    if (typeof dir === 'string') {
      const other = actorAt(world, dir);
      dir = other ? Math.sign(other.x - actorAt(world, who).x) || 1 : null;
    }
    if (dir) setFacing(world, who, dir);
    return () => true;
  }
  if (step.jump) {
    const who = step.jump;
    if (!actorAt(world, who)) return () => true;
    const n = who === 'player' ? null : npcOf(world, who);
    const m = who === 'player' || n ? null : mobActor(world, who);
    const b = world.body;
    const y0 = b.y;
    let t = 0;
    const dur = 0.42;
    return (dt, skip) => {
      t = skip ? dur : t + dt;
      const u = Math.min(1, t / dur);
      const lift = Math.sin(u * Math.PI) * (step.height ?? 16);
      if (n) n.cine.lift = lift;
      else if (m) m.cine.lift = lift;
      else {
        b.y = y0 - lift;
        b.onGround = u >= 1;
        b.vy = u < 0.5 ? -60 : 60;
      }
      if (u >= 1 && !n) {
        b.y = y0;
        b.vy = 0;
      }
      return u >= 1;
    };
  }
  if (step.emote) {
    if (!actorAt(world, step.emote)) return () => true;
    const e = { who: step.emote, kind: step.kind ?? '!', t: 0, dur: step.dur ?? 1.4 };
    c.emotes = c.emotes.filter((o) => o.who !== e.who);
    c.emotes.push(e);
    // The pop is the beat; the emote stays up on its own while the scene goes on.
    let t = 0;
    return (dt, skip) => skip || (t += dt) >= (step.hold ? e.dur : 0.45);
  }
  if (step.say !== undefined) {
    if (!actorAt(world, step.say)) return () => true;
    c.say = { who: step.say, text: step.text ?? '', t: 0 };
    c.go = false;
    return (dt, skip) => {
      if (skip) {
        c.say = null;
        return true;
      }
      c.say.t += dt;
      if (!c.go) return false;
      c.go = false;
      if (c.say.t * 55 < c.say.text.length) {
        c.say.t = 99;
        return false;
      }
      c.say = null;
      return true;
    };
  }
  if (step.wait != null) {
    let t = 0;
    return (dt, skip) => skip || (t += dt) >= step.wait;
  }
  if (step.fade) {
    const to = step.fade === 'out' ? 1 : 0;
    const from = c.fade.a;
    if (step.color) c.fade.color = step.color;
    const dur = step.dur ?? 0.6;
    let t = 0;
    return (dt, skip) => {
      t = skip ? dur : t + dt;
      c.fade.a = from + (to - from) * Math.min(1, dur <= 0 ? 1 : t / dur);
      return t >= dur;
    };
  }
  if (step.flash) {
    c.flash = { color: typeof step.flash === 'string' ? step.flash : '#ffffff', a: 1 };
    return () => true;
  }
  if (step.shake != null) {
    c.shake = { amp: step.shake, left: step.dur ?? 0.5, dur: step.dur ?? 0.5 };
    // A shake holds the camera where it is, so it shakes about a still point.
    c.cam ??= c.view;
    return () => true;
  }
  if (step.fx) {
    // At an actor it bursts from about their chest (a boss's cap, a hero's heart); or at a point.
    const a = step.at && typeof step.at === 'object' ? step.at : actorAt(world, step.at ?? 'player');
    if (a) burst(c, step.fx, a.x, step.fx === 'dust' ? a.y : a.y - (a.h ? a.h * (step.top ? 0.95 : 0.7) : 0), step.n);
    return () => true;
  }
  if (step.spawn) {
    if (world.map.npcs.some((q) => q.id === step.spawn)) return () => true;
    const near = step.at ? actorAt(world, step.at) : null;
    const x = step.x ?? (near ? near.x + (step.by ?? 40) : world.body.x + 60);
    const n = { id: step.spawn, x, cine: { spawned: true, facing: step.facing ?? (world.body.x < x ? -1 : 1), alpha: 0 } };
    world.map.npcs.push(n);
    c.spawned.push(n);
    let t = 0;
    return (dt, skip) => {
      t = skip ? 0.3 : t + dt;
      n.cine.alpha = Math.min(1, t / 0.3);
      return t >= 0.3;
    };
  }
  if (step.mood !== undefined) {
    const m = mobActor(world, step.mood);
    if (m) m.cine.mood = step.as ?? null;
    return () => true;
  }
  if (step.act) {
    const m = mobActor(world, step.act);
    if (!m) return () => true;
    const dur = step.dur ?? (step.move === 'attack' ? 0.9 : 1);
    let t = 0;
    if (step.move === 'attack') m.attackAt = world.now + (c.clock ?? 0);
    return (dt, skip) => {
      t = skip ? dur : t + dt;
      const u = Math.min(1, t / dur);
      if (step.move === 'windup') m.windup = u < 1 ? dur - t : 0;
      if (step.move === 'sway') m.cine.sway = u < 1 ? Math.sin(t * (step.speed ?? 5)) * (step.amp ?? 0.1) * Math.sin(u * Math.PI) : 0;
      if (u >= 1 && step.move === 'attack') m.attackAt = -9;
      return u >= 1;
    };
  }
  if (step.leave) {
    const n = world.map.npcs.find((q) => q.id === step.leave);
    if (!n) return () => true;
    npcOf(world, step.leave);
    let t = 0;
    return (dt, skip) => {
      t = skip ? 0.4 : t + dt;
      n.cine.alpha = 1 - Math.min(1, t / 0.4);
      return t >= 0.4;
    };
  }
  return () => true;
}

// A burst of little things at a point: drawn by the cutscene window.
function burst(c, kind, x, y, n) {
  const count = n ?? (kind === 'wind' ? 10 : kind === 'confetti' ? 24 : kind === 'spores' ? 22 : kind === 'rubble' ? 16 : kind === 'notes' ? 8 : 12);
  if (kind === 'rubble' || kind === 'dust') {
    // Rubble shaken loose from the ceiling over a stretch of floor; dust kicked along the floor.
    for (let k = 0; k < count; k++) {
      const side = k % 2 ? 1 : -1;
      c.bursts.push(kind === 'rubble'
        ? { kind, x: x + (Math.random() - 0.5) * 300, y: y - 190 - Math.random() * 60, t: 0, life: 1.6, seed: Math.random() * 10, vx: (Math.random() - 0.5) * 10, vy: 20 + Math.random() * 60 }
        : { kind, x: x + side * Math.random() * 20, y: y - 2, t: 0, life: 0.8 + Math.random() * 0.5, seed: Math.random() * 10, vx: side * (30 + Math.random() * 50), vy: -6 - Math.random() * 10 });
    }
    return;
  }
  for (let k = 0; k < count; k++) {
    const a = (k / count) * Math.PI * 2 + Math.random() * 0.4;
    const sp = kind === 'wind' ? 90 + Math.random() * 40 : 30 + Math.random() * 40;
    c.bursts.push({
      kind, x, y, t: 0, life: kind === 'wind' ? 1.2 : kind === 'spores' || kind === 'notes' ? 1.6 + Math.random() * 0.8 : 1 + Math.random() * 0.6, seed: Math.random() * 10,
      vx: kind === 'wind' ? sp * (k % 2 ? 1 : -1) * 0.8 : Math.cos(a) * sp,
      vy: kind === 'wind' ? -10 + Math.random() * 20 : Math.sin(a) * sp - (kind === 'petals' || kind === 'leaves' ? 10 : 30),
    });
  }
}

// ---------- Running it ----------

// Called every tick while a scene plays (the world's own clock is paused): runs the staging step
// the scene is on, and anything running in the background.
export function tickCine(world, dt, { skip = false } = {}) {
  const sc = world.scene;
  if (!sc) return;
  world.cine ??= (startCine(world), world.cine);
  const c = world.cine;
  if (c.fast && !skip) dt *= 3;
  c.bg = c.bg.filter((r) => !r(dt, skip));
  const step = SCENES[sc.id]?.[sc.i];
  if (isStaging(step)) {
    if (c.step !== sc.i || !c.run) {
      c.step = sc.i;
      c.run = runner(world, step);
      if (step.async) {
        c.bg.push(c.run);
        c.run = null;
        nextStep(world);
        return;
      }
    }
    if (c.run(dt, skip)) {
      c.run = null;
      nextStep(world);
    }
  } else {
    c.step = sc.i;
    c.run = null;
  }
  // The scene's own clock, for its monsters' moves (the world's is paused).
  c.clock = (c.clock ?? 0) + dt;
  // A monster that had only just appeared when the scene froze the world finishes appearing.
  for (const m of world.mobs ?? []) if (m.age < 0.3) m.age = Math.min(0.3, m.age + dt);
  for (const e of c.emotes) e.t += dt;
  c.emotes = c.emotes.filter((e) => e.t < e.dur);
  for (const p of c.bursts) {
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx = p.kind === 'notes' ? Math.sin(p.t * 4 + p.seed) * 14 : p.vx * (p.kind === 'dust' ? 0.93 : 0.97);
    // Spores drift up and away; petals and leaves flutter down; the rest fall.
    p.vy = p.kind === 'notes' ? -18 : p.kind === 'china' ? p.vy + 260 * dt : p.kind === 'rubble' ? p.vy + 300 * dt : p.kind === 'dust' ? p.vy * 0.9 : p.kind === 'wind' ? p.vy * 0.95 : p.kind === 'spores' ? p.vy * 0.96 - 8 * dt : p.vy + (p.kind === 'petals' || p.kind === 'leaves' ? 14 : 60) * dt;
  }
  c.bursts = c.bursts.filter((p) => p.t < p.life);
  if (c.flash) {
    c.flash.a -= dt * 2.5;
    if (c.flash.a <= 0) c.flash = null;
  }
  if (c.shake) {
    c.shake.left -= dt;
    if (c.shake.left <= 0) c.shake = null;
  }
}

function nextStep(world) {
  const sc = world.scene;
  sc.i += 1;
  sc.t = 0;
  if (sc.i >= SCENES[sc.id].length) endScene(world);
}

// Plays the rest of the scene out at once (Esc): lines are passed, staging snaps to its end.
export function skipScene(world) {
  for (let k = 0; k < 400 && world.scene; k++) {
    const step = SCENES[world.scene.id]?.[world.scene.i];
    if (!step) {
      endScene(world);
      break;
    }
    if (isStaging(step)) tickCine(world, 0.25, { skip: true });
    else nextStep(world);
  }
  for (const r of world.cine?.bg ?? []) r(1, true);
  if (world.scene) endScene(world);
}

// The scene is over: the world gets its camera and its people back.
export function endScene(world) {
  world.scene = null;
  const c = world.cine;
  if (!c) return;
  for (const r of c.bg) r(1, true);
  for (const [n, x] of c.moved) {
    n.x = x;
    delete n.cine;
  }
  world.map.npcs = world.map.npcs.filter((n) => !c.spawned.includes(n));
  // Monsters let go of the faces and moves the scene gave them, and stay where it left them.
  for (const m of world.mobs ?? []) {
    if (!m.cine) continue;
    delete m.cine;
    m.windup = 0;
    if (m.attackAt > world.now) m.attackAt = -9;
  }
  world.body.vx = 0;
  world.cine = null;
}
