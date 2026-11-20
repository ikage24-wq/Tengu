// Starfall Heights (its makeover, 2026-11-20): the valley's landmarks. In the crater, the Fallen
// Star itself: a giant star come down to rest, asleep with a smile, glowing; its two upper arms and
// its tip are ledges (in the map) and the starlight rises from behind it. Over the west rim, a
// crescent moon hung on golden chains like a hammock, its cradle a ledge (the top of the heights).

import { E, T, F, sprite, blit, snap } from './pixel.js';
import { band } from './propkit.js';

export const SF = {
  star: '#ffe48a', starLit: '#fff6c8', starSh: '#f0b850', starDeep: '#d8943a', line: '#b0702a',
  moon: '#fff2c8', moonLit: '#fffbe8', moonSh: '#ecd29a', crater: '#f0dcae', chain: '#f2c860', chainSh: '#c89838',
  blush: '#ffb0a0',
};

const h01 = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const hexA = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;
const arc = (cx, cy, rx, ry, a0, a1, n = 12) => Array.from({ length: n + 1 }, (_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
});

const M = 40;
const moveIn = (sh) => (sh.pts ? { ...sh, pts: sh.pts.map(([px, py]) => [px + M, py + M]) } : { ...sh, x: (sh.x ?? 0) + M, y: (sh.y ?? 0) + M });
function art(key, w, h, build) {
  return sprite(`sf|${key}`, () => ({ w: w + M * 2, h: h + M, shapes: build().filter(Boolean).map(moveIn), res: 2, soft: 'cel' }));
}
function place(ctx, s, x, y) {
  blit(ctx, s, snap(x - s.w / 2), snap(y - s.h));
}
// A five-pointed star's outline (rounded a little at the points), centre (cx, cy), point up.
function starPts(cx, cy, R, r, round = 0.06) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = ((-90 + i * 36) * Math.PI) / 180;
    const rr = i % 2 ? r : R;
    if (i % 2 === 0 && round > 0) {
      for (const d of [-round, round]) pts.push([cx + Math.cos(a + d) * rr * (1 - round * 0.6), cy + Math.sin(a + d) * rr * (1 - round * 0.6)]);
    } else pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return pts;
}

// ---------- The Fallen Star: lying in the crater with its two lower points on the ground, asleep
// (closed eyes, a smile, rosy cheeks), lit on its upper left, a soft rim of light. Bottom middle on
// the crater floor; its upper arms' tops are level, about 290 above the floor. ----------
const ST_W = 520;
const ST_H = 446;
const ST_C = [260, 250];
const ST_R = 240;
const ST_r = 105;
function starArt() {
  return art('star', ST_W, ST_H, () => {
    const out = [];
    const [cx, cy] = ST_C;
    out.push(T(starPts(cx, cy, ST_R, ST_r), SF.star));
    out.push(F(T(starPts(cx - 10, cy - 12, ST_R * 0.84, ST_r * 0.84, 0.08), SF.starLit)));
    out.push(F(T(starPts(cx, cy, ST_R * 0.62, ST_r * 0.62, 0.1), SF.star)));
    // Shade down its lower right, a seam along each arm's middle.
    out.push(F(T([[cx + 30, cy + 20], [cx + ST_R * Math.cos(0.94), cy + ST_R * Math.sin(0.94)], [cx + ST_r * Math.cos(1.57), cy + ST_r * Math.sin(1.57)]], SF.starSh)));
    out.push(F(T([[cx + 50, cy - 10], [cx + ST_R * Math.cos(-0.31), cy + ST_R * Math.sin(-0.31)], [cx + ST_r * Math.cos(0.31), cy + ST_r * Math.sin(0.31)]], SF.starSh)));
    for (let i = 0; i < 5; i++) {
      const a = ((-90 + i * 72) * Math.PI) / 180;
      out.push(F(band([[cx + Math.cos(a) * 40, cy + Math.sin(a) * 40], [cx + Math.cos(a) * (ST_R - 30), cy + Math.sin(a) * (ST_R - 30)]], (u) => 1.6 - u * 1.1, SF.starDeep)));
    }
    // Its face, asleep.
    const fy = cy + 20;
    for (const s of [-1, 1]) {
      out.push(F(band(arc(cx + s * 34, fy, 15, 10, 20, 160, 10), () => 3, SF.line)));
      out.push(F(band([[cx + s * 46, fy + 2], [cx + s * 52, fy - 2]], () => 2, SF.line)));
      out.push(F(E(cx + s * 52, fy + 22, 16, 8, SF.blush)));
    }
    out.push(F(band(arc(cx, fy + 18, 13, 10, 20, 160, 10), () => 2.6, SF.line)));
    // Little sparkles stuck to it.
    for (let k = 0; k < 6; k++) {
      const a = h01(k) * Math.PI * 2;
      const rr = 60 + h01(k + 4) * 60;
      const sx = cx + Math.cos(a) * rr;
      const sy = cy + Math.sin(a) * rr;
      out.push(F(T([[sx, sy - 5], [sx + 1.4, sy - 1.4], [sx + 5, sy], [sx + 1.4, sy + 1.4], [sx, sy + 5], [sx - 1.4, sy + 1.4], [sx - 5, sy], [sx - 1.4, sy - 1.4]], '#ffffff')));
    }
    return out;
  });
}
function drawStar(ctx, x, y, time) {
  // A soft glow round it, breathing, under the picture.
  const [cx, cy] = ST_C;
  const gx = x - ST_W / 2 + cx;
  const gy = y - ST_H + cy;
  const p = 0.5 + 0.5 * Math.sin(time * 0.9);
  const g = ctx.createRadialGradient(gx, gy, 60, gx, gy, 330);
  g.addColorStop(0, hexA('#fff0b0', 0.4 + 0.15 * p));
  g.addColorStop(1, hexA('#fff0b0', 0));
  ctx.fillStyle = g;
  ctx.fillRect(gx - 330, gy - 330, 660, 660);
  place(ctx, starArt(), x, y);
  // A "z" now and then, drifting up off it.
  const u = (time * 0.25) % 1;
  ctx.fillStyle = hexA('#fff6c8', Math.sin(u * Math.PI) * 0.9);
  ctx.font = `bold ${Math.round(12 + u * 8)}px sans-serif`;
  ctx.fillText('z', gx + 60 + u * 30, gy - 40 - u * 60);
}

