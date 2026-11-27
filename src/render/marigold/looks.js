// Lady Marigold's cast looks (2026-11-26, her new fight, world/manor.js): each telegraph drawn whole
// in her own soft style (no plain floor marker under it: they are on render/bossfx.js OWN_WARN), while
// its cast winds up (`warn`, p 0..1 through the warning), and in place of the plain flash as it lands
// (`hit`, u 0..1 over its hold), in her own colours: marigold, cream and gold, her plum sash, the
// moonlight. render/dreamfx.js hands each zone with one of these looks to them (through
// render/bossfx.js). Every shape is rounded, outlined in a deeper shade of its own colour, eased.
//   mgInvite  Invitations (a marker on each of you: spread): a cream envelope with a marigold wax seal
//             fluttering down over you, a ring of petals on the floor round you; landing, the envelope
//             bursts open in a shower of petals and a little heart
//   mgStay    Don't Leave! (a ring with a safe middle): petals drifting over the whole roof but her
//             arms' reach, drawn in toward her; her reach a warm glowing circle; landing, the petals
//             swirl up everywhere outside it
//   mgRoom    Give Me Room! (a circle round her): her ghostly train's swirl, a gold-and-marigold
//             ribbon running round its edge, petals riding it; landing, the ribbon flung outward
//   mgToast   A Toast! (a stack): a gold ring on the floor, a glass raised over the marked one with
//             fizz rising, a glass for each of the guests it needs; landing, the clink: a gold burst
//   mgDance   May I Have This Dance? (the tank's marker): her plum ribbon looping round the tank,
//             tightening, her dance card over them with a heart being written on it; landing, a
//             twirl of ribbon and petals
//   mgChime   Midnight Chimes (four stretches struck in turn): a band of moonlight on the floor, a
//             little clock face over it with its number, its hand sweeping round to twelve; landing,
//             the chime: rings of sound and gold sparkles along it
//   mgWaltz   Hundred-Year Waltz (everyone): marigold petals and gold notes drifting down over the
//             whole roof, a warm glow gathering; landing, a soft flash of light and a gust of petals

import { glow, pen, sparkle, ell, hash, sstep, clamp, TAU } from './fx.js';

const SW = 640;
const GOWN = ['#ffe6a6', '#ffbb4c', '#f6922e', '#d06a24'];
const PETAL = ['#fff4c4', '#ffd26a', '#ffae3c'];
const GOLD = ['#fff2b4', '#f4c450', '#c48f2c'];
const SASH = ['#d8b0e0', '#9a62aa', '#6a3a7c'];
const MOON = ['#f4f0ff', '#cfc4f2', '#9c8ad6'];
const ease = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;

