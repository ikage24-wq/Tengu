// Playing together in an online room (net/online.js carries the messages): a party of friends,
// looking at a friend's profile, trading, warping to a friend, fishing side by side, and a returning queen's moves reaching
// everyone on her map. Shared dungeon runs are in net/dungeonrun.js.

import { online, send, othersHere } from './online.js';
import { ITEMS } from '../data/items.js';
import { MAPS } from '../data/maps.js';
import { addItem, removeItem, countItem, TAB_SIZE } from '../core/inventory.js';
import { loadMap } from '../world/world.js';
import { titleOf } from '../core/collection.js';

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
      title: titleOf(c), fish: Object.keys(c.fishBook ?? {}).length, cards: Object.keys(c.book ?? {}).length,
      achievements: Object.values(c.achievements ?? {}).filter(Boolean).length, hp: c.hp, mp: c.mp,
    });
  } else if (msg.op === 'card' && msg.char?.base && msg.char.equipment) {
    g.inspect = { char: msg.char, title: msg.title, fish: msg.fish, cards: msg.cards, achievements: msg.achievements, hp: msg.hp, mp: msg.mp };
  }
}

// ---------- Trading ----------
// online.trade while one is open: { with, mine: { items, gold }, theirs: { items, gold },
// ready: { me, them } }. An item in an offer is { tab, uid } for gear (the whole piece) or
// { tab, id, qty } for stackables. Any change to either offer takes both Ready marks off; when
// both are ready, each game makes the swap on its own side.

export const TRADE_SLOTS = 6;

const tradable = (id) => {
  const d = ITEMS[id];
  return d && !d.quest && d.type !== 'cash';
};

export function askTrade(world, id) {
  if (online.trade) return;
  online.tradeAsked = id;
  send({ t: 'trade', to: id, op: 'ask', name: world.char.name });
  world.log(`You asked ${online.ghosts.get(id)?.name ?? 'them'} to trade.`, '#bff0dc');
}

export function answerTrade(world, yes) {
  const from = online.tradeAsk;
  online.tradeAsk = null;
  if (!from) return;
  send({ t: 'trade', to: from, op: yes ? 'accept' : 'decline' });
  if (yes) openTrade(from);
}

function openTrade(id) {
  online.trade = { with: id, mine: { items: [], gold: 0 }, theirs: { items: [], gold: 0 }, ready: { me: false, them: false }, chat: [] };
}

// The trade's own chat: just between the two of you, shown in the trade window.
const TRADE_CHAT = 30;
export function tradeSay(world, words) {
  const tr = online.trade;
  if (!tr) return;
  words = words.slice(0, 80);
  noteSay(tr, world.char.name, words, true);
  send({ t: 'trade', to: tr.with, op: 'say', text: words });
}

function noteSay(tr, who, words, mine) {
  tr.chat.push({ who, text: words, mine });
  if (tr.chat.length > TRADE_CHAT) tr.chat.shift();
}

export function cancelTrade(world, quiet = false) {
  const tr = online.trade;
  if (!tr) return;
  online.trade = null;
  if (!quiet) send({ t: 'trade', to: tr.with, op: 'cancel' });
  world.log('The trade was called off.', '#d4cbe8');
}

// Puts something from your bag in your offer (one of a stack at a time; a gear piece whole).
export function offerItem(world, tab, entry, all = false) {
  const tr = online.trade;
  if (!tr || !tradable(entry.id) || tr.mine.items.length >= TRADE_SLOTS && !tr.mine.items.some((o) => o.id === entry.id && !o.uid)) return;
  if (tab === 'equip') {
    if (tr.mine.items.some((o) => o.uid === entry.uid)) return;
    tr.mine.items.push({ tab, uid: entry.uid, id: entry.id });
  } else {
    const have = countItem(world.char.inventory, entry.id);
    const o = tr.mine.items.find((x) => x.id === entry.id && !x.uid);
    const now = o ? o.qty : 0;
    const add = Math.min(have - now, all ? have : 1);
    if (add <= 0) return;
    if (o) o.qty += add;
    else tr.mine.items.push({ tab, id: entry.id, qty: add });
  }
  changed(world);
}

export function takeBack(world, i) {
  const tr = online.trade;
  if (!tr) return;
  tr.mine.items.splice(i, 1);
  changed(world);
}

