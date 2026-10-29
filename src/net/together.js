// Playing together in an online room (net/online.js carries the messages): trading, warping to a
// friend, fishing side by side (and the room's catch board), and a returning queen's moves reaching
// everyone on her map. Shared dungeon runs are in net/dungeonrun.js.

import { online, send, othersHere } from './online.js';
import { ITEMS } from '../data/items.js';
import { MAPS } from '../data/maps.js';
import { addItem, removeItem, countItem, TAB_SIZE } from '../core/inventory.js';
import { loadMap, hops } from '../world/world.js';

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
  online.trade = { with: id, mine: { items: [], gold: 0 }, theirs: { items: [], gold: 0 }, ready: { me: false, them: false } };
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
  else if ((msg.op === 'offer' || msg.op === 'ready') && tr?.with === msg.id) {
    tr.theirs = { items: (msg.offer?.items ?? []).filter((o) => (o.inst ? ITEMS[o.inst.id] : ITEMS[o.id]) && tradable(o.inst?.id ?? o.id)), gold: Math.max(0, msg.offer?.gold ?? 0) };
    if (msg.op === 'offer') tr.ready.me = false;
    tr.ready.them = msg.op === 'ready';
    finishIfReady(world);
  }
}

// ---------- Warping to a friend ----------

export const warpCost = (world, g) => 100 + 40 * Math.min(10, hops(world.map.id, g.map) || 1);

// Whether you can warp to friend `g` now, or why not.
export function warpBlocker(world, g) {
  if (!g?.map || !MAPS[g.map]) return 'Not sure where they are';
  if (g.map === world.map.id) return 'Already here';
  if (MAPS[g.map].dungeon || MAPS[g.map].trial || world.dungeon) return 'Busy in a dungeon or trial';
  if (world.dead) return 'Get back up first';
  if (world.char.gold < warpCost(world, g)) return 'Not enough gold';
  return null;
}

export function warpTo(world, g) {
  const why = warpBlocker(world, g);
  if (why) return why;
  world.char.gold -= warpCost(world, g);
  const map = MAPS[g.map];
  const portal = map.portals.find((p) => p.id === 'start') ?? map.portals[0];
  loadMap(world, g.map, portal.id);
  Object.assign(world.body, { x: g.body?.x ?? portal.x, y: (g.body?.y ?? portal.y) - 6, vy: 0, onGround: false });
  world.log(`Whoosh! You warped to ${g.name} in ${map.name}.`, '#bff0dc');
  return null;
}

// ---------- Fishing together ----------
// The room's catch board: the best catches anyone in the room has made (rarest, then biggest).

export function shareCatch(world, fish, size) {
  noteCatch(world.char.name, fish, size);
  send({ t: 'catch', fish: fish.id, name: fish.name, rarity: fish.rarity, size });
}

function noteCatch(who, fish, size) {
  online.catches = [...(online.catches ?? []), { who, name: fish.name, rarity: fish.rarity, size }]
    .sort((a, b) => b.rarity - a.rarity || b.size - a.size)
    .slice(0, 5);
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
  caught(world, fish, size) {
    shareCatch(world, fish, size);
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
      noteCatch(g.name, { name: msg.name, rarity: msg.rarity }, msg.size);
      if (othersHere(world).includes(g) || msg.rarity >= 3) world.log(`${g.name} caught a ${msg.name} (${msg.size} cm)!`, msg.rarity >= 3 ? '#ffe36b' : '#bff0dc');
      return;
    case 'zones':
      return onZones(world, msg);
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
