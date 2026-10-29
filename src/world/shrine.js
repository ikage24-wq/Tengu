// The Shrine Maiden's spells that outlast their dance (data/skills.js; the dance figures are in
// render/moves.js, the effects in render/spirit-fx.js):
//   Purification         a circle of sacred light on the ground round her for a while: monsters
//                        standing in it burn again and again; allies in it are mended
//   Resurrection Dance   every fallen ally nearby gets up, and Last Rite: for a while a blow that
//                        would knock her out leaves her standing instead, once
//   Thousand Torii       her finisher: a corridor of torii gates of light rises across the screen,
//                        one after another, mending everyone; her guardian (world/kitsune.js)
//                        steps out of fox fire at each gate in turn and cuts down the monsters
//                        there; the last gate up, the whole party is warded

import { dollHit, healAround } from './melee.js';
import { applyBuff } from './combat.js';
import { reviveTarget, reviveMember } from './dungeon.js';
import { navOf, surfaceBelow } from './nav.js';
import { toriiRun } from './kitsune.js';

const alive = (m) => m && m.hp > 0;

// ---------- Purification ----------
export function purify(world, s) {
  const b = world.body;
  const P = s.purify;
  world.purify = { x: b.x, y: b.y, r: P.r, until: world.now + P.dur, next: world.now + 0.15, every: P.every, pct: P.pct, heal: P.heal, key: s.key };
  world.fx.push({ kind: 'purifycircle', zone: world.purify, x: b.x, y: b.y, r: P.r, t: 0, dur: P.dur });
}
function tickPurify(world) {
  const Z = world.purify;
  if (!Z) return;
  if (world.now >= Z.until) {
    world.purify = null;
    return;
  }
  if (world.now < Z.next) return;
  Z.next = world.now + Z.every;
  for (const m of world.mobs) {
    if (!alive(m) || Math.abs(m.x - Z.x) > Z.r + m.def.w / 2 || Math.abs(m.y - Z.y) > 70) continue;
    dollHit(world, m, { pct: Z.pct, x: Z.x, knock: 0, stop: 0, burst: 'purifyburn', gauge: 1, key: Z.key });
  }
  healAround(world, Z.x, Z.y, Z.heal, Z.r);
}

// ---------- Resurrection Dance ----------
export function resurrect(world, s) {
  const R = s.revive;
  const b = world.body;
  const box = { x: b.x - R.r, y: b.y - 160, w: R.r * 2, h: 320 };
  for (let g = reviveTarget(world, box), n = 0; g && n < 8; g = reviveTarget(world, box), n++) {
    reviveMember(world, g, R.pct);
    world.fx.push({ kind: 'reviveflash', x: g.body.x, y: g.body.y, t: 0, dur: 1.1 });
  }
  applyBuff(world, 'resurrection', { duration: R.rite, buff: { lastRite: R.pct }, range: { w: R.r * 2, h: 180, around: true } });
  world.fx.push({ kind: 'resurrection', x: b.x, y: b.y, t: 0, dur: 1.6 });
}
// Last Rite: a blow that would knock her out leaves her standing instead, mended to `lastRite` of
// her max HP; once (the buff is spent). True if it saved her (world.js and dungeon.js ask).
export function lastRite(world) {
  const { char, body } = world;
  const b = char.buffs?.resurrection;
  if (!b || b.until <= world.now || !b.values?.lastRite) return false;
  delete char.buffs.resurrection;
  char.hp = Math.max(1, Math.round(world.stats.maxHp * b.values.lastRite));
  world.invuln = Math.max(world.invuln ?? 0, 1.2);
  world.fx.push({ kind: 'reviveflash', x: body.x, y: body.y, t: 0, dur: 1.1 });
  world.numbers.push({ x: body.x, y: body.y - body.h - 14, text: 'LAST RITE', color: '#ffd36a', t: 0 });
  world.log?.("Last Rite: the shrine won't let you fall.", '#ffd36a');
  return true;
}

// ---------- Thousand Torii ----------
export function thousandTorii(world, s) {
  const T = s.torii;
  const b = world.body;
  const dir = b.facing;
  const nav = navOf(world.map);
  const surf = nav.surfaces[surfaceBelow(nav, b.x, b.y)];
  // The gates stand evenly down the corridor ahead of her, on her own ledge.
  const gates = Array.from({ length: T.n }, (_, i) => {
    let x = b.x + dir * (60 + (i * T.span) / Math.max(1, T.n - 1));
    if (surf) x = Math.max(surf.x1 + 10, Math.min(surf.x2 - 10, x));
    return { x, y: surf && b.onGround ? surf.yAt(x) : b.y, at: world.now + i * T.gap };
  });
  world.torii = { t0: world.now, gates, dir, n: T.n, gap: T.gap, hold: T.hold, pct: T.pct, cut: T.cut, heal: T.heal, ward: T.ward, wardDur: T.wardDur, key: s.key, done: 0, end: world.now + T.n * T.gap + T.hold };
  world.fx.push({ kind: 'thousandtorii', torii: world.torii, x: b.x, y: b.y, t: 0, dur: T.n * T.gap + T.hold + 0.9 });
  world.juice.push({ type: 'shake', mag: 2, dur: 0.25 });
  // Her guardian goes gate to gate; with no guardian, each gate strikes for itself.
  if (!toriiRun(world, world.torii)) world.torii.selfStrike = true;
}
// One gate's cut: everything within `cut` of it (the guardian's naginata, or the gate's own light).
export function toriiCut(world, T, g) {
  world.mobs
    .filter((m) => alive(m) && Math.abs(m.x - g.x) < T.cut + m.def.w / 2 && Math.abs(m.y - g.y) < 90)
    .forEach((m, i) => dollHit(world, m, { pct: T.pct, x: g.x - T.dir * 20, knock: 160, launch: 220, stun: 0.4, stop: i ? 0 : 0.06, shake: i ? 0 : 3, big: !i, burst: 'spirithit', gauge: 0, key: T.key }));
}
function tickTorii(world) {
  const T = world.torii;
  if (!T) return;
  const b = world.body;
  while (T.done < T.gates.length && world.now >= T.gates[T.done].at) {
    const g = T.gates[T.done++];
    world.juice.push({ type: 'shake', mag: 1.2, dur: 0.1 });
    world.juice.push({ type: 'dust', x: g.x, y: g.y, count: 4 });
    // Each gate rising mends everyone a little (not Grace: it's her finisher).
    healAround(world, b.x, b.y, T.heal, 640, false);
    if (T.selfStrike) toriiCut(world, T, g);
  }
  if (T.done === T.gates.length && !T.warded) {
    T.warded = true;
    applyBuff(world, 'thousandtorii', { duration: T.wardDur, buff: { barrier: T.ward }, range: { w: 1000, h: 200, around: true } });
  }
  if (world.now >= T.end) world.torii = null;
}

export function tickShrine(world) {
  tickPurify(world);
  tickTorii(world);
}
