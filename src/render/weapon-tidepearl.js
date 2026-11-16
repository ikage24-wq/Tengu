// The Island Journey ladder, Lv 20: the Tidepearl weapons (docs/design/island-journey-gear.md),
// from the Sunken Aquarium Palace and Lantern Lagoon. The sea's treasures: mother-of-pearl blades
// with a rainbow sheen and sea-glass edges, pink coral growing up and out of them, scallop shells
// for guards and bits, pearls set wherever a jewel would go, sea-silk cord in deep blue for grips,
// driftwood for hafts, a little starfish on the staff. The first tier with an effect of its own:
// a soft water shimmer (render/weapon-fx.js `tideLive`: light rippling along it like sun through
// water, the pearls catching a glint, now and then a tiny bubble drifting up).
//
// Same frame and sizes as the earlier tiers, from the shared kit.

import { R, E, T, F } from './pixel.js';
import { matte, gemmy, metal, tube, mir, arc, curve, grainLine, BOW_H, bowX, bowLimb, bowAt, bowString, XB, xbProdX, xbProd, XB_STOCK } from './weapon-ladder-kit.js';

// The Tidepearl palette.
export const TIDEPEARL = {
  nacre: '#eef5ff', nacreShade: '#c8d6ee', sheenPink: '#ffd4ea', sheenBlue: '#c9e8ff', sheenMint: '#cffcec', sheenGold: '#fff0c4',
  pearl: '#fffaf5', pearlShade: '#e6d6e6', pearlPink: '#ffe0ee',
  coral: '#ff7f88', coralLight: '#ffb7b1', coralDark: '#d9566a',
  glass: '#6fd9cc', glassLight: '#b6f4eb', glassDark: '#3ea69d', glassCore: '#eafffb',
  shell: '#ffd8c3', shellLight: '#fff1e6', shellDark: '#eaa892', shellRidge: '#d98e79',
  drift: '#93a7bc', driftLight: '#bdcbdb', driftDark: '#66798f',
  cord: '#3f86c8', cordLight: '#86bdf0', cordDark: '#285d95',
  star: '#ffa36b', starLight: '#ffd2a8', starDark: '#e0743f',
};
const C = TIDEPEARL;

