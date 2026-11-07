// The Starlight Idol's songs and her show (data/skills.js; docs/design/starlight-idol.md; her moves
// are the `si*` figures in render/moves.js, her effects the `si*` strips). Her songs move with the
// show; none of them sits still on the ground:
//   Spotlight     she points the mic at whoever is most hurt (her, or a party member near her): a
//                 spotlight drops on them and follows them for a while, mending them every beat
//   Hype Wave     a crowd-wave of light rolls out both ways along the ground; every ally it passes
//                 hits harder for a while, and every monster it passes is popped up off its feet
//   Lullaby       a little cloud of lilac notes drifts off toward the nearest monster; whatever it
//                 touches nods off (a short sleep, once in a while), slows to a sleepy drift and
//                 is chipped at by its notes
//   Medley        singing a different song from the last one gets an extra cheer of Applause
//   Curtain Call  every fallen ally nearby gets up, and for a while a blow that would knock her out
//                 leaves her standing instead (her Encore), once
//   Grand Concert her finisher: the stage rises under her, everyone in reach is healed in full, and
//                 the music blasts the monsters back, three beats, with pyro on each
// Live Show (full Applause, world/melee.js): the spotlight mends half again as much, the wave rolls
// half again as far, and the lullaby cloud is half again as wide.

import { dollHit, healAround, liveShow, addGrace } from './melee.js';
import { applyBuff } from './combat.js';
import { reviveTarget, reviveMember, groupOf, isUp, giveBuff, hpOf, maxHpOf } from './dungeon.js';
import { SKILLS } from '../data/skills.js';

const alive = (m) => m && m.hp > 0;
export const LIVE_REACH = 1.5;
export const LIVE_HEAL = 1.5;
// The extra Applause for changing songs.
export const MEDLEY = 10;

// Who she can sing to: her alone, or her and the party members up on this map.
const members = (world) => (world.dungeon ? groupOf(world) : [{ id: 'you', body: world.body, bot: null }]).filter((g) => isUp(world, g));
const frac = (world, g) => hpOf(world, g) / Math.max(1, maxHpOf(world, g));

function medley(world, kind) {
  if (world.lastSong && world.lastSong !== kind) {
    addGrace(world, MEDLEY);
    const b = world.body;
    world.numbers.push({ x: b.x, y: b.y - b.h - 18, text: 'DEVOTION!', color: '#ffe08a', t: 0, small: true });
  }
  world.lastSong = kind;
}

// ---------- Spotlight ----------
// `s.spot`: { heal (at once), tick (each beat), every, dur, r (how far she looks for someone hurt) }.
export function spotlight(world, s) {
  const S = s.spot;
  const b = world.body;
  const near = members(world).filter((g) => Math.abs(g.body.x - b.x) <= S.r && Math.abs(g.body.y - b.y) < 200);
  // The most hurt (by share of their health); her, if no one is worse off.
  const g = near.reduce((a, o) => (frac(world, o) < frac(world, a) - 0.02 ? o : a), near.find((o) => o.id === 'you') ?? near[0]);
  if (!g) return;
  const live = liveShow(world);
  medley(world, 'spot');
  healAround(world, g.body.x, g.body.y, S.heal, 14);
  world.spot = { id: g.id, until: world.now + S.dur, next: world.now + S.every, every: S.every, tick: S.tick * (live ? LIVE_HEAL : 1), live, map: world.map.id };
  world.fx = world.fx.filter((f) => f.kind !== 'bbspot');
  world.fx.push({ kind: 'bbspot', id: g.id, live, x: g.body.x, y: g.body.y, t: 0, dur: S.dur });
}
function tickSpot(world) {
  const S = world.spot;
  if (!S) return;
  const g = members(world).find((o) => o.id === S.id);
  if (!g || world.now >= S.until || S.map !== world.map.id) {
    world.spot = null;
    return;
  }
  // The light follows them.
  for (const f of world.fx) if (f.kind === 'bbspot' && f.id === S.id) Object.assign(f, { x: g.body.x, y: g.body.y });
  if (world.now < S.next) return;
  S.next = world.now + S.every;
  healAround(world, g.body.x, g.body.y, S.tick, 14);
}

