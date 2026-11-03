// Two-person boss mechanics (data/coop.js COOP_MECHS): every area boss and every dungeon boss has
// one thing that's much easier with two or more (a Hard run adds a second to each dungeon boss).
// They run the same with party bots, a dungeon group and online friends on the map, and a solo
// player can still win, just harder and slower.
//
//   split  Gold ring on the floor: a big blow shared by everyone standing in it (alone you take
//          it all; leave it empty and it bursts wide, harder).
//   sides  A guard that takes most of the sting out of every hit until the boss is struck from
//          both sides within a beat; then it cracks open for a while and hits land harder.
//   seal   A seal stone on the floor near the boss: while anyone stands on it, its armour is
//          down. The seal hops to the other side now and then.
//   twins  A tethered pair of adds: if one is left standing too long after the other falls, it
//          calls its twin back. They have to go down close together.
//
// Party members play them: they crowd into the ring, take the empty side, hold the seal and
// balance their blows on the twins, with a short callout through the chat gate. Each boss carries
// its state as `m.coop`; render/coop.js draws the telegraphs.

import { COOP_MECHS, HARD_MECHS } from '../data/coop.js';
import { MOBS } from '../data/mobs.js';
import { partyMembers, hurtBot } from './party.js';
import { groupOf, isUp, hurtMember, adds, dangerFor, callout as runCallout } from './dungeon.js';
import { hurtPlayer } from './world.js';
import { spawnMob } from './mobs.js';
import { navOf, surfaceBelow } from './nav.js';
import { JUMP_SPEED } from './physics.js';
import { botChat } from './chatlog.js';

const pick = (list, rng = Math.random) => list[Math.floor(rng() * list.length)];
const NEAR = 620; // how close a boss must be for its mechanics to run (and bots to play them)

// ---------- Arming a boss ----------

// The mechanics for this boss here (with Hard's extra one in a Hard run), or [].
export function mechsFor(world, m) {
  const list = [...(COOP_MECHS[m.def.id] ?? [])];
  if (world.dungeon?.hard && HARD_MECHS[m.def.id]) list.push(HARD_MECHS[m.def.id]);
  return list;
}

export function armBoss(world, m) {
  const defs = mechsFor(world, m);
  if (!defs.length) return null;
  m.coop = { mechs: defs.map((def) => ({ def, guard: def.kind === 'sides', hits: {}, side: {}, next: def.first ?? 0 })) };
  return m.coop;
}

const mechOf = (m, kind) => m?.coop?.mechs.find((s) => s.def.kind === kind) ?? null;
export { mechOf };

// ---------- Who is here ----------

// Everyone who can play a mechanic on this map: { id, name, body, bot, remote, role }.
export function membersHere(world) {
  if (world.dungeon) return groupOf(world).filter((g) => isUp(world, g));
  const out = [];
  if (!world.dead) out.push({ id: 'you', name: world.char.name, body: world.body, bot: null });
  for (const bot of partyMembers(world.bots)) {
    if (bot.body && bot.map === world.map.id && !bot.down) out.push({ id: bot.id, name: bot.name, body: bot.body, bot });
  }
  // (Online, the other players on this map step in too: their own games hurt them.)
  (world.net?.bodies?.(world) ?? []).forEach((body, i) => out.push({ id: `net${i}`, name: 'friend', body, bot: null, remote: true }));
  return out;
}

function hurt(world, g, raw, fromX) {
  if (g.remote) return;
  if (world.dungeon) return hurtMember(world, g, raw, fromX, { knock: true });
  if (g.bot) return hurtBot(g.bot, world, raw, fromX);
  if (!world.dead) hurtPlayer(world, raw, fromX);
}

function floorUnder(world, x, y) {
  const nav = navOf(world.map);
  const i = surfaceBelow(nav, x, y - 4);
  const s = nav.surfaces[Math.max(0, i)];
  return { y: s ? (s.yAt ? s.yAt(x) : s.y) : world.map.groundY, surface: i, x1: s?.x1 ?? 0, x2: s?.x2 ?? world.map.width };
}

