// Dungeon runs: a group of four (you, your party, and players the group finder brings in) going
// room by room through an instance. While a run is on (world.dungeon):
//   - everyone in the group has HP; monsters swing at whoever they're angriest at (threat, which
//     damage builds, a tank's five times over; healing builds a little too) instead of hurting on
//     touch, and packs fight together;
//   - bosses have moves the group has to answer (spore patches to step out of, a charge to dodge,
//     a slam to jump over, adds to kill), telegraphed on the floor first;
//   - a room's exit stays sealed until its monsters are down and its task is done;
//   - fallen members get back up once the fight is over; if everyone falls, the room resets and
//     the group regroups at its entrance.

import { faithGuard, pathSchool } from './melee.js';
import { ventGuard } from './engineer.js';
import { lastRite } from './idol.js';
import { hurtProcs, blockOnHit } from './combat.js';
import { DUNGEONS, GROUP, ROLES, roleOf, PROVOKE, TANK_THREAT } from '../data/dungeons.js';
import { JOBS, jobChain } from '../data/jobs.js';
import { ITEMS, JOB_SLOTS, GEAR_FAMILIES, jobGearId } from '../data/items.js';
import { computeStats } from '../core/stats.js';
import { gainExp } from '../core/character.js';
import { addItem } from '../core/inventory.js';
import { makeEquip, itemName, makeCash } from '../core/items.js';
import { avoid, mobHitChance, damageTaken } from '../core/formulas.js';
import { knockBack } from './physics.js';
import { spawnMob, yank, tickYank, tickAir } from './mobs.js';
import { navOf, surfaceBelow } from './nav.js';
import { partyMembers, joinParty, dismiss, makeAI } from './party.js';
import { recruitBot } from './bots.js';
import { SKILLS } from '../data/skills.js';
import { speak, contextOf } from './chatter.js';
import { botChat } from './chatlog.js';
import { placeInGroup, focusOf, behindSide, shared, callout as callOut } from './botfight.js';
import { loadMap } from './world.js';
import { radio, roomSetup, tickRoom, cheerOf, capperPhases, sporeSprout, pillarHit, boarPhases, gnarlPhases, heartMultiplier, hollowCalmed, floodComing, onFloor } from './hollow.js';
import { playScene } from './story.js';
import { SETS, SET_SLOTS, setPieceId } from '../data/sets.js';
import { today } from '../core/quests.js';
import { HARD_PARTY, CHEST_TOKENS } from '../data/coop.js';

const between = (a, b, rng = Math.random) => a + rng() * (b - a);
const pick = (list, rng = Math.random) => list[Math.floor(rng() * list.length)];

const AGGRO = 110; // how close you can get to a pack before it notices you
const BOSS_AGGRO = 190;
const LEASH = 50; // how far an idle monster strays from its spot
const STAND_UP = 4; // seconds after a fight before the fallen get back up on their own
const WIPE_DELAY = 2.5;

// ---------- Hard mode ----------
// A Hard run: monsters have more than twice the health and hit half again as hard, and the
// rewards grow to match.
export const HARD = { hp: 2.2, hurt: 1.5, reward: 2 };
const hardDefs = new Map();
function hardOf(def) {
  if (!hardDefs.has(def)) hardDefs.set(def, { ...def, hp: Math.round(def.hp * HARD.hp), exp: Math.round(def.exp * 1.5), name: def.name });
  return hardDefs.get(def);
}
function toughen(world, m) {
  if (!world.dungeon?.hard || m.hard) return;
  m.hard = true;
  m.def = hardOf(m.def);
  m.hp = m.def.hp;
}

// ---------- The group ----------

// Everyone in the group on this map: { id, name, role, body, bot } (bot is null for you).
export function groupOf(world) {
  const roles = world.dungeon?.roles ?? {};
  const out = [{ id: 'you', name: world.char.name, role: roles.you ?? 'dps', body: world.body, bot: null }];
  for (const bot of partyMembers(world.bots)) {
    if (bot.body && bot.map === world.map.id) out.push({ id: bot.id, name: bot.name, role: roles[bot.id] ?? 'dps', body: bot.body, bot });
  }
  // Friends in a shared online run (net/dungeonrun.js).
  if (world.net?.runMembers) out.push(...world.net.runMembers(world));
  return out;
}

export const isUp = (world, g) => (g.remote ? !g.remote.dead : g.bot ? !g.bot.down : !world.dead);
export const hpOf = (world, g) => (g.remote ? g.remote.hp ?? 0 : g.bot ? g.bot.hp ?? 0 : world.char.hp);
export const maxHpOf = (world, g) => (g.remote ? g.remote.maxHp ?? 1 : g.bot ? g.bot.stats.maxHp : world.stats.maxHp);
// Shared online runs: the leader runs the rooms, the others follow.
const leading = (world) => Boolean(world.net?.isLeader?.(world));
const following = (world) => Boolean(world.net?.isFollower?.(world));

// Who would fill each role: you, then your party members, and the finder for any open spot.
// Returns { slots: [{ role, who }] } (who is 'you', a party member, or null for a recruit), or
// { why } when the group can't be made.
export function planGroup(world, id = 'hollow') {
  const def = DUNGEONS[id];
  const char = world.char;
  const mine = roleOf(char.job, JOBS[char.job].family);
  if (!mine) return { why: 'Get your first job before you take on a dungeon.' };
  if (char.level < def.minLevel) return { why: `You need to be level ${def.minLevel} to enter.` };
  const party = partyMembers(world.bots);
  if (party.length > GROUP.length - 1) return { why: `A dungeon group is ${GROUP.length} players, and your party is too big.` };
  const open = [...GROUP];
  const slots = [];
  const take = (role, who) => {
    const i = open.indexOf(role);
    if (i < 0) return false;
    open.splice(i, 1);
    slots.push({ role, who });
    return true;
  };
  take(mine, 'you');
  // Friends online at the gate come along first.
  for (const g of world.net?.friendsAtGate?.(world) ?? []) {
    const role = roleOf(g.job, JOBS[g.job].family);
    if (take(role, { friend: g })) continue;
  }
  for (const bot of party) {
    const role = roleOf(bot.char.job, JOBS[bot.char.job].family);
    if (!role) return { why: `${bot.name} needs a job before they can come.` };
    if (!take(role, bot)) return { why: `Your group already has its ${ROLES[role].label}${role === 'dps' ? 's' : ''}, so ${bot.name} doesn't fit. A group is 1 Tank, 1 Healer, and 2 DPS.` };
  }
  for (const role of open) slots.push({ role, who: null });
  const order = ['tank', 'healer', 'dps'];
  slots.sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role));
  return { slots };
}

// The finder brings in a player for a role.
function recruit(world, def, role) {
  const rng = world.bots.rng;
  const [lo, hi] = def.recruit[role];
  const level = Math.floor(between(lo, hi + 1, rng));
  // Past level 30 the Spirit Mages have taken a path: a healer comes as a Shrine Maiden, and now and
  // then a damage dealer is an Onmyoji.
  const sage = level >= 30;
  const jobs = role === 'tank' ? ['warrior'] : role === 'healer' ? (sage ? ['spiritmage', 'shrinemaiden'] : ['spiritmage'])
    : sage && rng() < 0.3 ? ['spiritmage', 'onmyoji'] : [pick(['archer', 'thief'], rng)];
  const bot = recruitBot(world.bots, world, { level, jobs });
  joinParty(world.bots, bot, world);
  const ranged = bot.ai.weapon.ranged;
  bot.ai = makeAI(bot, rng, role === 'tank' ? 'guardian' : role === 'healer' ? 'healer' : ranged ? 'sniper' : 'rusher');
  bot.finder = def.id;
  groupSay(world, bot, 'dgHello');
  return bot;
}

// A recruit says something about the run, in their own voice, through the same chat as everyone
// else (no repeats, paced, in your log as party chat). `kind` is a dungeon template in chatter.js.
export function groupSay(world, bot, kind, extra = {}) {
  const bots = world.bots;
  if (!bots || !bot) return false;
  const line = speak((bots.memory ??= new Set()), kind, { ...contextOf(bot, bots, world), ...extra }, bot.style ?? {}, bots.rng ?? Math.random);
  return line ? botChat(world, bot, line, { prefix: '[Party] ', color: '#9fe0b0' }) : false;
}

function prep(bot) {
  bot.stats = computeStats(bot.char);
  bot.hp = bot.stats.maxHp;
  bot.down = false;
  bot.inDungeon = true;
  bot.session = Math.max(bot.session ?? 0, 1800);
}

// Hard mode is for parties: you and at least one member (a party member, or a friend online in
// your party), and only after a first clear. Returns why not, or null.
export function partySize(world) {
  return 1 + partyMembers(world.bots).filter((b) => !b.finder).length + (world.net?.partyFriendCount?.(world) ?? 0);
}
const HARD_SOLO = 'Hard mode is party-only: bring at least one party member.';
export function hardBlocker(world, id = 'hollow') {
  if (!world.char.dungeons?.[id]?.clears) return `Clear ${DUNGEONS[id].name} once to open Hard mode.`;
  return partySize(world) < HARD_PARTY ? HARD_SOLO : null;
}

// Forms the group and goes in. Returns a reason string when it can't.
export function startRun(world, id = 'hollow', { hard = false } = {}) {
  const plan = planGroup(world, id);
  if (plan.why) return plan.why;
  if (hard && partySize(world) < HARD_PARTY) return HARD_SOLO;
  if (!world.bots) return 'No one else is online.';
  const def = DUNGEONS[id];
  const roles = {};
  for (const s of plan.slots) {
    if (s.who?.friend) {
      roles[s.who.friend.id] = s.role;
      continue;
    }
    const bot = s.who === 'you' ? null : s.who ?? recruit(world, def, s.role);
    roles[bot ? bot.id : 'you'] = s.role;
  }
  world.dungeon = { id, roles, rooms: {}, start: world.now, wipes: 0, downs: 0, cheer: 0, hard, zones: [], shots: [], vfx: [], callout: null, done: false };
  for (const bot of partyMembers(world.bots)) prep(bot);
  // Friends in the group go in with you, your game leading the run.
  if (plan.slots.some((s) => s.who?.friend)) world.net.startShared(world, roles, hard);
  loadMap(world, def.rooms[0], 'start');
  world.log(`Your group enters ${def.name}${hard ? ' (Hard)' : ''}! You are the ${ROLES[roles.you].label}.`, '#ffe36b');
  if (roles.you === 'tank') world.log('Tanks: as your Valor fills, War Cry turns everything nearby onto you and guards the group.', '#bff0dc');
  return null;
}

