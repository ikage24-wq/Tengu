// Lady Marigold's cast looks for her remade fight (2026-11-28, world/manor.js): each telegraph drawn
// whole in her own look (no plain floor marker under it: render/bossfx.js OWN_WARN), while its cast
// winds up (`warn`, p 0..1 through the warning), and in place of the plain flash as it lands (`hit`, u
// 0..1 over its hold), in her colours: marigold, cream and gold, her plum, the moonlight. render/
// dreamfx.js hands each zone with one of these looks to them. Every shape is rounded, outlined in a
// deeper shade of its own colour, eased.
//   mgCards     Calling Cards (a marker on each of you): her calling card, gilt-edged with a marigold
//               seal, spinning down over you, petals ringing the floor; landing, it bursts into petals
//   mgPartners  Find a Partner! (two stacks wanting two each): a ring on the floor with two pairs of
//               dancing slippers' prints circling it, two hearts linked by a ribbon over it; landing, the
//               hearts meet in a burst of gold
//   mgSteps     Waltz in Three (three spots struck in turn): each spot's count in a gold numeral over it,
//               slipper prints turning on it, lit up as its count comes; landing, a twirl of petals
//   mgToes      Mind My Toes! (the tank's marker): her gold slipper's heel rising over the tank; landing,
//               the stamp: a star of light, petals jumping
//   mgLanterns  Lanterns Falling (a spot under each of you): a paper lantern coming down on its cord onto
//               a warm ring of light; landing, it bursts in a flash of warm light and paper petals
//   mgBloom     In Full Bloom (round her): a great marigold opening on the floor round her, petal by
//               petal; landing, the petals flung outward
//   mgTwelve    Twelve Chimes (everyone): the clock face over her, its hands sweeping round to twelve,
//               moonlight gathering; landing, twelve gold rings of sound rolling out over the roof

import { glow, pen, sparkle, ell, hash, sstep, clamp, TAU } from '../marigold/fx.js';

const GOWN = ['#ffe6a6', '#ffbb4c', '#f6922e', '#d06a24'];
const PETAL = ['#fff4c4', '#ffd26a', '#ffae3c'];
const GOLD = ['#fff2b4', '#f4c450', '#c48f2c'];
const PLUM = ['#e0a8c8', '#b04a7c', '#7a2a56'];
const CREAM = ['#fffdf6', '#fff4dc', '#efe0c0'];
const MOON = ['#f4f0ff', '#cfc4f2', '#9c8ad6'];
const ease = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;

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
// A little marigold: rings of rounded petals round a deep heart.
function bloomFlower(ctx, x, y, r, open, al, turn = 0) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  for (const [n, k, col] of [[12, 1, GOWN[2]], [10, 0.74, GOWN[1]], [8, 0.48, PETAL[0]]]) {
    for (let i = 0; i < n; i++) {
      const an = turn + (i / n) * TAU + k;
      const d = r * 0.5 * k * open;
      ell(ctx, x + Math.cos(an) * d, y + Math.sin(an) * d * 0.3, r * 0.42 * k, r * 0.3 * k * 0.4, an);
      pen(ctx, GOWN[3], 1);
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.fill();
    }
  }
  ell(ctx, x, y, r * 0.16, r * 0.06);
  ctx.fillStyle = GOWN[3];
  ctx.fill();
  ctx.restore();
}
// A slipper's print: a soft rounded sole and a heel.
function print(ctx, x, y, s, ang, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(1, 0.4);
  ell(ctx, 0, -s * 0.4, s * 0.45, s * 0.7);
  ctx.fillStyle = 'rgba(196,143,44,0.6)';
  ctx.fill();
  ell(ctx, 0, s * 0.7, s * 0.3, s * 0.3);
  ctx.fill();
  ctx.restore();
}

