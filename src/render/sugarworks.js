// The Candy Volcano's rooms and its Sugar Trail (their remake, 2026-11-19, Chapter 8: Steam and
// Roses). A mountain of cake and sugar where Queen Bonbon bakes a bigger cake every day, hoping
// someone will come and share it. Nothing floats: the valley's ledges are pink wafers on peppermint
// posts; the mine's are licorice trestles, and its carts run on rails over the caramel pit; the
// kitchen's are long tables under gingham cloths and a pot rack hung from the beams; the forge's
// iron grates sit on toffee-brick piers, or hang on chains; the ramparts' are gingerbread turrets;
// the crater's are rock-candy crusts on crystal pillars standing in the caramel. Behind each room a
// painted backdrop of its own: the volcano on the skyline smoking candy floss over gumdrop hills;
// chocolate strata braced with licorice timbers; a tiled kitchen with brick ovens and jars of
// sweets; a toffee-brick forge round a furnace pouring caramel; the cone close behind the
// gingerbread wall; and inside the crater, its frosted rim all round a glowing caramel lake.

import { E, T, F, R, sprite, blit, snap, mix } from './pixel.js';
import { band } from './propkit.js';
import { driftOffset, groundAt } from '../world/physics.js';

export const SW = {
  choc: '#6e4636', chocLit: '#94634a', chocSh: '#4a2c22', chocDeep: '#33201a',
  frost: '#fff6fa', frostSh: '#f2d4e0', pink: '#ff9ab8', pinkSh: '#e0708e', pinkLit: '#ffc8da',
  mint: '#9ae6c0', mintSh: '#62c49a', lemon: '#ffe08a', lemonSh: '#e8b84a', lilac: '#c8b8ff',
  caramel: '#ffb050', caramelSh: '#d87a2a', caramelLit: '#ffd890',
  wafer: '#f6d6a0', waferSh: '#d8a868', waferLit: '#fff0cc',
  lic: '#2e2232', licLit: '#56405c', licSh: '#1a121e', red: '#e8505e', redSh: '#b8344a', redLit: '#ff8a96',
  ginger: '#c8844e', gingerSh: '#9a5a34', gingerLit: '#e2a66c', icing: '#fff8f2',
  wood: '#c8905a', woodSh: '#946238', woodLit: '#e8b880', copper: '#e0905a', copperSh: '#a85a34', copperLit: '#ffc890',
  iron: '#5a4a52', ironLit: '#7e6c76', ironSh: '#3a2e36', brick: '#b0683e', brickSh: '#80462a', brickLit: '#cc8454',
  glass: '#d8f0ff',
};
const ROCK = [['#ff9ad8', '#ffd0ec', '#d86aa8'], ['#ffc08a', '#ffe2c0', '#d88a4a'], ['#c8a8ff', '#e8dcff', '#9a7ad8'], ['#9ae6d8', '#d8fff4', '#5ab8a8']];
const TAU = Math.PI * 2;
const bd = (path, wf, c) => [band(path, (u) => wf(u) / 2, c)];
const h01 = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const hexA = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${Math.max(0, Math.min(1, a))})`;
const wrap = (x, span) => ((x % span) + span) % span;
// The air colour a picture is washed with, snapped to a coarse step: the sky drifts with the time of
// day, and a picture cached per exact colour would be painted again for every shade it passes.
const qair = (c) => {
  if (!c || c[0] !== '#' || c.length < 7) return c;
  const q = (i) => Math.min(255, Math.round(parseInt(c.slice(i, i + 2), 16) / 24) * 24).toString(16).padStart(2, '0');
  return `#${q(1)}${q(3)}${q(5)}`;
};

// ---------- Cached pictures ----------
const M = 30;
const moveIn = (sh) => (sh.pts ? { ...sh, pts: sh.pts.map(([px, py]) => [px + M, py + M]) } : { ...sh, x: (sh.x ?? 0) + M, y: (sh.y ?? 0) + M });
function art(key, w, h, build) {
  return sprite(`sw|${key}`, () => ({ w: w + M * 2, h: Math.ceil(h) + M, shapes: build().filter(Boolean).map(moveIn), res: 2, soft: 'cel' }));
}
// Bottom centre at (x, y).
function place(ctx, s, x, y) {
  blit(ctx, s, snap(x - s.w / 2), snap(y - s.h));
}
// Top left of the picture's own (0, 0) at (x, y).
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
// What a post or pillar under world (wx, wy) stands on: the nearest ledge below, or the floor.
function standOn(map, wx, wy) {
  let best = groundAt(map, wx);
  for (const p of map.platforms ?? []) if (p.y > wy + 4 && p.y < best && wx >= p.x && wx <= p.x + p.w && !p.drift) best = p.y;
  return best;
}
// A striped band along a path, its segments in turn (candy canes, licorice twists).
function stripes(path, half, cols) {
  const out = [];
  for (let i = 0; i < path.length - 1; i++) out.push(F(band([path[i], path[i + 1]], () => half, cols[i % cols.length])));
  return out;
}

// ---------- The valley's wafers (`islands: 'wafer'`) ----------
// A pink-iced wafer bar, cream between its layers, on peppermint-stick posts down to whatever is
// below.
function waferPic(w) {
  return art(`wafer|${w}`, w, 22, () => {
    const out = [R(-4, 2, w + 8, 16, SW.wafer)];
    out.push(F(R(-4, 7.2, w + 8, 1.8, SW.pinkLit)), F(R(-4, 12.4, w + 8, 1.8, SW.pinkLit)), F(R(-4, 16, w + 8, 2, SW.waferSh)));
    for (let x = 2; x < w; x += 8) out.push(F(R(x, 2.6, 1, 4.2, SW.waferSh)), F(R(x + 4, 9, 1, 3.2, SW.waferSh)), F(R(x, 14, 1, 2, SW.waferSh)));
    out.push(R(-5, -0.5, w + 10, 4.5, SW.pink), F(R(-5, -0.5, w + 10, 1.4, SW.pinkLit)));
    for (let x = 4, i = 0; x < w - 2; x += 15 + ((i * 7) % 4) * 5, i++) {
      const d = 2.4 + ((i * 5) % 4) * 1.4;
      out.push(F(R(x - 1.6, 3.5, 3.2, d, SW.pink)), F(E(x, 3.5 + d, 1.9, 1.9, SW.pink)));
    }
    return out;
  });
}
function canePic(h) {
  return art(`cane|${h}`, 12, h, () => {
    const out = [R(2, 0, 8, h, '#fff8f8')];
    for (let y = 0; y + 12 <= h; y += 11) out.push(F(T([[2, y + 7], [10, y], [10, y + 4.5], [2, y + 11.5]], SW.red)));
    out.push(F(R(3.2, 0, 1.4, h, '#ffffff')), F(R(8.4, 0, 1.4, h, '#ecd2d6')), R(0.5, h - 3, 11, 3, SW.chocSh));
    return out;
  });
}
export function drawWafer(ctx, x, y, w, time, seed, map, cam) {
  x = snap(x);
  y = snap(y);
  const wx = x + cam.x;
  const wy = y + cam.y;
  const posts = w > 280 ? [16, w / 2, w - 16] : w > 110 ? [14, w - 14] : [w / 2];
  for (const px of posts) {
    const h = Math.round(standOn(map, wx + px, wy) - (wy + 17));
    if (h > 6) at(ctx, canePic(h), x + px - 6, y + 17);
  }
  at(ctx, waferPic(w), x, y);
}

