// Life-skill tools: what the hero holds instead of her weapon while she works a spot, fishes, cooks
// or crafts (render/hero.js swaps one in when a move names `tool`). Drawn like the weapons, in the
// game's cel style with lit materials (jobgear/kit.js finish), held at the grip and pointing toward
// -y in their own frame, so a move turns them with the same weapon angle as a sword.
//
// toolShapes(kind) -> { w, h, grip, blade, shapes, anchors } (packed like a weapon; anchors.tip is
// the rod's tip, where the fishing line leaves it, in the packed frame).
//
//   pickaxe  a curved two-point pick on an ash haft, wrapped where she holds it
//   axe      a woodcutter's axe: one broad bit, a poll behind, a long haft
//   sickle   a little crescent sickle for cutting fibre, on a short handle
//   basket   a wicker basket on a bent handle, hanging from the hand (held pointing down)
//   rod0-3   the fishing rod, straight, then bending harder (a fish on the line)
//   ladle    a long copper ladle for the stove
//   hammer   a smith's cross-peen hammer for the bench
//   file     a flat file with a wooden handle

import { R, E, T, F } from './pixel.js';
import { pack } from './weapon-kit.js';
import { finish } from './jobgear/kit.js';

const WOOD = '#d8a978';
const WOOD_DK = '#a8744e';
const WRAP = '#ff9fb8';
const WRAP_DK = '#d86f92';
const STEEL = '#cfd6ea';
const STEEL_DK = '#8f95b8';
const EDGE = '#f6f8ff';
const COPPER = '#f0a878';
const COPPER_DK = '#bf6f52';
const WICKER = '#f0c98c';
const WICKER_DK = '#c4955e';

const arc = (cx, cy, rx, ry, a0, a1, n = 10) => Array.from({ length: n + 1 }, (_, i) => {
  const r = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
  return [cx + Math.cos(r) * rx, cy - Math.sin(r) * ry];
});

// A haft from y0 (top) to y1 (bottom, past the hand), with a wrapped grip round the hand.
function haft(s, y0, y1, w = 2.2, wrap = true) {
  s.push(R(-w / 2, y0, w, y1 - y0, WOOD));
  s.push(F(R(-w / 2, y0, w * 0.35, y1 - y0, WOOD_DK)));
  if (wrap) {
    s.push(R(-w / 2 - 0.3, -2.4, w + 0.6, 5.4, WRAP));
    for (const y of [-1.6, 0.2, 2]) s.push(F(R(-w / 2 - 0.3, y, w + 0.6, 0.5, WRAP_DK)));
  }
  s.push(E(0, y1, w / 2 + 0.4, 0.9, WOOD_DK));
}

