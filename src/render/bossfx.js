// Every boss cast's own look (2026-11-18): drawn over the floor warning while the cast winds up,
// and in place of the plain flash when it lands. A zone carries `look` (world/observatory.js sets
// it); castWarn() draws the wind-up (`p` 0..1 through the warning), castHit() the landing (`u` 0..1
// over HOLD[look] seconds; world/dungeon.js keeps the zone that long). (x, y) is the zone's spot on
// screen (a band's left end); the screen is 640 x 360.
//   Folio        shush (sound rings), overdue / books (a book falling shut), lamp (a cone of
//                lamplight), bookmark (a ribbon slash), study (a pile of books)
//   Eclipse      sunrise (a sun bursting up), moonfall (a crescent crashing down), fang (fiery jaws),
//                crescentsweep (a crescent wave), corona (sun sparks), tide (moonlit water),
//                eclipse / total (the moon over the sun, the room going dark)
//   Astraea      starfall (falling stars), hoof (a glowing hoof print), comet (a comet down the line),
//                night (the sky coming down), twinstars (two stars), orbit (a ring of stars),
//                lines (beams of starlight), nova (a star bursting)

import { puff, shock, starFlash, easeOut, bloom } from './fxkit.js';

const TAU = Math.PI * 2;
const SW = 640;
const SH = 360;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
// How long each landing effect plays (s); the rest play 0.6 s.
export const HOLD = { overdue: 0.9, books: 0.8, study: 0.9, bookmark: 0.7, comet: 0.75, crescentsweep: 0.75, eclipse: 1.3, total: 1.3, night: 1.3, shush: 0.9, nova: 0.9, lines: 0.8, starfall: 0.7 };
// Looks that draw their own warning instead of the standard one.
export const OWN_WARN = new Set(['lines']);

// ---------- Little drawing helpers ----------
function star(ctx, x, y, r, c, rot = 0) {
  ctx.fillStyle = c;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + (i * Math.PI) / 5;
    const q = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q);
  }
  ctx.closePath();
  ctx.fill();
}
function glow(ctx, x, y, r, rgb, a) {
  if (a <= 0 || r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
// A closed book (cover colour c), its spine down, tilted `rot`.
function book(ctx, x, y, w, h, c, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = '#3a2d4f';
  ctx.fillRect(-w / 2 - 1, -h - 1, w + 2, h + 2);
  ctx.fillStyle = c;
  ctx.fillRect(-w / 2, -h, w, h);
  ctx.fillStyle = '#fff4e0';
  ctx.fillRect(-w / 2 + 2, -h + 2, w - 3, h * 0.18);
  ctx.fillStyle = '#ffd36b';
  ctx.fillRect(-w / 2, -h, w * 0.14, h);
  star(ctx, w * 0.08, -h * 0.55, Math.min(w, h) * 0.16, '#ffd36b');
  ctx.restore();
}
// Loose pages fluttering up and out.
function pages(ctx, x, y, u, n, seed = 0) {
  for (let k = 0; k < n; k++) {
    const a = -Math.PI * (0.15 + ((k * 0.37 + seed) % 1) * 0.7);
    const d = easeOut(u) * (18 + (k % 3) * 10);
    ctx.save();
    ctx.globalAlpha *= 1 - u;
    ctx.translate(x + Math.cos(a) * d, y - 4 + Math.sin(a) * d - u * 10);
    ctx.rotate(u * 6 + k);
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(-2.6, -3.2, 5.2, 6.4);
    ctx.fillStyle = '#b8a8d8';
    ctx.fillRect(-1.6, -1.6, 3.2, 0.6);
    ctx.fillRect(-1.6, 0.2, 2.4, 0.6);
    ctx.restore();
  }
}
// A falling star with its trail, its head at (x, y), falling from up-left.
function fallingStar(ctx, x, y, r, a = 1) {
  ctx.save();
  ctx.globalAlpha *= a;
  const g = ctx.createLinearGradient(x - 40, y - 60, x, y);
  g.addColorStop(0, 'rgba(255,243,166,0)');
  g.addColorStop(1, 'rgba(255,243,166,0.85)');
  ctx.strokeStyle = g;
  ctx.lineWidth = r * 0.9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 40, y - 60);
  ctx.lineTo(x, y);
  ctx.stroke();
  glow(ctx, x, y, r * 3, '255,243,166', 0.6);
  star(ctx, x, y, r, '#fff3a6', y * 0.05);
  star(ctx, x, y, r * 0.45, '#ffffff', y * 0.05);
  ctx.restore();
}
const arcs = (ctx, x, y, r, side, a, c, w) => {
  ctx.globalAlpha = a;
  ctx.strokeStyle = c;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.7, 0, side > 0 ? -0.7 : Math.PI - 0.7, side > 0 ? 0.7 : Math.PI + 0.7);
  ctx.stroke();
};

