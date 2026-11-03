// How the other players fight: the choices a real player makes in a fight, for every bot (party
// members, players hunting the map, and dungeon helpers alike). world/party.js plays their moves;
// this decides which ones, and what they do around them:
//   - Their kit, used like a player would: area skills on a pack, single-target power on a boss,
//     the launcher and then an air combo on something light, a dash out of a run, and the finisher
//     (on a full gauge) saved for the boss when one is near. Always at a human pace: every move
//     still waits out its own motion and beat (world/melee.js AFTER), nothing is mashed.
//   - Awareness: stepping back out of a heavy wind-up aimed at them, out of a marked patch, over a
//     slam; focusing your target (or your ping); spreading out so they don't stand in one spot;
//     backing off and drinking when low.
//   - Roles: the tank faces the boss away from the group and calls its aggro, damage dealers flank
//     it from behind, the healer stays back and keeps everyone up (themselves too).
//   - Callouts: short lines that matter ("jump the slam!", "healing you"), through the chat gate,
//     never the same twice, never chatter.
//   - Co-op: catching a launch someone else made, standing by the fallen (a team revive picks
//     them up when the game has one), standing in shared circles and splitting to both sides of a
//     two-sided shield, where those exist. Each check looks for the thing first and does nothing
//     without it.

import { commandsOf } from './melee.js';
import { botChat } from './chatlog.js';
import { SKILLS } from '../data/skills.js';

const between = (a, b, rng) => a + rng() * (b - a);

// ---------- The situation ----------

// How many monsters stand with `m` (itself included): a pack calls for area skills.
export function packAt(world, m, r = 120) {
  let n = 1;
  for (const o of world.mobs) if (o !== m && o.hp > 0 && Math.abs(o.x - m.x) < r && Math.abs(o.y - m.y) < 40) n++;
  return n;
}

// Area skills among the Star Witch line's own spells (played by party.js SPECIALS).
const AREA_SPECIALS = new Set(['cometarrow', 'stampede', 'troupecombo', 'thousandtorii']);

// What a skill is good for, read from its own strikes: how many it reaches, whether it launches,
// and how hard it hits in all.
export function shapeOf(sk) {
  let targets = 1;
  let launch = false;
  let power = 0;
  for (const st of sk.steps) {
    for (const k of st.strikes ?? []) {
      targets = Math.max(targets, (k.targets ?? 1) * (k.fan ?? 1) + (k.around ? 2 : 0) + (k.pierce ? 1 : 0));
      if (k.launch > 0) launch = true;
      power += k.pct ?? 0;
    }
  }
  if (AREA_SPECIALS.has(sk.id)) targets = 6;
  return { targets, aoe: targets >= 3, launch, power: power * (sk.tune ?? 1) };
}

// The fight's finisher: fired on a boss, on a pack, or on something tough; held while a boss in the
// room is still to come (a real player saves it), but never held for long.
function finisherNow(bot, world, m, pack) {
  if (m.def.boss || pack >= 3) return true;
  const f = bot.fight;
  f.fullAt ??= world.now;
  const bossAhead = world.dungeon && world.mobs.some((o) => o.def.boss && o.hp > 0);
  if (bossAhead) return world.now - f.fullAt > 25;
  return pack >= 2 || m.hp > m.def.hp * 0.5 || world.now - f.fullAt > 6;
}

// Picks the skill to throw between strings, or null to keep to the basic combo. `full`: their gauge
// is full. Area skills on a pack, power on a boss, never the same skill twice running when there's
// another, and more often when it pays off (a pack, a boss) than on a lone snail.
export function chooseSkill(bot, world, m, full, rng) {
  const f = bot.fight;
  const pack = packAt(world, m);
  if (full) {
    const fin = f.skills.filter((s) => s.full);
    if (fin.length && finisherNow(bot, world, m, pack)) {
      f.fullAt = null;
      return fin[Math.floor(rng() * fin.length)];
    }
  }
  const attacks = f.skills.filter((s) => !s.full && !s.heal);
  if (!attacks.length) return null;
  const want = (bot.ai?.special ?? 0.15) * (pack >= 3 ? 2.2 : m.def.boss ? 1.8 : 1);
  if (rng() >= want) return null;
  const scored = attacks.map((s) => {
    const sh = shapeOf(s);
    let score = 1;
    if (pack >= 3) score += (sh.aoe ? 3 : 0) + sh.targets * 0.3;
    else if (pack === 1 && !sh.aoe) score += 0.8;
    if (m.def.boss) score += sh.power / 250 + (sh.launch ? -0.5 : 0);
    // A charge (Shoulder Charge, a flip over them) bowls through a crowd; on one it's a waste.
    if (s.charge) score += pack >= 2 ? 1 : -0.6;
    if (s.id === f.lastSkill && attacks.length > 1) score *= 0.1;
    return { s, score: Math.max(0.05, score) };
  });
  let roll = rng() * scored.reduce((a, o) => a + o.score, 0);
  for (const o of scored) if ((roll -= o.score) <= 0) return (f.lastSkill = o.s.id), o.s;
  return scored.at(-1).s;
}

