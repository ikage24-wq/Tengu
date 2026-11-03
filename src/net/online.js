// Online party play: up to four friends in one room (see link.js). Each player runs their own
// hero exactly as in single player and tells the others where they are and what move they're in,
// so everyone sees everyone. Monsters belong to one player per map (whoever got there first): that
// player's game moves them and sends their state out; the others show those monsters and send
// their hits back to it. A monster's fall gives everyone on the map their share (full EXP to
// those who hit it, a party share to the rest), and each player rolls their own loot.

import { openLink, newCode } from './link.js';
import { spawnMob, hitMob } from '../world/mobs.js';
import { MOBS } from '../data/mobs.js';
import { wornGear } from '../core/character.js';
import { gaugeOf, inForm } from '../world/melee.js';
import { killMob, hurtPlayer } from '../world/world.js';
import { playerPose } from '../render/scene.js';
import { createAnim } from '../render/animator.js';
import { handleTogether, togetherApi, tickParty } from './together.js';
import { runApi, friendsAtGate, startShared } from './dungeonrun.js';
import { noteHit } from '../world/dungeon.js';

export const ROOM_MAX = 4;
const SEND_EVERY = 1 / 20;
const MOBS_EVERY = 1 / 10;
const PROFILE_EVERY = 1.5;
const GONE_AFTER = 10;

// The one session for this tab (a player is in at most one room).
export const online = {
  status: 'off', // off | connecting | on
  code: null,
  host: false,
  id: null,
  link: null,
  error: null,
  order: [], // the host first, then guests in the order they joined
  ghosts: new Map(), // everyone else, by id
  outbox: [],
  sendIn: 0,
  mobsIn: 0,
  profileIn: 0,
  claim: null, // the map whose monsters this game runs for the room
  world: null,
};

export const isOnline = () => online.status === 'on';
// Dungeon runs and the queens' trial arenas are each player's own.
const solo = (world) => Boolean(world.dungeon || world.map?.trial);

function reset() {
  const w = online.world;
  // Back on your own: the monsters you were shown become yours.
  if (w?.mirror?.endsWith(`@${w.map.id}`)) adopt(w);
  if (w) w.mirror = null;
  online.status = 'off';
  online.code = null;
  online.host = false;
  online.id = null;
  online.link = null;
  online.order = [];
  online.ghosts.clear();
  online.outbox = [];
  online.claim = null;
  online.party = null;
  online.partyAsk = online.partyAsked = null;
  online.joinAsk = online.joinAsked = null;
  online.rosters = null;
  online.trade = null;
  if (online.world) online.world.net = null;
}

export function send(msg) {
  if (online.status !== 'on' && msg.t !== 'hi') return;
  online.link?.send({ ...msg, id: online.id });
}

export function hostRoom(world) {
  if (online.status !== 'off') return;
  online.error = null;
  online.status = 'connecting';
  online.host = true;
  online.code = newCode();
  online.world = world;
  online.link = openLink(online.code, true, handlers(world));
}

export function joinRoom(world, code) {
  if (online.status !== 'off') return;
  online.error = null;
  online.status = 'connecting';
  online.host = false;
  online.code = code;
  online.world = world;
  online.link = openLink(code, false, handlers(world));
}

export function leaveRoom(world, why = null) {
  if (online.status === 'off') return;
  send({ t: 'bye' });
  online.link?.close();
  reset();
  online.error = why;
  world?.log(why ? `Left the room: ${why}.` : 'You left the room.', '#d4cbe8');
}

function handlers(first) {
  const w = () => online.world ?? first;
  return {
    onReady() {
      const world = w();
      online.id = online.link.id;
      online.status = 'on';
      online.order = online.host ? [online.id] : [];
      world.net = fullApi();
      world.char.playedOnline = true;
      if (online.host) world.log(`Room ${online.code} is open! Friends join with this code.`, '#bff0dc');
      else send({ t: 'hi', name: world.char.name });
      sendProfile(world);
    },
    onPeer(id, joined) {
      if (!online.host || joined) return;
      // A guest dropped out.
      const g = online.ghosts.get(id);
      online.order = online.order.filter((o) => o !== id);
      online.ghosts.delete(id);
      if (g) w().log(`${g.name} left the room.`, '#d4cbe8');
      send({ t: 'roster', order: online.order, gone: id });
    },
    onClose(why) {
      const was = online.status;
      online.link = null;
      reset();
      online.error = why;
      w().log(was === 'on' ? `Disconnected: ${why}.` : `Couldn't connect: ${why}.`, '#ffb3c6');
    },
    onMessage(msg) {
      receive(w(), msg);
    },
  };
}

