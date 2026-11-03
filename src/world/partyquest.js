// Party quests (data/coop.js): each town's Party Board offers a hunt, a gather and a defend for
// the region around it, at your level, changing every couple of hours. You take one at a time
// (char.partyQuest) and the whole party works on it together:
//   hunt    a shared kill count: your kills, your party members' kills, and online friends' kills
//           (each game counts its own kills and tells the others);
//   gather  a shared count of a material: your finds, and party members gather it too (they head
//           to a matching spot on the map and work it, never one you're using);
//   defend  waves of the map's monsters come at a calm stone on the quest's map; hold off every
//           wave.
// When it's done, everyone in the party is paid: EXP, gold and Party Tokens for you, EXP for each
// party member (they thank you), and online friends with the same quest get theirs in their games.

import { TOWN_REGIONS, PQ_KINDS, ROTATE_HOURS, WAVE_SIZE, WAVE_GAP, pqReward, TOKEN_SHOP } from '../data/coop.js';
import { getMap } from '../data/maps.js';
import { MOBS } from '../data/mobs.js';
import { ITEMS } from '../data/items.js';
import { NODES, KINDS } from '../data/gathering.js';
import { lifeLevel, needFor, skillOfKind, LIFE_NAMES } from '../core/life.js';
import { gainExp, autoAssignAp } from '../core/character.js';
import { computeStats } from '../core/stats.js';
import { addItem, countItem, removeItem } from '../core/inventory.js';
import { partyMembers } from './party.js';
import { spawnMob } from './mobs.js';
import { navOf, surfaceBelow } from './nav.js';
import { botChat } from './chatlog.js';

const between = (a, b, rng = Math.random) => a + rng() * (b - a);

function seeded(text) {
  let n = 2166136261;
  for (const c of text) n = Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0;
  return () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 4294967296;
  };
}

export const clockOf = (world) => (world.clock ? world.clock() : Date.now());
export const boardSlot = (world) => Math.floor(clockOf(world) / (ROTATE_HOURS * 3600e3));
// Minutes until the board changes.
export const boardTurnsIn = (world) => Math.ceil((ROTATE_HOURS * 3600e3 - (clockOf(world) % (ROTATE_HOURS * 3600e3))) / 60000);

const mobsOn = (map) => [...new Set((map.spawns ?? []).map((s) => s.mob))].filter((id) => MOBS[id] && !MOBS[id].boss);
const nodesOn = (id) => NODES[id] ?? getMap(id).nodes ?? [];
// The skill a spot trains and the level it needs, and whether you can work it yet.
const skillOf = (n) => skillOfKind(n.kind, KINDS[n.kind]);
const canWork = (char, n) => lifeLevel(char, skillOf(n)) >= needFor(n);
// A map's day-time materials; with `char`, only those from spots that character can work.
const materialsOn = (id, char = null) => [...new Set(nodesOn(id).filter((n) => !n.night && (!char || canWork(char, n))).flatMap((n) => Object.keys(n.pool ?? {})))].filter((i) => ITEMS[i]);
// The lowest level a material's spots on a map need, as { skill, lv }.
function needOf(id, item) {
  const spots = nodesOn(id).filter((n) => !n.night && (n.pool ?? {})[item]).sort((a, b) => needFor(a) - needFor(b));
  return spots[0] ? { skill: skillOf(spots[0]), lv: needFor(spots[0]) } : null;
}

// The region's maps that suit a level: their monsters within reach, closest first.
function mapsFor(town, level) {
  const list = (TOWN_REGIONS[town] ?? []).map((id) => getMap(id)).filter(Boolean);
  const scored = list.map((map) => {
    const lv = mobsOn(map).map((id) => MOBS[id].level);
    const lo = Math.min(...lv);
    const avg = lv.reduce((a, b) => a + b, 0) / Math.max(1, lv.length);
    return { map, lo, d: Math.abs(avg - level) };
  });
  const fit = scored.filter((s) => s.lo <= level + 3).sort((a, b) => a.d - b.d);
  return (fit.length ? fit : scored.sort((a, b) => a.lo - b.lo).slice(0, 1)).map((s) => s.map);
}