// ---------- The mine's licorice trestles (`islands: 'licorice'`) ----------
function licDeckPic(w) {
  return art(`licdeck|${w}`, w, 13, () => {
    const out = [R(-3, 0, w + 6, 8, SW.lic), F(R(-3, 0, w + 6, 1.6, SW.licLit))];
    for (let x = 14; x < w; x += 18) out.push(F(R(x, 1.6, 1.2, 6, SW.licSh)));
    out.push(R(-3, 8, w + 6, 4, SW.red), F(R(-3, 8, w + 6, 1.2, SW.redLit)));
    return out;
  });
}
function licLegsPic(w, h) {
  return art(`liclegs|${w}|${h}`, w, h, () => {
    const out = [];
    const xs = [7, w - 7];
    const rows = Math.max(1, Math.round(h / 72));
    for (let r = 0; r < rows; r++) {
      const y1 = (h * r) / rows + 4;
      const y2 = (h * (r + 1)) / rows - 2;
      for (const [a, b] of [[xs[0], xs[1]], [xs[1], xs[0]]]) {
        const path = [];
        for (let s = 0; s <= 1.001; s += 1 / 8) path.push([a + (b - a) * s, y1 + (y2 - y1) * s]);
        out.push(...bd(path, () => 3.4, SW.redSh), ...stripes(path, 1.2, [SW.red, SW.redLit]));
      }
    }
    for (const px of xs) out.push(R(px - 4, 0, 8, h, SW.lic), F(R(px - 2.4, 0, 1.2, h, SW.licLit)), F(R(px + 1.4, 0, 1, h, SW.licSh)), R(px - 6, h - 4, 12, 4, SW.chocSh));
    return out;
  });
}
export function drawLicTrestle(ctx, x, y, w, time, seed, map, cam) {
  x = snap(x);
  y = snap(y);
  const wx = x + cam.x;
  const wy = y + cam.y;
  const h = Math.round(Math.max(standOn(map, wx + 7, wy), standOn(map, wx + w - 7, wy)) - (wy + 12));
  if (h > 6) at(ctx, licLegsPic(w, h), x, y + 12);
  at(ctx, licDeckPic(w), x, y);
}

// ---------- The mine's carts (`style: 'minecart'` on its drifting ledges) ----------
// A chocolate minecart, pink-rimmed, riding a rail over the caramel on licorice posts. You stand on
// its rim; its wheels turn as it rolls.
function cartPic(w) {
  return art(`cart|${w}`, w, 38, () => {
    const out = [T([[-2, 0], [w + 2, 0], [w - 5, 34], [5, 34]], SW.choc)];
    out.push(F(T([[2, 5], [12, 5], [12, 31], [7, 31]], SW.chocLit)), F(R(5, 30, w - 10, 4, SW.chocSh)));
    out.push(F(R(4, 15, w - 8, 6, SW.mint)), F(R(4, 15, w - 8, 1.4, '#d8fff0')));
    for (let x = 12; x < w - 8; x += 16) out.push(F(E(x, 9, 2.2, 2, SW.lemon)), F(E(x + 8, 26, 2.2, 2, SW.pinkLit)));
    out.push(R(-4, -1, w + 8, 5, SW.pink), F(R(-4, -1, w + 8, 1.4, SW.pinkLit)));
    return out;
  });
}
function wheel(ctx, x, y, r, ang) {
  ctx.fillStyle = SW.lic;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = SW.licLit;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let k = 0; k < 3; k++) {
    const a = ang + (k * TAU) / 3;
    ctx.moveTo(x - Math.cos(a) * (r - 1.5), y - Math.sin(a) * (r - 1.5));
    ctx.lineTo(x + Math.cos(a) * (r - 1.5), y + Math.sin(a) * (r - 1.5));
  }
  ctx.stroke();
  ctx.fillStyle = SW.red;
  ctx.beginPath();
  ctx.arc(x, y, 1.8, 0, TAU);
  ctx.fill();
}
export function drawMinecart(ctx, x, y, w, time, seed, p, map, cam) {
  const off = p.drift ? driftOffset(p, map.clock ?? 0) : 0;
  // The rail, the whole of the cart's run, on licorice posts down to the floor.
  const r0 = snap(p.x - cam.x - 14);
  const r1 = snap(p.x + (p.drift?.dx ?? 0) + w - cam.x + 14);
  const ry = snap(p.y - cam.y + 44);
  const floor = snap((map.groundY ?? ry + 40) - cam.y);
  ctx.fillStyle = SW.lic;
  for (let px = r0 + 8; px < r1; px += 64) ctx.fillRect(px - 3, ry + 3, 6, floor - ry - 3);
  for (let px = r0 + 8; px < r1; px += 64) {
    ctx.fillStyle = SW.licLit;
    ctx.fillRect(px - 2, ry + 3, 1, floor - ry - 3);
  }
  ctx.fillStyle = SW.chocSh;
  ctx.fillRect(r0, ry, r1 - r0, 4);
  ctx.fillStyle = SW.ironLit;
  ctx.fillRect(r0, ry, r1 - r0, 1.4);
  ctx.fillStyle = SW.lic;
  ctx.fillRect(r0 - 3, ry - 6, 4, 10);
  ctx.fillRect(r1 - 1, ry - 6, 4, 10);
  x = snap(x);
  y = snap(y);
  at(ctx, cartPic(w), x, y);
  const ang = off / 6;
  wheel(ctx, x + 16, y + 38, 6, ang);
  wheel(ctx, x + w - 16, y + 38, 6, ang);
}

// ---------- The kitchen's tables (`islands: 'table'`) ----------
// A long wooden table under a pink gingham cloth, on turned legs.
function tablePic(w, h) {
  return art(`table|${w}|${h}`, w, h, () => {
    const out = [];
    for (const px of [14, w - 14]) {
      out.push(R(px - 4, 16, 8, h - 20, SW.wood), F(R(px - 2.6, 16, 1.6, h - 20, SW.woodLit)));
      out.push(E(px, 16 + (h - 16) * 0.35, 6, 4, SW.wood), E(px, 16 + (h - 16) * 0.72, 5.4, 3.4, SW.wood), R(px - 6, h - 4, 12, 4, SW.woodSh));
    }
    out.push(R(-4, 0, w + 8, 7, SW.wood), F(R(-4, 0, w + 8, 1.6, SW.woodLit)));
    out.push(R(-2, 7, w + 4, 10, '#fff6f8'));
    for (let x = 0; x < w; x += 8) out.push(F(R(x, 7, 4, 10, '#ffdce6')));
    for (const y of [9, 14]) {
      out.push(F(R(-2, y, w + 4, 3, '#ffdce6')));
      for (let x = 0; x < w; x += 8) out.push(F(R(x, y, 4, 3, '#ffc2d4')));
    }
    for (let x = 2; x < w; x += 8) out.push(F(E(x + 2, 17, 4, 2.2, '#fff6f8')));
    return out;
  });
}
export function drawKitchenTable(ctx, x, y, w, time, seed, map, cam) {
  x = snap(x);
  y = snap(y);
  const h = Math.round(standOn(map, x + cam.x + w / 2, y + cam.y) - (y + cam.y));
  at(ctx, tablePic(w, Math.max(24, h)), x, y);
}

// ---------- Hung from the beams (`islands: 'potrack'` / 'hangdeck') ----------
// The kitchen's: a wooden shelf on two chains, copper pans swinging from hooks under its ends.
// The forge's: an iron grate on chains, a lantern under it.
function chain(ctx, x, y0, y1, c, lit) {
  ctx.fillStyle = c;
  for (let y = y1; y > y0; y -= 6) ctx.fillRect(x - 1.5, y - 5, 3, 4);
  ctx.fillStyle = lit;
  for (let y = y1; y > y0; y -= 6) ctx.fillRect(x - 0.5, y - 5, 1, 2);
}
function rackPic(w) {
  return art(`rack|${w}`, w, 12, () => [R(-3, 0, w + 6, 7, SW.wood), F(R(-3, 0, w + 6, 1.6, SW.woodLit)), R(-3, 7, w + 6, 3, SW.woodSh), F(R(8, 10, 3, 2, SW.ironSh)), F(R(w - 11, 10, 3, 2, SW.ironSh))]);
}
function panPic(r) {
  return art(`pan|${r}`, r * 2 + 6, r * 2 + 20, () => [
    ...bd([[r + 3, 0], [r + 3, 16]], () => 2.2, SW.copperSh),
    E(r + 3, 16 + r, r, r, SW.copper), F(E(r + 3, 16 + r, r - 3, r - 3, SW.copperSh)), F(E(r - 1, 12 + r, r * 0.4, r * 0.28, SW.copperLit)),
  ]);
}
function gratePic(w) {
  return art(`grate|${w}`, w, 11, () => {
    const out = [R(-3, 0, w + 6, 6, SW.iron), F(R(-3, 0, w + 6, 1.4, SW.ironLit))];
    for (let x = 3; x < w; x += 6) out.push(F(R(x, 1.8, 1.4, 3, SW.ironSh)));
    out.push(R(-3, 6, w + 6, 3, SW.ironSh));
    for (let x = 6; x < w; x += 24) out.push(F(E(x, 7.5, 1.2, 1.2, SW.copperLit)));
    return out;
  });
}
export function drawHung(ctx, x, y, w, time, seed, map, cam, kind = 'potrack') {
  x = snap(x);
  y = snap(y);
  const pots = kind === 'potrack';
  const [c, lit] = pots ? [SW.ironSh, SW.ironLit] : [SW.ironSh, SW.copperLit];
  for (const cx of [x + 9, x + w - 9]) chain(ctx, cx, -20, y, c, lit);
  if (pots) {
    for (const [dx, r, ph] of [[18, 9, 0], [w - 18, 11, 1.7]]) {
      const s = panPic(r);
      const a = Math.sin(time * 1.4 + ph + seed) * 0.07;
      ctx.save();
      ctx.translate(x + dx, y + 10);
      ctx.rotate(a);
      blit(ctx, s, snap(-s.w / 2), snap(-M));
      ctx.restore();
    }
    at(ctx, rackPic(w), x, y);
  } else {
    // A lantern swinging under it, glowing caramel.
    const lx = x + w * 0.25;
    const a = Math.sin(time * 1.2 + seed) * 0.08;
    ctx.save();
    ctx.translate(lx, y + 9);
    ctx.rotate(a);
    ctx.fillStyle = SW.ironSh;
    ctx.fillRect(-0.6, 0, 1.2, 8);
    glow(ctx, 0, 15, 22, SW.caramel, 0.35 + 0.08 * Math.sin(time * 5 + seed));
    ctx.fillStyle = SW.iron;
    ctx.fillRect(-5, 8, 10, 3);
    ctx.fillStyle = SW.caramelLit;
    ctx.fillRect(-4, 11, 8, 8);
    ctx.fillStyle = SW.iron;
    ctx.fillRect(-5, 19, 10, 2);
    ctx.restore();
    at(ctx, gratePic(w), x, y);
  }
}