// ---------- The wind-ups ----------
export function castWarn(ctx, z, x, y, p, time) {
  const look = z.look;
  ctx.save();
  if (look === 'shush') {
    // Rings of hush rolling out from her beak, quicker as it comes.
    for (let k = 0; k < 3; k++) {
      const u = (time * (0.8 + p) + k / 3) % 1;
      for (const side of [-1, 1]) arcs(ctx, x + side * (12 + u * 60), y - 70, 12 + u * 30, side, (1 - u) * (0.35 + p * 0.55), '#e8dcff', 2.4);
    }
  } else if (look === 'overdue' || look === 'books' || look === 'study') {
    // The book (or books) dropping from on high in the last part of the warning, its shadow growing.
    const big = look === 'overdue';
    const f = clamp01((p - 0.45) / 0.55);
    ctx.globalAlpha = 0.25 + f * 0.4;
    ctx.fillStyle = '#1a1030';
    ctx.beginPath();
    ctx.ellipse(x, y, (big ? 22 : 13) * (0.4 + f * 0.6), 3.4, 0, 0, TAU);
    ctx.fill();
    if (f > 0) {
      ctx.globalAlpha = 1;
      const n = look === 'study' ? 3 : 1;
      for (let k = 0; k < n; k++) {
        const yy = y - 150 * (1 - f * f) - k * 9;
        book(ctx, x + (k - (n - 1) / 2) * 4, yy, big ? 34 : look === 'study' ? 22 : 18, big ? 26 : look === 'study' ? 8 : 14, ['#a84a5a', '#3a5a8a', '#5a7a4a'][(k + Math.round(z.x / 50)) % 3], Math.sin(time * 6 + k) * 0.25 * (1 - f));
      }
    }
  } else if (look === 'lamp') {
    // A cone of warm lamplight pouring down over her.
    const r = z.w / 2;
    const g = ctx.createLinearGradient(x, y - 160, x, y);
    g.addColorStop(0, `rgba(255,224,150,${0.05 + p * 0.1})`);
    g.addColorStop(1, `rgba(255,224,150,${0.15 + p * 0.3})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 160);
    ctx.lineTo(x + 12, y - 160);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x - r, y);
    ctx.closePath();
    ctx.fill();
    for (let k = 0; k < 6; k++) {
      const u = (time * 0.4 + k / 6) % 1;
      ctx.globalAlpha = Math.sin(u * Math.PI) * (0.3 + p * 0.5);
      ctx.fillStyle = '#fff3c4';
      ctx.fillRect(Math.round(x + (k - 2.5) * r * 0.3 * u), Math.round(y - 150 + u * 140), 2, 2);
    }
  } else if (look === 'bookmark') {
    // A ribbon laid along the cut, rippling.
    ctx.globalAlpha = 0.35 + p * 0.5;
    ctx.strokeStyle = '#e04a5a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      ctx.lineTo(x + z.w * u, y - 6 + Math.sin(u * 14 - time * 6) * 2);
    }
    ctx.stroke();
  } else if (look === 'sunrise') {
    // Rays rising out of the ring round Sol.
    const r = z.w / 2;
    for (let k = 0; k < 9; k++) {
      const u = (time * 0.9 + k / 9) % 1;
      const px = x + Math.cos((k / 9) * TAU) * r * 0.8;
      ctx.globalAlpha = Math.sin(u * Math.PI) * (0.3 + p * 0.6);
      ctx.fillStyle = k % 2 ? '#ffd36b' : '#ffb84a';
      ctx.fillRect(Math.round(px - 1.5), Math.round(y - 6 - u * (20 + p * 30)), 3, Math.round(8 + p * 10));
    }
    glow(ctx, x, y - 10, r * 0.8, '255,211,107', 0.12 + p * 0.25);
  } else if (look === 'moonfall') {
    // A pale crescent moon coming down over the ring.
    const f = easeOut(clamp01(p * 1.1));
    const my = y - 170 + f * 120;
    glow(ctx, x, my, 50, '216,228,255', 0.2 + p * 0.3);
    ctx.globalAlpha = 0.5 + p * 0.5;
    ctx.fillStyle = '#e8eeff';
    ctx.beginPath();
    ctx.arc(x, my, 26, 0, TAU);
    ctx.arc(x + 11, my - 6, 22, 0, TAU, true);
    ctx.fill('evenodd');
  } else if (look === 'fang') {
    // Fiery jaws over the tank, closing.
    const gap = 34 * (1 - p) + 5;
    glow(ctx, x, y - 44, 40, '255,154,58', 0.15 + p * 0.3);
    for (const s of [-1, 1]) {
      ctx.globalAlpha = 0.45 + p * 0.55;
      ctx.fillStyle = s < 0 ? '#ff9a3a' : '#ffd36b';
      ctx.beginPath();
      ctx.moveTo(x - 32, y - 44 + s * gap);
      ctx.quadraticCurveTo(x, y - 44 + s * (gap + 20), x + 32, y - 44 + s * gap);
      for (let k = 6; k >= 0; k--) ctx.lineTo(x - 32 + k * 10.6, y - 44 + s * (gap - (k % 2 ? 8 : 0)));
      ctx.closePath();
      ctx.fill();
    }
  } else if (look === 'crescentsweep') {
    const dir = z.dir ?? 1;
    const sx = dir < 0 ? x + z.w : x;
    const r = 8 + p * 14;
    ctx.globalAlpha = 0.2 + p * 0.35;
    ctx.fillStyle = '#d8e4ff';
    for (let k = 0; k < 12; k++) {
      const kx = sx + dir * z.w * ((k + ((time * 1.5) % 1)) / 12);
      ctx.fillRect(Math.round(kx), Math.round(y - 3), 6, 1);
    }
    ctx.globalAlpha = 0.45 + p * 0.55;
    glow(ctx, sx, y - 16, r * 2, '216,228,255', 0.5);
    ctx.fillStyle = '#e8eeff';
    ctx.save();
    ctx.translate(sx, y - 16);
    if (dir < 0) ctx.scale(-1, 1);
    ctx.beginPath();
    ctx.arc(0, 0, r, -1.35, 1.35);
    ctx.arc(-r * 0.42, 0, r * 0.86, 1.25, -1.25, true);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (look === 'corona' || look === 'starfall') {
    // A spark (or a star) streaking down onto them in the last part.
    const f = clamp01((p - 0.35) / 0.65);
    const kindle = clamp01(p / 0.35);
    const sy = y - 6 - 160 * (1 - f) * (1 - f);
    if (look === 'starfall') {
      if (f > 0) fallingStar(ctx, x + 40 * (1 - f), sy, 5.5, 0.5 + f * 0.5);
      else {
        glow(ctx, x + 40, y - 166, 8 + kindle * 10, '255,243,166', 0.6 * kindle);
        star(ctx, x + 40, y - 166, 2 + kindle * 3, '#fff3a6', time * 3);
      }
    } else {
      glow(ctx, x, sy, 14 + kindle * 10, '255,184,74', 0.4 + kindle * 0.4);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * TAU + time * 2;
        ctx.globalAlpha = kindle * 0.8;
        ctx.strokeStyle = '#ffb84a';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * 7, sy + Math.sin(a) * 7);
        ctx.lineTo(x + Math.cos(a) * 12, sy + Math.sin(a) * 12);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      star(ctx, x, sy, 3 + kindle * 3, '#ffd36b', time * 4);
    }
  } else if (look === 'tide') {
    // Moonlit water swirling in the ring.
    const R = z.w / 2;
    for (let k = 0; k < 4; k++) {
      const u = 1 - ((time * (0.6 + p * 0.8) + k / 4) % 1);
      ctx.globalAlpha = (0.25 + p * 0.5) * Math.sin(u * Math.PI);
      ctx.strokeStyle = k % 2 ? '#9fd8ff' : '#e8f4ff';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(x, y - 2, 8 + u * R, 3 + u * 6, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.3 + p * 0.5;
    glow(ctx, x, y - 8, 14 + p * 12, '159,216,255', 0.5);
  } else if (look === 'eclipse' || look === 'total') {
    // Above the room, the moon sliding across the sun; the room dimming.
    const cx = SW / 2;
    const cy = 120;
    ctx.globalAlpha = p * (look === 'total' ? 0.3 : 0.22);
    ctx.fillStyle = '#100828';
    ctx.fillRect(0, 0, SW, SH);
    ctx.globalAlpha = 1;
    glow(ctx, cx, cy, 46, look === 'total' ? '255,120,90' : '255,211,107', 0.5);
    ctx.fillStyle = look === 'total' ? '#ff9a6a' : '#ffd36b';
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2a2050';
    ctx.beginPath();
    ctx.arc(cx - 40 + p * 40, cy - 4 + p * 4, 18, 0, TAU);
    ctx.fill();
  } else if (look === 'hoof') {
    // The hoof print, outlined in light on the tank's spot.
    ctx.globalAlpha = 0.35 + p * 0.55;
    ctx.strokeStyle = '#fff3a6';
    ctx.lineWidth = 2;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(x + s * 11, y - 1, 9.5, 4.2, s * 0.2, 0, TAU);
      ctx.stroke();
    }
    glow(ctx, x, y - 70, 24 + p * 16, '255,243,166', 0.2 + p * 0.35);
    star(ctx, x, y - 70, 2 + p * 4, '#fff3a6', time * 2);
  } else if (look === 'comet') {
    // A thin line of light along the shot, a star gathering at its start.
    ctx.globalAlpha = 0.25 + p * 0.5;
    ctx.fillStyle = '#fff3a6';
    ctx.fillRect(x, y - 9, z.w, 1);
    const sx = z.dir < 0 ? x + z.w : x;
    glow(ctx, sx, y - 10, 10 + p * 14, '255,243,166', 0.6);
  } else if (look === 'night') {
    // The sky coming down: the room darkening and stars coming out across it.
    ctx.globalAlpha = p * 0.3;
    ctx.fillStyle = '#0a0a30';
    ctx.fillRect(0, 0, SW, SH);
    for (let k = 0; k < 14; k++) {
      ctx.globalAlpha = p * (0.4 + 0.6 * Math.sin(time * 3 + k));
      star(ctx, (k * 97 + 30) % SW, 30 + ((k * 53) % 140), 1.6 + (k % 3), '#fff3a6');
    }
  } else if (look === 'twinstars') {
    const f = clamp01((p - 0.35) / 0.65);
    for (const s of [-1, 1]) {
      const a = time * 4 + (s > 0 ? Math.PI : 0);
      fallingStar(ctx, x + Math.cos(a) * 14 * (1 - f), y - 8 - 130 * (1 - f) + Math.sin(a) * 6, 4, 0.3 + f * 0.7);
    }
  } else if (look === 'orbit') {
    // Stars wheeling round her along the ring.
    const r = z.w / 2;
    for (let k = 0; k < 10; k++) {
      const a = time * 1.6 + (k / 10) * TAU;
      ctx.globalAlpha = 0.4 + p * 0.6;
      star(ctx, x + Math.cos(a) * r * 0.82, y - 6 + Math.sin(a) * 8, 2.4 + p, k % 2 ? '#ffffff' : '#fff3a6', a);
    }
  } else if (look === 'lines') {
    // Its own warning: a band of starry floor, stars twinkling up out of it.
    ctx.globalAlpha = 0.18 + p * 0.25;
    ctx.fillStyle = '#c8c8ff';
    ctx.fillRect(x, y - 6, z.w, 10);
    ctx.globalAlpha = 0.5 + p * 0.5;
    ctx.strokeStyle = '#fff3a6';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y - 5.5, z.w - 1, 9);
    for (let k = 0; k < 5; k++) {
      const u = (time * 0.8 + k / 5) % 1;
      ctx.globalAlpha = Math.sin(u * Math.PI) * (0.4 + p * 0.6);
      star(ctx, x + z.w * ((k + 0.5) / 5), y - 4 - u * (14 + p * 20), 1.6 + p, '#fff3a6');
    }
  } else if (look === 'nova') {
    // A star at the heart of the room gathering light.
    glow(ctx, SW / 2, 120, 20 + p * 60, '255,243,166', 0.2 + p * 0.5);
    star(ctx, SW / 2, 120, 4 + p * 8, '#ffffff', time * 2);
  }
  ctx.restore();
}

// ---------- The landings ----------
// Returns true if it drew (so the plain flash is skipped).
export function castHit(ctx, z, x, y, u, time) {
  const look = z.look;
  if (!look) return false;
  u = clamp01(u);
  const e = easeOut(u);
  const fade = u < 0.5 ? 1 : 1 - (u - 0.5) / 0.5;
  ctx.save();
  if (look === 'shush') {
    for (let k = 0; k < 3; k++) {
      const v = clamp01(e * 1.2 - k * 0.15);
      for (const side of [-1, 1]) arcs(ctx, x + side * v * 280, y - 56, 20 + v * 40, side, (1 - u) * 0.85, k % 2 ? '#c8b8ff' : '#ffffff', 3.4);
    }
    ctx.globalAlpha = (1 - u) * 0.18;
    ctx.fillStyle = '#d8ccff';
    ctx.fillRect(0, 0, SW, SH);
  } else if (look === 'overdue' || look === 'books' || look === 'study') {
    const big = look === 'overdue';
    const n = look === 'study' ? 3 : 1;
    ctx.globalAlpha = fade;
    for (let k = 0; k < n; k++) book(ctx, x + (k - (n - 1) / 2) * 3, y - k * (look === 'study' ? 7 : 0), big ? 34 : look === 'study' ? 22 : 18, big ? 22 : look === 'study' ? 7 : 12, ['#a84a5a', '#3a5a8a', '#5a7a4a'][(k + Math.round(z.x / 50)) % 3], (k - 1) * 0.08);
    for (const s of [-1, 1]) puff(ctx, x + s * (10 + e * (big ? 26 : 16)), y - 4, (big ? 8 : 5) * fade, '#fff4ea', '#c8b8d8');
    pages(ctx, x, y - (big ? 18 : 10), u, big ? 7 : 4, z.x * 0.01);
    if (u < 0.3) shock(ctx, x, y, (big ? 40 : 24) * e, 4 + e * 3, (1 - u) * 4, '#ffffff');
  } else if (look === 'lamp' || look === 'sunrise') {
    const r = z.w / 2;
    const sun = look === 'sunrise';
    glow(ctx, x, y - 20, r * (0.6 + e * 0.6), sun ? '255,184,74' : '255,224,150', 0.6 * fade);
    ctx.globalAlpha = fade;
    bloom(ctx, x, y - 22, 14 + e * (sun ? 30 : 20), sun ? 12 : 8, time * 0.6, sun ? '#ffb84a' : '#ffe08a', '#ffffff', 1);
    shock(ctx, x, y, r * e, 6 + e * 6, (1 - u) * 5, sun ? '#ffd36b' : '#fff3c4');
  } else if (look === 'bookmark' || look === 'crescentsweep' || look === 'comet') {
    // Something sweeping down the band: the head racing from the boss's end to the far end.
    const dir = z.dir ?? 1;
    const head = dir > 0 ? x + z.w * e : x + z.w * (1 - e);
    const tailLen = 70;
    ctx.globalAlpha = fade;
    if (look === 'bookmark') {
      ctx.lineCap = 'round';
      for (const [wd, col] of [[7, '#8a2a3a'], [5, '#e04a5a']]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = wd;
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const k = i / 24;
          ctx.lineTo(head - dir * tailLen * 1.4 * k, y - 10 + Math.sin(k * 9 - time * 14) * 6 * (1 - k * 0.6));
        }
        ctx.stroke();
      }
      ctx.fillStyle = '#ffd36b';
      ctx.fillRect(Math.round(head - 3), Math.round(y - 15), 6, 9);
      ctx.fillStyle = '#fff3c4';
      ctx.fillRect(Math.round(head - 3), Math.round(y - 6), 6, 3);
    } else if (look === 'crescentsweep') {
      glow(ctx, head, y - 16, 40, '216,228,255', 0.55);
      ctx.fillStyle = '#e8eeff';
      ctx.beginPath();
      ctx.arc(head, y - 16, 22, -1.35, 1.35);
      ctx.arc(head - 9, y - 16, 19, 1.25, -1.25, true);
      ctx.closePath();
      if (dir < 0) {
        ctx.save();
        ctx.translate(head * 2, 0);
        ctx.scale(-1, 1);
        ctx.fill();
        ctx.restore();
      } else ctx.fill();
      for (let k = 0; k < 7; k++) star(ctx, head - dir * (16 + k * 11), y - 16 + Math.sin(k * 2 + time * 8) * 9, 2 - k * 0.15, '#ffffff', k);
    } else {
      const g = ctx.createLinearGradient(head - dir * 90, 0, head, 0);
      g.addColorStop(0, 'rgba(255,243,166,0)');
      g.addColorStop(1, 'rgba(255,243,166,0.9)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(head - dir * 90, y - 10);
      ctx.lineTo(head, y - 14);
      ctx.lineTo(head, y - 6);
      ctx.closePath();
      ctx.fill();
      glow(ctx, head, y - 10, 18, '255,243,166', 0.8);
      star(ctx, head, y - 10, 5, '#ffffff', time * 6);
    }
  } else if (look === 'moonfall') {
    const r = z.w / 2;
    ctx.globalAlpha = fade;
    ctx.fillStyle = '#e8eeff';
    ctx.beginPath();
    ctx.arc(x, y - 30 + e * 10, 26, 0, TAU);
    ctx.arc(x + 11, y - 36 + e * 10, 22, 0, TAU, true);
    ctx.fill('evenodd');
    shock(ctx, x, y, r * (0.6 + e * 0.4), 8 + e * 2, (1 - u) * 5, '#d8e4ff');
    for (let k = 0; k < 8; k++) puff(ctx, x + Math.cos((k / 8) * TAU) * r * 0.85, y - 3, 5 * fade, '#eef2ff', '#b8c4e8');
  } else if (look === 'fang') {
    ctx.globalAlpha = fade;
    for (let k = 0; k < 8; k++) puff(ctx, x + (k - 3.5) * 8, y - 34 - e * 20 - (k % 2) * 8, 9 * fade, k % 2 ? '#ffd36b' : '#ff9a3a', '#c8582a');
    if (u < 0.3) starFlash(ctx, x, y - 44, 20 + u * 60, 10, 0.2, '#ffb84a', '#ffffff');
  } else if (look === 'corona') {
    if (u < 0.35) starFlash(ctx, x, y - 8, 16 + u * 50, 10, time, '#ffd36b', '#ffffff');
    glow(ctx, x, y - 8, 30, '255,184,74', 0.5 * fade);
    ctx.globalAlpha = fade;
    for (let k = 0; k < 8; k++) star(ctx, x + Math.cos((k / 8) * TAU) * e * 30, y - 8 + Math.sin((k / 8) * TAU) * e * 12 - e * 8, 2.6, k % 2 ? '#fff3c4' : '#ffd36b', k);
  } else if (look === 'tide') {
    ctx.globalAlpha = fade;
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI * (0.1 + (k / 9) * 0.8);
      const d = e * (30 + (k % 3) * 12);
      ctx.fillStyle = k % 2 ? '#9fd8ff' : '#e8f4ff';
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * d, y - 4 + Math.sin(a) * d * 1.4 + e * e * 30, 2.6, 3.6, 0, 0, TAU);
      ctx.fill();
    }
    shock(ctx, x, y, (z.w / 2) * e, 5 + e * 3, (1 - u) * 4, '#9fd8ff');
  } else if (look === 'eclipse' || look === 'total') {
    // The dark beat, then the corona flaring out round the hidden sun.
    const dark = u < 0.25 ? u / 0.25 : 1 - (u - 0.25) / 0.75;
    ctx.globalAlpha = dark * (look === 'total' ? 0.55 : 0.45);
    ctx.fillStyle = '#080418';
    ctx.fillRect(0, 0, SW, SH);
    ctx.globalAlpha = 1 - u;
    glow(ctx, SW / 2, 120, 40 + e * 60, look === 'total' ? '255,120,90' : '255,211,107', 0.7);
    starFlash(ctx, SW / 2, 120, 26 + e * 50, 16, time * 0.2, look === 'total' ? '#ff9a6a' : '#ffd36b', '#ffffff');
    ctx.fillStyle = '#1a1038';
    ctx.beginPath();
    ctx.arc(SW / 2, 120, 18, 0, TAU);
    ctx.fill();
  } else if (look === 'hoof') {
    ctx.globalAlpha = fade;
    ctx.fillStyle = '#fff3a6';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(x + s * 11, y - 1, 9.5, 4.2, s * 0.2, 0, TAU);
      ctx.fill();
    }
    glow(ctx, x, y - 6, 46, '255,243,166', 0.6 * fade);
    if (u < 0.3) starFlash(ctx, x, y - 16, 24 + u * 70, 12, 0.3, '#fff3a6', '#ffffff');
    for (let k = 0; k < 6; k++) star(ctx, x + (k - 2.5) * 12 * (0.5 + e), y - 10 - e * (20 + (k % 3) * 10), 2.4, k % 2 ? '#ffffff' : '#fff3a6', k);
    shock(ctx, x, y, (z.w / 2) * e, 5 + e * 4, (1 - u) * 5, '#fff3a6');
  } else if (look === 'night') {
    ctx.globalAlpha = (1 - u) * 0.35;
    ctx.fillStyle = '#0a0a30';
    ctx.fillRect(0, 0, SW, SH);
    for (let k = 0; k < 18; k++) {
      const sx = (k * 71 + 20) % SW;
      const sy = -20 + ((u * 1.3 + (k % 5) * 0.12) % 1) * (SH + 40);
      fallingStar(ctx, sx, sy, 2.6, (1 - u) * 0.9);
    }
  } else if (look === 'twinstars' || look === 'starfall') {
    if (u < 0.35) starFlash(ctx, x, y - 8, 18 + u * 50, 10, time, '#fff3a6', '#ffffff');
    glow(ctx, x, y - 8, 32, '255,243,166', 0.5 * fade);
    ctx.globalAlpha = fade;
    const n = look === 'twinstars' ? 10 : 7;
    for (let k = 0; k < n; k++) star(ctx, x + Math.cos((k / n) * TAU + 0.3) * e * (look === 'twinstars' ? 40 : 32), y - 8 + Math.sin((k / n) * TAU + 0.3) * e * 12 - e * 10, 2.6, k % 2 ? '#ffffff' : '#fff3a6', k);
    shock(ctx, x, y, (z.w / 2) * e, 4 + e * 3, (1 - u) * 4, '#fff3a6');
  } else if (look === 'orbit') {
    const r = z.w / 2;
    ctx.globalAlpha = fade;
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU;
      star(ctx, x + Math.cos(a) * r * (0.82 + e * 0.2), y - 6 + Math.sin(a) * (8 + e * 4) - e * 6, 3 * fade + 1, k % 2 ? '#ffffff' : '#fff3a6', a + u * 4);
    }
    shock(ctx, x, y, r * (0.8 + e * 0.2), 8 + e * 2, (1 - u) * 5, '#fff3a6');
  } else if (look === 'lines') {
    // Beams of starlight standing up out of the band.
    for (let b = 0; b < 3; b++) {
      const bx = x + z.w * ((b + 0.5) / 3);
      const bw = z.w / 5;
      const g = ctx.createLinearGradient(bx - bw, 0, bx + bw, 0);
      g.addColorStop(0, 'rgba(255,243,166,0)');
      g.addColorStop(0.5, `rgba(255,248,210,${0.6 * fade})`);
      g.addColorStop(1, 'rgba(255,243,166,0)');
      ctx.fillStyle = g;
      ctx.fillRect(bx - bw, y - 130 * e, bw * 2, 130 * e);
    }
    ctx.globalAlpha = fade;
    for (let k = 0; k < 4; k++) star(ctx, x + z.w * ((k + 0.5) / 4), y - 20 - e * 60 - k * 6, 2.2, '#ffffff', k + u * 3);
  } else if (look === 'nova') {
    ctx.globalAlpha = Math.max(0, 1 - u / 0.3) * 0.32;
    ctx.fillStyle = '#fffbe8';
    ctx.fillRect(0, 0, SW, SH);
    ctx.globalAlpha = 1 - u;
    glow(ctx, SW / 2, 120, 60 + e * 120, '255,243,166', 0.7);
    starFlash(ctx, SW / 2, 120, 30 + e * 90, 18, time * 0.2, '#fff3a6', '#ffffff');
    for (const s of [-1, 1]) for (let k = 0; k < 6; k++) puff(ctx, SW / 2 + s * e * (40 + k * 50), y - 4, 6 * (1 - u), '#fff8e0', '#e8d8a0');
  } else {
    ctx.restore();
    return false;
  }
  ctx.restore();
  return true;
}
