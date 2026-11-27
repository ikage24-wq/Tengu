// Gretel's cast looks (2026-11-27, her new fight, world/volcano.js): each telegraph drawn whole in her own
// bakery style (no plain floor marker under it: they are on render/bossfx.js OWN_WARN), while its cast
// winds up (`warn`, p 0..1 through the warning), and in place of the plain flash as it lands (`hit`, u 0..1
// over its hold): piped icing, gingerbread crumbs (soft rounded nubs), gumdrops, mint fondant, tin
// cookie cutters, the oven's warm glow. render/dreamfx.js hands each zone with one of these looks to them.
// Every shape rounded, outlined in a deeper shade of its own colour, eased.
//   grSmack    Spatula Smack (the tank's marker): the spatula's long shadow swinging over, a piped
//              icing ring on the floor; landing, a flat SMACK, crumbs and an icing splat
//   grButtons  Gumdrop Buttons (a marker on each of you: spread): a gumdrop bouncing in high arcs over
//              you, its colour ring on the floor; landing, it squashes into a sugary puff
//   grIcing    Royal Icing (a stack): a great piping-bag swirl of icing coiling down over the marker,
//              little sugar pearls for the guests it needs; landing, a soft-serve splat and sparkles
//   grBash     Heartcutter Bash (the floor in front of her): hearts of light marching out along it;
//              landing, a row of heart outlines bursting into crumbs
//   grRoll     Roll Out! (everywhere but inside the cutters): the dough rolled out flat over the
//              floor, a rolling pin rolling across; landing, the dough puffing up
//   grPress    Press! (inside the cutters): the cutters glinting, lifted, shadows under them; landing,
//              the cutters stamp down: CHOMP
//   grHeat     Preheat! (everyone): the oven's warm glow and rising heat lines over the whole wall;
//              landing, a warm flash and the oven's DING!
// Also her cookie cutters standing on the floor (drawGretelCutters, from render/volcano.js).

import { glow, pen, sparkle, ell, hash, sstep, clamp, TAU } from './fx.js';

