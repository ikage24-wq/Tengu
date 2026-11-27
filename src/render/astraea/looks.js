// Astraea, the Star Keeper's cast looks (2026-11-27, her new fight, world/observatory.js): each telegraph
// drawn whole in her own soft style (no plain floor marker under it: they are on render/bossfx.js
// OWN_WARN), while its cast winds up (`warn`, p 0..1 through the warning), and in place of the plain flash
// as it lands (`hit`, u 0..1 over its hold, e eased, fade). Her colours: pale gold starlight with a white
// heart, the plum night and the dusk rose of her cloak, the cherry wood and gold beads of her star abacus;
// every shape rounded, outlined in a deeper shade of its own colour, eased; sparkles, never specks.
// render/dreamfx.js hands each zone with one of these looks to them. (x, y) is the zone's spot on the
// 640 x 360 screen (a band's left end).
//   asTally     Tally (the tank's marker): a big star bead hanging over them, a tally mark ticking up beside
//               it each second (I, II, III); landing, it drops on them: a soft starburst
//   asHead      Head Count (each of you): a star bead over each head with your number on it, a dotted ring
//               on the floor round you; landing, each bead pops in a ring of sparkles
//   asRecount   Recount (each of you, one after another): the same beads, counted off in order (the next
//               one ringed), each popping on its own count
//   asCatch     Catch a Falling Star (the healer's marker: gather in): a big soft star drifting down over
//               them, a gold ring on the floor, little sparkles drawn in toward it; landing, caught: a warm
//               burst and a ring of light
//   asLights    A Thousand Lights (everyone): the stars along the top of the sky lighting one by one as she
//               counts; landing, a soft wash of starlight down the whole hall
//   asChart     Star Chart (the dark between the stars): the floor there sinks into a deep night, little
//               stars falling in it; landing, a rain of starlight across it
//   asChartStar (a star of the chart: no hit, stand on it) a big gold star on the floor, its ring, the
//               constellation's lines to the next star; landing, the lines draw themselves and its name
//               shines over the hall
//   asCarry     Carry the One (a cleave ahead of her): a row of abacus beads lined up along the floor ahead
//               of her, wobbling; landing, they fly across it in an arc, clacking
//   asFall      Let Them Fall (a star at a spot): a stopped star hanging high over its spot with its count,
//               its shadow ring growing; landing, it falls: a burst of light
//   asLast      The Last Count (everyone, twice): the count over the hall, 3, 2, 1, every stopped star
//               trembling; landing, a great bright flash and falling stars
import { TAU, clamp, sstep, ell, pen, glow, sparkle, hash } from './fx.js';
import { STAR, PLUM, DUSK, GOLD, WOOD, BEAD } from './palette.js';