// ---------- The forge's piers (`islands: 'forgepier'`) ----------
// An iron grate on two toffee-brick piers, caramel dripping off its edge and glowing.
function pierPic(w, h) {
  return art(`pier|${w}|${h}`, w, h, () => {
    const out = [];
    for (const px of [16, w - 16]) {
      out.push(R(px - 13, 0, 26, h, SW.brick), F(R(px - 13, 0, 4, h, SW.brickLit)), F(R(px + 9, 0, 4, h, SW.brickSh)));
      for (let y = 8, r = 0; y < h - 4; y += 9, r++) {
        out.push(F(R(px - 13, y, 26, 1.2, SW.brickSh)));
        const jx = r % 2 ? px - 4 : px + 4;
        out.push(F(R(jx, y - 8, 1.2, 8, SW.brickSh)));
      }
      out.push(R(px - 15, 0, 30, 5, SW.brickSh), R(px - 15, h - 5, 30, 5, SW.brickSh));
    }
    return out;
  });
}
export function drawForgePier(ctx, x, y, w, time, seed, map, cam) {
  x = snap(x);
  y = snap(y);
  const wx = x + cam.x;
  const wy = y + cam.y;
  const h = Math.round(Math.max(standOn(map, wx + 16, wy), standOn(map, wx + w - 16, wy)) - (wy + 9));
  if (h > 6) at(ctx, pierPic(w, h), x, y + 9);
  at(ctx, gratePic(w), x, y);
  // Caramel drips off the grate's edge now and then, glowing as they fall.
  for (let k = 0; k < 2; k++) {
    const u = (time * 0.45 + k * 0.5 + seed * 0.13) % 1;
    const dx = x + w * (0.3 + 0.4 * h01(seed * 3 + k + Math.floor(time * 0.45 + k * 0.5 + seed * 0.13)));
    const dy = y + 9 + (u < 0.5 ? u * 6 : 3 + (u - 0.5) * (u - 0.5) * 4 * Math.min(60, h));
    glow(ctx, dx, dy, 6, SW.caramel, 0.4 * (1 - u));
    ctx.fillStyle = hexA(SW.caramel, 1 - u * 0.6);
    ctx.beginPath();
    ctx.arc(dx, dy, 1.6, 0, TAU);
    ctx.fill();
  }
}

// ---------- The ramparts' turrets (`islands: 'turret'`) ----------
// A gingerbread turret from the wall-walk up, iced along its top, a lit arched window, candy
// buttons down its face.
function turretPic(w, h) {
  return art(`turret|${w}|${h}`, w, h, () => {
    const out = [R(-3, h - 10, w + 6, 10, SW.gingerSh), R(0, 6, w, h - 12, SW.ginger)];
    out.push(F(R(0, 6, w * 0.16, h - 12, SW.gingerLit)), F(R(w - 6, 6, 6, h - 12, SW.gingerSh)));
    out.push(R(-4, 0, w + 8, 8, SW.ginger), F(R(-4, 0, w + 8, 3, SW.icing)));
    for (let x = 0; x <= w; x += 9) out.push(F(E(x, 9, 4.6, 3.4, SW.icing)));
    if (h > 60) {
      const wy = Math.min(26, h * 0.22);
      const ww = Math.min(22, w * 0.18);
      out.push(F(T([[w / 2 - ww / 2 - 3, wy + 34], [w / 2 - ww / 2 - 3, wy + 8], [w / 2, wy - 5], [w / 2 + ww / 2 + 3, wy + 8], [w / 2 + ww / 2 + 3, wy + 34]], SW.icing)));
      out.push(F(T([[w / 2 - ww / 2, wy + 32], [w / 2 - ww / 2, wy + 9], [w / 2, wy - 1], [w / 2 + ww / 2, wy + 9], [w / 2 + ww / 2, wy + 32]], '#ffd890')));
      out.push(F(R(w / 2 - 0.8, wy, 1.6, 32, SW.gingerSh)), F(R(w / 2 - ww / 2, wy + 18, ww, 1.6, SW.gingerSh)));
    }
    const cols = [SW.pink, SW.mint, SW.lemon, SW.lilac];
    for (let y = Math.min(70, h * 0.55), i = 0; y < h - 18; y += 16, i++) out.push(F(E(w / 2, y, 3.4, 3, cols[i % 4])), F(E(w / 2 - 1, y - 1, 1, 0.8, '#ffffff')));
    for (let x = 4; x < w - 4; x += 10) out.push(F(T([[x, h - 18], [x + 5, h - 13], [x + 10, h - 18], [x + 10, h - 16], [x + 5, h - 11], [x, h - 16]], SW.icing)));
    return out;
  });
}
export function drawTurret(ctx, x, y, w, time, seed, map, cam) {
  x = snap(x);
  y = snap(y);
  const h = Math.round(Math.max(standOn(map, x + cam.x + 6, y + cam.y), standOn(map, x + cam.x + w - 6, y + cam.y)) - (y + cam.y));
  at(ctx, turretPic(w, Math.max(16, h)), x, y);
  if (h > 60) glow(ctx, x + w / 2, y + Math.min(26, h * 0.22) + 18, 26, '#ffd890', 0.16 + 0.05 * Math.sin(time * 1.6 + seed));
}