// ---------- The moon cradle: a crescent moon lying on its back like a hammock, hung on two golden
// chains from far above, craters on it and a little star charm on one chain. Its cradle (a ledge)
// is MC_SEAT above the bottom of the picture. Bottom middle at the moon's lowest point. ----------
const MC_W = 320;
const MC_H = 420;
const MC_SEAT = 40;
function moonArt() {
  const W = MC_W;
  const H = MC_H;
  const cx = W / 2;
  return art('moon', W, H, () => {
    const out = [];
    // The chains, up off the top of the picture, from the crescent's two horns.
    for (const s of [-1, 1]) {
      const hx = cx + s * 138;
      for (let y = H - 92, k = 0; y > -M; y -= 12, k++) out.push(E(hx + (k % 2 ? 0.6 : -0.6), y, k % 2 ? 2.6 : 3.4, 6, k % 2 ? SF.chainSh : SF.chain));
    }
    // The crescent, horns up: an outer curve and a shallower inner one.
    const outer = arc(cx, H - 100, 150, 100, 0, 180, 24);
    const inner = arc(cx, H - 104, 118, 64, 180, 0, 24);
    out.push(T([...outer, ...inner], SF.moon));
    out.push(F(T([...arc(cx, H - 100, 146, 96, 100, 175, 12), ...arc(cx, H - 100, 128, 76, 175, 100, 12)], SF.moonLit)));
    out.push(F(T([...arc(cx, H - 100, 146, 96, 10, 70, 10), ...arc(cx, H - 100, 130, 80, 70, 10, 10)], SF.moonSh)));
    for (const [dx, dy, r] of [[-70, -12, 10], [40, -6, 7], [90, -30, 6], [-110, -46, 5], [0, -2, 5]]) out.push(F(E(cx + dx, H + dy, r, r * 0.7, SF.crater)));
    // The star charm.
    const sx = cx + 138;
    const sy = H - 170;
    out.push(T(starPts(sx, sy, 12, 5, 0), SF.star));
    return out;
  });
}
function drawMoon(ctx, x, y, time) {
  // It sways a little on its chains.
  const sw = Math.sin(time * 0.6) * 0.012;
  ctx.save();
  ctx.translate(x, y - MC_H);
  ctx.rotate(sw);
  ctx.translate(-x, -(y - MC_H));
  place(ctx, moonArt(), x, y);
  ctx.restore();
  const g = ctx.createRadialGradient(x, y - 60, 20, x, y - 60, 200);
  g.addColorStop(0, hexA('#fff6d8', 0.22));
  g.addColorStop(1, hexA('#fff6d8', 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - 200, y - 260, 400, 400);
}

export const STARFALL_KINDS = {
  fallenstar: { w: ST_W + M * 2, h: ST_H + M, draw: drawStar },
  mooncradle: { w: MC_W + M * 2, h: MC_H + M, draw: drawMoon },
};
export const MOON_SEAT = MC_SEAT;
