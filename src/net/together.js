// Playing together in an online room (net/online.js carries the messages): a party of friends,
// looking at a friend's profile, warping to a friend, fishing side by side, and a returning queen's moves reaching
// everyone on her map. Shared dungeon runs are in net/dungeonrun.js.

import { online, send, othersHere } from './online.js';
import { MAPS } from '../data/maps.js';
import { loadMap } from '../world/world.js';

// ---------- A party of friends ----------
// online.party while you're in one: { leader, members: [ids, yours too] }. The leader invites; the
// leader's list is the party (sent to everyone whenever it changes). Party friends show on the
// party panel with their HP and where they are, the warden takes them into dungeons with you, and
// warping to them costs half.

export const ONLINE_PARTY_MAX = 4;

export const inParty = (id) => Boolean(online.party?.members.includes(id));
export const partyFriends = () => (online.party ? online.party.members.filter((id) => id !== online.id).map((id) => online.ghosts.get(id)).filter(Boolean) : []);

// Why you can't invite friend `g` now, or null.
export function partyBlocker(g) {
  if (!g) return 'Not here';
  if (inParty(g.id)) return 'Already in your party';
  if (online.party && online.party.leader !== online.id) return 'Only the leader invites';
  if ((online.party?.members.length ?? 1) >= ONLINE_PARTY_MAX) return 'Your party is full';
  if (online.partyAsked === g.id) return 'Waiting for an answer';
  return null;
}

export function askParty(world, id) {
  const g = online.ghosts.get(id);
  const why = partyBlocker(g);
  if (why) return why;
  online.partyAsked = id;
  send({ t: 'party', to: id, op: 'ask', name: world.char.name });
  world.log(`You invited ${g.name} to your party.`, '#bff0dc');
  return null;
}

export function answerParty(world, yes) {
  const from = online.partyAsk;
  online.partyAsk = null;
  if (!from) return;
  send({ t: 'party', to: from, op: yes ? 'accept' : 'decline' });
}

function shareParty() {
  const p = online.party;
  send({ t: 'party', op: 'roster', leader: p.leader, members: p.members });
}

// You leave (the leader's place passes to the next friend in it).
export function leaveOnlineParty(world, quiet = false) {
  const p = online.party;
  if (!p) return;
  online.party = null;
  const rest = p.members.filter((id) => id !== online.id);
  if (p.leader === online.id) send({ t: 'party', op: 'roster', leader: rest[0] ?? null, members: rest.length > 1 ? rest : [], was: p.leader });
  else send({ t: 'party', to: p.leader, op: 'leave' });
  if (!quiet) world.log('You left the party.', '#d4cbe8');
}

export function kickFromParty(world, id) {
  const p = online.party;
  if (!p || p.leader !== online.id || !inParty(id)) return;
  p.members = p.members.filter((m) => m !== id);
  const name = online.ghosts.get(id)?.name ?? 'They';
  send({ t: 'party', to: id, op: 'kicked' });
  shareParty();
  if (p.members.length < 2) online.party = null;
  world.log(`${name} was removed from the party.`, '#d4cbe8');
}

// The leader drops friends who left the room.
export function tickParty(world) {
  const p = online.party;
  if (!p || p.leader !== online.id) return;
  const here = p.members.filter((id) => id === online.id || online.ghosts.has(id));
  if (here.length === p.members.length) return;
  p.members = here;
  if (here.length < 2) online.party = null;
  else shareParty();
  if (!online.party) send({ t: 'party', op: 'roster', leader: null, members: [], was: online.id });
}

function onParty(world, msg, g) {
  if (msg.to && msg.to !== online.id) return;
  const p = online.party;
  switch (msg.op) {
    case 'ask':
      if (p && p.leader !== msg.id) send({ t: 'party', to: msg.id, op: 'decline', busy: true });
      else if (!p) {
        online.partyAsk = msg.id;
        world.log(`${msg.name} invited you to their party! Open Play with Friends (N) to answer.`, '#ffe36b');
      }
      return;
    case 'accept':
      if (online.partyAsked !== msg.id) return;
      online.partyAsked = null;
      if (partyBlocker(g) && !inParty(msg.id)) return;
      online.party ??= { leader: online.id, members: [online.id] };
      if (!inParty(msg.id)) online.party.members.push(msg.id);
      shareParty();
      world.log(`${g.name} joined your party!`, '#bff0dc');
      return;
    case 'decline':
      online.partyAsked = null;
      world.log(msg.busy ? `${g.name} is already in a party.` : `${g.name} declined your party invite.`, '#ffb3c6');
      return;
    case 'leave':
      if (p?.leader !== online.id || !inParty(msg.id)) return;
      p.members = p.members.filter((id) => id !== msg.id);
      world.log(`${g.name} left the party.`, '#d4cbe8');
      if (p.members.length < 2) {
        online.party = null;
        send({ t: 'party', op: 'roster', leader: null, members: [], was: online.id });
      } else shareParty();
      return;
    case 'kicked':
      if (p?.leader === msg.id) {
        online.party = null;
        world.log(`You were removed from ${g.name}'s party.`, '#d4cbe8');
      }
      return;
    case 'roster': {
      const mine = p && (p.leader === msg.id || p.leader === msg.was);
      if (msg.members.includes(online.id)) {
        const fresh = !p;
        online.party = { leader: msg.leader, members: msg.members };
        if (fresh) world.log(`You joined ${g.name}'s party!`, '#bff0dc');
        else if (msg.leader === online.id && p.leader !== online.id) world.log("You're the party leader now.", '#ffe36b');
      } else if (mine) {
        online.party = null;
        world.log('The party broke up.', '#d4cbe8');
      }
      return;
    }
  }
}