// ---------- The crater's rock-candy stacks (`islands: 'rockpillar'`) ----------
// Big faceted chunks of rock candy stacked up out of the caramel, wider at the foot, under a crust
// of toffee you stand on, little crystals growing off its lip.
function rockChunksPic(w, h, seed) {
  return art(`rockchunks|${w}|${h}|${seed % 4}`, w, h, () => {
    const out = [];
    const rowH = 24;
    const rows = Math.max(1, Math.round((h - 10) / rowH));
    const step = (h - 10) / rows;
    for (let r = 0; r < rows; r++) {
      const y0 = 8 + r * step;
      const last = r === rows - 1;
      const cw = w * (last ? 0.82 : 0.6 - (r % 2) * 0.05);
      const n = Math.max(2, Math.round(cw / 30));
      const x0 = (w - cw) / 2;
      for (let i = 0; i < n; i++) {
        const a = x0 + (cw * i) / n - 2;
        const b = x0 + (cw * (i + 1)) / n + 2;
        const j = (k) => (h01(seed * 13 + r * 7 + i * 3 + k) - 0.5) * 5;
        const yb = last ? h : y0 + step + 4;
        const c = ROCK[(seed + r * 2 + i) % 4];
        const pts = [[a + j(1), y0 + 4 + j(2)], [a + (b - a) * 0.45, y0 + j(3)], [b + j(4), y0 + 5 + j(5)], [b + 2, (y0 + yb) / 2], [b + j(6), yb], [a + j(7), yb], [a - 2, (y0 + yb) / 2 + j(8)]];
        out.push(T(pts, c[0]));
        out.push(F(T([pts[0], pts[1], [a + (b - a) * 0.4, (y0 + yb) / 2], pts[6]], c[1])));
        out.push(F(T([pts[2], pts[3], pts[4], [a + (b - a) * 0.62, yb], [a + (b - a) * 0.6, (y0 + yb) / 2 + 3]], c[2])));
        out.push(F(E(a + (b - a) * 0.3, y0 + 7, 2, 1.2, '#ffffff')));
      }
    }
    // The toffee crust on top, little crystals growing off its lip.
    out.push(R(-4, 0, w + 8, 10, SW.caramelSh), F(R(-4, 0, w + 8, 2.6, SW.caramelLit)), F(R(-4, 7.6, w + 8, 2.4, SW.chocSh)));
    for (let x = 6, i = 0; x < w - 4; x += 16, i++) {
      const c = ROCK[(seed + i) % 4];
      const d = 4 + ((i * 7) % 3) * 2;
      out.push(T([[x - 3, 10], [x + 3, 10], [x, 10 + d]], c[0]));
    }
    return out;
  });
}
export function drawRockPillar(ctx, x, y, w, time, seed, map, cam) {
  x = snap(x);
  y = snap(y);
  const h = Math.round(standOn(map, x + cam.x + w / 2, y + cam.y) - (y + cam.y));
  glow(ctx, x + w / 2, y + h * 0.5, Math.max(40, w * 0.6), ROCK[seed % 4][1], 0.14 + 0.05 * Math.sin(time * 1.3 + seed));
  at(ctx, rockChunksPic(w, Math.max(30, h + 2), seed), x, y);
  // Light catching a facet now and then.
  const u = (time * 0.6 + seed * 0.37) % 1;
  const k = Math.floor(time * 0.6 + seed * 0.37);
  glow(ctx, x + w * (0.25 + 0.5 * h01(k + seed)), y + 14 + (h - 20) * h01(k * 3 + seed), 6, '#ffffff', 0.7 * Math.sin(u * Math.PI));
}

// ---------- Landmarks ----------
// A candy-cane arch over the volcano's door: two canes whose hooks curl in to meet under a pink bow,
// gumdrops along them.
function canePath(x0, y0, top, curl, dir) {
  const pts = [];
  for (let y = y0; y > top + curl; y -= 8) pts.push([x0, y]);
  for (let a = 0; a <= Math.PI; a += Math.PI / 10) pts.push([x0 + dir * (curl - Math.cos(a) * curl), top + curl - Math.sin(a) * curl]);
  return pts;
}
function sugarArchPic() {
  return art('sugararch', 150, 168, () => {
    const out = [];
    for (const [x0, dir] of [[14, 1], [136, -1]]) {
      const path = canePath(x0, 168, 8, 30, dir);
      out.push(...bd(path, () => 10, '#fff8f8'), ...stripes(path, 3, [SW.red, '#fff8f8']));
    }
    out.push(T([[75, 12], [56, 2], [56, 24]], SW.pink), T([[75, 12], [94, 2], [94, 24]], SW.pink), F(T([[75, 12], [60, 6], [60, 12]], SW.pinkLit)), E(75, 12, 5, 5, SW.pinkSh));
    out.push(F(T([[72, 15], [66, 30], [71, 28]], SW.pink)), F(T([[78, 15], [84, 30], [79, 28]], SW.pink)));
    const cols = [SW.mint, SW.lemon, SW.lilac, SW.pink];
    for (let i = 0; i < 5; i++) {
      const y = 62 + i * 22;
      for (const x of [14, 136]) out.push(E(x, y, 4.6, 4, cols[(i + (x > 75 ? 2 : 0)) % 4]), F(E(x - 1.6, y - 1.6, 1.4, 1, '#ffffff')));
    }
    return out;
  });
}
function lolliPic(seed, h, air = null, r = 20) {
  air = air && qair(air);
  const cols = [[SW.pink, '#ffffff'], [SW.mint, '#ffffff'], [SW.lemon, SW.pink]][seed % 3].map((c) => (air ? mix(c, air, 0.3) : c));
  return art(`lolli|${seed % 3}|${h}|${air}|${r}`, r * 2 + 10, h, () => {
    const cx = r + 5;
    const out = [R(cx - 2, r * 2 - 6, 4, h - r * 2 + 6, air ? mix('#fff6ea', air, 0.3) : '#fff6ea'), E(cx, r, r, r, cols[0])];
    const path = [];
    for (let s = 0; s <= 1.001; s += 0.03) {
      const a = s * TAU * 2.3;
      const rr = 1.5 + s * (r - 4);
      path.push([cx + Math.cos(a) * rr, r + Math.sin(a) * rr]);
    }
    out.push(...bd(path, () => r * 0.18, cols[1]).map(F), F(E(cx - r * 0.35, r * 0.55, r * 0.25, r * 0.15, '#ffffff')));
    return out;
  });
}
function oneDrop(out, x, w, h, c) {
  const cl = mix(c, '#ffffff', 0.45);
  out.push(T([[x - w / 2, 0], [x - w / 2, -h * 0.35], [x - w * 0.36, -h * 0.78], [x - w * 0.16, -h], [x + w * 0.16, -h], [x + w * 0.36, -h * 0.78], [x + w / 2, -h * 0.35], [x + w / 2, 0]].map(([a, b]) => [a, b + 34]), c));
  out.push(F(E(x - w * 0.2, 34 - h * 0.72, w * 0.14, h * 0.1, '#ffffff')));
  for (let k = 0; k < 6; k++) out.push(F(E(x - w * 0.35 + h01(k + x) * w * 0.7, 34 - h * 0.1 - h01(k * 3 + x) * h * 0.7, 0.9, 0.9, cl)));
}
function gumdropPic(seed) {
  const cols = [SW.pink, SW.mint, SW.lemon, SW.lilac, '#ffb08a'];
  return art(`gumdrop|${seed % 5}`, 56, 34, () => {
    const out = [];
    oneDrop(out, 18, 26, 26, cols[seed % 5]);
    oneDrop(out, 40, 22, 20, cols[(seed + 2) % 5]);
    oneDrop(out, 29, 18, 14, cols[(seed + 4) % 5]);
    return out;
  });
}
export const SUGAR_KINDS = {
  sugararch: { w: 150 + M * 2, h: 168 + M, draw: (ctx, x, y) => place(ctx, sugarArchPic(), x, y) },
  lollipop: { w: 50 + M * 2, h: 110 + M, draw: (ctx, x, y) => place(ctx, lolliPic(Math.round(x / 97) & 7, 110), x, y) },
  gumdrop: { w: 56 + M * 2, h: 34 + M, draw: (ctx, x, y) => place(ctx, gumdropPic(Math.abs(Math.round(x / 53))), x, y) },
};

