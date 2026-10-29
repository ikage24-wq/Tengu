// The Spirit Mage's companion (see data/jobs.js): the Spirit Doll, a tiny paper shrine doll who
// floats at her shoulder. She's an imp: when there's nothing to fight she can't keep still (laps
// round the Spirit Mage's head, peeks down at her upside down, pokes her cheek, sticks her tongue
// out, loops in the air giggling); when monsters come she flies off to pick on the nearest one with
// her own little tricks, on her own timing:
//   Fan Slap       two smacks with a paper fan (light, a little knock)
//   Streamer Twirl a spin with her streamers whipping out, cutting everything round her
//   Bell Bonk      a big gold bell dropped on a monster's head from above (it dazes)
//   Dropkick       up high behind it, then a dive feet first straight into it (it goes flying)
//   Paper Charm    a charm of spirit light flicked at it from a way off: it sticks, then pops
//   Akanbe         right up in its face, pulling an eyelid down and sticking her tongue out:
//                  it's so cross it can't move for a moment (a little hit, a long daze)
//   Rodeo          a hop up onto its head, and she rides it, bonking it with her bell on the
//                  beat (each bonk dazes it, so it can't shake her off); a last big bonk throws
//                  it into the air and she hops off cheering
// She cheers with a peace sign when what she was picking on goes down, and puffs up furious when the
// Spirit Mage is hurt. She flies (no ground under her, so she never needs a path), keeps within
// LEASH of the Spirit Mage, and her hits are spells of the Spirit Mage's own magic attack
// (melee.js dollHit). render/spiritdoll.js draws her.
//
// Her tricks are her own (the Spirit Mage never orders them). She joins in with the Spirit Mage's
// finisher, Heaven's Lantern (data/skills.js): a giant paper lantern rises over the monsters with
// the doll riding on top, cheering; its rays strike monsters on the screen one after another, each
// mending the Spirit Mage and the party, then it blazes and bursts. A Blessing or a Ward going up
// makes her cheer.

import { hasSpirit, dollHit, healAround } from './melee.js';
import { skillAt } from '../data/skills.js';

