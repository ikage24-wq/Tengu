// The Kitsune's Fox Decoy: an illusion of her in blue fox fire, set down just ahead of her. For a
// while every monster near it goes after it instead of her (world.js makes it their foe); when its
// time is up it bursts in fox fire on everything close (drawn in render/scene.js).

import { stormHit } from './melee.js';

const AHEAD = 80;
const BURST_R = 110;

export function foxDecoy(world, p) {
  const b = world.body;
  const x = Math.max(b.w / 2, Math.min(world.map.width - b.w / 2, b.x + b.facing * AHEAD));
  world.decoy = { map: world.map.id, x, y: b.y, facing: b.facing, until: world.now + p.duration, pct: p.pct, targets: p.targets, r: p.r };
  world.fx.push({ kind: 'blinkin', school: 'fox', x, y: b.y, t: 0, dur: 0.4 });
}

// What a monster chases: the decoy, if there is one near it.
export function decoyFor(world, m) {
  const d = world.decoy;
  if (!d || d.map !== world.map.id || m.def.boss) return null;
  return Math.abs(m.x - d.x) < d.r && Math.abs(m.y - d.y) < 120 ? d : null;
}

export function tickDecoy(world) {
  const d = world.decoy;
  if (!d) return;
  if (d.map !== world.map.id || world.dead) {
    world.decoy = null;
    return;
  }
  if (world.now < d.until) return;
  world.decoy = null;
  world.fx.push({ kind: 'foxtrapburst', x: d.x, y: d.y, t: 0, dur: 0.5 });
  world.juice.push({ type: 'shake', mag: 2, dur: 0.2 });
  const near = world.mobs
    .filter((m) => m.hp > 0 && Math.abs(m.x - d.x) < BURST_R && Math.abs(m.y - d.y) < 90)
    .sort((a, b) => Math.abs(a.x - d.x) - Math.abs(b.x - d.x))
    .slice(0, d.targets);
  for (const m of near) stormHit(world, m, { pct: d.pct, x: d.x, key: 'procdecoy', knock: 160, launch: 120, big: true, burst: 'foxhit', gauge: 3 });
}
