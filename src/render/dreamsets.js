// The Dream Theatre's acts, remade for Chapter 9 (2026-11-19): the Phantom Playwright is staging
// the Queen's dream, and her dream is her old life in the human world. Each act is a painted set on
// the theatre's stage (the velvet valance still frames them all): the morning train, packed and
// rocking, the town rushing past its windows; the office by day, a city skyline through its
// windows, the clock at nine; the same office at overtime, dark, the monitors glowing, the paper
// piled to the ceiling; the convenience store at two in the morning, its fridges humming, rain on
// the street outside; and her flat, the rain on its window, Mr. Prickles on the sill, the calendar
// with Monday circled. Nothing floats: the ledges are luggage racks on their brackets, filing
// cabinets, towers of copy-paper boxes and paperwork, shop shelving and drink crates, and her own
// furniture.

import { E, T, F, R, sprite, blit, snap, mix } from './pixel.js';
import { groundAt } from '../world/physics.js';

const TAU = Math.PI * 2;
const h01 = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const hexA = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${Math.max(0, Math.min(1, a))})`;
const wrap = (x, span) => ((x % span) + span) % span;
const sx = (cam, width, wx, k) => width / 2 - (cam.x + width / 2 - wx) * k;

// ---------- Cached pictures ----------
const M = 30;
const moveIn = (sh) => (sh.pts ? { ...sh, pts: sh.pts.map(([px, py]) => [px + M, py + M]) } : { ...sh, x: (sh.x ?? 0) + M, y: (sh.y ?? 0) + M });
function art(key, w, h, build) {
  return sprite(`ds|${key}`, () => ({ w: w + M * 2, h: Math.ceil(h) + M, shapes: build().filter(Boolean).map(moveIn), res: 2, soft: 'cel' }));
}
function at(ctx, s, x, y) {
  blit(ctx, s, snap(x - M), snap(y - M));
}
function glow(ctx, x, y, r, c, a) {
  if (a <= 0.005 || r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, hexA(c, a));
  g.addColorStop(1, hexA(c, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function standOn(map, wx, wy) {
  let best = groundAt(map, wx);
  for (const p of map.platforms ?? []) if (p.y > wy + 4 && p.y < best && wx >= p.x && wx <= p.x + p.w && !p.drift) best = p.y;
  return best;
}
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
// A wall clock at (x, y), r, its hands at h:m.
function clock(ctx, x, y, r, h, m, face = '#ffffff', rim = '#5a5a6a') {
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(x, y, r + 2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rim;
  for (let i = 0; i < 12; i++) ctx.fillRect(x + Math.sin((i * TAU) / 12) * (r - 2.5) - 0.5, y - Math.cos((i * TAU) / 12) * (r - 2.5) - 0.5, 1, 1);
  ctx.strokeStyle = '#2e2e3a';
  ctx.lineCap = 'round';
  for (const [a, l, w] of [[((h % 12) + m / 60) * (TAU / 12), r * 0.5, 2], [(m / 60) * TAU, r * 0.78, 1.4]]) {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.sin(a) * l, y - Math.cos(a) * l);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
}
// Rain streaks running down a pane (clip it first).
function rain(ctx, x, y, w, h, time, seed, c = '#a8c0ff') {
  ctx.strokeStyle = hexA(c, 0.5);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < Math.round(w / 9); i++) {
    const rx = x + h01(i + seed) * w;
    const ry = y + ((time * (90 + h01(i * 3 + seed) * 60) + h01(i * 7 + seed) * h) % (h + 20)) - 10;
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 1.5, ry + 7);
  }
  ctx.stroke();
}

// ======================================================================================
// Act I: the morning train
// ======================================================================================
// What rushes past the window: morning sky, the town far off, poles and trees whipping by.
function outside(ctx, x, y, w, h, time, scroll) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#8cc8ff');
  g.addColorStop(1, '#ffe2c4');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  // The town far off, slow.
  ctx.fillStyle = '#b8c4e8';
  const s1 = scroll * 0.25;
  for (let i = -1; i < w / 22 + 2; i++) {
    const n = i + Math.floor(s1 / 22);
    const bx = x + i * 22 - wrap(s1, 22);
    const bh = 14 + h01(n) * 26;
    ctx.fillRect(bx, y + h - 12 - bh, 18, bh + 12);
  }
  // Rooftops nearer, faster.
  ctx.fillStyle = '#8a98c8';
  const s2 = scroll * 0.6;
  for (let i = -1; i < w / 40 + 2; i++) {
    const n = i + Math.floor(s2 / 40);
    const bx = x + i * 40 - wrap(s2, 40);
    const bh = 10 + h01(n + 50) * 14;
    ctx.fillRect(bx, y + h - bh, 30, bh);
    ctx.beginPath();
    ctx.moveTo(bx - 2, y + h - bh);
    ctx.lineTo(bx + 15, y + h - bh - 8);
    ctx.lineTo(bx + 32, y + h - bh);
    ctx.fill();
  }
  // Poles whipping by, blurred.
  const s3 = scroll * 2.4;
  for (let i = -1; i < w / 120 + 2; i++) {
    const bx = x + i * 120 - wrap(s3, 120);
    ctx.fillStyle = hexA('#4a4a6a', 0.55);
    ctx.fillRect(bx, y, 5, h);
    ctx.fillStyle = hexA('#4a4a6a', 0.2);
    ctx.fillRect(bx + 5, y, 10, h);
  }
}
export function drawPaintedDreamTrain(ctx, t, cam, width, height, time, layerY, air, map) {
  const k = 0.55;
  const base = layerY(0, k);
  const off = cam.x * k;
  ctx.fillStyle = '#e8e4f0';
  ctx.fillRect(0, 0, width, height);
  // The ceiling: a pale band, strip lights along it.
  ctx.fillStyle = '#d6d2e4';
  ctx.fillRect(0, 0, width, base - 290);
  for (let x = -wrap(off, 150); x < width; x += 150) {
    glow(ctx, x + 50, base - 296, 60, '#fff8e0', 0.25);
    ctx.fillStyle = '#fffbe8';
    ctx.fillRect(Math.round(x + 10), base - 300, 80, 6);
  }
  // The lower wall, under the seats.
  ctx.fillStyle = '#c2bed6';
  ctx.fillRect(0, base - 96, width, height);
  ctx.fillStyle = '#a6a2be';
  ctx.fillRect(0, base - 99, width, 3);
  const scroll = time * 140 + cam.x;
  const span = 250;
  for (let i = -1; i < Math.ceil(width / span) + 2; i++) {
    const si = i + Math.floor(off / span);
    const cx = Math.round(i * span - wrap(off, span) + span / 2);
    if (((si % 4) + 4) % 4 === 0) {
      // A pair of sliding doors, little windows in them, yellow safety edges; a sign over them.
      ctx.fillStyle = '#a8acc4';
      ctx.fillRect(cx - 56, base - 250, 112, 250);
      ctx.fillStyle = '#9498b4';
      ctx.fillRect(cx - 1, base - 250, 2, 250);
      for (const dx of [-30, 30]) {
        ctx.save();
        rrect(ctx, cx + dx - 18, base - 220, 36, 90, 6);
        ctx.clip();
        outside(ctx, cx + dx - 18, base - 220, 36, 90, time, scroll + dx);
        ctx.restore();
        ctx.strokeStyle = '#7a7e98';
        ctx.lineWidth = 2.5;
        rrect(ctx, cx + dx - 18, base - 220, 36, 90, 6);
        ctx.stroke();
      }
      ctx.fillStyle = '#ffd34a';
      ctx.fillRect(cx - 58, base - 250, 3, 250);
      ctx.fillRect(cx + 55, base - 250, 3, 250);
      ctx.fillStyle = '#2a2a3a';
      ctx.fillRect(cx - 40, base - 274, 80, 16);
      ctx.fillStyle = '#ff9a3a';
      for (let d = 0; d < 9; d++) if (h01(d + Math.floor(time * 2)) > 0.35) ctx.fillRect(cx - 36 + d * 8.4, base - 270, 5, 8);
    } else {
      // A window bay: the town rushing past, a bench seat under it, an ad above.
      ctx.save();
      rrect(ctx, cx - 92, base - 214, 184, 92, 10);
      ctx.clip();
      outside(ctx, cx - 92, base - 214, 184, 92, time, scroll);
      ctx.restore();
      ctx.strokeStyle = '#8e8aa8';
      ctx.lineWidth = 4;
      rrect(ctx, cx - 92, base - 214, 184, 92, 10);
      ctx.stroke();
      ctx.fillStyle = '#b4b0cc';
      ctx.fillRect(cx - 96, base - 122, 192, 6);
      const ad = [['#ff9ab8', '#fff0f4'], ['#ffd36b', '#fff8e0'], ['#8fe0c8', '#f0fff8'], ['#b8a8ff', '#f4f0ff']][((si % 4) + 4) % 4];
      ctx.fillStyle = ad[1];
      ctx.fillRect(cx - 62, base - 266, 124, 34);
      ctx.fillStyle = ad[0];
      ctx.fillRect(cx - 62, base - 266, 124, 6);
      ctx.fillRect(cx - 52, base - 254, 50, 4);
      ctx.fillRect(cx - 52, base - 246, 34, 3);
      ctx.beginPath();
      ctx.arc(cx + 34, base - 248, 10, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#4a64b0';
      ctx.fillRect(cx - 100, base - 92, 200, 50);
      ctx.fillStyle = '#5a78c8';
      ctx.fillRect(cx - 104, base - 46, 208, 14);
      ctx.fillStyle = '#7a98e0';
      ctx.fillRect(cx - 104, base - 46, 208, 3);
      for (let s = -2; s <= 2; s++) {
        ctx.fillStyle = '#4258a0';
        ctx.fillRect(cx + s * 40 - 1, base - 88, 2, 40);
      }
    }
  }
}

// ======================================================================================
// Acts II and III: the office, by day and at overtime
// ======================================================================================
function deskPic(night) {
  return art(`desk|${night ? 1 : 0}`, 120, 70, () => {
    const out = [];
    // A chair back behind, the desk, a monitor, papers, a mug.
    out.push(R(46, 26, 26, 30, night ? '#2a2e48' : '#5a6aa8'), R(10, 40, 100, 6, night ? '#5a4a42' : '#c8a07a'), R(14, 46, 4, 24, night ? '#3a302a' : '#9a7458'), R(102, 46, 4, 24, night ? '#3a302a' : '#9a7458'));
    out.push(R(38, 8, 40, 28, '#2e3446'), F(R(41, 11, 34, 22, night ? '#8fd0ff' : '#c8e6ff')), R(54, 36, 8, 4, '#2e3446'));
    out.push(F(R(16, 34, 18, 6, '#fbfaf6')), F(R(18, 31, 16, 4, '#fbfaf6')), R(88, 30, 9, 10, night ? '#e8e0d8' : '#ff9ab8'));
    if (night) for (let i = 0; i < 6; i++) out.push(F(R(84 + (i % 2), 22 - i * 3, 20, 3, i % 2 ? '#dcdad2' : '#fbfaf6')));
    return out;
  });
}
function officeWall(ctx, cam, width, height, time, layerY, map, night) {
  const mw = map?.width ?? 1600;
  const k = 0.32;
  const base = layerY(0, k);
  ctx.fillStyle = night ? '#232840' : '#eef0f6';
  ctx.fillRect(0, 0, width, height);
  // The window wall: tall panes, the city through them.
  const top = base - 300;
  const bot = base - 110;
  const g = ctx.createLinearGradient(0, top, 0, bot);
  g.addColorStop(0, night ? '#0e1230' : '#8ccaff');
  g.addColorStop(1, night ? '#2a2a5a' : '#e8f6ff');
  ctx.fillStyle = g;
  ctx.fillRect(0, top, width, bot - top);
  // The skyline: towers, their windows lit at night.
  const ks = 0.12;
  const offS = cam.x * ks;
  for (let i = -1; i < width / 46 + 2; i++) {
    const n = i + Math.floor(offS / 46);
    const bx = Math.round(i * 46 - wrap(offS, 46));
    const bh = 50 + h01(n) * 110;
    ctx.fillStyle = night ? '#1a1e3e' : '#a8b8d8';
    ctx.fillRect(bx, bot - bh, 40, bh);
    ctx.fillStyle = night ? '#ffe08a' : '#d8e6f6';
    for (let wy = bot - bh + 8; wy < bot - 6; wy += 10) for (let wx = bx + 5; wx < bx + 36; wx += 9) if (!night || h01(n * 13 + wx * 0.7 + wy) > 0.55) ctx.fillRect(wx, wy, 4, 5);
  }
  if (night) {
    ctx.fillStyle = '#fff6d0';
    ctx.beginPath();
    ctx.arc(sx(cam, width, mw * 0.7, 0.05), top + 40, 14, 0, TAU);
    ctx.fill();
  }
  // Mullions and the sill.
  ctx.fillStyle = night ? '#3a4060' : '#c8ccd8';
  for (let x = -wrap(cam.x * k, 120); x < width; x += 120) ctx.fillRect(Math.round(x), top, 6, bot - top);
  ctx.fillRect(0, top - 6, width, 8);
  ctx.fillRect(0, bot - 2, width, 10);
  // The wall below, a skirting.
  ctx.fillStyle = night ? '#1c2034' : '#dde0ea';
  ctx.fillRect(0, bot + 8, width, height);
  // The clock over the middle: nine in the morning, or a quarter to midnight.
  const cx = sx(cam, width, mw / 2, k);
  ctx.fillStyle = night ? '#232840' : '#eef0f6';
  ctx.fillRect(cx - 24, top - 48, 48, 44);
  clock(ctx, cx, top - 26, 16, night ? 11 : 9, night ? 47 : 0, night ? '#d8dcea' : '#ffffff');
  // Rows of desks.
  const kd = 0.5;
  const offD = cam.x * kd;
  const bd = layerY(0, kd);
  for (let i = -1; i < width / 150 + 2; i++) {
    const n = i + Math.floor(offD / 150);
    const x = Math.round(i * 150 - wrap(offD, 150));
    blit(ctx, deskPic(night), snap(x - M), snap(bd - 70 - M));
    if (night && h01(n * 5) > 0.45) glow(ctx, x + 58, bd - 50, 40, '#8fd0ff', 0.22);
  }
  if (!night) {
    // A whiteboard and a potted plant by day.
    const wx = sx(cam, width, mw * 0.25, k);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(wx - 50, bot + 16, 100, 56);
    ctx.strokeStyle = '#9aa0b0';
    ctx.lineWidth = 3;
    ctx.strokeRect(wx - 50, bot + 16, 100, 56);
    ctx.strokeStyle = '#ff7a8a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(wx - 40, bot + 60);
    ctx.lineTo(wx - 20, bot + 44);
    ctx.lineTo(wx, bot + 50);
    ctx.lineTo(wx + 20, bot + 30);
    ctx.lineTo(wx + 38, bot + 26);
    ctx.stroke();
  } else {
    // At overtime, one lamp still on: hers.
    const lx = sx(cam, width, mw * 0.5, kd);
    glow(ctx, lx, bd - 40, 90, '#ffd890', 0.3);
  }
}
export function drawPaintedDreamOffice(ctx, t, cam, width, height, time, layerY, air, map) {
  officeWall(ctx, cam, width, height, time, layerY, map, false);
}
export function drawPaintedDreamOvertime(ctx, t, cam, width, height, time, layerY, air, map) {
  officeWall(ctx, cam, width, height, time, layerY, map, true);
}

// ======================================================================================
// The convenience store at two in the morning
// ======================================================================================
function fridgePic(seed) {
  return art(`fridge|${seed % 3}`, 64, 160, () => {
    const cols = [['#ff6a7a', '#ffd34a', '#7fd8ff'], ['#9ae66a', '#ff9ab8', '#ffffff'], ['#ffb04a', '#b89aff', '#7fd8ff']][seed % 3];
    const out = [R(0, 0, 64, 160, '#c8d0dc'), R(4, 6, 56, 148, '#e8fbff')];
    for (let r = 0; r < 5; r++) {
      const y = 20 + r * 28;
      out.push(F(R(6, y + 18, 52, 3, '#b8c8d8')));
      for (let b = 0; b < 6; b++) {
        const c = cols[(b + r) % 3];
        out.push(F(R(8 + b * 8.6, y + 2, 6, 16, c)), F(R(9 + b * 8.6, y, 4, 3, '#4a4a5a')), F(R(9 + b * 8.6, y + 5, 1.4, 9, '#ffffff')));
      }
    }
    out.push(F(R(54, 60, 3, 30, '#9aa4b4')));
    return out;
  });
}
function shelfPic(seed) {
  return art(`shelfback|${seed % 3}`, 110, 100, () => {
    const out = [R(0, 0, 110, 100, '#e4e6ec'), F(R(0, 0, 110, 4, '#ffffff'))];
    const cols = ['#ff7a8a', '#ffd34a', '#8fe0c8', '#b89aff', '#ff9a4a', '#7fb0ff'];
    for (let r = 0; r < 3; r++) {
      const y = 10 + r * 30;
      out.push(R(2, y + 24, 106, 4, '#c8ccd4'));
      for (let b = 0; b < 7; b++) {
        const c = cols[(b * 2 + r + seed) % 6];
        out.push(R(5 + b * 15, y + 6, 12, 18, c), F(R(5 + b * 15, y + 6, 12, 4, '#ffffff')), F(E(11 + b * 15, y + 15, 3, 2.4, '#ffffff')));
      }
    }
    return out;
  });
}
export function drawPaintedDreamStore(ctx, t, cam, width, height, time, layerY, air, map) {
  const mw = map?.width ?? 1800;
  const k = 0.4;
  const base = layerY(0, k);
  ctx.fillStyle = '#f4f6fa';
  ctx.fillRect(0, 0, width, height);
  // Fluorescent tubes, bright, a little flicker in one.
  for (let x = -wrap(cam.x * 0.6, 160); x < width; x += 160) {
    const fl = h01(Math.floor(time * 7) + Math.round((x + cam.x * 0.6) / 160)) > 0.97 ? 0.4 : 1;
    glow(ctx, x + 60, base - 300, 70, '#ffffff', 0.3 * fl);
    ctx.fillStyle = hexA('#ffffff', fl);
    ctx.fillRect(Math.round(x + 10), base - 304, 100, 5);
  }
  // A coloured stripe round the walls, the shop's own.
  ctx.fillStyle = '#7fd0a8';
  ctx.fillRect(0, base - 280, width, 10);
  ctx.fillStyle = '#ff9a4a';
  ctx.fillRect(0, base - 270, width, 5);
  // The front window, the rainy street outside.
  const wx = sx(cam, width, mw * 0.14, k);
  if (wx > -220 && wx < width + 220) {
    const top = base - 250;
    ctx.save();
    ctx.beginPath();
    ctx.rect(wx - 170, top, 340, 200);
    ctx.clip();
    const g = ctx.createLinearGradient(0, top, 0, top + 200);
    g.addColorStop(0, '#0e1430');
    g.addColorStop(1, '#2a2a50');
    ctx.fillStyle = g;
    ctx.fillRect(wx - 170, top, 340, 200);
    ctx.fillStyle = '#1a1e3a';
    for (let i = 0; i < 6; i++) ctx.fillRect(wx - 170 + i * 60, top + 60 + h01(i) * 40, 50, 200);
    glow(ctx, wx + 80, top + 70, 50, '#ff6ab0', 0.35);
    ctx.fillStyle = '#ff9ad0';
    ctx.fillRect(wx + 60, top + 64, 40, 8);
    glow(ctx, wx - 90, top + 30, 40, '#ffe08a', 0.4);
    ctx.fillStyle = '#5a5a6a';
    ctx.fillRect(wx - 92, top + 30, 4, 170);
    rain(ctx, wx - 170, top, 340, 200, time, 3);
    ctx.restore();
    ctx.fillStyle = '#c8ccd8';
    ctx.fillRect(wx - 174, top - 4, 348, 6);
    ctx.fillRect(wx - 174, top + 198, 348, 8);
    ctx.fillRect(wx - 2, top, 4, 200);
  }
  // The fridges along the back wall, humming, cold light spilling from them.
  const k2 = 0.45;
  const b2 = layerY(0, k2);
  const fa = sx(cam, width, mw * 0.3, k2);
  const fb = sx(cam, width, mw * 0.78, k2);
  for (let i = 0; i * 66 + fa < Math.min(width + 70, fb); i++) {
    const x = fa + i * 66;
    if (x < -70) continue;
    glow(ctx, x + 32, b2 - 90, 60, '#c8f0ff', 0.18);
    blit(ctx, fridgePic(i), snap(x - M), snap(b2 - 170 - M));
  }
  // Shelves of snacks in front.
  const k3 = 0.6;
  const b3 = layerY(0, k3);
  const offS = cam.x * k3;
  for (let i = -1; i < width / 190 + 2; i++) {
    const n = i + Math.floor(offS / 190);
    const x = Math.round(i * 190 - wrap(offS, 190));
    blit(ctx, shelfPic(((n % 3) + 3) % 3), snap(x - M), snap(b3 - 100 - M));
  }
  // The counter and the till at the far end, the hot food case glowing.
  const cx = sx(cam, width, mw * 0.9, 0.6);
  if (cx > -150 && cx < width + 150) {
    ctx.fillStyle = '#d8dce6';
    ctx.fillRect(cx - 110, b3 - 70, 220, 70);
    ctx.fillStyle = '#7fd0a8';
    ctx.fillRect(cx - 110, b3 - 70, 220, 8);
    glow(ctx, cx - 60, b3 - 90, 40, '#ffb050', 0.4);
    ctx.fillStyle = '#ffd8a0';
    ctx.fillRect(cx - 90, b3 - 112, 60, 40);
    ctx.fillStyle = '#c87a3a';
    for (let i = 0; i < 4; i++) ctx.fillRect(cx - 86 + i * 14, b3 - 92, 10, 14);
    ctx.fillStyle = '#4a4a5a';
    ctx.fillRect(cx + 30, b3 - 98, 44, 28);
    ctx.fillStyle = '#8fd0ff';
    ctx.fillRect(cx + 34, b3 - 94, 26, 12);
    ctx.fillStyle = '#ff9a4a';
    ctx.fillRect(cx + 10, b3 - 260, 64, 26);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 14px Nunito, "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('24H', cx + 42, b3 - 241);
  }
}

// ======================================================================================
// Her flat
// ======================================================================================
// Mr. Prickles: a round little cactus in a pot, a pink flower on his head.
function pricklesPic() {
  return art('prickles', 24, 30, () => [
    T([[4, 18], [20, 18], [18, 30], [6, 30]], '#d8805a'), F(R(4, 18, 16, 3, '#e8a07a')),
    E(12, 12, 7, 8, '#6ac87a'), E(4, 12, 3, 4, '#6ac87a'), E(20, 10, 3, 4, '#6ac87a'),
    F(R(11.4, 5, 1.2, 14, '#4aa85a')), F(E(9, 9, 1.4, 2.4, '#9ae6a8')),
    E(12, 3.4, 3, 2.4, '#ff9ab8'), F(E(12, 3.4, 1.2, 1, '#ffd34a')),
  ]);
}
export function drawPaintedDreamFlat(ctx, t, cam, width, height, time, layerY, air, map) {
  const mw = map?.width ?? 1800;
  const k = 0.38;
  const base = layerY(0, k);
  // Lilac wallpaper in soft stripes, a skirting board.
  ctx.fillStyle = '#cfc0e4';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#c4b4dc';
  for (let x = -wrap(cam.x * k, 28); x < width; x += 28) ctx.fillRect(Math.round(x), 0, 12, height);
  ctx.fillStyle = '#e8e0f2';
  ctx.fillRect(0, base - 10, width, height);
  // The window: the city at night, rain running down it, Mr. Prickles on the sill.
  const wx = sx(cam, width, mw * 0.5, k);
  const top = base - 250;
  ctx.save();
  ctx.beginPath();
  ctx.rect(wx - 110, top, 220, 150);
  ctx.clip();
  const g = ctx.createLinearGradient(0, top, 0, top + 150);
  g.addColorStop(0, '#141a3e');
  g.addColorStop(1, '#2e3060');
  ctx.fillStyle = g;
  ctx.fillRect(wx - 110, top, 220, 150);
  for (let i = 0; i < 9; i++) {
    const bx = wx - 110 + i * 26;
    const bh = 40 + h01(i + 20) * 70;
    ctx.fillStyle = '#1e2248';
    ctx.fillRect(bx, top + 150 - bh, 22, bh);
    ctx.fillStyle = '#ffe08a';
    for (let wy = top + 156 - bh; wy < top + 146; wy += 9) for (let wx2 = bx + 4; wx2 < bx + 20; wx2 += 7) if (h01(wx2 * 3 + wy) > 0.6) ctx.fillRect(wx2, wy, 3, 4);
  }
  rain(ctx, wx - 110, top, 220, 150, time, 7);
  ctx.restore();
  ctx.fillStyle = '#f4f0f8';
  ctx.fillRect(wx - 116, top - 6, 232, 6);
  ctx.fillRect(wx - 3, top, 6, 150);
  ctx.fillRect(wx - 116, top + 72, 232, 4);
  ctx.fillRect(wx - 122, top + 150, 244, 10);
  blit(ctx, pricklesPic(), snap(wx + 60 - 12 - M), snap(top + 150 - 30 - M));
  // The calendar, every day crossed off, Monday circled in red.
  const cx = sx(cam, width, mw * 0.3, k);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - 34, top + 10, 68, 80);
  ctx.fillStyle = '#ff7a8a';
  ctx.fillRect(cx - 34, top + 10, 68, 14);
  ctx.strokeStyle = '#d83a5a';
  ctx.lineWidth = 1.2;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
    const x = cx - 28 + c * 10;
    const y = top + 30 + r * 14;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 6, y + 8);
    ctx.moveTo(x + 6, y);
    ctx.lineTo(x, y + 8);
    ctx.stroke();
  }
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx + 25, top + 76, 7, 6, 0, 0, TAU);
  ctx.stroke();
  // The wall clock: two in the morning.
  clock(ctx, sx(cam, width, mw * 0.66, k), top + 20, 15, 2, 0, '#fff8f0', '#8a6a9a');
  // Her desk under the window's left, the laptop still glowing; the closet open a crack.
  const dx = sx(cam, width, mw * 0.38, 0.5);
  const db = layerY(0, 0.5);
  glow(ctx, dx, db - 58, 50, '#8fd0ff', 0.25);
  ctx.fillStyle = '#c8905a';
  ctx.fillRect(dx - 60, db - 44, 120, 6);
  ctx.fillRect(dx - 56, db - 38, 4, 38);
  ctx.fillRect(dx + 52, db - 38, 4, 38);
  ctx.fillStyle = '#4a4a5a';
  ctx.fillRect(dx - 18, db - 70, 36, 24);
  ctx.fillStyle = '#8fd0ff';
  ctx.fillRect(dx - 15, db - 67, 30, 18);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(dx + 26, db - 54, 9, 10);
  const kx = sx(cam, width, mw * 0.78, 0.5);
  ctx.fillStyle = '#e8d8c4';
  ctx.fillRect(kx - 50, db - 190, 100, 190);
  ctx.fillStyle = '#d4c0a8';
  ctx.fillRect(kx - 2, db - 190, 4, 190);
  ctx.fillStyle = '#2a2240';
  ctx.fillRect(kx + 2, db - 186, 10, 182);
  for (let i = 0; i < 5; i++) glow(ctx, kx + 7, db - 170 + i * 34, 6, ['#ff9ab8', '#ffd34a', '#8fe0c8', '#b89aff', '#7fd8ff'][i], 0.6 + 0.3 * Math.sin(time * 2 + i));
}

// ======================================================================================
// Ledges
// ======================================================================================
// A luggage rack on two brackets off the carriage wall: chrome tubes, a mesh deck.
function rackPic(w) {
  return art(`rack|${w}`, w, 30, () => {
    const out = [];
    for (const px of [12, w - 12]) out.push(...[T([[px - 2, 6], [px + 2, 6], [px + 10, 28], [px + 6, 28]], '#8e92a4')]);
    out.push(R(-3, 0, w + 6, 5, '#c8ccd8'), F(R(-3, 0, w + 6, 1.4, '#ffffff')), R(-3, 5, w + 6, 3, '#9a9eb0'));
    for (let x = 4; x < w; x += 8) out.push(F(R(x, 1.4, 1, 3, '#9a9eb0')));
    return out;
  });
}
export function drawLuggageRack(ctx, x, y, w, time, seed, map, cam) {
  at(ctx, rackPic(w), snap(x), snap(y));
  // Straps hanging under it, swinging.
  for (let i = 0; i < Math.floor(w / 60); i++) {
    const hx = x + 30 + i * 60;
    const a = Math.sin(time * 1.6 + i + seed) * 0.12;
    ctx.strokeStyle = '#8e92a4';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(hx, y + 8);
    ctx.lineTo(hx + Math.sin(a) * 16, y + 8 + Math.cos(a) * 16);
    ctx.stroke();
    ctx.strokeStyle = '#ffd34a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(hx + Math.sin(a) * 20, y + 8 + Math.cos(a) * 20, 4, 0, TAU);
    ctx.stroke();
  }
}
// A row of filing cabinets, drawers and handles, from the floor up to the ledge.
function cabinetsPic(w, h) {
  return art(`cabinets|${w}|${h}`, w, h, () => {
    const n = Math.max(1, Math.round(w / 64));
    const cw = w / n;
    const out = [];
    for (let i = 0; i < n; i++) {
      const x0 = i * cw;
      out.push(R(x0 + 1, 0, cw - 2, h, '#b8bcc6'), F(R(x0 + 1, 0, 3, h, '#d4d8e0')), F(R(x0 + cw - 4, 0, 3, h, '#9a9ea8')));
      const rows = Math.max(1, Math.round(h / 26));
      for (let r = 0; r < rows; r++) {
        const y = 6 + (r * (h - 8)) / rows;
        out.push(F(R(x0 + 5, y, cw - 10, (h - 8) / rows - 4, '#c8ccd6')), R(x0 + cw / 2 - 7, y + 6, 14, 3, '#7a7e88'), F(R(x0 + cw / 2 - 5, y + 1.6, 10, 3, '#ffffff')));
      }
    }
    out.push(R(-2, 0, w + 4, 4, '#9a9ea8'), F(R(-2, 0, w + 4, 1.2, '#e8ecf2')));
    return out;
  });
}
export function drawCabinets(ctx, x, y, w, time, seed, map, cam) {
  const h = Math.round(standOn(map, x + cam.x + w / 2, y + cam.y) - (y + cam.y));
  at(ctx, cabinetsPic(w, Math.max(20, h)), snap(x), snap(y));
}
// A tower of copy-paper boxes, staggered as they were stacked, lids on.
function boxesPic(w, h, seed) {
  return art(`boxes|${w}|${h}|${seed % 3}`, w, h, () => {
    const out = [];
    const bh = 22;
    const rows = Math.max(1, Math.round(h / bh));
    const rh = h / rows;
    for (let r = rows - 1; r >= 0; r--) {
      const y = r * rh;
      const jitter = (h01(seed + r) - 0.5) * 8;
      const n = r === 0 ? 1 : 2;
      for (let i = 0; i < n; i++) {
        const bw = n === 1 ? w : w / 2;
        const x0 = i * bw + (r === 0 ? 0 : jitter);
        out.push(R(x0 + 1, y, bw - 2, rh, '#d8b88a'), F(R(x0 + 1, y, bw - 2, 4, '#e8cca0')), F(R(x0 + bw / 2 - 8, y + rh / 2 - 3, 16, 6, '#ffffff')), F(R(x0 + bw / 2 - 6, y + rh / 2 - 1, 12, 1.4, '#7a8ab8')));
      }
    }
    out.push(R(-2, 0, w + 4, 4, '#c8a070'));
    return out;
  });
}
export function drawBoxStack(ctx, x, y, w, time, seed, map, cam) {
  const h = Math.round(standOn(map, x + cam.x + w / 2, y + cam.y) - (y + cam.y));
  at(ctx, boxesPic(w, Math.max(20, h), seed), snap(x), snap(y));
}
// Towers of paperwork: sheets stacked a little crooked, a binder clip, sticky notes.
function paperPic(w, h, seed) {
  return art(`paper|${w}|${h}|${seed % 3}`, w, h, () => {
    const out = [];
    const n = Math.max(2, Math.round(w / 46));
    const sw = w / n;
    for (let i = 0; i < n; i++) {
      const x0 = i * sw;
      out.push(R(x0 + 2, 0, sw - 4, h, '#fbfaf6'));
      for (let y = 4; y < h; y += 5) {
        const j = (h01(seed * 7 + i * 31 + y) - 0.5) * 4;
        out.push(F(R(x0 + 2 + j, y, sw - 4, 1, '#dcdad2')));
      }
      if (h01(seed + i) > 0.4) out.push(F(R(x0 + sw - 10, 8 + h01(i + seed * 3) * (h - 30), 8, 8, ['#ffd34a', '#ff9ab8', '#8fe0c8'][(i + seed) % 3])));
    }
    out.push(R(w / 2 - 6, -2, 12, 5, '#3a3a4a'), F(R(w / 2 - 4, -5, 2, 4, '#9a9ea8')), F(R(w / 2 + 2, -5, 2, 4, '#9a9ea8')));
    out.push(F(R(-2, 0, w + 4, 2, '#ffffff')));
    return out;
  });
}
export function drawPaperStack(ctx, x, y, w, time, seed, map, cam) {
  const h = Math.round(standOn(map, x + cam.x + w / 2, y + cam.y) - (y + cam.y));
  at(ctx, paperPic(w, Math.max(20, h), seed), snap(x), snap(y));
}
// Shop shelving: a white metal unit, three shelves of snacks; its top is the ledge.
function storeShelfPic(w, h, seed) {
  return art(`storeshelf|${w}|${h}|${seed % 3}`, w, h, () => {
    const out = [R(0, 0, w, h, '#e8eaee'), F(R(0, 0, 4, h, '#ffffff')), F(R(w - 4, 0, 4, h, '#c8ccd4'))];
    const cols = ['#ff7a8a', '#ffd34a', '#8fe0c8', '#b89aff', '#ff9a4a', '#7fb0ff'];
    const rows = Math.max(1, Math.round(h / 28));
    for (let r = 0; r < rows; r++) {
      const y = 6 + (r * (h - 6)) / rows;
      const rh = (h - 6) / rows;
      out.push(R(2, y + rh - 4, w - 4, 4, '#c8ccd4'), F(R(2, y + rh - 4, w - 4, 1.4, '#ffffff')));
      for (let b = 0; b < Math.floor((w - 8) / 14); b++) {
        const c = cols[(b * 2 + r + seed) % 6];
        out.push(R(5 + b * 14, y + 4, 11, rh - 9, c), F(R(5 + b * 14, y + 4, 11, 3, '#ffffff')));
      }
    }
    out.push(R(-2, 0, w + 4, 4, '#c8ccd4'), F(R(-2, 0, w + 4, 1.2, '#ffffff')));
    return out;
  });
}
export function drawStoreShelf(ctx, x, y, w, time, seed, map, cam) {
  const h = Math.round(standOn(map, x + cam.x + w / 2, y + cam.y) - (y + cam.y));
  at(ctx, storeShelfPic(w, Math.max(20, h), seed), snap(x), snap(y));
}
// Plastic drink crates stacked up, bottles peeking out.
function cratesPic(w, h) {
  return art(`crates|${w}|${h}`, w, h, () => {
    const out = [];
    const rows = Math.max(1, Math.round(h / 22));
    const rh = h / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rh;
      const c = ['#ff9a4a', '#7fb0ff', '#9ae66a'][r % 3];
      out.push(R(0, y, w, rh, c), F(R(0, y, w, 3, '#ffffff')));
      for (let x = 6; x < w - 4; x += 12) out.push(F(R(x, y + 6, 6, rh - 10, '#2a2a3a')));
    }
    return out;
  });
}
export function drawCrates(ctx, x, y, w, time, seed, map, cam) {
  const h = Math.round(standOn(map, x + cam.x + w / 2, y + cam.y) - (y + cam.y));
  at(ctx, cratesPic(w, Math.max(20, h)), snap(x), snap(y));
}
// Her furniture, each kind its own: a bookshelf, a wardrobe, the fridge, a loft bed, a wall shelf.
function furniturePic(kind, w, h) {
  return art(`furniture|${kind}|${w}|${h}`, w, h, () => {
    const out = [];
    if (kind === 'bookshelf') {
      out.push(R(0, 0, w, h, '#b07a50'), F(R(0, 0, 4, h, '#c8905a')));
      const rows = Math.max(1, Math.round(h / 26));
      for (let r = 0; r < rows; r++) {
        const y = 4 + (r * (h - 4)) / rows;
        const rh = (h - 4) / rows;
        out.push(R(4, y, w - 8, rh - 4, '#5a3a2a'));
        for (let b = 0, bx = 6; bx < w - 10; b++) {
          const bw = 5 + h01(b + r * 9) * 6;
          out.push(R(bx, y + 3 + h01(b * 3 + r) * 4, bw, rh - 10 - h01(b * 3 + r) * 4, ['#ff9ab8', '#7fb0ff', '#ffd34a', '#8fe0c8', '#b89aff'][(b + r) % 5]));
          bx += bw + 1;
        }
      }
    } else if (kind === 'wardrobe') {
      out.push(R(0, 0, w, h, '#e8d8c4'), F(R(0, 0, 4, h, '#f4ead8')), R(w / 2 - 1, 4, 2, h - 8, '#c8b498'), R(w / 2 - 8, h * 0.45, 4, 12, '#a0805a'), R(w / 2 + 4, h * 0.45, 4, 12, '#a0805a'));
    } else if (kind === 'fridge') {
      out.push(R(0, 0, w, h, '#f4f6fa'), F(R(0, 0, 4, h, '#ffffff')), R(2, h * 0.36, w - 4, 3, '#c8ccd4'), R(w - 12, 10, 4, h * 0.2, '#9aa0b0'), R(w - 12, h * 0.44, 4, h * 0.3, '#9aa0b0'));
      out.push(F(R(12, 14, 14, 10, '#ffd34a')), F(R(30, 18, 10, 12, '#8fe0c8')), F(E(20, h * 0.5, 6, 6, '#ff9ab8')));
    } else if (kind === 'loftbed') {
      out.push(R(4, 14, 6, h - 14, '#c8905a'), R(w - 10, 14, 6, h - 14, '#c8905a'), R(0, 8, w, 10, '#c8905a'), F(R(0, 8, w, 3, '#e8b880')));
      out.push(R(4, 0, w - 8, 9, '#b8a8ff'), F(R(4, 0, w - 8, 3, '#d8ccff')));
      for (let y = 22; y < h - 6; y += 16) out.push(R(w - 26, y, 18, 3, '#c8905a'));
      out.push(R(14, h * 0.55, w * 0.4, h * 0.45, '#f4f0f8'), F(R(14, h * 0.55, w * 0.4, 4, '#ffffff')));
    } else {
      // A wall shelf on two brackets, a plant and a photo frame on it.
      out.push(R(-2, 0, w + 4, 6, '#c8905a'), F(R(-2, 0, w + 4, 1.6, '#e8b880')));
      for (const px of [10, w - 10]) out.push(T([[px - 2, 6], [px + 2, 6], [px + 2, 22], [px - 10, 6]].map(([a, b]) => [a, b]), '#a87a50'));
    }
    if (kind !== 'wallshelf' && kind !== 'loftbed') out.push(R(-2, 0, w + 4, 4, '#8a6a4a'), F(R(-2, 0, w + 4, 1.2, '#c8a07a')));
    return out;
  });
}
export function drawFurniture(ctx, x, y, w, time, seed, map, cam, kind) {
  const h = kind === 'wallshelf' ? 24 : Math.round(standOn(map, x + cam.x + w / 2, y + cam.y) - (y + cam.y));
  at(ctx, furniturePic(kind, w, Math.max(20, h)), snap(x), snap(y));
}