// Where she floats when idle: behind the Spirit Mage's shoulder (px behind, px over her feet).
const HOME = { x: 24, y: 34 };
// How far from the Spirit Mage she'll go after a fight (across, and up or down).
const LEASH = { x: 280, y: 150 };
const SPEED = 330; // px/s at most, flying
// How she steers: how hard she wants to close on where she's going (per second of distance), and
// how quickly her speed turns toward that (so she swoops in curves instead of snapping about).
const STEER = { fight: 6, idle: 4, dive: 13, accel: 9, diveAccel: 22 };
const THINK = 0.2; // seconds between decisions
// Her tricks: how long each lasts, when its hits land (0-1), how hard (% of a spell), and how far
// they reach. The bell is dropped from overhead: it falls for `fall` of the move before it lands.
export const TRICKS = {
  slap: { dur: 0.6, hits: [0.3, 0.55], pct: 26, reach: 46, knock: [40, 110] },
  twirl: { dur: 0.95, hits: [0.3, 0.48, 0.66], pct: 18, r: 64, knock: [15, 15, 120] },
  bonk: { dur: 0.95, hits: [0.6], pct: 50, reach: 200, stun: 0.9, knock: [30] },
  kick: { dur: 0.9, hits: [0.62], pct: 46, reach: 40, knock: [190], launch: 150 },
  charm: { dur: 0.8, hits: [0.42], pct: 40, reach: 220, fly: 0.25, stick: 0.45, knock: [60] },
  akanbe: { dur: 1.1, hits: [0.5], pct: 12, reach: 50, stun: 1.4, knock: [10] },
  ride: { bonks: 4, pct: 22, last: 60 },
};
// How fast she dives in a dropkick (px/s), past her usual flying speed.
const DIVE = 720;
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
  d.act = { kind, t0: world.now, dur: TRICKS[kind].dur, mob: m, done: 0, x: m.x, y: m.y, x0: d.x };
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
    } else if (a.kind === 'kick') {
      if (alive(a.mob) && Math.abs(a.mob.x - d.x) < T.reach + a.mob.def.w / 2 + 20 && Math.abs(a.mob.y - (d.y + 14)) < 80) {
        dollHit(world, a.mob, { pct: T.pct, x: d.x - d.dir * 10, knock: T.knock[i], launch: T.launch, stop: 0.07, shake: 2, burst: 'spirithit', big: true });
      }
    } else if (a.kind === 'charm') {
      // Flicked: it flies to the monster, sticks, and pops a moment later.
      if (alive(a.mob)) {
        const tx = a.mob.x;
        const ty = a.mob.y - a.mob.def.h * 0.6;
        world.fx.push({ kind: 'dollcharm', x: d.x + d.dir * 6, y: d.y - 18, tx, ty, mob: a.mob, fly: T.fly, t: 0, dur: T.fly + T.stick });
        dollHit(world, a.mob, { pct: T.pct, x: d.x, knock: T.knock[i], launch: 90, stop: 0.04, shake: 1, burst: 'spirithit', big: true }, T.fly + T.stick);
      }
    } else if (a.kind === 'akanbe') {
      if (alive(a.mob) && Math.abs(a.mob.x - d.x) < T.reach + a.mob.def.w / 2 + 10) {
        dollHit(world, a.mob, { pct: T.pct, x: d.x, knock: T.knock[i], stun: T.stun, stop: 0.02, burst: 'spirithit' });
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
  if (a?.kind === 'bonk' || a?.kind === 'charm') return [d.x, d.y];
  if (a?.kind === 'kick' && alive(m)) {
    // Up high behind it, then the dive: feet first, straight through where it stands.
    const side = Math.sign(a.x0 - m.x) || -1;
    const u = (world.now - a.t0) / a.dur;
    return u < 0.45 ? [m.x + side * 46, m.y - 70] : [m.x - side * 6, m.y - 14];
  }
  if (a?.kind === 'akanbe' && alive(m)) {
    // Nose to nose with it.
    const side = Math.sign(a.x0 - m.x) || -1;
    return [m.x + side * (m.def.w / 2 + 12), m.y - m.def.h * 0.75];
  }
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
  tickLantern(world, d);
  // Riding a monster (her Rodeo) or the lantern: she's carried, not flying.
  if (d.act?.kind === 'ride') return ride(world, d);
  if (world.lantern) return perch(world, d);
  // Her Spirit Mage's Blessing or Ward going up: she cheers.
  if (['blessing', 'spiritward'].some((id) => world.char.buffs?.[id]?.since === now)) [d.mood, d.moodUntil] = ['peace', now + MOOD.peace];
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
      kind = crowd >= 2 && r < 0.28 ? 'twirl' : r < 0.48 ? 'slap' : r < 0.64 ? 'kick' : r < 0.76 ? 'akanbe' : r < 0.88 ? 'ride' : 'bonk';
    } else if (dx < TRICKS.charm.reach && Math.random() < 0.03) kind = Math.random() < 0.55 ? 'charm' : 'bonk';
    if (kind === 'ride') {
      rodeo(world, d, m);
      d.next = now + d.act.dur + REST[0] + Math.random() * (REST[1] - REST[0]);
    } else if (kind) {
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
  const dive = d.act?.kind === 'kick';
  const pull = dive ? STEER.dive : alive(m) ? STEER.fight : STEER.idle;
  let wx = (gx - d.x) * pull;
  let wy = (gy - d.y) * pull;
  const want = Math.hypot(wx, wy);
  const top = dive ? DIVE : SPEED;
  if (want > top) [wx, wy] = [(wx * top) / want, (wy * top) / want];
  const turn = 1 - Math.exp(-dt * (dive ? STEER.diveAccel : STEER.accel));
  let vx = (d.vx ?? 0) + (wx - (d.vx ?? 0)) * turn;
  let vy = (d.vy ?? 0) + (wy - (d.vy ?? 0)) * turn;
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

// ---------- Rodeo: riding a monster ----------

// How long her hop up onto its head takes, the beat between bonks, and the beat after the last
// bonk before she hops off (seconds); how long each bonk dazes it.
const RIDE = { hop: 0.3, beat: 0.34, off: 0.45, daze: 0.6 };

// She hops up onto its head (an arc from where she is).
function rodeo(world, d, m) {
  const o = TRICKS.ride;
  const dur = RIDE.hop + o.bonks * RIDE.beat + RIDE.off;
  d.act = { kind: 'ride', t0: world.now, dur, mob: m, done: 0, o, from: [d.x, d.y], hits: Array.from({ length: o.bonks }, (_, i) => RIDE.hop + i * RIDE.beat + 0.2) };
  d.bit = null;
}

// Where she sits on a monster: astride the top of its head.
const seat = (m) => [m.x, m.y - (m.air ?? 0) - m.def.h + 4];

// Riding: carried on its head, bonking on the beat. If it goes down early she hops off cheering.
function ride(world, d) {
  const a = d.act;
  const m = a.mob;
  const t = world.now - a.t0;
  if (!alive(m)) a.done = a.hits.length;
  else {
    // The hop: up and over in an arc, landing astride it.
    const [sx, sy] = seat(m);
    const u = Math.min(1, t / RIDE.hop);
    const e = u * u * (3 - 2 * u);
    d.x = a.from[0] + (sx - a.from[0]) * e;
    d.y = a.from[1] + (sy - a.from[1]) * e - 26 * Math.sin(u * Math.PI);
    d.dir = u < 1 ? Math.sign(sx - a.from[0]) || d.dir : m.dir || d.dir;
  }
  d.vx = 0;
  d.vy = 0;
  d.layer = 'front';
  while (a.done < a.hits.length && t >= a.hits[a.done]) {
    const last = a.done === a.hits.length - 1;
    a.done += 1;
    world.fx.push({ kind: 'bellbonk', x: m.x, y: m.y - m.def.h, t: 0, dur: 0.6, seed: Math.random(), small: !last });
    dollHit(world, m, { pct: last ? a.o.last : a.o.pct, x: m.x - (m.dir || 1), knock: last ? 160 : 0, launch: last ? 260 : 0, stun: last ? 0.4 : RIDE.daze, stop: last ? 0.08 : 0.03, shake: last ? 3 : 0, big: last, burst: 'spirithit', gauge: 3 });
  }
  if (t >= a.dur || (!alive(m) && t >= RIDE.hop)) {
    d.act = null;
    d.next = world.now + 0.6;
    [d.mood, d.moodUntil] = ['peace', world.now + MOOD.peace];
    d.y -= 14;
  }
}

// ---------- Heaven's Lantern ----------

// When the lantern has risen, when its first ray falls, the beat between rays, and the held
// breath before it blazes (seconds); how high it hangs over the ground (px).
const LANTERN = { rise: 0.7, first: 0.9, gap: 0.24, pause: 0.45, high: 120 };
// The monsters on screen around her (about half a screen either way).
const SCREEN = 340;
const onScreen = (world) => world.mobs.filter((m) => alive(m) && Math.abs(m.x - world.body.x) <= SCREEN && Math.abs(m.y - world.body.y) < 260);

// She lifts it: it rises from over her head toward the middle of the monsters on screen.
export function raiseLantern(world, key = 'heavenslantern') {
  const b = world.body;
  const p = skillAt('heavenslantern', world.char.skills.heavenslantern ?? 1);
  const list = onScreen(world);
  const tx = list.length ? list.reduce((sum, m) => sum + m.x, 0) / list.length : b.x + b.facing * 140;
  const end = LANTERN.first + p.rays * LANTERN.gap + LANTERN.pause;
  world.lantern = { t0: world.now, p, key, n: 0, x0: b.x, x: b.x, tx, y: b.y - LANTERN.high, end };
  world.fx.push({ kind: 'heavenslantern', lantern: world.lantern, x: b.x, y: b.y, t: 0, dur: end + 0.7 });
}

function tickLantern(world, d) {
  const L = world.lantern;
  if (!L) return;
  const t = world.now - L.t0;
  const b = world.body;
  const u = Math.min(1, t / LANTERN.rise);
  const glide = u * u * (3 - 2 * u);
  L.x = L.x0 + (L.tx - L.x0) * glide + Math.sin(t * 2.2) * 6;
  L.y = b.y - LANTERN.high - 20 * glide + Math.sin(t * 1.7) * 3;
  L.rise = glide;
  while (L.n < L.p.rays && t >= LANTERN.first + L.n * LANTERN.gap) {
    L.n += 1;
    const list = onScreen(world);
    const m = list[Math.floor(Math.random() * list.length)];
    const x = m ? m.x : L.x + (Math.random() - 0.5) * 200;
    world.fx.push({ kind: 'lanternray', x, y: m ? m.y : b.y, fromX: L.x, fromY: L.y, t: 0, dur: 0.55 });
    if (m) dollHit(world, m, { pct: L.p.pct, x: L.x, knock: 30, launch: 140, stun: 0.3, stop: 0.03, shake: 1, burst: 'spirithit', gauge: 0, key: L.key });
    healAround(world, b.x, b.y, L.p.heal, 400, false);
  }
  if (t >= L.end) {
    world.fx.push({ kind: 'lanternblaze', x: L.x, y: L.y, t: 0, dur: 0.9 });
    onScreen(world).forEach((m, k) => dollHit(world, m, { pct: L.p.big, x: L.x, knock: 200, launch: 360, stop: k ? 0 : 0.1, shake: k ? 0 : 6, big: !k, burst: 'spirithit', gauge: 0, key: L.key }, 0.1));
    healAround(world, b.x, b.y, L.p.heal * 4, 400, false);
    L.gone = true;
    world.lantern = null;
    [d.mood, d.moodUntil] = ['peace', world.now + MOOD.peace * 1.5];
    d.y -= 10;
  }
}

// On top of the lantern, cheering, for as long as it hangs there.
function perch(world, d) {
  const L = world.lantern;
  d.act = null;
  d.bit = null;
  d.x = L.x;
  d.y = L.y - 30;
  d.vx = 0;
  d.vy = 0;
  d.dir = world.body.facing;
  d.layer = 'front';
  [d.mood, d.moodUntil] = ['peace', world.now + 0.3];
}
