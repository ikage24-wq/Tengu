// The Night Manager's cast looks (remade 2026-11-27, his new fight, world/theatre.js): each telegraph drawn
// whole in his own soft office style (no plain floor marker under it: they are on render/bossfx.js OWN_WARN),
// while its cast winds up (`warn`, p 0..1 through the warning), and in place of the plain flash as it lands
// (`hit`, u 0..1 over its hold, e eased, fade). His colours: coffee and cream, sticky-note yellow, pink and
// blue, the teal of his mug, the birch of his clipboard, the crimson of his tie; every shape rounded, outlined
// in a deeper shade of its own colour, eased; sparkles, never specks. render/dreamfx.js hands each zone with one
// of these looks to them. (x, y) is the zone's spot on the 640 x 360 screen (a band's left end; a circle's,
// a donut's or a marker's middle).
//   nmSync      Quick Sync (the tank's marker): his clipboard hovering over the tank, tapping, a "SEE ME"
//               sticky on it, a coffee ring on the floor; landing, it slaps down: WHAP, papers
//   nmDelegate  Delegate (each of you): a sticky note fluttering down over each head, a dotted cream ring
//               round you; landing, it slaps on: a puff of paper
//   nmCircle    Circle Back (a ring round him, its middle safe): a felt-tip circle drawn round him on the floor
//               (the safe middle), the floor beyond it washed in coffee; landing, a wave of coffee over it
//   nmBack      ...and back around (a patch round him: get out): a coffee ring round him, steam rising off it;
//               landing, a splash of coffee
//   nmReply     Reply All (everyone): envelopes gathering along the top of the room, unread badges popping on
//               them; landing, they all go off at once in a flurry
//   nmHuddle    Team Huddle (the healer's marker: gather in): a round meeting-table ring with arrows pointing
//               in, "HUDDLE" over it; landing, a warm burst and a ring of sticky notes
//   nmTick      Clock Watching (half the floor, then the other): a clock face over that half, its minute hand
//               sweeping round to the hour; landing, the hour strikes: a bright wash and "TICK" / "TOCK"
//   nmOne       ...and one more thing (a patch round him): sticky notes circling him; landing, they pop off
//   nmOneMore   Just One More Thing (everyone, twice): a desk bell over the room, rung harder and harder;
//               landing, a ring of light and a shower of sticky notes
import { TAU, clamp, sstep, ell, pen, glow, sparkle, hash } from './fx.js';
import { COFFEE, NOTE, MUG, BOARD, TIE, GOLD } from './palette.js';