const BUILD = {
  pickaxe() {
    const s = [];
    haft(s, -17, 5);
    // The head: one curved bar across the haft's top, a long pick forward and a shorter one back,
    // sweeping down to points, with a steel collar where it meets the haft.
    const top = -17.6;
    const head = [
      ...arc(0, top + 6.5, 10.5, 7.2, 172, 8, 14),
      [10.8, top + 8.4], [9.6, top + 6.2],
      ...arc(0, top + 6.6, 9.2, 5, 20, 160, 12),
      [-9.6, top + 6.2], [-10.6, top + 8],
    ];
    s.push(T(head, STEEL));
    s.push(F(T([...arc(0, top + 6.5, 10.2, 7, 150, 30, 10), ...arc(0, top + 6.6, 9.4, 6.2, 40, 140, 8)], EDGE)));
    s.push(F(T([[9.2, top + 5.4], [10.6, top + 8.2], [9.8, top + 7.4]], EDGE)));
    s.push(R(-2.2, top - 0.6, 4.4, 4.2, STEEL_DK), F(R(-2.2, top + 0.4, 4.4, 0.7, EDGE)));
    return { shapes: s, blade: [top, top + 6] };
  },
  axe() {
    const s = [];
    haft(s, -18, 5);
    const top = -18.6;
    // The bit: a broad wedge forward, flaring to a curved edge; a stubby poll behind.
    s.push(T([[0.8, top + 1.4], [4.4, top + 0.6], [7.4, top - 1.8], [9.4, top + 3.2], [9.6, top + 6.8], [7.6, top + 11.2], [4.4, top + 8.6], [0.8, top + 7.6]], STEEL));
    s.push(F(T([[7.6, top - 1.2], [9.4, top + 3.2], [9.6, top + 6.8], [7.8, top + 10.6], [8.4, top + 6.6], [8.2, top + 3]], EDGE)));
    s.push(F(T([[2.4, top + 2.4], [5, top + 1.8], [5, top + 6.8], [2.4, top + 6.6]], STEEL_DK)));
    s.push(T([[-0.8, top + 1.6], [-3.6, top + 2.2], [-3.6, top + 6.6], [-0.8, top + 7.2]], STEEL_DK));
    s.push(R(-1.6, top + 0.6, 3.2, 7.4, STEEL));
    return { shapes: s, blade: [top - 2, top + 11] };
  },
  sickle() {
    const s = [];
    haft(s, -6, 4, 2.2, true);
    // A crescent: out forward from the handle's top and curling up and back to a point.
    const outer = arc(4.6, -7.4, 6.4, 6.6, 200, 20, 12);
    const inner = arc(4.6, -7.2, 4.4, 4.4, 30, 190, 10);
    s.push(T([...outer, [10.2, -11.6], ...inner], STEEL));
    s.push(F(T([...arc(4.6, -7.4, 6.2, 6.4, 150, 40, 8), ...arc(4.6, -7.3, 5.4, 5.6, 50, 140, 6)], EDGE)));
    s.push(R(-1.6, -7.4, 3.2, 2, STEEL_DK));
    return { shapes: s, blade: [-14, -6] };
  },
  basket() {
    const s = [];
    // Held pointing down: the bent handle rises from the hand to the rim, the basket hangs below.
    s.push(T([...arc(0, -6, 4.8, 6, 180, 0, 12), ...arc(0, -6, 3.8, 5, 0, 180, 12)], WICKER_DK));
    const top = -6;
    s.push(T([[-6.4, top], [6.4, top], [5.2, top - 7], [3.6, top - 8.2], [-3.6, top - 8.2], [-5.2, top - 7]], WICKER));
    for (const y of [top - 2.2, top - 4.6]) s.push(F(R(-5.8, y, 11.6, 0.8, WICKER_DK)));
    for (const x of [-3.4, 0, 3.4]) s.push(F(R(x - 0.3, top - 7.8, 0.6, 7.6, WICKER_DK)));
    s.push(R(-6.8, top - 0.6, 13.6, 1.6, WICKER_DK));
    // A gingham cloth peeking over the rim.
    s.push(F(T([[-4.6, top + 0.2], [1.6, top + 0.2], [-0.6, top + 2.2], [-3.2, top + 1.8]], '#ffb3c6')), F(R(-3.6, top + 0.6, 1, 1, '#ffffff')), F(R(-1.4, top + 0.6, 1, 1, '#ffffff')));
    return { shapes: s, blade: [top - 8, top] };
  },
  ladle() {
    const s = [];
    s.push(R(-0.8, -15, 1.6, 18, COPPER_DK), F(R(-0.8, -15, 0.6, 18, '#9a5a44')));
    s.push(R(-1.3, -1, 2.6, 4.4, WOOD), E(0, 3.4, 1.4, 0.8, WOOD_DK));
    // The bowl, cupped forward.
    s.push(T([...arc(1.6, -16.6, 3.4, 3, 180, 360, 12)], COPPER), E(1.6, -16.6, 3.4, 1, COPPER_DK), F(E(1.6, -16.8, 2.4, 0.5, '#ffd9b8')));
    return { shapes: s, blade: [-19, -14] };
  },
  hammer() {
    const s = [];
    haft(s, -11, 4, 2);
    const top = -12.2;
    s.push(R(-5.2, top, 10.4, 4, STEEL), F(R(-5.2, top, 10.4, 1, EDGE)), F(R(-5.2, top + 3, 10.4, 1, STEEL_DK)));
    // A flat striking face forward, a wedge peen behind.
    s.push(R(4.6, top - 0.6, 1.8, 5.2, STEEL_DK), T([[-5.2, top], [-7.6, top + 1.6], [-7.6, top + 2.4], [-5.2, top + 4]], STEEL_DK));
    return { shapes: s, blade: [top, top + 4] };
  },
  file() {
    const s = [];
    s.push(R(-1.4, -2, 2.8, 6, WOOD), F(R(-1.4, -2, 1, 6, WOOD_DK)), E(0, 4, 1.6, 0.9, WOOD_DK));
    s.push(R(-1, -15, 2, 13, STEEL_DK), T([[-1, -15], [1, -15], [0, -17]], STEEL_DK));
    for (let y = -14; y < -3; y += 1.6) s.push(F(R(-1, y, 2, 0.5, STEEL)));
    return { shapes: s, blade: [-17, -2] };
  },
};

