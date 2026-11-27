// The Grand Kettle's cast looks (2026-11-26, his new fight, world/grandkettle.js): each telegraph drawn
// whole in his own soft style (no plain floor marker under it: they are on render/bossfx.js OWN_WARN),
// while its cast winds up (`warn`, p 0..1 through the warning), and in place of the plain flash as it
// lands (`hit`, u 0..1 over its hold), in the colours of a tea ceremony: matcha green and its froth,
// amber tea, steam, black iron, cream cups with an indigo rim. render/dreamfx.js hands each zone with
// one of these looks to them (through render/bossfx.js and render/trial.js). Every shape is rounded,
// outlined in a deeper shade of its own colour, eased. (x, y) is the zone's spot on screen (a lane's
// left end; the floor's from 0); the screen is 640 x 360.
//   gkWhisk     Purify the Utensils (a circle round him): a ring of matcha froth on the floor, the
//               tines of his great whisk sweeping round it; landing, the froth whipped up and flung
//   gkPour      Pour the Water (a low lane at you): a glossy stream of hot water running along the
//               floor from him, steam curling off it; landing, a splash rolling along it
//   gkLids      Kettle Lids (circles round you): a shadow on the floor, an iron lid spinning high over
//               it, dropping in the last of the cast; landing, CLANG: soft rings and sparks
//   gkSteam     Steam Vents (columns): a round iron vent in the floor, glowing, wisps rising; landing,
//               a tall soft column of steam
//   gkWave      Tea Wave (the whole floor): a tide of green tea rising along the floor, tea leaves on it;
//               landing, the wave's crest rolling across
//   gkCups      A Thousand Cups (circles with gaps): a teacup shadow, a cup tumbling down from above;
//               landing, the cup set down with a splash of tea and a twinkle
//   gkInfusion  Grand Infusion (both sides but his own shadow): amber tea welling up over the floor,
//               leaves swirling; landing, a flood of tea and leaves

import { glow, pen, sparkle, ell, hash, sstep, clamp, TAU } from './fx.js';

const SW = 640;
const MATCHA = ['#f4fae0', '#cfe89a', '#94c25a', '#5e8e38'];
const FROTH = ['#ffffff', '#f2f8e0', '#d6e8b0'];
const TEA = ['#fff0c4', '#f0bc62', '#c8843a', '#8e5426'];
const WATER = ['#ffffff', '#e4f4ff', '#a8d4ee', '#6aa4c8'];
const STEAM = ['#ffffff', '#f2f0f8', '#d4cee4'];
const IRON = ['#8a8aa4', '#5a5a74', '#3a3a50', '#24243a'];
// (his kettle's lid, bronze like the kettle since 2026-11-27)
const LID = ['#f6d4a2', '#c88e56', '#9a663c', '#6e4630'];
const CUP = ['#fffaf0', '#f2e6d2', '#d8c4a8'];
const RIM = '#3e4e8a';
const ease = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;

