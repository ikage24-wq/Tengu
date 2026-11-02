// The Arbalist Engineer's gadgets (see data/skills.js; docs/design/arbalist.md): a bolt that sticks
// and bursts a moment later (Sticky Bolt), her string's last bolt splitting into bomblets (Cluster
// Bolt), steam vented when a hit lands on her (Steam Vent), her next few bolts loaded heavy
// (Overclock), and the little brass turret she sets down (Deploy Turret). Every hit lands like one
// of her bolts (gadgetHit in world/melee.js) and builds Pressure.
import { gadgetHit } from './melee.js';
import { procOf } from './combat.js';

// How long a sticky bolt sits before it bursts (seconds), and how far apart the bomblets land.
const STICK = 0.6;
const BOMBLET_GAP = 46;
const mid = (m) => m.y - (m.air ?? 0) - m.def.h / 2;
const near = (world, x, y, r, dy = 80) => world.mobs.filter((o) => o.hp > 0 && Math.abs(o.x - x) <= r && Math.abs(o.y - y) < dy);

// Sticky Bolt: the bolt that hit `m` (landing `delay` s from now) sticks, ticks, and bursts on
// everything within `p.r` of it.
export function stickyBurst(world, m, delay, p) {
  const at = delay + STICK;
  world.fx.push({ kind: 'aestick', mob: m, x: m.x, y: m.y, h: m.def.h, t: -delay, dur: STICK });
  world.fx.push({ kind: 'aeboom', x: m.x, y: m.y, t: -at, dur: 0.6 });
  near(world, m.x, m.y, p.r).forEach((o, k) => gadgetHit(world, o, { x: m.x, pct: p.pct, knock: 120, launch: 140, big: !k, stop: k ? 0 : 0.05, shake: k ? 0 : 2, burst: 'aehit', stack: k, key: 'procstickybolt' }, at));
}

// Cluster Bolt: a bolt that hit `m` splits into `p.n` bomblets that land in a row across it, one
// after another, each bursting on whatever stands there.
export function clusterBurst(world, m, delay, p) {
  for (let k = 0; k < p.n; k++) {
    const x = m.x + (k - (p.n - 1) / 2) * BOMBLET_GAP;
    const at = delay + 0.18 + k * 0.07;
    world.fx.push({ kind: 'aeboom', small: true, x, y: m.y, t: -at, dur: 0.5 });
    near(world, x, m.y, BOMBLET_GAP / 2 + 8).forEach((o, j) => gadgetHit(world, o, { x, pct: p.pct, knock: 80, launch: 100, stop: 0.02, shake: k === 0 && j === 0 ? 1 : 0, burst: 'aehit', stack: j, key: 'procclusterbolt' }, at));
  }
}

// Steam Vent: a hit she takes (from `fromX`) sometimes makes her machine vent: the hit is softened
// and the steam throws back the monsters close by. Returns how much of the hit it takes away (0-1).
export function ventGuard(world, fromX) {
  const p = procOf(world.char, 'steamvent');
  if (!p || world.dead || Math.random() >= p.chance) return 0;
  const b = world.body;
  world.fx.push({ kind: 'aesteam', x: b.x, y: b.y, t: 0, dur: 0.7 });
  near(world, b.x, b.y, p.r, 100).forEach((o, k) => gadgetHit(world, o, { x: b.x, pct: p.pct, knock: 240, stun: 0.3, stop: k ? 0 : 0.04, burst: 'aehit', stack: k, key: 'procsteamvent' }, 0.05));
  void fromX;
  return p.cut;
}

// Overclock: while it lasts, each of her next few bolts (`shots`) goes out as a heavy bolt that
// tears through the line, `power` times as hard (every bolt of a fan rolled into one). Returns the
// shot to loose.
export function overclocked(world, s) {
  const b = world.char.buffs?.overclock;
  if (!b || b.until <= world.now || !s.shot || s.split || s.free) return s;
  const oc = (world.overclock ??= {});
  if (oc.since !== b.since) Object.assign(oc, { since: b.since, left: b.values.shots });
  if (oc.left <= 0) return s;
  oc.left -= 1;
  if (oc.left <= 0) b.until = world.now;
  return {
    ...s, shot: 'aebig', fan: 1, pierce: true, targets: Math.max(5, s.targets ?? 1), range: (s.range ?? 300) + 80, h: Math.max(80, s.h ?? 60),
    pct: s.pct * (s.fan ?? 1) * b.values.power, speed: 1100, knock: 260, launch: Math.max(120, s.launch ?? 0), big: true, stop: 0.08, shake: 3, muzzle: 'aesteam',
  };
}

// Deploy Turret: she sets a little brass turret down in front of her (`p`: duration, pct, every,
// range). It turns to the nearest monster in reach and fires a bolt at it every `every` seconds
// until its time is up or she leaves the map; a new one replaces the old.
export function deployTurret(world, p) {
  const b = world.body;
  if (world.turret) world.fx.push({ kind: 'aesteam', x: world.turret.x, y: world.turret.y, t: 0, dur: 0.6 });
  world.turret = { map: world.map.id, x: b.x + b.facing * 40, y: b.y, dir: b.facing, until: world.now + p.duration, next: world.now + 0.5, pct: p.pct, every: p.every, range: p.range, firedAt: -9, since: world.now };
  world.fx.push({ kind: 'aesteam', x: world.turret.x, y: world.turret.y, t: 0, dur: 0.6 });
}

// Every tick: the turret turning and firing, and packing itself away when its time is up.
export function tickEngineer(world) {
  const tr = world.turret;
  if (!tr) return;
  if (tr.map !== world.map.id || world.now >= tr.until || world.dead) {
    if (tr.map === world.map.id) world.fx.push({ kind: 'aesteam', x: tr.x, y: tr.y, t: 0, dur: 0.6 });
    world.turret = null;
    return;
  }
  if (world.now < tr.next) return;
  const m = near(world, tr.x, tr.y, tr.range, 140).sort((a, c) => Math.abs(a.x - tr.x) - Math.abs(c.x - tr.x))[0];
  if (!m) {
    tr.next = world.now + 0.2;
    return;
  }
  tr.next = world.now + tr.every;
  tr.dir = Math.sign(m.x - tr.x) || tr.dir;
  tr.firedAt = world.now;
  const ox = tr.x + tr.dir * 22;
  const oy = tr.y - 20;
  const travel = Math.max(0.06, Math.hypot(m.x - ox, mid(m) - oy) / 900);
  world.fx.push({ kind: 'projectile', weapon: 'crossbow', shot: 'aebolt', x: ox, y: oy, tx: m.x, ty: mid(m), mob: m, t: 0, dur: travel });
  gadgetHit(world, m, { x: tr.x, pct: tr.pct, knock: 40, burst: 'aehit', gauge: 1, key: 'procturret' }, travel);
}