// A pearl at (x, y), `r` round: its soft shadow side, a blush of pink and a bright glint.
export function pearl(x, y, r) {
  return [
    metal(E(x, y, r, r, C.pearl)),
    F(T([...arc(x, y, r * 0.98, r * 0.98, -70, -200, 10), ...arc(x - r * 0.25, y + r * 0.1, r * 0.8, r * 0.75, -200, -70, 10)], C.pearlShade)),
    F(E(x + r * 0.18, y + r * 0.1, r * 0.45, r * 0.4, C.pearlPink)),
    F(E(x - r * 0.35, y - r * 0.38, r * 0.3, r * 0.24, '#ffffff')),
  ];
}
// A scallop shell: a fan hinged at (x, y), `r` out to its rim, opening between angles a0 and a1
// (degrees, 0 = +x, 90 = up): its ribs, its scalloped rim, the little ears at the hinge.
export function scallop(x, y, r, a0, a1, { ribs = 7, ears = true } = {}) {
  const P = (ang, rr) => [x + Math.cos((ang * Math.PI) / 180) * rr, y - Math.sin((ang * Math.PI) / 180) * rr];
  const step = (a1 - a0) / ribs;
  // The rim bulging round at the end of every rib (a fan with a straight edge reads as paper).
  const rim = [];
  for (let i = 0; i <= ribs * 6; i++) {
    const u = i / (ribs * 6);
    rim.push(P(a0 + (a1 - a0) * u, r * (0.88 + 0.12 * Math.abs(Math.sin(u * ribs * Math.PI)))));
  }
  const out = [matte(T([[x, y], ...rim], C.shell))];
  // Each rib a raised wedge, lit down one side, a groove between it and the next.
  for (let k = 0; k < ribs; k++) {
    const a = a0 + step * k;
    if (k > 0) out.push(F(T(tube([P(a, r * 0.16), P(a, r * 0.86)], 0.2, 0.42), C.shellRidge)));
    out.push(F(T([P(a + step * 0.5, r * 0.18), P(a + step * 0.18, r * 0.8), P(a + step * 0.45, r * 0.97)], C.shellLight)));
  }
  // Two faint growth rings, and the shell deeper in colour toward its hinge.
  for (const k of [0.44, 0.7]) out.push(F(T(tube(arc(x, y, r * k, r * k, a0 + 5, a1 - 5, 14), 0.18), C.shellDark)));
  out.push(F(T([[x, y], ...arc(x, y, r * 0.3, r * 0.3, a0, a1, 8)], C.shellDark)));
  if (ears) {
    const mid = (((a0 + a1) / 2) * Math.PI) / 180;
    const [ux, uy] = [Math.cos(mid), -Math.sin(mid)];
    const [nx, ny] = [-uy, ux];
    out.push(matte(T([[x - nx * r * 0.32, y - ny * r * 0.32], [x + nx * r * 0.32, y + ny * r * 0.32], [x + nx * r * 0.24 - ux * r * 0.14, y + ny * r * 0.24 - uy * r * 0.14], [x - nx * r * 0.24 - ux * r * 0.14, y - ny * r * 0.24 - uy * r * 0.14]], C.shellDark)));
  }
  return out;
}
// A branch of coral along `pts`, `w0` wide at its foot: pink with a lit streak and little polyp
// bumps along it.
export function coral(pts, w0, w1 = w0 * 0.5) {
  const out = [matte(T(tube(pts, w0, w1), C.coral)), F(T(tube(pts.map(([x, y]) => [x - w0 * 0.18, y - w0 * 0.1]), w0 * 0.3, w1 * 0.2), C.coralLight))];
  for (let i = 1; i < pts.length - 1; i += 2) out.push(F(E(pts[i][0] + w0 * 0.25, pts[i][1], 0.32, 0.32, C.coralDark)));
  const [tx, ty] = pts[pts.length - 1];
  out.push(matte(E(tx, ty, w1 * 0.62, w1 * 0.62, C.coral)), F(E(tx - w1 * 0.15, ty - w1 * 0.15, w1 * 0.25, w1 * 0.25, C.coralLight)));
  return out;
}
// Sea-silk cord wound round a rod from y0 to y1 (x from -w/2 to w/2).
function cordWrap(y0, y1, w, step = 1.15) {
  const out = [matte(R(-w / 2, y0, w, y1 - y0, C.cord))];
  for (let y = y0 + 0.1; y < y1 - 0.4; y += step) {
    out.push(F(T(tube([[-w / 2, y + step * 0.75], [w / 2, y]], 0.34), C.cordDark)));
    out.push(F(T(tube([[-w / 2 + 0.3, y + step * 0.42], [w / 2 - 0.4, y - 0.14]], 0.18), C.cordLight)));
  }
  return out;
}
// A drop of sea glass at (x, y), `r` round, hanging point up.
export function glassDrop(x, y, r) {
  return [
    gemmy(T([[x, y - r * 1.4], [x + r * 0.8, y - r * 0.2], [x + r * 0.85, y + r * 0.5], [x, y + r * 1.05], [x - r * 0.85, y + r * 0.5], [x - r * 0.8, y - r * 0.2]], C.glass)),
    F(E(x + r * 0.15, y + r * 0.25, r * 0.45, r * 0.5, C.glassLight)), F(E(x - r * 0.3, y - r * 0.25, r * 0.22, r * 0.3, C.glassCore)),
  ];
}
// A five-armed starfish at (x, y), `r` across, turned `rot` degrees.
export function starfish(x, y, r, rot = 0) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = ((rot + i * 36 - 90) * Math.PI) / 180;
    const rr = i % 2 ? r * 0.42 : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  const out = [matte(T(pts, C.star))];
  for (let i = 0; i < 5; i++) {
    const a = ((rot + i * 72 - 90) * Math.PI) / 180;
    out.push(F(E(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, 0.26, 0.26, C.starLight)));
  }
  out.push(F(E(x, y, r * 0.22, r * 0.22, C.starDark)));
  return out;
}
// The rainbow sheen of mother-of-pearl: soft pastel bands across a shape `half` wide (x from -half
// to +half) at these heights, on the slant.
const sheen = (half, ys, slant = 1.6) => ys.map((y, i) => F(T(tube([[-half, y + slant], [half, y - slant]], 0.85), [C.sheenPink, C.sheenBlue, C.sheenMint, C.sheenGold][i % 4])));