// ---------- Hooks the world calls (world.net) ----------

const api = {
  // Whether this game runs the monsters on the map it's on.
  owns(world) {
    return !api.mirrored(world);
  },
  // Whether the monsters here are another player's, shown in this game.
  mirrored(world) {
    return !solo(world) && online.claim !== world.map.id && Boolean(world.mirror?.endsWith(`@${world.map.id}`));
  },
  // The player a monster chases: whoever's nearest of everyone on the map.
  target(world, m) {
    let best = world.body;
    let d = Math.abs(world.body.x - m.x) + (world.dead ? 1e6 : 0);
    for (const g of othersHere(world)) {
      if (g.dead) continue;
      const e = Math.abs(g.body.x - m.x) + Math.abs(g.body.y - m.y) * 0.5;
      if (e < d) {
        d = e;
        best = g.body;
      }
    }
    return best;
  },
  bodies(world) {
    return othersHere(world).map((g) => g.body);
  },
  // Your blow on a monster this game only shows: the game that runs it takes the real hit.
  hit(world, m, h) {
    m.mine = true;
    if (api.owns(world)) return;
    send({ t: 'hit', map: world.map.id, mob: netId(m), d: h.damage, x: Math.round(h.fromX), k: h.knock ?? 90, l: h.launch ?? 0, fr: h.freeze, st: h.stun, sn: h.snare, dot: h.poison ?? h.bleed ?? h.burn, dk: h.bleed ? 'bleed' : h.burn ? 'burn' : 'poison' });
  },
  // A monster fell in this game: everyone else on the map gets their share.
  killed(world, m) {
    m.credited = true;
    if (m.byNet) return;
    send({ t: 'dead', map: world.map.id, mob: netId(m), def: m.def.id, x: Math.round(m.x), y: Math.round(m.y) });
  },
  // A monster this game only shows: glide it toward where its owner last said it was.
  step(m, dt) {
    m.flash = Math.max(0, m.flash - dt);
    m.age += dt;
    if (m.hp <= 0) {
      m.dying += dt;
      return;
    }
    if (!(m.frozenUntil > (online.world?.now ?? 0))) m.phase += dt;
    const k = Math.min(1, dt * 14);
    if (m.tx != null) {
      m.x += (m.tx - m.x) * k;
      m.y += (m.ty - m.y) * k;
      m.air = (m.air ?? 0) + ((m.tair ?? 0) - (m.air ?? 0)) * k;
    }
  },
  chat(words) {
    send({ t: 'chat', text: words });
  },
};
// The rest of what the world tells the room (net/together.js, net/dungeonrun.js), merged in on
// first use (those modules load alongside this one).
let merged = false;
function fullApi() {
  if (!merged) {
    Object.assign(api, togetherApi, runApi, { friendsAtGate, startShared });
    merged = true;
  }
  return api;
}

// Everyone else in the room on your map (no one shares a dungeon run).
export function othersHere(world) {
  if (!isOnline() || !world || solo(world)) return [];
  return [...online.ghosts.values()].filter((g) => g.map === world.map.id && g.body);
}

function netId(m) {
  m.net ??= `${online.id}:${m.uid}`;
  return m.net;
}

// ---------- Every frame ----------

export function tickNet(world, dt) {
  if (online.world !== world) {
    // A new character (or back from the title) while still in a room: the room follows them.
    if (online.status === 'off') return;
    online.world = world;
    world.net = online.status === 'on' ? fullApi() : null;
  }
  if (online.status !== 'on') return;
  updateClaim(world);
  smoothGhosts(world, dt);
  online.sendIn -= dt;
  online.mobsIn -= dt;
  online.profileIn -= dt;
  if (online.profileIn <= 0) sendProfile(world);
  if (online.sendIn <= 0) {
    online.sendIn = SEND_EVERY;
    sendMe(world);
  }
  fullApi().runTick(world, dt);
  tickParty(world);
  if (online.mobsIn <= 0 && online.claim === world.map.id && othersHere(world).length) {
    online.mobsIn = MOBS_EVERY;
    sendMobs(world);
  }
  // Those who stop talking are gone.
  const now = performance.now() / 1000;
  for (const [id, g] of online.ghosts) if (now - g.seen > GONE_AFTER) online.ghosts.delete(id);
}

