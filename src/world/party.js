// Parties: invite other players (right-click them), and those around your level or below can
// join. Party members come along from map to map. In town they hang around near you; out in
// the field each one goes off hunting on their own, finding their way over ledges and ropes to
// monsters anywhere on the map (their kills give you a share of the EXP, count for your quests,
// and drop loot for you). They chat and level up alongside you, until you leave the party (or
// they log off).

import { createBody, stepBody } from './physics.js';
import { computeStats } from '../core/stats.js';
import { gainExp, autoAssignAp } from '../core/character.js';
import { physicalRange, magicRange, accuracy, hitChance, rollHit } from '../core/formulas.js';
import { JOBS } from '../data/jobs.js';
import { ITEMS } from '../data/items.js';
import { WEAPON_TYPES } from '../core/formulas.js';
import { speak } from './chatter.js';
import { navOf, findPath, followPath, surfaceBelow, surfaceOf } from './nav.js';
import { roleThink, healerTurn, jumpNow } from './dungeon.js';
import { COMBOS } from './melee.js';

export const PARTY_MAX = 5; // members besides you
export const LEVEL_GAP = 5; // they can be at most this many levels above you
const FOLLOW_GAP = 26;

const between = (a, b, rng) => a + rng() * (b - a);

export function partyMembers(bots) {
  return bots ? bots.list.filter((b) => b.party) : [];
}

function say(bot, text) {
  if (text) bot.bubble = { text, t: 4.5 };
}

// Why a player can't be invited right now, or null.
export function inviteBlocker(bots, bot, world) {
  if (bot.party) return 'Already in your party';
  const pending = bots.list.filter((b) => b.invite).length;
  if (partyMembers(bots).length + pending >= PARTY_MAX) return 'Your party is full';
  if (bot.invite) return 'Waiting for an answer';
  if (['leave', 'logout', 'transit'].includes(bot.state)) return 'They are leaving';
  return null;
}

// Sends an invite; they answer after a moment (see updateParty).
export function invite(bots, bot, world) {
  const why = inviteBlocker(bots, bot, world);
  if (why) return why;
  bot.invite = { at: between(1, 2.4, bots.rng) };
  world.log(`You invited ${bot.name} to your party.`, '#bff0dc');
  return null;
}

function answer(bots, bot, world) {
  const rng = bots.rng;
  const ctx = { player: world.char.name, level: bot.level };
  bot.invite = null;
  let mood = null;
  // The party may have filled up while they were thinking it over.
  if (partyMembers(bots).length >= PARTY_MAX) {
    say(bot, 'aw party full');
    world.log(`${bot.name} couldn't join: your party is full.`, '#ffb3c6');
    return;
  }
  if (bot.level > world.char.level + LEVEL_GAP) mood = 'tooHigh';
  else if (bot.shop) mood = 'shopBusy';
  else if (rng() < 0.15) mood = 'declined';
  if (mood) {
    say(bot, speak(bots.memory, mood, ctx, bot.style, rng));
    world.log(`${bot.name} declined your party invite.`, '#ffb3c6');
    return;
  }
  joinParty(bots, bot, world);
  say(bot, speak(bots.memory, 'joined', ctx, bot.style, rng));
  world.log(`${bot.name} joined your party!`, '#bff0dc');
}

export function joinParty(bots, bot, world) {
  const b = world.body;
  bot.party = true;
  bot.shop = null;
  bot.state = 'party';
  bot.map = world.map.id;
  // They'll stay a good while, but not forever.
  bot.session = Math.max(bot.session, 0) + between(600, 1500, bots.rng);
  bot.body = createBody(bot.x, b.onGround ? world.map.groundY : b.y);
  bot.body.y = world.map.groundY;
  bot.stats = computeStats(bot.char);
  bot.cooldown = between(0.5, 1, bots.rng);
  bot.stuck = 0;
  bot.ai = makeAI(bot, bots.rng);
  bot.brain = { think: 0, goal: null, target: null, settled: false, still: 0, habitIn: between(4, 10, bots.rng), healIn: between(5, 10, bots.rng) };
}