// ---------- Sword ----------
// The Tidepearl Sword: a blade of mother-of-pearl, a rainbow shifting across it and a pale ridge
// down it, edged both sides with sea glass; a scallop shell spreads behind its base for a guard,
// two branches of coral grow up the blade from it, and a pearl sits at its heart; a sea-silk grip
// and a pearl pommel in a little shell cup.
const B = -4;
function sword() {
  const s = [];
  const L = 20;
  const top = B - L;
  s.push(...cordWrap(-2.2, 5.6, 2.7));
  s.push(...scallop(0, 7.6, 2, 205, 335, { ribs: 4, ears: false }), ...pearl(0, 6.9, 1.6));
  // The guard behind the blade.
  s.push(...scallop(0, B + 2.2, 5.4, 18, 162, { ribs: 8 }));
  // The blade.
  s.push(metal(T(mir([[0, top], [1.5, top + 1.6], [2.6, top + 4.4], [2.8, top + 7.4], [2.7, B - 1.6], [2.2, B]]), C.nacre)));
  s.push(...sheen(1.9, [top + 7.2, top + 10.6, top + 14, top + 17.4]));
  s.push(F(T([[0, top + 0.8], [0.35, top + 3], [0.35, B - 1.4], [-0.35, B - 1.4], [-0.35, top + 3]], '#ffffff')));
  for (const sd of [1, -1]) s.push(gemmy(T([[sd * 1.5, top + 1.6], [sd * 2.6, top + 4.4], [sd * 2.8, top + 7.4], [sd * 2.7, B - 1.6], [sd * 2.2, B], [sd * 1.75, B], [sd * 2.1, B - 1.7], [sd * 2.15, top + 7.5], [sd * 1.95, top + 4.7], [sd * 1.1, top + 2.3]], sd > 0 ? C.glass : C.glassDark)));
  s.push(F(T(tube([[1.9, top + 3.4], [2.35, top + 7.4], [2.3, B - 2]], 0.24), C.glassCore)));
  // The coral growing up from the guard, and the pearl at its heart.
  s.push(...coral(curve([-2.4, B + 0.4], [-3.6, B - 2.4], [-2.6, B - 4.6], 6), 1.2, 0.6), ...coral(curve([-3.1, B - 1.4], [-4.4, B - 2.2], [-4.6, B - 3.6], 4), 0.7, 0.45));
  s.push(...coral(curve([2.4, B + 0.4], [3.4, B - 1.8], [2.8, B - 3.6], 6), 1.1, 0.55));
  s.push(...pearl(0, B + 0.9, 1.2));
  return { shapes: s, blade: [top, B], reach: [], a: { tip: [0, top], head: [0, B - L * 0.55], gem: [0, B + 0.9], blade: [top, B], fx: 'tidepearl' } };
}

// ---------- Axe ----------
// The Tidepearl Axe: a great scallop shell for its bit, ribbed and scalloped, a pearly rim along its
// cutting edge and a pearl at its hinge; coral spines on its back; a driftwood haft, silvered and
// grained, a little coral growing from its tip; a sea-silk grip and a spiral shell for a butt.
function axe() {
  const s = [];
  const H = 22;
  const top = -H;
  s.push(matte(T(tube([[0.2, top - 0.6], [0, top + 10], [-0.15, 6.6]], 2.6, 2.8), C.drift)), F(T(tube([[0.65, top + 0.2], [0.55, 5.8]], 0.7, 0.6), C.driftLight)));
  s.push(grainLine(-0.6, top + 12, 4, C.driftDark, 0.25, 0.26), grainLine(0.3, top + 14, -2, C.driftDark, 0.2, 0.2));
  s.push(...cordWrap(-1.8, 4.6, 3));
  // A spiral shell for a butt.
  s.push(matte(T([[-1.6, 6], [1.6, 6], [1.1, 7.8], [0, 9.6], [-1.1, 7.8]], C.shell)), F(T(tube([[-1.3, 6.8], [1.2, 6.5]], 0.32), C.shellRidge)), F(T(tube([[-0.9, 7.9], [0.8, 7.6]], 0.28), C.shellRidge)), F(E(-0.5, 6.5, 0.4, 0.3, C.shellLight)));
  // Coral spines on its back, and coral at the haft's tip.
  s.push(...coral(curve([-0.6, top + 3.2], [-2.8, top + 2.6], [-3.8, top + 0.6], 5), 1, 0.5), ...coral(curve([-0.6, top + 6], [-2.6, top + 6.4], [-3.6, top + 5], 4), 0.85, 0.45));
  s.push(...coral(curve([0.2, top - 0.4], [-0.6, top - 2], [0, top - 3.4], 5), 0.9, 0.45));
  // The scallop bit, its pearly rim, the pearl at its hinge.
  const hx = 1.2;
  const hy = top + 5.8;
  s.push(...scallop(hx, hy, 8.8, -64, 64, { ribs: 8 }));
  s.push(metal(T([...arc(hx, hy, 8.9, 8.9, -60, 60, 16), ...arc(hx, hy, 7.6, 7.6, 60, -60, 16)], C.nacre)));
  s.push(F(T(tube(arc(hx, hy, 8.3, 8.3, -50, 50, 12), 0.5, 0.5), C.sheenBlue)), F(T(tube(arc(hx, hy, 8.6, 8.6, 10, 46, 6), 0.32), '#ffffff')));
  s.push(...pearl(hx + 0.3, hy, 1.35));
  const mid = hy;
  return { shapes: s, blade: [top - 3, top + 13], reach: [], a: { tip: [hx + 8.9, mid], head: [hx + 5, mid], gem: [hx + 0.3, hy], blade: [top - 3, top + 13], fx: 'tidepearl' } };
}