// ---------- Looking at a friend's profile ----------
// Asks a friend's game for their build (level, stats, gear, title), kept on the friend as
// `inspect` for the profile window.

export function askInspect(id) {
  const g = online.ghosts.get(id);
  if (!g || (g.inspectAsked && performance.now() / 1000 - g.inspectAsked < 4)) return;
  g.inspectAsked = performance.now() / 1000;
  send({ t: 'insp', to: id, op: 'ask' });
}

function onInspect(world, msg, g) {
  if (msg.to !== online.id) return;
  if (msg.op === 'ask') {
    const c = world.char;
    send({
      t: 'insp', to: msg.id, op: 'card',
      char: {
        name: c.name, level: c.level, job: c.job, appearance: c.appearance, base: c.base, baseHp: c.baseHp, baseMp: c.baseMp,
        equipment: c.equipment, outfit: c.outfit ?? null, skills: c.skills, buffs: {},
      },
      fish: Object.keys(c.fishBook ?? {}).length, cards: Object.keys(c.book ?? {}).length, hp: c.hp, mp: c.mp,
    });
  } else if (msg.op === 'card' && msg.char?.base && msg.char.equipment) {
    g.inspect = { char: msg.char, fish: msg.fish, cards: msg.cards, hp: msg.hp, mp: msg.mp };
  }
}

// ---------- Warping to a friend ----------

// Whether you can warp to friend `g` now, or why not.
export function warpBlocker(world, g) {
  if (!g?.map || !MAPS[g.map]) return 'Not sure where they are';
  if (g.map === world.map.id) return 'Already here';
  if (MAPS[g.map].dungeon || MAPS[g.map].trial || world.dungeon) return 'Busy in a dungeon or trial';
  if (world.dead) return 'Get back up first';
  return null;
}

export function warpTo(world, g) {
  const why = warpBlocker(world, g);
  if (why) return why;
  const map = MAPS[g.map];
  const portal = map.portals.find((p) => p.id === 'start') ?? map.portals[0];
  loadMap(world, g.map, portal.id);
  Object.assign(world.body, { x: g.body?.x ?? portal.x, y: (g.body?.y ?? portal.y) - 6, vy: 0, onGround: false });
  world.log(`Whoosh! You warped to ${g.name} in ${map.name}.`, '#bff0dc');
  return null;
}

// ---------- A queen's moves reach everyone on her map ----------

export function shareZones(world, zones, callout) {
  send({ t: 'zones', map: world.map.id, callout, list: zones.map((z) => ({ ...z, from: z.from ? z.from.net ?? `${online.id}:${z.from.uid}` : null })) });
}

function onZones(world, msg) {
  if (msg.map !== world.map.id || !world.net?.mirrored(world)) return;
  for (const z of msg.list) {
    const from = z.from ? world.mobs.find((m) => m.net === z.from) ?? null : null;
    world.zones.push({ ...z, from, t: 0, hit: false, after: 0 });
  }
  if (msg.callout) world.callout = { ...msg.callout, at: world.now };
}

// ---------- The world's hooks (merged into world.net) ----------

export const togetherApi = {
  // A catch: friends in the room hear about it.
  caught(world, fish) {
    send({ t: 'catch', fish: fish.id, name: fish.name, rarity: fish.rarity });
  },
  zones(world, zones, callout) {
    shareZones(world, zones, callout);
  },
};

export function handleTogether(world, msg, g) {
  switch (msg.t) {
    case 'catch':
      if (othersHere(world).includes(g) || msg.rarity >= 3) world.log(`${g.name} caught a ${msg.name}!`, msg.rarity >= 3 ? '#ffe36b' : '#bff0dc');
      return;
    case 'zones':
      return onZones(world, msg);
    case 'party':
      return onParty(world, msg, g);
    case 'insp':
      return onInspect(world, msg, g);
    default:
      return onRun(world, msg, g);
  }
}

// Shared dungeon runs plug in here (net/dungeonrun.js sets it; kept on the function itself, which
// exists before either module has finished loading).
export function setRunHandler(fn) {
  setRunHandler.fn = fn;
}
const onRun = (...args) => setRunHandler.fn?.(...args);
