// A cutscene's own cast and sets (world/director.js runs them; render/cast.js draws them).
//
// The cast is people and things that exist only for a scene: Hayate herself (sitting up in her
// bed or at her kotatsu, in her hoodie or crowned), the Mochi (peeking, waddling, cheering,
// carrying), a crown being carried and set on a head. Every ordinary step works on them by their
// id (cam, walk, face, jump, emote, say, fx, leave), and they have steps of their own:
//
//   { cast: id, kind, x, y, ... }  someone steps into the scene: kind 'hayate' (seat 'bed' or
//                                  'kotatsu', human, crown, sprout, hidden), 'mochi' (seed, size,
//                                  name, behind: drawn behind the bed's covers, clipY: hidden below
//                                  that line, sink: starts that far down out of sight, idles: the
//                                  idle moments that suit its part, taken in turn - with none it
//                                  only breathes and blinks between the moves the scene gives it,
//                                  never a garden Mochi's backflips and boxing), 'crown'
//   { show: id, dur }  { hide: id, dur }   fade them in or out where they stand
//   { peek: id, dur }              rise up from where they were sunk (from behind the covers)
//   { pose: id | [ids], as }       a Mochi's pose: 'idle', 'cheer'
//   { carry: 'crown', by: [ids] }  the crown rides over its carriers' heads as they walk
//   { crown: 'hayate', dur, tilt } the crown flies in an arc onto her head and lands (crooked, by
//                                  `tilt`), then wobbles almost straight (`rest`)
//   { sprout: 'hayate' }           the gold sprout comes up out of her hair
//   { slump: id, to, dur }         she leans forward (radians) over the table, from the hips
//   { flag: name, as }             a set's own moving parts take a cue (the phone buzzes; the
//                                  time it was given is kept as `<name>At`, for a falling star)
//   { blow: id | [ids], to, dur }  they are blown away like dandelion fluff: up and off to `to`,
//                                  bobbing and tumbling, fading as they go (then gone)
//   { play: id | [ids], as, hold } a Mochi plays one of its own moves (render/mochi-anim.js: sniff,
//                                  hungry, chestbeat, count, cheer, bow, talk...; `hold` loops it)
//   { dress: id, wear }            a Mochi's clothes change (data/mochi-wardrobe.js slots; null
//                                  takes a piece off: an elder's beard falling off)
//   { duck: id, by, dur }          they duck down out of sight behind the covers (peek brings them up)
//   { toss: id, to, dur, height }  a thing flies in an arc to a place or an actor, spinning
//   { mood: id, as }               Hayate's face (shock, sad, excited...; null: asleep again)
//   { sound: name, at }            a sound plays (audio/recipes.js; at an actor, panned to them)
//   { music: key | null }          the scene's own music (a track or song key), or none
//   { amb: place | null }          the scene's own place sound (audio/ambience.js), or the map's
//
// A Mochi of the cast who speaks gestures as it talks and is heard in its own voice
// (world/mochi-voice.js), and squeaks when an emote pops over it.
//
// A set is a room off every road that a scene cuts to: { set: 'pr_flat' } puts the scene there
// (the hero waits off stage; the map, its monsters and its drops are put by), { set: null } comes
// back. A scene that ends on a set comes back on its own.

import { getMap } from '../data/maps.js';
import { createBody } from './physics.js';
import { rollMochi } from '../data/mochi-genes.js';
import { easedPace } from './pace.js';
import { SCENES } from '../data/story.js';

const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);
const HEIGHT = { hayate: 46, mochi: 30, crown: 10, beard: 8, hero: 46, gust: 10, mob: 110 };

export const castOf = (world, id) => (typeof id === 'string' ? world.cine?.cast?.find((a) => a.id === id) ?? null : null);

// Where a cast member stands, as the director's actors do: feet, and how tall they stand.
export function castAt(world, id) {
  const a = castOf(world, id);
  if (!a) return null;
  return { x: a.x, y: a.y - (a.lift ?? 0), h: a.h };
}
// Where someone a cast member walks to, turns to or away from stands: another of the cast, you, or a
// monster on the map (the Queen sleepwalking up to Queen Bonbon, Chapter 8).
function spotOf(world, id) {
  const c = castAt(world, id);
  if (c) return c;
  if (id === 'player') return { x: world.body.x };
  const m = world.mobs?.find((q) => q.def.id === id);
  return m ? { x: m.x } : null;
}

