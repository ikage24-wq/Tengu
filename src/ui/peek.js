// See-through panels (the 2026-11-19 audit): in a tall room the minimap, the group list and the
// dungeon's objective panel sat right over the high ledges, hiding the monsters on them. Now, while
// the hero, a monster or someone in the party is behind one of those panels, it fades (eased, never
// snapping) so the fight shows through, and it comes back once they've moved on.

import { partyMembers } from '../world/party.js';

const SEE = 0.3;
const fades = {};
let spots = [];
let last = 0;
let dt = 0;

// Once a frame, before the HUD: where everyone is on screen (boxes in screen space).
export function peekSpots(state, world) {
  const now = performance.now() / 1000;
  dt = Math.min(0.1, Math.max(0, now - last));
  last = now;
  spots = [];
  const cam = state.cam;
  if (!cam || !world.map || world.scene) return;
  const add = (x, y, w, h) => spots.push({ x: x - w / 2 - cam.x, y: y - h - cam.y, w, h });
  if (world.body) add(world.body.x, world.body.y, 20, world.body.h ?? 40);
  for (const m of world.mobs ?? []) if (m.hp > 0) add(m.x, m.y, m.def?.w ?? 30, m.def?.h ?? 30);
  for (const b of partyMembers(world.bots)) if (b.body && b.map === world.map.id) add(b.body.x, b.body.y, 20, b.body.h ?? 40);
}

// How see-through a panel at (x, y, w, h) on screen is right now: 1 when nothing's behind it.
export function peekAlpha(name, x, y, w, h) {
  const under = spots.some((s) => s.x < x + w - 4 && s.x + s.w > x + 4 && s.y < y + h - 4 && s.y + s.h > y + 4);
  const goal = under ? SEE : 1;
  const a = fades[name] ?? 1;
  return (fades[name] = a + (goal - a) * (1 - Math.exp(-dt * 9)));
}
