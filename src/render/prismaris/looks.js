// Prismaris's cast looks (2026-11-27, his new fights, world/prismaris.js): each telegraph drawn whole in his
// own crystal style (no plain floor marker under it: they are on render/bossfx.js OWN_WARN), while its cast
// winds up (`warn`, p 0..1 through the warning), and in place of the plain flash as it lands (`hit`, u 0..1
// over its hold), in his colours: prism rainbows, lilac and amethyst, pale crystal, gold. render/dreamfx.js
// hands each zone with one of these looks to them (through render/bossfx.js and render/trial.js). Every
// shape is rounded and outlined in a deeper shade of its own colour; no white flashes, no specks.
// (x, y) is the zone's spot on screen (a lane's left end; the whole room's from 0); the screen is 640 x 360.
//   pmBonk      Royal Bonk (a marker following you): a lilac ring on the floor round you and a pink gem
//               bobbing over your head, the shadow of his prism growing; landing, the prism comes down,
//               BONK: a rainbow ring and a spray of little crystals
//   pmTantrum   Royal Tantrum (the whole room): little crystals trembling along the floor, a soft lilac
//               glow creeping in at the screen's edges; landing, a gentle lilac tint and crystals
//               rattling down from the ceiling
//   pmBeam      Prism Beam (a lane from him): a thin rainbow guide along the floor at chest height,
//               thickening, glints running along it; landing, a soft broad beam, white at its heart with
//               rainbow edges
//   pmGems      Royal Gems (a marker following you): crystal sprouts pushing up in a ring round you;
//               landing, a cluster of crystals bursting up and crumbling into sparkles
//   pmPortrait  Royal Portrait (a marker to share): a gilded portrait frame standing round you, a little
//               crown on top; landing, the frame shimmers and sparkles (never a camera's white flash)
//   pmRefract   Refraction (rainbow columns): a great prism under the ceiling, a faint ray of its colour
//               to each column's spot, a tinted patch on the floor; landing, a column of that colour's light
//   pmMirror    Mirror, Mirror (a sweep to one wall): a crystal mirror pane standing at the wall it
//               sweeps to, chevrons of light running along the floor the way it will go; landing, the beam
//               sweeping across
import { TAU, clamp, sstep, hash, ell, rgba, glow, smoothPath, RAINBOW, PRISM, shard } from './art.js';

const SW = 640;
const LILAC = ['#fbf8ff', '#e4daff', '#b8a4f0', '#8a70d0'];
const INK = '#7a62c0';
const GOLDS = ['#fff4c4', '#f6d06e', '#d6a23e', '#a8762c'];
const ease = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;

// The game's curvy four-point sparkle.
function sparkle(ctx, x, y, s, al = 1, col = '#ffffff') {
  if (al <= 0.01 || s <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= clamp(al, 0, 1);
  glow(ctx, x, y, s * 1.8, col, 0.4);
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x + s * 0.18, y - s * 0.18, x + s, y);
  ctx.quadraticCurveTo(x + s * 0.18, y + s * 0.18, x, y + s);
  ctx.quadraticCurveTo(x - s * 0.18, y + s * 0.18, x - s, y);
  ctx.quadraticCurveTo(x - s * 0.18, y - s * 0.18, x, y - s);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
// A soft ring on the floor, filling inward as `p` grows.
function floorRing(ctx, x, y, r, p, col, al = 1) {
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 0.2);
  ctx.fillStyle = rgba(col[2], 0.16 + 0.16 * p);
  ctx.fill();
  ell(ctx, x, y, r * p, r * 0.2 * p);
  ctx.fillStyle = rgba(col[1], 0.3);
  ctx.fill();
  ell(ctx, x, y, r, r * 0.2);
  ctx.strokeStyle = rgba(col[3], 0.85);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}
