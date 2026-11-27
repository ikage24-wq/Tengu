// Queen Coralie's cast looks (2026-11-26, her new fight, world/aquarium.js): each telegraph drawn whole in
// her own soft style (no plain floor marker under it: they are on render/bossfx.js OWN_WARN), while its
// cast winds up (`warn`, p 0..1 through the warning), and in place of the plain flash as it lands
// (`hit`, u 0..1 over its hold, e eased, fade). Her colours: the coral and pearl of her livery, clear
// glass, sea water, the gold of her crown; every shape rounded, outlined in a deeper shade of its own
// colour, eased. render/dreamfx.js hands each zone with one of these looks to them. (x, y) is the zone's
// spot on the 640 x 360 screen (a band's left end).
//   crDecree    Royal Decree (the tank's marker): a big coral wax seal with her crown pressed in it,
//               swinging down over them on a ribbon; landing, it stamps: "KEPT!", pearls bouncing out
//   crCases     Display Cases (the whole sequence, shown as the cast goes): a faint glass case standing
//               on the floor where each will come down, a pearl badge with its number on it, the next one
//               glowing; each fades as it comes down
//   crCase      one case coming down (its own short warning): the glass case lowering from above onto its
//               spot, its number on it; landing, it slams shut in a ring of bubbles and a glint
//   crStrand    Strand of Pearls (the floor in front of her): a string of big pearls laid out along it,
//               rocking; landing, they roll away along it with bubbles
//   crWave      Royal Wave (everyone): a soft wave of sea water rising along the back of the room, its
//               crest curling, foam bubbles; landing, it rolls across in a splash
//   crPortrait  Royal Portrait (a frame round her: get in): a gilded picture frame standing round her on
//               the floor, three pearls counting down on its top; landing, a white flash inside it and
//               sparkles
//   crWalls     Glass Walls (from a wall: its band): a pane of glass with sea water behind it sliding in
//               from the wall; landing, it slams to in bubbles, then slides back
//   crWallsHigh (the same walls up on the stands: drawn by crWalls)
import { TAU, clamp, sstep, ell, pen, glow, sparkle, hash } from './fx.js';
import { CORAL, PEARL, GOLD, WATER } from './palette.js';

const SW = 640;
const SH = 360;
const rgba = (hex, al) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(al, 0, 1)})`;
};
function bubble(ctx, x, y, r, al = 1) {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.fillStyle = 'rgba(230,250,255,0.35)';
  ctx.fill();
  pen(ctx, WATER.sh, Math.max(0.5, r * 0.18));
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.62, Math.PI * 1.1, Math.PI * 1.5);
  pen(ctx, 'rgba(255,255,255,0.9)', Math.max(0.4, r * 0.2));
  ctx.stroke();
  ctx.restore();
}
function pearl(ctx, x, y, r, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.fillStyle = PEARL.base;
  ctx.fill();
  pen(ctx, PEARL.ink, Math.max(0.6, r * 0.16));
  ctx.stroke();
  glow(ctx, x + r * 0.2, y + r * 0.3, r * 0.9, '#ffd8e8', 0.45);
  ell(ctx, x - r * 0.35, y - r * 0.35, r * 0.3, r * 0.22);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
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
function word(ctx, text, x, y, size, al, col = CORAL.ink) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.font = `900 ${size}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#fff8fa';
  ctx.lineWidth = size * 0.38;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = col;
  ctx.fillText(text, x, y);
  ctx.restore();
}
// A glass display case: sheer glass, a gold rim top and bottom, two shine streaks down one side.
function glassCase(ctx, x, yBottom, w, h, al, glowK = 0) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  const top = yBottom - h;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, top, w, h, 4);
  ctx.fillStyle = `rgba(214,246,255,${0.14 + 0.12 * glowK})`;
  ctx.fill();
  pen(ctx, rgba(WATER.ink, 0.85), 1.4);
  ctx.stroke();
  pen(ctx, 'rgba(255,255,255,0.85)', 1.6);
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 5, top + 6);
  ctx.lineTo(x + w / 2 - 5, top + h * 0.5);
  ctx.moveTo(x + w / 2 - 9, top + 10);
  ctx.lineTo(x + w / 2 - 9, top + h * 0.3);
  ctx.stroke();
  ctx.fillStyle = GOLD.base;
  ctx.beginPath();
  ctx.roundRect(x - w / 2 - 2, top - 3, w + 4, 4, 2);
  ctx.roundRect(x - w / 2 - 2, yBottom - 2, w + 4, 4, 2);
  ctx.fill();
  pen(ctx, GOLD.ink, 0.7);
  ctx.stroke();
  ctx.restore();
}
// A pearl badge with a number on it.
function badge(ctx, x, y, n, al, lit) {
  if (al <= 0.01) return;
  if (lit > 0.01) glow(ctx, x, y, 14, '#fff4c8', 0.6 * lit * al);
  pearl(ctx, x, y, 6.4 + lit * 1.4, al);
  word(ctx, String(n), x, y + 0.4, 9 + lit * 2, al, CORAL.deep);
}