// ---------- Painted backdrops ----------
// A puff of candy floss.
function puff(ctx, x, y, r, c, a) {
  if (a <= 0.01) return;
  ctx.globalAlpha = a;
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.arc(x - r * 0.7, y + r * 0.25, r * 0.7, 0, TAU);
  ctx.arc(x + r * 0.75, y + r * 0.3, r * 0.65, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}
// Candy floss rising off the crater in slow puffs, drifting with the wind.
function plume(ctx, x, y, size, rise, time, air, wash) {
  for (let j = 0; j < 8; j++) {
    const u = (time * 0.035 + j / 8) % 1;
    const px = x + Math.sin(u * 3 + j) * size * 0.15 + u * size * 0.9;
    const py = y - u * rise;
    const r = size * (0.12 + u * 0.32);
    const a = Math.min(1, u * 5) * (1 - u) * 0.85;
    puff(ctx, px, py, r, mix(j % 2 ? SW.pinkLit : SW.frost, air, wash * 0.6), a);
  }
}
// The Candy Volcano: a chocolate cone, its top frosted and dripping, caramel glowing in its crater
// and running down one flank, candy floss rising.
function volcano(ctx, cx, base, w, h, air, wash, time) {
  const C = (c) => mix(c, air, wash);
  const top = base - h;
  const tw = w * 0.12;
  const cone = () => {
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, base);
    ctx.quadraticCurveTo(cx - w * 0.2, base - h * 0.6, cx - tw, top);
    ctx.lineTo(cx + tw, top);
    ctx.quadraticCurveTo(cx + w * 0.2, base - h * 0.6, cx + w / 2, base);
    ctx.closePath();
  };
  glow(ctx, cx, top, w * 0.4, SW.caramel, 0.18 * (1 - wash * 0.5));
  ctx.fillStyle = C(SW.choc);
  cone();
  ctx.fill();
  ctx.save();
  cone();
  ctx.clip();
  // Its lit flank.
  ctx.fillStyle = C(SW.chocLit);
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, base);
  ctx.quadraticCurveTo(cx - w * 0.2, base - h * 0.6, cx - tw, top);
  ctx.lineTo(cx - tw * 0.1, top);
  ctx.quadraticCurveTo(cx - w * 0.09, base - h * 0.5, cx - w * 0.16, base);
  ctx.fill();
  // A caramel rivulet down its shaded flank.
  const riv = () => {
    ctx.beginPath();
    ctx.moveTo(cx + tw * 0.5, top);
    for (let s = 0; s <= 0.701; s += 0.1) ctx.lineTo(cx + tw * 0.5 + s * w * 0.16 + Math.sin(s * 9) * w * 0.012, top + s * h * 0.8);
  };
  ctx.lineCap = 'round';
  ctx.strokeStyle = hexA(SW.caramel, 0.3);
  ctx.lineWidth = Math.max(4, w * 0.014);
  riv();
  ctx.stroke();
  ctx.strokeStyle = C(SW.caramelLit);
  ctx.lineWidth = Math.max(1.2, w * 0.004);
  riv();
  ctx.stroke();
  ctx.lineCap = 'butt';
  glow(ctx, cx + w * 0.1, top + h * 0.4, w * 0.08, SW.caramel, 0.18);
  // The frosting cap, dripping.
  const capY = top + h * 0.3;
  ctx.fillStyle = C(SW.frost);
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, top - 10);
  for (let x = cx - w / 2; x <= cx + w / 2; x += 3) {
    const q = (x - cx) / w;
    let d = Math.sin(q * 30) * h * 0.02;
    for (let k = -6; k <= 6; k++) {
      const len = h * (0.04 + h01(k + 40) * 0.1);
      const dx = (x - (cx + k * w * 0.075)) / (w * 0.012);
      d += len * Math.exp(-dx * dx);
    }
    ctx.lineTo(x, capY + d);
  }
  ctx.lineTo(cx + w / 2, top - 10);
  ctx.fill();
  ctx.fillStyle = C('#ffffff');
  ctx.fillRect(cx - tw * 0.8, top + 2, tw * 0.6, h * 0.08);
  // Sprinkles on the frosting.
  for (let k = 0; k < 14; k++) {
    const sx = cx + (h01(k) - 0.5) * w * 0.4;
    const sy = top + 4 + h01(k + 9) * h * 0.22;
    ctx.fillStyle = C([SW.pink, SW.mint, SW.lemon, SW.lilac][k % 4]);
    ctx.fillRect(sx, sy, Math.max(2, w * 0.006), Math.max(1, w * 0.003));
  }
  ctx.restore();
  ctx.fillStyle = C(SW.caramel);
  ctx.fillRect(cx - tw, top - 2, tw * 2, 4);
  ctx.fillStyle = C(SW.caramelLit);
  ctx.fillRect(cx - tw * 0.7, top - 2, tw * 1.4, 1.5);
  plume(ctx, cx, top - 6, w * 0.2, h * 1.1, time, air, wash);
}
// Gumdrop hills: a row of round domes in sugar colours on a band of land, sugar glinting on them.
function domes(ctx, cam, width, height, base, k, span, rMin, rMax, cols, seed, air, wash) {
  const off = cam.x * k;
  const land = mix(cols[0], air, wash + 0.08);
  for (let i = -1; i < Math.ceil(width / span) + 2; i++) {
    const si = i + Math.floor(off / span);
    const cx = snap(i * span - wrap(off, span) + h01(si + seed) * span * 0.5);
    const r = rMin + h01(si * 3 + seed) * (rMax - rMin);
    const c = cols[((si % cols.length) + cols.length) % cols.length];
    ctx.fillStyle = mix(c, air, wash);
    ctx.beginPath();
    ctx.ellipse(cx, base + 4, r, r * 0.78, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = mix('#ffffff', air, wash + 0.1);
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.38, base + 4 - r * 0.5, r * 0.2, r * 0.12, -0.5, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = land;
  ctx.fillRect(0, base + 2, width, height - base);
}
function footHaze(ctx, air, width, y, a) {
  const g = ctx.createLinearGradient(0, y - 40, 0, y + 10);
  g.addColorStop(0, hexA(air, 0));
  g.addColorStop(1, hexA(air, a));
  ctx.fillStyle = g;
  ctx.fillRect(0, y - 40, width, 50);
}
const sx = (cam, width, wx, k) => width / 2 - (cam.x + width / 2 - wx) * k;

// The Gumdrop Valley and the Sugar Trail: the volcano on the skyline, smoking candy floss, over rows
// of gumdrop hills, lollipop trees standing on the nearest.
export function drawPaintedGumdropVale(ctx, t, cam, width, height, time, layerY, air, map) {
  const mw = map?.width ?? 1600;
  const vBase = layerY(80, 0.04);
  volcano(ctx, sx(cam, width, mw * 0.7, 0.05), vBase, 340, 175, air, 0.42, time);
  footHaze(ctx, air, width, vBase, 0.5);
  const b1 = layerY(46, 0.07);
  domes(ctx, cam, width, height, b1, 0.07, 130, 50, 90, [SW.lilac, SW.mint, SW.pinkLit, SW.lemon], 3, air, 0.45);
  footHaze(ctx, air, width, b1, 0.35);
  const b2 = layerY(8, 0.15);
  domes(ctx, cam, width, height, b2, 0.15, 210, 80, 130, [SW.pink, SW.mint, '#ffc890', SW.lilac], 11, air, 0.24);
  // Lollipop trees on the near hills.
  const off = cam.x * 0.15;
  const span = 260;
  for (let i = -1; i < Math.ceil(width / span) + 2; i++) {
    const si = i + Math.floor(off / span);
    if (h01(si * 7 + 2) < 0.35) continue;
    const x = snap(i * span - wrap(off, span) + 60 + h01(si + 5) * 120);
    const h = 46 + Math.round(h01(si * 5) * 3) * 8;
    blit(ctx, lolliPic(si & 7, h, air, 12), snap(x - 17 - M), snap(b2 - h + 14 - M));
  }
  footHaze(ctx, air, width, b2 + 20, 0.25);
}

// The Licorice Mine: layered chocolate rock, licorice timbers bracing it, gumdrop lamps on their
// lintels, the caramel's glow coming up from below.
function frameW(air) {
  air = qair(air);
  return art(`mineframe|${air}`, 200, 300, () => {
    const C = (c) => mix(mix(c, '#1a0e12', 0.35), air, 0.3);
    const out = [];
    for (const px of [10, 190]) out.push(R(px - 8, 0, 16, 300, C(SW.lic)), F(R(px - 5, 0, 1.6, 300, C(SW.licLit))));
    out.push(R(-6, 0, 212, 16, C(SW.lic)), F(R(-6, 0, 212, 2, C(SW.licLit))));
    for (const [a, b] of [[[10, 46], [36, 16]], [[190, 46], [164, 16]]]) out.push(...bd([a, b], () => 6, C(SW.redSh)));
    return out;
  });
}
export function drawPaintedLicoriceMine(ctx, t, cam, width, height, time, layerY, air, map) {
  const base = layerY(0, 0.2);
  // Strata, dark and milk chocolate in wavy layers.
  const bands = [SW.chocDeep, SW.chocSh, SW.choc, SW.chocSh, '#7e5040', SW.chocSh, SW.chocDeep];
  const off = cam.x * 0.2;
  for (let i = 0; i < bands.length; i++) {
    const y0 = base - 330 + i * 58;
    ctx.fillStyle = mix(bands[i], air, 0.3);
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width + 8; x += 8) {
      const q = x + off;
      ctx.lineTo(x, y0 + Math.sin(q * 0.011 + i * 1.7) * 10 + Math.sin(q * 0.031 + i) * 4);
    }
    ctx.lineTo(width, height);
    ctx.fill();
  }
  // Chips of sugar crystal glinting in the rock.
  for (let k = 0; k < 18; k++) {
    const x = wrap(h01(k) * 1400 - off, 1400) - 200;
    const y = base - 300 + h01(k + 30) * 280;
    glow(ctx, x, y, 6, ROCK[k % 4][1], 0.25 + 0.2 * Math.sin(time * 1.5 + k));
  }
  // Licorice timbers, a gumdrop lamp swinging from each.
  const kf = 0.45;
  const offF = cam.x * kf;
  const span = 340;
  const fb = layerY(0, kf);
  for (let i = -1; i < Math.ceil(width / span) + 2; i++) {
    const si = i + Math.floor(offF / span);
    const x = snap(i * span - wrap(offF, span));
    blit(ctx, frameW(air), snap(x - M), snap(fb - 300 - M));
    const lx = x + 100;
    const a = Math.sin(time * 1.1 + si) * 0.1;
    const ly = fb - 300 + 18;
    const ex = lx + Math.sin(a) * 26;
    const ey = ly + Math.cos(a) * 26;
    ctx.strokeStyle = mix(SW.licLit, air, 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    const c = [SW.pink, SW.mint, SW.lemon, SW.lilac][((si % 4) + 4) % 4];
    glow(ctx, ex, ey + 6, 40, c, 0.3);
    ctx.fillStyle = mix(c, '#ffffff', 0.25);
    ctx.beginPath();
    ctx.moveTo(ex - 7, ey + 12);
    ctx.quadraticCurveTo(ex - 7, ey, ex, ey);
    ctx.quadraticCurveTo(ex + 7, ey, ex + 7, ey + 12);
    ctx.fill();
  }
  // The caramel's warmth from below.
  const g = ctx.createLinearGradient(0, height * 0.45, 0, height);
  g.addColorStop(0, hexA(SW.caramel, 0));
  g.addColorStop(1, hexA(SW.caramel, 0.22));
  ctx.fillStyle = g;
  ctx.fillRect(0, height * 0.45, width, height * 0.55);
}

// The Candy Kitchen: pink tiles over a candy-striped wainscot, two brick ovens glowing, shelves of
// sweet jars, copper pans on a rail, and a round window with the volcano smoking outside.
function ovenPic(air) {
  air = qair(air);
  return art(`oven|${air}`, 140, 140, () => {
    const C = (c) => mix(c, air, 0.22);
    const out = [R(36, 0, 22, 44, C(SW.copperSh)), F(R(39, 0, 5, 44, C(SW.copper)))];
    out.push(E(70, 64, 67, 42, C(SW.brick)), R(3, 64, 134, 76, C(SW.brick)));
    for (let y = 50, r = 0; y < 140; y += 10, r++) {
      out.push(F(R(6, y, 128, 1.2, C(SW.brickSh))));
      for (let x = r % 2 ? 14 : 28; x < 134; x += 26) out.push(F(R(x, y - 9, 1.2, 9, C(SW.brickSh))));
    }
    out.push(F(T([[34, 137], [34, 86], [70, 64], [106, 86], [106, 137]], C(SW.frost))));
    out.push(R(24, 132, 92, 8, C(SW.chocSh)));
    return out;
  });
}
// A fire seen through an arched mouth: hot at the floor, dimming up into the arch, flames licking.
function fireMouth(ctx, x, floor, hw, top, time, seed) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - hw, floor);
  ctx.lineTo(x - hw, top + hw * 0.6);
  ctx.quadraticCurveTo(x - hw, top, x, top);
  ctx.quadraticCurveTo(x + hw, top, x + hw, top + hw * 0.6);
  ctx.lineTo(x + hw, floor);
  ctx.closePath();
  ctx.clip();
  const g = ctx.createLinearGradient(0, top, 0, floor);
  g.addColorStop(0, '#5a1e16');
  g.addColorStop(0.55, '#c8502a');
  g.addColorStop(1, '#ffb050');
  ctx.fillStyle = g;
  ctx.fillRect(x - hw, top, hw * 2, floor - top);
  for (let i = 0; i < 5; i++) {
    const fx = x - hw * 0.8 + (i * hw * 1.6) / 4;
    const fh = (floor - top) * (0.35 + 0.18 * Math.sin(time * 4.2 + i * 1.9 + seed) + 0.1 * Math.sin(time * 9.1 + i));
    ctx.fillStyle = i % 2 ? '#ffd890' : '#ff9a4a';
    ctx.beginPath();
    ctx.moveTo(fx - hw * 0.28, floor);
    ctx.quadraticCurveTo(fx - hw * 0.2, floor - fh * 0.5, fx + Math.sin(time * 3 + i) * 3, floor - fh);
    ctx.quadraticCurveTo(fx + hw * 0.2, floor - fh * 0.5, fx + hw * 0.28, floor);
    ctx.fill();
  }
  ctx.restore();
}
function jarShelfPic(air) {
  air = qair(air);
  return art(`jars|${air}`, 160, 60, () => {
    const C = (c) => mix(c, air, 0.22);
    const out = [];
    const cols = [SW.pink, SW.lemon, SW.mint, SW.lilac, SW.red];
    for (let i = 0; i < 5; i++) {
      const x = 8 + i * 30;
      const h = 32 + (i % 2) * 8;
      out.push(R(x, 52 - h, 22, h, C(SW.glass)), F(R(x + 2, 52 - h + 8, 18, h - 10, C(cols[i]))), F(R(x + 3, 52 - h + 2, 3, h - 4, '#ffffff')), R(x - 1, 52 - h - 5, 24, 6, C(cols[(i + 2) % 5])));
      for (let k = 0; k < 4; k++) out.push(F(E(x + 6 + (k % 2) * 9, 52 - h + 14 + k * 5, 2.4, 2.2, C(cols[(i + k + 1) % 5]))));
    }
    out.push(R(-2, 52, 164, 6, C(SW.wood)), F(R(-2, 52, 164, 1.4, C(SW.woodLit))), F(T([[10, 58], [22, 58], [10, 70]], C(SW.woodSh))), F(T([[150, 58], [138, 58], [150, 70]], C(SW.woodSh))));
    return out;
  });
}
export function drawPaintedCandyKitchen(ctx, t, cam, width, height, time, layerY, air, map) {
  const mw = map?.width ?? 1600;
  const k = 0.3;
  const base = layerY(0, k);
  const off = cam.x * k;
  // Tiles: a soft pink checker.
  ctx.fillStyle = mix('#ffe6ee', air, 0.15);
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = mix('#ffd2e0', air, 0.15);
  const ts = 22;
  const tx0 = -wrap(off, ts * 2);
  for (let y = base - 96, r = 0; y > -ts; y -= ts, r++) for (let x = tx0 + (r % 2) * ts; x < width; x += ts * 2) ctx.fillRect(snap(x), snap(y - ts), ts, ts);
  // The wainscot: candy stripes under a wooden rail.
  ctx.fillStyle = mix(SW.frost, air, 0.15);
  ctx.fillRect(0, base - 96, width, 96 + height);
  ctx.fillStyle = mix(SW.pinkLit, air, 0.15);
  for (let x = -wrap(off, 28); x < width; x += 28) ctx.fillRect(snap(x), base - 92, 12, 92 + height);
  ctx.fillStyle = mix(SW.wood, air, 0.15);
  ctx.fillRect(0, base - 100, width, 7);
  // The round window, the volcano outside.
  const wx = sx(cam, width, mw / 2, k);
  const wy = base - 250;
  ctx.save();
  ctx.beginPath();
  ctx.arc(wx, wy, 46, 0, TAU);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, wy - 46, 0, wy + 46);
  sky.addColorStop(0, '#ff9ab8');
  sky.addColorStop(1, '#fff0c8');
  ctx.fillStyle = sky;
  ctx.fillRect(wx - 50, wy - 50, 100, 100);
  volcano(ctx, wx + 6, wy + 50, 110, 60, '#ffc8a0', 0.25, time);
  ctx.restore();
  ctx.strokeStyle = mix(SW.wood, air, 0.15);
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(wx, wy, 47, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(wx - 46, wy);
  ctx.lineTo(wx + 46, wy);
  ctx.moveTo(wx, wy - 46);
  ctx.lineTo(wx, wy + 46);
  ctx.stroke();
  // Ovens at either end, their mouths glowing.
  for (const ox of [mw * 0.1, mw * 0.9]) {
    const x = sx(cam, width, ox, k);
    if (x < -100 || x > width + 100) continue;
    blit(ctx, ovenPic(air), snap(x - 70 - M), snap(base - 140 - M));
    fireMouth(ctx, x, base - 6, 30, base - 70, time, ox);
    glow(ctx, x, base - 30, 70, SW.caramel, 0.22 + 0.05 * Math.sin(time * 6 + ox));
  }
  // Shelves of sweet jars either side of the window, copper pans on a rail over them.
  for (const jx of [mw * 0.26, mw * 0.74]) {
    const x = sx(cam, width, jx, k);
    if (x < -100 || x > width + 100) continue;
    blit(ctx, jarShelfPic(air), snap(x - 80 - M), snap(base - 214 - M));
    ctx.fillStyle = mix(SW.copperSh, air, 0.2);
    ctx.fillRect(snap(x - 60), base - 300, 120, 3);
    for (const [dx, r] of [[-44, 10], [-14, 13], [16, 9], [44, 11]]) blit(ctx, panPic(r), snap(x + dx - r - 3 - M), snap(base - 300 - M));
  }
}