// A line for the player: the dungeon's big callout, or a field boss's banner.
function shout(world, title, sub = '') {
  if (world.dungeon) runCallout(world, title, sub);
  else world.callout = { title, sub, color: '#ffd65a', at: world.now };
}

// A party member calls the move out (party chat, through the chat gate: no repeats, so a line said
// lately just isn't said again).
function botCall(world, g, lines) {
  if (!g?.bot || !world.bots) return;
  botChat(world, g.bot, pick(lines, world.bots.rng ?? Math.random), { prefix: '[Party] ', color: '#9fe0b0', important: true });
}

// ---------- Every tick ----------

// The live bosses with mechanics on this map, close enough to matter.
export function coopBosses(world) {
  return world.mobs.filter((m) => m.coop && m.hp > 0);
}

export function tickCoopBosses(world, dt) {
  // (Online, the game that runs a map's monsters runs their mechanics too.)
  // A friend's game only shows them, from the owner's messages (coopShared below).
  if (world.net?.isFollower?.(world) || (!world.dungeon && world.net?.mirrored?.(world))) return tickCoopMirror(world, dt);
  world.coopFx ??= [];
  for (const m of world.mobs) {
    if (m.hp <= 0 || !m.def.boss) continue;
    // (A dungeon boss that calmed down after a wipe starts its mechanics over.)
    if (world.dungeon && m.coop && !m.engaged) m.coop = null;
    if (!m.coop && !armBoss(world, m)) continue;
    const members = membersHere(world).filter((g) => Math.abs(g.body.x - m.x) < NEAR && Math.abs(g.body.y - m.y) < 400);
    // A dungeon boss starts once the fight does; a field boss once someone's near.
    const on = world.dungeon ? m.engaged : members.length > 0;
    if (!on) continue;
    for (const s of m.coop.mechs) TICK[s.def.kind](world, m, s, members, dt);
  }
  // Effects fading.
  world.coopFx = (world.coopFx ?? []).filter((f) => (f.t += dt) < f.dur);
}

