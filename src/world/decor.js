// Placing furniture (data/furniture.js) on your island and in your hut: where a piece can go, and
// putting it there, picking it up, putting it away. The rules (research home-mounts.md: MapleStory
// M, Terraria, FFXIV, The Sims):
//   floor    stands on the ground or a ledge (never in the water), snapped to the surface under
//            where you point
//   rug      lies on the ground
//   surface  sits on top of a table or shelf (a placed piece with a `top`) or the hut's own shelves
//   wall     on the hut's back wall, between the beam and the floor
//   hang     from the hut's ceiling beam, or under a ledge outside
// Pieces of the same kind never overlap; nothing floats; and a table with something on it has to
// be cleared before it moves. Placed pieces are `char.home.placed`: { uid, id, map, x, y, flip },
// x the centre and y the base, in world px.

import { FURNITURE_BY_ID, PLACED_MAX, GRID } from '../data/furniture.js';
import { surfacesOf, waterAt, groundAt } from './physics.js';
import { addItem, removeItem, countItem } from '../core/inventory.js';

const BEAM = 16;
export const placedOn = (char, mapId) => (char.home?.placed ?? []).filter((p) => p.map === mapId);
const rectOf = (p) => {
  const d = FURNITURE_BY_ID[p.id];
  return { x1: p.x - d.w / 2, x2: p.x + d.w / 2, y1: p.y - d.h, y2: p.y };
};
const overlaps = (a, b) => a.x1 < b.x2 - 1 && b.x1 < a.x2 - 1 && a.y1 < b.y2 - 1 && b.y1 < a.y2 - 1;
// What a piece sits on (a table under a vase): the placed piece with a top it rests on, or null.
function restsOn(placed, p) {
  return placed.find((q) => q !== p && FURNITURE_BY_ID[q.id].top && Math.abs(q.y - FURNITURE_BY_ID[q.id].top - p.y) < 1 && p.x > q.x - FURNITURE_BY_ID[q.id].w / 2 && p.x < q.x + FURNITURE_BY_ID[q.id].w / 2) ?? null;
}

// Where a piece would go for a pointer at world (px, py): { x, y } snapped, and why not (or null).
export function placeAt(map, char, id, px, py, { free = false, ignore = null } = {}) {
  const def = FURNITURE_BY_ID[id];
  if (!def) return { why: 'That isn\'t furniture.' };
  const g = free ? 1 : GRID;
  const x = Math.round(px / g) * g;
  const placed = placedOn(char, map.id).filter((p) => p !== ignore);
  const indoor = Boolean(map.indoor);
  const out = { x, y: py, why: null };
  if (!map.home) return { ...out, why: 'Only on your own island.' };
  if (def.where === 'in' && !indoor) return { ...out, why: 'This one goes inside your hut.' };
  if (def.where === 'out' && indoor) return { ...out, why: 'This one goes outside, on the island.' };
  if (x - def.w / 2 < 8 || x + def.w / 2 > map.width - 8) return { ...out, why: 'Too close to the edge.' };
  if (placed.length >= PLACED_MAX) return { ...out, why: `Room for ${PLACED_MAX} pieces here.` };
  const spans = (s) => x - def.w / 2 >= s.x1 - 2 && x + def.w / 2 <= s.x2 + 2;
  if (def.layer === 'floor' || def.layer === 'rug') {
    // The surface right under the pointer (or just above it), that the whole piece fits on.
    const list = surfacesOf(map).filter((s) => (def.layer === 'rug' ? s.ground : true) && spans(s)).map((s) => ({ s, y: Math.max(s.yAt(x - def.w / 2), s.yAt(x + def.w / 2)) })).filter((c) => c.y >= py - 24).sort((a, b) => a.y - b.y);
    const hit = list[0];
    if (!hit) return { ...out, why: def.layer === 'rug' ? 'Rugs go on the floor.' : 'Needs a floor under it.' };
    out.y = hit.y;
    const slope = Math.abs(hit.s.yAt(x - def.w / 2) - hit.s.yAt(x + def.w / 2));
    if (slope > 3) return { ...out, why: 'Needs flat ground.' };
    const wy = waterAt(map, x);
    if (wy != null && out.y > wy) return { ...out, why: "It would get wet!" };
  } else if (def.layer === 'surface') {
    // A table's or shelf's top under the pointer.
    const tops = [
      ...placed.filter((q) => FURNITURE_BY_ID[q.id].top).map((q) => ({ x1: q.x - FURNITURE_BY_ID[q.id].w / 2 + 2, x2: q.x + FURNITURE_BY_ID[q.id].w / 2 - 2, y: q.y - FURNITURE_BY_ID[q.id].top })),
      ...map.platforms.filter((p) => p.shelf).map((p) => ({ x1: p.x, x2: p.x + p.w, y: p.y })),
    ].filter((t) => x >= t.x1 && x <= t.x2 && Math.abs(t.y - py) <= 40).sort((a, b) => Math.abs(a.y - py) - Math.abs(b.y - py));
    if (!tops.length) return { ...out, why: 'Put it on a table or a shelf.' };
    out.y = tops[0].y;
  } else if (def.layer === 'wall') {
    if (!indoor) return { ...out, why: 'Wall pieces go inside your hut.' };
    const floor = map.groundY;
    out.y = Math.round(Math.max(BEAM + 4 + def.h, Math.min(floor - 30, py + def.h / 2)) / g) * g;
  } else if (def.layer === 'hang') {
    if (indoor) out.y = BEAM + def.h;
    else {
      const ledge = map.platforms.filter((p) => !p.dock && x - def.w / 2 >= p.x - 2 && x + def.w / 2 <= p.x + p.w + 2 && p.y <= py + 20).sort((a, b) => b.y - a.y)[0];
      if (!ledge) return { ...out, why: 'Hang it under a ledge or deck (or from the hut\'s ceiling).' };
      out.y = ledge.y + 12 + def.h;
    }
  }
  const me = rectOf({ id, x: out.x, y: out.y });
  const same = placed.filter((q) => {
    const ql = FURNITURE_BY_ID[q.id].layer;
    // Rugs only clash with rugs; floor pieces with floor pieces; things on tops with each other.
    return ql === def.layer || (def.layer === 'surface' && ql === 'floor' && !FURNITURE_BY_ID[q.id].top);
  });
  const hit = same.find((q) => overlaps(me, rectOf(q)));
  if (hit) return { ...out, why: `It bumps into the ${FURNITURE_BY_ID[hit.id].name}.`, blocker: hit };
  // Keep the doorways and Shelly clear.
  if (def.layer === 'floor' && (map.portals.some((p) => !p.hidden && Math.abs(p.x - out.x) < def.w / 2 + 10 && Math.abs(p.y - out.y) < 6) || map.npcs.some((n) => Math.abs(n.x - out.x) < def.w / 2 + 12 && Math.abs(groundAt(map, n.x) - out.y) < 6))) return { ...out, why: 'Keep the way clear.' };
  return out;
}