// Who runs this map's monsters: whoever already does; if no one, the first of us to arrive (the
// earlier in the room's order if two arrive at once). `world.mirror` names whose monsters this
// game is showing ('id@map') while it isn't running them itself.
function updateClaim(world) {
  const map = world.map.id;
  const here = `@${map}`;
  // A shared dungeon run: the leader runs every room.
  if (world.dungeon?.shared) {
    const leader = world.dungeon.shared.leader;
    if (leader === online.id) {
      online.claim = map;
      world.mirror = null;
    } else {
      online.claim = null;
      if (world.mirror !== leader + here) {
        world.mobs = [];
        world.mirror = leader + here;
      }
    }
    return;
  }
  if (solo(world)) {
    online.claim = null;
    return;
  }
  const rank = (id) => {
    const i = online.order.indexOf(id);
    return i < 0 ? 99 : i;
  };
  const rival = othersHere(world).find((g) => g.claim === map);
  const owner = online.claim === map;
  if (rival && (!owner || rank(rival.id) < rank(online.id))) {
    const key = rival.id + here;
    if (world.mirror !== key) {
      // Someone else runs these monsters: drop the ones this game was running (keeping those
      // already shown from a player who ran them before).
      const keep = world.mirror?.endsWith(here);
      world.mobs = keep ? world.mobs.filter((m) => m.net && !m.net.startsWith(`${online.id}:`)) : [];
      world.mirror = key;
    }
    online.claim = null;
    return;
  }
  if (!owner) {
    if (world.mirror?.endsWith(here)) adopt(world);
    world.mirror = null;
    online.claim = map;
  }
}

// Taking over a map's monsters from a player who left it: the monsters on screen become this
// game's, filling its spawn points so they come back as usual when they fall.
function adopt(world) {
  const free = world.mobs.filter((m) => m.hp > 0);
  for (const slot of world.spawner.slots) {
    const i = free.findIndex((m) => m.def.id === slot.spawn.mob);
    if (i >= 0) {
      slot.mob = free[i];
      slot.respawnAt = 0;
      free.splice(i, 1);
    } else {
      slot.mob = { hp: 0 };
      slot.respawnAt = 0;
    }
  }
}

function sendProfile(world) {
  online.profileIn = PROFILE_EVERY;
  const c = world.char;
  send({ t: 'prof', name: c.name, look: c.appearance, gear: wornGear(c), job: c.job, level: c.level });
}

function sendMe(world) {
  const b = world.body;
  const c = world.char;
  const p = playerPose(world);
  const gauge = gaugeOf(c);
  const buffs = {};
  for (const [id, bf] of Object.entries(c.buffs)) buffs[id] = { ...bf, until: bf.until - world.now };
  send({
    t: 'me', map: world.map.id, claim: online.claim,
    x: round(b.x), y: round(b.y), vx: round(b.vx), vy: round(b.vy), g: b.onGround, r: Boolean(b.rope), f: b.facing,
    p, hurt: world.invuln > 0.6 && !world.pose, dead: world.dead,
    hp: c.hp, mhp: world.stats.maxHp,
    gauge, gk: gauge ? (inForm(world) ? 1 : (world[gauge] ?? 0) / 100) : 0, form: inForm(world),
    buffs, emote: world.emote?.face ?? null,
    // Fishing: where their bobber is and how it's going.
    fish: world.fishing ? { bx: world.fishing.spot.bx, by: world.fishing.spot.by, face: world.fishing.spot.face, phase: world.fishing.phase } : null,
    fx: takeFx(world), nums: takeNumbers(world),
  });
}

const round = (v) => Math.round(v * 10) / 10;