const SW = 640;
const rgba = (hex, al) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(al, 0, 1)})`;
};
function floorRing(ctx, x, y, r, fill, rim, al, w = 1.6, dash = null) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 0.22);
  ctx.fillStyle = fill;
  ctx.fill();
  pen(ctx, rim, w);
  if (dash) ctx.setLineDash(dash);
  ctx.stroke();
  ctx.restore();
}
function word(ctx, text, x, y, size, al, col = PLUM.deep) {
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
// A soft five-point star with round tips: pale gold, a deeper gold outline, a white heart, a violet glow.
export function softStar(ctx, x, y, r, rot = 0, al = 1, glowK = 1) {
  if (al <= 0.01 || r <= 0) return;
  ctx.save();
  ctx.globalAlpha *= al;
  if (glowK > 0) glow(ctx, x, y, r * 2.6, STAR.glow, 0.45 * glowK);
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const an = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.52 : r;
    const p = [Math.cos(an) * rr, Math.sin(an) * rr];
    const prev = -Math.PI / 2 + ((i - 0.5) * Math.PI) / 5;
    if (i) ctx.quadraticCurveTo(Math.cos(prev) * rr * (i % 2 ? 1.05 : 0.62), Math.sin(prev) * rr * (i % 2 ? 1.05 : 0.62), p[0], p[1]);
    else ctx.moveTo(p[0], p[1]);
  }
  ctx.closePath();
  ctx.fillStyle = STAR.base;
  ctx.fill();
  pen(ctx, STAR.ink, Math.max(0.8, r * 0.14));
  ctx.stroke();
  ell(ctx, -r * 0.1, -r * 0.12, r * 0.32, r * 0.26);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
// A star bead (her abacus's), big, for the effects: round soft gold, a star pressed in, a number on it.
function bigBead(ctx, x, y, r, al, label = null, lit = 0.6) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  glow(ctx, x, y, r * 2.8, BEAD.glow, 0.4 * lit + 0.1);
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 0, x, y, r * 1.1);
  g.addColorStop(0, BEAD.lt);
  g.addColorStop(0.55, BEAD.base);
  g.addColorStop(1, BEAD.sh);
  ell(ctx, x, y, r * 1.08, r);
  ctx.fillStyle = g;
  ctx.fill();
  pen(ctx, BEAD.ink, Math.max(1, r * 0.12));
  ctx.stroke();
  ell(ctx, x - r * 0.4, y - r * 0.45, r * 0.26, r * 0.18);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  if (label) word(ctx, label, x + 0.5, y + 0.8, r * 1.15, 1, GOLD.ink);
  ctx.restore();
}
// A falling star streaking down: a soft tail behind a star.
function streakStar(ctx, x0, y0, x1, y1, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, rgba(STAR.sky, 0));
  g.addColorStop(1, rgba(STAR.base, 0.8));
  ctx.strokeStyle = g;
  ctx.lineCap = 'round';
  ctx.lineWidth = r * 1.2;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.restore();
  softStar(ctx, x1, y1, r, (x1 + y1) * 0.05, al, 0.8);
}
function burst(ctx, x, y, r, e, fade, n = 8, seed = 0) {
  if (fade <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= fade;
  glow(ctx, x, y, r * (1 + e), STAR.glow, 0.55);
  // (soft rays, round-ended)
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const an = (i / n) * TAU + seed;
    const r0 = r * 0.25 * (1 + e);
    const r1 = r * (0.55 + e * 0.6) * (i % 2 ? 0.7 : 1);
    pen(ctx, rgba(STAR.deep, 0.5), 3.2);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(an) * r0, y + Math.sin(an) * r0 * 0.8);
    ctx.lineTo(x + Math.cos(an) * r1, y + Math.sin(an) * r1 * 0.8);
    ctx.stroke();
    pen(ctx, rgba(STAR.lt, 0.95), 1.6);
    ctx.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const an = (i / 6) * TAU + seed + 0.3;
    sparkle(ctx, x + Math.cos(an) * r * (0.4 + e * 0.9), y + Math.sin(an) * r * (0.3 + e * 0.6) - e * 6, 3 * (1 - e * 0.6), 1, STAR.lt);
  }
  ctx.restore();
}

// ---------- Tally ----------
function tallyMarks(ctx, x, y, n, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const k = clamp(n - i, 0, 1);
    if (k <= 0.01) continue;
    const xx = x + i * 6;
    pen(ctx, rgba(PLUM.deep, 0.9 * k), 4.2);
    ctx.beginPath();
    ctx.moveTo(xx, y - 7 * k);
    ctx.lineTo(xx + 0.8, y + 7 * k);
    ctx.stroke();
    pen(ctx, rgba(GOLD.base, k), 2.4);
    ctx.stroke();
  }
  ctx.restore();
}
function tallyWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r * (0.75 + 0.25 * sstep(p)), rgba(PLUM.lt, 0.14 + 0.18 * p), rgba(PLUM.base, 0.9), 1, 1.8);
  ell(ctx, x, y, r * 0.45 + 8 * p, 3 + 2 * p);
  ctx.fillStyle = rgba(PLUM.deep, 0.16 + 0.2 * p);
  ctx.fill();
  const by = y - 96 + sstep(p) * 26 + Math.sin(time * 2.6) * 2.5;
  bigBead(ctx, x, by, 13, 1, null, 0.4 + 0.6 * p);
  // (the count beside it: a tally mark a second, the last as it lands)
  tallyMarks(ctx, x + 22, by - 2, clamp(p * 3.05, 0, 3), 1);
  if (p > 0.66) word(ctx, p > 0.94 ? 'three!' : 'two...', x - 26, by - 18, 10, sstep((p - 0.66) / 0.1));
  else if (p > 0.33) word(ctx, 'one...', x - 26, by - 18, 10, sstep((p - 0.33) / 0.1));
}
function tallyHit(ctx, z, x, y, u, e, fade) {
  const k = sstep(u / 0.14);
  bigBead(ctx, x, y - 70 + k * 58, 13 * (1 - 0.3 * e), fade, null, 1);
  burst(ctx, x, y - 10, 46, e, fade, 10, 0.2);
  floorRing(ctx, x, y, 30 + e * 34, rgba(STAR.base, 0.25), rgba(STAR.deep, 0.8), fade, 2);
  word(ctx, 'THREE!', x, y - 96 - e * 8, 15, fade, PLUM.deep);
}

// ---------- Head Count / Recount ----------
function headWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, rgba(STAR.base, 0.1 + 0.12 * p), rgba(PLUM.base, 0.85), 1, 1.4, [5, 4]);
  const by = y - 64 - Math.sin(time * 3 + (z.n ?? 0)) * 2;
  bigBead(ctx, x, by, 9, sstep(p / 0.15), String(z.n ?? ''), 0.3 + 0.7 * p);
  // (a soft dotted thread from the bead down to them)
  ctx.save();
  ctx.globalAlpha *= 0.5 * sstep(p / 0.2);
  ctx.setLineDash([2, 4]);
  pen(ctx, rgba(GOLD.base, 0.9), 1);
  ctx.beginPath();
  ctx.moveTo(x, by + 10);
  ctx.lineTo(x, y - 40);
  ctx.stroke();
  ctx.restore();
}
function headHit(ctx, z, x, y, u, e, fade) {
  burst(ctx, x, y - 50, 30, e, fade, 8, (z.n ?? 0) * 0.4);
  floorRing(ctx, x, y, z.w / 2 * (0.8 + e * 0.3), rgba(STAR.base, 0.22), rgba(STAR.deep, 0.8), fade, 1.6);
}
function recountWarn(ctx, z, x, y, p, time) {
  headWarn(ctx, z, x, y, p, time);
  // (its own count: a ring closing in round its bead, the next to go brightest)
  const by = y - 64 - Math.sin(time * 3 + (z.n ?? 0)) * 2;
  const near = sstep((p - 0.55) / 0.45);
  ctx.save();
  pen(ctx, rgba(STAR.deep, 0.35 + 0.6 * near), 1.8);
  ctx.beginPath();
  ctx.arc(x, by, 14 + (1 - near) * 8, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(p, 0, 1));
  ctx.stroke();
  ctx.restore();
}

// ---------- Catch a Falling Star ----------
function catchWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, rgba(STAR.base, 0.18 + 0.18 * p), rgba(STAR.deep, 0.95), 1, 2.2);
  const sy = y - 150 + sstep(p) * 96;
  // (it drifts down, rocking, a soft tail behind it)
  const sx = x + Math.sin(time * 1.4) * 6 * (1 - p);
  streakStar(ctx, sx - 18, sy - 26, sx, sy, 11 + 4 * p, 1);
  // (little sparkles drawn in toward it: gather in)
  for (let i = 0; i < 6; i++) {
    const v = (time * 0.6 + i / 6) % 1;
    const an = (i / 6) * TAU;
    sparkle(ctx, x + Math.cos(an) * r * (1.3 - v), y - 8 + Math.sin(an) * 6 * (1 - v), 2.4, Math.sin(Math.PI * v), STAR.lt);
  }
  word(ctx, 'Catch it together!', x, y - 34 - Math.sin(time * 2) * 2, 10, sstep(p / 0.2), PLUM.deep);
}
function catchHit(ctx, z, x, y, u, e, fade) {
  softStar(ctx, x, y - 30 - e * 10, 14 * (1 - e * 0.4), e * 2, fade);
  burst(ctx, x, y - 26, 50, e, fade, 12, 0.1);
  floorRing(ctx, x, y, z.w / 2 * (1 + e * 0.4), rgba(STAR.base, 0.3), rgba(STAR.deep, 0.9), fade, 2.2);
}

// ---------- A Thousand Lights ----------
function lightsWarn(ctx, z, x, y, p, time) {
  const n = 14;
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, 120);
  g.addColorStop(0, rgba(STAR.glow, 0.16 + 0.18 * p));
  g.addColorStop(1, rgba(STAR.glow, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SW, 120);
  ctx.restore();
  for (let i = 0; i < n; i++) {
    const on = sstep(p * n * 1.05 - i);
    const sx = 24 + (i / (n - 1)) * (SW - 48) + Math.sin(i * 1.7) * 8;
    const sy = 26 + hash(i * 3.1) * 40;
    softStar(ctx, sx, sy, 3 + 4 * on + Math.sin(time * 5 + i) * 0.6 * on, time * 0.4 + i, 0.25 + 0.75 * on, on);
  }
  const k = Math.floor(clamp(p, 0, 0.999) * 3);
  word(ctx, ['...nine hundred and ninety-seven...', '...ninety-eight...', '...ninety-nine...'][k], SW / 2, 96, 11, sstep(p / 0.1), PLUM.deep);
}
function lightsHit(ctx, z, x, y, u, e, fade) {
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, 360);
  g.addColorStop(0, rgba(STAR.lt, 0.42 * fade));
  g.addColorStop(0.6, rgba(STAR.glow, 0.18 * fade));
  g.addColorStop(1, rgba(DUSK.low, 0.12 * fade));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SW, 360);
  ctx.restore();
  for (let i = 0; i < 12; i++) {
    const sx = 30 + (i / 11) * (SW - 60);
    const sy = 20 + e * (y - 40) * (0.6 + hash(i) * 0.4);
    streakStar(ctx, sx - 10, sy - 30, sx, sy, 3.4, fade);
  }
  word(ctx, 'A THOUSAND!', SW / 2, 90 - e * 6, 15, fade, PLUM.deep);
}

// ---------- Star Chart ----------
function chartWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  // (the floor there sinks into a deep night)
  ctx.save();
  const g = ctx.createLinearGradient(0, y - 60, 0, y + 6);
  g.addColorStop(0, rgba(PLUM.deep, 0));
  g.addColorStop(1, rgba(PLUM.deep, 0.32 + 0.3 * p));
  ctx.fillStyle = g;
  ctx.fillRect(x, y - 60, w, 66);
  ctx.restore();
  pen(ctx, rgba(DUSK.top, 0.6 + 0.3 * p), 1.4);
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 1);
  ctx.lineTo(x + w - 2, y + 1);
  ctx.stroke();
  // (little stars falling in it, more as it comes)
  const n = Math.max(1, Math.round(w / 40));
  for (let i = 0; i < n; i++) {
    const v = (time * (0.5 + p) + hash(i + (z.seed ?? 0)) ) % 1;
    const sx = x + ((i + 0.5) / n) * w + Math.sin(i * 2.3) * 6;
    sparkle(ctx, sx, y - 70 + v * 64, 1.6 + p * 1.2, Math.sin(Math.PI * v) * (0.4 + 0.6 * p), STAR.lt);
  }
}
function chartHit(ctx, z, x, y, u, e, fade) {
  const w = z.w;
  const n = Math.max(2, Math.round(w / 34));
  for (let i = 0; i < n; i++) {
    const sx = x + ((i + 0.5) / n) * w;
    const v = clamp(e * 1.4 - hash(i * 1.3) * 0.4, 0, 1);
    streakStar(ctx, sx - 8, y - 120 + v * 90, sx, y - 100 + v * 96, 2.8, fade);
  }
  ctx.save();
  ctx.globalAlpha *= fade;
  const g = ctx.createLinearGradient(0, y - 40, 0, y + 4);
  g.addColorStop(0, rgba(STAR.glow, 0));
  g.addColorStop(1, rgba(STAR.glow, 0.5));
  ctx.fillStyle = g;
  ctx.fillRect(x, y - 40, w, 44);
  ctx.restore();
}
function chartStarWarn(ctx, z, x, y, p, time) {
  const r = (z.w ?? 70) / 2;
  const al = sstep(p / 0.15) * (1 - sstep((p - 0.98) / 0.02));
  floorRing(ctx, x, y, r * 0.85, rgba(STAR.base, 0.3), rgba(STAR.deep, 0.95), al, 2);
  // (the constellation's line to the next star, drawn up in the air above the floor)
  const pts = z.pts ?? [];
  const i = z.i ?? 0;
  const j = z.close != null && i === pts.length - 1 ? z.close : i + 1;
  if (pts[j] != null) {
    const dx = pts[j] - pts[i];
    ctx.save();
    ctx.globalAlpha *= al * 0.6;
    ctx.setLineDash([4, 5]);
    ctx.lineDashOffset = -time * 12;
    pen(ctx, rgba(STAR.lt, 0.9), 1.3);
    ctx.beginPath();
    ctx.moveTo(x, y - 30 - (z.hy?.[i] ?? 0));
    ctx.lineTo(x + dx, y - 30 - (z.hy?.[j] ?? 0));
    ctx.stroke();
    ctx.restore();
  }
  softStar(ctx, x, y - 30 - (z.hy?.[i] ?? 0) + Math.sin(time * 2.4 + i) * 2, 7 + Math.sin(time * 5 + i) * 0.8, time * 0.3 + i, al);
  word(ctx, 'stand on a star', x, y - 52 - (z.hy?.[i] ?? 0), 8, al * (i === 0 ? 1 : 0), PLUM.deep);
}
function chartStarHit(ctx, z, x, y, u, e, fade) {
  const pts = z.pts ?? [];
  const i = z.i ?? 0;
  const j = z.close != null && i === pts.length - 1 ? z.close : i + 1;
  const hy = (k) => z.hy?.[k] ?? 0;
  if (pts[j] != null) {
    const dx = (pts[j] - pts[i]) * sstep(u / 0.4);
    ctx.save();
    ctx.globalAlpha *= fade;
    pen(ctx, rgba(STAR.glow, 0.5), 5);
    ctx.beginPath();
    ctx.moveTo(x, y - 30 - hy(i));
    ctx.lineTo(x + dx, y - 30 - hy(i) + (hy(i) - hy(j)) * sstep(u / 0.4));
    ctx.stroke();
    pen(ctx, rgba(STAR.lt, 1), 1.8);
    ctx.stroke();
    ctx.restore();
  }
  softStar(ctx, x, y - 30 - hy(i), 8 + e * 3, e, fade);
  if (i === 0 && z.name) {
    const mid = x + ((Math.min(...pts) + Math.max(...pts)) / 2 - pts[0]);
    word(ctx, z.name, mid, y - 120 - e * 6, 14, fade * sstep(u / 0.3), PLUM.deep);
  }
}

// ---------- Carry the One ----------
function carryWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  const d = z.dir ?? 1;
  ctx.save();
  ctx.globalAlpha = 0.16 + 0.18 * p;
  ctx.fillStyle = DUSK.top;
  ctx.fillRect(x, y - 6, w, 10);
  ctx.restore();
  // (a row of beads lined up ahead of her, as on a rod, wobbling more and more)
  const n = Math.max(3, Math.round(w / 30));
  pen(ctx, rgba(GOLD.sh, 0.7 * sstep(p / 0.2)), 1.6);
  ctx.beginPath();
  ctx.moveTo(x + 6, y - 22);
  ctx.lineTo(x + w - 6, y - 22);
  ctx.stroke();
  for (let i = 0; i < n; i++) {
    const k = d > 0 ? i : n - 1 - i;
    const on = sstep(p * 1.6 - k / n);
    const bx = x + ((i + 0.5) / n) * w;
    bigBead(ctx, bx + Math.sin(time * (8 + p * 10) + i) * 1.6 * p, y - 22, 6, on, null, p);
  }
  // (the arc they'll fly in)
  ctx.save();
  ctx.globalAlpha *= 0.5 * p;
  ctx.setLineDash([3, 5]);
  pen(ctx, rgba(STAR.deep, 0.9), 1.2);
  ctx.beginPath();
  const x0 = d > 0 ? x : x + w;
  ctx.moveTo(x0, y - 30);
  ctx.quadraticCurveTo(x + w / 2, y - 80, x0 + d * w, y - 26);
  ctx.stroke();
  ctx.restore();
}
function carryHit(ctx, z, x, y, u, e, fade) {
  const w = z.w;
  const d = z.dir ?? 1;
  const n = Math.max(3, Math.round(w / 30));
  for (let i = 0; i < n; i++) {
    const v = clamp(e * 1.3 - (i / n) * 0.3, 0, 1);
    const x0 = d > 0 ? x : x + w;
    const bx = x0 + d * w * v;
    const by = y - 22 - Math.sin(Math.PI * v) * 46 + i * 2;
    bigBead(ctx, bx, by, 6, fade, null, 1);
    if (v > 0.1 && v < 0.9) sparkle(ctx, bx - d * 8, by + 3, 2.2, fade, STAR.lt);
  }
  word(ctx, 'clack!', x + w / 2, y - 70 - e * 6, 11, fade * sstep(u / 0.15), WOOD.ink);
}

// ---------- Let Them Fall ----------
function fallWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r * (0.45 + 0.55 * sstep(p)), rgba(PLUM.lt, 0.12 + 0.22 * p), rgba(STAR.deep, 0.9), 1, 1.8);
  // (the stopped star, high over its spot, trembling as its count comes; its count on it)
  const tremble = Math.sin(time * 30 + (z.seed ?? 0)) * 1.4 * sstep((p - 0.6) / 0.4);
  const sy = y - 150 + sstep((p - 0.75) / 0.25) * 40;
  softStar(ctx, x + tremble, sy, 9, time * 0.5 + (z.seed ?? 0), 0.5 + 0.5 * sstep(p / 0.3));
  if (z.n) word(ctx, String(z.n), x, sy - 18, 11, sstep(p / 0.2), PLUM.deep);
}
function fallHit(ctx, z, x, y, u, e, fade) {
  const k = sstep(u / 0.12);
  if (k < 1) streakStar(ctx, x - 10, y - 140, x, y - 110 + k * 100, 9, 1);
  burst(ctx, x, y - 8, z.w / 2, e, fade * k, 10, (z.seed ?? 0) * 0.3);
  floorRing(ctx, x, y, z.w / 2 * (0.9 + e * 0.2), rgba(STAR.base, 0.25), rgba(STAR.deep, 0.85), fade * k, 1.8);
}

// ---------- The Last Count ----------
function lastWarn(ctx, z, x, y, p, time) {
  ctx.save();
  ctx.fillStyle = rgba(PLUM.deep, 0.1 + 0.18 * p);
  ctx.fillRect(0, 0, SW, 360);
  ctx.restore();
  for (let i = 0; i < 16; i++) {
    const sx = 20 + (i / 15) * (SW - 40);
    const sy = 22 + hash(i * 5.3) * 60;
    const tr = Math.sin(time * 26 + i * 2) * 1.2 * p;
    softStar(ctx, sx + tr, sy, 4 + 2 * p, i, 0.6 + 0.4 * p, p);
  }
  const n = 3 - Math.min(2, Math.floor(clamp(p, 0, 0.999) * 3));
  const pu = (p * 3) % 1;
  word(ctx, String(n), SW / 2, 110, 26 + 8 * sstep(pu / 0.2), 1 - sstep((pu - 0.85) / 0.15) * 0.5, PLUM.deep);
}
function lastHit(ctx, z, x, y, u, e, fade) {
  ctx.save();
  ctx.fillStyle = rgba(STAR.lt, 0.38 * fade * (1 - e * 0.5));
  ctx.fillRect(0, 0, SW, 360);
  ctx.restore();
  for (let i = 0; i < 14; i++) {
    const sx = 20 + hash(i * 2.7) * (SW - 40);
    const v = clamp(e * 1.2 - hash(i) * 0.2, 0, 1);
    streakStar(ctx, sx - 14, 10 + v * (y - 60), sx, 30 + v * (y - 40), 4, fade);
  }
}

export const ASTRAEA_FX = {
  asTally: { warn: tallyWarn, hit: tallyHit },
  asHead: { warn: headWarn, hit: headHit },
  asRecount: { warn: recountWarn, hit: headHit },
  asCatch: { warn: catchWarn, hit: catchHit },
  asLights: { warn: lightsWarn, hit: lightsHit },
  asChart: { warn: chartWarn, hit: chartHit },
  asChartStar: { warn: chartStarWarn, hit: chartStarHit },
  asCarry: { warn: carryWarn, hit: carryHit },
  asFall: { warn: fallWarn, hit: fallHit },
  asLast: { warn: lastWarn, hit: lastHit },
};
// How long each landing plays (s) (world/bossfight.js LOOK_HOLD keeps the zone that long).
export const ASTRAEA_HOLD = { asTally: 0.9, asHead: 0.6, asRecount: 0.6, asCatch: 0.9, asLights: 1.1, asChart: 0.8, asChartStar: 1.4, asCarry: 0.8, asFall: 0.7, asLast: 1.2 };
// (all of them draw their whole telegraph themselves)
export const ASTRAEA_OWN_WARN = Object.keys(ASTRAEA_FX);
