// The Spirit Mage's companion (see data/jobs.js): the Spirit Doll, a tiny paper shrine doll who
// floats at her shoulder. She's an imp: when there's nothing to fight she can't keep still (laps
// round the Spirit Mage's head, peeks down at her upside down, pokes her cheek, sticks her tongue
// out, loops in the air giggling); when monsters come she flies off to pick on the nearest one with
// her own little tricks, on her own timing:
//   Fan Slap       two smacks with a paper fan (light, a little knock)
//   Streamer Twirl a spin with her streamers whipping out, cutting everything round her
//   Bell Bonk      a big gold bell dropped on a monster's head from above (it dazes)
// She cheers with a peace sign when what she was picking on goes down, and puffs up furious when the
// Spirit Mage is hurt. She flies (no ground under her, so she never needs a path), keeps within
// LEASH of the Spirit Mage, and her hits are spells of the Spirit Mage's own magic attack
// (melee.js dollHit). render/spiritdoll.js draws her.

import { hasSpirit, dollHit } from './melee.js';

// Where she floats when idle: behind the Spirit Mage's shoulder (px behind, px over her feet).
const HOME = { x: 24, y: 34 };
// How far from the Spirit Mage she'll go after a fight (across, and up or down).
const LEASH = { x: 280, y: 150 };
const SPEED = 330; // px/s at most, flying
const THINK = 0.2; // seconds between decisions
// Her tricks: how long each lasts, when its hits land (0-1), how hard (% of a spell), and how far
// they reach. The bell is dropped from overhead: it falls for `fall` of the move before it lands.
export const TRICKS = {
  slap: { dur: 0.6, hits: [0.3, 0.55], pct: 26, reach: 46, knock: [40, 110] },
  twirl: { dur: 0.95, hits: [0.3, 0.48, 0.66], pct: 18, r: 64, knock: [15, 15, 120] },
  bonk: { dur: 0.95, hits: [0.6], pct: 50, reach: 200, stun: 0.9, knock: [30] },
};
// Rest between tricks (seconds, a random span): she's quick, but never nonstop.
const REST = [0.45, 0.85];
// How long her moods show (seconds).
const MOOD = { peace: 1.2, mad: 1.1, giggle: 0.9 };
// Her idle bits when there's nothing to fight: how long each lasts. Every few seconds she picks
// another, never the same twice in a row.
export const BITS = { orbit: 2.2, peek: 2.4, poke: 1.6, blep: 1.4, loop: 1.2, hum: 2.6 };
const BIT_GAP = [1.2, 2.6];

const alive = (m) => m && m.hp > 0;
const pick = (o, last) => {
  const keys = Object.keys(o).filter((k) => k !== last);
  return keys[Math.floor(Math.random() * keys.length)];
};

// The doll, made when she's first needed (null for anyone but a Spirit Mage). On a new map she
// pops in right beside the Spirit Mage.
export function dollOf(world) {
  if (!hasSpirit(world.char)) return (world.doll = null);
  const b = world.body;
  if (!world.doll || world.doll.map !== world.map.id) {
    world.doll = {
      map: world.map.id, x: b.x - b.facing * HOME.x, y: b.y - HOME.y, vx: 0, vy: 0, dir: b.facing, layer: 'back',
      act: null, next: 0, think: 0, target: null, mood: null, moodUntil: 0, bit: null, bitNext: world.now + 1.5, lastBit: null, hp: world.char.hp,
      bells: [], appear: world.now,
    };
  }
  return world.doll;
}

// A trick starts: she faces the monster and the trick's hits are queued.
function start(world, d, kind, m) {
  d.act = { kind, t0: world.now, dur: TRICKS[kind].dur, mob: m, done: 0, x: m.x, y: m.y };
  d.dir = Math.sign(m.x - d.x) || d.dir;
  d.bit = null;
  if (kind === 'bonk') d.bells.push({ mob: m, t0: world.now, at: world.now + TRICKS.bonk.hits[0] * TRICKS.bonk.dur, x: m.x, y: m.y });
}