// A soft puff of froth or steam: a round blob with a light in it, outlined in its own shade.
function puff(ctx, x, y, r, al, col = STEAM) {
  if (al <= 0.01 || r <= 0.2) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 0.86);
  pen(ctx, col[2], Math.max(0.6, r * 0.22));
  ctx.stroke();
  ctx.fillStyle = col[1];
  ctx.fill();
  ell(ctx, x - r * 0.22, y - r * 0.24, r * 0.55, r * 0.44);
  ctx.fillStyle = col[0];
  ctx.fill();
  ctx.restore();
}
// A tea leaf: a rounded leaf with its vein.
function leaf(ctx, x, y, s, ang, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(-s, 0);
  ctx.quadraticCurveTo(0, -s * 0.75, s, 0);
  ctx.quadraticCurveTo(0, s * 0.75, -s, 0);
  ctx.closePath();
  pen(ctx, MATCHA[3], 0.9);
  ctx.stroke();
  ctx.fillStyle = MATCHA[2];
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-s * 0.7, 0);
  ctx.lineTo(s * 0.7, 0);
  pen(ctx, MATCHA[1], 0.6);
  ctx.stroke();
  ctx.restore();
}
// The kettle lid: a low rounded dome with its knob, seen tilting as it spins.
function lid(ctx, x, y, s, spin, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(Math.sin(spin) * 0.35);
  const sq = 0.45 + 0.55 * Math.abs(Math.cos(spin * 0.5));
  ctx.beginPath();
  ctx.ellipse(0, 0, s, s * 0.3 * sq + s * 0.12, 0, 0, TAU);
  pen(ctx, LID[3], 1.4);
  ctx.stroke();
  ctx.fillStyle = LID[2];
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.1, s * 0.82, s * 0.5 * sq, 0, Math.PI, TAU);
  ctx.closePath();
  pen(ctx, LID[3], 1.2);
  ctx.stroke();
  ctx.fillStyle = LID[1];
  ctx.fill();
  ell(ctx, -s * 0.3, -s * 0.3 * sq, s * 0.3, s * 0.12);
  ctx.fillStyle = LID[0];
  ctx.fill();
  ell(ctx, 0, -s * 0.5 * sq - s * 0.1, s * 0.22, s * 0.16);
  ctx.fillStyle = '#e8b84a';
  ctx.fill();
  ctx.restore();
}
// A teacup: cream, an indigo band round its rim, a foot; tilted `ang`.
function teacup(ctx, x, y, s, ang, al = 1, tea = 0.6) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(-s, -s * 0.7);
  ctx.quadraticCurveTo(-s * 1.02, s * 0.55, -s * 0.45, s * 0.7);
  ctx.lineTo(s * 0.45, s * 0.7);
  ctx.quadraticCurveTo(s * 1.02, s * 0.55, s, -s * 0.7);
  ctx.closePath();
  pen(ctx, CUP[2], 1.2);
  ctx.stroke();
  ctx.fillStyle = CUP[1];
  ctx.fill();
  ell(ctx, -s * 0.4, -s * 0.05, s * 0.22, s * 0.42);
  ctx.fillStyle = CUP[0];
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-s * 0.98, -s * 0.42);
  ctx.quadraticCurveTo(0, -s * 0.28, s * 0.98, -s * 0.42);
  pen(ctx, RIM, s * 0.16);
  ctx.stroke();
  ell(ctx, 0, -s * 0.7, s, s * 0.24);
  ctx.fillStyle = CUP[2];
  ctx.fill();
  ell(ctx, 0, -s * 0.68, s * 0.86, s * 0.18);
  ctx.fillStyle = tea > 0.5 ? MATCHA[2] : TEA[1];
  ctx.fill();
  ctx.restore();
}
// A splash of tea: rounded drops thrown up and out.
function splash(ctx, x, y, r, u, col = TEA, n = 7) {
  const e = ease(u);
  for (let i = 0; i < n; i++) {
    const an = -Math.PI * (0.15 + 0.7 * (i / (n - 1)));
    const d = r * (0.3 + e);
    const px = x + Math.cos(an) * d;
    const py = y + Math.sin(an) * d * 0.9 + e * e * r * 0.8;
    const s = (1.6 + hash(i * 3.1) * 1.2) * (1 - u * 0.6);
    ctx.save();
    ctx.globalAlpha *= 1 - sstep((u - 0.5) / 0.5);
    ell(ctx, px, py, s, s * 1.1);
    pen(ctx, col[3] ?? col[2], 0.8);
    ctx.stroke();
    ctx.fillStyle = col[1];
    ctx.fill();
    ell(ctx, px - s * 0.3, py - s * 0.3, s * 0.35, s * 0.3);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
}
// A soft ring on the floor (a flattened ellipse), outlined in its own shade.
function floorRing(ctx, x, y, r, w, col, al) {
  if (al <= 0.01 || r <= 0.5) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.26, 0, 0, TAU);
  pen(ctx, col[3] ?? col[2], w + 1.4);
  ctx.stroke();
  pen(ctx, col[1], w);
  ctx.stroke();
  ctx.restore();
}

// The area a circle covers, filled and rimmed brightly enough to read on any floor, day or night.
function area(ctx, x, y, r, p, time, fill, rim) {
  const pulse = 0.5 + 0.5 * Math.sin(time * (8 + p * 14));
  ctx.save();
  glow(ctx, x, y - 2, r * 1.1, rim, 0.25 + 0.25 * p);
  ctx.globalAlpha = 0.3 + 0.35 * p;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.26, 0, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.globalAlpha = 0.6 + 0.4 * pulse;
  pen(ctx, rim, 1.6);
  ctx.stroke();
  ctx.restore();
}