// A marigold petal: a rounded teardrop, its own deeper rim, a light along it.
function petal(ctx, x, y, s, ang, al = 1, col = PETAL[2], rim = GOWN[3]) {
  if (al <= 0.01 || s <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 0.9, -s * 0.6, s * 0.7, s * 0.8, 0, s);
  ctx.bezierCurveTo(-s * 0.7, s * 0.8, -s * 0.9, -s * 0.6, 0, -s);
  ctx.closePath();
  pen(ctx, rim, Math.max(0.6, s * 0.22));
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.fill();
  ell(ctx, -s * 0.2, -s * 0.25, s * 0.22, s * 0.4, 0.2);
  ctx.fillStyle = 'rgba(255,250,220,0.85)';
  ctx.fill();
  ctx.restore();
}
function heart(ctx, x, y, s, al = 1, fill = '#ff8ab4', rim = '#c8527e') {
  if (al <= 0.01 || s <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.3, y + s * 0.1, x - s * 1.1, y - s * 1.05, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 1.1, y - s * 1.05, x + s * 1.3, y + s * 0.1, x, y + s * 0.9);
  ctx.closePath();
  pen(ctx, rim, Math.max(0.6, s * 0.22));
  ctx.stroke();
  ctx.fillStyle = fill;
  ctx.fill();
  ell(ctx, x - s * 0.42, y - s * 0.3, s * 0.2, s * 0.13, -0.6);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
// A soft floor ring: a filled ellipse (flat on the roof) with a rim in a deeper shade of its own colour.
function floorRing(ctx, x, y, rx, fill, rim, al, w = 1.6) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, rx, rx * 0.26);
  ctx.fillStyle = fill;
  ctx.fill();
  pen(ctx, rim, w);
  ctx.stroke();
  ctx.restore();
}
// A row of petals laid round a floor ring, turning slowly (its edge, readable).
function petalRing(ctx, x, y, rx, n, time, al, spin = 0.3, s = 2.2) {
  for (let i = 0; i < n; i++) {
    const an = (i / n) * TAU + time * spin;
    const px = x + Math.cos(an) * rx;
    const py = y + Math.sin(an) * rx * 0.26;
    petal(ctx, px, py - 1, s, an + Math.PI / 2, al * (Math.sin(an) > -0.2 ? 1 : 0.6), i % 2 ? PETAL[1] : PETAL[2]);
  }
}
function envelope(ctx, x, y, s, ang, seal, al = 1) {
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.roundRect(-6 * s, -4 * s, 12 * s, 8 * s, 1.4 * s);
  pen(ctx, '#c9a882', 1.4);
  ctx.stroke();
  ctx.fillStyle = '#fff8ea';
  ctx.fill();
  pen(ctx, '#e2cfb2', 0.9);
  ctx.beginPath();
  ctx.moveTo(-5.4 * s, -3.4 * s);
  ctx.quadraticCurveTo(0, 1.2 * s, 5.4 * s, -3.4 * s);
  ctx.stroke();
  if (seal > 0.01) glow(ctx, 0, 0.8 * s, 6 * s, '#ffcf70', 0.6 * seal);
  ell(ctx, 0, 0.8 * s, 2 * s, 1.9 * s);
  ctx.fillStyle = GOWN[2];
  ctx.fill();
  pen(ctx, GOWN[3], 0.8);
  ctx.stroke();
  ell(ctx, -0.5 * s, 0.3 * s, 0.7 * s, 0.6 * s);
  ctx.fillStyle = PETAL[1];
  ctx.fill();
  ctx.restore();
}
function coupe(ctx, x, y, s, fill = 1, al = 1) {
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-5, -6);
  ctx.quadraticCurveTo(0, 0, 5, -6);
  ctx.closePath();
  ctx.moveTo(-0.5, -2.6);
  ctx.lineTo(0.5, -2.6);
  ctx.lineTo(0.5, 2.4);
  ctx.lineTo(2.6, 3.2);
  ctx.lineTo(-2.6, 3.2);
  ctx.lineTo(-0.5, 2.4);
  ctx.closePath();
  pen(ctx, '#b8a6d0', 1);
  ctx.stroke();
  ctx.fillStyle = 'rgba(240,248,255,0.92)';
  ctx.fill();
  if (fill > 0) {
    ctx.beginPath();
    ctx.moveTo(-4.4, -5.6);
    ctx.quadraticCurveTo(0, -1.4, 4.4, -5.6);
    ctx.closePath();
    ctx.fillStyle = '#ffdf80';
    ctx.fill();
  }
  ell(ctx, -2.2, -5, 0.8, 0.45);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
