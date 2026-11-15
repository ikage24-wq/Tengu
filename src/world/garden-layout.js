// The Mochi Garden's own pieces, wherever you've set them (data/furniture.js GB; 2026-11-15, the
// player's ask: "let me decorate everything"). The see-saw, the trees, the well, the beds, the
// fences... live in `char.garden.placed` like the pieces you buy, moved and put away in Decorate
// (ui/decorate.js). This reads them into one layout that everything else follows: the map's drawn
// pieces and lamps (syncGarden, below), and the Mochi's rides, chores, places, shelters and hiding
// spots (world/garden-life.js applyLayout). A piece put away is simply missing from it, and what it
// was for waits until it's set out again.

import { FURNITURE_BY_ID } from '../data/furniture.js';
import { groundAt } from './physics.js';
import { addItem, countItem } from '../core/inventory.js';

// Where each stood when the garden was new, left to right (as the garden was before 2026-11-15).
export const GARDEN_START = [
  ['garden_fence', 560], ['garden_fence_short', 1188], ['garden_lanternstring', 590], ['garden_mailbox', 226],
  ['garden_cropbed', 440], ['garden_beanframe', 528], ['garden_flowerbed_pink', 680], ['garden_well', 790],
  ['garden_flowerbed_blue', 1170], ['garden_lamp', 1290], ['garden_seesaw', 1468], ['garden_peachtree', 1537],
  ['garden_toybox', 1582], ['garden_bigtree', 1660], ['garden_slide', 1830], ['garden_mushroom', 1965], ['garden_plumtree', 2074],
];
const STARTERS = GARDEN_START.map(([id, x], k) => ({ uid: -1 - k, id, map: 'garden', x, y: 0, flip: false }));

export const isBuiltin = (p) => Boolean(FURNITURE_BY_ID[p?.id]?.builtin);
// The ground a piece takes ([x1, x2]): its own width, its middle `ox` along.
export function footOf(p) {
  const d = FURNITURE_BY_ID[p.id];
  const c = p.x + (d.ox ?? 0);
  return [c - d.w / 2, c + d.w / 2];
}

// Gives a garden its starting pieces, the first time (a new garden, or one from before they could
// move). Returns true if it did.
export function seedGarden(g, ground = () => 0) {
  if (!g || g.pieces) return false;
  g.placed ??= [];
  let uid = Math.max(0, ...g.placed.map((p) => p.uid ?? 0));
  for (const [id, x] of GARDEN_START) g.placed.push({ uid: ++uid, id, map: 'garden', x, y: ground(x), flip: false });
  g.pieces = 1;
  return true;
}

// Each of the garden's own pieces is somewhere - set out, in the bag, or in your hands. One that
// isn't (a save from mid-move before that was kept, say) goes back in the bag. Returns how many.
export function mendGarden(char) {
  const g = char?.garden;
  if (!g?.pieces || !char.inventory) return 0;
  let n = 0;
  for (const [id] of GARDEN_START) {
    const out = (g.placed ?? []).some((p) => p.id === id) || char.carrying?.id === id || countItem(char.inventory, id) > 0;
    if (!out && addItem(char.inventory, id, 1)) n++;
  }
  return n;
}