const TICK = {
  split(world, m, s, members, dt) {
    const def = s.def;
    if (!s.ring) {
      s.next -= dt;
      if (s.next > 0 || !members.length) return;
      s.next = def.every;
      // Marked under someone (not the tank, if there's anyone else).
      const pool = members.filter((g) => g.role !== 'tank');
      const g = pick(pool.length ? pool : members);
      const f = floorUnder(world, g.body.x, g.body.y);
      const x = Math.max(f.x1 + def.w / 2, Math.min(f.x2 - def.w / 2, g.body.x));
      s.ring = { x, y: f.y, w: def.w, t: 0, warn: def.warn };
      shout(world, `${def.name}!`, 'Stand together in the gold ring to share it');
      const caller = members.find((o) => o.bot);
      botCall(world, caller, ['stack in the ring!!', 'everyone in the gold circle', 'share it! get in the ring', 'ring! stand together']);
      return;
    }
    const r = s.ring;
    r.t += dt;
    if (r.t < r.warn) return;
    s.ring = null;
    const inside = members.filter((g) => inRing(r, g.body));
    const raw = m.def.atk * def.hit;
    if (inside.length) {
      const each = raw / inside.length;
      for (const g of inside) hurt(world, g, each, r.x);
      world.log?.(inside.length > 1 ? `${def.name} shared by ${inside.length}!` : `${def.name} lands on you alone!`, inside.length > 1 ? '#ffe36b' : '#ffb3c6');
    } else {
      // Nobody took it: it bursts wide over the whole floor around it.
      for (const g of members) if (Math.abs(g.body.x - r.x) < 320 && Math.abs(g.body.y - r.y) < 30) hurt(world, g, raw * 1.4, r.x);
      world.log?.(`Nobody stood in the ring: ${def.name} bursts wide!`, '#ffb3c6');
    }
    world.juice.push({ type: 'shake', mag: inside.length > 1 ? 4 : 7, dur: 0.5 });
    world.coopFx.push({ kind: 'split', boss: m.def.id, x: r.x, y: r.y, w: r.w, n: inside.length, t: 0, dur: 0.8 });
  },

  sides(world, m, s, members) {
    const def = s.def;
    if (!s.guard && world.now >= s.openUntil) {
      s.guard = true;
      s.hits = {};
      shout(world, `${def.name} is back up`, 'Strike from both sides at once to break it');
    }
    // Who goes where: every few seconds, party members fill whichever side has fewer.
    if (s.guard && world.now >= (s.planAt ?? 0)) {
      s.planAt = world.now + 2;
      planSides(world, m, s, members);
    }
  },

  seal(world, m, s, members, dt) {
    const def = s.def;
    s.dir ??= 1;
    s.moveIn ??= def.move;
    s.moveIn -= dt;
    if (s.x == null || s.moveIn <= 0) {
      if (s.x != null) s.dir = -s.dir;
      s.moveIn = def.move;
      const f = floorUnder(world, m.x, m.y);
      let x = m.x + s.dir * def.off;
      const walls = world.dungeon?.room?.walls;
      const lo = Math.max(f.x1 + 30, walls ? walls.toL + 60 : 60);
      const hi = Math.min(f.x2 - 30, walls ? walls.toR - 60 : world.map.width - 60);
      x = Math.max(lo, Math.min(hi, x));
      s.x = x;
      s.y = f.y;
      s.heldBy = null;
      s.holder = null;
      if (s.moved) shout(world, `The ${def.name} moves!`, 'Someone stand on it to bring the armour down');
      s.moved = true;
    }
    const on = members.find((g) => onSeal(s, g.body));
    if ((on?.id ?? null) !== s.heldBy) {
      s.heldBy = on?.id ?? null;
      if (on) world.coopFx.push({ kind: 'seal', x: s.x, y: s.y, t: 0, dur: 0.6 });
    }
    // A party member takes the seal when nobody else has it: a healer or a ranged fighter first
    // (they can still work from there), never the tank.
    if (world.now >= (s.planAt ?? 0)) {
      s.planAt = world.now + 1;
      const other = members.find((g) => !g.bot && onSeal(s, g.body));
      if (other) s.holder = null;
      else {
        const still = members.find((g) => g.id === s.holder);
        if (!still) {
          const bots = members.filter((g) => g.bot && g.role !== 'tank');
          const g = bots.find((o) => o.role === 'healer') ?? bots.find((o) => o.bot.ai?.weapon?.ranged) ?? bots[0];
          s.holder = g?.id ?? null;
          if (g) botCall(world, g, ['i got the seal!', 'holding the seal, go go', 'on the seal! hit it now', 'seal is mine, armour down soon']);
        }
      }
    }
  },

  twins(world, m, s, members) {
    const def = s.def;
    if (!s.pair) {
      if (s.spawned || m.hp / m.def.hp > def.at) return;
      s.spawned = true;
      s.pair = spawnTwins(world, m, def, [m.x - 170, m.x + 170]);
      shout(world, `${def.name}!`, 'Tethered: bring them down together');
      botCall(world, members.find((o) => o.bot), ['twins! kill them together', 'split up on the twins', 'even them out, same time!!']);
      return;
    }
    const [a, b] = s.pair;
    const downA = a.hp <= 0;
    const downB = b.hp <= 0;
    if (downA && downB) {
      if (!s.done) {
        s.done = true;
        shout(world, 'Down together!', `The ${def.name} won't be back`);
        world.coopFx.push({ kind: 'twins', x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 20, t: 0, dur: 0.8 });
      }
      return;
    }
    if (downA || downB) {
      s.alone ??= world.now;
      if (world.now - s.alone < def.revive) return;
      // Too slow: the one left calls its twin back.
      const live = downA ? b : a;
      const back = spawnTwins(world, m, def, [live.x + (live.x < m.x ? -60 : 60)], live)[0];
      s.pair = downA ? [back, b] : [a, back];
      s.alone = null;
      live.hp = Math.min(live.def.hp, live.hp + live.def.hp * 0.4);
      shout(world, 'Its twin called it back!', 'Bring them down at the same time');
      world.coopFx.push({ kind: 'revive', x: back.x, y: back.y - 20, t: 0, dur: 0.8 });
    } else s.alone = null;
  },
};

