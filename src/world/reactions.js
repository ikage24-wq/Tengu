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
//
// The Sorcerer (the chaos queen, her path) reacts the same way, and her reactions spread: each one
// passes its element on to the monsters next to it (CHAIN_FAN of them, a beat apart), so a marked
// crowd goes off like dominoes. Her gauge, Chaos (internally Binding), fills by how long the chains
// run; full (PANDEMONIUM), they run longer and spread wider, and her finisher is ready.

//
// The Cleric (the combat medic, her other path) reacts on monsters too, and her heals carry her
// elements onto her party: a heal of a different element from the one on them reacts as a heal of
// its own (fire + ice Soothing Steam: mends at once and keeps mending; ice + lightning Frost Shield:
// a barrier of ice; lightning + fire Spark Rush: faster and harder-hitting for a while). Ally
// reactions build her Devotion.

import { addSpirit, SPIRIT_MAX, addBinding, BINDING_MAX, addGrace, healAround } from './melee.js';
import { buffMembers } from './dungeon.js';

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
// The Sorcerer's chains: how far a reaction reaches to pass its element on, to how many, how strong
// (a share of the hit that set it off), a beat apart, and how long a chain can run (longer and wider
// on Pandemonium). Each link builds Chaos more than the last.
export const CHAIN_R = 150;
export const CHAIN_FAN = 2;
export const CHAIN_FAN_FULL = 3;
export const CHAIN_PCT = 0.6;
export const CHAIN_BEAT = 0.16;
export const CHAIN_MAX = 4;
export const CHAIN_MAX_FULL = 8;
export const CHAOS_GAIN = 5;
export const CHAOS_LINK = 0.6;

const PAIRS = { 'fire+ice': 'steam', 'bolt+ice': 'shatter', 'bolt+fire': 'kaboom' };
export const reactionOf = (a, b) => (a && b && a !== b ? PAIRS[[a, b].sort().join('+')] : null);
// On MELTDOWN a spell with no other mark to meet reacts as if it found the element after its own.
const NEXT = { fire: 'ice', ice: 'bolt', bolt: 'fire' };

export const isQueen = (world) => world.char.job === 'onmyoji';
export const isMedic = (world) => world.char.job === 'shrinemaiden';
// Whose spells react: the Mage's, the Sorcerer's and the Cleric's.
export const isMage = (world) => world.char.job === 'spiritmage' || isQueen(world) || isMedic(world);
export const meltdown = (world) => world.char.job === 'spiritmage' && (world.spirit ?? 0) >= SPIRIT_MAX;
export const pandemonium = (world) => isQueen(world) && (world.binding ?? 0) >= BINDING_MAX;
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

// (A reaction's own hits bring no plain spark: the reaction's picture is the hit.)
function queue(world, m, damage, at, extra = {}) {
  world.pending.push({ at, mob: m, miss: false, damage: Math.max(1, Math.round(damage)), crit: false, fromX: world.body.x, stack: 1, knock: 60, launch: 0, via: 'magic', reaction: true, ownSpark: true, ...extra });
}

export function react(world, m, kind, h) {
  const now = world.now;
  // (The Spell Juggler's reactions are her orbs colliding: render/warrior-fx.js `jgrx*`.)
  const own = isMedic(world) ? 'md' : world.char.job === 'spiritmage' ? 'jg' : world.char.job === 'onmyoji' ? 'mc' : '';
  const fx = (f) => { if (world.fx.filter((o) => o.kind.startsWith('rx')).length < MAX_RX_FX) world.fx.push(f); };
  const base = h.damage;
  const y = m.y - (m.air ?? 0);
  world.reactions = (world.reactions ?? 0) + 1;
  world.lastReaction = { kind, at: now, x: m.x, y };
  world.reactedKinds = { ...world.reactedKinds, [kind]: (world.reactedKinds?.[kind] ?? 0) + 1 };
  if (kind === 'steam') {
    fx({ kind: `${own}rxsteam`, x: m.x, y: m.y, h: m.def.h, r: STEAM_R, t: 0, dur: 0.7, seed: Math.random() });
    for (const o of [m, ...nearby(world, m, STEAM_R)]) queue(world, o, base * STEAM_PCT, now + 0.08, { knock: 40, launch: 30 });
    world.juice.push({ type: 'shake', mag: 1.5, dur: 0.18 });
  } else if (kind === 'shatter') {
    fx({ kind: `${own}rxshatter`, x: m.x, y, h: m.def.h, t: 0, dur: 0.55, seed: Math.random() });
    queue(world, m, base * SHATTER_PCT, now + 0.05, { crit: true, big: true, stun: SHATTER_STUN, knock: 70, stop: 0.08 });
    world.juice.push({ type: 'shake', mag: 2, dur: 0.2 });
  } else {
    // The blast hops from one monster to the next, a beat apart.
    const hit = new Set([m]);
    let from = m;
    fx({ kind: `${own}rxkaboom`, x: m.x, y, h: m.def.h, t: 0, dur: 0.6, seed: Math.random() });
    queue(world, m, base * KABOOM_PCT, now + 0.06, { big: true, knock: 70, launch: 60, stop: 0.06 });
    for (let j = 0; j < KABOOM_JUMPS; j++) {
      const next = nearby(world, from, KABOOM_R, hit)[0];
      if (!next) break;
      hit.add(next);
      const lag = 0.12 * (j + 1);
      fx({ kind: 'rxjump', x: from.x, y: from.y - (from.air ?? 0) - from.def.h / 2, tx: next.x, ty: next.y - (next.air ?? 0) - next.def.h / 2, t: -lag + 0.06, dur: 0.24 });
      fx({ kind: `${own}rxkaboom`, small: true, x: next.x, y: next.y - (next.air ?? 0), h: next.def.h, t: -lag, dur: 0.5, seed: Math.random() });
      queue(world, next, base * KABOOM_PCT * 0.8, now + 0.06 + lag, { knock: 50, launch: 40 });
      from = next;
    }
    world.juice.push({ type: 'shake', mag: 2.5, dur: 0.22 });
  }
  // (A finisher's hits, gauge 0, never refill it.)
  if (isQueen(world)) {
    if (h.gauge !== 0) addBinding(world, CHAOS_GAIN * (1 + CHAIN_LINK_GAIN(h.chain ?? 0)));
    spread(world, m, h);
  } else if (h.gauge !== 0) addSpirit(world, REACT_GAIN, 'react');
}