// The board's three quests for this town, now, at your level.
export function boardOffers(world, town = world.map.town) {
  if (!TOWN_REGIONS[town]) return [];
  const level = world.char.level;
  const slot = boardSlot(world);
  const rng = seeded(`${town}|${slot}|${Math.floor(level / 3)}`);
  const maps = mapsFor(town, level);
  if (!maps.length) return [];
  const choose = (list) => list[Math.floor(rng() * list.length)];
  const top = maps.slice(0, 2);
  const out = [];
  // Hunt: one of the map's monsters near your level.
  const hm = choose(top);
  const mobs = mobsOn(hm).filter((id) => MOBS[id].level <= level + 4).sort((a, b) => Math.abs(MOBS[a].level - level) - Math.abs(MOBS[b].level - level));
  const mob = choose(mobs.slice(0, 2).length ? mobs.slice(0, 2) : mobsOn(hm));
  if (mob) out.push(offer(town, slot, 'hunt', hm.id, { mob }, level));
  // Gather: a material from that map's spots.
  // From spots you can work yourself; only when none of the region's maps has one, a material
  // your party gathers for you, and the quest says what level its spots need.
  const char = world.char;
  const mine = maps.filter((m) => materialsOn(m.id, char).length).slice(0, 3);
  const gm = choose(mine.length ? mine : maps.filter((m) => materialsOn(m.id).length).slice(0, 3)) ?? null;
  if (gm) {
    const item = choose(materialsOn(gm.id, mine.length ? char : null));
    const need = mine.length ? null : needOf(gm.id, item);
    out.push(offer(town, slot, 'gather', gm.id, { item, ...(need ? { needs: need } : {}) }, level));
  }
  // Defend: a wave on one of them.
  const dm = choose(top);
  out.push(offer(town, slot, 'defend', dm.id, { pool: mobsOn(dm).filter((id) => MOBS[id].level <= level + 4) }, level));
  return out;
}

function offer(town, slot, kind, map, extra, level) {
  const what = extra.mob ?? extra.item ?? 'wave';
  return { key: `${town}|${slot}|${kind}|${map}|${what}`, kind, town, map, ...extra, need: PQ_KINDS[kind].need, have: 0, level, reward: pqReward(kind, level) };
}

// What a quest asks, in a line ("Defeat 30 Snail Buns in Petal Meadow").
export function pqGoal(q) {
  const where = getMap(q.map).name;
  if (q.kind === 'hunt') return `Defeat ${q.need} ${MOBS[q.mob].name}s, together`;
  if (q.kind === 'gather') return `Gather ${q.need} ${ITEMS[q.item].name}, together${q.needs ? ` (its spots need ${LIFE_NAMES[q.needs.skill]} Lv ${q.needs.lv})` : ''}`;
  return `Hold off ${q.need} waves at the calm stone in ${where}`;
}

// ---------- Taking and sharing ----------

export function takePartyQuest(world, q, { quiet = false, from = null } = {}) {
  const char = world.char;
  if (char.partyQuest && !char.partyQuest.done) return 'You already have a party quest. Finish or drop it first.';
  char.partyQuest = { ...q, have: q.have ?? 0, done: false };
  world.pqDefend = null;
  if (!quiet) world.log(`Party quest: ${pqGoal(char.partyQuest)}.`, '#ffb0d8');
  if (from) world.log(`${from} shared a party quest: ${pqGoal(char.partyQuest)}.`, '#ffb0d8');
  // Online friends in your party get the same one (their board shows it too).
  if (!from) world.net?.partyQuest?.(world, { op: 'take', q: char.partyQuest });
  return null;
}

export function dropPartyQuest(world) {
  if (!world.char.partyQuest) return;
  world.log('You dropped the party quest.', '#d4cbe8');
  world.char.partyQuest = null;
  world.pqDefend = null;
}

// A message from an online friend in your party (net/together.js).
export function onPartyQuestMsg(world, msg, name = 'A friend') {
  const q = world.char.partyQuest;
  if (msg.op === 'take') {
    if (!q || q.done) takePartyQuest(world, msg.q, { quiet: true, from: name });
    return;
  }
  if (msg.op === 'add' && q && !q.done && q.key === msg.key) credit(world, msg.n, { name, net: true });
}

// ---------- Progress ----------

function credit(world, n, { name = null, net = false } = {}) {
  const q = world.char.partyQuest;
  if (!q || q.done || n <= 0) return;
  const was = q.have;
  q.have = Math.min(q.need, q.have + n);
  q.at = world.now;
  if (!net) world.net?.partyQuest?.(world, { op: 'add', key: q.key, n });
  const half = Math.ceil(q.need / 2);
  if (q.kind !== 'defend' && was < half && q.have >= half && q.have < q.need) world.log(`Party quest: ${q.have}/${q.need}, halfway there!`, '#ffb0d8');
  if (q.kind === 'gather' && name && !net) world.log(`${name} gathered ${ITEMS[q.item].name}${n > 1 ? ` x${n}` : ''} for the party (${q.have}/${q.need}).`, '#ffb0d8');
  if (q.have >= q.need) complete(world);
}

