// The Star Observatory's outdoor rooms and its steps (their remake, 2026-11-18, Chapter 7: The Night
// the Wind Went Out). A tower that only appears on clear nights, where Astraea has counted the stars
// alone for a thousand years. Nothing floats: the steps' and the Starlit Stair's landings are
// starstone balconies on gold-ringed columns down to whatever is below; the Telescope Crown's are
// brass gantries on lattice struts, round the great telescope's mount; the Orrery's riding planets
// hang from brass arms off its hub. Behind each outdoor room a painted backdrop of its own: the
// domed tower on the ridge top, shooting stars over it; the tower's own wall close by on the
// stair, its windows lit, the sky either side; and inside the open dome, its ribs arching overhead,
// the great telescope pointing straight up at stars that don't move.

import { E, T, F, R, sprite, blit, snap, mix } from './pixel.js';
import { band } from './propkit.js';
import { driftOffset, groundAt } from '../world/physics.js';

export const ST = {
  stone: '#3e4282', stoneLit: '#5a60a8', stoneSh: '#2a2c60', stoneDeep: '#1c1e46',
  gold: '#ffd36b', goldSh: '#d8a840', goldDeep: '#a87a2a', brass: '#e8b84a', brassSh: '#b88a2e',
  glass: '#bfe8ff', star: '#fff3a6', night: '#1a1a4a', lilac: '#b8a8ff',
};
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
  return sprite(`st|${key}`, () => ({ w: w + M * 2, h: Math.ceil(h) + M, shapes: build().filter(Boolean).map(moveIn), res: 2, soft: 'cel' }));
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
// What a column or strut under world (wx, wy) stands on: the nearest ledge below, or the floor.
function standOn(map, wx, wy) {
  let best = groundAt(map, wx);
  for (const p of map.platforms ?? []) if (p.y > wy + 4 && p.y < best && wx >= p.x && wx <= p.x + p.w && !p.drift) best = p.y;
  return best;
}
// A little four-point star.
const starPts = (x, y, r) => [[x, y - r], [x + r * 0.28, y - r * 0.28], [x + r, y], [x + r * 0.28, y + r * 0.28], [x, y + r], [x - r * 0.28, y + r * 0.28], [x - r, y], [x - r * 0.28, y - r * 0.28]];
function twinkle(ctx, x, y, r, a, c = ST.star) {
  if (a <= 0.01) return;
  glow(ctx, x, y, r * 3, c, a * 0.3);
  ctx.globalAlpha = a;
  ctx.fillStyle = c;
  ctx.beginPath();
  for (const [px, py] of starPts(x, y, r)) ctx.lineTo(px, py);
  ctx.fill();
  ctx.globalAlpha = 1;
}

// ---------- Starstone balconies (`islands: 'starbalcony'`) ----------
// A slab of deep blue starstone, gold-trimmed, little stars set in its face, on gold-ringed columns
// down to whatever is below.
function slabPic(w) {
  return art(`slab|${w}`, w + 8, 26, () => {
    const out = [R(-4, 0, w + 8, 7, '#7a80c8'), F(R(-4, 0, w + 8, 1.8, '#b8bcf0')), R(-4, 6, w + 8, 2.4, ST.gold), F(R(-4, 6, w + 8, 0.8, '#fff2b0'))];
    out.push(R(-2, 8, w + 4, 9, ST.stone), F(R(-2, 15, w + 4, 2, ST.stoneSh)));
    for (let x = 10; x < w - 6; x += 22) out.push(F(T(starPts(x, 12.4, 2.4), ST.star)));
    // Corbels under its lip, every so often.
    for (let x = 6; x <= w - 4; x += Math.max(40, (w - 10) / Math.max(1, Math.round(w / 70)))) out.push(T([[x - 5, 17], [x + 5, 17], [x + 2, 24], [x - 2, 24]], ST.stoneSh));
    return out;
  });
}
function columnPic(h) {
  return art(`col|${h}`, 16, h, () => {
    const out = [R(3, 0, 10, h, ST.stone), F(R(3, 0, 3, h, ST.stoneLit)), F(R(10.4, 0, 2.6, h, ST.stoneSh))];
    out.push(R(1, 0, 14, 4, ST.gold), R(1, h - 5, 14, 5, ST.goldSh));
    for (let y = 18; y < h - 14; y += 34) out.push(R(2.4, y, 11.2, 2.4, ST.gold), F(R(2.4, y, 11.2, 0.8, '#fff2b0')));
    return out;
  });
}
export function drawStarBalcony(ctx, x, y, w, time, seed, map, cam) {
  x = snap(x);
  y = snap(y);
  const wx = x + cam.x;
  const wy = y + cam.y;
  const cols = w > 300 ? [12, w / 2, w - 12] : w > 120 ? [12, w - 12] : [w / 2];
  for (const cx of cols) {
    const h = Math.round(standOn(map, wx + cx, wy) - (wy + 17));
    if (h > 6) blit(ctx, columnPic(h), snap(x + cx - 8 - M), snap(y + 17 - M));
  }
  blit(ctx, slabPic(w), x - 4 - M, y - M);
  // Its stars twinkle in turn.
  for (let k = 10, i = 0; k < w - 6; k += 22, i++) {
    const a = 0.25 + 0.25 * Math.sin(time * 2 + i * 1.7 + seed);
    glow(ctx, x + k, y + 12.4, 5, ST.star, a);
  }
}