// The Caramel Forge: toffee-brick walls round a great furnace pouring caramel into a trough,
// bellows breathing beside it, copper moulds swinging on chains.
function furnacePic(air) {
  air = qair(air);
  return art(`furnace|${air}`, 320, 300, () => {
    const C = (c) => mix(c, air, 0.2);
    const out = [T([[60, 0], [260, 0], [300, 90], [20, 90]], C(SW.ironSh)), F(T([[70, 4], [120, 4], [80, 86], [30, 86]], C(SW.iron)))];
    out.push(R(0, 90, 320, 210, C(SW.brick)));
    for (let y = 100, r = 0; y < 300; y += 14, r++) {
      out.push(F(R(2, y, 316, 1.6, C(SW.brickSh))));
      for (let x = r % 2 ? 14 : 34; x < 316; x += 40) out.push(F(R(x, y - 13, 1.6, 13, C(SW.brickSh))));
    }
    out.push(F(T([[70, 300], [70, 190], [160, 130], [250, 190], [250, 300]], C(SW.brickSh))));
    out.push(R(-4, 86, 328, 8, C(SW.copperSh)), F(R(-4, 86, 328, 2, C(SW.copperLit))));
    // The spout over the trough, and the trough.
    out.push(R(258, 150, 48, 12, C(SW.copper)), F(R(258, 150, 48, 3, C(SW.copperLit))), R(270, 270, 70, 30, C(SW.iron)), F(R(270, 270, 70, 4, C(SW.ironLit))));
    return out;
  });
}
function mouldPic(kind) {
  return art(`mould|${kind}`, 34, 34, () => {
    if (kind === 0) return [T([[17, 32], [2, 14], [4, 5], [11, 2], [17, 8], [23, 2], [30, 5], [32, 14]], SW.copper), F(T([[17, 26], [7, 14], [9, 9], [13, 8], [17, 12], [21, 8], [25, 9], [27, 14]], SW.copperSh)), F(E(9, 7, 2.4, 1.6, SW.copperLit))];
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? 7 : 16;
      pts.push([17 + Math.cos(a) * r, 17 + Math.sin(a) * r]);
    }
    return [T(pts, SW.copper), F(T(pts.map(([x, y]) => [17 + (x - 17) * 0.6, 17 + (y - 17) * 0.6]), SW.copperSh)), F(E(13, 9, 2, 1.4, SW.copperLit))];
  });
}
function toolRackPic(air) {
  air = qair(air);
  return art(`tools|${air}`, 100, 120, () => {
    const C = (c) => mix(c, air, 0.2);
    const out = [R(0, 0, 100, 12, C(SW.wood)), F(R(0, 0, 100, 2.4, C(SW.woodLit))), F(E(8, 6, 2, 2, C(SW.ironSh))), F(E(92, 6, 2, 2, C(SW.ironSh)))];
    // Tongs: two candy-cane arms.
    for (const dx of [-3, 3]) {
      const path = [[18, 12], [18 + dx, 60], [18 + dx * 2.4, 96]];
      out.push(...bd(path, () => 4, C('#fff8f8')), ...stripes([[18, 12], [18 + dx * 0.5, 24], [18 + dx, 36], [18 + dx * 1.3, 48], [18 + dx * 1.6, 60], [18 + dx * 2, 78], [18 + dx * 2.4, 96]], 1.6, [C(SW.red), C('#fff8f8')]));
    }
    // A hammer with a caramel head.
    out.push(R(46, 12, 5, 80, C(SW.wood)), F(R(47, 12, 1.4, 80, C(SW.woodLit))), R(36, 84, 26, 16, C(SW.caramelSh)), F(R(36, 84, 26, 4, C(SW.caramelLit))));
    // A ladle.
    out.push(R(76, 12, 4, 70, C(SW.copperSh)), E(78, 92, 13, 10, C(SW.copper)), F(E(78, 90, 9, 5, C(SW.caramel))), F(E(73, 88, 3, 1.6, C(SW.caramelLit))));
    return out;
  });
}
export function drawPaintedCaramelForge(ctx, t, cam, width, height, time, layerY, air, map) {
  const mw = map?.width ?? 1600;
  const k = 0.3;
  const base = layerY(0, k);
  const off = cam.x * k;
  // Toffee bricks in courses.
  ctx.fillStyle = mix('#8a4a2e', air, 0.25);
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = mix('#6a3420', air, 0.25);
  for (let y = base, r = 0; y > -20; y -= 18, r++) {
    ctx.fillRect(0, Math.round(y), width, 2);
    for (let x = -wrap(off + (r % 2) * 22, 44); x < width; x += 44) ctx.fillRect(snap(x), snap(y - 18), 2, 18);
  }
  // Caramel glow over everything near the furnace.
  const fx = sx(cam, width, mw / 2, k);
  glow(ctx, fx, base - 60, 360, SW.caramel, 0.2);
  // Moulds swinging on chains.
  for (const [mx, kind, len] of [[mw * 0.3, 0, 90], [mw * 0.36, 1, 60], [mw * 0.64, 1, 80], [mw * 0.7, 0, 56]]) {
    const x = sx(cam, width, mx, k);
    if (x < -40 || x > width + 40) continue;
    const a = Math.sin(time * 0.9 + mx) * 0.06;
    const ex = x + Math.sin(a) * len;
    const ey = base - 330 + Math.cos(a) * len;
    ctx.strokeStyle = mix(SW.ironSh, air, 0.2);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, base - 340);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    const s = mouldPic(kind);
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(a);
    blit(ctx, s, snap(-s.w / 2), snap(-M));
    ctx.restore();
  }
  // The furnace, its mouth roaring, caramel pouring from its spout.
  blit(ctx, furnacePic(air), snap(fx - 160 - M), snap(base - 300 - M));
  fireMouth(ctx, fx, base, 78, base - 156, time, 0);
  const f = 0.55 + 0.12 * Math.sin(time * 5) + 0.08 * Math.sin(time * 11.3);
  glow(ctx, fx, base - 60, 140, SW.caramel, 0.3 * f);
  for (let j = 0; j < 5; j++) {
    const u = (time * 0.6 + j / 5) % 1;
    const ex = fx - 50 + h01(j + Math.floor(time * 0.6 + j / 5) * 5) * 100;
    glow(ctx, ex, base - 40 - u * 120, 5, '#fff0a0', 0.8 * (1 - u));
  }
  // Caramel pouring from the spout into a stone basin, glowing, with a splash where it lands.
  const spx = fx + 140;
  const top = base - 140;
  const bot = base - 30;
  ctx.fillStyle = SW.caramel;
  ctx.beginPath();
  ctx.moveTo(spx - 3, top);
  for (let y = top; y <= bot; y += 6) ctx.lineTo(spx - 3 - (y - top) * 0.02 + Math.sin(time * 6 + y * 0.2) * 0.8, y);
  for (let y = bot; y >= top; y -= 6) ctx.lineTo(spx + 3 + (y - top) * 0.02 + Math.sin(time * 6 + y * 0.2 + 1) * 0.8, y);
  ctx.fill();
  ctx.fillStyle = SW.caramelLit;
  for (let y = (time * 70) % 18; y < bot - top; y += 18) ctx.fillRect(spx - 1, top + y, 2, 7);
  glow(ctx, spx, bot, 46, SW.caramel, 0.4);
  ctx.fillStyle = mix(SW.iron, air, 0.2);
  ctx.fillRect(spx - 40, bot - 2, 80, 32);
  ctx.fillStyle = mix(SW.ironLit, air, 0.2);
  ctx.fillRect(spx - 42, bot - 4, 84, 4);
  ctx.fillStyle = SW.caramel;
  ctx.fillRect(spx - 36, bot, 72, 4);
  for (let j = 0; j < 3; j++) {
    const u = (time * 1.6 + j / 3) % 1;
    ctx.fillStyle = hexA(SW.caramelLit, 1 - u);
    ctx.beginPath();
    ctx.arc(spx + (j - 1) * 6 * u * 2, bot - Math.sin(u * Math.PI) * 9, 1.6, 0, TAU);
    ctx.fill();
  }
  // A rack of the smith's tools beside the furnace, swaying a touch in its heat.
  const rx = fx - 232;
  if (rx > -80 && rx < width + 80) blit(ctx, toolRackPic(air), snap(rx - 50 - M), snap(base - 190 - M));
}

