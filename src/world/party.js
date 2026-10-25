// Parties: invite other players (right-click them), and those around your level or below can
// join. Party members follow you from map to map, climbing ledges and ropes, fight the monsters
// around you (their kills give you a share of the EXP, count for your quests, and drop loot for
// you), chat, and level up alongside you, until you leave the party (or they log off).

import { createBody, stepBody } from './physics.js';
import { computeStats } from '../core/stats.js';
import { gainExp, autoAssignAp } from '../core/character.js';
import { physicalRange, magicRange, accuracy, hitChance, rollHit } from '../core/formulas.js';
import { JOBS } from '../data/jobs.js';
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
  if (partyMembers(bots).length >= PARTY_MAX) return 'Your party is full';
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
  bot.slot = partyMembers(bots).indexOf(bot);
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

// How a member fights: their reach, the pose they strike with, and the shot they fire.
function styleOf(bot) {
  const type = bot.stats.weaponType;
  const mage = JOBS[bot.char.job].family === 'mage';
  if (mage) return { reach: 170, pose: 'castforward', shot: 'bolt', magic: true };
  if (WEAPON_TYPES[type]?.ranged) return { reach: 190, pose: type === 'claw' ? 'throw' : 'draw', shot: type === 'claw' ? 'star' : 'arrow' };
  return { reach: 40, pose: type === 'spear' ? 'thrust' : 'slash', shot: null };
}

// The monster a member goes after: the nearest live one close to you, on about their level.
function targetFor(bot, world) {
  const b = world.body;
  let best = null;
  let bestD = Infinity;
  for (const m of world.mobs) {
    if (m.hp <= 0 || Math.abs(m.x - b.x) > 300 || Math.abs(m.y - b.y) > 160) continue;
    const d = Math.abs(m.x - bot.body.x) + Math.abs(m.y - bot.body.y) * 2;
    if (d < bestD) {
      bestD = d;
      best = m;
    }
  }
  return best;
}

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

function strike(bot, m, world, rng) {
  const st = styleOf(bot);
  const body = bot.body;
  const level = bot.char.level;
  const family = JOBS[bot.char.job].family;
  const range = st.magic ? magicRange(bot.stats, 130) : physicalRange(bot.stats, bot.stats.weaponType, 100);
  const miss = rng() >= hitChance(accuracy(family, bot.stats, level), level, m.def);
  const roll = miss ? null : rollHit(range, bot.stats, m.def, level, rng);
  const from = { x: body.x + body.facing * 10, y: body.y - 26 };
  const travel = st.shot ? Math.hypot(m.x - from.x, m.y - from.y) / 600 : 0.12;
  world.pending.push({ at: world.now + travel, mob: m, miss, damage: roll?.damage ?? 0, crit: roll?.crit ?? false, fromX: body.x, stack: 0, party: bot.id });
  if (st.shot) world.fx.push({ kind: 'projectile', shot: st.shot, x: from.x, y: from.y, tx: m.x, ty: m.y - m.def.h / 2, t: 0, dur: Math.max(0.08, travel) });
  else world.fx.push({ kind: 'swing', x: body.x, y: body.y, dir: body.facing, t: 0, dur: 0.3 });
  bot.attack = { pose: st.pose, t: 0, dur: 0.45 };
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
  members.forEach((bot, i) => {
    bot.slot = i;
    // Following you to a new map: they arrive right behind you.
    if (bot.map !== map.id || !bot.body) {
      bot.map = map.id;
      bot.body = createBody(b.x - b.facing * FOLLOW_GAP * (i + 1), b.y);
      bot.body.onGround = b.onGround;
      bot.appear = 1;
    }
    // Time to go: say goodbye and log off.
    if (bot.session <= 0) {
      dismiss(bots, bot, world);
      world.log(`${bot.name} left the party.`, '#d4cbe8');
      return;
    }
    const body = bot.body;
    // Lost or stuck: catch up with a little shimmer, as if they'd taken a shortcut.
    const far = Math.abs(body.x - b.x) > 460 || Math.abs(body.y - b.y) > 200;
    bot.stuck = far ? bot.stuck + dt : Math.max(0, bot.stuck - dt);
    if (bot.stuck > 3 || (b.rope == null && Math.abs(body.y - b.y) > 40 && Math.abs(body.x - b.x) < 30 && (bot.lowFor = (bot.lowFor ?? 0) + dt) > 5)) {
      Object.assign(body, { x: b.x - b.facing * FOLLOW_GAP * (i + 1), y: b.y, vx: 0, vy: 0, rope: null, onGround: b.onGround, surface: b.surface });
      bot.stuck = 0;
      bot.lowFor = 0;
      bot.appear = 1;
    }
    if (Math.abs(body.y - b.y) <= 40) bot.lowFor = 0;
    // Fight what's around you; otherwise stay close.
    const m = map.isTown ? null : targetFor(bot, world);
    const st = styleOf(bot);
    let tx = b.x - b.facing * FOLLOW_GAP * (i + 1) + (i % 2 ? 8 : -4);
    let ty = b.y;
    if (m) {
      tx = m.x - Math.sign(m.x - body.x || 1) * Math.min(st.reach * 0.8, 60 + i * 12);
      ty = m.y;
    }
    const close = Math.abs(tx - body.x) < 8 && Math.abs(ty - body.y) < 12;
    const intent = close ? { left: false, right: false, up: false, down: false, jump: false } : steer(bot, map, tx, ty);
    stepBody(body, map, intent, dt, { speed: Math.min(130, bot.stats.speed + 8), jump: 100 });
    if (m && Math.abs(m.x - body.x) <= st.reach && Math.abs(m.y - body.y) < 50 && body.onGround) {
      body.facing = m.x < body.x ? -1 : 1;
      bot.cooldown -= dt;
      if (bot.cooldown <= 0) {
        strike(bot, m, world, rng);
        bot.cooldown = between(0.9, 1.4, rng);
      }
    } else if (!m && close) {
      body.facing = b.x < body.x ? -1 : 1;
    }
    if (bot.attack && (bot.attack.t += dt) >= bot.attack.dur) bot.attack = null;
    bot.x = body.x;
    if (bot.appear > 0) bot.appear = Math.max(0, bot.appear - dt * 1.5);
    // Party chat.
    bot.nextLine -= dt;
    if (bot.nextLine <= 0 && !bot.bubble) {
      bot.nextLine = between(35, 80, rng) * Math.max(1, members.length / 2);
      const line = speak(bots.memory, 'party', { player: world.char.name, level: bot.level }, bot.style, rng);
      if (line) {
        say(bot, line);
        world.log(`[Party] ${bot.name}: ${line}`, '#9fe0b0');
      }
    }
  });
}
