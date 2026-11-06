// The Mage's element reactions (docs/design/mage-line.md, the remake; the player's pick, 2026-11-06).
// Every spell of hers that lands leaves its element on the monster for a few seconds (its mark:
// fire, ice or lightning, a little sigil over its head). Hit a marked monster with a different
// element and the two react, and the mark is used up:
//   fire + ice        Steam Blast: a scalding cloud bursts round it and hits everything near.
//   ice + lightning   Shatter: the ice cracks apart in a big critical hit that stuns it.
//   lightning + fire  Kaboom: it explodes, and the blast jumps to the monsters around it.
// Reactions build her gauge, Mayhem, far faster than plain hits do. Full (MELTDOWN), every spell
// she lands reacts whatever mark it finds, and her finisher is ready. A reaction's own hits carry
// no element, so they never set off another one.

import { addSpirit, SPIRIT_MAX } from './melee.js';

export const MARK_TIME = 4;
// A monster that just reacted can't react again for this long (its next spell only marks it), so
// a flurry of hits reads as a few big moments, not a pile-up.
export const REACT_GAP = 0.7;
// At most this many reaction pictures play at once; past that the hits still land, unseen.
const MAX_RX_FX = 5;
// What a reaction builds on Mayhem (a plain hit builds about 1): a dozen or so fill it.
export const REACT_GAIN = 8;
// Each reaction's strength, as a share of the hit that set it off.
export const STEAM_PCT = 0.7;
export const STEAM_R = 90;
export const SHATTER_PCT = 1.4;
export const SHATTER_STUN = 0.9;
export const KABOOM_PCT = 0.8;
export const KABOOM_JUMPS = 3;
export const KABOOM_R = 170;

const PAIRS = { 'fire+ice': 'steam', 'bolt+ice': 'shatter', 'bolt+fire': 'kaboom' };
export const reactionOf = (a, b) => (a && b && a !== b ? PAIRS[[a, b].sort().join('+')] : null);
// On MELTDOWN a spell with no other mark to meet reacts as if it found the element after its own.
const NEXT = { fire: 'ice', ice: 'bolt', bolt: 'fire' };

export const isMage = (world) => world.char.job === 'spiritmage';
export const meltdown = (world) => isMage(world) && (world.spirit ?? 0) >= SPIRIT_MAX;
export const markOf = (m, now) => (m.elMark && now - m.elMark.at < MARK_TIME ? m.elMark.el : null);

// A hit of hers landing on monster m (world.js calls this as each queued hit lands).
export function elementHit(world, m, h) {
  if (!isMage(world) || h.party || h.miss || h.reaction) return null;
  // Big Bad Kaboom's last blast sets off all three at once on everything it hits.
  if (h.rxAll) {
    m.elMark = null;
    m.reactedAt = world.now;
    for (const kind of ['steam', 'shatter', 'kaboom']) react(world, m, kind, h);
    return 'all';
  }
  if (!h.el) return null;
  const now = world.now;
  const mark = markOf(m, now);
  const ready = now - (m.reactedAt ?? -9) >= REACT_GAP;
  let kind = ready ? reactionOf(mark, h.el) : null;
  if (!kind && ready && meltdown(world)) kind = reactionOf(NEXT[h.el], h.el);
  if (!kind) {
    m.elMark = { el: h.el, at: now };
    return null;
  }
  m.elMark = null;
  m.reactedAt = now;
  react(world, m, kind, h);
  return kind;
}

const nearby = (world, m, r, skip = new Set()) => world.mobs
  .filter((o) => o !== m && o.hp > 0 && !skip.has(o) && Math.abs(o.x - m.x) <= r && Math.abs(o.y - m.y) < 120)
  .sort((a, b) => Math.abs(a.x - m.x) - Math.abs(b.x - m.x));

function queue(world, m, damage, at, extra = {}) {
  world.pending.push({ at, mob: m, miss: false, damage: Math.max(1, Math.round(damage)), crit: false, fromX: world.body.x, stack: 1, knock: 60, launch: 0, via: 'magic', reaction: true, ...extra });
}

export function react(world, m, kind, h) {
  const now = world.now;
  const fx = (f) => { if (world.fx.filter((o) => o.kind.startsWith('rx')).length < MAX_RX_FX) world.fx.push(f); };
  const base = h.damage;
  const y = m.y - (m.air ?? 0);
  world.reactions = (world.reactions ?? 0) + 1;
  world.lastReaction = { kind, at: now, x: m.x, y };
  world.reactedKinds = { ...world.reactedKinds, [kind]: (world.reactedKinds?.[kind] ?? 0) + 1 };
  if (kind === 'steam') {
    fx({ kind: 'rxsteam', x: m.x, y: m.y, h: m.def.h, r: STEAM_R, t: 0, dur: 0.7, seed: Math.random() });
    for (const o of [m, ...nearby(world, m, STEAM_R)]) queue(world, o, base * STEAM_PCT, now + 0.08, { knock: 40, launch: 30 });
    world.juice.push({ type: 'shake', mag: 1.5, dur: 0.18 });
  } else if (kind === 'shatter') {
    fx({ kind: 'rxshatter', x: m.x, y, h: m.def.h, t: 0, dur: 0.55, seed: Math.random() });
    queue(world, m, base * SHATTER_PCT, now + 0.05, { crit: true, big: true, stun: SHATTER_STUN, knock: 70, stop: 0.08 });
    world.juice.push({ type: 'shake', mag: 2, dur: 0.2 });
  } else {
    // The blast hops from one monster to the next, a beat apart.
    const hit = new Set([m]);
    let from = m;
    fx({ kind: 'rxkaboom', x: m.x, y, h: m.def.h, t: 0, dur: 0.6, seed: Math.random() });
    queue(world, m, base * KABOOM_PCT, now + 0.06, { big: true, knock: 70, launch: 60, stop: 0.06 });
    for (let j = 0; j < KABOOM_JUMPS; j++) {
      const next = nearby(world, from, KABOOM_R, hit)[0];
      if (!next) break;
      hit.add(next);
      const lag = 0.12 * (j + 1);
      fx({ kind: 'rxjump', x: from.x, y: from.y - (from.air ?? 0) - from.def.h / 2, tx: next.x, ty: next.y - (next.air ?? 0) - next.def.h / 2, t: -lag + 0.06, dur: 0.24 });
      fx({ kind: 'rxkaboom', small: true, x: next.x, y: next.y - (next.air ?? 0), h: next.def.h, t: -lag, dur: 0.5, seed: Math.random() });
      queue(world, next, base * KABOOM_PCT * 0.8, now + 0.06 + lag, { knock: 50, launch: 40 });
      from = next;
    }
    world.juice.push({ type: 'shake', mag: 2.5, dur: 0.22 });
  }
  // (A finisher's hits, gauge 0, never refill it.)
  if (h.gauge !== 0) addSpirit(world, REACT_GAIN, 'react');
}
