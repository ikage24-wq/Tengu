// The running game: one character in one map. Owns physics, monsters, loot, combat, and events.
// Rendering and UI read this state; they never change it except through the action functions below.

import { awayNow } from './nightmarket.js';
import { tickStall } from './stall.js';
import { tickBounties, eliteSlain } from './bounties.js';
import { tickCine } from './director.js';
import { tickMochi } from './mochi.js';
import { tickTutorial } from './tutorial.js';
import { getMap, MAPS } from '../data/maps.js';
import { ITEMS, RARITIES } from '../data/items.js';
import { itemName, itemColors } from '../core/items.js';
import { QUESTS } from '../data/quests.js';
import { SKILLS } from '../data/skills.js';
import { computeStats } from '../core/stats.js';
import { gainExp, usePotion, applyDeath, autoAssignAp } from '../core/character.js';
import { restedBonus } from './inn.js';
import { tickAuction } from './auction.js';
import { settings } from '../core/settings.js';
import { addItem, countItem, removeItem } from '../core/inventory.js';
import { recordKill } from '../core/quests.js';
import { avoid, mobHitChance, damageTaken } from '../core/formulas.js';
import { createBody, stepBody, knockBack, groundAt, blockWalls } from './physics.js';
import { startAgility, tickAgility } from './agility.js';
import { createSpawner, tickSpawner, updateMob, hitMob, mobBox } from './mobs.js';
import { rollLoot, spawnDrops, updateDrops, dropInReach, dropFromHero } from './drops.js';
import { cast, castBlocker, weaponElement, hurtProcs, blockOnHit, drinkBlood, tickLater } from './combat.js';
import { ventGuard } from './engineer.js';
import { CALL_WALK } from './melee.js';
import { tickMelee, faithGuard, addAim, hasRage, hasFaith, hasShadow, hasKi, hasMomentum, hasValor, unbroken, loseMomentum, barrageRelease, BARRAGE_WALK, skyFlight } from './melee.js';
import { elementHit, allyElement } from './reactions.js';
import { healAround } from './melee.js';
import { JOBS, nextJobs } from '../data/jobs.js';
import { celebrateLevels } from './levelup.js';
import { DUNGEONS } from '../data/dungeons.js';
import { onMapLoaded, tickDungeon, noteHit, onMobKilled, dungeonInteract, portalSealed, absorb, cutOf } from './dungeon.js';
import { lastRite } from './idol.js';
import { SETS, SET_SLOTS, setPieceId } from '../data/sets.js';
import { makeEquip } from '../core/items.js';
import { recordBook } from '../core/collection.js';
import { spotHere, startFishing, tickFishing } from './fishing.js';
import { nodeHere, startGathering, tickGathering } from './gathering.js';
import { benchHere, tickCrafting } from './crafting.js';
import { tickDaytime } from './daytime.js';
import { tickVoyage, setSail } from './voyage.js';
import { rideStep, rideAfter, dismount, toggleMount, giveMount, ownsMount } from './mount.js';
import { WADE, MOUNTS } from '../data/mounts.js';
import { refreshHome } from './home.js';
import { tickDate, DATES } from './dates.js';
import { movedAway, welcomeHome } from './sweethearts.js';
import { settleSweethearts, tickGoingHome } from './goinghome.js';
import { tickDerby } from './derby.js';
import { calmKill, tickCalm, isCalm, soothes, CALM_EXP } from './calm.js';
import { tickHabits, napping } from './habits.js';
import { teamHit, teamLanded, tickTeam } from './teamwork.js';
import { nestKill } from './nest.js';
import { tickCoop, coopHit, pqKill } from './coop.js';
import { DISH_BY_ID } from '../data/cooking.js';
import { serveFeast } from './coop-life.js';
import { onStoryMap, tickStory, storyLock, spawnAllowed } from './story.js';

const INVULN = 1.2;
const REGEN_EVERY = 1;
// Out of a fight (nothing hit or hurt for OUT_OF_FIGHT seconds), HP and MP come back REST_PCT of
// their max a second (twice that in town); in a fight only a trickle of MP.
const OUT_OF_FIGHT = 4;
const REST_PCT = 0.02;
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
    spirit: 0,
    ki: 0,
    tails: 0,
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
      // The party's own lines are kept apart too, for the chat's Party tab.
      if (text.startsWith('[Party]')) {
        (world.partyLog ??= []).push({ text, color, at: world.now });
        if (world.partyLog.length > 7) world.partyLog.shift();
      }
    },
  };
  loadMap(world, char.mapId, char.portal ?? 'start');
  return world;
}

function findPortal(map, id) {
  return map.portals.find((p) => p.id === id) ?? map.portals.find((p) => p.id === 'start') ?? map.portals[0];
}