function bubble(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.fillStyle = '#fff8d8';
  ctx.fill();
  pen(ctx, '#e8c25a', 0.7);
  ctx.stroke();
  ell(ctx, x - r * 0.35, y - r * 0.35, r * 0.3, r * 0.22);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
function note(ctx, x, y, s, al, col = GOLD[1]) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  pen(ctx, GOLD[2], s * 0.36);
  ctx.beginPath();
  ctx.moveTo(x + s * 0.6, y);
  ctx.lineTo(x + s * 0.6, y - s * 2.1);
  ctx.quadraticCurveTo(x + s * 1.4, y - s * 1.8, x + s * 1.5, y - s * 1.1);
  ctx.stroke();
  ell(ctx, x, y, s * 0.78, s * 0.58, -0.4);
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}
// A little clock face: cream, a gold rim, its number (in dots round the top), the hand sweeping.
function clock(ctx, x, y, r, hand, n, al = 1) {
  ctx.save();
  ctx.globalAlpha *= al;
  glow(ctx, x, y, r * 2, '#fff0c0', 0.35);
  ell(ctx, x, y, r, r);
  ctx.fillStyle = '#fffaf0';
  ctx.fill();
  pen(ctx, GOLD[2], r * 0.18);
  ctx.stroke();
  pen(ctx, GOLD[1], r * 0.08);
  ell(ctx, x, y, r * 0.84, r * 0.84);
  ctx.stroke();
  // its number in the strike order, as little gold dots under twelve
  for (let i = 0; i < n; i++) {
    ell(ctx, x + (i - (n - 1) / 2) * r * 0.3, y + r * 0.45, r * 0.1, r * 0.1);
    ctx.fillStyle = GOLD[2];
    ctx.fill();
  }
  ell(ctx, x, y - r * 0.68, r * 0.09, r * 0.09);
  ctx.fillStyle = GOLD[2];
  ctx.fill();
  pen(ctx, '#5a3a4a', r * 0.1);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.sin(hand) * r * 0.7, y - Math.cos(hand) * r * 0.7);
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - r * 0.45);
  ctx.stroke();
  ell(ctx, x, y, r * 0.12, r * 0.12);
  ctx.fillStyle = '#5a3a4a';
  ctx.fill();
  ctx.restore();
}

// ---------- Invitations ----------
function inviteWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(255,240,206,0.32)', 'rgba(232,170,80,0.9)', 0.5 + 0.5 * p);
  petalRing(ctx, x, y, r, 8, time, 0.6 + 0.4 * p, 0.4, 2);
  // the envelope fluttering down over them, the seal warming as it nears
  const fall = ease(p);
  const sway = Math.sin(time * 3.4 + z.x * 0.01) * (1 - fall) * 5;
  const shake = p > 0.75 ? Math.sin(time * 40) * 1.2 * (p - 0.75) * 4 : 0;
  envelope(ctx, x + sway + shake, y - 62 + fall * 22, 1.1, Math.sin(time * 3.4) * 0.25 * (1 - fall), sstep((p - 0.4) / 0.6));
}
function inviteHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r * (1 + e * 0.1), 'rgba(255,236,190,0.4)', 'rgba(232,170,80,1)', fade);
  for (let i = 0; i < 10; i++) {
    const an = (i / 10) * TAU + hash(i + z.x) * 0.4;
    const d = 6 + e * (r * 0.9);
    petal(ctx, x + Math.cos(an) * d, y - 40 + Math.sin(an) * d * 0.5 - e * 6 + e * e * 18, 2.6, an + e * 5, fade, i % 2 ? PETAL[1] : PETAL[2]);
  }
  heart(ctx, x, y - 50 - e * 14, 4 * (1 - u * 0.5), fade);
  sparkle(ctx, x + 8, y - 46, 4 * (1 - u), fade);
}

