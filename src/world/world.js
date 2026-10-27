// The running game: one character in one map. Owns physics, monsters, loot, combat, and events.
// Rendering and UI read this state; they never change it except through the action functions below.

import { getMap } from '../data/maps.js';
import { ITEMS, RARITIES } from '../data/items.js';
import { itemName, itemColors } from '../core/items.js';
import { QUESTS } from '../data/quests.js';
import { SKILLS } from '../data/skills.js';
import { computeStats } from '../core/stats.js';
import { gainExp, usePotion, applyDeath } from '../core/character.js';
import { addItem, countItem, removeItem } from '../core/inventory.js';
import { recordKill } from '../core/quests.js';
import { avoid, mobHitChance, damageTaken } from '../core/formulas.js';
import { createBody, stepBody, knockBack, groundAt } from './physics.js';
import { createSpawner, tickSpawner, updateMob, hitMob, mobBox } from './mobs.js';
import { rollLoot, spawnDrops, updateDrops, dropInReach, dropFromHero } from './drops.js';
import { cast, summonStrike, summonPosition, weaponElement } from './combat.js';
import { tickMelee, faithGuard, addAim, hasRage, hasFaith, hasShadow, hasIntent, unbroken, loseMomentum } from './melee.js';
import { JOBS, nextJobs } from '../data/jobs.js';
import { DUNGEONS } from '../data/dungeons.js';
import { tickDisco } from './discoboss.js';
import { onMapLoaded, tickDungeon, noteHit, onMobKilled, dungeonInteract, portalSealed, absorb, cutOf } from './dungeon.js';

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
    strikes: [],
    // The job gauges (see melee.js): a Warrior's Valor, an Archer's Momentum, a Berserker's Rage,
    // a Paladin's Faith.
    valor: 0,
    momentum: 0,
    shadow: 0,
    killintent: 0,
    bloom: 0,
    starlight: 0,
    rage: 0,
    faith: 0,
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
  world.strikes = [];
  world.lunge = null;
  world.fx = [];
  world.numbers = [];
  world.channel = null;
  world.events.push({ type: 'map', mapId: map.id });
  onMapLoaded(world);
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

// Drops `qty` of the bag item in cell `index` of a tab onto the ground in front of the hero, where
// it lies like any loot (and vanishes the same way if left). Cash items are bound to you and
// can't be dropped. Returns true when something dropped.
export function dropItem(world, tab, index, qty = Infinity) {
  const char = world.char;
  const list = char.inventory[tab];
  const entry = list?.[index];
  if (!entry || world.dead) return false;
  if (tab === 'cash') {
    world.log("Cash items are yours to keep: they can't be dropped.", '#ffb3c6');
    return false;
  }
  let item;
  if (entry.uid != null) {
    list.splice(index, 1);
    item = { inst: entry };
  } else {
    const n = Math.max(1, Math.min(entry.qty, Math.floor(qty)));
    entry.qty -= n;
    if (entry.qty <= 0) list.splice(index, 1);
    item = { id: entry.id, qty: n };
  }
  const b = world.body;
  world.drops.push(dropFromHero(item, b.x, b.y, b.facing ?? 1));
  world.log(`Dropped ${itemName(item.inst ?? item.id)}${item.qty > 1 ? ` x${item.qty}` : ''}.`, '#d4cbe8');
  return true;
}

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

