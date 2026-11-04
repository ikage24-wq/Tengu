// The Starlight Idol's songs and her show (data/skills.js; docs/design/starlight-idol.md; her moves
// are the `si*` figures in render/moves.js, her effects the `si*` strips):
//   Healing Song, Cheer, Lullaby  each a song that hangs in the air where she sang it for a while: a
//                                 ring on the ground that works on whoever stands in it every
//                                 `every` seconds (mends them, lifts their attack, or lulls the
//                                 monsters there: slower, and chipped at by her notes). One of each
//                                 at a time: singing it again moves it to her.
//   Curtain Call                  every fallen ally nearby gets up, and for a while a blow that would
//                                 knock her out leaves her standing instead (her Encore), once
//   Grand Concert                 her finisher: the stage rises under her, everyone in reach is
//                                 healed in full, and the music blasts the monsters back, three beats
// Live Show (full Applause, world/melee.js): her songs reach twice as far and mend more.

import { dollHit, healAround, liveShow } from './melee.js';
import { applyBuff } from './combat.js';
import { reviveTarget, reviveMember, groupOf, isUp, giveBuff } from './dungeon.js';
import { SKILLS } from '../data/skills.js';

const alive = (m) => m && m.hp > 0;
// Live Show: how much further her songs reach, and how much more they mend.
export const LIVE_REACH = 2;
export const LIVE_HEAL = 1.5;

// ---------- The songs ----------
// `s.song`: { kind ('heal', 'cheer' or 'lull'), r, dur, every, and the kind's own numbers }.
export function sing(world, s) {
  const b = world.body;
  const S = s.song;
  const live = liveShow(world);
  const song = { ...S, key: s.key, map: world.map.id, x: b.x, y: b.y, r: S.r * (live ? LIVE_REACH : 1), live, since: world.now, until: world.now + S.dur, next: world.now + 0.1 };
  world.songs = (world.songs ?? []).filter((o) => o.kind !== S.kind);
  world.songs.push(song);
  world.fx.push({ kind: 'idolsong', song, x: b.x, y: b.y, t: 0, dur: S.dur });
  world.fx.push({ kind: 'siwave', x: b.x, y: b.y - 26, t: 0, dur: 0.6 });
}
const inSong = (Z, body) => Math.abs(body.x - Z.x) <= Z.r && Math.abs(body.y - Z.y) < 90;
function tickSong(world, Z) {
  if (Z.kind === 'heal') healAround(world, Z.x, Z.y, Z.heal * (Z.live ? LIVE_HEAL : 1), Z.r);
  else if (Z.kind === 'cheer') {
    // Everyone standing in it fights harder while they stay (a short lift, renewed each beat).
    const lift = { watk: Z.watk, matk: Z.matk };
    const hold = Z.every + 0.6;
    if (inSong(Z, world.body) && !world.dead) {
      const had = world.char.buffs.idolcheer;
      world.char.buffs.idolcheer = { until: world.now + hold, since: had?.until > world.now ? had.since : world.now, values: lift, name: SKILLS.idolcheer.name };
    }
    if (world.dungeon) for (const g of groupOf(world)) if (g.id !== 'you' && isUp(world, g) && inSong(Z, g.body)) giveBuff(world, g, 'idolcheer', SKILLS.idolcheer.name, lift, hold);
  } else if (Z.kind === 'lull') {
    // The monsters in it drift and slow, and her notes chip at them.
    world.mobs.filter((m) => alive(m) && inSong(Z, m)).forEach((m) => {
      m.lulled = Z.every + 0.3;
      dollHit(world, m, { pct: Z.pct, x: Z.x, knock: 0, stop: 0, burst: 'sihit', gauge: 1, key: Z.key });
    });
  }
}
function tickSongs(world) {
  if (!world.songs?.length) return;
  world.songs = world.songs.filter((Z) => world.now < Z.until && Z.map === world.map.id);
  for (const Z of world.songs) {
    if (world.now < Z.next) continue;
    Z.next = world.now + Z.every;
    tickSong(world, Z);
  }
}

// ---------- Curtain Call ----------
export function curtainCall(world, s) {
  const R = s.revive;
  const b = world.body;
  const box = { x: b.x - R.r, y: b.y - 160, w: R.r * 2, h: 320 };
  for (let g = reviveTarget(world, box), n = 0; g && n < 8; g = reviveTarget(world, box), n++) {
    reviveMember(world, g, R.pct);
    world.fx.push({ kind: 'sihit', big: true, x: g.body.x, y: g.body.y - 10, h: 0, t: 0, dur: 0.7 });
    world.fx.push({ kind: 'sisong', x: g.body.x, y: g.body.y, t: 0, dur: 1.1 });
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
  world.fx.push({ kind: 'sihit', big: true, x: body.x, y: body.y - 10, h: 0, t: 0, dur: 0.7 });
  world.fx.push({ kind: 'sisong', x: body.x, y: body.y, t: 0, dur: 1.1 });
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
  world.fx.push({ kind: 'sistage', x: b.x, y: b.y, t: 0, dur: C.beats.at(-1) + 0.9 });
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
    world.fx.push({ kind: 'siwave', big: true, scale: last ? 0.85 : 0.65, x: C.x, y: C.y - 30, t: 0, dur: 0.6 });
    for (const dir of [-1, 1]) world.fx.push({ kind: 'sishock', big: last, dir, r: C.r, x: C.x, y: C.y - 26, t: 0, dur: SHOCK });
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
      dollHit(world, h.m, { pct: C.pct, x: C.x, knock: h.last ? 260 : 120, launch: h.last ? 260 : 80, stun: 0.3, stop: first ? (h.last ? 0.08 : 0.04) : 0, shake: 0, big: h.last && first, burst: 'sihit', gauge: 0, key: C.key });
      first = false;
    }
    return false;
  });
  if (world.now >= C.end && !C.hits.length) world.concert = null;
}

export function tickIdol(world) {
  tickSongs(world);
  tickConcert(world);
}