// The effects and damage numbers this game made since the last message, to show the others.
function takeFx(world) {
  const out = [];
  for (const f of world.fx) {
    if (f._n) continue;
    f._n = true;
    if (f._remote) continue;
    try {
      out.push(JSON.parse(JSON.stringify(f, fxReplacer)));
    } catch {
      // Something in it doesn't travel; skip it.
    }
  }
  return out;
}
function fxReplacer(key, v) {
  if (key === '_n') return undefined;
  if (v && typeof v === 'object' && v.def && v.uid != null) return { __mob: netId(v) };
  if (typeof v === 'function') return undefined;
  return v;
}

function takeNumbers(world) {
  const out = [];
  for (const n of world.numbers) {
    if (n._n) continue;
    n._n = true;
    if (n._remote || /EXP/.test(n.text)) continue;
    out.push({ x: round(n.x), y: round(n.y), text: n.text, color: n.color, crit: n.crit, small: n.small, weight: n.weight });
  }
  return out;
}

function sendMobs(world) {
  const now = world.now;
  const list = world.mobs.map((m) => [
    netId(m), m.def.id, round(m.spawn.x), round(m.spawn.y), round(m.x), round(m.y), m.hp, m.dir, m.state,
    round(m.air ?? 0), round(m.flash), round(m.stagger), round(m.special?.warn ?? 0),
    round(Math.max(0, (m.frozenUntil ?? 0) - now)), m.hold ?? null, round(m.dying), round(Math.max(0, m.aggroUntil - now)),
    round(now - (m.attackAt ?? -99)), round(now - (m.gloatAt ?? -99)),
    // In a dungeon: a wind-up, a shield, a charge, the open heart.
    world.dungeon ? [round(m.windup ?? 0), m.shield ? 1 : 0, m.charging?.dir ?? 0, m.heartOpen ? 1 : 0, m.engaged ? 1 : 0] : null,
  ]);
  send({ t: 'mobs', map: world.map.id, list });
}

// ---------- Messages from the others ----------

function ghostOf(id) {
  let g = online.ghosts.get(id);
  if (!g) {
    g = { id, name: '...', map: null, body: null, anim: createAnim(), seen: 0, buffs: {}, fx: [] };
    online.ghosts.set(id, g);
  }
  g.seen = performance.now() / 1000;
  return g;
}

function receive(world, msg) {
  if (!msg?.id || msg.id === online.id) return;
  switch (msg.t) {
    case 'hi': {
      if (!online.host) return;
      if (!online.order.includes(msg.id)) {
        if (online.order.length >= ROOM_MAX) {
          online.link.sendTo(msg.id, { t: 'full', id: online.id });
          return;
        }
        online.order.push(msg.id);
        world.log(`${msg.name} joined the room!`, '#bff0dc');
      }
      ghostOf(msg.id).name = msg.name;
      send({ t: 'roster', order: online.order });
      sendProfile(world);
      return;
    }
    case 'full':
      leaveRoom(world, 'That room is full');
      return;
    case 'roster': {
      const before = new Set(online.order);
      online.order = msg.order;
      if (msg.gone) {
        const g = online.ghosts.get(msg.gone);
        if (g) world.log(`${g.name} left the room.`, '#d4cbe8');
        online.ghosts.delete(msg.gone);
      }
      if (!before.size && online.order.includes(online.id)) world.log(`You joined room ${online.code}!`, '#bff0dc');
      return;
    }
    case 'bye': {
      const g = online.ghosts.get(msg.id);
      online.ghosts.delete(msg.id);
      online.order = online.order.filter((o) => o !== msg.id);
      if (g) world.log(`${g.name} left the room.`, '#d4cbe8');
      if (online.host) send({ t: 'roster', order: online.order });
      return;
    }
    case 'prof': {
      const g = ghostOf(msg.id);
      const fresh = g.name === '...';
      Object.assign(g, { name: msg.name, look: msg.look, gear: msg.gear, job: msg.job, level: msg.level });
      if (fresh && !online.host) world.log(`${msg.name} is in the room.`, '#bff0dc');
      return;
    }
    case 'me':
      return onMe(world, msg);
    case 'mobs':
      return onMobs(world, msg);
    case 'hit':
      return onHit(world, msg);
    case 'dead':
      return onDead(world, msg);
    case 'chat': {
      const g = ghostOf(msg.id);
      const words = String(msg.text).slice(0, 80);
      g.bubble = { text: words, t: 5 };
      world.log(`${g.name}: ${words}`, '#ffffff');
      return;
    }
    default:
      // Trading, catches, queens' moves, shared dungeon runs (net/together.js).
      handleTogether(world, msg, ghostOf(msg.id));
  }
}