function pickUp(world, manual = true) {
  const d = dropInReach(world.drops, world.body, manual);
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
    // The HUD flies the item's icon from here into the Bag button.
    world.pickups = (world.pickups ?? []).filter((f) => world.now - f.at < 2);
    world.pickups.push({ id: def.id, variant: d.inst?.variant ?? null, x: d.x, y: d.y - 8, at: world.now });
    const rarity = d.inst?.rarity ? RARITIES[d.inst.rarity] : null;
    const name = itemName(d.inst ?? d.id);
    if (rarity) world.log(`Picked up a ${rarity.name} ${name}!`, rarity.color);
    else world.log(`Picked up ${name}${d.qty > 1 ? ` x${d.qty}` : ''}.`, d.inst ? itemColors(d.inst).main : def.color);
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
  if (world.dungeon && dungeonInteract(world)) return true;
  const portal = world.map.portals.find((p) => !p.hidden && Math.abs(p.x - b.x) < PORTAL_RANGE && Math.abs(p.y - b.y) < 6);
  // A dungeon door sends you to its warden to form a group; a sealed exit waits for the room.
  if (portal?.dungeon && !world.dungeon) {
    world.events.push({ type: 'talk', npc: DUNGEONS[portal.dungeon].warden });
    return true;
  }
  if (portal && portalSealed(world, portal)) {
    if (world.warnTimer <= 0) world.log('Roots seal the way. Clear the room first!', '#ffb3c6');
    world.warnTimer = 1;
    return true;
  }
  if (portal) {
    loadMap(world, portal.to, portal.toPortal);
    world.log(`Entered ${world.map.name}.`, '#cfe8ff');
    return true;
  }
  const npc = world.map.npcs.find((n) => Math.abs(n.x - b.x) < TALK_RANGE && Math.abs(groundAt(world.map, n.x) - b.y) < 6);
  if (npc) {
    world.events.push({ type: 'talk', npc: npc.id });
    return true;
  }
  return false;
}

export function nearbyNpc(world) {
  const b = world.body;
  return world.map.npcs.find((n) => Math.abs(n.x - b.x) < TALK_RANGE && Math.abs(groundAt(world.map, n.x) - b.y) < 6) ?? null;
}

// The hit counter: every hit you land within this many seconds of the last adds one; a pause
// lets it drop (it's for show and for Links; finishers need a full path gauge instead).
export const HITS_WINDOW = 3;

const BLOCKER_TEXT = {
  mp: 'Not enough MP.',
  busy: null,
  weapon: "That skill needs a different weapon.",
  noone: 'No fallen party member nearby.',
  stars: 'You need throwing stars! Shops sell them.',
  rage: 'Not enough Rage. Land some blows first!',
  'gauge:valor': 'A finisher needs full Valor. Keep fighting, the more at once the better!',
  'gauge:momentum': 'A finisher needs full Momentum. Land your shots and keep out of harm!',
  'gauge:bloom': 'A finisher needs full Bloom. Land your spells and heal!',
  'gauge:killintent': 'A finisher needs full Killing Intent. Strike from behind and land critical hits!',
  'gauge:starlight': 'A finisher needs full Starlight. Pile your stars onto one target!',
  'gauge:shadow': 'A finisher needs full Shadow. Keep your hits coming fast!',
  'gauge:rage': 'A finisher needs full Rage. Keep swinging!',
  'gauge:faith': 'A finisher needs full Faith. Keep fighting!',
  'gauge:gale': 'A finisher needs a full Gale. Keep your arrows landing!',
  'gauge:focus': 'A finisher needs full Focus. Stand steady and keep firing!',
  unlearned: null,
  passive: null,
};

const REPEAT_AFTER = 0.4; // seconds a skill key is held before it starts repeating

function useHotkey(world, binding, fresh = true) {
  if (binding.skill) {
    const r = cast(world, binding.skill);
    // Pressed mid-swing: it goes off as soon as the swing allows. Only a fresh press is
    // remembered; holding the key just keeps trying, so one press never fires twice.
    if (r.reason === 'busy' && fresh) world.skillBuffer = { binding, until: world.now + 0.3 };
    else if (r.ok) world.skillBuffer = null;
    if (!r.ok && BLOCKER_TEXT[r.reason] && world.warnTimer <= 0) {
      world.log(BLOCKER_TEXT[r.reason], '#ffb3c6');
      world.juice.push({ type: 'denied' });
      world.warnTimer = 1.5;
    }
  } else if (binding.item) {
    useItem(world, binding.item);
  }
}

// ---------- Kills, damage, and events ----------

