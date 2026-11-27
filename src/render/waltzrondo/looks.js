// The Ballroom pair's cast looks (2026-11-26, Dame Rondo the Tailcoat Penguin and Dame Minuet the
// Upside-down Bat, world/manor.js): drawn over each telegraph while its cast winds up (`warn`, p 0..1
// through the warning) and in place of the plain flash as it lands (`hit`, u 0..1 over its hold),
// in the pair's own colours: Rondo's midnight navy, cream and gold; Minuet's lilac, plum and rose.
// render/dreamfx.js hands each zone with one of these looks to them (through render/bossfx.js).
//   polish     Belly Slide (a lane): a sheen of fresh floor polish running along it, gold-white
//              glints winking out of it, thickest at her end
//   echoswoop  the bat's swoop at balcony height (a band up in the air): soft lilac air-currents
//              curling along it the way she'll fly, the stretch's edges marked with little wing
//              dips; landing, a rush of wind and rose sparkles along it
//   count      Count of Three (a stack): a gold ring and the count itself over it, 1, 2, 3, each
//              numeral popping in on its third; landing, a gold burst
//   kiss       Three Kisses (spread): a rose heart over each marked player, beating faster as it
//              nears; landing, it bursts into little hearts
//   twirl      Tailcoat Twirl (the tank's marker): navy coat-tail swirls circling, gold glints;
//              landing, a navy-and-gold whirl
//   rings      Echo Rings (circles and a ring): ripples of song rising at the ring's edges, notes
//              drifting up; landing, a bright ripple running out along it
//   lift       the Grand Lift's two passes: a dotted flight path with arrows the way they'll fly and
//              its number (1 low over the floor, 2 high past the balconies); landing, a rush of wind
//   bow        Final Bow (everyone): rose petals drifting down, a warm glow gathering; landing, a
//              shower of petals

import { starFlash, shock, easeOut } from '../fxkit.js';

const TAU = Math.PI * 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const SW = 640;
const NAVY = ['#5866a8', '#2f3a6e', '#1f2650'];
const GOLD = ['#fff6c8', '#ffd36b', '#d89a2c'];
const LILAC = ['#f2e8ff', '#c9a6f0', '#8a64b8'];
const ROSE = ['#ffe0ec', '#ff8ab4', '#c8527e'];

// A curvy four-point sparkle star.
function twinkle(ctx, x, y, r, c, a = 1) {
  if (r <= 0.2 || a <= 0) return;
  ctx.globalAlpha = a;
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + r * 0.16, y - r * 0.16, x + r, y);
  ctx.quadraticCurveTo(x + r * 0.16, y + r * 0.16, x, y + r);
  ctx.quadraticCurveTo(x - r * 0.16, y + r * 0.16, x - r, y);
  ctx.quadraticCurveTo(x - r * 0.16, y - r * 0.16, x, y - r);
  ctx.fill();
  ctx.globalAlpha = 1;
}
// A heart of size s (its width about 2s), centred at (x, y), its own deeper rim.
function heart(ctx, x, y, s, fill, rim, a = 1) {
  if (s <= 0.2 || a <= 0) return;
  ctx.globalAlpha = a;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.3, y + s * 0.1, x - s * 1.1, y - s * 1.05, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 1.1, y - s * 1.05, x + s * 1.3, y + s * 0.1, x, y + s * 0.9);
  ctx.closePath();
  ctx.lineWidth = Math.max(0.8, s * 0.22);
  ctx.strokeStyle = rim;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.globalAlpha = a * 0.8;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(x - s * 0.45, y - s * 0.32, s * 0.22, s * 0.14, -0.6, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}
