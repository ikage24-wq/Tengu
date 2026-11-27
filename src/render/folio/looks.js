// Folio, the Archivist's cast looks (2026-11-27, her new fight, world/observatory.js): each telegraph drawn
// whole in her own soft style (no plain floor marker under it: they are on render/bossfx.js OWN_WARN),
// while its cast winds up (`warn`, p 0..1 through the warning), and in place of the plain flash as it lands
// (`hit`, u 0..1 over its hold, e eased, fade). Her colours: the midnight indigo of her coat-dress, cream
// paper, the teal Great Catalogue, the tower's brass, and starlight ink; every shape rounded, outlined in a
// deeper shade of its own colour, eased. render/dreamfx.js hands each zone with one of these looks to
// them. (x, y) is the zone's spot on the 640 x 360 screen (a band's left end).
//   foHardback  Hardback (the tank's marker): the Great Catalogue hanging open over them, flapping its
//               covers, its shadow on the floor; landing, it slams shut onto them: THUD, pages everywhere
//   foShelf     Toppling Stacks (one bookcase): a tall bookcase rising out of the floor over its band,
//               wobbling more and more, leaning toward the nook; landing, it topples flat in a spill of
//               books and dust
//   foNook      (the gap in the stacks: no hit) a round rug, a little reading lamp glowing, a sign: "Reading
//               Nook"
//   foRiffle    Riffle (everyone): a ring of loose pages whirling up under the ceiling round the open book;
//               landing, the gust sweeps across the whole hall
//   foNoted     Noted (each of you, where you stand): a ring of starlight ink written round you, a quill
//               nib scribbling, a little index card over it; landing, the ink splashes up from it
//   foTop       Top Shelf (the whole hall, high up: keep your feet on the floor): books flapping their covers
//               like birds, gathering along the top shelves from both walls; landing, they swoop across
//   foBottom    Bottom Shelf (the whole floor: jump!): books sliding in along the floor from both walls,
//               the boards glinting; landing, they skid across the floor in a stream
import { TAU, clamp, sstep, ell, pen, glow, sparkle, hash, dust } from './fx.js';
import { drawBook, rounded, star5 } from './dress.js';
import { INDIGO, CREAM, GOLD, INK } from './palette.js';