// They leave the party: in town they go back to wandering; out in the field they head home.
export function dismiss(bots, bot, world, { quiet = false } = {}) {
  if (!bot.party) return;
  bot.party = false;
  bot.body = null;
  bot.attack = null;
  if (!quiet) say(bot, speak(bots.memory, 'leaving', { player: world.char.name }, bot.style, bots.rng));
  if (world.map.isTown && bot.map === world.map.id) {
    bot.state = 'idle';
    bot.timer = between(2, 5, bots.rng);
    bot.stay = between(60, 160, bots.rng);
  } else {
    bot.state = 'logout';
    bot.timer = 1.2;
  }
}

export function leaveParty(bots, world) {
  const members = partyMembers(bots);
  if (!members.length) return;
  for (const bot of members) dismiss(bots, bot, world);
  world.log('You left the party.', '#d4cbe8');
}

export function kick(bots, bot, world) {
  dismiss(bots, bot, world, { quiet: true });
  say(bot, 'aw ok');
  world.log(`${bot.name} was removed from the party.`, '#d4cbe8');
}

// ---------- Playstyles ----------
// Every member plays their own way, from their class and a roll of personality:
//   Rusher    goes for packs, fast swings, big spin moves
//   Guardian  steady and tough, picks off monsters closer to you
//   Sniper    fights from range, shooting up and down ledges
//   Healer    heals you from anywhere on the map, chips in with spells
//   Rookie    a bit lost: gets distracted and wanders off to look at things
//   Show-off  flashy: flips and taunts between fancy attacks
// Each also has its own reaction speed, rhythm, walking pace, and idle habits.

export const PLAYSTYLES = {
  rusher: { label: 'Rusher', color: '#ff7a6b' },
  guardian: { label: 'Guardian', color: '#5aa8ff' },
  sniper: { label: 'Sniper', color: '#3fc48a' },
  healer: { label: 'Healer', color: '#f0b53a' },
  rookie: { label: 'Rookie', color: '#c9a6ff' },
  showoff: { label: 'Show-off', color: '#ff8fc1' },
};

