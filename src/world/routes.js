// Getting around: the level range of a place, the shortest way from one map to another along the
// portals, and where a quest wants you to go. The world map plans a route with these; the HUD's
// guide arrow and the portal signs follow it (world.route = { to: mapId }).

import { MAPS } from '../data/maps.js';
import { MOBS } from '../data/mobs.js';
import { QUESTS } from '../data/quests.js';
import { questState, objectiveProgress, reportTo } from '../core/quests.js';

// "Lv 4-8" for a map's monsters (bosses left out), or null for a place without any.
export function levelRange(map) {
  const levels = (map.spawns ?? []).filter((s) => !MOBS[s.mob].boss).map((s) => MOBS[s.mob].level);
  if (!levels.length) return null;
  const lo = Math.min(...levels);
  const hi = Math.max(...levels);
  return lo === hi ? `Lv ${lo}` : `Lv ${lo}-${hi}`;
}

// The roads out of a map: its open portals (not dungeon doors or a dungeon's own rooms), and the
// sea roads Captain Bobbin sails (`ferry`: talk to him where the portal stands; world/voyage.js).
function roads(map) {
  return map.portals.filter((p) => (!p.hidden || p.ferry) && !p.homestone && p.to && MAPS[p.to] && !p.dungeon && !MAPS[p.to].dungeon);
}

// The shortest way from map `from` to map `to`: the list of portals to take, in order (empty when
// you're there), or null when there's no way.
export function routeBetween(from, to) {
  if (from === to) return [];
  const prev = new Map([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const id = queue.shift();
    for (const p of roads(MAPS[id])) {
      if (prev.has(p.to)) continue;
      prev.set(p.to, { id, p });
      if (p.to === to) {
        const path = [];
        for (let at = to; prev.get(at); at = prev.get(at).id) path.unshift(prev.get(at).p);
        return path;
      }
      queue.push(p.to);
    }
  }
  return null;
}

// The next portal to take on the way to `to` from the map you're on, and how many maps away it is.
export function nextStep(fromId, to) {
  const path = routeBetween(fromId, to);
  if (!path?.length) return null;
  return { portal: path[0], left: path.length };
}

// Where a quest wants you now: the map of the first thing still to do (who to talk to, where its
// monsters live, who drops what it wants, where to go), or the giver's when it's ready to hand in.
export function questTarget(char, id) {
  const q = QUESTS[id];
  const st = questState(char, id);
  const npcAt = (npc) => Object.values(MAPS).find((m) => m.npcs?.some((n) => n.id === npc))?.id ?? null;
  if (st === 'ready') return npcAt(reportTo(id));
  if (st !== 'active') return npcAt(q.giver);
  const o = objectiveProgress(char, id).find((x) => x.have < x.count);
  if (!o) return npcAt(reportTo(id));
  const mobMap = (mob) => Object.values(MAPS).find((m) => !m.dungeon && m.spawns?.some((s) => s.mob === mob && !s.after))?.id ?? Object.values(MAPS).find((m) => m.spawns?.some((s) => s.mob === mob))?.id ?? null;
  if (o.type === 'kill') return mobMap(o.mob);
  if (o.type === 'collect') {
    const from = Object.values(MOBS).find((m) => m.drops?.some((d) => d.id === o.item) && mobMap(m.id));
    return from ? mobMap(from.id) : null;
  }
  if (o.type === 'talk' || o.type === 'deliver') return npcAt(o.npc);
  if (o.type === 'visit' || o.type === 'catch') return o.map;
  if (o.type === 'job') return null;
  return npcAt(q.giver);
}

// Sets (or clears, with null) where the guide leads. Says so in the log.
export function setRoute(world, to) {
  if (!to || to === world.map.id) {
    world.route = null;
    if (to) world.log(`You're already in ${MAPS[to].name}.`, '#bff0dc');
    return;
  }
  const path = routeBetween(world.map.id, to);
  if (!path) {
    world.log(`There's no road to ${MAPS[to].name} from here.`, '#ffb3c6');
    return;
  }
  world.route = { to };
  world.log(`Guiding you to ${MAPS[to].name} (${path.length} map${path.length === 1 ? '' : 's'} away). Follow the arrow!`, '#bff0dc');
}

// Arriving clears the route.
export function checkArrival(world) {
  if (world.route && world.route.to === world.map.id) {
    world.log(`You've arrived at ${world.map.name}!`, '#ffe36b');
    world.route = null;
  }
}