// ---------- Brass gantries (`islands: 'gantry'`) ----------
// A deck of brass grating on a lattice of brass struts, round the great telescope's mount.
function deckPic(w) {
  return art(`deck|${w}`, w, 12, () => {
    const out = [R(-2, 0, w + 4, 6, ST.brass), F(R(-2, 0, w + 4, 1.4, '#ffe8a0')), R(-2, 6, w + 4, 3, ST.brassSh)];
    for (let x = 3; x < w; x += 6) out.push(F(R(x, 1.6, 1.2, 3.4, ST.goldDeep)));
    return out;
  });
}
function strutPic(w, h) {
  return art(`strut|${w}|${h}`, w, h, () => {
    const out = [];
    const xs = [6, w - 6];
    const rows = Math.max(1, Math.round(h / 34));
    for (let r = 0; r < rows; r++) {
      const y1 = (h * r) / rows;
      const y2 = (h * (r + 1)) / rows;
      out.push(...bd([[xs[0], y1], [xs[1], y2]], () => 2, ST.brassSh), ...bd([[xs[1], y1], [xs[0], y2]], () => 2, ST.goldDeep));
    }
    for (const px of xs) out.push(R(px - 3, 0, 6, h, ST.brass), F(R(px - 3, 0, 1.6, h, '#ffe8a0')), R(px - 5, h - 4, 10, 4, ST.stoneSh));
    return out;
  });
}
export function drawGantry(ctx, x, y, w, time, seed, map, cam) {
  x = snap(x);
  y = snap(y);
  const wx = x + cam.x;
  const wy = y + cam.y;
  const h = Math.round(Math.max(standOn(map, wx + 6, wy), standOn(map, wx + w - 6, wy)) - (wy + 9));
  if (h > 6) blit(ctx, strutPic(w, h), x - M, y + 9 - M);
  blit(ctx, deckPic(w), x - M, y - M);
  glow(ctx, x + w / 2, y + 4, 10, ST.star, 0.2 + 0.1 * Math.sin(time * 2 + seed));
}