// ---------- Sets ----------

export function enterSet(world, id) {
  const c = world.cine;
  c.home ??= { map: world.map, body: world.body, mobs: world.mobs, drops: world.drops };
  world.map = getMap(id);
  world.mobs = [];
  world.drops = [];
  // (The fight's last numbers, held still under the scene, don't follow it onto the set.)
  if (world.numbers) world.numbers.length = 0;
  // The hero waits off stage while the scene is somewhere they aren't.
  world.body = createBody(-400, world.map.groundY ?? 344);
  c.cast = [];
  c.flags = {};
  c.cam = null;
  c.view = { x: world.map.width / 2, y: 200 };
  // (The room's own moving parts take the scene's cues from here: render/prologue.js.)
  world.map.cine = c;
  world.events.push({ type: 'map', mapId: world.map.id, set: true });
}

export function leaveSet(world) {
  const c = world.cine;
  world.map.castOn = false;
  if (!c?.home) return;
  delete world.map.cine;
  world.map = c.home.map;
  world.body = c.home.body;
  world.mobs = c.home.mobs;
  world.drops = c.home.drops;
  c.home = null;
  c.cast = [];
  c.flags = {};
  c.cam = null;
  c.zoom = 1;
  world.events.push({ type: 'map', mapId: world.map.id, set: true });
}

// ---------- The steps ----------

function addCast(world, step) {
  const c = world.cine;
  // (The room's own people step aside while the scene's cast plays them: render/prologue.js.)
  world.map.castOn = true;
  c.cast = c.cast.filter((a) => a.id !== step.cast);
  const kind = step.kind ?? 'mochi';
  // (`near: 'gnarlroot', dx`: beside a monster on the map, on the side it faces: Elder Yomogi in
  // Gnarlroot's roots.)
  if (step.near) {
    const m = world.mobs.find((q) => q.def.id === step.near);
    // (`inward`: that far from it on the side toward the middle of the room, facing it, so they're
    // always on the map wherever the fight has pushed it.)
    const side = !m ? 1 : step.inward != null ? Math.sign(world.map.width / 2 - m.x) || 1 : (m.heading ?? m.dir) < 0 ? -1 : 1;
    if (m) step = { ...step, x: m.x + side * (step.inward ?? step.dx ?? 0), y: m.y, ...(step.inward != null ? { facing: -side } : {}) };
  }
  const a = {
    // (`x: 'escort'`: where the little Mochi you've brought home is standing: world/escort.js.)
    id: step.cast, kind, x: step.x === 'escort' ? world.escort?.x ?? 320 : step.x ?? 320, y: step.y === 'escort' ? world.escort?.y ?? world.map.groundY : step.y ?? world.map.groundY ?? 344, facing: step.facing ?? 1,
    alpha: step.hidden ? 0 : 1, lift: 0, sink: step.sink ?? 0, tilt: 0, h: step.h ?? HEIGHT[kind] ?? 30,
    name: step.name ?? null, color: step.color ?? null, behind: Boolean(step.behind), clipY: step.clipY ?? null, pose: step.pose ?? 'idle',
    mob: step.mob ?? null, seat: step.seat ?? null, sleepwalk: Boolean(step.sleepwalk), human: Boolean(step.human), crown: step.crown ?? false, sprout: step.sprout ?? false, sproutT: step.sprout ? 1 : 0, awake: Boolean(step.awake),
  };
  // (A scene's Mochi walk upright at an easy trot: with no running in them a Mochi crawls.)
  if (kind === 'mochi') {
    const genes = rollMochi(step.seed ?? 1, step.genes ?? {});
    // (Dressed for their part: data/mochi-wardrobe.js.)
    if (step.wear) genes.wear = { ...step.wear };
    a.m = { genes, dir: a.facing, speed: 0, dist: 0, size: step.size ?? 'baby', runPoints: 300, easy: true };
    // (In a scene a Mochi acts its part: only the idle moments the scene lists for it, if any.)
    if (step.idles?.length) a.m.idleBits = step.idles;
    else a.m.noIdle = true;
    // (Each on its own clock, so a crowd never bobs, blinks and cheers in lockstep.)
    a.phase = [...step.cast].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 997, 7) / 997 * 0.6;
  }
  c.cast.push(a);
}

