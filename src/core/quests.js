// Quest progress. Kill counts are tracked per quest; collect objectives read the bag directly.

import { QUESTS } from '../data/quests.js';
import { ITEMS, GEAR_FAMILIES, jobGearId } from '../data/items.js';
import { JOBS } from '../data/jobs.js';
import { addItem, countItem, removeItem, TAB_SIZE } from './inventory.js';
import { makeEquip } from './items.js';
import { gainExp } from './character.js';

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
