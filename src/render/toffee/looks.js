// Toffee's cast looks (2026-11-27, her new fight, world/volcano.js): each telegraph drawn whole in her
// own forge style (no plain floor marker under it: they are on render/bossfx.js OWN_WARN), while its cast
// winds up (`warn`, p 0..1 through the warning), and in place of the plain flash as it lands (`hit`, u 0..1
// over its hold): glossy caramel, warm gold sparks (soft four-point sparkles, never specks), amber sugar
// glass, mint steam, her slate anvil. render/dreamfx.js hands each zone with one of these looks to them.
// Every shape rounded, outlined in a deeper shade of its own colour, eased.
//   tfStrike   Hot Off the Anvil (the tank's marker): her caramel hammer's round shadow on the floor
//              and a ring of warm sparks closing in; landing, a caramel splash and a burst of sparks
//   tfDrizzle  Caramel Drizzle (a marker on each of you: spread): a ribbon of caramel lowering from
//              above, a glossy ring where it will pool; landing, a splat and a soft puddle fading
//   tfGlass    Sugar Glass (a stack): an amber pane of sugar glass hanging over the marker, little
//              glints for the guests it needs, cracks creeping in; landing, it shatters into soft
//              rounded shards
//   tfQuench   Quench! (round her: get out): mint steam curling up all round the ring; landing, a great
//              steam burst
//   tfToss     Anvil Toss (where it lands): its slate shadow growing on the floor, a gold target ring;
//              landing, a thump of dust and sparks (the anvil itself: drawToffeeAnvil)
//   tfRing     Ring the Anvil (everywhere but close to the anvil): gold rings of sound already humming
//              off it across the floor, the warm safe ring round its foot; landing, the CLANG rolling
//              out over the floor
//   tfReel     Taffy Pull (the floor from the anvil to her): a taffy strand along the floor, soft
//              chevrons showing the way the anvil will come; landing, dust all along it
//   tfCrack    Hard Crack! (everyone): amber cracks creeping over the whole forge, glints in them;
//              landing, a warm flash and sugar-glass shards tumbling
// Also her anvil out in the room (drawToffeeAnvil, from render/volcano.js): flying, sitting, ringing,
// reeled back along the floor on its taffy strand.

import { glow, pen, sparkle, ell, hash, sstep, clamp, TAU, steam } from './fx.js';