const SW = 640;
const rgba = (hex, al) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(al, 0, 1)})`;
};
function word(ctx, text, x, y, size, al, col = COFFEE.ink) {
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
// A sticky note, big, for the effects.
export function bigNote(ctx, x, y, s, rot, al = 1, col = NOTE.base, text = null) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(-s, -s);
  ctx.lineTo(s, -s);
  ctx.lineTo(s, s * 0.5);
  ctx.quadraticCurveTo(s * 0.75, s * 0.75, s * 0.5, s);
  ctx.lineTo(-s, s);
  ctx.closePath();
  ctx.fillStyle = col;
  ctx.fill();
  pen(ctx, col === NOTE.base ? NOTE.ink : rgba(col, 1), 1.2);
  ctx.strokeStyle = col === NOTE.pink ? '#d8889c' : col === NOTE.blue ? '#86aad0' : NOTE.ink;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(-s + 1, -s + 1, s * 2 - 2, s * 0.35);
  // (the curled corner)
  ctx.beginPath();
  ctx.moveTo(s, s * 0.5);
  ctx.quadraticCurveTo(s * 0.55, s * 0.45, s * 0.5, s);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fill();
  if (text) word(ctx, text, 0, 0.5, s * 0.62, 1, TIE.deep);
  else {
    pen(ctx, 'rgba(150,110,60,0.6)', 1);
    ctx.beginPath();
    ctx.moveTo(-s * 0.6, -s * 0.05);
    ctx.lineTo(s * 0.5, -s * 0.05);
    ctx.moveTo(-s * 0.6, s * 0.4);
    ctx.lineTo(s * 0.15, s * 0.4);
    ctx.stroke();
  }
  ctx.restore();
}
const NOTES = [NOTE.base, NOTE.pink, NOTE.blue];
// His clipboard, big, gripped at its top.
function bigBoard(ctx, x, y, s, rot, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.roundRect(-s * 0.7, -s, s * 1.4, s * 1.9, s * 0.12);
  ctx.fillStyle = BOARD.base;
  ctx.fill();
  pen(ctx, BOARD.ink, 1.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(-s * 0.58, -s * 0.78, s * 1.16, s * 1.6, s * 0.06);
  ctx.fillStyle = BOARD.paper;
  ctx.fill();
  pen(ctx, BOARD.line, 1);
  for (let i = 0; i < 4; i++) {
    const yy = -s * 0.5 + i * s * 0.34;
    ctx.strokeRect(-s * 0.46, yy - s * 0.08, s * 0.16, s * 0.16);
    ctx.beginPath();
    ctx.moveTo(-s * 0.22, yy);
    ctx.lineTo(s * 0.42, yy);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.roundRect(-s * 0.3, -s * 1.12, s * 0.6, s * 0.26, s * 0.1);
  ctx.fillStyle = BOARD.clip;
  ctx.fill();
  pen(ctx, BOARD.clipSh, 1);
  ctx.stroke();
  ctx.restore();
}
// A soft splash of coffee: round drops flung up and out, a cream foam ring.
function splash(ctx, x, y, r, e, fade, n = 9, seed = 0) {
  if (fade <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= fade;
  floorRing(ctx, x, y, r * (0.4 + e * 0.8), rgba(COFFEE.base, 0.35), rgba(COFFEE.cream, 0.9), 1, 2.2);
  for (let i = 0; i < n; i++) {
    const an = Math.PI + (i / (n - 1)) * Math.PI + (hash(i + seed) - 0.5) * 0.3;
    const d = r * (0.3 + e * (0.7 + hash(i * 3 + seed) * 0.4));
    const px = x + Math.cos(an) * d;
    const py = y - 4 + Math.sin(an) * d * 0.7 + e * e * 14;
    const s = 3.2 * (1 - e * 0.5);
    ell(ctx, px, py, s, s * 1.1);
    ctx.fillStyle = COFFEE.base;
    ctx.fill();
    pen(ctx, COFFEE.ink, 0.9);
    ctx.stroke();
    ell(ctx, px - s * 0.3, py - s * 0.35, s * 0.3, s * 0.28);
    ctx.fillStyle = COFFEE.cream;
    ctx.fill();
  }
  ctx.restore();
}
// Soft steam rising.
function steamPuff(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.fillStyle = '#f4f2fa';
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
function envelope(ctx, x, y, s, rot, al, badge = 0) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.roundRect(-s, -s * 0.66, s * 2, s * 1.32, s * 0.16);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  pen(ctx, '#a8a6c6', 1.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-s * 0.9, -s * 0.56);
  ctx.lineTo(0, s * 0.1);
  ctx.lineTo(s * 0.9, -s * 0.56);
  ctx.stroke();
  if (badge > 0.01) {
    ctx.globalAlpha *= badge;
    ell(ctx, s * 0.9, -s * 0.66, s * 0.42, s * 0.42);
    ctx.fillStyle = '#ff6a7a';
    ctx.fill();
    pen(ctx, '#d04a5c', 1);
    ctx.stroke();
    word(ctx, '1', s * 0.9, -s * 0.62, s * 0.5, 1, '#ffffff');
  }
  ctx.restore();
}

// ---------- Quick Sync ----------
function syncWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, rgba(COFFEE.latte, 0.18 + 0.14 * p), rgba(COFFEE.base, 0.9), sstep(p / 0.2), 2.2);
  floorRing(ctx, x, y, r * 0.72, null, rgba(COFFEE.cream, 0.8), sstep(p / 0.3), 1.4, [4, 5]);
  const tap = Math.pow(Math.abs(Math.sin(time * 7)), 6) * 4 * (1 - p);
  const hy = y - 92 + p * 18 + tap;
  ctx.save();
  ctx.globalAlpha = 0.25 * sstep(p / 0.3);
  ell(ctx, x, y, 16 + p * 10, 4);
  ctx.fillStyle = '#3a2a3a';
  ctx.fill();
  ctx.restore();
  bigBoard(ctx, x, hy, 15, Math.sin(time * 3) * 0.06 - 0.1, sstep(p / 0.25));
  bigNote(ctx, x + 6, hy + 4, 8, 0.15, sstep((p - 0.2) / 0.2), NOTE.pink, 'SEE ME');
}
function syncHit(ctx, z, x, y, u, e, fade, time) {
  bigBoard(ctx, x, y - 14 + e * 6, 15, 1.4 * (1 - e) + 0.1, fade);
  splash(ctx, x, y, z.w / 2, e, fade, 7, 2);
  for (let i = 0; i < 6; i++) {
    const an = -Math.PI * (0.15 + i * 0.14);
    bigNote(ctx, x + Math.cos(an) * e * 50, y - 12 + Math.sin(an) * e * 40 + e * e * 20, 5, e * 4 + i, fade, NOTES[i % 3]);
  }
  word(ctx, 'WHAP!', x, y - 46 - e * 8, 16, fade, TIE.deep);
}

// ---------- Delegate ----------
function delegateWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, rgba(NOTE.base, 0.16 + 0.12 * p), rgba(NOTE.ink, 0.85), sstep(p / 0.25), 1.8, [5, 4]);
  const col = NOTES[(z.n ?? 0) % 3];
  const fl = Math.sin(time * 4 + (z.n ?? 0)) * (1 - p);
  bigNote(ctx, x + fl * 6, y - 74 + p * 30, 8, fl * 0.3, sstep(p / 0.25), col, ['TPS', 'ASAP', 'FYI', 'EOD'][(z.n ?? 0) % 4]);
}
function delegateHit(ctx, z, x, y, u, e, fade, time) {
  const col = NOTES[(z.n ?? 0) % 3];
  bigNote(ctx, x, y - 30 + e * 6, 8 * (1 + e * 0.2), 0.1, fade, col);
  for (let i = 0; i < 5; i++) {
    const an = -Math.PI * (0.1 + i * 0.2);
    sparkle(ctx, x + Math.cos(an) * (8 + e * 24), y - 26 + Math.sin(an) * (6 + e * 16), 3 * (1 - e), fade);
  }
}

// ---------- Circle Back (the ring: its middle safe) ----------
function circleWarn(ctx, z, x, y, p, time) {
  const inner = z.inner;
  const R = z.w / 2;
  // (the floor beyond the felt-tip circle washed in coffee, deepening)
  ctx.save();
  ctx.globalAlpha = 0.14 + 0.2 * p;
  ctx.fillStyle = COFFEE.base;
  ctx.fillRect(x - R, y - 8, R - inner, 12);
  ctx.fillRect(x + inner, y - 8, R - inner, 12);
  ctx.restore();
  // ripples running outward over it
  for (let k = 0; k < 3; k++) {
    const v = (time * 0.6 + k / 3) % 1;
    floorRing(ctx, x, y, inner + v * (R - inner), null, rgba(COFFEE.cream, 0.5 * (1 - v)), sstep(p / 0.3), 1.4);
  }
  // the circle drawn round him in felt tip, the pen going round as the cast fills
  ctx.save();
  ctx.globalAlpha = 0.95;
  pen(ctx, MUG.bandSh, 4.2);
  ctx.beginPath();
  ctx.ellipse(x, y, inner, inner * 0.22, 0, -Math.PI / 2, -Math.PI / 2 + TAU * sstep(p / 0.6));
  ctx.stroke();
  pen(ctx, MUG.bandLt, 2);
  ctx.stroke();
  ctx.restore();
  if (p > 0.6) word(ctx, 'IN!', x, y - 60, 12, sstep((p - 0.6) / 0.2), MUG.bandSh);
}
function circleHit(ctx, z, x, y, u, e, fade, time) {
  const inner = z.inner;
  const R = z.w / 2;
  ctx.save();
  ctx.globalAlpha = fade * 0.5;
  ctx.fillStyle = COFFEE.deep;
  ctx.fillRect(x - R, y - 8, R - inner, 12);
  ctx.fillRect(x + inner, y - 8, R - inner, 12);
  ctx.restore();
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) splash(ctx, x + s * (inner + 40 + i * ((R - inner - 60) / 5)), y, 26, e, fade * (1 - i * 0.08), 5, i * 7 + (s > 0 ? 3 : 0));
}
// ---------- ...and back around (a patch round him) ----------
function backWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, rgba(COFFEE.base, 0.2 + 0.2 * p), rgba(COFFEE.ink, 0.9), sstep(p / 0.2), 3);
  floorRing(ctx, x, y, r - 5, null, rgba(COFFEE.cream, 0.9), sstep(p / 0.2), 1.6);
  for (let i = 0; i < 6; i++) {
    const v = (time * 0.5 + i / 6) % 1;
    steamPuff(ctx, x + Math.cos((i / 6) * TAU) * r * 0.85, y - 4 - v * 30, 4 + v * 4, 0.5 * p * Math.sin(Math.PI * v));
  }
  if (p > 0.55) word(ctx, 'OUT!', x, y - 64, 12, sstep((p - 0.55) / 0.2), COFFEE.ink);
}
function backHit(ctx, z, x, y, u, e, fade, time) {
  splash(ctx, x, y, z.w / 2, e, fade, 11, 5);
  for (let i = 0; i < 5; i++) steamPuff(ctx, x - z.w / 3 + i * (z.w / 6), y - 10 - e * 26, 5 + e * 5, fade * 0.7);
}

// ---------- Reply All ----------
function replyWarn(ctx, z, x0, y, p, time) {
  const n = 9;
  for (let i = 0; i < n; i++) {
    const on = sstep(p * 1.5 - i / n);
    const ex = 40 + (i / (n - 1)) * (SW - 80);
    envelope(ctx, ex + Math.sin(time * 2 + i) * 3, 46 + Math.sin(time * 3 + i * 1.7) * 4, 9, Math.sin(i * 2.1) * 0.15, on, sstep((p - 0.3 - i * 0.04) / 0.15));
  }
  ctx.save();
  ctx.globalAlpha = 0.08 + 0.12 * p;
  ctx.fillStyle = '#cfe6ff';
  ctx.fillRect(0, 0, SW, 360);
  ctx.restore();
  if (p > 0.5) word(ctx, 'REPLY ALL', SW / 2, 82, 15, sstep((p - 0.5) / 0.2), '#5a7ad0');
}
function replyHit(ctx, z, x0, y, u, e, fade, time) {
  ctx.save();
  ctx.globalAlpha = 0.3 * fade;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, SW, 360);
  ctx.restore();
  for (let i = 0; i < 14; i++) {
    const ex = 20 + hash(i) * (SW - 40);
    envelope(ctx, ex + Math.sin(i + e * 4) * 10, 40 + e * (180 + hash(i * 5) * 100), 8, e * (hash(i * 2) - 0.5) * 3, fade, 1 - e);
  }
}

// ---------- Team Huddle ----------
function huddleWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, rgba(KNIT_LT, 0.2 + 0.16 * p), rgba('#c88a3c', 0.95), sstep(p / 0.2), 2.6);
  floorRing(ctx, x, y, r * 0.55, rgba('#ffffff', 0.25), rgba('#e8b664', 0.8), sstep(p / 0.3), 1.4);
  for (const s of [-1, 1]) for (let k = 0; k < 2; k++) {
    const v = (time * 1.2 + k * 0.5) % 1;
    const ax = x + s * (r + 30 - v * 26);
    ctx.save();
    ctx.globalAlpha = sstep(p / 0.3) * Math.sin(Math.PI * v);
    ctx.fillStyle = '#f4c46a';
    ctx.beginPath();
    ctx.moveTo(ax - s * 8, y - 12);
    ctx.lineTo(ax, y - 16);
    ctx.lineTo(ax, y - 8);
    ctx.closePath();
    ctx.fill();
    pen(ctx, '#c88a3c', 1.2);
    ctx.stroke();
    ctx.restore();
  }
  word(ctx, 'HUDDLE!', x, y - 72 + Math.sin(time * 4) * 2, 13, sstep(p / 0.3), '#a8743c');
}
const KNIT_LT = '#ffe3a0';
function huddleHit(ctx, z, x, y, u, e, fade, time) {
  ctx.save();
  ctx.globalAlpha = fade;
  glow(ctx, x, y - 16, 40 + e * 30, KNIT_LT, 0.55);
  ctx.restore();
  for (let i = 0; i < 8; i++) {
    const an = (i / 8) * TAU;
    bigNote(ctx, x + Math.cos(an) * (10 + e * 50), y - 20 + Math.sin(an) * (8 + e * 26), 5, an + e * 3, fade, NOTES[i % 3]);
  }
}

// ---------- Clock Watching (a half of the floor) ----------
function clockFace(ctx, x, y, r, hand, al, label) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.fillStyle = 'rgba(255,250,240,0.92)';
  ctx.fill();
  pen(ctx, COFFEE.ink, 2.4);
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const an = (i / 12) * TAU;
    ell(ctx, x + Math.cos(an) * r * 0.8, y + Math.sin(an) * r * 0.8, i % 3 ? 1.1 : 2, i % 3 ? 1.1 : 2);
    ctx.fillStyle = COFFEE.base;
    ctx.fill();
  }
  // (the minute hand sweeping, the hour hand pointing)
  pen(ctx, COFFEE.deep, 2.6);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(-Math.PI / 2 + hand) * r * 0.75, y + Math.sin(-Math.PI / 2 + hand) * r * 0.75);
  ctx.stroke();
  pen(ctx, TIE.base, 3.2);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + r * 0.42, y - r * 0.12);
  ctx.stroke();
  ell(ctx, x, y, 2.4, 2.4);
  ctx.fillStyle = GOLD.base;
  ctx.fill();
  if (label) word(ctx, label, x, y + r + 10, 10, 1, COFFEE.ink);
  ctx.restore();
}
function tickWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  ctx.save();
  ctx.globalAlpha = 0.12 + 0.22 * p;
  ctx.fillStyle = z.first ? '#ffe6b0' : '#cfe6ff';
  ctx.fillRect(x, y - 10, w, 14);
  // (a gentle striped band, like the lines of a timesheet)
  ctx.globalAlpha = 0.18 * p;
  ctx.fillStyle = COFFEE.base;
  for (let k = 0; k < w; k += 18) ctx.fillRect(x + k, y - 10, 8, 14);
  ctx.restore();
  const cx = clamp(x + w / 2, 40, SW - 40);
  clockFace(ctx, cx, y - 92, 22, TAU * sstep(p), sstep(p / 0.2), z.first ? 'TICK...' : '...TOCK');
}
function tickHit(ctx, z, x, y, u, e, fade, time) {
  const w = z.w;
  ctx.save();
  ctx.globalAlpha = 0.45 * fade;
  ctx.fillStyle = z.first ? '#ffe6b0' : '#cfe6ff';
  ctx.fillRect(x, y - 40 - e * 20, w, 50 + e * 20);
  ctx.restore();
  for (let i = 0; i < Math.max(3, Math.round(w / 60)); i++) sparkle(ctx, x + (i + 0.5) * (w / Math.max(3, Math.round(w / 60))), y - 14 - e * 30 - (i % 2) * 8, 5 * (1 - e * 0.5), fade, '#fff2c8');
  word(ctx, z.first ? 'TICK!' : 'TOCK!', clamp(x + w / 2, 40, SW - 40), y - 70 - e * 10, 18, fade, COFFEE.ink);
}

// ---------- ...and one more thing ----------
function oneWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, rgba(NOTE.base, 0.18 + 0.18 * p), rgba(NOTE.ink, 0.9), sstep(p / 0.2), 2.4);
  for (let i = 0; i < 6; i++) {
    const an = (i / 6) * TAU + time * 2.4;
    bigNote(ctx, x + Math.cos(an) * r * 0.9, y - 18 + Math.sin(an) * r * 0.22 - 10, 5, an, sstep(p / 0.3), NOTES[i % 3]);
  }
  if (p > 0.5) word(ctx, '...one more thing!', x, y - 66, 10, sstep((p - 0.5) / 0.2), NOTE.ink);
}
function oneHit(ctx, z, x, y, u, e, fade, time) {
  for (let i = 0; i < 8; i++) {
    const an = (i / 8) * TAU + time;
    bigNote(ctx, x + Math.cos(an) * (z.w / 2) * (0.8 + e * 0.6), y - 18 + Math.sin(an) * 12 - e * 24, 5, an + e * 4, fade, NOTES[i % 3]);
  }
  floorRing(ctx, x, y, (z.w / 2) * (0.6 + e * 0.6), null, rgba('#ffffff', 0.9), fade, 3);
}

// ---------- Just One More Thing ----------
function bell(ctx, x, y, s, ring, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(Math.sin(ring * 30) * 0.12 * ring);
  ctx.beginPath();
  ctx.moveTo(-s, s * 0.4);
  ctx.quadraticCurveTo(-s, -s * 0.8, 0, -s * 0.85);
  ctx.quadraticCurveTo(s, -s * 0.8, s, s * 0.4);
  ctx.closePath();
  ctx.fillStyle = GOLD.base;
  ctx.fill();
  pen(ctx, GOLD.ink, 1.6);
  ctx.stroke();
  ell(ctx, -s * 0.35, -s * 0.35, s * 0.25, s * 0.18);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(-s * 1.3, s * 0.4, s * 2.6, s * 0.4, s * 0.15);
  ctx.fillStyle = COFFEE.deep;
  ctx.fill();
  ell(ctx, 0, -s * 0.98, s * 0.16, s * 0.16);
  ctx.fillStyle = GOLD.sh;
  ctx.fill();
  ctx.restore();
}
function oneMoreWarn(ctx, z, x0, y, p, time) {
  const ring = p;
  bell(ctx, SW / 2, 62, 16, ring, sstep(p / 0.2));
  for (let k = 0; k < 3; k++) {
    const v = (time * (1 + p * 2) + k / 3) % 1;
    ctx.save();
    ctx.globalAlpha = sstep(p / 0.3) * (1 - v) * 0.7;
    pen(ctx, GOLD.sh, 2);
    ctx.beginPath();
    ctx.ellipse(SW / 2, 62, 20 + v * 70, 12 + v * 36, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.globalAlpha = 0.06 + 0.12 * p;
  ctx.fillStyle = NOTE.base;
  ctx.fillRect(0, 0, SW, 360);
  ctx.restore();
  word(ctx, 'ONE MORE THING', SW / 2, 104, 14, sstep((p - 0.3) / 0.2), TIE.deep);
}
function oneMoreHit(ctx, z, x0, y, u, e, fade, time) {
  ctx.save();
  ctx.globalAlpha = 0.35 * fade;
  ctx.fillStyle = '#fff6dc';
  ctx.fillRect(0, 0, SW, 360);
  ctx.restore();
  bell(ctx, SW / 2, 62, 16, 1 - e, fade);
  for (let i = 0; i < 16; i++) {
    const nx = 20 + hash(i * 1.7) * (SW - 40);
    bigNote(ctx, nx, 40 + e * (200 + hash(i * 3) * 90), 6, e * (hash(i) - 0.5) * 6, fade, NOTES[i % 3]);
  }
}

export const MANAGER_FX = {
  nmSync: { warn: syncWarn, hit: syncHit },
  nmDelegate: { warn: delegateWarn, hit: delegateHit },
  nmCircle: { warn: circleWarn, hit: circleHit },
  nmBack: { warn: backWarn, hit: backHit },
  nmReply: { warn: replyWarn, hit: replyHit },
  nmHuddle: { warn: huddleWarn, hit: huddleHit },
  nmTick: { warn: tickWarn, hit: tickHit },
  nmOne: { warn: oneWarn, hit: oneHit },
  nmOneMore: { warn: oneMoreWarn, hit: oneMoreHit },
};
// (how long each landing plays, s: world/bossfight.js LOOK_HOLD carries the same)
export const MANAGER_HOLD = { nmSync: 0.9, nmDelegate: 0.6, nmCircle: 0.9, nmBack: 0.8, nmReply: 1, nmHuddle: 0.9, nmTick: 0.8, nmOne: 0.7, nmOneMore: 1.1 };
export const MANAGER_OWN_WARN = Object.keys(MANAGER_FX);