// ---------- Royal Decree ----------
function seal(ctx, x, y, s, al, rot = 0) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const an = (i / 12) * TAU;
    const r = i % 2 ? 9 : 10.4;
    ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r);
  }
  ctx.closePath();
  ctx.fillStyle = CORAL.base;
  ctx.fill();
  pen(ctx, CORAL.ink, 1.2);
  ctx.stroke();
  ell(ctx, 0, 0, 6.6, 6.6);
  pen(ctx, CORAL.deep, 1);
  ctx.stroke();
  // her little crown pressed into it: three round-tipped points on a band
  ctx.fillStyle = CORAL.deep;
  ctx.beginPath();
  ctx.moveTo(-4, 2.4);
  ctx.lineTo(-4, -1.4);
  ctx.arc(-3.2, -2, 0.9, Math.PI, 0);
  ctx.lineTo(-1.4, 0);
  ctx.lineTo(0, -2.6);
  ctx.arc(0, -3.2, 0.9, Math.PI, 0);
  ctx.lineTo(1.4, 0);
  ctx.lineTo(2.4, -2);
  ctx.arc(3.2, -2, 0.9, Math.PI, 0);
  ctx.lineTo(4, 2.4);
  ctx.closePath();
  ctx.fill();
  ell(ctx, -3.4, -4, 2.4, 1.4, -0.5);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fill();
  ctx.restore();
}
function decreeWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, rgba(CORAL.lt, 0.2 + 0.18 * p), rgba(CORAL.sh, 0.9), 1, 1.8);
  // the seal swinging down on its ribbon
  const hy = y - 70 + sstep(p) * 24;
  const sw = Math.sin(time * 3) * 0.25 * (1 - p);
  pen(ctx, CORAL.sh, 1.4);
  ctx.beginPath();
  ctx.moveTo(x, hy - 40);
  ctx.quadraticCurveTo(x + sw * 20, hy - 20, x + Math.sin(sw) * 6, hy - 10);
  ctx.stroke();
  seal(ctx, x + Math.sin(sw) * 6, hy, 1.8 + 0.8 * sstep(p), 0.5 + 0.5 * sstep(p / 0.3), sw);
}
function decreeHit(ctx, z, x, y, u, e, fade) {
  const k = sstep(u / 0.15);
  seal(ctx, x, y - 46 + k * 30, 2.8 - k * 0.5, 1 - sstep((u - 0.5) / 0.5));
  for (let i = 0; i < 6; i++) {
    const an = -Math.PI + (i / 5) * Math.PI;
    pearl(ctx, x + Math.cos(an) * e * 34, y - 8 + Math.sin(an) * e * 26 + e * e * 10, 2.6, fade);
  }
  word(ctx, 'KEPT!', x, y - 74 - e * 6, 13, fade);
  floorRing(ctx, x, y, z.w / 2 * (1 + e * 0.3), rgba(CORAL.lt, 0.3 * fade), rgba(CORAL.sh, fade), 1, 1.8);
}