// The run is over: you left (or finished). Finder recruits say goodbye and go.
function endRun(world) {
  const run = world.dungeon;
  world.dungeon = null;
  world.channel = null;
  for (const bot of partyMembers(world.bots)) {
    bot.down = false;
    bot.inDungeon = false;
    bot.hp = null;
    if (bot.finder) {
      bot.bubble = { text: run.done ? pick(['gg!', 'ty for the run!', 'gg wp <3', 'that was fun', 'gg ez']) : pick(['gl!', 'cya', 'oh ok bye', 'brb food']), t: 4 };
      dismiss(world.bots, bot, world, { quiet: true });
    }
  }
  if (run.done) world.log(`${DUNGEONS[run.id].name} complete! Time ${clock(world.now - run.start)}, wipes: ${run.wipes}.`, '#ffe36b');
}

export function clock(secs) {
  const s = Math.max(0, Math.floor(secs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ---------- Rooms ----------

// Called after every map load: picks a room's state back up, ends the run when you walk out,
// and sends you to the gate if you somehow arrive without one (like loading a save inside).
export function onMapLoaded(world) {
  const map = world.map;
  const run = world.dungeon;
  if (!map.dungeon) {
    if (run) endRun(world);
    return;
  }
  if (!run || run.id !== map.dungeon) {
    loadMap(world, DUNGEONS[map.dungeon].gate, 'start');
    world.log('Your group scattered. Talk to the warden to go back in.', '#d4cbe8');
    return;
  }
  let room = run.rooms[map.id];
  if (!room) {
    room = run.rooms[map.id] = {
      spawner: world.spawner, adds: [], keys: [], keysGot: 0, cleared: false,
      // Things in the room stand on the floor unless they're given a height (`y`, on a ledge).
      objects: (map.objects ?? []).map((o, i) => ({ y: map.groundY, ...o, id: i, done: false, progress: 0 })),
    };
    roomSetup(world, room);
    radio(world, `enter:${map.id}`);
    for (const m of world.mobs) {
      toughen(world, m);
      settle(m);
    }
  } else {
    world.spawner = room.spawner;
    world.mobs = [...room.spawner.slots.map((s) => s.mob), ...room.adds].filter((m) => m && m.hp > 0);
  }
  // Walking out of a fight calms it down.
  for (const m of world.mobs) if (m.engaged) reset(m);
  room.adds = room.adds.filter((m) => m.hp > 0 && world.mobs.includes(m));
  run.room = room;
  run.callout = null;
  run.zones = [];
  run.shots = [];
  run.wipeIn = 0;
  run.standIn = 0;
}

// Keeps a monster near its spot until something picks a fight.
function settle(m) {
  m.home ??= m.x;
  m.fx1 ??= m.x1;
  m.fx2 ??= m.x2;
  m.x1 = Math.max(m.fx1, m.home - LEASH);
  m.x2 = Math.min(m.fx2, m.home + LEASH);
}

function reset(m) {
  Object.assign(m, {
    hp: m.def.hp, engaged: false, threat: {}, taunt: null, windup: 0, mech: null, shield: false, vulnUntil: 0,
    frozenUntil: 0, poison: null, x: m.home ?? m.x, state: 'idle', stagger: 0, knockVx: 0, aggroUntil: 0, charging: null,
  });
  settle(m);
}

export function roomCleared(world) {
  return Boolean(world.dungeon?.room?.cleared);
}

// The room's task, as { label, have, need }, or null.
export function taskProgress(world) {
  const run = world.dungeon;
  const task = world.map.task;
  if (!run?.room || !task) return null;
  if (task.kind === 'keys') return { label: task.label, have: run.room.keysGot, need: task.count };
  const kind = task.kind === 'light' ? 'glowcap' : 'cage';
  const list = run.room.objects.filter((o) => o.kind === kind);
  return { label: task.label, have: list.filter((o) => o.done).length, need: list.length };
}

function mobsLeft(world) {
  const room = world.dungeon.room;
  return room.spawner.slots.filter((s) => s.mob && s.mob.hp > 0).length + room.adds.filter((m) => m.hp > 0).length;
}

function checkClear(world) {
  const run = world.dungeon;
  const room = run.room;
  if (room.cleared || mobsLeft(world)) return;
  const task = taskProgress(world);
  if (task && task.have < task.need) return;
  room.cleared = true;
  const last = DUNGEONS[run.id].rooms.at(-1) === world.map.id;
  if (last) {
    run.done = true;
    callout(world, `${DUNGEONS[run.id].name} cleared!`, 'Open the chest for your reward');
  } else {
    callout(world, 'Room cleared!', 'The way ahead is open');
    radio(world, `clear:${world.map.id}`);
  }
  world.juice.push({ type: 'shake', mag: 2, dur: 0.4 });
  for (const g of groupOf(world)) {
    if (g.bot && !g.bot.down && Math.random() < 0.5) groupSay(world, g.bot, last ? 'dgDone' : world.mobs.some((m) => m.def.boss) ? 'dgBoss' : 'dgClear', { boss: world.mobs.find((m) => m.def.boss)?.def.name ?? null });
  }
}

// A sealed exit stays shut until the room is cleared.
export function portalSealed(world, portal) {
  return Boolean(portal.sealed && world.dungeon && !roomCleared(world));
}

// ---------- Talking to the room: glowcaps, cages, the chest ----------

const CHANNEL = { glowcap: 1, cage: 1.5 };

function objectNear(world, body, reach = 26) {
  const room = world.dungeon?.room;
  if (!room || !body.onGround) return null;
  return room.objects.find((o) => !o.done && Math.abs(o.x - body.x) < reach && Math.abs(body.y - o.y) <= 4) ?? null;
}

// Up near something usable: start lighting or freeing it, or open the chest.
export function dungeonInteract(world) {
  const o = objectNear(world, world.body);
  if (!o) return false;
  if (o.kind === 'cache') {
    openCache(world, o);
    return true;
  }
  if (o.kind === 'chest') {
    if (!roomCleared(world)) world.log('The chest is wrapped in roots. Calm Gnarlroot first!', '#ffb3c6');
    else openChest(world, o);
    return true;
  }
  if (world.dungeon.room.objects.some((x) => x.engagedBy && x !== o)) return true;
  world.channel = { obj: o, t: o.progress * CHANNEL[o.kind], dur: CHANNEL[o.kind], x: world.body.x };
  return true;
}

function finish(world, o, who) {
  o.done = true;
  o.progress = 1;
  if (following(world)) world.net.runLeader(world, { op: 'obj', map: world.map.id, i: o.id });
  const task = taskProgress(world);
  const count = task ? ` (${task.have}/${task.need})` : '';
  if (o.kind === 'glowcap') world.log(`${who} lit a glowcap${count}.`, '#ffe9a0');
  if (o.kind === 'cage') {
    world.log(`${who} freed a Sprout${count}!`, '#bff0dc');
    // Every Sprout freed follows the group and cheers it on for the rest of the run.
    world.dungeon.cheer = (world.dungeon.cheer ?? 0) + 1;
    callout(world, 'A Sprout cheers you on!', `Sprout Cheer x${world.dungeon.cheer}: +${world.dungeon.cheer * 4}% damage`);
    radio(world, 'cheer');
    world.numbers.push({ x: o.x, y: o.y - 44, text: 'Thank you!', color: '#9be08f', t: 0, small: true });
  }
  world.juice.push({ type: 'loot', x: o.x, y: o.y - 16, color: o.kind === 'glowcap' ? '#ffd66b' : '#9be08f' });
}

function tickChannels(world, dt, group) {
  const run = world.dungeon;
  const ch = world.channel;
  if (ch) {
    const b = world.body;
    if (world.dead || ch.obj.done || Math.abs(b.x - ch.x) > 4 || world.attackTimer > 0) world.channel = null;
    else {
      ch.t += dt;
      ch.obj.progress = Math.min(1, ch.t / ch.dur);
      if (ch.t >= ch.dur) {
        finish(world, ch.obj, 'You');
        world.channel = null;
      }
    }
  }
  // Party members work on their own tasks.
  for (const g of group) {
    const br = g.bot?.brain;
    if (!br?.task || g.bot.down) continue;
    const o = br.task;
    if (o.done || run.combat || Math.abs(o.x - g.body.x) > 20 || Math.abs(o.y - g.body.y) > 6 || !g.body.onGround) {
      br.taskT = 0;
      continue;
    }
    br.taskT = (br.taskT ?? 0) + dt;
    o.progress = Math.max(o.progress, Math.min(1, br.taskT / CHANNEL[o.kind]));
    if (!g.bot.attack) g.bot.attack = { pose: 'pray', t: 0, dur: 0.6 };
    if (br.taskT >= CHANNEL[o.kind]) {
      finish(world, o, g.name);
      br.task = null;
      br.taskT = 0;
    }
  }
  // Root keys on the floor go to whoever walks over them.
  const room = run.room;
  for (const k of room.keys) {
    if (k.got) continue;
    k.t += dt;
    const g = group.find((m) => isUp(world, m) && Math.abs(m.body.x - k.x) < 18 && Math.abs(m.body.y - k.y) < 30);
    if (!g) continue;
    k.got = true;
    room.keysGot++;
    const task = taskProgress(world);
    world.log(`${g.bot ? g.name : 'You'} found a Root Key (${task.have}/${task.need}).`, '#ffd66b');
    world.juice.push({ type: 'loot', x: k.x, y: k.y - 10, color: '#ffd66b' });
    if (task.have >= task.need) callout(world, 'The Root Gate unlocks!', 'Clear the rest and head through');
  }
}

// ---------- The end of a run: grade and rewards ----------

// The run's grade: S for a quick clean run, down to C. `secs` is how long it took.
export function gradeOf(secs, wipes, downs) {
  if (wipes === 0 && downs <= 2 && secs <= 12 * 60) return 'S';
  if (wipes === 0 && secs <= 16 * 60) return 'A';
  if (wipes <= 1) return 'B';
  return 'C';
}
const GRADE_BONUS = { S: 1.5, A: 1.25, B: 1.1, C: 1 };
const GRADE_ORDER = ['C', 'B', 'A', 'S'];

// The set piece for this hero's job from a dungeon's set (one they're missing first), or null.
function setPieceFor(char, set) {
  const family = JOBS[char.job]?.family;
  if (!SETS[set] || !GEAR_FAMILIES.includes(family)) return null;
  const owned = new Set([...Object.values(char.equipment), ...char.inventory.equip].filter(Boolean).map((e) => e.id));
  const missing = SET_SLOTS.filter((s) => !owned.has(setPieceId(set, family, s)));
  return setPieceId(set, family, pick(missing.length ? missing : SET_SLOTS));
}

// A room's hidden cache (its secret): tucked off the main way, never needed to go on, open any
// time. A handful of gold, a Hollow Acorn and potions, doubled on Hard.
function openCache(world, o) {
  const run = world.dungeon;
  const char = world.char;
  const k = run.hard ? HARD.reward : 1;
  o.done = true;
  o.open = true;
  const gold = Math.round((150 + Math.random() * 150) * k);
  char.gold += gold;
  world.log(`A hidden cache! +${gold} gold`, '#ffe36b');
  for (const [id, qty] of [['hollow_acorn', k], [Math.random() < 0.5 ? 'orange_potion' : 'white_potion', 3 * k], ['gacha_ticket', 1]]) {
    if (ITEMS[id] && addItem(char.inventory, id, qty)) world.log(`Received ${ITEMS[id].name} x${qty}.`, ITEMS[id].color);
  }
  world.juice.push({ type: 'loot', x: o.x, y: o.y - 20, color: '#ffd66b' });
  world.fx.push({ kind: 'levelup', x: o.x, y: o.y, t: 0, dur: 1.2 });
}

function openChest(world, o) {
  const run = world.dungeon;
  const def = DUNGEONS[run.id];
  const reward = def.reward;
  const char = world.char;
  o.done = true;
  o.open = true;
  const secs = world.now - run.start;
  const grade = gradeOf(secs, run.wipes, run.downs);
  // The first clear of the day brings a bonus; Hard doubles everything.
  const rec = ((char.dungeons ??= {})[run.id] ??= { clears: 0, hardClears: 0, best: null, bestTime: null, day: null });
  const daily = rec.day !== today();
  const k = GRADE_BONUS[grade] * (run.hard ? HARD.reward : 1);
  const exp = Math.round(reward.exp * k);
  const gold = Math.round(reward.gold * k);
  const cash = reward.cash + (daily ? 500 : 0);
  const levels = gainExp(char, exp);
  char.gold += gold;
  char.cash = (char.cash ?? 0) + cash;
  world.log(`Treasure! +${exp} EXP, +${gold} gold, +${cash} Cash`, '#ffe36b');
  const give = (inst) => {
    if (addItem(char.inventory, inst)) world.log(`Received ${itemName(inst)}!`, '#ffd66b');
    else world.log(`Your bag is full, so the ${itemName(inst)} stays in the chest...`, '#ffb3c6');
  };
  const family = JOBS[char.job].family;
  const slot = pick(JOB_SLOTS);
  const id = GEAR_FAMILIES.includes(family) ? jobGearId(family, slot, reward.gearLevel) : `ear_${reward.gearLevel}`;
  if (ITEMS[id]) give(makeEquip(id, { rarity: run.hard ? 2 : Math.random() < 0.3 ? 2 : 1, variant: 'roll' }));
  // A piece of the dungeon's own set: sure on Hard or the day's first clear, half the time otherwise.
  if (def.set && (run.hard || daily || Math.random() < 0.5)) {
    const piece = setPieceFor(char, def.set);
    if (piece) give(makeEquip(piece, { rarity: run.hard ? 2 : 1, variant: 'roll' }));
  }
  // A capsule ticket for the day's first clear, and one more on Hard.
  const tickets = (daily ? 1 : 0) + (run.hard ? 1 : 0);
  if (tickets && addItem(char.inventory, 'gacha_ticket', tickets)) world.log(`Received Capsule Ticket x${tickets}.`, ITEMS.gacha_ticket.color);
  for (const it of reward.items) {
    const qty = it.qty * (run.hard ? 2 : 1) + (daily && it.id === 'hollow_acorn' ? 5 : 0);
    if (addItem(char.inventory, it.id, qty)) world.log(`Received ${ITEMS[it.id].name} x${qty}.`, ITEMS[it.id].color);
  }
  // Party Tokens (data/coop.js): three times as many on Hard, and Hard's own crown, sure on the
  // first Hard clear and now and then after.
  const tokens = run.hard ? CHEST_TOKENS.hard : CHEST_TOKENS.normal;
  if (addItem(char.inventory, 'party_token', tokens)) world.log(`Received Party Token x${tokens}.`, ITEMS.party_token.color);
  if (run.hard && (!rec.hardClears || Math.random() < 0.15) && addItem(char.inventory, makeCash('cash_rootwood_crown'))) {
    world.log(`Hard clear! Received ${ITEMS.cash_rootwood_crown.name}, only found on Hard.`, '#7fd1a0');
  }
  // The records: clears, best grade and time, Hard unlocked.
  rec.clears += 1;
  if (run.hard) rec.hardClears += 1;
  if (!rec.best || GRADE_ORDER.indexOf(grade) > GRADE_ORDER.indexOf(rec.best)) rec.best = grade;
  if (rec.bestTime == null || secs < rec.bestTime) rec.bestTime = Math.round(secs);
  rec.day = today();
  if (rec.clears === 1) world.log(`Hard mode for ${def.name} is open! Ask ${def.warden[0].toUpperCase()}${def.warden.slice(1)} at the gate.`, '#ffe36b');
  world.juice.push({ type: 'loot', x: o.x, y: o.y - 20, color: '#ffd66b' }, { type: 'shake', mag: 2, dur: 0.3 });
  world.fx.push({ kind: 'levelup', x: o.x, y: o.y, t: 0, dur: 1.6 });
  if (levels > 0) {
    world.events.push({ type: 'levelup', level: char.level });
    world.log(`Level up! You are now level ${char.level}.`, '#ffe36b');
  }
  // The run's result card.
  const notes = [run.hard ? 'Hard' : 'Normal', `${run.wipes} wipe${run.wipes === 1 ? '' : 's'}`, `${run.downs} down${run.downs === 1 ? '' : 's'}`, daily ? 'daily bonus!' : null].filter(Boolean).join(' · ');
  playScene(world, 'hollow_results', { grade, time: clock(secs), notes, bonus: `${Math.round((GRADE_BONUS[grade] - 1) * 100)}%` });
}

// ---------- Threat ----------

// Wakes a monster and its whole pack up.
function engage(world, m, by = null) {
  if (!m.engaged) {
    const pack = m.spawn?.pack;
    const list = pack ? world.mobs.filter((o) => o.spawn?.pack === pack && o.hp > 0 && !o.engaged) : [m];
    for (const o of list) {
      o.engaged = true;
      o.threat ??= {};
      o.x1 = o.fx1 ?? o.x1;
      o.x2 = o.fx2 ?? o.x2;
      o.atkT = between(0.5, 1.1);
      if (by) o.threat[by] = Math.max(o.threat[by] ?? 0, 1);
    }
    if (m.def.boss) {
      callout(world, m.def.name, BOSS_LINES[m.def.mech] ?? '');
      // Each boss meets the group with a scene, once a run.
      const run = world.dungeon;
      run.met ??= {};
      if (!run.met[m.def.mech]) {
        run.met[m.def.mech] = true;
        playScene(world, `hollow_${m.def.mech}`);
      }
    }
  }
  if (by) m.threat[by] = Math.max(m.threat[by] ?? 0, 1);
}

const BOSS_LINES = {
  capper: '"Who is trampling my garden?!"',
  boar: '"GRUNT! You smell like trouble!"',
  gnarl: '"Hrrmm... too noisy... far too noisy..."',
};

// A queued hit landing on a monster: wakes it, and adds threat for whoever hit it. Returns the
// damage to deal (dazed monsters take more; a shielded boss takes less).
export function noteHit(world, m, h) {
  const run = world.dungeon;
  const who = h.party ?? 'you';
  let damage = h.miss ? 0 : h.damage;
  if (m.vulnUntil > world.now) damage = Math.round(damage * 1.5);
  if (m.shield) damage = Math.round(damage * 0.5);
  // The Sprouts' cheering, and Gnarlroot's open heart (up high is where it's reached).
  const body = groupOf(world).find((g) => g.id === who)?.body;
  damage = Math.round(damage * cheerOf(run) * heartMultiplier(world, m, body));
  engage(world, m, who);
  m.threat[who] = (m.threat[who] ?? 0) + Math.max(1, damage) * (run.roles[who] === 'tank' ? TANK_THREAT : 1);
  return damage;
}

// Healing makes every monster in the fight a little angry at the healer.
function healThreat(world, who, amount) {
  for (const m of world.mobs) if (m.engaged && m.hp > 0) m.threat[who] = (m.threat[who] ?? 0) + amount * 0.5;
}

// A monster turns on `who` and sticks with them for `hold` seconds.
function taunt(world, m, who, hold) {
  engage(world, m, who);
  const top = Math.max(0, ...Object.values(m.threat));
  m.threat[who] = top * 1.2 + 50;
  m.taunt = { id: who, until: world.now + hold };
}

// Every monster within `range` turns on `who` (a Warrior's War Cry or taunting blow), in the colour of the path
// that cried it (`school`; yours by default).
export function provoke(world, who, body, range = PROVOKE.range, hold = PROVOKE.hold, school = who === 'you' ? pathSchool(world.char) : 'steel') {
  if (who === 'you' && following(world)) world.net.runLeader(world, { op: 'provoke', map: world.map.id, range, hold });
  let n = 0;
  for (const m of world.mobs) {
    if (m.hp <= 0 || m.def.fight?.mender || Math.abs(m.x - body.x) > range || Math.abs(m.y - body.y) > 120) continue;
    taunt(world, m, who, hold);
    n++;
  }
  world.fx.push({ kind: 'roar', school, x: body.x, y: body.y, r: range, t: 0, dur: 0.6 });
  return n;
}

// The warrior's Chain Hook in a dungeon: the monsters it catches turn on `who` and get dragged
// over, lined up in front of them for the group (bosses are too heavy to move).
export function hookMobs(world, who, body, mobs, dir) {
  if (who === 'you' && following(world)) world.net.runLeader(world, { op: 'hook', map: world.map.id, mobs: mobs.map((m) => m.net).filter(Boolean), dir });
  mobs.forEach((m, i) => {
    taunt(world, m, who, 2);
    if (!m.def.boss) yank(m, body.x + dir * (m.def.w / 2 + 14 + i * 14));
  });
}

// ---------- Hurting and healing the group ----------

export function hurtMember(world, g, raw, fromX, { knock = false, pierce = false } = {}) {
  if (!isUp(world, g)) return 0;
  // A friend online takes the hit in their own game.
  if (g.remote) {
    world.net.runTo(world, g.id, { op: 'hurt', raw, fromX, knock, pierce });
    return raw;
  }
  if (world.dungeon?.hard) raw *= HARD.hurt;
  const body = g.body;
  if (g.bot) {
    const bot = g.bot;
    const dmg = absorb(world, body, bot.buffs, Math.round((pierce ? raw : damageTaken(raw, bot.stats.wdef)) * (bot.stats.guard ?? 1) * (1 - cutOf(bot.buffs, world.now))));
    bot.hp = Math.max(0, bot.hp - dmg);
    bot.hurt = 0.3;
    world.numbers.push({ x: body.x, y: body.y - body.h - 6, text: `${dmg}`, color: '#ff8fa8', t: 0, small: true });
    if (knock) knockBack(body, fromX);
    if (bot.hp <= 0) {
      bot.down = true;
      if (world.dungeon) world.dungeon.downs += 1;
      bot.attack = null;
      bot.brain.target = null;
      bot.brain.task = null;
      groupSay(world, bot, 'dgDown');
      world.log(`${bot.name} is down!`, '#ff8fa8');
    }
    return dmg;
  }
  if (world.god || blockOnHit(world, fromX)) return 0;
  const char = world.char;
  const s = world.stats;
  let dmg = absorb(world, body, char.buffs, Math.round((pierce ? raw : damageTaken(raw, s.wdef)) * (s.guard ?? 1) * (1 - cutOf(char.buffs, world.now)) * (1 - faithGuard(world)) * (1 - ventGuard(world, fromX))));
  if (s.manaShield > 0) {
    const toMp = Math.min(char.mp, Math.floor(dmg * s.manaShield));
    char.mp -= toMp;
    dmg -= toMp;
  }
  char.hp = Math.max(0, char.hp - dmg);
  world.numbers.push({ x: body.x, y: body.y - body.h - 6, text: `${dmg}`, color: '#ff6b8a', t: 0 });
  world.invuln = Math.max(world.invuln, 0.7);
  world.juice.push({ type: 'hurt', x: body.x, y: body.y - body.h / 2 });
  world.channel = null;
  if (knock) knockBack(body, fromX);
  // (A Shrine Maiden's Last Rite keeps her standing, once.)
  if (char.hp <= 0 && !lastRite(world)) {
    world.dead = true;
    if (world.dungeon) world.dungeon.downs += 1;
    world.events.push({ type: 'death' });
    world.log('You fainted! Your group can get you back up after the fight.', '#ff6b8a');
  }
  hurtProcs(world, dmg);
  return dmg;
}

function healMember(world, g, amount, by) {
  if (!isUp(world, g)) return 0;
  if (g.remote) {
    world.net.runTo(world, g.id, { op: 'heal', amount: Math.round(amount) });
    world.numbers.push({ x: g.body.x, y: g.body.y - g.body.h - 10, text: `+${Math.round(amount)}`, color: '#7ee081', t: 0, small: true });
    return Math.round(amount);
  }
  const max = maxHpOf(world, g);
  const before = hpOf(world, g);
  const after = Math.min(max, before + Math.round(amount));
  if (g.bot) g.bot.hp = after;
  else world.char.hp = after;
  world.numbers.push({ x: g.body.x, y: g.body.y - g.body.h - 10, text: `+${after - before}`, color: '#7ee081', t: 0, small: Boolean(g.bot) });
  world.fx.push({ kind: 'heal', x: g.body.x, y: g.body.y, t: 0, dur: 0.8 });
  healThreat(world, by, after - before);
  return after - before;
}

// Your heal spells also heal party members they reach.
export function healMembers(world, pct, box) {
  // Following a friend's run, the leader's game heals the bots there.
  if (following(world)) world.net.runLeader(world, { op: 'groupheal', map: world.map.id, pct, box });
  for (const g of groupOf(world)) {
    if (g.id === 'you' || !isUp(world, g)) continue;
    const b = g.body;
    if (b.x < box.x || b.x > box.x + box.w || b.y - b.h > box.y + box.h || b.y < box.y) continue;
    healMember(world, g, maxHpOf(world, g) * pct, 'you');
  }
}

// ---------- Support magic ----------

// Shield Wall and Rally Cry take a share off every hit (never more than 60%).
export function cutOf(buffs, now) {
  let cut = 0;
  for (const b of Object.values(buffs ?? {})) if (b.until > now && b.values?.dmgCut) cut += b.values.dmgCut;
  return Math.min(0.6, cut);
}

// A barrier soaks up damage before HP; it pops when used up. Returns the damage left over.
export function absorb(world, body, buffs, dmg) {
  for (const b of Object.values(buffs ?? {})) {
    if (!(b.shield > 0) || b.until <= world.now || dmg <= 0) continue;
    const take = Math.min(b.shield, dmg);
    b.shield -= take;
    dmg -= take;
    world.numbers.push({ x: body.x + 10, y: body.y - body.h - 2, text: `(${take})`, color: '#9fd8ff', t: 0, small: true });
    if (b.shield <= 0) {
      b.until = world.now;
      if (b.values?.barrier && b.name === 'Spirit Ward') world.fx.push({ kind: 'wardbreak', x: body.x, y: body.y, t: 0, dur: 0.6 });
    }
  }
  return dmg;
}

// A support buff on one member of the group: yours lands in your buffs, a party member's in theirs.
export function giveBuff(world, g, id, name, values, duration) {
  const max = maxHpOf(world, g);
  const b = { until: world.now + duration, since: world.now, values, name };
  if (values.barrier) b.shield = Math.round(max * values.barrier);
  if (g.remote) world.net.runTo(world, g.id, { op: 'buff', id, name, values, duration, shield: b.shield });
  else if (g.bot) (g.bot.buffs ??= {})[id] = b;
  else world.char.buffs[id] = b;
}

// A party buff spell reaching the members in `box` (you got yours already).
export function buffMembers(world, id, name, params, box) {
  if (following(world)) world.net.runLeader(world, { op: 'groupbuff', map: world.map.id, id, name, params, box });
  for (const g of groupOf(world)) {
    if (g.id === 'you' || !isUp(world, g) || !inBox(g.body, box)) continue;
    giveBuff(world, g, id, name, params.buff, params.duration);
    world.fx.push({ kind: 'buffcast', skill: id, name, x: g.body.x, y: g.body.y, t: 0, dur: 1.1 });
  }
}

const inBox = (b, box) => b.x >= box.x && b.x <= box.x + box.w && b.y - b.h <= box.y + box.h && b.y >= box.y;

// The fallen party member a Revive in `box` would reach.
export function reviveTarget(world, box) {
  if (!world.dungeon) return null;
  return groupOf(world).find((g) => g.id !== 'you' && !isUp(world, g) && inBox(g.body, box)) ?? null;
}

export function reviveMember(world, g, pct) {
  revive(world, g, pct);
}

// Party members' buffs: Renew heals every second; they run out.
function tickBuffs(world, group, dt) {
  for (const g of group) {
    const buffs = g.bot?.buffs;
    if (!buffs) continue;
    for (const [id, b] of Object.entries(buffs)) {
      if (b.until <= world.now || g.bot.down) {
        delete buffs[id];
        continue;
      }
      if (!b.values.regenPct) continue;
      b.tick = (b.tick ?? 1) - dt;
      if (b.tick > 0) continue;
      b.tick = 1;
      const max = maxHpOf(world, g);
      if (g.bot.hp < max) {
        const add = Math.min(max - g.bot.hp, Math.round(max * b.values.regenPct));
        g.bot.hp += add;
        world.numbers.push({ x: g.body.x, y: g.body.y - g.body.h - 10, text: `+${add}`, color: '#9be08f', t: 0, small: true });
      }
    }
  }
}

function revive(world, g, pct) {
  if (g.remote) {
    world.net.runTo(world, g.id, { op: 'revive', pct });
    return;
  }
  if (g.bot) {
    g.bot.down = false;
    g.bot.hp = Math.round(g.bot.stats.maxHp * pct);
    groupSay(world, g.bot, 'dgUp');
  } else {
    world.dead = false;
    world.char.hp = Math.max(1, Math.round(world.stats.maxHp * pct));
    world.invuln = 2;
  }
  world.fx.push({ kind: 'levelup', x: g.body.x, y: g.body.y, t: 0, dur: 1.2 });
  world.log(`${g.bot ? g.name : 'You'} ${g.bot ? 'is' : 'are'} back on ${g.bot ? 'their' : 'your'} feet!`, '#bff0dc');
}

// ---------- Monsters ----------

function pickTarget(world, m, up) {
  if (!up.length) return null;
  if (m.taunt && m.taunt.until > world.now) {
    const t = up.find((g) => g.id === m.taunt.id);
    if (t) return t;
  }
  let best = null;
  let top = 0;
  for (const g of up) {
    const v = m.threat[g.id] ?? 0;
    if (v > top) {
      top = v;
      best = g;
    }
  }
  return best ?? up.reduce((a, b) => (Math.abs(a.body.x - m.x) <= Math.abs(b.body.x - m.x) ? a : b));
}

const reachOf = (m) => (m.def.fight.range ?? m.def.fight.reach) + m.def.w / 2;

// A monster chasing someone on a floor below hops off its ledge after them: a short eased arc
// down onto whatever is under the edge, and from then on it walks that floor. (Rooms are tall now,
// so a pack woken on a ledge mustn't stand stuck at the edge while the group fights below.)
function startHop(world, m, dir) {
  const nav = navOf(world.map);
  const nx = (dir > 0 ? m.x2 : m.x1) + dir * (m.def.w / 2 + 10);
  if (nx < 20 || nx > world.map.width - 20) return false;
  const k = surfaceBelow(nav, nx, m.y + 4);
  const surf = nav.surfaces[k];
  if (!surf || surf.yAt(nx) <= m.y + 8) return false;
  m.hop = { x0: m.x, y0: m.y, x1: nx, y1: surf.yAt(nx), t: 0, dur: 0.35 + Math.min(0.35, (surf.yAt(nx) - m.y) / 900), surf };
  m.state = 'walk';
  return true;
}
function tickHop(m, dt) {
  const h = m.hop;
  if (!h) return false;
  h.t += dt;
  const u = Math.min(1, h.t / h.dur);
  m.x = h.x0 + (h.x1 - h.x0) * u;
  // Up a little first, then down: a hop, not a slide.
  m.y = h.y0 + (h.y1 - h.y0) * u * u - 18 * Math.sin(Math.PI * u) * (1 - u);
  if (u < 1) return true;
  const s = h.surf;
  m.hop = null;
  m.yAt = s.yAt;
  m.y = s.yAt(m.x);
  m.baseY = m.y;
  m.fx1 = s.x1 + m.def.w / 2;
  m.fx2 = s.x2 - m.def.w / 2;
  m.x1 = m.fx1;
  m.x2 = m.fx2;
  m.home = m.x;
  return true;
}

// One engaged monster's turn: step toward its target, wind up, swing.
function fight(world, m, up, dt) {
  const now = world.now;
  m.flash = Math.max(0, m.flash - dt);
  m.age += dt;
  m.lunge = Math.max(0, (m.lunge ?? 0) - dt);
  if (tickYank(m, dt) || tickAir(m, dt) || tickHop(m, dt)) return;
  if (m.frozenUntil > now) {
    m.stagger = 0;
    return;
  }
  m.phase += dt;
  m.aggroUntil = now + 1;
  if (m.stagger > 0 && !m.def.boss) {
    m.stagger -= dt;
    m.x = Math.max(m.x1, Math.min(m.x2, m.x + m.knockVx * dt));
    m.knockVx *= 0.85;
    return;
  }
  if (m.def.mech && bossMove(world, m, up, dt)) return;
  const f = m.def.fight;
  const target = pickTarget(world, m, up);
  m.target = target?.id ?? null;
  if (!target || f.mender) {
    m.state = 'idle';
    return;
  }
  const dx = target.body.x - m.x;
  const reach = reachOf(m);
  if (!m.windup) {
    if (Math.abs(dx) > 4) m.dir = Math.sign(dx);
    const stop = f.range ? f.range * 0.8 : reach * 0.7;
    if (Math.abs(dx) > stop) {
      m.state = 'walk';
      m.x += m.dir * m.def.speed * 1.3 * dt;
    } else m.state = 'idle';
    m.x = Math.max(m.x1, Math.min(m.x2, m.x));
    // Stopped at the edge with its target on a floor below: hop down after them.
    const atEdge = (m.dir < 0 && m.x <= m.x1 + 0.5) || (m.dir > 0 && m.x >= m.x2 - 0.5);
    if (atEdge && !m.def.boss && !m.def.fly && target.body.y > m.y + 30 && Math.abs(dx) > reach * 0.7 && startHop(world, m, m.dir)) return;
  }
  m.atkT -= dt;
  if (m.windup > 0) {
    m.windup -= dt;
    if (m.windup <= 0) {
      m.windup = 0;
      m.lunge = 0.18;
      swing(world, m, up);
    }
  } else if (m.atkT <= 0 && Math.abs(dx) <= reach + 6 && Math.abs(target.body.y - m.y) < (f.range ? 140 : 50)) {
    m.windup = f.windup;
    m.atkT = f.every;
    m.swingAt = target.id;
    m.swingMul = 1;
  }
}

// The swing lands on whoever it was aimed at, if they're still in reach (stepping back dodges a
// melee swing; spit flies to its target).
function swing(world, m, up) {
  const g = up.find((o) => o.id === m.swingAt);
  m.attackAt = world.now;
  if (!g) return;
  const f = m.def.fight;
  const mul = m.swingMul ?? 1;
  m.swingMul = 1;
  if (f.range && Math.abs(g.body.x - m.x) > reachOf(m) - f.range + f.reach + 10) {
    const travel = Math.abs(g.body.x - m.x) / 360;
    world.dungeon.shots.push({ at: world.now + travel, id: g.id, raw: m.def.atk * mul, acc: m.def.acc, fromX: m.x });
    world.dungeon.vfx.push({ kind: 'spit', x: m.x + m.dir * m.def.w * 0.3, y: m.y - m.def.h * 0.6, tx: g.body.x, ty: g.body.y - g.body.h / 2, t: 0, dur: travel });
    return;
  }
  if (Math.abs(g.body.x - m.x) > reachOf(m) + 16 || Math.abs(g.body.y - m.y) > 60) {
    world.numbers.push({ x: g.body.x, y: g.body.y - g.body.h - 6, text: 'MISS', color: '#d4cbe8', t: 0, small: true });
    return;
  }
  land(world, g, m.def.atk * mul, m.def.acc, m.x, mul > 1);
}

function land(world, g, raw, acc, fromX, heavy = false) {
  const stats = g.bot ? g.bot.stats : world.stats;
  if (!heavy && Math.random() >= mobHitChance(acc, avoid(stats))) {
    world.numbers.push({ x: g.body.x, y: g.body.y - g.body.h - 6, text: 'MISS', color: '#d4cbe8', t: 0, small: true });
    return;
  }
  hurtMember(world, g, raw, fromX, { knock: heavy });
  if (heavy) world.juice.push({ type: 'shake', mag: 3, dur: 0.25 });
}

// ---------- Boss moves ----------

export function addZone(world, z) {
  world.dungeon.zones.push({ t: 0, hit: false, after: 0, y: world.map.groundY, ...z });
  if (leading(world)) world.net.runAll(world, { op: 'zone', z: { ...z, from: z.from ? z.from.net ?? null : null } });
}

export function adds(world, boss, mob, xs, threatOn) {
  const room = world.dungeon.room;
  for (const x of xs) {
    const m = spawnMob(world.map, { mob, x: Math.max(40, Math.min(world.map.width - 40, x)), y: world.map.groundY });
    m.home = m.x;
    m.fx1 = m.x1;
    m.fx2 = m.x2;
    m.engaged = true;
    m.threat = threatOn ? { [threatOn]: 30 } : {};
    m.atkT = between(0.6, 1.2);
    m.add = true;
    toughen(world, m);
    world.mobs.push(m);
    room.adds.push(m);
  }
}

// Returns true while the boss is busy with a move of its own (it skips its normal turn).
function bossMove(world, m, up, dt) {
  const run = world.dungeon;
  const map = world.map;
  const frac = m.hp / m.def.hp;
  const nonTanks = up.filter((g) => g.role !== 'tank');
  if (m.def.mech === 'capper') {
    const s = (m.mech ??= { rain: 7, adds: [0.85, 0.5] });
    capperPhases(world, m, dt);
    s.rain -= dt;
    if (s.rain <= 0 && up.length) {
      s.rain = 10;
      const victims = [...(nonTanks.length ? nonTanks : up)].sort(() => Math.random() - 0.5).slice(0, 3);
      for (const g of victims) {
        const surf = navOf(map).surfaces[Math.max(0, surfaceBelow(navOf(map), g.body.x, g.body.y))];
        addZone(world, { kind: 'circle', x: g.body.x, y: surf.y, w: 66, warn: 1.7, damage: 135, from: m });
      }
      callout(world, 'Spore Rain!', 'Step out of the pink patches');
    }
    if (s.adds.length && frac <= s.adds[0]) {
      s.adds.shift();
      const healer = up.find((g) => g.role === 'healer') ?? pick(nonTanks.length ? nonTanks : up);
      adds(world, m, 'sporeling', [m.x - 90, m.x + 90, m.x - 150], healer?.id);
      callout(world, 'Spore Mites!', 'They swarm the healer: Tank, War Cry! DPS, kill them!');
    }
    return false;
  }
  if (m.def.mech === 'boar') {
    const s = (m.mech ??= { charge: 8, gore: 5 });
    boarPhases(world, m);
    if (m.charging) {
      const c = m.charging;
      m.state = 'walk';
      m.dir = c.dir;
      // A stone pillar in the way stops him cold: dazed, and the pillar comes down.
      const next = m.x + c.dir * 520 * dt;
      const pillar = pillarHit(world, m, next);
      if (pillar) {
        m.x = pillar.x - c.dir * (m.def.w / 2 + 12);
        m.charging = null;
        m.frozenUntil = world.now + 4;
        m.hold = 'stun';
        m.vulnUntil = world.now + 4;
        world.juice.push({ type: 'shake', mag: 8, dur: 0.6 });
        run.vfx.push({ kind: 'crash', x: pillar.x, y: m.y, t: 0, dur: 0.6 });
        callout(world, 'Tuskar smashed into a pillar!', "He's seeing stars: hit him hard!");
        radio(world, 'pillar');
        return true;
      }
      m.x = next;
      for (const g of up) {
        if (c.hit.has(g.id) || Math.abs(g.body.x - m.x) > m.def.w / 2 + 8 || Math.abs(g.body.y - m.y) > 50) continue;
        c.hit.add(g.id);
        hurtMember(world, g, 190, m.x - c.dir * 40, { knock: true });
      }
      const wall = c.dir > 0 ? m.fx2 : m.fx1;
      if ((c.dir > 0 && m.x >= wall) || (c.dir < 0 && m.x <= wall)) {
        m.x = wall;
        m.charging = null;
        // Stampeding, he turns and charges straight back the other way once.
        if (s.stampede && !c.back) {
          m.charging = { dir: -c.dir, hit: new Set(), back: true };
          world.juice.push({ type: 'shake', mag: 5, dur: 0.4 });
          return true;
        }
        m.frozenUntil = world.now + 3;
        m.hold = 'stun';
        m.vulnUntil = world.now + 3;
        world.juice.push({ type: 'shake', mag: 6, dur: 0.5 });
        run.vfx.push({ kind: 'crash', x: m.x + c.dir * m.def.w / 2, y: m.y, t: 0, dur: 0.6 });
        callout(world, 'Tuskar hit the wall!', "He's dazed: hit him hard!");
      }
      return true;
    }
    if (m.aim) return true;
    s.charge -= dt;
    s.gore -= dt;
    if (s.charge <= 0 && !m.windup && up.length) {
      s.charge = 13;
      const victim = pick(nonTanks.length ? nonTanks : up);
      const dir = Math.sign(victim.body.x - m.x) || 1;
      const x = dir > 0 ? m.x : m.fx1 - m.def.w / 2;
      const w = dir > 0 ? m.fx2 + m.def.w / 2 - m.x : m.x - x;
      m.aim = { dir };
      m.dir = dir;
      m.state = 'idle';
      addZone(world, { kind: 'lane', x, w, warn: 1.6, from: m, dir });
      callout(world, `Tuskar lowers his tusks at ${victim.bot ? victim.name : 'you'}!`, 'Get out of the lane!');
      return true;
    }
    if (s.gore <= 0 && !m.windup && m.target) {
      const g = up.find((o) => o.id === m.target);
      if (g && Math.abs(g.body.x - m.x) <= reachOf(m) + 6) {
        s.gore = 7;
        m.windup = 0.9;
        m.atkT = m.def.fight.every;
        m.swingAt = g.id;
        m.swingMul = 2.3;
        m.big = world.now + 0.9;
      }
    }
    return false;
  }
  if (m.def.mech === 'gnarl') {
    const s = (m.mech ??= { slam: 11, thorns: 6, flip: 0, saplings: false, enraged: false });
    gnarlPhases(world, m);
    const k = s.enraged ? 0.7 : 1;
    const pending = run.zones.some((z) => !z.hit);
    s.slam -= dt;
    s.thorns -= dt;
    if (s.slam <= 0) {
      if (pending) s.slam = 1;
      else {
        s.slam = 15 * k;
        addZone(world, { kind: 'floor', x: 0, w: map.width, warn: 2.2, damage: 240, from: m });
        callout(world, 'Root Slam!', 'Jump, or get up on a ledge!');
        m.slamming = world.now + 2.2;
      }
    }
    if (s.thorns <= 0) {
      if (pending) s.thorns = 1.5;
      else {
        s.thorns = 9 * k;
        const n = 8;
        const w = map.width / n;
        for (let i = s.flip; i < n; i += 2) addZone(world, { kind: 'thorns', x: i * w, w, warn: 1.8, damage: 170, from: m });
        s.flip ^= 1;
        callout(world, 'Thorns!', 'Stand where the floor is safe');
      }
    }
    if (!s.saplings && frac <= 0.75) {
      s.saplings = true;
      adds(world, m, 'sapling', [m.x - 400, m.x + 400], null);
      callout(world, 'Corrupted Saplings!', 'They feed him their life: cut them down!');
    }
    const feeding = run.room.adds.filter((a) => a.def.fight?.mender && a.hp > 0).length;
    m.shield = feeding > 0;
    if (feeding) m.hp = Math.min(m.def.hp, m.hp + m.def.hp * 0.006 * feeding * dt);
    if (!s.enraged && frac <= 0.2) {
      s.enraged = true;
      callout(world, 'Gnarlroot is furious!', 'Everything comes faster now');
    }
    return m.slamming > world.now;
  }
  return false;
}

// A zone going off: whoever is standing in it gets hit.
function inZone(world, z, body) {
  if (z.kind === 'circle') return Math.abs(body.x - z.x) < z.w / 2 + 6 && Math.abs(body.y - z.y) < 16;
  if (z.kind === 'floor') return body.onGround && Math.abs(body.y - world.map.groundY) < 2;
  return body.x >= z.x - 6 && body.x <= z.x + z.w + 6 && Math.abs(body.y - world.map.groundY) < 34;
}

function tickZones(world, up, dt) {
  const run = world.dungeon;
  for (const z of run.zones) {
    z.t += dt;
    if (z.hit) {
      z.after += dt;
      continue;
    }
    if (z.t < z.warn) continue;
    z.hit = true;
    if (z.from?.hp <= 0) continue;
    if (z.kind === 'lane') {
      z.from.aim = null;
      z.from.charging = { dir: z.dir, hit: new Set() };
      continue;
    }
    run.vfx.push({ kind: 'zonehit', zone: z.kind, root: z.root, x: z.x, y: z.y, w: z.w, t: 0, dur: 0.5 });
    if (z.kind === 'circle') sporeSprout(world, z);
    if (z.kind === 'floor') world.juice.push({ type: 'shake', mag: 7, dur: 0.6 });
    // (Friends online step out of these in their own games.)
    for (const g of up) if (!g.remote && inZone(world, z, g.body)) hurtMember(world, g, z.damage, z.from?.x ?? z.x, { knock: z.kind !== 'circle' });
  }
  run.zones = run.zones.filter((z) => !z.hit || z.after < 0.5);
  for (const s of run.shots) {
    if (s.at > world.now) continue;
    const g = up.find((o) => o.id === s.id);
    if (g) land(world, g, s.raw, s.acc, s.fromX);
  }
  run.shots = run.shots.filter((s) => s.at > world.now);
}

// Is (body) standing somewhere about to go off? Party members use it to dodge.
export function dangerFor(world, body) {
  return world.dungeon?.zones.find((z) => !z.hit && z.kind !== 'floor' && !shared(z) && inZone(world, z, body)) ?? null;
}

// The closest safe x on the floor from (body), out of every zone about to go off.
export function safeX(world, body) {
  const zones = world.dungeon.zones.filter((z) => !z.hit && z.kind !== 'floor' && !shared(z));
  const bad = (x) => zones.some((z) => inZone(world, z, { x, y: body.y, onGround: true }));
  for (let d = 0; d < world.map.width; d += 12) {
    for (const x of [body.x - d, body.x + d]) if (x > 24 && x < world.map.width - 24 && !bad(x)) return x;
  }
  return body.x;
}

// Party members jump the Root Slam at the last moment.
export function jumpNow(world, body) {
  return Boolean(world.dungeon?.zones.some((z) => !z.hit && z.kind === 'floor' && z.warn - z.t < 0.32) && body.onGround && Math.abs(body.y - world.map.groundY) < 2);
}

// ---------- The whole run, every tick ----------

export function tickDungeon(world, dt) {
  const run = world.dungeon;
  // Following a friend's run: their game runs the room; yours keeps your own side of it.
  if (following(world)) return followRoom(world, dt);
  const group = groupOf(world);
  const up = group.filter((g) => isUp(world, g));
  // Packs notice anyone who gets close.
  for (const m of world.mobs) {
    if (m.hp <= 0 || m.engaged || m.add) continue;
    const range = m.def.boss ? BOSS_AGGRO : AGGRO;
    const near = up.find((g) => Math.abs(g.body.x - m.x) < range && Math.abs(g.body.y - m.y) < 60);
    if (near) engage(world, m, near.id);
  }
  for (const m of world.mobs) {
    if (m.hp <= 0) {
      m.dying += dt;
      continue;
    }
    if (m.engaged) fight(world, m, up, dt);
    else idle(m, dt, world.now);
  }
  run.combat = world.mobs.some((m) => m.hp > 0 && m.engaged && !m.def.fight?.mender);
  tickZones(world, up, dt);
  tickRoom(world, dt, group, up);
  tickChannels(world, dt, group);
  tickBuffs(world, group, dt);
  for (const v of run.vfx) v.t += dt;
  run.vfx = run.vfx.filter((v) => v.t < v.dur);
  for (const g of group) if (g.bot?.hurt) g.bot.hurt = Math.max(0, g.bot.hurt - dt);
  if (run.callout) {
    run.callout.t -= dt;
    if (run.callout.t <= 0) run.callout = null;
  }
  // Everyone down: the room resets and the group starts it over.
  if (!up.length) {
    run.wipeIn = run.wipeIn || WIPE_DELAY;
    run.wipeIn -= dt;
    if (run.wipeIn <= 0) wipe(world, group);
    return;
  }
  // After a fight: party members patch up, and the fallen get back up.
  if (!run.combat) {
    for (const g of up) if (g.bot) g.bot.hp = Math.min(g.bot.stats.maxHp, g.bot.hp + g.bot.stats.maxHp * 0.04 * dt);
    const fallen = group.filter((g) => !isUp(world, g));
    if (fallen.length) {
      run.standIn = (run.standIn || STAND_UP) - dt;
      if (run.standIn <= 0) {
        for (const g of fallen) revive(world, g, 0.4);
        run.standIn = 0;
      }
    } else run.standIn = 0;
    // Stragglers catch up.
    for (const g of up) {
      if (!g.bot || Math.abs(g.body.x - world.body.x) < 700) continue;
      Object.assign(g.body, { x: world.body.x - 30, y: world.body.y, vx: 0, vy: 0, rope: null, onGround: world.body.onGround, surface: world.body.surface });
      g.bot.appear = 1;
      g.bot.brain.path = null;
    }
  }
  checkClear(world);
}

// A friend's run, in your game: the monsters are theirs (shown where they say), but the moves
// heading for you, your room tasks, your buffs and the root radio are yours.
function followRoom(world, dt) {
  const run = world.dungeon;
  const me = groupOf(world).filter((g) => g.id === 'you' && isUp(world, g));
  for (const m of world.mobs) world.net.step(m, dt);
  tickZones(world, me, dt);
  tickRoom(world, dt, groupOf(world).filter((g) => g.id === 'you'), me);
  tickChannels(world, dt, []);
  tickBuffs(world, [], dt);
  for (const v of run.vfx) v.t += dt;
  run.vfx = run.vfx.filter((v) => v.t < v.dur);
  if (run.callout) {
    run.callout.t -= dt;
    if (run.callout.t <= 0) run.callout = null;
  }
}

// ---------- A shared run's messages, in the game they reach (net/dungeonrun.js) ----------

// A monster in the leader's game hit you.
export function followerHurt(world, msg) {
  const me = groupOf(world).find((g) => g.id === 'you');
  hurtMember(world, me, msg.raw, msg.fromX, { knock: msg.knock, pierce: msg.pierce });
}

// A friend's heal reaching you.
export function runHeal(world, msg) {
  const me = groupOf(world).find((g) => g.id === 'you');
  healMember(world, me, msg.amount, 'you');
}

export function followerRevive(world, pct) {
  if (world.dead) revive(world, groupOf(world).find((g) => g.id === 'you'), pct);
}

// The leader's group wiped: back to the room's entrance, up and full.
export function followerWiped(world) {
  const entry = world.map.portals.find((p) => p.id === 'start') ?? world.map.portals.find((p) => p.id === 'west') ?? world.map.portals[0];
  Object.assign(world.body, { x: entry.x + 50, y: entry.y ?? world.map.groundY, vx: 0, vy: 0, rope: null, onGround: true });
  world.dead = false;
  world.char.hp = world.stats.maxHp;
  world.char.mp = world.stats.maxMp;
  world.invuln = 2;
  world.channel = null;
  world.dungeon.zones = [];
  callout(world, 'Your group wiped!', 'Regroup and try again');
}

// In the leader's game: a friend's taunt, hook, group heal or buff, or room task.
export function leaderAct(world, msg, id) {
  const me = groupOf(world).find((g) => g.id === id);
  if (!me) return;
  if (msg.op === 'provoke') provoke(world, id, me.body, msg.range, msg.hold);
  else if (msg.op === 'hook') hookMobs(world, id, me.body, world.mobs.filter((m) => msg.mobs.includes(m.net)), msg.dir);
  else if (msg.op === 'groupheal') {
    for (const g of groupOf(world)) if (g.id !== id && isUp(world, g) && inBox(g.body, msg.box)) healMember(world, g, maxHpOf(world, g) * msg.pct, id);
  } else if (msg.op === 'groupbuff') {
    for (const g of groupOf(world)) if (g.id !== id && isUp(world, g) && inBox(g.body, msg.box)) giveBuff(world, g, msg.id, msg.name, msg.params.buff, msg.params.duration);
  } else if (msg.op === 'obj') {
    const o = world.dungeon.room.objects.find((x) => x.id === msg.i);
    if (o && !o.done) finish(world, o, me.name);
  }
}

// A friend formed a group with you in it: in you go, following their run.
export function joinRun(world, msg) {
  const def = DUNGEONS[msg.dungeon];
  for (const bot of partyMembers(world.bots)) dismiss(world.bots, bot, world, { quiet: true });
  world.dungeon = { id: def.id, roles: msg.roles, rooms: {}, start: world.now, wipes: 0, downs: 0, cheer: 0, hard: msg.hard, zones: [], shots: [], vfx: [], callout: null, done: false, shared: { leader: msg.leader } };
  loadMap(world, def.rooms[0], 'start');
}

// Waiting about: a little patrol near home.
function idle(m, dt, now) {
  m.flash = Math.max(0, m.flash - dt);
  m.age += dt;
  if (tickYank(m, dt) || tickAir(m, dt)) return;
  m.phase += dt;
  if (m.def.speed <= 0) return;
  m.timer -= dt;
  if (m.timer <= 0) {
    m.state = m.state === 'walk' ? 'idle' : 'walk';
    m.timer = m.state === 'walk' ? between(1, 2.5) : between(1.5, 3);
    if (m.state === 'walk' && Math.random() < 0.5) m.dir *= -1;
  }
  if (m.state === 'walk') m.x += m.dir * m.def.speed * 0.6 * dt;
  if (m.x <= m.x1) {
    m.x = m.x1;
    m.dir = 1;
  }
  if (m.x >= m.x2) {
    m.x = m.x2;
    m.dir = -1;
  }
}

function wipe(world, group) {
  const run = world.dungeon;
  run.wipes++;
  run.wipeIn = 0;
  run.zones = [];
  run.shots = [];
  const room = run.room;
  for (const m of room.adds) m.hp = 0;
  world.mobs = world.mobs.filter((m) => !m.add && m.hp > 0);
  room.adds = [];
  for (const m of world.mobs) reset(m);
  const entry = world.map.portals.find((p) => p.id === 'start') ?? world.map.portals.find((p) => p.id === 'west') ?? world.map.portals[0];
  group.forEach((g, i) => {
    Object.assign(g.body, { x: entry.x + 30 + i * 22, y: entry.y ?? world.map.groundY, vx: 0, vy: 0, rope: null, onGround: true });
    if (g.bot) {
      g.bot.down = false;
      g.bot.hp = g.bot.stats.maxHp;
      g.bot.appear = 1;
      g.bot.brain.path = null;
      g.bot.brain.target = null;
    }
  });
  world.dead = false;
  world.char.hp = world.stats.maxHp;
  world.char.mp = world.stats.maxMp;
  world.invuln = 2;
  world.channel = null;
  callout(world, 'Your group wiped!', 'Regroup and try again');
  radio(world, 'wipe');
  if (leading(world)) world.net.runAll(world, { op: 'wipe' });
  world.log('Your group wiped. Everyone regroups at the start of the room.', '#ffb3c6');
}

// A monster down: thornbacks in the Root Gate drop their keys.
export function onMobKilled(world, m) {
  const run = world.dungeon;
  if (!run) return;
  if (m.spawn?.key) run.room.keys.push({ x: m.x, y: m.y, t: 0, got: false });
  if (m.def.mech === 'gnarl') {
    run.room.walls = null;
    hollowCalmed(world);
  }
  if (m.def.boss) {
    run.zones = [];
    for (const a of run.room.adds) if (a.hp > 0) {
      a.hp = 0;
      a.dying = 0;
    }
  }
}

// Leaving from the faint screen: back to the gate, no EXP lost.
export function leaveDungeon(world) {
  const gate = DUNGEONS[world.dungeon?.id ?? 'hollow'].gate;
  world.dead = false;
  world.char.hp = Math.max(1, Math.round(world.stats.maxHp * 0.5));
  world.invuln = 2;
  loadMap(world, gate, 'start');
}

// A big line across the middle of the screen for boss moves and milestones.
export function callout(world, title, sub = '') {
  if (world.dungeon) world.dungeon.callout = { title, sub, t: 2.6 };
}

// ---------- Party members' minds in a dungeon ----------

function goalAt(world, x, y, mode) {
  const nav = navOf(world.map);
  const s = surfaceBelow(nav, x, y - 4);
  const surf = nav.surfaces[s];
  return { x: Math.max(surf.x1 + 8, Math.min(surf.x2 - 8, x)), y: surf.y, mode, surface: s };
}

// What a party member does next, by role. Sets brain.goal (where to be), brain.target (what to
// hit), and brain.task (a glowcap or cage to work on). The room can change where they stand: up on
// a ledge when the sap is coming, and (for those who fight) up near Gnarlroot's open heart.
export function roleThink(bot, world, rng) {
  thinkRole(bot, world, rng);
  const br = bot.brain;
  if (bot.down || !br.goal) return;
  const role = world.dungeon.roles[bot.id] ?? 'dps';
  // Where they stand in the fight, as a group: world/botfight.js.
  if (!dangerFor(world, bot.body)) placeInGroup(bot, world, role, navOf(world.map));
  const heart = world.mobs.find((m) => m.heartOpen && m.hp > 0);
  if (floodComing(world)) br.goal = ledgeGoal(world, br.goal.x, 'fight');
  else if (heart && role !== 'healer') br.goal = ledgeGoal(world, heart.x + (Math.sign(bot.body.x - heart.x) || 1) * 60, 'fight');
}

// A spot near x on the same surface as the monster m (so a pack on a short ledge is approached on
// that ledge, not from the floor below where it can't be reached).
function goalOn(world, m, x, mode) {
  const nav = navOf(world.map);
  const s = surfaceBelow(nav, m.x, m.y - 4);
  const surf = nav.surfaces[s];
  return { x: Math.max(surf.x1 + 8, Math.min(surf.x2 - 8, x)), y: surf.y, mode, surface: s };
}

// The nearest ledge (not the floor) to x, as a goal.
function ledgeGoal(world, x, mode) {
  const nav = navOf(world.map);
  let best = null;
  nav.surfaces.forEach((s, i) => {
    if (s.ground) return;
    const cx = Math.max(s.x1 + 8, Math.min(s.x2 - 8, x));
    const d = Math.abs(cx - x) + (world.map.groundY - s.y) * 0.2;
    if (!best || d < best.d) best = { d, goal: { x: cx, y: s.y, mode, surface: i } };
  });
  return best?.goal ?? goalAt(world, x, world.map.groundY, mode);
}

function thinkRole(bot, world, rng) {
  const run = world.dungeon;
  const br = bot.brain;
  const body = bot.body;
  br.task = null;
  if (bot.down) {
    br.goal = null;
    br.target = null;
    return;
  }
  const role = run.roles[bot.id] ?? 'dps';
  const group = groupOf(world);
  const up = group.filter((g) => isUp(world, g));
  const me = group.find((g) => g.bot === bot);
  const fights = world.mobs.filter((m) => m.hp > 0 && m.engaged);
  const tank = up.find((g) => g.role === 'tank');
  const lead = tank ?? up.find((g) => !g.bot) ?? me;
  const st = bot.ai.weapon;
  // Out of anything about to go off, first.
  if (dangerFor(world, body)) {
    if (bot.attack?.pose === 'pray') bot.attack = null;
    br.goal = goalAt(world, safeX(world, body), body.y, 'fight');
    br.settled = false;
    return;
  }
  const spot = (m, side) => {
    const off = st.ranged ? st.reach * (role === 'healer' ? 0.85 : 0.7) : m.def.w / 2 + 16;
    let x = m.x + side * off;
    if (x < 30 || x > world.map.width - 30) x = m.x - side * off;
    return goalAt(world, x, m.y, 'fight');
  };
  const sideOf = (m) => Math.sign(body.x - m.x) || -1;
  if (fights.length) {
    const tankTarget = tank && (tank.bot ? tank.bot.brain.target : fights.find((m) => m.target === 'you' || m.threat?.you > 0));
    if (role === 'tank') {
      const loose = fights.filter((m) => m.target && m.target !== bot.id && !m.def.fight?.mender);
      // A Warrior holds monsters with War Cry, which goes off as their Valor fills in a fight.
      if (warCry(world, bot, loose)) {
        bot.attack = { pose: 'roar', t: 0, dur: 0.5 };
        if (rng() < 0.25) groupSay(world, bot, 'dgTaunt');
      }
      const boss = fights.find((m) => m.def.boss);
      const target = boss ?? loose.sort((a, b) => Math.abs(a.x - body.x) - Math.abs(b.x - body.x))[0] ?? nearest(fights.filter((m) => !m.def.fight?.mender), body);
      br.target = target ?? null;
      if (target) br.goal = spot(target, sideOf(target));
      return;
    }
    // Damage: saplings and adds first, then whatever the tank is fighting.
    const menders = fights.filter((m) => m.def.fight?.mender);
    const addsUp = fights.filter((m) => m.add && !m.def.fight?.mender);
    // (Your target, or your ping, comes right after the saplings.)
    const focus = focusOf(world);
    const yours = focus && fights.includes(focus) ? focus : null;
    const target = role === 'dps' ? nearest(menders, body) ?? yours ?? nearest(addsUp, body) ?? (tankTarget?.hp > 0 ? tankTarget : null) ?? nearest(fights, body) : tankTarget?.hp > 0 ? tankTarget : nearest(fights, body);
    br.target = target ?? null;
    if (!target) return;
    if (role === 'healer') {
      // Healers hang back behind the monster, out of its way, at the back of the group.
      const side = tank && tank.bot !== bot ? behindSide(tank.body, target, -1) : Math.sign(body.x - target.x) || -1;
      br.goal = goalAt(world, Math.max(30, Math.min(world.map.width - 30, target.x + side * 140)), target.y, 'fight');
      const low = up.some((g) => hpOf(world, g) / maxHpOf(world, g) < 0.85);
      if (low) br.target = null;
      return;
    }
    // Damage dealers flank it: behind the monster, the far side from the tank it's facing.
    br.goal = spot(target, tank && tank.bot !== bot ? behindSide(tank.body, target, sideOf(target)) : sideOf(target));
    return;
  }
  br.target = null;
  // Between fights. Healers pick up the fallen.
  const fallen = group.find((g) => !isUp(world, g));
  if (role === 'healer' && fallen) {
    br.goal = goalAt(world, fallen.body.x - 20, fallen.body.y, 'follow');
    return;
  }
  const room = run.room;
  const asleep = world.mobs.filter((m) => m.hp > 0 && !m.engaged);
  const safe = (x) => !asleep.some((m) => Math.abs(m.x - x) < (m.def.boss ? BOSS_AGGRO : AGGRO) + 50);
  if (role === 'tank' && run.roles.you !== 'tank') {
    // The tank leads: wait for the group to be ready, then pull the next pack.
    const next = nearest(asleep, body);
    if (next) {
      const ready = up.length === group.length && up.every((g) => hpOf(world, g) / maxHpOf(world, g) > 0.7) && Math.abs(world.body.x - body.x) < 420;
      // Ready: walk in and open on the pack with their own blows (that wakes it, and it comes
      // for them); not ready: wait a little way short of it.
      if (ready) {
        br.target = next;
        br.goal = goalOn(world, next, next.x - Math.sign(next.x - body.x || 1) * Math.max(20, bot.ai.weapon.reach * 0.6), 'fight');
        if (!br.pulling) {
          br.pulling = true;
          if (rng() < 0.5) groupSay(world, bot, 'dgPull');
        }
        return;
      }
      br.pulling = false;
      br.goal = goalOn(world, next, next.x - Math.sign(next.x - body.x || 1) * 190, 'follow');
      return;
    }
  }
  if (role !== 'tank') {
    // Damage dealers help with the room's task when it's safe, and grab keys.
    const key = room.keys.find((k) => !k.got && safe(k.x));
    if (key) {
      br.goal = goalAt(world, key.x, key.y, 'follow');
      return;
    }
    const busy = new Set(group.filter((g) => g.bot && g.bot !== bot).map((g) => g.bot.brain?.task));
    const todo = room.objects.filter((o) => !o.done && o.kind !== 'chest' && o.kind !== 'cache' && !busy.has(o) && safe(o.x) && world.channel?.obj !== o);
    const o = role === 'dps' ? nearest(todo, body) : null;
    if (o) {
      br.task = o;
      br.goal = goalAt(world, o.x, o.y, 'fight');
      return;
    }
  }
  // Otherwise stay with the group, a step behind the leader.
  const follow = lead === me ? group.find((g) => !g.bot) : lead;
  const k = 1 + (bot.slot ?? 0);
  br.goal = goalAt(world, Math.max(30, follow.body.x - 34 * k), follow.body.y, 'follow');
}

// A helper Warrior's War Cry, the same passive the player's Warrior has: Valor builds over the
// fight (faster with monsters loose on the others), and once it's full the cry goes off as soon as
// something needs grabbing: the monsters around turn on them for its taunt time and the group near
// them is guarded, by the skill's own numbers at their level. Returns whether it went off.
function warCry(world, bot, loose) {
  const br = bot.brain;
  const dt = Math.min(1, world.now - (br.valorAt ?? world.now));
  br.valorAt = world.now;
  br.valor = Math.min(100, (br.valor ?? 0) + dt * (12 + 8 * loose.length));
  if (br.valor < 100 || !loose.length) return false;
  const lv = Math.max(1, Math.min(SKILLS.warcry.maxLevel, Math.round(SKILLS.warcry.maxLevel * Math.min(1, (bot.char.level - 8) / 40))));
  const p = SKILLS.warcry.at(lv, SKILLS.warcry.maxLevel).proc;
  br.valor = 0;
  provoke(world, bot.id, bot.body, p.range.w / 2, p.taunt, pathSchool(bot.char));
  for (const g of groupOf(world)) {
    if (isUp(world, g) && Math.abs(g.body.x - bot.body.x) < p.range.w / 2 && Math.abs(g.body.y - bot.body.y) < p.range.h) giveBuff(world, g, 'warcry', 'War Cry', p.buff, p.duration);
  }
  return true;
}

function nearest(list, body) {
  let best = null;
  for (const m of list) if (!best || Math.abs(m.x - body.x) < Math.abs(best.x - body.x)) best = m;
  return best;
}

// The healer's hands: heals for whoever is hurt, a group heal when several are, and getting the
// fallen back up between fights. Returns how long until they check again.
export function healerTurn(bot, world, rng) {
  if (bot.down) return 0.5;
  const run = world.dungeon;
  const group = groupOf(world);
  const up = group.filter((g) => isUp(world, g));
  const me = group.find((g) => g.bot === bot);
  const hurt = up.map((g) => ({ g, f: hpOf(world, g) / maxHpOf(world, g) })).sort((a, b) => a.f - b.f);
  const low = hurt.filter((h) => h.f < (h.g.role === 'tank' ? 0.9 : 0.8));
  // A Star Witch heals with her own spells: Wishing Star and Star Veil. A Starlight Idol with her
  // songs: Healing Song for the group and its long regen, and Curtain Call for the fallen.
  const shrine = jobChain(bot.char.job).includes('spiritmage');
  const maiden = bot.char.job === 'shrinemaiden';
  // (The Star Witch wishes stars down; the Idol sings; the Astronomer's moons tide round them.)
  const witch = bot.char.job === 'spiritmage';
  const star = witch || maiden;
  const bless = (g) => shrine && world.fx.push({ kind: maiden ? 'sisong' : witch ? 'stwish' : 'astide', x: g.body.x, y: g.body.y, t: 0, dur: 1 });
  const cast = () => {
    bot.attack = shrine ? { pose: maiden ? 'sisong' : witch ? 'swwish' : 'astide', t: 0, dur: maiden ? 1.2 : witch ? 0.9 : 1 } : { pose: 'pray', t: 0, dur: 0.7 };
  };
  const barrier = { id: 'spiritward', name: SKILLS.spiritward.name, pose: star ? 'swveil' : 'astide', dur: star ? 0.8 : 1 };
  const renew = maiden ? { id: 'grandblessing', name: SKILLS.grandblessing.name, pose: 'sisong', dur: 1.2 } : { id: 'blessing', name: SKILLS.blessing.name, pose: witch ? 'swwish' : 'astide', dur: witch ? 0.9 : 1 };
  if (low.length >= 2 && low[1].f < 0.7) {
    for (const h of hurt) {
      if (h.f >= 0.95) continue;
      healMember(world, h.g, maxHpOf(world, h.g) * (maiden ? 0.24 : 0.16) + bot.stats.int * 0.5, bot.id);
      if (!maiden) bless(h.g);
    }
    run.vfx.push({ kind: 'groupheal', x: bot.body.x, y: bot.body.y, t: 0, dur: 0.8 });
    if (maiden) {
      world.fx.push({ kind: 'sisong', big: true, x: bot.body.x, y: bot.body.y, t: 0, dur: 1.4 });
      world.fx.push({ kind: 'siwave', x: bot.body.x, y: bot.body.y - 26, t: 0, dur: 0.6 });
    }
    cast();
    if (rng() < 0.2) groupSay(world, bot, 'dgHeal');
    return between(1.5, 1.9, rng);
  }
  if (low.length) {
    healMember(world, low[0].g, maxHpOf(world, low[0].g) * between(0.22, 0.3, rng) + bot.stats.int * 0.6, bot.id);
    if (low[0].g.id === 'you' && low[0].f < 0.5) callOut(world, bot, 'heal');
    else if (low[0].g.bot === bot && low[0].f < 0.5) callOut(world, bot, 'healSelf');
    bless(low[0].g);
    cast();
    return between(1.1, 1.5, rng);
  }
  // In a fight: keep a barrier on the tank, and a Renew on the group when it's taking damage.
  const tank = up.find((g) => g.role === 'tank');
  const buffsOf = (g) => (g.bot ? g.bot.buffs : world.char.buffs) ?? {};
  if (run.combat && tank && !(buffsOf(tank)[barrier.id]?.shield > 0)) {
    giveBuff(world, tank, barrier.id, barrier.name, { barrier: 0.22 }, 20);
    world.fx.push({ kind: 'buffcast', skill: barrier.id, name: barrier.name, school: shrine ? 'spirit' : undefined, x: tank.body.x, y: tank.body.y, t: 0, dur: 1.1 });
    bot.attack = { pose: barrier.pose, t: 0, dur: barrier.dur };
    return between(1.2, 1.6, rng);
  }
  if (run.combat && hurt.filter((h) => h.f < 0.92).length >= 2 && !up.some((g) => buffsOf(g)[renew.id])) {
    for (const g of up) {
      if (Math.abs(g.body.x - me.body.x) >= 320) continue;
      giveBuff(world, g, renew.id, renew.name, { regenPct: 0.025 }, 20);
      bless(g);
    }
    run.vfx.push({ kind: 'groupheal', x: bot.body.x, y: bot.body.y, t: 0, dur: 0.8 });
    if (maiden) world.fx.push({ kind: 'sisong', big: true, x: bot.body.x, y: bot.body.y, t: 0, dur: 1.4 });
    bot.attack = { pose: renew.pose, t: 0, dur: renew.dur };
    return between(1.2, 1.6, rng);
  }
  if (!run.combat) {
    // (A Starlight Idol raises them with Curtain Call, from further off.)
    const fallen = group.find((g) => !isUp(world, g) && Math.abs(g.body.x - me.body.x) < (maiden ? 320 : 44));
    if (fallen) {
      revive(world, fallen, maiden ? 0.6 : 0.5);
      if (maiden) {
        world.fx.push({ kind: 'sihit', big: true, x: fallen.body.x, y: fallen.body.y - 10, h: 0, t: 0, dur: 0.7 });
        world.fx.push({ kind: 'sisong', x: fallen.body.x, y: fallen.body.y, t: 0, dur: 1.1 });
      }
      bot.attack = maiden ? { pose: 'sibow', t: 0, dur: 1.4 } : { pose: 'pray', t: 0, dur: 1 };
      return maiden ? 1.5 : 1.2;
    }
  }
  return 0.4;
}
