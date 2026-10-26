// Hairstyles. Each one is a few clean, smooth shapes rather than a pile of small parts:
//   - the bangs and top are ONE outline (the "inverted dome" of the fan-art research) whose lower
//     edge is cut into pointed clumps, with a short shadow crease rising from each notch;
//   - the hair behind the head and anything hanging below it is one more outline, a shade darker,
//     whose ends split into two or three points;
//   - one highlight band across the crown, and one signature feature per style (tails, buns,
//     a crest, a swoop) so every style reads by its silhouette alone.
// Coordinates are the hero's head space: skull centre (15.5, 14.6), facing right, chin near y 25.
import { E, T, F } from './pixel.js';

const HX = 15.5;
const CY = 13.2;

// Grouped by feel: anime, fantasy, cool, punk, cute.
export const HAIR_STYLES = ['hero', 'ahoge', 'hime', 'twintails', 'sidetail', 'princess', 'odango', 'drills', 'wolf', 'swoop', 'ponytail', 'topknot',
  'mohawk', 'undercut', 'pixie', 'fluffy', 'wavy', 'curly', 'lowtails', 'braid'];
// Older styles draw as the closest current one.
const RETIRED = { bob: 'ahoge', curtain: 'ahoge', short: 'ahoge', spiky: 'hero', sweep: 'swoop', eyecover: 'swoop', quiff: 'pixie', bun: 'topknot', halfup: 'princess', long: 'wavy' };
export const hairStyleOf = (look) => RETIRED[look.hairStyle] ?? look.hairStyle ?? 'ahoge';
// Styles whose long fringe hides the near eye and brow.
export const coversEye = (style) => style === 'swoop';

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

// ---------- Behind the head ----------

