// Running a dungeon together online. The friend who forms the group at the warden leads the run:
// friends standing at the gate with a job come along (bots fill any seats left), and the leader's
// game runs every room's monsters, its tasks, its bosses, and the group's bots. Each friend's game
// shows those monsters and bots, sends its blows, taunts, heals and room tasks to the leader, and
// takes the hits the monsters aim at them (and steps out of the bosses' moves itself).
//
// world.dungeon.shared = { leader } on everyone in the run (the leader's own id there too).

import { online, send } from './online.js';
import { DUNGEONS, ROLES, roleOf } from '../data/dungeons.js';
import { JOBS } from '../data/jobs.js';
import { MAPS } from '../data/maps.js';
import { wornGear } from '../core/character.js';
import { createAnim } from '../render/animator.js';
import { setRunHandler } from './together.js';
import { followerHurt, runHeal, followerRevive, followerWiped, leaderAct, joinRun } from '../world/dungeon.js';

const ROOM_EVERY = 0.25;
const BOTS_EVERY = 1 / 15;

export const inShared = (world) => Boolean(world?.dungeon?.shared);
export const leads = (world) => inShared(world) && world.dungeon.shared.leader === online.id;
const follows = (world) => inShared(world) && !leads(world);

// Friends who'd come along: at the same gate, with a job (role) of their own.
export function friendsAtGate(world) {
  if (online.status !== 'on') return [];
  return [...online.ghosts.values()].filter((g) => g.map === world.map.id && g.job && roleOf(g.job, JOBS[g.job]?.family));
}

// Tells the friends in the group the run has started (the leader's startRun calls it).
export function startShared(world, roles, hard) {
  world.dungeon.shared = { leader: online.id };
  for (const id of Object.keys(roles)) {
    if (!online.ghosts.has(id)) continue;
    send({ t: 'run', op: 'start', to: id, dungeon: world.dungeon.id, roles, hard, leader: online.id, name: world.char.name });
  }
}

// ---------- The world's hooks (merged into world.net) ----------

export const runApi = {
  // Everyone in a shared run on this map besides you: { id, name, role, body, remote } members.
  runMembers(world) {
    if (!inShared(world)) return [];
    const roles = world.dungeon.roles;
    return [...online.ghosts.values()]
      .filter((g) => roles[g.id] && g.map === world.map.id && g.body)
      .map((g) => ({ id: g.id, name: g.name, role: roles[g.id], body: g.body, bot: null, remote: g }));
  },
  isLeader: (world) => leads(world),
  isFollower: (world) => follows(world),
  // A message for one member of the run.
  runTo(world, to, msg) {
    send({ t: 'run', to, ...msg });
  },
  // A message for the leader.
  runLeader(world, msg) {
    send({ t: 'run', to: world.dungeon.shared.leader, ...msg });
  },
  // Every friend in the run (the leader's room state, zones, a wipe).
  runAll(world, msg) {
    send({ t: 'run', map: world.map.id, ...msg });
  },
  runTick(world, dt) {
    tickRun(world, dt);
  },
};

// The leader's game sends the room's state and its bots a few times a second.
function tickRun(world, dt) {
  if (!leads(world)) return;
  const run = world.dungeon;
  run.syncIn = (run.syncIn ?? 0) - dt;
  run.botsIn = (run.botsIn ?? 0) - dt;
  if (run.syncIn <= 0) {
    run.syncIn = ROOM_EVERY;
    const room = run.room;
    send({
      t: 'run', op: 'room', map: world.map.id, cleared: room.cleared, done: run.done, cheer: run.cheer ?? 0,
      objects: room.objects.map((o) => [o.done ? 1 : 0, Math.round((o.progress ?? 0) * 100) / 100]),
      keys: room.keys.map((k) => [Math.round(k.x), Math.round(k.y), k.got ? 1 : 0]), keysGot: room.keysGot,
      walls: room.walls ? [Math.round(room.walls.l), Math.round(room.walls.r)] : null,
      flood: room.flood ? [room.flood.state, Math.round(room.flood.t * 10) / 10] : null,
      dark: Math.max(0, (room.darkUntil ?? 0) - world.now), callout: run.callout,
    });
  }
  if (run.botsIn <= 0) {
    run.botsIn = BOTS_EVERY;
    const bots = (world.bots?.list ?? []).filter((b) => b.party && b.body && b.map === world.map.id);
    send({
      t: 'run', op: 'bots', map: world.map.id,
      list: bots.map((b) => ({
        id: `${online.id}:${b.id}`, name: b.name, level: b.level, job: b.char.job, look: b.char.appearance, gear: wornGear(b.char),
        x: Math.round(b.body.x), y: Math.round(b.body.y), vx: Math.round(b.body.vx), g: b.body.onGround, f: b.body.facing,
        pose: b.attack ? { pose: b.attack.pose, progress: Math.min(1, b.attack.t / b.attack.dur), dur: b.attack.dur } : null,
        hp: b.hp, mhp: b.stats.maxHp, down: b.down, role: run.roles[b.id],
      })),
    });
  }
}

// ---------- Messages ----------

