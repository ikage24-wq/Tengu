// A Mochi to bring home (data/story.js `story_1_baby`): one little Mochi was too small to blow far on
// festival night, and hides in Petal Meadow. Walk up to it and press Up, and it decides you're all
// right and follows you - across maps, waddling after you, hopping up when you climb - until you
// bring it to its empty cushion in Sprout Village. There it climbs on, curls up and goes to sleep
// (the scene `baby_home`), and it sleeps there from then on.
//
// Its quest's two objectives are visits that this marks off itself (`escort: true`: core/quests.js
// leaves those alone): finding it, and getting it home.

import { rollMochi } from '../data/mochi-genes.js';
import { groundAt } from './physics.js';
import { questState } from '../core/quests.js';
import { playScene } from './story.js';

export const ESCORTS = {
  story_1_baby: {
    seed: 12, name: 'Little Mochi', color: '#ffb3cf',
    // Behind a bush in the meadow's quiet east corner, just short of the lily pond.
    hide: { map: 'meadow1', x: 1290 },
    // Its cushion, by Mira's stall.
    home: { map: 'sprout', x: 372 },
  },
};

const genesOf = (e) => {
  e.genes ??= rollMochi(e.seed);
  return e.genes;
};
const stateOf = (world, id) => {
  const rec = world.char.quests?.[id];
  if (!rec) return null;
  if (rec.state === 'done' || questState(world.char, id) === 'ready') return 'home';
  if (rec.state !== 'active') return null;
  return rec.marks?.[0] ? 'following' : 'hiding';
};

// On every map: whether the little Mochi is here, and how (hiding, at your heels, or asleep at home).
export function escortOnMap(world) {
  world.escort = null;
  for (const [id, e] of Object.entries(ESCORTS)) {
    const st = stateOf(world, id);
    if (!st) continue;
    const m = { genes: genesOf(e), dir: 1, speed: 0, dist: 0, size: 'baby', runPoints: 300, easy: true, noIdle: true };
    if (st === 'hiding' && world.map.id === e.hide.map) world.escort = { id, e, phase: 'hiding', x: e.hide.x, y: groundAt(world.map, e.hide.x), m, lift: 0, t: 0 };
    else if (st === 'following') world.escort = { id, e, phase: 'following', x: world.body.x - 24, y: world.body.y, m, lift: 0, t: 0 };
    else if (st === 'home' && world.map.id === e.home.map) {
      world.escort = { id, e, phase: 'home', x: e.home.x, y: groundAt(world.map, e.home.x), m, lift: 0, t: 0 };
      m.action = { name: 'nap', t0: null, hold: 1e6 };
    }
  }
}

// Up beside it while it hides: it peeks at you, decides, and follows.
export function escortInteract(world) {
  const s = world.escort;
  if (!s || s.phase !== 'hiding' || Math.abs(s.x - world.body.x) > 28 || Math.abs(s.y - world.body.y) > 10) return false;
  const rec = world.char.quests[s.id];
  (rec.marks ??= {})[0] = true;
  s.phase = 'following';
  s.found = world.now;
  world.fx.push({ kind: 'hearts', x: s.x, y: s.y - 20, t: 0, dur: 0.8 });
  world.juice.push({ type: 'mochiVoice', style: s.m.genes.voice?.style ?? 'chirp', pitch: (s.m.genes.voice?.pitch ?? 1) * 1.1, mood: 'happy', x: s.x });
  world.log('The little Mochi peeks out... and decides to follow you!', '#ffc2d4');
  return true;
}

// Every tick: it waddles after you (a little behind, the side you came from), hops up to you when you
// climb, and at its cushion it goes home.
export function updateEscort(world, dt) {
  const s = world.escort;
  if (!s) return;
  s.t += dt;
  // (Home from its scene: asleep on its cushion now.)
  if (s.phase === 'arriving' && !world.scene) {
    escortOnMap(world);
    return;
  }
  if (s.phase === 'hiding' || s.phase === 'home' || s.phase === 'arriving') {
    s.m.speed = 0;
    return;
  }
  const b = world.body;
  const goal = b.x - (b.facing || 1) * 22;
  const dx = goal - s.x;
  // Walking pace: brisker the further behind it is, easing in and out.
  const want = Math.abs(dx) < 3 ? 0 : Math.min(150, 30 + Math.abs(dx) * 2.2);
  s.v = (s.v ?? 0) + (want - (s.v ?? 0)) * Math.min(1, dt * 6);
  const step = Math.sign(dx) * Math.min(Math.abs(dx), s.v * dt);
  s.x += step;
  s.m.dist += Math.abs(step);
  s.m.speed = s.v > 4 ? s.v : 0;
  if (Math.abs(dx) > 1) s.m.dir = Math.sign(dx);
  // Its feet on the floor under it, or up with you: a hop when you've gone up or down a ledge.
  const floor = groundAt(world.map, s.x);
  const target = Math.abs(floor - b.y) < 6 || !b.onGround ? floor : b.y;
  if (Math.abs(target - s.y) > 4 && !s.hop) s.hop = { from: s.y, to: target, t: 0 };
  if (s.hop) {
    s.hop.t += dt / 0.4;
    const u = Math.min(1, s.hop.t);
    s.y = s.hop.from + (s.hop.to - s.hop.from) * u;
    s.lift = Math.sin(u * Math.PI) * 14;
    if (u >= 1) {
      s.hop = null;
      s.lift = 0;
    }
  } else s.y = target;
  // (Left far behind - a door, a fall - it catches up.)
  if (Math.abs(s.x - b.x) > 260) {
    s.x = b.x - (b.facing || 1) * 30;
    s.y = b.y;
  }
  // Home: at its cushion it climbs on and goes to sleep.
  if (world.map.id === s.e.home.map && Math.abs(b.x - s.e.home.x) < 40 && Math.abs(s.x - s.e.home.x) < 60 && !world.scene) {
    const rec = world.char.quests[s.id];
    (rec.marks ??= {})[1] = true;
    s.phase = 'arriving';
    playScene(world, 'baby_home');
  }
}