function spawnTwins(world, boss, def, xs, mate = null) {
  const made = [];
  if (world.dungeon) {
    const room = world.dungeon.room;
    const before = room.adds.length;
    adds(world, boss, def.mob, xs, null);
    made.push(...room.adds.slice(before));
  } else {
    for (const x of xs) {
      const f = floorUnder(world, x, boss.y);
      const a = spawnMob(world.map, { mob: def.mob, x, y: f.y });
      a.aggroUntil = world.now + 30;
      world.mobs.push(a);
      made.push(a);
    }
  }
  for (const a of made) {
    // Twins are tougher than the usual add, and wear a ribbon of tether between them.
    a.def = { ...a.def, hp: Math.round(a.def.hp * def.hp), name: def.name.replace(/s$/, '') };
    a.hp = a.def.hp;
    a.twin = true;
  }
  if (mate) made[0].mate = mate;
  return made;
}

export const inRing = (r, body) => Math.abs(body.x - r.x) < r.w / 2 + 4 && Math.abs(body.y - r.y) < 20 && body.onGround !== false;
export const onSeal = (s, body) => s.x != null && Math.abs(body.x - s.x) < 22 && Math.abs(body.y - s.y) < 8 && body.onGround;

// Sides: everyone's side of the boss counts; bots fill the emptier one (you and the tank keep
// yours). `s.side[id]` is where each bot should stand: -1 left, 1 right.
function planSides(world, m, s, members) {
  const count = { '-1': 0, 1: 0 };
  const free = [];
  for (const g of members) {
    if (g.bot && g.role !== 'tank') free.push(g);
    else count[Math.sign(g.body.x - m.x) || 1] += 1;
  }
  free.sort((a, b) => (a.bot.slot ?? 0) - (b.bot.slot ?? 0));
  const before = { ...s.side };
  s.side = {};
  for (const g of free) {
    const keep = before[g.id];
    const side = keep && count[keep] <= count[-keep] ? keep : count[-1] <= count[1] ? -1 : 1;
    s.side[g.id] = side;
    count[side] += 1;
  }
  const moved = free.find((g) => s.side[g.id] !== before[g.id] && Math.sign(g.body.x - m.x) !== s.side[g.id]);
  if (moved) botCall(world, moved, ['ill take the other side!', 'flanking, hit it together', 'going round the back', 'other side, on 3']);
}

// ---------- Hits on a boss ----------

// A hit landing on m (from h.fromX): the guard and armour soften it, and a sides guard notes which
// side it came from. Returns the damage to deal.
export function coopHit(world, m, h) {
  const c = m.coop;
  if (!c || h.miss) return h.damage;
  world.coopFx ??= [];
  let k = 1;
  for (const s of c.mechs) {
    const def = s.def;
    if (def.kind === 'sides') {
      if (s.guard) {
        const side = Math.sign((h.fromX ?? m.x) - m.x);
        if (side) s.hits[side] = world.now;
        if (s.hits[1] != null && s.hits[-1] != null && Math.abs(s.hits[1] - s.hits[-1]) <= def.window) {
          s.guard = false;
          s.openUntil = world.now + def.open;
          shout(world, `${def.name} broken!`, 'Hit it hard while it\'s open');
          world.juice.push({ type: 'shake', mag: 6, dur: 0.45 });
          world.coopFx.push({ kind: 'crack', boss: m.def.id, x: m.x, y: m.y - m.def.h / 2, w: m.def.w, h: m.def.h, t: 0, dur: 0.9 });
          world.hitstop = Math.max(world.hitstop ?? 0, 0.08);
        }
      }
      k *= s.guard ? def.guard : def.broken;
    }
    if (def.kind === 'seal') k *= s.heldBy ? 1 : def.armour;
  }
  return Math.max(1, Math.round(h.damage * k));
}

// ---------- Party members playing the mechanics ----------

function goalAt(world, x, y) {
  const nav = navOf(world.map);
  const i = surfaceBelow(nav, x, y - 4);
  const surf = nav.surfaces[i];
  if (!surf) return null;
  return { x: Math.max(surf.x1 + 8, Math.min(surf.x2 - 8, x)), y: surf.y, mode: 'fight', surface: i, coop: true };
}

