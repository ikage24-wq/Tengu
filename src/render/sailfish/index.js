// The Sailfish Fencer (2026-11-26, the Sunken Aquarium Palace's `seahorseknight`, remade from scratch:
// the old Seahorse Squire is gone): the fencing master of Queen Coralie's palace guard. Dramatic, vain
// and terribly proper: he bows before every bout and narrates his own duels (the honourable duellist,
// gently mocked). A chubby chibi sailfish: a big head, a round body a little longer than a round fish's,
// a cobalt-blue back fading to a silver-pearl belly with a few soft periwinkle bars. His own long bill
// IS his épée: rounded all along its length and ending in a pearl fencing button ("palace rules: no
// pointy ends"). His huge sail of a dorsal fin rises and fans out for "En garde!" and folds flat back
// along his back when he is calm. The palace livery: a coral-pink fencing sash across his body, done up
// with a PEARL clasp. He floats a hand's height over the floor, swimming level (his tail's beat run on
// by the distance swum), and leans into his lunges by pitching his whole body. His body is his own copy
// of the fish base's round fish (sailbase.js).
//   idle    his act, in four pieces, each whole in itself, the next one that fits the time he has
//           (data `rest`; world/mobs.js tells him how long, `m.restUntil`):
//           - the salute: to attention, the bill raised up before his brow, the sail snapping up;
//             a crisp flick down; held, formal; at ease;
//           - practice: a bubble drifts by; he lunges at it, misses (it bobs up), lunges again,
//             misses (it ducks), then a grand wind-up and pop! a flourish and a smug look round;
//           - the mirror: he admires his reflection along his polished bill (a glint sliding down
//             it, a twinkle in his eye), then smooths his sail with a fin, stroke by stroke;
//           - the bow: a deep courtly bow, a pectoral swept across his front, the other out behind;
//             up again, proud.
//   moves   (def.moves, in turn; the deepest wind-ups of the palace household where the move is
//           strongest) Lunge: a long coiled draw-back, the sail flared, a glint running up the bill,
//           then the straight thrust at full reach, a soft periwinkle swoosh along the bill and a round
//           "touché" sparkle at its pearl. Flèche: crouched low, then a dash-thrust right through,
//           bubbles streaming off his tail. Parry-Riposte: reared back with the sail flared wide in a
//           shimmer (the parry), then a quick riposte flick of the bill.
//   faces   his own: proud almond eyes, upturned at the outer corner, a steel-blue iris with a crisp
//           blade-gleam glint (a little curvy four-point star) and a neat lash line on top (the whole
//           iris always shows awake); one swoopy round-ended brow over each eye that does the duelling
//           drama; a confident little mouth under the bill's root with a smug corner. Grand,
//           theatrical, honour-bound, secretly sweet.
//   marks   all his own (`ownEmotes`), in scalloped bubbles like his sail's edge: "En garde!" (a "!"
//           drawn as a little épée with a pearl for its dot, the sail snapping up, a salute flick) as
//           he starts hunting you, a "?" when he loses you, a flourish and a "touché" sparkle note
//           after landing a hit, a squeezed wince with his sail flinching flat when hit, a sweat drop
//           when low, soft z's asleep (sail folded, drifting), dizzy sparkles when beaten.
import { dressedSailfish } from './sailbase.js';

