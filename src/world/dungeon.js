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

import { DUNGEONS, GROUP, ROLES, roleOf, PROVOKE, TANK_THREAT } from '../data/dungeons.js';
import { JOBS } from '../data/jobs.js';
import { ITEMS, JOB_SLOTS, GEAR_FAMILIES, jobGearId } from '../data/items.js';
import { computeStats } from '../core/stats.js';
import { gainExp } from '../core/character.js';
import { addItem } from '../core/inventory.js';
import { makeEquip, itemName } from '../core/items.js';
import { avoid, mobHitChance, damageTaken } from '../core/formulas.js';
import { knockBack } from './physics.js';
import { spawnMob, yank, tickYank, tickAir } from './mobs.js';
import { navOf, surfaceBelow, surfaceOf } from './nav.js';
import { partyMembers, joinParty, dismiss, makeAI } from './party.js';
import { recruitBot } from './bots.js';
import { loadMap } from './world.js';

const between = (a, b, rng = Math.random) => a + rng() * (b - a);
const pick = (list, rng = Math.random) => list[Math.floor(rng() * list.length)];

const AGGRO = 110; // how close you can get to a pack before it notices you
const BOSS_AGGRO = 190;
const LEASH = 50; // how far an idle monster strays from its spot
const STAND_UP = 4; // seconds after a fight before the fallen get back up on their own
const WIPE_DELAY = 2.5;

// ---------- The group ----------

// Everyone in the group on this map: { id, name, role, body, bot } (bot is null for you).
export function groupOf(world) {
  const roles = world.dungeon?.roles ?? {};
  const out = [{ id: 'you', name: world.char.name, role: roles.you ?? 'dps', body: world.body, bot: null }];
  for (const bot of partyMembers(world.bots)) {
    if (bot.body && bot.map === world.map.id) out.push({ id: bot.id, name: bot.name, role: roles[bot.id] ?? 'dps', body: bot.body, bot });
  }
  return out;
}

export const isUp = (world, g) => (g.bot ? !g.bot.down : !world.dead);
export const hpOf = (world, g) => (g.bot ? g.bot.hp ?? 0 : world.char.hp);
export const maxHpOf = (world, g) => (g.bot ? g.bot.stats.maxHp : world.stats.maxHp);

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
  const jobs = role === 'tank' ? ['warrior'] : role === 'healer' ? ['mage'] : [pick(['archer', 'thief'], rng)];
  const bot = recruitBot(world.bots, world, { level: Math.floor(between(lo, hi + 1, rng)), jobs });
  joinParty(world.bots, bot, world);
  const ranged = bot.ai.weapon.ranged;
  bot.ai = makeAI(bot, rng, role === 'tank' ? 'guardian' : role === 'healer' ? 'healer' : ranged ? 'sniper' : 'rusher');
  bot.finder = def.id;
  bot.bubble = { text: pick(['hi!', 'hey all', 'ready when u are', 'o/', 'yo', 'first time here?', 'lets gooo']), t: 4.5 };
  return bot;
}

function prep(bot) {
  bot.stats = computeStats(bot.char);
  bot.hp = bot.stats.maxHp;
  bot.down = false;
  bot.inDungeon = true;
  bot.session = Math.max(bot.session ?? 0, 1800);
}