// Called every frame after a member's own thinking (world/party.js): where the mechanic needs them
// wins over where they'd go. Dodging a telegraph still comes first.
export function coopSteer(bot, world) {
  const br = bot.brain;
  if (!br || bot.down || !bot.body) return;
  const body = bot.body;
  const boss = coopBosses(world).find((m) => Math.abs(m.x - body.x) < NEAR && Math.abs(m.y - body.y) < 400);
  if (!boss) return;
  if (world.dungeon && dangerFor(world, body)) return;
  let spot = null;
  let target = boss;
  const reach = bot.ai?.weapon?.reach ?? 60;
  for (const s of boss.coop.mechs) {
    const kind = s.def.kind;
    if (kind === 'twins' && s.pair && !s.done) {
      // Balance the blows: hit whichever twin has more life left.
      const live = s.pair.filter((a) => a.hp > 0);
      if (live.length) target = live.reduce((a, b) => (a.hp / a.def.hp >= b.hp / b.def.hp ? a : b));
    }
    if (kind === 'seal' && s.holder === bot.id && s.x != null) spot = { x: s.x, y: s.y };
    if (kind === 'sides' && s.guard && s.side[bot.id] && !spot) {
      const side = s.side[bot.id];
      const dist = Math.min(reach * 0.7, 150) + boss.def.w * 0.25;
      spot = { x: boss.x + side * dist, y: boss.y };
      // On the wrong side and up against it: a hop over its back (a beat of footwork, as you'd
      // jump through it), so the touch doesn't knock them back where they came from.
      const near = Math.abs(body.x - boss.x) < boss.def.w / 2 + 34 && Math.abs(body.y - boss.y) < 30;
      if (near && Math.sign(body.x - boss.x) !== side && body.onGround && !body.rope && world.now >= (bot.hopAt ?? 0)) {
        bot.hopAt = world.now + 3;
        body.vy = -JUMP_SPEED * 0.9;
        body.vx = side * 140;
        body.onGround = false;
        bot.invuln = Math.max(bot.invuln ?? 0, 0.75);
      }
    }
  }
  // The ring beats everything else while it's coming (spread out a little inside it).
  const split = boss.coop.mechs.find((s) => s.def.kind === 'split' && s.ring);
  if (split) {
    const r = split.ring;
    spot = { x: r.x + (((bot.slot ?? 0) % 3) - 1) * r.w * 0.22, y: r.y };
  }
  if (target !== boss && target.hp > 0) br.target = target;
  if (!spot) {
    if (target !== boss && target.hp > 0) spot = { x: target.x + (Math.sign(body.x - target.x) || 1) * Math.min(reach * 0.6, 120), y: target.y };
    else return;
  }
  const was = bot.coopGoal;
  if (!was || Math.abs(was.x - spot.x) > 8 || Math.abs(was.y - spot.y) > 8 || br.goal !== was) {
    const g = goalAt(world, spot.x, spot.y);
    if (!g) return;
    bot.coopGoal = g;
    br.goal = g;
    br.settled = false;
  }
  if (target === boss || target.hp <= 0) br.target = boss;
}

// ---------- Tests and tools ----------

// What a boss's mechanics look like right now, for the tests and the stage tool.
export function coopState(m) {
  return m?.coop?.mechs.map((s) => ({ kind: s.def.kind, name: s.def.name, guard: s.guard, ring: s.ring ? { ...s.ring } : null, seal: s.x != null ? { x: s.x, y: s.y, heldBy: s.heldBy, holder: s.holder } : null, twins: s.pair?.map((a) => a.hp) ?? null, side: { ...s.side } })) ?? [];
}

export const bossName = (id) => MOBS[id]?.name ?? id;

// ---------- Online: friends see the mechanics ----------
// The game that runs a boss (the map's owner, or a shared run's leader) sends what its mechanics
// are doing a few times a second: which ones, where the ring and the seal are, how many stand in
// the ring, who holds the seal, which sides of the guard were struck lately, the twins and their
// tether, and any burst that just went off. A friend's game rebuilds `m.coop` from it on its copy
// of the boss, so the same telegraphs and counts show on every screen (its own step into a ring
// still counts at once). `idOf(m)` names a monster the way the net layer does.

const r1 = (v) => Math.round(v * 10) / 10;

