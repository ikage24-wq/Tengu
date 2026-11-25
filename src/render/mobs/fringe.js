// The fringe maker (2026-11-25, the player: "you're really missing on bangs, they never look good";
// built on the researched rules in reports/Drawing good anime bangs.md, a 57-rule checklist). It lays
// out a fringe in head units (the face's eyes at y 10, brows near y -4, the top of the face at y -30,
// the skull's top near -50, the face's edges at x ±34) and returns its pieces as shapes:
//   cap     the hair over the top of the head, one size bigger than the skull, its edge the hairline
//   back    the inner layer behind the fringe (a deeper tone), seen through the gaps between chunks
//   shadow  the fringe's light cast shadow on the forehead, in the skin's own shadow tone (draw it on
//           the face, under the fringe)
//   front   the locks themselves: chunks, each one thick lock and a couple of thin ones, every lock
//           springing from the hairline like a fountain from the part, tapering to a rounded tip;
//           their shade, the separation slivers, the broken angel ring on the lit side
//   sides   the side locks framing the face, longer than the fringe, their tips turned in
// How a fringe avoids looking like a comb (the research's rules): 2 or 3 primary chunks, the middle
// one the widest; each split into one thick lock and thinner ones; neighbours differ in width, tip
// height and spacing; tips meet in pairs; one or two locks bend the other way; one or two designed
// triangular gaps; no straight edges; rounded tips (the game's rule: no sharp hair).
import { E, T, F } from './kit.js';
import { band, curve, blob } from './kidbase.js';

// (a little seeded random, so a character's fringe is always the same)
const rng = (seed) => {
  let s = (seed * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};
const lerp = (a, b, u) => a + (b - a) * u;
const lerp2 = (p, q, u) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u)];

// The hairline across the forehead: an irregular arc, lowest at the forehead's corners.
const hairlineY = (x) => -27 + (x / 34) ** 2 * 13;