const SW = 640;
const CARA = ['#fff2c0', '#ffc860', '#e8902c', '#b4601c'];
const GLASS = ['rgba(255,226,160,0.5)', 'rgba(214,140,60,0.85)'];
const IRON = ['#b4b8d4', '#8c90b2', '#6a6e92', '#50547a'];
const BRASS = ['#fff0b0', '#f0c860', '#c49234'];
const MINT = ['#eafff6', '#b8f0dc', '#7ccab4'];
const DUST = ['#fff2d8', '#e0b07a'];
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
const spark = (ctx, x, y, s, al) => sparkle(ctx, x, y, s, al, '#ffe9a0');
// A caramel drop, its tip up.
function drop(ctx, x, y, s, al = 1) {
  if (al <= 0.01 || s <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 1.5);
  ctx.bezierCurveTo(x + s * 0.4, y - s * 0.8, x + s, y - s * 0.2, x + s, y + s * 0.3);
  ctx.arc(x, y + s * 0.3, s, 0, Math.PI);
  ctx.bezierCurveTo(x - s, y - s * 0.2, x - s * 0.4, y - s * 0.8, x, y - s * 1.5);
  ctx.closePath();
  pen(ctx, CARA[3], Math.max(0.6, s * 0.22));
  ctx.stroke();
  ctx.fillStyle = CARA[1];
  ctx.fill();
  ell(ctx, x - s * 0.35, y, s * 0.22, s * 0.35, 0.2);
  ctx.fillStyle = 'rgba(255,255,240,0.85)';
  ctx.fill();
  ctx.restore();
}
// A soft caramel puddle on the floor.
function puddle(ctx, x, y, rx, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  for (let i = 0; i <= 24; i++) {
    const an = (i / 24) * TAU;
    const r = rx * (1 + 0.08 * Math.sin(an * 3 + x));
    const px = x + Math.cos(an) * r;
    const py = y + Math.sin(an) * r * 0.24;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = CARA[2];
  ctx.fill();
  pen(ctx, CARA[3], 1);
  ctx.stroke();
  ell(ctx, x - rx * 0.25, y - rx * 0.06, rx * 0.4, rx * 0.06);
  ctx.fillStyle = 'rgba(255,240,200,0.75)';
  ctx.fill();
  ctx.restore();
}
// A ribbon of caramel hanging from (x, y0) down to (x, y1), swaying.
function strand(ctx, x, y0, y1, w, time, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  const sw = Math.sin(time * 3 + x) * 3;
  ctx.beginPath();
  ctx.moveTo(x - w, y0);
  ctx.quadraticCurveTo(x - w * 0.6 + sw, (y0 + y1) / 2, x - w * 0.35, y1 - w);
  ctx.arc(x, y1 - w, w * 0.8, Math.PI, 0, true);
  ctx.quadraticCurveTo(x + w * 0.6 + sw, (y0 + y1) / 2, x + w, y0);
  ctx.closePath();
  ctx.fillStyle = CARA[1];
  ctx.fill();
  pen(ctx, CARA[3], 1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - w * 0.4, y0);
  ctx.quadraticCurveTo(x - w * 0.3 + sw, (y0 + y1) / 2, x - w * 0.2, y1 - w * 1.4);
  pen(ctx, 'rgba(255,250,225,0.8)', 1);
  ctx.stroke();
  ctx.restore();
}
// A pane of sugar glass, (x, y) its middle.
function pane(ctx, x, y, w, h, al, cracks = 0, ang = 0) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, Math.min(w, h) * 0.25);
  ctx.fillStyle = GLASS[0];
  ctx.fill();
  pen(ctx, GLASS[1], 1.4);
  ctx.stroke();
  ell(ctx, -w * 0.22, -h * 0.2, w * 0.18, h * 0.08, -0.4);
  ctx.fillStyle = 'rgba(255,255,245,0.85)';
  ctx.fill();
  if (cracks > 0.01) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, Math.min(w, h) * 0.25);
    ctx.clip();
    pen(ctx, 'rgba(170,96,40,0.85)', 0.9);
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const an = i * 1.7 + 0.3;
      const L = (w * 0.6) * cracks;
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.05);
      ctx.quadraticCurveTo(Math.cos(an) * L * 0.5 + 2, Math.sin(an) * L * 0.3, Math.cos(an + 0.3) * L, Math.sin(an + 0.3) * L * 0.6);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}