const SW = 640;
const ICING = ['#ffffff', '#fdf6f0', '#e8dcea'];
const PINK = ['#ffd6e6', '#ff9ec4', '#e872a0', '#b84a7a'];
const MINT = ['#e4fff4', '#a8ecd2', '#72c8ac', '#4c9e86'];
const TIN = ['#f6f4fc', '#d4d0e6', '#a8a2c4', '#7c769c'];
const COOKIE = ['#f4c48e', '#dc9a5c', '#bc7640', '#96562a'];
const DOUGH = ['#f8d8a8', '#e8b47a', '#c48a52'];
const GUMS = [['#ff8a8a', '#e8404e', '#b02a3c'], ['#fff0a0', '#f6c94e', '#c89a2c'], ['#c8f490', '#7ccc4a', '#4e9a2e'], ['#c8b8ff', '#9a7ae8', '#6a4ab8']];
const ease = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;

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
// A piped icing ring on the floor: a soft wavy line round an ellipse.
function pipedRing(ctx, x, y, rx, al, col = ICING[0], rim = '#c8b8d8', w = 2.4) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  const n = Math.max(24, Math.round(rx * 0.9));
  for (let i = 0; i <= n; i++) {
    const an = (i / n) * TAU;
    const r = rx + Math.sin(an * Math.round(rx / 6)) * 1.6;
    const px = x + Math.cos(an) * r;
    const py = y + Math.sin(an) * r * 0.26;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.lineJoin = 'round';
  pen(ctx, rim, w + 1.2);
  ctx.stroke();
  pen(ctx, col, w);
  ctx.stroke();
  ctx.restore();
}
function crumb(ctx, x, y, s, ang, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  const P = [[-s, -s * 0.5], [-s * 0.2, -s * 0.9], [s * 0.9, -s * 0.4], [s * 0.8, s * 0.6], [-s * 0.4, s * 0.8]];
  for (let i = 0; i < P.length; i++) {
    const a = P[i];
    const b = P[(i + 1) % P.length];
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (!i) ctx.moveTo(m[0], m[1]);
    const c = P[(i + 1) % P.length];
    const d = P[(i + 2) % P.length];
    ctx.quadraticCurveTo(c[0], c[1], (c[0] + d[0]) / 2, (c[1] + d[1]) / 2);
  }
  ctx.closePath();
  ctx.fillStyle = COOKIE[1];
  ctx.fill();
  pen(ctx, COOKIE[3], Math.max(0.6, s * 0.25));
  ctx.stroke();
  ctx.restore();
}
function gumdrop(ctx, x, y, s, col, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x - s, y + s * 0.6);
  ctx.quadraticCurveTo(x - s * 0.95, y - s * 0.9, x, y - s);
  ctx.quadraticCurveTo(x + s * 0.95, y - s * 0.9, x + s, y + s * 0.6);
  ctx.quadraticCurveTo(x, y + s * 0.9, x - s, y + s * 0.6);
  ctx.closePath();
  ctx.fillStyle = col[1];
  ctx.fill();
  pen(ctx, col[2], Math.max(0.8, s * 0.18));
  ctx.stroke();
  ell(ctx, x - s * 0.35, y - s * 0.3, s * 0.22, s * 0.32, -0.3);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();
  ctx.restore();
}
function puff(ctx, x, y, r, al, c0 = '#fff6ea', c1 = '#e6c49a') {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  for (const [dx, dy, s] of [[0, 0, 1], [-0.9, 0.25, 0.7], [0.9, 0.2, 0.75], [0.2, -0.6, 0.65]]) {
    ctx.moveTo(x + dx * r + s * r, y + dy * r);
    ctx.arc(x + dx * r, y + dy * r, s * r, 0, TAU);
  }
  pen(ctx, c1, Math.max(0.8, r * 0.18));
  ctx.stroke();
  ctx.fillStyle = c0;
  ctx.fill();
  ctx.restore();
}
function heart(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.3, y + s * 0.1, x - s * 1.1, y - s * 1.05, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 1.1, y - s * 1.05, x + s * 1.3, y + s * 0.1, x, y + s * 0.9);
  ctx.closePath();
}
function word(ctx, text, x, y, size, col, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.font = `900 ${size}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#fffaf6';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = col;
  ctx.fillText(text, x, y);
  ctx.restore();
}
// A cookie cutter standing on the floor (seen from a low angle: its outline squashed flat, the tin wall
// standing up round it): 'heart', 'star' or 'man'. (x, y) its middle on the floor, `r` its half width.
function cutterShape(ctx, kind, x, y, r) {
  ctx.beginPath();
  const fy = 0.3;
  if (kind === 'heart') {
    ctx.moveTo(x + r * 0.9, y + r * fy * 0.1);
    ctx.bezierCurveTo(x + r * 1.1, y - r * fy * 1.1, x + r * 0.2, y - r * fy * 1.2, x, y - r * fy * 0.5);
    ctx.bezierCurveTo(x - r * 0.2, y - r * fy * 1.2, x - r * 1.1, y - r * fy * 1.1, x - r * 0.9, y + r * fy * 0.1);
    ctx.quadraticCurveTo(x - r * 0.5, y + r * fy * 0.9, x, y + r * fy * 1.1);
    ctx.quadraticCurveTo(x + r * 0.5, y + r * fy * 0.9, x + r * 0.9, y + r * fy * 0.1);
  } else if (kind === 'star') {
    for (let i = 0; i < 10; i++) {
      const an = -Math.PI / 2 + (i / 10) * TAU;
      const rr = i % 2 ? r * 0.5 : r;
      const px = x + Math.cos(an) * rr;
      const py = y + Math.sin(an) * rr * fy;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
  } else {
    // a little gingerbread person: a round head, arms out, legs apart (flat on the floor)
    const P = [[0, -1], [0.3, -0.85], [0.28, -0.55], [0.95, -0.35], [0.9, -0.05], [0.35, -0.08], [0.6, 0.85], [0.3, 0.95], [0, 0.4], [-0.3, 0.95], [-0.6, 0.85], [-0.35, -0.08], [-0.9, -0.05], [-0.95, -0.35], [-0.28, -0.55], [-0.3, -0.85]];
    P.forEach(([u, v], i) => (i ? ctx.lineTo(x + u * r, y + v * r * fy) : ctx.moveTo(x + u * r, y + v * r * fy)));
  }
  ctx.closePath();
}
export function cutterArt(ctx, kind, x, y, r, lift = 0, al = 1, glint = 0) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.lineJoin = 'round';
  // its shadow on the floor
  if (lift > 0.5) {
    ctx.save();
    ctx.globalAlpha *= 0.25;
    cutterShape(ctx, kind, x, y, r);
    ctx.fillStyle = '#5a3a4a';
    ctx.fill();
    ctx.restore();
  }
  const top = y - lift - 9;
  // the tin wall: the shape at the floor and again at its top edge, joined
  cutterShape(ctx, kind, x, y - lift, r);
  pen(ctx, TIN[3], 3.4);
  ctx.stroke();
  pen(ctx, TIN[2], 2.2);
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha *= 0.85;
  for (let k = 1; k <= 3; k++) {
    cutterShape(ctx, kind, x, y - lift - k * 3, r);
    pen(ctx, k === 3 ? TIN[0] : TIN[1], k === 3 ? 2 : 2.6);
    ctx.stroke();
  }
  ctx.restore();
  cutterShape(ctx, kind, x, top, r);
  pen(ctx, TIN[3], 0.8);
  ctx.stroke();
  if (glint > 0.01) sparkle(ctx, x + r * 0.5, top - 2, 4 * glint, glint, '#ffffff');
  ctx.restore();
}

function smackWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  pipedRing(ctx, x, y, r * (1.15 - 0.15 * p), 0.5 + 0.5 * p);
  // the spatula's long shadow swinging over
  ctx.save();
  ctx.globalAlpha = 0.15 + 0.35 * p;
  ctx.translate(x, y);
  ctx.rotate(-0.6 + 0.6 * ease(p));
  ell(ctx, 0, 0, r * 0.9, r * 0.12);
  ctx.fillStyle = '#6a4a6a';
  ctx.fill();
  ctx.restore();
  for (let i = 0; i < 4; i++) sparkle(ctx, x + Math.cos(time * 2 + i * 1.6) * r * 0.8, y - 6 + Math.sin(time * 2 + i * 1.6) * r * 0.2, 1.6 + 1.6 * p, 0.4 + 0.6 * p, '#fff6fa');
}
function smackHit(ctx, z, x, y, u, e, fade, time) {
  glow(ctx, x, y - 8, 36, '#fff0f6', 0.5 * fade);
  // an icing splat
  ctx.save();
  ctx.globalAlpha *= fade;
  ctx.beginPath();
  for (let i = 0; i <= 16; i++) {
    const an = (i / 16) * TAU;
    const rr = z.w * 0.4 * (0.5 + 0.5 * e) * (1 + 0.18 * Math.sin(an * 5));
    const px = x + Math.cos(an) * rr;
    const py = y + Math.sin(an) * rr * 0.24;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = ICING[0];
  ctx.fill();
  pen(ctx, '#d8c8e0', 1.2);
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 7; i++) {
    const an = -Math.PI + (i / 6) * Math.PI;
    crumb(ctx, x + Math.cos(an) * (6 + e * 34), y - 6 + Math.sin(an) * (6 + e * 24) + u * u * 20, 2.6, i + u * 6, fade);
  }
  if (u < 0.7) word(ctx, 'SMACK!', x, y - 46 - e * 6, 13, PINK[3], fade);
}
function buttonsWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  const col = GUMS[Math.floor(hash(z.x * 0.01 + (z.target?.length ?? 0)) * 4) % 4];
  floorRing(ctx, x, y, r, 'rgba(255,255,255,0.15)', col[2], 0.4 + 0.5 * p, 1.8);
  // a gumdrop bouncing in high arcs over you, the bounces getting lower as it comes
  const b = (time * 2.4) % 1;
  const h = 90 * (1 - p * 0.8) * Math.sin(Math.PI * b);
  gumdrop(ctx, x, y - 8 - h, 5 + 2 * p, col, 0.9);
  ctx.save();
  ctx.globalAlpha = 0.25 * p;
  ell(ctx, x, y, 8, 2);
  ctx.fillStyle = col[2];
  ctx.fill();
  ctx.restore();
}
function buttonsHit(ctx, z, x, y, u, e, fade, time) {
  const col = GUMS[Math.floor(hash(z.x * 0.01 + (z.target?.length ?? 0)) * 4) % 4];
  puff(ctx, x, y - 6, 6 + e * 10, fade, '#fffaf4', col[2]);
  for (let i = 0; i < 6; i++) sparkle(ctx, x + Math.cos(i * 1.05) * (4 + e * 20), y - 10 + Math.sin(i * 1.05) * (3 + e * 10), 2.4 * (1 - u), fade, col[0]);
}
function icingWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  pipedRing(ctx, x, y, r, 0.6 + 0.4 * p, PINK[0], PINK[2], 2.6);
  // a piping-bag swirl coiling down over the marker
  const top = y - 140 + 60 * ease(p);
  const turns = 3 + 2 * p;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 60; i++) {
    const u = i / 60;
    const an = u * turns * TAU + time * 3;
    const rr = (r * 0.5) * (1 - u * 0.75);
    const px = x + Math.cos(an) * rr;
    const py = top + u * 46 + Math.sin(an) * rr * 0.25;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.globalAlpha = 0.5 + 0.5 * p;
  pen(ctx, PINK[2], 5);
  ctx.stroke();
  pen(ctx, PINK[0], 3.4);
  ctx.stroke();
  ctx.restore();
  const need = z.need ?? 2;
  for (let i = 0; i < need; i++) {
    ell(ctx, x + (i - (need - 1) / 2) * 12, top - 12, 2.6, 2.6);
    ctx.fillStyle = clamp(p * need - i, 0, 1) > 0.5 ? '#ffffff' : 'rgba(255,255,255,0.4)';
    ctx.fill();
    pen(ctx, PINK[2], 1);
    ctx.stroke();
  }
}
function icingHit(ctx, z, x, y, u, e, fade, time) {
  // a soft-serve splat of icing, three tiers sinking
  for (let i = 0; i < 3; i++) {
    ell(ctx, x, y - 4 - i * 7 * (1 - e * 0.6), (z.w * 0.42 - i * 9) * (0.6 + 0.4 * e), 6 - i);
    ctx.save();
    ctx.globalAlpha *= fade;
    ctx.fillStyle = i % 2 ? '#ffffff' : PINK[0];
    ctx.fill();
    pen(ctx, PINK[2], 1.2);
    ctx.stroke();
    ctx.restore();
  }
  for (let i = 0; i < 5; i++) sparkle(ctx, x + (i - 2) * 14, y - 30 - Math.sin(Math.PI * clamp(e + i * 0.1, 0, 1)) * 16, 3 * (1 - u * 0.5), fade, '#ffffff');
}
function bashWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  ctx.save();
  ctx.globalAlpha = 0.2 + 0.3 * p;
  ctx.fillStyle = PINK[0];
  ctx.beginPath();
  ctx.roundRect(x, y - 10, w, 12, 6);
  ctx.fill();
  ctx.restore();
  // hearts of light marching out along it, the way she'll shove (z.dir)
  const n = Math.max(3, Math.floor(w / 40));
  for (let i = 0; i < n; i++) {
    const ph = ((i / n) + time * 0.7) % 1;
    const u = z.dir < 0 ? 1 - ph : ph;
    ctx.save();
    ctx.globalAlpha = (0.4 + 0.5 * p) * Math.sin(Math.PI * ph);
    heart(ctx, x + u * w, y - 16, 5 + 3 * p);
    pen(ctx, PINK[2], 1.6);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,214,230,0.5)';
    ctx.fill();
    ctx.restore();
  }
}
function bashHit(ctx, z, x, y, u, e, fade, time) {
  const w = z.w;
  const n = Math.max(3, Math.floor(w / 36));
  for (let i = 0; i < n; i++) {
    const px = x + ((i + 0.5) / n) * w;
    ctx.save();
    ctx.globalAlpha *= fade;
    heart(ctx, px, y - 14 - e * 8, 6 + e * 4);
    pen(ctx, PINK[2], 1.8);
    ctx.stroke();
    ctx.restore();
    crumb(ctx, px + 4, y - 6 - e * 14 + u * u * 16, 2, i + u * 5, fade);
  }
}
function rollWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  // the dough rolled out flat along the floor, a little thicker as it comes
  ctx.save();
  ctx.globalAlpha = 0.45 + 0.4 * p;
  ctx.beginPath();
  ctx.roundRect(x, y - 3 - 5 * p, w, 6 + 5 * p, 4);
  ctx.fillStyle = DOUGH[0];
  ctx.fill();
  pen(ctx, DOUGH[2], 1.4);
  ctx.stroke();
  ctx.restore();
  // a rolling pin rolling back and forth over it
  const ph = (Math.sin(time * 2.2 + x * 0.01) + 1) / 2;
  const px = x + 12 + ph * Math.max(0, w - 24);
  ctx.save();
  ctx.globalAlpha = 0.6 + 0.4 * p;
  ctx.beginPath();
  ctx.roundRect(px - 14, y - 20 - 5 * p, 28, 10, 5);
  ctx.fillStyle = '#f0c894';
  ctx.fill();
  pen(ctx, '#a8703c', 1.2);
  ctx.stroke();
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.roundRect(px + s * 14 + (s < 0 ? -6 : 0), y - 17 - 5 * p, 6, 4, 2);
    ctx.fillStyle = '#e8a8c0';
    ctx.fill();
  }
  ctx.restore();
}
function rollHit(ctx, z, x, y, u, e, fade, time) {
  const w = z.w;
  const n = Math.max(2, Math.floor(w / 34));
  for (let i = 0; i < n; i++) puff(ctx, x + ((i + 0.5) / n) * w, y - 6 - e * 10, 5 + e * 5, fade, DOUGH[0], DOUGH[2]);
}
function pressWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(255,160,190,0.18)', PINK[2], 0.4 + 0.5 * p, 1.6);
  // (the cutter itself is drawn standing in the room: it lifts and glints here)
  sparkle(ctx, x + r * 0.5, y - 30 - 14 * p, 3 * p, p, '#ffffff');
}
function pressHit(ctx, z, x, y, u, e, fade, time) {
  for (let i = 0; i < 6; i++) {
    const an = -Math.PI + (i / 5) * Math.PI;
    crumb(ctx, x + Math.cos(an) * (8 + e * 30), y - 4 + Math.sin(an) * (4 + e * 14), 2.2, i + u * 5, fade);
  }
  if (u < 0.7) word(ctx, 'CHOMP!', x, y - 50 - e * 6, 12, '#7c769c', fade);
}
function heatWarn(ctx, z, x, y, p, time) {
  glow(ctx, SW / 2, 260, 240 + 80 * p, '#ffc890', 0.12 + 0.28 * p);
  // heat lines rising all over the wall
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < 18; i++) {
    const ph = (time * (0.35 + hash(i) * 0.2) + hash(i * 2.7)) % 1;
    const px = hash(i * 1.3) * SW;
    const py = 330 - ph * 260;
    ctx.globalAlpha = (0.2 + 0.5 * p) * Math.sin(Math.PI * ph);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.bezierCurveTo(px + 5, py - 6, px - 5, py - 12, px, py - 18);
    pen(ctx, '#ffb070', 2);
    ctx.stroke();
  }
  ctx.restore();
}
function heatHit(ctx, z, x, y, u, e, fade, time) {
  // (a gentle warm wash, eased in and out: the full-strength flash was too bright, the player's note)
  ctx.save();
  ctx.globalAlpha = 0.14 * sstep(u / 0.08) * (1 - sstep(u / 0.6));
  ctx.fillStyle = '#fff0dc';
  ctx.fillRect(0, 0, SW, 360);
  ctx.restore();
  for (let i = 0; i < 14; i++) sparkle(ctx, hash(i * 1.7) * SW, 60 + hash(i * 2.9) * 220 - e * 30, 3.4 * (1 - u * 0.6), fade, '#fff6e0');
  if (u < 0.8) word(ctx, 'DING!', SW / 2, 110 - e * 10, 20, PINK[3], fade);
}

export const GRETEL_FX = {
  grSmack: { warn: smackWarn, hit: smackHit },
  grButtons: { warn: buttonsWarn, hit: buttonsHit },
  grIcing: { warn: icingWarn, hit: icingHit },
  grBash: { warn: bashWarn, hit: bashHit },
  grRoll: { warn: rollWarn, hit: rollHit },
  grPress: { warn: pressWarn, hit: pressHit },
  grHeat: { warn: heatWarn, hit: heatHit },
};
// How long each landing plays (s).
export const GRETEL_HOLD = { grSmack: 0.8, grButtons: 0.6, grIcing: 0.9, grBash: 0.7, grRoll: 0.7, grPress: 0.7, grHeat: 1.1 };
// (they draw their own floor markers: render/bossfx.js leaves out the plain one under them)
export const GRETEL_OWN_WARN = Object.keys(GRETEL_FX);

// Her cookie cutters standing on the floor (world/volcano.js room.cutters): they come down when she
// calls them (Roll Out!), stand while the dough rolls round them, lift and glint as she calls Press!, and
// stamp down; then they're gone.
export function drawGretelCutters(ctx, world, cam, time) {
  const C = world.dungeon?.room?.cutters;
  if (!C) return;
  const now = world.now;
  const gy = world.map.groundY - cam.y;
  for (const c of C.list) {
    const x = c.x - cam.x;
    const r = c.w / 2;
    // coming down from above as Roll Out! starts
    const inU = clamp((now - C.t0) / 0.5, 0, 1);
    let lift = (1 - inU * inU) * 220;
    let glint = 0;
    if (C.pressAt != null) {
      const p = clamp((now - C.pressAt.t0) / C.pressAt.dur, 0, 1);
      // lifted up as Press! is cast, then stamped down as it lands
      lift = p < 1 ? 26 * sstep(p / 0.3) : 0;
      glint = p < 1 ? sstep(p / 0.3) : 0;
    }
    const out = C.until != null ? clamp((now - C.until) / 0.4, 0, 1) : 0;
    if (out >= 1) continue;
    cutterArt(ctx, c.kind, x, gy - out * 0, r, lift + out * 200, 1 - out, glint);
  }
}