// The Gingerbread Ramparts: the cone close behind, frosted and smoking, the wall running on into
// the distance with its striped turrets, the valley's gumdrops far below.
function farTowerPic(air) {
  air = qair(air);
  return art(`fartower|${air}`, 60, 170, () => {
    const C = (c) => mix(c, air, 0.4);
    const out = [R(6, 60, 48, 110, C(SW.ginger)), F(R(6, 60, 8, 110, C(SW.gingerLit))), R(2, 56, 56, 8, C(SW.icing))];
    out.push(T([[0, 60], [30, 0], [60, 60]], C(SW.frost)));
    for (let i = 0; i < 4; i++) out.push(F(T([[6 + i * 13, 60], [30, 4 + i * 2], [12 + i * 13, 60]], C(SW.pink))));
    out.push(F(T([[24, 100], [24, 84], [30, 78], [36, 84], [36, 100]], C('#ffd890'))));
    return out;
  });
}
export function drawPaintedGingerWall(ctx, t, cam, width, height, time, layerY, air, map) {
  const mw = map?.width ?? 2000;
  const vb = layerY(60, 0.05);
  volcano(ctx, sx(cam, width, mw * 0.62, 0.07), vb, 640, 220, air, 0.3, time);
  footHaze(ctx, air, width, vb, 0.45);
  const b1 = layerY(30, 0.09);
  domes(ctx, cam, width, height, b1, 0.09, 110, 34, 60, [SW.mint, SW.pinkLit, SW.lemon, SW.lilac], 5, air, 0.5);
  footHaze(ctx, air, width, b1, 0.3);
  // The wall running on behind, turrets along it.
  const k = 0.16;
  const b2 = layerY(6, k);
  ctx.fillStyle = mix(SW.ginger, air, 0.42);
  ctx.fillRect(0, b2 - 60, width, height);
  ctx.fillStyle = mix(SW.icing, air, 0.4);
  ctx.fillRect(0, b2 - 64, width, 6);
  const off = cam.x * k;
  for (let x = -wrap(off, 20); x < width; x += 20) {
    ctx.beginPath();
    ctx.arc(x + 10, b2 - 58, 5, 0, Math.PI);
    ctx.fill();
  }
  const span = 300;
  for (let i = -1; i < Math.ceil(width / span) + 2; i++) {
    const x = snap(i * span - wrap(off, span) + 120);
    blit(ctx, farTowerPic(air), snap(x - 30 - M), snap(b2 - 170 - M));
  }
}