// ---------- Purify the Utensils ----------
function whiskWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  area(ctx, x, y, r, p, time, MATCHA[2], '#f6ffe0');
  // the floor inside the ring, a soft wash of green filling as it gathers
  ctx.save();
  ctx.globalAlpha = 0.18 + 0.3 * p;
  ctx.beginPath();
  ctx.ellipse(x, y, r * (0.3 + 0.7 * ease(p)), r * 0.26 * (0.3 + 0.7 * ease(p)), 0, 0, TAU);
  ctx.fillStyle = MATCHA[1];
  ctx.fill();
  ctx.restore();
  floorRing(ctx, x, y, r, 2.2, MATCHA, 0.7 + 0.3 * p);
  // froth bubbles riding round its edge
  for (let i = 0; i < 22; i++) {
    const an = (i / 22) * TAU + time * (1 + p * 2);
    const bx = x + Math.cos(an) * r;
    const by = y + Math.sin(an) * r * 0.26;
    puff(ctx, bx, by - 2, 2.4 + hash(i) * 2 + p * 1.5, 0.6 + 0.4 * p, FROTH);
  }
  // the tines of his great whisk sweeping round the ring
  ctx.save();
  ctx.lineCap = 'round';
  for (let k = 0; k < 9; k++) {
    const an = time * (2.4 + p * 4) + k * 0.12;
    const bx = x + Math.cos(an) * r * 0.92;
    const by = y + Math.sin(an) * r * 0.24;
    ctx.globalAlpha = (0.25 + 0.6 * p) * (1 - k / 10);
    ctx.beginPath();
    ctx.moveTo(bx, by - 2);
    ctx.quadraticCurveTo(bx + Math.cos(an + 1.6) * 8, by - 24, bx + Math.cos(an + 1.6) * 4, by - 46);
    pen(ctx, '#b8985a', 2.8);
    ctx.stroke();
    pen(ctx, '#fff2cc', 1.1);
    ctx.stroke();
  }
  ctx.restore();
}
function whiskHit(ctx, z, x, y, u, e, fade) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r * (1 + e * 0.35), 3 * (1 - u) + 0.6, MATCHA, fade);
  for (let i = 0; i < 26; i++) {
    const an = (i / 26) * TAU;
    const d = r * (0.5 + e * 0.7) * (0.8 + hash(i) * 0.3);
    puff(ctx, x + Math.cos(an) * d, y + Math.sin(an) * d * 0.26 - e * 22 * hash(i * 2.3), (3.6 - u * 2) * (0.8 + hash(i * 5) * 0.5), fade, FROTH);
  }
  glow(ctx, x, y - 10, r * 0.8, MATCHA[0], 0.5 * (1 - e));
}

// ---------- Pour the Water ----------
function pourWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  const fromLeft = (z.flow ?? 1) > 0;
  const reach = w * ease(Math.min(1, p * 1.25));
  const x0 = fromLeft ? x : x + w - reach;
  // the stream along the floor: a glossy ribbon, its front running out ahead
  ctx.save();
  ctx.globalAlpha = 0.25 + 0.3 * p;
  ctx.fillStyle = WATER[1];
  ctx.fillRect(x, y - 16, w, 18);
  ctx.globalAlpha = 0.55 + 0.45 * p;
  ctx.beginPath();
  ctx.moveTo(x0, y - 1);
  for (let sx = 0; sx <= reach; sx += 8) ctx.lineTo(x0 + sx, y - 7 - Math.sin(sx * 0.08 - time * 9) * 2);
  ctx.lineTo(x0 + reach, y + 1);
  ctx.lineTo(x0, y + 1);
  ctx.closePath();
  pen(ctx, WATER[3], 1.4);
  ctx.stroke();
  ctx.fillStyle = WATER[2];
  ctx.fill();
  ctx.beginPath();
  for (let sx = 0; sx <= reach; sx += 8) ctx.lineTo(x0 + sx, y - 5 - Math.sin(sx * 0.08 - time * 9) * 1.8);
  pen(ctx, WATER[0], 1.4);
  ctx.stroke();
  ctx.restore();
  // steam curling off it
  for (let i = 0; i < Math.floor(w / 36); i++) {
    const sx = x + ((i + 0.5) / Math.floor(w / 36)) * w;
    const inside = fromLeft ? sx <= x0 + reach : sx >= x0;
    if (!inside) continue;
    const v = (time * 0.7 + hash(i * 1.9)) % 1;
    puff(ctx, sx + Math.sin(v * 5 + i) * 3, y - 9 - v * 30, 3 + v * 4, (0.3 + 0.6 * p) * Math.sin(Math.PI * v), STEAM);
  }
  // its edge marks, so the whole length of it reads
  ctx.save();
  ctx.globalAlpha = 0.35 + 0.4 * p;
  ctx.beginPath();
  ctx.moveTo(x, y + 3);
  ctx.lineTo(x + w, y + 3);
  pen(ctx, WATER[3], 1);
  ctx.stroke();
  ctx.restore();
}
function pourHit(ctx, z, x, y, u, e, fade) {
  const w = z.w;
  const fromLeft = (z.flow ?? 1) > 0;
  const cx = fromLeft ? x + e * w : x + w - e * w;
  ctx.save();
  ctx.globalAlpha = fade * 0.7;
  ctx.fillStyle = WATER[2];
  ctx.fillRect(x, y - 3, w, 4);
  ctx.restore();
  splash(ctx, cx, y - 2, 16, Math.min(1, u * 1.4), WATER, 8);
  for (let i = 0; i < Math.floor(w / 40); i++) puff(ctx, x + (i + 0.5) * 40, y - 8 - e * 16, 3 + e * 2, fade * 0.8, STEAM);
}