// A monster down: yours or a party member's (killMob). One a friend's game felled is counted by
// their game, not this one.
export function pqKill(world, m) {
  const q = world.char.partyQuest;
  if (!q || q.done || m.byNet) return;
  if (q.kind === 'hunt' && m.def.id === q.mob) credit(world, 1);
}

// Your finds from a spot (world/gathering.js).
export function pqGather(world, got) {
  const q = world.char.partyQuest;
  if (q?.kind === 'gather' && got[q.item]) credit(world, got[q.item]);
}

function complete(world) {
  const char = world.char;
  const q = char.partyQuest;
  q.done = true;
  const r = q.reward;
  const levels = gainExp(char, r.exp);
  char.gold += r.gold;
  addItem(char.inventory, 'party_token', r.tokens);
  char.pqDone = (char.pqDone ?? 0) + 1;
  world.log(`Party quest complete! +${r.exp} EXP, +${r.gold} gold, +${r.tokens} Party Tokens for everyone.`, '#ffe36b');
  world.callout = { title: 'Party quest complete!', sub: pqGoal(q), color: '#ffb0d8', at: world.now };
  world.juice.push({ type: 'confetti', x: world.body.x, y: world.body.y - 60, w: 120, count: 30 });
  if (levels > 0) {
    world.events.push({ type: 'levelup', level: char.level });
    world.log(`Level up! You are now level ${char.level}.`, '#ffe36b');
  }
  // Every party member gets their share too.
  for (const bot of partyMembers(world.bots)) {
    const before = bot.char.level;
    gainExp(bot.char, r.exp);
    bot.pqDone = (bot.pqDone ?? 0) + 1;
    if (bot.char.level > before) {
      autoAssignAp(bot.char);
      bot.level = bot.char.level;
      bot.stats = computeStats(bot.char);
    }
  }
  const thanks = partyMembers(world.bots).find((b) => b.map === world.map.id) ?? partyMembers(world.bots)[0];
  if (thanks) {
    const what = q.kind === 'hunt' ? `${MOBS[q.mob].name}s` : q.kind === 'gather' ? ITEMS[q.item].name.toLowerCase() : 'waves';
    const lines = q.kind === 'defend' ? ['we held it!! gg', 'stone is safe, nice teamwork', 'all waves down, ty party'] : [`done with the ${what}!! gg`, `thats all the ${what}, ty!`, `${what} done, good team`];
    botChat(world, thanks, lines[Math.floor(Math.random() * lines.length)], { prefix: '[Party] ', color: '#9fe0b0', important: true });
  }
  char.partyQuest = null;
  world.pqDefend = null;
}

// ---------- Trading tokens ----------

export function buyWithTokens(world, i) {
  const t = TOKEN_SHOP[i];
  const inv = world.char.inventory;
  if (!t) return 'Nothing there.';
  if (countItem(inv, 'party_token') < t.cost) return `You need ${t.cost} Party Tokens.`;
  if (!addItem(inv, t.id, t.qty)) return 'Your bag is full.';
  removeItem(inv, 'party_token', t.cost);
  world.log(`Traded ${t.cost} Party Tokens for ${ITEMS[t.id].name} x${t.qty}.`, '#ffb0d8');
  return null;
}

// ---------- Every tick ----------

export function tickPartyQuest(world, dt) {
  const q = world.char.partyQuest;
  if (!q || q.done || world.dungeon) return;
  if (q.kind === 'defend') tickDefend(world, q, dt);
  if (q.kind === 'gather' && world.map.id === q.map) tickBotGather(world, q, dt);
}

// The calm stone: on the widest floor away from the portals.
function stoneSpot(world) {
  const nav = navOf(world.map);
  const portals = world.map.portals ?? [];
  let best = null;
  nav.surfaces.forEach((s, i) => {
    const w = s.x2 - s.x1;
    const x = (s.x1 + s.x2) / 2;
    if (w < 260 || portals.some((p) => Math.abs(p.x - x) < 260 && Math.abs(p.y - s.y) < 80)) return;
    if (!best || w > best.w) best = { x, y: s.yAt ? s.yAt(x) : s.y, w, surface: i, x1: s.x1, x2: s.x2 };
  });
  return best;
}

