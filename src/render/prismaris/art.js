// Prismaris's look (2026-11-27, the Little Crystal King rebuilt to today's standard, keeping his idea; the
// ids stay `crystalking` / `nightking`): drawn live over his own copy of the kid base's bones (kidrig.js),
// outer outline only (every piece's outline in one pass, then every piece's fill), each line in the
// piece's own deeper colour, never near-black. Nothing of the player character's: his hair, face, eyes
// and clothes are all his own.
//
// Who he is: a little boy-king of the Crystal Cave, scared of the dark, playing at being very grand
// under a crown far too big for him. A soft page-boy bob of pale prism-lilac hair (a rainbow glint in its
// shine), an even blunt fringe cut in five sections above his lashes, the bob's sides framing his cheeks
// outside his eyes and curling under at his jaw, the back of it behind him. A royal amethyst cape lined
// with crystal, an ermine capelet with a prism clasp, a white doublet with a gold sash, puffy sky-crystal
// breeches, white tights, crystal slippers with curled toes. His sceptre: a gold rod with a round-cut
// prism on top that throws rainbows. In his trial he wears the Queen's alarm clock round his neck on a
// gold chain, glowing like a nightlight, a sock over one of its bells.
//
// His face (his own eye family, "prism eyes"): big round downturned eyes (tareme: always a little
// worried), a lash line sloping down to a soft drooping flick at the outer corner, a full round bottom
// with no lid line; a cut-gem iris (deep violet at the top through lilac to a clear aqua glow below,
// three soft facet lights fanning from a rounded-diamond pupil), a round glint and his signature, a tiny
// rainbow arc low in each eye. Short round brows in his hair's deep lilac; a small mouth that pouts,
// wobbles and wails.
//
// Units: the head in head units (eyes at y 10, the face's edges at about +-35, chin 33, the skull's top
// about -58), placed on the kid base at HX, HY, HS; everything else in kid units (a third of a game px).
import { bluntBangs, drawBangs, drawPiece, shineBand, foreheadShade } from '../mobs/softhair.js';

export const TAU = Math.PI * 2;
export const D2R = Math.PI / 180;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, u) => a + (b - a) * u;
export const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
export const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
export const pulse = (t, t0, d) => {
  const u = (t - t0) / d;
  return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
};
export const boing = (t, k = 7, w = 15) => (t <= 0 ? 0 : 1 - Math.exp(-k * t) * Math.cos(w * t));
export const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
};
const hexRgb = (hex) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const rgba = (c, al) => {
  const [r, g, b] = hexRgb(c);
  return `rgba(${r},${g},${b},${clamp(al, 0, 1)})`;
};
// (a colour, whitened by a hit's flash)
export const tone = (a, c, al = 1) => {
  const k = Math.min(0.85, Math.max(0, (a?.flash ?? 0) * 6));
  const [r, g, b] = hexRgb(c);
  const f = (v) => Math.round(v + (255 - v) * k);
  return `rgba(${f(r)},${f(g)},${f(b)},${al})`;
};
export function glow(ctx, x, y, r, col, al) {
  if (al <= 0.005 || r <= 0.05) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, al));
  g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
export function smoothPath(ctx, pts) {
  const n = pts.length;
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  ctx.beginPath();
  const m0 = mid(pts[n - 1], pts[0]);
  ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  ctx.closePath();
}
export function paint(ctx, a, mode, col, ink, w = 6) {
  if (mode === 'line') {
    ctx.strokeStyle = ink;
    ctx.lineWidth = w;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, col);
    ctx.fill();
  }
}
const stroke = (ctx, a, pts, col, w) => {
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
  if (pts.length % 2 === 0) ctx.lineTo(...pts[pts.length - 1]);
  ctx.strokeStyle = tone(a, col);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
};

// ---------- His colours ----------
export const SKIN = { lt: '#fff7f3', base: '#ffe9de', sh: '#f6cbbd', deep: '#e3a79c', ink: '#c88a90', guides: false };
export const HAIR = ['#fcfaff', '#ded6fa', '#b2a4e8', '#8270c6'];
export const HAIR_INK = '#7462b4';
const LASH = '#3e2c6a';
const BROW = '#9682cc';
const IRIS = ['#46289a', '#7a58e0', '#5cc2ea', '#d2f8ff'];
export const GOLD = ['#fff4c4', '#f6d06e', '#d6a23e', '#a8762c'];
export const GOLD_INK = '#9a6a2a';
export const VELVET = ['#c09af0', '#9466d4', '#6e44b0', '#4e2e8a'];
export const VELVET_INK = '#4c2e84';
export const LINING = ['#ffffff', '#eef4ff', '#c6dcfa', '#9ab8ea'];
export const ERMINE = ['#ffffff', '#f4f4fc', '#dcdcf0'];
const ERMINE_INK = '#a8a2c8';
const ERMINE_SPOT = '#8a80aa';
export const DOUBLET = ['#dfe6ff', '#a9b6f6', '#8090e0', '#5c68bc'];
export const DOUBLET_INK = '#5460b0';
export const BREECH = ['#ffeaf6', '#f6c2e0', '#e098c4', '#b870a2'];
export const BREECH_INK = '#a86494';
const TIGHTS = ['#ffffff', '#efedf8', '#d8d4ec'];
export const SLIPPER = ['#fff0ff', '#eecaf8', '#cca2e8', '#a47ad0'];
export const SLIPPER_INK = '#9670c4';
// (the crown's prisms, left to right: lilac, aqua, pink at the middle, mint, peach)
export const PRISM = [['#f4eeff', '#d6c6fa', '#a690e6'], ['#eefcff', '#bfeefa', '#80cce8'], ['#fff0f6', '#ffc6de', '#f08cb8'], ['#effff6', '#c4f2da', '#82d2ae'], ['#fff6ea', '#ffdcb4', '#f0aa72']];
export const RAINBOW = ['#ffb4d2', '#ffd8a0', '#fff4a8', '#bff2c8', '#a8e6ff', '#cdb8ff'];
export const CLOCK = ['#ffe0ec', '#ffa6c6', '#e8789e', '#b85478'];
const SOCK = ['#d4f0ff', '#94d0f4', '#5aa8e0'];

// ---------- Frames ----------
export const SC = 1 / 3;
export const HS = 0.72;
export const HX = 81;
export const HY = 83 - 31 * HS;
export const hk = ([u, v]) => [HX + u * HS, HY + v * HS];