// ---------- The Orrery's riding planets (`style: 'planet'` on its drifting ledges) ----------
// A brass planet you ride on top of, hung from the orrery's hub by a long brass arm that swings as
// it goes round (the hub at the room's middle, near the top).
const PLANET_C = [['#7fd8ff', '#4fa8d8'], ['#ff9ab8', '#d8608e'], ['#b8a8ff', '#8a74d8']];
function planetPic(w, seed) {
  const [c, sh] = PLANET_C[seed % PLANET_C.length];
  const r = w / 2 - 4;
  return art(`planet|${w}|${seed % 3}`, w, r * 2 + 10, () => [
    E(w / 2, r + 6, r, r, c), F(E(w / 2 - r * 0.35, r - r * 0.2, r * 0.3, r * 0.18, '#ffffff')), F(E(w / 2 + r * 0.2, r + 6 + r * 0.45, r * 0.7, r * 0.3, sh)),
    E(w / 2, r + 6, r + 10, 3, ST.gold), F(E(w / 2, r + 5, r + 9, 1.2, '#fff2b0')),
    R(2, 0, w - 4, 5, ST.brass), F(R(2, 0, w - 4, 1.2, '#ffe8a0')),
  ]);
}
export function drawPlanet(ctx, x, y, w, time, seed, p, map, cam) {
  const off = p.drift ? driftOffset(p, map.clock ?? 0) : 0;
  const real = cam.x + off;
  // The arm, from the hub down to the planet's top.
  const hx = (map.width ?? 1600) / 2 - real;
  const hy = 90 - cam.y;
  ctx.save();
  ctx.strokeStyle = ST.brassSh;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(x + w / 2, y + 2);
  ctx.stroke();
  ctx.strokeStyle = '#ffe8a0';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
  blit(ctx, planetPic(w, seed), snap(x - M), snap(y - M));
}

// ---------- Landmarks ----------
// The tower's door: a tall arch of starstone, a gold star over it, a little dome on top.
function archPic() {
  return art('arch', 200, 220, () => {
    const out = [];
    for (const tx of [18, 182]) out.push(R(tx - 16, 60, 32, 160, ST.stone), F(R(tx - 16, 60, 5, 160, ST.stoneLit)), R(tx - 18, 56, 36, 7, ST.gold), R(tx - 18, 212, 36, 8, ST.goldSh));
    out.push(...bd([[18, 64], [100, 18], [182, 64]], () => 20, ST.stone), F(...bd([[18, 58], [100, 12], [182, 58]], () => 3, ST.gold)));
    out.push(T([[60, 34], [100, 0], [140, 34]], ST.stoneSh), E(100, 34, 40, 14, ST.stoneLit), F(R(98, -2, 4, 8, ST.gold)));
    out.push(T(starPts(100, 44, 12), ST.gold), F(T(starPts(98, 42, 4), '#ffffff')));
    for (let k = 0; k < 6; k++) out.push(F(T(starPts(30 + k * 28, 100 + (k % 2) * 30, 2.4), ST.star)));
    return out;
  });
}
function drawStarArch(ctx, x, y, time) {
  place(ctx, archPic(), x, y);
  ctx.save();
  twinkle(ctx, x, y - 220 + 44, 6, 0.4 + 0.3 * Math.sin(time * 2));
  for (let k = 0; k < 7; k++) {
    const u = k / 6;
    twinkle(ctx, x - 82 + 164 * u, y - 220 + 64 - Math.sin(u * Math.PI) * 44, 1.6, 0.4 + 0.5 * (0.5 + 0.5 * Math.sin(time * 3 - k)));
  }
  ctx.restore();
}
// A brass telescope on a tripod, pointing at the sky.
function scopePic() {
  return art('scope', 50, 64, () => [
    ...bd([[25, 34], [10, 64]], () => 2.4, ST.goldDeep), ...bd([[25, 34], [40, 64]], () => 2.4, ST.goldDeep), ...bd([[25, 34], [25, 64]], () => 2.4, ST.brassSh),
    ...bd([[8, 44], [40, 6]], () => 8, ST.brass), F(...bd([[10, 41], [38, 7]], () => 2, '#ffe8a0')), E(41, 5, 5, 5, ST.brassSh), E(41, 5, 3.4, 3.4, ST.glass),
    E(25, 32, 3.4, 3.4, ST.gold),
  ]);
}
export const STAR_KINDS = {
  stararch: { w: 260, h: 280, draw: (ctx, x, y, time) => drawStarArch(ctx, x, y, time) },
  starscope: { w: 50 + M * 2, h: 64 + M, draw: (ctx, x, y) => place(ctx, scopePic(), x, y) },
};