// Returns { head, hang }: `head` sits behind the skull, `hang` falls below it (it sways and is
// drawn behind the body).
export function hairBehind(style, r) {
  const c = r.sh1;
  const d = r.sh2;
  const crown = F(E(HX, 13.2, 12, 11.2, c));
  const nape = (y = 26, w = 10) => shape([[HX - w, 15], [HX - w - 0.6, 21], P(HX - w + 1.2, y), [HX - 3, y - 2.4], P(HX, y + 0.6), [HX + 3, y - 2.4], P(HX + w - 1.2, y), [HX + w + 0.6, 21], [HX + w, 15]], c);
  switch (style) {
    case 'hero': return {
      // Five big swept spikes round the back and top of the head, and two at the nape.
      head: [shape([[8, 22], P(1.6, 21.8), [3.4, 17], P(-2.6, 11.4), [3.6, 8.4], P(0.8, 1.6), [7.6, 3.4], P(7.8, -4.2), [12.6, 1.2], P(16.8, -5.2), [19.4, 1.4], P(25.2, -2.2), [26.6, 6], [27.6, 9], [27.6, 15], [23, 22]], c)],
      hang: [],
    };
    case 'ahoge': return { head: [crown], hang: [nape(26.4, 11)] };
    case 'hime': return {
      head: [crown],
      // Long and straight, cut level just above the waist with small notches.
      hang: [shape([[4, 14], [3.8, 30], P(4, 38.4), [6.6, 38.4], P(7.4, 37.4), P(8.2, 38.6), P(14.6, 38.6), P(15.4, 37.6), P(16.2, 38.6), P(22.8, 38.6), P(23.6, 37.4), P(24.4, 38.4), P(27, 38.4), [27.2, 30], [27, 14]], c),
        ...[[7.4, 37.4], [15.4, 37.6], [23.6, 37.4]].map(([x, y]) => crease(x, y, 5, d, 0))],
    };
    case 'twintails': {
      // Tied high: each tail swells out from its tie and tapers into two points.
      const tail = [[6.2, 7.6], [2.6, 8.4], [-0.8, 13], [-2.4, 21], [-2, 30], P(-0.6, 39.6), [1, 34.4], P(3.2, 38), [3.8, 29], [5, 19], [6.6, 11]];
      return {
        head: [crown, F(E(5.2, 9, 1.4, 1.8, d)), F(E(25.8, 9, 1.4, 1.8, d))],
        hang: [shape(tail, c), shape(flipPts(tail), c), crease(1, 34.2, 6, d, -0.4), crease(30, 34.2, 6, d, 0.4)],
      };
    }
    case 'sidetail': return { head: [crown], hang: [nape(24.6, 10)] };
    case 'princess': return {
      head: [crown],
      // Very long and flowing, past the hips, parting into three points at the ends.
      hang: [shape([[4, 14], [2.6, 26], [2, 38], P(3.4, 47), [7.6, 43.4], P(11, 48.4), [15.5, 44.6], P(20, 48.4), [23.4, 43.4], P(27.6, 47), [29, 38], [28.4, 26], [27, 14]], c),
        ...[[7.6, 43.4], [15.5, 44.6], [23.4, 43.4]].map(([x, y]) => crease(x, y, 7, d, 0))],
    };
    case 'odango': {
      // Two round buns high on the head, each with one spiral turn, and a thin tail from each.
      const bun = (x) => [F(E(x, 3.2, 4.2, 3.9, c)), F(T(smooth([[x - 2.6, 2.4], [x - 1, 0.6], [x + 1.6, 0.8], [x + 2.8, 2.6], [x + 2, 2.8], [x + 0.6, 1.8], [x - 1, 2]]), d))];
      const tail = [[5, 5], [2.8, 9], [1.4, 20], P(1.2, 36), [3.6, 28], [5.6, 16], [6.8, 8]];
      return { head: [crown, ...bun(6.6), ...bun(24.4)], hang: [shape(tail, c), shape(flipPts(tail), c)] };
    }
    case 'drills': {
      // Ojou-sama ringlets: a stack of shrinking coils on each side, each turn split by a crease.
      const coil = (x, dir) => Array.from({ length: 5 }, (_, k) => {
        const y = 17 + k * 4.2;
        const rr = 3.6 - k * 0.38;
        const cx = x + (k % 2 ? 0.5 : -0.5) * dir;
        return [F(E(cx, y, rr, 2.6, c)), F(T(smooth([[cx - rr * 0.8, y + 0.6], [cx, y + 1.9], [cx + rr * 0.8, y + 0.6], [cx, y + 1.2]]), d))];
      }).flat();
      return { head: [crown], hang: [...coil(3.6, 1), ...coil(27.4, -1)] };
    }
    case 'wolf': return {
      head: [crown],
      // Shaggy layers flicking out at the jaw, and a longer mullet behind in three points.
      hang: [shape([[3.6, 12], [1.8, 18], P(-0.6, 24.6), [3.2, 23.4], [3.4, 27], P(4.6, 33), [8.4, 29], P(10.6, 33.6), [15.5, 30], P(20.4, 33.6), [22.6, 29], P(26.4, 33), [27.6, 27], [27.8, 23.4], P(31.6, 24.6), [29.2, 18], [27.4, 12]], c),
        ...[[8.4, 29], [15.5, 30], [22.6, 29]].map(([x, y]) => crease(x, y, 4, d, 0))],
    };
    case 'swoop': return { head: [crown], hang: [nape(22.4, 10)] };
    case 'ponytail': return {
      head: [crown, F(E(4.2, 6.2, 1.6, 2, d))],
      // Tied high at the back: the tail lifts out of the tie and falls in a long S, in two points.
      hang: [shape([[5, 4.6], [1.4, 4.8], [-2, 8.4], [-3.8, 16], [-3.4, 26], P(-1.4, 36.6), [0.4, 31.4], P(2.8, 34.6), [2.8, 25], [3.4, 15], [5.2, 8.6]], c), crease(0.4, 31.4, 6, d, 0.6)],
    };
    case 'topknot': return {
      // Everything drawn up into a neat knot on top, with a short tuft standing out of it.
      head: [crown, shape([[13, 1.4], P(12.2, -5.6), [14.6, -3.4], P(16.4, -7.2), [17.4, -3], P(19.6, -5), [18.8, 0.6]], c), F(E(HX, -0.4, 4.6, 3.6, c)), F(E(HX, 2.6, 4.2, 1.1, d))],
      hang: [],
    };
    case 'mohawk': return {
      // A tight shaved skull and a tall crest of spikes running front to back.
      head: [F(E(HX, 13.4, 11.2, 10.4, d)), shape([[9.6, 6], P(8, -1.4), [11.4, 1], P(11.8, -6.4), [14.2, -1.6], P(16.6, -8.6), [18, -2.2], P(21.6, -5.6), [21.4, 0.8], P(25.8, 0.4), [22.6, 5.6]], c)],
      hang: [],
    };
    case 'undercut': return {
      // One side shaved to a dark fuzz; the rest grows long toward the near side.
      head: [F(E(HX, 13.4, 11.2, 10.4, d)), F(E(HX + 2, 12.6, 10.6, 10.4, c))],
      hang: [shape([[22, 14], [28, 16], [28.4, 24], P(27.6, 30.6), [25.6, 26.6], P(23, 29), [22, 22]], c)],
    };
    case 'pixie': return {
      // Short and close, with a few spikes kicking up at the crown and flicks at the nape.
      head: [shape([[6, 21], P(4.2, 22.6), [3.6, 16], [3.6, 10], P(1.8, 4.2), [7, 3], P(9.4, -1.4), [13.2, 1.6], [20, 1.6], [27, 7], [27.4, 14], [24, 22], P(12, 23.8)], c)],
      hang: [],
    };
    case 'fluffy': {
      // A big soft cloud of long hair, much wider than the head, in rounded puffs (no points).
      const puffs = [[4, 12], [0.6, 16], [1, 23], [-0.4, 28.4], [1.8, 34], [5.4, 37.6], [10.4, 37], [15.5, 39], [20.6, 37], [25.6, 37.6], [29.2, 34], [31.4, 28.4], [30, 23], [30.4, 16], [27, 12]];
      return { head: [crown], hang: [shape(puffs, c)] };
    }
    case 'wavy': return {
      head: [crown],
      // Long waves: the outline ripples in an S down each side and ends in three soft points.
      hang: [shape([[4, 14], [1.6, 20], [3.6, 26], [1.4, 32], [3, 38], P(3.4, 43), [8.6, 39.6], P(11.6, 44), [15.5, 40.6], P(19.4, 44), [22.4, 39.6], P(27.6, 43), [28, 38], [29.6, 32], [27.4, 26], [29.4, 20], [27, 14]], c),
        ...[[8.6, 39.6], [15.5, 40.6], [22.4, 39.6]].map(([x, y]) => crease(x, y, 6, d, 0))],
    };
    case 'curly': {
      // Bouncy curls to the shoulders: a scalloped outline of round curls all round.
      const n = 15;
      const pts = Array.from({ length: n }, (_, i) => {
        const a = ((150 - (300 * i) / (n - 1)) * Math.PI) / 180;
        const rr = i % 2 ? 13.4 : 15;
        return [HX + rr * Math.cos(a) * 0.98, 13 - rr * Math.sin(a) * 0.86];
      });
      return { head: [shape([[HX - 9, 25], ...pts, [HX + 9, 25], [HX, 22]], c)], hang: [] };
    }
    case 'lowtails':
    case 'braid': return { head: [crown], hang: [nape(23.6, 10)] };
    default: return { head: [crown], hang: [] };
  }
}