// A faceted gem (rounded octagon), tinted from PRISM[c].
function gem(ctx, x, y, r, c, al = 1) {
  if (al <= 0.01) return;
  const [lt, base, dk] = PRISM[c % PRISM.length];
  ctx.save();
  ctx.globalAlpha *= al;
  const pts = Array.from({ length: 8 }, (_, i) => {
    const an = (i / 8) * TAU + Math.PI / 8;
    return [x + Math.cos(an) * r, y + Math.sin(an) * r * 1.1];
  });
  smoothPath(ctx, pts);
  ctx.strokeStyle = dk;
  ctx.lineWidth = Math.max(0.6, r * 0.2);
  ctx.stroke();
  const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  g.addColorStop(0, lt);
  g.addColorStop(0.5, base);
  g.addColorStop(1, dk);
  ctx.fillStyle = g;
  ctx.fill();
  ell(ctx, x - r * 0.35, y - r * 0.4, r * 0.3, r * 0.22);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
  ctx.restore();
}
// His sceptre's round prism (screen px), as a big falling thing.
function bigPrism(ctx, x, y, r, al = 1, shine = 0.5) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  const pts = Array.from({ length: 8 }, (_, i) => {
    const an = (i / 8) * TAU + Math.PI / 8;
    return [x + Math.cos(an) * r, y + Math.sin(an) * r * 1.08];
  });
  smoothPath(ctx, pts);
  ctx.strokeStyle = '#7a9ad8';
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.stroke();
  ctx.fillStyle = '#e8f4ff';
  ctx.fill();
  ctx.save();
  smoothPath(ctx, pts);
  ctx.clip();
  const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  RAINBOW.forEach((c, i) => g.addColorStop(i / (RAINBOW.length - 1), rgba(c, 0.55)));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r * 1.2, r * 2, r * 2.4);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.7, y - r * 0.3);
  ctx.lineTo(x - r * 0.1, y - r * 0.95);
  ctx.lineTo(x + r * 0.25, y - r * 0.4);
  ctx.lineTo(x - r * 0.3, y + r * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  glow(ctx, x, y, r * 1.8, '#f4ecff', 0.25 + shine * 0.35);
  ctx.restore();
}
// A rainbow ring bursting outward.
function rainbowRing(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  RAINBOW.forEach((c, i) => {
    ell(ctx, x, y, r - i * 1.4, (r - i * 1.4) * 0.36);
    ctx.strokeStyle = rgba(c, 0.8 * al);
    ctx.lineWidth = 1.3;
    ctx.stroke();
  });
  ctx.restore();
}

// ---------- Royal Bonk ----------
function bonkWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, p, LILAC);
  // the falling prism's shadow, growing
  ell(ctx, x, y, r * 0.5 * (0.3 + 0.7 * p), 3 * (0.3 + 0.7 * p));
  ctx.fillStyle = rgba('#5a4290', 0.22 + 0.2 * p);
  ctx.fill();
  // the gem marker bobbing over their head
  const bob = Math.sin(time * 5) * 2;
  gem(ctx, x, y - 70 + bob, 5 + p * 1.6, 2, 0.95);
  sparkle(ctx, x + 6, y - 76 + bob, 1.6 + Math.sin(time * 7) * 0.6, 0.9);
  if (z.echo) gem(ctx, x + 10, y - 64 + bob, 3.4, 1, 0.8);
  // the prism itself, high above, lowering in the last of the cast
  const k = sstep((p - 0.55) / 0.45);
  if (k > 0) bigPrism(ctx, x, y - 150 + 60 * k, 9, k, k);
}
function bonkHit(ctx, z, x, y, u, e, fade) {
  const drop = clamp(u / 0.18, 0, 1);
  bigPrism(ctx, x, y - 90 + 80 * ease(drop), 10, u < 0.5 ? 1 : fade, 1);
  if (u > 0.15) {
    const v = (u - 0.15) / 0.85;
    rainbowRing(ctx, x, y - 2, 10 + v * 36, 1 - v);
    for (let i = 0; i < 7; i++) {
      const an = Math.PI + (i / 6) * Math.PI;
      shard(ctx, x + Math.cos(an) * (6 + v * 26), y - 4 + Math.sin(an) * (4 + v * 22) + v * v * 18, 3 * (1 - v * 0.5), an + Math.PI / 2, i, 1 - v);
    }
    sparkle(ctx, x, y - 12, 9 * Math.sin(Math.PI * clamp(v * 1.6, 0, 1)), 1);
  }
}