// ---------- Calling Cards ----------
function card(ctx, x, y, s, spin, al) {
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(Math.cos(spin) * s, s);
  ctx.beginPath();
  ctx.roundRect(-11, -7.5, 22, 15, 2);
  pen(ctx, GOLD[2], 1.6);
  ctx.stroke();
  const g = ctx.createLinearGradient(0, -7.5, 0, 7.5);
  g.addColorStop(0, CREAM[0]);
  g.addColorStop(1, CREAM[2]);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = GOLD[1];
  ctx.lineWidth = 0.6;
  ctx.strokeRect(-9, -5.5, 18, 11);
  ctx.strokeStyle = 'rgba(160,100,120,0.6)';
  ctx.beginPath();
  ctx.moveTo(-6, -1);
  ctx.lineTo(3, -1);
  ctx.moveTo(-6, 2);
  ctx.lineTo(1, 2);
  ctx.stroke();
  ctx.restore();
  bloomFlower(ctx, x + 6 * Math.cos(spin) * s, y + 2 * s, 4 * s, 1, al * Math.abs(Math.cos(spin)), spin);
}
function cardsWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(255,200,110,0.2)', 'rgba(208,106,36,0.9)', 0.6 + 0.4 * p, 1.6);
  for (let i = 0; i < 8; i++) {
    const an = (i / 8) * TAU + time * 0.8;
    petal(ctx, x + Math.cos(an) * r, y + Math.sin(an) * r * 0.26 - 2, 2.4, an + time, 0.5 + 0.5 * p, i % 2 ? PETAL[1] : PETAL[2]);
  }
  const fall = ease(p);
  card(ctx, x, y - 110 + fall * 50 + Math.sin(time * 3) * 2, 1.2, time * 3, 0.5 + 0.5 * p);
}
function cardsHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r * (1 + e * 0.2), 'rgba(255,200,110,0.3)', 'rgba(208,106,36,1)', fade, 2);
  for (let i = 0; i < 14; i++) {
    const an = (i / 14) * TAU;
    const d = 6 + e * r;
    petal(ctx, x + Math.cos(an) * d, y - 54 + Math.sin(an) * d * 0.6 + e * 20, 2.8, an + e * 5, fade, i % 2 ? PETAL[1] : GOWN[1]);
  }
  sparkle(ctx, x, y - 58, 6 * fade, 1, '#fff6c8');
}

// ---------- Find a Partner! ----------
function partnersWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(255,170,200,0.2)', 'rgba(176,74,124,0.95)', 0.7 + 0.3 * p, 2);
  // two pairs of slipper prints dancing round the ring
  for (let k = 0; k < 2; k++) {
    const an = time * 1.6 + k * Math.PI;
    for (let f = 0; f < 2; f++) {
      const a2 = an + f * 0.35;
      print(ctx, x + Math.cos(a2) * r * 0.62, y + Math.sin(a2) * r * 0.16, 5, a2 + Math.PI / 2, 0.5 + 0.5 * p);
    }
  }
  // two hearts, a ribbon between them, drawing closer
  const hy = y - 62 + Math.sin(time * 3) * 2;
  const gap = 14 - ease(p) * 6;
  ctx.save();
  ctx.globalAlpha *= 0.6 + 0.4 * p;
  ctx.beginPath();
  ctx.moveTo(x - gap, hy);
  ctx.quadraticCurveTo(x, hy + 8, x + gap, hy);
  pen(ctx, PLUM[1], 1.6);
  ctx.stroke();
  ctx.restore();
  heart(ctx, x - gap, hy, 6, 0.6 + 0.4 * p);
  heart(ctx, x + gap, hy, 6, 0.6 + 0.4 * p, '#ffb4cc');
  ctx.save();
  ctx.globalAlpha *= 0.7 + 0.3 * p;
  ctx.fillStyle = PLUM[2];
  ctx.font = '800 9px Nunito, "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('x2', x, hy - 12);
  ctx.restore();
}
function partnersHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r * (1 + e * 0.25), 'rgba(255,200,220,0.3)', 'rgba(176,74,124,1)', fade, 2.4);
  heart(ctx, x, y - 62 - e * 10, 8 + e * 6, fade);
  for (let i = 0; i < 10; i++) {
    const an = (i / 10) * TAU;
    sparkle(ctx, x + Math.cos(an) * (8 + e * 30), y - 62 + Math.sin(an) * (8 + e * 30), 2.6 * fade, 1, GOLD[0]);
  }
}

