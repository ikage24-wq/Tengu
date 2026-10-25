// The running game: one character in one map. Owns physics, monsters, loot, combat, and events.
// Rendering and UI read this state; they never change it except through the action functions below.

import { getMap } from '../data/maps.js';
import { ITEMS, RARITIES } from '../data/items.js';
import { QUESTS } from '../data/quests.js';
import { SKILLS } from '../data/skills.js';
import { computeStats } from '../core/stats.js';
import { gainExp, usePotion, applyDeath } from '../core/character.js';
import { addItem, countItem, removeItem } from '../core/inventory.js';
import { recordKill } from '../core/quests.js';
import { avoid, mobHitChance, damageTaken } from '../core/formulas.js';
import { createBody, stepBody, knockBack } from './physics.js';
import { createSpawner, tickSpawner, updateMob, hitMob, mobBox } from './mobs.js';
import { rollLoot, spawnDrops, updateDrops, dropInReach } from './drops.js';
import { cast, summonStrike, summonPosition, weaponElement } from './combat.js';
import { nextJobs } from '../data/jobs.js';

const INVULN = 1.2;
const REGEN_EVERY = 5;
const TALK_RANGE = 34;
const PORTAL_RANGE = 22;

export function createWorld(char) {
  const world = {
    char,
    map: null,
    body: null,
    spawner: null,
    mobs: [],
    drops: [],
    pending: [],
    fx: [],
    numbers: [],
    messages: [],
    events: [],
    // Game-feel cues for the renderer (dust, sparks, screen shake). Purely visual.
    juice: [],
    hitstop: 0,
    attackTimer: 0,
    lockTimer: 0,
    pose: null,
    invuln: 0,
    now: 0,
    stats: computeStats(char, 0),
    dead: false,
    regenTimer: REGEN_EVERY,
    stillTime: 0,
    lootTimer: 0,
    warnTimer: 0,
    log(text, color = '#fff9ee') {
      world.messages.push({ text, color, t: 6 });
      if (world.messages.length > 7) world.messages.shift();
    },
  };
  loadMap(world, char.mapId, char.portal ?? 'start');
  return world;
}

function findPortal(map, id) {
  return map.portals.find((p) => p.id === id) ?? map.portals.find((p) => p.id === 'start') ?? map.portals[0];
}

export function loadMap(world, mapId, portalId) {
  const map = getMap(mapId);
  const portal = findPortal(map, portalId);
  world.map = map;
  world.char.mapId = map.id;
  world.char.portal = portal.id;
  world.body = createBody(portal.x, portal.y);
  world.spawner = createSpawner(map);
  world.mobs = tickSpawner(world.spawner, map, world.now);
  world.drops = [];
  world.pending = [];
  world.fx = [];
  world.numbers = [];
  world.events.push({ type: 'map', mapId: map.id });
}

function townOf(world) {
  return world.map.town ?? 'sprout';
}

export function returnToTown(world) {
  loadMap(world, townOf(world), 'start');
}

// ---------- Fast travel between towns ----------

// Steps between two maps along the portal roads.
export function hops(from, to) {
  const seen = new Set([from]);
  let frontier = [from];
  for (let d = 0; frontier.length; d++) {
    if (frontier.includes(to)) return d;
    const next = [];
    for (const id of frontier) {
      for (const p of getMap(id).portals) {
        if (!p.to || seen.has(p.to)) continue;
        seen.add(p.to);
        next.push(p.to);
      }
    }
    frontier = next;
  }
  return Infinity;
}

// Flying between towns costs a little gold per road on the way.
export function travelCost(fromId, townId) {
  return fromId === townId ? 0 : 20 * Math.min(8, hops(fromId, townId));
}

// Travel is only offered from a town. Returns a reason string when it can't happen.
export function travelTo(world, townId) {
  if (!world.map.isTown) return 'Fast travel leaves from towns.';
  if (world.map.id === townId) return 'You are already here.';
  const cost = travelCost(world.map.id, townId);
  if (world.char.gold < cost) return `You need ${cost} gold.`;
  world.char.gold -= cost;
  loadMap(world, townId, 'start');
  world.log(`You fly to ${getMap(townId).name}!`, '#bff0dc');
  return null;
}