// ---------- Spear ----------
// The Tidepearl Trident: a long centre prong of mother-of-pearl spiralled like a narwhal's tusk,
// and two side prongs of coral curving out and up to points; a scallop collar with a pearl where
// they meet, a string of sea-glass beads hanging off it; a driftwood shaft with sea-silk cord where
// the hands go.
function spear() {
  const s = [];
  const S = 32;
  const sock = -S;
  s.push(matte(T(tube([[0, sock + 1], [0.15, -8], [0, 13.4]], 2.4, 2.6), C.drift)), F(T(tube([[0.6, sock + 2], [0.6, 12.6]], 0.6), C.driftLight)));
  s.push(grainLine(-0.5, sock + 4, -6, C.driftDark, 0.2, 0.22), grainLine(0.3, 0, 12, C.driftDark, 0.2, 0.2));
  s.push(...cordWrap(-3, 4, 2.7), ...cordWrap(11.2, 13.6, 2.7));
  s.push(...pearl(0, 14.4, 1.2));
  // The side prongs of coral.
  for (const sd of [-1, 1]) s.push(...coral([...curve([sd * 1, sock + 0.6], [sd * 4.6, sock - 1.4], [sd * 3.8, sock - 6.6], 7), [sd * 3.4, sock - 8.6]], 1.4, 0.4));
  // The narwhal prong.
  const tip = sock - 14;
  s.push(metal(T(mir([[0, tip], [0.7, tip + 3], [1.2, tip + 7], [1.5, sock - 1.5], [1.3, sock + 0.4]]), C.nacre)));
  for (let y = tip + 2; y < sock - 1; y += 1.7) s.push(F(T(tube([[-1.1 * ((y - tip) / 14), y + 1.1], [1.1 * ((y - tip) / 14 + 0.1), y]], 0.32), C.nacreShade)));
  s.push(...sheen(0.9, [tip + 5, tip + 8.5, tip + 12], 0.8), F(T(tube([[0.35, tip + 1.4], [0.6, sock - 2]], 0.3, 0.4), '#ffffff')));
  // The scallop collar, its pearl, the hanging sea-glass beads.
  s.push(...scallop(0, sock + 2.6, 3.4, 30, 150, { ribs: 6 }));
  s.push(...pearl(0, sock + 1.6, 1.1));
  s.push(matte(T(tube(curve([1.8, sock + 2.4], [2.8, sock + 4], [2.4, sock + 6], 5), 0.3), C.cord)));
  for (const [i, [x, y]] of [[2.6, sock + 3.6], [2.6, sock + 5], [2.4, sock + 6.6]].entries()) s.push(...glassDrop(x, y, i === 2 ? 0.8 : 0.55));
  return { shapes: s, blade: [tip, sock], reach: [], a: { tip: [0, tip], head: [0, sock - 6], gem: [0, sock + 1.6], blade: [tip, sock], fx: 'tidepearl' } };
}