const SW = 640;
const rgba = (hex, al) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(al, 0, 1)})`;
};
function floorRing(ctx, x, y, r, fill, rim, al, w = 1.6) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 0.22);
  ctx.fillStyle = fill;
  ctx.fill();
  pen(ctx, rim, w);
  ctx.stroke();
  ctx.restore();
}
function word(ctx, text, x, y, size, al, col = INDIGO.ink) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.font = `900 ${size}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#fffaf0';
  ctx.lineWidth = size * 0.36;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = col;
  ctx.fillText(text, x, y);
  ctx.restore();
}
function page(ctx, x, y, s, rot, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  rounded(ctx, [[-s * 0.75, -s], [s * 0.75, -s], [s * 0.75, s], [-s * 0.75, s]], s * 0.25);
  ctx.fillStyle = CREAM.base;
  ctx.fill();
  pen(ctx, CREAM.ink, Math.max(0.5, s * 0.12));
  ctx.stroke();
  pen(ctx, INK.base, Math.max(0.4, s * 0.1));
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.45, -s * 0.5 + i * s * 0.45);
    ctx.lineTo(s * (0.45 - (i === 2 ? 0.3 : 0)), -s * 0.5 + i * s * 0.45);
    ctx.stroke();
  }
  ctx.restore();
}
// A little book, shut, its covers flapping open by `fl` (0..1) like wings: for the flying ones.
const SPINES = ['#e8607a', '#5aa0c8', '#f2b84a', '#7a6ac8', '#5cb88a', '#d8803a'];
function flyBook(ctx, x, y, s, fl, i, al = 1, rot = 0) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  const c = SPINES[i % SPINES.length];
  for (const side of [-1, 1]) {
    const an = side * (0.25 + fl * 1.0);
    ctx.save();
    ctx.rotate(-an);
    rounded(ctx, [[0, -s * 0.15], [side * s * 1.1, -s * 0.15], [side * s * 1.1, s * 1.4], [0, s * 1.4]].map(([px, py]) => [px, py - s * 1.4]), s * 0.3);
    ctx.fillStyle = c;
    ctx.fill();
    pen(ctx, rgba('#3a2a4a', 0.55), Math.max(0.5, s * 0.14));
    ctx.stroke();
    ctx.restore();
  }
  // (the pages between the covers)
  ell(ctx, 0, -s * 0.7, s * 0.45, s * 0.75);
  ctx.fillStyle = CREAM.base;
  ctx.fill();
  ctx.restore();
}
function inkSplash(ctx, x, y, r, e, fade) {
  if (fade <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= fade;
  glow(ctx, x, y - r * 0.4, r * (1.4 + e), INK.glow, 0.5);
  for (let i = 0; i < 9; i++) {
    const an = -Math.PI + (i / 8) * Math.PI;
    const d = r * (0.3 + e * 0.9) * (0.7 + hash(i) * 0.5);
    const px = x + Math.cos(an) * d;
    const py = y - 4 + Math.sin(an) * d * 0.9 + e * e * 10;
    ell(ctx, px, py, 2.4 * (1 - e * 0.5), 2.4 * (1 - e * 0.5));
    ctx.fillStyle = INK.base;
    ctx.fill();
    ell(ctx, px - 0.7, py - 0.7, 0.8, 0.6);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  ell(ctx, x, y - 1, r * 0.8 * (1 + e * 0.4), r * 0.2);
  ctx.fillStyle = rgba(INK.base, 0.6);
  ctx.fill();
  ctx.restore();
}

// ---------- Hardback ----------
function hardbackWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r * (0.7 + 0.3 * sstep(p)), rgba(INDIGO.lt, 0.15 + 0.2 * p), rgba(INDIGO.base, 0.9), 1, 1.8);
  // its shadow on the floor, growing as it comes lower
  ell(ctx, x, y, r * 0.5 + 10 * p, 3 + 2 * p);
  ctx.fillStyle = rgba(INDIGO.deep, 0.18 + 0.2 * p);
  ctx.fill();
  const hy = y - 92 + sstep(p) * 30 + Math.sin(time * 2.4) * 3;
  const open = p < 0.82 ? 0.75 + Math.sin(time * 5) * 0.2 : 0.75 * (1 - (p - 0.82) / 0.18);
  drawBook(ctx, null, 'line', x, hy, Math.sin(time * 1.6) * 0.08, open, 0, 2.2, 2);
  drawBook(ctx, null, 'fill', x, hy, Math.sin(time * 1.6) * 0.08, open, 0, 2.2, 2);
  if (p > 0.6) for (let i = 0; i < 3; i++) sparkle(ctx, x - 20 + i * 20, hy - 30 - Math.sin(time * 4 + i) * 3, 2.2 * (p - 0.6) * 2.5, 1, GOLD.lt);
}
function hardbackHit(ctx, z, x, y, u, e, fade) {
  const k = sstep(u / 0.12);
  drawBook(ctx, null, 'line', x, y - 62 + k * 46, 0, 0, 0, 2.2, 2);
  drawBook(ctx, null, 'fill', x, y - 62 + k * 46, 0, 0, 0, 2.2, 2);
  for (let i = 0; i < 8; i++) {
    const an = -Math.PI + (i / 7) * Math.PI;
    page(ctx, x + Math.cos(an) * e * 46, y - 14 + Math.sin(an) * e * 34 + e * e * 18, 4.2, an + e * 4, fade);
  }
  for (let i = 0; i < 5; i++) dust(ctx, x - 30 + i * 15, y - 2 - e * 6, 5 + e * 5, fade * 0.8, '#ffffff', '#e2dcef');
  word(ctx, 'THUD!', x, y - 92 - e * 8, 15, fade);
}