// The command moves (up + attack, in the air, on the run) as steps a bot plays: the launcher and its
// air combo on something light, catching a monster someone else threw up, a dash out of a run.
// Returns the steps, or null for a normal string.
export function commandFor(bot, world, m, rng) {
  const body = bot.body;
  const cmd = commandsOf(bot.char, bot.stats.weaponType);
  if (!cmd || !body.onGround) return null;
  const air = (cmd.air ?? []).map((st, i, all) => ({
    ...st,
    strikes: st.strikes.map((k) => (k.onLand ? { ...k, onLand: false, at: 0.55 } : k)),
    air: true,
    kind: i === all.length - 1 ? 'command' : 'chain',
    last: i === all.length - 1,
  }));
  const light = !m.def.boss && !m.def.fly;
  // Someone threw it up: jump after it and keep it in the air (a team catch).
  if (light && m.air > 24 && !mine(bot, world, m) && air.length && Math.abs(m.x - body.x) < 120) {
    m.caught = { by: bot.id, at: world.now };
    return [{ move: air[0].move, dur: 0.12, strikes: [], kind: 'chain', hop: 380, at: 0 }, ...air];
  }
  // The launcher, then up after it (now and then, on something that can go up).
  if (light && cmd.up && air.length && packAt(world, m) <= 2 && rng() < 0.16) {
    const k = cmd.up.strikes.find((s) => s.launch > 0) ?? cmd.up.strikes[0];
    m.botLaunch = { id: bot.id, at: world.now };
    return [{ ...cmd.up, kind: 'command', hop: k?.hop ?? 360, at: (k?.at ?? 0.5) + 0.05 }, ...air];
  }
  // Running in: the dash attack.
  if (cmd.dash && Math.abs(body.vx) > 50 && Math.sign(body.vx) === Math.sign(m.x - body.x) && rng() < 0.5) return [{ ...cmd.dash, kind: 'command', last: true }];
  return null;
}

// Whether `m` is up in the air from this bot's own launcher (not one to catch).
const mine = (bot, world, m) => m.botLaunch?.id === bot.id && world.now - m.botLaunch.at < 2.5;

// In the air for a command: the hop up after a launcher, hanging on an air cut, the dive down.
// Runs after their body moves each frame.
export function airborne(bot, world) {
  const body = bot.body;
  if (bot.hop && world.now >= bot.hop.at) {
    if (body.onGround && !body.rope) {
      body.vy = -bot.hop.v;
      body.onGround = false;
    }
    bot.hop = null;
  }
  if (bot.hang && world.now < bot.hang && body.vy > 30) body.vy = 30;
  if (bot.dive) {
    if (body.onGround) bot.dive = null;
    else body.vy = Math.max(body.vy, bot.dive);
  }
}

// A step about to play: an air step sets them hanging or diving; a launcher sends them up after.
export function beginStep(bot, world, step) {
  if (step.hop) bot.hop = { at: world.now + (step.at ?? 0.5) * step.dur, v: step.hop };
  if (step.hang) bot.hang = world.now + step.dur;
  if (step.dive) bot.dive = step.dive;
}

// ---------- Awareness ----------

// What you're fighting: your ping first (the grouping UI's party pings, when there are any), then
// whatever you hit last, while it's fresh.
export function focusOf(world) {
  const pings = Array.isArray(world.pings) ? world.pings : [];
  for (let i = pings.length - 1; i >= 0; i--) {
    const p = pings[i];
    if (p.until != null && p.until < world.now) continue;
    if (p.mob?.hp > 0) return p.mob;
    if (p.x != null) {
      const near = world.mobs.filter((m) => m.hp > 0 && Math.abs(m.x - p.x) < 90 && Math.abs(m.y - (p.y ?? m.y)) < 60);
      if (near.length) return near.sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    }
  }
  const h = world.youHit;
  if (h?.mob?.hp > 0 && world.now - h.at < 4 && world.mobs.includes(h.mob)) return h.mob;
  return null;
}