// ---------- Display Cases ----------
function casesWarn(ctx, z, x, y, p, time) {
  const t = p * z.warn;
  const r = z.r ?? 46;
  const list = z.cases ?? [];
  // (the next to come: the one with the least time left that hasn't come down)
  let next = null;
  for (const c of list) {
    const left = (c.off ?? 0) - t;
    if (left > -0.05 && (!next || left < next.left)) next = { c, left };
  }
  for (const c of list) {
    const sx = c.x + x;
    const left = (c.off ?? 0) - t;
    if (left < -0.1) continue;
    const come = c.added ? 1 - sstep((1.1 - left) / 0.6) : 1;
    const lit = next?.c === c ? 0.5 + 0.5 * Math.sin(time * 8) : 0;
    const al = sstep(t / 0.4) * come;
    floorRing(ctx, sx, y, r, rgba(WATER.base, 0.15 + 0.15 * lit), rgba(WATER.ink, 0.7), al, 1.4);
    glassCase(ctx, sx, y, r * 1.5, 58, al * 0.55, lit);
    badge(ctx, sx, y - 72, c.n, al, lit);
  }
}
function caseWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  const drop = sstep(p);
  floorRing(ctx, x, y, r, rgba(WATER.base, 0.25 + 0.2 * p), rgba(WATER.ink, 0.95), 1, 1.8);
  glassCase(ctx, x, y - (1 - drop) * 90, r * 1.5, 58, 0.5 + 0.5 * drop, p);
  badge(ctx, x, y - 72 - (1 - drop) * 90, z.n ?? 1, 1, 1);
  if (p > 0.7) for (let i = 0; i < 3; i++) sparkle(ctx, x - r * 0.6 + i * r * 0.6, y - 8, 1.8 * (p - 0.7) * 3, 1, '#ffffff');
}
function caseHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  glassCase(ctx, x, y, r * 1.5, 58, 1 - sstep((u - 0.4) / 0.6), 1 - u);
  for (let i = 0; i < 12; i++) {
    const an = -Math.PI + (i / 11) * Math.PI;
    bubble(ctx, x + Math.cos(an) * (r * 0.8 + e * 26), y - 6 + Math.sin(an) * (6 + e * 30), 2 + hash(i) * 2, fade);
  }
  sparkle(ctx, x + r * 0.5, y - 46, 4 * fade, fade, '#ffffff');
  floorRing(ctx, x, y, r * (1 + e * 0.25), rgba(WATER.lt, 0.35 * fade), rgba(WATER.ink, fade), 1, 1.8);
}

// ---------- Strand of Pearls ----------
function strandWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  ctx.save();
  ctx.globalAlpha = 0.18 + 0.2 * p;
  ctx.fillStyle = PEARL.sh;
  ctx.fillRect(x, y - 10, w, 14);
  ctx.restore();
  // the string, and the pearls along it rocking, more of them as it comes
  const n = Math.max(3, Math.round(w / 34));
  pen(ctx, rgba(CORAL.sh, 0.8), 1);
  ctx.beginPath();
  ctx.moveTo(x, y - 6);
  ctx.lineTo(x + w, y - 6);
  ctx.stroke();
  for (let i = 0; i < n; i++) {
    const v = sstep(p * 1.6 - (z.dir < 0 ? n - 1 - i : i) / n);
    const px = x + (i + 0.5) * (w / n);
    pearl(ctx, px + Math.sin(time * 4 + i) * 1.2, y - 8, 5.6 * v, v);
  }
}
function strandHit(ctx, z, x, y, u, e, fade) {
  const w = z.w;
  const n = Math.max(3, Math.round(w / 34));
  const d = z.dir ?? 1;
  for (let i = 0; i < n; i++) {
    const px = x + (i + 0.5) * (w / n) + d * e * 40;
    pearl(ctx, px, y - 8 - Math.abs(Math.sin(e * 8 + i)) * 6 * (1 - e), 5.6, fade);
    bubble(ctx, px - d * 8, y - 12 - e * 14, 1.8, fade);
  }
}