// ---------- Little helpers ----------
const TAU = Math.PI * 2;
const D2R = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, u) => a + (b - a) * u;
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const easeOut = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;
// (a beat's weight: 0 before t0, eased up to 1 by t1, held to t2, eased back to 0 by t3)
const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
};
const rgb = (hex) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgba = (hex, al) => {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${clamp(al, 0, 1)})`;
};
// (a colour washed toward white as the hit flash shows)
const lit = (a, hex, al = 1) => {
  const k = Math.min(0.85, Math.max(0, (a?.flash ?? 0) * 6));
  const [r, g, b] = rgb(hex);
  const f = (v) => Math.round(v + (255 - v) * k);
  return `rgba(${f(r)},${f(g)},${f(b)},${clamp(al, 0, 1)})`;
};
function glow(ctx, x, y, r, hex, al) {
  if (al <= 0.005 || r <= 0.01) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(hex, al));
  g.addColorStop(1, rgba(hex, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
// a curvy four-point sparkle (the game's)
function sparkle(ctx, x, y, k, fill) {
  if (k <= 0.01) return;
  ctx.beginPath();
  ctx.moveTo(x, y - k);
  ctx.quadraticCurveTo(x, y, x + k, y);
  ctx.quadraticCurveTo(x, y, x, y + k);
  ctx.quadraticCurveTo(x, y, x - k, y);
  ctx.quadraticCurveTo(x, y, x, y - k);
  ctx.fillStyle = fill;
  ctx.fill();
}
// a smooth stroke through [p0, c, p1, c, p2 ...]
function stroke(ctx, pts, w, col) {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
  ctx.stroke();
}
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const scl = (p, k) => [p[0] * k, p[1] * k];
const lerp2 = (p, q, u) => [mix(p[0], q[0], u), mix(p[1], q[1], u)];

// ---------- His colours ----------
const SF = {
  // the body: a cobalt back fading to a silver-pearl belly (his own colouring, sfBody)
  C: { lt: '#f6f7ff', base: '#a9bcf0', sh: '#8199dd', deep: '#6a82cc' },
  back: { top: '#5f7bd6', mid: '#7d97e4', low: '#b9c9f3', belly: '#f3f2fb', bellySh: '#d9dcf0' },
  bars: '#b9c1f6',
  // the pectorals and the forked tail, and the sail: soft periwinkles
  CF: { lt: '#e9ecff', base: '#b3bdf2', sh: '#939fe0', deep: '#7a86cf' },
  CS: { lt: '#e4e7ff', base: '#a9b3f1', sh: '#8a95de', deep: '#7380cf' },
  inks: { body: ['#4d63b2', '#a2a6cc'], fin: '#6c78c2', sail: '#6672bf' },
  ink: '#4d63b2',
  fxC: { fill: 'rgba(236,240,255,0.62)', edge: '#8e9ad8', glint: '#ffffff', spark: 'rgba(126,138,206,0.85)' },
  // the pearl button on his bill (the bill's own colours: BILL_COL)
  pearl: { lt: '#ffffff', base: '#fbf6ef', sh: '#e6dcef', ink: '#b3a6cd' },
  // the palace livery: a coral-pink sash with a pearl clasp
  coral: { lt: '#ffd9d4', base: '#ff9f9a', sh: '#ea8089', deep: '#cf6b7d', ink: '#c56478' },
  eye: { top: '#26356a', mid: '#4a6bb0', low: '#a3cbf0', pupil: '#1d2752', rim: '#24305e', lash: '#283260' },
  brow: '#33407e',
  blush: '#ff9fbd',
  line: '#4a4f8e',
  mouth: '#b45d84',
  tongue: '#f3a2b8',
  swoosh: { edge: '#8a95e0', core: '#ffffff', tint: '#c9cffb' },
  mark: { fill: 'rgba(246,248,255,0.97)', edge: '#7f8bd6', glyph: '#5664b4' },
};

// ---------- His faces: targets for a mood ----------
// sh: shut (0 open, 1 shut) and which shut shape; bt: brow tilt (+ knit, - worried); by: brows raised;
// bx: the near brow up, the far one down (the duellist's arch); ms: the smile (-1 frown, 1 smile); mw:
// its width; mo: open; te: teeth; sm: the smug corner curling up; bl: blush; gl: an extra twinkle.
const FACES = {
  calm: { sh: 0, kind: 'blink', bt: 0.15, by: 0.1, bx: 0.2, ms: 0.3, mw: 0.9, mo: 0, te: 0, sm: 0.4, bl: 0.45, gl: 0 },
  proud: { sh: 0, kind: 'blink', bt: 0.15, by: 0.55, bx: 0.35, ms: 0.55, mw: 1.0, mo: 0, te: 0, sm: 0.6, bl: 0.55, gl: 0.4 },
  stern: { sh: 0, kind: 'blink', bt: 0.6, by: 0.1, bx: 0, ms: 0.0, mw: 0.75, mo: 0, te: 0, sm: 0, bl: 0.4, gl: 0 },
  engarde: { sh: 0, kind: 'blink', bt: 0.7, by: 0.35, bx: 0.75, ms: 0.25, mw: 1.0, mo: 0.9, te: 0, sm: 0, bl: 0.65, gl: 0.5 },
  duel: { sh: 0, kind: 'blink', bt: 0.55, by: 0.05, bx: 0.5, ms: 0.15, mw: 0.85, mo: 0, te: 0, sm: 0.55, bl: 0.45, gl: 0 },
  fierce: { sh: 0, kind: 'blink', bt: 0.9, by: -0.1, bx: 0.25, ms: -0.1, mw: 0.9, mo: 0.5, te: 1, sm: 0, bl: 0.5, gl: 0 },
  focus: { sh: 0, kind: 'blink', bt: 0.45, by: 0.05, bx: 0.1, ms: 0.05, mw: 0.7, mo: 0, te: 0, sm: 0.1, bl: 0.45, gl: 0 },
  huh: { sh: 0, kind: 'blink', bt: -0.1, by: 0.6, bx: 0.95, ms: -0.15, mw: 0.55, mo: 0.3, te: 0, sm: 0, bl: 0.5, gl: 0 },
  cross: { sh: 0, kind: 'blink', bt: 0.95, by: -0.15, bx: -0.35, ms: -0.5, mw: 0.7, mo: 0, te: 0, sm: 0, bl: 0.75, gl: 0 },
  smug: { sh: 0, kind: 'blink', bt: 0.25, by: 0.35, bx: 0.9, ms: 0.7, mw: 1.05, mo: 0, te: 0, sm: 1, bl: 0.65, gl: 0.3 },
  admire: { sh: 0, kind: 'blink', bt: -0.2, by: 0.55, bx: 0.55, ms: 0.8, mw: 1.0, mo: 0.12, te: 0, sm: 0.8, bl: 0.95, gl: 1 },
  content: { sh: 1, kind: 'happy', bt: -0.15, by: 0.35, bx: 0.2, ms: 0.85, mw: 1.0, mo: 0, te: 0, sm: 0.6, bl: 0.7, gl: 0 },
  triumph: { sh: 1, kind: 'happy', bt: 0, by: 0.6, bx: 0.6, ms: 1, mw: 1.1, mo: 0.65, te: 0, sm: 0.4, bl: 0.85, gl: 0 },
  bow: { sh: 1, kind: 'happy', bt: -0.25, by: 0.2, bx: 0, ms: 0.45, mw: 0.85, mo: 0, te: 0, sm: 0.2, bl: 0.6, gl: 0 },
  hurt: { sh: 1, kind: 'squeeze', bt: -0.6, by: 0, bx: 0, ms: -0.6, mw: 0.8, mo: 0.5, te: 0, sm: 0, bl: 0.6, gl: 0 },
  sleep: { sh: 1, kind: 'sleep', bt: -0.1, by: 0, bx: 0, ms: 0.3, mw: 0.7, mo: 0.15, te: 0, sm: 0, bl: 0.5, gl: 0 },
  dizzy: { sh: 1, kind: 'dizzy', bt: -0.45, by: 0.2, bx: 0, ms: -0.3, mw: 0.8, mo: 0.35, te: 0, sm: 0, bl: 0.4, gl: 0 },
  sad: { sh: 0, kind: 'blink', bt: -0.75, by: 0.2, bx: 0, ms: -0.6, mw: 0.8, mo: 0, te: 0, sm: 0, bl: 0.4, gl: 0 },
  worried: { sh: 0, kind: 'blink', bt: -0.6, by: 0.35, bx: -0.2, ms: -0.25, mw: 0.7, mo: 0.15, te: 0, sm: 0, bl: 0.5, gl: 0 },
  talk: { sh: 0, kind: 'blink', bt: 0.1, by: 0.3, bx: 0.35, ms: 0.4, mw: 0.9, mo: 0.3, te: 0, sm: 0.3, bl: 0.5, gl: 0 },
  happy: { sh: 1, kind: 'happy', bt: -0.15, by: 0.5, bx: 0, ms: 1, mw: 1.1, mo: 0.7, te: 0, sm: 0, bl: 0.85, gl: 0 },
};
const KINDS = ['blink', 'happy', 'sleep', 'squeeze', 'dizzy'];
const FACE_KEYS = ['bt', 'by', 'bx', 'ms', 'mw', 'mo', 'te', 'sm', 'bl', 'gl'];
// vowel mouths for talking (he narrates his own duels): [width, smile, open], each held a beat
const VOWELS = [[0.6, 0.1, 0.8], [1.1, 0.4, 0.55], [1.15, 0.55, 0.25], [0.85, 0.3, 0], [0.7, 0.15, 0.5]];

// ---------- The moves (channels: dorsal the sail, pnA/pnW the near pectoral's own angle and hold,
// pfA/pfW the far one's) ----------
const MOVES = {
  // Lunge: the strongest, the deepest wind-up: drawn right back and coiled, the tail tucked under,
  // the sail flared, the near fin cocked back; then the straight thrust at full reach, held; back.
  lunge: {
    anticT: 0.5,
    keys: [
      [0, { x: -0.3, rise: 0.04, pitch: -9, head: -7, bend: -24, fins: 0.9, dorsal: 1.3, spread: 1, pnA: 75, pnW: 0.6, pfA: 170, pfW: 0.4 }],
      [0.05, { x: 0.78, rise: 0, pitch: 3, head: 3, bend: 16, fins: -0.9, dorsal: 0.55, spread: 0.6, thrash: 0.9, pnW: 0, pfW: 0 }, 'out'],
      [0.32, { x: 0.74, pitch: 2, head: 2, bend: 10, fins: -0.6, dorsal: 0.7, thrash: 0.3 }],
      [0.72, { x: 0.1, pitch: -2, head: -1, bend: -4, fins: 0.3, dorsal: 0.85, thrash: 0 }, 'io'],
      [1.0, { dorsal: 0.9 }, 'io'],
    ],
    swoosh: [0, 0.26],
    touche: 0.04,
  },
  // Flèche: a short crouch, sail streamlined, then a running dash-thrust right through, the sail
  // folded for speed and bubbles streaming off his tail; a glide back round.
  fleche: {
    anticT: 0.32,
    keys: [
      [0, { x: -0.12, rise: -0.04, pitch: 5, head: 3, bend: -12, fins: -0.6, dorsal: 0.15, spread: 0.4 }],
      [0.06, { x: 1.05, rise: 0, pitch: 1, head: 1, bend: 8, fins: -1, dorsal: -0.8, spread: 0.3, thrash: 1.3 }, 'out'],
      [0.22, { x: 1.12, pitch: 0, bend: 4, fins: -0.9, dorsal: -0.6, thrash: 0.9 }],
      [0.62, { x: 0.15, pitch: -3, head: -2, bend: -14, fins: 0.6, dorsal: 0.6, spread: 0.9, thrash: 0.2 }, 'io'],
      [0.95, { dorsal: 0.9 }, 'io'],
    ],
    trail: [0.02, 0.6],
    touche: 0.06,
  },
  // Parry-Riposte: reared back, the bill high and the sail flared wide in a shimmer (the parry); then
  // a quick riposte flick of the bill.
  parry: {
    anticT: 0.42,
    keys: [
      [0, { x: -0.1, rise: 0.06, pitch: -16, head: -10, bend: -8, fins: 0.8, dorsal: 1.35, spread: 1, pnA: 20, pnW: 0.7, pfA: 160, pfW: 0.5 }],
      [0.04, { x: 0.32, rise: 0, pitch: 12, head: 10, bend: 12, fins: -0.4, dorsal: 0.95, spread: 0.8, thrash: 0.6, pnW: 0, pfW: 0 }, 'out'],
      [0.13, { x: 0.28, pitch: 5, head: 4, bend: 6, dorsal: 0.9, thrash: 0.2 }, 'io'],
      [0.5, { x: 0.06, pitch: 0, head: 0, bend: 0, fins: 0.2, dorsal: 0.85 }, 'io'],
      [0.8, { dorsal: 0.9 }, 'io'],
    ],
    flick: [0, 0.2],
    touche: 0.04,
  },
  // Touché! (after landing a hit): the bill swept up and round in a flourish, the sail up proud.
  flourish: {
    anticT: 0.08,
    keys: [
      [0, { rise: 0.02, pitch: -6, dorsal: 1.1, fins: 0.5 }],
      [0.15, { rise: 0.08, pitch: -18, head: -8, dorsal: 1.3, fins: 0.8, spread: 1 }, 'out'],
      [0.32, { rise: 0.1, pitch: 8, head: 6 }, 'io'],
      [0.48, { rise: 0.1, pitch: -10, head: -6 }, 'io'],
      [0.64, { rise: 0.06, pitch: 2, head: 2, dorsal: 1.0 }, 'io'],
      [0.85, { rise: 0.03, pitch: -3, fins: 0.4, dorsal: 0.9 }, 'io'],
      [1.1, { dorsal: 0.9 }, 'io'],
    ],
  },
  // Hit: a flinch back, the sail flinching flat, settling.
  hurt: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.05, { x: -0.08, pitch: -14, head: -10, bend: 26, fins: 0.9, dorsal: -2.3, spread: 1 }, 'out'],
      [0.2, { x: -0.07, pitch: -8, bend: 10, fins: 0.5, dorsal: -1.9 }],
      [0.42, { x: -0.03, pitch: -2, bend: 0, fins: 0.2, dorsal: -0.6 }, 'io'],
      [0.76, {}],
    ],
  },
};
const ATTACKS = ['lunge', 'fleche', 'parry'];
const POOL = ATTACKS;
const pick = (m, a, st, pool) => {
  if (typeof m.move === 'string' && MOVES[m.move]) return m.move;
  const p = pool?.length ? pool : POOL;
  return p[(st.fsN ?? 0) % p.length];
};

// ---------- His bill: his épée, in the head's frame (units: x ahead, y down from the front joint) ----------
const BILL = { root: [3.0, -0.65], len: 17.4, an: -3 * D2R, w0: 2.6, w1: 0.55, pearl: 1.05 };
const BU = [Math.cos(BILL.an), Math.sin(BILL.an)];
const BV = [-BU[1], BU[0]];
// a point along the bill (f 0 its root, 1 its tip) and `off` across it (+ down)
const billAt = (f, off = 0) => add(add(BILL.root, scl(BU, BILL.len * f)), scl(BV, off));
// (a gentle taper: wide where it grows out of his head, flowing out into a slim rounded end)
const billHalf = (f) => BILL.w1 + (BILL.w0 - BILL.w1) * Math.pow(1 - clamp(f, 0, 1), 2.2);
const BILL_TIP = billAt(1);
const PEARL_AT = billAt(1, 0);
// (the bill's outline: along its top edge, round its end, back along its underside)
const BILL_PTS = (() => {
  const top = [];
  const low = [];
  for (const f of [0, 0.08, 0.18, 0.32, 0.5, 0.7, 0.88]) {
    top.push(billAt(f, -billHalf(f)));
    low.unshift(billAt(f, billHalf(f) * 0.92));
  }
  const w = BILL.w1;
  return [...top, billAt(1, -w * 0.9), add(billAt(1, 0), scl(BU, w * 0.95)), billAt(1, w * 0.9), ...low];
})();

// ---------- His act: four pieces, each whole in itself ----------
const PIECES = { salute: 5.6, practice: 8.4, mirror: 7.6, bow: 6.4 };
const ORDER = ['salute', 'practice', 'mirror', 'bow'];
const NONE = { x: 0, lift: 0, pitch: 0, head: 0, bend: 0, fins: 0, spread: 0, thrash: 0, dorsal: 0, pnA: 0, pnW: 0, pfA: 0, pfW: 0, gx: null, gy: null, face: 'calm', back: false };
// A piece's channels at `u` seconds into it.
function actAt(name, u) {
  const A = { ...NONE, piece: name, u };
  if (u > PIECES[name]) return A;
  if (name === 'salute') {
    // to attention; the bill raised up before his brow, the sail snapping up; a crisp flick down;
    // held, formal; at ease
    const att = win(u, 0.2, 0.7, 4.1, 4.9);
    const raise = win(u, 0.7, 1.2, 2.3, 2.42);
    const fl = win(u, 2.3, 2.44, 2.5, 2.85);
    const low = win(u, 2.42, 2.85, 4.0, 4.8);
    A.lift = 1.4 * att + 3.2 * raise;
    A.x = -1.2 * raise;
    A.pitch = -27 * raise + 15 * fl + 9 * low * (1 - fl);
    A.head = -7 * raise + 6 * fl + 3 * low * (1 - fl);
    A.bend = -7 * raise + 4 * fl;
    A.dorsal = 1.1 * att + 0.65 * raise;
    A.fins = 0.25 * att;
    A.pnA = 168;
    A.pnW = 0.7 * att;
    A.pfA = 170;
    A.pfW = 0.5 * att;
    if (u > 0.7 && u < 4.1) [A.gx, A.gy] = [1, -0.25 * raise];
    A.face = u < 0.5 ? 'calm' : u < 2.32 ? 'proud' : u < 4.1 ? 'stern' : u < 5.3 ? 'content' : 'calm';
  } else if (name === 'practice') {
    // a bubble drifts by; a lunge, missed (it bobs up); another, missed (it ducks); a grand wind-up
    // and the pop; a flourish; a smug look round (turning to look behind him, and back)
    const notice = win(u, 0.4, 0.8, 4.9, 5.6);
    const c1 = win(u, 1.12, 1.4, 1.4, 1.5);
    const l1 = win(u, 1.4, 1.53, 1.62, 2.2);
    const c2 = win(u, 2.52, 2.8, 2.8, 2.9);
    const l2 = win(u, 2.8, 2.93, 3.0, 3.6);
    const c3 = win(u, 4.0, 4.7, 4.85, 4.95);
    const l3 = win(u, 4.9, 5.02, 5.3, 6.0);
    const flo = win(u, 5.25, 5.45, 5.55, 5.95);
    const huff = win(u, 3.1, 3.3, 3.6, 3.95);
    const twirl = c3 * Math.sin((u - 4.0) * 11);
    A.x = -2 * c1 + 8 * l1 - 2 * c2 + 7 * l2 - 4.5 * c3 + 9.5 * l3;
    A.pitch = -3 * c1 + 2 * l1 - 8 * c2 - 12 * l2 - 6 * c3 + 1 * l3 - 14 * flo + 2 * Math.sin(u * 15) * huff;
    A.head = -2 * c1 + 2 * l1 - 4 * c2 - 4 * l2 + 2.5 * twirl - 5 * flo;
    A.bend = -10 * c1 + 10 * l1 - 10 * c2 + 10 * l2 - 16 * c3 + 14 * l3 + 8 * huff * Math.sin(u * 12);
    A.thrash = 0.6 * l1 + 0.6 * l2 + 0.8 * l3;
    A.fins = 0.4 * notice - 0.8 * (l1 + l2 + l3) + 0.5 * c3;
    A.spread = 0.5 * notice + 0.5 * flo;
    A.dorsal = 1.0 * notice + 0.85 * c3 - 0.5 * huff + 0.7 * flo + 0.9 * win(u, 5.6, 5.9, 7.0, 7.6);
    A.back = u >= 6.05 && u < 6.95;
    if (u > 0.4 && u < 5.1) {
      const B = practiceBubble(u);
      A.gx = 1;
      A.gy = B ? clamp((B.y + 1) / 9, -1, 1) : 0;
    } else if (u >= 5.6 && u < 6.05) [A.gx, A.gy] = [-1, -0.2];
    else if (u >= 6.05 && u < 6.95) [A.gx, A.gy] = [1, -0.1];
    else if (u >= 6.95 && u < 7.4) [A.gx, A.gy] = [-0.4, 0.2];
    A.face = u < 0.4 ? 'calm' : u < 1.4 ? 'focus' : u < 1.65 ? 'fierce' : u < 2.52 ? 'huh' : u < 2.8 ? 'focus' : u < 3.0 ? 'fierce' : u < 3.95 ? 'cross' : u < 5.05 ? 'fierce' : u < 7.3 ? 'smug' : u < 8.1 ? 'content' : 'calm';
  } else if (name === 'mirror') {
    // the bill raised level before his eyes: a glint slides down it, a twinkle in his eye; then the
    // sail smoothed with a fin, three strokes, the sail dipping under each and rising neat
    const hold = win(u, 0.3, 0.9, 2.8, 3.2);
    const preen = win(u, 3.0, 3.4, 5.4, 5.8);
    const sw = u > 3.4 && u < 5.5 ? 0.5 - 0.5 * Math.cos((TAU * (u - 3.4)) / 0.7) : 0;
    const neat = win(u, 5.5, 5.68, 5.9, 6.5);
    A.pitch = -8 * hold + 3 * preen;
    A.head = -5 * hold + 2 * preen;
    A.x = -1 * hold;
    A.lift = 0.6 * hold + 0.5 * neat;
    A.dorsal = 0.9 * hold + preen * (0.9 - 0.9 * sw) + 0.9 * neat;
    A.pnA = 196 + 40 * sw;
    A.pnW = preen;
    A.fins = 0.2 * hold;
    if (u > 0.5 && u < 3.0) [A.gx, A.gy] = [1, -0.3];
    else if (u > 3.3 && u < 5.5) [A.gx, A.gy] = [-0.8, -0.7];
    A.face = u < 0.4 ? 'calm' : u < 2.85 ? 'admire' : u < 3.35 ? 'smug' : u < 5.5 ? 'content' : u < 6.7 ? 'proud' : 'calm';
    A.glint = u > 1.1 && u < 2.5 ? (u - 1.1) / 1.4 : -1;
    A.eyeTw = win(u, 2.35, 2.5, 2.7, 3.0);
    A.sailTw = win(u, 5.5, 5.7, 6.0, 6.5);
  } else if (name === 'bow') {
    // a deep courtly bow: one pectoral swept across his front, the other out behind; held; up again,
    // proud, the sail up
    const sweep = win(u, 0.4, 1.2, 3.6, 4.2);
    const flour = win(u, 0.3, 0.9, 3.6, 4.3);
    const bow = win(u, 0.9, 1.8, 3.3, 4.2);
    const proud = win(u, 4.1, 4.35, 4.9, 5.6);
    A.pitch = 11 * bow - 7 * proud;
    A.head = 12 * bow - 3 * proud;
    A.lift = 4.2 * bow + 0.8 * proud;
    A.x = -1 * bow;
    A.bend = -6 * bow;
    A.dorsal = -0.25 * bow + 1.4 * proud;
    A.pnA = 52;
    A.pnW = sweep;
    A.pfA = 176;
    A.pfW = flour;
    A.fins = 0.3 * flour;
    if (u > 4.1 && u < 5.6) [A.gx, A.gy] = [1, -0.2];
    A.face = u < 0.5 ? 'calm' : u < 4.1 ? 'bow' : u < 5.6 ? 'proud' : 'calm';
  }
  return A;
}
// The practice bubble: where it is (in units ahead of / below his resting middle) at `u`, or null.
function practiceBubble(u) {
  if (u < 0.1 || u > 5.45) return null;
  const inn = sstep(u / 1.3);
  const d1 = win(u, 1.36, 1.58, 1.9, 2.7);
  const d2 = win(u, 2.78, 2.96, 3.3, 4.3);
  const x = mix(46, 38, inn) + 1.2 * d1 + Math.sin(u * 1.7) * 0.5;
  const y = mix(-12, -1.5, inn) + Math.sin(u * 2.3) * 0.6 - 9 * d1 + 6 * d2;
  const al = sstep((u - 0.1) / 0.4);
  const pop = u >= 5.02 ? (u - 5.02) / 0.4 : -1;
  return { x, y, r: 2.1, al, pop };
}

// ---------- His act, his moods and his face's easing (each frame, before drawing) ----------
function sfPose(m, a, out, K, mv, mt) {
  const st = (a.mo.rig ??= {});
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const k = (rate) => 1 - Math.exp(-dt * rate);
  const now = a.now ?? 0;
  const alive = m.hp > 0;
  const napping = alive && (m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now));
  // (a hit only counts once it has happened: a replay with the last hit still remembered is no hit)
  const ago = a.hurtAgo ?? 9;
  const hurt = alive && ago >= 0 && ago < 0.55;
  const fighting = alive && ((m.aggroUntil ?? 0) > now || Boolean(m.engaged));
  const swimming = (st.fsV ?? 0) > 6;
  const name = mv ? Object.keys(MOVES).find((nm) => MOVES[nm] === mv) ?? 'base' : null;
  const attack = ATTACKS.includes(name) || name === 'flourish';
  // Calm: floating about with nothing else on (the act shows only then, fading in and out).
  const calmGoal = !mv && alive && !napping && !m.pose && !m.cine && !hurt && !fighting && !swimming ? 1 : 0;
  st.sfCalm = mix(st.sfCalm ?? 0, calmGoal, k(calmGoal ? 1.8 : 7));
  const cw = sstep(st.sfCalm);
  // The piece he is playing: started as he settles; the next once one ends (a breath between), the
  // first in turn that fits the time he has (m.restUntil); none when nothing fits. Dropped once he's
  // no longer calm, or the clock went back (a stage's replay).
  let PC = st.sfPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.4) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.sfN ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.sfN + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.25 };
        st.sfN = (st.sfN + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.sfPiece = PC;
  const A = PC && PC.name ? actAt(PC.name, now - PC.t0) : { ...NONE, piece: null, u: 0 };
  // (the act on the channels, as much as he is calm)
  out.x += A.x * cw;
  out.lift += A.lift * cw;
  out.pitch += A.pitch * cw;
  out.head += A.head * cw;
  out.bend += A.bend * cw;
  out.fins += A.fins * cw;
  out.spread += A.spread * cw;
  out.thrash += A.thrash * cw;
  out.dorsal += A.dorsal * cw;
  if (A.pnW > 0.001) {
    out.pnA = mix(out.pnA, A.pnA, clamp(A.pnW * cw * 4, 0, 1));
    out.pnW = Math.max(out.pnW, A.pnW * cw);
  }
  if (A.pfW > 0.001) {
    out.pfA = mix(out.pfA, A.pfA, clamp(A.pfW * cw * 4, 0, 1));
    out.pfW = Math.max(out.pfW, A.pfW * cw);
  }
  if (A.back && cw > 0.5) a.lookBack = true;
  // His sail's stance: folded flat calm, a little up swimming, up and fanned out hunting you (en
  // garde), folded asleep or beaten (the base's own pose does those); eased.
  const stanceGoal = !alive || napping ? 0 : fighting ? 0.95 : swimming ? -0.15 : -0.5;
  st.sfStance = mix(st.sfStance ?? stanceGoal, stanceGoal, k(4));
  if (!mv || !attack) out.dorsal += st.sfStance;
  else if (mt < 0) out.dorsal += st.sfStance * (1 - sstep(1 + mt / Math.max(0.01, mv.anticT)));
  // His own marks: "En garde!" as he starts hunting you, a "?" when he loses you.
  if (fighting && !st.sfHunt) st.sfBangAt = now;
  if (!fighting && st.sfHunt && alive) st.sfLostAt = now;
  st.sfHunt = fighting;
  const bang = now - (st.sfBangAt ?? -9);
  const huh = now - (st.sfLostAt ?? -9);
  const banging = alive && !mv && bang >= 0 && bang < 1.2;
  const huhing = alive && !mv && !fighting && huh >= 0 && huh < 1.4;
  if (banging) {
    // the sail snapping up, a salute flick of the bill
    out.dorsal += 0.45 * win(bang, 0.0, 0.12, 0.6, 1.0);
    out.pitch += -14 * win(bang, 0.05, 0.2, 0.3, 0.42) + 7 * win(bang, 0.38, 0.48, 0.58, 0.95);
    out.head += -5 * win(bang, 0.05, 0.2, 0.3, 0.42) + 3 * win(bang, 0.38, 0.48, 0.58, 0.95);
    out.fins += 0.6 * win(bang, 0.0, 0.15, 0.6, 1.0);
    out.spread += 0.6 * win(bang, 0.0, 0.15, 0.6, 1.0);
  }
  if (huhing) {
    out.dorsal += -0.35 * win(huh, 0, 0.25, 1.0, 1.4);
    out.head += -5 * win(huh, 0, 0.2, 1.0, 1.4);
    out.pitch += -3 * win(huh, 0, 0.2, 1.0, 1.4);
  }
  // Hunting you (not in a move): en garde, the bill's tip circling a little like a fencer's blade.
  if (fighting && !mv && !hurt) {
    const t = a.t ?? 0;
    out.pitch += -2 + 0.9 * Math.cos(t * 2.6);
    out.head += -1 + 1.3 * Math.sin(t * 2.6);
    out.fins += 0.3;
  }
  // His mood: beaten, hurt, asleep, a move, his marks, a scene's mood, the act's, hunting, low, calm.
  const low = alive && m.hp < (m.def.hp ?? 1) * 0.25;
  let mood = 'calm';
  const cine = m.cine?.mood;
  if (!alive) mood = 'dizzy';
  else if (hurt || name === 'hurt' || (name === 'base' && mv === K.moves.knockdown)) mood = 'hurt';
  else if (napping) mood = 'sleep';
  else if (name === 'lunge') mood = mt < -0.25 ? 'focus' : mt < 0.4 ? 'fierce' : 'duel';
  else if (name === 'fleche') mood = mt < 0.3 ? 'fierce' : 'duel';
  else if (name === 'parry') mood = mt < 0 ? 'stern' : mt < 0.25 ? 'fierce' : 'smug';
  else if (name === 'flourish') mood = mt < 0.55 ? 'smug' : 'triumph';
  else if (banging) mood = bang < 0.1 ? 'focus' : bang < 0.85 ? 'engarde' : 'duel';
  else if (huhing) mood = 'huh';
  else if (cine === 'happy') mood = 'happy';
  else if (cine === 'sad') mood = 'sad';
  else if (cine === 'angry') mood = 'cross';
  else if (cine === 'talk' || m.talking) mood = 'talk';
  else if (cw > 0.5 && A.piece) mood = A.face;
  else if (fighting) mood = 'duel';
  else if (low) mood = 'worried';
  // (a dev page may hold a mood to look at it close up: tools/zz-seahorseknightcheck.html)
  if (typeof m.faceTest === 'string' && FACES[m.faceTest]) mood = m.faceTest;
  const F = FACES[mood] ?? FACES.calm;
  const f = (st.sfF ??= { shut: 0, kinds: { blink: 1, happy: 0, sleep: 0, squeeze: 0, dizzy: 0 }, bt: 0.15, by: 0.1, bx: 0.2, ms: 0.3, mw: 0.9, mo: 0, te: 0, sm: 0.4, bl: 0.45, gl: 0, gx: 0, gy: 0, sweat: 0 });
  let tgt = F;
  if (mood === 'talk') {
    const v = VOWELS[Math.floor((a.t ?? 0) * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const fast = k(14);
  for (const key of FACE_KEYS) f[key] = mix(f[key], tgt[key], fast);
  // (a blink every few seconds while his eyes are open: a quick close, never a lid sliding down)
  const t = (a.t ?? 0) + ((m.uid ?? 0) % 5) * 0.9;
  const blink = F.sh < 0.5 ? win(t % 4.6, 4.2, 4.26, 4.32, 4.42) : 0;
  f.shut = mix(f.shut, Math.max(F.sh, blink), k(F.sh > 0.5 || blink > 0 ? 26 : 18));
  const kind = F.sh > 0.5 ? F.kind : 'blink';
  for (const kd of KINDS) f.kinds[kd] = mix(f.kinds[kd], kd === kind ? 1 : 0, k(16));
  // where he looks: turning round, his eyes first; the act's; ahead (hunting, moves); his marks
  let gx = 0;
  let gy = 0;
  const turnT = st.fsTt;
  if (turnT != null && turnT < (K.P.turn?.[0] ?? 0.14)) [gx, gy] = [-1, 0];
  else if (cw > 0.5 && A.gx !== null) [gx, gy] = [A.gx, A.gy];
  else if (huhing) [gx, gy] = [Math.sin(huh * 6) > 0 ? 1 : -0.8, -0.2];
  else if (fighting || mv) [gx, gy] = [1, 0];
  else if (mood === 'worried' || mood === 'sad') [gx, gy] = [-0.3, 0.6];
  f.gx = mix(f.gx, gx, k(18));
  f.gy = mix(f.gy, gy, k(18));
  f.sweat = mix(f.sweat, low && !napping ? 1 : 0, k(5));
  a.sfF = f;
  a.sfMood = mood;
  a.sfAct = { ...A, cw };
  a.sfBang = banging ? bang : -1;
  a.sfHuh = huhing ? huh : -1;
  a.sfGloat = name === 'flourish' ? mt : -1;
  a.sfHurt = hurt ? ago : -1;
  a.sfNap = napping;
  a.sfMove = mv && name !== 'base' && name !== 'hurt' ? { name, t: mt, w: mt < 0 ? clamp(1 + mt / Math.max(0.01, mv.anticT), 0, 1) : 1 } : null;
}

// ---------- Drawing him ----------
// His colouring on the body (clipped to it): the cobalt back fading to the silver-pearl belly, lit
// along the back, a pearly sheen low down.
function sfBody(ctx, a, sk, K) {
  const s = K.s;
  const pv = K.P.pivot;
  const top = add(sk.pivot, scl(sk.nrm[pv], sk.back[pv]));
  const low = add(sk.pivot, scl(sk.nrm[pv], -sk.belly[pv]));
  const g = ctx.createLinearGradient(top[0], top[1], low[0], low[1]);
  g.addColorStop(0, lit(a, SF.back.top));
  g.addColorStop(0.3, lit(a, SF.back.mid));
  g.addColorStop(0.47, lit(a, SF.back.low));
  g.addColorStop(0.62, lit(a, SF.back.belly));
  g.addColorStop(1, lit(a, SF.back.bellySh));
  ctx.fillStyle = g;
  ctx.fillRect(Math.min(top[0], low[0]) - 60 * s, Math.min(top[1], low[1]) - 60 * s, 120 * s + Math.abs(top[0] - low[0]), 120 * s + Math.abs(top[1] - low[1]));
  // one light from up front: a sheen along the back and over the brow; the belly pearly
  K.soft(ctx, sk.along(6 * s, sk.back[1] * 0.55), sk.back[1] * 0.9, '#c9d6ff', 0.55);
  K.soft(ctx, sk.along(14 * s, sk.back[2] * 0.6), sk.back[2] * 1.0, '#a6bbf3', 0.35);
  K.soft(ctx, sk.along(12 * s, -sk.belly[2] * 0.55), sk.belly[2] * 0.75, '#ffffff', 0.7);
  K.soft(ctx, sk.along(16 * s, -sk.belly[2] * 1.0), sk.belly[2] * 0.9, SF.back.bellySh, 0.55);
  K.soft(ctx, sk.pos[sk.pos.length - 1], 4.5 * s, '#7f93d8', 0.35);
}
// His markings and livery on the body: soft periwinkle bars down his flank, the coral sash across him
// with its pearl clasp and two short tails.
function sfPaint(ctx, a, sk, K) {
  const s = K.s;
  const at = (along, off) => sk.along(along * s, off * s);
  // the bars: soft, fading out toward the belly
  ctx.save();
  ctx.lineCap = 'round';
  for (const [al, len] of [[15.6, 1], [18.6, 0.92], [21.4, 0.8], [24, 0.62]]) {
    const gt = sk.girth(al * s, 1) / s;
    const p0 = at(al - 0.4, gt * 0.78);
    const p1 = at(al + 0.3, gt * mix(0.78, -0.15, len));
    const gr = ctx.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
    gr.addColorStop(0, lit(a, SF.bars, 0.0));
    gr.addColorStop(0.25, lit(a, SF.bars, 0.75));
    gr.addColorStop(1, lit(a, SF.bars, 0));
    ctx.strokeStyle = gr;
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.moveTo(...p0);
    ctx.quadraticCurveTo(...at(al + 0.4, gt * 0.35), ...p1);
    ctx.stroke();
  }
  ctx.restore();
  // the sash: over his back behind the head, down across him to his belly
  const w = 1.35;
  const a0 = [6.4, 11];
  const am = [9.3, 1.5];
  const a1 = [13.4, -10];
  const band = [at(a0[0] - w, a0[1]), at(am[0] - w, am[1]), at(a1[0] - w, a1[1]), at(a1[0] + w, a1[1]), at(am[0] + w, am[1]), at(a0[0] + w, a0[1])];
  ctx.beginPath();
  ctx.moveTo(...band[0]);
  ctx.quadraticCurveTo(...band[1], ...band[2]);
  ctx.lineTo(...band[3]);
  ctx.quadraticCurveTo(...band[4], ...band[5]);
  ctx.closePath();
  ctx.fillStyle = lit(a, SF.coral.base);
  ctx.fill();
  ctx.save();
  ctx.clip();
  stroke(ctx, [at(a0[0] - 0.35, a0[1]), at(am[0] - 0.35, am[1]), at(a1[0] - 0.35, a1[1])], 0.9 * s, lit(a, SF.coral.lt, 0.85));
  stroke(ctx, [at(a0[0] + w, a0[1]), at(am[0] + w, am[1]), at(a1[0] + w, a1[1])], 0.7 * s, lit(a, SF.coral.sh));
  ctx.restore();
  // (the sash's soft shadow on him, just behind it)
  ctx.save();
  ctx.globalAlpha *= 0.35;
  stroke(ctx, [at(a0[0] + w + 0.5, a0[1]), at(am[0] + w + 0.5, am[1]), at(a1[0] + w + 0.5, a1[1])], 0.6 * s, lit(a, '#5a6ab6'));
  ctx.restore();
  // the clasp: a little coral knot, two short tails, the pearl in it
  const pc = at(9.0, 1.6);
  const tl = (dx, dy, r) => {
    const sway = Math.sin((a.t ?? 0) * 1.6 + dx) * 0.25;
    ctx.beginPath();
    ctx.moveTo(pc[0] - 0.5 * s, pc[1] + 0.2 * s);
    ctx.quadraticCurveTo(pc[0] + (dx * 0.6 + sway) * s, pc[1] + dy * 0.6 * s, pc[0] + (dx + sway) * s, pc[1] + dy * s);
    ctx.quadraticCurveTo(pc[0] + (dx + r + sway) * s, pc[1] + (dy - 0.2) * s, pc[0] + 0.6 * s, pc[1] + 0.3 * s);
    ctx.closePath();
    ctx.fillStyle = lit(a, SF.coral.sh);
    ctx.fill();
  };
  tl(1.6, 3.4, 1.0);
  tl(2.9, 2.2, 0.9);
  ell(ctx, pc[0], pc[1], 1.55 * s, 1.35 * s, 0.3);
  ctx.fillStyle = lit(a, SF.coral.deep);
  ctx.fill();
  ell(ctx, pc[0], pc[1], 1.1 * s, 1.1 * s);
  ctx.fillStyle = lit(a, SF.pearl.ink);
  ctx.fill();
  ell(ctx, pc[0], pc[1], 0.92 * s, 0.92 * s);
  const g = ctx.createRadialGradient(pc[0] - 0.35 * s, pc[1] - 0.4 * s, 0, pc[0], pc[1], 1.0 * s);
  g.addColorStop(0, lit(a, '#ffffff'));
  g.addColorStop(0.6, lit(a, SF.pearl.base));
  g.addColorStop(1, lit(a, SF.pearl.sh));
  ctx.fillStyle = g;
  ctx.fill();
  ell(ctx, pc[0] - 0.32 * s, pc[1] - 0.36 * s, 0.26 * s, 0.19 * s, -0.5);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

// His bill: part of him, grown out of his head (drawn under the body, so the head covers its root and
// no join shows): wide at the root, tapering gently to a slim rounded end with the pearl button on it;
// coloured like his head where it leaves it (cobalt over pale) and fading to silver-pearl toward the
// tip; its outline his own, the head's shade at the root softening toward the tip; a soft light line
// along its top.
const BILL_COL = { top: '#8fa6ea', mid: '#b6c5f2', low: '#e1e6f8', tip: '#f2f3fb', shade: '#9aa5d8', inkRoot: '#7280c0', inkTip: '#a0a5d0' };
function sfBill(ctx, a, mode, K) {
  K.headFrame(ctx, a);
  const s = K.s;
  ctx.beginPath();
  K.loopPath(ctx, BILL_PTS);
  ctx.moveTo(PEARL_AT[0] + BILL.pearl, PEARL_AT[1]);
  ctx.arc(PEARL_AT[0], PEARL_AT[1], BILL.pearl, 0, TAU);
  if (mode === 'line') {
    const gi = ctx.createLinearGradient(...billAt(0.15), ...billAt(1));
    gi.addColorStop(0, BILL_COL.inkRoot);
    gi.addColorStop(1, BILL_COL.inkTip);
    ctx.strokeStyle = gi;
    ctx.lineWidth = 2 / s;
    ctx.lineJoin = 'round';
    ctx.stroke();
    return;
  }
  ctx.beginPath();
  K.loopPath(ctx, BILL_PTS);
  // (across it, the head's own colours where it leaves the head: cobalt over pale)
  const g = ctx.createLinearGradient(...billAt(0.12, -billHalf(0.12)), ...billAt(0.12, billHalf(0.12)));
  g.addColorStop(0, lit(a, BILL_COL.top));
  g.addColorStop(0.5, lit(a, BILL_COL.mid));
  g.addColorStop(1, lit(a, BILL_COL.low));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // (along it, fading to silver-pearl toward the tip)
  const gl2 = ctx.createLinearGradient(...billAt(0.12), ...billAt(1));
  gl2.addColorStop(0, lit(a, BILL_COL.tip, 0));
  gl2.addColorStop(0.45, lit(a, BILL_COL.tip, 0.65));
  gl2.addColorStop(0.8, lit(a, BILL_COL.tip, 0.95));
  ctx.fillStyle = gl2;
  ctx.fillRect(Math.min(BILL.root[0], BILL_TIP[0]) - 4, BILL.root[1] - 8, BILL.len + 8, 16);
  // a soft shade along its underside, a soft light line along its top
  stroke(ctx, [billAt(0.1, billHalf(0.1) * 0.95), billAt(0.5, billHalf(0.5) * 0.95), billAt(0.95, billHalf(0.95) * 0.85)], 0.6, lit(a, BILL_COL.shade, 0.45));
  stroke(ctx, [billAt(0.16, -billHalf(0.16) * 0.5), billAt(0.55, -billHalf(0.55) * 0.5), billAt(0.9, -billHalf(0.9) * 0.4)], 0.42, lit(a, '#ffffff', 0.7));
  // (a moving glint: the mirror piece's slides down it; the lunge's wind-up runs one up it)
  const gl = a.sfGlint ?? -1;
  if (gl >= 0) {
    const c = billAt(gl, -0.15);
    glow(ctx, c[0], c[1], 1.9, '#ffffff', 0.9);
  }
  ctx.restore();
  // the pearl button
  ell(ctx, PEARL_AT[0], PEARL_AT[1], BILL.pearl, BILL.pearl);
  const pg = ctx.createRadialGradient(PEARL_AT[0] - 0.35, PEARL_AT[1] - 0.4, 0, PEARL_AT[0], PEARL_AT[1], BILL.pearl * 1.05);
  pg.addColorStop(0, lit(a, '#ffffff'));
  pg.addColorStop(0.55, lit(a, SF.pearl.base));
  pg.addColorStop(1, lit(a, SF.pearl.sh));
  ctx.fillStyle = pg;
  ctx.fill();
  ell(ctx, PEARL_AT[0] - 0.33, PEARL_AT[1] - 0.36, 0.3, 0.22, -0.5);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  // a soft pink blush of reflected coral low on the pearl
  ell(ctx, PEARL_AT[0] + 0.2, PEARL_AT[1] + 0.5, 0.45, 0.22, 0.2);
  ctx.fillStyle = lit(a, '#ffd9e2', 0.6);
  ctx.fill();
}

// The sail's shimmer (the parry): a bright band sweeping across it, sparkles along its edge.
function sfSailShimmer(ctx, a, mode, K) {
  if (mode !== 'fill') return;
  const sk = a.fk;
  const Sl = sk.sail;
  if (!Sl) return;
  const sh = a.sfShimmer ?? -1;
  const tw = a.sfSailTw ?? 0;
  if (sh < 0 && tw <= 0.01) return;
  ctx.save();
  K.sailPath(ctx, sk);
  ctx.clip();
  const N = Sl.tips.length;
  if (sh >= 0) {
    // the band: across the rays from front to back
    const fi = sh * (N - 1);
    for (let i = 0; i < N; i++) {
      const w = Math.max(0, 1 - Math.abs(i - fi) / 1.4);
      if (w <= 0) continue;
      const c = lerp2(Sl.bases[i], Sl.tips[i], 0.6);
      glow(ctx, c[0], c[1], 5.5 * K.s, '#ffffff', 0.75 * w);
    }
    glow(ctx, ...lerp2(Sl.bases[0], Sl.tips[0], 0.5), 6 * K.s, SF.CS.lt, 0.5);
  }
  ctx.restore();
  // sparkles along the edge as the band passes (or as it settles neat after preening)
  for (let i = 0; i < N; i += 2) {
    const w = sh >= 0 ? Math.max(0, 1 - Math.abs(i - sh * (N - 1)) / 1.2) : tw * (i % 4 === 0 ? 1 : 0.6);
    if (w > 0.05) sparkle(ctx, Sl.tips[i][0], Sl.tips[i][1] - 0.6 * K.s, 1.5 * K.s * w, rgba('#ffffff', w));
  }
}

// His face (in the head's frame: x ahead, y down, units).
const EYE_N = { x: -0.75, y: -2.25, rx: 1.95, ry: 1.5, o: -1 };
const EYE_F = { x: 3.3, y: -2.6, rx: 1.22, ry: 1.38, o: 1 };
// the almond: [inner corner, along the top, the upturned outer corner, along the bottom]
const almond = (E, gx = 0) => {
  const { x, y, rx, ry, o } = E;
  return [[x - o * rx, y + 0.12 * ry], [x - o * rx * 0.55, y - ry * 0.78], [x + o * rx * 0.05, y - ry * 1.0], [x + o * rx * 0.6, y - ry * 0.84], [x + o * rx, y - ry * 0.3], [x + o * rx * 0.6, y + ry * 0.55], [x, y + ry * 0.92], [x - o * rx * 0.6, y + ry * 0.7]];
};
function sfFace(ctx, a, sk, K) {
  const f = a.sfF;
  if (!f) return;
  K.headFrame(ctx, a);
  const t = a.t ?? 0;
  // a soft silvery cheek round his eyes (the face reads clearly on the cobalt)
  glow(ctx, 0.3, -1.6, 4.6, '#eef2ff', 0.55);
  glow(ctx, 3.4, -2.2, 2.6, '#eef2ff', 0.35);
  // rosy cheeks
  glow(ctx, -0.6, 0.6, 2.0, SF.blush, 0.45 * f.bl);
  glow(ctx, 3.9, 0.3, 1.2, SF.blush, 0.35 * f.bl);
  const closedW = sstep((f.shut - 0.25) / 0.5);
  const gx = clamp(f.gx, -1, 1);
  const gy = clamp(f.gy, -1, 1);
  const eye = (E) => {
    const { x, y, rx, ry, o } = E;
    const ink = lit(a, SF.eye.lash);
    if (closedW > 0.01) {
      ctx.save();
      ctx.globalAlpha *= closedW;
      const K2 = f.kinds;
      const inner = [x - o * rx, y + 0.1];
      const outer = [x + o * rx, y - ry * 0.25];
      if (K2.happy > 0.01) {
        ctx.globalAlpha *= K2.happy;
        stroke(ctx, [inner, [x, y - ry * 1.25], outer], 0.5, ink);
        stroke(ctx, [outer, add(outer, [o * 0.4, -0.1]), add(outer, [o * 0.6, -0.55])], 0.4, ink);
        ctx.globalAlpha /= K2.happy;
      }
      const lineW = K2.sleep + K2.blink;
      if (lineW > 0.01) {
        ctx.globalAlpha *= Math.min(1, lineW);
        stroke(ctx, [inner, [x, y + ry * 0.75], outer], 0.5, ink);
        stroke(ctx, [outer, add(outer, [o * 0.4, -0.05]), add(outer, [o * 0.62, -0.5])], 0.38, ink);
        ctx.globalAlpha /= Math.min(1, lineW);
      }
      if (K2.squeeze > 0.01) {
        ctx.globalAlpha *= K2.squeeze;
        stroke(ctx, [[x + o * rx, y - ry * 0.7], [x - o * rx * 0.05, y - ry * 0.15], [x - o * rx * 0.8, y + 0.05]], 0.5, ink);
        stroke(ctx, [[x - o * rx * 0.8, y + 0.05], [x - o * rx * 0.05, y + ry * 0.25], [x + o * rx, y + ry * 0.65]], 0.5, ink);
        ctx.globalAlpha /= K2.squeeze;
      }
      if (K2.dizzy > 0.01) {
        ctx.globalAlpha *= K2.dizzy;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 0.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i <= 26; i++) {
          const an = (i / 26) * TAU * 2 + t * 4 * o;
          const r = (i / 26) * rx * 0.9;
          const p = [x + Math.cos(an) * r, y + Math.sin(an) * r * (ry / rx)];
          i ? ctx.lineTo(...p) : ctx.moveTo(...p);
        }
        ctx.stroke();
        ctx.globalAlpha /= K2.dizzy;
      }
      ctx.restore();
    }
    const openW = 1 - closedW;
    if (openW <= 0.01) return;
    ctx.save();
    ctx.globalAlpha *= openW;
    const pts = almond(E);
    // the white
    ctx.beginPath();
    K.loopPath(ctx, pts);
    ctx.fillStyle = lit(a, '#fbfcff');
    ctx.fill();
    ctx.save();
    ctx.clip();
    // a soft shade under the lash line
    ctx.fillStyle = 'rgba(150,165,215,0.35)';
    ctx.fillRect(x - rx * 1.2, y - ry * 1.2, rx * 2.4, ry * 0.45);
    // the steel-blue iris (dark at the top, light low down), a dark pupil
    const ix = x + gx * rx * 0.16 + o * rx * 0.02;
    const iy = y + 0.12 * ry + gy * ry * 0.16;
    const irx = rx * 0.56;
    const iry = ry * 0.8;
    const g = ctx.createLinearGradient(ix, iy - iry, ix, iy + iry);
    g.addColorStop(0, lit(a, SF.eye.top));
    g.addColorStop(0.5, lit(a, SF.eye.mid));
    g.addColorStop(1, lit(a, SF.eye.low));
    ell(ctx, ix, iy, irx, iry);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = lit(a, SF.eye.rim, 0.8);
    ctx.lineWidth = 0.22;
    ctx.stroke();
    ell(ctx, ix, iy - iry * 0.08, irx * 0.42, iry * 0.52);
    ctx.fillStyle = lit(a, SF.eye.pupil);
    ctx.fill();
    // a soft light ring low in it
    ell(ctx, ix, iy + iry * 0.5, irx * 0.6, iry * 0.25);
    ctx.fillStyle = 'rgba(200,226,255,0.4)';
    ctx.fill();
    ctx.restore();
    // the glints: a crisp blade-gleam (a curvy four-point star) up front, a round dot low behind
    sparkle(ctx, ix + irx * 0.32, iy - iry * 0.38, irx * (0.72 + 0.35 * f.gl), '#ffffff');
    ell(ctx, ix - irx * 0.4, iy + iry * 0.42, irx * 0.17, irx * 0.17);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
    // the lash line: neat along the top, thicker toward the outer corner, a short round wing
    const ink2 = lit(a, SF.eye.lash);
    stroke(ctx, [pts[0], pts[1], lerp2(pts[1], pts[2], 0.5), pts[2], lerp2(pts[2], pts[3], 0.5), pts[3], pts[4]], 0.4, ink2);
    stroke(ctx, [lerp2(pts[2], pts[3], 0.3), pts[3], pts[4]], 0.62, ink2);
    const oc = pts[4];
    stroke(ctx, [oc, add(oc, [o * 0.45, -0.18]), add(oc, [o * 0.72, -0.62])], 0.42, ink2);
    ctx.restore();
  };
  eye(EYE_N);
  eye(EYE_F);
  // the admiring twinkle (the mirror: he sees himself in his bill)
  const tw = Math.max(a.sfEyeTw ?? 0, f.gl * 0.5 * (1 - closedW));
  if (tw > 0.02) sparkle(ctx, EYE_N.x + 1.6, EYE_N.y - 1.9, 1.3 * tw, rgba('#ffffff', tw));
  // the brows: one swoopy round-ended brow over each eye: raised, knit, or one up for the drama
  const brow = (E, side, w) => {
    const { x, y, rx, ry, o } = E;
    const lift = f.by * 0.85 + side * f.bx * 0.6;
    const yb = y - ry - 1.25 - lift;
    const yi = yb + f.bt * 0.75;
    const yo = yb - f.bt * 0.25 - 0.25;
    const xi = x - o * rx * 0.8;
    const xo = x + o * rx * 1.05;
    const mid = [x + o * rx * 0.15, Math.min(yi, yo) - 0.5];
    stroke(ctx, [[xi, yi], [mix(xi, mid[0], 0.6), mix(yi, mid[1], 0.9)], mid, [mix(mid[0], xo, 0.55), mid[1] - 0.05], [xo, yo]], w, lit(a, SF.brow));
  };
  brow(EYE_N, 1, 0.62);
  brow(EYE_F, -1, 0.5);
  // the mouth: under the bill's root, from its width, smile and openness (so every change eases),
  // its back corner curling up when he's smug
  const M0 = [5.25, 2.5];
  const Kc = [M0[0] - 2.5 * f.mw, 2.8 - 0.6 * f.ms - 0.35 * f.sm];
  const Mm = [(M0[0] + Kc[0]) / 2, 2.8 + 0.45 * f.ms];
  if (f.mo > 0.06) {
    const o = f.mo;
    ctx.beginPath();
    ctx.moveTo(...M0);
    ctx.quadraticCurveTo(Mm[0], Mm[1] - 0.15, ...Kc);
    ctx.quadraticCurveTo(Mm[0] - 0.2, Mm[1] + 0.4 + o * 2.5, ...M0);
    ctx.fillStyle = lit(a, SF.mouth);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, Mm[0] - 0.1, Mm[1] + 0.45 + o * 2.0, 1.1, o * 0.9);
    ctx.fillStyle = lit(a, SF.tongue);
    ctx.fill();
    if (f.te > 0.05) {
      ctx.fillStyle = lit(a, '#ffffff', f.te);
      ctx.fillRect(Kc[0], Mm[1] - 0.55, M0[0] - Kc[0], 0.55);
    }
    ctx.restore();
  }
  stroke(ctx, [M0, Mm, Kc], 0.48, lit(a, SF.line));
  // the smug corner: a little curl up at the back end
  if (f.sm > 0.08) {
    ctx.save();
    ctx.globalAlpha *= clamp(f.sm, 0, 1);
    stroke(ctx, [Kc, [Kc[0] - 0.35, Kc[1] - 0.1], [Kc[0] - 0.4, Kc[1] - 0.55]], 0.42, lit(a, SF.line));
    ctx.restore();
  }
  // a bead of sweat by his head (low on health)
  if (f.sweat > 0.05) {
    const u = (t * 0.6) % 1;
    const x = -4.6;
    const y = -4.6 + sstep(u) * 1.8;
    ctx.save();
    ctx.globalAlpha *= f.sweat * Math.sin(Math.PI * u);
    ctx.beginPath();
    ctx.moveTo(x, y - 1.2);
    ctx.quadraticCurveTo(x + 0.95, y + 0.3, x, y + 0.9);
    ctx.quadraticCurveTo(x - 0.95, y + 0.3, x, y - 1.2);
    ctx.fillStyle = 'rgba(214,236,255,0.95)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(118,150,214,0.85)';
    ctx.lineWidth = 0.28;
    ctx.stroke();
    ell(ctx, x - 0.25, y + 0.15, 0.2, 0.3);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
}

// ---------- His effects ----------
// a bubble: see-through, a periwinkle rim, a glint
function bubble(ctx, x, y, r, al) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.fillStyle = 'rgba(236,240,255,0.6)';
  ctx.fill();
  ctx.strokeStyle = SF.swoosh.edge;
  ctx.lineWidth = Math.max(0.3, r * 0.2);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(0.3, r * 0.24);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.6, -2.5, -1.6);
  ctx.stroke();
  ctx.restore();
}
// a soft pop: a ring of little round beads and a sparkle
function pop(ctx, x, y, r, u) {
  if (u <= 0 || u >= 1) return;
  const e = easeOut(u);
  for (let i = 0; i < 6; i++) {
    const q = (i / 6) * TAU + 0.3;
    bubble(ctx, x + Math.cos(q) * r * (0.6 + 1.6 * e), y + Math.sin(q) * r * (0.6 + 1.6 * e), r * 0.22 * (1 - u * 0.6), 1 - u);
  }
  sparkle(ctx, x, y, r * 1.1 * (1 - u), rgba('#ffffff', 1 - u));
  sparkle(ctx, x, y, r * 0.55 * (1 - u), rgba('#fff3c4', 1 - u));
}
// a soft periwinkle swoosh: a curve through pts, thick to thin, a white core
function swoosh(ctx, pts, w, al) {
  if (al <= 0.01 || pts.length < 2) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [k, col] of [[1, SF.swoosh.edge], [0.62, SF.swoosh.tint], [0.28, SF.swoosh.core]]) {
    for (let i = 0; i < pts.length - 1; i++) {
      const f = 1 - i / (pts.length - 1);
      ctx.strokeStyle = col;
      ctx.lineWidth = Math.max(0.2, w * k * (0.25 + 0.75 * f));
      ctx.beginPath();
      ctx.moveTo(...pts[i]);
      ctx.lineTo(...pts[i + 1]);
      ctx.stroke();
    }
  }
  ctx.restore();
}
// the "touché" sparkle: a big round curvy star with a soft halo and four little ones spinning off
function touche(ctx, c, u, k) {
  if (u <= 0 || u >= 1) return;
  const e = easeOut(u);
  const fade = 1 - sstep((u - 0.45) / 0.55);
  glow(ctx, c[0], c[1], 6 * k * (0.6 + 0.6 * e), '#e6e9ff', 0.7 * fade);
  ctx.save();
  ctx.globalAlpha *= fade;
  ell(ctx, c[0], c[1], (2.2 + 4 * e) * k, (2.2 + 4 * e) * k);
  ctx.strokeStyle = rgba(SF.swoosh.edge, 0.8 * (1 - e));
  ctx.lineWidth = 0.9 * k * (1 - e * 0.6);
  ctx.stroke();
  ctx.restore();
  sparkle(ctx, c[0], c[1], 4.2 * k * (0.5 + 0.5 * e) * fade, rgba('#ffffff', fade));
  sparkle(ctx, c[0], c[1], 2.0 * k * fade, rgba('#fff3c4', fade));
  for (let i = 0; i < 4; i++) {
    const q = (i / 4) * TAU + 0.6 + u * 1.2;
    sparkle(ctx, c[0] + Math.cos(q) * 5.5 * k * e, c[1] + Math.sin(q) * 5.5 * k * e, 1.1 * k * fade, i % 2 ? rgba('#ffd9e2', fade) : rgba('#ffffff', fade));
  }
}
// (draws `fn` at (x, y) read the right way round, however he faces)
function upright(ctx, x, y, unflip, fn) {
  ctx.save();
  ctx.translate(x, y);
  if (unflip) ctx.scale(-1, 1);
  fn();
  ctx.restore();
}
// A mark over his head in his own bubble, scalloped like his sail's edge: "!" (a little épée with a
// pearl for its dot), "?" (a hooked stroke and a pearl), or "*" (the touché sparkle note); popping in
// with a little overshoot and settling.
function mark(ctx, x, y, kind, e, len, s, unflip) {
  const inn = e < 0.25 ? easeOut(e / 0.25) * (1 + 0.18 * Math.sin(Math.PI * clamp(e / 0.25, 0, 1))) : 1;
  const k = inn * (1 - sstep((e - (len - 0.25)) / 0.25));
  if (k <= 0.01) return;
  ctx.save();
  ctx.translate(x, y - (1 - inn) * 2 * s);
  if (unflip) ctx.scale(-1, 1);
  ctx.globalAlpha *= Math.min(1, k * 1.4);
  const R = 4.2 * s * Math.min(1, 0.6 + 0.4 * k);
  // the scalloped bubble: eight round bumps round a disc
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const q = (i / 8) * TAU + 0.2;
    ctx.moveTo(Math.cos(q) * R * 0.82 + R * 0.34, Math.sin(q) * R * 0.82);
    ctx.arc(Math.cos(q) * R * 0.82, Math.sin(q) * R * 0.82, R * 0.34, 0, TAU);
  }
  ctx.moveTo(R * 0.9, 0);
  ctx.arc(0, 0, R * 0.9, 0, TAU);
  ctx.strokeStyle = SF.mark.edge;
  ctx.lineWidth = 1.5 * s;
  ctx.stroke();
  ctx.fillStyle = SF.mark.fill;
  ctx.fill('nonzero');
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.7 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.82, -2.6, -1.9);
  ctx.stroke();
  const col = SF.mark.glyph;
  const pearl = (px, py, r) => {
    ell(ctx, px, py, r, r);
    ctx.fillStyle = SF.pearl.base;
    ctx.fill();
    ctx.strokeStyle = SF.pearl.ink;
    ctx.lineWidth = 0.35 * s;
    ctx.stroke();
    ell(ctx, px - r * 0.3, py - r * 0.35, r * 0.3, r * 0.22);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  };
  if (kind === '!') {
    // a little épée: a soft taper, its hilt a coral bar, a pearl button below for the dot
    ctx.beginPath();
    ctx.moveTo(-0.85 * s, -R * 0.62);
    ctx.quadraticCurveTo(0, -R * 0.78, 0.85 * s, -R * 0.62);
    ctx.lineTo(0.4 * s, R * 0.2);
    ctx.quadraticCurveTo(0, R * 0.3, -0.4 * s, R * 0.2);
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
    stroke(ctx, [[-1.2 * s, -R * 0.52], [0, -R * 0.56], [1.2 * s, -R * 0.52]], 0.75 * s, SF.coral.base);
    pearl(0, R * 0.5, 0.72 * s);
  } else if (kind === '?') {
    stroke(ctx, [[-R * 0.36, -R * 0.22], [-R * 0.32, -R * 0.64], [0, -R * 0.64], [R * 0.42, -R * 0.62], [R * 0.34, -R * 0.24], [R * 0.24, -R * 0.03], [0, R * 0.04], [-0.05 * s, R * 0.1], [0, R * 0.2]], 1.15 * s, col);
    pearl(0, R * 0.52, 0.66 * s);
  } else {
    sparkle(ctx, 0, 0, R * 0.7, col);
    sparkle(ctx, 0, 0, R * 0.36, '#ffffff');
    sparkle(ctx, R * 0.5, -R * 0.45, R * 0.22, SF.coral.base);
  }
  ctx.restore();
}
// a soft rounded z
function zee(ctx, x, y, k, al, s) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  const w = 1.2 * k * s;
  stroke(ctx, [[x - w, y - w], [x, y - w * 1.08], [x + w, y - w], [x + w * 0.1, y - w * 0.1], [x - w, y + w], [x, y + w * 1.08], [x + w, y + w]], 0.95 * k * s, SF.swoosh.edge);
  stroke(ctx, [[x - w, y - w], [x, y - w * 1.08], [x + w, y - w], [x + w * 0.1, y - w * 0.1], [x - w, y + w], [x, y + w * 1.08], [x + w, y + w]], 0.42 * k * s, '#f2f4ff');
  ctx.restore();
}

function sfFx(ctx, m, a, K) {
  const sk = a.fk;
  if (!sk) return;
  const s = K.s;
  const t = a.t ?? 0;
  const A = a.sfAct;
  const alive = m.hp > 0;
  const tipW = () => sk.inHead(...BILL_TIP);
  const billW = (f, off = 0) => sk.inHead(...billAt(f, off));
  // (the marks keep upright and read the right way round, however he faces)
  const unflip = Boolean(a.flip) !== Boolean(K.mirrored(a));
  ctx.save();
  // ----- his act's own touches -----
  if (A && A.piece && A.cw > 0.01 && alive) {
    const u = A.u;
    const cw = A.cw;
    if (A.piece === 'salute') {
      // the crisp flick: a short swoosh at the tip and a gleam on the pearl
      if (u > 2.3 && u < 2.62) {
        const w = (u - 2.3) / 0.32;
        const c = tipW();
        swoosh(ctx, [c, add(c, [-1.5 * s, -4 * s]), add(c, [-2.2 * s, -8 * s])], 1.6 * s, (1 - w) * 0.8 * cw);
      }
      if (u > 2.42 && u < 2.95) {
        const w = (u - 2.42) / 0.53;
        const c = tipW();
        sparkle(ctx, c[0] + 1 * s, c[1] - 1.2 * s, 2.4 * s * Math.sin(Math.PI * w) * cw, '#ffffff');
      }
    } else if (A.piece === 'practice') {
      // the bubble, dodging his first two lunges, popped by the third
      const B = practiceBubble(u);
      if (B) {
        const o = [K.P.spine[K.P.pivot][0] * s, K.P.spine[K.P.pivot][1] * s - K.FLOAT];
        const x = o[0] + B.x * s;
        const y = o[1] + B.y * s;
        if (B.pop < 0) bubble(ctx, x, y, B.r * s, B.al * cw);
        else pop(ctx, x, y, B.r * s, B.pop);
      }
      // the grand thrust's swoosh, the flourish's arc
      if (u > 4.92 && u < 5.3) {
        const w = (u - 4.92) / 0.38;
        swoosh(ctx, [billW(1.05), billW(0.7, -0.2), billW(0.3, -0.3), billW(-0.2, -0.2)], 1.8 * s, (1 - w) * 0.85 * cw);
      }
      if (u > 5.3 && u < 5.75) {
        const w = (u - 5.3) / 0.45;
        const c = tipW();
        swoosh(ctx, [c, add(c, [-2 * s, 3 * s]), add(c, [-3 * s, 6.5 * s])], 1.5 * s, (1 - w) * 0.75 * cw);
      }
      // smug: a sparkle by his head
      if (u > 5.7 && u < 6.4) {
        const w = (u - 5.7) / 0.7;
        const c = sk.inHead(1, -11);
        sparkle(ctx, c[0], c[1], 1.8 * s * Math.sin(Math.PI * w) * cw, rgba('#fff3c4', cw));
      }
    } else if (A.piece === 'mirror') {
      if (A.glint >= 0) {
        // the glint sliding down his bill, tip to root
        const g = 1 - sstep(A.glint);
        const c = billW(mix(0.15, 1, g), -0.6);
        sparkle(ctx, c[0], c[1], 2.2 * s * Math.sin(Math.PI * clamp(A.glint * 1.1, 0, 1)) * cw, '#ffffff');
      }
    } else if (A.piece === 'bow') {
      // the flourish of his fin: a few soft sparkles off it as it sweeps across
      const tip = sk.pecs.near?.tip;
      if (tip && u > 0.5 && u < 1.4) {
        const w = (u - 0.5) / 0.9;
        sparkle(ctx, tip[0], tip[1], 1.4 * s * Math.sin(Math.PI * w) * cw, rgba('#ffffff', cw));
      }
      if (u > 4.2 && u < 4.9) {
        const w = (u - 4.2) / 0.7;
        const c = tipW();
        sparkle(ctx, c[0], c[1] - 1 * s, 2 * s * Math.sin(Math.PI * w) * cw, '#ffffff');
      }
    }
  }
  // ----- his moves -----
  const MV = a.sfMove;
  if (MV && alive) {
    const mt = MV.t;
    const mvd = MOVES[MV.name];
    if (MV.name === 'lunge' && mt < 0) {
      // the wind-up: a glint running up the bill, a sparkle on the pearl as it's ready
      const c = tipW();
      sparkle(ctx, c[0] + 0.5 * s, c[1] - 1 * s, 2.6 * s * sstep((MV.w - 0.75) / 0.25), '#ffffff');
    }
    if (MV.name === 'fleche' && mt < 0) {
      // the crouch: a couple of bubbles gathering at his tail
      const r = sk.tail?.root ?? sk.pivot;
      for (let i = 0; i < 2; i++) bubble(ctx, r[0] - (2 + i * 2) * s, r[1] - (1 + i * 1.5) * s - MV.w * 1.5 * s, (0.6 + i * 0.3) * s, MV.w * 0.8);
    }
    if (MV.name === 'parry' && mt < 0 && MV.w > 0.55) {
      // the parry's "clink": a little sparkle up on the raised bill
      const w = (MV.w - 0.55) / 0.45;
      const c = billW(0.7, -0.6);
      sparkle(ctx, c[0], c[1], 2.2 * s * Math.sin(Math.PI * w), '#ffffff');
    }
    // the strike's swoosh along the bill
    const sw = mvd.swoosh;
    if (sw && mt >= sw[0] && mt < sw[1]) {
      const w = (mt - sw[0]) / (sw[1] - sw[0]);
      swoosh(ctx, [billW(1.08), billW(0.7), billW(0.3), billW(-0.15), billW(-0.55)], 2.2 * s, (1 - sstep(w)) * 0.9);
      // (two soft streaks alongside it)
      for (const off of [-2.6, 2.4]) swoosh(ctx, [billW(0.85, off), billW(0.4, off), billW(0.0, off)], 0.9 * s, (1 - w) * 0.6);
    }
    // the riposte's flick: a short arc at the tip
    const fl = mvd.flick;
    if (fl && mt >= fl[0] && mt < fl[1]) {
      const w = (mt - fl[0]) / (fl[1] - fl[0]);
      const c = tipW();
      swoosh(ctx, [c, add(c, [-2.5 * s, -3.5 * s]), add(c, [-3.5 * s, -7.5 * s])], 1.7 * s, (1 - w) * 0.85);
    }
    // the flèche's bubbles streaming off his tail, and soft speed streaks along him
    const tr = mvd.trail;
    if (tr && mt >= tr[0] && mt < tr[1] + 0.4) {
      const r = sk.tail?.root ?? sk.pivot;
      const back = scl(sk.fwd, -1);
      const fade = 1 - sstep((mt - tr[1]) / 0.4);
      for (let i = 0; i < 6; i++) {
        const q = ((mt - tr[0]) * 2.6 + i / 6) % 1;
        const d = (2 + q * 14) * s;
        const p = add(add(r, scl(back, d)), [Math.sin(q * 9 + i) * 0.8 * s, -q * 5 * s + (i % 3 - 1) * 1.6 * s]);
        bubble(ctx, p[0], p[1], (0.6 + (i % 3) * 0.3) * s * (1 - 0.4 * q), Math.sin(Math.PI * q) * fade);
      }
      if (mt < 0.3) {
        const w = mt / 0.3;
        for (const off of [-6, 0, 5]) {
          const p0 = sk.along(18 * s, off * s);
          swoosh(ctx, [p0, add(p0, scl(back, 7 * s)), add(p0, scl(back, 14 * s))], 0.9 * s, (1 - w) * 0.55);
        }
      }
    }
    // touché: the round sparkle at the pearl as the blow lands
    if (mvd.touche !== undefined) {
      const u = (mt - mvd.touche) / 0.45;
      if (u > 0 && u < 1) touche(ctx, tipW(), u, s);
    }
    // touché! (after a hit): the flourish's loop traced by the pearl, sparkles off it
    if (MV.name === 'flourish') {
      const u = clamp(mt / 0.7, 0, 1);
      if (mt > 0.1 && mt < 1.0) {
        const c = tipW();
        const k = 1 - sstep((mt - 0.7) / 0.3);
        sparkle(ctx, c[0], c[1], 1.8 * s * k, '#ffffff');
        sparkle(ctx, c[0] - 2 * s * u, c[1] + 3 * s * u, 1.0 * s * k, rgba('#ffd9e2', k));
      }
    }
  }
  // ----- his marks (on his drawn head) -----
  const over = sk.inHead(3.2, -13.2);
  if (a.sfBang >= 0) {
    mark(ctx, over[0], over[1], '!', a.sfBang, 1.2, s, unflip);
    // the "En garde!" flourish: a swoosh off the tip as he salutes
    if (a.sfBang > 0.36 && a.sfBang < 0.75) {
      const w = (a.sfBang - 0.36) / 0.39;
      const c = tipW();
      swoosh(ctx, [c, add(c, [-1.5 * s, 3.5 * s]), add(c, [-2 * s, 7 * s])], 1.5 * s, (1 - w) * 0.8);
    }
  } else if (a.sfHuh >= 0) mark(ctx, over[0], over[1], '?', a.sfHuh, 1.4, s, unflip);
  // after landing a hit: the touché sparkle note bobbing up over his head
  if (a.sfGloat >= 0 && a.sfGloat < 1.1) {
    const e = a.sfGloat;
    mark(ctx, over[0] + e * 2 * s, over[1] - e * 2.5 * s, '*', e, 1.1, s, unflip);
  }
  // hit: two soft drops knocked off his head, a little flinch star
  if (a.sfHurt >= 0 && a.sfHurt < 0.55 && alive) {
    const u = a.sfHurt / 0.55;
    const c = sk.inHead(-1.5, -9);
    for (const [dx, dy] of [[-1, -0.6], [-0.3, -1.1]]) {
      const x = c[0] + dx * (2 + 6 * u) * s;
      const y = c[1] + dy * (2 + 5 * u) * s + u * u * 5 * s;
      ctx.save();
      ctx.globalAlpha *= 1 - u;
      ctx.beginPath();
      ctx.moveTo(x, y - 1.1 * s);
      ctx.quadraticCurveTo(x + 0.85 * s, y + 0.3 * s, x, y + 0.8 * s);
      ctx.quadraticCurveTo(x - 0.85 * s, y + 0.3 * s, x, y - 1.1 * s);
      ctx.fillStyle = 'rgba(220,238,255,0.95)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(118,150,214,0.85)';
      ctx.lineWidth = 0.3 * s;
      ctx.stroke();
      ctx.restore();
    }
    sparkle(ctx, c[0] + 3 * s, c[1] - 1 * s, 2 * s * (1 - u), rgba('#ffffff', 1 - u));
  }
  // asleep: soft z's drifting up off his head, a little bubble after each
  if (a.sfNap) {
    const c = sk.inHead(0.5, -11.5);
    for (let i = 0; i < 2; i++) {
      const q = ((a.now ?? t) * 0.4 + i * 0.5) % 1;
      upright(ctx, c[0] + q * 5 * s + Math.sin(q * 5) * 1.2 * s, c[1] - q * 8 * s, unflip, () => zee(ctx, 0, 0, 0.6 + q * 0.5, Math.sin(Math.PI * q), s));
      bubble(ctx, c[0] + q * 5 * s - 2 * s, c[1] - q * 8 * s + 2.2 * s, 0.5 * s, Math.sin(Math.PI * q) * 0.8);
    }
  }
  // beaten: little sparkles and a pearl circling over his head
  if (!alive) {
    const c = sk.inHead(0.5, -11.5);
    for (let i = 0; i < 3; i++) {
      const q = t * 3 + (i / 3) * TAU;
      const x = c[0] + Math.cos(q) * 4.5 * s;
      const y = c[1] + Math.sin(q) * 1.5 * s;
      if (i === 0) {
        ell(ctx, x, y, 0.8 * s, 0.8 * s);
        ctx.fillStyle = SF.pearl.base;
        ctx.fill();
        ctx.strokeStyle = SF.pearl.ink;
        ctx.lineWidth = 0.3 * s;
        ctx.stroke();
      } else sparkle(ctx, x, y, 1.4 * s, i % 2 ? '#fff3c4' : '#ffffff');
    }
  }
  ctx.restore();
}

// (each frame, after his pose: the glints and shimmers the drawing reads)
function sfMarks(a) {
  const A = a.sfAct;
  const MV = a.sfMove;
  let gl = -1;
  if (A && A.piece === 'mirror' && A.cw > 0.3 && A.glint >= 0) gl = mix(1, 0.1, sstep(A.glint));
  if (MV && MV.name === 'lunge' && MV.t < 0 && MV.w > 0.2) gl = mix(0.05, 1, sstep((MV.w - 0.2) / 0.65));
  a.sfGlint = gl;
  a.sfShimmer = MV && MV.name === 'parry' && MV.t < 0 ? sstep(MV.w) : -1;
  a.sfSailTw = A && A.piece === 'mirror' ? (A.sailTw ?? 0) * A.cw : 0;
  a.sfEyeTw = A && A.piece === 'mirror' ? (A.eyeTw ?? 0) * A.cw : 0;
}

// ---------- His dress on the round fish ----------
const look = {
  P: {
    scale: 0.85,
    // (a chubby chibi sailfish: a big round head, a plump middle, a tail stock tapering to the fork)
    spine: [[12.5, 0.4, 7.8, 7.0], [8, 0, 9.6, 8.8], [3, -0.2, 10.3, 9.5], [-2.4, 0, 9.6, 8.8], [-7.4, 0.3, 7.4, 6.4], [-11.8, 0.4, 4.4, 3.8], [-15, 0.3, 2.5, 2.2], [-17.4, 0.2, 1.7, 1.5]],
    pivot: 2,
    // (the head's blunt round front: the chin, up under the bill's root, the brow)
    front: { pts: [[1.8, 6.5], [3.7, 5.3], [5.0, 3.8], [5.8, 2.2], [6.1, 0.7], [6.0, -0.8], [5.5, -2.6], [4.5, -4.5], [3.1, -6.1], [1.5, -7.3]], tip: 5 },
    pec: { at: [9.6, -3.6], len: 6.2, w: 3.4, ang: 140, scull: 18, tuck: 165, out: 100 },
    sail: { s0: 4.5, s1: 21, h: 13, prof: [0.86, 1.0, 0.97, 0.88, 0.76, 0.62, 0.46, 0.3], up: -6, fan: 7, flat: 76, foldLen: 0.32, flutter: 5, inset: 1.6, scallop: 0.07 },
    tail: { kind: 'fork', len: 8.6, w: 2.0, spread: 34, notch: 0.42 },
    swim: { amp: 14, fin: 1.8, lag: 0.8, beats: 2.0, idle: 0.45, scull: 0.8, paddle: 20, recoil: 3, bob: 0.7, flutter: 5 },
    speed: 40,
    lean: 1,
    swimFins: -0.15,
    turn: [0.14, 0.45, 30],
    float: 6,
    playful: 0,
    moves: POOL,
  },
  C: SF.C,
  CF: SF.CF,
  CS: SF.CS,
  inks: SF.inks,
  ink: SF.ink,
  fxC: SF.fxC,
  moves: MOVES,
  pleased: 'flourish',
  pick,
  bodyFill: sfBody,
  paint: sfPaint,
  face: sfFace,
  pose: (m, a, out, K, mv, mt) => {
    sfPose(m, a, out, K, mv, mt);
    sfMarks(a);
  },
  spot: (sk, what) => (what === 'mouth' || what === 'nose' ? sk.inHead(...BILL_TIP) : null),
  under: { body: sfBill },
  over: { sail: sfSailShimmer },
  fx: sfFx,
};

export const SAILFISH_FENCER = dressedSailfish(look);
// (`noHop`: none of the monster drawer's hops or idle notes over him; `ownEmotes`: his marks over his
// head left to him, drawn in his own style on his drawn head)
SAILFISH_FENCER.art.noHop = true;
SAILFISH_FENCER.art.ownEmotes = true;
// (his dress, for the dev tools that watch his parts frame by frame)
export const SAILFISH_FENCER_LOOK = look;
