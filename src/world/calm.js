// Maps heal as you hunt (the player's map rule; the story's souring spirits). Each hunting map has
// a calm (0-1, world.calm by map id): every monster that falls there calms it a little, and left
// alone it slowly sours again. Fully calm (CALM and up), its spirit shows, the map pays more EXP
// and its gathering spots give an extra find; soured (below SOUR), its colours fade.
// Online friends hunting with you calm it too, through their kills here.

export const CALM = 0.8;
export const SOUR = 0.25;
const START = 0.4;
const PER_KILL = 0.012;
// About half an hour to sour from calm to nothing with nobody hunting.
const DECAY = 1 / 1800;
export const CALM_EXP = 0.1;

export const soothes = (map) => Boolean(map && map.spawns?.length && !map.isTown && !map.dungeon && !map.trial);

// The calm of a map now (decayed for the time since it was last touched).
export function calmOf(world, mapId = world.map.id) {
  const c = (world.calm ??= {})[mapId];
  if (!c) return START;
  // (Once the wind is back, the island remembers you: maps sour half as fast.)
  return Math.max(0, c.v - (world.now - c.at) * DECAY * (world.char?.windBack ? 0.5 : 1));
}

function setCalm(world, mapId, v) {
  world.calm[mapId] = { v: Math.max(0, Math.min(1, v)), at: world.now };
}

export const isCalm = (world, mapId) => calmOf(world, mapId) >= CALM;

// A monster fell on this map.
export function calmKill(world) {
  const map = world.map;
  if (!soothes(map)) return;
  const was = calmOf(world);
  setCalm(world, map.id, was + PER_KILL);
  if (was < CALM && calmOf(world) >= CALM) {
    world.callout = { title: `${map.name} is calm`, sub: 'Its spirit is back: more EXP, and extra finds when gathering', color: '#ff9ec7', at: world.now };
    world.log(`${map.name} is calm again! Its spirit has come back.`, '#ffc6dd');
  }
}

// Left alone, a calm map sours again: say so when it slips back while you're there.
export function tickCalm(world) {
  const map = world.map;
  if (!soothes(map)) return;
  const v = calmOf(world);
  if (world.calmWas?.map === map.id && world.calmWas.v >= CALM && v < CALM) world.log(`${map.name} is souring again. Hunt here to calm it.`, '#c9b6e6');
  world.calmWas = { map: map.id, v };
}