// The fishing rod, bending more at each step: a cork grip and reel at the hand, the blank tapering
// to a fine tip that curls forward (+x) under a fish's pull.
const ROD_LEN = 36;
function rod(bend) {
  const s = [];
  const pts = (side) => {
    const out = [];
    for (let i = 0; i <= 16; i++) {
      const u = i / 16;
      const w = 1.3 - 0.8 * u;
      const a = bend * 0.9 * u * u;
      const x = Math.sin(a) * ROD_LEN * u * 0.55 + side * w * Math.cos(a);
      const y = -ROD_LEN * u * (1 - 0.18 * bend * u) + side * w * Math.sin(a);
      out.push([x, y]);
    }
    return out;
  };
  const left = pts(-1);
  const right = pts(1);
  s.push(T([...left, ...right.reverse()], '#9a7ad8'));
  s.push(F(T([...pts(-1).slice(0, 12), ...pts(-0.2).slice(0, 12).reverse()], '#c8b4ff')));
  // Line guides: little rings along the blank.
  for (const u of [0.3, 0.55, 0.78]) {
    const a = bend * 0.9 * u * u;
    s.push(F(E(Math.sin(a) * ROD_LEN * u * 0.55 + 1.2, -ROD_LEN * u * (1 - 0.18 * bend * u), 0.7, 0.7, '#ffe36b')));
  }
  // The cork grip and the reel.
  s.push(R(-1.6, -3, 3.2, 8, '#e8c69a'), F(R(-1.6, -3, 1.1, 8, '#c49c6e')));
  // (The reel hangs under the rod, on the side away from her face.)
  s.push(E(2.8, 0.6, 2.1, 2.1, STEEL), F(E(2.8, 0.6, 1, 1, STEEL_DK)), F(R(4.4, 0.2, 1.4, 0.8, WRAP)));
  const a = bend * 0.9;
  const tip = [Math.sin(a) * ROD_LEN * 0.55, -ROD_LEN * (1 - 0.18 * bend)];
  return { shapes: s, blade: [tip[1], 0], tip };
}

// How big each is drawn against the hero (weapons are drawn big on purpose; tools a little less, so
// they read as tools and stay clear of her face).
const SIZE = { pickaxe: 0.78, axe: 0.8, sickle: 0.72, basket: 0.62, ladle: 0.8, hammer: 0.78, file: 0.75 };

const built = new Map();
const MATS = (s) => (s.c === STEEL || s.c === STEEL_DK || s.c === COPPER || s.c === COPPER_DK ? 'metal' : s.c === WOOD || s.c === WICKER ? 'leather' : null);

export const TOOL_KINDS = ['pickaxe', 'axe', 'sickle', 'basket', 'rod0', 'rod1', 'rod2', 'rod3', 'ladle', 'hammer', 'file'];

export function toolShapes(kind) {
  if (built.has(kind)) return built.get(kind);
  const m = /^rod(\d)$/.exec(kind);
  const def = m ? rod(Number(m[1]) / 3) : BUILD[kind]?.();
  if (!def) return null;
  const tip = def.tip ?? [0, def.blade[0]];
  const packed = pack(finish(def.shapes, MATS), { blade: def.blade, reach: [tip] });
  packed.anchors = { tip: [tip[0] + packed.grip[0], tip[1] + packed.grip[1]] };
  packed.size = SIZE[kind] ?? 0.85;
  built.set(kind, packed);
  return packed;
}