// ---------- Waltz in Three ----------
function stepsWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  const n = z.step ?? 1;
  // (each spot waits its count: dim until the one before it has struck)
  const wait = clamp(1 - (z.warn - z.t) / 1.2, 0, 1);
  const lit = 0.35 + 0.65 * sstep(wait);
  floorRing(ctx, x, y, r, `rgba(255,214,120,${0.12 + 0.2 * lit})`, 'rgba(196,143,44,1)', lit, 1.6 + lit);
  for (let f = 0; f < 3; f++) {
    const an = time * (1 + lit * 2) + (f / 3) * TAU;
    print(ctx, x + Math.cos(an) * r * 0.55, y + Math.sin(an) * r * 0.14, 5, an + Math.PI / 2, 0.4 + 0.6 * lit);
  }
  const ny = y - 48 + Math.sin(time * 3 + n) * 2;
  ctx.save();
  ctx.globalAlpha *= 0.5 + 0.5 * lit;
  ell(ctx, x, ny, 10 + sstep((wait - 0.8) / 0.2) * 3, 10 + sstep((wait - 0.8) / 0.2) * 3);
  pen(ctx, GOLD[2], 2);
  ctx.stroke();
  ctx.fillStyle = CREAM[0];
  ctx.fill();
  ctx.fillStyle = GOWN[3];
  ctx.font = '800 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(n), x, ny + 4.6);
  ctx.restore();
}
function stepsHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r * (1 + e * 0.1), 'rgba(255,214,120,0.3)', 'rgba(196,143,44,1)', fade, 2);
  for (let i = 0; i < 12; i++) {
    const an = (i / 12) * TAU + e * 4;
    const d = r * (0.3 + e * 0.6);
    petal(ctx, x + Math.cos(an) * d, y - 16 - e * 24 + Math.sin(an) * d * 0.3, 2.8, an + e * 6, fade, i % 2 ? PETAL[1] : GOWN[1]);
  }
}

// ---------- Mind My Toes! ----------
function slipper(ctx, x, y, s, al) {
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-14, 2);
  ctx.quadraticCurveTo(-14, -6, -4, -7);
  ctx.quadraticCurveTo(10, -8, 14, -1);
  ctx.quadraticCurveTo(14, 3, 8, 3);
  ctx.lineTo(-8, 3);
  ctx.lineTo(-9, 10);
  ctx.lineTo(-12, 10);
  ctx.closePath();
  pen(ctx, GOLD[2], 2);
  ctx.stroke();
  const g = ctx.createLinearGradient(0, -8, 0, 10);
  g.addColorStop(0, GOLD[0]);
  g.addColorStop(1, GOLD[1]);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  bloomFlower(ctx, x + 4 * s, y - 6 * s, 5 * s, 1, al);
}
function toesWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(255,200,110,0.26)', 'rgba(208,106,36,1)', 0.7 + 0.3 * p, 2);
  const rise = Math.sin(Math.PI * clamp(p * 1.1, 0, 1));
  slipper(ctx, x, y - 30 - rise * 46, 1.3, 0.6 + 0.4 * p);
}
function toesHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r * (1 + e * 0.3), 'rgba(255,220,140,0.4)', 'rgba(208,106,36,1)', fade, 2.6);
  slipper(ctx, x, y - 12, 1.3, fade * (1 - e));
  sparkle(ctx, x, y - 6, 12 * fade, 1, '#fff6c8');
  for (let i = 0; i < 10; i++) {
    const an = Math.PI * (1.05 + (i / 9) * 0.9);
    const d = 10 + e * r;
    petal(ctx, x + Math.cos(an) * d, y - 6 + Math.sin(an) * d * 0.7, 2.6, an, fade, i % 2 ? PETAL[1] : GOWN[1]);
  }
}