// Forms the group and goes in. Returns a reason string when it can't.
export function startRun(world, id = 'hollow') {
  const plan = planGroup(world, id);
  if (plan.why) return plan.why;
  if (!world.bots) return 'No one else is online.';
  const def = DUNGEONS[id];
  const roles = {};
  for (const s of plan.slots) {
    const bot = s.who === 'you' ? null : s.who ?? recruit(world, def, s.role);
    roles[bot ? bot.id : 'you'] = s.role;
  }
  world.dungeon = { id, roles, rooms: {}, start: world.now, wipes: 0, zones: [], shots: [], vfx: [], callout: null, done: false };
  for (const bot of partyMembers(world.bots)) prep(bot);
  loadMap(world, def.rooms[0], 'start');
  world.log(`Your group enters ${def.name}! You are the ${ROLES[roles.you].label}.`, '#ffe36b');
  if (roles.you === 'tank') world.log('Tanks: Provoke pulls everything nearby onto you, and Chain Hook drags monsters over for the group.', '#bff0dc');
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
      objects: (map.objects ?? []).map((o, i) => ({ ...o, id: i, done: false, progress: 0 })),
    };
    for (const m of world.mobs) settle(m);
  } else {
    world.spawner = room.spawner;
    world.mobs = [...room.spawner.slots.map((s) => s.mob), ...room.adds].filter((m) => m && m.hp > 0);
  }
  // Walking out of a fight calms it down.
  for (const m of world.mobs) if (m.engaged) reset(m);
  room.adds = room.adds.filter((m) => m.hp > 0 && world.mobs.includes(m));
  run.room = room;
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
  } else callout(world, 'Room cleared!', 'The way ahead is open');
  world.juice.push({ type: 'shake', mag: 2, dur: 0.4 });
  for (const g of groupOf(world)) {
    if (g.bot && !g.bot.down && Math.random() < 0.5) g.bot.bubble = { text: pick(last ? ['GG!!', 'we did it!', 'ez clap', 'loot time :D'] : ['nice', 'gj', 'next!', 'ez', ':D']), t: 3 };
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
  if (!room || !body.onGround || Math.abs(body.y - world.map.groundY) > 4) return null;
  return room.objects.find((o) => !o.done && Math.abs(o.x - body.x) < reach) ?? null;
}