// ---------- Actions the UI can trigger ----------

export function useItem(world, id) {
  const def = ITEMS[id];
  if (!def) return false;
  if (def.effect?.returnTown) {
    if (removeItem(world.char.inventory, id, 1) < 1) return false;
    world.log(`Returning to ${getMap(townOf(world)).name}.`, '#bff0dc');
    returnToTown(world);
    return true;
  }
  if (!usePotion(world.char, id, world.now)) {
    world.log(`No ${def.name} left.`, '#ffb3c6');
    return false;
  }
  world.fx.push({ kind: 'potion', x: world.body.x, y: world.body.y, t: 0, dur: 0.5, color: def.color });
  return true;
}

export function respawn(world) {
  const loss = applyDeath(world.char);
  world.dead = false;
  world.invuln = 3;
  returnToTown(world);
  world.log(loss > 0 ? `You wake up in town. Lost ${loss} EXP.` : 'You wake up in town.', '#ffb3c6');
}

function pickUp(world) {
  const d = dropInReach(world.drops, world.body);
  if (!d) return false;
  const char = world.char;
  if (d.kind === 'gold') {
    char.gold += d.amount;
    world.numbers.push({ x: d.x, y: d.y - 14, text: `+${d.amount}g`, color: '#ffd66b', t: 0 });
  } else {
    const ok = d.inst ? addItem(char.inventory, d.inst) : addItem(char.inventory, d.id, d.qty);
    if (!ok) {
      world.log('Your bag is full.', '#ffb3c6');
      return false;
    }
    const def = ITEMS[d.inst ? d.inst.id : d.id];
    const rarity = d.inst?.rarity ? RARITIES[d.inst.rarity] : null;
    if (rarity) world.log(`Picked up a ${rarity.name} ${def.name}!`, rarity.color);
    else world.log(`Picked up ${def.name}${d.qty > 1 ? ` x${d.qty}` : ''}.`, def.color);
    if (rarity || def.unique) world.juice.push({ type: 'loot', x: d.x, y: d.y, color: rarity?.color ?? '#ff9ec0' });
    // Show progress for any active quest that collects this item.
    for (const [qid, rec] of Object.entries(char.quests)) {
      if (rec.state !== 'active') continue;
      const goal = QUESTS[qid].objectives.find((o) => o.type === 'collect' && o.item === def.id);
      if (goal) world.log(`${QUESTS[qid].name}: ${Math.min(goal.count, countItem(char.inventory, def.id))}/${goal.count} ${def.name}`, '#bff0dc');
    }
  }
  world.drops = world.drops.filter((x) => x !== d);
  return true;
}

// Up near a portal travels; Up near an NPC starts a conversation.
function interact(world) {
  const b = world.body;
  if (!b.onGround) return false;
  const portal = world.map.portals.find((p) => !p.hidden && Math.abs(p.x - b.x) < PORTAL_RANGE && Math.abs(p.y - b.y) < 6);
  if (portal) {
    loadMap(world, portal.to, portal.toPortal);
    world.log(`Entered ${world.map.name}.`, '#cfe8ff');
    return true;
  }
  const npc = world.map.npcs.find((n) => Math.abs(n.x - b.x) < TALK_RANGE && Math.abs(world.map.groundY - b.y) < 6);
  if (npc) {
    world.events.push({ type: 'talk', npc: npc.id });
    return true;
  }
  return false;
}

export function nearbyNpc(world) {
  const b = world.body;
  return world.map.npcs.find((n) => Math.abs(n.x - b.x) < TALK_RANGE && Math.abs(world.map.groundY - b.y) < 6) ?? null;
}

const BLOCKER_TEXT = {
  mp: 'Not enough MP.',
  busy: null,
  weapon: "That skill needs a different weapon.",
  unlearned: null,
  passive: null,
};

function useHotkey(world, binding) {
  if (binding.skill) {
    const r = cast(world, binding.skill);
    if (!r.ok && BLOCKER_TEXT[r.reason] && world.warnTimer <= 0) {
      world.log(BLOCKER_TEXT[r.reason], '#ffb3c6');
      world.warnTimer = 1.5;
    }
  } else if (binding.item) {
    useItem(world, binding.item);
  }
}