// ---------- Toppling Stacks ----------
// One bookcase over its band: rising, wobbling, leaning toward the nook (z.dir), then toppling flat.
function bookcase(ctx, x0, y, w, h, al, rot, pivotX, books = true, seed = 0) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(pivotX, y);
  ctx.rotate(rot);
  ctx.translate(-pivotX, -y);
  const x1 = x0 + w;
  rounded(ctx, [[x0 + 3, y - h], [x1 - 3, y - h], [x1 - 3, y], [x0 + 3, y]], 4);
  ctx.fillStyle = '#9a6a48';
  ctx.fill();
  pen(ctx, '#6e4a32', 1.8);
  ctx.stroke();
  // (its shelves, each with a row of books, a brass star on its crown)
  const n = 4;
  for (let i = 0; i < n; i++) {
    const sy = y - h + 8 + i * ((h - 12) / n);
    const sh = (h - 12) / n - 5;
    rounded(ctx, [[x0 + 8, sy], [x1 - 8, sy], [x1 - 8, sy + sh], [x0 + 8, sy + sh]], 2);
    ctx.fillStyle = '#5a3a2a';
    ctx.fill();
    if (books) {
      let bx = x0 + 9;
      let k = 0;
      while (bx < x1 - 12) {
        const bw = 4 + hash(seed + i * 11 + k) * 4;
        const bh = sh - 1 - hash(seed + k * 7 + i) * 5;
        rounded(ctx, [[bx, sy + sh - bh], [bx + bw, sy + sh - bh], [bx + bw, sy + sh], [bx, sy + sh]], 1);
        ctx.fillStyle = SPINES[(i + k + seed) % SPINES.length];
        ctx.fill();
        bx += bw + 0.8;
        k++;
      }
    }
  }
  star5(ctx, (x0 + x1) / 2, y - h - 2, 4, GOLD.base, GOLD.ink, 0.8);
  ctx.restore();
}
function shelfWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  const rise = sstep(p / 0.35);
  const h = 104 * rise;
  const d = z.dir ?? 1;
  const wob = Math.sin(time * (6 + p * 10) + (z.seed ?? 0)) * 0.03 * p * p;
  const lean = d * (0.02 + 0.1 * sstep((p - 0.7) / 0.3)) + wob;
  ctx.save();
  ctx.globalAlpha = 0.2 + 0.16 * p;
  ctx.fillStyle = INDIGO.lt;
  ctx.fillRect(x, y - 8, w, 12);
  ctx.restore();
  bookcase(ctx, x, y, w, h, 0.35 + 0.6 * rise, lean, d > 0 ? x + w : x, true, z.seed ?? 0);
  if (p > 0.85) word(ctx, '!', x + w / 2, y - h - 18, 13, (p - 0.85) / 0.15);
}
function shelfHit(ctx, z, x, y, u, e, fade) {
  const w = z.w;
  const d = z.dir ?? 1;
  const fall = sstep(u / 0.25);
  bookcase(ctx, x, y, w, 104, fade, d * (0.12 + fall * (Math.PI / 2 - 0.12)) * 0.98, d > 0 ? x + w : x, false, z.seed ?? 0);
  for (let i = 0; i < 6; i++) {
    const bx = x + w * (i / 5) + d * e * 30;
    flyBook(ctx, bx, y - 4 - Math.abs(Math.sin(e * 6 + i)) * 16 * (1 - e), 4, 0.4 + 0.4 * Math.sin(e * 9 + i), i + (z.seed ?? 0), fade, e * 3 * d + i);
  }
  for (let i = 0; i < 4; i++) dust(ctx, x + w * (i / 3), y - 3 - e * 8, 5 + e * 6, fade * 0.8, '#ffffff', '#e2dcef');
}
// The nook: where the stacks leave a gap.
function nookWarn(ctx, z, x, y, p, time) {
  const r = (z.w ?? 120) / 2;
  const al = sstep(p / 0.2) * (1 - sstep((p - 0.97) / 0.03));
  floorRing(ctx, x, y, r * 0.8, rgba('#f2b84a', 0.3), rgba('#d8803a', 0.9), al, 1.6);
  ctx.save();
  ctx.globalAlpha *= al;
  // the rug's pattern, a little lamp at its edge, its warm glow
  ell(ctx, x, y, r * 0.55, r * 0.1);
  pen(ctx, rgba('#fff4c4', 0.8), 1.2);
  ctx.stroke();
  const lx = x + r * 0.62;
  glow(ctx, lx, y - 30, 34, '#ffd88a', 0.35 + 0.08 * Math.sin(time * 3));
  pen(ctx, GOLD.ink, 1.6);
  ctx.beginPath();
  ctx.moveTo(lx, y - 1);
  ctx.lineTo(lx, y - 28);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(lx - 7, y - 26);
  ctx.quadraticCurveTo(lx, y - 40, lx + 7, y - 26);
  ctx.closePath();
  ctx.fillStyle = '#f6d58a';
  ctx.fill();
  pen(ctx, GOLD.ink, 1);
  ctx.stroke();
  ctx.restore();
  word(ctx, 'Reading Nook', x, y - 60 - Math.sin(time * 2) * 2, 10, al, '#a8623a');
  sparkle(ctx, x - r * 0.4, y - 40 + Math.sin(time * 2.6) * 4, 2.2, al, '#fff4c4');
}