// ---------- Hype Wave ----------
// `s.hype`: { r, speed, dur (the lift), watk, matk, pct, launch }.
export function hypeWave(world, s) {
  const H = s.hype;
  const b = world.body;
  const live = liveShow(world);
  medley(world, 'hype');
  const r = H.r * (live ? LIVE_REACH : 1);
  world.hype = { ...H, r, x: b.x, y: b.y, born: world.now, key: s.key, map: world.map.id, hitAllies: new Set(), hitMobs: new Set() };
  for (const dir of [-1, 1]) world.fx.push({ kind: 'bbhype', dir, r, live, x: b.x, y: b.y, t: 0, dur: r / H.speed + 0.35 });
  world.fx.push({ kind: 'bbring', x: b.x, y: b.y - 26, t: 0, dur: 0.6 });
  world.juice.push({ type: 'shake', mag: 1.2, dur: 0.15 });
}
function tickHype(world) {
  const H = world.hype;
  if (!H) return;
  const front = Math.min(H.r, (world.now - H.born) * H.speed);
  const lift = { watk: H.watk, matk: H.matk };
  for (const g of members(world)) {
    if (H.hitAllies.has(g.id) || Math.abs(g.body.x - H.x) > front || Math.abs(g.body.y - H.y) > 120) continue;
    H.hitAllies.add(g.id);
    if (g.id === 'you') world.char.buffs.idolcheer = { until: world.now + H.dur, since: world.now, values: lift, name: SKILLS.idolcheer.name };
    else giveBuff(world, g, 'idolcheer', SKILLS.idolcheer.name, lift, H.dur);
    world.fx.push({ kind: 'bbsparkle', x: g.body.x, y: g.body.y - g.body.h - 6, h: 0, t: 0, dur: 0.6 });
  }
  for (const m of world.mobs) {
    if (!alive(m) || H.hitMobs.has(m) || Math.abs(m.x - H.x) > front + m.def.w / 2 || Math.abs(m.y - H.y) > 120) continue;
    H.hitMobs.add(m);
    dollHit(world, m, { pct: H.pct, x: H.x, knock: 30, launch: H.launch, stop: 0.03, burst: 'bbhit', gauge: 2, key: H.key });
  }
  if (front >= H.r || H.map !== world.map.id) world.hype = null;
}

// ---------- Lullaby ----------
// `s.lull`: { r, dur, every, pct, speed, sleep (s asleep), seek (how far it looks for a monster) }.
export function lullaby(world, s) {
  const L = s.lull;
  const b = world.body;
  const live = liveShow(world);
  medley(world, 'lull');
  world.lull = { ...L, r: L.r * (live ? LIVE_REACH : 1), live, key: s.key, x: b.x + b.facing * 40, y: b.y, vx: b.facing * L.speed * 0.6, last: world.now, until: world.now + L.dur, next: world.now + 0.25, map: world.map.id };
  world.fx = world.fx.filter((f) => f.kind !== 'bblather');
  world.fx.push({ kind: 'bblather', r: world.lull.r, x: world.lull.x, y: b.y, vx: world.lull.vx, t: 0, dur: L.dur });
}
function tickLull(world) {
  const L = world.lull;
  if (!L) return;
  if (world.now >= L.until || L.map !== world.map.id) {
    world.lull = null;
    return;
  }
  const dt = Math.min(0.1, world.now - L.last);
  L.last = world.now;
  // It drifts toward the nearest monster it can find, easing round to it; with none, it slows.
  const target = world.mobs.filter((m) => alive(m) && Math.abs(m.x - L.x) < L.seek && Math.abs(m.y - L.y) < 140).sort((a, c) => Math.abs(a.x - L.x) - Math.abs(c.x - L.x))[0];
  const want = target ? Math.sign(target.x - L.x) * L.speed * Math.min(1, Math.abs(target.x - L.x) / 30) : 0;
  L.vx += (want - L.vx) * Math.min(1, dt * 2.2);
  L.x += L.vx * dt;
  if (target) L.y += (target.y - L.y) * Math.min(1, dt * 3);
  for (const f of world.fx) if (f.kind === 'bblather') Object.assign(f, { x: L.x, y: L.y, vx: L.vx });
  if (world.now < L.next) return;
  L.next = world.now + L.every;
  for (const m of world.mobs) {
    if (!alive(m) || Math.abs(m.x - L.x) > L.r + m.def.w / 2 || Math.abs(m.y - L.y) > 110) continue;
    m.lulled = L.every + 0.4;
    // Nodding off: a short sleep, then a while awake before it can happen again.
    const nod = !(m.sleptAt > world.now - 4);
    if (nod) {
      m.sleptAt = world.now;
      world.numbers.push({ x: m.x, y: m.y - (m.def.h ?? 40) - 10, text: 'zzz', color: '#c8b4ff', t: 0, small: true });
    }
    dollHit(world, m, { pct: L.pct, x: L.x, knock: 0, stop: 0, stun: nod ? L.sleep : 0, burst: 'bbhit', gauge: 1, key: L.key });
  }
}

