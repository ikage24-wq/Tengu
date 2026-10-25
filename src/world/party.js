// Parties: invite other players (right-click them), and those around your level or below can
// join. Party members follow you from map to map, climbing ledges and ropes, fight the monsters
// around you (their kills give you a share of the EXP, count for your quests, and drop loot for
// you), chat, and level up alongside you, until you leave the party (or they log off).

import { createBody, stepBody } from './physics.js';
import { computeStats } from '../core/stats.js';
import { gainExp, autoAssignAp } from '../core/character.js';
import { physicalRange, magicRange, accuracy, hitChance, rollHit } from '../core/formulas.js';
import { JOBS } from '../data/jobs.js';
import { ITEMS } from '../data/items.js';
import { WEAPON_TYPES } from '../core/formulas.js';
import { speak } from './chatter.js';

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
  join(bots, bot, world);
  say(bot, speak(bots.memory, 'joined', ctx, bot.style, rng));
  world.log(`${bot.name} joined your party!`, '#bff0dc');
}

function join(bots, bot, world) {
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
//   Rusher    charges into packs well ahead of you, fast swings, big spin moves
//   Guardian  sticks to your side and meets whatever comes at you
//   Sniper    hangs back at range and steps away if a monster gets close
//   Healer    stays near you, patches you up when you're hurt, chips in with spells
//   Rookie    a bit lost: wanders, hops around, sometimes falls behind
//   Show-off  flashy: flips and taunts between fancy attacks, roams wide
// Each also has its own reaction speed, rhythm, spot in the formation, and idle habits.

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
    rusher: { hunt: 320, tether: 360, keep: 0.6, react: [0.12, 0.25], rhythm: [0.6, 0.95], special: 0.22, hop: 0.05, habits: ['roar', 'cheer'] },
    guardian: { hunt: 140, tether: 110, keep: 0.7, react: [0.15, 0.3], rhythm: [0.9, 1.3], special: 0.12, hop: 0.02, habits: ['guard', 'roar'] },
    sniper: { hunt: 280, tether: 260, keep: 0.85, react: [0.18, 0.35], rhythm: [0.95, 1.35], special: 0.15, hop: 0.03, habits: ['aimshot', 'cheer'] },
    healer: { hunt: 180, tether: 90, keep: 0.9, react: [0.2, 0.4], rhythm: [1.2, 1.8], special: 0.1, hop: 0.02, habits: ['pray', 'cheer'] },
    rookie: { hunt: 220, tether: 300, keep: 0.5, react: [0.3, 0.7], rhythm: [1.1, 1.8], special: 0.04, hop: 0.25, habits: ['cheer', 'flip'] },
    showoff: { hunt: 300, tether: 320, keep: 0.65, react: [0.12, 0.22], rhythm: [0.75, 1.1], special: 0.35, hop: 0.12, habits: ['flip', 'roar', 'cheer'] },
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

// The monster a member goes after. They stick with a target until it's dead or out of their
// reach, so they don't flip back and forth between two.
function chooseTarget(bot, world, members) {
  const ai = bot.ai;
  const b = world.body;
  const cur = bot.brain.target;
  if (cur && cur.hp > 0 && Math.abs(cur.x - b.x) < ai.hunt * 1.25 && Math.abs(cur.y - b.y) < 170) return cur;
  let best = null;
  let bestScore = Infinity;
  for (const m of world.mobs) {
    if (m.hp <= 0 || Math.abs(m.x - b.x) > ai.hunt || Math.abs(m.y - b.y) > 160) continue;
    // Guardians and healers care most about what's near you; others about what's near them.
    const fromMe = Math.abs(m.x - bot.body.x) + Math.abs(m.y - bot.body.y) * 2;
    const fromYou = Math.abs(m.x - b.x) + Math.abs(m.y - b.y) * 2;
    let score = ['guardian', 'healer'].includes(ai.kind) ? fromYou * 1.5 + fromMe * 0.5 : fromMe;
    // Spread out: a monster someone else is already on is less attractive.
    if (members.some((o) => o !== bot && o.brain?.target === m)) score += 120;
    // And one in front of them beats one behind, so they don't spin round between kills.
    if (Math.sign(m.x - bot.body.x) === -bot.body.facing) score += 70;
    if (score < bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}

// Decides where to be. Runs every few tenths of a second (each member's own reaction time), not
// every frame, which keeps movement calm.
function think(bot, world, members, rng) {
  const ai = bot.ai;
  const br = bot.brain;
  const b = world.body;
  const body = bot.body;
  const st = ai.weapon;
  const off = ai.spot * (1 + bot.slot * 0.35);
  // Their spot is on their own side of you, unless that's past the edge of the map.
  const mine = b.x + ai.side * off;
  const home = clampX(world.map, mine) === mine ? mine : b.x - ai.side * off;
  const target = world.map.isTown ? null : chooseTarget(bot, world, members);
  br.target = target;
  // Too far from you with nothing near you to fight: come back. (Targets are always near you, so
  // this never fights with chasing one.)
  const away = Math.abs(body.x - b.x);
  if (!target && away > ai.tether * 1.4 && ai.kind !== 'rookie') {
    br.goal = { x: home, y: b.y, mode: 'regroup' };
    return;
  }
  if (target) {
    // They pick a side of the monster when they first go for it and keep it, so they don't run
    // back and forth past it as it moves.
    if (br.fightOn !== target) {
      br.fightOn = target;
      br.fightSide = Math.sign(body.x - target.x) || ai.side;
    }
    const dir = br.fightSide;
    const along = (body.x - target.x) * dir;
    // Ranged fighters keep some room; snipers and healers like more.
    const near = st.ranged ? (ai.kind === 'rookie' ? 40 : 60) : 4;
    const far = st.reach * 0.95;
    // Already in a good spot: hold it and let the monster come and go a little.
    br.fought = world.now;
    // (Ranged fighters can shoot up or down a ledge, so they don't need to climb to it.)
    if (along >= near && along <= far && Math.abs(target.y - body.y) < st.lift && body.onGround) {
      br.goal = { x: body.x, y: body.y, mode: 'fight' };
      return;
    }
    br.goal = { x: target.x + dir * Math.max(near + 8, st.reach * ai.keep), y: Math.abs(target.y - body.y) < st.lift ? body.y : target.y, mode: 'fight' };
    return;
  }
  br.fightOn = null;
  // Just finished one off: a moment to look around for the next before heading back.
  if (world.now - (br.fought ?? -9) < 0.9 && away < ai.tether) {
    br.goal = { x: body.x, y: body.y, mode: 'fight' };
    return;
  }
  // Nothing to fight: rookies sometimes wander off to look at something, and stick with it for a
  // few seconds; everyone else settles into their spot by you, with a little drift.
  if (br.goal?.mode === 'wander' && world.now < br.wanderUntil && Math.abs(body.x - br.goal.x) > 8) return;
  if (ai.kind === 'rookie' && rng() < 0.025) {
    br.goal = { x: b.x + between(-140, 140, rng), y: b.y, mode: 'wander' };
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
  const from = { x: body.x + body.facing * 10, y: body.y - 26 };
  const hits = special && !st.magic ? (st.ranged ? 3 : 2) : 1;
  for (let i = 0; i < hits; i++) {
    const miss = rng() >= hitChance(acc, level, m.def);
    const roll = miss ? null : rollHit(range, bot.stats, m.def, level, rng);
    const travel = st.shot ? Math.hypot(m.x - from.x, m.y - from.y) / 620 : 0.12;
    world.pending.push({ at: world.now + travel + i * 0.09, mob: m, miss, damage: roll?.damage ?? 0, crit: roll?.crit ?? false, fromX: body.x, stack: i, party: bot.id });
    if (st.shot) world.fx.push({ kind: 'projectile', shot: st.shot, x: from.x, y: from.y - i * 3, tx: m.x, ty: m.y - m.def.h / 2 + (i - 1) * 4, t: -i * 0.09, dur: Math.max(0.08, travel) });
  }
  const box = { x: body.x - 34, y: body.y - 50, w: 68, h: 50 };
  if (special) {
    if (st.magic) world.fx.push({ kind: 'burst', x: m.x, y: m.y, h: m.def.h, t: 0, dur: 0.55, seed: rng() });
    else if (!st.ranged) world.fx.push({ kind: rng() < 0.5 ? 'spin' : 'flurry', x: body.x, y: body.y, dir: body.facing, box, t: 0, dur: 0.4 });
  } else if (!st.shot) world.fx.push({ kind: 'swing', x: body.x, y: body.y, dir: body.facing, t: 0, dur: 0.3 });
  const pose = special ? (st.magic ? 'castspin' : st.ranged ? (st.shot === 'star' ? 'barrage' : 'rapid') : rng() < 0.5 ? 'spin' : 'flurry') : st.ranged ? st.pose : pick2(['slash', 'slash2', 'thrust']);
  bot.attack = { pose, t: 0, dur: special ? 0.6 : 0.42 };
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
    // Lost or stuck: catch up with a shimmer, as if they'd taken a shortcut.
    const far = Math.abs(body.x - b.x) > 480 || Math.abs(body.y - b.y) > 220;
    bot.stuck = far ? bot.stuck + dt : Math.max(0, bot.stuck - dt);
    const below = !b.rope && body.onGround && b.onGround && Math.abs(body.y - b.y) > 40;
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
    const intent = busy ? { left: false, right: false, up: false, down: false, jump: false } : steerTo(bot, world, members);
    // Rookies and show-offs hop about now and then.
    if (body.onGround && !intent.jump && !bot.attack && rng() < bot.ai.hop * dt * (br.goal?.mode === 'fight' ? 0.5 : 1)) intent.jump = true;
    stepBody(body, map, intent, dt, { speed: Math.min(135, (bot.stats.speed + 8) * bot.ai.speed), jump: 100 });
    br.stopped = body.onGround && Math.abs(body.vx) < 8 ? (br.stopped ?? 0) + dt : 0;
    // Fight.
    const m = br.target;
    const st = bot.ai.weapon;
    if (m && m.hp > 0 && Math.abs(m.x - body.x) <= st.reach && Math.abs(m.y - body.y) < Math.max(50, st.lift) && body.onGround) {
      // Turn to it once planted (walking sets their facing), and only swing at what they face.
      const toward = m.x < body.x ? -1 : 1;
      if (!intent.left && !intent.right) body.facing = toward;
      bot.cooldown -= dt;
      if (bot.cooldown <= 0 && body.facing === toward) {
        strike(bot, m, world, rng);
        bot.attack.fighting = true;
        bot.cooldown = between(bot.ai.rhythm[0], bot.ai.rhythm[1], rng);
      }
    } else if (br.stopped > 0.35 && br.goal?.mode !== 'fight') {
      // Standing about: look where you're headed if you're on the move, or at you if not.
      body.facing = youStill ? (b.x < body.x ? -1 : 1) : b.facing;
    }
    // Healers patch you up between fights (or mid-fight if you're in trouble).
    if (bot.ai.kind === 'healer') {
      br.healIn -= dt;
      if (br.healIn <= 0) br.healIn = heal(bot, world, bots) ? between(6, 10, rng) : 1.5;
    }
    // Idle habits while you stand around: a flip, a cheer, a taunt, a little stretch.
    if (!m && br.still > 3 && body.onGround && !bot.attack) {
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