// ---------- Kettle Lids ----------
function lidsWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  const fall = sstep((p - 0.55) / 0.45);
  area(ctx, x, y - 1, r, p, time, IRON[1], '#fff2b4');
  ctx.save();
  ctx.globalAlpha = 0.25 + 0.45 * p;
  ctx.beginPath();
  ctx.ellipse(x, y - 1, r * (0.4 + 0.6 * p), r * 0.24 * (0.4 + 0.6 * p), 0, 0, TAU);
  ctx.fillStyle = IRON[3];
  ctx.fill();
  ctx.restore();
  floorRing(ctx, x, y - 1, r, 1.2, [null, IRON[0], IRON[1], IRON[2]], 0.5 + 0.4 * p);
  const ly = y - 150 + fall * fall * 140;
  // (a warm light round the lid, so the black iron shows against a night sky)
  glow(ctx, x, ly, 20, '#fff2b4', 0.55 + 0.3 * p);
  lid(ctx, x, ly, 11 + p * 2, time * 10 + (z.spin ?? 0), 0.6 + 0.4 * p);
}
function lidsHit(ctx, z, x, y, u, e, fade) {
  lid(ctx, x, y - 6 - Math.sin(u * Math.PI) * 5, 12, u * 3, fade);
  for (const d of [0, 0.22]) floorRing(ctx, x, y - 4, 6 + clamp(e - d, 0, 1) * 30, 1.6, [null, '#fff2c4', '#e8b84a', '#a8782a'], fade);
  for (let i = 0; i < 5; i++) sparkle(ctx, x + (hash(i) - 0.5) * 34, y - 12 - hash(i * 2.2) * 14 - e * 8, 3 * (1 - u), fade, '#fff2c4');
}

// ---------- Steam Vents ----------
function steamWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  // the column it will rise in, faint, filling up from the floor
  ctx.save();
  const top = y - 40 - 260 * ease(p);
  const g = ctx.createLinearGradient(0, top, 0, y);
  g.addColorStop(0, 'rgba(242,240,248,0)');
  g.addColorStop(1, `rgba(242,240,248,${0.3 + 0.4 * p})`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.8, y);
  ctx.quadraticCurveTo(x - r, (top + y) / 2, x - r * 0.6, top);
  ctx.lineTo(x + r * 0.6, top);
  ctx.quadraticCurveTo(x + r, (top + y) / 2, x + r * 0.8, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // the round iron vent in the floor, glowing warm
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.8, r * 0.22, 0, 0, TAU);
  pen(ctx, IRON[3], 1.6);
  ctx.stroke();
  ctx.fillStyle = IRON[2];
  ctx.fill();
  ctx.globalAlpha = 0.4 + 0.5 * p;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.6, r * 0.14, 0, 0, TAU);
  ctx.fillStyle = TEA[1];
  ctx.fill();
  ctx.restore();
  for (let i = 0; i < 4; i++) {
    const v = (time * (0.8 + p) + i / 4) % 1;
    puff(ctx, x + Math.sin(v * 6 + i * 2) * r * 0.3, y - 4 - v * (20 + 40 * p), 2 + v * 4, (0.3 + 0.6 * p) * Math.sin(Math.PI * v), STEAM);
  }
}
function steamHit(ctx, z, x, y, u, e, fade) {
  const r = z.w / 2;
  for (let i = 0; i < 12; i++) {
    const v = i / 12;
    const py = y - 6 - v * 300 * Math.min(1, e * 1.4);
    puff(ctx, x + Math.sin(v * 9 + u * 6) * r * 0.25, py, r * (0.42 + v * 0.3), fade * (1 - v * 0.4), STEAM);
  }
}