// ---------- Painted backdrops ----------
// Shooting stars now and then, far off.
function shooting(ctx, width, height, time) {
  for (let i = 0; i < 2; i++) {
    const cyc = 6 + i * 2.5;
    const u = ((time + i * 3.1) % cyc) / 0.9;
    if (u > 1) continue;
    const n = Math.floor((time + i * 3.1) / cyc);
    const x0 = h01(n * 7 + i) * width;
    const y0 = height * (0.08 + h01(n * 3 + i) * 0.2);
    const x = x0 + u * 140;
    const y = y0 + u * 60;
    const g = ctx.createLinearGradient(x - 40, y - 17, x, y);
    g.addColorStop(0, hexA('#ffffff', 0));
    g.addColorStop(1, hexA('#ffffff', 0.8 * (1 - u)));
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x - 40, y - 17);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}
// Constellations: little groups of stars joined by faint lines, twinkling.
const SHAPES = [
  [[0, 0], [22, -10], [44, -4], [60, 14], [40, 26]],
  [[0, 0], [16, 18], [34, 10], [52, 26]],
  [[0, 10], [14, 0], [30, 6], [24, 24], [8, 26]],
];
function constellations(ctx, cam, width, height, time, k, a = 1) {
  const span = 380;
  const off = cam.x * k;
  for (let i = -1; i < Math.ceil(width / span) + 2; i++) {
    const si = i + Math.floor(off / span);
    const sh = SHAPES[((si % 3) + 3) % 3];
    const ox = Math.round(i * span - wrap(off, span) + 80 + h01(si) * 140);
    const oy = height * (0.12 + h01(si + 9) * 0.22);
    ctx.strokeStyle = hexA('#c8c8ff', 0.22 * a);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    sh.forEach(([x, y], j) => (j ? ctx.lineTo(ox + x, oy + y) : ctx.moveTo(ox + x, oy + y)));
    ctx.stroke();
    sh.forEach(([x, y], j) => twinkle(ctx, ox + x, oy + y, 1.6 + (j % 2), a * (0.5 + 0.5 * Math.sin(time * 1.8 + j * 1.3 + si))));
  }
}
function ridge(ctx, cam, width, height, y, k, c) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width + 8; x += 8) {
    const q = x + cam.x * k;
    ctx.lineTo(x, y - Math.abs(Math.sin(q * 0.004)) * 40 - Math.sin(q * 0.013 + 1) * 10);
  }
  ctx.lineTo(width, height);
  ctx.fill();
}
// A domed observatory tower at (x, base), w wide, h tall: its dome's slit open, a telescope poking
// out, lit windows climbing it.
function tower(ctx, x, base, w, h, wash, air, time) {
  const W = (c) => mix(c, air, wash);
  ctx.fillStyle = W(ST.stone);
  ctx.fillRect(x - w / 2, base - h, w, h);
  ctx.fillStyle = W(ST.stoneLit);
  ctx.fillRect(x - w / 2, base - h, w * 0.18, h);
  for (let y = base - h + 40; y < base - 30; y += 46) {
    glow(ctx, x, y + 9, 16, '#ffd88a', 0.12);
    ctx.fillStyle = W('#ffe2a0');
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 18);
    ctx.lineTo(x - 6, y + 6);
    ctx.arc(x, y + 6, 6, Math.PI, 0);
    ctx.lineTo(x + 6, y + 18);
    ctx.fill();
  }
  ctx.fillStyle = W(ST.gold);
  ctx.fillRect(x - w / 2 - 4, base - h - 6, w + 8, 6);
  ctx.fillStyle = W(ST.stoneLit);
  ctx.beginPath();
  ctx.arc(x, base - h - 6, w / 2 + 2, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = W('#1a1a4a');
  ctx.fillRect(x - 5, base - h - 6 - w / 2, 10, w / 2);
  // The telescope poking out of the slit, nodding at the stars: a stout tube, a lens at its end.
  const ang = -1.05 + Math.sin(time * 0.2) * 0.1;
  const ox = x;
  const oy = base - h - 14;
  const len = w * 0.62;
  const ex = ox + Math.cos(ang) * len;
  const ey = oy + Math.sin(ang) * len;
  ctx.lineCap = 'round';
  ctx.strokeStyle = W(ST.brassSh);
  ctx.lineWidth = Math.max(5, w * 0.2);
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.strokeStyle = W(ST.brass);
  ctx.lineWidth = Math.max(2, w * 0.08);
  ctx.stroke();
  ctx.fillStyle = W(ST.glass);
  ctx.beginPath();
  ctx.arc(ex, ey, Math.max(3, w * 0.1), 0, TAU);
  ctx.fill();
  glow(ctx, ex, ey, 14, ST.glass, 0.25);
  ctx.fillStyle = W(ST.gold);
  ctx.beginPath();
  ctx.arc(ox, oy, Math.max(3, w * 0.08), 0, TAU);
  ctx.fill();
}