// ---------- Riffle ----------
function riffleWarn(ctx, z, x, y, p, time) {
  const cx = SW / 2;
  const cy = 70;
  const k = sstep(p / 0.4);
  glow(ctx, cx, cy, 90 + 40 * p, INK.glow, 0.15 + 0.2 * p);
  drawBook(ctx, null, 'line', cx, cy, 0, 1, (time * 1.8) % 1, 2.6 * k + 0.01, 2);
  drawBook(ctx, null, 'fill', cx, cy, 0, 1, (time * 1.8) % 1, 2.6 * k + 0.01, 2);
  const n = 18;
  for (let i = 0; i < n; i++) {
    const an = time * (1.2 + p) + (i / n) * TAU;
    const rr = 70 + 140 * k + Math.sin(i * 3 + time) * 10;
    page(ctx, cx + Math.cos(an) * rr, cy + 20 + Math.sin(an) * rr * 0.22, 4.4, an * 2, k * (0.5 + 0.5 * Math.sin(an)));
  }
  word(ctx, 'fwip fwip fwip', cx, cy + 58, 11, k * (0.5 + 0.5 * Math.sin(time * 6)));
}
function riffleHit(ctx, z, x, y, u, e, fade) {
  const front = -40 + e * (SW + 80);
  for (let i = 0; i < 26; i++) {
    const px = front - hash(i) * 160;
    const py = 40 + hash(i * 2.3) * (y - 60);
    page(ctx, px, py + Math.sin(e * 8 + i) * 8, 4.2, e * 8 + i, fade * (px > -10 && px < SW + 10 ? 1 : 0));
  }
  ctx.save();
  ctx.globalAlpha = 0.25 * fade;
  pen(ctx, '#ffffff', 3);
  for (let i = 0; i < 5; i++) {
    const py = 60 + i * 50;
    ctx.beginPath();
    ctx.moveTo(front - 140, py);
    ctx.quadraticCurveTo(front - 60, py - 14, front, py);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- Noted ----------
function notedWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, rgba(INK.glow, 0.15 + 0.2 * p), rgba(INK.deep, 0.5), 1, 1);
  // the ring of ink written round, a nib leading it
  const a1 = -Math.PI / 2 + TAU * sstep(p / 0.7);
  ctx.save();
  pen(ctx, INK.base, 2.4);
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.22, 0, -Math.PI / 2, a1);
  ctx.stroke();
  ctx.restore();
  const nx = x + Math.cos(a1) * r;
  const ny = y + Math.sin(a1) * r * 0.22;
  if (p < 0.72) {
    pen(ctx, GOLD.ink, 1.4);
    ctx.beginPath();
    ctx.moveTo(nx, ny);
    ctx.lineTo(nx - 4, ny - 9);
    ctx.lineTo(nx + 2, ny - 10);
    ctx.closePath();
    ctx.fillStyle = GOLD.base;
    ctx.fill();
    ctx.stroke();
  }
  // a little index card over it
  const cy = y - 50 - Math.sin(time * 2.2 + x * 0.05) * 3;
  ctx.save();
  ctx.globalAlpha = sstep(p / 0.3);
  rounded(ctx, [[x - 14, cy - 9], [x + 14, cy - 9], [x + 14, cy + 9], [x - 14, cy + 9]], 3);
  ctx.fillStyle = CREAM.base;
  ctx.fill();
  pen(ctx, CREAM.ink, 1.2);
  ctx.stroke();
  ctx.fillStyle = INDIGO.base;
  ctx.fillRect(x - 13, cy - 8, 26, 3.5);
  pen(ctx, INK.base, 1);
  const lines = Math.floor(p * 6);
  for (let i = 0; i < Math.min(3, lines); i++) {
    ctx.beginPath();
    ctx.moveTo(x - 10, cy - 1 + i * 3.4);
    ctx.lineTo(x + 10 - (i === 2 ? 8 : 0), cy - 1 + i * 3.4);
    ctx.stroke();
  }
  ctx.restore();
  if (p > 0.75) sparkle(ctx, x + 10, cy - 10, 2.6, (p - 0.75) * 4, INK.lt);
}
function notedHit(ctx, z, x, y, u, e, fade) {
  inkSplash(ctx, x, y, z.w / 2, e, fade);
  word(ctx, 'Filed.', x, y - 54 - e * 10, 11, fade, INK.deep);
}