// ---------- In front: the bangs and anything worn over the shoulders ----------

// Returns { shapes, shade }. `sway` is the hair's tip spring; `mood` (the face) moves the ahoge.
export function hairBangs(style, r, sway = 0, mood = 'smile') {
  const c = r.base;
  const s = r.sh1;
  const d = r.sh2;
  const ring = shine(r.hi);
  const std = (fringe = FRINGE, extra = [], lean = 0.6) => front(standard(fringe, lean), r, [...creases(fringe, 1, s), ...extra, ...ring]);
  switch (style) {
    case 'hero': {
      // Sharp, uneven bangs with one long spike between the eyes; the side locks flare out.
      const f = [[23.2, 13.4], [21.2, 11], [19.4, 14.6], [17.6, 11.4], [15.2, 17], [13.2, 11.6], [10.6, 15], [8.8, 11.2], [7.2, 13]];
      return front([[27, 15], P(30, 19.4), [25.6, 17.6], P(24.6, 12.4), ...clumps(f, 0.4), P(6.6, 12.2), [5.4, 17.4], P(1.4, 19.4), [3.8, 15]], r, [...creases(f, 1, s), ...ring], dome(165, 375));
    }
    case 'ahoge': {
      // Soft, slightly messy bangs, and one antenna strand on top that bounces with every move,
      // perks up when excited and wilts when sulking.
      const droop = mood === 'pout' || mood === 'shy';
      const perk = mood === 'excited' || mood === 'angry';
      const tx = 18.6 + sway * 1.2 + (droop ? 5 : 1.4);
      const ty = droop ? 0.6 : perk ? -6.8 : -5;
      const strand = shape([[13.6, 3.2], [15, -0.4], P(tx, ty), [16.6, 0.6], [15.8, 3.4]], c);
      const res = std();
      res.shapes.unshift(strand);
      return res;
    }
    case 'hime': {
      // Blunt bangs cut straight across and side locks cut level at the chin, with tiny notches.
      const edge = [[27, 15], P(27.2, 24.4), P(24.4, 24.4), P(23.8, 23.6), P(23.2, 24.4), P(22.4, 24.4), P(22.4, 14.8), P(19.6, 14.8), P(19, 14), P(18.4, 14.8), P(12.6, 14.8), P(12, 14), P(11.4, 14.8), P(8.6, 14.8),
        P(8.6, 24.4), P(7.8, 24.4), P(7.2, 23.6), P(6.6, 24.4), P(3.8, 24.4), [4, 15]];
      return front(edge, r, [crease(19, 14, 3, s, 0), crease(12, 14, 3, s, 0), ...ring]);
    }
    case 'twintails':
    case 'odango':
    case 'drills':
      return std();
    case 'sidetail': {
      // Bangs swept toward a tail tied high over the near temple; the tail arcs out and falls in
      // front of the shoulder, a beat behind the head.
      const f = [[23.2, 13], [21.4, 11], [19.6, 15], [17.6, 11.6], [15.2, 15.2], [13.2, 11.8], [11.2, 14.6], [9.4, 11.8], [7.8, 13.6]];
      const tail = shape(swing([[25.4, 6], [29, 5], [31.6, 9.6], [32.6, 18], [31.6, 26], P(30.6, 33.4), [29.6, 28.4], P(27.4, 32.6), [27.6, 22], [26.6, 12]], sway, 12, 0.08), c);
      const res = front([[26.8, 15], [26.4, 12.6], P(24.6, 12.2), ...clumps(f, 0.8), ...FAR], r, [...creases(f, 1, s), tail, crease(29.6, 28.4, 5, s, 0.6), F(E(26.4, 7.4, 1.4, 1.8, d)), ...ring]);
      return res;
    }
    case 'princess': {
      // Parted in the middle so the brow shows: the bangs sweep apart from the part into long
      // locks that frame the face down to the chest.
      const near = [[27, 15], [27.8, 24], P(27.4, 33.6), [25.6, 26], [24.6, 18], P(24.2, 13), [23, 14.6], P(21.4, 11.4), [19.6, 13.6], P(17.2, 12.4), P(HX, 10.2)];
      return front([...near, ...flipPts(near).slice(1)], r, [crease(21.4, 11.4, 2.6, s, -0.6), crease(9.6, 11.4, 2.6, s, 0.6), ...shine(r.hi, HX, 9.6, 8.6, 5.2, 214, 326, 2)]);
    }
    case 'wolf': {
      // Choppy bangs split off-centre, and layers flicking out at the cheeks and the jaw.
      const f = [[22.6, 14], [20.8, 11.2], [19.4, 15.6], [17.4, 11], [14.8, 15.2], [13.6, 11.4], [10.8, 15.4], [9, 11.6], [7.6, 13.4]];
      return front([[27, 15], P(29.6, 17.6), [26.4, 18.4], [27.4, 21.4], P(28.6, 25.4), [25, 22], [24.6, 17], P(24.4, 12.6), ...clumps(f, 0.4),
        P(6.6, 12.6), [6.4, 17], [4.6, 22], P(2.4, 25.4), [3.6, 21.4], [4.6, 18.4], P(1.4, 17.6), [4, 15]], r, [...creases(f, 1, s), ...ring]);
    }
    case 'swoop': {
      // A long fringe swept down from a deep part over the near eye to the jaw, ending in two
      // points; it sways enough to give a peek. The far side is short and neat.
      const p = sway * 0.4;
      const edge = [[27.2, 16], [27.6, 21], P(26.4 + p, 27.4), [24.6 + p, 25.6], P(22.4 + p, 28.6), [20 + p, 24], [17.8, 18.6], [15.6, 13.4], [13.6, 11.6],
        P(12.6, 11.4), P(11.4, 14.6), P(10, 11.8), P(8.4, 14), P(7, 12), [6.2, 16], P(5, 20.2), [3.8, 17]];
      return front(edge, r, [crease(24.6 + p, 25.6, 6, s, -0.6), F(T(smooth([[13.2, 6], [17.4, 10.4], [20.6, 17], [21.8, 22], [21, 17.4], [18, 11], [14, 7]]), s)), crease(10, 11.8, 2.6, s, 0),
        ...shine(r.hi, HX + 1, 9.4, 8.8, 5.4, 220, 330, 2)]);
    }
    case 'ponytail':
    case 'topknot': {
      // Swept back to the tie: short side-parted bangs that leave the brow open.
      const f = [[23, 12], [21.4, 9.6], [19.6, 13], [17.6, 10], [15.2, 13.6], [13.2, 10.2], [11, 13.2], [9.2, 10.4], [7.8, 12.4]];
      return front([[26.8, 16], [27, 19.4], P(26, 22.4), [24.8, 18.4], P(24.6, 12), ...clumps(f, 0.9), ...FAR], r, [...creases(f, 1, s), ...ring]);
    }
    case 'mohawk':
      // Only the front of the crest shows over the brow, rising up and a little forward.
      return { shapes: [fuzz(r), shape([[12.4, 7.4], P(11.6, 0.4), [14.4, 2.6], P(15.6, -5.6), [17.6, 0.6], P(20.6, -3.4), [20.2, 2.4], P(24.4, 2.2), [20.6, 7]], c), F(T(smooth([[15.6, -3.6], [16.6, 1.6], [16.6, 5.6], [15.4, 2]]), r.hi))], shade: [] };
    case 'undercut': {
      // The far side shaved; everything else swept across into sharp points and left long on the
      // near side, past the jaw.
      const f = [[22.6, 14.6], [20.6, 11.6], [18.4, 15.8], [16.6, 11.6], [13.6, 15], [12.4, 11], [10.2, 13.2]];
      const res = front([[27.2, 16], [28.6, 22], P(28.2, 28.8), [26, 24.6], P(24.6, 26.6), [24.2, 19], P(24.4, 13), ...clumps(f, 1.2), [9, 9.4]], r, [...creases(f, 1, s), crease(26, 24.6, 5, s, -0.6), ...shine(r.hi, HX + 2, 9.4, 8, 5, 222, 330, 2)], dome(205, 380));
      res.shapes.unshift(fuzz(r));
      return res;
    }
    case 'pixie': {
      // Short choppy bangs high on the brow.
      const f = [[23, 12.2], [21.2, 10.2], [19.2, 13], [17.4, 10.4], [15, 13.4], [13, 10.6], [10.8, 13], [9, 10.6], [7.6, 12.4]];
      return front([[26.8, 15], P(26.4, 19.2), [25, 16], P(24.6, 11.6), ...clumps(f, 0.5), P(6.6, 11.6), [5.8, 15.4], P(4.6, 19.6), [3.8, 16]], r, [...creases(f, 1, s, 2.6), ...ring]);
    }
    case 'fluffy': {
      // Rounded bangs and soft round curls down both cheeks.
      const edge = [[26.8, 15], [29.4, 17.6], [29, 22], [26.4, 24], [24.4, 21], [24.8, 13.6], [22.2, 14.4], [20.6, 12.4], [18.4, 15], [16.2, 12.6], [13.6, 15.2], [11.4, 12.6], [9, 14.6], [6.4, 13.4], [6.4, 21], [4.4, 24], [1.8, 22], [1.6, 17.6], [4, 15]];
      return front(edge, r, [crease(20.6, 12.4, 2.6, s, 0), crease(16.2, 12.6, 2.6, s, 0), crease(11.4, 12.6, 2.6, s, 0), ...ring]);
    }
    case 'wavy': {
      // The side locks ripple down past the shoulders.
      const near = [[26.8, 17], [28, 21], [26.6, 25], [27.8, 28.6], P(26.6, 31.6), [25.4, 27.6], [26, 23.6], [24.4, 19], P(24.6, 12.8)];
      const far = [P(6.6, 12.4), [6.6, 19], [5, 23.6], [5.4, 27.6], P(4.4, 31.6), [3.2, 28.6], [4.4, 25], [3, 21]];
      return front([...near, ...clumps(FRINGE, 0.6), ...far], r, [...creases(FRINGE, 1, s), ...ring]);
    }
    case 'curly': {
      // A fringe of round curls across the brow, each with a crease under it.
      const edge = [[27.4, 15], [28.4, 19], [26.4, 21.4], [24.4, 18.6], [24.8, 14.6], [22.6, 13.6], [20.8, 14.8], [18.8, 13.8], [16.6, 15.2], [14.2, 13.8], [12, 15], [9.8, 13.6], [7.8, 14.6], [6.4, 13.8], [6.2, 18.8], [4.4, 21.4], [2.6, 19], [3.6, 15]];
      return front(edge, r, [...[[21.4, 12.6], [17.2, 13], [12.6, 13], [8.8, 12.6], [26.2, 18.4], [4.6, 18.4]].map(([x, y]) => F(T(smooth([[x - 1.4, y], [x, y + 0.9], [x + 1.4, y], [x, y + 0.4]]), s))), ...ring]);
    }
    case 'lowtails': {
      // Two tails tied low at the jaw, lying forward over the shoulders, each ending in two points.
      const tail = (x, dir) => shape(swing([[x - 2.4 * dir, 19], [x - 3 * dir, 26], [x - 2 * dir, 32], P(x - 1.8 * dir, 37), [x, 33.4], P(x + 1.8 * dir, 36), [x + 2.6 * dir, 28], [x + 2 * dir, 20]], sway * (dir > 0 ? 0.5 : 0.7), 20), c);
      const res = std(FRINGE, [tail(26.2, 1), tail(4.8, -1), F(E(26.2, 20, 2.4, 1, d)), F(E(4.8, 20, 2.4, 1, d)), crease(26.2, 33.4, 5, s, 0), crease(4.8, 33.4, 5, s, 0)]);
      return res;
    }
    case 'braid': {
      // Side-swept bangs, and a thick plait brought forward over the near shoulder: a stack of
      // rounded knots, each tucked under the one above.
      const f = [[23.2, 13.2], [21.6, 11.4], [19.8, 15], [17.2, 11.6], [14.6, 15.8], [12.6, 11.8], [10.4, 14.8], [8.8, 12], [7.6, 13.6]];
      const bx = 25.4 + sway * 0.3;
      const knots = [];
      for (let k = 0; k < 5; k++) {
        const y = 21 + k * 2.6;
        const x = bx + (k % 2 ? 0.5 : -0.5) - k * 0.25;
        const w = 2.5 - k * 0.14;
        knots.push(F(E(x, y, w, 1.8, c)), F(T(smooth([[x - w * 0.8, y + 0.8], [x, y + 1.9], [x + w * 0.8, y + 0.8], [x, y + 1.3]]), s)));
      }
      const end = shape([[bx - 2.2, 33.4], P(bx - 2, 38), [bx - 1, 35.6], P(bx, 37.6), [bx + 0.2, 33.4]], c);
      return front(standard(f, 1), r, [...creases(f, 1, s), end, ...knots, F(E(bx - 1.1, 33.4, 1.6, 0.8, d)), ...ring]);
    }
    default:
      return std();
  }
}