// ---------- Tea Wave ----------
function waveWarn(ctx, z, x, y, p, time) {
  const h = 6 + 22 * ease(p);
  ctx.save();
  ctx.globalAlpha = 0.5 + 0.45 * p;
  ctx.beginPath();
  ctx.moveTo(0, y + 2);
  for (let sx = 0; sx <= SW; sx += 10) ctx.lineTo(sx, y - h + Math.sin(sx * 0.05 - time * 4) * 2.4);
  ctx.lineTo(SW, y + 2);
  ctx.closePath();
  pen(ctx, MATCHA[3], 1.4);
  ctx.stroke();
  ctx.fillStyle = MATCHA[2];
  ctx.fill();
  ctx.beginPath();
  for (let sx = 0; sx <= SW; sx += 10) ctx.lineTo(sx, y - h + 1.6 + Math.sin(sx * 0.05 - time * 4) * 2.4);
  pen(ctx, FROTH[0], 2);
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 10; i++) {
    const lx = (hash(i * 1.7) * SW + time * 18) % SW;
    leaf(ctx, lx, y - h + 1 + Math.sin(lx * 0.05 - time * 4) * 2.4, 3, Math.sin(time * 2 + i) * 0.6, 0.5 + 0.5 * p);
  }
}
function waveHit(ctx, z, x, y, u, e, fade) {
  const cx = -40 + e * (SW + 80);
  ctx.save();
  ctx.globalAlpha = fade * 0.75;
  ctx.fillStyle = MATCHA[2];
  ctx.fillRect(0, y - 8 * (1 - u), SW, 10);
  ctx.restore();
  // the crest rolling across
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.beginPath();
  ctx.moveTo(cx - 70, y + 2);
  ctx.quadraticCurveTo(cx - 20, y - 6, cx, y - 30);
  ctx.quadraticCurveTo(cx + 14, y - 38, cx + 24, y - 26);
  ctx.quadraticCurveTo(cx + 12, y - 22, cx + 16, y + 2);
  ctx.closePath();
  pen(ctx, MATCHA[3], 1.6);
  ctx.stroke();
  ctx.fillStyle = MATCHA[2];
  ctx.fill();
  ctx.restore();
  for (let i = 0; i < 7; i++) puff(ctx, cx + 14 - i * 9, y - 30 + i * 3 + Math.sin(i + e * 9) * 2, 3.4 - i * 0.3, fade, FROTH);
  for (let i = 0; i < 5; i++) leaf(ctx, cx - 20 - i * 18, y - 10 - hash(i) * 10, 3, e * 8 + i, fade);
}

// ---------- A Thousand Cups ----------
function cupsWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  const fall = sstep((p - 0.5) / 0.5);
  area(ctx, x, y - 1, r, p, time, TEA[1], '#fff6dc');
  ctx.save();
  ctx.globalAlpha = 0.22 + 0.45 * p;
  ctx.beginPath();
  ctx.ellipse(x, y - 1, r * (0.35 + 0.65 * p), r * 0.24 * (0.35 + 0.65 * p), 0, 0, TAU);
  ctx.fillStyle = '#5a4a6a';
  ctx.fill();
  ctx.restore();
  floorRing(ctx, x, y - 1, r, 1.1, [null, CUP[0], CUP[2], RIM], 0.45 + 0.45 * p);
  const cy = y - 160 + fall * fall * 150;
  glow(ctx, x, cy, 16, '#fff6dc', 0.5 + 0.3 * p);
  teacup(ctx, x, cy, 8 + p * 2, Math.sin(time * 4 + (z.spin ?? 0)) * 0.5 * (1 - fall) + fall * 0.1, 0.4 + 0.6 * p, (z.spin ?? 0) % 2 ? 0.2 : 0.8);
}
function cupsHit(ctx, z, x, y, u, e, fade) {
  teacup(ctx, x, y - 8, 9, 0.1 * (1 - u), fade, (z.spin ?? 0) % 2 ? 0.2 : 0.8);
  splash(ctx, x, y - 12, 16, Math.min(1, u * 1.3), (z.spin ?? 0) % 2 ? TEA : MATCHA, 6);
  sparkle(ctx, x + 8, y - 22 - e * 8, 3.4 * Math.sin(Math.PI * Math.min(1, u * 1.5)), fade, '#fff6d8');
}