// ---------- Don't Leave! ----------
function stayWarn(ctx, z, x, y, p, time) {
  const inner = z.inner;
  // the warm circle of her arms' reach: the one safe place
  glow(ctx, x, y - 6, inner * 1.3, '#fff0c8', 0.35 + 0.25 * p);
  floorRing(ctx, x, y, inner, 'rgba(255,244,214,0.35)', 'rgba(246,146,46,0.95)', 1, 2);
  heart(ctx, x, y - 4, 4 + Math.sin(time * 4) * 0.5, 0.9);
  // the drift over everything else: an orange haze on the roof, petals drawn in toward her
  ctx.save();
  ctx.globalAlpha = 0.18 + 0.2 * p;
  ctx.fillStyle = '#ffb04a';
  ctx.beginPath();
  ctx.rect(-40, y - 6, SW + 80, 12);
  ell(ctx, x, y, inner, inner * 0.26);
  ctx.fill('evenodd');
  ctx.restore();
  const n = 34;
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1;
    const v = (time * (0.25 + hash(i) * 0.2) + hash(i * 3.7)) % 1;
    const far = inner + 20 + (1 - v) * (SW * 0.7) * (0.3 + hash(i + 9) * 0.7);
    const px = x + side * far;
    if (px < -20 || px > SW + 20) continue;
    const py = y - 4 - hash(i * 1.9) * 60 * (1 - p * 0.6) - Math.sin(v * 6 + i) * 4;
    petal(ctx, px, py, 2.2, v * 6 + i, Math.sin(Math.PI * v) * (0.5 + 0.5 * p), i % 3 ? PETAL[2] : PETAL[1]);
  }
}
function stayHit(ctx, z, x, y, u, e, fade, time) {
  floorRing(ctx, x, y, z.inner, 'rgba(255,244,214,0.4)', 'rgba(246,146,46,1)', fade, 2);
  for (let i = 0; i < 40; i++) {
    const side = i % 2 ? 1 : -1;
    const far = z.inner + 16 + hash(i * 2.3) * SW * 0.6;
    const px = x + side * far;
    if (px < -20 || px > SW + 20) continue;
    petal(ctx, px + Math.sin(e * 6 + i) * 8, y - 4 - e * (30 + hash(i) * 60), 2.6, e * 8 + i, fade * 0.9, i % 2 ? PETAL[1] : PETAL[2]);
  }
}

// ---------- Give Me Room! ----------
function roomWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(255,190,90,0.22)', 'rgba(208,106,36,0.95)', 0.6 + 0.4 * p, 2);
  // the ribbon of her train running round the edge, faster as it nears
  for (let k = 0; k < 2; k++) {
    const a0 = time * (2 + p * 4) + k * Math.PI;
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.5 * p;
    ctx.beginPath();
    ctx.ellipse(x, y - 2 - k * 4, r * 0.98, r * 0.26, 0, a0, a0 + 1.6 + p);
    pen(ctx, GOWN[3], 5);
    ctx.stroke();
    pen(ctx, k ? PETAL[1] : GOWN[1], 3);
    ctx.stroke();
    ctx.restore();
  }
  petalRing(ctx, x, y - 4, r * 0.96, 10, time, 0.5 + 0.5 * p, 2 + p * 3, 2.4);
}
function roomHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r * (1 + e * 0.15), 'rgba(255,200,110,0.3)', 'rgba(208,106,36,1)', fade, 2);
  for (let i = 0; i < 16; i++) {
    const an = (i / 16) * TAU + e * 2;
    const d = r * (0.3 + e * 0.9);
    petal(ctx, x + Math.cos(an) * d, y - 20 + Math.sin(an) * d * 0.3 - e * 16, 2.8, an + e * 6, fade, i % 2 ? PETAL[1] : GOWN[1]);
  }
}

// ---------- A Toast! ----------
function toastWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(255,230,140,0.3)', 'rgba(196,143,44,1)', 0.7 + 0.3 * p, 2);
  // gold glints winking round the rim
  for (let i = 0; i < 6; i++) {
    const an = (i / 6) * TAU + time * 0.6;
    const tw = Math.max(0, Math.sin(time * 5 + i * 1.7));
    sparkle(ctx, x + Math.cos(an) * r, y + Math.sin(an) * r * 0.26 - 1, 1.4 + tw * 2.2, 0.8, '#fff2b4');
  }
  // the glass raised over them, fizz rising; a glass for each guest it needs, filling in
  const gx = x;
  const gy = y - 58 - Math.sin(time * 3) * 1.5;
  coupe(ctx, gx, gy, 1.5, 1);
  for (let i = 0; i < 4; i++) {
    const v = (time * 0.8 + i / 4) % 1;
    bubble(ctx, gx + Math.sin(v * 7 + i) * 3, gy - 10 - v * 18, 1.2 + v * 0.8, 1 - v);
  }
  const need = Math.max(1, z.need ?? 2);
  for (let i = 0; i < need; i++) coupe(ctx, x + (i - (need - 1) / 2) * 13, y - 24, 0.75, sstep((p - i * 0.15) / 0.4), 0.85);
}
function toastHit(ctx, z, x, y, u, e, fade, time) {
  floorRing(ctx, x, y, z.w / 2, 'rgba(255,236,160,0.4)', 'rgba(196,143,44,1)', fade, 2);
  for (let i = 0; i < 8; i++) {
    const an = -Math.PI / 2 + (i - 3.5) * 0.42;
    sparkle(ctx, x + Math.cos(an) * (6 + e * 34), y - 44 + Math.sin(an) * (6 + e * 26), 3.4 * (1 - u * 0.7), fade, '#fff2b4');
    bubble(ctx, x + Math.cos(an + 0.2) * (4 + e * 26), y - 40 + Math.sin(an + 0.2) * (4 + e * 30) - e * 10, 1.6, fade);
  }
}

