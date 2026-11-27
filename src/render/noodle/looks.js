// The Cup-Noodle Dragon's cast looks (remade 2026-11-27, his new fight, world/theatre.js): each telegraph drawn
// whole in his own soft style (no plain floor marker under it: they are on render/bossfx.js OWN_WARN), while its
// cast winds up (`warn`, p 0..1 through the warning), and in place of the plain flash as it lands (`hit`, u 0..1
// over its hold, e eased, fade). His colours: wheat-gold noodles, amber broth, white steam, the cup's cherry red
// and white, red lacquered chopsticks, chili flakes; every shape rounded, outlined in a deeper shade of its own
// colour, eased; sparkles and soft steam, never specks. render/dreamfx.js hands each zone with one of these looks
// to them. (x, y) is the zone's spot on the 640 x 360 screen (a band's left end; a circle's or a marker's middle).
//   ndChop    Chopstick Pinch (the tank's marker): a giant pair of chopsticks over the tank, opening wider; landing,
//             they snap shut: SNAP, sparkles
//   ndSlurp   SLUUURP (no hit itself: everyone is pulled in): soft wind streaks and noodles drawn in toward him
//             from both sides, "SLUUURP" over the room
//   ndBurp    the burp (a patch round him: get out): a ring of steam swelling round him; landing, a big soft puff
//   ndToss    Noodle Toss (each of you): a noodle looping in the air over each head, a broth-drip ring round you;
//             landing, it flops down: a splash of broth
//   ndSoup    Soup's On (everyone): broth drops gathering along the top of the room, steam rising; landing, a warm
//             rain of broth and steam
//   ndPacket  Flavour Packet (the healer's marker: gather in): a big flavour packet over them, tearing open, a
//             ring of seasoning on the floor; landing, a puff of seasoning and chili flakes
//   ndStick   Chopstick Drop (two spots): a chopstick spinning high over each spot, its shadow growing; landing,
//             it stabs into the floor
//   ndPinch   (everywhere but where they fell) the floor tinted chili red, pinch marks sweeping in; landing, a
//             SNAP across it, the stick spots left glowing safe
//   ndFlip    Lid Flip (ahead of him): the floor ahead in the foil lid's silver, its arc drawn; landing, the lid
//             slaps down: a foil flash and steam
//   ndBowl    Bottomless Bowl (everyone, twice): a whirlpool of broth over the room, turning faster; landing, a
//             splash of broth and noodles over everything
import { TAU, clamp, sstep, ell, pen, glow, sparkle, hash } from './fx.js';
import { NOOD, BROTH, CUP, FOIL, STICK, CHILI, STEAM } from './palette.js';