// One lock: a centre line from `start` (inside the cap) through its root on the hairline to its tip,
// bending sideways by `bend`, `w` wide at the root tapering to a rounded cap at the tip. Returns the
// outline (a closed polygon) and its centre line.
function lockShape(start, root, tip, bend, w, tipW) {
  const mid = lerp2(root, tip, 0.5);
  const d = [tip[0] - root[0], tip[1] - root[1]];
  const L = Math.hypot(d[0], d[1]) || 1;
  const n = [-d[1] / L, d[0] / L];
  const ctrl = [mid[0] + n[0] * bend, mid[1] + n[1] * bend];
  const line = curve([start, root, ctrl, tip], 6);
  const left = [];
  const right = [];
  for (let i = 0; i < line.length; i++) {
    const u = i / (line.length - 1);
    const a = line[Math.max(0, i - 1)];
    const b = line[Math.min(line.length - 1, i + 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / len;
    const ny = (b[0] - a[0]) / len;
    // (full width down to the root, then tapering, a little swell in the middle so no edge is straight)
    const ww = u < 0.25 ? w : lerp(w, tipW, ((u - 0.25) / 0.75) ** 1.15) * (1 + Math.sin(Math.PI * u) * 0.08);
    left.push([line[i][0] + nx * ww * 0.5, line[i][1] + ny * ww * 0.5]);
    right.push([line[i][0] - nx * ww * 0.5, line[i][1] - ny * ww * 0.5]);
  }
  // the rounded cap at the tip
  const [tx, ty] = line[line.length - 1];
  const [px, py] = line[line.length - 2];
  const an = Math.atan2(ty - py, tx - px);
  const cap = [];
  for (let k = 1; k < 6; k++) {
    const a = an - Math.PI / 2 + (k / 6) * Math.PI;
    cap.push([tx + Math.cos(a) * tipW * 0.5, ty + Math.sin(a) * tipW * 0.5]);
  }
  return { poly: [...left, ...cap.reverse(), ...right.reverse()], line };
}

// The styles: how the fringe is laid out.
//   cute     3 chunks, the middle widest and shortest, a gap either side of it, tips just above the eyes
//   swept    2 chunks flowing away from a side part, the big one sweeping across, one counter-curl
//   curtain  parted in the middle, two chunks sweeping out to the sides, forehead showing between them
//   hime     a straight-ish fringe at the brows: 3 chunks of nearly even length, soft rounded corners,
//            straight side locks cut at the cheek
const STYLES = {
  // (tip depths: between the brows, y -4, and the top of the eyes, y 2; a swept chunk may cross one
  // eye's top; a curtain falls past the eyes at its sides only)
  cute: { part: 4, chunks: [[-31, 0.95, 1.6], [-12, 1.45, -1.8], [12, 1.05, 1]], end: 30, flow: 1 },
  swept: { part: -16, chunks: [[-31, 0.8, -3], [-18, 1.9, 2.6]], end: 31, flow: 1 },
  curtain: { part: 0, chunks: [[-31, 1.25, 4], [3, 1.25, 3.4]], end: 31, flow: 1, gap: 6 },
  hime: { part: 0, chunks: [[-30, 1, -2.2], [-10, 1.1, -2.8], [10, 1, -2]], end: 30, flow: 0.4 },
};

// The fringe for a character. C: [light, base, shade, deep] of the hair; skinSh: the skin's shadow
// tone; seed: its own variation; style: one of STYLES; long: adds to the tips' depth (head units);
// sides: side locks' length (to y); seeThrough: a skin-tinted band near some tips.
export function makeFringe({ C, skinSh, seed = 1, style = 'cute', long = 0, sides = 22, seeThrough = false, flip = false }) {
  const S = STYLES[style] ?? STYLES.cute;
  const R = rng(seed);
  const o = flip ? -1 : 1;
  const X = (x) => x * o;
  const part = [X(S.part), -52];
  // lay out the primary chunks between their left edges, their widths in proportion, their tip depth
  const span = S.end - S.chunks[0][0] - (S.gap ?? 0);
  const total = S.chunks.reduce((a, c) => a + c[1], 0);
  let x = S.chunks[0][0];
  const locks = [];
  S.chunks.forEach(([x0, weight, depth], ci) => {
    if (ci > 0 && S.gap && ci === 1) x += S.gap;
    const cw = (span * weight) / total;
    // the chunk split: one thick lock and two thin ones, their order and sizes varied
    // (chibi: fewer, fatter locks; the widest chunk gets a thick lock and two thin, the others one thin)
    const widest = weight === Math.max(...S.chunks.map((c) => c[1]));
    const parts = widest ? (R() < 0.5 ? [0.2, 0.56, 0.24] : [0.58, 0.26, 0.16]) : R() < 0.5 ? [0.64, 0.36] : [0.38, 0.62];
    const order = ci % 2 ? parts : [...parts].reverse();
    let lx = x;
    order.forEach((share, li) => {
      const lw = cw * share;
      const cx = lx + lw / 2;
      const thick = share > 0.4;
      // (tip depth: the chunk's own, the thin locks shorter or longer by a varied amount; never level
      // with a neighbour)
      const vary = thick ? 0 : (li % 2 ? -3.4 : 2.2) + (R() - 0.5) * 1.6;
      locks.push({ cx, lw, depth: depth + vary + long, thick, chunk: ci });
      lx += lw;
    });
    x += cw;
  });
  // each lock's root on the hairline (pulled a little toward the part, a fountain), its tip below,
  // its bend away from the part (one lock in each fringe bends back the other way), tips paired
  const front = [];
  const shapes = [];
  const counter = 1 + Math.floor(R() * (locks.length - 2));
  locks.forEach((lk, i) => {
    const away = Math.sign(lk.cx - S.part) || 1;
    const rx = lerp(lk.cx, S.part, 0.28);
    const root = [X(rx), hairlineY(rx) - 1.5];
    const start = lerp2(root, part, 0.55);
    // (a tip leans toward its partner: thin locks toward the thick one of their chunk)
    const mate = locks.find((m) => m.chunk === lk.chunk && m.thick && m !== lk);
    const lean = mate ? (mate.cx - lk.cx) * 0.22 : 0;
    const sweep = style === 'swept' ? 6 * away : style === 'curtain' ? 7 * away : 2 * away * S.flow;
    const tipX = lk.cx + lean + sweep * 0.5;
    const tip = [X(tipX), lk.depth];
    const bend = (i === counter ? -1 : 1) * away * o * (lk.thick ? 3.2 : 2.2) * (style === 'hime' ? 0.4 : 1);
    // (wide enough to overlap its neighbours, so a chunk reads as one clump with slivers between)
    const w = lk.lw * 1.9 + 2;
    const tipW = Math.max(2.6, lk.lw * (style === 'hime' ? 0.8 : 0.5));
    const { poly, line } = lockShape(start, root, tip, bend, w, tipW);
    shapes.push({ poly, line, lk, tip, root });
  });
  // draw order: the thin locks first, the thick ones over them (nearer, thicker)
  const sorted = [...shapes].sort((a, b) => (a.lk.thick ? 1 : 0) - (b.lk.thick ? 1 : 0));
  // (each lock's fill and then its contact edge, so a lock in front covers the edges behind it: the
  // fine darker line down both sides of its lower part and round its tip, where hair meets the face)
  for (const sh of sorted) {
    front.push(T(sh.poly, C[1]));
    const n = sh.line.length;
    const k0 = Math.round(n * 0.55);
    const L = sh.poly.length;
    const edge = [...sh.poly.slice(k0, n), ...sh.poly.slice(n - 1, L - n + 1), ...sh.poly.slice(L - n, L - k0)];
    if (edge.length > 2) front.push(...band(edge, 0.5, 0.5, C[3], true));
  }
  // each lock's shade: a slim band down its far side from halfway to the tip (the light from the upper
  // left), and the deepest tone tucked under the tips of the thick locks (the overhang above the eyes)
  for (const sh of sorted.filter((q) => q.lk.thick)) {
    const n = sh.line.length;
    const seg = sh.line.slice(Math.round(n * 0.4), n - 1).map(([px, py]) => [px + sh.lk.lw * 0.22 * o, py]);
    if (seg.length > 1) front.push(...band(seg, sh.lk.lw * 0.32, sh.lk.lw * 0.12, C[2], true));
  }
  // the separation slivers: from the V where chunks meet, fading before the tips (fewer than locks)
  const chunkEdges = [];
  for (let i = 1; i < shapes.length; i++) if (shapes[i].lk.chunk !== shapes[i - 1].lk.chunk) chunkEdges.push(i);
  for (const i of chunkEdges) {
    const a = shapes[i - 1];
    const b = shapes[i];
    const top = lerp2(a.root, b.root, 0.5);
    const bot = lerp2(lerp2(a.tip, b.tip, 0.5), top, 0.38);
    front.push(...band(curve([top, lerp2(top, bot, 0.5), bot], 3), 1, 0.2, C[3], true));
  }
  // the angel ring: a broken row of thin slivers across the lit side, each along its own lock
  const ring = [];
  shapes.forEach((sh, i) => {
    if (i % 2 && !sh.lk.thick) return;
    const n = sh.line.length;
    const p = sh.line[Math.round(n * 0.2)];
    const q = sh.line[Math.round(n * 0.34)];
    if (X(p[0]) < -24 || X(p[0]) > 14) return;
    ring.push(F(blob([p, lerp2(p, q, 0.5).map((v, k) => v + (k ? 0 : 0.9)), q, lerp2(p, q, 0.5).map((v, k) => v - (k ? 0 : 0.9))], C[0], 2)));
  });
  front.push(...ring.slice(0, 6));
  // see-through: a skin-tinted band near the tips of some thin locks
  if (seeThrough) {
    for (const sh of shapes.filter((s) => !s.lk.thick).slice(0, 3)) {
      const n = sh.line.length;
      front.push(...band(sh.line.slice(Math.round(n * 0.72), n - 1), sh.lk.lw * 0.6, sh.lk.lw * 0.3, seeThrough, true));
    }
  }
  // the back layer: the inner hair behind the fringe, in the deep tone, down to above the tips so the
  // gaps show it at the top and skin below (the triangular gaps open toward the tips)
  const tipsY = Math.min(...shapes.map((s) => s.tip[1]));
  const back = style === 'curtain'
    // (a curtain parts over the forehead: the inner layer only either side, skin in the middle)
    ? [-1, 1].map((sd) => blob([[sd * 33, hairlineY(33) - 2], [sd * 30, tipsY - 4], [sd * 10, tipsY - 8], [sd * 6, -26]], C[3], 3))
    : [blob([[X(-33), hairlineY(33) - 2], [X(-30), tipsY - 4], [X(0), tipsY - 7], [X(30), tipsY - 4], [X(33), hairlineY(33) - 2], [0, -30]], C[3], 3)];
  // the cast shadow on the forehead: each tip's lower edge, copied down a little, in the skin's shadow
  const shadow = [];
  for (const sh of shapes) {
    const n = sh.line.length;
    const seg = sh.line.slice(Math.round(n * 0.55)).map(([px, py]) => [px + 0.4 * o, py + 2.6]);
    if (seg.length > 1) shadow.push(...band(seg, sh.lk.lw * 1.1, Math.max(1.4, sh.lk.lw * 0.4), skinSh, true));
  }
  // the cap over the head: one size bigger than the skull, its lower edge the hairline
  const hl = [];
  for (let i = 0; i <= 12; i++) {
    const hx = -34 + (i / 12) * 68;
    hl.push([hx, hairlineY(hx) + Math.sin(i * 2.3 + seed) * 0.8]);
  }
  const cap = [blob([...hl, [42, -18], [38, -40], [22, -55], [0, -59], [-22, -55], [-38, -40], [-42, -18]], C[1], 4)];
  // its flow: a few fine lines fanning out from the part toward the hairline (fewer than the locks)
  for (const [ex, k] of [[-30, 0.5], [-14, 0.62], [18, 0.58], [32, 0.46]]) {
    const end = [X(ex), hairlineY(ex) - 6];
    const from = lerp2(part, end, 0.3);
    const mid = lerp2(from, end, 0.5);
    cap.push(...band(curve([from, [mid[0] + (ex - S.part) * 0.08 * o, mid[1] - 2], lerp2(from, end, Math.min(0.92, k + 0.4))], 3), 0.3, 1.1, C[2], true));
  }
  // the side locks: from the temples down past the cheeks, longer than the fringe, tips turned in; a
  // thick one and a thinner one, each side differing a little
  const sideOut = [];
  for (const s of [-1, 1]) {
    const len = sides + (s * o > 0 ? 2.4 : 0);
    for (const [dx, w, extra, ph] of [[0, 11, 0, 0], [4, 7, -6, 1]]) {
      const root = [s * (32 - dx), -16];
      const start = [s * (30 - dx), -34];
      const tip = [s * (31.5 - dx * 0.6) - s * 2.4, len + extra];
      const bend = s * (style === 'hime' ? 0.6 : 2.8) * (ph ? -1 : 1);
      const { poly, line } = lockShape(start, root, tip, bend, w, style === 'hime' ? w * 0.7 : Math.max(1.8, w * 0.32));
      sideOut.push(T(poly, C[1]));
      const n = line.length;
      sideOut.push(...band(line.slice(Math.round(n * 0.35), n - 1).map(([px, py]) => [px + s * w * 0.22, py]), w * 0.34, w * 0.12, C[2], true));
    }
  }
  return { cap, back, shadow, front, sides: sideOut };
}