// ---------- May I Have This Dance? ----------
function danceWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  const tight = 1 - 0.25 * ease(p);
  floorRing(ctx, x, y, r, 'rgba(216,176,224,0.25)', 'rgba(106,58,124,0.9)', 0.6 + 0.4 * p, 1.8);
  // her plum ribbon looping round them, tightening, a little bow at the front
  for (let k = 0; k < 3; k++) {
    const yy = y - 8 - k * 12;
    const a0 = time * 2.2 + k * 2.1;
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.45 * p;
    ctx.beginPath();
    ctx.ellipse(x, yy, r * 0.55 * tight, r * 0.16 * tight, 0, a0, a0 + Math.PI * 1.3);
    pen(ctx, SASH[2], 3.4);
    ctx.stroke();
    pen(ctx, SASH[1], 2);
    ctx.stroke();
    ctx.restore();
  }
  // the dance card over them, a heart being written on it line by line
  const cx = x;
  const cy = y - 76;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.sin(time * 2) * 0.06);
  ctx.beginPath();
  ctx.roundRect(-8, -10, 16, 20, 2.4);
  pen(ctx, GOLD[2], 1.4);
  ctx.stroke();
  ctx.fillStyle = '#fffaf0';
  ctx.fill();
  pen(ctx, '#e0d0c0', 0.8);
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-5, -5 + i * 4.4);
    ctx.lineTo(5, -5 + i * 4.4);
    ctx.stroke();
  }
  ctx.restore();
  heart(ctx, cx, cy - 4, 3.6 * sstep((p - 0.2) / 0.6), 1);
}
function danceHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  for (let k = 0; k < 3; k++) {
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.beginPath();
    ctx.ellipse(x, y - 10 - k * 12, r * (0.4 + e * 0.6), r * 0.14 * (1 + e), 0, time * 8 + k, time * 8 + k + 2.6);
    pen(ctx, SASH[2], 3.4 * (1 - u * 0.5));
    ctx.stroke();
    pen(ctx, SASH[1], 2 * (1 - u * 0.5));
    ctx.stroke();
    ctx.restore();
  }
  for (let i = 0; i < 8; i++) petal(ctx, x + Math.cos(i * 0.8 + e * 4) * (8 + e * 30), y - 30 + Math.sin(i * 0.8 + e * 4) * 14 - e * 8, 2.4, i + e * 6, fade);
}

