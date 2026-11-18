// The Clockwork Carnival's outdoor rooms and its gates (their remake, 2026-11-18, Chapter 6:
// Foxfire at Dusk). Queen Gearheart's fair has to keep performing while anyone's watching, so it
// never shuts: every bulb lit, every ride turning, all night. Nothing floats: a ledge on the Midway
// is the roof of a game booth standing on the street below it; the Coaster Yard's walkways stand on
// painted wooden trestles like the coaster's own; the Ferris Wheel's parked cars sit on their
// loading stands; the carousel ponies ride on brass poles under a striped canopy on two posts.
// Behind each room a painted backdrop of its own: the whole fair lit up beyond the gates; the
// Midway's rows of stalls under zigzag strings of lights; the great wooden coaster with a train
// rattling over it; the Ferris Wheel itself, turning slowly over its plaza.

import { E, T, F, R, sprite, blit, snap, mix } from './pixel.js';
import { band } from './propkit.js';
import { driftOffset, groundAt } from '../world/physics.js';

export const FG = {
  pink: '#ff8fb8', pinkLit: '#ffc0d8', pinkSh: '#d8608e', pinkDeep: '#a84470',
  cream: '#fff4e0', creamSh: '#e8d4bc', creamDeep: '#c4a88e',
  mint: '#7fe0c8', mintSh: '#4fb8a0', butter: '#ffd36b', butterSh: '#d8a840', butterDeep: '#a87a2a',
  lilac: '#c8a0f0', lilacSh: '#9a74c8', sky: '#7fd8ff', skySh: '#4fa8d8',
  wood: '#d8a878', woodLit: '#f0c898', woodSh: '#a8784e', woodDeep: '#6e4c34',
  navy: '#2a2a5a', bulb: '#fff2b0',
};
const BULBS = ['#fff2b0', '#ff9ac0', '#9ff0dc', '#ffd36b', '#c8a8ff'];
const D2R = Math.PI / 180;
const TAU = Math.PI * 2;
const bd = (path, wf, c) => [band(path, (u) => wf(u) / 2, c)];
const h01 = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const hexA = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${Math.max(0, Math.min(1, a))})`;
const wrap = (x, span) => ((x % span) + span) % span;

// ---------- Cached pictures ----------
const M = 30;
const moveIn = (sh) => (sh.pts ? { ...sh, pts: sh.pts.map(([px, py]) => [px + M, py + M]) } : { ...sh, x: (sh.x ?? 0) + M, y: (sh.y ?? 0) + M });
function art(key, w, h, build) {
  return sprite(`fg|${key}`, () => ({ w: w + M * 2, h: Math.ceil(h) + M, shapes: build().filter(Boolean).map(moveIn), res: 2, soft: 'cel' }));
}
function place(ctx, s, x, y) {
  blit(ctx, s, snap(x - s.w / 2), snap(y - s.h));
}
function glow(ctx, x, y, r, c, a) {
  if (a <= 0.005 || r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, hexA(c, a));
  g.addColorStop(1, hexA(c, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
// What a booth, trestle or stand under world (wx, wy) stands on: the nearest ledge below, or the floor.
function standOn(map, wx, wy) {
  let best = groundAt(map, wx);
  for (const p of map.platforms ?? []) if (p.y > wy + 4 && p.y < best && wx >= p.x && wx <= p.x + p.w && !p.drift) best = p.y;
  return best;
}
// A row of little bulbs, twinkling one after another.
function bulbs(ctx, x1, x2, y, step, time, seed, sag = 0) {
  const n = Math.max(1, Math.floor((x2 - x1) / step));
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const bx = x1 + (x2 - x1) * u;
    const by = y + Math.sin(u * Math.PI) * sag;
    const c = BULBS[(((i + seed) % BULBS.length) + BULBS.length) % BULBS.length];
    const on = 0.65 + 0.35 * Math.sin(time * 3.2 + i * 1.7 + seed);
    glow(ctx, bx, by, 6, c, 0.35 * on);
    ctx.globalAlpha = 0.5 + 0.5 * on;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(bx, by, 1.6, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
// A scalloped striped awning, `w` wide and `h` deep, from y0: stripes `sw` wide, a scallop under each.
function awning(x0, y0, w, h, sw, cA, cB) {
  const out = [];
  for (let x = 0, i = 0; x < w; x += sw, i++) {
    const x2 = Math.min(w, x + sw);
    const pts = [[x0 + x, y0], [x0 + x2, y0], [x0 + x2, y0 + h - 4]];
    for (let k = 0; k <= 6; k++) pts.push([x0 + x2 - ((x2 - x) * k) / 6, y0 + h - 4 + Math.sin((k / 6) * Math.PI) * 5]);
    pts.push([x0 + x, y0 + h - 4]);
    out.push(T(pts, i % 2 ? cB : cA));
  }
  out.push(F(R(x0, y0, w, 2, mix(cA, '#ffffff', 0.4))));
  return out;
}

// ---------- Game booths (`islands: 'booth'`) ----------
// You stand on the booth's flat roof; its striped awning hangs over the front, and the booth itself,
// counter, prize shelf and striped posts, stands on whatever is below.
const BOOTH_C = [[FG.pink, FG.cream], [FG.mint, FG.cream], [FG.lilac, FG.cream], [FG.sky, FG.cream]];
function roofPic(w, seed) {
  const [cA, cB] = BOOTH_C[seed % BOOTH_C.length];
  return art(`roof|${w}|${seed % 4}`, w + 8, 30, () => [
    R(-2, 0, w + 4, 6, FG.woodLit), F(R(-2, 0, w + 4, 1.6, '#fff4dc')), F(R(-2, 4, w + 4, 2, FG.woodSh)),
    R(-3, 6, w + 6, 4, FG.butter), F(R(-3, 9, w + 6, 1, FG.butterSh)),
    ...awning(-3, 10, w + 6, 16, 12, cA, cB),
  ]);
}
const PRIZES = (x, y, k) => {
  const v = k % 4;
  if (v === 0) return [E(x, y - 6, 5, 5, '#e8b48a'), E(x - 4, y - 10, 2, 2, '#e8b48a'), E(x + 4, y - 10, 2, 2, '#e8b48a'), F(E(x, y - 4, 2.4, 1.6, '#ffe0c8')), F(E(x - 1.6, y - 7, 0.7, 0.7, '#3a2d4f')), F(E(x + 1.6, y - 7, 0.7, 0.7, '#3a2d4f'))];
  if (v === 1) return [E(x, y - 6, 5, 5.4, FG.sky), F(E(x - 1.6, y - 8, 1.4, 1.6, '#ffffff')), F(E(x + 1, y - 4, 2.4, 1.2, '#ffb03a'))];
  if (v === 2) return [T([[x, y - 12], [x + 2.4, y - 6], [x + 7, y - 6], [x + 3.4, y - 2.6], [x + 4.6, y + 2], [x, y - 1], [x - 4.6, y + 2], [x - 3.4, y - 2.6], [x - 7, y - 6], [x - 2.4, y - 6]], FG.butter)];
  return [E(x, y - 5, 4, 5, FG.pink), E(x - 2, y - 9, 2.6, 2.6, FG.pink), E(x + 2, y - 9, 2.6, 2.6, FG.pink)];
};
function boothBodyPic(w, h, seed) {
  const [cA] = BOOTH_C[seed % BOOTH_C.length];
  return art(`booth|${w}|${h}|${seed % 4}`, w, h, () => {
    const out = [];
    // The back wall, boards in two tones.
    for (let x = 6; x < w - 6; x += 10) out.push(R(x, 0, Math.min(10, w - 6 - x), h - 4, (x / 10) % 2 ? FG.creamSh : mix(cA, FG.cream, 0.55)));
    out.push(F(R(6, 0, w - 12, 6, mix(cA, FG.navy, 0.35))));
    if (h > 60) {
      // A prize shelf with prizes on it.
      out.push(R(8, 26, w - 16, 3, FG.wood), F(R(8, 29, w - 16, 1.4, FG.woodSh)));
      for (let x = 18, k = seed; x < w - 14; x += 18, k++) out.push(...PRIZES(x, 26, k));
    }
    // The counter, and its painted front.
    const cy = Math.max(10, h - 30);
    out.push(R(2, cy, w - 4, 5, FG.woodLit), F(R(2, cy + 4, w - 4, 1.6, FG.woodSh)));
    out.push(R(5, cy + 5, w - 10, h - cy - 5, cA), F(R(5, cy + 5, w - 10, 2, mix(cA, '#ffffff', 0.35))));
    for (let x = 14; x < w - 12; x += 16) out.push(F(E(x, cy + 15, 2.6, 2.6, FG.cream)));
    // The striped posts at the ends (and the middle of a wide one).
    for (const px of w > 150 ? [3, w / 2, w - 3] : [3, w - 3]) {
      out.push(R(px - 3, -2, 6, h + 2, FG.cream));
      for (let y = 2; y < h; y += 9) out.push(F(T([[px - 3, y], [px + 3, y - 4], [px + 3, y], [px - 3, y + 4]], cA)));
      out.push(F(R(px - 3, -2, 1.6, h + 2, '#ffffff')));
    }
    return out;
  });
}
export function drawBooth(ctx, x, y, w, time, seed, map, cam) {
  x = snap(x);
  y = snap(y);
  const wx = x + cam.x;
  const wy = y + cam.y;
  // One booth, or a row of them under one roof.
  const n = Math.max(1, Math.round(w / 170));
  const bw = w / n;
  for (let i = 0; i < n; i++) {
    const bx = Math.round(i * bw);
    const bottom = standOn(map, wx + bx + bw / 2, wy);
    const h = Math.round(bottom - (wy + 24));
    if (h > 8) blit(ctx, boothBodyPic(Math.round(bw), h, seed + i), snap(x + bx - M), snap(y + 24 - M));
    // The booth's warm light inside, under the awning.
    if (h > 40) glow(ctx, x + bx + bw / 2, y + 40, Math.min(70, bw * 0.5), '#ffe2a0', 0.16 + 0.04 * Math.sin(time * 1.3 + i));
  }
  blit(ctx, roofPic(w, seed), x - 4 - M, y - M);
  ctx.save();
  bulbs(ctx, x, x + w, y + 8, 12, time, seed);
  ctx.restore();
}

// ---------- Painted trestles (`islands: 'trestle'`) ----------
// A boardwalk on a lattice of painted timber like the coaster's own, posts and cross-braces down to
// the floor, a bulb on every post.
function deckPic(w) {
  return art(`deck|${w}`, w, 16, () => {
    const out = [R(-2, 0, w + 4, 7, FG.wood), F(R(-2, 0, w + 4, 1.6, FG.woodLit)), R(-2, 7, w + 4, 5, FG.pinkSh), F(R(-2, 11, w + 4, 1, FG.pinkDeep))];
    for (let x = 6; x < w; x += 12) out.push(F(R(x, 1.6, 1, 5, FG.woodSh)));
    return out;
  });
}
function trestlePic(w, h) {
  return art(`trestle|${w}|${h}`, w, h, () => {
    const out = [];
    const n = Math.max(1, Math.round(w / 64));
    const xs = [];
    for (let i = 0; i <= n; i++) xs.push(6 + ((w - 12) * i) / n);
    const rows = Math.max(1, Math.round(h / 46));
    // Cross-braces first, behind the posts.
    for (let i = 0; i < n; i++) {
      for (let r = 0; r < rows; r++) {
        const y1 = (h * r) / rows;
        const y2 = (h * (r + 1)) / rows;
        out.push(...bd([[xs[i], y1], [xs[i + 1], y2]], () => 3, FG.creamSh), ...bd([[xs[i + 1], y1], [xs[i], y2]], () => 3, FG.creamDeep));
        out.push(R(xs[i], y2 - 2, xs[i + 1] - xs[i], 3, FG.creamSh));
      }
    }
    for (const px of xs) {
      out.push(R(px - 3.5, 0, 7, h, FG.cream), F(R(px - 3.5, 0, 2, h, '#ffffff')), F(R(px + 2, 0, 1.5, h, FG.creamDeep)));
      out.push(R(px - 6, h - 5, 12, 5, '#b8a8c8'), F(R(px - 6, h - 5, 12, 1.4, '#d8cce6')));
    }
    return out;
  });
}
export function drawTrestle(ctx, x, y, w, time, seed, map, cam) {
  x = snap(x);
  y = snap(y);
  const wx = x + cam.x;
  const wy = y + cam.y;
  const bottom = Math.min(standOn(map, wx + 8, wy), standOn(map, wx + w - 8, wy));
  const h = Math.round(bottom - (wy + 12));
  if (h > 6) blit(ctx, trestlePic(w, h), x - M, y + 12 - M);
  blit(ctx, deckPic(w), x - M, y - M);
  ctx.save();
  const n = Math.max(1, Math.round(w / 64));
  for (let i = 0; i <= n; i++) bulbs(ctx, x + 6 + ((w - 12) * i) / n, x + 6 + ((w - 12) * i) / n, y + 14, 10, time, seed + i);
  ctx.restore();
}

// ---------- The Ferris Wheel's parked cars (`islands: 'gondola'`) ----------
// A wheel car parked on its loading stand: you stand on its roof; its canopy, cabin and lit
// windows below, its hanger on the stand's axle, and the stand (a trestle) down to the floor.
const CAR_C = [FG.mint, FG.pink, FG.lilac, FG.sky];
function carPic(w, seed) {
  const c = CAR_C[seed % CAR_C.length];
  return art(`car|${w}|${seed % 4}`, w, 66, () => {
    const out = [R(-2, 0, w + 4, 6, FG.butter), F(R(-2, 0, w + 4, 1.6, '#fff2b0')), ...awning(-3, 6, w + 6, 12, 10, FG.butter, FG.cream)];
    // The cabin: rounded at the bottom, two round windows, a door.
    const pts = [[4, 16], [w - 4, 16], [w - 4, 40]];
    for (let k = 0; k <= 8; k++) {
      const a = (k / 8) * Math.PI;
      pts.push([w / 2 + Math.cos(a) * (w / 2 - 4), 40 + Math.sin(a) * 12]);
    }
    out.push(T(pts, c), F(R(4, 16, w - 8, 3, mix(c, '#ffffff', 0.4))), F(T([[4, 40], [w - 4, 40], [w / 2, 52]], mix(c, FG.navy, 0.25))));
    for (const fx of [w * 0.28, w * 0.72]) out.push(E(fx, 30, 7, 7, FG.butterSh), E(fx, 30, 5.6, 5.6, '#fff2c8'), F(E(fx - 2, 28, 1.6, 1.6, '#ffffff')));
    out.push(F(R(w / 2 - 1, 20, 2, 26, mix(c, FG.navy, 0.3))));
    // The hanger and the stand's axle.
    out.push(R(w / 2 - 2, 50, 4, 12, FG.butterSh), E(w / 2, 62, 4.4, 4.4, FG.butter), F(E(w / 2, 62, 1.6, 1.6, FG.butterDeep)));
    return out;
  });
}
export function drawGondola(ctx, x, y, w, time, seed, map, cam) {
  x = snap(x);
  y = snap(y);
  const wx = x + cam.x;
  const wy = y + cam.y;
  const bottom = standOn(map, wx + w / 2, wy);
  const h = Math.round(bottom - (wy + 64));
  if (h > 6) blit(ctx, trestlePic(Math.max(40, w - 24), h), x + 12 - M, y + 64 - M);
  blit(ctx, carPic(w, seed), x - M, y - M);
  ctx.save();
  glow(ctx, x + w * 0.28, y + 30, 10, '#fff2c8', 0.3);
  glow(ctx, x + w * 0.72, y + 30, 10, '#fff2c8', 0.3);
  bulbs(ctx, x, x + w, y + 6, 10, time, seed);
  ctx.restore();
}

// ---------- Carousel ponies (`style: 'pony'` on the carousel's drifting ledges) ----------
// The pony rides on a twisted brass pole; the pole runs up to the canopy, a striped beam on two
// posts over the whole of its ride, which stays put while the pony goes back and forth.
const PONY_C = [[FG.cream, FG.pink], [FG.cream, FG.mint], ['#f6ecff', FG.lilac], [FG.cream, FG.sky]];
function ponyPic(w, seed) {
  const [body, mane] = PONY_C[seed % PONY_C.length];
  return art(`pony|${w}|${seed % 4}`, w, 46, () => {
    const out = [];
    const cx = w / 2;
    // Legs first: front pair up and prancing, back pair down.
    out.push(...bd([[cx + 18, 16], [cx + 30, 22], [cx + 34, 14]], () => 6, mix(body, FG.creamDeep, 0.25)));
    out.push(...bd([[cx + 12, 18], [cx + 24, 28], [cx + 30, 22]], () => 6, body));
    out.push(...bd([[cx - 18, 16], [cx - 24, 32], [cx - 22, 42]], () => 6, mix(body, FG.creamDeep, 0.25)));
    out.push(...bd([[cx - 12, 18], [cx - 14, 32], [cx - 10, 42]], () => 6, body));
    for (const [hx, hy] of [[cx + 34, 14], [cx + 30, 22], [cx - 22, 42], [cx - 10, 42]]) out.push(E(hx, hy, 3.4, 2.6, FG.butterSh));
    // The tail, a flowing curl.
    out.push(...bd([[cx - w / 2 + 12, 8], [cx - w / 2 + 2, 14], [cx - w / 2 + 4, 26]], (u) => 9 - u * 5, mane));
    // The body; the saddle on top is what you stand on.
    out.push(E(cx, 12, w / 2 - 12, 11, body), F(E(cx - 4, 7, w / 2 - 20, 4, '#ffffff')));
    // The neck and head, looking ahead, a smile and a closed happy eye.
    out.push(...bd([[cx + 20, 10], [cx + 28, -4], [cx + 32, -12]], () => 12, body));
    out.push(E(cx + 36, -14, 9, 7, body), E(cx + 43, -11, 4.6, 4, body), F(E(cx + 44, -11, 1, 0.8, '#d8a8b8')));
    out.push(F(T([[cx + 30, -21], [cx + 32, -29], [cx + 35, -21]], body)));
    out.push(...bd([[cx + 30, -20], [cx + 22, -8], [cx + 18, 2]], (u) => 8 - u * 3, mane));
    out.push(F(...bd([[cx + 34, -15], [cx + 36.4, -16.6], [cx + 39, -15]], () => 1.2, '#3a2d4f')));
    out.push(F(E(cx + 40, -10, 2.2, 1.2, '#ff9ab8')));
    // The saddle and its blanket.
    out.push(R(cx - 22, -2, 44, 6, FG.pink), F(R(cx - 22, -2, 44, 1.6, FG.pinkLit)), T([[cx - 18, 4], [cx + 18, 4], [cx + 14, 14], [cx - 14, 14]], FG.butter));
    for (let x = cx - 14; x <= cx + 14; x += 7) out.push(F(E(x, 13.4, 1.6, 1.6, FG.pink)));
    return out;
  });
}
function canopyPic(w) {
  return art(`canopy|${w}`, w + 20, 34, () => [
    R(-10, 0, w + 20, 8, FG.butter), F(R(-10, 0, w + 20, 2, '#fff2b0')), F(R(-10, 6, w + 20, 2, FG.butterSh)),
    ...awning(-10, 8, w + 20, 18, 14, FG.pink, FG.cream),
    T([[w / 2 - 14, 0], [w / 2, -14], [w / 2 + 14, 0]], FG.pink), E(w / 2, -16, 4, 4, FG.butter),
  ]);
}
function postPic(h) {
  return art(`fpost|${h}`, 10, h, () => {
    const out = [R(0, 0, 10, h, FG.butter), F(R(0, 0, 2.4, h, '#fff2b0')), F(R(7.6, 0, 2.4, h, FG.butterSh))];
    for (let y = 8; y < h; y += 14) out.push(F(T([[0, y], [10, y - 5], [10, y - 1], [0, y + 4]], FG.pink)));
    out.push(R(-4, h - 6, 18, 6, FG.butterSh));
    return out;
  });
}
export function drawPony(ctx, x, y, w, time, seed, p, map, cam) {
  const off = p.drift ? driftOffset(p, map.clock ?? 0) : 0;
  // The canopy over the whole ride, and its two posts, drawn where they stand (the camera passed
  // in rides along with the pony).
  const real = cam.x + off;
  const top = p.y - 86;
  const x1 = p.x - 24;
  const x2 = p.x + p.w + (p.drift?.dx ?? 0) + 24;
  const floor = groundAt(map, (x1 + x2) / 2);
  for (const px of [x1, x2]) blit(ctx, postPic(Math.round(floor - top)), snap(px - real - 5 - M), snap(top - cam.y - M));
  blit(ctx, canopyPic(Math.round(x2 - x1)), snap(x1 - real - M), snap(top - 8 - cam.y - M));
  ctx.save();
  bulbs(ctx, x1 - real, x2 - real, top + 2 - cam.y, 14, time, seed);
  ctx.restore();
  // The pole, twisted brass, from the canopy down through the pony.
  const px = snap(x + w / 2);
  ctx.fillStyle = FG.butter;
  ctx.fillRect(px - 2, top + 8 - cam.y, 4, y - (top + 8 - cam.y) + 34);
  ctx.fillStyle = FG.butterSh;
  for (let yy = top + 12 - cam.y; yy < y + 34; yy += 7) ctx.fillRect(px - 2, yy, 4, 2);
  blit(ctx, ponyPic(w, seed), snap(x - M), snap(y - 2 - M));
}

// ---------- The carousel (`style: 'carousel'`) ----------
// Its flat roof is the ledge; under the scalloped valance, the mirrored centre column, brass poles
// with ponies bobbing on them, and the round base on the street.
function carouselPic(w, h) {
  return art(`carousel|${w}|${h}`, w, h, () => {
    const out = [];
    const cx = w / 2;
    // The base, round and stepped.
    out.push(R(-6, h - 22, w + 12, 16, FG.butter), F(R(-6, h - 22, w + 12, 2.4, '#fff2b0')), R(-2, h - 6, w + 4, 6, FG.pinkSh));
    for (let x = 4; x < w; x += 18) out.push(F(E(x, h - 14, 2.4, 2.4, FG.pink)));
    // The centre column, mirrored panels and gilt bands.
    const cw = Math.max(40, w * 0.2);
    out.push(R(cx - cw / 2, 36, cw, h - 58, FG.mint), F(R(cx - cw / 2, 36, 4, h - 58, '#c8fff0')));
    for (let y = 46; y < h - 34; y += 30) out.push(R(cx - cw / 2 + 6, y, cw - 12, 20, '#e8fcff'), F(R(cx - cw / 2 + 8, y + 2, 4, 16, '#ffffff')), F(R(cx - cw / 2, y + 24, cw, 3, FG.butter)));
    // The frieze under the valance: a band of little mirrors.
    out.push(R(-4, 30, w + 8, 10, FG.lilac), ...Array.from({ length: Math.floor(w / 16) }, (_, k) => F(E(8 + k * 16, 35, 3, 3, '#f0e8ff'))));
    // The roof: a flat deck, gilt trim, and the valance.
    out.push(R(-6, 0, w + 12, 8, FG.butter), F(R(-6, 0, w + 12, 2, '#fff2b0')), F(R(-6, 6, w + 12, 2, FG.butterSh)), ...awning(-6, 8, w + 12, 22, 14, FG.pink, FG.cream));
    return out;
  });
}
export function drawCarousel(ctx, x, y, w, time, seed, map, cam) {
  x = snap(x);
  y = snap(y);
  const wx = x + cam.x;
  const wy = y + cam.y;
  const h = Math.round(standOn(map, wx + w / 2, wy) - wy);
  if (h < 60) return;
  const s = carouselPic(w, h);
  blit(ctx, s, x - M, y - M);
  // The poles and their ponies, rising and falling in turn as it goes round.
  const cw = Math.max(40, w * 0.2);
  const poles = [w * 0.2, w * 0.8].map((f) => Math.round(f)).filter((px) => Math.abs(px - w / 2) > cw / 2 + 24);
  poles.forEach((px, i) => {
    const bob = Math.sin(time * 1.8 + i * 1.6) * 8;
    ctx.fillStyle = FG.butter;
    ctx.fillRect(x + px - 1.5, y + 40, 3, h - 62);
    ctx.fillStyle = FG.butterSh;
    for (let yy = y + 44; yy < y + h - 24; yy += 7) ctx.fillRect(x + px - 1.5, yy, 3, 2);
    blit(ctx, ponyPic(64, seed + i * 2 + 1), snap(x + px - 32 - M), snap(y + h * 0.5 + bob - 20 - M));
  });
  ctx.save();
  bulbs(ctx, x - 4, x + w + 4, y + 4, 12, time, seed);
  glow(ctx, x + w / 2, y + h * 0.5, w * 0.6, '#ffe2a0', 0.12);
  ctx.restore();
}

// ---------- The Funhouse's crooked floors (`islands: 'funfloor'`) ----------
// A thick candy slab, checkered on top, a wavy striped face, on twisted stilts down to the floor
// below it.
function funSlabPic(w) {
  return art(`funslab|${w}`, w, 26, () => {
    const out = [];
    for (let x = -2, i = 0; x < w + 2; x += 8, i++) out.push(R(x, 0, Math.min(8, w + 2 - x), 3, i % 2 ? FG.navy : FG.cream), R(x, 3, Math.min(8, w + 2 - x), 3, i % 2 ? FG.cream : FG.navy));
    const bottom = [];
    for (let x = w + 2; x >= -2; x -= 6) bottom.push([x, 18 + Math.sin(x * 0.25) * 2.4]);
    out.push(T([[-2, 6], [w + 2, 6], ...bottom], FG.lilac));
    for (let x = -2, i = 0; x < w; x += 12, i++) out.push(F(T([[x, 6], [x + 6, 6], [x + 14, 17], [x + 8, 17]], i % 2 ? FG.pink : FG.pinkLit)));
    out.push(F(R(-2, 6, w + 4, 1.4, '#ffffff')));
    for (let x = 10; x < w - 6; x += 30) out.push(F(E(x, 12, 2.4, 2.4, FG.butter)));
    return out;
  });
}
function stiltPic(h, seed) {
  const c = [FG.pink, FG.mint, FG.sky][seed % 3];
  return art(`stilt|${h}|${seed % 3}`, 10, h, () => {
    const out = [R(1, 0, 8, h, FG.cream), F(R(1, 0, 2, h, '#ffffff'))];
    for (let y = 4; y < h; y += 10) out.push(F(T([[1, y], [9, y - 5], [9, y - 1], [1, y + 4]], c)));
    out.push(R(-2, h - 5, 14, 5, FG.butterSh), R(-1, 0, 12, 4, FG.butter));
    return out;
  });
}
export function drawFunFloor(ctx, x, y, w, time, seed, map, cam) {
  x = snap(x);
  y = snap(y);
  const wx = x + cam.x;
  const wy = y + cam.y;
  const at = w > 360 ? [0.1, 0.5, 0.9] : w > 160 ? [0.14, 0.86] : [0.5];
  at.forEach((f, i) => {
    const sx = Math.round(w * f);
    const h = Math.round(standOn(map, wx + sx, wy) - (wy + 16));
    if (h > 6) blit(ctx, stiltPic(h, seed + i), snap(x + sx - 5 - M), snap(y + 16 - M));
  });
  blit(ctx, funSlabPic(w), x - M, y - M);
}

// ---------- Landmarks ----------
// The fair's gates: two striped towers with pennants, an arch between them lit with bulbs, its
// sign over the way in.
function archPic() {
  return art('arch', 240, 230, () => {
    const out = [];
    for (const tx of [18, 222]) {
      out.push(R(tx - 17, 70, 34, 160, FG.cream));
      for (let x = tx - 17; x < tx + 17; x += 8.5) out.push(R(x, 70, 4.25, 160, FG.pink));
      out.push(F(R(tx - 17, 70, 3, 160, '#ffffff')), R(tx - 20, 66, 40, 8, FG.butter), R(tx - 20, 222, 40, 8, FG.butterSh));
      out.push(T([[tx - 20, 66], [tx, 18], [tx + 20, 66]], FG.lilac), F(T([[tx - 20, 66], [tx - 4, 26], [tx, 66]], mix(FG.lilac, '#ffffff', 0.3))));
      out.push(R(tx - 1, 0, 2, 20, FG.butterSh), T([[tx + 1, 1], [tx + 18, 6], [tx + 1, 11]], FG.pink));
    }
    // The arch and its sign board.
    out.push(...bd([[18, 96], [120, 52], [222, 96]], () => 14, FG.butter));
    out.push(F(...bd([[18, 92], [120, 48], [222, 92]], () => 3, '#fff2b0')));
    out.push(R(64, 58, 112, 30, FG.navy), F(R(64, 58, 112, 3, mix(FG.navy, '#ffffff', 0.25))), R(60, 54, 120, 4, FG.pink), R(60, 88, 120, 4, FG.pink));
    out.push(T([[120, 36], [126, 48], [114, 48]], FG.butter));
    return out;
  });
}
function drawFairArch(ctx, x, y, time) {
  place(ctx, archPic(), x, y);
  ctx.save();
  // Bulbs along the arch.
  for (let i = 0; i <= 18; i++) {
    const u = i / 18;
    const bx = x - 102 + 204 * u;
    const by = y - 134 - Math.sin(u * Math.PI) * 44;
    const c = BULBS[i % BULBS.length];
    const on = 0.6 + 0.4 * Math.sin(time * 4 - i * 0.6);
    glow(ctx, bx, by, 7, c, 0.4 * on);
    ctx.fillStyle = c;
    ctx.globalAlpha = 0.6 + 0.4 * on;
    ctx.beginPath();
    ctx.arc(bx, by, 1.8, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // The sign, lettered in lights.
  ctx.font = '900 13px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  const k = 0.75 + 0.25 * Math.sin(time * 2.4);
  glow(ctx, x, y - 230 + 74, 40, '#fff2b0', 0.18 * k);
  ctx.fillStyle = mix('#fff2b0', '#ffd36b', 1 - k);
  ctx.fillText('CARNIVAL', x, y - 230 + 79);
  ctx.restore();
}
// A popcorn cart: striped box on wheels, a glass case of popcorn, a little canopy.
function popcornPic() {
  return art('popcorn', 54, 70, () => [
    R(15, 10, 2, 22, FG.butterSh), R(37, 10, 2, 22, FG.butterSh), ...awning(8, 4, 38, 12, 9.5, FG.pink, FG.cream),
    R(10, 22, 34, 20, '#d8f4ff'), F(R(10, 22, 34, 3, '#ffffff')), ...[0, 1, 2, 3, 4, 5, 6, 7].map((k) => F(E(14 + (k % 4) * 8.4, 36 - Math.floor(k / 4) * 5, 3.4, 3, k % 3 ? '#fff6dc' : '#ffe08a'))),
    R(8, 42, 38, 16, FG.pink), F(R(8, 42, 38, 2, FG.pinkLit)), ...[0, 1, 2].map((k) => F(R(12 + k * 12, 45, 6, 10, FG.cream))),
    E(14, 61, 6, 6, FG.navy), F(E(14, 61, 2, 2, FG.butter)), E(40, 61, 6, 6, FG.navy), F(E(40, 61, 2, 2, FG.butter)),
  ]);
}
// A balloon stand: a post with a bunch of balloons bobbing on their strings.
function drawBalloons(ctx, x, y, time, seed) {
  ctx.fillStyle = FG.woodSh;
  ctx.fillRect(x - 2, y - 46, 4, 46);
  ctx.fillStyle = FG.butter;
  ctx.fillRect(x - 8, y - 6, 16, 6);
  const C = [FG.pink, FG.mint, FG.butter, FG.lilac, FG.sky, '#ff9a8a', FG.pink];
  for (let k = 0; k < 7; k++) {
    const a = -1.3 + (k / 6) * 2.6;
    const bx = x + Math.sin(a) * 26 + Math.sin(time * 1.4 + k + seed) * 2;
    const by = y - 66 - Math.cos(a) * 22 + Math.cos(time * 1.7 + k) * 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y - 44);
    ctx.quadraticCurveTo(x + (bx - x) * 0.4, y - 52, bx, by + 8);
    ctx.stroke();
    ctx.fillStyle = C[k];
    ctx.beginPath();
    ctx.ellipse(bx, by, 7, 8.4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.ellipse(bx - 2.4, by - 3, 1.8, 2.6, -0.4, 0, TAU);
    ctx.fill();
  }
}
export const FAIR_KINDS = {
  fairarch: { w: 300, h: 290, draw: (ctx, x, y, time) => drawFairArch(ctx, x, y, time) },
  popcorncart: { w: 54 + M * 2, h: 70 + M, draw: (ctx, x, y) => place(ctx, popcornPic(), x, y) },
  balloonstand: { w: 80, h: 120, draw: (ctx, x, y, time, seed) => drawBalloons(ctx, x, y, time, seed) },
};

// ---------- Painted backdrops ----------
// Stars twinkling over the fair, and the odd firework blooming far off.
function fireworks(ctx, cam, width, height, time, k) {
  for (let i = 0; i < 3; i++) {
    const cyc = 5.4 + i * 1.3;
    const u = (time + i * 2.1) % cyc;
    if (u > 1.6) continue;
    const n = Math.floor((time + i * 2.1) / cyc);
    const x = wrap(h01(n * 3 + i) * width * 1.6 - cam.x * k, width + 200) - 100;
    const y = height * (0.14 + h01(n * 5 + i) * 0.2);
    const c = BULBS[(n + i) % BULBS.length];
    const r = 6 + u * 26;
    const a = Math.max(0, 1 - u / 1.6);
    glow(ctx, x, y, r * 1.4, c, 0.14 * a);
    ctx.fillStyle = c;
    for (let j = 0; j < 12; j++) {
      const ang = (j / 12) * TAU;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(x + Math.cos(ang) * r, y + Math.sin(ang) * r + u * u * 6, 1.4, 0, TAU);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
function hills(ctx, cam, width, height, y, k, c, amp = 18, f = 0.006) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width + 8; x += 8) {
    const q = x + cam.x * k;
    ctx.lineTo(x, y - Math.sin(q * f) * amp - Math.sin(q * f * 3.3 + 1) * amp * 0.3);
  }
  ctx.lineTo(width, height);
  ctx.fill();
}
// A ferris wheel at (cx, cy), radius r, turned to `ang`: rim, spokes, hub, and its cars hanging
// level; `lit` its bulbs and windows; colours washed toward the air by `wash`.
function wheel(ctx, cx, cy, r, ang, time, wash, air, cars = 12, legs = true, carK = 0.16) {
  const W = (c) => mix(c, air, wash);
  ctx.save();
  if (legs) {
    ctx.strokeStyle = W(FG.creamSh);
    ctx.lineWidth = Math.max(3, r * 0.05);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - r * 0.62, cy + r * 1.25);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * 0.62, cy + r * 1.25);
    ctx.stroke();
  }
  ctx.strokeStyle = W(FG.cream);
  ctx.lineWidth = Math.max(1, r * 0.012);
  for (let i = 0; i < cars * 2; i++) {
    const a = ang + (i / (cars * 2)) * TAU;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.lineWidth = Math.max(2, r * 0.03);
  ctx.strokeStyle = W(FG.pink);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = W(FG.butter);
  ctx.lineWidth = Math.max(1, r * 0.015);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.9, 0, TAU);
  ctx.stroke();
  // Bulbs round the rim.
  for (let i = 0; i < 36; i++) {
    const a = ang + (i / 36) * TAU;
    const on = 0.5 + 0.5 * Math.sin(time * 3 - i * 0.5);
    ctx.fillStyle = W(BULBS[i % BULBS.length]);
    ctx.globalAlpha = 0.5 + 0.5 * on;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.max(1, r * 0.012), 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // The cars, hanging level as it turns.
  for (let i = 0; i < cars; i++) {
    const a = ang + (i / cars) * TAU;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    const cw = r * carK;
    const sw = Math.sin(time * 1.3 + i) * 0.06;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(sw);
    ctx.fillStyle = W(FG.butterSh);
    ctx.fillRect(-0.8, 0, 1.6, cw * 0.5);
    ctx.fillStyle = W(CAR_C[i % CAR_C.length]);
    ctx.beginPath();
    ctx.moveTo(-cw * 0.6, cw * 0.5);
    ctx.lineTo(cw * 0.6, cw * 0.5);
    ctx.lineTo(cw * 0.6, cw * 1.1);
    ctx.quadraticCurveTo(0, cw * 1.6, -cw * 0.6, cw * 1.1);
    ctx.fill();
    ctx.fillStyle = W(FG.butter);
    ctx.fillRect(-cw * 0.7, cw * 0.36, cw * 1.4, cw * 0.18);
    ctx.fillStyle = W('#fff2c8');
    ctx.fillRect(-cw * 0.32, cw * 0.66, cw * 0.64, cw * 0.3);
    ctx.restore();
  }
  ctx.fillStyle = W(FG.butter);
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(3, r * 0.07), 0, TAU);
  ctx.fill();
  ctx.fillStyle = W(FG.pink);
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(1.4, r * 0.03), 0, TAU);
  ctx.fill();
  ctx.restore();
}
// A big top tent at (x, base), w wide: striped canvas, scalloped skirt, a pennant on the pole.
function bigTop(ctx, x, base, w, wash, air, time) {
  const W = (c) => mix(c, air, wash);
  const h = w * 0.62;
  const n = 8;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = W(i % 2 ? FG.cream : FG.pink);
    ctx.beginPath();
    ctx.moveTo(x, base - h);
    ctx.lineTo(x - w / 2 + (w * i) / n, base - h * 0.32);
    ctx.lineTo(x - w / 2 + (w * (i + 1)) / n, base - h * 0.32);
    ctx.fill();
    ctx.fillRect(x - w / 2 + (w * i) / n, base - h * 0.32, w / n + 0.5, h * 0.32);
  }
  ctx.fillStyle = W(FG.butter);
  for (let i = 0; i < n * 2; i++) {
    ctx.beginPath();
    ctx.arc(x - w / 2 + (w * (i + 0.5)) / (n * 2), base - h * 0.32, w / (n * 4), 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = W('#ffe2a0');
  ctx.beginPath();
  ctx.moveTo(x - w * 0.08, base);
  ctx.lineTo(x - w * 0.08, base - h * 0.2);
  ctx.quadraticCurveTo(x, base - h * 0.28, x + w * 0.08, base - h * 0.2);
  ctx.lineTo(x + w * 0.08, base);
  ctx.fill();
  ctx.fillStyle = W(FG.butterSh);
  ctx.fillRect(x - 1, base - h - 16, 2, 16);
  ctx.fillStyle = W(FG.pink);
  const fl = Math.sin(time * 3) * 2;
  ctx.beginPath();
  ctx.moveTo(x + 1, base - h - 16);
  ctx.lineTo(x + 14, base - h - 12 + fl);
  ctx.lineTo(x + 1, base - h - 8);
  ctx.fill();
}
// A coaster's track over x in [x0, x1]: its height at x (screen), lattice under it, the rail and
// its lights; `trackAt(x)` gives the track's y.
function coasterTrack(ctx, x0, x1, base, trackAt, wash, air, time, step = 18) {
  const W = (c) => mix(c, air, wash);
  ctx.strokeStyle = W(FG.creamSh);
  ctx.lineWidth = 1.4;
  for (let x = Math.floor(x0 / step) * step; x <= x1; x += step) {
    const ty = trackAt(x);
    ctx.beginPath();
    ctx.moveTo(x, ty + 4);
    ctx.lineTo(x, base);
    ctx.stroke();
    for (let y = ty + 24; y < base - 6; y += 30) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + step, Math.min(base, y + 26));
      ctx.stroke();
    }
  }
  ctx.strokeStyle = W(FG.pink);
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let x = x0; x <= x1; x += 4) {
    const ty = trackAt(x);
    if (x === x0) ctx.moveTo(x, ty);
    else ctx.lineTo(x, ty);
  }
  ctx.stroke();
  ctx.strokeStyle = W(FG.cream);
  ctx.lineWidth = 1;
  ctx.stroke();
  for (let x = Math.floor(x0 / 22) * 22; x <= x1; x += 22) {
    const on = 0.5 + 0.5 * Math.sin(time * 4 - x * 0.05);
    ctx.fillStyle = W(BULBS[Math.abs(Math.floor(x / 22)) % BULBS.length]);
    ctx.globalAlpha = 0.4 + 0.6 * on;
    ctx.beginPath();
    ctx.arc(x, trackAt(x) - 3, 1.4, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
// Strings of bulbs swagged across the top of the view.
function swags(ctx, cam, width, y, k, time, span = 220, sag = 26) {
  const off = cam.x * k;
  for (let i = -1; i < Math.ceil(width / span) + 2; i++) {
    const x1 = Math.round(i * span - wrap(off, span));
    ctx.strokeStyle = 'rgba(58,45,79,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.quadraticCurveTo(x1 + span / 2, y + sag * 2, x1 + span, y);
    ctx.stroke();
    bulbs(ctx, x1, x1 + span, y, span / 11, time, i + Math.floor(off / span), sag);
  }
}

// The Carnival Gates: the whole fair lit up beyond them, its wheel turning, the coaster's hill, the
// big top, fireworks far off.
export function drawPaintedFairGate(ctx, t, cam, width, height, time, layerY, air, map) {
  fireworks(ctx, cam, width, height, time, 0.04);
  hills(ctx, cam, width, height, layerY(70, 0.05), 0.05, mix(t.far, air, 0.45), 24);
  const k = 0.16;
  const base = layerY(4, k);
  const off = cam.x * k;
  const span = 900;
  for (let i = -1; i < Math.ceil(width / span) + 2; i++) {
    const ox = Math.round(i * span - wrap(off, span));
    // The coaster's hill, the big top, the wheel.
    coasterTrack(ctx, ox + 20, ox + 330, base, (x) => base - 40 - Math.max(0, Math.sin(((x - ox - 20) / 310) * Math.PI)) * 130 - Math.sin((x - ox) * 0.05) * 6, 0.45, air, time, 16);
    bigTop(ctx, ox + 470, base, 190, 0.38, air, time);
    wheel(ctx, ox + 720, base - 150, 110, time * 0.07, time, 0.4, air, 10);
  }
  glow(ctx, width / 2, base, width * 0.6, '#ffb0d0', 0.12);
  swags(ctx, cam, width, 6, 0.5, time);
}
// The Midway: a row of stall fronts behind, their awnings and lit counters, the big top and the
// wheel peeking over them, lights zigzagging overhead, a lost balloon or two drifting up.
export function drawPaintedMidway(ctx, t, cam, width, height, time, layerY, air, map) {
  fireworks(ctx, cam, width, height, time, 0.04);
  hills(ctx, cam, width, height, layerY(110, 0.06), 0.06, mix(t.far, air, 0.5), 20);
  const kf = 0.1;
  const fb = layerY(60, kf);
  const offf = cam.x * kf;
  for (let i = -1; i < Math.ceil(width / 700) + 2; i++) {
    const ox = Math.round(i * 700 - wrap(offf, 700));
    bigTop(ctx, ox + 180, fb, 230, 0.5, air, time);
    wheel(ctx, ox + 520, fb - 120, 90, time * 0.07, time, 0.5, air, 10);
  }
  // The stalls behind the street.
  const k = 0.3;
  const base = layerY(0, k) + 8;
  const off = cam.x * k;
  const sw = 130;
  for (let i = -1; i < Math.ceil(width / sw) + 2; i++) {
    const x = Math.round(i * sw - wrap(off, sw));
    const si = i + Math.floor(off / sw);
    const h = 90 + h01(si) * 30;
    const c = BOOTH_C[Math.abs(si) % BOOTH_C.length][0];
    const wc = (q) => mix(q, air, 0.32);
    ctx.fillStyle = wc(mix(c, FG.navy, 0.35));
    ctx.fillRect(x + 6, base - h, sw - 12, h);
    ctx.fillStyle = wc('#ffe2a0');
    ctx.fillRect(x + 16, base - h + 30, sw - 32, h - 56);
    glow(ctx, x + sw / 2, base - h / 2, 60, '#ffd88a', 0.08);
    for (let s = 0; s < 8; s++) {
      ctx.fillStyle = wc(s % 2 ? FG.cream : c);
      ctx.beginPath();
      ctx.moveTo(x + s * (sw / 8), base - h);
      ctx.lineTo(x + (s + 1) * (sw / 8), base - h);
      ctx.lineTo(x + (s + 1) * (sw / 8), base - h + 16);
      ctx.arc(x + (s + 0.5) * (sw / 8), base - h + 16, sw / 16, 0, Math.PI);
      ctx.fill();
    }
    ctx.fillStyle = wc(FG.navy);
    ctx.fillRect(x + sw / 2 - 26, base - h - 22, 52, 18);
    ctx.fillStyle = wc(BULBS[Math.abs(si) % BULBS.length]);
    ctx.fillRect(x + sw / 2 - 20, base - h - 15, 40, 4);
    ctx.fillStyle = wc(FG.woodSh);
    ctx.fillRect(x + 14, base - 26, sw - 28, 6);
  }
  swags(ctx, cam, width, 8, 0.42, time, 180, 22);
  // A lost balloon or two drifting up.
  for (let i = 0; i < 3; i++) {
    const u = ((time * 0.05 + i / 3) % 1);
    const bx = wrap(i * 330 + Math.sin(time * 0.6 + i) * 20 - cam.x * 0.2, width + 100) - 50;
    const by = height * (1 - u) - 20;
    ctx.globalAlpha = Math.sin(u * Math.PI) * 0.8;
    ctx.fillStyle = BULBS[(i + 1) % BULBS.length];
    ctx.beginPath();
    ctx.ellipse(bx, by, 6, 7, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(bx, by + 7);
    ctx.lineTo(bx + 2, by + 20);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
// The Coaster Yard: the great wooden coaster itself across the sky, a train rattling over its hills.
export function drawPaintedCoasterYard(ctx, t, cam, width, height, time, layerY, air, map) {
  fireworks(ctx, cam, width, height, time, 0.03);
  hills(ctx, cam, width, height, layerY(60, 0.05), 0.05, mix(t.far, air, 0.5), 22);
  const k = 0.22;
  const base = layerY(0, k) + 10;
  const off = cam.x * k;
  const span = 1100;
  const track = (q) => {
    const u = wrap(q, span) / span;
    return base - 70 - Math.pow(Math.max(0, Math.sin(u * TAU * 2 + 0.6)), 1.6) * (u < 0.5 ? 180 : 120) - Math.sin(u * TAU * 5) * 10;
  };
  coasterTrack(ctx, -20, width + 20, base, (x) => track(x + off), 0.3, air, time, 20);
  // The train: three cars running the track, nose to tail (the track repeats every span).
  const q0 = time * 150;
  for (let c = 0; c < 3; c++) {
    const sx = wrap(q0 - c * 18 - off, span);
    for (const xx of [sx - span, sx, sx + span]) {
      if (xx < -30 || xx > width + 30) continue;
      const y = track(xx + off);
      const a = Math.atan2(track(xx + off + 4) - track(xx + off - 4), 8);
      ctx.save();
      ctx.translate(xx, y - 4);
      ctx.rotate(a);
      ctx.fillStyle = mix(c === 0 ? FG.pink : FG.mint, air, 0.25);
      ctx.fillRect(-8, -7, 16, 7);
      ctx.fillStyle = mix(FG.butter, air, 0.25);
      ctx.fillRect(-8, -8, 16, 2);
      ctx.fillStyle = mix('#ffe0c8', air, 0.25);
      ctx.beginPath();
      ctx.arc(-2, -9, 2, 0, TAU);
      ctx.arc(4, -9, 2, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
  swags(ctx, cam, width, 4, 0.45, time, 240, 24);
}
// The Ferris Wheel: the great wheel itself, turning slowly over the plaza, the tents low behind.
export function drawPaintedFerrisWheel(ctx, t, cam, width, height, time, layerY, air, map) {
  fireworks(ctx, cam, width, height, time, 0.03);
  hills(ctx, cam, width, height, layerY(50, 0.05), 0.05, mix(t.far, air, 0.5), 18);
  const kt = 0.1;
  const tb = layerY(10, kt);
  for (let i = -1; i < Math.ceil(width / 420) + 2; i++) {
    const ox = Math.round(i * 420 - wrap(cam.x * kt, 420));
    bigTop(ctx, ox + 90, tb, 120, 0.5, air, time);
  }
  // The wheel, centred on the plaza's middle.
  const k = 0.14;
  const mid = (map?.width ?? 1700) / 2;
  const cx = width / 2 - (cam.x + width / 2 - mid) * k;
  const cy = layerY(250, k);
  glow(ctx, cx, cy, 300, '#ffb0d0', 0.1);
  wheel(ctx, cx, cy, 230, time * 0.05, time, 0.34, air, 16, true, 0.12);
  swags(ctx, cam, width, 6, 0.4, time, 200, 22);
}