function tickDefend(world, q, dt) {
  if (world.map.id !== q.map) {
    world.pqDefend = null;
    return;
  }
  const d = (world.pqDefend ??= { wave: 0, mobs: [], in: 3, spot: stoneSpot(world) });
  if (!d.spot) return;
  const live = d.mobs.filter((m) => m.hp > 0);
  if (d.wave > 0 && d.mobs.length && !live.length) {
    d.mobs = [];
    credit(world, 1);
    if (!world.char.partyQuest) return;
    d.in = WAVE_GAP;
    world.callout = { title: `Wave ${d.wave} held!`, sub: `${q.need - q.have} to go`, color: '#ffb0d8', at: world.now };
    return;
  }
  if (live.length || d.mobs.length) return;
  d.in -= dt;
  if (d.in > 0) return;
  d.wave = q.have + 1;
  const pool = q.pool?.length ? q.pool : mobsOn(world.map);
  const n = WAVE_SIZE + Math.min(3, partyMembers(world.bots).length);
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1;
    const x = Math.max(d.spot.x1 + 30, Math.min(d.spot.x2 - 30, d.spot.x + side * between(120, 240)));
    const m = spawnMob(world.map, { mob: pool[i % pool.length], x, y: d.spot.y });
    m.wave = true;
    m.aggroUntil = world.now + 60;
    d.mobs.push(m);
    world.mobs.push(m);
  }
  world.callout = { title: `Wave ${d.wave} of ${q.need}!`, sub: 'Hold them off at the calm stone', color: '#ffb0d8', at: world.now };
}

// Party members gather the quest's material at the map's spots.
function tickBotGather(world, q, dt) {
  const list = nodesOn(world.map.id);
  for (const bot of partyMembers(world.bots)) {
    if (!bot.body || bot.down || bot.map !== world.map.id) continue;
    const G = bot.pqGather;
    if (!G) {
      bot.pqGatherIn ??= between(3, 8, world.bots.rng);
      bot.pqGatherIn -= dt;
      if (bot.pqGatherIn > 0) continue;
      bot.pqGatherIn = between(10, 20, world.bots.rng);
      const spots = list.map((node, i) => ({ node, i })).filter(({ node }) => (node.pool ?? {})[q.item] && !node.night && !playerAt(world, node) && !partyMembers(world.bots).some((o) => o.pqGather?.i === list.indexOf(node)));
      if (!spots.length) continue;
      const near = spots.sort((a, b) => Math.abs(a.node.x - bot.body.x) + Math.abs(a.node.y - bot.body.y) - Math.abs(b.node.x - bot.body.x) - Math.abs(b.node.y - bot.body.y))[0];
      bot.pqGather = { ...near, walked: 0 };
      bot.life = { kind: 'node', node: near.node, phase: 'walk', t: 0, secs: 3.2, find: q.item, pq: true };
      continue;
    }
    const L = bot.life;
    if (!L?.pq || playerAt(world, G.node) || bot.hurt > 0) {
      stopGather(bot);
      continue;
    }
    if (L.phase === 'walk') {
      G.walked += dt;
      if (G.walked > 30) stopGather(bot);
      else if (bot.body.onGround && Math.abs(bot.body.x - G.node.x) < 14 && Math.abs(bot.body.y - G.node.y) < 6) {
        L.phase = 'work';
        bot.body.vx = 0;
        bot.body.facing = G.node.x >= bot.body.x ? 1 : -1;
        bot.attack = null;
      }
      continue;
    }
    L.t += dt;
    if (L.t < L.secs) continue;
    stopGather(bot);
    world.botPops = [...(world.botPops ?? []).filter((p) => world.now - p.at < 1), { x: G.node.x, y: G.node.y, items: [q.item], at: world.now }];
    credit(world, 1 + Math.floor(world.bots.rng() * 2), { name: bot.name });
  }
}

// You're at (or near) a spot you can work yourself: party members leave it to you. A spot you
// can't work yet is theirs to use even with you standing by it.
const playerAt = (world, node) => Math.abs(world.body.x - node.x) < 90 && Math.abs(world.body.y - node.y) < 40 && canWork(world.char, node);

function stopGather(bot) {
  bot.pqGather = null;
  if (bot.life?.pq) bot.life = null;
  if (bot.brain?.goal?.pq) bot.brain.goal = null;
}

// After a party member's own thinking: on the way to (or at) a spot for the quest, that's where
// they stand, and they leave the monsters be for the moment.
export function pqSteer(bot, world) {
  const G = bot.pqGather;
  const br = bot.brain;
  if (!G || !br || bot.down || !bot.body) return false;
  br.target = null;
  if (!br.goal?.pq) {
    const nav = navOf(world.map);
    const i = surfaceBelow(nav, G.node.x, G.node.y - 4);
    if (i < 0) {
      stopGather(bot);
      return false;
    }
    br.goal = { x: G.node.x - 6, y: G.node.y, mode: 'life', surface: i, pq: true };
    br.settled = false;
  }
  return true;
}