// Runs one of the cast's own steps, or an ordinary step aimed at a cast member; null for anything
// else (the director runs those).
export function castStep(world, step) {
  const c = world.cine;
  c.cast ??= [];
  if (step.set !== undefined) {
    if (step.set) {
      if (c.home) delete world.map.cine;
      enterSet(world, step.set);
    }
    else leaveSet(world);
    return () => true;
  }
  if (step.cast) {
    addCast(world, step);
    return () => true;
  }
  if (step.sound) {
    const at = step.at ? castAt(world, step.at) ?? (typeof step.at === 'object' ? step.at : null) : null;
    world.juice.push({ type: 'scene', name: step.sound, x: at?.x ?? null });
    return () => true;
  }
  if (step.music !== undefined) {
    c.music = step.music;
    return () => true;
  }
  if (step.amb !== undefined) {
    c.amb = step.amb;
    return () => true;
  }
  if (step.flag) {
    c.flags = { ...c.flags, [step.flag]: step.as ?? true, [`${step.flag}At`]: performance.now() / 1000 };
    return () => true;
  }
  if (step.blow) {
    const who = [step.blow].flat().map((id) => castOf(world, id)).filter(Boolean);
    const to = step.to ?? { x: 60, y: 140 };
    const dur = step.dur ?? 2.4;
    const from = who.map((a) => ({ a, x: a.x, y: a.y - (a.lift ?? 0), k: Math.random() * 6 }));
    for (const a of who) {
      a.behind = false;
      a.clipY = null;
      a.sink = 0;
      if (a.m) a.m.action = { name: 'flaps', t0: null, hold: dur };
    }
    let t = 0;
    return (dt, skip) => {
      t = skip ? dur : t + dt;
      for (const f of from) {
        const u = Math.min(1, Math.max(0, (t - f.k * 0.06) / dur));
        const e = u * u * (3 - 2 * u);
        f.a.x = f.x + (to.x - f.x) * e + Math.sin(u * 9 + f.k) * 10 * Math.sin(u * Math.PI);
        f.a.y = f.y + (to.y - f.y) * e;
        f.a.lift = Math.sin(u * Math.PI) * 30;
        f.a.tilt = Math.sin(u * 7 + f.k) * 0.35;
        f.a.alpha = 1 - Math.max(0, (u - 0.6) / 0.4);
      }
      if (t >= dur + 0.4) {
        world.cine.cast = world.cine.cast.filter((a) => !who.includes(a));
        return true;
      }
      return false;
    };
  }
  if (step.play) {
    for (const id of [step.play].flat()) {
      const a = castOf(world, id);
      if (a?.m) {
        a.pose = 'idle';
        a.m.action = { name: step.as, t0: null, ...(step.hold ? { hold: step.hold } : {}) };
        if (step.as === 'cheer') voice(world, a, 'happy');
      }
    }
    return () => true;
  }
  if (step.dress) {
    const a = castOf(world, step.dress);
    if (a?.m) {
      const wear = { ...(a.m.genes.wear ?? {}), ...(step.wear ?? {}) };
      for (const k of Object.keys(wear)) if (wear[k] == null) delete wear[k];
      a.m.genes = { ...a.m.genes, wear };
    }
    return () => true;
  }
  if (step.mood !== undefined && castOf(world, step.mood)) {
    castOf(world, step.mood).face = step.as ?? null;
    return () => true;
  }
  if (step.duck) {
    const a = castOf(world, step.duck);
    if (!a) return () => true;
    const from = a.sink;
    const to = step.by ?? 20;
    const dur = step.dur ?? 0.3;
    let t = 0;
    return (dt, skip) => {
      t = skip ? dur : t + dt;
      a.sink = from + (to - from) * ease(t / dur);
      return t >= dur;
    };
  }
  if (step.toss) {
    const a = castOf(world, step.toss);
    const to = typeof step.to === 'string' ? castAt(world, step.to) : step.to;
    if (!a || !to) return () => true;
    const x0 = a.x;
    const y0 = a.y - (a.lift ?? 0);
    const dur = step.dur ?? 0.7;
    const spin = step.spin ?? 0;
    let t = 0;
    a.lift = 0;
    return (dt, skip) => {
      t = skip ? dur : t + dt;
      const u = Math.min(1, t / dur);
      a.x = x0 + (to.x - x0) * u;
      // (Up and over, falling faster than it rose.)
      a.y = y0 + (to.y - y0) * u * u - Math.sin(u * Math.PI) * (step.height ?? 14);
      a.tilt = spin * u * Math.PI * 2;
      return u >= 1;
    };
  }
  if (step.pose) {
    for (const id of [step.pose].flat()) {
      const a = castOf(world, id);
      if (a) {
        a.pose = step.as ?? 'idle';
        a.poseAt = c.clock ?? 0;
      }
    }
    return () => true;
  }
  if (step.show || step.hide) {
    const a = castOf(world, step.show ?? step.hide);
    if (!a) return () => true;
    const from = a.alpha;
    const to = step.show ? 1 : 0;
    const dur = step.dur ?? 0.4;
    let t = 0;
    return (dt, skip) => {
      t = skip ? dur : t + dt;
      a.alpha = from + (to - from) * (dur > 0 ? Math.min(1, t / dur) : 1);
      return t >= dur;
    };
  }
  if (step.peek) {
    const a = castOf(world, step.peek);
    if (!a) return () => true;
    const from = a.sink;
    const dur = step.dur ?? 0.7;
    let t = 0;
    a.alpha = 1;
    return (dt, skip) => {
      t = skip ? dur : t + dt;
      a.sink = from * (1 - ease(t / dur));
      return t >= dur;
    };
  }
  if (step.slump) {
    const a = castOf(world, step.slump);
    if (!a) return () => true;
    const from = a.tilt;
    const to = step.to ?? 0;
    const dur = step.dur ?? 1.2;
    let t = 0;
    return (dt, skip) => {
      t = skip ? dur : t + dt;
      a.tilt = from + (to - from) * ease(t / dur);
      return t >= dur;
    };
  }
  if (step.carry) {
    const a = castOf(world, step.carry);
    if (a) a.carriedBy = step.by ? [step.by].flat() : null;
    return () => true;
  }
  if (step.sprout) {
    const a = castOf(world, step.sprout);
    if (!a) return () => true;
    a.sprout = true;
    a.sproutT = 0;
    const dur = step.dur ?? 0.9;
    let t = 0;
    return (dt, skip) => {
      t = skip ? dur : t + dt;
      a.sproutT = Math.min(1, t / dur);
      return t >= dur;
    };
  }
  if (step.crown) {
    // The crown flies from wherever it is to her head in a high arc, lands tipped over (`tilt`),
    // wobbles, and settles straight on her own crown's place.
    const q = castOf(world, step.crown);
    const k = castOf(world, step.from ?? 'crown');
    if (!q || !k) return () => true;
    k.carriedBy = null;
    const x0 = k.x;
    const y0 = k.y - k.lift;
    const dur = step.dur ?? 1.1;
    const tilt = step.tilt ?? 0.5;
    const settle = step.settle ?? 1.4;
    let t = 0;
    return (dt, skip) => {
      t = skip ? dur + settle : t + dt;
      const head = q.headTop ?? { x: q.x + 2, y: q.y - 44 };
      if (t < dur) {
        const u = ease(t / dur);
        k.x = x0 + (head.x - x0) * u;
        k.lift = 0;
        k.y = y0 + (head.y - y0) * u - Math.sin(u * Math.PI) * 46;
        k.tilt = Math.sin(t * 9) * 0.6 * (1 - u) + tilt * u;
        return false;
      }
      // Landed: it rides her head from here (render/cast.js pins it there), tipped, and rocks back
      // to straight like a spring coming to rest.
      // (It never quite comes straight: it stays perched a little crooked, `rest`, for the rest of
      // the scene.)
      k.alpha = 0;
      q.crown = 'prop';
      const rest = step.rest ?? 0.12;
      const s = Math.min(1, (t - dur) / settle);
      q.crownTilt = rest + (tilt - rest) * Math.exp(-4 * s) * Math.cos(s * 14) * (1 - s);
      if (s >= 1) c.cast = c.cast.filter((x) => x !== k);
      return s >= 1;
    };
  }
  // Ordinary steps aimed at a cast member.
  const who = step.walk ?? step.face ?? step.jump ?? step.leave;
  const a = castOf(world, who);
  if (!a) return null;
  if (step.walk) {
    let target = step.to;
    if (typeof target === 'string') {
      const other = spotOf(world, target);
      if (!other) return () => true;
      target = other.x + (Math.sign(a.x - other.x) || 1) * (step.gap ?? 24);
    } else if (step.away) {
      const other = spotOf(world, step.away);
      if (!other) return () => true;
      target = a.x + (Math.sign(a.x - other.x) || -1) * (step.by ?? 30);
    } else if (step.by != null) target = a.x + step.by;
    if (target == null) return () => true;
    const speed = step.speed ?? 54;
    let v = 0;
    return (dt, skip) => {
      const dir = Math.sign(target - a.x);
      v = easedPace(v, speed, Math.abs(target - a.x), dt);
      const nx = skip || Math.abs(target - a.x) <= Math.max(0.5, v * dt) ? target : a.x + dir * v * dt;
      if (a.m) {
        a.m.dist += Math.abs(nx - a.x);
        a.m.speed = nx === target ? 0 : v;
        if (dir) a.m.dir = dir;
      }
      if (dir) a.facing = dir;
      a.x = nx;
      return nx === target;
    };
  }
  if (step.face) {
    let dir = step.to;
    if (typeof dir === 'string') {
      const other = spotOf(world, dir);
      dir = other ? Math.sign(other.x - a.x) || a.facing : null;
    }
    if (dir) {
      a.facing = dir;
      if (a.m) a.m.dir = dir;
    }
    return () => true;
  }
  if (step.jump) {
    const dur = step.dur ?? 0.42;
    const height = step.height ?? 10;
    let t = 0;
    return (dt, skip) => {
      t = skip ? dur : t + dt;
      const u = Math.min(1, t / dur);
      a.lift = Math.sin(u * Math.PI) * height;
      return u >= 1;
    };
  }
  if (step.leave) {
    let t = 0;
    return (dt, skip) => {
      t = skip ? 0.4 : t + dt;
      a.alpha = 1 - Math.min(1, t / 0.4);
      if (t >= 0.4) world.cine.cast = world.cine.cast.filter((x) => x !== a);
      return t >= 0.4;
    };
  }
  return null;
}

