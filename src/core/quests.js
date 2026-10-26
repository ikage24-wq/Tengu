// Quest progress. Kill counts are tracked per quest; collect objectives read the bag directly.

import { QUESTS } from '../data/quests.js';
import { MAPS } from '../data/maps.js';
import { MOBS } from '../data/mobs.js';
import { DUNGEONS } from '../data/dungeons.js';
import { ITEMS, GEAR_FAMILIES, jobGearId } from '../data/items.js';
import { JOBS } from '../data/jobs.js';
import { CASH_PER_QUEST } from '../data/cash.js';
import { addItem, countItem, removeItem, TAB_SIZE } from './inventory.js';
import { makeEquip } from './items.js';
import { gainExp } from './character.js';

// The HUD tracker shows up to TRACK_MAX quests. Until the player pins or unpins one, every quest
// in progress is tracked (`char.tracked` stays unset); after that the list is theirs, and newly
// accepted quests join it.
export const TRACK_MAX = 4;

// 'locked' | 'available' | 'active' | 'ready' | 'done'
export function questState(char, id) {
  const q = QUESTS[id];
  const rec = char.quests[id];
  if (rec?.state === 'done') return 'done';
  if (rec?.state === 'active') return objectivesMet(char, id) ? 'ready' : 'active';
  if (char.level < q.minLevel) return 'locked';
  if (q.prereq && char.quests[q.prereq]?.state !== 'done') return 'locked';
  return 'available';
}

export function objectiveProgress(char, id) {
  const q = QUESTS[id];
  const rec = char.quests[id] ?? { kills: {} };
  return q.objectives.map((o) => {
    const have = o.type === 'kill' ? rec.kills?.[o.mob] ?? 0 : countItem(char.inventory, o.item);
    return { ...o, have: Math.min(have, o.count) };
  });
}

export function objectivesMet(char, id) {
  return objectiveProgress(char, id).every((o) => o.have >= o.count);
}

export function acceptQuest(char, id) {
  if (questState(char, id) !== 'available') return false;
  char.quests[id] = { state: 'active', kills: {} };
  // A new quest goes on the tracker (once the player has picked what to track).
  if (char.tracked) {
    char.tracked = trackedQuests(char).filter((q) => q !== id);
    char.tracked.push(id);
    if (char.tracked.length > TRACK_MAX) char.tracked.shift();
  }
  return true;
}

// Called whenever a monster dies. Returns quest ids whose kill counts moved.
export function recordKill(char, mobId) {
  const moved = [];
  for (const [id, rec] of Object.entries(char.quests)) {
    if (rec.state !== 'active') continue;
    const goal = QUESTS[id].objectives.find((o) => o.type === 'kill' && o.mob === mobId);
    if (!goal) continue;
    const now = rec.kills[mobId] ?? 0;
    if (now >= goal.count) continue;
    rec.kills[mobId] = now + 1;
    moved.push(id);
  }
  return moved;
}

// Hands in collected items and pays out rewards. Returns the rewards, or null if not ready.
// Fails without changing anything if the bag can't hold the reward items.
export function completeQuest(char, id) {
  if (questState(char, id) !== 'ready') return null;
  const q = QUESTS[id];
  const spareEquip = TAB_SIZE - char.inventory.equip.length;
  const equipRewards = q.rewards.items.filter((r) => ITEMS[r.id].type === 'equip').reduce((n, r) => n + r.qty, 0);
  if (equipRewards > spareEquip) return null;

  for (const o of q.objectives) if (o.type === 'collect') removeItem(char.inventory, o.item, o.count);
  const items = q.rewards.items.map((r) => ({ ...r, id: rewardId(char, r) }));
  for (const r of items) {
    if (ITEMS[r.id].type === 'equip') for (let i = 0; i < r.qty; i++) addItem(char.inventory, makeEquip(r.id, { variant: r.variant ?? null }));
    else addItem(char.inventory, r.id, r.qty);
  }
  char.gold += q.rewards.gold;
  char.cash = (char.cash ?? 0) + CASH_PER_QUEST;
  const levels = gainExp(char, q.rewards.exp);
  char.quests[id] = { state: 'done' };
  return { ...q.rewards, items, levels };
}

// The item a reward actually gives this hero: job gear rewards become their own job's piece.
export function rewardId(char, r) {
  if (!r.forJob) return r.id;
  const def = ITEMS[r.id];
  const family = JOBS[char.job]?.family;
  return GEAR_FAMILIES.includes(family) ? jobGearId(family, def.slot, def.reqLevel) : r.id;
}

// ---------- Tracking ----------

const inProgress = (char) => Object.keys(char.quests).filter((id) => QUESTS[id] && ['active', 'ready'].includes(questState(char, id)));

export function trackedQuests(char) {
  const live = inProgress(char);
  return (char.tracked ? char.tracked.filter((id) => live.includes(id)) : live).slice(0, TRACK_MAX);
}

export const isTracked = (char, id) => trackedQuests(char).includes(id);

// Pins or unpins a quest; pinning past the limit drops the oldest pin.
export function toggleTracked(char, id) {
  const list = trackedQuests(char);
  char.tracked = list.includes(id) ? list.filter((q) => q !== id) : [...list, id].slice(-TRACK_MAX);
  return char.tracked.includes(id);
}

// ---------- Where to go ----------
// Hints for the quest log and tracker: where a quest's giver stands, where its monsters live,
// and who drops the items it wants.

export function npcMap(npcId) {
  return Object.values(MAPS).find((m) => m.npcs?.some((n) => n.id === npcId))?.id ?? null;
}

// Places a monster spawns, by name: a dungeon's rooms count as the dungeon.
export function mobPlaces(mobId) {
  const names = [];
  for (const m of Object.values(MAPS)) {
    if (!m.spawns?.some((s) => s.mob === mobId)) continue;
    const name = m.dungeon ? DUNGEONS[m.dungeon]?.name ?? m.name : m.name;
    if (!names.includes(name)) names.push(name);
  }
  return names;
}

// Monsters that drop an item.
export function itemSources(itemId) {
  return Object.values(MOBS).filter((m) => m.drops?.some((d) => d.id === itemId)).map((m) => m.id);
}

// One line saying where to work on an objective: "Petal Meadow", or for an item "Kitsune Kit,
// Petal Meadow".
export function objectiveHint(o) {
  if (o.type === 'kill') return mobPlaces(o.mob).slice(0, 2).join(', ');
  const from = itemSources(o.item)[0];
  if (!from) return '';
  const where = mobPlaces(from)[0];
  return where ? `${MOBS[from].name}, ${where}` : MOBS[from].name;
}

// Quests in progress that want an item: [{ id, name, have, count }].
export function questsWanting(char, itemId) {
  const out = [];
  for (const [id, rec] of Object.entries(char.quests)) {
    if (rec.state !== 'active') continue;
    const goal = QUESTS[id]?.objectives.find((o) => o.type === 'collect' && o.item === itemId);
    if (goal) out.push({ id, name: QUESTS[id].name, have: Math.min(goal.count, countItem(char.inventory, itemId)), count: goal.count });
  }
  return out;
}