const heavy = (m) => m.def.boss || (m.swingMul ?? 1) > 1 || m.big > 0;

// Each frame: stepping out of a heavy blow winding up at them (most of the time: they're people,
// not machines). Holds the step for a moment once it starts. Returns whether they're dodging.
export function evade(bot, world, intent, rng, role = null) {
  const body = bot.body;
  const e = bot.evade;
  if (e && world.now < e.until) {
    Object.assign(intent, e.intent);
    return true;
  }
  bot.evade = null;
  bot.seenWind ??= new WeakMap();
  for (const m of world.mobs) {
    if (m.hp <= 0 || !(m.windup > 0) || m.swingAt !== bot.id || m.def.fight?.range) continue;
    if (!heavy(m) || (role === 'tank' && !((m.swingMul ?? 1) > 1))) continue;
    if (world.now - (bot.seenWind.get(m) ?? -9) < 1.5) continue;
    bot.seenWind.set(m, world.now);
    if (rng() > 0.8) continue;
    const away = Math.sign(body.x - m.x) || 1;
    bot.evade = { until: world.now + Math.min(0.75, m.windup + 0.15), intent: { left: away < 0, right: away > 0, jump: false, up: false, down: false } };
    Object.assign(intent, bot.evade.intent);
    callout(world, bot, 'windup', { boss: m.def.name });
    return true;
  }
  return false;
}

// ---------- Roles and co-op, where they stand ----------

// A shared circle (a co-op mechanic: stand in it together), when the room has one.
export const shared = (z) => Boolean(z && (z.share || z.soak || z.stack || z.kind === 'share' || z.kind === 'stack'));

// A monster that needs hitting from both sides (a two-sided shield), when the room has one.
const twoSided = (m) => Boolean(m.sides || m.def.sides || m.twoSided || m.def.twoSided);

// Adjusts where a dungeon bot means to stand, after their role has picked a spot: out of each
// other's way, the tank turning the boss from the group, the others flanking it, standing in a
// shared circle, taking the far side of a two-sided shield, backing off when low.
export function placeInGroup(bot, world, role, nav) {
  const br = bot.brain;
  const g = br.goal;
  if (!g || bot.down) return;
  const body = bot.body;
  const t = br.target;
  const run = world.dungeon;
  const clampTo = (x) => {
    const s = nav.surfaces[g.surface];
    return s ? Math.max(s.x1 + 8, Math.min(s.x2 - 8, x)) : x;
  };
  // A shared circle: whoever's nearest and not tanking goes and stands in it.
  const circle = run?.zones?.find((z) => !z.hit && shared(z));
  if (circle && role !== 'tank') {
    const need = circle.need ?? 2;
    const crew = groupBots(world).filter((b) => !b.down && run.roles[b.id] !== 'tank').sort((a, b) => Math.abs(a.body.x - circle.x) - Math.abs(b.body.x - circle.x));
    if (crew.slice(0, Math.max(1, need - 1)).includes(bot)) {
      g.x = clampTo(circle.x + ((bot.slot ?? 0) % 2 ? 8 : -8));
      if (!bot.stood?.has?.(circle)) callout(world, bot, 'share');
      (bot.stood ??= new WeakSet()).add(circle);
      return;
    }
  }
  const tank = tankOf(world);
  // The tank pulling: the others hang well back until the pack is on the tank.
  if (role !== 'tank' && tank?.bot?.brain?.pulling && !run.combat && tank.bot.brain.target) {
    const pack = tank.bot.brain.target;
    const dir = Math.sign(pack.x - tank.body.x) || 1;
    g.x = clampTo(Math.min(g.x * dir, (pack.x - dir * 210) * dir) * dir);
  }
  // Between fights, never walk through a sleeping pack the tank hasn't pulled: stop short of it.
  if (role !== 'tank' && tank && !run.combat) {
    const dir = Math.sign(g.x - body.x);
    const wall = world.mobs.filter((m) => m.hp > 0 && !m.engaged && Math.abs(m.y - body.y) < 60 && (m.x - body.x) * dir > 0 && (m.x - g.x) * dir < 140)
      .sort((a, b) => Math.abs(a.x - body.x) - Math.abs(b.x - body.x))[0];
    if (wall) {
      g.x = clampTo(wall.x - dir * (wall.def.boss ? 260 : 180));
      g.mode = 'follow';
      br.task = null;
    }
  }
  // Something's come for them instead of the tank: run it back to the tank.
  if (role !== 'tank' && tank && t && t.hp > 0 && t.target === bot.id && tank.id !== bot.id && Math.abs(tank.body.x - body.x) > 30) {
    g.x = clampTo(tank.body.x + (Math.sign(body.x - tank.body.x) || 1) * 16);
    if (!(bot.peeled ??= new WeakSet()).has(t)) {
      bot.peeled.add(t);
      callout(world, bot, 'peel', { boss: t.def.name });
    }
    return;
  }
  if (t && t.hp > 0 && g.mode === 'fight') {
    if (twoSided(t)) {
      // The other side from you (and from each other): even slots one way, odd the other.
      const you = Math.sign(world.body.x - t.x) || 1;
      const side = (bot.slot ?? 0) % 2 ? you : -you;
      const off = bot.ai.weapon.ranged ? bot.ai.weapon.reach * 0.6 : t.def.w / 2 + 16;
      g.x = clampTo(t.x + side * off);
      if (side !== you && !(bot.flanked ??= new WeakSet()).has(t)) {
        bot.flanked.add(t);
        callout(world, bot, 'otherSide');
      }
    } else if (role === 'tank' && t.def.boss) {
      // The tank turns the boss away from the group: they hold the side the others aren't on.
      br.tankSide ??= new WeakMap();
      if (!br.tankSide.has(t)) {
        const others = groupBodies(world).filter((b) => b !== body);
        const mean = others.length ? others.reduce((a, b) => a + b.x, 0) / others.length : t.x - 1;
        br.tankSide.set(t, -(Math.sign(mean - t.x) || 1));
      }
      g.x = clampTo(t.x + br.tankSide.get(t) * (t.def.w / 2 + 16));
    }
  }
  // Out of each other's way: melee fighters fan out a little round the same monster.
  if (g.mode === 'fight' && !bot.ai.weapon.ranged) g.x = clampTo(g.x + (((bot.slot ?? 0) % 3) - 1) * 14);
  // Low on HP with no heal coming: back off from the fight until they've drunk or been healed.
  const max = bot.stats.maxHp;
  if (role !== 'tank' && t && bot.hp < max * 0.3) {
    const away = Math.sign(body.x - t.x) || 1;
    g.x = clampTo(t.x + away * 200);
    g.mode = 'follow';
    br.target = null;
  }
}