// ---------- Lanterns Falling ----------
function lantern(ctx, x, y, s, al, lit = 1) {
  ctx.save();
  ctx.globalAlpha *= al;
  glow(ctx, x, y, 20 * s, '#ffd27a', 0.35 * lit);
  ell(ctx, x, y, 8.4 * s, 8 * s);
  pen(ctx, GOWN[3], 1.4);
  ctx.stroke();
  const g = ctx.createRadialGradient(x - 2 * s, y - 2 * s, 0, x, y, 9 * s);
  g.addColorStop(0, PETAL[0]);
  g.addColorStop(0.6, GOWN[1]);
  g.addColorStop(1, GOWN[2]);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(196,94,26,0.45)';
  ctx.lineWidth = 0.6;
  for (const k of [-0.5, 0, 0.5]) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.abs(k) * 8 * s + 0.5, 8 * s, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.fillStyle = GOLD[1];
  ctx.fillRect(x - 4 * s, y - 9.4 * s, 8 * s, 2.4 * s);
  ctx.fillRect(x - 3.4 * s, y + 7.4 * s, 6.8 * s, 2.2 * s);
  ctx.restore();
}
function lanternsWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r * (0.6 + 0.4 * ease(p)), 'rgba(255,214,120,0.28)', 'rgba(208,106,36,0.9)', 0.6 + 0.4 * p, 1.6);
  glow(ctx, x, y - 4, r * 0.8, '#ffd27a', 0.2 + 0.25 * p);
  const ly = y - 150 + ease(p) * 112;
  ctx.save();
  ctx.globalAlpha *= 0.6;
  ctx.beginPath();
  ctx.moveTo(x, ly - 9);
  ctx.lineTo(x, ly - 80);
  pen(ctx, PLUM[2], 0.8);
  ctx.stroke();
  ctx.restore();
  lantern(ctx, x + Math.sin(time * 2 + z.x) * 3, ly, 1.1, 0.7 + 0.3 * p);
}
function lanternsHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  glow(ctx, x, y - 10, r * (0.8 + e), '#ffd27a', 0.6 * fade);
  floorRing(ctx, x, y, r * (1 + e * 0.2), 'rgba(255,220,140,0.4)', 'rgba(208,106,36,1)', fade, 2);
  for (let i = 0; i < 10; i++) {
    const an = (i / 10) * TAU + e;
    const d = 6 + e * r * 0.9;
    petal(ctx, x + Math.cos(an) * d, y - 20 + Math.sin(an) * d * 0.5 - e * 10, 2.4, an + e * 5, fade, i % 2 ? CREAM[0] : PETAL[1]);
  }
}

