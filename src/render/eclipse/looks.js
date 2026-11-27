// Sol and Luna, the Eclipse Twins' cast looks (2026-11-27, their new fight, world/observatory.js): each
// telegraph drawn whole in their own soft style (no plain floor marker under it: they are on render/bossfx.js
// OWN_WARN), while its cast winds up (`warn`, p 0..1 through the warning), and in place of the plain flash as
// it lands (`hit`, u 0..1 over its hold, e eased, fade). Sol's sunlight (gold, warm coral) and Luna's
// moonlight (silver, periwinkle) and her mochi (soft white); every shape rounded, outlined in a deeper shade
// of its own colour, eased. (x, y) is the zone's spot on the 640 x 360 screen (a band's left end).
//   ecFlare     Solar Flare (the tank's marker): a little sun swelling over them, its rays turning; landing,
//               it bursts in a ring of soft rays
//   ecRipple    Moon Mallet (three rings round Luna, z.n 1..3): each a ring of round mochi on the floor, its
//               number on a little moon over it, rising as its pound comes; landing, the mochi squish flat
//   ecSunspot   Sunspots (each of you): a little sun over you, a warm ring under you; landing, a pop of light
//   ecMochi     Share the Mochi (the healer's marker): a big soft mochi coming down over them; landing, it
//               squishes and splits into little pieces for everyone
//   ecSunbeam   Opposition (Sol's half: the floor): sunlight pouring along the floor from her wall, warm
//               shimmer; landing, a blazing band of sunbeams
//   ecMoonbeam  Opposition (Luna's half, head-high): a ribbon of moonlight at head height, crescents drifting
//               along it; landing, it sweeps across in a wave of crescents
//   ecCorona    Conjunction (a ring round them, the middle safe): the moon sliding over the sun overhead,
//               a ring of soft sun flames on the floor round a cool shadow; landing, the diamond-ring flash
//               all round
//   ecCrossing  Crossing (the floor between them): a ribbon of sun and a ribbon of moon reaching for each
//               other along the floor; landing, they twist past in a swirl of gold and silver
//   ecDiamond   Diamond Ring / Totality (everyone): an eclipse forming high over the hall, a ring of light
//               with one bright bead; landing, the bead flashes out across the room
import { TAU, clamp, sstep, ell, pen, glow, sparkle, hash } from './fx.js';
import { crescent, sunStar } from './dress.js';
import { LUNA, SUNLIGHT, MOONLIGHT } from './palette.js';

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
function word(ctx, text, x, y, size, al, col) {
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
function sun(ctx, x, y, r, al = 1, rot = 0) {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  glow(ctx, x, y, r * 2.4, SUNLIGHT.glow, 0.5);
  ctx.translate(x, y);
  ctx.rotate(rot);
  sunStar(ctx, 0, 0, r, SUNLIGHT.base);
  ell(ctx, 0, 0, r * 0.55, r * 0.55);
  ctx.fillStyle = SUNLIGHT.lt;
  ctx.fill();
  pen(ctx, SUNLIGHT.ink, Math.max(0.6, r * 0.08));
  ctx.stroke();
  ctx.restore();
}
function moon(ctx, x, y, r, al = 1, rot = -0.5) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  glow(ctx, x, y, r * 2.2, MOONLIGHT.glow, 0.5);
  crescent(ctx, x, y, r, rot, MOONLIGHT.lt);
  ctx.restore();
}
function mochi(ctx, x, y, r, al = 1, squish = 0) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y + squish * r * 0.3, r * (1 + squish * 0.3), r * (0.85 - squish * 0.3));
  ctx.fillStyle = LUNA.mochi.base;
  ctx.fill();
  pen(ctx, LUNA.mochi.ink, Math.max(0.8, r * 0.08));
  ctx.stroke();
  glow(ctx, x - r * 0.3, y - r * 0.3, r * 0.6, '#ffffff', 0.9);
  glow(ctx, x + r * 0.2, y + r * 0.4, r * 0.7, LUNA.mochi.sh, 0.8);
  ctx.restore();
}