// ---------- Staff ----------
// The Tidepearl Staff: a driftwood staff that coral has grown up round; at its top an open clam,
// its lower shell a cup and its upper one lifted behind, holds a great pearl; coral branches
// cradle the clam from below, two drops of sea glass hang from its lip, and a little starfish
// clings to the coral.
function staff() {
  const s = [];
  const S = 26;
  const stem = [[0, 4], [0.4, -6], [-0.3, -15], [0.3, -S]];
  s.push(matte(T(tube(stem, 2.7, 2.4), C.drift)), F(T(tube(stem.map(([x, y]) => [x + 0.6, y]), 0.6, 0.5), C.driftLight)));
  s.push(grainLine(-0.5, -22, -10, C.driftDark, 0.3, 0.26), grainLine(0.3, -9, 1, C.driftDark, 0.2, 0.22));
  s.push(...coral(curve([0.8, -14], [1.8, -18], [0.6, -S + 1], 8), 1.1, 0.7), ...coral(curve([1.2, -17], [3.2, -18.6], [3.4, -20.6], 4), 0.6, 0.4));
  s.push(...cordWrap(-4.4, 2.4, 2.8));
  s.push(...pearl(0.05, 4.4, 1.25));
  // The clam: its upper shell lifted behind, the pearl, its lower shell a cup in front.
  const cx = 0.5;
  const cy = -S - 4.6;
  s.push(...scallop(cx - 0.4, cy + 1.6, 5.4, 32, 176, { ribs: 7 }));
  s.push(...pearl(cx, cy - 0.4, 3.1));
  s.push(...scallop(cx, cy + 0.6, 4.4, 196, 344, { ribs: 6, ears: false }));
  s.push(F(T(tube(arc(cx, cy + 0.6, 4.3, 4.3, 200, 340, 12), 0.45), C.shellLight)));
  // Coral cradling it, the sea-glass drops off its lip, the starfish.
  for (const sd of [-1, 1]) s.push(...coral(curve([sd * 0.6, -S + 1], [sd * 3.4, -S - 1], [sd * 3.6, cy + 2.6], 6), 1.2, 0.55));
  s.push(...glassDrop(cx - 2.6, cy + 6, 0.65), ...glassDrop(cx + 2.9, cy + 5.4, 0.55));
  s.push(...starfish(-2.4, -S - 0.6, 1.4, 12));
  const top = cy - 6.6;
  return { shapes: s, blade: [top, -S], reach: [], a: { tip: [cx, top], head: [cx, cy], gem: [cx, cy - 0.4], blade: [top, -S], fx: 'tidepearl' } };
}

// ---------- Knife ----------
// The Tidepearl Knife: a blade of sea glass, clear teal, frosted pale along its edge with a bubble
// caught in it; a little scallop for a guard with a pearl on it; a sea-silk grip and a pearl
// pommel.
const D = -3;
function dagger() {
  const s = [];
  const L = 14;
  const top = D - L;
  s.push(...cordWrap(-1.8, 4.6, 2.5, 1.05));
  s.push(...pearl(0, 5.6, 1.4));
  const blade = [[-1.7, D], [-1.7, top + 5.6], [-0.9, top + 2.4], [0.9, top], [2.3, top + 2.8], [2.9, top + 6.8], [2.7, D - 2.4], [1.7, D - 1.3], [2, D]];
  s.push(gemmy(T(blade, C.glass)));
  s.push(F(T([[-1.2, D - 0.5], [-1.2, top + 5.8], [-0.6, top + 3.2], [0.9, top + 1.4], [1.8, top + 3.4], [2.2, top + 6.8], [2, D - 2.6], [1.2, D - 0.5]], C.glassLight)));
  s.push(F(T(tube([[1.1, top + 0.4], [2.4, top + 3], [2.9, top + 6.8], [2.65, D - 2.6]], 0.45, 0.32), C.glassCore)), F(E(-0.8, top + 7.4, 0.3, 0.7, C.glassCore)));
  s.push(F(E(0.4, top + 9, 0.7, 0.7, C.glassCore)), F(E(0.4, top + 9, 0.45, 0.45, C.glassLight)), F(E(0.2, top + 8.8, 0.18, 0.18, '#ffffff')));
  s.push(...scallop(0, D + 1.4, 3.6, 12, 168, { ribs: 6, ears: false }), ...pearl(0, D + 0.6, 0.85));
  return { shapes: s, blade: [top, D], reach: [], a: { tip: [0.9, top], head: [0.6, D - L * 0.55], gem: [0, D + 0.6], blade: [top, D], fx: 'tidepearl' } };
}