// ---------- In Full Bloom ----------
// (rebuilt 2026-11-28, the player: "full bloom effect is so simple ... it should be extremely detailed
// well done smoothly animated to match her": a real marigold like the ones in her hair, opening on the
// roof round her ring by ring, then flung apart)
const DEEP = '#b4501a';
const SQ = 0.34;
// One marigold petal lying on the floor, its root at the origin pointing along +x: a fan widening to a
// ruffled, scalloped tip; deep orange at the heart lightening to gold, cream at the frill; fine grooves
// down it; a soft sheen along its middle; outlined in a deeper orange.
function frillPetal(ctx, L, W, lit = 0) {
  if (L <= 0.5) return;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(L * 0.3, -W * 0.5, L * 0.7, -W * 0.62, L * 0.9, -W * 0.5);
  const n = 4;
  for (let i = 0; i < n; i++) {
    const y0 = -W * 0.5 + (i * W) / n;
    const y1 = y0 + W / n;
    ctx.quadraticCurveTo(L * (1.02 + 0.03 * Math.sin(i * 2.1)), (y0 + y1) / 2, L * (i === n - 1 ? 0.9 : 0.94), y1);
  }
  ctx.bezierCurveTo(L * 0.7, W * 0.62, L * 0.3, W * 0.5, 0, 0);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, L, 0);
  g.addColorStop(0, DEEP);
  g.addColorStop(0.3, GOWN[2]);
  g.addColorStop(0.7, GOWN[1]);
  g.addColorStop(0.92, lit > 0 ? '#fff0b0' : PETAL[1]);
  g.addColorStop(1, PETAL[0]);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = DEEP;
  ctx.lineWidth = Math.max(0.7, W * 0.07);
  ctx.stroke();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(160,64,18,0.38)';
  ctx.lineWidth = Math.max(0.35, W * 0.035);
  ctx.beginPath();
  for (const k of [-0.24, 0, 0.24]) {
    ctx.moveTo(L * 0.14, 0);
    ctx.quadraticCurveTo(L * 0.5, W * k * 0.9, L * 0.9, W * k * 1.5);
  }
  ctx.stroke();
  ell(ctx, L * 0.58, -W * 0.08, L * 0.24, W * 0.14);
  ctx.fillStyle = `rgba(255,248,220,${0.35 + lit * 0.35})`;
  ctx.fill();
  if (lit > 0.01) {
    ell(ctx, L * 0.95, 0, L * 0.12, W * 0.55);
    ctx.fillStyle = `rgba(255,252,230,${0.55 * lit})`;
    ctx.fill();
  }
  ctx.restore();
}
// The flower on the floor round her: three rings of petals, each ring opening after the one outside it
// (`open` 0..1), turning slowly; its swirled heart at her feet.
const RINGS = [
  { n: 16, len: 1, wid: 0.34, from: 0, to: 0.62, off: 0 },
  { n: 13, len: 0.72, wid: 0.3, from: 0.2, to: 0.8, off: 0.12 },
  { n: 10, len: 0.46, wid: 0.27, from: 0.38, to: 1, off: 0.31 },
];
function marigoldFloor(ctx, x, y, r, open, turn, lit, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(1, SQ);
  for (const R of RINGS) {
    const k = sstep(clamp((open - R.from) / (R.to - R.from), 0, 1));
    if (k <= 0.01) continue;
    for (let i = 0; i < R.n; i++) {
      const an = turn * (R === RINGS[1] ? -1 : 1) + R.off + (i / R.n) * TAU;
      // (each petal unfurls a beat after its neighbour, with a small overshoot as it settles)
      const kk = sstep(clamp(k * 1.25 - (i / R.n) * 0.25, 0, 1));
      const over = 1 + Math.sin(Math.PI * kk) * 0.06;
      const L = r * R.len * kk * over;
      ctx.save();
      ctx.rotate(an + (1 - kk) * 0.5);
      frillPetal(ctx, L, L * R.wid * 1.9 + 2, lit);
      ctx.restore();
    }
  }
  // its heart: a swirl of tiny tight petals, deep at the middle
  const hr = r * 0.17 * sstep(clamp(open * 1.6, 0, 1));
  if (hr > 0.5) {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, hr);
    g.addColorStop(0, '#8a3a12');
    g.addColorStop(0.55, GOWN[3]);
    g.addColorStop(1, GOWN[2]);
    ell(ctx, 0, 0, hr, hr);
    ctx.fillStyle = g;
    ctx.fill();
    pen(ctx, DEEP, 1.2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,214,140,0.7)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let j = 0; j <= 40; j++) {
      const u = j / 40;
      const an = turn * 2 + u * TAU * 2.2;
      const rr = hr * (0.15 + 0.8 * u);
      if (j) ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr);
      else ctx.moveTo(Math.cos(an) * rr, Math.sin(an) * rr);
    }
    ctx.stroke();
  }
  ctx.restore();
}
// The bloom's edge on the floor: one soft scalloped line (petal tips), a warm glow inside it.
function scallopRing(ctx, x, y, r, col, w, al, turn = 0, n = 22) {
  if (al <= 0.01 || r <= 1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  const N = n * 6;
  for (let j = 0; j <= N; j++) {
    const an = (j / N) * TAU + turn;
    const rr = r * (1 + 0.045 * Math.abs(Math.sin((an - turn) * n * 0.5)));
    const px = x + Math.cos(an) * rr;
    const py = y + Math.sin(an) * rr * SQ;
    if (j) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.lineJoin = 'round';
  pen(ctx, col, w);
  ctx.stroke();
  ctx.restore();
}
function bloomWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  const e = ease(p);
  // the warm glow of the danger on the floor, its scalloped edge brightening and quickening as it nears
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, SQ);
  const g = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
  g.addColorStop(0, 'rgba(255,190,90,0.05)');
  g.addColorStop(0.8, `rgba(255,170,70,${0.12 + 0.12 * p})`);
  g.addColorStop(1, 'rgba(255,150,60,0)');
  ctx.fillStyle = g;
  ell(ctx, 0, 0, r, r);
  ctx.fill();
  ctx.restore();
  const beat = 0.5 + 0.5 * Math.sin(time * (4 + p * 10));
  scallopRing(ctx, x, y, r, 'rgba(255,236,170,0.9)', 4.5, 0.25 + 0.35 * beat * p, time * 0.15);
  scallopRing(ctx, x, y, r, DEEP, 2, 0.7 + 0.3 * p, time * 0.15);
  // the flower opening round her
  marigoldFloor(ctx, x, y, r * 0.92, e, time * 0.18, sstep((p - 0.75) / 0.25), 0.55 + 0.45 * sstep(p * 2));
  // pollen glinting up out of its heart, and loose petals spiralling up round her as it charges
  for (let i = 0; i < 10; i++) {
    const v = (time * 0.45 + hash(i * 1.7)) % 1;
    const an = hash(i * 4.1) * TAU;
    const d = r * 0.15 * hash(i * 2.9);
    sparkle(ctx, x + Math.cos(an) * d + Math.sin(time * 2 + i) * 4, y - 6 - v * 90, (1.2 + 1.6 * hash(i)) * Math.sin(Math.PI * v) * p, 0.9, i % 3 ? '#fff2b4' : '#ffffff');
  }
  const nH = Math.round(4 + 8 * p);
  for (let i = 0; i < nH; i++) {
    const v = (time * 0.35 + i / nH) % 1;
    const an = v * TAU * 1.6 + i * 2.4 + time;
    const rr = r * (0.25 + 0.35 * v);
    petal(ctx, x + Math.cos(an) * rr, y - 10 - v * 70 + Math.sin(an) * rr * SQ, 2.2 + 1.2 * hash(i), an * 1.7, Math.sin(Math.PI * v) * (0.4 + 0.6 * p), i % 2 ? PETAL[1] : GOWN[1]);
  }
}
function bloomHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  // the light bursting from the flower's heart
  glow(ctx, x, y - 8, r * (0.4 + e * 0.9), '#ffe6a0', 0.55 * fade * (1 - e * 0.5));
  sparkle(ctx, x, y - 14, 16 * fade * (1 - e * 0.6), 1, '#fff8dc');
  // the flower itself, wide open and fading as its petals fly
  marigoldFloor(ctx, x, y, r * 0.92 * (1 + e * 0.12), 1, time * 0.18 + e * 0.6, 1 - e, fade * (1 - e) * 0.9);
  // the shockwave: a scalloped ring rolling out past the edge, a second one close behind it
  for (const [k, col, w] of [[0, '#fff2c0', 5], [0, DEEP, 2.2], [0.14, GOWN[1], 2.6]]) {
    const kk = clamp(e * 1.15 - k, 0, 1);
    scallopRing(ctx, x, y, r * (0.35 + kk * 0.95), col, w * (1 - kk * 0.5), fade * (1 - kk * 0.7), time * 0.3 + k * 3);
  }
  // every outer petal flung outward and up, tumbling, shrinking a little as it goes
  for (let i = 0; i < 16; i++) {
    const an = (i / 16) * TAU + time * 0.18;
    const fly = sstep(clamp(e * 1.2 - hash(i * 3.1) * 0.15, 0, 1));
    const d = r * (0.55 + fly * 0.85);
    const lift = Math.sin(Math.PI * clamp(fly * 0.9, 0, 1)) * (34 + 26 * hash(i));
    const px = x + Math.cos(an) * d;
    const py = y + Math.sin(an) * d * SQ - lift;
    const s0 = (9 + 3 * hash(i * 1.3)) * (1 - fly * 0.35);
    petal(ctx, px, py, s0, an + fly * (5 + 4 * hash(i)), fade, i % 3 ? GOWN[1] : PETAL[1], DEEP);
  }
  // gold pollen puffing up along the edge
  for (let i = 0; i < 12; i++) {
    const an = (i / 12) * TAU + 0.3;
    const k = clamp(e * 1.4 - 0.1, 0, 1);
    const px = x + Math.cos(an) * r * (0.9 + k * 0.2);
    const py = y + Math.sin(an) * r * SQ * (0.9 + k * 0.2) - k * 10;
    glow(ctx, px, py, 8 + k * 10, '#ffe6a0', 0.45 * fade * (1 - k));
    sparkle(ctx, px, py - 4, 2.4 * fade * (1 - k * 0.5), 0.9, '#fff2b4');
  }
  // and petals drifting back down over the roof, swaying as they fall
  for (let i = 0; i < 12; i++) {
    const v = clamp((u - 0.25 - hash(i * 5.5) * 0.2) / 0.75, 0, 1);
    if (v <= 0) continue;
    const an = hash(i * 7.7) * TAU;
    const d = r * (0.3 + 0.9 * hash(i * 2.2));
    const px = x + Math.cos(an) * d + Math.sin(v * 7 + i) * 8;
    const py = y + Math.sin(an) * d * SQ - 70 * (1 - v);
    petal(ctx, px, py, 5.5 + 1.5 * hash(i * 3.3), v * 6 + i, fade * Math.sin(Math.PI * Math.min(1, v * 1.2)), i % 2 ? PETAL[1] : GOWN[1], DEEP);
  }
}