export function offerGold(world, n) {
  const tr = online.trade;
  if (!tr) return;
  tr.mine.gold = Math.max(0, Math.min(world.char.gold, n));
  changed(world);
}

// What an offer looks like to the other side: gear goes as the whole piece.
function wire(world, offer) {
  return {
    gold: offer.gold,
    items: offer.items.map((o) => (o.uid ? { tab: 'equip', inst: world.char.inventory.equip.find((e) => e.uid === o.uid) } : { tab: o.tab, id: o.id, qty: o.qty })).filter((o) => o.inst || o.id),
  };
}

function changed(world) {
  const tr = online.trade;
  tr.ready.me = false;
  tr.ready.them = false;
  send({ t: 'trade', to: tr.with, op: 'offer', offer: wire(world, tr.mine) });
}

export function setReady(world) {
  const tr = online.trade;
  if (!tr) return;
  // Room in your bag for what's coming?
  const gear = tr.theirs.items.filter((o) => o.tab === 'equip').length - tr.mine.items.filter((o) => o.uid).length;
  if (world.char.inventory.equip.length + gear > TAB_SIZE) {
    world.log('Make room in your Equip bag first.', '#ffb3c6');
    return;
  }
  tr.ready.me = true;
  send({ t: 'trade', to: tr.with, op: 'ready', offer: wire(world, tr.mine) });
  finishIfReady(world);
}

function finishIfReady(world) {
  const tr = online.trade;
  if (!tr?.ready.me || !tr.ready.them) return;
  const inv = world.char.inventory;
  // Yours goes...
  for (const o of tr.mine.items) {
    if (o.uid) {
      const i = inv.equip.findIndex((e) => e.uid === o.uid);
      if (i >= 0) inv.equip.splice(i, 1);
    } else removeItem(inv, o.id, o.qty);
  }
  world.char.gold -= tr.mine.gold;
  // ...and theirs comes in.
  for (const o of tr.theirs.items) {
    if (o.inst) addItem(inv, { ...o.inst, uid: Date.now() * 100 + Math.floor(Math.random() * 100) });
    else addItem(inv, o.id, o.qty);
  }
  world.char.gold += tr.theirs.gold;
  const name = online.ghosts.get(tr.with)?.name ?? 'your friend';
  world.log(`Trade with ${name} done!`, '#ffe36b');
  online.trade = null;
}

function onTrade(world, msg, g) {
  if (msg.to !== online.id) return;
  const tr = online.trade;
  if (msg.op === 'ask') {
    if (tr) send({ t: 'trade', to: msg.id, op: 'decline' });
    else {
      online.tradeAsk = msg.id;
      world.log(`${msg.name} wants to trade! Open Play with Friends (N) to answer.`, '#ffe36b');
    }
  } else if (msg.op === 'accept' && online.tradeAsked === msg.id) {
    online.tradeAsked = null;
    openTrade(msg.id);
    world.log(`${g.name} said yes: trade away!`, '#bff0dc');
  } else if (msg.op === 'decline') {
    online.tradeAsked = null;
    world.log(`${g.name} can't trade right now.`, '#ffb3c6');
  } else if (msg.op === 'cancel' && tr?.with === msg.id) cancelTrade(world, true);
  else if (msg.op === 'say' && tr?.with === msg.id) noteSay(tr, g.name, String(msg.text).slice(0, 80), false);
  else if ((msg.op === 'offer' || msg.op === 'ready') && tr?.with === msg.id) {
    tr.theirs = { items: (msg.offer?.items ?? []).filter((o) => (o.inst ? ITEMS[o.inst.id] : ITEMS[o.id]) && tradable(o.inst?.id ?? o.id)), gold: Math.max(0, msg.offer?.gold ?? 0) };
    if (msg.op === 'offer') tr.ready.me = false;
    tr.ready.them = msg.op === 'ready';
    finishIfReady(world);
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
  caught(world, fish, size) {
    send({ t: 'catch', fish: fish.id, name: fish.name, rarity: fish.rarity, size });
  },
  zones(world, zones, callout) {
    shareZones(world, zones, callout);
  },
};

export function handleTogether(world, msg, g) {
  switch (msg.t) {
    case 'trade':
      return onTrade(world, msg, g);
    case 'catch':
      if (othersHere(world).includes(g) || msg.rarity >= 3) world.log(`${g.name} caught a ${msg.name} (${msg.size} cm)!`, msg.rarity >= 3 ? '#ffe36b' : '#bff0dc');
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