// ---------- Royal Tantrum ----------
function tantrumWarn(ctx, z, x, y, p, time) {
  // a soft lilac glow creeping in at the edges
  const g = ctx.createRadialGradient(SW / 2, 180, 140, SW / 2, 180, 380);
  g.addColorStop(0, 'rgba(184,164,240,0)');
  g.addColorStop(1, `rgba(150,120,220,${0.1 + 0.14 * p})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SW, 360);
  // little crystals trembling along the floor
  for (let i = 0; i < 12; i++) {
    const sx = ((i + 0.5) / 12) * SW + (hash(i * 3.1) - 0.5) * 24;
    const sh = Math.sin(time * (26 + i)) * (0.6 + 1.6 * p);
    shard(ctx, sx + sh, y + 0.5, 2.6 + hash(i) * 1.6, sh * 0.06, i, 0.5 + 0.5 * p);
  }
}
function tantrumHit(ctx, z, x, y, u, e, fade) {
  // a gentle tint, never a flash
  ctx.fillStyle = `rgba(184,164,240,${0.14 * fade})`;
  ctx.fillRect(0, 0, SW, 360);
  for (let i = 0; i < 14; i++) {
    const sx = ((i + 0.5) / 14) * SW + (hash(i * 7.7) - 0.5) * 30;
    const t0 = hash(i * 2.3) * 0.35;
    const v = clamp((u - t0) / 0.55, 0, 1);
    if (v <= 0 || v >= 1) continue;
    const yy = -10 + (y + 10) * v * v;
    shard(ctx, sx, yy, 3 + hash(i) * 2, Math.PI + (hash(i * 5) - 0.5) * 0.8, i, 1 - sstep((v - 0.85) / 0.15));
    if (v > 0.9) sparkle(ctx, sx, y - 3, 3, (1 - v) * 10);
  }
}

// ---------- Prism Beam (and Mirror, Mirror's sweeps) ----------
function beamBand(ctx, x0, w, y, h, al) {
  if (al <= 0.01 || w <= 0) return;
  const top = y - 26 - h / 2;
  const g = ctx.createLinearGradient(0, top, 0, top + h);
  RAINBOW.forEach((c, i) => {
    const at = i / (RAINBOW.length - 1);
    g.addColorStop(at * 0.4, rgba(c, 0.7 * al));
  });
  g.addColorStop(0.45, `rgba(255,255,255,${0.75 * al})`);
  g.addColorStop(0.55, `rgba(255,255,255,${0.75 * al})`);
  RAINBOW.slice().reverse().forEach((c, i) => g.addColorStop(0.6 + (i / (RAINBOW.length - 1)) * 0.4, rgba(c, 0.7 * al)));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x0, top, w, h, h / 2);
  ctx.fill();
}
function beamWarn(ctx, z, x, y, p, time) {
  // the floor band tinted
  ctx.fillStyle = `rgba(184,164,240,${0.12 + 0.12 * p})`;
  ctx.beginPath();
  ctx.roundRect(x, y - 6, z.w, 8, 4);
  ctx.fill();
  // a thin rainbow guide at chest height, thickening
  beamBand(ctx, x, z.w, y, 2 + 5 * p, 0.35 + 0.4 * p);
  // glints running along it, the way it will fire
  const d = z.dir ?? 1;
  for (let i = 0; i < 6; i++) {
    const f = (time * 0.9 + i / 6) % 1;
    const sx = d > 0 ? x + f * z.w : x + z.w - f * z.w;
    sparkle(ctx, sx, y - 26, 1.6 + p, 0.7 * Math.sin(Math.PI * f));
  }
}
function beamHit(ctx, z, x, y, u, e, fade) {
  const d = z.dir ?? 1;
  const reach = ease(u / 0.25) * z.w;
  const x0 = d > 0 ? x : x + z.w - reach;
  beamBand(ctx, x0, reach, y, 20 * (1 - u * 0.4), fade);
  for (let i = 0; i < 5; i++) {
    const sx = x0 + hash(i * 3.3) * reach;
    sparkle(ctx, sx, y - 26 + (hash(i) - 0.5) * 14, 2.6 * fade, fade);
  }
}

// ---------- Royal Gems ----------
function gemsWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, p, ['#f4fbff', '#cfefff', '#9ad0f0', '#5aa0d0']);
  for (let i = 0; i < 6; i++) {
    const an = (i / 6) * TAU + 0.3;
    const sx = x + Math.cos(an) * r * 0.75;
    const sy = y + Math.sin(an) * r * 0.15;
    shard(ctx, sx, sy, 1 + 2.4 * ease(p) + Math.sin(time * 9 + i) * 0.3, Math.cos(an) * 0.4, i, 0.85);
  }
  const bob = Math.sin(time * 5 + 1) * 2;
  gem(ctx, x, y - 70 + bob, 4.4, 1, 0.9);
}
function gemsHit(ctx, z, x, y, u, e, fade) {
  const up = sstep(u / 0.2);
  const crumble = sstep((u - 0.55) / 0.45);
  for (let i = 0; i < 7; i++) {
    const dx = (i - 3) * (z.w / 8);
    const h = (9 + (3 - Math.abs(i - 3)) * 4) * up;
    shard(ctx, x + dx, y + 1 + crumble * 6, h / 1.8, (i - 3) * 0.16, i, 1 - crumble);
  }
  for (let i = 0; i < 5; i++) sparkle(ctx, x + (hash(i * 4.1) - 0.5) * z.w, y - 10 - hash(i) * 26 * e, 2.4 * fade, fade);
}

// ---------- Royal Portrait ----------
function frame(ctx, x, y, w, h, al) {
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h, w, h, 10);
  ctx.strokeStyle = GOLDS[3];
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.strokeStyle = GOLDS[1];
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.strokeStyle = GOLDS[0];
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(x - w / 2 - 1.2, y - h - 1.2, w + 2.4, h + 2.4, 11);
  ctx.stroke();
  // round gems at its corners, a little crown on top
  for (const [cx, cy] of [[x - w / 2, y - h], [x + w / 2, y - h], [x - w / 2, y], [x + w / 2, y]]) gem(ctx, cx, cy, 3.4, 2, 1);
  const cx = x;
  const cy = y - h - 4;
  ctx.beginPath();
  ctx.moveTo(cx - 9, cy + 3);
  ctx.lineTo(cx - 9, cy - 4);
  ctx.quadraticCurveTo(cx - 6, cy - 1, cx - 4, cy - 6);
  ctx.quadraticCurveTo(cx - 2, cy - 1, cx, cy - 8);
  ctx.quadraticCurveTo(cx + 2, cy - 1, cx + 4, cy - 6);
  ctx.quadraticCurveTo(cx + 6, cy - 1, cx + 9, cy - 4);
  ctx.lineTo(cx + 9, cy + 3);
  ctx.closePath();
  ctx.fillStyle = GOLDS[1];
  ctx.fill();
  ctx.strokeStyle = GOLDS[3];
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}
function portraitWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  const h = 96;
  // the inside: a soft gilded wash rising as it counts down
  const g = ctx.createLinearGradient(0, y - h, 0, y);
  g.addColorStop(0, 'rgba(255,244,196,0)');
  g.addColorStop(1, `rgba(255,232,170,${0.12 + 0.22 * p})`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h * p, w, h * p, 8);
  ctx.fill();
  frame(ctx, x, y, w, h, 0.4 + 0.6 * sstep(p / 0.2));
  for (let i = 0; i < 3; i++) {
    const f = (time * 0.6 + i / 3) % 1;
    sparkle(ctx, x - w / 2 + 4 + f * (w - 8), y - h - 2, 1.8, Math.sin(Math.PI * f));
  }
}
function portraitHit(ctx, z, x, y, u, e, fade) {
  frame(ctx, x, y, z.w, 96, fade);
  ctx.fillStyle = `rgba(255,240,200,${0.3 * (1 - e)})`;
  ctx.beginPath();
  ctx.roundRect(x - z.w / 2, y - 96, z.w, 96, 8);
  ctx.fill();
  for (let i = 0; i < 8; i++) {
    const an = (i / 8) * TAU;
    sparkle(ctx, x + Math.cos(an) * (10 + e * 50), y - 48 + Math.sin(an) * (8 + e * 40), 3 * fade, fade, RAINBOW[i % 6]);
  }
}

// ---------- Refraction ----------
function refractWarn(ctx, z, x, y, p, time) {
  const c = z.colour ?? 0;
  const col = RAINBOW[[0, 1, 2, 4, 5][c] ?? 0];
  const top = 24;
  const prX = x + ((z.px ?? z.x) - z.x);
  // a faint ray of its colour from the prism to its spot
  ctx.save();
  ctx.globalAlpha *= 0.25 + 0.45 * p;
  const g = ctx.createLinearGradient(0, top, 0, y);
  g.addColorStop(0, rgba(col, 0.2));
  g.addColorStop(1, rgba(col, 0.55));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(prX - 2, top);
  ctx.lineTo(prX + 2, top);
  ctx.lineTo(x + (z.w / 2) * p, y);
  ctx.lineTo(x - (z.w / 2) * p, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // a tinted patch on the floor
  ell(ctx, x, y, z.w / 2, 5);
  ctx.fillStyle = rgba(col, 0.25 + 0.3 * p);
  ctx.fill();
  ctx.strokeStyle = rgba(col, 0.9);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // the great prism (drawn by the middle column)
  if (c === 2) bigPrism(ctx, prX, top + Math.sin(time * 2) * 2, 9 + 3 * p, 0.6 + 0.4 * sstep(p / 0.2), p);
}
function refractHit(ctx, z, x, y, u, e, fade) {
  const c = z.colour ?? 0;
  const col = RAINBOW[[0, 1, 2, 4, 5][c] ?? 0];
  const w = z.w * (0.6 + 0.4 * ease(u / 0.2));
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, rgba(col, 0));
  g.addColorStop(0.3, rgba(col, 0.6 * fade));
  g.addColorStop(0.5, `rgba(255,255,255,${0.7 * fade})`);
  g.addColorStop(0.7, rgba(col, 0.6 * fade));
  g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - w / 2, 0, w, y + 2);
  for (let i = 0; i < 4; i++) sparkle(ctx, x + (hash(i * 9 + c) - 0.5) * w * 0.6, y - 20 - hash(i + c) * 140 * e, 2.4 * fade, fade);
  ell(ctx, x, y, w / 2, 4);
  ctx.fillStyle = rgba(col, 0.5 * fade);
  ctx.fill();
}

// ---------- Mirror, Mirror ----------
function mirrorPane(ctx, x, y, al, time) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  const w = 26;
  const h = 96;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h, w, h, [13, 13, 4, 4]);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.stroke();
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, '#f4f8ff');
  g.addColorStop(0.5, '#cfe2ff');
  g.addColorStop(1, '#a8c4f4');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // a shimmer sliding up it
  const f = (time * 0.5) % 1;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h * f);
  ctx.lineTo(x + w / 2, y - h * f - 14);
  ctx.lineTo(x + w / 2, y - h * f - 22);
  ctx.lineTo(x - w / 2, y - h * f - 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  gem(ctx, x, y - h - 2, 4, 2, 1);
  ctx.restore();
}
function mirrorWarn(ctx, z, x, y, p, time) {
  const d = z.dir ?? 1;
  const end = d > 0 ? x + z.w : x;
  mirrorPane(ctx, d > 0 ? end - 14 : end + 14, y, sstep(p / 0.25), time);
  ctx.fillStyle = `rgba(184,164,240,${0.1 + 0.12 * p})`;
  ctx.beginPath();
  ctx.roundRect(x, y - 6, z.w, 8, 4);
  ctx.fill();
  // chevrons of light running the way it will sweep
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let sx = 0; sx < z.w; sx += 30) {
    const f = ((time * 1.6 + sx / 30) % 1);
    const cx = d > 0 ? x + sx + f * 30 : x + z.w - sx - f * 30;
    if (cx < x || cx > x + z.w) continue;
    ctx.strokeStyle = rgba(RAINBOW[Math.floor(sx / 30) % 6], (0.4 + 0.5 * p) * Math.sin(Math.PI * f));
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 4 * d, y - 22);
    ctx.lineTo(cx, y - 16);
    ctx.lineTo(cx - 4 * d, y - 10);
    ctx.stroke();
  }
}
function mirrorHit(ctx, z, x, y, u, e, fade, time) {
  beamHit(ctx, z, x, y, u, e, fade);
  const d = z.dir ?? 1;
  mirrorPane(ctx, d > 0 ? x + z.w - 14 : x + 14, y, fade, time);
}

// An echo or a bounce (it lands after the first) shows faint until its own turn comes, so the order reads.
const soon = (z) => (z.echo || z.bounce ? 0.3 + 0.7 * sstep((1.6 - (z.warn - (z.t ?? 0))) / 0.6) : 1);
const inTurn = (f) => (ctx, z, x, y, p, time) => {
  ctx.globalAlpha *= soon(z);
  f(ctx, z, x, y, p, time);
};
export const PRISMARIS_FX = {
  pmBonk: { warn: inTurn(bonkWarn), hit: bonkHit },
  pmTantrum: { warn: inTurn(tantrumWarn), hit: tantrumHit },
  pmBeam: { warn: inTurn(beamWarn), hit: beamHit },
  pmGems: { warn: inTurn(gemsWarn), hit: gemsHit },
  pmPortrait: { warn: inTurn(portraitWarn), hit: portraitHit },
  pmRefract: { warn: inTurn(refractWarn), hit: refractHit },
  pmMirror: { warn: inTurn(mirrorWarn), hit: mirrorHit },
};
// How long each landing plays (s): the same as world/prismaris.js keeps each zone.
export const PRISMARIS_LOOK_HOLD = { pmBonk: 0.8, pmTantrum: 1, pmBeam: 0.8, pmGems: 0.9, pmPortrait: 0.9, pmRefract: 1, pmMirror: 0.8 };
// (they draw their own floor markers: render/bossfx.js leaves out the plain one under them)
export const PRISMARIS_OWN_WARN = Object.keys(PRISMARIS_FX);