// ---------- Twelve Chimes ----------
function clockFace(ctx, x, y, r, hand, al) {
  ctx.save();
  ctx.globalAlpha *= al;
  glow(ctx, x, y, r * 2.4, '#f4f0ff', 0.4);
  ell(ctx, x, y, r + 4, r + 4);
  pen(ctx, GOLD[2], 2.4);
  ctx.stroke();
  ctx.fillStyle = GOLD[1];
  ctx.fill();
  ell(ctx, x, y, r, r);
  ctx.fillStyle = CREAM[0];
  ctx.fill();
  ctx.strokeStyle = PLUM[2];
  for (let i = 0; i < 12; i++) {
    const an = (i / 12) * TAU - Math.PI / 2;
    ctx.lineWidth = i % 3 ? 1 : 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(an) * r * 0.8, y + Math.sin(an) * r * 0.8);
    ctx.lineTo(x + Math.cos(an) * r * 0.94, y + Math.sin(an) * r * 0.94);
    ctx.stroke();
  }
  for (const [len, w, a2] of [[0.8, 1.6, hand], [0.58, 2.4, hand * 0.08]]) {
    const an = a2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(an) * r * len, y + Math.sin(an) * r * len);
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ell(ctx, x, y, 2.4, 2.4);
  ctx.fillStyle = GOWN[2];
  ctx.fill();
  ctx.restore();
}
function twelveWarn(ctx, z, x, y, p, time) {
  const hand = TAU * (1 - ease(p)) * 0.95;
  clockFace(ctx, x, y - 150 + Math.sin(time * 2) * 2, 22, -hand, 0.6 + 0.4 * p);
  for (let i = 0; i < 6; i++) {
    const v = (time * 0.3 + hash(i + 2.2)) % 1;
    sparkle(ctx, x + (hash(i * 3.3) - 0.5) * 300, y - 200 + v * 160, 2 * Math.sin(Math.PI * v) * p, 0.8, MOON[0]);
  }
}
function twelveHit(ctx, z, x, y, u, e, fade, time) {
  clockFace(ctx, x, y - 150, 22, 0, fade);
  for (let k = 0; k < 4; k++) {
    const kk = clamp(e * 1.4 - k * 0.12, 0, 1);
    ctx.save();
    ctx.globalAlpha *= fade * (1 - kk * 0.6);
    ell(ctx, x, y - 150, 26 + kk * 420, (26 + kk * 420) * 0.6);
    pen(ctx, k % 2 ? GOLD[1] : GOWN[2], 3 * fade + 1);
    ctx.stroke();
    ctx.restore();
  }
}

export const HOSTESS_FX = {
  mgCards: { warn: cardsWarn, hit: cardsHit },
  mgPartners: { warn: partnersWarn, hit: partnersHit },
  mgSteps: { warn: stepsWarn, hit: stepsHit },
  mgToes: { warn: toesWarn, hit: toesHit },
  mgLanterns: { warn: lanternsWarn, hit: lanternsHit },
  mgBloom: { warn: bloomWarn, hit: bloomHit },
  mgTwelve: { warn: twelveWarn, hit: twelveHit },
};
// How long each landing plays (s).
export const HOSTESS_HOLD = { mgCards: 0.8, mgPartners: 0.8, mgSteps: 0.7, mgToes: 0.8, mgLanterns: 0.8, mgBloom: 1.3, mgTwelve: 1.2 };
// (they draw their own floor markers: render/bossfx.js leaves out the plain one under them)
export const HOSTESS_OWN_WARN = Object.keys(HOSTESS_FX);
