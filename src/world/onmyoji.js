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
//   Hyakki Yagyo    her finisher (the Night Parade of a Hundred Demons): night falls over the
//                   screen and the parade marches across it, lanterns, umbrellas, foxes, oni and
//                   all, trampling every monster again and again, and ends in a great burst

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

// ---------- Hyakki Yagyo ----------
export function hyakkiYagyo(world, s) {
  const P = s.parade;
  const b = world.body;
  world.parade = { t0: world.now, until: world.now + P.dur, next: world.now + P.start, every: P.every, pct: P.pct, big: P.big, dir: b.facing, x: b.x, y: b.y, w: P.w, key: s.key, ended: false };
  world.fx.push({ kind: 'hyakkiyagyo', parade: world.parade, x: b.x, y: b.y, dir: b.facing, t: 0, dur: P.dur + 0.8 });
  world.juice.push({ type: 'shake', mag: 2, dur: 0.3 });
}
function tickParade(world) {
  const P = world.parade;
  if (!P) return;
  const b = world.body;
  const inView = (m) => alive(m) && Math.abs(m.x - b.x) < P.w && Math.abs(m.y - b.y) < 200;
  if (!P.ended && world.now >= P.until - 0.4) {
    // The parade's end: a great burst over everything.
    P.ended = true;
    world.fx.push({ kind: 'paradeburst', x: b.x, y: b.y, t: 0, dur: 1 });
    world.juice.push({ type: 'shake', mag: 6, dur: 0.45 });
    world.mobs.filter(inView).forEach((m, i) => dollHit(world, m, { pct: P.big, x: m.x - P.dir * 30, knock: 220, launch: 200, stun: 0.6, stop: i ? 0 : 0.14, shake: 0, big: !i, burst: 'paradehit', gauge: 0, key: P.key }));
  }
  if (world.now >= P.until) {
    world.parade = null;
    return;
  }
  if (P.ended || world.now < P.next) return;
  P.next = world.now + P.every;
  // Trampled as the parade goes by.
  world.mobs.filter(inView).forEach((m) => dollHit(world, m, { pct: P.pct, x: m.x - P.dir * 30, knock: 40, launch: 40, stop: 0, burst: 'paradehit', gauge: 0, key: P.key }));
}

export function tickOnmyoji(world) {
  tickSeiman(world);
  tickParade(world);
  if (world.rally && world.now >= world.rally.until) world.rally = null;
}