// The Observatory Steps: the domed tower on the ridge top against the stars.
export function drawPaintedStarGate(ctx, t, cam, width, height, time, layerY, air, map) {
  constellations(ctx, cam, width, height, time, 0.03);
  shooting(ctx, width, height, time);
  ridge(ctx, cam, width, height, layerY(80, 0.05), 0.05, mix(t.far, air, 0.45));
  const k = 0.14;
  const base = layerY(10, k);
  const tx = width / 2 - (cam.x + width / 2 - (map?.width ?? 1200) * 0.7) * k;
  glow(ctx, tx, base - 160, 220, '#b8a8ff', 0.14);
  tower(ctx, tx, base, 90, 230, 0.25, air, time);
  ridge(ctx, cam, width, height, layerY(20, 0.2), 0.2, mix(t.mid, air, 0.3));
}
// The Starlit Stair: the tower's own wall close behind, its windows lit, the sky either side.
export function drawPaintedStarStair(ctx, t, cam, width, height, time, layerY, air, map) {
  constellations(ctx, cam, width, height, time, 0.03);
  shooting(ctx, width, height, time);
  const k = 0.3;
  const mid = (map?.width ?? 1500) / 2;
  const cx = width / 2 - (cam.x + width / 2 - mid) * k;
  const ww = 520;
  const wash = 0.5;
  const W = (c) => mix(c, air, wash);
  const top = layerY(900, 0.12);
  // The tower's edges round off into shadow; its face pale with distance, behind the landings.
  ctx.fillStyle = W(ST.stoneSh);
  ctx.fillRect(cx - ww / 2, top, ww, height - top + 10);
  ctx.fillStyle = W(ST.stoneLit);
  ctx.fillRect(cx - ww / 2 + 22, top, ww - 44, height - top + 10);
  // Stone blocks in courses, offset row by row.
  const vy = cam.y * 0.12;
  ctx.fillStyle = W(ST.stone);
  for (let y = wrap(top - vy, 36), r = 0; y < height; y += 36, r++) {
    ctx.fillRect(cx - ww / 2 + 22, y, ww - 44, 2);
    for (let x = cx - ww / 2 + 22 + (r % 2 ? 30 : 0); x < cx + ww / 2 - 22; x += 60) ctx.fillRect(x, y, 2, 36);
  }
  // Tall arched windows in gold frames, most lit warm.
  for (let r = 0; r < 12; r++) {
    const y = top + 60 + r * 120;
    if (y > height + 40 || y < -80) continue;
    for (const dx of [-150, 0, 150]) {
      const on = h01(r * 3 + dx) > 0.3;
      const arch = (inset) => {
        ctx.beginPath();
        ctx.moveTo(cx + dx - 14 + inset, y + 60 - inset);
        ctx.lineTo(cx + dx - 14 + inset, y + 14);
        ctx.arc(cx + dx, y + 14, 14 - inset, Math.PI, 0);
        ctx.lineTo(cx + dx + 14 - inset, y + 60 - inset);
        ctx.fill();
      };
      ctx.fillStyle = W(ST.gold);
      arch(-3);
      ctx.fillStyle = on ? mix('#ffcf7a', air, 0.2) : W('#24245a');
      arch(0);
      if (on) {
        glow(ctx, cx + dx, y + 34, 40, '#ffd88a', 0.16);
        ctx.fillStyle = W(ST.goldSh);
        ctx.fillRect(cx + dx - 1, y + 2, 2, 58);
        ctx.fillRect(cx + dx - 14, y + 30, 28, 2);
      }
    }
  }
  // A band of carved stars spiralling up the wall.
  for (let j = 0; j < 14; j++) {
    const y = top + 40 + j * 70;
    const x = cx - ww / 2 + 30 + ((j * 70) % (ww - 60));
    if (y < -20 || y > height + 20) continue;
    twinkle(ctx, x, y, 3, 0.35 + 0.25 * Math.sin(time * 1.5 + j));
  }
  // The dome on top, when it comes into view.
  ctx.fillStyle = W(ST.stoneLit);
  ctx.beginPath();
  ctx.arc(cx, top, ww / 2 - 30, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = W(ST.gold);
  ctx.fillRect(cx - ww / 2 + 20, top - 6, ww - 40, 8);
}
// The Telescope Crown: inside the open dome, its ribs arching overhead, the great telescope
// pointing straight up at stars that don't move.
export function drawPaintedStarCrown(ctx, t, cam, width, height, time, layerY, air, map) {
  constellations(ctx, cam, width, height, time, 0.02, 1.2);
  const k = 0.12;
  const mid = (map?.width ?? 1700) / 2;
  const cx = width / 2 - (cam.x + width / 2 - mid) * k;
  const base = layerY(0, k);
  const W = (c, w = 0.2) => mix(c, air, w);
  // The dome's ribs, arching up and over out of view, the slit open between the middle two.
  // The dome's shell between the ribs, darker than the open slit's sky.
  ctx.fillStyle = hexA(ST.stoneDeep, 0.55);
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + sd * 50, -40);
    ctx.quadraticCurveTo(cx + sd * 330, base - 260, cx + sd * 760, base + 20);
    ctx.lineTo(cx + sd * 900, base + 20);
    ctx.lineTo(cx + sd * 900, -40);
    ctx.fill();
  }
  for (let i = -5; i <= 5; i++) {
    if (i === 0) continue;
    const x0 = cx + i * 140;
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(x0, base + 20);
      ctx.quadraticCurveTo(x0 * 1.05 - cx * 0.05, base - 330, cx + Math.sign(i) * (40 + Math.abs(i) * 4), -40);
    };
    ctx.strokeStyle = W(ST.stone, 0.1);
    ctx.lineWidth = 18;
    path();
    ctx.stroke();
    ctx.strokeStyle = W(ST.stoneLit, 0.1);
    ctx.lineWidth = 8;
    path();
    ctx.stroke();
    ctx.strokeStyle = W(ST.gold, 0.15);
    ctx.lineWidth = 1.6;
    path();
    ctx.stroke();
  }
  // The dome's rings, crossing the ribs: a lattice overhead.
  for (const [rx, ry] of [[260, 150], [480, 290], [720, 420]]) {
    ctx.strokeStyle = W(ST.stone, 0.15);
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.ellipse(cx, -60, rx, ry, 0, 0.12, Math.PI - 0.12);
    ctx.stroke();
    ctx.strokeStyle = W(ST.gold, 0.2);
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  // The great telescope, straight up, on its mount.
  ctx.fillStyle = W(ST.stoneSh);
  ctx.fillRect(cx - 70, base - 60, 140, 70);
  ctx.fillStyle = W(ST.gold);
  ctx.fillRect(cx - 74, base - 64, 148, 6);
  const tw = 46;
  const g = ctx.createLinearGradient(cx - tw / 2, 0, cx + tw / 2, 0);
  g.addColorStop(0, W('#ffe8a0'));
  g.addColorStop(0.4, W(ST.brass));
  g.addColorStop(1, W(ST.brassSh));
  ctx.fillStyle = g;
  ctx.fillRect(cx - tw / 2, -20, tw, base - 44);
  for (let y = base - 120; y > -20; y -= 90) {
    ctx.fillStyle = W(ST.goldDeep);
    ctx.fillRect(cx - tw / 2 - 4, y, tw + 8, 7);
  }
  glow(ctx, cx, 0, 90, ST.star, 0.18);
  // The brass ring rail round the dome's foot.
  ctx.fillStyle = W(ST.goldSh);
  ctx.fillRect(0, base - 6, width, 4);
}