// ---------- Solar Flare ----------
function flareWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, rgba(SUNLIGHT.base, 0.2 + 0.2 * p), rgba(SUNLIGHT.ink, 0.9), 1, 1.8);
  sun(ctx, x, y - 64 - Math.sin(time * 3) * 3, 6 + 9 * sstep(p), 0.6 + 0.4 * sstep(p / 0.3), time * 1.5);
  if (p > 0.7) for (let i = 0; i < 4; i++) sparkle(ctx, x + Math.cos(time * 4 + i * 1.6) * 24, y - 64 + Math.sin(time * 4 + i * 1.6) * 24, 2.4 * (p - 0.7) * 3, 1, SUNLIGHT.lt);
}
function flareHit(ctx, z, x, y, u, e, fade) {
  sun(ctx, x, y - 24 + (1 - sstep(u / 0.15)) * -40, 14 * (1 - e * 0.4), fade, e * 2);
  for (let i = 0; i < 10; i++) {
    const an = (i / 10) * TAU;
    sun(ctx, x + Math.cos(an) * e * 44, y - 18 + Math.sin(an) * e * 30, 3 * (1 - e * 0.6), fade, an);
  }
  floorRing(ctx, x, y, z.w / 2 * (1 + e * 0.3), rgba(SUNLIGHT.lt, 0.35 * fade), rgba(SUNLIGHT.ink, fade), 1, 1.8);
  word(ctx, 'FLARE!', x, y - 84 - e * 8, 13, fade, SUNLIGHT.ink);
}
// ---------- Moon Mallet ----------
function rippleWarn(ctx, z, x, y, p, time) {
  const R = z.w / 2;
  const r0 = z.inner ?? 0;
  const n = z.n ?? 1;
  const rise = sstep(p / 0.4);
  ctx.save();
  ctx.globalAlpha = 0.18 + 0.2 * p;
  ctx.beginPath();
  ctx.ellipse(x, y, R, R * 0.22, 0, 0, TAU);
  if (r0 > 0) ctx.ellipse(x, y, r0, r0 * 0.22, 0, 0, TAU, true);
  ctx.fillStyle = MOONLIGHT.base;
  ctx.fill('evenodd');
  ctx.globalAlpha = 0.6 + 0.4 * p;
  pen(ctx, MOONLIGHT.ink, 1.8);
  ctx.beginPath();
  ctx.ellipse(x, y, R, R * 0.22, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
  // a ring of round mochi along its edge
  const k = Math.max(8, Math.round(R / 14));
  for (let i = 0; i < k; i++) {
    const an = (i / k) * TAU + time * 0.2;
    mochi(ctx, x + Math.cos(an) * (R - 6), y + Math.sin(an) * (R - 6) * 0.22 - 3, 5.4 * rise, 0.6 + 0.4 * rise, 0);
  }
  // its number on a little moon over it
  const bx = x + R * 0.7;
  const by = y - 40 - n * 14 - Math.sin(time * 2 + n) * 2;
  moon(ctx, bx, by, 7, rise, -0.5);
  word(ctx, String(n), bx + 2, by + 1, 10, rise * (p > 0.8 ? 0.6 + 0.4 * Math.sin(time * 12) : 1), MOONLIGHT.ink);
}
function rippleHit(ctx, z, x, y, u, e, fade) {
  const R = z.w / 2;
  const k = Math.max(8, Math.round(R / 14));
  for (let i = 0; i < k; i++) {
    const an = (i / k) * TAU;
    mochi(ctx, x + Math.cos(an) * (R - 6 + e * 6), y + Math.sin(an) * (R - 6) * 0.22 - 2, 4.6, fade, Math.min(1, u * 4));
  }
  word(ctx, 'pon!', x + R * 0.7, y - 30 - e * 8, 11, fade, MOONLIGHT.ink);
}
// ---------- Sunspots ----------
function spotWarn(ctx, z, x, y, p, time) {
  floorRing(ctx, x, y, z.w / 2, rgba(SUNLIGHT.base, 0.15 + 0.2 * p), rgba(SUNLIGHT.ink, 0.7), 1, 1.4);
  sun(ctx, x, y - 56 - Math.sin(time * 4 + x) * 2, 4 + 3 * sstep(p), 1, time * 2);
}
function spotHit(ctx, z, x, y, u, e, fade) {
  glow(ctx, x, y - 20, 40 * (0.5 + e), SUNLIGHT.glow, 0.6 * fade);
  for (let i = 0; i < 6; i++) sun(ctx, x + Math.cos(i * 1.05) * e * 26, y - 20 + Math.sin(i * 1.05) * e * 18, 2.4, fade, i);
}
// ---------- Share the Mochi ----------
function mochiWarn(ctx, z, x, y, p, time) {
  floorRing(ctx, x, y, z.w / 2, rgba('#ffffff', 0.3 + 0.2 * p), rgba(LUNA.mochi.ink, 0.95), 1, 1.8);
  const hy = y - 90 + sstep(p) * 40;
  mochi(ctx, x, hy, 16 + Math.sin(time * 5) * 0.8, 1, Math.sin(time * 5) * 0.06);
  word(ctx, 'share!', x, hy - 26, 11, sstep(p / 0.3), MOONLIGHT.ink);
}
function mochiHit(ctx, z, x, y, u, e, fade) {
  mochi(ctx, x, y - 12, 16, 1 - sstep((u - 0.2) / 0.3), Math.min(1, u * 5));
  for (let i = 0; i < 8; i++) {
    const an = -Math.PI + (i / 7) * Math.PI;
    mochi(ctx, x + Math.cos(an) * e * 40, y - 8 + Math.sin(an) * e * 30 + e * e * 18, 4, fade * sstep((u - 0.15) / 0.1), 0);
  }
}
// ---------- Opposition ----------
function sunbeamWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  const d = z.dir ?? 1;
  const reach = sstep(p / 0.7) * w;
  const x0 = d > 0 ? x : x + w - reach;
  ctx.save();
  const g = ctx.createLinearGradient(0, y - 56, 0, y + 6);
  g.addColorStop(0, rgba(SUNLIGHT.glow, 0));
  g.addColorStop(0.7, rgba(SUNLIGHT.glow, 0.3 + 0.3 * p));
  g.addColorStop(1, rgba(SUNLIGHT.deep, 0.5 + 0.3 * p));
  ctx.fillStyle = g;
  ctx.fillRect(x0, y - 56, reach, 62);
  // (a warm band along the floor itself, and slanting rays of sunlight falling on it)
  ctx.fillStyle = rgba(SUNLIGHT.base, 0.35 + 0.3 * p);
  ctx.fillRect(x0, y - 8, reach, 12);
  ctx.globalAlpha = 0.25 + 0.2 * p;
  ctx.fillStyle = SUNLIGHT.lt;
  for (let i = 0; i < 8; i++) {
    const rx = x0 + ((i + 0.5) / 8) * reach + Math.sin(time + i) * 6;
    ctx.beginPath();
    ctx.moveTo(rx - 4, y - 70);
    ctx.lineTo(rx + 4, y - 70);
    ctx.lineTo(rx + 18, y);
    ctx.lineTo(rx + 6, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  for (let i = 0; i < 10; i++) {
    const v = (time * 0.6 + hash(i)) % 1;
    const px = x0 + hash(i * 2.1) * reach;
    sparkle(ctx, px, y - 4 - v * 30, 1.8, Math.sin(Math.PI * v) * (0.5 + 0.5 * p), SUNLIGHT.lt);
  }
  pen(ctx, rgba(SUNLIGHT.ink, 0.6), 1.6);
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x0 + reach, y);
  ctx.stroke();
}
function sunbeamHit(ctx, z, x, y, u, e, fade) {
  ctx.save();
  ctx.globalAlpha = 0.6 * fade;
  const g = ctx.createLinearGradient(0, y - 50, 0, y + 6);
  g.addColorStop(0, rgba(SUNLIGHT.lt, 0));
  g.addColorStop(0.6, rgba(SUNLIGHT.base, 0.8));
  g.addColorStop(1, rgba(SUNLIGHT.deep, 0.9));
  ctx.fillStyle = g;
  ctx.fillRect(x, y - 50, z.w, 56);
  ctx.restore();
  for (let i = 0; i < 12; i++) sun(ctx, x + (i + 0.5) * (z.w / 12), y - 10 - Math.abs(Math.sin(e * 6 + i)) * 12, 3, fade, e * 3 + i);
}
function moonbeamWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  const hy = y - 64;
  const k = sstep(p / 0.5);
  ctx.save();
  ctx.globalAlpha = (0.2 + 0.25 * p) * k;
  const g = ctx.createLinearGradient(0, hy - 24, 0, hy + 24);
  g.addColorStop(0, rgba(MOONLIGHT.glow, 0));
  g.addColorStop(0.5, rgba(MOONLIGHT.glow, 0.9));
  g.addColorStop(1, rgba(MOONLIGHT.glow, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x, hy - 24, w, 48);
  ctx.restore();
  for (let i = 0; i < 8; i++) {
    const v = (time * 0.15 + i / 8) % 1;
    const px = (z.dir ?? 1) > 0 ? x + v * w : x + w - v * w;
    moon(ctx, px, hy + Math.sin(time * 2 + i) * 6, 4, Math.sin(Math.PI * v) * k, -0.5 + v);
  }
  word(ctx, 'stay low...', x + w / 2, hy - 34, 10, k * (0.6 + 0.4 * Math.sin(time * 4)), MOONLIGHT.ink);
}
function moonbeamHit(ctx, z, x, y, u, e, fade) {
  const hy = y - 64;
  const d = z.dir ?? 1;
  for (let i = 0; i < 10; i++) {
    const px = d > 0 ? x + ((i / 10 + e) % 1) * z.w : x + z.w - ((i / 10 + e) % 1) * z.w;
    moon(ctx, px, hy + Math.sin(e * 8 + i) * 10, 6, fade, -0.5 + e * 3);
  }
  ctx.save();
  ctx.globalAlpha = 0.4 * fade;
  pen(ctx, MOONLIGHT.lt, 3);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x, hy - 12 + i * 12);
    ctx.lineTo(x + z.w, hy - 12 + i * 12);
    ctx.stroke();
  }
  ctx.restore();
}
// ---------- Conjunction ----------
function coronaWarn(ctx, z, x, y, p, time) {
  const R = z.w / 2;
  const r0 = z.inner ?? 50;
  // the ring of sun flames on the floor round a cool shadow
  ctx.save();
  ctx.globalAlpha = 0.25 + 0.25 * p;
  ell(ctx, x, y, R, R * 0.22);
  ctx.fillStyle = SUNLIGHT.base;
  ctx.fill();
  ctx.restore();
  floorRing(ctx, x, y, r0, rgba(MOONLIGHT.deep, 0.55), rgba(MOONLIGHT.ink, 0.9), 1, 1.6);
  const k = Math.round(R / 18);
  for (let i = 0; i < k; i++) {
    const an = (i / k) * TAU + time * 0.3;
    const fx = x + Math.cos(an) * R * 0.8;
    const fy = y + Math.sin(an) * R * 0.18;
    const h = 6 + 6 * p + Math.sin(time * 9 + i) * 2;
    ctx.beginPath();
    ctx.moveTo(fx - 3, fy);
    ctx.quadraticCurveTo(fx - 3, fy - h * 0.6, fx, fy - h);
    ctx.quadraticCurveTo(fx + 3, fy - h * 0.6, fx + 3, fy);
    ctx.closePath();
    ctx.fillStyle = rgba(SUNLIGHT.deep, 0.5 + 0.4 * p);
    ctx.fill();
  }
  // overhead, the moon sliding over the sun
  const cy = y - 110;
  sun(ctx, x, cy, 16, 1, time * 0.5);
  const off = (1 - sstep(p)) * 30;
  ell(ctx, x + off, cy, 12, 12);
  ctx.fillStyle = MOONLIGHT.deep;
  ctx.fill();
  pen(ctx, MOONLIGHT.lt, 1.2);
  ctx.stroke();
  word(ctx, 'get under!', x, y - 46, 10, sstep(p / 0.3) * (0.6 + 0.4 * Math.sin(time * 5)), MOONLIGHT.ink);
}
function coronaHit(ctx, z, x, y, u, e, fade) {
  const R = z.w / 2;
  ctx.save();
  ctx.globalAlpha = 0.5 * fade;
  ell(ctx, x, y, R * (0.9 + e * 0.15), R * 0.24);
  ctx.fillStyle = SUNLIGHT.glow;
  ctx.fill();
  ctx.restore();
  const cy = y - 110;
  ell(ctx, x, cy, 16, 16);
  pen(ctx, SUNLIGHT.lt, 3 * fade);
  ctx.stroke();
  sparkle(ctx, x + 12, cy - 10, 10 * fade * (1 - e * 0.5), fade, '#ffffff');
  for (let i = 0; i < 12; i++) sun(ctx, x + Math.cos(i * 0.52) * R * (0.6 + e * 0.3), y - 8 + Math.sin(i * 0.52) * R * 0.2, 3, fade, i);
}
// ---------- Crossing ----------
function crossingWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  const d = z.dir ?? 1;
  const k = sstep(p / 0.8) * 0.5;
  // sun from one end, moon from the other, reaching for each other
  const sx = d > 0 ? x : x + w;
  const mx = d > 0 ? x + w : x;
  ctx.save();
  ctx.globalAlpha = 0.3 + 0.3 * p;
  ctx.fillStyle = SUNLIGHT.base;
  ctx.fillRect(Math.min(sx, sx + d * w * k), y - 8, w * k, 12);
  ctx.fillStyle = MOONLIGHT.base;
  ctx.fillRect(Math.min(mx, mx - d * w * k), y - 8, w * k, 12);
  ctx.restore();
  sun(ctx, sx + d * w * k, y - 14, 5, 1, time * 3);
  moon(ctx, mx - d * w * k, y - 14, 5, 1);
}
function crossingHit(ctx, z, x, y, u, e, fade) {
  for (let i = 0; i < 10; i++) {
    const v = (i / 10 + e * 0.5) % 1;
    const px = x + v * z.w;
    const py = y - 12 + Math.sin(v * TAU * 2 + e * 6) * 10;
    if (i % 2) sun(ctx, px, py, 3, fade, e * 4);
    else moon(ctx, px, y - 12 - Math.sin(v * TAU * 2 + e * 6) * 10, 3.6, fade);
  }
}
// ---------- Diamond Ring ----------
function diamondWarn(ctx, z, x, y, p, time) {
  const cx = SW / 2;
  const cy = 74;
  const k = sstep(p / 0.4);
  glow(ctx, cx, cy, 60 + 50 * p, SUNLIGHT.glow, 0.15 + 0.25 * p);
  ell(ctx, cx, cy, 22 * k, 22 * k);
  ctx.fillStyle = rgba(MOONLIGHT.deep, 0.9);
  ctx.fill();
  pen(ctx, SUNLIGHT.lt, 3);
  ctx.beginPath();
  ctx.arc(cx, cy, 24 * k, 0, TAU);
  ctx.stroke();
  // the bead of light running round the ring
  const an = -Math.PI / 4 + time * 1.5 * (1 - p);
  sparkle(ctx, cx + Math.cos(an) * 24 * k, cy + Math.sin(an) * 24 * k, 4 + 6 * p, k, '#ffffff');
}
function diamondHit(ctx, z, x, y, u, e, fade) {
  const cx = SW / 2;
  const cy = 74;
  glow(ctx, cx + 17, cy - 17, 80 + e * 300, '#ffffff', 0.7 * fade);
  sparkle(ctx, cx + 17, cy - 17, 26 * fade, fade, '#ffffff');
  for (let i = 0; i < 8; i++) {
    const an = (i / 8) * TAU;
    if (i % 2) sun(ctx, cx + Math.cos(an) * e * 300, cy + Math.sin(an) * e * 180, 4, fade, an);
    else moon(ctx, cx + Math.cos(an) * e * 300, cy + Math.sin(an) * e * 180, 5, fade);
  }
}

export const ECLIPSE_FX = {
  ecFlare: { warn: flareWarn, hit: flareHit },
  ecRipple: { warn: rippleWarn, hit: rippleHit },
  ecSunspot: { warn: spotWarn, hit: spotHit },
  ecMochi: { warn: mochiWarn, hit: mochiHit },
  ecSunbeam: { warn: sunbeamWarn, hit: sunbeamHit },
  ecMoonbeam: { warn: moonbeamWarn, hit: moonbeamHit },
  ecCorona: { warn: coronaWarn, hit: coronaHit },
  ecCrossing: { warn: crossingWarn, hit: crossingHit },
  ecDiamond: { warn: diamondWarn, hit: diamondHit },
};
// How long each landing plays (s).
export const ECLIPSE_HOLD = { ecFlare: 0.8, ecRipple: 0.6, ecSunspot: 0.6, ecMochi: 0.8, ecSunbeam: 0.8, ecMoonbeam: 0.8, ecCorona: 0.9, ecCrossing: 0.7, ecDiamond: 1.2 };
// (they draw their own floor markers: render/bossfx.js leaves out the plain one under them)
export const ECLIPSE_OWN_WARN = Object.keys(ECLIPSE_FX);