// ---------- Bow ----------
// The Tidepearl Bow: mother-of-pearl limbs shifting with a rainbow, coral growing out along them;
// sea-glass bands where they leave the grip; a scallop on the riser's front with a pearl in it; a
// sea-silk grip; little spiral shells on the tips; strung with a strand of pearl.
function bow() {
  const s = [];
  const H = BOW_H;
  const str = bowString('#fff3f8');
  s.push(str.shape);
  s.push(metal(T(bowLimb(-1, 1), C.nacre)));
  for (const [u0, u1] of [[-0.94, -0.3], [0.3, 0.94]]) s.push(F(T(bowLimb(u0, u1, -1, 0.32), C.nacreShade)), F(T(bowLimb(u0 * 0.95, u1 * 0.95, 1, 0.28), '#ffffff')));
  // The rainbow along the limbs.
  for (const [i, u] of [-0.78, -0.6, -0.42, 0.42, 0.6, 0.78].entries()) {
    const [x, y] = bowAt(u);
    s.push(F(T(tube([[x - 1.2, y + 0.5], [x + 1.2, y - 0.5]], 0.6), [C.sheenPink, C.sheenBlue, C.sheenMint][i % 3])));
  }
  // Coral along the limbs.
  for (const sd of [-1, 1]) {
    const [x0, y0] = bowAt(sd * 0.5);
    s.push(...coral(curve([x0 + 0.8, y0], [x0 + 3, y0 + sd * 0.4], [x0 + 3.2, y0 - sd * 1.6], 5), 0.8, 0.4));
  }
  // The grip, the sea-glass bands, the scallop and its pearl.
  s.push(matte(T([[-0.9, -2.3], [1.9, -2.3], [2.1, 2.3], [-0.9, 2.3]], C.cord)));
  for (let y = -2.1; y < 2.2; y += 1.05) s.push(F(T(tube([[-0.9, y + 0.8], [2, y]], 0.32), C.cordDark)));
  for (const sd of [-1, 1]) {
    const x = bowX(0.34);
    const y = sd * 0.34 * H;
    s.push(gemmy(T([[x - 1.9, y - 0.55], [x + 1.9, y - 0.55], [x + 1.8, y + 0.55], [x - 1.8, y + 0.55]], C.glass)), F(R(x - 1.6, y - 0.4, 3.2, 0.3, C.glassCore)));
  }
  s.push(...scallop(2.4, 1.6, 3, 20, 160, { ribs: 5, ears: false }), ...pearl(2.5, 0.2, 1));
  // Little spiral shells on the tips.
  const tip = bowX(1);
  for (const sd of [-1, 1]) s.push(matte(E(tip, sd * H, 1.25, 1.15, C.shell)), F(T(tube(arc(tip, sd * H, 0.7, 0.65, 90, 400, 12), 0.25), C.shellRidge)), F(E(tip - 0.35, sd * H - 0.4, 0.35, 0.3, C.shellLight)));
  return { shapes: s, blade: [-H, H], reach: [], a: { tip: [tip, -H], head: [1, 0], gem: [2.5, 0.2], blade: [-H, H], string: str.anchor, fx: 'tidepearl' } };
}