// The group's tank, while they're up: { id, body, bot } (you, when you're the tank).
export function tankOf(world) {
  const run = world.dungeon;
  if (!run) return null;
  if (run.roles.you === 'tank' && !world.dead) return { id: 'you', body: world.body, bot: null };
  const b = groupBots(world).find((o) => run.roles[o.id] === 'tank' && !o.down);
  return b ? { id: b.id, body: b.body, bot: b } : null;
}

// Damage dealers and the healer let the tank have the monster first: they hold their blows until
// the tank has opened on it, and while they'd pull it off the tank (their threat up near the
// tank's), for a few seconds at most (a tank who isn't tanking doesn't stall them for good).
export function holdFire(bot, world) {
  const run = world.dungeon;
  if (!run || run.roles[bot.id] === 'tank') return false;
  const m = bot.brain?.target;
  const tank = tankOf(world);
  if (!m || !tank || m.def.fight?.mender || m.add) return false;
  const br = bot.brain;
  if (br.holdOn !== m) {
    br.holdOn = m;
    br.holdSince = world.now;
  }
  if (world.now - br.holdSince > 3.5) return false;
  const theirs = m.threat?.[tank.id] ?? 0;
  const mine = m.threat?.[bot.id] ?? 0;
  return theirs <= 1 || mine > theirs * 0.8;
}

// Where the tank wants the boss to face: the damage dealers stand behind it, on the far side.
export function behindSide(tankBody, target, fallback) {
  if (!tankBody) return fallback;
  return -(Math.sign(tankBody.x - target.x) || 1);
}

function groupBots(world) {
  return (world.bots?.list ?? []).filter((b) => b.party && b.body && b.map === world.map.id);
}
function groupBodies(world) {
  return [world.body, ...groupBots(world).map((b) => b.body)];
}