const SW = 640;
const rgba = (hex, al) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(al, 0, 1)})`;
};
function word(ctx, text, x, y, size, al, col = BROTH.ink) {
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
function floorRing(ctx, x, y, r, fill, rim, al, w = 1.6, dash = null) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 0.22);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (dash) ctx.setLineDash(dash);
  pen(ctx, rim, w);
  ctx.stroke();
  ctx.restore();
}
function puff(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.fillStyle = STEAM.base;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.arc(x + r * 0.7, y + r * 0.2, r * 0.7, 0, TAU);
  ctx.arc(x - r * 0.6, y + r * 0.3, r * 0.6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - r * 0.25, y - r * 0.3, r * 0.42, 0, TAU);
  ctx.fill();
  ctx.restore();
}
function drop(ctx, x, y, s, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 1.4);
  ctx.quadraticCurveTo(x + s, y + s * 0.2, x, y + s);
  ctx.quadraticCurveTo(x - s, y + s * 0.2, x, y - s * 1.4);
  ctx.fillStyle = BROTH.base;
  ctx.fill();
  pen(ctx, BROTH.ink, 0.9);
  ctx.stroke();
  ell(ctx, x - s * 0.3, y - s * 0.2, s * 0.25, s * 0.3);
  ctx.fillStyle = BROTH.lt;
  ctx.fill();
  ctx.restore();
}
function noodle(ctx, pts, al = 1, w = 2.6) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  pen(ctx, NOOD.ink, w + 1.4);
  ctx.stroke();
  pen(ctx, NOOD.base, w);
  ctx.stroke();
  pen(ctx, NOOD.lt, w * 0.35);
  ctx.stroke();
  ctx.restore();
}
function wavy(x0, y0, x1, y1, amp, ph, n = 10) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const v = i / n;
    const nx = -(y1 - y0);
    const ny = x1 - x0;
    const L = Math.hypot(nx, ny) || 1;
    const k = Math.sin(v * 9 + ph) * amp;
    pts.push([x0 + (x1 - x0) * v + (nx / L) * k, y0 + (y1 - y0) * v + (ny / L) * k]);
  }
  return pts;
}
// A chopstick, big, from its end (x, y) along `rot`.
function stick(ctx, x, y, L, rot, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(0, -2.6);
  ctx.lineTo(L, -1.2);
  ctx.quadraticCurveTo(L + 1.4, 0, L, 1.2);
  ctx.lineTo(0, 2.6);
  ctx.quadraticCurveTo(-1.4, 0, 0, -2.6);
  ctx.closePath();
  ctx.fillStyle = STICK.base;
  ctx.fill();
  pen(ctx, STICK.ink, 1.2);
  ctx.stroke();
  ctx.fillStyle = STICK.tip;
  ctx.fillRect(L * 0.72, -1.5, L * 0.27, 3);
  ctx.fillStyle = STICK.gold;
  ctx.fillRect(L * 0.12, -2.6, 3, 5.2);
  pen(ctx, STICK.lt, 0.9);
  ctx.beginPath();
  ctx.moveTo(3, -1.2);
  ctx.lineTo(L * 0.7, -0.6);
  ctx.stroke();
  ctx.restore();
}
function flake(ctx, x, y, s, rot, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ell(ctx, 0, 0, s, s * 0.6);
  ctx.fillStyle = CHILI.base;
  ctx.fill();
  pen(ctx, CHILI.sh, 0.8);
  ctx.stroke();
  ctx.restore();
}

// ---------- Chopstick Pinch ----------
function chopWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, rgba(CUP.red, 0.12 + 0.14 * p), rgba(STICK.ink, 0.9), sstep(p / 0.2), 2.2);
  const open = 0.15 + p * 0.45;
  const hy = y - 96 + p * 20;
  ctx.save();
  ctx.globalAlpha = 0.25 * sstep(p / 0.3);
  ell(ctx, x, y, 18 + p * 10, 4);
  ctx.fillStyle = '#3a2a3a';
  ctx.fill();
  ctx.restore();
  stick(ctx, x - 4, hy, 70, Math.PI / 2 - open, sstep(p / 0.25));
  stick(ctx, x + 4, hy, 70, Math.PI / 2 + open, sstep(p / 0.25));
}
function chopHit(ctx, z, x, y, u, e, fade, time) {
  stick(ctx, x - 3, y - 70 + e * 6, 66, Math.PI / 2 - 0.04, fade);
  stick(ctx, x + 3, y - 70 + e * 6, 66, Math.PI / 2 + 0.04, fade);
  for (let i = 0; i < 6; i++) sparkle(ctx, x + Math.cos(i) * (6 + e * 28), y - 10 + Math.sin(i) * (4 + e * 14), 4 * (1 - e * 0.6), fade, '#fff2c8');
  word(ctx, 'SNAP!', x, y - 84 - e * 8, 16, fade, STICK.ink);
}

// ---------- SLUUURP (the pull) ----------
function slurpWarn(ctx, z, x, y, p, time) {
  // (soft wind streaks and noodles drawn in toward him from both sides)
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
    const v = (time * 1.4 + k / 4) % 1;
    const sx = x + s * (300 - v * 260);
    const sy = y - 20 - k * 14 + Math.sin(time * 3 + k) * 4;
    ctx.save();
    ctx.globalAlpha = sstep(p / 0.2) * Math.sin(Math.PI * v) * 0.8;
    pen(ctx, '#ffffff', 2.4);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + s * 26, sy);
    ctx.stroke();
    pen(ctx, rgba(BROTH.lt, 0.8), 1);
    ctx.stroke();
    ctx.restore();
    if (k % 2 === 0) noodle(ctx, wavy(sx + s * 8, sy - 8, sx + s * 30, sy - 10, 2, time * 8 + k, 8), sstep(p / 0.2) * Math.sin(Math.PI * v), 2);
  }
  word(ctx, 'SLUUUURP', x, y - 108 + Math.sin(time * 18) * 1.4, 18, sstep(p / 0.15), CUP.redInk);
}
function slurpHit(ctx, z, x, y, u, e, fade, time) {}

// ---------- the burp ----------
function burpWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, rgba(STEAM.sh, 0.22 + 0.2 * p), rgba('#a8a8c8', 0.9), sstep(p / 0.2), 2.6);
  for (let i = 0; i < 8; i++) {
    const an = (i / 8) * TAU + time * 0.6;
    puff(ctx, x + Math.cos(an) * r * 0.92, y - 6 + Math.sin(an) * r * 0.2, 4 + p * 4, 0.6 * sstep(p / 0.3));
  }
  if (p > 0.6) word(ctx, 'GET OUT!', x, y - 70, 12, sstep((p - 0.6) / 0.2), '#7a7aa8');
}
function burpHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  for (let i = 0; i < 12; i++) {
    const an = (i / 12) * TAU;
    puff(ctx, x + Math.cos(an) * r * (0.4 + e * 0.8), y - 14 + Math.sin(an) * r * 0.3 - e * 20, 8 + e * 8, fade * 0.9);
  }
  word(ctx, '*BURP*', x, y - 74 - e * 10, 18, fade, '#7a7aa8');
}

// ---------- Noodle Toss ----------
function tossWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, rgba(BROTH.lt, 0.16 + 0.14 * p), rgba(BROTH.ink, 0.85), sstep(p / 0.25), 1.8, [5, 4]);
  const hy = y - 78 + p * 26;
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const v = i / 14;
    const an = v * TAU * 1.2 + time * 4 + (z.n ?? 0);
    pts.push([x - 14 + v * 28 + Math.cos(an) * 5, hy + Math.sin(an) * 6]);
  }
  noodle(ctx, pts, sstep(p / 0.25), 3);
}
function tossHit(ctx, z, x, y, u, e, fade, time) {
  noodle(ctx, wavy(x - 16, y - 6, x + 16, y - 6, 2.4 * (1 - e), time * 6, 10), fade, 3);
  for (let i = 0; i < 6; i++) drop(ctx, x + Math.cos(Math.PI + i * 0.55) * (6 + e * 22), y - 10 - Math.sin(i * 0.55) * e * 18 + e * e * 10, 2.6 * (1 - e * 0.4), fade);
}

// ---------- Soup's On ----------
function soupWarn(ctx, z, x0, y, p, time) {
  for (let i = 0; i < 14; i++) {
    const on = sstep(p * 1.5 - i / 14);
    const dx = 24 + (i / 13) * (SW - 48);
    drop(ctx, dx + Math.sin(time * 2 + i) * 3, 40 + Math.sin(time * 3 + i * 1.7) * 4, 4, on);
  }
  for (let i = 0; i < 6; i++) {
    const v = (time * 0.4 + i / 6) % 1;
    puff(ctx, 50 + i * 100, 340 - v * 120, 8 + v * 8, 0.3 * p * Math.sin(Math.PI * v));
  }
  ctx.save();
  ctx.globalAlpha = 0.06 + 0.1 * p;
  ctx.fillStyle = BROTH.lt;
  ctx.fillRect(0, 0, SW, 360);
  ctx.restore();
  if (p > 0.5) word(ctx, "SOUP'S ON!", SW / 2, 80, 16, sstep((p - 0.5) / 0.2), CUP.redInk);
}
function soupHit(ctx, z, x0, y, u, e, fade, time) {
  ctx.save();
  ctx.globalAlpha = 0.3 * fade;
  ctx.fillStyle = BROTH.lt;
  ctx.fillRect(0, 0, SW, 360);
  ctx.restore();
  for (let i = 0; i < 18; i++) drop(ctx, 16 + hash(i) * (SW - 32), 40 + e * (220 + hash(i * 3) * 80), 4, fade);
}

// ---------- Flavour Packet ----------
function packet(ctx, x, y, s, rot, torn, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.roundRect(-s, -s * 1.3, s * 2, s * 2.6, s * 0.2);
  ctx.fillStyle = CHILI.base;
  ctx.fill();
  pen(ctx, CHILI.sh, 1.4);
  ctx.stroke();
  ctx.fillStyle = '#ffe08a';
  ctx.beginPath();
  ctx.roundRect(-s * 0.7, -s * 0.3, s * 1.4, s * 0.8, s * 0.15);
  ctx.fill();
  word(ctx, 'FLAVOUR', 0, s * 0.1, s * 0.42, 1, CHILI.sh);
  // (its top edge tearing open)
  if (torn > 0.01) {
    ctx.fillStyle = '#fff6e8';
    ctx.beginPath();
    ctx.moveTo(-s, -s * 1.3);
    for (let i = 0; i <= 6; i++) ctx.lineTo(-s + (i / 6) * s * 2 * torn, -s * 1.3 + (i % 2 ? 2 : -1));
    ctx.lineTo(-s + s * 2 * torn, -s * 1.3 - 3);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
function packetWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, rgba('#ffe08a', 0.22 + 0.16 * p), rgba(CHILI.sh, 0.9), sstep(p / 0.2), 2.4);
  floorRing(ctx, x, y, r * 0.6, null, rgba(CHILI.base, 0.6), sstep(p / 0.3), 1.2, [4, 4]);
  packet(ctx, x, y - 92 + p * 16 + Math.sin(time * 3) * 2, 12, Math.sin(time * 2) * 0.1, sstep((p - 0.6) / 0.4), sstep(p / 0.25));
  word(ctx, 'SHARE IT!', x, y - 124, 11, sstep((p - 0.3) / 0.2), CHILI.sh);
}
function packetHit(ctx, z, x, y, u, e, fade, time) {
  ctx.save();
  ctx.globalAlpha = fade;
  glow(ctx, x, y - 16, 40 + e * 30, '#ffe08a', 0.5);
  ctx.restore();
  for (let i = 0; i < 14; i++) {
    const an = Math.PI + (i / 13) * Math.PI;
    flake(ctx, x + Math.cos(an) * (8 + e * 50), y - 20 + Math.sin(an) * (6 + e * 30) + e * e * 16, 2.2, i + e * 4, fade);
  }
}

// ---------- Chopstick Drop ----------
function stickWarn(ctx, z, x, y, p, time) {
  const cx = x + z.w / 2;
  ctx.save();
  ctx.globalAlpha = 0.18 + 0.22 * p;
  ctx.fillStyle = CUP.red;
  ctx.fillRect(x, y - 8, z.w, 12);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.3 * p;
  ell(ctx, cx, y, 10 + p * 14, 3 + p * 2);
  ctx.fillStyle = '#3a2a3a';
  ctx.fill();
  ctx.restore();
  // (spinning high overhead, then falling point first)
  const fall = sstep((p - 0.6) / 0.4);
  const hy = y - 170 + fall * 100;
  stick(ctx, cx - Math.cos(time * 8 * (1 - fall) + Math.PI / 2 * fall) * 30, hy - Math.sin(time * 8 * (1 - fall) + Math.PI / 2 * fall) * 30, 60, time * 8 * (1 - fall) + (Math.PI / 2) * fall, sstep(p / 0.2));
}
function stickHit(ctx, z, x, y, u, e, fade, time) {
  const cx = x + z.w / 2;
  stick(ctx, cx, y - 52, 54, Math.PI / 2, 1);
  for (let i = 0; i < 4; i++) sparkle(ctx, cx + (i - 1.5) * 10 * e, y - 4 - e * 10, 4 * (1 - e), fade, '#fff2c8');
}
// ---------- the pinch (everywhere but where they fell) ----------
function pinchWarn(ctx, z, x, y, p, time) {
  ctx.save();
  ctx.globalAlpha = 0.1 + 0.26 * p;
  ctx.fillStyle = CHILI.base;
  ctx.fillRect(x, y - 10, z.w, 14);
  ctx.restore();
  const n = Math.max(1, Math.round(z.w / 50));
  for (let i = 0; i < n; i++) {
    const v = (time * 1.2 + i / n) % 1;
    flake(ctx, x + ((i + 0.5) / n) * z.w, y - 30 + v * 20, 2, i + time * 3, sstep(p / 0.3) * Math.sin(Math.PI * v));
  }
  // (the safe spots where the sticks fell, ringed in gold)
  for (const sx of z.xs ?? []) {
    const scr = sx - (z.x - x);
    if (scr > x + z.w && scr < x + z.w + 40) floorRing(ctx, scr, y, 26, rgba('#fff6d0', 0.25), rgba('#ffe08a', 0.95), sstep(p / 0.3), 2.2);
  }
}
function pinchHit(ctx, z, x, y, u, e, fade, time) {
  ctx.save();
  ctx.globalAlpha = 0.4 * fade;
  ctx.fillStyle = CHILI.lt;
  ctx.fillRect(x, y - 30 - e * 20, z.w, 40 + e * 20);
  ctx.restore();
  const n = Math.max(1, Math.round(z.w / 70));
  for (let i = 0; i < n; i++) word(ctx, 'pinch!', x + ((i + 0.5) / n) * z.w, y - 40 - e * 12, 10, fade, CHILI.sh);
}

// ---------- Lid Flip ----------
function flipWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  const d = z.dir ?? 1;
  ctx.save();
  ctx.globalAlpha = 0.16 + 0.24 * p;
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, FOIL.lt);
  g.addColorStop(1, FOIL.sh);
  ctx.fillStyle = g;
  ctx.fillRect(x, y - 10, w, 14);
  ctx.restore();
  // (the arc the lid will flip along)
  ctx.save();
  ctx.globalAlpha = 0.6 * p;
  ctx.setLineDash([4, 6]);
  pen(ctx, FOIL.ink, 1.6);
  ctx.beginPath();
  const x0 = d > 0 ? x : x + w;
  ctx.moveTo(x0, y - 20);
  ctx.quadraticCurveTo(x + w / 2, y - 120, x0 + d * w, y - 8);
  ctx.stroke();
  ctx.restore();
  if (p > 0.5) word(ctx, 'LID FLIP', x + w / 2, y - 60, 13, sstep((p - 0.5) / 0.2), FOIL.ink);
}
function flipHit(ctx, z, x, y, u, e, fade, time) {
  const w = z.w;
  ctx.save();
  ctx.globalAlpha = fade;
  ell(ctx, x + w / 2, y - 4, w / 2, 9 + 6 * (1 - e));
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, FOIL.lt);
  g.addColorStop(0.5, FOIL.base);
  g.addColorStop(1, FOIL.sh);
  ctx.fillStyle = g;
  ctx.fill();
  pen(ctx, FOIL.rim, 2);
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 5; i++) puff(ctx, x + (i + 0.5) * (w / 5), y - 14 - e * 18, 6 + e * 6, fade * 0.8);
}

// ---------- Bottomless Bowl ----------
function bowlWarn(ctx, z, x0, y, p, time) {
  const cx = SW / 2;
  const cy = 70;
  ctx.save();
  ctx.globalAlpha = sstep(p / 0.2);
  ell(ctx, cx, cy, 60, 16);
  ctx.fillStyle = rgba(BROTH.base, 0.9);
  ctx.fill();
  pen(ctx, BROTH.ink, 2);
  ctx.stroke();
  pen(ctx, rgba(BROTH.lt, 0.9), 1.6);
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const an = time * (3 + p * 6) + (i / 40) * TAU * 2;
    const r = 4 + (i / 40) * 52;
    const px = cx + Math.cos(an) * r;
    const py = cy + Math.sin(an) * r * 0.26;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 5; i++) {
    const an = time * 3 + i * 1.3;
    noodle(ctx, wavy(cx + Math.cos(an) * 40, cy + Math.sin(an) * 10, cx + Math.cos(an + 0.4) * 56, cy + Math.sin(an + 0.4) * 14, 1.6, time * 6 + i, 6), sstep(p / 0.3), 2);
  }
  word(ctx, 'BOTTOMLESS BOWL', cx, 112, 14, sstep((p - 0.3) / 0.2), CUP.redInk);
}
function bowlHit(ctx, z, x0, y, u, e, fade, time) {
  ctx.save();
  ctx.globalAlpha = 0.3 * fade;
  ctx.fillStyle = BROTH.lt;
  ctx.fillRect(0, 0, SW, 360);
  ctx.restore();
  for (let i = 0; i < 12; i++) {
    const nx = 20 + hash(i * 1.7) * (SW - 40);
    const ny = 50 + e * (200 + hash(i * 3) * 80);
    noodle(ctx, wavy(nx - 10, ny, nx + 10, ny + 4, 2, i + time * 5, 8), fade, 2.4);
    drop(ctx, nx + 14, ny - 10, 3, fade);
  }
}

export const NOODLE_FX = {
  ndChop: { warn: chopWarn, hit: chopHit },
  ndSlurp: { warn: slurpWarn, hit: slurpHit },
  ndBurp: { warn: burpWarn, hit: burpHit },
  ndToss: { warn: tossWarn, hit: tossHit },
  ndSoup: { warn: soupWarn, hit: soupHit },
  ndPacket: { warn: packetWarn, hit: packetHit },
  ndStick: { warn: stickWarn, hit: stickHit },
  ndPinch: { warn: pinchWarn, hit: pinchHit },
  ndFlip: { warn: flipWarn, hit: flipHit },
  ndBowl: { warn: bowlWarn, hit: bowlHit },
};
// (how long each landing plays, s: world/bossfight.js LOOK_HOLD carries the same)
export const NOODLE_HOLD = { ndChop: 0.8, ndSlurp: 0.1, ndBurp: 0.9, ndToss: 0.6, ndSoup: 1, ndPacket: 0.9, ndStick: 1.7, ndPinch: 0.8, ndFlip: 0.9, ndBowl: 1.1 };
export const NOODLE_OWN_WARN = Object.keys(NOODLE_FX);