// Up near something usable: start lighting or freeing it, or open the chest.
export function dungeonInteract(world) {
  const o = objectNear(world, world.body);
  if (!o) return false;
  if (o.kind === 'chest') {
    if (!roomCleared(world)) world.log('The chest is wrapped in roots. Calm Old Gnarlroot first!', '#ffb3c6');
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
  const task = taskProgress(world);
  const count = task ? ` (${task.have}/${task.need})` : '';
  if (o.kind === 'glowcap') world.log(`${who} lit a glowcap${count}.`, '#ffe9a0');
  if (o.kind === 'cage') {
    world.log(`${who} freed a Sprout${count}!`, '#bff0dc');
    world.numbers.push({ x: o.x, y: world.map.groundY - 44, text: 'Thank you!', color: '#9be08f', t: 0, small: true });
  }
  world.juice.push({ type: 'loot', x: o.x, y: world.map.groundY - 16, color: o.kind === 'glowcap' ? '#ffd66b' : '#9be08f' });
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
    if (o.done || run.combat || Math.abs(o.x - g.body.x) > 20 || !g.body.onGround) {
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

function openChest(world, o) {
  const run = world.dungeon;
  const reward = DUNGEONS[run.id].reward;
  const char = world.char;
  o.done = true;
  o.open = true;
  const levels = gainExp(char, reward.exp);
  char.gold += reward.gold;
  char.cash = (char.cash ?? 0) + reward.cash;
  world.log(`Treasure! +${reward.exp} EXP, +${reward.gold} gold, +${reward.cash} Cash`, '#ffe36b');
  const family = JOBS[char.job].family;
  const slot = pick(JOB_SLOTS);
  const id = GEAR_FAMILIES.includes(family) ? jobGearId(family, slot, reward.gearLevel) : `ear_${reward.gearLevel}`;
  if (ITEMS[id]) {
    const inst = makeEquip(id, { variance: 0.1, rarity: Math.random() < 0.3 ? 2 : 1, variant: 'roll' });
    if (addItem(char.inventory, inst)) world.log(`Received ${itemName(inst)}!`, '#ffd66b');
    else world.log(`Your bag is full, so the ${itemName(inst)} stays in the chest...`, '#ffb3c6');
  }
  for (const it of reward.items) if (addItem(char.inventory, it.id, it.qty)) world.log(`Received ${ITEMS[it.id].name} x${it.qty}.`, ITEMS[it.id].color);
  world.juice.push({ type: 'loot', x: o.x, y: world.map.groundY - 20, color: '#ffd66b' }, { type: 'shake', mag: 2, dur: 0.3 });
  world.fx.push({ kind: 'levelup', x: o.x, y: world.map.groundY, t: 0, dur: 1.6 });
  if (levels > 0) {
    world.events.push({ type: 'levelup', level: char.level });
    world.log(`Level up! You are now level ${char.level}.`, '#ffe36b');
  }
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
    if (m.def.boss) callout(world, m.def.name, BOSS_LINES[m.def.mech] ?? '');
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

// Every monster within `range` turns on `who`: the warrior's Provoke.
export function provoke(world, who, body, range = PROVOKE.range, hold = PROVOKE.hold) {
  let n = 0;
  for (const m of world.mobs) {
    if (m.hp <= 0 || m.def.fight?.mender || Math.abs(m.x - body.x) > range || Math.abs(m.y - body.y) > 120) continue;
    taunt(world, m, who, hold);
    n++;
  }
  world.fx.push({ kind: 'roar', x: body.x, y: body.y, r: range, t: 0, dur: 0.6 });
  return n;
}

// The warrior's Chain Hook in a dungeon: the monsters it catches turn on `who` and get dragged
// over, lined up in front of them for the group (bosses are too heavy to move).
export function hookMobs(world, who, body, mobs, dir) {
  mobs.forEach((m, i) => {
    taunt(world, m, who, 2);
    if (!m.def.boss) yank(m, body.x + dir * (m.def.w / 2 + 14 + i * 14));
  });
}

// ---------- Hurting and healing the group ----------

export function hurtMember(world, g, raw, fromX, { knock = false, pierce = false } = {}) {
  if (!isUp(world, g)) return 0;
  const body = g.body;
  if (g.bot) {
    const bot = g.bot;
    const dmg = absorb(world, body, bot.buffs, Math.round((pierce ? raw : damageTaken(raw, bot.stats.wdef)) * (1 - cutOf(bot.buffs, world.now))));
    bot.hp = Math.max(0, bot.hp - dmg);
    bot.hurt = 0.3;
    world.numbers.push({ x: body.x, y: body.y - body.h - 6, text: `${dmg}`, color: '#ff8fa8', t: 0, small: true });
    if (knock) knockBack(body, fromX);
    if (bot.hp <= 0) {
      bot.down = true;
      bot.attack = null;
      bot.brain.target = null;
      bot.brain.task = null;
      bot.bubble = { text: pick(['x_x', 'noooo', 'im down!', 'rip', 'oof']), t: 3 };
      world.log(`${bot.name} is down!`, '#ff8fa8');
    }
    return dmg;
  }
  if (world.god) return 0;
  const char = world.char;
  const s = world.stats;
  let dmg = absorb(world, body, char.buffs, Math.round((pierce ? raw : damageTaken(raw, s.wdef)) * (1 - cutOf(char.buffs, world.now))));
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
  if (char.hp <= 0) {
    world.dead = true;
    world.events.push({ type: 'death' });
    world.log('You fainted! Your group can get you back up after the fight.', '#ff6b8a');
  }
  return dmg;
}

function healMember(world, g, amount, by) {
  if (!isUp(world, g)) return 0;
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
  for (const g of groupOf(world)) {
    if (!g.bot || !isUp(world, g)) continue;
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
    if (b.shield <= 0) b.until = world.now;
  }
  return dmg;
}

// A support buff on one member of the group: yours lands in your buffs, a party member's in theirs.
export function giveBuff(world, g, id, name, values, duration) {
  const max = maxHpOf(world, g);
  const b = { until: world.now + duration, since: world.now, values, name };
  if (values.barrier) b.shield = Math.round(max * values.barrier);
  if (g.bot) (g.bot.buffs ??= {})[id] = b;
  else world.char.buffs[id] = b;
}

// A party buff spell reaching the members in `box` (you got yours already).
export function buffMembers(world, id, name, params, box) {
  for (const g of groupOf(world)) {
    if (!g.bot || !isUp(world, g) || !inBox(g.body, box)) continue;
    giveBuff(world, g, id, name, params.buff, params.duration);
    world.fx.push({ kind: 'buffcast', skill: id, name, x: g.body.x, y: g.body.y, t: 0, dur: 1.1 });
  }
}

const inBox = (b, box) => b.x >= box.x && b.x <= box.x + box.w && b.y - b.h <= box.y + box.h && b.y >= box.y;

// The fallen party member a Revive in `box` would reach.
export function reviveTarget(world, box) {
  if (!world.dungeon) return null;
  return groupOf(world).find((g) => g.bot && !isUp(world, g) && inBox(g.body, box)) ?? null;
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
  if (g.bot) {
    g.bot.down = false;
    g.bot.hp = Math.round(g.bot.stats.maxHp * pct);
    g.bot.bubble = { text: pick(['ty!', 'thx <3', 'back!', 'phew']), t: 3 };
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

// One engaged monster's turn: step toward its target, wind up, swing.
function fight(world, m, up, dt) {
  const now = world.now;
  m.flash = Math.max(0, m.flash - dt);
  m.age += dt;
  m.lunge = Math.max(0, (m.lunge ?? 0) - dt);
  if (tickYank(m, dt) || tickAir(m, dt)) return;
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

function addZone(world, z) {
  world.dungeon.zones.push({ t: 0, hit: false, after: 0, y: world.map.groundY, ...z });
}

function adds(world, boss, mob, xs, threatOn) {
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
    const s = (m.mech ??= { rain: 7, adds: [0.7, 0.35] });
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
      callout(world, 'Spore Mites!', 'They swarm the healer: Tank, Provoke! DPS, kill them!');
    }
    return false;
  }
  if (m.def.mech === 'boar') {
    const s = (m.mech ??= { charge: 8, gore: 5 });
    if (m.charging) {
      const c = m.charging;
      m.state = 'walk';
      m.dir = c.dir;
      m.x += c.dir * 520 * dt;
      for (const g of up) {
        if (c.hit.has(g.id) || Math.abs(g.body.x - m.x) > m.def.w / 2 + 8 || Math.abs(g.body.y - m.y) > 50) continue;
        c.hit.add(g.id);
        hurtMember(world, g, 190, m.x - c.dir * 40, { knock: true });
      }
      const wall = c.dir > 0 ? m.fx2 : m.fx1;
      if ((c.dir > 0 && m.x >= wall) || (c.dir < 0 && m.x <= wall)) {
        m.x = wall;
        m.charging = null;
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
    if (!s.saplings && frac <= 0.5) {
      s.saplings = true;
      adds(world, m, 'sapling', [m.x - 400, m.x + 400], null);
      callout(world, 'Corrupted Saplings!', 'They feed him their life: cut them down!');
    }
    const feeding = run.room.adds.filter((a) => a.def.fight?.mender && a.hp > 0).length;
    m.shield = feeding > 0;
    if (feeding) m.hp = Math.min(m.def.hp, m.hp + m.def.hp * 0.006 * feeding * dt);
    if (!s.enraged && frac <= 0.2) {
      s.enraged = true;
      callout(world, 'Old Gnarlroot is furious!', 'Everything comes faster now');
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
    run.vfx.push({ kind: 'zonehit', zone: z.kind, x: z.x, y: z.y, w: z.w, t: 0, dur: 0.5 });
    if (z.kind === 'floor') world.juice.push({ type: 'shake', mag: 7, dur: 0.6 });
    for (const g of up) if (inZone(world, z, g.body)) hurtMember(world, g, z.damage, z.from?.x ?? z.x, { knock: z.kind !== 'circle' });
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
  return world.dungeon?.zones.find((z) => !z.hit && z.kind !== 'floor' && inZone(world, z, body)) ?? null;
}

// The closest safe x on the floor from (body), out of every zone about to go off.
export function safeX(world, body) {
  const zones = world.dungeon.zones.filter((z) => !z.hit && z.kind !== 'floor');
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
    Object.assign(g.body, { x: entry.x + 30 + i * 22, y: world.map.groundY, vx: 0, vy: 0, rope: null, onGround: true });
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
  world.log('Your group wiped. Everyone regroups at the start of the room.', '#ffb3c6');
}

// A monster down: thornbacks in the Root Gate drop their keys.
export function onMobKilled(world, m) {
  const run = world.dungeon;
  if (!run) return;
  if (m.spawn?.key) run.room.keys.push({ x: m.x, y: m.y, t: 0, got: false });
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
// hit), and brain.task (a glowcap or cage to work on).
export function roleThink(bot, world, rng) {
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
      // A loose one out of reach gets hooked back; a crowd around gets Provoked.
      const far = loose.filter((m) => !m.def.boss && Math.abs(m.x - body.x) > 70 && Math.abs(m.x - body.x) < 300 && Math.abs(m.y - body.y) < 60);
      if (far.length && world.now >= (br.hookAt ?? 0)) {
        botHook(world, bot, far.slice(0, 4), rng);
        br.hookAt = world.now + between(3, 4.5, rng);
      } else if (loose.length && world.now >= (br.provokeAt ?? 0) && loose.some((m) => Math.abs(m.x - body.x) < PROVOKE.range)) {
        provoke(world, bot.id, body);
        bot.attack = { pose: 'roar', t: 0, dur: 0.5 };
        br.provokeAt = world.now + between(2.2, 3.2, rng);
        if (rng() < 0.25) bot.bubble = { text: pick(['over here!', 'on me!', 'got it', 'hey ugly!']), t: 2.5 };
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
    const target = role === 'dps' ? nearest(menders, body) ?? nearest(addsUp, body) ?? (tankTarget?.hp > 0 ? tankTarget : null) ?? nearest(fights, body) : tankTarget?.hp > 0 ? tankTarget : nearest(fights, body);
    br.target = target ?? null;
    if (!target) return;
    if (role === 'healer') {
      // Healers hang back behind the tank, away from the middle of the fight.
      const anchor = tank?.body ?? body;
      const side = Math.sign(anchor.x - target.x) || -1;
      br.goal = goalAt(world, Math.max(30, Math.min(world.map.width - 30, target.x + side * 140)), target.y, 'fight');
      const low = up.some((g) => hpOf(world, g) / maxHpOf(world, g) < 0.85);
      if (low) br.target = null;
      return;
    }
    // Ranged fighters stand on the tank's side so the monster faces away from them.
    br.goal = spot(target, st.ranged && tank ? Math.sign(tank.body.x - target.x) || sideOf(target) : sideOf(target));
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
      // Ready: hook the pack back to the group from range (bosses are walked up to).
      const pack = next.spawn?.pack ? asleep.filter((m) => m.spawn?.pack === next.spawn.pack) : [next];
      const dist = Math.abs(next.x - body.x);
      if (ready && !next.def.boss && dist < 280 && dist > 60 && Math.abs(next.y - body.y) < 60 && body.onGround && world.now >= (br.hookAt ?? 0)) {
        botHook(world, bot, pack.slice(0, 5), rng);
        br.hookAt = world.now + between(3, 4.5, rng);
        if (rng() < 0.5) bot.bubble = { text: pick(['pulling!', 'gather up!', 'get over here!', 'AoE them!']), t: 2.5 };
        return;
      }
      br.goal = ready ? goalAt(world, next.x - Math.sign(next.x - body.x || 1) * (next.def.boss ? 20 : 220), next.y, 'fight') : goalAt(world, next.x - Math.sign(next.x - body.x || 1) * 190, next.y, 'follow');
      if (ready && rng() < 0.02) bot.bubble = { text: pick(['pulling!', 'ready?', 'going in', 'next pack']), t: 2.5 };
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
    const todo = room.objects.filter((o) => !o.done && o.kind !== 'chest' && !busy.has(o) && safe(o.x) && world.channel?.obj !== o);
    const o = role === 'dps' ? nearest(todo, body) : null;
    if (o) {
      br.task = o;
      br.goal = goalAt(world, o.x, world.map.groundY, 'fight');
      return;
    }
  }
  // Otherwise stay with the group, a step behind the leader.
  const follow = lead === me ? group.find((g) => !g.bot) : lead;
  const k = 1 + (bot.slot ?? 0);
  br.goal = goalAt(world, Math.max(30, follow.body.x - 34 * k), follow.body.y, 'follow');
}

// A party tank throws their Chain Hook at monsters in front of them.
function botHook(world, bot, mobs, rng) {
  const body = bot.body;
  const dir = Math.sign(mobs[0].x - body.x) || 1;
  body.facing = dir;
  hookMobs(world, bot.id, body, mobs, dir);
  world.fx.push({ kind: 'hook', x: body.x + dir * 10, y: body.y - 28, mobs, t: 0, dur: 0.5 });
  bot.attack = { pose: 'throw', t: 0, dur: 0.45, fighting: true };
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
  const cast = () => {
    bot.attack = { pose: 'pray', t: 0, dur: 0.7 };
  };
  if (low.length >= 2 && low[1].f < 0.7) {
    for (const h of hurt) if (h.f < 0.95) healMember(world, h.g, maxHpOf(world, h.g) * 0.16 + bot.stats.int * 0.5, bot.id);
    run.vfx.push({ kind: 'groupheal', x: bot.body.x, y: bot.body.y, t: 0, dur: 0.8 });
    cast();
    if (rng() < 0.2) bot.bubble = { text: pick(['group heal!', 'stay close!', 'healing!']), t: 2.5 };
    return between(1.5, 1.9, rng);
  }
  if (low.length) {
    healMember(world, low[0].g, maxHpOf(world, low[0].g) * between(0.22, 0.3, rng) + bot.stats.int * 0.6, bot.id);
    cast();
    return between(1.1, 1.5, rng);
  }
  // In a fight: keep a barrier on the tank, and a Renew on the group when it's taking damage.
  const tank = up.find((g) => g.role === 'tank');
  const buffsOf = (g) => (g.bot ? g.bot.buffs : world.char.buffs) ?? {};
  if (run.combat && tank && !(buffsOf(tank).barrier?.shield > 0)) {
    giveBuff(world, tank, 'barrier', 'Arcane Barrier', { barrier: 0.22 }, 20);
    world.fx.push({ kind: 'buffcast', skill: 'barrier', name: 'Arcane Barrier', x: tank.body.x, y: tank.body.y, t: 0, dur: 1.1 });
    bot.attack = { pose: 'castup', t: 0, dur: 0.6 };
    return between(1.2, 1.6, rng);
  }
  if (run.combat && hurt.filter((h) => h.f < 0.92).length >= 2 && !up.some((g) => buffsOf(g).renew)) {
    for (const g of up) if (Math.abs(g.body.x - me.body.x) < 320) giveBuff(world, g, 'renew', 'Renew', { regenPct: 0.025 }, 20);
    run.vfx.push({ kind: 'groupheal', x: bot.body.x, y: bot.body.y, t: 0, dur: 0.8 });
    bot.attack = { pose: 'castup', t: 0, dur: 0.6 };
    return between(1.2, 1.6, rng);
  }
  if (!run.combat) {
    const fallen = group.find((g) => !isUp(world, g) && Math.abs(g.body.x - me.body.x) < 44);
    if (fallen) {
      revive(world, fallen, 0.5);
      bot.attack = { pose: 'pray', t: 0, dur: 1 };
      return 1.2;
    }
  }
  return 0.4;
}