// The Crater: its frosted rim all round, a caramel lake glowing at its heart with rock-candy spires
// standing in it, candy floss rising off the middle.
export function drawPaintedCrater(ctx, t, cam, width, height, time, layerY, air, map) {
  const mw = map?.width ?? 1700;
  // The far rim: a jagged chocolate ridge, snowed with frosting.
  const rb = layerY(150, 0.05);
  const off = cam.x * 0.05;
  const ridgeY = (x) => rb - 40 - Math.abs(Math.sin((x + off) * 0.006)) * 46 - Math.sin((x + off) * 0.021 + 1) * 10;
  ctx.fillStyle = mix(SW.choc, air, 0.45);
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width + 6; x += 6) ctx.lineTo(x, ridgeY(x));
  ctx.lineTo(width, height);
  ctx.fill();
  ctx.fillStyle = mix(SW.frost, air, 0.35);
  ctx.beginPath();
  ctx.moveTo(0, ridgeY(0));
  for (let x = 0; x <= width + 6; x += 6) ctx.lineTo(x, ridgeY(x));
  for (let x = width + 6; x >= 0; x -= 6) {
    const q = x + off;
    ctx.lineTo(x, ridgeY(x) + 8 + Math.max(0, Math.sin(q * 0.09) * 9) + Math.max(0, Math.sin(q * 0.23 + 2) * 6));
  }
  ctx.fill();
  plume(ctx, sx(cam, width, mw / 2, 0.06), rb - 50, 260, 300, time, air, 0.25);
  // The caramel lake, glowing, rippling, bubbling.
  const k = 0.12;
  const lk = layerY(70, k);
  const g = ctx.createLinearGradient(0, lk - 20, 0, lk + 120);
  g.addColorStop(0, mix(SW.caramelLit, air, 0.15));
  g.addColorStop(0.3, mix(SW.caramel, air, 0.1));
  g.addColorStop(1, mix(SW.caramelSh, air, 0.1));
  ctx.fillStyle = g;
  ctx.fillRect(0, lk, width, height - lk);
  glow(ctx, sx(cam, width, mw / 2, k), lk + 20, 340, SW.caramelLit, 0.3);
  ctx.fillStyle = hexA('#fff0c0', 0.45);
  const offL = cam.x * k;
  for (let r = 0; r < 4; r++) {
    const y = lk + 8 + r * 16;
    for (let x = -wrap(offL * (1 + r * 0.2) + time * (8 + r * 3), 90) - 90; x < width; x += 90) ctx.fillRect(snap(x + r * 23), snap(y + Math.sin(time + x * 0.01) * 1.5), 26 - r * 4, 1.4);
  }
  for (let j = 0; j < 6; j++) {
    const u = (time * 0.5 + j / 6) % 1;
    const n = Math.floor(time * 0.5 + j / 6);
    const bxx = h01(j * 13 + n) * width;
    ctx.strokeStyle = hexA('#fff0c0', 0.8 * (1 - u));
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bxx, lk + 12 + h01(j + n * 3) * 40, 1.5 + u * 4, Math.PI, 0);
    ctx.stroke();
  }
  // Rock-candy spires standing in the lake.
  const span = 230;
  for (let i = -1; i < Math.ceil(width / span) + 2; i++) {
    const si = i + Math.floor(offL / span);
    if (h01(si * 3 + 1) < 0.3) continue;
    const x = snap(i * span - wrap(offL, span) + h01(si) * 120);
    const mh = 26 + Math.round(h01(si * 5) * 2) * 12;
    blit(ctx, rockChunksPic(70, mh, ((si % 4) + 4) % 4), snap(x - 35 - M), snap(lk + 26 - mh - M), { alpha: 0.7 });
  }
  // The near crater walls at either end, rising up out of view.
  const kw = 0.5;
  for (const side of [-1, 1]) {
    const ex = sx(cam, width, side < 0 ? 140 : mw - 140, kw);
    if ((side < 0 && ex < -40) || (side > 0 && ex > width + 40)) continue;
    const foot = layerY(0, kw) + 10;
    const lip = (y) => ex - side * (Math.max(0, foot - y) * 0.18 + Math.sin(y * 0.05) * 6);
    const far = side < 0 ? -40 : width + 40;
    ctx.fillStyle = mix(SW.chocSh, air, 0.2);
    ctx.beginPath();
    ctx.moveTo(far, foot);
    for (let y = foot; y >= -20; y -= 10) ctx.lineTo(lip(y), y);
    ctx.lineTo(far, -20);
    ctx.fill();
    ctx.fillStyle = mix(SW.choc, air, 0.2);
    for (let y = foot - 40; y > -20; y -= 46) ctx.fillRect(Math.min(far, lip(y)), y, Math.abs(far - lip(y)), 6);
    ctx.strokeStyle = mix(SW.frost, air, 0.15);
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let y = foot; y >= -20; y -= 10) ctx.lineTo(lip(y), y);
    ctx.stroke();
    ctx.fillStyle = mix(SW.frost, air, 0.15);
    for (let y = foot - 30, i = 0; y > 0; y -= 37, i++) {
      const lx = lip(y);
      const d = 6 + (i % 3) * 5;
      ctx.beginPath();
      ctx.ellipse(lx + side * -2, y + d / 2, 3, d / 2 + 2, 0, 0, TAU);
      ctx.fill();
    }
  }
}
