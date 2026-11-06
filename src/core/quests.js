// Quest progress. Kill counts are tracked per quest; collect objectives read the bag directly;
// talk, deliver and visit objectives are marked off as they happen (`rec.marks`). A daily quest
// can be done again each new day.

import { QUESTS } from '../data/quests.js';
import { MAPS } from '../data/maps.js';
import { MOBS } from '../data/mobs.js';
import { DUNGEONS } from '../data/dungeons.js';
import { ITEMS, GEAR_FAMILIES, jobGearId } from '../data/items.js';
import { JOBS } from '../data/jobs.js';
import { CASH_PER_QUEST } from '../data/cash.js';
import { NPCS } from '../data/npcs.js';
import { SPOTS } from '../data/fishing.js';
import { addItem, countItem, removeItem, tabFor } from './inventory.js';
import { makeEquip, makeCash } from './items.js';
import { gainExp } from './character.js';

// The HUD tracker shows up to TRACK_MAX quests. Until the player pins or unpins one, every quest
// in progress is tracked (`char.tracked` stays unset); after that the list is theirs, and newly
// accepted quests join it.
export const TRACK_MAX = 4;

// Today, as the player's calendar has it (daily quests reset at midnight).
export function today(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

// 'locked' | 'available' | 'active' | 'ready' | 'done'
export function questState(char, id) {
  const q = QUESTS[id];
  const rec = char.quests[id];
  if (rec?.state === 'done' && !(q.daily && rec.day !== today())) return 'done';
  if (rec?.state === 'active') return objectivesMet(char, id) ? 'ready' : 'active';
  if (char.level < q.minLevel) return 'locked';
  if (q.family && JOBS[char.job]?.family !== q.family) return 'locked';
  if (q.prereq && char.quests[q.prereq]?.state !== 'done') return 'locked';
  return 'available';
}

export function objectiveProgress(char, id) {
  const q = QUESTS[id];
  const rec = char.quests[id] ?? { kills: {} };
  return q.objectives.map((o, i) => {
    if (MARKED.has(o.type)) return { ...o, count: 1, have: rec.marks?.[i] ? 1 : 0 };
    if (o.type === 'job') return { ...o, count: 1, have: (JOBS[char.job]?.tier ?? 0) >= o.tier ? 1 : 0 };
    const have = o.type === 'kill' ? rec.kills?.[o.mob] ?? 0 : o.type === 'catch' ? rec.catches?.[o.fish] ?? 0 : countItem(char.inventory, o.item);
    return { ...o, have: Math.min(have, o.count) };
  });
}

export function objectivesMet(char, id) {
  return objectiveProgress(char, id).every((o) => o.have >= o.count);
}

// Objectives done once, by going somewhere or talking to someone.
const MARKED = new Set(['talk', 'deliver', 'visit']);

// What an objective asks, in words: { verb, name }.
export function objectiveText(o) {
  if (o.type === 'kill') return { verb: 'Defeat', name: MOBS[o.mob].name };
  if (o.type === 'collect') return { verb: 'Bring', name: ITEMS[o.item].name };
  if (o.type === 'catch') return { verb: 'Catch', name: ITEMS[o.fish].name };
  if (o.type === 'talk') return { verb: 'Talk to', name: NPCS[o.npc].name };
  if (o.type === 'job') return { verb: 'Take your', name: o.tier > 1 ? `${['', 'first', 'second', 'third', 'fourth'][o.tier]} job advancement` : 'first job' };
  if (o.type === 'deliver') return { verb: `Give ${ITEMS[o.item].name} to`, name: NPCS[o.npc].name };
  return { verb: 'Go to', name: o.place ?? MAPS[o.map].name };
}

// Whether the bag can take some things after giving up others, worked out on a copy of it (so
// stacks, freed cells and every tab count exactly). `adds` are item ids with qty, or whole items.
function bagFits(inv, removes, adds) {
  const sim = structuredClone(inv);
  for (const [id, qty] of removes) removeItem(sim, id, qty);
  return adds.every(([item, qty]) => addItem(sim, item, qty));
}
// The tab (as players see it) a quest's things need room in, or null when they fit.
const TAB_NAMES = { equip: 'Equip', use: 'Use', etc: 'Etc', mats: 'Materials', cash: 'Cash' };
function fullTab(inv, removes, adds) {
  if (bagFits(inv, removes, adds)) return null;
  for (const [item] of adds) {
    const id = typeof item === 'object' ? item.id : item;
    if (!bagFits(inv, removes, [[item, 1]])) return TAB_NAMES[tabFor(id)] ?? 'your';
  }
  return TAB_NAMES[tabFor(typeof adds[0][0] === 'object' ? adds[0][0].id : adds[0][0])] ?? 'your';
}

// Why a quest can't be taken right now for lack of room (the things it hands you to carry), or
// null.
export function acceptBlocker(char, id) {
  const gives = (QUESTS[id]?.gives ?? []).map((g) => [g.id, g.qty ?? 1]);
  if (!gives.length) return null;
  const tab = fullTab(char.inventory, [], gives);
  return tab ? `Make room in your ${tab} tab first: this quest gives you something to carry.` : null;
}

// Returns true when taken; false when it isn't available or the bag has no room for what it gives
// you to carry (see acceptBlocker), so a delivery is never taken empty-handed.
export function acceptQuest(char, id) {
  if (questState(char, id) !== 'available' || acceptBlocker(char, id)) return false;
  char.quests[id] = { state: 'active', kills: {}, marks: {} };
  // Things to carry for the quest (a letter to deliver).
  for (const g of QUESTS[id].gives ?? []) addItem(char.inventory, g.id, g.qty ?? 1);
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

// Called whenever you land a fish (world/fishing.js): counts it for quests that want it caught
// (`catch` objectives: a fish caught after taking the quest, kept or let go). Returns quest ids
// whose counts moved.
export function recordCatch(char, fishId) {
  const moved = [];
  for (const [id, rec] of Object.entries(char.quests)) {
    if (rec.state !== 'active') continue;
    const goal = QUESTS[id].objectives.find((o) => o.type === 'catch' && o.fish === fishId);
    if (!goal) continue;
    rec.catches ??= {};
    const now = rec.catches[fishId] ?? 0;
    if (now >= goal.count) continue;
    rec.catches[fishId] = now + 1;
    moved.push(id);
  }
  return moved;
}

// Talking to an NPC: marks off talk and deliver objectives that want them (a delivery hands the
// item over). Returns [{ id, say }] for each objective done, `say` being what the NPC says back.
export function noteTalk(char, npcId) {
  const out = [];
  for (const [id, rec] of Object.entries(char.quests)) {
    if (rec.state !== 'active' || !QUESTS[id]) continue;
    QUESTS[id].objectives.forEach((o, i) => {
      if ((o.type !== 'talk' && o.type !== 'deliver') || o.npc !== npcId || rec.marks?.[i]) return;
      // Earlier steps first: a quest's talks go in order.
      if (QUESTS[id].objectives.slice(0, i).some((p, j) => MARKED.has(p.type) && p.type !== 'visit' && !rec.marks?.[j])) return;
      if (o.type === 'deliver') {
        if (countItem(char.inventory, o.item) < 1) return;
        removeItem(char.inventory, o.item, 1);
      }
      (rec.marks ??= {})[i] = true;
      out.push({ id, say: o.say ?? null });
    });
  }
  return out;
}

// Being somewhere: marks off visit objectives for this map (and, with `above`, only once the hero
// has climbed above that height). Returns the quest ids that moved.
export function noteVisit(char, mapId, body = null) {
  const out = [];
  for (const [id, rec] of Object.entries(char.quests)) {
    if (rec.state !== 'active' || !QUESTS[id]) continue;
    QUESTS[id].objectives.forEach((o, i) => {
      if (o.type !== 'visit' || o.map !== mapId || rec.marks?.[i]) return;
      if (o.above != null && !(body && body.y <= o.above)) return;
      (rec.marks ??= {})[i] = true;
      out.push(id);
    });
  }
  return out;
}

// Whether someone is the next one a quest sends you to talk to, or bring something to (they get
// a marker).
export function waitingToTalk(char, npcId) {
  return Object.entries(char.quests).some(([id, rec]) => {
    if (rec.state !== 'active' || !QUESTS[id]) return false;
    const next = QUESTS[id].objectives.find((o, i) => (o.type === 'talk' || o.type === 'deliver') && !rec.marks?.[i]);
    return next?.npc === npcId;
  });
}

// What a quest still has you carrying of the things it gave you (a parcel not yet delivered), so
// only that is taken back when it ends, never another quest's copy of the same item.
function stillCarried(char, id) {
  const q = QUESTS[id];
  const rec = char.quests[id];
  return (q.gives ?? []).map((g) => {
    const delivered = q.objectives.filter((o, i) => o.type === 'deliver' && o.item === g.id && rec?.marks?.[i]).length;
    return [g.id, Math.min(countItem(char.inventory, g.id), Math.max(0, (g.qty ?? 1) - delivered))];
  }).filter(([, n]) => n > 0);
}

// The quest's hand-in and leftovers to take, and the reward items to give.
function rewardMoves(char, id) {
  const q = QUESTS[id];
  const removes = [...q.objectives.filter((o) => o.type === 'collect').map((o) => [o.item, o.count]), ...stillCarried(char, id)];
  const adds = q.rewards.items.map((r) => {
    const rid = rewardId(char, r);
    return ITEMS[rid].type === 'cash' ? [{ id: rid }, 1] : [rid, r.qty];
  });
  return { removes, adds };
}

// Why a ready quest can't be handed in for lack of room in the bag (any tab), or null.
export function completeBlocker(char, id) {
  if (!QUESTS[id]) return null;
  const { removes, adds } = rewardMoves(char, id);
  if (!adds.length) return null;
  const tab = fullTab(char.inventory, removes, adds);
  return tab ? `Make room in your ${tab} tab first.` : null;
}

// Hands in collected items and pays out rewards. Returns the rewards, or null if not ready.
// Fails without changing anything if the bag can't hold every reward item (in any tab).
export function completeQuest(char, id) {
  if (questState(char, id) !== 'ready') return null;
  const q = QUESTS[id];
  if (completeBlocker(char, id)) return null;
  const carried = stillCarried(char, id);

  for (const o of q.objectives) if (o.type === 'collect') removeItem(char.inventory, o.item, o.count);
  const items = q.rewards.items.map((r) => ({ ...r, id: rewardId(char, r) }));
  for (const r of items) {
    if (ITEMS[r.id].type === 'cash') addItem(char.inventory, makeCash(r.id, r.variant ?? null));
    else if (ITEMS[r.id].type === 'equip') for (let i = 0; i < r.qty; i++) addItem(char.inventory, makeEquip(r.id, { variant: r.variant ?? null }));
    else addItem(char.inventory, r.id, r.qty);
  }
  char.gold += q.rewards.gold;
  // Your island (world/home.js): its deed.
  if (q.rewards.island && !char.home) char.home = { stage: 1, back: null, placed: [], bag: {} };
  // A mount (data/mounts.js) is yours for good.
  const mount = q.rewards.mount && !char.mounts?.includes(q.rewards.mount) ? q.rewards.mount : null;
  if (mount) {
    (char.mounts ??= []).push(mount);
    char.mount ??= mount;
  }
  // A title to wear under your name (the story's last chapter gives one).
  if (q.rewards.title) {
    if (!(char.titles ??= []).includes(q.rewards.title)) char.titles.push(q.rewards.title);
    char.title = q.rewards.title;
  }
  // The wind comes back to the island for this hero (the story's ending): render/town.js and
  // world/calm.js.
  if (q.rewards.windBack) char.windBack = true;
  char.cash = (char.cash ?? 0) + CASH_PER_QUEST + (q.rewards.cash ?? 0);
  const levels = gainExp(char, q.rewards.exp);
  char.quests[id] = q.daily ? { state: 'done', day: today() } : { state: 'done' };
  if (q.daily) char.dailiesDone = (char.dailiesDone ?? 0) + 1;
  // What this quest still had you carrying goes (a parcel never delivered); another quest's copy
  // of the same item stays.
  for (const [gid, n] of carried) removeItem(char.inventory, gid, n);
  return { ...q.rewards, items, levels, mount };
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
  if (o.type === 'talk' || o.type === 'deliver') return MAPS[npcMap(o.npc)]?.name ?? '';
  if (o.type === 'visit') return o.above != null ? `${MAPS[o.map].name}, up high` : MAPS[o.map].name;
  if (o.type === 'catch') return o.place ?? '';
  // A fish is caught, not dropped: where it bites.
  if (ITEMS[o.item]?.fish) {
    const at = Object.entries(SPOTS).find(([, spots]) => spots.some((s) => s.pool[o.item]));
    return at ? `Fishing, ${MAPS[at[0]].name}` : '';
  }
  if (o.type === 'job') return 'Your instructor (world map, M)';
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