// ---------- Kills, damage, and events ----------

function killMob(world, m) {
  const char = world.char;
  const levels = gainExp(char, m.def.exp);
  world.numbers.push({ x: m.x, y: m.y - m.def.h - 18, text: `+${m.def.exp} EXP`, color: '#ffe36b', t: 0, small: true });
  for (const qid of recordKill(char, m.def.id)) {
    const goal = QUESTS[qid].objectives.find((o) => o.type === 'kill' && o.mob === m.def.id);
    world.log(`${QUESTS[qid].name}: ${char.quests[qid].kills[m.def.id]}/${goal.count} ${m.def.name}`, '#bff0dc');
  }
  world.drops.push(...spawnDrops(rollLoot(m.def), m.x, m.y));
  world.juice.push({ type: 'kill', x: m.x, y: m.y, w: m.def.w, h: m.def.h, boss: Boolean(m.def.boss) });
  world.hitstop = Math.max(world.hitstop, m.def.boss ? 0.3 : 0.045);
  if (levels > 0) {
    world.events.push({ type: 'levelup', level: char.level });
    world.fx.push({ kind: 'levelup', x: world.body.x, y: world.body.y, t: 0, dur: 1.6 });
    world.log(`Level up! You are now level ${char.level}.`, '#ffe36b');
    if (nextJobs(char.job, char.level).some((j) => j.level === char.level)) {
      world.log('A new job is ready! Visit your instructor in their home town (M opens the world map).', '#ffe36b');
    }
  }
  if (m.def.boss) world.log(`${m.def.name} has been defeated!`, '#ffe36b');
}

function hurtPlayer(world, rawAtk, fromX) {
  if (world.god) return;
  const char = world.char;
  const s = world.stats;
  let dmg = damageTaken(rawAtk, s.wdef);
  if (s.manaShield > 0) {
    const toMp = Math.min(char.mp, Math.floor(dmg * s.manaShield));
    char.mp -= toMp;
    dmg -= toMp;
  }
  char.hp = Math.max(0, char.hp - dmg);
  world.numbers.push({ x: world.body.x, y: world.body.y - world.body.h - 6, text: `${dmg}`, color: '#ff6b8a', t: 0 });
  world.invuln = INVULN;
  world.juice.push({ type: 'hurt', x: world.body.x, y: world.body.y - world.body.h / 2 });
  knockBack(world.body, fromX);
  if (char.hp <= 0 && !world.dead) {
    world.dead = true;
    world.events.push({ type: 'death' });
    world.log('You fainted...', '#ff6b8a');
  }
}