// ---------- Royal Wave ----------
function waveWarn(ctx, z, x, y, p, time) {
  // sea water rising along the back of the room, its crest curling
  const hgt = 18 + 60 * sstep(p);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-20, y + 10);
  for (let i = 0; i <= 32; i++) {
    const px = -20 + (i / 32) * (SW + 40);
    ctx.lineTo(px, y - hgt - Math.sin(i * 0.9 + time * 3) * 5 - Math.sin(i * 0.3 - time) * 6);
  }
  ctx.lineTo(SW + 20, y + 10);
  ctx.closePath();
  ctx.globalAlpha = 0.2 + 0.18 * p;
  ctx.fillStyle = WATER.base;
  ctx.fill();
  ctx.globalAlpha = 0.7;
  pen(ctx, '#ffffff', 2);
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 16; i++) {
    const v = (time * 0.5 + hash(i)) % 1;
    bubble(ctx, hash(i * 2.1) * SW, y - hgt * v - 4, 1.6 + hash(i) * 2.2, Math.sin(Math.PI * v) * (0.4 + 0.6 * p));
  }
  for (let i = 0; i < 3; i++) {
    const v = (time * 0.35 + i / 3) % 1;
    word(ctx, 'hello~', 110 + i * 210, y - hgt - 18 - v * 30, 11, Math.sin(Math.PI * v) * (0.3 + 0.7 * p));
  }
}
function waveHit(ctx, z, x, y, u, e, fade, time) {
  // the wave rolls across the room, a curl of foam riding its front
  const front = -40 + e * (SW + 80);
  ctx.save();
  ctx.globalAlpha = 0.35 * fade;
  ctx.fillStyle = WATER.base;
  ctx.beginPath();
  ctx.moveTo(-20, y + 10);
  ctx.lineTo(-20, y - 50);
  ctx.quadraticCurveTo(front - 40, y - 70, front, y - 40);
  ctx.quadraticCurveTo(front + 16, y - 10, front + 6, y + 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  for (let i = 0; i < 10; i++) bubble(ctx, front - 10 + Math.sin(i) * 10, y - 10 - i * 6, 2 + hash(i) * 2, fade);
  ctx.save();
  ctx.globalAlpha = 0.14 * (1 - e);
  ctx.fillStyle = '#e6fbff';
  ctx.fillRect(0, 0, SW, SH);
  ctx.restore();
}

// ---------- Royal Portrait ----------
function frame(ctx, x, y, w, h, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h, w, h, 10);
  ctx.roundRect(x - w / 2 + 6, y - h + 6, w - 12, h - 12, 7);
  ctx.fillStyle = GOLD.base;
  ctx.fill('evenodd');
  pen(ctx, GOLD.ink, 1.2);
  ctx.stroke();
  pen(ctx, GOLD.lt, 1.2);
  ctx.beginPath();
  ctx.roundRect(x - w / 2 + 2.5, y - h + 2.5, w - 5, h - 5, 9);
  ctx.stroke();
  // coral corners
  for (const [cx, cy] of [[x - w / 2 + 3, y - h + 3], [x + w / 2 - 3, y - h + 3]]) {
    ell(ctx, cx, cy, 5, 5);
    ctx.fillStyle = CORAL.base;
    ctx.fill();
    pen(ctx, CORAL.ink, 0.9);
    ctx.stroke();
  }
  ctx.restore();
}
function portraitWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  const h = 128;
  ctx.save();
  ctx.globalAlpha = 0.1 + 0.14 * p;
  ctx.fillStyle = '#ffcf7a';
  ctx.fillRect(x - w / 2, y - h, w, h + 6);
  ctx.restore();
  ctx.save();
  glow(ctx, x, y - h * 0.4, w * 0.55, '#fff0c0', 0.25 + 0.2 * p);
  ctx.restore();
  frame(ctx, x, y + 6, w, h + 6, sstep(p / 0.3));
  // three pearls on the frame's top counting down
  for (let i = 0; i < 3; i++) {
    const lit = p > 0.25 + i * 0.25 ? 1 : 0;
    pearl(ctx, x - 16 + i * 16, y - h - 4, 4.6 + lit * 1.2, sstep(p / 0.3));
    if (lit) glow(ctx, x - 16 + i * 16, y - h - 4, 10, '#fff4c8', 0.6);
  }
  if (p > 0.6) word(ctx, 'Say pearls!', x, y - h - 18, 12, sstep((p - 0.6) / 0.15));
}
function portraitHit(ctx, z, x, y, u, e, fade) {
  const w = z.w;
  const h = 128;
  ctx.save();
  ctx.globalAlpha = 0.85 * (1 - sstep(u / 0.4));
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - w / 2, y - h, w, h + 6);
  ctx.restore();
  frame(ctx, x, y + 6, w, h + 6, fade);
  for (let i = 0; i < 8; i++) sparkle(ctx, x - w / 2 + hash(i) * w, y - hash(i * 3) * h, 3 * fade, fade, '#fff4c8');
  word(ctx, '*click*', x, y - h - 16, 11, fade);
}