// ---------- Seen from behind (climbing) ----------

// The back of the head: the hair over the skull, the nape shadow and the shine.
export function hairNape(style, r) {
  const ring = shine(r.hi, HX, 10, 9, 5.6, 210, 330);
  const nape = F(E(HX, 20.4, 9.8, 4, r.sh1));
  switch (style) {
    case 'mohawk': return [F(E(HX, 13.6, 11.4, 10.8, r.sh2)), shape([[12.8, 2.4], [18.2, 2.4], [17.4, 17], P(HX, 22.6), [13.6, 17]], r.base), ...shine(r.hi, HX, 10, 2.4, 6, 236, 304, 1)];
    case 'undercut': return [F(E(HX, 13.6, 12, 11.2, r.sh2)), F(E(HX - 2, 13, 10, 10.6, r.base)), nape, ...shine(r.hi, HX - 2, 10, 7.4, 5.4, 214, 326, 2)];
    case 'topknot': return [F(E(HX, 13.6, 12, 11.2, r.base)), F(E(HX, 20.4, 9.8, 4, r.sh1)), ...ring, F(E(HX, -0.4, 4.6, 3.6, r.base)), F(E(HX, 2.6, 4.2, 1.1, r.sh2))];
    default: return [F(E(HX, 13.6, 12, 11.2, r.base)), nape, ...ring];
  }
}