// ---------- Midnight Chimes ----------
function chimeWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  // (each stretch waits its turn: dim until the one before it has struck)
  const wait = clamp(1 - (z.warn - z.t) / 1.6, 0, 1);
  const lit = 0.35 + 0.65 * sstep(wait);
  ctx.save();
  ctx.globalAlpha = lit;
  const g = ctx.createLinearGradient(0, y - 70, 0, y + 4);
  g.addColorStop(0, 'rgba(207,196,242,0)');
  g.addColorStop(1, 'rgba(207,196,242,0.38)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x + 2, y - 70, w - 4, 74, 8);
  ctx.fill();
  ell(ctx, x + w / 2, y, w / 2 - 2, 6);
  ctx.fillStyle = 'rgba(244,240,255,0.4)';
  ctx.fill();
  pen(ctx, MOON[2], 1.6);
  ctx.stroke();
  ctx.restore();
  // the clock over its middle, its hand sweeping round to twelve as its turn comes
  const hand = TAU * (1 - wait) * 0.9;
  clock(ctx, x + w / 2, y - 92 + Math.sin(time * 2 + z.x) * 1.5, 11 + 2 * sstep((wait - 0.8) / 0.2), -hand, z.chime ?? 1, 0.55 + 0.45 * lit);
  // moon motes drifting down in it
  for (let i = 0; i < Math.floor(w / 60); i++) {
    const v = (time * 0.35 + hash(i + z.x)) % 1;
    sparkle(ctx, x + 10 + hash(i * 2.2 + z.x) * (w - 20), y - 64 + v * 60, 1.6 * Math.sin(Math.PI * v) * lit, 0.8, '#efe8ff');
  }
}
function chimeHit(ctx, z, x, y, u, e, fade, time) {
  const w = z.w;
  const cx = x + w / 2;
  clock(ctx, cx, y - 92, 13, 0, z.chime ?? 1, fade);
  for (let k = 0; k < 3; k++) {
    const kk = clamp(e * 1.3 - k * 0.2, 0, 1);
    if (kk <= 0) continue;
    ctx.save();
    ctx.globalAlpha = (1 - kk) * 0.85;
    ctx.beginPath();
    ctx.ellipse(cx, y - 92, 14 + kk * w * 0.4, 8 + kk * 30, 0, 0, TAU);
    pen(ctx, GOLD[1], 2);
    ctx.stroke();
    pen(ctx, '#fffaf0', 0.8);
    ctx.stroke();
    ctx.restore();
  }
  for (let i = 0; i < Math.floor(w / 30); i++) sparkle(ctx, x + hash(i * 1.7 + z.x) * w, y - 6 - e * 20 * hash(i + 3), 3 * (1 - u), fade, '#fff2b4');
}

// ---------- Hundred-Year Waltz ----------
function waltzWarn(ctx, z, x, y, p, time) {
  glow(ctx, x, y - 50, 80 + 60 * p, '#ffe6b0', 0.2 + 0.3 * p);
  for (let i = 0; i < 26; i++) {
    const v = (time * (0.18 + hash(i) * 0.1) + hash(i * 4.1)) % 1;
    const px = hash(i * 2.9) * SW + Math.sin(v * 6 + i) * 14;
    const py = -10 + v * 340;
    if (i % 4 === 0) note(ctx, px, py, 3, Math.sin(Math.PI * v) * (0.4 + 0.6 * p));
    else petal(ctx, px, py, 2.4, v * 8 + i, Math.sin(Math.PI * v) * (0.35 + 0.65 * p), i % 2 ? PETAL[1] : PETAL[2]);
  }
}
function waltzHit(ctx, z, x, y, u, e, fade, time) {
  ctx.save();
  ctx.globalAlpha = 0.16 * (1 - e);
  ctx.fillStyle = '#fff4d8';
  ctx.fillRect(0, 0, SW, 360);
  ctx.restore();
  for (let i = 0; i < 30; i++) {
    const an = (i / 30) * TAU;
    const d = 20 + e * 320;
    petal(ctx, x + Math.cos(an) * d, y - 50 + Math.sin(an) * d * 0.5, 3, an + e * 6, fade, i % 2 ? PETAL[1] : PETAL[2]);
  }
}

export const MARIGOLD_FX = {
  mgInvite: { warn: inviteWarn, hit: inviteHit },
  mgStay: { warn: stayWarn, hit: stayHit },
  mgRoom: { warn: roomWarn, hit: roomHit },
  mgToast: { warn: toastWarn, hit: toastHit },
  mgDance: { warn: danceWarn, hit: danceHit },
  mgChime: { warn: chimeWarn, hit: chimeHit },
  mgWaltz: { warn: waltzWarn, hit: waltzHit },
};
// How long each landing plays (s).
export const MARIGOLD_HOLD = { mgInvite: 0.8, mgStay: 0.9, mgRoom: 0.8, mgToast: 0.8, mgDance: 0.8, mgChime: 0.7, mgWaltz: 1.1 };
// (they draw their own floor markers: render/bossfx.js leaves out the plain one under them)
export const MARIGOLD_OWN_WARN = Object.keys(MARIGOLD_FX);