// `byParty` is a kill by a party member: you get a share of the EXP. Your own kills get a bonus for
// each party member with you.
// Gear the hero's job can wear (level aside): its own job set, and weapons it can use.
function fitsJob(char, def) {
  const job = JOBS[char.job];
  if (def.family) return def.family === job.family || (def.starter && char.job === 'novice');
  return def.slot !== 'weapon' || job.weapons.includes(def.weaponType);
}

function killMob(world, m, byParty = false) {
  const char = world.char;
  const exp = Math.round(m.def.exp * (byParty ? 0.6 : 1 + 0.1 * (world.partySize ?? 0)));
  const levels = gainExp(char, exp);
  world.numbers.push({ x: m.x, y: m.y - m.def.h - 18, text: `+${exp} EXP${byParty ? ' (party)' : ''}`, color: '#ffe36b', t: 0, small: true });
  world.onKill?.(m);
  onMobKilled(world, m);
  for (const qid of recordKill(char, m.def.id)) {
    const goal = QUESTS[qid].objectives.find((o) => o.type === 'kill' && o.mob === m.def.id);
    world.log(`${QUESTS[qid].name}: ${char.quests[qid].kills[m.def.id]}/${goal.count} ${m.def.name}`, '#bff0dc');
  }
  world.drops.push(...spawnDrops(rollLoot(m.def, Math.random, (d) => fitsJob(char, d)), m.x, m.y));
  world.juice.push({ type: 'kill', x: m.x, y: m.y, w: m.def.w, h: m.def.h, boss: Boolean(m.def.boss) });
  // A boss falls with a short stop; its weight comes from the slow motion and flash after (see
  // render/particles.js).
  world.hitstop = Math.max(world.hitstop, m.def.boss ? 0.12 : 0.045);
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

export function hurtPlayer(world, rawAtk, fromX) {
  if (world.god) return;
  const char = world.char;
  const s = world.stats;
  let dmg = absorb(world, world.body, char.buffs, Math.round(damageTaken(rawAtk, s.wdef) * (1 - cutOf(char.buffs, world.now)) * (1 - faithGuard(world))));
  if (s.manaShield > 0) {
    const toMp = Math.min(char.mp, Math.floor(dmg * s.manaShield));
    char.mp -= toMp;
    dmg -= toMp;
  }
  char.hp = Math.max(0, char.hp - dmg);
  world.numbers.push({ x: world.body.x, y: world.body.y - world.body.h - 6, text: `${dmg}`, color: '#ff6b8a', t: 0 });
  world.invuln = INVULN;
  world.juice.push({ type: 'hurt', x: world.body.x, y: world.body.y - world.body.h / 2 });
  // Unbroken (full Valor), nothing knocks a Warrior back; a hit breaks an Archer's Momentum.
  if (!unbroken(world)) knockBack(world.body, fromX);
  loseMomentum(world);
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
  // The window runs from your last hit, but never drops the count mid-move (long finishers).
  if (world.hits && !world.pose && world.now - world.hitsAt > HITS_WINDOW) world.hits = 0;
  if (world.pose) {
    world.pose.t -= dt;
    if (world.pose.t <= 0) {
      world.lastPose = { ...world.pose, endedAt: world.now };
      world.pose = null;
    }
  }

  // Buffs: drop expired ones with a note.
  for (const [id, b] of Object.entries(char.buffs)) {
    if (b.until <= world.now) {
      delete char.buffs[id];
      world.log(`${SKILLS[id]?.name ?? 'Buff'} wore off.`, '#d4cbe8');
    }
  }
  // Renew: a share of max HP back every second.
  for (const b of Object.values(char.buffs)) {
    if (!b.values?.regenPct || world.dead) continue;
    b.tick = (b.tick ?? 1) - dt;
    if (b.tick > 0) continue;
    b.tick = 1;
    const add = Math.min(world.stats.maxHp - char.hp, Math.round(world.stats.maxHp * b.values.regenPct));
    if (add <= 0) continue;
    char.hp += add;
    world.numbers.push({ x: world.body.x, y: world.body.y - world.body.h - 10, text: `+${add}`, color: '#9be08f', t: 0, small: true });
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
  // A boss cutscene takes the controls; Space, Enter or Escape skips it.
  if (world.cutscene && ['Space', 'Enter', 'Escape'].some((k) => input.pressed?.has(k))) world.cutSkip = true;
  const held = input.locked || world.dead || world.cutscene ? new Set() : input.held;
  const pressed = input.locked || world.dead || world.cutscene ? new Set() : input.pressed;
  const intent = {
    left: held.has('ArrowLeft'),
    right: held.has('ArrowRight'),
    up: held.has('ArrowUp'),
    down: held.has('ArrowDown'),
    jump: held.has('Space') || held.has('AltLeft') || held.has('AltRight'),
  };
  // Attacking roots you on the ground, like the classics.
  // After a move's blows land, walking or jumping cuts its follow-through short.
  const acting = world.attackTimer > 0 || world.lockTimer > 0;
  if (acting && (intent.left || intent.right || intent.jump) && world.recoverAt != null && world.now >= world.recoverAt) {
    world.attackTimer = 0;
    world.lockTimer = 0;
    world.pose = null;
    world.recoverAt = null;
    world.lunge = null;
  }
  const rooted = (world.attackTimer > 0.15 || world.lockTimer > 0) && world.body.onGround;
  const bodyIntent = rooted ? { ...intent, left: false, right: false, jump: false } : intent;
  const wasX = world.body.x;
  if (!(pressed.has('ArrowUp') && interact(world))) {
    stepBody(world.body, world.map, bodyIntent, dt, world.stats);
  }
  world.stillTime = Math.abs(world.body.x - wasX) < 0.01 && world.body.onGround ? world.stillTime + dt : 0;
  // What the controls ask for (attacks read Up for a launcher), and how long you've been running
  // (an attack after a short run becomes a dash attack).
  world.intent = intent;
  world.runFor = (intent.left || intent.right) && world.body.onGround && Math.abs(world.body.x - wasX) > 0.5 && !acting ? (world.runFor ?? 0) + dt : 0;

  if (!world.body.rope) {
    // Attacks fire on a fresh press too, so a tap shorter than a frame still counts.
    // A tap during a swing is remembered for a moment, so combos chain on time.
    const attackKeys = ['KeyZ', 'ControlLeft', 'ControlRight'];
    if (attackKeys.some((k) => pressed.has(k))) world.attackBuffer = world.now + 0.3;
    if ((attackKeys.some((k) => held.has(k)) || world.attackBuffer > world.now) && cast(world, null).ok) world.attackBuffer = 0;
    const buffered = world.skillBuffer;
    if (buffered && buffered.until > world.now && world.attackTimer <= 0 && world.lockTimer <= 0) useHotkey(world, buffered.binding, false);
    world.heldSince ??= {};
    for (const [code, binding] of Object.entries(char.hotkeys)) {
      if (!binding) continue;
      if (!held.has(code)) delete world.heldSince[code];
      else world.heldSince[code] ??= world.now;
      // Attack skills repeat once held a moment (like a key repeating); everything else fires
      // once per press.
      const repeat = binding.skill && ['attack', 'magic'].includes(SKILLS[binding.skill]?.type) && world.now - world.heldSince[code] >= REPEAT_AFTER;
      if (pressed.has(code)) useHotkey(world, binding);
      else if (repeat && held.has(code) && world.skillBuffer?.binding !== binding) useHotkey(world, binding, false);
    }
  } else {
    for (const [code, binding] of Object.entries(char.hotkeys)) {
      if (binding?.item && pressed.has(code)) useHotkey(world, binding);
    }
  }
  // Auto-loot (a setting, passed in as world.settings) picks things up without holding X.
  if ((held.has('KeyX') || world.settings?.autoLoot) && world.lootTimer <= 0 && pickUp(world, held.has('KeyX'))) world.lootTimer = 0.12;

  // ----- Melee strikes landing, then queued hits -----
  tickMelee(world, dt);
  const due = world.pending.filter((h) => h.at <= world.now);
  world.pending = world.pending.filter((h) => h.at > world.now);
  for (const h of due) {
    const m = h.mob;
    if (m.hp <= 0) continue;
    if (world.dungeon) h.damage = noteHit(world, m, h);
    const top = m.y - (m.air ?? 0) - m.def.h - 8 - h.stack * 15;
    if (h.miss) {
      world.numbers.push({ x: m.x, y: top, text: 'MISS', color: '#d4cbe8', t: 0 });
      continue;
    }
    world.numbers.push({ x: m.x, y: top, text: `${h.damage}`, color: h.crit ? '#ffb347' : '#fff6fb', t: 0, crit: h.crit, small: h.small && !h.crit, weight: h.damage / m.def.hp, party: Boolean(h.party) });
    // Your own hits keep the hit counter going (see HITS_WINDOW).
    if (!h.party) {
      world.hits = world.now - (world.hitsAt ?? -9) <= HITS_WINDOW ? (world.hits ?? 0) + 1 : 1;
      world.hitsAt = world.now;
      if (h.gauge) addAim(world, h.gauge, m);
    }
    if (!h.ownSpark) world.fx.push({ kind: 'spark', via: h.via, path: hasRage(world.char) ? 'rage' : hasFaith(world.char) ? 'holy' : hasIntent(world.char) ? 'crow' : hasShadow(world.char) ? 'shadow' : null, dir: world.body.facing, x: m.x, y: m.y - (m.air ?? 0) - m.def.h / 2, t: 0, dur: h.big ? 0.32 : 0.25, crit: h.crit || h.big, seed: Math.random() });
    world.juice.push({ type: 'hit', x: m.x, y: m.y - m.def.h / 2, crit: h.crit, big: h.big, party: Boolean(h.party), element: h.party ? null : h.element ?? weaponElement(char), dir: Math.sign(m.x - h.fromX) || 1, via: h.via, school: h.school, weapon: h.weapon });
    // Endgame weapons add an elemental impact on every hit.
    const element = h.party ? null : h.element ?? weaponElement(char);
    if (element) world.fx.push({ kind: 'impact', element, x: m.x, y: m.y, h: m.def.h, t: 0, dur: 0.4, seed: Math.random() });
    // Spell shots burst where they land.
    if (h.burst === 'fire' || h.burst === 'holy') world.fx.push({ kind: 'impact', element: h.burst, x: m.x, y: m.y, h: m.def.h, t: 0, dur: 0.45, seed: Math.random() });
    else if (h.burst) world.fx.push({ kind: h.burst, x: m.x, y: m.y - (m.air ?? 0), h: m.def.h, big: h.big, crit: h.crit, rank: h.rank, dir: h.dir ?? (Math.sign(m.x - h.fromX) || 1), t: 0, dur: 0.45, seed: Math.random() });
    if (h.crit) world.hitstop = Math.max(world.hitstop, 0.03);
    // Heavy shots land with their own weight.
    if (h.stop) world.hitstop = Math.max(world.hitstop, h.stop);
    if (h.shake) world.juice.push({ type: 'shake', mag: h.shake, dur: 0.2 });
    if (hitMob(m, h.damage, h.fromX, world.now, { knock: h.knock ?? 90, launch: h.launch ?? 0 })) {
      killMob(world, m, Boolean(h.party));
      continue;
    }
    // Ice freezes and stuns daze monsters in place (bosses shrug them off twice as fast);
    // venom and bleeding keep biting every second.
    const hold = h.freeze || h.stun;
    if (hold) {
      const secs = m.def.boss ? hold / 2 : hold;
      if (h.freeze && !(m.frozenUntil > world.now)) world.fx.push({ kind: 'freeze', x: m.x, y: m.y, h: m.def.h, w: m.def.w, t: 0, dur: 0.5 });
      if (h.stun && !h.freeze && !(m.frozenUntil > world.now)) world.juice.push({ type: 'stun', x: m.x, y: m.y });
      if (!(m.frozenUntil > world.now)) m.hold = h.freeze ? 'ice' : 'stun';
      m.frozenUntil = Math.max(m.frozenUntil ?? 0, world.now + secs);
    }
    const dot = h.poison ?? h.bleed;
    if (dot) {
      m.poison = { until: world.now + dot.secs, dmg: Math.max(1, Math.round(h.damage * dot.pct)), tick: m.poison?.tick ?? 1, kind: h.bleed ? 'bleed' : 'poison' };
    }
  }

  // Poison (green) and bleeding (red) tick once a second, and can finish a monster off.
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
    const bleed = m.poison.kind === 'bleed';
    world.numbers.push({ x: m.x + 8, y: m.y - m.def.h - 4, text: `${m.poison.dmg}`, color: bleed ? '#ff6b7a' : '#9be86b', t: 0, small: true });
    world.fx.push({ kind: 'poisonpuff', bleed, x: m.x, y: m.y, h: m.def.h, t: 0, dur: 0.6, seed: Math.random() });
    if (m.hp <= 0) killMob(world, m);
  }

  // ----- Monsters -----
  // In a dungeon they fight the whole group (see dungeon.js); elsewhere they hurt you on touch.
  const pbox = playerBox(world.body);
  if (world.dungeon) tickDungeon(world, dt);
  else tickDisco(world, dt);
  if (!world.dungeon) for (const m of world.mobs) {
    const event = updateMob(m, world.body, dt, world.now);
    if (event === 'slam') {
      m.attackAt = world.now;
      world.fx.push({ kind: 'slam', x: m.x, y: m.y, t: 0, dur: 0.6, range: m.def.special.range });
      world.juice.push({ type: 'shake', mag: 6, dur: 0.5 }, { type: 'slam', x: m.x, y: m.y, range: m.def.special.range });
      const onFloor = world.body.onGround && world.body.surface?.ground;
      if (onFloor && Math.abs(world.body.x - m.x) < m.def.special.range && !world.dead) {
        hurtPlayer(world, m.def.special.damage, m.x);
        m.gloatAt = world.now;
      }
    }
    if (m.hp <= 0 || world.dead || world.invuln > 0 || m.frozenUntil > world.now || m.def.disco) continue;
    if (!overlaps(pbox, mobBox(m))) continue;
    m.attackAt = world.now;
    if (Math.random() < mobHitChance(m.def.acc, avoid(world.stats))) {
      hurtPlayer(world, m.def.atk, m.x);
      m.gloatAt = world.now;
    } else {
      world.numbers.push({ x: world.body.x, y: world.body.y - world.body.h - 6, text: 'MISS', color: '#d4cbe8', t: 0 });
      world.invuln = 0.5;
    }
  }
  world.mobs.push(...tickSpawner(world.spawner, world.map, world.now));
  world.mobs = world.mobs.filter((m) => m.hp > 0 || m.dying < (m.def.disco ? 4 : 0.5));

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
  // Arrows and bolts track the monster they were loosed at (knocked back, launched, walking): a
  // shot heads for where it is now; a piercing one keeps its line through it out to its reach.
  for (const f of world.fx) {
    const m = f.mob;
    if (f.kind !== 'projectile' || !m || m.hp <= 0 || f.t >= f.dur) continue;
    const mx = m.x;
    const my = m.y - (m.air ?? 0) - m.def.h / 2;
    if (!f.reach) {
      f.tx = mx;
      f.ty = my;
    } else {
      const d = Math.hypot(mx - f.x, my - f.y) || 1;
      f.tx = f.x + ((mx - f.x) / d) * f.reach;
      f.ty = f.y + ((my - f.y) / d) * f.reach;
    }
  }
  world.fx = world.fx.filter((f) => f.t < f.dur);
  for (const n of world.numbers) n.t += dt;
  world.numbers = world.numbers.filter((n) => n.t < 1.1);
  for (const msg of world.messages) msg.t -= dt;
  world.messages = world.messages.filter((msg) => msg.t > 0);
}
