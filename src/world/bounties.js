// Guild bounties (data/bounties.js; Guildmaster Halvard in Coinbridge, ui/bounty.js).
//
// Every day the board has three bounties for your rank, each on a monster of a field near your
// level. Take one and an elite of that kind turns up on its map the next time you're there (one
// at a time, until it falls): bigger, named, crowned, with an aura and its own health bar, far
// tougher (RANKS hp), and with moves of its own:
//   slam    it rears up (a warning) and slams the floor around it
//   charge  it lowers its head and rushes at you along its floor
//   enrage  at half health it turns red and fights faster
// It drops a rare piece of gear of its level. Bring the news to Halvard for gold, EXP and a mark
// on your record; enough marks and you rank up (a title, the rank's guild cape, harder and
// better-paid bounties).
// char.guild = { done, rank, board: { day, list: [...] } }.

import { MAPS } from '../data/maps.js';
import { MOBS } from '../data/mobs.js';
import { RANKS, GUILD_CAPES, EPITHETS } from '../data/bounties.js';
import { spawnMob } from './mobs.js';
import { today } from '../core/quests.js';
import { expToNext } from '../core/exp.js';
import { gainExp } from '../core/character.js';
import { addItem } from '../core/inventory.js';
import { makeEquip } from '../core/items.js';

const SCALE = 1.35;
const CHARGE_EVERY = 7;
const CHARGE_WARN = 0.7;
const CHARGE_TIME = 0.6;

function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export const guildOf = (char) => (char.guild ??= { done: 0, rank: 0, board: null });
export const rankOf = (char) => RANKS[guildOf(char).rank ?? 0];

// Where bounties can be: the fields (no towns, dungeons or private rooms) and the walking monsters
// that live on them, by level.
let HUNTS = null;
function hunts() {
  if (HUNTS) return HUNTS;
  HUNTS = [];
  for (const m of Object.values(MAPS)) {
    if (m.isTown || m.dungeon || m.private || m.trial || !m.spawns?.length || !m.world) continue;
    const seen = new Set();
    for (const s of m.spawns) {
      const def = MOBS[s.mob];
      if (!def || def.boss || def.fly || seen.has(s.mob)) continue;
      seen.add(s.mob);
      HUNTS.push({ map: m.id, mob: s.mob, level: def.level });
    }
  }
  return HUNTS;
}

function makeBoard(char, day) {
  const rng = seeded(`${day}|${char.name ?? ''}|guild`);
  const rank = rankOf(char);
  const lv = Math.min(50, char.level + rank.lv);
  // Near your level, reaching further down until three different fields have something.
  let pool = [];
  for (const reach of [6, 10, 16, 99]) {
    pool = hunts().filter((h) => h.level >= lv - reach && h.level <= lv + 2);
    if (new Set(pool.map((h) => h.map)).size >= 3) break;
  }
  const list = [];
  const used = new Set();
  for (let i = 0; i < 3 && pool.length; i++) {
    const options = pool.filter((h) => !used.has(h.map) && !list.some((b) => b.mob === h.mob));
    const h = (options.length ? options : pool)[Math.floor(rng() * (options.length ? options : pool).length)];
    used.add(h.map);
    const name = EPITHETS[Math.floor(rng() * EPITHETS.length)];
    const gold = Math.round((rank.gold * (0.6 + h.level / 40)) / 10) * 10;
    list.push({ id: `${day}|${i}`, map: h.map, mob: h.mob, name, level: h.level, rank: guildOf(char).rank ?? 0, gold, state: 'open' });
  }
  return list;
}

// Today's board (fresh each day; what you've taken stays on it until it's done).
export function bountyBoard(world) {
  const g = guildOf(world.char);
  const day = today(world.dayClock?.() ?? new Date());
  if (g.board?.day !== day) {
    const keep = (g.board?.list ?? []).filter((b) => b.state === 'active' || b.state === 'slain');
    g.board = { day, list: [...keep, ...makeBoard(world.char, day)].slice(0, 3 + keep.length) };
  }
  return g.board.list;
}

export const bountyName = (b) => `${b.name} the ${MOBS[b.mob].name}`;

export function takeBounty(world, id) {
  const b = bountyBoard(world).find((x) => x.id === id);
  if (!b || b.state !== 'open') return 'That bounty is taken.';
  if (bountyBoard(world).filter((x) => x.state === 'active').length >= 3) return 'Three at a time, adventurer.';
  b.state = 'active';
  world.log(`Bounty taken: ${bountyName(b)}, on ${MAPS[b.map].name}. Go get it!`, '#ffd36b');
  return null;
}

// The elite: the monster, grown, named, and much tougher.
export function eliteDef(b) {
  const base = MOBS[b.mob];
  const rank = RANKS[b.rank ?? 0];
  return {
    ...base,
    name: bountyName(b),
    elite: true,
    scale: SCALE,
    hp: Math.round(base.hp * rank.hp),
    atk: Math.round(base.atk * 1.4),
    acc: base.acc + 10,
    exp: base.exp * 12,
    gold: [base.gold[0] * 8, base.gold[1] * 8],
    aggro: true,
    special: base.special ?? { kind: 'slam', every: 6.5, warn: 1.1, range: Math.round(base.w * SCALE + 50), damage: Math.round(base.atk * 2) },
    // A rare piece of its level's gear, always (signature gear: data/drops.js).
    drops: [...(base.drops ?? []).map((d) => ({ ...d, chance: Math.min(1, d.chance * 3) })), { gear: ['top', 'bottom', 'hat', 'shoes', 'gloves', 'cape'][Math.floor(Math.random() * 6)], chance: 1 }],
  };
}

