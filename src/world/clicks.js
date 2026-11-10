// Clicking things in the Mochi places (main.js npcPointer): the race board, the egg stall, the
// sweet kitchen, the crop bed, an egg by the gate, a door, one of your Mochi. A click sends your
// hero walking over to it (`world.goTo`), and there it's used just as Up would (world.js), so a
// click does nothing Up couldn't. Any arrow key (or a jump) takes over again; something on another
// level (up a cliff, down at the pond) is out of reach of a walk, and says so.

import { groundAt } from './physics.js';
import { STALL_X, CROP_X, TOY_X, EGG_SLOTS } from './garden-life.js';

// What can be clicked on this map: { x, w, h, label, mochi? } (h: how tall above the ground).
export function clickTargets(world) {
  const map = world.map;
  if (!(map.garden || map.mochiRace) || map.indoor || map.race || world.race) return [];
  const out = [];
  if (map.raceBoard != null && map.mochiRace) out.push({ x: map.raceBoard, w: 60, h: 70, label: 'Race board' });
  if (map.garden) {
    if (!world.gardenVisit) {
      out.push({ x: STALL_X, w: 110, h: 80, label: 'Egg stall' });
      out.push({ x: CROP_X, w: 90, h: 30, label: 'Crop bed' });
      out.push({ x: TOY_X, w: 44, h: 30, label: 'Toy box' });
      (world.char.garden?.eggs ?? []).forEach((e, i) => EGG_SLOTS[i] != null && out.push({ x: EGG_SLOTS[i], w: 18, h: 22, label: 'Egg' }));
    }
    if (map.stove != null) out.push({ x: map.stove, w: 70, h: 90, label: 'Sweet Kitchen' });
    for (const e of world.gardenLife?.mochi ?? []) if (!e.hidden && !e.scene && e.x != null) out.push({ x: e.x, y: e.y, w: 22, h: 30, label: e.rec?.name ?? 'Mochi', mochi: e });
  }
  for (const p of map.portals) if (!p.hidden && p.door) out.push({ x: p.x, w: 40, h: 60, label: p.label ?? 'Door' });
  return out;
}

// The thing under world point (wx, wy), if any (Mochi first: they wander in front of everything).
export function targetAt(world, wx, wy) {
  const list = clickTargets(world);
  list.sort((a, b) => (b.mochi ? 1 : 0) - (a.mochi ? 1 : 0));
  return list.find((t) => {
    const gy = t.y ?? groundAt(world.map, t.x);
    return Math.abs(wx - t.x) < t.w / 2 && wy > gy - t.h && wy < gy + 8;
  }) ?? null;
}

// Clicked: walk there, if it's on this level.
export function walkTo(world, t) {
  const gy = t.y ?? groundAt(world.map, t.x);
  if (Math.abs(gy - world.body.y) > 40) {
    world.log(`${t.label} is ${gy < world.body.y ? 'up above' : 'down below'}: walk over to it.`, '#ffd6e4');
    return false;
  }
  world.goTo = { x: t.x, mochi: t.mochi ?? null, until: world.now + 8 };
  return true;
}

const ARROWS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyA', 'KeyD', 'KeyW', 'KeyS'];
// Each tick while walking somewhere: the keys a walk adds to yours (left or right; Up on arrival).
// Your own arrow keys (or a jump) take over at once.
export function steer(world, held, pressed) {
  const g = world.goTo;
  if (!g) return { held, pressed };
  if (ARROWS.some((k) => held.has(k) || pressed.has(k)) || world.now > g.until || world.race || world.scene) {
    world.goTo = null;
    return { held, pressed };
  }
  const x = g.mochi ? g.mochi.x + (g.mochi.x > world.body.x ? -8 : 8) : g.x;
  const dx = x - world.body.x;
  if (Math.abs(dx) <= 5 && world.body.onGround) {
    world.goTo = null;
    return { held, pressed: new Set([...pressed, 'ArrowUp']) };
  }
  // (Facing it when it gets there: the last step is a tap in its direction.)
  return { held: new Set([...held, dx > 0 ? 'ArrowRight' : 'ArrowLeft']), pressed };
}
