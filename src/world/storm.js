// The Stormcaller's lightning (see data/skills.js): bolts that jump on from monster to monster
// (Arc Bolt, and one more jump while Supercharged), charged ground left where a bolt lands that
// zaps whatever stands on it (Static Field), and lightning called down from the sky on the
// farthest monster in front of her (Thunderclap). Every hit lands like one of her shots
// (stormHit in world/melee.js) and builds Charge. Her late skills, her buff and her finisher are
// at the end: Lightning Rod, Eye of the Storm, Overcharge and Thunderhead.
import { stormHit, supercharged } from './melee.js';
import { procOf } from './combat.js';
import { skillAt } from '../data/skills.js';

// How far lightning jumps from one monster to the next (px across, and up or down).
const JUMP = { x: 170, y: 90 };
// The beat between one jump and the next (seconds).
const HOP = 0.06;
// A jump's share of the bolt's power when only Supercharged makes it jump (no Arc Bolt).
const SUPER_PCT = 60;
// How often charged ground zaps what's on it (seconds), and how high it reaches.
const FIELD_EVERY = 0.5;
const FIELD_H = 50;
// Thunderclap's bolt lands this long after it's called.
const CLAP_AT = 0.18;

const mid = (m) => m.y - (m.air ?? 0) - m.def.h / 2;

// A bolt that hit `m` (`delay` seconds from now) jumps on to the `jumps` monsters nearest it, one
// after another, each from the last.
export function chainArc(world, s, m, delay, jumps, element = null) {
  const hit = new Set([m]);
  let from = m;
  let at = delay;
  const pct = (s.pct * (s.arc?.pct ?? SUPER_PCT)) / 100;
  for (let j = 0; j < jumps; j++) {
    const next = world.mobs
      .filter((o) => !hit.has(o) && o.hp > 0 && Math.abs(o.x - from.x) <= JUMP.x && Math.abs(mid(o) - mid(from)) <= JUMP.y)
      .sort((a, b) => Math.abs(a.x - from.x) - Math.abs(b.x - from.x))[0];
    if (!next) return;
    hit.add(next);
    at += HOP;
    world.fx.push({ kind: 'chainarc', x: from.x, y: mid(from), tx: next.x, ty: mid(next), t: -at, dur: 0.26, seed: Math.random() });
    stormHit(world, next, { x: from.x, pct, knock: 50, stack: j + 1, key: 'procarcbolt' }, at, element);
    from = next;
  }
}

// The ground under a monster a bolt hit is charged (`f`: { secs, pct, r }) from when it lands.
export function staticField(world, m, delay, f) {
  (world.fields ??= []).push({ x: m.x, y: m.y, from: world.now + delay, next: world.now + delay, until: world.now + delay + f.secs, r: f.r, pct: f.pct });
  world.fx.push({ kind: 'staticfield', x: m.x, y: m.y, r: f.r, t: -delay, dur: f.secs, seed: Math.random() });
}

// Lightning called down on monster `m`: it strikes a moment later, catching everything close
// round it, throwing them up and stunning them (`c`: { pct, stun, r }).
export function thunderclap(world, m, c) {
  const x = m.x;
  const y = m.y;
  world.fx.push({ kind: 'zapstrike', x, y, t: 0, dur: 0.6 });
  world.mobs
    .filter((o) => o.hp > 0 && Math.abs(o.x - x) <= c.r && Math.abs(o.y - y) < 80)
    .forEach((o, k) => stormHit(world, o, { x, pct: c.pct, stun: c.stun, knock: 60, launch: 220, big: !k, stop: k ? 0 : 0.07, shake: k ? 0 : 3, burst: 'stormhit', gauge: 5, stack: k, key: 'procthunderclap' }, CLAP_AT));
}

// Every tick: the cloud and the finisher's storm, and charged ground zapping whatever stands on
// it, and running out.
export function tickStorm(world) {
  eyeOfStorm(world);
  thunderhead(world);
  if (!world.fields?.length) return;
  world.fields = world.fields.filter((f) => f.until > world.now);
  for (const f of world.fields) {
    if (world.now < f.next) continue;
    f.next += FIELD_EVERY;
    world.mobs
      .filter((m) => m.hp > 0 && Math.abs(m.x - f.x) <= f.r && Math.abs(m.y - f.y) < FIELD_H)
      .forEach((m, k) => stormHit(world, m, { x: f.x, pct: f.pct, knock: 0, gauge: 1, stack: k, key: 'procstaticfield' }));
  }
}

// ---------- Her late skills, her buff and her finisher ----------

// Lightning Rod: a hit she takes (from `fromX`) is softened, and its shock arcs back into the
// monster that hit her. Returns how much of the hit it takes away (0-1).
export function rodGuard(world, fromX) {
  const p = procOf(world.char, 'lightningrod');
  if (!p || world.dead) return 0;
  const b = world.body;
  const x = fromX ?? b.x;
  const m = world.mobs
    .filter((o) => o.hp > 0 && Math.abs(o.x - x) < 120 && Math.abs(o.y - b.y) < 120)
    .sort((a, c) => Math.abs(a.x - x) - Math.abs(c.x - x))[0];
  if (m) {
    world.fx.push({ kind: 'chainarc', x: b.x, y: b.y - b.h / 2, tx: m.x, ty: mid(m), t: 0, dur: 0.3, seed: Math.random() });
    stormHit(world, m, { x: b.x, pct: p.pct, knock: 140, stun: 0.3, burst: 'stormhit', key: 'proclightningrod' }, 0.05);
  }
  return p.cut;
}