// A drink when low (a dungeon has no town to run back to): half their HP back, a moment's pause in
// their fight, and only while they have potions. With a healer up and on it, they wait for the heal
// unless it's really bad.
export function drink(bot, world, healerUp, rng) {
  const max = bot.stats.maxHp;
  if (bot.down || bot.hp == null || bot.hp >= max * 0.3 || world.now < (bot.potionAt ?? 0)) return false;
  if (healerUp && bot.hp >= max * 0.15) return false;
  bot.potions ??= 1 + Math.floor(rng() * 5);
  bot.potionAt = world.now + 2;
  if (bot.potions <= 0) return false;
  bot.potions -= 1;
  const add = Math.round(max * 0.5);
  bot.hp = Math.min(max, bot.hp + add);
  if (bot.fight) bot.fight.readyAt = Math.max(bot.fight.readyAt, world.now + 0.4);
  world.fx.push({ kind: 'heal', x: bot.body.x, y: bot.body.y, t: 0, dur: 0.6 });
  world.numbers.push({ x: bot.body.x, y: bot.body.y - bot.body.h - 14, text: `+${add}`, color: '#7ee081', t: 0, small: true });
  callout(world, bot, 'drink');
  return true;
}

// ---------- Callouts ----------
// Lines that matter in the moment, in party chat: what's coming, what they're doing for you. Each
// goes through the chat gate (no line said twice in ten minutes), a bot calls at most one every few
// seconds and the group one every couple, and a line that won't pass isn't said: they don't chat.

const LINES = {
  slam: ['{boss} is slamming, jump!', 'slam coming, jump!', 'jump the slam!', 'up on a ledge, slam incoming', 'hop! {boss} slam', 'slam again, jump'],
  lane: ['{boss} is charging, out of the lane!', 'charge! clear the line', 'lane coming, step out', 'get out of {boss}s path', 'tusks down, move!'],
  spores: ['spores under you, step out!', 'pink patch on you, move', 'out of the spores!', 'move, its going to burst'],
  thorns: ['thorns, find the safe floor', 'thorns coming, watch your feet', 'stand on the plain floor, thorns'],
  windup: ['{boss} winding up on me, backing off', 'big swing coming, stepping out', 'whoa, stepping back', 'not taking that one'],
  windupYou: ['{boss} is winding up on you, step back!', 'big hit on you, back off!', 'move, its swinging at you!'],
  aggro: ["I've got {boss}, turning it away", 'on me! stay behind it', "{boss}'s on me, hit it from behind", 'got aggro, flank it'],
  heal: ['healing you', 'heal on you, hang in there', 'got you, keep going', 'patching you up', 'you were low, healed'],
  healSelf: ['healing myself', 'patching myself up', 'self heal, one sec'],
  drink: ['drinking a pot', 'low, potting', 'one sec, drinking', 'pot down, back in'],
  finisher: ['{skill}!', 'gauge full, {skill} on {boss}!', 'here comes {skill}', 'saving nothing, {skill}!'],
  revive: ['hang on, getting you up', 'on my way to you', 'standing by you, get up!', 'coming to pick you up'],
  catch: ['got it!', 'catching!', 'up we go', 'juggle!', 'keep it up there'],
  share: ['in the circle with you', 'standing in it, come on', 'circle! get in', 'sharing the hit'],
  peel: ['its on me, bringing it to the tank', 'got one on me, running it back', '{boss} on me, tank grab it'],
  otherSide: ["I'll take the other side", 'going round the back', 'other side, go', 'hitting it from behind'],
};

const CALL_GAP = 6; // a bot's own calls, at least this far apart
const GROUP_GAP = 2; // anyone's, at least this far apart (urgent ones skip it)
const URGENT = new Set(['slam', 'lane', 'windupYou', 'spores']);

// `bot` calls out `kind`; `ctx` fills the blanks (a boss, a skill). Returns whether it was said.
export function callout(world, bot, kind, ctx = {}, rng = world.bots?.rng ?? Math.random) {
  const pool = LINES[kind];
  if (!pool || !bot || !bot.party || bot.down) return false;
  const c = (world.callouts ??= { at: -99, kinds: {} });
  if (world.now - (bot.callAt ?? -99) < CALL_GAP) return false;
  // (One call of a kind covers the moment: three patches at once get one shout, not three.)
  if (world.now - (c.kinds[kind] ?? -99) < 5) return false;
  if (!URGENT.has(kind) && world.now - c.at < GROUP_GAP) return false;
  const start = Math.floor(rng() * pool.length);
  for (let i = 0; i < pool.length; i++) {
    const line = pool[(start + i) % pool.length].replace(/\{(\w+)\}/g, (_, k) => ctx[k] ?? (k === 'boss' ? 'it' : ''));
    if (botChat(world, bot, line.replace(/\s+/g, ' ').trim(), { prefix: '[Party] ', color: '#9fe0b0', important: true })) {
      bot.callAt = world.now;
      c.at = world.now;
      c.kinds[kind] = world.now;
      return true;
    }
  }
  return false;
}