// A music note (a round head, a stem, a curled flag).
function note(ctx, x, y, s, c, a = 1) {
  if (a <= 0) return;
  ctx.globalAlpha = a;
  ctx.fillStyle = c;
  ctx.strokeStyle = c;
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.62, s * 0.46, -0.4, 0, TAU);
  ctx.fill();
  ctx.lineWidth = Math.max(0.7, s * 0.2);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + s * 0.52, y - s * 0.1);
  ctx.lineTo(x + s * 0.52, y - s * 1.9);
  ctx.quadraticCurveTo(x + s * 1.3, y - s * 1.5, x + s * 1.1, y - s * 0.9);
  ctx.stroke();
  ctx.globalAlpha = 1;
}
// A gold numeral (or a word) with a soft plum rim, popped in by `k` (0..1, with a little overshoot).
function numeral(ctx, text, x, y, size, k, a = 1) {
  if (k <= 0 || a <= 0) return;
  const s = size * (k < 1 ? easeOut(k) * (1 + 0.25 * Math.sin(Math.PI * k)) : 1);
  ctx.globalAlpha = a;
  ctx.font = `bold ${Math.max(4, Math.round(s))}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1.5, s * 0.22);
  ctx.strokeStyle = '#6a3e5a';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = GOLD[1];
  ctx.fillText(text, x, y);
  ctx.globalAlpha = a * 0.7;
  ctx.fillStyle = GOLD[0];
  ctx.fillText(text, x - s * 0.04, y - s * 0.06);
  ctx.globalAlpha = 1;
}
// A soft crescent of moving air (a swoosh), facing `dir`.
function swoosh(ctx, x, y, r, dir, c, a, thick = 2) {
  if (a <= 0 || r <= 0.5) return;
  ctx.globalAlpha = a;
  ctx.strokeStyle = c;
  ctx.lineWidth = thick;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const a0 = dir > 0 ? -Math.PI * 0.75 : -Math.PI * 0.25;
  const a1 = dir > 0 ? -Math.PI * 0.15 : -Math.PI * 0.85;
  ctx.ellipse(x, y, r, r * 0.45, 0, Math.min(a0, a1), Math.max(a0, a1));
  ctx.stroke();
  ctx.globalAlpha = 1;
}
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ---------- Belly Slide: fresh polish along the lane ----------
function polishWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  const dir = z.dir ?? 1;
  // the sheen: a pale band, brightest at her end, running toward the far wall as the cast fills
  const run = easeOut(p);
  const x0 = dir > 0 ? x : x + w;
  const len = w * run;
  const g = ctx.createLinearGradient(x0, 0, x0 + dir * Math.max(1, len), 0);
  g.addColorStop(0, 'rgba(255,248,214,0.55)');
  g.addColorStop(0.7, 'rgba(255,236,170,0.28)');
  g.addColorStop(1, 'rgba(255,236,170,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x0 + (dir * len) / 2, y + 1, Math.max(1, len / 2), 4.4, 0, 0, TAU);
  ctx.fill();
  // glints winking along it, each on its own beat
  for (let k = 0; k < Math.floor(w / 26); k++) {
    const fx = hash(k * 3.1 + w);
    const gx = x + fx * w;
    if ((dir > 0 ? gx - x : x + w - gx) > len) continue;
    const tw = Math.sin(time * 5 + k * 1.9);
    twinkle(ctx, gx, y - 1 - hash(k + 7) * 3, 1.6 + Math.max(0, tw) * 2.4, k % 3 ? GOLD[0] : '#ffffff', 0.5 + 0.5 * Math.max(0, tw));
  }
  // a gleam sweeping along the polished part, over and over (faster near the end)
  const sweep = (time * (0.9 + p * 1.4)) % 1;
  const sx = x0 + dir * len * sweep;
  ctx.globalAlpha = 0.6 * Math.sin(Math.PI * sweep) * (0.4 + p * 0.6);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(sx, y, 9, 2, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function polishHit(ctx, z, x, y, u, e, fade, time) {
  for (let k = 0; k < Math.floor(z.w / 22); k++) {
    const sx = x + hash(k * 1.3) * z.w;
    twinkle(ctx, sx, y - 4 - e * 14 * hash(k + 5), 3 * (1 - u) + 0.6, k % 2 ? GOLD[0] : '#ffffff', fade);
  }
}

// ---------- The bat's swoop up high ----------
function swoopWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  const dir = z.dir ?? 1;
  // air-currents curling along the band the way she'll fly, more and brighter as it fills
  const n = Math.max(2, Math.floor(w / 46));
  for (let k = 0; k < n; k++) {
    const u = ((k / n + time * 0.45 * dir) % 1 + 1) % 1;
    const cx = x + u * w;
    const a = Math.sin(Math.PI * u) * (0.25 + p * 0.55);
    swoosh(ctx, cx, y + 2, 13 + (k % 3) * 3, dir, k % 2 ? LILAC[1] : ROSE[1], a, 1.8);
    swoosh(ctx, cx - dir * 6, y + 6, 9, dir, LILAC[0], a * 0.7, 1.2);
  }
  // little wing dips marking each end of the stretch
  for (const ex of [x, x + w]) {
    ctx.globalAlpha = 0.5 + 0.4 * p;
    ctx.strokeStyle = LILAC[2];
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ex - 6, y - 4);
    ctx.quadraticCurveTo(ex - 3, y + 1, ex, y - 2);
    ctx.quadraticCurveTo(ex + 3, y + 1, ex + 6, y - 4);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // twinkles drifting
  for (let k = 0; k < Math.floor(w / 40); k++) {
    const u = (time * 0.3 + hash(k)) % 1;
    twinkle(ctx, x + hash(k + 11) * w, y - 10 + u * 20, 1.6 * Math.sin(Math.PI * u) * (0.5 + p), k % 2 ? '#ffffff' : ROSE[0], 0.8);
  }
}
function swoopHit(ctx, z, x, y, u, e, fade, time) {
  const w = z.w;
  const dir = z.dir ?? 1;
  for (let k = 0; k < 6; k++) {
    const v = clamp01(e * 1.2 - k * 0.06);
    const cx = x + (dir > 0 ? v : 1 - v) * w;
    swoosh(ctx, cx, y + (k % 3) * 4 - 4, 18 + k * 2, dir, k % 2 ? LILAC[1] : ROSE[1], fade * 0.8, 2.4 - (k % 3) * 0.5);
  }
  for (let k = 0; k < Math.floor(w / 30); k++) {
    const sx = x + hash(k * 2.3) * w;
    twinkle(ctx, sx, y - 6 - u * 16 * hash(k), 3 * (1 - u) + 0.6, k % 2 ? ROSE[0] : '#ffffff', fade);
  }
}

// ---------- Count of Three ----------
function countWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  ctx.globalAlpha = 0.35 + 0.4 * p;
  ctx.strokeStyle = GOLD[1];
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(x, y + 1, r * 0.92, 6, 0, 0, TAU);
  ctx.stroke();
  ctx.globalAlpha = 1;
  // the count over it: each numeral pops in on its third, the newest big, the older ones fading back
  const beat = Math.min(2, Math.floor(p * 3));
  for (let i = 0; i <= beat; i++) {
    const k = clamp01((p - i / 3) / 0.12);
    const newest = i === beat;
    const nx = x + (i - 1) * 16;
    const ny = y - 64 - (newest ? Math.sin(time * 6) * 1.2 : 0);
    numeral(ctx, String(i + 1), nx, ny, newest ? 17 : 11, k, newest ? 1 : 0.55);
  }
  for (let k = 0; k < 5; k++) {
    const a = time * 1.6 + (k / 5) * TAU;
    twinkle(ctx, x + Math.cos(a) * r * 0.8, y + Math.sin(a) * 4, 1.4 + p * 1.6, GOLD[0], 0.4 + p * 0.5);
  }
}
function countHit(ctx, z, x, y, u, e, fade, time) {
  if (u < 0.3) starFlash(ctx, x, y - 18, 14 + u * 60, 8, 0.2, GOLD[1], '#ffffff');
  shock(ctx, x, y, (z.w / 2) * (0.6 + e * 0.6), 6 + e * 4, (1 - u) * 3, GOLD[1]);
  numeral(ctx, 'THREE!', x, y - 64 - e * 10, 15, 1, fade);
  for (let k = 0; k < 8; k++) {
    const a = -Math.PI * (0.1 + (k / 7) * 0.8);
    twinkle(ctx, x + Math.cos(a) * e * 40, y - 16 + Math.sin(a) * e * 30, 2.4 * (1 - u) + 0.5, k % 2 ? GOLD[0] : '#ffffff', fade);
  }
}

// ---------- Three Kisses ----------
function kissWarn(ctx, z, x, y, p, time) {
  // a rose heart over the marked player, beating faster as it nears
  const beat = 1 + Math.max(0, Math.sin(time * (5 + p * 9))) * 0.16;
  const s = (4 + p * 4) * beat;
  heart(ctx, x, y - 66, s, ROSE[1], ROSE[2], 0.55 + 0.45 * p);
  ctx.globalAlpha = 0.25 + 0.35 * p;
  ctx.strokeStyle = ROSE[1];
  ctx.lineWidth = 1.4;
  ctx.setLineDash([3, 3]);
  ctx.lineDashOffset = -time * 12;
  ctx.beginPath();
  ctx.ellipse(x, y + 1, z.w / 2, 5.5, 0, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}
function kissHit(ctx, z, x, y, u, e, fade, time) {
  heart(ctx, x, y - 30, 9 * (1 - u * 0.6), ROSE[1], ROSE[2], fade);
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * TAU + 0.4;
    heart(ctx, x + Math.cos(a) * e * 30, y - 30 + Math.sin(a) * e * 22 - u * 8, 2.6 * (1 - u) + 0.8, k % 2 ? ROSE[0] : ROSE[1], ROSE[2], fade);
  }
}

// ---------- Tailcoat Twirl ----------
function twirlWarn(ctx, z, x, y, p, time) {
  // navy coat-tail swirls circling the marker, quicker as it nears
  const r = z.w / 2;
  for (let k = 0; k < 3; k++) {
    const a0 = time * (2 + p * 5) + (k / 3) * TAU;
    ctx.globalAlpha = 0.3 + 0.5 * p;
    ctx.strokeStyle = k === 1 ? GOLD[1] : NAVY[1];
    ctx.lineWidth = k === 1 ? 1.4 : 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(x, y - 16, r * 0.85, 22, 0, a0, a0 + 1.6);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  twinkle(ctx, x + Math.cos(time * 4) * r * 0.7, y - 16 + Math.sin(time * 4) * 18, 2 + p * 2, GOLD[0], 0.9);
}
function twirlHit(ctx, z, x, y, u, e, fade, time) {
  for (let k = 0; k < 3; k++) {
    const a0 = e * 5 + (k / 3) * TAU;
    ctx.globalAlpha = fade;
    ctx.strokeStyle = k === 1 ? GOLD[1] : NAVY[k === 0 ? 1 : 0];
    ctx.lineWidth = 4 - k;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(x, y - 18, 18 + e * 22, 14 + e * 10, 0, a0, a0 + 2.2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  if (u < 0.25) starFlash(ctx, x, y - 18, 10 + u * 40, 6, 0.4, GOLD[1], '#ffffff');
}

// ---------- Echo Rings ----------
function ringsWarn(ctx, z, x, y, p, time) {
  const R = z.w / 2;
  const inner = z.kind === 'donut' ? z.inner : 0;
  // ripples of song rising at the ring's edges
  for (const edge of inner ? [inner, R] : [R]) {
    for (let k = 0; k < 2; k++) {
      const v = (time * 0.9 + k * 0.5) % 1;
      ctx.globalAlpha = (1 - v) * (0.25 + 0.5 * p);
      ctx.strokeStyle = k ? ROSE[1] : LILAC[1];
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(x, y - v * 10, edge, 6 + v * 3, 0, Math.PI, TAU);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  for (let k = 0; k < 5; k++) {
    const v = (time * 0.5 + hash(k)) % 1;
    const side = k % 2 ? 1 : -1;
    note(ctx, x + side * (inner ? (inner + R) / 2 : R * 0.6) + Math.sin(v * 6 + k) * 4, y - 6 - v * 30, 2.6, k % 2 ? LILAC[2] : ROSE[2], Math.sin(Math.PI * v) * (0.4 + p * 0.6));
  }
}
function ringsHit(ctx, z, x, y, u, e, fade, time) {
  const R = z.w / 2;
  const inner = z.kind === 'donut' ? z.inner : 0;
  const r = inner ? inner + (R - inner) * e : R * (0.3 + 0.7 * e);
  shock(ctx, x, y, r, 7 + e * 4, (1 - u) * 3.4, LILAC[1]);
  shock(ctx, x, y, r * 0.92, 6 + e * 3, (1 - u) * 1.6, ROSE[1]);
  for (let k = 0; k < 6; k++) {
    const side = k % 2 ? 1 : -1;
    note(ctx, x + side * r * (0.6 + 0.1 * k / 6), y - 8 - e * 20 - k * 2, 3, k % 2 ? LILAC[2] : ROSE[2], fade);
  }
}

// ---------- The Grand Lift ----------
function liftWarn(ctx, z, x, y, p, time) {
  // a dotted flight path with arrows the way they'll fly, its number
  const high = Boolean(z.high);
  const x0 = high ? x : 0;
  const w = high ? z.w : SW;
  const py = high ? y : y - 22;
  const dir = z.dir ?? 1;
  ctx.globalAlpha = 0.45 + 0.45 * p;
  ctx.strokeStyle = high ? LILAC[2] : GOLD[2];
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 6]);
  ctx.lineDashOffset = -time * 30 * dir;
  ctx.beginPath();
  ctx.moveTo(x0 + 8, py);
  for (let k = 0; k <= 24; k++) ctx.lineTo(x0 + 8 + ((w - 16) * k) / 24, py - Math.sin((k / 24) * Math.PI) * 10);
  ctx.stroke();
  ctx.setLineDash([]);
  // arrowheads along it
  for (let k = 1; k < 4; k++) {
    const ax = x0 + (w * k) / 4;
    const ay = py - Math.sin((k / 4) * Math.PI) * 10;
    ctx.fillStyle = high ? LILAC[1] : GOLD[1];
    ctx.beginPath();
    ctx.moveTo(ax + dir * 6, ay);
    ctx.lineTo(ax - dir * 3, ay - 4);
    ctx.lineTo(ax - dir * 1, ay);
    ctx.lineTo(ax - dir * 3, ay + 4);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const nx = dir > 0 ? x0 + 22 : x0 + w - 22;
  numeral(ctx, high ? '2' : '1', nx, py - 16, 15, clamp01(p * 4), 0.9);
}
function liftHit(ctx, z, x, y, u, e, fade, time) {
  const high = Boolean(z.high);
  const x0 = high ? x : 0;
  const w = high ? z.w : SW;
  const py = high ? y : y - 12;
  const dir = z.dir ?? 1;
  for (let k = 0; k < 8; k++) {
    const v = clamp01(e * 1.3 - k * 0.05);
    swoosh(ctx, x0 + (dir > 0 ? v : 1 - v) * w, py + (k % 3) * 4 - 4, 20, dir, k % 2 ? LILAC[1] : GOLD[1], fade * 0.8, 2.2);
  }
}

// ---------- Final Bow ----------
function bowWarn(ctx, z, x, y, p, time) {
  // rose petals drifting down over the floor; a warm glow gathering where she bows
  for (let k = 0; k < 18; k++) {
    const v = (time * (0.18 + hash(k) * 0.1) + hash(k + 3)) % 1;
    const px = (hash(k * 1.7) * SW + Math.sin(time + k) * 10) % SW;
    const py = -10 + v * 360;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(time * (1 + hash(k)) + k);
    ctx.globalAlpha = (0.3 + 0.6 * p) * Math.sin(Math.PI * v);
    ctx.fillStyle = k % 3 ? ROSE[1] : ROSE[0];
    ctx.beginPath();
    ctx.ellipse(0, 0, 3, 1.8, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 0.2 + 0.3 * p;
  const g = ctx.createRadialGradient(x, y - 30, 0, x, y - 30, 60 + p * 30);
  g.addColorStop(0, 'rgba(255,230,190,0.8)');
  g.addColorStop(1, 'rgba(255,230,190,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 100, y - 130, 200, 200);
  ctx.globalAlpha = 1;
}
function bowHit(ctx, z, x, y, u, e, fade, time) {
  for (let k = 0; k < 26; k++) {
    const px = hash(k * 2.1) * SW;
    const py = hash(k * 3.3) * 200 + e * 120;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(e * 4 + k);
    ctx.globalAlpha = fade;
    ctx.fillStyle = k % 3 ? ROSE[1] : ROSE[0];
    ctx.beginPath();
    ctx.ellipse(0, 0, 3.4, 2, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  if (u < 0.3) starFlash(ctx, x, y - 30, 16 + u * 70, 8, 0.3, ROSE[1], '#ffffff');
}

// (render/dreamfx.js gathers these with the other bosses' looks)
export const WALTZ_FX = {
  polish: { warn: polishWarn, hit: polishHit },
  echoswoop: { warn: swoopWarn, hit: swoopHit },
  count: { warn: countWarn, hit: countHit },
  kiss: { warn: kissWarn, hit: kissHit },
  twirl: { warn: twirlWarn, hit: twirlHit },
  rings: { warn: ringsWarn, hit: ringsHit },
  lift: { warn: liftWarn, hit: liftHit },
  bow: { warn: bowWarn, hit: bowHit },
};
// How long each landing plays (s).
export const WALTZ_HOLD = { polish: 0.5, echoswoop: 0.8, count: 0.9, kiss: 0.8, twirl: 0.8, rings: 0.9, lift: 0.9, bow: 1.2 };