// Her trick's hits as their moments come.
function strike(world, d) {
  const a = d.act;
  const T = TRICKS[a.kind];
  const p = (world.now - a.t0) / a.dur;
  while (a.done < T.hits.length && p >= T.hits[a.done]) {
    const i = a.done++;
    const last = i === T.hits.length - 1;
    if (a.kind === 'slap') {
      if (alive(a.mob) && Math.abs(a.mob.x - d.x) < T.reach + a.mob.def.w / 2 && Math.abs(a.mob.y - (d.y + 14)) < 70) {
        dollHit(world, a.mob, { pct: T.pct, x: d.x, knock: T.knock[i], launch: last ? 80 : 0, stop: last ? 0.04 : 0.02, burst: 'fanslap', big: last });
      }
    } else if (a.kind === 'twirl') {
      world.fx.push({ kind: 'dolltwirl', x: d.x, y: d.y, t: 0, dur: 0.35, big: last });
      for (const m of world.mobs) {
        if (!alive(m) || Math.abs(m.x - d.x) > T.r + m.def.w / 2 || Math.abs(m.y - (d.y + 14)) > 70) continue;
        dollHit(world, m, { pct: T.pct, x: d.x, knock: T.knock[i], launch: last ? 120 : 0, stop: 0.02, burst: 'spirithit', big: last });
      }
    }
  }
  if (p >= 1) d.act = null;
}

// The bells she dropped, landing on heads.
function tickBells(world, d) {
  d.bells = d.bells.filter((bell) => {
    if (world.now < bell.at) {
      if (alive(bell.mob)) [bell.x, bell.y] = [bell.mob.x, bell.mob.y];
      return true;
    }
    if (!bell.landed) {
      bell.landed = true;
      world.fx.push({ kind: 'bellbonk', x: bell.x, y: bell.y - (bell.mob?.def.h ?? 30), t: 0, dur: 0.8, seed: Math.random() });
      if (alive(bell.mob)) dollHit(world, bell.mob, { pct: TRICKS.bonk.pct, x: d.x, knock: TRICKS.bonk.knock[0], launch: 60, stun: TRICKS.bonk.stun, stop: 0.05, shake: 1, big: true, burst: 'spirithit', gauge: 3 });
    }
    return false;
  });
}

// The best monster to pick on: close to the Spirit Mage first (whatever is closing in on her), then
// close to the doll; only those within her leash.
function chooseTarget(world, d) {
  const b = world.body;
  let best = null;
  let score = Infinity;
  for (const m of world.mobs) {
    if (!alive(m) || Math.abs(m.x - b.x) > LEASH.x || Math.abs(m.y - b.y) > LEASH.y) continue;
    const s = Math.abs(m.x - b.x) * 0.7 + Math.abs(m.x - d.x) * 0.3 + Math.abs(m.y - b.y) * 0.5;
    if (s < score) [best, score] = [m, s];
  }
  return best;
}

// Where she wants to be: beside her target, or, with nothing to fight, at the Spirit Mage's
// shoulder or wherever her idle bit takes her.
function goal(world, d) {
  const b = world.body;
  const a = d.act;
  const m = a?.mob ?? d.target;
  if (a?.kind === 'bonk') return [d.x, d.y];
  if (alive(m)) {
    const side = Math.sign(d.x - m.x) || -b.facing;
    const reach = a?.kind === 'twirl' ? 20 : 30 + m.def.w / 2;
    return [m.x + side * reach, m.y - 18];
  }
  const hx = b.x - b.facing * HOME.x;
  const hy = b.y - HOME.y + Math.sin(world.now * 2.4) * 3;
  if (!d.bit) return [hx, hy];
  const t = (world.now - d.bit.t0) / BITS[d.bit.kind];
  switch (d.bit.kind) {
    case 'orbit': {
      // A lap round the Spirit Mage's head, passing behind her and then in front.
      const ang = -Math.PI / 2 + t * Math.PI * 2;
      return [b.x + Math.cos(ang) * 30 * -b.facing, b.y - 46 + Math.sin(ang) * 10];
    }
    case 'peek':
      // Hanging upside down over her head, peering down into her face.
      return [b.x + b.facing * 4, b.y - 64];
    case 'poke':
      // Right up beside her cheek.
      return [b.x + b.facing * 16, b.y - 30];
    case 'loop':
      return [hx, hy - 10];
    default:
      return [hx, hy];
  }
}