function onMe(world, msg) {
  const g = ghostOf(msg.id);
  const moved = g.map !== msg.map;
  g.map = msg.map;
  g.claim = msg.claim;
  if (!g.body || moved) {
    g.body = { x: msg.x, y: msg.y, vx: 0, vy: 0, onGround: true, rope: null, facing: msg.f, w: 22, h: 46 };
    g.anim = createAnim();
  }
  g.tx = msg.x;
  g.ty = msg.y;
  Object.assign(g.body, { vx: msg.vx, vy: msg.vy, onGround: msg.g, rope: msg.r ? {} : null, facing: msg.f });
  g.pose = msg.p;
  g.poseAt = performance.now() / 1000;
  g.hurt = msg.hurt;
  g.dead = msg.dead;
  g.hp = msg.hp;
  g.maxHp = msg.mhp;
  g.gauge = msg.gauge;
  g.gk = msg.gk;
  g.form = msg.form;
  g.emote = msg.emote;
  g.fish = msg.fish ?? null;
  g.buffs = {};
  for (const [id, b] of Object.entries(msg.buffs ?? {})) g.buffs[id] = { ...b, until: world.now + b.until };
  if (msg.map !== world.map.id || solo(world)) return;
  for (const f of msg.fx ?? []) {
    reviveFx(world, f);
    f._remote = true;
    f._n = true;
    // Effects that ride along with their hero follow that player here.
    if (f.follow) {
      delete f.follow;
      f.ghost = msg.id;
    }
    world.fx.push(f);
    // A boss slam reaches you too.
    if (f.kind === 'slam') slamHere(world, f);
  }
  for (const n of msg.nums ?? []) world.numbers.push({ ...n, t: 0, party: true, _remote: true, _n: true });
}

function reviveFx(world, f) {
  for (const [k, v] of Object.entries(f)) {
    if (v && typeof v === 'object' && v.__mob) {
      const m = world.mobs.find((o) => o.net === v.__mob || `${online.id}:${o.uid}` === v.__mob);
      if (m) f[k] = m;
      else delete f[k];
    }
  }
}

function slamHere(world, f) {
  const b = world.body;
  const m = world.mobs.find((o) => Math.abs(o.x - f.x) < 4 && o.def.special);
  const onFloor = b.onGround && b.surface?.ground;
  if (m && onFloor && Math.abs(b.x - f.x) < (f.range ?? 0) && !world.dead) hurtPlayer(world, m.def.special.damage, f.x);
}

function onMobs(world, msg) {
  if (msg.map !== world.map.id || solo(world) || online.claim === world.map.id) return;
  if (world.mirror !== `${msg.id}@${world.map.id}`) return;
  const mine = new Map(world.mobs.filter((m) => m.net).map((m) => [m.net, m]));
  const now = world.now;
  const next = [];
  for (const e of msg.list) {
    const [id, mobId, sx, sy, x, y, hp, dir, state, air, flash, stagger, warn, frozen, hold, dying, aggro, attackAgo, gloatAgo, dg] = e;
    let m = mine.get(id);
    if (!m) {
      if (!MOBS[mobId]) continue;
      m = spawnMob(world.map, { mob: mobId, x: sx, y: sy });
      m.net = id;
      m.x = x;
      m.y = y;
      m.air = air;
      m.hp = hp;
      m.dying = dying;
    }
    m.tx = x;
    m.ty = y;
    m.tair = air;
    m.dir = dir;
    m.state = state;
    m.flash = Math.max(m.flash, flash);
    m.stagger = stagger;
    if (m.special) m.special.warn = warn;
    m.frozenUntil = frozen > 0 ? now + frozen : 0;
    m.hold = hold;
    m.aggroUntil = now + aggro;
    m.attackAt = now - attackAgo;
    m.gloatAt = now - gloatAgo;
    if (dg) [m.windup, m.shield, m.chargeDir, m.heartOpen, m.engaged] = [dg[0], Boolean(dg[1]), dg[2], Boolean(dg[3]), Boolean(dg[4])];
    // A monster you saw fall stays down, even if the word hasn't reached its owner yet.
    if (!(m.hp <= 0 && m.credited)) {
      const fell = m.hp > 0 && hp <= 0;
      m.hp = hp;
      if (hp <= 0) m.dying = Math.max(m.dying, dying);
      // It fell to a blow from someone else: if you hit it too, it's your kill as well.
      if (fell && m.mine && !m.credited) killMob(world, m);
    }
    next.push(m);
  }
  // Ones you just felled locally keep fading out.
  for (const m of world.mobs) if (m.hp <= 0 && m.dying < 0.5 && !next.includes(m)) next.push(m);
  world.mobs = next;
}

