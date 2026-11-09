// Parties: invite other players (right-click them), and those around your level or below can
// join. Party members come along from map to map. In town they hang around near you; out in
// the field each one goes off hunting on their own, finding their way over ledges and ropes to
// monsters anywhere on the map (their kills give you a share of the EXP, count for your quests,
// and drop loot for you). They chat and level up alongside you, until you leave the party (or
// they log off).

import { botRide } from './botride.js';
import { createBody, stepBody, groundAt, knockBack } from './physics.js';
import { computeStats } from '../core/stats.js';
import { gainExp, autoAssignAp } from '../core/character.js';
import { physicalRange, magicRange, accuracy, hitChance, rollHit, mobHitChance, avoid, damageTaken } from '../core/formulas.js';
import { mobBox } from './mobs.js';
import { JOBS, jobChain } from '../data/jobs.js';
import { ITEMS } from '../data/items.js';
import { WEAPON_TYPES } from '../core/formulas.js';
import { speak, contextOf } from './chatter.js';
import { botChat, sayOver } from './chatlog.js';
import { navOf, findPath, followPath, surfaceBelow, surfaceOf } from './nav.js';
import { roleThink, healerTurn, jumpNow } from './dungeon.js';
import { COMBOS, PATH_VARIANTS, AFTER, planCombo, pathOf, botProcs } from './melee.js';
import { pickTargets } from './combat.js';
import { SKILLS } from '../data/skills.js';
import { pathParams } from '../data/path-skills.js';
import { inZone } from './story.js';
import { helpGoal, tickHelpers, tickBotBuffs } from './coop-life.js';
import { packAt, chooseSkill, commandFor, beginStep, airborne, evade, focusOf, catchable, standBy, drink, tickCallouts, callFinisher, callout, holdFire } from './botfight.js';
import { coopAfterThink } from './coop.js';
import { crewGoal } from './botsoul.js';

export const PARTY_MAX = 5; // members besides you
export const LEVEL_GAP = 5; // they can be at most this many levels above you
const FOLLOW_GAP = 26;

const between = (a, b, rng) => a + rng() * (b - a);

export function partyMembers(bots) {
  return bots ? bots.list.filter((b) => b.party) : [];
}

// Everything they say goes through the chat gate (world/chatlog.js): no line twice in ten minutes.
// `important` for answers to something you did (skips their own half-minute wait).
function say(world, bot, text, important = false) {
  if (text) sayOver(world, bot, text, { important });
}

// Asks to come hunt (a friend, a pal, a group on the map) share one pace: at most one every few
// minutes, and longer after you turn one down, so they stay a moment rather than a stream.
const ASK_GAP = 300;
const ASK_GAP_DECLINED = 600;

export function mayAskAlong(bots, world) {
  return !bots.huntAsk && world.now >= (bots.askAgainAt ?? 0);
}

// An ask just went out (`bot` asked you along for the next minute).
export function askAlong(bots, world, bot) {
  bots.huntAsk = { bot, until: world.now + 60 };
  bots.askAgainAt = world.now + ASK_GAP;
}

// You said no (or let it lapse): the next ask waits longer.
export function askDeclined(bots, world) {
  bots.askAgainAt = Math.max(bots.askAgainAt ?? 0, world.now + ASK_GAP_DECLINED);
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
  // The party may have filled up while they were thinking it over.
  if (partyMembers(bots).length >= PARTY_MAX) {
    say(world, bot, 'aw party full', true);
    world.log(`${bot.name} couldn't join: your party is full.`, '#ffb3c6');
    return;
  }
  joinParty(bots, bot, world);
  say(world, bot, speak(bots.memory, 'joined', ctx, bot.style, rng), true);
  world.log(`${bot.name} joined your party!`, '#bff0dc');
}

export function joinParty(bots, bot, world) {
  const b = world.body;
  bot.party = true;
  bot.shop = null;
  // (A player out hunting this map joins from right where they are.)
  bot.hunter = false;
  bot.leaving = null;
  bot.state = 'party';
  bot.map = world.map.id;
  // They stay as long as you keep them.
  bot.session = Infinity;
  bot.body = bot.body && bot.map === world.map.id ? bot.body : createBody(bot.x, groundAt(world.map, bot.x));
  bot.stats = computeStats(bot.char);
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
  if (!quiet) say(world, bot, speak(bots.memory, 'leaving', { player: world.char.name }, bot.style, bots.rng));
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
  say(world, bot, 'aw ok', true);
  world.log(`${bot.name} was removed from the party.`, '#d4cbe8');
}

// ---------- Playstyles ----------
// Every member plays their own way, from their class and a roll of personality:
//   Rusher    goes for packs, fast swings, big spin moves
//   Guardian  steady and tough, picks off monsters closer to you
//   Sniper    fights from range, shooting up and down ledges
//   Healer    heals you from anywhere on the map, chips in with spells
// Each also has its own reaction speed, rhythm, walking pace, and idle habits.

export const PLAYSTYLES = {
  rusher: { label: 'Rusher', color: '#ff7a6b' },
  guardian: { label: 'Guardian', color: '#5aa8ff' },
  sniper: { label: 'Sniper', color: '#3fc48a' },
  healer: { label: 'Healer', color: '#f0b53a' },
};