// ---------- Crossbow ----------
// The Tidepearl Crossbow: a driftwood stock with a strip of mother-of-pearl set along its top and a
// scallop shell capping its end; a sea-silk grip, a coral trigger in a cord loop; a mother-of-pearl
// prod with pearls on its tips, bound on with sea-silk round a set sea glass; a cord stirrup; a
// pearl for a nut; and a bolt with a sea-glass point, fletched with two little fins.
function crossbow() {
  const s = [];
  const { cy, px, S, nut } = XB;
  for (const sd of [-1, 1]) s.push(T(tube([[xbProdX(sd), cy + sd * S], nut], 0.7), '#fff3f8'));
  s.push(matte(T(XB_STOCK, C.drift)), F(T(tube([[-8.6, cy + 1.2], [-4, cy + 0.6], [px - 2, cy + 0.2]], 0.3, 0.24), C.driftDark)));
  s.push(metal(T([[-8.8, cy - 1.1], [px - 1.4, cy - 1.7], [px - 1.4, cy - 0.9], [-8.6, cy - 0.3]], C.nacre)), F(T(tube([[-6, cy - 0.5], [-2, cy - 0.85]], 0.4), C.sheenPink)), F(T(tube([[0, cy - 0.95], [5, cy - 1.2]], 0.4), C.sheenBlue)), F(T(tube([[6.5, cy - 1.25], [10.5, cy - 1.45]], 0.4), C.sheenMint)));
  s.push(...scallop(-8.6, cy + 2.2, 3.6, 105, 255, { ribs: 6 }));
  s.push(...coral(curve([-5.2, cy - 0.8], [-6.2, cy - 2.8], [-5.4, cy - 4.2], 5), 0.9, 0.45));
  // The grip, the trigger.
  s.push(matte(T([[-1.3, cy + 1.2], [2.3, cy + 1.2], [1.6, cy + 6.4], [-1.9, cy + 6]], C.cord)));
  for (let y = cy + 1.6; y < cy + 6; y += 1.05) s.push(F(T(tube([[-1.6, y + 0.75], [2.15 - (y - cy) * 0.12, y]], 0.3), C.cordDark)));
  s.push(...pearl(-0.1, cy + 6.5, 1.1));
  s.push(...coral(curve([3, cy + 1.6], [3.6, cy + 2.8], [2.8, cy + 3.8], 5), 0.9, 0.5));
  s.push(matte(T(tube([[2, cy + 1.6], ...curve([2.4, cy + 4.6], [4.6, cy + 4.8], [5.2, cy + 1.6], 6)], 0.55), C.cord)));
  // The groove, the bolt, the pearl nut.
  s.push(F(T(tube([[-1.6, cy - 2.2], [px - 1.2, cy - 2.2]], 0.8), C.driftDark)));
  s.push(matte(T(tube([[-0.6, cy - 2.85], [px + 4.4, cy - 2.85]], 0.9), C.driftLight)));
  s.push(gemmy(T([[px + 7.2, cy - 2.85], [px + 4.3, cy - 4.7], [px + 4.9, cy - 2.85], [px + 4.3, cy - 1]], C.glass)), F(T([[px + 7.2, cy - 2.85], [px + 4.3, cy - 4.7], [px + 4.8, cy - 3.3]], C.glassCore)));
  for (const sd of [-1, 1]) s.push(gemmy(T([[2.6, cy - 2.85], [-0.4, cy - 2.85 + sd * 2.2], [-1.2, cy - 2.85 + sd * 1.8], [0.2, cy - 2.85]], C.glass)), F(T(tube([[2, cy - 2.85 + sd * 0.4], [-0.4, cy - 2.85 + sd * 1.6]], 0.2), C.glassCore)));
  s.push(...pearl(nut[0], nut[1], 1.05));
  // The prod, its pearls, the binding round the sea glass.
  s.push(metal(T(xbProd(), C.nacre)), F(T(xbProd(-1, 0.36), C.nacreShade)), F(T(xbProd(1, 0.26), '#ffffff')));
  for (const [i, u] of [-0.7, -0.4, 0.4, 0.7].entries()) s.push(F(T(tube([[xbProdX(u) - 0.9, cy + u * S + 0.4], [xbProdX(u) + 0.9, cy + u * S - 0.4]], 0.5), [C.sheenPink, C.sheenBlue, C.sheenMint, C.sheenGold][i])));
  for (const sd of [-1, 1]) s.push(...pearl(xbProdX(sd), cy + sd * S, 1));
  s.push(matte(T([[px - 2.2, cy - 2.4], [px + 1.4, cy - 2.4], [px + 1.6, cy + 2.2], [px - 2.2, cy + 2.2]], C.cord)));
  for (let x = px - 2; x < px + 1.4; x += 0.9) s.push(F(T(tube([[x, cy - 2.2], [x + 0.7, cy + 2]], 0.3), C.cordDark)));
  s.push(...glassDrop(px - 0.3, cy - 0.1, 1));
  s.push(matte(T(tube(arc(px + 1.4, cy + 0.6, 3.1, 1.9, 90, -90, 12), 0.8), C.cord)));
  return { shapes: s, blade: [-7, 4], reach: [], a: { tip: [px + 7.2, cy - 2.85], head: [px, cy], gem: [nut[0], nut[1]], blade: [-7, 4], fx: 'tidepearl' } };
}

// The Tidepearl weapons by type (the level-20 ones, `${type}_20`).
export const TIDEPEARL_DESIGNS = { sword, axe, spear, staff, dagger, bow, crossbow };