function onHit(world, msg) {
  if (msg.map !== world.map.id || online.claim !== world.map.id) return;
  const m = world.mobs.find((o) => netId(o) === msg.mob);
  if (!m || m.hp <= 0) return;
  // The same hit the player saw land in their own game: knockback, launch, holds and burns. In a
  // shared dungeon run it also stirs the monster's anger at them.
  const dmg = world.dungeon ? noteHit(world, m, { damage: msg.d, party: msg.id, fromX: msg.x }) : msg.d;
  if (hitMob(m, dmg, msg.x, world.now, { knock: msg.k, launch: msg.l })) {
    // Whoever struck the last blow tells everyone it fell (see 'dead'); this game only shares in
    // it, unless it hit the monster too.
    if (m.mine) killMob(world, m);
    return;
  }
  const hold = msg.fr || msg.st || msg.sn;
  if (hold) {
    if (!(m.frozenUntil > world.now)) m.hold = msg.fr ? 'ice' : msg.st ? 'stun' : 'snare';
    m.frozenUntil = Math.max(m.frozenUntil ?? 0, world.now + (m.def.boss ? hold / 2 : hold));
  }
  if (msg.dot) m.poison = { until: world.now + msg.dot.secs, dmg: Math.max(1, Math.round(msg.d * msg.dot.pct)), tick: m.poison?.tick ?? 1, kind: msg.dk };
}

function onDead(world, msg) {
  if (msg.map !== world.map.id || solo(world)) return;
  let m = world.mobs.find((o) => netId(o) === msg.mob || o.net === msg.mob);
  if (m?.credited) return;
  if (!m) {
    // Already gone here: still share in it.
    if (!MOBS[msg.def]) return;
    m = { def: MOBS[msg.def], x: msg.x, y: msg.y, hp: 0, dying: 0.5 };
  }
  m.hp = 0;
  m.byNet = true;
  // (A party friend's kill shows as theirs on your quest tracker.)
  if (online.party?.members.includes(msg.id)) m.killedByName = online.ghosts.get(msg.id)?.name ?? null;
  killMob(world, m, !m.mine);
}

// ---------- Others on screen ----------

function smoothGhosts(world, dt) {
  const k = Math.min(1, dt * 16);
  for (const g of online.ghosts.values()) {
    if (!g.body || g.tx == null) continue;
    // Carry on along their last speed between messages, then ease onto where they really are.
    const b = g.body;
    g.tx += (b.vx ?? 0) * dt * 0.5;
    if (Math.abs(g.tx - b.x) > 80 || Math.abs(g.ty - b.y) > 80) {
      b.x = g.tx;
      b.y = g.ty;
    } else {
      b.x += (g.tx - b.x) * k;
      b.y += (g.ty - b.y) * k;
    }
    if (g.bubble) {
      g.bubble.t -= dt;
      if (g.bubble.t <= 0) g.bubble = null;
    }
  }
  for (const f of world.fx) {
    if (!f.ghost) continue;
    const g = online.ghosts.get(f.ghost);
    if (!g?.body) continue;
    f.dir = g.body.facing;
    f.x = g.body.x + f.dir * (f.ahead ?? 0);
    f.y = g.body.y;
  }
}

// Where the ghost's move is now: the pose they sent, run on by the time since.
export function ghostPose(g) {
  const p = g.pose ?? { pose: 'idle' };
  if (p.progress == null || !p.dur) return p;
  const since = performance.now() / 1000 - (g.poseAt ?? 0);
  return { ...p, progress: Math.min(1, p.progress + since / p.dur) };
}