// Once a frame for the party: who calls the moves coming in, the tank calling its aggro, and the
// fallen being stood by.
export function tickCallouts(world, members) {
  const up = members.filter((b) => !b.down && b.body && b.map === world.map.id);
  if (!up.length) return;
  const called = (world.calledOut ??= new WeakSet());
  const run = world.dungeon;
  const near = (x) => up.slice().sort((a, b) => Math.abs(a.body.x - x) - Math.abs(b.body.x - x));
  for (const z of run?.zones ?? world.zones ?? []) {
    if (z.hit || called.has(z)) continue;
    called.add(z);
    const boss = z.from?.def?.name;
    const youIn = Math.abs(world.body.x - (z.kind === 'circle' ? z.x : z.x + (z.w ?? 0) / 2)) < (z.w ?? 60) / 2 + 6;
    if (z.kind === 'floor') near(world.body.x).some((b) => callout(world, b, 'slam', { boss }));
    else if (z.kind === 'lane') near(world.body.x).some((b) => callout(world, b, 'lane', { boss }));
    else if (z.kind === 'circle' && youIn && !shared(z)) near(world.body.x).some((b) => callout(world, b, 'spores'));
    else if (z.kind === 'thorns' && youIn) near(world.body.x).some((b) => callout(world, b, 'thorns'));
  }
  for (const m of world.mobs) {
    if (m.hp <= 0) continue;
    // A heavy blow winding up at you.
    if (m.windup > 0 && m.swingAt === 'you' && heavy(m) && !called.has(m.calledWind ??= {})) {
      called.add(m.calledWind);
      near(m.x).some((b) => callout(world, b, 'windupYou', { boss: m.def.name }));
    }
    if (!(m.windup > 0)) m.calledWind = null;
    // The tank picking a boss up.
    if (m.def.boss && run && m.target && !called.has(m)) {
      const tank = up.find((b) => b.id === m.target && run.roles[b.id] === 'tank');
      if (tank && callout(world, tank, 'aggro', { boss: m.def.name })) called.add(m);
    }
  }
}

// The finisher going off, called out when it's on a boss.
export function callFinisher(bot, world, sk, m) {
  if (!m?.def?.boss) return;
  callout(world, bot, 'finisher', { skill: SKILLS[sk.id]?.name ?? 'finisher', boss: m.def.name });
}

// The fallen: the healer (or whoever's nearest) goes and stands by them, which is how a team revive
// picks a friend up when the game has one. Returns a spot to stand at, or null.
export function standBy(bot, world, members, rng) {
  if (world.dungeon?.combat) return null;
  const downs = [];
  if (world.dead && !world.dungeon) downs.push({ id: 'you', body: world.body });
  for (const b of members) if (b !== bot && b.down && b.body && b.map === world.map.id) downs.push({ id: b.id, body: b.body });
  if (!downs.length) return null;
  const up = members.filter((b) => !b.down && b.body && b.map === world.map.id);
  const d = downs[0];
  const helper = up.find((b) => b.ai?.kind === 'healer' || world.dungeon?.roles?.[b.id] === 'healer') ?? up.slice().sort((a, b) => Math.abs(a.body.x - d.body.x) - Math.abs(b.body.x - d.body.x))[0];
  if (helper !== bot) return null;
  if (!(bot.revived ??= new Set()).has(d.id)) {
    bot.revived.add(d.id);
    if (d.id === 'you') callout(world, bot, 'revive');
  }
  return { x: d.body.x + (Math.sign(bot.body.x - d.body.x) || 1) * between(10, 18, rng), y: d.body.y };
}

// A monster someone else just threw up into the air, close enough to jump after (a team catch):
// yours, another member's. Only for those with an air combo, and only while it's still rising or
// hanging up there.
export function catchable(bot, world) {
  const body = bot.body;
  if (!body?.onGround || !bot.stats) return null;
  const cmd = commandsOf(bot.char, bot.stats.weaponType);
  if (!cmd?.air?.length) return null;
  return world.mobs.find((m) => m.hp > 0 && m.air > 24 && !mine(bot, world, m) && !m.def.boss && !(m.caught && world.now - m.caught.at < 1.5 && m.caught.by !== bot.id) && Math.abs(m.x - body.x) < 160 && Math.abs(m.y - body.y) < 60) ?? null;
}