// Overcharge: while it lasts, each of her next few bolts (`shots`) goes out as a massive bolt of
// lightning that tears through the whole line, `power` times as hard (every bolt of a fan rolled
// into one). Returns the shot to loose.
export function overcharged(world, s) {
  const b = world.char.buffs?.overcharge;
  if (!b || b.until <= world.now || !s.shot || s.split || s.free) return s;
  const oc = (world.overcharge ??= {});
  if (oc.since !== b.since) Object.assign(oc, { since: b.since, left: b.values.shots });
  if (oc.left <= 0) return s;
  oc.left -= 1;
  if (oc.left <= 0) b.until = world.now;
  return {
    ...s, shot: 'megabolt', fan: 1, pierce: true, targets: Math.max(5, s.targets ?? 1), range: (s.range ?? 300) + 80, h: Math.max(80, s.h ?? 60),
    pct: s.pct * (s.fan ?? 1) * b.values.power, speed: 1200, knock: 260, launch: Math.max(120, s.launch ?? 0), big: true, stop: 0.08, shake: 3, muzzle: 'stormspark',
  };
}

// Lightning from the sky onto (x, y): the strike, and a hit on every monster close round it.
function skyStrike(world, x, y, f) {
  world.fx.push({ kind: f.giant ? 'gigabolt' : 'zapstrike', x, y, t: 0, dur: f.giant ? 0.9 : 0.6 });
  world.mobs
    .filter((o) => o.hp > 0 && Math.abs(o.x - x) <= f.r && Math.abs(o.y - y) < (f.giant ? 260 : 80))
    .forEach((o, k) => stormHit(world, o, { x, pct: f.pct, stun: f.stun, knock: f.knock ?? 60, launch: f.launch ?? 220, big: !k, stop: k ? 0 : f.stop ?? 0.06, shake: k ? 0 : f.shake ?? 2, burst: 'stormhit', gauge: f.gauge ?? 2, stack: k, key: f.key }, f.at ?? CLAP_AT));
}

// The monsters on screen around her (about half a screen either way).
const SCREEN = 340;
const onScreen = (world) => world.mobs.filter((m) => m.hp > 0 && Math.abs(m.x - world.body.x) <= SCREEN && Math.abs(m.y - world.body.y) < 260);

// Eye of the Storm: while she's Supercharged, a storm cloud hangs over her head, and every so
// often lightning drops out of it onto a monster near her.
function eyeOfStorm(world) {
  const p = procOf(world.char, 'eyeofstorm');
  const on = Boolean(p) && supercharged(world) && !world.dead;
  const b = world.body;
  if (!on) {
    if (world.cloud) {
      world.cloud.dur = world.cloud.t + 0.4;
      world.cloud = null;
    }
    return;
  }
  if (!world.cloud || !world.fx.includes(world.cloud)) {
    world.cloud = { kind: 'stormcloud', x: b.x, y: b.y, t: 0, dur: 1e9 };
    world.fx.push(world.cloud);
    world.eyeAt = world.now + 0.4;
  }
  Object.assign(world.cloud, { x: b.x, y: b.y });
  if (world.now < (world.eyeAt ?? 0)) return;
  world.eyeAt = world.now + p.every;
  const near = world.mobs.filter((m) => m.hp > 0 && Math.abs(m.x - b.x) <= p.r && Math.abs(m.y - b.y) < 150);
  if (!near.length) return;
  const m = near[Math.floor(Math.random() * near.length)];
  skyStrike(world, m.x, m.y, { pct: p.pct, r: 40, launch: 120, knock: 40, gauge: 1, stop: 0.03, shake: 1, at: 0.06, key: 'proceyeofstorm' });
}

// Thunderhead (the finisher): she fires a bolt into the sky, the storm breaks over the whole
// screen, lightning crashes down on the monsters again and again, then one giant bolt hits
// everything on the screen. When the sky darkens, when the first strike lands, the beat
// between strikes, and the held breath before the giant bolt (seconds).
const HEAD = { sky: 0.3, first: 0.6, gap: 0.2, pause: 0.35 };
function thunderhead(world) {
  const sig = world.fx.find((f) => f.kind === 'thunderhead' && !f.taken);
  if (sig) {
    sig.taken = true;
    const b = world.body;
    const p = skillAt('thunderhead', world.char.skills.thunderhead ?? 1);
    world.fx.push({ kind: 'skybolt', x: b.x + b.facing * 6, y: b.y - 30, t: 0, dur: 0.4 });
    world.thunder = { t0: world.now, p, n: 0, sky: false };
  }
  const T = world.thunder;
  if (!T) return;
  const t = world.now - T.t0;
  const b = world.body;
  const end = HEAD.first + T.p.strikes * HEAD.gap + HEAD.pause;
  if (!T.sky && t >= HEAD.sky) {
    T.sky = true;
    world.fx.push({ kind: 'stormsky', x: b.x, y: b.y, t: 0, dur: end - HEAD.sky + 1.2 });
    world.juice.push({ type: 'shake', mag: 2, dur: 0.3 });
  }
  while (T.n < T.p.strikes && t >= HEAD.first + T.n * HEAD.gap) {
    T.n += 1;
    const list = onScreen(world);
    const m = list[Math.floor(Math.random() * list.length)];
    const x = m ? m.x : b.x + (Math.random() - 0.5) * SCREEN * 1.6;
    skyStrike(world, x, m ? m.y : b.y, { pct: T.p.pct, r: 50, stun: 0.3, launch: 180, gauge: 0, key: 'thunderhead' });
  }
  if (t >= end) {
    const list = onScreen(world);
    const x = list.length ? list.reduce((a, m) => a + m.x, 0) / list.length : b.x + b.facing * 120;
    skyStrike(world, x, b.y, { giant: true, pct: T.p.big, r: SCREEN * 2, launch: 380, knock: 220, stop: 0.1, shake: 6, gauge: 0, at: 0.12, key: 'thunderhead' });
    world.thunder = null;
  }
}