export function loadMap(world, mapId, portalId) {
  // Your island is built fresh from how far Shelly has got (world/home.js).
  if (mapId === 'home' || mapId === 'home_in') refreshHome(world.char, world.visiting ?? null);
  // (Leaving a friend's island ends the visit: net/visit.js.)
  else world.visiting = null;
  const map = getMap(mapId);
  const portal = findPortal(map, portalId);
  world.map = map;
  // The Sweethearts are in town by day and at home in their rooms at night (world/goinghome.js).
  settleSweethearts(world);
  world.char.mapId = map.id;
  world.char.portal = portal.id;
  world.body = createBody(portal.x, portal.y);
  world.spawner = createSpawner(map);
  world.mobs = tickSpawner(world.spawner, map, world.now, [], (sp) => spawnAllowed(world, sp));
  world.trial = null;
  world.drops = [];
  world.pending = [];
  world.strikes = [];
  world.lunge = null;
  world.dash = null;
  world.flash = null;
  world.owed = 0;
  world.fishing = null;
  world.fx = [];
  world.fields = [];
  world.thunder = null;
  world.cloud = null;
  world.numbers = [];
  world.channel = null;
  // Spells laid on the last map stay there (Heaven's Lantern, the Starlight Idol's songs and stage,
  // the Astronomer's Gravity Well).
  world.lantern = null;
  world.spot = null;
  world.hype = null;
  world.lull = null;
  world.concert = null;
  world.well = null;
  world.events.push({ type: 'map', mapId: map.id });
  // Home to whoever lives with you: a welcome, and some mornings a dish (world/sweethearts.js).
  if (map.home && !map.indoor) welcomeHome(world);
  onMapLoaded(world);
  onStoryMap(world);
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

// Flying between towns is free.
export function travelCost() {
  return 0;
}

// Fast travel leaves from a town and flies to any place on the world map (a town, a field, a
// dungeon's gate). It lands on the place's arrival spot (a town's square or a gate's start, a
// field's homestone), else its first portal. Returns a reason string when it can't happen.
export function travelTo(world, mapId) {
  if (!world.map.isTown) return 'Fast travel leaves from towns.';
  if (world.map.id === mapId) return 'You are already here.';
  const map = getMap(mapId);
  if (!map?.world || map.trial || map.dungeon) return "You can't fly there.";
  const land = map.portals.find((p) => p.id === 'start') ?? map.portals.find((p) => p.homestone || p.id === 'homestone') ?? map.portals[0];
  loadMap(world, mapId, land.id);
  world.log(`You fly to ${map.name}!`, '#bff0dc');
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
  if (ITEMS[entry.id]?.quest) {
    world.log('You need that for a quest.', '#ffb3c6');
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

// A potion takes a moment to drink: another can't follow straight away, so they can't be chugged
// by mashing the key.
export const ITEM_DELAY = 0.4;

export function useItem(world, id) {
  const def = ITEMS[id];
  if (!def) return false;
  if (def.effect && !def.effect.returnTown && world.now < (world.itemReadyAt ?? 0)) return false;
  if (def.effect?.returnTown) {
    if (removeItem(world.char.inventory, id, 1) < 1) return false;
    world.log(`Returning to ${getMap(townOf(world)).name}.`, '#bff0dc');
    returnToTown(world);
    return true;
  }
  // A party feast: served to everyone in the party here (world/coop-life.js).
  if (def.effect?.feast) {
    if (!serveFeast(world, id)) {
      world.log(`No ${def.name} left.`, '#ffb3c6');
      return false;
    }
    world.itemReadyAt = world.now + ITEM_DELAY;
    world.fx.push({ kind: 'potion', x: world.body.x, y: world.body.y, t: 0, dur: 0.5, color: def.color });
    return true;
  }
  // The Home Shell: home to your island, and back where you were (world/home.js).
  if (def.effect?.home) {
    const char = world.char;
    if (!char.home && world.visiting) {
      const back = world.visitBack;
      world.visiting = null;
      if (back && MAPS[back.map]) loadMap(world, back.map, 'start');
      else loadMap(world, 'harbor', 'ferry');
      return true;
    }
    if (!char.home) {
      world.log('The shell hums... but you have no island to go home to yet. Captain Rook in Pastel Harbor might know of one.', '#ffb3c6');
      return false;
    }
    if (world.dungeon || world.trial || world.map.voyage || world.scene) {
      world.log("The shell's song is too faint here. Try again outside.", '#ffb3c6');
      return false;
    }
    world.fx.push({ kind: 'mountpoof', on: false, x: world.body.x, y: world.body.y, t: 0, dur: 0.45 });
    if (world.map.home) {
      const back = char.home.back;
      if (back && MAPS[back.map] && !MAPS[back.map].home) {
        loadMap(world, back.map, 'start');
        Object.assign(world.body, { x: Math.max(20, Math.min(world.map.width - 20, back.x)), y: groundAt(world.map, back.x) });
      } else loadMap(world, 'harbor', 'ferry');
      world.log(`Back to ${world.map.name}.`, '#cfe8ff');
    } else {
      char.home.back = { map: world.map.id, x: Math.round(world.body.x) };
      loadMap(world, 'home', 'dock');
      world.log('You hold the shell to your ear... and you hear your island\'s waves. Home!', '#ffc2d4');
    }
    world.fx.push({ kind: 'mountpoof', on: true, x: world.body.x, y: world.body.y, t: 0, dur: 0.45 });
    return true;
  }
  // A mount's key or whistle: the mount is yours (world/mount.js).
  if (def.effect?.mount) {
    if (ownsMount(world.char, def.effect.mount)) {
      world.log(`You already have ${MOUNTS[def.effect.mount].name}.`, '#ffb3c6');
      return false;
    }
    if (removeItem(world.char.inventory, id, 1) < 1) return false;
    giveMount(world, def.effect.mount);
    return true;
  }
  // Lantern bait: the next casts bite sooner (world/fishing.js).
  if (def.effect?.bait) {
    if (removeItem(world.char.inventory, id, 1) < 1) return false;
    world.char.bait = (world.char.bait ?? 0) + def.effect.bait;
    world.log(`Baited! Fish bite twice as fast for your next ${world.char.bait} casts.`, '#ffd27a');
    world.itemReadyAt = world.now + ITEM_DELAY;
    return true;
  }
  // A dish: eaten for a little HP and its bonus for a while (different dishes add up; the same
  // dish again starts its time over).
  if (def.effect?.food) {
    const dish = DISH_BY_ID[def.effect.food];
    if (removeItem(world.char.inventory, id, 1) < 1) {
      world.log(`No ${def.name} left.`, '#ffb3c6');
      return false;
    }
    const s = world.stats;
    world.char.hp = Math.min(s.maxHp, world.char.hp + dish.heal);
    delete world.char.buffs.food;
    world.char.buffs[`food:${dish.id}`] = { name: dish.name, since: world.now, until: world.now + dish.secs, values: { ...dish.values }, food: dish.id };
    world.log(`Yum! ${dish.name}: ${dish.about} for ${Math.round(dish.secs / 60)} minutes.`, '#ffd6a0');
    world.itemReadyAt = world.now + ITEM_DELAY;
    world.fx.push({ kind: 'potion', x: world.body.x, y: world.body.y, t: 0, dur: 0.5, color: def.color });
    return true;
  }
  if (!usePotion(world.char, id, world.now)) {
    world.log(`No ${def.name} left.`, '#ffb3c6');
    return false;
  }
  world.itemReadyAt = world.now + ITEM_DELAY;
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
  return collectDrop(world, d);
}

// Puts one drop in the bag (or the purse): yours, or one your Mochi fetched.
export function collectDrop(world, d) {
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
    // (The players around see it too: world/social.js.)
    if (d.inst) world.onLoot?.(d.inst);
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
  const locked = portal && storyLock(world, world.map, portal);
  if (locked) {
    if (world.warnTimer <= 0) world.log(locked, '#ffb3c6');
    world.warnTimer = 1;
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
  // Your skiff at your island's dock: Up to sail back to Pastel Harbor (world/voyage.js).
  if (world.map.home && !world.map.indoor && b.x < 150 && b.y <= 530) {
    setSail(world);
    world.log('You cast off in your skiff, back toward Pastel Harbor.', '#9fe8ff');
    return true;
  }
  // A mount hiding on this map (its `finds`: data/mounts.js): Up beside it and it's yours.
  const find = (world.map.finds ?? []).find((f) => f.mount && !ownsMount(world.char, f.mount) && Math.abs(f.x - b.x) < 30 && Math.abs(f.y - b.y) < 8);
  if (find) {
    giveMount(world, find.mount, find.say ?? null);
    world.fx.push({ kind: 'mountpoof', on: true, mount: find.mount, x: find.x, y: find.y, t: 0, dur: 0.45 });
    return true;
  }
  const npc = world.map.npcs.find((n) => Math.abs(n.x - b.x) < TALK_RANGE && Math.abs(groundAt(world.map, n.x) - b.y) < 6 && !(movedAway(world.char, n.id) && !world.map.home) && world.date?.id !== n.id && !n.going && !awayNow(world, n));
  if (npc) {
    world.events.push({ type: 'talk', npc: npc.id });
    return true;
  }
  // A fishing spot: cast your line.
  if (spotHere(world)) {
    const why = startFishing(world);
    if (why) world.log(why, '#ffb3c6');
    return true;
  }
  // A gathering or mining spot: work it.
  if (nodeHere(world)) {
    const why = startGathering(world);
    if (why) world.log(why, '#ffb3c6');
    return true;
  }
  // A town's capsule machine.
  if (world.map.gacha != null && Math.abs(world.map.gacha - b.x) < 24 && Math.abs(groundAt(world.map, world.map.gacha) - b.y) < 6) {
    world.events.push({ type: 'gacha' });
    return true;
  }
  // A town's craft bench: craft (ui/crafting.js).
  if (benchHere(world)) {
    world.events.push({ type: 'craft' });
    return true;
  }
  // A town's stove: cook.
  if (world.map.stove != null && Math.abs(world.map.stove - b.x) < 30 && Math.abs(groundAt(world.map, world.map.stove) - b.y) < 6) {
    world.events.push({ type: 'cook' });
    return true;
  }
  return false;
}

export function nearbyNpc(world) {
  const b = world.body;
  return world.map.npcs.find((n) => Math.abs(n.x - b.x) < TALK_RANGE && Math.abs(groundAt(world.map, n.x) - b.y) < 6 && !(movedAway(world.char, n.id) && !world.map.home) && world.date?.id !== n.id && !n.going && !awayNow(world, n)) ?? null;
}

// The hit counter: every hit you land within this many seconds of the last adds one; a pause
// lets it drop (it's for show and for Links; finishers need a full path gauge instead).
export const HITS_WINDOW = 3;

const BLOCKER_TEXT = {
  mp: 'Not enough MP.',
  busy: null,
  weapon: "That skill needs a different weapon.",
  noone: 'No fallen party member nearby.',
  rage: 'Not enough Rage. Land some blows first!',
  'gauge:valor': 'A finisher needs full Valor. Keep fighting, the more at once the better!',
  'gauge:momentum': 'A finisher needs full Momentum. Land your shots and keep out of harm!',
  'gauge:shadow': 'A finisher needs full Shadow. Keep your hits coming fast!',
  'gauge:spirit': 'A finisher needs full Spirit. Land your spells and heal!',
  'gauge:ki': 'A finisher needs full Ki. Land hits and dodge blows!',
  'gauge:tails': 'A finisher needs all nine Tails. Keep your fox-fire stars landing!',
  'gauge:rage': 'A finisher needs full Rage. Keep swinging!',
  'gauge:faith': 'A finisher needs full Faith. Keep fighting!',
  'gauge:bond': "Your Illusion isn't full yet. Keep fighting!",
  'gauge:charge': 'Not Supercharged yet: land more bolts!',
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

// The live monster nearest you.
function nearestMob(world) {
  let best = null;
  let d = Infinity;
  for (const m of world.mobs) {
    if (m.hp <= 0) continue;
    const e = Math.abs(m.x - world.body.x) + Math.abs(m.y - world.body.y) * 2;
    if (e < d) {
      d = e;
      best = m;
    }
  }
  return best;
}

export function killMob(world, m, byParty = false) {
  const char = world.char;
  // (A guild bounty's elite: its bounty is ready to bring in.)
  if (m.bounty) eliteSlain(world, m);
  // Online, everyone else on the map gets their share too (see net/online.js).
  m.credited = true;
  world.net?.killed(world, m);
  // (A dish can add to it.)
  const food = Object.values(char.buffs).reduce((k, b) => k + (b.until > world.now ? b.values?.expPct ?? 0 : 0), 0);
  // (A GM's Double EXP counts too: world/events.js.)
  // (A calm map pays a little more: world/calm.js.)
  const calm = soothes(world.map) && isCalm(world, world.map.id) ? CALM_EXP : 0;
  const exp = Math.round(m.def.exp * (byParty ? 0.6 : 1 + 0.1 * (world.partySize ?? 0)) * (1 + food + calm) * (world.expEvent ?? 1));
  // (Well rested from a night at the inn: double, while it lasts: world/inn.js.)
  const rest = restedBonus(world, exp);
  const levels = gainExp(char, exp + rest);
  world.numbers.push({ x: m.x, y: m.y - m.def.h - 18, text: `+${exp + rest} EXP${byParty ? ' (party)' : rest ? ' (rested)' : ''}`, color: '#ffe36b', t: 0, small: true });
  world.onKill?.(m);
  calmKill(world);
  nestKill(world, m);
  // (A party quest's shared count: world/partyquest.js.)
  pqKill(world, m);
  if (m.def.boss) world.onBossDown?.(m);
  // (Someone you're helping may need this one: world/lives.js.)
  world.onAnyKill?.(m);
  onMobKilled(world, m);
  // The Monster Book.
  const card = recordBook(char, m.def.id);
  if (card === 'card') world.log(`New Monster Book card: ${m.def.name}!`, '#c9a6ff');
  if (card === 'master') world.log(`${m.def.name} card mastered!`, '#ffe36b');
  // (A party member's kill counts for your quests too, and the tracker shows whose it was.)
  const by = byParty ? world.bots?.list.find((b) => b.id === m.killedBy && b.party)?.name ?? m.killedByName ?? null : null;
  for (const qid of recordKill(char, m.def.id)) {
    const goal = QUESTS[qid].objectives.find((o) => o.type === 'kill' && o.mob === m.def.id);
    world.log(`${QUESTS[qid].name}: ${char.quests[qid].kills[m.def.id]}/${goal.count} ${m.def.name}${by ? ` (${by})` : ''}`, '#bff0dc');
    if (by) (world.partyCredit ??= {})[`${qid}|${m.def.id}`] = { name: by, at: world.now };
  }
  world.drops.push(...spawnDrops(rollLoot(m.def, Math.random, (d) => fitsJob(char, d)), m.x, m.y));
  // A queen (or the Crystal King) drops a piece of her set for your job: always from her trial,
  // sometimes from a rematch.
  const story = m.def.id === 'crystalking' && char.quests.story_7_2?.state === 'active';
  const piece = setDropFor(char, m.def.id, m.trialOf || story ? 1 : 0.35);
  if (piece) world.drops.push(...spawnDrops([{ kind: 'item', inst: makeEquip(piece, { rarity: 1, variant: 'roll' }) }], m.x, m.y));
  world.juice.push({ type: 'kill', x: m.x, y: m.y, w: m.def.w, h: m.def.h, boss: Boolean(m.def.boss) });
  // A boss falls with a short stop; its weight comes from the slow motion and flash after (see
  // render/particles.js).
  world.hitstop = Math.max(world.hitstop, m.def.boss ? 0.12 : 0.045);
  celebrateLevels(world, levels);
  if (m.def.boss) world.log(`${m.def.name} has been defeated!`, '#ffe36b');
}

// The set piece a boss drops for this hero (a slot they don't have yet, if any), or null.
export function setDropFor(char, bossId, chance, rng = Math.random) {
  const family = JOBS[char.job]?.family;
  if (!SETS[bossId] || !SET_SLOTS.length || rng() >= chance || !['warrior', 'archer', 'mage', 'thief'].includes(family)) return null;
  const owned = new Set([...Object.values(char.equipment), ...char.inventory.equip].filter(Boolean).map((e) => e.id));
  const missing = SET_SLOTS.filter((s) => !owned.has(setPieceId(bossId, family, s)));
  const slots = missing.length ? missing : SET_SLOTS;
  return setPieceId(bossId, family, slots[Math.floor(rng() * slots.length)]);
}

export function hurtPlayer(world, rawAtk, fromX) {
  if (world.god || blockOnHit(world, fromX)) return;
  const char = world.char;
  const s = world.stats;
  let dmg = absorb(world, world.body, char.buffs, Math.round(damageTaken(rawAtk, s.wdef) * (s.guard ?? 1) * (1 - cutOf(char.buffs, world.now)) * (1 - faithGuard(world)) * (1 - ventGuard(world, fromX))));
  if (s.manaShield > 0) {
    const toMp = Math.min(char.mp, Math.floor(dmg * s.manaShield));
    char.mp -= toMp;
    dmg -= toMp;
  }
  char.hp = Math.max(0, char.hp - dmg);
  world.numbers.push({ x: world.body.x, y: world.body.y - world.body.h - 6, text: `${dmg}`, color: '#ff6b8a', t: 0 });
  world.invuln = INVULN;
  world.hurtAt = world.now;
  world.juice.push({ type: 'hurt', x: world.body.x, y: world.body.y - world.body.h / 2 });
  // Unbroken (full Valor), nothing knocks a Warrior back; a hit breaks an Archer's Momentum.
  if (!unbroken(world)) knockBack(world.body, fromX);
  loseMomentum(world);
  // (A Shrine Maiden's Last Rite keeps her standing, once.)
  if (char.hp <= 0 && !world.dead && !lastRite(world)) {
    world.dead = true;
    dismount(world, { quiet: true, hop: false });
    world.events.push({ type: 'death' });
    world.log('You fainted...', '#ff6b8a');
  }
  hurtProcs(world, dmg);
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
  // A cutscene holds the world still until it's over; only its staging moves (world/director.js).
  if (world.scene) {
    world.scene.t += dt;
    tickCine(world, dt);
    return;
  }
  // Without a renderer draining it (tests, background tabs), keep the cue queue short.
  if (world.juice.length > 200) world.juice.length = 0;
  world.now += dt;
  // The map's moving parts run on the world's clock; its light follows the real one.
  world.map.clock = world.now;
  tickDaytime(world, dt);
  // Auctions end and listings sell while you play (world/auction.js), checked once a second.
  world.auctionT = (world.auctionT ?? 0) + dt;
  if (world.auctionT >= 1) {
    world.auctionT = 0;
    tickAuction(world);
    tickStall(world);
  }
  tickGoingHome(world, dt);
  tickCalm(world);
  // On the Sea Biscuit, the trip's clock (world/voyage.js).
  tickVoyage(world, dt);
  // The Fishing Derby at Lantern Lagoon, on the hour (world/derby.js).
  tickDerby(world);
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
      world.log(`${SKILLS[id]?.name ?? b.name ?? 'Buff'} wore off.`, '#d4cbe8');
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

  // ----- Player control -----
  // While you fish, the line has the controls.
  // (Gathering and crafting work the same way.)
  const fishing = !input.locked && (tickFishing(world, dt, input.held, input.pressed) || tickGathering(world, dt, input.held, input.pressed) || tickCrafting(world, dt, input.held, input.pressed));
  // (Decorating your island: only walking and jumping; the keys belong to the furniture.)
  const MOVE = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'AltLeft', 'AltRight'];
  // (On a date's moment, stargazing or dancing, the keys are the moment's: world/dates.js.)
  if (world.date) tickDate(world, dt, input.locked ? new Set() : input.pressed);
  const moment = Boolean(world.date && DATES[world.date.kind].moment);
  const only = (set) => (moment ? new Set() : world.decorating ? new Set([...set].filter((k) => MOVE.includes(k))) : set);
  const held = input.locked || world.dead || fishing ? new Set() : only(input.held);
  const pressed = input.locked || world.dead || fishing ? new Set() : only(input.pressed);
  const intent = {
    left: held.has('ArrowLeft'),
    right: held.has('ArrowRight'),
    up: held.has('ArrowUp'),
    down: held.has('ArrowDown'),
    jump: held.has('Space') || held.has('AltLeft') || held.has('AltRight'),
  };
  // Attacking roots you on the ground, like the classics.
  // After a move's blows land, walking or jumping cuts its follow-through short; but while the
  // attack key (or a repeating attack skill's key) is held, you stay planted and keep attacking (a
  // held direction only turns the next attack round), so holding one with a direction doesn't
  // stutter between each attack and a run. Jumping still cuts in, for the air attacks.
  const attackKeys = ['KeyZ', 'ControlLeft', 'ControlRight'];
  const basicHeld = attackKeys.some((k) => held.has(k)) && !world.body.rope;
  const repeats = (b) => Boolean(b?.skill) && ['attack', 'magic'].includes(SKILLS[b.skill]?.type);
  const skillHeld = Object.entries(char.hotkeys).some(([code, b]) => repeats(b) && held.has(code)) && !world.body.rope;
  const attackHeld = basicHeld || skillHeld;
  // (The Meteor Caller's charge reads whether attack is still held: world/melee.js tickCaller.)
  world.basicHeld = basicHeld;
  const acting = world.attackTimer > 0 || world.lockTimer > 0;
  const walkAway = (intent.left || intent.right) && !attackHeld;
  // An attack about to start faces the way you're holding (planted, you turn on the spot).
  const faceHeld = (skillId) => {
    if (intent.left !== intent.right && world.body.onGround && !castBlocker(world, skillId)) world.body.facing = intent.left ? -1 : 1;
  };
  if (acting && (walkAway || intent.jump) && world.recoverAt != null && world.now >= world.recoverAt) {
    world.attackTimer = 0;
    world.lockTimer = 0;
    world.pose = null;
    world.recoverAt = null;
    world.lunge = null;
  }
  // Endless Fox-Fire's barrage doesn't root her: she walks slowly through it (and can jump into the
  // air barrage). Its finisher roots her as any move does.
  const streaming = basicHeld && Boolean(world.barrage) && world.recoverKind === 'basic' && !world.pose?.fin;
  // The Meteor Caller walks slowly while she gathers a charge (CALL_WALK).
  const calling = Boolean(world.call);
  const rooted = !streaming && !calling && (world.attackTimer > 0.15 || world.lockTimer > 0 || attackHeld) && world.body.onGround;
  // Riding (world/mount.js): H gets on and off; an attack or a skill hops you off and goes off at
  // once; fishing, gathering and crafting put the mount away.
  if (pressed.has('KeyH')) toggleMount(world);
  if (world.riding && (fishing || world.fishing || world.gathering || world.crafting)) dismount(world, { quiet: true, hop: false });
  if (world.riding && (attackKeys.some((k) => pressed.has(k) || held.has(k)) || Object.entries(char.hotkeys).some(([code, b]) => b?.skill && pressed.has(code)))) dismount(world, { hop: false });
  const bodyIntent = rooted ? { ...intent, left: false, right: false, jump: false } : intent;
  const wasX = world.body.x;
  // A Thief's flash jump and shadow dash, an Archer's air leap (world/agility.js); riding, the
  // mount's own trick instead.
  const ride = rideStep(world, bodyIntent, pressed, dt);
  if (!ride) startAgility(world, intent, pressed);
  if (!(pressed.has('ArrowUp') && interact(world))) {
    // (The Sky Dancer on full Tailwind hovers where she is unless Up or Down flies her.)
    const hover = !world.body.onGround && world.body.vy >= 0 && skyFlight(world) && !intent.up && !intent.down;
    stepBody(world.body, world.map, bodyIntent, dt, { ...world.stats, wade: WADE, ...(streaming ? { speed: world.stats.speed * BARRAGE_WALK } : calling ? { speed: world.stats.speed * CALL_WALK } : null), ...(hover ? { float: true } : null), ...(ride ?? null), rider: true });
  }
  rideAfter(world);
  if (!ride) tickAgility(world, dt, blockWalls);
  world.stillTime = Math.abs(world.body.x - wasX) < 0.01 && world.body.onGround ? world.stillTime + dt : 0;
  // What the controls ask for (attacks read Up for a launcher), and how long you've been running
  // (an attack after a short run becomes a dash attack).
  world.intent = intent;
  // Pressing attack mid-run plants you, but the run still counts for the swing it starts.
  const running = (intent.left || intent.right) && world.body.onGround && !acting;
  world.runFor = running && Math.abs(world.body.x - wasX) > 0.5 ? (world.runFor ?? 0) + dt : running && attackHeld ? world.runFor ?? 0 : 0;

  if (!world.body.rope) {
    // Attacks fire on a fresh press too, so a tap shorter than a frame still counts.
    // A tap during a swing is remembered for a moment, so combos chain on time.
    if (attackKeys.some((k) => pressed.has(k))) world.attackBuffer = world.now + 0.3;
    if (basicHeld || world.attackBuffer > world.now) {
      faceHeld(null);
      if (cast(world, null).ok) world.attackBuffer = 0;
    }
    // Letting go ends an Endless Fox-Fire barrage (with its finisher, if held long enough).
    if (world.barrage && !basicHeld) barrageRelease(world);
    const buffered = world.skillBuffer;
    if (buffered && buffered.until > world.now && world.attackTimer <= 0 && world.lockTimer <= 0) useHotkey(world, buffered.binding, false);
    world.heldSince ??= {};
    for (const [code, binding] of Object.entries(char.hotkeys)) {
      if (!binding) continue;
      if (!held.has(code)) delete world.heldSince[code];
      else world.heldSince[code] ??= world.now;
      // Attack skills repeat once held a moment (like a key repeating); everything else fires
      // once per press.
      const repeat = repeats(binding) && world.now - world.heldSince[code] >= REPEAT_AFTER;
      if (binding.skill && (pressed.has(code) || (repeat && held.has(code)))) faceHeld(binding.skill);
      if (pressed.has(code)) useHotkey(world, binding);
      else if (repeat && held.has(code) && world.skillBuffer?.binding !== binding) useHotkey(world, binding, false);
    }
  } else {
    for (const [code, binding] of Object.entries(char.hotkeys)) {
      if (binding?.item && pressed.has(code)) useHotkey(world, binding);
    }
  }
  // Auto-loot (a setting, passed in as world.settings) picks things up without holding X.
  if ((held.has('KeyX') || (world.settings?.autoLoot && !world.decorating)) && world.lootTimer <= 0 && pickUp(world, held.has('KeyX'))) world.lootTimer = 0.12;

  // ----- Melee strikes landing, then queued hits -----
  tickMelee(world, dt);
  tickLater(world);
  const due = world.pending.filter((h) => h.at <= world.now);
  world.pending = world.pending.filter((h) => h.at > world.now);
  // Your hits on monsters other than the one you're on (the nearest) land at your job's `spread`
  // (data/jobs.js): how much of its damage carries to a crowd.
  const spread = world.stats.spread ?? 1;
  const focus = spread !== 1 && due.length ? nearestMob(world) : null;
  for (const h of due) {
    const m = h.mob;
    if (m.hp <= 0) continue;
    if (focus && m !== focus && !h.party) h.damage = Math.max(1, Math.round(h.damage * spread));
    // (What you're fighting: your party focuses it, world/botfight.js.)
    if (!h.party && !h.miss) world.youHit = { mob: m, at: world.now };
    // Team moves: side by side, and catching a partymate's launch (world/teamwork.js).
    teamHit(world, m, h);
    if (world.dungeon) h.damage = noteHit(world, m, h);
    // (A boss's guard or armour: world/coopboss.js.)
    if (m.coop) h.damage = coopHit(world, m, h);
    // Another player hunting here never lands a boss's last blow: that one's yours.
    if (h.stranger && m.def.boss) h.damage = Math.max(0, Math.min(h.damage, m.hp - 1));
    // (A monster a player hits goes after them, your party members too: it fights back.)
    if (h.party && !world.dungeon) {
      m.foe = world.bots?.list.find((b) => b.id === h.party)?.body ?? null;
      m.foeUntil = world.now + 6;
    }
    const top = m.y - (m.air ?? 0) - m.def.h - 8 - h.stack * 15;
    if (h.miss) {
      world.numbers.push({ x: m.x, y: top, text: 'MISS', color: '#d4cbe8', t: 0, mob: m.uid });
      continue;
    }
    world.numbers.push({ x: m.x, y: top, text: `${h.damage}`, color: h.crit ? '#ffb347' : '#fff6fb', t: 0, crit: h.crit, small: h.small && !h.crit, weight: h.damage / m.def.hp, party: Boolean(h.party), mob: m.uid });
    // Your own hits keep the hit counter going (see HITS_WINDOW).
    if (!h.party) {
      world.hits = world.now - (world.hitsAt ?? -9) <= HITS_WINDOW ? (world.hits ?? 0) + 1 : 1;
      world.hitsAt = world.now;
      if (h.gauge) addAim(world, h.gauge, m, h.el);
      // The Mage's spells mark what they hit with their element, and set off reactions.
      elementHit(world, m, h);
      // The Cleric's heal bombs mend the party round where they burst, carrying their element.
      if (h.mend) healAround(world, m.x, m.y, h.mend, 220, true, h.el);
      drinkBlood(world, h.damage);
    }
    if (!h.ownSpark) world.fx.push({ kind: 'spark', via: h.via, weapon: world.stats.weaponType, path: hasRage(world.char) ? 'rage' : hasFaith(world.char) ? 'holy' : hasKi(world.char) ? 'rosegold' : hasShadow(world.char) ? 'shadow' : hasMomentum(world.char) ? 'hawk' : hasValor(world.char) ? 'steel' : null, dir: world.body.facing, x: m.x, y: m.y - (m.air ?? 0) - m.def.h / 2, t: 0, dur: h.big ? 0.32 : 0.25, crit: h.crit || h.big, seed: Math.random() });
    world.juice.push({ type: 'hit', x: m.x, y: m.y - m.def.h / 2, crit: h.crit, big: h.big, party: Boolean(h.party), element: h.party ? null : h.element ?? weaponElement(char), dir: Math.sign(m.x - h.fromX) || 1, via: h.via, school: h.school, weapon: h.weapon, mob: m.def.id, boss: Boolean(m.def.boss) });
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
    // Online, a monster another player's game runs takes the real hit there.
    world.net?.hit(world, m, h);
    if (hitMob(m, h.damage, h.fromX, world.now, { knock: h.knock ?? 90, launch: h.launch ?? 0 })) {
      // Their own kill: it falls, and nothing comes to you.
      if (h.stranger) {
        m.credited = true;
        world.juice.push({ type: 'kill', x: m.x, y: m.y, w: m.def.w, h: m.def.h, boss: false, party: true });
        world.onStrangerKill?.(h.party, m);
      } else {
        if (h.party) m.killedBy = h.party;
        killMob(world, m, Boolean(h.party));
      }
      continue;
    }
    teamLanded(world, m, h);
    // Ice freezes and stuns daze monsters in place (bosses shrug them off twice as fast);
    // venom and bleeding keep biting every second.
    const hold = h.freeze || h.stun || h.snare;
    if (hold) {
      const secs = m.def.boss ? hold / 2 : hold;
      if (h.freeze && !(m.frozenUntil > world.now)) world.fx.push({ kind: 'freeze', x: m.x, y: m.y, h: m.def.h, w: m.def.w, t: 0, dur: 0.5 });
      if (h.stun && !h.freeze && !(m.frozenUntil > world.now)) world.juice.push({ type: 'stun', x: m.x, y: m.y });
      if (!(m.frozenUntil > world.now)) m.hold = h.freeze ? 'ice' : h.stun ? 'stun' : 'snare';
      // (The Acrobat Archer's snare is a ribbon tied in a bow.)
      if (h.snare) m.holdLook = JOBS[world.char.job]?.family === 'archer' ? 'ribbon' : null;
      m.frozenUntil = Math.max(m.frozenUntil ?? 0, world.now + secs);
    }
    // (Burns bite the same way, in blue flame.)
    const dot = h.poison ?? h.bleed ?? h.burn;
    if (dot) {
      m.poison = { until: world.now + dot.secs, dmg: Math.max(1, Math.round(h.damage * dot.pct)), tick: m.poison?.tick ?? 1, kind: h.bleed ? 'bleed' : h.burn ? 'burn' : 'poison' };
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
    const burn = m.poison.kind === 'burn';
    world.fx.push({ kind: burn ? 'foxburn' : 'poisonpuff', bleed, x: m.x, y: m.y, h: m.def.h, t: 0, dur: 0.6, seed: Math.random() });
    if (m.hp <= 0) killMob(world, m);
  }

  // ----- Monsters -----
  // In a dungeon they fight the whole group (see dungeon.js); elsewhere they hurt you on touch.
  const pbox = playerBox(world.body);
  tickTutorial(world);
  tickMochi(world, dt, { collect: (d) => collectDrop(world, d), useItem: (id) => useItem(world, id) });
  if (world.dungeon) tickDungeon(world, dt);
  // Two-person boss mechanics and party quests (world/coop.js).
  tickCoop(world, dt);
  // Online, the monsters on a map another player got to first are run by their game; this one
  // shows them where it says they are. Monsters chase whichever player is nearest.
  const mirrored = Boolean(world.net?.mirrored(world));
  tickHabits(world, dt);
  // Guild bounties: an elite turns up on its map, and elites use their moves (world/bounties.js).
  tickBounties(world, dt);
  if (!world.dungeon) for (const m of world.mobs) {
    // (A monster another player hunting here just hit goes after them, not you.)
    const foe = m.foe && world.now < m.foeUntil && !m.def.boss ? m.foe : null;
    const event = mirrored ? world.net.step(m, dt) : updateMob(m, foe ?? (world.net ? world.net.target(world, m) : world.body), dt, world.now);
    if (event === 'slam') {
      m.attackAt = world.now;
      world.fx.push({ kind: 'slam', x: m.x, y: m.def.fly ? m.spawn.y : m.y, t: 0, dur: 0.6, range: m.def.special.range });
      world.juice.push({ type: 'shake', mag: 6, dur: 0.5 }, { type: 'slam', x: m.x, y: m.y, range: m.def.special.range });
      // It hits anyone standing on its floor near it (a flyer's floor is the one it hovers over).
      const onFloor = world.body.onGround && Math.abs(world.body.y - (m.def.fly ? m.spawn.y : m.y)) < 8;
      if (onFloor && Math.abs(world.body.x - m.x) < m.def.special.range && !world.dead) {
        hurtPlayer(world, m.def.special.damage, m.x);
        m.gloatAt = world.now;
      }
    }
    // (A napping monster is harmless: world/habits.js.)
    if (m.hp <= 0 || world.dead || world.invuln > 0 || m.frozenUntil > world.now || napping(m, world.now)) continue;
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
  // Team moves: revives, the side-by-side link, a Group Finisher's burst (world/teamwork.js).
  tickTeam(world, dt);
  // Monsters don't pop up right on top of you or your party.
  const near = [world.body, ...(world.bots?.list ?? []).filter((b) => b.party && b.body && b.map === world.map.id).map((b) => b.body)];
  if (world.net) near.push(...world.net.bodies(world));
  if (!mirrored) world.mobs.push(...tickSpawner(world.spawner, world.map, world.now, near, (sp) => spawnAllowed(world, sp)));
  // The queens' moves, and their warnings going off.
  tickStory(world, dt, hurtPlayer);
  world.mobs = world.mobs.filter((m) => m.hp > 0 || m.dying < 0.5);

  world.drops = updateDrops(world.drops, world.map, dt);

  // ----- Regeneration -----
  world.regenTimer -= dt;
  if (world.regenTimer <= 0 && !world.dead) {
    world.regenTimer = REGEN_EVERY;
    const s = world.stats;
    const calm = world.now - Math.max(world.hurtAt ?? -99, world.hitsAt ?? -99) >= OUT_OF_FIGHT;
    const k = REST_PCT * (world.map.isTown ? 2 : 1);
    if (calm) {
      char.hp = Math.min(s.maxHp, char.hp + Math.max(1, Math.round(s.maxHp * k)));
      char.mp = Math.min(s.maxMp, char.mp + Math.max(1, Math.round(s.maxMp * k)));
    } else char.mp = Math.min(s.maxMp, char.mp + Math.max(1, Math.round((2 + Math.floor(s.int / 20) + s.mpRegen) / 5)));
  }
  // Stat points go straight where the job needs them (Options: Auto stats).
  if (char.ap > 0 && settings.autoStats !== false) autoAssignAp(char);

  // ----- Visual timers -----
  for (const f of world.fx) {
    f.t += dt;
    // An effect carried along with the hero (the Paladin's wall of light as she rushes).
    if (f.follow) {
      f.dir = world.body.facing;
      f.x = world.body.x + f.dir * (f.ahead ?? 0);
      f.y = world.body.y;
    }
  }
  // Arrows and bolts track the monster they were loosed at (knocked back, launched, walking): a
  // shot heads for where it is now; a piercing one keeps its line through it out to its reach.
  for (const f of world.fx) {
    // (The Blade Dancer's ring flying home finds her hand wherever she has moved to.)
    if (f.kind === 'projectile' && f.home && f.t < f.dur) {
      f.tx = world.body.x + world.body.facing * 10;
      f.ty = world.body.y - 15;
    }
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