function weaponStyle(bot) {
  const type = bot.stats.weaponType;
  // Archers shoot their own way: an Archer's gold arrows, a Beastmaster's wild arrows, a Stormcaller's
  // heavy bolts.
  if (bot.char.job === 'beastmaster') return { reach: 200, lift: 100, pose: pick2(['ptflourish', 'ptswirl', 'ptcard', 'ptlean']), shot: 'ptarrow', ranged: true };
  if (bot.char.job === 'stormcaller') return { reach: 220, lift: 100, pose: pick2(['aesnap', 'aedouble', 'aebrace']), shot: 'aebolt', ranged: true };
  if (bot.char.job === 'archer') return { reach: 200, lift: 100, pose: pick2(['acskip', 'acflip', 'acroll', 'acspin']), shot: 'acarrow', ranged: true };
  // The Sky Dancer throws her gusts of wind.
  if (bot.char.job === 'kitsune') return { reach: 190, lift: 100, pose: pick2(['sdpalm', 'sdscissor', 'sdflutter']), shot: 'skygust', ranged: true };
  if (WEAPON_TYPES[type]?.ranged) return { reach: 190, lift: 100, pose: type === 'gauntlet' ? 'throw' : 'draw', shot: type === 'gauntlet' ? 'star' : 'arrow', ranged: true };
  return { reach: 42, lift: 30, pose: type === 'spear' ? 'thrust' : pick2(['slash', 'slash2']), shot: null, ranged: false };
}
function pick2(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function makeAI(bot, rng, kind = null) {
  const st = weaponStyle(bot);
  const family = JOBS[bot.char.job].family;
  kind ??= st.ranged ? 'sniper'
    : bot.char.job === 'paladin' ? (rng() < 0.8 ? 'guardian' : 'rusher')
    : bot.char.job === 'berserker' ? 'rusher'
    : rng() < 0.55 ? 'rusher' : 'guardian';
  const base = {
    rusher: { keep: 0.6, react: [0.12, 0.25], rhythm: [0.6, 0.95], special: 0.22, habits: ['roar', 'cheer'] },
    guardian: { keep: 0.7, react: [0.15, 0.3], rhythm: [0.9, 1.3], special: 0.12, habits: ['guard', 'roar'] },
    sniper: { keep: 0.85, react: [0.18, 0.35], rhythm: [0.95, 1.35], special: 0.15, habits: ['aimshot', 'cheer'] },
    healer: { keep: 0.9, react: [0.2, 0.4], rhythm: [1.2, 1.8], special: 0.1, habits: ['pray', 'cheer'] },
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

// A monster they've stood by for UNREACH_SECS without being able to hit it (a flyer hovering out
// of reach over them, one up a cliff they can't climb) is given up on, and left be for
// UNREACH_SKIP seconds, so they go hunt something else instead of staring up at it.
const UNREACH_SECS = 3;
const UNREACH_SKIP = 15;
function giveUpOutOfReach(bot, world, m, canHit, dt, giveUp) {
  const br = bot.brain;
  const body = bot.body;
  if (br.outOfReach) br.outOfReach = br.outOfReach.filter((o) => world.now < o.until && o.mob.hp > 0);
  if (!m || m.hp <= 0 || canHit || world.map.isTown || world.dungeon || !body.onGround || (br.stopped ?? 0) < 0.4) {
    if (!m || canHit || br.unreach?.mob !== m) br.unreach = null;
    return;
  }
  if (br.unreach?.mob !== m) br.unreach = { mob: m, t: 0 };
  br.unreach.t += dt;
  if (br.unreach.t < UNREACH_SECS) return;
  (br.outOfReach ??= []).push({ mob: m, until: world.now + UNREACH_SKIP });
  br.unreach = null;
  br.target = null;
  br.fightOn = null;
  br.goal = giveUp ?? null;
  br.path = null;
  br.think = Math.min(br.think ?? 0, 0.2);
}

// ---------- In the field: hunting on their own ----------

// The monster a member hunts: one near them that no partymate is already on, anywhere on the
// map. They stick with it until it's dead (or turns out to be out of reach), so they don't flip
// between two. Guardians lean toward monsters near you, rushers toward packs.
const helping = (bot, world) => Boolean(bot.helping && world.now < bot.helping);

function huntTarget(bot, world, members) {
  const br = bot.brain;
  const body = bot.body;
  const skip = (m) => (br.skip?.mob === m && world.now < br.skip.until) || br.outOfReach?.some((o) => o.mob === m && world.now < o.until);
  const cur = br.target;
  // Called to a "Here!" marker: they head there first, and fight once they've arrived.
  const spot = bot.pingSpot && world.now < bot.pingSpot.until ? bot.pingSpot : null;
  if (spot && body && (Math.abs(body.x - spot.x) > 60 || Math.abs(body.y - spot.y) > 40)) return null;
  if (spot) bot.pingSpot = null;
  // In your party: a monster thrown up nearby to catch, then whatever you're fighting (or pinged).
  if (bot.party) {
    const up = catchable(bot, world);
    if (up) return up;
    const f = focusOf(world);
    if (f && !skip(f) && Math.abs(f.x - body.x) < 520 && Math.abs(f.y - body.y) < 200) return f;
  }
  if (cur && cur.hp > 0 && world.mobs.includes(cur) && !skip(cur) && !(helping(bot, world) && !br.rescuing)) return cur;
  br.rescuing = helping(bot, world);
  let best = null;
  let bestScore = Infinity;
  const you = world.body;
  // You're in trouble: whoever came to help (and your party) go for the monsters around you.
  const rescue = helping(bot, world) || (bot.party && !world.dungeon && world.char.hp < world.stats.maxHp * 0.3);
  for (const m of world.mobs) {
    if (m.hp <= 0 || skip(m)) continue;
    // Players out hunting on their own (not in your party) leave the monsters by you alone, so
    // nobody steals your kills; a queen back for a rematch draws them all in.
    if (!bot.party && !rescue && !m.def.boss && Math.abs(m.x - you.x) < 170 && Math.abs(m.y - you.y) < 90) continue;
    let score = Math.abs(m.x - body.x) + Math.abs(m.y - body.y) * 3;
    if (rescue) score = (Math.abs(m.x - you.x) + Math.abs(m.y - you.y) * 3) * 2 + score * 0.2;
    if (!bot.party && m.def.boss) score -= 600;
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
  // Someone in the party is down: whoever's helping goes and stands by them.
  const by = bot.party ? standBy(bot, world, members, rng) : null;
  if (by) {
    const s = surfaceBelow(nav, by.x, by.y - 4);
    if (s >= 0) {
      br.target = null;
      br.goal = { x: by.x, y: nav.surfaces[s].yAt(by.x), mode: 'follow', surface: s };
      return;
    }
  }
  // (Out with a group of their own, they keep near its leader: world/botsoul.js.)
  const stay = bot.hunter && !helping(bot, world) ? crewGoal(bot, world, rng) : null;
  if (stay) {
    br.target = null;
    br.goal = stay;
    return;
  }
  const target = huntTarget(bot, world, members);
  br.target = target;
  // Come to help with nothing to fight by you: they run over to you.
  if (!target && helping(bot, world) && !bot.gave) {
    // (A "Here!" ping calls them to the marker, not to wherever you've gone since.)
    const spot = bot.pingSpot && world.now < bot.pingSpot.until ? bot.pingSpot : null;
    const you = spot ? { x: spot.x, y: spot.y } : world.body;
    const s = spot ? surfaceBelow(nav, spot.x, spot.y - 4) : surfaceOf(nav, you);
    if (s >= 0) {
      const x = you.x + (Math.sign(body.x - you.x) || 1) * 30;
      br.goal = { x, y: you.y, mode: 'fight', surface: s };
      return;
    }
  }
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
    // The goal's height is the ground's height right there: on a slope, a piece's `y` is only its
    // highest point, and a goal that looks higher than it is sends them jumping onto ledges.
    const gx = Math.max(surf.x1 + 8, Math.min(surf.x2 - 8, x));
    br.goal = { x: gx, y: surf.yAt(gx), mode: 'fight', surface: s };
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
  const near = bot.hunter ? crewGoal(bot, world, rng, { wander: true }) : null;
  if (near) {
    br.goal = near;
    br.wanderUntil = world.now + between(3, 6, rng);
    return;
  }
  const s = Math.floor(rng() * nav.surfaces.length);
  const surf = nav.surfaces[s];
  const x = between(Math.max(24, surf.x1 + 12), Math.min(world.map.width - 24, surf.x2 - 12), rng);
  br.goal = { x, y: surf.yAt(x), mode: 'wander', surface: s };
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
  if (!body.rope) br.climbOff = 0;
  // On a rope with no way planned (a goal dropped or a path cleared mid-climb, or one that can't
  // be planned from a rope): finish the climb to a ledge, toward the goal when there is one, or
  // the nearer end, and plan again from there, rather than hang on the rope.
  const climbOff = () => {
    const r = body.rope;
    if (!r) return none;
    if (!br.climbOff) br.climbOff = g && g.y != null && Math.abs(g.y - body.y) > 8 ? Math.sign(g.y - body.y) : body.y - r.top < r.bottom - body.y ? -1 : 1;
    return { ...none, up: br.climbOff < 0, down: br.climbOff > 0 };
  };
  if (!g || g.surface < 0) return climbOff();
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
      return climbOff();
    }
  }
  if (!br.path) return climbOff();
  // On the goal's ledge: the usual calm approach (stop near it, keep apart from partymates),
  // walking only: the path finder already brought them to the right surface, so a goal that
  // looks a little higher (a slope) is no reason to jump or drop.
  if (!br.path.length && here === g.surface) return steerTo(bot, world, members, true);
  br.settled = false;
  const { intent, lost } = followPath(nav, body, br.path, g.x);
  if (lost) br.path = null;
  return intent;
}

// ---------- In town: hanging around near you ----------

// Decides where to be. Runs every few tenths of a second (each member's own reaction time), not
// every frame, which keeps movement calm.
function think(bot, world, members, rng) {
  // Off to stand by a fallen partymate and get them up (world/teamwork.js).
  if (bot.reviveGoal) {
    bot.brain.target = null;
    bot.brain.goal = bot.reviveGoal;
    return;
  }
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
  // They settle into their spot by you, with a little drift.
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
// goal has moved well away (no jitter), and keep a little space from each other. `level`: they're
// on the goal's surface already, so only walk along it.
function steerTo(bot, world, members, level = false) {
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
  const dy = level ? 0 : g.y - body.y;
  const startAt = g.mode === 'fight' ? 10 : 22;
  if (br.settled && Math.abs(dx) < startAt && Math.abs(dy) < 12) return { left: false, right: false, up: false, down: false, jump: false };
  br.settled = Math.abs(dx) < 6 && Math.abs(dy) < 12;
  if (br.settled) return { left: false, right: false, up: false, down: false, jump: false };
  const intent = steer(bot, world.map, tx, level ? body.y : g.y);
  // No twitchy turnarounds: a small correction the other way (or any in mid-air) waits until
  // they've come to a stop.
  const back = (intent.left && body.vx > 20) || (intent.right && body.vx < -20);
  if (back && (Math.abs(dx) < 16 || !body.onGround) && !body.rope) {
    intent.left = false;
    intent.right = false;
  }
  return intent;
}

// ---------- Fighting the way you do ----------
// Members (and other players hunting here) fight with their job's own basic combo: the pool of
// swings or shots at each step (world/melee.js PATH_VARIANTS), a fresh string each time, its steps
// chained back to back with the same beats as yours and every blow landing on its frame. Between
// strings they now and then throw one of their job's attack skills, and the hits they land fill
// their gauge until they can let loose their job's big finisher, which spends it all.

const GAUGE_FULL = 100;
const GAUGE_PER_HIT = 3;
// A string left alone this long starts over from its opener.
const COMBO_RESET = 1.2;
// Parts of a skill a bot can't play (buffs, heals, lasting spells): a skill with any is left out.
const EXOTIC = ['grant', 'lantern', 'song', 'revive', 'concert', 'well', 'align', 'grand', 'heal', 'sky', 'provoke', 'rain'];
const plain = (s) => !EXOTIC.some((k) => s[k] != null);
const CUT_TINT = { holy: ['#ffe9a0', '#ffd24f'], rage: ['#c0102e', '#ff4a1f'] };

function poolOf(bot) {
  const path = pathOf({ char: bot.char, stats: bot.stats });
  if (PATH_VARIANTS[path]) return PATH_VARIANTS[path];
  return (COMBOS[bot.stats.weaponType] ?? COMBOS.none).map((s) => [s]);
}

// Their job's attack skills at a level that fits theirs: [{ id, steps, full, tune }]. Skills that
// work their own way are played by SPECIALS below.
export function botSkills(char) {
  const chain = jobChain(char.job);
  const out = [];
  for (const s of Object.values(SKILLS)) {
    if (!chain.includes(s.job)) continue;
    const lv = Math.max(1, Math.min(s.maxLevel, Math.round(s.maxLevel * Math.min(1, (char.level - 8) / 40))));
    if (SPECIALS[s.id]) {
      const params = s.at(lv, s.maxLevel);
      const sp = SPECIALS[s.id];
      out.push({ id: s.id, steps: [{ move: params.paths?.[char.job]?.[0]?.move ?? sp.move, dur: sp.dur, strikes: [], special: s.id, params }], full: Boolean(s.fullGauge), tune: s.dmg ?? 1, rank: chain.indexOf(s.job), heal: sp.heal });
      continue;
    }
    if (s.type !== 'attack') continue;
    // (Each path plays a skill its own way: a Paladin's Shield Rush for the Shoulder Charge.)
    const at = s.at(lv, s.maxLevel);
    const combo = pathParams(at, char.job).combo;
    if (!combo || !combo.every((st) => st.strikes.every(plain))) continue;
    if (!combo.some((st) => st.strikes.some((k) => k.pct > 0 && (k.reach > 0 || k.shot)))) continue;
    out.push({ id: s.id, steps: combo, full: Boolean(s.fullGauge), tune: s.dmg ?? 1, rank: chain.indexOf(s.job), charge: Boolean(s.movement) });
  }
  // Their finisher is their own path's (a Paladin's Grand Verdict, not the Warrior's Titan Breaker).
  const top = Math.max(-1, ...out.filter((s) => s.full).map((s) => s.rank));
  return out.filter((s) => !s.full || s.rank === top);
}

// The next move of the fight: a step of the string they're on, or a skill (or their finisher)
// between strings.
function nextMove(bot, world, m, rng) {
  const f = bot.fight;
  if (f.queue.length) return f.queue.shift();
  if (f.step === 0) {
    // (A blessing only when someone needs one.) Otherwise the skill that fits: world/botfight.js.
    const heals = f.skills.filter((s) => s.heal && !s.full);
    const hurt = bot.hp != null && bot.hp < bot.stats.maxHp * 0.6;
    const sk = hurt && heals.length && rng() < 0.6 ? heals[Math.floor(rng() * heals.length)] : chooseSkill(bot, world, m, f.gauge >= GAUGE_FULL, rng);
    if (sk) {
      if (sk.full) {
        f.gauge = 0;
        callFinisher(bot, world, sk, m);
      }
      const steps = sk.steps.map((st, i) => ({ ...st, kind: sk.full ? 'finisher' : st.dur >= 1 ? 'heavy' : 'skill', tune: sk.tune, last: i === sk.steps.length - 1 }));
      f.queue = steps.slice(1);
      return steps[0];
    }
    // A command move: the launcher and an air combo, a catch, a dash out of a run.
    const cmd = commandFor(bot, world, m, rng);
    if (cmd) {
      f.queue = cmd.slice(1);
      if (cmd[0].hop && cmd[0].dur < 0.2) callout(world, bot, 'catch');
      return cmd[0];
    }
    // (A weapon's plain combo has no choices to vary.)
    f.plan = f.pool.some((v) => v.length > 1) ? planCombo(f.pool, f.last, rng) : f.pool.map(() => 0);
    f.last = f.plan;
  }
  const step = f.pool[f.step][f.plan[f.step]];
  f.step = (f.step + 1) % f.pool.length;
  return { ...step, kind: step.finisher ? 'basicFinisher' : 'chain', last: Boolean(step.finisher) };
}

// Fights `m` while it's in reach: one move after another, as fast as the moves themselves allow.
function fight(bot, m, world, intent, rng) {
  const body = bot.body;
  const f = (bot.fight ??= { pool: poolOf(bot), skills: botSkills(bot.char), plan: null, last: null, step: 0, queue: [], readyAt: 0, gauge: 0, lastAt: -9 });
  if (world.now - f.lastAt > COMBO_RESET) {
    f.step = 0;
    f.queue = [];
  }
  const toward = m.x < body.x ? -1 : 1;
  if (!intent.left && !intent.right) body.facing = toward;
  if (world.now < f.readyAt || body.facing !== toward) return;
  // Air steps whose moment has passed (they came down, or never got up) are dropped.
  if (f.queue[0]?.air && body.onGround && !bot.hop) f.queue = f.queue.filter((s) => !s.air);
  const step = nextMove(bot, world, m, rng);
  if (step.air && body.onGround && !bot.hop) return;
  beginStep(bot, world, step);
  if (step.special) {
    SPECIALS[step.special].play(bot, world, m, rng, step.params, step.tune * (f.boost ?? 1));
    f.boost = null;
    f.readyAt = world.now + step.dur + (AFTER[step.kind] ?? AFTER.skill);
    f.lastAt = f.readyAt;
    bot.attack = { pose: step.move, t: 0, dur: step.dur, fighting: true };
    return;
  }
  if (f.boost && step.kind === 'finisher') {
    step.tune = (step.tune ?? 1) * f.boost;
    f.boost = null;
  }
  // A basic swing or shot sets off their job's procs, as yours do.
  const basic = step.kind === 'chain' || step.kind === 'basicFinisher';
  const lead = basic ? step.strikes.find((k) => k.pct > 0) : null;
  const procs = lead ? botProcs(bot.char, bot.stats.weaponType, lead, step.kind === 'basicFinisher', packAt(world, m), rng) : null;
  if (procs?.shot && procs.shot !== lead) {
    const shot = procs.shot.blast ? { ...procs.shot, pierce: true, targets: Math.max(3, procs.shot.targets ?? 1) } : procs.shot;
    step.strikes = step.strikes.map((k) => (k === lead ? shot : k));
  }
  play(bot, step, m, world, rng);
  if (procs?.strikes?.length) play(bot, { dur: step.dur, strikes: procs.strikes.map((k) => ({ ...k, at: lead.at ?? 0.4, delay: k.due })) }, m, world, rng);
  if (procs?.step && !f.queue.length) f.queue.unshift({ ...procs.step, kind: 'skill', last: true });
  // Stepping in (or hopping back) carries them along until the first blow, like you.
  const first = (step.carry ?? step.strikes[0]?.at ?? 0.4) * step.dur;
  if (step.step) bot.lunge = { v: (body.facing * step.step) / Math.max(0.05, first), until: world.now + first };
  // The beat after it: a chained step flows on; a finisher, a skill, or the end of a string
  // takes a breath (longer for a calmer player).
  const breath = step.last ? between(bot.ai.rhythm[0], bot.ai.rhythm[1], rng) * 0.2 : 0;
  f.readyAt = world.now + step.dur + (AFTER[step.kind] ?? AFTER.chain) + breath;
  f.lastAt = f.readyAt;
  bot.attack = { pose: step.move, t: 0, dur: step.dur, fighting: true };
}

// Plays one step: each of its blows lands on its own frame, on what it reaches.
function play(bot, step, m, world, rng) {
  const body = bot.body;
  const dir = body.facing;
  const path = pathOf({ char: bot.char, stats: bot.stats });
  const school = path === 'paladin' ? 'holy' : path === 'berserker' ? 'rage' : null;
  const reachable = (look, box, n) => pickTargets(world.mobs.filter((mob) => fair(bot, world, mob)), look, box, n);
  for (const s of step.strikes) {
    const lag = s.at * step.dur + (s.delay ?? 0);
    const sdir = s.turn ? -dir : dir;
    const look = { ...body, facing: sdir };
    if (s.burst) world.fx.push({ kind: s.burst, x: body.x + sdir * (s.reach || 60) * (s.burstAt ?? (s.around ? 0.3 : 0.45)), y: body.y, r: s.reach || 60, dir: sdir, t: -lag, dur: (s.burstDur ?? 0.7) + lag, seed: rng() });
    if (!(s.pct > 0)) continue;
    const pct = s.pct * (step.tune ?? 1);
    const range = s.magic ? magicRange(bot.stats, pct * 1.3) : physicalRange(bot.stats, bot.stats.weaponType, pct);
    const hit = (mob, at, i) => land(bot, world, mob, at, range, { stack: i, knock: s.knock, launch: s.launch, big: s.big, bleed: s.bleed, burn: s.burn, stun: s.stun, via: s.shot ? 'shot' : s.magic ? 'spell' : 'blade' }, rng);
    if (s.shot) {
      // Shots leave on the release frame and hit when they get there; a fan spreads over a few.
      const from = { x: body.x + sdir * 10, y: body.y - 16 + (s.oy ?? 0) };
      const n = s.fan ?? 1;
      const near = reachable(look, { w: s.range ?? 280, h: s.h ?? 60 }, Math.max(n, s.targets ?? 1));
      const aims = near.length ? near : [m];
      for (let i = 0; i < n; i++) {
        const mob = aims[i % aims.length];
        const travel = Math.hypot(mob.x - from.x, mob.y - from.y) / (s.speed ?? 620);
        hit(mob, lag + travel, i);
        world.fx.push({ kind: 'projectile', shot: s.shot, x: from.x, y: from.y, tx: mob.x, ty: mob.y - mob.def.h / 2 + (i - (n - 1) / 2) * 6, t: -lag, dur: lag + Math.max(0.08, travel) });
      }
      // A piercing shot carries on through the line behind its mark.
      if (s.pierce) aims.slice(n).forEach((mob, i) => hit(mob, lag + Math.abs(mob.x - from.x) / (s.speed ?? 620), n + i));
      continue;
    }
    const box = s.around ? { w: s.reach * 2, h: s.h, around: true } : { w: s.reach, h: s.h };
    const targets = reachable(look, box, s.targets ?? 1);
    if (!targets.length && Math.abs(m.x - body.x) <= s.reach + m.def.w / 2) targets.push(m);
    targets.forEach((mob, i) => hit(mob, lag, i));
    const cy = body.y - 25;
    if (s.arc) world.fx.push({ kind: 'arc', path: school, x: body.x + sdir * (s.around ? 0 : 10), y: cy, dir: sdir, r: s.around ? s.reach * 0.8 : s.reach * 0.52, start: s.arc[0], sweep: s.arc[1], thick: s.thick ?? 7, big: s.big, flat: s.around, color: CUT_TINT[school]?.[s.big ? 1 : 0] ?? (s.big ? '#ffb347' : '#8fb8ff'), t: -lag, dur: (s.big ? 0.32 : 0.24) + lag });
    if (s.pierce && !s.arc) world.fx.push({ kind: 'pierce', school, x: body.x, y: body.y, dir: sdir, box: { x: sdir > 0 ? body.x - 6 : body.x + 6 - s.reach, y: cy - 10, w: s.reach, h: 20 }, t: -lag, dur: (s.big ? 0.35 : 0.25) + lag });
    if (s.crack) world.fx.push({ kind: 'crack', school, x: body.x + sdir * s.reach * 0.55, y: body.y, w: s.around ? s.reach * 2 : s.reach * 1.4, t: -lag, dur: 0.7 + lag, seed: rng() });
  }
}

// One blow of theirs landing on `mob` after `delay`: hit or miss, and their gauge filling.
// (Their blows don't stop your world or shake your screen; that's for your own.)
function land(bot, world, mob, delay, range, fields, rng) {
  const level = bot.char.level;
  const miss = rng() >= hitChance(accuracy(JOBS[bot.char.job].family, bot.stats, level), level, mob.def);
  const roll = miss ? null : rollHit(range, bot.stats, mob.def, level, rng);
  if (!miss && bot.fight) bot.fight.gauge = Math.min(GAUGE_FULL, bot.fight.gauge + GAUGE_PER_HIT);
  world.pending.push({ at: world.now + delay, mob, miss, damage: roll?.damage ?? 0, crit: roll?.crit ?? false, fromX: bot.body.x, stack: 0, party: bot.id, stranger: !bot.party, ...fields });
}

// Players hunting on their own never catch the monsters by you (unless they came to help).
function fair(bot, world, mob) {
  const you = world.body;
  return bot.party || helping(bot, world) || mob.def.boss || Math.abs(mob.x - you.x) >= 170 || Math.abs(mob.y - you.y) >= 90;
}

const SPECIALS = {
  // Grand Somersault: a huge leap, a ring of gold bursting at the top, and golden arrows raining on
  // every monster round her.
  cometarrow: {
    move: 'acsomersault', dur: 1.9,
    play: (bot, world, m, rng, P, tune) => {
      const S = P.combo[0].strikes.find((s) => s.rain);
      const b = bot.body;
      world.fx.push({ kind: 'acburst', x: b.x, y: b.y, t: -1.1, dur: 0.8 });
      const range = physicalRange(bot.stats, bot.stats.weaponType, S.pct * tune);
      world.mobs.filter((o) => o.hp > 0 && fair(bot, world, o) && Math.abs(o.x - b.x) < S.rainW / 2 && Math.abs(o.y - b.y) < 120)
        .forEach((o, i) => {
          world.fx.push({ kind: 'rain', variant: 'acarrow', school: 'acro', x: o.x, y: o.y, h: o.def.h, t: -1.2 - i * 0.05, dur: 0.45, seed: i });
          land(bot, world, o, 1.4 + i * 0.05, range, { stack: i, knock: 60, launch: 140, big: !i, burst: 'achit', via: 'shot' }, rng);
        });
    },
  },
  // Grand Illusion: she vanishes in smoke and every monster round her takes a copy's arrow.
  stampede: {
    move: 'ptillusion', dur: 2.4,
    play: (bot, world, m, rng, P, tune) => {
      const G = P.combo[0].strikes[0].grand;
      const b = bot.body;
      world.fx.push({ kind: 'ptillusion', x: b.x, y: b.y, t: 0, dur: G.hide + 0.4 });
      const range = physicalRange(bot.stats, bot.stats.weaponType, G.pct * tune);
      world.mobs.filter((o) => o.hp > 0 && fair(bot, world, o) && Math.abs(o.x - b.x) < G.r + 80 && Math.abs(o.y - b.y) < 160)
        .forEach((o, i) => land(bot, world, o, G.at + 0.2 + i * 0.03, range, { stack: i, knock: 200, launch: 160, stun: 0.3, big: !i, burst: 'pthit', via: 'shot' }, rng));
    },
  },
};

// ---------- Raids: a queen's moves ----------
// Her moves are drawn on the ground a moment before they land (world/story.js). Most players see
// them coming and step out or jump (most of the time); whoever's standing in one when it goes
// off takes the hit.

function dodge(bot, world, intent, rng) {
  const body = bot.body;
  if (bot.dodge && world.now < bot.dodge.until) {
    Object.assign(intent, bot.dodge.intent);
    return;
  }
  bot.dodge = null;
  for (const z of world.zones ?? []) {
    if (z.hit || z.t < z.warn - 0.6 || !inZone(world, z, body)) continue;
    bot.dodged ??= new WeakSet();
    if (bot.dodged.has(z)) continue;
    bot.dodged.add(z);
    if (rng() > 0.8) continue;
    const away = Math.sign(body.x - (z.kind === 'lane' ? z.x + z.w / 2 : z.x)) || 1;
    const jump = z.kind === 'lane' && z.low;
    bot.dodge = { until: world.now + (jump ? 0.25 : 0.7), intent: { left: !jump && away < 0, right: !jump && away > 0, jump, up: false, down: false } };
    Object.assign(intent, bot.dodge.intent);
    return;
  }
}

// Something big (a queen's move) hitting a member out in the field.
export function hurtBot(bot, world, raw, fromX, rng = Math.random, by = null) {
  if (bot.down || !bot.body || !bot.stats) return;
  bot.hp ??= bot.stats.maxHp;
  const dmg = damageTaken(raw, bot.stats.wdef, rng);
  bot.hp = Math.max(0, bot.hp - dmg);
  bot.hurt = 0.3;
  bot.lunge = null;
  knockBack(bot.body, fromX);
  world.numbers.push({ x: bot.body.x, y: bot.body.y - bot.body.h - 6, text: `${dmg}`, color: '#ff8fa8', t: 0, small: true });
  if (bot.hp <= 0) fall(bot, world, rng, by);
}

// A party combo: you let your finisher loose, and the members fighting by you join in with theirs.
export function joinCombo(bot, world, delay) {
  const f = bot.fight;
  if (!f) return false;
  f.gauge = GAUGE_FULL;
  f.step = 0;
  f.queue = [];
  f.readyAt = world.now + delay;
  f.lastAt = world.now;
  f.boost = 1.25;
  return true;
}

// Moves a member along a step they're carried through, kept on their ledge (unless they slipped,
// in which case off they go, and they'll say so when they land).
function carry(bot, world, dt, rng) {
  const body = bot.body;
  const L = bot.lunge;
  if (!L) return;
  if (world.now >= L.until || bot.down) {
    bot.lunge = null;
    return;
  }
  let x = body.x + L.v * dt;
  const nav = navOf(world.map);
  const s = nav.surfaces[surfaceOf(nav, body)];
  if (s) x = Math.max(s.x1 + 6, Math.min(s.x2 - 6, x));
  body.x = clampX(world.map, x);
}

// ---------- Monsters fight back (out in the field) ----------
// A monster a member hits goes after them (world.js), and touching them hurts as it hurts you.
// They drink a potion when they get low, while they have any; out of them and out of HP, they
// fall, a tombstone drops on them, and a few seconds later they're off back to town (a player
// hunting on their own logs back in a while later, a party member walks back in to you).

const BOT_INVULN = 0.7;
const DOWN_FOR = 4.5;

function takeHits(bot, world, dt, rng) {
  const body = bot.body;
  const max = bot.stats.maxHp;
  bot.hp ??= max;
  bot.potions ??= 1 + Math.floor(rng() * 5);
  if (bot.hurt > 0) bot.hurt = Math.max(0, bot.hurt - dt);
  bot.invuln = Math.max(0, (bot.invuln ?? 0) - dt);
  if (bot.down) return;
  // Resting between fights, they get their HP back slowly.
  if (bot.hp > 0 && !bot.brain?.target) bot.hp = Math.min(max, bot.hp + max * 0.03 * dt);
  if (bot.invuln <= 0) {
    const box = { x: body.x - body.w / 2, y: body.y - body.h, w: body.w, h: body.h };
    const m = world.mobs.find((o) => o.hp > 0 && !(o.frozenUntil > world.now) && touches(box, mobBox(o)));
    if (m) {
      m.attackAt = world.now;
      bot.invuln = BOT_INVULN;
      if (rng() < mobHitChance(m.def.acc, avoid(bot.stats))) {
        const dmg = damageTaken(m.def.atk, bot.stats.wdef, rng);
        bot.hp = Math.max(0, bot.hp - dmg);
        bot.hurt = 0.3;
        bot.lunge = null;
        knockBack(body, m.x);
        bot.hitBy = { def: m.def, at: world.now };
        world.numbers.push({ x: body.x, y: body.y - body.h - 6, text: `${dmg}`, color: '#ff8fa8', t: 0, small: true });
      } else world.numbers.push({ x: body.x, y: body.y - body.h - 6, text: 'MISS', color: '#d4cbe8', t: 0, small: true });
    }
  }
  // A potion when they get low.
  if (bot.hp > 0 && bot.hp < max * 0.35 && world.now >= (bot.potionAt ?? 0) ) {
    bot.potionAt = world.now + 1.5;
    if (bot.potions > 0) {
      bot.potions -= 1;
      const add = Math.round(max * 0.5);
      bot.hp = Math.min(max, bot.hp + add);
      world.fx.push({ kind: 'heal', x: body.x, y: body.y, t: 0, dur: 0.6 });
      world.numbers.push({ x: body.x, y: body.y - body.h - 14, text: `+${add}`, color: '#7ee081', t: 0, small: true });
      if (!bot.potions && !bot.bubble && rng() < 0.6) say(world, bot, pick2(['last pot...', 'out of pots uh oh', 'shouldve bought more pots']));
    } else if (!bot.bubble && rng() < 0.3) say(world, bot, pick2(['no pots!!', 'help', 'im gonna die lol', 'hp hp hp']));
  }
  if (bot.hp <= 0) fall(bot, world, rng, bot.hitBy && world.now - bot.hitBy.at < 3 ? bot.hitBy.def : null);
}

const touches = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// They fall, and say so: about what actually got them (`by`, the monster's def), when they know:
// a field monster by its kind ("that warg"), a boss or queen by her own name ("Tamamo got me").
function fall(bot, world, rng, by = null) {
  bot.down = true;
  bot.tomb = true;
  bot.downAt = world.now;
  bot.attack = null;
  bot.lunge = null;
  bot.brain.target = null;
  const named = by && (by.boss || by.queen || /,/.test(by.name));
  const k = by ? (named ? by.name.split(',')[0] : by.name.toLowerCase()) : null;
  const lines = !by ? ['x_x', 'noooo', 'rip me', 'i died lol', 'how', 'brb dying']
    : named ? [`${k} got me x_x`, `rip me, ${k} wins`, `${k} hits so hard wtf`, `${k}: 1 me: 0`, `how is ${k} this strong`]
    : [`that ${k} hits hard wtf`, `${k} got me x_x`, `rip me, ${k} wins`, `how did the ${k} do that much`, `killed by a ${k} lol`];
  say(world, bot, pick2(lines), true);
  if (bot.party) world.log(`${bot.name} died! They'll be back in a bit.`, '#ff8fa8');
}

// Down in the field: lying there under the tombstone, then off to town after a few seconds.
export const fieldDownOver = (bot, world) => bot.down && bot.tomb && world.now - bot.downAt > DOWN_FOR;

// Healers keep an eye on your HP.
function heal(bot, world, bots) {
  const char = world.char;
  const max = world.stats.maxHp;
  // Themselves first when it's bad, then a partymate in trouble, then you.
  const own = bot.stats.maxHp;
  const mate = partyMembers(bots).find((o) => o !== bot && !o.down && o.body && o.map === world.map.id && o.hp < o.stats.maxHp * 0.5 && Math.abs(o.body.x - bot.body.x) < 400);
  if ((bot.hp < own * 0.5 && char.hp >= max * 0.4) || (mate && char.hp >= max * 0.6)) {
    const who = bot.hp < own * 0.5 ? bot : mate;
    const add = Math.round(who.stats.maxHp * between(0.2, 0.3, bots.rng) + bot.stats.int * 2);
    who.hp = Math.min(who.stats.maxHp, who.hp + add);
    world.fx.push({ kind: 'heal', x: who.body.x, y: who.body.y, t: 0, dur: 0.8 });
    world.numbers.push({ x: who.body.x, y: who.body.y - 52, text: `+${add}`, color: '#7ee081', t: 0, small: true });
    bot.attack = { pose: 'pray', t: 0, dur: 0.7 };
    if (who === bot) callout(world, bot, 'healSelf');
    return true;
  }
  if (char.hp >= max * 0.85 || world.dead) return false;
  if (char.hp < max * 0.5) callout(world, bot, 'heal');
  const amount = Math.round(max * between(0.12, 0.2, bots.rng) + bot.stats.int * 2);
  char.hp = Math.min(max, char.hp + amount);
  world.fx.push({ kind: 'heal', x: world.body.x, y: world.body.y, t: 0, dur: 0.8 });
  world.numbers.push({ x: world.body.x, y: world.body.y - 52, text: `+${amount}`, color: '#7ee081', t: 0 });
  bot.attack = { pose: 'pray', t: 0, dur: 0.7 };
  if (char.hp >= max * 0.5 && bots.rng() < 0.3) say(world, bot, pick2(['heal!', 'healed u', 'careful!', 'got u {emote}'.replace('{emote}', ':)'), 'hp up!']));
  return true;
}

// ---------- Other players hunting the same map ----------
// A player out hunting on their own (world/bots.js keeps a few on the map you're on): the same
// hunting as a party member in the field (finding monsters, paths over ledges and ropes, their
// own weapon and playstyle), but they never take the monsters by you, their kills give you
// nothing, and they don't heal you.
// The brain every other player runs, out hunting on their own, in your party, or in a dungeon
// group: think at their own pace (`o.think` decides where to be and what to fight: hunting the map,
// staying by you in town, or their role in a dungeon run), walk there over ledges and ropes, dodge
// (or hop the Root Slam), fight what they're after with their own moves and skills, and, with
// nothing to do, fall into their idle habits. `o.canThink` and `o.canFight` hold them back (someone
// on the way out), `o.giveUp` is where they head after giving up on a goal, and `o.beforeFight`
// lets a caller drop a target first (a hunter leaves your monsters to you).
function live(bot, world, peers, dt, rng, o) {
  const map = world.map;
  const br = bot.brain;
  const body = bot.body;
  const none = () => ({ left: false, right: false, up: false, down: false, jump: false });
  br.think -= dt;
  if (br.think <= 0 && o.canThink !== false) {
    br.think = between(bot.ai.react[0], bot.ai.react[1], rng);
    o.think();
  }
  o.afterThink?.();
  const busy = bot.attack && ['pray', 'cheer', 'flip', 'roar', 'guard', 'aimshot'].includes(bot.attack.pose) && !bot.attack.fighting;
  const intent = busy ? none() : map.isTown ? steerTo(bot, world, peers) : fieldSteer(bot, world, peers);
  // In a dungeon, hop over the Root Slam; out in the field, out of a queen's way.
  if (world.dungeon && jumpNow(world, body)) intent.jump = true;
  else if (!map.isTown) dodge(bot, world, intent, rng);
  // Out of a heavy blow winding up at them.
  if (!map.isTown) evade(bot, world, intent, rng, world.dungeon?.roles?.[bot.id] ?? null);
  // Walking into something and getting nowhere: plan again, and give up on that monster.
  const pushing = (intent.left || intent.right) && body.onGround;
  br.stall = pushing && Math.abs(body.x - (br.lastX ?? body.x)) < 0.3 ? (br.stall ?? 0) + dt : 0;
  br.lastX = body.x;
  if (br.stall > 1.5) {
    br.path = null;
    if (br.target) br.skip = { mob: br.target, until: world.now + 6 };
    br.target = null;
    br.goal = o.giveUp ?? null;
    br.stall = 0;
  }
  // On a mount when they're getting about, off it to fight or work (world/botride.js).
  const rideK = botRide(bot, world, intent, dt, { fighting: Boolean(br.target) && !map.isTown, busy: Boolean(bot.attack) });
  stepBody(body, map, intent, dt, { speed: Math.min(135, (bot.stats.speed + 8) * bot.ai.speed) * rideK, jump: 100, rider: true });
  carry(bot, world, dt, rng);
  airborne(bot, world);
  br.stopped = body.onGround && Math.abs(body.vx) < 8 ? (br.stopped ?? 0) + dt : 0;
  o.beforeFight?.();
  const m = br.target;
  const st = bot.ai.weapon;
  // (Mid-air in a command move, they keep at it up there.)
  const aloft = !body.onGround && !body.rope && (bot.fight?.queue?.[0]?.air || bot.hop);
  const canHit = m && m.hp > 0 && Math.abs(m.x - body.x) <= st.reach + m.def.w / 2 + (aloft ? 30 : 0) && Math.abs(m.y - body.y) < (aloft ? 170 : Math.max(50, st.lift)) && (body.onGround || aloft);
  giveUpOutOfReach(bot, world, m, canHit, dt, o.giveUp);
  if (o.canFight !== false && canHit) {
    // Turn to it once planted (walking sets their facing), and only swing at what they face.
    fight(bot, m, world, intent, rng);
  } else o.idle?.();
  // Idle habits with nothing to do: a flip, a cheer, a taunt, a little stretch; in town while you
  // stand around, out hunting once they've wandered to a spot, in a dungeon between pulls.
  const calm = map.isTown ? br.still > 3 : world.dungeon ? !world.dungeon.combat && br.settled : br.goal?.mode === 'wander' && br.settled;
  if (!m && body.onGround && !bot.attack && calm) {
    br.habitIn -= dt;
    if (br.habitIn <= 0) {
      br.habitIn = between(6, 14, rng) * bot.ai.patience;
      bot.attack = { pose: bot.ai.habits[Math.floor(rng() * bot.ai.habits.length)], t: 0, dur: 0.9 };
    }
  }
  if (bot.attack && (bot.attack.t += dt) >= bot.attack.dur) bot.attack = null;
  bot.x = body.x;
}

export function tickHunter(bot, world, hunters, dt, rng) {
  const map = world.map;
  bot.stats ??= computeStats(bot.char);
  bot.ai ??= makeAI(bot, rng);
  bot.brain ??= { think: between(0.2, 0.8, rng), goal: null, target: null, settled: false, still: 0, habitIn: between(4, 10, rng), healIn: 99 };
  bot.stuck ??= 0;
  const br = bot.brain;
  const body = bot.body;
  takeHits(bot, world, dt, rng);
  if (bot.down) {
    stepBody(body, map, { left: false, right: false, up: false, down: false, jump: false }, dt, { speed: 0, jump: 0 });
    bot.attack = null;
    bot.x = body.x;
    return;
  }
  live(bot, world, hunters, dt, rng, {
    think: () => hunt(bot, world, hunters, rng),
    canThink: !bot.leaving,
    // (At a life spot, or on the way to one, they leave the monsters be: world/botlife.js.)
    afterThink: () => {
      if (bot.leaving) br.goal = bot.leaving;
      else if (bot.life?.goal) {
        br.goal = bot.life.goal;
        br.target = null;
      }
    },
    giveUp: bot.leaving ?? null,
    canFight: !bot.leaving && !bot.life,
    // (A monster that's wandered over to you is yours now.)
    beforeFight: () => {
      const m = br.target;
      if (m && !m.def.boss && !helping(bot, world) && Math.abs(m.x - world.body.x) < 150 && Math.abs(m.y - world.body.y) < 90) br.target = null;
    },
  });
}

// Back from town after dying: in through the portal nearest you, a little sheepish.
function walkBackIn(bot, world) {
  const b = world.body;
  const portals = world.map.portals.filter((p) => !p.hidden && !p.dungeon).sort((p, q) => Math.abs(p.x - b.x) - Math.abs(q.x - b.x));
  const p = world.map.isTown || world.dungeon ? null : portals[0];
  bot.away = null;
  bot.map = world.map.id;
  bot.body = createBody(p ? p.x : b.x - b.facing * FOLLOW_GAP, p ? p.y : b.y);
  bot.appear = 1;
  Object.assign(bot.brain, { goal: null, target: null, path: null });
  say(world, bot, pick2(['back!! sorry', 'im back, that was embarrassing', 'bought more pots this time', 'ok round 2', 'did u miss me']));
  world.log(`${bot.name} is back.`, '#9fe0b0');
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
      say(world, bot, speak(bots.memory, 'levelUp', { player: world.char.name, level: bot.level }, bot.style, bots.rng), true);
      world.fx.push({ kind: 'levelup', x: bot.body?.x ?? bot.x, y: bot.body?.y ?? groundAt(world.map, bot.x), t: 0, dur: 1.6 });
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
    // Died out in the field and gone back to town for a bit: then they walk back in to you.
    if (bot.away) {
      if (world.now < bot.away && !world.dungeon) return;
      walkBackIn(bot, world);
    }
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
    const body = bot.body;
    bot.stats ??= computeStats(bot.char);
    if (!world.dungeon && !map.isTown) takeHits(bot, world, dt, rng);
    // Fallen in the field, a few seconds under the tombstone, then off to town.
    if (fieldDownOver(bot, world)) {
      Object.assign(bot, { down: false, tomb: false, hp: bot.stats.maxHp, potions: 1 + Math.floor(rng() * 5), away: world.now + between(20, 40, rng), body: null, bubble: null });
      return;
    }
    // Fallen (in a dungeon they lie where they fell until someone gets them up).
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
    // The shared brain: what to do comes from think() (hunting, by you in town, or their role in
    // a dungeon run).
    br.still = youStill ? br.still + dt : 0;
    live(bot, world, members, dt, rng, {
      think: () => think(bot, world, members, rng),
      // (Helping you at a life spot, they head for their place beside it: world/coop-life.js.)
      afterThink: () => {
        const help = helpGoal(bot);
        if (help) {
          br.goal = help;
          br.target = null;
          return;
        }
        // (Boss mechanics and party quests: world/coop.js.)
        coopAfterThink(bot, world);
      },
      // (In a dungeon, the tank gets the monster first.)
      canFight: !bot.lifeHelp && !holdFire(bot, world),
      idle: () => {
        // Standing about in town: look where you're headed if you're on the move, or at you if not.
        if (map.isTown && br.stopped > 0.35 && br.goal?.mode !== 'fight') body.facing = youStill ? (b.x < body.x ? -1 : 1) : b.facing;
      },
    });
    // Healers patch you up between fights (or mid-fight if you're in trouble).
    if (world.dungeon) {
      const healerUp = members.some((o) => o !== bot && !o.down && world.dungeon.roles[o.id] === 'healer');
      drink(bot, world, healerUp, rng);
      if (world.dungeon.roles[bot.id] === 'healer') {
        br.healIn -= dt;
        if (br.healIn <= 0) br.healIn = healerTurn(bot, world, rng);
      }
    } else if (bot.ai.kind === 'healer') {
      br.healIn -= dt;
      if (br.healIn <= 0) br.healIn = heal(bot, world, bots) ? between(6, 10, rng) : 1.5;
    }
    if (bot.appear > 0) bot.appear = Math.max(0, bot.appear - dt * 1.5);
    // Party chat.
    bot.nextLine -= dt;
    if (bot.nextLine <= 0 && !bot.bubble) {
      bot.nextLine = between(70, 150, rng) * Math.max(1, members.length / 2);
      const line = speak(bots.memory, 'party', contextOf(bot, bots, world), bot.style, rng);
      botChat(world, bot, line, { prefix: '[Party] ', color: '#9fe0b0' });
    }
  });
  // Co-op life skills: helpers at your spot, and feasts wearing off (world/coop-life.js).
  tickHelpers(bots, world, dt);
  tickBotBuffs(bots, world);
  // What's coming, called out by whoever sees it.
  if (members.length && !map.isTown) tickCallouts(world, members);
}
