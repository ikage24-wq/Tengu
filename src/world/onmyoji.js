// The Onmyoji's own spells (data/skills.js; her dance figures are in render/moves.js, the effects
// in render/spirit-fx.js). She binds her yokai troupe (world/oni.js, yuki.js, tengu.js) with
// talismans and the five-pointed star seal of onmyodo:
//   Ofuda Barrage   a fan of paper talismans flung from her fingers: each flies to a monster,
//                   sticks fast, and bursts a beat later in a red seal
//   Seiman Seal     she traces the five-pointed star in the air: the seal opens on the ground ahead
//                   of her for a while; monsters standing in it are bound fast and burned again
//                   and again
//   Yokai Rally     a clap and a talisman raised high: her troupe answers, fighting faster and
//                   harder for a while, and the tengu marks a monster for them at once
//   Troupe Combo    her finisher: her whole troupe in one chained attack on every monster on the
//                   screen: the yuki-onna freezes them all solid, the tengu's whirlwind lifts them
//                   high, the oni leaps up and smashes them back into the ground, and she snaps
//                   her fan shut and they shatter

import { dollHit } from './melee.js';
import { navOf, surfaceBelow } from './nav.js';

const alive = (m) => m && m.hp > 0;
// The troupe's hits (dollHit `key`s), which Yokai Rally makes stronger.
export const TROUPE = new Set(['oni', 'yuki', 'tengu']);
export const rallyPower = (world) => (world.rally?.until > world.now ? world.rally.power : 0);
const groundAt = (world, x, y) => {
  const nav = navOf(world.map);
  const surf = nav.surfaces[surfaceBelow(nav, x, y)];
  return surf ? [Math.max(surf.x1 + 10, Math.min(surf.x2 - 10, x)), surf.yAt(Math.max(surf.x1 + 10, Math.min(surf.x2 - 10, x)))] : [x, y];
};

// ---------- Ofuda Barrage ----------
export function ofudaBarrage(world, s) {
  const O = s.ofuda;
  const b = world.body;
  const dir = b.facing;
  const list = world.mobs
    .filter((m) => alive(m) && (m.x - b.x) * dir > -10 && Math.abs(m.x - b.x) < O.range && Math.abs(m.y - b.y) < 110)
    .sort((m, o) => Math.abs(m.x - b.x) - Math.abs(o.x - b.x));
  for (let i = 0; i < O.n; i++) {
    const m = list[i % Math.max(1, list.length)];
    const spread = (i - (O.n - 1) / 2) * 9;
    const tx = m ? m.x + (Math.random() - 0.5) * m.def.w * 0.5 : b.x + dir * O.range * 0.8;
    const ty = m ? m.y - m.def.h * (0.35 + Math.random() * 0.4) : b.y - 30 + spread;
    const ox = b.x + dir * 12;
    const oy = b.y - 34 + spread * 0.4;
    const fly = Math.hypot(tx - ox, ty - oy) / 420 + 0.06;
    const lag = i * 0.06;
    world.fx.push({ kind: 'ofuda', x: ox, y: oy, tx, ty, mob: m ?? null, dx: m ? tx - m.x : 0, dy: m ? ty - m.y : 0, fly, stick: O.stick, arc: spread, t: -lag, dur: fly + O.stick + 0.05, seed: Math.random() });
    if (!m) continue;
    dollHit(world, m, { pct: O.pct * 0.35, x: b.x, knock: 10, stop: 0.01, burst: 'ofudahit', gauge: 2, key: s.key }, lag + fly);
    dollHit(world, m, { pct: O.pct, x: b.x, knock: 60, stop: i ? 0 : 0.04, shake: i ? 0 : 1.5, burst: 'ofudaburst', gauge: 3, key: s.key }, lag + fly + O.stick);
  }
}

// ---------- Seiman Seal ----------
export function seimanSeal(world, s) {
  const S = s.seiman;
  const b = world.body;
  const [x, y] = groundAt(world, b.x + b.facing * S.ahead, b.y);
  world.seiman = { x, y, r: S.r, until: world.now + S.dur, next: world.now + 0.3, every: S.every, pct: S.pct, bind: S.bind, key: s.key };
  world.fx.push({ kind: 'seimanseal', zone: world.seiman, x, y, r: S.r, t: 0, dur: S.dur });
  world.juice.push({ type: 'shake', mag: 1.4, dur: 0.2 });
}
function tickSeiman(world) {
  const Z = world.seiman;
  if (!Z) return;
  if (world.now >= Z.until) {
    world.seiman = null;
    return;
  }
  if (world.now < Z.next) return;
  Z.next = world.now + Z.every;
  for (const m of world.mobs) {
    if (!alive(m) || Math.abs(m.x - Z.x) > Z.r + m.def.w / 2 || Math.abs(m.y - Z.y) > 60) continue;
    // Bound fast: held where it stands.
    dollHit(world, m, { pct: Z.pct, x: Z.x, knock: 0, stun: Z.bind, stop: 0, burst: 'seimanburn', gauge: 2, key: Z.key });
  }
}