export function tickDoll(world, dt) {
  const d = dollOf(world);
  if (!d) return;
  const b = world.body;
  const { now } = world;
  tickBells(world, d);
  // The Spirit Mage hurt: she puffs up furious.
  if (world.char.hp < d.hp && !world.dead) [d.mood, d.moodUntil] = ['mad', now + MOOD.mad];
  d.hp = world.char.hp;
  if (d.mood && now >= d.moodUntil) d.mood = null;
  // Thinking: who to pick on.
  if (now >= d.think) {
    d.think = now + THINK;
    const had = d.target;
    if (!alive(d.target) || Math.abs(d.target.x - b.x) > LEASH.x + 40) d.target = chooseTarget(world, d);
    // What she was picking on went down: a peace sign and a giggle.
    if (had && !alive(had)) [d.mood, d.moodUntil] = ['peace', now + MOOD.peace];
  }
  if (d.act) strike(world, d);
  const m = d.target;
  // A trick, when she's close enough and rested.
  if (!d.act && alive(m) && now >= d.next && !world.dead) {
    const dx = Math.abs(m.x - d.x);
    const crowd = world.mobs.filter((o) => alive(o) && Math.abs(o.x - d.x) < TRICKS.twirl.r + 20 && Math.abs(o.y - m.y) < 60).length;
    let kind = null;
    if (dx < 40 + m.def.w / 2 && Math.abs(m.y - 18 - d.y) < 40) {
      const r = Math.random();
      kind = crowd >= 2 && r < 0.45 ? 'twirl' : r < 0.78 ? 'slap' : 'bonk';
    } else if (dx < TRICKS.bonk.reach && Math.random() < 0.02) kind = 'bonk';
    if (kind) {
      start(world, d, kind, m);
      d.next = now + TRICKS[kind].dur + REST[0] + Math.random() * (REST[1] - REST[0]);
    }
  }
  // Idle bits, once nothing's left to fight.
  if (!alive(m) && !d.act) {
    if (d.bit && now - d.bit.t0 >= BITS[d.bit.kind]) {
      d.bit = null;
      d.bitNext = now + BIT_GAP[0] + Math.random() * (BIT_GAP[1] - BIT_GAP[0]);
    }
    if (!d.bit && now >= d.bitNext && b.onGround && Math.abs(b.vx ?? 0) < 20) {
      const kind = pick(BITS, d.lastBit);
      d.bit = { kind, t0: now };
      d.lastBit = kind;
    }
  } else d.bit = null;
  // Flying there: she eases toward where she wants to be, quicker the further off, and turns to
  // face where she's going (or her target, or the way the Spirit Mage faces).
  const [gx, gy] = goal(world, d);
  const k = 1 - Math.exp(-dt * (alive(m) ? 7 : 5));
  let vx = ((gx - d.x) * k) / Math.max(dt, 1e-3);
  let vy = ((gy - d.y) * k) / Math.max(dt, 1e-3);
  const sp = Math.hypot(vx, vy);
  if (sp > SPEED) [vx, vy] = [(vx * SPEED) / sp, (vy * SPEED) / sp];
  // Too far behind (a fall, a blink): she zips back in a flash.
  if (Math.abs(b.x - d.x) > LEASH.x * 1.8 || Math.abs(b.y - d.y) > LEASH.y * 2) {
    world.fx.push({ kind: 'dollpop', x: d.x, y: d.y, t: 0, dur: 0.4 });
    [d.x, d.y, vx, vy] = [b.x - b.facing * HOME.x, b.y - HOME.y, 0, 0];
    world.fx.push({ kind: 'dollpop', x: d.x, y: d.y, t: 0, dur: 0.4 });
  }
  d.vx = vx;
  d.vy = vy;
  d.x += vx * dt;
  d.y += vy * dt;
  if (d.act) d.dir = Math.sign(d.act.mob.x - d.x) || d.dir;
  else if (alive(m)) d.dir = Math.sign(m.x - d.x) || d.dir;
  else if (d.bit?.kind === 'poke' || d.bit?.kind === 'peek') d.dir = -b.facing;
  else if (Math.abs(vx) > 30) d.dir = Math.sign(vx);
  else d.dir = b.facing;
  // In front of the Spirit Mage or behind her: behind while at her shoulder, in front when she
  // swings round in an orbit or comes up to poke her, and out in a fight.
  if (d.bit?.kind === 'orbit') d.layer = Math.sin(-Math.PI / 2 + ((now - d.bit.t0) / BITS.orbit) * Math.PI * 2) > 0 ? 'front' : 'back';
  else d.layer = alive(m) || d.bit?.kind === 'poke' || d.bit?.kind === 'peek' ? 'front' : 'back';
}