// ---------- Glass Walls ----------
function wallsWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  const d = z.dir ?? 1;
  // the pane sliding in from the wall, sea water behind it
  const reach = w * sstep(p);
  const edge = d > 0 ? x + reach : x + w - reach;
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = WATER.base;
  if (d > 0) ctx.fillRect(x - 20, 0, reach + 20, y + 10);
  else ctx.fillRect(edge, 0, reach + 20, y + 10);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.18 + 0.2 * p;
  ctx.fillStyle = WATER.sh;
  ctx.fillRect(x, y - 10, w, 14);
  ctx.restore();
  pen(ctx, WATER.ink, 2.2);
  ctx.beginPath();
  ctx.moveTo(edge, 0);
  ctx.lineTo(edge, y + 8);
  ctx.stroke();
  pen(ctx, 'rgba(255,255,255,0.9)', 1.6);
  ctx.beginPath();
  ctx.moveTo(edge - d * 4, 20);
  ctx.lineTo(edge - d * 4, y - 30);
  ctx.stroke();
  ctx.fillStyle = GOLD.base;
  ctx.fillRect(edge - 2.5, y - 2, 5, 10);
  for (let i = 0; i < 6; i++) {
    const v = (time * 0.6 + hash(i)) % 1;
    bubble(ctx, edge - d * (8 + hash(i * 2) * Math.max(10, reach - 10)), y - v * (y - 20), 1.6 + hash(i) * 1.6, Math.sin(Math.PI * v) * 0.8);
  }
}
function wallsHit(ctx, z, x, y, u, e, fade, time) {
  const w = z.w;
  const d = z.dir ?? 1;
  const back = 1 - sstep((u - 0.4) / 0.6);
  const edge = d > 0 ? x + w * back : x + w - w * back;
  ctx.save();
  ctx.globalAlpha = 0.35 * fade;
  ctx.fillStyle = WATER.base;
  if (d > 0) ctx.fillRect(x - 20, 0, edge - x + 20, y + 10);
  else ctx.fillRect(edge, 0, x + w - edge + 20, y + 10);
  ctx.restore();
  pen(ctx, WATER.ink, 2.2);
  ctx.beginPath();
  ctx.moveTo(edge, 0);
  ctx.lineTo(edge, y + 8);
  ctx.stroke();
  for (let i = 0; i < 10; i++) bubble(ctx, edge + d * (4 + e * 20), y - 10 - i * 22 - e * 10, 2 + hash(i) * 2, fade);
  sparkle(ctx, edge, y - 60, 4 * fade, fade, '#ffffff');
}

export const CORALIE_FX = {
  crDecree: { warn: decreeWarn, hit: decreeHit },
  crCases: { warn: casesWarn, hit: () => {} },
  crCase: { warn: caseWarn, hit: caseHit },
  crStrand: { warn: strandWarn, hit: strandHit },
  crWave: { warn: waveWarn, hit: waveHit },
  crPortrait: { warn: portraitWarn, hit: portraitHit },
  crWalls: { warn: wallsWarn, hit: wallsHit },
  crWallsHigh: { warn: () => {}, hit: () => {} },
};
// How long each landing plays (s).
export const CORALIE_HOLD = { crDecree: 0.8, crCases: 0.1, crCase: 0.7, crStrand: 0.8, crWave: 1, crPortrait: 0.9, crWalls: 0.9, crWallsHigh: 0.1 };
// (they draw their own floor markers: render/bossfx.js leaves out the plain one under them)
export const CORALIE_OWN_WARN = Object.keys(CORALIE_FX);
