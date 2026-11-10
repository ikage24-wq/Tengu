// Visiting a friend's island online (docs/design/home-island.md). Right-click a friend in your room
// and "Visit their island": your game asks theirs for it (its stage, its furniture, and the records
// its trophies show), and builds that island for you to walk round: fish their pond, sit by their
// things, see their record catch. Their game tells them you've come. You can't move their furniture.
// The Home Shell or their skiff takes you back. Everyone on an island sees only the others on that
// same island (net/online.js: each player says whose island they're on).

// Your Mochi Garden too (world/garden.js): "Visit their Mochi Garden" asks for its Mochi, its eggs
// and its crop bed, and builds it for you; you can pet, play with, cheer on and feed their Mochi, and
// your game sends that to theirs (world/garden-life.js applyGardenGift). The Mochi Bell or the gate
// takes you back.

import { guestArrives, EGG_SLOTS } from '../world/garden-life.js';
import { addItem } from '../core/inventory.js';
import { BLOOM } from '../data/mochi-raise.js';
import { online, send } from './online.js';
import { loadMap } from '../world/world.js';
import { applyGardenGift } from '../world/garden-life.js';

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

// What of you a visitor needs to see your Mochi Garden as it is.
function gardenOf(char) {
  const g = char.garden;
  return { name: char.name, garden: { mochi: g.mochi, eggs: g.eggs ?? [], cropAt: g.cropAt ?? 0, unlocked: g.unlocked ?? {} } };
}

// Friends in your room who have a Mochi Garden (the gate asks which garden: ui/garden-pick.js).
export const gardenFriends = () => (online.status === 'on' ? [...online.ghosts.values()].filter((g) => g.garden && g.name && g.name !== '...') : []);

// Asks a friend for their Mochi Garden.
export function askGardenVisit(world, id) {
  if (online.status !== 'on' || !online.ghosts.has(id)) return 'Not online.';
  if (world.dungeon || world.trial || world.map.voyage || world.scene) return 'Not from here.';
  // (Your Mochi out with you comes along: theirs shows it following you.)
  const pet = world.char.pet?.out ? (world.char.garden?.mochi ?? []).find((r) => r.seed === world.char.pet.seed && r.stage !== 'egg') : null;
  send({ t: 'visit', op: 'gask', to: id, pet: pet ?? null });
  world.log(`Ringing at ${online.ghosts.get(id).name}'s garden gate...`, '#cfe8ff');
  return null;
}
// Your Mochi and a friend's visiting one had an egg: theirs goes to their game, for their garden.
export function sendBreed(world, to, egg, mate) {
  if (online.status !== 'on') return;
  send({ t: 'visit', op: 'gbreed', to, egg, mate });
}
// Leaves a gift in the garden you're visiting: an egg of yours, or some sweets.
export function sendGardenPresent(world, present) {
  const to = world.gardenVisit?.ownerId;
  if (!to || online.status !== 'on') return false;
  send({ t: 'visit', op: 'ggift', to, ...present });
  return true;
}
// You petted or fed one of the Mochi in the garden you're visiting: tell its owner's game.
export function sendGardenGift(world, seed, what, sweet = null) {
  const to = world.gardenVisit?.ownerId;
  if (!to || online.status !== 'on') return;
  send({ t: 'visit', op: 'gcare', to, seed, what, sweet });
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
  if (msg.op === 'gask') {
    if (!world.char.garden) {
      send({ t: 'visit', op: 'gnone', to: msg.id });
      return;
    }
    send({ t: 'visit', op: 'gdata', to: msg.id, ...gardenOf(world.char) });
    if (msg.pet) guestArrives(world, msg.id, msg.pet);
    world.log(`${g?.name ?? 'A friend'} is visiting your Mochi Garden${msg.pet ? `, with ${msg.pet.name ?? 'their Mochi'}` : ''}!`, '#ffc2d4');
    return;
  }
  if (msg.op === 'gbreed' && msg.egg) {
    const gd = world.char.garden;
    if (!gd) return;
    (gd.eggs ??= []).push(msg.egg);
    const pet = (gd.mochi ?? []).find((r) => r.seed === world.char.pet?.seed);
    if (pet) Object.assign(pet, { bloom: 0, bredRest: BLOOM.rest });
    world.log(`Your ${pet?.name ?? 'Mochi'} and ${msg.mate ?? 'their Mochi'} had an egg! It's waiting in your own Garden.`, '#ffc2d4');
    return;
  }
  if (msg.op === 'ggift') {
    const gd = world.char.garden;
    if (!gd) return;
    if (msg.egg && (gd.eggs ?? []).length < EGG_SLOTS.length) {
      (gd.eggs ??= []).push(msg.egg);
      world.log(`${g?.name ?? 'A friend'} left you an egg by the stall!`, '#ffc2d4');
    } else if (msg.sweet && msg.n > 0) {
      addItem(world.char.inventory, msg.sweet, msg.n);
      world.log(`${g?.name ?? 'A friend'} left you ${msg.n} sweets!`, '#ffc2d4');
    }
    return;
  }
  if (msg.op === 'gnone') {
    world.log(`${g?.name ?? 'They'} doesn't have a Mochi Garden yet.`, '#ffb3c6');
    return;
  }
  if (msg.op === 'gdata' && msg.garden) {
    if (world.dungeon || world.trial || world.map.voyage) return;
    // (Where the bell takes you back to: where you were, or wherever your own garden would.)
    if (!world.map.garden) world.gardenVisitBack = { map: world.map.id, x: Math.round(world.body.x) };
    else if (!world.gardenVisit) world.gardenVisitBack = world.char.garden?.back ?? null;
    world.gardenVisit = { ownerId: msg.id, name: msg.name, garden: msg.garden };
    loadMap(world, 'garden', 'start');
    world.log(`Welcome to ${msg.name}'s Mochi Garden! Pet their Mochi, or bring them a sweet.`, '#ffc2d4');
    return;
  }
  if (msg.op === 'gcare') {
    applyGardenGift(world, msg, g?.name ?? 'A friend');
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