// Each tick on a field: an active bounty's elite turns up (a few seconds in, at one of its kind's
// spots), and the elites on the map use their moves.
export function tickBounties(world, dt) {
  const map = world.map;
  if (map.isTown || map.dungeon) return;
  const g = world.char.guild;
  const want = g?.board?.list?.find((b) => b.state === 'active' && b.map === map.id);
  if (want && !world.mobs.some((m) => m.bounty === want.id && m.hp > 0)) {
    world.eliteIn = (world.eliteIn ?? 3) - dt;
    if (world.eliteIn <= 0) {
      world.eliteIn = 3;
      const spots = map.spawns.filter((s) => s.mob === want.mob);
      const far = spots.filter((s) => Math.abs(s.x - world.body.x) > 260);
      const at = (far.length ? far : spots)[Math.floor(Math.random() * (far.length ? far : spots).length)];
      if (at) {
        const m = spawnMob(map, at);
        m.def = eliteDef(want);
        m.hp = m.def.hp;
        m.special = { timer: m.def.special.every, warn: 0 };
        m.bounty = want.id;
        m.chargeIn = CHARGE_EVERY;
        world.mobs.push(m);
        world.log(`${m.def.name} prowls ${map.name}...`, '#ff9a6a');
      }
    }
  } else world.eliteIn = 3;
  for (const m of world.mobs) if (m.def.elite && m.hp > 0) eliteMoves(world, m, dt);
}

// The charge and the rage.
function eliteMoves(world, m, dt) {
  if (!m.enraged && m.hp <= m.def.hp / 2) {
    m.enraged = true;
    m.def = { ...m.def, speed: m.def.speed * 1.5, atk: Math.round(m.def.atk * 1.2), special: { ...m.def.special, every: m.def.special.every * 0.7 } };
    world.log(`${m.def.name} flies into a rage!`, '#ff6b6b');
    world.juice?.push({ type: 'shake', mag: 3, dur: 0.3 });
  }
  if (m.special?.warn > 0 || m.stagger > 0) return;
  const b = world.body;
  const near = Math.abs(b.x - m.x) < 300 && Math.abs(b.y - m.y) < 30;
  if (m.charging > 0) {
    m.charging -= dt;
    m.x = Math.max(m.x1, Math.min(m.x2, m.x + m.chargeDir * m.def.speed * 5 * dt));
    m.state = 'walk';
    return;
  }
  if (m.chargeWarn > 0) {
    m.chargeWarn -= dt;
    m.windup = m.chargeWarn;
    if (m.chargeWarn <= 0) {
      m.charging = CHARGE_TIME;
      m.chargeDir = Math.sign(b.x - m.x) || m.dir;
      m.dir = m.chargeDir;
    }
    return;
  }
  m.chargeIn = (m.chargeIn ?? CHARGE_EVERY) - dt;
  if (m.chargeIn <= 0 && near) {
    m.chargeIn = CHARGE_EVERY * (m.enraged ? 0.7 : 1);
    m.chargeWarn = CHARGE_WARN;
  }
}

// An elite fell (world.js killMob): its bounty is ready to bring in.
export function eliteSlain(world, m) {
  const b = world.char.guild?.board?.list?.find((x) => x.id === m.bounty);
  if (!b || b.state !== 'active') return;
  b.state = 'slain';
  world.log(`You brought down ${b.name}! Tell Guildmaster Halvard in Coinbridge.`, '#ffe36b');
}

// Hands a slain bounty in: gold, EXP (an eighth of a level), a mark, maybe a rank. Returns why not.
export function turnIn(world, id) {
  const char = world.char;
  const g = guildOf(char);
  const b = bountyBoard(world).find((x) => x.id === id);
  if (!b || b.state !== 'slain') return 'Bring it down first.';
  b.state = 'done';
  char.gold += b.gold;
  const exp = Math.round(expToNext(char.level) * 0.12);
  gainExp(char, exp);
  g.done = (g.done ?? 0) + 1;
  world.log(`Bounty done: ${bountyName(b)}. ${b.gold.toLocaleString()} gold and ${exp.toLocaleString()} EXP.`, '#ffe36b');
  // A new rank?
  const next = RANKS[(g.rank ?? 0) + 1];
  if (next && g.done >= next.need) {
    g.rank = (g.rank ?? 0) + 1;
    promote(world, next);
  }
  return null;
}

// Joining (Copper), or a new rank: its title and its cape.
export function promote(world, rank) {
  const char = world.char;
  if (!(char.titles ??= []).includes(rank.title)) char.titles.push(rank.title);
  char.title = rank.title;
  const cape = GUILD_CAPES[rank.key];
  if (cape) addItem(char.inventory, makeEquip(cape.id));
  world.log(`You are now a ${rank.title}! Halvard hands you the ${cape.name}.`, rank.color);
  world.fx?.push({ kind: 'levelup', x: world.body.x, y: world.body.y, t: 0, dur: 1.6 });
}

// Signing up at the guild (the first time you look at the board).
export function joinGuild(world) {
  const g = guildOf(world.char);
  if (g.joined) return false;
  g.joined = true;
  promote(world, RANKS[0]);
  return true;
}