// A soft rounded shard of sugar glass, tumbling.
function shard(ctx, x, y, s, ang, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(-s, -s * 0.4);
  ctx.quadraticCurveTo(0, -s * 1.1, s, -s * 0.3);
  ctx.quadraticCurveTo(s * 0.6, s * 0.7, -s * 0.2, s * 0.6);
  ctx.quadraticCurveTo(-s * 1.1, s * 0.3, -s, -s * 0.4);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,214,140,0.75)';
  ctx.fill();
  pen(ctx, 'rgba(200,120,50,0.9)', 0.8);
  ctx.stroke();
  ell(ctx, -s * 0.3, -s * 0.3, s * 0.3, s * 0.12, -0.4);
  ctx.fillStyle = 'rgba(255,255,245,0.9)';
  ctx.fill();
  ctx.restore();
}
// A puff of dust or steam: three soft round lumps.
function puff(ctx, x, y, r, al, c0 = DUST[0], c1 = DUST[1]) {
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
function word(ctx, text, x, y, size, col, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.font = `900 ${size}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#fff6e4';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = col;
  ctx.fillText(text, x, y);
  ctx.restore();
}
// Her slate anvil (game px, (x, y) its foot's middle on the floor), horn to the right (flip -1: left).
export function anvilPx(ctx, x, y, s = 3.2, flip = 1, hot = 0, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s * flip, s);
  const P = [[-4.6, 0], [4.6, 0], [3.6, -1.6], [2.2, -2.4], [2.6, -4.2], [5.4, -4.8], [9.4, -5.6], [5.6, -7.2], [-5.6, -7.2], [-6.4, -5.4], [-3, -4.2], [-2.4, -2.4], [-3.8, -1.6]];
  let q = P;
  for (let k = 0; k < 2; k++) {
    const o = [];
    for (let i = 0; i < q.length; i++) {
      const a = q[i];
      const b = q[(i + 1) % q.length];
      o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    q = o;
  }
  const path = () => {
    ctx.beginPath();
    q.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
  };
  path();
  pen(ctx, IRON[3], 1.2 / s);
  ctx.stroke();
  ctx.fillStyle = IRON[2];
  ctx.fill();
  ctx.save();
  path();
  ctx.clip();
  ctx.fillStyle = IRON[1];
  ctx.fillRect(-7, -7.4, 17, 1.6);
  ctx.fillStyle = IRON[0];
  ctx.fillRect(-4, -7.4, 6, 0.6);
  ctx.fillStyle = BRASS[2];
  ctx.fillRect(-3, -3.8, 6.4, 0.9);
  ctx.fillStyle = IRON[3];
  ctx.fillRect(-6, -0.9, 12, 0.9);
  if (hot > 0.01) {
    ctx.globalAlpha *= hot;
    ctx.fillStyle = '#ffc070';
    ctx.fillRect(-7, -7.4, 17, 7.4);
  }
  ctx.restore();
  ctx.restore();
}

function strikeWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(255,200,120,0.22)', CARA[3], 0.4 + 0.5 * p);
  // the hammer's round shadow, closing in
  ctx.save();
  ctx.globalAlpha = 0.18 + 0.4 * p;
  ell(ctx, x, y, r * (1.2 - 0.6 * p), r * 0.18 * (1.2 - 0.6 * p));
  ctx.fillStyle = '#7a3a1a';
  ctx.fill();
  ctx.restore();
  for (let i = 0; i < 6; i++) {
    const an = (i / 6) * TAU + time * 1.5;
    spark(ctx, x + Math.cos(an) * r * (1.1 - 0.5 * p), y - 4 + Math.sin(an) * r * 0.26, 2 + 1.4 * p, 0.5 + 0.5 * p);
  }
  glow(ctx, x, y - 6, r * 0.8, '#ffb060', 0.15 + 0.25 * p);
}
function strikeHit(ctx, z, x, y, u, e, fade, time) {
  glow(ctx, x, y - 8, 40 * (1 - u * 0.4), '#ffc070', 0.6 * fade);
  puddle(ctx, x, y, z.w * 0.42 * (0.6 + 0.4 * e), fade);
  for (let i = 0; i < 7; i++) {
    const an = -Math.PI + (i / 6) * Math.PI;
    drop(ctx, x + Math.cos(an) * (6 + e * 30), y - 8 + Math.sin(an) * (6 + e * 22) + u * u * 18, 2.4 * (1 - u * 0.4), fade);
    spark(ctx, x + Math.cos(an + 0.2) * (8 + e * 40), y - 12 + Math.sin(an + 0.2) * (8 + e * 30), 3 * (1 - u), fade);
  }
  if (u < 0.7) word(ctx, 'CLANG!', x, y - 46 - e * 6, 13, CARA[3], fade);
}
function drizzleWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(255,200,110,0.2)', CARA[3], 0.4 + 0.5 * p);
  // the ribbon lowering from above, gathering into a drop at its end
  const y1 = y - 150 + 140 * ease(p);
  strand(ctx, x, -10, Math.min(y - 6, y1), 2.4 + p * 1.6, time, 0.9);
  ctx.save();
  ctx.globalAlpha = 0.3 * p;
  ell(ctx, x, y, r * 0.7, r * 0.12);
  ctx.fillStyle = CARA[2];
  ctx.fill();
  ctx.restore();
}
function drizzleHit(ctx, z, x, y, u, e, fade, time) {
  puddle(ctx, x, y, z.w * 0.45 * (0.5 + 0.5 * e), fade);
  for (let i = 0; i < 5; i++) {
    const an = -Math.PI + 0.3 + (i / 4) * (Math.PI - 0.6);
    drop(ctx, x + Math.cos(an) * (4 + e * 20), y - 4 + Math.sin(an) * (4 + e * 16) + u * u * 14, 2 * (1 - u * 0.5), fade);
  }
}
function glassWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(255,220,150,0.25)', '#c88a3a', 0.5 + 0.4 * p, 2);
  const py = y - 110 + 50 * ease(p);
  pane(ctx, x, py, r * 1.5, 26, 0.6 + 0.4 * p, sstep((p - 0.5) / 0.5), Math.sin(time * 1.6) * 0.04);
  // the glints it needs: one per guest, lighting as it gathers
  const need = z.need ?? 2;
  for (let i = 0; i < need; i++) spark(ctx, x + (i - (need - 1) / 2) * 12, py - 22, 2.6, clamp(p * need - i, 0.25, 1));
  glow(ctx, x, y - 10, r, '#ffe0a0', 0.15 + 0.2 * p);
}
function glassHit(ctx, z, x, y, u, e, fade, time) {
  glow(ctx, x, y - 30, 50, '#fff0c8', 0.55 * fade);
  for (let i = 0; i < 9; i++) {
    const an = -Math.PI * 0.5 + (hash(i + 3) - 0.5) * 2.4;
    shard(ctx, x + Math.cos(an) * e * 44, y - 60 + Math.sin(an) * e * 30 + u * u * 70, 4 + hash(i) * 3, i + u * 6, fade);
  }
  for (let i = 0; i < 4; i++) sparkle(ctx, x + (i - 1.5) * 16, y - 30 - e * 14, 3 * (1 - u), fade, '#fffbe6');
}
function quenchWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(200,250,232,0.22)', MINT[2], 0.4 + 0.5 * p, 1.8);
  for (let i = 0; i < 12; i++) {
    const an = (i / 12) * TAU;
    const ph = (time * 0.8 + hash(i)) % 1;
    const px = x + Math.cos(an) * r * 0.95;
    steam(ctx, px, y - 2 + Math.sin(an) * r * 0.22 - ph * 18 * (0.5 + p), 3 + 3 * p, (0.35 + 0.4 * p) * Math.sin(Math.PI * ph));
  }
}
function quenchHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  for (let i = 0; i < 14; i++) {
    const an = (i / 14) * TAU;
    puff(ctx, x + Math.cos(an) * r * (0.2 + 0.8 * e), y - 6 - e * (10 + (i % 3) * 8) + Math.sin(an) * r * 0.2, 6 + e * 8, 0.8 * fade, MINT[0], MINT[2]);
  }
  if (u < 0.7) word(ctx, 'HSSSS!', x, y - 60 - e * 8, 12, '#3a8a7a', fade);
}
function tossWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(255,214,120,0.18)', '#c49234', 0.5 + 0.4 * p, 2);
  floorRing(ctx, x, y, r * 0.5, 'rgba(255,214,120,0)', '#c49234', 0.4 + 0.4 * p, 1.4);
  ctx.save();
  ctx.globalAlpha = 0.15 + 0.45 * p * p;
  ell(ctx, x, y, r * (0.25 + 0.4 * p), r * 0.08 * (0.6 + 0.6 * p));
  ctx.fillStyle = '#3a3a5a';
  ctx.fill();
  ctx.restore();
}
function tossHit(ctx, z, x, y, u, e, fade, time) {
  for (let i = 0; i < 6; i++) {
    const an = -Math.PI + (i / 5) * Math.PI;
    puff(ctx, x + Math.cos(an) * (8 + e * 30), y - 4 + Math.sin(an) * (4 + e * 12), 5 + e * 4, fade);
  }
  for (let i = 0; i < 4; i++) spark(ctx, x + (i - 1.5) * 12 * (0.5 + e), y - 22 - Math.sin(Math.PI * clamp(e + i * 0.1, 0, 1)) * 16, 2.6 * (1 - u * 0.5), fade);
  if (u < 0.7) word(ctx, 'THUNK!', x, y - 50 - e * 6, 12, '#50547a', fade);
}
function ringWarn(ctx, z, x, y, p, time) {
  // (x: the anvil; z.inner the safe ring round it)
  const inner = z.inner ?? 70;
  floorRing(ctx, x, y, inner, 'rgba(255,236,170,0.3)', '#c49234', 0.6 + 0.4 * p, 2.2);
  glow(ctx, x, y - 12, inner, '#fff0b8', 0.2 + 0.25 * p);
  // rings of sound humming out across the floor beyond it, faster as it comes
  for (let k = 0; k < 5; k++) {
    const ph = (time * (0.5 + p) + k / 5) % 1;
    const rr = inner + 10 + ph * 520;
    ctx.save();
    ctx.globalAlpha = (0.15 + 0.45 * p) * (1 - ph);
    ctx.beginPath();
    ctx.ellipse(x, y - 2, rr, rr * 0.12, 0, Math.PI * 1.04, Math.PI * 1.96);
    pen(ctx, '#f0c860', 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, y - 2, rr, rr * 0.12, 0, 0.1, Math.PI - 0.1);
    pen(ctx, '#e8a040', 1.4);
    ctx.stroke();
    ctx.restore();
  }
}
function ringHit(ctx, z, x, y, u, e, fade, time) {
  const inner = z.inner ?? 70;
  for (let k = 0; k < 3; k++) {
    const rr = inner + e * 620 - k * 40;
    if (rr < inner) continue;
    ctx.save();
    ctx.globalAlpha = fade * (0.8 - k * 0.2);
    ctx.beginPath();
    ctx.ellipse(x, y - 4, rr, rr * 0.14, 0, 0, TAU);
    pen(ctx, '#f0c860', 4 - k);
    ctx.stroke();
    ctx.restore();
  }
  if (u < 0.75) word(ctx, 'CLAAANG!', x, y - 70 - e * 8, 14, '#c49234', fade);
}
function reelWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  ctx.save();
  ctx.globalAlpha = 0.25 + 0.35 * p;
  ctx.fillStyle = '#ffd890';
  ctx.beginPath();
  ctx.roundRect(x, y - 8, w, 10, 5);
  ctx.fill();
  ctx.restore();
  // the taffy strand along the floor, sagging and tightening
  ctx.beginPath();
  const sag = 8 * (1 - p);
  ctx.moveTo(x, y - 10);
  ctx.quadraticCurveTo(x + w / 2, y - 10 + sag, x + w, y - 10);
  pen(ctx, CARA[3], 2.6);
  ctx.stroke();
  pen(ctx, CARA[1], 1.4);
  ctx.stroke();
  // soft chevrons pointing the way the anvil will come (toward her: z.dir)
  const n = Math.max(3, Math.floor(w / 46));
  for (let i = 0; i < n; i++) {
    const ph = (i / n + time * 0.6 * (z.dir ?? 1)) % 1;
    const cx = x + ((ph + 1) % 1) * w;
    const d = z.dir ?? 1;
    ctx.save();
    ctx.globalAlpha = (0.4 + 0.5 * p) * Math.sin(Math.PI * ((ph + 1) % 1));
    ctx.beginPath();
    ctx.moveTo(cx - d * 5, y - 15);
    ctx.quadraticCurveTo(cx + d * 3, y - 10, cx - d * 5, y - 5);
    ctx.lineCap = 'round';
    pen(ctx, '#c4602c', 2.4);
    ctx.stroke();
    ctx.restore();
  }
}
function reelHit(ctx, z, x, y, u, e, fade, time) {
  const w = z.w;
  const n = Math.max(3, Math.floor(w / 40));
  for (let i = 0; i < n; i++) puff(ctx, x + ((i + 0.5) / n) * w, y - 4 - e * 6, 4 + e * 4, fade * (0.5 + 0.5 * hash(i)));
}
function crackWarn(ctx, z, x, y, p, time) {
  glow(ctx, SW / 2, 200, 220 + 80 * p, '#ffd8a0', 0.1 + 0.25 * p);
  // amber cracks creeping over the whole forge, from a few points
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const ox = hash(i * 3.1) * SW;
    const oy = 60 + hash(i * 1.7) * 220;
    const L = 30 + 70 * ease(p);
    ctx.globalAlpha = 0.3 + 0.6 * p;
    for (let j = 0; j < 4; j++) {
      const an = j * 1.6 + i;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.quadraticCurveTo(ox + Math.cos(an) * L * 0.5 + 6, oy + Math.sin(an) * L * 0.4, ox + Math.cos(an + 0.4) * L, oy + Math.sin(an + 0.4) * L * 0.7);
      pen(ctx, 'rgba(214,130,50,0.8)', 1.6);
      ctx.stroke();
    }
    spark(ctx, ox, oy, 2 + 2 * p, 0.5 + 0.5 * p);
  }
  ctx.restore();
}
function crackHit(ctx, z, x, y, u, e, fade, time) {
  ctx.save();
  ctx.globalAlpha = 0.3 * fade * Math.max(0, 1 - u * 1.5);
  ctx.fillStyle = '#fff0d0';
  ctx.fillRect(0, 0, SW, 360);
  ctx.restore();
  for (let i = 0; i < 22; i++) {
    const px = hash(i * 1.9) * SW;
    const py = 40 + hash(i * 3.1) * 140 + e * 160;
    shard(ctx, px, py, 3 + hash(i) * 3, i + u * 5, fade);
  }
}

export const TOFFEE_FX = {
  tfStrike: { warn: strikeWarn, hit: strikeHit },
  tfDrizzle: { warn: drizzleWarn, hit: drizzleHit },
  tfGlass: { warn: glassWarn, hit: glassHit },
  tfQuench: { warn: quenchWarn, hit: quenchHit },
  tfToss: { warn: tossWarn, hit: tossHit },
  tfRing: { warn: ringWarn, hit: ringHit },
  tfReel: { warn: reelWarn, hit: reelHit },
  tfCrack: { warn: crackWarn, hit: crackHit },
};
// How long each landing plays (s).
export const TOFFEE_HOLD = { tfStrike: 0.8, tfDrizzle: 0.7, tfGlass: 0.9, tfQuench: 0.9, tfToss: 0.7, tfRing: 1, tfReel: 0.7, tfCrack: 1.1 };
// (they draw their own floor markers: render/bossfx.js leaves out the plain one under them)
export const TOFFEE_OWN_WARN = Object.keys(TOFFEE_FX);

// Her anvil out in the room (world/volcano.js room.anvil): flying from her hands to where it lands,
// sitting there (warm while it rings), or reeled back to her along the floor on its taffy strand.
export function drawToffeeAnvil(ctx, world, cam, time) {
  const A = world.dungeon?.room?.anvil;
  if (!A) return;
  const now = world.now;
  const boss = world.mobs.find((m) => m.def.mech === 'toffee' && m.hp > 0);
  const gy = A.y - cam.y;
  let x = A.x;
  let lift = 0;
  let rot = 0;
  if (A.fly && now < A.fly.t0 + A.fly.dur) {
    const u = clamp((now - A.fly.t0) / A.fly.dur, 0, 1);
    if (u <= 0) return;
    x = A.fly.x0 + (A.x - A.fly.x0) * u;
    lift = A.fly.h0 * (1 - u) + Math.sin(Math.PI * u) * 110;
    rot = (1 - u) * 2.4 * Math.sign(A.x - A.fly.x0);
  } else if (A.reel) {
    const u = clamp((now - A.reel.t0) / A.reel.dur, 0, 1);
    if (u > 0) {
      const tx = boss ? boss.x : A.reel.x1;
      x = A.x + (tx - A.x) * (u * u * (3 - 2 * u));
      lift = Math.sin(Math.PI * u) * 6;
    }
    if (boss) {
      // the taffy strand from the anvil to her
      ctx.beginPath();
      ctx.moveTo(x - cam.x, gy - 10 - lift);
      ctx.quadraticCurveTo((x + boss.x) / 2 - cam.x, gy - 4, boss.x - cam.x, gy - 30);
      pen(ctx, CARA[3], 2.4);
      ctx.stroke();
      pen(ctx, CARA[1], 1.2);
      ctx.stroke();
    }
  }
  const hot = A.ringAt != null ? Math.max(0, 1 - Math.abs(now - A.ringAt) / 1.2) * 0.7 : 0;
  if (lift < 40) {
    ctx.save();
    ctx.globalAlpha = 0.3 * (1 - lift / 40);
    ell(ctx, x - cam.x, gy, 18, 3.6);
    ctx.fillStyle = '#3a2a3a';
    ctx.fill();
    ctx.restore();
  }
  if (hot > 0.01) glow(ctx, x - cam.x, gy - 14, 26, '#ffc070', hot * 0.6);
  anvilPx(ctx, x - cam.x, gy - lift, 3.2, (boss?.x ?? x) < x ? -1 : 1, hot, rot);
}