// ---------- His face (head units) ----------
// e: open | wide | glare | teary | happy | squeeze | shut | sleep | dizzy; g gaze; b brows [outer,
// inner] (+ lower); m mouth; puff: cheeks puffed; tear; blush (extra).
export const FACES = {
  calm: { e: 'open', g: [0.8, 0.6], b: [1, -1.6], m: 'wobble' },
  worried: { e: 'open', g: [0.4, 1.2], b: [2, -3.4], m: 'wobble' },
  scared: { e: 'wide', g: [0.2, -0.2], b: [1.6, -4.4], m: 'o' },
  peekL: { e: 'wide', g: [-2.4, 0.6], b: [1.6, -3.8], m: 'small' },
  peekR: { e: 'wide', g: [2.6, 0.6], b: [1.6, -3.8], m: 'small' },
  shush: { e: 'squeeze', b: [1.4, -3], m: 'shh', puff: 1 },
  relief: { e: 'shut', b: [-1, -2], m: 'phew' },
  proud: { e: 'happy', b: [-2.2, -1.4], m: 'grin', chin: 1 },
  smug: { e: 'shut', b: [-1.6, 0.4], m: 'smug' },
  decree: { e: 'open', g: [1.8, -0.6], b: [-1.6, 1.6], m: 'talkA' },
  focus: { e: 'glare', g: [2, 0.6], b: [0.4, 2.6], m: 'pout' },
  cross: { e: 'glare', g: [2.2, 0.4], b: [-0.6, 3.6], m: 'pout', puff: 1 },
  tantrum: { e: 'squeeze', b: [-0.4, 3.4], m: 'wail', puff: 0.5 },
  shout: { e: 'glare', g: [2.2, 0.2], b: [-0.8, 3.8], m: 'mine' },
  delight: { e: 'wide', g: [1.4, 1.8], b: [-2.8, -2.6], m: 'grin', blush: 1 },
  happy: { e: 'happy', b: [-2.4, -2.2], m: 'open', blush: 1 },
  cuddle: { e: 'happy', b: [-1, -2.6], m: 'smile', blush: 1 },
  surprised: { e: 'wide', g: [0.4, -0.6], b: [-3.6, -3.8], m: 'o' },
  hurt: { e: 'squeeze', b: [2, -3.6], m: 'wail', tear: 1 },
  sad: { e: 'teary', g: [0.4, 2.2], b: [2.4, -3.8], m: 'frown', tear: 1 },
  sniffle: { e: 'teary', g: [0.6, 1.6], b: [2.2, -3.4], m: 'wobble', tear: 1 },
  pant: { e: 'open', g: [1, 1.4], b: [2, -3], m: 'pant' },
  sleep: { e: 'sleep', b: [0.6, -0.6], m: 'sleepy' },
  shut: { e: 'shut', b: [0.6, -1.2], m: 'wobble' },
  dizzy: { e: 'dizzy', b: [1.6, -2.6], m: 'wobble' },
  talkA: { e: 'open', g: [1, 0.4], b: [0.6, -1.4], m: 'talkA' },
  talkE: { e: 'open', g: [1, 0.4], b: [0.6, -1.4], m: 'talkE' },
  talkO: { e: 'open', g: [1, 0.4], b: [0.6, -1.4], m: 'o' },
};
export const SHUTS = new Set(['shush', 'relief', 'proud', 'smug', 'tantrum', 'happy', 'cuddle', 'hurt', 'sleep', 'shut', 'dizzy']);