const CHAIN_LINK_GAIN = (depth) => depth * CHAOS_LINK;

// The Sorcerer's reaction passes its element on to the monsters beside it, a beat later: one that
// carries another mark reacts in turn (and passes it on again); one that carries none is marked.
function spread(world, m, h) {
  const depth = (h.chain ?? 0) + 1;
  const full = pandemonium(world);
  if (depth > (full ? CHAIN_MAX_FULL : CHAIN_MAX)) return;
  const seen = h.seen ?? new Set();
  seen.add(m);
  const el = h.el ?? 'fire';
  const next = nearby(world, m, CHAIN_R, seen).slice(0, full ? CHAIN_FAN_FULL : CHAIN_FAN);
  for (const [i, o] of next.entries()) {
    seen.add(o);
    const at = world.now + CHAIN_BEAT * (1 + i * 0.4);
    world.fx.push({ kind: 'rxchain', el, x: m.x, y: m.y - (m.air ?? 0) - m.def.h / 2, tx: o.x, ty: o.y - (o.air ?? 0) - o.def.h / 2, t: -(at - world.now) + 0.1, dur: 0.3 });
    (world.later ??= []).push({ at, run: () => { if (o.hp > 0) elementHit(world, o, { el, damage: Math.max(1, Math.round(h.damage * CHAIN_PCT)), chain: depth, seen, gauge: h.gauge }); } });
  }
  world.longestChain = Math.max(world.longestChain ?? 0, depth);
}

// ---------- The Cleric's healing reactions ----------
export const ALLY_MARK_TIME = 6;
export const ALLY_GAP = 0.5;
export const SOOTHE_HEAL = 0.12;
export const SOOTHE_REGEN = 0.025;
export const FROST_BARRIER = 0.16;
export const SPARK_SPEED = 25;
export const SPARK_POWER = 12;
export const ALLY_GAIN = 12;
const ALLY_KIND = { steam: 'soothe', shatter: 'frost', kaboom: 'spark' };
const ALLY_LOOK = {
  soothe: { name: 'Soothing Steam', secs: 6, buff: { regenPct: SOOTHE_REGEN } },
  frost: { name: 'Frost Shield', secs: 8, buff: { barrier: FROST_BARRIER } },
  spark: { name: 'Spark Rush', secs: 6, buff: { speed: SPARK_SPEED, watk: SPARK_POWER, matk: SPARK_POWER } },
};
export const allyMarkOf = (world) => {
  const b = world.char.buffs?.mdmark;
  return b && b.until > world.now ? b.el : null;
};

// One of her heals landing with element `el` on her and her party round her.
export function allyElement(world, el) {
  if (!isMedic(world) || !el) return null;
  const now = world.now;
  const mark = allyMarkOf(world);
  const ready = now - (world.allyReactedAt ?? -9) >= ALLY_GAP;
  const kind = ready ? ALLY_KIND[reactionOf(mark, el)] : null;
  if (!kind) {
    world.char.buffs.mdmark = { until: now + ALLY_MARK_TIME, since: now, values: {}, name: 'Marked', el };
    return null;
  }
  delete world.char.buffs.mdmark;
  world.allyReactedAt = now;
  allyReact(world, kind);
  return kind;
}

export function allyReact(world, kind) {
  const { char, body, stats, now } = world;
  const L = ALLY_LOOK[kind];
  world.allyReactions = { ...world.allyReactions, [kind]: (world.allyReactions?.[kind] ?? 0) + 1 };
  const id = `md${kind}`;
  char.buffs[id] = { until: now + L.secs, since: now, values: L.buff, name: L.name };
  if (L.buff.barrier) char.buffs[id].shield = Math.round(stats.maxHp * L.buff.barrier);
  if (kind === 'soothe') healAround(world, body.x, body.y, SOOTHE_HEAL, 240, false);
  if (world.dungeon) buffMembers(world, id, L.name, { buff: L.buff, duration: L.secs }, { x: body.x - 240, y: body.y - 160, w: 480, h: 320 });
  world.fx.push({ kind: `rx${kind}`, x: body.x, y: body.y, t: 0, dur: 0.9 });
  addGrace(world, ALLY_GAIN);
}