// The layout now. (`version` goes up each time it changes, so whoever follows it knows to look again.)
export const LAYOUT = {
  version: 0, list: null, key: null,
  mailbox: 226, crop: 440, bean: 528, well: 790, seesaw: 1468, toy: 1582, bigtree: 1660, slide: 1830, mush: 1965,
  beds: [{ x: 680, v: 0 }, { x: 1170, v: 1 }], lamps: [1290], trees: [{ x: 1537, v: 0, uid: 0 }, { x: 2074, v: 2, uid: 0 }],
  foot: [], lines: [], fences: [], pieces: [],
};
const first = (pieces, kind) => pieces.find((p) => FURNITURE_BY_ID[p.id].kind === kind)?.x ?? null;
// Reads garden `g`'s pieces into LAYOUT (a garden not yet given its pieces has the starting ones).
export function readLayout(g) {
  const list = g?.pieces ? g.placed ?? [] : STARTERS;
  let key = list.length;
  for (const p of list) if (isBuiltin(p)) key = (key * 31 + p.x * 17 + (p.uid ?? 0) * 7 + 1) % 2147483647;
  if (LAYOUT.list === list && LAYOUT.key === key) return LAYOUT;
  const pieces = list.filter((p) => p.map === 'garden' && isBuiltin(p));
  const of = (kind) => pieces.filter((p) => FURNITURE_BY_ID[p.id].kind === kind);
  Object.assign(LAYOUT, {
    version: LAYOUT.version + 1, list, key, pieces,
    mailbox: first(pieces, 'mg_mailbox'), crop: first(pieces, 'mg_cropbed'), bean: first(pieces, 'mg_beanframe'), well: first(pieces, 'mg_well'),
    seesaw: first(pieces, 'mg_seesaw'), toy: first(pieces, 'mg_toybox'), bigtree: first(pieces, 'mg_bigtree'), slide: first(pieces, 'mg_slide'), mush: first(pieces, 'mg_mushroom'),
    beds: of('mg_flowerbed').map((p) => ({ x: p.x, v: FURNITURE_BY_ID[p.id].extra ?? 0 })),
    lamps: of('mg_lantern').map((p) => p.x),
    trees: of('mg_fruittree').map((p) => ({ x: p.x, v: FURNITURE_BY_ID[p.id].extra ?? 0, uid: p.uid })),
    foot: pieces.filter((p) => FURNITURE_BY_ID[p.id].layer === 'floor').map(footOf),
    lines: of('mg_lanternline').map((p) => ({ x1: footOf(p)[0], x2: footOf(p)[1], h: FURNITURE_BY_ID[p.id].extra?.h ?? 82 })),
    fences: of('mg_fence').map((p) => ({ x1: footOf(p)[0], x2: footOf(p)[1] })),
  });
  return LAYOUT;
}
readLayout(null);

// The map's drawn pieces from the layout: the fences first (at the back), then the lantern strings,
// then the rest and the nursery left to right; the garden's other fixed things (the pond's reeds and
// lilies, the cliff) as they are. Each entry is render/garden.js's [kind, x, extra, uid].
const TALL = 60;
export function piecesFor(fixed) {
  const L = LAYOUT;
  const tall = L.pieces.filter((p) => FURNITURE_BY_ID[p.id].layer === 'floor' && FURNITURE_BY_ID[p.id].h >= TALL && FURNITURE_BY_ID[p.id].kind !== 'mg_bigtree');
  const out = [];
  for (const f of L.fences) out.push(['mg_fence', f.x1, { to: f.x2 }]);
  // (No paper lantern hung where something tall stands in front of the string: the bean frame, the well.)
  const skip = tall.map((p) => {
    const d = FURNITURE_BY_ID[p.id];
    const w = d.pick?.w ?? d.w;
    return [p.x - w / 2 - 10, p.x + w / 2 + 10];
  });
  for (const l of L.lines) out.push(['mg_lanternline', l.x1, { to: l.x2, h: l.h, skip }]);
  // (Left to right, the nursery among them: as the garden always drew them.)
  const rest = [...L.pieces.filter((p) => FURNITURE_BY_ID[p.id].layer !== 'back').map((p) => [FURNITURE_BY_ID[p.id].kind, p.x, FURNITURE_BY_ID[p.id].extra ?? null, p.uid]), ...fixed.filter(([k]) => k === 'mg_nursery')];
  out.push(...rest.sort((a, b) => a[1] - b[1]));
  out.push(...fixed.filter(([k]) => k !== 'mg_nursery'));
  return out;
}
// The lamps that light the garden at night: its fixed ones and its pieces' own.
export function lampsFor(map, fixed) {
  const out = [...fixed];
  for (const p of LAYOUT.pieces) {
    const d = FURNITURE_BY_ID[p.id];
    if (d.lamp) out.push({ x: p.x + d.lamp[0], y: groundAt(map, p.x) + d.lamp[1], c: '#ffd6a0' });
  }
  for (const l of LAYOUT.lines) {
    const gy = groundAt(map, l.x1);
    for (const [u, dy, c] of [[0.19, -70, '#ffc87a'], [0.5, -66, '#ffb8d0'], [0.81, -70, '#ffc87a']]) out.push({ x: l.x1 + (l.x2 - l.x1) * u, y: gy + dy, c });
  }
  return out;
}

// Keeps the garden's map in step with its owner's pieces (world/garden.js keeps the fixed parts on
// the map as `fixedPieces` / `fixedLamps`). Cheap when nothing moved. Returns the layout.
export function syncGarden(map, owner) {
  const L = readLayout(owner?.garden ?? null);
  if (map?.id === 'garden' && map.fixedPieces && map.layoutVersion !== L.version) {
    map.layoutVersion = L.version;
    map.townPieces = piecesFor(map.fixedPieces);
    map.lamps = lampsFor(map, map.fixedLamps ?? []);
  }
  return L;
}
