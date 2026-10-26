// Hairstyles. Every style has been removed, to be remade from scratch in the CocoPPa style (see
// docs/art/research/avatar.md); until new ones are added everyone is bald. The building blocks
// below are kept for the new styles:
//   - the bangs and top are ONE outline (the "inverted dome" of the fan-art research) whose lower
//     edge is cut into pointed clumps, with a short shadow crease rising from each notch;
//   - the hair behind the head and anything hanging below it is one more outline, a shade darker,
//     whose ends split into points or curls;
//   - shine in a band or in streaks along the flow, and one signature shape per style.
// Coordinates are the hero's head space: skull centre (15.5, 14.6), facing right, chin near y 25.
import { E, T, F } from './pixel.js';

const HX = 15.5;
const CY = 13.2;

export const HAIR_STYLES = ['bald'];
// Any style that no longer exists (every older save) draws as the first one.
export const hairStyleOf = (look) => (HAIR_STYLES.includes(look.hairStyle) ? look.hairStyle : HAIR_STYLES[0]);
// Styles whose long fringe hides the near eye and brow.
export const coversEye = () => false;

// ---------- Building blocks ----------

// A sharp point: kept crisp when the outline is smoothed.
const P = (x, y) => [x, y, 1];
// Points along the skull's hair line from angle a0 to a1 (degrees; 0 = right, 90 = down).
const dome = (a0, a1, n = 12, rx = 12, ry = 11.2) => Array.from({ length: n + 1 }, (_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
  return [HX + rx * Math.cos(a), CY + ry * Math.sin(a)];
});
// Rounds every corner of a closed outline except the sharp points (corner cutting, 3 passes).
function smooth(pts) {
  let p = pts;
  for (let k = 0; k < 3; k++) {
    const out = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i];
      const b = p[(i + 1) % p.length];
      if (a[2]) out.push(a);
      if (!(a[2] && b[2])) out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    p = out;
  }
  return p.map(([x, y]) => [x, y]);
}
const shape = (pts, c) => F(T(smooth(pts), c));
// A zigzag of tips and notches (all sharp), with a soft bow added between each pair so the clumps
// curve: `lean` pushes the bows sideways (positive = toward the face side).
function clumps(pts, lean = 0.6) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    out.push(P(...pts[i]));
    const b = pts[i + 1];
    if (b) out.push([(pts[i][0] + b[0]) / 2 + lean, (pts[i][1] + b[1]) / 2]);
  }
  return out;
}
// The shadow crease that rises from a notch between two clumps.
const crease = (x, y, len, c, tilt = 0) => F(T([[x - 0.55, y + 0.2], [x + 0.55, y + 0.2], [x + tilt, y - len]], c));
// Creases at every notch of a zigzag (the odd points when it starts on a tip).
const creases = (pts, from, c, len = 3.2, tilt = 0.4) => pts.filter((_, i) => i % 2 === from).map(([x, y]) => crease(x, y, len, c, tilt));
// The angel ring: one highlight band following the skull, in a few pieces with a soft zigzag edge.
function shine(c, cx = HX, cy = 9.6, rx = 8.6, ry = 5.2, a0 = 214, a1 = 326, parts = 3) {
  const out = [];
  const gap = 7;
  const span = (a1 - a0 - gap * (parts - 1)) / parts;
  for (let k = 0; k < parts; k++) {
    const s0 = a0 + k * (span + gap);
    const top = [];
    const bot = [];
    for (let i = 0; i <= 6; i++) {
      const a = ((s0 + (span * i) / 6) * Math.PI) / 180;
      const d = 1.25 * (i === 0 || i === 6 ? 0.3 : i % 2 ? 1.1 : 0.65);
      top.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
      bot.push([cx + (rx - d) * Math.cos(a), cy + (ry - d) * Math.sin(a)]);
    }
    out.push(F(T([...top, ...bot.reverse()], c)));
  }
  return out;
}
// Shaved hair: a short fuzz over the skull down to the hairline.
const fuzz = (r) => F(T(smooth([...dome(165, 375), [25.6, 11.4], [21, 8.4], [HX, 7.8], [10, 8.4], [5.4, 11.4]]), r.sh1));
const flipPts = (pts) => pts.map(([x, y, s]) => (s ? [31 - x, y, s] : [31 - x, y])).reverse();
// Points below `y0` swing sideways with the hair spring, more the lower they are.
const swing = (pts, s, y0 = 18, k = 0.06) => pts.map(([x, y, sh]) => [x + (y > y0 ? s * (y - y0) * k : 0), y, sh].slice(0, sh ? 3 : 2));
// The two side locks that frame the face, and the default fringe between them, as one lower
// edge (from the near cheek round to the far one).
const NEAR = [[26.8, 17], [27.4, 20.2], P(26.4, 23.8), [25, 19.4], P(24.6, 12.8)];
const FAR = [P(6.6, 12.4), [6.2, 18.6], P(4.8, 23.4), [3.8, 20]];
const FRINGE = [[23.4, 14.4], [21.6, 11.6], [19.8, 15.2], [17.8, 12], [15.4, 15.8], [13.4, 12.2], [11, 15.2], [9.2, 12], [7.8, 14]];

// The front hair: the top of the head (the skull's hair line from the far cheek over to the near
// one) closed by a lower edge. Returns the shapes and the band of forehead it shades.
function front(edge, r, extra = [], top = dome(160, 380)) {
  const pts = smooth([...top, ...edge]);
  const out = [F(T(pts, r.base))];
  // The shade is a thin band under each run of the lower edge that lies over the face.
  const shade = [];
  let run = [];
  const flush = () => {
    if (run.length > 2) shade.push(F(T([...run.map(([x, y]) => [x, y + 1.1]), ...run.map(([x, y]) => [x, y - 0.3]).reverse()], '#000')));
    run = [];
  };
  for (const pt of pts) {
    const [x, y] = pt;
    const prev = run[run.length - 1];
    if (x > 7.6 && x < 23.4 && y > 9 && y < 18) {
      if (prev && Math.hypot(x - prev[0], y - prev[1]) > 2) flush();
      run.push(pt);
    } else flush();
  }
  flush();
  return { shapes: [...out, ...extra], shade };
}
const standard = (fringe = FRINGE, lean = 0.6) => [...NEAR, ...clumps(fringe, lean), ...FAR];

// ---------- The styles ----------

// Behind the head: { head, hang }. `head` sits behind the skull, `hang` falls below it (it sways
// and is drawn behind the body).
export function hairBehind() {
  return { head: [], hang: [] };
}

// In front: { shapes, shade }, the bangs and the band of forehead they shade.
export function hairBangs() {
  return { shapes: [], shade: [] };
}

// Seen from behind (climbing): the hair over the back of the skull. Empty when bald, so the
// skull shows.
export function hairNape() {
  return [];
}