function onRun(world, msg, g) {
  if (msg.t !== 'run') return;
  if (msg.to && msg.to !== online.id) return;
  const run = world.dungeon;
  switch (msg.op) {
    case 'start':
      return joinShared(world, msg);
    case 'hurt':
      if (follows(world)) followerHurt(world, msg);
      return;
    case 'heal':
      if (inShared(world)) runHeal(world, msg);
      return;
    case 'buff':
      if (inShared(world)) world.char.buffs[msg.id] = { until: world.now + msg.duration, since: world.now, values: msg.values, name: msg.name, ...(msg.shield ? { shield: msg.shield } : {}) };
      return;
    case 'revive':
      if (inShared(world)) followerRevive(world, msg.pct);
      return;
    case 'wipe':
      if (follows(world) && msg.map === world.map.id) followerWiped(world);
      return;
    case 'room':
      if (follows(world) && msg.map === world.map.id && run?.room) applyRoom(world, msg);
      return;
    case 'zone':
      if (follows(world) && msg.map === world.map.id) {
        const from = msg.z.from ? world.mobs.find((m) => m.net === msg.z.from) ?? null : null;
        run.zones.push({ ...msg.z, from, t: 0, hit: false, after: 0 });
      }
      return;
    case 'bots':
      if (follows(world) && msg.map === world.map.id) applyBots(world, msg);
      return;
    // From a friend, to the leader: their taunts, hooks, heals, buffs and room tasks.
    case 'provoke':
    case 'hook':
    case 'groupheal':
    case 'groupbuff':
    case 'obj':
      if (leads(world) && msg.map === world.map.id) leaderAct(world, msg, g.id);
      return;
  }
}

// A friend started the run with you in it: you go in with them.
function joinShared(world, msg) {
  if (world.dungeon || MAPS[world.map.id].dungeon) return;
  // The leader's roles, seen from here: the leader by their id, you as 'you'.
  const roles = {};
  for (const [k, v] of Object.entries(msg.roles)) roles[k === 'you' ? msg.leader : k === online.id ? 'you' : k] = v;
  joinRun(world, { ...msg, roles });
  world.log(`${msg.name} formed a group for ${DUNGEONS[msg.dungeon].name}: you're the ${ROLES[roles.you]?.label ?? 'DPS'}!`, '#ffe36b');
}

function applyRoom(world, msg) {
  const room = world.dungeon.room;
  room.cleared = msg.cleared;
  world.dungeon.done = msg.done;
  world.dungeon.cheer = msg.cheer;
  msg.objects.forEach(([done, p], i) => {
    const o = room.objects[i];
    if (!o) return;
    if (done && !o.done) o.done = true;
    o.progress = Math.max(o.progress ?? 0, p);
  });
  room.keys = msg.keys.map(([x, y, got], i) => ({ ...(room.keys[i] ?? { t: 0 }), x, y, got: Boolean(got) }));
  room.keysGot = msg.keysGot;
  room.walls = msg.walls ? { l: msg.walls[0], r: msg.walls[1], toL: msg.walls[0], toR: msg.walls[1] } : null;
  if (msg.flood && room.flood) {
    room.flood.state = msg.flood[0];
    room.flood.t = msg.flood[1];
  }
  room.darkUntil = world.now + msg.dark;
  if (msg.callout) world.dungeon.callout = msg.callout;
}

// The leader's bots, shown like friends.
function applyBots(world, msg) {
  online.botGhosts ??= new Map();
  const seen = new Set();
  for (const b of msg.list) {
    seen.add(b.id);
    let gh = online.botGhosts.get(b.id);
    if (!gh) {
      gh = { id: b.id, anim: createAnim(), body: { x: b.x, y: b.y, vx: 0, vy: 0, onGround: true, rope: null, facing: b.f, w: 22, h: 46 } };
      online.botGhosts.set(b.id, gh);
    }
    Object.assign(gh, { name: b.name, level: b.level, job: b.job, look: b.look, gear: b.gear, map: msg.map, tx: b.x, ty: b.y, hp: b.hp, maxHp: b.mhp, dead: b.down, bot: true, role: b.role, poseAt: performance.now() / 1000 });
    Object.assign(gh.body, { vx: b.vx, onGround: b.g, facing: b.f });
    gh.pose = b.pose ?? (!b.g ? { pose: 'jump' } : Math.abs(b.vx) > 8 ? { pose: 'walk' } : { pose: 'idle' });
  }
  for (const id of online.botGhosts.keys()) if (!seen.has(id)) online.botGhosts.delete(id);
}

// The leader's bots on your map (for drawing), gliding toward where the leader said they are.
export function botsHere(world, dt = 0) {
  if (!follows(world) || !online.botGhosts) return [];
  const k = Math.min(1, dt * 16);
  const list = [...online.botGhosts.values()].filter((b) => b.map === world.map.id);
  for (const b of list) {
    if (Math.abs(b.tx - b.body.x) > 80) b.body.x = b.tx;
    b.body.x += (b.tx - b.body.x) * k;
    b.body.y += (b.ty - b.body.y) * k;
  }
  return list;
}

setRunHandler(onRun);