// ---------- Top Shelf / Bottom Shelf ----------
function topWarn(ctx, z, x, y, p, time) {
  const hy = y - 76;
  ctx.save();
  ctx.globalAlpha = 0.18 + 0.14 * p;
  ctx.fillStyle = INK.glow;
  ctx.fillRect(0, hy - 30, SW, 56);
  ctx.restore();
  const n = 14;
  for (let i = 0; i < n; i++) {
    const fromL = i % 2 === 0;
    const come = sstep(p * 1.4 - (i >> 1) / n);
    const home = ((i + 0.5) / n) * SW;
    const bx = fromL ? -30 + (home + 30) * come : SW + 30 - (SW + 30 - home) * come;
    flyBook(ctx, bx, hy + Math.sin(time * 5 + i) * 6, 5, 0.5 + 0.5 * Math.sin(time * 10 + i), i, come);
  }
  word(ctx, 'feet on the floor!', SW / 2, y - 132, 11, sstep(p / 0.3) * (0.6 + 0.4 * Math.sin(time * 5)));
}
function topHit(ctx, z, x, y, u, e, fade) {
  const hy = y - 76;
  for (let i = 0; i < 14; i++) {
    const d = i % 2 ? -1 : 1;
    const bx = ((i + 0.5) / 14) * SW + d * e * 260;
    flyBook(ctx, bx, hy + Math.sin(e * 10 + i) * 8, 5, Math.abs(Math.sin(e * 16 + i)), i, fade, d * 0.3);
  }
  ctx.save();
  ctx.globalAlpha = 0.35 * fade;
  pen(ctx, '#ffffff', 2.4);
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(0, hy - 20 + i * 14);
    ctx.lineTo(SW, hy - 20 + i * 14);
    ctx.stroke();
  }
  ctx.restore();
}
function bottomWarn(ctx, z, x, y, p, time) {
  ctx.save();
  ctx.globalAlpha = 0.18 + 0.2 * p;
  ctx.fillStyle = '#f2b84a';
  ctx.fillRect(0, y - 6, SW, 10);
  ctx.restore();
  // the boards glinting along the floor
  for (let i = 0; i < 8; i++) {
    const v = (time * 0.7 + i / 8) % 1;
    sparkle(ctx, v * SW, y - 3, 2.2 * Math.sin(Math.PI * v), 0.9, '#fff4c4');
  }
  // books sliding in from both walls along the floor, piling up at the edges
  for (let i = 0; i < 12; i++) {
    const fromL = i % 2 === 0;
    const come = sstep(p * 1.3 - (i >> 1) / 14);
    const bx = fromL ? -40 + 30 * come + (i >> 1) * 9 * come : SW + 40 - 30 * come - (i >> 1) * 9 * come;
    ctx.save();
    ctx.globalAlpha = come;
    rounded(ctx, [[bx - 8, y - 6], [bx + 8, y - 6], [bx + 8, y], [bx - 8, y]], 1.5);
    ctx.fillStyle = SPINES[i % SPINES.length];
    ctx.fill();
    pen(ctx, rgba('#3a2a4a', 0.5), 1);
    ctx.stroke();
    ctx.restore();
  }
  word(ctx, 'JUMP!', SW / 2, y - 40, 14, sstep((p - 0.55) / 0.2) * (0.7 + 0.3 * Math.sin(time * 9)));
}
function bottomHit(ctx, z, x, y, u, e, fade) {
  for (let i = 0; i < 16; i++) {
    const d = i % 2 ? -1 : 1;
    const bx = (d > 0 ? -30 : SW + 30) + d * e * (SW + 60) - d * (i >> 1) * 22;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(bx, y - 3);
    ctx.rotate(Math.sin(e * 12 + i) * 0.2);
    rounded(ctx, [[-8, -3], [8, -3], [8, 3], [-8, 3]], 1.5);
    ctx.fillStyle = SPINES[i % SPINES.length];
    ctx.fill();
    pen(ctx, rgba('#3a2a4a', 0.5), 1);
    ctx.stroke();
    ctx.restore();
  }
  for (let i = 0; i < 8; i++) dust(ctx, (i / 7) * SW, y - 2 - e * 6, 4 + e * 4, fade * 0.6, '#ffffff', '#e2dcef');
}

export const FOLIO_FX = {
  foHardback: { warn: hardbackWarn, hit: hardbackHit },
  foShelf: { warn: shelfWarn, hit: shelfHit },
  foNook: { warn: nookWarn, hit: () => {} },
  foRiffle: { warn: riffleWarn, hit: riffleHit },
  foNoted: { warn: notedWarn, hit: notedHit },
  foTop: { warn: topWarn, hit: topHit },
  foBottom: { warn: bottomWarn, hit: bottomHit },
};
// How long each landing plays (s).
export const FOLIO_HOLD = { foHardback: 0.9, foShelf: 0.8, foNook: 0.1, foRiffle: 1.1, foNoted: 0.7, foTop: 0.8, foBottom: 0.9 };
// (they draw their own floor markers: render/bossfx.js leaves out the plain one under them)
export const FOLIO_OWN_WARN = Object.keys(FOLIO_FX);
