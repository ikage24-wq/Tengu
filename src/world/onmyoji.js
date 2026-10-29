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
// The beats (s from the cast): the yuki-onna vanishes into mist and gathers again by the monsters
// (yukiTp, yukiIn) and freezes them all (freeze); the tengu vanishes in feathers and steps out by
// them (tenguTp, tenguIn) and his whirlwinds lift them (lift: rising, then held); the oni crouches,
// leaps from wherever she is, hangs high with her club up, and dives on them (crouch, leap, peak,
// dive, slam); the Onmyoji snaps her fan and they shatter.
export const COMBO = {
  yukiTp: 0.25, yukiIn: 0.45, freeze: 1.05, yukiOut: 1.9,
  tenguTp: 1.25, tenguIn: 1.45, lift: [1.95, 2.45], tenguGone: 2.98, tenguOut: 3.2, hover: 128,
  crouch: 2.2, leap: 2.65, peak: 3.1, dive: 3.24, slam: 3.4, oniOut: 4.15,
  shatter: 4.02, end: 4.6, high: 80, jump: 112, w: 330,
};
const PART_END = { freeze: COMBO.yukiOut, lift: COMBO.tenguOut, slam: COMBO.oniOut };
export function troupeCombo(world, s) {
  const C = s.troupe;
  const b = world.body;
  const dir = b.facing;
  const marks = world.mobs.filter((m) => alive(m) && Math.abs(m.x - b.x) < COMBO.w && Math.abs(m.y - b.y) < 160);
  // Where they gather: the middle of the monsters (or ahead of her).
  const cx = marks.length ? marks.reduce((t, m) => t + m.x, 0) / marks.length : b.x + dir * 120;
  const [x, y] = groundAt(world, cx, b.y);
  // (The nearest of them, for the yuki-onna to face.)
  const near = marks.length ? marks.reduce((a, m) => (Math.abs(m.x - b.x) < Math.abs(a.x - b.x) ? m : a)).x : x - dir * 40;
  world.troupeCombo = { t0: world.now, x, y, dir, marks, pct: C.pct, big: C.big, key: s.key, done: {} };
  // Her troupe take their parts (world/oni.js, yuki.js, tengu.js hand over to comboStep): the
  // yuki-onna right in front of the nearest monster, the tengu in the air over the middle of them,
  // the oni down onto the middle of them.
  const part = (k, role, to) => {
    if (!k?.body) return;
    k.act = { kind: 'combo', role, t0: world.now, dur: PART_END[role], x0: k.body.x, y0: k.body.y, to, done: 0 };
    k.flight = null;
    k.hidden = false;
  };
  part(world.yuki, 'freeze', near - dir * 42);
  part(world.tengu, 'lift', x);
  part(world.oni, 'slam', x);
  world.fx.push({ kind: 'troupecombo', combo: world.troupeCombo, x, y, dir, t: 0, dur: COMBO.end + 0.3 });
}
const ease = (v) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, v)));
const easeOut = (v) => 1 - (1 - Math.max(0, Math.min(1, v))) ** 3;
const easeIn = (v) => Math.max(0, Math.min(1, v)) ** 2.4;
// One of the troupe playing its part in the combo (its brain hands over to this while its act is
// `combo`; its renderer draws the part from `role` and the time since the cast).
export function comboStep(world, k) {
  const a = k.act;
  const C = world.troupeCombo;
  // (The combo's gone, a new map: back to themselves at once, seen and on the ground.)
  if (!C) {
    k.act = null;
    k.air = 0;
    k.hidden = false;
    return true;
  }
  const t = world.now - a.t0;
  const place = (x) => {
    const [gx, gy] = groundAt(world, x, a.y0);
    Object.assign(k.body, { x: gx, y: gy, vx: 0, vy: 0 });
    k.x = gx;
    k.y = gy;
  };
  const face = () => {
    if (C) k.body.facing = k.dir = Math.sign(C.x - k.x) || C.dir;
  };
  if (a.role === 'freeze' || a.role === 'lift') {
    // Teleported: gone at `tp` in mist or feathers, back at `back` by the monsters.
    const [tp, back, puff] = a.role === 'freeze' ? [COMBO.yukiTp, COMBO.yukiIn, 'yukistep'] : [COMBO.tenguTp, COMBO.tenguIn, 'tenguvanish'];
    if (t >= tp && !a.gone) {
      a.gone = true;
      world.fx.push({ kind: puff, x: k.x, y: k.y, t: 0, dur: 0.7 });
    }
    // (The tengu hovers over them, wings beating, and is gone again in feathers before the oni comes
    // down, back at his place.)
    const hover = a.role === 'lift' ? COMBO.hover + 5 * Math.sin(t * 6) : 0;
    k.hidden = (t >= tp && t < back) || (a.role === 'lift' && t >= COMBO.tenguGone);
    if (t >= back && !a.back) {
      a.back = true;
      place(a.to);
      world.fx.push({ kind: puff, x: k.x, y: k.y - hover, t: 0, dur: 0.7 });
    }
    if (a.role === 'lift' && t >= COMBO.tenguGone && !a.away) {
      a.away = true;
      world.fx.push({ kind: puff, x: k.x, y: k.y - hover, t: 0, dur: 0.7 });
    }
    if (!a.back) place(a.x0);
    k.air = a.back && !a.away ? hover : 0;
    face();
  } else {
    // The oni: a crouch where she stands, the leap (rising fast, easing into the peak), a hang at
    // the top with the club up, and the dive straight down onto them.
    const up = easeOut((t - COMBO.leap) / (COMBO.peak - COMBO.leap));
    const down = easeIn((t - COMBO.dive) / (COMBO.slam - COMBO.dive));
    const travel = ease((t - COMBO.leap) / (COMBO.dive - COMBO.leap));
    place(a.x0 + (a.to - a.x0) * travel);
    const hang = t > COMBO.peak ? 4 * Math.sin((t - COMBO.peak) * 10) : 0;
    k.air = t < COMBO.leap || t >= COMBO.slam ? 0 : (COMBO.jump * up + hang) * (1 - down);
    face();
    // (Burning with fury from the crouch to the landing.)
    if (t >= COMBO.crouch && t < COMBO.slam + 0.3) k.furyUntil = Math.max(k.furyUntil ?? 0, world.now + 0.1);
    if (t >= COMBO.leap && !a.leapt) {
      a.leapt = true;
      world.juice.push({ type: 'dust', x: k.x, y: k.y, count: 12 });
      world.juice.push({ type: 'shake', mag: 3, dur: 0.2 });
      world.juice.push({ type: 'shockring', x: k.x, y: k.y, r0: 6, r1: 70, thick: 6, life: 0.35, color: '#ff8a6a' });
    }
  }
  if (t >= a.dur) {
    k.act = null;
    k.air = 0;
    k.hidden = false;
    k.next = world.now + 0.4;
    // (The tengu steps back out of his feathers where he was.)
    if (a.role === 'lift') {
      place(a.x0);
      world.fx.push({ kind: 'tenguvanish', x: k.x, y: k.y, t: 0, dur: 0.7 });
    }
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
  // The yuki-onna's whiteout: everything frozen solid in one breath.
  once('freeze', COMBO.freeze, () => {
    world.fx.push({ kind: 'yukiwhiteout', x: C.x, y: C.y, r: COMBO.w * 0.62, dir: C.dir, t: 0, dur: 1.2 });
    world.juice.push({ type: 'screenflash', color: '#d8ecff', life: 0.22 });
    world.juice.push({ type: 'shockring', x: C.x, y: C.y, r0: 20, r1: 280, thick: 10, life: 0.6, color: '#cfe8ff' });
    world.juice.push({ type: 'shake', mag: 3, dur: 0.25 });
    world.hitstop = Math.max(world.hitstop ?? 0, 0.08);
    live.forEach((m) => dollHit(world, m, { pct: C.pct * 0.5, x: C.x, knock: 0, freeze: COMBO.shatter - COMBO.freeze + 0.3, stop: 0, gauge: 0, big: true, burst: 'yukihit', key: 'yuki' }));
  });
  // The tengu's whirlwinds: lifted, frozen, and held up there turning.
  once('lift', COMBO.lift[0], () => {
    for (const m of live) world.fx.push({ kind: 'tenguwhirl', x: m.x, y: m.y, r: 30, t: 0, dur: COMBO.slam - COMBO.lift[0] });
    world.juice.push({ type: 'shockring', x: C.x, y: C.y, r0: 16, r1: 200, thick: 7, life: 0.5, color: '#c8f0e8' });
    world.juice.push({ type: 'shake', mag: 2, dur: 0.3 });
    live.forEach((m) => dollHit(world, m, { pct: C.pct * 0.5, x: C.x, knock: 0, stop: 0, gauge: 0, burst: 'tenguwind', key: 'tengu' }));
  });
  // The oni's crouch: her fury flares and she roars.
  once('crouch', COMBO.crouch, () => {
    const o = world.oni;
    if (o?.body) {
      world.fx.push({ kind: 'oniaura', x: o.x, y: o.y, dir: o.dir, t: 0, dur: 0.8 });
      world.fx.push({ kind: 'oniroar', x: o.x, y: o.y, dir: o.dir, t: 0, dur: 0.9 });
    }
    world.juice.push({ type: 'shake', mag: 1.5, dur: 0.4 });
  });
  if (t >= COMBO.lift[0] && t < COMBO.slam) {
    const up = easeOut((t - COMBO.lift[0]) / (COMBO.lift[1] - COMBO.lift[0]));
    // (Driven down with the oni's dive.)
    const down = easeIn((t - COMBO.dive) / (COMBO.slam - COMBO.dive));
    for (const m of live) {
      if (m.def.boss) continue;
      m.air = (COMBO.high * up + 4 * Math.sin(t * 5 + m.uid) * up) * (1 - down);
      m.airV = 0;
      m.knockVx = 0;
    }
  }
  // The oni's strike: everything smashed into the ground at once.
  once('slam', COMBO.slam, () => {
    for (const m of live) m.air = 0;
    world.hitstop = Math.max(world.hitstop ?? 0, 0.22);
    world.slowmo = Math.max(world.slowmo ?? 0, 0.45);
    world.juice.push({ type: 'screenflash', color: '#ffffff', life: 0.2 });
    world.juice.push({ type: 'shockring', x: C.x, y: C.y, r0: 20, r1: 340, thick: 16, life: 0.7, color: '#ff4a3a' });
    world.juice.push({ type: 'shockring', x: C.x, y: C.y, r0: 10, r1: 220, thick: 10, life: 0.55, delay: 0.08, color: '#ffd0a0' });
    world.juice.push({ type: 'oniimpact', x: C.x, y: C.y - 8, dir: C.dir, big: true });
    world.juice.push({ type: 'slam', school: 'rage', x: C.x, y: C.y, range: 180 });
    world.juice.push({ type: 'shake', mag: 11, dur: 0.6 });
    world.juice.push({ type: 'dust', x: C.x, y: C.y, count: 22 });
    world.fx.push({ kind: 'crack', school: 'rage', x: C.x, y: C.y, w: COMBO.w * 1.1, t: 0, dur: 1.2, seed: Math.random() });
    world.fx.push({ kind: 'onipound', x: C.x, y: C.y, r: COMBO.w * 0.6, t: 0, dur: 0.9 });
    world.fx.push({ kind: 'oniimpact', x: C.x, y: C.y, dir: C.dir, big: true, t: 0, dur: 0.7 });
    live.forEach((m, i) => dollHit(world, m, { pct: C.pct * 1.5, x: C.x, knock: 0, stop: 0, shake: 0, big: !i, gauge: 0, burst: 'onihit', key: 'oni' }));
  });
  // Her fan snaps shut: they shatter.
  once('shatter', COMBO.shatter, () => {
    world.fx.push({ kind: 'combosnap', x: world.body.x, y: world.body.y, dir: world.body.facing, t: 0, dur: 0.6 });
    world.hitstop = Math.max(world.hitstop ?? 0, 0.1);
    world.juice.push({ type: 'screenflash', color: '#ffe0e4', life: 0.16 });
    world.juice.push({ type: 'shake', mag: 5, dur: 0.35 });
    live.forEach((m, i) => {
      m.frozenUntil = Math.min(m.frozenUntil ?? 0, world.now);
      dollHit(world, m, { pct: C.big, x: m.x - C.dir * 20, knock: 180, launch: 200, stun: 0.6, stop: 0, big: !i, gauge: 0, burst: 'yukishatter', key: C.key });
    });
  });
  if (t >= COMBO.end) world.troupeCombo = null;
}

export function tickOnmyoji(world) {
  tickSeiman(world);
  tickCombo(world);
  if (world.rally && world.now >= world.rally.until) world.rally = null;
}
