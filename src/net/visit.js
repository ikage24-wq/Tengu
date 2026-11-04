// Visiting a friend's island online (docs/design/home-island.md). Right-click a friend in your room
// and "Visit their island": your game asks theirs for it (its stage, its furniture, and the records
// its trophies show), and builds that island for you to walk round: fish their pond, sit by their
// things, see their record catch. Their game tells them you've come. You can't move their furniture.
// The Home Shell or their skiff takes you back. Everyone on an island sees only the others on that
// same island (net/online.js: each player says whose island they're on).

import { online, send } from './online.js';
import { loadMap } from '../world/world.js';

// What of you a visitor needs to see your island as it is.
function islandOf(char) {
  return {
    name: char.name,
    home: { stage: char.home?.stage ?? 1, placed: (char.home?.placed ?? []).map(({ id, map, x, y, flip }) => ({ id, map, x, y, flip })) },
    fishBook: Object.fromEntries(Object.entries(char.fishBook ?? {}).filter(([, r]) => r.best).map(([id, r]) => [id, { best: r.best, n: r.n }])),
    dungeons: Object.fromEntries(Object.entries(char.dungeons ?? {}).map(([id, r]) => [id, { best: r.best, hardClears: r.hardClears ?? 0 }])),
    mount: char.mount ?? null,
    derbyWins: char.derbyWins ?? 0,
    livingWith: char.livingWith ?? null,
  };
}

// Asks a friend for their island.
export function askVisit(world, id) {
  if (online.status !== 'on' || !online.ghosts.has(id)) return 'Not online.';
  if (world.dungeon || world.trial || world.map.voyage) return 'Not from here.';
  send({ t: 'visit', op: 'ask', to: id });
  world.log(`Knocking on ${online.ghosts.get(id).name}'s door...`, '#cfe8ff');
  return null;
}

// The island you're visiting (a friend's), or null.
export const visitingWho = (world) => world.visiting?.ownerId ?? null;

export function onVisit(world, msg, g) {
  if (msg.to !== online.id) return;
  if (msg.op === 'ask') {
    if (!world.char.home) {
      send({ t: 'visit', op: 'none', to: msg.id });
      return;
    }
    send({ t: 'visit', op: 'data', to: msg.id, island: islandOf(world.char) });
    world.log(`${g?.name ?? 'A friend'} is visiting your island!`, '#ffc2d4');
    return;
  }
  if (msg.op === 'none') {
    world.log(`${g?.name ?? 'They'} doesn't have an island yet.`, '#ffb3c6');
    return;
  }
  if (msg.op === 'data' && msg.island) {
    if (world.dungeon || world.trial || world.map.voyage) return;
    const back = world.map.home ? world.char.home?.back : { map: world.map.id, x: Math.round(world.body.x) };
    world.visiting = { ownerId: msg.id, ...msg.island };
    if (world.char.home && back) world.char.home.back = back;
    else world.visitBack = back;
    loadMap(world, 'home', 'dock');
    world.log(`Welcome to ${msg.island.name}'s island! (Use your Home Shell or the skiff to go back.)`, '#ffc2d4');
  }
}