// ---------- Yokai Rally ----------
export function yokaiRally(world, s) {
  const R = s.rally;
  const b = world.body;
  world.rally = { until: world.now + R.dur, power: R.power };
  world.fx.push({ kind: 'yokairally', x: b.x, y: b.y, t: 0, dur: 1.1 });
  // Each of the troupe answers her, at once.
  for (const k of [world.oni, world.yuki, world.tengu]) {
    if (!k?.body) continue;
    k.next = Math.min(k.next ?? 0, world.now);
    world.fx.push({ kind: 'rallied', who: k, over: k === world.oni ? 112 : 70, x: k.x, y: k.y, t: 0, dur: R.dur });
  }
  if (world.tengu) world.tengu.commandAt = 0;
}

// ---------- Troupe Combo ----------
// When each part lands (s from the cast) and how hard: the freeze, the lift (rising, then held),
// the oni's slam, and the shatter as she snaps her fan.
export const COMBO = { freeze: 0.7, lift: [1.45, 1.9], slam: 2.75, shatter: 3.35, end: 3.9, high: 80, w: 330 };
export function troupeCombo(world, s) {
  const C = s.troupe;
  const b = world.body;
  const dir = b.facing;
  const marks = world.mobs.filter((m) => alive(m) && Math.abs(m.x - b.x) < COMBO.w && Math.abs(m.y - b.y) < 160);
  // Where they gather: the middle of the monsters (or ahead of her).
  const cx = marks.length ? marks.reduce((t, m) => t + m.x, 0) / marks.length : b.x + dir * 120;
  const [x, y] = groundAt(world, cx, b.y);
  world.troupeCombo = { t0: world.now, x, y, dir, marks, pct: C.pct, big: C.big, key: s.key, done: {} };
  // Her troupe take their places and their parts (world/oni.js, yuki.js, tengu.js play `combo`).
  const part = (k, at, dur, from, to) => {
    if (!k?.body) return;
    k.act = { kind: 'combo', t0: world.now + at, start: world.now, dur, from, to, x: k.body.x, y: k.body.y, done: 0 };
    k.flight = null;
  };
  part(world.yuki, 0.1, 1.4, x - dir * 70, x - dir * 70);
  part(world.tengu, 0.9, 1.8, x - dir * 30, x - dir * 30);
  part(world.oni, 1.7, 1.9, x - dir * 110, x);
  world.fx.push({ kind: 'troupecombo', combo: world.troupeCombo, x, y, dir, t: 0, dur: COMBO.end + 0.4 });
}
// One of the troupe playing its part in the combo (its brain hands over to this while its act is
// `combo`): it hurries to its place, plays its part from `t0` (its renderer draws the pose), and
// the oni leaps from `from` to `to`, high over the monsters, and comes down on them.
export function comboStep(world, k) {
  const a = k.act;
  const C = world.troupeCombo;
  const t = world.now - a.t0;
  const u = Math.max(0, t / a.dur);
  const soft = (v) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, v)));
  let x;
  if (world.now < a.t0) x = a.x + (a.from - a.x) * soft((world.now - a.start) / Math.max(0.05, a.t0 - a.start));
  else x = a.from + (a.to - a.from) * soft(u / 0.55);
  const [gx, gy] = groundAt(world, x, a.y);
  Object.assign(k.body, { x: gx, y: gy, vx: 0, vy: 0 });
  k.x = gx;
  k.y = gy;
  // Facing the monsters.
  if (C) k.body.facing = k.dir = Math.sign(C.x - gx) || C.dir;
  // The oni's leap: up high, a hang, and down hard at the slam.
  k.air = a.from !== a.to && t >= 0 ? 120 * Math.sin(Math.PI * Math.min(1, u / 0.55)) ** 0.7 : 0;
  if (u >= 1) {
    k.act = null;
    k.air = 0;
    k.next = world.now + 0.4;
  }
  return true;
}
function tickCombo(world) {
  const C = world.troupeCombo;
  if (!C) return;
  const t = world.now - C.t0;
  const live = C.marks.filter(alive);
  const once = (name, at, fn) => {
    if (!C.done[name] && t >= at) {
      C.done[name] = true;
      fn();
    }
  };
  // The yuki-onna's breath: everything frozen solid.
  once('freeze', COMBO.freeze, () => {
    world.fx.push({ kind: 'yukiwhiteout', x: C.x, y: C.y, r: COMBO.w * 0.6, dir: C.dir, t: 0, dur: 1.1 });
    world.juice.push({ type: 'shake', mag: 2, dur: 0.2 });
    live.forEach((m) => dollHit(world, m, { pct: C.pct * 0.5, x: C.x, knock: 0, freeze: COMBO.end - COMBO.freeze + 0.4, stop: 0, burst: 'yukihit', gauge: 0, key: 'yuki' }));
  });
  // The tengu's whirlwind: they're lifted, frozen, and held up there.
  once('lift', COMBO.lift[0], () => {
    for (const m of live) world.fx.push({ kind: 'tenguwhirl', x: m.x, y: m.y, r: 30, t: 0, dur: COMBO.slam - COMBO.lift[0] + 0.1 });
    world.juice.push({ type: 'shake', mag: 1.4, dur: 0.3 });
    live.forEach((m) => dollHit(world, m, { pct: C.pct * 0.5, x: C.x, knock: 0, stop: 0, burst: 'tenguwind', gauge: 0, key: 'tengu' }));
  });
  if (t >= COMBO.lift[0] && t < COMBO.slam) {
    const up = Math.min(1, (t - COMBO.lift[0]) / (COMBO.lift[1] - COMBO.lift[0]));
    // (Still rising a touch, turning, as the oni comes down on them.)
    const near = Math.max(0, (t - (COMBO.slam - 0.12)) / 0.12);
    for (const m of live) {
      if (m.def.boss) continue;
      m.air = COMBO.high * (1 - (1 - up) ** 2) * (1 - near) + 3 * Math.sin(t * 6 + m.uid);
      m.airV = 0;
      m.knockVx = 0;
    }
  }
  // The oni's slam: down they all come, into the ground.
  once('slam', COMBO.slam, () => {
    for (const m of live) m.air = 0;
    world.fx.push({ kind: 'crack', school: 'rage', x: C.x, y: C.y, w: COMBO.w * 0.9, t: 0, dur: 1, seed: Math.random() });
    world.fx.push({ kind: 'onipound', x: C.x, y: C.y, r: COMBO.w * 0.5, t: 0, dur: 0.8 });
    world.fx.push({ kind: 'oniimpact', x: C.x, y: C.y, dir: C.dir, big: true, t: 0, dur: 0.6 });
    world.juice.push({ type: 'oniimpact', x: C.x, y: C.y - 8, dir: C.dir, big: true });
    world.juice.push({ type: 'slam', school: 'rage', x: C.x, y: C.y, range: 140 });
    world.juice.push({ type: 'shake', mag: 7, dur: 0.45 });
    world.juice.push({ type: 'dust', x: C.x, y: C.y, count: 14 });
    world.hitstop = Math.max(world.hitstop ?? 0, 0.12);
    live.forEach((m, i) => dollHit(world, m, { pct: C.pct * 1.5, x: C.x, knock: 0, stop: 0, shake: 0, big: !i, burst: 'onihit', gauge: 0, key: 'oni' }));
  });
  // Her fan snaps shut: they shatter.
  once('shatter', COMBO.shatter, () => {
    world.fx.push({ kind: 'combosnap', x: world.body.x, y: world.body.y, dir: world.body.facing, t: 0, dur: 0.6 });
    world.juice.push({ type: 'shake', mag: 4, dur: 0.3 });
    live.forEach((m, i) => {
      m.frozenUntil = Math.min(m.frozenUntil ?? 0, world.now);
      dollHit(world, m, { pct: C.big, x: m.x - C.dir * 20, knock: 160, launch: 180, stun: 0.6, stop: i ? 0 : 0.14, big: !i, burst: 'yukishatter', gauge: 0, key: C.key });
    });
  });
  if (t >= COMBO.end) world.troupeCombo = null;
}

export function tickOnmyoji(world) {
  tickSeiman(world);
  tickCombo(world);
  if (world.rally && world.now >= world.rally.until) world.rally = null;
}