let uid = 0;
const nextUid = (char) => Math.max(uid, ...(char.home?.placed ?? []).map((p) => p.uid ?? 0)) + 1;

// Puts a piece down (from your bag, or the one you're carrying when `carried`). Returns the placed
// piece, or a reason.
export function placePiece(map, char, id, px, py, { flip = false, free = false, carried = false } = {}) {
  const spot = placeAt(map, char, id, px, py, { free });
  if (spot.why) return spot.why;
  if (!carried && countItem(char.inventory, id) < 1) return "You don't have one.";
  if (!carried) removeItem(char.inventory, id, 1);
  const p = { uid: (uid = nextUid(char)), id, map: map.id, x: spot.x, y: spot.y, flip: Boolean(flip) };
  char.home.placed.push(p);
  return p;
}

// Picks a placed piece up to move it (it's carried, not yet back in the bag). Returns it, or why not.
export function pickUpPiece(char, p) {
  const placed = char.home?.placed ?? [];
  if (!placed.includes(p)) return 'Nothing there.';
  if (placed.some((q) => q !== p && restsOn(placed, q) === p)) return 'Take the things off it first.';
  placed.splice(placed.indexOf(p), 1);
  return p;
}

// Back in the bag (a placed or carried piece).
export function putAway(char, p) {
  const placed = char.home?.placed ?? [];
  if (placed.includes(p)) {
    if (pickUpPiece(char, p) !== p) return false;
  }
  return Boolean(addItem(char.inventory, p.id, 1));
}

// The placed piece under a point (the front-most).
export function pieceAt(char, mapId, x, y) {
  const order = { rug: 0, wall: 1, hang: 2, floor: 3, surface: 4 };
  return placedOn(char, mapId).filter((p) => {
    const r = rectOf(p);
    return x >= r.x1 - 2 && x <= r.x2 + 2 && y >= r.y1 - 2 && y <= r.y2 + 3;
  }).sort((a, b) => order[FURNITURE_BY_ID[b.id].layer] - order[FURNITURE_BY_ID[a.id].layer])[0] ?? null;
}

// The furniture in your bag: [{ id, n }].
export function furnitureInBag(char) {
  return (char.inventory.etc ?? []).filter((e) => FURNITURE_BY_ID[e.id]).map((e) => ({ id: e.id, n: e.qty }));
}