export function coopShared(world, idOf) {
  const list = [];
  for (const m of coopBosses(world)) {
    const near = membersHere(world).filter((g) => Math.abs(g.body.x - m.x) < NEAR && Math.abs(g.body.y - m.y) < 400);
    list.push({
      mob: idOf(m),
      mechs: m.coop.mechs.map((s) => {
        const o = { k: s.def.kind };
        if (s.ring) o.ring = [Math.round(s.ring.x), Math.round(s.ring.y), s.ring.w, r1(s.ring.t), s.ring.warn, near.filter((g) => inRing(s.ring, g.body)).length];
        if (s.def.kind === 'seal' && s.x != null) o.seal = [Math.round(s.x), Math.round(s.y), s.heldBy ? 1 : 0];
        if (s.def.kind === 'sides') o.guard = [s.guard ? 1 : 0, ...[-1, 1].map((d) => (s.hits[d] != null ? r1(Math.min(99, world.now - s.hits[d])) : -1))];
        if (s.pair) o.twins = [...s.pair.map(idOf), s.alone != null ? r1(world.now - s.alone) : -1, s.done ? 1 : 0];
        return o;
      }),
    });
  }
  const fx = (world.coopFx ?? []).filter((f) => !f.shared);
  for (const f of fx) f.shared = true;
  return { list, fx: fx.map((f) => ({ ...f, shared: undefined, x: Math.round(f.x), y: Math.round(f.y) })) };
}

export function applyCoopShared(world, msg) {
  const byId = (id) => world.mobs.find((o) => o.net === id) ?? null;
  const seen = new Set();
  for (const e of msg.list ?? []) {
    const m = byId(e.mob);
    if (!m) continue;
    seen.add(m);
    const defs = mechsFor(world, m);
    const before = m.coop?.mechs ?? [];
    m.coop = {
      mirror: true,
      mechs: e.mechs.map((o, i) => {
        const def = defs.find((d) => d.kind === o.k) ?? { kind: o.k, name: '', window: 1.6, revive: 4 };
        // Keep what the drawing eases (glow, shell, pips) from one message to the next.
        const s = before.find((b) => b.def.kind === o.k) ?? { def, hits: {}, side: {} };
        s.def = def;
        if (o.ring) {
          const [x, y, w, t, warn, n] = o.ring;
          const same = s.ring && Math.abs(s.ring.x - x) < 2 && s.ring.t <= t + 0.5;
          s.ring = { ...(same ? s.ring : {}), x, y, w, t: same ? Math.max(s.ring.t, t) : t, warn, n };
        } else s.ring = null;
        if (o.seal) [s.x, s.y, s.heldBy] = [o.seal[0], o.seal[1], o.seal[2] ? 'friend' : null];
        else if (def.kind === 'seal') s.x = null;
        if (o.guard) {
          s.guard = Boolean(o.guard[0]);
          s.hits = {};
          if (o.guard[1] >= 0) s.hits[-1] = world.now - o.guard[1];
          if (o.guard[2] >= 0) s.hits[1] = world.now - o.guard[2];
        }
        if (o.twins) {
          const pair = [byId(o.twins[0]), byId(o.twins[1])];
          s.pair = pair.every(Boolean) ? pair : null;
          s.alone = o.twins[2] >= 0 ? world.now - o.twins[2] : null;
          s.done = Boolean(o.twins[3]);
        } else if (def.kind === 'twins') s.pair = null;
        return s;
      }),
    };
  }
  // A boss whose mechanics stopped (or that fell) shows none.
  for (const m of world.mobs) if (m.coop?.mirror && !seen.has(m)) m.coop = null;
  world.coopFx ??= [];
  for (const f of msg.fx ?? []) world.coopFx.push({ ...f, shared: true });
}

// Between messages a friend's game runs the shown telegraphs on (the ring filling, bursts fading).
function tickCoopMirror(world, dt) {
  for (const m of world.mobs) for (const s of m.coop?.mechs ?? []) if (s.ring) s.ring.t = Math.min(s.ring.warn, s.ring.t + dt);
  world.coopFx = (world.coopFx ?? []).filter((f) => (f.t += dt) < f.dur);
}