// One prism eye (head units): o -1 the far eye, 1 the near (its outer corner that way).
function eye(ctx, a, x, y, o, f) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.16, 1.16);
  ctx.translate(-x, -y);
  eye0(ctx, a, x, y, o, f);
  ctx.restore();
}
function eye0(ctx, a, x, y, o, f) {
  const P = (dx, dy) => [x + dx * o, y + dy];
  const lw = 2.2;
  let kind = f.e;
  if (kind === 'happy') {
    stroke(ctx, a, [P(-7, 2.4), P(0.4, -6), P(7.6, 2.6)], LASH, lw);
    return;
  }
  if (kind === 'squeeze') {
    stroke(ctx, a, [P(6.6, -3.6), P(0, -1), P(-5.6, 0.8)], LASH, lw);
    stroke(ctx, a, [P(6.6, 4.4), P(0, 2), P(-5.6, 0.8)], LASH, lw * 0.85);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    stroke(ctx, a, [P(-7, -0.6), P(0, kind === 'sleep' ? 4.4 : 3.6), P(7.8, 0.4)], LASH, lw);
    stroke(ctx, a, [P(7.6, 0.4), P(9.2, 1.4), P(9.8, 3)], LASH, 1.3);
    return;
  }
  const wide = kind === 'wide' ? 1.4 : 0;
  const glare = kind === 'glare' ? 1 : 0;
  // the round eye: the lash line sloping down to the outer corner (tareme), a full round bottom; a glare
  // only lowers the inner end of the line a touch (never a lid over the iris)
  const inner = P(-7.2, -2.2 + glare * 1.4);
  const outer = P(8.4, 0.8);
  const t1 = P(-4.4, -9.4 - wide + glare * 2.2);
  const t2 = P(3.8, -9.2 - wide + glare * 0.6);
  const b1 = P(8, 6.4 + wide * 0.4);
  const b2 = P(1.6, 8.8 + wide * 0.6);
  const b3 = P(-4.6, 7.8 + wide * 0.4);
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(...inner);
    ctx.bezierCurveTo(...t1, ...t2, ...outer);
    ctx.bezierCurveTo(...b1, ...b2, ...b3);
    ctx.quadraticCurveTo(...P(-7.6, 3.2), ...inner);
    ctx.closePath();
  };
  shape();
  ctx.fillStyle = tone(a, '#ffffff');
  ctx.fill();
  if (kind === 'dizzy') {
    ctx.beginPath();
    for (let i = 0; i <= 26; i++) {
      const u = i / 26;
      const an = u * TAU * 1.8 * o;
      const px = x + 0.6 * o + Math.cos(an) * u * 4.8;
      const py = y + 1.2 + Math.sin(an) * u * 4.8;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.strokeStyle = tone(a, IRIS[1]);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    stroke(ctx, a, [inner, P(0, -9.2), outer], LASH, lw);
    return;
  }
  ctx.save();
  shape();
  ctx.clip();
  const [gx, gy] = f.g ?? [0.8, 0.6];
  const ix = x + gx + 0.4 * o;
  const iy = y + 1.6 + gy;
  const ir = wide ? 0.84 : 1;
  // the cut-gem iris: deep violet at the top, lilac, a clear aqua glow below
  ell(ctx, ix, iy, 5.8 * ir, 7 * ir);
  ctx.fillStyle = tone(a, IRIS[0]);
  ctx.fill();
  ell(ctx, ix, iy + 1.4, 5.2 * ir, 5.6 * ir);
  ctx.fillStyle = tone(a, IRIS[1]);
  ctx.fill();
  ell(ctx, ix, iy + 3.4, 4.2 * ir, 3.2 * ir);
  ctx.fillStyle = tone(a, IRIS[2]);
  ctx.fill();
  ell(ctx, ix, iy + 4.6, 2.8 * ir, 1.7 * ir);
  ctx.fillStyle = tone(a, IRIS[3]);
  ctx.fill();
  // three soft facet lights fanning down from the pupil
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  for (const an of [-0.55, 0, 0.55]) {
    ctx.beginPath();
    ctx.moveTo(ix, iy + 0.4);
    ctx.lineTo(ix + Math.sin(an - 0.16) * 6.2 * ir, iy + 0.4 + Math.cos(an - 0.16) * 6.2 * ir);
    ctx.quadraticCurveTo(ix + Math.sin(an) * 7 * ir, iy + 0.4 + Math.cos(an) * 7 * ir, ix + Math.sin(an + 0.16) * 6.2 * ir, iy + 0.4 + Math.cos(an + 0.16) * 6.2 * ir);
    ctx.closePath();
    ctx.fill();
  }
  // the rounded-diamond pupil
  const pw = (wide ? 1.4 : glare ? 1.6 : 2) * ir;
  const ph = (wide ? 2.2 : 3) * ir;
  smoothPath(ctx, [[ix, iy - ph], [ix + pw, iy + 0.2], [ix, iy + ph], [ix - pw, iy + 0.2]]);
  ctx.fillStyle = tone(a, '#24164a');
  ctx.fill();
  // glints: a big round one up at the back, his rainbow arc low at the front, a tiny dot
  ell(ctx, ix - 2.2 * o, iy - 3, wide ? 2.6 : 2.2, wide ? 2.4 : 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineCap = 'round';
  RAINBOW.slice(0, 5).forEach((c, i) => {
    ctx.beginPath();
    ctx.arc(ix + 1.6 * o, iy + 4.8, 1.4 + i * 0.42, Math.PI * 1.12, Math.PI * 1.88);
    ctx.strokeStyle = rgba(c, 0.9);
    ctx.lineWidth = 0.5;
    ctx.stroke();
  });
  ell(ctx, ix + 2.8 * o, iy + 1.2, 0.7, 0.7);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  if (kind === 'teary') {
    // tears gathering: a wobbly shine along the bottom
    ctx.beginPath();
    ctx.moveTo(...P(-5.6, 5.8));
    ctx.quadraticCurveTo(...P(-2.4, 8.2), ...P(0.4, 7.2));
    ctx.quadraticCurveTo(...P(3.2, 8.4), ...P(6.4, 5.4));
    ctx.strokeStyle = 'rgba(236,250,255,0.95)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  ctx.restore();
  // a faint crease above, then the neat lash line, thicker toward its outer corner, and its soft
  // drooping flick
  stroke(ctx, a, [P(-3.6, -11.4 - wide), P(1.4, -12.6 - wide), P(6.4, -9.6)], SKIN.deep, 0.7);
  stroke(ctx, a, [inner, P(-1.6, -9.6 - wide + glare * 1.6), P(4.4, -8.2 - wide * 0.6 + glare * 0.4)], LASH, lw * 0.85);
  stroke(ctx, a, [P(4.2, -8.2 - wide * 0.6 + glare * 0.4), P(7.6, -5.4), outer], LASH, lw * 1.15);
  stroke(ctx, a, [P(8, 0.4), P(9.6, 1.6), P(10.2, 3.4)], LASH, 1.5);
}
function brows(ctx, a, b) {
  const [bo, bi] = b ?? [0, 0];
  for (const o of [-1, 1]) {
    const cx = o < 0 ? -13.6 : 15.2;
    const y0 = -3.6;
    // (short and round at both ends, gently curved: inner end, a soft peak, outer end)
    const inner = [cx - 4.4 * o, y0 + bi * 0.7];
    const peak = [cx + 0.4 * o, y0 - 1.8 + (bo + bi) * 0.35];
    const outer = [cx + 4.6 * o, y0 + 0.2 + bo * 0.7];
    ctx.beginPath();
    ctx.moveTo(...inner);
    ctx.quadraticCurveTo(...peak, ...outer);
    ctx.strokeStyle = tone(a, BROW);
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}
function mouth(ctx, a, m) {
  const x = 2.6;
  const y = 23.6;
  const LIP = '#b0506e';
  const inside = '#a8405e';
  const fillM = (pts) => {
    smoothPath(ctx, pts);
    ctx.fillStyle = tone(a, inside);
    ctx.fill();
  };
  const tongue = (tx, ty, rx, ry) => {
    ell(ctx, tx, ty, rx, ry);
    ctx.fillStyle = tone(a, '#ff94ac');
    ctx.fill();
  };
  const line = (pts, w = 1.4) => stroke(ctx, a, pts, LIP, w);
  switch (m) {
    case 'grin':
      fillM([[x - 4.8, y - 1.2], [x + 4.8, y - 1.2], [x + 3.6, y + 2.8], [x, y + 4.2], [x - 3.6, y + 2.8]]);
      smoothPath(ctx, [[x - 3.8, y - 0.9], [x + 3.8, y - 0.9], [x + 3.4, y + 0.4], [x - 3.4, y + 0.4]]);
      ctx.fillStyle = tone(a, '#ffffff');
      ctx.fill();
      tongue(x, y + 2.8, 2, 1);
      break;
    case 'open':
      fillM([[x - 3.8, y - 0.8], [x + 3.8, y - 0.8], [x + 2.8, y + 2.6], [x, y + 3.8], [x - 2.8, y + 2.6]]);
      tongue(x, y + 2.6, 1.8, 1);
      break;
    case 'mine':
      fillM([[x - 5, y - 1.8], [x + 5, y - 1.8], [x + 4.2, y + 3.6], [x, y + 6.2], [x - 4.2, y + 3.6]]);
      tongue(x, y + 4.4, 2.6, 1.5);
      break;
    case 'wail':
      fillM([[x - 4.4, y - 0.6], [x + 4.4, y - 0.6], [x + 3.4, y + 4.2], [x - 3.4, y + 4.2]]);
      tongue(x, y + 3.4, 2.2, 1);
      break;
    case 'pout':
      line([[x - 2.6, y + 1.8], [x, y + 0.6], [x + 2.6, y + 1.8]], 1.3);
      line([[x - 1.4, y + 2.8], [x, y + 3.2], [x + 1.4, y + 2.8]], 0.8);
      break;
    case 'shh':
      fillM([[x - 1.4, y + 0.2], [x, y - 0.4], [x + 1.4, y + 0.2], [x + 1.4, y + 1.8], [x, y + 2.4], [x - 1.4, y + 1.8]]);
      break;
    case 'phew':
      fillM([[x - 2, y + 0.2], [x, y - 0.4], [x + 2, y + 0.2], [x + 2, y + 2], [x, y + 2.8], [x - 2, y + 2]]);
      break;
    case 'smile':
      line([[x - 3.4, y], [x, y + 2.4], [x + 3.6, y - 0.2]], 1.3);
      break;
    case 'smug':
      line([[x - 3.2, y + 1], [x + 0.4, y + 2], [x + 3.4, y - 0.4]], 1.3);
      break;
    case 'frown':
      line([[x - 3.2, y + 2], [x, y + 0.2], [x + 3.2, y + 2]], 1.3);
      break;
    case 'o':
      fillM([[x - 1.8, y + 0.2], [x, y - 0.8], [x + 1.8, y + 0.2], [x + 1.8, y + 2.6], [x, y + 3.6], [x - 1.8, y + 2.6]]);
      break;
    case 'small':
      line([[x - 1.8, y + 1.2], [x, y + 1.6], [x + 1.8, y + 1.1]], 1.2);
      break;
    case 'pant':
      fillM([[x - 2.8, y - 0.4], [x + 2.8, y - 0.4], [x + 2.2, y + 2.4], [x, y + 3.2], [x - 2.2, y + 2.4]]);
      tongue(x + 0.4, y + 2.3, 1.5, 1);
      break;
    case 'sleepy':
      fillM([[x - 1.1, y + 0.6], [x, y + 0.2], [x + 1.1, y + 0.6], [x + 1.1, y + 1.8], [x, y + 2.3], [x - 1.1, y + 1.8]]);
      break;
    case 'talkA':
      fillM([[x - 2.6, y - 0.4], [x + 2.6, y - 0.4], [x + 2, y + 2.8], [x, y + 3.6], [x - 2, y + 2.8]]);
      break;
    case 'talkE':
      fillM([[x - 3.2, y + 0.2], [x + 3.2, y + 0.2], [x + 2.4, y + 2], [x - 2.4, y + 2]]);
      break;
    default:
      // his resting wobble: a small worried line, a little higher at the near corner
      line([[x - 3, y + 1.4], [x - 1, y + 0.6], [x + 0.4, y + 1.4], [x + 2, y + 0.4], [x + 3.2, y + 1]], 1.3);
  }
}
// The face: a round little-boy face, full cheeks, a soft small chin.
export const FACE = [[-33, -12], [-35, 8], [-31, 21], [-19, 30], [2, 33], [20, 30], [31, 21], [35, 8], [33, -12], [0, -30]];
export const BANGS = bluntBangs({ x0: -32, x1: 32, n: 5, cutMid: -6.8, rise: 5.2, seed: 41, top: -40, occl: -33 });
export function faceDraw(ctx, a, mode, f) {
  smoothPath(ctx, FACE);
  paint(ctx, a, mode, SKIN.base, SKIN.deep, 3.6 / HS);
  if (mode !== 'fill') return;
  ctx.save();
  smoothPath(ctx, FACE);
  ctx.clip();
  glow(ctx, -31, 12, 10, SKIN.sh, 0.55);
  glow(ctx, 6, 38, 14, SKIN.sh, 0.35);
  foreheadShade(ctx, BANGS, SKIN.sh, 0.7);
  ctx.restore();
  // his cheeks: soft and round; puffed out pink in a huff
  const puff = f.puff ?? 0;
  for (const [cx, k] of [[-20, 0.85], [24, 1]]) {
    if (puff > 0) {
      ell(ctx, cx + (cx < 0 ? -1 : 1), 18.4, 7.6, 5.2);
      ctx.fillStyle = tone(a, '#ffd0d8', 0.7 * puff);
      ctx.fill();
    }
    ell(ctx, cx, 19.4, 6.8 + (f.blush ?? 0) * 1.4, 3.8 + (f.blush ?? 0) * 0.6);
    ctx.fillStyle = tone(a, '#ffaabb', 0.5 * k);
    ctx.fill();
    for (let i = 0; i < 2; i++) stroke(ctx, a, [[cx - 2 + i * 2.8, 20.6], [cx - 0.8 + i * 2.8, 18.6]], '#f07896', 0.9);
  }
  eye(ctx, a, -13.6, 10, -1, f);
  eye(ctx, a, 15.2, 10, 1, f);
  brows(ctx, a, f.b);
  // a little nose: a soft shade and a tip light
  glow(ctx, 3.4, 17.4, 2.6, SKIN.deep, 0.45);
  ell(ctx, 3, 16.6, 0.8, 0.6);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fill();
  mouth(ctx, a, f.m);
  if (f.tear) {
    for (const sx of [-21.6, 23.6]) {
      ctx.beginPath();
      ctx.moveTo(sx, 15);
      ctx.quadraticCurveTo(sx + 2.4, 19.6, sx, 21);
      ctx.quadraticCurveTo(sx - 2.4, 19.6, sx, 15);
      ctx.fillStyle = 'rgba(206,240,255,0.95)';
      ctx.fill();
      ell(ctx, sx - 0.5, 19, 0.6, 0.8);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }
}

// ---------- His hair (soft hair: one light, an even blunt cut) ----------
export const HAIR_H = { C: HAIR, ink: HAIR_INK, tone, lw: 3.6 / HS, top: -62, bottom: 40 };
// (a full round cap over the skull for his bob, its bottom edge the hairline over the bangs)
export const CAP = [[-38.4, -8], [-40.4, -28], [-33.6, -46.4], [-18.4, -57], [0, -60], [18.4, -57], [33.6, -46.4], [40.4, -28], [38.4, -8], [33.6, -17], [22, -29], [0, -33], [-22, -29], [-33.6, -17]];
// The back of his bob (behind him): round, down to his nape, curling under.
export const BACK = [[-41, -30], [-35, -50], [-20, -61], [0, -64], [20, -61], [35, -50], [41, -30], [42.4, -8], [40.6, 10], [35, 22], [22, 27], [0, 28], [-22, 27], [-35, 22], [-40.6, 10], [-42.4, -8]];
export function backHair(ctx, a, mode) {
  drawPiece(ctx, a, mode, BACK, HAIR_H, (c) => {
    // the bob curling under: a deeper shade along its bottom, a lit rim just above it
    const g = c.createLinearGradient(0, 20, 0, 38);
    g.addColorStop(0, rgba(HAIR[3], 0));
    g.addColorStop(1, rgba(HAIR[3], 0.5));
    c.fillStyle = g;
    c.fillRect(-46, 20, 92, 20);
    glow(c, 0, -6, 40, HAIR[3], 0.35);
  });
}
// A side of his bob framing his cheek, outside his eye: falling straight to his jaw, its end curling
// under in one soft round turn.
export function sideLock(ctx, a, mode, root, len, w, o, swing) {
  ctx.save();
  ctx.translate(root[0], root[1]);
  ctx.rotate(swing);
  const pts = [[-w * 0.55 * o, -14], [w * 0.5 * o, -14], [w * 0.62 * o, len * 0.45], [w * 0.5 * o, len * 0.86], [w * 0.05 * o, len], [-w * 0.48 * o, len * 0.9], [-w * 0.62 * o, len * 0.62], [-w * 0.6 * o, len * 0.2]];
  const H = { ...HAIR_H, top: HAIR_H.top - root[1], bottom: HAIR_H.bottom - root[1] };
  drawPiece(ctx, a, mode, pts, H, (c) => {
    const g = c.createLinearGradient(0, -14, 0, 4);
    g.addColorStop(0, rgba(HAIR[3], 0.4));
    g.addColorStop(1, rgba(HAIR[3], 0));
    c.fillStyle = g;
    c.fillRect(-w, -14, w * 2, 18);
    // the curl under at its end: a deeper inner edge and a lit outer roll
    glow(c, -w * 0.3 * o, len * 0.94, w * 0.5, HAIR[3], 0.5);
    glow(c, w * 0.3 * o, len * 0.74, w * 0.4, HAIR[0], 0.45);
  });
  ctx.restore();
}
// His hair's one shine, with his signature: a faint rainbow glint along it, like light through a prism.
export function hairShine(ctx, a) {
  shineBand(ctx, a, HAIR_H, [CAP], -47, 2.4, -30, 30);
  ctx.save();
  smoothPath(ctx, CAP);
  ctx.clip();
  const g = ctx.createLinearGradient(-24, 0, 24, 0);
  RAINBOW.forEach((c, i) => g.addColorStop(i / (RAINBOW.length - 1), rgba(c, 0.38)));
  ctx.fillStyle = g;
  ctx.beginPath();
  for (let i = 0; i <= 16; i++) {
    const x = -24 + (48 * i) / 16;
    const y = -47 + ((x / 34) ** 2) * 7 + 2.4;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  for (let i = 16; i >= 0; i--) {
    const x = -24 + (48 * i) / 16;
    ctx.lineTo(x, -47 + ((x / 34) ** 2) * 7 + 4.2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
export function drawHair(ctx, a, mode) {
  drawBangs(ctx, a, mode, BANGS, HAIR_H);
  drawPiece(ctx, a, mode, CAP, HAIR_H, (c) => glow(c, -14, -50, 18, HAIR[0], 0.5));
  if (mode === 'fill') hairShine(ctx, a);
}

// ---------- The crown, far too big for him (head units, about its band's middle) ----------
// A gold band wider than his head, five crystal prisms on it, their tips rounded; gems along the band.
const CROWN_PRISMS = [[-31, 15, 0], [-15.6, 21, 1], [0, 29, 2], [15.6, 21, 3], [31, 15, 4]];
export function crown(ctx, a, mode) {
  for (const [x, h, c] of CROWN_PRISMS) {
    const [lt, base, dk] = PRISM[c];
    const w = c === 2 ? 7.4 : 6.2;
    const pts = [[x - w, 1], [x - w, -h * 0.55], [x - w * 0.5, -h * 0.9], [x, -h], [x + w * 0.5, -h * 0.9], [x + w, -h * 0.55], [x + w, 1]];
    smoothPath(ctx, pts);
    if (mode === 'line') {
      paint(ctx, a, 'line', null, rgba(dk, 1), 4.4);
      continue;
    }
    const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
    g.addColorStop(0, tone(a, lt));
    g.addColorStop(0.48, tone(a, base));
    g.addColorStop(0.52, tone(a, dk));
    g.addColorStop(1, tone(a, base));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    smoothPath(ctx, pts);
    ctx.clip();
    // facets: a light along its lit face, a soft glow near the tip
    ctx.fillStyle = tone(a, '#ffffff', 0.55);
    ctx.beginPath();
    ctx.moveTo(x - w * 0.6, -1);
    ctx.lineTo(x - w * 0.6, -h * 0.55);
    ctx.lineTo(x - w * 0.15, -h * 0.85);
    ctx.lineTo(x - w * 0.15, -1);
    ctx.closePath();
    ctx.fill();
    glow(ctx, x - 1, -h * 0.8, w * 0.9, '#ffffff', 0.6);
    ctx.restore();
  }
  // the band: gold, its top lit, a deeper underside, a row of gems
  const band = [[-42, -6.4], [0, -7.6], [42, -6.4], [43, 1.6], [41, 5.2], [0, 6.6], [-41, 5.2], [-43, 1.6]];
  smoothPath(ctx, band);
  paint(ctx, a, mode, GOLD[1], GOLD_INK, 4.4);
  if (mode !== 'fill') return;
  ctx.save();
  smoothPath(ctx, band);
  ctx.clip();
  const g = ctx.createLinearGradient(0, -7, 0, 6);
  g.addColorStop(0, rgba(GOLD[0], 0.9));
  g.addColorStop(0.45, rgba(GOLD[1], 0));
  g.addColorStop(1, rgba(GOLD[3], 0.6));
  ctx.fillStyle = g;
  ctx.fillRect(-44, -8, 88, 16);
  ctx.restore();
  for (const [x, c] of [[-31, 4], [-15.6, 1], [0, 2], [15.6, 3], [31, 0]]) {
    ell(ctx, x, 0, c === 2 ? 3.4 : 2.6, c === 2 ? 3 : 2.4);
    ctx.fillStyle = tone(a, PRISM[c][2]);
    ctx.fill();
    ell(ctx, x - 0.8, -0.8, 1, 0.8);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
}

// ---------- The sceptre (its own frame: the grip at 0, 0, up the rod at -y; kid units) ----------
// A gold rod, a little collar, and a round-cut prism on top: a soft gem with rounded facets.
export const ROD = 40;
export function sceptre(ctx, a, mode, shine = 0) {
  smoothPath(ctx, [[-1.6, 8], [1.6, 8], [1.8, -ROD + 4], [-1.8, -ROD + 4]]);
  paint(ctx, a, mode, GOLD[2], GOLD_INK, 2);
  if (mode === 'fill') {
    ctx.fillStyle = tone(a, GOLD[0], 0.8);
    ctx.fillRect(-1.2, -ROD + 5, 0.9, ROD + 2);
    ell(ctx, 0, 8.6, 2.6, 2.2);
    ctx.fillStyle = tone(a, GOLD[1]);
    ctx.fill();
  }
  // the collar
  smoothPath(ctx, [[-4.6, -ROD + 6], [4.6, -ROD + 6], [3.2, -ROD + 1], [-3.2, -ROD + 1]]);
  paint(ctx, a, mode, GOLD[1], GOLD_INK, 2);
  // the prism: a rounded octagon, its facets soft
  const R = 7.2;
  const cy = -ROD - R + 2;
  const pts = Array.from({ length: 8 }, (_, i) => {
    const an = (i / 8) * TAU + Math.PI / 8;
    return [Math.cos(an) * R, cy + Math.sin(an) * R * 1.08];
  });
  smoothPath(ctx, pts);
  paint(ctx, a, mode, '#e6f4ff', '#7a9ad8', 2);
  if (mode !== 'fill') return;
  ctx.save();
  smoothPath(ctx, pts);
  ctx.clip();
  const g = ctx.createLinearGradient(-R, cy - R, R, cy + R);
  RAINBOW.forEach((c, i) => g.addColorStop(i / (RAINBOW.length - 1), rgba(c, 0.55)));
  ctx.fillStyle = g;
  ctx.fillRect(-R, cy - R * 1.2, R * 2, R * 2.4);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.moveTo(-R * 0.7, cy - R * 0.3);
  ctx.lineTo(-R * 0.1, cy - R * 0.95);
  ctx.lineTo(R * 0.25, cy - R * 0.4);
  ctx.lineTo(-R * 0.3, cy + R * 0.25);
  ctx.closePath();
  ctx.fill();
  glow(ctx, 0, cy, R * 1.1, '#ffffff', 0.35 + shine * 0.5);
  ctx.restore();
  ell(ctx, -R * 0.36, cy - R * 0.5, 1.4, 1.1);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}
export const PRISM_TIP = -ROD - 7.2 + 2;

// ---------- The Queen's alarm clock, on its chain (kid units, about its middle) ----------
export function clockFace(ctx, a, mode, r, ring = 0) {
  const bell = (x, y, s, sock) => {
    ell(ctx, x, y, s, s * 0.9);
    paint(ctx, a, mode, sock ? SOCK[1] : GOLD[1], sock ? '#4a8ac4' : GOLD_INK, 1.6);
    if (mode === 'fill' && sock) {
      ctx.fillStyle = tone(a, SOCK[2]);
      ctx.fillRect(x - s, y + s * 0.2, s * 2, s * 0.24);
      ctx.fillRect(x - s, y - s * 0.4, s * 2, s * 0.2);
      ell(ctx, x + s * 0.5, y - s * 0.9, s * 0.34, s * 0.3);
      ctx.fillStyle = tone(a, SOCK[0]);
      ctx.fill();
    }
  };
  const sh = Math.sin(ring * 60) * ring * 0.6;
  bell(-r * 0.64 + sh, -r * 0.96, r * 0.42, false);
  bell(r * 0.64 + sh, -r, r * 0.46, true);
  for (const sx of [-1, 1]) {
    ell(ctx, sx * r * 0.56, r * 0.94, r * 0.2, r * 0.15);
    paint(ctx, a, mode, GOLD[2], GOLD_INK, 1.6);
  }
  ell(ctx, 0, 0, r, r * 0.96);
  paint(ctx, a, mode, CLOCK[1], '#b8507a', 2);
  if (mode !== 'fill') return;
  ctx.save();
  ell(ctx, 0, 0, r, r * 0.96);
  ctx.clip();
  glow(ctx, -r * 0.4, r * 0.5, r * 0.9, CLOCK[2], 0.6);
  glow(ctx, r * 0.4, -r * 0.5, r * 0.6, CLOCK[0], 0.8);
  ctx.restore();
  ell(ctx, 0, 0.2, r * 0.72, r * 0.7);
  ctx.fillStyle = tone(a, '#fffaf2');
  ctx.fill();
  for (let k = 0; k < 12; k += 3) {
    const an = (k * Math.PI) / 6;
    ell(ctx, Math.cos(an) * r * 0.54, 0.2 + Math.sin(an) * r * 0.52, 0.6, 0.6);
    ctx.fillStyle = '#7a6080';
    ctx.fill();
  }
  stroke(ctx, a, [[0, 0.2], [-r * 0.34, -r * 0.2]], '#5a4668', 1);
  stroke(ctx, a, [[0, 0.2], [-r * 0.06, r * 0.46]], '#5a4668', 0.8);
}

// ---------- His clothes (kid units, in his bones' frames) ----------
// (D: the rig's kit; enter() steps into a bone's frame with the kid base's own units)
export const PIVOT0 = { chest: 'ribs', waistB: 'navel', torso: 'hip', head: 'neck', armFu: 'shF', armFf: 'elF', armNu: 'shN', armNf: 'elN', handF: 'wrF', handN: 'wrN', thighF: 'hipF', thighN: 'hipN', shinF: 'kneeF', shinN: 'kneeN', footF: 'ankF', footN: 'ankN' };

// The doublet's body (chest frame): white, a soft lilac shade down its far side, a gold sash across.
export function doublet(ctx, a, mode) {
  const body = [[67.4, 85.8], [74, 84.6], [80.4, 85.2], [87, 84.6], [93.6, 85.8], [95.6, 96], [95.2, 105.6], [80.4, 107], [65.8, 105.6], [65.4, 96]];
  smoothPath(ctx, body);
  paint(ctx, a, mode, DOUBLET[1], DOUBLET_INK, 2.2);
  if (mode !== 'fill') return;
  ctx.save();
  smoothPath(ctx, body);
  ctx.clip();
  glow(ctx, 66, 100, 10, DOUBLET[3], 0.55);
  glow(ctx, 89, 90, 8, DOUBLET[0], 0.9);
  // the gold sash from his far shoulder down to his near hip
  ctx.beginPath();
  ctx.moveTo(66, 86);
  ctx.lineTo(72.6, 85);
  ctx.lineTo(97, 101.4);
  ctx.lineTo(96, 107);
  ctx.closePath();
  ctx.fillStyle = tone(a, GOLD[1]);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(67, 86.4);
  ctx.lineTo(70, 86);
  ctx.lineTo(96, 103);
  ctx.lineTo(95.6, 104.4);
  ctx.closePath();
  ctx.fillStyle = tone(a, GOLD[0], 0.8);
  ctx.fill();
  // a soft fold down its middle and two pearl buttons
  ctx.restore();
  stroke(ctx, a, [[80.6, 87.6], [80.2, 96], [80.6, 104.4]], DOUBLET[2], 0.7);
  for (const y of [90.4, 99.4]) {
    ell(ctx, 82.4, y, 1.1, 1.1);
    ctx.fillStyle = tone(a, '#ffffff');
    ctx.fill();
    ctx.strokeStyle = tone(a, DOUBLET[3]);
    ctx.lineWidth = 0.4;
    ctx.stroke();
  }
}
// The doublet's short skirt (torso frame) in two soft panels hanging over his breeches.
export const SKIRT = {
  F: [[64.6, 102.6], [80.6, 103.4], [79.8, 109.6], [73, 112.8], [65.8, 112.2], [63.4, 108]],
  N: [[80.2, 103.4], [96.2, 102.6], [97.4, 108], [95, 112.2], [88, 112.8], [81.2, 109.6]],
};
export function skirtPanel(ctx, a, mode, k) {
  smoothPath(ctx, SKIRT[k]);
  paint(ctx, a, mode, k === 'F' ? DOUBLET[2] : DOUBLET[1], DOUBLET_INK, 2.2);
  if (mode !== 'fill') return;
  ctx.save();
  smoothPath(ctx, SKIRT[k]);
  ctx.clip();
  const g = ctx.createLinearGradient(0, 108, 0, 113);
  g.addColorStop(0, rgba(GOLD[1], 0));
  g.addColorStop(0.55, rgba(GOLD[1], 0));
  g.addColorStop(0.6, rgba(GOLD[1], 1));
  g.addColorStop(1, rgba(GOLD[2], 1));
  ctx.fillStyle = g;
  ctx.fillRect(60, 104, 40, 10);
  glow(ctx, k === 'F' ? 66 : 92, 106, 6, DOUBLET[3], 0.4);
  ctx.restore();
}
// The breeches (torso frame for the seat, a thigh frame for each leg): puffy, gathered in a cuff.
export function breechSeat(ctx, a, mode) {
  const pts = [[65.6, 101], [80, 100.4], [94.4, 101], [96, 108.4], [91.4, 111], [80, 111.8], [68.6, 111], [64, 108.4]];
  smoothPath(ctx, pts);
  paint(ctx, a, mode, BREECH[1], BREECH_INK, 2.2);
}
export function breechLeg(ctx, a, mode, k) {
  const x = k === 'F' ? 73 : 87;
  const far = k === 'F';
  const pts = [[x - 7, 104], [x + 7, 104], [x + 8.4, 111], [x + 6.6, 117.2], [x, 118.2], [x - 6.6, 117.2], [x - 8.4, 111]];
  smoothPath(ctx, pts);
  paint(ctx, a, mode, far ? BREECH[2] : BREECH[1], BREECH_INK, 2.2);
  if (mode !== 'fill') return;
  ctx.save();
  smoothPath(ctx, pts);
  ctx.clip();
  glow(ctx, x + 2.6, 108, 6, far ? BREECH[1] : BREECH[0], 0.9);
  glow(ctx, x - 5, 113, 5, BREECH[3], 0.5);
  // two soft puff seams
  for (const dx of [-2.4, 2.8]) stroke(ctx, a, [[x + dx, 106], [x + dx * 1.3, 111], [x + dx, 116]], far ? BREECH[3] : BREECH[2], 0.6);
  ctx.restore();
  // the gathered cuff, a gold band
  smoothPath(ctx, [[x - 5.4, 115.4], [x + 5.4, 115.4], [x + 5, 118.6], [x - 5, 118.6]]);
  ctx.fillStyle = tone(a, far ? GOLD[2] : GOLD[1]);
  ctx.fill();
}
// White tights (shin frame), a soft shade down the back.
export function tights(ctx, a, mode, k) {
  if (mode !== 'fill') return;
  const x = k === 'F' ? 73 : 87;
  const far = k === 'F';
  smoothPath(ctx, [[x - 3.9, 121], [x + 3.9, 121], [x + 3.6, 139], [x - 3.6, 139]]);
  ctx.fillStyle = tone(a, far ? TIGHTS[2] : TIGHTS[0]);
  ctx.fill();
  glow(ctx, x - 3, 131, 3, TIGHTS[2], far ? 0.3 : 0.7);
}
// Crystal slippers (foot frame): rounded, the toe curling up to a little gem.
export function slipper(ctx, a, mode, k) {
  const x = k === 'F' ? 73 : 87;
  const far = k === 'F';
  const pts = [[x - 5, 134.6], [x + 3, 134.8], [x + 8.4, 138.4], [x + 11.6, 137.6], [x + 12.6, 140.6], [x + 9.4, 145.6], [x - 5, 146.6], [x - 6, 141]];
  smoothPath(ctx, pts);
  paint(ctx, a, mode, far ? SLIPPER[2] : SLIPPER[1], SLIPPER_INK, 2.4);
  if (mode !== 'fill') return;
  ctx.save();
  smoothPath(ctx, pts);
  ctx.clip();
  glow(ctx, x + 1, 138, 5, far ? SLIPPER[1] : SLIPPER[0], 0.9);
  ctx.fillStyle = tone(a, far ? SLIPPER[3] : SLIPPER[2]);
  ctx.fillRect(x - 8, 144.8, 22, 3);
  ctx.restore();
  ell(ctx, x + 11.4, 137.4, 1.4, 1.3);
  ctx.fillStyle = tone(a, PRISM[2][2]);
  ctx.fill();
  ell(ctx, x + 11, 137, 0.5, 0.5);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}
// A sleeve along an arm bone (p0 to p1, game px): a puff at the shoulder, fitted below, a lace cuff.
export function sleeve(ctx, a, mode, p0, p1, w0, w1, col, ink, cuff) {
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L;
  const ny = dx / L;
  ctx.beginPath();
  ctx.moveTo(p0[0] + nx * w0 * 0.5 * SC, p0[1] + ny * w0 * 0.5 * SC);
  ctx.lineTo(p1[0] + nx * w1 * 0.5 * SC, p1[1] + ny * w1 * 0.5 * SC);
  ctx.arc(p1[0], p1[1], w1 * 0.5 * SC, Math.atan2(ny, nx), Math.atan2(-ny, -nx), true);
  ctx.lineTo(p0[0] - nx * w0 * 0.5 * SC, p0[1] - ny * w0 * 0.5 * SC);
  ctx.arc(p0[0], p0[1], w0 * 0.5 * SC, Math.atan2(-ny, -nx), Math.atan2(ny, nx), true);
  ctx.closePath();
  if (mode === 'line') return paint(ctx, a, 'line', null, ink, 0.75);
  ctx.fillStyle = tone(a, col);
  ctx.fill();
  if (cuff) {
    const cx = p1[0] - (dx / L) * 0.5;
    const cy = p1[1] - (dy / L) * 0.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w1 * 0.62 * SC, w1 * 0.32 * SC, Math.atan2(dy, dx) + Math.PI / 2, 0, TAU);
    ctx.fillStyle = tone(a, '#ffffff');
    ctx.fill();
    ctx.strokeStyle = tone(a, DOUBLET[2]);
    ctx.lineWidth = 0.25;
    ctx.stroke();
  }
}
// The ermine capelet over his shoulders (chest frame): soft white fur, a scalloped hem, a few
// lavender tail-tips, a gold clasp with a prism at his throat.
export const CAPELET = [[63.4, 87], [70, 83.2], [80.4, 84.6], [91, 83.2], [97.6, 87], [99, 92.2], [95.6, 94.6], [91, 93.4], [86.4, 95.6], [80.6, 94.2], [74.8, 95.6], [70, 93.4], [65.4, 94.6], [62, 92.2]];
export function capelet(ctx, a, mode, field) {
  smoothPath(ctx, CAPELET);
  paint(ctx, a, mode, ERMINE[1], ERMINE_INK, 2.4);
  if (mode !== 'fill') return;
  ctx.save();
  smoothPath(ctx, CAPELET);
  ctx.clip();
  glow(ctx, 66, 93, 7, ERMINE[2], 0.8);
  glow(ctx, 88, 86, 8, ERMINE[0], 0.9);
  ctx.restore();
  for (const [x, y] of [[69, 90.6], [76.6, 92], [86, 92.2], [93, 90.4]]) {
    smoothPath(ctx, [[x - 0.6, y - 1.6], [x + 0.6, y - 1.6], [x + 0.8, y + 0.6], [x, y + 1.8], [x - 0.8, y + 0.6]]);
    ctx.fillStyle = tone(a, ERMINE_SPOT, 0.55);
    ctx.fill();
  }
  // the clasp
  ell(ctx, 80.6, 87.6, 2.6, 2.4);
  ctx.fillStyle = tone(a, GOLD[1]);
  ctx.fill();
  ell(ctx, 80.6, 87.6, 1.6, 1.5);
  ctx.fillStyle = tone(a, field ? PRISM[1][1] : PRISM[2][1]);
  ctx.fill();
  ell(ctx, 80.2, 87.1, 0.6, 0.5);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}
// The cape (behind him): its yoke across his shoulders (chest frame) and each half down to the floor
// (each half in its own sprung frame, about its shoulder): amethyst velvet outside, the crystal lining
// seen where it turns.
export const CAPE_ROOT = { F: [68, 87], N: [93, 87] };
export function capeHalf(ctx, a, mode, k) {
  const [rx, ry] = CAPE_ROOT[k];
  const s = k === 'F' ? -1 : 1;
  const pts = [[rx - 4 * s, ry - 2], [rx + 6 * s, ry - 1.6], [rx + 10.4 * s, ry + 20], [rx + 17 * s, ry + 48], [rx + 16 * s, ry + 58.4], [rx + 1 * s, ry + 59.6], [rx - 12 * s, ry + 58.6], [rx - 13 * s, ry + 30], [rx - 10 * s, ry + 6]];
  smoothPath(ctx, pts);
  paint(ctx, a, mode, k === 'F' ? VELVET[2] : VELVET[1], VELVET_INK, 2.6);
  if (mode !== 'fill') return;
  ctx.save();
  smoothPath(ctx, pts);
  ctx.clip();
  // the lining turning out along its outer edge, crystal-pale with a soft sparkle
  const lx = rx + 13 * s;
  const g = ctx.createLinearGradient(lx - 5 * s, 0, lx + 4 * s, 0);
  g.addColorStop(0, rgba(LINING[2], 0));
  g.addColorStop(1, rgba(LINING[1], 0.95));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(rx + 7.6 * s, ry + 8);
  ctx.quadraticCurveTo(rx + 13 * s, ry + 34, rx + 16 * s, ry + 57);
  ctx.lineTo(rx + 20 * s, ry + 57);
  ctx.lineTo(rx + 20 * s, ry + 8);
  ctx.closePath();
  ctx.fill();
  glow(ctx, rx - 2 * s, ry + 16, 10, VELVET[0], 0.35);
  glow(ctx, rx - 6 * s, ry + 52, 12, VELVET[3], 0.5);
  // a gold hem
  ctx.fillStyle = tone(a, GOLD[1]);
  ctx.fillRect(rx - 20, ry + 56.4, 40, 3.4);
  ctx.restore();
  // soft crystal sparkles on the lining
  for (const [dy, r] of [[20, 1.1], [38, 0.9]]) {
    const px = rx + (dy > 30 ? 14.4 : 11.4) * s;
    ctx.fillStyle = tone(a, '#ffffff', 0.9);
    ctx.beginPath();
    ctx.moveTo(px, ry + dy - r * 2);
    ctx.quadraticCurveTo(px + r * 0.3, ry + dy - r * 0.3, px + r * 1.6, ry + dy);
    ctx.quadraticCurveTo(px + r * 0.3, ry + dy + r * 0.3, px, ry + dy + r * 2);
    ctx.quadraticCurveTo(px - r * 0.3, ry + dy + r * 0.3, px - r * 1.6, ry + dy);
    ctx.quadraticCurveTo(px - r * 0.3, ry + dy - r * 0.3, px, ry + dy - r * 2);
    ctx.fill();
  }
}
export function capeYoke(ctx, a, mode) {
  const pts = [[63, 87.4], [80.4, 84.2], [98, 87.4], [100, 96], [80.4, 99], [61, 96]];
  smoothPath(ctx, pts);
  paint(ctx, a, mode, VELVET[2], VELVET_INK, 2.6);
}

// ---------- Shared bits of his effects (rig and cast looks) ----------
// A small rounded crystal (a prism with a soft round tip), tinted `c` (PRISM index).
export function shard(ctx, x, y, s, ang, c, al = 1) {
  if (al <= 0.01 || s <= 0.05) return;
  const [lt, base, dk] = PRISM[c % PRISM.length];
  ctx.save();
  ctx.globalAlpha *= clamp(al, 0, 1);
  ctx.translate(x, y);
  ctx.rotate(ang);
  const pts = [[-s * 0.5, 0], [-s * 0.5, -s * 1.1], [0, -s * 1.8], [s * 0.5, -s * 1.1], [s * 0.5, 0]];
  smoothPath(ctx, pts);
  ctx.strokeStyle = dk;
  ctx.lineWidth = Math.max(0.35, s * 0.22);
  ctx.stroke();
  const g = ctx.createLinearGradient(-s * 0.5, 0, s * 0.5, 0);
  g.addColorStop(0, lt);
  g.addColorStop(0.5, base);
  g.addColorStop(0.52, dk);
  g.addColorStop(1, base);
  ctx.fillStyle = g;
  ctx.fill();
  ell(ctx, -s * 0.18, -s * 1.2, s * 0.14, s * 0.3);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();
  ctx.restore();
}
// A soft fan of rainbow light from (x, y) along `ang`, `len` long, `spread` wide at its end.
export function rainbowFan(ctx, x, y, ang, len, spread, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  RAINBOW.forEach((col, i) => {
    const a0 = ((i - 2.5) / 6) * spread;
    const a1 = ((i - 1.5) / 6) * spread;
    const g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, rgba(col, 0));
    g.addColorStop(0.25, rgba(col, 0.55 * al));
    g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len, a0);
    ctx.lineTo(len, a1);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
}