// ---------- Grand Infusion ----------
function infusionWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  const h = 6 + 30 * ease(p);
  ctx.save();
  const g = ctx.createLinearGradient(0, y - h - 20, 0, y);
  g.addColorStop(0, 'rgba(240,188,98,0)');
  g.addColorStop(1, `rgba(214,140,58,${0.35 + 0.45 * p})`);
  ctx.fillStyle = g;
  ctx.fillRect(x, y - h - 20, w, h + 22);
  ctx.globalAlpha = 0.5 + 0.4 * p;
  ctx.beginPath();
  for (let sx = 0; sx <= w; sx += 10) ctx.lineTo(x + sx, y - h * 0.4 + Math.sin(sx * 0.06 + time * 3) * 2);
  pen(ctx, TEA[1], 1.4);
  ctx.stroke();
  ctx.restore();
  // its inner edge (toward him) marked bright, so the safe ground between reads
  const ex = z.side < 0 ? x + w : x;
  ctx.save();
  ctx.globalAlpha = 0.5 + 0.5 * p;
  ctx.beginPath();
  ctx.moveTo(ex, y + 2);
  ctx.lineTo(ex, y - 26 - 30 * p);
  pen(ctx, TEA[0], 2.2);
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < Math.floor(w / 22); i++) {
    const v = (time * (0.4 + hash(i) * 0.3) + hash(i * 2.7)) % 1;
    const lx = x + hash(i * 4.3) * w + Math.sin(v * 7 + i) * 8;
    leaf(ctx, lx, y - 4 - v * (30 + 60 * p), 2.8, v * 6 + i, (0.3 + 0.7 * p) * Math.sin(Math.PI * v));
  }
}
function infusionHit(ctx, z, x, y, u, e, fade) {
  const w = z.w;
  ctx.save();
  ctx.globalAlpha = fade * 0.8;
  const h = 40 * Math.sin(Math.PI * Math.min(1, u * 1.2));
  ctx.beginPath();
  ctx.moveTo(x, y + 2);
  for (let sx = 0; sx <= w; sx += 12) ctx.lineTo(x + sx, y - h + Math.sin(sx * 0.07 + e * 10) * 4);
  ctx.lineTo(x + w, y + 2);
  ctx.closePath();
  pen(ctx, TEA[3], 1.6);
  ctx.stroke();
  ctx.fillStyle = TEA[2];
  ctx.fill();
  ctx.restore();
  for (let i = 0; i < Math.floor(w / 26); i++) leaf(ctx, x + hash(i * 1.3) * w, y - h * 0.7 - hash(i) * 18, 3, e * 7 + i, fade);
  for (let i = 0; i < Math.floor(w / 60); i++) puff(ctx, x + (i + 0.5) * 60, y - h - 6, 4 + e * 2, fade * 0.8, STEAM);
}

export const GK_FX = {
  gkWhisk: { warn: whiskWarn, hit: whiskHit },
  gkPour: { warn: pourWarn, hit: pourHit },
  gkLids: { warn: lidsWarn, hit: lidsHit },
  gkSteam: { warn: steamWarn, hit: steamHit },
  gkWave: { warn: waveWarn, hit: waveHit },
  gkCups: { warn: cupsWarn, hit: cupsHit },
  gkInfusion: { warn: infusionWarn, hit: infusionHit },
};
// How long each landing plays (s): the same as world/grandkettle.js keeps each zone.
export const GK_HOLD = { gkWhisk: 0.9, gkPour: 0.8, gkLids: 0.8, gkSteam: 1, gkWave: 1.1, gkCups: 0.9, gkInfusion: 1.2 };
// (they draw their own floor markers: render/bossfx.js leaves out the plain one under them)
export const GK_OWN_WARN = Object.keys(GK_FX);