function weaponStyle(bot) {
  const type = bot.stats.weaponType;
  const mage = JOBS[bot.char.job].family === 'mage';
  if (mage) return { reach: 170, lift: 100, pose: 'castforward', shot: 'bolt', magic: true, ranged: true };
  if (WEAPON_TYPES[type]?.ranged) return { reach: 190, lift: 100, pose: type === 'claw' ? 'throw' : 'draw', shot: type === 'claw' ? 'star' : 'arrow', ranged: true };
  return { reach: 42, lift: 30, pose: type === 'spear' ? 'thrust' : pick2(['slash', 'slash2']), shot: null, ranged: false };
}
function pick2(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function makeAI(bot, rng, kind = null) {
  const st = weaponStyle(bot);
  const family = JOBS[bot.char.job].family;
  kind ??= bot.level < 12 && rng() < 0.6 ? 'rookie'
    : bot.pro && rng() < 0.6 ? 'showoff'
    : ['cleric', 'bishop'].includes(bot.char.job) || (family === 'mage' && rng() < 0.35) ? 'healer'
    : st.ranged ? (rng() < 0.75 ? 'sniper' : 'showoff')
    : rng() < 0.55 ? 'rusher' : 'guardian';
  const base = {
    rusher: { keep: 0.6, react: [0.12, 0.25], rhythm: [0.6, 0.95], special: 0.22, habits: ['roar', 'cheer'] },
    guardian: { keep: 0.7, react: [0.15, 0.3], rhythm: [0.9, 1.3], special: 0.12, habits: ['guard', 'roar'] },
    sniper: { keep: 0.85, react: [0.18, 0.35], rhythm: [0.95, 1.35], special: 0.15, habits: ['aimshot', 'cheer'] },
    healer: { keep: 0.9, react: [0.2, 0.4], rhythm: [1.2, 1.8], special: 0.1, habits: ['pray', 'cheer'] },
    rookie: { keep: 0.5, react: [0.3, 0.7], rhythm: [1.1, 1.8], special: 0.04, habits: ['cheer', 'flip'] },
    showoff: { keep: 0.65, react: [0.12, 0.22], rhythm: [0.75, 1.1], special: 0.35, habits: ['flip', 'roar', 'cheer'] },
  }[kind];
  return {
    kind, ...base, weapon: st,
    // Their own spot beside you: which side, and how far.
    side: rng() < 0.5 ? -1 : 1,
    spot: between(24, 60, rng),
    // Small personal quirks so two of a kind still move differently.
    speed: between(0.92, 1.08, rng),
    patience: between(0.8, 1.3, rng),
  };
}

// ---------- In the field: hunting on their own ----------

// The monster a member hunts: one near them that no partymate is already on, anywhere on the
// map. They stick with it until it's dead (or turns out to be out of reach), so they don't flip
// between two. Guardians lean toward monsters near you, rushers toward packs.
function huntTarget(bot, world, members) {
  const br = bot.brain;
  const body = bot.body;
  const skip = (m) => br.skip?.mob === m && world.now < br.skip.until;
  const cur = br.target;
  if (cur && cur.hp > 0 && world.mobs.includes(cur) && !skip(cur)) return cur;
  let best = null;
  let bestScore = Infinity;
  for (const m of world.mobs) {
    if (m.hp <= 0 || skip(m)) continue;
    let score = Math.abs(m.x - body.x) + Math.abs(m.y - body.y) * 3;
    if (members.some((o) => o !== bot && o.brain?.target === m)) score += 300;
    if (Math.sign(m.x - body.x) === -body.facing) score += 40;
    if (bot.ai.kind === 'guardian') score += (Math.abs(m.x - world.body.x) + Math.abs(m.y - world.body.y) * 3) * 0.5;
    if (bot.ai.kind === 'rusher') score -= 40 * world.mobs.filter((o) => o !== m && o.hp > 0 && Math.abs(o.x - m.x) < 120 && Math.abs(o.y - m.y) < 30).length;
    if (score < bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}

// Decides what to do in the field: pick a monster, choose a spot to fight it from on its ledge
// (or, for ranged fighters, anywhere in range), and when the map is clear, wander off to look
// somewhere else. Goals carry the surface they're on, so the path finder can get there.
function hunt(bot, world, members, rng) {
  const ai = bot.ai;
  const br = bot.brain;
  const body = bot.body;
  const st = ai.weapon;
  const nav = navOf(world.map);
  // Rookies get distracted now and then and go look at something instead.
  const distracted = ai.kind === 'rookie' && br.goal?.mode === 'wander' && world.now < br.wanderUntil;
  const target = distracted ? null : huntTarget(bot, world, members);
  if (target && target !== br.target && ai.kind === 'rookie' && rng() < 0.2) {
    br.target = null;
    return wander(bot, world, nav, rng);
  }
  br.target = target;
  if (target) {
    if (br.fightOn !== target) {
      br.fightOn = target;
      br.fightSide = Math.sign(body.x - target.x) || ai.side;
    }
    const near = st.ranged ? 60 : 4;
    const along = (body.x - target.x) * br.fightSide;
    br.fought = world.now;
    // In a good spot already (ranged fighters can shoot up or down a ledge): hold it.
    if (body.onGround && along >= near && along <= st.reach * 0.95 && Math.abs(target.y - body.y) < st.lift) {
      br.goal = { x: body.x, y: body.y, mode: 'fight', surface: surfaceOf(nav, body) };
      return;
    }
    const s = surfaceBelow(nav, target.x, target.y);
    const surf = nav.surfaces[s];
    const off = Math.max(near + 8, st.reach * ai.keep);
    // Their side of it, unless that runs off the ledge.
    let x = target.x + br.fightSide * off;
    if (x < surf.x1 + 8 || x > surf.x2 - 8) {
      br.fightSide = -br.fightSide;
      x = target.x + br.fightSide * off;
    }
    br.goal = { x: Math.max(surf.x1 + 8, Math.min(surf.x2 - 8, x)), y: surf.y, mode: 'fight', surface: s };
    return;
  }
  br.fightOn = null;
  // Just finished one off: a moment to look around for the next.
  if (world.now - (br.fought ?? -9) < 0.9) return;
  if (br.goal?.mode === 'wander' && world.now < br.wanderUntil) return;
  wander(bot, world, nav, rng);
}

// Off to a random spot on a random ledge, for a while.
function wander(bot, world, nav, rng) {
  const br = bot.brain;
  const s = Math.floor(rng() * nav.surfaces.length);
  const surf = nav.surfaces[s];
  br.goal = { x: between(Math.max(24, surf.x1 + 12), Math.min(world.map.width - 24, surf.x2 - 12), rng), y: surf.y, mode: 'wander', surface: s };
  br.wanderUntil = world.now + between(4, 9, rng) * bot.ai.patience;
}

// Walks a member to its goal in the field along a path over ledges and ropes, planned again
// when the goal moves to another surface, the body ends up somewhere unexpected, or every so
// often. A goal they can't reach is given up on for a while.
function fieldSteer(bot, world, members) {
  const br = bot.brain;
  const body = bot.body;
  const g = br.goal;
  const none = { left: false, right: false, up: false, down: false, jump: false };
  if (!g || g.surface < 0) return none;
  const nav = navOf(world.map);
  const here = surfaceOf(nav, body);
  if (here >= 0 && (!br.path || br.pathTo !== g.surface || world.now > br.replanAt)) {
    br.path = findPath(nav, here, body.x, g.surface, g.x);
    br.pathTo = g.surface;
    br.replanAt = world.now + 1.5;
    if (!br.path) {
      if (br.target) br.skip = { mob: br.target, until: world.now + 8 };
      br.target = null;
      br.goal = null;
      return none;
    }
  }
  if (!br.path) return none;
  // On the goal's ledge: the usual calm approach (stop near it, keep apart from partymates).
  if (!br.path.length && here === g.surface) return steerTo(bot, world, members);
  br.settled = false;
  const { intent, lost } = followPath(nav, body, br.path, g.x);
  if (lost) br.path = null;
  return intent;
}

// ---------- In town: hanging around near you ----------

// Decides where to be. Runs every few tenths of a second (each member's own reaction time), not
// every frame, which keeps movement calm.
function think(bot, world, members, rng) {
  if (world.dungeon) return roleThink(bot, world, rng);
  if (!world.map.isTown) return hunt(bot, world, members, rng);
  const ai = bot.ai;
  const br = bot.brain;
  const b = world.body;
  const body = bot.body;
  const off = ai.spot * (1 + bot.slot * 0.35);
  // Their spot is on their own side of you, unless that's past the edge of the map.
  const mine = b.x + ai.side * off;
  const home = clampX(world.map, mine) === mine ? mine : b.x - ai.side * off;
  br.target = null;
  // Rookies sometimes wander off to look at something, and stick with it for a few seconds;
  // everyone else settles into their spot by you, with a little drift.
  if (br.goal?.mode === 'wander' && world.now < br.wanderUntil && Math.abs(body.x - br.goal.x) > 8) return;
  if (ai.kind === 'rookie' && rng() < 0.025) {
    br.goal = { x: clampX(world.map, b.x + between(-140, 140, rng)), y: b.y, mode: 'wander' };
    br.wanderUntil = world.now + between(3, 6, rng);
    return;
  }
  const drift = br.still > 4 ? Math.sin(world.now * 0.4 + bot.slot) * 16 : 0;
  br.goal = { x: home + drift, y: b.y, mode: 'follow' };
}

const clampX = (map, x) => Math.max(24, Math.min(map.width - 24, x));

// Walks toward (tx, ty): ropes up, jumps to ledges, drops through them to get down.
function steer(bot, map, tx, ty) {
  const body = bot.body;
  const intent = { left: false, right: false, up: false, down: false, jump: false };
  const dx = tx - body.x;
  if (body.rope) {
    intent.up = ty < body.y - 2;
    intent.down = ty > body.y + 2;
    if (Math.abs(ty - body.y) < 3) {
      intent.jump = true;
      intent.right = dx > 0;
      intent.left = dx <= 0;
    }
    return intent;
  }
  const above = ty < body.y - 12;
  const below = ty > body.y + 12;
  if (above && body.onGround) {
    // A rope leading up toward the target?
    const rope = map.ropes.find((r) => r.bottom >= body.y - 2 && r.top <= body.y - 12 && r.top >= ty - 30 && Math.abs(r.x - body.x) < 160);
    if (rope && body.y - ty > 90) {
      if (Math.abs(rope.x - body.x) > 6) {
        intent.right = rope.x > body.x;
        intent.left = rope.x < body.x;
      } else intent.up = true;
      return intent;
    }
    // Otherwise jump up, moving toward the target.
    if (Math.abs(dx) < 70) intent.jump = true;
  } else if (below && body.onGround && body.surface && !body.surface.ground && Math.abs(dx) < 60) {
    intent.down = true;
    intent.jump = true;
  }
  if (Math.abs(dx) > 4) {
    intent.right = dx > 0;
    intent.left = dx < 0;
  }
  return intent;
}

// Gentle steering toward the goal: they stop inside a small radius and only start again once the
// goal has moved well away (no jitter), and keep a little space from each other.
function steerTo(bot, world, members) {
  const body = bot.body;
  const br = bot.brain;
  const g = br.goal;
  if (!g) return { left: false, right: false, up: false, down: false, jump: false };
  let tx = g.x;
  for (const o of members) {
    if (o === bot || !o.body) continue;
    const d = body.x - o.body.x;
    if (Math.abs(d) < 18 && Math.abs(body.y - o.body.y) < 10) tx += (d >= 0 ? 1 : -1) * (18 - Math.abs(d));
  }
  tx = clampX(world.map, tx);
  const dx = tx - body.x;
  const dy = g.y - body.y;
  const startAt = g.mode === 'fight' ? 10 : 22;
  if (br.settled && Math.abs(dx) < startAt && Math.abs(dy) < 12) return { left: false, right: false, up: false, down: false, jump: false };
  br.settled = Math.abs(dx) < 6 && Math.abs(dy) < 12;
  if (br.settled) return { left: false, right: false, up: false, down: false, jump: false };
  const intent = steer(bot, world.map, tx, g.y);
  // No twitchy turnarounds: a small correction the other way (or any in mid-air) waits until
  // they've come to a stop.
  const back = (intent.left && body.vx > 20) || (intent.right && body.vx < -20);
  if (back && (Math.abs(dx) < 16 || !body.onGround) && !body.rope) {
    intent.left = false;
    intent.right = false;
  }
  return intent;
}

function strike(bot, m, world, rng) {
  const ai = bot.ai;
  const st = ai.weapon;
  const body = bot.body;
  const level = bot.char.level;
  const family = JOBS[bot.char.job].family;
  // Now and then a fancier move: a spin, a flurry, a volley, or a burst spell.
  const special = rng() < ai.special;
  const power = special ? between(160, 230, rng) : 100;
  const range = st.magic ? magicRange(bot.stats, power * 1.3) : physicalRange(bot.stats, bot.stats.weaponType, power);
  const acc = accuracy(family, bot.stats, level);
  // Shots and spells leave from the hands, chest high.
  const from = { x: body.x + body.facing * 10, y: body.y - 16 };
  const hits = special && !st.magic ? (st.ranged ? 3 : 2) : 1;
  // Melee members work through their weapon's combo, one step per swing: the hit lands as the
  // blade cuts, with that step's push and smear.
  const steps = !special && !st.ranged && !st.magic ? COMBOS[bot.stats.weaponType] ?? COMBOS.none : null;
  const step = steps ? steps[(bot.comboStep = ((bot.comboStep ?? -1) + 1) % steps.length)] : null;
  const cut = step?.strikes[0];
  const impact = cut ? cut.at * step.dur : 0.12;
  for (let i = 0; i < hits; i++) {
    const miss = rng() >= hitChance(acc, level, m.def);
    const roll = miss ? null : rollHit(range, bot.stats, m.def, level, rng);
    const travel = st.shot ? Math.hypot(m.x - from.x, m.y - from.y) / 620 : impact;
    world.pending.push({ at: world.now + travel + i * 0.09, mob: m, miss, damage: roll?.damage ?? 0, crit: roll?.crit ?? false, fromX: body.x, stack: i, party: bot.id, knock: cut?.knock, launch: cut?.launch, big: cut?.big });
    if (st.shot) world.fx.push({ kind: 'projectile', shot: st.shot, x: from.x, y: from.y - i * 3, tx: m.x, ty: m.y - m.def.h / 2 + (i - 1) * 4, t: -i * 0.09, dur: Math.max(0.08, travel) });
  }
  const box = { x: body.x - 34, y: body.y - 50, w: 68, h: 50 };
  if (special) {
    if (st.magic) world.fx.push({ kind: 'burst', x: m.x, y: m.y, h: m.def.h, t: 0, dur: 0.55, seed: rng() });
    else if (!st.ranged) world.fx.push({ kind: rng() < 0.5 ? 'spin' : 'flurry', x: body.x, y: body.y, dir: body.facing, box, t: 0, dur: 0.4 });
  }
  if (cut?.arc) {
    world.fx.push({ kind: 'arc', x: body.x + body.facing * 10, y: body.y - 25, dir: body.facing, r: cut.reach * 0.52, start: cut.arc[0], sweep: cut.arc[1], thick: cut.thick ?? 7, big: cut.big, color: cut.big ? '#ffb347' : '#8fb8ff', t: -impact, dur: cut.big ? 0.32 : 0.24 });
  }
  const pose = special ? (st.magic ? 'castspin' : st.ranged ? (st.shot === 'star' ? 'barrage' : 'rapid') : rng() < 0.5 ? 'spin' : 'flurry') : st.ranged ? st.pose : step.move;
  bot.attack = { pose, t: 0, dur: special ? 0.6 : step?.dur ?? 0.42 };
}

// Healers keep an eye on your HP.
function heal(bot, world, bots) {
  const char = world.char;
  const max = world.stats.maxHp;
  if (char.hp >= max * 0.85 || world.dead) return false;
  const amount = Math.round(max * between(0.12, 0.2, bots.rng) + bot.stats.int * 2);
  char.hp = Math.min(max, char.hp + amount);
  world.fx.push({ kind: 'heal', x: world.body.x, y: world.body.y, t: 0, dur: 0.8 });
  world.numbers.push({ x: world.body.x, y: world.body.y - 52, text: `+${amount}`, color: '#7ee081', t: 0 });
  bot.attack = { pose: 'pray', t: 0, dur: 0.7 };
  if (bots.rng() < 0.3) say(bot, pick2(['heal!', 'healed u', 'careful!', 'got u {emote}'.replace('{emote}', ':)'), 'hp up!']));
  return true;
}

// Members level up from the party's kills too.
export function shareKill(bots, world, mob) {
  for (const bot of partyMembers(bots)) {
    if (bot.map !== world.map.id) continue;
    const before = bot.char.level;
    gainExp(bot.char, Math.round(mob.def.exp * 0.5));
    if (bot.char.level > before) {
      autoAssignAp(bot.char);
      bot.level = bot.char.level;
      bot.stats = computeStats(bot.char);
      say(bot, speak(bots.memory, 'levelUp', { player: world.char.name, level: bot.level }, bot.style, bots.rng));
      world.fx.push({ kind: 'levelup', x: bot.body?.x ?? bot.x, y: bot.body?.y ?? world.map.groundY, t: 0, dur: 1.6 });
      world.log(`${bot.name} reached level ${bot.level}!`, '#ffe36b');
    }
  }
}

export function updateParty(bots, world, dt) {
  const rng = bots.rng;
  // Answers to invites.
  for (const bot of bots.list) {
    if (!bot.invite) continue;
    bot.invite.at -= dt;
    if (bot.invite.at <= 0) answer(bots, bot, world);
  }
  const members = partyMembers(bots);
  world.partySize = members.length;
  const b = world.body;
  const map = world.map;
  const youStill = Math.abs(b.vx) < 8 && b.onGround;
  members.forEach((bot, i) => {
    bot.slot = i;
    bot.ai ??= makeAI(bot, rng);
    bot.brain ??= { think: 0, goal: null, target: null, settled: false, still: 0, habitIn: 6, healIn: 6 };
    const br = bot.brain;
    // Following you to a new map: they arrive right behind you, a beat apart.
    if (bot.map !== map.id || !bot.body) {
      bot.map = map.id;
      bot.body = createBody(b.x - b.facing * (FOLLOW_GAP + i * 14), b.y);
      bot.body.onGround = b.onGround;
      bot.appear = 1 + i * 0.25;
      br.goal = null;
      br.target = null;
      br.think = 0.2 + i * 0.15;
    }
    if (bot.session <= 0) {
      dismiss(bots, bot, world);
      world.log(`${bot.name} left the party.`, '#d4cbe8');
      return;
    }
    const body = bot.body;
    // Fallen in a dungeon: they lie where they fell until someone gets them up.
    if (bot.down) {
      bot.attack = null;
      stepBody(body, map, { left: false, right: false, up: false, down: false, jump: false }, dt, { speed: 0, jump: 0 });
      bot.x = body.x;
      return;
    }
    // In town, lost or stuck: catch up with a shimmer, as if they'd taken a shortcut. (In the
    // field they're off on their own.)
    const far = map.isTown && (Math.abs(body.x - b.x) > 480 || Math.abs(body.y - b.y) > 220);
    bot.stuck = far ? bot.stuck + dt : Math.max(0, bot.stuck - dt);
    const below = map.isTown && !b.rope && body.onGround && b.onGround && Math.abs(body.y - b.y) > 40;
    bot.lowFor = below ? (bot.lowFor ?? 0) + dt : 0;
    if (bot.stuck > 3 || bot.lowFor > 6 * bot.ai.patience) {
      Object.assign(body, { x: b.x - b.facing * (FOLLOW_GAP + i * 14), y: b.y, vx: 0, vy: 0, rope: null, onGround: b.onGround, surface: b.surface });
      bot.stuck = 0;
      bot.lowFor = 0;
      bot.appear = 1;
      br.goal = null;
    }
    // Think at their own pace.
    br.still = youStill ? br.still + dt : 0;
    br.think -= dt;
    if (br.think <= 0) {
      br.think = between(bot.ai.react[0], bot.ai.react[1], rng);
      think(bot, world, members, rng);
    }
    // Move.
    const busy = bot.attack && ['pray', 'cheer', 'flip', 'roar', 'guard', 'aimshot'].includes(bot.attack.pose) && !bot.attack.fighting;
    const intent = busy ? { left: false, right: false, up: false, down: false, jump: false } : map.isTown ? steerTo(bot, world, members) : fieldSteer(bot, world, members);
    // In a dungeon, hop over the Root Slam.
    if (world.dungeon && jumpNow(world, body)) intent.jump = true;
    // Walking into something and getting nowhere: plan again, and give up on that monster.
    const pushing = (intent.left || intent.right) && body.onGround;
    br.stall = pushing && Math.abs(body.x - (br.lastX ?? body.x)) < 0.3 ? (br.stall ?? 0) + dt : 0;
    br.lastX = body.x;
    if (br.stall > 1.5) {
      br.path = null;
      if (br.target) br.skip = { mob: br.target, until: world.now + 6 };
      br.target = null;
      br.goal = null;
      br.stall = 0;
    }
    stepBody(body, map, intent, dt, { speed: Math.min(135, (bot.stats.speed + 8) * bot.ai.speed), jump: 100 });
    br.stopped = body.onGround && Math.abs(body.vx) < 8 ? (br.stopped ?? 0) + dt : 0;
    // Fight.
    const m = br.target;
    const st = bot.ai.weapon;
    if (m && m.hp > 0 && Math.abs(m.x - body.x) <= st.reach + m.def.w / 2 && Math.abs(m.y - body.y) < Math.max(50, st.lift) && body.onGround) {
      // Turn to it once planted (walking sets their facing), and only swing at what they face.
      const toward = m.x < body.x ? -1 : 1;
      if (!intent.left && !intent.right) body.facing = toward;
      bot.cooldown -= dt;
      if (bot.cooldown <= 0 && body.facing === toward) {
        strike(bot, m, world, rng);
        bot.attack.fighting = true;
        bot.cooldown = between(bot.ai.rhythm[0], bot.ai.rhythm[1], rng);
      }
    } else if (map.isTown && br.stopped > 0.35 && br.goal?.mode !== 'fight') {
      // Standing about: look where you're headed if you're on the move, or at you if not.
      body.facing = youStill ? (b.x < body.x ? -1 : 1) : b.facing;
    }
    // Healers patch you up between fights (or mid-fight if you're in trouble).
    if (world.dungeon) {
      if (world.dungeon.roles[bot.id] === 'healer') {
        br.healIn -= dt;
        if (br.healIn <= 0) br.healIn = healerTurn(bot, world, rng);
      }
    } else if (bot.ai.kind === 'healer') {
      br.healIn -= dt;
      if (br.healIn <= 0) br.healIn = heal(bot, world, bots) ? between(6, 10, rng) : 1.5;
    }
    // Idle habits while you stand around: a flip, a cheer, a taunt, a little stretch.
    if (!m && body.onGround && !bot.attack && (map.isTown ? br.still > 3 : br.goal?.mode === 'wander' && br.settled)) {
      br.habitIn -= dt;
      if (br.habitIn <= 0) {
        br.habitIn = between(6, 14, rng) * bot.ai.patience;
        bot.attack = { pose: bot.ai.habits[Math.floor(rng() * bot.ai.habits.length)], t: 0, dur: 0.9 };
      }
    }
    if (bot.attack && (bot.attack.t += dt) >= bot.attack.dur) bot.attack = null;
    bot.x = body.x;
    if (bot.appear > 0) bot.appear = Math.max(0, bot.appear - dt * 1.5);
    // Party chat.
    bot.nextLine -= dt;
    if (bot.nextLine <= 0 && !bot.bubble) {
      bot.nextLine = between(35, 80, rng) * Math.max(1, members.length / 2);
      const line = speak(bots.memory, 'party', { player: world.char.name, level: bot.level, weapon: ITEMS[bot.char.equipment.weapon?.id]?.name }, bot.style, rng);
      if (line) {
        say(bot, line);
        world.log(`[Party] ${bot.name}: ${line}`, '#9fe0b0');
      }
    }
  });
}