function playerBox(b) {
  return { x: b.x - b.w / 2, y: b.y - b.h, w: b.w, h: b.h };
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// ---------- Main update ----------

// input: { held: Set<code>, pressed: Set<code>, locked: bool } (locked while a menu has focus)
export function updateWorld(world, dt, input) {
  const char = world.char;
  // Without a renderer draining it (tests, background tabs), keep the cue queue short.
  if (world.juice.length > 200) world.juice.length = 0;
  world.now += dt;
  world.attackTimer = Math.max(0, world.attackTimer - dt);
  world.lockTimer = Math.max(0, (world.lockTimer ?? 0) - dt);
  world.invuln = Math.max(0, world.invuln - dt);
  world.warnTimer = Math.max(0, world.warnTimer - dt);
  world.lootTimer = Math.max(0, world.lootTimer - dt);
  if (world.pose) {
    world.pose.t -= dt;
    if (world.pose.t <= 0) world.pose = null;
  }

  // Buffs: drop expired ones with a note.
  for (const [id, b] of Object.entries(char.buffs)) {
    if (b.until <= world.now) {
      delete char.buffs[id];
      world.log(`${SKILLS[id]?.name ?? 'Buff'} wore off.`, '#d4cbe8');
    }
  }
  world.stats = computeStats(char, world.now);
  char.hp = Math.min(char.hp, world.stats.maxHp);
  char.mp = Math.min(char.mp, world.stats.maxMp);

  // Summons attack on their own timers; with nothing in range they check again shortly.
  let summonIndex = 0;
  for (const b of Object.values(char.buffs)) {
    if (!b.summon) continue;
    const from = summonPosition(world, summonIndex++);
    b.summon.timer -= dt;
    if (b.summon.timer <= 0 && !world.dead) {
      b.summon.timer = summonStrike(world, b.summon, from) ? b.summon.every : 0.25;
    }
  }

  // ----- Player control -----
  const held = input.locked || world.dead ? new Set() : input.held;
  const pressed = input.locked || world.dead ? new Set() : input.pressed;
  const intent = {
    left: held.has('ArrowLeft'),
    right: held.has('ArrowRight'),
    up: held.has('ArrowUp'),
    down: held.has('ArrowDown'),
    jump: held.has('Space') || held.has('AltLeft') || held.has('AltRight'),
  };
  // Attacking roots you on the ground, like the classics.
  const rooted = (world.attackTimer > 0.15 || world.lockTimer > 0) && world.body.onGround;
  const bodyIntent = rooted ? { ...intent, left: false, right: false, jump: false } : intent;
  const wasX = world.body.x;
  if (!(pressed.has('ArrowUp') && interact(world))) {
    stepBody(world.body, world.map, bodyIntent, dt, world.stats);
  }
  world.stillTime = Math.abs(world.body.x - wasX) < 0.01 && world.body.onGround ? world.stillTime + dt : 0;

  if (!world.body.rope) {
    // Attacks fire on a fresh press too, so a tap shorter than a frame still counts.
    const attackKey = ['KeyZ', 'ControlLeft', 'ControlRight'].some((k) => held.has(k) || pressed.has(k));
    if (attackKey) cast(world, null);
    for (const [code, binding] of Object.entries(char.hotkeys)) {
      if (!binding) continue;
      // Attack skills repeat while held; everything else fires once per press.
      const repeat = binding.skill && ['attack', 'magic'].includes(SKILLS[binding.skill]?.type);
      if (pressed.has(code) || (repeat && held.has(code))) useHotkey(world, binding);
    }
  } else {
    for (const [code, binding] of Object.entries(char.hotkeys)) {
      if (binding?.item && pressed.has(code)) useHotkey(world, binding);
    }
  }
  if (held.has('KeyX') && world.lootTimer <= 0 && pickUp(world)) world.lootTimer = 0.12;

  // ----- Queued hits -----
  const due = world.pending.filter((h) => h.at <= world.now);
  world.pending = world.pending.filter((h) => h.at > world.now);
  for (const h of due) {
    const m = h.mob;
    if (m.hp <= 0) continue;
    const top = m.y - m.def.h - 8 - h.stack * 15;
    if (h.miss) {
      world.numbers.push({ x: m.x, y: top, text: 'MISS', color: '#d4cbe8', t: 0 });
      continue;
    }
    world.numbers.push({ x: m.x, y: top, text: `${h.damage}`, color: h.crit ? '#ffb347' : '#fff6fb', t: 0, crit: h.crit });
    world.fx.push({ kind: 'spark', x: m.x, y: m.y - m.def.h / 2, t: 0, dur: 0.25, crit: h.crit });
    world.juice.push({ type: 'hit', x: m.x, y: m.y - m.def.h / 2, crit: h.crit, dir: Math.sign(m.x - h.fromX) || 1 });
    // Endgame weapons add an elemental impact on every hit.
    const element = weaponElement(char);
    if (element) world.fx.push({ kind: 'impact', element, x: m.x, y: m.y, h: m.def.h, t: 0, dur: 0.4, seed: Math.random() });
    // Spell shots burst where they land.
    if (h.burst === 'fire' || h.burst === 'holy') world.fx.push({ kind: 'impact', element: h.burst, x: m.x, y: m.y, h: m.def.h, t: 0, dur: 0.45, seed: Math.random() });
    else if (h.burst) world.fx.push({ kind: h.burst, x: m.x, y: m.y, h: m.def.h, t: 0, dur: 0.45, seed: Math.random() });
    if (h.crit) world.hitstop = Math.max(world.hitstop, 0.03);
    if (hitMob(m, h.damage, h.fromX, world.now)) {
      killMob(world, m);
      continue;
    }
    // Ice freezes monsters in place (bosses shrug it off twice as fast); venom keeps biting.
    if (h.freeze) {
      const secs = m.def.boss ? h.freeze / 2 : h.freeze;
      if (!(m.frozenUntil > world.now)) world.fx.push({ kind: 'freeze', x: m.x, y: m.y, h: m.def.h, w: m.def.w, t: 0, dur: 0.5 });
      m.frozenUntil = Math.max(m.frozenUntil ?? 0, world.now + secs);
    }
    if (h.poison) m.poison = { until: world.now + h.poison.secs, dmg: Math.max(1, Math.round(h.damage * h.poison.pct)), tick: m.poison?.tick ?? 1 };
  }

  // Poison ticks once a second, in green, and can finish a monster off.
  for (const m of world.mobs) {
    if (!m.poison || m.hp <= 0) continue;
    if (m.poison.until <= world.now) {
      m.poison = null;
      continue;
    }
    m.poison.tick -= dt;
    if (m.poison.tick > 0) continue;
    m.poison.tick = 1;
    m.hp = Math.max(0, m.hp - m.poison.dmg);
    world.numbers.push({ x: m.x + 8, y: m.y - m.def.h - 4, text: `${m.poison.dmg}`, color: '#9be86b', t: 0, small: true });
    world.fx.push({ kind: 'poisonpuff', x: m.x, y: m.y, h: m.def.h, t: 0, dur: 0.6, seed: Math.random() });
    if (m.hp <= 0) killMob(world, m);
  }

  // ----- Monsters -----
  const pbox = playerBox(world.body);
  for (const m of world.mobs) {
    const event = updateMob(m, world.body, dt, world.now);
    if (event === 'slam') {
      world.fx.push({ kind: 'slam', x: m.x, y: m.y, t: 0, dur: 0.6, range: m.def.special.range });
      world.juice.push({ type: 'shake', mag: 6, dur: 0.5 }, { type: 'slam', x: m.x, y: m.y, range: m.def.special.range });
      const onFloor = world.body.onGround && world.body.surface?.ground;
      if (onFloor && Math.abs(world.body.x - m.x) < m.def.special.range && !world.dead) hurtPlayer(world, m.def.special.damage, m.x);
    }
    if (m.hp <= 0 || world.dead || world.invuln > 0 || m.frozenUntil > world.now) continue;
    if (!overlaps(pbox, mobBox(m))) continue;
    if (Math.random() < mobHitChance(m.def.acc, avoid(world.stats))) {
      hurtPlayer(world, m.def.atk, m.x);
    } else {
      world.numbers.push({ x: world.body.x, y: world.body.y - world.body.h - 6, text: 'MISS', color: '#d4cbe8', t: 0 });
      world.invuln = 0.5;
    }
  }
  world.mobs.push(...tickSpawner(world.spawner, world.map, world.now));
  world.mobs = world.mobs.filter((m) => m.hp > 0 || m.dying < 0.5);

  world.drops = updateDrops(world.drops, world.map, dt);

  // ----- Regeneration -----
  world.regenTimer -= dt;
  if (world.regenTimer <= 0 && !world.dead) {
    world.regenTimer = REGEN_EVERY;
    const resting = world.stillTime > 2 ? 1 : 0;
    const townBonus = world.map.isTown ? 2 : 1;
    const s = world.stats;
    char.hp = Math.min(s.maxHp, char.hp + (3 + Math.floor(char.level / 4) + resting * (10 + s.restRegen)) * townBonus);
    char.mp = Math.min(s.maxMp, char.mp + (2 + Math.floor(s.int / 20) + s.mpRegen + resting * (6 + s.restRegen)) * townBonus);
  }

  // ----- Visual timers -----
  for (const f of world.fx) f.t += dt;
  world.fx = world.fx.filter((f) => f.t < f.dur);
  for (const n of world.numbers) n.t += dt;
  world.numbers = world.numbers.filter((n) => n.t < 1.1);
  for (const msg of world.messages) msg.t -= dt;
  world.messages = world.messages.filter((msg) => msg.t > 0);
}