// What a Mochi's voice sounds like for each emote and each line's mood.
const VOICE_MOOD = { '!': 'call', '?': 'call', idea: 'call', heart: 'happy', note: 'happy', sparkle: 'happy', sweat: 'sad', anger: 'sad', zzz: 'sleepy' };
const LINE_MOOD = { happy: 'happy', sad: 'sad', sleepy: 'sleepy', surprised: 'call', angry: 'sad' };

function voice(world, a, mood) {
  const g = a.m?.genes;
  if (!g) return;
  world.juice.push({ type: 'mochiVoice', style: g.voice?.style ?? 'chirp', pitch: (g.voice?.pitch ?? 1) * (a.m.size === 'grown' ? 0.9 : 1.08), mood, x: a.x });
}

// As the scene comes to a step, a Mochi who speaks it talks with its paws and its voice, and one
// an emote pops over squeaks.
function cue(world) {
  const sc = world.scene;
  const c = world.cine;
  if (!sc || c.cued === sc.i) return;
  c.cued = sc.i;
  const step = SCENES[sc.id]?.[sc.i];
  if (!step) return;
  for (const st of step.together ?? [step]) {
    const who = st.text !== undefined ? (st.say ?? st.who) : st.emote;
    const a = castOf(world, who);
    if (!a?.m || a.alpha < 0.5) continue;
    if (st.text !== undefined) {
      if (!a.m.action) a.m.action = { name: 'talk', t0: null };
      voice(world, a, LINE_MOOD[st.mood] ?? 'call');
    } else voice(world, a, VOICE_MOOD[st.kind ?? '!'] ?? 'call');
  }
}

// Every tick of a scene: its Mochi speak up, and a carried crown rides along over its carriers'
// heads.
export function tickCast(world) {
  cue(world);
  for (const a of world.cine?.cast ?? []) {
    if (!a.carriedBy?.length) continue;
    const by = a.carriedBy.map((id) => castAt(world, id)).filter(Boolean);
    if (!by.length) continue;
    a.x = by.reduce((s, p) => s + p.x, 0) / by.length;
    a.y = Math.min(...by.map((p) => p.y - p.h + 6));
    a.lift = 0;
    a.tilt = Math.sin((world.cine.clock ?? 0) * 6) * 0.08;
  }
}