// ---------- Curtain Call ----------
export function curtainCall(world, s) {
  const R = s.revive;
  const b = world.body;
  const box = { x: b.x - R.r, y: b.y - 160, w: R.r * 2, h: 320 };
  for (let g = reviveTarget(world, box), n = 0; g && n < 8; g = reviveTarget(world, box), n++) {
    reviveMember(world, g, R.pct);
    world.fx.push({ kind: 'bbsparkle', big: true, x: g.body.x, y: g.body.y - 10, h: 0, t: 0, dur: 0.7 });
    world.fx.push({ kind: 'bbspot', id: g.id, short: true, x: g.body.x, y: g.body.y, t: 0, dur: 1.2 });
  }
  applyBuff(world, 'resurrection', { duration: R.rite, buff: { lastRite: R.pct }, range: { w: R.r * 2, h: 180, around: true } });
}
// Her Encore: a blow that would knock her out leaves her standing instead, mended to `lastRite` of
// her max HP; once (the buff is spent). True if it saved her (world.js and dungeon.js ask).
export function lastRite(world) {
  const { char, body } = world;
  const b = char.buffs?.resurrection;
  if (!b || b.until <= world.now || !b.values?.lastRite) return false;
  delete char.buffs.resurrection;
  char.hp = Math.max(1, Math.round(world.stats.maxHp * b.values.lastRite));
  world.invuln = Math.max(world.invuln ?? 0, 1.2);
  world.fx.push({ kind: 'bbsparkle', big: true, x: body.x, y: body.y - 10, h: 0, t: 0, dur: 0.7 });
  world.fx.push({ kind: 'bbring', x: body.x, y: body.y - 26, t: 0, dur: 0.6 });
  world.numbers.push({ x: body.x, y: body.y - body.h - 14, text: 'ENCORE!', color: '#ff8fc0', t: 0 });
  world.log?.('Encore: the crowd won\'t let you leave the stage.', '#ff8fc0');
  return true;
}

// ---------- Grand Concert ----------
// `s.concert`: { r, pct, beats (when each blast goes, s after the stage rises), heal, ward, wardDur }.
export function grandConcert(world, s) {
  const C = s.concert;
  const b = world.body;
  world.concert = { x: b.x, y: b.y, r: C.r, pct: C.pct, key: s.key, beats: C.beats.map((t) => world.now + t), done: 0, hits: [], end: world.now + C.beats.at(-1) + SHOCK + 0.1 };
  world.fx.push({ kind: 'bbdome', x: b.x, y: b.y, t: 0, dur: C.beats.at(-1) + 0.9 });
  // Everyone in reach is healed in full (a finisher's heal: it builds no Applause).
  healAround(world, b.x, b.y, 1, C.r, false);
  applyBuff(world, 'thousandtorii', { duration: C.wardDur, buff: { barrier: C.ward }, range: { w: C.r * 2, h: 200, around: true } });
  world.juice.push({ type: 'shake', mag: 2, dur: 0.25 });
}
// Each beat sends the music rolling out both ways along the ground to the edge of its reach
// (SHOCK s to get there); a monster is hit the moment the blast reaches it, not on the beat.
const SHOCK = 0.32;
function tickConcert(world) {
  const C = world.concert;
  if (!C) return;
  while (C.done < C.beats.length && world.now >= C.beats[C.done]) {
    const last = ++C.done === C.beats.length;
    world.fx.push({ kind: 'bbring', big: true, scale: last ? 0.6 : 0.45, x: C.x, y: C.y - 30, t: 0, dur: 0.6 });
    for (const dir of [-1, 1]) {
      world.fx.push({ kind: 'bbsurge', big: last, dir, r: C.r, x: C.x, y: C.y - 26, t: 0, dur: SHOCK });
      // Pyro shooting up at the stage's edges on the beat (a fan of confetti with the last).
      world.fx.push({ kind: 'bbfount', big: last, x: C.x + dir * (C.done === 2 ? 70 : 140), y: C.y, t: 0, dur: last ? 1.1 : 0.8 });
    }
    world.juice.push({ type: 'shake', mag: last ? 3 : 1.5, dur: last ? 0.25 : 0.12 });
    world.mobs
      .filter((m) => alive(m) && Math.abs(m.x - C.x) < C.r + m.def.w / 2 && Math.abs(m.y - C.y) < 120)
      .forEach((m) => {
        // When the blast (easing out as it rolls) reaches it.
        const u = Math.min(1, Math.max(0, Math.abs(m.x - C.x) - m.def.w / 2) / C.r);
        C.hits.push({ at: world.now + SHOCK * (1 - Math.sqrt(1 - u)), m, last });
      });
  }
  let first = true;
  C.hits = C.hits.filter((h) => {
    if (world.now < h.at) return true;
    if (alive(h.m)) {
      dollHit(world, h.m, { pct: C.pct, x: C.x, knock: h.last ? 260 : 120, launch: h.last ? 260 : 80, stun: 0.3, stop: first ? (h.last ? 0.08 : 0.04) : 0, shake: 0, big: h.last && first, burst: h.last && first ? 'bbhitbig' : 'bbhit', gauge: 0, key: C.key });
      first = false;
    }
    return false;
  });
  if (world.now >= C.end && !C.hits.length) world.concert = null;
}

export function tickIdol(world) {
  tickSpot(world);
  tickHype(world);
  tickLull(world);
  tickConcert(world);
}
